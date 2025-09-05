/**
 *
 * Copyright 2014-2025 David Herron
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
var _Configuration_instances, _Configuration_renderers, _Configuration_configdir, _Configuration_cachedir, _Configuration_assetsDirs, _Configuration_layoutDirs, _Configuration_documentDirs, _Configuration_partialDirs, _Configuration_mahafuncs, _Configuration_cheerio, _Configuration_renderTo, _Configuration_scripts, _Configuration_concurrency, _Configuration_cachingTimeout, _Configuration_metadata, _Configuration_root_url, _Configuration_plugins, _Configuration_pluginData, _Configuration_descriptions, _Configuration_saveDescriptionsToDB;
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
export * from './mahafuncs.js';
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
import * as filecache from './cache/cache-sqlite.js';
import { sqdb } from './sqdb.js';
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
        await filecache.setup(config, await sqdb);
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
        else if (found.docBody)
            partialText = found.docBody;
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
        _Configuration_instances.add(this);
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
        _Configuration_cachingTimeout.set(this, void 0);
        _Configuration_metadata.set(this, void 0);
        _Configuration_root_url.set(this, void 0);
        _Configuration_plugins.set(this, void 0);
        _Configuration_pluginData.set(this, void 0);
        _Configuration_descriptions.set(this, void 0);
        // this[_config_renderers] = [];
        __classPrivateFieldSet(this, _Configuration_renderers, new Renderers.Configuration({}), "f");
        __classPrivateFieldSet(this, _Configuration_mahafuncs, [], "f");
        __classPrivateFieldSet(this, _Configuration_scripts, {
            stylesheets: [],
            javaScriptTop: [],
            javaScriptBottom: []
        }, "f");
        __classPrivateFieldSet(this, _Configuration_concurrency, 3, "f");
        // 60 seconds, or 1 minute
        __classPrivateFieldSet(this, _Configuration_cachingTimeout, 60000, "f");
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
     * Add tag descriptions to the database.  The purpose
     * is for example a tag index page can give a
     * description at the top of the page.
     *
     * @param tagdescs
     */
    async addTagDescriptions(tagdescs) {
        if (!Array.isArray(tagdescs)) {
            throw new Error(`addTagDescriptions must be given an array of tag descriptions`);
        }
        for (const desc of tagdescs) {
            if (typeof desc.tagName !== 'string'
                || typeof desc.description !== 'string') {
                throw new Error(`Incorrect tag description ${util.inspect(desc)}`);
            }
        }
        __classPrivateFieldSet(this, _Configuration_descriptions, tagdescs, "f");
    }
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
     * Set the time, in miliseconds, to honor
     * the SearchCache in the search function.
     *
     * Default is 60000 (1 minute).
     *
     * Set to 0 to disable caching.
     * @param timeout
     */
    setCachingTimeout(timeout) {
        __classPrivateFieldSet(this, _Configuration_cachingTimeout, timeout, "f");
        // console.log(`setSearchCacheTimeout ${this.#searchCacheTimeout}`);
    }
    get cachingTimeout() {
        // console.log(`searchCacheTimeout ${this.#searchCacheTimeout}`);
        return __classPrivateFieldGet(this, _Configuration_cachingTimeout, "f");
    }
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
        // console.log(`copyAssets paths`,
        //     paths.map(item => {
        //         return {
        //             vpath: item.vpath,
        //             renderPath: item.renderPath,
        //             mime: item.mime
        //         }
        //     })
        // )
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
        // SPECIAL TREATMENT
        // The tag descriptions need to be installed
        // in the database.  It is impossible to do
        // that during Configuration setup in
        // the addTagDescriptions method.
        // This function is invoked after the database
        // is setup.
        await __classPrivateFieldGet(this, _Configuration_instances, "m", _Configuration_saveDescriptionsToDB).call(this);
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
_Configuration_renderers = new WeakMap(), _Configuration_configdir = new WeakMap(), _Configuration_cachedir = new WeakMap(), _Configuration_assetsDirs = new WeakMap(), _Configuration_layoutDirs = new WeakMap(), _Configuration_documentDirs = new WeakMap(), _Configuration_partialDirs = new WeakMap(), _Configuration_mahafuncs = new WeakMap(), _Configuration_cheerio = new WeakMap(), _Configuration_renderTo = new WeakMap(), _Configuration_scripts = new WeakMap(), _Configuration_concurrency = new WeakMap(), _Configuration_cachingTimeout = new WeakMap(), _Configuration_metadata = new WeakMap(), _Configuration_root_url = new WeakMap(), _Configuration_plugins = new WeakMap(), _Configuration_pluginData = new WeakMap(), _Configuration_descriptions = new WeakMap(), _Configuration_instances = new WeakSet(), _Configuration_saveDescriptionsToDB = async function _Configuration_saveDescriptionsToDB() {
    const documents = filecache.documentsCache;
    if (Array.isArray(__classPrivateFieldGet(this, _Configuration_descriptions, "f"))) {
        for (const desc of __classPrivateFieldGet(this, _Configuration_descriptions, "f")) {
            await documents.addTagDescription(desc.tagName, desc.description);
        }
    }
};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBR0g7OztHQUdHO0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsNENBQTRDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFzQyxVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RixPQUFPLEtBQUssU0FBUyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sS0FBSyxTQUFTLE1BQU0sc0JBQXNCLENBQUM7QUFDbEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ2hELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEtBQUssU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUN2QyxPQUFPLEtBQUssU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUN2QyxPQUFPLEtBQUssT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUNuQyxPQUFPLFdBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUVwRCxjQUFjLGdCQUFnQixDQUFDO0FBRS9CLE9BQU8sS0FBSyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sS0FBSyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBRXJDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDckMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUVyQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBaUIsTUFBTSxhQUFhLENBQUM7QUFDcEUsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBRXBFLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ3hDLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBRXRDLCtCQUErQjtBQUMvQixPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTlDLE9BQU8sS0FBSyxTQUFTLE1BQU0seUJBQXlCLENBQUM7QUFDckQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUVqQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBRTVDLDREQUE0RDtBQUM1RCxrQkFBa0I7QUFDbEIseUNBQXlDO0FBQ3pDLDhEQUE4RDtBQUM5RCxFQUFFO0FBQ0YsNERBQTREO0FBQzVELGlFQUFpRTtBQUNqRSw0Q0FBNEM7QUFDNUMsRUFBRTtBQUNGLHNFQUFzRTtBQUN0RSxtQ0FBbUM7QUFDbkMsRUFBRTtBQUNGLG9FQUFvRTtBQUNwRSxxRUFBcUU7QUFDckUsb0NBQW9DO0FBQ3BDLEVBQUU7QUFDRiw0REFBNEQ7QUFDNUQsb0RBQW9EO0FBQ3BELHdEQUF3RDtBQUN4RCw2REFBNkQ7QUFDN0QsOERBQThEO0FBQzlELHdEQUF3RDtBQUN4RCxpQ0FBaUM7QUFDakMsRUFBRTtBQUNGLGdFQUFnRTtBQUNoRSx5REFBeUQ7QUFDekQsRUFBRTtBQUNGLDhEQUE4RDtBQUM5RCwwQ0FBMEM7QUFFMUMsVUFBVSxDQUFDLEVBQUMsZUFBZSxFQUFFLENBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBRSxFQUFDLENBQUMsQ0FBQztBQUN0RCxVQUFVLENBQUMsRUFBQyxnQkFBZ0IsRUFBRSxDQUFFLFNBQVMsQ0FBRSxFQUFDLENBQUMsQ0FBQztBQUM5QyxVQUFVLENBQUMsRUFBQyxZQUFZLEVBQUUsQ0FBRSxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUM7QUFDckMsVUFBVSxDQUFDLEVBQUMsaUJBQWlCLEVBQUUsQ0FBRSxLQUFLLENBQUUsRUFBQyxDQUFDLENBQUM7QUFDM0MsVUFBVSxDQUFDLEVBQUMsbUJBQW1CLEVBQUUsQ0FBRSxZQUFZLENBQUUsRUFBQyxDQUFDLENBQUM7QUFDcEQsVUFBVSxDQUFDLEVBQUMsZUFBZSxFQUFFLENBQUUsUUFBUSxDQUFFLEVBQUMsQ0FBQyxDQUFDO0FBQzVDLFVBQVUsQ0FBQyxFQUFDLGdCQUFnQixFQUFFLENBQUUsU0FBUyxDQUFFLEVBQUMsQ0FBQyxDQUFDO0FBRTlDOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxLQUFLLENBQUMsTUFBTTtJQUU5QixNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUMvQywyQ0FBMkM7UUFDM0MsT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUM7SUFDRixNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWUsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUNuRCwrQ0FBK0M7UUFDL0MsT0FBTyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNoRCxDQUFDLENBQUE7SUFFRCxNQUFNLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6QixNQUFNLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxVQUFVLENBQUMsTUFBTTtJQUNuQyxJQUFJLENBQUM7UUFDRCxNQUFNLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLG9EQUFvRCxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLFdBQVc7SUFDN0IsSUFBSSxDQUFDO1FBQ0QsTUFBTSxTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDdEMsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLGdEQUFnRCxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLGVBQWUsQ0FBQyxNQUFNO0lBQ3hDLElBQUksQ0FBQztRQUNELE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNkLFNBQVMsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFO1lBQ2xDLFNBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFO1lBQy9CLFNBQVMsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFO1lBQ2hDLFNBQVMsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFO1NBQ3BDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQywyREFBMkQsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNoRixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7QUFDTCxDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU07SUFDM0MsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBQztJQUMzQyxJQUFJLEtBQUssQ0FBQztJQUNWLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNkLE9BQU8sS0FBSyxHQUFHLEVBQUUsRUFBRSxDQUFDO1FBQ2hCOzs7Ozs7Ozs7Ozs7Ozs7O1dBZ0JHO1FBQ0gsS0FBSyxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyQyxJQUFJLEtBQUs7WUFBRSxNQUFNO2FBQ1osQ0FBQztZQUNGLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ2xDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7b0JBQ1osT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN2QixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDWixDQUFDLENBQUMsQ0FBQztZQUNILEtBQUssRUFBRSxDQUFDO1FBQ1osQ0FBQztJQUNMLENBQUM7SUFFRCw4Q0FBOEM7SUFDOUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBQ0QsSUFBSSxNQUFNLEdBQUcsTUFBTSxjQUFjLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sQ0FBQyxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEtBQUs7SUFFaEQsSUFBSSxJQUFJLEdBQUcsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xGLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxlQUFlO1FBQ3RCLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDO1FBQzVDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTdCLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDdkIsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sQ0FBQyxLQUFLLFVBQVUsT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUTtJQUVqRCxJQUFJLENBQUMsS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQ3RDLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFFRCxtQ0FBbUM7SUFDbkMsTUFBTSxLQUFLLEdBQUcsTUFBTSxTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN4RCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDVCxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixLQUFLLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFDRCxzRUFBc0U7SUFFdEUsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0RCxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ1gsdUVBQXVFO1FBQ3ZFLElBQUksV0FBVyxDQUFDO1FBQ2hCLElBQUksS0FBSyxDQUFDLE9BQU87WUFBRSxXQUFXLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQzthQUMxQyxJQUFJLEtBQUssQ0FBQyxPQUFPO1lBQUUsV0FBVyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7O1lBQy9DLFdBQVcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUU1RCx3REFBd0Q7UUFDeEQsa0RBQWtEO1FBQ2xELGdEQUFnRDtRQUNoRCw4REFBOEQ7UUFDOUQsSUFBSSxLQUFLLEdBQVEsRUFBRSxDQUFDO1FBQ3BCLElBQUksSUFBSSxDQUFDO1FBRVQsS0FBSyxJQUFJLElBQUksUUFBUSxFQUFFLENBQUM7WUFDcEIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDdEIsS0FBSyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN2RCxLQUFLLENBQUMsT0FBTyxHQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELHVFQUF1RTtRQUN2RSxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDbkIsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO1lBQ3BCLE9BQU8sRUFBRSxXQUFXO1lBQ3BCLFFBQVEsRUFBRSxLQUFLO1lBQ2YsNEJBQTRCO1NBQy9CLENBQUMsQ0FBQztJQUNQLENBQUM7U0FBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDekUsc0RBQXNEO1FBQ3RELE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLENBQUM7U0FBTSxDQUFDO1FBQ0osTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsS0FBSyxNQUFNLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3JGLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVE7SUFFL0MsSUFBSSxDQUFDLEtBQUssSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRUQsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsS0FBSyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM3RixDQUFDO0lBRUQsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwRCxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ1gsd0RBQXdEO1FBQ3hELGtEQUFrRDtRQUNsRCxnREFBZ0Q7UUFDaEQsOERBQThEO1FBQzlELElBQUksS0FBSyxHQUFRLEVBQUUsQ0FBQztRQUNwQixJQUFJLElBQUksQ0FBQztRQUVULEtBQUssSUFBSSxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ3BCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUNELEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3RCLHFEQUFxRDtRQUNyRCwwQ0FBMEM7UUFDMUMsNENBQTRDO1FBQzVDLEtBQUssQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkQsc0RBQXNEO1FBQ3RELHNEQUFzRDtRQUN0RCx5QkFBeUI7UUFDekIsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3pELGtEQUFrRDtRQUNsRCw2REFBNkQ7UUFDN0QsNERBQTREO1FBRTVELDJFQUEyRTtRQUMzRSxPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQTZCO1lBQ25ELE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTTtZQUNwQixPQUFPLEVBQUUsV0FBVztZQUNwQixRQUFRLEVBQUUsS0FBSztZQUNmLDRCQUE0QjtTQUMvQixDQUFDLENBQUM7SUFDUCxDQUFDO1NBQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1FBQ3pFLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pELENBQUM7U0FBTSxDQUFDO1FBQ0osTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsS0FBSyxNQUFNLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3JGLENBQUM7QUFDTCxDQUFDO0FBVUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxVQUFVLENBQzVCLE1BQU0sRUFBRSxLQUFLO0lBR2Isc0RBQXNEO0lBQ3RELHlEQUF5RDtJQUN6RCxzREFBc0Q7SUFFdEQsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBQztJQUMzQyxPQUFPLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUdEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTTtJQUM5QyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzdDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RDLElBQUksQ0FBQyxPQUFPLElBQUksTUFBTSxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQixLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdEMsQ0FBQztTQUFNLElBQUksT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDaEMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7QUFDTCxDQUFDO0FBQUEsQ0FBQztBQUVGLHFDQUFxQztBQUVyQyxNQUFNLENBQUMsS0FBSyxVQUFVLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUTtJQUUxRSxpREFBaUQ7SUFDakQsZ0dBQWdHO0lBQ2hHLEVBQUU7SUFDRixvREFBb0Q7SUFFcEQsc0RBQXNEO0lBRXRELCtCQUErQjtJQUMvQixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixLQUFLLElBQUksR0FBRyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM1QixzQ0FBc0M7UUFDbEMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEMsR0FBRztJQUNQLENBQUM7SUFFRCwwQ0FBMEM7SUFFMUMsb0RBQW9EO0lBRXBELDZCQUE2QjtJQUM3QixLQUFLLElBQUksR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ3ZCLHFDQUFxQztRQUNqQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLEdBQUc7SUFDUCxDQUFDO0lBRUQsc0RBQXNEO0lBRXRELElBQUksT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRTNCLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBUyxJQUFJLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXRELElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUN4QixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUU5RCxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQzdELE1BQU0sR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFFOUQsQ0FBQztBQUFBLENBQUM7QUFxR0Y7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLE9BQU8sYUFBYTtJQXVCdEIsWUFBWSxVQUFVOztRQXRCdEIsMkNBQW9DO1FBQ3BDLDJDQUFtQjtRQUNuQiwwQ0FBa0I7UUFDbEIsNENBQTJCO1FBQzNCLDRDQUEyQjtRQUMzQiw4Q0FBNkI7UUFDN0IsNkNBQTRCO1FBQzVCLDJDQUFXO1FBQ1gseUNBQWtDO1FBQ2xDLDBDQUFrQjtRQUNsQix5Q0FJRTtRQUNGLDZDQUFxQjtRQUNyQixnREFBd0I7UUFDeEIsMENBQWU7UUFDZiwwQ0FBa0I7UUFDbEIseUNBQVM7UUFDVCw0Q0FBWTtRQXFiWiw4Q0FHRztRQXBiQyxnQ0FBZ0M7UUFDaEMsdUJBQUEsSUFBSSw0QkFBYyxJQUFJLFNBQVMsQ0FBQyxhQUFhLENBQUMsRUFFN0MsQ0FBQyxNQUFBLENBQUM7UUFFSCx1QkFBQSxJQUFJLDRCQUFjLEVBQUUsTUFBQSxDQUFDO1FBQ3JCLHVCQUFBLElBQUksMEJBQVk7WUFDWixXQUFXLEVBQUUsRUFBRTtZQUNmLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLGdCQUFnQixFQUFFLEVBQUU7U0FDdkIsTUFBQSxDQUFDO1FBRUYsdUJBQUEsSUFBSSw4QkFBZ0IsQ0FBQyxNQUFBLENBQUM7UUFDdEIsMEJBQTBCO1FBQzFCLHVCQUFBLElBQUksaUNBQW1CLEtBQUssTUFBQSxDQUFDO1FBRTdCLHVCQUFBLElBQUksK0JBQWlCLEVBQUUsTUFBQSxDQUFDO1FBQ3hCLHVCQUFBLElBQUksNkJBQWUsRUFBRSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSw4QkFBZ0IsRUFBRSxNQUFBLENBQUM7UUFDdkIsdUJBQUEsSUFBSSw2QkFBZSxFQUFFLE1BQUEsQ0FBQztRQUV0Qix1QkFBQSxJQUFJLDRCQUFjLEVBQUUsTUFBQSxDQUFDO1FBRXJCLHVCQUFBLElBQUksMkJBQWEsS0FBSyxNQUFBLENBQUM7UUFFdkIsdUJBQUEsSUFBSSwyQkFBYSxFQUFTLE1BQUEsQ0FBQztRQUUzQix1QkFBQSxJQUFJLDBCQUFZLEVBQUUsTUFBQSxDQUFDO1FBQ25CLHVCQUFBLElBQUksNkJBQWUsRUFBRSxNQUFBLENBQUM7UUFFdEI7Ozs7OztXQU1HO1FBQ0gsMkNBQTJDO1FBQzNDLHNEQUFzRDtRQUV0RCxrREFBa0Q7UUFDbEQsb0VBQW9FO1FBQ3BFLGdFQUFnRTtRQUNoRSxFQUFFO1FBQ0YseURBQXlEO1FBQ3pELDJEQUEyRDtRQUMzRCxzQkFBc0I7UUFDdEIsRUFBRTtRQUNGLGlFQUFpRTtRQUNqRSxpRUFBaUU7UUFDakUsc0RBQXNEO1FBQ3RELDZEQUE2RDtRQUM3RCx1REFBdUQ7UUFDdkQsdUJBQXVCO1FBQ3ZCLElBQUksT0FBTyxVQUFVLEtBQUssV0FBVyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUMzRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELGlFQUFpRTtRQUNqRSw2REFBNkQ7UUFDN0QsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQztZQUN6QyxhQUFhLEVBQUUsVUFBUyxLQUFLLEVBQUUsUUFBUTtnQkFDbkMsT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM1QyxDQUFDO1NBQ0osQ0FBQyxDQUFDLENBQUM7SUFDUixDQUFDO0lBR0Q7Ozs7Ozs7Ozs7Ozs7T0FhRztJQUNILE9BQU87UUFFSCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFFcEIsTUFBTSxhQUFhLEdBQUcsVUFBUyxLQUFLO1lBQ2hDLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN2QixJQUFJLE9BQU8sTUFBTSxDQUFDLFNBQVMsS0FBSyxXQUFXLElBQUksTUFBTSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDdEUsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBQ0QsT0FBTyxVQUFVLENBQUM7UUFDdEIsQ0FBQyxDQUFBO1FBRUQsSUFBSSxJQUFJLENBQUM7UUFFVCxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLHVCQUFBLElBQUksK0JBQVUsRUFBRSxDQUFDO1lBQ2xCLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUM7bUJBQzVCLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO29CQUNyQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztnQkFDNUIsQ0FBQztxQkFBTSxDQUFDO29CQUNKLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztnQkFDbEQsQ0FBQztZQUNMLENBQUM7aUJBQU0sQ0FBQztnQkFDSixFQUFFLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUM1QixDQUFDO1FBQ0wsQ0FBQzthQUFNLElBQUksdUJBQUEsSUFBSSwrQkFBVSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLCtCQUFVLENBQUMsRUFBRSxDQUFDO1lBQzFELEVBQUUsQ0FBQyxTQUFTLENBQUMsdUJBQUEsSUFBSSwrQkFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELE1BQU0sY0FBYyxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsdUJBQUEsSUFBSSxpQ0FBWSxFQUFFLENBQUM7WUFDcEIsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN4RSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO29CQUNyQixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNoQyxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFFRCxNQUFNLGVBQWUsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLHVCQUFBLElBQUksaUNBQVksRUFBRSxDQUFDO1lBQ3BCLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDMUUsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztvQkFDckIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxlQUFlLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3pDLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDMUUsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztvQkFDckIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxnQkFBZ0IsR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLHVCQUFBLElBQUksbUNBQWMsRUFBRSxDQUFDO1lBQ3RCLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzVFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7cUJBQU0sQ0FBQztvQkFDSixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7Z0JBQ3RELENBQUM7WUFDTCxDQUFDO2lCQUFNLENBQUM7Z0JBQ0osTUFBTSxJQUFJLEtBQUssQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO1lBQy9FLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLCtCQUFVLEVBQUcsQ0FBQztZQUNuQixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDO21CQUMzQixDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztvQkFDckIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNyQyxDQUFDO3FCQUFNLENBQUM7b0JBQ0osTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO1lBQ0wsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyQyxDQUFDO1FBQ0wsQ0FBQzthQUFNLElBQUksdUJBQUEsSUFBSSwrQkFBVSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLCtCQUFVLENBQUMsRUFBRSxDQUFDO1lBQzFELEVBQUUsQ0FBQyxTQUFTLENBQUMsdUJBQUEsSUFBSSwrQkFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELHFFQUFxRTtRQUNyRSwwRUFBMEU7UUFDMUUsZ0NBQWdDO1FBQ2hDLEVBQUU7UUFFRiw2Q0FBNkM7UUFDN0MsMENBQTBDO1FBQzFDLCtCQUErQjtRQUMvQixzQ0FBc0M7UUFDdEMsdUJBQXVCO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFO1FBQ3BCLDBCQUEwQjtRQUMxQix5REFBeUQ7UUFDekQsc0JBQXNCO1FBQ3RCLHNFQUFzRTtRQUN0RSw2Q0FBNkM7UUFDN0Msc0RBQXNEO1FBQ3RELElBQUk7U0FDUCxDQUFDLENBQUM7UUFFSCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxTQUFTLENBQUMsTUFBYyxJQUFJLHVCQUFBLElBQUksNEJBQWMsTUFBTSxNQUFBLENBQUMsQ0FBQyxDQUFDO0lBQzNELElBQUksU0FBUyxLQUFLLE9BQU8sdUJBQUEsSUFBSSxnQ0FBVyxDQUFDLENBQUMsQ0FBQztJQUUzQyxJQUFJLFFBQVEsQ0FBQyxLQUFhLElBQUksdUJBQUEsSUFBSSwyQkFBYSxLQUFLLE1BQUEsQ0FBQyxDQUFDLENBQUM7SUFDdkQsSUFBSSxRQUFRLEtBQUssT0FBTyx1QkFBQSxJQUFJLCtCQUFVLENBQUMsQ0FBQyxDQUFDO0lBRXpDLDJEQUEyRDtJQUMzRCxJQUFJLE1BQU0sS0FBSyxPQUFPLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFFdkMsS0FBSyxDQUFDLGNBQWMsS0FBSyxPQUFPLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBQzNELEtBQUssQ0FBQyxXQUFXLEtBQVEsT0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUN4RCxLQUFLLENBQUMsWUFBWSxLQUFPLE9BQU8sU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDekQsS0FBSyxDQUFDLGFBQWEsS0FBTSxPQUFPLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBRTFEOzs7T0FHRztJQUNILGVBQWUsQ0FBQyxHQUFlO1FBQzNCLGlFQUFpRTtRQUNqRSw0QkFBNEI7UUFDNUIsSUFBSSxRQUFvQixDQUFDO1FBQ3pCLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDbEQsUUFBUSxHQUFHO29CQUNQLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDO29CQUNuQyxJQUFJLEVBQUUsR0FBRztpQkFDWixDQUFDO1lBQ04sQ0FBQztpQkFBTSxDQUFDO2dCQUNKLFFBQVEsR0FBRztvQkFDUCxHQUFHLEVBQUUsR0FBRztvQkFDUixJQUFJLEVBQUUsR0FBRztpQkFDWixDQUFDO1lBQ04sQ0FBQztRQUNMLENBQUM7YUFBTSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUN0RCxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzdDLFFBQVEsR0FBRyxHQUFHLENBQUM7WUFDbkIsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLFFBQVEsR0FBRyxHQUFHLENBQUM7WUFDbkIsQ0FBQztRQUNMLENBQUM7YUFBTSxDQUFDO1lBQ0osTUFBTSxJQUFJLEtBQUssQ0FBQyxzREFBc0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDL0YsQ0FBQztRQUNELHVCQUFBLElBQUksbUNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsdUdBQXVHO1FBQ3ZHLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDWixPQUFPLHVCQUFBLElBQUksbUNBQWMsQ0FBQztJQUM5QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsZUFBZSxDQUFDLE9BQWU7UUFDM0IsS0FBSyxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbkMsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxNQUFNLENBQUMsR0FBRyxLQUFLLE9BQU8sRUFBRSxDQUFDO29CQUN6QixPQUFPLE1BQU0sQ0FBQztnQkFDbEIsQ0FBQztZQUNMLENBQUM7aUJBQU0sSUFBSSxNQUFNLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sTUFBTSxDQUFDO1lBQ2xCLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7T0FHRztJQUNILGFBQWEsQ0FBQyxHQUFlO1FBQ3pCLGlFQUFpRTtRQUNqRSw0QkFBNEI7UUFDNUIsSUFBSSxRQUFvQixDQUFDO1FBQ3pCLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDbEQsUUFBUSxHQUFHO29CQUNQLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDO29CQUNuQyxJQUFJLEVBQUUsR0FBRztpQkFDWixDQUFDO1lBQ04sQ0FBQztpQkFBTSxDQUFDO2dCQUNKLFFBQVEsR0FBRztvQkFDUCxHQUFHLEVBQUUsR0FBRztvQkFDUixJQUFJLEVBQUUsR0FBRztpQkFDWixDQUFDO1lBQ04sQ0FBQztRQUNMLENBQUM7YUFBTSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUN0RCxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzdDLFFBQVEsR0FBRyxHQUFHLENBQUM7WUFDbkIsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLFFBQVEsR0FBRyxHQUFHLENBQUM7WUFDbkIsQ0FBQztRQUNMLENBQUM7YUFBTSxDQUFDO1lBQ0osTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDN0YsQ0FBQztRQUNELHVCQUFBLElBQUksaUNBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEMsd05BQXdOO1FBQ3hOLHVCQUFBLElBQUksZ0NBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNDLDhMQUE4TDtRQUM5TCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsSUFBSSxVQUFVLEtBQUssT0FBTyx1QkFBQSxJQUFJLGlDQUFZLENBQUMsQ0FBQyxDQUFDO0lBRTdDOzs7O09BSUc7SUFDSCxjQUFjLENBQUMsR0FBZTtRQUMxQixpRUFBaUU7UUFDakUsNEJBQTRCO1FBQzVCLElBQUksUUFBb0IsQ0FBQztRQUN6QixJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ2xELFFBQVEsR0FBRztvQkFDUCxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQztvQkFDbkMsSUFBSSxFQUFFLEdBQUc7aUJBQ1osQ0FBQztZQUNOLENBQUM7aUJBQU0sQ0FBQztnQkFDSixRQUFRLEdBQUc7b0JBQ1AsR0FBRyxFQUFFLEdBQUc7b0JBQ1IsSUFBSSxFQUFFLEdBQUc7aUJBQ1osQ0FBQztZQUNOLENBQUM7UUFDTCxDQUFDO2FBQU0sSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDdEQsR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM3QyxRQUFRLEdBQUcsR0FBRyxDQUFDO1lBQ25CLENBQUM7aUJBQU0sQ0FBQztnQkFDSixRQUFRLEdBQUcsR0FBRyxDQUFDO1lBQ25CLENBQUM7UUFDTCxDQUFDO2FBQU0sQ0FBQztZQUNKLE1BQU0sSUFBSSxLQUFLLENBQUMscURBQXFELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFDRCx1Q0FBdUM7UUFDdkMsdUJBQUEsSUFBSSxrQ0FBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqQyx1QkFBQSxJQUFJLGdDQUFXLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QyxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsSUFBSSxZQUFZLEtBQUssT0FBTyx1QkFBQSxJQUFJLGtDQUFhLENBQUMsQ0FBQyxDQUFDO0lBRWhEOzs7O09BSUc7SUFDSCxZQUFZLENBQUMsR0FBZTtRQUN4QixpRUFBaUU7UUFDakUsNEJBQTRCO1FBQzVCLElBQUksUUFBb0IsQ0FBQztRQUN6QixJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ2xELFFBQVEsR0FBRztvQkFDUCxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQztvQkFDbkMsSUFBSSxFQUFFLEdBQUc7aUJBQ1osQ0FBQztZQUNOLENBQUM7aUJBQU0sQ0FBQztnQkFDSixRQUFRLEdBQUc7b0JBQ1AsR0FBRyxFQUFFLEdBQUc7b0JBQ1IsSUFBSSxFQUFFLEdBQUc7aUJBQ1osQ0FBQztZQUNOLENBQUM7UUFDTCxDQUFDO2FBQU0sSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDdEQsR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM3QyxRQUFRLEdBQUcsR0FBRyxDQUFDO1lBQ25CLENBQUM7aUJBQU0sQ0FBQztnQkFDSixRQUFRLEdBQUcsR0FBRyxDQUFDO1lBQ25CLENBQUM7UUFDTCxDQUFDO2FBQU0sQ0FBQztZQUNKLE1BQU0sSUFBSSxLQUFLLENBQUMsbURBQW1ELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVGLENBQUM7UUFDRCx1QkFBQSxJQUFJLGlDQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxJQUFJLFNBQVMsS0FBSyxPQUFPLHVCQUFBLElBQUksaUNBQVksQ0FBQyxDQUFDLENBQUM7SUFFNUM7Ozs7T0FJRztJQUNILFlBQVksQ0FBQyxTQUEyRDtRQUNwRSxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2pELE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFDRCx1QkFBQSxJQUFJLGdDQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxJQUFJLFNBQVMsS0FBSyxPQUFPLHVCQUFBLElBQUksZ0NBQVcsQ0FBQyxDQUFDLENBQUM7SUFFM0M7Ozs7T0FJRztJQUNILG9CQUFvQixDQUFDLEdBQVc7UUFDNUIsaUVBQWlFO1FBQ2pFLDRCQUE0QjtRQUM1QixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFLENBQUM7WUFDekIsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ25ELEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDekMsQ0FBQztRQUNMLENBQUM7UUFDRCx1QkFBQSxJQUFJLDJCQUFhLEdBQUcsTUFBQSxDQUFDO1FBQ3JCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxnRUFBZ0U7SUFDaEUsSUFBSSxpQkFBaUIsS0FBSyxPQUFPLHVCQUFBLElBQUksK0JBQVUsQ0FBQyxDQUFDLENBQUM7SUFDbEQsSUFBSSxRQUFRLEtBQUssT0FBTyx1QkFBQSxJQUFJLCtCQUFVLENBQUMsQ0FBQyxDQUFDO0lBRXpDOzs7Ozs7T0FNRztJQUNILFdBQVcsQ0FBQyxLQUFhLEVBQUUsS0FBVTtRQUNqQyxJQUFJLEVBQUUsR0FBRyx1QkFBQSxJQUFJLCtCQUFVLENBQUM7UUFDeEIsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNsQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsSUFBSSxRQUFRLEtBQUssT0FBTyx1QkFBQSxJQUFJLCtCQUFVLENBQUMsQ0FBQyxDQUFDO0lBT3pDOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUd2QjtRQUNFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQywrREFBK0QsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFDRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQzFCLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxLQUFLLFFBQVE7bUJBQ2hDLE9BQU8sSUFBSSxDQUFDLFdBQVcsS0FBSyxRQUFRLEVBQ3JDLENBQUM7Z0JBQ0EsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdkUsQ0FBQztRQUNMLENBQUM7UUFDRCx1QkFBQSxJQUFJLCtCQUFpQixRQUFRLE1BQUEsQ0FBQztJQUNsQyxDQUFDO0lBYUQ7Ozs7TUFJRTtJQUNGLE9BQU8sQ0FBQyxRQUFnQjtRQUNwQix1QkFBQSxJQUFJLDJCQUFhLFFBQVEsTUFBQSxDQUFDO1FBQzFCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxJQUFJLFFBQVEsS0FBSyxPQUFPLHVCQUFBLElBQUksK0JBQVUsQ0FBQyxDQUFDLENBQUM7SUFFekM7Ozs7T0FJRztJQUNILGNBQWMsQ0FBQyxXQUFtQjtRQUM5Qix1QkFBQSxJQUFJLDhCQUFnQixXQUFXLE1BQUEsQ0FBQztRQUNoQyxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsSUFBSSxXQUFXLEtBQUssT0FBTyx1QkFBQSxJQUFJLGtDQUFhLENBQUMsQ0FBQyxDQUFDO0lBRS9DOzs7Ozs7OztPQVFHO0lBQ0gsaUJBQWlCLENBQUMsT0FBZTtRQUM3Qix1QkFBQSxJQUFJLGlDQUFtQixPQUFPLE1BQUEsQ0FBQztRQUMvQixvRUFBb0U7SUFDeEUsQ0FBQztJQUVELElBQUksY0FBYztRQUNkLGlFQUFpRTtRQUNqRSxPQUFPLHVCQUFBLElBQUkscUNBQWdCLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxtQkFBbUIsQ0FBQyxNQUFzQjtRQUN0Qyx1QkFBQSxJQUFJLDhCQUFTLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsSUFBSSxPQUFPLEtBQUssT0FBTyx1QkFBQSxJQUFJLDhCQUFTLENBQUMsQ0FBQyxDQUFDO0lBRXZDOzs7O09BSUc7SUFDSCxtQkFBbUIsQ0FBQyxNQUFzQjtRQUN0Qyx1QkFBQSxJQUFJLDhCQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsYUFBYSxDQUFDLEdBQW1CO1FBQzdCLHVCQUFBLElBQUksOEJBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxrQkFBa0IsQ0FBQyxPQUFnQztRQUMvQyx1QkFBQSxJQUFJLDBCQUFZLE9BQU8sTUFBQSxDQUFDO1FBRXhCLHVEQUF1RDtRQUN2RCxpREFBaUQ7UUFDakQsdURBQXVEO1FBQ3ZELG9EQUFvRDtRQUNwRCx1Q0FBdUM7UUFDdkMsSUFBSSxDQUFDLENBQUMsaUJBQWlCLElBQUksdUJBQUEsSUFBSSw4QkFBUyxDQUFDLEVBQUUsQ0FBQztZQUN2Qyx1QkFBQSxJQUFJLDhCQUFpQixDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDbEQsQ0FBQztRQUVELHNDQUFzQztJQUMxQyxDQUFDO0lBRUQsSUFBSSxlQUFlLEtBQUssT0FBTyx1QkFBQSxJQUFJLDhCQUFTLENBQUMsQ0FBQyxDQUFDO0lBRS9DOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFVBQVU7UUFDWixtQ0FBbUM7UUFFbkMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUM7UUFDckMsMEJBQTBCO1FBQzFCLHFDQUFxQztRQUNyQyxNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUVuQyxrQ0FBa0M7UUFDbEMsMEJBQTBCO1FBQzFCLG1CQUFtQjtRQUNuQixpQ0FBaUM7UUFDakMsMkNBQTJDO1FBQzNDLDhCQUE4QjtRQUM5QixZQUFZO1FBQ1osU0FBUztRQUNULElBQUk7UUFFSixxQ0FBcUM7UUFDckMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLFdBQVUsSUFBSTtZQUMzQyxJQUFJLENBQUM7Z0JBQ0QsbUVBQW1FO2dCQUNuRSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN6RCw2Q0FBNkM7Z0JBQzdDLE1BQU0sR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQzNELG9EQUFvRDtnQkFDcEQsNENBQTRDO2dCQUM1QywwREFBMEQ7Z0JBQzFELE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRTtvQkFDOUIsS0FBSyxFQUFFLElBQUk7b0JBQ1gsa0JBQWtCLEVBQUUsSUFBSTtpQkFDM0IsQ0FBQyxDQUFDO2dCQUNILE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLE1BQU0sQ0FBQyxRQUFRLFlBQVksR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDdkksQ0FBQztRQUNMLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVQLDhDQUE4QztRQUM5QyxzREFBc0Q7UUFDdEQsOEJBQThCO1FBQzlCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNuQixLQUFLLElBQUksS0FBSyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3RCLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDRCx5Q0FBeUM7UUFDekMsa0RBQWtEO1FBQ2xELElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQUUsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25ELGtEQUFrRDtRQUNsRCxzQkFBc0I7UUFDdEIsZ0NBQWdDO1FBQ2hDLGlDQUFpQztRQUNqQyxJQUFJO0lBQ1IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLHNCQUFzQjtRQUN4Qix5Q0FBeUM7UUFDekMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLEtBQUssSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hDLElBQUksT0FBTyxNQUFNLENBQUMsa0JBQWtCLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ25ELG1FQUFtRTtnQkFDbkUsTUFBTSxNQUFNLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsZ0JBQWdCO1FBQ2xCLG1DQUFtQztRQUNuQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDcEIsS0FBSyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEMsSUFBSSxPQUFPLE1BQU0sQ0FBQyxjQUFjLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQy9DLCtEQUErRDtnQkFDL0QsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hDLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBa0IsRUFBRSxNQUFpQjtRQUNyRCw4REFBOEQ7UUFDOUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLEtBQUssSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hDLElBQUksT0FBTyxNQUFNLENBQUMsV0FBVyxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUM1Qyw0REFBNEQ7Z0JBQzVELE1BQU0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3pELENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsVUFBa0IsRUFBRSxNQUFpQjtRQUN2RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDcEIsS0FBSyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEMsSUFBSSxPQUFPLE1BQU0sQ0FBQyxhQUFhLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQzlDLDhEQUE4RDtnQkFDOUQsTUFBTSxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDM0QsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQWtCLEVBQUUsTUFBaUI7UUFDeEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLEtBQUssSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hDLElBQUksT0FBTyxNQUFNLENBQUMsY0FBYyxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUMvQywrREFBK0Q7Z0JBQy9ELE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzVELENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxZQUFvQixFQUFFLFVBQVU7UUFDckQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLEtBQUssSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hDLElBQUksT0FBTyxNQUFNLENBQUMsZ0JBQWdCLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ2pELE1BQU0sTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDcEUsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLG9CQUFvQjtRQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDcEIsS0FBSyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEMsSUFBSSxPQUFPLE1BQU0sQ0FBQyxrQkFBa0IsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxNQUFNLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsQ0FBQztRQUNMLENBQUM7UUFFRCxvQkFBb0I7UUFDcEIsNENBQTRDO1FBQzVDLDJDQUEyQztRQUMzQyxxQ0FBcUM7UUFDckMsaUNBQWlDO1FBQ2pDLDhDQUE4QztRQUM5QyxZQUFZO1FBRVosTUFBTSx1QkFBQSxJQUFJLHFFQUFzQixNQUExQixJQUFJLENBQXdCLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsR0FBRyxDQUFDLFNBQVMsRUFBRSxPQUFPO1FBQ2xCLGtHQUFrRztRQUNsRyxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLGdDQUFnQztZQUNoQyx1Q0FBdUM7WUFDdkMsaUNBQWlDO1lBQ2pDLGlDQUFpQztZQUNqQyxvQkFBb0I7WUFDcEIsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLFlBQVksTUFBTSxFQUFFLENBQUM7WUFDNUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFDRCxrR0FBa0c7UUFDbEcsSUFBSSxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUM3QixNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDNUIsdUJBQUEsSUFBSSw4QkFBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixJQUFJLENBQUMsT0FBTztZQUFFLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDM0IsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELElBQUksT0FBTyxLQUFLLE9BQU8sdUJBQUEsSUFBSSw4QkFBUyxDQUFDLENBQUMsQ0FBQztJQUV2Qzs7Ozs7O09BTUc7SUFDSCxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUs7UUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3pDOzs7O2tCQUlVO0lBQ2QsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxNQUFNLENBQUMsSUFBWTtRQUNmLCtEQUErRDtRQUMvRCxJQUFJLENBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2pCLE9BQU8sU0FBUyxDQUFDO1FBQ3JCLENBQUM7UUFDRCxLQUFLLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JDLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxJQUFJO2dCQUFFLE9BQU8sTUFBTSxDQUFDO1FBQzVDLENBQUM7UUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsVUFBVSxDQUFDLElBQVk7UUFDbkIsSUFBSSxlQUFlLEdBQUcsdUJBQUEsSUFBSSxpQ0FBWSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxlQUFlLENBQUMsRUFBRSxDQUFDO1lBQzdCLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUNELE9BQU8sZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRCx3QkFBd0IsQ0FBQyxJQUFJO1FBQ3pCLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlCLElBQUksT0FBTyxNQUFNLENBQUMsZ0JBQWdCLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ2pELElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN0QyxPQUFPLElBQUksQ0FBQztnQkFDaEIsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELGdCQUFnQixDQUFDLFFBQWtCO1FBQy9CLElBQUksQ0FBQyxDQUFDLFFBQVEsWUFBWSxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQ2xDLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEdBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3hDLGlDQUFpQztZQUNqQywwQkFBMEI7WUFDMUIsOENBQThDO1lBQzlDLHVCQUFBLElBQUksZ0NBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCx3QkFBd0IsQ0FBQyxRQUFrQjtRQUN2QyxJQUFJLENBQUMsQ0FBQyxRQUFRLFlBQVksUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNsQyxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixHQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN6RCxNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUNELGlDQUFpQztRQUNqQywwQkFBMEI7UUFDMUIsdUJBQUEsSUFBSSxnQ0FBVyxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxJQUFZO1FBQ3pCLE9BQU8sdUJBQUEsSUFBSSxnQ0FBVyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxLQUFhO1FBQzFCLE9BQU8sdUJBQUEsSUFBSSxnQ0FBVyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCxJQUFJLFNBQVMsS0FBSyxPQUFPLHVCQUFBLElBQUksZ0NBQVcsQ0FBQyxDQUFDLENBQUM7SUFFM0M7O09BRUc7SUFDSCxZQUFZLENBQUMsSUFBWTtRQUNyQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQ0o7NDBCQWhZRyxLQUFLO0lBQ0QsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBQztJQUMzQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsdUJBQUEsSUFBSSxtQ0FBYyxDQUFDLEVBQUUsQ0FBQztRQUNwQyxLQUFLLE1BQU0sSUFBSSxJQUFJLHVCQUFBLElBQUksbUNBQWMsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sU0FBUyxDQUFDLGlCQUFpQixDQUM3QixJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQ2pDLENBQUM7UUFDTixDQUFDO0lBQ0wsQ0FBQztBQUNMLENBQUM7QUF5WEwsTUFBTSxjQUFjLEdBQUc7SUFDbkIsU0FBUztJQUNULFFBQVEsRUFBRSxTQUFTLENBQUMsUUFBUTtJQUM1QixTQUFTO0lBQ1QsU0FBUztJQUNULEtBQUs7SUFDTCxVQUFVO0lBQ1YsV0FBVztJQUNYLGVBQWU7SUFDZixNQUFNO0lBQ04sTUFBTTtJQUNOLGNBQWM7SUFDZCxVQUFVO0lBQ1YsZ0JBQWdCO0lBQ2hCLE9BQU87SUFDUCxXQUFXO0lBQ1gsVUFBVTtJQUNWLFFBQVE7SUFDUixjQUFjO0lBQ2QsV0FBVztJQUNYLGFBQWE7Q0FDVCxDQUFDO0FBRVQsZUFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXG4vKipcbiAqIEFrYXNoYVJlbmRlclxuICogQG1vZHVsZSBha2FzaGFyZW5kZXJcbiAqL1xuXG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuLy8gY29uc3Qgb2VtYmV0dGVyID0gcmVxdWlyZSgnb2VtYmV0dGVyJykoKTtcbmltcG9ydCBSU1MgZnJvbSAncnNzJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgeyBEaXJzV2F0Y2hlciwgVlBhdGhEYXRhLCBkaXJUb1dhdGNoLCBtaW1lZGVmaW5lIH0gZnJvbSAnQGFrYXNoYWNtcy9zdGFja2VkLWRpcnMnO1xuaW1wb3J0ICogYXMgUmVuZGVyZXJzIGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmV4cG9ydCAqIGFzIFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQgeyBSZW5kZXJlciB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmV4cG9ydCB7IFJlbmRlcmVyIH0gZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0ICogYXMgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5leHBvcnQgKiBhcyBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSAnY2hlZXJpbyc7XG5pbXBvcnQgbWFoYVBhcnRpYWwgZnJvbSAnbWFoYWJodXRhL21haGEvcGFydGlhbC5qcyc7XG5cbmV4cG9ydCAqIGZyb20gJy4vbWFoYWZ1bmNzLmpzJztcblxuaW1wb3J0ICogYXMgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuZXhwb3J0ICogYXMgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuXG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5leHBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5cbmltcG9ydCB7IHJlbmRlciwgcmVuZGVyRG9jdW1lbnQsIHJlbmRlckNvbnRlbnQgfSBmcm9tICcuL3JlbmRlci5qcyc7XG5leHBvcnQgeyByZW5kZXIsIHJlbmRlckRvY3VtZW50LCByZW5kZXJDb250ZW50IH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuXG5jb25zdCBfX2ZpbGVuYW1lID0gaW1wb3J0Lm1ldGEuZmlsZW5hbWU7XG5jb25zdCBfX2Rpcm5hbWUgPSBpbXBvcnQubWV0YS5kaXJuYW1lO1xuXG4vLyBGb3IgdXNlIGluIENvbmZpZ3VyZS5wcmVwYXJlXG5pbXBvcnQgeyBCdWlsdEluUGx1Z2luIH0gZnJvbSAnLi9idWlsdC1pbi5qcyc7XG5cbmltcG9ydCAqIGFzIGZpbGVjYWNoZSBmcm9tICcuL2NhY2hlL2NhY2hlLXNxbGl0ZS5qcyc7XG5pbXBvcnQgeyBzcWRiIH0gZnJvbSAnLi9zcWRiLmpzJztcblxuZXhwb3J0IHsgbmV3U1EzRGF0YVN0b3JlIH0gZnJvbSAnLi9zcWRiLmpzJztcblxuLy8gVGhlcmUgZG9lc24ndCBzZWVtIHRvIGJlIGFuIG9mZmljaWFsIE1JTUUgdHlwZSByZWdpc3RlcmVkXG4vLyBmb3IgQXNjaWlEb2N0b3Jcbi8vIHBlcjogaHR0cHM6Ly9hc2NpaWRvY3Rvci5vcmcvZG9jcy9mYXEvXG4vLyBwZXI6IGh0dHBzOi8vZ2l0aHViLmNvbS9hc2NpaWRvY3Rvci9hc2NpaWRvY3Rvci9pc3N1ZXMvMjUwMlxuLy9cbi8vIEFzIG9mIE5vdmVtYmVyIDYsIDIwMjIsIHRoZSBBc2NpaURvY3RvciBGQVEgc2FpZCB0aGV5IGFyZVxuLy8gaW4gdGhlIHByb2Nlc3Mgb2YgcmVnaXN0ZXJpbmcgYSBNSU1FIHR5cGUgZm9yIGB0ZXh0L2FzY2lpZG9jYC5cbi8vIFRoZSBNSU1FIHR5cGUgd2Ugc3VwcGx5IGhhcyBiZWVuIHVwZGF0ZWQuXG4vL1xuLy8gVGhpcyBhbHNvIHNlZW1zIHRvIGJlIHRydWUgZm9yIHRoZSBvdGhlciBmaWxlIHR5cGVzLiAgV2UndmUgbWFkZSB1cFxuLy8gc29tZSBNSU1FIHR5cGVzIHRvIGdvIHdpdGggZWFjaC5cbi8vXG4vLyBUaGUgTUlNRSBwYWNrYWdlIGhhZCBwcmV2aW91c2x5IGJlZW4gaW5zdGFsbGVkIHdpdGggQWthc2hhUmVuZGVyLlxuLy8gQnV0LCBpdCBzZWVtcyB0byBub3QgYmUgdXNlZCwgYW5kIGluc3RlYWQgd2UgY29tcHV0ZSB0aGUgTUlNRSB0eXBlXG4vLyBmb3IgZmlsZXMgaW4gU3RhY2tlZCBEaXJlY3Rvcmllcy5cbi8vXG4vLyBUaGUgcmVxdWlyZWQgdGFzayBpcyB0byByZWdpc3RlciBzb21lIE1JTUUgdHlwZXMgd2l0aCB0aGVcbi8vIE1JTUUgcGFja2FnZS4gIEl0IGlzbid0IGFwcHJvcHJpYXRlIHRvIGRvIHRoaXMgaW5cbi8vIHRoZSBTdGFja2VkIERpcmVjdG9yaWVzIHBhY2thZ2UuICBJbnN0ZWFkIHRoYXQncyBsZWZ0XG4vLyBmb3IgY29kZSB3aGljaCB1c2VzIFN0YWNrZWQgRGlyZWN0b3JpZXMgdG8gZGV0ZXJtaW5lIHdoaWNoXG4vLyAoaWYgYW55KSBhZGRlZCBNSU1FIHR5cGVzIGFyZSByZXF1aXJlZC4gIEVyZ28sIEFrYXNoYVJlbmRlclxuLy8gbmVlZHMgdG8gcmVnaXN0ZXIgdGhlIE1JTUUgdHlwZXMgaXQgaXMgaW50ZXJlc3RlZCBpbi5cbi8vIFRoYXQncyB3aGF0IGlzIGhhcHBlbmluZyBoZXJlLlxuLy9cbi8vIFRoZXJlJ3MgYSB0aG91Z2h0IHRoYXQgdGhpcyBzaG91bGQgYmUgaGFuZGxlZCBpbiB0aGUgUmVuZGVyZXJcbi8vIGltcGxlbWVudGF0aW9ucy4gIEJ1dCBpdCdzIG5vdCBjZXJ0YWluIHRoYXQncyBjb3JyZWN0LlxuLy9cbi8vIE5vdyB0aGF0IHRoZSBSZW5kZXJlcnMgYXJlIGluIGBAYWthc2hhY21zL3JlbmRlcmVyc2Agc2hvdWxkXG4vLyB0aGVzZSBkZWZpbml0aW9ucyBtb3ZlIHRvIHRoYXQgcGFja2FnZT9cblxubWltZWRlZmluZSh7J3RleHQvYXNjaWlkb2MnOiBbICdhZG9jJywgJ2FzY2lpZG9jJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LW1hcmtkb2MnOiBbICdtYXJrZG9jJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LWVqcyc6IFsgJ2VqcyddfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LW51bmp1Y2tzJzogWyAnbmprJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LWhhbmRsZWJhcnMnOiBbICdoYW5kbGViYXJzJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LWxpcXVpZCc6IFsgJ2xpcXVpZCcgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC10ZW1wdXJhJzogWyAndGVtcHVyYScgXX0pO1xuXG4vKipcbiAqIFBlcmZvcm1zIHNldHVwIG9mIHRoaW5ncyBzbyB0aGF0IEFrYXNoYVJlbmRlciBjYW4gZnVuY3Rpb24uXG4gKiBUaGUgY29ycmVjdCBpbml0aWFsaXphdGlvbiBvZiBBa2FzaGFSZW5kZXIgaXMgdG9cbiAqIDEuIEdlbmVyYXRlIHRoZSBDb25maWd1cmF0aW9uIG9iamVjdFxuICogMi4gQ2FsbCBjb25maWcucHJlcGFyZVxuICogMy4gQ2FsbCBha2FzaGFyZW5kZXIuc2V0dXBcbiAqIFxuICogVGhpcyBmdW5jdGlvbiBlbnN1cmVzIGFsbCBvYmplY3RzIHRoYXQgaW5pdGlhbGl6ZSBhc3luY2hyb25vdXNseVxuICogYXJlIGNvcnJlY3RseSBzZXR1cC5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChjb25maWcpIHtcblxuICAgIGNvbmZpZy5yZW5kZXJlcnMucGFydGlhbEZ1bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjYWxsaW5nIHBhcnRpYWwgJHtmbmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgY29uZmlnLnJlbmRlcmVycy5wYXJ0aWFsU3luY0Z1bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjYWxsaW5nIHBhcnRpYWxTeW5jICR7Zm5hbWV9YCk7XG4gICAgICAgIHJldHVybiBwYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfVxuXG4gICAgYXdhaXQgY2FjaGVTZXR1cChjb25maWcpO1xuICAgIGF3YWl0IGZpbGVDYWNoZXNSZWFkeShjb25maWcpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVTZXR1cChjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBmaWxlY2FjaGUuc2V0dXAoY29uZmlnLCBhd2FpdCBzcWRiKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgSU5JVElBTElaQVRJT04gRkFJTFVSRSBDT1VMRCBOT1QgSU5JVElBTElaRSBDQUNIRSBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VDYWNoZXMoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmlsZWNhY2hlLmNsb3NlRmlsZUNhY2hlcygpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBDTE9TRSBDQUNIRVMgYCwgZXJyKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbGVDYWNoZXNSZWFkeShjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLmFzc2V0c0NhY2hlLmlzUmVhZHkoKSxcbiAgICAgICAgICAgIGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuaXNSZWFkeSgpXG4gICAgICAgIF0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBJTklUSUFMSVpFIENBQ0hFIFNZU1RFTSBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyUGF0aChjb25maWcsIHBhdGgycikge1xuICAgIGNvbnN0IGRvY3VtZW50cyA9IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICBsZXQgZm91bmQ7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICB3aGlsZSAoY291bnQgPCAyMCkge1xuICAgICAgICAvKiBXaGF0J3MgaGFwcGVuaW5nIGlzIHRoaXMgbWlnaHQgYmUgY2FsbGVkIGZyb20gY2xpLmpzXG4gICAgICAgICAqIGluIHJlbmRlci1kb2N1bWVudCwgYW5kIHdlIG1pZ2h0IGJlIGFza2VkIHRvIHJlbmRlciB0aGVcbiAgICAgICAgICogbGFzdCBkb2N1bWVudCB0aGF0IHdpbGwgYmUgQUREJ2QgdG8gdGhlIEZpbGVDYWNoZS5cbiAgICAgICAgICpcbiAgICAgICAgICogSW4gc3VjaCBhIGNhc2UgPGNvZGU+aXNSZWFkeTwvY29kZT4gbWlnaHQgcmV0dXJuIDxjb2RlPnRydWU8L2NvZGU+XG4gICAgICAgICAqIGJ1dCBub3QgYWxsIGZpbGVzIHdpbGwgaGF2ZSBiZWVuIEFERCdkIHRvIHRoZSBGaWxlQ2FjaGUuXG4gICAgICAgICAqIEluIHRoYXQgY2FzZSA8Y29kZT5kb2N1bWVudHMuZmluZDwvY29kZT4gcmV0dXJuc1xuICAgICAgICAgKiA8Y29kZT51bmRlZmluZWQ8L2NvZGU+XG4gICAgICAgICAqXG4gICAgICAgICAqIFdoYXQgdGhpcyBkb2VzIGlzIHRyeSB1cCB0byAyMCB0aW1lcyB0byBsb2FkIHRoZSBkb2N1bWVudCxcbiAgICAgICAgICogc2xlZXBpbmcgZm9yIDEwMCBtaWxsaXNlY29uZHMgZWFjaCB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2xlYW5lciBhbHRlcm5hdGl2ZSB3b3VsZCBiZSB0byB3YWl0IGZvciBub3Qgb25seVxuICAgICAgICAgKiB0aGUgPGNvZGU+cmVhZHk8L2NvZGU+IGZyb20gdGhlIDxjb2RlPmRvY3VtZW50czwvY29kZT4gRmlsZUNhY2hlLFxuICAgICAgICAgKiBidXQgYWxzbyBmb3IgYWxsIHRoZSBpbml0aWFsIEFERCBldmVudHMgdG8gYmUgaGFuZGxlZC4gIEJ1dFxuICAgICAgICAgKiB0aGF0IHNlY29uZCBjb25kaXRpb24gc2VlbXMgZGlmZmljdWx0IHRvIGRldGVjdCByZWxpYWJseS5cbiAgICAgICAgICovXG4gICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aDJyKTtcbiAgICAgICAgaWYgKGZvdW5kKSBicmVhaztcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlclBhdGggJHtwYXRoMnJ9YCwgZm91bmQpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEaWQgbm90IGZpbmQgZG9jdW1lbnQgZm9yICR7cGF0aDJyfWApO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVuZGVyRG9jdW1lbnQoY29uZmlnLCBmb3VuZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZWFkcyBhIGZpbGUgZnJvbSB0aGUgcmVuZGVyaW5nIGRpcmVjdG9yeS4gIEl0IGlzIHByaW1hcmlseSB0byBiZVxuICogdXNlZCBpbiB0ZXN0IGNhc2VzLCB3aGVyZSB3ZSdsbCBydW4gYSBidWlsZCB0aGVuIHJlYWQgdGhlIGluZGl2aWR1YWxcbiAqIGZpbGVzIHRvIG1ha2Ugc3VyZSB0aGV5J3ZlIHJlbmRlcmVkIGNvcnJlY3RseS5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKiBAcGFyYW0geyp9IGZwYXRoIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkUmVuZGVyZWRGaWxlKGNvbmZpZywgZnBhdGgpIHtcblxuICAgIGxldCBodG1sID0gYXdhaXQgZnNwLnJlYWRGaWxlKHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIGZwYXRoKSwgJ3V0ZjgnKTtcbiAgICBsZXQgJCA9IGNvbmZpZy5tYWhhYmh1dGFDb25maWcgXG4gICAgICAgICAgICA/IGNoZWVyaW8ubG9hZChodG1sLCBjb25maWcubWFoYWJodXRhQ29uZmlnKSBcbiAgICAgICAgICAgIDogY2hlZXJpby5sb2FkKGh0bWwpO1xuXG4gICAgcmV0dXJuIHsgaHRtbCwgJCB9O1xufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBwYXJ0aWFsIHRlbXBsYXRlIHVzaW5nIHRoZSBzdXBwbGllZCBtZXRhZGF0YS4gIFRoaXMgdmVyc2lvblxuICogYWxsb3dzIGZvciBhc3luY2hyb25vdXMgZXhlY3V0aW9uLCBhbmQgZXZlcnkgYml0IG9mIGNvZGUgaXRcbiAqIGV4ZWN1dGVzIGlzIGFsbG93ZWQgdG8gYmUgYXN5bmMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICogQHBhcmFtIHsqfSBmbmFtZSBQYXRoIHdpdGhpbiB0aGUgZmlsZWNhY2hlLnBhcnRpYWxzIGNhY2hlXG4gKiBAcGFyYW0geyp9IG1ldGFkYXRhIE9iamVjdCBjb250YWluaW5nIG1ldGFkYXRhXG4gKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBzdHJpbmcgY29udGFpbmluZyB0aGUgcmVuZGVyZWQgc3R1ZmZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpIHtcblxuICAgIGlmICghZm5hbWUgfHwgdHlwZW9mIGZuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHBhcnRpYWwgZm5hbWUgbm90IGEgc3RyaW5nICR7dXRpbC5pbnNwZWN0KGZuYW1lKX1gKTtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCAke2ZuYW1lfWApO1xuICAgIGNvbnN0IGZvdW5kID0gYXdhaXQgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuZmluZChmbmFtZSk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHBhcnRpYWwgZm91bmQgZm9yICR7Zm5hbWV9IGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5wYXJ0aWFsc0RpcnMpfWApO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCAke2ZuYW1lfSA9PT4gJHtmb3VuZC52cGF0aH0gJHtmb3VuZC5mc3BhdGh9YCk7XG4gICAgXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsIGFib3V0IHRvIHJlbmRlciAke3V0aWwuaW5zcGVjdChmb3VuZC52cGF0aCl9YCk7XG4gICAgICAgIGxldCBwYXJ0aWFsVGV4dDtcbiAgICAgICAgaWYgKGZvdW5kLmRvY0JvZHkpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQm9keTtcbiAgICAgICAgZWxzZSBpZiAoZm91bmQuZG9jQm9keSkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NCb2R5O1xuICAgICAgICBlbHNlIHBhcnRpYWxUZXh0ID0gYXdhaXQgZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcblxuICAgICAgICAvLyBTb21lIHJlbmRlcmVycyAoTnVuanVrcykgcmVxdWlyZSB0aGF0IG1ldGFkYXRhLmNvbmZpZ1xuICAgICAgICAvLyBwb2ludCB0byB0aGUgY29uZmlnIG9iamVjdC4gIFRoaXMgYmxvY2sgb2YgY29kZVxuICAgICAgICAvLyBkdXBsaWNhdGVzIHRoZSBtZXRhZGF0YSBvYmplY3QsIHRoZW4gc2V0cyB0aGVcbiAgICAgICAgLy8gY29uZmlnIGZpZWxkIGluIHRoZSBkdXBsaWNhdGUsIHBhc3NpbmcgdGhhdCB0byB0aGUgcGFydGlhbC5cbiAgICAgICAgbGV0IG1kYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgbGV0IHByb3A7XG5cbiAgICAgICAgZm9yIChwcm9wIGluIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICBtZGF0YVtwcm9wXSA9IG1ldGFkYXRhW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIG1kYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgbWRhdGEucGFydGlhbFN5bmMgPSBwYXJ0aWFsU3luYy5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICBtZGF0YS5wYXJ0aWFsICAgICA9IHBhcnRpYWwuYmluZChyZW5kZXJlciwgY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwtZnVuY3MgcmVuZGVyICR7cmVuZGVyZXIubmFtZX0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyLnJlbmRlcih7XG4gICAgICAgICAgICBmc3BhdGg6IGZvdW5kLmZzcGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IHBhcnRpYWxUZXh0LFxuICAgICAgICAgICAgbWV0YWRhdGE6IG1kYXRhXG4gICAgICAgICAgICAvLyBwYXJ0aWFsVGV4dCwgbWRhdGEsIGZvdW5kXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZm91bmQudnBhdGguZW5kc1dpdGgoJy5odG1sJykgfHwgZm91bmQudnBhdGguZW5kc1dpdGgoJy54aHRtbCcpKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsIHJlYWRpbmcgZmlsZSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlbmRlclBhcnRpYWwgbm8gUmVuZGVyZXIgZm91bmQgZm9yICR7Zm5hbWV9IC0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICB9XG59XG5cbi8qKlxuICogUmVuZGVycyBhIHBhcnRpYWwgdGVtcGxhdGUgdXNpbmcgdGhlIHN1cHBsaWVkIG1ldGFkYXRhLiAgVGhpcyB2ZXJzaW9uXG4gKiBhbGxvd3MgZm9yIHN5bmNocm9ub3VzIGV4ZWN1dGlvbiwgYW5kIGV2ZXJ5IGJpdCBvZiBjb2RlIGl0XG4gKiBleGVjdXRlcyBpcyBzeW5jaHJvbm91cyBmdW5jdGlvbnMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICogQHBhcmFtIHsqfSBmbmFtZSBQYXRoIHdpdGhpbiB0aGUgZmlsZWNhY2hlLnBhcnRpYWxzIGNhY2hlXG4gKiBAcGFyYW0geyp9IG1ldGFkYXRhIE9iamVjdCBjb250YWluaW5nIG1ldGFkYXRhXG4gKiBAcmV0dXJucyBTdHJpbmcgY29udGFpbmluZyB0aGUgcmVuZGVyZWQgc3R1ZmZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKSB7XG5cbiAgICBpZiAoIWZuYW1lIHx8IHR5cGVvZiBmbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBwYXJ0aWFsU3luYyBmbmFtZSBub3QgYSBzdHJpbmcgJHt1dGlsLmluc3BlY3QoZm5hbWUpfWApO1xuICAgIH1cblxuICAgIGNvbnN0IGZvdW5kID0gZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuZmluZFN5bmMoZm5hbWUpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBwYXJ0aWFsIGZvdW5kIGZvciAke2ZuYW1lfSBpbiAke3V0aWwuaW5zcGVjdChjb25maWcucGFydGlhbHNEaXJzKX1gKTtcbiAgICB9XG5cbiAgICB2YXIgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgIC8vIFNvbWUgcmVuZGVyZXJzIChOdW5qdWtzKSByZXF1aXJlIHRoYXQgbWV0YWRhdGEuY29uZmlnXG4gICAgICAgIC8vIHBvaW50IHRvIHRoZSBjb25maWcgb2JqZWN0LiAgVGhpcyBibG9jayBvZiBjb2RlXG4gICAgICAgIC8vIGR1cGxpY2F0ZXMgdGhlIG1ldGFkYXRhIG9iamVjdCwgdGhlbiBzZXRzIHRoZVxuICAgICAgICAvLyBjb25maWcgZmllbGQgaW4gdGhlIGR1cGxpY2F0ZSwgcGFzc2luZyB0aGF0IHRvIHRoZSBwYXJ0aWFsLlxuICAgICAgICBsZXQgbWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBsZXQgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gbWV0YWRhdGEpIHtcbiAgICAgICAgICAgIG1kYXRhW3Byb3BdID0gbWV0YWRhdGFbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgbWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICAvLyBJbiB0aGlzIGNvbnRleHQsIHBhcnRpYWxTeW5jIGlzIGRpcmVjdGx5IGF2YWlsYWJsZVxuICAgICAgICAvLyBhcyBhIGZ1bmN0aW9uIHRoYXQgd2UgY2FuIGRpcmVjdGx5IHVzZS5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWxTeW5jIGAsIHBhcnRpYWxTeW5jKTtcbiAgICAgICAgbWRhdGEucGFydGlhbFN5bmMgPSBwYXJ0aWFsU3luYy5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICAvLyBmb3IgZmluZFN5bmMsIHRoZSBcImZvdW5kXCIgb2JqZWN0IGlzIFZQYXRoRGF0YSB3aGljaFxuICAgICAgICAvLyBkb2VzIG5vdCBoYXZlIGRvY0JvZHkgbm9yIGRvY0NvbnRlbnQuICBUaGVyZWZvcmUgd2VcbiAgICAgICAgLy8gbXVzdCByZWFkIHRoaXMgY29udGVudFxuICAgICAgICBsZXQgcGFydGlhbFRleHQgPSBmcy5yZWFkRmlsZVN5bmMoZm91bmQuZnNwYXRoLCAndXRmLTgnKTtcbiAgICAgICAgLy8gaWYgKGZvdW5kLmRvY0JvZHkpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQm9keTtcbiAgICAgICAgLy8gZWxzZSBpZiAoZm91bmQuZG9jQ29udGVudCkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NDb250ZW50O1xuICAgICAgICAvLyBlbHNlIHBhcnRpYWxUZXh0ID0gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsLWZ1bmNzIHJlbmRlclN5bmMgJHtyZW5kZXJlci5uYW1lfSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gcmVuZGVyZXIucmVuZGVyU3luYyg8UmVuZGVyZXJzLlJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBmb3VuZC5mc3BhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBwYXJ0aWFsVGV4dCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBtZGF0YVxuICAgICAgICAgICAgLy8gcGFydGlhbFRleHQsIG1kYXRhLCBmb3VuZFxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcuaHRtbCcpIHx8IGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcueGh0bWwnKSkge1xuICAgICAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlbmRlclBhcnRpYWwgbm8gUmVuZGVyZXIgZm91bmQgZm9yICR7Zm5hbWV9IC0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIGluZGV4Q2hhaW5JdGVtID0ge1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgdnBhdGg6IHN0cmluZztcbiAgICBmb3VuZFBhdGg6IHN0cmluZztcbiAgICBmb3VuZERpcjogc3RyaW5nO1xuICAgIGZpbGVuYW1lOiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIFN0YXJ0aW5nIGZyb20gYSB2aXJ0dWFsIHBhdGggaW4gdGhlIGRvY3VtZW50cywgc2VhcmNoZXMgdXB3YXJkcyB0b1xuICogdGhlIHJvb3Qgb2YgdGhlIGRvY3VtZW50cyBmaWxlLXNwYWNlLCBmaW5kaW5nIGZpbGVzIHRoYXQgXG4gKiByZW5kZXIgdG8gXCJpbmRleC5odG1sXCIuICBUaGUgXCJpbmRleC5odG1sXCIgZmlsZXMgYXJlIGluZGV4IGZpbGVzLFxuICogYXMgdGhlIG5hbWUgc3VnZ2VzdHMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIFxuICogQHBhcmFtIHsqfSBmbmFtZSBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5kZXhDaGFpbihcbiAgICBjb25maWcsIGZuYW1lXG4pOiBQcm9taXNlPGluZGV4Q2hhaW5JdGVtW10+IHtcblxuICAgIC8vIFRoaXMgdXNlZCB0byBiZSBhIGZ1bGwgZnVuY3Rpb24gaGVyZSwgYnV0IGhhcyBtb3ZlZFxuICAgIC8vIGludG8gdGhlIEZpbGVDYWNoZSBjbGFzcy4gIFJlcXVpcmluZyBhIGBjb25maWdgIG9wdGlvblxuICAgIC8vIGlzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBmb3JtZXIgQVBJLlxuXG4gICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIHJldHVybiBkb2N1bWVudHMuaW5kZXhDaGFpbihmbmFtZSk7XG59XG5cblxuLyoqXG4gKiBNYW5pcHVsYXRlIHRoZSByZWw9IGF0dHJpYnV0ZXMgb24gYSBsaW5rIHJldHVybmVkIGZyb20gTWFoYWJodXRhLlxuICpcbiAqIEBwYXJhbXMgeyRsaW5rfSBUaGUgbGluayB0byBtYW5pcHVsYXRlXG4gKiBAcGFyYW1zIHthdHRyfSBUaGUgYXR0cmlidXRlIG5hbWVcbiAqIEBwYXJhbXMge2RvYXR0cn0gQm9vbGVhbiBmbGFnIHdoZXRoZXIgdG8gc2V0ICh0cnVlKSBvciByZW1vdmUgKGZhbHNlKSB0aGUgYXR0cmlidXRlXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlua1JlbFNldEF0dHIoJGxpbmssIGF0dHIsIGRvYXR0cikge1xuICAgIGxldCBsaW5rcmVsID0gJGxpbmsuYXR0cigncmVsJyk7XG4gICAgbGV0IHJlbHMgPSBsaW5rcmVsID8gbGlua3JlbC5zcGxpdCgnICcpIDogW107XG4gICAgbGV0IGhhc2F0dHIgPSByZWxzLmluZGV4T2YoYXR0cikgPj0gMDtcbiAgICBpZiAoIWhhc2F0dHIgJiYgZG9hdHRyKSB7XG4gICAgICAgIHJlbHMudW5zaGlmdChhdHRyKTtcbiAgICAgICAgJGxpbmsuYXR0cigncmVsJywgcmVscy5qb2luKCcgJykpO1xuICAgIH0gZWxzZSBpZiAoaGFzYXR0ciAmJiAhZG9hdHRyKSB7XG4gICAgICAgIHJlbHMuc3BsaWNlKHJlbHMuaW5kZXhPZihhdHRyKSk7XG4gICAgICAgICRsaW5rLmF0dHIoJ3JlbCcsIHJlbHMuam9pbignICcpKTtcbiAgICB9XG59O1xuXG4vLy8vLy8vLy8vLy8vLy8vLyBSU1MgRmVlZCBHZW5lcmF0aW9uXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVJTUyhjb25maWcsIGNvbmZpZ3JzcywgZmVlZERhdGEsIGl0ZW1zLCByZW5kZXJUbykge1xuXG4gICAgLy8gU3VwcG9zZWRseSBpdCdzIHJlcXVpcmVkIHRvIHVzZSBoYXNPd25Qcm9wZXJ0eVxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNzI4MzYwL2hvdy1kby1pLWNvcnJlY3RseS1jbG9uZS1hLWphdmFzY3JpcHQtb2JqZWN0IzcyODY5NFxuICAgIC8vXG4gICAgLy8gQnV0LCBpbiBvdXIgY2FzZSB0aGF0IHJlc3VsdGVkIGluIGFuIGVtcHR5IG9iamVjdFxuXG4gICAgLy8gY29uc29sZS5sb2coJ2NvbmZpZ3JzcyAnKyB1dGlsLmluc3BlY3QoY29uZmlncnNzKSk7XG5cbiAgICAvLyBDb25zdHJ1Y3QgaW5pdGlhbCByc3Mgb2JqZWN0XG4gICAgdmFyIHJzcyA9IHt9O1xuICAgIGZvciAobGV0IGtleSBpbiBjb25maWdyc3MucnNzKSB7XG4gICAgICAgIC8vaWYgKGNvbmZpZ3Jzcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICByc3Nba2V5XSA9IGNvbmZpZ3Jzcy5yc3Nba2V5XTtcbiAgICAgICAgLy99XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coJ3JzcyAnKyB1dGlsLmluc3BlY3QocnNzKSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZygnZmVlZERhdGEgJysgdXRpbC5pbnNwZWN0KGZlZWREYXRhKSk7XG5cbiAgICAvLyBUaGVuIGZpbGwgaW4gZnJvbSBmZWVkRGF0YVxuICAgIGZvciAobGV0IGtleSBpbiBmZWVkRGF0YSkge1xuICAgICAgICAvL2lmIChmZWVkRGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICByc3Nba2V5XSA9IGZlZWREYXRhW2tleV07XG4gICAgICAgIC8vfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKCdnZW5lcmF0ZVJTUyByc3MgJysgdXRpbC5pbnNwZWN0KHJzcykpO1xuXG4gICAgdmFyIHJzc2ZlZWQgPSBuZXcgUlNTKHJzcyk7XG5cbiAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHsgcnNzZmVlZC5pdGVtKGl0ZW0pOyB9KTtcblxuICAgIHZhciB4bWwgPSByc3NmZWVkLnhtbCgpO1xuICAgIHZhciByZW5kZXJPdXQgPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCByZW5kZXJUbyk7XG5cbiAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlck91dCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pXG4gICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJPdXQsIHhtbCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuXG59O1xuXG4vLyBGb3Igb0VtYmVkLCBDb25zaWRlciBtYWtpbmcgYW4gZXh0ZXJuYWwgcGx1Z2luXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9vZW1iZWQtYWxsXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9lbWJlZGFibGVcbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL21lZGlhLXBhcnNlclxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvb2VtYmV0dGVyXG5cblxuLyoqXG4gKiBUaGUgQWthc2hhUmVuZGVyIHByb2plY3QgY29uZmlndXJhdGlvbiBvYmplY3QuICBcbiAqIE9uZSBpbnN0YW50aWF0ZXMgYSBDb25maWd1cmF0aW9uIG9iamVjdCwgdGhlbiBmaWxscyBpdFxuICogd2l0aCBzZXR0aW5ncyBhbmQgcGx1Z2lucy5cbiAqIFxuICogQHNlZSBtb2R1bGU6Q29uZmlndXJhdGlvblxuICovXG5cbi8vIGNvbnN0IF9jb25maWdfcGx1Z2luRGF0YSA9IFN5bWJvbCgncGx1Z2luRGF0YScpO1xuLy8gY29uc3QgX2NvbmZpZ19hc3NldHNEaXJzID0gU3ltYm9sKCdhc3NldHNEaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX2RvY3VtZW50RGlycyA9IFN5bWJvbCgnZG9jdW1lbnREaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX2xheW91dERpcnMgPSBTeW1ib2woJ2xheW91dERpcnMnKTtcbi8vIGNvbnN0IF9jb25maWdfcGFydGlhbERpcnMgPSBTeW1ib2woJ3BhcnRpYWxEaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX21haGFmdW5jcyA9IFN5bWJvbCgnbWFoYWZ1bmNzJyk7XG4vLyBjb25zdCBfY29uZmlnX3JlbmRlclRvID0gU3ltYm9sKCdyZW5kZXJUbycpO1xuLy8gY29uc3QgX2NvbmZpZ19tZXRhZGF0YSA9IFN5bWJvbCgnbWV0YWRhdGEnKTtcbi8vIGNvbnN0IF9jb25maWdfcm9vdF91cmwgPSBTeW1ib2woJ3Jvb3RfdXJsJyk7XG4vLyBjb25zdCBfY29uZmlnX3NjcmlwdHMgPSBTeW1ib2woJ3NjcmlwdHMnKTtcbi8vIGNvbnN0IF9jb25maWdfcGx1Z2lucyA9IFN5bWJvbCgncGx1Z2lucycpO1xuLy8gY29uc3QgX2NvbmZpZ19jaGVlcmlvID0gU3ltYm9sKCdjaGVlcmlvJyk7XG4vLyBjb25zdCBfY29uZmlnX2NvbmZpZ2RpciA9IFN5bWJvbCgnY29uZmlnZGlyJyk7XG4vLyBjb25zdCBfY29uZmlnX2NhY2hlZGlyICA9IFN5bWJvbCgnY2FjaGVkaXInKTtcbi8vIGNvbnN0IF9jb25maWdfY29uY3VycmVuY3kgPSBTeW1ib2woJ2NvbmN1cnJlbmN5Jyk7XG4vLyBjb25zdCBfY29uZmlnX3JlbmRlcmVycyA9IFN5bWJvbCgncmVuZGVyZXJzJyk7XG5cbi8qKlxuICogRGF0YSB0eXBlIGRlc2NyaWJpbmcgaXRlbXMgaW4gdGhlXG4gKiBqYXZhU2NyaXB0VG9wIGFuZCBqYXZhU2NyaXB0Qm90dG9tIGFycmF5cy5cbiAqIFRoZSBmaWVsZHMgY29ycmVzcG9uZCB0byB0aGUgYXR0cmlidXRlc1xuICogb2YgdGhlIDxzY3JpcHQ+IHRhZyB3aGljaCBjYW4gYmUgdXNlZFxuICogZWl0aGVyIGluIHRoZSB0b3Agb3IgYm90dG9tIG9mXG4gKiBhbiBIVE1MIGZpbGUuXG4gKi9cbmV4cG9ydCB0eXBlIGphdmFTY3JpcHRJdGVtID0ge1xuICAgIGhyZWY/OiBzdHJpbmcsXG4gICAgc2NyaXB0Pzogc3RyaW5nLFxuICAgIGxhbmc/OiBzdHJpbmdcbn07XG5cbmV4cG9ydCB0eXBlIHN0eWxlc2hlZXRJdGVtID0ge1xuICAgIGhyZWY/OiBzdHJpbmcsXG4gICAgbWVkaWE/OiBzdHJpbmdcblxufTtcblxuLyoqXG4gKiBEZWZpbmVzIHRoZSBzdHJ1Y3R1cmUgZm9yIGRpcmVjdG9yeVxuICogbW91bnQgc3BlY2lmaWNhdGlvbiBpbiB0aGUgQ29uZmlndXJhdGlvbi5cbiAqIFxuICogVGhlIHNpbXBsZSAnc3RyaW5nJyBmb3JtIHNheXMgdG8gbW91bnRcbiAqIHRoZSBuYW1lZCBmc3BhdGggb24gdGhlIHJvb3Qgb2YgdGhlXG4gKiB2aXJ0dWFsIGZpbGVzcGFjZS5cbiAqIFxuICogVGhlIG9iamVjdCBmb3JtIGFsbG93cyB1cyB0byBtb3VudFxuICogYW4gZnNwYXRoIGludG8gYSBkaWZmZXJlbnQgbG9jYXRpb25cbiAqIGluIHRoZSB2aXJ0dWFsIGZpbGVzcGFjZSwgdG8gaWdub3JlXG4gKiBmaWxlcyBiYXNlZCBvbiBHTE9CIHBhdHRlcm5zLCBhbmQgdG9cbiAqIGluY2x1ZGUgbWV0YWRhdGEgZm9yIGV2ZXJ5IGZpbGUgaW5cbiAqIGEgZGlyZWN0b3J5IHRyZWUuXG4gKiBcbiAqIEluIHRoZSBmaWxlLWNhY2hlIG1vZHVsZSwgdGhpcyBpc1xuICogY29udmVydGVkIHRvIHRoZSBkaXJUb1dhdGNoIHN0cnVjdHVyZVxuICogdXNlZCBieSBTdGFja2VkRGlycy5cbiAqL1xuZXhwb3J0IHR5cGUgZGlyVG9Nb3VudCA9XG4gICAgc3RyaW5nXG4gICAgfCB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZnNwYXRoIHRvIG1vdW50XG4gICAgICAgICAqL1xuICAgICAgICBzcmM6IHN0cmluZyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHZpcnR1YWwgZmlsZXNwYWNlXG4gICAgICAgICAqIGxvY2F0aW9uXG4gICAgICAgICAqL1xuICAgICAgICBkZXN0OiBzdHJpbmcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFycmF5IG9mIEdMT0IgcGF0dGVybnNcbiAgICAgICAgICogb2YgZmlsZXMgdG8gaWdub3JlXG4gICAgICAgICAqL1xuICAgICAgICBpZ25vcmU/OiBzdHJpbmdbXSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQW4gb2JqZWN0IGNvbnRhaW5pbmdcbiAgICAgICAgICogbWV0YWRhdGEgdGhhdCdzIHRvXG4gICAgICAgICAqIGFwcGx5IHRvIGV2ZXJ5IGZpbGVcbiAgICAgICAgICovXG4gICAgICAgIGJhc2VNZXRhZGF0YT86IGFueVxuICAgIH07XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBvZiBhbiBBa2FzaGFSZW5kZXIgcHJvamVjdCwgaW5jbHVkaW5nIHRoZSBpbnB1dCBkaXJlY3RvcmllcyxcbiAqIG91dHB1dCBkaXJlY3RvcnksIHBsdWdpbnMsIGFuZCB2YXJpb3VzIHNldHRpbmdzLlxuICpcbiAqIFVTQUdFOlxuICpcbiAqIGNvbnN0IGFrYXNoYSA9IHJlcXVpcmUoJ2FrYXNoYXJlbmRlcicpO1xuICogY29uc3QgY29uZmlnID0gbmV3IGFrYXNoYS5Db25maWd1cmF0aW9uKCk7XG4gKi9cbmV4cG9ydCBjbGFzcyBDb25maWd1cmF0aW9uIHtcbiAgICAjcmVuZGVyZXJzOiBSZW5kZXJlcnMuQ29uZmlndXJhdGlvbjtcbiAgICAjY29uZmlnZGlyOiBzdHJpbmc7XG4gICAgI2NhY2hlZGlyOiBzdHJpbmc7XG4gICAgI2Fzc2V0c0RpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2xheW91dERpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2RvY3VtZW50RGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjcGFydGlhbERpcnM/OiBkaXJUb01vdW50W107XG4gICAgI21haGFmdW5jcztcbiAgICAjY2hlZXJpbz86IGNoZWVyaW8uQ2hlZXJpb09wdGlvbnM7XG4gICAgI3JlbmRlclRvOiBzdHJpbmc7XG4gICAgI3NjcmlwdHM/OiB7XG4gICAgICAgIHN0eWxlc2hlZXRzPzogc3R5bGVzaGVldEl0ZW1bXSxcbiAgICAgICAgamF2YVNjcmlwdFRvcD86IGphdmFTY3JpcHRJdGVtW10sXG4gICAgICAgIGphdmFTY3JpcHRCb3R0b20/OiBqYXZhU2NyaXB0SXRlbVtdXG4gICAgfTtcbiAgICAjY29uY3VycmVuY3k6IG51bWJlcjtcbiAgICAjY2FjaGluZ1RpbWVvdXQ6IG51bWJlcjtcbiAgICAjbWV0YWRhdGE6IGFueTtcbiAgICAjcm9vdF91cmw6IHN0cmluZztcbiAgICAjcGx1Z2lucztcbiAgICAjcGx1Z2luRGF0YTtcbiAgICBcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGVwYXRoKSB7XG5cbiAgICAgICAgLy8gdGhpc1tfY29uZmlnX3JlbmRlcmVyc10gPSBbXTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzID0gbmV3IFJlbmRlcmVycy5Db25maWd1cmF0aW9uKHtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MgPSBbXTtcbiAgICAgICAgdGhpcy4jc2NyaXB0cyA9IHtcbiAgICAgICAgICAgIHN0eWxlc2hlZXRzOiBbXSxcbiAgICAgICAgICAgIGphdmFTY3JpcHRUb3A6IFtdLFxuICAgICAgICAgICAgamF2YVNjcmlwdEJvdHRvbTogW11cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLiNjb25jdXJyZW5jeSA9IDM7XG4gICAgICAgIC8vIDYwIHNlY29uZHMsIG9yIDEgbWludXRlXG4gICAgICAgIHRoaXMuI2NhY2hpbmdUaW1lb3V0ID0gNjAwMDA7XG5cbiAgICAgICAgdGhpcy4jZG9jdW1lbnREaXJzID0gW107XG4gICAgICAgIHRoaXMuI2xheW91dERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jcGFydGlhbERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jYXNzZXRzRGlycyA9IFtdO1xuXG4gICAgICAgIHRoaXMuI21haGFmdW5jcyA9IFtdO1xuXG4gICAgICAgIHRoaXMuI3JlbmRlclRvID0gJ291dCc7XG5cbiAgICAgICAgdGhpcy4jbWV0YWRhdGEgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgdGhpcy4jcGx1Z2lucyA9IFtdO1xuICAgICAgICB0aGlzLiNwbHVnaW5EYXRhID0gW107XG5cbiAgICAgICAgLypcbiAgICAgICAgICogSXMgdGhpcyB0aGUgYmVzdCBwbGFjZSBmb3IgdGhpcz8gIEl0IGlzIG5lY2Vzc2FyeSB0b1xuICAgICAgICAgKiBjYWxsIHRoaXMgZnVuY3Rpb24gc29tZXdoZXJlLiAgVGhlIG5hdHVyZSBvZiB0aGlzIGZ1bmN0aW9uXG4gICAgICAgICAqIGlzIHRoYXQgaXQgY2FuIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyB3aXRoIG5vIGltcGFjdC4gIFxuICAgICAgICAgKiBCeSBiZWluZyBsb2NhdGVkIGhlcmUsIGl0IHdpbGwgYWx3YXlzIGJlIGNhbGxlZCBieSB0aGVcbiAgICAgICAgICogdGltZSBhbnkgQ29uZmlndXJhdGlvbiBpcyBnZW5lcmF0ZWQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUaGlzIGlzIGV4ZWN1dGVkIGluIEBha2FzaGFjbXMvcmVuZGVyZXJzXG4gICAgICAgIC8vIHRoaXNbX2NvbmZpZ19yZW5kZXJlcnNdLnJlZ2lzdGVyQnVpbHRJblJlbmRlcmVycygpO1xuXG4gICAgICAgIC8vIFByb3ZpZGUgYSBtZWNoYW5pc20gdG8gZWFzaWx5IHNwZWNpZnkgY29uZmlnRGlyXG4gICAgICAgIC8vIFRoZSBwYXRoIGluIGNvbmZpZ0RpciBtdXN0IGJlIHRoZSBwYXRoIG9mIHRoZSBjb25maWd1cmF0aW9uIGZpbGUuXG4gICAgICAgIC8vIFRoZXJlIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIGEgd2F5IHRvIGRldGVybWluZSB0aGF0IGZyb20gaGVyZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRm9yIGV4YW1wbGUgbW9kdWxlLnBhcmVudC5maWxlbmFtZSBpbiB0aGlzIGNhc2UgcG9pbnRzXG4gICAgICAgIC8vIHRvIGFrYXNoYXJlbmRlci9pbmRleC5qcyBiZWNhdXNlIHRoYXQncyB0aGUgbW9kdWxlIHdoaWNoXG4gICAgICAgIC8vIGxvYWRlZCB0aGlzIG1vZHVsZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gT25lIGNvdWxkIGltYWdpbmUgYSBkaWZmZXJlbnQgaW5pdGlhbGl6YXRpb24gcGF0dGVybi4gIEluc3RlYWRcbiAgICAgICAgLy8gb2YgYWthc2hhcmVuZGVyIHJlcXVpcmluZyBDb25maWd1cmF0aW9uLmpzLCB0aGF0IGZpbGUgY291bGQgYmVcbiAgICAgICAgLy8gcmVxdWlyZWQgYnkgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZS4gIEluIHN1Y2ggYSBjYXNlXG4gICAgICAgIC8vIG1vZHVsZS5wYXJlbnQuZmlsZW5hbWUgV09VTEQgaW5kaWNhdGUgdGhlIGZpbGVuYW1lIGZvciB0aGVcbiAgICAgICAgLy8gY29uZmlndXJhdGlvbiBmaWxlLCBhbmQgd291bGQgYmUgYSBzb3VyY2Ugb2Ygc2V0dGluZ1xuICAgICAgICAvLyB0aGUgY29uZmlnRGlyIHZhbHVlLlxuICAgICAgICBpZiAodHlwZW9mIG1vZHVsZXBhdGggIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZXBhdGggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnRGlyID0gcGF0aC5kaXJuYW1lKG1vZHVsZXBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVyeSBjYXJlZnVsbHkgYWRkIHRoZSA8cGFydGlhbD4gc3VwcG9ydCBmcm9tIE1haGFiaHV0YSBhcyB0aGVcbiAgICAgICAgLy8gdmVyeSBmaXJzdCB0aGluZyBzbyB0aGF0IGl0IGV4ZWN1dGVzIGJlZm9yZSBhbnl0aGluZyBlbHNlLlxuICAgICAgICBsZXQgY29uZmlnID0gdGhpcztcbiAgICAgICAgdGhpcy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZm5hbWUsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGRlZmF1bHQgY29uZmlndXJhdGlvbiB2YWx1ZXMgZm9yIGFueXRoaW5nIHdoaWNoIGhhcyBub3RcbiAgICAgKiBhbHJlYWR5IGJlZW4gY29uZmlndXJlZC4gIFNvbWUgYnVpbHQtaW4gZGVmYXVsdHMgaGF2ZSBiZWVuIGRlY2lkZWRcbiAgICAgKiBhaGVhZCBvZiB0aW1lLiAgRm9yIGVhY2ggY29uZmlndXJhdGlvbiBzZXR0aW5nLCBpZiBub3RoaW5nIGhhcyBiZWVuXG4gICAgICogZGVjbGFyZWQsIHRoZW4gdGhlIGRlZmF1bHQgaXMgc3Vic3RpdHV0ZWQuXG4gICAgICpcbiAgICAgKiBJdCBpcyBleHBlY3RlZCB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGxhc3QgaW4gdGhlIGNvbmZpZyBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBpbnN0YWxscyB0aGUgYGJ1aWx0LWluYCBwbHVnaW4uICBJdCBuZWVkcyB0byBiZSBsYXN0IG9uXG4gICAgICogdGhlIHBsdWdpbiBjaGFpbiBzbyB0aGF0IGl0cyBzdHlsZXNoZWV0cyBhbmQgcGFydGlhbHMgYW5kIHdoYXRub3RcbiAgICAgKiBjYW4gYmUgb3ZlcnJpZGRlbiBieSBvdGhlciBwbHVnaW5zLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgcHJlcGFyZSgpIHtcblxuICAgICAgICBjb25zdCBDT05GSUcgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IGNvbmZpZ0RpclBhdGggPSBmdW5jdGlvbihkaXJubSkge1xuICAgICAgICAgICAgbGV0IGNvbmZpZ1BhdGggPSBkaXJubTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgQ09ORklHLmNvbmZpZ0RpciAhPT0gJ3VuZGVmaW5lZCcgJiYgQ09ORklHLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnUGF0aCA9IHBhdGguam9pbihDT05GSUcuY29uZmlnRGlyLCBkaXJubSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29uZmlnUGF0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzdGF0O1xuXG4gICAgICAgIGNvbnN0IGNhY2hlRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdjYWNoZScpO1xuICAgICAgICBpZiAoIXRoaXMuI2NhY2hlZGlyKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjYWNoZURpcnNQYXRoKVxuICAgICAgICAgICAgICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoY2FjaGVEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhY2hlRGlyID0gJ2NhY2hlJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInY2FjaGUnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhjYWNoZURpcnNQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlRGlyID0gJ2NhY2hlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNjYWNoZWRpciAmJiAhZnMuZXhpc3RzU3luYyh0aGlzLiNjYWNoZWRpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLiNjYWNoZWRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldHNEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2Fzc2V0cycpO1xuICAgICAgICBpZiAoIXRoaXMuI2Fzc2V0c0RpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGFzc2V0c0RpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGFzc2V0c0RpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQXNzZXRzRGlyKCdhc3NldHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXlvdXRzRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdsYXlvdXRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jbGF5b3V0RGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobGF5b3V0c0RpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGxheW91dHNEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZExheW91dHNEaXIoJ2xheW91dHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJ0aWFsRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdwYXJ0aWFscycpO1xuICAgICAgICBpZiAoIW1haGFQYXJ0aWFsLmNvbmZpZ3VyYXRpb24ucGFydGlhbERpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhcnRpYWxEaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhwYXJ0aWFsRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRQYXJ0aWFsc0RpcigncGFydGlhbHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2N1bWVudERpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnZG9jdW1lbnRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jZG9jdW1lbnREaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhkb2N1bWVudERpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGRvY3VtZW50RGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGREb2N1bWVudHNEaXIoJ2RvY3VtZW50cycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidkb2N1bWVudHMnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vICdkb2N1bWVudERpcnMnIHNldHRpbmcsIGFuZCBubyAnZG9jdW1lbnRzJyBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZW5kZXJUb1BhdGggPSBjb25maWdEaXJQYXRoKCdvdXQnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNyZW5kZXJUbykgIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHJlbmRlclRvUGF0aClcbiAgICAgICAgICAgICAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKHJlbmRlclRvUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFJlbmRlckRlc3RpbmF0aW9uKCdvdXQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInb3V0JyBpcyBub3QgYSBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmMocmVuZGVyVG9QYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFJlbmRlckRlc3RpbmF0aW9uKCdvdXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNyZW5kZXJUbyAmJiAhZnMuZXhpc3RzU3luYyh0aGlzLiNyZW5kZXJUbykpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLiNyZW5kZXJUbywgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgYWthc2hhY21zLWJ1aWx0aW4gcGx1Z2luIG5lZWRzIHRvIGJlIGxhc3Qgb24gdGhlIGNoYWluIHNvIHRoYXRcbiAgICAgICAgLy8gaXRzIHBhcnRpYWxzIGV0YyBjYW4gYmUgZWFzaWx5IG92ZXJyaWRkZW4uICBUaGlzIGlzIHRoZSBtb3N0IGNvbnZlbmllbnRcbiAgICAgICAgLy8gcGxhY2UgdG8gZGVjbGFyZSB0aGF0IHBsdWdpbi5cbiAgICAgICAgLy9cblxuICAgICAgICAvLyBOb3JtYWxseSB3ZSdkIGRvIHJlcXVpcmUoJy4vYnVpbHQtaW4uanMnKS5cbiAgICAgICAgLy8gQnV0LCBpbiB0aGlzIGNvbnRleHQgdGhhdCBkb2Vzbid0IHdvcmsuXG4gICAgICAgIC8vIFdoYXQgd2UgZGlkIGlzIHRvIGltcG9ydCB0aGVcbiAgICAgICAgLy8gQnVpbHRJblBsdWdpbiBjbGFzcyBlYXJsaWVyIHNvIHRoYXRcbiAgICAgICAgLy8gaXQgY2FuIGJlIHVzZWQgaGVyZS5cbiAgICAgICAgdGhpcy51c2UoQnVpbHRJblBsdWdpbiwge1xuICAgICAgICAgICAgLy8gYnVpbHQtaW4gb3B0aW9ucyBpZiBhbnlcbiAgICAgICAgICAgIC8vIERvIG5vdCBuZWVkIHRoaXMgaGVyZSBhbnkgbG9uZ2VyIGJlY2F1c2UgaXQgaXMgaGFuZGxlZFxuICAgICAgICAgICAgLy8gaW4gdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgICAgICAgLy8gU2V0IHVwIHRoZSBNYWhhYmh1dGEgcGFydGlhbCB0YWcgc28gaXQgcmVuZGVycyB0aHJvdWdoIEFrYXNoYVJlbmRlclxuICAgICAgICAgICAgLy8gcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZm5hbWUsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHJlbmRlci5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjb3JkIHRoZSBjb25maWd1cmF0aW9uIGRpcmVjdG9yeSBzbyB0aGF0IHdlIGNhbiBjb3JyZWN0bHkgaW50ZXJwb2xhdGVcbiAgICAgKiB0aGUgcGF0aG5hbWVzIHdlJ3JlIHByb3ZpZGVkLlxuICAgICAqL1xuICAgIHNldCBjb25maWdEaXIoY2ZnZGlyOiBzdHJpbmcpIHsgdGhpcy4jY29uZmlnZGlyID0gY2ZnZGlyOyB9XG4gICAgZ2V0IGNvbmZpZ0RpcigpIHsgcmV0dXJuIHRoaXMuI2NvbmZpZ2RpcjsgfVxuXG4gICAgc2V0IGNhY2hlRGlyKGRpcm5tOiBzdHJpbmcpIHsgdGhpcy4jY2FjaGVkaXIgPSBkaXJubTsgfVxuICAgIGdldCBjYWNoZURpcigpIHsgcmV0dXJuIHRoaXMuI2NhY2hlZGlyOyB9XG5cbiAgICAvLyBzZXQgYWthc2hhKF9ha2FzaGEpICB7IHRoaXNbX2NvbmZpZ19ha2FzaGFdID0gX2FrYXNoYTsgfVxuICAgIGdldCBha2FzaGEoKSB7IHJldHVybiBtb2R1bGVfZXhwb3J0czsgfVxuXG4gICAgYXN5bmMgZG9jdW1lbnRzQ2FjaGUoKSB7IHJldHVybiBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7IH1cbiAgICBhc3luYyBhc3NldHNDYWNoZSgpICAgIHsgcmV0dXJuIGZpbGVjYWNoZS5hc3NldHNDYWNoZTsgfVxuICAgIGFzeW5jIGxheW91dHNDYWNoZSgpICAgeyByZXR1cm4gZmlsZWNhY2hlLmxheW91dHNDYWNoZTsgfVxuICAgIGFzeW5jIHBhcnRpYWxzQ2FjaGUoKSAgeyByZXR1cm4gZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGU7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgZG9jdW1lbnREaXJzIGNvbmZpZ3VyYXRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlyIFRoZSBwYXRobmFtZSB0byB1c2VcbiAgICAgKi9cbiAgICBhZGREb2N1bWVudHNEaXIoZGlyOiBkaXJUb01vdW50KSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpcikgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkaXIgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyLnNyYyA9IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYyk7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGREb2N1bWVudHNEaXIgLSBkaXJlY3RvcnkgdG8gbW91bnQgb2Ygd3JvbmcgdHlwZSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2RvY3VtZW50RGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGFkZERvY3VtZW50c0RpciAke3V0aWwuaW5zcGVjdChkaXIpfSA9PT4gJHt1dGlsLmluc3BlY3QodGhpc1tfY29uZmlnX2RvY3VtZW50RGlyc10pfWApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgZG9jdW1lbnREaXJzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jZG9jdW1lbnREaXJzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvb2sgdXAgdGhlIGRvY3VtZW50IGRpcmVjdG9yeSBpbmZvcm1hdGlvbiBmb3IgYSBnaXZlbiBkb2N1bWVudCBkaXJlY3RvcnkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRpcm5hbWUgVGhlIGRvY3VtZW50IGRpcmVjdG9yeSB0byBzZWFyY2ggZm9yXG4gICAgICovXG4gICAgZG9jdW1lbnREaXJJbmZvKGRpcm5hbWU6IHN0cmluZykge1xuICAgICAgICBmb3IgKHZhciBkb2NEaXIgb2YgdGhpcy5kb2N1bWVudERpcnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jRGlyID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGlmIChkb2NEaXIuc3JjID09PSBkaXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2NEaXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChkb2NEaXIgPT09IGRpcm5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jRGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBsYXlvdXREaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqL1xuICAgIGFkZExheW91dHNEaXIoZGlyOiBkaXJUb01vdW50KSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpcikgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkaXIgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyLnNyYyA9IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYyk7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGRMYXlvdXRzRGlyIC0gZGlyZWN0b3J5IHRvIG1vdW50IG9mIHdyb25nIHR5cGUgJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNsYXlvdXREaXJzLnB1c2goZGlyTW91bnQpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gYWRkTGF5b3V0c0RpciAke3V0aWwuaW5zcGVjdChkaXIpfSAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9IGxheW91dERpcnMgJHt1dGlsLmluc3BlY3QodGhpcy4jbGF5b3V0RGlycyl9IFJlbmRlcmVycyBsYXlvdXREaXJzICR7dXRpbC5pbnNwZWN0KHRoaXMuI3JlbmRlcmVycy5sYXlvdXREaXJzKX1gKTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLmFkZExheW91dERpcihkaXJNb3VudC5zcmMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gYWRkTGF5b3V0c0RpciAke3V0aWwuaW5zcGVjdChkaXIpfSBsYXlvdXREaXJzICR7dXRpbC5pbnNwZWN0KHRoaXMuI2xheW91dERpcnMpfSBSZW5kZXJlcnMgbGF5b3V0RGlycyAke3V0aWwuaW5zcGVjdCh0aGlzLiNyZW5kZXJlcnMubGF5b3V0RGlycyl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBsYXlvdXREaXJzKCkgeyByZXR1cm4gdGhpcy4jbGF5b3V0RGlyczsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBwYXJ0aWFsRGlycyBjb25maWd1cnRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlyIFRoZSBwYXRobmFtZSB0byB1c2VcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRQYXJ0aWFsc0RpcihkaXI6IGRpclRvTW91bnQpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRpciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXIuc3JjID0gcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKTtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZFBhcnRpYWxzRGlyIC0gZGlyZWN0b3J5IHRvIG1vdW50IG9mIHdyb25nIHR5cGUgJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgYWRkUGFydGlhbHNEaXIgYCwgZGlyKTtcbiAgICAgICAgdGhpcy4jcGFydGlhbERpcnMucHVzaChkaXJNb3VudCk7XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycy5hZGRQYXJ0aWFsRGlyKGRpck1vdW50LnNyYyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBwYXJ0aWFsc0RpcnMoKSB7IHJldHVybiB0aGlzLiNwYXJ0aWFsRGlyczsgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgYXNzZXREaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEFzc2V0c0RpcihkaXI6IGRpclRvTW91bnQpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRpciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXIuc3JjID0gcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKTtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZEFzc2V0c0RpciAtIGRpcmVjdG9yeSB0byBtb3VudCBvZiB3cm9uZyB0eXBlICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jYXNzZXRzRGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGFzc2V0RGlycygpIHsgcmV0dXJuIHRoaXMuI2Fzc2V0c0RpcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhbiBhcnJheSBvZiBNYWhhYmh1dGEgZnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheX0gbWFoYWZ1bmNzXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkTWFoYWJodXRhKG1haGFmdW5jczogbWFoYWJodXRhLk1haGFmdW5jQXJyYXkgfCBtYWhhYmh1dGEuTWFoYWZ1bmNUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWFoYWZ1bmNzID09PSAndW5kZWZpbmVkJyB8fCAhbWFoYWZ1bmNzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuZGVmaW5lZCBtYWhhZnVuY3MgaW4gJHt0aGlzLmNvbmZpZ0Rpcn1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MucHVzaChtYWhhZnVuY3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWFoYWZ1bmNzKCkgeyByZXR1cm4gdGhpcy4jbWFoYWZ1bmNzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmUgdGhlIGRpcmVjdG9yeSBpbnRvIHdoaWNoIHRoZSBwcm9qZWN0IGlzIHJlbmRlcmVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHNldFJlbmRlckRlc3RpbmF0aW9uKGRpcjogc3RyaW5nKSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJyAmJiAhcGF0aC5pc0Fic29sdXRlKGRpcikpIHtcbiAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jcmVuZGVyVG8gPSBkaXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBGZXRjaCB0aGUgZGVjbGFyZWQgZGVzdGluYXRpb24gZm9yIHJlbmRlcmluZyB0aGUgcHJvamVjdC4gKi9cbiAgICBnZXQgcmVuZGVyRGVzdGluYXRpb24oKSB7IHJldHVybiB0aGlzLiNyZW5kZXJUbzsgfVxuICAgIGdldCByZW5kZXJUbygpIHsgcmV0dXJuIHRoaXMuI3JlbmRlclRvOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSB2YWx1ZSB0byB0aGUgcHJvamVjdCBtZXRhZGF0YS4gIFRoZSBtZXRhZGF0YSBpcyBjb21iaW5lZCB3aXRoXG4gICAgICogdGhlIGRvY3VtZW50IG1ldGFkYXRhIGFuZCB1c2VkIGR1cmluZyByZW5kZXJpbmcuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGluZGV4IFRoZSBrZXkgdG8gc3RvcmUgdGhlIHZhbHVlLlxuICAgICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc3RvcmUgaW4gdGhlIG1ldGFkYXRhLlxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZE1ldGFkYXRhKGluZGV4OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdmFyIG1kID0gdGhpcy4jbWV0YWRhdGE7XG4gICAgICAgIG1kW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLiNtZXRhZGF0YTsgfVxuXG4gICAgI2Rlc2NyaXB0aW9uczogQXJyYXk8e1xuICAgICAgICB0YWdOYW1lOiBzdHJpbmcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmdcbiAgICB9PjtcblxuICAgIC8qKlxuICAgICAqIEFkZCB0YWcgZGVzY3JpcHRpb25zIHRvIHRoZSBkYXRhYmFzZS4gIFRoZSBwdXJwb3NlXG4gICAgICogaXMgZm9yIGV4YW1wbGUgYSB0YWcgaW5kZXggcGFnZSBjYW4gZ2l2ZSBhXG4gICAgICogZGVzY3JpcHRpb24gYXQgdGhlIHRvcCBvZiB0aGUgcGFnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0YWdkZXNjcyBcbiAgICAgKi9cbiAgICBhc3luYyBhZGRUYWdEZXNjcmlwdGlvbnModGFnZGVzY3M6IEFycmF5PHtcbiAgICAgICAgdGFnTmFtZTogc3RyaW5nLFxuICAgICAgICBkZXNjcmlwdGlvbjogc3RyaW5nXG4gICAgfT4pIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRhZ2Rlc2NzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGRUYWdEZXNjcmlwdGlvbnMgbXVzdCBiZSBnaXZlbiBhbiBhcnJheSBvZiB0YWcgZGVzY3JpcHRpb25zYCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBkZXNjIG9mIHRhZ2Rlc2NzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlc2MudGFnTmFtZSAhPT0gJ3N0cmluZydcbiAgICAgICAgICAgICB8fCB0eXBlb2YgZGVzYy5kZXNjcmlwdGlvbiAhPT0gJ3N0cmluZydcbiAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEluY29ycmVjdCB0YWcgZGVzY3JpcHRpb24gJHt1dGlsLmluc3BlY3QoZGVzYyl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jZGVzY3JpcHRpb25zID0gdGFnZGVzY3M7XG4gICAgfVxuXG4gICAgYXN5bmMgI3NhdmVEZXNjcmlwdGlvbnNUb0RCKCkge1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuI2Rlc2NyaXB0aW9ucykpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZGVzYyBvZiB0aGlzLiNkZXNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBkb2N1bWVudHMuYWRkVGFnRGVzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIGRlc2MudGFnTmFtZSwgZGVzYy5kZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIERvY3VtZW50IHRoZSBVUkwgZm9yIGEgd2Vic2l0ZSBwcm9qZWN0LlxuICAgICogQHBhcmFtIHtzdHJpbmd9IHJvb3RfdXJsXG4gICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAqL1xuICAgIHJvb3RVUkwocm9vdF91cmw6IHN0cmluZykge1xuICAgICAgICB0aGlzLiNyb290X3VybCA9IHJvb3RfdXJsO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcm9vdF91cmwoKSB7IHJldHVybiB0aGlzLiNyb290X3VybDsgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IGhvdyBtYW55IGRvY3VtZW50cyB0byByZW5kZXIgY29uY3VycmVudGx5LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb25jdXJyZW5jeVxuICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgc2V0Q29uY3VycmVuY3koY29uY3VycmVuY3k6IG51bWJlcikge1xuICAgICAgICB0aGlzLiNjb25jdXJyZW5jeSA9IGNvbmN1cnJlbmN5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgY29uY3VycmVuY3koKSB7IHJldHVybiB0aGlzLiNjb25jdXJyZW5jeTsgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB0aW1lLCBpbiBtaWxpc2Vjb25kcywgdG8gaG9ub3JcbiAgICAgKiB0aGUgU2VhcmNoQ2FjaGUgaW4gdGhlIHNlYXJjaCBmdW5jdGlvbi5cbiAgICAgKiBcbiAgICAgKiBEZWZhdWx0IGlzIDYwMDAwICgxIG1pbnV0ZSkuXG4gICAgICogXG4gICAgICogU2V0IHRvIDAgdG8gZGlzYWJsZSBjYWNoaW5nLlxuICAgICAqIEBwYXJhbSB0aW1lb3V0IFxuICAgICAqL1xuICAgIHNldENhY2hpbmdUaW1lb3V0KHRpbWVvdXQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLiNjYWNoaW5nVGltZW91dCA9IHRpbWVvdXQ7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZXRTZWFyY2hDYWNoZVRpbWVvdXQgJHt0aGlzLiNzZWFyY2hDYWNoZVRpbWVvdXR9YCk7XG4gICAgfVxuXG4gICAgZ2V0IGNhY2hpbmdUaW1lb3V0KCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoQ2FjaGVUaW1lb3V0ICR7dGhpcy4jc2VhcmNoQ2FjaGVUaW1lb3V0fWApO1xuICAgICAgICByZXR1cm4gdGhpcy4jY2FjaGluZ1RpbWVvdXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBKYXZhU2NyaXB0IHRvIGFkZCB3aXRoaW4gdGhlIGhlYWQgdGFnIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRIZWFkZXJKYXZhU2NyaXB0KHNjcmlwdDogamF2YVNjcmlwdEl0ZW0pIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5qYXZhU2NyaXB0VG9wLnB1c2goc2NyaXB0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHNjcmlwdHMoKSB7IHJldHVybiB0aGlzLiNzY3JpcHRzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsYXJlIEphdmFTY3JpcHQgdG8gYWRkIGF0IHRoZSBib3R0b20gb2YgcmVuZGVyZWQgcGFnZXMuXG4gICAgICogQHBhcmFtIHNjcmlwdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEZvb3RlckphdmFTY3JpcHQoc2NyaXB0OiBqYXZhU2NyaXB0SXRlbSkge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLmphdmFTY3JpcHRCb3R0b20ucHVzaChzY3JpcHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsYXJlIGEgQ1NTIFN0eWxlc2hlZXQgdG8gYWRkIHdpdGhpbiB0aGUgaGVhZCB0YWcgb2YgcmVuZGVyZWQgcGFnZXMuXG4gICAgICogQHBhcmFtIHNjcmlwdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZFN0eWxlc2hlZXQoY3NzOiBzdHlsZXNoZWV0SXRlbSkge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLnN0eWxlc2hlZXRzLnB1c2goY3NzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0TWFoYWJodXRhQ29uZmlnKGNoZWVyaW8/OiBjaGVlcmlvLkNoZWVyaW9PcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NoZWVyaW8gPSBjaGVlcmlvO1xuXG4gICAgICAgIC8vIEZvciBjaGVlcmlvIDEuMC4wLXJjLjEwIHdlIG5lZWQgdG8gdXNlIHRoaXMgc2V0dGluZy5cbiAgICAgICAgLy8gSWYgdGhlIGNvbmZpZ3VyYXRpb24gaGFzIHNldCB0aGlzLCB3ZSBtdXN0IG5vdFxuICAgICAgICAvLyBvdmVycmlkZSB0aGVpciBzZXR0aW5nLiAgQnV0LCBnZW5lcmFsbHksIGZvciBjb3JyZWN0XG4gICAgICAgIC8vIG9wZXJhdGlvbiBhbmQgaGFuZGxpbmcgb2YgTWFoYWJodXRhIHRhZ3MsIHdlIG5lZWRcbiAgICAgICAgLy8gdGhpcyBzZXR0aW5nIHRvIGJlIDxjb2RlPnRydWU8L2NvZGU+XG4gICAgICAgIGlmICghKCdfdXNlSHRtbFBhcnNlcjInIGluIHRoaXMuI2NoZWVyaW8pKSB7XG4gICAgICAgICAgICAodGhpcy4jY2hlZXJpbyBhcyBhbnkpLl91c2VIdG1sUGFyc2VyMiA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzW19jb25maWdfY2hlZXJpb10pO1xuICAgIH1cblxuICAgIGdldCBtYWhhYmh1dGFDb25maWcoKSB7IHJldHVybiB0aGlzLiNjaGVlcmlvOyB9XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IHRoZSBjb250ZW50cyBvZiBhbGwgZGlyZWN0b3JpZXMgaW4gYXNzZXREaXJzIHRvIHRoZSByZW5kZXIgZGVzdGluYXRpb24uXG4gICAgICovXG4gICAgYXN5bmMgY29weUFzc2V0cygpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2NvcHlBc3NldHMgU1RBUlQnKTtcblxuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBjb25zdCBhc3NldHMgPSBmaWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIC8vIEZldGNoIHRoZSBsaXN0IG9mIGFsbCBhc3NldHMgZmlsZXNcbiAgICAgICAgY29uc3QgcGF0aHMgPSBhd2FpdCBhc3NldHMucGF0aHMoKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY29weUFzc2V0cyBwYXRoc2AsXG4gICAgICAgIC8vICAgICBwYXRocy5tYXAoaXRlbSA9PiB7XG4gICAgICAgIC8vICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgIC8vICAgICAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aCxcbiAgICAgICAgLy8gICAgICAgICAgICAgbWltZTogaXRlbS5taW1lXG4gICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAvLyAgICAgfSlcbiAgICAgICAgLy8gKVxuXG4gICAgICAgIC8vIFRoZSB3b3JrIHRhc2sgaXMgdG8gY29weSBlYWNoIGZpbGVcbiAgICAgICAgY29uc3QgcXVldWUgPSBmYXN0cS5wcm9taXNlKGFzeW5jIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgJHtjb25maWcucmVuZGVyVG99ICR7aXRlbS5yZW5kZXJQYXRofWApO1xuICAgICAgICAgICAgICAgIGxldCBkZXN0Rk4gPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlclRvLCBpdGVtLnJlbmRlclBhdGgpO1xuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IGV4aXN0c1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUoZGVzdEZOKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgLy8gQ29weSBmcm9tIHRoZSBhYnNvbHV0ZSBwYXRobmFtZSwgdG8gdGhlIGNvbXB1dGVkIFxuICAgICAgICAgICAgICAgIC8vIGxvY2F0aW9uIHdpdGhpbiB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgJHtpdGVtLmZzcGF0aH0gPT0+ICR7ZGVzdEZOfWApO1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5jcChpdGVtLmZzcGF0aCwgZGVzdEZOLCB7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb3B5QXNzZXRzIEZBSUwgdG8gY29weSAke2l0ZW0uZnNwYXRofSAke2l0ZW0udnBhdGh9ICR7aXRlbS5yZW5kZXJQYXRofSAke2NvbmZpZy5yZW5kZXJUb30gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTApO1xuXG4gICAgICAgIC8vIFB1c2ggdGhlIGxpc3Qgb2YgYXNzZXQgZmlsZXMgaW50byB0aGUgcXVldWVcbiAgICAgICAgLy8gQmVjYXVzZSBxdWV1ZS5wdXNoIHJldHVybnMgUHJvbWlzZSdzIHdlIGVuZCB1cCB3aXRoXG4gICAgICAgIC8vIGFuIGFycmF5IG9mIFByb21pc2Ugb2JqZWN0c1xuICAgICAgICBjb25zdCB3YWl0Rm9yID0gW107XG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIHBhdGhzKSB7XG4gICAgICAgICAgICB3YWl0Rm9yLnB1c2gocXVldWUucHVzaChlbnRyeSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoaXMgd2FpdHMgZm9yIGFsbCBQcm9taXNlJ3MgdG8gZmluaXNoXG4gICAgICAgIC8vIEJ1dCBpZiB0aGVyZSB3ZXJlIG5vIFByb21pc2Uncywgbm8gbmVlZCB0byB3YWl0XG4gICAgICAgIGlmICh3YWl0Rm9yLmxlbmd0aCA+IDApIGF3YWl0IFByb21pc2UuYWxsKHdhaXRGb3IpO1xuICAgICAgICAvLyBUaGVyZSBhcmUgbm8gcmVzdWx0cyBpbiB0aGlzIGNhc2UgdG8gY2FyZSBhYm91dFxuICAgICAgICAvLyBjb25zdCByZXN1bHRzID0gW107XG4gICAgICAgIC8vIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIC8vICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbCB0aGUgYmVmb3JlU2l0ZVJlbmRlcmVkIGZ1bmN0aW9uIG9mIGFueSBwbHVnaW4gd2hpY2ggaGFzIHRoYXQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgYXN5bmMgaG9va0JlZm9yZVNpdGVSZW5kZXJlZCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2hvb2tCZWZvcmVTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5iZWZvcmVTaXRlUmVuZGVyZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IGJlZm9yZVNpdGVSZW5kZXJlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5iZWZvcmVTaXRlUmVuZGVyZWQoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGwgdGhlIG9uU2l0ZVJlbmRlcmVkIGZ1bmN0aW9uIG9mIGFueSBwbHVnaW4gd2hpY2ggaGFzIHRoYXQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgYXN5bmMgaG9va1NpdGVSZW5kZXJlZCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2hvb2tTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vblNpdGVSZW5kZXJlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25TaXRlUmVuZGVyZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25TaXRlUmVuZGVyZWQoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQWRkZWQoY29sbGVjdGlvbjogc3RyaW5nLCB2cGluZm86IFZQYXRoRGF0YSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaG9va0ZpbGVBZGRlZCAke2NvbGxlY3Rpb259ICR7dnBpbmZvLnZwYXRofWApO1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUFkZGVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvbkZpbGVBZGRlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vbkZpbGVBZGRlZChjb25maWcsIGNvbGxlY3Rpb24sIHZwaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZUNoYW5nZWQoY29sbGVjdGlvbjogc3RyaW5nLCB2cGluZm86IFZQYXRoRGF0YSkge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUNoYW5nZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uRmlsZUNoYW5nZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlQ2hhbmdlZChjb25maWcsIGNvbGxlY3Rpb24sIHZwaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZVVubGlua2VkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVVbmxpbmtlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25GaWxlVW5saW5rZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlVW5saW5rZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVDYWNoZVNldHVwKGNvbGxlY3Rpb25ubTogc3RyaW5nLCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlQ2FjaGVTZXR1cCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlQ2FjaGVTZXR1cChjb25maWcsIGNvbGxlY3Rpb25ubSwgY29sbGVjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rUGx1Z2luQ2FjaGVTZXR1cCgpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vblBsdWdpbkNhY2hlU2V0dXAgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uUGx1Z2luQ2FjaGVTZXR1cChjb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU1BFQ0lBTCBUUkVBVE1FTlRcbiAgICAgICAgLy8gVGhlIHRhZyBkZXNjcmlwdGlvbnMgbmVlZCB0byBiZSBpbnN0YWxsZWRcbiAgICAgICAgLy8gaW4gdGhlIGRhdGFiYXNlLiAgSXQgaXMgaW1wb3NzaWJsZSB0byBkb1xuICAgICAgICAvLyB0aGF0IGR1cmluZyBDb25maWd1cmF0aW9uIHNldHVwIGluXG4gICAgICAgIC8vIHRoZSBhZGRUYWdEZXNjcmlwdGlvbnMgbWV0aG9kLlxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgYWZ0ZXIgdGhlIGRhdGFiYXNlXG4gICAgICAgIC8vIGlzIHNldHVwLlxuXG4gICAgICAgIGF3YWl0IHRoaXMuI3NhdmVEZXNjcmlwdGlvbnNUb0RCKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdXNlIC0gZ28gdGhyb3VnaCBwbHVnaW5zIGFycmF5LCBhZGRpbmcgZWFjaCB0byB0aGUgcGx1Z2lucyBhcnJheSBpblxuICAgICAqIHRoZSBjb25maWcgZmlsZSwgdGhlbiBjYWxsaW5nIHRoZSBjb25maWcgZnVuY3Rpb24gb2YgZWFjaCBwbHVnaW4uXG4gICAgICogQHBhcmFtIFBsdWdpbk9iaiBUaGUgcGx1Z2luIG5hbWUgb3Igb2JqZWN0IHRvIGFkZFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHVzZShQbHVnaW5PYmosIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJDb25maWd1cmF0aW9uICMxIHVzZSBQbHVnaW5PYmogXCIrIHR5cGVvZiBQbHVnaW5PYmogK1wiIFwiKyB1dGlsLmluc3BlY3QoUGx1Z2luT2JqKSk7XG4gICAgICAgIGlmICh0eXBlb2YgUGx1Z2luT2JqID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBnb2luZyB0byBmYWlsIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIHJlcXVpcmUgZG9lc24ndCB3b3JrIGluIHRoaXMgY29udGV4dFxuICAgICAgICAgICAgLy8gRnVydGhlciwgdGhpcyBjb250ZXh0IGRvZXMgbm90XG4gICAgICAgICAgICAvLyBzdXBwb3J0IGFzeW5jIGZ1bmN0aW9ucywgc28gd2VcbiAgICAgICAgICAgIC8vIGNhbm5vdCBkbyBpbXBvcnQuXG4gICAgICAgICAgICBQbHVnaW5PYmogPSByZXF1aXJlKFBsdWdpbk9iaik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFQbHVnaW5PYmogfHwgUGx1Z2luT2JqIGluc3RhbmNlb2YgUGx1Z2luKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBwbHVnaW4gc3VwcGxpZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJDb25maWd1cmF0aW9uICMyIHVzZSBQbHVnaW5PYmogXCIrIHR5cGVvZiBQbHVnaW5PYmogK1wiIFwiKyB1dGlsLmluc3BlY3QoUGx1Z2luT2JqKSk7XG4gICAgICAgIHZhciBwbHVnaW4gPSBuZXcgUGx1Z2luT2JqKCk7XG4gICAgICAgIHBsdWdpbi5ha2FzaGEgPSB0aGlzLmFrYXNoYTtcbiAgICAgICAgdGhpcy4jcGx1Z2lucy5wdXNoKHBsdWdpbik7XG4gICAgICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgICAgICBwbHVnaW4uY29uZmlndXJlKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcGx1Z2lucygpIHsgcmV0dXJuIHRoaXMuI3BsdWdpbnM7IH1cblxuICAgIC8qKlxuICAgICAqIEl0ZXJhdGUgb3ZlciB0aGUgaW5zdGFsbGVkIHBsdWdpbnMsIGNhbGxpbmcgdGhlIGZ1bmN0aW9uIHBhc3NlZCBpbiBgaXRlcmF0b3JgXG4gICAgICogZm9yIGVhY2ggcGx1Z2luLCB0aGVuIGNhbGxpbmcgdGhlIGZ1bmN0aW9uIHBhc3NlZCBpbiBgZmluYWxgLlxuICAgICAqXG4gICAgICogQHBhcmFtIGl0ZXJhdG9yIFRoZSBmdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHBsdWdpbi4gIFNpZ25hdHVyZTogYGZ1bmN0aW9uKHBsdWdpbiwgbmV4dClgICBUaGUgYG5leHRgIHBhcmFtZXRlciBpcyBhIGZ1bmN0aW9uIHVzZWQgdG8gaW5kaWNhdGUgZXJyb3IgLS0gYG5leHQoZXJyKWAgLS0gb3Igc3VjY2VzcyAtLSBuZXh0KClcbiAgICAgKiBAcGFyYW0gZmluYWwgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgYWZ0ZXIgYWxsIGl0ZXJhdG9yIGNhbGxzIGhhdmUgYmVlbiBtYWRlLiAgU2lnbmF0dXJlOiBgZnVuY3Rpb24oZXJyKWBcbiAgICAgKi9cbiAgICBlYWNoUGx1Z2luKGl0ZXJhdG9yLCBmaW5hbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJlYWNoUGx1Z2luIGRlcHJlY2F0ZWRcIik7XG4gICAgICAgIC8qIGFzeW5jLmVhY2hTZXJpZXModGhpcy5wbHVnaW5zLFxuICAgICAgICBmdW5jdGlvbihwbHVnaW4sIG5leHQpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHBsdWdpbiwgbmV4dCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZpbmFsKTsgKi9cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb29rIGZvciBhIHBsdWdpbiwgcmV0dXJuaW5nIGl0cyBtb2R1bGUgcmVmZXJlbmNlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHJldHVybnMge1BsdWdpbn1cbiAgICAgKi9cbiAgICBwbHVnaW4obmFtZTogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdjb25maWcucGx1Z2luOiAnKyB1dGlsLmluc3BlY3QodGhpcy5fcGx1Z2lucykpO1xuICAgICAgICBpZiAoISB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgcGx1Z2luS2V5IGluIHRoaXMucGx1Z2lucykge1xuICAgICAgICAgICAgdmFyIHBsdWdpbiA9IHRoaXMucGx1Z2luc1twbHVnaW5LZXldO1xuICAgICAgICAgICAgaWYgKHBsdWdpbi5uYW1lID09PSBuYW1lKSByZXR1cm4gcGx1Z2luO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGBXQVJOSU5HOiBEaWQgbm90IGZpbmQgcGx1Z2luICR7bmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgcGx1Z2luRGF0YSBvYmplY3QgZm9yIHRoZSBuYW1lZCBwbHVnaW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAqLyBcbiAgICBwbHVnaW5EYXRhKG5hbWU6IHN0cmluZykge1xuICAgICAgICB2YXIgcGx1Z2luRGF0YUFycmF5ID0gdGhpcy4jcGx1Z2luRGF0YTtcbiAgICAgICAgaWYgKCEobmFtZSBpbiBwbHVnaW5EYXRhQXJyYXkpKSB7XG4gICAgICAgICAgICBwbHVnaW5EYXRhQXJyYXlbbmFtZV0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGx1Z2luRGF0YUFycmF5W25hbWVdO1xuICAgIH1cblxuICAgIGFza1BsdWdpbnNMZWdpdExvY2FsSHJlZihocmVmKSB7XG4gICAgICAgIGZvciAodmFyIHBsdWdpbiBvZiB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLmlzTGVnaXRMb2NhbEhyZWYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBsdWdpbi5pc0xlZ2l0TG9jYWxIcmVmKHRoaXMsIGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJSZW5kZXJlcihyZW5kZXJlcjogUmVuZGVyZXIpIHtcbiAgICAgICAgaWYgKCEocmVuZGVyZXIgaW5zdGFuY2VvZiBSZW5kZXJlcikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vdCBBIFJlbmRlcmVyICcrIHV0aWwuaW5zcGVjdChyZW5kZXJlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb3QgYSBSZW5kZXJlciAke3V0aWwuaW5zcGVjdChyZW5kZXJlcil9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmZpbmRSZW5kZXJlck5hbWUocmVuZGVyZXIubmFtZSkpIHtcbiAgICAgICAgICAgIC8vIHJlbmRlcmVyLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICAgICAgLy8gcmVuZGVyZXIuY29uZmlnID0gdGhpcztcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZWdpc3RlclJlbmRlcmVyIGAsIHJlbmRlcmVyKTtcbiAgICAgICAgICAgIHRoaXMuI3JlbmRlcmVycy5yZWdpc3RlclJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFsbG93IGFuIGFwcGxpY2F0aW9uIHRvIG92ZXJyaWRlIG9uZSBvZiB0aGUgYnVpbHQtaW4gcmVuZGVyZXJzXG4gICAgICogdGhhdCBhcmUgaW5pdGlhbGl6ZWQgYmVsb3cuICBUaGUgaW5zcGlyYXRpb24gaXMgZXB1YnRvb2xzIHRoYXRcbiAgICAgKiBtdXN0IHdyaXRlIEhUTUwgZmlsZXMgd2l0aCBhbiAueGh0bWwgZXh0ZW5zaW9uLiAgVGhlcmVmb3JlIGl0XG4gICAgICogY2FuIHN1YmNsYXNzIEVKU1JlbmRlcmVyIGV0YyB3aXRoIGltcGxlbWVudGF0aW9ucyB0aGF0IGZvcmNlIHRoZVxuICAgICAqIGZpbGUgbmFtZSB0byBiZSAueGh0bWwuICBXZSdyZSBub3QgY2hlY2tpbmcgaWYgdGhlIHJlbmRlcmVyIG5hbWVcbiAgICAgKiBpcyBhbHJlYWR5IHRoZXJlIGluIGNhc2UgZXB1YnRvb2xzIG11c3QgdXNlIHRoZSBzYW1lIHJlbmRlcmVyIG5hbWUuXG4gICAgICovXG4gICAgcmVnaXN0ZXJPdmVycmlkZVJlbmRlcmVyKHJlbmRlcmVyOiBSZW5kZXJlcikge1xuICAgICAgICBpZiAoIShyZW5kZXJlciBpbnN0YW5jZW9mIFJlbmRlcmVyKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm90IEEgUmVuZGVyZXIgJysgdXRpbC5pbnNwZWN0KHJlbmRlcmVyKSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIFJlbmRlcmVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVuZGVyZXIuYWthc2hhID0gdGhpcy5ha2FzaGE7XG4gICAgICAgIC8vIHJlbmRlcmVyLmNvbmZpZyA9IHRoaXM7XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycy5yZWdpc3Rlck92ZXJyaWRlUmVuZGVyZXIocmVuZGVyZXIpO1xuICAgIH1cblxuICAgIGZpbmRSZW5kZXJlck5hbWUobmFtZTogc3RyaW5nKTogUmVuZGVyZXIge1xuICAgICAgICByZXR1cm4gdGhpcy4jcmVuZGVyZXJzLmZpbmRSZW5kZXJlck5hbWUobmFtZSk7XG4gICAgfVxuXG4gICAgZmluZFJlbmRlcmVyUGF0aChfcGF0aDogc3RyaW5nKTogUmVuZGVyZXIge1xuICAgICAgICByZXR1cm4gdGhpcy4jcmVuZGVyZXJzLmZpbmRSZW5kZXJlclBhdGgoX3BhdGgpO1xuICAgIH1cblxuICAgIGdldCByZW5kZXJlcnMoKSB7IHJldHVybiB0aGlzLiNyZW5kZXJlcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYSBSZW5kZXJlciBieSBpdHMgZXh0ZW5zaW9uLlxuICAgICAqL1xuICAgIGZpbmRSZW5kZXJlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZFJlbmRlcmVyTmFtZShuYW1lKTtcbiAgICB9XG59XG5cbmNvbnN0IG1vZHVsZV9leHBvcnRzID0ge1xuICAgIFJlbmRlcmVycyxcbiAgICBSZW5kZXJlcjogUmVuZGVyZXJzLlJlbmRlcmVyLFxuICAgIG1haGFiaHV0YSxcbiAgICBmaWxlY2FjaGUsXG4gICAgc2V0dXAsXG4gICAgY2FjaGVTZXR1cCxcbiAgICBjbG9zZUNhY2hlcyxcbiAgICBmaWxlQ2FjaGVzUmVhZHksXG4gICAgUGx1Z2luLFxuICAgIHJlbmRlcixcbiAgICByZW5kZXJEb2N1bWVudCxcbiAgICByZW5kZXJQYXRoLFxuICAgIHJlYWRSZW5kZXJlZEZpbGUsXG4gICAgcGFydGlhbCxcbiAgICBwYXJ0aWFsU3luYyxcbiAgICBpbmRleENoYWluLFxuICAgIHJlbGF0aXZlLFxuICAgIGxpbmtSZWxTZXRBdHRyLFxuICAgIGdlbmVyYXRlUlNTLFxuICAgIENvbmZpZ3VyYXRpb25cbn0gYXMgYW55O1xuXG5leHBvcnQgZGVmYXVsdCBtb2R1bGVfZXhwb3J0czsiXX0=