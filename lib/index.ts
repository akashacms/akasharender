/**
 *
 * Copyright 2014-2022 David Herron
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


/**
 * AkashaRender
 * @module akasharender
 */

import util from 'node:util';
import { promises as fsp } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';
// const oembetter = require('oembetter')();
import RSS from 'rss';
import fastq from 'fastq';
import { DirsWatcher, mimedefine } from '@akashacms/stacked-dirs';
import * as Renderers from '@akashacms/renderers';
export * as Renderers from '@akashacms/renderers';
import { Renderer } from '@akashacms/renderers';
export { Renderer } from '@akashacms/renderers';
import * as mahabhuta from 'mahabhuta';
export * as mahabhuta from 'mahabhuta';
import * as cheerio from 'cheerio';
import mahaPartial from 'mahabhuta/maha/partial.js';

import * as relative from 'relative';
export * as relative from 'relative';

import { Plugin } from './Plugin.js';
export { Plugin } from './Plugin.js';

import { render, renderDocument, renderContent } from './render.js';
export { render, renderDocument, renderContent } from './render.js';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

// For use in Configure.prepare
import { BuiltInPlugin } from './built-in.js';

// import * as filecache from './cache/file-cache-lokijs.js';

import * as filecache from './cache/file-cache-sqlite.js';

export { newKeyv } from './sqdb.js';

// There doesn't seem to be an official MIME type registered
// for AsciiDoctor
// per: https://asciidoctor.org/docs/faq/
// per: https://github.com/asciidoctor/asciidoctor/issues/2502
//
// As of November 6, 2022, the AsciiDoctor FAQ said they are
// in the process of registering a MIME type for `text/asciidoc`.
// The MIME type we supply has been updated.
//
// This also seems to be true for the other file types.  We've made up
// some MIME types to go with each.
//
// The MIME package had previously been installed with AkashaRender.
// But, it seems to not be used, and instead we compute the MIME type
// for files in Stacked Directories.
//
// The required task is to register some MIME types with the
// MIME package.  It isn't appropriate to do this in
// the Stacked Directories package.  Instead that's left
// for code which uses Stacked Directories to determine which
// (if any) added MIME types are required.  Ergo, AkashaRender
// needs to register the MIME types it is interested in.
// That's what is happening here.
//
// There's a thought that this should be handled in the Renderer
// implementations.  But it's not certain that's correct.
//
// Now that the Renderers are in `@akashacms/renderers` should
// these definitions move to that package?

mimedefine({'text/asciidoc': [ 'adoc', 'asciidoc' ]});
mimedefine({'text/x-markdoc': [ 'markdoc' ]});
mimedefine({'text/x-ejs': [ 'ejs']});
mimedefine({'text/x-nunjucks': [ 'njk' ]});
mimedefine({'text/x-handlebars': [ 'handlebars' ]});
mimedefine({'text/x-liquid': [ 'liquid' ]});
mimedefine({'text/x-tempura': [ 'tempura' ]});

/**
 * Performs setup of things so that AkashaRender can function.
 * The correct initialization of AkashaRender is to
 * 1. Generate the Configuration object
 * 2. Call config.prepare
 * 3. Call akasharender.setup
 * 
 * This function ensures all objects that initialize asynchronously
 * are correctly setup.
 * 
 * @param {*} config 
 */
export async function setup(config) {

    config.renderers.partialFunc = (fname, metadata) => {
        // console.log(`calling partial ${fname}`);
        return partial(config, fname, metadata);
    };
    config.renderers.partialSyncFunc = (fname, metadata) => {
        // console.log(`calling partialSync ${fname}`);
        return partialSync(config, fname, metadata);
    }

    await cacheSetup(config);
    await fileCachesReady(config);
}

export async function cacheSetup(config) {
    try {
        await filecache.setup(config);
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE CACHE `, err);
        process.exit(1);
    }
}

export async function closeCaches() {
    try {
        await filecache.closeFileCaches();
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT CLOSE CACHES `, err);
        process.exit(1);
    }
}

export async function fileCachesReady(config) {
    try {
        await Promise.all([
            filecache.documentsCache.isReady(),
            filecache.assetsCache.isReady(),
            filecache.layoutsCache.isReady(),
            filecache.partialsCache.isReady()
        ]);
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE CACHE SYSTEM `, err);
        process.exit(1);
    }
}

export async function renderPath(config, path2r) {
    const documents = filecache.documentsCache;
    let found;
    let count = 0;
    while (count < 20) {
        /* What's happening is this might be called from cli.js
         * in render-document, and we might be asked to render the
         * last document that will be ADD'd to the FileCache.
         *
         * In such a case <code>isReady</code> might return <code>true</code>
         * but not all files will have been ADD'd to the FileCache.
         * In that case <code>documents.find</code> returns
         * <code>undefined</code>
         *
         * What this does is try up to 20 times to load the document,
         * sleeping for 100 milliseconds each time.
         *
         * The cleaner alternative would be to wait for not only
         * the <code>ready</code> from the <code>documents</code> FileCache,
         * but also for all the initial ADD events to be handled.  But
         * that second condition seems difficult to detect reliably.
         */
        found = await documents.find(path2r);
        if (found) break;
        else {
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(undefined);
                }, 100);
            });
            count++;
        }
    }

    // console.log(`renderPath ${path2r}`, found);
    if (!found) {
        throw new Error(`Did not find document for ${path2r}`);
    }
    let result = await renderDocument(config, found);
    return result;
}

/**
 * Reads a file from the rendering directory.  It is primarily to be
 * used in test cases, where we'll run a build then read the individual
 * files to make sure they've rendered correctly.
 * 
 * @param {*} config 
 * @param {*} fpath 
 * @returns 
 */
export async function readRenderedFile(config, fpath) {

    let html = await fsp.readFile(path.join(config.renderDestination, fpath), 'utf8');
    let $ = config.mahabhutaConfig 
            ? cheerio.load(html, config.mahabhutaConfig) 
            : cheerio.load(html);

    return { html, $ };
}

/**
 * Renders a partial template using the supplied metadata.  This version
 * allows for asynchronous execution, and every bit of code it
 * executes is allowed to be async.
 * 
 * @param {*} config AkashaRender Configuration object
 * @param {*} fname Path within the filecache.partials cache
 * @param {*} metadata Object containing metadata
 * @returns Promise that resolves to a string containing the rendered stuff
 */
export async function partial(config, fname, metadata) {

    if (!fname || typeof fname !== 'string') {
        throw new Error(`partial fname not a string ${util.inspect(fname)}`);
    }

    // console.log(`partial ${fname}`);
    const found = await filecache.partialsCache.find(fname);
    if (!found) {
        throw new Error(`No partial found for ${fname} in ${util.inspect(config.partialsDirs)}`);
    }
    // console.log(`partial ${fname} ==> ${found.vpath} ${found.fspath}`);
    
    const renderer = config.findRendererPath(found.vpath);
    if (renderer) {
        // console.log(`partial about to render ${util.inspect(found.vpath)}`);
        let partialText;
        if (found.docBody) partialText = found.docBody;
        else if (found.docContent) partialText = found.docContent;
        else partialText = await fsp.readFile(found.fspath, 'utf8');

        // Some renderers (Nunjuks) require that metadata.config
        // point to the config object.  This block of code
        // duplicates the metadata object, then sets the
        // config field in the duplicate, passing that to the partial.
        let mdata: any = {};
        let prop;

        for (prop in metadata) {
            mdata[prop] = metadata[prop];
        }
        mdata.config = config;
        mdata.partialSync = partialSync.bind(renderer, config);
        mdata.partial     = partial.bind(renderer, config);
        // console.log(`partial-funcs render ${renderer.name} ${found.vpath}`);
        return renderer.render({
            fspath: found.fspath,
            content: partialText,
            metadata: mdata
            // partialText, mdata, found
        });
    } else if (found.vpath.endsWith('.html') || found.vpath.endsWith('.xhtml')) {
        // console.log(`partial reading file ${found.vpath}`);
        return fsp.readFile(found.fspath, 'utf8');
    } else {
        throw new Error(`renderPartial no Renderer found for ${fname} - ${found.vpath}`);
    }
}

/**
 * Renders a partial template using the supplied metadata.  This version
 * allows for synchronous execution, and every bit of code it
 * executes is synchronous functions.
 * 
 * @param {*} config AkashaRender Configuration object
 * @param {*} fname Path within the filecache.partials cache
 * @param {*} metadata Object containing metadata
 * @returns String containing the rendered stuff
 */
export function partialSync(config, fname, metadata) {

    if (!fname || typeof fname !== 'string') {
        throw new Error(`partialSync fname not a string ${util.inspect(fname)}`);
    }

    const found = filecache.partialsCache.findSync(fname);
    if (!found) {
        throw new Error(`No partial found for ${fname} in ${util.inspect(config.partialsDirs)}`);
    }

    var renderer = config.findRendererPath(found.vpath);
    if (renderer) {
        // Some renderers (Nunjuks) require that metadata.config
        // point to the config object.  This block of code
        // duplicates the metadata object, then sets the
        // config field in the duplicate, passing that to the partial.
        let mdata: any = {};
        let prop;

        for (prop in metadata) {
            mdata[prop] = metadata[prop];
        }
        mdata.config = config;
        // In this context, partialSync is directly available
        // as a function that we can directly use.
        // console.log(`partialSync `, partialSync);
        mdata.partialSync = partialSync.bind(renderer, config);
        // for findSync, the "found" object is VPathData which
        // does not have docBody nor docContent.  Therefore we
        // must read this content
        let partialText = fs.readFileSync(found.fspath, 'utf-8');
        // if (found.docBody) partialText = found.docBody;
        // else if (found.docContent) partialText = found.docContent;
        // else partialText = fs.readFileSync(found.fspath, 'utf8');
        
        // console.log(`partial-funcs renderSync ${renderer.name} ${found.vpath}`);
        return renderer.renderSync(<Renderers.RenderingContext>{
            fspath: found.fspath,
            content: partialText,
            metadata: mdata
            // partialText, mdata, found
        });
    } else if (found.vpath.endsWith('.html') || found.vpath.endsWith('.xhtml')) {
        return fs.readFileSync(found.fspath, 'utf8');
    } else {
        throw new Error(`renderPartial no Renderer found for ${fname} - ${found.vpath}`);
    }
}

/**
 * Starting from a virtual path in the documents, searches upwards to
 * the root of the documents file-space, finding files that 
 * render to "index.html".  The "index.html" files are index files,
 * as the name suggests.
 * 
 * @param {*} config 
 * @param {*} fname 
 * @returns 
 */
export async function indexChain(config, fname) {

    // This used to be a full function here, but has moved
    // into the FileCache class.  Requiring a `config` option
    // is for backwards compatibility with the former API.

    const documents = filecache.documentsCache;
    return documents.indexChain(fname);
}


/**
 * Manipulate the rel= attributes on a link returned from Mahabhuta.
 *
 * @params {$link} The link to manipulate
 * @params {attr} The attribute name
 * @params {doattr} Boolean flag whether to set (true) or remove (false) the attribute
 *
 */
export function linkRelSetAttr($link, attr, doattr) {
    let linkrel = $link.attr('rel');
    let rels = linkrel ? linkrel.split(' ') : [];
    let hasattr = rels.indexOf(attr) >= 0;
    if (!hasattr && doattr) {
        rels.unshift(attr);
        $link.attr('rel', rels.join(' '));
    } else if (hasattr && !doattr) {
        rels.splice(rels.indexOf(attr));
        $link.attr('rel', rels.join(' '));
    }
};

///////////////// RSS Feed Generation

export async function generateRSS(config, configrss, feedData, items, renderTo) {

    // Supposedly it's required to use hasOwnProperty
    // http://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object#728694
    //
    // But, in our case that resulted in an empty object

    // console.log('configrss '+ util.inspect(configrss));

    // Construct initial rss object
    var rss = {};
    for (let key in configrss.rss) {
        //if (configrss.hasOwnProperty(key)) {
            rss[key] = configrss.rss[key];
        //}
    }

    // console.log('rss '+ util.inspect(rss));

    // console.log('feedData '+ util.inspect(feedData));

    // Then fill in from feedData
    for (let key in feedData) {
        //if (feedData.hasOwnProperty(key)) {
            rss[key] = feedData[key];
        //}
    }

    // console.log('generateRSS rss '+ util.inspect(rss));

    var rssfeed = new RSS(rss);

    items.forEach(function(item) { rssfeed.item(item); });

    var xml = rssfeed.xml();
    var renderOut = path.join(config.renderDestination, renderTo);

    await fsp.mkdir(path.dirname(renderOut), { recursive: true })
    await fsp.writeFile(renderOut, xml, { encoding: 'utf8' });

};

// For oEmbed, Consider making an external plugin
// https://www.npmjs.com/package/oembed-all
// https://www.npmjs.com/package/embedable
// https://www.npmjs.com/package/media-parser
// https://www.npmjs.com/package/oembetter


/**
 * The AkashaRender project configuration object.  
 * One instantiates a Configuration object, then fills it
 * with settings and plugins.
 * 
 * @see module:Configuration
 */

// const _config_pluginData = Symbol('pluginData');
// const _config_assetsDirs = Symbol('assetsDirs');
// const _config_documentDirs = Symbol('documentDirs');
// const _config_layoutDirs = Symbol('layoutDirs');
// const _config_partialDirs = Symbol('partialDirs');
// const _config_mahafuncs = Symbol('mahafuncs');
// const _config_renderTo = Symbol('renderTo');
// const _config_metadata = Symbol('metadata');
// const _config_root_url = Symbol('root_url');
// const _config_scripts = Symbol('scripts');
// const _config_plugins = Symbol('plugins');
// const _config_cheerio = Symbol('cheerio');
// const _config_configdir = Symbol('configdir');
// const _config_cachedir  = Symbol('cachedir');
// const _config_autoload  = Symbol('autoload');
// const _config_autosave  = Symbol('autosave');
// const _config_concurrency = Symbol('concurrency');
// const _config_renderers = Symbol('renderers');

/**
 * Configuration of an AkashaRender project, including the input directories,
 * output directory, plugins, and various settings.
 *
 * USAGE:
 *
 * const akasha = require('akasharender');
 * const config = new akasha.Configuration();
 */
export class Configuration {
    #renderers: Renderers.Configuration;
    #autoload: boolean;
    #autosave: boolean;
    #configdir: string;
    #cachedir: string;
    #assetsDirs;
    #layoutDirs;
    #documentDirs;
    #partialDirs;
    #mahafuncs;
    #cheerio;
    #renderTo: string;
    #scripts;
    #concurrency: number;
    #metadata: any;
    #root_url: string;
    #plugins;
    #pluginData;
    
    constructor(modulepath) {

        // this[_config_renderers] = [];
        this.#renderers = new Renderers.Configuration({
            
        });

        this.#autoload = false;
        this.#autosave = false;

        this.#mahafuncs = [];
        this.#scripts = {
            stylesheets: [],
            javaScriptTop: [],
            javaScriptBottom: []
        };

        this.#concurrency = 3;

        this.#documentDirs = [];
        this.#layoutDirs = [];
        this.#partialDirs = [];
        this.#assetsDirs = [];

        this.#mahafuncs = [];

        this.#renderTo = 'out';

        this.#metadata = {} as any;

        this.#plugins = [];
        this.#pluginData = [];

        /*
         * Is this the best place for this?  It is necessary to
         * call this function somewhere.  The nature of this function
         * is that it can be called multiple times with no impact.  
         * By being located here, it will always be called by the
         * time any Configuration is generated.
         */
        // This is executed in @akashacms/renderers
        // this[_config_renderers].registerBuiltInRenderers();

        // Provide a mechanism to easily specify configDir
        // The path in configDir must be the path of the configuration file.
        // There doesn't appear to be a way to determine that from here.
        //
        // For example module.parent.filename in this case points
        // to akasharender/index.js because that's the module which
        // loaded this module.
        //
        // One could imagine a different initialization pattern.  Instead
        // of akasharender requiring Configuration.js, that file could be
        // required by the configuration file.  In such a case
        // module.parent.filename WOULD indicate the filename for the
        // configuration file, and would be a source of setting
        // the configDir value.
        if (typeof modulepath !== 'undefined' && modulepath !== null) {
            this.configDir = path.dirname(modulepath);
        }

        // Very carefully add the <partial> support from Mahabhuta as the
        // very first thing so that it executes before anything else.
        let config = this;
        this.addMahabhuta(mahaPartial.mahabhutaArray({
            renderPartial: function(fname, metadata) {
                return partial(config, fname, metadata);
            }
        }));
    }


    /**
     * Initialize default configuration values for anything which has not
     * already been configured.  Some built-in defaults have been decided
     * ahead of time.  For each configuration setting, if nothing has been
     * declared, then the default is substituted.
     *
     * It is expected this function will be called last in the config file.
     *
     * This function installs the `built-in` plugin.  It needs to be last on
     * the plugin chain so that its stylesheets and partials and whatnot
     * can be overridden by other plugins.
     *
     * @returns {Configuration}
     */
    prepare() {

        const CONFIG = this;

        const configDirPath = function(dirnm) {
            let configPath = dirnm;
            if (typeof CONFIG.configDir !== 'undefined' && CONFIG.configDir != null) {
                configPath = path.join(CONFIG.configDir, dirnm);
            }
            return configPath;
        }

        let stat;

        const cacheDirsPath = configDirPath('cache');
        if (!this.#cachedir) {
            if (fs.existsSync(cacheDirsPath)
             && (stat = fs.statSync(cacheDirsPath))) {
                if (stat.isDirectory()) {
                    this.cacheDir = 'cache';
                } else {
                    throw new Error("'cache' is not a directory");
                }
            } else {
                fs.mkdirSync(cacheDirsPath, { recursive: true });
                this.cacheDir = 'cache';
            }
        } else if (this.#cachedir && !fs.existsSync(this.#cachedir)) {
            fs.mkdirSync(this.#cachedir, { recursive: true });
        }

        const assetsDirsPath = configDirPath('assets');
        if (!this.#assetsDirs) {
            if (fs.existsSync(assetsDirsPath) && (stat = fs.statSync(assetsDirsPath))) {
                if (stat.isDirectory()) {
                    this.addAssetsDir('assets');
                }
            }
        }

        const layoutsDirsPath = configDirPath('layouts');
        if (!this.#layoutDirs) {
            if (fs.existsSync(layoutsDirsPath) && (stat = fs.statSync(layoutsDirsPath))) {
                if (stat.isDirectory()) {
                    this.addLayoutsDir('layouts');
                }
            }
        }

        const partialDirsPath = configDirPath('partials');
        if (!mahaPartial.configuration.partialDirs) {
            if (fs.existsSync(partialDirsPath) && (stat = fs.statSync(partialDirsPath))) {
                if (stat.isDirectory()) {
                    this.addPartialsDir('partials');
                }
            }
        }

        const documentDirsPath = configDirPath('documents');
        if (!this.#documentDirs) {
            if (fs.existsSync(documentDirsPath) && (stat = fs.statSync(documentDirsPath))) {
                if (stat.isDirectory()) {
                    this.addDocumentsDir('documents');
                } else {
                    throw new Error("'documents' is not a directory");
                }
            } else {
                throw new Error("No 'documentDirs' setting, and no 'documents' directory");
            }
        }

        const renderToPath = configDirPath('out');
        if (!this.#renderTo)  {
            if (fs.existsSync(renderToPath)
             && (stat = fs.statSync(renderToPath))) {
                if (stat.isDirectory()) {
                    this.setRenderDestination('out');
                } else {
                    throw new Error("'out' is not a directory");
                }
            } else {
                fs.mkdirSync(renderToPath, { recursive: true });
                this.setRenderDestination('out');
            }
        } else if (this.#renderTo && !fs.existsSync(this.#renderTo)) {
            fs.mkdirSync(this.#renderTo, { recursive: true });
        }

        // The akashacms-builtin plugin needs to be last on the chain so that
        // its partials etc can be easily overridden.  This is the most convenient
        // place to declare that plugin.
        //

        // Normally we'd do require('./built-in.js').
        // But, in this context that doesn't work.
        // What we did is to import the
        // BuiltInPlugin class earlier so that
        // it can be used here.
        this.use(BuiltInPlugin, {
            // built-in options if any
            // Do not need this here any longer because it is handled
            // in the constructor.
            // Set up the Mahabhuta partial tag so it renders through AkashaRender
            // renderPartial: function(fname, metadata) {
            //     return render.partial(config, fname, metadata);
            // }
        });

        return this;
    }

    /**
     * Record the configuration directory so that we can correctly interpolate
     * the pathnames we're provided.
     */
    set configDir(cfgdir) { this.#configdir = cfgdir; }
    get configDir() { return this.#configdir; }

    set cacheDir(dirnm) { this.#cachedir = dirnm; }
    get cacheDir() { return this.#cachedir; }

    get cacheAutosave() { return this.#autosave; }
    set cacheAutosave(auto) { this.#autosave = auto; }

    get cacheAutoload() { return this.#autoload; }
    set cacheAutoload(auto) { this.#autoload = auto; }

    // set akasha(_akasha)  { this[_config_akasha] = _akasha; }
    get akasha() { return module_exports; }

    async documentsCache() { return filecache.documentsCache; }
    async assetsCache()    { return filecache.assetsCache; }
    async layoutsCache()   { return filecache.layoutsCache; }
    async partialsCache()  { return filecache.partialsCache; }

    /**
     * Add a directory to the documentDirs configuration array
     * @param {string} dir The pathname to use
     */
    addDocumentsDir(dir) {
        // If we have a configDir, and it's a relative directory, make it
        // relative to the configDir
        if (this.configDir != null) {
            if (typeof dir === 'string' && !path.isAbsolute(dir)) {
                dir = path.join(this.configDir, dir);
            } else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        this.#documentDirs.push(dir);
        // console.log(`addDocumentsDir ${util.inspect(dir)} ==> ${util.inspect(this[_config_documentDirs])}`);
        return this;
    }

    get documentDirs() {
        return this.#documentDirs;
    }

    /**
     * Look up the document directory information for a given document directory.
     * @param {string} dirname The document directory to search for
     */
    documentDirInfo(dirname) {
        for (var docDir of this.documentDirs) {
            if (typeof docDir === 'object') {
                if (docDir.src === dirname) {
                    return docDir;
                }
            } else if (docDir === dirname) {
                return docDir;
            }
        }
    }

    /**
     * Add a directory to the layoutDirs configurtion array
     * @param {string} dir The pathname to use
     */
    addLayoutsDir(dir) {
        // If we have a configDir, and it's a relative directory, make it
        // relative to the configDir
        if (this.configDir != null) {
            if (typeof dir === 'string' && !path.isAbsolute(dir)) {
                dir = path.join(this.configDir, dir);
            } else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        this.#layoutDirs.push(dir);
        this.#renderers.addLayoutDir(dir.src ? dir.src : dir);
        // console.log(`AkashaRender Configuration addLayoutsDir ${util.inspect(dir)} layoutDirs ${util.inspect(this.#layoutDirs)} Renderers layoutDirs ${util.inspect(this.#renderers.layoutDirs)}`);
        return this;
    }

    get layoutDirs() { return this.#layoutDirs; }

    /**
     * Add a directory to the partialDirs configurtion array
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    addPartialsDir(dir) {
        // If we have a configDir, and it's a relative directory, make it
        // relative to the configDir
        if (this.configDir != null) {
            if (typeof dir === 'string' && !path.isAbsolute(dir)) {
                dir = path.join(this.configDir, dir);
            } else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        // console.log(`addPartialsDir `, dir);
        this.#partialDirs.push(dir);
        this.#renderers.addPartialDir(dir.src ? dir.src : dir);
        return this;
    }

    get partialsDirs() { return this.#partialDirs; }
    
    /**
     * Add a directory to the assetDirs configurtion array
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    addAssetsDir(dir) {
        // If we have a configDir, and it's a relative directory, make it
        // relative to the configDir
        if (this.configDir != null) {
            if (typeof dir === 'string' && !path.isAbsolute(dir)) {
                dir = path.join(this.configDir, dir);
            } else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        this.#assetsDirs.push(dir);
        return this;
    }

    get assetDirs() { return this.#assetsDirs; }

    /**
     * Add an array of Mahabhuta functions
     * @param {Array} mahafuncs
     * @returns {Configuration}
     */
    addMahabhuta(mahafuncs) {
        if (typeof mahafuncs === 'undefined' || !mahafuncs) {
            throw new Error(`undefined mahafuncs in ${this.configDir}`);
        }
        this.#mahafuncs.push(mahafuncs);
        return this;
    }

    get mahafuncs() { return this.#mahafuncs; }

    /**
     * Define the directory into which the project is rendered.
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    setRenderDestination(dir) {
        // If we have a configDir, and it's a relative directory, make it
        // relative to the configDir
        if (this.configDir != null) {
            if (typeof dir === 'string' && !path.isAbsolute(dir)) {
                dir = path.join(this.configDir, dir);
            }
        }
        this.#renderTo = dir;
        return this;
    }

    /** Fetch the declared destination for rendering the project. */
    get renderDestination() { return this.#renderTo; }
    get renderTo() { return this.#renderTo; }

    /**
     * Add a value to the project metadata.  The metadata is combined with
     * the document metadata and used during rendering.
     * @param {string} index The key to store the value.
     * @param value The value to store in the metadata.
     * @returns {Configuration}
     */
    addMetadata(index, value) {
        var md = this.#metadata;
        md[index] = value;
        return this;
    }

    get metadata() { return this.#metadata; }

    /**
    * Document the URL for a website project.
    * @param {string} root_url
    * @returns {Configuration}
    */
    rootURL(root_url) {
        this.#root_url = root_url;
        return this;
    }

    get root_url() { return this.#root_url; }

    /**
     * Set how many documents to render concurrently.
     * @param {number} concurrency
    * @returns {Configuration}
     */
    setConcurrency(concurrency) {
        this.#concurrency = concurrency;
        return this;
    }

    get concurrency() { return this.#concurrency; }

    /**
     * Declare JavaScript to add within the head tag of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addHeaderJavaScript(script) {
        this.#scripts.javaScriptTop.push(script);
        return this;
    }

    get scripts() { return this.#scripts; }

    /**
     * Declare JavaScript to add at the bottom of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addFooterJavaScript(script) {
        this.#scripts.javaScriptBottom.push(script);
        return this;
    }

    /**
     * Declare a CSS Stylesheet to add within the head tag of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addStylesheet(css) {
        this.#scripts.stylesheets.push(css);
        return this;
    }

    setMahabhutaConfig(cheerio) {
        this.#cheerio = cheerio;

        // For cheerio 1.0.0-rc.10 we need to use this setting.
        // If the configuration has set this, we must not
        // override their setting.  But, generally, for correct
        // operation and handling of Mahabhuta tags, we need
        // this setting to be <code>true</code>
        if (!('_useHtmlParser2' in this.#cheerio)) {
            this.#cheerio._useHtmlParser2 = true;
        }

        // console.log(this[_config_cheerio]);
    }

    get mahabhutaConfig() { return this.#cheerio; }

    /**
     * Copy the contents of all directories in assetDirs to the render destination.
     */
    async copyAssets() {
        // console.log('copyAssets START');

        const config = this;
        const assets = filecache.assetsCache;
        // await assets.isReady();
        // Fetch the list of all assets files
        const paths = await assets.paths();

        // The work task is to copy each file
        const queue = fastq.promise(async function(item) {
            try {
                // console.log(`copyAssets ${config.renderTo} ${item.renderPath}`);
                let destFN = path.join(config.renderTo, item.renderPath);
                // Make sure the destination directory exists
                await fsp.mkdir(path.dirname(destFN), { recursive: true });
                // Copy from the absolute pathname, to the computed 
                // location within the destination directory
                // console.log(`copyAssets ${item.fspath} ==> ${destFN}`);
                await fsp.cp(item.fspath, destFN, {
                    force: true,
                    preserveTimestamps: true
                });
                return "ok";
            } catch (err) {
                throw new Error(`copyAssets FAIL to copy ${item.fspath} ${item.vpath} ${item.renderPath} ${config.renderTo} because ${err.stack}`);
            }
        }, 10);

        // Push the list of asset files into the queue
        // Because queue.push returns Promise's we end up with
        // an array of Promise objects
        const waitFor = [];
        for (let entry of paths) {
            waitFor.push(queue.push(entry));
        }
        // This waits for all Promise's to finish
        // But if there were no Promise's, no need to wait
        if (waitFor.length > 0) await Promise.all(waitFor);
        // There are no results in this case to care about
        // const results = [];
        // for (let result of waitFor) {
        //    results.push(await result);
        // }
    }

    /**
     * Call the beforeSiteRendered function of any plugin which has that function.
     */
    async hookBeforeSiteRendered() {
        // console.log('hookBeforeSiteRendered');
        const config = this;
        for (let plugin of config.plugins) {
            if (typeof plugin.beforeSiteRendered !== 'undefined') {
                // console.log(`CALLING plugin ${plugin.name} beforeSiteRendered`);
                await plugin.beforeSiteRendered(config);
            }
        }
    }

    /**
     * Call the onSiteRendered function of any plugin which has that function.
     */
    async hookSiteRendered() {
        // console.log('hookSiteRendered');
        const config = this;
        for (let plugin of config.plugins) {
            if (typeof plugin.onSiteRendered !== 'undefined') {
                // console.log(`CALLING plugin ${plugin.name} onSiteRendered`);
                await plugin.onSiteRendered(config);
            }
        }
    }

    async hookFileAdded(collection, vpinfo) {
        // console.log(`hookFileAdded ${collection} ${vpinfo.vpath}`);
        const config = this;
        for (let plugin of config.plugins) {
            if (typeof plugin.onFileAdded !== 'undefined') {
                // console.log(`CALLING plugin ${plugin.name} onFileAdded`);
                await plugin.onFileAdded(config, collection, vpinfo);
            }
        }
    }

    async hookFileChanged(collection, vpinfo) {
        const config = this;
        for (let plugin of config.plugins) {
            if (typeof plugin.onFileChanged !== 'undefined') {
                // console.log(`CALLING plugin ${plugin.name} onFileChanged`);
                await plugin.onFileChanged(config, collection, vpinfo);
            }
        }
    }

    async hookFileUnlinked(collection, vpinfo) {
        const config = this;
        for (let plugin of config.plugins) {
            if (typeof plugin.onFileUnlinked !== 'undefined') {
                // console.log(`CALLING plugin ${plugin.name} onFileUnlinked`);
                await plugin.onFileUnlinked(config, collection, vpinfo);
            }
        }
    }

    async hookFileCacheSetup(collectionnm, collection) {
        const config = this;
        for (let plugin of config.plugins) {
            if (typeof plugin.onFileCacheSetup !== 'undefined') {
                await plugin.onFileCacheSetup(config, collectionnm, collection);
            }
        }
    }

    async hookPluginCacheSetup() {
        const config = this;
        for (let plugin of config.plugins) {
            if (typeof plugin.onPluginCacheSetup !== 'undefined') {
                await plugin.onPluginCacheSetup(config);
            }
        }
    }

    /**
     * use - go through plugins array, adding each to the plugins array in
     * the config file, then calling the config function of each plugin.
     * @param PluginObj The plugin name or object to add
     * @returns {Configuration}
     */
    use(PluginObj, options) {
        // console.log("Configuration #1 use PluginObj "+ typeof PluginObj +" "+ util.inspect(PluginObj));
        if (typeof PluginObj === 'string') {
            // This is going to fail because
            // require doesn't work in this context
            // Further, this context does not
            // support async functions, so we
            // cannot do import.
            PluginObj = require(PluginObj);
        }
        if (!PluginObj || PluginObj instanceof Plugin) {
            throw new Error("No plugin supplied");
        }
        // console.log("Configuration #2 use PluginObj "+ typeof PluginObj +" "+ util.inspect(PluginObj));
        var plugin = new PluginObj();
        plugin.akasha = this.akasha;
        this.#plugins.push(plugin);
        if (!options) options = {};
        plugin.configure(this, options);
        return this;
    }

    get plugins() { return this.#plugins; }

    /**
     * Iterate over the installed plugins, calling the function passed in `iterator`
     * for each plugin, then calling the function passed in `final`.
     *
     * @param iterator The function to call for each plugin.  Signature: `function(plugin, next)`  The `next` parameter is a function used to indicate error -- `next(err)` -- or success -- next()
     * @param final The function to call after all iterator calls have been made.  Signature: `function(err)`
     */
    eachPlugin(iterator, final) {
        throw new Error("eachPlugin deprecated");
        /* async.eachSeries(this.plugins,
        function(plugin, next) {
            iterator(plugin, next);
        },
        final); */
    }

    /**
     * Look for a plugin, returning its module reference.
     * @param {string} name
     * @returns {Plugin}
     */
    plugin(name) {
        // console.log('config.plugin: '+ util.inspect(this._plugins));
        if (! this.plugins) {
            return undefined;
        }
        for (var pluginKey in this.plugins) {
            var plugin = this.plugins[pluginKey];
            if (plugin.name === name) return plugin;
        }
        console.log(`WARNING: Did not find plugin ${name}`);
        return undefined;
    }

    /**
     * Retrieve the pluginData object for the named plugin.
     * @param {string} name
     * @returns {Object}
     */ 
    pluginData(name) {
        var pluginDataArray = this.#pluginData;
        if (!(name in pluginDataArray)) {
            pluginDataArray[name] = {};
        }
        return pluginDataArray[name];
    }

    askPluginsLegitLocalHref(href) {
        for (var plugin of this.plugins) {
            if (typeof plugin.isLegitLocalHref !== 'undefined') {
                if (plugin.isLegitLocalHref(this, href)) {
                    return true;
                }
            }
        }
        return false;
    }

    registerRenderer(renderer) {
        if (!(renderer instanceof Renderer)) {
            console.error('Not A Renderer '+ util.inspect(renderer));
            throw new Error(`Not a Renderer ${renderer.name}`);
        }
        if (!this.findRendererName(renderer.name)) {
            // renderer.akasha = this.akasha;
            // renderer.config = this;
            // console.log(`registerRenderer `, renderer);
            this.#renderers.registerRenderer(renderer);
        }
    }

    /**
     * Allow an application to override one of the built-in renderers
     * that are initialized below.  The inspiration is epubtools that
     * must write HTML files with an .xhtml extension.  Therefore it
     * can subclass EJSRenderer etc with implementations that force the
     * file name to be .xhtml.  We're not checking if the renderer name
     * is already there in case epubtools must use the same renderer name.
     */
    registerOverrideRenderer(renderer) {
        if (!(renderer instanceof Renderer)) {
            console.error('Not A Renderer '+ util.inspect(renderer));
            throw new Error('Not a Renderer');
        }
        // renderer.akasha = this.akasha;
        // renderer.config = this;
        this.#renderers.registerOverrideRenderer(renderer);
    }

    findRendererName(name): Renderer {
        return this.#renderers.findRendererName(name);
    }

    findRendererPath(_path): Renderer {
        return this.#renderers.findRendererPath(_path);
    }

    get renderers() { return this.#renderers; }

    /**
     * Find a Renderer by its extension.
     */
    findRenderer(name) {
        return this.findRendererName(name);
    }
}

const module_exports = {
    Renderers,
    Renderer: Renderers.Renderer,
    mahabhuta,
    filecache,
    setup,
    cacheSetup,
    closeCaches,
    fileCachesReady,
    Plugin,
    render,
    renderDocument,
    renderPath,
    readRenderedFile,
    partial,
    partialSync,
    indexChain,
    relative,
    linkRelSetAttr,
    generateRSS,
    Configuration
} as any;

export default module_exports;