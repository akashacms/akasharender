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
import * as Renderers from '@akashacms/renderers';
export * as Renderers from '@akashacms/renderers';
import { Renderer } from '@akashacms/renderers';
export { Renderer } from '@akashacms/renderers';
export * as mahabhuta from 'mahabhuta';
import * as cheerio from 'cheerio';
export * as relative from 'relative';
export { Plugin } from './Plugin.js';
export { render, renderDocument, renderContent } from './render.js';
import * as filecache from './cache/file-cache-sqlite.js';
export { newSQ3DataStore } from './sqdb.js';
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
export declare function setup(config: any): Promise<void>;
export declare function cacheSetup(config: any): Promise<void>;
export declare function closeCaches(): Promise<void>;
export declare function fileCachesReady(config: any): Promise<void>;
export declare function renderPath(config: any, path2r: any): Promise<string>;
/**
 * Reads a file from the rendering directory.  It is primarily to be
 * used in test cases, where we'll run a build then read the individual
 * files to make sure they've rendered correctly.
 *
 * @param {*} config
 * @param {*} fpath
 * @returns
 */
export declare function readRenderedFile(config: any, fpath: any): Promise<{
    html: string;
    $: cheerio.CheerioAPI;
}>;
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
export declare function partial(config: any, fname: any, metadata: any): Promise<any>;
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
export declare function partialSync(config: any, fname: any, metadata: any): any;
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
export declare function indexChain(config: any, fname: any): Promise<any[]>;
/**
 * Manipulate the rel= attributes on a link returned from Mahabhuta.
 *
 * @params {$link} The link to manipulate
 * @params {attr} The attribute name
 * @params {doattr} Boolean flag whether to set (true) or remove (false) the attribute
 *
 */
export declare function linkRelSetAttr($link: any, attr: any, doattr: any): void;
export declare function generateRSS(config: any, configrss: any, feedData: any, items: any, renderTo: any): Promise<void>;
/**
 * The AkashaRender project configuration object.
 * One instantiates a Configuration object, then fills it
 * with settings and plugins.
 *
 * @see module:Configuration
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
export declare class Configuration {
    #private;
    constructor(modulepath: any);
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
    prepare(): this;
    /**
     * Record the configuration directory so that we can correctly interpolate
     * the pathnames we're provided.
     */
    set configDir(cfgdir: string);
    get configDir(): string;
    set cacheDir(dirnm: string);
    get cacheDir(): string;
    get cacheAutosave(): boolean;
    set cacheAutosave(auto: boolean);
    get cacheAutoload(): boolean;
    set cacheAutoload(auto: boolean);
    get akasha(): any;
    documentsCache(): Promise<filecache.DocumentsFileCache>;
    assetsCache(): Promise<filecache.BaseFileCache<filecache.Asset, import("sqlite3orm").BaseDAO<filecache.Asset>>>;
    layoutsCache(): Promise<filecache.TemplatesFileCache<filecache.Layout, import("sqlite3orm").BaseDAO<filecache.Layout>>>;
    partialsCache(): Promise<filecache.TemplatesFileCache<filecache.Partial, import("sqlite3orm").BaseDAO<filecache.Partial>>>;
    /**
     * Add a directory to the documentDirs configuration array
     * @param {string} dir The pathname to use
     */
    addDocumentsDir(dir: any): this;
    get documentDirs(): any;
    /**
     * Look up the document directory information for a given document directory.
     * @param {string} dirname The document directory to search for
     */
    documentDirInfo(dirname: any): any;
    /**
     * Add a directory to the layoutDirs configurtion array
     * @param {string} dir The pathname to use
     */
    addLayoutsDir(dir: any): this;
    get layoutDirs(): any;
    /**
     * Add a directory to the partialDirs configurtion array
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    addPartialsDir(dir: any): this;
    get partialsDirs(): any;
    /**
     * Add a directory to the assetDirs configurtion array
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    addAssetsDir(dir: any): this;
    get assetDirs(): any;
    /**
     * Add an array of Mahabhuta functions
     * @param {Array} mahafuncs
     * @returns {Configuration}
     */
    addMahabhuta(mahafuncs: any): this;
    get mahafuncs(): any;
    /**
     * Define the directory into which the project is rendered.
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    setRenderDestination(dir: any): this;
    /** Fetch the declared destination for rendering the project. */
    get renderDestination(): string;
    get renderTo(): string;
    /**
     * Add a value to the project metadata.  The metadata is combined with
     * the document metadata and used during rendering.
     * @param {string} index The key to store the value.
     * @param value The value to store in the metadata.
     * @returns {Configuration}
     */
    addMetadata(index: any, value: any): this;
    get metadata(): any;
    /**
    * Document the URL for a website project.
    * @param {string} root_url
    * @returns {Configuration}
    */
    rootURL(root_url: any): this;
    get root_url(): string;
    /**
     * Set how many documents to render concurrently.
     * @param {number} concurrency
    * @returns {Configuration}
     */
    setConcurrency(concurrency: any): this;
    get concurrency(): number;
    /**
     * Declare JavaScript to add within the head tag of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addHeaderJavaScript(script: any): this;
    get scripts(): any;
    /**
     * Declare JavaScript to add at the bottom of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addFooterJavaScript(script: any): this;
    /**
     * Declare a CSS Stylesheet to add within the head tag of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addStylesheet(css: any): this;
    setMahabhutaConfig(cheerio: any): void;
    get mahabhutaConfig(): any;
    /**
     * Copy the contents of all directories in assetDirs to the render destination.
     */
    copyAssets(): Promise<void>;
    /**
     * Call the beforeSiteRendered function of any plugin which has that function.
     */
    hookBeforeSiteRendered(): Promise<void>;
    /**
     * Call the onSiteRendered function of any plugin which has that function.
     */
    hookSiteRendered(): Promise<void>;
    hookFileAdded(collection: any, vpinfo: any): Promise<void>;
    hookFileChanged(collection: any, vpinfo: any): Promise<void>;
    hookFileUnlinked(collection: any, vpinfo: any): Promise<void>;
    hookFileCacheSetup(collectionnm: any, collection: any): Promise<void>;
    hookPluginCacheSetup(): Promise<void>;
    /**
     * use - go through plugins array, adding each to the plugins array in
     * the config file, then calling the config function of each plugin.
     * @param PluginObj The plugin name or object to add
     * @returns {Configuration}
     */
    use(PluginObj: any, options: any): this;
    get plugins(): any;
    /**
     * Iterate over the installed plugins, calling the function passed in `iterator`
     * for each plugin, then calling the function passed in `final`.
     *
     * @param iterator The function to call for each plugin.  Signature: `function(plugin, next)`  The `next` parameter is a function used to indicate error -- `next(err)` -- or success -- next()
     * @param final The function to call after all iterator calls have been made.  Signature: `function(err)`
     */
    eachPlugin(iterator: any, final: any): void;
    /**
     * Look for a plugin, returning its module reference.
     * @param {string} name
     * @returns {Plugin}
     */
    plugin(name: any): any;
    /**
     * Retrieve the pluginData object for the named plugin.
     * @param {string} name
     * @returns {Object}
     */
    pluginData(name: any): any;
    askPluginsLegitLocalHref(href: any): boolean;
    registerRenderer(renderer: any): void;
    /**
     * Allow an application to override one of the built-in renderers
     * that are initialized below.  The inspiration is epubtools that
     * must write HTML files with an .xhtml extension.  Therefore it
     * can subclass EJSRenderer etc with implementations that force the
     * file name to be .xhtml.  We're not checking if the renderer name
     * is already there in case epubtools must use the same renderer name.
     */
    registerOverrideRenderer(renderer: any): void;
    findRendererName(name: any): Renderer;
    findRendererPath(_path: any): Renderer;
    get renderers(): Renderers.Configuration;
    /**
     * Find a Renderer by its extension.
     */
    findRenderer(name: any): Renderers.Renderer;
}
declare const module_exports: any;
export default module_exports;
//# sourceMappingURL=index.d.ts.map