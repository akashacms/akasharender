
'use strict';

const fs = require('fs');
const globfs = require('globfs');
const util = require('util');
const path = require('path');
const Plugin = require('./Plugin');

const log   = require('debug')('akasha:configuration');
const error = require('debug')('akasha:error-configuration');

module.exports = class Configuration {
    constructor() {
        
    }
    
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
                throw new Error("No 'renderTo' setting, and no 'out' directory");
            }
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

    }

    
    /**
     * Add a directory to the documentDirs configuration array
     */
    addDocumentsDir(dir) {
        if (!this.documentDirs) { this.documentDirs = []; }
        this.documentDirs.push(dir);
        return this;
    }
    
    /**
     * Add a directory to the layoutDirs configurtion array
     */
    addLayoutsDir(dir) {
        if (!this.layoutDirs) { this.layoutDirs = []; }
        this.layoutDirs.push(dir);
        return this;
    }
    
    /**
     * Add a directory to the partialDirs configurtion array
     */
    addPartialsDir(dir) {
        if (!this.partialDirs) { this.partialDirs = []; }
        this.partialDirs.push(dir);
        return this;
    }
    
    /**
     * Add a directory to the assetDirs configurtion array
     */
    addAssetsDir(dir) {
        if (!this.assetDirs) { this.assetDirs = []; }
        this.assetDirs.push(dir);
        return this;
    }
    
    /**
     * Add an array of Mahabhuta functions
     */
    addMahabhuta(mahafuncs) {
        if (!this.mahafuncs) { this.mahafuncs = []; }
        this.mahafuncs.push(mahafuncs);
        return this;
    }
    
    setRenderDestination(dir) {
        this.renderTo = dir;
        return this;
    }
    
    get renderDestination() { return this.renderTo; }
    
    /* TODO:
    
    addMetadataObject - object */
    
    addMetadata(index, value) {
        if (typeof this.metadata === 'undefined' || !this.hasOwnProperty("metadata") || !this.metadata) {
            this.metadata = {};
        }
        this.metadata[index] = value;
        return this;
    }
    
    rootURL(root_url) {
        this.root_url = root_url;
        return this;
    }
    
    addHeaderJavaScript(script) {
        if (typeof this.scripts === 'undefined' || !this.hasOwnProperty("scripts") || !this.scripts) {
            this.scripts = {};
        }
        if (!this.scripts.javaScriptTop) this.scripts.javaScriptTop = [];
        this.scripts.javaScriptTop.unshift(script);
        return this;
    }
    
    addFooterJavaScript(script) {
        if (typeof this.scripts === 'undefined' || !this.hasOwnProperty("scripts") || !this.scripts) {
            this.scripts = {};
        }
        if (!this.scripts.javaScriptBottom) this.scripts.javaScriptBottom = [];
        this.scripts.javaScriptBottom.unshift(script);
        return this;
    }
    
    addStylesheet(css) {
        if (typeof this.scripts === 'undefined' || !this.hasOwnProperty("scripts") || !this.scripts) {
            this.scripts = {};
        }
        if (!this.scripts.stylesheets) this.scripts.stylesheets = [];
        this.scripts.stylesheets.unshift(css);
        return this;
    }
    
    copyAssets(config) {
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
    };

    /**
     * use - go through plugins array, adding each to the plugins array in
     * the config file, then calling the config function of each plugin.
     */
    use(plugin) {
        if (typeof this._plugins === 'undefined' || !this.hasOwnProperty("_plugins") || ! this._plugins) {
            this._plugins = [];
        }
    
        if (typeof plugin === 'string') {
            plugin = require(plugin);
        }
        if (!plugin || plugin instanceof Plugin) {
            throw new Error("No plugin supplied");
        }
        plugin = new plugin();
        if (typeof this._plugins[plugin.name] === 'undefined') {
            this._plugins[plugin.name] = plugin;
            plugin.configure(this);
        }
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
     * plugin - Look for a plugin, returning its module reference.
     */
    plugin(name) {
        if (! this._plugins || typeof this._plugins[name] === 'undefined') {
            return undefined;
        } else {
            // console.log(util.inspect(this._plugins[name]));
            return this._plugins[name];
        }
    }

}