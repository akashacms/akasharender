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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Configuration_renderers, _Configuration_autoload, _Configuration_autosave, _Configuration_configdir, _Configuration_cachedir, _Configuration_assetsDirs, _Configuration_layoutDirs, _Configuration_documentDirs, _Configuration_partialDirs, _Configuration_mahafuncs, _Configuration_cheerio, _Configuration_renderTo, _Configuration_scripts, _Configuration_concurrency, _Configuration_metadata, _Configuration_root_url, _Configuration_plugins, _Configuration_pluginData;
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
import { mimedefine } from '@akashacms/stacked-dirs';
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
import { render, renderDocument } from './render.js';
export { render, renderDocument, renderContent } from './render.js';
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
// For use in Configure.prepare
import { BuiltInPlugin } from './built-in.js';
// import * as filecache from './cache/file-cache-lokijs.js';
import * as filecache from './cache/file-cache-sqlite.js';
export { newKeyv, newSQ3DataStore } from './sqdb.js';
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
mimedefine({ 'text/asciidoc': ['adoc', 'asciidoc'] });
mimedefine({ 'text/x-markdoc': ['markdoc'] });
mimedefine({ 'text/x-ejs': ['ejs'] });
mimedefine({ 'text/x-nunjucks': ['njk'] });
mimedefine({ 'text/x-handlebars': ['handlebars'] });
mimedefine({ 'text/x-liquid': ['liquid'] });
mimedefine({ 'text/x-tempura': ['tempura'] });
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
    };
    await cacheSetup(config);
    await fileCachesReady(config);
}
export async function cacheSetup(config) {
    try {
        await filecache.setup(config);
    }
    catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE CACHE `, err);
        process.exit(1);
    }
}
export async function closeCaches() {
    try {
        await filecache.closeFileCaches();
    }
    catch (err) {
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
    }
    catch (err) {
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
        if (found)
            break;
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
        if (found.docBody)
            partialText = found.docBody;
        else if (found.docContent)
            partialText = found.docContent;
        else
            partialText = await fsp.readFile(found.fspath, 'utf8');
        // Some renderers (Nunjuks) require that metadata.config
        // point to the config object.  This block of code
        // duplicates the metadata object, then sets the
        // config field in the duplicate, passing that to the partial.
        let mdata = {};
        let prop;
        for (prop in metadata) {
            mdata[prop] = metadata[prop];
        }
        mdata.config = config;
        mdata.partialSync = partialSync.bind(renderer, config);
        mdata.partial = partial.bind(renderer, config);
        // console.log(`partial-funcs render ${renderer.name} ${found.vpath}`);
        return renderer.render({
            fspath: found.fspath,
            content: partialText,
            metadata: mdata
            // partialText, mdata, found
        });
    }
    else if (found.vpath.endsWith('.html') || found.vpath.endsWith('.xhtml')) {
        // console.log(`partial reading file ${found.vpath}`);
        return fsp.readFile(found.fspath, 'utf8');
    }
    else {
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
        let mdata = {};
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
        return renderer.renderSync({
            fspath: found.fspath,
            content: partialText,
            metadata: mdata
            // partialText, mdata, found
        });
    }
    else if (found.vpath.endsWith('.html') || found.vpath.endsWith('.xhtml')) {
        return fs.readFileSync(found.fspath, 'utf8');
    }
    else {
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
    }
    else if (hasattr && !doattr) {
        rels.splice(rels.indexOf(attr));
        $link.attr('rel', rels.join(' '));
    }
}
;
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
    items.forEach(function (item) { rssfeed.item(item); });
    var xml = rssfeed.xml();
    var renderOut = path.join(config.renderDestination, renderTo);
    await fsp.mkdir(path.dirname(renderOut), { recursive: true });
    await fsp.writeFile(renderOut, xml, { encoding: 'utf8' });
}
;
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
    constructor(modulepath) {
        _Configuration_renderers.set(this, void 0);
        _Configuration_autoload.set(this, void 0);
        _Configuration_autosave.set(this, void 0);
        _Configuration_configdir.set(this, void 0);
        _Configuration_cachedir.set(this, void 0);
        _Configuration_assetsDirs.set(this, void 0);
        _Configuration_layoutDirs.set(this, void 0);
        _Configuration_documentDirs.set(this, void 0);
        _Configuration_partialDirs.set(this, void 0);
        _Configuration_mahafuncs.set(this, void 0);
        _Configuration_cheerio.set(this, void 0);
        _Configuration_renderTo.set(this, void 0);
        _Configuration_scripts.set(this, void 0);
        _Configuration_concurrency.set(this, void 0);
        _Configuration_metadata.set(this, void 0);
        _Configuration_root_url.set(this, void 0);
        _Configuration_plugins.set(this, void 0);
        _Configuration_pluginData.set(this, void 0);
        // this[_config_renderers] = [];
        __classPrivateFieldSet(this, _Configuration_renderers, new Renderers.Configuration({}), "f");
        __classPrivateFieldSet(this, _Configuration_autoload, false, "f");
        __classPrivateFieldSet(this, _Configuration_autosave, false, "f");
        __classPrivateFieldSet(this, _Configuration_mahafuncs, [], "f");
        __classPrivateFieldSet(this, _Configuration_scripts, {
            stylesheets: [],
            javaScriptTop: [],
            javaScriptBottom: []
        }, "f");
        __classPrivateFieldSet(this, _Configuration_concurrency, 3, "f");
        __classPrivateFieldSet(this, _Configuration_documentDirs, [], "f");
        __classPrivateFieldSet(this, _Configuration_layoutDirs, [], "f");
        __classPrivateFieldSet(this, _Configuration_partialDirs, [], "f");
        __classPrivateFieldSet(this, _Configuration_assetsDirs, [], "f");
        __classPrivateFieldSet(this, _Configuration_mahafuncs, [], "f");
        __classPrivateFieldSet(this, _Configuration_renderTo, 'out', "f");
        __classPrivateFieldSet(this, _Configuration_metadata, {}, "f");
        __classPrivateFieldSet(this, _Configuration_plugins, [], "f");
        __classPrivateFieldSet(this, _Configuration_pluginData, [], "f");
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
            renderPartial: function (fname, metadata) {
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
        const configDirPath = function (dirnm) {
            let configPath = dirnm;
            if (typeof CONFIG.configDir !== 'undefined' && CONFIG.configDir != null) {
                configPath = path.join(CONFIG.configDir, dirnm);
            }
            return configPath;
        };
        let stat;
        const cacheDirsPath = configDirPath('cache');
        if (!__classPrivateFieldGet(this, _Configuration_cachedir, "f")) {
            if (fs.existsSync(cacheDirsPath)
                && (stat = fs.statSync(cacheDirsPath))) {
                if (stat.isDirectory()) {
                    this.cacheDir = 'cache';
                }
                else {
                    throw new Error("'cache' is not a directory");
                }
            }
            else {
                fs.mkdirSync(cacheDirsPath, { recursive: true });
                this.cacheDir = 'cache';
            }
        }
        else if (__classPrivateFieldGet(this, _Configuration_cachedir, "f") && !fs.existsSync(__classPrivateFieldGet(this, _Configuration_cachedir, "f"))) {
            fs.mkdirSync(__classPrivateFieldGet(this, _Configuration_cachedir, "f"), { recursive: true });
        }
        const assetsDirsPath = configDirPath('assets');
        if (!__classPrivateFieldGet(this, _Configuration_assetsDirs, "f")) {
            if (fs.existsSync(assetsDirsPath) && (stat = fs.statSync(assetsDirsPath))) {
                if (stat.isDirectory()) {
                    this.addAssetsDir('assets');
                }
            }
        }
        const layoutsDirsPath = configDirPath('layouts');
        if (!__classPrivateFieldGet(this, _Configuration_layoutDirs, "f")) {
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
        if (!__classPrivateFieldGet(this, _Configuration_documentDirs, "f")) {
            if (fs.existsSync(documentDirsPath) && (stat = fs.statSync(documentDirsPath))) {
                if (stat.isDirectory()) {
                    this.addDocumentsDir('documents');
                }
                else {
                    throw new Error("'documents' is not a directory");
                }
            }
            else {
                throw new Error("No 'documentDirs' setting, and no 'documents' directory");
            }
        }
        const renderToPath = configDirPath('out');
        if (!__classPrivateFieldGet(this, _Configuration_renderTo, "f")) {
            if (fs.existsSync(renderToPath)
                && (stat = fs.statSync(renderToPath))) {
                if (stat.isDirectory()) {
                    this.setRenderDestination('out');
                }
                else {
                    throw new Error("'out' is not a directory");
                }
            }
            else {
                fs.mkdirSync(renderToPath, { recursive: true });
                this.setRenderDestination('out');
            }
        }
        else if (__classPrivateFieldGet(this, _Configuration_renderTo, "f") && !fs.existsSync(__classPrivateFieldGet(this, _Configuration_renderTo, "f"))) {
            fs.mkdirSync(__classPrivateFieldGet(this, _Configuration_renderTo, "f"), { recursive: true });
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
    set configDir(cfgdir) { __classPrivateFieldSet(this, _Configuration_configdir, cfgdir, "f"); }
    get configDir() { return __classPrivateFieldGet(this, _Configuration_configdir, "f"); }
    set cacheDir(dirnm) { __classPrivateFieldSet(this, _Configuration_cachedir, dirnm, "f"); }
    get cacheDir() { return __classPrivateFieldGet(this, _Configuration_cachedir, "f"); }
    get cacheAutosave() { return __classPrivateFieldGet(this, _Configuration_autosave, "f"); }
    set cacheAutosave(auto) { __classPrivateFieldSet(this, _Configuration_autosave, auto, "f"); }
    get cacheAutoload() { return __classPrivateFieldGet(this, _Configuration_autoload, "f"); }
    set cacheAutoload(auto) { __classPrivateFieldSet(this, _Configuration_autoload, auto, "f"); }
    // set akasha(_akasha)  { this[_config_akasha] = _akasha; }
    get akasha() { return module_exports; }
    async documentsCache() { return filecache.documentsCache; }
    async assetsCache() { return filecache.assetsCache; }
    async layoutsCache() { return filecache.layoutsCache; }
    async partialsCache() { return filecache.partialsCache; }
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
            }
            else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        __classPrivateFieldGet(this, _Configuration_documentDirs, "f").push(dir);
        // console.log(`addDocumentsDir ${util.inspect(dir)} ==> ${util.inspect(this[_config_documentDirs])}`);
        return this;
    }
    get documentDirs() {
        return __classPrivateFieldGet(this, _Configuration_documentDirs, "f");
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
            }
            else if (docDir === dirname) {
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
            }
            else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        __classPrivateFieldGet(this, _Configuration_layoutDirs, "f").push(dir);
        __classPrivateFieldGet(this, _Configuration_renderers, "f").addLayoutDir(dir.src ? dir.src : dir);
        // console.log(`AkashaRender Configuration addLayoutsDir ${util.inspect(dir)} layoutDirs ${util.inspect(this.#layoutDirs)} Renderers layoutDirs ${util.inspect(this.#renderers.layoutDirs)}`);
        return this;
    }
    get layoutDirs() { return __classPrivateFieldGet(this, _Configuration_layoutDirs, "f"); }
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
            }
            else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        // console.log(`addPartialsDir `, dir);
        __classPrivateFieldGet(this, _Configuration_partialDirs, "f").push(dir);
        __classPrivateFieldGet(this, _Configuration_renderers, "f").addPartialDir(dir.src ? dir.src : dir);
        return this;
    }
    get partialsDirs() { return __classPrivateFieldGet(this, _Configuration_partialDirs, "f"); }
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
            }
            else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        __classPrivateFieldGet(this, _Configuration_assetsDirs, "f").push(dir);
        return this;
    }
    get assetDirs() { return __classPrivateFieldGet(this, _Configuration_assetsDirs, "f"); }
    /**
     * Add an array of Mahabhuta functions
     * @param {Array} mahafuncs
     * @returns {Configuration}
     */
    addMahabhuta(mahafuncs) {
        if (typeof mahafuncs === 'undefined' || !mahafuncs) {
            throw new Error(`undefined mahafuncs in ${this.configDir}`);
        }
        __classPrivateFieldGet(this, _Configuration_mahafuncs, "f").push(mahafuncs);
        return this;
    }
    get mahafuncs() { return __classPrivateFieldGet(this, _Configuration_mahafuncs, "f"); }
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
        __classPrivateFieldSet(this, _Configuration_renderTo, dir, "f");
        return this;
    }
    /** Fetch the declared destination for rendering the project. */
    get renderDestination() { return __classPrivateFieldGet(this, _Configuration_renderTo, "f"); }
    get renderTo() { return __classPrivateFieldGet(this, _Configuration_renderTo, "f"); }
    /**
     * Add a value to the project metadata.  The metadata is combined with
     * the document metadata and used during rendering.
     * @param {string} index The key to store the value.
     * @param value The value to store in the metadata.
     * @returns {Configuration}
     */
    addMetadata(index, value) {
        var md = __classPrivateFieldGet(this, _Configuration_metadata, "f");
        md[index] = value;
        return this;
    }
    get metadata() { return __classPrivateFieldGet(this, _Configuration_metadata, "f"); }
    /**
    * Document the URL for a website project.
    * @param {string} root_url
    * @returns {Configuration}
    */
    rootURL(root_url) {
        __classPrivateFieldSet(this, _Configuration_root_url, root_url, "f");
        return this;
    }
    get root_url() { return __classPrivateFieldGet(this, _Configuration_root_url, "f"); }
    /**
     * Set how many documents to render concurrently.
     * @param {number} concurrency
    * @returns {Configuration}
     */
    setConcurrency(concurrency) {
        __classPrivateFieldSet(this, _Configuration_concurrency, concurrency, "f");
        return this;
    }
    get concurrency() { return __classPrivateFieldGet(this, _Configuration_concurrency, "f"); }
    /**
     * Declare JavaScript to add within the head tag of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addHeaderJavaScript(script) {
        __classPrivateFieldGet(this, _Configuration_scripts, "f").javaScriptTop.push(script);
        return this;
    }
    get scripts() { return __classPrivateFieldGet(this, _Configuration_scripts, "f"); }
    /**
     * Declare JavaScript to add at the bottom of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addFooterJavaScript(script) {
        __classPrivateFieldGet(this, _Configuration_scripts, "f").javaScriptBottom.push(script);
        return this;
    }
    /**
     * Declare a CSS Stylesheet to add within the head tag of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addStylesheet(css) {
        __classPrivateFieldGet(this, _Configuration_scripts, "f").stylesheets.push(css);
        return this;
    }
    setMahabhutaConfig(cheerio) {
        __classPrivateFieldSet(this, _Configuration_cheerio, cheerio, "f");
        // For cheerio 1.0.0-rc.10 we need to use this setting.
        // If the configuration has set this, we must not
        // override their setting.  But, generally, for correct
        // operation and handling of Mahabhuta tags, we need
        // this setting to be <code>true</code>
        if (!('_useHtmlParser2' in __classPrivateFieldGet(this, _Configuration_cheerio, "f"))) {
            __classPrivateFieldGet(this, _Configuration_cheerio, "f")._useHtmlParser2 = true;
        }
        // console.log(this[_config_cheerio]);
    }
    get mahabhutaConfig() { return __classPrivateFieldGet(this, _Configuration_cheerio, "f"); }
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
        const queue = fastq.promise(async function (item) {
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
            }
            catch (err) {
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
        if (waitFor.length > 0)
            await Promise.all(waitFor);
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
        __classPrivateFieldGet(this, _Configuration_plugins, "f").push(plugin);
        if (!options)
            options = {};
        plugin.configure(this, options);
        return this;
    }
    get plugins() { return __classPrivateFieldGet(this, _Configuration_plugins, "f"); }
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
        if (!this.plugins) {
            return undefined;
        }
        for (var pluginKey in this.plugins) {
            var plugin = this.plugins[pluginKey];
            if (plugin.name === name)
                return plugin;
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
        var pluginDataArray = __classPrivateFieldGet(this, _Configuration_pluginData, "f");
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
            console.error('Not A Renderer ' + util.inspect(renderer));
            throw new Error(`Not a Renderer ${renderer.name}`);
        }
        if (!this.findRendererName(renderer.name)) {
            // renderer.akasha = this.akasha;
            // renderer.config = this;
            // console.log(`registerRenderer `, renderer);
            __classPrivateFieldGet(this, _Configuration_renderers, "f").registerRenderer(renderer);
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
            console.error('Not A Renderer ' + util.inspect(renderer));
            throw new Error('Not a Renderer');
        }
        // renderer.akasha = this.akasha;
        // renderer.config = this;
        __classPrivateFieldGet(this, _Configuration_renderers, "f").registerOverrideRenderer(renderer);
    }
    findRendererName(name) {
        return __classPrivateFieldGet(this, _Configuration_renderers, "f").findRendererName(name);
    }
    findRendererPath(_path) {
        return __classPrivateFieldGet(this, _Configuration_renderers, "f").findRendererPath(_path);
    }
    get renderers() { return __classPrivateFieldGet(this, _Configuration_renderers, "f"); }
    /**
     * Find a Renderer by its extension.
     */
    findRenderer(name) {
        return this.findRendererName(name);
    }
}
_Configuration_renderers = new WeakMap(), _Configuration_autoload = new WeakMap(), _Configuration_autosave = new WeakMap(), _Configuration_configdir = new WeakMap(), _Configuration_cachedir = new WeakMap(), _Configuration_assetsDirs = new WeakMap(), _Configuration_layoutDirs = new WeakMap(), _Configuration_documentDirs = new WeakMap(), _Configuration_partialDirs = new WeakMap(), _Configuration_mahafuncs = new WeakMap(), _Configuration_cheerio = new WeakMap(), _Configuration_renderTo = new WeakMap(), _Configuration_scripts = new WeakMap(), _Configuration_concurrency = new WeakMap(), _Configuration_metadata = new WeakMap(), _Configuration_root_url = new WeakMap(), _Configuration_plugins = new WeakMap(), _Configuration_pluginData = new WeakMap();
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
};
export default module_exports;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBR0g7OztHQUdHO0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsNENBQTRDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFlLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ2xFLE9BQU8sS0FBSyxTQUFTLE1BQU0sc0JBQXNCLENBQUM7QUFDbEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ2hELE9BQU8sS0FBSyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ3ZDLE9BQU8sS0FBSyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ3ZDLE9BQU8sS0FBSyxPQUFPLE1BQU0sU0FBUyxDQUFDO0FBQ25DLE9BQU8sV0FBVyxNQUFNLDJCQUEyQixDQUFDO0FBRXBELE9BQU8sS0FBSyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sS0FBSyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBRXJDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDckMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUVyQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGNBQWMs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aUM7UUFDakMsMEJBQTBCO1FBQzFCLHVCQUFBLElBQUksZ0NBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsZ0JBQWdCLENBQUMsSUFBSTtRQUNqQixPQUFPLHVCQUFBLElBQUksZ0NBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsZ0JBQWdCLENBQUMsS0FBSztRQUNsQixPQUFPLHVCQUFBLElBQUksZ0NBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsSUFBSSxTQUFTLEtBQUssT0FBTyx1QkFBQSxJQUFJLGdDQUFXLENBQUMsQ0FBQyxDQUFDO0lBRTNDOztPQUVHO0lBQ0gsWUFBWSxDQUFDLElBQUk7UUFDYixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQ0o7O0FBRUQsTUFBTSxjQUFjLEdBQUc7SUFDbkIsU0FBUztJQUNULFFBQVEsRUFBRSxTQUFTLENBQUMsUUFBUTtJQUM1QixTQUFTO0lBQ1QsU0FBUztJQUNULEtBQUs7SUFDTCxVQUFVO0lBQ1YsV0FBVztJQUNYLGVBQWU7SUFDZixNQUFNO0lBQ04sTUFBTTtJQUNOLGNBQWM7SUFDZCxVQUFVO0lBQ1YsZ0JBQWdCO0lBQ2hCLE9BQU87SUFDUCxXQUFXO0lBQ1gsVUFBVTtJQUNWLFFBQVE7SUFDUixjQUFjO0lBQ2QsV0FBVztJQUNYLGFBQWE7Q0FDVCxDQUFDO0FBRVQsZUFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDIyIERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXG4vKipcbiAqIEFrYXNoYVJlbmRlclxuICogQG1vZHVsZSBha2FzaGFyZW5kZXJcbiAqL1xuXG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuLy8gY29uc3Qgb2VtYmV0dGVyID0gcmVxdWlyZSgnb2VtYmV0dGVyJykoKTtcbmltcG9ydCBSU1MgZnJvbSAncnNzJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgeyBEaXJzV2F0Y2hlciwgbWltZWRlZmluZSB9IGZyb20gJ0Bha2FzaGFjbXMvc3RhY2tlZC1kaXJzJztcbmltcG9ydCAqIGFzIFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5leHBvcnQgKiBhcyBSZW5kZXJlcnMgZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0IHsgUmVuZGVyZXIgfSBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5leHBvcnQgeyBSZW5kZXJlciB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCAqIGFzIG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuZXhwb3J0ICogYXMgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5pbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gJ2NoZWVyaW8nO1xuaW1wb3J0IG1haGFQYXJ0aWFsIGZyb20gJ21haGFiaHV0YS9tYWhhL3BhcnRpYWwuanMnO1xuXG5pbXBvcnQgKiBhcyByZWxhdGl2ZSBmcm9tICdyZWxhdGl2ZSc7XG5leHBvcnQgKiBhcyByZWxhdGl2ZSBmcm9tICdyZWxhdGl2ZSc7XG5cbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vUGx1Z2luLmpzJztcbmV4cG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vUGx1Z2luLmpzJztcblxuaW1wb3J0IHsgcmVuZGVyLCByZW5kZXJEb2N1bWVudCwgcmVuZGVyQ29udGVudCB9IGZyb20gJy4vcmVuZGVyLmpzJztcbmV4cG9ydCB7IHJlbmRlciwgcmVuZGVyRG9jdW1lbnQsIHJlbmRlckNvbnRlbnQgfSBmcm9tICcuL3JlbmRlci5qcyc7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBpbXBvcnQubWV0YS5maWxlbmFtZTtcbmNvbnN0IF9fZGlybmFtZSA9IGltcG9ydC5tZXRhLmRpcm5hbWU7XG5cbi8vIEZvciB1c2UgaW4gQ29uZmlndXJlLnByZXBhcmVcbmltcG9ydCB7IEJ1aWx0SW5QbHVnaW4gfSBmcm9tICcuL2J1aWx0LWluLmpzJztcblxuLy8gaW1wb3J0ICogYXMgZmlsZWNhY2hlIGZyb20gJy4vY2FjaGUvZmlsZS1jYWNoZS1sb2tpanMuanMnO1xuXG5pbXBvcnQgKiBhcyBmaWxlY2FjaGUgZnJvbSAnLi9jYWNoZS9maWxlLWNhY2hlLXNxbGl0ZS5qcyc7XG5cbmV4cG9ydCB7IG5ld0tleXYsIG5ld1NRM0RhdGFTdG9yZSB9IGZyb20gJy4vc3FkYi5qcyc7XG5cbi8vIFRoZXJlIGRvZXNuJ3Qgc2VlbSB0byBiZSBhbiBvZmZpY2lhbCBNSU1FIHR5cGUgcmVnaXN0ZXJlZFxuLy8gZm9yIEFzY2lpRG9jdG9yXG4vLyBwZXI6IGh0dHBzOi8vYXNjaWlkb2N0b3Iub3JnL2RvY3MvZmFxL1xuLy8gcGVyOiBodHRwczovL2dpdGh1Yi5jb20vYXNjaWlkb2N0b3IvYXNjaWlkb2N0b3IvaXNzdWVzLzI1MDJcbi8vXG4vLyBBcyBvZiBOb3ZlbWJlciA2LCAyMDIyLCB0aGUgQXNjaWlEb2N0b3IgRkFRIHNhaWQgdGhleSBhcmVcbi8vIGluIHRoZSBwcm9jZXNzIG9mIHJlZ2lzdGVyaW5nIGEgTUlNRSB0eXBlIGZvciBgdGV4dC9hc2NpaWRvY2AuXG4vLyBUaGUgTUlNRSB0eXBlIHdlIHN1cHBseSBoYXMgYmVlbiB1cGRhdGVkLlxuLy9cbi8vIFRoaXMgYWxzbyBzZWVtcyB0byBiZSB0cnVlIGZvciB0aGUgb3RoZXIgZmlsZSB0eXBlcy4gIFdlJ3ZlIG1hZGUgdXBcbi8vIHNvbWUgTUlNRSB0eXBlcyB0byBnbyB3aXRoIGVhY2guXG4vL1xuLy8gVGhlIE1JTUUgcGFja2FnZSBoYWQgcHJldmlvdXNseSBiZWVuIGluc3RhbGxlZCB3aXRoIEFrYXNoYVJlbmRlci5cbi8vIEJ1dCwgaXQgc2VlbXMgdG8gbm90IGJlIHVzZWQsIGFuZCBpbnN0ZWFkIHdlIGNvbXB1dGUgdGhlIE1JTUUgdHlwZVxuLy8gZm9yIGZpbGVzIGluIFN0YWNrZWQgRGlyZWN0b3JpZXMuXG4vL1xuLy8gVGhlIHJlcXVpcmVkIHRhc2sgaXMgdG8gcmVnaXN0ZXIgc29tZSBNSU1FIHR5cGVzIHdpdGggdGhlXG4vLyBNSU1FIHBhY2thZ2UuICBJdCBpc24ndCBhcHByb3ByaWF0ZSB0byBkbyB0aGlzIGluXG4vLyB0aGUgU3RhY2tlZCBEaXJlY3RvcmllcyBwYWNrYWdlLiAgSW5zdGVhZCB0aGF0J3MgbGVmdFxuLy8gZm9yIGNvZGUgd2hpY2ggdXNlcyBTdGFja2VkIERpcmVjdG9yaWVzIHRvIGRldGVybWluZSB3aGljaFxuLy8gKGlmIGFueSkgYWRkZWQgTUlNRSB0eXBlcyBhcmUgcmVxdWlyZWQuICBFcmdvLCBBa2FzaGFSZW5kZXJcbi8vIG5lZWRzIHRvIHJlZ2lzdGVyIHRoZSBNSU1FIHR5cGVzIGl0IGlzIGludGVyZXN0ZWQgaW4uXG4vLyBUaGF0J3Mgd2hhdCBpcyBoYXBwZW5pbmcgaGVyZS5cbi8vXG4vLyBUaGVyZSdzIGEgdGhvdWdodCB0aGF0IHRoaXMgc2hvdWxkIGJlIGhhbmRsZWQgaW4gdGhlIFJlbmRlcmVyXG4vLyBpbXBsZW1lbnRhdGlvbnMuICBCdXQgaXQncyBub3QgY2VydGFpbiB0aGF0J3MgY29ycmVjdC5cbi8vXG4vLyBOb3cgdGhhdCB0aGUgUmVuZGVyZXJzIGFyZSBpbiBgQGFrYXNoYWNtcy9yZW5kZXJlcnNgIHNob3VsZFxuLy8gdGhlc2UgZGVmaW5pdGlvbnMgbW92ZSB0byB0aGF0IHBhY2thZ2U/XG5cbm1pbWVkZWZpbmUoeyd0ZXh0L2FzY2lpZG9jJzogWyAnYWRvYycsICdhc2NpaWRvYycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1tYXJrZG9jJzogWyAnbWFya2RvYycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1lanMnOiBbICdlanMnXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1udW5qdWNrcyc6IFsgJ25qaycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1oYW5kbGViYXJzJzogWyAnaGFuZGxlYmFycycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1saXF1aWQnOiBbICdsaXF1aWQnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtdGVtcHVyYSc6IFsgJ3RlbXB1cmEnIF19KTtcblxuLyoqXG4gKiBQZXJmb3JtcyBzZXR1cCBvZiB0aGluZ3Mgc28gdGhhdCBBa2FzaGFSZW5kZXIgY2FuIGZ1bmN0aW9uLlxuICogVGhlIGNvcnJlY3QgaW5pdGlhbGl6YXRpb24gb2YgQWthc2hhUmVuZGVyIGlzIHRvXG4gKiAxLiBHZW5lcmF0ZSB0aGUgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAqIDIuIENhbGwgY29uZmlnLnByZXBhcmVcbiAqIDMuIENhbGwgYWthc2hhcmVuZGVyLnNldHVwXG4gKiBcbiAqIFRoaXMgZnVuY3Rpb24gZW5zdXJlcyBhbGwgb2JqZWN0cyB0aGF0IGluaXRpYWxpemUgYXN5bmNocm9ub3VzbHlcbiAqIGFyZSBjb3JyZWN0bHkgc2V0dXAuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAoY29uZmlnKSB7XG5cbiAgICBjb25maWcucmVuZGVyZXJzLnBhcnRpYWxGdW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2FsbGluZyBwYXJ0aWFsICR7Zm5hbWV9YCk7XG4gICAgICAgIHJldHVybiBwYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIGNvbmZpZy5yZW5kZXJlcnMucGFydGlhbFN5bmNGdW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2FsbGluZyBwYXJ0aWFsU3luYyAke2ZuYW1lfWApO1xuICAgICAgICByZXR1cm4gcGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH1cblxuICAgIGF3YWl0IGNhY2hlU2V0dXAoY29uZmlnKTtcbiAgICBhd2FpdCBmaWxlQ2FjaGVzUmVhZHkoY29uZmlnKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlU2V0dXAoY29uZmlnKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmlsZWNhY2hlLnNldHVwKGNvbmZpZyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYElOSVRJQUxJWkFUSU9OIEZBSUxVUkUgQ09VTEQgTk9UIElOSVRJQUxJWkUgQ0FDSEUgYCwgZXJyKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsb3NlQ2FjaGVzKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZpbGVjYWNoZS5jbG9zZUZpbGVDYWNoZXMoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgSU5JVElBTElaQVRJT04gRkFJTFVSRSBDT1VMRCBOT1QgQ0xPU0UgQ0FDSEVTIGAsIGVycik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmaWxlQ2FjaGVzUmVhZHkoY29uZmlnKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLmlzUmVhZHkoKSxcbiAgICAgICAgICAgIGZpbGVjYWNoZS5hc3NldHNDYWNoZS5pc1JlYWR5KCksXG4gICAgICAgICAgICBmaWxlY2FjaGUubGF5b3V0c0NhY2hlLmlzUmVhZHkoKSxcbiAgICAgICAgICAgIGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLmlzUmVhZHkoKVxuICAgICAgICBdKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgSU5JVElBTElaQVRJT04gRkFJTFVSRSBDT1VMRCBOT1QgSU5JVElBTElaRSBDQUNIRSBTWVNURU0gYCwgZXJyKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlclBhdGgoY29uZmlnLCBwYXRoMnIpIHtcbiAgICBjb25zdCBkb2N1bWVudHMgPSBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgbGV0IGZvdW5kO1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgd2hpbGUgKGNvdW50IDwgMjApIHtcbiAgICAgICAgLyogV2hhdCdzIGhhcHBlbmluZyBpcyB0aGlzIG1pZ2h0IGJlIGNhbGxlZCBmcm9tIGNsaS5qc1xuICAgICAgICAgKiBpbiByZW5kZXItZG9jdW1lbnQsIGFuZCB3ZSBtaWdodCBiZSBhc2tlZCB0byByZW5kZXIgdGhlXG4gICAgICAgICAqIGxhc3QgZG9jdW1lbnQgdGhhdCB3aWxsIGJlIEFERCdkIHRvIHRoZSBGaWxlQ2FjaGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEluIHN1Y2ggYSBjYXNlIDxjb2RlPmlzUmVhZHk8L2NvZGU+IG1pZ2h0IHJldHVybiA8Y29kZT50cnVlPC9jb2RlPlxuICAgICAgICAgKiBidXQgbm90IGFsbCBmaWxlcyB3aWxsIGhhdmUgYmVlbiBBREQnZCB0byB0aGUgRmlsZUNhY2hlLlxuICAgICAgICAgKiBJbiB0aGF0IGNhc2UgPGNvZGU+ZG9jdW1lbnRzLmZpbmQ8L2NvZGU+IHJldHVybnNcbiAgICAgICAgICogPGNvZGU+dW5kZWZpbmVkPC9jb2RlPlxuICAgICAgICAgKlxuICAgICAgICAgKiBXaGF0IHRoaXMgZG9lcyBpcyB0cnkgdXAgdG8gMjAgdGltZXMgdG8gbG9hZCB0aGUgZG9jdW1lbnQsXG4gICAgICAgICAqIHNsZWVwaW5nIGZvciAxMDAgbWlsbGlzZWNvbmRzIGVhY2ggdGltZS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNsZWFuZXIgYWx0ZXJuYXRpdmUgd291bGQgYmUgdG8gd2FpdCBmb3Igbm90IG9ubHlcbiAgICAgICAgICogdGhlIDxjb2RlPnJlYWR5PC9jb2RlPiBmcm9tIHRoZSA8Y29kZT5kb2N1bWVudHM8L2NvZGU+IEZpbGVDYWNoZSxcbiAgICAgICAgICogYnV0IGFsc28gZm9yIGFsbCB0aGUgaW5pdGlhbCBBREQgZXZlbnRzIHRvIGJlIGhhbmRsZWQuICBCdXRcbiAgICAgICAgICogdGhhdCBzZWNvbmQgY29uZGl0aW9uIHNlZW1zIGRpZmZpY3VsdCB0byBkZXRlY3QgcmVsaWFibHkuXG4gICAgICAgICAqL1xuICAgICAgICBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHBhdGgycik7XG4gICAgICAgIGlmIChmb3VuZCkgYnJlYWs7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJQYXRoICR7cGF0aDJyfWAsIGZvdW5kKTtcbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRGlkIG5vdCBmaW5kIGRvY3VtZW50IGZvciAke3BhdGgycn1gKTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckRvY3VtZW50KGNvbmZpZywgZm91bmQpO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmVhZHMgYSBmaWxlIGZyb20gdGhlIHJlbmRlcmluZyBkaXJlY3RvcnkuICBJdCBpcyBwcmltYXJpbHkgdG8gYmVcbiAqIHVzZWQgaW4gdGVzdCBjYXNlcywgd2hlcmUgd2UnbGwgcnVuIGEgYnVpbGQgdGhlbiByZWFkIHRoZSBpbmRpdmlkdWFsXG4gKiBmaWxlcyB0byBtYWtlIHN1cmUgdGhleSd2ZSByZW5kZXJlZCBjb3JyZWN0bHkuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIFxuICogQHBhcmFtIHsqfSBmcGF0aCBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFJlbmRlcmVkRmlsZShjb25maWcsIGZwYXRoKSB7XG5cbiAgICBsZXQgaHRtbCA9IGF3YWl0IGZzcC5yZWFkRmlsZShwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCBmcGF0aCksICd1dGY4Jyk7XG4gICAgbGV0ICQgPSBjb25maWcubWFoYWJodXRhQ29uZmlnIFxuICAgICAgICAgICAgPyBjaGVlcmlvLmxvYWQoaHRtbCwgY29uZmlnLm1haGFiaHV0YUNvbmZpZykgXG4gICAgICAgICAgICA6IGNoZWVyaW8ubG9hZChodG1sKTtcblxuICAgIHJldHVybiB7IGh0bWwsICQgfTtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgcGFydGlhbCB0ZW1wbGF0ZSB1c2luZyB0aGUgc3VwcGxpZWQgbWV0YWRhdGEuICBUaGlzIHZlcnNpb25cbiAqIGFsbG93cyBmb3IgYXN5bmNocm9ub3VzIGV4ZWN1dGlvbiwgYW5kIGV2ZXJ5IGJpdCBvZiBjb2RlIGl0XG4gKiBleGVjdXRlcyBpcyBhbGxvd2VkIHRvIGJlIGFzeW5jLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAqIEBwYXJhbSB7Kn0gZm5hbWUgUGF0aCB3aXRoaW4gdGhlIGZpbGVjYWNoZS5wYXJ0aWFscyBjYWNoZVxuICogQHBhcmFtIHsqfSBtZXRhZGF0YSBPYmplY3QgY29udGFpbmluZyBtZXRhZGF0YVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHJlbmRlcmVkIHN0dWZmXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKSB7XG5cbiAgICBpZiAoIWZuYW1lIHx8IHR5cGVvZiBmbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBwYXJ0aWFsIGZuYW1lIG5vdCBhIHN0cmluZyAke3V0aWwuaW5zcGVjdChmbmFtZSl9YCk7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgJHtmbmFtZX1gKTtcbiAgICBjb25zdCBmb3VuZCA9IGF3YWl0IGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLmZpbmQoZm5hbWUpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBwYXJ0aWFsIGZvdW5kIGZvciAke2ZuYW1lfSBpbiAke3V0aWwuaW5zcGVjdChjb25maWcucGFydGlhbHNEaXJzKX1gKTtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgJHtmbmFtZX0gPT0+ICR7Zm91bmQudnBhdGh9ICR7Zm91bmQuZnNwYXRofWApO1xuICAgIFxuICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZm91bmQudnBhdGgpO1xuICAgIGlmIChyZW5kZXJlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCBhYm91dCB0byByZW5kZXIgJHt1dGlsLmluc3BlY3QoZm91bmQudnBhdGgpfWApO1xuICAgICAgICBsZXQgcGFydGlhbFRleHQ7XG4gICAgICAgIGlmIChmb3VuZC5kb2NCb2R5KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0JvZHk7XG4gICAgICAgIGVsc2UgaWYgKGZvdW5kLmRvY0NvbnRlbnQpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQ29udGVudDtcbiAgICAgICAgZWxzZSBwYXJ0aWFsVGV4dCA9IGF3YWl0IGZzcC5yZWFkRmlsZShmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG5cbiAgICAgICAgLy8gU29tZSByZW5kZXJlcnMgKE51bmp1a3MpIHJlcXVpcmUgdGhhdCBtZXRhZGF0YS5jb25maWdcbiAgICAgICAgLy8gcG9pbnQgdG8gdGhlIGNvbmZpZyBvYmplY3QuICBUaGlzIGJsb2NrIG9mIGNvZGVcbiAgICAgICAgLy8gZHVwbGljYXRlcyB0aGUgbWV0YWRhdGEgb2JqZWN0LCB0aGVuIHNldHMgdGhlXG4gICAgICAgIC8vIGNvbmZpZyBmaWVsZCBpbiB0aGUgZHVwbGljYXRlLCBwYXNzaW5nIHRoYXQgdG8gdGhlIHBhcnRpYWwuXG4gICAgICAgIGxldCBtZGF0YTogYW55ID0ge307XG4gICAgICAgIGxldCBwcm9wO1xuXG4gICAgICAgIGZvciAocHJvcCBpbiBtZXRhZGF0YSkge1xuICAgICAgICAgICAgbWRhdGFbcHJvcF0gPSBtZXRhZGF0YVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBtZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgICAgIG1kYXRhLnBhcnRpYWxTeW5jID0gcGFydGlhbFN5bmMuYmluZChyZW5kZXJlciwgY29uZmlnKTtcbiAgICAgICAgbWRhdGEucGFydGlhbCAgICAgPSBwYXJ0aWFsLmJpbmQocmVuZGVyZXIsIGNvbmZpZyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsLWZ1bmNzIHJlbmRlciAke3JlbmRlcmVyLm5hbWV9ICR7Zm91bmQudnBhdGh9YCk7XG4gICAgICAgIHJldHVybiByZW5kZXJlci5yZW5kZXIoe1xuICAgICAgICAgICAgZnNwYXRoOiBmb3VuZC5mc3BhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBwYXJ0aWFsVGV4dCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBtZGF0YVxuICAgICAgICAgICAgLy8gcGFydGlhbFRleHQsIG1kYXRhLCBmb3VuZFxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcuaHRtbCcpIHx8IGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcueGh0bWwnKSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCByZWFkaW5nIGZpbGUgJHtmb3VuZC52cGF0aH1gKTtcbiAgICAgICAgcmV0dXJuIGZzcC5yZWFkRmlsZShmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW5kZXJQYXJ0aWFsIG5vIFJlbmRlcmVyIGZvdW5kIGZvciAke2ZuYW1lfSAtICR7Zm91bmQudnBhdGh9YCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBwYXJ0aWFsIHRlbXBsYXRlIHVzaW5nIHRoZSBzdXBwbGllZCBtZXRhZGF0YS4gIFRoaXMgdmVyc2lvblxuICogYWxsb3dzIGZvciBzeW5jaHJvbm91cyBleGVjdXRpb24sIGFuZCBldmVyeSBiaXQgb2YgY29kZSBpdFxuICogZXhlY3V0ZXMgaXMgc3luY2hyb25vdXMgZnVuY3Rpb25zLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAqIEBwYXJhbSB7Kn0gZm5hbWUgUGF0aCB3aXRoaW4gdGhlIGZpbGVjYWNoZS5wYXJ0aWFscyBjYWNoZVxuICogQHBhcmFtIHsqfSBtZXRhZGF0YSBPYmplY3QgY29udGFpbmluZyBtZXRhZGF0YVxuICogQHJldHVybnMgU3RyaW5nIGNvbnRhaW5pbmcgdGhlIHJlbmRlcmVkIHN0dWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSkge1xuXG4gICAgaWYgKCFmbmFtZSB8fCB0eXBlb2YgZm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcGFydGlhbFN5bmMgZm5hbWUgbm90IGEgc3RyaW5nICR7dXRpbC5pbnNwZWN0KGZuYW1lKX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBmb3VuZCA9IGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLmZpbmRTeW5jKGZuYW1lKTtcbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcGFydGlhbCBmb3VuZCBmb3IgJHtmbmFtZX0gaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLnBhcnRpYWxzRGlycyl9YCk7XG4gICAgfVxuXG4gICAgdmFyIHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZm91bmQudnBhdGgpO1xuICAgIGlmIChyZW5kZXJlcikge1xuICAgICAgICAvLyBTb21lIHJlbmRlcmVycyAoTnVuanVrcykgcmVxdWlyZSB0aGF0IG1ldGFkYXRhLmNvbmZpZ1xuICAgICAgICAvLyBwb2ludCB0byB0aGUgY29uZmlnIG9iamVjdC4gIFRoaXMgYmxvY2sgb2YgY29kZVxuICAgICAgICAvLyBkdXBsaWNhdGVzIHRoZSBtZXRhZGF0YSBvYmplY3QsIHRoZW4gc2V0cyB0aGVcbiAgICAgICAgLy8gY29uZmlnIGZpZWxkIGluIHRoZSBkdXBsaWNhdGUsIHBhc3NpbmcgdGhhdCB0byB0aGUgcGFydGlhbC5cbiAgICAgICAgbGV0IG1kYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgbGV0IHByb3A7XG5cbiAgICAgICAgZm9yIChwcm9wIGluIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICBtZGF0YVtwcm9wXSA9IG1ldGFkYXRhW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIG1kYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgLy8gSW4gdGhpcyBjb250ZXh0LCBwYXJ0aWFsU3luYyBpcyBkaXJlY3RseSBhdmFpbGFibGVcbiAgICAgICAgLy8gYXMgYSBmdW5jdGlvbiB0aGF0IHdlIGNhbiBkaXJlY3RseSB1c2UuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsU3luYyBgLCBwYXJ0aWFsU3luYyk7XG4gICAgICAgIG1kYXRhLnBhcnRpYWxTeW5jID0gcGFydGlhbFN5bmMuYmluZChyZW5kZXJlciwgY29uZmlnKTtcbiAgICAgICAgLy8gZm9yIGZpbmRTeW5jLCB0aGUgXCJmb3VuZFwiIG9iamVjdCBpcyBWUGF0aERhdGEgd2hpY2hcbiAgICAgICAgLy8gZG9lcyBub3QgaGF2ZSBkb2NCb2R5IG5vciBkb2NDb250ZW50LiAgVGhlcmVmb3JlIHdlXG4gICAgICAgIC8vIG11c3QgcmVhZCB0aGlzIGNvbnRlbnRcbiAgICAgICAgbGV0IHBhcnRpYWxUZXh0ID0gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0Zi04Jyk7XG4gICAgICAgIC8vIGlmIChmb3VuZC5kb2NCb2R5KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0JvZHk7XG4gICAgICAgIC8vIGVsc2UgaWYgKGZvdW5kLmRvY0NvbnRlbnQpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQ29udGVudDtcbiAgICAgICAgLy8gZWxzZSBwYXJ0aWFsVGV4dCA9IGZzLnJlYWRGaWxlU3luYyhmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbC1mdW5jcyByZW5kZXJTeW5jICR7cmVuZGVyZXIubmFtZX0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyLnJlbmRlclN5bmMoPFJlbmRlcmVycy5SZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgICAgIGZzcGF0aDogZm91bmQuZnNwYXRoLFxuICAgICAgICAgICAgY29udGVudDogcGFydGlhbFRleHQsXG4gICAgICAgICAgICBtZXRhZGF0YTogbWRhdGFcbiAgICAgICAgICAgIC8vIHBhcnRpYWxUZXh0LCBtZGF0YSwgZm91bmRcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChmb3VuZC52cGF0aC5lbmRzV2l0aCgnLmh0bWwnKSB8fCBmb3VuZC52cGF0aC5lbmRzV2l0aCgnLnhodG1sJykpIHtcbiAgICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW5kZXJQYXJ0aWFsIG5vIFJlbmRlcmVyIGZvdW5kIGZvciAke2ZuYW1lfSAtICR7Zm91bmQudnBhdGh9YCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFN0YXJ0aW5nIGZyb20gYSB2aXJ0dWFsIHBhdGggaW4gdGhlIGRvY3VtZW50cywgc2VhcmNoZXMgdXB3YXJkcyB0b1xuICogdGhlIHJvb3Qgb2YgdGhlIGRvY3VtZW50cyBmaWxlLXNwYWNlLCBmaW5kaW5nIGZpbGVzIHRoYXQgXG4gKiByZW5kZXIgdG8gXCJpbmRleC5odG1sXCIuICBUaGUgXCJpbmRleC5odG1sXCIgZmlsZXMgYXJlIGluZGV4IGZpbGVzLFxuICogYXMgdGhlIG5hbWUgc3VnZ2VzdHMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIFxuICogQHBhcmFtIHsqfSBmbmFtZSBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5kZXhDaGFpbihjb25maWcsIGZuYW1lKSB7XG5cbiAgICAvLyBUaGlzIHVzZWQgdG8gYmUgYSBmdWxsIGZ1bmN0aW9uIGhlcmUsIGJ1dCBoYXMgbW92ZWRcbiAgICAvLyBpbnRvIHRoZSBGaWxlQ2FjaGUgY2xhc3MuICBSZXF1aXJpbmcgYSBgY29uZmlnYCBvcHRpb25cbiAgICAvLyBpcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgZm9ybWVyIEFQSS5cblxuICAgIGNvbnN0IGRvY3VtZW50cyA9IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICByZXR1cm4gZG9jdW1lbnRzLmluZGV4Q2hhaW4oZm5hbWUpO1xufVxuXG5cbi8qKlxuICogTWFuaXB1bGF0ZSB0aGUgcmVsPSBhdHRyaWJ1dGVzIG9uIGEgbGluayByZXR1cm5lZCBmcm9tIE1haGFiaHV0YS5cbiAqXG4gKiBAcGFyYW1zIHskbGlua30gVGhlIGxpbmsgdG8gbWFuaXB1bGF0ZVxuICogQHBhcmFtcyB7YXR0cn0gVGhlIGF0dHJpYnV0ZSBuYW1lXG4gKiBAcGFyYW1zIHtkb2F0dHJ9IEJvb2xlYW4gZmxhZyB3aGV0aGVyIHRvIHNldCAodHJ1ZSkgb3IgcmVtb3ZlIChmYWxzZSkgdGhlIGF0dHJpYnV0ZVxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbmtSZWxTZXRBdHRyKCRsaW5rLCBhdHRyLCBkb2F0dHIpIHtcbiAgICBsZXQgbGlua3JlbCA9ICRsaW5rLmF0dHIoJ3JlbCcpO1xuICAgIGxldCByZWxzID0gbGlua3JlbCA/IGxpbmtyZWwuc3BsaXQoJyAnKSA6IFtdO1xuICAgIGxldCBoYXNhdHRyID0gcmVscy5pbmRleE9mKGF0dHIpID49IDA7XG4gICAgaWYgKCFoYXNhdHRyICYmIGRvYXR0cikge1xuICAgICAgICByZWxzLnVuc2hpZnQoYXR0cik7XG4gICAgICAgICRsaW5rLmF0dHIoJ3JlbCcsIHJlbHMuam9pbignICcpKTtcbiAgICB9IGVsc2UgaWYgKGhhc2F0dHIgJiYgIWRvYXR0cikge1xuICAgICAgICByZWxzLnNwbGljZShyZWxzLmluZGV4T2YoYXR0cikpO1xuICAgICAgICAkbGluay5hdHRyKCdyZWwnLCByZWxzLmpvaW4oJyAnKSk7XG4gICAgfVxufTtcblxuLy8vLy8vLy8vLy8vLy8vLy8gUlNTIEZlZWQgR2VuZXJhdGlvblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVSU1MoY29uZmlnLCBjb25maWdyc3MsIGZlZWREYXRhLCBpdGVtcywgcmVuZGVyVG8pIHtcblxuICAgIC8vIFN1cHBvc2VkbHkgaXQncyByZXF1aXJlZCB0byB1c2UgaGFzT3duUHJvcGVydHlcbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzcyODM2MC9ob3ctZG8taS1jb3JyZWN0bHktY2xvbmUtYS1qYXZhc2NyaXB0LW9iamVjdCM3Mjg2OTRcbiAgICAvL1xuICAgIC8vIEJ1dCwgaW4gb3VyIGNhc2UgdGhhdCByZXN1bHRlZCBpbiBhbiBlbXB0eSBvYmplY3RcblxuICAgIC8vIGNvbnNvbGUubG9nKCdjb25maWdyc3MgJysgdXRpbC5pbnNwZWN0KGNvbmZpZ3JzcykpO1xuXG4gICAgLy8gQ29uc3RydWN0IGluaXRpYWwgcnNzIG9iamVjdFxuICAgIHZhciByc3MgPSB7fTtcbiAgICBmb3IgKGxldCBrZXkgaW4gY29uZmlncnNzLnJzcykge1xuICAgICAgICAvL2lmIChjb25maWdyc3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcnNzW2tleV0gPSBjb25maWdyc3MucnNzW2tleV07XG4gICAgICAgIC8vfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKCdyc3MgJysgdXRpbC5pbnNwZWN0KHJzcykpO1xuXG4gICAgLy8gY29uc29sZS5sb2coJ2ZlZWREYXRhICcrIHV0aWwuaW5zcGVjdChmZWVkRGF0YSkpO1xuXG4gICAgLy8gVGhlbiBmaWxsIGluIGZyb20gZmVlZERhdGFcbiAgICBmb3IgKGxldCBrZXkgaW4gZmVlZERhdGEpIHtcbiAgICAgICAgLy9pZiAoZmVlZERhdGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcnNzW2tleV0gPSBmZWVkRGF0YVtrZXldO1xuICAgICAgICAvL31cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZygnZ2VuZXJhdGVSU1MgcnNzICcrIHV0aWwuaW5zcGVjdChyc3MpKTtcblxuICAgIHZhciByc3NmZWVkID0gbmV3IFJTUyhyc3MpO1xuXG4gICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7IHJzc2ZlZWQuaXRlbShpdGVtKTsgfSk7XG5cbiAgICB2YXIgeG1sID0gcnNzZmVlZC54bWwoKTtcbiAgICB2YXIgcmVuZGVyT3V0ID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgcmVuZGVyVG8pO1xuXG4gICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJPdXQpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxuICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyT3V0LCB4bWwsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcblxufTtcblxuLy8gRm9yIG9FbWJlZCwgQ29uc2lkZXIgbWFraW5nIGFuIGV4dGVybmFsIHBsdWdpblxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvb2VtYmVkLWFsbFxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvZW1iZWRhYmxlXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9tZWRpYS1wYXJzZXJcbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL29lbWJldHRlclxuXG5cbi8qKlxuICogVGhlIEFrYXNoYVJlbmRlciBwcm9qZWN0IGNvbmZpZ3VyYXRpb24gb2JqZWN0LiAgXG4gKiBPbmUgaW5zdGFudGlhdGVzIGEgQ29uZmlndXJhdGlvbiBvYmplY3QsIHRoZW4gZmlsbHMgaXRcbiAqIHdpdGggc2V0dGluZ3MgYW5kIHBsdWdpbnMuXG4gKiBcbiAqIEBzZWUgbW9kdWxlOkNvbmZpZ3VyYXRpb25cbiAqL1xuXG4vLyBjb25zdCBfY29uZmlnX3BsdWdpbkRhdGEgPSBTeW1ib2woJ3BsdWdpbkRhdGEnKTtcbi8vIGNvbnN0IF9jb25maWdfYXNzZXRzRGlycyA9IFN5bWJvbCgnYXNzZXRzRGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19kb2N1bWVudERpcnMgPSBTeW1ib2woJ2RvY3VtZW50RGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19sYXlvdXREaXJzID0gU3ltYm9sKCdsYXlvdXREaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX3BhcnRpYWxEaXJzID0gU3ltYm9sKCdwYXJ0aWFsRGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19tYWhhZnVuY3MgPSBTeW1ib2woJ21haGFmdW5jcycpO1xuLy8gY29uc3QgX2NvbmZpZ19yZW5kZXJUbyA9IFN5bWJvbCgncmVuZGVyVG8nKTtcbi8vIGNvbnN0IF9jb25maWdfbWV0YWRhdGEgPSBTeW1ib2woJ21ldGFkYXRhJyk7XG4vLyBjb25zdCBfY29uZmlnX3Jvb3RfdXJsID0gU3ltYm9sKCdyb290X3VybCcpO1xuLy8gY29uc3QgX2NvbmZpZ19zY3JpcHRzID0gU3ltYm9sKCdzY3JpcHRzJyk7XG4vLyBjb25zdCBfY29uZmlnX3BsdWdpbnMgPSBTeW1ib2woJ3BsdWdpbnMnKTtcbi8vIGNvbnN0IF9jb25maWdfY2hlZXJpbyA9IFN5bWJvbCgnY2hlZXJpbycpO1xuLy8gY29uc3QgX2NvbmZpZ19jb25maWdkaXIgPSBTeW1ib2woJ2NvbmZpZ2RpcicpO1xuLy8gY29uc3QgX2NvbmZpZ19jYWNoZWRpciAgPSBTeW1ib2woJ2NhY2hlZGlyJyk7XG4vLyBjb25zdCBfY29uZmlnX2F1dG9sb2FkICA9IFN5bWJvbCgnYXV0b2xvYWQnKTtcbi8vIGNvbnN0IF9jb25maWdfYXV0b3NhdmUgID0gU3ltYm9sKCdhdXRvc2F2ZScpO1xuLy8gY29uc3QgX2NvbmZpZ19jb25jdXJyZW5jeSA9IFN5bWJvbCgnY29uY3VycmVuY3knKTtcbi8vIGNvbnN0IF9jb25maWdfcmVuZGVyZXJzID0gU3ltYm9sKCdyZW5kZXJlcnMnKTtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9mIGFuIEFrYXNoYVJlbmRlciBwcm9qZWN0LCBpbmNsdWRpbmcgdGhlIGlucHV0IGRpcmVjdG9yaWVzLFxuICogb3V0cHV0IGRpcmVjdG9yeSwgcGx1Z2lucywgYW5kIHZhcmlvdXMgc2V0dGluZ3MuXG4gKlxuICogVVNBR0U6XG4gKlxuICogY29uc3QgYWthc2hhID0gcmVxdWlyZSgnYWthc2hhcmVuZGVyJyk7XG4gKiBjb25zdCBjb25maWcgPSBuZXcgYWthc2hhLkNvbmZpZ3VyYXRpb24oKTtcbiAqL1xuZXhwb3J0IGNsYXNzIENvbmZpZ3VyYXRpb24ge1xuICAgICNyZW5kZXJlcnM6IFJlbmRlcmVycy5Db25maWd1cmF0aW9uO1xuICAgICNhdXRvbG9hZDogYm9vbGVhbjtcbiAgICAjYXV0b3NhdmU6IGJvb2xlYW47XG4gICAgI2NvbmZpZ2Rpcjogc3RyaW5nO1xuICAgICNjYWNoZWRpcjogc3RyaW5nO1xuICAgICNhc3NldHNEaXJzO1xuICAgICNsYXlvdXREaXJzO1xuICAgICNkb2N1bWVudERpcnM7XG4gICAgI3BhcnRpYWxEaXJzO1xuICAgICNtYWhhZnVuY3M7XG4gICAgI2NoZWVyaW87XG4gICAgI3JlbmRlclRvOiBzdHJpbmc7XG4gICAgI3NjcmlwdHM7XG4gICAgI2NvbmN1cnJlbmN5OiBudW1iZXI7XG4gICAgI21ldGFkYXRhOiBhbnk7XG4gICAgI3Jvb3RfdXJsOiBzdHJpbmc7XG4gICAgI3BsdWdpbnM7XG4gICAgI3BsdWdpbkRhdGE7XG4gICAgXG4gICAgY29uc3RydWN0b3IobW9kdWxlcGF0aCkge1xuXG4gICAgICAgIC8vIHRoaXNbX2NvbmZpZ19yZW5kZXJlcnNdID0gW107XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycyA9IG5ldyBSZW5kZXJlcnMuQ29uZmlndXJhdGlvbih7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy4jYXV0b2xvYWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jYXV0b3NhdmUgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MgPSBbXTtcbiAgICAgICAgdGhpcy4jc2NyaXB0cyA9IHtcbiAgICAgICAgICAgIHN0eWxlc2hlZXRzOiBbXSxcbiAgICAgICAgICAgIGphdmFTY3JpcHRUb3A6IFtdLFxuICAgICAgICAgICAgamF2YVNjcmlwdEJvdHRvbTogW11cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLiNjb25jdXJyZW5jeSA9IDM7XG5cbiAgICAgICAgdGhpcy4jZG9jdW1lbnREaXJzID0gW107XG4gICAgICAgIHRoaXMuI2xheW91dERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jcGFydGlhbERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jYXNzZXRzRGlycyA9IFtdO1xuXG4gICAgICAgIHRoaXMuI21haGFmdW5jcyA9IFtdO1xuXG4gICAgICAgIHRoaXMuI3JlbmRlclRvID0gJ291dCc7XG5cbiAgICAgICAgdGhpcy4jbWV0YWRhdGEgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgdGhpcy4jcGx1Z2lucyA9IFtdO1xuICAgICAgICB0aGlzLiNwbHVnaW5EYXRhID0gW107XG5cbiAgICAgICAgLypcbiAgICAgICAgICogSXMgdGhpcyB0aGUgYmVzdCBwbGFjZSBmb3IgdGhpcz8gIEl0IGlzIG5lY2Vzc2FyeSB0b1xuICAgICAgICAgKiBjYWxsIHRoaXMgZnVuY3Rpb24gc29tZXdoZXJlLiAgVGhlIG5hdHVyZSBvZiB0aGlzIGZ1bmN0aW9uXG4gICAgICAgICAqIGlzIHRoYXQgaXQgY2FuIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyB3aXRoIG5vIGltcGFjdC4gIFxuICAgICAgICAgKiBCeSBiZWluZyBsb2NhdGVkIGhlcmUsIGl0IHdpbGwgYWx3YXlzIGJlIGNhbGxlZCBieSB0aGVcbiAgICAgICAgICogdGltZSBhbnkgQ29uZmlndXJhdGlvbiBpcyBnZW5lcmF0ZWQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUaGlzIGlzIGV4ZWN1dGVkIGluIEBha2FzaGFjbXMvcmVuZGVyZXJzXG4gICAgICAgIC8vIHRoaXNbX2NvbmZpZ19yZW5kZXJlcnNdLnJlZ2lzdGVyQnVpbHRJblJlbmRlcmVycygpO1xuXG4gICAgICAgIC8vIFByb3ZpZGUgYSBtZWNoYW5pc20gdG8gZWFzaWx5IHNwZWNpZnkgY29uZmlnRGlyXG4gICAgICAgIC8vIFRoZSBwYXRoIGluIGNvbmZpZ0RpciBtdXN0IGJlIHRoZSBwYXRoIG9mIHRoZSBjb25maWd1cmF0aW9uIGZpbGUuXG4gICAgICAgIC8vIFRoZXJlIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIGEgd2F5IHRvIGRldGVybWluZSB0aGF0IGZyb20gaGVyZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRm9yIGV4YW1wbGUgbW9kdWxlLnBhcmVudC5maWxlbmFtZSBpbiB0aGlzIGNhc2UgcG9pbnRzXG4gICAgICAgIC8vIHRvIGFrYXNoYXJlbmRlci9pbmRleC5qcyBiZWNhdXNlIHRoYXQncyB0aGUgbW9kdWxlIHdoaWNoXG4gICAgICAgIC8vIGxvYWRlZCB0aGlzIG1vZHVsZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gT25lIGNvdWxkIGltYWdpbmUgYSBkaWZmZXJlbnQgaW5pdGlhbGl6YXRpb24gcGF0dGVybi4gIEluc3RlYWRcbiAgICAgICAgLy8gb2YgYWthc2hhcmVuZGVyIHJlcXVpcmluZyBDb25maWd1cmF0aW9uLmpzLCB0aGF0IGZpbGUgY291bGQgYmVcbiAgICAgICAgLy8gcmVxdWlyZWQgYnkgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZS4gIEluIHN1Y2ggYSBjYXNlXG4gICAgICAgIC8vIG1vZHVsZS5wYXJlbnQuZmlsZW5hbWUgV09VTEQgaW5kaWNhdGUgdGhlIGZpbGVuYW1lIGZvciB0aGVcbiAgICAgICAgLy8gY29uZmlndXJhdGlvbiBmaWxlLCBhbmQgd291bGQgYmUgYSBzb3VyY2Ugb2Ygc2V0dGluZ1xuICAgICAgICAvLyB0aGUgY29uZmlnRGlyIHZhbHVlLlxuICAgICAgICBpZiAodHlwZW9mIG1vZHVsZXBhdGggIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZXBhdGggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnRGlyID0gcGF0aC5kaXJuYW1lKG1vZHVsZXBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVyeSBjYXJlZnVsbHkgYWRkIHRoZSA8cGFydGlhbD4gc3VwcG9ydCBmcm9tIE1haGFiaHV0YSBhcyB0aGVcbiAgICAgICAgLy8gdmVyeSBmaXJzdCB0aGluZyBzbyB0aGF0IGl0IGV4ZWN1dGVzIGJlZm9yZSBhbnl0aGluZyBlbHNlLlxuICAgICAgICBsZXQgY29uZmlnID0gdGhpcztcbiAgICAgICAgdGhpcy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZm5hbWUsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGRlZmF1bHQgY29uZmlndXJhdGlvbiB2YWx1ZXMgZm9yIGFueXRoaW5nIHdoaWNoIGhhcyBub3RcbiAgICAgKiBhbHJlYWR5IGJlZW4gY29uZmlndXJlZC4gIFNvbWUgYnVpbHQtaW4gZGVmYXVsdHMgaGF2ZSBiZWVuIGRlY2lkZWRcbiAgICAgKiBhaGVhZCBvZiB0aW1lLiAgRm9yIGVhY2ggY29uZmlndXJhdGlvbiBzZXR0aW5nLCBpZiBub3RoaW5nIGhhcyBiZWVuXG4gICAgICogZGVjbGFyZWQsIHRoZW4gdGhlIGRlZmF1bHQgaXMgc3Vic3RpdHV0ZWQuXG4gICAgICpcbiAgICAgKiBJdCBpcyBleHBlY3RlZCB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGxhc3QgaW4gdGhlIGNvbmZpZyBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBpbnN0YWxscyB0aGUgYGJ1aWx0LWluYCBwbHVnaW4uICBJdCBuZWVkcyB0byBiZSBsYXN0IG9uXG4gICAgICogdGhlIHBsdWdpbiBjaGFpbiBzbyB0aGF0IGl0cyBzdHlsZXNoZWV0cyBhbmQgcGFydGlhbHMgYW5kIHdoYXRub3RcbiAgICAgKiBjYW4gYmUgb3ZlcnJpZGRlbiBieSBvdGhlciBwbHVnaW5zLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgcHJlcGFyZSgpIHtcblxuICAgICAgICBjb25zdCBDT05GSUcgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IGNvbmZpZ0RpclBhdGggPSBmdW5jdGlvbihkaXJubSkge1xuICAgICAgICAgICAgbGV0IGNvbmZpZ1BhdGggPSBkaXJubTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgQ09ORklHLmNvbmZpZ0RpciAhPT0gJ3VuZGVmaW5lZCcgJiYgQ09ORklHLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnUGF0aCA9IHBhdGguam9pbihDT05GSUcuY29uZmlnRGlyLCBkaXJubSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29uZmlnUGF0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzdGF0O1xuXG4gICAgICAgIGNvbnN0IGNhY2hlRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdjYWNoZScpO1xuICAgICAgICBpZiAoIXRoaXMuI2NhY2hlZGlyKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjYWNoZURpcnNQYXRoKVxuICAgICAgICAgICAgICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoY2FjaGVEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhY2hlRGlyID0gJ2NhY2hlJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInY2FjaGUnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhjYWNoZURpcnNQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlRGlyID0gJ2NhY2hlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNjYWNoZWRpciAmJiAhZnMuZXhpc3RzU3luYyh0aGlzLiNjYWNoZWRpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLiNjYWNoZWRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldHNEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2Fzc2V0cycpO1xuICAgICAgICBpZiAoIXRoaXMuI2Fzc2V0c0RpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGFzc2V0c0RpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGFzc2V0c0RpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQXNzZXRzRGlyKCdhc3NldHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXlvdXRzRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdsYXlvdXRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jbGF5b3V0RGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobGF5b3V0c0RpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGxheW91dHNEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZExheW91dHNEaXIoJ2xheW91dHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJ0aWFsRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdwYXJ0aWFscycpO1xuICAgICAgICBpZiAoIW1haGFQYXJ0aWFsLmNvbmZpZ3VyYXRpb24ucGFydGlhbERpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhcnRpYWxEaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhwYXJ0aWFsRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRQYXJ0aWFsc0RpcigncGFydGlhbHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2N1bWVudERpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnZG9jdW1lbnRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jZG9jdW1lbnREaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhkb2N1bWVudERpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGRvY3VtZW50RGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGREb2N1bWVudHNEaXIoJ2RvY3VtZW50cycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidkb2N1bWVudHMnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vICdkb2N1bWVudERpcnMnIHNldHRpbmcsIGFuZCBubyAnZG9jdW1lbnRzJyBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZW5kZXJUb1BhdGggPSBjb25maWdEaXJQYXRoKCdvdXQnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNyZW5kZXJUbykgIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHJlbmRlclRvUGF0aClcbiAgICAgICAgICAgICAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKHJlbmRlclRvUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFJlbmRlckRlc3RpbmF0aW9uKCdvdXQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInb3V0JyBpcyBub3QgYSBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmMocmVuZGVyVG9QYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFJlbmRlckRlc3RpbmF0aW9uKCdvdXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNyZW5kZXJUbyAmJiAhZnMuZXhpc3RzU3luYyh0aGlzLiNyZW5kZXJUbykpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLiNyZW5kZXJUbywgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgYWthc2hhY21zLWJ1aWx0aW4gcGx1Z2luIG5lZWRzIHRvIGJlIGxhc3Qgb24gdGhlIGNoYWluIHNvIHRoYXRcbiAgICAgICAgLy8gaXRzIHBhcnRpYWxzIGV0YyBjYW4gYmUgZWFzaWx5IG92ZXJyaWRkZW4uICBUaGlzIGlzIHRoZSBtb3N0IGNvbnZlbmllbnRcbiAgICAgICAgLy8gcGxhY2UgdG8gZGVjbGFyZSB0aGF0IHBsdWdpbi5cbiAgICAgICAgLy9cblxuICAgICAgICAvLyBOb3JtYWxseSB3ZSdkIGRvIHJlcXVpcmUoJy4vYnVpbHQtaW4uanMnKS5cbiAgICAgICAgLy8gQnV0LCBpbiB0aGlzIGNvbnRleHQgdGhhdCBkb2Vzbid0IHdvcmsuXG4gICAgICAgIC8vIFdoYXQgd2UgZGlkIGlzIHRvIGltcG9ydCB0aGVcbiAgICAgICAgLy8gQnVpbHRJblBsdWdpbiBjbGFzcyBlYXJsaWVyIHNvIHRoYXRcbiAgICAgICAgLy8gaXQgY2FuIGJlIHVzZWQgaGVyZS5cbiAgICAgICAgdGhpcy51c2UoQnVpbHRJblBsdWdpbiwge1xuICAgICAgICAgICAgLy8gYnVpbHQtaW4gb3B0aW9ucyBpZiBhbnlcbiAgICAgICAgICAgIC8vIERvIG5vdCBuZWVkIHRoaXMgaGVyZSBhbnkgbG9uZ2VyIGJlY2F1c2UgaXQgaXMgaGFuZGxlZFxuICAgICAgICAgICAgLy8gaW4gdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgICAgICAgLy8gU2V0IHVwIHRoZSBNYWhhYmh1dGEgcGFydGlhbCB0YWcgc28gaXQgcmVuZGVycyB0aHJvdWdoIEFrYXNoYVJlbmRlclxuICAgICAgICAgICAgLy8gcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZm5hbWUsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHJlbmRlci5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjb3JkIHRoZSBjb25maWd1cmF0aW9uIGRpcmVjdG9yeSBzbyB0aGF0IHdlIGNhbiBjb3JyZWN0bHkgaW50ZXJwb2xhdGVcbiAgICAgKiB0aGUgcGF0aG5hbWVzIHdlJ3JlIHByb3ZpZGVkLlxuICAgICAqL1xuICAgIHNldCBjb25maWdEaXIoY2ZnZGlyKSB7IHRoaXMuI2NvbmZpZ2RpciA9IGNmZ2RpcjsgfVxuICAgIGdldCBjb25maWdEaXIoKSB7IHJldHVybiB0aGlzLiNjb25maWdkaXI7IH1cblxuICAgIHNldCBjYWNoZURpcihkaXJubSkgeyB0aGlzLiNjYWNoZWRpciA9IGRpcm5tOyB9XG4gICAgZ2V0IGNhY2hlRGlyKCkgeyByZXR1cm4gdGhpcy4jY2FjaGVkaXI7IH1cblxuICAgIGdldCBjYWNoZUF1dG9zYXZlKCkgeyByZXR1cm4gdGhpcy4jYXV0b3NhdmU7IH1cbiAgICBzZXQgY2FjaGVBdXRvc2F2ZShhdXRvKSB7IHRoaXMuI2F1dG9zYXZlID0gYXV0bzsgfVxuXG4gICAgZ2V0IGNhY2hlQXV0b2xvYWQoKSB7IHJldHVybiB0aGlzLiNhdXRvbG9hZDsgfVxuICAgIHNldCBjYWNoZUF1dG9sb2FkKGF1dG8pIHsgdGhpcy4jYXV0b2xvYWQgPSBhdXRvOyB9XG5cbiAgICAvLyBzZXQgYWthc2hhKF9ha2FzaGEpICB7IHRoaXNbX2NvbmZpZ19ha2FzaGFdID0gX2FrYXNoYTsgfVxuICAgIGdldCBha2FzaGEoKSB7IHJldHVybiBtb2R1bGVfZXhwb3J0czsgfVxuXG4gICAgYXN5bmMgZG9jdW1lbnRzQ2FjaGUoKSB7IHJldHVybiBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7IH1cbiAgICBhc3luYyBhc3NldHNDYWNoZSgpICAgIHsgcmV0dXJuIGZpbGVjYWNoZS5hc3NldHNDYWNoZTsgfVxuICAgIGFzeW5jIGxheW91dHNDYWNoZSgpICAgeyByZXR1cm4gZmlsZWNhY2hlLmxheW91dHNDYWNoZTsgfVxuICAgIGFzeW5jIHBhcnRpYWxzQ2FjaGUoKSAgeyByZXR1cm4gZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGU7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgZG9jdW1lbnREaXJzIGNvbmZpZ3VyYXRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlyIFRoZSBwYXRobmFtZSB0byB1c2VcbiAgICAgKi9cbiAgICBhZGREb2N1bWVudHNEaXIoZGlyKSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJyAmJiAhcGF0aC5pc0Fic29sdXRlKGRpcikpIHtcbiAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkaXIgPT09ICdvYmplY3QnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykpIHtcbiAgICAgICAgICAgICAgICBkaXIuc3JjID0gcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNkb2N1bWVudERpcnMucHVzaChkaXIpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgYWRkRG9jdW1lbnRzRGlyICR7dXRpbC5pbnNwZWN0KGRpcil9ID09PiAke3V0aWwuaW5zcGVjdCh0aGlzW19jb25maWdfZG9jdW1lbnREaXJzXSl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBkb2N1bWVudERpcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiNkb2N1bWVudERpcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9vayB1cCB0aGUgZG9jdW1lbnQgZGlyZWN0b3J5IGluZm9ybWF0aW9uIGZvciBhIGdpdmVuIGRvY3VtZW50IGRpcmVjdG9yeS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlybmFtZSBUaGUgZG9jdW1lbnQgZGlyZWN0b3J5IHRvIHNlYXJjaCBmb3JcbiAgICAgKi9cbiAgICBkb2N1bWVudERpckluZm8oZGlybmFtZSkge1xuICAgICAgICBmb3IgKHZhciBkb2NEaXIgb2YgdGhpcy5kb2N1bWVudERpcnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jRGlyID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGlmIChkb2NEaXIuc3JjID09PSBkaXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2NEaXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChkb2NEaXIgPT09IGRpcm5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jRGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBsYXlvdXREaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqL1xuICAgIGFkZExheW91dHNEaXIoZGlyKSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJyAmJiAhcGF0aC5pc0Fic29sdXRlKGRpcikpIHtcbiAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkaXIgPT09ICdvYmplY3QnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykpIHtcbiAgICAgICAgICAgICAgICBkaXIuc3JjID0gcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNsYXlvdXREaXJzLnB1c2goZGlyKTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLmFkZExheW91dERpcihkaXIuc3JjID8gZGlyLnNyYyA6IGRpcik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBhZGRMYXlvdXRzRGlyICR7dXRpbC5pbnNwZWN0KGRpcil9IGxheW91dERpcnMgJHt1dGlsLmluc3BlY3QodGhpcy4jbGF5b3V0RGlycyl9IFJlbmRlcmVycyBsYXlvdXREaXJzICR7dXRpbC5pbnNwZWN0KHRoaXMuI3JlbmRlcmVycy5sYXlvdXREaXJzKX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGxheW91dERpcnMoKSB7IHJldHVybiB0aGlzLiNsYXlvdXREaXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIHBhcnRpYWxEaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZFBhcnRpYWxzRGlyKGRpcikge1xuICAgICAgICAvLyBJZiB3ZSBoYXZlIGEgY29uZmlnRGlyLCBhbmQgaXQncyBhIHJlbGF0aXZlIGRpcmVjdG9yeSwgbWFrZSBpdFxuICAgICAgICAvLyByZWxhdGl2ZSB0byB0aGUgY29uZmlnRGlyXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycgJiYgIXBhdGguaXNBYnNvbHV0ZShkaXIpKSB7XG4gICAgICAgICAgICAgICAgZGlyID0gcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZGlyID09PSAnb2JqZWN0JyAmJiAhcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpKSB7XG4gICAgICAgICAgICAgICAgZGlyLnNyYyA9IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGFkZFBhcnRpYWxzRGlyIGAsIGRpcik7XG4gICAgICAgIHRoaXMuI3BhcnRpYWxEaXJzLnB1c2goZGlyKTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLmFkZFBhcnRpYWxEaXIoZGlyLnNyYyA/IGRpci5zcmMgOiBkaXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcGFydGlhbHNEaXJzKCkgeyByZXR1cm4gdGhpcy4jcGFydGlhbERpcnM7IH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIGFzc2V0RGlycyBjb25maWd1cnRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlyIFRoZSBwYXRobmFtZSB0byB1c2VcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRBc3NldHNEaXIoZGlyKSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJyAmJiAhcGF0aC5pc0Fic29sdXRlKGRpcikpIHtcbiAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkaXIgPT09ICdvYmplY3QnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykpIHtcbiAgICAgICAgICAgICAgICBkaXIuc3JjID0gcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNhc3NldHNEaXJzLnB1c2goZGlyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGFzc2V0RGlycygpIHsgcmV0dXJuIHRoaXMuI2Fzc2V0c0RpcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhbiBhcnJheSBvZiBNYWhhYmh1dGEgZnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheX0gbWFoYWZ1bmNzXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkTWFoYWJodXRhKG1haGFmdW5jcykge1xuICAgICAgICBpZiAodHlwZW9mIG1haGFmdW5jcyA9PT0gJ3VuZGVmaW5lZCcgfHwgIW1haGFmdW5jcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmRlZmluZWQgbWFoYWZ1bmNzIGluICR7dGhpcy5jb25maWdEaXJ9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jbWFoYWZ1bmNzLnB1c2gobWFoYWZ1bmNzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IG1haGFmdW5jcygpIHsgcmV0dXJuIHRoaXMuI21haGFmdW5jczsgfVxuXG4gICAgLyoqXG4gICAgICogRGVmaW5lIHRoZSBkaXJlY3RvcnkgaW50byB3aGljaCB0aGUgcHJvamVjdCBpcyByZW5kZXJlZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlyIFRoZSBwYXRobmFtZSB0byB1c2VcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBzZXRSZW5kZXJEZXN0aW5hdGlvbihkaXIpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBpZiAodGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyKSkge1xuICAgICAgICAgICAgICAgIGRpciA9IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNyZW5kZXJUbyA9IGRpcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIEZldGNoIHRoZSBkZWNsYXJlZCBkZXN0aW5hdGlvbiBmb3IgcmVuZGVyaW5nIHRoZSBwcm9qZWN0LiAqL1xuICAgIGdldCByZW5kZXJEZXN0aW5hdGlvbigpIHsgcmV0dXJuIHRoaXMuI3JlbmRlclRvOyB9XG4gICAgZ2V0IHJlbmRlclRvKCkgeyByZXR1cm4gdGhpcy4jcmVuZGVyVG87IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHZhbHVlIHRvIHRoZSBwcm9qZWN0IG1ldGFkYXRhLiAgVGhlIG1ldGFkYXRhIGlzIGNvbWJpbmVkIHdpdGhcbiAgICAgKiB0aGUgZG9jdW1lbnQgbWV0YWRhdGEgYW5kIHVzZWQgZHVyaW5nIHJlbmRlcmluZy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5kZXggVGhlIGtleSB0byBzdG9yZSB0aGUgdmFsdWUuXG4gICAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBzdG9yZSBpbiB0aGUgbWV0YWRhdGEuXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkTWV0YWRhdGEoaW5kZXgsIHZhbHVlKSB7XG4gICAgICAgIHZhciBtZCA9IHRoaXMuI21ldGFkYXRhO1xuICAgICAgICBtZFtpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IG1ldGFkYXRhKCkgeyByZXR1cm4gdGhpcy4jbWV0YWRhdGE7IH1cblxuICAgIC8qKlxuICAgICogRG9jdW1lbnQgdGhlIFVSTCBmb3IgYSB3ZWJzaXRlIHByb2plY3QuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gcm9vdF91cmxcbiAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICovXG4gICAgcm9vdFVSTChyb290X3VybCkge1xuICAgICAgICB0aGlzLiNyb290X3VybCA9IHJvb3RfdXJsO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcm9vdF91cmwoKSB7IHJldHVybiB0aGlzLiNyb290X3VybDsgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IGhvdyBtYW55IGRvY3VtZW50cyB0byByZW5kZXIgY29uY3VycmVudGx5LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb25jdXJyZW5jeVxuICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgc2V0Q29uY3VycmVuY3koY29uY3VycmVuY3kpIHtcbiAgICAgICAgdGhpcy4jY29uY3VycmVuY3kgPSBjb25jdXJyZW5jeTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGNvbmN1cnJlbmN5KCkgeyByZXR1cm4gdGhpcy4jY29uY3VycmVuY3k7IH1cblxuICAgIC8qKlxuICAgICAqIERlY2xhcmUgSmF2YVNjcmlwdCB0byBhZGQgd2l0aGluIHRoZSBoZWFkIHRhZyBvZiByZW5kZXJlZCBwYWdlcy5cbiAgICAgKiBAcGFyYW0gc2NyaXB0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkSGVhZGVySmF2YVNjcmlwdChzY3JpcHQpIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5qYXZhU2NyaXB0VG9wLnB1c2goc2NyaXB0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHNjcmlwdHMoKSB7IHJldHVybiB0aGlzLiNzY3JpcHRzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsYXJlIEphdmFTY3JpcHQgdG8gYWRkIGF0IHRoZSBib3R0b20gb2YgcmVuZGVyZWQgcGFnZXMuXG4gICAgICogQHBhcmFtIHNjcmlwdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEZvb3RlckphdmFTY3JpcHQoc2NyaXB0KSB7XG4gICAgICAgIHRoaXMuI3NjcmlwdHMuamF2YVNjcmlwdEJvdHRvbS5wdXNoKHNjcmlwdCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlY2xhcmUgYSBDU1MgU3R5bGVzaGVldCB0byBhZGQgd2l0aGluIHRoZSBoZWFkIHRhZyBvZiByZW5kZXJlZCBwYWdlcy5cbiAgICAgKiBAcGFyYW0gc2NyaXB0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkU3R5bGVzaGVldChjc3MpIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5zdHlsZXNoZWV0cy5wdXNoKGNzcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldE1haGFiaHV0YUNvbmZpZyhjaGVlcmlvKSB7XG4gICAgICAgIHRoaXMuI2NoZWVyaW8gPSBjaGVlcmlvO1xuXG4gICAgICAgIC8vIEZvciBjaGVlcmlvIDEuMC4wLXJjLjEwIHdlIG5lZWQgdG8gdXNlIHRoaXMgc2V0dGluZy5cbiAgICAgICAgLy8gSWYgdGhlIGNvbmZpZ3VyYXRpb24gaGFzIHNldCB0aGlzLCB3ZSBtdXN0IG5vdFxuICAgICAgICAvLyBvdmVycmlkZSB0aGVpciBzZXR0aW5nLiAgQnV0LCBnZW5lcmFsbHksIGZvciBjb3JyZWN0XG4gICAgICAgIC8vIG9wZXJhdGlvbiBhbmQgaGFuZGxpbmcgb2YgTWFoYWJodXRhIHRhZ3MsIHdlIG5lZWRcbiAgICAgICAgLy8gdGhpcyBzZXR0aW5nIHRvIGJlIDxjb2RlPnRydWU8L2NvZGU+XG4gICAgICAgIGlmICghKCdfdXNlSHRtbFBhcnNlcjInIGluIHRoaXMuI2NoZWVyaW8pKSB7XG4gICAgICAgICAgICB0aGlzLiNjaGVlcmlvLl91c2VIdG1sUGFyc2VyMiA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzW19jb25maWdfY2hlZXJpb10pO1xuICAgIH1cblxuICAgIGdldCBtYWhhYmh1dGFDb25maWcoKSB7IHJldHVybiB0aGlzLiNjaGVlcmlvOyB9XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IHRoZSBjb250ZW50cyBvZiBhbGwgZGlyZWN0b3JpZXMgaW4gYXNzZXREaXJzIHRvIHRoZSByZW5kZXIgZGVzdGluYXRpb24uXG4gICAgICovXG4gICAgYXN5bmMgY29weUFzc2V0cygpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2NvcHlBc3NldHMgU1RBUlQnKTtcblxuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBjb25zdCBhc3NldHMgPSBmaWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIC8vIEZldGNoIHRoZSBsaXN0IG9mIGFsbCBhc3NldHMgZmlsZXNcbiAgICAgICAgY29uc3QgcGF0aHMgPSBhd2FpdCBhc3NldHMucGF0aHMoKTtcblxuICAgICAgICAvLyBUaGUgd29yayB0YXNrIGlzIHRvIGNvcHkgZWFjaCBmaWxlXG4gICAgICAgIGNvbnN0IHF1ZXVlID0gZmFzdHEucHJvbWlzZShhc3luYyBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzICR7Y29uZmlnLnJlbmRlclRvfSAke2l0ZW0ucmVuZGVyUGF0aH1gKTtcbiAgICAgICAgICAgICAgICBsZXQgZGVzdEZOID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJUbywgaXRlbS5yZW5kZXJQYXRoKTtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKGRlc3RGTiksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIC8vIENvcHkgZnJvbSB0aGUgYWJzb2x1dGUgcGF0aG5hbWUsIHRvIHRoZSBjb21wdXRlZCBcbiAgICAgICAgICAgICAgICAvLyBsb2NhdGlvbiB3aXRoaW4gdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeVxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzICR7aXRlbS5mc3BhdGh9ID09PiAke2Rlc3RGTn1gKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AuY3AoaXRlbS5mc3BhdGgsIGRlc3RGTiwge1xuICAgICAgICAgICAgICAgICAgICBmb3JjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY29weUFzc2V0cyBGQUlMIHRvIGNvcHkgJHtpdGVtLmZzcGF0aH0gJHtpdGVtLnZwYXRofSAke2l0ZW0ucmVuZGVyUGF0aH0gJHtjb25maWcucmVuZGVyVG99IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwKTtcblxuICAgICAgICAvLyBQdXNoIHRoZSBsaXN0IG9mIGFzc2V0IGZpbGVzIGludG8gdGhlIHF1ZXVlXG4gICAgICAgIC8vIEJlY2F1c2UgcXVldWUucHVzaCByZXR1cm5zIFByb21pc2UncyB3ZSBlbmQgdXAgd2l0aFxuICAgICAgICAvLyBhbiBhcnJheSBvZiBQcm9taXNlIG9iamVjdHNcbiAgICAgICAgY29uc3Qgd2FpdEZvciA9IFtdO1xuICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBwYXRocykge1xuICAgICAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGlzIHdhaXRzIGZvciBhbGwgUHJvbWlzZSdzIHRvIGZpbmlzaFxuICAgICAgICAvLyBCdXQgaWYgdGhlcmUgd2VyZSBubyBQcm9taXNlJ3MsIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICBpZiAod2FpdEZvci5sZW5ndGggPiAwKSBhd2FpdCBQcm9taXNlLmFsbCh3YWl0Rm9yKTtcbiAgICAgICAgLy8gVGhlcmUgYXJlIG5vIHJlc3VsdHMgaW4gdGhpcyBjYXNlIHRvIGNhcmUgYWJvdXRcbiAgICAgICAgLy8gY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICAvLyBmb3IgKGxldCByZXN1bHQgb2Ygd2FpdEZvcikge1xuICAgICAgICAvLyAgICByZXN1bHRzLnB1c2goYXdhaXQgcmVzdWx0KTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGwgdGhlIGJlZm9yZVNpdGVSZW5kZXJlZCBmdW5jdGlvbiBvZiBhbnkgcGx1Z2luIHdoaWNoIGhhcyB0aGF0IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4uYmVmb3JlU2l0ZVJlbmRlcmVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBiZWZvcmVTaXRlUmVuZGVyZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uYmVmb3JlU2l0ZVJlbmRlcmVkKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsIHRoZSBvblNpdGVSZW5kZXJlZCBmdW5jdGlvbiBvZiBhbnkgcGx1Z2luIHdoaWNoIGhhcyB0aGF0IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGhvb2tTaXRlUmVuZGVyZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdob29rU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25TaXRlUmVuZGVyZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uU2l0ZVJlbmRlcmVkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uU2l0ZVJlbmRlcmVkKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZUFkZGVkKGNvbGxlY3Rpb24sIHZwaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaG9va0ZpbGVBZGRlZCAke2NvbGxlY3Rpb259ICR7dnBpbmZvLnZwYXRofWApO1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUFkZGVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvbkZpbGVBZGRlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vbkZpbGVBZGRlZChjb25maWcsIGNvbGxlY3Rpb24sIHZwaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZUNoYW5nZWQoY29sbGVjdGlvbiwgdnBpbmZvKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlQ2hhbmdlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25GaWxlQ2hhbmdlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vbkZpbGVDaGFuZ2VkKGNvbmZpZywgY29sbGVjdGlvbiwgdnBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlVW5saW5rZWQoY29sbGVjdGlvbiwgdnBpbmZvKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlVW5saW5rZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uRmlsZVVubGlua2VkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZVVubGlua2VkKGNvbmZpZywgY29sbGVjdGlvbiwgdnBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQ2FjaGVTZXR1cChjb2xsZWN0aW9ubm0sIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVDYWNoZVNldHVwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vbkZpbGVDYWNoZVNldHVwKGNvbmZpZywgY29sbGVjdGlvbm5tLCBjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tQbHVnaW5DYWNoZVNldHVwKCkge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uUGx1Z2luQ2FjaGVTZXR1cCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25QbHVnaW5DYWNoZVNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB1c2UgLSBnbyB0aHJvdWdoIHBsdWdpbnMgYXJyYXksIGFkZGluZyBlYWNoIHRvIHRoZSBwbHVnaW5zIGFycmF5IGluXG4gICAgICogdGhlIGNvbmZpZyBmaWxlLCB0aGVuIGNhbGxpbmcgdGhlIGNvbmZpZyBmdW5jdGlvbiBvZiBlYWNoIHBsdWdpbi5cbiAgICAgKiBAcGFyYW0gUGx1Z2luT2JqIFRoZSBwbHVnaW4gbmFtZSBvciBvYmplY3QgdG8gYWRkXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgdXNlKFBsdWdpbk9iaiwgb3B0aW9ucykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkNvbmZpZ3VyYXRpb24gIzEgdXNlIFBsdWdpbk9iaiBcIisgdHlwZW9mIFBsdWdpbk9iaiArXCIgXCIrIHV0aWwuaW5zcGVjdChQbHVnaW5PYmopKTtcbiAgICAgICAgaWYgKHR5cGVvZiBQbHVnaW5PYmogPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGdvaW5nIHRvIGZhaWwgYmVjYXVzZVxuICAgICAgICAgICAgLy8gcmVxdWlyZSBkb2Vzbid0IHdvcmsgaW4gdGhpcyBjb250ZXh0XG4gICAgICAgICAgICAvLyBGdXJ0aGVyLCB0aGlzIGNvbnRleHQgZG9lcyBub3RcbiAgICAgICAgICAgIC8vIHN1cHBvcnQgYXN5bmMgZnVuY3Rpb25zLCBzbyB3ZVxuICAgICAgICAgICAgLy8gY2Fubm90IGRvIGltcG9ydC5cbiAgICAgICAgICAgIFBsdWdpbk9iaiA9IHJlcXVpcmUoUGx1Z2luT2JqKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIVBsdWdpbk9iaiB8fCBQbHVnaW5PYmogaW5zdGFuY2VvZiBQbHVnaW4pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHBsdWdpbiBzdXBwbGllZFwiKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkNvbmZpZ3VyYXRpb24gIzIgdXNlIFBsdWdpbk9iaiBcIisgdHlwZW9mIFBsdWdpbk9iaiArXCIgXCIrIHV0aWwuaW5zcGVjdChQbHVnaW5PYmopKTtcbiAgICAgICAgdmFyIHBsdWdpbiA9IG5ldyBQbHVnaW5PYmooKTtcbiAgICAgICAgcGx1Z2luLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICB0aGlzLiNwbHVnaW5zLnB1c2gocGx1Z2luKTtcbiAgICAgICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgICAgIHBsdWdpbi5jb25maWd1cmUodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBwbHVnaW5zKCkgeyByZXR1cm4gdGhpcy4jcGx1Z2luczsgfVxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZSBvdmVyIHRoZSBpbnN0YWxsZWQgcGx1Z2lucywgY2FsbGluZyB0aGUgZnVuY3Rpb24gcGFzc2VkIGluIGBpdGVyYXRvcmBcbiAgICAgKiBmb3IgZWFjaCBwbHVnaW4sIHRoZW4gY2FsbGluZyB0aGUgZnVuY3Rpb24gcGFzc2VkIGluIGBmaW5hbGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaXRlcmF0b3IgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggcGx1Z2luLiAgU2lnbmF0dXJlOiBgZnVuY3Rpb24ocGx1Z2luLCBuZXh0KWAgIFRoZSBgbmV4dGAgcGFyYW1ldGVyIGlzIGEgZnVuY3Rpb24gdXNlZCB0byBpbmRpY2F0ZSBlcnJvciAtLSBgbmV4dChlcnIpYCAtLSBvciBzdWNjZXNzIC0tIG5leHQoKVxuICAgICAqIEBwYXJhbSBmaW5hbCBUaGUgZnVuY3Rpb24gdG8gY2FsbCBhZnRlciBhbGwgaXRlcmF0b3IgY2FsbHMgaGF2ZSBiZWVuIG1hZGUuICBTaWduYXR1cmU6IGBmdW5jdGlvbihlcnIpYFxuICAgICAqL1xuICAgIGVhY2hQbHVnaW4oaXRlcmF0b3IsIGZpbmFsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImVhY2hQbHVnaW4gZGVwcmVjYXRlZFwiKTtcbiAgICAgICAgLyogYXN5bmMuZWFjaFNlcmllcyh0aGlzLnBsdWdpbnMsXG4gICAgICAgIGZ1bmN0aW9uKHBsdWdpbiwgbmV4dCkge1xuICAgICAgICAgICAgaXRlcmF0b3IocGx1Z2luLCBuZXh0KTtcbiAgICAgICAgfSxcbiAgICAgICAgZmluYWwpOyAqL1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvb2sgZm9yIGEgcGx1Z2luLCByZXR1cm5pbmcgaXRzIG1vZHVsZSByZWZlcmVuY2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiBAcmV0dXJucyB7UGx1Z2lufVxuICAgICAqL1xuICAgIHBsdWdpbihuYW1lKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdjb25maWcucGx1Z2luOiAnKyB1dGlsLmluc3BlY3QodGhpcy5fcGx1Z2lucykpO1xuICAgICAgICBpZiAoISB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgcGx1Z2luS2V5IGluIHRoaXMucGx1Z2lucykge1xuICAgICAgICAgICAgdmFyIHBsdWdpbiA9IHRoaXMucGx1Z2luc1twbHVnaW5LZXldO1xuICAgICAgICAgICAgaWYgKHBsdWdpbi5uYW1lID09PSBuYW1lKSByZXR1cm4gcGx1Z2luO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGBXQVJOSU5HOiBEaWQgbm90IGZpbmQgcGx1Z2luICR7bmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgcGx1Z2luRGF0YSBvYmplY3QgZm9yIHRoZSBuYW1lZCBwbHVnaW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAqLyBcbiAgICBwbHVnaW5EYXRhKG5hbWUpIHtcbiAgICAgICAgdmFyIHBsdWdpbkRhdGFBcnJheSA9IHRoaXMuI3BsdWdpbkRhdGE7XG4gICAgICAgIGlmICghKG5hbWUgaW4gcGx1Z2luRGF0YUFycmF5KSkge1xuICAgICAgICAgICAgcGx1Z2luRGF0YUFycmF5W25hbWVdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBsdWdpbkRhdGFBcnJheVtuYW1lXTtcbiAgICB9XG5cbiAgICBhc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWYoaHJlZikge1xuICAgICAgICBmb3IgKHZhciBwbHVnaW4gb2YgdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5pc0xlZ2l0TG9jYWxIcmVmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGlmIChwbHVnaW4uaXNMZWdpdExvY2FsSHJlZih0aGlzLCBocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyUmVuZGVyZXIocmVuZGVyZXIpIHtcbiAgICAgICAgaWYgKCEocmVuZGVyZXIgaW5zdGFuY2VvZiBSZW5kZXJlcikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vdCBBIFJlbmRlcmVyICcrIHV0aWwuaW5zcGVjdChyZW5kZXJlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb3QgYSBSZW5kZXJlciAke3JlbmRlcmVyLm5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmZpbmRSZW5kZXJlck5hbWUocmVuZGVyZXIubmFtZSkpIHtcbiAgICAgICAgICAgIC8vIHJlbmRlcmVyLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICAgICAgLy8gcmVuZGVyZXIuY29uZmlnID0gdGhpcztcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZWdpc3RlclJlbmRlcmVyIGAsIHJlbmRlcmVyKTtcbiAgICAgICAgICAgIHRoaXMuI3JlbmRlcmVycy5yZWdpc3RlclJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFsbG93IGFuIGFwcGxpY2F0aW9uIHRvIG92ZXJyaWRlIG9uZSBvZiB0aGUgYnVpbHQtaW4gcmVuZGVyZXJzXG4gICAgICogdGhhdCBhcmUgaW5pdGlhbGl6ZWQgYmVsb3cuICBUaGUgaW5zcGlyYXRpb24gaXMgZXB1YnRvb2xzIHRoYXRcbiAgICAgKiBtdXN0IHdyaXRlIEhUTUwgZmlsZXMgd2l0aCBhbiAueGh0bWwgZXh0ZW5zaW9uLiAgVGhlcmVmb3JlIGl0XG4gICAgICogY2FuIHN1YmNsYXNzIEVKU1JlbmRlcmVyIGV0YyB3aXRoIGltcGxlbWVudGF0aW9ucyB0aGF0IGZvcmNlIHRoZVxuICAgICAqIGZpbGUgbmFtZSB0byBiZSAueGh0bWwuICBXZSdyZSBub3QgY2hlY2tpbmcgaWYgdGhlIHJlbmRlcmVyIG5hbWVcbiAgICAgKiBpcyBhbHJlYWR5IHRoZXJlIGluIGNhc2UgZXB1YnRvb2xzIG11c3QgdXNlIHRoZSBzYW1lIHJlbmRlcmVyIG5hbWUuXG4gICAgICovXG4gICAgcmVnaXN0ZXJPdmVycmlkZVJlbmRlcmVyKHJlbmRlcmVyKSB7XG4gICAgICAgIGlmICghKHJlbmRlcmVyIGluc3RhbmNlb2YgUmVuZGVyZXIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdOb3QgQSBSZW5kZXJlciAnKyB1dGlsLmluc3BlY3QocmVuZGVyZXIpKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGEgUmVuZGVyZXInKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZW5kZXJlci5ha2FzaGEgPSB0aGlzLmFrYXNoYTtcbiAgICAgICAgLy8gcmVuZGVyZXIuY29uZmlnID0gdGhpcztcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLnJlZ2lzdGVyT3ZlcnJpZGVSZW5kZXJlcihyZW5kZXJlcik7XG4gICAgfVxuXG4gICAgZmluZFJlbmRlcmVyTmFtZShuYW1lKTogUmVuZGVyZXIge1xuICAgICAgICByZXR1cm4gdGhpcy4jcmVuZGVyZXJzLmZpbmRSZW5kZXJlck5hbWUobmFtZSk7XG4gICAgfVxuXG4gICAgZmluZFJlbmRlcmVyUGF0aChfcGF0aCk6IFJlbmRlcmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3JlbmRlcmVycy5maW5kUmVuZGVyZXJQYXRoKF9wYXRoKTtcbiAgICB9XG5cbiAgICBnZXQgcmVuZGVyZXJzKCkgeyByZXR1cm4gdGhpcy4jcmVuZGVyZXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgUmVuZGVyZXIgYnkgaXRzIGV4dGVuc2lvbi5cbiAgICAgKi9cbiAgICBmaW5kUmVuZGVyZXIobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kUmVuZGVyZXJOYW1lKG5hbWUpO1xuICAgIH1cbn1cblxuY29uc3QgbW9kdWxlX2V4cG9ydHMgPSB7XG4gICAgUmVuZGVyZXJzLFxuICAgIFJlbmRlcmVyOiBSZW5kZXJlcnMuUmVuZGVyZXIsXG4gICAgbWFoYWJodXRhLFxuICAgIGZpbGVjYWNoZSxcbiAgICBzZXR1cCxcbiAgICBjYWNoZVNldHVwLFxuICAgIGNsb3NlQ2FjaGVzLFxuICAgIGZpbGVDYWNoZXNSZWFkeSxcbiAgICBQbHVnaW4sXG4gICAgcmVuZGVyLFxuICAgIHJlbmRlckRvY3VtZW50LFxuICAgIHJlbmRlclBhdGgsXG4gICAgcmVhZFJlbmRlcmVkRmlsZSxcbiAgICBwYXJ0aWFsLFxuICAgIHBhcnRpYWxTeW5jLFxuICAgIGluZGV4Q2hhaW4sXG4gICAgcmVsYXRpdmUsXG4gICAgbGlua1JlbFNldEF0dHIsXG4gICAgZ2VuZXJhdGVSU1MsXG4gICAgQ29uZmlndXJhdGlvblxufSBhcyBhbnk7XG5cbmV4cG9ydCBkZWZhdWx0IG1vZHVsZV9leHBvcnRzOyJdfQ==