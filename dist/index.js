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
/**
 * Compute an absolute vpath from a relative path reference.
 *
 * This function resolves a relative path (like "../file.html" or "./file.html")
 * to an absolute vpath in the virtual filesystem, based on the vpath of the
 * current document.
 *
 * If the input path is already absolute (starts with '/'), it is returned
 * as-is after normalization.
 *
 * @param baseVpath The vpath of the document making the reference (e.g., metadata.document.path)
 * @param relativePath The path to resolve (can be relative or absolute)
 * @returns The absolute vpath in the virtual filesystem
 *
 * @example
 * // From document at 'hier/dir1/page.html.md' referencing '../sibling/file.html'
 * resolveVpath('hier/dir1/page.html.md', '../sibling/file.html')
 * // Returns: '/hier/sibling/file.html'
 *
 * @example
 * // Already absolute path
 * resolveVpath('hier/dir1/page.html.md', '/absolute/path.html')
 * // Returns: '/absolute/path.html'
 */
export function resolveVpath(baseVpath, relativePath) {
    if (!baseVpath || typeof baseVpath !== 'string') {
        throw new Error(`resolveVpath: baseVpath must be a non-empty string, got ${typeof baseVpath}`);
    }
    if (!relativePath || typeof relativePath !== 'string') {
        throw new Error(`resolveVpath: relativePath must be a non-empty string, got ${typeof relativePath}`);
    }
    // If the path is already absolute, return it normalized
    if (path.isAbsolute(relativePath)) {
        return path.normalize(relativePath);
    }
    // Get the directory of the base vpath
    const dir = path.dirname(baseVpath);
    // Join with '/' prefix to ensure we get an absolute vpath
    // and normalize to clean up any .. or . segments
    return path.normalize(path.join('/', dir, relativePath));
}
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
    resolveVpath,
    generateRSS,
    Configuration
};
export default module_exports;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBR0g7OztHQUdHO0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsNENBQTRDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFFLFVBQVUsRUFBYyxZQUFZLEVBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEtBQUssU0FBUyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsTUFBTSxFQUNGLGFBQWEsRUFDYix1QkFBdUIsRUFDMUIsR0FBRyxTQUFTLENBQUM7QUFDZCxPQUFPLEtBQUssT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUNuQyxPQUFPLFdBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUVwRCxjQUFjLGdCQUFnQixDQUFDO0FBRS9CLE9BQU8sS0FBSyxRQUFRLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sS0FBSyxRQUFR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QUM1QixTQUFTO0lBQ1QsU0FBUztJQUNULEtBQUs7SUFDTCxVQUFVO0lBQ1YsV0FBVztJQUNYLGVBQWU7SUFDZixNQUFNO0lBQ04sTUFBTTtJQUNOLE9BQU87SUFDUCxjQUFjO0lBQ2QsVUFBVTtJQUNWLFdBQVc7SUFDWCxnQkFBZ0I7SUFDaEIsT0FBTztJQUNQLFdBQVc7SUFDWCxVQUFVO0lBQ1YsUUFBUTtJQUNSLGNBQWM7SUFDZCxZQUFZO0lBQ1osV0FBVztJQUNYLGFBQWE7Q0FDVCxDQUFDO0FBRVQsZUFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXG4vKipcbiAqIEFrYXNoYVJlbmRlclxuICogQG1vZHVsZSBha2FzaGFyZW5kZXJcbiAqL1xuXG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuLy8gY29uc3Qgb2VtYmV0dGVyID0gcmVxdWlyZSgnb2VtYmV0dGVyJykoKTtcbmltcG9ydCBSU1MgZnJvbSAncnNzJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgeyBtaW1lZGVmaW5lLCBkaXJUb01vdW50LCBpc0RpclRvTW91bnQsIFZQYXRoRGF0YSB9IGZyb20gJy4vY2FjaGUvdmZzdGFjay5qcyc7XG5leHBvcnQgdHlwZSB7IGRpclRvTW91bnQsIFZQYXRoRGF0YSB9IGZyb20gJy4vY2FjaGUvdmZzdGFjay5qcyc7XG5leHBvcnQgeyBpc0RpclRvTW91bnQgfSBmcm9tICcuL2NhY2hlL3Zmc3RhY2suanMnO1xuaW1wb3J0ICogYXMgUmVuZGVyZXJzIGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmV4cG9ydCAqIGFzIFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQgeyBSZW5kZXJlciB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmV4cG9ydCB7IFJlbmRlcmVyIH0gZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0ICogYXMgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5leHBvcnQgKiBhcyBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmNvbnN0IHtcbiAgICBQZXJmRGF0YVN0b3JlLCBcbiAgICBGaWxlc3lzdGVtUGVyZkRhdGFTdG9yZVxufSA9IG1haGFiaHV0YTtcbmltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSAnY2hlZXJpbyc7XG5pbXBvcnQgbWFoYVBhcnRpYWwgZnJvbSAnbWFoYWJodXRhL21haGEvcGFydGlhbC5qcyc7XG5cbmV4cG9ydCAqIGZyb20gJy4vbWFoYWZ1bmNzLmpzJztcblxuaW1wb3J0ICogYXMgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuZXhwb3J0ICogYXMgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuXG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5leHBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5cbmltcG9ydCB0eXBlIHsgVGFnRGVzY3JpcHRpb24gfSBmcm9tICcuL3R5cGVzLmpzJztcbmV4cG9ydCB0eXBlIHsgVGFnRGVzY3JpcHRpb24gfSBmcm9tICcuL3R5cGVzLmpzJztcbmV4cG9ydCB7IHZhbGlkVGFnRGVzY3JpcHRpb24gfSBmcm9tICcuL3R5cGVzLmpzJztcblxuaW1wb3J0IHsgcmVuZGVyLCByZW5kZXIyLCByZW5kZXJEb2N1bWVudCwgcmVuZGVyQ29udGVudCwgcmVuZGVyRG9jdW1lbnQyIH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuZXhwb3J0IHsgcmVuZGVyLCByZW5kZXIyLCByZW5kZXJEb2N1bWVudCwgcmVuZGVyRG9jdW1lbnQyLCByZW5kZXJDb250ZW50IH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuXG5leHBvcnQge1xuICAgIFNpdGVtYXBWYWxpZGF0b3IsXG4gICAgdHlwZSBTaXRlbWFwRW50cnksXG4gICAgdHlwZSBFbnRyeVZhbGlkYXRpb24sXG4gICAgdHlwZSBYTUxWYWxpZGF0aW9uLFxuICAgIHR5cGUgVmFsaWRhdGlvblJlc3VsdFxufSBmcm9tICcuL3NpdGVtYXAtdmFsaWRhdG9yLmpzJztcblxuY29uc3QgX19maWxlbmFtZSA9IGltcG9ydC5tZXRhLmZpbGVuYW1lO1xuY29uc3QgX19kaXJuYW1lID0gaW1wb3J0Lm1ldGEuZGlybmFtZTtcblxuLy8gRm9yIHVzZSBpbiBDb25maWd1cmUucHJlcGFyZVxuaW1wb3J0IHsgQnVpbHRJblBsdWdpbiB9IGZyb20gJy4vYnVpbHQtaW4uanMnO1xuXG5pbXBvcnQgKiBhcyBmaWxlY2FjaGUgZnJvbSAnLi9jYWNoZS9jYWNoZS1zcWxpdGUuanMnO1xuaW1wb3J0IHsgc3FkYiB9IGZyb20gJy4vc3FkYi5qcyc7XG5cbmV4cG9ydCB7IG5ld1NRM0RhdGFTdG9yZSB9IGZyb20gJy4vc3FkYi5qcyc7XG5cbmltcG9ydCB7IGluaXQgfSBmcm9tICcuL2RhdGEuanMnO1xuXG4vLyBUaGVyZSBkb2Vzbid0IHNlZW0gdG8gYmUgYW4gb2ZmaWNpYWwgTUlNRSB0eXBlIHJlZ2lzdGVyZWRcbi8vIGZvciBBc2NpaURvY3RvclxuLy8gcGVyOiBodHRwczovL2FzY2lpZG9jdG9yLm9yZy9kb2NzL2ZhcS9cbi8vIHBlcjogaHR0cHM6Ly9naXRodWIuY29tL2FzY2lpZG9jdG9yL2FzY2lpZG9jdG9yL2lzc3Vlcy8yNTAyXG4vL1xuLy8gQXMgb2YgTm92ZW1iZXIgNiwgMjAyMiwgdGhlIEFzY2lpRG9jdG9yIEZBUSBzYWlkIHRoZXkgYXJlXG4vLyBpbiB0aGUgcHJvY2VzcyBvZiByZWdpc3RlcmluZyBhIE1JTUUgdHlwZSBmb3IgYHRleHQvYXNjaWlkb2NgLlxuLy8gVGhlIE1JTUUgdHlwZSB3ZSBzdXBwbHkgaGFzIGJlZW4gdXBkYXRlZC5cbi8vXG4vLyBUaGlzIGFsc28gc2VlbXMgdG8gYmUgdHJ1ZSBmb3IgdGhlIG90aGVyIGZpbGUgdHlwZXMuICBXZSd2ZSBtYWRlIHVwXG4vLyBzb21lIE1JTUUgdHlwZXMgdG8gZ28gd2l0aCBlYWNoLlxuLy9cbi8vIFRoZSBNSU1FIHBhY2thZ2UgaGFkIHByZXZpb3VzbHkgYmVlbiBpbnN0YWxsZWQgd2l0aCBBa2FzaGFSZW5kZXIuXG4vLyBCdXQsIGl0IHNlZW1zIHRvIG5vdCBiZSB1c2VkLCBhbmQgaW5zdGVhZCB3ZSBjb21wdXRlIHRoZSBNSU1FIHR5cGVcbi8vIGZvciBmaWxlcyBpbiBTdGFja2VkIERpcmVjdG9yaWVzLlxuLy9cbi8vIFRoZSByZXF1aXJlZCB0YXNrIGlzIHRvIHJlZ2lzdGVyIHNvbWUgTUlNRSB0eXBlcyB3aXRoIHRoZVxuLy8gTUlNRSBwYWNrYWdlLiAgSXQgaXNuJ3QgYXBwcm9wcmlhdGUgdG8gZG8gdGhpcyBpblxuLy8gdGhlIFN0YWNrZWQgRGlyZWN0b3JpZXMgcGFja2FnZS4gIEluc3RlYWQgdGhhdCdzIGxlZnRcbi8vIGZvciBjb2RlIHdoaWNoIHVzZXMgU3RhY2tlZCBEaXJlY3RvcmllcyB0byBkZXRlcm1pbmUgd2hpY2hcbi8vIChpZiBhbnkpIGFkZGVkIE1JTUUgdHlwZXMgYXJlIHJlcXVpcmVkLiAgRXJnbywgQWthc2hhUmVuZGVyXG4vLyBuZWVkcyB0byByZWdpc3RlciB0aGUgTUlNRSB0eXBlcyBpdCBpcyBpbnRlcmVzdGVkIGluLlxuLy8gVGhhdCdzIHdoYXQgaXMgaGFwcGVuaW5nIGhlcmUuXG4vL1xuLy8gVGhlcmUncyBhIHRob3VnaHQgdGhhdCB0aGlzIHNob3VsZCBiZSBoYW5kbGVkIGluIHRoZSBSZW5kZXJlclxuLy8gaW1wbGVtZW50YXRpb25zLiAgQnV0IGl0J3Mgbm90IGNlcnRhaW4gdGhhdCdzIGNvcnJlY3QuXG4vL1xuLy8gTm93IHRoYXQgdGhlIFJlbmRlcmVycyBhcmUgaW4gYEBha2FzaGFjbXMvcmVuZGVyZXJzYCBzaG91bGRcbi8vIHRoZXNlIGRlZmluaXRpb25zIG1vdmUgdG8gdGhhdCBwYWNrYWdlP1xuXG5taW1lZGVmaW5lKHsndGV4dC9hc2NpaWRvYyc6IFsgJ2Fkb2MnLCAnYXNjaWlkb2MnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbWFya2RvYyc6IFsgJ21hcmtkb2MnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtZWpzJzogWyAnZWpzJ119KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbnVuanVja3MnOiBbICduamsnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtaGFuZGxlYmFycyc6IFsgJ2hhbmRsZWJhcnMnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbGlxdWlkJzogWyAnbGlxdWlkJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LXRlbXB1cmEnOiBbICd0ZW1wdXJhJyBdfSk7XG5cbi8qKlxuICogUGVyZm9ybXMgc2V0dXAgb2YgdGhpbmdzIHNvIHRoYXQgQWthc2hhUmVuZGVyIGNhbiBmdW5jdGlvbi5cbiAqIFRoZSBjb3JyZWN0IGluaXRpYWxpemF0aW9uIG9mIEFrYXNoYVJlbmRlciBpcyB0b1xuICogMS4gR2VuZXJhdGUgdGhlIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiAyLiBDYWxsIGNvbmZpZy5wcmVwYXJlXG4gKiAzLiBDYWxsIGFrYXNoYXJlbmRlci5zZXR1cFxuICogXG4gKiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXMgYWxsIG9iamVjdHMgdGhhdCBpbml0aWFsaXplIGFzeW5jaHJvbm91c2x5XG4gKiBhcmUgY29ycmVjdGx5IHNldHVwLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKGNvbmZpZykge1xuXG4gICAgY29uZmlnLnJlbmRlcmVycy5wYXJ0aWFsRnVuYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNhbGxpbmcgcGFydGlhbCAke2ZuYW1lfWApO1xuICAgICAgICByZXR1cm4gcGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICBjb25maWcucmVuZGVyZXJzLnBhcnRpYWxTeW5jRnVuYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNhbGxpbmcgcGFydGlhbFN5bmMgJHtmbmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuXG4gICAgYXdhaXQgY2FjaGVTZXR1cChjb25maWcpO1xuICAgIGF3YWl0IGZpbGVDYWNoZXNSZWFkeShjb25maWcpO1xuXG4gICAgYXdhaXQgaW5pdCgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVTZXR1cChjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBmaWxlY2FjaGUuc2V0dXAoY29uZmlnLCBhd2FpdCBzcWRiKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgSU5JVElBTElaQVRJT04gRkFJTFVSRSBDT1VMRCBOT1QgSU5JVElBTElaRSBDQUNIRSBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VDYWNoZXMoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmlsZWNhY2hlLmNsb3NlRmlsZUNhY2hlcygpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBDTE9TRSBDQUNIRVMgYCwgZXJyKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbGVDYWNoZXNSZWFkeShjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLmFzc2V0c0NhY2hlLmlzUmVhZHkoKSxcbiAgICAgICAgICAgIGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuaXNSZWFkeSgpXG4gICAgICAgIF0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBJTklUSUFMSVpFIENBQ0hFIFNZU1RFTSBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyUGF0aChjb25maWcsIHBhdGgycikge1xuICAgIGNvbnN0IGRvY3VtZW50cyA9IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICBsZXQgZm91bmQ7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICB3aGlsZSAoY291bnQgPCAyMCkge1xuICAgICAgICAvKiBXaGF0J3MgaGFwcGVuaW5nIGlzIHRoaXMgbWlnaHQgYmUgY2FsbGVkIGZyb20gY2xpLmpzXG4gICAgICAgICAqIGluIHJlbmRlci1kb2N1bWVudCwgYW5kIHdlIG1pZ2h0IGJlIGFza2VkIHRvIHJlbmRlciB0aGVcbiAgICAgICAgICogbGFzdCBkb2N1bWVudCB0aGF0IHdpbGwgYmUgQUREJ2QgdG8gdGhlIEZpbGVDYWNoZS5cbiAgICAgICAgICpcbiAgICAgICAgICogSW4gc3VjaCBhIGNhc2UgPGNvZGU+aXNSZWFkeTwvY29kZT4gbWlnaHQgcmV0dXJuIDxjb2RlPnRydWU8L2NvZGU+XG4gICAgICAgICAqIGJ1dCBub3QgYWxsIGZpbGVzIHdpbGwgaGF2ZSBiZWVuIEFERCdkIHRvIHRoZSBGaWxlQ2FjaGUuXG4gICAgICAgICAqIEluIHRoYXQgY2FzZSA8Y29kZT5kb2N1bWVudHMuZmluZDwvY29kZT4gcmV0dXJuc1xuICAgICAgICAgKiA8Y29kZT51bmRlZmluZWQ8L2NvZGU+XG4gICAgICAgICAqXG4gICAgICAgICAqIFdoYXQgdGhpcyBkb2VzIGlzIHRyeSB1cCB0byAyMCB0aW1lcyB0byBsb2FkIHRoZSBkb2N1bWVudCxcbiAgICAgICAgICogc2xlZXBpbmcgZm9yIDEwMCBtaWxsaXNlY29uZHMgZWFjaCB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2xlYW5lciBhbHRlcm5hdGl2ZSB3b3VsZCBiZSB0byB3YWl0IGZvciBub3Qgb25seVxuICAgICAgICAgKiB0aGUgPGNvZGU+cmVhZHk8L2NvZGU+IGZyb20gdGhlIDxjb2RlPmRvY3VtZW50czwvY29kZT4gRmlsZUNhY2hlLFxuICAgICAgICAgKiBidXQgYWxzbyBmb3IgYWxsIHRoZSBpbml0aWFsIEFERCBldmVudHMgdG8gYmUgaGFuZGxlZC4gIEJ1dFxuICAgICAgICAgKiB0aGF0IHNlY29uZCBjb25kaXRpb24gc2VlbXMgZGlmZmljdWx0IHRvIGRldGVjdCByZWxpYWJseS5cbiAgICAgICAgICovXG4gICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aDJyKTtcbiAgICAgICAgaWYgKGZvdW5kKSBicmVhaztcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlclBhdGggJHtwYXRoMnJ9YCwgZm91bmQpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEaWQgbm90IGZpbmQgZG9jdW1lbnQgZm9yICR7cGF0aDJyfWApO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVuZGVyRG9jdW1lbnQoY29uZmlnLCBmb3VuZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlclBhdGgyKGNvbmZpZywgcGF0aDJyKSB7XG4gICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIGxldCBmb3VuZDtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIHdoaWxlIChjb3VudCA8IDIwKSB7XG4gICAgICAgIC8qIFdoYXQncyBoYXBwZW5pbmcgaXMgdGhpcyBtaWdodCBiZSBjYWxsZWQgZnJvbSBjbGkuanNcbiAgICAgICAgICogaW4gcmVuZGVyLWRvY3VtZW50LCBhbmQgd2UgbWlnaHQgYmUgYXNrZWQgdG8gcmVuZGVyIHRoZVxuICAgICAgICAgKiBsYXN0IGRvY3VtZW50IHRoYXQgd2lsbCBiZSBBREQnZCB0byB0aGUgRmlsZUNhY2hlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBJbiBzdWNoIGEgY2FzZSA8Y29kZT5pc1JlYWR5PC9jb2RlPiBtaWdodCByZXR1cm4gPGNvZGU+dHJ1ZTwvY29kZT5cbiAgICAgICAgICogYnV0IG5vdCBhbGwgZmlsZXMgd2lsbCBoYXZlIGJlZW4gQUREJ2QgdG8gdGhlIEZpbGVDYWNoZS5cbiAgICAgICAgICogSW4gdGhhdCBjYXNlIDxjb2RlPmRvY3VtZW50cy5maW5kPC9jb2RlPiByZXR1cm5zXG4gICAgICAgICAqIDxjb2RlPnVuZGVmaW5lZDwvY29kZT5cbiAgICAgICAgICpcbiAgICAgICAgICogV2hhdCB0aGlzIGRvZXMgaXMgdHJ5IHVwIHRvIDIwIHRpbWVzIHRvIGxvYWQgdGhlIGRvY3VtZW50LFxuICAgICAgICAgKiBzbGVlcGluZyBmb3IgMTAwIG1pbGxpc2Vjb25kcyBlYWNoIHRpbWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBjbGVhbmVyIGFsdGVybmF0aXZlIHdvdWxkIGJlIHRvIHdhaXQgZm9yIG5vdCBvbmx5XG4gICAgICAgICAqIHRoZSA8Y29kZT5yZWFkeTwvY29kZT4gZnJvbSB0aGUgPGNvZGU+ZG9jdW1lbnRzPC9jb2RlPiBGaWxlQ2FjaGUsXG4gICAgICAgICAqIGJ1dCBhbHNvIGZvciBhbGwgdGhlIGluaXRpYWwgQUREIGV2ZW50cyB0byBiZSBoYW5kbGVkLiAgQnV0XG4gICAgICAgICAqIHRoYXQgc2Vjb25kIGNvbmRpdGlvbiBzZWVtcyBkaWZmaWN1bHQgdG8gZGV0ZWN0IHJlbGlhYmx5LlxuICAgICAgICAgKi9cbiAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChwYXRoMnIpO1xuICAgICAgICBpZiAoZm91bmQpIGJyZWFrO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyUGF0aCAke3BhdGgycn1gLCBmb3VuZCk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgZmluZCBkb2N1bWVudCBmb3IgJHtwYXRoMnJ9YCk7XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudDIoY29uZmlnLCBmb3VuZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZWFkcyBhIGZpbGUgZnJvbSB0aGUgcmVuZGVyaW5nIGRpcmVjdG9yeS4gIEl0IGlzIHByaW1hcmlseSB0byBiZVxuICogdXNlZCBpbiB0ZXN0IGNhc2VzLCB3aGVyZSB3ZSdsbCBydW4gYSBidWlsZCB0aGVuIHJlYWQgdGhlIGluZGl2aWR1YWxcbiAqIGZpbGVzIHRvIG1ha2Ugc3VyZSB0aGV5J3ZlIHJlbmRlcmVkIGNvcnJlY3RseS5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKiBAcGFyYW0geyp9IGZwYXRoIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkUmVuZGVyZWRGaWxlKGNvbmZpZywgZnBhdGgpIHtcblxuICAgIGxldCBodG1sID0gYXdhaXQgZnNwLnJlYWRGaWxlKHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIGZwYXRoKSwgJ3V0ZjgnKTtcbiAgICBsZXQgJCA9IGNvbmZpZy5tYWhhYmh1dGFDb25maWcgXG4gICAgICAgICAgICA/IGNoZWVyaW8ubG9hZChodG1sLCBjb25maWcubWFoYWJodXRhQ29uZmlnKSBcbiAgICAgICAgICAgIDogY2hlZXJpby5sb2FkKGh0bWwpO1xuXG4gICAgcmV0dXJuIHsgaHRtbCwgJCB9O1xufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBwYXJ0aWFsIHRlbXBsYXRlIHVzaW5nIHRoZSBzdXBwbGllZCBtZXRhZGF0YS4gIFRoaXMgdmVyc2lvblxuICogYWxsb3dzIGZvciBhc3luY2hyb25vdXMgZXhlY3V0aW9uLCBhbmQgZXZlcnkgYml0IG9mIGNvZGUgaXRcbiAqIGV4ZWN1dGVzIGlzIGFsbG93ZWQgdG8gYmUgYXN5bmMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICogQHBhcmFtIHsqfSBmbmFtZSBQYXRoIHdpdGhpbiB0aGUgZmlsZWNhY2hlLnBhcnRpYWxzIGNhY2hlXG4gKiBAcGFyYW0geyp9IG1ldGFkYXRhIE9iamVjdCBjb250YWluaW5nIG1ldGFkYXRhXG4gKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBzdHJpbmcgY29udGFpbmluZyB0aGUgcmVuZGVyZWQgc3R1ZmZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpIHtcblxuICAgIGlmICghZm5hbWUgfHwgdHlwZW9mIGZuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHBhcnRpYWwgZm5hbWUgbm90IGEgc3RyaW5nICR7dXRpbC5pbnNwZWN0KGZuYW1lKX1gKTtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCAke2ZuYW1lfWApO1xuICAgIGNvbnN0IGZvdW5kID0gYXdhaXQgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuZmluZChmbmFtZSk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHBhcnRpYWwgZm91bmQgZm9yICR7Zm5hbWV9IGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5wYXJ0aWFsc0RpcnMpfWApO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCAke2ZuYW1lfSA9PT4gJHtmb3VuZC52cGF0aH0gJHtmb3VuZC5mc3BhdGh9YCk7XG4gICAgXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsIGFib3V0IHRvIHJlbmRlciAke3V0aWwuaW5zcGVjdChmb3VuZC52cGF0aCl9YCk7XG4gICAgICAgIGxldCBwYXJ0aWFsVGV4dDtcbiAgICAgICAgaWYgKGZvdW5kLmRvY0JvZHkpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQm9keTtcbiAgICAgICAgZWxzZSBpZiAoZm91bmQuZG9jQm9keSkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NCb2R5O1xuICAgICAgICBlbHNlIHBhcnRpYWxUZXh0ID0gYXdhaXQgZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcblxuICAgICAgICAvLyBTb21lIHJlbmRlcmVycyAoTnVuanVrcykgcmVxdWlyZSB0aGF0IG1ldGFkYXRhLmNvbmZpZ1xuICAgICAgICAvLyBwb2ludCB0byB0aGUgY29uZmlnIG9iamVjdC4gIFRoaXMgYmxvY2sgb2YgY29kZVxuICAgICAgICAvLyBkdXBsaWNhdGVzIHRoZSBtZXRhZGF0YSBvYmplY3QsIHRoZW4gc2V0cyB0aGVcbiAgICAgICAgLy8gY29uZmlnIGZpZWxkIGluIHRoZSBkdXBsaWNhdGUsIHBhc3NpbmcgdGhhdCB0byB0aGUgcGFydGlhbC5cbiAgICAgICAgbGV0IG1kYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgbGV0IHByb3A7XG5cbiAgICAgICAgZm9yIChwcm9wIGluIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICBtZGF0YVtwcm9wXSA9IG1ldGFkYXRhW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIG1kYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgbWRhdGEucGFydGlhbFN5bmMgPSBwYXJ0aWFsU3luYy5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICBtZGF0YS5wYXJ0aWFsICAgICA9IHBhcnRpYWwuYmluZChyZW5kZXJlciwgY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwtZnVuY3MgcmVuZGVyICR7cmVuZGVyZXIubmFtZX0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyLnJlbmRlcih7XG4gICAgICAgICAgICBmc3BhdGg6IGZvdW5kLmZzcGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IHBhcnRpYWxUZXh0LFxuICAgICAgICAgICAgbWV0YWRhdGE6IG1kYXRhXG4gICAgICAgICAgICAvLyBwYXJ0aWFsVGV4dCwgbWRhdGEsIGZvdW5kXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZm91bmQudnBhdGguZW5kc1dpdGgoJy5odG1sJykgfHwgZm91bmQudnBhdGguZW5kc1dpdGgoJy54aHRtbCcpKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsIHJlYWRpbmcgZmlsZSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlbmRlclBhcnRpYWwgbm8gUmVuZGVyZXIgZm91bmQgZm9yICR7Zm5hbWV9IC0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICB9XG59XG5cbi8qKlxuICogUmVuZGVycyBhIHBhcnRpYWwgdGVtcGxhdGUgdXNpbmcgdGhlIHN1cHBsaWVkIG1ldGFkYXRhLiAgVGhpcyB2ZXJzaW9uXG4gKiBhbGxvd3MgZm9yIHN5bmNocm9ub3VzIGV4ZWN1dGlvbiwgYW5kIGV2ZXJ5IGJpdCBvZiBjb2RlIGl0XG4gKiBleGVjdXRlcyBpcyBzeW5jaHJvbm91cyBmdW5jdGlvbnMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICogQHBhcmFtIHsqfSBmbmFtZSBQYXRoIHdpdGhpbiB0aGUgZmlsZWNhY2hlLnBhcnRpYWxzIGNhY2hlXG4gKiBAcGFyYW0geyp9IG1ldGFkYXRhIE9iamVjdCBjb250YWluaW5nIG1ldGFkYXRhXG4gKiBAcmV0dXJucyBTdHJpbmcgY29udGFpbmluZyB0aGUgcmVuZGVyZWQgc3R1ZmZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKSB7XG5cbiAgICBpZiAoIWZuYW1lIHx8IHR5cGVvZiBmbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBwYXJ0aWFsU3luYyBmbmFtZSBub3QgYSBzdHJpbmcgJHt1dGlsLmluc3BlY3QoZm5hbWUpfWApO1xuICAgIH1cblxuICAgIGNvbnN0IGZvdW5kID0gZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuZmluZFN5bmMoZm5hbWUpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBwYXJ0aWFsIGZvdW5kIGZvciAke2ZuYW1lfSBpbiAke3V0aWwuaW5zcGVjdChjb25maWcucGFydGlhbHNEaXJzKX1gKTtcbiAgICB9XG5cbiAgICB2YXIgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgIC8vIFNvbWUgcmVuZGVyZXJzIChOdW5qdWtzKSByZXF1aXJlIHRoYXQgbWV0YWRhdGEuY29uZmlnXG4gICAgICAgIC8vIHBvaW50IHRvIHRoZSBjb25maWcgb2JqZWN0LiAgVGhpcyBibG9jayBvZiBjb2RlXG4gICAgICAgIC8vIGR1cGxpY2F0ZXMgdGhlIG1ldGFkYXRhIG9iamVjdCwgdGhlbiBzZXRzIHRoZVxuICAgICAgICAvLyBjb25maWcgZmllbGQgaW4gdGhlIGR1cGxpY2F0ZSwgcGFzc2luZyB0aGF0IHRvIHRoZSBwYXJ0aWFsLlxuICAgICAgICBsZXQgbWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBsZXQgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gbWV0YWRhdGEpIHtcbiAgICAgICAgICAgIG1kYXRhW3Byb3BdID0gbWV0YWRhdGFbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgbWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICAvLyBJbiB0aGlzIGNvbnRleHQsIHBhcnRpYWxTeW5jIGlzIGRpcmVjdGx5IGF2YWlsYWJsZVxuICAgICAgICAvLyBhcyBhIGZ1bmN0aW9uIHRoYXQgd2UgY2FuIGRpcmVjdGx5IHVzZS5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWxTeW5jIGAsIHBhcnRpYWxTeW5jKTtcbiAgICAgICAgbWRhdGEucGFydGlhbFN5bmMgPSBwYXJ0aWFsU3luYy5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICAvLyBmb3IgZmluZFN5bmMsIHRoZSBcImZvdW5kXCIgb2JqZWN0IGlzIFZQYXRoRGF0YSB3aGljaFxuICAgICAgICAvLyBkb2VzIG5vdCBoYXZlIGRvY0JvZHkgbm9yIGRvY0NvbnRlbnQuICBUaGVyZWZvcmUgd2VcbiAgICAgICAgLy8gbXVzdCByZWFkIHRoaXMgY29udGVudFxuICAgICAgICBsZXQgcGFydGlhbFRleHQgPSBmcy5yZWFkRmlsZVN5bmMoZm91bmQuZnNwYXRoLCAndXRmLTgnKTtcbiAgICAgICAgLy8gaWYgKGZvdW5kLmRvY0JvZHkpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQm9keTtcbiAgICAgICAgLy8gZWxzZSBpZiAoZm91bmQuZG9jQ29udGVudCkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NDb250ZW50O1xuICAgICAgICAvLyBlbHNlIHBhcnRpYWxUZXh0ID0gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsLWZ1bmNzIHJlbmRlclN5bmMgJHtyZW5kZXJlci5uYW1lfSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gcmVuZGVyZXIucmVuZGVyU3luYyg8UmVuZGVyZXJzLlJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBmb3VuZC5mc3BhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBwYXJ0aWFsVGV4dCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBtZGF0YVxuICAgICAgICAgICAgLy8gcGFydGlhbFRleHQsIG1kYXRhLCBmb3VuZFxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcuaHRtbCcpIHx8IGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcueGh0bWwnKSkge1xuICAgICAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlbmRlclBhcnRpYWwgbm8gUmVuZGVyZXIgZm91bmQgZm9yICR7Zm5hbWV9IC0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIGluZGV4Q2hhaW5JdGVtID0ge1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgdnBhdGg6IHN0cmluZztcbiAgICBmb3VuZFBhdGg6IHN0cmluZztcbiAgICBmb3VuZERpcjogc3RyaW5nO1xuICAgIGZpbGVuYW1lOiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIFN0YXJ0aW5nIGZyb20gYSB2aXJ0dWFsIHBhdGggaW4gdGhlIGRvY3VtZW50cywgc2VhcmNoZXMgdXB3YXJkcyB0b1xuICogdGhlIHJvb3Qgb2YgdGhlIGRvY3VtZW50cyBmaWxlLXNwYWNlLCBmaW5kaW5nIGZpbGVzIHRoYXQgXG4gKiByZW5kZXIgdG8gXCJpbmRleC5odG1sXCIuICBUaGUgXCJpbmRleC5odG1sXCIgZmlsZXMgYXJlIGluZGV4IGZpbGVzLFxuICogYXMgdGhlIG5hbWUgc3VnZ2VzdHMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIFxuICogQHBhcmFtIHsqfSBmbmFtZSBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5kZXhDaGFpbihcbiAgICBjb25maWcsIGZuYW1lXG4pOiBQcm9taXNlPGluZGV4Q2hhaW5JdGVtW10+IHtcblxuICAgIC8vIFRoaXMgdXNlZCB0byBiZSBhIGZ1bGwgZnVuY3Rpb24gaGVyZSwgYnV0IGhhcyBtb3ZlZFxuICAgIC8vIGludG8gdGhlIEZpbGVDYWNoZSBjbGFzcy4gIFJlcXVpcmluZyBhIGBjb25maWdgIG9wdGlvblxuICAgIC8vIGlzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBmb3JtZXIgQVBJLlxuXG4gICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIHJldHVybiBkb2N1bWVudHMuaW5kZXhDaGFpbihmbmFtZSk7XG59XG5cblxuLyoqXG4gKiBNYW5pcHVsYXRlIHRoZSByZWw9IGF0dHJpYnV0ZXMgb24gYSBsaW5rIHJldHVybmVkIGZyb20gTWFoYWJodXRhLlxuICpcbiAqIEBwYXJhbXMgeyRsaW5rfSBUaGUgbGluayB0byBtYW5pcHVsYXRlXG4gKiBAcGFyYW1zIHthdHRyfSBUaGUgYXR0cmlidXRlIG5hbWVcbiAqIEBwYXJhbXMge2RvYXR0cn0gQm9vbGVhbiBmbGFnIHdoZXRoZXIgdG8gc2V0ICh0cnVlKSBvciByZW1vdmUgKGZhbHNlKSB0aGUgYXR0cmlidXRlXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlua1JlbFNldEF0dHIoJGxpbmssIGF0dHIsIGRvYXR0cikge1xuICAgIGxldCBsaW5rcmVsID0gJGxpbmsuYXR0cigncmVsJyk7XG4gICAgbGV0IHJlbHMgPSBsaW5rcmVsID8gbGlua3JlbC5zcGxpdCgnICcpIDogW107XG4gICAgbGV0IGhhc2F0dHIgPSByZWxzLmluZGV4T2YoYXR0cikgPj0gMDtcbiAgICBpZiAoIWhhc2F0dHIgJiYgZG9hdHRyKSB7XG4gICAgICAgIHJlbHMudW5zaGlmdChhdHRyKTtcbiAgICAgICAgJGxpbmsuYXR0cigncmVsJywgcmVscy5qb2luKCcgJykpO1xuICAgIH0gZWxzZSBpZiAoaGFzYXR0ciAmJiAhZG9hdHRyKSB7XG4gICAgICAgIHJlbHMuc3BsaWNlKHJlbHMuaW5kZXhPZihhdHRyKSk7XG4gICAgICAgICRsaW5rLmF0dHIoJ3JlbCcsIHJlbHMuam9pbignICcpKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIENvbXB1dGUgYW4gYWJzb2x1dGUgdnBhdGggZnJvbSBhIHJlbGF0aXZlIHBhdGggcmVmZXJlbmNlLlxuICogXG4gKiBUaGlzIGZ1bmN0aW9uIHJlc29sdmVzIGEgcmVsYXRpdmUgcGF0aCAobGlrZSBcIi4uL2ZpbGUuaHRtbFwiIG9yIFwiLi9maWxlLmh0bWxcIilcbiAqIHRvIGFuIGFic29sdXRlIHZwYXRoIGluIHRoZSB2aXJ0dWFsIGZpbGVzeXN0ZW0sIGJhc2VkIG9uIHRoZSB2cGF0aCBvZiB0aGVcbiAqIGN1cnJlbnQgZG9jdW1lbnQuXG4gKiBcbiAqIElmIHRoZSBpbnB1dCBwYXRoIGlzIGFscmVhZHkgYWJzb2x1dGUgKHN0YXJ0cyB3aXRoICcvJyksIGl0IGlzIHJldHVybmVkXG4gKiBhcy1pcyBhZnRlciBub3JtYWxpemF0aW9uLlxuICogXG4gKiBAcGFyYW0gYmFzZVZwYXRoIFRoZSB2cGF0aCBvZiB0aGUgZG9jdW1lbnQgbWFraW5nIHRoZSByZWZlcmVuY2UgKGUuZy4sIG1ldGFkYXRhLmRvY3VtZW50LnBhdGgpXG4gKiBAcGFyYW0gcmVsYXRpdmVQYXRoIFRoZSBwYXRoIHRvIHJlc29sdmUgKGNhbiBiZSByZWxhdGl2ZSBvciBhYnNvbHV0ZSlcbiAqIEByZXR1cm5zIFRoZSBhYnNvbHV0ZSB2cGF0aCBpbiB0aGUgdmlydHVhbCBmaWxlc3lzdGVtXG4gKiBcbiAqIEBleGFtcGxlXG4gKiAvLyBGcm9tIGRvY3VtZW50IGF0ICdoaWVyL2RpcjEvcGFnZS5odG1sLm1kJyByZWZlcmVuY2luZyAnLi4vc2libGluZy9maWxlLmh0bWwnXG4gKiByZXNvbHZlVnBhdGgoJ2hpZXIvZGlyMS9wYWdlLmh0bWwubWQnLCAnLi4vc2libGluZy9maWxlLmh0bWwnKVxuICogLy8gUmV0dXJuczogJy9oaWVyL3NpYmxpbmcvZmlsZS5odG1sJ1xuICogXG4gKiBAZXhhbXBsZVxuICogLy8gQWxyZWFkeSBhYnNvbHV0ZSBwYXRoXG4gKiByZXNvbHZlVnBhdGgoJ2hpZXIvZGlyMS9wYWdlLmh0bWwubWQnLCAnL2Fic29sdXRlL3BhdGguaHRtbCcpXG4gKiAvLyBSZXR1cm5zOiAnL2Fic29sdXRlL3BhdGguaHRtbCdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVWcGF0aChiYXNlVnBhdGg6IHN0cmluZywgcmVsYXRpdmVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICghYmFzZVZwYXRoIHx8IHR5cGVvZiBiYXNlVnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVzb2x2ZVZwYXRoOiBiYXNlVnBhdGggbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcsIGdvdCAke3R5cGVvZiBiYXNlVnBhdGh9YCk7XG4gICAgfVxuICAgIGlmICghcmVsYXRpdmVQYXRoIHx8IHR5cGVvZiByZWxhdGl2ZVBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVzb2x2ZVZwYXRoOiByZWxhdGl2ZVBhdGggbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcsIGdvdCAke3R5cGVvZiByZWxhdGl2ZVBhdGh9YCk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHBhdGggaXMgYWxyZWFkeSBhYnNvbHV0ZSwgcmV0dXJuIGl0IG5vcm1hbGl6ZWRcbiAgICBpZiAocGF0aC5pc0Fic29sdXRlKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIHBhdGgubm9ybWFsaXplKHJlbGF0aXZlUGF0aCk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSBkaXJlY3Rvcnkgb2YgdGhlIGJhc2UgdnBhdGhcbiAgICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoYmFzZVZwYXRoKTtcbiAgICBcbiAgICAvLyBKb2luIHdpdGggJy8nIHByZWZpeCB0byBlbnN1cmUgd2UgZ2V0IGFuIGFic29sdXRlIHZwYXRoXG4gICAgLy8gYW5kIG5vcm1hbGl6ZSB0byBjbGVhbiB1cCBhbnkgLi4gb3IgLiBzZWdtZW50c1xuICAgIHJldHVybiBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4oJy8nLCBkaXIsIHJlbGF0aXZlUGF0aCkpO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLyBSU1MgRmVlZCBHZW5lcmF0aW9uXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVJTUyhjb25maWcsIGNvbmZpZ3JzcywgZmVlZERhdGEsIGl0ZW1zLCByZW5kZXJUbykge1xuXG4gICAgLy8gU3VwcG9zZWRseSBpdCdzIHJlcXVpcmVkIHRvIHVzZSBoYXNPd25Qcm9wZXJ0eVxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNzI4MzYwL2hvdy1kby1pLWNvcnJlY3RseS1jbG9uZS1hLWphdmFzY3JpcHQtb2JqZWN0IzcyODY5NFxuICAgIC8vXG4gICAgLy8gQnV0LCBpbiBvdXIgY2FzZSB0aGF0IHJlc3VsdGVkIGluIGFuIGVtcHR5IG9iamVjdFxuXG4gICAgLy8gY29uc29sZS5sb2coJ2NvbmZpZ3JzcyAnKyB1dGlsLmluc3BlY3QoY29uZmlncnNzKSk7XG5cbiAgICAvLyBDb25zdHJ1Y3QgaW5pdGlhbCByc3Mgb2JqZWN0XG4gICAgdmFyIHJzcyA9IHt9O1xuICAgIGZvciAobGV0IGtleSBpbiBjb25maWdyc3MucnNzKSB7XG4gICAgICAgIC8vaWYgKGNvbmZpZ3Jzcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICByc3Nba2V5XSA9IGNvbmZpZ3Jzcy5yc3Nba2V5XTtcbiAgICAgICAgLy99XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coJ3JzcyAnKyB1dGlsLmluc3BlY3QocnNzKSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZygnZmVlZERhdGEgJysgdXRpbC5pbnNwZWN0KGZlZWREYXRhKSk7XG5cbiAgICAvLyBUaGVuIGZpbGwgaW4gZnJvbSBmZWVkRGF0YVxuICAgIGZvciAobGV0IGtleSBpbiBmZWVkRGF0YSkge1xuICAgICAgICAvL2lmIChmZWVkRGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICByc3Nba2V5XSA9IGZlZWREYXRhW2tleV07XG4gICAgICAgIC8vfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKCdnZW5lcmF0ZVJTUyByc3MgJysgdXRpbC5pbnNwZWN0KHJzcykpO1xuXG4gICAgdmFyIHJzc2ZlZWQgPSBuZXcgUlNTKHJzcyk7XG5cbiAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHsgcnNzZmVlZC5pdGVtKGl0ZW0pOyB9KTtcblxuICAgIHZhciB4bWwgPSByc3NmZWVkLnhtbCgpO1xuICAgIHZhciByZW5kZXJPdXQgPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCByZW5kZXJUbyk7XG5cbiAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlck91dCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pXG4gICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJPdXQsIHhtbCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuXG59O1xuXG4vLyBGb3Igb0VtYmVkLCBDb25zaWRlciBtYWtpbmcgYW4gZXh0ZXJuYWwgcGx1Z2luXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9vZW1iZWQtYWxsXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9lbWJlZGFibGVcbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL21lZGlhLXBhcnNlclxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvb2VtYmV0dGVyXG5cblxuLyoqXG4gKiBUaGUgQWthc2hhUmVuZGVyIHByb2plY3QgY29uZmlndXJhdGlvbiBvYmplY3QuICBcbiAqIE9uZSBpbnN0YW50aWF0ZXMgYSBDb25maWd1cmF0aW9uIG9iamVjdCwgdGhlbiBmaWxscyBpdFxuICogd2l0aCBzZXR0aW5ncyBhbmQgcGx1Z2lucy5cbiAqIFxuICogQHNlZSBtb2R1bGU6Q29uZmlndXJhdGlvblxuICovXG5cbi8vIGNvbnN0IF9jb25maWdfcGx1Z2luRGF0YSA9IFN5bWJvbCgncGx1Z2luRGF0YScpO1xuLy8gY29uc3QgX2NvbmZpZ19hc3NldHNEaXJzID0gU3ltYm9sKCdhc3NldHNEaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX2RvY3VtZW50RGlycyA9IFN5bWJvbCgnZG9jdW1lbnREaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX2xheW91dERpcnMgPSBTeW1ib2woJ2xheW91dERpcnMnKTtcbi8vIGNvbnN0IF9jb25maWdfcGFydGlhbERpcnMgPSBTeW1ib2woJ3BhcnRpYWxEaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX21haGFmdW5jcyA9IFN5bWJvbCgnbWFoYWZ1bmNzJyk7XG4vLyBjb25zdCBfY29uZmlnX3JlbmRlclRvID0gU3ltYm9sKCdyZW5kZXJUbycpO1xuLy8gY29uc3QgX2NvbmZpZ19tZXRhZGF0YSA9IFN5bWJvbCgnbWV0YWRhdGEnKTtcbi8vIGNvbnN0IF9jb25maWdfcm9vdF91cmwgPSBTeW1ib2woJ3Jvb3RfdXJsJyk7XG4vLyBjb25zdCBfY29uZmlnX3NjcmlwdHMgPSBTeW1ib2woJ3NjcmlwdHMnKTtcbi8vIGNvbnN0IF9jb25maWdfcGx1Z2lucyA9IFN5bWJvbCgncGx1Z2lucycpO1xuLy8gY29uc3QgX2NvbmZpZ19jaGVlcmlvID0gU3ltYm9sKCdjaGVlcmlvJyk7XG4vLyBjb25zdCBfY29uZmlnX2NvbmZpZ2RpciA9IFN5bWJvbCgnY29uZmlnZGlyJyk7XG4vLyBjb25zdCBfY29uZmlnX2NhY2hlZGlyICA9IFN5bWJvbCgnY2FjaGVkaXInKTtcbi8vIGNvbnN0IF9jb25maWdfY29uY3VycmVuY3kgPSBTeW1ib2woJ2NvbmN1cnJlbmN5Jyk7XG4vLyBjb25zdCBfY29uZmlnX3JlbmRlcmVycyA9IFN5bWJvbCgncmVuZGVyZXJzJyk7XG5cbi8qKlxuICogRGF0YSB0eXBlIGRlc2NyaWJpbmcgaXRlbXMgaW4gdGhlXG4gKiBqYXZhU2NyaXB0VG9wIGFuZCBqYXZhU2NyaXB0Qm90dG9tIGFycmF5cy5cbiAqIFRoZSBmaWVsZHMgY29ycmVzcG9uZCB0byB0aGUgYXR0cmlidXRlc1xuICogb2YgdGhlIDxzY3JpcHQ+IHRhZyB3aGljaCBjYW4gYmUgdXNlZFxuICogZWl0aGVyIGluIHRoZSB0b3Agb3IgYm90dG9tIG9mXG4gKiBhbiBIVE1MIGZpbGUuXG4gKi9cbmV4cG9ydCB0eXBlIGphdmFTY3JpcHRJdGVtID0ge1xuICAgIGhyZWY/OiBzdHJpbmcsXG4gICAgc2NyaXB0Pzogc3RyaW5nLFxuICAgIGxhbmc/OiBzdHJpbmdcbn07XG5cbmV4cG9ydCB0eXBlIHN0eWxlc2hlZXRJdGVtID0ge1xuICAgIGhyZWY/OiBzdHJpbmcsXG4gICAgbWVkaWE/OiBzdHJpbmdcblxufTtcblxuLyoqXG4gKiBEZWZpbmVzIHRoZSBzdHJ1Y3R1cmUgZm9yIGRpcmVjdG9yeVxuICogbW91bnQgc3BlY2lmaWNhdGlvbiBpbiB0aGUgQ29uZmlndXJhdGlvbi5cbiAqIFxuICogVGhlIHNpbXBsZSAnc3RyaW5nJyBmb3JtIHNheXMgdG8gbW91bnRcbiAqIHRoZSBuYW1lZCBmc3BhdGggb24gdGhlIHJvb3Qgb2YgdGhlXG4gKiB2aXJ0dWFsIGZpbGVzcGFjZS5cbiAqIFxuICogVGhlIG9iamVjdCBmb3JtIGFsbG93cyB1cyB0byBtb3VudFxuICogYW4gZnNwYXRoIGludG8gYSBkaWZmZXJlbnQgbG9jYXRpb25cbiAqIGluIHRoZSB2aXJ0dWFsIGZpbGVzcGFjZSwgdG8gaWdub3JlXG4gKiBmaWxlcyBiYXNlZCBvbiBHTE9CIHBhdHRlcm5zLCBhbmQgdG9cbiAqIGluY2x1ZGUgbWV0YWRhdGEgZm9yIGV2ZXJ5IGZpbGUgaW5cbiAqIGEgZGlyZWN0b3J5IHRyZWUuXG4gKiBcbiAqIEluIHRoZSBmaWxlLWNhY2hlIG1vZHVsZSwgdGhpcyBpc1xuICogY29udmVydGVkIHRvIHRoZSBkaXJUb1dhdGNoIHN0cnVjdHVyZVxuICogdXNlZCBieSBTdGFja2VkRGlycy5cbiAqL1xuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9mIGFuIEFrYXNoYVJlbmRlciBwcm9qZWN0LCBpbmNsdWRpbmcgdGhlIGlucHV0IGRpcmVjdG9yaWVzLFxuICogb3V0cHV0IGRpcmVjdG9yeSwgcGx1Z2lucywgYW5kIHZhcmlvdXMgc2V0dGluZ3MuXG4gKlxuICogVVNBR0U6XG4gKlxuICogY29uc3QgYWthc2hhID0gcmVxdWlyZSgnYWthc2hhcmVuZGVyJyk7XG4gKiBjb25zdCBjb25maWcgPSBuZXcgYWthc2hhLkNvbmZpZ3VyYXRpb24oKTtcbiAqL1xuZXhwb3J0IGNsYXNzIENvbmZpZ3VyYXRpb24ge1xuICAgICNyZW5kZXJlcnM6IFJlbmRlcmVycy5Db25maWd1cmF0aW9uO1xuICAgICNjb25maWdkaXI6IHN0cmluZztcbiAgICAjY2FjaGVkaXI6IHN0cmluZztcbiAgICAjYXNzZXRzRGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjbGF5b3V0RGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjZG9jdW1lbnREaXJzPzogZGlyVG9Nb3VudFtdO1xuICAgICNwYXJ0aWFsRGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjbWFoYWZ1bmNzO1xuICAgICNjaGVlcmlvPzogY2hlZXJpby5DaGVlcmlvT3B0aW9ucztcbiAgICAjcmVuZGVyVG86IHN0cmluZztcbiAgICAjc2NyaXB0cz86IHtcbiAgICAgICAgc3R5bGVzaGVldHM/OiBzdHlsZXNoZWV0SXRlbVtdLFxuICAgICAgICBqYXZhU2NyaXB0VG9wPzogamF2YVNjcmlwdEl0ZW1bXSxcbiAgICAgICAgamF2YVNjcmlwdEJvdHRvbT86IGphdmFTY3JpcHRJdGVtW11cbiAgICB9O1xuICAgICNjb25jdXJyZW5jeTogbnVtYmVyO1xuICAgICNjYWNoaW5nVGltZW91dDogbnVtYmVyO1xuICAgICNtZXRhZGF0YTogYW55O1xuICAgICNyb290X3VybDogc3RyaW5nO1xuICAgICNwbHVnaW5zO1xuICAgICNwbHVnaW5EYXRhO1xuICAgICN2ZXJib3NlOiBib29sZWFuO1xuICAgICNwZXJmRGF0YURpcjogc3RyaW5nO1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZXBhdGgpIHtcblxuICAgICAgICAvLyB0aGlzW19jb25maWdfcmVuZGVyZXJzXSA9IFtdO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMgPSBuZXcgUmVuZGVyZXJzLkNvbmZpZ3VyYXRpb24oe1xuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuI21haGFmdW5jcyA9IFtdO1xuICAgICAgICB0aGlzLiNzY3JpcHRzID0ge1xuICAgICAgICAgICAgc3R5bGVzaGVldHM6IFtdLFxuICAgICAgICAgICAgamF2YVNjcmlwdFRvcDogW10sXG4gICAgICAgICAgICBqYXZhU2NyaXB0Qm90dG9tOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuI2NvbmN1cnJlbmN5ID0gMztcbiAgICAgICAgLy8gNjAgc2Vjb25kcywgb3IgMSBtaW51dGVcbiAgICAgICAgdGhpcy4jY2FjaGluZ1RpbWVvdXQgPSA2MDAwMDtcblxuICAgICAgICB0aGlzLiNkb2N1bWVudERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jbGF5b3V0RGlycyA9IFtdO1xuICAgICAgICB0aGlzLiNwYXJ0aWFsRGlycyA9IFtdO1xuICAgICAgICB0aGlzLiNhc3NldHNEaXJzID0gW107XG5cbiAgICAgICAgdGhpcy4jbWFoYWZ1bmNzID0gW107XG5cbiAgICAgICAgdGhpcy4jcmVuZGVyVG8gPSAnb3V0JztcblxuICAgICAgICB0aGlzLiNtZXRhZGF0YSA9IHt9IGFzIGFueTtcblxuICAgICAgICB0aGlzLiNwbHVnaW5zID0gW107XG4gICAgICAgIHRoaXMuI3BsdWdpbkRhdGEgPSBbXTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuI3ZlcmJvc2UgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLiNwZXJmRGF0YURpciA9IHVuZGVmaW5lZDtcblxuICAgICAgICAvKlxuICAgICAgICAgKiBJcyB0aGlzIHRoZSBiZXN0IHBsYWNlIGZvciB0aGlzPyAgSXQgaXMgbmVjZXNzYXJ5IHRvXG4gICAgICAgICAqIGNhbGwgdGhpcyBmdW5jdGlvbiBzb21ld2hlcmUuICBUaGUgbmF0dXJlIG9mIHRoaXMgZnVuY3Rpb25cbiAgICAgICAgICogaXMgdGhhdCBpdCBjYW4gYmUgY2FsbGVkIG11bHRpcGxlIHRpbWVzIHdpdGggbm8gaW1wYWN0LiAgXG4gICAgICAgICAqIEJ5IGJlaW5nIGxvY2F0ZWQgaGVyZSwgaXQgd2lsbCBhbHdheXMgYmUgY2FsbGVkIGJ5IHRoZVxuICAgICAgICAgKiB0aW1lIGFueSBDb25maWd1cmF0aW9uIGlzIGdlbmVyYXRlZC5cbiAgICAgICAgICovXG4gICAgICAgIC8vIFRoaXMgaXMgZXhlY3V0ZWQgaW4gQGFrYXNoYWNtcy9yZW5kZXJlcnNcbiAgICAgICAgLy8gdGhpc1tfY29uZmlnX3JlbmRlcmVyc10ucmVnaXN0ZXJCdWlsdEluUmVuZGVyZXJzKCk7XG5cbiAgICAgICAgLy8gUHJvdmlkZSBhIG1lY2hhbmlzbSB0byBlYXNpbHkgc3BlY2lmeSBjb25maWdEaXJcbiAgICAgICAgLy8gVGhlIHBhdGggaW4gY29uZmlnRGlyIG11c3QgYmUgdGhlIHBhdGggb2YgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZS5cbiAgICAgICAgLy8gVGhlcmUgZG9lc24ndCBhcHBlYXIgdG8gYmUgYSB3YXkgdG8gZGV0ZXJtaW5lIHRoYXQgZnJvbSBoZXJlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBGb3IgZXhhbXBsZSBtb2R1bGUucGFyZW50LmZpbGVuYW1lIGluIHRoaXMgY2FzZSBwb2ludHNcbiAgICAgICAgLy8gdG8gYWthc2hhcmVuZGVyL2luZGV4LmpzIGJlY2F1c2UgdGhhdCdzIHRoZSBtb2R1bGUgd2hpY2hcbiAgICAgICAgLy8gbG9hZGVkIHRoaXMgbW9kdWxlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBPbmUgY291bGQgaW1hZ2luZSBhIGRpZmZlcmVudCBpbml0aWFsaXphdGlvbiBwYXR0ZXJuLiAgSW5zdGVhZFxuICAgICAgICAvLyBvZiBha2FzaGFyZW5kZXIgcmVxdWlyaW5nIENvbmZpZ3VyYXRpb24uanMsIHRoYXQgZmlsZSBjb3VsZCBiZVxuICAgICAgICAvLyByZXF1aXJlZCBieSB0aGUgY29uZmlndXJhdGlvbiBmaWxlLiAgSW4gc3VjaCBhIGNhc2VcbiAgICAgICAgLy8gbW9kdWxlLnBhcmVudC5maWxlbmFtZSBXT1VMRCBpbmRpY2F0ZSB0aGUgZmlsZW5hbWUgZm9yIHRoZVxuICAgICAgICAvLyBjb25maWd1cmF0aW9uIGZpbGUsIGFuZCB3b3VsZCBiZSBhIHNvdXJjZSBvZiBzZXR0aW5nXG4gICAgICAgIC8vIHRoZSBjb25maWdEaXIgdmFsdWUuXG4gICAgICAgIGlmICh0eXBlb2YgbW9kdWxlcGF0aCAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlcGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5jb25maWdEaXIgPSBwYXRoLmRpcm5hbWUobW9kdWxlcGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWZXJ5IGNhcmVmdWxseSBhZGQgdGhlIDxwYXJ0aWFsPiBzdXBwb3J0IGZyb20gTWFoYWJodXRhIGFzIHRoZVxuICAgICAgICAvLyB2ZXJ5IGZpcnN0IHRoaW5nIHNvIHRoYXQgaXQgZXhlY3V0ZXMgYmVmb3JlIGFueXRoaW5nIGVsc2UuXG4gICAgICAgIGxldCBjb25maWcgPSB0aGlzO1xuICAgICAgICB0aGlzLmFkZE1haGFiaHV0YShtYWhhUGFydGlhbC5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgICAgICByZW5kZXJQYXJ0aWFsOiBmdW5jdGlvbihmbmFtZSwgbWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgZGVmYXVsdCBjb25maWd1cmF0aW9uIHZhbHVlcyBmb3IgYW55dGhpbmcgd2hpY2ggaGFzIG5vdFxuICAgICAqIGFscmVhZHkgYmVlbiBjb25maWd1cmVkLiAgU29tZSBidWlsdC1pbiBkZWZhdWx0cyBoYXZlIGJlZW4gZGVjaWRlZFxuICAgICAqIGFoZWFkIG9mIHRpbWUuICBGb3IgZWFjaCBjb25maWd1cmF0aW9uIHNldHRpbmcsIGlmIG5vdGhpbmcgaGFzIGJlZW5cbiAgICAgKiBkZWNsYXJlZCwgdGhlbiB0aGUgZGVmYXVsdCBpcyBzdWJzdGl0dXRlZC5cbiAgICAgKlxuICAgICAqIEl0IGlzIGV4cGVjdGVkIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgbGFzdCBpbiB0aGUgY29uZmlnIGZpbGUuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGluc3RhbGxzIHRoZSBgYnVpbHQtaW5gIHBsdWdpbi4gIEl0IG5lZWRzIHRvIGJlIGxhc3Qgb25cbiAgICAgKiB0aGUgcGx1Z2luIGNoYWluIHNvIHRoYXQgaXRzIHN0eWxlc2hlZXRzIGFuZCBwYXJ0aWFscyBhbmQgd2hhdG5vdFxuICAgICAqIGNhbiBiZSBvdmVycmlkZGVuIGJ5IG90aGVyIHBsdWdpbnMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBwcmVwYXJlKCkge1xuXG4gICAgICAgIGNvbnN0IENPTkZJRyA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgY29uZmlnRGlyUGF0aCA9IGZ1bmN0aW9uKGRpcm5tKSB7XG4gICAgICAgICAgICBsZXQgY29uZmlnUGF0aCA9IGRpcm5tO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBDT05GSUcuY29uZmlnRGlyICE9PSAndW5kZWZpbmVkJyAmJiBDT05GSUcuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb25maWdQYXRoID0gcGF0aC5qb2luKENPTkZJRy5jb25maWdEaXIsIGRpcm5tKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb25maWdQYXRoO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHN0YXQ7XG5cbiAgICAgICAgY29uc3QgY2FjaGVEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2NhY2hlJyk7XG4gICAgICAgIGlmICghdGhpcy4jY2FjaGVkaXIpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGNhY2hlRGlyc1BhdGgpXG4gICAgICAgICAgICAgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhjYWNoZURpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FjaGVEaXIgPSAnY2FjaGUnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidjYWNoZScgaXMgbm90IGEgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKGNhY2hlRGlyc1BhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FjaGVEaXIgPSAnY2FjaGUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI2NhY2hlZGlyICYmICFmcy5leGlzdHNTeW5jKHRoaXMuI2NhY2hlZGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHRoaXMuI2NhY2hlZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFzc2V0c0RpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnYXNzZXRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jYXNzZXRzRGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoYXNzZXRzRGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoYXNzZXRzRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRBc3NldHNEaXIoJ2Fzc2V0cycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxheW91dHNEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2xheW91dHMnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNsYXlvdXREaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhsYXlvdXRzRGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMobGF5b3V0c0RpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkTGF5b3V0c0RpcignbGF5b3V0cycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcnRpYWxEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ3BhcnRpYWxzJyk7XG4gICAgICAgIGlmICghbWFoYVBhcnRpYWwuY29uZmlndXJhdGlvbi5wYXJ0aWFsRGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocGFydGlhbERpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKHBhcnRpYWxEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZFBhcnRpYWxzRGlyKCdwYXJ0aWFscycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50RGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdkb2N1bWVudHMnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNkb2N1bWVudERpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGRvY3VtZW50RGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoZG9jdW1lbnREaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZERvY3VtZW50c0RpcignZG9jdW1lbnRzJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ2RvY3VtZW50cycgaXMgbm90IGEgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gJ2RvY3VtZW50RGlycycgc2V0dGluZywgYW5kIG5vICdkb2N1bWVudHMnIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlbmRlclRvUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ291dCcpO1xuICAgICAgICBpZiAoIXRoaXMuI3JlbmRlclRvKSAge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocmVuZGVyVG9QYXRoKVxuICAgICAgICAgICAgICYmIChzdGF0ID0gZnMuc3RhdFN5bmMocmVuZGVyVG9QYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UmVuZGVyRGVzdGluYXRpb24oJ291dCcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidvdXQnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhyZW5kZXJUb1BhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0UmVuZGVyRGVzdGluYXRpb24oJ291dCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuI3JlbmRlclRvICYmICFmcy5leGlzdHNTeW5jKHRoaXMuI3JlbmRlclRvKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHRoaXMuI3JlbmRlclRvLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBha2FzaGFjbXMtYnVpbHRpbiBwbHVnaW4gbmVlZHMgdG8gYmUgbGFzdCBvbiB0aGUgY2hhaW4gc28gdGhhdFxuICAgICAgICAvLyBpdHMgcGFydGlhbHMgZXRjIGNhbiBiZSBlYXNpbHkgb3ZlcnJpZGRlbi4gIFRoaXMgaXMgdGhlIG1vc3QgY29udmVuaWVudFxuICAgICAgICAvLyBwbGFjZSB0byBkZWNsYXJlIHRoYXQgcGx1Z2luLlxuICAgICAgICAvL1xuXG4gICAgICAgIC8vIE5vcm1hbGx5IHdlJ2QgZG8gcmVxdWlyZSgnLi9idWlsdC1pbi5qcycpLlxuICAgICAgICAvLyBCdXQsIGluIHRoaXMgY29udGV4dCB0aGF0IGRvZXNuJ3Qgd29yay5cbiAgICAgICAgLy8gV2hhdCB3ZSBkaWQgaXMgdG8gaW1wb3J0IHRoZVxuICAgICAgICAvLyBCdWlsdEluUGx1Z2luIGNsYXNzIGVhcmxpZXIgc28gdGhhdFxuICAgICAgICAvLyBpdCBjYW4gYmUgdXNlZCBoZXJlLlxuICAgICAgICB0aGlzLnVzZShCdWlsdEluUGx1Z2luLCB7XG4gICAgICAgICAgICAvLyBidWlsdC1pbiBvcHRpb25zIGlmIGFueVxuICAgICAgICAgICAgLy8gRG8gbm90IG5lZWQgdGhpcyBoZXJlIGFueSBsb25nZXIgYmVjYXVzZSBpdCBpcyBoYW5kbGVkXG4gICAgICAgICAgICAvLyBpbiB0aGUgY29uc3RydWN0b3IuXG4gICAgICAgICAgICAvLyBTZXQgdXAgdGhlIE1haGFiaHV0YSBwYXJ0aWFsIHRhZyBzbyBpdCByZW5kZXJzIHRocm91Z2ggQWthc2hhUmVuZGVyXG4gICAgICAgICAgICAvLyByZW5kZXJQYXJ0aWFsOiBmdW5jdGlvbihmbmFtZSwgbWV0YWRhdGEpIHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gcmVuZGVyLnBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWNvcmQgdGhlIGNvbmZpZ3VyYXRpb24gZGlyZWN0b3J5IHNvIHRoYXQgd2UgY2FuIGNvcnJlY3RseSBpbnRlcnBvbGF0ZVxuICAgICAqIHRoZSBwYXRobmFtZXMgd2UncmUgcHJvdmlkZWQuXG4gICAgICovXG4gICAgc2V0IGNvbmZpZ0RpcihjZmdkaXI6IHN0cmluZykgeyB0aGlzLiNjb25maWdkaXIgPSBjZmdkaXI7IH1cbiAgICBnZXQgY29uZmlnRGlyKCkgeyByZXR1cm4gdGhpcy4jY29uZmlnZGlyOyB9XG5cbiAgICBzZXQgY2FjaGVEaXIoZGlybm06IHN0cmluZykgeyB0aGlzLiNjYWNoZWRpciA9IGRpcm5tOyB9XG4gICAgZ2V0IGNhY2hlRGlyKCkgeyByZXR1cm4gdGhpcy4jY2FjaGVkaXI7IH1cblxuICAgIHNldCB2ZXJib3NlKHZhbDogYm9vbGVhbikgeyB0aGlzLiN2ZXJib3NlID0gdmFsOyB9XG4gICAgZ2V0IHZlcmJvc2UoKSB7IHJldHVybiB0aGlzLiN2ZXJib3NlOyB9XG5cbiAgICBzZXQgcGVyZkRhdGFEaXIoc3RvcmVEaXI6IHN0cmluZykge1xuICAgICAgICB0aGlzLiNwZXJmRGF0YURpciA9IHN0b3JlRGlyO1xuICAgIH1cbiAgICBnZXQgcGVyZkRhdGFEaXIoKSB7IHJldHVybiB0aGlzLiNwZXJmRGF0YURpcjsgfVxuXG4gICAgLy8gc2V0IGFrYXNoYShfYWthc2hhKSAgeyB0aGlzW19jb25maWdfYWthc2hhXSA9IF9ha2FzaGE7IH1cbiAgICBnZXQgYWthc2hhKCkgeyByZXR1cm4gbW9kdWxlX2V4cG9ydHM7IH1cblxuICAgIGFzeW5jIGRvY3VtZW50c0NhY2hlKCkgeyByZXR1cm4gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlOyB9XG4gICAgYXN5bmMgYXNzZXRzQ2FjaGUoKSAgICB7IHJldHVybiBmaWxlY2FjaGUuYXNzZXRzQ2FjaGU7IH1cbiAgICBhc3luYyBsYXlvdXRzQ2FjaGUoKSAgIHsgcmV0dXJuIGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGU7IH1cbiAgICBhc3luYyBwYXJ0aWFsc0NhY2hlKCkgIHsgcmV0dXJuIGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIGRvY3VtZW50RGlycyBjb25maWd1cmF0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBkaXJUb01vdW50fSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZSBvciBkaXJUb01vdW50IG9iamVjdFxuICAgICAqL1xuICAgIGFkZERvY3VtZW50c0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZERvY3VtZW50c0RpciAtIGludmFsaWQgZGlyVG9Nb3VudCBvYmplY3Q6ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy4jZG9jdW1lbnREaXJzLnB1c2goZGlyTW91bnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgZG9jdW1lbnREaXJzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jZG9jdW1lbnREaXJzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvb2sgdXAgdGhlIGRvY3VtZW50IGRpcmVjdG9yeSBpbmZvcm1hdGlvbiBmb3IgYSBnaXZlbiBkb2N1bWVudCBkaXJlY3RvcnkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRpcm5hbWUgVGhlIGRvY3VtZW50IGRpcmVjdG9yeSB0byBzZWFyY2ggZm9yXG4gICAgICovXG4gICAgZG9jdW1lbnREaXJJbmZvKGRpcm5hbWU6IHN0cmluZykge1xuICAgICAgICBmb3IgKHZhciBkb2NEaXIgb2YgdGhpcy5kb2N1bWVudERpcnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jRGlyID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGlmIChkb2NEaXIuc3JjID09PSBkaXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2NEaXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChkb2NEaXIgPT09IGRpcm5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jRGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBsYXlvdXREaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgZGlyVG9Nb3VudH0gZGlyIFRoZSBwYXRobmFtZSB0byB1c2Ugb3IgZGlyVG9Nb3VudCBvYmplY3RcbiAgICAgKi9cbiAgICBhZGRMYXlvdXRzRGlyKGRpcjogc3RyaW5nIHwgZGlyVG9Nb3VudCkge1xuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpcikgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAuLi5kaXIsXG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzRGlyVG9Nb3VudChkaXJNb3VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkTGF5b3V0c0RpciAtIGludmFsaWQgZGlyVG9Nb3VudCBvYmplY3Q6ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy4jbGF5b3V0RGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLmFkZExheW91dERpcihkaXJNb3VudC5zcmMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbGF5b3V0RGlycygpIHsgcmV0dXJuIHRoaXMuI2xheW91dERpcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgcGFydGlhbERpcnMgY29uZmlndXJ0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBkaXJUb01vdW50fSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZSBvciBkaXJUb01vdW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZFBhcnRpYWxzRGlyKGRpcjogc3RyaW5nIHwgZGlyVG9Nb3VudCkge1xuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpcikgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAuLi5kaXIsXG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzRGlyVG9Nb3VudChkaXJNb3VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkUGFydGlhbHNEaXIgLSBpbnZhbGlkIGRpclRvTW91bnQgb2JqZWN0OiAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI3BhcnRpYWxEaXJzLnB1c2goZGlyTW91bnQpO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMuYWRkUGFydGlhbERpcihkaXJNb3VudC5zcmMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcGFydGlhbHNEaXJzKCkgeyByZXR1cm4gdGhpcy4jcGFydGlhbERpcnM7IH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIGFzc2V0RGlycyBjb25maWd1cnRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IGRpclRvTW91bnR9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlIG9yIGRpclRvTW91bnQgb2JqZWN0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkQXNzZXRzRGlyKGRpcjogc3RyaW5nIHwgZGlyVG9Nb3VudCkge1xuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpcikgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAuLi5kaXIsXG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzRGlyVG9Nb3VudChkaXJNb3VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkQXNzZXRzRGlyIC0gaW52YWxpZCBkaXJUb01vdW50IG9iamVjdDogJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLiNhc3NldHNEaXJzLnB1c2goZGlyTW91bnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgYXNzZXREaXJzKCkgeyByZXR1cm4gdGhpcy4jYXNzZXRzRGlyczsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGFuIGFycmF5IG9mIE1haGFiaHV0YSBmdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBtYWhhZnVuY3NcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRNYWhhYmh1dGEobWFoYWZ1bmNzOiBtYWhhYmh1dGEuTWFoYWZ1bmNBcnJheSB8IG1haGFiaHV0YS5NYWhhZnVuY1R5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtYWhhZnVuY3MgPT09ICd1bmRlZmluZWQnIHx8ICFtYWhhZnVuY3MpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5kZWZpbmVkIG1haGFmdW5jcyBpbiAke3RoaXMuY29uZmlnRGlyfWApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuI21haGFmdW5jcy5wdXNoKG1haGFmdW5jcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBtYWhhZnVuY3MoKSB7IHJldHVybiB0aGlzLiNtYWhhZnVuY3M7IH1cblxuICAgIC8qKlxuICAgICAqIERlZmluZSB0aGUgZGlyZWN0b3J5IGludG8gd2hpY2ggdGhlIHByb2plY3QgaXMgcmVuZGVyZWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgc2V0UmVuZGVyRGVzdGluYXRpb24oZGlyOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBpZiAodGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyKSkge1xuICAgICAgICAgICAgICAgIGRpciA9IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNyZW5kZXJUbyA9IGRpcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIEZldGNoIHRoZSBkZWNsYXJlZCBkZXN0aW5hdGlvbiBmb3IgcmVuZGVyaW5nIHRoZSBwcm9qZWN0LiAqL1xuICAgIGdldCByZW5kZXJEZXN0aW5hdGlvbigpIHsgcmV0dXJuIHRoaXMuI3JlbmRlclRvOyB9XG4gICAgZ2V0IHJlbmRlclRvKCkgeyByZXR1cm4gdGhpcy4jcmVuZGVyVG87IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHZhbHVlIHRvIHRoZSBwcm9qZWN0IG1ldGFkYXRhLiAgVGhlIG1ldGFkYXRhIGlzIGNvbWJpbmVkIHdpdGhcbiAgICAgKiB0aGUgZG9jdW1lbnQgbWV0YWRhdGEgYW5kIHVzZWQgZHVyaW5nIHJlbmRlcmluZy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5kZXggVGhlIGtleSB0byBzdG9yZSB0aGUgdmFsdWUuXG4gICAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBzdG9yZSBpbiB0aGUgbWV0YWRhdGEuXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkTWV0YWRhdGEoaW5kZXg6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgICAgICB2YXIgbWQgPSB0aGlzLiNtZXRhZGF0YTtcbiAgICAgICAgbWRbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBtZXRhZGF0YSgpIHsgcmV0dXJuIHRoaXMuI21ldGFkYXRhOyB9XG5cbiAgICAjZGVzY3JpcHRpb25zOiBUYWdEZXNjcmlwdGlvbltdO1xuXG4gICAgLyoqXG4gICAgICogQWRkIHRhZyBkZXNjcmlwdGlvbnMgdG8gdGhlIGRhdGFiYXNlLiAgVGhlIHB1cnBvc2VcbiAgICAgKiBpcyBmb3IgZXhhbXBsZSBhIHRhZyBpbmRleCBwYWdlIGNhbiBnaXZlIGFcbiAgICAgKiBkZXNjcmlwdGlvbiBhdCB0aGUgdG9wIG9mIHRoZSBwYWdlLlxuICAgICAqXG4gICAgICogTk9URTogUG90ZW50aWFsIGJ1ZyAtIFRoaXMgZnVuY3Rpb24gcmVwbGFjZXMgdGhlIGVudGlyZSAjZGVzY3JpcHRpb25zXG4gICAgICogYXJyYXkgcmF0aGVyIHRoYW4gbWVyZ2luZyB3aXRoIGV4aXN0aW5nIGRlc2NyaXB0aW9ucy4gSWYgY2FsbGVkIG11bHRpcGxlXG4gICAgICogdGltZXMsIGVhcmxpZXIgZGVzY3JpcHRpb25zIHdpbGwgYmUgbG9zdC4gQ3VycmVudCBhc3N1bXB0aW9uIGlzIHRoaXNcbiAgICAgKiBmdW5jdGlvbiBpcyBvbmx5IGNhbGxlZCBvbmNlIGZyb20gdGhlIGNvbmZpZ3VyYXRpb24gZmlsZS4gQSBmdXR1cmVcbiAgICAgKiBlbmhhbmNlbWVudCB3b3VsZCBiZSB0byBtZXJnZSBkZXNjcmlwdGlvbnMgaW5zdGVhZCBvZiByZXBsYWNpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGFnZGVzY3MgXG4gICAgICovXG4gICAgYXN5bmMgYWRkVGFnRGVzY3JpcHRpb25zKHRhZ2Rlc2NzOiBUYWdEZXNjcmlwdGlvbltdKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0YWdkZXNjcykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkVGFnRGVzY3JpcHRpb25zIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXkgb2YgdGFnIGRlc2NyaXB0aW9uc2ApO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgZGVzYyBvZiB0YWdkZXNjcykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkZXNjLnRhZ05hbWUgIT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgfHwgdHlwZW9mIGRlc2MuZGVzY3JpcHRpb24gIT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbmNvcnJlY3QgdGFnIGRlc2NyaXB0aW9uICR7dXRpbC5pbnNwZWN0KGRlc2MpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IENvbnNpZGVyIG1lcmdpbmcgd2l0aCBleGlzdGluZyBkZXNjcmlwdGlvbnMgaW5zdGVhZCBvZiByZXBsYWNpbmdcbiAgICAgICAgdGhpcy4jZGVzY3JpcHRpb25zID0gdGFnZGVzY3M7XG4gICAgfVxuXG4gICAgYXN5bmMgI3NhdmVEZXNjcmlwdGlvbnNUb0RCKCkge1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuI2Rlc2NyaXB0aW9ucykpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZGVzYyBvZiB0aGlzLiNkZXNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBkb2N1bWVudHMuYWRkVGFnRGVzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIGRlc2MudGFnTmFtZSwgZGVzYy5kZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIERvY3VtZW50IHRoZSBVUkwgZm9yIGEgd2Vic2l0ZSBwcm9qZWN0LlxuICAgICogQHBhcmFtIHtzdHJpbmd9IHJvb3RfdXJsXG4gICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAqL1xuICAgIHJvb3RVUkwocm9vdF91cmw6IHN0cmluZykge1xuICAgICAgICB0aGlzLiNyb290X3VybCA9IHJvb3RfdXJsO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcm9vdF91cmwoKSB7IHJldHVybiB0aGlzLiNyb290X3VybDsgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IGhvdyBtYW55IGRvY3VtZW50cyB0byByZW5kZXIgY29uY3VycmVudGx5LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb25jdXJyZW5jeVxuICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgc2V0Q29uY3VycmVuY3koY29uY3VycmVuY3k6IG51bWJlcikge1xuICAgICAgICB0aGlzLiNjb25jdXJyZW5jeSA9IGNvbmN1cnJlbmN5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgY29uY3VycmVuY3koKSB7IHJldHVybiB0aGlzLiNjb25jdXJyZW5jeTsgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB0aW1lLCBpbiBtaWxpc2Vjb25kcywgdG8gaG9ub3JcbiAgICAgKiB0aGUgU2VhcmNoQ2FjaGUgaW4gdGhlIHNlYXJjaCBmdW5jdGlvbi5cbiAgICAgKiBcbiAgICAgKiBEZWZhdWx0IGlzIDYwMDAwICgxIG1pbnV0ZSkuXG4gICAgICogXG4gICAgICogU2V0IHRvIDAgdG8gZGlzYWJsZSBjYWNoaW5nLlxuICAgICAqIEBwYXJhbSB0aW1lb3V0IFxuICAgICAqL1xuICAgIHNldENhY2hpbmdUaW1lb3V0KHRpbWVvdXQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLiNjYWNoaW5nVGltZW91dCA9IHRpbWVvdXQ7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZXRTZWFyY2hDYWNoZVRpbWVvdXQgJHt0aGlzLiNzZWFyY2hDYWNoZVRpbWVvdXR9YCk7XG4gICAgfVxuXG4gICAgZ2V0IGNhY2hpbmdUaW1lb3V0KCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoQ2FjaGVUaW1lb3V0ICR7dGhpcy4jc2VhcmNoQ2FjaGVUaW1lb3V0fWApO1xuICAgICAgICByZXR1cm4gdGhpcy4jY2FjaGluZ1RpbWVvdXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBKYXZhU2NyaXB0IHRvIGFkZCB3aXRoaW4gdGhlIGhlYWQgdGFnIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRIZWFkZXJKYXZhU2NyaXB0KHNjcmlwdDogamF2YVNjcmlwdEl0ZW0pIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5qYXZhU2NyaXB0VG9wLnB1c2goc2NyaXB0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHNjcmlwdHMoKSB7IHJldHVybiB0aGlzLiNzY3JpcHRzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsYXJlIEphdmFTY3JpcHQgdG8gYWRkIGF0IHRoZSBib3R0b20gb2YgcmVuZGVyZWQgcGFnZXMuXG4gICAgICogQHBhcmFtIHNjcmlwdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEZvb3RlckphdmFTY3JpcHQoc2NyaXB0OiBqYXZhU2NyaXB0SXRlbSkge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLmphdmFTY3JpcHRCb3R0b20ucHVzaChzY3JpcHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsYXJlIGEgQ1NTIFN0eWxlc2hlZXQgdG8gYWRkIHdpdGhpbiB0aGUgaGVhZCB0YWcgb2YgcmVuZGVyZWQgcGFnZXMuXG4gICAgICogQHBhcmFtIHNjcmlwdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZFN0eWxlc2hlZXQoY3NzOiBzdHlsZXNoZWV0SXRlbSkge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLnN0eWxlc2hlZXRzLnB1c2goY3NzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0TWFoYWJodXRhQ29uZmlnKGNoZWVyaW8/OiBjaGVlcmlvLkNoZWVyaW9PcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NoZWVyaW8gPSBjaGVlcmlvO1xuXG4gICAgICAgIC8vIEZvciBjaGVlcmlvIDEuMC4wLXJjLjEwIHdlIG5lZWQgdG8gdXNlIHRoaXMgc2V0dGluZy5cbiAgICAgICAgLy8gSWYgdGhlIGNvbmZpZ3VyYXRpb24gaGFzIHNldCB0aGlzLCB3ZSBtdXN0IG5vdFxuICAgICAgICAvLyBvdmVycmlkZSB0aGVpciBzZXR0aW5nLiAgQnV0LCBnZW5lcmFsbHksIGZvciBjb3JyZWN0XG4gICAgICAgIC8vIG9wZXJhdGlvbiBhbmQgaGFuZGxpbmcgb2YgTWFoYWJodXRhIHRhZ3MsIHdlIG5lZWRcbiAgICAgICAgLy8gdGhpcyBzZXR0aW5nIHRvIGJlIDxjb2RlPnRydWU8L2NvZGU+XG4gICAgICAgIGlmICghKCdfdXNlSHRtbFBhcnNlcjInIGluIHRoaXMuI2NoZWVyaW8pKSB7XG4gICAgICAgICAgICAodGhpcy4jY2hlZXJpbyBhcyBhbnkpLl91c2VIdG1sUGFyc2VyMiA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzW19jb25maWdfY2hlZXJpb10pO1xuICAgIH1cblxuICAgIGdldCBtYWhhYmh1dGFDb25maWcoKSB7IHJldHVybiB0aGlzLiNjaGVlcmlvOyB9XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IHRoZSBjb250ZW50cyBvZiBhbGwgZGlyZWN0b3JpZXMgaW4gYXNzZXREaXJzIHRvIHRoZSByZW5kZXIgZGVzdGluYXRpb24uXG4gICAgICovXG4gICAgYXN5bmMgY29weUFzc2V0cygpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2NvcHlBc3NldHMgU1RBUlQnKTtcblxuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBjb25zdCBhc3NldHMgPSBmaWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIC8vIEZldGNoIHRoZSBsaXN0IG9mIGFsbCBhc3NldHMgZmlsZXNcbiAgICAgICAgY29uc3QgcGF0aHMgPSBhd2FpdCBhc3NldHMucGF0aHMoKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY29weUFzc2V0cyBwYXRoc2AsXG4gICAgICAgIC8vICAgICBwYXRocy5tYXAoaXRlbSA9PiB7XG4gICAgICAgIC8vICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgIC8vICAgICAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aCxcbiAgICAgICAgLy8gICAgICAgICAgICAgbWltZTogaXRlbS5taW1lXG4gICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAvLyAgICAgfSlcbiAgICAgICAgLy8gKVxuXG4gICAgICAgIC8vIFRoZSB3b3JrIHRhc2sgaXMgdG8gY29weSBlYWNoIGZpbGVcbiAgICAgICAgY29uc3QgcXVldWUgPSBmYXN0cS5wcm9taXNlKGFzeW5jIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgJHtjb25maWcucmVuZGVyVG99ICR7aXRlbS5yZW5kZXJQYXRofWApO1xuICAgICAgICAgICAgICAgIGxldCBkZXN0Rk4gPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlclRvLCBpdGVtLnJlbmRlclBhdGgpO1xuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IGV4aXN0c1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUoZGVzdEZOKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgLy8gQ29weSBmcm9tIHRoZSBhYnNvbHV0ZSBwYXRobmFtZSwgdG8gdGhlIGNvbXB1dGVkIFxuICAgICAgICAgICAgICAgIC8vIGxvY2F0aW9uIHdpdGhpbiB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgJHtpdGVtLmZzcGF0aH0gPT0+ICR7ZGVzdEZOfWApO1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5jcChpdGVtLmZzcGF0aCwgZGVzdEZOLCB7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb3B5QXNzZXRzIEZBSUwgdG8gY29weSAke2l0ZW0uZnNwYXRofSAke2l0ZW0udnBhdGh9ICR7aXRlbS5yZW5kZXJQYXRofSAke2NvbmZpZy5yZW5kZXJUb30gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTApO1xuXG4gICAgICAgIC8vIFB1c2ggdGhlIGxpc3Qgb2YgYXNzZXQgZmlsZXMgaW50byB0aGUgcXVldWVcbiAgICAgICAgLy8gQmVjYXVzZSBxdWV1ZS5wdXNoIHJldHVybnMgUHJvbWlzZSdzIHdlIGVuZCB1cCB3aXRoXG4gICAgICAgIC8vIGFuIGFycmF5IG9mIFByb21pc2Ugb2JqZWN0c1xuICAgICAgICBjb25zdCB3YWl0Rm9yID0gW107XG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIHBhdGhzKSB7XG4gICAgICAgICAgICB3YWl0Rm9yLnB1c2gocXVldWUucHVzaChlbnRyeSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoaXMgd2FpdHMgZm9yIGFsbCBQcm9taXNlJ3MgdG8gZmluaXNoXG4gICAgICAgIC8vIEJ1dCBpZiB0aGVyZSB3ZXJlIG5vIFByb21pc2Uncywgbm8gbmVlZCB0byB3YWl0XG4gICAgICAgIGlmICh3YWl0Rm9yLmxlbmd0aCA+IDApIGF3YWl0IFByb21pc2UuYWxsKHdhaXRGb3IpO1xuICAgICAgICAvLyBUaGVyZSBhcmUgbm8gcmVzdWx0cyBpbiB0aGlzIGNhc2UgdG8gY2FyZSBhYm91dFxuICAgICAgICAvLyBjb25zdCByZXN1bHRzID0gW107XG4gICAgICAgIC8vIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIC8vICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbCB0aGUgYmVmb3JlU2l0ZVJlbmRlcmVkIGZ1bmN0aW9uIG9mIGFueSBwbHVnaW4gd2hpY2ggaGFzIHRoYXQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgYXN5bmMgaG9va0JlZm9yZVNpdGVSZW5kZXJlZCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2hvb2tCZWZvcmVTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5iZWZvcmVTaXRlUmVuZGVyZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IGJlZm9yZVNpdGVSZW5kZXJlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5iZWZvcmVTaXRlUmVuZGVyZWQoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGwgdGhlIG9uU2l0ZVJlbmRlcmVkIGZ1bmN0aW9uIG9mIGFueSBwbHVnaW4gd2hpY2ggaGFzIHRoYXQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgYXN5bmMgaG9va1NpdGVSZW5kZXJlZCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2hvb2tTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vblNpdGVSZW5kZXJlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25TaXRlUmVuZGVyZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25TaXRlUmVuZGVyZWQoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQWRkZWQoY29sbGVjdGlvbjogc3RyaW5nLCB2cGluZm86IFZQYXRoRGF0YSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaG9va0ZpbGVBZGRlZCAke2NvbGxlY3Rpb259ICR7dnBpbmZvLnZwYXRofWApO1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUFkZGVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvbkZpbGVBZGRlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vbkZpbGVBZGRlZChjb25maWcsIGNvbGxlY3Rpb24sIHZwaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZUNoYW5nZWQoY29sbGVjdGlvbjogc3RyaW5nLCB2cGluZm86IFZQYXRoRGF0YSkge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUNoYW5nZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uRmlsZUNoYW5nZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlQ2hhbmdlZChjb25maWcsIGNvbGxlY3Rpb24sIHZwaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZVVubGlua2VkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVVbmxpbmtlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25GaWxlVW5saW5rZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlVW5saW5rZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVDYWNoZVNldHVwKGNvbGxlY3Rpb25ubTogc3RyaW5nLCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlQ2FjaGVTZXR1cCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlQ2FjaGVTZXR1cChjb25maWcsIGNvbGxlY3Rpb25ubSwgY29sbGVjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rUGx1Z2luQ2FjaGVTZXR1cCgpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vblBsdWdpbkNhY2hlU2V0dXAgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uUGx1Z2luQ2FjaGVTZXR1cChjb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU1BFQ0lBTCBUUkVBVE1FTlRcbiAgICAgICAgLy8gVGhlIHRhZyBkZXNjcmlwdGlvbnMgbmVlZCB0byBiZSBpbnN0YWxsZWRcbiAgICAgICAgLy8gaW4gdGhlIGRhdGFiYXNlLiAgSXQgaXMgaW1wb3NzaWJsZSB0byBkb1xuICAgICAgICAvLyB0aGF0IGR1cmluZyBDb25maWd1cmF0aW9uIHNldHVwIGluXG4gICAgICAgIC8vIHRoZSBhZGRUYWdEZXNjcmlwdGlvbnMgbWV0aG9kLlxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgYWZ0ZXIgdGhlIGRhdGFiYXNlXG4gICAgICAgIC8vIGlzIHNldHVwLlxuXG4gICAgICAgIGF3YWl0IHRoaXMuI3NhdmVEZXNjcmlwdGlvbnNUb0RCKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdXNlIC0gZ28gdGhyb3VnaCBwbHVnaW5zIGFycmF5LCBhZGRpbmcgZWFjaCB0byB0aGUgcGx1Z2lucyBhcnJheSBpblxuICAgICAqIHRoZSBjb25maWcgZmlsZSwgdGhlbiBjYWxsaW5nIHRoZSBjb25maWcgZnVuY3Rpb24gb2YgZWFjaCBwbHVnaW4uXG4gICAgICogQHBhcmFtIFBsdWdpbk9iaiBUaGUgcGx1Z2luIG5hbWUgb3Igb2JqZWN0IHRvIGFkZFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHVzZShQbHVnaW5PYmosIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJDb25maWd1cmF0aW9uICMxIHVzZSBQbHVnaW5PYmogXCIrIHR5cGVvZiBQbHVnaW5PYmogK1wiIFwiKyB1dGlsLmluc3BlY3QoUGx1Z2luT2JqKSk7XG4gICAgICAgIGlmICh0eXBlb2YgUGx1Z2luT2JqID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBnb2luZyB0byBmYWlsIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIHJlcXVpcmUgZG9lc24ndCB3b3JrIGluIHRoaXMgY29udGV4dFxuICAgICAgICAgICAgLy8gRnVydGhlciwgdGhpcyBjb250ZXh0IGRvZXMgbm90XG4gICAgICAgICAgICAvLyBzdXBwb3J0IGFzeW5jIGZ1bmN0aW9ucywgc28gd2VcbiAgICAgICAgICAgIC8vIGNhbm5vdCBkbyBpbXBvcnQuXG4gICAgICAgICAgICBQbHVnaW5PYmogPSByZXF1aXJlKFBsdWdpbk9iaik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFQbHVnaW5PYmogfHwgUGx1Z2luT2JqIGluc3RhbmNlb2YgUGx1Z2luKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBwbHVnaW4gc3VwcGxpZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJDb25maWd1cmF0aW9uICMyIHVzZSBQbHVnaW5PYmogXCIrIHR5cGVvZiBQbHVnaW5PYmogK1wiIFwiKyB1dGlsLmluc3BlY3QoUGx1Z2luT2JqKSk7XG4gICAgICAgIHZhciBwbHVnaW4gPSBuZXcgUGx1Z2luT2JqKCk7XG4gICAgICAgIHBsdWdpbi5ha2FzaGEgPSB0aGlzLmFrYXNoYTtcbiAgICAgICAgdGhpcy4jcGx1Z2lucy5wdXNoKHBsdWdpbik7XG4gICAgICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgICAgICBwbHVnaW4uY29uZmlndXJlKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcGx1Z2lucygpIHsgcmV0dXJuIHRoaXMuI3BsdWdpbnM7IH1cblxuICAgIC8qKlxuICAgICAqIEl0ZXJhdGUgb3ZlciB0aGUgaW5zdGFsbGVkIHBsdWdpbnMsIGNhbGxpbmcgdGhlIGZ1bmN0aW9uIHBhc3NlZCBpbiBgaXRlcmF0b3JgXG4gICAgICogZm9yIGVhY2ggcGx1Z2luLCB0aGVuIGNhbGxpbmcgdGhlIGZ1bmN0aW9uIHBhc3NlZCBpbiBgZmluYWxgLlxuICAgICAqXG4gICAgICogQHBhcmFtIGl0ZXJhdG9yIFRoZSBmdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHBsdWdpbi4gIFNpZ25hdHVyZTogYGZ1bmN0aW9uKHBsdWdpbiwgbmV4dClgICBUaGUgYG5leHRgIHBhcmFtZXRlciBpcyBhIGZ1bmN0aW9uIHVzZWQgdG8gaW5kaWNhdGUgZXJyb3IgLS0gYG5leHQoZXJyKWAgLS0gb3Igc3VjY2VzcyAtLSBuZXh0KClcbiAgICAgKiBAcGFyYW0gZmluYWwgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgYWZ0ZXIgYWxsIGl0ZXJhdG9yIGNhbGxzIGhhdmUgYmVlbiBtYWRlLiAgU2lnbmF0dXJlOiBgZnVuY3Rpb24oZXJyKWBcbiAgICAgKi9cbiAgICBlYWNoUGx1Z2luKGl0ZXJhdG9yLCBmaW5hbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJlYWNoUGx1Z2luIGRlcHJlY2F0ZWRcIik7XG4gICAgICAgIC8qIGFzeW5jLmVhY2hTZXJpZXModGhpcy5wbHVnaW5zLFxuICAgICAgICBmdW5jdGlvbihwbHVnaW4sIG5leHQpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHBsdWdpbiwgbmV4dCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZpbmFsKTsgKi9cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb29rIGZvciBhIHBsdWdpbiwgcmV0dXJuaW5nIGl0cyBtb2R1bGUgcmVmZXJlbmNlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHJldHVybnMge1BsdWdpbn1cbiAgICAgKi9cbiAgICBwbHVnaW4obmFtZTogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdjb25maWcucGx1Z2luOiAnKyB1dGlsLmluc3BlY3QodGhpcy5fcGx1Z2lucykpO1xuICAgICAgICBpZiAoISB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgcGx1Z2luS2V5IGluIHRoaXMucGx1Z2lucykge1xuICAgICAgICAgICAgdmFyIHBsdWdpbiA9IHRoaXMucGx1Z2luc1twbHVnaW5LZXldO1xuICAgICAgICAgICAgaWYgKHBsdWdpbi5uYW1lID09PSBuYW1lKSByZXR1cm4gcGx1Z2luO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGBXQVJOSU5HOiBEaWQgbm90IGZpbmQgcGx1Z2luICR7bmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgcGx1Z2luRGF0YSBvYmplY3QgZm9yIHRoZSBuYW1lZCBwbHVnaW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAqLyBcbiAgICBwbHVnaW5EYXRhKG5hbWU6IHN0cmluZykge1xuICAgICAgICB2YXIgcGx1Z2luRGF0YUFycmF5ID0gdGhpcy4jcGx1Z2luRGF0YTtcbiAgICAgICAgaWYgKCEobmFtZSBpbiBwbHVnaW5EYXRhQXJyYXkpKSB7XG4gICAgICAgICAgICBwbHVnaW5EYXRhQXJyYXlbbmFtZV0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGx1Z2luRGF0YUFycmF5W25hbWVdO1xuICAgIH1cblxuICAgIGFza1BsdWdpbnNMZWdpdExvY2FsSHJlZihocmVmKSB7XG4gICAgICAgIGZvciAodmFyIHBsdWdpbiBvZiB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLmlzTGVnaXRMb2NhbEhyZWYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBsdWdpbi5pc0xlZ2l0TG9jYWxIcmVmKHRoaXMsIGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJSZW5kZXJlcihyZW5kZXJlcjogUmVuZGVyZXIpIHtcbiAgICAgICAgaWYgKCEocmVuZGVyZXIgaW5zdGFuY2VvZiBSZW5kZXJlcikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vdCBBIFJlbmRlcmVyICcrIHV0aWwuaW5zcGVjdChyZW5kZXJlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb3QgYSBSZW5kZXJlciAke3V0aWwuaW5zcGVjdChyZW5kZXJlcil9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmZpbmRSZW5kZXJlck5hbWUocmVuZGVyZXIubmFtZSkpIHtcbiAgICAgICAgICAgIC8vIHJlbmRlcmVyLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICAgICAgLy8gcmVuZGVyZXIuY29uZmlnID0gdGhpcztcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZWdpc3RlclJlbmRlcmVyIGAsIHJlbmRlcmVyKTtcbiAgICAgICAgICAgIHRoaXMuI3JlbmRlcmVycy5yZWdpc3RlclJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFsbG93IGFuIGFwcGxpY2F0aW9uIHRvIG92ZXJyaWRlIG9uZSBvZiB0aGUgYnVpbHQtaW4gcmVuZGVyZXJzXG4gICAgICogdGhhdCBhcmUgaW5pdGlhbGl6ZWQgYmVsb3cuICBUaGUgaW5zcGlyYXRpb24gaXMgZXB1YnRvb2xzIHRoYXRcbiAgICAgKiBtdXN0IHdyaXRlIEhUTUwgZmlsZXMgd2l0aCBhbiAueGh0bWwgZXh0ZW5zaW9uLiAgVGhlcmVmb3JlIGl0XG4gICAgICogY2FuIHN1YmNsYXNzIEVKU1JlbmRlcmVyIGV0YyB3aXRoIGltcGxlbWVudGF0aW9ucyB0aGF0IGZvcmNlIHRoZVxuICAgICAqIGZpbGUgbmFtZSB0byBiZSAueGh0bWwuICBXZSdyZSBub3QgY2hlY2tpbmcgaWYgdGhlIHJlbmRlcmVyIG5hbWVcbiAgICAgKiBpcyBhbHJlYWR5IHRoZXJlIGluIGNhc2UgZXB1YnRvb2xzIG11c3QgdXNlIHRoZSBzYW1lIHJlbmRlcmVyIG5hbWUuXG4gICAgICovXG4gICAgcmVnaXN0ZXJPdmVycmlkZVJlbmRlcmVyKHJlbmRlcmVyOiBSZW5kZXJlcikge1xuICAgICAgICBpZiAoIShyZW5kZXJlciBpbnN0YW5jZW9mIFJlbmRlcmVyKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm90IEEgUmVuZGVyZXIgJysgdXRpbC5pbnNwZWN0KHJlbmRlcmVyKSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIFJlbmRlcmVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVuZGVyZXIuYWthc2hhID0gdGhpcy5ha2FzaGE7XG4gICAgICAgIC8vIHJlbmRlcmVyLmNvbmZpZyA9IHRoaXM7XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycy5yZWdpc3Rlck92ZXJyaWRlUmVuZGVyZXIocmVuZGVyZXIpO1xuICAgIH1cblxuICAgIGZpbmRSZW5kZXJlck5hbWUobmFtZTogc3RyaW5nKTogUmVuZGVyZXIge1xuICAgICAgICByZXR1cm4gdGhpcy4jcmVuZGVyZXJzLmZpbmRSZW5kZXJlck5hbWUobmFtZSk7XG4gICAgfVxuXG4gICAgZmluZFJlbmRlcmVyUGF0aChfcGF0aDogc3RyaW5nKTogUmVuZGVyZXIge1xuICAgICAgICByZXR1cm4gdGhpcy4jcmVuZGVyZXJzLmZpbmRSZW5kZXJlclBhdGgoX3BhdGgpO1xuICAgIH1cblxuICAgIGdldCByZW5kZXJlcnMoKSB7IHJldHVybiB0aGlzLiNyZW5kZXJlcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYSBSZW5kZXJlciBieSBpdHMgZXh0ZW5zaW9uLlxuICAgICAqL1xuICAgIGZpbmRSZW5kZXJlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZFJlbmRlcmVyTmFtZShuYW1lKTtcbiAgICB9XG59XG5cbmNvbnN0IG1vZHVsZV9leHBvcnRzID0ge1xuICAgIFJlbmRlcmVycyxcbiAgICBSZW5kZXJlcjogUmVuZGVyZXJzLlJlbmRlcmVyLFxuICAgIG1haGFiaHV0YSxcbiAgICBmaWxlY2FjaGUsXG4gICAgc2V0dXAsXG4gICAgY2FjaGVTZXR1cCxcbiAgICBjbG9zZUNhY2hlcyxcbiAgICBmaWxlQ2FjaGVzUmVhZHksXG4gICAgUGx1Z2luLFxuICAgIHJlbmRlcixcbiAgICByZW5kZXIyLFxuICAgIHJlbmRlckRvY3VtZW50LFxuICAgIHJlbmRlclBhdGgsXG4gICAgcmVuZGVyUGF0aDIsXG4gICAgcmVhZFJlbmRlcmVkRmlsZSxcbiAgICBwYXJ0aWFsLFxuICAgIHBhcnRpYWxTeW5jLFxuICAgIGluZGV4Q2hhaW4sXG4gICAgcmVsYXRpdmUsXG4gICAgbGlua1JlbFNldEF0dHIsXG4gICAgcmVzb2x2ZVZwYXRoLFxuICAgIGdlbmVyYXRlUlNTLFxuICAgIENvbmZpZ3VyYXRpb25cbn0gYXMgYW55O1xuXG5leHBvcnQgZGVmYXVsdCBtb2R1bGVfZXhwb3J0czsiXX0=