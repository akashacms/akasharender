/**
 *
 * Copyright 2014-2022 David Herron
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
const fsp       = require('fs/promises');
const util      = require('util');
const data      = require('./data');
const mahabhuta = require('mahabhuta');

const filecache = import('./cache/file-cache-lokijs.mjs');

const fastq     = require('fastq');

//////////////////////////////////////////////////////////

exports.renderDocument = async function(config, docInfo) {
    const renderStart = new Date();
    const renderBaseMetadata = docInfo.baseMetadata;
    // console.log(`newRenderDocument `, docInfo);
    const stats = await fsp.stat(docInfo.fspath);
    if (stats && stats.isFile()) {
    } else { return `SKIP DIRECTORY ${docInfo.vpath}`; }


    const renderer = config.findRendererPath(docInfo.vpath);
    if (renderer) {

        // console.log(`ABOUT TO RENDER ${renderer.name} ${docInfo.vpath} ==> ${renderToFpath}`);
        try {


            // Set up required metadata values

            docInfo.metadata.config      = config;
            docInfo.metadata.partial = config.akasha.partial;
            docInfo.metadata.partialSync = await config.akasha.partialSync;
            docInfo.metadata.akasha = config.akasha;
            docInfo.metadata.plugin = config.plugin;

            // Render the document - output goes to "docrendered"

            let docrendered;
            try {
                docrendered = await renderer.render({
                    fspath: docInfo.fspath,
                    content: docInfo.docContent,
                    body: docInfo.docBody,
                    metadata: docInfo.metadata
                });
            } catch (err) {
                console.error(`Error rendering ${docInfo.vpath} ${(err.stack ? err.stack : err)}`);
                throw new Error(`Error rendering ${docInfo.vpath} ${(err.stack ? err.stack : err)}`);
            }
            data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, 
                                "FIRST RENDER", renderStart);
            
            // There may be a layout, which will be in metadata.layout
            // If so, get the layout file
            // Construct a new metadata -- and it's "content" is
            // set from docrendered
            // Then render the document into "layoutrendered"
            // Otherwise cpy docrendered to layoutrendered

            let layoutrendered;
            if (docInfo.metadata.layout) {

                const layouts = (await filecache).layouts;
                await layouts.isReady();

                let found = await layouts.find(docInfo.metadata.layout);
                if (!found) {
                    throw new Error(`No layout found in ${util.inspect(config.layoutDirs)} for ${docInfo.metadata.layout} in file ${docInfo.vpath}`);
                }

                let layoutmetadata = {};
                for (var yprop in found.metadata) {
                    layoutmetadata[yprop] = found.metadata[yprop];
                }
                for (var yprop in docInfo.metadata) {
                    if (yprop !== 'layout') {
                        layoutmetadata[yprop] = docInfo.metadata[yprop];
                    }
                }
                layoutmetadata.content = docrendered;

                const renderer = config.findRendererPath(docInfo.metadata.layout);

                if (!renderer) {
                    throw new Error(`No renderer for ${metadata.layout} in file ${docinfo.vpath}`);;
                }

                try {
                    layoutrendered = await renderer.render({
                        fspath: found.fspath,
                        content: found.docContent,
                        body: found.docBody,
                        metadata: layoutmetadata
                    });
                } catch (e) {
                    let ee = new Error(`Error rendering ${docInfo.vpath} with ${docInfo.metadata.layout} ${e.stack ? e.stack : e}`);
                    console.error(ee);
                    throw ee;
                }
            } else {
                layoutrendered = docrendered;
            }

            const renderSecondRender = new Date();
            data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, 
                                "SECOND RENDER", renderStart);

            // Next step is to run Mahabhuta on the rendered content
            // Of course, Mahabhuta is not appropriate for everything
            // because not everything is HTML

            const format = renderer.renderFormat({ fspath: docInfo.fspath });
            const doMahabhuta = (format === 'HTML') ? true :false;
            if (doMahabhuta) {

                try {

                    const mahametadata = {};
                    for (var yprop in docInfo.metadata) {
                        mahametadata[yprop] = docInfo.metadata[yprop];
                    }
                    mahametadata.content = docrendered;

                    if (docInfo.metadata.config.mahabhutaConfig) {
                        mahabhuta.config(docInfo.metadata.config.mahabhutaConfig);
                    }
                    // console.log(`mahametadata`, mahametadata);
                    layoutrendered = await mahabhuta.processAsync(
                        layoutrendered, mahametadata, config.mahafuncs
                    );

                    // OLD docrendered = await this.maharun(layoutrendered, docdata, config.mahafuncs);
                } catch (e2) {
                    let eee = new Error(`Error with Mahabhuta ${docInfo.vpath} with ${docInfo.metadata.layout} ${e2.stack ? e2.stack : e2}`);
                    console.error(eee);
                    throw eee;
                }
            }

            data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, 
                "MAHABHUTA", renderStart);

            const renderDest = path.join(config.renderTo, docInfo.renderPath);
            await fsp.mkdir(path.dirname(renderDest), { recursive: true });
            await fsp.writeFile(renderDest, layoutrendered, 'utf-8');

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
            await fsp.mkdir(renderToDir, { recursive: true });
            await fsp.copyFile(docInfo.fspath, renderToFpath);
            // console.log(`COPIED ${docInfo.path} ==> ${renderToFpath}`);
            const renderEndCopied = new Date();
            return `COPY ${docInfo.vpath} ==> ${renderToFpath} (${(renderEndCopied - renderStart) / 1000} seconds)`;
        } catch(err) {
            console.error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
        }
    }
}

exports.render = async function(config) {

    const documents = (await filecache).documents;
    await documents.isReady();
    // console.log('CALLING config.hookBeforeSiteRendered');
    await config.hookBeforeSiteRendered();
    
    // 1. Gather list of files from RenderFileCache
    const filez = documents.paths();
    // console.log(`newerrender filez ${filez.length}`);

    // 2. Exclude any that we want to ignore
    const filez2 = [];
    for (let entry of filez) {
        let include = true;
        // console.log(entry);
        let stats;
        try {
            stats = await fsp.stat(entry.fspath);
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
    // console.log(`newerrender filez2 after ignore ${filez2.length}`);


    // 3. Make a fastq to process using renderDocument, pushing results
    //    to the results array

    // This function is invoked for each entry in the queue.
    // It handles rendering the queue
    // The queue has config objects and path strings which is
    // exactly what's required by newRenderDocument
    async function renderDocumentInQueue(entry) {
        // console.log(`renderDocumentInQueue ${entry.info.vpath}`);
        try {
            let result = await exports.renderDocument(entry.config, entry.info);
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
        // console.log('Invoking hookSiteRendered');
        await config.hookSiteRendered();
    } catch (e) {
        console.error(e.stack);
        throw new Error(`hookSiteRendered failed because ${e}`);
    }

    // 5. return results
    return results;
};
