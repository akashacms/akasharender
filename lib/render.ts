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
import mahabhuta, {
    FilesystemPerfDataStore
} from 'mahabhuta';

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
import decomment from 'decomment';


// For https://github.com/akashacms/akasharender/issues/103
// The idea is normalizing the data returned.  This should
// eliminate the need for the data module.  This should
// improve the analyzeability of data about the rendering process.

export type RenderingResults = {

    vpath?: string;
    renderPath?: string;

    renderFormat: string;

    renderStart?: number;
    renderEnd?: number;

    renderFirstStart?: number;
    renderFirstEnd?: number;

    renderLayoutStart?: number;
    renderLayoutEnd?: number;

    renderMahaStart?: number;
    renderMahaEnd?: number;

    // Elapsed time calculations
    renderFirstElapsed?: number;
    renderLayoutElapsed?: number;
    renderMahaElapsed?: number;
    renderTotalElapsed?: number;

    // True when this document was not re-rendered because the
    // existing output file is newer than the source document and
    // its layout template.  See render and the --force-render-all
    // option.  https://github.com/akashacms/akasharender/issues/61
    skipped?: boolean;

    errors?: Array<Error>;
};

// Collect all required data in an instance of this object.
type RenderingData = {
    config?: Configuration;
    renderer?: Renderer;

    docInfo?: any;

    vpath?: string;
    renderPath?: string;
    mountPoint?: string;
    renderTo?: string;

    renderFirstContext?: RenderingContext;
    renderedFirst?: string;

    layoutFormat?: string;
    renderLayoutContext?: RenderingContext;
    renderedLayout?: string;

    renderMahaContext?: RenderingContext;
    renderedMaha?: string;

    results?: RenderingResults;
};

function createRenderingData(
    config: Configuration,
    docInfo
): RenderingData {
    const ret = <RenderingData>{
        config,

        renderFirstContext: <RenderingContext>{
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
            errors: new Array<Error>()
        }
    };
    if (ret.renderer) {
        ret.results.renderFormat = ret.renderer.renderFormat(ret.renderFirstContext);
    }
    return ret;
}

//////////////////////////////////////////////////////////

function copyProperties(dest: any, src: any, exceptLayout: boolean) {
    for (var yprop in src) {
        if (exceptLayout && yprop === 'layout') continue;
        dest[yprop] = src[yprop];
    }
    return dest;
}

async function renderCSSFile(ret: RenderingData): Promise<RenderingData> {
    try {
        ret.results.renderFormat = 'CSS';
        ret.results.renderFirstStart = performance.now();

        // Render the CSS content
        ret.renderedFirst = await ret.renderer.render(ret.renderFirstContext);
        ret.results.renderFirstEnd = performance.now();

        // Write the rendered CSS to output
        const renderDest = path.join(ret.config.renderTo, ret.docInfo.renderPath);
        await fsp.mkdir(path.dirname(renderDest), { recursive: true });
        await fsp.writeFile(renderDest, ret.renderedFirst, 'utf-8');

        ret.results.renderFirstEnd = performance.now();
        ret.results.renderEnd = performance.now();
    } catch (error) {
        ret.results.errors = ret.results.errors || [];
        ret.results.errors.push(error instanceof Error ? error : new Error(String(error)));
    }
    // Calculate elapsed times
    if (ret.results.renderFirstStart && ret.results.renderFirstEnd) {
        ret.results.renderFirstElapsed = ret.results.renderFirstEnd - ret.results.renderFirstStart;
    }
    ret.results.renderLayoutElapsed = 0;
    ret.results.renderMahaElapsed = 0;
    if (ret.results.renderStart && ret.results.renderEnd) {
        ret.results.renderTotalElapsed = ret.results.renderEnd - ret.results.renderStart;
    }

    // console.log(`renderCSSFile ${ret.vpath}`, ret);

    return ret;
}

async function copyAssetFile(ret: RenderingData): Promise<RenderingData> {
    try {
        ret.results.renderFormat = 'COPY';
        ret.results.renderFirstStart = performance.now();

        // Copy the asset file to output directory
        const renderDest = path.join(ret.config.renderTo, ret.docInfo.renderPath);
        await fsp.mkdir(path.dirname(renderDest), { recursive: true });
        await fsp.copyFile(ret.docInfo.fspath, renderDest);

        ret.results.renderFirstEnd = performance.now();
        ret.results.renderEnd = performance.now();
    } catch (error) {
        ret.results.errors = ret.results.errors || [];
        ret.results.errors.push(error instanceof Error ? error : new Error(String(error)));
    }

    // Calculate elapsed times
    if (ret.results.renderFirstStart && ret.results.renderFirstEnd) {
        ret.results.renderFirstElapsed = ret.results.renderFirstEnd - ret.results.renderFirstStart;
    }
    ret.results.renderLayoutElapsed = 0;
    ret.results.renderMahaElapsed = 0;
    if (ret.results.renderStart && ret.results.renderEnd) {
        ret.results.renderTotalElapsed = ret.results.renderEnd - ret.results.renderStart;
    }

    // Use this to verify error handling
    // ret.results.errors.push(new Error(`Random error`));

    // console.log(`copyAssetFile ${ret.vpath}`, ret);
    return ret;
}


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


/**
 * Render a single document, accounting for the main content,
 * a layout template (if any), and Mahabhuta (if the content
 * output is HTML).  This also handles rendering other types
 * of content such as LESS CSS files.
 *
 * Returns structured RenderingResults data, including precise
 * per-stage elapsed times (via performance.now()) and an errors
 * array, instead of throwing on error.
 *
 * @param config
 * @param docInfo
 * @returns
 */
export async function renderDocument(
    config: Configuration,
    docInfo
): Promise<RenderingResults> {

    // Create the master object to hold all data
    const ret: RenderingData = createRenderingData(config, docInfo);

    // Peel off to mode-specific functions
    if (ret?.renderer?.renderFormat(ret.renderFirstContext) === 'CSS') {
        const cssResult = await renderCSSFile(ret);
        return cssResult.results;
    } else if (!ret.renderer
     || (ret.renderer.renderFormat(ret.renderFirstContext) !== 'HTML')
    ) {
        const assetResult = await copyAssetFile(ret);
        return assetResult.results;
    }

    // Otherwise it is HTML
    // This is where we render the content, then render that
    // into the layout (if one exists), then run Mahabhuta.

    // These functions are duplicates between the first
    // two stages.  Save a couple microseconds by instantiating
    // the functions once.
    const doPartial = (fname, metadata) => {
        return config.akasha.partial(config, fname, metadata);
    };
    const doPartialSync = (fname, metadata) => {
        return config.akasha.partialSync(config, fname, metadata);
    };

    // First Render
    ret.results.renderFirstStart = performance.now();

    try {
        // Add necessary items to the metadata
        ret.renderFirstContext.metadata.config = config;
        ret.renderFirstContext.metadata.partial = doPartial;
        ret.renderFirstContext.metadata.partialSync = doPartialSync;
        ret.renderFirstContext.metadata.akasha = config.akasha;
        ret.renderFirstContext.metadata.plugin = config.plugin;

        // Render the primary content
        ret.renderedFirst = await ret.renderer.render(ret.renderFirstContext);
    } catch (error) {
        ret.results.errors = ret.results.errors || [];
        ret.results.errors.push(error instanceof Error ? error : new Error(String(error)));
        // Use empty string as fallback if rendering fails
        ret.renderedFirst = '';
    }

    ret.results.renderFirstEnd = performance.now();
    // END First Render

    // Layout Render
    ret.results.renderLayoutStart = performance.now();

    if (ret?.docInfo?.metadata?.layout) {
        try {
            const layouts = config.akasha.filecache.layoutsCache;
            // await layouts.isReady();

            let found = await layouts.find(ret.docInfo.metadata.layout);
            if (!found) {
                const error = new Error(`No layout found in ${util.inspect(ret.config.layoutDirs)} for ${ret?.docInfo?.metadata?.layout} in file ${ret.docInfo.vpath}`);
                ret.results.errors = ret.results.errors || [];
                ret.results.errors.push(error);
                // Skip layout rendering, use first render result
                ret.renderedLayout = ret.renderedFirst;
            } else {
                const renderer = config.findRendererPath(
                    ret.docInfo.metadata.layout
                );

                ret.renderLayoutContext = <RenderingContext>{
                    fspath: ret.docInfo.metadata.layout,
                    content: found.docContent,
                    body: found.docBody,
                    metadata: {}
                };

                ret.renderLayoutContext.metadata
                    = copyProperties(
                        ret.renderLayoutContext.metadata,
                        found.metadata,
                        false
                    );
                ret.renderLayoutContext.metadata
                    = copyProperties(
                        ret.renderLayoutContext.metadata,
                        ret.docInfo.metadata,
                        true
                    );

                ret.renderLayoutContext.metadata.content = ret.renderedFirst;

                ret.renderLayoutContext.metadata.config = config;
                ret.renderLayoutContext.metadata.partial = doPartial;
                ret.renderLayoutContext.metadata.partialSync = doPartialSync;
                ret.renderLayoutContext.metadata.akasha = config.akasha;
                ret.renderLayoutContext.metadata.plugin = config.plugin;

                // Render the layout content
                ret.renderedLayout = await renderer.render(ret.renderLayoutContext);
            }
        } catch (e) {
            const error = new Error(`Error rendering ${docInfo.vpath} with ${docInfo?.metadata?.layout} ${e.stack ? e.stack : e}`);
            ret.results.errors = ret.results.errors || [];
            ret.results.errors.push(error);
            // Use first render result as fallback
            ret.renderedLayout = ret.renderedFirst;
        }
    }

    ret.results.renderLayoutEnd = performance.now();
    // END Layout Render

    // Mahabhuta
    ret.results.renderMahaStart = performance.now();

    ret.renderMahaContext = <RenderingContext>{
        fspath: ret.docInfo.metadata.layout,
        content: ret.renderedLayout
            ? ret.renderedLayout : ret.renderedFirst,
        body: ret.renderedLayout
            ? ret.renderedLayout : ret.renderedFirst,
        metadata: {}
    };

    ret.renderMahaContext.metadata
        = copyProperties(
            ret.renderMahaContext.metadata,
            ret.docInfo.metadata,
            false
        );

    try {
        if (ret.docInfo?.metadata?.config?.mahabhutaConfig) {
            mahabhuta.config(ret.docInfo?.metadata?.config?.mahabhutaConfig);
        }
        
        ret.renderedMaha =  await mahabhuta.processAsync(
            ret.renderMahaContext.content, ret.renderMahaContext.metadata,
            ret.config.mahafuncs,
            // For performance collection
            config.perfDataDir 
            ? new FilesystemPerfDataStore(config.perfDataDir)
            : undefined,
            config.perfDataDir 
            ? ret.docInfo.vpath
            : undefined
        );
    } catch (e2) {
        const error = new Error(`Error with Mahabhuta ${ret.docInfo.vpath} with ${ret.docInfo?.metadata?.layout} ${e2.stack ? e2.stack : e2}`);
        ret.results.errors = ret.results.errors || [];
        ret.results.errors.push(error);
        // Use layout result or first render as fallback
        ret.renderedMaha = ret.renderMahaContext.content;
    }

    ret.results.renderMahaEnd = performance.now();
    // END Mahabhuta

    if (config.decomment) {
        ret.renderedMaha = decomment(ret.renderedMaha);
    }

    try {
        const renderDest = path.join(
                    ret.config.renderTo, ret.docInfo.renderPath);
        await fsp.mkdir(path.dirname(renderDest), {
            recursive: true
        });
        await fsp.writeFile(renderDest,
                            ret.renderedMaha, 'utf-8');
    } catch (error) {
        ret.results.errors = ret.results.errors || [];
        ret.results.errors.push(error instanceof Error ? error : new Error(String(error)));
    }

    ret.results.renderEnd = performance.now();

    // Calculate elapsed times
    if (ret.results.renderFirstStart && ret.results.renderFirstEnd) {
        ret.results.renderFirstElapsed = ret.results.renderFirstEnd - ret.results.renderFirstStart;
    }
    if (ret.results.renderLayoutStart && ret.results.renderLayoutEnd) {
        ret.results.renderLayoutElapsed = ret.results.renderLayoutEnd - ret.results.renderLayoutStart;
    }
    if (ret.results.renderMahaStart && ret.results.renderMahaEnd) {
        ret.results.renderMahaElapsed = ret.results.renderMahaEnd - ret.results.renderMahaStart;
    }
    if (ret.results.renderStart && ret.results.renderEnd) {
        ret.results.renderTotalElapsed = ret.results.renderEnd - ret.results.renderStart;
    }

    // console.log(`renderDocument ${ret.vpath}`, ret);
    return ret.results;
}

/**
 * Determine whether a document can be skipped because its existing
 * output file is up-to-date.
 *
 * A document is considered up-to-date when an output file exists and
 * is newer than BOTH:
 *
 *   1. the source document, and
 *   2. the layout template (if any) used by the document.
 *
 * As described in https://github.com/akashacms/akasharender/issues/61
 * it is not feasible to determine the set of partials used by a given
 * document, so changes to partials are NOT detected here.  Use
 * `--force-render-all` (or the `forceRenderAll` option) to force every
 * document to be re-rendered, for example after editing a partial.
 *
 * @param config   AkashaCMS Configuration
 * @param docInfo  The document info object (from documentsCache.find)
 * @returns `true` when rendering can be skipped, `false` otherwise.
 */
export async function isDocumentUpToDate(
    config: Configuration,
    docInfo
): Promise<boolean> {

    // Without a known render path we cannot locate the output file.
    if (!docInfo || !docInfo.renderPath) {
        return false;
    }

    // Only HTML documents pass through the layout/partial pipeline.
    // CSS files and copied assets are cheap and have no layout
    // dependency, so always re-process them to stay correct.
    const renderer = config.findRendererPath(docInfo.vpath);
    if (!renderer) {
        return false;
    }
    const rc = <RenderingContext>{
        fspath: docInfo.vpath,
        content: docInfo.docContent,
        body: docInfo.docBody,
        metadata: docInfo.metadata
    };
    if (renderer.renderFormat(rc) !== 'HTML') {
        return false;
    }

    // Locate the output file and read its modification time.
    let outputMtimeMs;
    try {
        const renderDest = path.join(
            config.renderTo, docInfo.renderPath);
        const outStats = await fsp.stat(renderDest);
        outputMtimeMs = outStats.mtimeMs;
    } catch (err) {
        // No output file (or not readable) => must render.
        return false;
    }

    // The output must be newer than the source document.
    if (typeof docInfo.mtimeMs !== 'number'
     || docInfo.mtimeMs > outputMtimeMs
    ) {
        return false;
    }

    // The output must be newer than the layout template, if any.
    if (docInfo?.metadata?.layout) {
        try {
            const layouts = config.akasha.filecache.layoutsCache;
            const layout = await layouts.find(docInfo.metadata.layout);
            // If the layout cannot be found, fall through to rendering
            // so the existing error reporting in renderDocument runs.
            if (!layout
             || typeof layout.mtimeMs !== 'number'
             || layout.mtimeMs > outputMtimeMs
            ) {
                return false;
            }
        } catch (err) {
            return false;
        }
    }

    return true;
}

/**
 * Options controlling the behavior of render.
 */
export type RenderOptions = {
    /**
     * When true, every document is re-rendered regardless of
     * output file timestamps.  This matches the historical
     * behavior and is exposed on the CLI as `--force-render-all`.
     */
    forceRenderAll?: boolean;
};

/**
 * Render all the documents in a site using renderDocument,
 * limiting the number of simultaneous rendering tasks
 * to the number in config.concurrency.
 * 
 * Returns structured RenderingResults data instead of text strings.
 *
 * Unless `options.forceRenderAll` is set, documents whose output
 * file is newer than both the source document and its layout
 * template are skipped (see isDocumentUpToDate).
 *
 * @param config
 * @param options Optional rendering controls (e.g. forceRenderAll)
 * @returns Array of RenderingResults with performance and error data
 */
export async function render(
    config,
    options?: RenderOptions
): Promise<Array<RenderingResults>> {

    const forceRenderAll = options?.forceRenderAll === true;

    const documents = <DocumentsCache>config.akasha.filecache.documentsCache;
    // await documents.isReady();
    // console.log('CALLING config.hookBeforeSiteRendered');
    await config.hookBeforeSiteRendered();
    
    // 1. Gather list of files from RenderFileCache
    const filez = await documents.paths();
    // console.log(`render filez ${filez.length}`);

    // 2. Exclude any that we want to ignore
    const filez2 = [] as Array<{
        config: Configuration,
        info: Document
    }>;
    // Documents that were skipped because their output is up-to-date.
    // These are reported alongside the rendered documents.
    const skippedResults = [] as Array<RenderingResults>;
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
            const info = await documents.find(entry.vpath);

            // Skip documents whose output file is newer than both the
            // source document and its layout template, unless the
            // caller forced a full re-render.
            // https://github.com/akashacms/akasharender/issues/61
            if (!forceRenderAll
             && await isDocumentUpToDate(config, info)
            ) {
                skippedResults.push(<RenderingResults>{
                    vpath: info.vpath,
                    renderPath: info.renderPath,
                    renderFormat: 'HTML',
                    skipped: true
                });
                continue;
            }

            // The queue is an array of tuples containing the
            // config object and the path string
            filez2.push({
                config: config,
                info: info
            });
        }
    }
    // console.log(`render filez2 after ignore ${filez2.length}`);

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
            : Promise<RenderingResults>
        {
            // console.log(`renderDocumentInQueue ${entry.info.vpath}`);
            try {
                let result = await renderDocument(
                    entry.config, entry.info
                );
                // console.log(`DONE renderDocumentInQueue ${entry.info.vpath}`);
                return result;
            } catch (error) {
                console.log(`ERROR renderDocumentInQueue ${entry.info.vpath}`, error.stack);
                return undefined;
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
    const results: Array<RenderingResults> = [];
    for (let result of waitFor) {
        results.push(await result);
    }

    // Include the documents that were skipped because their
    // output was up-to-date, so callers can report them.
    for (let skipped of skippedResults) {
        results.push(skipped);
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
