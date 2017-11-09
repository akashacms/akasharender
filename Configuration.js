
/**
 * AkashaRender project configuration object.
 * @module Configuration
 */

'use strict';

const fs     = require('fs-extra');
const globfs = require('globfs');
const util   = require('util');
const path   = require('path');
// const async  = require('async');
const co     = require('co');
const akasha = require('./index');
const render = require('./render');
const Plugin = require('./Plugin');
const mahabhuta = require('mahabhuta');
const mahaPartial = require('mahabhuta/maha/partial');

const log    = require('debug')('akasha:configuration');
const error  = require('debug')('akasha:error-configuration');

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

/**
 * Configuration of an AkashaRender project, including the input directories,
 * output directory, plugins, and various settings.
 *
 * USAGE:
 *
 * const akasha = require('akasharender');
 * const config = new akasha.Configuration();
 */
module.exports = class Configuration {
    constructor(modulepath) {
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

        var stat;
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

        // The akashacms-builtin plugin needs to be last on the chain so that
        // its partials etc can be easily overridden.  This is the most convenient
        // place to declare that plugin.
        //
        this.use(require('./built-in'));

        // Set up the Mahabhuta partial tag so it renders through AkashaRender

        var config = this;
        mahaPartial.configuration.renderPartial = function(fname, metadata) {
            return akasha.partial(config, fname, metadata);
        }

        return this;
    }

    /**
     * Record the configuration directory so that we can correctly interpolate
     * the pathnames we're provided.
     */
    set configDir(cfgdir) { this[_config_configdir] = cfgdir; }
    get configDir() { return this[_config_configdir]; }

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
        return this;
    }

    get documentDirs() { return this[_config_documentDirs]; }

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
            }
        }
        this[_config_layoutDirs].push(dir);
        return this;
    }

    get layoutDirs() { return this[_config_layoutDirs]; }

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
            }
        }
        this[_config_partialDirs].push(dir);
        return this;
    }

    get partialsDirs() { return this[_config_partialDirs]; }
    
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

    get assetDirs() { return this[_config_assetsDirs]; }

    /**
     * Add an array of Mahabhuta functions
     * @param {Array} mahafuncs
     * @returns {Configuration}
     */
    addMahabhuta(mahafuncs) {
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
    }

    get mahabhutaConfig() { return this[_config_cheerio]; }

    /**
     * Copy the contents of all directories in assetDirs to the render destination.
     */
    copyAssets() {
        log('copyAssets START');

        return Promise.all(this.assetDirs.map(assetsdir => {
            var copyTo;
            var copyFrom;
            if (typeof assetsdir === 'string') {
                copyFrom = assetsdir;
                copyTo = this.renderTo;
            } else {
                copyFrom = assetsdir.src;
                copyTo = path.join(this.renderTo, assetsdir.dest);
            }
            return globfs.copyAsync(copyFrom, [ "**/*", '**/.*/*', '**/.*' ], copyTo,
                    err => {
                        if (err) reject(err);
                        else resolve();
                    });
        }));
    }

    /**
     * Call the onSiteRendered function of any plugin which has that function.
     */
    hookSiteRendered() {
        // console.log('hookSiteRendered');
        var config = this;
        return co(function* () {
            for (let plugin of config.plugins) {
                if (typeof plugin.onSiteRendered !== 'undefined') {
                    // console.log(`CALLING plugin ${plugin.name} onSiteRendered`);
                    yield plugin.onSiteRendered(config);
                }
            }
        });
    }

    /**
     * use - go through plugins array, adding each to the plugins array in
     * the config file, then calling the config function of each plugin.
     * @param PluginObj The plugin name or object to add
     * @returns {Configuration}
     */
    use(PluginObj) {
        // console.log("Configuration #1 use PluginObj "+ typeof PluginObj +" "+ util.inspect(PluginObj));
        if (typeof this[_config_plugins] === 'undefined'
        || !this.hasOwnProperty(_config_plugins)
        || ! this[_config_plugins]) {
            this[_config_plugins] = [];
        }

        if (typeof PluginObj === 'string') {
            PluginObj = require(PluginObj);
        }
        if (!PluginObj || PluginObj instanceof Plugin) {
            throw new Error("No plugin supplied");
        }
        // console.log("Configuration #2 use PluginObj "+ typeof PluginObj +" "+ util.inspect(PluginObj));
        var plugin = new PluginObj();
        this[_config_plugins].push(plugin);
        plugin.configure(this);
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
            // console.log(`FOUND ${util.inspect(plugin)}`);
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

    /**
     * Add a new Renderer to the AkashaRender configuration
     */
    addRenderer(renderer) {
        throw new Error("Implement this");
    }

    /**
     * Find a Renderer by its extension.
     */
    findRenderer(name) {
        return render.findRendererName(name);
    }
}
