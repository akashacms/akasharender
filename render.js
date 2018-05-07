'use strict';

const globfs    = require('globfs');
const path      = require('path');
const fs        = require('fs-extra');
const util      = require('util');
const akasha    = require('./index');
const mahabhuta = require('mahabhuta');
const filez     = require('./filez');
const parallelLimit = require('run-parallel-limit');

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

exports.findRendererPath = function(_path) {
    // log(`findRendererPath ${_path}`);
    for (var r of renderers) {
        if (r.match(_path)) return r;
    }
    // console.log(`findRendererPath NO RENDERER for ${_path}`);
    return undefined;
};

// Register built-in renderers
exports.registerRenderer(require('./render-md'));
exports.registerRenderer(require('./render-asciidoc'));
exports.registerRenderer(require('./render-ejs'));
exports.registerRenderer(require('./render-cssless'));
exports.registerRenderer(require('./render-json'));

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
            return `${renderer.name} ${docPathname} ==> ${renderToFpath}`;
        } catch (err) {
            console.error(`in renderer branch for ${fpath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in renderer branch for ${fpath} error=${err.stack ? err.stack : err}`);
        }
    } else {
        // console.log(`COPYING ${docPathname} ==> ${renderToFpath}`);
        try {
            await fs.copy(docPathname, renderToFpath);
            // console.log(`COPIED ${docPathname} ==> ${renderToFpath}`);
            return `COPY ${docPathname} ==> ${renderToFpath}`;
        } catch(err) {
            console.error(`in copy branch for ${fpath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in copy branch for ${fpath} error=${err.stack ? err.stack : err}`);
        }
    }
};

exports.newrender = async function(config) {
    var filez = [];
    for (let docdir of config.documentDirs) {

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

        var listForDir = await globfs.operateAsync(renderFrom, '**/*', (basedir, fpath, fini) => {
            var doIgnore = false;
            if (renderIgnore) renderIgnore.forEach(ign => {
                log(`CHECK ${fpath} === ${ign}`);
                if (fpath === ign) {
                    doIgnore = true;
                }
            });
            // console.log(`RENDER? ${renderFrom} ${fpath} ${doIgnore}`);
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
        for (let entry in listForDir) {
            if (!entry.ignore) filez.push(entry);
        }
    }

    // The above code put a list of files in the filez array
    // Now the task is to render the files, performing several in parallel

    // TODO implement that loop
    // TODO in mahabhuta, have each mahafunc execute under a nextTick

    return new Promise((resolve, reject) => {
        parallelLimit(filez.map(entry => {
            return function(cb) {
                exports.renderDocument(
                    entry.config,
                    entry.basedir,
                    entry.fpath,
                    entry.config.renderTo,
                    entry.renderToPlus,
                    entry.renderBaseMetadata
                )
                .then((result) => {
                    // log(`render renderDocument ${result}`);
                    cb(undefined, result);
                })
                .catch(err => {
                    console.error(`render renderDocument ${err}`);
                    cb(err);
                });
            };
        }), 
        5, // Concurrency count
        function(err, results) {
            // gets here on final results
            if (err) reject(err);
            else resolve(results);
        });
    });
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
