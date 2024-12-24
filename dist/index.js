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
import * as filecache from './cache/file-cache-sqlite.js';
export { newSQ3DataStore } from './sqdb.js';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBR0g7OztHQUdHO0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsNENBQTRDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFlLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ2xFLE9BQU8sS0FBSyxTQUFTLE1BQU0sc0JBQXNCLENBQUM7QUFDbEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ2hELE9BQU8sS0FBSyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ3ZDLE9BQU8sS0FBSyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ3ZDLE9BQU8sS0FBSyxPQUFPLE1BQU0sU0FBUyxDQUFDO0FBQ25DLE9BQU8sV0FBVyxNQUFNLDJCQUEyQixDQUFDO0FBRXBELE9BQU8sS0FBSyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sS0FBSyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBRXJDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDckMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUVyQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGNBQWMs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QkFBQSxJQUFJLGdDQUFXLENBQUMsd0JBQXdCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVELGdCQUFnQixDQUFDLElBQUk7UUFDakIsT0FBTyx1QkFBQSxJQUFJLGdDQUFXLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELGdCQUFnQixDQUFDLEtBQUs7UUFDbEIsT0FBTyx1QkFBQSxJQUFJLGdDQUFXLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVELElBQUksU0FBUyxLQUFLLE9BQU8sdUJBQUEsSUFBSSxnQ0FBVyxDQUFDLENBQUMsQ0FBQztJQUUzQzs7T0FFRztJQUNILFlBQVksQ0FBQyxJQUFJO1FBQ2IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztDQUNKOztBQUVELE1BQU0sY0FBYyxHQUFHO0lBQ25CLFNBQVM7SUFDVCxRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsU0FBUztJQUNULFNBQVM7SUFDVCxLQUFLO0lBQ0wsVUFBVTtJQUNWLFdBQVc7SUFDWCxlQUFlO0lBQ2YsTUFBTTtJQUNOLE1BQU07SUFDTixjQUFjO0lBQ2QsVUFBVTtJQUNWLGdCQUFnQjtJQUNoQixPQUFPO0lBQ1AsV0FBVztJQUNYLFVBQVU7SUFDVixRQUFRO0lBQ1IsY0FBYztJQUNkLFdBQVc7SUFDWCxhQUFhO0NBQ1QsQ0FBQztBQUVULGVBQWUsY0FBYyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyMiBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblxuLyoqXG4gKiBBa2FzaGFSZW5kZXJcbiAqIEBtb2R1bGUgYWthc2hhcmVuZGVyXG4gKi9cblxuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbi8vIGNvbnN0IG9lbWJldHRlciA9IHJlcXVpcmUoJ29lbWJldHRlcicpKCk7XG5pbXBvcnQgUlNTIGZyb20gJ3Jzcyc7XG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHsgRGlyc1dhdGNoZXIsIG1pbWVkZWZpbmUgfSBmcm9tICdAYWthc2hhY21zL3N0YWNrZWQtZGlycyc7XG5pbXBvcnQgKiBhcyBSZW5kZXJlcnMgZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuZXhwb3J0ICogYXMgUmVuZGVyZXJzIGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCB7IFJlbmRlcmVyIH0gZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuZXhwb3J0IHsgUmVuZGVyZXIgfSBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQgKiBhcyBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmV4cG9ydCAqIGFzIG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuaW1wb3J0ICogYXMgY2hlZXJpbyBmcm9tICdjaGVlcmlvJztcbmltcG9ydCBtYWhhUGFydGlhbCBmcm9tICdtYWhhYmh1dGEvbWFoYS9wYXJ0aWFsLmpzJztcblxuaW1wb3J0ICogYXMgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuZXhwb3J0ICogYXMgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuXG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5leHBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5cbmltcG9ydCB7IHJlbmRlciwgcmVuZGVyRG9jdW1lbnQsIHJlbmRlckNvbnRlbnQgfSBmcm9tICcuL3JlbmRlci5qcyc7XG5leHBvcnQgeyByZW5kZXIsIHJlbmRlckRvY3VtZW50LCByZW5kZXJDb250ZW50IH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuXG5jb25zdCBfX2ZpbGVuYW1lID0gaW1wb3J0Lm1ldGEuZmlsZW5hbWU7XG5jb25zdCBfX2Rpcm5hbWUgPSBpbXBvcnQubWV0YS5kaXJuYW1lO1xuXG4vLyBGb3IgdXNlIGluIENvbmZpZ3VyZS5wcmVwYXJlXG5pbXBvcnQgeyBCdWlsdEluUGx1Z2luIH0gZnJvbSAnLi9idWlsdC1pbi5qcyc7XG5cbmltcG9ydCAqIGFzIGZpbGVjYWNoZSBmcm9tICcuL2NhY2hlL2ZpbGUtY2FjaGUtc3FsaXRlLmpzJztcblxuZXhwb3J0IHsgbmV3U1EzRGF0YVN0b3JlIH0gZnJvbSAnLi9zcWRiLmpzJztcblxuLy8gVGhlcmUgZG9lc24ndCBzZWVtIHRvIGJlIGFuIG9mZmljaWFsIE1JTUUgdHlwZSByZWdpc3RlcmVkXG4vLyBmb3IgQXNjaWlEb2N0b3Jcbi8vIHBlcjogaHR0cHM6Ly9hc2NpaWRvY3Rvci5vcmcvZG9jcy9mYXEvXG4vLyBwZXI6IGh0dHBzOi8vZ2l0aHViLmNvbS9hc2NpaWRvY3Rvci9hc2NpaWRvY3Rvci9pc3N1ZXMvMjUwMlxuLy9cbi8vIEFzIG9mIE5vdmVtYmVyIDYsIDIwMjIsIHRoZSBBc2NpaURvY3RvciBGQVEgc2FpZCB0aGV5IGFyZVxuLy8gaW4gdGhlIHByb2Nlc3Mgb2YgcmVnaXN0ZXJpbmcgYSBNSU1FIHR5cGUgZm9yIGB0ZXh0L2FzY2lpZG9jYC5cbi8vIFRoZSBNSU1FIHR5cGUgd2Ugc3VwcGx5IGhhcyBiZWVuIHVwZGF0ZWQuXG4vL1xuLy8gVGhpcyBhbHNvIHNlZW1zIHRvIGJlIHRydWUgZm9yIHRoZSBvdGhlciBmaWxlIHR5cGVzLiAgV2UndmUgbWFkZSB1cFxuLy8gc29tZSBNSU1FIHR5cGVzIHRvIGdvIHdpdGggZWFjaC5cbi8vXG4vLyBUaGUgTUlNRSBwYWNrYWdlIGhhZCBwcmV2aW91c2x5IGJlZW4gaW5zdGFsbGVkIHdpdGggQWthc2hhUmVuZGVyLlxuLy8gQnV0LCBpdCBzZWVtcyB0byBub3QgYmUgdXNlZCwgYW5kIGluc3RlYWQgd2UgY29tcHV0ZSB0aGUgTUlNRSB0eXBlXG4vLyBmb3IgZmlsZXMgaW4gU3RhY2tlZCBEaXJlY3Rvcmllcy5cbi8vXG4vLyBUaGUgcmVxdWlyZWQgdGFzayBpcyB0byByZWdpc3RlciBzb21lIE1JTUUgdHlwZXMgd2l0aCB0aGVcbi8vIE1JTUUgcGFja2FnZS4gIEl0IGlzbid0IGFwcHJvcHJpYXRlIHRvIGRvIHRoaXMgaW5cbi8vIHRoZSBTdGFja2VkIERpcmVjdG9yaWVzIHBhY2thZ2UuICBJbnN0ZWFkIHRoYXQncyBsZWZ0XG4vLyBmb3IgY29kZSB3aGljaCB1c2VzIFN0YWNrZWQgRGlyZWN0b3JpZXMgdG8gZGV0ZXJtaW5lIHdoaWNoXG4vLyAoaWYgYW55KSBhZGRlZCBNSU1FIHR5cGVzIGFyZSByZXF1aXJlZC4gIEVyZ28sIEFrYXNoYVJlbmRlclxuLy8gbmVlZHMgdG8gcmVnaXN0ZXIgdGhlIE1JTUUgdHlwZXMgaXQgaXMgaW50ZXJlc3RlZCBpbi5cbi8vIFRoYXQncyB3aGF0IGlzIGhhcHBlbmluZyBoZXJlLlxuLy9cbi8vIFRoZXJlJ3MgYSB0aG91Z2h0IHRoYXQgdGhpcyBzaG91bGQgYmUgaGFuZGxlZCBpbiB0aGUgUmVuZGVyZXJcbi8vIGltcGxlbWVudGF0aW9ucy4gIEJ1dCBpdCdzIG5vdCBjZXJ0YWluIHRoYXQncyBjb3JyZWN0LlxuLy9cbi8vIE5vdyB0aGF0IHRoZSBSZW5kZXJlcnMgYXJlIGluIGBAYWthc2hhY21zL3JlbmRlcmVyc2Agc2hvdWxkXG4vLyB0aGVzZSBkZWZpbml0aW9ucyBtb3ZlIHRvIHRoYXQgcGFja2FnZT9cblxubWltZWRlZmluZSh7J3RleHQvYXNjaWlkb2MnOiBbICdhZG9jJywgJ2FzY2lpZG9jJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LW1hcmtkb2MnOiBbICdtYXJrZG9jJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LWVqcyc6IFsgJ2VqcyddfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LW51bmp1Y2tzJzogWyAnbmprJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LWhhbmRsZWJhcnMnOiBbICdoYW5kbGViYXJzJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LWxpcXVpZCc6IFsgJ2xpcXVpZCcgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC10ZW1wdXJhJzogWyAndGVtcHVyYScgXX0pO1xuXG4vKipcbiAqIFBlcmZvcm1zIHNldHVwIG9mIHRoaW5ncyBzbyB0aGF0IEFrYXNoYVJlbmRlciBjYW4gZnVuY3Rpb24uXG4gKiBUaGUgY29ycmVjdCBpbml0aWFsaXphdGlvbiBvZiBBa2FzaGFSZW5kZXIgaXMgdG9cbiAqIDEuIEdlbmVyYXRlIHRoZSBDb25maWd1cmF0aW9uIG9iamVjdFxuICogMi4gQ2FsbCBjb25maWcucHJlcGFyZVxuICogMy4gQ2FsbCBha2FzaGFyZW5kZXIuc2V0dXBcbiAqIFxuICogVGhpcyBmdW5jdGlvbiBlbnN1cmVzIGFsbCBvYmplY3RzIHRoYXQgaW5pdGlhbGl6ZSBhc3luY2hyb25vdXNseVxuICogYXJlIGNvcnJlY3RseSBzZXR1cC5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChjb25maWcpIHtcblxuICAgIGNvbmZpZy5yZW5kZXJlcnMucGFydGlhbEZ1bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjYWxsaW5nIHBhcnRpYWwgJHtmbmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgY29uZmlnLnJlbmRlcmVycy5wYXJ0aWFsU3luY0Z1bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjYWxsaW5nIHBhcnRpYWxTeW5jICR7Zm5hbWV9YCk7XG4gICAgICAgIHJldHVybiBwYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfVxuXG4gICAgYXdhaXQgY2FjaGVTZXR1cChjb25maWcpO1xuICAgIGF3YWl0IGZpbGVDYWNoZXNSZWFkeShjb25maWcpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVTZXR1cChjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBmaWxlY2FjaGUuc2V0dXAoY29uZmlnKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgSU5JVElBTElaQVRJT04gRkFJTFVSRSBDT1VMRCBOT1QgSU5JVElBTElaRSBDQUNIRSBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VDYWNoZXMoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmlsZWNhY2hlLmNsb3NlRmlsZUNhY2hlcygpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBDTE9TRSBDQUNIRVMgYCwgZXJyKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbGVDYWNoZXNSZWFkeShjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLmFzc2V0c0NhY2hlLmlzUmVhZHkoKSxcbiAgICAgICAgICAgIGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuaXNSZWFkeSgpXG4gICAgICAgIF0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBJTklUSUFMSVpFIENBQ0hFIFNZU1RFTSBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyUGF0aChjb25maWcsIHBhdGgycikge1xuICAgIGNvbnN0IGRvY3VtZW50cyA9IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICBsZXQgZm91bmQ7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICB3aGlsZSAoY291bnQgPCAyMCkge1xuICAgICAgICAvKiBXaGF0J3MgaGFwcGVuaW5nIGlzIHRoaXMgbWlnaHQgYmUgY2FsbGVkIGZyb20gY2xpLmpzXG4gICAgICAgICAqIGluIHJlbmRlci1kb2N1bWVudCwgYW5kIHdlIG1pZ2h0IGJlIGFza2VkIHRvIHJlbmRlciB0aGVcbiAgICAgICAgICogbGFzdCBkb2N1bWVudCB0aGF0IHdpbGwgYmUgQUREJ2QgdG8gdGhlIEZpbGVDYWNoZS5cbiAgICAgICAgICpcbiAgICAgICAgICogSW4gc3VjaCBhIGNhc2UgPGNvZGU+aXNSZWFkeTwvY29kZT4gbWlnaHQgcmV0dXJuIDxjb2RlPnRydWU8L2NvZGU+XG4gICAgICAgICAqIGJ1dCBub3QgYWxsIGZpbGVzIHdpbGwgaGF2ZSBiZWVuIEFERCdkIHRvIHRoZSBGaWxlQ2FjaGUuXG4gICAgICAgICAqIEluIHRoYXQgY2FzZSA8Y29kZT5kb2N1bWVudHMuZmluZDwvY29kZT4gcmV0dXJuc1xuICAgICAgICAgKiA8Y29kZT51bmRlZmluZWQ8L2NvZGU+XG4gICAgICAgICAqXG4gICAgICAgICAqIFdoYXQgdGhpcyBkb2VzIGlzIHRyeSB1cCB0byAyMCB0aW1lcyB0byBsb2FkIHRoZSBkb2N1bWVudCxcbiAgICAgICAgICogc2xlZXBpbmcgZm9yIDEwMCBtaWxsaXNlY29uZHMgZWFjaCB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2xlYW5lciBhbHRlcm5hdGl2ZSB3b3VsZCBiZSB0byB3YWl0IGZvciBub3Qgb25seVxuICAgICAgICAgKiB0aGUgPGNvZGU+cmVhZHk8L2NvZGU+IGZyb20gdGhlIDxjb2RlPmRvY3VtZW50czwvY29kZT4gRmlsZUNhY2hlLFxuICAgICAgICAgKiBidXQgYWxzbyBmb3IgYWxsIHRoZSBpbml0aWFsIEFERCBldmVudHMgdG8gYmUgaGFuZGxlZC4gIEJ1dFxuICAgICAgICAgKiB0aGF0IHNlY29uZCBjb25kaXRpb24gc2VlbXMgZGlmZmljdWx0IHRvIGRldGVjdCByZWxpYWJseS5cbiAgICAgICAgICovXG4gICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aDJyKTtcbiAgICAgICAgaWYgKGZvdW5kKSBicmVhaztcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlclBhdGggJHtwYXRoMnJ9YCwgZm91bmQpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEaWQgbm90IGZpbmQgZG9jdW1lbnQgZm9yICR7cGF0aDJyfWApO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVuZGVyRG9jdW1lbnQoY29uZmlnLCBmb3VuZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZWFkcyBhIGZpbGUgZnJvbSB0aGUgcmVuZGVyaW5nIGRpcmVjdG9yeS4gIEl0IGlzIHByaW1hcmlseSB0byBiZVxuICogdXNlZCBpbiB0ZXN0IGNhc2VzLCB3aGVyZSB3ZSdsbCBydW4gYSBidWlsZCB0aGVuIHJlYWQgdGhlIGluZGl2aWR1YWxcbiAqIGZpbGVzIHRvIG1ha2Ugc3VyZSB0aGV5J3ZlIHJlbmRlcmVkIGNvcnJlY3RseS5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKiBAcGFyYW0geyp9IGZwYXRoIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkUmVuZGVyZWRGaWxlKGNvbmZpZywgZnBhdGgpIHtcblxuICAgIGxldCBodG1sID0gYXdhaXQgZnNwLnJlYWRGaWxlKHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIGZwYXRoKSwgJ3V0ZjgnKTtcbiAgICBsZXQgJCA9IGNvbmZpZy5tYWhhYmh1dGFDb25maWcgXG4gICAgICAgICAgICA/IGNoZWVyaW8ubG9hZChodG1sLCBjb25maWcubWFoYWJodXRhQ29uZmlnKSBcbiAgICAgICAgICAgIDogY2hlZXJpby5sb2FkKGh0bWwpO1xuXG4gICAgcmV0dXJuIHsgaHRtbCwgJCB9O1xufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBwYXJ0aWFsIHRlbXBsYXRlIHVzaW5nIHRoZSBzdXBwbGllZCBtZXRhZGF0YS4gIFRoaXMgdmVyc2lvblxuICogYWxsb3dzIGZvciBhc3luY2hyb25vdXMgZXhlY3V0aW9uLCBhbmQgZXZlcnkgYml0IG9mIGNvZGUgaXRcbiAqIGV4ZWN1dGVzIGlzIGFsbG93ZWQgdG8gYmUgYXN5bmMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICogQHBhcmFtIHsqfSBmbmFtZSBQYXRoIHdpdGhpbiB0aGUgZmlsZWNhY2hlLnBhcnRpYWxzIGNhY2hlXG4gKiBAcGFyYW0geyp9IG1ldGFkYXRhIE9iamVjdCBjb250YWluaW5nIG1ldGFkYXRhXG4gKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBzdHJpbmcgY29udGFpbmluZyB0aGUgcmVuZGVyZWQgc3R1ZmZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpIHtcblxuICAgIGlmICghZm5hbWUgfHwgdHlwZW9mIGZuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHBhcnRpYWwgZm5hbWUgbm90IGEgc3RyaW5nICR7dXRpbC5pbnNwZWN0KGZuYW1lKX1gKTtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCAke2ZuYW1lfWApO1xuICAgIGNvbnN0IGZvdW5kID0gYXdhaXQgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuZmluZChmbmFtZSk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHBhcnRpYWwgZm91bmQgZm9yICR7Zm5hbWV9IGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5wYXJ0aWFsc0RpcnMpfWApO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCAke2ZuYW1lfSA9PT4gJHtmb3VuZC52cGF0aH0gJHtmb3VuZC5mc3BhdGh9YCk7XG4gICAgXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsIGFib3V0IHRvIHJlbmRlciAke3V0aWwuaW5zcGVjdChmb3VuZC52cGF0aCl9YCk7XG4gICAgICAgIGxldCBwYXJ0aWFsVGV4dDtcbiAgICAgICAgaWYgKGZvdW5kLmRvY0JvZHkpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQm9keTtcbiAgICAgICAgZWxzZSBpZiAoZm91bmQuZG9jQ29udGVudCkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NDb250ZW50O1xuICAgICAgICBlbHNlIHBhcnRpYWxUZXh0ID0gYXdhaXQgZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcblxuICAgICAgICAvLyBTb21lIHJlbmRlcmVycyAoTnVuanVrcykgcmVxdWlyZSB0aGF0IG1ldGFkYXRhLmNvbmZpZ1xuICAgICAgICAvLyBwb2ludCB0byB0aGUgY29uZmlnIG9iamVjdC4gIFRoaXMgYmxvY2sgb2YgY29kZVxuICAgICAgICAvLyBkdXBsaWNhdGVzIHRoZSBtZXRhZGF0YSBvYmplY3QsIHRoZW4gc2V0cyB0aGVcbiAgICAgICAgLy8gY29uZmlnIGZpZWxkIGluIHRoZSBkdXBsaWNhdGUsIHBhc3NpbmcgdGhhdCB0byB0aGUgcGFydGlhbC5cbiAgICAgICAgbGV0IG1kYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgbGV0IHByb3A7XG5cbiAgICAgICAgZm9yIChwcm9wIGluIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICBtZGF0YVtwcm9wXSA9IG1ldGFkYXRhW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIG1kYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgbWRhdGEucGFydGlhbFN5bmMgPSBwYXJ0aWFsU3luYy5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICBtZGF0YS5wYXJ0aWFsICAgICA9IHBhcnRpYWwuYmluZChyZW5kZXJlciwgY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwtZnVuY3MgcmVuZGVyICR7cmVuZGVyZXIubmFtZX0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyLnJlbmRlcih7XG4gICAgICAgICAgICBmc3BhdGg6IGZvdW5kLmZzcGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IHBhcnRpYWxUZXh0LFxuICAgICAgICAgICAgbWV0YWRhdGE6IG1kYXRhXG4gICAgICAgICAgICAvLyBwYXJ0aWFsVGV4dCwgbWRhdGEsIGZvdW5kXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZm91bmQudnBhdGguZW5kc1dpdGgoJy5odG1sJykgfHwgZm91bmQudnBhdGguZW5kc1dpdGgoJy54aHRtbCcpKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsIHJlYWRpbmcgZmlsZSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlbmRlclBhcnRpYWwgbm8gUmVuZGVyZXIgZm91bmQgZm9yICR7Zm5hbWV9IC0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICB9XG59XG5cbi8qKlxuICogUmVuZGVycyBhIHBhcnRpYWwgdGVtcGxhdGUgdXNpbmcgdGhlIHN1cHBsaWVkIG1ldGFkYXRhLiAgVGhpcyB2ZXJzaW9uXG4gKiBhbGxvd3MgZm9yIHN5bmNocm9ub3VzIGV4ZWN1dGlvbiwgYW5kIGV2ZXJ5IGJpdCBvZiBjb2RlIGl0XG4gKiBleGVjdXRlcyBpcyBzeW5jaHJvbm91cyBmdW5jdGlvbnMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICogQHBhcmFtIHsqfSBmbmFtZSBQYXRoIHdpdGhpbiB0aGUgZmlsZWNhY2hlLnBhcnRpYWxzIGNhY2hlXG4gKiBAcGFyYW0geyp9IG1ldGFkYXRhIE9iamVjdCBjb250YWluaW5nIG1ldGFkYXRhXG4gKiBAcmV0dXJucyBTdHJpbmcgY29udGFpbmluZyB0aGUgcmVuZGVyZWQgc3R1ZmZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKSB7XG5cbiAgICBpZiAoIWZuYW1lIHx8IHR5cGVvZiBmbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBwYXJ0aWFsU3luYyBmbmFtZSBub3QgYSBzdHJpbmcgJHt1dGlsLmluc3BlY3QoZm5hbWUpfWApO1xuICAgIH1cblxuICAgIGNvbnN0IGZvdW5kID0gZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuZmluZFN5bmMoZm5hbWUpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBwYXJ0aWFsIGZvdW5kIGZvciAke2ZuYW1lfSBpbiAke3V0aWwuaW5zcGVjdChjb25maWcucGFydGlhbHNEaXJzKX1gKTtcbiAgICB9XG5cbiAgICB2YXIgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgIC8vIFNvbWUgcmVuZGVyZXJzIChOdW5qdWtzKSByZXF1aXJlIHRoYXQgbWV0YWRhdGEuY29uZmlnXG4gICAgICAgIC8vIHBvaW50IHRvIHRoZSBjb25maWcgb2JqZWN0LiAgVGhpcyBibG9jayBvZiBjb2RlXG4gICAgICAgIC8vIGR1cGxpY2F0ZXMgdGhlIG1ldGFkYXRhIG9iamVjdCwgdGhlbiBzZXRzIHRoZVxuICAgICAgICAvLyBjb25maWcgZmllbGQgaW4gdGhlIGR1cGxpY2F0ZSwgcGFzc2luZyB0aGF0IHRvIHRoZSBwYXJ0aWFsLlxuICAgICAgICBsZXQgbWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBsZXQgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gbWV0YWRhdGEpIHtcbiAgICAgICAgICAgIG1kYXRhW3Byb3BdID0gbWV0YWRhdGFbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgbWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICAvLyBJbiB0aGlzIGNvbnRleHQsIHBhcnRpYWxTeW5jIGlzIGRpcmVjdGx5IGF2YWlsYWJsZVxuICAgICAgICAvLyBhcyBhIGZ1bmN0aW9uIHRoYXQgd2UgY2FuIGRpcmVjdGx5IHVzZS5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWxTeW5jIGAsIHBhcnRpYWxTeW5jKTtcbiAgICAgICAgbWRhdGEucGFydGlhbFN5bmMgPSBwYXJ0aWFsU3luYy5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICAvLyBmb3IgZmluZFN5bmMsIHRoZSBcImZvdW5kXCIgb2JqZWN0IGlzIFZQYXRoRGF0YSB3aGljaFxuICAgICAgICAvLyBkb2VzIG5vdCBoYXZlIGRvY0JvZHkgbm9yIGRvY0NvbnRlbnQuICBUaGVyZWZvcmUgd2VcbiAgICAgICAgLy8gbXVzdCByZWFkIHRoaXMgY29udGVudFxuICAgICAgICBsZXQgcGFydGlhbFRleHQgPSBmcy5yZWFkRmlsZVN5bmMoZm91bmQuZnNwYXRoLCAndXRmLTgnKTtcbiAgICAgICAgLy8gaWYgKGZvdW5kLmRvY0JvZHkpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQm9keTtcbiAgICAgICAgLy8gZWxzZSBpZiAoZm91bmQuZG9jQ29udGVudCkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NDb250ZW50O1xuICAgICAgICAvLyBlbHNlIHBhcnRpYWxUZXh0ID0gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsLWZ1bmNzIHJlbmRlclN5bmMgJHtyZW5kZXJlci5uYW1lfSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gcmVuZGVyZXIucmVuZGVyU3luYyg8UmVuZGVyZXJzLlJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBmb3VuZC5mc3BhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBwYXJ0aWFsVGV4dCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBtZGF0YVxuICAgICAgICAgICAgLy8gcGFydGlhbFRleHQsIG1kYXRhLCBmb3VuZFxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcuaHRtbCcpIHx8IGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcueGh0bWwnKSkge1xuICAgICAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlbmRlclBhcnRpYWwgbm8gUmVuZGVyZXIgZm91bmQgZm9yICR7Zm5hbWV9IC0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICB9XG59XG5cbi8qKlxuICogU3RhcnRpbmcgZnJvbSBhIHZpcnR1YWwgcGF0aCBpbiB0aGUgZG9jdW1lbnRzLCBzZWFyY2hlcyB1cHdhcmRzIHRvXG4gKiB0aGUgcm9vdCBvZiB0aGUgZG9jdW1lbnRzIGZpbGUtc3BhY2UsIGZpbmRpbmcgZmlsZXMgdGhhdCBcbiAqIHJlbmRlciB0byBcImluZGV4Lmh0bWxcIi4gIFRoZSBcImluZGV4Lmh0bWxcIiBmaWxlcyBhcmUgaW5kZXggZmlsZXMsXG4gKiBhcyB0aGUgbmFtZSBzdWdnZXN0cy5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKiBAcGFyYW0geyp9IGZuYW1lIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbmRleENoYWluKGNvbmZpZywgZm5hbWUpIHtcblxuICAgIC8vIFRoaXMgdXNlZCB0byBiZSBhIGZ1bGwgZnVuY3Rpb24gaGVyZSwgYnV0IGhhcyBtb3ZlZFxuICAgIC8vIGludG8gdGhlIEZpbGVDYWNoZSBjbGFzcy4gIFJlcXVpcmluZyBhIGBjb25maWdgIG9wdGlvblxuICAgIC8vIGlzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBmb3JtZXIgQVBJLlxuXG4gICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIHJldHVybiBkb2N1bWVudHMuaW5kZXhDaGFpbihmbmFtZSk7XG59XG5cblxuLyoqXG4gKiBNYW5pcHVsYXRlIHRoZSByZWw9IGF0dHJpYnV0ZXMgb24gYSBsaW5rIHJldHVybmVkIGZyb20gTWFoYWJodXRhLlxuICpcbiAqIEBwYXJhbXMgeyRsaW5rfSBUaGUgbGluayB0byBtYW5pcHVsYXRlXG4gKiBAcGFyYW1zIHthdHRyfSBUaGUgYXR0cmlidXRlIG5hbWVcbiAqIEBwYXJhbXMge2RvYXR0cn0gQm9vbGVhbiBmbGFnIHdoZXRoZXIgdG8gc2V0ICh0cnVlKSBvciByZW1vdmUgKGZhbHNlKSB0aGUgYXR0cmlidXRlXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlua1JlbFNldEF0dHIoJGxpbmssIGF0dHIsIGRvYXR0cikge1xuICAgIGxldCBsaW5rcmVsID0gJGxpbmsuYXR0cigncmVsJyk7XG4gICAgbGV0IHJlbHMgPSBsaW5rcmVsID8gbGlua3JlbC5zcGxpdCgnICcpIDogW107XG4gICAgbGV0IGhhc2F0dHIgPSByZWxzLmluZGV4T2YoYXR0cikgPj0gMDtcbiAgICBpZiAoIWhhc2F0dHIgJiYgZG9hdHRyKSB7XG4gICAgICAgIHJlbHMudW5zaGlmdChhdHRyKTtcbiAgICAgICAgJGxpbmsuYXR0cigncmVsJywgcmVscy5qb2luKCcgJykpO1xuICAgIH0gZWxzZSBpZiAoaGFzYXR0ciAmJiAhZG9hdHRyKSB7XG4gICAgICAgIHJlbHMuc3BsaWNlKHJlbHMuaW5kZXhPZihhdHRyKSk7XG4gICAgICAgICRsaW5rLmF0dHIoJ3JlbCcsIHJlbHMuam9pbignICcpKTtcbiAgICB9XG59O1xuXG4vLy8vLy8vLy8vLy8vLy8vLyBSU1MgRmVlZCBHZW5lcmF0aW9uXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVJTUyhjb25maWcsIGNvbmZpZ3JzcywgZmVlZERhdGEsIGl0ZW1zLCByZW5kZXJUbykge1xuXG4gICAgLy8gU3VwcG9zZWRseSBpdCdzIHJlcXVpcmVkIHRvIHVzZSBoYXNPd25Qcm9wZXJ0eVxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNzI4MzYwL2hvdy1kby1pLWNvcnJlY3RseS1jbG9uZS1hLWphdmFzY3JpcHQtb2JqZWN0IzcyODY5NFxuICAgIC8vXG4gICAgLy8gQnV0LCBpbiBvdXIgY2FzZSB0aGF0IHJlc3VsdGVkIGluIGFuIGVtcHR5IG9iamVjdFxuXG4gICAgLy8gY29uc29sZS5sb2coJ2NvbmZpZ3JzcyAnKyB1dGlsLmluc3BlY3QoY29uZmlncnNzKSk7XG5cbiAgICAvLyBDb25zdHJ1Y3QgaW5pdGlhbCByc3Mgb2JqZWN0XG4gICAgdmFyIHJzcyA9IHt9O1xuICAgIGZvciAobGV0IGtleSBpbiBjb25maWdyc3MucnNzKSB7XG4gICAgICAgIC8vaWYgKGNvbmZpZ3Jzcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICByc3Nba2V5XSA9IGNvbmZpZ3Jzcy5yc3Nba2V5XTtcbiAgICAgICAgLy99XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coJ3JzcyAnKyB1dGlsLmluc3BlY3QocnNzKSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZygnZmVlZERhdGEgJysgdXRpbC5pbnNwZWN0KGZlZWREYXRhKSk7XG5cbiAgICAvLyBUaGVuIGZpbGwgaW4gZnJvbSBmZWVkRGF0YVxuICAgIGZvciAobGV0IGtleSBpbiBmZWVkRGF0YSkge1xuICAgICAgICAvL2lmIChmZWVkRGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICByc3Nba2V5XSA9IGZlZWREYXRhW2tleV07XG4gICAgICAgIC8vfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKCdnZW5lcmF0ZVJTUyByc3MgJysgdXRpbC5pbnNwZWN0KHJzcykpO1xuXG4gICAgdmFyIHJzc2ZlZWQgPSBuZXcgUlNTKHJzcyk7XG5cbiAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHsgcnNzZmVlZC5pdGVtKGl0ZW0pOyB9KTtcblxuICAgIHZhciB4bWwgPSByc3NmZWVkLnhtbCgpO1xuICAgIHZhciByZW5kZXJPdXQgPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCByZW5kZXJUbyk7XG5cbiAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlck91dCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pXG4gICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJPdXQsIHhtbCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuXG59O1xuXG4vLyBGb3Igb0VtYmVkLCBDb25zaWRlciBtYWtpbmcgYW4gZXh0ZXJuYWwgcGx1Z2luXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9vZW1iZWQtYWxsXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9lbWJlZGFibGVcbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL21lZGlhLXBhcnNlclxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvb2VtYmV0dGVyXG5cblxuLyoqXG4gKiBUaGUgQWthc2hhUmVuZGVyIHByb2plY3QgY29uZmlndXJhdGlvbiBvYmplY3QuICBcbiAqIE9uZSBpbnN0YW50aWF0ZXMgYSBDb25maWd1cmF0aW9uIG9iamVjdCwgdGhlbiBmaWxscyBpdFxuICogd2l0aCBzZXR0aW5ncyBhbmQgcGx1Z2lucy5cbiAqIFxuICogQHNlZSBtb2R1bGU6Q29uZmlndXJhdGlvblxuICovXG5cbi8vIGNvbnN0IF9jb25maWdfcGx1Z2luRGF0YSA9IFN5bWJvbCgncGx1Z2luRGF0YScpO1xuLy8gY29uc3QgX2NvbmZpZ19hc3NldHNEaXJzID0gU3ltYm9sKCdhc3NldHNEaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX2RvY3VtZW50RGlycyA9IFN5bWJvbCgnZG9jdW1lbnREaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX2xheW91dERpcnMgPSBTeW1ib2woJ2xheW91dERpcnMnKTtcbi8vIGNvbnN0IF9jb25maWdfcGFydGlhbERpcnMgPSBTeW1ib2woJ3BhcnRpYWxEaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX21haGFmdW5jcyA9IFN5bWJvbCgnbWFoYWZ1bmNzJyk7XG4vLyBjb25zdCBfY29uZmlnX3JlbmRlclRvID0gU3ltYm9sKCdyZW5kZXJUbycpO1xuLy8gY29uc3QgX2NvbmZpZ19tZXRhZGF0YSA9IFN5bWJvbCgnbWV0YWRhdGEnKTtcbi8vIGNvbnN0IF9jb25maWdfcm9vdF91cmwgPSBTeW1ib2woJ3Jvb3RfdXJsJyk7XG4vLyBjb25zdCBfY29uZmlnX3NjcmlwdHMgPSBTeW1ib2woJ3NjcmlwdHMnKTtcbi8vIGNvbnN0IF9jb25maWdfcGx1Z2lucyA9IFN5bWJvbCgncGx1Z2lucycpO1xuLy8gY29uc3QgX2NvbmZpZ19jaGVlcmlvID0gU3ltYm9sKCdjaGVlcmlvJyk7XG4vLyBjb25zdCBfY29uZmlnX2NvbmZpZ2RpciA9IFN5bWJvbCgnY29uZmlnZGlyJyk7XG4vLyBjb25zdCBfY29uZmlnX2NhY2hlZGlyICA9IFN5bWJvbCgnY2FjaGVkaXInKTtcbi8vIGNvbnN0IF9jb25maWdfYXV0b2xvYWQgID0gU3ltYm9sKCdhdXRvbG9hZCcpO1xuLy8gY29uc3QgX2NvbmZpZ19hdXRvc2F2ZSAgPSBTeW1ib2woJ2F1dG9zYXZlJyk7XG4vLyBjb25zdCBfY29uZmlnX2NvbmN1cnJlbmN5ID0gU3ltYm9sKCdjb25jdXJyZW5jeScpO1xuLy8gY29uc3QgX2NvbmZpZ19yZW5kZXJlcnMgPSBTeW1ib2woJ3JlbmRlcmVycycpO1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gb2YgYW4gQWthc2hhUmVuZGVyIHByb2plY3QsIGluY2x1ZGluZyB0aGUgaW5wdXQgZGlyZWN0b3JpZXMsXG4gKiBvdXRwdXQgZGlyZWN0b3J5LCBwbHVnaW5zLCBhbmQgdmFyaW91cyBzZXR0aW5ncy5cbiAqXG4gKiBVU0FHRTpcbiAqXG4gKiBjb25zdCBha2FzaGEgPSByZXF1aXJlKCdha2FzaGFyZW5kZXInKTtcbiAqIGNvbnN0IGNvbmZpZyA9IG5ldyBha2FzaGEuQ29uZmlndXJhdGlvbigpO1xuICovXG5leHBvcnQgY2xhc3MgQ29uZmlndXJhdGlvbiB7XG4gICAgI3JlbmRlcmVyczogUmVuZGVyZXJzLkNvbmZpZ3VyYXRpb247XG4gICAgI2F1dG9sb2FkOiBib29sZWFuO1xuICAgICNhdXRvc2F2ZTogYm9vbGVhbjtcbiAgICAjY29uZmlnZGlyOiBzdHJpbmc7XG4gICAgI2NhY2hlZGlyOiBzdHJpbmc7XG4gICAgI2Fzc2V0c0RpcnM7XG4gICAgI2xheW91dERpcnM7XG4gICAgI2RvY3VtZW50RGlycztcbiAgICAjcGFydGlhbERpcnM7XG4gICAgI21haGFmdW5jcztcbiAgICAjY2hlZXJpbztcbiAgICAjcmVuZGVyVG86IHN0cmluZztcbiAgICAjc2NyaXB0cztcbiAgICAjY29uY3VycmVuY3k6IG51bWJlcjtcbiAgICAjbWV0YWRhdGE6IGFueTtcbiAgICAjcm9vdF91cmw6IHN0cmluZztcbiAgICAjcGx1Z2lucztcbiAgICAjcGx1Z2luRGF0YTtcbiAgICBcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGVwYXRoKSB7XG5cbiAgICAgICAgLy8gdGhpc1tfY29uZmlnX3JlbmRlcmVyc10gPSBbXTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzID0gbmV3IFJlbmRlcmVycy5Db25maWd1cmF0aW9uKHtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiNhdXRvbG9hZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNhdXRvc2F2ZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuI21haGFmdW5jcyA9IFtdO1xuICAgICAgICB0aGlzLiNzY3JpcHRzID0ge1xuICAgICAgICAgICAgc3R5bGVzaGVldHM6IFtdLFxuICAgICAgICAgICAgamF2YVNjcmlwdFRvcDogW10sXG4gICAgICAgICAgICBqYXZhU2NyaXB0Qm90dG9tOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuI2NvbmN1cnJlbmN5ID0gMztcblxuICAgICAgICB0aGlzLiNkb2N1bWVudERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jbGF5b3V0RGlycyA9IFtdO1xuICAgICAgICB0aGlzLiNwYXJ0aWFsRGlycyA9IFtdO1xuICAgICAgICB0aGlzLiNhc3NldHNEaXJzID0gW107XG5cbiAgICAgICAgdGhpcy4jbWFoYWZ1bmNzID0gW107XG5cbiAgICAgICAgdGhpcy4jcmVuZGVyVG8gPSAnb3V0JztcblxuICAgICAgICB0aGlzLiNtZXRhZGF0YSA9IHt9IGFzIGFueTtcblxuICAgICAgICB0aGlzLiNwbHVnaW5zID0gW107XG4gICAgICAgIHRoaXMuI3BsdWdpbkRhdGEgPSBbXTtcblxuICAgICAgICAvKlxuICAgICAgICAgKiBJcyB0aGlzIHRoZSBiZXN0IHBsYWNlIGZvciB0aGlzPyAgSXQgaXMgbmVjZXNzYXJ5IHRvXG4gICAgICAgICAqIGNhbGwgdGhpcyBmdW5jdGlvbiBzb21ld2hlcmUuICBUaGUgbmF0dXJlIG9mIHRoaXMgZnVuY3Rpb25cbiAgICAgICAgICogaXMgdGhhdCBpdCBjYW4gYmUgY2FsbGVkIG11bHRpcGxlIHRpbWVzIHdpdGggbm8gaW1wYWN0LiAgXG4gICAgICAgICAqIEJ5IGJlaW5nIGxvY2F0ZWQgaGVyZSwgaXQgd2lsbCBhbHdheXMgYmUgY2FsbGVkIGJ5IHRoZVxuICAgICAgICAgKiB0aW1lIGFueSBDb25maWd1cmF0aW9uIGlzIGdlbmVyYXRlZC5cbiAgICAgICAgICovXG4gICAgICAgIC8vIFRoaXMgaXMgZXhlY3V0ZWQgaW4gQGFrYXNoYWNtcy9yZW5kZXJlcnNcbiAgICAgICAgLy8gdGhpc1tfY29uZmlnX3JlbmRlcmVyc10ucmVnaXN0ZXJCdWlsdEluUmVuZGVyZXJzKCk7XG5cbiAgICAgICAgLy8gUHJvdmlkZSBhIG1lY2hhbmlzbSB0byBlYXNpbHkgc3BlY2lmeSBjb25maWdEaXJcbiAgICAgICAgLy8gVGhlIHBhdGggaW4gY29uZmlnRGlyIG11c3QgYmUgdGhlIHBhdGggb2YgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZS5cbiAgICAgICAgLy8gVGhlcmUgZG9lc24ndCBhcHBlYXIgdG8gYmUgYSB3YXkgdG8gZGV0ZXJtaW5lIHRoYXQgZnJvbSBoZXJlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBGb3IgZXhhbXBsZSBtb2R1bGUucGFyZW50LmZpbGVuYW1lIGluIHRoaXMgY2FzZSBwb2ludHNcbiAgICAgICAgLy8gdG8gYWthc2hhcmVuZGVyL2luZGV4LmpzIGJlY2F1c2UgdGhhdCdzIHRoZSBtb2R1bGUgd2hpY2hcbiAgICAgICAgLy8gbG9hZGVkIHRoaXMgbW9kdWxlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBPbmUgY291bGQgaW1hZ2luZSBhIGRpZmZlcmVudCBpbml0aWFsaXphdGlvbiBwYXR0ZXJuLiAgSW5zdGVhZFxuICAgICAgICAvLyBvZiBha2FzaGFyZW5kZXIgcmVxdWlyaW5nIENvbmZpZ3VyYXRpb24uanMsIHRoYXQgZmlsZSBjb3VsZCBiZVxuICAgICAgICAvLyByZXF1aXJlZCBieSB0aGUgY29uZmlndXJhdGlvbiBmaWxlLiAgSW4gc3VjaCBhIGNhc2VcbiAgICAgICAgLy8gbW9kdWxlLnBhcmVudC5maWxlbmFtZSBXT1VMRCBpbmRpY2F0ZSB0aGUgZmlsZW5hbWUgZm9yIHRoZVxuICAgICAgICAvLyBjb25maWd1cmF0aW9uIGZpbGUsIGFuZCB3b3VsZCBiZSBhIHNvdXJjZSBvZiBzZXR0aW5nXG4gICAgICAgIC8vIHRoZSBjb25maWdEaXIgdmFsdWUuXG4gICAgICAgIGlmICh0eXBlb2YgbW9kdWxlcGF0aCAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlcGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5jb25maWdEaXIgPSBwYXRoLmRpcm5hbWUobW9kdWxlcGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWZXJ5IGNhcmVmdWxseSBhZGQgdGhlIDxwYXJ0aWFsPiBzdXBwb3J0IGZyb20gTWFoYWJodXRhIGFzIHRoZVxuICAgICAgICAvLyB2ZXJ5IGZpcnN0IHRoaW5nIHNvIHRoYXQgaXQgZXhlY3V0ZXMgYmVmb3JlIGFueXRoaW5nIGVsc2UuXG4gICAgICAgIGxldCBjb25maWcgPSB0aGlzO1xuICAgICAgICB0aGlzLmFkZE1haGFiaHV0YShtYWhhUGFydGlhbC5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgICAgICByZW5kZXJQYXJ0aWFsOiBmdW5jdGlvbihmbmFtZSwgbWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgZGVmYXVsdCBjb25maWd1cmF0aW9uIHZhbHVlcyBmb3IgYW55dGhpbmcgd2hpY2ggaGFzIG5vdFxuICAgICAqIGFscmVhZHkgYmVlbiBjb25maWd1cmVkLiAgU29tZSBidWlsdC1pbiBkZWZhdWx0cyBoYXZlIGJlZW4gZGVjaWRlZFxuICAgICAqIGFoZWFkIG9mIHRpbWUuICBGb3IgZWFjaCBjb25maWd1cmF0aW9uIHNldHRpbmcsIGlmIG5vdGhpbmcgaGFzIGJlZW5cbiAgICAgKiBkZWNsYXJlZCwgdGhlbiB0aGUgZGVmYXVsdCBpcyBzdWJzdGl0dXRlZC5cbiAgICAgKlxuICAgICAqIEl0IGlzIGV4cGVjdGVkIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgbGFzdCBpbiB0aGUgY29uZmlnIGZpbGUuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGluc3RhbGxzIHRoZSBgYnVpbHQtaW5gIHBsdWdpbi4gIEl0IG5lZWRzIHRvIGJlIGxhc3Qgb25cbiAgICAgKiB0aGUgcGx1Z2luIGNoYWluIHNvIHRoYXQgaXRzIHN0eWxlc2hlZXRzIGFuZCBwYXJ0aWFscyBhbmQgd2hhdG5vdFxuICAgICAqIGNhbiBiZSBvdmVycmlkZGVuIGJ5IG90aGVyIHBsdWdpbnMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBwcmVwYXJlKCkge1xuXG4gICAgICAgIGNvbnN0IENPTkZJRyA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgY29uZmlnRGlyUGF0aCA9IGZ1bmN0aW9uKGRpcm5tKSB7XG4gICAgICAgICAgICBsZXQgY29uZmlnUGF0aCA9IGRpcm5tO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBDT05GSUcuY29uZmlnRGlyICE9PSAndW5kZWZpbmVkJyAmJiBDT05GSUcuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb25maWdQYXRoID0gcGF0aC5qb2luKENPTkZJRy5jb25maWdEaXIsIGRpcm5tKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb25maWdQYXRoO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHN0YXQ7XG5cbiAgICAgICAgY29uc3QgY2FjaGVEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2NhY2hlJyk7XG4gICAgICAgIGlmICghdGhpcy4jY2FjaGVkaXIpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGNhY2hlRGlyc1BhdGgpXG4gICAgICAgICAgICAgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhjYWNoZURpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FjaGVEaXIgPSAnY2FjaGUnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidjYWNoZScgaXMgbm90IGEgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKGNhY2hlRGlyc1BhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FjaGVEaXIgPSAnY2FjaGUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI2NhY2hlZGlyICYmICFmcy5leGlzdHNTeW5jKHRoaXMuI2NhY2hlZGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHRoaXMuI2NhY2hlZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFzc2V0c0RpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnYXNzZXRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jYXNzZXRzRGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoYXNzZXRzRGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoYXNzZXRzRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRBc3NldHNEaXIoJ2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxheW91dHNEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2xheW91dHMnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNsYXlvdXREaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhsYXlvdXRzRGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMobGF5b3V0c0RpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0c0RpcignbGF5b3V0cycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcnRpYWxEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ3BhcnRpYWxzJyk7XG4gICAgICAgIGlmICghbWFoYVBhcnRpYWwuY29uZmlndXJhdGlvbi5wYXJ0aWFsRGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocGFydGlhbERpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKHBhcnRpYWxEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZFBhcnRpYWxzRGlyKCdwYXJ0aWFscycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50RGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdkb2N1bWVudHMnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNkb2N1bWVudERpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGRvY3VtZW50RGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoZG9jdW1lbnREaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZERvY3VtZW50c0RpcignZG9jdW1lbnRzJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ2RvY3VtZW50cycgaXMgbm90IGEgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gJ2RvY3VtZW50RGlycycgc2V0dGluZywgYW5kIG5vICdkb2N1bWVudHMnIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlbmRlclRvUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ291dCcpO1xuICAgICAgICBpZiAoIXRoaXMuI3JlbmRlclRvKSAge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocmVuZGVyVG9QYXRoKVxuICAgICAgICAgICAgICYmIChzdGF0ID0gZnMuc3RhdFN5bmMocmVuZGVyVG9QYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UmVuZGVyRGVzdGluYXRpb24oJ291dCcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidvdXQnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhyZW5kZXJUb1BhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0UmVuZGVyRGVzdGluYXRpb24oJ291dCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI3JlbmRlclRvICYmICFmcy5leGlzdHNTeW5jKHRoaXMuI3JlbmRlclRvKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHRoaXMuI3JlbmRlclRvLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBha2FzaGFjbXMtYnVpbHRpbiBwbHVnaW4gbmVlZHMgdG8gYmUgbGFzdCBvbiB0aGUgY2hhaW4gc28gdGhhdFxuICAgICAgICAvLyBpdHMgcGFydGlhbHMgZXRjIGNhbiBiZSBlYXNpbHkgb3ZlcnJpZGRlbi4gIFRoaXMgaXMgdGhlIG1vc3QgY29udmVuaWVudFxuICAgICAgICAvLyBwbGFjZSB0byBkZWNsYXJlIHRoYXQgcGx1Z2luLlxuICAgICAgICAvL1xuXG4gICAgICAgIC8vIE5vcm1hbGx5IHdlJ2QgZG8gcmVxdWlyZSgnLi9idWlsdC1pbi5qcycpLlxuICAgICAgICAvLyBCdXQsIGluIHRoaXMgY29udGV4dCB0aGF0IGRvZXNuJ3Qgd29yay5cbiAgICAgICAgLy8gV2hhdCB3ZSBkaWQgaXMgdG8gaW1wb3J0IHRoZVxuICAgICAgICAvLyBCdWlsdEluUGx1Z2luIGNsYXNzIGVhcmxpZXIgc28gdGhhdFxuICAgICAgICAvLyBpdCBjYW4gYmUgdXNlZCBoZXJlLlxuICAgICAgICB0aGlzLnVzZShCdWlsdEluUGx1Z2luLCB7XG4gICAgICAgICAgICAvLyBidWlsdC1pbiBvcHRpb25zIGlmIGFueVxuICAgICAgICAgICAgLy8gRG8gbm90IG5lZWQgdGhpcyBoZXJlIGFueSBsb25nZXIgYmVjYXVzZSBpdCBpcyBoYW5kbGVkXG4gICAgICAgICAgICAvLyBpbiB0aGUgY29uc3RydWN0b3IuXG4gICAgICAgICAgICAvLyBTZXQgdXAgdGhlIE1haGFiaHV0YSBwYXJ0aWFsIHRhZyBzbyBpdCByZW5kZXJzIHRocm91Z2ggQWthc2hhUmVuZGVyXG4gICAgICAgICAgICAvLyByZW5kZXJQYXJ0aWFsOiBmdW5jdGlvbihmbmFtZSwgbWV0YWRhdGEpIHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gcmVuZGVyLnBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWNvcmQgdGhlIGNvbmZpZ3VyYXRpb24gZGlyZWN0b3J5IHNvIHRoYXQgd2UgY2FuIGNvcnJlY3RseSBpbnRlcnBvbGF0ZVxuICAgICAqIHRoZSBwYXRobmFtZXMgd2UncmUgcHJvdmlkZWQuXG4gICAgICovXG4gICAgc2V0IGNvbmZpZ0RpcihjZmdkaXIpIHsgdGhpcy4jY29uZmlnZGlyID0gY2ZnZGlyOyB9XG4gICAgZ2V0IGNvbmZpZ0RpcigpIHsgcmV0dXJuIHRoaXMuI2NvbmZpZ2RpcjsgfVxuXG4gICAgc2V0IGNhY2hlRGlyKGRpcm5tKSB7IHRoaXMuI2NhY2hlZGlyID0gZGlybm07IH1cbiAgICBnZXQgY2FjaGVEaXIoKSB7IHJldHVybiB0aGlzLiNjYWNoZWRpcjsgfVxuXG4gICAgZ2V0IGNhY2hlQXV0b3NhdmUoKSB7IHJldHVybiB0aGlzLiNhdXRvc2F2ZTsgfVxuICAgIHNldCBjYWNoZUF1dG9zYXZlKGF1dG8pIHsgdGhpcy4jYXV0b3NhdmUgPSBhdXRvOyB9XG5cbiAgICBnZXQgY2FjaGVBdXRvbG9hZCgpIHsgcmV0dXJuIHRoaXMuI2F1dG9sb2FkOyB9XG4gICAgc2V0IGNhY2hlQXV0b2xvYWQoYXV0bykgeyB0aGlzLiNhdXRvbG9hZCA9IGF1dG87IH1cblxuICAgIC8vIHNldCBha2FzaGEoX2FrYXNoYSkgIHsgdGhpc1tfY29uZmlnX2FrYXNoYV0gPSBfYWthc2hhOyB9XG4gICAgZ2V0IGFrYXNoYSgpIHsgcmV0dXJuIG1vZHVsZV9leHBvcnRzOyB9XG5cbiAgICBhc3luYyBkb2N1bWVudHNDYWNoZSgpIHsgcmV0dXJuIGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTsgfVxuICAgIGFzeW5jIGFzc2V0c0NhY2hlKCkgICAgeyByZXR1cm4gZmlsZWNhY2hlLmFzc2V0c0NhY2hlOyB9XG4gICAgYXN5bmMgbGF5b3V0c0NhY2hlKCkgICB7IHJldHVybiBmaWxlY2FjaGUubGF5b3V0c0NhY2hlOyB9XG4gICAgYXN5bmMgcGFydGlhbHNDYWNoZSgpICB7IHJldHVybiBmaWxlY2FjaGUucGFydGlhbHNDYWNoZTsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBkb2N1bWVudERpcnMgY29uZmlndXJhdGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqL1xuICAgIGFkZERvY3VtZW50c0RpcihkaXIpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBpZiAodGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyKSkge1xuICAgICAgICAgICAgICAgIGRpciA9IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRpciA9PT0gJ29iamVjdCcgJiYgIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSkge1xuICAgICAgICAgICAgICAgIGRpci5zcmMgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2RvY3VtZW50RGlycy5wdXNoKGRpcik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGREb2N1bWVudHNEaXIgJHt1dGlsLmluc3BlY3QoZGlyKX0gPT0+ICR7dXRpbC5pbnNwZWN0KHRoaXNbX2NvbmZpZ19kb2N1bWVudERpcnNdKX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGRvY3VtZW50RGlycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2RvY3VtZW50RGlycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb29rIHVwIHRoZSBkb2N1bWVudCBkaXJlY3RvcnkgaW5mb3JtYXRpb24gZm9yIGEgZ2l2ZW4gZG9jdW1lbnQgZGlyZWN0b3J5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJuYW1lIFRoZSBkb2N1bWVudCBkaXJlY3RvcnkgdG8gc2VhcmNoIGZvclxuICAgICAqL1xuICAgIGRvY3VtZW50RGlySW5mbyhkaXJuYW1lKSB7XG4gICAgICAgIGZvciAodmFyIGRvY0RpciBvZiB0aGlzLmRvY3VtZW50RGlycykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkb2NEaXIgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY0Rpci5zcmMgPT09IGRpcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvY0RpcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY0RpciA9PT0gZGlybmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkb2NEaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIGxheW91dERpcnMgY29uZmlndXJ0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlXG4gICAgICovXG4gICAgYWRkTGF5b3V0c0RpcihkaXIpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBpZiAodGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyKSkge1xuICAgICAgICAgICAgICAgIGRpciA9IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRpciA9PT0gJ29iamVjdCcgJiYgIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSkge1xuICAgICAgICAgICAgICAgIGRpci5zcmMgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2xheW91dERpcnMucHVzaChkaXIpO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMuYWRkTGF5b3V0RGlyKGRpci5zcmMgPyBkaXIuc3JjIDogZGlyKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIGFkZExheW91dHNEaXIgJHt1dGlsLmluc3BlY3QoZGlyKX0gbGF5b3V0RGlycyAke3V0aWwuaW5zcGVjdCh0aGlzLiNsYXlvdXREaXJzKX0gUmVuZGVyZXJzIGxheW91dERpcnMgJHt1dGlsLmluc3BlY3QodGhpcy4jcmVuZGVyZXJzLmxheW91dERpcnMpfWApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbGF5b3V0RGlycygpIHsgcmV0dXJuIHRoaXMuI2xheW91dERpcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgcGFydGlhbERpcnMgY29uZmlndXJ0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkUGFydGlhbHNEaXIoZGlyKSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJyAmJiAhcGF0aC5pc0Fic29sdXRlKGRpcikpIHtcbiAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkaXIgPT09ICdvYmplY3QnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykpIHtcbiAgICAgICAgICAgICAgICBkaXIuc3JjID0gcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgYWRkUGFydGlhbHNEaXIgYCwgZGlyKTtcbiAgICAgICAgdGhpcy4jcGFydGlhbERpcnMucHVzaChkaXIpO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMuYWRkUGFydGlhbERpcihkaXIuc3JjID8gZGlyLnNyYyA6IGRpcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBwYXJ0aWFsc0RpcnMoKSB7IHJldHVybiB0aGlzLiNwYXJ0aWFsRGlyczsgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgYXNzZXREaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEFzc2V0c0RpcihkaXIpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBpZiAodGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyKSkge1xuICAgICAgICAgICAgICAgIGRpciA9IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRpciA9PT0gJ29iamVjdCcgJiYgIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSkge1xuICAgICAgICAgICAgICAgIGRpci5zcmMgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2Fzc2V0c0RpcnMucHVzaChkaXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgYXNzZXREaXJzKCkgeyByZXR1cm4gdGhpcy4jYXNzZXRzRGlyczsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGFuIGFycmF5IG9mIE1haGFiaHV0YSBmdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBtYWhhZnVuY3NcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRNYWhhYmh1dGEobWFoYWZ1bmNzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWFoYWZ1bmNzID09PSAndW5kZWZpbmVkJyB8fCAhbWFoYWZ1bmNzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuZGVmaW5lZCBtYWhhZnVuY3MgaW4gJHt0aGlzLmNvbmZpZ0Rpcn1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MucHVzaChtYWhhZnVuY3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWFoYWZ1bmNzKCkgeyByZXR1cm4gdGhpcy4jbWFoYWZ1bmNzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmUgdGhlIGRpcmVjdG9yeSBpbnRvIHdoaWNoIHRoZSBwcm9qZWN0IGlzIHJlbmRlcmVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHNldFJlbmRlckRlc3RpbmF0aW9uKGRpcikge1xuICAgICAgICAvLyBJZiB3ZSBoYXZlIGEgY29uZmlnRGlyLCBhbmQgaXQncyBhIHJlbGF0aXZlIGRpcmVjdG9yeSwgbWFrZSBpdFxuICAgICAgICAvLyByZWxhdGl2ZSB0byB0aGUgY29uZmlnRGlyXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycgJiYgIXBhdGguaXNBYnNvbHV0ZShkaXIpKSB7XG4gICAgICAgICAgICAgICAgZGlyID0gcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuI3JlbmRlclRvID0gZGlyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogRmV0Y2ggdGhlIGRlY2xhcmVkIGRlc3RpbmF0aW9uIGZvciByZW5kZXJpbmcgdGhlIHByb2plY3QuICovXG4gICAgZ2V0IHJlbmRlckRlc3RpbmF0aW9uKCkgeyByZXR1cm4gdGhpcy4jcmVuZGVyVG87IH1cbiAgICBnZXQgcmVuZGVyVG8oKSB7IHJldHVybiB0aGlzLiNyZW5kZXJUbzsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgdmFsdWUgdG8gdGhlIHByb2plY3QgbWV0YWRhdGEuICBUaGUgbWV0YWRhdGEgaXMgY29tYmluZWQgd2l0aFxuICAgICAqIHRoZSBkb2N1bWVudCBtZXRhZGF0YSBhbmQgdXNlZCBkdXJpbmcgcmVuZGVyaW5nLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbmRleCBUaGUga2V5IHRvIHN0b3JlIHRoZSB2YWx1ZS5cbiAgICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHN0b3JlIGluIHRoZSBtZXRhZGF0YS5cbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRNZXRhZGF0YShpbmRleCwgdmFsdWUpIHtcbiAgICAgICAgdmFyIG1kID0gdGhpcy4jbWV0YWRhdGE7XG4gICAgICAgIG1kW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLiNtZXRhZGF0YTsgfVxuXG4gICAgLyoqXG4gICAgKiBEb2N1bWVudCB0aGUgVVJMIGZvciBhIHdlYnNpdGUgcHJvamVjdC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSByb290X3VybFxuICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgKi9cbiAgICByb290VVJMKHJvb3RfdXJsKSB7XG4gICAgICAgIHRoaXMuI3Jvb3RfdXJsID0gcm9vdF91cmw7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCByb290X3VybCgpIHsgcmV0dXJuIHRoaXMuI3Jvb3RfdXJsOyB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgaG93IG1hbnkgZG9jdW1lbnRzIHRvIHJlbmRlciBjb25jdXJyZW50bHkuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGNvbmN1cnJlbmN5XG4gICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBzZXRDb25jdXJyZW5jeShjb25jdXJyZW5jeSkge1xuICAgICAgICB0aGlzLiNjb25jdXJyZW5jeSA9IGNvbmN1cnJlbmN5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgY29uY3VycmVuY3koKSB7IHJldHVybiB0aGlzLiNjb25jdXJyZW5jeTsgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBKYXZhU2NyaXB0IHRvIGFkZCB3aXRoaW4gdGhlIGhlYWQgdGFnIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRIZWFkZXJKYXZhU2NyaXB0KHNjcmlwdCkge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLmphdmFTY3JpcHRUb3AucHVzaChzY3JpcHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgc2NyaXB0cygpIHsgcmV0dXJuIHRoaXMuI3NjcmlwdHM7IH1cblxuICAgIC8qKlxuICAgICAqIERlY2xhcmUgSmF2YVNjcmlwdCB0byBhZGQgYXQgdGhlIGJvdHRvbSBvZiByZW5kZXJlZCBwYWdlcy5cbiAgICAgKiBAcGFyYW0gc2NyaXB0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkRm9vdGVySmF2YVNjcmlwdChzY3JpcHQpIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tLnB1c2goc2NyaXB0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBhIENTUyBTdHlsZXNoZWV0IHRvIGFkZCB3aXRoaW4gdGhlIGhlYWQgdGFnIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRTdHlsZXNoZWV0KGNzcykge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLnN0eWxlc2hlZXRzLnB1c2goY3NzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0TWFoYWJodXRhQ29uZmlnKGNoZWVyaW8pIHtcbiAgICAgICAgdGhpcy4jY2hlZXJpbyA9IGNoZWVyaW87XG5cbiAgICAgICAgLy8gRm9yIGNoZWVyaW8gMS4wLjAtcmMuMTAgd2UgbmVlZCB0byB1c2UgdGhpcyBzZXR0aW5nLlxuICAgICAgICAvLyBJZiB0aGUgY29uZmlndXJhdGlvbiBoYXMgc2V0IHRoaXMsIHdlIG11c3Qgbm90XG4gICAgICAgIC8vIG92ZXJyaWRlIHRoZWlyIHNldHRpbmcuICBCdXQsIGdlbmVyYWxseSwgZm9yIGNvcnJlY3RcbiAgICAgICAgLy8gb3BlcmF0aW9uIGFuZCBoYW5kbGluZyBvZiBNYWhhYmh1dGEgdGFncywgd2UgbmVlZFxuICAgICAgICAvLyB0aGlzIHNldHRpbmcgdG8gYmUgPGNvZGU+dHJ1ZTwvY29kZT5cbiAgICAgICAgaWYgKCEoJ191c2VIdG1sUGFyc2VyMicgaW4gdGhpcy4jY2hlZXJpbykpIHtcbiAgICAgICAgICAgIHRoaXMuI2NoZWVyaW8uX3VzZUh0bWxQYXJzZXIyID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXNbX2NvbmZpZ19jaGVlcmlvXSk7XG4gICAgfVxuXG4gICAgZ2V0IG1haGFiaHV0YUNvbmZpZygpIHsgcmV0dXJuIHRoaXMuI2NoZWVyaW87IH1cblxuICAgIC8qKlxuICAgICAqIENvcHkgdGhlIGNvbnRlbnRzIG9mIGFsbCBkaXJlY3RvcmllcyBpbiBhc3NldERpcnMgdG8gdGhlIHJlbmRlciBkZXN0aW5hdGlvbi5cbiAgICAgKi9cbiAgICBhc3luYyBjb3B5QXNzZXRzKCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnY29weUFzc2V0cyBTVEFSVCcpO1xuXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IGZpbGVjYWNoZS5hc3NldHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgYXNzZXRzLmlzUmVhZHkoKTtcbiAgICAgICAgLy8gRmV0Y2ggdGhlIGxpc3Qgb2YgYWxsIGFzc2V0cyBmaWxlc1xuICAgICAgICBjb25zdCBwYXRocyA9IGF3YWl0IGFzc2V0cy5wYXRocygpO1xuXG4gICAgICAgIC8vIFRoZSB3b3JrIHRhc2sgaXMgdG8gY29weSBlYWNoIGZpbGVcbiAgICAgICAgY29uc3QgcXVldWUgPSBmYXN0cS5wcm9taXNlKGFzeW5jIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgJHtjb25maWcucmVuZGVyVG99ICR7aXRlbS5yZW5kZXJQYXRofWApO1xuICAgICAgICAgICAgICAgIGxldCBkZXN0Rk4gPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlclRvLCBpdGVtLnJlbmRlclBhdGgpO1xuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IGV4aXN0c1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUoZGVzdEZOKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgLy8gQ29weSBmcm9tIHRoZSBhYnNvbHV0ZSBwYXRobmFtZSwgdG8gdGhlIGNvbXB1dGVkIFxuICAgICAgICAgICAgICAgIC8vIGxvY2F0aW9uIHdpdGhpbiB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgJHtpdGVtLmZzcGF0aH0gPT0+ICR7ZGVzdEZOfWApO1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5jcChpdGVtLmZzcGF0aCwgZGVzdEZOLCB7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb3B5QXNzZXRzIEZBSUwgdG8gY29weSAke2l0ZW0uZnNwYXRofSAke2l0ZW0udnBhdGh9ICR7aXRlbS5yZW5kZXJQYXRofSAke2NvbmZpZy5yZW5kZXJUb30gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTApO1xuXG4gICAgICAgIC8vIFB1c2ggdGhlIGxpc3Qgb2YgYXNzZXQgZmlsZXMgaW50byB0aGUgcXVldWVcbiAgICAgICAgLy8gQmVjYXVzZSBxdWV1ZS5wdXNoIHJldHVybnMgUHJvbWlzZSdzIHdlIGVuZCB1cCB3aXRoXG4gICAgICAgIC8vIGFuIGFycmF5IG9mIFByb21pc2Ugb2JqZWN0c1xuICAgICAgICBjb25zdCB3YWl0Rm9yID0gW107XG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIHBhdGhzKSB7XG4gICAgICAgICAgICB3YWl0Rm9yLnB1c2gocXVldWUucHVzaChlbnRyeSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoaXMgd2FpdHMgZm9yIGFsbCBQcm9taXNlJ3MgdG8gZmluaXNoXG4gICAgICAgIC8vIEJ1dCBpZiB0aGVyZSB3ZXJlIG5vIFByb21pc2Uncywgbm8gbmVlZCB0byB3YWl0XG4gICAgICAgIGlmICh3YWl0Rm9yLmxlbmd0aCA+IDApIGF3YWl0IFByb21pc2UuYWxsKHdhaXRGb3IpO1xuICAgICAgICAvLyBUaGVyZSBhcmUgbm8gcmVzdWx0cyBpbiB0aGlzIGNhc2UgdG8gY2FyZSBhYm91dFxuICAgICAgICAvLyBjb25zdCByZXN1bHRzID0gW107XG4gICAgICAgIC8vIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIC8vICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbCB0aGUgYmVmb3JlU2l0ZVJlbmRlcmVkIGZ1bmN0aW9uIG9mIGFueSBwbHVnaW4gd2hpY2ggaGFzIHRoYXQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgYXN5bmMgaG9va0JlZm9yZVNpdGVSZW5kZXJlZCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2hvb2tCZWZvcmVTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5iZWZvcmVTaXRlUmVuZGVyZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IGJlZm9yZVNpdGVSZW5kZXJlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5iZWZvcmVTaXRlUmVuZGVyZWQoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGwgdGhlIG9uU2l0ZVJlbmRlcmVkIGZ1bmN0aW9uIG9mIGFueSBwbHVnaW4gd2hpY2ggaGFzIHRoYXQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgYXN5bmMgaG9va1NpdGVSZW5kZXJlZCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2hvb2tTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vblNpdGVSZW5kZXJlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25TaXRlUmVuZGVyZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25TaXRlUmVuZGVyZWQoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQWRkZWQoY29sbGVjdGlvbiwgdnBpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBob29rRmlsZUFkZGVkICR7Y29sbGVjdGlvbn0gJHt2cGluZm8udnBhdGh9YCk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlQWRkZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uRmlsZUFkZGVkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUFkZGVkKGNvbmZpZywgY29sbGVjdGlvbiwgdnBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQ2hhbmdlZChjb2xsZWN0aW9uLCB2cGluZm8pIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVDaGFuZ2VkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvbkZpbGVDaGFuZ2VkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUNoYW5nZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVVbmxpbmtlZChjb2xsZWN0aW9uLCB2cGluZm8pIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVVbmxpbmtlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25GaWxlVW5saW5rZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlVW5saW5rZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVDYWNoZVNldHVwKGNvbGxlY3Rpb25ubSwgY29sbGVjdGlvbikge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUNhY2hlU2V0dXAgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUNhY2hlU2V0dXAoY29uZmlnLCBjb2xsZWN0aW9ubm0sIGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va1BsdWdpbkNhY2hlU2V0dXAoKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25QbHVnaW5DYWNoZVNldHVwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vblBsdWdpbkNhY2hlU2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHVzZSAtIGdvIHRocm91Z2ggcGx1Z2lucyBhcnJheSwgYWRkaW5nIGVhY2ggdG8gdGhlIHBsdWdpbnMgYXJyYXkgaW5cbiAgICAgKiB0aGUgY29uZmlnIGZpbGUsIHRoZW4gY2FsbGluZyB0aGUgY29uZmlnIGZ1bmN0aW9uIG9mIGVhY2ggcGx1Z2luLlxuICAgICAqIEBwYXJhbSBQbHVnaW5PYmogVGhlIHBsdWdpbiBuYW1lIG9yIG9iamVjdCB0byBhZGRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICB1c2UoUGx1Z2luT2JqLCBvcHRpb25zKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29uZmlndXJhdGlvbiAjMSB1c2UgUGx1Z2luT2JqIFwiKyB0eXBlb2YgUGx1Z2luT2JqICtcIiBcIisgdXRpbC5pbnNwZWN0KFBsdWdpbk9iaikpO1xuICAgICAgICBpZiAodHlwZW9mIFBsdWdpbk9iaiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgZ29pbmcgdG8gZmFpbCBiZWNhdXNlXG4gICAgICAgICAgICAvLyByZXF1aXJlIGRvZXNuJ3Qgd29yayBpbiB0aGlzIGNvbnRleHRcbiAgICAgICAgICAgIC8vIEZ1cnRoZXIsIHRoaXMgY29udGV4dCBkb2VzIG5vdFxuICAgICAgICAgICAgLy8gc3VwcG9ydCBhc3luYyBmdW5jdGlvbnMsIHNvIHdlXG4gICAgICAgICAgICAvLyBjYW5ub3QgZG8gaW1wb3J0LlxuICAgICAgICAgICAgUGx1Z2luT2JqID0gcmVxdWlyZShQbHVnaW5PYmopO1xuICAgICAgICB9XG4gICAgICAgIGlmICghUGx1Z2luT2JqIHx8IFBsdWdpbk9iaiBpbnN0YW5jZW9mIFBsdWdpbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gcGx1Z2luIHN1cHBsaWVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29uZmlndXJhdGlvbiAjMiB1c2UgUGx1Z2luT2JqIFwiKyB0eXBlb2YgUGx1Z2luT2JqICtcIiBcIisgdXRpbC5pbnNwZWN0KFBsdWdpbk9iaikpO1xuICAgICAgICB2YXIgcGx1Z2luID0gbmV3IFBsdWdpbk9iaigpO1xuICAgICAgICBwbHVnaW4uYWthc2hhID0gdGhpcy5ha2FzaGE7XG4gICAgICAgIHRoaXMuI3BsdWdpbnMucHVzaChwbHVnaW4pO1xuICAgICAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgcGx1Z2luLmNvbmZpZ3VyZSh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHBsdWdpbnMoKSB7IHJldHVybiB0aGlzLiNwbHVnaW5zOyB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlIG92ZXIgdGhlIGluc3RhbGxlZCBwbHVnaW5zLCBjYWxsaW5nIHRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gYGl0ZXJhdG9yYFxuICAgICAqIGZvciBlYWNoIHBsdWdpbiwgdGhlbiBjYWxsaW5nIHRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gYGZpbmFsYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpdGVyYXRvciBUaGUgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCBwbHVnaW4uICBTaWduYXR1cmU6IGBmdW5jdGlvbihwbHVnaW4sIG5leHQpYCAgVGhlIGBuZXh0YCBwYXJhbWV0ZXIgaXMgYSBmdW5jdGlvbiB1c2VkIHRvIGluZGljYXRlIGVycm9yIC0tIGBuZXh0KGVycilgIC0tIG9yIHN1Y2Nlc3MgLS0gbmV4dCgpXG4gICAgICogQHBhcmFtIGZpbmFsIFRoZSBmdW5jdGlvbiB0byBjYWxsIGFmdGVyIGFsbCBpdGVyYXRvciBjYWxscyBoYXZlIGJlZW4gbWFkZS4gIFNpZ25hdHVyZTogYGZ1bmN0aW9uKGVycilgXG4gICAgICovXG4gICAgZWFjaFBsdWdpbihpdGVyYXRvciwgZmluYWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZWFjaFBsdWdpbiBkZXByZWNhdGVkXCIpO1xuICAgICAgICAvKiBhc3luYy5lYWNoU2VyaWVzKHRoaXMucGx1Z2lucyxcbiAgICAgICAgZnVuY3Rpb24ocGx1Z2luLCBuZXh0KSB7XG4gICAgICAgICAgICBpdGVyYXRvcihwbHVnaW4sIG5leHQpO1xuICAgICAgICB9LFxuICAgICAgICBmaW5hbCk7ICovXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9vayBmb3IgYSBwbHVnaW4sIHJldHVybmluZyBpdHMgbW9kdWxlIHJlZmVyZW5jZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAqIEByZXR1cm5zIHtQbHVnaW59XG4gICAgICovXG4gICAgcGx1Z2luKG5hbWUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2NvbmZpZy5wbHVnaW46ICcrIHV0aWwuaW5zcGVjdCh0aGlzLl9wbHVnaW5zKSk7XG4gICAgICAgIGlmICghIHRoaXMucGx1Z2lucykge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBwbHVnaW5LZXkgaW4gdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICB2YXIgcGx1Z2luID0gdGhpcy5wbHVnaW5zW3BsdWdpbktleV07XG4gICAgICAgICAgICBpZiAocGx1Z2luLm5hbWUgPT09IG5hbWUpIHJldHVybiBwbHVnaW47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coYFdBUk5JTkc6IERpZCBub3QgZmluZCBwbHVnaW4gJHtuYW1lfWApO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlIHRoZSBwbHVnaW5EYXRhIG9iamVjdCBmb3IgdGhlIG5hbWVkIHBsdWdpbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICovIFxuICAgIHBsdWdpbkRhdGEobmFtZSkge1xuICAgICAgICB2YXIgcGx1Z2luRGF0YUFycmF5ID0gdGhpcy4jcGx1Z2luRGF0YTtcbiAgICAgICAgaWYgKCEobmFtZSBpbiBwbHVnaW5EYXRhQXJyYXkpKSB7XG4gICAgICAgICAgICBwbHVnaW5EYXRhQXJyYXlbbmFtZV0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGx1Z2luRGF0YUFycmF5W25hbWVdO1xuICAgIH1cblxuICAgIGFza1BsdWdpbnNMZWdpdExvY2FsSHJlZihocmVmKSB7XG4gICAgICAgIGZvciAodmFyIHBsdWdpbiBvZiB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLmlzTGVnaXRMb2NhbEhyZWYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBsdWdpbi5pc0xlZ2l0TG9jYWxIcmVmKHRoaXMsIGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJSZW5kZXJlcihyZW5kZXJlcikge1xuICAgICAgICBpZiAoIShyZW5kZXJlciBpbnN0YW5jZW9mIFJlbmRlcmVyKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm90IEEgUmVuZGVyZXIgJysgdXRpbC5pbnNwZWN0KHJlbmRlcmVyKSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vdCBhIFJlbmRlcmVyICR7cmVuZGVyZXIubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuZmluZFJlbmRlcmVyTmFtZShyZW5kZXJlci5uYW1lKSkge1xuICAgICAgICAgICAgLy8gcmVuZGVyZXIuYWthc2hhID0gdGhpcy5ha2FzaGE7XG4gICAgICAgICAgICAvLyByZW5kZXJlci5jb25maWcgPSB0aGlzO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHJlZ2lzdGVyUmVuZGVyZXIgYCwgcmVuZGVyZXIpO1xuICAgICAgICAgICAgdGhpcy4jcmVuZGVyZXJzLnJlZ2lzdGVyUmVuZGVyZXIocmVuZGVyZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxsb3cgYW4gYXBwbGljYXRpb24gdG8gb3ZlcnJpZGUgb25lIG9mIHRoZSBidWlsdC1pbiByZW5kZXJlcnNcbiAgICAgKiB0aGF0IGFyZSBpbml0aWFsaXplZCBiZWxvdy4gIFRoZSBpbnNwaXJhdGlvbiBpcyBlcHVidG9vbHMgdGhhdFxuICAgICAqIG11c3Qgd3JpdGUgSFRNTCBmaWxlcyB3aXRoIGFuIC54aHRtbCBleHRlbnNpb24uICBUaGVyZWZvcmUgaXRcbiAgICAgKiBjYW4gc3ViY2xhc3MgRUpTUmVuZGVyZXIgZXRjIHdpdGggaW1wbGVtZW50YXRpb25zIHRoYXQgZm9yY2UgdGhlXG4gICAgICogZmlsZSBuYW1lIHRvIGJlIC54aHRtbC4gIFdlJ3JlIG5vdCBjaGVja2luZyBpZiB0aGUgcmVuZGVyZXIgbmFtZVxuICAgICAqIGlzIGFscmVhZHkgdGhlcmUgaW4gY2FzZSBlcHVidG9vbHMgbXVzdCB1c2UgdGhlIHNhbWUgcmVuZGVyZXIgbmFtZS5cbiAgICAgKi9cbiAgICByZWdpc3Rlck92ZXJyaWRlUmVuZGVyZXIocmVuZGVyZXIpIHtcbiAgICAgICAgaWYgKCEocmVuZGVyZXIgaW5zdGFuY2VvZiBSZW5kZXJlcikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vdCBBIFJlbmRlcmVyICcrIHV0aWwuaW5zcGVjdChyZW5kZXJlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYSBSZW5kZXJlcicpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlbmRlcmVyLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICAvLyByZW5kZXJlci5jb25maWcgPSB0aGlzO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMucmVnaXN0ZXJPdmVycmlkZVJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgICB9XG5cbiAgICBmaW5kUmVuZGVyZXJOYW1lKG5hbWUpOiBSZW5kZXJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLiNyZW5kZXJlcnMuZmluZFJlbmRlcmVyTmFtZShuYW1lKTtcbiAgICB9XG5cbiAgICBmaW5kUmVuZGVyZXJQYXRoKF9wYXRoKTogUmVuZGVyZXIge1xuICAgICAgICByZXR1cm4gdGhpcy4jcmVuZGVyZXJzLmZpbmRSZW5kZXJlclBhdGgoX3BhdGgpO1xuICAgIH1cblxuICAgIGdldCByZW5kZXJlcnMoKSB7IHJldHVybiB0aGlzLiNyZW5kZXJlcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYSBSZW5kZXJlciBieSBpdHMgZXh0ZW5zaW9uLlxuICAgICAqL1xuICAgIGZpbmRSZW5kZXJlcihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRSZW5kZXJlck5hbWUobmFtZSk7XG4gICAgfVxufVxuXG5jb25zdCBtb2R1bGVfZXhwb3J0cyA9IHtcbiAgICBSZW5kZXJlcnMsXG4gICAgUmVuZGVyZXI6IFJlbmRlcmVycy5SZW5kZXJlcixcbiAgICBtYWhhYmh1dGEsXG4gICAgZmlsZWNhY2hlLFxuICAgIHNldHVwLFxuICAgIGNhY2hlU2V0dXAsXG4gICAgY2xvc2VDYWNoZXMsXG4gICAgZmlsZUNhY2hlc1JlYWR5LFxuICAgIFBsdWdpbixcbiAgICByZW5kZXIsXG4gICAgcmVuZGVyRG9jdW1lbnQsXG4gICAgcmVuZGVyUGF0aCxcbiAgICByZWFkUmVuZGVyZWRGaWxlLFxuICAgIHBhcnRpYWwsXG4gICAgcGFydGlhbFN5bmMsXG4gICAgaW5kZXhDaGFpbixcbiAgICByZWxhdGl2ZSxcbiAgICBsaW5rUmVsU2V0QXR0cixcbiAgICBnZW5lcmF0ZVJTUyxcbiAgICBDb25maWd1cmF0aW9uXG59IGFzIGFueTtcblxuZXhwb3J0IGRlZmF1bHQgbW9kdWxlX2V4cG9ydHM7Il19