
/**
 * AkashaRender project configuration object.
 * @module Configuration
 */

'use strict';

const fs     = require('fs-extra-promise');
const globfs = require('globfs');
const util   = require('util');
const path   = require('path');
const async  = require('async');
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
const _config_mahafuncs = Symbol('mahafuncs');
const _config_renderTo = Symbol('renderTo');
const _config_metadata = Symbol('metadata');
const _config_root_url = Symbol('root_url');
const _config_scripts = Symbol('scripts');
const _config_plugins = Symbol('plugins');

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
    constructor() {

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

        var stat;
        if (!this[_config_assetsDirs]) {
            this[_config_assetsDirs] = [];
            if (fs.existsSync('assets') && (stat = fs.statSync('assets'))) {
                if (stat.isDirectory()) {
                    this[_config_assetsDirs] = [ 'assets' ];
                }
            }
        }

        if (!this.layoutDirs) {
            this.layoutDirs = [];
            if (fs.existsSync('layouts') && (stat = fs.statSync('layouts'))) {
                if (stat.isDirectory()) {
                    this.layoutDirs = [ 'layouts' ];
                }
            }
        }

        if (!mahaPartial.configuration.partialDirs) {
            mahaPartial.configuration.partialDirs = [];
            if (fs.existsSync('partials') && (stat = fs.statSync('partials'))) {
                if (stat.isDirectory()) {
                    mahaPartial.configuration.partialDirs = [ 'partials' ];
                }
            }
        }

        if (!this[_config_documentDirs]) {
            this[_config_documentDirs] = [];
            if (fs.existsSync('documents') && (stat = fs.statSync('documents'))) {
                if (stat.isDirectory()) {
                    this[_config_documentDirs] = [ 'documents' ];
                } else {
                    throw new Error("'documents' is not a directory");
                }
            } else {
                throw new Error("No 'documentDirs' setting, and no 'documents' directory");
            }
        }

        if (!this[_config_mahafuncs]) { this[_config_mahafuncs] = []; }

        if (!this[_config_renderTo])  {
            if (fs.existsSync('out') && (stat = fs.statSync('out'))) {
                if (stat.isDirectory()) {
                    this[_config_renderTo] = 'out';
                } else {
                    throw new Error("'out' is not a directory");
                }
            } else {
                fs.mkdirsSync('out');
                this[_config_renderTo] = 'out';
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

        return this;
    }


    /**
     * Add a directory to the documentDirs configuration array
     * @param {string} dir The pathname to use
     */
    addDocumentsDir(dir) {
        if (!this[_config_documentDirs]) { this[_config_documentDirs] = []; }
        this[_config_documentDirs].push(dir);
        return this;
    }

    get documentDirs() { return this[_config_documentDirs]; }

    /**
     * Add a directory to the layoutDirs configurtion array
     * @param {string} dir The pathname to use
     */
    addLayoutsDir(dir) {
        if (!this[_config_layoutDirs]) { this[_config_layoutDirs] = []; }
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
        // We'll store this data in Mahabhuta instead of in this object
        if (!mahaPartial.configuration.partialDirs) {
            mahaPartial.configuration.partialDirs = [];
        }
        mahaPartial.configuration.partialDirs.push(dir);
        return this;
        /* if (!this.partialDirs) { this.partialDirs = []; }
        this.partialDirs.push(dir);
        return this; */
    }

    get partialsDirs() { return mahaPartial.configuration.partialDirs; }

    /**
     * Add a directory to the assetDirs configurtion array
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    addAssetsDir(dir) {
        if (!this[_config_assetsDirs]) { this[_config_assetsDirs] = []; }
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
        this.cheerio = cheerio;
    }

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
        return new Promise((resolve, reject) => {
            async.eachSeries(config.plugins,
            (plugin, next) => {
                // console.log(`PLUGIN ${util.inspect(plugin)}`);
                if (typeof plugin.onSiteRendered !== 'undefined') {
                    // console.log(`CALLING plugin ${plugin.name} onSiteRendered`);
                    plugin.onSiteRendered(config)
                    .then(() => { next(); })
                    .catch(err => { next(err); });
                } else next();
            },
            err => {
                if (err) reject(err);
                else resolve();
            });
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
        async.eachSeries(this.plugins,
        function(plugin, next) {
            iterator(plugin, next);
        },
        final);
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
