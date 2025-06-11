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
var _Configuration_renderers, _Configuration_configdir, _Configuration_cachedir, _Configuration_assetsDirs, _Configuration_layoutDirs, _Configuration_documentDirs, _Configuration_partialDirs, _Configuration_mahafuncs, _Configuration_cheerio, _Configuration_renderTo, _Configuration_scripts, _Configuration_concurrency, _Configuration_metadata, _Configuration_root_url, _Configuration_plugins, _Configuration_pluginData;
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
        let dirMount;
        if (typeof dir === 'string') {
            if (!path.isAbsolute(dir) && this.configDir != null) {
                dirMount = {
                    src: path.join(this.configDir, dir),
                    dest: '/'
                };
            }
            else {
                dirMount = {
                    src: dir,
                    dest: '/'
                };
            }
        }
        else if (typeof dir === 'object') {
            if (!path.isAbsolute(dir.src) && this.configDir != null) {
                dir.src = path.join(this.configDir, dir.src);
                dirMount = dir;
            }
            else {
                dirMount = dir;
            }
        }
        else {
            throw new Error(`addDocumentsDir - directory to mount of wrong type ${util.inspect(dir)}`);
        }
        __classPrivateFieldGet(this, _Configuration_documentDirs, "f").push(dirMount);
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
        let dirMount;
        if (typeof dir === 'string') {
            if (!path.isAbsolute(dir) && this.configDir != null) {
                dirMount = {
                    src: path.join(this.configDir, dir),
                    dest: '/'
                };
            }
            else {
                dirMount = {
                    src: dir,
                    dest: '/'
                };
            }
        }
        else if (typeof dir === 'object') {
            if (!path.isAbsolute(dir.src) && this.configDir != null) {
                dir.src = path.join(this.configDir, dir.src);
                dirMount = dir;
            }
            else {
                dirMount = dir;
            }
        }
        else {
            throw new Error(`addLayoutsDir - directory to mount of wrong type ${util.inspect(dir)}`);
        }
        __classPrivateFieldGet(this, _Configuration_layoutDirs, "f").push(dirMount);
        // console.log(`AkashaRender Configuration addLayoutsDir ${util.inspect(dir)} ${util.inspect(dirMount)} layoutDirs ${util.inspect(this.#layoutDirs)} Renderers layoutDirs ${util.inspect(this.#renderers.layoutDirs)}`);
        __classPrivateFieldGet(this, _Configuration_renderers, "f").addLayoutDir(dirMount.src);
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
        let dirMount;
        if (typeof dir === 'string') {
            if (!path.isAbsolute(dir) && this.configDir != null) {
                dirMount = {
                    src: path.join(this.configDir, dir),
                    dest: '/'
                };
            }
            else {
                dirMount = {
                    src: dir,
                    dest: '/'
                };
            }
        }
        else if (typeof dir === 'object') {
            if (!path.isAbsolute(dir.src) && this.configDir != null) {
                dir.src = path.join(this.configDir, dir.src);
                dirMount = dir;
            }
            else {
                dirMount = dir;
            }
        }
        else {
            throw new Error(`addPartialsDir - directory to mount of wrong type ${util.inspect(dir)}`);
        }
        // console.log(`addPartialsDir `, dir);
        __classPrivateFieldGet(this, _Configuration_partialDirs, "f").push(dirMount);
        __classPrivateFieldGet(this, _Configuration_renderers, "f").addPartialDir(dirMount.src);
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
        let dirMount;
        if (typeof dir === 'string') {
            if (!path.isAbsolute(dir) && this.configDir != null) {
                dirMount = {
                    src: path.join(this.configDir, dir),
                    dest: '/'
                };
            }
            else {
                dirMount = {
                    src: dir,
                    dest: '/'
                };
            }
        }
        else if (typeof dir === 'object') {
            if (!path.isAbsolute(dir.src) && this.configDir != null) {
                dir.src = path.join(this.configDir, dir.src);
                dirMount = dir;
            }
            else {
                dirMount = dir;
            }
        }
        else {
            throw new Error(`addAssetsDir - directory to mount of wrong type ${util.inspect(dir)}`);
        }
        __classPrivateFieldGet(this, _Configuration_assetsDirs, "f").push(dirMount);
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
            throw new Error(`Not a Renderer ${util.inspect(renderer)}`);
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
_Configuration_renderers = new WeakMap(), _Configuration_configdir = new WeakMap(), _Configuration_cachedir = new WeakMap(), _Configuration_assetsDirs = new WeakMap(), _Configuration_layoutDirs = new WeakMap(), _Configuration_documentDirs = new WeakMap(), _Configuration_partialDirs = new WeakMap(), _Configuration_mahafuncs = new WeakMap(), _Configuration_cheerio = new WeakMap(), _Configuration_renderTo = new WeakMap(), _Configuration_scripts = new WeakMap(), _Configuration_concurrency = new WeakMap(), _Configuration_metadata = new WeakMap(), _Configuration_root_url = new WeakMap(), _Configuration_plugins = new WeakMap(), _Configuration_pluginData = new WeakMap();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBR0g7OztHQUdHO0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsNENBQTRDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFzQyxVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RixPQUFPLEtBQUssU0FBUyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sS0FBSyxTQUFTLE1BQU0sc0JBQXNCLENBQUM7QUFDbEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ2hELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEtBQUssU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUN2QyxPQUFPLEtBQUssU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUN2QyxPQUFPLEtBQUssT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUNuQyxPQUFPLFdBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUVwRCxPQUFPLEtBQUssUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNyQyxPQUFPLEtBQUssUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUVyQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3JDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFckMsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFj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QUN6QixPQUFPLHVCQUFBLElBQUksZ0NBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsZ0JBQWdCLENBQUMsS0FBYTtRQUMxQixPQUFPLHVCQUFBLElBQUksZ0NBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsSUFBSSxTQUFTLEtBQUssT0FBTyx1QkFBQSxJQUFJLGdDQUFXLENBQUMsQ0FBQyxDQUFDO0lBRTNDOztPQUVHO0lBQ0gsWUFBWSxDQUFDLElBQVk7UUFDckIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztDQUNKOztBQUVELE1BQU0sY0FBYyxHQUFHO0lBQ25CLFNBQVM7SUFDVCxRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsU0FBUztJQUNULFNBQVM7SUFDVCxLQUFLO0lBQ0wsVUFBVTtJQUNWLFdBQVc7SUFDWCxlQUFlO0lBQ2YsTUFBTTtJQUNOLE1BQU07SUFDTixjQUFjO0lBQ2QsVUFBVTtJQUNWLGdCQUFnQjtJQUNoQixPQUFPO0lBQ1AsV0FBVztJQUNYLFVBQVU7SUFDVixRQUFRO0lBQ1IsY0FBYztJQUNkLFdBQVc7SUFDWCxhQUFhO0NBQ1QsQ0FBQztBQUVULGVBQWUsY0FBYyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyMiBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblxuLyoqXG4gKiBBa2FzaGFSZW5kZXJcbiAqIEBtb2R1bGUgYWthc2hhcmVuZGVyXG4gKi9cblxuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbi8vIGNvbnN0IG9lbWJldHRlciA9IHJlcXVpcmUoJ29lbWJldHRlcicpKCk7XG5pbXBvcnQgUlNTIGZyb20gJ3Jzcyc7XG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHsgRGlyc1dhdGNoZXIsIFZQYXRoRGF0YSwgZGlyVG9XYXRjaCwgbWltZWRlZmluZSB9IGZyb20gJ0Bha2FzaGFjbXMvc3RhY2tlZC1kaXJzJztcbmltcG9ydCAqIGFzIFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5leHBvcnQgKiBhcyBSZW5kZXJlcnMgZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0IHsgUmVuZGVyZXIgfSBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5leHBvcnQgeyBSZW5kZXJlciB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCAqIGFzIG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuZXhwb3J0ICogYXMgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5pbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gJ2NoZWVyaW8nO1xuaW1wb3J0IG1haGFQYXJ0aWFsIGZyb20gJ21haGFiaHV0YS9tYWhhL3BhcnRpYWwuanMnO1xuXG5pbXBvcnQgKiBhcyByZWxhdGl2ZSBmcm9tICdyZWxhdGl2ZSc7XG5leHBvcnQgKiBhcyByZWxhdGl2ZSBmcm9tICdyZWxhdGl2ZSc7XG5cbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vUGx1Z2luLmpzJztcbmV4cG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vUGx1Z2luLmpzJztcblxuaW1wb3J0IHsgcmVuZGVyLCByZW5kZXJEb2N1bWVudCwgcmVuZGVyQ29udGVudCB9IGZyb20gJy4vcmVuZGVyLmpzJztcbmV4cG9ydCB7IHJlbmRlciwgcmVuZGVyRG9jdW1lbnQsIHJlbmRlckNvbnRlbnQgfSBmcm9tICcuL3JlbmRlci5qcyc7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBpbXBvcnQubWV0YS5maWxlbmFtZTtcbmNvbnN0IF9fZGlybmFtZSA9IGltcG9ydC5tZXRhLmRpcm5hbWU7XG5cbi8vIEZvciB1c2UgaW4gQ29uZmlndXJlLnByZXBhcmVcbmltcG9ydCB7IEJ1aWx0SW5QbHVnaW4gfSBmcm9tICcuL2J1aWx0LWluLmpzJztcblxuaW1wb3J0ICogYXMgZmlsZWNhY2hlIGZyb20gJy4vY2FjaGUvZmlsZS1jYWNoZS1zcWxpdGUuanMnO1xuXG5leHBvcnQgeyBuZXdTUTNEYXRhU3RvcmUgfSBmcm9tICcuL3NxZGIuanMnO1xuXG4vLyBUaGVyZSBkb2Vzbid0IHNlZW0gdG8gYmUgYW4gb2ZmaWNpYWwgTUlNRSB0eXBlIHJlZ2lzdGVyZWRcbi8vIGZvciBBc2NpaURvY3RvclxuLy8gcGVyOiBodHRwczovL2FzY2lpZG9jdG9yLm9yZy9kb2NzL2ZhcS9cbi8vIHBlcjogaHR0cHM6Ly9naXRodWIuY29tL2FzY2lpZG9jdG9yL2FzY2lpZG9jdG9yL2lzc3Vlcy8yNTAyXG4vL1xuLy8gQXMgb2YgTm92ZW1iZXIgNiwgMjAyMiwgdGhlIEFzY2lpRG9jdG9yIEZBUSBzYWlkIHRoZXkgYXJlXG4vLyBpbiB0aGUgcHJvY2VzcyBvZiByZWdpc3RlcmluZyBhIE1JTUUgdHlwZSBmb3IgYHRleHQvYXNjaWlkb2NgLlxuLy8gVGhlIE1JTUUgdHlwZSB3ZSBzdXBwbHkgaGFzIGJlZW4gdXBkYXRlZC5cbi8vXG4vLyBUaGlzIGFsc28gc2VlbXMgdG8gYmUgdHJ1ZSBmb3IgdGhlIG90aGVyIGZpbGUgdHlwZXMuICBXZSd2ZSBtYWRlIHVwXG4vLyBzb21lIE1JTUUgdHlwZXMgdG8gZ28gd2l0aCBlYWNoLlxuLy9cbi8vIFRoZSBNSU1FIHBhY2thZ2UgaGFkIHByZXZpb3VzbHkgYmVlbiBpbnN0YWxsZWQgd2l0aCBBa2FzaGFSZW5kZXIuXG4vLyBCdXQsIGl0IHNlZW1zIHRvIG5vdCBiZSB1c2VkLCBhbmQgaW5zdGVhZCB3ZSBjb21wdXRlIHRoZSBNSU1FIHR5cGVcbi8vIGZvciBmaWxlcyBpbiBTdGFja2VkIERpcmVjdG9yaWVzLlxuLy9cbi8vIFRoZSByZXF1aXJlZCB0YXNrIGlzIHRvIHJlZ2lzdGVyIHNvbWUgTUlNRSB0eXBlcyB3aXRoIHRoZVxuLy8gTUlNRSBwYWNrYWdlLiAgSXQgaXNuJ3QgYXBwcm9wcmlhdGUgdG8gZG8gdGhpcyBpblxuLy8gdGhlIFN0YWNrZWQgRGlyZWN0b3JpZXMgcGFja2FnZS4gIEluc3RlYWQgdGhhdCdzIGxlZnRcbi8vIGZvciBjb2RlIHdoaWNoIHVzZXMgU3RhY2tlZCBEaXJlY3RvcmllcyB0byBkZXRlcm1pbmUgd2hpY2hcbi8vIChpZiBhbnkpIGFkZGVkIE1JTUUgdHlwZXMgYXJlIHJlcXVpcmVkLiAgRXJnbywgQWthc2hhUmVuZGVyXG4vLyBuZWVkcyB0byByZWdpc3RlciB0aGUgTUlNRSB0eXBlcyBpdCBpcyBpbnRlcmVzdGVkIGluLlxuLy8gVGhhdCdzIHdoYXQgaXMgaGFwcGVuaW5nIGhlcmUuXG4vL1xuLy8gVGhlcmUncyBhIHRob3VnaHQgdGhhdCB0aGlzIHNob3VsZCBiZSBoYW5kbGVkIGluIHRoZSBSZW5kZXJlclxuLy8gaW1wbGVtZW50YXRpb25zLiAgQnV0IGl0J3Mgbm90IGNlcnRhaW4gdGhhdCdzIGNvcnJlY3QuXG4vL1xuLy8gTm93IHRoYXQgdGhlIFJlbmRlcmVycyBhcmUgaW4gYEBha2FzaGFjbXMvcmVuZGVyZXJzYCBzaG91bGRcbi8vIHRoZXNlIGRlZmluaXRpb25zIG1vdmUgdG8gdGhhdCBwYWNrYWdlP1xuXG5taW1lZGVmaW5lKHsndGV4dC9hc2NpaWRvYyc6IFsgJ2Fkb2MnLCAnYXNjaWlkb2MnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbWFya2RvYyc6IFsgJ21hcmtkb2MnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtZWpzJzogWyAnZWpzJ119KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbnVuanVja3MnOiBbICduamsnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtaGFuZGxlYmFycyc6IFsgJ2hhbmRsZWJhcnMnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbGlxdWlkJzogWyAnbGlxdWlkJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LXRlbXB1cmEnOiBbICd0ZW1wdXJhJyBdfSk7XG5cbi8qKlxuICogUGVyZm9ybXMgc2V0dXAgb2YgdGhpbmdzIHNvIHRoYXQgQWthc2hhUmVuZGVyIGNhbiBmdW5jdGlvbi5cbiAqIFRoZSBjb3JyZWN0IGluaXRpYWxpemF0aW9uIG9mIEFrYXNoYVJlbmRlciBpcyB0b1xuICogMS4gR2VuZXJhdGUgdGhlIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiAyLiBDYWxsIGNvbmZpZy5wcmVwYXJlXG4gKiAzLiBDYWxsIGFrYXNoYXJlbmRlci5zZXR1cFxuICogXG4gKiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXMgYWxsIG9iamVjdHMgdGhhdCBpbml0aWFsaXplIGFzeW5jaHJvbm91c2x5XG4gKiBhcmUgY29ycmVjdGx5IHNldHVwLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKGNvbmZpZykge1xuXG4gICAgY29uZmlnLnJlbmRlcmVycy5wYXJ0aWFsRnVuYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNhbGxpbmcgcGFydGlhbCAke2ZuYW1lfWApO1xuICAgICAgICByZXR1cm4gcGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICBjb25maWcucmVuZGVyZXJzLnBhcnRpYWxTeW5jRnVuYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNhbGxpbmcgcGFydGlhbFN5bmMgJHtmbmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9XG5cbiAgICBhd2FpdCBjYWNoZVNldHVwKGNvbmZpZyk7XG4gICAgYXdhaXQgZmlsZUNhY2hlc1JlYWR5KGNvbmZpZyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZVNldHVwKGNvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZpbGVjYWNoZS5zZXR1cChjb25maWcpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBJTklUSUFMSVpFIENBQ0hFIGAsIGVycik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZUNhY2hlcygpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBmaWxlY2FjaGUuY2xvc2VGaWxlQ2FjaGVzKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYElOSVRJQUxJWkFUSU9OIEZBSUxVUkUgQ09VTEQgTk9UIENMT1NFIENBQ0hFUyBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmlsZUNhY2hlc1JlYWR5KGNvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5pc1JlYWR5KCksXG4gICAgICAgICAgICBmaWxlY2FjaGUuYXNzZXRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLmxheW91dHNDYWNoZS5pc1JlYWR5KCksXG4gICAgICAgICAgICBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5pc1JlYWR5KClcbiAgICAgICAgXSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYElOSVRJQUxJWkFUSU9OIEZBSUxVUkUgQ09VTEQgTk9UIElOSVRJQUxJWkUgQ0FDSEUgU1lTVEVNIGAsIGVycik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJQYXRoKGNvbmZpZywgcGF0aDJyKSB7XG4gICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIGxldCBmb3VuZDtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIHdoaWxlIChjb3VudCA8IDIwKSB7XG4gICAgICAgIC8qIFdoYXQncyBoYXBwZW5pbmcgaXMgdGhpcyBtaWdodCBiZSBjYWxsZWQgZnJvbSBjbGkuanNcbiAgICAgICAgICogaW4gcmVuZGVyLWRvY3VtZW50LCBhbmQgd2UgbWlnaHQgYmUgYXNrZWQgdG8gcmVuZGVyIHRoZVxuICAgICAgICAgKiBsYXN0IGRvY3VtZW50IHRoYXQgd2lsbCBiZSBBREQnZCB0byB0aGUgRmlsZUNhY2hlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBJbiBzdWNoIGEgY2FzZSA8Y29kZT5pc1JlYWR5PC9jb2RlPiBtaWdodCByZXR1cm4gPGNvZGU+dHJ1ZTwvY29kZT5cbiAgICAgICAgICogYnV0IG5vdCBhbGwgZmlsZXMgd2lsbCBoYXZlIGJlZW4gQUREJ2QgdG8gdGhlIEZpbGVDYWNoZS5cbiAgICAgICAgICogSW4gdGhhdCBjYXNlIDxjb2RlPmRvY3VtZW50cy5maW5kPC9jb2RlPiByZXR1cm5zXG4gICAgICAgICAqIDxjb2RlPnVuZGVmaW5lZDwvY29kZT5cbiAgICAgICAgICpcbiAgICAgICAgICogV2hhdCB0aGlzIGRvZXMgaXMgdHJ5IHVwIHRvIDIwIHRpbWVzIHRvIGxvYWQgdGhlIGRvY3VtZW50LFxuICAgICAgICAgKiBzbGVlcGluZyBmb3IgMTAwIG1pbGxpc2Vjb25kcyBlYWNoIHRpbWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBjbGVhbmVyIGFsdGVybmF0aXZlIHdvdWxkIGJlIHRvIHdhaXQgZm9yIG5vdCBvbmx5XG4gICAgICAgICAqIHRoZSA8Y29kZT5yZWFkeTwvY29kZT4gZnJvbSB0aGUgPGNvZGU+ZG9jdW1lbnRzPC9jb2RlPiBGaWxlQ2FjaGUsXG4gICAgICAgICAqIGJ1dCBhbHNvIGZvciBhbGwgdGhlIGluaXRpYWwgQUREIGV2ZW50cyB0byBiZSBoYW5kbGVkLiAgQnV0XG4gICAgICAgICAqIHRoYXQgc2Vjb25kIGNvbmRpdGlvbiBzZWVtcyBkaWZmaWN1bHQgdG8gZGV0ZWN0IHJlbGlhYmx5LlxuICAgICAgICAgKi9cbiAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChwYXRoMnIpO1xuICAgICAgICBpZiAoZm91bmQpIGJyZWFrO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyUGF0aCAke3BhdGgycn1gLCBmb3VuZCk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgZmluZCBkb2N1bWVudCBmb3IgJHtwYXRoMnJ9YCk7XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudChjb25maWcsIGZvdW5kKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFJlYWRzIGEgZmlsZSBmcm9tIHRoZSByZW5kZXJpbmcgZGlyZWN0b3J5LiAgSXQgaXMgcHJpbWFyaWx5IHRvIGJlXG4gKiB1c2VkIGluIHRlc3QgY2FzZXMsIHdoZXJlIHdlJ2xsIHJ1biBhIGJ1aWxkIHRoZW4gcmVhZCB0aGUgaW5kaXZpZHVhbFxuICogZmlsZXMgdG8gbWFrZSBzdXJlIHRoZXkndmUgcmVuZGVyZWQgY29ycmVjdGx5LlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBcbiAqIEBwYXJhbSB7Kn0gZnBhdGggXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRSZW5kZXJlZEZpbGUoY29uZmlnLCBmcGF0aCkge1xuXG4gICAgbGV0IGh0bWwgPSBhd2FpdCBmc3AucmVhZEZpbGUocGF0aC5qb2luKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgZnBhdGgpLCAndXRmOCcpO1xuICAgIGxldCAkID0gY29uZmlnLm1haGFiaHV0YUNvbmZpZyBcbiAgICAgICAgICAgID8gY2hlZXJpby5sb2FkKGh0bWwsIGNvbmZpZy5tYWhhYmh1dGFDb25maWcpIFxuICAgICAgICAgICAgOiBjaGVlcmlvLmxvYWQoaHRtbCk7XG5cbiAgICByZXR1cm4geyBodG1sLCAkIH07XG59XG5cbi8qKlxuICogUmVuZGVycyBhIHBhcnRpYWwgdGVtcGxhdGUgdXNpbmcgdGhlIHN1cHBsaWVkIG1ldGFkYXRhLiAgVGhpcyB2ZXJzaW9uXG4gKiBhbGxvd3MgZm9yIGFzeW5jaHJvbm91cyBleGVjdXRpb24sIGFuZCBldmVyeSBiaXQgb2YgY29kZSBpdFxuICogZXhlY3V0ZXMgaXMgYWxsb3dlZCB0byBiZSBhc3luYy5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiBAcGFyYW0geyp9IGZuYW1lIFBhdGggd2l0aGluIHRoZSBmaWxlY2FjaGUucGFydGlhbHMgY2FjaGVcbiAqIEBwYXJhbSB7Kn0gbWV0YWRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgbWV0YWRhdGFcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhIHN0cmluZyBjb250YWluaW5nIHRoZSByZW5kZXJlZCBzdHVmZlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSkge1xuXG4gICAgaWYgKCFmbmFtZSB8fCB0eXBlb2YgZm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcGFydGlhbCBmbmFtZSBub3QgYSBzdHJpbmcgJHt1dGlsLmluc3BlY3QoZm5hbWUpfWApO1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsICR7Zm5hbWV9YCk7XG4gICAgY29uc3QgZm91bmQgPSBhd2FpdCBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5maW5kKGZuYW1lKTtcbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcGFydGlhbCBmb3VuZCBmb3IgJHtmbmFtZX0gaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLnBhcnRpYWxzRGlycyl9YCk7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsICR7Zm5hbWV9ID09PiAke2ZvdW5kLnZwYXRofSAke2ZvdW5kLmZzcGF0aH1gKTtcbiAgICBcbiAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgYWJvdXQgdG8gcmVuZGVyICR7dXRpbC5pbnNwZWN0KGZvdW5kLnZwYXRoKX1gKTtcbiAgICAgICAgbGV0IHBhcnRpYWxUZXh0O1xuICAgICAgICBpZiAoZm91bmQuZG9jQm9keSkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NCb2R5O1xuICAgICAgICBlbHNlIGlmIChmb3VuZC5kb2NDb250ZW50KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0NvbnRlbnQ7XG4gICAgICAgIGVsc2UgcGFydGlhbFRleHQgPSBhd2FpdCBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuXG4gICAgICAgIC8vIFNvbWUgcmVuZGVyZXJzIChOdW5qdWtzKSByZXF1aXJlIHRoYXQgbWV0YWRhdGEuY29uZmlnXG4gICAgICAgIC8vIHBvaW50IHRvIHRoZSBjb25maWcgb2JqZWN0LiAgVGhpcyBibG9jayBvZiBjb2RlXG4gICAgICAgIC8vIGR1cGxpY2F0ZXMgdGhlIG1ldGFkYXRhIG9iamVjdCwgdGhlbiBzZXRzIHRoZVxuICAgICAgICAvLyBjb25maWcgZmllbGQgaW4gdGhlIGR1cGxpY2F0ZSwgcGFzc2luZyB0aGF0IHRvIHRoZSBwYXJ0aWFsLlxuICAgICAgICBsZXQgbWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBsZXQgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gbWV0YWRhdGEpIHtcbiAgICAgICAgICAgIG1kYXRhW3Byb3BdID0gbWV0YWRhdGFbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgbWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICBtZGF0YS5wYXJ0aWFsU3luYyA9IHBhcnRpYWxTeW5jLmJpbmQocmVuZGVyZXIsIGNvbmZpZyk7XG4gICAgICAgIG1kYXRhLnBhcnRpYWwgICAgID0gcGFydGlhbC5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbC1mdW5jcyByZW5kZXIgJHtyZW5kZXJlci5uYW1lfSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gcmVuZGVyZXIucmVuZGVyKHtcbiAgICAgICAgICAgIGZzcGF0aDogZm91bmQuZnNwYXRoLFxuICAgICAgICAgICAgY29udGVudDogcGFydGlhbFRleHQsXG4gICAgICAgICAgICBtZXRhZGF0YTogbWRhdGFcbiAgICAgICAgICAgIC8vIHBhcnRpYWxUZXh0LCBtZGF0YSwgZm91bmRcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChmb3VuZC52cGF0aC5lbmRzV2l0aCgnLmh0bWwnKSB8fCBmb3VuZC52cGF0aC5lbmRzV2l0aCgnLnhodG1sJykpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgcmVhZGluZyBmaWxlICR7Zm91bmQudnBhdGh9YCk7XG4gICAgICAgIHJldHVybiBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVuZGVyUGFydGlhbCBubyBSZW5kZXJlciBmb3VuZCBmb3IgJHtmbmFtZX0gLSAke2ZvdW5kLnZwYXRofWApO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgcGFydGlhbCB0ZW1wbGF0ZSB1c2luZyB0aGUgc3VwcGxpZWQgbWV0YWRhdGEuICBUaGlzIHZlcnNpb25cbiAqIGFsbG93cyBmb3Igc3luY2hyb25vdXMgZXhlY3V0aW9uLCBhbmQgZXZlcnkgYml0IG9mIGNvZGUgaXRcbiAqIGV4ZWN1dGVzIGlzIHN5bmNocm9ub3VzIGZ1bmN0aW9ucy5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiBAcGFyYW0geyp9IGZuYW1lIFBhdGggd2l0aGluIHRoZSBmaWxlY2FjaGUucGFydGlhbHMgY2FjaGVcbiAqIEBwYXJhbSB7Kn0gbWV0YWRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgbWV0YWRhdGFcbiAqIEByZXR1cm5zIFN0cmluZyBjb250YWluaW5nIHRoZSByZW5kZXJlZCBzdHVmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpIHtcblxuICAgIGlmICghZm5hbWUgfHwgdHlwZW9mIGZuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHBhcnRpYWxTeW5jIGZuYW1lIG5vdCBhIHN0cmluZyAke3V0aWwuaW5zcGVjdChmbmFtZSl9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgZm91bmQgPSBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5maW5kU3luYyhmbmFtZSk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHBhcnRpYWwgZm91bmQgZm9yICR7Zm5hbWV9IGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5wYXJ0aWFsc0RpcnMpfWApO1xuICAgIH1cblxuICAgIHZhciByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgLy8gU29tZSByZW5kZXJlcnMgKE51bmp1a3MpIHJlcXVpcmUgdGhhdCBtZXRhZGF0YS5jb25maWdcbiAgICAgICAgLy8gcG9pbnQgdG8gdGhlIGNvbmZpZyBvYmplY3QuICBUaGlzIGJsb2NrIG9mIGNvZGVcbiAgICAgICAgLy8gZHVwbGljYXRlcyB0aGUgbWV0YWRhdGEgb2JqZWN0LCB0aGVuIHNldHMgdGhlXG4gICAgICAgIC8vIGNvbmZpZyBmaWVsZCBpbiB0aGUgZHVwbGljYXRlLCBwYXNzaW5nIHRoYXQgdG8gdGhlIHBhcnRpYWwuXG4gICAgICAgIGxldCBtZGF0YTogYW55ID0ge307XG4gICAgICAgIGxldCBwcm9wO1xuXG4gICAgICAgIGZvciAocHJvcCBpbiBtZXRhZGF0YSkge1xuICAgICAgICAgICAgbWRhdGFbcHJvcF0gPSBtZXRhZGF0YVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBtZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgICAgIC8vIEluIHRoaXMgY29udGV4dCwgcGFydGlhbFN5bmMgaXMgZGlyZWN0bHkgYXZhaWxhYmxlXG4gICAgICAgIC8vIGFzIGEgZnVuY3Rpb24gdGhhdCB3ZSBjYW4gZGlyZWN0bHkgdXNlLlxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbFN5bmMgYCwgcGFydGlhbFN5bmMpO1xuICAgICAgICBtZGF0YS5wYXJ0aWFsU3luYyA9IHBhcnRpYWxTeW5jLmJpbmQocmVuZGVyZXIsIGNvbmZpZyk7XG4gICAgICAgIC8vIGZvciBmaW5kU3luYywgdGhlIFwiZm91bmRcIiBvYmplY3QgaXMgVlBhdGhEYXRhIHdoaWNoXG4gICAgICAgIC8vIGRvZXMgbm90IGhhdmUgZG9jQm9keSBub3IgZG9jQ29udGVudC4gIFRoZXJlZm9yZSB3ZVxuICAgICAgICAvLyBtdXN0IHJlYWQgdGhpcyBjb250ZW50XG4gICAgICAgIGxldCBwYXJ0aWFsVGV4dCA9IGZzLnJlYWRGaWxlU3luYyhmb3VuZC5mc3BhdGgsICd1dGYtOCcpO1xuICAgICAgICAvLyBpZiAoZm91bmQuZG9jQm9keSkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NCb2R5O1xuICAgICAgICAvLyBlbHNlIGlmIChmb3VuZC5kb2NDb250ZW50KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0NvbnRlbnQ7XG4gICAgICAgIC8vIGVsc2UgcGFydGlhbFRleHQgPSBmcy5yZWFkRmlsZVN5bmMoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgICAgICBcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwtZnVuY3MgcmVuZGVyU3luYyAke3JlbmRlcmVyLm5hbWV9ICR7Zm91bmQudnBhdGh9YCk7XG4gICAgICAgIHJldHVybiByZW5kZXJlci5yZW5kZXJTeW5jKDxSZW5kZXJlcnMuUmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgICAgICBmc3BhdGg6IGZvdW5kLmZzcGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IHBhcnRpYWxUZXh0LFxuICAgICAgICAgICAgbWV0YWRhdGE6IG1kYXRhXG4gICAgICAgICAgICAvLyBwYXJ0aWFsVGV4dCwgbWRhdGEsIGZvdW5kXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZm91bmQudnBhdGguZW5kc1dpdGgoJy5odG1sJykgfHwgZm91bmQudnBhdGguZW5kc1dpdGgoJy54aHRtbCcpKSB7XG4gICAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVuZGVyUGFydGlhbCBubyBSZW5kZXJlciBmb3VuZCBmb3IgJHtmbmFtZX0gLSAke2ZvdW5kLnZwYXRofWApO1xuICAgIH1cbn1cblxuLyoqXG4gKiBTdGFydGluZyBmcm9tIGEgdmlydHVhbCBwYXRoIGluIHRoZSBkb2N1bWVudHMsIHNlYXJjaGVzIHVwd2FyZHMgdG9cbiAqIHRoZSByb290IG9mIHRoZSBkb2N1bWVudHMgZmlsZS1zcGFjZSwgZmluZGluZyBmaWxlcyB0aGF0IFxuICogcmVuZGVyIHRvIFwiaW5kZXguaHRtbFwiLiAgVGhlIFwiaW5kZXguaHRtbFwiIGZpbGVzIGFyZSBpbmRleCBmaWxlcyxcbiAqIGFzIHRoZSBuYW1lIHN1Z2dlc3RzLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBcbiAqIEBwYXJhbSB7Kn0gZm5hbWUgXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluZGV4Q2hhaW4oY29uZmlnLCBmbmFtZSkge1xuXG4gICAgLy8gVGhpcyB1c2VkIHRvIGJlIGEgZnVsbCBmdW5jdGlvbiBoZXJlLCBidXQgaGFzIG1vdmVkXG4gICAgLy8gaW50byB0aGUgRmlsZUNhY2hlIGNsYXNzLiAgUmVxdWlyaW5nIGEgYGNvbmZpZ2Agb3B0aW9uXG4gICAgLy8gaXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggdGhlIGZvcm1lciBBUEkuXG5cbiAgICBjb25zdCBkb2N1bWVudHMgPSBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgcmV0dXJuIGRvY3VtZW50cy5pbmRleENoYWluKGZuYW1lKTtcbn1cblxuXG4vKipcbiAqIE1hbmlwdWxhdGUgdGhlIHJlbD0gYXR0cmlidXRlcyBvbiBhIGxpbmsgcmV0dXJuZWQgZnJvbSBNYWhhYmh1dGEuXG4gKlxuICogQHBhcmFtcyB7JGxpbmt9IFRoZSBsaW5rIHRvIG1hbmlwdWxhdGVcbiAqIEBwYXJhbXMge2F0dHJ9IFRoZSBhdHRyaWJ1dGUgbmFtZVxuICogQHBhcmFtcyB7ZG9hdHRyfSBCb29sZWFuIGZsYWcgd2hldGhlciB0byBzZXQgKHRydWUpIG9yIHJlbW92ZSAoZmFsc2UpIHRoZSBhdHRyaWJ1dGVcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW5rUmVsU2V0QXR0cigkbGluaywgYXR0ciwgZG9hdHRyKSB7XG4gICAgbGV0IGxpbmtyZWwgPSAkbGluay5hdHRyKCdyZWwnKTtcbiAgICBsZXQgcmVscyA9IGxpbmtyZWwgPyBsaW5rcmVsLnNwbGl0KCcgJykgOiBbXTtcbiAgICBsZXQgaGFzYXR0ciA9IHJlbHMuaW5kZXhPZihhdHRyKSA+PSAwO1xuICAgIGlmICghaGFzYXR0ciAmJiBkb2F0dHIpIHtcbiAgICAgICAgcmVscy51bnNoaWZ0KGF0dHIpO1xuICAgICAgICAkbGluay5hdHRyKCdyZWwnLCByZWxzLmpvaW4oJyAnKSk7XG4gICAgfSBlbHNlIGlmIChoYXNhdHRyICYmICFkb2F0dHIpIHtcbiAgICAgICAgcmVscy5zcGxpY2UocmVscy5pbmRleE9mKGF0dHIpKTtcbiAgICAgICAgJGxpbmsuYXR0cigncmVsJywgcmVscy5qb2luKCcgJykpO1xuICAgIH1cbn07XG5cbi8vLy8vLy8vLy8vLy8vLy8vIFJTUyBGZWVkIEdlbmVyYXRpb25cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUlNTKGNvbmZpZywgY29uZmlncnNzLCBmZWVkRGF0YSwgaXRlbXMsIHJlbmRlclRvKSB7XG5cbiAgICAvLyBTdXBwb3NlZGx5IGl0J3MgcmVxdWlyZWQgdG8gdXNlIGhhc093blByb3BlcnR5XG4gICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83MjgzNjAvaG93LWRvLWktY29ycmVjdGx5LWNsb25lLWEtamF2YXNjcmlwdC1vYmplY3QjNzI4Njk0XG4gICAgLy9cbiAgICAvLyBCdXQsIGluIG91ciBjYXNlIHRoYXQgcmVzdWx0ZWQgaW4gYW4gZW1wdHkgb2JqZWN0XG5cbiAgICAvLyBjb25zb2xlLmxvZygnY29uZmlncnNzICcrIHV0aWwuaW5zcGVjdChjb25maWdyc3MpKTtcblxuICAgIC8vIENvbnN0cnVjdCBpbml0aWFsIHJzcyBvYmplY3RcbiAgICB2YXIgcnNzID0ge307XG4gICAgZm9yIChsZXQga2V5IGluIGNvbmZpZ3Jzcy5yc3MpIHtcbiAgICAgICAgLy9pZiAoY29uZmlncnNzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHJzc1trZXldID0gY29uZmlncnNzLnJzc1trZXldO1xuICAgICAgICAvL31cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZygncnNzICcrIHV0aWwuaW5zcGVjdChyc3MpKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKCdmZWVkRGF0YSAnKyB1dGlsLmluc3BlY3QoZmVlZERhdGEpKTtcblxuICAgIC8vIFRoZW4gZmlsbCBpbiBmcm9tIGZlZWREYXRhXG4gICAgZm9yIChsZXQga2V5IGluIGZlZWREYXRhKSB7XG4gICAgICAgIC8vaWYgKGZlZWREYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHJzc1trZXldID0gZmVlZERhdGFba2V5XTtcbiAgICAgICAgLy99XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coJ2dlbmVyYXRlUlNTIHJzcyAnKyB1dGlsLmluc3BlY3QocnNzKSk7XG5cbiAgICB2YXIgcnNzZmVlZCA9IG5ldyBSU1MocnNzKTtcblxuICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkgeyByc3NmZWVkLml0ZW0oaXRlbSk7IH0pO1xuXG4gICAgdmFyIHhtbCA9IHJzc2ZlZWQueG1sKCk7XG4gICAgdmFyIHJlbmRlck91dCA9IHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIHJlbmRlclRvKTtcblxuICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyT3V0KSwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlck91dCwgeG1sLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG5cbn07XG5cbi8vIEZvciBvRW1iZWQsIENvbnNpZGVyIG1ha2luZyBhbiBleHRlcm5hbCBwbHVnaW5cbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL29lbWJlZC1hbGxcbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL2VtYmVkYWJsZVxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvbWVkaWEtcGFyc2VyXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9vZW1iZXR0ZXJcblxuXG4vKipcbiAqIFRoZSBBa2FzaGFSZW5kZXIgcHJvamVjdCBjb25maWd1cmF0aW9uIG9iamVjdC4gIFxuICogT25lIGluc3RhbnRpYXRlcyBhIENvbmZpZ3VyYXRpb24gb2JqZWN0LCB0aGVuIGZpbGxzIGl0XG4gKiB3aXRoIHNldHRpbmdzIGFuZCBwbHVnaW5zLlxuICogXG4gKiBAc2VlIG1vZHVsZTpDb25maWd1cmF0aW9uXG4gKi9cblxuLy8gY29uc3QgX2NvbmZpZ19wbHVnaW5EYXRhID0gU3ltYm9sKCdwbHVnaW5EYXRhJyk7XG4vLyBjb25zdCBfY29uZmlnX2Fzc2V0c0RpcnMgPSBTeW1ib2woJ2Fzc2V0c0RpcnMnKTtcbi8vIGNvbnN0IF9jb25maWdfZG9jdW1lbnREaXJzID0gU3ltYm9sKCdkb2N1bWVudERpcnMnKTtcbi8vIGNvbnN0IF9jb25maWdfbGF5b3V0RGlycyA9IFN5bWJvbCgnbGF5b3V0RGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19wYXJ0aWFsRGlycyA9IFN5bWJvbCgncGFydGlhbERpcnMnKTtcbi8vIGNvbnN0IF9jb25maWdfbWFoYWZ1bmNzID0gU3ltYm9sKCdtYWhhZnVuY3MnKTtcbi8vIGNvbnN0IF9jb25maWdfcmVuZGVyVG8gPSBTeW1ib2woJ3JlbmRlclRvJyk7XG4vLyBjb25zdCBfY29uZmlnX21ldGFkYXRhID0gU3ltYm9sKCdtZXRhZGF0YScpO1xuLy8gY29uc3QgX2NvbmZpZ19yb290X3VybCA9IFN5bWJvbCgncm9vdF91cmwnKTtcbi8vIGNvbnN0IF9jb25maWdfc2NyaXB0cyA9IFN5bWJvbCgnc2NyaXB0cycpO1xuLy8gY29uc3QgX2NvbmZpZ19wbHVnaW5zID0gU3ltYm9sKCdwbHVnaW5zJyk7XG4vLyBjb25zdCBfY29uZmlnX2NoZWVyaW8gPSBTeW1ib2woJ2NoZWVyaW8nKTtcbi8vIGNvbnN0IF9jb25maWdfY29uZmlnZGlyID0gU3ltYm9sKCdjb25maWdkaXInKTtcbi8vIGNvbnN0IF9jb25maWdfY2FjaGVkaXIgID0gU3ltYm9sKCdjYWNoZWRpcicpO1xuLy8gY29uc3QgX2NvbmZpZ19jb25jdXJyZW5jeSA9IFN5bWJvbCgnY29uY3VycmVuY3knKTtcbi8vIGNvbnN0IF9jb25maWdfcmVuZGVyZXJzID0gU3ltYm9sKCdyZW5kZXJlcnMnKTtcblxuLyoqXG4gKiBEYXRhIHR5cGUgZGVzY3JpYmluZyBpdGVtcyBpbiB0aGVcbiAqIGphdmFTY3JpcHRUb3AgYW5kIGphdmFTY3JpcHRCb3R0b20gYXJyYXlzLlxuICogVGhlIGZpZWxkcyBjb3JyZXNwb25kIHRvIHRoZSBhdHRyaWJ1dGVzXG4gKiBvZiB0aGUgPHNjcmlwdD4gdGFnIHdoaWNoIGNhbiBiZSB1c2VkXG4gKiBlaXRoZXIgaW4gdGhlIHRvcCBvciBib3R0b20gb2ZcbiAqIGFuIEhUTUwgZmlsZS5cbiAqL1xuZXhwb3J0IHR5cGUgamF2YVNjcmlwdEl0ZW0gPSB7XG4gICAgaHJlZj86IHN0cmluZyxcbiAgICBzY3JpcHQ/OiBzdHJpbmcsXG4gICAgbGFuZz86IHN0cmluZ1xufTtcblxuZXhwb3J0IHR5cGUgc3R5bGVzaGVldEl0ZW0gPSB7XG4gICAgaHJlZj86IHN0cmluZyxcbiAgICBtZWRpYT86IHN0cmluZ1xuXG59O1xuXG4vKipcbiAqIERlZmluZXMgdGhlIHN0cnVjdHVyZSBmb3IgZGlyZWN0b3J5XG4gKiBtb3VudCBzcGVjaWZpY2F0aW9uIGluIHRoZSBDb25maWd1cmF0aW9uLlxuICogXG4gKiBUaGUgc2ltcGxlICdzdHJpbmcnIGZvcm0gc2F5cyB0byBtb3VudFxuICogdGhlIG5hbWVkIGZzcGF0aCBvbiB0aGUgcm9vdCBvZiB0aGVcbiAqIHZpcnR1YWwgZmlsZXNwYWNlLlxuICogXG4gKiBUaGUgb2JqZWN0IGZvcm0gYWxsb3dzIHVzIHRvIG1vdW50XG4gKiBhbiBmc3BhdGggaW50byBhIGRpZmZlcmVudCBsb2NhdGlvblxuICogaW4gdGhlIHZpcnR1YWwgZmlsZXNwYWNlLCB0byBpZ25vcmVcbiAqIGZpbGVzIGJhc2VkIG9uIEdMT0IgcGF0dGVybnMsIGFuZCB0b1xuICogaW5jbHVkZSBtZXRhZGF0YSBmb3IgZXZlcnkgZmlsZSBpblxuICogYSBkaXJlY3RvcnkgdHJlZS5cbiAqIFxuICogSW4gdGhlIGZpbGUtY2FjaGUgbW9kdWxlLCB0aGlzIGlzXG4gKiBjb252ZXJ0ZWQgdG8gdGhlIGRpclRvV2F0Y2ggc3RydWN0dXJlXG4gKiB1c2VkIGJ5IFN0YWNrZWREaXJzLlxuICovXG5leHBvcnQgdHlwZSBkaXJUb01vdW50ID1cbiAgICBzdHJpbmdcbiAgICB8IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBmc3BhdGggdG8gbW91bnRcbiAgICAgICAgICovXG4gICAgICAgIHNyYzogc3RyaW5nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdmlydHVhbCBmaWxlc3BhY2VcbiAgICAgICAgICogbG9jYXRpb25cbiAgICAgICAgICovXG4gICAgICAgIGRlc3Q6IHN0cmluZyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQXJyYXkgb2YgR0xPQiBwYXR0ZXJuc1xuICAgICAgICAgKiBvZiBmaWxlcyB0byBpZ25vcmVcbiAgICAgICAgICovXG4gICAgICAgIGlnbm9yZT86IHN0cmluZ1tdLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbiBvYmplY3QgY29udGFpbmluZ1xuICAgICAgICAgKiBtZXRhZGF0YSB0aGF0J3MgdG9cbiAgICAgICAgICogYXBwbHkgdG8gZXZlcnkgZmlsZVxuICAgICAgICAgKi9cbiAgICAgICAgYmFzZU1ldGFkYXRhPzogYW55XG4gICAgfTtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9mIGFuIEFrYXNoYVJlbmRlciBwcm9qZWN0LCBpbmNsdWRpbmcgdGhlIGlucHV0IGRpcmVjdG9yaWVzLFxuICogb3V0cHV0IGRpcmVjdG9yeSwgcGx1Z2lucywgYW5kIHZhcmlvdXMgc2V0dGluZ3MuXG4gKlxuICogVVNBR0U6XG4gKlxuICogY29uc3QgYWthc2hhID0gcmVxdWlyZSgnYWthc2hhcmVuZGVyJyk7XG4gKiBjb25zdCBjb25maWcgPSBuZXcgYWthc2hhLkNvbmZpZ3VyYXRpb24oKTtcbiAqL1xuZXhwb3J0IGNsYXNzIENvbmZpZ3VyYXRpb24ge1xuICAgICNyZW5kZXJlcnM6IFJlbmRlcmVycy5Db25maWd1cmF0aW9uO1xuICAgICNjb25maWdkaXI6IHN0cmluZztcbiAgICAjY2FjaGVkaXI6IHN0cmluZztcbiAgICAjYXNzZXRzRGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjbGF5b3V0RGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjZG9jdW1lbnREaXJzPzogZGlyVG9Nb3VudFtdO1xuICAgICNwYXJ0aWFsRGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjbWFoYWZ1bmNzO1xuICAgICNjaGVlcmlvPzogY2hlZXJpby5DaGVlcmlvT3B0aW9ucztcbiAgICAjcmVuZGVyVG86IHN0cmluZztcbiAgICAjc2NyaXB0cz86IHtcbiAgICAgICAgc3R5bGVzaGVldHM/OiBzdHlsZXNoZWV0SXRlbVtdLFxuICAgICAgICBqYXZhU2NyaXB0VG9wPzogamF2YVNjcmlwdEl0ZW1bXSxcbiAgICAgICAgamF2YVNjcmlwdEJvdHRvbT86IGphdmFTY3JpcHRJdGVtW11cbiAgICB9O1xuICAgICNjb25jdXJyZW5jeTogbnVtYmVyO1xuICAgICNtZXRhZGF0YTogYW55O1xuICAgICNyb290X3VybDogc3RyaW5nO1xuICAgICNwbHVnaW5zO1xuICAgICNwbHVnaW5EYXRhO1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZXBhdGgpIHtcblxuICAgICAgICAvLyB0aGlzW19jb25maWdfcmVuZGVyZXJzXSA9IFtdO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMgPSBuZXcgUmVuZGVyZXJzLkNvbmZpZ3VyYXRpb24oe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuI21haGFmdW5jcyA9IFtdO1xuICAgICAgICB0aGlzLiNzY3JpcHRzID0ge1xuICAgICAgICAgICAgc3R5bGVzaGVldHM6IFtdLFxuICAgICAgICAgICAgamF2YVNjcmlwdFRvcDogW10sXG4gICAgICAgICAgICBqYXZhU2NyaXB0Qm90dG9tOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuI2NvbmN1cnJlbmN5ID0gMztcblxuICAgICAgICB0aGlzLiNkb2N1bWVudERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jbGF5b3V0RGlycyA9IFtdO1xuICAgICAgICB0aGlzLiNwYXJ0aWFsRGlycyA9IFtdO1xuICAgICAgICB0aGlzLiNhc3NldHNEaXJzID0gW107XG5cbiAgICAgICAgdGhpcy4jbWFoYWZ1bmNzID0gW107XG5cbiAgICAgICAgdGhpcy4jcmVuZGVyVG8gPSAnb3V0JztcblxuICAgICAgICB0aGlzLiNtZXRhZGF0YSA9IHt9IGFzIGFueTtcblxuICAgICAgICB0aGlzLiNwbHVnaW5zID0gW107XG4gICAgICAgIHRoaXMuI3BsdWdpbkRhdGEgPSBbXTtcblxuICAgICAgICAvKlxuICAgICAgICAgKiBJcyB0aGlzIHRoZSBiZXN0IHBsYWNlIGZvciB0aGlzPyAgSXQgaXMgbmVjZXNzYXJ5IHRvXG4gICAgICAgICAqIGNhbGwgdGhpcyBmdW5jdGlvbiBzb21ld2hlcmUuICBUaGUgbmF0dXJlIG9mIHRoaXMgZnVuY3Rpb25cbiAgICAgICAgICogaXMgdGhhdCBpdCBjYW4gYmUgY2FsbGVkIG11bHRpcGxlIHRpbWVzIHdpdGggbm8gaW1wYWN0LiAgXG4gICAgICAgICAqIEJ5IGJlaW5nIGxvY2F0ZWQgaGVyZSwgaXQgd2lsbCBhbHdheXMgYmUgY2FsbGVkIGJ5IHRoZVxuICAgICAgICAgKiB0aW1lIGFueSBDb25maWd1cmF0aW9uIGlzIGdlbmVyYXRlZC5cbiAgICAgICAgICovXG4gICAgICAgIC8vIFRoaXMgaXMgZXhlY3V0ZWQgaW4gQGFrYXNoYWNtcy9yZW5kZXJlcnNcbiAgICAgICAgLy8gdGhpc1tfY29uZmlnX3JlbmRlcmVyc10ucmVnaXN0ZXJCdWlsdEluUmVuZGVyZXJzKCk7XG5cbiAgICAgICAgLy8gUHJvdmlkZSBhIG1lY2hhbmlzbSB0byBlYXNpbHkgc3BlY2lmeSBjb25maWdEaXJcbiAgICAgICAgLy8gVGhlIHBhdGggaW4gY29uZmlnRGlyIG11c3QgYmUgdGhlIHBhdGggb2YgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZS5cbiAgICAgICAgLy8gVGhlcmUgZG9lc24ndCBhcHBlYXIgdG8gYmUgYSB3YXkgdG8gZGV0ZXJtaW5lIHRoYXQgZnJvbSBoZXJlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBGb3IgZXhhbXBsZSBtb2R1bGUucGFyZW50LmZpbGVuYW1lIGluIHRoaXMgY2FzZSBwb2ludHNcbiAgICAgICAgLy8gdG8gYWthc2hhcmVuZGVyL2luZGV4LmpzIGJlY2F1c2UgdGhhdCdzIHRoZSBtb2R1bGUgd2hpY2hcbiAgICAgICAgLy8gbG9hZGVkIHRoaXMgbW9kdWxlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBPbmUgY291bGQgaW1hZ2luZSBhIGRpZmZlcmVudCBpbml0aWFsaXphdGlvbiBwYXR0ZXJuLiAgSW5zdGVhZFxuICAgICAgICAvLyBvZiBha2FzaGFyZW5kZXIgcmVxdWlyaW5nIENvbmZpZ3VyYXRpb24uanMsIHRoYXQgZmlsZSBjb3VsZCBiZVxuICAgICAgICAvLyByZXF1aXJlZCBieSB0aGUgY29uZmlndXJhdGlvbiBmaWxlLiAgSW4gc3VjaCBhIGNhc2VcbiAgICAgICAgLy8gbW9kdWxlLnBhcmVudC5maWxlbmFtZSBXT1VMRCBpbmRpY2F0ZSB0aGUgZmlsZW5hbWUgZm9yIHRoZVxuICAgICAgICAvLyBjb25maWd1cmF0aW9uIGZpbGUsIGFuZCB3b3VsZCBiZSBhIHNvdXJjZSBvZiBzZXR0aW5nXG4gICAgICAgIC8vIHRoZSBjb25maWdEaXIgdmFsdWUuXG4gICAgICAgIGlmICh0eXBlb2YgbW9kdWxlcGF0aCAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlcGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5jb25maWdEaXIgPSBwYXRoLmRpcm5hbWUobW9kdWxlcGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWZXJ5IGNhcmVmdWxseSBhZGQgdGhlIDxwYXJ0aWFsPiBzdXBwb3J0IGZyb20gTWFoYWJodXRhIGFzIHRoZVxuICAgICAgICAvLyB2ZXJ5IGZpcnN0IHRoaW5nIHNvIHRoYXQgaXQgZXhlY3V0ZXMgYmVmb3JlIGFueXRoaW5nIGVsc2UuXG4gICAgICAgIGxldCBjb25maWcgPSB0aGlzO1xuICAgICAgICB0aGlzLmFkZE1haGFiaHV0YShtYWhhUGFydGlhbC5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgICAgICByZW5kZXJQYXJ0aWFsOiBmdW5jdGlvbihmbmFtZSwgbWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgZGVmYXVsdCBjb25maWd1cmF0aW9uIHZhbHVlcyBmb3IgYW55dGhpbmcgd2hpY2ggaGFzIG5vdFxuICAgICAqIGFscmVhZHkgYmVlbiBjb25maWd1cmVkLiAgU29tZSBidWlsdC1pbiBkZWZhdWx0cyBoYXZlIGJlZW4gZGVjaWRlZFxuICAgICAqIGFoZWFkIG9mIHRpbWUuICBGb3IgZWFjaCBjb25maWd1cmF0aW9uIHNldHRpbmcsIGlmIG5vdGhpbmcgaGFzIGJlZW5cbiAgICAgKiBkZWNsYXJlZCwgdGhlbiB0aGUgZGVmYXVsdCBpcyBzdWJzdGl0dXRlZC5cbiAgICAgKlxuICAgICAqIEl0IGlzIGV4cGVjdGVkIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgbGFzdCBpbiB0aGUgY29uZmlnIGZpbGUuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGluc3RhbGxzIHRoZSBgYnVpbHQtaW5gIHBsdWdpbi4gIEl0IG5lZWRzIHRvIGJlIGxhc3Qgb25cbiAgICAgKiB0aGUgcGx1Z2luIGNoYWluIHNvIHRoYXQgaXRzIHN0eWxlc2hlZXRzIGFuZCBwYXJ0aWFscyBhbmQgd2hhdG5vdFxuICAgICAqIGNhbiBiZSBvdmVycmlkZGVuIGJ5IG90aGVyIHBsdWdpbnMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBwcmVwYXJlKCkge1xuXG4gICAgICAgIGNvbnN0IENPTkZJRyA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgY29uZmlnRGlyUGF0aCA9IGZ1bmN0aW9uKGRpcm5tKSB7XG4gICAgICAgICAgICBsZXQgY29uZmlnUGF0aCA9IGRpcm5tO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBDT05GSUcuY29uZmlnRGlyICE9PSAndW5kZWZpbmVkJyAmJiBDT05GSUcuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb25maWdQYXRoID0gcGF0aC5qb2luKENPTkZJRy5jb25maWdEaXIsIGRpcm5tKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb25maWdQYXRoO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHN0YXQ7XG5cbiAgICAgICAgY29uc3QgY2FjaGVEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2NhY2hlJyk7XG4gICAgICAgIGlmICghdGhpcy4jY2FjaGVkaXIpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGNhY2hlRGlyc1BhdGgpXG4gICAgICAgICAgICAgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhjYWNoZURpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FjaGVEaXIgPSAnY2FjaGUnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidjYWNoZScgaXMgbm90IGEgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKGNhY2hlRGlyc1BhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FjaGVEaXIgPSAnY2FjaGUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI2NhY2hlZGlyICYmICFmcy5leGlzdHNTeW5jKHRoaXMuI2NhY2hlZGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHRoaXMuI2NhY2hlZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFzc2V0c0RpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnYXNzZXRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jYXNzZXRzRGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoYXNzZXRzRGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoYXNzZXRzRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRBc3NldHNEaXIoJ2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxheW91dHNEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2xheW91dHMnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNsYXlvdXREaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhsYXlvdXRzRGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMobGF5b3V0c0RpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0c0RpcignbGF5b3V0cycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcnRpYWxEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ3BhcnRpYWxzJyk7XG4gICAgICAgIGlmICghbWFoYVBhcnRpYWwuY29uZmlndXJhdGlvbi5wYXJ0aWFsRGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocGFydGlhbERpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKHBhcnRpYWxEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZFBhcnRpYWxzRGlyKCdwYXJ0aWFscycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50RGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdkb2N1bWVudHMnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNkb2N1bWVudERpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGRvY3VtZW50RGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoZG9jdW1lbnREaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZERvY3VtZW50c0RpcignZG9jdW1lbnRzJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ2RvY3VtZW50cycgaXMgbm90IGEgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gJ2RvY3VtZW50RGlycycgc2V0dGluZywgYW5kIG5vICdkb2N1bWVudHMnIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlbmRlclRvUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ291dCcpO1xuICAgICAgICBpZiAoIXRoaXMuI3JlbmRlclRvKSAge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocmVuZGVyVG9QYXRoKVxuICAgICAgICAgICAgICYmIChzdGF0ID0gZnMuc3RhdFN5bmMocmVuZGVyVG9QYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UmVuZGVyRGVzdGluYXRpb24oJ291dCcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidvdXQnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhyZW5kZXJUb1BhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0UmVuZGVyRGVzdGluYXRpb24oJ291dCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI3JlbmRlclRvICYmICFmcy5leGlzdHNTeW5jKHRoaXMuI3JlbmRlclRvKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHRoaXMuI3JlbmRlclRvLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBha2FzaGFjbXMtYnVpbHRpbiBwbHVnaW4gbmVlZHMgdG8gYmUgbGFzdCBvbiB0aGUgY2hhaW4gc28gdGhhdFxuICAgICAgICAvLyBpdHMgcGFydGlhbHMgZXRjIGNhbiBiZSBlYXNpbHkgb3ZlcnJpZGRlbi4gIFRoaXMgaXMgdGhlIG1vc3QgY29udmVuaWVudFxuICAgICAgICAvLyBwbGFjZSB0byBkZWNsYXJlIHRoYXQgcGx1Z2luLlxuICAgICAgICAvL1xuXG4gICAgICAgIC8vIE5vcm1hbGx5IHdlJ2QgZG8gcmVxdWlyZSgnLi9idWlsdC1pbi5qcycpLlxuICAgICAgICAvLyBCdXQsIGluIHRoaXMgY29udGV4dCB0aGF0IGRvZXNuJ3Qgd29yay5cbiAgICAgICAgLy8gV2hhdCB3ZSBkaWQgaXMgdG8gaW1wb3J0IHRoZVxuICAgICAgICAvLyBCdWlsdEluUGx1Z2luIGNsYXNzIGVhcmxpZXIgc28gdGhhdFxuICAgICAgICAvLyBpdCBjYW4gYmUgdXNlZCBoZXJlLlxuICAgICAgICB0aGlzLnVzZShCdWlsdEluUGx1Z2luLCB7XG4gICAgICAgICAgICAvLyBidWlsdC1pbiBvcHRpb25zIGlmIGFueVxuICAgICAgICAgICAgLy8gRG8gbm90IG5lZWQgdGhpcyBoZXJlIGFueSBsb25nZXIgYmVjYXVzZSBpdCBpcyBoYW5kbGVkXG4gICAgICAgICAgICAvLyBpbiB0aGUgY29uc3RydWN0b3IuXG4gICAgICAgICAgICAvLyBTZXQgdXAgdGhlIE1haGFiaHV0YSBwYXJ0aWFsIHRhZyBzbyBpdCByZW5kZXJzIHRocm91Z2ggQWthc2hhUmVuZGVyXG4gICAgICAgICAgICAvLyByZW5kZXJQYXJ0aWFsOiBmdW5jdGlvbihmbmFtZSwgbWV0YWRhdGEpIHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gcmVuZGVyLnBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWNvcmQgdGhlIGNvbmZpZ3VyYXRpb24gZGlyZWN0b3J5IHNvIHRoYXQgd2UgY2FuIGNvcnJlY3RseSBpbnRlcnBvbGF0ZVxuICAgICAqIHRoZSBwYXRobmFtZXMgd2UncmUgcHJvdmlkZWQuXG4gICAgICovXG4gICAgc2V0IGNvbmZpZ0RpcihjZmdkaXI6IHN0cmluZykgeyB0aGlzLiNjb25maWdkaXIgPSBjZmdkaXI7IH1cbiAgICBnZXQgY29uZmlnRGlyKCkgeyByZXR1cm4gdGhpcy4jY29uZmlnZGlyOyB9XG5cbiAgICBzZXQgY2FjaGVEaXIoZGlybm06IHN0cmluZykgeyB0aGlzLiNjYWNoZWRpciA9IGRpcm5tOyB9XG4gICAgZ2V0IGNhY2hlRGlyKCkgeyByZXR1cm4gdGhpcy4jY2FjaGVkaXI7IH1cblxuICAgIC8vIHNldCBha2FzaGEoX2FrYXNoYSkgIHsgdGhpc1tfY29uZmlnX2FrYXNoYV0gPSBfYWthc2hhOyB9XG4gICAgZ2V0IGFrYXNoYSgpIHsgcmV0dXJuIG1vZHVsZV9leHBvcnRzOyB9XG5cbiAgICBhc3luYyBkb2N1bWVudHNDYWNoZSgpIHsgcmV0dXJuIGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTsgfVxuICAgIGFzeW5jIGFzc2V0c0NhY2hlKCkgICAgeyByZXR1cm4gZmlsZWNhY2hlLmFzc2V0c0NhY2hlOyB9XG4gICAgYXN5bmMgbGF5b3V0c0NhY2hlKCkgICB7IHJldHVybiBmaWxlY2FjaGUubGF5b3V0c0NhY2hlOyB9XG4gICAgYXN5bmMgcGFydGlhbHNDYWNoZSgpICB7IHJldHVybiBmaWxlY2FjaGUucGFydGlhbHNDYWNoZTsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBkb2N1bWVudERpcnMgY29uZmlndXJhdGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqL1xuICAgIGFkZERvY3VtZW50c0RpcihkaXI6IGRpclRvTW91bnQpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRpciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXIuc3JjID0gcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKTtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZERvY3VtZW50c0RpciAtIGRpcmVjdG9yeSB0byBtb3VudCBvZiB3cm9uZyB0eXBlICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jZG9jdW1lbnREaXJzLnB1c2goZGlyTW91bnQpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgYWRkRG9jdW1lbnRzRGlyICR7dXRpbC5pbnNwZWN0KGRpcil9ID09PiAke3V0aWwuaW5zcGVjdCh0aGlzW19jb25maWdfZG9jdW1lbnREaXJzXSl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBkb2N1bWVudERpcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiNkb2N1bWVudERpcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9vayB1cCB0aGUgZG9jdW1lbnQgZGlyZWN0b3J5IGluZm9ybWF0aW9uIGZvciBhIGdpdmVuIGRvY3VtZW50IGRpcmVjdG9yeS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlybmFtZSBUaGUgZG9jdW1lbnQgZGlyZWN0b3J5IHRvIHNlYXJjaCBmb3JcbiAgICAgKi9cbiAgICBkb2N1bWVudERpckluZm8oZGlybmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGZvciAodmFyIGRvY0RpciBvZiB0aGlzLmRvY3VtZW50RGlycykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkb2NEaXIgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY0Rpci5zcmMgPT09IGRpcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvY0RpcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY0RpciA9PT0gZGlybmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkb2NEaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIGxheW91dERpcnMgY29uZmlndXJ0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlXG4gICAgICovXG4gICAgYWRkTGF5b3V0c0RpcihkaXI6IGRpclRvTW91bnQpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRpciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXIuc3JjID0gcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKTtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZExheW91dHNEaXIgLSBkaXJlY3RvcnkgdG8gbW91bnQgb2Ygd3JvbmcgdHlwZSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2xheW91dERpcnMucHVzaChkaXJNb3VudCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBhZGRMYXlvdXRzRGlyICR7dXRpbC5pbnNwZWN0KGRpcil9ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX0gbGF5b3V0RGlycyAke3V0aWwuaW5zcGVjdCh0aGlzLiNsYXlvdXREaXJzKX0gUmVuZGVyZXJzIGxheW91dERpcnMgJHt1dGlsLmluc3BlY3QodGhpcy4jcmVuZGVyZXJzLmxheW91dERpcnMpfWApO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMuYWRkTGF5b3V0RGlyKGRpck1vdW50LnNyYyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBhZGRMYXlvdXRzRGlyICR7dXRpbC5pbnNwZWN0KGRpcil9IGxheW91dERpcnMgJHt1dGlsLmluc3BlY3QodGhpcy4jbGF5b3V0RGlycyl9IFJlbmRlcmVycyBsYXlvdXREaXJzICR7dXRpbC5pbnNwZWN0KHRoaXMuI3JlbmRlcmVycy5sYXlvdXREaXJzKX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGxheW91dERpcnMoKSB7IHJldHVybiB0aGlzLiNsYXlvdXREaXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIHBhcnRpYWxEaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZFBhcnRpYWxzRGlyKGRpcjogZGlyVG9Nb3VudCkge1xuICAgICAgICAvLyBJZiB3ZSBoYXZlIGEgY29uZmlnRGlyLCBhbmQgaXQncyBhIHJlbGF0aXZlIGRpcmVjdG9yeSwgbWFrZSBpdFxuICAgICAgICAvLyByZWxhdGl2ZSB0byB0aGUgY29uZmlnRGlyXG4gICAgICAgIGxldCBkaXJNb3VudDogZGlyVG9Nb3VudDtcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZGlyID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpci5zcmMgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpO1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkUGFydGlhbHNEaXIgLSBkaXJlY3RvcnkgdG8gbW91bnQgb2Ygd3JvbmcgdHlwZSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGRQYXJ0aWFsc0RpciBgLCBkaXIpO1xuICAgICAgICB0aGlzLiNwYXJ0aWFsRGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLmFkZFBhcnRpYWxEaXIoZGlyTW91bnQuc3JjKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHBhcnRpYWxzRGlycygpIHsgcmV0dXJuIHRoaXMuI3BhcnRpYWxEaXJzOyB9XG4gICAgXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBhc3NldERpcnMgY29uZmlndXJ0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkQXNzZXRzRGlyKGRpcjogZGlyVG9Nb3VudCkge1xuICAgICAgICAvLyBJZiB3ZSBoYXZlIGEgY29uZmlnRGlyLCBhbmQgaXQncyBhIHJlbGF0aXZlIGRpcmVjdG9yeSwgbWFrZSBpdFxuICAgICAgICAvLyByZWxhdGl2ZSB0byB0aGUgY29uZmlnRGlyXG4gICAgICAgIGxldCBkaXJNb3VudDogZGlyVG9Nb3VudDtcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZGlyID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpci5zcmMgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpO1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkQXNzZXRzRGlyIC0gZGlyZWN0b3J5IHRvIG1vdW50IG9mIHdyb25nIHR5cGUgJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNhc3NldHNEaXJzLnB1c2goZGlyTW91bnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgYXNzZXREaXJzKCkgeyByZXR1cm4gdGhpcy4jYXNzZXRzRGlyczsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGFuIGFycmF5IG9mIE1haGFiaHV0YSBmdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBtYWhhZnVuY3NcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRNYWhhYmh1dGEobWFoYWZ1bmNzOiBtYWhhYmh1dGEuTWFoYWZ1bmNBcnJheSB8IG1haGFiaHV0YS5NYWhhZnVuY1R5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtYWhhZnVuY3MgPT09ICd1bmRlZmluZWQnIHx8ICFtYWhhZnVuY3MpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5kZWZpbmVkIG1haGFmdW5jcyBpbiAke3RoaXMuY29uZmlnRGlyfWApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuI21haGFmdW5jcy5wdXNoKG1haGFmdW5jcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBtYWhhZnVuY3MoKSB7IHJldHVybiB0aGlzLiNtYWhhZnVuY3M7IH1cblxuICAgIC8qKlxuICAgICAqIERlZmluZSB0aGUgZGlyZWN0b3J5IGludG8gd2hpY2ggdGhlIHByb2plY3QgaXMgcmVuZGVyZWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgc2V0UmVuZGVyRGVzdGluYXRpb24oZGlyOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBpZiAodGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyKSkge1xuICAgICAgICAgICAgICAgIGRpciA9IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNyZW5kZXJUbyA9IGRpcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIEZldGNoIHRoZSBkZWNsYXJlZCBkZXN0aW5hdGlvbiBmb3IgcmVuZGVyaW5nIHRoZSBwcm9qZWN0LiAqL1xuICAgIGdldCByZW5kZXJEZXN0aW5hdGlvbigpIHsgcmV0dXJuIHRoaXMuI3JlbmRlclRvOyB9XG4gICAgZ2V0IHJlbmRlclRvKCkgeyByZXR1cm4gdGhpcy4jcmVuZGVyVG87IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHZhbHVlIHRvIHRoZSBwcm9qZWN0IG1ldGFkYXRhLiAgVGhlIG1ldGFkYXRhIGlzIGNvbWJpbmVkIHdpdGhcbiAgICAgKiB0aGUgZG9jdW1lbnQgbWV0YWRhdGEgYW5kIHVzZWQgZHVyaW5nIHJlbmRlcmluZy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5kZXggVGhlIGtleSB0byBzdG9yZSB0aGUgdmFsdWUuXG4gICAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBzdG9yZSBpbiB0aGUgbWV0YWRhdGEuXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkTWV0YWRhdGEoaW5kZXg6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgICAgICB2YXIgbWQgPSB0aGlzLiNtZXRhZGF0YTtcbiAgICAgICAgbWRbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBtZXRhZGF0YSgpIHsgcmV0dXJuIHRoaXMuI21ldGFkYXRhOyB9XG5cbiAgICAvKipcbiAgICAqIERvY3VtZW50IHRoZSBVUkwgZm9yIGEgd2Vic2l0ZSBwcm9qZWN0LlxuICAgICogQHBhcmFtIHtzdHJpbmd9IHJvb3RfdXJsXG4gICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAqL1xuICAgIHJvb3RVUkwocm9vdF91cmw6IHN0cmluZykge1xuICAgICAgICB0aGlzLiNyb290X3VybCA9IHJvb3RfdXJsO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcm9vdF91cmwoKSB7IHJldHVybiB0aGlzLiNyb290X3VybDsgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IGhvdyBtYW55IGRvY3VtZW50cyB0byByZW5kZXIgY29uY3VycmVudGx5LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb25jdXJyZW5jeVxuICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgc2V0Q29uY3VycmVuY3koY29uY3VycmVuY3k6IG51bWJlcikge1xuICAgICAgICB0aGlzLiNjb25jdXJyZW5jeSA9IGNvbmN1cnJlbmN5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgY29uY3VycmVuY3koKSB7IHJldHVybiB0aGlzLiNjb25jdXJyZW5jeTsgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBKYXZhU2NyaXB0IHRvIGFkZCB3aXRoaW4gdGhlIGhlYWQgdGFnIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRIZWFkZXJKYXZhU2NyaXB0KHNjcmlwdDogamF2YVNjcmlwdEl0ZW0pIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5qYXZhU2NyaXB0VG9wLnB1c2goc2NyaXB0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHNjcmlwdHMoKSB7IHJldHVybiB0aGlzLiNzY3JpcHRzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsYXJlIEphdmFTY3JpcHQgdG8gYWRkIGF0IHRoZSBib3R0b20gb2YgcmVuZGVyZWQgcGFnZXMuXG4gICAgICogQHBhcmFtIHNjcmlwdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEZvb3RlckphdmFTY3JpcHQoc2NyaXB0OiBqYXZhU2NyaXB0SXRlbSkge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLmphdmFTY3JpcHRCb3R0b20ucHVzaChzY3JpcHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsYXJlIGEgQ1NTIFN0eWxlc2hlZXQgdG8gYWRkIHdpdGhpbiB0aGUgaGVhZCB0YWcgb2YgcmVuZGVyZWQgcGFnZXMuXG4gICAgICogQHBhcmFtIHNjcmlwdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZFN0eWxlc2hlZXQoY3NzOiBzdHlsZXNoZWV0SXRlbSkge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLnN0eWxlc2hlZXRzLnB1c2goY3NzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0TWFoYWJodXRhQ29uZmlnKGNoZWVyaW8/OiBjaGVlcmlvLkNoZWVyaW9PcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NoZWVyaW8gPSBjaGVlcmlvO1xuXG4gICAgICAgIC8vIEZvciBjaGVlcmlvIDEuMC4wLXJjLjEwIHdlIG5lZWQgdG8gdXNlIHRoaXMgc2V0dGluZy5cbiAgICAgICAgLy8gSWYgdGhlIGNvbmZpZ3VyYXRpb24gaGFzIHNldCB0aGlzLCB3ZSBtdXN0IG5vdFxuICAgICAgICAvLyBvdmVycmlkZSB0aGVpciBzZXR0aW5nLiAgQnV0LCBnZW5lcmFsbHksIGZvciBjb3JyZWN0XG4gICAgICAgIC8vIG9wZXJhdGlvbiBhbmQgaGFuZGxpbmcgb2YgTWFoYWJodXRhIHRhZ3MsIHdlIG5lZWRcbiAgICAgICAgLy8gdGhpcyBzZXR0aW5nIHRvIGJlIDxjb2RlPnRydWU8L2NvZGU+XG4gICAgICAgIGlmICghKCdfdXNlSHRtbFBhcnNlcjInIGluIHRoaXMuI2NoZWVyaW8pKSB7XG4gICAgICAgICAgICAodGhpcy4jY2hlZXJpbyBhcyBhbnkpLl91c2VIdG1sUGFyc2VyMiA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzW19jb25maWdfY2hlZXJpb10pO1xuICAgIH1cblxuICAgIGdldCBtYWhhYmh1dGFDb25maWcoKSB7IHJldHVybiB0aGlzLiNjaGVlcmlvOyB9XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IHRoZSBjb250ZW50cyBvZiBhbGwgZGlyZWN0b3JpZXMgaW4gYXNzZXREaXJzIHRvIHRoZSByZW5kZXIgZGVzdGluYXRpb24uXG4gICAgICovXG4gICAgYXN5bmMgY29weUFzc2V0cygpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2NvcHlBc3NldHMgU1RBUlQnKTtcblxuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBjb25zdCBhc3NldHMgPSBmaWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIC8vIEZldGNoIHRoZSBsaXN0IG9mIGFsbCBhc3NldHMgZmlsZXNcbiAgICAgICAgY29uc3QgcGF0aHMgPSBhd2FpdCBhc3NldHMucGF0aHMoKTtcblxuICAgICAgICAvLyBUaGUgd29yayB0YXNrIGlzIHRvIGNvcHkgZWFjaCBmaWxlXG4gICAgICAgIGNvbnN0IHF1ZXVlID0gZmFzdHEucHJvbWlzZShhc3luYyBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzICR7Y29uZmlnLnJlbmRlclRvfSAke2l0ZW0ucmVuZGVyUGF0aH1gKTtcbiAgICAgICAgICAgICAgICBsZXQgZGVzdEZOID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJUbywgaXRlbS5yZW5kZXJQYXRoKTtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKGRlc3RGTiksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIC8vIENvcHkgZnJvbSB0aGUgYWJzb2x1dGUgcGF0aG5hbWUsIHRvIHRoZSBjb21wdXRlZCBcbiAgICAgICAgICAgICAgICAvLyBsb2NhdGlvbiB3aXRoaW4gdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeVxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzICR7aXRlbS5mc3BhdGh9ID09PiAke2Rlc3RGTn1gKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AuY3AoaXRlbS5mc3BhdGgsIGRlc3RGTiwge1xuICAgICAgICAgICAgICAgICAgICBmb3JjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY29weUFzc2V0cyBGQUlMIHRvIGNvcHkgJHtpdGVtLmZzcGF0aH0gJHtpdGVtLnZwYXRofSAke2l0ZW0ucmVuZGVyUGF0aH0gJHtjb25maWcucmVuZGVyVG99IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwKTtcblxuICAgICAgICAvLyBQdXNoIHRoZSBsaXN0IG9mIGFzc2V0IGZpbGVzIGludG8gdGhlIHF1ZXVlXG4gICAgICAgIC8vIEJlY2F1c2UgcXVldWUucHVzaCByZXR1cm5zIFByb21pc2UncyB3ZSBlbmQgdXAgd2l0aFxuICAgICAgICAvLyBhbiBhcnJheSBvZiBQcm9taXNlIG9iamVjdHNcbiAgICAgICAgY29uc3Qgd2FpdEZvciA9IFtdO1xuICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBwYXRocykge1xuICAgICAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGlzIHdhaXRzIGZvciBhbGwgUHJvbWlzZSdzIHRvIGZpbmlzaFxuICAgICAgICAvLyBCdXQgaWYgdGhlcmUgd2VyZSBubyBQcm9taXNlJ3MsIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICBpZiAod2FpdEZvci5sZW5ndGggPiAwKSBhd2FpdCBQcm9taXNlLmFsbCh3YWl0Rm9yKTtcbiAgICAgICAgLy8gVGhlcmUgYXJlIG5vIHJlc3VsdHMgaW4gdGhpcyBjYXNlIHRvIGNhcmUgYWJvdXRcbiAgICAgICAgLy8gY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICAvLyBmb3IgKGxldCByZXN1bHQgb2Ygd2FpdEZvcikge1xuICAgICAgICAvLyAgICByZXN1bHRzLnB1c2goYXdhaXQgcmVzdWx0KTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGwgdGhlIGJlZm9yZVNpdGVSZW5kZXJlZCBmdW5jdGlvbiBvZiBhbnkgcGx1Z2luIHdoaWNoIGhhcyB0aGF0IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4uYmVmb3JlU2l0ZVJlbmRlcmVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBiZWZvcmVTaXRlUmVuZGVyZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uYmVmb3JlU2l0ZVJlbmRlcmVkKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsIHRoZSBvblNpdGVSZW5kZXJlZCBmdW5jdGlvbiBvZiBhbnkgcGx1Z2luIHdoaWNoIGhhcyB0aGF0IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGhvb2tTaXRlUmVuZGVyZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdob29rU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25TaXRlUmVuZGVyZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uU2l0ZVJlbmRlcmVkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uU2l0ZVJlbmRlcmVkKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZUFkZGVkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhvb2tGaWxlQWRkZWQgJHtjb2xsZWN0aW9ufSAke3ZwaW5mby52cGF0aH1gKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVBZGRlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25GaWxlQWRkZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlQWRkZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVDaGFuZ2VkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVDaGFuZ2VkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvbkZpbGVDaGFuZ2VkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUNoYW5nZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVVbmxpbmtlZChjb2xsZWN0aW9uOiBzdHJpbmcsIHZwaW5mbzogVlBhdGhEYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlVW5saW5rZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uRmlsZVVubGlua2VkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZVVubGlua2VkKGNvbmZpZywgY29sbGVjdGlvbiwgdnBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQ2FjaGVTZXR1cChjb2xsZWN0aW9ubm06IHN0cmluZywgY29sbGVjdGlvbikge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUNhY2hlU2V0dXAgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUNhY2hlU2V0dXAoY29uZmlnLCBjb2xsZWN0aW9ubm0sIGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va1BsdWdpbkNhY2hlU2V0dXAoKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25QbHVnaW5DYWNoZVNldHVwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vblBsdWdpbkNhY2hlU2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHVzZSAtIGdvIHRocm91Z2ggcGx1Z2lucyBhcnJheSwgYWRkaW5nIGVhY2ggdG8gdGhlIHBsdWdpbnMgYXJyYXkgaW5cbiAgICAgKiB0aGUgY29uZmlnIGZpbGUsIHRoZW4gY2FsbGluZyB0aGUgY29uZmlnIGZ1bmN0aW9uIG9mIGVhY2ggcGx1Z2luLlxuICAgICAqIEBwYXJhbSBQbHVnaW5PYmogVGhlIHBsdWdpbiBuYW1lIG9yIG9iamVjdCB0byBhZGRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICB1c2UoUGx1Z2luT2JqLCBvcHRpb25zKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29uZmlndXJhdGlvbiAjMSB1c2UgUGx1Z2luT2JqIFwiKyB0eXBlb2YgUGx1Z2luT2JqICtcIiBcIisgdXRpbC5pbnNwZWN0KFBsdWdpbk9iaikpO1xuICAgICAgICBpZiAodHlwZW9mIFBsdWdpbk9iaiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgZ29pbmcgdG8gZmFpbCBiZWNhdXNlXG4gICAgICAgICAgICAvLyByZXF1aXJlIGRvZXNuJ3Qgd29yayBpbiB0aGlzIGNvbnRleHRcbiAgICAgICAgICAgIC8vIEZ1cnRoZXIsIHRoaXMgY29udGV4dCBkb2VzIG5vdFxuICAgICAgICAgICAgLy8gc3VwcG9ydCBhc3luYyBmdW5jdGlvbnMsIHNvIHdlXG4gICAgICAgICAgICAvLyBjYW5ub3QgZG8gaW1wb3J0LlxuICAgICAgICAgICAgUGx1Z2luT2JqID0gcmVxdWlyZShQbHVnaW5PYmopO1xuICAgICAgICB9XG4gICAgICAgIGlmICghUGx1Z2luT2JqIHx8IFBsdWdpbk9iaiBpbnN0YW5jZW9mIFBsdWdpbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gcGx1Z2luIHN1cHBsaWVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29uZmlndXJhdGlvbiAjMiB1c2UgUGx1Z2luT2JqIFwiKyB0eXBlb2YgUGx1Z2luT2JqICtcIiBcIisgdXRpbC5pbnNwZWN0KFBsdWdpbk9iaikpO1xuICAgICAgICB2YXIgcGx1Z2luID0gbmV3IFBsdWdpbk9iaigpO1xuICAgICAgICBwbHVnaW4uYWthc2hhID0gdGhpcy5ha2FzaGE7XG4gICAgICAgIHRoaXMuI3BsdWdpbnMucHVzaChwbHVnaW4pO1xuICAgICAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgcGx1Z2luLmNvbmZpZ3VyZSh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHBsdWdpbnMoKSB7IHJldHVybiB0aGlzLiNwbHVnaW5zOyB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlIG92ZXIgdGhlIGluc3RhbGxlZCBwbHVnaW5zLCBjYWxsaW5nIHRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gYGl0ZXJhdG9yYFxuICAgICAqIGZvciBlYWNoIHBsdWdpbiwgdGhlbiBjYWxsaW5nIHRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gYGZpbmFsYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpdGVyYXRvciBUaGUgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCBwbHVnaW4uICBTaWduYXR1cmU6IGBmdW5jdGlvbihwbHVnaW4sIG5leHQpYCAgVGhlIGBuZXh0YCBwYXJhbWV0ZXIgaXMgYSBmdW5jdGlvbiB1c2VkIHRvIGluZGljYXRlIGVycm9yIC0tIGBuZXh0KGVycilgIC0tIG9yIHN1Y2Nlc3MgLS0gbmV4dCgpXG4gICAgICogQHBhcmFtIGZpbmFsIFRoZSBmdW5jdGlvbiB0byBjYWxsIGFmdGVyIGFsbCBpdGVyYXRvciBjYWxscyBoYXZlIGJlZW4gbWFkZS4gIFNpZ25hdHVyZTogYGZ1bmN0aW9uKGVycilgXG4gICAgICovXG4gICAgZWFjaFBsdWdpbihpdGVyYXRvciwgZmluYWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZWFjaFBsdWdpbiBkZXByZWNhdGVkXCIpO1xuICAgICAgICAvKiBhc3luYy5lYWNoU2VyaWVzKHRoaXMucGx1Z2lucyxcbiAgICAgICAgZnVuY3Rpb24ocGx1Z2luLCBuZXh0KSB7XG4gICAgICAgICAgICBpdGVyYXRvcihwbHVnaW4sIG5leHQpO1xuICAgICAgICB9LFxuICAgICAgICBmaW5hbCk7ICovXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9vayBmb3IgYSBwbHVnaW4sIHJldHVybmluZyBpdHMgbW9kdWxlIHJlZmVyZW5jZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAqIEByZXR1cm5zIHtQbHVnaW59XG4gICAgICovXG4gICAgcGx1Z2luKG5hbWU6IHN0cmluZykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnY29uZmlnLnBsdWdpbjogJysgdXRpbC5pbnNwZWN0KHRoaXMuX3BsdWdpbnMpKTtcbiAgICAgICAgaWYgKCEgdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHBsdWdpbktleSBpbiB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIHZhciBwbHVnaW4gPSB0aGlzLnBsdWdpbnNbcGx1Z2luS2V5XTtcbiAgICAgICAgICAgIGlmIChwbHVnaW4ubmFtZSA9PT0gbmFtZSkgcmV0dXJuIHBsdWdpbjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgV0FSTklORzogRGlkIG5vdCBmaW5kIHBsdWdpbiAke25hbWV9YCk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIHBsdWdpbkRhdGEgb2JqZWN0IGZvciB0aGUgbmFtZWQgcGx1Z2luLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgKi8gXG4gICAgcGx1Z2luRGF0YShuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdmFyIHBsdWdpbkRhdGFBcnJheSA9IHRoaXMuI3BsdWdpbkRhdGE7XG4gICAgICAgIGlmICghKG5hbWUgaW4gcGx1Z2luRGF0YUFycmF5KSkge1xuICAgICAgICAgICAgcGx1Z2luRGF0YUFycmF5W25hbWVdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBsdWdpbkRhdGFBcnJheVtuYW1lXTtcbiAgICB9XG5cbiAgICBhc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWYoaHJlZikge1xuICAgICAgICBmb3IgKHZhciBwbHVnaW4gb2YgdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5pc0xlZ2l0TG9jYWxIcmVmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGlmIChwbHVnaW4uaXNMZWdpdExvY2FsSHJlZih0aGlzLCBocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyUmVuZGVyZXIocmVuZGVyZXI6IFJlbmRlcmVyKSB7XG4gICAgICAgIGlmICghKHJlbmRlcmVyIGluc3RhbmNlb2YgUmVuZGVyZXIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdOb3QgQSBSZW5kZXJlciAnKyB1dGlsLmluc3BlY3QocmVuZGVyZXIpKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm90IGEgUmVuZGVyZXIgJHt1dGlsLmluc3BlY3QocmVuZGVyZXIpfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5maW5kUmVuZGVyZXJOYW1lKHJlbmRlcmVyLm5hbWUpKSB7XG4gICAgICAgICAgICAvLyByZW5kZXJlci5ha2FzaGEgPSB0aGlzLmFrYXNoYTtcbiAgICAgICAgICAgIC8vIHJlbmRlcmVyLmNvbmZpZyA9IHRoaXM7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVnaXN0ZXJSZW5kZXJlciBgLCByZW5kZXJlcik7XG4gICAgICAgICAgICB0aGlzLiNyZW5kZXJlcnMucmVnaXN0ZXJSZW5kZXJlcihyZW5kZXJlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGxvdyBhbiBhcHBsaWNhdGlvbiB0byBvdmVycmlkZSBvbmUgb2YgdGhlIGJ1aWx0LWluIHJlbmRlcmVyc1xuICAgICAqIHRoYXQgYXJlIGluaXRpYWxpemVkIGJlbG93LiAgVGhlIGluc3BpcmF0aW9uIGlzIGVwdWJ0b29scyB0aGF0XG4gICAgICogbXVzdCB3cml0ZSBIVE1MIGZpbGVzIHdpdGggYW4gLnhodG1sIGV4dGVuc2lvbi4gIFRoZXJlZm9yZSBpdFxuICAgICAqIGNhbiBzdWJjbGFzcyBFSlNSZW5kZXJlciBldGMgd2l0aCBpbXBsZW1lbnRhdGlvbnMgdGhhdCBmb3JjZSB0aGVcbiAgICAgKiBmaWxlIG5hbWUgdG8gYmUgLnhodG1sLiAgV2UncmUgbm90IGNoZWNraW5nIGlmIHRoZSByZW5kZXJlciBuYW1lXG4gICAgICogaXMgYWxyZWFkeSB0aGVyZSBpbiBjYXNlIGVwdWJ0b29scyBtdXN0IHVzZSB0aGUgc2FtZSByZW5kZXJlciBuYW1lLlxuICAgICAqL1xuICAgIHJlZ2lzdGVyT3ZlcnJpZGVSZW5kZXJlcihyZW5kZXJlcjogUmVuZGVyZXIpIHtcbiAgICAgICAgaWYgKCEocmVuZGVyZXIgaW5zdGFuY2VvZiBSZW5kZXJlcikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vdCBBIFJlbmRlcmVyICcrIHV0aWwuaW5zcGVjdChyZW5kZXJlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYSBSZW5kZXJlcicpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlbmRlcmVyLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICAvLyByZW5kZXJlci5jb25maWcgPSB0aGlzO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMucmVnaXN0ZXJPdmVycmlkZVJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgICB9XG5cbiAgICBmaW5kUmVuZGVyZXJOYW1lKG5hbWU6IHN0cmluZyk6IFJlbmRlcmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3JlbmRlcmVycy5maW5kUmVuZGVyZXJOYW1lKG5hbWUpO1xuICAgIH1cblxuICAgIGZpbmRSZW5kZXJlclBhdGgoX3BhdGg6IHN0cmluZyk6IFJlbmRlcmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3JlbmRlcmVycy5maW5kUmVuZGVyZXJQYXRoKF9wYXRoKTtcbiAgICB9XG5cbiAgICBnZXQgcmVuZGVyZXJzKCkgeyByZXR1cm4gdGhpcy4jcmVuZGVyZXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgUmVuZGVyZXIgYnkgaXRzIGV4dGVuc2lvbi5cbiAgICAgKi9cbiAgICBmaW5kUmVuZGVyZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRSZW5kZXJlck5hbWUobmFtZSk7XG4gICAgfVxufVxuXG5jb25zdCBtb2R1bGVfZXhwb3J0cyA9IHtcbiAgICBSZW5kZXJlcnMsXG4gICAgUmVuZGVyZXI6IFJlbmRlcmVycy5SZW5kZXJlcixcbiAgICBtYWhhYmh1dGEsXG4gICAgZmlsZWNhY2hlLFxuICAgIHNldHVwLFxuICAgIGNhY2hlU2V0dXAsXG4gICAgY2xvc2VDYWNoZXMsXG4gICAgZmlsZUNhY2hlc1JlYWR5LFxuICAgIFBsdWdpbixcbiAgICByZW5kZXIsXG4gICAgcmVuZGVyRG9jdW1lbnQsXG4gICAgcmVuZGVyUGF0aCxcbiAgICByZWFkUmVuZGVyZWRGaWxlLFxuICAgIHBhcnRpYWwsXG4gICAgcGFydGlhbFN5bmMsXG4gICAgaW5kZXhDaGFpbixcbiAgICByZWxhdGl2ZSxcbiAgICBsaW5rUmVsU2V0QXR0cixcbiAgICBnZW5lcmF0ZVJTUyxcbiAgICBDb25maWd1cmF0aW9uXG59IGFzIGFueTtcblxuZXhwb3J0IGRlZmF1bHQgbW9kdWxlX2V4cG9ydHM7Il19