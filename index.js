/**
 *
 * Copyright 2014-2019 David Herron
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

/**
 * AkashaRender
 * @module akasharender
 */

'use strict';

const filez  = require('./filez');
const util   = require('util');
const fs     = require('fs-extra');
const path   = require('path');
const oembetter = require('oembetter')();
const RSS    = require('rss');
const fastq = require('fastq');
const { DirsWatcher, mimedefine } = require('@akashacms/stacked-dirs');
const mahabhuta = require('mahabhuta');
exports.mahabhuta = mahabhuta;
const cheerio = require('cheerio');
const mahaPartial = require('mahabhuta/maha/partial');

// There doesn't seem to be an official registration
// per: https://asciidoctor.org/docs/faq/
// per: https://github.com/asciidoctor/asciidoctor/issues/2502
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

mimedefine({'text/x-asciidoc': [ 'adoc', 'asciidoc' ]});
mimedefine({'text/x-ejs': [ 'ejs']});
mimedefine({'text/x-nunjucks': [ 'njk' ]});
mimedefine({'text/x-handlebars': [ 'handlebars' ]});
mimedefine({'text/x-liquid': [ 'liquid' ]});

exports.cache = import('./cache/cache-forerunner.mjs');
exports.filecache = import('./cache/file-cache.mjs');

exports.cacheSetup = async function(config) {
    try {
        let cache = (await exports.cache);
        await cache.setup(config);
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE CACHE `, err);
        process.exit(1);
    }
}

exports.closeCaches = async function() {
    try {
        let cache = (await exports.cache);
        let filecache = (await exports.filecache);
        await filecache.close();
        await cache.close();
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT CLOSE CACHES `, err);
        process.exit(1);
    }
}

exports.setupDocuments = async function(config) {
    try {
        let filecache = (await exports.filecache);
        await filecache.setupDocuments(config);
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE DOCUMENTS CACHE `, err);
        process.exit(1);
    }
}

exports.setupAssets = async function(config) {
    try {
        let filecache = (await exports.filecache);
        await filecache.setupAssets(config);
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE ASSETS CACHE `, err);
        process.exit(1);
    }
}

exports.setupLayouts = async function(config) {
    try {
        let filecache = (await exports.filecache);
        await filecache.setupLayouts(config);
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE LAYOUTS CACHE `, err);
        process.exit(1);
    }
}

exports.setupPartials = async function(config) {
    try {
        let filecache = (await exports.filecache);
        await filecache.setupPartials(config);
        // console.log(`setupPartials SUCCESS`);
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE PARTIALS CACHE `, err);
        process.exit(1);
    }
}

exports.setupPluginCaches = async function(config) {
    try {
        await config.hookPluginCacheSetup();
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE PLUGINS CACHES `, err);
        process.exit(1);
    }
}

exports.cacheSetupComplete = async function(config) {
    try {
        let cache = (await exports.cache)
        await cache.setup(config);
        let filecache = (await exports.filecache);
        await Promise.all([
            filecache.setupDocuments(config),
            filecache.setupAssets(config),
            filecache.setupLayouts(config),
            filecache.setupPartials(config),
            exports.setupPluginCaches(config)
        ])
        await Promise.all([
            filecache.documents.isReady(),
            filecache.assets.isReady(),
            filecache.layouts.isReady(),
            filecache.partials.isReady()
        ]);
    } catch (err) {
        console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE CACHE SYSTEM `, err);
        process.exit(1);
    }
}

exports.Plugin = require('./Plugin');

const render = require('./render');

module.exports.Renderer = require('./Renderer');
module.exports.HTMLRenderer = require('./HTMLRenderer');
module.exports.AsciidocRenderer = require('./render-asciidoc');
module.exports.EJSRenderer = require('./render-ejs');
module.exports.LiquidRenderer = require('./render-liquid');
module.exports.NunjucksRenderer = require('./render-nunjucks');
module.exports.HandlebarsRenderer = require('./render-handlebars');
// module.exports.TempuraRenderer = require('./render-tempura');
module.exports.MarkdownRenderer = require('./render-md');
module.exports.JSONRenderer = require('./render-json');
module.exports.CSSLESSRenderer = require('./render-cssless');

exports.render = render.newerrender; //  render.newrender;
exports.renderDocument = render.renderDocument;

exports.renderPath = async (config, path2r) => {
    const documents = (await exports.filecache).documents;
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
        if (found) break;
        else {
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, 100);
            });
            count++;
        }
    }

    // console.log(`renderPath ${path2r}`, found);
    if (!found) {
        throw new Error(`Did not find document for ${path2r}`);
    }
    let result = await render.newRenderDocument(config, found);
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
exports.readRenderedFile = async(config, fpath) => {

    let html = await fs.readFile(path.join(config.renderDestination, fpath), 'utf8');
    let $ = config.mahabhutaConfig 
            ? cheerio.load(html, config.mahabhutaConfig) 
            : cheerio.load(html);

    return { html, $ };
}

exports.findRendererPath = function(p) {
    throw new Error(`akasha.findRendererPath deprecated use config.findRendererPath instead for ${p}`);
}

/**
 * Finds the source document matching the filename for a rendered file.  That is, for
 * a rendered file path like {movies/wallachia/vlad-tepes/son-of-dracul.html} it will search
 * for the {.html.md} file generating that rendered file.
 *
 * The returned object has at least these fields:
 *
 * * {foundDir} - The basedir within which the file was found
 * * {foundPath} - The path under basedir to that file
 * * {foundFullPath} - The path, including the full file extension, to that file
 * * {foundMountedOn} - For complex directories, the path  this directory is mounted on .. e.g. dir.dest
 * * {foundPathWithinDir} - For complex directories, the path within that directory.
 * * {foundBaseMetadata} - For complex directories, the metadata associated with that directory
 *
 * @params {Array} dirs The documentDirs directory
 * @params {string} rendersTo The full path of the rendered file
 * @return {Object} Description of the source file
 */

const partialFuncs = import('./partial-funcs.mjs');

exports.partial = undefined;
exports.partialSync = undefined;
(async () => {
    exports.partial = (await partialFuncs).partial;
    exports.partialSync = (await partialFuncs).partialSync;
})();

exports.indexChain = async function(config, fname) {

    var ret = [];
    const parsed = path.parse(fname);

    const documents = (await exports.filecache).documents;
    let found = await documents.find(fname);
    if (found) {
        ret.push({
            foundDir: found.mountPoint,
            foundPath: found.renderPath,
            filename: fname
        });
    }

    let fileName = found.renderPath;
    let parentDir;
    let dn = path.dirname(fileName);
    let done = false;
    while (!(dn === '.' || dn === parsed.root)) {
        if (path.basename(fileName) === "index.html") {
            parentDir = path.dirname(path.dirname(fileName));
        } else {
            parentDir = path.dirname(fileName);
        }
        let lookFor = path.join(parentDir, "index.html");

        let found = await documents.find(lookFor);
        if (found) {
            ret.push({
                foundDir: found.mountPoint,
                foundPath: found.renderPath,
                // The test case is expecting all filename field values
                // to start with a '/' charater.  Not sure why.
                filename: '/' + lookFor
            });
        }
    
        // Loop control
        fileName = lookFor;
        dn = path.dirname(lookFor);
    }

    return ret.reverse();
}

exports.relative = require('relative');

/**
 * Manipulate the rel= attributes on a link returned from Mahabhuta.
 *
 * @params {$link} The link to manipulate
 * @params {attr} The attribute name
 * @params {doattr} Boolean flag whether to set (true) or remove (false) the attribute
 *
 */
exports.linkRelSetAttr = function($link, attr, doattr) {
    let linkrel = $link.attr('rel');
    let rels = linkrel ? linkrel.split(' ') : [];
    let hasattr = rels.indexOf(attr) >= 0;
    if (!hasattr && doattr) {
        rels.unshift(attr);
        $link.attr('rel', rels.join(' '));
    } else if (hasattr && !doattr) {
        rels.splice(rels.indexOf(attr));
        $link.attr('rel', rels.join(' '));
    }
};

///////////////// RSS Feed Generation

exports.generateRSS = async function(config, configrss, feedData, items, renderTo) {

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

    items.forEach(function(item) { rssfeed.item(item); });

    var xml = rssfeed.xml();
    var renderOut = path.join(config.renderDestination, renderTo);

    await fs.mkdirs(path.dirname(renderOut))
    await fs.writeFile(renderOut, xml, { encoding: 'utf8' });

};

// Consider making an external plugin
// https://www.npmjs.com/package/oembed-all
// https://www.npmjs.com/package/embedable
// https://www.npmjs.com/package/media-parser
// https://www.npmjs.com/package/oembetter
//
// DEPRECATED -- We should no longer need this because
//    of the akashacms-embeddables plugin
//
module.exports.oEmbedData = function(url) {
    return new Promise((resolve, reject) => {
        oembetter.fetch(url,
        (err, result) => {
            if (err) return reject(err);
            else resolve(result);
        }
        );
    });
};


/**
 * The AkashaRender project configuration object.  One instantiates a Configuration
 * object, then fills it with settings and plugins.
 * @see module:Configuration
 */

const _config_pluginData = Symbol('pluginData');
const _config_assetsDirs = Symbol('assetsDirs');
const _config_documentDirs = Symbol('documentDirs');
const _config_layoutDirs = Symbol('layoutDirs');
const _config_partialDirs = Symbol('partialDirs');
const _config_mahafuncs = Symbol('mahafuncs');
const _config_renderTo = Symbol('renderTo');
const _config_metadata = Symbol('metadata');
const _config_root_url = Symbol('root_url');
const _config_scripts = Symbol('scripts');
const _config_plugins = Symbol('plugins');
const _config_cheerio = Symbol('cheerio');
const _config_configdir = Symbol('configdir');
const _config_cachedir  = Symbol('cachedir');
const _config_concurrency = Symbol('concurrency');
const _config_renderers = Symbol('renderers');

/**
 * Configuration of an AkashaRender project, including the input directories,
 * output directory, plugins, and various settings.
 *
 * USAGE:
 *
 * const akasha = require('akasharender');
 * const config = new akasha.Configuration();
 */
module.exports.Configuration = class Configuration {
    constructor(modulepath) {

        this[_config_renderers] = [];

        /*
         * Is this the best place for this?  It is necessary to
         * call this function somewhere.  The nature of this function
         * is that it can be called multiple times with no impact.  
         * By being located here, it will always be called by the
         * time any Configuration is generated.
         */
        this.registerBuiltInRenderers();

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
            renderPartial: function(fname, metadata) {
                return exports.partial(config, fname, metadata);
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

        const configDirPath = function(dirnm) {
            let configPath = dirnm;
            if (typeof CONFIG.configDir !== 'undefined' && CONFIG.configDir != null) {
                configPath = path.join(CONFIG.configDir, dirnm);
            }
            return configPath;
        }

        let stat;

        const cacheDirsPath = configDirPath('cache');
        if (!this[_config_cachedir]) {
            if (fs.existsSync(cacheDirsPath)
             && (stat = fs.statSync(cacheDirsPath))) {
                if (stat.isDirectory()) {
                    this.cacheDir = 'cache';
                } else {
                    throw new Error("'cache' is not a directory");
                }
            } else {
                fs.mkdirsSync(cacheDirsPath);
                this.cacheDir = 'cache';
            }
        } else if (this[_config_cachedir] && !fs.existsSync(this[_config_cachedir])) {
            fs.mkdirsSync(this[_config_cachedir]);
        }

        const assetsDirsPath = configDirPath('assets');
        if (!this[_config_assetsDirs]) {
            if (fs.existsSync(assetsDirsPath) && (stat = fs.statSync(assetsDirsPath))) {
                if (stat.isDirectory()) {
                    this.addAssetsDir('assets');
                }
            }
        }

        const layoutsDirsPath = configDirPath('layouts');
        if (!this[_config_layoutDirs]) {
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
        if (!this[_config_documentDirs]) {
            if (fs.existsSync(documentDirsPath) && (stat = fs.statSync(documentDirsPath))) {
                if (stat.isDirectory()) {
                    this.addDocumentsDir('documents');
                } else {
                    throw new Error("'documents' is not a directory");
                }
            } else {
                throw new Error("No 'documentDirs' setting, and no 'documents' directory");
            }
        }

        if (!this[_config_mahafuncs]) { this[_config_mahafuncs] = []; }

        const renderToPath = configDirPath('out');
        if (!this[_config_renderTo])  {
            if (fs.existsSync(renderToPath)
             && (stat = fs.statSync(renderToPath))) {
                if (stat.isDirectory()) {
                    this.setRenderDestination('out');
                } else {
                    throw new Error("'out' is not a directory");
                }
            } else {
                fs.mkdirsSync(renderToPath);
                this.setRenderDestination('out');
            }
        } else if (this[_config_renderTo] && !fs.existsSync(this[_config_renderTo])) {
            fs.mkdirsSync(this[_config_renderTo]);
        }

        if (!this[_config_scripts])                  { this[_config_scripts] = { }; }
        if (!this[_config_scripts].stylesheets)      { this[_config_scripts].stylesheets = []; }
        if (!this[_config_scripts].javaScriptTop)    { this[_config_scripts].javaScriptTop = []; }
        if (!this[_config_scripts].javaScriptBottom) { this[_config_scripts].javaScriptBottom = []; }

        if (!this[_config_concurrency]) { this[_config_concurrency] = 3; }

        // The akashacms-builtin plugin needs to be last on the chain so that
        // its partials etc can be easily overridden.  This is the most convenient
        // place to declare that plugin.
        //

        var config = this;
        this.use(require('./built-in'), {
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

    // Moved these to standalone functions

    /* async setup() {
        try {
            // console.log(`before cache`);
            await (await exports.cache).setup(this);
            // await (await exports.cache()).save();
            // console.log(`before filecache`);
            await (await exports.filecache).setup(this);
            // console.log(`after filecache`);
        } catch (err) {
            console.error(`INITIALIZATION FAILURE COULD NOT INITIALIZE CACHE `, err);
            process.exit(1);
        }
    } */

    /* async close() {
        await (await exports.filecache).close();
        await (await exports.cache).close();
    } */

    /**
     * Record the configuration directory so that we can correctly interpolate
     * the pathnames we're provided.
     */
    set configDir(cfgdir) { this[_config_configdir] = cfgdir; }
    get configDir() { return this[_config_configdir]; }

    set cacheDir(dirnm) { this[_config_cachedir] = dirnm; }
    get cacheDir() { return this[_config_cachedir]; }

    // set akasha(_akasha)  { this[_config_akasha] = _akasha; }
    get akasha() { return module.exports }

    /**
     * Add a directory to the documentDirs configuration array
     * @param {string} dir The pathname to use
     */
    addDocumentsDir(dir) {
        if (!this[_config_documentDirs]) { this[_config_documentDirs] = []; }
        // If we have a configDir, and it's a relative directory, make it
        // relative to the configDir
        if (this.configDir != null) {
            if (typeof dir === 'string' && !path.isAbsolute(dir)) {
                dir = path.join(this.configDir, dir);
            } else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        this[_config_documentDirs].push(dir);
        // console.log(`addDocumentsDir ${util.inspect(dir)} ==> ${util.inspect(this[_config_documentDirs])}`);
        return this;
    }

    get documentDirs() {
        return this[_config_documentDirs] ? this[_config_documentDirs] : [];
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
            } else if (docDir === dirname) {
                return docDir;
            }
        }
    }

    /**
     * Add a directory to the layoutDirs configurtion array
     * @param {string} dir The pathname to use
     */
    addLayoutsDir(dir) {
        if (!this[_config_layoutDirs]) { this[_config_layoutDirs] = []; }
        // If we have a configDir, and it's a relative directory, make it
        // relative to the configDir
        if (this.configDir != null) {
            if (typeof dir === 'string' && !path.isAbsolute(dir)) {
                dir = path.join(this.configDir, dir);
            } else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        this[_config_layoutDirs].push(dir);
        return this;
    }

    get layoutDirs() { return this[_config_layoutDirs] ? this[_config_layoutDirs] : []; }

    /**
     * Add a directory to the partialDirs configurtion array
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    addPartialsDir(dir) {
        if (!this[_config_partialDirs]) { this[_config_partialDirs] = []; }
        // If we have a configDir, and it's a relative directory, make it
        // relative to the configDir
        if (this.configDir != null) {
            if (typeof dir === 'string' && !path.isAbsolute(dir)) {
                dir = path.join(this.configDir, dir);
            } else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        // console.log(`addPartialsDir `, dir);
        this[_config_partialDirs].push(dir);
        return this;
    }

    get partialsDirs() { return this[_config_partialDirs] ? this[_config_partialDirs] : []; }
    
    /**
     * Add a directory to the assetDirs configurtion array
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    addAssetsDir(dir) {
        if (!this[_config_assetsDirs]) { this[_config_assetsDirs] = []; }
        // If we have a configDir, and it's a relative directory, make it
        // relative to the configDir
        if (this.configDir != null) {
            if (typeof dir === 'string' && !path.isAbsolute(dir)) {
                dir = path.join(this.configDir, dir);
            } else if (typeof dir === 'object' && !path.isAbsolute(dir.src)) {
                dir.src = path.join(this.configDir, dir.src);
            }
        }
        this[_config_assetsDirs].push(dir);
        return this;
    }

    get assetDirs() { return this[_config_assetsDirs] ? this[_config_assetsDirs] : []; }

    /**
     * Add an array of Mahabhuta functions
     * @param {Array} mahafuncs
     * @returns {Configuration}
     */
    addMahabhuta(mahafuncs) {
        if (typeof mahafuncs === 'undefined' || !mahafuncs) {
            throw new Error(`undefined mahafuncs in ${this.configDir}`);
        }
        if (!this[_config_mahafuncs]) { this[_config_mahafuncs] = []; }
        this[_config_mahafuncs].push(mahafuncs);
        return this;
    }

    get mahafuncs() { return this[_config_mahafuncs]; }

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
        this[_config_renderTo] = dir;
        return this;
    }

    /** Fetch the declared destination for rendering the project. */
    get renderDestination() { return this[_config_renderTo]; }
    get renderTo() { return this[_config_renderTo]; }

    /* TODO:

    addMetadataObject - object */

    /**
     * Add a value to the project metadata.  The metadata is combined with
     * the document metadata and used during rendering.
     * @param {string} index The key to store the value.
     * @param value The value to store in the metadata.
     * @returns {Configuration}
     */
    addMetadata(index, value) {
        if (typeof this[_config_metadata] === 'undefined'
        || !this.hasOwnProperty(_config_metadata)
        || !this[_config_metadata]) {
            this[_config_metadata] = {};
        }
        var md = this[_config_metadata];
        md[index] = value;
        return this;
    }

    get metadata() { return this[_config_metadata]; }

    /**
    * Document the URL for a website project.
    * @param {string} root_url
    * @returns {Configuration}
    */
    rootURL(root_url) {
        this[_config_root_url] = root_url;
        return this;
    }

    get root_url() { return this[_config_root_url]; }

    /**
     * Set how many documents to render concurrently.
     * @param {number} concurrency
    * @returns {Configuration}
     */
    setConcurrency(concurrency) {
        this[_config_concurrency] = concurrency;
        return this;
    }

    get concurrency() { return this[_config_concurrency]; }

    /**
     * Declare JavaScript to add within the head tag of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addHeaderJavaScript(script) {
        if (typeof this[_config_scripts] === 'undefined'
        || !this.hasOwnProperty(_config_scripts)
        || !this[_config_scripts]) {
            this[_config_scripts] = {};
        }
        if (!this[_config_scripts].javaScriptTop) this[_config_scripts].javaScriptTop = [];
        this[_config_scripts].javaScriptTop.push(script);
        return this;
    }

    get scripts() { return this[_config_scripts]; }

    /**
     * Declare JavaScript to add at the bottom of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addFooterJavaScript(script) {
        if (typeof this[_config_scripts] === 'undefined'
        || !this.hasOwnProperty(_config_scripts)
        || !this[_config_scripts]) {
            this[_config_scripts] = {};
        }
        if (!this[_config_scripts].javaScriptBottom) this[_config_scripts].javaScriptBottom = [];
        this[_config_scripts].javaScriptBottom.push(script);
        return this;
    }

    /**
     * Declare a CSS Stylesheet to add within the head tag of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addStylesheet(css) {
        if (typeof this[_config_scripts] === 'undefined'
        || !this.hasOwnProperty(_config_scripts)
        || !this[_config_scripts]) {
            this[_config_scripts] = {};
        }
        if (!this[_config_scripts].stylesheets) this[_config_scripts].stylesheets = [];
        this[_config_scripts].stylesheets.push(css);
        return this;
    }

    setMahabhutaConfig(cheerio) {
        this[_config_cheerio] = cheerio;

        // For cheerio 1.0.0-rc.10 we need to use this setting.
        // If the configuration has set this, we must not
        // override their setting.  But, generally, for correct
        // operation and handling of Mahabhuta tags, we need
        // this setting to be <code>true</code>
        if (!('_useHtmlParser2' in this[_config_cheerio])) {
            this[_config_cheerio]._useHtmlParser2 = true;
        }

        // console.log(this[_config_cheerio]);
    }

    get mahabhutaConfig() { return this[_config_cheerio]; }

    /**
     * Copy the contents of all directories in assetDirs to the render destination.
     */
    async copyAssets() {
        // console.log('copyAssets START');

        const config = this;
        const assets = (await exports.filecache).assets;
        await assets.isReady();
        // Fetch the list of all assets files
        const paths = assets.paths();

        // The work task is to copy each file
        const queue = fastq.promise(async function(item) {
            try {
                let destFN = path.join(config.renderTo, item.renderPath);
                // Make sure the destination directory exists
                await fs.ensureDir(path.dirname(destFN));
                // Copy from the absolute pathname, to the computed 
                // location within the destination directory
                // console.log(`copyAssets ${item.fspath} ==> ${destFN}`);
                await fs.copy(item.fspath, destFN, {
                    overwrite: true,
                    preserveTimestamps: true
                });
                return "ok";
            } catch (err) {
                throw new Error(`copyAssets FAIL to copy ${item.fspath} because ${err.stack}`);
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
        if (waitFor.length > 0) await Promise.all(waitFor);
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
        if (typeof this[_config_plugins] === 'undefined'
        || !this.hasOwnProperty(_config_plugins)
        || ! this[_config_plugins]) {
            this[_config_plugins] = [];
        }

        if (typeof PluginObj === 'string') {
            PluginObj = require(PluginObj);
        }
        if (!PluginObj || PluginObj instanceof module.exports.Plugin) {
            throw new Error("No plugin supplied");
        }
        // console.log("Configuration #2 use PluginObj "+ typeof PluginObj +" "+ util.inspect(PluginObj));
        var plugin = new PluginObj();
        plugin.akasha = this.akasha;
        this[_config_plugins].push(plugin);
        if (!options) options = {};
        plugin.configure(this, options);
        return this;
    }

    get plugins() { return this[_config_plugins]; }

    /**
     * Iterate over the installed plugins, calling the function passed in `iterator`
     * for each plugin, then calling the function passed in `final`.
     *
     * @param iterator The function to call for each plugin.  Signature: `function(plugin, next)`  The `next` parameter is a function used to indicate error -- `next(err)` -- or success -- next()
     * @param final The function to call after all iterator calls have been made.  Signature: `function(err)`
     */
    eachPlugin(iterator, final) {
        throw new Exception("eachPlugin deprecated");
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
        if (! this.plugins) {
            return undefined;
        }
        for (var pluginKey in this.plugins) {
            var plugin = this.plugins[pluginKey];
            if (plugin.name === name) return plugin;
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
        if (!this[_config_pluginData]) {
            this[_config_pluginData] = [];
        }
        var pluginDataArray = this[_config_pluginData];
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
        if (!(renderer instanceof module.exports.Renderer)) {
            console.error('Not A Renderer '+ util.inspect(renderer));
            throw new Error(`Not a Renderer ${renderer.name}`);
        }
        if (!this.findRendererName(renderer.name)) {
            renderer.akasha = this.akasha;
            renderer.config = this;
            // console.log(`registerRenderer `, renderer);
            this[_config_renderers].push(renderer);
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
        if (!(renderer instanceof module.exports.Renderer)) {
            console.error('Not A Renderer '+ util.inspect(renderer));
            throw new Error('Not a Renderer');
        }
        renderer.akasha = this.akasha;
        renderer.config = this;
        this[_config_renderers].unshift(renderer);
    }

    findRendererName(name) {
        for (var r of this[_config_renderers]) {
            if (r.name === name) return r;
        }
        return undefined;
    }

    findRendererPath(_path) {
        // log(`findRendererPath ${_path}`);
        for (var r of this[_config_renderers]) {
            if (r.match(_path)) return r;
        }
        // console.log(`findRendererPath NO RENDERER for ${_path}`);
        return undefined;
    }

    registerBuiltInRenderers() {
        // Register built-in renderers
        this.registerRenderer(new module.exports.MarkdownRenderer());
        this.registerRenderer(new module.exports.AsciidocRenderer());
        this.registerRenderer(new module.exports.EJSRenderer());
        this.registerRenderer(new module.exports.LiquidRenderer());
        this.registerRenderer(new module.exports.NunjucksRenderer());
        this.registerRenderer(new module.exports.HandlebarsRenderer());
        // this.registerRenderer(new module.exports.TempuraRenderer());
        this.registerRenderer(new module.exports.CSSLESSRenderer());
        this.registerRenderer(new module.exports.JSONRenderer());
    }

    get renderers() { return this[_config_renderers]; }

    /**
     * Find a Renderer by its extension.
     */
    findRenderer(name) {
        return this.findRendererName(name);
    }
}
