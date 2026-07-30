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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBR0g7OztHQUdHO0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsNENBQTRDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFFLFVBQVUsRUFBYyxZQUFZLEVBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEtBQUssU0FBUyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsTUFBTSxFQUNGLGFBQWEsRUFDYix1QkFBdUIsRUFDMUIsR0FBRyxTQUFTLENBQUM7QUFDZCxPQUFPLEtBQUssT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUNuQyxPQUFPLFdBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXZDLGNBQWMsZ0JBQWdCLENBQUM7QUFFL0IsT0FBTyxLQUFL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YyxDQUFDLEVBQUUsQ0FBQztRQUNwQyxLQUFLLE1BQU0sSUFBSSxJQUFJLHVCQUFBLElBQUksbUNBQWMsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sU0FBUyxDQUFDLGlCQUFpQixDQUM3QixJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQ2pDLENBQUM7UUFDTixDQUFDO0lBQ0wsQ0FBQztBQUNMLENBQUM7QUF5WEwsTUFBTSxjQUFjLEdBQUc7SUFDbkIsU0FBUztJQUNULFFBQVEsRUFBRSxTQUFTLENBQUMsUUFBUTtJQUM1QixTQUFTO0lBQ1QsU0FBUztJQUNULEtBQUs7SUFDTCxVQUFVO0lBQ1YsV0FBVztJQUNYLGVBQWU7SUFDZixNQUFNO0lBQ04sTUFBTTtJQUNOLE9BQU87SUFDUCxjQUFjO0lBQ2QsVUFBVTtJQUNWLFdBQVc7SUFDWCxnQkFBZ0I7SUFDaEIsT0FBTztJQUNQLFdBQVc7SUFDWCxVQUFVO0lBQ1YsUUFBUTtJQUNSLGNBQWM7SUFDZCxZQUFZO0lBQ1osV0FBVztJQUNYLGFBQWE7Q0FDVCxDQUFDO0FBRVQsZUFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXG4vKipcbiAqIEFrYXNoYVJlbmRlclxuICogQG1vZHVsZSBha2FzaGFyZW5kZXJcbiAqL1xuXG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuLy8gY29uc3Qgb2VtYmV0dGVyID0gcmVxdWlyZSgnb2VtYmV0dGVyJykoKTtcbmltcG9ydCBSU1MgZnJvbSAncnNzJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgeyBtaW1lZGVmaW5lLCBkaXJUb01vdW50LCBpc0RpclRvTW91bnQsIFZQYXRoRGF0YSB9IGZyb20gJy4vY2FjaGUvdmZzdGFjay5qcyc7XG5leHBvcnQgdHlwZSB7IGRpclRvTW91bnQsIFZQYXRoRGF0YSB9IGZyb20gJy4vY2FjaGUvdmZzdGFjay5qcyc7XG5leHBvcnQgeyBpc0RpclRvTW91bnQgfSBmcm9tICcuL2NhY2hlL3Zmc3RhY2suanMnO1xuaW1wb3J0ICogYXMgUmVuZGVyZXJzIGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmV4cG9ydCAqIGFzIFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQgeyBSZW5kZXJlciB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmV4cG9ydCB7IFJlbmRlcmVyIH0gZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0ICogYXMgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5leHBvcnQgKiBhcyBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmNvbnN0IHtcbiAgICBQZXJmRGF0YVN0b3JlLCBcbiAgICBGaWxlc3lzdGVtUGVyZkRhdGFTdG9yZVxufSA9IG1haGFiaHV0YTtcbmltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSAnY2hlZXJpbyc7XG5pbXBvcnQgbWFoYVBhcnRpYWwgZnJvbSAnbWFoYWJodXRhL21haGEvcGFydGlhbC5qcyc7XG5pbXBvcnQgeyBlbmNvZGUgfSBmcm9tICdodG1sLWVudGl0aWVzJztcblxuZXhwb3J0ICogZnJvbSAnLi9tYWhhZnVuY3MuanMnO1xuXG5pbXBvcnQgKiBhcyByZWxhdGl2ZSBmcm9tICdyZWxhdGl2ZSc7XG5leHBvcnQgKiBhcyByZWxhdGl2ZSBmcm9tICdyZWxhdGl2ZSc7XG5cbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vUGx1Z2luLmpzJztcbmV4cG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vUGx1Z2luLmpzJztcblxuaW1wb3J0IHR5cGUgeyBUYWdEZXNjcmlwdGlvbiB9IGZyb20gJy4vdHlwZXMuanMnO1xuZXhwb3J0IHR5cGUgeyBUYWdEZXNjcmlwdGlvbiB9IGZyb20gJy4vdHlwZXMuanMnO1xuZXhwb3J0IHR5cGUge1xuICAgIFNlYXJjaE9wdGlvbnMsXG4gICAgUmVnZXhNYXRjaCxcbiAgICBTZWFyY2hGaWx0ZXJGdW5jLFxuICAgIFNlYXJjaFNvcnRGdW5jXG59IGZyb20gJy4vdHlwZXMuanMnO1xuZXhwb3J0IHsgdmFsaWRUYWdEZXNjcmlwdGlvbiB9IGZyb20gJy4vdHlwZXMuanMnO1xuXG5pbXBvcnQgeyByZW5kZXIsIHJlbmRlcjIsIHJlbmRlckRvY3VtZW50LCByZW5kZXJDb250ZW50LCByZW5kZXJEb2N1bWVudDIgfSBmcm9tICcuL3JlbmRlci5qcyc7XG5leHBvcnQgeyByZW5kZXIsIHJlbmRlcjIsIHJlbmRlckRvY3VtZW50LCByZW5kZXJEb2N1bWVudDIsIHJlbmRlckNvbnRlbnQsIGlzRG9jdW1lbnRVcFRvRGF0ZSB9IGZyb20gJy4vcmVuZGVyLmpzJztcbmV4cG9ydCB0eXBlIHsgUmVuZGVyMk9wdGlvbnMsIFJlbmRlcmluZ1Jlc3VsdHMgfSBmcm9tICcuL3JlbmRlci5qcyc7XG5cbmV4cG9ydCB7XG4gICAgU2l0ZW1hcFZhbGlkYXRvcixcbiAgICB0eXBlIFNpdGVtYXBFbnRyeSxcbiAgICB0eXBlIEVudHJ5VmFsaWRhdGlvbixcbiAgICB0eXBlIFhNTFZhbGlkYXRpb24sXG4gICAgdHlwZSBWYWxpZGF0aW9uUmVzdWx0XG59IGZyb20gJy4vc2l0ZW1hcC12YWxpZGF0b3IuanMnO1xuXG5jb25zdCBfX2ZpbGVuYW1lID0gaW1wb3J0Lm1ldGEuZmlsZW5hbWU7XG5jb25zdCBfX2Rpcm5hbWUgPSBpbXBvcnQubWV0YS5kaXJuYW1lO1xuXG4vLyBGb3IgdXNlIGluIENvbmZpZ3VyZS5wcmVwYXJlXG5pbXBvcnQgeyBCdWlsdEluUGx1Z2luIH0gZnJvbSAnLi9idWlsdC1pbi5qcyc7XG5cbmltcG9ydCAqIGFzIGZpbGVjYWNoZSBmcm9tICcuL2NhY2hlL2NhY2hlLXNxbGl0ZS5qcyc7XG5pbXBvcnQgeyBzcWRiIH0gZnJvbSAnLi9zcWRiLmpzJztcblxuZXhwb3J0IHsgbmV3U1EzRGF0YVN0b3JlIH0gZnJvbSAnLi9zcWRiLmpzJztcblxuaW1wb3J0IHsgaW5pdCB9IGZyb20gJy4vZGF0YS5qcyc7XG5cbi8vIFRoZXJlIGRvZXNuJ3Qgc2VlbSB0byBiZSBhbiBvZmZpY2lhbCBNSU1FIHR5cGUgcmVnaXN0ZXJlZFxuLy8gZm9yIEFzY2lpRG9jdG9yXG4vLyBwZXI6IGh0dHBzOi8vYXNjaWlkb2N0b3Iub3JnL2RvY3MvZmFxL1xuLy8gcGVyOiBodHRwczovL2dpdGh1Yi5jb20vYXNjaWlkb2N0b3IvYXNjaWlkb2N0b3IvaXNzdWVzLzI1MDJcbi8vXG4vLyBBcyBvZiBOb3ZlbWJlciA2LCAyMDIyLCB0aGUgQXNjaWlEb2N0b3IgRkFRIHNhaWQgdGhleSBhcmVcbi8vIGluIHRoZSBwcm9jZXNzIG9mIHJlZ2lzdGVyaW5nIGEgTUlNRSB0eXBlIGZvciBgdGV4dC9hc2NpaWRvY2AuXG4vLyBUaGUgTUlNRSB0eXBlIHdlIHN1cHBseSBoYXMgYmVlbiB1cGRhdGVkLlxuLy9cbi8vIFRoaXMgYWxzbyBzZWVtcyB0byBiZSB0cnVlIGZvciB0aGUgb3RoZXIgZmlsZSB0eXBlcy4gIFdlJ3ZlIG1hZGUgdXBcbi8vIHNvbWUgTUlNRSB0eXBlcyB0byBnbyB3aXRoIGVhY2guXG4vL1xuLy8gVGhlIE1JTUUgcGFja2FnZSBoYWQgcHJldmlvdXNseSBiZWVuIGluc3RhbGxlZCB3aXRoIEFrYXNoYVJlbmRlci5cbi8vIEJ1dCwgaXQgc2VlbXMgdG8gbm90IGJlIHVzZWQsIGFuZCBpbnN0ZWFkIHdlIGNvbXB1dGUgdGhlIE1JTUUgdHlwZVxuLy8gZm9yIGZpbGVzIGluIFN0YWNrZWQgRGlyZWN0b3JpZXMuXG4vL1xuLy8gVGhlIHJlcXVpcmVkIHRhc2sgaXMgdG8gcmVnaXN0ZXIgc29tZSBNSU1FIHR5cGVzIHdpdGggdGhlXG4vLyBNSU1FIHBhY2thZ2UuICBJdCBpc24ndCBhcHByb3ByaWF0ZSB0byBkbyB0aGlzIGluXG4vLyB0aGUgU3RhY2tlZCBEaXJlY3RvcmllcyBwYWNrYWdlLiAgSW5zdGVhZCB0aGF0J3MgbGVmdFxuLy8gZm9yIGNvZGUgd2hpY2ggdXNlcyBTdGFja2VkIERpcmVjdG9yaWVzIHRvIGRldGVybWluZSB3aGljaFxuLy8gKGlmIGFueSkgYWRkZWQgTUlNRSB0eXBlcyBhcmUgcmVxdWlyZWQuICBFcmdvLCBBa2FzaGFSZW5kZXJcbi8vIG5lZWRzIHRvIHJlZ2lzdGVyIHRoZSBNSU1FIHR5cGVzIGl0IGlzIGludGVyZXN0ZWQgaW4uXG4vLyBUaGF0J3Mgd2hhdCBpcyBoYXBwZW5pbmcgaGVyZS5cbi8vXG4vLyBUaGVyZSdzIGEgdGhvdWdodCB0aGF0IHRoaXMgc2hvdWxkIGJlIGhhbmRsZWQgaW4gdGhlIFJlbmRlcmVyXG4vLyBpbXBsZW1lbnRhdGlvbnMuICBCdXQgaXQncyBub3QgY2VydGFpbiB0aGF0J3MgY29ycmVjdC5cbi8vXG4vLyBOb3cgdGhhdCB0aGUgUmVuZGVyZXJzIGFyZSBpbiBgQGFrYXNoYWNtcy9yZW5kZXJlcnNgIHNob3VsZFxuLy8gdGhlc2UgZGVmaW5pdGlvbnMgbW92ZSB0byB0aGF0IHBhY2thZ2U/XG5cbm1pbWVkZWZpbmUoeyd0ZXh0L2FzY2lpZG9jJzogWyAnYWRvYycsICdhc2NpaWRvYycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1tYXJrZG9jJzogWyAnbWFya2RvYycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1lanMnOiBbICdlanMnXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1udW5qdWNrcyc6IFsgJ25qaycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1oYW5kbGViYXJzJzogWyAnaGFuZGxlYmFycycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1saXF1aWQnOiBbICdsaXF1aWQnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtdGVtcHVyYSc6IFsgJ3RlbXB1cmEnIF19KTtcblxuLyoqXG4gKiBQZXJmb3JtcyBzZXR1cCBvZiB0aGluZ3Mgc28gdGhhdCBBa2FzaGFSZW5kZXIgY2FuIGZ1bmN0aW9uLlxuICogVGhlIGNvcnJlY3QgaW5pdGlhbGl6YXRpb24gb2YgQWthc2hhUmVuZGVyIGlzIHRvXG4gKiAxLiBHZW5lcmF0ZSB0aGUgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAqIDIuIENhbGwgY29uZmlnLnByZXBhcmVcbiAqIDMuIENhbGwgYWthc2hhcmVuZGVyLnNldHVwXG4gKiBcbiAqIFRoaXMgZnVuY3Rpb24gZW5zdXJlcyBhbGwgb2JqZWN0cyB0aGF0IGluaXRpYWxpemUgYXN5bmNocm9ub3VzbHlcbiAqIGFyZSBjb3JyZWN0bHkgc2V0dXAuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAoY29uZmlnKSB7XG5cbiAgICBjb25maWcucmVuZGVyZXJzLnBhcnRpYWxGdW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2FsbGluZyBwYXJ0aWFsICR7Zm5hbWV9YCk7XG4gICAgICAgIHJldHVybiBwYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIGNvbmZpZy5yZW5kZXJlcnMucGFydGlhbFN5bmNGdW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2FsbGluZyBwYXJ0aWFsU3luYyAke2ZuYW1lfWApO1xuICAgICAgICByZXR1cm4gcGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG5cbiAgICBhd2FpdCBjYWNoZVNldHVwKGNvbmZpZyk7XG4gICAgYXdhaXQgZmlsZUNhY2hlc1JlYWR5KGNvbmZpZyk7XG5cbiAgICBhd2FpdCBpbml0KCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZVNldHVwKGNvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZpbGVjYWNoZS5zZXR1cChjb25maWcsIGF3YWl0IHNxZGIpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBJTklUSUFMSVpFIENBQ0hFIGAsIGVycik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZUNhY2hlcygpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBmaWxlY2FjaGUuY2xvc2VGaWxlQ2FjaGVzKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYElOSVRJQUxJWkFUSU9OIEZBSUxVUkUgQ09VTEQgTk9UIENMT1NFIENBQ0hFUyBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmlsZUNhY2hlc1JlYWR5KGNvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5pc1JlYWR5KCksXG4gICAgICAgICAgICBmaWxlY2FjaGUuYXNzZXRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLmxheW91dHNDYWNoZS5pc1JlYWR5KCksXG4gICAgICAgICAgICBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5pc1JlYWR5KClcbiAgICAgICAgXSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYElOSVRJQUxJWkFUSU9OIEZBSUxVUkUgQ09VTEQgTk9UIElOSVRJQUxJWkUgQ0FDSEUgU1lTVEVNIGAsIGVycik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJQYXRoKGNvbmZpZywgcGF0aDJyKSB7XG4gICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIGxldCBmb3VuZDtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIHdoaWxlIChjb3VudCA8IDIwKSB7XG4gICAgICAgIC8qIFdoYXQncyBoYXBwZW5pbmcgaXMgdGhpcyBtaWdodCBiZSBjYWxsZWQgZnJvbSBjbGkuanNcbiAgICAgICAgICogaW4gcmVuZGVyLWRvY3VtZW50LCBhbmQgd2UgbWlnaHQgYmUgYXNrZWQgdG8gcmVuZGVyIHRoZVxuICAgICAgICAgKiBsYXN0IGRvY3VtZW50IHRoYXQgd2lsbCBiZSBBREQnZCB0byB0aGUgRmlsZUNhY2hlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBJbiBzdWNoIGEgY2FzZSA8Y29kZT5pc1JlYWR5PC9jb2RlPiBtaWdodCByZXR1cm4gPGNvZGU+dHJ1ZTwvY29kZT5cbiAgICAgICAgICogYnV0IG5vdCBhbGwgZmlsZXMgd2lsbCBoYXZlIGJlZW4gQUREJ2QgdG8gdGhlIEZpbGVDYWNoZS5cbiAgICAgICAgICogSW4gdGhhdCBjYXNlIDxjb2RlPmRvY3VtZW50cy5maW5kPC9jb2RlPiByZXR1cm5zXG4gICAgICAgICAqIDxjb2RlPnVuZGVmaW5lZDwvY29kZT5cbiAgICAgICAgICpcbiAgICAgICAgICogV2hhdCB0aGlzIGRvZXMgaXMgdHJ5IHVwIHRvIDIwIHRpbWVzIHRvIGxvYWQgdGhlIGRvY3VtZW50LFxuICAgICAgICAgKiBzbGVlcGluZyBmb3IgMTAwIG1pbGxpc2Vjb25kcyBlYWNoIHRpbWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBjbGVhbmVyIGFsdGVybmF0aXZlIHdvdWxkIGJlIHRvIHdhaXQgZm9yIG5vdCBvbmx5XG4gICAgICAgICAqIHRoZSA8Y29kZT5yZWFkeTwvY29kZT4gZnJvbSB0aGUgPGNvZGU+ZG9jdW1lbnRzPC9jb2RlPiBGaWxlQ2FjaGUsXG4gICAgICAgICAqIGJ1dCBhbHNvIGZvciBhbGwgdGhlIGluaXRpYWwgQUREIGV2ZW50cyB0byBiZSBoYW5kbGVkLiAgQnV0XG4gICAgICAgICAqIHRoYXQgc2Vjb25kIGNvbmRpdGlvbiBzZWVtcyBkaWZmaWN1bHQgdG8gZGV0ZWN0IHJlbGlhYmx5LlxuICAgICAgICAgKi9cbiAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChwYXRoMnIpO1xuICAgICAgICBpZiAoZm91bmQpIGJyZWFrO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyUGF0aCAke3BhdGgycn1gLCBmb3VuZCk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgZmluZCBkb2N1bWVudCBmb3IgJHtwYXRoMnJ9YCk7XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudChjb25maWcsIGZvdW5kKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyUGF0aDIoY29uZmlnLCBwYXRoMnIpIHtcbiAgICBjb25zdCBkb2N1bWVudHMgPSBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgbGV0IGZvdW5kO1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgd2hpbGUgKGNvdW50IDwgMjApIHtcbiAgICAgICAgLyogV2hhdCdzIGhhcHBlbmluZyBpcyB0aGlzIG1pZ2h0IGJlIGNhbGxlZCBmcm9tIGNsaS5qc1xuICAgICAgICAgKiBpbiByZW5kZXItZG9jdW1lbnQsIGFuZCB3ZSBtaWdodCBiZSBhc2tlZCB0byByZW5kZXIgdGhlXG4gICAgICAgICAqIGxhc3QgZG9jdW1lbnQgdGhhdCB3aWxsIGJlIEFERCdkIHRvIHRoZSBGaWxlQ2FjaGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEluIHN1Y2ggYSBjYXNlIDxjb2RlPmlzUmVhZHk8L2NvZGU+IG1pZ2h0IHJldHVybiA8Y29kZT50cnVlPC9jb2RlPlxuICAgICAgICAgKiBidXQgbm90IGFsbCBmaWxlcyB3aWxsIGhhdmUgYmVlbiBBREQnZCB0byB0aGUgRmlsZUNhY2hlLlxuICAgICAgICAgKiBJbiB0aGF0IGNhc2UgPGNvZGU+ZG9jdW1lbnRzLmZpbmQ8L2NvZGU+IHJldHVybnNcbiAgICAgICAgICogPGNvZGU+dW5kZWZpbmVkPC9jb2RlPlxuICAgICAgICAgKlxuICAgICAgICAgKiBXaGF0IHRoaXMgZG9lcyBpcyB0cnkgdXAgdG8gMjAgdGltZXMgdG8gbG9hZCB0aGUgZG9jdW1lbnQsXG4gICAgICAgICAqIHNsZWVwaW5nIGZvciAxMDAgbWlsbGlzZWNvbmRzIGVhY2ggdGltZS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNsZWFuZXIgYWx0ZXJuYXRpdmUgd291bGQgYmUgdG8gd2FpdCBmb3Igbm90IG9ubHlcbiAgICAgICAgICogdGhlIDxjb2RlPnJlYWR5PC9jb2RlPiBmcm9tIHRoZSA8Y29kZT5kb2N1bWVudHM8L2NvZGU+IEZpbGVDYWNoZSxcbiAgICAgICAgICogYnV0IGFsc28gZm9yIGFsbCB0aGUgaW5pdGlhbCBBREQgZXZlbnRzIHRvIGJlIGhhbmRsZWQuICBCdXRcbiAgICAgICAgICogdGhhdCBzZWNvbmQgY29uZGl0aW9uIHNlZW1zIGRpZmZpY3VsdCB0byBkZXRlY3QgcmVsaWFibHkuXG4gICAgICAgICAqL1xuICAgICAgICBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHBhdGgycik7XG4gICAgICAgIGlmIChmb3VuZCkgYnJlYWs7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJQYXRoICR7cGF0aDJyfWAsIGZvdW5kKTtcbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRGlkIG5vdCBmaW5kIGRvY3VtZW50IGZvciAke3BhdGgycn1gKTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckRvY3VtZW50Mihjb25maWcsIGZvdW5kKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFJlYWRzIGEgZmlsZSBmcm9tIHRoZSByZW5kZXJpbmcgZGlyZWN0b3J5LiAgSXQgaXMgcHJpbWFyaWx5IHRvIGJlXG4gKiB1c2VkIGluIHRlc3QgY2FzZXMsIHdoZXJlIHdlJ2xsIHJ1biBhIGJ1aWxkIHRoZW4gcmVhZCB0aGUgaW5kaXZpZHVhbFxuICogZmlsZXMgdG8gbWFrZSBzdXJlIHRoZXkndmUgcmVuZGVyZWQgY29ycmVjdGx5LlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBcbiAqIEBwYXJhbSB7Kn0gZnBhdGggXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRSZW5kZXJlZEZpbGUoY29uZmlnLCBmcGF0aCkge1xuXG4gICAgbGV0IGh0bWwgPSBhd2FpdCBmc3AucmVhZEZpbGUocGF0aC5qb2luKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgZnBhdGgpLCAndXRmOCcpO1xuICAgIGxldCAkID0gY29uZmlnLm1haGFiaHV0YUNvbmZpZyBcbiAgICAgICAgICAgID8gY2hlZXJpby5sb2FkKGh0bWwsIGNvbmZpZy5tYWhhYmh1dGFDb25maWcpIFxuICAgICAgICAgICAgOiBjaGVlcmlvLmxvYWQoaHRtbCk7XG5cbiAgICByZXR1cm4geyBodG1sLCAkIH07XG59XG5cbi8qKlxuICogUmVuZGVycyBhIHBhcnRpYWwgdGVtcGxhdGUgdXNpbmcgdGhlIHN1cHBsaWVkIG1ldGFkYXRhLiAgVGhpcyB2ZXJzaW9uXG4gKiBhbGxvd3MgZm9yIGFzeW5jaHJvbm91cyBleGVjdXRpb24sIGFuZCBldmVyeSBiaXQgb2YgY29kZSBpdFxuICogZXhlY3V0ZXMgaXMgYWxsb3dlZCB0byBiZSBhc3luYy5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiBAcGFyYW0geyp9IGZuYW1lIFBhdGggd2l0aGluIHRoZSBmaWxlY2FjaGUucGFydGlhbHMgY2FjaGVcbiAqIEBwYXJhbSB7Kn0gbWV0YWRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgbWV0YWRhdGFcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhIHN0cmluZyBjb250YWluaW5nIHRoZSByZW5kZXJlZCBzdHVmZlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSkge1xuXG4gICAgaWYgKCFmbmFtZSB8fCB0eXBlb2YgZm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcGFydGlhbCBmbmFtZSBub3QgYSBzdHJpbmcgJHt1dGlsLmluc3BlY3QoZm5hbWUpfWApO1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsICR7Zm5hbWV9YCk7XG4gICAgY29uc3QgZm91bmQgPSBhd2FpdCBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5maW5kKGZuYW1lKTtcbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcGFydGlhbCBmb3VuZCBmb3IgJHtmbmFtZX0gaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLnBhcnRpYWxzRGlycyl9YCk7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsICR7Zm5hbWV9ID09PiAke2ZvdW5kLnZwYXRofSAke2ZvdW5kLmZzcGF0aH1gKTtcbiAgICBcbiAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgYWJvdXQgdG8gcmVuZGVyICR7dXRpbC5pbnNwZWN0KGZvdW5kLnZwYXRoKX1gKTtcbiAgICAgICAgbGV0IHBhcnRpYWxUZXh0O1xuICAgICAgICBpZiAoZm91bmQuZG9jQm9keSkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NCb2R5O1xuICAgICAgICBlbHNlIGlmIChmb3VuZC5kb2NCb2R5KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0JvZHk7XG4gICAgICAgIGVsc2UgcGFydGlhbFRleHQgPSBhd2FpdCBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuXG4gICAgICAgIC8vIFNvbWUgcmVuZGVyZXJzIChOdW5qdWtzKSByZXF1aXJlIHRoYXQgbWV0YWRhdGEuY29uZmlnXG4gICAgICAgIC8vIHBvaW50IHRvIHRoZSBjb25maWcgb2JqZWN0LiAgVGhpcyBibG9jayBvZiBjb2RlXG4gICAgICAgIC8vIGR1cGxpY2F0ZXMgdGhlIG1ldGFkYXRhIG9iamVjdCwgdGhlbiBzZXRzIHRoZVxuICAgICAgICAvLyBjb25maWcgZmllbGQgaW4gdGhlIGR1cGxpY2F0ZSwgcGFzc2luZyB0aGF0IHRvIHRoZSBwYXJ0aWFsLlxuICAgICAgICBsZXQgbWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBsZXQgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gbWV0YWRhdGEpIHtcbiAgICAgICAgICAgIG1kYXRhW3Byb3BdID0gbWV0YWRhdGFbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgbWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICBtZGF0YS5wYXJ0aWFsU3luYyA9IHBhcnRpYWxTeW5jLmJpbmQocmVuZGVyZXIsIGNvbmZpZyk7XG4gICAgICAgIG1kYXRhLnBhcnRpYWwgICAgID0gcGFydGlhbC5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbC1mdW5jcyByZW5kZXIgJHtyZW5kZXJlci5uYW1lfSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gcmVuZGVyZXIucmVuZGVyKHtcbiAgICAgICAgICAgIGZzcGF0aDogZm91bmQuZnNwYXRoLFxuICAgICAgICAgICAgY29udGVudDogcGFydGlhbFRleHQsXG4gICAgICAgICAgICBtZXRhZGF0YTogbWRhdGFcbiAgICAgICAgICAgIC8vIHBhcnRpYWxUZXh0LCBtZGF0YSwgZm91bmRcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChmb3VuZC52cGF0aC5lbmRzV2l0aCgnLmh0bWwnKSB8fCBmb3VuZC52cGF0aC5lbmRzV2l0aCgnLnhodG1sJykpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgcmVhZGluZyBmaWxlICR7Zm91bmQudnBhdGh9YCk7XG4gICAgICAgIHJldHVybiBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVuZGVyUGFydGlhbCBubyBSZW5kZXJlciBmb3VuZCBmb3IgJHtmbmFtZX0gLSAke2ZvdW5kLnZwYXRofWApO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgcGFydGlhbCB0ZW1wbGF0ZSB1c2luZyB0aGUgc3VwcGxpZWQgbWV0YWRhdGEuICBUaGlzIHZlcnNpb25cbiAqIGFsbG93cyBmb3Igc3luY2hyb25vdXMgZXhlY3V0aW9uLCBhbmQgZXZlcnkgYml0IG9mIGNvZGUgaXRcbiAqIGV4ZWN1dGVzIGlzIHN5bmNocm9ub3VzIGZ1bmN0aW9ucy5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiBAcGFyYW0geyp9IGZuYW1lIFBhdGggd2l0aGluIHRoZSBmaWxlY2FjaGUucGFydGlhbHMgY2FjaGVcbiAqIEBwYXJhbSB7Kn0gbWV0YWRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgbWV0YWRhdGFcbiAqIEByZXR1cm5zIFN0cmluZyBjb250YWluaW5nIHRoZSByZW5kZXJlZCBzdHVmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpIHtcblxuICAgIGlmICghZm5hbWUgfHwgdHlwZW9mIGZuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHBhcnRpYWxTeW5jIGZuYW1lIG5vdCBhIHN0cmluZyAke3V0aWwuaW5zcGVjdChmbmFtZSl9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgZm91bmQgPSBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5maW5kU3luYyhmbmFtZSk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHBhcnRpYWwgZm91bmQgZm9yICR7Zm5hbWV9IGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5wYXJ0aWFsc0RpcnMpfWApO1xuICAgIH1cblxuICAgIHZhciByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgLy8gU29tZSByZW5kZXJlcnMgKE51bmp1a3MpIHJlcXVpcmUgdGhhdCBtZXRhZGF0YS5jb25maWdcbiAgICAgICAgLy8gcG9pbnQgdG8gdGhlIGNvbmZpZyBvYmplY3QuICBUaGlzIGJsb2NrIG9mIGNvZGVcbiAgICAgICAgLy8gZHVwbGljYXRlcyB0aGUgbWV0YWRhdGEgb2JqZWN0LCB0aGVuIHNldHMgdGhlXG4gICAgICAgIC8vIGNvbmZpZyBmaWVsZCBpbiB0aGUgZHVwbGljYXRlLCBwYXNzaW5nIHRoYXQgdG8gdGhlIHBhcnRpYWwuXG4gICAgICAgIGxldCBtZGF0YTogYW55ID0ge307XG4gICAgICAgIGxldCBwcm9wO1xuXG4gICAgICAgIGZvciAocHJvcCBpbiBtZXRhZGF0YSkge1xuICAgICAgICAgICAgbWRhdGFbcHJvcF0gPSBtZXRhZGF0YVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBtZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgICAgIC8vIEluIHRoaXMgY29udGV4dCwgcGFydGlhbFN5bmMgaXMgZGlyZWN0bHkgYXZhaWxhYmxlXG4gICAgICAgIC8vIGFzIGEgZnVuY3Rpb24gdGhhdCB3ZSBjYW4gZGlyZWN0bHkgdXNlLlxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbFN5bmMgYCwgcGFydGlhbFN5bmMpO1xuICAgICAgICBtZGF0YS5wYXJ0aWFsU3luYyA9IHBhcnRpYWxTeW5jLmJpbmQocmVuZGVyZXIsIGNvbmZpZyk7XG4gICAgICAgIC8vIGZvciBmaW5kU3luYywgdGhlIFwiZm91bmRcIiBvYmplY3QgaXMgVlBhdGhEYXRhIHdoaWNoXG4gICAgICAgIC8vIGRvZXMgbm90IGhhdmUgZG9jQm9keSBub3IgZG9jQ29udGVudC4gIFRoZXJlZm9yZSB3ZVxuICAgICAgICAvLyBtdXN0IHJlYWQgdGhpcyBjb250ZW50XG4gICAgICAgIGxldCBwYXJ0aWFsVGV4dCA9IGZzLnJlYWRGaWxlU3luYyhmb3VuZC5mc3BhdGgsICd1dGYtOCcpO1xuICAgICAgICAvLyBpZiAoZm91bmQuZG9jQm9keSkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NCb2R5O1xuICAgICAgICAvLyBlbHNlIGlmIChmb3VuZC5kb2NDb250ZW50KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0NvbnRlbnQ7XG4gICAgICAgIC8vIGVsc2UgcGFydGlhbFRleHQgPSBmcy5yZWFkRmlsZVN5bmMoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgICAgICBcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwtZnVuY3MgcmVuZGVyU3luYyAke3JlbmRlcmVyLm5hbWV9ICR7Zm91bmQudnBhdGh9YCk7XG4gICAgICAgIHJldHVybiByZW5kZXJlci5yZW5kZXJTeW5jKDxSZW5kZXJlcnMuUmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgICAgICBmc3BhdGg6IGZvdW5kLmZzcGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IHBhcnRpYWxUZXh0LFxuICAgICAgICAgICAgbWV0YWRhdGE6IG1kYXRhXG4gICAgICAgICAgICAvLyBwYXJ0aWFsVGV4dCwgbWRhdGEsIGZvdW5kXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZm91bmQudnBhdGguZW5kc1dpdGgoJy5odG1sJykgfHwgZm91bmQudnBhdGguZW5kc1dpdGgoJy54aHRtbCcpKSB7XG4gICAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVuZGVyUGFydGlhbCBubyBSZW5kZXJlciBmb3VuZCBmb3IgJHtmbmFtZX0gLSAke2ZvdW5kLnZwYXRofWApO1xuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgaW5kZXhDaGFpbkl0ZW0gPSB7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICB2cGF0aDogc3RyaW5nO1xuICAgIGZvdW5kUGF0aDogc3RyaW5nO1xuICAgIGZvdW5kRGlyOiBzdHJpbmc7XG4gICAgZmlsZW5hbWU6IHN0cmluZztcbn07XG5cbi8qKlxuICogU3RhcnRpbmcgZnJvbSBhIHZpcnR1YWwgcGF0aCBpbiB0aGUgZG9jdW1lbnRzLCBzZWFyY2hlcyB1cHdhcmRzIHRvXG4gKiB0aGUgcm9vdCBvZiB0aGUgZG9jdW1lbnRzIGZpbGUtc3BhY2UsIGZpbmRpbmcgZmlsZXMgdGhhdCBcbiAqIHJlbmRlciB0byBcImluZGV4Lmh0bWxcIi4gIFRoZSBcImluZGV4Lmh0bWxcIiBmaWxlcyBhcmUgaW5kZXggZmlsZXMsXG4gKiBhcyB0aGUgbmFtZSBzdWdnZXN0cy5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKiBAcGFyYW0geyp9IGZuYW1lIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbmRleENoYWluKFxuICAgIGNvbmZpZywgZm5hbWVcbik6IFByb21pc2U8aW5kZXhDaGFpbkl0ZW1bXT4ge1xuXG4gICAgLy8gVGhpcyB1c2VkIHRvIGJlIGEgZnVsbCBmdW5jdGlvbiBoZXJlLCBidXQgaGFzIG1vdmVkXG4gICAgLy8gaW50byB0aGUgRmlsZUNhY2hlIGNsYXNzLiAgUmVxdWlyaW5nIGEgYGNvbmZpZ2Agb3B0aW9uXG4gICAgLy8gaXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggdGhlIGZvcm1lciBBUEkuXG5cbiAgICBjb25zdCBkb2N1bWVudHMgPSBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgcmV0dXJuIGRvY3VtZW50cy5pbmRleENoYWluKGZuYW1lKTtcbn1cblxuXG4vKipcbiAqIE1hbmlwdWxhdGUgdGhlIHJlbD0gYXR0cmlidXRlcyBvbiBhIGxpbmsgcmV0dXJuZWQgZnJvbSBNYWhhYmh1dGEuXG4gKlxuICogQHBhcmFtcyB7JGxpbmt9IFRoZSBsaW5rIHRvIG1hbmlwdWxhdGVcbiAqIEBwYXJhbXMge2F0dHJ9IFRoZSBhdHRyaWJ1dGUgbmFtZVxuICogQHBhcmFtcyB7ZG9hdHRyfSBCb29sZWFuIGZsYWcgd2hldGhlciB0byBzZXQgKHRydWUpIG9yIHJlbW92ZSAoZmFsc2UpIHRoZSBhdHRyaWJ1dGVcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW5rUmVsU2V0QXR0cigkbGluaywgYXR0ciwgZG9hdHRyKSB7XG4gICAgbGV0IGxpbmtyZWwgPSAkbGluay5hdHRyKCdyZWwnKTtcbiAgICBsZXQgcmVscyA9IGxpbmtyZWwgPyBsaW5rcmVsLnNwbGl0KCcgJykgOiBbXTtcbiAgICBsZXQgaGFzYXR0ciA9IHJlbHMuaW5kZXhPZihhdHRyKSA+PSAwO1xuICAgIGlmICghaGFzYXR0ciAmJiBkb2F0dHIpIHtcbiAgICAgICAgcmVscy51bnNoaWZ0KGF0dHIpO1xuICAgICAgICAkbGluay5hdHRyKCdyZWwnLCByZWxzLmpvaW4oJyAnKSk7XG4gICAgfSBlbHNlIGlmIChoYXNhdHRyICYmICFkb2F0dHIpIHtcbiAgICAgICAgcmVscy5zcGxpY2UocmVscy5pbmRleE9mKGF0dHIpKTtcbiAgICAgICAgJGxpbmsuYXR0cigncmVsJywgcmVscy5qb2luKCcgJykpO1xuICAgIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBzdHJpbmcgb2YgYW4gSFRNTCBhdHRyaWJ1dGUsIHdoZXJlIHRoZSB2YWx1ZSBwb3J0aW9uXG4gKiBpcyBwcm9wZXJseSBlbmNvZGVkIHRvIGRlZmFuZyBhbnkgcG90ZW50aWFsIGF0dGFja3MuXG4gKlxuICogQHBhcmFtIG5hbWVcbiAqIEBwYXJhbSB2YWx1ZVxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRvSFRNTEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgID8gYCAke25hbWV9PVwiJHtlbmNvZGUodmFsdWUpfVwiYFxuICAgICAgICA6ICcnO1xufTtcblxuLyoqXG4gKiBDb21wdXRlIGFuIGFic29sdXRlIHZwYXRoIGZyb20gYSByZWxhdGl2ZSBwYXRoIHJlZmVyZW5jZS5cbiAqIFxuICogVGhpcyBmdW5jdGlvbiByZXNvbHZlcyBhIHJlbGF0aXZlIHBhdGggKGxpa2UgXCIuLi9maWxlLmh0bWxcIiBvciBcIi4vZmlsZS5odG1sXCIpXG4gKiB0byBhbiBhYnNvbHV0ZSB2cGF0aCBpbiB0aGUgdmlydHVhbCBmaWxlc3lzdGVtLCBiYXNlZCBvbiB0aGUgdnBhdGggb2YgdGhlXG4gKiBjdXJyZW50IGRvY3VtZW50LlxuICogXG4gKiBJZiB0aGUgaW5wdXQgcGF0aCBpcyBhbHJlYWR5IGFic29sdXRlIChzdGFydHMgd2l0aCAnLycpLCBpdCBpcyByZXR1cm5lZFxuICogYXMtaXMgYWZ0ZXIgbm9ybWFsaXphdGlvbi5cbiAqIFxuICogQHBhcmFtIGJhc2VWcGF0aCBUaGUgdnBhdGggb2YgdGhlIGRvY3VtZW50IG1ha2luZyB0aGUgcmVmZXJlbmNlIChlLmcuLCBtZXRhZGF0YS5kb2N1bWVudC5wYXRoKVxuICogQHBhcmFtIHJlbGF0aXZlUGF0aCBUaGUgcGF0aCB0byByZXNvbHZlIChjYW4gYmUgcmVsYXRpdmUgb3IgYWJzb2x1dGUpXG4gKiBAcmV0dXJucyBUaGUgYWJzb2x1dGUgdnBhdGggaW4gdGhlIHZpcnR1YWwgZmlsZXN5c3RlbVxuICogXG4gKiBAZXhhbXBsZVxuICogLy8gRnJvbSBkb2N1bWVudCBhdCAnaGllci9kaXIxL3BhZ2UuaHRtbC5tZCcgcmVmZXJlbmNpbmcgJy4uL3NpYmxpbmcvZmlsZS5odG1sJ1xuICogcmVzb2x2ZVZwYXRoKCdoaWVyL2RpcjEvcGFnZS5odG1sLm1kJywgJy4uL3NpYmxpbmcvZmlsZS5odG1sJylcbiAqIC8vIFJldHVybnM6ICcvaGllci9zaWJsaW5nL2ZpbGUuaHRtbCdcbiAqIFxuICogQGV4YW1wbGVcbiAqIC8vIEFscmVhZHkgYWJzb2x1dGUgcGF0aFxuICogcmVzb2x2ZVZwYXRoKCdoaWVyL2RpcjEvcGFnZS5odG1sLm1kJywgJy9hYnNvbHV0ZS9wYXRoLmh0bWwnKVxuICogLy8gUmV0dXJuczogJy9hYnNvbHV0ZS9wYXRoLmh0bWwnXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlVnBhdGgoYmFzZVZwYXRoOiBzdHJpbmcsIHJlbGF0aXZlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIWJhc2VWcGF0aCB8fCB0eXBlb2YgYmFzZVZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlc29sdmVWcGF0aDogYmFzZVZwYXRoIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLCBnb3QgJHt0eXBlb2YgYmFzZVZwYXRofWApO1xuICAgIH1cbiAgICBpZiAoIXJlbGF0aXZlUGF0aCB8fCB0eXBlb2YgcmVsYXRpdmVQYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlc29sdmVWcGF0aDogcmVsYXRpdmVQYXRoIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLCBnb3QgJHt0eXBlb2YgcmVsYXRpdmVQYXRofWApO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBwYXRoIGlzIGFscmVhZHkgYWJzb2x1dGUsIHJldHVybiBpdCBub3JtYWxpemVkXG4gICAgaWYgKHBhdGguaXNBYnNvbHV0ZShyZWxhdGl2ZVBhdGgpKSB7XG4gICAgICAgIHJldHVybiBwYXRoLm5vcm1hbGl6ZShyZWxhdGl2ZVBhdGgpO1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgZGlyZWN0b3J5IG9mIHRoZSBiYXNlIHZwYXRoXG4gICAgY29uc3QgZGlyID0gcGF0aC5kaXJuYW1lKGJhc2VWcGF0aCk7XG4gICAgXG4gICAgLy8gSm9pbiB3aXRoICcvJyBwcmVmaXggdG8gZW5zdXJlIHdlIGdldCBhbiBhYnNvbHV0ZSB2cGF0aFxuICAgIC8vIGFuZCBub3JtYWxpemUgdG8gY2xlYW4gdXAgYW55IC4uIG9yIC4gc2VnbWVudHNcbiAgICByZXR1cm4gcGF0aC5ub3JtYWxpemUocGF0aC5qb2luKCcvJywgZGlyLCByZWxhdGl2ZVBhdGgpKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8gUlNTIEZlZWQgR2VuZXJhdGlvblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVSU1MoY29uZmlnLCBjb25maWdyc3MsIGZlZWREYXRhLCBpdGVtcywgcmVuZGVyVG8pIHtcblxuICAgIC8vIFN1cHBvc2VkbHkgaXQncyByZXF1aXJlZCB0byB1c2UgaGFzT3duUHJvcGVydHlcbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzcyODM2MC9ob3ctZG8taS1jb3JyZWN0bHktY2xvbmUtYS1qYXZhc2NyaXB0LW9iamVjdCM3Mjg2OTRcbiAgICAvL1xuICAgIC8vIEJ1dCwgaW4gb3VyIGNhc2UgdGhhdCByZXN1bHRlZCBpbiBhbiBlbXB0eSBvYmplY3RcblxuICAgIC8vIGNvbnNvbGUubG9nKCdjb25maWdyc3MgJysgdXRpbC5pbnNwZWN0KGNvbmZpZ3JzcykpO1xuXG4gICAgLy8gQ29uc3RydWN0IGluaXRpYWwgcnNzIG9iamVjdFxuICAgIHZhciByc3MgPSB7fTtcbiAgICBmb3IgKGxldCBrZXkgaW4gY29uZmlncnNzLnJzcykge1xuICAgICAgICAvL2lmIChjb25maWdyc3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcnNzW2tleV0gPSBjb25maWdyc3MucnNzW2tleV07XG4gICAgICAgIC8vfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKCdyc3MgJysgdXRpbC5pbnNwZWN0KHJzcykpO1xuXG4gICAgLy8gY29uc29sZS5sb2coJ2ZlZWREYXRhICcrIHV0aWwuaW5zcGVjdChmZWVkRGF0YSkpO1xuXG4gICAgLy8gVGhlbiBmaWxsIGluIGZyb20gZmVlZERhdGFcbiAgICBmb3IgKGxldCBrZXkgaW4gZmVlZERhdGEpIHtcbiAgICAgICAgLy9pZiAoZmVlZERhdGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcnNzW2tleV0gPSBmZWVkRGF0YVtrZXldO1xuICAgICAgICAvL31cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZygnZ2VuZXJhdGVSU1MgcnNzICcrIHV0aWwuaW5zcGVjdChyc3MpKTtcblxuICAgIHZhciByc3NmZWVkID0gbmV3IFJTUyhyc3MpO1xuXG4gICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7IHJzc2ZlZWQuaXRlbShpdGVtKTsgfSk7XG5cbiAgICB2YXIgeG1sID0gcnNzZmVlZC54bWwoKTtcbiAgICB2YXIgcmVuZGVyT3V0ID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgcmVuZGVyVG8pO1xuXG4gICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJPdXQpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxuICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyT3V0LCB4bWwsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcblxufTtcblxuLy8gRm9yIG9FbWJlZCwgQ29uc2lkZXIgbWFraW5nIGFuIGV4dGVybmFsIHBsdWdpblxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvb2VtYmVkLWFsbFxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvZW1iZWRhYmxlXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9tZWRpYS1wYXJzZXJcbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL29lbWJldHRlclxuXG5cbi8qKlxuICogVGhlIEFrYXNoYVJlbmRlciBwcm9qZWN0IGNvbmZpZ3VyYXRpb24gb2JqZWN0LiAgXG4gKiBPbmUgaW5zdGFudGlhdGVzIGEgQ29uZmlndXJhdGlvbiBvYmplY3QsIHRoZW4gZmlsbHMgaXRcbiAqIHdpdGggc2V0dGluZ3MgYW5kIHBsdWdpbnMuXG4gKiBcbiAqIEBzZWUgbW9kdWxlOkNvbmZpZ3VyYXRpb25cbiAqL1xuXG4vLyBjb25zdCBfY29uZmlnX3BsdWdpbkRhdGEgPSBTeW1ib2woJ3BsdWdpbkRhdGEnKTtcbi8vIGNvbnN0IF9jb25maWdfYXNzZXRzRGlycyA9IFN5bWJvbCgnYXNzZXRzRGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19kb2N1bWVudERpcnMgPSBTeW1ib2woJ2RvY3VtZW50RGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19sYXlvdXREaXJzID0gU3ltYm9sKCdsYXlvdXREaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX3BhcnRpYWxEaXJzID0gU3ltYm9sKCdwYXJ0aWFsRGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19tYWhhZnVuY3MgPSBTeW1ib2woJ21haGFmdW5jcycpO1xuLy8gY29uc3QgX2NvbmZpZ19yZW5kZXJUbyA9IFN5bWJvbCgncmVuZGVyVG8nKTtcbi8vIGNvbnN0IF9jb25maWdfbWV0YWRhdGEgPSBTeW1ib2woJ21ldGFkYXRhJyk7XG4vLyBjb25zdCBfY29uZmlnX3Jvb3RfdXJsID0gU3ltYm9sKCdyb290X3VybCcpO1xuLy8gY29uc3QgX2NvbmZpZ19zY3JpcHRzID0gU3ltYm9sKCdzY3JpcHRzJyk7XG4vLyBjb25zdCBfY29uZmlnX3BsdWdpbnMgPSBTeW1ib2woJ3BsdWdpbnMnKTtcbi8vIGNvbnN0IF9jb25maWdfY2hlZXJpbyA9IFN5bWJvbCgnY2hlZXJpbycpO1xuLy8gY29uc3QgX2NvbmZpZ19jb25maWdkaXIgPSBTeW1ib2woJ2NvbmZpZ2RpcicpO1xuLy8gY29uc3QgX2NvbmZpZ19jYWNoZWRpciAgPSBTeW1ib2woJ2NhY2hlZGlyJyk7XG4vLyBjb25zdCBfY29uZmlnX2NvbmN1cnJlbmN5ID0gU3ltYm9sKCdjb25jdXJyZW5jeScpO1xuLy8gY29uc3QgX2NvbmZpZ19yZW5kZXJlcnMgPSBTeW1ib2woJ3JlbmRlcmVycycpO1xuXG4vKipcbiAqIERhdGEgdHlwZSBkZXNjcmliaW5nIGl0ZW1zIGluIHRoZVxuICogamF2YVNjcmlwdFRvcCBhbmQgamF2YVNjcmlwdEJvdHRvbSBhcnJheXMuXG4gKiBUaGUgZmllbGRzIGNvcnJlc3BvbmQgdG8gdGhlIGF0dHJpYnV0ZXNcbiAqIG9mIHRoZSA8c2NyaXB0PiB0YWcgd2hpY2ggY2FuIGJlIHVzZWRcbiAqIGVpdGhlciBpbiB0aGUgdG9wIG9yIGJvdHRvbSBvZlxuICogYW4gSFRNTCBmaWxlLlxuICovXG5leHBvcnQgdHlwZSBqYXZhU2NyaXB0SXRlbSA9IHtcbiAgICBocmVmPzogc3RyaW5nLFxuICAgIHNjcmlwdD86IHN0cmluZyxcbiAgICBsYW5nPzogc3RyaW5nXG59O1xuXG5leHBvcnQgdHlwZSBzdHlsZXNoZWV0SXRlbSA9IHtcbiAgICBocmVmPzogc3RyaW5nLFxuICAgIG1lZGlhPzogc3RyaW5nXG5cbn07XG5cbi8qKlxuICogRGVmaW5lcyB0aGUgc3RydWN0dXJlIGZvciBkaXJlY3RvcnlcbiAqIG1vdW50IHNwZWNpZmljYXRpb24gaW4gdGhlIENvbmZpZ3VyYXRpb24uXG4gKiBcbiAqIFRoZSBzaW1wbGUgJ3N0cmluZycgZm9ybSBzYXlzIHRvIG1vdW50XG4gKiB0aGUgbmFtZWQgZnNwYXRoIG9uIHRoZSByb290IG9mIHRoZVxuICogdmlydHVhbCBmaWxlc3BhY2UuXG4gKiBcbiAqIFRoZSBvYmplY3QgZm9ybSBhbGxvd3MgdXMgdG8gbW91bnRcbiAqIGFuIGZzcGF0aCBpbnRvIGEgZGlmZmVyZW50IGxvY2F0aW9uXG4gKiBpbiB0aGUgdmlydHVhbCBmaWxlc3BhY2UsIHRvIGlnbm9yZVxuICogZmlsZXMgYmFzZWQgb24gR0xPQiBwYXR0ZXJucywgYW5kIHRvXG4gKiBpbmNsdWRlIG1ldGFkYXRhIGZvciBldmVyeSBmaWxlIGluXG4gKiBhIGRpcmVjdG9yeSB0cmVlLlxuICogXG4gKiBJbiB0aGUgZmlsZS1jYWNoZSBtb2R1bGUsIHRoaXMgaXNcbiAqIGNvbnZlcnRlZCB0byB0aGUgZGlyVG9XYXRjaCBzdHJ1Y3R1cmVcbiAqIHVzZWQgYnkgU3RhY2tlZERpcnMuXG4gKi9cbi8qKlxuICogQ29uZmlndXJhdGlvbiBvZiBhbiBBa2FzaGFSZW5kZXIgcHJvamVjdCwgaW5jbHVkaW5nIHRoZSBpbnB1dCBkaXJlY3RvcmllcyxcbiAqIG91dHB1dCBkaXJlY3RvcnksIHBsdWdpbnMsIGFuZCB2YXJpb3VzIHNldHRpbmdzLlxuICpcbiAqIFVTQUdFOlxuICpcbiAqIGNvbnN0IGFrYXNoYSA9IHJlcXVpcmUoJ2FrYXNoYXJlbmRlcicpO1xuICogY29uc3QgY29uZmlnID0gbmV3IGFrYXNoYS5Db25maWd1cmF0aW9uKCk7XG4gKi9cbmV4cG9ydCBjbGFzcyBDb25maWd1cmF0aW9uIHtcbiAgICAjcmVuZGVyZXJzOiBSZW5kZXJlcnMuQ29uZmlndXJhdGlvbjtcbiAgICAjY29uZmlnZGlyOiBzdHJpbmc7XG4gICAgI2NhY2hlZGlyOiBzdHJpbmc7XG4gICAgI2Fzc2V0c0RpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2xheW91dERpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2RvY3VtZW50RGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjcGFydGlhbERpcnM/OiBkaXJUb01vdW50W107XG4gICAgI21haGFmdW5jcztcbiAgICAjY2hlZXJpbz86IGNoZWVyaW8uQ2hlZXJpb09wdGlvbnM7XG4gICAgI3JlbmRlclRvOiBzdHJpbmc7XG4gICAgI3NjcmlwdHM/OiB7XG4gICAgICAgIHN0eWxlc2hlZXRzPzogc3R5bGVzaGVldEl0ZW1bXSxcbiAgICAgICAgamF2YVNjcmlwdFRvcD86IGphdmFTY3JpcHRJdGVtW10sXG4gICAgICAgIGphdmFTY3JpcHRCb3R0b20/OiBqYXZhU2NyaXB0SXRlbVtdXG4gICAgfTtcbiAgICAjY29uY3VycmVuY3k6IG51bWJlcjtcbiAgICAjY2FjaGluZ1RpbWVvdXQ6IG51bWJlcjtcbiAgICAjbWV0YWRhdGE6IGFueTtcbiAgICAjcm9vdF91cmw6IHN0cmluZztcbiAgICAjcGx1Z2lucztcbiAgICAjcGx1Z2luRGF0YTtcbiAgICAjdmVyYm9zZTogYm9vbGVhbjtcbiAgICAjcGVyZkRhdGFEaXI6IHN0cmluZztcbiAgICBcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGVwYXRoKSB7XG5cbiAgICAgICAgLy8gdGhpc1tfY29uZmlnX3JlbmRlcmVyc10gPSBbXTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzID0gbmV3IFJlbmRlcmVycy5Db25maWd1cmF0aW9uKHtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MgPSBbXTtcbiAgICAgICAgdGhpcy4jc2NyaXB0cyA9IHtcbiAgICAgICAgICAgIHN0eWxlc2hlZXRzOiBbXSxcbiAgICAgICAgICAgIGphdmFTY3JpcHRUb3A6IFtdLFxuICAgICAgICAgICAgamF2YVNjcmlwdEJvdHRvbTogW11cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLiNjb25jdXJyZW5jeSA9IDM7XG4gICAgICAgIC8vIDYwIHNlY29uZHMsIG9yIDEgbWludXRlXG4gICAgICAgIHRoaXMuI2NhY2hpbmdUaW1lb3V0ID0gNjAwMDA7XG5cbiAgICAgICAgdGhpcy4jZG9jdW1lbnREaXJzID0gW107XG4gICAgICAgIHRoaXMuI2xheW91dERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jcGFydGlhbERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jYXNzZXRzRGlycyA9IFtdO1xuXG4gICAgICAgIHRoaXMuI21haGFmdW5jcyA9IFtdO1xuXG4gICAgICAgIHRoaXMuI3JlbmRlclRvID0gJ291dCc7XG5cbiAgICAgICAgdGhpcy4jbWV0YWRhdGEgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgdGhpcy4jcGx1Z2lucyA9IFtdO1xuICAgICAgICB0aGlzLiNwbHVnaW5EYXRhID0gW107XG4gICAgICAgIFxuICAgICAgICB0aGlzLiN2ZXJib3NlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy4jcGVyZkRhdGFEaXIgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgLypcbiAgICAgICAgICogSXMgdGhpcyB0aGUgYmVzdCBwbGFjZSBmb3IgdGhpcz8gIEl0IGlzIG5lY2Vzc2FyeSB0b1xuICAgICAgICAgKiBjYWxsIHRoaXMgZnVuY3Rpb24gc29tZXdoZXJlLiAgVGhlIG5hdHVyZSBvZiB0aGlzIGZ1bmN0aW9uXG4gICAgICAgICAqIGlzIHRoYXQgaXQgY2FuIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyB3aXRoIG5vIGltcGFjdC4gIFxuICAgICAgICAgKiBCeSBiZWluZyBsb2NhdGVkIGhlcmUsIGl0IHdpbGwgYWx3YXlzIGJlIGNhbGxlZCBieSB0aGVcbiAgICAgICAgICogdGltZSBhbnkgQ29uZmlndXJhdGlvbiBpcyBnZW5lcmF0ZWQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUaGlzIGlzIGV4ZWN1dGVkIGluIEBha2FzaGFjbXMvcmVuZGVyZXJzXG4gICAgICAgIC8vIHRoaXNbX2NvbmZpZ19yZW5kZXJlcnNdLnJlZ2lzdGVyQnVpbHRJblJlbmRlcmVycygpO1xuXG4gICAgICAgIC8vIFByb3ZpZGUgYSBtZWNoYW5pc20gdG8gZWFzaWx5IHNwZWNpZnkgY29uZmlnRGlyXG4gICAgICAgIC8vIFRoZSBwYXRoIGluIGNvbmZpZ0RpciBtdXN0IGJlIHRoZSBwYXRoIG9mIHRoZSBjb25maWd1cmF0aW9uIGZpbGUuXG4gICAgICAgIC8vIFRoZXJlIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIGEgd2F5IHRvIGRldGVybWluZSB0aGF0IGZyb20gaGVyZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRm9yIGV4YW1wbGUgbW9kdWxlLnBhcmVudC5maWxlbmFtZSBpbiB0aGlzIGNhc2UgcG9pbnRzXG4gICAgICAgIC8vIHRvIGFrYXNoYXJlbmRlci9pbmRleC5qcyBiZWNhdXNlIHRoYXQncyB0aGUgbW9kdWxlIHdoaWNoXG4gICAgICAgIC8vIGxvYWRlZCB0aGlzIG1vZHVsZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gT25lIGNvdWxkIGltYWdpbmUgYSBkaWZmZXJlbnQgaW5pdGlhbGl6YXRpb24gcGF0dGVybi4gIEluc3RlYWRcbiAgICAgICAgLy8gb2YgYWthc2hhcmVuZGVyIHJlcXVpcmluZyBDb25maWd1cmF0aW9uLmpzLCB0aGF0IGZpbGUgY291bGQgYmVcbiAgICAgICAgLy8gcmVxdWlyZWQgYnkgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZS4gIEluIHN1Y2ggYSBjYXNlXG4gICAgICAgIC8vIG1vZHVsZS5wYXJlbnQuZmlsZW5hbWUgV09VTEQgaW5kaWNhdGUgdGhlIGZpbGVuYW1lIGZvciB0aGVcbiAgICAgICAgLy8gY29uZmlndXJhdGlvbiBmaWxlLCBhbmQgd291bGQgYmUgYSBzb3VyY2Ugb2Ygc2V0dGluZ1xuICAgICAgICAvLyB0aGUgY29uZmlnRGlyIHZhbHVlLlxuICAgICAgICBpZiAodHlwZW9mIG1vZHVsZXBhdGggIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZXBhdGggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnRGlyID0gcGF0aC5kaXJuYW1lKG1vZHVsZXBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVyeSBjYXJlZnVsbHkgYWRkIHRoZSA8cGFydGlhbD4gc3VwcG9ydCBmcm9tIE1haGFiaHV0YSBhcyB0aGVcbiAgICAgICAgLy8gdmVyeSBmaXJzdCB0aGluZyBzbyB0aGF0IGl0IGV4ZWN1dGVzIGJlZm9yZSBhbnl0aGluZyBlbHNlLlxuICAgICAgICBsZXQgY29uZmlnID0gdGhpcztcbiAgICAgICAgdGhpcy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZm5hbWUsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGRlZmF1bHQgY29uZmlndXJhdGlvbiB2YWx1ZXMgZm9yIGFueXRoaW5nIHdoaWNoIGhhcyBub3RcbiAgICAgKiBhbHJlYWR5IGJlZW4gY29uZmlndXJlZC4gIFNvbWUgYnVpbHQtaW4gZGVmYXVsdHMgaGF2ZSBiZWVuIGRlY2lkZWRcbiAgICAgKiBhaGVhZCBvZiB0aW1lLiAgRm9yIGVhY2ggY29uZmlndXJhdGlvbiBzZXR0aW5nLCBpZiBub3RoaW5nIGhhcyBiZWVuXG4gICAgICogZGVjbGFyZWQsIHRoZW4gdGhlIGRlZmF1bHQgaXMgc3Vic3RpdHV0ZWQuXG4gICAgICpcbiAgICAgKiBJdCBpcyBleHBlY3RlZCB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGxhc3QgaW4gdGhlIGNvbmZpZyBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBpbnN0YWxscyB0aGUgYGJ1aWx0LWluYCBwbHVnaW4uICBJdCBuZWVkcyB0byBiZSBsYXN0IG9uXG4gICAgICogdGhlIHBsdWdpbiBjaGFpbiBzbyB0aGF0IGl0cyBzdHlsZXNoZWV0cyBhbmQgcGFydGlhbHMgYW5kIHdoYXRub3RcbiAgICAgKiBjYW4gYmUgb3ZlcnJpZGRlbiBieSBvdGhlciBwbHVnaW5zLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgcHJlcGFyZSgpIHtcblxuICAgICAgICBjb25zdCBDT05GSUcgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IGNvbmZpZ0RpclBhdGggPSBmdW5jdGlvbihkaXJubSkge1xuICAgICAgICAgICAgbGV0IGNvbmZpZ1BhdGggPSBkaXJubTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgQ09ORklHLmNvbmZpZ0RpciAhPT0gJ3VuZGVmaW5lZCcgJiYgQ09ORklHLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnUGF0aCA9IHBhdGguam9pbihDT05GSUcuY29uZmlnRGlyLCBkaXJubSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29uZmlnUGF0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzdGF0O1xuXG4gICAgICAgIGNvbnN0IGNhY2hlRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdjYWNoZScpO1xuICAgICAgICBpZiAoIXRoaXMuI2NhY2hlZGlyKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjYWNoZURpcnNQYXRoKVxuICAgICAgICAgICAgICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoY2FjaGVEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhY2hlRGlyID0gJ2NhY2hlJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInY2FjaGUnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhjYWNoZURpcnNQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlRGlyID0gJ2NhY2hlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNjYWNoZWRpciAmJiAhZnMuZXhpc3RzU3luYyh0aGlzLiNjYWNoZWRpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLiNjYWNoZWRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldHNEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2Fzc2V0cycpO1xuICAgICAgICBpZiAoIXRoaXMuI2Fzc2V0c0RpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGFzc2V0c0RpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGFzc2V0c0RpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQXNzZXRzRGlyKCdhc3NldHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXlvdXRzRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdsYXlvdXRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jbGF5b3V0RGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobGF5b3V0c0RpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGxheW91dHNEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZExheW91dHNEaXIoJ2xheW91dHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJ0aWFsRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdwYXJ0aWFscycpO1xuICAgICAgICBpZiAoIW1haGFQYXJ0aWFsLmNvbmZpZ3VyYXRpb24ucGFydGlhbERpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhcnRpYWxEaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhwYXJ0aWFsRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRQYXJ0aWFsc0RpcigncGFydGlhbHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2N1bWVudERpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnZG9jdW1lbnRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jZG9jdW1lbnREaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhkb2N1bWVudERpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGRvY3VtZW50RGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGREb2N1bWVudHNEaXIoJ2RvY3VtZW50cycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidkb2N1bWVudHMnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vICdkb2N1bWVudERpcnMnIHNldHRpbmcsIGFuZCBubyAnZG9jdW1lbnRzJyBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZW5kZXJUb1BhdGggPSBjb25maWdEaXJQYXRoKCdvdXQnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNyZW5kZXJUbykgIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHJlbmRlclRvUGF0aClcbiAgICAgICAgICAgICAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKHJlbmRlclRvUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFJlbmRlckRlc3RpbmF0aW9uKCdvdXQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInb3V0JyBpcyBub3QgYSBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmMocmVuZGVyVG9QYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFJlbmRlckRlc3RpbmF0aW9uKCdvdXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNyZW5kZXJUbyAmJiAhZnMuZXhpc3RzU3luYyh0aGlzLiNyZW5kZXJUbykpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLiNyZW5kZXJUbywgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgYWthc2hhY21zLWJ1aWx0aW4gcGx1Z2luIG5lZWRzIHRvIGJlIGxhc3Qgb24gdGhlIGNoYWluIHNvIHRoYXRcbiAgICAgICAgLy8gaXRzIHBhcnRpYWxzIGV0YyBjYW4gYmUgZWFzaWx5IG92ZXJyaWRkZW4uICBUaGlzIGlzIHRoZSBtb3N0IGNvbnZlbmllbnRcbiAgICAgICAgLy8gcGxhY2UgdG8gZGVjbGFyZSB0aGF0IHBsdWdpbi5cbiAgICAgICAgLy9cblxuICAgICAgICAvLyBOb3JtYWxseSB3ZSdkIGRvIHJlcXVpcmUoJy4vYnVpbHQtaW4uanMnKS5cbiAgICAgICAgLy8gQnV0LCBpbiB0aGlzIGNvbnRleHQgdGhhdCBkb2Vzbid0IHdvcmsuXG4gICAgICAgIC8vIFdoYXQgd2UgZGlkIGlzIHRvIGltcG9ydCB0aGVcbiAgICAgICAgLy8gQnVpbHRJblBsdWdpbiBjbGFzcyBlYXJsaWVyIHNvIHRoYXRcbiAgICAgICAgLy8gaXQgY2FuIGJlIHVzZWQgaGVyZS5cbiAgICAgICAgdGhpcy51c2UoQnVpbHRJblBsdWdpbiwge1xuICAgICAgICAgICAgLy8gYnVpbHQtaW4gb3B0aW9ucyBpZiBhbnlcbiAgICAgICAgICAgIC8vIERvIG5vdCBuZWVkIHRoaXMgaGVyZSBhbnkgbG9uZ2VyIGJlY2F1c2UgaXQgaXMgaGFuZGxlZFxuICAgICAgICAgICAgLy8gaW4gdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgICAgICAgLy8gU2V0IHVwIHRoZSBNYWhhYmh1dGEgcGFydGlhbCB0YWcgc28gaXQgcmVuZGVycyB0aHJvdWdoIEFrYXNoYVJlbmRlclxuICAgICAgICAgICAgLy8gcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZm5hbWUsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHJlbmRlci5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjb3JkIHRoZSBjb25maWd1cmF0aW9uIGRpcmVjdG9yeSBzbyB0aGF0IHdlIGNhbiBjb3JyZWN0bHkgaW50ZXJwb2xhdGVcbiAgICAgKiB0aGUgcGF0aG5hbWVzIHdlJ3JlIHByb3ZpZGVkLlxuICAgICAqL1xuICAgIHNldCBjb25maWdEaXIoY2ZnZGlyOiBzdHJpbmcpIHsgdGhpcy4jY29uZmlnZGlyID0gY2ZnZGlyOyB9XG4gICAgZ2V0IGNvbmZpZ0RpcigpIHsgcmV0dXJuIHRoaXMuI2NvbmZpZ2RpcjsgfVxuXG4gICAgc2V0IGNhY2hlRGlyKGRpcm5tOiBzdHJpbmcpIHsgdGhpcy4jY2FjaGVkaXIgPSBkaXJubTsgfVxuICAgIGdldCBjYWNoZURpcigpIHsgcmV0dXJuIHRoaXMuI2NhY2hlZGlyOyB9XG5cbiAgICBzZXQgdmVyYm9zZSh2YWw6IGJvb2xlYW4pIHsgdGhpcy4jdmVyYm9zZSA9IHZhbDsgfVxuICAgIGdldCB2ZXJib3NlKCkgeyByZXR1cm4gdGhpcy4jdmVyYm9zZTsgfVxuXG4gICAgc2V0IHBlcmZEYXRhRGlyKHN0b3JlRGlyOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy4jcGVyZkRhdGFEaXIgPSBzdG9yZURpcjtcbiAgICB9XG4gICAgZ2V0IHBlcmZEYXRhRGlyKCkgeyByZXR1cm4gdGhpcy4jcGVyZkRhdGFEaXI7IH1cblxuICAgIC8vIHNldCBha2FzaGEoX2FrYXNoYSkgIHsgdGhpc1tfY29uZmlnX2FrYXNoYV0gPSBfYWthc2hhOyB9XG4gICAgZ2V0IGFrYXNoYSgpIHsgcmV0dXJuIG1vZHVsZV9leHBvcnRzOyB9XG5cbiAgICBhc3luYyBkb2N1bWVudHNDYWNoZSgpIHsgcmV0dXJuIGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTsgfVxuICAgIGFzeW5jIGFzc2V0c0NhY2hlKCkgICAgeyByZXR1cm4gZmlsZWNhY2hlLmFzc2V0c0NhY2hlOyB9XG4gICAgYXN5bmMgbGF5b3V0c0NhY2hlKCkgICB7IHJldHVybiBmaWxlY2FjaGUubGF5b3V0c0NhY2hlOyB9XG4gICAgYXN5bmMgcGFydGlhbHNDYWNoZSgpICB7IHJldHVybiBmaWxlY2FjaGUucGFydGlhbHNDYWNoZTsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBkb2N1bWVudERpcnMgY29uZmlndXJhdGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgZGlyVG9Nb3VudH0gZGlyIFRoZSBwYXRobmFtZSB0byB1c2Ugb3IgZGlyVG9Nb3VudCBvYmplY3RcbiAgICAgKi9cbiAgICBhZGREb2N1bWVudHNEaXIoZGlyOiBzdHJpbmcgfCBkaXJUb01vdW50KSB7XG4gICAgICAgIGxldCBkaXJNb3VudDogZGlyVG9Nb3VudDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmRpcixcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghaXNEaXJUb01vdW50KGRpck1vdW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGREb2N1bWVudHNEaXIgLSBpbnZhbGlkIGRpclRvTW91bnQgb2JqZWN0OiAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2RvY3VtZW50RGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGRvY3VtZW50RGlycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2RvY3VtZW50RGlycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb29rIHVwIHRoZSBkb2N1bWVudCBkaXJlY3RvcnkgaW5mb3JtYXRpb24gZm9yIGEgZ2l2ZW4gZG9jdW1lbnQgZGlyZWN0b3J5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJuYW1lIFRoZSBkb2N1bWVudCBkaXJlY3RvcnkgdG8gc2VhcmNoIGZvclxuICAgICAqL1xuICAgIGRvY3VtZW50RGlySW5mbyhkaXJuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgZm9yICh2YXIgZG9jRGlyIG9mIHRoaXMuZG9jdW1lbnREaXJzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRvY0RpciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jRGlyLnNyYyA9PT0gZGlybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jRGlyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZG9jRGlyID09PSBkaXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvY0RpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgbGF5b3V0RGlycyBjb25maWd1cnRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IGRpclRvTW91bnR9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlIG9yIGRpclRvTW91bnQgb2JqZWN0XG4gICAgICovXG4gICAgYWRkTGF5b3V0c0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZExheW91dHNEaXIgLSBpbnZhbGlkIGRpclRvTW91bnQgb2JqZWN0OiAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2xheW91dERpcnMucHVzaChkaXJNb3VudCk7XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycy5hZGRMYXlvdXREaXIoZGlyTW91bnQuc3JjKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGxheW91dERpcnMoKSB7IHJldHVybiB0aGlzLiNsYXlvdXREaXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIHBhcnRpYWxEaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgZGlyVG9Nb3VudH0gZGlyIFRoZSBwYXRobmFtZSB0byB1c2Ugb3IgZGlyVG9Nb3VudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRQYXJ0aWFsc0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZFBhcnRpYWxzRGlyIC0gaW52YWxpZCBkaXJUb01vdW50IG9iamVjdDogJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLiNwYXJ0aWFsRGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLmFkZFBhcnRpYWxEaXIoZGlyTW91bnQuc3JjKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHBhcnRpYWxzRGlycygpIHsgcmV0dXJuIHRoaXMuI3BhcnRpYWxEaXJzOyB9XG4gICAgXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBhc3NldERpcnMgY29uZmlndXJ0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBkaXJUb01vdW50fSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZSBvciBkaXJUb01vdW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEFzc2V0c0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZEFzc2V0c0RpciAtIGludmFsaWQgZGlyVG9Nb3VudCBvYmplY3Q6ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy4jYXNzZXRzRGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGFzc2V0RGlycygpIHsgcmV0dXJuIHRoaXMuI2Fzc2V0c0RpcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhbiBhcnJheSBvZiBNYWhhYmh1dGEgZnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheX0gbWFoYWZ1bmNzXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkTWFoYWJodXRhKG1haGFmdW5jczogbWFoYWJodXRhLk1haGFmdW5jQXJyYXkgfCBtYWhhYmh1dGEuTWFoYWZ1bmNUeXBlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWFoYWZ1bmNzID09PSAndW5kZWZpbmVkJyB8fCAhbWFoYWZ1bmNzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuZGVmaW5lZCBtYWhhZnVuY3MgaW4gJHt0aGlzLmNvbmZpZ0Rpcn1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MucHVzaChtYWhhZnVuY3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWFoYWZ1bmNzKCkgeyByZXR1cm4gdGhpcy4jbWFoYWZ1bmNzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmUgdGhlIGRpcmVjdG9yeSBpbnRvIHdoaWNoIHRoZSBwcm9qZWN0IGlzIHJlbmRlcmVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZVxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHNldFJlbmRlckRlc3RpbmF0aW9uKGRpcjogc3RyaW5nKSB7XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJyAmJiAhcGF0aC5pc0Fic29sdXRlKGRpcikpIHtcbiAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jcmVuZGVyVG8gPSBkaXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBGZXRjaCB0aGUgZGVjbGFyZWQgZGVzdGluYXRpb24gZm9yIHJlbmRlcmluZyB0aGUgcHJvamVjdC4gKi9cbiAgICBnZXQgcmVuZGVyRGVzdGluYXRpb24oKSB7IHJldHVybiB0aGlzLiNyZW5kZXJUbzsgfVxuICAgIGdldCByZW5kZXJUbygpIHsgcmV0dXJuIHRoaXMuI3JlbmRlclRvOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSB2YWx1ZSB0byB0aGUgcHJvamVjdCBtZXRhZGF0YS4gIFRoZSBtZXRhZGF0YSBpcyBjb21iaW5lZCB3aXRoXG4gICAgICogdGhlIGRvY3VtZW50IG1ldGFkYXRhIGFuZCB1c2VkIGR1cmluZyByZW5kZXJpbmcuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGluZGV4IFRoZSBrZXkgdG8gc3RvcmUgdGhlIHZhbHVlLlxuICAgICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc3RvcmUgaW4gdGhlIG1ldGFkYXRhLlxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZE1ldGFkYXRhKGluZGV4OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdmFyIG1kID0gdGhpcy4jbWV0YWRhdGE7XG4gICAgICAgIG1kW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLiNtZXRhZGF0YTsgfVxuXG4gICAgI2Rlc2NyaXB0aW9uczogVGFnRGVzY3JpcHRpb25bXTtcblxuICAgIC8qKlxuICAgICAqIEFkZCB0YWcgZGVzY3JpcHRpb25zIHRvIHRoZSBkYXRhYmFzZS4gIFRoZSBwdXJwb3NlXG4gICAgICogaXMgZm9yIGV4YW1wbGUgYSB0YWcgaW5kZXggcGFnZSBjYW4gZ2l2ZSBhXG4gICAgICogZGVzY3JpcHRpb24gYXQgdGhlIHRvcCBvZiB0aGUgcGFnZS5cbiAgICAgKlxuICAgICAqIE5PVEU6IFBvdGVudGlhbCBidWcgLSBUaGlzIGZ1bmN0aW9uIHJlcGxhY2VzIHRoZSBlbnRpcmUgI2Rlc2NyaXB0aW9uc1xuICAgICAqIGFycmF5IHJhdGhlciB0aGFuIG1lcmdpbmcgd2l0aCBleGlzdGluZyBkZXNjcmlwdGlvbnMuIElmIGNhbGxlZCBtdWx0aXBsZVxuICAgICAqIHRpbWVzLCBlYXJsaWVyIGRlc2NyaXB0aW9ucyB3aWxsIGJlIGxvc3QuIEN1cnJlbnQgYXNzdW1wdGlvbiBpcyB0aGlzXG4gICAgICogZnVuY3Rpb24gaXMgb25seSBjYWxsZWQgb25jZSBmcm9tIHRoZSBjb25maWd1cmF0aW9uIGZpbGUuIEEgZnV0dXJlXG4gICAgICogZW5oYW5jZW1lbnQgd291bGQgYmUgdG8gbWVyZ2UgZGVzY3JpcHRpb25zIGluc3RlYWQgb2YgcmVwbGFjaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhZ2Rlc2NzIFxuICAgICAqL1xuICAgIGFzeW5jIGFkZFRhZ0Rlc2NyaXB0aW9ucyh0YWdkZXNjczogVGFnRGVzY3JpcHRpb25bXSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodGFnZGVzY3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZFRhZ0Rlc2NyaXB0aW9ucyBtdXN0IGJlIGdpdmVuIGFuIGFycmF5IG9mIHRhZyBkZXNjcmlwdGlvbnNgKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGRlc2Mgb2YgdGFnZGVzY3MpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVzYy50YWdOYW1lICE9PSAnc3RyaW5nJ1xuICAgICAgICAgICAgIHx8IHR5cGVvZiBkZXNjLmRlc2NyaXB0aW9uICE9PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5jb3JyZWN0IHRhZyBkZXNjcmlwdGlvbiAke3V0aWwuaW5zcGVjdChkZXNjKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBtZXJnaW5nIHdpdGggZXhpc3RpbmcgZGVzY3JpcHRpb25zIGluc3RlYWQgb2YgcmVwbGFjaW5nXG4gICAgICAgIHRoaXMuI2Rlc2NyaXB0aW9ucyA9IHRhZ2Rlc2NzO1xuICAgIH1cblxuICAgIGFzeW5jICNzYXZlRGVzY3JpcHRpb25zVG9EQigpIHtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLiNkZXNjcmlwdGlvbnMpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRlc2Mgb2YgdGhpcy4jZGVzY3JpcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZG9jdW1lbnRzLmFkZFRhZ0Rlc2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICBkZXNjLnRhZ05hbWUsIGRlc2MuZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBEb2N1bWVudCB0aGUgVVJMIGZvciBhIHdlYnNpdGUgcHJvamVjdC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSByb290X3VybFxuICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgKi9cbiAgICByb290VVJMKHJvb3RfdXJsOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy4jcm9vdF91cmwgPSByb290X3VybDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHJvb3RfdXJsKCkgeyByZXR1cm4gdGhpcy4jcm9vdF91cmw7IH1cblxuICAgIC8qKlxuICAgICAqIFNldCBob3cgbWFueSBkb2N1bWVudHMgdG8gcmVuZGVyIGNvbmN1cnJlbnRseS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY29uY3VycmVuY3lcbiAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHNldENvbmN1cnJlbmN5KGNvbmN1cnJlbmN5OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy4jY29uY3VycmVuY3kgPSBjb25jdXJyZW5jeTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGNvbmN1cnJlbmN5KCkgeyByZXR1cm4gdGhpcy4jY29uY3VycmVuY3k7IH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdGltZSwgaW4gbWlsaXNlY29uZHMsIHRvIGhvbm9yXG4gICAgICogdGhlIFNlYXJjaENhY2hlIGluIHRoZSBzZWFyY2ggZnVuY3Rpb24uXG4gICAgICogXG4gICAgICogRGVmYXVsdCBpcyA2MDAwMCAoMSBtaW51dGUpLlxuICAgICAqIFxuICAgICAqIFNldCB0byAwIHRvIGRpc2FibGUgY2FjaGluZy5cbiAgICAgKiBAcGFyYW0gdGltZW91dCBcbiAgICAgKi9cbiAgICBzZXRDYWNoaW5nVGltZW91dCh0aW1lb3V0OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy4jY2FjaGluZ1RpbWVvdXQgPSB0aW1lb3V0O1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2V0U2VhcmNoQ2FjaGVUaW1lb3V0ICR7dGhpcy4jc2VhcmNoQ2FjaGVUaW1lb3V0fWApO1xuICAgIH1cblxuICAgIGdldCBjYWNoaW5nVGltZW91dCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHNlYXJjaENhY2hlVGltZW91dCAke3RoaXMuI3NlYXJjaENhY2hlVGltZW91dH1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2NhY2hpbmdUaW1lb3V0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlY2xhcmUgSmF2YVNjcmlwdCB0byBhZGQgd2l0aGluIHRoZSBoZWFkIHRhZyBvZiByZW5kZXJlZCBwYWdlcy5cbiAgICAgKiBAcGFyYW0gc2NyaXB0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkSGVhZGVySmF2YVNjcmlwdChzY3JpcHQ6IGphdmFTY3JpcHRJdGVtKSB7XG4gICAgICAgIHRoaXMuI3NjcmlwdHMuamF2YVNjcmlwdFRvcC5wdXNoKHNjcmlwdCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBzY3JpcHRzKCkgeyByZXR1cm4gdGhpcy4jc2NyaXB0czsgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBKYXZhU2NyaXB0IHRvIGFkZCBhdCB0aGUgYm90dG9tIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRGb290ZXJKYXZhU2NyaXB0KHNjcmlwdDogamF2YVNjcmlwdEl0ZW0pIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tLnB1c2goc2NyaXB0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBhIENTUyBTdHlsZXNoZWV0IHRvIGFkZCB3aXRoaW4gdGhlIGhlYWQgdGFnIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRTdHlsZXNoZWV0KGNzczogc3R5bGVzaGVldEl0ZW0pIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5zdHlsZXNoZWV0cy5wdXNoKGNzcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldE1haGFiaHV0YUNvbmZpZyhjaGVlcmlvPzogY2hlZXJpby5DaGVlcmlvT3B0aW9ucykge1xuICAgICAgICB0aGlzLiNjaGVlcmlvID0gY2hlZXJpbztcblxuICAgICAgICAvLyBGb3IgY2hlZXJpbyAxLjAuMC1yYy4xMCB3ZSBuZWVkIHRvIHVzZSB0aGlzIHNldHRpbmcuXG4gICAgICAgIC8vIElmIHRoZSBjb25maWd1cmF0aW9uIGhhcyBzZXQgdGhpcywgd2UgbXVzdCBub3RcbiAgICAgICAgLy8gb3ZlcnJpZGUgdGhlaXIgc2V0dGluZy4gIEJ1dCwgZ2VuZXJhbGx5LCBmb3IgY29ycmVjdFxuICAgICAgICAvLyBvcGVyYXRpb24gYW5kIGhhbmRsaW5nIG9mIE1haGFiaHV0YSB0YWdzLCB3ZSBuZWVkXG4gICAgICAgIC8vIHRoaXMgc2V0dGluZyB0byBiZSA8Y29kZT50cnVlPC9jb2RlPlxuICAgICAgICBpZiAoISgnX3VzZUh0bWxQYXJzZXIyJyBpbiB0aGlzLiNjaGVlcmlvKSkge1xuICAgICAgICAgICAgKHRoaXMuI2NoZWVyaW8gYXMgYW55KS5fdXNlSHRtbFBhcnNlcjIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpc1tfY29uZmlnX2NoZWVyaW9dKTtcbiAgICB9XG5cbiAgICBnZXQgbWFoYWJodXRhQ29uZmlnKCkgeyByZXR1cm4gdGhpcy4jY2hlZXJpbzsgfVxuXG4gICAgLyoqXG4gICAgICogQ29weSB0aGUgY29udGVudHMgb2YgYWxsIGRpcmVjdG9yaWVzIGluIGFzc2V0RGlycyB0byB0aGUgcmVuZGVyIGRlc3RpbmF0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGNvcHlBc3NldHMoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdjb3B5QXNzZXRzIFNUQVJUJyk7XG5cbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgY29uc3QgYXNzZXRzID0gZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICAvLyBGZXRjaCB0aGUgbGlzdCBvZiBhbGwgYXNzZXRzIGZpbGVzXG4gICAgICAgIGNvbnN0IHBhdGhzID0gYXdhaXQgYXNzZXRzLnBhdGhzKCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgcGF0aHNgLFxuICAgICAgICAvLyAgICAgcGF0aHMubWFwKGl0ZW0gPT4ge1xuICAgICAgICAvLyAgICAgICAgIHJldHVybiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAvLyAgICAgICAgICAgICByZW5kZXJQYXRoOiBpdGVtLnJlbmRlclBhdGgsXG4gICAgICAgIC8vICAgICAgICAgICAgIG1pbWU6IGl0ZW0ubWltZVxuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gICAgIH0pXG4gICAgICAgIC8vIClcblxuICAgICAgICAvLyBUaGUgd29yayB0YXNrIGlzIHRvIGNvcHkgZWFjaCBmaWxlXG4gICAgICAgIGNvbnN0IHF1ZXVlID0gZmFzdHEucHJvbWlzZShhc3luYyBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzICR7Y29uZmlnLnJlbmRlclRvfSAke2l0ZW0ucmVuZGVyUGF0aH1gKTtcbiAgICAgICAgICAgICAgICBsZXQgZGVzdEZOID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJUbywgaXRlbS5yZW5kZXJQYXRoKTtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKGRlc3RGTiksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIC8vIENvcHkgZnJvbSB0aGUgYWJzb2x1dGUgcGF0aG5hbWUsIHRvIHRoZSBjb21wdXRlZCBcbiAgICAgICAgICAgICAgICAvLyBsb2NhdGlvbiB3aXRoaW4gdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeVxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzICR7aXRlbS5mc3BhdGh9ID09PiAke2Rlc3RGTn1gKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AuY3AoaXRlbS5mc3BhdGgsIGRlc3RGTiwge1xuICAgICAgICAgICAgICAgICAgICBmb3JjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY29weUFzc2V0cyBGQUlMIHRvIGNvcHkgJHtpdGVtLmZzcGF0aH0gJHtpdGVtLnZwYXRofSAke2l0ZW0ucmVuZGVyUGF0aH0gJHtjb25maWcucmVuZGVyVG99IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwKTtcblxuICAgICAgICAvLyBQdXNoIHRoZSBsaXN0IG9mIGFzc2V0IGZpbGVzIGludG8gdGhlIHF1ZXVlXG4gICAgICAgIC8vIEJlY2F1c2UgcXVldWUucHVzaCByZXR1cm5zIFByb21pc2UncyB3ZSBlbmQgdXAgd2l0aFxuICAgICAgICAvLyBhbiBhcnJheSBvZiBQcm9taXNlIG9iamVjdHNcbiAgICAgICAgY29uc3Qgd2FpdEZvciA9IFtdO1xuICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBwYXRocykge1xuICAgICAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGlzIHdhaXRzIGZvciBhbGwgUHJvbWlzZSdzIHRvIGZpbmlzaFxuICAgICAgICAvLyBCdXQgaWYgdGhlcmUgd2VyZSBubyBQcm9taXNlJ3MsIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICBpZiAod2FpdEZvci5sZW5ndGggPiAwKSBhd2FpdCBQcm9taXNlLmFsbCh3YWl0Rm9yKTtcbiAgICAgICAgLy8gVGhlcmUgYXJlIG5vIHJlc3VsdHMgaW4gdGhpcyBjYXNlIHRvIGNhcmUgYWJvdXRcbiAgICAgICAgLy8gY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICAvLyBmb3IgKGxldCByZXN1bHQgb2Ygd2FpdEZvcikge1xuICAgICAgICAvLyAgICByZXN1bHRzLnB1c2goYXdhaXQgcmVzdWx0KTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGwgdGhlIGJlZm9yZVNpdGVSZW5kZXJlZCBmdW5jdGlvbiBvZiBhbnkgcGx1Z2luIHdoaWNoIGhhcyB0aGF0IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4uYmVmb3JlU2l0ZVJlbmRlcmVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBiZWZvcmVTaXRlUmVuZGVyZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uYmVmb3JlU2l0ZVJlbmRlcmVkKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsIHRoZSBvblNpdGVSZW5kZXJlZCBmdW5jdGlvbiBvZiBhbnkgcGx1Z2luIHdoaWNoIGhhcyB0aGF0IGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGFzeW5jIGhvb2tTaXRlUmVuZGVyZWQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdob29rU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25TaXRlUmVuZGVyZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uU2l0ZVJlbmRlcmVkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uU2l0ZVJlbmRlcmVkKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZUFkZGVkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhvb2tGaWxlQWRkZWQgJHtjb2xsZWN0aW9ufSAke3ZwaW5mby52cGF0aH1gKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVBZGRlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25GaWxlQWRkZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlQWRkZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVDaGFuZ2VkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVDaGFuZ2VkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvbkZpbGVDaGFuZ2VkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUNoYW5nZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVVbmxpbmtlZChjb2xsZWN0aW9uOiBzdHJpbmcsIHZwaW5mbzogVlBhdGhEYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlVW5saW5rZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uRmlsZVVubGlua2VkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZVVubGlua2VkKGNvbmZpZywgY29sbGVjdGlvbiwgdnBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQ2FjaGVTZXR1cChjb2xsZWN0aW9ubm06IHN0cmluZywgY29sbGVjdGlvbikge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUNhY2hlU2V0dXAgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUNhY2hlU2V0dXAoY29uZmlnLCBjb2xsZWN0aW9ubm0sIGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va1BsdWdpbkNhY2hlU2V0dXAoKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25QbHVnaW5DYWNoZVNldHVwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vblBsdWdpbkNhY2hlU2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNQRUNJQUwgVFJFQVRNRU5UXG4gICAgICAgIC8vIFRoZSB0YWcgZGVzY3JpcHRpb25zIG5lZWQgdG8gYmUgaW5zdGFsbGVkXG4gICAgICAgIC8vIGluIHRoZSBkYXRhYmFzZS4gIEl0IGlzIGltcG9zc2libGUgdG8gZG9cbiAgICAgICAgLy8gdGhhdCBkdXJpbmcgQ29uZmlndXJhdGlvbiBzZXR1cCBpblxuICAgICAgICAvLyB0aGUgYWRkVGFnRGVzY3JpcHRpb25zIG1ldGhvZC5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIGFmdGVyIHRoZSBkYXRhYmFzZVxuICAgICAgICAvLyBpcyBzZXR1cC5cblxuICAgICAgICBhd2FpdCB0aGlzLiNzYXZlRGVzY3JpcHRpb25zVG9EQigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHVzZSAtIGdvIHRocm91Z2ggcGx1Z2lucyBhcnJheSwgYWRkaW5nIGVhY2ggdG8gdGhlIHBsdWdpbnMgYXJyYXkgaW5cbiAgICAgKiB0aGUgY29uZmlnIGZpbGUsIHRoZW4gY2FsbGluZyB0aGUgY29uZmlnIGZ1bmN0aW9uIG9mIGVhY2ggcGx1Z2luLlxuICAgICAqIEBwYXJhbSBQbHVnaW5PYmogVGhlIHBsdWdpbiBuYW1lIG9yIG9iamVjdCB0byBhZGRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICB1c2UoUGx1Z2luT2JqLCBvcHRpb25zKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29uZmlndXJhdGlvbiAjMSB1c2UgUGx1Z2luT2JqIFwiKyB0eXBlb2YgUGx1Z2luT2JqICtcIiBcIisgdXRpbC5pbnNwZWN0KFBsdWdpbk9iaikpO1xuICAgICAgICBpZiAodHlwZW9mIFBsdWdpbk9iaiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgZ29pbmcgdG8gZmFpbCBiZWNhdXNlXG4gICAgICAgICAgICAvLyByZXF1aXJlIGRvZXNuJ3Qgd29yayBpbiB0aGlzIGNvbnRleHRcbiAgICAgICAgICAgIC8vIEZ1cnRoZXIsIHRoaXMgY29udGV4dCBkb2VzIG5vdFxuICAgICAgICAgICAgLy8gc3VwcG9ydCBhc3luYyBmdW5jdGlvbnMsIHNvIHdlXG4gICAgICAgICAgICAvLyBjYW5ub3QgZG8gaW1wb3J0LlxuICAgICAgICAgICAgUGx1Z2luT2JqID0gcmVxdWlyZShQbHVnaW5PYmopO1xuICAgICAgICB9XG4gICAgICAgIGlmICghUGx1Z2luT2JqIHx8IFBsdWdpbk9iaiBpbnN0YW5jZW9mIFBsdWdpbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gcGx1Z2luIHN1cHBsaWVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29uZmlndXJhdGlvbiAjMiB1c2UgUGx1Z2luT2JqIFwiKyB0eXBlb2YgUGx1Z2luT2JqICtcIiBcIisgdXRpbC5pbnNwZWN0KFBsdWdpbk9iaikpO1xuICAgICAgICB2YXIgcGx1Z2luID0gbmV3IFBsdWdpbk9iaigpO1xuICAgICAgICBwbHVnaW4uYWthc2hhID0gdGhpcy5ha2FzaGE7XG4gICAgICAgIHRoaXMuI3BsdWdpbnMucHVzaChwbHVnaW4pO1xuICAgICAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgcGx1Z2luLmNvbmZpZ3VyZSh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHBsdWdpbnMoKSB7IHJldHVybiB0aGlzLiNwbHVnaW5zOyB9XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlIG92ZXIgdGhlIGluc3RhbGxlZCBwbHVnaW5zLCBjYWxsaW5nIHRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gYGl0ZXJhdG9yYFxuICAgICAqIGZvciBlYWNoIHBsdWdpbiwgdGhlbiBjYWxsaW5nIHRoZSBmdW5jdGlvbiBwYXNzZWQgaW4gYGZpbmFsYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpdGVyYXRvciBUaGUgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCBwbHVnaW4uICBTaWduYXR1cmU6IGBmdW5jdGlvbihwbHVnaW4sIG5leHQpYCAgVGhlIGBuZXh0YCBwYXJhbWV0ZXIgaXMgYSBmdW5jdGlvbiB1c2VkIHRvIGluZGljYXRlIGVycm9yIC0tIGBuZXh0KGVycilgIC0tIG9yIHN1Y2Nlc3MgLS0gbmV4dCgpXG4gICAgICogQHBhcmFtIGZpbmFsIFRoZSBmdW5jdGlvbiB0byBjYWxsIGFmdGVyIGFsbCBpdGVyYXRvciBjYWxscyBoYXZlIGJlZW4gbWFkZS4gIFNpZ25hdHVyZTogYGZ1bmN0aW9uKGVycilgXG4gICAgICovXG4gICAgZWFjaFBsdWdpbihpdGVyYXRvciwgZmluYWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZWFjaFBsdWdpbiBkZXByZWNhdGVkXCIpO1xuICAgICAgICAvKiBhc3luYy5lYWNoU2VyaWVzKHRoaXMucGx1Z2lucyxcbiAgICAgICAgZnVuY3Rpb24ocGx1Z2luLCBuZXh0KSB7XG4gICAgICAgICAgICBpdGVyYXRvcihwbHVnaW4sIG5leHQpO1xuICAgICAgICB9LFxuICAgICAgICBmaW5hbCk7ICovXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9vayBmb3IgYSBwbHVnaW4sIHJldHVybmluZyBpdHMgbW9kdWxlIHJlZmVyZW5jZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAqIEByZXR1cm5zIHtQbHVnaW59XG4gICAgICovXG4gICAgcGx1Z2luKG5hbWU6IHN0cmluZykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnY29uZmlnLnBsdWdpbjogJysgdXRpbC5pbnNwZWN0KHRoaXMuX3BsdWdpbnMpKTtcbiAgICAgICAgaWYgKCEgdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHBsdWdpbktleSBpbiB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIHZhciBwbHVnaW4gPSB0aGlzLnBsdWdpbnNbcGx1Z2luS2V5XTtcbiAgICAgICAgICAgIGlmIChwbHVnaW4ubmFtZSA9PT0gbmFtZSkgcmV0dXJuIHBsdWdpbjtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhgV0FSTklORzogRGlkIG5vdCBmaW5kIHBsdWdpbiAke25hbWV9YCk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIHBsdWdpbkRhdGEgb2JqZWN0IGZvciB0aGUgbmFtZWQgcGx1Z2luLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgKi8gXG4gICAgcGx1Z2luRGF0YShuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdmFyIHBsdWdpbkRhdGFBcnJheSA9IHRoaXMuI3BsdWdpbkRhdGE7XG4gICAgICAgIGlmICghKG5hbWUgaW4gcGx1Z2luRGF0YUFycmF5KSkge1xuICAgICAgICAgICAgcGx1Z2luRGF0YUFycmF5W25hbWVdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBsdWdpbkRhdGFBcnJheVtuYW1lXTtcbiAgICB9XG5cbiAgICBhc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWYoaHJlZikge1xuICAgICAgICBmb3IgKHZhciBwbHVnaW4gb2YgdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5pc0xlZ2l0TG9jYWxIcmVmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGlmIChwbHVnaW4uaXNMZWdpdExvY2FsSHJlZih0aGlzLCBocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyUmVuZGVyZXIocmVuZGVyZXI6IFJlbmRlcmVyKSB7XG4gICAgICAgIGlmICghKHJlbmRlcmVyIGluc3RhbmNlb2YgUmVuZGVyZXIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdOb3QgQSBSZW5kZXJlciAnKyB1dGlsLmluc3BlY3QocmVuZGVyZXIpKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm90IGEgUmVuZGVyZXIgJHt1dGlsLmluc3BlY3QocmVuZGVyZXIpfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5maW5kUmVuZGVyZXJOYW1lKHJlbmRlcmVyLm5hbWUpKSB7XG4gICAgICAgICAgICAvLyByZW5kZXJlci5ha2FzaGEgPSB0aGlzLmFrYXNoYTtcbiAgICAgICAgICAgIC8vIHJlbmRlcmVyLmNvbmZpZyA9IHRoaXM7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVnaXN0ZXJSZW5kZXJlciBgLCByZW5kZXJlcik7XG4gICAgICAgICAgICB0aGlzLiNyZW5kZXJlcnMucmVnaXN0ZXJSZW5kZXJlcihyZW5kZXJlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGxvdyBhbiBhcHBsaWNhdGlvbiB0byBvdmVycmlkZSBvbmUgb2YgdGhlIGJ1aWx0LWluIHJlbmRlcmVyc1xuICAgICAqIHRoYXQgYXJlIGluaXRpYWxpemVkIGJlbG93LiAgVGhlIGluc3BpcmF0aW9uIGlzIGVwdWJ0b29scyB0aGF0XG4gICAgICogbXVzdCB3cml0ZSBIVE1MIGZpbGVzIHdpdGggYW4gLnhodG1sIGV4dGVuc2lvbi4gIFRoZXJlZm9yZSBpdFxuICAgICAqIGNhbiBzdWJjbGFzcyBFSlNSZW5kZXJlciBldGMgd2l0aCBpbXBsZW1lbnRhdGlvbnMgdGhhdCBmb3JjZSB0aGVcbiAgICAgKiBmaWxlIG5hbWUgdG8gYmUgLnhodG1sLiAgV2UncmUgbm90IGNoZWNraW5nIGlmIHRoZSByZW5kZXJlciBuYW1lXG4gICAgICogaXMgYWxyZWFkeSB0aGVyZSBpbiBjYXNlIGVwdWJ0b29scyBtdXN0IHVzZSB0aGUgc2FtZSByZW5kZXJlciBuYW1lLlxuICAgICAqL1xuICAgIHJlZ2lzdGVyT3ZlcnJpZGVSZW5kZXJlcihyZW5kZXJlcjogUmVuZGVyZXIpIHtcbiAgICAgICAgaWYgKCEocmVuZGVyZXIgaW5zdGFuY2VvZiBSZW5kZXJlcikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vdCBBIFJlbmRlcmVyICcrIHV0aWwuaW5zcGVjdChyZW5kZXJlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYSBSZW5kZXJlcicpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlbmRlcmVyLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICAvLyByZW5kZXJlci5jb25maWcgPSB0aGlzO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMucmVnaXN0ZXJPdmVycmlkZVJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgICB9XG5cbiAgICBmaW5kUmVuZGVyZXJOYW1lKG5hbWU6IHN0cmluZyk6IFJlbmRlcmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3JlbmRlcmVycy5maW5kUmVuZGVyZXJOYW1lKG5hbWUpO1xuICAgIH1cblxuICAgIGZpbmRSZW5kZXJlclBhdGgoX3BhdGg6IHN0cmluZyk6IFJlbmRlcmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3JlbmRlcmVycy5maW5kUmVuZGVyZXJQYXRoKF9wYXRoKTtcbiAgICB9XG5cbiAgICBnZXQgcmVuZGVyZXJzKCkgeyByZXR1cm4gdGhpcy4jcmVuZGVyZXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgUmVuZGVyZXIgYnkgaXRzIGV4dGVuc2lvbi5cbiAgICAgKi9cbiAgICBmaW5kUmVuZGVyZXIobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRSZW5kZXJlck5hbWUobmFtZSk7XG4gICAgfVxufVxuXG5jb25zdCBtb2R1bGVfZXhwb3J0cyA9IHtcbiAgICBSZW5kZXJlcnMsXG4gICAgUmVuZGVyZXI6IFJlbmRlcmVycy5SZW5kZXJlcixcbiAgICBtYWhhYmh1dGEsXG4gICAgZmlsZWNhY2hlLFxuICAgIHNldHVwLFxuICAgIGNhY2hlU2V0dXAsXG4gICAgY2xvc2VDYWNoZXMsXG4gICAgZmlsZUNhY2hlc1JlYWR5LFxuICAgIFBsdWdpbixcbiAgICByZW5kZXIsXG4gICAgcmVuZGVyMixcbiAgICByZW5kZXJEb2N1bWVudCxcbiAgICByZW5kZXJQYXRoLFxuICAgIHJlbmRlclBhdGgyLFxuICAgIHJlYWRSZW5kZXJlZEZpbGUsXG4gICAgcGFydGlhbCxcbiAgICBwYXJ0aWFsU3luYyxcbiAgICBpbmRleENoYWluLFxuICAgIHJlbGF0aXZlLFxuICAgIGxpbmtSZWxTZXRBdHRyLFxuICAgIHJlc29sdmVWcGF0aCxcbiAgICBnZW5lcmF0ZVJTUyxcbiAgICBDb25maWd1cmF0aW9uXG59IGFzIGFueTtcblxuZXhwb3J0IGRlZmF1bHQgbW9kdWxlX2V4cG9ydHM7Il19