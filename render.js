/**
 *
 * Copyright 2014-2019 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

 'use strict';

const globfs    = require('globfs');
const path      = require('path');
const fs        = require('fs-extra');
const util      = require('util');
// const url       = require('url');
// const cache     = require('./caching');
// const mahabhuta = require('mahabhuta');
// const matter    = require('gray-matter');
const data = require('./data');

const cache = import('./cache/cache-forerunner.mjs');
const filecache = import('./cache/file-cache.mjs');

const fastq = require('fastq');

//////////////////////////////////////////////////////////

/*
exports.partial = async function(config, fname, metadata) {

    if (!fname || typeof fname !== 'string') {
        throw new Error(`partial fname not a string ${util.inspect(fname)}`);
    }

    /* if (!metadata || typeof metadata !== 'object') {
        throw new Error(`partial metadata not an object ${util.inspect(fname)}`);
    } *--/

    Simply need to call filecache.documents.find(fname)
    But this is an async operation because of how filecache is loaded

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

        // Some renderers (Nunjuks) require that metadata.config
        // point to the config object.  This block of code
        // duplicates the metadata object, then sets the
        // config field in the duplicate, passing that to the partial.
        let mdata = {};
        let prop;

        for (prop in metadata) {
            mdata[prop] = metadata[prop];
        }
        mdata.config = config;
        return renderer.render(partialText, mdata);
    } else if (partialFname.endsWith('.html') || partialFname.endsWith('.xhtml')) {
        // console.log(`partial reading file ${partialFname}`);
        return fs.readFile(partialFname, 'utf8');
    } else {
        throw new Error(`renderPartial no Renderer found for ${fname} - ${partialFname}`);
    }
    // This has been moved into Mahabhuta
    // return mahaPartial.doPartialAsync(partial, attrs);
}; */

/* exports.partialSync = function(config, fname, metadata) {

    if (!fname || typeof fname !== 'string') {
        throw new Error(`partial fname not a string ${util.inspect(fname)}`);
    }

    /* if (!metadata || typeof metadata !== 'object') {
        throw new Error(`partial metadata not an object ${util.inspect(fname)}`);
    } * --/

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
        // Some renderers (Nunjuks) require that metadata.config
        // point to the config object.  This block of code
        // duplicates the metadata object, then sets the
        // config field in the duplicate, passing that to the partial.
        let mdata = {};
        let prop;

        for (prop in metadata) {
            mdata[prop] = metadata[prop];
        }
        mdata.config = config;
        return renderer.renderSync(partialText, mdata);
    } else if (partialFname.endsWith('.html') || partialFname.endsWith('.xhtml')) {
        return fs.readFileSync(partialFname, 'utf8');
    } else {
        throw new Error(`renderPartial no Renderer found for ${fname} - ${partialFname}`);
    }
    // This has been moved into Mahabhuta
    // return mahaPartial.doPartialSync(fname, metadata);
}; */

//////////////////////////////////////////////////////////

exports.newRenderDocument = async function(config, docInfo) {
    const renderStart = new Date();
    const renderBaseMetadata = docInfo.baseMetadata;
    const stats = await fs.stat(docInfo.fspath);
    let renderToDir;
    if (stats && stats.isFile()) {
        renderToDir = path.dirname(docInfo.vpath);
        // console.log(`renderDocument ${basedir} ${fpath} ${renderToDir} ${renderToFpath}`);
        await fs.ensureDir(renderToDir);
    } else { return `SKIP DIRECTORY ${docInfo.vpath}`; }

    const renderToFpath = path.join(config.renderTo, docInfo.renderPath);

    const renderer = config.findRendererPath(docInfo.vpath);
    if (renderer) {

        // console.log(`ABOUT TO RENDER ${renderer.name} ${docInfo.vpath} ==> ${renderToFpath}`);
        try {
            /*  OLD VERSION
            await renderer.renderToFile(basedir, fpath, path.join(renderTo, renderToPlus), renderToPlus, renderBaseMetadata, config);
            */
            await renderer.newRenderToFile(config, docInfo);

            // console.log(`RENDERED ${renderer.name} ${docInfo.path} ==> ${renderToFpath}`);
            const renderEndRendered = new Date();
            data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, "RENDERED", renderStart);
            return `${renderer.name} ${docInfo.vpath} ==> ${renderToFpath} (${(renderEndRendered - renderStart) / 1000} seconds)\n${data.data4file(docInfo.mountPoint, docInfo.vpath)}`;
        } catch (err) {
            console.error(`in renderer branch for ${docInfo.vpath} to ${renderToFpath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in renderer branch for ${docInfo.vpath} to ${renderToFpath} error=${err.stack ? err.stack : err}`);
        }
    } else {
        // console.log(`COPYING ${docInfo.path} ==> ${renderToFpath}`);
        try {
            await fs.copy(docInfo.fspath, renderToFpath);
            // console.log(`COPIED ${docInfo.path} ==> ${renderToFpath}`);
            const renderEndCopied = new Date();
            return `COPY ${docInfo.vpath} ==> ${renderToFpath} (${(renderEndCopied - renderStart) / 1000} seconds)`;
        } catch(err) {
            console.error(`in copy branch for ${docInfo.vpath} to ${renderToFpath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in copy branch for ${docInfo.vpath} to ${renderToFpath} error=${err.stack ? err.stack : err}`);
        }
    }
}

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

exports.newerrender = async function(config) {

    const documents = (await filecache).documents;
    await documents.isReady();
    // console.log('CALLING config.hookBeforeSiteRendered');
    await config.hookBeforeSiteRendered();
    
    // 1. Gather list of files from RenderFileCache
    const filez = documents.paths();

    // 2. Exclude any that we want to ignore
    const filez2 = [];
    for (let entry of filez) {
        let include = true;
        // console.log(entry);
        let stats;
        try {
            stats = await fs.stat(entry.fspath);
        } catch (err) { stats = undefined; }
        if (!entry) include = false;
        else if (!stats || stats.isDirectory()) include = false;
        // This should arise using an ignore clause
        // else if (path.basename(entry.vpath) === '.DS_Store') include = false;
        // else if (path.basename(entry.vpath) === '.placeholder') include = false;

        if (include) {
            // The queue is an array of tuples containing the
            // config object and the path string
            filez2.push({
                config: config,
                info: documents.find(entry.vpath)
            });
        }
    }
    

    // 3. Make a fastq to process using renderDocument, pushing results
    //    to the results array

    // This function is invoked for each entry in the queue.
    // It handles rendering the queue
    // The queue has config objects and path strings which is
    // exactly what's required by newRenderDocument
    async function renderDocumentInQueue(entry) {
        // console.log(`renderDocumentInQueue ${entry.info.vpath}`);
        try {
            let result = await exports.newRenderDocument(entry.config, entry.info);
            // console.log(`DONE renderDocumentInQueue ${entry.info.vpath}`, result);
            return { result };
        } catch (error) {
            // console.log(`ERROR renderDocumentInQueue ${entry.info.vpath}`, error.stack);
            return { error };
        }
    }

    // This sets up the queue processor, using the function just above
    // The concurrency setting lets us process documents in parallel
    // Possibly this will speed things up.
    const queue = fastq.promise(renderDocumentInQueue,
                                config.concurrency);

    // queue.push returns a Promise that's fulfilled when the task finishes
    // Hence we can use Promise.all to wait for all tasks to finish
    // The fastq API doesn't seem to offer a method to wait on
    // all tasks to finish
    const waitFor = [];
    for (let entry of filez2) {
        waitFor.push(queue.push(entry));
    }

    // Because we've pushed Promise objects into waitFor, this
    // automatically waits until all tasks are finished
    const results = [];
    for (let result of waitFor) {
        results.push(await result);
    }
    // await Promise.all(waitFor);

    // This appears to be another way to wait until all tasks are finished
    // await new Promise((resolve, reject) => {
    //    queue.drain = function() {
    //        resolve();
    //    }
    // });

    // 4. Invoke hookSiteRendered

    try {
        await config.hookSiteRendered();
    } catch (e) {
        console.error(e.stack);
        throw new Error(`hookSiteRendered failed because ${e}`);
    }

    // 5. return results
    return results;
};

exports.newrender = async function(config) {
    data.init();
    // console.log('CALLING config.hookBeforeSiteRendered');
    await config.hookBeforeSiteRendered();

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

    // console.log(filez2);

    let results = [];

    for (let entry of filez2) {

        // console.log(`newrender RENDER ${path.basename(entry.result.basedir)} ${entry.result.fpath}`);

        await new Promise((resolve, reject) => {
            exports.renderDocument(
                entry.result.config,
                entry.result.basedir,
                entry.result.fpath,
                entry.result.renderTo,
                entry.result.renderToPlus,
                entry.result.renderBaseMetadata
            )
            .then((result) => {
                // console.log(`render renderDocument ${result}`);
                results.push({ result });
                resolve();
            })
            .catch(err => {
                // console.error(`render renderDocument ${err} ${err.stack}`);
                results.push({ error: err });
                resolve();
            });
        });
    }

    /*
     * For some reason this hangs.
     * It's preferable to do this since we get parallel
     * rendering happening, and it should be shorter time.
     * 
    var results = await new Promise((resolve, reject) => {
        parallelLimit(filez2.map(entry => {
            return function(cb) {
                console.log(`newrender RENDER ${path.basename(entry.result.basedir)} ${entry.result.fpath}`);
                exports.renderDocument(
                    entry.result.config,
                    entry.result.basedir,
                    entry.result.fpath,
                    entry.result.renderTo,
                    entry.result.renderToPlus,
                    entry.result.renderBaseMetadata
                )
                .then((result) => {
                    console.log(`render renderDocument ${result}`);
                    cb(undefined, { result });
                })
                .catch(err => {
                    console.error(`render renderDocument ${err} ${err.stack}`);
                    cb(undefined, { error: err });
                });
            };
        }), 
        config.concurrency, // Concurrency count
        function(err, results) {
            console.log(`render END parallelLimit`);
            // gets here on final results
            if (err) reject(err);
            else resolve(results);
        });
    });
    */

    // console.log('newrender CALLING config.hookSiteRendered');
    try {
        await config.hookSiteRendered();
    } catch (e) {
        throw new Error(`hookSiteRendered failed because ${e}`);
    }


    // console.log('newrender END');
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
        var hookResults = undefined;
        try {
            hookResults = await config.hookSiteRendered();
        } catch (e) {
            throw new Error(`hookSiteRendered failed because ${e}`);
        }

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
