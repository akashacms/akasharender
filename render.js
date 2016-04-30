'use strict';

const globfs    = require('globfs');
const path      = require('path');
const fs        = require('fs-extra');
const util      = require('util');
const yfm       = require('yfm');
const async     = require('async');
const mahabhuta = require('mahabhuta');
const filez     = require('./filez');

const log   = require('debug')('akasha:render');
const error = require('debug')('akasha:error-render');

///////////  Renderer management

const Renderer = require('./Renderer');

var renderers = [];

exports.registerRenderer = function(renderer) {
    if (!(renderer instanceof Renderer)) {
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

exports.findRendererPath = function(path) {
    for (var r of renderers) {
        if (r.match(path)) return r;
    }
    return undefined;
};

// Register built-in renderers
exports.registerRenderer(require('./render-md'));
exports.registerRenderer(require('./render-ejs'));
exports.registerRenderer(require('./render-cssless'));

//////////////////////////////////////////////////////////

exports.prepareConfig = function(config) {
    
    // util.log('prepareConfig '+ util.inspect(config.mahafuncs));
    
    if (!config) {
        config = {};
    }
    
    var stat;
    if (!config.assetsDirs) {
        config.assetsDirs = [];
        if (fs.existsSync('assets') && (stat = fs.statSync('assets'))) {
            if (stat.isDirectory()) {
                config.assetsDirs = [ 'assets' ];
            }
        }
    }
    
    if (!config.layoutDirs) {
        config.layoutDirs = [];
        if (fs.existsSync('layouts') && (stat = fs.statSync('layouts'))) {
            if (stat.isDirectory()) {
                config.layoutDirs = [ 'layouts' ];
            }
        }
    }
    
    if (!config.partialDirs) {
        config.partialDirs = [];
        if (fs.existsSync('partials') && (stat = fs.statSync('partials'))) {
            if (stat.isDirectory()) {
                config.partialDirs = [ 'partials' ];
            }
        }
    }
    
    if (!config.documentDirs) {
        config.documentDirs = [];
        if (fs.existsSync('documents') && (stat = fs.statSync('documents'))) {
            if (stat.isDirectory()) {
                config.documentDirs = [ 'documents' ];
            } else {
                throw new Error("'documents' is not a directory");
            }
        } else {
            throw new Error("No 'documents' setting, and no 'documents' directory");
        }
    }
    
    if (!config.renderTo) {
        if (fs.existsSync('out') && (stat = fs.statSync('out'))) {
            if (stat.isDirectory()) {
                config.renderTo = 'out';
            } else {
                throw new Error("'out' is not a directory");
            }
        } else {
            throw new Error('No output directory - must specify config.root_out');
        }
    }
    
    if (!config.headerScripts) {
        config.headerScripts = { };
    }
    if (!config.headerScripts.stylesheets) {
        config.headerScripts.stylesheets = [];
    }
    if (!config.headerScripts.javaScriptTop) {
        config.headerScripts.javaScriptTop = [];
    }
    if (!config.headerScripts.javaScriptBottom) {
        config.headerScripts.javaScriptBottom = [];
    }
    
    return config;
};

//exports.render = function(docdirs, layoutDirs, partialDirs, mahafuncs, renderTo) {
exports.render = function(config) {
    config = exports.prepareConfig(config);
    
    // util.log(util.inspect(config.mahafuncs));
    
    var renderDocument = function(basedir, fpath, renderTo, renderToPlus) {
        return new Promise((resolve, reject) => {
            var docPathname = path.join(basedir, fpath);
            var renderToFpath = path.join(renderTo, renderToPlus, fpath);
            fs.stat(docPathname, (err, stats) => {
                if (err) reject(err);
                else if (stats && stats.isFile()) {
                    var renderToDir = path.dirname(renderToFpath);
                    fs.ensureDir(renderToDir, err => {
                        if (err) {
                            error(`COULD NOT ENSURE DIR ${renderToDir}`);
                            return reject(new Error(`COULD NOT ENSURE DIR ${renderToDir}`));
                        }
                        var renderer = exports.findRendererPath(docPathname);
                        if (renderer) {
                            // Have to re-do the renderToFpath to give the Renderer a say in the file name
                            renderToFpath = path.join(renderTo, renderToPlus, renderer.filePath(fpath));
                            log(`${renderer.name} ${docPathname} ==> ${renderToFpath}`);
                            renderer.renderToFile(basedir, fpath, {}, config)
                            .then(()   => { resolve(`${renderer.name} ${docPathname} ==> ${renderToFpath}`); })
                            .catch(err => { error(`in renderer branch for ${fpath} error=${err.stack}`); reject(err); });
                        } else {
                            log(`COPY ${docPathname} ==> ${renderToFpath}`);
                            fs.copy(docPathname, renderToFpath, err => {
                                if (err) {
                                    error(`in copy branch for ${fpath} error=${err.stack}`);
                                    reject(new Error(`in copy branch for ${fpath} error=${err.stack}`));
                                }
                                else { resolve(`COPY ${docPathname} ==> ${renderToFpath}`); }
                            });
                        }
                    })
                } else { resolve(`SKIP DIRECTORY ${docPathname}`); }
            });
        });
    };
    
    return Promise.all(config.documentDirs.map(docdir => {
        var renderToPlus = "";
        var renderFrom = docdir;
        if (typeof docdir === 'object') {
            renderFrom = docdir.src;
            renderToPlus = docdir.dest;
        }
        return new Promise((resolve, reject) => {
            globfs.operate(renderFrom, '**/*', (basedir, fpath, fini) => {
                renderDocument(basedir, fpath, config.renderTo, renderToPlus)
                .then((result) => { fini(undefined, result); })
                .catch(err => { fini(err); });
            },
            (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });  
        });
    }))
    .then(results => {
        // The array resulting from the above has two levels, when we
        // want to return one level.  The two levels are due to globfs.operate
        // operating on each individual directory.
        var res = [];
        for (let i = 0; i < results.length; i++) {
            for (let j = 0; j < results[i].length; j++) {
                res.push(results[i][j]);
            }
        }
        return res;
    });
};

exports.partial = function(config, partial, attrs) {
    // find the partial
    // based on the partial format - render, using attrs
    // if okay - resolve(rendered) - else reject(err)

    var partialFname;
    var partialText;
    var renderer;
    
    return filez.find(config.partialDirs, partial)
    .then(partialDir => {
        partialFname = path.join(partialDir, partial);
        
        renderer = exports.findRendererPath(partialFname);
        if (!renderer) throw new Error('No renderer found for '+ partialFname);
        
        return filez.readFile(partialDir, partial);
    })
    .then(text => {
        partialText = text;
        return renderer.render(partialText, attrs);
    });
};

exports.partialSync = function(config, fname, metadata) {

    const renderer = exports.findRendererPath(fname);
    if (!renderer) {
        throw new Error(`No renderer for ${fname}`);
    }
    
    var fnamePartial = filez.findSync(config.partialDirs, fname);
    
    log(`partialSync fname=${fname} fnamePartial=${fnamePartial}`);
    if (fnamePartial === undefined) {
        throw new Error('NO FILE FOUND FOR PARTIAL ' + util.inspect(fname));
    }
    
    var text = fs.readFileSync(fnamePartial, 'utf8');
    
    return renderer.renderSync(text, metadata);
};
