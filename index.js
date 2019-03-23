
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
const globfs = require('globfs');
const mahabhuta = require('mahabhuta');
exports.mahabhuta = mahabhuta;
const mahaPartial = require('mahabhuta/maha/partial');
const documents = require('./documents');

exports.cache = require('./caching');
exports.Plugin = require('./Plugin');

const render = require('./render');

module.exports.Renderer = require('./Renderer');
module.exports.HTMLRenderer = require('./HTMLRenderer');
module.exports.AsciidocRenderer = require('./render-asciidoc');
module.exports.EJSRenderer = require('./render-ejs');
module.exports.MarkdownRenderer = require('./render-md');
module.exports.JSONRenderer = require('./render-json');
module.exports.CSSLESSRenderer = require('./render-cssless');

exports.render = render.newrender;
exports.renderDocument = render.renderDocument;

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
exports.findRendersTo = filez.findRendersTo;

/**
 *
 *
 * @param dir
 * @param fpath
 */
exports.readFile = filez.readFile;
exports.createNewFile = filez.createNewFile;

exports.Document = documents.Document;
exports.HTMLDocument = documents.HTMLDocument;
exports.documentTree = documents.documentTree;
exports.documentSearch = documents.documentSearch;
exports.readDocument   = documents.readDocument;

exports.partial = render.partial;

exports.partialSync = render.partialSync; 

exports.indexChain = async function(config, fname) {

    var ret = [];
    const parsed = path.parse(fname);

    var findParents = function(config, fileName) {
        // var newFileName;
        var parentDir;
        // console.log(`findParents ${fileName}`);
        if (path.dirname(fileName) === '.'
         || path.dirname(fileName) === parsed.root) {
            return Promise.resolve();
        } else {
            if (path.basename(fileName) === "index.html") {
                parentDir = path.dirname(path.dirname(fileName));
            } else {
                parentDir = path.dirname(fileName);
            }
            var lookFor = path.join(parentDir, "index.html");
            return filez.findRendersTo(config, lookFor)
            .then(found => {
                // console.log(util.inspect(found));
                if (typeof found !== 'undefined') {
                    ret.push({ foundDir: found.foundDir, foundPath: found.foundPath, filename: lookFor });
                }
                return findParents(config, lookFor);
            });
        }
    };

    let renderer = config.findRendererPath(fname);
    if (renderer) {
        fname = renderer.filePath(fname);
    }

    var found = await filez.findRendersTo(config, fname);
    if (typeof found === 'undefined') {
        throw new Error(`Did not find directory for ${fname}`);
    }
    ret.push({ foundDir: found.foundDir, foundPath: found.foundPath, filename: fname });
    await findParents(config, fname);

    // console.log(`indexChain FINI ${util.inspect(ret.reverse)}`);
    return ret.reverse();
};

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

    // console.log('rss '+ util.inspect(rss));

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
const _config_concurrency = Symbol('concurrency');
const _config_akasha = Symbol('akasha');
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
        this[_config_akasha] = module.exports;

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

    }

    get akasha() { return this[_config_akasha]; }

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

        if (!this[_config_concurrency]) { this[_config_concurrency] = 3; }

        // The akashacms-builtin plugin needs to be last on the chain so that
        // its partials etc can be easily overridden.  This is the most convenient
        // place to declare that plugin.
        //
        this.use(require('./built-in'));

        // Set up the Mahabhuta partial tag so it renders through AkashaRender

        var config = this;
        mahaPartial.configuration.renderPartial = function(fname, metadata) {
            return render.partial(config, fname, metadata);
        }

        return this;
    }

    /**
     * Record the configuration directory so that we can correctly interpolate
     * the pathnames we're provided.
     */
    set configDir(cfgdir) { this[_config_configdir] = cfgdir; }
    get configDir() { return this[_config_configdir]; }

    set akasha(_akasha)  { this[_config_akasha] = _akasha; }
    get akasha() { return this[_config_akasha]; }

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

    get documentDirs() { return this[_config_documentDirs] ? this[_config_documentDirs] : []; }

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
            }
        }
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
    }

    get mahabhutaConfig() { return this[_config_cheerio]; }

    /**
     * Copy the contents of all directories in assetDirs to the render destination.
     */
    copyAssets() {
        // console.log('copyAssets START');

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
    async hookSiteRendered() {
        // console.log('hookSiteRendered');
        var config = this;
        for (let plugin of config.plugins) {
            if (typeof plugin.onSiteRendered !== 'undefined') {
                // console.log(`CALLING plugin ${plugin.name} onSiteRendered`);
                await plugin.onSiteRendered(config);
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

    registerRenderer(renderer) {
        if (!(renderer instanceof module.exports.Renderer)) {
            console.error('Not A Renderer '+ util.inspect(renderer));
            throw new Error('Not a Renderer');
        }
        if (!this.findRendererName(renderer.name)) {
            this[_config_renderers].push(renderer);
            renderer.akasha = this.akasha;
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
        this[_config_renderers].unshift(renderer);
        renderer.akasha = this.akasha;
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
        this.registerRenderer(new module.exports.CSSLESSRenderer());
        this.registerRenderer(new module.exports.JSONRenderer());
    }

    /**
     * Find a Renderer by its extension.
     */
    findRenderer(name) {
        return this.findRendererName(name);
    }
}
