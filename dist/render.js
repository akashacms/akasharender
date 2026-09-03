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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRTdCLE9BQU8sU0FBUyxFQUFFLEVBQ2QsdUJBQXVCLEVBQzFCLE1BQU0sV0FBVyxDQUFDO0FBRW5CLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQVUxQixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDOUMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBbUVsQyxTQUFTLG1CQUFtQixDQUN4QixNQUFxQixFQUNyQixPQUFPO0lBRVAsTUFBTSxHQUFHLEdBQWtCO1FBQ3ZCLE1BQU07UUFFTixrQkFBa0IsRUFBb0I7WUFDbEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1lBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsVUFBVTtZQUMzQixJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU87WUFDckIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1NBQzdCO1FBRUQsUUFBUSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FDakIsT0FBTyxDQUFDLEtBQUssQ0FDNUI7UUFFRCxPQUFPO1FBQ1AsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3BCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtRQUM5QixVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVU7UUFDOUIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1FBRXpCLE9BQU8sRUFBb0I7WUFDdkIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1lBQ3BCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtZQUM5QixX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LENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCw2QkFBNkI7SUFFN0IsSUFBSSxDQUFDO1FBQ0QsNENBQTRDO1FBQzVDLE1BQU0sTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDcEMsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxvQkFBb0I7SUFDcEIsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQztBQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCAqIGFzIGRhdGEgZnJvbSAnLi9kYXRhLmpzJztcbmltcG9ydCBtYWhhYmh1dGEsIHtcbiAgICBGaWxlc3lzdGVtUGVyZkRhdGFTdG9yZVxufSBmcm9tICdtYWhhYmh1dGEnO1xuXG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHR5cGUgeyBxdWV1ZUFzUHJvbWlzZWQgfSBmcm9tIFwiZmFzdHFcIjtcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24gfSBmcm9tICcuL2luZGV4LmpzJztcbmltcG9ydCB7IFJlbmRlcmVyLCBSZW5kZXJpbmdDb250ZXh0IH0gZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0IHtcbiAgICBEb2N1bWVudHNDYWNoZVxufSBmcm9tICcuL2NhY2hlL2NhY2hlLXNxbGl0ZS5qcyc7XG5pbXBvcnQge1xuICAgIERvY3VtZW50XG59IGZyb20gJy4vY2FjaGUvc2NoZW1hLmpzJztcbmltcG9ydCB7IHBlcmZvcm1hbmNlIH0gZnJvbSAnbm9kZTpwZXJmX2hvb2tzJztcbmltcG9ydCBkZWNvbW1lbnQgZnJvbSAnZGVjb21tZW50JztcblxuXG4vLyBGb3IgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzLzEwM1xuLy8gVGhlIGlkZWEgaXMgbm9ybWFsaXppbmcgdGhlIGRhdGEgcmV0dXJuZWQuICBUaGlzIHNob3VsZFxuLy8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB0aGUgZGF0YSBtb2R1bGUuICBUaGlzIHNob3VsZFxuLy8gaW1wcm92ZSB0aGUgYW5hbHl6ZWFiaWxpdHkgb2YgZGF0YSBhYm91dCB0aGUgcmVuZGVyaW5nIHByb2Nlc3MuXG5cbmV4cG9ydCB0eXBlIFJlbmRlcmluZ1Jlc3VsdHMgPSB7XG5cbiAgICB2cGF0aD86IHN0cmluZztcbiAgICByZW5kZXJQYXRoPzogc3RyaW5nO1xuXG4gICAgcmVuZGVyRm9ybWF0OiBzdHJpbmc7XG5cbiAgICByZW5kZXJTdGFydD86IG51bWJlcjtcbiAgICByZW5kZXJFbmQ/OiBudW1iZXI7XG5cbiAgICByZW5kZXJGaXJzdFN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlckZpcnN0RW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyTGF5b3V0U3RhcnQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTGF5b3V0RW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyTWFoYVN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlck1haGFFbmQ/OiBudW1iZXI7XG5cbiAgICAvLyBFbGFwc2VkIHRpbWUgY2FsY3VsYXRpb25zXG4gICAgcmVuZGVyRmlyc3RFbGFwc2VkPzogbnVtYmVyO1xuICAgIHJlbmRlckxheW91dEVsYXBzZWQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTWFoYUVsYXBzZWQ/OiBudW1iZXI7XG4gICAgcmVuZGVyVG90YWxFbGFwc2VkPzogbnVtYmVyO1xuXG4gICAgLy8gVHJ1ZSB3aGVuIHRoaXMgZG9jdW1lbnQgd2FzIG5vdCByZS1yZW5kZXJlZCBiZWNhdXNlIHRoZVxuICAgIC8vIGV4aXN0aW5nIG91dHB1dCBmaWxlIGlzIG5ld2VyIHRoYW4gdGhlIHNvdXJjZSBkb2N1bWVudCBhbmRcbiAgICAvLyBpdHMgbGF5b3V0IHRlbXBsYXRlLiAgU2VlIHJlbmRlciBhbmQgdGhlIC0tZm9yY2UtcmVuZGVyLWFsbFxuICAgIC8vIG9wdGlvbi4gIGh0dHBzOi8vZ2l0aHViLmNvbS9ha2FzaGFjbXMvYWthc2hhcmVuZGVyL2lzc3Vlcy82MVxuICAgIHNraXBwZWQ/OiBib29sZWFuO1xuXG4gICAgZXJyb3JzPzogQXJyYXk8RXJyb3I+O1xufTtcblxuLy8gQ29sbGVjdCBhbGwgcmVxdWlyZWQgZGF0YSBpbiBhbiBpbnN0YW5jZSBvZiB0aGlzIG9iamVjdC5cbnR5cGUgUmVuZGVyaW5nRGF0YSA9IHtcbiAgICBjb25maWc/OiBDb25maWd1cmF0aW9uO1xuICAgIHJlbmRlcmVyPzogUmVuZGVyZXI7XG5cbiAgICBkb2NJbmZvPzogYW55O1xuXG4gICAgdnBhdGg/OiBzdHJpbmc7XG4gICAgcmVuZGVyUGF0aD86IHN0cmluZztcbiAgICBtb3VudFBvaW50Pzogc3RyaW5nO1xuICAgIHJlbmRlclRvPzogc3RyaW5nO1xuXG4gICAgcmVuZGVyRmlyc3RDb250ZXh0PzogUmVuZGVyaW5nQ29udGV4dDtcbiAgICByZW5kZXJlZEZpcnN0Pzogc3RyaW5nO1xuXG4gICAgbGF5b3V0Rm9ybWF0Pzogc3RyaW5nO1xuICAgIHJlbmRlckxheW91dENvbnRleHQ/OiBSZW5kZXJpbmdDb250ZXh0O1xuICAgIHJlbmRlcmVkTGF5b3V0Pzogc3RyaW5nO1xuXG4gICAgcmVuZGVyTWFoYUNvbnRleHQ/OiBSZW5kZXJpbmdDb250ZXh0O1xuICAgIHJlbmRlcmVkTWFoYT86IHN0cmluZztcblxuICAgIHJlc3VsdHM/OiBSZW5kZXJpbmdSZXN1bHRzO1xufTtcblxuZnVuY3Rpb24gY3JlYXRlUmVuZGVyaW5nRGF0YShcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mb1xuKTogUmVuZGVyaW5nRGF0YSB7XG4gICAgY29uc3QgcmV0ID0gPFJlbmRlcmluZ0RhdGE+e1xuICAgICAgICBjb25maWcsXG5cbiAgICAgICAgcmVuZGVyRmlyc3RDb250ZXh0OiA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgICAgICBmc3BhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBkb2NJbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogZG9jSW5mby5tZXRhZGF0YVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlcmVyOiBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGhcbiAgICAgICAgKSxcblxuICAgICAgICBkb2NJbmZvLFxuICAgICAgICB2cGF0aDogZG9jSW5mby52cGF0aCxcbiAgICAgICAgcmVuZGVyUGF0aDogZG9jSW5mby5yZW5kZXJQYXRoLFxuICAgICAgICBtb3VudFBvaW50OiBkb2NJbmZvLm1vdW50UG9pbnQsXG4gICAgICAgIHJlbmRlclRvOiBjb25maWcucmVuZGVyVG8sXG5cbiAgICAgICAgcmVzdWx0czogPFJlbmRlcmluZ1Jlc3VsdHM+e1xuICAgICAgICAgICAgdnBhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBkb2NJbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJTdGFydDogcGVyZm9ybWFuY2Uubm93KCksXG4gICAgICAgICAgICBlcnJvcnM6IG5ldyBBcnJheTxFcnJvcj4oKVxuICAgICAgICB9XG4gICAgfTtcbiAgICBpZiAocmV0LnJlbmRlcmVyKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZvcm1hdCA9IHJldC5yZW5kZXJlci5yZW5kZXJGb3JtYXQocmV0LnJlbmRlckZpcnN0Q29udGV4dCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gY29weVByb3BlcnRpZXMoZGVzdDogYW55LCBzcmM6IGFueSwgZXhjZXB0TGF5b3V0OiBib29sZWFuKSB7XG4gICAgZm9yICh2YXIgeXByb3AgaW4gc3JjKSB7XG4gICAgICAgIGlmIChleGNlcHRMYXlvdXQgJiYgeXByb3AgPT09ICdsYXlvdXQnKSBjb250aW51ZTtcbiAgICAgICAgZGVzdFt5cHJvcF0gPSBzcmNbeXByb3BdO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVuZGVyQ1NTRmlsZShyZXQ6IFJlbmRlcmluZ0RhdGEpOiBQcm9taXNlPFJlbmRlcmluZ0RhdGE+IHtcbiAgICB0cnkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGb3JtYXQgPSAnQ1NTJztcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgICAgIC8vIFJlbmRlciB0aGUgQ1NTIGNvbnRlbnRcbiAgICAgICAgcmV0LnJlbmRlcmVkRmlyc3QgPSBhd2FpdCByZXQucmVuZGVyZXIucmVuZGVyKHJldC5yZW5kZXJGaXJzdENvbnRleHQpO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgICAgIC8vIFdyaXRlIHRoZSByZW5kZXJlZCBDU1MgdG8gb3V0cHV0XG4gICAgICAgIGNvbnN0IHJlbmRlckRlc3QgPSBwYXRoLmpvaW4ocmV0LmNvbmZpZy5yZW5kZXJUbywgcmV0LmRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlckRlc3QsIHJldC5yZW5kZXJlZEZpcnN0LCAndXRmLTgnKTtcblxuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKSk7XG4gICAgfVxuICAgIC8vIENhbGN1bGF0ZSBlbGFwc2VkIHRpbWVzXG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0O1xuICAgIH1cbiAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbGFwc2VkID0gMDtcbiAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhRWxhcHNlZCA9IDA7XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJUb3RhbEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJTdGFydDtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ1NTRmlsZSAke3JldC52cGF0aH1gLCByZXQpO1xuXG4gICAgcmV0dXJuIHJldDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weUFzc2V0RmlsZShyZXQ6IFJlbmRlcmluZ0RhdGEpOiBQcm9taXNlPFJlbmRlcmluZ0RhdGE+IHtcbiAgICB0cnkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGb3JtYXQgPSAnQ09QWSc7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgICAgICAvLyBDb3B5IHRoZSBhc3NldCBmaWxlIHRvIG91dHB1dCBkaXJlY3RvcnlcbiAgICAgICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihyZXQuY29uZmlnLnJlbmRlclRvLCByZXQuZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJEZXN0KSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGF3YWl0IGZzcC5jb3B5RmlsZShyZXQuZG9jSW5mby5mc3BhdGgsIHJlbmRlckRlc3QpO1xuXG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpKTtcbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgZWxhcHNlZCB0aW1lc1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydDtcbiAgICB9XG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RWxhcHNlZCA9IDA7XG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVsYXBzZWQgPSAwO1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyVG90YWxFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyU3RhcnQ7XG4gICAgfVxuXG4gICAgLy8gVXNlIHRoaXMgdG8gdmVyaWZ5IGVycm9yIGhhbmRsaW5nXG4gICAgLy8gcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2gobmV3IEVycm9yKGBSYW5kb20gZXJyb3JgKSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgY29weUFzc2V0RmlsZSAke3JldC52cGF0aH1gLCByZXQpO1xuICAgIHJldHVybiByZXQ7XG59XG5cblxuXG4vKipcbiAqIFJlbmRlciBhIHNpbmdsZSBkb2N1bWVudCwgYWNjb3VudGluZyBmb3IgdGhlIG1haW4gY29udGVudCxcbiAqIGEgbGF5b3V0IHRlbXBsYXRlIChpZiBhbnkpLCBhbmQgTWFoYWJodXRhIChpZiB0aGUgY29udGVudFxuICogb3V0cHV0IGlzIEhUTUwpLiAgVGhpcyBhbHNvIGhhbmRsZXMgcmVuZGVyaW5nIG90aGVyIHR5cGVzXG4gKiBvZiBjb250ZW50IHN1Y2ggYXMgTEVTUyBDU1MgZmlsZXMuXG4gKlxuICogUmV0dXJucyBzdHJ1Y3R1cmVkIFJlbmRlcmluZ1Jlc3VsdHMgZGF0YSwgaW5jbHVkaW5nIHByZWNpc2VcbiAqIHBlci1zdGFnZSBlbGFwc2VkIHRpbWVzICh2aWEgcGVyZm9ybWFuY2Uubm93KCkpIGFuZCBhbiBlcnJvcnNcbiAqIGFycmF5LCBpbnN0ZWFkIG9mIHRocm93aW5nIG9uIGVycm9yLlxuICpcbiAqIEBwYXJhbSBjb25maWdcbiAqIEBwYXJhbSBkb2NJbmZvXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm9cbik6IFByb21pc2U8UmVuZGVyaW5nUmVzdWx0cz4ge1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBtYXN0ZXIgb2JqZWN0IHRvIGhvbGQgYWxsIGRhdGFcbiAgICBjb25zdCByZXQ6IFJlbmRlcmluZ0RhdGEgPSBjcmVhdGVSZW5kZXJpbmdEYXRhKGNvbmZpZywgZG9jSW5mbyk7XG5cbiAgICAvLyBQZWVsIG9mZiB0byBtb2RlLXNwZWNpZmljIGZ1bmN0aW9uc1xuICAgIGlmIChyZXQ/LnJlbmRlcmVyPy5yZW5kZXJGb3JtYXQocmV0LnJlbmRlckZpcnN0Q29udGV4dCkgPT09ICdDU1MnKSB7XG4gICAgICAgIGNvbnN0IGNzc1Jlc3VsdCA9IGF3YWl0IHJlbmRlckNTU0ZpbGUocmV0KTtcbiAgICAgICAgcmV0dXJuIGNzc1Jlc3VsdC5yZXN1bHRzO1xuICAgIH0gZWxzZSBpZiAoIXJldC5yZW5kZXJlclxuICAgICB8fCAocmV0LnJlbmRlcmVyLnJlbmRlckZvcm1hdChyZXQucmVuZGVyRmlyc3RDb250ZXh0KSAhPT0gJ0hUTUwnKVxuICAgICkge1xuICAgICAgICBjb25zdCBhc3NldFJlc3VsdCA9IGF3YWl0IGNvcHlBc3NldEZpbGUocmV0KTtcbiAgICAgICAgcmV0dXJuIGFzc2V0UmVzdWx0LnJlc3VsdHM7XG4gICAgfVxuXG4gICAgLy8gT3RoZXJ3aXNlIGl0IGlzIEhUTUxcbiAgICAvLyBUaGlzIGlzIHdoZXJlIHdlIHJlbmRlciB0aGUgY29udGVudCwgdGhlbiByZW5kZXIgdGhhdFxuICAgIC8vIGludG8gdGhlIGxheW91dCAoaWYgb25lIGV4aXN0cyksIHRoZW4gcnVuIE1haGFiaHV0YS5cblxuICAgIC8vIFRoZXNlIGZ1bmN0aW9ucyBhcmUgZHVwbGljYXRlcyBiZXR3ZWVuIHRoZSBmaXJzdFxuICAgIC8vIHR3byBzdGFnZXMuICBTYXZlIGEgY291cGxlIG1pY3Jvc2Vjb25kcyBieSBpbnN0YW50aWF0aW5nXG4gICAgLy8gdGhlIGZ1bmN0aW9ucyBvbmNlLlxuICAgIGNvbnN0IGRvUGFydGlhbCA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICBjb25zdCBkb1BhcnRpYWxTeW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcblxuICAgIC8vIEZpcnN0IFJlbmRlclxuICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIEFkZCBuZWNlc3NhcnkgaXRlbXMgdG8gdGhlIG1ldGFkYXRhXG4gICAgICAgIHJldC5yZW5kZXJGaXJzdENvbnRleHQubWV0YWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLnBhcnRpYWwgPSBkb1BhcnRpYWw7XG4gICAgICAgIHJldC5yZW5kZXJGaXJzdENvbnRleHQubWV0YWRhdGEucGFydGlhbFN5bmMgPSBkb1BhcnRpYWxTeW5jO1xuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLmFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgIHJldC5yZW5kZXJGaXJzdENvbnRleHQubWV0YWRhdGEucGx1Z2luID0gY29uZmlnLnBsdWdpbjtcblxuICAgICAgICAvLyBSZW5kZXIgdGhlIHByaW1hcnkgY29udGVudFxuICAgICAgICByZXQucmVuZGVyZWRGaXJzdCA9IGF3YWl0IHJldC5yZW5kZXJlci5yZW5kZXIocmV0LnJlbmRlckZpcnN0Q29udGV4dCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoU3RyaW5nKGVycm9yKSkpO1xuICAgICAgICAvLyBVc2UgZW1wdHkgc3RyaW5nIGFzIGZhbGxiYWNrIGlmIHJlbmRlcmluZyBmYWlsc1xuICAgICAgICByZXQucmVuZGVyZWRGaXJzdCA9ICcnO1xuICAgIH1cblxuICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgLy8gRU5EIEZpcnN0IFJlbmRlclxuXG4gICAgLy8gTGF5b3V0IFJlbmRlclxuICAgIHJldC5yZXN1bHRzLnJlbmRlckxheW91dFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICBpZiAocmV0Py5kb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXRzID0gY29uZmlnLmFrYXNoYS5maWxlY2FjaGUubGF5b3V0c0NhY2hlO1xuICAgICAgICAgICAgLy8gYXdhaXQgbGF5b3V0cy5pc1JlYWR5KCk7XG5cbiAgICAgICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGxheW91dHMuZmluZChyZXQuZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQpO1xuICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBObyBsYXlvdXQgZm91bmQgaW4gJHt1dGlsLmluc3BlY3QocmV0LmNvbmZpZy5sYXlvdXREaXJzKX0gZm9yICR7cmV0Py5kb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSBpbiBmaWxlICR7cmV0LmRvY0luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICAgICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgICAgICAgICAvLyBTa2lwIGxheW91dCByZW5kZXJpbmcsIHVzZSBmaXJzdCByZW5kZXIgcmVzdWx0XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlcmVkTGF5b3V0ID0gcmV0LnJlbmRlcmVkRmlyc3Q7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoXG4gICAgICAgICAgICAgICAgICAgIHJldC5kb2NJbmZvLm1ldGFkYXRhLmxheW91dFxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dCA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiByZXQuZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZvdW5kLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IGZvdW5kLmRvY0JvZHksXG4gICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7fVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICA9IGNvcHlQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZC5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgPSBjb3B5UHJvcGVydGllcyhcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0LmRvY0luZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YS5jb250ZW50ID0gcmV0LnJlbmRlcmVkRmlyc3Q7XG5cbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEucGFydGlhbCA9IGRvUGFydGlhbDtcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YS5wYXJ0aWFsU3luYyA9IGRvUGFydGlhbFN5bmM7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YS5wbHVnaW4gPSBjb25maWcucGx1Z2luO1xuXG4gICAgICAgICAgICAgICAgLy8gUmVuZGVyIHRoZSBsYXlvdXQgY29udGVudFxuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJlZExheW91dCA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihyZXQucmVuZGVyTGF5b3V0Q29udGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSB3aXRoICR7ZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gJHtlLnN0YWNrID8gZS5zdGFjayA6IGV9YCk7XG4gICAgICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvcik7XG4gICAgICAgICAgICAvLyBVc2UgZmlyc3QgcmVuZGVyIHJlc3VsdCBhcyBmYWxsYmFja1xuICAgICAgICAgICAgcmV0LnJlbmRlcmVkTGF5b3V0ID0gcmV0LnJlbmRlcmVkRmlyc3Q7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAvLyBFTkQgTGF5b3V0IFJlbmRlclxuXG4gICAgLy8gTWFoYWJodXRhXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTWFoYVN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICByZXQucmVuZGVyTWFoYUNvbnRleHQgPSA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgIGZzcGF0aDogcmV0LmRvY0luZm8ubWV0YWRhdGEubGF5b3V0LFxuICAgICAgICBjb250ZW50OiByZXQucmVuZGVyZWRMYXlvdXRcbiAgICAgICAgICAgID8gcmV0LnJlbmRlcmVkTGF5b3V0IDogcmV0LnJlbmRlcmVkRmlyc3QsXG4gICAgICAgIGJvZHk6IHJldC5yZW5kZXJlZExheW91dFxuICAgICAgICAgICAgPyByZXQucmVuZGVyZWRMYXlvdXQgOiByZXQucmVuZGVyZWRGaXJzdCxcbiAgICAgICAgbWV0YWRhdGE6IHt9XG4gICAgfTtcblxuICAgIHJldC5yZW5kZXJNYWhhQ29udGV4dC5tZXRhZGF0YVxuICAgICAgICA9IGNvcHlQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgcmV0LnJlbmRlck1haGFDb250ZXh0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgcmV0LmRvY0luZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHJldC5kb2NJbmZvPy5tZXRhZGF0YT8uY29uZmlnPy5tYWhhYmh1dGFDb25maWcpIHtcbiAgICAgICAgICAgIG1haGFiaHV0YS5jb25maWcocmV0LmRvY0luZm8/Lm1ldGFkYXRhPy5jb25maWc/Lm1haGFiaHV0YUNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldC5yZW5kZXJlZE1haGEgPSAgYXdhaXQgbWFoYWJodXRhLnByb2Nlc3NBc3luYyhcbiAgICAgICAgICAgIHJldC5yZW5kZXJNYWhhQ29udGV4dC5jb250ZW50LCByZXQucmVuZGVyTWFoYUNvbnRleHQubWV0YWRhdGEsXG4gICAgICAgICAgICByZXQuY29uZmlnLm1haGFmdW5jcyxcbiAgICAgICAgICAgIC8vIEZvciBwZXJmb3JtYW5jZSBjb2xsZWN0aW9uXG4gICAgICAgICAgICBjb25maWcucGVyZkRhdGFEaXIgXG4gICAgICAgICAgICA/IG5ldyBGaWxlc3lzdGVtUGVyZkRhdGFTdG9yZShjb25maWcucGVyZkRhdGFEaXIpXG4gICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGNvbmZpZy5wZXJmRGF0YURpciBcbiAgICAgICAgICAgID8gcmV0LmRvY0luZm8udnBhdGhcbiAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICk7XG4gICAgfSBjYXRjaCAoZTIpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYEVycm9yIHdpdGggTWFoYWJodXRhICR7cmV0LmRvY0luZm8udnBhdGh9IHdpdGggJHtyZXQuZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gJHtlMi5zdGFjayA/IGUyLnN0YWNrIDogZTJ9YCk7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICAvLyBVc2UgbGF5b3V0IHJlc3VsdCBvciBmaXJzdCByZW5kZXIgYXMgZmFsbGJhY2tcbiAgICAgICAgcmV0LnJlbmRlcmVkTWFoYSA9IHJldC5yZW5kZXJNYWhhQ29udGV4dC5jb250ZW50O1xuICAgIH1cblxuICAgIHJldC5yZXN1bHRzLnJlbmRlck1haGFFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAvLyBFTkQgTWFoYWJodXRhXG5cbiAgICBpZiAoY29uZmlnLmRlY29tbWVudCkge1xuICAgICAgICByZXQucmVuZGVyZWRNYWhhID0gZGVjb21tZW50KHJldC5yZW5kZXJlZE1haGEpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlbmRlckRlc3QgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgIHJldC5jb25maWcucmVuZGVyVG8sIHJldC5kb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlckRlc3QpLCB7XG4gICAgICAgICAgICByZWN1cnNpdmU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyRGVzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQucmVuZGVyZWRNYWhhLCAndXRmLTgnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKSk7XG4gICAgfVxuXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyRW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZWxhcHNlZCB0aW1lc1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydDtcbiAgICB9XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlckxheW91dFN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckxheW91dEVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0U3RhcnQ7XG4gICAgfVxuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJNYWhhU3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhRWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlck1haGFFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJNYWhhU3RhcnQ7XG4gICAgfVxuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyVG90YWxFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyU3RhcnQ7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50ICR7cmV0LnZwYXRofWAsIHJldCk7XG4gICAgcmV0dXJuIHJldC5yZXN1bHRzO1xufVxuXG4vKipcbiAqIERldGVybWluZSB3aGV0aGVyIGEgZG9jdW1lbnQgY2FuIGJlIHNraXBwZWQgYmVjYXVzZSBpdHMgZXhpc3RpbmdcbiAqIG91dHB1dCBmaWxlIGlzIHVwLXRvLWRhdGUuXG4gKlxuICogQSBkb2N1bWVudCBpcyBjb25zaWRlcmVkIHVwLXRvLWRhdGUgd2hlbiBhbiBvdXRwdXQgZmlsZSBleGlzdHMgYW5kXG4gKiBpcyBuZXdlciB0aGFuIEJPVEg6XG4gKlxuICogICAxLiB0aGUgc291cmNlIGRvY3VtZW50LCBhbmRcbiAqICAgMi4gdGhlIGxheW91dCB0ZW1wbGF0ZSAoaWYgYW55KSB1c2VkIGJ5IHRoZSBkb2N1bWVudC5cbiAqXG4gKiBBcyBkZXNjcmliZWQgaW4gaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzLzYxXG4gKiBpdCBpcyBub3QgZmVhc2libGUgdG8gZGV0ZXJtaW5lIHRoZSBzZXQgb2YgcGFydGlhbHMgdXNlZCBieSBhIGdpdmVuXG4gKiBkb2N1bWVudCwgc28gY2hhbmdlcyB0byBwYXJ0aWFscyBhcmUgTk9UIGRldGVjdGVkIGhlcmUuICBVc2VcbiAqIGAtLWZvcmNlLXJlbmRlci1hbGxgIChvciB0aGUgYGZvcmNlUmVuZGVyQWxsYCBvcHRpb24pIHRvIGZvcmNlIGV2ZXJ5XG4gKiBkb2N1bWVudCB0byBiZSByZS1yZW5kZXJlZCwgZm9yIGV4YW1wbGUgYWZ0ZXIgZWRpdGluZyBhIHBhcnRpYWwuXG4gKlxuICogQHBhcmFtIGNvbmZpZyAgIEFrYXNoYUNNUyBDb25maWd1cmF0aW9uXG4gKiBAcGFyYW0gZG9jSW5mbyAgVGhlIGRvY3VtZW50IGluZm8gb2JqZWN0IChmcm9tIGRvY3VtZW50c0NhY2hlLmZpbmQpXG4gKiBAcmV0dXJucyBgdHJ1ZWAgd2hlbiByZW5kZXJpbmcgY2FuIGJlIHNraXBwZWQsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNEb2N1bWVudFVwVG9EYXRlKFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvXG4pOiBQcm9taXNlPGJvb2xlYW4+IHtcblxuICAgIC8vIFdpdGhvdXQgYSBrbm93biByZW5kZXIgcGF0aCB3ZSBjYW5ub3QgbG9jYXRlIHRoZSBvdXRwdXQgZmlsZS5cbiAgICBpZiAoIWRvY0luZm8gfHwgIWRvY0luZm8ucmVuZGVyUGF0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gT25seSBIVE1MIGRvY3VtZW50cyBwYXNzIHRocm91Z2ggdGhlIGxheW91dC9wYXJ0aWFsIHBpcGVsaW5lLlxuICAgIC8vIENTUyBmaWxlcyBhbmQgY29waWVkIGFzc2V0cyBhcmUgY2hlYXAgYW5kIGhhdmUgbm8gbGF5b3V0XG4gICAgLy8gZGVwZW5kZW5jeSwgc28gYWx3YXlzIHJlLXByb2Nlc3MgdGhlbSB0byBzdGF5IGNvcnJlY3QuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChkb2NJbmZvLnZwYXRoKTtcbiAgICBpZiAoIXJlbmRlcmVyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgcmMgPSA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgIGZzcGF0aDogZG9jSW5mby52cGF0aCxcbiAgICAgICAgY29udGVudDogZG9jSW5mby5kb2NDb250ZW50LFxuICAgICAgICBib2R5OiBkb2NJbmZvLmRvY0JvZHksXG4gICAgICAgIG1ldGFkYXRhOiBkb2NJbmZvLm1ldGFkYXRhXG4gICAgfTtcbiAgICBpZiAocmVuZGVyZXIucmVuZGVyRm9ybWF0KHJjKSAhPT0gJ0hUTUwnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBMb2NhdGUgdGhlIG91dHB1dCBmaWxlIGFuZCByZWFkIGl0cyBtb2RpZmljYXRpb24gdGltZS5cbiAgICBsZXQgb3V0cHV0TXRpbWVNcztcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBkb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICBjb25zdCBvdXRTdGF0cyA9IGF3YWl0IGZzcC5zdGF0KHJlbmRlckRlc3QpO1xuICAgICAgICBvdXRwdXRNdGltZU1zID0gb3V0U3RhdHMubXRpbWVNcztcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gTm8gb3V0cHV0IGZpbGUgKG9yIG5vdCByZWFkYWJsZSkgPT4gbXVzdCByZW5kZXIuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBUaGUgb3V0cHV0IG11c3QgYmUgbmV3ZXIgdGhhbiB0aGUgc291cmNlIGRvY3VtZW50LlxuICAgIGlmICh0eXBlb2YgZG9jSW5mby5tdGltZU1zICE9PSAnbnVtYmVyJ1xuICAgICB8fCBkb2NJbmZvLm10aW1lTXMgPiBvdXRwdXRNdGltZU1zXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBUaGUgb3V0cHV0IG11c3QgYmUgbmV3ZXIgdGhhbiB0aGUgbGF5b3V0IHRlbXBsYXRlLCBpZiBhbnkuXG4gICAgaWYgKGRvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dHMgPSBjb25maWcuYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGU7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXQgPSBhd2FpdCBsYXlvdXRzLmZpbmQoZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQpO1xuICAgICAgICAgICAgLy8gSWYgdGhlIGxheW91dCBjYW5ub3QgYmUgZm91bmQsIGZhbGwgdGhyb3VnaCB0byByZW5kZXJpbmdcbiAgICAgICAgICAgIC8vIHNvIHRoZSBleGlzdGluZyBlcnJvciByZXBvcnRpbmcgaW4gcmVuZGVyRG9jdW1lbnQgcnVucy5cbiAgICAgICAgICAgIGlmICghbGF5b3V0XG4gICAgICAgICAgICAgfHwgdHlwZW9mIGxheW91dC5tdGltZU1zICE9PSAnbnVtYmVyJ1xuICAgICAgICAgICAgIHx8IGxheW91dC5tdGltZU1zID4gb3V0cHV0TXRpbWVNc1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIE9wdGlvbnMgY29udHJvbGxpbmcgdGhlIGJlaGF2aW9yIG9mIHJlbmRlci5cbiAqL1xuZXhwb3J0IHR5cGUgUmVuZGVyT3B0aW9ucyA9IHtcbiAgICAvKipcbiAgICAgKiBXaGVuIHRydWUsIGV2ZXJ5IGRvY3VtZW50IGlzIHJlLXJlbmRlcmVkIHJlZ2FyZGxlc3Mgb2ZcbiAgICAgKiBvdXRwdXQgZmlsZSB0aW1lc3RhbXBzLiAgVGhpcyBtYXRjaGVzIHRoZSBoaXN0b3JpY2FsXG4gICAgICogYmVoYXZpb3IgYW5kIGlzIGV4cG9zZWQgb24gdGhlIENMSSBhcyBgLS1mb3JjZS1yZW5kZXItYWxsYC5cbiAgICAgKi9cbiAgICBmb3JjZVJlbmRlckFsbD86IGJvb2xlYW47XG59O1xuXG4vKipcbiAqIFJlbmRlciBhbGwgdGhlIGRvY3VtZW50cyBpbiBhIHNpdGUgdXNpbmcgcmVuZGVyRG9jdW1lbnQsXG4gKiBsaW1pdGluZyB0aGUgbnVtYmVyIG9mIHNpbXVsdGFuZW91cyByZW5kZXJpbmcgdGFza3NcbiAqIHRvIHRoZSBudW1iZXIgaW4gY29uZmlnLmNvbmN1cnJlbmN5LlxuICogXG4gKiBSZXR1cm5zIHN0cnVjdHVyZWQgUmVuZGVyaW5nUmVzdWx0cyBkYXRhIGluc3RlYWQgb2YgdGV4dCBzdHJpbmdzLlxuICpcbiAqIFVubGVzcyBgb3B0aW9ucy5mb3JjZVJlbmRlckFsbGAgaXMgc2V0LCBkb2N1bWVudHMgd2hvc2Ugb3V0cHV0XG4gKiBmaWxlIGlzIG5ld2VyIHRoYW4gYm90aCB0aGUgc291cmNlIGRvY3VtZW50IGFuZCBpdHMgbGF5b3V0XG4gKiB0ZW1wbGF0ZSBhcmUgc2tpcHBlZCAoc2VlIGlzRG9jdW1lbnRVcFRvRGF0ZSkuXG4gKlxuICogQHBhcmFtIGNvbmZpZ1xuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgcmVuZGVyaW5nIGNvbnRyb2xzIChlLmcuIGZvcmNlUmVuZGVyQWxsKVxuICogQHJldHVybnMgQXJyYXkgb2YgUmVuZGVyaW5nUmVzdWx0cyB3aXRoIHBlcmZvcm1hbmNlIGFuZCBlcnJvciBkYXRhXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXIoXG4gICAgY29uZmlnLFxuICAgIG9wdGlvbnM/OiBSZW5kZXJPcHRpb25zXG4pOiBQcm9taXNlPEFycmF5PFJlbmRlcmluZ1Jlc3VsdHM+PiB7XG5cbiAgICBjb25zdCBmb3JjZVJlbmRlckFsbCA9IG9wdGlvbnM/LmZvcmNlUmVuZGVyQWxsID09PSB0cnVlO1xuXG4gICAgY29uc3QgZG9jdW1lbnRzID0gPERvY3VtZW50c0NhY2hlPmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIC8vIGF3YWl0IGRvY3VtZW50cy5pc1JlYWR5KCk7XG4gICAgLy8gY29uc29sZS5sb2coJ0NBTExJTkcgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQnKTtcbiAgICBhd2FpdCBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCgpO1xuICAgIFxuICAgIC8vIDEuIEdhdGhlciBsaXN0IG9mIGZpbGVzIGZyb20gUmVuZGVyRmlsZUNhY2hlXG4gICAgY29uc3QgZmlsZXogPSBhd2FpdCBkb2N1bWVudHMucGF0aHMoKTtcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyIGZpbGV6ICR7ZmlsZXoubGVuZ3RofWApO1xuXG4gICAgLy8gMi4gRXhjbHVkZSBhbnkgdGhhdCB3ZSB3YW50IHRvIGlnbm9yZVxuICAgIGNvbnN0IGZpbGV6MiA9IFtdIGFzIEFycmF5PHtcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgIH0+O1xuICAgIC8vIERvY3VtZW50cyB0aGF0IHdlcmUgc2tpcHBlZCBiZWNhdXNlIHRoZWlyIG91dHB1dCBpcyB1cC10by1kYXRlLlxuICAgIC8vIFRoZXNlIGFyZSByZXBvcnRlZCBhbG9uZ3NpZGUgdGhlIHJlbmRlcmVkIGRvY3VtZW50cy5cbiAgICBjb25zdCBza2lwcGVkUmVzdWx0cyA9IFtdIGFzIEFycmF5PFJlbmRlcmluZ1Jlc3VsdHM+O1xuICAgIGZvciAobGV0IGVudHJ5IG9mIGZpbGV6KSB7XG4gICAgICAgIGxldCBpbmNsdWRlID0gdHJ1ZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZW50cnkpO1xuICAgICAgICBsZXQgc3RhdHM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdGF0cyA9IGF3YWl0IGZzcC5zdGF0KGVudHJ5LmZzcGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikgeyBzdGF0cyA9IHVuZGVmaW5lZDsgfVxuICAgICAgICBpZiAoIWVudHJ5KSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIGVsc2UgaWYgKCFzdGF0cyB8fCBzdGF0cy5pc0RpcmVjdG9yeSgpKSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIC8vIFRoaXMgc2hvdWxkIGFyaXNlIHVzaW5nIGFuIGlnbm9yZSBjbGF1c2VcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcuRFNfU3RvcmUnKSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIC8vIGVsc2UgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkudnBhdGgpID09PSAnLnBsYWNlaG9sZGVyJykgaW5jbHVkZSA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChpbmNsdWRlKSB7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZW50cnkudnBhdGgpO1xuXG4gICAgICAgICAgICAvLyBTa2lwIGRvY3VtZW50cyB3aG9zZSBvdXRwdXQgZmlsZSBpcyBuZXdlciB0aGFuIGJvdGggdGhlXG4gICAgICAgICAgICAvLyBzb3VyY2UgZG9jdW1lbnQgYW5kIGl0cyBsYXlvdXQgdGVtcGxhdGUsIHVubGVzcyB0aGVcbiAgICAgICAgICAgIC8vIGNhbGxlciBmb3JjZWQgYSBmdWxsIHJlLXJlbmRlci5cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ha2FzaGFjbXMvYWthc2hhcmVuZGVyL2lzc3Vlcy82MVxuICAgICAgICAgICAgaWYgKCFmb3JjZVJlbmRlckFsbFxuICAgICAgICAgICAgICYmIGF3YWl0IGlzRG9jdW1lbnRVcFRvRGF0ZShjb25maWcsIGluZm8pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBza2lwcGVkUmVzdWx0cy5wdXNoKDxSZW5kZXJpbmdSZXN1bHRzPntcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyRm9ybWF0OiAnSFRNTCcsXG4gICAgICAgICAgICAgICAgICAgIHNraXBwZWQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlIHF1ZXVlIGlzIGFuIGFycmF5IG9mIHR1cGxlcyBjb250YWluaW5nIHRoZVxuICAgICAgICAgICAgLy8gY29uZmlnIG9iamVjdCBhbmQgdGhlIHBhdGggc3RyaW5nXG4gICAgICAgICAgICBmaWxlejIucHVzaCh7XG4gICAgICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXG4gICAgICAgICAgICAgICAgaW5mbzogaW5mb1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlciBmaWxlejIgYWZ0ZXIgaWdub3JlICR7ZmlsZXoyLmxlbmd0aH1gKTtcblxuICAgIC8vIDMuIE1ha2UgYSBmYXN0cSB0byBwcm9jZXNzIHVzaW5nIHJlbmRlckRvY3VtZW50LFxuICAgIC8vICAgIHB1c2hpbmcgcmVzdWx0cyB0byB0aGUgcmVzdWx0cyBhcnJheVxuXG4gICAgLy8gVGhpcyBzZXRzIHVwIHRoZSBxdWV1ZSBwcm9jZXNzb3JcbiAgICAvLyBUaGUgY29uY3VycmVuY3kgc2V0dGluZyBsZXRzIHVzIHByb2Nlc3MgZG9jdW1lbnRzXG4gICAgLy8gaW4gcGFyYWxsZWwgd2hpbGUgbGltaXRpbmcgdG90YWwgaW1wYWN0LlxuICAgIGNvbnN0IHF1ZXVlOiBxdWV1ZUFzUHJvbWlzZWQ8e1xuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgfT4gPSBmYXN0cS5wcm9taXNlKFxuXG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgaW52b2tlZCBmb3IgZWFjaCBlbnRyeSBpbiB0aGVcbiAgICAgICAgLy8gcXVldWUuIEl0IGhhbmRsZXMgcmVuZGVyaW5nIHRoZSBxdWV1ZVxuICAgICAgICAvLyBUaGUgcXVldWUgaGFzIGNvbmZpZyBvYmplY3RzIGFuZCBwYXRoIHN0cmluZ3NcbiAgICAgICAgLy8gd2hpY2ggaXMgZXhhY3RseSB3aGF0J3MgcmVxdWlyZWQgYnlcbiAgICAgICAgLy8gcmVuZGVyRG9jdW1lbnRcbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnRJblF1ZXVlKGVudHJ5KVxuICAgICAgICAgICAgOiBQcm9taXNlPFJlbmRlcmluZ1Jlc3VsdHM+XG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVuZGVyRG9jdW1lbnQoXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5LmNvbmZpZywgZW50cnkuaW5mb1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYERPTkUgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgRVJST1IgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnLmNvbmN1cnJlbmN5KTtcblxuICAgIC8vIHF1ZXVlLnB1c2ggcmV0dXJucyBhIFByb21pc2UgdGhhdCdzIGZ1bGZpbGxlZCB3aGVuXG4gICAgLy8gdGhlIHRhc2sgZmluaXNoZXMuXG4gICAgLy8gSGVuY2Ugd2FpdEZvciBpcyBhbiBhcnJheSBvZiBQcm9taXNlcy5cbiAgICBjb25zdCB3YWl0Rm9yID0gW107XG4gICAgZm9yIChsZXQgZW50cnkgb2YgZmlsZXoyKSB7XG4gICAgICAgIHdhaXRGb3IucHVzaChxdWV1ZS5wdXNoKGVudHJ5KSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBhdXRvbWF0aWNhbGx5IHdhaXRzIGZvciBhbGwgdGhvc2VcbiAgICAvLyBQcm9taXNlcyB0byByZXNvbHZlLCB3aGlsZSBtYWtpbmcgdGhlIHJlc3VsdHNcbiAgICAvLyBhcnJheSBjb250YWluIHJlc3VsdHMuXG4gICAgY29uc3QgcmVzdWx0czogQXJyYXk8UmVuZGVyaW5nUmVzdWx0cz4gPSBbXTtcbiAgICBmb3IgKGxldCByZXN1bHQgb2Ygd2FpdEZvcikge1xuICAgICAgICByZXN1bHRzLnB1c2goYXdhaXQgcmVzdWx0KTtcbiAgICB9XG5cbiAgICAvLyBJbmNsdWRlIHRoZSBkb2N1bWVudHMgdGhhdCB3ZXJlIHNraXBwZWQgYmVjYXVzZSB0aGVpclxuICAgIC8vIG91dHB1dCB3YXMgdXAtdG8tZGF0ZSwgc28gY2FsbGVycyBjYW4gcmVwb3J0IHRoZW0uXG4gICAgZm9yIChsZXQgc2tpcHBlZCBvZiBza2lwcGVkUmVzdWx0cykge1xuICAgICAgICByZXN1bHRzLnB1c2goc2tpcHBlZCk7XG4gICAgfVxuXG4gICAgLy8gNC4gSW52b2tlIGhvb2tTaXRlUmVuZGVyZWRcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdJbnZva2luZyBob29rU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGF3YWl0IGNvbmZpZy5ob29rU2l0ZVJlbmRlcmVkKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2spO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhvb2tTaXRlUmVuZGVyZWQgZmFpbGVkIGJlY2F1c2UgJHtlfWApO1xuICAgIH1cblxuICAgIC8vIDUuIHJldHVybiByZXN1bHRzXG4gICAgcmV0dXJuIHJlc3VsdHM7XG59O1xuIl19