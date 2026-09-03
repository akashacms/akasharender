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
import { encode } from 'html-entities';
export * from './mahafuncs.js';
import * as relative from 'relative';
export * as relative from 'relative';
import { Plugin } from './Plugin.js';
export { Plugin } from './Plugin.js';
export { validTagDescription } from './types.js';
import { render, render2, renderDocument, renderDocument2 } from './render.js';
export { render, render2, renderDocument, renderDocument2, renderContent, isDocumentUpToDate } from './render.js';
export { SitemapValidator } from './sitemap-validator.js';
export { inferFormat, parseTableData } from './csv-table.js';
export { LinkChecker, isWhitelisted, classifyStatus, assertMode as assertLinkCheckMode, fetchExternalChecker, linkCheckExternalChecker, LINK_CHECK_MODES, DEFAULT_LINK_CHECK_OPTIONS } from './link-checker.js';
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
 * Create the string of an HTML attribute, where the value portion
 * is properly encoded to defang any potential attacks.
 *
 * @param name
 * @param value
 * @returns
 */
export function doHTMLAttribute(name, value) {
    return typeof value === 'string'
        ? ` ${name}="${encode(value)}"`
        : '';
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
    get partialDirs() { return __classPrivateFieldGet(this, _Configuration_partialDirs, "f"); }
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
    doHTMLAttribute,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBR0g7OztHQUdHO0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsNENBQTRDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFFLFVBQVUsRUFBYyxZQUFZLEVBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEtBQUssU0FBUyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsTUFBTSxFQUNGLGFBQWEsRUFDYix1QkFBdUIsRUFDMUIsR0FBRyxTQUFTLENBQUM7QUFDZCxPQUFPLEtBQUssT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUNuQyxPQUFPLFdBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXZDLGNBQWMsZ0JBQWdCLENBQUM7QUFFL0IsT0FBTyxLQUFL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RUQsSUFBSSxTQUFTLEtBQUssT0FBTyx1QkFBQSxJQUFJLGdDQUFXLENBQUMsQ0FBQyxDQUFDO0lBRTNDOztPQUVHO0lBQ0gsWUFBWSxDQUFDLElBQVk7UUFDckIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztDQUNKO2c2QkFoWUcsS0FBSztJQUNELE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxjQUFjLENBQUM7SUFDM0MsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksbUNBQWMsQ0FBQyxFQUFFLENBQUM7UUFDcEMsS0FBSyxNQUFNLElBQUksSUFBSSx1QkFBQSxJQUFJLG1DQUFjLEVBQUUsQ0FBQztZQUNwQyxNQUFNLFNBQVMsQ0FBQyxpQkFBaUIsQ0FDN0IsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxDQUNqQyxDQUFDO1FBQ04sQ0FBQztJQUNMLENBQUM7QUFDTCxDQUFDO0FBeVhMLE1BQU0sY0FBYyxHQUFHO0lBQ25CLFNBQVM7SUFDVCxRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsU0FBUztJQUNULFNBQVM7SUFDVCxLQUFLO0lBQ0wsVUFBVTtJQUNWLFdBQVc7SUFDWCxlQUFlO0lBQ2YsZUFBZTtJQUNmLE1BQU07SUFDTixNQUFNO0lBQ04sT0FBTztJQUNQLGNBQWM7SUFDZCxVQUFVO0lBQ1YsV0FBVztJQUNYLGdCQUFnQjtJQUNoQixPQUFPO0lBQ1AsV0FBVztJQUNYLFVBQVU7SUFDVixRQUFRO0lBQ1IsY0FBYztJQUNkLFlBQVk7SUFDWixXQUFXO0lBQ1gsYUFBYTtDQUNULENBQUM7QUFFVCxlQUFlLGNBQWMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cbi8qKlxuICogQWthc2hhUmVuZGVyXG4gKiBAbW9kdWxlIGFrYXNoYXJlbmRlclxuICovXG5cbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG4vLyBjb25zdCBvZW1iZXR0ZXIgPSByZXF1aXJlKCdvZW1iZXR0ZXInKSgpO1xuaW1wb3J0IFJTUyBmcm9tICdyc3MnO1xuaW1wb3J0IGZhc3RxIGZyb20gJ2Zhc3RxJztcbmltcG9ydCB7IG1pbWVkZWZpbmUsIGRpclRvTW91bnQsIGlzRGlyVG9Nb3VudCwgVlBhdGhEYXRhIH0gZnJvbSAnLi9jYWNoZS92ZnN0YWNrLmpzJztcbmV4cG9ydCB0eXBlIHsgZGlyVG9Nb3VudCwgVlBhdGhEYXRhIH0gZnJvbSAnLi9jYWNoZS92ZnN0YWNrLmpzJztcbmV4cG9ydCB7IGlzRGlyVG9Nb3VudCB9IGZyb20gJy4vY2FjaGUvdmZzdGFjay5qcyc7XG5pbXBvcnQgKiBhcyBSZW5kZXJlcnMgZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuZXhwb3J0ICogYXMgUmVuZGVyZXJzIGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCB7IFJlbmRlcmVyIH0gZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuZXhwb3J0IHsgUmVuZGVyZXIgfSBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQgKiBhcyBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmV4cG9ydCAqIGFzIG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuY29uc3Qge1xuICAgIFBlcmZEYXRhU3RvcmUsIFxuICAgIEZpbGVzeXN0ZW1QZXJmRGF0YVN0b3JlXG59ID0gbWFoYWJodXRhO1xuaW1wb3J0ICogYXMgY2hlZXJpbyBmcm9tICdjaGVlcmlvJztcbmltcG9ydCBtYWhhUGFydGlhbCBmcm9tICdtYWhhYmh1dGEvbWFoYS9wYXJ0aWFsLmpzJztcbmltcG9ydCB7IGVuY29kZSB9IGZyb20gJ2h0bWwtZW50aXRpZXMnO1xuXG5leHBvcnQgKiBmcm9tICcuL21haGFmdW5jcy5qcyc7XG5cbmltcG9ydCAqIGFzIHJlbGF0aXZlIGZyb20gJ3JlbGF0aXZlJztcbmV4cG9ydCAqIGFzIHJlbGF0aXZlIGZyb20gJ3JlbGF0aXZlJztcblxuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAnLi9QbHVnaW4uanMnO1xuZXhwb3J0IHsgUGx1Z2luIH0gZnJvbSAnLi9QbHVnaW4uanMnO1xuXG5pbXBvcnQgdHlwZSB7IFRhZ0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi90eXBlcy5qcyc7XG5leHBvcnQgdHlwZSB7IFRhZ0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi90eXBlcy5qcyc7XG5leHBvcnQgdHlwZSB7XG4gICAgU2VhcmNoT3B0aW9ucyxcbiAgICBSZWdleE1hdGNoLFxuICAgIFNlYXJjaEZpbHRlckZ1bmMsXG4gICAgU2VhcmNoU29ydEZ1bmNcbn0gZnJvbSAnLi90eXBlcy5qcyc7XG5leHBvcnQgeyB2YWxpZFRhZ0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi90eXBlcy5qcyc7XG5cbmltcG9ydCB7IHJlbmRlciwgcmVuZGVyMiwgcmVuZGVyRG9jdW1lbnQsIHJlbmRlckNvbnRlbnQsIHJlbmRlckRvY3VtZW50MiB9IGZyb20gJy4vcmVuZGVyLmpzJztcbmV4cG9ydCB7IHJlbmRlciwgcmVuZGVyMiwgcmVuZGVyRG9jdW1lbnQsIHJlbmRlckRvY3VtZW50MiwgcmVuZGVyQ29udGVudCwgaXNEb2N1bWVudFVwVG9EYXRlIH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuZXhwb3J0IHR5cGUgeyBSZW5kZXIyT3B0aW9ucywgUmVuZGVyaW5nUmVzdWx0cyB9IGZyb20gJy4vcmVuZGVyLmpzJztcblxuZXhwb3J0IHtcbiAgICBTaXRlbWFwVmFsaWRhdG9yLFxuICAgIHR5cGUgU2l0ZW1hcEVudHJ5LFxuICAgIHR5cGUgRW50cnlWYWxpZGF0aW9uLFxuICAgIHR5cGUgWE1MVmFsaWRhdGlvbixcbiAgICB0eXBlIFZhbGlkYXRpb25SZXN1bHRcbn0gZnJvbSAnLi9zaXRlbWFwLXZhbGlkYXRvci5qcyc7XG5cbmV4cG9ydCB7XG4gICAgaW5mZXJGb3JtYXQsXG4gICAgcGFyc2VUYWJsZURhdGEsXG4gICAgdHlwZSBDc3ZUYWJsZUZvcm1hdCxcbiAgICB0eXBlIENzdlRhYmxlUm93LFxuICAgIHR5cGUgQ3N2VGFibGVEYXRhLFxuICAgIHR5cGUgUGFyc2VUYWJsZU9wdGlvbnNcbn0gZnJvbSAnLi9jc3YtdGFibGUuanMnO1xuXG5leHBvcnQge1xuICAgIExpbmtDaGVja2VyLFxuICAgIGlzV2hpdGVsaXN0ZWQsXG4gICAgY2xhc3NpZnlTdGF0dXMsXG4gICAgYXNzZXJ0TW9kZSBhcyBhc3NlcnRMaW5rQ2hlY2tNb2RlLFxuICAgIGZldGNoRXh0ZXJuYWxDaGVja2VyLFxuICAgIGxpbmtDaGVja0V4dGVybmFsQ2hlY2tlcixcbiAgICBMSU5LX0NIRUNLX01PREVTLFxuICAgIERFRkFVTFRfTElOS19DSEVDS19PUFRJT05TLFxuICAgIHR5cGUgTGlua0NoZWNrTW9kZSxcbiAgICB0eXBlIExpbmtDaGVja09wdGlvbnMsXG4gICAgdHlwZSBXaGl0ZWxpc3RFbnRyeSxcbiAgICB0eXBlIEV4dGVybmFsU3RhdGUsXG4gICAgdHlwZSBFeHRlcm5hbFJlc3VsdCxcbiAgICB0eXBlIEV4dGVybmFsQ2hlY2tlcixcbiAgICB0eXBlIEV4dGVybmFsQ2hlY2tPcHRpb25zLFxuICAgIHR5cGUgTGlua0tpbmQsXG4gICAgdHlwZSBMaW5rRXJyb3IsXG4gICAgdHlwZSBJbnRlcm5hbFJlc29sdmVyXG59IGZyb20gJy4vbGluay1jaGVja2VyLmpzJztcblxuY29uc3QgX19maWxlbmFtZSA9IGltcG9ydC5tZXRhLmZpbGVuYW1lO1xuY29uc3QgX19kaXJuYW1lID0gaW1wb3J0Lm1ldGEuZGlybmFtZTtcblxuLy8gRm9yIHVzZSBpbiBDb25maWd1cmUucHJlcGFyZVxuaW1wb3J0IHsgQnVpbHRJblBsdWdpbiB9IGZyb20gJy4vYnVpbHQtaW4uanMnO1xuXG5pbXBvcnQgKiBhcyBmaWxlY2FjaGUgZnJvbSAnLi9jYWNoZS9jYWNoZS1zcWxpdGUuanMnO1xuaW1wb3J0IHsgc3FkYiB9IGZyb20gJy4vc3FkYi5qcyc7XG5cbmV4cG9ydCB7IG5ld1NRM0RhdGFTdG9yZSB9IGZyb20gJy4vc3FkYi5qcyc7XG5cbmltcG9ydCB7IGluaXQgfSBmcm9tICcuL2RhdGEuanMnO1xuXG4vLyBUaGVyZSBkb2Vzbid0IHNlZW0gdG8gYmUgYW4gb2ZmaWNpYWwgTUlNRSB0eXBlIHJlZ2lzdGVyZWRcbi8vIGZvciBBc2NpaURvY3RvclxuLy8gcGVyOiBodHRwczovL2FzY2lpZG9jdG9yLm9yZy9kb2NzL2ZhcS9cbi8vIHBlcjogaHR0cHM6Ly9naXRodWIuY29tL2FzY2lpZG9jdG9yL2FzY2lpZG9jdG9yL2lzc3Vlcy8yNTAyXG4vL1xuLy8gQXMgb2YgTm92ZW1iZXIgNiwgMjAyMiwgdGhlIEFzY2lpRG9jdG9yIEZBUSBzYWlkIHRoZXkgYXJlXG4vLyBpbiB0aGUgcHJvY2VzcyBvZiByZWdpc3RlcmluZyBhIE1JTUUgdHlwZSBmb3IgYHRleHQvYXNjaWlkb2NgLlxuLy8gVGhlIE1JTUUgdHlwZSB3ZSBzdXBwbHkgaGFzIGJlZW4gdXBkYXRlZC5cbi8vXG4vLyBUaGlzIGFsc28gc2VlbXMgdG8gYmUgdHJ1ZSBmb3IgdGhlIG90aGVyIGZpbGUgdHlwZXMuICBXZSd2ZSBtYWRlIHVwXG4vLyBzb21lIE1JTUUgdHlwZXMgdG8gZ28gd2l0aCBlYWNoLlxuLy9cbi8vIFRoZSBNSU1FIHBhY2thZ2UgaGFkIHByZXZpb3VzbHkgYmVlbiBpbnN0YWxsZWQgd2l0aCBBa2FzaGFSZW5kZXIuXG4vLyBCdXQsIGl0IHNlZW1zIHRvIG5vdCBiZSB1c2VkLCBhbmQgaW5zdGVhZCB3ZSBjb21wdXRlIHRoZSBNSU1FIHR5cGVcbi8vIGZvciBmaWxlcyBpbiBTdGFja2VkIERpcmVjdG9yaWVzLlxuLy9cbi8vIFRoZSByZXF1aXJlZCB0YXNrIGlzIHRvIHJlZ2lzdGVyIHNvbWUgTUlNRSB0eXBlcyB3aXRoIHRoZVxuLy8gTUlNRSBwYWNrYWdlLiAgSXQgaXNuJ3QgYXBwcm9wcmlhdGUgdG8gZG8gdGhpcyBpblxuLy8gdGhlIFN0YWNrZWQgRGlyZWN0b3JpZXMgcGFja2FnZS4gIEluc3RlYWQgdGhhdCdzIGxlZnRcbi8vIGZvciBjb2RlIHdoaWNoIHVzZXMgU3RhY2tlZCBEaXJlY3RvcmllcyB0byBkZXRlcm1pbmUgd2hpY2hcbi8vIChpZiBhbnkpIGFkZGVkIE1JTUUgdHlwZXMgYXJlIHJlcXVpcmVkLiAgRXJnbywgQWthc2hhUmVuZGVyXG4vLyBuZWVkcyB0byByZWdpc3RlciB0aGUgTUlNRSB0eXBlcyBpdCBpcyBpbnRlcmVzdGVkIGluLlxuLy8gVGhhdCdzIHdoYXQgaXMgaGFwcGVuaW5nIGhlcmUuXG4vL1xuLy8gVGhlcmUncyBhIHRob3VnaHQgdGhhdCB0aGlzIHNob3VsZCBiZSBoYW5kbGVkIGluIHRoZSBSZW5kZXJlclxuLy8gaW1wbGVtZW50YXRpb25zLiAgQnV0IGl0J3Mgbm90IGNlcnRhaW4gdGhhdCdzIGNvcnJlY3QuXG4vL1xuLy8gTm93IHRoYXQgdGhlIFJlbmRlcmVycyBhcmUgaW4gYEBha2FzaGFjbXMvcmVuZGVyZXJzYCBzaG91bGRcbi8vIHRoZXNlIGRlZmluaXRpb25zIG1vdmUgdG8gdGhhdCBwYWNrYWdlP1xuXG5taW1lZGVmaW5lKHsndGV4dC9hc2NpaWRvYyc6IFsgJ2Fkb2MnLCAnYXNjaWlkb2MnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbWFya2RvYyc6IFsgJ21hcmtkb2MnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtZWpzJzogWyAnZWpzJ119KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbnVuanVja3MnOiBbICduamsnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtaGFuZGxlYmFycyc6IFsgJ2hhbmRsZWJhcnMnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbGlxdWlkJzogWyAnbGlxdWlkJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LXRlbXB1cmEnOiBbICd0ZW1wdXJhJyBdfSk7XG5cbi8qKlxuICogUGVyZm9ybXMgc2V0dXAgb2YgdGhpbmdzIHNvIHRoYXQgQWthc2hhUmVuZGVyIGNhbiBmdW5jdGlvbi5cbiAqIFRoZSBjb3JyZWN0IGluaXRpYWxpemF0aW9uIG9mIEFrYXNoYVJlbmRlciBpcyB0b1xuICogMS4gR2VuZXJhdGUgdGhlIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiAyLiBDYWxsIGNvbmZpZy5wcmVwYXJlXG4gKiAzLiBDYWxsIGFrYXNoYXJlbmRlci5zZXR1cFxuICogXG4gKiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXMgYWxsIG9iamVjdHMgdGhhdCBpbml0aWFsaXplIGFzeW5jaHJvbm91c2x5XG4gKiBhcmUgY29ycmVjdGx5IHNldHVwLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKGNvbmZpZykge1xuXG4gICAgY29uZmlnLnJlbmRlcmVycy5wYXJ0aWFsRnVuYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNhbGxpbmcgcGFydGlhbCAke2ZuYW1lfWApO1xuICAgICAgICByZXR1cm4gcGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICBjb25maWcucmVuZGVyZXJzLnBhcnRpYWxTeW5jRnVuYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNhbGxpbmcgcGFydGlhbFN5bmMgJHtmbmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuXG4gICAgYXdhaXQgY2FjaGVTZXR1cChjb25maWcpO1xuICAgIGF3YWl0IGZpbGVDYWNoZXNSZWFkeShjb25maWcpO1xuXG4gICAgYXdhaXQgaW5pdCgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVTZXR1cChjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBmaWxlY2FjaGUuc2V0dXAoY29uZmlnLCBhd2FpdCBzcWRiKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgSU5JVElBTElaQVRJT04gRkFJTFVSRSBDT1VMRCBOT1QgSU5JVElBTElaRSBDQUNIRSBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VDYWNoZXMoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmlsZWNhY2hlLmNsb3NlRmlsZUNhY2hlcygpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBDTE9TRSBDQUNIRVMgYCwgZXJyKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbGVDYWNoZXNSZWFkeShjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLmFzc2V0c0NhY2hlLmlzUmVhZHkoKSxcbiAgICAgICAgICAgIGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuaXNSZWFkeSgpXG4gICAgICAgIF0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBJTklUSUFMSVpFIENBQ0hFIFNZU1RFTSBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyUGF0aChjb25maWcsIHBhdGgycikge1xuICAgIGNvbnN0IGRvY3VtZW50cyA9IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICBsZXQgZm91bmQ7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICB3aGlsZSAoY291bnQgPCAyMCkge1xuICAgICAgICAvKiBXaGF0J3MgaGFwcGVuaW5nIGlzIHRoaXMgbWlnaHQgYmUgY2FsbGVkIGZyb20gY2xpLmpzXG4gICAgICAgICAqIGluIHJlbmRlci1kb2N1bWVudCwgYW5kIHdlIG1pZ2h0IGJlIGFza2VkIHRvIHJlbmRlciB0aGVcbiAgICAgICAgICogbGFzdCBkb2N1bWVudCB0aGF0IHdpbGwgYmUgQUREJ2QgdG8gdGhlIEZpbGVDYWNoZS5cbiAgICAgICAgICpcbiAgICAgICAgICogSW4gc3VjaCBhIGNhc2UgPGNvZGU+aXNSZWFkeTwvY29kZT4gbWlnaHQgcmV0dXJuIDxjb2RlPnRydWU8L2NvZGU+XG4gICAgICAgICAqIGJ1dCBub3QgYWxsIGZpbGVzIHdpbGwgaGF2ZSBiZWVuIEFERCdkIHRvIHRoZSBGaWxlQ2FjaGUuXG4gICAgICAgICAqIEluIHRoYXQgY2FzZSA8Y29kZT5kb2N1bWVudHMuZmluZDwvY29kZT4gcmV0dXJuc1xuICAgICAgICAgKiA8Y29kZT51bmRlZmluZWQ8L2NvZGU+XG4gICAgICAgICAqXG4gICAgICAgICAqIFdoYXQgdGhpcyBkb2VzIGlzIHRyeSB1cCB0byAyMCB0aW1lcyB0byBsb2FkIHRoZSBkb2N1bWVudCxcbiAgICAgICAgICogc2xlZXBpbmcgZm9yIDEwMCBtaWxsaXNlY29uZHMgZWFjaCB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2xlYW5lciBhbHRlcm5hdGl2ZSB3b3VsZCBiZSB0byB3YWl0IGZvciBub3Qgb25seVxuICAgICAgICAgKiB0aGUgPGNvZGU+cmVhZHk8L2NvZGU+IGZyb20gdGhlIDxjb2RlPmRvY3VtZW50czwvY29kZT4gRmlsZUNhY2hlLFxuICAgICAgICAgKiBidXQgYWxzbyBmb3IgYWxsIHRoZSBpbml0aWFsIEFERCBldmVudHMgdG8gYmUgaGFuZGxlZC4gIEJ1dFxuICAgICAgICAgKiB0aGF0IHNlY29uZCBjb25kaXRpb24gc2VlbXMgZGlmZmljdWx0IHRvIGRldGVjdCByZWxpYWJseS5cbiAgICAgICAgICovXG4gICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aDJyKTtcbiAgICAgICAgaWYgKGZvdW5kKSBicmVhaztcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlclBhdGggJHtwYXRoMnJ9YCwgZm91bmQpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEaWQgbm90IGZpbmQgZG9jdW1lbnQgZm9yICR7cGF0aDJyfWApO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVuZGVyRG9jdW1lbnQoY29uZmlnLCBmb3VuZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlclBhdGgyKGNvbmZpZywgcGF0aDJyKSB7XG4gICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIGxldCBmb3VuZDtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIHdoaWxlIChjb3VudCA8IDIwKSB7XG4gICAgICAgIC8qIFdoYXQncyBoYXBwZW5pbmcgaXMgdGhpcyBtaWdodCBiZSBjYWxsZWQgZnJvbSBjbGkuanNcbiAgICAgICAgICogaW4gcmVuZGVyLWRvY3VtZW50LCBhbmQgd2UgbWlnaHQgYmUgYXNrZWQgdG8gcmVuZGVyIHRoZVxuICAgICAgICAgKiBsYXN0IGRvY3VtZW50IHRoYXQgd2lsbCBiZSBBREQnZCB0byB0aGUgRmlsZUNhY2hlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBJbiBzdWNoIGEgY2FzZSA8Y29kZT5pc1JlYWR5PC9jb2RlPiBtaWdodCByZXR1cm4gPGNvZGU+dHJ1ZTwvY29kZT5cbiAgICAgICAgICogYnV0IG5vdCBhbGwgZmlsZXMgd2lsbCBoYXZlIGJlZW4gQUREJ2QgdG8gdGhlIEZpbGVDYWNoZS5cbiAgICAgICAgICogSW4gdGhhdCBjYXNlIDxjb2RlPmRvY3VtZW50cy5maW5kPC9jb2RlPiByZXR1cm5zXG4gICAgICAgICAqIDxjb2RlPnVuZGVmaW5lZDwvY29kZT5cbiAgICAgICAgICpcbiAgICAgICAgICogV2hhdCB0aGlzIGRvZXMgaXMgdHJ5IHVwIHRvIDIwIHRpbWVzIHRvIGxvYWQgdGhlIGRvY3VtZW50LFxuICAgICAgICAgKiBzbGVlcGluZyBmb3IgMTAwIG1pbGxpc2Vjb25kcyBlYWNoIHRpbWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBjbGVhbmVyIGFsdGVybmF0aXZlIHdvdWxkIGJlIHRvIHdhaXQgZm9yIG5vdCBvbmx5XG4gICAgICAgICAqIHRoZSA8Y29kZT5yZWFkeTwvY29kZT4gZnJvbSB0aGUgPGNvZGU+ZG9jdW1lbnRzPC9jb2RlPiBGaWxlQ2FjaGUsXG4gICAgICAgICAqIGJ1dCBhbHNvIGZvciBhbGwgdGhlIGluaXRpYWwgQUREIGV2ZW50cyB0byBiZSBoYW5kbGVkLiAgQnV0XG4gICAgICAgICAqIHRoYXQgc2Vjb25kIGNvbmRpdGlvbiBzZWVtcyBkaWZmaWN1bHQgdG8gZGV0ZWN0IHJlbGlhYmx5LlxuICAgICAgICAgKi9cbiAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChwYXRoMnIpO1xuICAgICAgICBpZiAoZm91bmQpIGJyZWFrO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyUGF0aCAke3BhdGgycn1gLCBmb3VuZCk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgZmluZCBkb2N1bWVudCBmb3IgJHtwYXRoMnJ9YCk7XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudDIoY29uZmlnLCBmb3VuZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZWFkcyBhIGZpbGUgZnJvbSB0aGUgcmVuZGVyaW5nIGRpcmVjdG9yeS4gIEl0IGlzIHByaW1hcmlseSB0byBiZVxuICogdXNlZCBpbiB0ZXN0IGNhc2VzLCB3aGVyZSB3ZSdsbCBydW4gYSBidWlsZCB0aGVuIHJlYWQgdGhlIGluZGl2aWR1YWxcbiAqIGZpbGVzIHRvIG1ha2Ugc3VyZSB0aGV5J3ZlIHJlbmRlcmVkIGNvcnJlY3RseS5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKiBAcGFyYW0geyp9IGZwYXRoIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkUmVuZGVyZWRGaWxlKGNvbmZpZywgZnBhdGgpIHtcblxuICAgIGxldCBodG1sID0gYXdhaXQgZnNwLnJlYWRGaWxlKHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIGZwYXRoKSwgJ3V0ZjgnKTtcbiAgICBsZXQgJCA9IGNvbmZpZy5tYWhhYmh1dGFDb25maWcgXG4gICAgICAgICAgICA/IGNoZWVyaW8ubG9hZChodG1sLCBjb25maWcubWFoYWJodXRhQ29uZmlnKSBcbiAgICAgICAgICAgIDogY2hlZXJpby5sb2FkKGh0bWwpO1xuXG4gICAgcmV0dXJuIHsgaHRtbCwgJCB9O1xufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBwYXJ0aWFsIHRlbXBsYXRlIHVzaW5nIHRoZSBzdXBwbGllZCBtZXRhZGF0YS4gIFRoaXMgdmVyc2lvblxuICogYWxsb3dzIGZvciBhc3luY2hyb25vdXMgZXhlY3V0aW9uLCBhbmQgZXZlcnkgYml0IG9mIGNvZGUgaXRcbiAqIGV4ZWN1dGVzIGlzIGFsbG93ZWQgdG8gYmUgYXN5bmMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICogQHBhcmFtIHsqfSBmbmFtZSBQYXRoIHdpdGhpbiB0aGUgZmlsZWNhY2hlLnBhcnRpYWxzIGNhY2hlXG4gKiBAcGFyYW0geyp9IG1ldGFkYXRhIE9iamVjdCBjb250YWluaW5nIG1ldGFkYXRhXG4gKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBzdHJpbmcgY29udGFpbmluZyB0aGUgcmVuZGVyZWQgc3R1ZmZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpIHtcblxuICAgIGlmICghZm5hbWUgfHwgdHlwZW9mIGZuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHBhcnRpYWwgZm5hbWUgbm90IGEgc3RyaW5nICR7dXRpbC5pbnNwZWN0KGZuYW1lKX1gKTtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCAke2ZuYW1lfWApO1xuICAgIGNvbnN0IGZvdW5kID0gYXdhaXQgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuZmluZChmbmFtZSk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHBhcnRpYWwgZm91bmQgZm9yICR7Zm5hbWV9IGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5wYXJ0aWFsc0RpcnMpfWApO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCAke2ZuYW1lfSA9PT4gJHtmb3VuZC52cGF0aH0gJHtmb3VuZC5mc3BhdGh9YCk7XG4gICAgXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsIGFib3V0IHRvIHJlbmRlciAke3V0aWwuaW5zcGVjdChmb3VuZC52cGF0aCl9YCk7XG4gICAgICAgIGxldCBwYXJ0aWFsVGV4dDtcbiAgICAgICAgaWYgKGZvdW5kLmRvY0JvZHkpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQm9keTtcbiAgICAgICAgZWxzZSBpZiAoZm91bmQuZG9jQm9keSkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NCb2R5O1xuICAgICAgICBlbHNlIHBhcnRpYWxUZXh0ID0gYXdhaXQgZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcblxuICAgICAgICAvLyBTb21lIHJlbmRlcmVycyAoTnVuanVrcykgcmVxdWlyZSB0aGF0IG1ldGFkYXRhLmNvbmZpZ1xuICAgICAgICAvLyBwb2ludCB0byB0aGUgY29uZmlnIG9iamVjdC4gIFRoaXMgYmxvY2sgb2YgY29kZVxuICAgICAgICAvLyBkdXBsaWNhdGVzIHRoZSBtZXRhZGF0YSBvYmplY3QsIHRoZW4gc2V0cyB0aGVcbiAgICAgICAgLy8gY29uZmlnIGZpZWxkIGluIHRoZSBkdXBsaWNhdGUsIHBhc3NpbmcgdGhhdCB0byB0aGUgcGFydGlhbC5cbiAgICAgICAgbGV0IG1kYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgbGV0IHByb3A7XG5cbiAgICAgICAgZm9yIChwcm9wIGluIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICBtZGF0YVtwcm9wXSA9IG1ldGFkYXRhW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIG1kYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgbWRhdGEucGFydGlhbFN5bmMgPSBwYXJ0aWFsU3luYy5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICBtZGF0YS5wYXJ0aWFsICAgICA9IHBhcnRpYWwuYmluZChyZW5kZXJlciwgY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwtZnVuY3MgcmVuZGVyICR7cmVuZGVyZXIubmFtZX0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyLnJlbmRlcih7XG4gICAgICAgICAgICBmc3BhdGg6IGZvdW5kLmZzcGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IHBhcnRpYWxUZXh0LFxuICAgICAgICAgICAgbWV0YWRhdGE6IG1kYXRhXG4gICAgICAgICAgICAvLyBwYXJ0aWFsVGV4dCwgbWRhdGEsIGZvdW5kXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZm91bmQudnBhdGguZW5kc1dpdGgoJy5odG1sJykgfHwgZm91bmQudnBhdGguZW5kc1dpdGgoJy54aHRtbCcpKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsIHJlYWRpbmcgZmlsZSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlbmRlclBhcnRpYWwgbm8gUmVuZGVyZXIgZm91bmQgZm9yICR7Zm5hbWV9IC0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICB9XG59XG5cbi8qKlxuICogUmVuZGVycyBhIHBhcnRpYWwgdGVtcGxhdGUgdXNpbmcgdGhlIHN1cHBsaWVkIG1ldGFkYXRhLiAgVGhpcyB2ZXJzaW9uXG4gKiBhbGxvd3MgZm9yIHN5bmNocm9ub3VzIGV4ZWN1dGlvbiwgYW5kIGV2ZXJ5IGJpdCBvZiBjb2RlIGl0XG4gKiBleGVjdXRlcyBpcyBzeW5jaHJvbm91cyBmdW5jdGlvbnMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICogQHBhcmFtIHsqfSBmbmFtZSBQYXRoIHdpdGhpbiB0aGUgZmlsZWNhY2hlLnBhcnRpYWxzIGNhY2hlXG4gKiBAcGFyYW0geyp9IG1ldGFkYXRhIE9iamVjdCBjb250YWluaW5nIG1ldGFkYXRhXG4gKiBAcmV0dXJucyBTdHJpbmcgY29udGFpbmluZyB0aGUgcmVuZGVyZWQgc3R1ZmZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKSB7XG5cbiAgICBpZiAoIWZuYW1lIHx8IHR5cGVvZiBmbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBwYXJ0aWFsU3luYyBmbmFtZSBub3QgYSBzdHJpbmcgJHt1dGlsLmluc3BlY3QoZm5hbWUpfWApO1xuICAgIH1cblxuICAgIGNvbnN0IGZvdW5kID0gZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuZmluZFN5bmMoZm5hbWUpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBwYXJ0aWFsIGZvdW5kIGZvciAke2ZuYW1lfSBpbiAke3V0aWwuaW5zcGVjdChjb25maWcucGFydGlhbHNEaXJzKX1gKTtcbiAgICB9XG5cbiAgICB2YXIgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgIC8vIFNvbWUgcmVuZGVyZXJzIChOdW5qdWtzKSByZXF1aXJlIHRoYXQgbWV0YWRhdGEuY29uZmlnXG4gICAgICAgIC8vIHBvaW50IHRvIHRoZSBjb25maWcgb2JqZWN0LiAgVGhpcyBibG9jayBvZiBjb2RlXG4gICAgICAgIC8vIGR1cGxpY2F0ZXMgdGhlIG1ldGFkYXRhIG9iamVjdCwgdGhlbiBzZXRzIHRoZVxuICAgICAgICAvLyBjb25maWcgZmllbGQgaW4gdGhlIGR1cGxpY2F0ZSwgcGFzc2luZyB0aGF0IHRvIHRoZSBwYXJ0aWFsLlxuICAgICAgICBsZXQgbWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBsZXQgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gbWV0YWRhdGEpIHtcbiAgICAgICAgICAgIG1kYXRhW3Byb3BdID0gbWV0YWRhdGFbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgbWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICAvLyBJbiB0aGlzIGNvbnRleHQsIHBhcnRpYWxTeW5jIGlzIGRpcmVjdGx5IGF2YWlsYWJsZVxuICAgICAgICAvLyBhcyBhIGZ1bmN0aW9uIHRoYXQgd2UgY2FuIGRpcmVjdGx5IHVzZS5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWxTeW5jIGAsIHBhcnRpYWxTeW5jKTtcbiAgICAgICAgbWRhdGEucGFydGlhbFN5bmMgPSBwYXJ0aWFsU3luYy5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICAvLyBmb3IgZmluZFN5bmMsIHRoZSBcImZvdW5kXCIgb2JqZWN0IGlzIFZQYXRoRGF0YSB3aGljaFxuICAgICAgICAvLyBkb2VzIG5vdCBoYXZlIGRvY0JvZHkgbm9yIGRvY0NvbnRlbnQuICBUaGVyZWZvcmUgd2VcbiAgICAgICAgLy8gbXVzdCByZWFkIHRoaXMgY29udGVudFxuICAgICAgICBsZXQgcGFydGlhbFRleHQgPSBmcy5yZWFkRmlsZVN5bmMoZm91bmQuZnNwYXRoLCAndXRmLTgnKTtcbiAgICAgICAgLy8gaWYgKGZvdW5kLmRvY0JvZHkpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQm9keTtcbiAgICAgICAgLy8gZWxzZSBpZiAoZm91bmQuZG9jQ29udGVudCkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NDb250ZW50O1xuICAgICAgICAvLyBlbHNlIHBhcnRpYWxUZXh0ID0gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsLWZ1bmNzIHJlbmRlclN5bmMgJHtyZW5kZXJlci5uYW1lfSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gcmVuZGVyZXIucmVuZGVyU3luYyg8UmVuZGVyZXJzLlJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBmb3VuZC5mc3BhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBwYXJ0aWFsVGV4dCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBtZGF0YVxuICAgICAgICAgICAgLy8gcGFydGlhbFRleHQsIG1kYXRhLCBmb3VuZFxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcuaHRtbCcpIHx8IGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcueGh0bWwnKSkge1xuICAgICAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlbmRlclBhcnRpYWwgbm8gUmVuZGVyZXIgZm91bmQgZm9yICR7Zm5hbWV9IC0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIGluZGV4Q2hhaW5JdGVtID0ge1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgdnBhdGg6IHN0cmluZztcbiAgICBmb3VuZFBhdGg6IHN0cmluZztcbiAgICBmb3VuZERpcjogc3RyaW5nO1xuICAgIGZpbGVuYW1lOiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIFN0YXJ0aW5nIGZyb20gYSB2aXJ0dWFsIHBhdGggaW4gdGhlIGRvY3VtZW50cywgc2VhcmNoZXMgdXB3YXJkcyB0b1xuICogdGhlIHJvb3Qgb2YgdGhlIGRvY3VtZW50cyBmaWxlLXNwYWNlLCBmaW5kaW5nIGZpbGVzIHRoYXQgXG4gKiByZW5kZXIgdG8gXCJpbmRleC5odG1sXCIuICBUaGUgXCJpbmRleC5odG1sXCIgZmlsZXMgYXJlIGluZGV4IGZpbGVzLFxuICogYXMgdGhlIG5hbWUgc3VnZ2VzdHMuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIFxuICogQHBhcmFtIHsqfSBmbmFtZSBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5kZXhDaGFpbihcbiAgICBjb25maWcsIGZuYW1lXG4pOiBQcm9taXNlPGluZGV4Q2hhaW5JdGVtW10+IHtcblxuICAgIC8vIFRoaXMgdXNlZCB0byBiZSBhIGZ1bGwgZnVuY3Rpb24gaGVyZSwgYnV0IGhhcyBtb3ZlZFxuICAgIC8vIGludG8gdGhlIEZpbGVDYWNoZSBjbGFzcy4gIFJlcXVpcmluZyBhIGBjb25maWdgIG9wdGlvblxuICAgIC8vIGlzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBmb3JtZXIgQVBJLlxuXG4gICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIHJldHVybiBkb2N1bWVudHMuaW5kZXhDaGFpbihmbmFtZSk7XG59XG5cblxuLyoqXG4gKiBNYW5pcHVsYXRlIHRoZSByZWw9IGF0dHJpYnV0ZXMgb24gYSBsaW5rIHJldHVybmVkIGZyb20gTWFoYWJodXRhLlxuICpcbiAqIEBwYXJhbXMgeyRsaW5rfSBUaGUgbGluayB0byBtYW5pcHVsYXRlXG4gKiBAcGFyYW1zIHthdHRyfSBUaGUgYXR0cmlidXRlIG5hbWVcbiAqIEBwYXJhbXMge2RvYXR0cn0gQm9vbGVhbiBmbGFnIHdoZXRoZXIgdG8gc2V0ICh0cnVlKSBvciByZW1vdmUgKGZhbHNlKSB0aGUgYXR0cmlidXRlXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlua1JlbFNldEF0dHIoJGxpbmssIGF0dHIsIGRvYXR0cikge1xuICAgIGxldCBsaW5rcmVsID0gJGxpbmsuYXR0cigncmVsJyk7XG4gICAgbGV0IHJlbHMgPSBsaW5rcmVsID8gbGlua3JlbC5zcGxpdCgnICcpIDogW107XG4gICAgbGV0IGhhc2F0dHIgPSByZWxzLmluZGV4T2YoYXR0cikgPj0gMDtcbiAgICBpZiAoIWhhc2F0dHIgJiYgZG9hdHRyKSB7XG4gICAgICAgIHJlbHMudW5zaGlmdChhdHRyKTtcbiAgICAgICAgJGxpbmsuYXR0cigncmVsJywgcmVscy5qb2luKCcgJykpO1xuICAgIH0gZWxzZSBpZiAoaGFzYXR0ciAmJiAhZG9hdHRyKSB7XG4gICAgICAgIHJlbHMuc3BsaWNlKHJlbHMuaW5kZXhPZihhdHRyKSk7XG4gICAgICAgICRsaW5rLmF0dHIoJ3JlbCcsIHJlbHMuam9pbignICcpKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgc3RyaW5nIG9mIGFuIEhUTUwgYXR0cmlidXRlLCB3aGVyZSB0aGUgdmFsdWUgcG9ydGlvblxuICogaXMgcHJvcGVybHkgZW5jb2RlZCB0byBkZWZhbmcgYW55IHBvdGVudGlhbCBhdHRhY2tzLlxuICpcbiAqIEBwYXJhbSBuYW1lXG4gKiBAcGFyYW0gdmFsdWVcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkb0hUTUxBdHRyaWJ1dGUobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICA/IGAgJHtuYW1lfT1cIiR7ZW5jb2RlKHZhbHVlKX1cImBcbiAgICAgICAgOiAnJztcbn07XG5cbi8qKlxuICogQ29tcHV0ZSBhbiBhYnNvbHV0ZSB2cGF0aCBmcm9tIGEgcmVsYXRpdmUgcGF0aCByZWZlcmVuY2UuXG4gKiBcbiAqIFRoaXMgZnVuY3Rpb24gcmVzb2x2ZXMgYSByZWxhdGl2ZSBwYXRoIChsaWtlIFwiLi4vZmlsZS5odG1sXCIgb3IgXCIuL2ZpbGUuaHRtbFwiKVxuICogdG8gYW4gYWJzb2x1dGUgdnBhdGggaW4gdGhlIHZpcnR1YWwgZmlsZXN5c3RlbSwgYmFzZWQgb24gdGhlIHZwYXRoIG9mIHRoZVxuICogY3VycmVudCBkb2N1bWVudC5cbiAqIFxuICogSWYgdGhlIGlucHV0IHBhdGggaXMgYWxyZWFkeSBhYnNvbHV0ZSAoc3RhcnRzIHdpdGggJy8nKSwgaXQgaXMgcmV0dXJuZWRcbiAqIGFzLWlzIGFmdGVyIG5vcm1hbGl6YXRpb24uXG4gKiBcbiAqIEBwYXJhbSBiYXNlVnBhdGggVGhlIHZwYXRoIG9mIHRoZSBkb2N1bWVudCBtYWtpbmcgdGhlIHJlZmVyZW5jZSAoZS5nLiwgbWV0YWRhdGEuZG9jdW1lbnQucGF0aClcbiAqIEBwYXJhbSByZWxhdGl2ZVBhdGggVGhlIHBhdGggdG8gcmVzb2x2ZSAoY2FuIGJlIHJlbGF0aXZlIG9yIGFic29sdXRlKVxuICogQHJldHVybnMgVGhlIGFic29sdXRlIHZwYXRoIGluIHRoZSB2aXJ0dWFsIGZpbGVzeXN0ZW1cbiAqIFxuICogQGV4YW1wbGVcbiAqIC8vIEZyb20gZG9jdW1lbnQgYXQgJ2hpZXIvZGlyMS9wYWdlLmh0bWwubWQnIHJlZmVyZW5jaW5nICcuLi9zaWJsaW5nL2ZpbGUuaHRtbCdcbiAqIHJlc29sdmVWcGF0aCgnaGllci9kaXIxL3BhZ2UuaHRtbC5tZCcsICcuLi9zaWJsaW5nL2ZpbGUuaHRtbCcpXG4gKiAvLyBSZXR1cm5zOiAnL2hpZXIvc2libGluZy9maWxlLmh0bWwnXG4gKiBcbiAqIEBleGFtcGxlXG4gKiAvLyBBbHJlYWR5IGFic29sdXRlIHBhdGhcbiAqIHJlc29sdmVWcGF0aCgnaGllci9kaXIxL3BhZ2UuaHRtbC5tZCcsICcvYWJzb2x1dGUvcGF0aC5odG1sJylcbiAqIC8vIFJldHVybnM6ICcvYWJzb2x1dGUvcGF0aC5odG1sJ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVZwYXRoKGJhc2VWcGF0aDogc3RyaW5nLCByZWxhdGl2ZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCFiYXNlVnBhdGggfHwgdHlwZW9mIGJhc2VWcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZXNvbHZlVnBhdGg6IGJhc2VWcGF0aCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZywgZ290ICR7dHlwZW9mIGJhc2VWcGF0aH1gKTtcbiAgICB9XG4gICAgaWYgKCFyZWxhdGl2ZVBhdGggfHwgdHlwZW9mIHJlbGF0aXZlUGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZXNvbHZlVnBhdGg6IHJlbGF0aXZlUGF0aCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZywgZ290ICR7dHlwZW9mIHJlbGF0aXZlUGF0aH1gKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgcGF0aCBpcyBhbHJlYWR5IGFic29sdXRlLCByZXR1cm4gaXQgbm9ybWFsaXplZFxuICAgIGlmIChwYXRoLmlzQWJzb2x1dGUocmVsYXRpdmVQYXRoKSkge1xuICAgICAgICByZXR1cm4gcGF0aC5ub3JtYWxpemUocmVsYXRpdmVQYXRoKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgdGhlIGRpcmVjdG9yeSBvZiB0aGUgYmFzZSB2cGF0aFxuICAgIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShiYXNlVnBhdGgpO1xuICAgIFxuICAgIC8vIEpvaW4gd2l0aCAnLycgcHJlZml4IHRvIGVuc3VyZSB3ZSBnZXQgYW4gYWJzb2x1dGUgdnBhdGhcbiAgICAvLyBhbmQgbm9ybWFsaXplIHRvIGNsZWFuIHVwIGFueSAuLiBvciAuIHNlZ21lbnRzXG4gICAgcmV0dXJuIHBhdGgubm9ybWFsaXplKHBhdGguam9pbignLycsIGRpciwgcmVsYXRpdmVQYXRoKSk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vIFJTUyBGZWVkIEdlbmVyYXRpb25cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUlNTKGNvbmZpZywgY29uZmlncnNzLCBmZWVkRGF0YSwgaXRlbXMsIHJlbmRlclRvKSB7XG5cbiAgICAvLyBTdXBwb3NlZGx5IGl0J3MgcmVxdWlyZWQgdG8gdXNlIGhhc093blByb3BlcnR5XG4gICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83MjgzNjAvaG93LWRvLWktY29ycmVjdGx5LWNsb25lLWEtamF2YXNjcmlwdC1vYmplY3QjNzI4Njk0XG4gICAgLy9cbiAgICAvLyBCdXQsIGluIG91ciBjYXNlIHRoYXQgcmVzdWx0ZWQgaW4gYW4gZW1wdHkgb2JqZWN0XG5cbiAgICAvLyBjb25zb2xlLmxvZygnY29uZmlncnNzICcrIHV0aWwuaW5zcGVjdChjb25maWdyc3MpKTtcblxuICAgIC8vIENvbnN0cnVjdCBpbml0aWFsIHJzcyBvYmplY3RcbiAgICB2YXIgcnNzID0ge307XG4gICAgZm9yIChsZXQga2V5IGluIGNvbmZpZ3Jzcy5yc3MpIHtcbiAgICAgICAgLy9pZiAoY29uZmlncnNzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHJzc1trZXldID0gY29uZmlncnNzLnJzc1trZXldO1xuICAgICAgICAvL31cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZygncnNzICcrIHV0aWwuaW5zcGVjdChyc3MpKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKCdmZWVkRGF0YSAnKyB1dGlsLmluc3BlY3QoZmVlZERhdGEpKTtcblxuICAgIC8vIFRoZW4gZmlsbCBpbiBmcm9tIGZlZWREYXRhXG4gICAgZm9yIChsZXQga2V5IGluIGZlZWREYXRhKSB7XG4gICAgICAgIC8vaWYgKGZlZWREYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHJzc1trZXldID0gZmVlZERhdGFba2V5XTtcbiAgICAgICAgLy99XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coJ2dlbmVyYXRlUlNTIHJzcyAnKyB1dGlsLmluc3BlY3QocnNzKSk7XG5cbiAgICB2YXIgcnNzZmVlZCA9IG5ldyBSU1MocnNzKTtcblxuICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkgeyByc3NmZWVkLml0ZW0oaXRlbSk7IH0pO1xuXG4gICAgdmFyIHhtbCA9IHJzc2ZlZWQueG1sKCk7XG4gICAgdmFyIHJlbmRlck91dCA9IHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIHJlbmRlclRvKTtcblxuICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyT3V0KSwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlck91dCwgeG1sLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG5cbn07XG5cbi8vIEZvciBvRW1iZWQsIENvbnNpZGVyIG1ha2luZyBhbiBleHRlcm5hbCBwbHVnaW5cbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL29lbWJlZC1hbGxcbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL2VtYmVkYWJsZVxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvbWVkaWEtcGFyc2VyXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9vZW1iZXR0ZXJcblxuXG4vKipcbiAqIFRoZSBBa2FzaGFSZW5kZXIgcHJvamVjdCBjb25maWd1cmF0aW9uIG9iamVjdC4gIFxuICogT25lIGluc3RhbnRpYXRlcyBhIENvbmZpZ3VyYXRpb24gb2JqZWN0LCB0aGVuIGZpbGxzIGl0XG4gKiB3aXRoIHNldHRpbmdzIGFuZCBwbHVnaW5zLlxuICogXG4gKiBAc2VlIG1vZHVsZTpDb25maWd1cmF0aW9uXG4gKi9cblxuLy8gY29uc3QgX2NvbmZpZ19wbHVnaW5EYXRhID0gU3ltYm9sKCdwbHVnaW5EYXRhJyk7XG4vLyBjb25zdCBfY29uZmlnX2Fzc2V0c0RpcnMgPSBTeW1ib2woJ2Fzc2V0c0RpcnMnKTtcbi8vIGNvbnN0IF9jb25maWdfZG9jdW1lbnREaXJzID0gU3ltYm9sKCdkb2N1bWVudERpcnMnKTtcbi8vIGNvbnN0IF9jb25maWdfbGF5b3V0RGlycyA9IFN5bWJvbCgnbGF5b3V0RGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19wYXJ0aWFsRGlycyA9IFN5bWJvbCgncGFydGlhbERpcnMnKTtcbi8vIGNvbnN0IF9jb25maWdfbWFoYWZ1bmNzID0gU3ltYm9sKCdtYWhhZnVuY3MnKTtcbi8vIGNvbnN0IF9jb25maWdfcmVuZGVyVG8gPSBTeW1ib2woJ3JlbmRlclRvJyk7XG4vLyBjb25zdCBfY29uZmlnX21ldGFkYXRhID0gU3ltYm9sKCdtZXRhZGF0YScpO1xuLy8gY29uc3QgX2NvbmZpZ19yb290X3VybCA9IFN5bWJvbCgncm9vdF91cmwnKTtcbi8vIGNvbnN0IF9jb25maWdfc2NyaXB0cyA9IFN5bWJvbCgnc2NyaXB0cycpO1xuLy8gY29uc3QgX2NvbmZpZ19wbHVnaW5zID0gU3ltYm9sKCdwbHVnaW5zJyk7XG4vLyBjb25zdCBfY29uZmlnX2NoZWVyaW8gPSBTeW1ib2woJ2NoZWVyaW8nKTtcbi8vIGNvbnN0IF9jb25maWdfY29uZmlnZGlyID0gU3ltYm9sKCdjb25maWdkaXInKTtcbi8vIGNvbnN0IF9jb25maWdfY2FjaGVkaXIgID0gU3ltYm9sKCdjYWNoZWRpcicpO1xuLy8gY29uc3QgX2NvbmZpZ19jb25jdXJyZW5jeSA9IFN5bWJvbCgnY29uY3VycmVuY3knKTtcbi8vIGNvbnN0IF9jb25maWdfcmVuZGVyZXJzID0gU3ltYm9sKCdyZW5kZXJlcnMnKTtcblxuLyoqXG4gKiBEYXRhIHR5cGUgZGVzY3JpYmluZyBpdGVtcyBpbiB0aGVcbiAqIGphdmFTY3JpcHRUb3AgYW5kIGphdmFTY3JpcHRCb3R0b20gYXJyYXlzLlxuICogVGhlIGZpZWxkcyBjb3JyZXNwb25kIHRvIHRoZSBhdHRyaWJ1dGVzXG4gKiBvZiB0aGUgPHNjcmlwdD4gdGFnIHdoaWNoIGNhbiBiZSB1c2VkXG4gKiBlaXRoZXIgaW4gdGhlIHRvcCBvciBib3R0b20gb2ZcbiAqIGFuIEhUTUwgZmlsZS5cbiAqL1xuZXhwb3J0IHR5cGUgamF2YVNjcmlwdEl0ZW0gPSB7XG4gICAgaHJlZj86IHN0cmluZyxcbiAgICBzY3JpcHQ/OiBzdHJpbmcsXG4gICAgbGFuZz86IHN0cmluZ1xufTtcblxuZXhwb3J0IHR5cGUgc3R5bGVzaGVldEl0ZW0gPSB7XG4gICAgaHJlZj86IHN0cmluZyxcbiAgICBtZWRpYT86IHN0cmluZ1xuXG59O1xuXG4vKipcbiAqIERlZmluZXMgdGhlIHN0cnVjdHVyZSBmb3IgZGlyZWN0b3J5XG4gKiBtb3VudCBzcGVjaWZpY2F0aW9uIGluIHRoZSBDb25maWd1cmF0aW9uLlxuICogXG4gKiBUaGUgc2ltcGxlICdzdHJpbmcnIGZvcm0gc2F5cyB0byBtb3VudFxuICogdGhlIG5hbWVkIGZzcGF0aCBvbiB0aGUgcm9vdCBvZiB0aGVcbiAqIHZpcnR1YWwgZmlsZXNwYWNlLlxuICogXG4gKiBUaGUgb2JqZWN0IGZvcm0gYWxsb3dzIHVzIHRvIG1vdW50XG4gKiBhbiBmc3BhdGggaW50byBhIGRpZmZlcmVudCBsb2NhdGlvblxuICogaW4gdGhlIHZpcnR1YWwgZmlsZXNwYWNlLCB0byBpZ25vcmVcbiAqIGZpbGVzIGJhc2VkIG9uIEdMT0IgcGF0dGVybnMsIGFuZCB0b1xuICogaW5jbHVkZSBtZXRhZGF0YSBmb3IgZXZlcnkgZmlsZSBpblxuICogYSBkaXJlY3RvcnkgdHJlZS5cbiAqIFxuICogSW4gdGhlIGZpbGUtY2FjaGUgbW9kdWxlLCB0aGlzIGlzXG4gKiBjb252ZXJ0ZWQgdG8gdGhlIGRpclRvV2F0Y2ggc3RydWN0dXJlXG4gKiB1c2VkIGJ5IFN0YWNrZWREaXJzLlxuICovXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gb2YgYW4gQWthc2hhUmVuZGVyIHByb2plY3QsIGluY2x1ZGluZyB0aGUgaW5wdXQgZGlyZWN0b3JpZXMsXG4gKiBvdXRwdXQgZGlyZWN0b3J5LCBwbHVnaW5zLCBhbmQgdmFyaW91cyBzZXR0aW5ncy5cbiAqXG4gKiBVU0FHRTpcbiAqXG4gKiBjb25zdCBha2FzaGEgPSByZXF1aXJlKCdha2FzaGFyZW5kZXInKTtcbiAqIGNvbnN0IGNvbmZpZyA9IG5ldyBha2FzaGEuQ29uZmlndXJhdGlvbigpO1xuICovXG5leHBvcnQgY2xhc3MgQ29uZmlndXJhdGlvbiB7XG4gICAgI3JlbmRlcmVyczogUmVuZGVyZXJzLkNvbmZpZ3VyYXRpb247XG4gICAgI2NvbmZpZ2Rpcjogc3RyaW5nO1xuICAgICNjYWNoZWRpcjogc3RyaW5nO1xuICAgICNhc3NldHNEaXJzPzogZGlyVG9Nb3VudFtdO1xuICAgICNsYXlvdXREaXJzPzogZGlyVG9Nb3VudFtdO1xuICAgICNkb2N1bWVudERpcnM/OiBkaXJUb01vdW50W107XG4gICAgI3BhcnRpYWxEaXJzPzogZGlyVG9Nb3VudFtdO1xuICAgICNtYWhhZnVuY3M7XG4gICAgI2NoZWVyaW8/OiBjaGVlcmlvLkNoZWVyaW9PcHRpb25zO1xuICAgICNyZW5kZXJUbzogc3RyaW5nO1xuICAgICNzY3JpcHRzPzoge1xuICAgICAgICBzdHlsZXNoZWV0cz86IHN0eWxlc2hlZXRJdGVtW10sXG4gICAgICAgIGphdmFTY3JpcHRUb3A/OiBqYXZhU2NyaXB0SXRlbVtdLFxuICAgICAgICBqYXZhU2NyaXB0Qm90dG9tPzogamF2YVNjcmlwdEl0ZW1bXVxuICAgIH07XG4gICAgI2NvbmN1cnJlbmN5OiBudW1iZXI7XG4gICAgI2NhY2hpbmdUaW1lb3V0OiBudW1iZXI7XG4gICAgI21ldGFkYXRhOiBhbnk7XG4gICAgI3Jvb3RfdXJsOiBzdHJpbmc7XG4gICAgI3BsdWdpbnM7XG4gICAgI3BsdWdpbkRhdGE7XG4gICAgI3ZlcmJvc2U6IGJvb2xlYW47XG4gICAgI3BlcmZEYXRhRGlyOiBzdHJpbmc7XG4gICAgXG4gICAgY29uc3RydWN0b3IobW9kdWxlcGF0aCkge1xuXG4gICAgICAgIC8vIHRoaXNbX2NvbmZpZ19yZW5kZXJlcnNdID0gW107XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycyA9IG5ldyBSZW5kZXJlcnMuQ29uZmlndXJhdGlvbih7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy4jbWFoYWZ1bmNzID0gW107XG4gICAgICAgIHRoaXMuI3NjcmlwdHMgPSB7XG4gICAgICAgICAgICBzdHlsZXNoZWV0czogW10sXG4gICAgICAgICAgICBqYXZhU2NyaXB0VG9wOiBbXSxcbiAgICAgICAgICAgIGphdmFTY3JpcHRCb3R0b206IFtdXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy4jY29uY3VycmVuY3kgPSAzO1xuICAgICAgICAvLyA2MCBzZWNvbmRzLCBvciAxIG1pbnV0ZVxuICAgICAgICB0aGlzLiNjYWNoaW5nVGltZW91dCA9IDYwMDAwO1xuXG4gICAgICAgIHRoaXMuI2RvY3VtZW50RGlycyA9IFtdO1xuICAgICAgICB0aGlzLiNsYXlvdXREaXJzID0gW107XG4gICAgICAgIHRoaXMuI3BhcnRpYWxEaXJzID0gW107XG4gICAgICAgIHRoaXMuI2Fzc2V0c0RpcnMgPSBbXTtcblxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MgPSBbXTtcblxuICAgICAgICB0aGlzLiNyZW5kZXJUbyA9ICdvdXQnO1xuXG4gICAgICAgIHRoaXMuI21ldGFkYXRhID0ge30gYXMgYW55O1xuXG4gICAgICAgIHRoaXMuI3BsdWdpbnMgPSBbXTtcbiAgICAgICAgdGhpcy4jcGx1Z2luRGF0YSA9IFtdO1xuICAgICAgICBcbiAgICAgICAgdGhpcy4jdmVyYm9zZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuI3BlcmZEYXRhRGlyID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIC8qXG4gICAgICAgICAqIElzIHRoaXMgdGhlIGJlc3QgcGxhY2UgZm9yIHRoaXM/ICBJdCBpcyBuZWNlc3NhcnkgdG9cbiAgICAgICAgICogY2FsbCB0aGlzIGZ1bmN0aW9uIHNvbWV3aGVyZS4gIFRoZSBuYXR1cmUgb2YgdGhpcyBmdW5jdGlvblxuICAgICAgICAgKiBpcyB0aGF0IGl0IGNhbiBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMgd2l0aCBubyBpbXBhY3QuICBcbiAgICAgICAgICogQnkgYmVpbmcgbG9jYXRlZCBoZXJlLCBpdCB3aWxsIGFsd2F5cyBiZSBjYWxsZWQgYnkgdGhlXG4gICAgICAgICAqIHRpbWUgYW55IENvbmZpZ3VyYXRpb24gaXMgZ2VuZXJhdGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgLy8gVGhpcyBpcyBleGVjdXRlZCBpbiBAYWthc2hhY21zL3JlbmRlcmVyc1xuICAgICAgICAvLyB0aGlzW19jb25maWdfcmVuZGVyZXJzXS5yZWdpc3RlckJ1aWx0SW5SZW5kZXJlcnMoKTtcblxuICAgICAgICAvLyBQcm92aWRlIGEgbWVjaGFuaXNtIHRvIGVhc2lseSBzcGVjaWZ5IGNvbmZpZ0RpclxuICAgICAgICAvLyBUaGUgcGF0aCBpbiBjb25maWdEaXIgbXVzdCBiZSB0aGUgcGF0aCBvZiB0aGUgY29uZmlndXJhdGlvbiBmaWxlLlxuICAgICAgICAvLyBUaGVyZSBkb2Vzbid0IGFwcGVhciB0byBiZSBhIHdheSB0byBkZXRlcm1pbmUgdGhhdCBmcm9tIGhlcmUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEZvciBleGFtcGxlIG1vZHVsZS5wYXJlbnQuZmlsZW5hbWUgaW4gdGhpcyBjYXNlIHBvaW50c1xuICAgICAgICAvLyB0byBha2FzaGFyZW5kZXIvaW5kZXguanMgYmVjYXVzZSB0aGF0J3MgdGhlIG1vZHVsZSB3aGljaFxuICAgICAgICAvLyBsb2FkZWQgdGhpcyBtb2R1bGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIE9uZSBjb3VsZCBpbWFnaW5lIGEgZGlmZmVyZW50IGluaXRpYWxpemF0aW9uIHBhdHRlcm4uICBJbnN0ZWFkXG4gICAgICAgIC8vIG9mIGFrYXNoYXJlbmRlciByZXF1aXJpbmcgQ29uZmlndXJhdGlvbi5qcywgdGhhdCBmaWxlIGNvdWxkIGJlXG4gICAgICAgIC8vIHJlcXVpcmVkIGJ5IHRoZSBjb25maWd1cmF0aW9uIGZpbGUuICBJbiBzdWNoIGEgY2FzZVxuICAgICAgICAvLyBtb2R1bGUucGFyZW50LmZpbGVuYW1lIFdPVUxEIGluZGljYXRlIHRoZSBmaWxlbmFtZSBmb3IgdGhlXG4gICAgICAgIC8vIGNvbmZpZ3VyYXRpb24gZmlsZSwgYW5kIHdvdWxkIGJlIGEgc291cmNlIG9mIHNldHRpbmdcbiAgICAgICAgLy8gdGhlIGNvbmZpZ0RpciB2YWx1ZS5cbiAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGVwYXRoICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGVwYXRoICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ0RpciA9IHBhdGguZGlybmFtZShtb2R1bGVwYXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZlcnkgY2FyZWZ1bGx5IGFkZCB0aGUgPHBhcnRpYWw+IHN1cHBvcnQgZnJvbSBNYWhhYmh1dGEgYXMgdGhlXG4gICAgICAgIC8vIHZlcnkgZmlyc3QgdGhpbmcgc28gdGhhdCBpdCBleGVjdXRlcyBiZWZvcmUgYW55dGhpbmcgZWxzZS5cbiAgICAgICAgbGV0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIHRoaXMuYWRkTWFoYWJodXRhKG1haGFQYXJ0aWFsLm1haGFiaHV0YUFycmF5KHtcbiAgICAgICAgICAgIHJlbmRlclBhcnRpYWw6IGZ1bmN0aW9uKGZuYW1lLCBtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gdmFsdWVzIGZvciBhbnl0aGluZyB3aGljaCBoYXMgbm90XG4gICAgICogYWxyZWFkeSBiZWVuIGNvbmZpZ3VyZWQuICBTb21lIGJ1aWx0LWluIGRlZmF1bHRzIGhhdmUgYmVlbiBkZWNpZGVkXG4gICAgICogYWhlYWQgb2YgdGltZS4gIEZvciBlYWNoIGNvbmZpZ3VyYXRpb24gc2V0dGluZywgaWYgbm90aGluZyBoYXMgYmVlblxuICAgICAqIGRlY2xhcmVkLCB0aGVuIHRoZSBkZWZhdWx0IGlzIHN1YnN0aXR1dGVkLlxuICAgICAqXG4gICAgICogSXQgaXMgZXhwZWN0ZWQgdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBsYXN0IGluIHRoZSBjb25maWcgZmlsZS5cbiAgICAgKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gaW5zdGFsbHMgdGhlIGBidWlsdC1pbmAgcGx1Z2luLiAgSXQgbmVlZHMgdG8gYmUgbGFzdCBvblxuICAgICAqIHRoZSBwbHVnaW4gY2hhaW4gc28gdGhhdCBpdHMgc3R5bGVzaGVldHMgYW5kIHBhcnRpYWxzIGFuZCB3aGF0bm90XG4gICAgICogY2FuIGJlIG92ZXJyaWRkZW4gYnkgb3RoZXIgcGx1Z2lucy5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHByZXBhcmUoKSB7XG5cbiAgICAgICAgY29uc3QgQ09ORklHID0gdGhpcztcblxuICAgICAgICBjb25zdCBjb25maWdEaXJQYXRoID0gZnVuY3Rpb24oZGlybm0pIHtcbiAgICAgICAgICAgIGxldCBjb25maWdQYXRoID0gZGlybm07XG4gICAgICAgICAgICBpZiAodHlwZW9mIENPTkZJRy5jb25maWdEaXIgIT09ICd1bmRlZmluZWQnICYmIENPTkZJRy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZ1BhdGggPSBwYXRoLmpvaW4oQ09ORklHLmNvbmZpZ0RpciwgZGlybm0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZ1BhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3RhdDtcblxuICAgICAgICBjb25zdCBjYWNoZURpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnY2FjaGUnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNjYWNoZWRpcikge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY2FjaGVEaXJzUGF0aClcbiAgICAgICAgICAgICAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGNhY2hlRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWNoZURpciA9ICdjYWNoZSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ2NhY2hlJyBpcyBub3QgYSBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmMoY2FjaGVEaXJzUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWNoZURpciA9ICdjYWNoZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy4jY2FjaGVkaXIgJiYgIWZzLmV4aXN0c1N5bmModGhpcy4jY2FjaGVkaXIpKSB7XG4gICAgICAgICAgICBmcy5ta2RpclN5bmModGhpcy4jY2FjaGVkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXNzZXRzRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdhc3NldHMnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNhc3NldHNEaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhhc3NldHNEaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhhc3NldHNEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEFzc2V0c0RpcignYXNzZXRzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGF5b3V0c0RpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnbGF5b3V0cycpO1xuICAgICAgICBpZiAoIXRoaXMuI2xheW91dERpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGxheW91dHNEaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhsYXlvdXRzRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXRzRGlyKCdsYXlvdXRzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFydGlhbERpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgncGFydGlhbHMnKTtcbiAgICAgICAgaWYgKCFtYWhhUGFydGlhbC5jb25maWd1cmF0aW9uLnBhcnRpYWxEaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXJ0aWFsRGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMocGFydGlhbERpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkUGFydGlhbHNEaXIoJ3BhcnRpYWxzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnREaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2RvY3VtZW50cycpO1xuICAgICAgICBpZiAoIXRoaXMuI2RvY3VtZW50RGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZG9jdW1lbnREaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhkb2N1bWVudERpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRG9jdW1lbnRzRGlyKCdkb2N1bWVudHMnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInZG9jdW1lbnRzJyBpcyBub3QgYSBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyAnZG9jdW1lbnREaXJzJyBzZXR0aW5nLCBhbmQgbm8gJ2RvY3VtZW50cycgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVuZGVyVG9QYXRoID0gY29uZmlnRGlyUGF0aCgnb3V0Jyk7XG4gICAgICAgIGlmICghdGhpcy4jcmVuZGVyVG8pICB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhyZW5kZXJUb1BhdGgpXG4gICAgICAgICAgICAgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhyZW5kZXJUb1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRSZW5kZXJEZXN0aW5hdGlvbignb3V0Jyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ291dCcgaXMgbm90IGEgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKHJlbmRlclRvUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRSZW5kZXJEZXN0aW5hdGlvbignb3V0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy4jcmVuZGVyVG8gJiYgIWZzLmV4aXN0c1N5bmModGhpcy4jcmVuZGVyVG8pKSB7XG4gICAgICAgICAgICBmcy5ta2RpclN5bmModGhpcy4jcmVuZGVyVG8sIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGFrYXNoYWNtcy1idWlsdGluIHBsdWdpbiBuZWVkcyB0byBiZSBsYXN0IG9uIHRoZSBjaGFpbiBzbyB0aGF0XG4gICAgICAgIC8vIGl0cyBwYXJ0aWFscyBldGMgY2FuIGJlIGVhc2lseSBvdmVycmlkZGVuLiAgVGhpcyBpcyB0aGUgbW9zdCBjb252ZW5pZW50XG4gICAgICAgIC8vIHBsYWNlIHRvIGRlY2xhcmUgdGhhdCBwbHVnaW4uXG4gICAgICAgIC8vXG5cbiAgICAgICAgLy8gTm9ybWFsbHkgd2UnZCBkbyByZXF1aXJlKCcuL2J1aWx0LWluLmpzJykuXG4gICAgICAgIC8vIEJ1dCwgaW4gdGhpcyBjb250ZXh0IHRoYXQgZG9lc24ndCB3b3JrLlxuICAgICAgICAvLyBXaGF0IHdlIGRpZCBpcyB0byBpbXBvcnQgdGhlXG4gICAgICAgIC8vIEJ1aWx0SW5QbHVnaW4gY2xhc3MgZWFybGllciBzbyB0aGF0XG4gICAgICAgIC8vIGl0IGNhbiBiZSB1c2VkIGhlcmUuXG4gICAgICAgIHRoaXMudXNlKEJ1aWx0SW5QbHVnaW4sIHtcbiAgICAgICAgICAgIC8vIGJ1aWx0LWluIG9wdGlvbnMgaWYgYW55XG4gICAgICAgICAgICAvLyBEbyBub3QgbmVlZCB0aGlzIGhlcmUgYW55IGxvbmdlciBiZWNhdXNlIGl0IGlzIGhhbmRsZWRcbiAgICAgICAgICAgIC8vIGluIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgICAgICAgIC8vIFNldCB1cCB0aGUgTWFoYWJodXRhIHBhcnRpYWwgdGFnIHNvIGl0IHJlbmRlcnMgdGhyb3VnaCBBa2FzaGFSZW5kZXJcbiAgICAgICAgICAgIC8vIHJlbmRlclBhcnRpYWw6IGZ1bmN0aW9uKGZuYW1lLCBtZXRhZGF0YSkge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiByZW5kZXIucGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY29yZCB0aGUgY29uZmlndXJhdGlvbiBkaXJlY3Rvcnkgc28gdGhhdCB3ZSBjYW4gY29ycmVjdGx5IGludGVycG9sYXRlXG4gICAgICogdGhlIHBhdGhuYW1lcyB3ZSdyZSBwcm92aWRlZC5cbiAgICAgKi9cbiAgICBzZXQgY29uZmlnRGlyKGNmZ2Rpcjogc3RyaW5nKSB7IHRoaXMuI2NvbmZpZ2RpciA9IGNmZ2RpcjsgfVxuICAgIGdldCBjb25maWdEaXIoKSB7IHJldHVybiB0aGlzLiNjb25maWdkaXI7IH1cblxuICAgIHNldCBjYWNoZURpcihkaXJubTogc3RyaW5nKSB7IHRoaXMuI2NhY2hlZGlyID0gZGlybm07IH1cbiAgICBnZXQgY2FjaGVEaXIoKSB7IHJldHVybiB0aGlzLiNjYWNoZWRpcjsgfVxuXG4gICAgc2V0IHZlcmJvc2UodmFsOiBib29sZWFuKSB7IHRoaXMuI3ZlcmJvc2UgPSB2YWw7IH1cbiAgICBnZXQgdmVyYm9zZSgpIHsgcmV0dXJuIHRoaXMuI3ZlcmJvc2U7IH1cblxuICAgIHNldCBwZXJmRGF0YURpcihzdG9yZURpcjogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuI3BlcmZEYXRhRGlyID0gc3RvcmVEaXI7XG4gICAgfVxuICAgIGdldCBwZXJmRGF0YURpcigpIHsgcmV0dXJuIHRoaXMuI3BlcmZEYXRhRGlyOyB9XG5cbiAgICAvLyBzZXQgYWthc2hhKF9ha2FzaGEpICB7IHRoaXNbX2NvbmZpZ19ha2FzaGFdID0gX2FrYXNoYTsgfVxuICAgIGdldCBha2FzaGEoKSB7IHJldHVybiBtb2R1bGVfZXhwb3J0czsgfVxuXG4gICAgYXN5bmMgZG9jdW1lbnRzQ2FjaGUoKSB7IHJldHVybiBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7IH1cbiAgICBhc3luYyBhc3NldHNDYWNoZSgpICAgIHsgcmV0dXJuIGZpbGVjYWNoZS5hc3NldHNDYWNoZTsgfVxuICAgIGFzeW5jIGxheW91dHNDYWNoZSgpICAgeyByZXR1cm4gZmlsZWNhY2hlLmxheW91dHNDYWNoZTsgfVxuICAgIGFzeW5jIHBhcnRpYWxzQ2FjaGUoKSAgeyByZXR1cm4gZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGU7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgZG9jdW1lbnREaXJzIGNvbmZpZ3VyYXRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IGRpclRvTW91bnR9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlIG9yIGRpclRvTW91bnQgb2JqZWN0XG4gICAgICovXG4gICAgYWRkRG9jdW1lbnRzRGlyKGRpcjogc3RyaW5nIHwgZGlyVG9Nb3VudCkge1xuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpcikgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAuLi5kaXIsXG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzRGlyVG9Nb3VudChkaXJNb3VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkRG9jdW1lbnRzRGlyIC0gaW52YWxpZCBkaXJUb01vdW50IG9iamVjdDogJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLiNkb2N1bWVudERpcnMucHVzaChkaXJNb3VudCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBkb2N1bWVudERpcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiNkb2N1bWVudERpcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9vayB1cCB0aGUgZG9jdW1lbnQgZGlyZWN0b3J5IGluZm9ybWF0aW9uIGZvciBhIGdpdmVuIGRvY3VtZW50IGRpcmVjdG9yeS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlybmFtZSBUaGUgZG9jdW1lbnQgZGlyZWN0b3J5IHRvIHNlYXJjaCBmb3JcbiAgICAgKi9cbiAgICBkb2N1bWVudERpckluZm8oZGlybmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGZvciAodmFyIGRvY0RpciBvZiB0aGlzLmRvY3VtZW50RGlycykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkb2NEaXIgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY0Rpci5zcmMgPT09IGRpcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvY0RpcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRvY0RpciA9PT0gZGlybmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkb2NEaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIGxheW91dERpcnMgY29uZmlndXJ0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBkaXJUb01vdW50fSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZSBvciBkaXJUb01vdW50IG9iamVjdFxuICAgICAqL1xuICAgIGFkZExheW91dHNEaXIoZGlyOiBzdHJpbmcgfCBkaXJUb01vdW50KSB7XG4gICAgICAgIGxldCBkaXJNb3VudDogZGlyVG9Nb3VudDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmRpcixcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghaXNEaXJUb01vdW50KGRpck1vdW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGRMYXlvdXRzRGlyIC0gaW52YWxpZCBkaXJUb01vdW50IG9iamVjdDogJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLiNsYXlvdXREaXJzLnB1c2goZGlyTW91bnQpO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMuYWRkTGF5b3V0RGlyKGRpck1vdW50LnNyYyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBsYXlvdXREaXJzKCkgeyByZXR1cm4gdGhpcy4jbGF5b3V0RGlyczsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBwYXJ0aWFsRGlycyBjb25maWd1cnRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IGRpclRvTW91bnR9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlIG9yIGRpclRvTW91bnQgb2JqZWN0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkUGFydGlhbHNEaXIoZGlyOiBzdHJpbmcgfCBkaXJUb01vdW50KSB7XG4gICAgICAgIGxldCBkaXJNb3VudDogZGlyVG9Nb3VudDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmRpcixcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghaXNEaXJUb01vdW50KGRpck1vdW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGRQYXJ0aWFsc0RpciAtIGludmFsaWQgZGlyVG9Nb3VudCBvYmplY3Q6ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy4jcGFydGlhbERpcnMucHVzaChkaXJNb3VudCk7XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycy5hZGRQYXJ0aWFsRGlyKGRpck1vdW50LnNyYyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBwYXJ0aWFsc0RpcnMoKSB7IHJldHVybiB0aGlzLiNwYXJ0aWFsRGlyczsgfVxuICAgIGdldCBwYXJ0aWFsRGlycygpIHsgcmV0dXJuIHRoaXMuI3BhcnRpYWxEaXJzOyB9XG4gICAgXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBhc3NldERpcnMgY29uZmlndXJ0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBkaXJUb01vdW50fSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZSBvciBkaXJUb01vdW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEFzc2V0c0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZEFzc2V0c0RpciAtIGludmFsaWQgZGlyVG9Nb3VudCBvYmplY3Q6ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy4jYXNzZXRzRGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGFzc2V0RGlycygpIHsgcmV0dXJuIHRoaXMuI2Fzc2V0c0RpcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhbiBhcnJheSBvZiBNYWhhYmh1dGEgZnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheX0gbWFoYWZ1bmNzXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkTWFoYWJodXRhKG1haGFmdW5jczogbWFoYWJodXRhLk1haGFmdW5jQXJyYXkgfCBtYWhhYmh1dGEuTWFoYWZ1bmNUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWFoYWZ1bmNzID09PSAndW5kZWZpbmVkJyB8fCAhbWFoYWZ1bmNzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuZGVmaW5lZCBtYWhhZnVuY3MgaW4gJHt0aGlzLmNvbmZpZ0Rpcn1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MucHVzaChtYWhhZnVuY3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWFoYWZ1bmNzKCkgeyByZXR1cm4gdGhpcy4jbWFoYWZ1bmNzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmUgdGhlIGRpcmVjdG9yeSBpbnRvIHdoaWNoIHRoZSBwcm9qZWN0IGlzIHJlbmRlcmVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHNldFJlbmRlckRlc3RpbmF0aW9uKGRpcjogc3RyaW5nKSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJyAmJiAhcGF0aC5pc0Fic29sdXRlKGRpcikpIHtcbiAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jcmVuZGVyVG8gPSBkaXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBGZXRjaCB0aGUgZGVjbGFyZWQgZGVzdGluYXRpb24gZm9yIHJlbmRlcmluZyB0aGUgcHJvamVjdC4gKi9cbiAgICBnZXQgcmVuZGVyRGVzdGluYXRpb24oKSB7IHJldHVybiB0aGlzLiNyZW5kZXJUbzsgfVxuICAgIGdldCByZW5kZXJUbygpIHsgcmV0dXJuIHRoaXMuI3JlbmRlclRvOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSB2YWx1ZSB0byB0aGUgcHJvamVjdCBtZXRhZGF0YS4gIFRoZSBtZXRhZGF0YSBpcyBjb21iaW5lZCB3aXRoXG4gICAgICogdGhlIGRvY3VtZW50IG1ldGFkYXRhIGFuZCB1c2VkIGR1cmluZyByZW5kZXJpbmcuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGluZGV4IFRoZSBrZXkgdG8gc3RvcmUgdGhlIHZhbHVlLlxuICAgICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc3RvcmUgaW4gdGhlIG1ldGFkYXRhLlxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZE1ldGFkYXRhKGluZGV4OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdmFyIG1kID0gdGhpcy4jbWV0YWRhdGE7XG4gICAgICAgIG1kW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLiNtZXRhZGF0YTsgfVxuXG4gICAgI2Rlc2NyaXB0aW9uczogVGFnRGVzY3JpcHRpb25bXTtcblxuICAgIC8qKlxuICAgICAqIEFkZCB0YWcgZGVzY3JpcHRpb25zIHRvIHRoZSBkYXRhYmFzZS4gIFRoZSBwdXJwb3NlXG4gICAgICogaXMgZm9yIGV4YW1wbGUgYSB0YWcgaW5kZXggcGFnZSBjYW4gZ2l2ZSBhXG4gICAgICogZGVzY3JpcHRpb24gYXQgdGhlIHRvcCBvZiB0aGUgcGFnZS5cbiAgICAgKlxuICAgICAqIE5PVEU6IFBvdGVudGlhbCBidWcgLSBUaGlzIGZ1bmN0aW9uIHJlcGxhY2VzIHRoZSBlbnRpcmUgI2Rlc2NyaXB0aW9uc1xuICAgICAqIGFycmF5IHJhdGhlciB0aGFuIG1lcmdpbmcgd2l0aCBleGlzdGluZyBkZXNjcmlwdGlvbnMuIElmIGNhbGxlZCBtdWx0aXBsZVxuICAgICAqIHRpbWVzLCBlYXJsaWVyIGRlc2NyaXB0aW9ucyB3aWxsIGJlIGxvc3QuIEN1cnJlbnQgYXNzdW1wdGlvbiBpcyB0aGlzXG4gICAgICogZnVuY3Rpb24gaXMgb25seSBjYWxsZWQgb25jZSBmcm9tIHRoZSBjb25maWd1cmF0aW9uIGZpbGUuIEEgZnV0dXJlXG4gICAgICogZW5oYW5jZW1lbnQgd291bGQgYmUgdG8gbWVyZ2UgZGVzY3JpcHRpb25zIGluc3RlYWQgb2YgcmVwbGFjaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhZ2Rlc2NzIFxuICAgICAqL1xuICAgIGFzeW5jIGFkZFRhZ0Rlc2NyaXB0aW9ucyh0YWdkZXNjczogVGFnRGVzY3JpcHRpb25bXSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodGFnZGVzY3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZFRhZ0Rlc2NyaXB0aW9ucyBtdXN0IGJlIGdpdmVuIGFuIGFycmF5IG9mIHRhZyBkZXNjcmlwdGlvbnNgKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGRlc2Mgb2YgdGFnZGVzY3MpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVzYy50YWdOYW1lICE9PSAnc3RyaW5nJ1xuICAgICAgICAgICAgIHx8IHR5cGVvZiBkZXNjLmRlc2NyaXB0aW9uICE9PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5jb3JyZWN0IHRhZyBkZXNjcmlwdGlvbiAke3V0aWwuaW5zcGVjdChkZXNjKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBtZXJnaW5nIHdpdGggZXhpc3RpbmcgZGVzY3JpcHRpb25zIGluc3RlYWQgb2YgcmVwbGFjaW5nXG4gICAgICAgIHRoaXMuI2Rlc2NyaXB0aW9ucyA9IHRhZ2Rlc2NzO1xuICAgIH1cblxuICAgIGFzeW5jICNzYXZlRGVzY3JpcHRpb25zVG9EQigpIHtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLiNkZXNjcmlwdGlvbnMpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRlc2Mgb2YgdGhpcy4jZGVzY3JpcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZG9jdW1lbnRzLmFkZFRhZ0Rlc2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICBkZXNjLnRhZ05hbWUsIGRlc2MuZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBEb2N1bWVudCB0aGUgVVJMIGZvciBhIHdlYnNpdGUgcHJvamVjdC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSByb290X3VybFxuICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgKi9cbiAgICByb290VVJMKHJvb3RfdXJsOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy4jcm9vdF91cmwgPSByb290X3VybDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHJvb3RfdXJsKCkgeyByZXR1cm4gdGhpcy4jcm9vdF91cmw7IH1cblxuICAgIC8qKlxuICAgICAqIFNldCBob3cgbWFueSBkb2N1bWVudHMgdG8gcmVuZGVyIGNvbmN1cnJlbnRseS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY29uY3VycmVuY3lcbiAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHNldENvbmN1cnJlbmN5KGNvbmN1cnJlbmN5OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy4jY29uY3VycmVuY3kgPSBjb25jdXJyZW5jeTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGNvbmN1cnJlbmN5KCkgeyByZXR1cm4gdGhpcy4jY29uY3VycmVuY3k7IH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdGltZSwgaW4gbWlsaXNlY29uZHMsIHRvIGhvbm9yXG4gICAgICogdGhlIFNlYXJjaENhY2hlIGluIHRoZSBzZWFyY2ggZnVuY3Rpb24uXG4gICAgICogXG4gICAgICogRGVmYXVsdCBpcyA2MDAwMCAoMSBtaW51dGUpLlxuICAgICAqIFxuICAgICAqIFNldCB0byAwIHRvIGRpc2FibGUgY2FjaGluZy5cbiAgICAgKiBAcGFyYW0gdGltZW91dCBcbiAgICAgKi9cbiAgICBzZXRDYWNoaW5nVGltZW91dCh0aW1lb3V0OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy4jY2FjaGluZ1RpbWVvdXQgPSB0aW1lb3V0O1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2V0U2VhcmNoQ2FjaGVUaW1lb3V0ICR7dGhpcy4jc2VhcmNoQ2FjaGVUaW1lb3V0fWApO1xuICAgIH1cblxuICAgIGdldCBjYWNoaW5nVGltZW91dCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHNlYXJjaENhY2hlVGltZW91dCAke3RoaXMuI3NlYXJjaENhY2hlVGltZW91dH1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2NhY2hpbmdUaW1lb3V0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlY2xhcmUgSmF2YVNjcmlwdCB0byBhZGQgd2l0aGluIHRoZSBoZWFkIHRhZyBvZiByZW5kZXJlZCBwYWdlcy5cbiAgICAgKiBAcGFyYW0gc2NyaXB0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkSGVhZGVySmF2YVNjcmlwdChzY3JpcHQ6IGphdmFTY3JpcHRJdGVtKSB7XG4gICAgICAgIHRoaXMuI3NjcmlwdHMuamF2YVNjcmlwdFRvcC5wdXNoKHNjcmlwdCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBzY3JpcHRzKCkgeyByZXR1cm4gdGhpcy4jc2NyaXB0czsgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBKYXZhU2NyaXB0IHRvIGFkZCBhdCB0aGUgYm90dG9tIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRGb290ZXJKYXZhU2NyaXB0KHNjcmlwdDogamF2YVNjcmlwdEl0ZW0pIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tLnB1c2goc2NyaXB0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBhIENTUyBTdHlsZXNoZWV0IHRvIGFkZCB3aXRoaW4gdGhlIGhlYWQgdGFnIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRTdHlsZXNoZWV0KGNzczogc3R5bGVzaGVldEl0ZW0pIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5zdHlsZXNoZWV0cy5wdXNoKGNzcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldE1haGFiaHV0YUNvbmZpZyhjaGVlcmlvPzogY2hlZXJpby5DaGVlcmlvT3B0aW9ucykge1xuICAgICAgICB0aGlzLiNjaGVlcmlvID0gY2hlZXJpbztcblxuICAgICAgICAvLyBGb3IgY2hlZXJpbyAxLjAuMC1yYy4xMCB3ZSBuZWVkIHRvIHVzZSB0aGlzIHNldHRpbmcuXG4gICAgICAgIC8vIElmIHRoZSBjb25maWd1cmF0aW9uIGhhcyBzZXQgdGhpcywgd2UgbXVzdCBub3RcbiAgICAgICAgLy8gb3ZlcnJpZGUgdGhlaXIgc2V0dGluZy4gIEJ1dCwgZ2VuZXJhbGx5LCBmb3IgY29ycmVjdFxuICAgICAgICAvLyBvcGVyYXRpb24gYW5kIGhhbmRsaW5nIG9mIE1haGFiaHV0YSB0YWdzLCB3ZSBuZWVkXG4gICAgICAgIC8vIHRoaXMgc2V0dGluZyB0byBiZSA8Y29kZT50cnVlPC9jb2RlPlxuICAgICAgICBpZiAoISgnX3VzZUh0bWxQYXJzZXIyJyBpbiB0aGlzLiNjaGVlcmlvKSkge1xuICAgICAgICAgICAgKHRoaXMuI2NoZWVyaW8gYXMgYW55KS5fdXNlSHRtbFBhcnNlcjIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpc1tfY29uZmlnX2NoZWVyaW9dKTtcbiAgICB9XG5cbiAgICBnZXQgbWFoYWJodXRhQ29uZmlnKCkgeyByZXR1cm4gdGhpcy4jY2hlZXJpbzsgfVxuXG4gICAgLyoqXG4gICAgICogQ29weSB0aGUgY29udGVudHMgb2YgYWxsIGRpcmVjdG9yaWVzIGluIGFzc2V0RGlycyB0byB0aGUgcmVuZGVyIGRlc3RpbmF0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGNvcHlBc3NldHMoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdjb3B5QXNzZXRzIFNUQVJUJyk7XG5cbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgY29uc3QgYXNzZXRzID0gZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICAvLyBGZXRjaCB0aGUgbGlzdCBvZiBhbGwgYXNzZXRzIGZpbGVzXG4gICAgICAgIGNvbnN0IHBhdGhzID0gYXdhaXQgYXNzZXRzLnBhdGhzKCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgcGF0aHNgLFxuICAgICAgICAvLyAgICAgcGF0aHMubWFwKGl0ZW0gPT4ge1xuICAgICAgICAvLyAgICAgICAgIHJldHVybiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAvLyAgICAgICAgICAgICByZW5kZXJQYXRoOiBpdGVtLnJlbmRlclBhdGgsXG4gICAgICAgIC8vICAgICAgICAgICAgIG1pbWU6IGl0ZW0ubWltZVxuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gICAgIH0pXG4gICAgICAgIC8vIClcblxuICAgICAgICAvLyBUaGUgd29yayB0YXNrIGlzIHRvIGNvcHkgZWFjaCBmaWxlXG4gICAgICAgIGNvbnN0IHF1ZXVlID0gZmFzdHEucHJvbWlzZShhc3luYyBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzICR7Y29uZmlnLnJlbmRlclRvfSAke2l0ZW0ucmVuZGVyUGF0aH1gKTtcbiAgICAgICAgICAgICAgICBsZXQgZGVzdEZOID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJUbywgaXRlbS5yZW5kZXJQYXRoKTtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKGRlc3RGTiksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIC8vIENvcHkgZnJvbSB0aGUgYWJzb2x1dGUgcGF0aG5hbWUsIHRvIHRoZSBjb21wdXRlZCBcbiAgICAgICAgICAgICAgICAvLyBsb2NhdGlvbiB3aXRoaW4gdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeVxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzICR7aXRlbS5mc3BhdGh9ID09PiAke2Rlc3RGTn1gKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AuY3AoaXRlbS5mc3BhdGgsIGRlc3RGTiwge1xuICAgICAgICAgICAgICAgICAgICBmb3JjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY29weUFzc2V0cyBGQUlMIHRvIGNvcHkgJHtpdGVtLmZzcGF0aH0gJHtpdGVtLnZwYXRofSAke2l0ZW0ucmVuZGVyUGF0aH0gJHtjb25maWcucmVuZGVyVG99IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwKTtcblxuICAgICAgICAvLyBQdXNoIHRoZSBsaXN0IG9mIGFzc2V0IGZpbGVzIGludG8gdGhlIHF1ZXVlXG4gICAgICAgIC8vIEJlY2F1c2UgcXVldWUucHVzaCByZXR1cm5zIFByb21pc2UncyB3ZSBlbmQgdXAgd2l0aFxuICAgICAgICAvLyBhbiBhcnJheSBvZiBQcm9taXNlIG9iamVjdHNcbiAgICAgICAgY29uc3Qgd2FpdEZvciA9IFtdO1xuICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBwYXRocykge1xuICAgICAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGlzIHdhaXRzIGZvciBhbGwgUHJvbWlzZSdzIHRvIGZpbmlzaFxuICAgICAgICAvLyBCdXQgaWYgdGhlcmUgd2VyZSBubyBQcm9taXNlJ3MsIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICBpZiAod2FpdEZvci5sZW5ndGggPiAwKSBhd2FpdCBQcm9taXNlLmFsbCh3YWl0Rm9yKTtcbiAgICAgICAgLy8gVGhlcmUgYXJlIG5vIHJlc3VsdHMgaW4gdGhpcyBjYXNlIHRvIGNhcmUgYWJvdXRcbiAgICAgICAgLy8gY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICAvLyBmb3IgKGxldCByZXN1bHQgb2Ygd2FpdEZvcikge1xuICAgICAgICAvLyAgICByZXN1bHRzLnB1c2goYXdhaXQgcmVzdWx0KTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGwgdGhlIGJlZm9yZVNpdGVSZW5kZXJlZCBmdW5jdGlvbiBvZiBhbnkgcGx1Z2luIHdoaWNoIGhhcyB0aGF0IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4uYmVmb3JlU2l0ZVJlbmRlcmVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBiZWZvcmVTaXRlUmVuZGVyZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uYmVmb3JlU2l0ZVJlbmRlcmVkKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsIHRoZSBvblNpdGVSZW5kZXJlZCBmdW5jdGlvbiBvZiBhbnkgcGx1Z2luIHdoaWNoIGhhcyB0aGF0IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGhvb2tTaXRlUmVuZGVyZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdob29rU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25TaXRlUmVuZGVyZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uU2l0ZVJlbmRlcmVkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uU2l0ZVJlbmRlcmVkKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZUFkZGVkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhvb2tGaWxlQWRkZWQgJHtjb2xsZWN0aW9ufSAke3ZwaW5mby52cGF0aH1gKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVBZGRlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25GaWxlQWRkZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlQWRkZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVDaGFuZ2VkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVDaGFuZ2VkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvbkZpbGVDaGFuZ2VkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUNoYW5nZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVVbmxpbmtlZChjb2xsZWN0aW9uOiBzdHJpbmcsIHZwaW5mbzogVlBhdGhEYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlVW5saW5rZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uRmlsZVVubGlua2VkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZVVubGlua2VkKGNvbmZpZywgY29sbGVjdGlvbiwgdnBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQ2FjaGVTZXR1cChjb2xsZWN0aW9ubm06IHN0cmluZywgY29sbGVjdGlvbikge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUNhY2hlU2V0dXAgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUNhY2hlU2V0dXAoY29uZmlnLCBjb2xsZWN0aW9ubm0sIGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va1BsdWdpbkNhY2hlU2V0dXAoKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25QbHVnaW5DYWNoZVNldHVwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vblBsdWdpbkNhY2hlU2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNQRUNJQUwgVFJFQVRNRU5UXG4gICAgICAgIC8vIFRoZSB0YWcgZGVzY3JpcHRpb25zIG5lZWQgdG8gYmUgaW5zdGFsbGVkXG4gICAgICAgIC8vIGluIHRoZSBkYXRhYmFzZS4gIEl0IGlzIGltcG9zc2libGUgdG8gZG9cbiAgICAgICAgLy8gdGhhdCBkdXJpbmcgQ29uZmlndXJhdGlvbiBzZXR1cCBpblxuICAgICAgICAvLyB0aGUgYWRkVGFnRGVzY3JpcHRpb25zIG1ldGhvZC5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIGFmdGVyIHRoZSBkYXRhYmFzZVxuICAgICAgICAvLyBpcyBzZXR1cC5cblxuICAgICAgICBhd2FpdCB0aGlzLiNzYXZlRGVzY3JpcHRpb25zVG9EQigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHVzZSAtIGdvIHRocm91Z2ggcGx1Z2lucyBhcnJheSwgYWRkaW5nIGVhY2ggdG8gdGhlIHBsdWdpbnMgYXJyYXkgaW5cbiAgICAgKiB0aGUgY29uZmlnIGZpbGUsIHRoZW4gY2FsbGluZyB0aGUgY29uZmlnIGZ1bmN0aW9uIG9mIGVhY2ggcGx1Z2luLlxuICAgICAqIEBwYXJhbSBQbHVnaW5PYmogVGhlIHBsdWdpbiBuYW1lIG9yIG9iamVjdCB0byBhZGRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICB1c2UoUGx1Z2luT2JqLCBvcHRpb25zKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29uZmlndXJhdGlvbiAjMSB1c2UgUGx1Z2luT2JqIFwiKyB0eXBlb2YgUGx1Z2luT2JqICtcIiBcIisgdXRpbC5pbnNwZWN0KFBsdWdpbk9iaikpO1xuICAgICAgICBpZiAodHlwZW9mIFBsdWdpbk9iaiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgZ29pbmcgdG8gZmFpbCBiZWNhdXNlXG4gICAgICAgICAgICAvLyByZXF1aXJlIGRvZXNuJ3Qgd29yayBpbiB0aGlzIGNvbnRleHRcbiAgICAgICAgICAgIC8vIEZ1cnRoZXIsIHRoaXMgY29udGV4dCBkb2VzIG5vdFxuICAgICAgICAgICAgLy8gc3VwcG9ydCBhc3luYyBmdW5jdGlvbnMsIHNvIHdlXG4gICAgICAgICAgICAvLyBjYW5ub3QgZG8gaW1wb3J0LlxuICAgICAgICAgICAgUGx1Z2luT2JqID0gcmVxdWlyZShQbHVnaW5PYmopO1xuICAgICAgICB9XG4gICAgICAgIGlmICghUGx1Z2luT2JqIHx8IFBsdWdpbk9iaiBpbnN0YW5jZW9mIFBsdWdpbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gcGx1Z2luIHN1cHBsaWVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29uZmlndXJhdGlvbiAjMiB1c2UgUGx1Z2luT2JqIFwiKyB0eXBlb2YgUGx1Z2luT2JqICtcIiBcIisgdXRpbC5pbnNwZWN0KFBsdWdpbk9iaikpO1xuICAgICAgICB2YXIgcGx1Z2luID0gbmV3IFBsdWdpbk9iaigpO1xuICAgICAgICBwbHVnaW4uYWthc2hhID0gdGhpcy5ha2FzaGE7XG4gICAgICAgIHRoaXMuI3BsdWdpbnMucHVzaChwbHVnaW4pO1xuICAgICAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgcGx1Z2luLmNvbmZpZ3VyZSh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHBsdWdpbnMoKSB7IHJldHVybiB0aGlzLiNwbHVnaW5zOyB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlIG92ZXIgdGhlIGluc3RhbGxlZCBwbHVnaW5zLCBjYWxsaW5nIHRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gYGl0ZXJhdG9yYFxuICAgICAqIGZvciBlYWNoIHBsdWdpbiwgdGhlbiBjYWxsaW5nIHRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gYGZpbmFsYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpdGVyYXRvciBUaGUgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCBwbHVnaW4uICBTaWduYXR1cmU6IGBmdW5jdGlvbihwbHVnaW4sIG5leHQpYCAgVGhlIGBuZXh0YCBwYXJhbWV0ZXIgaXMgYSBmdW5jdGlvbiB1c2VkIHRvIGluZGljYXRlIGVycm9yIC0tIGBuZXh0KGVycilgIC0tIG9yIHN1Y2Nlc3MgLS0gbmV4dCgpXG4gICAgICogQHBhcmFtIGZpbmFsIFRoZSBmdW5jdGlvbiB0byBjYWxsIGFmdGVyIGFsbCBpdGVyYXRvciBjYWxscyBoYXZlIGJlZW4gbWFkZS4gIFNpZ25hdHVyZTogYGZ1bmN0aW9uKGVycilgXG4gICAgICovXG4gICAgZWFjaFBsdWdpbihpdGVyYXRvciwgZmluYWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZWFjaFBsdWdpbiBkZXByZWNhdGVkXCIpO1xuICAgICAgICAvKiBhc3luYy5lYWNoU2VyaWVzKHRoaXMucGx1Z2lucyxcbiAgICAgICAgZnVuY3Rpb24ocGx1Z2luLCBuZXh0KSB7XG4gICAgICAgICAgICBpdGVyYXRvcihwbHVnaW4sIG5leHQpO1xuICAgICAgICB9LFxuICAgICAgICBmaW5hbCk7ICovXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9vayBmb3IgYSBwbHVnaW4sIHJldHVybmluZyBpdHMgbW9kdWxlIHJlZmVyZW5jZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAqIEByZXR1cm5zIHtQbHVnaW59XG4gICAgICovXG4gICAgcGx1Z2luKG5hbWU6IHN0cmluZykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnY29uZmlnLnBsdWdpbjogJysgdXRpbC5pbnNwZWN0KHRoaXMuX3BsdWdpbnMpKTtcbiAgICAgICAgaWYgKCEgdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHBsdWdpbktleSBpbiB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIHZhciBwbHVnaW4gPSB0aGlzLnBsdWdpbnNbcGx1Z2luS2V5XTtcbiAgICAgICAgICAgIGlmIChwbHVnaW4ubmFtZSA9PT0gbmFtZSkgcmV0dXJuIHBsdWdpbjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgV0FSTklORzogRGlkIG5vdCBmaW5kIHBsdWdpbiAke25hbWV9YCk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIHBsdWdpbkRhdGEgb2JqZWN0IGZvciB0aGUgbmFtZWQgcGx1Z2luLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgKi8gXG4gICAgcGx1Z2luRGF0YShuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdmFyIHBsdWdpbkRhdGFBcnJheSA9IHRoaXMuI3BsdWdpbkRhdGE7XG4gICAgICAgIGlmICghKG5hbWUgaW4gcGx1Z2luRGF0YUFycmF5KSkge1xuICAgICAgICAgICAgcGx1Z2luRGF0YUFycmF5W25hbWVdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBsdWdpbkRhdGFBcnJheVtuYW1lXTtcbiAgICB9XG5cbiAgICBhc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWYoaHJlZikge1xuICAgICAgICBmb3IgKHZhciBwbHVnaW4gb2YgdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5pc0xlZ2l0TG9jYWxIcmVmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGlmIChwbHVnaW4uaXNMZWdpdExvY2FsSHJlZih0aGlzLCBocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyUmVuZGVyZXIocmVuZGVyZXI6IFJlbmRlcmVyKSB7XG4gICAgICAgIGlmICghKHJlbmRlcmVyIGluc3RhbmNlb2YgUmVuZGVyZXIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdOb3QgQSBSZW5kZXJlciAnKyB1dGlsLmluc3BlY3QocmVuZGVyZXIpKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm90IGEgUmVuZGVyZXIgJHt1dGlsLmluc3BlY3QocmVuZGVyZXIpfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5maW5kUmVuZGVyZXJOYW1lKHJlbmRlcmVyLm5hbWUpKSB7XG4gICAgICAgICAgICAvLyByZW5kZXJlci5ha2FzaGEgPSB0aGlzLmFrYXNoYTtcbiAgICAgICAgICAgIC8vIHJlbmRlcmVyLmNvbmZpZyA9IHRoaXM7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVnaXN0ZXJSZW5kZXJlciBgLCByZW5kZXJlcik7XG4gICAgICAgICAgICB0aGlzLiNyZW5kZXJlcnMucmVnaXN0ZXJSZW5kZXJlcihyZW5kZXJlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGxvdyBhbiBhcHBsaWNhdGlvbiB0byBvdmVycmlkZSBvbmUgb2YgdGhlIGJ1aWx0LWluIHJlbmRlcmVyc1xuICAgICAqIHRoYXQgYXJlIGluaXRpYWxpemVkIGJlbG93LiAgVGhlIGluc3BpcmF0aW9uIGlzIGVwdWJ0b29scyB0aGF0XG4gICAgICogbXVzdCB3cml0ZSBIVE1MIGZpbGVzIHdpdGggYW4gLnhodG1sIGV4dGVuc2lvbi4gIFRoZXJlZm9yZSBpdFxuICAgICAqIGNhbiBzdWJjbGFzcyBFSlNSZW5kZXJlciBldGMgd2l0aCBpbXBsZW1lbnRhdGlvbnMgdGhhdCBmb3JjZSB0aGVcbiAgICAgKiBmaWxlIG5hbWUgdG8gYmUgLnhodG1sLiAgV2UncmUgbm90IGNoZWNraW5nIGlmIHRoZSByZW5kZXJlciBuYW1lXG4gICAgICogaXMgYWxyZWFkeSB0aGVyZSBpbiBjYXNlIGVwdWJ0b29scyBtdXN0IHVzZSB0aGUgc2FtZSByZW5kZXJlciBuYW1lLlxuICAgICAqL1xuICAgIHJlZ2lzdGVyT3ZlcnJpZGVSZW5kZXJlcihyZW5kZXJlcjogUmVuZGVyZXIpIHtcbiAgICAgICAgaWYgKCEocmVuZGVyZXIgaW5zdGFuY2VvZiBSZW5kZXJlcikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vdCBBIFJlbmRlcmVyICcrIHV0aWwuaW5zcGVjdChyZW5kZXJlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYSBSZW5kZXJlcicpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlbmRlcmVyLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICAvLyByZW5kZXJlci5jb25maWcgPSB0aGlzO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMucmVnaXN0ZXJPdmVycmlkZVJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgICB9XG5cbiAgICBmaW5kUmVuZGVyZXJOYW1lKG5hbWU6IHN0cmluZyk6IFJlbmRlcmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3JlbmRlcmVycy5maW5kUmVuZGVyZXJOYW1lKG5hbWUpO1xuICAgIH1cblxuICAgIGZpbmRSZW5kZXJlclBhdGgoX3BhdGg6IHN0cmluZyk6IFJlbmRlcmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3JlbmRlcmVycy5maW5kUmVuZGVyZXJQYXRoKF9wYXRoKTtcbiAgICB9XG5cbiAgICBnZXQgcmVuZGVyZXJzKCkgeyByZXR1cm4gdGhpcy4jcmVuZGVyZXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgUmVuZGVyZXIgYnkgaXRzIGV4dGVuc2lvbi5cbiAgICAgKi9cbiAgICBmaW5kUmVuZGVyZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRSZW5kZXJlck5hbWUobmFtZSk7XG4gICAgfVxufVxuXG5jb25zdCBtb2R1bGVfZXhwb3J0cyA9IHtcbiAgICBSZW5kZXJlcnMsXG4gICAgUmVuZGVyZXI6IFJlbmRlcmVycy5SZW5kZXJlcixcbiAgICBtYWhhYmh1dGEsXG4gICAgZmlsZWNhY2hlLFxuICAgIHNldHVwLFxuICAgIGNhY2hlU2V0dXAsXG4gICAgY2xvc2VDYWNoZXMsXG4gICAgZG9IVE1MQXR0cmlidXRlLFxuICAgIGZpbGVDYWNoZXNSZWFkeSxcbiAgICBQbHVnaW4sXG4gICAgcmVuZGVyLFxuICAgIHJlbmRlcjIsXG4gICAgcmVuZGVyRG9jdW1lbnQsXG4gICAgcmVuZGVyUGF0aCxcbiAgICByZW5kZXJQYXRoMixcbiAgICByZWFkUmVuZGVyZWRGaWxlLFxuICAgIHBhcnRpYWwsXG4gICAgcGFydGlhbFN5bmMsXG4gICAgaW5kZXhDaGFpbixcbiAgICByZWxhdGl2ZSxcbiAgICBsaW5rUmVsU2V0QXR0cixcbiAgICByZXNvbHZlVnBhdGgsXG4gICAgZ2VuZXJhdGVSU1MsXG4gICAgQ29uZmlndXJhdGlvblxufSBhcyBhbnk7XG5cbmV4cG9ydCBkZWZhdWx0IG1vZHVsZV9leHBvcnRzOyJdfQ==