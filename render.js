'use strict';

const globfs    = require('globfs');
const path      = require('path');
const fs        = require('fs-extra');
const util      = require('util');
const parallelLimit = require('run-parallel-limit');

/////////// Renderer class

const _renderer_name = Symbol('name');
const _renderer_regex = Symbol('regex');

module.exports.Renderer = class Renderer {
    constructor(name, regex) {
        this[_renderer_name]  = name;
        if (regex instanceof RegExp) {
            this[_renderer_regex] = [ regex ];
        } else if (regex instanceof Array) {
            this[_renderer_regex] = regex;
        } else {
            throw new Error('regex must be RegExp or Array of RegExp');
        }
    }

    get name() { return this[_renderer_name]; }
    get regex() { return this[_renderer_regex]; }

    match(fname) {
        var matches;
        for (var regex of this.regex) {
            if ((matches = fname.match(regex)) !== null) {
                return true;
            }
        }
        return false;
    }

    /* {
    	path: matches[0],
    	renderedFileName: matches[1],
    	extension: matches[2]
    }; */

    filePath(fname) {
        // log(`${this._name} filePath ${fname}`);
        var matches;
        for (var regex of this.regex) {
            if ((matches = fname.match(regex)) !== null) {
                return matches[1];
            }
        }
        return null;
    }

    fileExtension(fname) {
        var matches;
        for (var regex of this.regex) {
            if ((matches = fname.match(regex)) !== null) {
                return matches[2];
            }
        }
        return null;
    }

    readFile(basedir, fpath) {
        return fs.readFile(path.join(basedir, fpath), 'utf8');
    }

    writeFile(renderTo, fpath, text) {
        return fs.outputFile(path.join(renderTo, fpath), text, 'utf8');
        // remove circular dependency
        // return filez.writeFile(renderTo, fpath, text);
    }

    render(text, metadata) {
        throw new Error('implement render method');
    }

    renderSync(text, metadata) {
        throw new Error('implement renderSync method');
    }

    renderToFile(dir, fpath, renderTo, renderToPlus, metadata, config) {
        throw new Error('implement renderToFile method');
    }

};

//////////// HTMLRenderer class

/**
 * Rendering support for any file that produces HTML when rendered.
 */
module.exports.HTMLRenderer = class HTMLRenderer extends module.exports.Renderer {

    /**
     * Support for Mahabhuta -- jQuery-like processing of HTML DOM before Rendering
     * down to HTML text.
     */
    maharun(rendered, metadata, mahafuncs) {
        if (typeof rendered === 'undefined' || rendered === null) {
            throw new Error('no rendered provided');
        }
        if (typeof metadata === 'undefined' || metadata === null) {
            throw new Error('no metadata provided');
        }
        if (typeof mahabhuta === 'undefined' || mahabhuta === null) {
            throw new Error('no mahabhuta provided');
        }
        
        if (metadata.config.mahabhutaConfig) mahabhuta.config(metadata.config.mahabhutaConfig);
        return mahabhuta.processAsync(rendered, metadata, mahafuncs);
    }

    copyMetadataProperties(data, frontmatter) {
        for (var prop in frontmatter) {
            if (!(prop in data)) data[prop] = frontmatter[prop];
        }
        return data;
    }

    /**
     * If the document metadata says to render into a template, do so.
     */
    async renderForLayout(rendered, metadata, config) {
        // console.log('renderForLayout '+ util.inspect(metadata));
        if (metadata.layout) {
            // find layout
            // read layout
            // split out frontmatter & content
            // find renderer
            // renderer.render
            // mahabhuta

            // const layoutStart = new Date();

            var fnLayout;
            var layouttext;
            var layoutcontent;
            var layoutdata;
            var layoutrendered;
            var metadocpath = metadata.document ? metadata.document.path : "unknown";

            var thisRenderer = this;

            // console.log(`renderForLayout find ${util.inspect(config.layoutDirs)} ${metadata.layout}`);
            var foundDir = await globfs.findAsync(config.layoutDirs, metadata.layout);
            if (!foundDir) throw new Error(`No layout directory found in ${util.inspect(config.layoutDirs)} ${metadata.layout} in file ${metadata.document.path}`);
            foundDir = foundDir[0];
            if (!foundDir) await new Error(`No layout directory found in ${util.inspect(config.layoutDirs)} ${metadata.layout} in file ${metadata.document.path}`);
            var layoutFname = path.join(foundDir.basedir, foundDir.path);
            var layout = await fs.readFile(layoutFname, 'utf8');
            layouttext = layout;
            var fm = matter(layout);
            layoutcontent = fm.content;
            layoutdata    = thisRenderer.copyMetadataProperties(metadata, fm.data);
            layoutdata.content = rendered;
            // if (!fm.data.layout) layoutdata.layout = undefined;
            const renderer = module.exports.findRendererPath(metadata.layout);
            /* if (!renderer && metadata.layout.match(/\.html$/) != null) {
                return filez.readFile(partialDir, partial);
            } */
            if (!renderer) throw new Error(`No renderer for ${metadata.layout}`);
            // log(`renderForLayout rendering ${metadocpath} with ${metadata.layout}`);
            // console.log(`HTMLRenderer before render plugin=${util.inspect(metadata.plugin)}`);
            // const layoutPrepared = new Date();
            // console.log(`renderForLayout PREPARED ${metadocpath} ${layoutFname} ${(layoutPrepared - layoutStart) / 1000} seconds`);
            try {
                layoutrendered = await renderer.render(layoutcontent, layoutdata);
            } catch (e) {
                let ee = new Error(`Error rendering ${metadocpath} with ${metadata.layout} ${e.stack ? e.stack : e}`);
                console.error(ee);
                throw ee;
            }
            // const layoutFirstRender = new Date();
            // console.log(`renderForLayout FIRST RENDER ${metadocpath} ${layoutFname} ${(layoutFirstRender - layoutStart) / 1000} seconds`);
            // log('maharun '+ metadata.layout +' '+ util.inspect(layoutdata.config.headerScripts));
            // log(`renderForLayout maharun ${metadocpath} with ${metadata.layout}`);
            if (thisRenderer.doMahabhuta(metadocpath)) {
                try {
                    layoutrendered = await thisRenderer.maharun(layoutrendered, layoutdata, config.mahafuncs);
                } catch (e2) {
                    let eee = new Error(`Error with Mahabhuta ${metadocpath} with ${metadata.layout} ${e2.stack ? e2.stack : e2}`);
                    console.error(eee);
                    throw eee;
                }
            } else {
                // console.log(`renderForLayout mahabhuta not allowed ${layoutrendered}`);
            }
            // const layoutFinishMahabhuta = new Date();
            // console.log(`renderForLayout FINISH MAHABHUTA ${metadocpath} ${layoutFname} ${(layoutFinishMahabhuta - layoutStart) / 1000} seconds`);
            // log(`renderForLayout FINI ${metadocpath} with ${metadata.layout}`);
            return layoutrendered;
        } else return rendered;
    }

    /**
     * Render the document file, through a template if necessary, producing
     * an output file.
     */
    async renderToFile(basedir, fpath, renderTo, renderToPlus, metadata, config) {

        const renderStart = new Date();

        // console.log(`renderToFile ${basedir} ${fpath} ${renderTo} ${renderToPlus} ${util.inspect(metadata)}`);
        // var doctext;
        var doccontent;
        var docdata = metadata;
        var docrendered;

        var thisRenderer = this;

        var fm = await thisRenderer.frontmatter(basedir, fpath);
        doccontent = fm.content;
        // const renderFrontmatter = new Date();
        // console.log(`renderToFile FRONTMATTER ${basedir} ${fpath} ${renderTo} ${(renderFrontmatter - renderStart) / 1000} seconds`);
        // console.log(`renderToFile ${basedir} ${fpath} ${renderTo} ${renderToPlus} ${doccontent}`);
        var metadata = await thisRenderer.initMetadata(config, basedir, fpath, renderToPlus, docdata, fm.data);
        docdata = metadata;
        // console.log('about to render '+ fpath);
        // console.log(`metadata before render ${util.inspect(docdata)}`);
        try {
            docrendered = await thisRenderer.render(doccontent, docdata);
        } catch (err) {
            console.error("Error rendering "+ fpath +" "+ (err.stack ? err.stack : err));
            throw new Error("Error rendering "+ fpath +" "+ (err.stack ? err.stack : err));
        }
        // const renderFirstRender = new Date();
        // console.log(`renderToFile FIRST RENDER ${basedir} ${fpath} ${renderTo} ${(renderFirstRender - renderStart) / 1000} seconds`);
        // console.log('rendered to maharun '+ fpath);
        if (thisRenderer.doMahabhuta(fpath)) {
            try {
                docrendered = await thisRenderer.maharun(docrendered, docdata, config.mahafuncs);
            } catch (err2) {
                console.error("Error in Mahabhuta for "+ fpath +" "+ (err2.stack ? err2.stack : err2));
                throw new Error("Error in Mahabhuta for "+ fpath +" "+ (err2.stack ? err2.stack : err2));
            }
        }
        const renderFirstMahabhuta = new Date();
        console.log(`renderToFile FIRST MAHABHUTA ${basedir} ${fpath} ${renderTo} ${(renderFirstMahabhuta - renderStart) / 1000} seconds`);
        // console.log('maharun to renderForLayout '+ fpath);
        docrendered = await thisRenderer.renderForLayout(docrendered, docdata, config);
        const renderSecondRender = new Date();
        console.log(`renderToFile SECOND RENDER ${basedir} ${fpath} ${renderTo} ${(renderSecondRender - renderStart) / 1000} seconds`);
        // console.log(`renderToFile ${basedir} ${fpath} ==> ${renderTo} ${thisRenderer.filePath(fpath)}`);
        // console.log(docrendered);
        await fs.outputFile(path.join(renderTo, thisRenderer.filePath(fpath)), docrendered, 'utf8');
        // remove circular dependency
        // await filez.writeFile(renderTo, thisRenderer.filePath(fpath), docrendered);
    }

    /**
     * Determine whether it's allowed to run Mahabhuta.  Some rendering types
     * cannot allow Mahabhuta to run.  Renderers should override this
     * function if necessary.
     */
    doMahabhuta(fpath) {
        return true;
    }

    parseFrontmatter(content) {
        return matter(content);
    }

    /**
     * Extract the frontmatter for the given file.
     */
    async frontmatter(basedir, fpath) {
        var cachekey = `fm-${basedir}-${fpath}`;
        var cachedFrontmatter = cache.get("htmlrenderer", cachekey);
        if (cachedFrontmatter) {
            // TODO
            // Add check here that stat's file, if file is newer
            // than the cache'd version then delete the cach entry
            // and proceed to the rest of the function, otherwise
            // return the cached data
            return cachedFrontmatter;
        }
        var text = await fs.readFile(path.join(basedir, fpath), 'utf8');
        // console.log(`frontmatter ${path.join(basedir, fpath)} ${text}`);
        var fm = matter(text);
        // console.log(`frontmatter ${path.join(basedir, fpath)} ${util.inspect(fm)}`);
        cache.set("htmlrenderer", cachekey, fm);
        // log(`frontmatter ${cachekey} ${util.inspect(fm)}`);
        return fm;
    }

    /**
     * Extract the metadata from the given file.  Where the `frontmatter` function
     * returns an object that contains the metadata, this function returns only
     * the metadata object.
     *
     * This metadata is solely the data stored in the file.
     */
    async metadata(basedir, fpath) {
        var thisRenderer = this;
        var fm = await thisRenderer.frontmatter(basedir, fpath);
        return fm.data;
    }

    /**
     * Initialize the metadata object which is passed around with the Document object.
     * This metadata is formed by adding together the document metadata, potential metadata
     * associated with the document directory, some data about the source file and where it's
     * supposed to be rendered, as well as some useful functions.
     */
    async initMetadata(config, basedir, fpath, renderToPlus, baseMetadata, fmMetadata) {

        // console.log(`initMetadata ${basedir} ${fpath} ${renderToPlus} ${util.inspect(baseMetadata)} ${util.inspect(fmMetadata)}`);
        const renderer = this;

        // Start with a base object that will be passed into the template
        var metadata = { };

        // Copy data from frontmatter
        for (var yprop in baseMetadata) {
            // console.log(`initMetadata ${basedir} ${fpath} baseMetadata ${baseMetadata[yprop]}`);
            metadata[yprop] = baseMetadata[yprop];
        }
        for (var yprop in config.metadata) {
            metadata[yprop] = config.metadata[yprop];
        }
        var fmmcount = 0;
        for (var yprop in fmMetadata) {
            metadata[yprop] = fmMetadata[yprop];
            fmmcount++;
        }
        if (fmmcount <= 0) console.error('WARNING: No metadata discovered in '+ basedir +' '+ fpath);

        metadata.content = "";
        metadata.document = {};
        metadata.document.basedir = basedir;
        metadata.document.relpath = fpath;
        metadata.document.relrender = renderer.filePath(fpath);
        metadata.document.path = path.join(renderToPlus, fpath);
        // console.log(`initMetadata ${renderToPlus} ${fpath} ${renderer.filePath(fpath)}`);
        metadata.document.renderTo = path.join(renderToPlus, renderer.filePath(fpath));

        metadata.config      = config;
        metadata.partialSync = akasha.partialSync.bind(renderer, config);
        metadata.partial     = akasha.partial.bind(renderer, config);

        metadata.root_url = config.root_url;

        if (config.root_url) {
            let pRootUrl = url.parse(config.root_url);
            pRootUrl.pathname = metadata.document.renderTo;
            metadata.rendered_url = url.format(pRootUrl);
        } else {
            metadata.rendered_url = metadata.document.renderTo;
        }

        // console.log('initMetadata '+ basedir +' '+ fpath +' '+ util.inspect(metadata));

        metadata.akasha = akasha;
        metadata.plugin = config.plugin;

        // console.log(`HTMLRenderer before path.join ${path.join(basedir, fpath)}`);
        const stats = await fs.stat(path.join(basedir, fpath));
        if (!stats) {
            metadata.rendered_date = new Date();
        } else {
            metadata.rendered_date = stats.mtime;
        }

        if (!metadata.publicationDate) {
            var dateSet = false;
            if (fmMetadata && fmMetadata.publDate) {
                var parsed = Date.parse(fmMetadata.publDate);
                if (! isNaN(parsed)) {
                    metadata.publicationDate = new Date(parsed);
                }
                dateSet = true;
            }
            if (! dateSet && stats && stats.mtime) {
                metadata.publicationDate = stats.mtime;
            }
            if (!metadata.publicationDate) {
                metadata.publicationDate = new Date();
            }
        }

        return metadata;
    };

}

//////////// AsciiDoc Renderer


const asciidoctor = require('asciidoctor.js')();

const _renderer_doctype = Symbol('doctype');

class AsciidocRenderer extends module.exports.HTMLRenderer {
    constructor() {
        super(".html.adoc", /^(.*\.html)\.(adoc)$/);
        this[_renderer_doctype] = 'article';
    }

    configuration(options) {
        if (options && options.doctype) {
            this[_renderer_doctype] = options.doctype;
        }
        return this;
    }

    // http://asciidoctor.org/docs/user-manual/#ruby-api-options
    // That lists all the options which can be set
    // Of interest are:
    //     base_dir - controls where the include directive pulls files
    //     safe - enables safe mode (?? what does that mean ??)
    //     template_dir - controls where template files are found
    convert(text, metadata) {
        var options = metadata.asciidoctor ? metadata.asciidoctor : {
            doctype: this[_renderer_doctype]
        };
        // AsciiDoctor.js doesn't allow non-String/Number items in 
        // the attributes object.  That means we cannot simply use
        // the metadata as-is, but have to select out the items to include.
        //
        // First, this steps through the keys in metadata object looking
        // for the items that are strings or numbers.  That limits the
        // data items to what AsciiDoctor supports.
        //
        // Second, we skip the 'title' item because AsciiDoctor has
        // special treatment for that attribute.
        options.attributes = {};
        for (let key in metadata) {
            if ((typeof metadata[key] === 'string'
              || typeof metadata[key] === 'number')
              && key !== 'title') {
                options.attributes[key] = metadata[key];
            }
        }
        // console.log(`convert ${util.inspect(options)}`);
        return asciidoctor.convert(text, options);
    }

    renderSync(text, metadata) {
        // console.log('AsciidocRenderer renderSync '+ text);
        var ret = this.convert(text, metadata);
        // console.log(ret);
        return ret;
    }

    render(text, metadata) {
        // console.log('AsciidocRenderer render');
        return new Promise((resolve, reject) => {
            try {
                resolve(this.convert(text, metadata));
            } catch(e) {
                reject(e);
            }
        });
    }
}

//////////// EJS Renderer


const ejs      = require('ejs');

// TODO support .php.ejs
class EJSRenderer extends module.exports.HTMLRenderer {
    constructor() {
        super(".html.ejs", /^(.*\.html|.*\.php)\.(ejs)$/);
    }

    renderSync(text, metadata) {
        return ejs.render(text, metadata);
    }

    render(text, metadata) {
        /* return Promise.resolve(ejs.render(text, metadata)); */
        return new Promise((resolve, reject) => {
            try {
                resolve(ejs.render(text, metadata));
            } catch(e) {
                var docpath = metadata.document ? metadata.document.path : "unknown";
                var errstack = e.stack ? e.stack : e;
                reject("Error with EJS in file "+ docpath +" "+ errstack);
            }
        });
    }

    /**
     * We cannot allow PHP code to run through Mahabhuta.
     */
    doMahabhuta(fpath) {
        if (/\.php\.ejs$/.test(fpath))
            return false;
        else
            return true;
    }
}

//////////// Markdown renderer


const mditConfig = {
    html:         true,         // Enable html tags in source
    xhtmlOut:     true,         // Use '/' to close single tags (<br />)
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    // langPrefix:   'language-',  // CSS language prefix for fenced blocks
    linkify:      true,         // Autoconvert url-like texts to links
    typographer:  false,        // Enable smartypants and other sweet transforms
  
    // Highlighter function. Should return escaped html,
    // or '' if input not changed
    highlight: function (/*str, , lang*/) { return ''; }
  };
  const mdit = require('markdown-it');
  var md;
  
  class MarkdownRenderer extends module.exports.HTMLRenderer {
      constructor() {
          super(".html.md", /^(.*\.html)\.(md)$/);
          md = mdit(mditConfig);
      }
  
      configuration(newConfig) {
          md = mdit(newConfig);
          return this;
      }
  
      use(mditPlugin) {
          md.use(mditPlugin);
          return this;
      }
  
      renderSync(text, metadata) {
          // console.log('MarkdownRenderer renderSync '+ text);
          var ret = md.render(text);
          // console.log(ret);
          return ret;
      }
  
      render(text, metadata) {
          // console.log('MarkdownRenderer render');
          return new Promise((resolve, reject) => {
              try {
                  resolve(md.render(text));
              } catch(e) {
                  reject(e);
              }
          });
      }
  }

//////////// JSON Renderer

class JSONRenderer extends module.exports.HTMLRenderer {
    constructor() {
        super(".html.json", /^(.*\.html)\.(json)$/);
    }

    renderSync(text, metadata) {
        var json = JSON.parse(text);
        return akasha.partialSync(metadata.config, metadata.JSONFormatter, { data: json });
    }

    async render(text, metadata) {
        try {
            var json = JSON.parse(text);
            // console.log(`JSONRenderer ${text} ==> ${util.inspect(json)}`);
            // console.log(`JSONRenderer JSONFormatter ${metadata.JSONFormatter}`);
            await akasha.partial(metadata.config, metadata.JSONFormatter, { data: json });
        } catch(e) {
            var docpath = metadata.document ? metadata.document.path : "unknown";
            var errstack = e.stack ? e.stack : e;
            throw "Error with JSON in file "+ docpath +" "+ errstack;
        }
    }
}

//////////// CSS/Less Renderer

class CSSLESSRenderer extends module.exports.Renderer {
    constructor() {
        super(".css.less", /^(.*\.css)\.(less)$/);
    }

    renderSync(text, metadata) {
        throw new Error("Cannot render .css.less in synchronous environment");
    }

    render(lesstxt, metadata) {
        return new Promise((resolve, reject) => {
            less.render(lesstxt, function (err, css) {
                if (err) reject(err);
                else     resolve(css);
            });
        });
    }

    renderToFile(basedir, fpath, renderTo, renderToPlus, metadata, config) {
        var thisRenderer = this;
        return co(function* () {
            var lesstxt = yield thisRenderer.readFile(basedir, fpath);
            var css = yield thisRenderer.render(lesstxt, {});
            return yield thisRenderer.writeFile(renderTo,
                                    thisRenderer.filePath(fpath),
                                    css.css);
        });
    }
}

///////////  Renderer management

// const Renderer = require('./Renderer');

var renderers = [];

exports.registerRenderer = function(renderer) {
    if (!(renderer instanceof module.exports.Renderer)) {
        error('Not A Renderer '+ util.inspect(renderer));
        throw new Error('Not a Renderer');
    }
    if (!exports.findRendererName(renderer.name)) {
        renderers.push(renderer);
    }
};

exports.findRendererName = function(name) {
    for (var r of renderers) {
        if (r.name === name) return r;
    }
    return undefined;
};

exports.findRendererPath = function(_path) {
    // log(`findRendererPath ${_path}`);
    for (var r of renderers) {
        if (r.match(_path)) return r;
    }
    // console.log(`findRendererPath NO RENDERER for ${_path}`);
    return undefined;
};

// Register built-in renderers
exports.registerRenderer(new MarkdownRenderer() /* require('./render-md') */);
exports.registerRenderer(new AsciidocRenderer() /* require('./render-asciidoc') */);
exports.registerRenderer(new EJSRenderer() /* require('./render-ejs') */);
exports.registerRenderer(new CSSLESSRenderer() /* require('./render-cssless') */);
exports.registerRenderer(new JSONRenderer() /* require('./render-json') */);

//////////////////////////////////////////////////////////

exports.partial = async function(config, fname, metadata) {

    var partialFound = await globfs.findAsync(config.partialsDirs, fname);
    if (!partialFound) throw new Error(`No partial found for ${fname} in ${util.inspect(config.partialsDirs)}`);
    // Pick the first partial found
    partialFound = partialFound[0];
    // console.log(`partial ${util.inspect(partialFound)}`);
    if (!partialFound) throw new Error(`No partial found for ${fname} in ${util.inspect(config.partialsDirs)}`);

    var partialFname = path.join(partialFound.basedir, partialFound.path);
    // console.log(`partial ${util.inspect(partialFname)}`);
    var stats = await fs.stat(partialFname);
    if (!stats.isFile()) {
        throw new Error(`renderPartial non-file found for ${fname} - ${partialFname}`);
    }

    var renderer = render.findRendererPath(partialFname);
    if (renderer) {
        // console.log(`partial about to render ${util.inspect(partialFname)}`);
        var partialText = await fs.readFile(partialFname, 'utf8');
        return renderer.render(partialText, metadata);
    } else if (partialFname.endsWith('.html') || partialFname.endsWith('.xhtml')) {
        // console.log(`partial reading file ${partialFname}`);
        return fs.readFile(partialFname, 'utf8');
    } else {
        throw new Error(`renderPartial no Renderer found for ${fname} - ${partialFname}`);
    }
    // This has been moved into Mahabhuta
    // return mahaPartial.doPartialAsync(partial, attrs);
};

exports.partialSync = function(config, fname, metadata) {

    var partialFound = globfs.findSync(config.partialsDirs, fname);
    if (!partialFound) throw new Error(`No partial directory found for ${fname}`);
    // Pick the first partial found
    partialFound = partialFound[0];

    var partialFname = path.join(partialFound.basedir, partialFound.path);
    // console.log(`doPartialSync before reading ${partialFname}`);
    var stats = fs.statSync(partialFname);
    if (!stats.isFile()) {
        throw new Error(`doPartialSync non-file found for ${fname} - ${partialFname}`);
    }
    var partialText = fs.readFileSync(partialFname, 'utf8');

    var renderer = render.findRendererPath(partialFname);
    if (renderer) {
        return renderer.renderSync(partialText, metadata);
    } else if (partialFname.endsWith('.html') || partialFname.endsWith('.xhtml')) {
        return fs.readFileSync(partialFname, 'utf8');
    } else {
        throw new Error(`renderPartial no Renderer found for ${fname} - ${partialFname}`);
    }
    // This has been moved into Mahabhuta
    // return mahaPartial.doPartialSync(fname, metadata);
};

//////////////////////////////////////////////////////////

/**
 * Render a single document
 *
 * @param config Configuration
 * @param basedir String The directory within which to find the document
 * @param fpath String The pathname within basedir for the document
 * @param renderTo String the directory into which this is to be rendered
 * @param renderToPlus String further pathname addition for the rendering.  The final pathname is renderTo/renderToPlus/flath
 * @param renderBaseMetadata Object The metadata object to start with.  Typically this is an empty object, but sometimes we'll have some metadata to start with.
 */
exports.renderDocument = async function(config, basedir, fpath, renderTo, renderToPlus, renderBaseMetadata) {

    const renderStart = new Date();

    var docPathname = path.join(basedir, fpath);
    var renderToFpath = path.join(renderTo, renderToPlus, fpath);

    // console.log(`renderDocument basedir ${basedir} fpath ${fpath} docPathname ${docPathname} renderToFpath ${renderToFpath}`);
    var stats = await fs.stat(docPathname);

    if (stats && stats.isFile()) {
        var renderToDir = path.dirname(renderToFpath);
        log(`renderDocument ${basedir} ${fpath} ${renderToDir} ${renderToFpath}`);
        await fs.ensureDir(renderToDir);
    } else { return `SKIP DIRECTORY ${docPathname}`; }

    var renderer = exports.findRendererPath(fpath);
    if (renderer) {
        // Have to re-do the renderToFpath to give the Renderer a say in the file name
        renderToFpath = path.join(renderTo, renderToPlus, renderer.filePath(fpath));
        // console.log(`ABOUT TO RENDER ${renderer.name} ${docPathname} ==> ${renderToFpath}`);
        try {
            await renderer.renderToFile(basedir, fpath, path.join(renderTo, renderToPlus), renderToPlus, renderBaseMetadata, config);
            // console.log(`RENDERED ${renderer.name} ${docPathname} ==> ${renderToFpath}`);
            const renderEndRendered = new Date();
            return `${renderer.name} ${docPathname} ==> ${renderToFpath} (${(renderEndRendered - renderStart) / 1000} seconds)`;
        } catch (err) {
            console.error(`in renderer branch for ${docPathname} to ${renderToFpath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in renderer branch for ${docPathname} to ${renderToFpath} error=${err.stack ? err.stack : err}`);
        }
    } else {
        // console.log(`COPYING ${docPathname} ==> ${renderToFpath}`);
        try {
            await fs.copy(docPathname, renderToFpath);
            // console.log(`COPIED ${docPathname} ==> ${renderToFpath}`);
            const renderEndCopied = new Date();
            return `COPY ${docPathname} ==> ${renderToFpath} (${(renderEndCopied - renderStart) / 1000} seconds)`;
        } catch(err) {
            console.error(`in copy branch for ${docPathname} to ${renderToFpath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in copy branch for ${docPathname} to ${renderToFpath} error=${err.stack ? err.stack : err}`);
        }
    }
};

exports.newrender = async function(config) {
    var filez = [];
    for (let docdir of config.documentDirs) {

        let renderToPlus = "";
        let renderFrom = docdir;
        let renderIgnore;
        let renderBaseMetadata = {};
        if (typeof docdir === 'object') {
            renderFrom = docdir.src;
            renderToPlus = docdir.dest;
            renderIgnore = docdir.ignore;
            if (docdir.baseMetadata) {
                // console.log(`render fromDir: ${renderFrom} to: ${renderToPlus} baseMetadata ${util.inspect(docdir.baseMetadata)}`);
                renderBaseMetadata = docdir.baseMetadata;
            }
        }

        let listForDir = await globfs.operateAsync(renderFrom, '**/*', async (basedir, fpath, fini) => {
            var doIgnore = false;
            if (renderIgnore) renderIgnore.forEach(ign => {
                log(`CHECK ${fpath} === ${ign}`);
                if (fpath === ign) {
                    doIgnore = true;
                }
            });
            let stats = await fs.stat(path.join(basedir, fpath));
            if (!stats) doIgnore = true;
            else if (stats.isDirectory()) doIgnore = true;
            else if (fpath.endsWith('.DS_Store')) doIgnore = true;
            console.log(`RENDER? renderFrom ${renderFrom} basedir ${basedir} fpath ${fpath} doIgnore ${doIgnore}`);
            if (!doIgnore) {
                fini(undefined, {
                    config,
                    basedir,
                    fpath,
                    renderTo: config.renderTo,
                    renderToPlus,
                    renderBaseMetadata,
                    ignore: false
                });
            } else fini(undefined, { ignore: true });
        });
        for (let entry of listForDir) {
            if (!entry.ignore) filez.push(entry);
        }
    }

    let filez2 = filez.map(entry => {
        return entry.result && entry.result.ignore ? false : true;
    });

    // The above code put a list of files in the filez array
    // Now the task is to render the files, performing several in parallel

    // TODO implement that loop
    // TODO in mahabhuta, have each mahafunc execute under a nextTick

    var results = await new Promise((resolve, reject) => {
        parallelLimit(filez.map(entry => {
            return function(cb) {
                exports.renderDocument(
                    entry.result.config,
                    entry.result.basedir,
                    entry.result.fpath,
                    entry.result.renderTo,
                    entry.result.renderToPlus,
                    entry.result.renderBaseMetadata
                )
                .then((result) => {
                    // log(`render renderDocument ${result}`);
                    cb(undefined, { result });
                })
                .catch(err => {
                    // console.error(`render renderDocument ${err} ${err.stack}`);
                    cb(undefined, { error: err });
                });
            };
        }), 
        config.concurrency, // Concurrency count
        function(err, results) {
            // gets here on final results
            if (err) reject(err);
            else resolve(results);
        });
    });

    // console.log('CALLING config.hookSiteRendered');
    var hookResults = await config.hookSiteRendered();

    return results;
};

//exports.render = function(docdirs, layoutDirs, partialDirs, mahafuncs, renderTo) {
exports.render = async function(config) {

    // util.log(util.inspect(config.mahafuncs));
    // log('render');
    // log(`render ${util.inspect(config.documentDirs)}`);

    try {
        var renderResults = await Promise.all(config.documentDirs.map(docdir => {
            var renderToPlus = "";
            var renderFrom = docdir;
            var renderIgnore;
            var renderBaseMetadata = {};
            if (typeof docdir === 'object') {
                renderFrom = docdir.src;
                renderToPlus = docdir.dest;
                renderIgnore = docdir.ignore;
                if (docdir.baseMetadata) {
                    // console.log(`render fromDir: ${renderFrom} to: ${renderToPlus} baseMetadata ${util.inspect(docdir.baseMetadata)}`);
                    renderBaseMetadata = docdir.baseMetadata;
                }
            }
            // log(`******* render.render ${renderFrom} ${config.renderTo} ${renderToPlus} ${renderIgnore}`);
            // console.log(`RENDER DIRECTORY ${renderFrom} ==> ${renderToPlus}`);
            return globfs.operateAsync(renderFrom, '**/*', (basedir, fpath, fini) => {
                var doIgnore = false;
                if (renderIgnore) renderIgnore.forEach(ign => {
                    log(`CHECK ${fpath} === ${ign}`);
                    if (fpath === ign) {
                        doIgnore = true;
                    }
                });
                // console.log(`RENDER? ${renderFrom} ${fpath} ${doIgnore}`);
                if (!doIgnore) {
                    exports.renderDocument(
                        config,
                        basedir,
                        fpath,
                        config.renderTo,
                        renderToPlus,
                        renderBaseMetadata
                    )
                    .then((result) => {
                        // log(`render renderDocument ${result}`);
                        fini(undefined, result);
                    })
                    .catch(err => {
                        console.error(`render renderDocument ${err}`);
                        fini(err);
                    });
                } else fini(undefined, `IGNORED ${renderFrom} ${fpath}`);
            });
        }));

        // console.log('CALLING config.hookSiteRendered');
        var hookResults = await config.hookSiteRendered();

        // The array resulting from the above has two levels, when we
        // want to return one level.  The two levels are due to globfs.operate
        // operating on each individual directory.
        var res = [];
        for (let i = 0; i < renderResults.length; i++) {
            for (let j = 0; j < renderResults[i].length; j++) {
                res.push(renderResults[i][j]);
            }
        }
        return res;
    } catch (e) {
        console.error(`render FAIL because of ${e.stack}`);
        throw e;
    }
};
