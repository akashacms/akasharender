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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBR0g7OztHQUdHO0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsNENBQTRDO0FBQzVDLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQztBQUN0QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFFLFVBQVUsRUFBYyxZQUFZLEVBQWEsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEtBQUssU0FBUyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEQsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsT0FBTyxLQUFLLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDdkMsTUFBTSxFQUNGLGFBQWEsRUFDYix1QkFBdUIsRUFDMUIsR0FBRyxTQUFTLENBQUM7QUFDZCxPQUFPLEtBQUssT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUNuQyxPQUFPLFdBQVcsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXZDLGNBQWMsZ0JBQWdCLENBQUM7QUFFL0IsT0FBTyxLQUFL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QVc7SUFDWCxhQUFhO0NBQ1QsQ0FBQztBQUVULGVBQWUsY0FBYyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblxuLyoqXG4gKiBBa2FzaGFSZW5kZXJcbiAqIEBtb2R1bGUgYWthc2hhcmVuZGVyXG4gKi9cblxuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbi8vIGNvbnN0IG9lbWJldHRlciA9IHJlcXVpcmUoJ29lbWJldHRlcicpKCk7XG5pbXBvcnQgUlNTIGZyb20gJ3Jzcyc7XG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHsgbWltZWRlZmluZSwgZGlyVG9Nb3VudCwgaXNEaXJUb01vdW50LCBWUGF0aERhdGEgfSBmcm9tICcuL2NhY2hlL3Zmc3RhY2suanMnO1xuZXhwb3J0IHR5cGUgeyBkaXJUb01vdW50LCBWUGF0aERhdGEgfSBmcm9tICcuL2NhY2hlL3Zmc3RhY2suanMnO1xuZXhwb3J0IHsgaXNEaXJUb01vdW50IH0gZnJvbSAnLi9jYWNoZS92ZnN0YWNrLmpzJztcbmltcG9ydCAqIGFzIFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5leHBvcnQgKiBhcyBSZW5kZXJlcnMgZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0IHsgUmVuZGVyZXIgfSBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5leHBvcnQgeyBSZW5kZXJlciB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCAqIGFzIG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuZXhwb3J0ICogYXMgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5jb25zdCB7XG4gICAgUGVyZkRhdGFTdG9yZSwgXG4gICAgRmlsZXN5c3RlbVBlcmZEYXRhU3RvcmVcbn0gPSBtYWhhYmh1dGE7XG5pbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gJ2NoZWVyaW8nO1xuaW1wb3J0IG1haGFQYXJ0aWFsIGZyb20gJ21haGFiaHV0YS9tYWhhL3BhcnRpYWwuanMnO1xuaW1wb3J0IHsgZW5jb2RlIH0gZnJvbSAnaHRtbC1lbnRpdGllcyc7XG5cbmV4cG9ydCAqIGZyb20gJy4vbWFoYWZ1bmNzLmpzJztcblxuaW1wb3J0ICogYXMgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuZXhwb3J0ICogYXMgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuXG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5leHBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5cbmltcG9ydCB0eXBlIHsgVGFnRGVzY3JpcHRpb24gfSBmcm9tICcuL3R5cGVzLmpzJztcbmV4cG9ydCB0eXBlIHsgVGFnRGVzY3JpcHRpb24gfSBmcm9tICcuL3R5cGVzLmpzJztcbmV4cG9ydCB0eXBlIHtcbiAgICBTZWFyY2hPcHRpb25zLFxuICAgIFJlZ2V4TWF0Y2gsXG4gICAgU2VhcmNoRmlsdGVyRnVuYyxcbiAgICBTZWFyY2hTb3J0RnVuY1xufSBmcm9tICcuL3R5cGVzLmpzJztcbmV4cG9ydCB7IHZhbGlkVGFnRGVzY3JpcHRpb24gfSBmcm9tICcuL3R5cGVzLmpzJztcblxuaW1wb3J0IHsgcmVuZGVyLCByZW5kZXJEb2N1bWVudCB9IGZyb20gJy4vcmVuZGVyLmpzJztcbmV4cG9ydCB7IHJlbmRlciwgcmVuZGVyRG9jdW1lbnQsIGlzRG9jdW1lbnRVcFRvRGF0ZSB9IGZyb20gJy4vcmVuZGVyLmpzJztcbmV4cG9ydCB0eXBlIHsgUmVuZGVyT3B0aW9ucywgUmVuZGVyaW5nUmVzdWx0cyB9IGZyb20gJy4vcmVuZGVyLmpzJztcblxuZXhwb3J0IHtcbiAgICBTaXRlbWFwVmFsaWRhdG9yLFxuICAgIHR5cGUgU2l0ZW1hcEVudHJ5LFxuICAgIHR5cGUgRW50cnlWYWxpZGF0aW9uLFxuICAgIHR5cGUgWE1MVmFsaWRhdGlvbixcbiAgICB0eXBlIFZhbGlkYXRpb25SZXN1bHRcbn0gZnJvbSAnLi9zaXRlbWFwLXZhbGlkYXRvci5qcyc7XG5cbmV4cG9ydCB7XG4gICAgaW5mZXJGb3JtYXQsXG4gICAgcGFyc2VUYWJsZURhdGEsXG4gICAgdHlwZSBDc3ZUYWJsZUZvcm1hdCxcbiAgICB0eXBlIENzdlRhYmxlUm93LFxuICAgIHR5cGUgQ3N2VGFibGVEYXRhLFxuICAgIHR5cGUgUGFyc2VUYWJsZU9wdGlvbnNcbn0gZnJvbSAnLi9jc3YtdGFibGUuanMnO1xuXG5leHBvcnQge1xuICAgIExpbmtDaGVja2VyLFxuICAgIGlzV2hpdGVsaXN0ZWQsXG4gICAgY2xhc3NpZnlTdGF0dXMsXG4gICAgYXNzZXJ0TW9kZSBhcyBhc3NlcnRMaW5rQ2hlY2tNb2RlLFxuICAgIGZldGNoRXh0ZXJuYWxDaGVja2VyLFxuICAgIGxpbmtDaGVja0V4dGVybmFsQ2hlY2tlcixcbiAgICBMSU5LX0NIRUNLX01PREVTLFxuICAgIERFRkFVTFRfTElOS19DSEVDS19PUFRJT05TLFxuICAgIHR5cGUgTGlua0NoZWNrTW9kZSxcbiAgICB0eXBlIExpbmtDaGVja09wdGlvbnMsXG4gICAgdHlwZSBXaGl0ZWxpc3RFbnRyeSxcbiAgICB0eXBlIEV4dGVybmFsU3RhdGUsXG4gICAgdHlwZSBFeHRlcm5hbFJlc3VsdCxcbiAgICB0eXBlIEV4dGVybmFsQ2hlY2tlcixcbiAgICB0eXBlIEV4dGVybmFsQ2hlY2tPcHRpb25zLFxuICAgIHR5cGUgTGlua0tpbmQsXG4gICAgdHlwZSBMaW5rRXJyb3IsXG4gICAgdHlwZSBJbnRlcm5hbFJlc29sdmVyXG59IGZyb20gJy4vbGluay1jaGVja2VyLmpzJztcblxuY29uc3QgX19maWxlbmFtZSA9IGltcG9ydC5tZXRhLmZpbGVuYW1lO1xuY29uc3QgX19kaXJuYW1lID0gaW1wb3J0Lm1ldGEuZGlybmFtZTtcblxuLy8gRm9yIHVzZSBpbiBDb25maWd1cmUucHJlcGFyZVxuaW1wb3J0IHsgQnVpbHRJblBsdWdpbiB9IGZyb20gJy4vYnVpbHQtaW4uanMnO1xuXG5pbXBvcnQgKiBhcyBmaWxlY2FjaGUgZnJvbSAnLi9jYWNoZS9jYWNoZS1zcWxpdGUuanMnO1xuaW1wb3J0IHsgc3FkYiB9IGZyb20gJy4vc3FkYi5qcyc7XG5cbmV4cG9ydCB7IG5ld1NRM0RhdGFTdG9yZSB9IGZyb20gJy4vc3FkYi5qcyc7XG5cbmltcG9ydCB7IGluaXQgfSBmcm9tICcuL2RhdGEuanMnO1xuXG4vLyBUaGVyZSBkb2Vzbid0IHNlZW0gdG8gYmUgYW4gb2ZmaWNpYWwgTUlNRSB0eXBlIHJlZ2lzdGVyZWRcbi8vIGZvciBBc2NpaURvY3RvclxuLy8gcGVyOiBodHRwczovL2FzY2lpZG9jdG9yLm9yZy9kb2NzL2ZhcS9cbi8vIHBlcjogaHR0cHM6Ly9naXRodWIuY29tL2FzY2lpZG9jdG9yL2FzY2lpZG9jdG9yL2lzc3Vlcy8yNTAyXG4vL1xuLy8gQXMgb2YgTm92ZW1iZXIgNiwgMjAyMiwgdGhlIEFzY2lpRG9jdG9yIEZBUSBzYWlkIHRoZXkgYXJlXG4vLyBpbiB0aGUgcHJvY2VzcyBvZiByZWdpc3RlcmluZyBhIE1JTUUgdHlwZSBmb3IgYHRleHQvYXNjaWlkb2NgLlxuLy8gVGhlIE1JTUUgdHlwZSB3ZSBzdXBwbHkgaGFzIGJlZW4gdXBkYXRlZC5cbi8vXG4vLyBUaGlzIGFsc28gc2VlbXMgdG8gYmUgdHJ1ZSBmb3IgdGhlIG90aGVyIGZpbGUgdHlwZXMuICBXZSd2ZSBtYWRlIHVwXG4vLyBzb21lIE1JTUUgdHlwZXMgdG8gZ28gd2l0aCBlYWNoLlxuLy9cbi8vIFRoZSBNSU1FIHBhY2thZ2UgaGFkIHByZXZpb3VzbHkgYmVlbiBpbnN0YWxsZWQgd2l0aCBBa2FzaGFSZW5kZXIuXG4vLyBCdXQsIGl0IHNlZW1zIHRvIG5vdCBiZSB1c2VkLCBhbmQgaW5zdGVhZCB3ZSBjb21wdXRlIHRoZSBNSU1FIHR5cGVcbi8vIGZvciBmaWxlcyBpbiBTdGFja2VkIERpcmVjdG9yaWVzLlxuLy9cbi8vIFRoZSByZXF1aXJlZCB0YXNrIGlzIHRvIHJlZ2lzdGVyIHNvbWUgTUlNRSB0eXBlcyB3aXRoIHRoZVxuLy8gTUlNRSBwYWNrYWdlLiAgSXQgaXNuJ3QgYXBwcm9wcmlhdGUgdG8gZG8gdGhpcyBpblxuLy8gdGhlIFN0YWNrZWQgRGlyZWN0b3JpZXMgcGFja2FnZS4gIEluc3RlYWQgdGhhdCdzIGxlZnRcbi8vIGZvciBjb2RlIHdoaWNoIHVzZXMgU3RhY2tlZCBEaXJlY3RvcmllcyB0byBkZXRlcm1pbmUgd2hpY2hcbi8vIChpZiBhbnkpIGFkZGVkIE1JTUUgdHlwZXMgYXJlIHJlcXVpcmVkLiAgRXJnbywgQWthc2hhUmVuZGVyXG4vLyBuZWVkcyB0byByZWdpc3RlciB0aGUgTUlNRSB0eXBlcyBpdCBpcyBpbnRlcmVzdGVkIGluLlxuLy8gVGhhdCdzIHdoYXQgaXMgaGFwcGVuaW5nIGhlcmUuXG4vL1xuLy8gVGhlcmUncyBhIHRob3VnaHQgdGhhdCB0aGlzIHNob3VsZCBiZSBoYW5kbGVkIGluIHRoZSBSZW5kZXJlclxuLy8gaW1wbGVtZW50YXRpb25zLiAgQnV0IGl0J3Mgbm90IGNlcnRhaW4gdGhhdCdzIGNvcnJlY3QuXG4vL1xuLy8gTm93IHRoYXQgdGhlIFJlbmRlcmVycyBhcmUgaW4gYEBha2FzaGFjbXMvcmVuZGVyZXJzYCBzaG91bGRcbi8vIHRoZXNlIGRlZmluaXRpb25zIG1vdmUgdG8gdGhhdCBwYWNrYWdlP1xuXG5taW1lZGVmaW5lKHsndGV4dC9hc2NpaWRvYyc6IFsgJ2Fkb2MnLCAnYXNjaWlkb2MnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbWFya2RvYyc6IFsgJ21hcmtkb2MnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtZWpzJzogWyAnZWpzJ119KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbnVuanVja3MnOiBbICduamsnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtaGFuZGxlYmFycyc6IFsgJ2hhbmRsZWJhcnMnIF19KTtcbm1pbWVkZWZpbmUoeyd0ZXh0L3gtbGlxdWlkJzogWyAnbGlxdWlkJyBdfSk7XG5taW1lZGVmaW5lKHsndGV4dC94LXRlbXB1cmEnOiBbICd0ZW1wdXJhJyBdfSk7XG5cbi8qKlxuICogUGVyZm9ybXMgc2V0dXAgb2YgdGhpbmdzIHNvIHRoYXQgQWthc2hhUmVuZGVyIGNhbiBmdW5jdGlvbi5cbiAqIFRoZSBjb3JyZWN0IGluaXRpYWxpemF0aW9uIG9mIEFrYXNoYVJlbmRlciBpcyB0b1xuICogMS4gR2VuZXJhdGUgdGhlIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiAyLiBDYWxsIGNvbmZpZy5wcmVwYXJlXG4gKiAzLiBDYWxsIGFrYXNoYXJlbmRlci5zZXR1cFxuICogXG4gKiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXMgYWxsIG9iamVjdHMgdGhhdCBpbml0aWFsaXplIGFzeW5jaHJvbm91c2x5XG4gKiBhcmUgY29ycmVjdGx5IHNldHVwLlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKGNvbmZpZykge1xuXG4gICAgY29uZmlnLnJlbmRlcmVycy5wYXJ0aWFsRnVuYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNhbGxpbmcgcGFydGlhbCAke2ZuYW1lfWApO1xuICAgICAgICByZXR1cm4gcGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICBjb25maWcucmVuZGVyZXJzLnBhcnRpYWxTeW5jRnVuYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNhbGxpbmcgcGFydGlhbFN5bmMgJHtmbmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuXG4gICAgYXdhaXQgY2FjaGVTZXR1cChjb25maWcpO1xuICAgIGF3YWl0IGZpbGVDYWNoZXNSZWFkeShjb25maWcpO1xuXG4gICAgYXdhaXQgaW5pdCgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FjaGVTZXR1cChjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBmaWxlY2FjaGUuc2V0dXAoY29uZmlnLCBhd2FpdCBzcWRiKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgSU5JVElBTElaQVRJT04gRkFJTFVSRSBDT1VMRCBOT1QgSU5JVElBTElaRSBDQUNIRSBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VDYWNoZXMoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZmlsZWNhY2hlLmNsb3NlRmlsZUNhY2hlcygpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBDTE9TRSBDQUNIRVMgYCwgZXJyKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbGVDYWNoZXNSZWFkeShjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLmFzc2V0c0NhY2hlLmlzUmVhZHkoKSxcbiAgICAgICAgICAgIGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUuaXNSZWFkeSgpLFxuICAgICAgICAgICAgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuaXNSZWFkeSgpXG4gICAgICAgIF0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBJTklUSUFMSVpBVElPTiBGQUlMVVJFIENPVUxEIE5PVCBJTklUSUFMSVpFIENBQ0hFIFNZU1RFTSBgLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxufVxuXG4vKipcbiAqIExvY2F0ZSB0aGUgZG9jdW1lbnQgZm9yIGEgdnBhdGgsIHJldHJ5aW5nIGZvciB1cCB0byByb3VnaGx5XG4gKiB0d28gc2Vjb25kcy4gIFRoaXMgaXMgdXNlZCBieSByZW5kZXJQYXRoLCB3aGljaCBtaWdodCBiZVxuICogY2FsbGVkIGZyb20gdGhlIENMSSdzIHJlbmRlci1kb2N1bWVudCBjb21tYW5kIHdoaWxlIHRoZSBsYXN0XG4gKiBkb2N1bWVudCBpcyBzdGlsbCBiZWluZyBBREQnZCB0byB0aGUgRmlsZUNhY2hlLlxuICpcbiAqIEluIHN1Y2ggYSBjYXNlIDxjb2RlPmlzUmVhZHk8L2NvZGU+IG1pZ2h0IHJldHVybiA8Y29kZT50cnVlPC9jb2RlPlxuICogYnV0IG5vdCBhbGwgZmlsZXMgd2lsbCBoYXZlIGJlZW4gQUREJ2QgdG8gdGhlIEZpbGVDYWNoZS5cbiAqIEluIHRoYXQgY2FzZSA8Y29kZT5kb2N1bWVudHMuZmluZDwvY29kZT4gcmV0dXJuc1xuICogPGNvZGU+dW5kZWZpbmVkPC9jb2RlPlxuICpcbiAqIFRoZSBjbGVhbmVyIGFsdGVybmF0aXZlIHdvdWxkIGJlIHRvIHdhaXQgZm9yIG5vdCBvbmx5XG4gKiB0aGUgPGNvZGU+cmVhZHk8L2NvZGU+IGZyb20gdGhlIDxjb2RlPmRvY3VtZW50czwvY29kZT4gRmlsZUNhY2hlLFxuICogYnV0IGFsc28gZm9yIGFsbCB0aGUgaW5pdGlhbCBBREQgZXZlbnRzIHRvIGJlIGhhbmRsZWQuICBCdXRcbiAqIHRoYXQgc2Vjb25kIGNvbmRpdGlvbiBzZWVtcyBkaWZmaWN1bHQgdG8gZGV0ZWN0IHJlbGlhYmx5LlxuICovXG5hc3luYyBmdW5jdGlvbiBmaW5kRG9jdW1lbnRXaXRoUmV0cnkocGF0aDJyKSB7XG4gICAgY29uc3QgZG9jdW1lbnRzID0gZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgd2hpbGUgKGNvdW50IDwgMjApIHtcbiAgICAgICAgY29uc3QgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChwYXRoMnIpO1xuICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb3VudCsrO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyUGF0aChjb25maWcsIHBhdGgycikge1xuICAgIGNvbnN0IGZvdW5kID0gYXdhaXQgZmluZERvY3VtZW50V2l0aFJldHJ5KHBhdGgycik7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgZmluZCBkb2N1bWVudCBmb3IgJHtwYXRoMnJ9YCk7XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudChjb25maWcsIGZvdW5kKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFJlYWRzIGEgZmlsZSBmcm9tIHRoZSByZW5kZXJpbmcgZGlyZWN0b3J5LiAgSXQgaXMgcHJpbWFyaWx5IHRvIGJlXG4gKiB1c2VkIGluIHRlc3QgY2FzZXMsIHdoZXJlIHdlJ2xsIHJ1biBhIGJ1aWxkIHRoZW4gcmVhZCB0aGUgaW5kaXZpZHVhbFxuICogZmlsZXMgdG8gbWFrZSBzdXJlIHRoZXkndmUgcmVuZGVyZWQgY29ycmVjdGx5LlxuICogXG4gKiBAcGFyYW0geyp9IGNvbmZpZyBcbiAqIEBwYXJhbSB7Kn0gZnBhdGggXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRSZW5kZXJlZEZpbGUoY29uZmlnLCBmcGF0aCkge1xuXG4gICAgbGV0IGh0bWwgPSBhd2FpdCBmc3AucmVhZEZpbGUocGF0aC5qb2luKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgZnBhdGgpLCAndXRmOCcpO1xuICAgIGxldCAkID0gY29uZmlnLm1haGFiaHV0YUNvbmZpZyBcbiAgICAgICAgICAgID8gY2hlZXJpby5sb2FkKGh0bWwsIGNvbmZpZy5tYWhhYmh1dGFDb25maWcpIFxuICAgICAgICAgICAgOiBjaGVlcmlvLmxvYWQoaHRtbCk7XG5cbiAgICByZXR1cm4geyBodG1sLCAkIH07XG59XG5cbi8qKlxuICogUmVuZGVycyBhIHBhcnRpYWwgdGVtcGxhdGUgdXNpbmcgdGhlIHN1cHBsaWVkIG1ldGFkYXRhLiAgVGhpcyB2ZXJzaW9uXG4gKiBhbGxvd3MgZm9yIGFzeW5jaHJvbm91cyBleGVjdXRpb24sIGFuZCBldmVyeSBiaXQgb2YgY29kZSBpdFxuICogZXhlY3V0ZXMgaXMgYWxsb3dlZCB0byBiZSBhc3luYy5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiBAcGFyYW0geyp9IGZuYW1lIFBhdGggd2l0aGluIHRoZSBmaWxlY2FjaGUucGFydGlhbHMgY2FjaGVcbiAqIEBwYXJhbSB7Kn0gbWV0YWRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgbWV0YWRhdGFcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhIHN0cmluZyBjb250YWluaW5nIHRoZSByZW5kZXJlZCBzdHVmZlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSkge1xuXG4gICAgaWYgKCFmbmFtZSB8fCB0eXBlb2YgZm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcGFydGlhbCBmbmFtZSBub3QgYSBzdHJpbmcgJHt1dGlsLmluc3BlY3QoZm5hbWUpfWApO1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsICR7Zm5hbWV9YCk7XG4gICAgY29uc3QgZm91bmQgPSBhd2FpdCBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5maW5kKGZuYW1lKTtcbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcGFydGlhbCBmb3VuZCBmb3IgJHtmbmFtZX0gaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLnBhcnRpYWxzRGlycyl9YCk7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGBwYXJ0aWFsICR7Zm5hbWV9ID09PiAke2ZvdW5kLnZwYXRofSAke2ZvdW5kLmZzcGF0aH1gKTtcbiAgICBcbiAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgYWJvdXQgdG8gcmVuZGVyICR7dXRpbC5pbnNwZWN0KGZvdW5kLnZwYXRoKX1gKTtcbiAgICAgICAgbGV0IHBhcnRpYWxUZXh0O1xuICAgICAgICBpZiAoZm91bmQuZG9jQm9keSkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NCb2R5O1xuICAgICAgICBlbHNlIGlmIChmb3VuZC5kb2NCb2R5KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0JvZHk7XG4gICAgICAgIGVsc2UgcGFydGlhbFRleHQgPSBhd2FpdCBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuXG4gICAgICAgIC8vIFNvbWUgcmVuZGVyZXJzIChOdW5qdWtzKSByZXF1aXJlIHRoYXQgbWV0YWRhdGEuY29uZmlnXG4gICAgICAgIC8vIHBvaW50IHRvIHRoZSBjb25maWcgb2JqZWN0LiAgVGhpcyBibG9jayBvZiBjb2RlXG4gICAgICAgIC8vIGR1cGxpY2F0ZXMgdGhlIG1ldGFkYXRhIG9iamVjdCwgdGhlbiBzZXRzIHRoZVxuICAgICAgICAvLyBjb25maWcgZmllbGQgaW4gdGhlIGR1cGxpY2F0ZSwgcGFzc2luZyB0aGF0IHRvIHRoZSBwYXJ0aWFsLlxuICAgICAgICBsZXQgbWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBsZXQgcHJvcDtcblxuICAgICAgICBmb3IgKHByb3AgaW4gbWV0YWRhdGEpIHtcbiAgICAgICAgICAgIG1kYXRhW3Byb3BdID0gbWV0YWRhdGFbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgbWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICBtZGF0YS5wYXJ0aWFsU3luYyA9IHBhcnRpYWxTeW5jLmJpbmQocmVuZGVyZXIsIGNvbmZpZyk7XG4gICAgICAgIG1kYXRhLnBhcnRpYWwgICAgID0gcGFydGlhbC5iaW5kKHJlbmRlcmVyLCBjb25maWcpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbC1mdW5jcyByZW5kZXIgJHtyZW5kZXJlci5uYW1lfSAke2ZvdW5kLnZwYXRofWApO1xuICAgICAgICByZXR1cm4gcmVuZGVyZXIucmVuZGVyKHtcbiAgICAgICAgICAgIGZzcGF0aDogZm91bmQuZnNwYXRoLFxuICAgICAgICAgICAgY29udGVudDogcGFydGlhbFRleHQsXG4gICAgICAgICAgICBtZXRhZGF0YTogbWRhdGFcbiAgICAgICAgICAgIC8vIHBhcnRpYWxUZXh0LCBtZGF0YSwgZm91bmRcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChmb3VuZC52cGF0aC5lbmRzV2l0aCgnLmh0bWwnKSB8fCBmb3VuZC52cGF0aC5lbmRzV2l0aCgnLnhodG1sJykpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwgcmVhZGluZyBmaWxlICR7Zm91bmQudnBhdGh9YCk7XG4gICAgICAgIHJldHVybiBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVuZGVyUGFydGlhbCBubyBSZW5kZXJlciBmb3VuZCBmb3IgJHtmbmFtZX0gLSAke2ZvdW5kLnZwYXRofWApO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgcGFydGlhbCB0ZW1wbGF0ZSB1c2luZyB0aGUgc3VwcGxpZWQgbWV0YWRhdGEuICBUaGlzIHZlcnNpb25cbiAqIGFsbG93cyBmb3Igc3luY2hyb25vdXMgZXhlY3V0aW9uLCBhbmQgZXZlcnkgYml0IG9mIGNvZGUgaXRcbiAqIGV4ZWN1dGVzIGlzIHN5bmNocm9ub3VzIGZ1bmN0aW9ucy5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiBAcGFyYW0geyp9IGZuYW1lIFBhdGggd2l0aGluIHRoZSBmaWxlY2FjaGUucGFydGlhbHMgY2FjaGVcbiAqIEBwYXJhbSB7Kn0gbWV0YWRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgbWV0YWRhdGFcbiAqIEByZXR1cm5zIFN0cmluZyBjb250YWluaW5nIHRoZSByZW5kZXJlZCBzdHVmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpIHtcblxuICAgIGlmICghZm5hbWUgfHwgdHlwZW9mIGZuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHBhcnRpYWxTeW5jIGZuYW1lIG5vdCBhIHN0cmluZyAke3V0aWwuaW5zcGVjdChmbmFtZSl9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgZm91bmQgPSBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5maW5kU3luYyhmbmFtZSk7XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHBhcnRpYWwgZm91bmQgZm9yICR7Zm5hbWV9IGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5wYXJ0aWFsc0RpcnMpfWApO1xuICAgIH1cblxuICAgIHZhciByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgLy8gU29tZSByZW5kZXJlcnMgKE51bmp1a3MpIHJlcXVpcmUgdGhhdCBtZXRhZGF0YS5jb25maWdcbiAgICAgICAgLy8gcG9pbnQgdG8gdGhlIGNvbmZpZyBvYmplY3QuICBUaGlzIGJsb2NrIG9mIGNvZGVcbiAgICAgICAgLy8gZHVwbGljYXRlcyB0aGUgbWV0YWRhdGEgb2JqZWN0LCB0aGVuIHNldHMgdGhlXG4gICAgICAgIC8vIGNvbmZpZyBmaWVsZCBpbiB0aGUgZHVwbGljYXRlLCBwYXNzaW5nIHRoYXQgdG8gdGhlIHBhcnRpYWwuXG4gICAgICAgIGxldCBtZGF0YTogYW55ID0ge307XG4gICAgICAgIGxldCBwcm9wO1xuXG4gICAgICAgIGZvciAocHJvcCBpbiBtZXRhZGF0YSkge1xuICAgICAgICAgICAgbWRhdGFbcHJvcF0gPSBtZXRhZGF0YVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBtZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgICAgIC8vIEluIHRoaXMgY29udGV4dCwgcGFydGlhbFN5bmMgaXMgZGlyZWN0bHkgYXZhaWxhYmxlXG4gICAgICAgIC8vIGFzIGEgZnVuY3Rpb24gdGhhdCB3ZSBjYW4gZGlyZWN0bHkgdXNlLlxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGFydGlhbFN5bmMgYCwgcGFydGlhbFN5bmMpO1xuICAgICAgICBtZGF0YS5wYXJ0aWFsU3luYyA9IHBhcnRpYWxTeW5jLmJpbmQocmVuZGVyZXIsIGNvbmZpZyk7XG4gICAgICAgIC8vIGZvciBmaW5kU3luYywgdGhlIFwiZm91bmRcIiBvYmplY3QgaXMgVlBhdGhEYXRhIHdoaWNoXG4gICAgICAgIC8vIGRvZXMgbm90IGhhdmUgZG9jQm9keSBub3IgZG9jQ29udGVudC4gIFRoZXJlZm9yZSB3ZVxuICAgICAgICAvLyBtdXN0IHJlYWQgdGhpcyBjb250ZW50XG4gICAgICAgIGxldCBwYXJ0aWFsVGV4dCA9IGZzLnJlYWRGaWxlU3luYyhmb3VuZC5mc3BhdGgsICd1dGYtOCcpO1xuICAgICAgICAvLyBpZiAoZm91bmQuZG9jQm9keSkgcGFydGlhbFRleHQgPSBmb3VuZC5kb2NCb2R5O1xuICAgICAgICAvLyBlbHNlIGlmIChmb3VuZC5kb2NDb250ZW50KSBwYXJ0aWFsVGV4dCA9IGZvdW5kLmRvY0NvbnRlbnQ7XG4gICAgICAgIC8vIGVsc2UgcGFydGlhbFRleHQgPSBmcy5yZWFkRmlsZVN5bmMoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgICAgICBcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhcnRpYWwtZnVuY3MgcmVuZGVyU3luYyAke3JlbmRlcmVyLm5hbWV9ICR7Zm91bmQudnBhdGh9YCk7XG4gICAgICAgIHJldHVybiByZW5kZXJlci5yZW5kZXJTeW5jKDxSZW5kZXJlcnMuUmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgICAgICBmc3BhdGg6IGZvdW5kLmZzcGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IHBhcnRpYWxUZXh0LFxuICAgICAgICAgICAgbWV0YWRhdGE6IG1kYXRhXG4gICAgICAgICAgICAvLyBwYXJ0aWFsVGV4dCwgbWRhdGEsIGZvdW5kXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZm91bmQudnBhdGguZW5kc1dpdGgoJy5odG1sJykgfHwgZm91bmQudnBhdGguZW5kc1dpdGgoJy54aHRtbCcpKSB7XG4gICAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVuZGVyUGFydGlhbCBubyBSZW5kZXJlciBmb3VuZCBmb3IgJHtmbmFtZX0gLSAke2ZvdW5kLnZwYXRofWApO1xuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgaW5kZXhDaGFpbkl0ZW0gPSB7XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICB2cGF0aDogc3RyaW5nO1xuICAgIGZvdW5kUGF0aDogc3RyaW5nO1xuICAgIGZvdW5kRGlyOiBzdHJpbmc7XG4gICAgZmlsZW5hbWU6IHN0cmluZztcbn07XG5cbi8qKlxuICogU3RhcnRpbmcgZnJvbSBhIHZpcnR1YWwgcGF0aCBpbiB0aGUgZG9jdW1lbnRzLCBzZWFyY2hlcyB1cHdhcmRzIHRvXG4gKiB0aGUgcm9vdCBvZiB0aGUgZG9jdW1lbnRzIGZpbGUtc3BhY2UsIGZpbmRpbmcgZmlsZXMgdGhhdCBcbiAqIHJlbmRlciB0byBcImluZGV4Lmh0bWxcIi4gIFRoZSBcImluZGV4Lmh0bWxcIiBmaWxlcyBhcmUgaW5kZXggZmlsZXMsXG4gKiBhcyB0aGUgbmFtZSBzdWdnZXN0cy5cbiAqIFxuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKiBAcGFyYW0geyp9IGZuYW1lIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbmRleENoYWluKFxuICAgIGNvbmZpZywgZm5hbWVcbik6IFByb21pc2U8aW5kZXhDaGFpbkl0ZW1bXT4ge1xuXG4gICAgLy8gVGhpcyB1c2VkIHRvIGJlIGEgZnVsbCBmdW5jdGlvbiBoZXJlLCBidXQgaGFzIG1vdmVkXG4gICAgLy8gaW50byB0aGUgRmlsZUNhY2hlIGNsYXNzLiAgUmVxdWlyaW5nIGEgYGNvbmZpZ2Agb3B0aW9uXG4gICAgLy8gaXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggdGhlIGZvcm1lciBBUEkuXG5cbiAgICBjb25zdCBkb2N1bWVudHMgPSBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgcmV0dXJuIGRvY3VtZW50cy5pbmRleENoYWluKGZuYW1lKTtcbn1cblxuXG4vKipcbiAqIE1hbmlwdWxhdGUgdGhlIHJlbD0gYXR0cmlidXRlcyBvbiBhIGxpbmsgcmV0dXJuZWQgZnJvbSBNYWhhYmh1dGEuXG4gKlxuICogQHBhcmFtcyB7JGxpbmt9IFRoZSBsaW5rIHRvIG1hbmlwdWxhdGVcbiAqIEBwYXJhbXMge2F0dHJ9IFRoZSBhdHRyaWJ1dGUgbmFtZVxuICogQHBhcmFtcyB7ZG9hdHRyfSBCb29sZWFuIGZsYWcgd2hldGhlciB0byBzZXQgKHRydWUpIG9yIHJlbW92ZSAoZmFsc2UpIHRoZSBhdHRyaWJ1dGVcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW5rUmVsU2V0QXR0cigkbGluaywgYXR0ciwgZG9hdHRyKSB7XG4gICAgbGV0IGxpbmtyZWwgPSAkbGluay5hdHRyKCdyZWwnKTtcbiAgICBsZXQgcmVscyA9IGxpbmtyZWwgPyBsaW5rcmVsLnNwbGl0KCcgJykgOiBbXTtcbiAgICBsZXQgaGFzYXR0ciA9IHJlbHMuaW5kZXhPZihhdHRyKSA+PSAwO1xuICAgIGlmICghaGFzYXR0ciAmJiBkb2F0dHIpIHtcbiAgICAgICAgcmVscy51bnNoaWZ0KGF0dHIpO1xuICAgICAgICAkbGluay5hdHRyKCdyZWwnLCByZWxzLmpvaW4oJyAnKSk7XG4gICAgfSBlbHNlIGlmIChoYXNhdHRyICYmICFkb2F0dHIpIHtcbiAgICAgICAgcmVscy5zcGxpY2UocmVscy5pbmRleE9mKGF0dHIpKTtcbiAgICAgICAgJGxpbmsuYXR0cigncmVsJywgcmVscy5qb2luKCcgJykpO1xuICAgIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBzdHJpbmcgb2YgYW4gSFRNTCBhdHRyaWJ1dGUsIHdoZXJlIHRoZSB2YWx1ZSBwb3J0aW9uXG4gKiBpcyBwcm9wZXJseSBlbmNvZGVkIHRvIGRlZmFuZyBhbnkgcG90ZW50aWFsIGF0dGFja3MuXG4gKlxuICogQHBhcmFtIG5hbWVcbiAqIEBwYXJhbSB2YWx1ZVxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRvSFRNTEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgID8gYCAke25hbWV9PVwiJHtlbmNvZGUodmFsdWUpfVwiYFxuICAgICAgICA6ICcnO1xufTtcblxuLyoqXG4gKiBDb21wdXRlIGFuIGFic29sdXRlIHZwYXRoIGZyb20gYSByZWxhdGl2ZSBwYXRoIHJlZmVyZW5jZS5cbiAqIFxuICogVGhpcyBmdW5jdGlvbiByZXNvbHZlcyBhIHJlbGF0aXZlIHBhdGggKGxpa2UgXCIuLi9maWxlLmh0bWxcIiBvciBcIi4vZmlsZS5odG1sXCIpXG4gKiB0byBhbiBhYnNvbHV0ZSB2cGF0aCBpbiB0aGUgdmlydHVhbCBmaWxlc3lzdGVtLCBiYXNlZCBvbiB0aGUgdnBhdGggb2YgdGhlXG4gKiBjdXJyZW50IGRvY3VtZW50LlxuICogXG4gKiBJZiB0aGUgaW5wdXQgcGF0aCBpcyBhbHJlYWR5IGFic29sdXRlIChzdGFydHMgd2l0aCAnLycpLCBpdCBpcyByZXR1cm5lZFxuICogYXMtaXMgYWZ0ZXIgbm9ybWFsaXphdGlvbi5cbiAqIFxuICogQHBhcmFtIGJhc2VWcGF0aCBUaGUgdnBhdGggb2YgdGhlIGRvY3VtZW50IG1ha2luZyB0aGUgcmVmZXJlbmNlIChlLmcuLCBtZXRhZGF0YS5kb2N1bWVudC5wYXRoKVxuICogQHBhcmFtIHJlbGF0aXZlUGF0aCBUaGUgcGF0aCB0byByZXNvbHZlIChjYW4gYmUgcmVsYXRpdmUgb3IgYWJzb2x1dGUpXG4gKiBAcmV0dXJucyBUaGUgYWJzb2x1dGUgdnBhdGggaW4gdGhlIHZpcnR1YWwgZmlsZXN5c3RlbVxuICogXG4gKiBAZXhhbXBsZVxuICogLy8gRnJvbSBkb2N1bWVudCBhdCAnaGllci9kaXIxL3BhZ2UuaHRtbC5tZCcgcmVmZXJlbmNpbmcgJy4uL3NpYmxpbmcvZmlsZS5odG1sJ1xuICogcmVzb2x2ZVZwYXRoKCdoaWVyL2RpcjEvcGFnZS5odG1sLm1kJywgJy4uL3NpYmxpbmcvZmlsZS5odG1sJylcbiAqIC8vIFJldHVybnM6ICcvaGllci9zaWJsaW5nL2ZpbGUuaHRtbCdcbiAqIFxuICogQGV4YW1wbGVcbiAqIC8vIEFscmVhZHkgYWJzb2x1dGUgcGF0aFxuICogcmVzb2x2ZVZwYXRoKCdoaWVyL2RpcjEvcGFnZS5odG1sLm1kJywgJy9hYnNvbHV0ZS9wYXRoLmh0bWwnKVxuICogLy8gUmV0dXJuczogJy9hYnNvbHV0ZS9wYXRoLmh0bWwnXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlVnBhdGgoYmFzZVZwYXRoOiBzdHJpbmcsIHJlbGF0aXZlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIWJhc2VWcGF0aCB8fCB0eXBlb2YgYmFzZVZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlc29sdmVWcGF0aDogYmFzZVZwYXRoIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLCBnb3QgJHt0eXBlb2YgYmFzZVZwYXRofWApO1xuICAgIH1cbiAgICBpZiAoIXJlbGF0aXZlUGF0aCB8fCB0eXBlb2YgcmVsYXRpdmVQYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlc29sdmVWcGF0aDogcmVsYXRpdmVQYXRoIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLCBnb3QgJHt0eXBlb2YgcmVsYXRpdmVQYXRofWApO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBwYXRoIGlzIGFscmVhZHkgYWJzb2x1dGUsIHJldHVybiBpdCBub3JtYWxpemVkXG4gICAgaWYgKHBhdGguaXNBYnNvbHV0ZShyZWxhdGl2ZVBhdGgpKSB7XG4gICAgICAgIHJldHVybiBwYXRoLm5vcm1hbGl6ZShyZWxhdGl2ZVBhdGgpO1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgZGlyZWN0b3J5IG9mIHRoZSBiYXNlIHZwYXRoXG4gICAgY29uc3QgZGlyID0gcGF0aC5kaXJuYW1lKGJhc2VWcGF0aCk7XG4gICAgXG4gICAgLy8gSm9pbiB3aXRoICcvJyBwcmVmaXggdG8gZW5zdXJlIHdlIGdldCBhbiBhYnNvbHV0ZSB2cGF0aFxuICAgIC8vIGFuZCBub3JtYWxpemUgdG8gY2xlYW4gdXAgYW55IC4uIG9yIC4gc2VnbWVudHNcbiAgICByZXR1cm4gcGF0aC5ub3JtYWxpemUocGF0aC5qb2luKCcvJywgZGlyLCByZWxhdGl2ZVBhdGgpKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8gUlNTIEZlZWQgR2VuZXJhdGlvblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVSU1MoY29uZmlnLCBjb25maWdyc3MsIGZlZWREYXRhLCBpdGVtcywgcmVuZGVyVG8pIHtcblxuICAgIC8vIFN1cHBvc2VkbHkgaXQncyByZXF1aXJlZCB0byB1c2UgaGFzT3duUHJvcGVydHlcbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzcyODM2MC9ob3ctZG8taS1jb3JyZWN0bHktY2xvbmUtYS1qYXZhc2NyaXB0LW9iamVjdCM3Mjg2OTRcbiAgICAvL1xuICAgIC8vIEJ1dCwgaW4gb3VyIGNhc2UgdGhhdCByZXN1bHRlZCBpbiBhbiBlbXB0eSBvYmplY3RcblxuICAgIC8vIGNvbnNvbGUubG9nKCdjb25maWdyc3MgJysgdXRpbC5pbnNwZWN0KGNvbmZpZ3JzcykpO1xuXG4gICAgLy8gQ29uc3RydWN0IGluaXRpYWwgcnNzIG9iamVjdFxuICAgIHZhciByc3MgPSB7fTtcbiAgICBmb3IgKGxldCBrZXkgaW4gY29uZmlncnNzLnJzcykge1xuICAgICAgICAvL2lmIChjb25maWdyc3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcnNzW2tleV0gPSBjb25maWdyc3MucnNzW2tleV07XG4gICAgICAgIC8vfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKCdyc3MgJysgdXRpbC5pbnNwZWN0KHJzcykpO1xuXG4gICAgLy8gY29uc29sZS5sb2coJ2ZlZWREYXRhICcrIHV0aWwuaW5zcGVjdChmZWVkRGF0YSkpO1xuXG4gICAgLy8gVGhlbiBmaWxsIGluIGZyb20gZmVlZERhdGFcbiAgICBmb3IgKGxldCBrZXkgaW4gZmVlZERhdGEpIHtcbiAgICAgICAgLy9pZiAoZmVlZERhdGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgcnNzW2tleV0gPSBmZWVkRGF0YVtrZXldO1xuICAgICAgICAvL31cbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZygnZ2VuZXJhdGVSU1MgcnNzICcrIHV0aWwuaW5zcGVjdChyc3MpKTtcblxuICAgIHZhciByc3NmZWVkID0gbmV3IFJTUyhyc3MpO1xuXG4gICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7IHJzc2ZlZWQuaXRlbShpdGVtKTsgfSk7XG5cbiAgICB2YXIgeG1sID0gcnNzZmVlZC54bWwoKTtcbiAgICB2YXIgcmVuZGVyT3V0ID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgcmVuZGVyVG8pO1xuXG4gICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJPdXQpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxuICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyT3V0LCB4bWwsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcblxufTtcblxuLy8gRm9yIG9FbWJlZCwgQ29uc2lkZXIgbWFraW5nIGFuIGV4dGVybmFsIHBsdWdpblxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvb2VtYmVkLWFsbFxuLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvZW1iZWRhYmxlXG4vLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9tZWRpYS1wYXJzZXJcbi8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL29lbWJldHRlclxuXG5cbi8qKlxuICogVGhlIEFrYXNoYVJlbmRlciBwcm9qZWN0IGNvbmZpZ3VyYXRpb24gb2JqZWN0LiAgXG4gKiBPbmUgaW5zdGFudGlhdGVzIGEgQ29uZmlndXJhdGlvbiBvYmplY3QsIHRoZW4gZmlsbHMgaXRcbiAqIHdpdGggc2V0dGluZ3MgYW5kIHBsdWdpbnMuXG4gKiBcbiAqIEBzZWUgbW9kdWxlOkNvbmZpZ3VyYXRpb25cbiAqL1xuXG4vLyBjb25zdCBfY29uZmlnX3BsdWdpbkRhdGEgPSBTeW1ib2woJ3BsdWdpbkRhdGEnKTtcbi8vIGNvbnN0IF9jb25maWdfYXNzZXRzRGlycyA9IFN5bWJvbCgnYXNzZXRzRGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19kb2N1bWVudERpcnMgPSBTeW1ib2woJ2RvY3VtZW50RGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19sYXlvdXREaXJzID0gU3ltYm9sKCdsYXlvdXREaXJzJyk7XG4vLyBjb25zdCBfY29uZmlnX3BhcnRpYWxEaXJzID0gU3ltYm9sKCdwYXJ0aWFsRGlycycpO1xuLy8gY29uc3QgX2NvbmZpZ19tYWhhZnVuY3MgPSBTeW1ib2woJ21haGFmdW5jcycpO1xuLy8gY29uc3QgX2NvbmZpZ19yZW5kZXJUbyA9IFN5bWJvbCgncmVuZGVyVG8nKTtcbi8vIGNvbnN0IF9jb25maWdfbWV0YWRhdGEgPSBTeW1ib2woJ21ldGFkYXRhJyk7XG4vLyBjb25zdCBfY29uZmlnX3Jvb3RfdXJsID0gU3ltYm9sKCdyb290X3VybCcpO1xuLy8gY29uc3QgX2NvbmZpZ19zY3JpcHRzID0gU3ltYm9sKCdzY3JpcHRzJyk7XG4vLyBjb25zdCBfY29uZmlnX3BsdWdpbnMgPSBTeW1ib2woJ3BsdWdpbnMnKTtcbi8vIGNvbnN0IF9jb25maWdfY2hlZXJpbyA9IFN5bWJvbCgnY2hlZXJpbycpO1xuLy8gY29uc3QgX2NvbmZpZ19jb25maWdkaXIgPSBTeW1ib2woJ2NvbmZpZ2RpcicpO1xuLy8gY29uc3QgX2NvbmZpZ19jYWNoZWRpciAgPSBTeW1ib2woJ2NhY2hlZGlyJyk7XG4vLyBjb25zdCBfY29uZmlnX2NvbmN1cnJlbmN5ID0gU3ltYm9sKCdjb25jdXJyZW5jeScpO1xuLy8gY29uc3QgX2NvbmZpZ19yZW5kZXJlcnMgPSBTeW1ib2woJ3JlbmRlcmVycycpO1xuXG4vKipcbiAqIERhdGEgdHlwZSBkZXNjcmliaW5nIGl0ZW1zIGluIHRoZVxuICogamF2YVNjcmlwdFRvcCBhbmQgamF2YVNjcmlwdEJvdHRvbSBhcnJheXMuXG4gKiBUaGUgZmllbGRzIGNvcnJlc3BvbmQgdG8gdGhlIGF0dHJpYnV0ZXNcbiAqIG9mIHRoZSA8c2NyaXB0PiB0YWcgd2hpY2ggY2FuIGJlIHVzZWRcbiAqIGVpdGhlciBpbiB0aGUgdG9wIG9yIGJvdHRvbSBvZlxuICogYW4gSFRNTCBmaWxlLlxuICovXG5leHBvcnQgdHlwZSBqYXZhU2NyaXB0SXRlbSA9IHtcbiAgICBocmVmPzogc3RyaW5nLFxuICAgIHNjcmlwdD86IHN0cmluZyxcbiAgICBsYW5nPzogc3RyaW5nXG59O1xuXG5leHBvcnQgdHlwZSBzdHlsZXNoZWV0SXRlbSA9IHtcbiAgICBocmVmPzogc3RyaW5nLFxuICAgIG1lZGlhPzogc3RyaW5nXG5cbn07XG5cbi8qKlxuICogRGVmaW5lcyB0aGUgc3RydWN0dXJlIGZvciBkaXJlY3RvcnlcbiAqIG1vdW50IHNwZWNpZmljYXRpb24gaW4gdGhlIENvbmZpZ3VyYXRpb24uXG4gKiBcbiAqIFRoZSBzaW1wbGUgJ3N0cmluZycgZm9ybSBzYXlzIHRvIG1vdW50XG4gKiB0aGUgbmFtZWQgZnNwYXRoIG9uIHRoZSByb290IG9mIHRoZVxuICogdmlydHVhbCBmaWxlc3BhY2UuXG4gKiBcbiAqIFRoZSBvYmplY3QgZm9ybSBhbGxvd3MgdXMgdG8gbW91bnRcbiAqIGFuIGZzcGF0aCBpbnRvIGEgZGlmZmVyZW50IGxvY2F0aW9uXG4gKiBpbiB0aGUgdmlydHVhbCBmaWxlc3BhY2UsIHRvIGlnbm9yZVxuICogZmlsZXMgYmFzZWQgb24gR0xPQiBwYXR0ZXJucywgYW5kIHRvXG4gKiBpbmNsdWRlIG1ldGFkYXRhIGZvciBldmVyeSBmaWxlIGluXG4gKiBhIGRpcmVjdG9yeSB0cmVlLlxuICogXG4gKiBJbiB0aGUgZmlsZS1jYWNoZSBtb2R1bGUsIHRoaXMgaXNcbiAqIGNvbnZlcnRlZCB0byB0aGUgZGlyVG9XYXRjaCBzdHJ1Y3R1cmVcbiAqIHVzZWQgYnkgU3RhY2tlZERpcnMuXG4gKi9cbi8qKlxuICogQ29uZmlndXJhdGlvbiBvZiBhbiBBa2FzaGFSZW5kZXIgcHJvamVjdCwgaW5jbHVkaW5nIHRoZSBpbnB1dCBkaXJlY3RvcmllcyxcbiAqIG91dHB1dCBkaXJlY3RvcnksIHBsdWdpbnMsIGFuZCB2YXJpb3VzIHNldHRpbmdzLlxuICpcbiAqIFVTQUdFOlxuICpcbiAqIGNvbnN0IGFrYXNoYSA9IHJlcXVpcmUoJ2FrYXNoYXJlbmRlcicpO1xuICogY29uc3QgY29uZmlnID0gbmV3IGFrYXNoYS5Db25maWd1cmF0aW9uKCk7XG4gKi9cbmV4cG9ydCBjbGFzcyBDb25maWd1cmF0aW9uIHtcbiAgICAjcmVuZGVyZXJzOiBSZW5kZXJlcnMuQ29uZmlndXJhdGlvbjtcbiAgICAjY29uZmlnZGlyOiBzdHJpbmc7XG4gICAgI2NhY2hlZGlyOiBzdHJpbmc7XG4gICAgI2Fzc2V0c0RpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2xheW91dERpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2RvY3VtZW50RGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjcGFydGlhbERpcnM/OiBkaXJUb01vdW50W107XG4gICAgI21haGFmdW5jcztcbiAgICAjY2hlZXJpbz86IGNoZWVyaW8uQ2hlZXJpb09wdGlvbnM7XG4gICAgI3JlbmRlclRvOiBzdHJpbmc7XG4gICAgI3NjcmlwdHM/OiB7XG4gICAgICAgIHN0eWxlc2hlZXRzPzogc3R5bGVzaGVldEl0ZW1bXSxcbiAgICAgICAgamF2YVNjcmlwdFRvcD86IGphdmFTY3JpcHRJdGVtW10sXG4gICAgICAgIGphdmFTY3JpcHRCb3R0b20/OiBqYXZhU2NyaXB0SXRlbVtdXG4gICAgfTtcbiAgICAjY29uY3VycmVuY3k6IG51bWJlcjtcbiAgICAjY2FjaGluZ1RpbWVvdXQ6IG51bWJlcjtcbiAgICAjbWV0YWRhdGE6IGFueTtcbiAgICAjcm9vdF91cmw6IHN0cmluZztcbiAgICAjcGx1Z2lucztcbiAgICAjcGx1Z2luRGF0YTtcbiAgICAjdmVyYm9zZTogYm9vbGVhbjtcbiAgICAjcGVyZkRhdGFEaXI6IHN0cmluZztcbiAgICBcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGVwYXRoKSB7XG5cbiAgICAgICAgLy8gdGhpc1tfY29uZmlnX3JlbmRlcmVyc10gPSBbXTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzID0gbmV3IFJlbmRlcmVycy5Db25maWd1cmF0aW9uKHtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiNtYWhhZnVuY3MgPSBbXTtcbiAgICAgICAgdGhpcy4jc2NyaXB0cyA9IHtcbiAgICAgICAgICAgIHN0eWxlc2hlZXRzOiBbXSxcbiAgICAgICAgICAgIGphdmFTY3JpcHRUb3A6IFtdLFxuICAgICAgICAgICAgamF2YVNjcmlwdEJvdHRvbTogW11cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLiNjb25jdXJyZW5jeSA9IDM7XG4gICAgICAgIC8vIDYwIHNlY29uZHMsIG9yIDEgbWludXRlXG4gICAgICAgIHRoaXMuI2NhY2hpbmdUaW1lb3V0ID0gNjAwMDA7XG5cbiAgICAgICAgdGhpcy4jZG9jdW1lbnREaXJzID0gW107XG4gICAgICAgIHRoaXMuI2xheW91dERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jcGFydGlhbERpcnMgPSBbXTtcbiAgICAgICAgdGhpcy4jYXNzZXRzRGlycyA9IFtdO1xuXG4gICAgICAgIHRoaXMuI21haGFmdW5jcyA9IFtdO1xuXG4gICAgICAgIHRoaXMuI3JlbmRlclRvID0gJ291dCc7XG5cbiAgICAgICAgdGhpcy4jbWV0YWRhdGEgPSB7fSBhcyBhbnk7XG5cbiAgICAgICAgdGhpcy4jcGx1Z2lucyA9IFtdO1xuICAgICAgICB0aGlzLiNwbHVnaW5EYXRhID0gW107XG4gICAgICAgIFxuICAgICAgICB0aGlzLiN2ZXJib3NlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy4jcGVyZkRhdGFEaXIgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgLypcbiAgICAgICAgICogSXMgdGhpcyB0aGUgYmVzdCBwbGFjZSBmb3IgdGhpcz8gIEl0IGlzIG5lY2Vzc2FyeSB0b1xuICAgICAgICAgKiBjYWxsIHRoaXMgZnVuY3Rpb24gc29tZXdoZXJlLiAgVGhlIG5hdHVyZSBvZiB0aGlzIGZ1bmN0aW9uXG4gICAgICAgICAqIGlzIHRoYXQgaXQgY2FuIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyB3aXRoIG5vIGltcGFjdC4gIFxuICAgICAgICAgKiBCeSBiZWluZyBsb2NhdGVkIGhlcmUsIGl0IHdpbGwgYWx3YXlzIGJlIGNhbGxlZCBieSB0aGVcbiAgICAgICAgICogdGltZSBhbnkgQ29uZmlndXJhdGlvbiBpcyBnZW5lcmF0ZWQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUaGlzIGlzIGV4ZWN1dGVkIGluIEBha2FzaGFjbXMvcmVuZGVyZXJzXG4gICAgICAgIC8vIHRoaXNbX2NvbmZpZ19yZW5kZXJlcnNdLnJlZ2lzdGVyQnVpbHRJblJlbmRlcmVycygpO1xuXG4gICAgICAgIC8vIFByb3ZpZGUgYSBtZWNoYW5pc20gdG8gZWFzaWx5IHNwZWNpZnkgY29uZmlnRGlyXG4gICAgICAgIC8vIFRoZSBwYXRoIGluIGNvbmZpZ0RpciBtdXN0IGJlIHRoZSBwYXRoIG9mIHRoZSBjb25maWd1cmF0aW9uIGZpbGUuXG4gICAgICAgIC8vIFRoZXJlIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIGEgd2F5IHRvIGRldGVybWluZSB0aGF0IGZyb20gaGVyZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRm9yIGV4YW1wbGUgbW9kdWxlLnBhcmVudC5maWxlbmFtZSBpbiB0aGlzIGNhc2UgcG9pbnRzXG4gICAgICAgIC8vIHRvIGFrYXNoYXJlbmRlci9pbmRleC5qcyBiZWNhdXNlIHRoYXQncyB0aGUgbW9kdWxlIHdoaWNoXG4gICAgICAgIC8vIGxvYWRlZCB0aGlzIG1vZHVsZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gT25lIGNvdWxkIGltYWdpbmUgYSBkaWZmZXJlbnQgaW5pdGlhbGl6YXRpb24gcGF0dGVybi4gIEluc3RlYWRcbiAgICAgICAgLy8gb2YgYWthc2hhcmVuZGVyIHJlcXVpcmluZyBDb25maWd1cmF0aW9uLmpzLCB0aGF0IGZpbGUgY291bGQgYmVcbiAgICAgICAgLy8gcmVxdWlyZWQgYnkgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZS4gIEluIHN1Y2ggYSBjYXNlXG4gICAgICAgIC8vIG1vZHVsZS5wYXJlbnQuZmlsZW5hbWUgV09VTEQgaW5kaWNhdGUgdGhlIGZpbGVuYW1lIGZvciB0aGVcbiAgICAgICAgLy8gY29uZmlndXJhdGlvbiBmaWxlLCBhbmQgd291bGQgYmUgYSBzb3VyY2Ugb2Ygc2V0dGluZ1xuICAgICAgICAvLyB0aGUgY29uZmlnRGlyIHZhbHVlLlxuICAgICAgICBpZiAodHlwZW9mIG1vZHVsZXBhdGggIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZXBhdGggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnRGlyID0gcGF0aC5kaXJuYW1lKG1vZHVsZXBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVyeSBjYXJlZnVsbHkgYWRkIHRoZSA8cGFydGlhbD4gc3VwcG9ydCBmcm9tIE1haGFiaHV0YSBhcyB0aGVcbiAgICAgICAgLy8gdmVyeSBmaXJzdCB0aGluZyBzbyB0aGF0IGl0IGV4ZWN1dGVzIGJlZm9yZSBhbnl0aGluZyBlbHNlLlxuICAgICAgICBsZXQgY29uZmlnID0gdGhpcztcbiAgICAgICAgdGhpcy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZm5hbWUsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGRlZmF1bHQgY29uZmlndXJhdGlvbiB2YWx1ZXMgZm9yIGFueXRoaW5nIHdoaWNoIGhhcyBub3RcbiAgICAgKiBhbHJlYWR5IGJlZW4gY29uZmlndXJlZC4gIFNvbWUgYnVpbHQtaW4gZGVmYXVsdHMgaGF2ZSBiZWVuIGRlY2lkZWRcbiAgICAgKiBhaGVhZCBvZiB0aW1lLiAgRm9yIGVhY2ggY29uZmlndXJhdGlvbiBzZXR0aW5nLCBpZiBub3RoaW5nIGhhcyBiZWVuXG4gICAgICogZGVjbGFyZWQsIHRoZW4gdGhlIGRlZmF1bHQgaXMgc3Vic3RpdHV0ZWQuXG4gICAgICpcbiAgICAgKiBJdCBpcyBleHBlY3RlZCB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGxhc3QgaW4gdGhlIGNvbmZpZyBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBpbnN0YWxscyB0aGUgYGJ1aWx0LWluYCBwbHVnaW4uICBJdCBuZWVkcyB0byBiZSBsYXN0IG9uXG4gICAgICogdGhlIHBsdWdpbiBjaGFpbiBzbyB0aGF0IGl0cyBzdHlsZXNoZWV0cyBhbmQgcGFydGlhbHMgYW5kIHdoYXRub3RcbiAgICAgKiBjYW4gYmUgb3ZlcnJpZGRlbiBieSBvdGhlciBwbHVnaW5zLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgcHJlcGFyZSgpIHtcblxuICAgICAgICBjb25zdCBDT05GSUcgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IGNvbmZpZ0RpclBhdGggPSBmdW5jdGlvbihkaXJubSkge1xuICAgICAgICAgICAgbGV0IGNvbmZpZ1BhdGggPSBkaXJubTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgQ09ORklHLmNvbmZpZ0RpciAhPT0gJ3VuZGVmaW5lZCcgJiYgQ09ORklHLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnUGF0aCA9IHBhdGguam9pbihDT05GSUcuY29uZmlnRGlyLCBkaXJubSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29uZmlnUGF0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzdGF0O1xuXG4gICAgICAgIGNvbnN0IGNhY2hlRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdjYWNoZScpO1xuICAgICAgICBpZiAoIXRoaXMuI2NhY2hlZGlyKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjYWNoZURpcnNQYXRoKVxuICAgICAgICAgICAgICYmIChzdGF0ID0gZnMuc3RhdFN5bmMoY2FjaGVEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhY2hlRGlyID0gJ2NhY2hlJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInY2FjaGUnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhjYWNoZURpcnNQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlRGlyID0gJ2NhY2hlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNjYWNoZWRpciAmJiAhZnMuZXhpc3RzU3luYyh0aGlzLiNjYWNoZWRpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLiNjYWNoZWRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldHNEaXJzUGF0aCA9IGNvbmZpZ0RpclBhdGgoJ2Fzc2V0cycpO1xuICAgICAgICBpZiAoIXRoaXMuI2Fzc2V0c0RpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGFzc2V0c0RpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGFzc2V0c0RpcnNQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQXNzZXRzRGlyKCdhc3NldHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXlvdXRzRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdsYXlvdXRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jbGF5b3V0RGlycykge1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobGF5b3V0c0RpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGxheW91dHNEaXJzUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZExheW91dHNEaXIoJ2xheW91dHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJ0aWFsRGlyc1BhdGggPSBjb25maWdEaXJQYXRoKCdwYXJ0aWFscycpO1xuICAgICAgICBpZiAoIW1haGFQYXJ0aWFsLmNvbmZpZ3VyYXRpb24ucGFydGlhbERpcnMpIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhcnRpYWxEaXJzUGF0aCkgJiYgKHN0YXQgPSBmcy5zdGF0U3luYyhwYXJ0aWFsRGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRQYXJ0aWFsc0RpcigncGFydGlhbHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2N1bWVudERpcnNQYXRoID0gY29uZmlnRGlyUGF0aCgnZG9jdW1lbnRzJyk7XG4gICAgICAgIGlmICghdGhpcy4jZG9jdW1lbnREaXJzKSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhkb2N1bWVudERpcnNQYXRoKSAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKGRvY3VtZW50RGlyc1BhdGgpKSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGREb2N1bWVudHNEaXIoJ2RvY3VtZW50cycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidkb2N1bWVudHMnIGlzIG5vdCBhIGRpcmVjdG9yeVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vICdkb2N1bWVudERpcnMnIHNldHRpbmcsIGFuZCBubyAnZG9jdW1lbnRzJyBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZW5kZXJUb1BhdGggPSBjb25maWdEaXJQYXRoKCdvdXQnKTtcbiAgICAgICAgaWYgKCF0aGlzLiNyZW5kZXJUbykgIHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHJlbmRlclRvUGF0aClcbiAgICAgICAgICAgICAmJiAoc3RhdCA9IGZzLnN0YXRTeW5jKHJlbmRlclRvUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFJlbmRlckRlc3RpbmF0aW9uKCdvdXQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInb3V0JyBpcyBub3QgYSBkaXJlY3RvcnlcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmMocmVuZGVyVG9QYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFJlbmRlckRlc3RpbmF0aW9uKCdvdXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNyZW5kZXJUbyAmJiAhZnMuZXhpc3RzU3luYyh0aGlzLiNyZW5kZXJUbykpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLiNyZW5kZXJUbywgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgYWthc2hhY21zLWJ1aWx0aW4gcGx1Z2luIG5lZWRzIHRvIGJlIGxhc3Qgb24gdGhlIGNoYWluIHNvIHRoYXRcbiAgICAgICAgLy8gaXRzIHBhcnRpYWxzIGV0YyBjYW4gYmUgZWFzaWx5IG92ZXJyaWRkZW4uICBUaGlzIGlzIHRoZSBtb3N0IGNvbnZlbmllbnRcbiAgICAgICAgLy8gcGxhY2UgdG8gZGVjbGFyZSB0aGF0IHBsdWdpbi5cbiAgICAgICAgLy9cblxuICAgICAgICAvLyBOb3JtYWxseSB3ZSdkIGRvIHJlcXVpcmUoJy4vYnVpbHQtaW4uanMnKS5cbiAgICAgICAgLy8gQnV0LCBpbiB0aGlzIGNvbnRleHQgdGhhdCBkb2Vzbid0IHdvcmsuXG4gICAgICAgIC8vIFdoYXQgd2UgZGlkIGlzIHRvIGltcG9ydCB0aGVcbiAgICAgICAgLy8gQnVpbHRJblBsdWdpbiBjbGFzcyBlYXJsaWVyIHNvIHRoYXRcbiAgICAgICAgLy8gaXQgY2FuIGJlIHVzZWQgaGVyZS5cbiAgICAgICAgdGhpcy51c2UoQnVpbHRJblBsdWdpbiwge1xuICAgICAgICAgICAgLy8gYnVpbHQtaW4gb3B0aW9ucyBpZiBhbnlcbiAgICAgICAgICAgIC8vIERvIG5vdCBuZWVkIHRoaXMgaGVyZSBhbnkgbG9uZ2VyIGJlY2F1c2UgaXQgaXMgaGFuZGxlZFxuICAgICAgICAgICAgLy8gaW4gdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgICAgICAgLy8gU2V0IHVwIHRoZSBNYWhhYmh1dGEgcGFydGlhbCB0YWcgc28gaXQgcmVuZGVycyB0aHJvdWdoIEFrYXNoYVJlbmRlclxuICAgICAgICAgICAgLy8gcmVuZGVyUGFydGlhbDogZnVuY3Rpb24oZm5hbWUsIG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHJlbmRlci5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjb3JkIHRoZSBjb25maWd1cmF0aW9uIGRpcmVjdG9yeSBzbyB0aGF0IHdlIGNhbiBjb3JyZWN0bHkgaW50ZXJwb2xhdGVcbiAgICAgKiB0aGUgcGF0aG5hbWVzIHdlJ3JlIHByb3ZpZGVkLlxuICAgICAqL1xuICAgIHNldCBjb25maWdEaXIoY2ZnZGlyOiBzdHJpbmcpIHsgdGhpcy4jY29uZmlnZGlyID0gY2ZnZGlyOyB9XG4gICAgZ2V0IGNvbmZpZ0RpcigpIHsgcmV0dXJuIHRoaXMuI2NvbmZpZ2RpcjsgfVxuXG4gICAgc2V0IGNhY2hlRGlyKGRpcm5tOiBzdHJpbmcpIHsgdGhpcy4jY2FjaGVkaXIgPSBkaXJubTsgfVxuICAgIGdldCBjYWNoZURpcigpIHsgcmV0dXJuIHRoaXMuI2NhY2hlZGlyOyB9XG5cbiAgICBzZXQgdmVyYm9zZSh2YWw6IGJvb2xlYW4pIHsgdGhpcy4jdmVyYm9zZSA9IHZhbDsgfVxuICAgIGdldCB2ZXJib3NlKCkgeyByZXR1cm4gdGhpcy4jdmVyYm9zZTsgfVxuXG4gICAgc2V0IHBlcmZEYXRhRGlyKHN0b3JlRGlyOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy4jcGVyZkRhdGFEaXIgPSBzdG9yZURpcjtcbiAgICB9XG4gICAgZ2V0IHBlcmZEYXRhRGlyKCkgeyByZXR1cm4gdGhpcy4jcGVyZkRhdGFEaXI7IH1cblxuICAgIC8vIHNldCBha2FzaGEoX2FrYXNoYSkgIHsgdGhpc1tfY29uZmlnX2FrYXNoYV0gPSBfYWthc2hhOyB9XG4gICAgZ2V0IGFrYXNoYSgpIHsgcmV0dXJuIG1vZHVsZV9leHBvcnRzOyB9XG5cbiAgICBhc3luYyBkb2N1bWVudHNDYWNoZSgpIHsgcmV0dXJuIGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTsgfVxuICAgIGFzeW5jIGFzc2V0c0NhY2hlKCkgICAgeyByZXR1cm4gZmlsZWNhY2hlLmFzc2V0c0NhY2hlOyB9XG4gICAgYXN5bmMgbGF5b3V0c0NhY2hlKCkgICB7IHJldHVybiBmaWxlY2FjaGUubGF5b3V0c0NhY2hlOyB9XG4gICAgYXN5bmMgcGFydGlhbHNDYWNoZSgpICB7IHJldHVybiBmaWxlY2FjaGUucGFydGlhbHNDYWNoZTsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgZGlyZWN0b3J5IHRvIHRoZSBkb2N1bWVudERpcnMgY29uZmlndXJhdGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgZGlyVG9Nb3VudH0gZGlyIFRoZSBwYXRobmFtZSB0byB1c2Ugb3IgZGlyVG9Nb3VudCBvYmplY3RcbiAgICAgKi9cbiAgICBhZGREb2N1bWVudHNEaXIoZGlyOiBzdHJpbmcgfCBkaXJUb01vdW50KSB7XG4gICAgICAgIGxldCBkaXJNb3VudDogZGlyVG9Nb3VudDtcbiAgICAgICAgXG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIpLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIuc3JjKSAmJiB0aGlzLmNvbmZpZ0RpciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmRpcixcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpci5zcmMpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghaXNEaXJUb01vdW50KGRpck1vdW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGREb2N1bWVudHNEaXIgLSBpbnZhbGlkIGRpclRvTW91bnQgb2JqZWN0OiAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2RvY3VtZW50RGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGRvY3VtZW50RGlycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2RvY3VtZW50RGlycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb29rIHVwIHRoZSBkb2N1bWVudCBkaXJlY3RvcnkgaW5mb3JtYXRpb24gZm9yIGEgZ2l2ZW4gZG9jdW1lbnQgZGlyZWN0b3J5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJuYW1lIFRoZSBkb2N1bWVudCBkaXJlY3RvcnkgdG8gc2VhcmNoIGZvclxuICAgICAqL1xuICAgIGRvY3VtZW50RGlySW5mbyhkaXJuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgZm9yICh2YXIgZG9jRGlyIG9mIHRoaXMuZG9jdW1lbnREaXJzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRvY0RpciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jRGlyLnNyYyA9PT0gZGlybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jRGlyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZG9jRGlyID09PSBkaXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvY0RpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGRpcmVjdG9yeSB0byB0aGUgbGF5b3V0RGlycyBjb25maWd1cnRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IGRpclRvTW91bnR9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlIG9yIGRpclRvTW91bnQgb2JqZWN0XG4gICAgICovXG4gICAgYWRkTGF5b3V0c0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZExheW91dHNEaXIgLSBpbnZhbGlkIGRpclRvTW91bnQgb2JqZWN0OiAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuI2xheW91dERpcnMucHVzaChkaXJNb3VudCk7XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycy5hZGRMYXlvdXREaXIoZGlyTW91bnQuc3JjKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IGxheW91dERpcnMoKSB7IHJldHVybiB0aGlzLiNsYXlvdXREaXJzOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIHBhcnRpYWxEaXJzIGNvbmZpZ3VydGlvbiBhcnJheVxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgZGlyVG9Nb3VudH0gZGlyIFRoZSBwYXRobmFtZSB0byB1c2Ugb3IgZGlyVG9Nb3VudCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRQYXJ0aWFsc0RpcihkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpIHtcbiAgICAgICAgbGV0IGRpck1vdW50OiBkaXJUb01vdW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShkaXIpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBwYXRoLmpvaW4odGhpcy5jb25maWdEaXIsIGRpciksXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGRpcixcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpci5zcmMpICYmIHRoaXMuY29uZmlnRGlyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZGlyLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyLnNyYylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJNb3VudCA9IGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFpc0RpclRvTW91bnQoZGlyTW91bnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZFBhcnRpYWxzRGlyIC0gaW52YWxpZCBkaXJUb01vdW50IG9iamVjdDogJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLiNwYXJ0aWFsRGlycy5wdXNoKGRpck1vdW50KTtcbiAgICAgICAgdGhpcy4jcmVuZGVyZXJzLmFkZFBhcnRpYWxEaXIoZGlyTW91bnQuc3JjKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHBhcnRpYWxzRGlycygpIHsgcmV0dXJuIHRoaXMuI3BhcnRpYWxEaXJzOyB9XG4gICAgZ2V0IHBhcnRpYWxEaXJzKCkgeyByZXR1cm4gdGhpcy4jcGFydGlhbERpcnM7IH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBBZGQgYSBkaXJlY3RvcnkgdG8gdGhlIGFzc2V0RGlycyBjb25maWd1cnRpb24gYXJyYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IGRpclRvTW91bnR9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlIG9yIGRpclRvTW91bnQgb2JqZWN0XG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkQXNzZXRzRGlyKGRpcjogc3RyaW5nIHwgZGlyVG9Nb3VudCkge1xuICAgICAgICBsZXQgZGlyTW91bnQ6IGRpclRvTW91bnQ7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKGRpcikgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyTW91bnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgICAgICBkZXN0OiAnLydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoZGlyLnNyYykgJiYgdGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAuLi5kaXIsXG4gICAgICAgICAgICAgICAgICAgIHNyYzogcGF0aC5qb2luKHRoaXMuY29uZmlnRGlyLCBkaXIuc3JjKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpck1vdW50ID0gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWlzRGlyVG9Nb3VudChkaXJNb3VudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkQXNzZXRzRGlyIC0gaW52YWxpZCBkaXJUb01vdW50IG9iamVjdDogJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLiNhc3NldHNEaXJzLnB1c2goZGlyTW91bnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgYXNzZXREaXJzKCkgeyByZXR1cm4gdGhpcy4jYXNzZXRzRGlyczsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGFuIGFycmF5IG9mIE1haGFiaHV0YSBmdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBtYWhhZnVuY3NcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRNYWhhYmh1dGEobWFoYWZ1bmNzOiBtYWhhYmh1dGEuTWFoYWZ1bmNBcnJheSB8IG1haGFiaHV0YS5NYWhhZnVuY1R5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtYWhhZnVuY3MgPT09ICd1bmRlZmluZWQnIHx8ICFtYWhhZnVuY3MpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5kZWZpbmVkIG1haGFmdW5jcyBpbiAke3RoaXMuY29uZmlnRGlyfWApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuI21haGFmdW5jcy5wdXNoKG1haGFmdW5jcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBtYWhhZnVuY3MoKSB7IHJldHVybiB0aGlzLiNtYWhhZnVuY3M7IH1cblxuICAgIC8qKlxuICAgICAqIERlZmluZSB0aGUgZGlyZWN0b3J5IGludG8gd2hpY2ggdGhlIHByb2plY3QgaXMgcmVuZGVyZWQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRpciBUaGUgcGF0aG5hbWUgdG8gdXNlXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgc2V0UmVuZGVyRGVzdGluYXRpb24oZGlyOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGNvbmZpZ0RpciwgYW5kIGl0J3MgYSByZWxhdGl2ZSBkaXJlY3RvcnksIG1ha2UgaXRcbiAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGNvbmZpZ0RpclxuICAgICAgICBpZiAodGhpcy5jb25maWdEaXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnICYmICFwYXRoLmlzQWJzb2x1dGUoZGlyKSkge1xuICAgICAgICAgICAgICAgIGRpciA9IHBhdGguam9pbih0aGlzLmNvbmZpZ0RpciwgZGlyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNyZW5kZXJUbyA9IGRpcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIEZldGNoIHRoZSBkZWNsYXJlZCBkZXN0aW5hdGlvbiBmb3IgcmVuZGVyaW5nIHRoZSBwcm9qZWN0LiAqL1xuICAgIGdldCByZW5kZXJEZXN0aW5hdGlvbigpIHsgcmV0dXJuIHRoaXMuI3JlbmRlclRvOyB9XG4gICAgZ2V0IHJlbmRlclRvKCkgeyByZXR1cm4gdGhpcy4jcmVuZGVyVG87IH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHZhbHVlIHRvIHRoZSBwcm9qZWN0IG1ldGFkYXRhLiAgVGhlIG1ldGFkYXRhIGlzIGNvbWJpbmVkIHdpdGhcbiAgICAgKiB0aGUgZG9jdW1lbnQgbWV0YWRhdGEgYW5kIHVzZWQgZHVyaW5nIHJlbmRlcmluZy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5kZXggVGhlIGtleSB0byBzdG9yZSB0aGUgdmFsdWUuXG4gICAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBzdG9yZSBpbiB0aGUgbWV0YWRhdGEuXG4gICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgYWRkTWV0YWRhdGEoaW5kZXg6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgICAgICB2YXIgbWQgPSB0aGlzLiNtZXRhZGF0YTtcbiAgICAgICAgbWRbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBtZXRhZGF0YSgpIHsgcmV0dXJuIHRoaXMuI21ldGFkYXRhOyB9XG5cbiAgICAjZGVzY3JpcHRpb25zOiBUYWdEZXNjcmlwdGlvbltdO1xuXG4gICAgLyoqXG4gICAgICogQWRkIHRhZyBkZXNjcmlwdGlvbnMgdG8gdGhlIGRhdGFiYXNlLiAgVGhlIHB1cnBvc2VcbiAgICAgKiBpcyBmb3IgZXhhbXBsZSBhIHRhZyBpbmRleCBwYWdlIGNhbiBnaXZlIGFcbiAgICAgKiBkZXNjcmlwdGlvbiBhdCB0aGUgdG9wIG9mIHRoZSBwYWdlLlxuICAgICAqXG4gICAgICogTk9URTogUG90ZW50aWFsIGJ1ZyAtIFRoaXMgZnVuY3Rpb24gcmVwbGFjZXMgdGhlIGVudGlyZSAjZGVzY3JpcHRpb25zXG4gICAgICogYXJyYXkgcmF0aGVyIHRoYW4gbWVyZ2luZyB3aXRoIGV4aXN0aW5nIGRlc2NyaXB0aW9ucy4gSWYgY2FsbGVkIG11bHRpcGxlXG4gICAgICogdGltZXMsIGVhcmxpZXIgZGVzY3JpcHRpb25zIHdpbGwgYmUgbG9zdC4gQ3VycmVudCBhc3N1bXB0aW9uIGlzIHRoaXNcbiAgICAgKiBmdW5jdGlvbiBpcyBvbmx5IGNhbGxlZCBvbmNlIGZyb20gdGhlIGNvbmZpZ3VyYXRpb24gZmlsZS4gQSBmdXR1cmVcbiAgICAgKiBlbmhhbmNlbWVudCB3b3VsZCBiZSB0byBtZXJnZSBkZXNjcmlwdGlvbnMgaW5zdGVhZCBvZiByZXBsYWNpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGFnZGVzY3MgXG4gICAgICovXG4gICAgYXN5bmMgYWRkVGFnRGVzY3JpcHRpb25zKHRhZ2Rlc2NzOiBUYWdEZXNjcmlwdGlvbltdKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0YWdkZXNjcykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkVGFnRGVzY3JpcHRpb25zIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXkgb2YgdGFnIGRlc2NyaXB0aW9uc2ApO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgZGVzYyBvZiB0YWdkZXNjcykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkZXNjLnRhZ05hbWUgIT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgfHwgdHlwZW9mIGRlc2MuZGVzY3JpcHRpb24gIT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbmNvcnJlY3QgdGFnIGRlc2NyaXB0aW9uICR7dXRpbC5pbnNwZWN0KGRlc2MpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IENvbnNpZGVyIG1lcmdpbmcgd2l0aCBleGlzdGluZyBkZXNjcmlwdGlvbnMgaW5zdGVhZCBvZiByZXBsYWNpbmdcbiAgICAgICAgdGhpcy4jZGVzY3JpcHRpb25zID0gdGFnZGVzY3M7XG4gICAgfVxuXG4gICAgYXN5bmMgI3NhdmVEZXNjcmlwdGlvbnNUb0RCKCkge1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuI2Rlc2NyaXB0aW9ucykpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZGVzYyBvZiB0aGlzLiNkZXNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBkb2N1bWVudHMuYWRkVGFnRGVzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIGRlc2MudGFnTmFtZSwgZGVzYy5kZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIERvY3VtZW50IHRoZSBVUkwgZm9yIGEgd2Vic2l0ZSBwcm9qZWN0LlxuICAgICogQHBhcmFtIHtzdHJpbmd9IHJvb3RfdXJsXG4gICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAqL1xuICAgIHJvb3RVUkwocm9vdF91cmw6IHN0cmluZykge1xuICAgICAgICB0aGlzLiNyb290X3VybCA9IHJvb3RfdXJsO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcm9vdF91cmwoKSB7IHJldHVybiB0aGlzLiNyb290X3VybDsgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IGhvdyBtYW55IGRvY3VtZW50cyB0byByZW5kZXIgY29uY3VycmVudGx5LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb25jdXJyZW5jeVxuICAgICogQHJldHVybnMge0NvbmZpZ3VyYXRpb259XG4gICAgICovXG4gICAgc2V0Q29uY3VycmVuY3koY29uY3VycmVuY3k6IG51bWJlcikge1xuICAgICAgICB0aGlzLiNjb25jdXJyZW5jeSA9IGNvbmN1cnJlbmN5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgY29uY3VycmVuY3koKSB7IHJldHVybiB0aGlzLiNjb25jdXJyZW5jeTsgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB0aW1lLCBpbiBtaWxpc2Vjb25kcywgdG8gaG9ub3JcbiAgICAgKiB0aGUgU2VhcmNoQ2FjaGUgaW4gdGhlIHNlYXJjaCBmdW5jdGlvbi5cbiAgICAgKiBcbiAgICAgKiBEZWZhdWx0IGlzIDYwMDAwICgxIG1pbnV0ZSkuXG4gICAgICogXG4gICAgICogU2V0IHRvIDAgdG8gZGlzYWJsZSBjYWNoaW5nLlxuICAgICAqIEBwYXJhbSB0aW1lb3V0IFxuICAgICAqL1xuICAgIHNldENhY2hpbmdUaW1lb3V0KHRpbWVvdXQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLiNjYWNoaW5nVGltZW91dCA9IHRpbWVvdXQ7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZXRTZWFyY2hDYWNoZVRpbWVvdXQgJHt0aGlzLiNzZWFyY2hDYWNoZVRpbWVvdXR9YCk7XG4gICAgfVxuXG4gICAgZ2V0IGNhY2hpbmdUaW1lb3V0KCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoQ2FjaGVUaW1lb3V0ICR7dGhpcy4jc2VhcmNoQ2FjaGVUaW1lb3V0fWApO1xuICAgICAgICByZXR1cm4gdGhpcy4jY2FjaGluZ1RpbWVvdXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVjbGFyZSBKYXZhU2NyaXB0IHRvIGFkZCB3aXRoaW4gdGhlIGhlYWQgdGFnIG9mIHJlbmRlcmVkIHBhZ2VzLlxuICAgICAqIEBwYXJhbSBzY3JpcHRcbiAgICAgKiBAcmV0dXJucyB7Q29uZmlndXJhdGlvbn1cbiAgICAgKi9cbiAgICBhZGRIZWFkZXJKYXZhU2NyaXB0KHNjcmlwdDogamF2YVNjcmlwdEl0ZW0pIHtcbiAgICAgICAgdGhpcy4jc2NyaXB0cy5qYXZhU2NyaXB0VG9wLnB1c2goc2NyaXB0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZ2V0IHNjcmlwdHMoKSB7IHJldHVybiB0aGlzLiNzY3JpcHRzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsYXJlIEphdmFTY3JpcHQgdG8gYWRkIGF0IHRoZSBib3R0b20gb2YgcmVuZGVyZWQgcGFnZXMuXG4gICAgICogQHBhcmFtIHNjcmlwdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZEZvb3RlckphdmFTY3JpcHQoc2NyaXB0OiBqYXZhU2NyaXB0SXRlbSkge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLmphdmFTY3JpcHRCb3R0b20ucHVzaChzY3JpcHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNsYXJlIGEgQ1NTIFN0eWxlc2hlZXQgdG8gYWRkIHdpdGhpbiB0aGUgaGVhZCB0YWcgb2YgcmVuZGVyZWQgcGFnZXMuXG4gICAgICogQHBhcmFtIHNjcmlwdFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIGFkZFN0eWxlc2hlZXQoY3NzOiBzdHlsZXNoZWV0SXRlbSkge1xuICAgICAgICB0aGlzLiNzY3JpcHRzLnN0eWxlc2hlZXRzLnB1c2goY3NzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0TWFoYWJodXRhQ29uZmlnKGNoZWVyaW8/OiBjaGVlcmlvLkNoZWVyaW9PcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NoZWVyaW8gPSBjaGVlcmlvO1xuXG4gICAgICAgIC8vIEZvciBjaGVlcmlvIDEuMC4wLXJjLjEwIHdlIG5lZWQgdG8gdXNlIHRoaXMgc2V0dGluZy5cbiAgICAgICAgLy8gSWYgdGhlIGNvbmZpZ3VyYXRpb24gaGFzIHNldCB0aGlzLCB3ZSBtdXN0IG5vdFxuICAgICAgICAvLyBvdmVycmlkZSB0aGVpciBzZXR0aW5nLiAgQnV0LCBnZW5lcmFsbHksIGZvciBjb3JyZWN0XG4gICAgICAgIC8vIG9wZXJhdGlvbiBhbmQgaGFuZGxpbmcgb2YgTWFoYWJodXRhIHRhZ3MsIHdlIG5lZWRcbiAgICAgICAgLy8gdGhpcyBzZXR0aW5nIHRvIGJlIDxjb2RlPnRydWU8L2NvZGU+XG4gICAgICAgIGlmICghKCdfdXNlSHRtbFBhcnNlcjInIGluIHRoaXMuI2NoZWVyaW8pKSB7XG4gICAgICAgICAgICAodGhpcy4jY2hlZXJpbyBhcyBhbnkpLl91c2VIdG1sUGFyc2VyMiA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzW19jb25maWdfY2hlZXJpb10pO1xuICAgIH1cblxuICAgIGdldCBtYWhhYmh1dGFDb25maWcoKSB7IHJldHVybiB0aGlzLiNjaGVlcmlvOyB9XG5cbiAgICAvKipcbiAgICAgKiBDb3B5IHRoZSBjb250ZW50cyBvZiBhbGwgZGlyZWN0b3JpZXMgaW4gYXNzZXREaXJzIHRvIHRoZSByZW5kZXIgZGVzdGluYXRpb24uXG4gICAgICovXG4gICAgYXN5bmMgY29weUFzc2V0cygpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2NvcHlBc3NldHMgU1RBUlQnKTtcblxuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBjb25zdCBhc3NldHMgPSBmaWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIC8vIEZldGNoIHRoZSBsaXN0IG9mIGFsbCBhc3NldHMgZmlsZXNcbiAgICAgICAgY29uc3QgcGF0aHMgPSBhd2FpdCBhc3NldHMucGF0aHMoKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY29weUFzc2V0cyBwYXRoc2AsXG4gICAgICAgIC8vICAgICBwYXRocy5tYXAoaXRlbSA9PiB7XG4gICAgICAgIC8vICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgIC8vICAgICAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aCxcbiAgICAgICAgLy8gICAgICAgICAgICAgbWltZTogaXRlbS5taW1lXG4gICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAvLyAgICAgfSlcbiAgICAgICAgLy8gKVxuXG4gICAgICAgIC8vIFRoZSB3b3JrIHRhc2sgaXMgdG8gY29weSBlYWNoIGZpbGVcbiAgICAgICAgY29uc3QgcXVldWUgPSBmYXN0cS5wcm9taXNlKGFzeW5jIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgJHtjb25maWcucmVuZGVyVG99ICR7aXRlbS5yZW5kZXJQYXRofWApO1xuICAgICAgICAgICAgICAgIGxldCBkZXN0Rk4gPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlclRvLCBpdGVtLnJlbmRlclBhdGgpO1xuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IGV4aXN0c1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUoZGVzdEZOKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgLy8gQ29weSBmcm9tIHRoZSBhYnNvbHV0ZSBwYXRobmFtZSwgdG8gdGhlIGNvbXB1dGVkIFxuICAgICAgICAgICAgICAgIC8vIGxvY2F0aW9uIHdpdGhpbiB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldHMgJHtpdGVtLmZzcGF0aH0gPT0+ICR7ZGVzdEZOfWApO1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5jcChpdGVtLmZzcGF0aCwgZGVzdEZOLCB7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb3B5QXNzZXRzIEZBSUwgdG8gY29weSAke2l0ZW0uZnNwYXRofSAke2l0ZW0udnBhdGh9ICR7aXRlbS5yZW5kZXJQYXRofSAke2NvbmZpZy5yZW5kZXJUb30gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTApO1xuXG4gICAgICAgIC8vIFB1c2ggdGhlIGxpc3Qgb2YgYXNzZXQgZmlsZXMgaW50byB0aGUgcXVldWVcbiAgICAgICAgLy8gQmVjYXVzZSBxdWV1ZS5wdXNoIHJldHVybnMgUHJvbWlzZSdzIHdlIGVuZCB1cCB3aXRoXG4gICAgICAgIC8vIGFuIGFycmF5IG9mIFByb21pc2Ugb2JqZWN0c1xuICAgICAgICBjb25zdCB3YWl0Rm9yID0gW107XG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIHBhdGhzKSB7XG4gICAgICAgICAgICB3YWl0Rm9yLnB1c2gocXVldWUucHVzaChlbnRyeSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoaXMgd2FpdHMgZm9yIGFsbCBQcm9taXNlJ3MgdG8gZmluaXNoXG4gICAgICAgIC8vIEJ1dCBpZiB0aGVyZSB3ZXJlIG5vIFByb21pc2Uncywgbm8gbmVlZCB0byB3YWl0XG4gICAgICAgIGlmICh3YWl0Rm9yLmxlbmd0aCA+IDApIGF3YWl0IFByb21pc2UuYWxsKHdhaXRGb3IpO1xuICAgICAgICAvLyBUaGVyZSBhcmUgbm8gcmVzdWx0cyBpbiB0aGlzIGNhc2UgdG8gY2FyZSBhYm91dFxuICAgICAgICAvLyBjb25zdCByZXN1bHRzID0gW107XG4gICAgICAgIC8vIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIC8vICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbCB0aGUgYmVmb3JlU2l0ZVJlbmRlcmVkIGZ1bmN0aW9uIG9mIGFueSBwbHVnaW4gd2hpY2ggaGFzIHRoYXQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgYXN5bmMgaG9va0JlZm9yZVNpdGVSZW5kZXJlZCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2hvb2tCZWZvcmVTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5iZWZvcmVTaXRlUmVuZGVyZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IGJlZm9yZVNpdGVSZW5kZXJlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5iZWZvcmVTaXRlUmVuZGVyZWQoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGwgdGhlIG9uU2l0ZVJlbmRlcmVkIGZ1bmN0aW9uIG9mIGFueSBwbHVnaW4gd2hpY2ggaGFzIHRoYXQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgYXN5bmMgaG9va1NpdGVSZW5kZXJlZCgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2hvb2tTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vblNpdGVSZW5kZXJlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25TaXRlUmVuZGVyZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25TaXRlUmVuZGVyZWQoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGhvb2tGaWxlQWRkZWQoY29sbGVjdGlvbjogc3RyaW5nLCB2cGluZm86IFZQYXRoRGF0YSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaG9va0ZpbGVBZGRlZCAke2NvbGxlY3Rpb259ICR7dnBpbmZvLnZwYXRofWApO1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUFkZGVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDQUxMSU5HIHBsdWdpbiAke3BsdWdpbi5uYW1lfSBvbkZpbGVBZGRlZGApO1xuICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5vbkZpbGVBZGRlZChjb25maWcsIGNvbGxlY3Rpb24sIHZwaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZUNoYW5nZWQoY29sbGVjdGlvbjogc3RyaW5nLCB2cGluZm86IFZQYXRoRGF0YSkge1xuICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBwbHVnaW4gb2YgY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLm9uRmlsZUNoYW5nZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENBTExJTkcgcGx1Z2luICR7cGx1Z2luLm5hbWV9IG9uRmlsZUNoYW5nZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlQ2hhbmdlZChjb25maWcsIGNvbGxlY3Rpb24sIHZwaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rRmlsZVVubGlua2VkKGNvbGxlY3Rpb246IHN0cmluZywgdnBpbmZvOiBWUGF0aERhdGEpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vbkZpbGVVbmxpbmtlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0FMTElORyBwbHVnaW4gJHtwbHVnaW4ubmFtZX0gb25GaWxlVW5saW5rZWRgKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlVW5saW5rZWQoY29uZmlnLCBjb2xsZWN0aW9uLCB2cGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgaG9va0ZpbGVDYWNoZVNldHVwKGNvbGxlY3Rpb25ubTogc3RyaW5nLCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IHBsdWdpbiBvZiBjb25maWcucGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4ub25GaWxlQ2FjaGVTZXR1cCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4ub25GaWxlQ2FjaGVTZXR1cChjb25maWcsIGNvbGxlY3Rpb25ubSwgY29sbGVjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBob29rUGx1Z2luQ2FjaGVTZXR1cCgpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgcGx1Z2luIG9mIGNvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbi5vblBsdWdpbkNhY2hlU2V0dXAgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLm9uUGx1Z2luQ2FjaGVTZXR1cChjb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU1BFQ0lBTCBUUkVBVE1FTlRcbiAgICAgICAgLy8gVGhlIHRhZyBkZXNjcmlwdGlvbnMgbmVlZCB0byBiZSBpbnN0YWxsZWRcbiAgICAgICAgLy8gaW4gdGhlIGRhdGFiYXNlLiAgSXQgaXMgaW1wb3NzaWJsZSB0byBkb1xuICAgICAgICAvLyB0aGF0IGR1cmluZyBDb25maWd1cmF0aW9uIHNldHVwIGluXG4gICAgICAgIC8vIHRoZSBhZGRUYWdEZXNjcmlwdGlvbnMgbWV0aG9kLlxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgYWZ0ZXIgdGhlIGRhdGFiYXNlXG4gICAgICAgIC8vIGlzIHNldHVwLlxuXG4gICAgICAgIGF3YWl0IHRoaXMuI3NhdmVEZXNjcmlwdGlvbnNUb0RCKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdXNlIC0gZ28gdGhyb3VnaCBwbHVnaW5zIGFycmF5LCBhZGRpbmcgZWFjaCB0byB0aGUgcGx1Z2lucyBhcnJheSBpblxuICAgICAqIHRoZSBjb25maWcgZmlsZSwgdGhlbiBjYWxsaW5nIHRoZSBjb25maWcgZnVuY3Rpb24gb2YgZWFjaCBwbHVnaW4uXG4gICAgICogQHBhcmFtIFBsdWdpbk9iaiBUaGUgcGx1Z2luIG5hbWUgb3Igb2JqZWN0IHRvIGFkZFxuICAgICAqIEByZXR1cm5zIHtDb25maWd1cmF0aW9ufVxuICAgICAqL1xuICAgIHVzZShQbHVnaW5PYmosIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJDb25maWd1cmF0aW9uICMxIHVzZSBQbHVnaW5PYmogXCIrIHR5cGVvZiBQbHVnaW5PYmogK1wiIFwiKyB1dGlsLmluc3BlY3QoUGx1Z2luT2JqKSk7XG4gICAgICAgIGlmICh0eXBlb2YgUGx1Z2luT2JqID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBnb2luZyB0byBmYWlsIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIHJlcXVpcmUgZG9lc24ndCB3b3JrIGluIHRoaXMgY29udGV4dFxuICAgICAgICAgICAgLy8gRnVydGhlciwgdGhpcyBjb250ZXh0IGRvZXMgbm90XG4gICAgICAgICAgICAvLyBzdXBwb3J0IGFzeW5jIGZ1bmN0aW9ucywgc28gd2VcbiAgICAgICAgICAgIC8vIGNhbm5vdCBkbyBpbXBvcnQuXG4gICAgICAgICAgICBQbHVnaW5PYmogPSByZXF1aXJlKFBsdWdpbk9iaik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFQbHVnaW5PYmogfHwgUGx1Z2luT2JqIGluc3RhbmNlb2YgUGx1Z2luKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBwbHVnaW4gc3VwcGxpZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJDb25maWd1cmF0aW9uICMyIHVzZSBQbHVnaW5PYmogXCIrIHR5cGVvZiBQbHVnaW5PYmogK1wiIFwiKyB1dGlsLmluc3BlY3QoUGx1Z2luT2JqKSk7XG4gICAgICAgIHZhciBwbHVnaW4gPSBuZXcgUGx1Z2luT2JqKCk7XG4gICAgICAgIHBsdWdpbi5ha2FzaGEgPSB0aGlzLmFrYXNoYTtcbiAgICAgICAgdGhpcy4jcGx1Z2lucy5wdXNoKHBsdWdpbik7XG4gICAgICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgICAgICBwbHVnaW4uY29uZmlndXJlKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgcGx1Z2lucygpIHsgcmV0dXJuIHRoaXMuI3BsdWdpbnM7IH1cblxuICAgIC8qKlxuICAgICAqIEl0ZXJhdGUgb3ZlciB0aGUgaW5zdGFsbGVkIHBsdWdpbnMsIGNhbGxpbmcgdGhlIGZ1bmN0aW9uIHBhc3NlZCBpbiBgaXRlcmF0b3JgXG4gICAgICogZm9yIGVhY2ggcGx1Z2luLCB0aGVuIGNhbGxpbmcgdGhlIGZ1bmN0aW9uIHBhc3NlZCBpbiBgZmluYWxgLlxuICAgICAqXG4gICAgICogQHBhcmFtIGl0ZXJhdG9yIFRoZSBmdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHBsdWdpbi4gIFNpZ25hdHVyZTogYGZ1bmN0aW9uKHBsdWdpbiwgbmV4dClgICBUaGUgYG5leHRgIHBhcmFtZXRlciBpcyBhIGZ1bmN0aW9uIHVzZWQgdG8gaW5kaWNhdGUgZXJyb3IgLS0gYG5leHQoZXJyKWAgLS0gb3Igc3VjY2VzcyAtLSBuZXh0KClcbiAgICAgKiBAcGFyYW0gZmluYWwgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgYWZ0ZXIgYWxsIGl0ZXJhdG9yIGNhbGxzIGhhdmUgYmVlbiBtYWRlLiAgU2lnbmF0dXJlOiBgZnVuY3Rpb24oZXJyKWBcbiAgICAgKi9cbiAgICBlYWNoUGx1Z2luKGl0ZXJhdG9yLCBmaW5hbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJlYWNoUGx1Z2luIGRlcHJlY2F0ZWRcIik7XG4gICAgICAgIC8qIGFzeW5jLmVhY2hTZXJpZXModGhpcy5wbHVnaW5zLFxuICAgICAgICBmdW5jdGlvbihwbHVnaW4sIG5leHQpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHBsdWdpbiwgbmV4dCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZpbmFsKTsgKi9cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb29rIGZvciBhIHBsdWdpbiwgcmV0dXJuaW5nIGl0cyBtb2R1bGUgcmVmZXJlbmNlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHJldHVybnMge1BsdWdpbn1cbiAgICAgKi9cbiAgICBwbHVnaW4obmFtZTogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdjb25maWcucGx1Z2luOiAnKyB1dGlsLmluc3BlY3QodGhpcy5fcGx1Z2lucykpO1xuICAgICAgICBpZiAoISB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgcGx1Z2luS2V5IGluIHRoaXMucGx1Z2lucykge1xuICAgICAgICAgICAgdmFyIHBsdWdpbiA9IHRoaXMucGx1Z2luc1twbHVnaW5LZXldO1xuICAgICAgICAgICAgaWYgKHBsdWdpbi5uYW1lID09PSBuYW1lKSByZXR1cm4gcGx1Z2luO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGBXQVJOSU5HOiBEaWQgbm90IGZpbmQgcGx1Z2luICR7bmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgcGx1Z2luRGF0YSBvYmplY3QgZm9yIHRoZSBuYW1lZCBwbHVnaW4uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAqLyBcbiAgICBwbHVnaW5EYXRhKG5hbWU6IHN0cmluZykge1xuICAgICAgICB2YXIgcGx1Z2luRGF0YUFycmF5ID0gdGhpcy4jcGx1Z2luRGF0YTtcbiAgICAgICAgaWYgKCEobmFtZSBpbiBwbHVnaW5EYXRhQXJyYXkpKSB7XG4gICAgICAgICAgICBwbHVnaW5EYXRhQXJyYXlbbmFtZV0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGx1Z2luRGF0YUFycmF5W25hbWVdO1xuICAgIH1cblxuICAgIGFza1BsdWdpbnNMZWdpdExvY2FsSHJlZihocmVmKSB7XG4gICAgICAgIGZvciAodmFyIHBsdWdpbiBvZiB0aGlzLnBsdWdpbnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luLmlzTGVnaXRMb2NhbEhyZWYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBsdWdpbi5pc0xlZ2l0TG9jYWxIcmVmKHRoaXMsIGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJSZW5kZXJlcihyZW5kZXJlcjogUmVuZGVyZXIpIHtcbiAgICAgICAgaWYgKCEocmVuZGVyZXIgaW5zdGFuY2VvZiBSZW5kZXJlcikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vdCBBIFJlbmRlcmVyICcrIHV0aWwuaW5zcGVjdChyZW5kZXJlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb3QgYSBSZW5kZXJlciAke3V0aWwuaW5zcGVjdChyZW5kZXJlcil9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmZpbmRSZW5kZXJlck5hbWUocmVuZGVyZXIubmFtZSkpIHtcbiAgICAgICAgICAgIC8vIHJlbmRlcmVyLmFrYXNoYSA9IHRoaXMuYWthc2hhO1xuICAgICAgICAgICAgLy8gcmVuZGVyZXIuY29uZmlnID0gdGhpcztcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZWdpc3RlclJlbmRlcmVyIGAsIHJlbmRlcmVyKTtcbiAgICAgICAgICAgIHRoaXMuI3JlbmRlcmVycy5yZWdpc3RlclJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFsbG93IGFuIGFwcGxpY2F0aW9uIHRvIG92ZXJyaWRlIG9uZSBvZiB0aGUgYnVpbHQtaW4gcmVuZGVyZXJzXG4gICAgICogdGhhdCBhcmUgaW5pdGlhbGl6ZWQgYmVsb3cuICBUaGUgaW5zcGlyYXRpb24gaXMgZXB1YnRvb2xzIHRoYXRcbiAgICAgKiBtdXN0IHdyaXRlIEhUTUwgZmlsZXMgd2l0aCBhbiAueGh0bWwgZXh0ZW5zaW9uLiAgVGhlcmVmb3JlIGl0XG4gICAgICogY2FuIHN1YmNsYXNzIEVKU1JlbmRlcmVyIGV0YyB3aXRoIGltcGxlbWVudGF0aW9ucyB0aGF0IGZvcmNlIHRoZVxuICAgICAqIGZpbGUgbmFtZSB0byBiZSAueGh0bWwuICBXZSdyZSBub3QgY2hlY2tpbmcgaWYgdGhlIHJlbmRlcmVyIG5hbWVcbiAgICAgKiBpcyBhbHJlYWR5IHRoZXJlIGluIGNhc2UgZXB1YnRvb2xzIG11c3QgdXNlIHRoZSBzYW1lIHJlbmRlcmVyIG5hbWUuXG4gICAgICovXG4gICAgcmVnaXN0ZXJPdmVycmlkZVJlbmRlcmVyKHJlbmRlcmVyOiBSZW5kZXJlcikge1xuICAgICAgICBpZiAoIShyZW5kZXJlciBpbnN0YW5jZW9mIFJlbmRlcmVyKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm90IEEgUmVuZGVyZXIgJysgdXRpbC5pbnNwZWN0KHJlbmRlcmVyKSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIFJlbmRlcmVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVuZGVyZXIuYWthc2hhID0gdGhpcy5ha2FzaGE7XG4gICAgICAgIC8vIHJlbmRlcmVyLmNvbmZpZyA9IHRoaXM7XG4gICAgICAgIHRoaXMuI3JlbmRlcmVycy5yZWdpc3Rlck92ZXJyaWRlUmVuZGVyZXIocmVuZGVyZXIpO1xuICAgIH1cblxuICAgIGZpbmRSZW5kZXJlck5hbWUobmFtZTogc3RyaW5nKTogUmVuZGVyZXIge1xuICAgICAgICByZXR1cm4gdGhpcy4jcmVuZGVyZXJzLmZpbmRSZW5kZXJlck5hbWUobmFtZSk7XG4gICAgfVxuXG4gICAgZmluZFJlbmRlcmVyUGF0aChfcGF0aDogc3RyaW5nKTogUmVuZGVyZXIge1xuICAgICAgICByZXR1cm4gdGhpcy4jcmVuZGVyZXJzLmZpbmRSZW5kZXJlclBhdGgoX3BhdGgpO1xuICAgIH1cblxuICAgIGdldCByZW5kZXJlcnMoKSB7IHJldHVybiB0aGlzLiNyZW5kZXJlcnM7IH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYSBSZW5kZXJlciBieSBpdHMgZXh0ZW5zaW9uLlxuICAgICAqL1xuICAgIGZpbmRSZW5kZXJlcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZFJlbmRlcmVyTmFtZShuYW1lKTtcbiAgICB9XG59XG5cbmNvbnN0IG1vZHVsZV9leHBvcnRzID0ge1xuICAgIFJlbmRlcmVycyxcbiAgICBSZW5kZXJlcjogUmVuZGVyZXJzLlJlbmRlcmVyLFxuICAgIG1haGFiaHV0YSxcbiAgICBmaWxlY2FjaGUsXG4gICAgc2V0dXAsXG4gICAgY2FjaGVTZXR1cCxcbiAgICBjbG9zZUNhY2hlcyxcbiAgICBkb0hUTUxBdHRyaWJ1dGUsXG4gICAgZmlsZUNhY2hlc1JlYWR5LFxuICAgIFBsdWdpbixcbiAgICByZW5kZXIsXG4gICAgcmVuZGVyRG9jdW1lbnQsXG4gICAgcmVuZGVyUGF0aCxcbiAgICByZWFkUmVuZGVyZWRGaWxlLFxuICAgIHBhcnRpYWwsXG4gICAgcGFydGlhbFN5bmMsXG4gICAgaW5kZXhDaGFpbixcbiAgICByZWxhdGl2ZSxcbiAgICBsaW5rUmVsU2V0QXR0cixcbiAgICByZXNvbHZlVnBhdGgsXG4gICAgZ2VuZXJhdGVSU1MsXG4gICAgQ29uZmlndXJhdGlvblxufSBhcyBhbnk7XG5cbmV4cG9ydCBkZWZhdWx0IG1vZHVsZV9leHBvcnRzOyJdfQ==