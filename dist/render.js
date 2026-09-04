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
import mahabhuta, { FilesystemPerfDataStore } from 'mahabhuta';
import fastq from 'fastq';
import { performance } from 'node:perf_hooks';
import decomment from 'decomment';
function createRenderingData(config, docInfo) {
    const ret = {
        config,
        renderFirstContext: {
            fspath: docInfo.vpath,
            content: docInfo.docContent,
            body: docInfo.docBody,
            metadata: docInfo.metadata
        },
        renderer: config.findRendererPath(docInfo.vpath),
        docInfo,
        vpath: docInfo.vpath,
        renderPath: docInfo.renderPath,
        mountPoint: docInfo.mountPoint,
        renderTo: config.renderTo,
        results: {
            vpath: docInfo.vpath,
            renderPath: docInfo.renderPath,
            renderStart: performance.now(),
            errors: new Array()
        }
    };
    if (ret.renderer) {
        ret.results.renderFormat = ret.renderer.renderFormat(ret.renderFirstContext);
    }
    return ret;
}
//////////////////////////////////////////////////////////
function copyProperties(dest, src, exceptLayout) {
    for (var yprop in src) {
        if (exceptLayout && yprop === 'layout')
            continue;
        dest[yprop] = src[yprop];
    }
    return dest;
}
async function renderCSSFile(ret) {
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
    }
    catch (error) {
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
async function copyAssetFile(ret) {
    try {
        ret.results.renderFormat = 'COPY';
        ret.results.renderFirstStart = performance.now();
        // Copy the asset file to output directory
        const renderDest = path.join(ret.config.renderTo, ret.docInfo.renderPath);
        await fsp.mkdir(path.dirname(renderDest), { recursive: true });
        await fsp.copyFile(ret.docInfo.fspath, renderDest);
        ret.results.renderFirstEnd = performance.now();
        ret.results.renderEnd = performance.now();
    }
    catch (error) {
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
export async function renderContent(config, rc) {
    // console.log(`renderContent `, rc);
    const renderer = config.findRendererPath(rc.fspath);
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
export async function renderDocument(config, docInfo) {
    // Create the master object to hold all data
    const ret = createRenderingData(config, docInfo);
    // Peel off to mode-specific functions
    if (ret?.renderer?.renderFormat(ret.renderFirstContext) === 'CSS') {
        const cssResult = await renderCSSFile(ret);
        return cssResult.results;
    }
    else if (!ret.renderer
        || (ret.renderer.renderFormat(ret.renderFirstContext) !== 'HTML')) {
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
    }
    catch (error) {
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
            }
            else {
                const renderer = config.findRendererPath(ret.docInfo.metadata.layout);
                ret.renderLayoutContext = {
                    fspath: ret.docInfo.metadata.layout,
                    content: found.docContent,
                    body: found.docBody,
                    metadata: {}
                };
                ret.renderLayoutContext.metadata
                    = copyProperties(ret.renderLayoutContext.metadata, found.metadata, false);
                ret.renderLayoutContext.metadata
                    = copyProperties(ret.renderLayoutContext.metadata, ret.docInfo.metadata, true);
                ret.renderLayoutContext.metadata.content = ret.renderedFirst;
                ret.renderLayoutContext.metadata.config = config;
                ret.renderLayoutContext.metadata.partial = doPartial;
                ret.renderLayoutContext.metadata.partialSync = doPartialSync;
                ret.renderLayoutContext.metadata.akasha = config.akasha;
                ret.renderLayoutContext.metadata.plugin = config.plugin;
                // Render the layout content
                ret.renderedLayout = await renderer.render(ret.renderLayoutContext);
            }
        }
        catch (e) {
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
    ret.renderMahaContext = {
        fspath: ret.docInfo.metadata.layout,
        content: ret.renderedLayout
            ? ret.renderedLayout : ret.renderedFirst,
        body: ret.renderedLayout
            ? ret.renderedLayout : ret.renderedFirst,
        metadata: {}
    };
    ret.renderMahaContext.metadata
        = copyProperties(ret.renderMahaContext.metadata, ret.docInfo.metadata, false);
    try {
        if (ret.docInfo?.metadata?.config?.mahabhutaConfig) {
            mahabhuta.config(ret.docInfo?.metadata?.config?.mahabhutaConfig);
        }
        ret.renderedMaha = await mahabhuta.processAsync(ret.renderMahaContext.content, ret.renderMahaContext.metadata, ret.config.mahafuncs, 
        // For performance collection
        config.perfDataDir
            ? new FilesystemPerfDataStore(config.perfDataDir)
            : undefined, config.perfDataDir
            ? ret.docInfo.vpath
            : undefined);
    }
    catch (e2) {
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
        const renderDest = path.join(ret.config.renderTo, ret.docInfo.renderPath);
        await fsp.mkdir(path.dirname(renderDest), {
            recursive: true
        });
        await fsp.writeFile(renderDest, ret.renderedMaha, 'utf-8');
    }
    catch (error) {
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
export async function isDocumentUpToDate(config, docInfo) {
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
    const rc = {
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
        const renderDest = path.join(config.renderTo, docInfo.renderPath);
        const outStats = await fsp.stat(renderDest);
        outputMtimeMs = outStats.mtimeMs;
    }
    catch (err) {
        // No output file (or not readable) => must render.
        return false;
    }
    // The output must be newer than the source document.
    if (typeof docInfo.mtimeMs !== 'number'
        || docInfo.mtimeMs > outputMtimeMs) {
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
                || layout.mtimeMs > outputMtimeMs) {
                return false;
            }
        }
        catch (err) {
            return false;
        }
    }
    return true;
}
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
export async function render(config, options) {
    const forceRenderAll = options?.forceRenderAll === true;
    const documents = config.akasha.filecache.documentsCache;
    // await documents.isReady();
    // console.log('CALLING config.hookBeforeSiteRendered');
    await config.hookBeforeSiteRendered();
    // 1. Gather list of files from RenderFileCache
    const filez = await documents.paths();
    // console.log(`render filez ${filez.length}`);
    // 2. Exclude any that we want to ignore
    const filez2 = [];
    // Documents that were skipped because their output is up-to-date.
    // These are reported alongside the rendered documents.
    const skippedResults = [];
    for (let entry of filez) {
        let include = true;
        // console.log(entry);
        let stats;
        try {
            stats = await fsp.stat(entry.fspath);
        }
        catch (err) {
            stats = undefined;
        }
        if (!entry)
            include = false;
        else if (!stats || stats.isDirectory())
            include = false;
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
                && await isDocumentUpToDate(config, info)) {
                skippedResults.push({
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
    const queue = fastq.promise(
    // This function is invoked for each entry in the
    // queue. It handles rendering the queue
    // The queue has config objects and path strings
    // which is exactly what's required by
    // renderDocument
    async function renderDocumentInQueue(entry) {
        // console.log(`renderDocumentInQueue ${entry.info.vpath}`);
        try {
            let result = await renderDocument(entry.config, entry.info);
            // console.log(`DONE renderDocumentInQueue ${entry.info.vpath}`);
            return result;
        }
        catch (error) {
            console.log(`ERROR renderDocumentInQueue ${entry.info.vpath}`, error.stack);
            return undefined;
        }
    }, config.concurrency);
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
    // Include the documents that were skipped because their
    // output was up-to-date, so callers can report them.
    for (let skipped of skippedResults) {
        results.push(skipped);
    }
    // 4. Invoke hookSiteRendered
    try {
        // console.log('Invoking hookSiteRendered');
        await config.hookSiteRendered();
    }
    catch (e) {
        console.error(e.stack);
        throw new Error(`hookSiteRendered failed because ${e}`);
    }
    // 5. return results
    return results;
}
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRTdCLE9BQU8sU0FBUyxFQUFFLEVBQ2QsdUJBQXVCLEVBQzFCLE1BQU0sV0FBVyxDQUFDO0FBRW5CLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQVUxQixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDOUMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBbUVsQyxTQUFTLG1CQUFtQixDQUN4QixNQUFxQixFQUNyQixPQUFPO0lBRVAsTUFBTSxHQUFHLEdBQWtCO1FBQ3ZCLE1BQU07UUFFTixrQkFBa0IsRUFBb0I7WUFDbEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1lBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsVUFBVTtZQUMzQixJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU87WUFDckIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1NBQzdCO1FBRUQsUUFBUSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FDakIsT0FBTyxDQUFDLEtBQUssQ0FDNUI7UUFFRCxPQUFPO1FBQ1AsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3BCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtRQUM5QixVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVU7UUFDOUIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1FBRXpCLE9BQU8sRUFBb0I7WUFDdkIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1lBQ3BCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtZQUM5QixXQUFXLEVBQUUsV0FBVyxDQUFDLEdBQUcsRUFBRTtZQUM5QixNQUFNLEVBQUUsSUFBSSxLQUFLLEVBQVM7U0FDN0I7S0FDSixDQUFDO0lBQ0YsSUFBSSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDZixHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNqRixDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQsMERBQTBEO0FBRTFELFNBQVMsY0FBYyxDQUFDLElBQVMsRUFBRSxHQUFRLEVBQUUsWUFBcUI7SUFDOUQsS0FBSyxJQUFJLEtBQUssSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNwQixJQUFJLFlBQVksSUFBSSxLQUFLLEtBQUssUUFBUTtZQUFFLFNBQVM7UUFDakQsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUVELEtBQUssVUFBVSxhQUFhLENBQUMsR0FBa0I7SUFDM0MsSUFBSSxDQUFDO1FBQ0QsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQ2pDLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRWpELHlCQUF5QjtRQUN6QixHQUFHLENBQUMsYUFBYSxHQUFHLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDdEUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRS9DLG1DQUFtQztRQUNuQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUUsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMvRCxNQUFNLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFNUQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQy9DLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUM5QyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUM5QyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFDRCwwQkFBMEI7SUFDMUIsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLGdCQUFnQixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0QsR0FBRyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDO0lBQy9GLENBQUM7SUFDRCxHQUFHLENBQUMsT0FBTyxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUNwQyxHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztJQUNsQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDbkQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQztJQUNyRixDQUFDO0lBRUQsa0RBQWtEO0lBRWxELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQztBQUVELEtBQUssVUFBVSxhQUFhLENBQUMsR0FBa0I7SUFDM0MsSUFBSSxDQUFDO1FBQ0QsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDO1FBQ2xDLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRWpELDBDQUEwQztRQUMxQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDMUUsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMvRCxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFbkQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQy9DLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUM5QyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUM5QyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFRCwwQkFBMEI7SUFDMUIsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLGdCQUFnQixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0QsR0FBRyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDO0lBQy9GLENBQUM7SUFDRCxHQUFHLENBQUMsT0FBTyxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUNwQyxHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztJQUNsQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDbkQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQztJQUNyRixDQUFDO0lBRUQsb0NBQW9DO0lBQ3BDLHNEQUFzRDtJQUV0RCxrREFBa0Q7SUFDbEQsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBR0Q7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxhQUFhLENBQy9CLE1BQXFCLEVBQ3JCLEVBQW9CO0lBVXBCLHFDQUFxQztJQUNyQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQ3BDLEVBQUUsQ0FBQyxNQUFNLENBQ1osQ0FBQztJQUNGLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNaLE9BQU87WUFDSCxZQUFZLEVBQUUsU0FBUztZQUN2QixNQUFNLEVBQUUsU0FBUztZQUNqQixRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUk7U0FDcEIsQ0FBQztJQUNOLENBQUM7SUFFRCxzQ0FBc0M7SUFDdEMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQzVCLEVBQUUsQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO1FBQ3RDLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUM7SUFDRixFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUMxQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDOUQsQ0FBQyxDQUFDO0lBQ0YsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNuQyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBRW5DLDZCQUE2QjtJQUM3QixJQUFJLFdBQVcsR0FBRyxNQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFNUMsdURBQXVEO0lBQ3ZELE9BQU87UUFDSCxZQUFZLEVBQUUsUUFBUSxDQUFDLElBQUk7UUFDM0IsTUFBTSxFQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1FBQ2pDLFFBQVEsRUFBRSxXQUFXO0tBQ3hCLENBQUM7QUFDTixDQUFDO0FBR0Q7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sQ0FBQyxLQUFLLFVBQVUsY0FBYyxDQUNoQyxNQUFxQixFQUNyQixPQUFPO0lBR1AsNENBQTRDO0lBQzVDLE1BQU0sR0FBRyxHQUFrQixtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFaEUsc0NBQXNDO0lBQ3RDLElBQUksR0FBRyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEtBQUssS0FBSyxFQUFFLENBQUM7UUFDaEUsTUFBTSxTQUFTLEdBQUcsTUFBTSxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0MsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDO0lBQzdCLENBQUM7U0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVE7V0FDcEIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsS0FBSyxNQUFNLENBQUMsRUFDaEUsQ0FBQztRQUNDLE1BQU0sV0FBVyxHQUFHLE1BQU0sYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLE9BQU8sV0FBVyxDQUFDLE9BQU8sQ0FBQztJQUMvQixDQUFDO0lBRUQsdUJBQXVCO0lBQ3ZCLHdEQUF3RDtJQUN4RCx1REFBdUQ7SUFFdkQsbURBQW1EO0lBQ25ELDJEQUEyRDtJQUMzRCxzQkFBc0I7SUFDdEIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDbEMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQztJQUNGLE1BQU0sYUFBYSxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO1FBQ3RDLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM5RCxDQUFDLENBQUM7SUFFRixlQUFlO0lBQ2YsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFakQsSUFBSSxDQUFDO1FBQ0Qsc0NBQXNDO1FBQ3RDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNoRCxHQUFHLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7UUFDcEQsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsYUFBYSxDQUFDO1FBQzVELEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDdkQsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUV2RCw2QkFBNkI7UUFDN0IsR0FBRyxDQUFDLGFBQWEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkYsa0RBQWtEO1FBQ2xELEdBQUcsQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFFRCxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDL0MsbUJBQW1CO0lBRW5CLGdCQUFnQjtJQUNoQixHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUVsRCxJQUFJLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDO1FBQ2pDLElBQUksQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztZQUNyRCwyQkFBMkI7WUFFM0IsSUFBSSxLQUFLLEdBQUcsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDVCxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEdBQUcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sWUFBWSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ3hKLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztnQkFDOUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMvQixpREFBaUQ7Z0JBQ2pELEdBQUcsQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQztZQUMzQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ0osTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUNwQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQzlCLENBQUM7Z0JBRUYsR0FBRyxDQUFDLG1CQUFtQixHQUFxQjtvQkFDeEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU07b0JBQ25DLE9BQU8sRUFBRSxLQUFLLENBQUMsVUFBVTtvQkFDekIsSUFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPO29CQUNuQixRQUFRLEVBQUUsRUFBRTtpQkFDZixDQUFDO2dCQUVGLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRO3NCQUMxQixjQUFjLENBQ1osR0FBRyxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFDaEMsS0FBSyxDQUFDLFFBQVEsRUFDZCxLQUFLLENBQ1IsQ0FBQztnQkFDTixHQUFHLENBQUMsbUJBQW1CLENBQUMsUUFBUTtzQkFDMUIsY0FBYyxDQUNaLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQ2hDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUNwQixJQUFJLENBQ1AsQ0FBQztnQkFFTixHQUFHLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDO2dCQUU3RCxHQUFHLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7Z0JBQ2pELEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQztnQkFDckQsR0FBRyxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsYUFBYSxDQUFDO2dCQUM3RCxHQUFHLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUN4RCxHQUFHLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUV4RCw0QkFBNEI7Z0JBQzVCLEdBQUcsQ0FBQyxjQUFjLEdBQUcsTUFBTSxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3hFLENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLG1CQUFtQixPQUFPLENBQUMsS0FBSyxTQUFTLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdkgsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDO1lBQzlDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQixzQ0FBc0M7WUFDdEMsR0FBRyxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDO1FBQzNDLENBQUM7SUFDTCxDQUFDO0lBRUQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2hELG9CQUFvQjtJQUVwQixZQUFZO0lBQ1osR0FBRyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRWhELEdBQUcsQ0FBQyxpQkFBaUIsR0FBcUI7UUFDdEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU07UUFDbkMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxjQUFjO1lBQ3ZCLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYTtRQUM1QyxJQUFJLEVBQUUsR0FBRyxDQUFDLGNBQWM7WUFDcEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhO1FBQzVDLFFBQVEsRUFBRSxFQUFFO0tBQ2YsQ0FBQztJQUVGLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRO1VBQ3hCLGNBQWMsQ0FDWixHQUFHLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFDcEIsS0FBSyxDQUNSLENBQUM7SUFFTixJQUFJLENBQUM7UUFDRCxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsQ0FBQztZQUNqRCxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBRUQsR0FBRyxDQUFDLFlBQVksR0FBSSxNQUFNLFNBQVMsQ0FBQyxZQUFZLENBQzVDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFDN0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTO1FBQ3BCLDZCQUE2QjtRQUM3QixNQUFNLENBQUMsV0FBVztZQUNsQixDQUFDLENBQUMsSUFBSSx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxTQUFTLEVBQ1gsTUFBTSxDQUFDLFdBQVc7WUFDbEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSztZQUNuQixDQUFDLENBQUMsU0FBUyxDQUNkLENBQUM7SUFDTixDQUFDO0lBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztRQUNWLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLHdCQUF3QixHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2SSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDOUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9CLGdEQUFnRDtRQUNoRCxHQUFHLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7SUFDckQsQ0FBQztJQUVELEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUM5QyxnQkFBZ0I7SUFFaEIsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDbkIsR0FBRyxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCxJQUFJLENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUNoQixHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3RDLFNBQVMsRUFBRSxJQUFJO1NBQ2xCLENBQUMsQ0FBQztRQUNILE1BQU0sR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQ1YsR0FBRyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUM5QyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFRCxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFMUMsMEJBQTBCO0lBQzFCLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdELEdBQUcsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztJQUMvRixDQUFDO0lBQ0QsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDL0QsR0FBRyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO0lBQ2xHLENBQUM7SUFDRCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDM0QsR0FBRyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQztJQUM1RixDQUFDO0lBQ0QsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25ELEdBQUcsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7SUFDckYsQ0FBQztJQUVELG1EQUFtRDtJQUNuRCxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDdkIsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxrQkFBa0IsQ0FDcEMsTUFBcUIsRUFDckIsT0FBTztJQUdQLGdFQUFnRTtJQUNoRSxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxnRUFBZ0U7SUFDaEUsMkRBQTJEO0lBQzNELHlEQUF5RDtJQUN6RCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNaLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxNQUFNLEVBQUUsR0FBcUI7UUFDekIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsVUFBVTtRQUMzQixJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU87UUFDckIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO0tBQzdCLENBQUM7SUFDRixJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEtBQUssTUFBTSxFQUFFLENBQUM7UUFDdkMsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELHlEQUF5RDtJQUN6RCxJQUFJLGFBQWEsQ0FBQztJQUNsQixJQUFJLENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUN4QixNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6QyxNQUFNLFFBQVEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUMsYUFBYSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUM7SUFDckMsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDWCxtREFBbUQ7UUFDbkQsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELHFEQUFxRDtJQUNyRCxJQUFJLE9BQU8sT0FBTyxDQUFDLE9BQU8sS0FBSyxRQUFRO1dBQ25DLE9BQU8sQ0FBQyxPQUFPLEdBQUcsYUFBYSxFQUNqQyxDQUFDO1FBQ0MsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELDZEQUE2RDtJQUM3RCxJQUFJLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUM7UUFDNUIsSUFBSSxDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO1lBQ3JELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNELDJEQUEyRDtZQUMzRCwwREFBMEQ7WUFDMUQsSUFBSSxDQUFDLE1BQU07bUJBQ1AsT0FBTyxNQUFNLENBQUMsT0FBTyxLQUFLLFFBQVE7bUJBQ2xDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsYUFBYSxFQUNoQyxDQUFDO2dCQUNDLE9BQU8sS0FBSyxDQUFDO1lBQ2pCLENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7SUFDTCxDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQWNEOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxNQUFNLENBQ3hCLE1BQU0sRUFDTixPQUF1QjtJQUd2QixNQUFNLGNBQWMsR0FBRyxPQUFPLEVBQUUsY0FBYyxLQUFLLElBQUksQ0FBQztJQUV4RCxNQUFNLFNBQVMsR0FBbUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDO0lBQ3pFLDZCQUE2QjtJQUM3Qix3REFBd0Q7SUFDeEQsTUFBTSxNQUFNLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztJQUV0QywrQ0FBK0M7SUFDL0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdEMsK0NBQStDO0lBRS9DLHdDQUF3QztJQUN4QyxNQUFNLE1BQU0sR0FBRyxFQUdiLENBQUM7SUFDSCxrRUFBa0U7SUFDbEUsdURBQXVEO0lBQ3ZELE1BQU0sY0FBYyxHQUFHLEVBQTZCLENBQUM7SUFDckQsS0FBSyxJQUFJLEtBQUssSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUN0QixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDbkIsc0JBQXNCO1FBQ3RCLElBQUksS0FBSyxDQUFDO1FBQ1YsSUFBSSxDQUFDO1lBQ0QsS0FBSyxHQUFHLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1FBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsS0FBSztZQUFFLE9BQU8sR0FBRyxLQUFLLENBQUM7YUFDdkIsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQUUsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUN4RCwyQ0FBMkM7UUFDM0Msd0VBQXdFO1FBQ3hFLDJFQUEyRTtRQUUzRSxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ1YsTUFBTSxJQUFJLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUvQywwREFBMEQ7WUFDMUQsc0RBQXNEO1lBQ3RELGtDQUFrQztZQUNsQyxzREFBc0Q7WUFDdEQsSUFBSSxDQUFDLGNBQWM7bUJBQ2YsTUFBTSxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQ3hDLENBQUM7Z0JBQ0MsY0FBYyxDQUFDLElBQUksQ0FBbUI7b0JBQ2xDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztvQkFDakIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO29CQUMzQixZQUFZLEVBQUUsTUFBTTtvQkFDcEIsT0FBTyxFQUFFLElBQUk7aUJBQ2hCLENBQUMsQ0FBQztnQkFDSCxTQUFTO1lBQ2IsQ0FBQztZQUVELGlEQUFpRDtZQUNqRCxvQ0FBb0M7WUFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDUixNQUFNLEVBQUUsTUFBTTtnQkFDZCxJQUFJLEVBQUUsSUFBSTthQUNiLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDTCxDQUFDO0lBQ0QsOERBQThEO0lBRTlELG1EQUFtRDtJQUNuRCwwQ0FBMEM7SUFFMUMsbUNBQW1DO0lBQ25DLG9EQUFvRDtJQUNwRCwyQ0FBMkM7SUFDM0MsTUFBTSxLQUFLLEdBR04sS0FBSyxDQUFDLE9BQU87SUFFZCxpREFBaUQ7SUFDakQsd0NBQXdDO0lBQ3hDLGdEQUFnRDtJQUNoRCxzQ0FBc0M7SUFDdEMsaUJBQWlCO0lBQ2pCLEtBQUssVUFBVSxxQkFBcUIsQ0FBQyxLQUFLO1FBR3RDLDREQUE0RDtRQUM1RCxJQUFJLENBQUM7WUFDRCxJQUFJLE1BQU0sR0FBRyxNQUFNLGNBQWMsQ0FDN0IsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUMzQixDQUFDO1lBQ0YsaUVBQWlFO1lBQ2pFLE9BQU8sTUFBTSxDQUFDO1FBQ2xCLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUUsT0FBTyxTQUFTLENBQUM7UUFDckIsQ0FBQztJQUNMLENBQUMsRUFDRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFeEIscURBQXFEO0lBQ3JELHFCQUFxQjtJQUNyQix5Q0FBeUM7SUFDekMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLEtBQUssSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7UUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxnREFBZ0Q7SUFDaEQseUJBQXlCO0lBQ3pCLE1BQU0sT0FBTyxHQUE0QixFQUFFLENBQUM7SUFDNUMsS0FBSyxJQUFJLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUN6QixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sTUFBTSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELHdEQUF3RDtJQUN4RCxxREFBcUQ7SUFDckQsS0FBSyxJQUFJLE9BQU8sSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUNqQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCw2QkFBNkI7SUFFN0IsSUFBSSxDQUFDO1FBQ0QsNENBQTRDO1FBQzVDLE1BQU0sTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDcEMsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxvQkFBb0I7SUFDcEIsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQztBQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCAqIGFzIGRhdGEgZnJvbSAnLi9kYXRhLmpzJztcbmltcG9ydCBtYWhhYmh1dGEsIHtcbiAgICBGaWxlc3lzdGVtUGVyZkRhdGFTdG9yZVxufSBmcm9tICdtYWhhYmh1dGEnO1xuXG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHR5cGUgeyBxdWV1ZUFzUHJvbWlzZWQgfSBmcm9tIFwiZmFzdHFcIjtcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24gfSBmcm9tICcuL2luZGV4LmpzJztcbmltcG9ydCB7IFJlbmRlcmVyLCBSZW5kZXJpbmdDb250ZXh0IH0gZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0IHtcbiAgICBEb2N1bWVudHNDYWNoZVxufSBmcm9tICcuL2NhY2hlL2NhY2hlLXNxbGl0ZS5qcyc7XG5pbXBvcnQge1xuICAgIERvY3VtZW50XG59IGZyb20gJy4vY2FjaGUvc2NoZW1hLmpzJztcbmltcG9ydCB7IHBlcmZvcm1hbmNlIH0gZnJvbSAnbm9kZTpwZXJmX2hvb2tzJztcbmltcG9ydCBkZWNvbW1lbnQgZnJvbSAnZGVjb21tZW50JztcblxuXG4vLyBGb3IgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzLzEwM1xuLy8gVGhlIGlkZWEgaXMgbm9ybWFsaXppbmcgdGhlIGRhdGEgcmV0dXJuZWQuICBUaGlzIHNob3VsZFxuLy8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB0aGUgZGF0YSBtb2R1bGUuICBUaGlzIHNob3VsZFxuLy8gaW1wcm92ZSB0aGUgYW5hbHl6ZWFiaWxpdHkgb2YgZGF0YSBhYm91dCB0aGUgcmVuZGVyaW5nIHByb2Nlc3MuXG5cbmV4cG9ydCB0eXBlIFJlbmRlcmluZ1Jlc3VsdHMgPSB7XG5cbiAgICB2cGF0aD86IHN0cmluZztcbiAgICByZW5kZXJQYXRoPzogc3RyaW5nO1xuXG4gICAgcmVuZGVyRm9ybWF0OiBzdHJpbmc7XG5cbiAgICByZW5kZXJTdGFydD86IG51bWJlcjtcbiAgICByZW5kZXJFbmQ/OiBudW1iZXI7XG5cbiAgICByZW5kZXJGaXJzdFN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlckZpcnN0RW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyTGF5b3V0U3RhcnQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTGF5b3V0RW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyTWFoYVN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlck1haGFFbmQ/OiBudW1iZXI7XG5cbiAgICAvLyBFbGFwc2VkIHRpbWUgY2FsY3VsYXRpb25zXG4gICAgcmVuZGVyRmlyc3RFbGFwc2VkPzogbnVtYmVyO1xuICAgIHJlbmRlckxheW91dEVsYXBzZWQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTWFoYUVsYXBzZWQ/OiBudW1iZXI7XG4gICAgcmVuZGVyVG90YWxFbGFwc2VkPzogbnVtYmVyO1xuXG4gICAgLy8gVHJ1ZSB3aGVuIHRoaXMgZG9jdW1lbnQgd2FzIG5vdCByZS1yZW5kZXJlZCBiZWNhdXNlIHRoZVxuICAgIC8vIGV4aXN0aW5nIG91dHB1dCBmaWxlIGlzIG5ld2VyIHRoYW4gdGhlIHNvdXJjZSBkb2N1bWVudCBhbmRcbiAgICAvLyBpdHMgbGF5b3V0IHRlbXBsYXRlLiAgU2VlIHJlbmRlciBhbmQgdGhlIC0tZm9yY2UtcmVuZGVyLWFsbFxuICAgIC8vIG9wdGlvbi4gIGh0dHBzOi8vZ2l0aHViLmNvbS9ha2FzaGFjbXMvYWthc2hhcmVuZGVyL2lzc3Vlcy82MVxuICAgIHNraXBwZWQ/OiBib29sZWFuO1xuXG4gICAgZXJyb3JzPzogQXJyYXk8RXJyb3I+O1xufTtcblxuLy8gQ29sbGVjdCBhbGwgcmVxdWlyZWQgZGF0YSBpbiBhbiBpbnN0YW5jZSBvZiB0aGlzIG9iamVjdC5cbnR5cGUgUmVuZGVyaW5nRGF0YSA9IHtcbiAgICBjb25maWc/OiBDb25maWd1cmF0aW9uO1xuICAgIHJlbmRlcmVyPzogUmVuZGVyZXI7XG5cbiAgICBkb2NJbmZvPzogYW55O1xuXG4gICAgdnBhdGg/OiBzdHJpbmc7XG4gICAgcmVuZGVyUGF0aD86IHN0cmluZztcbiAgICBtb3VudFBvaW50Pzogc3RyaW5nO1xuICAgIHJlbmRlclRvPzogc3RyaW5nO1xuXG4gICAgcmVuZGVyRmlyc3RDb250ZXh0PzogUmVuZGVyaW5nQ29udGV4dDtcbiAgICByZW5kZXJlZEZpcnN0Pzogc3RyaW5nO1xuXG4gICAgbGF5b3V0Rm9ybWF0Pzogc3RyaW5nO1xuICAgIHJlbmRlckxheW91dENvbnRleHQ/OiBSZW5kZXJpbmdDb250ZXh0O1xuICAgIHJlbmRlcmVkTGF5b3V0Pzogc3RyaW5nO1xuXG4gICAgcmVuZGVyTWFoYUNvbnRleHQ/OiBSZW5kZXJpbmdDb250ZXh0O1xuICAgIHJlbmRlcmVkTWFoYT86IHN0cmluZztcblxuICAgIHJlc3VsdHM/OiBSZW5kZXJpbmdSZXN1bHRzO1xufTtcblxuZnVuY3Rpb24gY3JlYXRlUmVuZGVyaW5nRGF0YShcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mb1xuKTogUmVuZGVyaW5nRGF0YSB7XG4gICAgY29uc3QgcmV0ID0gPFJlbmRlcmluZ0RhdGE+e1xuICAgICAgICBjb25maWcsXG5cbiAgICAgICAgcmVuZGVyRmlyc3RDb250ZXh0OiA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgICAgICBmc3BhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBkb2NJbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogZG9jSW5mby5tZXRhZGF0YVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlcmVyOiBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGhcbiAgICAgICAgKSxcblxuICAgICAgICBkb2NJbmZvLFxuICAgICAgICB2cGF0aDogZG9jSW5mby52cGF0aCxcbiAgICAgICAgcmVuZGVyUGF0aDogZG9jSW5mby5yZW5kZXJQYXRoLFxuICAgICAgICBtb3VudFBvaW50OiBkb2NJbmZvLm1vdW50UG9pbnQsXG4gICAgICAgIHJlbmRlclRvOiBjb25maWcucmVuZGVyVG8sXG5cbiAgICAgICAgcmVzdWx0czogPFJlbmRlcmluZ1Jlc3VsdHM+e1xuICAgICAgICAgICAgdnBhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBkb2NJbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJTdGFydDogcGVyZm9ybWFuY2Uubm93KCksXG4gICAgICAgICAgICBlcnJvcnM6IG5ldyBBcnJheTxFcnJvcj4oKVxuICAgICAgICB9XG4gICAgfTtcbiAgICBpZiAocmV0LnJlbmRlcmVyKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZvcm1hdCA9IHJldC5yZW5kZXJlci5yZW5kZXJGb3JtYXQocmV0LnJlbmRlckZpcnN0Q29udGV4dCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gY29weVByb3BlcnRpZXMoZGVzdDogYW55LCBzcmM6IGFueSwgZXhjZXB0TGF5b3V0OiBib29sZWFuKSB7XG4gICAgZm9yICh2YXIgeXByb3AgaW4gc3JjKSB7XG4gICAgICAgIGlmIChleGNlcHRMYXlvdXQgJiYgeXByb3AgPT09ICdsYXlvdXQnKSBjb250aW51ZTtcbiAgICAgICAgZGVzdFt5cHJvcF0gPSBzcmNbeXByb3BdO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVuZGVyQ1NTRmlsZShyZXQ6IFJlbmRlcmluZ0RhdGEpOiBQcm9taXNlPFJlbmRlcmluZ0RhdGE+IHtcbiAgICB0cnkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGb3JtYXQgPSAnQ1NTJztcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgICAgIC8vIFJlbmRlciB0aGUgQ1NTIGNvbnRlbnRcbiAgICAgICAgcmV0LnJlbmRlcmVkRmlyc3QgPSBhd2FpdCByZXQucmVuZGVyZXIucmVuZGVyKHJldC5yZW5kZXJGaXJzdENvbnRleHQpO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgICAgIC8vIFdyaXRlIHRoZSByZW5kZXJlZCBDU1MgdG8gb3V0cHV0XG4gICAgICAgIGNvbnN0IHJlbmRlckRlc3QgPSBwYXRoLmpvaW4ocmV0LmNvbmZpZy5yZW5kZXJUbywgcmV0LmRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlckRlc3QsIHJldC5yZW5kZXJlZEZpcnN0LCAndXRmLTgnKTtcblxuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKSk7XG4gICAgfVxuICAgIC8vIENhbGN1bGF0ZSBlbGFwc2VkIHRpbWVzXG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0O1xuICAgIH1cbiAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbGFwc2VkID0gMDtcbiAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhRWxhcHNlZCA9IDA7XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJUb3RhbEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJTdGFydDtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ1NTRmlsZSAke3JldC52cGF0aH1gLCByZXQpO1xuXG4gICAgcmV0dXJuIHJldDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weUFzc2V0RmlsZShyZXQ6IFJlbmRlcmluZ0RhdGEpOiBQcm9taXNlPFJlbmRlcmluZ0RhdGE+IHtcbiAgICB0cnkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGb3JtYXQgPSAnQ09QWSc7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgICAgICAvLyBDb3B5IHRoZSBhc3NldCBmaWxlIHRvIG91dHB1dCBkaXJlY3RvcnlcbiAgICAgICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihyZXQuY29uZmlnLnJlbmRlclRvLCByZXQuZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJEZXN0KSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGF3YWl0IGZzcC5jb3B5RmlsZShyZXQuZG9jSW5mby5mc3BhdGgsIHJlbmRlckRlc3QpO1xuXG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpKTtcbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgZWxhcHNlZCB0aW1lc1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydDtcbiAgICB9XG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RWxhcHNlZCA9IDA7XG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVsYXBzZWQgPSAwO1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyVG90YWxFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyU3RhcnQ7XG4gICAgfVxuXG4gICAgLy8gVXNlIHRoaXMgdG8gdmVyaWZ5IGVycm9yIGhhbmRsaW5nXG4gICAgLy8gcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2gobmV3IEVycm9yKGBSYW5kb20gZXJyb3JgKSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgY29weUFzc2V0RmlsZSAke3JldC52cGF0aH1gLCByZXQpO1xuICAgIHJldHVybiByZXQ7XG59XG5cblxuLyoqXG4gKiBUaGUgY29yZSBwYXJ0IG9mIHJlbmRlcmluZyBjb250ZW50IHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBUaGlzIGZ1bmN0aW9uIGxvb2tzIGZvciB0aGUgcmVuZGVyZXIsIGFuZCBpZiBub25lIGlzXG4gKiBmb3VuZCBpdCBzaW1wbHkgcmV0dXJucy4gIEl0IHRoZW4gZG9lcyBhIGxpdHRsZSBzZXR1cFxuICogdG8gdGhlIG1ldGFkYXRhIG9iamVjdCwgYW5kIGNhbGxzIHRoZSByZW5kZXIgZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0gY29uZmlnIC0gQWthc2hhQ01TIENvbmZpZ3VyYXRpb25cbiAqIEBwYXJhbSByYyAtIFJlbmRlcmluZ0NvbnRleHQgZm9yIHVzZSB3aXRoIFJlbmRlcmVyc1xuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJDb250ZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICByYzogUmVuZGVyaW5nQ29udGV4dFxuKVxuICAgIC8vIFRoZSByZXR1cm4gaXMgYSBzaW1wbGUgb2JqZWN0XG4gICAgLy8gY29udGFpbmluZyB1c2VmdWwgZGF0YVxuICAgIDogUHJvbWlzZTx7XG4gICAgICAgIHJlbmRlcmVyTmFtZT86IHN0cmluZyxcbiAgICAgICAgZm9ybWF0Pzogc3RyaW5nLFxuICAgICAgICByZW5kZXJlZDogc3RyaW5nXG4gICAgfT5cbntcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ29udGVudCBgLCByYyk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgcmMuZnNwYXRoXG4gICAgKTtcbiAgICBpZiAoIXJlbmRlcmVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZW5kZXJlck5hbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGZvcm1hdDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcmVuZGVyZWQ6IHJjLmJvZHlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBBZGQgbmVjZXNzYXJ5IGl0ZW1zIHRvIHRoZSBtZXRhZGF0YVxuICAgIHJjLm1ldGFkYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIHJjLm1ldGFkYXRhLnBhcnRpYWxTeW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgIHJjLm1ldGFkYXRhLnBsdWdpbiA9IGNvbmZpZy5wbHVnaW47XG5cbiAgICAvLyBSZW5kZXIgdGhlIHByaW1hcnkgY29udGVudFxuICAgIGxldCBkb2NyZW5kZXJlZCA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihyYyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ29udGVudCByZW5kZXJlZD1gLCBkb2NyZW5kZXJlZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyZXJOYW1lOiByZW5kZXJlci5uYW1lLFxuICAgICAgICBmb3JtYXQ6IHJlbmRlcmVyLnJlbmRlckZvcm1hdChyYyksXG4gICAgICAgIHJlbmRlcmVkOiBkb2NyZW5kZXJlZFxuICAgIH07XG59XG5cblxuLyoqXG4gKiBSZW5kZXIgYSBzaW5nbGUgZG9jdW1lbnQsIGFjY291bnRpbmcgZm9yIHRoZSBtYWluIGNvbnRlbnQsXG4gKiBhIGxheW91dCB0ZW1wbGF0ZSAoaWYgYW55KSwgYW5kIE1haGFiaHV0YSAoaWYgdGhlIGNvbnRlbnRcbiAqIG91dHB1dCBpcyBIVE1MKS4gIFRoaXMgYWxzbyBoYW5kbGVzIHJlbmRlcmluZyBvdGhlciB0eXBlc1xuICogb2YgY29udGVudCBzdWNoIGFzIExFU1MgQ1NTIGZpbGVzLlxuICpcbiAqIFJldHVybnMgc3RydWN0dXJlZCBSZW5kZXJpbmdSZXN1bHRzIGRhdGEsIGluY2x1ZGluZyBwcmVjaXNlXG4gKiBwZXItc3RhZ2UgZWxhcHNlZCB0aW1lcyAodmlhIHBlcmZvcm1hbmNlLm5vdygpKSBhbmQgYW4gZXJyb3JzXG4gKiBhcnJheSwgaW5zdGVhZCBvZiB0aHJvd2luZyBvbiBlcnJvci5cbiAqXG4gKiBAcGFyYW0gY29uZmlnXG4gKiBAcGFyYW0gZG9jSW5mb1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvXG4pOiBQcm9taXNlPFJlbmRlcmluZ1Jlc3VsdHM+IHtcblxuICAgIC8vIENyZWF0ZSB0aGUgbWFzdGVyIG9iamVjdCB0byBob2xkIGFsbCBkYXRhXG4gICAgY29uc3QgcmV0OiBSZW5kZXJpbmdEYXRhID0gY3JlYXRlUmVuZGVyaW5nRGF0YShjb25maWcsIGRvY0luZm8pO1xuXG4gICAgLy8gUGVlbCBvZmYgdG8gbW9kZS1zcGVjaWZpYyBmdW5jdGlvbnNcbiAgICBpZiAocmV0Py5yZW5kZXJlcj8ucmVuZGVyRm9ybWF0KHJldC5yZW5kZXJGaXJzdENvbnRleHQpID09PSAnQ1NTJykge1xuICAgICAgICBjb25zdCBjc3NSZXN1bHQgPSBhd2FpdCByZW5kZXJDU1NGaWxlKHJldCk7XG4gICAgICAgIHJldHVybiBjc3NSZXN1bHQucmVzdWx0cztcbiAgICB9IGVsc2UgaWYgKCFyZXQucmVuZGVyZXJcbiAgICAgfHwgKHJldC5yZW5kZXJlci5yZW5kZXJGb3JtYXQocmV0LnJlbmRlckZpcnN0Q29udGV4dCkgIT09ICdIVE1MJylcbiAgICApIHtcbiAgICAgICAgY29uc3QgYXNzZXRSZXN1bHQgPSBhd2FpdCBjb3B5QXNzZXRGaWxlKHJldCk7XG4gICAgICAgIHJldHVybiBhc3NldFJlc3VsdC5yZXN1bHRzO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSBpdCBpcyBIVE1MXG4gICAgLy8gVGhpcyBpcyB3aGVyZSB3ZSByZW5kZXIgdGhlIGNvbnRlbnQsIHRoZW4gcmVuZGVyIHRoYXRcbiAgICAvLyBpbnRvIHRoZSBsYXlvdXQgKGlmIG9uZSBleGlzdHMpLCB0aGVuIHJ1biBNYWhhYmh1dGEuXG5cbiAgICAvLyBUaGVzZSBmdW5jdGlvbnMgYXJlIGR1cGxpY2F0ZXMgYmV0d2VlbiB0aGUgZmlyc3RcbiAgICAvLyB0d28gc3RhZ2VzLiAgU2F2ZSBhIGNvdXBsZSBtaWNyb3NlY29uZHMgYnkgaW5zdGFudGlhdGluZ1xuICAgIC8vIHRoZSBmdW5jdGlvbnMgb25jZS5cbiAgICBjb25zdCBkb1BhcnRpYWwgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgY29uc3QgZG9QYXJ0aWFsU3luYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG5cbiAgICAvLyBGaXJzdCBSZW5kZXJcbiAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBBZGQgbmVjZXNzYXJ5IGl0ZW1zIHRvIHRoZSBtZXRhZGF0YVxuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgcmV0LnJlbmRlckZpcnN0Q29udGV4dC5tZXRhZGF0YS5wYXJ0aWFsID0gZG9QYXJ0aWFsO1xuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLnBhcnRpYWxTeW5jID0gZG9QYXJ0aWFsU3luYztcbiAgICAgICAgcmV0LnJlbmRlckZpcnN0Q29udGV4dC5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLnBsdWdpbiA9IGNvbmZpZy5wbHVnaW47XG5cbiAgICAgICAgLy8gUmVuZGVyIHRoZSBwcmltYXJ5IGNvbnRlbnRcbiAgICAgICAgcmV0LnJlbmRlcmVkRmlyc3QgPSBhd2FpdCByZXQucmVuZGVyZXIucmVuZGVyKHJldC5yZW5kZXJGaXJzdENvbnRleHQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpKTtcbiAgICAgICAgLy8gVXNlIGVtcHR5IHN0cmluZyBhcyBmYWxsYmFjayBpZiByZW5kZXJpbmcgZmFpbHNcbiAgICAgICAgcmV0LnJlbmRlcmVkRmlyc3QgPSAnJztcbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIC8vIEVORCBGaXJzdCBSZW5kZXJcblxuICAgIC8vIExheW91dCBSZW5kZXJcbiAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgaWYgKHJldD8uZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgICAgIC8vIGF3YWl0IGxheW91dHMuaXNSZWFkeSgpO1xuXG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBsYXlvdXRzLmZpbmQocmV0LmRvY0luZm8ubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgTm8gbGF5b3V0IGZvdW5kIGluICR7dXRpbC5pbnNwZWN0KHJldC5jb25maWcubGF5b3V0RGlycyl9IGZvciAke3JldD8uZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gaW4gZmlsZSAke3JldC5kb2NJbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvcik7XG4gICAgICAgICAgICAgICAgLy8gU2tpcCBsYXlvdXQgcmVuZGVyaW5nLCB1c2UgZmlyc3QgcmVuZGVyIHJlc3VsdFxuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJlZExheW91dCA9IHJldC5yZW5kZXJlZEZpcnN0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKFxuICAgICAgICAgICAgICAgICAgICByZXQuZG9jSW5mby5tZXRhZGF0YS5sYXlvdXRcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQgPSA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogcmV0LmRvY0luZm8ubWV0YWRhdGEubGF5b3V0LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBmb3VuZC5kb2NDb250ZW50LFxuICAgICAgICAgICAgICAgICAgICBib2R5OiBmb3VuZC5kb2NCb2R5LFxuICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YToge31cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgPSBjb3B5UHJvcGVydGllcyhcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgID0gY29weVByb3BlcnRpZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldC5kb2NJbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEuY29udGVudCA9IHJldC5yZW5kZXJlZEZpcnN0O1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLnBhcnRpYWwgPSBkb1BhcnRpYWw7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEucGFydGlhbFN5bmMgPSBkb1BhcnRpYWxTeW5jO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLmFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEucGx1Z2luID0gY29uZmlnLnBsdWdpbjtcblxuICAgICAgICAgICAgICAgIC8vIFJlbmRlciB0aGUgbGF5b3V0IGNvbnRlbnRcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyZWRMYXlvdXQgPSBhd2FpdCByZW5kZXJlci5yZW5kZXIocmV0LnJlbmRlckxheW91dENvbnRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZS5zdGFjayA/IGUuc3RhY2sgOiBlfWApO1xuICAgICAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICAgICAgLy8gVXNlIGZpcnN0IHJlbmRlciByZXN1bHQgYXMgZmFsbGJhY2tcbiAgICAgICAgICAgIHJldC5yZW5kZXJlZExheW91dCA9IHJldC5yZW5kZXJlZEZpcnN0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgLy8gRU5EIExheW91dCBSZW5kZXJcblxuICAgIC8vIE1haGFiaHV0YVxuICAgIHJldC5yZXN1bHRzLnJlbmRlck1haGFTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgcmV0LnJlbmRlck1haGFDb250ZXh0ID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICBmc3BhdGg6IHJldC5kb2NJbmZvLm1ldGFkYXRhLmxheW91dCxcbiAgICAgICAgY29udGVudDogcmV0LnJlbmRlcmVkTGF5b3V0XG4gICAgICAgICAgICA/IHJldC5yZW5kZXJlZExheW91dCA6IHJldC5yZW5kZXJlZEZpcnN0LFxuICAgICAgICBib2R5OiByZXQucmVuZGVyZWRMYXlvdXRcbiAgICAgICAgICAgID8gcmV0LnJlbmRlcmVkTGF5b3V0IDogcmV0LnJlbmRlcmVkRmlyc3QsXG4gICAgICAgIG1ldGFkYXRhOiB7fVxuICAgIH07XG5cbiAgICByZXQucmVuZGVyTWFoYUNvbnRleHQubWV0YWRhdGFcbiAgICAgICAgPSBjb3B5UHJvcGVydGllcyhcbiAgICAgICAgICAgIHJldC5yZW5kZXJNYWhhQ29udGV4dC5tZXRhZGF0YSxcbiAgICAgICAgICAgIHJldC5kb2NJbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcblxuICAgIHRyeSB7XG4gICAgICAgIGlmIChyZXQuZG9jSW5mbz8ubWV0YWRhdGE/LmNvbmZpZz8ubWFoYWJodXRhQ29uZmlnKSB7XG4gICAgICAgICAgICBtYWhhYmh1dGEuY29uZmlnKHJldC5kb2NJbmZvPy5tZXRhZGF0YT8uY29uZmlnPy5tYWhhYmh1dGFDb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXQucmVuZGVyZWRNYWhhID0gIGF3YWl0IG1haGFiaHV0YS5wcm9jZXNzQXN5bmMoXG4gICAgICAgICAgICByZXQucmVuZGVyTWFoYUNvbnRleHQuY29udGVudCwgcmV0LnJlbmRlck1haGFDb250ZXh0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgcmV0LmNvbmZpZy5tYWhhZnVuY3MsXG4gICAgICAgICAgICAvLyBGb3IgcGVyZm9ybWFuY2UgY29sbGVjdGlvblxuICAgICAgICAgICAgY29uZmlnLnBlcmZEYXRhRGlyIFxuICAgICAgICAgICAgPyBuZXcgRmlsZXN5c3RlbVBlcmZEYXRhU3RvcmUoY29uZmlnLnBlcmZEYXRhRGlyKVxuICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjb25maWcucGVyZkRhdGFEaXIgXG4gICAgICAgICAgICA/IHJldC5kb2NJbmZvLnZwYXRoXG4gICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICApO1xuICAgIH0gY2F0Y2ggKGUyKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBFcnJvciB3aXRoIE1haGFiaHV0YSAke3JldC5kb2NJbmZvLnZwYXRofSB3aXRoICR7cmV0LmRvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZTIuc3RhY2sgPyBlMi5zdGFjayA6IGUyfWApO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgLy8gVXNlIGxheW91dCByZXN1bHQgb3IgZmlyc3QgcmVuZGVyIGFzIGZhbGxiYWNrXG4gICAgICAgIHJldC5yZW5kZXJlZE1haGEgPSByZXQucmVuZGVyTWFoYUNvbnRleHQuY29udGVudDtcbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhRW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgLy8gRU5EIE1haGFiaHV0YVxuXG4gICAgaWYgKGNvbmZpZy5kZWNvbW1lbnQpIHtcbiAgICAgICAgcmV0LnJlbmRlcmVkTWFoYSA9IGRlY29tbWVudChyZXQucmVuZGVyZWRNYWhhKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICByZXQuY29uZmlnLnJlbmRlclRvLCByZXQuZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJEZXN0KSwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlckRlc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0LnJlbmRlcmVkTWFoYSwgJ3V0Zi04Jyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoU3RyaW5nKGVycm9yKSkpO1xuICAgIH1cblxuICAgIHJldC5yZXN1bHRzLnJlbmRlckVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGVsYXBzZWQgdGltZXNcbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCAtIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQ7XG4gICAgfVxuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckxheW91dEVuZCAtIHJldC5yZXN1bHRzLnJlbmRlckxheW91dFN0YXJ0O1xuICAgIH1cbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyTWFoYVN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlck1haGFFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJNYWhhRW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyTWFoYVN0YXJ0O1xuICAgIH1cbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyU3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlclRvdGFsRWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckVuZCAtIHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0O1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCAke3JldC52cGF0aH1gLCByZXQpO1xuICAgIHJldHVybiByZXQucmVzdWx0cztcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgd2hldGhlciBhIGRvY3VtZW50IGNhbiBiZSBza2lwcGVkIGJlY2F1c2UgaXRzIGV4aXN0aW5nXG4gKiBvdXRwdXQgZmlsZSBpcyB1cC10by1kYXRlLlxuICpcbiAqIEEgZG9jdW1lbnQgaXMgY29uc2lkZXJlZCB1cC10by1kYXRlIHdoZW4gYW4gb3V0cHV0IGZpbGUgZXhpc3RzIGFuZFxuICogaXMgbmV3ZXIgdGhhbiBCT1RIOlxuICpcbiAqICAgMS4gdGhlIHNvdXJjZSBkb2N1bWVudCwgYW5kXG4gKiAgIDIuIHRoZSBsYXlvdXQgdGVtcGxhdGUgKGlmIGFueSkgdXNlZCBieSB0aGUgZG9jdW1lbnQuXG4gKlxuICogQXMgZGVzY3JpYmVkIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9ha2FzaGFjbXMvYWthc2hhcmVuZGVyL2lzc3Vlcy82MVxuICogaXQgaXMgbm90IGZlYXNpYmxlIHRvIGRldGVybWluZSB0aGUgc2V0IG9mIHBhcnRpYWxzIHVzZWQgYnkgYSBnaXZlblxuICogZG9jdW1lbnQsIHNvIGNoYW5nZXMgdG8gcGFydGlhbHMgYXJlIE5PVCBkZXRlY3RlZCBoZXJlLiAgVXNlXG4gKiBgLS1mb3JjZS1yZW5kZXItYWxsYCAob3IgdGhlIGBmb3JjZVJlbmRlckFsbGAgb3B0aW9uKSB0byBmb3JjZSBldmVyeVxuICogZG9jdW1lbnQgdG8gYmUgcmUtcmVuZGVyZWQsIGZvciBleGFtcGxlIGFmdGVyIGVkaXRpbmcgYSBwYXJ0aWFsLlxuICpcbiAqIEBwYXJhbSBjb25maWcgICBBa2FzaGFDTVMgQ29uZmlndXJhdGlvblxuICogQHBhcmFtIGRvY0luZm8gIFRoZSBkb2N1bWVudCBpbmZvIG9iamVjdCAoZnJvbSBkb2N1bWVudHNDYWNoZS5maW5kKVxuICogQHJldHVybnMgYHRydWVgIHdoZW4gcmVuZGVyaW5nIGNhbiBiZSBza2lwcGVkLCBgZmFsc2VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzRG9jdW1lbnRVcFRvRGF0ZShcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mb1xuKTogUHJvbWlzZTxib29sZWFuPiB7XG5cbiAgICAvLyBXaXRob3V0IGEga25vd24gcmVuZGVyIHBhdGggd2UgY2Fubm90IGxvY2F0ZSB0aGUgb3V0cHV0IGZpbGUuXG4gICAgaWYgKCFkb2NJbmZvIHx8ICFkb2NJbmZvLnJlbmRlclBhdGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIE9ubHkgSFRNTCBkb2N1bWVudHMgcGFzcyB0aHJvdWdoIHRoZSBsYXlvdXQvcGFydGlhbCBwaXBlbGluZS5cbiAgICAvLyBDU1MgZmlsZXMgYW5kIGNvcGllZCBhc3NldHMgYXJlIGNoZWFwIGFuZCBoYXZlIG5vIGxheW91dFxuICAgIC8vIGRlcGVuZGVuY3ksIHNvIGFsd2F5cyByZS1wcm9jZXNzIHRoZW0gdG8gc3RheSBjb3JyZWN0LlxuICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZG9jSW5mby52cGF0aCk7XG4gICAgaWYgKCFyZW5kZXJlcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHJjID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICBmc3BhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgIGNvbnRlbnQ6IGRvY0luZm8uZG9jQ29udGVudCxcbiAgICAgICAgYm9keTogZG9jSW5mby5kb2NCb2R5LFxuICAgICAgICBtZXRhZGF0YTogZG9jSW5mby5tZXRhZGF0YVxuICAgIH07XG4gICAgaWYgKHJlbmRlcmVyLnJlbmRlckZvcm1hdChyYykgIT09ICdIVE1MJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gTG9jYXRlIHRoZSBvdXRwdXQgZmlsZSBhbmQgcmVhZCBpdHMgbW9kaWZpY2F0aW9uIHRpbWUuXG4gICAgbGV0IG91dHB1dE10aW1lTXM7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICAgICAgY29uc3Qgb3V0U3RhdHMgPSBhd2FpdCBmc3Auc3RhdChyZW5kZXJEZXN0KTtcbiAgICAgICAgb3V0cHV0TXRpbWVNcyA9IG91dFN0YXRzLm10aW1lTXM7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIE5vIG91dHB1dCBmaWxlIChvciBub3QgcmVhZGFibGUpID0+IG11c3QgcmVuZGVyLlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVGhlIG91dHB1dCBtdXN0IGJlIG5ld2VyIHRoYW4gdGhlIHNvdXJjZSBkb2N1bWVudC5cbiAgICBpZiAodHlwZW9mIGRvY0luZm8ubXRpbWVNcyAhPT0gJ251bWJlcidcbiAgICAgfHwgZG9jSW5mby5tdGltZU1zID4gb3V0cHV0TXRpbWVNc1xuICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVGhlIG91dHB1dCBtdXN0IGJlIG5ld2VyIHRoYW4gdGhlIGxheW91dCB0ZW1wbGF0ZSwgaWYgYW55LlxuICAgIGlmIChkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXRzID0gY29uZmlnLmFrYXNoYS5maWxlY2FjaGUubGF5b3V0c0NhY2hlO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0ID0gYXdhaXQgbGF5b3V0cy5maW5kKGRvY0luZm8ubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgICAgIC8vIElmIHRoZSBsYXlvdXQgY2Fubm90IGJlIGZvdW5kLCBmYWxsIHRocm91Z2ggdG8gcmVuZGVyaW5nXG4gICAgICAgICAgICAvLyBzbyB0aGUgZXhpc3RpbmcgZXJyb3IgcmVwb3J0aW5nIGluIHJlbmRlckRvY3VtZW50IHJ1bnMuXG4gICAgICAgICAgICBpZiAoIWxheW91dFxuICAgICAgICAgICAgIHx8IHR5cGVvZiBsYXlvdXQubXRpbWVNcyAhPT0gJ251bWJlcidcbiAgICAgICAgICAgICB8fCBsYXlvdXQubXRpbWVNcyA+IG91dHB1dE10aW1lTXNcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBPcHRpb25zIGNvbnRyb2xsaW5nIHRoZSBiZWhhdmlvciBvZiByZW5kZXIuXG4gKi9cbmV4cG9ydCB0eXBlIFJlbmRlck9wdGlvbnMgPSB7XG4gICAgLyoqXG4gICAgICogV2hlbiB0cnVlLCBldmVyeSBkb2N1bWVudCBpcyByZS1yZW5kZXJlZCByZWdhcmRsZXNzIG9mXG4gICAgICogb3V0cHV0IGZpbGUgdGltZXN0YW1wcy4gIFRoaXMgbWF0Y2hlcyB0aGUgaGlzdG9yaWNhbFxuICAgICAqIGJlaGF2aW9yIGFuZCBpcyBleHBvc2VkIG9uIHRoZSBDTEkgYXMgYC0tZm9yY2UtcmVuZGVyLWFsbGAuXG4gICAgICovXG4gICAgZm9yY2VSZW5kZXJBbGw/OiBib29sZWFuO1xufTtcblxuLyoqXG4gKiBSZW5kZXIgYWxsIHRoZSBkb2N1bWVudHMgaW4gYSBzaXRlIHVzaW5nIHJlbmRlckRvY3VtZW50LFxuICogbGltaXRpbmcgdGhlIG51bWJlciBvZiBzaW11bHRhbmVvdXMgcmVuZGVyaW5nIHRhc2tzXG4gKiB0byB0aGUgbnVtYmVyIGluIGNvbmZpZy5jb25jdXJyZW5jeS5cbiAqIFxuICogUmV0dXJucyBzdHJ1Y3R1cmVkIFJlbmRlcmluZ1Jlc3VsdHMgZGF0YSBpbnN0ZWFkIG9mIHRleHQgc3RyaW5ncy5cbiAqXG4gKiBVbmxlc3MgYG9wdGlvbnMuZm9yY2VSZW5kZXJBbGxgIGlzIHNldCwgZG9jdW1lbnRzIHdob3NlIG91dHB1dFxuICogZmlsZSBpcyBuZXdlciB0aGFuIGJvdGggdGhlIHNvdXJjZSBkb2N1bWVudCBhbmQgaXRzIGxheW91dFxuICogdGVtcGxhdGUgYXJlIHNraXBwZWQgKHNlZSBpc0RvY3VtZW50VXBUb0RhdGUpLlxuICpcbiAqIEBwYXJhbSBjb25maWdcbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbmFsIHJlbmRlcmluZyBjb250cm9scyAoZS5nLiBmb3JjZVJlbmRlckFsbClcbiAqIEByZXR1cm5zIEFycmF5IG9mIFJlbmRlcmluZ1Jlc3VsdHMgd2l0aCBwZXJmb3JtYW5jZSBhbmQgZXJyb3IgZGF0YVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyKFxuICAgIGNvbmZpZyxcbiAgICBvcHRpb25zPzogUmVuZGVyT3B0aW9uc1xuKTogUHJvbWlzZTxBcnJheTxSZW5kZXJpbmdSZXN1bHRzPj4ge1xuXG4gICAgY29uc3QgZm9yY2VSZW5kZXJBbGwgPSBvcHRpb25zPy5mb3JjZVJlbmRlckFsbCA9PT0gdHJ1ZTtcblxuICAgIGNvbnN0IGRvY3VtZW50cyA9IDxEb2N1bWVudHNDYWNoZT5jb25maWcuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdDQUxMSU5HIGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgYXdhaXQgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKTtcbiAgICBcbiAgICAvLyAxLiBHYXRoZXIgbGlzdCBvZiBmaWxlcyBmcm9tIFJlbmRlckZpbGVDYWNoZVxuICAgIGNvbnN0IGZpbGV6ID0gYXdhaXQgZG9jdW1lbnRzLnBhdGhzKCk7XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlciBmaWxleiAke2ZpbGV6Lmxlbmd0aH1gKTtcblxuICAgIC8vIDIuIEV4Y2x1ZGUgYW55IHRoYXQgd2Ugd2FudCB0byBpZ25vcmVcbiAgICBjb25zdCBmaWxlejIgPSBbXSBhcyBBcnJheTx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PjtcbiAgICAvLyBEb2N1bWVudHMgdGhhdCB3ZXJlIHNraXBwZWQgYmVjYXVzZSB0aGVpciBvdXRwdXQgaXMgdXAtdG8tZGF0ZS5cbiAgICAvLyBUaGVzZSBhcmUgcmVwb3J0ZWQgYWxvbmdzaWRlIHRoZSByZW5kZXJlZCBkb2N1bWVudHMuXG4gICAgY29uc3Qgc2tpcHBlZFJlc3VsdHMgPSBbXSBhcyBBcnJheTxSZW5kZXJpbmdSZXN1bHRzPjtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxleikge1xuICAgICAgICBsZXQgaW5jbHVkZSA9IHRydWU7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGVudHJ5KTtcbiAgICAgICAgbGV0IHN0YXRzO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RhdHMgPSBhd2FpdCBmc3Auc3RhdChlbnRyeS5mc3BhdGgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHsgc3RhdHMgPSB1bmRlZmluZWQ7IH1cbiAgICAgICAgaWYgKCFlbnRyeSkgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICBlbHNlIGlmICghc3RhdHMgfHwgc3RhdHMuaXNEaXJlY3RvcnkoKSkgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICAvLyBUaGlzIHNob3VsZCBhcmlzZSB1c2luZyBhbiBpZ25vcmUgY2xhdXNlXG4gICAgICAgIC8vIGVsc2UgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkudnBhdGgpID09PSAnLkRTX1N0b3JlJykgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICAvLyBlbHNlIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LnZwYXRoKSA9PT0gJy5wbGFjZWhvbGRlcicpIGluY2x1ZGUgPSBmYWxzZTtcblxuICAgICAgICBpZiAoaW5jbHVkZSkge1xuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IGRvY3VtZW50cy5maW5kKGVudHJ5LnZwYXRoKTtcblxuICAgICAgICAgICAgLy8gU2tpcCBkb2N1bWVudHMgd2hvc2Ugb3V0cHV0IGZpbGUgaXMgbmV3ZXIgdGhhbiBib3RoIHRoZVxuICAgICAgICAgICAgLy8gc291cmNlIGRvY3VtZW50IGFuZCBpdHMgbGF5b3V0IHRlbXBsYXRlLCB1bmxlc3MgdGhlXG4gICAgICAgICAgICAvLyBjYWxsZXIgZm9yY2VkIGEgZnVsbCByZS1yZW5kZXIuXG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYWthc2hhY21zL2FrYXNoYXJlbmRlci9pc3N1ZXMvNjFcbiAgICAgICAgICAgIGlmICghZm9yY2VSZW5kZXJBbGxcbiAgICAgICAgICAgICAmJiBhd2FpdCBpc0RvY3VtZW50VXBUb0RhdGUoY29uZmlnLCBpbmZvKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc2tpcHBlZFJlc3VsdHMucHVzaCg8UmVuZGVyaW5nUmVzdWx0cz57XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlckZvcm1hdDogJ0hUTUwnLFxuICAgICAgICAgICAgICAgICAgICBza2lwcGVkOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZSBxdWV1ZSBpcyBhbiBhcnJheSBvZiB0dXBsZXMgY29udGFpbmluZyB0aGVcbiAgICAgICAgICAgIC8vIGNvbmZpZyBvYmplY3QgYW5kIHRoZSBwYXRoIHN0cmluZ1xuICAgICAgICAgICAgZmlsZXoyLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICAgICAgICAgIGluZm86IGluZm9cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXIgZmlsZXoyIGFmdGVyIGlnbm9yZSAke2ZpbGV6Mi5sZW5ndGh9YCk7XG5cbiAgICAvLyAzLiBNYWtlIGEgZmFzdHEgdG8gcHJvY2VzcyB1c2luZyByZW5kZXJEb2N1bWVudCxcbiAgICAvLyAgICBwdXNoaW5nIHJlc3VsdHMgdG8gdGhlIHJlc3VsdHMgYXJyYXlcblxuICAgIC8vIFRoaXMgc2V0cyB1cCB0aGUgcXVldWUgcHJvY2Vzc29yXG4gICAgLy8gVGhlIGNvbmN1cnJlbmN5IHNldHRpbmcgbGV0cyB1cyBwcm9jZXNzIGRvY3VtZW50c1xuICAgIC8vIGluIHBhcmFsbGVsIHdoaWxlIGxpbWl0aW5nIHRvdGFsIGltcGFjdC5cbiAgICBjb25zdCBxdWV1ZTogcXVldWVBc1Byb21pc2VkPHtcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgIH0+ID0gZmFzdHEucHJvbWlzZShcblxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgZm9yIGVhY2ggZW50cnkgaW4gdGhlXG4gICAgICAgIC8vIHF1ZXVlLiBJdCBoYW5kbGVzIHJlbmRlcmluZyB0aGUgcXVldWVcbiAgICAgICAgLy8gVGhlIHF1ZXVlIGhhcyBjb25maWcgb2JqZWN0cyBhbmQgcGF0aCBzdHJpbmdzXG4gICAgICAgIC8vIHdoaWNoIGlzIGV4YWN0bHkgd2hhdCdzIHJlcXVpcmVkIGJ5XG4gICAgICAgIC8vIHJlbmRlckRvY3VtZW50XG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50SW5RdWV1ZShlbnRyeSlcbiAgICAgICAgICAgIDogUHJvbWlzZTxSZW5kZXJpbmdSZXN1bHRzPlxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckRvY3VtZW50KFxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5jb25maWcsIGVudHJ5LmluZm9cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBET05FIHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEVSUk9SIHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCwgZXJyb3Iuc3RhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZy5jb25jdXJyZW5jeSk7XG5cbiAgICAvLyBxdWV1ZS5wdXNoIHJldHVybnMgYSBQcm9taXNlIHRoYXQncyBmdWxmaWxsZWQgd2hlblxuICAgIC8vIHRoZSB0YXNrIGZpbmlzaGVzLlxuICAgIC8vIEhlbmNlIHdhaXRGb3IgaXMgYW4gYXJyYXkgb2YgUHJvbWlzZXMuXG4gICAgY29uc3Qgd2FpdEZvciA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5IG9mIGZpbGV6Mikge1xuICAgICAgICB3YWl0Rm9yLnB1c2gocXVldWUucHVzaChlbnRyeSkpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgYXV0b21hdGljYWxseSB3YWl0cyBmb3IgYWxsIHRob3NlXG4gICAgLy8gUHJvbWlzZXMgdG8gcmVzb2x2ZSwgd2hpbGUgbWFraW5nIHRoZSByZXN1bHRzXG4gICAgLy8gYXJyYXkgY29udGFpbiByZXN1bHRzLlxuICAgIGNvbnN0IHJlc3VsdHM6IEFycmF5PFJlbmRlcmluZ1Jlc3VsdHM+ID0gW107XG4gICAgZm9yIChsZXQgcmVzdWx0IG9mIHdhaXRGb3IpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHJlc3VsdCk7XG4gICAgfVxuXG4gICAgLy8gSW5jbHVkZSB0aGUgZG9jdW1lbnRzIHRoYXQgd2VyZSBza2lwcGVkIGJlY2F1c2UgdGhlaXJcbiAgICAvLyBvdXRwdXQgd2FzIHVwLXRvLWRhdGUsIHNvIGNhbGxlcnMgY2FuIHJlcG9ydCB0aGVtLlxuICAgIGZvciAobGV0IHNraXBwZWQgb2Ygc2tpcHBlZFJlc3VsdHMpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHNraXBwZWQpO1xuICAgIH1cblxuICAgIC8vIDQuIEludm9rZSBob29rU2l0ZVJlbmRlcmVkXG5cbiAgICB0cnkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnSW52b2tpbmcgaG9va1NpdGVSZW5kZXJlZCcpO1xuICAgICAgICBhd2FpdCBjb25maWcuaG9va1NpdGVSZW5kZXJlZCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBob29rU2l0ZVJlbmRlcmVkIGZhaWxlZCBiZWNhdXNlICR7ZX1gKTtcbiAgICB9XG5cbiAgICAvLyA1LiByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiByZXN1bHRzO1xufTtcbiJdfQ==