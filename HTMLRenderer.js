'use strict';

const Renderer  = require('./Renderer');
const render    = require('./render');
const fs        = require('fs-extra-promise');
const co        = require('co');
const url       = require('url');
const path      = require('path');
const util      = require('util');
const matter    = require('gray-matter');
const mahabhuta = require('mahabhuta');
const filez     = require('./filez');
const cache     = require('./caching');
const akasha    = require('./index');
const globfs    = require('globfs');

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
        if (metadata.config.cheerio) mahabhuta.config(metadata.config.cheerio);
        return mahabhuta.processAsync(rendered, metadata, mahafuncs);
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
        // console.log('renderForLayout '+ util.inspect(metadata));
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

            var thisRenderer = this;

            log(`renderForLayout find ${util.inspect(config.layoutDirs)} ${metadata.layout}`);
            return co(function* () {
                var foundDir = yield globfs.findAsync(config.layoutDirs, metadata.layout);
                if (!foundDir) throw new Error(`No layout directory found in ${util.inspect(config.layoutDirs)} ${metadata.layout} in file ${metadata.document.path}`);
                foundDir = foundDir[0];
                if (!foundDir) throw new Error(`No layout directory found in ${util.inspect(config.layoutDirs)} ${metadata.layout} in file ${metadata.document.path}`);
                var layoutFname = path.join(foundDir.basedir, foundDir.path);
                var layout = yield fs.readFileAsync(layoutFname, 'utf8');
                layouttext = layout;
                var fm = matter(layout);
                layoutcontent = fm.content;
                layoutdata    = thisRenderer.copyMetadataProperties(metadata, fm.data);
                layoutdata.content = rendered;
                // if (!fm.data.layout) layoutdata.layout = undefined;
                const renderer = render.findRendererPath(metadata.layout);
                /* if (!renderer && metadata.layout.match(/\.html$/) != null) {
                    return filez.readFile(partialDir, partial);
                } */
                if (!renderer) throw new Error(`No renderer for ${metadata.layout}`);
                log(`renderForLayout rendering ${metadocpath} with ${metadata.layout}`);
                // console.log(`HTMLRenderer before render plugin=${util.inspect(metadata.plugin)}`);
                try {
                    layoutrendered = yield renderer.render(layoutcontent, layoutdata);
                } catch (e) {
                    let ee = new Error(`Error rendering ${metadocpath} with ${metadata.layout} ${e.stack ? e.stack : e}`);
                    console.error(ee);
                    throw ee;
                }
                // log('maharun '+ metadata.layout +' '+ util.inspect(layoutdata.config.headerScripts));
                log(`renderForLayout maharun ${metadocpath} with ${metadata.layout}`);
                if (thisRenderer.doMahabhuta(metadocpath)) {
                    try {
                        layoutrendered = yield thisRenderer.maharun(layoutrendered, layoutdata, config.mahafuncs);
                    } catch (e2) {
                        let eee = new Error(`Error with Mahabhuta ${metadocpath} with ${metadata.layout} ${e2.stack ? e2.stack : e2}`);
                        console.error(eee);
                        throw eee;
                    }
                } else {
                    // console.log(`renderForLayout mahabhuta not allowed ${layoutrendered}`);
                }
                log(`renderForLayout FINI ${metadocpath} with ${metadata.layout}`);
                return layoutrendered;
            });
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

        var thisRenderer = this;

        return co(function* () {
            var fm = yield thisRenderer.frontmatter(basedir, fpath);
            doccontent = fm.content;
            var metadata = yield thisRenderer.initMetadata(config, basedir, fpath, renderToPlus, metadata, fm.data);
            docdata = metadata;
            log('about to render '+ fpath);
            // log(`metadata before render ${util.inspect(docdata)}`);
            try {
                docrendered = yield thisRenderer.render(doccontent, docdata);
            } catch (err) {
                console.error("Error rendering "+ fpath +" "+ (err.stack ? err.stack : err));
                throw new Error("Error rendering "+ fpath +" "+ (err.stack ? err.stack : err));
            }
            log('rendered to maharun '+ fpath);
            if (thisRenderer.doMahabhuta(fpath)) {
                try {
                    docrendered = yield thisRenderer.maharun(docrendered, docdata, config.mahafuncs);
                } catch (err2) {
                    console.error("Error in Mahabhuta for "+ fpath +" "+ (err2.stack ? err2.stack : err2));
                    throw new Error("Error in Mahabhuta for "+ fpath +" "+ (err2.stack ? err2.stack : err2));
                }
            }
            log('maharun to renderForLayout '+ fpath);
            docrendered = yield thisRenderer.renderForLayout(docrendered, docdata, config);
            log(`renderToFile ${basedir} ${fpath} ==> ${renderTo} ${thisRenderer.filePath(fpath)}`);
            return yield filez.writeFile(renderTo, thisRenderer.filePath(fpath), docrendered);
        });
    }

    /**
     * Determine whether it's allowed to run Mahabhuta.  Some rendering types
     * cannot allow Mahabhuta to run.  Renderers should override this
     * function if necessary.
     */
    doMahabhuta(fpath) {
        return true;
    }

    /**
     * Extract the frontmatter for the given file.
     */
    frontmatter(basedir, fpath) {
        var cachekey = `fm-${basedir}-${fpath}`;
        var cachedFrontmatter = cache.get("htmlrenderer", cachekey);
        return co(function* () {
            if (cachedFrontmatter) {
                // TODO
                // Add check here that stat's file, if file is newer
                // than the cache'd version then delete the cach entry
                // and proceed to the rest of the function, otherwise
                // return the cached data
                return cachedFrontmatter;
            }
            var text = yield fs.readFileAsync(path.join(basedir, fpath), 'utf8')
            var fm = matter(text);
            cache.set("htmlrenderer", cachekey, fm);
            // log(`frontmatter ${cachekey} ${util.inspect(fm)}`);
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
        var thisRenderer = this;
        return co(function* () {
            var fm = yield thisRenderer.frontmatter(basedir, fpath);
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
            var fmmcount = 0;
            for (var yprop in fmMetadata) {
                metadata[yprop] = fmMetadata[yprop];
                fmmcount++;
            }
            if (fmmcount <= 0) console.error('WARNING: No metadata discovered in '+ basedir +' '+ fpath);

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
