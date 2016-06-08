
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
const Plugin = require('./Plugin');

const log    = require('debug')('akasha:configuration');
const error  = require('debug')('akasha:error-configuration');

/**
 * Configuration of an AkashaRender project, including the input directories,
 * output directory, plugins, and various settings.
 */
module.exports = class Configuration {
    constructor() {

    }

    /**
     * Initialize default configuration values for anything which has not
     * already been configured.  Some built-in defaults have been decided
     * ahead of time.  For each configuration setting, if nothing has been
     * declared, then the default is substituted.
     * @returns {Configuration}
     */
    prepare() {

        var stat;
        if (!this.assetDirs) {
            this.assetDirs = [];
            if (fs.existsSync('assets') && (stat = fs.statSync('assets'))) {
                if (stat.isDirectory()) {
                    this.assetDirs = [ 'assets' ];
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

        if (!this.partialDirs) {
            this.partialDirs = [];
            if (fs.existsSync('partials') && (stat = fs.statSync('partials'))) {
                if (stat.isDirectory()) {
                    this.partialDirs = [ 'partials' ];
                }
            }
        }

        if (!this.documentDirs) {
            this.documentDirs = [];
            if (fs.existsSync('documents') && (stat = fs.statSync('documents'))) {
                if (stat.isDirectory()) {
                    this.documentDirs = [ 'documents' ];
                } else {
                    throw new Error("'documents' is not a directory");
                }
            } else {
                throw new Error("No 'documentDirs' setting, and no 'documents' directory");
            }
        }

        if (!this.mahafuncs) { this.mahafuncs = []; }
        if (!this.renderTo)  {
            if (fs.existsSync('out') && (stat = fs.statSync('out'))) {
                if (stat.isDirectory()) {
                    this.renderTo = 'out';
                } else {
                    throw new Error("'out' is not a directory");
                }
            } else {
                fs.mkdirsSync('out');
                this.renderTo = 'out';
            }
        } else if (this.renderTo && !fs.existsSync(this.renderTo)) {
            fs.mkdirsSync(this.renderTo);
        }

        if (!this.headerScripts)                  { this.headerScripts = { }; }
        if (!this.headerScripts.stylesheets)      { this.headerScripts.stylesheets = []; }
        if (!this.headerScripts.javaScriptTop)    { this.headerScripts.javaScriptTop = []; }
        if (!this.headerScripts.javaScriptBottom) { this.headerScripts.javaScriptBottom = []; }

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
        if (!this.documentDirs) { this.documentDirs = []; }
        this.documentDirs.push(dir);
        return this;
    }

    /**
     * Add a directory to the layoutDirs configurtion array
     * @param {string} dir The pathname to use
     */
    addLayoutsDir(dir) {
        if (!this.layoutDirs) { this.layoutDirs = []; }
        this.layoutDirs.push(dir);
        return this;
    }

    /**
     * Add a directory to the partialDirs configurtion array
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    addPartialsDir(dir) {
        if (!this.partialDirs) { this.partialDirs = []; }
        this.partialDirs.push(dir);
        return this;
    }

    /**
     * Add a directory to the assetDirs configurtion array
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    addAssetsDir(dir) {
        if (!this.assetDirs) { this.assetDirs = []; }
        this.assetDirs.push(dir);
        return this;
    }

    /**
     * Add an array of Mahabhuta functions
     * @param {Array} mahafuncs
     * @returns {Configuration}
     */
    addMahabhuta(mahafuncs) {
        if (!this.mahafuncs) { this.mahafuncs = []; }
        this.mahafuncs.push(mahafuncs);
        return this;
    }

    /**
     * Define the directory into which the project is rendered.
     * @param {string} dir The pathname to use
     * @returns {Configuration}
     */
    setRenderDestination(dir) {
        this.renderTo = dir;
        return this;
    }

    /** Fetch the declared destination for rendering the project. */
    get renderDestination() { return this.renderTo; }

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
        if (typeof this.metadata === 'undefined' || !this.hasOwnProperty("metadata") || !this.metadata) {
            this.metadata = {};
        }
        this.metadata[index] = value;
        return this;
    }

    /**
    * Document the URL for a website project.
    * @param {string} root_url
    * @returns {Configuration}
    */
    rootURL(root_url) {
        this.root_url = root_url;
        return this;
    }

    /**
     * Declare JavaScript to add within the head tag of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addHeaderJavaScript(script) {
        if (typeof this.scripts === 'undefined' || !this.hasOwnProperty("scripts") || !this.scripts) {
            this.scripts = {};
        }
        if (!this.scripts.javaScriptTop) this.scripts.javaScriptTop = [];
        this.scripts.javaScriptTop.push(script);
        return this;
    }

    /**
     * Declare JavaScript to add at the bottom of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addFooterJavaScript(script) {
        if (typeof this.scripts === 'undefined' || !this.hasOwnProperty("scripts") || !this.scripts) {
            this.scripts = {};
        }
        if (!this.scripts.javaScriptBottom) this.scripts.javaScriptBottom = [];
        this.scripts.javaScriptBottom.push(script);
        return this;
    }

    /**
     * Declare a CSS Stylesheet to add within the head tag of rendered pages.
     * @param script
     * @returns {Configuration}
     */
    addStylesheet(css) {
        if (typeof this.scripts === 'undefined' || !this.hasOwnProperty("scripts") || !this.scripts) {
            this.scripts = {};
        }
        if (!this.scripts.stylesheets) this.scripts.stylesheets = [];
        this.scripts.stylesheets.push(css);
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
            return new Promise((resolve, reject) => {
                globfs.copy(copyFrom, [ "**/*", '**/.*/*', '**/.*' ], copyTo,
                        err => {
                            if (err) reject(err);
                            else resolve();
                        });
            });
        }));
    }

    /**
     * Call the onSiteRendered function of any plugin which has that function.
     */
    hookSiteRendered() {
        return new Promise((resolve, reject) => {
            async.eachSeries(this._plugins,
            (plugin, next) => {
                if (typeof plugin.onSiteRendered !== 'undefined') {
                    plugin.onSiteRendered(this)
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
        if (typeof this._plugins === 'undefined' || !this.hasOwnProperty("_plugins") || ! this._plugins) {
            this._plugins = [];
        }

        if (typeof PluginObj === 'string') {
            PluginObj = require(PluginObj);
        }
        if (!PluginObj || PluginObj instanceof Plugin) {
            throw new Error("No plugin supplied");
        }
        // console.log("Configuration #2 use PluginObj "+ typeof PluginObj +" "+ util.inspect(PluginObj));
        var plugin = new PluginObj();
        this._plugins.push(plugin);
        plugin.configure(this);
        return this;
    }

    eachPlugin(iterator, final) {
        async.eachSeries(this._plugins,
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
        if (! this._plugins) {
            return undefined;
        }
        // log(util.inspect(this._plugins));
        for (var pluginKey in this._plugins) {
            var plugin = this._plugins[pluginKey];
            // log(util.inspect(plugin));
            if (plugin.name === name) return plugin;
        }
        return undefined;
    }

}
