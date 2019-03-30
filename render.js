'use strict';

const globfs    = require('globfs');
const path      = require('path');
const fs        = require('fs-extra');
const util      = require('util');
// const url       = require('url');
// const cache     = require('./caching');
// const mahabhuta = require('mahabhuta');
// const matter    = require('gray-matter');
const parallelLimit = require('run-parallel-limit');
const data = require('./data');

//////////////////////////////////////////////////////////

exports.partial = async function(config, fname, metadata) {

    if (!fname || typeof fname !== 'string') {
        throw new Error(`partial fname not a string ${util.inspect(fname)}`);
    }

    if (!metadata || typeof metadata !== 'object') {
        throw new Error(`partial metadata not an object ${util.inspect(fname)}`);
    }

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

    var renderer = config.findRendererPath(partialFname);
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

    if (!fname || typeof fname !== 'string') {
        throw new Error(`partial fname not a string ${util.inspect(fname)}`);
    }

    if (!metadata || typeof metadata !== 'object') {
        throw new Error(`partial metadata not an object ${util.inspect(fname)}`);
    }

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

    var renderer = config.findRendererPath(partialFname);
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
        // console.log(`renderDocument ${basedir} ${fpath} ${renderToDir} ${renderToFpath}`);
        await fs.ensureDir(renderToDir);
    } else { return `SKIP DIRECTORY ${docPathname}`; }

    var renderer = config.findRendererPath(fpath);
    if (renderer) {
        // Have to re-do the renderToFpath to give the Renderer a say in the file name
        renderToFpath = path.join(renderTo, renderToPlus, renderer.filePath(fpath));
        // console.log(`ABOUT TO RENDER ${renderer.name} ${docPathname} ==> ${renderToFpath}`);
        try {
            await renderer.renderToFile(basedir, fpath, path.join(renderTo, renderToPlus), renderToPlus, renderBaseMetadata, config);
            // console.log(`RENDERED ${renderer.name} ${docPathname} ==> ${renderToFpath}`);
            const renderEndRendered = new Date();
            data.report(basedir, fpath, path.join(renderTo, renderToPlus), "RENDERED", renderStart);
            return `${renderer.name} ${docPathname} ==> ${renderToFpath} (${(renderEndRendered - renderStart) / 1000} seconds)\n${data.data4file(basedir, fpath)}`;
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
    data.init();
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
                // console.log(`CHECK ${fpath} === ${ign}`);
                if (fpath === ign) {
                    doIgnore = true;
                }
            });
            let stats = await fs.stat(path.join(basedir, fpath));
            if (!stats) doIgnore = true;
            else if (stats.isDirectory()) doIgnore = true;
            else if (fpath.endsWith('.DS_Store')) doIgnore = true;
            // console.log(`RENDER? renderFrom ${renderFrom} basedir ${basedir} fpath ${fpath} doIgnore ${doIgnore}`);
            if (!basedir || !fpath) {
                throw new Error(`RENDER? problem with file name ${util.inspect(basedir)} ${util.inspect(fpath)}`);
            }
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

    let filez2 = filez.filter(entry => {
        if (!entry.result) return false;
        return entry.result.ignore ? false : true;
    });

    for (let entry of filez2) {
        if (!entry.result.basedir || !entry.result.fpath) {
            throw new Error(`RENDER? problem with file name ${util.inspect(entry.result.basedir)} ${util.inspect(entry.result.fpath)}`);
        }
    }

    // The above code put a list of files in the filez array
    // Now the task is to render the files, performing several in parallel

    // TODO implement that loop
    // TODO in mahabhuta, have each mahafunc execute under a nextTick

    var results = await new Promise((resolve, reject) => {
        parallelLimit(filez2.map(entry => {
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

    // data.print();
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
