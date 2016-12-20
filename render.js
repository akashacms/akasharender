'use strict';

const globfs    = require('globfs');
const path      = require('path');
const fs        = require('fs-extra-promise');
const util      = require('util');
const async     = require('async');
const co        = require('co');
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
exports.registerRenderer(require('./render-ejs'));
exports.registerRenderer(require('./render-cssless'));

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
exports.renderDocument = co.wrap(function* (config, basedir, fpath, renderTo, renderToPlus, renderBaseMetadata) {

    var docPathname = path.join(basedir, fpath);
    var renderToFpath = path.join(renderTo, renderToPlus, fpath);

    var stats = yield fs.statAsync(docPathname);

    if (stats && stats.isFile()) {
        var renderToDir = path.dirname(renderToFpath);
        log(`renderDocument ${basedir} ${fpath} ${renderToDir} ${renderToFpath}`);
        yield fs.ensureDirAsync(renderToDir);
    } else { return `SKIP DIRECTORY ${docPathname}`; }

    var renderer = exports.findRendererPath(fpath);
    if (renderer) {
        // Have to re-do the renderToFpath to give the Renderer a say in the file name
        renderToFpath = path.join(renderTo, renderToPlus, renderer.filePath(fpath));
        log(`${renderer.name} ${docPathname} ==> ${renderToFpath}`);
        try {
            yield renderer.renderToFile(basedir, fpath, path.join(renderTo, renderToPlus), renderToPlus, renderBaseMetadata, config)
            return `${renderer.name} ${docPathname} ==> ${renderToFpath}`;
        } catch (err) {
            error(`in renderer branch for ${fpath} error=${err.stack}`);
            throw new Error(`in renderer branch for ${fpath} error=${err.stack}`);
        }
    } else {
        log(`COPY ${docPathname} ==> ${renderToFpath}`);
        try {
            yield fs.copyAsync(docPathname, renderToFpath)
            return `COPY ${docPathname} ==> ${renderToFpath}`;
        } catch(err) {
            error(`in copy branch for ${fpath} error=${err.stack}`);
            throw new Error(`in copy branch for ${fpath} error=${err.stack}`);
        }
    }
});

//exports.render = function(docdirs, layoutDirs, partialDirs, mahafuncs, renderTo) {
exports.render = co.wrap(function* (config) {

    // util.log(util.inspect(config.mahafuncs));
    // log('render');
    // log(`render ${util.inspect(config.documentDirs)}`);

    try {
        var renderResults = yield Promise.all(config.documentDirs.map(docdir => {
            var renderToPlus = "";
            var renderFrom = docdir;
            var renderIgnore;
            var renderBaseMetadata = {};
            if (typeof docdir === 'object') {
                renderFrom = docdir.src;
                renderToPlus = docdir.dest;
                renderIgnore = docdir.ignore;
                if (docdir.baseMetadata) renderBaseMetadata = docdir.baseMetadata;
            }
            // log(`******* render.render ${renderFrom} ${config.renderTo} ${renderToPlus} ${renderIgnore}`);
            log(`RENDER DIRECTORY ${renderFrom} ==> ${renderToPlus}`);
            return globfs.operateAsync(renderFrom, '**/*', (basedir, fpath, fini) => {
                var doIgnore = false;
                if (renderIgnore) renderIgnore.forEach(ign => {
                    log(`CHECK ${fpath} === ${ign}`);
                    if (fpath === ign) {
                        doIgnore = true;
                    }
                });
                log(`RENDER? ${renderFrom} ${fpath} ${doIgnore}`);
                if (!doIgnore)
                    exports.renderDocument(
                        config,
                        basedir,
                        fpath,
                        config.renderTo,
                        renderToPlus,
                        renderBaseMetadata
                    )
                    .then((result) => {
                        log(`render renderDocument ${result}`);
                        fini(undefined, result);
                    })
                    .catch(err => {
                        error(`render renderDocument ${err}`);
                        fini(err);
                    });
                else fini(undefined, `IGNORED ${fpath}`);
            });
        }));

        var hookResults = yield config.hookSiteRendered();

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
        console.error(`render FAIL because of ${e}`);
        throw e;
    }
});
