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

module.exports = class HTMLRenderer extends Renderer {

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
                log(`renderForLayout rendering ${metadata.document.path} with ${metadata.layout}`);
                return renderer.render(layoutcontent, layoutdata);
            })
            .then(_rendered => {
                layoutrendered = _rendered;
                // log('maharun '+ metadata.layout +' '+ util.inspect(layoutdata.config.headerScripts));
                log(`renderForLayout maharun ${metadata.document.path} with ${metadata.layout}`);
                return this.maharun(layoutrendered, layoutdata, config.mahafuncs);
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
                log(`renderForLayout FINI ${metadata.document.path} with ${metadata.layout}`);
                return layoutrendered;
            })
            .catch(err => { error(err); throw err; });

        } else return Promise.resolve(rendered);
    }

    renderToFile(basedir, fpath, renderTo, metadata, config) {

        // var doctext;
        var doccontent;
        var docdata;
        var docrendered;

        return this.frontmatter(basedir, fpath)
        .then(fm => {
            doccontent = fm.content;
            return this.initMetadata(config, basedir, fpath, fm.data);
        })
        .then(metadata => {
            docdata = metadata;
            log('about to render '+ fpath);
            return this.render(doccontent, docdata);
        })
        .then(rendered => {
            docrendered = rendered;
            log('rendered to maharun '+ fpath);
            return this.maharun(rendered, docdata, config.mahafuncs);
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

    metadata(basedir, fpath) {
        return this.frontmatter(basedir, fpath)
            .then(fm => {
                // log(`metadata for ${basedir} ${fpath} => ${util.inspect(fm)}`);
                return fm.data;
            });
    }

    initMetadata(config, basedir, fpath, fmMetadata) {

        return new Promise((resolve, reject) => {

            // Start with a base object that will be passed into the template
            var metadata = { };

            // Copy data from frontmatter
            for (var yprop in config.metadata) {
                metadata[yprop] = config.metadata[yprop];
            }
            for (var yprop in fmMetadata) {
                metadata[yprop] = fmMetadata[yprop];
            }

            metadata.content = "";
            metadata.document = {};
            metadata.document.basedir = basedir;
            metadata.document.path = fpath;
            metadata.document.renderTo = this.filePath(fpath);

            metadata.config      = config;
            metadata.partialSync = akasha.partialSync.bind(this, config);
            metadata.partial     = akasha.partial.bind(this, config);

            metadata.root_url = config.root_url;

            if (config.root_url) {
                let pRootUrl = url.parse(config.root_url);
                pRootUrl.pathname = metadata.document.path;
                metadata.rendered_url = url.format(pRootUrl);
            } else {
                metadata.rendered_url = metadata.document.path;
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
