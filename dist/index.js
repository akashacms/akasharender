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
var _Configuration_instances, _Configuration_renderers, _Configuration_configdir, _Configuration_cachedir, _Configuration_assetsDirs, _Configuration_layoutDirs, _Configuration_documentDirs, _Configuration_partialDirs, _Configuration_mahafuncs, _Configuration_cheerio, _Configuration_renderTo, _Configuration_scripts, _Configuration_concurrency, _Configuration_cachingTimeout, _Configuration_metadata, _Configuration_root_url, _Configuration_plugins, _Configuration_pluginData, _Configuration_verbose, _Configuration_perfDataDir, _Configuration_descriptions, _Configuration_saveDescriptionsToDB;
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
import { mimedefine, isDirToMount } from './cache/vfstack.js';
export { isDirToMount } from './cache/vfstack.js';
import * as Renderers from '@akashacms/renderers';
export * as Renderers from '@akashacms/renderers';
import { Renderer } from '@akashacms/renderers';
export { Renderer } from '@akashacms/renderers';
import * as mahabhuta from 'mahabhuta';
export * as mahabhuta from 'mahabhuta';
const { PerfDataStore, FilesystemPerfDataStore } = mahabhuta;
import * as cheerio from 'cheerio';
import mahaPartial from 'mahabhuta/maha/partial.js';
export * from './mahafuncs.js';
import * as relative from 'relative';
export * as relative from 'relative';
import { Plugin } from './Plugin.js';
export { Plugin } from './Plugin.js';
export { validTagDescription } from './types.js';
import { render, render2, renderDocument, renderDocument2 } from './render.js';
export { render, render2, renderDocument, renderDocument2, renderContent } from './render.js';
export { SitemapValidator } from './sitemap-validator.js';
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
// For use in Configure.prepare
import { BuiltInPlugin } from './built-in.js';
import * as filecache from './cache/cache-sqlite.js';
import { sqdb } from './sqdb.js';
export { newSQ3DataStore } from './sqdb.js';
import { init } from './data.js';
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
    await init();
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
export async function renderPath2(config, path2r) {
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
    let result = await renderDocument2(config, found);
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
 * Defines the structure for directory
 * mount specification in the Configuration.
 *
 * The simple 'string' form says to mount
 * the named fspath on the root of the
 * virtual filespace.
 *
 * The object form allows us to mount
 * an fspath into a different location
 * in the virtual filespace, to ignore
 * files based on GLOB patterns, and to
 * include metadata for every file in
 * a directory tree.
 *
 * In the file-cache module, this is
 * converted to the dirToWatch structure
 * used by StackedDirs.
 */
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
        _Configuration_verbose.set(this, void 0);
        _Configuration_perfDataDir.set(this, void 0);
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
        __classPrivateFieldSet(this, _Configuration_verbose, false, "f");
        __classPrivateFieldSet(this, _Configuration_perfDataDir, undefined, "f");
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
    set verbose(val) { __classPrivateFieldSet(this, _Configuration_verbose, val, "f"); }
    get verbose() { return __classPrivateFieldGet(this, _Configuration_verbose, "f"); }
    set perfDataDir(storeDir) {
        __classPrivateFieldSet(this, _Configuration_perfDataDir, storeDir, "f");
    }
    get perfDataDir() { return __classPrivateFieldGet(this, _Configuration_perfDataDir, "f"); }
    // set akasha(_akasha)  { this[_config_akasha] = _akasha; }
    get akasha() { return module_exports; }
    async documentsCache() { return filecache.documentsCache; }
    async assetsCache() { return filecache.assetsCache; }
    async layoutsCache() { return filecache.layoutsCache; }
    async partialsCache() { return filecache.partialsCache; }
    /**
     * Add a directory to the documentDirs configuration array
     * @param {string | dirToMount} dir The pathname to use or dirToMount object
     */
    addDocumentsDir(dir) {
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
        else {
            if (!path.isAbsolute(dir.src) && this.configDir != null) {
                dirMount = {
                    ...dir,
                    src: path.join(this.configDir, dir.src)
                };
            }
            else {
                dirMount = dir;
            }
        }
        if (!isDirToMount(dirMount)) {
            throw new Error(`addDocumentsDir - invalid dirToMount object: ${util.inspect(dirMount)}`);
        }
        __classPrivateFieldGet(this, _Configuration_documentDirs, "f").push(dirMount);
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
     * @param {string | dirToMount} dir The pathname to use or dirToMount object
     */
    addLayoutsDir(dir) {
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
        else {
            if (!path.isAbsolute(dir.src) && this.configDir != null) {
                dirMount = {
                    ...dir,
                    src: path.join(this.configDir, dir.src)
                };
            }
            else {
                dirMount = dir;
            }
        }
        if (!isDirToMount(dirMount)) {
            throw new Error(`addLayoutsDir - invalid dirToMount object: ${util.inspect(dirMount)}`);
        }
        __classPrivateFieldGet(this, _Configuration_layoutDirs, "f").push(dirMount);
        __classPrivateFieldGet(this, _Configuration_renderers, "f").addLayoutDir(dirMount.src);
        return this;
    }
    get layoutDirs() { return __classPrivateFieldGet(this, _Configuration_layoutDirs, "f"); }
    /**
     * Add a directory to the partialDirs configurtion array
     * @param {string | dirToMount} dir The pathname to use or dirToMount object
     * @returns {Configuration}
     */
    addPartialsDir(dir) {
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
        else {
            if (!path.isAbsolute(dir.src) && this.configDir != null) {
                dirMount = {
                    ...dir,
                    src: path.join(this.configDir, dir.src)
                };
            }
            else {
                dirMount = dir;
            }
        }
        if (!isDirToMount(dirMount)) {
            throw new Error(`addPartialsDir - invalid dirToMount object: ${util.inspect(dirMount)}`);
        }
        __classPrivateFieldGet(this, _Configuration_partialDirs, "f").push(dirMount);
        __classPrivateFieldGet(this, _Configuration_renderers, "f").addPartialDir(dirMount.src);
        return this;
    }
    get partialsDirs() { return __classPrivateFieldGet(this, _Configuration_partialDirs, "f"); }
    /**
     * Add a directory to the assetDirs configurtion array
     * @param {string | dirToMount} dir The pathname to use or dirToMount object
     * @returns {Configuration}
     */
    addAssetsDir(dir) {
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
        else {
            if (!path.isAbsolute(dir.src) && this.configDir != null) {
                dirMount = {
                    ...dir,
                    src: path.join(this.configDir, dir.src)
                };
            }
            else {
                dirMount = dir;
            }
        }
        if (!isDirToMount(dirMount)) {
            throw new Error(`addAssetsDir - invalid dirToMount object: ${util.inspect(dirMount)}`);
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
     * NOTE: Potential bug - This function replaces the entire #descriptions
     * array rather than merging with existing descriptions. If called multiple
     * times, earlier descriptions will be lost. Current assumption is this
     * function is only called once from the configuration file. A future
     * enhancement would be to merge descriptions instead of replacing.
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
        // TODO: Consider merging with existing descriptions instead of replacing
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
_Configuration_renderers = new WeakMap(), _Configuration_configdir = new WeakMap(), _Configuration_cachedir = new WeakMap(), _Configuration_assetsDirs = new WeakMap(), _Configuration_layoutDirs = new WeakMap(), _Configuration_documentDirs = new WeakMap(), _Configuration_partialDirs = new WeakMap(), _Configuration_mahafuncs = new WeakMap(), _Configuration_cheerio = new WeakMap(), _Configuration_renderTo = new WeakMap(), _Configuration_scripts = new WeakMap(), _Configuration_concurrency = new WeakMap(), _Configuration_cachingTimeout = new WeakMap(), _Configuration_metadata = new WeakMap(), _Configuration_root_url = new WeakMap(), _Configuration_plugins = new WeakMap(), _Configuration_pluginData = new WeakMap(), _Configuration_verbose = new WeakMap(), _Configuration_perfDataDir = new WeakMap(), _Configuration_descriptions = new WeakMap(), _Configuration_instances = new WeakSet(), _Configuration_saveDescriptionsToDB = async function _Configuration_saveDescriptionsToDB() {
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
    render2,
    renderDocument,
    renderPath,
    renderPath2,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBR0g7OztHQUdHO0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsNENBQTRDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFFLFVBQVUsRUFBYyxZQUFZLEVBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEtBQUssU0FBUyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsTUFBTSxFQUNGLGFBQWEsRUFDYix1QkFBdUIsRUFDMUIsR0FBRyxTQUFTLENBQUM7QUFDZCxPQUFPLEtBQUssT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUNuQyxPQUFPLFdBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUVwRCxjQUFjLGdCQUFnQixDQUFDO0FBRS9CLE9BQU8sS0FBSyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sS0FBSyxRQUFR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Qyx1QkFBQSxJQUFJLG1DQUFjLENBQUMsRUFBRSxDQUFDO1FBQ3BDLEtBQUssTUFBTSxJQUFJLElBQUksdUJBQUEsSUFBSSxtQ0FBYyxFQUFFLENBQUM7WUFDcEMsTUFBTSxTQUFTLENBQUMsaUJBQWlCLENBQzdCLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FDakMsQ0FBQztRQUNOLENBQUM7SUFDTCxDQUFDO0FBQ0wsQ0FBQztBQXlYTCxNQUFNLGNBQWMsR0FBRztJQUNuQixTQUFTO0lBQ1QsUUFBUSxFQUFFLFNBQVMsQ0FBQyxRQUFRO0lBQzVCLFNBQVM7SUFDVCxTQUFTO0lBQ1QsS0FBSztJQUNMLFVBQVU7SUFDVixXQUFXO0lBQ1gsZUFBZTtJQUNmLE1BQU07SUFDTixNQUFNO0lBQ04sT0FBTztJQUNQLGNBQWM7SUFDZCxVQUFVO0lBQ1YsV0FBVztJQUNYLGdCQUFnQjtJQUNoQixPQUFPO0lBQ1AsV0FBVztJQUNYLFVBQVU7SUFDVixRQUFRO0lBQ1IsY0FBYztJQUNkLFdBQVc7SUFDWCxhQUFhO0NBQ1QsQ0FBQztBQUVULGVBQWUsY0FBYyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblxuLyoqXG4gKiBBa2FzaGFSZW5kZXJcbiAqIEBtb2R1bGUgYWthc2hhcmVuZGVyXG4gKi9cblxuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbi8vIGNvbnN0IG9lbWJldHRlciA9IHJlcXVpcmUoJ29lbWJldHRlcicpKCk7XG5pbXBvcnQgUlNTIGZyb20gJ3Jzcyc7XG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHsgbWltZWRlZmluZSwgZGlyVG9Nb3VudCwgaXNEaXJUb01vdW50LCBWUGF0aERhdGEgfSBmcm9tICcuL2NhY2hlL3Zmc3RhY2suanMnO1xuZXhwb3J0IHR5cGUgeyBkaXJUb01vdW50LCBWUGF0aERhdGEgfSBmcm9tICcuL2NhY2hlL3Zmc3RhY2suanMnO1xuZXhwb3J0IHsgaXNEaXJUb01vdW50IH0gZnJvbSAnLi9jYWNoZS92ZnN0YWNrLmpzJztcbmltcG9ydCAqIGFzIFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5leHBvcnQgKiBhcyBSZW5kZXJlcnMgZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0IHsgUmVuZGVyZXIgfSBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5leHBvcnQgeyBSZW5kZXJlciB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCAqIGFzIG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuZXhwb3J0ICogYXMgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5jb25zdCB7XG4gICAgUGVyZkRhdGFTdG9yZSwgXG4gICAgRmlsZXN5c3RlbVBlcmZEYXRhU3RvcmVcbn0gPSBtYWhhYmh1dGE7XG5pbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gJ2NoZWVyaW8nO1xuaW1wb3J0IG1haGFQYXJ0aWFsIGZyb20gJ21haGFiaHV0YS9tYWhhL3BhcnRpYWwuanMnO1xuXG5leHBvcnQgKiBmcm9tICcuL21haGFmdW5jcy5qcyc7XG5cbmltcG9ydCAqIGFzIHJlbGF0aXZlIGZyb20gJ3JlbGF0aXZlJztcbmV4cG9ydCAqIGFzIHJlbGF0aXZlIGZyb20gJ3JlbGF0aXZlJztcblxuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAnLi9QbHVnaW4uanMnO1xuZXhwb3J0IHsgUGx1Z2luIH0gZnJvbSAnLi9QbHVnaW4uanMnO1xuXG5pbXBvcnQgdHlwZSB7IFRhZ0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi90eXBlcy5qcyc7XG5leHBvcnQgdHlwZSB7IFRhZ0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi90eXBlcy5qcyc7XG5leHBvcnQgeyB2YWxpZFRhZ0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi90eXBlcy5qcyc7XG5cbmltcG9ydCB7IHJlbmRlciwgcmVuZGVyMiwgcmVuZGVyRG9jdW1lbnQsIHJlbmRlckNvbnRlbnQsIHJlbmRlckRvY3VtZW50MiB9IGZyb20gJy4vcmVuZGVyLmpzJztcbmV4cG9ydCB7IHJlbmRlciwgcmVuZGVyMiwgcmVuZGVyRG9jdW1lbnQsIHJlbmRlckRvY3VtZW50MiwgcmVuZGVyQ29udGVudCB9IGZyb20gJy4vcmVuZGVyLmpzJztcblxuZXhwb3J0IHtcbiAgICBTaXRlbWFwVmFsaWRhdG9yLFxuICAgIHR5cGUgU2l0ZW1hcEVudHJ5LFxuICAgIHR5cGUgRW50cnlWYWxpZGF0aW9uLFxuICAgIHR5cGUgWE1MVmFsaWRhdGlvbixcbiAgICB0eXBlIFZhbGlkYXRpb25SZXN1bHRcbn0gZnJvbSAnLi9zaXRlbWFwLXZhbGlkYXRvci5qcyc7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBpbXBvcnQubWV0YS5maWxlbmFtZTtcbmNvbnN0IF9fZGlybmFtZSA9IGltcG9ydC5tZXRhLmRpcm5hbWU7XG5cbi8vIEZvciB1c2UgaW4gQ29uZmlndXJlLnByZXBhcmVcbmltcG9ydCB7IEJ1aWx0SW5QbHVnaW4gfSBmcm9tICcuL2J1aWx0LWluLmpzJztcblxuaW1wb3J0ICogYXMgZmlsZWNhY2hlIGZyb20gJy4vY2FjaGUvY2FjaGUtc3FsaXRlLmpzJztcbmltcG9ydCB7IHNxZGIgfSBmcm9tICcuL3NxZGIuanMnO1xuXG5leHBvcnQgeyBuZXdTUTNEYXRhU3RvcmUgfSBmcm9tICcuL3NxZGIuanMnO1xuXG5pbXBvcnQgeyBpbml0IH0gZnJvbSAnLi9kYXRhLmpzJztcblxuLy8gVGhlcmUgZG9lc24ndCBzZWVtIHRvIGJlIGFuIG9mZmljaWFsIE1JTUUgdHlwZSByZWdpc3RlcmVkXG4vLyBmb3IgQXNjaWlEb2N0b3Jcbi8vIHBlcjogaHR0cHM6Ly9hc2NpaWRvY3Rvci5vcmcvZG9jcy9mYXEvXG4vLyBwZXI6IGh0dHBzOi8vZ2l0aHViLmNvbS9hc2NpaWRvY3Rvci9hc2NpaWRvY3Rvci9pc3N1ZXMvMjUwMlxuLy9cbi8vIEFzIG9mIE5vdmVtYmVyIDYsIDIwMjIsIHRoZSBBc2NpaURvY3RvciBGQVEgc2FpZCB0aGV5IGFyZVxuLy8gaW4gdGhlIHByb2Nlc3Mgb2YgcmVnaXN0ZXJpbmcgYSBNSU1FIHR5cGUgZm9yIGB0ZXh0L2FzY2lpZG9jYC5cbi8vIFRoZSBNSU1FIHR5cGUgd2Ugc3VwcGx5IGhhcyBiZWVuIHVwZGF0ZWQuXG4vL1xuLy8gVGhpcyBhbHNvIHNlZW1zIHRvIGJlIHRydWUgZm9yIHRoZSBvdGhlciBmaWxlIHR5cGVzLiAgV2UndmUgbWFkZSB1cFxuLy8gc29tZSBNSU1FIHR5cGVzIHRvIGdvIHdpdGggZWFjaC5cbi8vXG4vLyBUaGUgTUlNRSBwYWNrYWdlIGhhZCBwcmV2aW91c2x5IGJlZW4gaW5zdGFsbGVkIHdpdGggQWthc2hhUmVuZGVyLlxuLy8gQnV0LCBpdCBzZWVtcyB0byBub3QgYmUgdXNlZCwgYW5kIGluc3RlYWQgd2UgY29tcHV0ZSB0aGUgTUlNRSB0eXBlXG4vLyBmb3IgZmlsZXMgaW4gU3RhY2tlZCBEaXJlY3Rvcmllcy5cbi8vXG4vLyBUaGUgcmVxdWlyZWQgdGFzayBpcyB0byByZWdpc3RlciBzb21lIE1JTUUgdHlwZXMgd2l0aCB0aGVcbi8vIE1JTUUgcGFja2FnZS4gIEl0IGlzbid0IGFwcHJvcHJpYXRlIHRvIGRvIHRoaXMgaW5cbi8vIHRoZSBTdGFja2VkIERpcmVjdG9yaWVzIHBhY2thZ2UuICBJbnN0ZWFkIHRoYXQncyBsZWZ0XG4vLyBmb3IgY29kZSB3aGljaCB1c2VzIFN0YWNrZWQgRGlyZWN0b3JpZXMgdG8gZGV0ZXJtaW5lIHdoaWNoXG4vLyAoaWYgYW55KSBhZGRlZCBNSU1FIHR5cGVzIGFyZSByZXF1aXJlZC4gIEVyZ28sIEFrYXNoYVJlbmRlclxuLy8gbmVlZHMgdG8gcmVnaXN0ZXIgdGhlIE1JTUUgdHlwZXMgaXQgaXMgaW50ZXJlc3RlZCBpbi5cbi8vIFRoYXQncyB3aGF0IGlzIGhhcHBlbmluZyBoZXJlLlxuLy9cbi8vIFRoZXJlJ3MgYSB0aG91Z2h0IHRoYXQgdGhpcyBzaG91bGQgYmUgaGFuZGxlZCBpbiB0aGUgUmVuZGVyZXJcbi8vIGltcGxlbWVudGF0aW9ucy4gIEJ1dCBpdCdzIG5vdCBjZXJ0YWluIHRoYXQncyBjb3JyZWN0LlxuLy9cbi8vIE5vdyB0aGF0IHRoZSBSZW5kZXJlcnMgYXJlIGluIGBAYWthc2hhY21zL3JlbmRlcmVyc2Agc2hvdWxkXG4vLyB0aGVzZSBkZWZpbml0aW9ucyBtb3ZlIHRvIHRoYXQgcGFja2FnZT9cblxubWltZWRlZmluZSh7J3RleHQvYXNjaWlkb2MnOiBbICdhZG9jJywgJ2FzY2lpZG9jJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LW1hcmtkb2MnOiBbICdtYXJrZG9jJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LWVqcyc6IFsgJ2VqcyddfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LW51bmp1Y2tzJzogWyAnbmprJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LWhhbmRsZWJhcnMnOiBbICdoYW5kbGViYXJzJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LWxpcXVpZCc6IFsgJ2xpcXVpZCcgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC10ZW1wdXJhJzogWyAndGVtcHVyYScgXX0pO1xuXG4vKipcbiAqIFBlcmZvcm1zIHNldHVwIG9mIHRoaW5ncyBzbyB0aGF0IEFrYXNoYVJlbmRlciBjYW4gZnVuY3Rpb24uXG4gKiBUaGUgY29ycmVjdCBpbml0aWFsaXphdGlvbiBvZiBBa2FzaGFSZW5kZXIgaXMgdG9cbiAqIDEuIEdlbmVyYXRlIHRoZSBDb25maWd1cmF0aW9uIG9iamVjdFxuICogMi4gQ2FsbCBjb25maWcucHJlcGFyZVxuICogMy4gQ2FsbCBha2FzaGFyZW5kZXIuc2V0dXBcbiAqIFxuICogVGhpcyBmdW5jdGlvbiBlbnN1cmVzIGFsbCBvYmplY3RzIHRoYXQgaW5pdGlhbGl6ZSBhc3luY2hyb25vdXNseVxuICogYXJlIGNvcnJlY3RseSBzZXR1cC5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChjb25maWcpIHtcblxuICAgIGNvbmZpZy5yZW5kZXJlcnMucGFydGlhbEZ1bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjYWxsaW5nIHBhcnRpYWwgJHtmbmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgY29uZmlnLnJlbmRlcmVycy5wYXJ0aWFsU3luY0Z1bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjYWxsaW5nIHBhcnRpYWxTeW5jICR7Zm5hbWV9YCk7XG4gICAgICAgIHJldHVybiBwYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcblxuICAgIGF3YWl0IGNhY2hlU2V0dXAoY29uZmlnKTtcbiAgICBhd2FpdCBmaWxlQ2FjaGVzUmVhZHkoY29uZmlnKTtcblxuICAgIGF3YWl0IGluaXQoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhY2hlU2V0dXAoY29uZmlnKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmlsZWNhY2hlLnNldHVwKGNvbmZpZywgYXdhaXQgc3FkYik7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYElOSVRJQUxJWkFUSU9OIEZBSUxVUkUgQ09VTEQgTk9UIElOSVRJQUxJWkUgQ0FDSEUgYCwgZXJyKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsb3NlQ2FjaGVzKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZpbGVjYWNoZS5jbG9zZUZpbGVDYWNoZXMoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgSU5JVElBTElaQVRJT04gRkFJTFVSRSBDT1VMRCBOT1QgQ0xPU0UgQ0FDSEVTIGAsIGVycik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmaWxlQ2FjaGVzUmVhZHkoY29uZmlnKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLmlzUmVhZHkoKSxcbiAgICAgICAgICAgIGZpbGVjYWNoZS5hc3NldHNDYWNoZS5pc1JlYWR5KCksXG4gICAgICAgICAgICBmaWxlY2FjaGUubGF5b3V0c0NhY2hlLmlzUmVhZHkoKSxcbiAgICAgICAgICAgIGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLmlzUmVhZHkoKVxuICAgICAgICBdKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgSU5JVElBTElaQVRJT04gRkFJTFVSRSBDT1VMRCBOT1QgSU5JVElBTElaRSBDQUNIRSBTWVNURU0gYCwgZXJyKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlclBhdGgoY29uZmlnLCBwYXRoMnIpIHtcbiAgICBjb25zdCBkb2N1bWVudHMgPSBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgbGV0IGZvdW5kO1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgd2hpbGUgKGNvdW50IDwgMjApIHtcbiAgICAgICAgLyogV2hhdCdzIGhhcHBlbmluZyBpcyB0aGlzIG1pZ2h0IGJlIGNhbGxlZCBmcm9tIGNsaS5qc1xuICAgICAgICAgKiBpbiByZW5kZXItZG9jdW1lbnQsIGFuZCB3ZSBtaWdodCBiZSBhc2tlZCB0byByZW5kZXIgdGhlXG4gICAgICAgICAqIGxhc3QgZG9jdW1lbnQgdGhhdCB3aWxsIGJlIEFERCdkIHRvIHRoZSBGaWxlQ2FjaGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEluIHN1Y2ggYSBjYXNlIDxjb2RlPmlzUmVhZHk8L2NvZGU+IG1pZ2h0IHJldHVybiA8Y29kZT50cnVlPC9jb2RlPlxuICAgICAgICAgKiBidXQgbm90IGFsbCBmaWxlcyB3aWxsIGhhdmUgYmVlbiBBREQnZCB0byB0aGUgRmlsZUNhY2hlLlxuICAgICAgICAgKiBJbiB0aGF0IGNhc2UgPGNvZGU+ZG9jdW1lbnRzLmZpbmQ8L2NvZGU+IHJldHVybnNcbiAgICAgICAgICogPGNvZGU+dW5kZWZpbmVkPC9jb2RlPlxuICAgICAgICAgKlxuICAgICAgICAgKiBXaGF0IHRoaXMgZG9lcyBpcyB0cnkgdXAgdG8gMjAgdGltZXMgdG8gbG9hZCB0aGUgZG9jdW1lbnQsXG4gICAgICAgICAqIHNsZWVwaW5nIGZvciAxMDAgbWlsbGlzZWNvbmRzIGVhY2ggdGltZS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNsZWFuZXIgYWx0ZXJuYXRpdmUgd291bGQgYmUgdG8gd2FpdCBmb3Igbm90IG9ubHlcbiAgICAgICAgICogdGhlIDxjb2RlPnJlYWR5PC9jb2RlPiBmcm9tIHRoZSA8Y29kZT5kb2N1bWVudHM8L2NvZGU+IEZpbGVDYWNoZSxcbiAgICAgICAgICogYnV0IGFsc28gZm9yIGFsbCB0aGUgaW5pdGlhbCBBREQgZXZlbnRzIHRvIGJlIGhhbmRsZWQuICBCdXRcbiAgICAgICAgICogdGhhdCBzZWNvbmQgY29uZGl0aW9uIHNlZW1zIGRpZmZpY3VsdCB0byBkZXRlY3QgcmVsaWFibHkuXG4gICAgICAgICAqL1xuICAgICAgICBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHBhdGgycik7XG4gICAgICAgIGlmIChmb3VuZCkgYnJlYWs7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJQYXRoICR7cGF0aDJyfWAsIGZvdW5kKTtcbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRGlkIG5vdCBmaW5kIGRvY3VtZW50IGZvciAke3BhdGgycn1gKTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckRvY3VtZW50KGNvbmZpZywgZm91bmQpO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJQYXRoMihjb25maWcsIHBhdGgycikge1xuICAgIGNvbnN0IGRvY3VtZW50cyA9IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICBsZXQgZm91bmQ7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICB3aGlsZSAoY291bnQgPCAyMCkge1xuICAgICAgICAvKiBXaGF0J3MgaGFwcGVuaW5nIGlzIHRoaXMgbWlnaHQgYmUgY2FsbGVkIGZyb20gY2xpLmpzXG4gICAgICAgICAqIGluIHJlbmRlci1kb2N1bWVudCwgYW5kIHdlIG1pZ2h0IGJlIGFza2VkIHRvIHJlbmRlciB0aGVcbiAgICAgICAgICogbGFzdCBkb2N1bWVudCB0aGF0IHdpbGwgYmUgQUREJ2QgdG8gdGhlIEZpbGVDYWNoZS5cbiAgICAgICAgICpcbiAgICAgICAgICogSW4gc3VjaCBhIGNhc2UgPGNvZGU+aXNSZWFkeTwvY29kZT4gbWlnaHQgcmV0dXJuIDxjb2RlPnRydWU8L2NvZGU+XG4gICAgICAgICAqIGJ1dCBub3QgYWxsIGZpbGVzIHdpbGwgaGF2ZSBiZWVuIEFERCdkIHRvIHRoZSBGaWxlQ2FjaGUuXG4gICAgICAgICAqIEluIHRoYXQgY2FzZSA8Y29kZT5kb2N1bWVudHMuZmluZDwvY29kZT4gcmV0dXJuc1xuICAgICAgICAgKiA8Y29kZT51bmRlZmluZWQ8L2NvZGU+XG4gICAgICAgICAqXG4gICAgICAgICAqIFdoYXQgdGhpcyBkb2VzIGlzIHRyeSB1cCB0byAyMCB0aW1lcyB0byBsb2FkIHRoZSBkb2N1bWVudCxcbiAgICAgICAgICogc2xlZXBpbmcgZm9yIDEwMCBtaWxsaXNlY29uZHMgZWFjaCB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2xlYW5lciBhbHRlcm5hdGl2ZSB3b3VsZCBiZSB0byB3YWl0IGZvciBub3Qgb25seVxuICAgICAgICAgKiB0aGUgPGNvZGU+cmVhZHk8L2NvZGU+IGZyb20gdGhlIDxjb2RlPmRvY3VtZW50czwvY29kZT4gRmlsZUNhY2hlLFxuICAgICAgICAgKiBidXQgYWxzbyBmb3IgYWxsIHRoZSBpbml0aWFsIEFERCBldmVudHMgdG8gYmUgaGFuZGxlZC4gIEJ1dFxuICAgICAgICAgKiB0aGF0IHNlY29uZCBjb25kaXRpb24gc2VlbXMgZGlmZmljdWx0IHRvIGRldGVjdCByZWxpYWJseS5cbiAgICAgICAgICovXG4gICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aDJyKTtcbiAgICAgICAgaWYgKGZvdW5kKSBicmVhaztcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlclBhdGggJHtwYXRoMnJ9YCwgZm91bmQpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEaWQgbm90IGZpbmQgZG9jdW1lbnQgZm9yICR7cGF0aDJyfWApO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVuZGVyRG9jdW1lbnQyKGNvbmZpZywgZm91bmQpO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmVhZHMgYSBmaWxlIGZyb20gdGhlIHJlbmRlcmluZyBkaXJlY3RvcnkuICBJdCBpcyBwcmltYXJpbHkgdG8gYmVcbiAqIHVzZWQgaW4gdGVzdCBjYXNlcywgd2hlcmUgd2UnbGwgcnVuIGEgYnVpbGQgdGhlbiByZWFkIHRoZSBpbmRpdmlkdWFsXG4gKiBmaWxlcyB0byBtYWtlIHN1cmUgdGhleSd2ZSByZW5kZXJlZCBjb3JyZWN0bHkuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIFxuICogQHBhcmFtIHsqfSBmcGF0aCBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFJlbmRlcmVkRmlsZShjb25maWcsIGZwYXRoKSB7XG5cbiAgICBsZXQgaHRtbCA9IGF3YWl0IGZzcC5yZWFkRmlsZShwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCBmcGF0aCksICd1dGY4Jyk7XG4gICAgbGV0ICQgPSBjb25maWcubWFoYWJodXRhQ29uZmlnIFxuICAgICAgICAgICAgPyBjaGVlcmlvLmxvYWQoaHRtbCwgY29uZmlnLm1haGFiaHV0YUNvbmZpZykgXG4gICAgICAgICAgICA6IGNoZWVyaW8ubG9hZChodG1sKTtcblxuICAgIHJldHVybiB7IGh0bWwsICQgfTtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgcGFydGlhbCB0ZW1wbGF0ZSB1c2luZyB0aGUgc3VwcGxpZWQgbWV0YWRhdGEuICBUaGlzIHZlcnNpb25cbiAqIGFsbG93cyBmb3IgYXN5bmNocm9ub3VzIGV4ZWN1dGlvbiwgYW5kIGV2ZXJ5IGJpdCBvZiBjb2RlIGl0XG4gKiBleGVjdXRlcyBpcyBhbGxvd2VkIHRvIGJlIGFzeW5jLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAqIEBwYXJhbSB7Kn0gZm5hbWUgUGF0aCB3aXRoaW4gdGhlIGZpbGVjYWNoZS5wYXJ0aWFscyBjYWNoZVxuICogQHBhcmFtIHsqfSBtZXRhZGF0YSBPYmplY3QgY29udGFpbmluZyBtZXRhZGF0YVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHJlbmRlcmVkIHN0dWZmXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKSB7XG5cbiAgICBpZiAoIWZuYW1lIHx8IHR5cGVvZiBmbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBwYXJ0aWFsIGZuYW1lIG5vdCBhIHN0cmluZyAke3V0aWwuaW5zcGVjdChmbmFtZSl9YCk7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgJHtmbmFtZX1gKTtcbiAgICBjb25zdCBmb3VuZCA9IGF3YWl0IGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLmZpbmQoZm5hbWUpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBwYXJ0aWFsIGZvdW5kIGZvciAke2ZuYW1lfSBpbiAke3V0aWwuaW5zcGVjdChjb25maWcucGFydGlhbHNEaXJzKX1gKTtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgJHtmbmFtZX0gPT0+ICR7Zm91bmQudnBhdGh9ICR7Zm91bmQuZnNwYXRofWApO1xuICAgIFxuICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZm91bmQudnBhdGgpO1xuICAgIGlmIChyZW5kZXJlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCBhYm91dCB0byByZW5kZXIgJHt1dGlsLmluc3BlY3QoZm91bmQudnBhdGgpfWApO1xuICAgICAgICBsZXQgcGFydGlhbFRleHQ7XG4gICAgICAgIGlmIChmb3VuZC5kb2NCb2R5KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0JvZHk7XG4gICAgICAgIGVsc2UgaWYgKGZvdW5kLmRvY0JvZHkpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQm9keTtcbiAgICAgICAgZWxzZSBwYXJ0aWFsVGV4dCA9IGF3YWl0IGZzcC5yZWFkRmlsZShmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG5cbiAgICAgICAgLy8gU29tZSByZW5kZXJlcnMgKE51bmp1a3MpIHJlcXVpcmUgdGhhdCBtZXRhZGF0YS5jb25maWdcbiAgICAgICAgLy8gcG9pbnQgdG8gdGhlIGNvbmZpZyBvYmplY3QuICBUaGlzIGJsb2NrIG9mIGNvZGVcbiAgICAgICAgLy8gZHVwbGljYXRlcyB0aGUgbWV0YWRhdGEgb2JqZWN0LCB0aGVuIHNldHMgdGhlXG4gICAgICAgIC8vIGNvbmZpZyBmaWVsZCBpbiB0aGUgZHVwbGljYXRlLCBwYXNzaW5nIHRoYXQgdG8gdGhlIHBhcnRpYWwuXG4gICAgICAgIGxldCBtZGF0YTogYW55ID0ge307XG4gICAgICAgIGxldCBwcm9wO1xuXG4gICAgICAgIGZvciAocHJvcCBpbiBtZXRhZGF0YSkge1xuICAgICAgICAgICAgbWRhdGFbcHJvcF0gPSBtZXRhZGF0YVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBtZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgICAgIG1kYXRhLnBhcnRpYWxTeW5jID0gcGFydGlhbFN5bmMuYmluZChyZW5kZXJlciwgY29uZmlnKTtcbiAgICAgICAgbWRhdGEucGFydGlhbCAgICAgPSBwYXJ0aWFsLmJpbmQocmVuZGVyZXIsIGNvbmZpZyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsLWZ1bmNzIHJlbmRlciAke3JlbmRlcmVyLm5hbWV9ICR7Zm91bmQudnBhdGh9YCk7XG4gICAgICAgIHJldHVybiByZW5kZXJlci5yZW5kZXIoe1xuICAgICAgICAgICAgZnNwYXRoOiBmb3VuZC5mc3BhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBwYXJ0aWFsVGV4dCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBtZGF0YVxuICAgICAgICAgICAgLy8gcGFydGlhbFRleHQsIG1kYXRhLCBmb3VuZFxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcuaHRtbCcpIHx8IGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcueGh0bWwnKSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCByZWFkaW5nIGZpbGUgJHtmb3VuZC52cGF0aH1gKTtcbiAgICAgICAgcmV0dXJuIGZzcC5yZWFkRmlsZShmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW5kZXJQYXJ0aWFsIG5vIFJlbmRlcmVyIGZvdW5kIGZvciAke2ZuYW1lfSAtICR7Zm91bmQudnBhdGh9YCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBwYXJ0aWFsIHRlbXBsYXRlIHVzaW5nIHRoZSBzdXBwbGllZCBtZXRhZGF0YS4gIFRoaXMgdmVyc2lvblxuICogYWxsb3dzIGZvciBzeW5jaHJvbm91cyBleGVjdXRpb24sIGFuZCBldmVyeSBiaXQgb2YgY29kZSBpdFxuICogZXhlY3V0ZXMgaXMgc3luY2hyb25vdXMgZnVuY3Rpb25zLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAqIEBwYXJhbSB7Kn0gZm5hbWUgUGF0aCB3aXRoaW4gdGhlIGZpbGVjYWNoZS5wYXJ0aWFscyBjYWNoZVxuICogQHBhcmFtIHsqfSBtZXRhZGF0YSBPYmplY3QgY29udGFpbmluZyBtZXRhZGF0YVxuICogQHJldHVybnMgU3RyaW5nIGNvbnRhaW5pbmcgdGhlIHJlbmRlcmVkIHN0dWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSkge1xuXG4gICAgaWYgKCFmbmFtZSB8fCB0eXBlb2YgZm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcGFydGlhbFN5bmMgZm5hbWUgbm90IGEgc3RyaW5nICR7dXRpbC5pbnNwZWN0KGZuYW1lKX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBmb3VuZCA9IGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLmZpbmRTeW5jKGZuYW1lKTtcbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcGFydGlhbCBmb3VuZCBmb3IgJHtmbmFtZX0gaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLnBhcnRpYWxzRGlycyl9YCk7XG4gICAgfVxuXG4gICAgdmFyIHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZm91bmQudnBhdGgpO1xuICAgIGlmIChyZW5kZXJlcikge1xuICAgICAgICAvLyBTb21lIHJlbmRlcmVycyAoTnVuanVrcykgcmVxdWlyZSB0aGF0IG1ldGFkYXRhLmNvbmZpZ1xuICAgICAgICAvLyBwb2ludCB0byB0aGUgY29uZmlnIG9iamVjdC4gIFRoaXMgYmxvY2sgb2YgY29kZVxuICAgICAgICAvLyBkdXBsaWNhdGVzIHRoZSBtZXRhZGF0YSBvYmplY3QsIHRoZW4gc2V0cyB0aGVcbiAgICAgICAgLy8gY29uZmlnIGZpZWxkIGluIHRoZSBkdXBsaWNhdGUsIHBhc3NpbmcgdGhhdCB0byB0aGUgcGFydGlhbC5cbiAgICAgICAgbGV0IG1kYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgbGV0IHByb3A7XG5cbiAgICAgICAgZm9yIChwcm9wIGluIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICBtZGF0YVtwcm9wXSA9IG1ldGFkYXRhW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIG1kYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgLy8gSW4gdGhpcyBjb250ZXh0LCBwYXJ0aWFsU3luYyBpcyBkaXJlY3RseSBhdmFpbGFibGVcbiAgICAgICAgLy8gYXMgYSBmdW5jdGlvbiB0aGF0IHdlIGNhbiBkaXJlY3RseSB1c2UuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsU3luYyBgLCBwYXJ0aWFsU3luYyk7XG4gICAgICAgIG1kYXRhLnBhcnRpYWxTeW5jID0gcGFydGlhbFN5bmMuYmluZChyZW5kZXJlciwgY29uZmlnKTtcbiAgICAgICAgLy8gZm9yIGZpbmRTeW5jLCB0aGUgXCJmb3VuZFwiIG9iamVjdCBpcyBWUGF0aERhdGEgd2hpY2hcbiAgICAgICAgLy8gZG9lcyBub3QgaGF2ZSBkb2NCb2R5IG5vciBkb2NDb250ZW50LiAgVGhlcmVmb3JlIHdlXG4gICAgICAgIC8vIG11c3QgcmVhZCB0aGlzIGNvbnRlbnRcbiAgICAgICAgbGV0IHBhcnRpYWxUZXh0ID0gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0Zi04Jyk7XG4gICAgICAgIC8vIGlmIChmb3VuZC5kb2NCb2R5KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0JvZHk7XG4gICAgICAgIC8vIGVsc2UgaWYgKGZvdW5kLmRvY0NvbnRlbnQpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQ29udGVudDtcbiAgICAgICAgLy8gZWxzZSBwYXJ0aWFsVGV4dCA9IGZzLnJlYWRGaWxlU3luYyhmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbC1mdW5jcyByZW5kZXJTeW5jICR7cmVuZGVyZXIubmFtZX0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyLnJlbmRlclN5bmMoPFJlbmRlcmVycy5SZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgICAgIGZzcGF0aDogZm91bmQuZnNwYXRoLFxuICAgICAgICAgICAgY29udGVudDogcGFydGlhbFRleHQsXG4gICAgICAgICAgICBtZXRhZGF0YTogbWRhdGFcbiAgICAgICAgICAgIC8vIHBhcnRpYWxUZXh0LCBtZGF0YSwgZm91bmRcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChmb3VuZC52cGF0aC5lbmRzV2l0aCgnLmh0bWwnKSB8fCBmb3VuZC52cGF0aC5lbmRzV2l0aCgnLnhodG1sJykpIHtcbiAgICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW5kZXJQYXJ0aWFsIG5vIFJlbmRlcmVyIGZvdW5kIGZvciAke2ZuYW1lfSAtICR7Zm91bmQudnBhdGh9YCk7XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBpbmRleENoYWluSXRlbSA9IHtcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgZm91bmRQYXRoOiBzdHJpbmc7XG4gICAgZm91bmREaXI6IHN0cmluZztcbiAgICBmaWxlbmFtZTogc3RyaW5nO1xufTtcblxuLyoqXG4gKiBTdGFydGluZyBmcm9tIGEgdmlydHVhbCBwYXRoIGluIHRoZSBkb2N1bWVudHMsIHNlYXJjaGVzIHVwd2FyZHMgdG9cbiAqIHRoZSByb290IG9mIHRoZSBkb2N1bWVudHMgZmlsZS1zcGFjZSwgZmluZGluZyBmaWxlcyB0aGF0IFxuICogcmVuZGVyIHRvIFwiaW5kZXguaHRtbFwiLiAgVGhlIFwiaW5kZXguaHRtbFwiIGZpbGVzIGFyZSBpbmRleCBmaWxlcyxcbiAqIGFzIHRoZSBuYW1lIHN1Z2dlc3RzLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBcbiAqIEBwYXJhbSB7Kn0gZm5hbWUgXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluZGV4Q2hhaW4oXG4gICAgY29uZmlnLCBmbmFtZVxuKTogUHJvbWlzZTxpbmRleENoYWluSXRlbVtdPiB7XG5cbiAgICAvLyBUaGlzIHVzZWQgdG8gYmUgYSBmdWxsIGZ1bmN0aW9uIGhlcmUsIGJ1dCBoYXMgbW92ZWRcbiAgICAvLyBpbnRvIHRoZSBGaWxlQ2FjaGUgY2xhc3MuICBSZXF1aXJpbmcgYSBgY29uZmlnYCBvcHRpb25cbiAgICAvLyBpcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgZm9ybWVyIEFQSS5cblxuICAgIGNvbnN0IGRvY3VtZW50cyA9IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICByZXR1cm4gZG9jdW1lbnRzLmluZGV4Q2hhaW4oZm5hbWUpO1xufVxuXG5cbi8qKlxuICogTWFuaXB1bGF0ZSB0aGUgcmVsPSBhdHRyaWJ1dGVzIG9uIGEgbGluayByZXR1cm5lZCBmcm9tIE1haGFiaHV0YS5cbiAqXG4gKiBAcGFyYW1zIHskbGlua30gVGhlIGxpbmsgdG8gbWFuaXB1bGF0ZVxuICogQHBhcmFtcyB7YXR0cn0gVGhlIGF0dHJpYnV0ZSBuYW1lXG4gKiBAcGFyYW1zIHtkb2F0dHJ9IEJvb2xlYW4gZmxhZyB3aGV0aGVyIHRvIHNldCAodHJ1ZSkgb3IgcmVtb3ZlIChmYWxzZSkgdGhlIGF0dHJpYnV0ZVxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbmtSZWxTZXRBdHRyKCRsaW5rLCBhdHRyLCBkb2F0dHIpIHtcbiAgICBsZXQgbGlua3JlbCA9ICRsaW5rLmF0dHIoJ3JlbCcpO1xuICAgIGxldCByZWxzID0gbGlua3JlbCA/IGxpbmtyZWwuc3BsaXQoJyAnKSA6IFtdO1xuICAgIGxldCBoYXNhdHRyID0gcmVscy5pbmRleE9mKGF0dHIpID49IDA7XG4gICAgaWYgKCFoYXNhdHRyICYmIGRvYXR0cikge1xuICAgICAgICByZWxzLnVuc2hpZnQoYXR0cik7XG4gICAgICAgICRsaW5rLmF0dHIoJ3JlbCcsIHJlbHMuam9pbignICcpKTtcbiAgICB9IGVsc2UgaWYgKGhhc2F0dHIgJiYgIWRvYXR0cikge1xuICAgICAgICByZWxzLnNwbGljZShyZWxzLmluZGV4T2YoYXR0cikpO1xuICAgICAgICAkbGluay5hdHRyKCdyZWwnLCByZWxzLmpvaW4oJyAnKSk7XG4gICAgfVxufTtcblxuLy8vLy8vLy8vLy8vLy8vLy8gUlNTIEZlZWQgR2VuZXJhdGlvblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVSU1MoY29uZmlnLCBjb25maWdyc3MsIGZlZWREYXRhLCBpdGVtcywgcmVuZGVyVG8pIHtcblxuICAgIC8vIFN1cHBvc2VkbHkgaXQncyByZXF1aXJlZCB0byB1c2UgaGFzT3duUHJvcGVydHlcbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzcyODM2MC9ob3ctZG8taS1jb3JyZWN0bHktY2xvbmUtYS1qYXZhc2NyaXB0LW9iamVjdCM3Mjg2OTRcbiAgICAvL1xuICAgIC8vIEJ1dCwgaW4gb3VyIGNhc2UgdGhhdCByZXN1bHRlZCBpbiBhbiBlbXB0eSBvYmplY3RcblxuICAgIC8vIGNvbnNvbGUubG9nKCdjb25maWdyc3MgJysgdXRpbC5pbnNwZWN0KGNvbmZpZ3JzcykpO1xuXG4gICAgLy8gQ29uc3RydWN0IGluaXRpYWwgcnNzIG9iamVjdFxuICAgIHZhciByc3MgPSB7fTtcbiAgICBmb3IgKGxldCBrZXkgaW4gY29uZmlncnNzLnJzcykge1xuICAgICAgICAvL2lmIChjb25maWdyc3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcnNzW2tleV0gPSBjb25maWdyc3MucnNzW2tleV07XG4gICAgICAgIC8vfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKCdyc3MgJysgdXRpbC5pbnNwZWN0KHJzcykpO1xuXG4gICAgLy8gY29uc29sZS5sb2coJ2ZlZWREYXRhICcrIHV0aWwuaW5zcGVjdChmZWVkRGF0YSkpO1xuXG4gICAgLy8gVGhlbiBmaWxsIGluIGZyb20gZmVlZERhdGFcbiAgICBmb3IgKGxldCBrZXkgaW4gZmVlZERhdGEpIHtcbiAgICAgICAgLy9pZiAoZmVlZERhdGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcnNzW2tleV0gPSBmZWVkRGF0YVtrZXldO1xuICAgICAgICAvL31cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZygnZ2VuZXJhdGVSU1MgcnNzICcrIHV0aWwuaW5zcGVjdChyc3MpKTtcblxuICAgIHZhciByc3NmZWVkID0gbmV3IFJTUyhyc3MpO1xuXG4gICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7IHJzc2ZlZWQuaXRlbShpdGVtKTsgfSk7XG5cbiAgICB2YXIgeG1sID0gcnNzZmVlZC54bWwoKTtcbiAgICB2YXIgcmVuZGVyT3V0ID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgcmVuZGVyVG8pO1xuXG4gICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJPdXQpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxuICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyT3V0LCB4bWwsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcblxufTtcblxuLy8gRm9yIG9FbWJlZCwgQ29uc2lkZXIgbWFraW5nIGFuIGV4dGVybmFsIHBsdWdpblxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvb2VtYmVkLWFsbFxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvZW1iZWRhYmxlXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9tZWRpYS1wYXJzZXJcbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL29lbWJldHRlclxuXG5cbi8qKlxuICogVGhlIEFrYXNoYVJlbmRlciBwcm9qZWN0IGNvbmZpZ3VyYXRpb24gb2JqZWN0LiAgXG4gKiBPbmUgaW5zdGFudGlhdGVzIGEgQ29uZmlndXJhdGlvbiBvYmplY3QsIHRoZW4gZmlsbHMgaXRcbiAqIHdpdGggc2V0dGluZ3MgYW5kIHBsdWdpbnMuXG4gKiBcbiAqIEBzZWUgbW9kdWxlOkNvbmZpZ3VyYXRpb25cbiAqL1xuXG4vLyBjb25zdCBfY29uZmlnX3BsdWdpbkRhdGEgPSBTeW1ib2woJ3BsdWdpbkRhdGEnKTtcbi8vIGNvbnN0IF9jb25maWdfYXNzZXRzRGlycyA9IFN5bWJvbCgnYXNzZXRzRGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19kb2N1bWVudERpcnMgPSBTeW1ib2woJ2RvY3VtZW50RGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19sYXlvdXREaXJzID0gU3ltYm9sKCdsYXlvdXREaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX3BhcnRpYWxEaXJzID0gU3ltYm9sKCdwYXJ0aWFsRGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19tYWhhZnVuY3MgPSBTeW1ib2woJ21haGFmdW5jcycpO1xuLy8gY29uc3QgX2NvbmZpZ19yZW5kZXJUbyA9IFN5bWJvbCgncmVuZGVyVG8nKTtcbi8vIGNvbnN0IF9jb25maWdfbWV0YWRhdGEgPSBTeW1ib2woJ21ldGFkYXRhJyk7XG4vLyBjb25zdCBfY29uZmlnX3Jvb3RfdXJsID0gU3ltYm9sKCdyb290X3VybCcpO1xuLy8gY29uc3QgX2NvbmZpZ19zY3JpcHRzID0gU3ltYm9sKCdzY3JpcHRzJyk7XG4vLyBjb25zdCBfY29uZmlnX3BsdWdpbnMgPSBTeW1ib2woJ3BsdWdpbnMnKTtcbi8vIGNvbnN0IF9jb25maWdfY2hlZXJpbyA9IFN5bWJvbCgnY2hlZXJpbycpO1xuLy8gY29uc3QgX2NvbmZpZ19jb25maWdkaXIgPSBTeW1ib2woJ2NvbmZpZ2RpcicpO1xuLy8gY29uc3QgX2NvbmZpZ19jYWNoZWRpciAgPSBTeW1ib2woJ2NhY2hlZGlyJyk7XG4vLyBjb25zdCBfY29uZmlnX2NvbmN1cnJlbmN5ID0gU3ltYm9sKCdjb25jdXJyZW5jeScpO1xuLy8gY29uc3QgX2NvbmZpZ19yZW5kZXJlcnMgPSBTeW1ib2woJ3JlbmRlcmVycycpO1xuXG4vKipcbiAqIERhdGEgdHlwZSBkZXNjcmliaW5nIGl0ZW1zIGluIHRoZVxuICogamF2YVNjcmlwdFRvcCBhbmQgamF2YVNjcmlwdEJvdHRvbSBhcnJheXMuXG4gKiBUaGUgZmllbGRzIGNvcnJlc3BvbmQgdG8gdGhlIGF0dHJpYnV0ZXNcbiAqIG9mIHRoZSA8c2NyaXB0PiB0YWcgd2hpY2ggY2FuIGJlIHVzZWRcbiAqIGVpdGhlciBpbiB0aGUgdG9wIG9yIGJvdHRvbSBvZlxuICogYW4gSFRNTCBmaWxlLlxuICovXG5leHBvcnQgdHlwZSBqYXZhU2NyaXB0SXRlbSA9IHtcbiAgICBocmVmPzogc3RyaW5nLFxuICAgIHNjcmlwdD86IHN0cmluZyxcbiAgICBsYW5nPzogc3RyaW5nXG59O1xuXG5leHBvcnQgdHlwZSBzdHlsZXNoZWV0SXRlbSA9IHtcbiAgICBocmVmPzogc3RyaW5nLFxuICAgIG1lZGlhPzogc3RyaW5nXG5cbn07XG5cbi8qKlxuICogRGVmaW5lcyB0aGUgc3RydWN0dXJlIGZvciBkaXJlY3RvcnlcbiAqIG1vdW50IHNwZWNpZmljYXRpb24gaW4gdGhlIENvbmZpZ3VyYXRpb24uXG4gKiBcbiAqIFRoZSBzaW1wbGUgJ3N0cmluZycgZm9ybSBzYXlzIHRvIG1vdW50XG4gKiB0aGUgbmFtZWQgZnNwYXRoIG9uIHRoZSByb290IG9mIHRoZVxuICogdmlydHVhbCBmaWxlc3BhY2UuXG4gKiBcbiAqIFRoZSBvYmplY3QgZm9ybSBhbGxvd3MgdXMgdG8gbW91bnRcbiAqIGFuIGZzcGF0aCBpbnRvIGEgZGlmZmVyZW50IGxvY2F0aW9uXG4gKiBpbiB0aGUgdmlydHVhbCBmaWxlc3BhY2UsIHRvIGlnbm9yZVxuICogZmlsZXMgYmFzZWQgb24gR0xPQiBwYXR0ZXJucywgYW5kIHRvXG4gKiBpbmNsdWRlIG1ldGFkYXRhIGZvciBldmVyeSBmaWxlIGluXG4gKiBhIGRpcmVjdG9yeSB0cmVlLlxuICogXG4gKiBJbiB0aGUgZmlsZS1jYWNoZSBtb2R1bGUsIHRoaXMgaXNcbiAqIGNvbnZlcnRlZCB0byB0aGUgZGlyVG9XYXRjaCBzdHJ1Y3R1cmVcbiAqIHVzZWQgYnkgU3RhY2tlZERpcnMuXG4gKi9cbi8qKlxuICogQ29uZmlndXJhdGlvbiBvZiBhbiBBa2FzaGFSZW5kZXIgcHJvamVjdCwgaW5jbHVkaW5nIHRoZSBpbnB1dCBkaXJlY3RvcmllcyxcbiAqIG91dHB1dCBkaXJlY3RvcnksIHBsdWdpbnMsIGFuZCB2YXJpb3VzIHNldHRpbmdzLlxuICpcbiAqIFVTQUdFOlxuICpcbiAqIGNvbnN0IGFrYXNoYSA9IHJlcXVpcmUoJ2FrYXNoYXJlbmRlcicpO1xuICogY29uc3QgY29uZmlnID0gbmV3IGFrYXNoYS5Db25maWd1cmF0aW9uKCk7XG4gKi9cbmV4cG9ydCBjbGFzcyBDb25maWd1cmF0aW9uIHtcbiAgICAjcmVuZGVyZXJzOiBSZW5kZXJlcnMuQ29uZmlndXJhdGlvbjtcbiAgICAjY29uZmlnZGlyOiBzdHJpbmc7XG4gICAgI2NhY2hlZGlyOiBzdHJpbmc7XG4gICAgI2Fzc2V0c0RpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2xheW91dERpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2RvY3VtZW50RGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjcGFydGlhbERpcnM/OiBkaXJUb01vdW50W107XG4gICAgI21haGFmdW5jcztcbiAgICAjY2hlZXJpbz86IGNoZWVyaW8uQ2hlZXJpb09wdGlvbnM7XG4gICAgI3JlbmRlclRvOiBzdHJpbmc7XG4gICAgI3NjcmlwdHM/OiB7XG4gICAgICAgIHN0eWxlc2hlZXRzPzogc3R5bGVzaGVldEl0ZW1bXSxcbiAgICAgICAgamF2YVNjcmlwdFRvcD86IGphdmFTY3JpcHRJdGVtW10sXG4gICAgICAgIGphdmFTY3JpcHRCb3R0b20/OiBqYXZhU2NyaXB0SXRlbVtdXG4gICAgfTtcbiAgICAjY29uY3VycmVuY3k6IG51bWJlcjtcbiAgICAjY2FjaGluZ1RpbWVvdXQ6IG51bWJlcjtcbiAgICAjbWV0YWRhdGE6IGFueTtcbiAgICAjcm9vdF91cmw6IHN0cmluZztcbiAgICAjcGx1Z2lucztcbiAgICAjcGx1Z2luRGF0YTtcbiAgICAjdmVyYm9zZTogYm9vbGVhbjtcbiAgICAjcGVyZkRhdGFEaXI6IHN0cmluZztcbiAgICBcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGVwYXRoKSB7XG5cbiAgICAgICAgLy8gdGhpc1tfY29uZmlnX3JlbmRlcmVyc10gPSBbXTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzID0gbmV3IFJlbmRlcmVycy5Db25maWd1cmF0aW9uKHtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MgPSBbXTtcbiAgICAgICAgdGhpcy4jc2NyaXB0cyA9IHtcbiAgICAgICAgICAgIHN0eWxlc2hlZXRzOiBbXSxcbiAgICAgICAgICAgIGphdmFTY3JpcHRUb3A6IFtdLFxuICAgICAgICAgICAgamF2YVNjcmlwdEJvdHRvbTogW11cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLiNjb25jdXJyZW5jeSA9IDM7XG4gICAgICAgIC8vIDYwIHNlY29uZHMsIG9yIDEgbWludXRlXG4gICAgICAgIHRoaXMuI2NhY2hpbmdUaW1lb3V0ID0gNjAwMDA7XG5cbiAgICAgICAgdGhpcy4jZG9jdW1lbnREaXJzID0gW107XG4gICAgICAgIHRoaXMuI2xheW91dERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jcGFydGlhbERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jYXNzZXRzRGlycyA9IFtdO1xuXG4gICAgICAgIHRoaXMuI21haGFmdW5jcyA9IFtdO1xuXG4gICAgICAgIHRoaXMuI3JlbmRlclRvID0gJ291dCc7XG5cbiAgICAgICAgdGhpcy4jbWV0YWRhdGEgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgdGhpcy4jcGx1Z2lucyA9IFtdO1xuICAgICAgICB0aGlzLiNwbHVnaW5EYXRhID0gW107XG4gICAgICAgIFxuICAgICAgICB0aGlzLiN2ZXJib3NlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy4jcGVyZkRhdGFEaXIgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgLypcbiAgICAgICAgICogSXMgdGhpcyB0aGUgYmVzdCBwbGFjZSBmb3IgdGhpcz8gIEl0IGlzIG5lY2Vzc2FyeSB0b1xuICAgICAgICAgKiBjYWxsIHRoaXMgZnVuY3Rpb24gc29tZXdoZXJlLiAgVGhlIG5hdHVyZSBvZiB0aGlzIGZ1bmN0aW9uXG4gICAgICAgICAqIGlzIHRoYXQgaXQgY2FuIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyB3aXRoIG5vIGltcGFjdC4gIFxuICAgICAgICAgKiBCeSBiZWluZyBsb2NhdGVkIGhlcmUsIGl0IHdpbGwgYWx3YXlzIGJlIGNhbGxlZCBieSB0aGVcbiAgICAgICAgICogdGltZSBhbnkgQ29uZmlndXJhdGlvbiBpcyBnZW5lcmF0ZWQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUaGlzIGlzIGV4ZWN1dGVkIGluIEBha2FzaGFjbXMvcmVuZGVyZXJzXG4gICAgICAgIC8vIHRoaXNbX2NvbmZpZ19yZW5kZXJlcnNdLnJlZ2lzdGVyQnVpbHRJblJlbmRlcmVycygpO1xuXG4gICAgICAgIC8vIFByb3ZpZGUgYSBtZWNoYW5pc20gdG8gZWFzaWx5IHNwZWNpZnkgY29uZmlnRGlyXG4gICAgICAgIC8vIFRoZSBwYXRoIGluIGNvbmZpZ0RpciBtdXN0IGJlIHRoZSBwYXRoIG9mIHRoZSBjb25maWd1cmF0aW9uIGZpbGUuXG4gICAgICAgIC8vIFRoZXJlIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIGEgd2F5IHRvIGRldGVybWluZSB0aGF0IGZyb20gaGVyZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRm9yIGV4YW1wbGUgbW9kdWxlLnBhcmVudC5maWxlbmFtZSBpbiB0aGlzIGNhc2UgcG9pbnRzXG4gICAgICAgIC8vIHRvIGFrYXNoYXJlbmRlci9pbmRleC5qcyBiZWNhdXNlIHRoYXQncyB0aGUgbW9kdWxlIHdoaWNoXG4gICAgICAgIC8vIGxvYWRlZCB0aGlzIG1vZHVsZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gT25lIGNvdWxkIGltYWdpbmUgYSBkaWZmZXJlbnQgaW5pdGlhbGl6YXRpb24gcGF0dGVybi4gIEluc3RlYWRcbiAgICAgICAgLy8gb2YgYWthc2hhcmVuZGVyIHJlcXVpcmluZyBDb25maWd1cmF0aW9uLmpzLCB0aGF0IGZpbGUgY291bGQgYmVcbiAgICAgICAgLy8gcmVxdWlyZWQgYnkgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZS4gIEluIHN1Y2ggYSBjYXNlXG4gICAgICAgIC8vIG1vZHVsZS5wYXJlbnQuZmlsZW5hbWUgV09VTEQgaW5kaWNhdGUgdGhlIGZpbGVuYW1lIGZvciB0aGVcbiAgICAgICAgLy8gY29uZmlndXJhdGlvbiBmaWxlLCBhbmQgd291bGQgYmUgYSBzb3VyY2Ugb2Ygc2V0dGluZ1xuICAgICAgICAvLyB0aGUgY29uZmlnRGlyIHZhbHVlLlxuICAgICAgICBpZiAodHlwZW9mIG1vZHVsZXBhdGggIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZXBhdGggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnRGlyID0gcGF0aC5kaXJuYW1lKG1vZHVsZXBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVyeSBjYXJlZnVsbHkgYWRkIHRoZSA8cGFydGlhbD4gc3VwcG9ydCBmcm9tIE1haGFiaHV0YSBhcyB0aGVcbiAgICAgICAgLy8gdmVyeSBmaXJzdCB0aGluZyBzbyB0aGF0IGl0IGV4ZWN1dGVzIGJlZm9yZSBhbnl0aGluZyBlbHNlLlxuICAgICAgICBsZXQgY29uZmlnID0gdGhpcztcbiAgICAgICAgdGhpcy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZm5hbWUsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGRlZmF1bHQgY29uZmlndXJhdGlvbiB2YWx1ZXMgZm9yIGFueXRoaW5nIHdoaWNoIGhhcyBub3RcbiAgICAgKiBhbHJlYWR5IGJlZW4gY29uZmlndXJlZC4gIFNvbWUgYnVpbHQtaW4gZGVmYXVsdHMgaGF2ZSBiZWVuIGRlY2lkZWRcbiAgICAgKiBhaGVhZCBvZiB0aW1lLiAgRm9yIGVhY2ggY29uZmlndXJhdGlvbiBzZXR0aW5nLCBpZiBub3RoaW5nIGhhcyBiZWVuXG4gICAgICogZGVjbGFyZWQsIHRoZW4gdGhlIGRlZmF1bHQgaXMgc3Vic3RpdHV0ZWQuXG4gICAgICpcbiAgICAgKiBJdCBpcyBleHBlY3RlZCB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGxhc3QgaW4gdGhlIGNvbmZpZyBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBpbnN0YWxscyB0aGUgYGJ1aWx0LWluYCBwbHVnaW4uICBJdCBuZWVkcyB0byBiZSBsYXN0IG9uXG4gICAgICogdGhlIHBsdWdpbiBjaGFpbiBzbyB0aGF0IGl0cyBzdHlsZXNoZWV0cyBhbmQgcGFydGlhbHMgYW5kIHdoYXRub3RcbiAgICAgKiBjYW4gYmUgb3ZlcnJpZGRlbiBieSBvdGhlciBwbHVnaW5zLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgcHJlcGFyZSgpIHtcblxuICAgICAgICBjb25zdCBDT05GSUcgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IGNvbmZpZ0RpclBhdGggPSBmdW5jdGlvbihkaXJubSkge1xuICAgICAgICAgICAgbGV0IGNvbmZpZ1BhdGggPSBkaXJubTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgQ09ORklHLmNvbmZpZ0RpciAhPT0gJ3VuZGVmaW5lZCcgJiYgQ09ORklHLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnUGF0aCA9IHBhdGguam9pbihDT05GSUcuY29uZmlnRGlyLCBkaXJubSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29uZmlnUGF0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzdGF0O1xuXG4gICAgICAgIGNvbnN0IGNhY2hlRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdjYWNoZScpO1xuICAgICAgICBpZiAoIXRoaXMuI2NhY2hlZGlyKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjYWNoZURpcnNQYXRoKVxuICAgICAgICAgICAgICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoY2FjaGVEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhY2hlRGlyID0gJ2NhY2hlJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInY2FjaGUnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhjYWNoZURpcnNQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlRGlyID0gJ2NhY2hlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNjYWNoZWRpciAmJiAhZnMuZXhpc3RzU3luYyh0aGlzLiNjYWNoZWRpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLiNjYWNoZWRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldHNEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2Fzc2V0cycpO1xuICAgICAgICBpZiAoIXRoaXMuI2Fzc2V0c0RpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGFzc2V0c0RpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGFzc2V0c0RpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQXNzZXRzRGlyKCdhc3NldHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXlvdXRzRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdsYXlvdXRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jbGF5b3V0RGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobGF5b3V0c0RpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGxheW91dHNEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZExheW91dHNEaXIoJ2xheW91dHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJ0aWFsRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdwYXJ0aWFscycpO1xuICAgICAgICBpZiAoIW1haGFQYXJ0aWFsLmNvbmZpZ3VyYXRpb24ucGFydGlhbERpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhcnRpYWxEaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhwYXJ0aWFsRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRQYXJ0aWFsc0RpcigncGFydGlhbHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2N1bWVudERpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnZG9jdW1lbnRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jZG9jdW1lbnREaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhkb2N1bWVudERpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGRvY3VtZW50RGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGREb2N1bWVudHNEaXIoJ2RvY3VtZW50cycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidkb2N1bWVudHMnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vICdkb2N1bWVudERpcnMnIHNldHRpbmcsIGFuZCBubyAnZG9jdW1lbnRzJyBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZW5kZXJUb1BhdGggPSBjb25maWdEaXJQYXRoKCdvdXQnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNyZW5kZXJUbykgIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHJlbmRlclRvUGF0aClcbiAgICAgICAgICAgICAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKHJlbmRlclRvUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFJlbmRlckRlc3RpbmF0aW9uKCdvdXQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInb3V0JyBpcyBub3QgYSBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmMocmVuZGVyVG9QYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFJlbmRlckRlc3RpbmF0aW9uKCdvdXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNyZW5kZXJUbyAmJiAhZnMuZXhpc3RzU3luYyh0aGlzLiNyZW5kZXJUbykpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLiNyZW5kZXJUbywgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgYWthc2hhY21zLWJ1aWx0aW4gcGx1Z2luIG5lZWRzIHRvIGJlIGxhc3Qgb24gdGhlIGNoYWluIHNvIHRoYXRcbiAgICAgICAgLy8gaXRzIHBhcnRpYWxzIGV0YyBjYW4gYmUgZWFzaWx5IG92ZXJyaWRkZW4uICBUaGlzIGlzIHRoZSBtb3N0IGNvbnZlbmllbnRcbiAgICAgICAgLy8gcGxhY2UgdG8gZGVjbGFyZSB0aGF0IHBsdWdpbi5cbiAgICAgICAgLy9cblxuICAgICAgICAvLyBOb3JtYWxseSB3ZSdkIGRvIHJlcXVpcmUoJy4vYnVpbHQtaW4uanMnKS5cbiAgICAgICAgLy8gQnV0LCBpbiB0aGlzIGNvbnRleHQgdGhhdCBkb2Vzbid0IHdvcmsuXG4gICAgICAgIC8vIFdoYXQgd2UgZGlkIGlzIHRvIGltcG9ydCB0aGVcbiAgICAgICAgLy8gQnVpbHRJblBsdWdpbiBjbGFzcyBlYXJsaWVyIHNvIHRoYXRcbiAgICAgICAgLy8gaXQgY2FuIGJlIHVzZWQgaGVyZS5cbiAgICAgICAgdGhpcy51c2UoQnVpbHRJblBsdWdpbiwge1xuICAgICAgICAgICAgLy8gYnVpbHQtaW4gb3B0aW9ucyBpZiBhbnlcbiAgICAgICAgICAgIC8vIERvIG5vdCBuZWVkIHRoaXMgaGVyZSBhbnkgbG9uZ2VyIGJlY2F1c2UgaXQgaXMgaGFuZGxlZFxuICAgICAgICAgICAgLy8gaW4gdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgICAgICAgLy8gU2V0IHVwIHRoZSBNYWhhYmh1dGEgcGFydGlhbCB0YWcgc28gaXQgcmVuZGVycyB0aHJvdWdoIEFrYXNoYVJlbmRlclxuICAgICAgICAgICAgLy8gcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZm5hbWUsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHJlbmRlci5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjb3JkIHRoZSBjb25maWd1cmF0aW9uIGRpcmVjdG9yeSBzbyB0aGF0IHdlIGNhbiBjb3JyZWN0bHkgaW50ZXJwb2xhdGVcbiAgICAgKiB0aGUgcGF0aG5hbWVzIHdlJ3JlIHByb3ZpZGVkLlxuICAgICAqL1xuICAgIHNldCBjb25maWdEaXIoY2ZnZGlyOiBzdHJpbmcpIHsgdGhpcy4jY29uZmlnZGlyID0gY2ZnZGlyOyB9XG4gICAgZ2V0IGNvbmZpZ0RpcigpIHsgcmV0dXJuIHRoaXMuI2NvbmZpZ2RpcjsgfVxuXG4gICAgc2V0IGNhY2hlRGlyKGRpcm5tOiBzdHJpbmcpIHsgdGhpcy4jY2FjaGVkaXIgPSBkaXJubTsgfVxuICAgIGdldCBjYWNoZURpcigpIHsgcmV0dXJuIHRoaXMuI2NhY2hlZGlyOyB9XG5cbiAgICBzZXQgdmVyYm9zZSh2YWw6IGJvb2xlYW4pIHsgdGhpcy4jdmVyYm9zZSA9IHZhbDsgfVxuICAgIGdldCB2ZXJib3NlKCkgeyByZXR1cm4gdGhpcy4jdmVyYm9zZTsgfVxuXG4gICAgc2V0IHBlcmZEYXRhRGlyKHN0b3JlRGlyOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy4jcGVyZkRhdGFEaXIgPSBzdG9yZURpcjtcbiAgICB9XG4gICAgZ2V0IHBlcmZEYXRhRGlyKCkgeyByZXR1cm4gdGhpcy4jcGVyZkRhdGFEaXI7IH1cblxuICAgIC8vIHNldCBha2FzaGEoX2FrYXNoYSkgIHsgdGhpc1tfY29uZmlnX2FrYXNoYV0gPSBfYWthc2hhOyB9XG4gICAgZ2V0IGFrYXNoYSgpIHsgcmV0dXJuIG1vZHVsZV9leHBvcnRzOyB9XG5cbiAgICBhc3luYyBkb2N1bWVudHNDYWNoZSgpIHsgcmV0dXJuIGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTsgfVxuICAgIGFzeW5jIGFzc2V0c0NhY2hlKCkgICAgeyByZXR1cm4gZmlsZWNhY2hlLmFzc2V0c0NhY2hlOyB9XG4gICAgYXN5bmMgbGF5b3V0c0NhY2hlKCkgICB7IHJldHVybiBmaWxlY2FjaGUubGF5b3V0c0NhY2hlOyB9XG4gICAgYXN5bmMgcGFydGlhbHNDYWNoZSgpICB7IHJldHVybiBmaWxlY2FjaGUucGFydGlhbHNDYWNoZTsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBkb2N1bWVudERpcnMgY29uZmlndXJhdGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgZGlyVG9Nb3VudH0gZGlyIFRoZSBwYXRobmFtZSB0byB1c2Ugb3IgZGlyVG9Nb3VudCBvYmplY3RcbiAgICAgKi9cbiAgICBhZGREb2N1bWVudHNEaXIoZGlyOiBzdHJpbmcgfCBkaXJUb01vdW50KSB7XG4gICAgICAgIGxldCBkaXJNb3VudDogZGlyVG9Nb3VudDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmRpcixcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghaXNEaXJUb01vdW50KGRpck1vdW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGREb2N1bWVudHNEaXIgLSBpbnZhbGlkIGRpclRvTW91bnQgb2JqZWN0OiAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2RvY3VtZW50RGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGRvY3VtZW50RGlycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2RvY3VtZW50RGlycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb29rIHVwIHRoZSBkb2N1bWVudCBkaXJlY3RvcnkgaW5mb3JtYXRpb24gZm9yIGEgZ2l2ZW4gZG9jdW1lbnQgZGlyZWN0b3J5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJuYW1lIFRoZSBkb2N1bWVudCBkaXJlY3RvcnkgdG8gc2VhcmNoIGZvclxuICAgICAqL1xuICAgIGRvY3VtZW50RGlySW5mbyhkaXJuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgZm9yICh2YXIgZG9jRGlyIG9mIHRoaXMuZG9jdW1lbnREaXJzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRvY0RpciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jRGlyLnNyYyA9PT0gZGlybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jRGlyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZG9jRGlyID09PSBkaXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvY0RpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgbGF5b3V0RGlycyBjb25maWd1cnRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IGRpclRvTW91bnR9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlIG9yIGRpclRvTW91bnQgb2JqZWN0XG4gICAgICovXG4gICAgYWRkTGF5b3V0c0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZExheW91dHNEaXIgLSBpbnZhbGlkIGRpclRvTW91bnQgb2JqZWN0OiAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2xheW91dERpcnMucHVzaChkaXJNb3VudCk7XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycy5hZGRMYXlvdXREaXIoZGlyTW91bnQuc3JjKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGxheW91dERpcnMoKSB7IHJldHVybiB0aGlzLiNsYXlvdXREaXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIHBhcnRpYWxEaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgZGlyVG9Nb3VudH0gZGlyIFRoZSBwYXRobmFtZSB0byB1c2Ugb3IgZGlyVG9Nb3VudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRQYXJ0aWFsc0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZFBhcnRpYWxzRGlyIC0gaW52YWxpZCBkaXJUb01vdW50IG9iamVjdDogJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLiNwYXJ0aWFsRGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLmFkZFBhcnRpYWxEaXIoZGlyTW91bnQuc3JjKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHBhcnRpYWxzRGlycygpIHsgcmV0dXJuIHRoaXMuI3BhcnRpYWxEaXJzOyB9XG4gICAgXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBhc3NldERpcnMgY29uZmlndXJ0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBkaXJUb01vdW50fSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZSBvciBkaXJUb01vdW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEFzc2V0c0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZEFzc2V0c0RpciAtIGludmFsaWQgZGlyVG9Nb3VudCBvYmplY3Q6ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy4jYXNzZXRzRGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGFzc2V0RGlycygpIHsgcmV0dXJuIHRoaXMuI2Fzc2V0c0RpcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhbiBhcnJheSBvZiBNYWhhYmh1dGEgZnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheX0gbWFoYWZ1bmNzXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkTWFoYWJodXRhKG1haGFmdW5jczogbWFoYWJodXRhLk1haGFmdW5jQXJyYXkgfCBtYWhhYmh1dGEuTWFoYWZ1bmNUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWFoYWZ1bmNzID09PSAndW5kZWZpbmVkJyB8fCAhbWFoYWZ1bmNzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuZGVmaW5lZCBtYWhhZnVuY3MgaW4gJHt0aGlzLmNvbmZpZ0Rpcn1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MucHVzaChtYWhhZnVuY3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWFoYWZ1bmNzKCkgeyByZXR1cm4gdGhpcy4jbWFoYWZ1bmNzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmUgdGhlIGRpcmVjdG9yeSBpbnRvIHdoaWNoIHRoZSBwcm9qZWN0IGlzIHJlbmRlcmVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHNldFJlbmRlckRlc3RpbmF0aW9uKGRpcjogc3RyaW5nKSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJyAmJiAhcGF0aC5pc0Fic29sdXRlKGRpcikpIHtcbiAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jcmVuZGVyVG8gPSBkaXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBGZXRjaCB0aGUgZGVjbGFyZWQgZGVzdGluYXRpb24gZm9yIHJlbmRlcmluZyB0aGUgcHJvamVjdC4gKi9cbiAgICBnZXQgcmVuZGVyRGVzdGluYXRpb24oKSB7IHJldHVybiB0aGlzLiNyZW5kZXJUbzsgfVxuICAgIGdldCByZW5kZXJUbygpIHsgcmV0dXJuIHRoaXMuI3JlbmRlclRvOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSB2YWx1ZSB0byB0aGUgcHJvamVjdCBtZXRhZGF0YS4gIFRoZSBtZXRhZGF0YSBpcyBjb21iaW5lZCB3aXRoXG4gICAgICogdGhlIGRvY3VtZW50IG1ldGFkYXRhIGFuZCB1c2VkIGR1cmluZyByZW5kZXJpbmcuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGluZGV4IFRoZSBrZXkgdG8gc3RvcmUgdGhlIHZhbHVlLlxuICAgICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc3RvcmUgaW4gdGhlIG1ldGFkYXRhLlxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZE1ldGFkYXRhKGluZGV4OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdmFyIG1kID0gdGhpcy4jbWV0YWRhdGE7XG4gICAgICAgIG1kW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLiNtZXRhZGF0YTsgfVxuXG4gICAgI2Rlc2NyaXB0aW9uczogVGFnRGVzY3JpcHRpb25bXTtcblxuICAgIC8qKlxuICAgICAqIEFkZCB0YWcgZGVzY3JpcHRpb25zIHRvIHRoZSBkYXRhYmFzZS4gIFRoZSBwdXJwb3NlXG4gICAgICogaXMgZm9yIGV4YW1wbGUgYSB0YWcgaW5kZXggcGFnZSBjYW4gZ2l2ZSBhXG4gICAgICogZGVzY3JpcHRpb24gYXQgdGhlIHRvcCBvZiB0aGUgcGFnZS5cbiAgICAgKlxuICAgICAqIE5PVEU6IFBvdGVudGlhbCBidWcgLSBUaGlzIGZ1bmN0aW9uIHJlcGxhY2VzIHRoZSBlbnRpcmUgI2Rlc2NyaXB0aW9uc1xuICAgICAqIGFycmF5IHJhdGhlciB0aGFuIG1lcmdpbmcgd2l0aCBleGlzdGluZyBkZXNjcmlwdGlvbnMuIElmIGNhbGxlZCBtdWx0aXBsZVxuICAgICAqIHRpbWVzLCBlYXJsaWVyIGRlc2NyaXB0aW9ucyB3aWxsIGJlIGxvc3QuIEN1cnJlbnQgYXNzdW1wdGlvbiBpcyB0aGlzXG4gICAgICogZnVuY3Rpb24gaXMgb25seSBjYWxsZWQgb25jZSBmcm9tIHRoZSBjb25maWd1cmF0aW9uIGZpbGUuIEEgZnV0dXJlXG4gICAgICogZW5oYW5jZW1lbnQgd291bGQgYmUgdG8gbWVyZ2UgZGVzY3JpcHRpb25zIGluc3RlYWQgb2YgcmVwbGFjaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhZ2Rlc2NzIFxuICAgICAqL1xuICAgIGFzeW5jIGFkZFRhZ0Rlc2NyaXB0aW9ucyh0YWdkZXNjczogVGFnRGVzY3JpcHRpb25bXSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodGFnZGVzY3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZFRhZ0Rlc2NyaXB0aW9ucyBtdXN0IGJlIGdpdmVuIGFuIGFycmF5IG9mIHRhZyBkZXNjcmlwdGlvbnNgKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGRlc2Mgb2YgdGFnZGVzY3MpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVzYy50YWdOYW1lICE9PSAnc3RyaW5nJ1xuICAgICAgICAgICAgIHx8IHR5cGVvZiBkZXNjLmRlc2NyaXB0aW9uICE9PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5jb3JyZWN0IHRhZyBkZXNjcmlwdGlvbiAke3V0aWwuaW5zcGVjdChkZXNjKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBtZXJnaW5nIHdpdGggZXhpc3RpbmcgZGVzY3JpcHRpb25zIGluc3RlYWQgb2YgcmVwbGFjaW5nXG4gICAgICAgIHRoaXMuI2Rlc2NyaXB0aW9ucyA9IHRhZ2Rlc2NzO1xuICAgIH1cblxuICAgIGFzeW5jICNzYXZlRGVzY3JpcHRpb25zVG9EQigpIHtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLiNkZXNjcmlwdGlvbnMpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRlc2Mgb2YgdGhpcy4jZGVzY3JpcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZG9jdW1lbnRzLmFkZFRhZ0Rlc2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICBkZXNjLnRhZ05hbWUsIGRlc2MuZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBEb2N1bWVudCB0aGUgVVJMIGZvciBhIHdlYnNpdGUgcHJvamVjdC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSByb290X3VybFxuICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgKi9cbiAgICByb290VVJMKHJvb3RfdXJsOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy4jcm9vdF91cmwgPSByb290X3VybDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHJvb3RfdXJsKCkgeyByZXR1cm4gdGhpcy4jcm9vdF91cmw7IH1cblxuICAgIC8qKlxuICAgICAqIFNldCBob3cgbWFueSBkb2N1bWVudHMgdG8gcmVuZGVyIGNvbmN1cnJlbnRseS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY29uY3VycmVuY3lcbiAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHNldENvbmN1cnJlbmN5KGNvbmN1cnJlbmN5OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy4jY29uY3VycmVuY3kgPSBjb25jdXJyZW5jeTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGNvbmN1cnJlbmN5KCkgeyByZXR1cm4gdGhpcy4jY29uY3VycmVuY3k7IH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdGltZSwgaW4gbWlsaXNlY29uZHMsIHRvIGhvbm9yXG4gICAgICogdGhlIFNlYXJjaENhY2hlIGluIHRoZSBzZWFyY2ggZnVuY3Rpb24uXG4gICAgICogXG4gICAgICogRGVmYXVsdCBpcyA2MDAwMCAoMSBtaW51dGUpLlxuICAgICAqIFxuICAgICAqIFNldCB0byAwIHRvIGRpc2FibGUgY2FjaGluZy5cbiAgICAgKiBAcGFyYW0gdGltZW91dCBcbiAgICAgKi9cbiAgICBzZXRDYWNoaW5nVGltZW91dCh0aW1lb3V0OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy4jY2FjaGluZ1RpbWVvdXQgPSB0aW1lb3V0O1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2V0U2VhcmNoQ2FjaGVUaW1lb3V0ICR7dGhpcy4jc2VhcmNoQ2FjaGVUaW1lb3V0fWApO1xuICAgIH1cblxuICAgIGdldCBjYWNoaW5nVGltZW91dCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHNlYXJjaENhY2hlVGltZW91dCAke3RoaXMuI3NlYXJjaENhY2hlVGltZW91dH1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2NhY2hpbmdUaW1lb3V0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlY2xhcmUgSmF2YVNjcmlwdCB0byBhZGQgd2l0aGluIHRoZSBoZWFkIHRhZyBvZiByZW5kZXJlZCBwYWdlcy5cbiAgICAgKiBAcGFyYW0gc2NyaXB0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkSGVhZGVySmF2YVNjcmlwdChzY3JpcHQ6IGphdmFTY3JpcHRJdGVtKSB7XG4gICAgICAgIHRoaXMuI3NjcmlwdHMuamF2YVNjcmlwdFRvcC5wdXNoKHNjcmlwdCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBzY3JpcHRzKCkgeyByZXR1cm4gdGhpcy4jc2NyaXB0czsgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBKYXZhU2NyaXB0IHRvIGFkZCBhdCB0aGUgYm90dG9tIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRGb290ZXJKYXZhU2NyaXB0KHNjcmlwdDogamF2YVNjcmlwdEl0ZW0pIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tLnB1c2goc2NyaXB0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBhIENTUyBTdHlsZXNoZWV0IHRvIGFkZCB3aXRoaW4gdGhlIGhlYWQgdGFnIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRTdHlsZXNoZWV0KGNzczogc3R5bGVzaGVldEl0ZW0pIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5zdHlsZXNoZWV0cy5wdXNoKGNzcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldE1haGFiaHV0YUNvbmZpZyhjaGVlcmlvPzogY2hlZXJpby5DaGVlcmlvT3B0aW9ucykge1xuICAgICAgICB0aGlzLiNjaGVlcmlvID0gY2hlZXJpbztcblxuICAgICAgICAvLyBGb3IgY2hlZXJpbyAxLjAuMC1yYy4xMCB3ZSBuZWVkIHRvIHVzZSB0aGlzIHNldHRpbmcuXG4gICAgICAgIC8vIElmIHRoZSBjb25maWd1cmF0aW9uIGhhcyBzZXQgdGhpcywgd2UgbXVzdCBub3RcbiAgICAgICAgLy8gb3ZlcnJpZGUgdGhlaXIgc2V0dGluZy4gIEJ1dCwgZ2VuZXJhbGx5LCBmb3IgY29ycmVjdFxuICAgICAgICAvLyBvcGVyYXRpb24gYW5kIGhhbmRsaW5nIG9mIE1haGFiaHV0YSB0YWdzLCB3ZSBuZWVkXG4gICAgICAgIC8vIHRoaXMgc2V0dGluZyB0byBiZSA8Y29kZT50cnVlPC9jb2RlPlxuICAgICAgICBpZiAoISgnX3VzZUh0bWxQYXJzZXIyJyBpbiB0aGlzLiNjaGVlcmlvKSkge1xuICAgICAgICAgICAgKHRoaXMuI2NoZWVyaW8gYXMgYW55KS5fdXNlSHRtbFBhcnNlcjIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpc1tfY29uZmlnX2NoZWVyaW9dKTtcbiAgICB9XG5cbiAgICBnZXQgbWFoYWJodXRhQ29uZmlnKCkgeyByZXR1cm4gdGhpcy4jY2hlZXJpbzsgfVxuXG4gICAgLyoqXG4gICAgICogQ29weSB0aGUgY29udGVudHMgb2YgYWxsIGRpcmVjdG9yaWVzIGluIGFzc2V0RGlycyB0byB0aGUgcmVuZGVyIGRlc3RpbmF0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGNvcHlBc3NldHMoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdjb3B5QXNzZXRzIFNUQVJUJyk7XG5cbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgY29uc3QgYXNzZXRzID0gZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICAvLyBGZXRjaCB0aGUgbGlzdCBvZiBhbGwgYXNzZXRzIGZpbGVzXG4gICAgICAgIGNvbnN0IHBhdGhzID0gYXdhaXQgYXNzZXRzLnBhdGhzKCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgcGF0aHNgLFxuICAgICAgICAvLyAgICAgcGF0aHMubWFwKGl0ZW0gPT4ge1xuICAgICAgICAvLyAgICAgICAgIHJldHVybiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAvLyAgICAgICAgICAgICByZW5kZXJQYXRoOiBpdGVtLnJlbmRlclBhdGgsXG4gICAgICAgIC8vICAgICAgICAgICAgIG1pbWU6IGl0ZW0ubWltZVxuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gICAgIH0pXG4gICAgICAgIC8vIClcblxuICAgICAgICAvLyBUaGUgd29yayB0YXNrIGlzIHRvIGNvcHkgZWFjaCBmaWxlXG4gICAgICAgIGNvbnN0IHF1ZXVlID0gZmFzdHEucHJvbWlzZShhc3luYyBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzICR7Y29uZmlnLnJlbmRlclRvfSAke2l0ZW0ucmVuZGVyUGF0aH1gKTtcbiAgICAgICAgICAgICAgICBsZXQgZGVzdEZOID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJUbywgaXRlbS5yZW5kZXJQYXRoKTtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKGRlc3RGTiksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIC8vIENvcHkgZnJvbSB0aGUgYWJzb2x1dGUgcGF0aG5hbWUsIHRvIHRoZSBjb21wdXRlZCBcbiAgICAgICAgICAgICAgICAvLyBsb2NhdGlvbiB3aXRoaW4gdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeVxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzICR7aXRlbS5mc3BhdGh9ID09PiAke2Rlc3RGTn1gKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AuY3AoaXRlbS5mc3BhdGgsIGRlc3RGTiwge1xuICAgICAgICAgICAgICAgICAgICBmb3JjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY29weUFzc2V0cyBGQUlMIHRvIGNvcHkgJHtpdGVtLmZzcGF0aH0gJHtpdGVtLnZwYXRofSAke2l0ZW0ucmVuZGVyUGF0aH0gJHtjb25maWcucmVuZGVyVG99IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwKTtcblxuICAgICAgICAvLyBQdXNoIHRoZSBsaXN0IG9mIGFzc2V0IGZpbGVzIGludG8gdGhlIHF1ZXVlXG4gICAgICAgIC8vIEJlY2F1c2UgcXVldWUucHVzaCByZXR1cm5zIFByb21pc2UncyB3ZSBlbmQgdXAgd2l0aFxuICAgICAgICAvLyBhbiBhcnJheSBvZiBQcm9taXNlIG9iamVjdHNcbiAgICAgICAgY29uc3Qgd2FpdEZvciA9IFtdO1xuICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBwYXRocykge1xuICAgICAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGlzIHdhaXRzIGZvciBhbGwgUHJvbWlzZSdzIHRvIGZpbmlzaFxuICAgICAgICAvLyBCdXQgaWYgdGhlcmUgd2VyZSBubyBQcm9taXNlJ3MsIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICBpZiAod2FpdEZvci5sZW5ndGggPiAwKSBhd2FpdCBQcm9taXNlLmFsbCh3YWl0Rm9yKTtcbiAgICAgICAgLy8gVGhlcmUgYXJlIG5vIHJlc3VsdHMgaW4gdGhpcyBjYXNlIHRvIGNhcmUgYWJvdXRcbiAgICAgICAgLy8gY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICAvLyBmb3IgKGxldCByZXN1bHQgb2Ygd2FpdEZvcikge1xuICAgICAgICAvLyAgICByZXN1bHRzLnB1c2goYXdhaXQgcmVzdWx0KTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGwgdGhlIGJlZm9yZVNpdGVSZW5kZXJlZCBmdW5jdGlvbiBvZiBhbnkgcGx1Z2luIHdoaWNoIGhhcyB0aGF0IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4uYmVmb3JlU2l0ZVJlbmRlcmVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBiZWZvcmVTaXRlUmVuZGVyZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uYmVmb3JlU2l0ZVJlbmRlcmVkKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsIHRoZSBvblNpdGVSZW5kZXJlZCBmdW5jdGlvbiBvZiBhbnkgcGx1Z2luIHdoaWNoIGhhcyB0aGF0IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGhvb2tTaXRlUmVuZGVyZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdob29rU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25TaXRlUmVuZGVyZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uU2l0ZVJlbmRlcmVkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uU2l0ZVJlbmRlcmVkKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZUFkZGVkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhvb2tGaWxlQWRkZWQgJHtjb2xsZWN0aW9ufSAke3ZwaW5mby52cGF0aH1gKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVBZGRlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25GaWxlQWRkZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlQWRkZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVDaGFuZ2VkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVDaGFuZ2VkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvbkZpbGVDaGFuZ2VkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUNoYW5nZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVVbmxpbmtlZChjb2xsZWN0aW9uOiBzdHJpbmcsIHZwaW5mbzogVlBhdGhEYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlVW5saW5rZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uRmlsZVVubGlua2VkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZVVubGlua2VkKGNvbmZpZywgY29sbGVjdGlvbiwgdnBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQ2FjaGVTZXR1cChjb2xsZWN0aW9ubm06IHN0cmluZywgY29sbGVjdGlvbikge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUNhY2hlU2V0dXAgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUNhY2hlU2V0dXAoY29uZmlnLCBjb2xsZWN0aW9ubm0sIGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va1BsdWdpbkNhY2hlU2V0dXAoKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25QbHVnaW5DYWNoZVNldHVwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vblBsdWdpbkNhY2hlU2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNQRUNJQUwgVFJFQVRNRU5UXG4gICAgICAgIC8vIFRoZSB0YWcgZGVzY3JpcHRpb25zIG5lZWQgdG8gYmUgaW5zdGFsbGVkXG4gICAgICAgIC8vIGluIHRoZSBkYXRhYmFzZS4gIEl0IGlzIGltcG9zc2libGUgdG8gZG9cbiAgICAgICAgLy8gdGhhdCBkdXJpbmcgQ29uZmlndXJhdGlvbiBzZXR1cCBpblxuICAgICAgICAvLyB0aGUgYWRkVGFnRGVzY3JpcHRpb25zIG1ldGhvZC5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIGFmdGVyIHRoZSBkYXRhYmFzZVxuICAgICAgICAvLyBpcyBzZXR1cC5cblxuICAgICAgICBhd2FpdCB0aGlzLiNzYXZlRGVzY3JpcHRpb25zVG9EQigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHVzZSAtIGdvIHRocm91Z2ggcGx1Z2lucyBhcnJheSwgYWRkaW5nIGVhY2ggdG8gdGhlIHBsdWdpbnMgYXJyYXkgaW5cbiAgICAgKiB0aGUgY29uZmlnIGZpbGUsIHRoZW4gY2FsbGluZyB0aGUgY29uZmlnIGZ1bmN0aW9uIG9mIGVhY2ggcGx1Z2luLlxuICAgICAqIEBwYXJhbSBQbHVnaW5PYmogVGhlIHBsdWdpbiBuYW1lIG9yIG9iamVjdCB0byBhZGRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICB1c2UoUGx1Z2luT2JqLCBvcHRpb25zKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29uZmlndXJhdGlvbiAjMSB1c2UgUGx1Z2luT2JqIFwiKyB0eXBlb2YgUGx1Z2luT2JqICtcIiBcIisgdXRpbC5pbnNwZWN0KFBsdWdpbk9iaikpO1xuICAgICAgICBpZiAodHlwZW9mIFBsdWdpbk9iaiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgZ29pbmcgdG8gZmFpbCBiZWNhdXNlXG4gICAgICAgICAgICAvLyByZXF1aXJlIGRvZXNuJ3Qgd29yayBpbiB0aGlzIGNvbnRleHRcbiAgICAgICAgICAgIC8vIEZ1cnRoZXIsIHRoaXMgY29udGV4dCBkb2VzIG5vdFxuICAgICAgICAgICAgLy8gc3VwcG9ydCBhc3luYyBmdW5jdGlvbnMsIHNvIHdlXG4gICAgICAgICAgICAvLyBjYW5ub3QgZG8gaW1wb3J0LlxuICAgICAgICAgICAgUGx1Z2luT2JqID0gcmVxdWlyZShQbHVnaW5PYmopO1xuICAgICAgICB9XG4gICAgICAgIGlmICghUGx1Z2luT2JqIHx8IFBsdWdpbk9iaiBpbnN0YW5jZW9mIFBsdWdpbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gcGx1Z2luIHN1cHBsaWVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29uZmlndXJhdGlvbiAjMiB1c2UgUGx1Z2luT2JqIFwiKyB0eXBlb2YgUGx1Z2luT2JqICtcIiBcIisgdXRpbC5pbnNwZWN0KFBsdWdpbk9iaikpO1xuICAgICAgICB2YXIgcGx1Z2luID0gbmV3IFBsdWdpbk9iaigpO1xuICAgICAgICBwbHVnaW4uYWthc2hhID0gdGhpcy5ha2FzaGE7XG4gICAgICAgIHRoaXMuI3BsdWdpbnMucHVzaChwbHVnaW4pO1xuICAgICAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgcGx1Z2luLmNvbmZpZ3VyZSh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHBsdWdpbnMoKSB7IHJldHVybiB0aGlzLiNwbHVnaW5zOyB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlIG92ZXIgdGhlIGluc3RhbGxlZCBwbHVnaW5zLCBjYWxsaW5nIHRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gYGl0ZXJhdG9yYFxuICAgICAqIGZvciBlYWNoIHBsdWdpbiwgdGhlbiBjYWxsaW5nIHRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gYGZpbmFsYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpdGVyYXRvciBUaGUgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCBwbHVnaW4uICBTaWduYXR1cmU6IGBmdW5jdGlvbihwbHVnaW4sIG5leHQpYCAgVGhlIGBuZXh0YCBwYXJhbWV0ZXIgaXMgYSBmdW5jdGlvbiB1c2VkIHRvIGluZGljYXRlIGVycm9yIC0tIGBuZXh0KGVycilgIC0tIG9yIHN1Y2Nlc3MgLS0gbmV4dCgpXG4gICAgICogQHBhcmFtIGZpbmFsIFRoZSBmdW5jdGlvbiB0byBjYWxsIGFmdGVyIGFsbCBpdGVyYXRvciBjYWxscyBoYXZlIGJlZW4gbWFkZS4gIFNpZ25hdHVyZTogYGZ1bmN0aW9uKGVycilgXG4gICAgICovXG4gICAgZWFjaFBsdWdpbihpdGVyYXRvciwgZmluYWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZWFjaFBsdWdpbiBkZXByZWNhdGVkXCIpO1xuICAgICAgICAvKiBhc3luYy5lYWNoU2VyaWVzKHRoaXMucGx1Z2lucyxcbiAgICAgICAgZnVuY3Rpb24ocGx1Z2luLCBuZXh0KSB7XG4gICAgICAgICAgICBpdGVyYXRvcihwbHVnaW4sIG5leHQpO1xuICAgICAgICB9LFxuICAgICAgICBmaW5hbCk7ICovXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9vayBmb3IgYSBwbHVnaW4sIHJldHVybmluZyBpdHMgbW9kdWxlIHJlZmVyZW5jZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAqIEByZXR1cm5zIHtQbHVnaW59XG4gICAgICovXG4gICAgcGx1Z2luKG5hbWU6IHN0cmluZykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnY29uZmlnLnBsdWdpbjogJysgdXRpbC5pbnNwZWN0KHRoaXMuX3BsdWdpbnMpKTtcbiAgICAgICAgaWYgKCEgdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHBsdWdpbktleSBpbiB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIHZhciBwbHVnaW4gPSB0aGlzLnBsdWdpbnNbcGx1Z2luS2V5XTtcbiAgICAgICAgICAgIGlmIChwbHVnaW4ubmFtZSA9PT0gbmFtZSkgcmV0dXJuIHBsdWdpbjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgV0FSTklORzogRGlkIG5vdCBmaW5kIHBsdWdpbiAke25hbWV9YCk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIHBsdWdpbkRhdGEgb2JqZWN0IGZvciB0aGUgbmFtZWQgcGx1Z2luLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgKi8gXG4gICAgcGx1Z2luRGF0YShuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdmFyIHBsdWdpbkRhdGFBcnJheSA9IHRoaXMuI3BsdWdpbkRhdGE7XG4gICAgICAgIGlmICghKG5hbWUgaW4gcGx1Z2luRGF0YUFycmF5KSkge1xuICAgICAgICAgICAgcGx1Z2luRGF0YUFycmF5W25hbWVdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBsdWdpbkRhdGFBcnJheVtuYW1lXTtcbiAgICB9XG5cbiAgICBhc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWYoaHJlZikge1xuICAgICAgICBmb3IgKHZhciBwbHVnaW4gb2YgdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5pc0xlZ2l0TG9jYWxIcmVmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGlmIChwbHVnaW4uaXNMZWdpdExvY2FsSHJlZih0aGlzLCBocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyUmVuZGVyZXIocmVuZGVyZXI6IFJlbmRlcmVyKSB7XG4gICAgICAgIGlmICghKHJlbmRlcmVyIGluc3RhbmNlb2YgUmVuZGVyZXIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdOb3QgQSBSZW5kZXJlciAnKyB1dGlsLmluc3BlY3QocmVuZGVyZXIpKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm90IGEgUmVuZGVyZXIgJHt1dGlsLmluc3BlY3QocmVuZGVyZXIpfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5maW5kUmVuZGVyZXJOYW1lKHJlbmRlcmVyLm5hbWUpKSB7XG4gICAgICAgICAgICAvLyByZW5kZXJlci5ha2FzaGEgPSB0aGlzLmFrYXNoYTtcbiAgICAgICAgICAgIC8vIHJlbmRlcmVyLmNvbmZpZyA9IHRoaXM7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVnaXN0ZXJSZW5kZXJlciBgLCByZW5kZXJlcik7XG4gICAgICAgICAgICB0aGlzLiNyZW5kZXJlcnMucmVnaXN0ZXJSZW5kZXJlcihyZW5kZXJlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGxvdyBhbiBhcHBsaWNhdGlvbiB0byBvdmVycmlkZSBvbmUgb2YgdGhlIGJ1aWx0LWluIHJlbmRlcmVyc1xuICAgICAqIHRoYXQgYXJlIGluaXRpYWxpemVkIGJlbG93LiAgVGhlIGluc3BpcmF0aW9uIGlzIGVwdWJ0b29scyB0aGF0XG4gICAgICogbXVzdCB3cml0ZSBIVE1MIGZpbGVzIHdpdGggYW4gLnhodG1sIGV4dGVuc2lvbi4gIFRoZXJlZm9yZSBpdFxuICAgICAqIGNhbiBzdWJjbGFzcyBFSlNSZW5kZXJlciBldGMgd2l0aCBpbXBsZW1lbnRhdGlvbnMgdGhhdCBmb3JjZSB0aGVcbiAgICAgKiBmaWxlIG5hbWUgdG8gYmUgLnhodG1sLiAgV2UncmUgbm90IGNoZWNraW5nIGlmIHRoZSByZW5kZXJlciBuYW1lXG4gICAgICogaXMgYWxyZWFkeSB0aGVyZSBpbiBjYXNlIGVwdWJ0b29scyBtdXN0IHVzZSB0aGUgc2FtZSByZW5kZXJlciBuYW1lLlxuICAgICAqL1xuICAgIHJlZ2lzdGVyT3ZlcnJpZGVSZW5kZXJlcihyZW5kZXJlcjogUmVuZGVyZXIpIHtcbiAgICAgICAgaWYgKCEocmVuZGVyZXIgaW5zdGFuY2VvZiBSZW5kZXJlcikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vdCBBIFJlbmRlcmVyICcrIHV0aWwuaW5zcGVjdChyZW5kZXJlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYSBSZW5kZXJlcicpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlbmRlcmVyLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICAvLyByZW5kZXJlci5jb25maWcgPSB0aGlzO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMucmVnaXN0ZXJPdmVycmlkZVJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgICB9XG5cbiAgICBmaW5kUmVuZGVyZXJOYW1lKG5hbWU6IHN0cmluZyk6IFJlbmRlcmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3JlbmRlcmVycy5maW5kUmVuZGVyZXJOYW1lKG5hbWUpO1xuICAgIH1cblxuICAgIGZpbmRSZW5kZXJlclBhdGgoX3BhdGg6IHN0cmluZyk6IFJlbmRlcmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3JlbmRlcmVycy5maW5kUmVuZGVyZXJQYXRoKF9wYXRoKTtcbiAgICB9XG5cbiAgICBnZXQgcmVuZGVyZXJzKCkgeyByZXR1cm4gdGhpcy4jcmVuZGVyZXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgUmVuZGVyZXIgYnkgaXRzIGV4dGVuc2lvbi5cbiAgICAgKi9cbiAgICBmaW5kUmVuZGVyZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRSZW5kZXJlck5hbWUobmFtZSk7XG4gICAgfVxufVxuXG5jb25zdCBtb2R1bGVfZXhwb3J0cyA9IHtcbiAgICBSZW5kZXJlcnMsXG4gICAgUmVuZGVyZXI6IFJlbmRlcmVycy5SZW5kZXJlcixcbiAgICBtYWhhYmh1dGEsXG4gICAgZmlsZWNhY2hlLFxuICAgIHNldHVwLFxuICAgIGNhY2hlU2V0dXAsXG4gICAgY2xvc2VDYWNoZXMsXG4gICAgZmlsZUNhY2hlc1JlYWR5LFxuICAgIFBsdWdpbixcbiAgICByZW5kZXIsXG4gICAgcmVuZGVyMixcbiAgICByZW5kZXJEb2N1bWVudCxcbiAgICByZW5kZXJQYXRoLFxuICAgIHJlbmRlclBhdGgyLFxuICAgIHJlYWRSZW5kZXJlZEZpbGUsXG4gICAgcGFydGlhbCxcbiAgICBwYXJ0aWFsU3luYyxcbiAgICBpbmRleENoYWluLFxuICAgIHJlbGF0aXZlLFxuICAgIGxpbmtSZWxTZXRBdHRyLFxuICAgIGdlbmVyYXRlUlNTLFxuICAgIENvbmZpZ3VyYXRpb25cbn0gYXMgYW55O1xuXG5leHBvcnQgZGVmYXVsdCBtb2R1bGVfZXhwb3J0czsiXX0=