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

const path      = require('path');
const fs        = require('fs-extra');
const util      = require('util');
const data      = require('./data');

const cache     = import('./cache/cache-forerunner.mjs');
const filecache = import('./cache/file-cache.mjs');

const fastq     = require('fastq');

//////////////////////////////////////////////////////////

exports.newRenderDocument = async function(config, docInfo) {
    const renderStart = new Date();
    const renderBaseMetadata = docInfo.baseMetadata;
    const stats = await fs.stat(docInfo.fspath);
    if (stats && stats.isFile()) {
    } else { return `SKIP DIRECTORY ${docInfo.vpath}`; }


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
            return `${renderer.name} ${docInfo.vpath} ==> ${docInfo.renderPath} (${(renderEndRendered - renderStart) / 1000} seconds)\n${data.data4file(docInfo.mountPoint, docInfo.vpath)}`;
        } catch (err) {
            console.error(`in renderer branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in renderer branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
        }
    } else {
        // console.log(`COPYING ${docInfo.path} ==> ${renderToFpath}`);
        try {
            const renderToFpath = path.join(config.renderTo, docInfo.renderPath);
            const renderToDir = path.dirname(renderToFpath);
            await fs.ensureDir(renderToDir);
            await fs.copy(docInfo.fspath, renderToFpath);
            // console.log(`COPIED ${docInfo.path} ==> ${renderToFpath}`);
            const renderEndCopied = new Date();
            return `COPY ${docInfo.vpath} ==> ${renderToFpath} (${(renderEndCopied - renderStart) / 1000} seconds)`;
        } catch(err) {
            console.error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
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

    throw new Error(`renderDocument DEPRECATED - use newRenderDocument`);

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

    throw new Error('DEPRECATED');

};

exports.render = async function(config) {

    throw new Error('DEPRECATED');

};
