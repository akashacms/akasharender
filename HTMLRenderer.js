'use strict';

const Renderer  = require('./Renderer');
const render    = require('./render');
const fs        = require('fs-extra-promise');
const url       = require('url');
const path      = require('path');
const util      = require('util');
const matter    = require('gray-matter');
const mahabhuta = require('mahabhuta');
const filez     = require('./filez');
const cache     = require('./caching');
const akasha    = require('./index');

const log   = require('debug')('akasha:HTMLRenderer');
const error = require('debug')('akasha:error');

/**
 * Rendering support for any file that produces HTML when rendered.
 */
module.exports = class HTMLRenderer extends Renderer {

    /**
     * Support for Mahabhuta -- jQuery-like processing of HTML DOM before Rendering
     * down to HTML text.
     */
    maharun(rendered, metadata, mahafuncs) {
        return new Promise((resolve, reject) => {
            if (metadata.config.cheerio) mahabhuta.config(metadata.config.cheerio);
            mahabhuta.process(rendered, metadata, mahafuncs, (err, rendered) => {
                if (err) reject(err);
                else resolve(rendered);
            });
        });
    }

    copyMetadataProperties(data, frontmatter) {
        for (var prop in frontmatter) {
            if (!(prop in data)) data[prop] = frontmatter[prop];
        }
        return data;
    }

    /**
     * If the document metadata says to render into a template, do so.
     */
    renderForLayout(rendered, metadata, config) {
        if (metadata.layout) {
            // find layout
            // read layout
            // split out frontmatter & content
            // find renderer
            // renderer.render
            // mahabhuta

            var fnLayout;
            var layouttext;
            var layoutcontent;
            var layoutdata;
            var layoutrendered;
            var metadocpath = metadata.document ? metadata.document.path : "unknown";

            log(`renderForLayout find ${util.inspect(config.layoutDirs)} ${metadata.layout}`);
            return filez.find(config.layoutDirs, metadata.layout)
            .then(foundDir => {
                if (!foundDir) throw new Error(`No layout directory found in ${util.inspect(config.layoutDirs)} ${metadata.layout}`);
                return filez.readFile(foundDir, metadata.layout);
            })
            .then(layout => {
                layouttext = layout;
                var fm = matter(layout);
                layoutcontent = fm.content;
                layoutdata    = this.copyMetadataProperties(metadata, fm.data);
                layoutdata.content = rendered;
                // if (!fm.data.layout) layoutdata.layout = undefined;
                const renderer = render.findRendererPath(metadata.layout);
                /* if (!renderer && metadata.layout.match(/\.html$/) != null) {
                    return filez.readFile(partialDir, partial);
                } */
                if (!renderer) throw new Error(`No renderer for ${metadata.layout}`);
                log(`renderForLayout rendering ${metadocpath} with ${metadata.layout}`);
                return renderer.render(layoutcontent, layoutdata);
            })
            .catch(err => {
                console.error(`Error rendering ${metadocpath} with ${metadata.layout} ${err.stack ? err.stack : err}`);
                throw new Error(`Error rendering ${metadocpath} with ${metadata.layout} ${err.stack ? err.stack : err}`);
            })
            .then(_rendered => {
                layoutrendered = _rendered;
                // log('maharun '+ metadata.layout +' '+ util.inspect(layoutdata.config.headerScripts));
                log(`renderForLayout maharun ${metadocpath} with ${metadata.layout}`);
                return this.maharun(layoutrendered, layoutdata, config.mahafuncs);
            })
            .catch(err => {
                console.error(`Error with Mahabhuta ${metadocpath} with ${metadata.layout} ${err.stack ? err.stack : err}`);
                throw new Error(`Error with Mahabhuta ${metadocpath} with ${metadata.layout} ${err.stack ? err.stack : err}`);
            })
            .then(_rendered => {
                layoutrendered = _rendered;
                // POTENTIAL IDEA - to support a chain of layouts
                // At this point, check layoutdata.layout and if set
                //     return renderForLayout(layoutrendered, layoutdata, layoutDirs, partialDirs)
                // otherwise this

                // This did not work, made an infinite loop
                // if (layoutdata.layout) {
                //     return this.renderForLayout(layoutrendered, layoutdata, config)
                //    .then(_rendered => {
                //        return _rendered;
                //    });
                // }
                log(`renderForLayout FINI ${metadocpath} with ${metadata.layout}`);
                return layoutrendered;
            })
            .catch(err => { error(err); throw err; });

        } else return Promise.resolve(rendered);
    }

    /**
     * Render the document file, through a template if necessary, producing
     * an output file.
     */
    renderToFile(basedir, fpath, renderTo, renderToPlus, metadata, config) {

        // var doctext;
        var doccontent;
        var docdata;
        var docrendered;

        return this.frontmatter(basedir, fpath)
        .then(fm => {
            doccontent = fm.content;
            return this.initMetadata(config, basedir, fpath, renderToPlus, metadata, fm.data);
        })
        .then(metadata => {
            docdata = metadata;
            log('about to render '+ fpath);
            return this.render(doccontent, docdata);
        })
        .catch(err => {
            console.error("Error rendering "+ fpath +" "+ (err.stack ? err.stack : err));
            throw new Error("Error rendering "+ fpath +" "+ (err.stack ? err.stack : err));
        })
        .then(rendered => {
            docrendered = rendered;
            log('rendered to maharun '+ fpath);
            return this.maharun(rendered, docdata, config.mahafuncs);
        })
        .catch(err => {
            console.error("Error in Mahabhuta for "+ fpath +" "+ (err.stack ? err.stack : err));
            throw new Error("Error in Mahabhuta for "+ fpath +" "+ (err.stack ? err.stack : err));
        })
        .then(rendered => {
            docrendered = rendered;
            log('maharun to renderForLayout '+ fpath);
            return this.renderForLayout(docrendered, docdata, config);
        })
        .then(rendered => {
            log(`renderToFile ${basedir} ${fpath} ==> ${renderTo} ${this.filePath(fpath)}`);
            return filez.writeFile(renderTo, this.filePath(fpath), rendered);
        });
    }

    /**
     * Extract the frontmatter for the given file.
     */
    frontmatter(basedir, fpath) {
        var cachekey = `fm-${basedir}-${fpath}`;
        var cachedFrontmatter = cache.get("htmlrenderer", cachekey);
        if (cachedFrontmatter) {
            // TODO
            // Add check here that stat's file, if file is newer
            // than the cache'd version then delete the cach entry
            // and proceed to the rest of the function, otherwise
            // return the cached data
            return Promise.resolve(cachedFrontmatter);
        }
        return filez.readFile(basedir, fpath)
        .then(text => {
            var fm = matter(text);
            cache.set("htmlrenderer", cachekey, fm);
            return fm;
        });
    }

    /**
     * Extract the metadata from the given file.  Where the `frontmatter` function
     * returns an object that contains the metadata, this function returns only
     * the metadata object.
     *
     * This metadata is solely the data stored in the file.
     */
    metadata(basedir, fpath) {
        return this.frontmatter(basedir, fpath)
            .then(fm => {
                // log(`metadata for ${basedir} ${fpath} => ${util.inspect(fm)}`);
                return fm.data;
            });
    }

    /**
     * Initialize the metadata object which is passed around with the Document object.
     * This metadata is formed by adding together the document metadata, potential metadata
     * associated with the document directory, some data about the source file and where it's
     * supposed to be rendered, as well as some useful functions.
     */
    initMetadata(config, basedir, fpath, renderToPlus, baseMetadata, fmMetadata) {

        return new Promise((resolve, reject) => {

            // Start with a base object that will be passed into the template
            var metadata = { };

            // Copy data from frontmatter
            for (var yprop in baseMetadata) {
                metadata[yprop] = baseMetadata[yprop];
            }
            for (var yprop in config.metadata) {
                metadata[yprop] = config.metadata[yprop];
            }
            for (var yprop in fmMetadata) {
                metadata[yprop] = fmMetadata[yprop];
            }

            metadata.content = "";
            metadata.document = {};
            metadata.document.basedir = basedir;
            metadata.document.path = path.join(renderToPlus, fpath);
            metadata.document.renderTo = path.join(renderToPlus, this.filePath(fpath));

            metadata.config      = config;
            metadata.partialSync = akasha.partialSync.bind(this, config);
            metadata.partial     = akasha.partial.bind(this, config);

            metadata.root_url = config.root_url;

            if (config.root_url) {
                let pRootUrl = url.parse(config.root_url);
                pRootUrl.pathname = metadata.document.renderTo;
                metadata.rendered_url = url.format(pRootUrl);
            } else {
                metadata.rendered_url = metadata.document.renderTo;
            }

            // console.log('initMetadata '+ basedir +' '+ fpath +' '+ util.inspect(metadata));

            metadata.akasha = akasha;
            metadata.plugin = config.plugin;

            // log('HTMLRenderer before path.join '+util.inspect(path));
            fs.stat(path.join(basedir, fpath), (err, stats) => {
                if (err || !stats) {
                    metadata.rendered_date = new Date();
                } else {
                    metadata.rendered_date = stats.mtime;
                }

                if (!metadata.publicationDate) {
                    var dateSet = false;
                    if (fmMetadata && fmMetadata.publDate) {
                        var parsed = Date.parse(fmMetadata.publDate);
                        if (! isNaN(parsed)) {
                          metadata.publicationDate = new Date(parsed);
                        }
                        dateSet = true;
                    }
                    if (! dateSet && stats && stats.mtime) {
                        metadata.publicationDate = stats.mtime;
                    }
                    if (!metadata.publicationDate) {
                        metadata.publicationDate = new Date();
                    }
                }

                resolve(metadata);
            });
        });
    };

}
