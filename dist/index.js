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
var _Configuration_instances, _Configuration_renderers, _Configuration_configdir, _Configuration_cachedir, _Configuration_assetsDirs, _Configuration_layoutDirs, _Configuration_documentDirs, _Configuration_partialDirs, _Configuration_mahafuncs, _Configuration_cheerio, _Configuration_renderTo, _Configuration_scripts, _Configuration_concurrency, _Configuration_cachingTimeout, _Configuration_metadata, _Configuration_root_url, _Configuration_plugins, _Configuration_pluginData, _Configuration_verbose, _Configuration_perfDataDir, _Configuration_decomment, _Configuration_descriptions, _Configuration_saveDescriptionsToDB;
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
import { render, renderDocument } from './render.js';
export { render, renderDocument, isDocumentUpToDate } from './render.js';
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
/**
 * Locate the document for a vpath, retrying for up to roughly
 * two seconds.  This is used by renderPath, which might be
 * called from the CLI's render-document command while the last
 * document is still being ADD'd to the FileCache.
 *
 * In such a case <code>isReady</code> might return <code>true</code>
 * but not all files will have been ADD'd to the FileCache.
 * In that case <code>documents.find</code> returns
 * <code>undefined</code>
 *
 * The cleaner alternative would be to wait for not only
 * the <code>ready</code> from the <code>documents</code> FileCache,
 * but also for all the initial ADD events to be handled.  But
 * that second condition seems difficult to detect reliably.
 */
async function findDocumentWithRetry(path2r) {
    const documents = filecache.documentsCache;
    let count = 0;
    while (count < 20) {
        const found = await documents.find(path2r);
        if (found)
            return found;
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(undefined);
            }, 100);
        });
        count++;
    }
    return undefined;
}
export async function renderPath(config, path2r) {
    const found = await findDocumentWithRetry(path2r);
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
        _Configuration_decomment.set(this, void 0);
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
        __classPrivateFieldSet(this, _Configuration_decomment, false, "f");
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
    set configDir(cfgdir) {
        if (typeof cfgdir === 'string'
            && cfgdir.length >= 1) {
            __classPrivateFieldSet(this, _Configuration_configdir, cfgdir, "f");
        }
        else {
            throw new Error(`configDir must be given a string`);
        }
    }
    get configDir() { return __classPrivateFieldGet(this, _Configuration_configdir, "f"); }
    set cacheDir(dirnm) {
        if (typeof dirnm === 'string'
            && dirnm.length >= 1) {
            __classPrivateFieldSet(this, _Configuration_cachedir, dirnm, "f");
        }
        else {
            throw new Error(`cacheDir must be given a string`);
        }
    }
    get cacheDir() { return __classPrivateFieldGet(this, _Configuration_cachedir, "f"); }
    set verbose(val) { __classPrivateFieldSet(this, _Configuration_verbose, val, "f"); }
    get verbose() { return __classPrivateFieldGet(this, _Configuration_verbose, "f"); }
    /**
     * Set the directory in which to store performance data.
     * If the value is undefined or null, then performance data
     * collection is disabled.
     */
    set perfDataDir(storeDir) {
        if (typeof storeDir === 'undefined'
            || storeDir === null
            || typeof storeDir === 'string') {
            __classPrivateFieldSet(this, _Configuration_perfDataDir, storeDir, "f");
        }
        else {
            throw new Error(`perfDataDir must be given either undefined, null, or a string`);
        }
    }
    get perfDataDir() { return __classPrivateFieldGet(this, _Configuration_perfDataDir, "f"); }
    get decomment() { return __classPrivateFieldGet(this, _Configuration_decomment, "f"); }
    set decomment(val) { __classPrivateFieldSet(this, _Configuration_decomment, val, "f"); }
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
        if (typeof dir !== 'string'
            || dir.length <= 0) {
            throw new Error(`setRenderDestination must be given a string`);
        }
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
    * Document the URL for a website project, returning
    * the configuration object.
    * @param {string} root_url
    * @returns {Configuration}
    */
    rootURL(root_url) {
        try {
            const u = new URL(root_url);
        }
        catch (err) {
            throw new Error(`rootURL must be given a valid URL: ${err.message}`);
        }
        __classPrivateFieldSet(this, _Configuration_root_url, root_url, "f");
        return this;
    }
    /**
     * Return the current URL for the website.
     */
    get root_url() { return __classPrivateFieldGet(this, _Configuration_root_url, "f"); }
    /**
     * Set how many documents to render concurrently,
     * returning the configuration object.  The number
     * must be in the range [0..50].
     * @param {number} concurrency
    * @returns {Configuration}
     */
    setConcurrency(concurrency) {
        if (typeof concurrency === 'number'
            && concurrency >= 0
            && concurrency <= 50) {
            __classPrivateFieldSet(this, _Configuration_concurrency, concurrency, "f");
        }
        else {
            throw new Error(`setConcurrency must be given a postive number less than 50`);
        }
        return this;
    }
    /**
     * Return the current render concurrency.
     */
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
        if (typeof timeout === 'number'
            && timeout >= 0) {
            __classPrivateFieldSet(this, _Configuration_cachingTimeout, timeout, "f");
        }
        else {
            throw new Error(`setCachingTimeout must be given a postive number`);
        }
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
_Configuration_renderers = new WeakMap(), _Configuration_configdir = new WeakMap(), _Configuration_cachedir = new WeakMap(), _Configuration_assetsDirs = new WeakMap(), _Configuration_layoutDirs = new WeakMap(), _Configuration_documentDirs = new WeakMap(), _Configuration_partialDirs = new WeakMap(), _Configuration_mahafuncs = new WeakMap(), _Configuration_cheerio = new WeakMap(), _Configuration_renderTo = new WeakMap(), _Configuration_scripts = new WeakMap(), _Configuration_concurrency = new WeakMap(), _Configuration_cachingTimeout = new WeakMap(), _Configuration_metadata = new WeakMap(), _Configuration_root_url = new WeakMap(), _Configuration_plugins = new WeakMap(), _Configuration_pluginData = new WeakMap(), _Configuration_verbose = new WeakMap(), _Configuration_perfDataDir = new WeakMap(), _Configuration_decomment = new WeakMap(), _Configuration_descriptions = new WeakMap(), _Configuration_instances = new WeakSet(), _Configuration_saveDescriptionsToDB = async function _Configuration_saveDescriptionsToDB() {
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
    renderDocument,
    renderPath,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBR0g7OztHQUdHO0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsNENBQTRDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFFLFVBQVUsRUFBYyxZQUFZLEVBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEtBQUssU0FBUyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsTUFBTSxFQUNGLGFBQWEsRUFDYix1QkFBdUIsRUFDMUIsR0FBRyxTQUFTLENBQUM7QUFDZCxPQUFPLEtBQUssT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUNuQyxPQUFPLFdBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXZDLGNBQWMsZ0JBQWdCLENBQUM7QUFFL0IsT0FBTyxLQUFL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QUNwQyxNQUFNLFNBQVMsQ0FBQyxpQkFBaUIsQ0FDN0IsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxDQUNqQyxDQUFDO1FBQ04sQ0FBQztJQUNMLENBQUM7QUFDTCxDQUFDO0FBb1pMLE1BQU0sY0FBYyxHQUFHO0lBQ25CLFNBQVM7SUFDVCxRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7SUFDNUIsU0FBUztJQUNULFNBQVM7SUFDVCxLQUFLO0lBQ0wsVUFBVTtJQUNWLFdBQVc7SUFDWCxlQUFlO0lBQ2YsZUFBZTtJQUNmLE1BQU07SUFDTixNQUFNO0lBQ04sY0FBYztJQUNkLFVBQVU7SUFDVixnQkFBZ0I7SUFDaEIsT0FBTztJQUNQLFdBQVc7SUFDWCxVQUFVO0lBQ1YsUUFBUTtJQUNSLGNBQWM7SUFDZCxZQUFZO0lBQ1osV0FBVztJQUNYLGFBQWE7Q0FDVCxDQUFDO0FBRVQsZUFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXG4vKipcbiAqIEFrYXNoYVJlbmRlclxuICogQG1vZHVsZSBha2FzaGFyZW5kZXJcbiAqL1xuXG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuLy8gY29uc3Qgb2VtYmV0dGVyID0gcmVxdWlyZSgnb2VtYmV0dGVyJykoKTtcbmltcG9ydCBSU1MgZnJvbSAncnNzJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgeyBtaW1lZGVmaW5lLCBkaXJUb01vdW50LCBpc0RpclRvTW91bnQsIFZQYXRoRGF0YSB9IGZyb20gJy4vY2FjaGUvdmZzdGFjay5qcyc7XG5leHBvcnQgdHlwZSB7IGRpclRvTW91bnQsIFZQYXRoRGF0YSB9IGZyb20gJy4vY2FjaGUvdmZzdGFjay5qcyc7XG5leHBvcnQgeyBpc0RpclRvTW91bnQgfSBmcm9tICcuL2NhY2hlL3Zmc3RhY2suanMnO1xuaW1wb3J0ICogYXMgUmVuZGVyZXJzIGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmV4cG9ydCAqIGFzIFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQgeyBSZW5kZXJlciB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmV4cG9ydCB7IFJlbmRlcmVyIH0gZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0ICogYXMgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5leHBvcnQgKiBhcyBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmNvbnN0IHtcbiAgICBQZXJmRGF0YVN0b3JlLCBcbiAgICBGaWxlc3lzdGVtUGVyZkRhdGFTdG9yZVxufSA9IG1haGFiaHV0YTtcbmltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSAnY2hlZXJpbyc7XG5pbXBvcnQgbWFoYVBhcnRpYWwgZnJvbSAnbWFoYWJodXRhL21haGEvcGFydGlhbC5qcyc7XG5pbXBvcnQgeyBlbmNvZGUgfSBmcm9tICdodG1sLWVudGl0aWVzJztcblxuZXhwb3J0ICogZnJvbSAnLi9tYWhhZnVuY3MuanMnO1xuXG5pbXBvcnQgKiBhcyByZWxhdGl2ZSBmcm9tICdyZWxhdGl2ZSc7XG5leHBvcnQgKiBhcyByZWxhdGl2ZSBmcm9tICdyZWxhdGl2ZSc7XG5cbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vUGx1Z2luLmpzJztcbmV4cG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vUGx1Z2luLmpzJztcblxuaW1wb3J0IHR5cGUgeyBUYWdEZXNjcmlwdGlvbiB9IGZyb20gJy4vdHlwZXMuanMnO1xuZXhwb3J0IHR5cGUgeyBUYWdEZXNjcmlwdGlvbiB9IGZyb20gJy4vdHlwZXMuanMnO1xuZXhwb3J0IHR5cGUge1xuICAgIFNlYXJjaE9wdGlvbnMsXG4gICAgUmVnZXhNYXRjaCxcbiAgICBTZWFyY2hGaWx0ZXJGdW5jLFxuICAgIFNlYXJjaFNvcnRGdW5jXG59IGZyb20gJy4vdHlwZXMuanMnO1xuZXhwb3J0IHsgdmFsaWRUYWdEZXNjcmlwdGlvbiB9IGZyb20gJy4vdHlwZXMuanMnO1xuXG5pbXBvcnQgeyByZW5kZXIsIHJlbmRlckRvY3VtZW50IH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuZXhwb3J0IHsgcmVuZGVyLCByZW5kZXJEb2N1bWVudCwgaXNEb2N1bWVudFVwVG9EYXRlIH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuZXhwb3J0IHR5cGUgeyBSZW5kZXJPcHRpb25zLCBSZW5kZXJpbmdSZXN1bHRzIH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuXG5leHBvcnQge1xuICAgIFNpdGVtYXBWYWxpZGF0b3IsXG4gICAgdHlwZSBTaXRlbWFwRW50cnksXG4gICAgdHlwZSBFbnRyeVZhbGlkYXRpb24sXG4gICAgdHlwZSBYTUxWYWxpZGF0aW9uLFxuICAgIHR5cGUgVmFsaWRhdGlvblJlc3VsdFxufSBmcm9tICcuL3NpdGVtYXAtdmFsaWRhdG9yLmpzJztcblxuZXhwb3J0IHtcbiAgICBpbmZlckZvcm1hdCxcbiAgICBwYXJzZVRhYmxlRGF0YSxcbiAgICB0eXBlIENzdlRhYmxlRm9ybWF0LFxuICAgIHR5cGUgQ3N2VGFibGVSb3csXG4gICAgdHlwZSBDc3ZUYWJsZURhdGEsXG4gICAgdHlwZSBQYXJzZVRhYmxlT3B0aW9uc1xufSBmcm9tICcuL2Nzdi10YWJsZS5qcyc7XG5cbmV4cG9ydCB7XG4gICAgTGlua0NoZWNrZXIsXG4gICAgaXNXaGl0ZWxpc3RlZCxcbiAgICBjbGFzc2lmeVN0YXR1cyxcbiAgICBhc3NlcnRNb2RlIGFzIGFzc2VydExpbmtDaGVja01vZGUsXG4gICAgZmV0Y2hFeHRlcm5hbENoZWNrZXIsXG4gICAgbGlua0NoZWNrRXh0ZXJuYWxDaGVja2VyLFxuICAgIExJTktfQ0hFQ0tfTU9ERVMsXG4gICAgREVGQVVMVF9MSU5LX0NIRUNLX09QVElPTlMsXG4gICAgdHlwZSBMaW5rQ2hlY2tNb2RlLFxuICAgIHR5cGUgTGlua0NoZWNrT3B0aW9ucyxcbiAgICB0eXBlIFdoaXRlbGlzdEVudHJ5LFxuICAgIHR5cGUgRXh0ZXJuYWxTdGF0ZSxcbiAgICB0eXBlIEV4dGVybmFsUmVzdWx0LFxuICAgIHR5cGUgRXh0ZXJuYWxDaGVja2VyLFxuICAgIHR5cGUgRXh0ZXJuYWxDaGVja09wdGlvbnMsXG4gICAgdHlwZSBMaW5rS2luZCxcbiAgICB0eXBlIExpbmtFcnJvcixcbiAgICB0eXBlIEludGVybmFsUmVzb2x2ZXJcbn0gZnJvbSAnLi9saW5rLWNoZWNrZXIuanMnO1xuXG5jb25zdCBfX2ZpbGVuYW1lID0gaW1wb3J0Lm1ldGEuZmlsZW5hbWU7XG5jb25zdCBfX2Rpcm5hbWUgPSBpbXBvcnQubWV0YS5kaXJuYW1lO1xuXG4vLyBGb3IgdXNlIGluIENvbmZpZ3VyZS5wcmVwYXJlXG5pbXBvcnQgeyBCdWlsdEluUGx1Z2luIH0gZnJvbSAnLi9idWlsdC1pbi5qcyc7XG5cbmltcG9ydCAqIGFzIGZpbGVjYWNoZSBmcm9tICcuL2NhY2hlL2NhY2hlLXNxbGl0ZS5qcyc7XG5pbXBvcnQgeyBzcWRiIH0gZnJvbSAnLi9zcWRiLmpzJztcblxuZXhwb3J0IHsgbmV3U1EzRGF0YVN0b3JlIH0gZnJvbSAnLi9zcWRiLmpzJztcblxuaW1wb3J0IHsgaW5pdCB9IGZyb20gJy4vZGF0YS5qcyc7XG5cbi8vIFRoZXJlIGRvZXNuJ3Qgc2VlbSB0byBiZSBhbiBvZmZpY2lhbCBNSU1FIHR5cGUgcmVnaXN0ZXJlZFxuLy8gZm9yIEFzY2lpRG9jdG9yXG4vLyBwZXI6IGh0dHBzOi8vYXNjaWlkb2N0b3Iub3JnL2RvY3MvZmFxL1xuLy8gcGVyOiBodHRwczovL2dpdGh1Yi5jb20vYXNjaWlkb2N0b3IvYXNjaWlkb2N0b3IvaXNzdWVzLzI1MDJcbi8vXG4vLyBBcyBvZiBOb3ZlbWJlciA2LCAyMDIyLCB0aGUgQXNjaWlEb2N0b3IgRkFRIHNhaWQgdGhleSBhcmVcbi8vIGluIHRoZSBwcm9jZXNzIG9mIHJlZ2lzdGVyaW5nIGEgTUlNRSB0eXBlIGZvciBgdGV4dC9hc2NpaWRvY2AuXG4vLyBUaGUgTUlNRSB0eXBlIHdlIHN1cHBseSBoYXMgYmVlbiB1cGRhdGVkLlxuLy9cbi8vIFRoaXMgYWxzbyBzZWVtcyB0byBiZSB0cnVlIGZvciB0aGUgb3RoZXIgZmlsZSB0eXBlcy4gIFdlJ3ZlIG1hZGUgdXBcbi8vIHNvbWUgTUlNRSB0eXBlcyB0byBnbyB3aXRoIGVhY2guXG4vL1xuLy8gVGhlIE1JTUUgcGFja2FnZSBoYWQgcHJldmlvdXNseSBiZWVuIGluc3RhbGxlZCB3aXRoIEFrYXNoYVJlbmRlci5cbi8vIEJ1dCwgaXQgc2VlbXMgdG8gbm90IGJlIHVzZWQsIGFuZCBpbnN0ZWFkIHdlIGNvbXB1dGUgdGhlIE1JTUUgdHlwZVxuLy8gZm9yIGZpbGVzIGluIFN0YWNrZWQgRGlyZWN0b3JpZXMuXG4vL1xuLy8gVGhlIHJlcXVpcmVkIHRhc2sgaXMgdG8gcmVnaXN0ZXIgc29tZSBNSU1FIHR5cGVzIHdpdGggdGhlXG4vLyBNSU1FIHBhY2thZ2UuICBJdCBpc24ndCBhcHByb3ByaWF0ZSB0byBkbyB0aGlzIGluXG4vLyB0aGUgU3RhY2tlZCBEaXJlY3RvcmllcyBwYWNrYWdlLiAgSW5zdGVhZCB0aGF0J3MgbGVmdFxuLy8gZm9yIGNvZGUgd2hpY2ggdXNlcyBTdGFja2VkIERpcmVjdG9yaWVzIHRvIGRldGVybWluZSB3aGljaFxuLy8gKGlmIGFueSkgYWRkZWQgTUlNRSB0eXBlcyBhcmUgcmVxdWlyZWQuICBFcmdvLCBBa2FzaGFSZW5kZXJcbi8vIG5lZWRzIHRvIHJlZ2lzdGVyIHRoZSBNSU1FIHR5cGVzIGl0IGlzIGludGVyZXN0ZWQgaW4uXG4vLyBUaGF0J3Mgd2hhdCBpcyBoYXBwZW5pbmcgaGVyZS5cbi8vXG4vLyBUaGVyZSdzIGEgdGhvdWdodCB0aGF0IHRoaXMgc2hvdWxkIGJlIGhhbmRsZWQgaW4gdGhlIFJlbmRlcmVyXG4vLyBpbXBsZW1lbnRhdGlvbnMuICBCdXQgaXQncyBub3QgY2VydGFpbiB0aGF0J3MgY29ycmVjdC5cbi8vXG4vLyBOb3cgdGhhdCB0aGUgUmVuZGVyZXJzIGFyZSBpbiBgQGFrYXNoYWNtcy9yZW5kZXJlcnNgIHNob3VsZFxuLy8gdGhlc2UgZGVmaW5pdGlvbnMgbW92ZSB0byB0aGF0IHBhY2thZ2U/XG5cbm1pbWVkZWZpbmUoeyd0ZXh0L2FzY2lpZG9jJzogWyAnYWRvYycsICdhc2NpaWRvYycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1tYXJrZG9jJzogWyAnbWFya2RvYycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1lanMnOiBbICdlanMnXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1udW5qdWNrcyc6IFsgJ25qaycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1oYW5kbGViYXJzJzogWyAnaGFuZGxlYmFycycgXX0pO1xubWltZWRlZmluZSh7J3RleHQveC1saXF1aWQnOiBbICdsaXF1aWQnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtdGVtcHVyYSc6IFsgJ3RlbXB1cmEnIF19KTtcblxuLyoqXG4gKiBQZXJmb3JtcyBzZXR1cCBvZiB0aGluZ3Mgc28gdGhhdCBBa2FzaGFSZW5kZXIgY2FuIGZ1bmN0aW9uLlxuICogVGhlIGNvcnJlY3QgaW5pdGlhbGl6YXRpb24gb2YgQWthc2hhUmVuZGVyIGlzIHRvXG4gKiAxLiBHZW5lcmF0ZSB0aGUgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAqIDIuIENhbGwgY29uZmlnLnByZXBhcmVcbiAqIDMuIENhbGwgYWthc2hhcmVuZGVyLnNldHVwXG4gKiBcbiAqIFRoaXMgZnVuY3Rpb24gZW5zdXJlcyBhbGwgb2JqZWN0cyB0aGF0IGluaXRpYWxpemUgYXN5bmNocm9ub3VzbHlcbiAqIGFyZSBjb3JyZWN0bHkgc2V0dXAuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAoY29uZmlnKSB7XG5cbiAgICBjb25maWcucmVuZGVyZXJzLnBhcnRpYWxGdW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2FsbGluZyBwYXJ0aWFsICR7Zm5hbWV9YCk7XG4gICAgICAgIHJldHVybiBwYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIGNvbmZpZy5yZW5kZXJlcnMucGFydGlhbFN5bmNGdW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2FsbGluZyBwYXJ0aWFsU3luYyAke2ZuYW1lfWApO1xuICAgICAgICByZXR1cm4gcGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG5cbiAgICBhd2FpdCBjYWNoZVNldHVwKGNvbmZpZyk7XG4gICAgYXdhaXQgZmlsZUNhY2hlc1JlYWR5KGNvbmZpZyk7XG5cbiAgICBhd2FpdCBpbml0KCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWNoZVNldHVwKGNvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZpbGVjYWNoZS5zZXR1cChjb25maWcsIGF3YWl0IHNxZGIpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBJTklUSUFMSVpFIENBQ0hFIGAsIGVycik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZUNhY2hlcygpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBmaWxlY2FjaGUuY2xvc2VGaWxlQ2FjaGVzKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYElOSVRJQUxJWkFUSU9OIEZBSUxVUkUgQ09VTEQgTk9UIENMT1NFIENBQ0hFUyBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmlsZUNhY2hlc1JlYWR5KGNvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5pc1JlYWR5KCksXG4gICAgICAgICAgICBmaWxlY2FjaGUuYXNzZXRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLmxheW91dHNDYWNoZS5pc1JlYWR5KCksXG4gICAgICAgICAgICBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5pc1JlYWR5KClcbiAgICAgICAgXSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYElOSVRJQUxJWkFUSU9OIEZBSUxVUkUgQ09VTEQgTk9UIElOSVRJQUxJWkUgQ0FDSEUgU1lTVEVNIGAsIGVycik7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG59XG5cbi8qKlxuICogTG9jYXRlIHRoZSBkb2N1bWVudCBmb3IgYSB2cGF0aCwgcmV0cnlpbmcgZm9yIHVwIHRvIHJvdWdobHlcbiAqIHR3byBzZWNvbmRzLiAgVGhpcyBpcyB1c2VkIGJ5IHJlbmRlclBhdGgsIHdoaWNoIG1pZ2h0IGJlXG4gKiBjYWxsZWQgZnJvbSB0aGUgQ0xJJ3MgcmVuZGVyLWRvY3VtZW50IGNvbW1hbmQgd2hpbGUgdGhlIGxhc3RcbiAqIGRvY3VtZW50IGlzIHN0aWxsIGJlaW5nIEFERCdkIHRvIHRoZSBGaWxlQ2FjaGUuXG4gKlxuICogSW4gc3VjaCBhIGNhc2UgPGNvZGU+aXNSZWFkeTwvY29kZT4gbWlnaHQgcmV0dXJuIDxjb2RlPnRydWU8L2NvZGU+XG4gKiBidXQgbm90IGFsbCBmaWxlcyB3aWxsIGhhdmUgYmVlbiBBREQnZCB0byB0aGUgRmlsZUNhY2hlLlxuICogSW4gdGhhdCBjYXNlIDxjb2RlPmRvY3VtZW50cy5maW5kPC9jb2RlPiByZXR1cm5zXG4gKiA8Y29kZT51bmRlZmluZWQ8L2NvZGU+XG4gKlxuICogVGhlIGNsZWFuZXIgYWx0ZXJuYXRpdmUgd291bGQgYmUgdG8gd2FpdCBmb3Igbm90IG9ubHlcbiAqIHRoZSA8Y29kZT5yZWFkeTwvY29kZT4gZnJvbSB0aGUgPGNvZGU+ZG9jdW1lbnRzPC9jb2RlPiBGaWxlQ2FjaGUsXG4gKiBidXQgYWxzbyBmb3IgYWxsIHRoZSBpbml0aWFsIEFERCBldmVudHMgdG8gYmUgaGFuZGxlZC4gIEJ1dFxuICogdGhhdCBzZWNvbmQgY29uZGl0aW9uIHNlZW1zIGRpZmZpY3VsdCB0byBkZXRlY3QgcmVsaWFibHkuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZpbmREb2N1bWVudFdpdGhSZXRyeShwYXRoMnIpIHtcbiAgICBjb25zdCBkb2N1bWVudHMgPSBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICB3aGlsZSAoY291bnQgPCAyMCkge1xuICAgICAgICBjb25zdCBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHBhdGgycik7XG4gICAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGZvdW5kO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvdW50Kys7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJQYXRoKGNvbmZpZywgcGF0aDJyKSB7XG4gICAgY29uc3QgZm91bmQgPSBhd2FpdCBmaW5kRG9jdW1lbnRXaXRoUmV0cnkocGF0aDJyKTtcbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRGlkIG5vdCBmaW5kIGRvY3VtZW50IGZvciAke3BhdGgycn1gKTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckRvY3VtZW50KGNvbmZpZywgZm91bmQpO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmVhZHMgYSBmaWxlIGZyb20gdGhlIHJlbmRlcmluZyBkaXJlY3RvcnkuICBJdCBpcyBwcmltYXJpbHkgdG8gYmVcbiAqIHVzZWQgaW4gdGVzdCBjYXNlcywgd2hlcmUgd2UnbGwgcnVuIGEgYnVpbGQgdGhlbiByZWFkIHRoZSBpbmRpdmlkdWFsXG4gKiBmaWxlcyB0byBtYWtlIHN1cmUgdGhleSd2ZSByZW5kZXJlZCBjb3JyZWN0bHkuXG4gKiBcbiAqIEBwYXJhbSB7Kn0gY29uZmlnIFxuICogQHBhcmFtIHsqfSBmcGF0aCBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFJlbmRlcmVkRmlsZShjb25maWcsIGZwYXRoKSB7XG5cbiAgICBsZXQgaHRtbCA9IGF3YWl0IGZzcC5yZWFkRmlsZShwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCBmcGF0aCksICd1dGY4Jyk7XG4gICAgbGV0ICQgPSBjb25maWcubWFoYWJodXRhQ29uZmlnIFxuICAgICAgICAgICAgPyBjaGVlcmlvLmxvYWQoaHRtbCwgY29uZmlnLm1haGFiaHV0YUNvbmZpZykgXG4gICAgICAgICAgICA6IGNoZWVyaW8ubG9hZChodG1sKTtcblxuICAgIHJldHVybiB7IGh0bWwsICQgfTtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgcGFydGlhbCB0ZW1wbGF0ZSB1c2luZyB0aGUgc3VwcGxpZWQgbWV0YWRhdGEuICBUaGlzIHZlcnNpb25cbiAqIGFsbG93cyBmb3IgYXN5bmNocm9ub3VzIGV4ZWN1dGlvbiwgYW5kIGV2ZXJ5IGJpdCBvZiBjb2RlIGl0XG4gKiBleGVjdXRlcyBpcyBhbGxvd2VkIHRvIGJlIGFzeW5jLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAqIEBwYXJhbSB7Kn0gZm5hbWUgUGF0aCB3aXRoaW4gdGhlIGZpbGVjYWNoZS5wYXJ0aWFscyBjYWNoZVxuICogQHBhcmFtIHsqfSBtZXRhZGF0YSBPYmplY3QgY29udGFpbmluZyBtZXRhZGF0YVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHJlbmRlcmVkIHN0dWZmXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKSB7XG5cbiAgICBpZiAoIWZuYW1lIHx8IHR5cGVvZiBmbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBwYXJ0aWFsIGZuYW1lIG5vdCBhIHN0cmluZyAke3V0aWwuaW5zcGVjdChmbmFtZSl9YCk7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgJHtmbmFtZX1gKTtcbiAgICBjb25zdCBmb3VuZCA9IGF3YWl0IGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLmZpbmQoZm5hbWUpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBwYXJ0aWFsIGZvdW5kIGZvciAke2ZuYW1lfSBpbiAke3V0aWwuaW5zcGVjdChjb25maWcucGFydGlhbHNEaXJzKX1gKTtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgJHtmbmFtZX0gPT0+ICR7Zm91bmQudnBhdGh9ICR7Zm91bmQuZnNwYXRofWApO1xuICAgIFxuICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZm91bmQudnBhdGgpO1xuICAgIGlmIChyZW5kZXJlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCBhYm91dCB0byByZW5kZXIgJHt1dGlsLmluc3BlY3QoZm91bmQudnBhdGgpfWApO1xuICAgICAgICBsZXQgcGFydGlhbFRleHQ7XG4gICAgICAgIGlmIChmb3VuZC5kb2NCb2R5KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0JvZHk7XG4gICAgICAgIGVsc2UgaWYgKGZvdW5kLmRvY0JvZHkpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQm9keTtcbiAgICAgICAgZWxzZSBwYXJ0aWFsVGV4dCA9IGF3YWl0IGZzcC5yZWFkRmlsZShmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG5cbiAgICAgICAgLy8gU29tZSByZW5kZXJlcnMgKE51bmp1a3MpIHJlcXVpcmUgdGhhdCBtZXRhZGF0YS5jb25maWdcbiAgICAgICAgLy8gcG9pbnQgdG8gdGhlIGNvbmZpZyBvYmplY3QuICBUaGlzIGJsb2NrIG9mIGNvZGVcbiAgICAgICAgLy8gZHVwbGljYXRlcyB0aGUgbWV0YWRhdGEgb2JqZWN0LCB0aGVuIHNldHMgdGhlXG4gICAgICAgIC8vIGNvbmZpZyBmaWVsZCBpbiB0aGUgZHVwbGljYXRlLCBwYXNzaW5nIHRoYXQgdG8gdGhlIHBhcnRpYWwuXG4gICAgICAgIGxldCBtZGF0YTogYW55ID0ge307XG4gICAgICAgIGxldCBwcm9wO1xuXG4gICAgICAgIGZvciAocHJvcCBpbiBtZXRhZGF0YSkge1xuICAgICAgICAgICAgbWRhdGFbcHJvcF0gPSBtZXRhZGF0YVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBtZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgICAgIG1kYXRhLnBhcnRpYWxTeW5jID0gcGFydGlhbFN5bmMuYmluZChyZW5kZXJlciwgY29uZmlnKTtcbiAgICAgICAgbWRhdGEucGFydGlhbCAgICAgPSBwYXJ0aWFsLmJpbmQocmVuZGVyZXIsIGNvbmZpZyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsLWZ1bmNzIHJlbmRlciAke3JlbmRlcmVyLm5hbWV9ICR7Zm91bmQudnBhdGh9YCk7XG4gICAgICAgIHJldHVybiByZW5kZXJlci5yZW5kZXIoe1xuICAgICAgICAgICAgZnNwYXRoOiBmb3VuZC5mc3BhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBwYXJ0aWFsVGV4dCxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBtZGF0YVxuICAgICAgICAgICAgLy8gcGFydGlhbFRleHQsIG1kYXRhLCBmb3VuZFxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcuaHRtbCcpIHx8IGZvdW5kLnZwYXRoLmVuZHNXaXRoKCcueGh0bWwnKSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbCByZWFkaW5nIGZpbGUgJHtmb3VuZC52cGF0aH1gKTtcbiAgICAgICAgcmV0dXJuIGZzcC5yZWFkRmlsZShmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW5kZXJQYXJ0aWFsIG5vIFJlbmRlcmVyIGZvdW5kIGZvciAke2ZuYW1lfSAtICR7Zm91bmQudnBhdGh9YCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBwYXJ0aWFsIHRlbXBsYXRlIHVzaW5nIHRoZSBzdXBwbGllZCBtZXRhZGF0YS4gIFRoaXMgdmVyc2lvblxuICogYWxsb3dzIGZvciBzeW5jaHJvbm91cyBleGVjdXRpb24sIGFuZCBldmVyeSBiaXQgb2YgY29kZSBpdFxuICogZXhlY3V0ZXMgaXMgc3luY2hyb25vdXMgZnVuY3Rpb25zLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAqIEBwYXJhbSB7Kn0gZm5hbWUgUGF0aCB3aXRoaW4gdGhlIGZpbGVjYWNoZS5wYXJ0aWFscyBjYWNoZVxuICogQHBhcmFtIHsqfSBtZXRhZGF0YSBPYmplY3QgY29udGFpbmluZyBtZXRhZGF0YVxuICogQHJldHVybnMgU3RyaW5nIGNvbnRhaW5pbmcgdGhlIHJlbmRlcmVkIHN0dWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSkge1xuXG4gICAgaWYgKCFmbmFtZSB8fCB0eXBlb2YgZm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcGFydGlhbFN5bmMgZm5hbWUgbm90IGEgc3RyaW5nICR7dXRpbC5pbnNwZWN0KGZuYW1lKX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBmb3VuZCA9IGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLmZpbmRTeW5jKGZuYW1lKTtcbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcGFydGlhbCBmb3VuZCBmb3IgJHtmbmFtZX0gaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLnBhcnRpYWxzRGlycyl9YCk7XG4gICAgfVxuXG4gICAgdmFyIHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZm91bmQudnBhdGgpO1xuICAgIGlmIChyZW5kZXJlcikge1xuICAgICAgICAvLyBTb21lIHJlbmRlcmVycyAoTnVuanVrcykgcmVxdWlyZSB0aGF0IG1ldGFkYXRhLmNvbmZpZ1xuICAgICAgICAvLyBwb2ludCB0byB0aGUgY29uZmlnIG9iamVjdC4gIFRoaXMgYmxvY2sgb2YgY29kZVxuICAgICAgICAvLyBkdXBsaWNhdGVzIHRoZSBtZXRhZGF0YSBvYmplY3QsIHRoZW4gc2V0cyB0aGVcbiAgICAgICAgLy8gY29uZmlnIGZpZWxkIGluIHRoZSBkdXBsaWNhdGUsIHBhc3NpbmcgdGhhdCB0byB0aGUgcGFydGlhbC5cbiAgICAgICAgbGV0IG1kYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgbGV0IHByb3A7XG5cbiAgICAgICAgZm9yIChwcm9wIGluIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICBtZGF0YVtwcm9wXSA9IG1ldGFkYXRhW3Byb3BdO1xuICAgICAgICB9XG4gICAgICAgIG1kYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgLy8gSW4gdGhpcyBjb250ZXh0LCBwYXJ0aWFsU3luYyBpcyBkaXJlY3RseSBhdmFpbGFibGVcbiAgICAgICAgLy8gYXMgYSBmdW5jdGlvbiB0aGF0IHdlIGNhbiBkaXJlY3RseSB1c2UuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsU3luYyBgLCBwYXJ0aWFsU3luYyk7XG4gICAgICAgIG1kYXRhLnBhcnRpYWxTeW5jID0gcGFydGlhbFN5bmMuYmluZChyZW5kZXJlciwgY29uZmlnKTtcbiAgICAgICAgLy8gZm9yIGZpbmRTeW5jLCB0aGUgXCJmb3VuZFwiIG9iamVjdCBpcyBWUGF0aERhdGEgd2hpY2hcbiAgICAgICAgLy8gZG9lcyBub3QgaGF2ZSBkb2NCb2R5IG5vciBkb2NDb250ZW50LiAgVGhlcmVmb3JlIHdlXG4gICAgICAgIC8vIG11c3QgcmVhZCB0aGlzIGNvbnRlbnRcbiAgICAgICAgbGV0IHBhcnRpYWxUZXh0ID0gZnMucmVhZEZpbGVTeW5jKGZvdW5kLmZzcGF0aCwgJ3V0Zi04Jyk7XG4gICAgICAgIC8vIGlmIChmb3VuZC5kb2NCb2R5KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0JvZHk7XG4gICAgICAgIC8vIGVsc2UgaWYgKGZvdW5kLmRvY0NvbnRlbnQpIHBhcnRpYWxUZXh0ID0gZm91bmQuZG9jQ29udGVudDtcbiAgICAgICAgLy8gZWxzZSBwYXJ0aWFsVGV4dCA9IGZzLnJlYWRGaWxlU3luYyhmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbC1mdW5jcyByZW5kZXJTeW5jICR7cmVuZGVyZXIubmFtZX0gJHtmb3VuZC52cGF0aH1gKTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyLnJlbmRlclN5bmMoPFJlbmRlcmVycy5SZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgICAgIGZzcGF0aDogZm91bmQuZnNwYXRoLFxuICAgICAgICAgICAgY29udGVudDogcGFydGlhbFRleHQsXG4gICAgICAgICAgICBtZXRhZGF0YTogbWRhdGFcbiAgICAgICAgICAgIC8vIHBhcnRpYWxUZXh0LCBtZGF0YSwgZm91bmRcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChmb3VuZC52cGF0aC5lbmRzV2l0aCgnLmh0bWwnKSB8fCBmb3VuZC52cGF0aC5lbmRzV2l0aCgnLnhodG1sJykpIHtcbiAgICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW5kZXJQYXJ0aWFsIG5vIFJlbmRlcmVyIGZvdW5kIGZvciAke2ZuYW1lfSAtICR7Zm91bmQudnBhdGh9YCk7XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBpbmRleENoYWluSXRlbSA9IHtcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgZm91bmRQYXRoOiBzdHJpbmc7XG4gICAgZm91bmREaXI6IHN0cmluZztcbiAgICBmaWxlbmFtZTogc3RyaW5nO1xufTtcblxuLyoqXG4gKiBTdGFydGluZyBmcm9tIGEgdmlydHVhbCBwYXRoIGluIHRoZSBkb2N1bWVudHMsIHNlYXJjaGVzIHVwd2FyZHMgdG9cbiAqIHRoZSByb290IG9mIHRoZSBkb2N1bWVudHMgZmlsZS1zcGFjZSwgZmluZGluZyBmaWxlcyB0aGF0IFxuICogcmVuZGVyIHRvIFwiaW5kZXguaHRtbFwiLiAgVGhlIFwiaW5kZXguaHRtbFwiIGZpbGVzIGFyZSBpbmRleCBmaWxlcyxcbiAqIGFzIHRoZSBuYW1lIHN1Z2dlc3RzLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBcbiAqIEBwYXJhbSB7Kn0gZm5hbWUgXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluZGV4Q2hhaW4oXG4gICAgY29uZmlnLCBmbmFtZVxuKTogUHJvbWlzZTxpbmRleENoYWluSXRlbVtdPiB7XG5cbiAgICAvLyBUaGlzIHVzZWQgdG8gYmUgYSBmdWxsIGZ1bmN0aW9uIGhlcmUsIGJ1dCBoYXMgbW92ZWRcbiAgICAvLyBpbnRvIHRoZSBGaWxlQ2FjaGUgY2xhc3MuICBSZXF1aXJpbmcgYSBgY29uZmlnYCBvcHRpb25cbiAgICAvLyBpcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgZm9ybWVyIEFQSS5cblxuICAgIGNvbnN0IGRvY3VtZW50cyA9IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICByZXR1cm4gZG9jdW1lbnRzLmluZGV4Q2hhaW4oZm5hbWUpO1xufVxuXG5cbi8qKlxuICogTWFuaXB1bGF0ZSB0aGUgcmVsPSBhdHRyaWJ1dGVzIG9uIGEgbGluayByZXR1cm5lZCBmcm9tIE1haGFiaHV0YS5cbiAqXG4gKiBAcGFyYW1zIHskbGlua30gVGhlIGxpbmsgdG8gbWFuaXB1bGF0ZVxuICogQHBhcmFtcyB7YXR0cn0gVGhlIGF0dHJpYnV0ZSBuYW1lXG4gKiBAcGFyYW1zIHtkb2F0dHJ9IEJvb2xlYW4gZmxhZyB3aGV0aGVyIHRvIHNldCAodHJ1ZSkgb3IgcmVtb3ZlIChmYWxzZSkgdGhlIGF0dHJpYnV0ZVxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbmtSZWxTZXRBdHRyKCRsaW5rLCBhdHRyLCBkb2F0dHIpIHtcbiAgICBsZXQgbGlua3JlbCA9ICRsaW5rLmF0dHIoJ3JlbCcpO1xuICAgIGxldCByZWxzID0gbGlua3JlbCA/IGxpbmtyZWwuc3BsaXQoJyAnKSA6IFtdO1xuICAgIGxldCBoYXNhdHRyID0gcmVscy5pbmRleE9mKGF0dHIpID49IDA7XG4gICAgaWYgKCFoYXNhdHRyICYmIGRvYXR0cikge1xuICAgICAgICByZWxzLnVuc2hpZnQoYXR0cik7XG4gICAgICAgICRsaW5rLmF0dHIoJ3JlbCcsIHJlbHMuam9pbignICcpKTtcbiAgICB9IGVsc2UgaWYgKGhhc2F0dHIgJiYgIWRvYXR0cikge1xuICAgICAgICByZWxzLnNwbGljZShyZWxzLmluZGV4T2YoYXR0cikpO1xuICAgICAgICAkbGluay5hdHRyKCdyZWwnLCByZWxzLmpvaW4oJyAnKSk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIHN0cmluZyBvZiBhbiBIVE1MIGF0dHJpYnV0ZSwgd2hlcmUgdGhlIHZhbHVlIHBvcnRpb25cbiAqIGlzIHByb3Blcmx5IGVuY29kZWQgdG8gZGVmYW5nIGFueSBwb3RlbnRpYWwgYXR0YWNrcy5cbiAqXG4gKiBAcGFyYW0gbmFtZVxuICogQHBhcmFtIHZhbHVlXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZG9IVE1MQXR0cmlidXRlKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgPyBgICR7bmFtZX09XCIke2VuY29kZSh2YWx1ZSl9XCJgXG4gICAgICAgIDogJyc7XG59O1xuXG4vKipcbiAqIENvbXB1dGUgYW4gYWJzb2x1dGUgdnBhdGggZnJvbSBhIHJlbGF0aXZlIHBhdGggcmVmZXJlbmNlLlxuICogXG4gKiBUaGlzIGZ1bmN0aW9uIHJlc29sdmVzIGEgcmVsYXRpdmUgcGF0aCAobGlrZSBcIi4uL2ZpbGUuaHRtbFwiIG9yIFwiLi9maWxlLmh0bWxcIilcbiAqIHRvIGFuIGFic29sdXRlIHZwYXRoIGluIHRoZSB2aXJ0dWFsIGZpbGVzeXN0ZW0sIGJhc2VkIG9uIHRoZSB2cGF0aCBvZiB0aGVcbiAqIGN1cnJlbnQgZG9jdW1lbnQuXG4gKiBcbiAqIElmIHRoZSBpbnB1dCBwYXRoIGlzIGFscmVhZHkgYWJzb2x1dGUgKHN0YXJ0cyB3aXRoICcvJyksIGl0IGlzIHJldHVybmVkXG4gKiBhcy1pcyBhZnRlciBub3JtYWxpemF0aW9uLlxuICogXG4gKiBAcGFyYW0gYmFzZVZwYXRoIFRoZSB2cGF0aCBvZiB0aGUgZG9jdW1lbnQgbWFraW5nIHRoZSByZWZlcmVuY2UgKGUuZy4sIG1ldGFkYXRhLmRvY3VtZW50LnBhdGgpXG4gKiBAcGFyYW0gcmVsYXRpdmVQYXRoIFRoZSBwYXRoIHRvIHJlc29sdmUgKGNhbiBiZSByZWxhdGl2ZSBvciBhYnNvbHV0ZSlcbiAqIEByZXR1cm5zIFRoZSBhYnNvbHV0ZSB2cGF0aCBpbiB0aGUgdmlydHVhbCBmaWxlc3lzdGVtXG4gKiBcbiAqIEBleGFtcGxlXG4gKiAvLyBGcm9tIGRvY3VtZW50IGF0ICdoaWVyL2RpcjEvcGFnZS5odG1sLm1kJyByZWZlcmVuY2luZyAnLi4vc2libGluZy9maWxlLmh0bWwnXG4gKiByZXNvbHZlVnBhdGgoJ2hpZXIvZGlyMS9wYWdlLmh0bWwubWQnLCAnLi4vc2libGluZy9maWxlLmh0bWwnKVxuICogLy8gUmV0dXJuczogJy9oaWVyL3NpYmxpbmcvZmlsZS5odG1sJ1xuICogXG4gKiBAZXhhbXBsZVxuICogLy8gQWxyZWFkeSBhYnNvbHV0ZSBwYXRoXG4gKiByZXNvbHZlVnBhdGgoJ2hpZXIvZGlyMS9wYWdlLmh0bWwubWQnLCAnL2Fic29sdXRlL3BhdGguaHRtbCcpXG4gKiAvLyBSZXR1cm5zOiAnL2Fic29sdXRlL3BhdGguaHRtbCdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVWcGF0aChiYXNlVnBhdGg6IHN0cmluZywgcmVsYXRpdmVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICghYmFzZVZwYXRoIHx8IHR5cGVvZiBiYXNlVnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVzb2x2ZVZwYXRoOiBiYXNlVnBhdGggbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcsIGdvdCAke3R5cGVvZiBiYXNlVnBhdGh9YCk7XG4gICAgfVxuICAgIGlmICghcmVsYXRpdmVQYXRoIHx8IHR5cGVvZiByZWxhdGl2ZVBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVzb2x2ZVZwYXRoOiByZWxhdGl2ZVBhdGggbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcsIGdvdCAke3R5cGVvZiByZWxhdGl2ZVBhdGh9YCk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHBhdGggaXMgYWxyZWFkeSBhYnNvbHV0ZSwgcmV0dXJuIGl0IG5vcm1hbGl6ZWRcbiAgICBpZiAocGF0aC5pc0Fic29sdXRlKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIHBhdGgubm9ybWFsaXplKHJlbGF0aXZlUGF0aCk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSBkaXJlY3Rvcnkgb2YgdGhlIGJhc2UgdnBhdGhcbiAgICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoYmFzZVZwYXRoKTtcbiAgICBcbiAgICAvLyBKb2luIHdpdGggJy8nIHByZWZpeCB0byBlbnN1cmUgd2UgZ2V0IGFuIGFic29sdXRlIHZwYXRoXG4gICAgLy8gYW5kIG5vcm1hbGl6ZSB0byBjbGVhbiB1cCBhbnkgLi4gb3IgLiBzZWdtZW50c1xuICAgIHJldHVybiBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4oJy8nLCBkaXIsIHJlbGF0aXZlUGF0aCkpO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLyBSU1MgRmVlZCBHZW5lcmF0aW9uXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVJTUyhjb25maWcsIGNvbmZpZ3JzcywgZmVlZERhdGEsIGl0ZW1zLCByZW5kZXJUbykge1xuXG4gICAgLy8gU3VwcG9zZWRseSBpdCdzIHJlcXVpcmVkIHRvIHVzZSBoYXNPd25Qcm9wZXJ0eVxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNzI4MzYwL2hvdy1kby1pLWNvcnJlY3RseS1jbG9uZS1hLWphdmFzY3JpcHQtb2JqZWN0IzcyODY5NFxuICAgIC8vXG4gICAgLy8gQnV0LCBpbiBvdXIgY2FzZSB0aGF0IHJlc3VsdGVkIGluIGFuIGVtcHR5IG9iamVjdFxuXG4gICAgLy8gY29uc29sZS5sb2coJ2NvbmZpZ3JzcyAnKyB1dGlsLmluc3BlY3QoY29uZmlncnNzKSk7XG5cbiAgICAvLyBDb25zdHJ1Y3QgaW5pdGlhbCByc3Mgb2JqZWN0XG4gICAgdmFyIHJzcyA9IHt9O1xuICAgIGZvciAobGV0IGtleSBpbiBjb25maWdyc3MucnNzKSB7XG4gICAgICAgIC8vaWYgKGNvbmZpZ3Jzcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICByc3Nba2V5XSA9IGNvbmZpZ3Jzcy5yc3Nba2V5XTtcbiAgICAgICAgLy99XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coJ3JzcyAnKyB1dGlsLmluc3BlY3QocnNzKSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZygnZmVlZERhdGEgJysgdXRpbC5pbnNwZWN0KGZlZWREYXRhKSk7XG5cbiAgICAvLyBUaGVuIGZpbGwgaW4gZnJvbSBmZWVkRGF0YVxuICAgIGZvciAobGV0IGtleSBpbiBmZWVkRGF0YSkge1xuICAgICAgICAvL2lmIChmZWVkRGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICByc3Nba2V5XSA9IGZlZWREYXRhW2tleV07XG4gICAgICAgIC8vfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKCdnZW5lcmF0ZVJTUyByc3MgJysgdXRpbC5pbnNwZWN0KHJzcykpO1xuXG4gICAgdmFyIHJzc2ZlZWQgPSBuZXcgUlNTKHJzcyk7XG5cbiAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHsgcnNzZmVlZC5pdGVtKGl0ZW0pOyB9KTtcblxuICAgIHZhciB4bWwgPSByc3NmZWVkLnhtbCgpO1xuICAgIHZhciByZW5kZXJPdXQgPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCByZW5kZXJUbyk7XG5cbiAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlck91dCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pXG4gICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJPdXQsIHhtbCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuXG59O1xuXG4vLyBGb3Igb0VtYmVkLCBDb25zaWRlciBtYWtpbmcgYW4gZXh0ZXJuYWwgcGx1Z2luXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9vZW1iZWQtYWxsXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9lbWJlZGFibGVcbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL21lZGlhLXBhcnNlclxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvb2VtYmV0dGVyXG5cblxuLyoqXG4gKiBUaGUgQWthc2hhUmVuZGVyIHByb2plY3QgY29uZmlndXJhdGlvbiBvYmplY3QuICBcbiAqIE9uZSBpbnN0YW50aWF0ZXMgYSBDb25maWd1cmF0aW9uIG9iamVjdCwgdGhlbiBmaWxscyBpdFxuICogd2l0aCBzZXR0aW5ncyBhbmQgcGx1Z2lucy5cbiAqIFxuICogQHNlZSBtb2R1bGU6Q29uZmlndXJhdGlvblxuICovXG5cbi8vIGNvbnN0IF9jb25maWdfcGx1Z2luRGF0YSA9IFN5bWJvbCgncGx1Z2luRGF0YScpO1xuLy8gY29uc3QgX2NvbmZpZ19hc3NldHNEaXJzID0gU3ltYm9sKCdhc3NldHNEaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX2RvY3VtZW50RGlycyA9IFN5bWJvbCgnZG9jdW1lbnREaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX2xheW91dERpcnMgPSBTeW1ib2woJ2xheW91dERpcnMnKTtcbi8vIGNvbnN0IF9jb25maWdfcGFydGlhbERpcnMgPSBTeW1ib2woJ3BhcnRpYWxEaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX21haGFmdW5jcyA9IFN5bWJvbCgnbWFoYWZ1bmNzJyk7XG4vLyBjb25zdCBfY29uZmlnX3JlbmRlclRvID0gU3ltYm9sKCdyZW5kZXJUbycpO1xuLy8gY29uc3QgX2NvbmZpZ19tZXRhZGF0YSA9IFN5bWJvbCgnbWV0YWRhdGEnKTtcbi8vIGNvbnN0IF9jb25maWdfcm9vdF91cmwgPSBTeW1ib2woJ3Jvb3RfdXJsJyk7XG4vLyBjb25zdCBfY29uZmlnX3NjcmlwdHMgPSBTeW1ib2woJ3NjcmlwdHMnKTtcbi8vIGNvbnN0IF9jb25maWdfcGx1Z2lucyA9IFN5bWJvbCgncGx1Z2lucycpO1xuLy8gY29uc3QgX2NvbmZpZ19jaGVlcmlvID0gU3ltYm9sKCdjaGVlcmlvJyk7XG4vLyBjb25zdCBfY29uZmlnX2NvbmZpZ2RpciA9IFN5bWJvbCgnY29uZmlnZGlyJyk7XG4vLyBjb25zdCBfY29uZmlnX2NhY2hlZGlyICA9IFN5bWJvbCgnY2FjaGVkaXInKTtcbi8vIGNvbnN0IF9jb25maWdfY29uY3VycmVuY3kgPSBTeW1ib2woJ2NvbmN1cnJlbmN5Jyk7XG4vLyBjb25zdCBfY29uZmlnX3JlbmRlcmVycyA9IFN5bWJvbCgncmVuZGVyZXJzJyk7XG5cbi8qKlxuICogRGF0YSB0eXBlIGRlc2NyaWJpbmcgaXRlbXMgaW4gdGhlXG4gKiBqYXZhU2NyaXB0VG9wIGFuZCBqYXZhU2NyaXB0Qm90dG9tIGFycmF5cy5cbiAqIFRoZSBmaWVsZHMgY29ycmVzcG9uZCB0byB0aGUgYXR0cmlidXRlc1xuICogb2YgdGhlIDxzY3JpcHQ+IHRhZyB3aGljaCBjYW4gYmUgdXNlZFxuICogZWl0aGVyIGluIHRoZSB0b3Agb3IgYm90dG9tIG9mXG4gKiBhbiBIVE1MIGZpbGUuXG4gKi9cbmV4cG9ydCB0eXBlIGphdmFTY3JpcHRJdGVtID0ge1xuICAgIGhyZWY/OiBzdHJpbmcsXG4gICAgc2NyaXB0Pzogc3RyaW5nLFxuICAgIGxhbmc/OiBzdHJpbmdcbn07XG5cbmV4cG9ydCB0eXBlIHN0eWxlc2hlZXRJdGVtID0ge1xuICAgIGhyZWY/OiBzdHJpbmcsXG4gICAgbWVkaWE/OiBzdHJpbmdcblxufTtcblxuLyoqXG4gKiBEZWZpbmVzIHRoZSBzdHJ1Y3R1cmUgZm9yIGRpcmVjdG9yeVxuICogbW91bnQgc3BlY2lmaWNhdGlvbiBpbiB0aGUgQ29uZmlndXJhdGlvbi5cbiAqIFxuICogVGhlIHNpbXBsZSAnc3RyaW5nJyBmb3JtIHNheXMgdG8gbW91bnRcbiAqIHRoZSBuYW1lZCBmc3BhdGggb24gdGhlIHJvb3Qgb2YgdGhlXG4gKiB2aXJ0dWFsIGZpbGVzcGFjZS5cbiAqIFxuICogVGhlIG9iamVjdCBmb3JtIGFsbG93cyB1cyB0byBtb3VudFxuICogYW4gZnNwYXRoIGludG8gYSBkaWZmZXJlbnQgbG9jYXRpb25cbiAqIGluIHRoZSB2aXJ0dWFsIGZpbGVzcGFjZSwgdG8gaWdub3JlXG4gKiBmaWxlcyBiYXNlZCBvbiBHTE9CIHBhdHRlcm5zLCBhbmQgdG9cbiAqIGluY2x1ZGUgbWV0YWRhdGEgZm9yIGV2ZXJ5IGZpbGUgaW5cbiAqIGEgZGlyZWN0b3J5IHRyZWUuXG4gKiBcbiAqIEluIHRoZSBmaWxlLWNhY2hlIG1vZHVsZSwgdGhpcyBpc1xuICogY29udmVydGVkIHRvIHRoZSBkaXJUb1dhdGNoIHN0cnVjdHVyZVxuICogdXNlZCBieSBTdGFja2VkRGlycy5cbiAqL1xuLyoqXG4gKiBDb25maWd1cmF0aW9uIG9mIGFuIEFrYXNoYVJlbmRlciBwcm9qZWN0LCBpbmNsdWRpbmcgdGhlIGlucHV0IGRpcmVjdG9yaWVzLFxuICogb3V0cHV0IGRpcmVjdG9yeSwgcGx1Z2lucywgYW5kIHZhcmlvdXMgc2V0dGluZ3MuXG4gKlxuICogVVNBR0U6XG4gKlxuICogY29uc3QgYWthc2hhID0gcmVxdWlyZSgnYWthc2hhcmVuZGVyJyk7XG4gKiBjb25zdCBjb25maWcgPSBuZXcgYWthc2hhLkNvbmZpZ3VyYXRpb24oKTtcbiAqL1xuZXhwb3J0IGNsYXNzIENvbmZpZ3VyYXRpb24ge1xuICAgICNyZW5kZXJlcnM6IFJlbmRlcmVycy5Db25maWd1cmF0aW9uO1xuICAgICNjb25maWdkaXI6IHN0cmluZztcbiAgICAjY2FjaGVkaXI6IHN0cmluZztcbiAgICAjYXNzZXRzRGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjbGF5b3V0RGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjZG9jdW1lbnREaXJzPzogZGlyVG9Nb3VudFtdO1xuICAgICNwYXJ0aWFsRGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjbWFoYWZ1bmNzO1xuICAgICNjaGVlcmlvPzogY2hlZXJpby5DaGVlcmlvT3B0aW9ucztcbiAgICAjcmVuZGVyVG86IHN0cmluZztcbiAgICAjc2NyaXB0cz86IHtcbiAgICAgICAgc3R5bGVzaGVldHM/OiBzdHlsZXNoZWV0SXRlbVtdLFxuICAgICAgICBqYXZhU2NyaXB0VG9wPzogamF2YVNjcmlwdEl0ZW1bXSxcbiAgICAgICAgamF2YVNjcmlwdEJvdHRvbT86IGphdmFTY3JpcHRJdGVtW11cbiAgICB9O1xuICAgICNjb25jdXJyZW5jeTogbnVtYmVyO1xuICAgICNjYWNoaW5nVGltZW91dDogbnVtYmVyO1xuICAgICNtZXRhZGF0YTogYW55O1xuICAgICNyb290X3VybDogc3RyaW5nO1xuICAgICNwbHVnaW5zO1xuICAgICNwbHVnaW5EYXRhO1xuICAgICN2ZXJib3NlOiBib29sZWFuO1xuICAgICNwZXJmRGF0YURpcjogc3RyaW5nO1xuICAgICNkZWNvbW1lbnQ6IGJvb2xlYW47XG4gICAgXG4gICAgY29uc3RydWN0b3IobW9kdWxlcGF0aCkge1xuXG4gICAgICAgIC8vIHRoaXNbX2NvbmZpZ19yZW5kZXJlcnNdID0gW107XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycyA9IG5ldyBSZW5kZXJlcnMuQ29uZmlndXJhdGlvbih7XG4gICAgICAgICAgICBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy4jbWFoYWZ1bmNzID0gW107XG4gICAgICAgIHRoaXMuI3NjcmlwdHMgPSB7XG4gICAgICAgICAgICBzdHlsZXNoZWV0czogW10sXG4gICAgICAgICAgICBqYXZhU2NyaXB0VG9wOiBbXSxcbiAgICAgICAgICAgIGphdmFTY3JpcHRCb3R0b206IFtdXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy4jY29uY3VycmVuY3kgPSAzO1xuICAgICAgICAvLyA2MCBzZWNvbmRzLCBvciAxIG1pbnV0ZVxuICAgICAgICB0aGlzLiNjYWNoaW5nVGltZW91dCA9IDYwMDAwO1xuXG4gICAgICAgIHRoaXMuI2RvY3VtZW50RGlycyA9IFtdO1xuICAgICAgICB0aGlzLiNsYXlvdXREaXJzID0gW107XG4gICAgICAgIHRoaXMuI3BhcnRpYWxEaXJzID0gW107XG4gICAgICAgIHRoaXMuI2Fzc2V0c0RpcnMgPSBbXTtcblxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MgPSBbXTtcblxuICAgICAgICB0aGlzLiNyZW5kZXJUbyA9ICdvdXQnO1xuXG4gICAgICAgIHRoaXMuI21ldGFkYXRhID0ge30gYXMgYW55O1xuXG4gICAgICAgIHRoaXMuI3BsdWdpbnMgPSBbXTtcbiAgICAgICAgdGhpcy4jcGx1Z2luRGF0YSA9IFtdO1xuICAgICAgICBcbiAgICAgICAgdGhpcy4jdmVyYm9zZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuI2RlY29tbWVudCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuI3BlcmZEYXRhRGlyID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIC8qXG4gICAgICAgICAqIElzIHRoaXMgdGhlIGJlc3QgcGxhY2UgZm9yIHRoaXM/ICBJdCBpcyBuZWNlc3NhcnkgdG9cbiAgICAgICAgICogY2FsbCB0aGlzIGZ1bmN0aW9uIHNvbWV3aGVyZS4gIFRoZSBuYXR1cmUgb2YgdGhpcyBmdW5jdGlvblxuICAgICAgICAgKiBpcyB0aGF0IGl0IGNhbiBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMgd2l0aCBubyBpbXBhY3QuICBcbiAgICAgICAgICogQnkgYmVpbmcgbG9jYXRlZCBoZXJlLCBpdCB3aWxsIGFsd2F5cyBiZSBjYWxsZWQgYnkgdGhlXG4gICAgICAgICAqIHRpbWUgYW55IENvbmZpZ3VyYXRpb24gaXMgZ2VuZXJhdGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgLy8gVGhpcyBpcyBleGVjdXRlZCBpbiBAYWthc2hhY21zL3JlbmRlcmVyc1xuICAgICAgICAvLyB0aGlzW19jb25maWdfcmVuZGVyZXJzXS5yZWdpc3RlckJ1aWx0SW5SZW5kZXJlcnMoKTtcblxuICAgICAgICAvLyBQcm92aWRlIGEgbWVjaGFuaXNtIHRvIGVhc2lseSBzcGVjaWZ5IGNvbmZpZ0RpclxuICAgICAgICAvLyBUaGUgcGF0aCBpbiBjb25maWdEaXIgbXVzdCBiZSB0aGUgcGF0aCBvZiB0aGUgY29uZmlndXJhdGlvbiBmaWxlLlxuICAgICAgICAvLyBUaGVyZSBkb2Vzbid0IGFwcGVhciB0byBiZSBhIHdheSB0byBkZXRlcm1pbmUgdGhhdCBmcm9tIGhlcmUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEZvciBleGFtcGxlIG1vZHVsZS5wYXJlbnQuZmlsZW5hbWUgaW4gdGhpcyBjYXNlIHBvaW50c1xuICAgICAgICAvLyB0byBha2FzaGFyZW5kZXIvaW5kZXguanMgYmVjYXVzZSB0aGF0J3MgdGhlIG1vZHVsZSB3aGljaFxuICAgICAgICAvLyBsb2FkZWQgdGhpcyBtb2R1bGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIE9uZSBjb3VsZCBpbWFnaW5lIGEgZGlmZmVyZW50IGluaXRpYWxpemF0aW9uIHBhdHRlcm4uICBJbnN0ZWFkXG4gICAgICAgIC8vIG9mIGFrYXNoYXJlbmRlciByZXF1aXJpbmcgQ29uZmlndXJhdGlvbi5qcywgdGhhdCBmaWxlIGNvdWxkIGJlXG4gICAgICAgIC8vIHJlcXVpcmVkIGJ5IHRoZSBjb25maWd1cmF0aW9uIGZpbGUuICBJbiBzdWNoIGEgY2FzZVxuICAgICAgICAvLyBtb2R1bGUucGFyZW50LmZpbGVuYW1lIFdPVUxEIGluZGljYXRlIHRoZSBmaWxlbmFtZSBmb3IgdGhlXG4gICAgICAgIC8vIGNvbmZpZ3VyYXRpb24gZmlsZSwgYW5kIHdvdWxkIGJlIGEgc291cmNlIG9mIHNldHRpbmdcbiAgICAgICAgLy8gdGhlIGNvbmZpZ0RpciB2YWx1ZS5cbiAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGVwYXRoICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGVwYXRoICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ0RpciA9IHBhdGguZGlybmFtZShtb2R1bGVwYXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZlcnkgY2FyZWZ1bGx5IGFkZCB0aGUgPHBhcnRpYWw+IHN1cHBvcnQgZnJvbSBNYWhhYmh1dGEgYXMgdGhlXG4gICAgICAgIC8vIHZlcnkgZmlyc3QgdGhpbmcgc28gdGhhdCBpdCBleGVjdXRlcyBiZWZvcmUgYW55dGhpbmcgZWxzZS5cbiAgICAgICAgbGV0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIHRoaXMuYWRkTWFoYWJodXRhKG1haGFQYXJ0aWFsLm1haGFiaHV0YUFycmF5KHtcbiAgICAgICAgICAgIHJlbmRlclBhcnRpYWw6IGZ1bmN0aW9uKGZuYW1lLCBtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gdmFsdWVzIGZvciBhbnl0aGluZyB3aGljaCBoYXMgbm90XG4gICAgICogYWxyZWFkeSBiZWVuIGNvbmZpZ3VyZWQuICBTb21lIGJ1aWx0LWluIGRlZmF1bHRzIGhhdmUgYmVlbiBkZWNpZGVkXG4gICAgICogYWhlYWQgb2YgdGltZS4gIEZvciBlYWNoIGNvbmZpZ3VyYXRpb24gc2V0dGluZywgaWYgbm90aGluZyBoYXMgYmVlblxuICAgICAqIGRlY2xhcmVkLCB0aGVuIHRoZSBkZWZhdWx0IGlzIHN1YnN0aXR1dGVkLlxuICAgICAqXG4gICAgICogSXQgaXMgZXhwZWN0ZWQgdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBsYXN0IGluIHRoZSBjb25maWcgZmlsZS5cbiAgICAgKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gaW5zdGFsbHMgdGhlIGBidWlsdC1pbmAgcGx1Z2luLiAgSXQgbmVlZHMgdG8gYmUgbGFzdCBvblxuICAgICAqIHRoZSBwbHVnaW4gY2hhaW4gc28gdGhhdCBpdHMgc3R5bGVzaGVldHMgYW5kIHBhcnRpYWxzIGFuZCB3aGF0bm90XG4gICAgICogY2FuIGJlIG92ZXJyaWRkZW4gYnkgb3RoZXIgcGx1Z2lucy5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHByZXBhcmUoKSB7XG5cbiAgICAgICAgY29uc3QgQ09ORklHID0gdGhpcztcblxuICAgICAgICBjb25zdCBjb25maWdEaXJQYXRoID0gZnVuY3Rpb24oZGlybm0pIHtcbiAgICAgICAgICAgIGxldCBjb25maWdQYXRoID0gZGlybm07XG4gICAgICAgICAgICBpZiAodHlwZW9mIENPTkZJRy5jb25maWdEaXIgIT09ICd1bmRlZmluZWQnICYmIENPTkZJRy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZ1BhdGggPSBwYXRoLmpvaW4oQ09ORklHLmNvbmZpZ0RpciwgZGlybm0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZ1BhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3RhdDtcblxuICAgICAgICBjb25zdCBjYWNoZURpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnY2FjaGUnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNjYWNoZWRpcikge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY2FjaGVEaXJzUGF0aClcbiAgICAgICAgICAgICAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGNhY2hlRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWNoZURpciA9ICdjYWNoZSc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ2NhY2hlJyBpcyBub3QgYSBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmMoY2FjaGVEaXJzUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWNoZURpciA9ICdjYWNoZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy4jY2FjaGVkaXIgJiYgIWZzLmV4aXN0c1N5bmModGhpcy4jY2FjaGVkaXIpKSB7XG4gICAgICAgICAgICBmcy5ta2RpclN5bmModGhpcy4jY2FjaGVkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXNzZXRzRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdhc3NldHMnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNhc3NldHNEaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhhc3NldHNEaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhhc3NldHNEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEFzc2V0c0RpcignYXNzZXRzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGF5b3V0c0RpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnbGF5b3V0cycpO1xuICAgICAgICBpZiAoIXRoaXMuI2xheW91dERpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGxheW91dHNEaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhsYXlvdXRzRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRMYXlvdXRzRGlyKCdsYXlvdXRzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFydGlhbERpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgncGFydGlhbHMnKTtcbiAgICAgICAgaWYgKCFtYWhhUGFydGlhbC5jb25maWd1cmF0aW9uLnBhcnRpYWxEaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXJ0aWFsRGlyc1BhdGgpICYmIChzdGF0ID0gZnMuc3RhdFN5bmMocGFydGlhbERpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkUGFydGlhbHNEaXIoJ3BhcnRpYWxzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnREaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2RvY3VtZW50cycpO1xuICAgICAgICBpZiAoIXRoaXMuI2RvY3VtZW50RGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZG9jdW1lbnREaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhkb2N1bWVudERpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRG9jdW1lbnRzRGlyKCdkb2N1bWVudHMnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInZG9jdW1lbnRzJyBpcyBub3QgYSBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyAnZG9jdW1lbnREaXJzJyBzZXR0aW5nLCBhbmQgbm8gJ2RvY3VtZW50cycgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVuZGVyVG9QYXRoID0gY29uZmlnRGlyUGF0aCgnb3V0Jyk7XG4gICAgICAgIGlmICghdGhpcy4jcmVuZGVyVG8pICB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhyZW5kZXJUb1BhdGgpXG4gICAgICAgICAgICAgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhyZW5kZXJUb1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRSZW5kZXJEZXN0aW5hdGlvbignb3V0Jyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ291dCcgaXMgbm90IGEgZGlyZWN0b3J5XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKHJlbmRlclRvUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRSZW5kZXJEZXN0aW5hdGlvbignb3V0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy4jcmVuZGVyVG8gJiYgIWZzLmV4aXN0c1N5bmModGhpcy4jcmVuZGVyVG8pKSB7XG4gICAgICAgICAgICBmcy5ta2RpclN5bmModGhpcy4jcmVuZGVyVG8sIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGFrYXNoYWNtcy1idWlsdGluIHBsdWdpbiBuZWVkcyB0byBiZSBsYXN0IG9uIHRoZSBjaGFpbiBzbyB0aGF0XG4gICAgICAgIC8vIGl0cyBwYXJ0aWFscyBldGMgY2FuIGJlIGVhc2lseSBvdmVycmlkZGVuLiAgVGhpcyBpcyB0aGUgbW9zdCBjb252ZW5pZW50XG4gICAgICAgIC8vIHBsYWNlIHRvIGRlY2xhcmUgdGhhdCBwbHVnaW4uXG4gICAgICAgIC8vXG5cbiAgICAgICAgLy8gTm9ybWFsbHkgd2UnZCBkbyByZXF1aXJlKCcuL2J1aWx0LWluLmpzJykuXG4gICAgICAgIC8vIEJ1dCwgaW4gdGhpcyBjb250ZXh0IHRoYXQgZG9lc24ndCB3b3JrLlxuICAgICAgICAvLyBXaGF0IHdlIGRpZCBpcyB0byBpbXBvcnQgdGhlXG4gICAgICAgIC8vIEJ1aWx0SW5QbHVnaW4gY2xhc3MgZWFybGllciBzbyB0aGF0XG4gICAgICAgIC8vIGl0IGNhbiBiZSB1c2VkIGhlcmUuXG4gICAgICAgIHRoaXMudXNlKEJ1aWx0SW5QbHVnaW4sIHtcbiAgICAgICAgICAgIC8vIGJ1aWx0LWluIG9wdGlvbnMgaWYgYW55XG4gICAgICAgICAgICAvLyBEbyBub3QgbmVlZCB0aGlzIGhlcmUgYW55IGxvbmdlciBiZWNhdXNlIGl0IGlzIGhhbmRsZWRcbiAgICAgICAgICAgIC8vIGluIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgICAgICAgIC8vIFNldCB1cCB0aGUgTWFoYWJodXRhIHBhcnRpYWwgdGFnIHNvIGl0IHJlbmRlcnMgdGhyb3VnaCBBa2FzaGFSZW5kZXJcbiAgICAgICAgICAgIC8vIHJlbmRlclBhcnRpYWw6IGZ1bmN0aW9uKGZuYW1lLCBtZXRhZGF0YSkge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiByZW5kZXIucGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlY29yZCB0aGUgY29uZmlndXJhdGlvbiBkaXJlY3Rvcnkgc28gdGhhdCB3ZSBjYW4gY29ycmVjdGx5IGludGVycG9sYXRlXG4gICAgICogdGhlIHBhdGhuYW1lcyB3ZSdyZSBwcm92aWRlZC5cbiAgICAgKi9cbiAgICBzZXQgY29uZmlnRGlyKGNmZ2Rpcjogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2ZnZGlyID09PSAnc3RyaW5nJ1xuICAgICAgICAgJiYgY2ZnZGlyLmxlbmd0aCA+PSAxXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy4jY29uZmlnZGlyID0gY2ZnZGlyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb25maWdEaXIgbXVzdCBiZSBnaXZlbiBhIHN0cmluZ2ApO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBjb25maWdEaXIoKSB7IHJldHVybiB0aGlzLiNjb25maWdkaXI7IH1cblxuICAgIHNldCBjYWNoZURpcihkaXJubTogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGlybm0gPT09ICdzdHJpbmcnXG4gICAgICAgICAmJiBkaXJubS5sZW5ndGggPj0gMVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuI2NhY2hlZGlyID0gZGlybm07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNhY2hlRGlyIG11c3QgYmUgZ2l2ZW4gYSBzdHJpbmdgKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgY2FjaGVEaXIoKSB7IHJldHVybiB0aGlzLiNjYWNoZWRpcjsgfVxuXG4gICAgc2V0IHZlcmJvc2UodmFsOiBib29sZWFuKSB7IHRoaXMuI3ZlcmJvc2UgPSB2YWw7IH1cbiAgICBnZXQgdmVyYm9zZSgpIHsgcmV0dXJuIHRoaXMuI3ZlcmJvc2U7IH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgZGlyZWN0b3J5IGluIHdoaWNoIHRvIHN0b3JlIHBlcmZvcm1hbmNlIGRhdGEuXG4gICAgICogSWYgdGhlIHZhbHVlIGlzIHVuZGVmaW5lZCBvciBudWxsLCB0aGVuIHBlcmZvcm1hbmNlIGRhdGFcbiAgICAgKiBjb2xsZWN0aW9uIGlzIGRpc2FibGVkLlxuICAgICAqL1xuICAgIHNldCBwZXJmRGF0YURpcihzdG9yZURpcjogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc3RvcmVEaXIgPT09ICd1bmRlZmluZWQnXG4gICAgICAgICB8fCBzdG9yZURpciA9PT0gbnVsbFxuICAgICAgICAgfHwgdHlwZW9mIHN0b3JlRGlyID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuI3BlcmZEYXRhRGlyID0gc3RvcmVEaXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHBlcmZEYXRhRGlyIG11c3QgYmUgZ2l2ZW4gZWl0aGVyIHVuZGVmaW5lZCwgbnVsbCwgb3IgYSBzdHJpbmdgKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgcGVyZkRhdGFEaXIoKSB7IHJldHVybiB0aGlzLiNwZXJmRGF0YURpcjsgfVxuXG4gICAgZ2V0IGRlY29tbWVudCgpIHsgcmV0dXJuIHRoaXMuI2RlY29tbWVudDsgfVxuICAgIHNldCBkZWNvbW1lbnQodmFsOiBib29sZWFuKSB7IHRoaXMuI2RlY29tbWVudCA9IHZhbDsgfVxuXG4gICAgLy8gc2V0IGFrYXNoYShfYWthc2hhKSAgeyB0aGlzW19jb25maWdfYWthc2hhXSA9IF9ha2FzaGE7IH1cbiAgICBnZXQgYWthc2hhKCkgeyByZXR1cm4gbW9kdWxlX2V4cG9ydHM7IH1cblxuICAgIGFzeW5jIGRvY3VtZW50c0NhY2hlKCkgeyByZXR1cm4gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlOyB9XG4gICAgYXN5bmMgYXNzZXRzQ2FjaGUoKSAgICB7IHJldHVybiBmaWxlY2FjaGUuYXNzZXRzQ2FjaGU7IH1cbiAgICBhc3luYyBsYXlvdXRzQ2FjaGUoKSAgIHsgcmV0dXJuIGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGU7IH1cbiAgICBhc3luYyBwYXJ0aWFsc0NhY2hlKCkgIHsgcmV0dXJuIGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIGRvY3VtZW50RGlycyBjb25maWd1cmF0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBkaXJUb01vdW50fSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZSBvciBkaXJUb01vdW50IG9iamVjdFxuICAgICAqL1xuICAgIGFkZERvY3VtZW50c0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZERvY3VtZW50c0RpciAtIGludmFsaWQgZGlyVG9Nb3VudCBvYmplY3Q6ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy4jZG9jdW1lbnREaXJzLnB1c2goZGlyTW91bnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgZG9jdW1lbnREaXJzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4jZG9jdW1lbnREaXJzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvb2sgdXAgdGhlIGRvY3VtZW50IGRpcmVjdG9yeSBpbmZvcm1hdGlvbiBmb3IgYSBnaXZlbiBkb2N1bWVudCBkaXJlY3RvcnkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRpcm5hbWUgVGhlIGRvY3VtZW50IGRpcmVjdG9yeSB0byBzZWFyY2ggZm9yXG4gICAgICovXG4gICAgZG9jdW1lbnREaXJJbmZvKGRpcm5hbWU6IHN0cmluZykge1xuICAgICAgICBmb3IgKHZhciBkb2NEaXIgb2YgdGhpcy5kb2N1bWVudERpcnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jRGlyID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGlmIChkb2NEaXIuc3JjID09PSBkaXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2NEaXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChkb2NEaXIgPT09IGRpcm5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jRGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBsYXlvdXREaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgZGlyVG9Nb3VudH0gZGlyIFRoZSBwYXRobmFtZSB0byB1c2Ugb3IgZGlyVG9Nb3VudCBvYmplY3RcbiAgICAgKi9cbiAgICBhZGRMYXlvdXRzRGlyKGRpcjogc3RyaW5nIHwgZGlyVG9Nb3VudCkge1xuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpcikgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAuLi5kaXIsXG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzRGlyVG9Nb3VudChkaXJNb3VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkTGF5b3V0c0RpciAtIGludmFsaWQgZGlyVG9Nb3VudCBvYmplY3Q6ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy4jbGF5b3V0RGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLmFkZExheW91dERpcihkaXJNb3VudC5zcmMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbGF5b3V0RGlycygpIHsgcmV0dXJuIHRoaXMuI2xheW91dERpcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgcGFydGlhbERpcnMgY29uZmlndXJ0aW9uIGFycmF5XG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCBkaXJUb01vdW50fSBkaXIgVGhlIHBhdGhuYW1lIHRvIHVzZSBvciBkaXJUb01vdW50IG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZFBhcnRpYWxzRGlyKGRpcjogc3RyaW5nIHwgZGlyVG9Nb3VudCkge1xuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpcikgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAuLi5kaXIsXG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzRGlyVG9Nb3VudChkaXJNb3VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkUGFydGlhbHNEaXIgLSBpbnZhbGlkIGRpclRvTW91bnQgb2JqZWN0OiAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI3BhcnRpYWxEaXJzLnB1c2goZGlyTW91bnQpO1xuICAgICAgICB0aGlzLiNyZW5kZXJlcnMuYWRkUGFydGlhbERpcihkaXJNb3VudC5zcmMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcGFydGlhbHNEaXJzKCkgeyByZXR1cm4gdGhpcy4jcGFydGlhbERpcnM7IH1cbiAgICBnZXQgcGFydGlhbERpcnMoKSB7IHJldHVybiB0aGlzLiNwYXJ0aWFsRGlyczsgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgYXNzZXREaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgZGlyVG9Nb3VudH0gZGlyIFRoZSBwYXRobmFtZSB0byB1c2Ugb3IgZGlyVG9Nb3VudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRBc3NldHNEaXIoZGlyOiBzdHJpbmcgfCBkaXJUb01vdW50KSB7XG4gICAgICAgIGxldCBkaXJNb3VudDogZGlyVG9Nb3VudDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmRpcixcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghaXNEaXJUb01vdW50KGRpck1vdW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGRBc3NldHNEaXIgLSBpbnZhbGlkIGRpclRvTW91bnQgb2JqZWN0OiAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2Fzc2V0c0RpcnMucHVzaChkaXJNb3VudCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBhc3NldERpcnMoKSB7IHJldHVybiB0aGlzLiNhc3NldHNEaXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYW4gYXJyYXkgb2YgTWFoYWJodXRhIGZ1bmN0aW9uc1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IG1haGFmdW5jc1xuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZE1haGFiaHV0YShtYWhhZnVuY3M6IG1haGFiaHV0YS5NYWhhZnVuY0FycmF5IHwgbWFoYWJodXRhLk1haGFmdW5jVHlwZSkge1xuICAgICAgICBpZiAodHlwZW9mIG1haGFmdW5jcyA9PT0gJ3VuZGVmaW5lZCcgfHwgIW1haGFmdW5jcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmRlZmluZWQgbWFoYWZ1bmNzIGluICR7dGhpcy5jb25maWdEaXJ9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jbWFoYWZ1bmNzLnB1c2gobWFoYWZ1bmNzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IG1haGFmdW5jcygpIHsgcmV0dXJuIHRoaXMuI21haGFmdW5jczsgfVxuXG4gICAgLyoqXG4gICAgICogRGVmaW5lIHRoZSBkaXJlY3RvcnkgaW50byB3aGljaCB0aGUgcHJvamVjdCBpcyByZW5kZXJlZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlyIFRoZSBwYXRobmFtZSB0byB1c2VcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBzZXRSZW5kZXJEZXN0aW5hdGlvbihkaXI6IHN0cmluZykge1xuICAgICAgICBpZiAodHlwZW9mIGRpciAhPT0gJ3N0cmluZydcbiAgICAgICAgIHx8IGRpci5sZW5ndGggPD0gMFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2V0UmVuZGVyRGVzdGluYXRpb24gbXVzdCBiZSBnaXZlbiBhIHN0cmluZ2ApO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIHdlIGhhdmUgYSBjb25maWdEaXIsIGFuZCBpdCdzIGEgcmVsYXRpdmUgZGlyZWN0b3J5LCBtYWtlIGl0XG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBjb25maWdEaXJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJyAmJiAhcGF0aC5pc0Fic29sdXRlKGRpcikpIHtcbiAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jcmVuZGVyVG8gPSBkaXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBGZXRjaCB0aGUgZGVjbGFyZWQgZGVzdGluYXRpb24gZm9yIHJlbmRlcmluZyB0aGUgcHJvamVjdC4gKi9cbiAgICBnZXQgcmVuZGVyRGVzdGluYXRpb24oKSB7IHJldHVybiB0aGlzLiNyZW5kZXJUbzsgfVxuICAgIGdldCByZW5kZXJUbygpIHsgcmV0dXJuIHRoaXMuI3JlbmRlclRvOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSB2YWx1ZSB0byB0aGUgcHJvamVjdCBtZXRhZGF0YS4gIFRoZSBtZXRhZGF0YSBpcyBjb21iaW5lZCB3aXRoXG4gICAgICogdGhlIGRvY3VtZW50IG1ldGFkYXRhIGFuZCB1c2VkIGR1cmluZyByZW5kZXJpbmcuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGluZGV4IFRoZSBrZXkgdG8gc3RvcmUgdGhlIHZhbHVlLlxuICAgICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc3RvcmUgaW4gdGhlIG1ldGFkYXRhLlxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZE1ldGFkYXRhKGluZGV4OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdmFyIG1kID0gdGhpcy4jbWV0YWRhdGE7XG4gICAgICAgIG1kW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgbWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLiNtZXRhZGF0YTsgfVxuXG4gICAgI2Rlc2NyaXB0aW9uczogVGFnRGVzY3JpcHRpb25bXTtcblxuICAgIC8qKlxuICAgICAqIEFkZCB0YWcgZGVzY3JpcHRpb25zIHRvIHRoZSBkYXRhYmFzZS4gIFRoZSBwdXJwb3NlXG4gICAgICogaXMgZm9yIGV4YW1wbGUgYSB0YWcgaW5kZXggcGFnZSBjYW4gZ2l2ZSBhXG4gICAgICogZGVzY3JpcHRpb24gYXQgdGhlIHRvcCBvZiB0aGUgcGFnZS5cbiAgICAgKlxuICAgICAqIE5PVEU6IFBvdGVudGlhbCBidWcgLSBUaGlzIGZ1bmN0aW9uIHJlcGxhY2VzIHRoZSBlbnRpcmUgI2Rlc2NyaXB0aW9uc1xuICAgICAqIGFycmF5IHJhdGhlciB0aGFuIG1lcmdpbmcgd2l0aCBleGlzdGluZyBkZXNjcmlwdGlvbnMuIElmIGNhbGxlZCBtdWx0aXBsZVxuICAgICAqIHRpbWVzLCBlYXJsaWVyIGRlc2NyaXB0aW9ucyB3aWxsIGJlIGxvc3QuIEN1cnJlbnQgYXNzdW1wdGlvbiBpcyB0aGlzXG4gICAgICogZnVuY3Rpb24gaXMgb25seSBjYWxsZWQgb25jZSBmcm9tIHRoZSBjb25maWd1cmF0aW9uIGZpbGUuIEEgZnV0dXJlXG4gICAgICogZW5oYW5jZW1lbnQgd291bGQgYmUgdG8gbWVyZ2UgZGVzY3JpcHRpb25zIGluc3RlYWQgb2YgcmVwbGFjaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhZ2Rlc2NzIFxuICAgICAqL1xuICAgIGFzeW5jIGFkZFRhZ0Rlc2NyaXB0aW9ucyh0YWdkZXNjczogVGFnRGVzY3JpcHRpb25bXSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodGFnZGVzY3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZFRhZ0Rlc2NyaXB0aW9ucyBtdXN0IGJlIGdpdmVuIGFuIGFycmF5IG9mIHRhZyBkZXNjcmlwdGlvbnNgKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGRlc2Mgb2YgdGFnZGVzY3MpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVzYy50YWdOYW1lICE9PSAnc3RyaW5nJ1xuICAgICAgICAgICAgIHx8IHR5cGVvZiBkZXNjLmRlc2NyaXB0aW9uICE9PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5jb3JyZWN0IHRhZyBkZXNjcmlwdGlvbiAke3V0aWwuaW5zcGVjdChkZXNjKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBtZXJnaW5nIHdpdGggZXhpc3RpbmcgZGVzY3JpcHRpb25zIGluc3RlYWQgb2YgcmVwbGFjaW5nXG4gICAgICAgIHRoaXMuI2Rlc2NyaXB0aW9ucyA9IHRhZ2Rlc2NzO1xuICAgIH1cblxuICAgIGFzeW5jICNzYXZlRGVzY3JpcHRpb25zVG9EQigpIHtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLiNkZXNjcmlwdGlvbnMpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRlc2Mgb2YgdGhpcy4jZGVzY3JpcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZG9jdW1lbnRzLmFkZFRhZ0Rlc2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICBkZXNjLnRhZ05hbWUsIGRlc2MuZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBEb2N1bWVudCB0aGUgVVJMIGZvciBhIHdlYnNpdGUgcHJvamVjdCwgcmV0dXJuaW5nXG4gICAgKiB0aGUgY29uZmlndXJhdGlvbiBvYmplY3QuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gcm9vdF91cmxcbiAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICovXG4gICAgcm9vdFVSTChyb290X3VybDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB1ID0gbmV3IFVSTChyb290X3VybCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByb290VVJMIG11c3QgYmUgZ2l2ZW4gYSB2YWxpZCBVUkw6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jcm9vdF91cmwgPSByb290X3VybDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBjdXJyZW50IFVSTCBmb3IgdGhlIHdlYnNpdGUuXG4gICAgICovXG4gICAgZ2V0IHJvb3RfdXJsKCkgeyByZXR1cm4gdGhpcy4jcm9vdF91cmw7IH1cblxuICAgIC8qKlxuICAgICAqIFNldCBob3cgbWFueSBkb2N1bWVudHMgdG8gcmVuZGVyIGNvbmN1cnJlbnRseSxcbiAgICAgKiByZXR1cm5pbmcgdGhlIGNvbmZpZ3VyYXRpb24gb2JqZWN0LiAgVGhlIG51bWJlclxuICAgICAqIG11c3QgYmUgaW4gdGhlIHJhbmdlIFswLi41MF0uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGNvbmN1cnJlbmN5XG4gICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBzZXRDb25jdXJyZW5jeShjb25jdXJyZW5jeTogbnVtYmVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uY3VycmVuY3kgPT09ICdudW1iZXInXG4gICAgICAgICAmJiBjb25jdXJyZW5jeSA+PSAwXG4gICAgICAgICAmJiBjb25jdXJyZW5jeSA8PSA1MFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuI2NvbmN1cnJlbmN5ID0gY29uY3VycmVuY3k7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNldENvbmN1cnJlbmN5IG11c3QgYmUgZ2l2ZW4gYSBwb3N0aXZlIG51bWJlciBsZXNzIHRoYW4gNTBgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgcmVuZGVyIGNvbmN1cnJlbmN5LlxuICAgICAqL1xuICAgIGdldCBjb25jdXJyZW5jeSgpIHsgcmV0dXJuIHRoaXMuI2NvbmN1cnJlbmN5OyB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHRpbWUsIGluIG1pbGlzZWNvbmRzLCB0byBob25vclxuICAgICAqIHRoZSBTZWFyY2hDYWNoZSBpbiB0aGUgc2VhcmNoIGZ1bmN0aW9uLlxuICAgICAqIFxuICAgICAqIERlZmF1bHQgaXMgNjAwMDAgKDEgbWludXRlKS5cbiAgICAgKiBcbiAgICAgKiBTZXQgdG8gMCB0byBkaXNhYmxlIGNhY2hpbmcuXG4gICAgICogQHBhcmFtIHRpbWVvdXQgXG4gICAgICovXG4gICAgc2V0Q2FjaGluZ1RpbWVvdXQodGltZW91dDogbnVtYmVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGltZW91dCA9PT0gJ251bWJlcidcbiAgICAgICAgICYmIHRpbWVvdXQgPj0gMFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuI2NhY2hpbmdUaW1lb3V0ID0gdGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2V0Q2FjaGluZ1RpbWVvdXQgbXVzdCBiZSBnaXZlbiBhIHBvc3RpdmUgbnVtYmVyYCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHNldFNlYXJjaENhY2hlVGltZW91dCAke3RoaXMuI3NlYXJjaENhY2hlVGltZW91dH1gKTtcbiAgICB9XG5cbiAgICBnZXQgY2FjaGluZ1RpbWVvdXQoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2hDYWNoZVRpbWVvdXQgJHt0aGlzLiNzZWFyY2hDYWNoZVRpbWVvdXR9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLiNjYWNoaW5nVGltZW91dDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsYXJlIEphdmFTY3JpcHQgdG8gYWRkIHdpdGhpbiB0aGUgaGVhZCB0YWcgb2YgcmVuZGVyZWQgcGFnZXMuXG4gICAgICogQHBhcmFtIHNjcmlwdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEhlYWRlckphdmFTY3JpcHQoc2NyaXB0OiBqYXZhU2NyaXB0SXRlbSkge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLmphdmFTY3JpcHRUb3AucHVzaChzY3JpcHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgc2NyaXB0cygpIHsgcmV0dXJuIHRoaXMuI3NjcmlwdHM7IH1cblxuICAgIC8qKlxuICAgICAqIERlY2xhcmUgSmF2YVNjcmlwdCB0byBhZGQgYXQgdGhlIGJvdHRvbSBvZiByZW5kZXJlZCBwYWdlcy5cbiAgICAgKiBAcGFyYW0gc2NyaXB0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkRm9vdGVySmF2YVNjcmlwdChzY3JpcHQ6IGphdmFTY3JpcHRJdGVtKSB7XG4gICAgICAgIHRoaXMuI3NjcmlwdHMuamF2YVNjcmlwdEJvdHRvbS5wdXNoKHNjcmlwdCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlY2xhcmUgYSBDU1MgU3R5bGVzaGVldCB0byBhZGQgd2l0aGluIHRoZSBoZWFkIHRhZyBvZiByZW5kZXJlZCBwYWdlcy5cbiAgICAgKiBAcGFyYW0gc2NyaXB0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkU3R5bGVzaGVldChjc3M6IHN0eWxlc2hlZXRJdGVtKSB7XG4gICAgICAgIHRoaXMuI3NjcmlwdHMuc3R5bGVzaGVldHMucHVzaChjc3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRNYWhhYmh1dGFDb25maWcoY2hlZXJpbz86IGNoZWVyaW8uQ2hlZXJpb09wdGlvbnMpIHtcbiAgICAgICAgdGhpcy4jY2hlZXJpbyA9IGNoZWVyaW87XG5cbiAgICAgICAgLy8gRm9yIGNoZWVyaW8gMS4wLjAtcmMuMTAgd2UgbmVlZCB0byB1c2UgdGhpcyBzZXR0aW5nLlxuICAgICAgICAvLyBJZiB0aGUgY29uZmlndXJhdGlvbiBoYXMgc2V0IHRoaXMsIHdlIG11c3Qgbm90XG4gICAgICAgIC8vIG92ZXJyaWRlIHRoZWlyIHNldHRpbmcuICBCdXQsIGdlbmVyYWxseSwgZm9yIGNvcnJlY3RcbiAgICAgICAgLy8gb3BlcmF0aW9uIGFuZCBoYW5kbGluZyBvZiBNYWhhYmh1dGEgdGFncywgd2UgbmVlZFxuICAgICAgICAvLyB0aGlzIHNldHRpbmcgdG8gYmUgPGNvZGU+dHJ1ZTwvY29kZT5cbiAgICAgICAgaWYgKCEoJ191c2VIdG1sUGFyc2VyMicgaW4gdGhpcy4jY2hlZXJpbykpIHtcbiAgICAgICAgICAgICh0aGlzLiNjaGVlcmlvIGFzIGFueSkuX3VzZUh0bWxQYXJzZXIyID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXNbX2NvbmZpZ19jaGVlcmlvXSk7XG4gICAgfVxuXG4gICAgZ2V0IG1haGFiaHV0YUNvbmZpZygpIHsgcmV0dXJuIHRoaXMuI2NoZWVyaW87IH1cblxuICAgIC8qKlxuICAgICAqIENvcHkgdGhlIGNvbnRlbnRzIG9mIGFsbCBkaXJlY3RvcmllcyBpbiBhc3NldERpcnMgdG8gdGhlIHJlbmRlciBkZXN0aW5hdGlvbi5cbiAgICAgKi9cbiAgICBhc3luYyBjb3B5QXNzZXRzKCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnY29weUFzc2V0cyBTVEFSVCcpO1xuXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IGZpbGVjYWNoZS5hc3NldHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgYXNzZXRzLmlzUmVhZHkoKTtcbiAgICAgICAgLy8gRmV0Y2ggdGhlIGxpc3Qgb2YgYWxsIGFzc2V0cyBmaWxlc1xuICAgICAgICBjb25zdCBwYXRocyA9IGF3YWl0IGFzc2V0cy5wYXRocygpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRzIHBhdGhzYCxcbiAgICAgICAgLy8gICAgIHBhdGhzLm1hcChpdGVtID0+IHtcbiAgICAgICAgLy8gICAgICAgICByZXR1cm4ge1xuICAgICAgICAvLyAgICAgICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgLy8gICAgICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoLFxuICAgICAgICAvLyAgICAgICAgICAgICBtaW1lOiBpdGVtLm1pbWVcbiAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgIC8vICAgICB9KVxuICAgICAgICAvLyApXG5cbiAgICAgICAgLy8gVGhlIHdvcmsgdGFzayBpcyB0byBjb3B5IGVhY2ggZmlsZVxuICAgICAgICBjb25zdCBxdWV1ZSA9IGZhc3RxLnByb21pc2UoYXN5bmMgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgY29weUFzc2V0cyAke2NvbmZpZy5yZW5kZXJUb30gJHtpdGVtLnJlbmRlclBhdGh9YCk7XG4gICAgICAgICAgICAgICAgbGV0IGRlc3RGTiA9IHBhdGguam9pbihjb25maWcucmVuZGVyVG8sIGl0ZW0ucmVuZGVyUGF0aCk7XG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnkgZXhpc3RzXG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShkZXN0Rk4pLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAvLyBDb3B5IGZyb20gdGhlIGFic29sdXRlIHBhdGhuYW1lLCB0byB0aGUgY29tcHV0ZWQgXG4gICAgICAgICAgICAgICAgLy8gbG9jYXRpb24gd2l0aGluIHRoZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnlcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgY29weUFzc2V0cyAke2l0ZW0uZnNwYXRofSA9PT4gJHtkZXN0Rk59YCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLmNwKGl0ZW0uZnNwYXRoLCBkZXN0Rk4sIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2U6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHByZXNlcnZlVGltZXN0YW1wczogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvcHlBc3NldHMgRkFJTCB0byBjb3B5ICR7aXRlbS5mc3BhdGh9ICR7aXRlbS52cGF0aH0gJHtpdGVtLnJlbmRlclBhdGh9ICR7Y29uZmlnLnJlbmRlclRvfSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMCk7XG5cbiAgICAgICAgLy8gUHVzaCB0aGUgbGlzdCBvZiBhc3NldCBmaWxlcyBpbnRvIHRoZSBxdWV1ZVxuICAgICAgICAvLyBCZWNhdXNlIHF1ZXVlLnB1c2ggcmV0dXJucyBQcm9taXNlJ3Mgd2UgZW5kIHVwIHdpdGhcbiAgICAgICAgLy8gYW4gYXJyYXkgb2YgUHJvbWlzZSBvYmplY3RzXG4gICAgICAgIGNvbnN0IHdhaXRGb3IgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgZW50cnkgb2YgcGF0aHMpIHtcbiAgICAgICAgICAgIHdhaXRGb3IucHVzaChxdWV1ZS5wdXNoKGVudHJ5KSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhpcyB3YWl0cyBmb3IgYWxsIFByb21pc2UncyB0byBmaW5pc2hcbiAgICAgICAgLy8gQnV0IGlmIHRoZXJlIHdlcmUgbm8gUHJvbWlzZSdzLCBubyBuZWVkIHRvIHdhaXRcbiAgICAgICAgaWYgKHdhaXRGb3IubGVuZ3RoID4gMCkgYXdhaXQgUHJvbWlzZS5hbGwod2FpdEZvcik7XG4gICAgICAgIC8vIFRoZXJlIGFyZSBubyByZXN1bHRzIGluIHRoaXMgY2FzZSB0byBjYXJlIGFib3V0XG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICAgICAgLy8gZm9yIChsZXQgcmVzdWx0IG9mIHdhaXRGb3IpIHtcbiAgICAgICAgLy8gICAgcmVzdWx0cy5wdXNoKGF3YWl0IHJlc3VsdCk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsIHRoZSBiZWZvcmVTaXRlUmVuZGVyZWQgZnVuY3Rpb24gb2YgYW55IHBsdWdpbiB3aGljaCBoYXMgdGhhdCBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBhc3luYyBob29rQmVmb3JlU2l0ZVJlbmRlcmVkKCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnaG9va0JlZm9yZVNpdGVSZW5kZXJlZCcpO1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLmJlZm9yZVNpdGVSZW5kZXJlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gYmVmb3JlU2l0ZVJlbmRlcmVkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLmJlZm9yZVNpdGVSZW5kZXJlZChjb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbCB0aGUgb25TaXRlUmVuZGVyZWQgZnVuY3Rpb24gb2YgYW55IHBsdWdpbiB3aGljaCBoYXMgdGhhdCBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBhc3luYyBob29rU2l0ZVJlbmRlcmVkKCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnaG9va1NpdGVSZW5kZXJlZCcpO1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uU2l0ZVJlbmRlcmVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvblNpdGVSZW5kZXJlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vblNpdGVSZW5kZXJlZChjb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVBZGRlZChjb2xsZWN0aW9uOiBzdHJpbmcsIHZwaW5mbzogVlBhdGhEYXRhKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBob29rRmlsZUFkZGVkICR7Y29sbGVjdGlvbn0gJHt2cGluZm8udnBhdGh9YCk7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlQWRkZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uRmlsZUFkZGVkYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uRmlsZUFkZGVkKGNvbmZpZywgY29sbGVjdGlvbiwgdnBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQ2hhbmdlZChjb2xsZWN0aW9uOiBzdHJpbmcsIHZwaW5mbzogVlBhdGhEYXRhKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlQ2hhbmdlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25GaWxlQ2hhbmdlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vbkZpbGVDaGFuZ2VkKGNvbmZpZywgY29sbGVjdGlvbiwgdnBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlVW5saW5rZWQoY29sbGVjdGlvbjogc3RyaW5nLCB2cGluZm86IFZQYXRoRGF0YSkge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZVVubGlua2VkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvbkZpbGVVbmxpbmtlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vbkZpbGVVbmxpbmtlZChjb25maWcsIGNvbGxlY3Rpb24sIHZwaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZUNhY2hlU2V0dXAoY29sbGVjdGlvbm5tOiBzdHJpbmcsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVDYWNoZVNldHVwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vbkZpbGVDYWNoZVNldHVwKGNvbmZpZywgY29sbGVjdGlvbm5tLCBjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tQbHVnaW5DYWNoZVNldHVwKCkge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uUGx1Z2luQ2FjaGVTZXR1cCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25QbHVnaW5DYWNoZVNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTUEVDSUFMIFRSRUFUTUVOVFxuICAgICAgICAvLyBUaGUgdGFnIGRlc2NyaXB0aW9ucyBuZWVkIHRvIGJlIGluc3RhbGxlZFxuICAgICAgICAvLyBpbiB0aGUgZGF0YWJhc2UuICBJdCBpcyBpbXBvc3NpYmxlIHRvIGRvXG4gICAgICAgIC8vIHRoYXQgZHVyaW5nIENvbmZpZ3VyYXRpb24gc2V0dXAgaW5cbiAgICAgICAgLy8gdGhlIGFkZFRhZ0Rlc2NyaXB0aW9ucyBtZXRob2QuXG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgaW52b2tlZCBhZnRlciB0aGUgZGF0YWJhc2VcbiAgICAgICAgLy8gaXMgc2V0dXAuXG5cbiAgICAgICAgYXdhaXQgdGhpcy4jc2F2ZURlc2NyaXB0aW9uc1RvREIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB1c2UgLSBnbyB0aHJvdWdoIHBsdWdpbnMgYXJyYXksIGFkZGluZyBlYWNoIHRvIHRoZSBwbHVnaW5zIGFycmF5IGluXG4gICAgICogdGhlIGNvbmZpZyBmaWxlLCB0aGVuIGNhbGxpbmcgdGhlIGNvbmZpZyBmdW5jdGlvbiBvZiBlYWNoIHBsdWdpbi5cbiAgICAgKiBAcGFyYW0gUGx1Z2luT2JqIFRoZSBwbHVnaW4gbmFtZSBvciBvYmplY3QgdG8gYWRkXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgdXNlKFBsdWdpbk9iaiwgb3B0aW9ucykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkNvbmZpZ3VyYXRpb24gIzEgdXNlIFBsdWdpbk9iaiBcIisgdHlwZW9mIFBsdWdpbk9iaiArXCIgXCIrIHV0aWwuaW5zcGVjdChQbHVnaW5PYmopKTtcbiAgICAgICAgaWYgKHR5cGVvZiBQbHVnaW5PYmogPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGdvaW5nIHRvIGZhaWwgYmVjYXVzZVxuICAgICAgICAgICAgLy8gcmVxdWlyZSBkb2Vzbid0IHdvcmsgaW4gdGhpcyBjb250ZXh0XG4gICAgICAgICAgICAvLyBGdXJ0aGVyLCB0aGlzIGNvbnRleHQgZG9lcyBub3RcbiAgICAgICAgICAgIC8vIHN1cHBvcnQgYXN5bmMgZnVuY3Rpb25zLCBzbyB3ZVxuICAgICAgICAgICAgLy8gY2Fubm90IGRvIGltcG9ydC5cbiAgICAgICAgICAgIFBsdWdpbk9iaiA9IHJlcXVpcmUoUGx1Z2luT2JqKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIVBsdWdpbk9iaiB8fCBQbHVnaW5PYmogaW5zdGFuY2VvZiBQbHVnaW4pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHBsdWdpbiBzdXBwbGllZFwiKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkNvbmZpZ3VyYXRpb24gIzIgdXNlIFBsdWdpbk9iaiBcIisgdHlwZW9mIFBsdWdpbk9iaiArXCIgXCIrIHV0aWwuaW5zcGVjdChQbHVnaW5PYmopKTtcbiAgICAgICAgdmFyIHBsdWdpbiA9IG5ldyBQbHVnaW5PYmooKTtcbiAgICAgICAgcGx1Z2luLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICB0aGlzLiNwbHVnaW5zLnB1c2gocGx1Z2luKTtcbiAgICAgICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgICAgIHBsdWdpbi5jb25maWd1cmUodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBwbHVnaW5zKCkgeyByZXR1cm4gdGhpcy4jcGx1Z2luczsgfVxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZSBvdmVyIHRoZSBpbnN0YWxsZWQgcGx1Z2lucywgY2FsbGluZyB0aGUgZnVuY3Rpb24gcGFzc2VkIGluIGBpdGVyYXRvcmBcbiAgICAgKiBmb3IgZWFjaCBwbHVnaW4sIHRoZW4gY2FsbGluZyB0aGUgZnVuY3Rpb24gcGFzc2VkIGluIGBmaW5hbGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaXRlcmF0b3IgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggcGx1Z2luLiAgU2lnbmF0dXJlOiBgZnVuY3Rpb24ocGx1Z2luLCBuZXh0KWAgIFRoZSBgbmV4dGAgcGFyYW1ldGVyIGlzIGEgZnVuY3Rpb24gdXNlZCB0byBpbmRpY2F0ZSBlcnJvciAtLSBgbmV4dChlcnIpYCAtLSBvciBzdWNjZXNzIC0tIG5leHQoKVxuICAgICAqIEBwYXJhbSBmaW5hbCBUaGUgZnVuY3Rpb24gdG8gY2FsbCBhZnRlciBhbGwgaXRlcmF0b3IgY2FsbHMgaGF2ZSBiZWVuIG1hZGUuICBTaWduYXR1cmU6IGBmdW5jdGlvbihlcnIpYFxuICAgICAqL1xuICAgIGVhY2hQbHVnaW4oaXRlcmF0b3IsIGZpbmFsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImVhY2hQbHVnaW4gZGVwcmVjYXRlZFwiKTtcbiAgICAgICAgLyogYXN5bmMuZWFjaFNlcmllcyh0aGlzLnBsdWdpbnMsXG4gICAgICAgIGZ1bmN0aW9uKHBsdWdpbiwgbmV4dCkge1xuICAgICAgICAgICAgaXRlcmF0b3IocGx1Z2luLCBuZXh0KTtcbiAgICAgICAgfSxcbiAgICAgICAgZmluYWwpOyAqL1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvb2sgZm9yIGEgcGx1Z2luLCByZXR1cm5pbmcgaXRzIG1vZHVsZSByZWZlcmVuY2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiBAcmV0dXJucyB7UGx1Z2lufVxuICAgICAqL1xuICAgIHBsdWdpbihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2NvbmZpZy5wbHVnaW46ICcrIHV0aWwuaW5zcGVjdCh0aGlzLl9wbHVnaW5zKSk7XG4gICAgICAgIGlmICghIHRoaXMucGx1Z2lucykge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBwbHVnaW5LZXkgaW4gdGhpcy5wbHVnaW5zKSB7XG4gICAgICAgICAgICB2YXIgcGx1Z2luID0gdGhpcy5wbHVnaW5zW3BsdWdpbktleV07XG4gICAgICAgICAgICBpZiAocGx1Z2luLm5hbWUgPT09IG5hbWUpIHJldHVybiBwbHVnaW47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coYFdBUk5JTkc6IERpZCBub3QgZmluZCBwbHVnaW4gJHtuYW1lfWApO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlIHRoZSBwbHVnaW5EYXRhIG9iamVjdCBmb3IgdGhlIG5hbWVkIHBsdWdpbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICovIFxuICAgIHBsdWdpbkRhdGEobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHZhciBwbHVnaW5EYXRhQXJyYXkgPSB0aGlzLiNwbHVnaW5EYXRhO1xuICAgICAgICBpZiAoIShuYW1lIGluIHBsdWdpbkRhdGFBcnJheSkpIHtcbiAgICAgICAgICAgIHBsdWdpbkRhdGFBcnJheVtuYW1lXSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwbHVnaW5EYXRhQXJyYXlbbmFtZV07XG4gICAgfVxuXG4gICAgYXNrUGx1Z2luc0xlZ2l0TG9jYWxIcmVmKGhyZWYpIHtcbiAgICAgICAgZm9yICh2YXIgcGx1Z2luIG9mIHRoaXMucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4uaXNMZWdpdExvY2FsSHJlZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBpZiAocGx1Z2luLmlzTGVnaXRMb2NhbEhyZWYodGhpcywgaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZWdpc3RlclJlbmRlcmVyKHJlbmRlcmVyOiBSZW5kZXJlcikge1xuICAgICAgICBpZiAoIShyZW5kZXJlciBpbnN0YW5jZW9mIFJlbmRlcmVyKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm90IEEgUmVuZGVyZXIgJysgdXRpbC5pbnNwZWN0KHJlbmRlcmVyKSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vdCBhIFJlbmRlcmVyICR7dXRpbC5pbnNwZWN0KHJlbmRlcmVyKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuZmluZFJlbmRlcmVyTmFtZShyZW5kZXJlci5uYW1lKSkge1xuICAgICAgICAgICAgLy8gcmVuZGVyZXIuYWthc2hhID0gdGhpcy5ha2FzaGE7XG4gICAgICAgICAgICAvLyByZW5kZXJlci5jb25maWcgPSB0aGlzO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHJlZ2lzdGVyUmVuZGVyZXIgYCwgcmVuZGVyZXIpO1xuICAgICAgICAgICAgdGhpcy4jcmVuZGVyZXJzLnJlZ2lzdGVyUmVuZGVyZXIocmVuZGVyZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxsb3cgYW4gYXBwbGljYXRpb24gdG8gb3ZlcnJpZGUgb25lIG9mIHRoZSBidWlsdC1pbiByZW5kZXJlcnNcbiAgICAgKiB0aGF0IGFyZSBpbml0aWFsaXplZCBiZWxvdy4gIFRoZSBpbnNwaXJhdGlvbiBpcyBlcHVidG9vbHMgdGhhdFxuICAgICAqIG11c3Qgd3JpdGUgSFRNTCBmaWxlcyB3aXRoIGFuIC54aHRtbCBleHRlbnNpb24uICBUaGVyZWZvcmUgaXRcbiAgICAgKiBjYW4gc3ViY2xhc3MgRUpTUmVuZGVyZXIgZXRjIHdpdGggaW1wbGVtZW50YXRpb25zIHRoYXQgZm9yY2UgdGhlXG4gICAgICogZmlsZSBuYW1lIHRvIGJlIC54aHRtbC4gIFdlJ3JlIG5vdCBjaGVja2luZyBpZiB0aGUgcmVuZGVyZXIgbmFtZVxuICAgICAqIGlzIGFscmVhZHkgdGhlcmUgaW4gY2FzZSBlcHVidG9vbHMgbXVzdCB1c2UgdGhlIHNhbWUgcmVuZGVyZXIgbmFtZS5cbiAgICAgKi9cbiAgICByZWdpc3Rlck92ZXJyaWRlUmVuZGVyZXIocmVuZGVyZXI6IFJlbmRlcmVyKSB7XG4gICAgICAgIGlmICghKHJlbmRlcmVyIGluc3RhbmNlb2YgUmVuZGVyZXIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdOb3QgQSBSZW5kZXJlciAnKyB1dGlsLmluc3BlY3QocmVuZGVyZXIpKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGEgUmVuZGVyZXInKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZW5kZXJlci5ha2FzaGEgPSB0aGlzLmFrYXNoYTtcbiAgICAgICAgLy8gcmVuZGVyZXIuY29uZmlnID0gdGhpcztcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLnJlZ2lzdGVyT3ZlcnJpZGVSZW5kZXJlcihyZW5kZXJlcik7XG4gICAgfVxuXG4gICAgZmluZFJlbmRlcmVyTmFtZShuYW1lOiBzdHJpbmcpOiBSZW5kZXJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLiNyZW5kZXJlcnMuZmluZFJlbmRlcmVyTmFtZShuYW1lKTtcbiAgICB9XG5cbiAgICBmaW5kUmVuZGVyZXJQYXRoKF9wYXRoOiBzdHJpbmcpOiBSZW5kZXJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLiNyZW5kZXJlcnMuZmluZFJlbmRlcmVyUGF0aChfcGF0aCk7XG4gICAgfVxuXG4gICAgZ2V0IHJlbmRlcmVycygpIHsgcmV0dXJuIHRoaXMuI3JlbmRlcmVyczsgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBhIFJlbmRlcmVyIGJ5IGl0cyBleHRlbnNpb24uXG4gICAgICovXG4gICAgZmluZFJlbmRlcmVyKG5hbWU6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kUmVuZGVyZXJOYW1lKG5hbWUpO1xuICAgIH1cbn1cblxuY29uc3QgbW9kdWxlX2V4cG9ydHMgPSB7XG4gICAgUmVuZGVyZXJzLFxuICAgIFJlbmRlcmVyOiBSZW5kZXJlcnMuUmVuZGVyZXIsXG4gICAgbWFoYWJodXRhLFxuICAgIGZpbGVjYWNoZSxcbiAgICBzZXR1cCxcbiAgICBjYWNoZVNldHVwLFxuICAgIGNsb3NlQ2FjaGVzLFxuICAgIGRvSFRNTEF0dHJpYnV0ZSxcbiAgICBmaWxlQ2FjaGVzUmVhZHksXG4gICAgUGx1Z2luLFxuICAgIHJlbmRlcixcbiAgICByZW5kZXJEb2N1bWVudCxcbiAgICByZW5kZXJQYXRoLFxuICAgIHJlYWRSZW5kZXJlZEZpbGUsXG4gICAgcGFydGlhbCxcbiAgICBwYXJ0aWFsU3luYyxcbiAgICBpbmRleENoYWluLFxuICAgIHJlbGF0aXZlLFxuICAgIGxpbmtSZWxTZXRBdHRyLFxuICAgIHJlc29sdmVWcGF0aCxcbiAgICBnZW5lcmF0ZVJTUyxcbiAgICBDb25maWd1cmF0aW9uXG59IGFzIGFueTtcblxuZXhwb3J0IGRlZmF1bHQgbW9kdWxlX2V4cG9ydHM7Il19