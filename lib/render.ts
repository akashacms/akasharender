/**
 *
 * Copyright 2014-2025 David Herron
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

import path from 'node:path';
import { promises as fsp } from 'node:fs';
import util from 'node:util';
import * as data from './data.js';
import mahabhuta from 'mahabhuta';

import fastq from 'fastq';
import type { queueAsPromised } from "fastq";
import { Configuration } from './index.js';
import { Renderer, RenderingContext } from '@akashacms/renderers';
import {
    DocumentsCache
} from './cache/cache-sqlite.js';
import {
    Document
} from './cache/schema.js';
import { performance } from 'node:perf_hooks';

// For https://github.com/akashacms/akasharender/issues/103
// The idea is normalizing the data returned.  This should
// eliminate the need for the data module.  This should
// improve the analyzeability of data about the rendering process.

type RenderingResults = {

    vpath?: string;
    renderPath?: string;

    renderFormat: string;

    renderStart?: number;

    renderFirstStart?: number;
    renderFirstEnd?: number;

    renderLayoutStart?: number;
    renderLayoutEnd?: number;

    renderMahaStart?: number;
    renderMahaEnd?: number;
};

// Collect all required data in an instance of this object.
type RenderingData = {
    config?: Configuration;
    context?: RenderingContext;
    renderer?: Renderer;

    docInfo?: any;

    vpath?: string;
    renderPath?: string;
    mountPoint?: string;
    renderTo?: string;

    renderedFirst?: string;

    layoutFormat?: string;
    renderedLayout?: string;

    results?: RenderingResults;
};

function createRenderingData(
    config: Configuration,
    docInfo
) {
    const ret = <RenderingData>{
        config,

        context: <RenderingContext>{
            fspath: docInfo.vpath,
            content: docInfo.docContent,
            body: docInfo.docBody,
            metadata: docInfo.metadata
        },

        renderer: config.findRendererPath(
                        docInfo.vpath
        ),

        docInfo,
        vpath: docInfo.vpath,
        renderPath: docInfo.renderPath,
        mountPoint: docInfo.mountPoint,
        renderTo: config.renderTo,

        results: <RenderingResults>{
            vpath: docInfo.vpath,
            renderPath: docInfo.renderPath,
            renderStart: performance.now(),
        }
    };
    if (ret.renderer) {
        ret.results.renderFormat = ret.renderer.renderFormat(ret.context);
    }
    return ret;
}

//////////////////////////////////////////////////////////

/**
 * The core part of rendering content using a renderer.
 * This function looks for the renderer, and if none is
 * found it simply returns.  It then does a little setup
 * to the metadata object, and calls the render function
 *
 * @param config - AkashaCMS Configuration
 * @param rc - RenderingContext for use with Renderers
 * @returns 
 */
export async function renderContent(
    config: Configuration,
    rc: RenderingContext
)
    // The return is a simple object
    // containing useful data
    : Promise<{
        rendererName?: string,
        format?: string,
        rendered: string
    }>
{
    // console.log(`renderContent `, rc);
    const renderer = config.findRendererPath(
        rc.fspath
    );
    if (!renderer) {
        return {
            rendererName: undefined,
            format: undefined,
            rendered: rc.body
        };
    }

    // Add necessary items to the metadata
    rc.metadata.config = config;
    rc.metadata.partial = (fname, metadata) => {
        return config.akasha.partial(config, fname, metadata);
    };
    rc.metadata.partialSync = (fname, metadata) => {
        return config.akasha.partialSync(config, fname, metadata);
    };
    rc.metadata.akasha = config.akasha;
    rc.metadata.plugin = config.plugin;

    // Render the primary content
    let docrendered = await renderer.render(rc);

    // console.log(`renderContent rendered=`, docrendered);
    return {
        rendererName: renderer.name,
        format: renderer.renderFormat(rc),
        rendered: docrendered
    };
}

// This function and the next exist solely to
// simplify renderDocument.

async function writeCSStoOutput(
    config: Configuration,
    docInfo,
    docRendered,
    renderStart: Date
) {

    const renderToFpath = path.join(
                config.renderTo, docInfo.renderPath);
    const renderToDir = path.dirname(renderToFpath);
    await fsp.mkdir(renderToDir, {
                recursive: true
            });
    await fsp.writeFile(renderToFpath, docRendered, 'utf8');
    const renderEndRendered = new Date();
    await data.report(
        docInfo.mountPoint, docInfo.vpath,
        config.renderTo,
        "RENDERED", renderStart);
    return `CSS ${docInfo.vpath} ==> ${docInfo.renderPath} (${(renderEndRendered.valueOf() - renderStart.valueOf()) / 1000} seconds)\n${await data.data4file(docInfo.mountPoint, docInfo.vpath)}`;

}

async function copyAssetToOutput(
    config: Configuration,
    docInfo,
    docRendered,
    renderStart: Date
) {

    const renderToFpath = path.join(
                config.renderTo, docInfo.renderPath);
    const renderToDir = path.dirname(renderToFpath);
    await fsp.mkdir(renderToDir, {
                recursive: true
            });
    await fsp.copyFile(docInfo.fspath,
                        renderToFpath);
    // console.log(`COPIED ${docInfo.path} ==> ${renderToFpath}`);
    const renderEndCopied = new Date();
    return `COPY ${docInfo.vpath} ==> ${renderToFpath} (${(renderEndCopied.valueOf() - renderStart.valueOf()) / 1000} seconds)`;
}

/**
 * Render a document, accounting for the main content,
 * a layout template (if any), and Mahabhuta (if the content
 * output is HTML).  This also handles rendering other types
 * of content such as LESS CSS files.
 *
 * @param config 
 * @param docInfo 
 * @returns 
 */
export async function renderDocument(
    config: Configuration,
    docInfo
): Promise<string>
{
    const renderStart = new Date();

    // Render the main content

    if (typeof docInfo.docContent !== 'string'
     || typeof docInfo.docBody !== 'string'
    ) {
        // console.warn(`No content to render for `, docInfo);
    }

    const rc = <RenderingContext>{
        fspath: docInfo.vpath,
        content: docInfo.docContent,
        body: docInfo.docBody,
        metadata: docInfo.metadata
    };

    // console.log(`renderDocument context= ${rc.fspath}`, rc);

    let docFormat;      // Knowing the format 
    let docRendered;
    try {
        const result = await renderContent(config, rc);
        docFormat = result.format;
        docRendered = result.rendered;
    } catch (err) {
        console.error(`Error rendering ${docInfo.vpath} ${(err.stack ? err.stack : err)}`);
        throw new Error(`Error rendering ${docInfo.vpath} ${(err.stack ? err.stack : err)}`);
    }
    // console.log(`renderDocument ${docFormat} ${docInfo.vpath} rendered=`, docRendered);
    await data.report(docInfo.mountPoint, 
                      docInfo.vpath,
                      config.renderTo, 
                     "FIRST RENDER", renderStart);

    // Handle these cases up front so that the remaining
    // code can be cleaner and focus on HTML layout rendering.

    if (docFormat === 'CSS') {
        try {
            return writeCSStoOutput(config, docInfo, docRendered, renderStart);
        } catch(err) {
            console.error(`in RENDER CSS branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in RENDER CSS branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
        }
    }

    if (docFormat !== 'HTML') {
        try {
            copyAssetToOutput(config, docInfo, docRendered, renderStart);
        } catch(err) {
            console.error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
        }
    }

    // Render the main content into a layout template,
    // if one is specified

    let layoutFormat;
    let layoutRendered;
    let result;
    // console.log(`renderDocument layout ${docInfo?.metadata?.layout} docMetadata ${util.inspect(docInfo.docMetadata)} metadata ${util.inspect(docInfo.metadata)}`);
    if (docInfo?.metadata?.layout) {

        const layouts = config.akasha.filecache.layoutsCache;
        // await layouts.isReady();

        let found = await layouts.find(docInfo.metadata.layout);
        if (!found) {
            throw new Error(`No layout found in ${util.inspect(config.layoutDirs)} for ${docInfo?.metadata?.layout} in file ${docInfo.vpath}`);
        }

        const rcLayout = <RenderingContext>{
            fspath: docInfo.metadata.layout,
            content: found.docContent,
            body: found.docBody,
            metadata: {}
        };
        for (var yprop in found.metadata) {
            rcLayout.metadata[yprop] = found.metadata[yprop];
        }
        for (var yprop in docInfo.metadata) {
            if (yprop !== 'layout') {
                rcLayout.metadata[yprop] = docInfo.metadata[yprop];
            }
        }
        rcLayout.metadata.content = docRendered;

        try {
            result
                = await renderContent(config, rcLayout);
            layoutFormat = result.format;
            layoutRendered = result.rendered;
        } catch (e) {
            let ee = new Error(`Error rendering ${docInfo.vpath} with ${docInfo?.metadata?.layout} ${e.stack ? e.stack : e}`);
            console.error(ee);
            throw ee;
        }
    } else {
        layoutFormat = docFormat;
        layoutRendered = docRendered;
    }

    // console.log(`renderDocument ${docInfo.vpath} after layout render format ${layoutFormat} `, result);

    const renderSecondRender = new Date();
    await data.report(docInfo.mountPoint,
                      docInfo.vpath, config.renderTo, 
                      "SECOND RENDER",
                      renderStart);

    
    // Next step is to run Mahabhuta on the rendered content
    // Of course, Mahabhuta is not appropriate for everything
    // because not everything is HTML

    try {

        const mahametadata: any = {};
        for (var yprop in docInfo.metadata) {
            mahametadata[yprop] = docInfo.metadata[yprop];
        }
        mahametadata.content = docRendered;

        if (docInfo?.metadata?.config?.mahabhutaConfig) {
            mahabhuta.config(docInfo?.metadata?.config?.mahabhutaConfig);
        }
        // console.log(`mahametadata`, mahametadata);
        layoutRendered = await mahabhuta.processAsync(
            layoutRendered, mahametadata,
            config.mahafuncs
        );

        // OLD docrendered = await this.maharun(layoutrendered, docdata, config.mahafuncs);
    } catch (e2) {
        let eee = new Error(`Error with Mahabhuta ${docInfo.vpath} with ${docInfo?.metadata?.layout} ${e2.stack ? e2.stack : e2}`);
        console.error(eee);
        throw eee;
    }

    await data.report(docInfo.mountPoint, 
                        docInfo.vpath,
                        config.renderTo, 
                        "MAHABHUTA", renderStart);

    const renderDest = path.join(
                config.renderTo, docInfo.renderPath);
    await fsp.mkdir(path.dirname(renderDest), {
        recursive: true
    });
    await fsp.writeFile(renderDest,
                        layoutRendered, 'utf-8');

    // console.log(`RENDERED ${renderer.name} ${docInfo.path} ==> ${renderToFpath}`);
    const renderEndRendered = new Date();
    await data.report(
        docInfo.mountPoint, docInfo.vpath,
        config.renderTo,
        "RENDERED", renderStart);
    return `${layoutFormat} ${docInfo.vpath} ==> ${docInfo.renderPath} (${(renderEndRendered.valueOf() - renderStart.valueOf()) / 1000} seconds)\n${await data.data4file(docInfo.mountPoint, docInfo.vpath)}`;

}

/**
 * Render all the documents in a site, limiting
 * the number of simultaneous rendering tasks
 * to the number in config.concurrency.
 *
 * @param config
 * @returns
 */
export async function render(config) {

    const documents = <DocumentsCache>config.akasha.filecache.documentsCache;
    // await documents.isReady();
    // console.log('CALLING config.hookBeforeSiteRendered');
    await config.hookBeforeSiteRendered();
    
    // 1. Gather list of files from RenderFileCache
    const filez = await documents.paths();
    // console.log(`newerrender filez ${filez.length}`);

    // 2. Exclude any that we want to ignore
    const filez2 = [] as Array<{
        config: Configuration,
        info: Document
    }>;
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
                info: await documents.find(entry.vpath)
            });
        }
    }
    // console.log(`newerrender filez2 after ignore ${filez2.length}`);


    // 3. Make a fastq to process using renderDocument,
    //    pushing results to the results array

    // This sets up the queue processor
    // The concurrency setting lets us process documents
    // in parallel while limiting total impact.
    const queue: queueAsPromised<{
        config: Configuration,
        info: Document
    }> = fastq.promise(

        // This function is invoked for each entry in the
        // queue. It handles rendering the queue
        // The queue has config objects and path strings
        // which is exactly what's required by
        // renderDocument
        async function renderDocumentInQueue(entry)
            : Promise<{ result?: any; error?: any; }>
        {
            // console.log(`renderDocumentInQueue ${entry.info.vpath}`);
            try {
                let result = await renderDocument(
                    entry.config, entry.info
                );
                // console.log(`DONE renderDocumentInQueue ${entry.info.vpath}`, result);
                return { result };
            } catch (error) {
                // console.log(`ERROR renderDocumentInQueue ${entry.info.vpath}`, error.stack);
                return { error };
            }
        },
        config.concurrency);

    // queue.push returns a Promise that's fulfilled when
    // the task finishes.
    // Hence waitFor is an array of Promises.
    const waitFor = [];
    for (let entry of filez2) {
        waitFor.push(queue.push(entry));
    }

    // This automatically waits for all those
    // Promises to resolve, while making the results
    // array contain results.
    const results = [];
    for (let result of waitFor) {
        results.push(await result);
    }

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
