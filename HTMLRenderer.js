/**
 *
 * Copyright 2014-2019 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

 'use strict';

const Renderer  = require('./Renderer');
// const render    = require('./render');
const fs        = require('fs-extra');
const url       = require('url');
const path      = require('path');
const util      = require('util');
const matter    = require('gray-matter');
const mahabhuta = require('mahabhuta');
const globfs    = require('globfs');
const data = require('./data');

const cache = import('./cache/cache-forerunner.mjs');
const filecache = import('./cache/file-cache.mjs');

/**
 * Rendering support for any file that produces HTML when rendered.
 */
module.exports = class HTMLRenderer extends Renderer {

    /**
     * Support for Mahabhuta -- jQuery-like processing of HTML DOM before Rendering
     * down to HTML text.
     */
    maharun(rendered, metadata, mahafuncs) {
        if (typeof rendered === 'undefined' || rendered === null) {
            throw new Error('no rendered provided');
        }
        if (typeof metadata === 'undefined' || metadata === null) {
            throw new Error('no metadata provided');
        }
        if (typeof mahabhuta === 'undefined' || mahabhuta === null) {
            throw new Error('no mahabhuta provided');
        }
        
        if (metadata.config.mahabhutaConfig) mahabhuta.config(metadata.config.mahabhutaConfig);
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
    async renderForLayoutNew(rendered, metadata, config) {
        // console.log('renderForLayout '+ util.inspect(metadata));
        if (metadata.layout) {
            // find layout
            // read layout
            // split out frontmatter & content
            // find renderer
            // renderer.render
            // mahabhuta

            // const layoutStart = new Date();

            var fnLayout;
            var layouttext;
            var layoutcontent;
            var layoutdata;
            var layoutrendered;
            var metadocpath = metadata.document ? metadata.document.path : "unknown";

            const layouts = (await filecache).layouts;
            await layouts.isReady();

            let found = await layouts.find(metadata.layout);
            if (!found) {
                throw new Error(`No layout found in ${util.inspect(config.layoutDirs)} for ${metadata.layout} in file ${metadata.document.path}`);
            }

            let layout = await fs.readFile(found.fspath, 'utf8');
            layouttext = layout;
            var fm = matter(layout);
            layoutcontent = fm.content;
            layoutdata    = this.copyMetadataProperties(metadata, fm.data);
            layoutdata.content = rendered;
            const renderer = config.findRendererPath(metadata.layout);
            if (!renderer) {
                throw new Error(`No renderer for ${metadata.layout}`);
            }
            try {
                layoutrendered = await renderer.render(layoutcontent, layoutdata);
            } catch (e) {
                let ee = new Error(`Error rendering ${metadocpath} with ${metadata.layout} ${e.stack ? e.stack : e}`);
                console.error(ee);
                throw ee;
            }
            return layoutrendered;

            /* 
            // console.log(`renderForLayout find ${util.inspect(config.layoutDirs)} ${metadata.layout}`);
            var foundDir = await globfs.findAsync(config.layoutDirs, metadata.layout);
            if (!foundDir) throw new Error(`No layout directory found in ${util.inspect(config.layoutDirs)} ${metadata.layout} in file ${metadata.document.path}`);
            foundDir = foundDir[0];
            if (!foundDir) throw new Error(`No layout directory found in ${util.inspect(config.layoutDirs)} ${metadata.layout} in file ${metadata.document.path}`);
            var layoutFname = path.join(foundDir.basedir, foundDir.path);
            var layout = await fs.readFile(layoutFname, 'utf8');
            layouttext = layout;
            var fm = matter(layout);
            layoutcontent = fm.content;
            layoutdata    = this.copyMetadataProperties(metadata, fm.data);
            layoutdata.content = rendered;
            // if (!fm.data.layout) layoutdata.layout = undefined;
            const renderer = config.findRendererPath(metadata.layout);
            /* if (!renderer && metadata.layout.match(/\.html$/) != null) {
                return filez.readFile(partialDir, partial);
            } * /
            if (!renderer) throw new Error(`No renderer for ${metadata.layout}`);
            // log(`renderForLayout rendering ${metadocpath} with ${metadata.layout}`);
            // console.log(`HTMLRenderer before render plugin=${util.inspect(metadata.plugin)}`);
            // const layoutPrepared = new Date();
            // console.log(`renderForLayout PREPARED ${metadocpath} ${layoutFname} ${(layoutPrepared - layoutStart) / 1000} seconds`);
            try {
                layoutrendered = await renderer.render(layoutcontent, layoutdata);
            } catch (e) {
                let ee = new Error(`Error rendering ${metadocpath} with ${metadata.layout} ${e.stack ? e.stack : e}`);
                console.error(ee);
                throw ee;
            }
            // const layoutFirstRender = new Date();
            // console.log(`renderForLayout FIRST RENDER ${metadocpath} ${layoutFname} ${(layoutFirstRender - layoutStart) / 1000} seconds`);
            // log('maharun '+ metadata.layout +' '+ util.inspect(layoutdata.config.headerScripts));
            // log(`renderForLayout maharun ${metadocpath} with ${metadata.layout}`);
            if (false && this.doMahabhuta(metadocpath)) {
                try {
                    layoutrendered = await this.maharun(layoutrendered, layoutdata, config.mahafuncs);
                } catch (e2) {
                    let eee = new Error(`Error with Mahabhuta ${metadocpath} with ${metadata.layout} ${e2.stack ? e2.stack : e2}`);
                    console.error(eee);
                    throw eee;
                }
            } else {
                // console.log(`renderForLayout mahabhuta not allowed ${layoutrendered}`);
            }
            // const layoutFinishMahabhuta = new Date();
            // console.log(`renderForLayout FINISH MAHABHUTA ${metadocpath} ${layoutFname} ${(layoutFinishMahabhuta - layoutStart) / 1000} seconds`);
            // log(`renderForLayout FINI ${metadocpath} with ${metadata.layout}`);
            return layoutrendered;
            */
        } else return rendered;
    }

    /**
     * If the document metadata says to render into a template, do so.
     */
    async renderForLayout(rendered, metadata, config) {
        // console.log('renderForLayout '+ util.inspect(metadata));
        if (metadata.layout) {
            // find layout
            // read layout
            // split out frontmatter & content
            // find renderer
            // renderer.render
            // mahabhuta

            // const layoutStart = new Date();

            var fnLayout;
            var layouttext;
            var layoutcontent;
            var layoutdata;
            var layoutrendered;
            var metadocpath = metadata.document ? metadata.document.path : "unknown";

            // console.log(`renderForLayout find ${util.inspect(config.layoutDirs)} ${metadata.layout}`);
            var foundDir = await globfs.findAsync(config.layoutDirs, metadata.layout);
            if (!foundDir) throw new Error(`No layout directory found in ${util.inspect(config.layoutDirs)} ${metadata.layout} in file ${metadata.document.path}`);
            foundDir = foundDir[0];
            if (!foundDir) throw new Error(`No layout directory found in ${util.inspect(config.layoutDirs)} ${metadata.layout} in file ${metadata.document.path}`);
            var layoutFname = path.join(foundDir.basedir, foundDir.path);
            var layout = await fs.readFile(layoutFname, 'utf8');
            layouttext = layout;
            var fm = matter(layout);
            layoutcontent = fm.content;
            layoutdata    = this.copyMetadataProperties(metadata, fm.data);
            layoutdata.content = rendered;
            // if (!fm.data.layout) layoutdata.layout = undefined;
            const renderer = config.findRendererPath(metadata.layout);
            /* if (!renderer && metadata.layout.match(/\.html$/) != null) {
                return filez.readFile(partialDir, partial);
            } */
            if (!renderer) throw new Error(`No renderer for ${metadata.layout}`);
            // log(`renderForLayout rendering ${metadocpath} with ${metadata.layout}`);
            // console.log(`HTMLRenderer before render plugin=${util.inspect(metadata.plugin)}`);
            // const layoutPrepared = new Date();
            // console.log(`renderForLayout PREPARED ${metadocpath} ${layoutFname} ${(layoutPrepared - layoutStart) / 1000} seconds`);
            try {
                layoutrendered = await renderer.render(layoutcontent, layoutdata);
            } catch (e) {
                let ee = new Error(`Error rendering ${metadocpath} with ${metadata.layout} ${e.stack ? e.stack : e}`);
                console.error(ee);
                throw ee;
            }
            // const layoutFirstRender = new Date();
            // console.log(`renderForLayout FIRST RENDER ${metadocpath} ${layoutFname} ${(layoutFirstRender - layoutStart) / 1000} seconds`);
            // log('maharun '+ metadata.layout +' '+ util.inspect(layoutdata.config.headerScripts));
            // log(`renderForLayout maharun ${metadocpath} with ${metadata.layout}`);
            if (this.doMahabhuta(metadocpath)) {
                try {
                    layoutrendered = await this.maharun(layoutrendered, layoutdata, config.mahafuncs);
                } catch (e2) {
                    let eee = new Error(`Error with Mahabhuta ${metadocpath} with ${metadata.layout} ${e2.stack ? e2.stack : e2}`);
                    console.error(eee);
                    throw eee;
                }
            } else {
                // console.log(`renderForLayout mahabhuta not allowed ${layoutrendered}`);
            }
            // const layoutFinishMahabhuta = new Date();
            // console.log(`renderForLayout FINISH MAHABHUTA ${metadocpath} ${layoutFname} ${(layoutFinishMahabhuta - layoutStart) / 1000} seconds`);
            // log(`renderForLayout FINI ${metadocpath} with ${metadata.layout}`);
            return layoutrendered;
        } else return rendered;
    }

    async newRenderToFile(config, docInfo) {

        const renderStart = new Date();
        const doc = await this.readContent(docInfo.sourcePath, docInfo.pathInSource);
        const fm = this.parseFrontmatter(doc);
        const doccontent = fm.content;
        data.report(docInfo.mountPoint, docInfo.path, config.renderTo, 
                            "FRONTMATTER", renderStart);

        const metadata = await this.newInitMetadata(config, docInfo);
        const docdata = metadata;
        let docrendered;
        try {
            docrendered = await this.render(doccontent, docdata);
        } catch (err) {
            console.error(`Error rendering ${docInfo.path} ${(err.stack ? err.stack : err)}`);
            throw new Error(`Error rendering ${docInfo.path} ${(err.stack ? err.stack : err)}`);
        }
        data.report(docInfo.mountPoint, docInfo.path, config.renderTo, 
                            "FIRST RENDER", renderStart);

        docrendered = await this.renderForLayoutNew(docrendered, docdata, config);
        const renderSecondRender = new Date();
        data.report(docInfo.mountPoint, docInfo.path, config.renderTo, 
                            "SECOND RENDER", renderStart);
        if (this.doMahabhuta(docInfo.path)) {
            try {
                docrendered = await this.maharun(docrendered, docdata, config.mahafuncs);
            } catch (e2) {
                let eee = new Error(`Error with Mahabhuta ${docInfo.path} with ${metadata.layout} ${e2.stack ? e2.stack : e2}`);
                console.error(eee);
                throw eee;
            }
        } else {
            // console.log(`renderForLayout mahabhuta not allowed ${layoutrendered}`);
        }
        data.report(docInfo.mountPoint, docInfo.path, config.renderTo, 
                            "MAHABHUTA", renderStart);
        await fs.outputFile(
                path.join(config.renderTo, this.filePath(docInfo.path)),
                docrendered, 'utf8');
    }

    async renderToFile(basedir, fpath, renderTo, renderToPlus, metadata, config) {

        const renderStart = new Date();

        // console.log(`renderToFile ${basedir} ${fpath} ${renderTo} ${renderToPlus} ${util.inspect(metadata)}`);
        // var doctext;
        var doccontent;
        var docdata = metadata;
        var docrendered;

        var fm = await this.frontmatter(basedir, fpath);
        doccontent = fm.content;
        // const renderFrontmatter = new Date();
        // console.log(`renderToFile FRONTMATTER ${basedir} ${fpath} ${renderTo} ${(renderFrontmatter - renderStart) / 1000} seconds`);
        // console.log(`renderToFile ${basedir} ${fpath} ${renderTo} ${renderToPlus} ${doccontent}`);
        data.report(basedir, fpath, renderTo, "FRONTMATTER", renderStart);

        var metadata = await this.initMetadata(config, basedir, fpath, renderToPlus, docdata, fm.data);
        docdata = metadata;
        // console.log('about to render '+ fpath);
        // console.log(`metadata before render ${util.inspect(docdata)}`);
        try {
            docrendered = await this.render(doccontent, docdata);
        } catch (err) {
            console.error("Error rendering "+ fpath +" "+ (err.stack ? err.stack : err));
            throw new Error("Error rendering "+ fpath +" "+ (err.stack ? err.stack : err));
        }
        // const renderFirstRender = new Date();
        // console.log(`renderToFile FIRST RENDER ${basedir} ${fpath} ${renderTo} ${(renderFirstRender - renderStart) / 1000} seconds`);
        data.report(basedir, fpath, renderTo, "FIRST RENDER", renderStart);

        docrendered = await this.renderForLayoutNew(docrendered, docdata, config);
        const renderSecondRender = new Date();
        // console.log(`renderToFile SECOND RENDER ${basedir} ${fpath} ${renderTo} ${(renderSecondRender - renderStart) / 1000} seconds`);
        data.report(basedir, fpath, renderTo, "SECOND RENDER", renderStart);

        // log('maharun '+ metadata.layout +' '+ util.inspect(layoutdata.config.headerScripts));
        // log(`renderForLayout maharun ${metadocpath} with ${metadata.layout}`);
        if (this.doMahabhuta(fpath)) {
            try {
                docrendered = await this.maharun(docrendered, docdata, config.mahafuncs);
            } catch (e2) {
                let eee = new Error(`Error with Mahabhuta ${fpath} with ${metadata.layout} ${e2.stack ? e2.stack : e2}`);
                console.error(eee);
                throw eee;
            }
        } else {
            // console.log(`renderForLayout mahabhuta not allowed ${layoutrendered}`);
        }
        data.report(basedir, fpath, renderTo, "MAHABHUTA", renderStart);
        await fs.outputFile(path.join(renderTo, this.filePath(fpath)), docrendered, 'utf8');
    }

    /**
     * Render the document file, through a template if necessary, producing
     * an output file.
     */
    /*
    async renderToFileOld(basedir, fpath, renderTo, renderToPlus, metadata, config) {

        const renderStart = new Date();

        // console.log(`renderToFile ${basedir} ${fpath} ${renderTo} ${renderToPlus} ${util.inspect(metadata)}`);
        // var doctext;
        var doccontent;
        var docdata = metadata;
        var docrendered;

        var fm = await this.frontmatter(basedir, fpath);
        doccontent = fm.content;
        // const renderFrontmatter = new Date();
        // console.log(`renderToFile FRONTMATTER ${basedir} ${fpath} ${renderTo} ${(renderFrontmatter - renderStart) / 1000} seconds`);
        // console.log(`renderToFile ${basedir} ${fpath} ${renderTo} ${renderToPlus} ${doccontent}`);
        data.report(basedir, fpath, renderTo, "FRONTMATTER", renderStart);

        var metadata = await this.initMetadata(config, basedir, fpath, renderToPlus, docdata, fm.data);
        docdata = metadata;
        // console.log('about to render '+ fpath);
        // console.log(`metadata before render ${util.inspect(docdata)}`);
        try {
            docrendered = await this.render(doccontent, docdata);
        } catch (err) {
            console.error("Error rendering "+ fpath +" "+ (err.stack ? err.stack : err));
            throw new Error("Error rendering "+ fpath +" "+ (err.stack ? err.stack : err));
        }
        // const renderFirstRender = new Date();
        // console.log(`renderToFile FIRST RENDER ${basedir} ${fpath} ${renderTo} ${(renderFirstRender - renderStart) / 1000} seconds`);
        data.report(basedir, fpath, renderTo, "FIRST RENDER", renderStart);
        // console.log('rendered to maharun '+ fpath);
        if (this.doMahabhuta(fpath)) {
            try {
                docrendered = await this.maharun(docrendered, docdata, config.mahafuncs);
            } catch (err2) {
                console.error("Error in Mahabhuta for "+ fpath +" "+ (err2.stack ? err2.stack : err2));
                throw new Error("Error in Mahabhuta for "+ fpath +" "+ (err2.stack ? err2.stack : err2));
            }
        }
        const renderFirstMahabhuta = new Date();
        // console.log(`renderToFile FIRST MAHABHUTA ${basedir} ${fpath} ${renderTo} ${(renderFirstMahabhuta - renderStart) / 1000} seconds`);
        data.report(basedir, fpath, renderTo, "FIRST MAHABHUTA", renderStart);
        // console.log('maharun to renderForLayout '+ fpath);
        docrendered = await this.renderForLayout(docrendered, docdata, config);
        const renderSecondRender = new Date();
        // console.log(`renderToFile SECOND RENDER ${basedir} ${fpath} ${renderTo} ${(renderSecondRender - renderStart) / 1000} seconds`);
        data.report(basedir, fpath, renderTo, "SECOND RENDER", renderStart);
        // console.log(`renderToFile ${basedir} ${fpath} ==> ${renderTo} ${this.filePath(fpath)}`);
        // console.log(docrendered);
        await fs.outputFile(path.join(renderTo, this.filePath(fpath)), docrendered, 'utf8');
        // remove circular dependency
        // await filez.writeFile(renderTo, this.filePath(fpath), docrendered);
    }
    */

    /**
     * Determine whether it's allowed to run Mahabhuta.  Some rendering types
     * cannot allow Mahabhuta to run.  Renderers should override this
     * function if necessary.
     */
    doMahabhuta(fpath) {
        return true;
    }

    async readContent(basedir, fpath) {
        const text = await fs.readFile(path.join(basedir, fpath), 'utf8');
        return text;
    }

    parseFrontmatter(content) {
        return matter(content);
    }

    /**
     * Extract the frontmatter for the given file.
     */
    async frontmatter(basedir, fpath) {
        // console.log(`HTMLRenderer frontmatter ${basedir} ${fpath}`);
        let coll = (await cache).getCache('frontmatter', { create: true });
        let cached = coll.find({
            basedir: { $eq: basedir },
            fpath: { $eq: fpath }
        });
        if (cached && cached.frontmatter) {
            // TODO
            // Add check here that stat's file, if file is newer
            // than the cache'd version then delete the cach entry
            // and proceed to the rest of the function, otherwise
            // return the cached data
            // console.log(`HTMLRenderer frontmatter found cached ${basedir} ${fpath}`);
            return cached.frontmatter;
        }
        const text = await fs.readFile(path.join(basedir, fpath), 'utf8');
        // console.log(`frontmatter ${path.join(basedir, fpath)} ${text}`);
        let fm;
        try {
            fm = matter(text);
            // console.log(`HTMLRenderer frontmatter parsed frontmatter ${basedir} ${fpath}`);
        } catch (e) {
            console.log(`HTMLRenderer.frontmatter FAIL to read frontmatter in ${fpath} because ${e.stack}`);
            fm = {};
        }
        // console.log(`frontmatter ${path.join(basedir, fpath)} ${util.inspect(fm)}`);
        coll.insert({
            basedir, fpath, frontmatter: fm
        });
        await coll.save();
        // console.log(`HTMLRenderer frontmatter FINI ${basedir} ${fpath}`);
        return fm;
    }

    /**
     * Extract the metadata from the given file.  Where the `frontmatter` function
     * returns an object that contains the metadata, this function returns only
     * the metadata object.
     *
     * This metadata is solely the data stored in the file.
     */
    async metadata(basedir, fpath) {
        var fm = await this.frontmatter(basedir, fpath);
        return fm.data;
    }

    async newInitMetadata(config, docInfo) {

        const renderer = this;
        // Start with a base object that will be passed into the template
        var metadata = { };

        // Copy data from frontmatter
        for (let yprop in docInfo.baseMetadata) {
            // console.log(`initMetadata ${basedir} ${fpath} baseMetadata ${baseMetadata[yprop]}`);
            metadata[yprop] = docInfo.baseMetadata[yprop];
        }
        for (let yprop in config.metadata) {
            metadata[yprop] = config.metadata[yprop];
        }
        let fmmcount = 0;
        for (let yprop in docInfo.docMetadata) {
            metadata[yprop] = docInfo.docMetadata[yprop];
            fmmcount++;
        }
        if (fmmcount <= 0) {
            console.error(`WARNING: No metadata discovered in ${basedir} ${fpath}`);
        }

        metadata.content = "";
        metadata.document = {};
        metadata.document.basedir = docInfo.mountPoint;
        metadata.document.relpath = docInfo.pathInSource;
        metadata.document.relrender = renderer.filePath(docInfo.pathInSource);
        metadata.document.path = docInfo.path;
        metadata.document.renderTo = docInfo.renderPath;

        metadata.config      = config;
        metadata.partialSync = this.akasha.partialSync.bind(renderer, config);
        metadata.partial     = this.akasha.partial.bind(renderer, config);

        metadata.root_url = config.root_url;

        if (config.root_url) {
            let pRootUrl = url.parse(config.root_url);
            pRootUrl.pathname = path.normalize(
                    path.join(pRootUrl.pathname, metadata.document.renderTo)
            );
            metadata.rendered_url = url.format(pRootUrl);
        } else {
            metadata.rendered_url = metadata.document.renderTo;
        }

        metadata.akasha = this.akasha;
        metadata.plugin = config.plugin;
        metadata.rendered_date = docInfo.stats.mtime;

        if (!metadata.publicationDate) {
            var dateSet = false;
            if (docInfo.docMetadata && docInfo.docMetadata.publDate) {
                const parsed = Date.parse(docInfo.docMetadata.publDate);
                if (! isNaN(parsed)) {
                    metadata.publicationDate = new Date(parsed);
                }
                dateSet = true;
            }
            if (! dateSet && docInfo.stats && docInfo.stats.mtime) {
                metadata.publicationDate = docInfo.stats.mtime;
            }
            if (!metadata.publicationDate) {
                metadata.publicationDate = new Date();
            }
        }

        return metadata;
    }

    /**
     * Initialize the metadata object which is passed around with the Document object.
     * This metadata is formed by adding together the document metadata, potential metadata
     * associated with the document directory, some data about the source file and where it's
     * supposed to be rendered, as well as some useful functions.
     */
    async initMetadata(config, basedir, fpath, renderToPlus, baseMetadata, fmMetadata) {

        // console.log(`initMetadata ${basedir} ${fpath} ${renderToPlus} ${util.inspect(baseMetadata)} ${util.inspect(fmMetadata)}`);
        const renderer = this;

        // Start with a base object that will be passed into the template
        var metadata = { };

        // Copy data from frontmatter
        for (var yprop in baseMetadata) {
            // console.log(`initMetadata ${basedir} ${fpath} baseMetadata ${baseMetadata[yprop]}`);
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
        metadata.document.relpath = fpath;
        metadata.document.relrender = renderer.filePath(fpath);
        metadata.document.path = path.join(renderToPlus, fpath);
        // console.log(`initMetadata ${renderToPlus} ${fpath} ${renderer.filePath(fpath)}`);
        metadata.document.renderTo = path.join(renderToPlus, renderer.filePath(fpath));

        metadata.config      = config;
        metadata.partialSync = this.akasha.partialSync.bind(renderer, config);
        metadata.partial     = this.akasha.partial.bind(renderer, config);

        metadata.root_url = config.root_url;

        if (config.root_url) {
            let pRootUrl = url.parse(config.root_url);
            pRootUrl.pathname = path.normalize(
                    path.join(pRootUrl.pathname, metadata.document.renderTo)
            );
            metadata.rendered_url = url.format(pRootUrl);
        } else {
            metadata.rendered_url = metadata.document.renderTo;
        }

        // console.log('initMetadata '+ basedir +' '+ fpath +' '+ util.inspect(metadata));

        metadata.akasha = this.akasha;
        metadata.plugin = config.plugin;

        // console.log(`HTMLRenderer before path.join ${path.join(basedir, fpath)}`);
        const stats = await fs.stat(path.join(basedir, fpath));
        if (!stats) {
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

        return metadata;
    };

}