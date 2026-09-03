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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRTdCLE9BQU8sU0FBUyxFQUFFLEVBQ2QsdUJBQXVCLEVBQzFCLE1BQU0sV0FBVyxDQUFDO0FBRW5CLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQVUxQixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFrRTlDLFNBQVMsbUJBQW1CLENBQ3hCLE1BQXFCLEVBQ3JCLE9BQU87SUFFUCxNQUFNLEdBQUcsR0FBa0I7UUFDdkIsTUFBTTtRQUVOLGtCQUFrQixFQUFvQjtZQUNsQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEtBQUs7WUFDckIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxVQUFVO1lBQzNCLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTztZQUNyQixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7U0FDN0I7UUFFRCxRQUFRLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUNqQixPQUFPLENBQUMsS0FBSyxDQUM1QjtRQUVELE9BQU87UUFDUCxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7UUFDcEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1FBQzlCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtRQUM5QixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7UUFFekIsT0FBTyxFQUFvQjtZQUN2QixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7WUFDcEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1lBQzlCLFdBQVcsRUFBRSxXQUFXLENBQUMsR0FBRyxFQUFFO1lB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QU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxvQkFBb0I7SUFDcEIsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQztBQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCAqIGFzIGRhdGEgZnJvbSAnLi9kYXRhLmpzJztcbmltcG9ydCBtYWhhYmh1dGEsIHtcbiAgICBGaWxlc3lzdGVtUGVyZkRhdGFTdG9yZVxufSBmcm9tICdtYWhhYmh1dGEnO1xuXG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHR5cGUgeyBxdWV1ZUFzUHJvbWlzZWQgfSBmcm9tIFwiZmFzdHFcIjtcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24gfSBmcm9tICcuL2luZGV4LmpzJztcbmltcG9ydCB7IFJlbmRlcmVyLCBSZW5kZXJpbmdDb250ZXh0IH0gZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0IHtcbiAgICBEb2N1bWVudHNDYWNoZVxufSBmcm9tICcuL2NhY2hlL2NhY2hlLXNxbGl0ZS5qcyc7XG5pbXBvcnQge1xuICAgIERvY3VtZW50XG59IGZyb20gJy4vY2FjaGUvc2NoZW1hLmpzJztcbmltcG9ydCB7IHBlcmZvcm1hbmNlIH0gZnJvbSAnbm9kZTpwZXJmX2hvb2tzJztcblxuLy8gRm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9ha2FzaGFjbXMvYWthc2hhcmVuZGVyL2lzc3Vlcy8xMDNcbi8vIFRoZSBpZGVhIGlzIG5vcm1hbGl6aW5nIHRoZSBkYXRhIHJldHVybmVkLiAgVGhpcyBzaG91bGRcbi8vIGVsaW1pbmF0ZSB0aGUgbmVlZCBmb3IgdGhlIGRhdGEgbW9kdWxlLiAgVGhpcyBzaG91bGRcbi8vIGltcHJvdmUgdGhlIGFuYWx5emVhYmlsaXR5IG9mIGRhdGEgYWJvdXQgdGhlIHJlbmRlcmluZyBwcm9jZXNzLlxuXG5leHBvcnQgdHlwZSBSZW5kZXJpbmdSZXN1bHRzID0ge1xuXG4gICAgdnBhdGg/OiBzdHJpbmc7XG4gICAgcmVuZGVyUGF0aD86IHN0cmluZztcblxuICAgIHJlbmRlckZvcm1hdDogc3RyaW5nO1xuXG4gICAgcmVuZGVyU3RhcnQ/OiBudW1iZXI7XG4gICAgcmVuZGVyRW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyRmlyc3RTdGFydD86IG51bWJlcjtcbiAgICByZW5kZXJGaXJzdEVuZD86IG51bWJlcjtcblxuICAgIHJlbmRlckxheW91dFN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlckxheW91dEVuZD86IG51bWJlcjtcblxuICAgIHJlbmRlck1haGFTdGFydD86IG51bWJlcjtcbiAgICByZW5kZXJNYWhhRW5kPzogbnVtYmVyO1xuXG4gICAgLy8gRWxhcHNlZCB0aW1lIGNhbGN1bGF0aW9uc1xuICAgIHJlbmRlckZpcnN0RWxhcHNlZD86IG51bWJlcjtcbiAgICByZW5kZXJMYXlvdXRFbGFwc2VkPzogbnVtYmVyO1xuICAgIHJlbmRlck1haGFFbGFwc2VkPzogbnVtYmVyO1xuICAgIHJlbmRlclRvdGFsRWxhcHNlZD86IG51bWJlcjtcblxuICAgIC8vIFRydWUgd2hlbiB0aGlzIGRvY3VtZW50IHdhcyBub3QgcmUtcmVuZGVyZWQgYmVjYXVzZSB0aGVcbiAgICAvLyBleGlzdGluZyBvdXRwdXQgZmlsZSBpcyBuZXdlciB0aGFuIHRoZSBzb3VyY2UgZG9jdW1lbnQgYW5kXG4gICAgLy8gaXRzIGxheW91dCB0ZW1wbGF0ZS4gIFNlZSByZW5kZXIgYW5kIHRoZSAtLWZvcmNlLXJlbmRlci1hbGxcbiAgICAvLyBvcHRpb24uICBodHRwczovL2dpdGh1Yi5jb20vYWthc2hhY21zL2FrYXNoYXJlbmRlci9pc3N1ZXMvNjFcbiAgICBza2lwcGVkPzogYm9vbGVhbjtcblxuICAgIGVycm9ycz86IEFycmF5PEVycm9yPjtcbn07XG5cbi8vIENvbGxlY3QgYWxsIHJlcXVpcmVkIGRhdGEgaW4gYW4gaW5zdGFuY2Ugb2YgdGhpcyBvYmplY3QuXG50eXBlIFJlbmRlcmluZ0RhdGEgPSB7XG4gICAgY29uZmlnPzogQ29uZmlndXJhdGlvbjtcbiAgICByZW5kZXJlcj86IFJlbmRlcmVyO1xuXG4gICAgZG9jSW5mbz86IGFueTtcblxuICAgIHZwYXRoPzogc3RyaW5nO1xuICAgIHJlbmRlclBhdGg/OiBzdHJpbmc7XG4gICAgbW91bnRQb2ludD86IHN0cmluZztcbiAgICByZW5kZXJUbz86IHN0cmluZztcblxuICAgIHJlbmRlckZpcnN0Q29udGV4dD86IFJlbmRlcmluZ0NvbnRleHQ7XG4gICAgcmVuZGVyZWRGaXJzdD86IHN0cmluZztcblxuICAgIGxheW91dEZvcm1hdD86IHN0cmluZztcbiAgICByZW5kZXJMYXlvdXRDb250ZXh0PzogUmVuZGVyaW5nQ29udGV4dDtcbiAgICByZW5kZXJlZExheW91dD86IHN0cmluZztcblxuICAgIHJlbmRlck1haGFDb250ZXh0PzogUmVuZGVyaW5nQ29udGV4dDtcbiAgICByZW5kZXJlZE1haGE/OiBzdHJpbmc7XG5cbiAgICByZXN1bHRzPzogUmVuZGVyaW5nUmVzdWx0cztcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlbmRlcmluZ0RhdGEoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm9cbik6IFJlbmRlcmluZ0RhdGEge1xuICAgIGNvbnN0IHJldCA9IDxSZW5kZXJpbmdEYXRhPntcbiAgICAgICAgY29uZmlnLFxuXG4gICAgICAgIHJlbmRlckZpcnN0Q29udGV4dDogPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgY29udGVudDogZG9jSW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgYm9keTogZG9jSW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGRvY0luZm8ubWV0YWRhdGFcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJlcjogY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLnZwYXRoXG4gICAgICAgICksXG5cbiAgICAgICAgZG9jSW5mbyxcbiAgICAgICAgdnBhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgIHJlbmRlclBhdGg6IGRvY0luZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgbW91bnRQb2ludDogZG9jSW5mby5tb3VudFBvaW50LFxuICAgICAgICByZW5kZXJUbzogY29uZmlnLnJlbmRlclRvLFxuXG4gICAgICAgIHJlc3VsdHM6IDxSZW5kZXJpbmdSZXN1bHRzPntcbiAgICAgICAgICAgIHZwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogZG9jSW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyU3RhcnQ6IHBlcmZvcm1hbmNlLm5vdygpLFxuICAgICAgICAgICAgZXJyb3JzOiBuZXcgQXJyYXk8RXJyb3I+KClcbiAgICAgICAgfVxuICAgIH07XG4gICAgaWYgKHJldC5yZW5kZXJlcikge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGb3JtYXQgPSByZXQucmVuZGVyZXIucmVuZGVyRm9ybWF0KHJldC5yZW5kZXJGaXJzdENvbnRleHQpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmZ1bmN0aW9uIGNvcHlQcm9wZXJ0aWVzKGRlc3Q6IGFueSwgc3JjOiBhbnksIGV4Y2VwdExheW91dDogYm9vbGVhbikge1xuICAgIGZvciAodmFyIHlwcm9wIGluIHNyYykge1xuICAgICAgICBpZiAoZXhjZXB0TGF5b3V0ICYmIHlwcm9wID09PSAnbGF5b3V0JykgY29udGludWU7XG4gICAgICAgIGRlc3RbeXByb3BdID0gc3JjW3lwcm9wXTtcbiAgICB9XG4gICAgcmV0dXJuIGRlc3Q7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlbmRlckNTU0ZpbGUocmV0OiBSZW5kZXJpbmdEYXRhKTogUHJvbWlzZTxSZW5kZXJpbmdEYXRhPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRm9ybWF0ID0gJ0NTUyc7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgICAgICAvLyBSZW5kZXIgdGhlIENTUyBjb250ZW50XG4gICAgICAgIHJldC5yZW5kZXJlZEZpcnN0ID0gYXdhaXQgcmV0LnJlbmRlcmVyLnJlbmRlcihyZXQucmVuZGVyRmlyc3RDb250ZXh0KTtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgICAgICAvLyBXcml0ZSB0aGUgcmVuZGVyZWQgQ1NTIHRvIG91dHB1dFxuICAgICAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKHJldC5jb25maWcucmVuZGVyVG8sIHJldC5kb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlckRlc3QpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJEZXN0LCByZXQucmVuZGVyZWRGaXJzdCwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoU3RyaW5nKGVycm9yKSkpO1xuICAgIH1cbiAgICAvLyBDYWxjdWxhdGUgZWxhcHNlZCB0aW1lc1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydDtcbiAgICB9XG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RWxhcHNlZCA9IDA7XG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVsYXBzZWQgPSAwO1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyVG90YWxFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyU3RhcnQ7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckNTU0ZpbGUgJHtyZXQudnBhdGh9YCwgcmV0KTtcblxuICAgIHJldHVybiByZXQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvcHlBc3NldEZpbGUocmV0OiBSZW5kZXJpbmdEYXRhKTogUHJvbWlzZTxSZW5kZXJpbmdEYXRhPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRm9ybWF0ID0gJ0NPUFknO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAgICAgLy8gQ29weSB0aGUgYXNzZXQgZmlsZSB0byBvdXRwdXQgZGlyZWN0b3J5XG4gICAgICAgIGNvbnN0IHJlbmRlckRlc3QgPSBwYXRoLmpvaW4ocmV0LmNvbmZpZy5yZW5kZXJUbywgcmV0LmRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICBhd2FpdCBmc3AuY29weUZpbGUocmV0LmRvY0luZm8uZnNwYXRoLCByZW5kZXJEZXN0KTtcblxuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKSk7XG4gICAgfVxuXG4gICAgLy8gQ2FsY3VsYXRlIGVsYXBzZWQgdGltZXNcbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCAtIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQ7XG4gICAgfVxuICAgIHJldC5yZXN1bHRzLnJlbmRlckxheW91dEVsYXBzZWQgPSAwO1xuICAgIHJldC5yZXN1bHRzLnJlbmRlck1haGFFbGFwc2VkID0gMDtcbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyU3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlclRvdGFsRWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckVuZCAtIHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0O1xuICAgIH1cblxuICAgIC8vIFVzZSB0aGlzIHRvIHZlcmlmeSBlcnJvciBoYW5kbGluZ1xuICAgIC8vIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKG5ldyBFcnJvcihgUmFuZG9tIGVycm9yYCkpO1xuXG4gICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldEZpbGUgJHtyZXQudnBhdGh9YCwgcmV0KTtcbiAgICByZXR1cm4gcmV0O1xufVxuXG5cblxuLyoqXG4gKiBSZW5kZXIgYSBzaW5nbGUgZG9jdW1lbnQsIGFjY291bnRpbmcgZm9yIHRoZSBtYWluIGNvbnRlbnQsXG4gKiBhIGxheW91dCB0ZW1wbGF0ZSAoaWYgYW55KSwgYW5kIE1haGFiaHV0YSAoaWYgdGhlIGNvbnRlbnRcbiAqIG91dHB1dCBpcyBIVE1MKS4gIFRoaXMgYWxzbyBoYW5kbGVzIHJlbmRlcmluZyBvdGhlciB0eXBlc1xuICogb2YgY29udGVudCBzdWNoIGFzIExFU1MgQ1NTIGZpbGVzLlxuICpcbiAqIFJldHVybnMgc3RydWN0dXJlZCBSZW5kZXJpbmdSZXN1bHRzIGRhdGEsIGluY2x1ZGluZyBwcmVjaXNlXG4gKiBwZXItc3RhZ2UgZWxhcHNlZCB0aW1lcyAodmlhIHBlcmZvcm1hbmNlLm5vdygpKSBhbmQgYW4gZXJyb3JzXG4gKiBhcnJheSwgaW5zdGVhZCBvZiB0aHJvd2luZyBvbiBlcnJvci5cbiAqXG4gKiBAcGFyYW0gY29uZmlnXG4gKiBAcGFyYW0gZG9jSW5mb1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvXG4pOiBQcm9taXNlPFJlbmRlcmluZ1Jlc3VsdHM+IHtcblxuICAgIC8vIENyZWF0ZSB0aGUgbWFzdGVyIG9iamVjdCB0byBob2xkIGFsbCBkYXRhXG4gICAgY29uc3QgcmV0OiBSZW5kZXJpbmdEYXRhID0gY3JlYXRlUmVuZGVyaW5nRGF0YShjb25maWcsIGRvY0luZm8pO1xuXG4gICAgLy8gUGVlbCBvZmYgdG8gbW9kZS1zcGVjaWZpYyBmdW5jdGlvbnNcbiAgICBpZiAocmV0Py5yZW5kZXJlcj8ucmVuZGVyRm9ybWF0KHJldC5yZW5kZXJGaXJzdENvbnRleHQpID09PSAnQ1NTJykge1xuICAgICAgICBjb25zdCBjc3NSZXN1bHQgPSBhd2FpdCByZW5kZXJDU1NGaWxlKHJldCk7XG4gICAgICAgIHJldHVybiBjc3NSZXN1bHQucmVzdWx0cztcbiAgICB9IGVsc2UgaWYgKCFyZXQucmVuZGVyZXJcbiAgICAgfHwgKHJldC5yZW5kZXJlci5yZW5kZXJGb3JtYXQocmV0LnJlbmRlckZpcnN0Q29udGV4dCkgIT09ICdIVE1MJylcbiAgICApIHtcbiAgICAgICAgY29uc3QgYXNzZXRSZXN1bHQgPSBhd2FpdCBjb3B5QXNzZXRGaWxlKHJldCk7XG4gICAgICAgIHJldHVybiBhc3NldFJlc3VsdC5yZXN1bHRzO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSBpdCBpcyBIVE1MXG4gICAgLy8gVGhpcyBpcyB3aGVyZSB3ZSByZW5kZXIgdGhlIGNvbnRlbnQsIHRoZW4gcmVuZGVyIHRoYXRcbiAgICAvLyBpbnRvIHRoZSBsYXlvdXQgKGlmIG9uZSBleGlzdHMpLCB0aGVuIHJ1biBNYWhhYmh1dGEuXG5cbiAgICAvLyBUaGVzZSBmdW5jdGlvbnMgYXJlIGR1cGxpY2F0ZXMgYmV0d2VlbiB0aGUgZmlyc3RcbiAgICAvLyB0d28gc3RhZ2VzLiAgU2F2ZSBhIGNvdXBsZSBtaWNyb3NlY29uZHMgYnkgaW5zdGFudGlhdGluZ1xuICAgIC8vIHRoZSBmdW5jdGlvbnMgb25jZS5cbiAgICBjb25zdCBkb1BhcnRpYWwgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgY29uc3QgZG9QYXJ0aWFsU3luYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG5cbiAgICAvLyBGaXJzdCBSZW5kZXJcbiAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBBZGQgbmVjZXNzYXJ5IGl0ZW1zIHRvIHRoZSBtZXRhZGF0YVxuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgcmV0LnJlbmRlckZpcnN0Q29udGV4dC5tZXRhZGF0YS5wYXJ0aWFsID0gZG9QYXJ0aWFsO1xuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLnBhcnRpYWxTeW5jID0gZG9QYXJ0aWFsU3luYztcbiAgICAgICAgcmV0LnJlbmRlckZpcnN0Q29udGV4dC5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLnBsdWdpbiA9IGNvbmZpZy5wbHVnaW47XG5cbiAgICAgICAgLy8gUmVuZGVyIHRoZSBwcmltYXJ5IGNvbnRlbnRcbiAgICAgICAgcmV0LnJlbmRlcmVkRmlyc3QgPSBhd2FpdCByZXQucmVuZGVyZXIucmVuZGVyKHJldC5yZW5kZXJGaXJzdENvbnRleHQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpKTtcbiAgICAgICAgLy8gVXNlIGVtcHR5IHN0cmluZyBhcyBmYWxsYmFjayBpZiByZW5kZXJpbmcgZmFpbHNcbiAgICAgICAgcmV0LnJlbmRlcmVkRmlyc3QgPSAnJztcbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIC8vIEVORCBGaXJzdCBSZW5kZXJcblxuICAgIC8vIExheW91dCBSZW5kZXJcbiAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgaWYgKHJldD8uZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgICAgIC8vIGF3YWl0IGxheW91dHMuaXNSZWFkeSgpO1xuXG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBsYXlvdXRzLmZpbmQocmV0LmRvY0luZm8ubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgTm8gbGF5b3V0IGZvdW5kIGluICR7dXRpbC5pbnNwZWN0KHJldC5jb25maWcubGF5b3V0RGlycyl9IGZvciAke3JldD8uZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gaW4gZmlsZSAke3JldC5kb2NJbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvcik7XG4gICAgICAgICAgICAgICAgLy8gU2tpcCBsYXlvdXQgcmVuZGVyaW5nLCB1c2UgZmlyc3QgcmVuZGVyIHJlc3VsdFxuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJlZExheW91dCA9IHJldC5yZW5kZXJlZEZpcnN0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKFxuICAgICAgICAgICAgICAgICAgICByZXQuZG9jSW5mby5tZXRhZGF0YS5sYXlvdXRcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQgPSA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogcmV0LmRvY0luZm8ubWV0YWRhdGEubGF5b3V0LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBmb3VuZC5kb2NDb250ZW50LFxuICAgICAgICAgICAgICAgICAgICBib2R5OiBmb3VuZC5kb2NCb2R5LFxuICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YToge31cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgPSBjb3B5UHJvcGVydGllcyhcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgID0gY29weVByb3BlcnRpZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldC5kb2NJbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEuY29udGVudCA9IHJldC5yZW5kZXJlZEZpcnN0O1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLnBhcnRpYWwgPSBkb1BhcnRpYWw7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEucGFydGlhbFN5bmMgPSBkb1BhcnRpYWxTeW5jO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLmFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEucGx1Z2luID0gY29uZmlnLnBsdWdpbjtcblxuICAgICAgICAgICAgICAgIC8vIFJlbmRlciB0aGUgbGF5b3V0IGNvbnRlbnRcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyZWRMYXlvdXQgPSBhd2FpdCByZW5kZXJlci5yZW5kZXIocmV0LnJlbmRlckxheW91dENvbnRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZS5zdGFjayA/IGUuc3RhY2sgOiBlfWApO1xuICAgICAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICAgICAgLy8gVXNlIGZpcnN0IHJlbmRlciByZXN1bHQgYXMgZmFsbGJhY2tcbiAgICAgICAgICAgIHJldC5yZW5kZXJlZExheW91dCA9IHJldC5yZW5kZXJlZEZpcnN0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgLy8gRU5EIExheW91dCBSZW5kZXJcblxuICAgIC8vIE1haGFiaHV0YVxuICAgIHJldC5yZXN1bHRzLnJlbmRlck1haGFTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgcmV0LnJlbmRlck1haGFDb250ZXh0ID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICBmc3BhdGg6IHJldC5kb2NJbmZvLm1ldGFkYXRhLmxheW91dCxcbiAgICAgICAgY29udGVudDogcmV0LnJlbmRlcmVkTGF5b3V0XG4gICAgICAgICAgICA/IHJldC5yZW5kZXJlZExheW91dCA6IHJldC5yZW5kZXJlZEZpcnN0LFxuICAgICAgICBib2R5OiByZXQucmVuZGVyZWRMYXlvdXRcbiAgICAgICAgICAgID8gcmV0LnJlbmRlcmVkTGF5b3V0IDogcmV0LnJlbmRlcmVkRmlyc3QsXG4gICAgICAgIG1ldGFkYXRhOiB7fVxuICAgIH07XG5cbiAgICByZXQucmVuZGVyTWFoYUNvbnRleHQubWV0YWRhdGFcbiAgICAgICAgPSBjb3B5UHJvcGVydGllcyhcbiAgICAgICAgICAgIHJldC5yZW5kZXJNYWhhQ29udGV4dC5tZXRhZGF0YSxcbiAgICAgICAgICAgIHJldC5kb2NJbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcblxuICAgIHRyeSB7XG4gICAgICAgIGlmIChyZXQuZG9jSW5mbz8ubWV0YWRhdGE/LmNvbmZpZz8ubWFoYWJodXRhQ29uZmlnKSB7XG4gICAgICAgICAgICBtYWhhYmh1dGEuY29uZmlnKHJldC5kb2NJbmZvPy5tZXRhZGF0YT8uY29uZmlnPy5tYWhhYmh1dGFDb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXQucmVuZGVyZWRNYWhhID0gIGF3YWl0IG1haGFiaHV0YS5wcm9jZXNzQXN5bmMoXG4gICAgICAgICAgICByZXQucmVuZGVyTWFoYUNvbnRleHQuY29udGVudCwgcmV0LnJlbmRlck1haGFDb250ZXh0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgcmV0LmNvbmZpZy5tYWhhZnVuY3MsXG4gICAgICAgICAgICAvLyBGb3IgcGVyZm9ybWFuY2UgY29sbGVjdGlvblxuICAgICAgICAgICAgY29uZmlnLnBlcmZEYXRhRGlyIFxuICAgICAgICAgICAgPyBuZXcgRmlsZXN5c3RlbVBlcmZEYXRhU3RvcmUoY29uZmlnLnBlcmZEYXRhRGlyKVxuICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjb25maWcucGVyZkRhdGFEaXIgXG4gICAgICAgICAgICA/IHJldC5kb2NJbmZvLnZwYXRoXG4gICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICApO1xuICAgIH0gY2F0Y2ggKGUyKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBFcnJvciB3aXRoIE1haGFiaHV0YSAke3JldC5kb2NJbmZvLnZwYXRofSB3aXRoICR7cmV0LmRvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZTIuc3RhY2sgPyBlMi5zdGFjayA6IGUyfWApO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgLy8gVXNlIGxheW91dCByZXN1bHQgb3IgZmlyc3QgcmVuZGVyIGFzIGZhbGxiYWNrXG4gICAgICAgIHJldC5yZW5kZXJlZE1haGEgPSByZXQucmVuZGVyTWFoYUNvbnRleHQuY29udGVudDtcbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhRW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgLy8gRU5EIE1haGFiaHV0YVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgcmV0LmNvbmZpZy5yZW5kZXJUbywgcmV0LmRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHtcbiAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJEZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldC5yZW5kZXJlZE1haGEsICd1dGYtOCcpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpKTtcbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIC8vIENhbGN1bGF0ZSBlbGFwc2VkIHRpbWVzXG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0O1xuICAgIH1cbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0U3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckxheW91dEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRTdGFydDtcbiAgICB9XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlck1haGFTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJNYWhhRW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlck1haGFFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVuZCAtIHJldC5yZXN1bHRzLnJlbmRlck1haGFTdGFydDtcbiAgICB9XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJUb3RhbEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJTdGFydDtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgJHtyZXQudnBhdGh9YCwgcmV0KTtcbiAgICByZXR1cm4gcmV0LnJlc3VsdHM7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBkb2N1bWVudCBjYW4gYmUgc2tpcHBlZCBiZWNhdXNlIGl0cyBleGlzdGluZ1xuICogb3V0cHV0IGZpbGUgaXMgdXAtdG8tZGF0ZS5cbiAqXG4gKiBBIGRvY3VtZW50IGlzIGNvbnNpZGVyZWQgdXAtdG8tZGF0ZSB3aGVuIGFuIG91dHB1dCBmaWxlIGV4aXN0cyBhbmRcbiAqIGlzIG5ld2VyIHRoYW4gQk9USDpcbiAqXG4gKiAgIDEuIHRoZSBzb3VyY2UgZG9jdW1lbnQsIGFuZFxuICogICAyLiB0aGUgbGF5b3V0IHRlbXBsYXRlIChpZiBhbnkpIHVzZWQgYnkgdGhlIGRvY3VtZW50LlxuICpcbiAqIEFzIGRlc2NyaWJlZCBpbiBodHRwczovL2dpdGh1Yi5jb20vYWthc2hhY21zL2FrYXNoYXJlbmRlci9pc3N1ZXMvNjFcbiAqIGl0IGlzIG5vdCBmZWFzaWJsZSB0byBkZXRlcm1pbmUgdGhlIHNldCBvZiBwYXJ0aWFscyB1c2VkIGJ5IGEgZ2l2ZW5cbiAqIGRvY3VtZW50LCBzbyBjaGFuZ2VzIHRvIHBhcnRpYWxzIGFyZSBOT1QgZGV0ZWN0ZWQgaGVyZS4gIFVzZVxuICogYC0tZm9yY2UtcmVuZGVyLWFsbGAgKG9yIHRoZSBgZm9yY2VSZW5kZXJBbGxgIG9wdGlvbikgdG8gZm9yY2UgZXZlcnlcbiAqIGRvY3VtZW50IHRvIGJlIHJlLXJlbmRlcmVkLCBmb3IgZXhhbXBsZSBhZnRlciBlZGl0aW5nIGEgcGFydGlhbC5cbiAqXG4gKiBAcGFyYW0gY29uZmlnICAgQWthc2hhQ01TIENvbmZpZ3VyYXRpb25cbiAqIEBwYXJhbSBkb2NJbmZvICBUaGUgZG9jdW1lbnQgaW5mbyBvYmplY3QgKGZyb20gZG9jdW1lbnRzQ2FjaGUuZmluZClcbiAqIEByZXR1cm5zIGB0cnVlYCB3aGVuIHJlbmRlcmluZyBjYW4gYmUgc2tpcHBlZCwgYGZhbHNlYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpc0RvY3VtZW50VXBUb0RhdGUoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm9cbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXG4gICAgLy8gV2l0aG91dCBhIGtub3duIHJlbmRlciBwYXRoIHdlIGNhbm5vdCBsb2NhdGUgdGhlIG91dHB1dCBmaWxlLlxuICAgIGlmICghZG9jSW5mbyB8fCAhZG9jSW5mby5yZW5kZXJQYXRoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IEhUTUwgZG9jdW1lbnRzIHBhc3MgdGhyb3VnaCB0aGUgbGF5b3V0L3BhcnRpYWwgcGlwZWxpbmUuXG4gICAgLy8gQ1NTIGZpbGVzIGFuZCBjb3BpZWQgYXNzZXRzIGFyZSBjaGVhcCBhbmQgaGF2ZSBubyBsYXlvdXRcbiAgICAvLyBkZXBlbmRlbmN5LCBzbyBhbHdheXMgcmUtcHJvY2VzcyB0aGVtIHRvIHN0YXkgY29ycmVjdC5cbiAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGRvY0luZm8udnBhdGgpO1xuICAgIGlmICghcmVuZGVyZXIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCByYyA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgZnNwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgIGJvZHk6IGRvY0luZm8uZG9jQm9keSxcbiAgICAgICAgbWV0YWRhdGE6IGRvY0luZm8ubWV0YWRhdGFcbiAgICB9O1xuICAgIGlmIChyZW5kZXJlci5yZW5kZXJGb3JtYXQocmMpICE9PSAnSFRNTCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIExvY2F0ZSB0aGUgb3V0cHV0IGZpbGUgYW5kIHJlYWQgaXRzIG1vZGlmaWNhdGlvbiB0aW1lLlxuICAgIGxldCBvdXRwdXRNdGltZU1zO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlbmRlckRlc3QgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGNvbnN0IG91dFN0YXRzID0gYXdhaXQgZnNwLnN0YXQocmVuZGVyRGVzdCk7XG4gICAgICAgIG91dHB1dE10aW1lTXMgPSBvdXRTdGF0cy5tdGltZU1zO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBObyBvdXRwdXQgZmlsZSAob3Igbm90IHJlYWRhYmxlKSA9PiBtdXN0IHJlbmRlci5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFRoZSBvdXRwdXQgbXVzdCBiZSBuZXdlciB0aGFuIHRoZSBzb3VyY2UgZG9jdW1lbnQuXG4gICAgaWYgKHR5cGVvZiBkb2NJbmZvLm10aW1lTXMgIT09ICdudW1iZXInXG4gICAgIHx8IGRvY0luZm8ubXRpbWVNcyA+IG91dHB1dE10aW1lTXNcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFRoZSBvdXRwdXQgbXVzdCBiZSBuZXdlciB0aGFuIHRoZSBsYXlvdXQgdGVtcGxhdGUsIGlmIGFueS5cbiAgICBpZiAoZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dCA9IGF3YWl0IGxheW91dHMuZmluZChkb2NJbmZvLm1ldGFkYXRhLmxheW91dCk7XG4gICAgICAgICAgICAvLyBJZiB0aGUgbGF5b3V0IGNhbm5vdCBiZSBmb3VuZCwgZmFsbCB0aHJvdWdoIHRvIHJlbmRlcmluZ1xuICAgICAgICAgICAgLy8gc28gdGhlIGV4aXN0aW5nIGVycm9yIHJlcG9ydGluZyBpbiByZW5kZXJEb2N1bWVudCBydW5zLlxuICAgICAgICAgICAgaWYgKCFsYXlvdXRcbiAgICAgICAgICAgICB8fCB0eXBlb2YgbGF5b3V0Lm10aW1lTXMgIT09ICdudW1iZXInXG4gICAgICAgICAgICAgfHwgbGF5b3V0Lm10aW1lTXMgPiBvdXRwdXRNdGltZU1zXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogT3B0aW9ucyBjb250cm9sbGluZyB0aGUgYmVoYXZpb3Igb2YgcmVuZGVyLlxuICovXG5leHBvcnQgdHlwZSBSZW5kZXJPcHRpb25zID0ge1xuICAgIC8qKlxuICAgICAqIFdoZW4gdHJ1ZSwgZXZlcnkgZG9jdW1lbnQgaXMgcmUtcmVuZGVyZWQgcmVnYXJkbGVzcyBvZlxuICAgICAqIG91dHB1dCBmaWxlIHRpbWVzdGFtcHMuICBUaGlzIG1hdGNoZXMgdGhlIGhpc3RvcmljYWxcbiAgICAgKiBiZWhhdmlvciBhbmQgaXMgZXhwb3NlZCBvbiB0aGUgQ0xJIGFzIGAtLWZvcmNlLXJlbmRlci1hbGxgLlxuICAgICAqL1xuICAgIGZvcmNlUmVuZGVyQWxsPzogYm9vbGVhbjtcbn07XG5cbi8qKlxuICogUmVuZGVyIGFsbCB0aGUgZG9jdW1lbnRzIGluIGEgc2l0ZSB1c2luZyByZW5kZXJEb2N1bWVudCxcbiAqIGxpbWl0aW5nIHRoZSBudW1iZXIgb2Ygc2ltdWx0YW5lb3VzIHJlbmRlcmluZyB0YXNrc1xuICogdG8gdGhlIG51bWJlciBpbiBjb25maWcuY29uY3VycmVuY3kuXG4gKiBcbiAqIFJldHVybnMgc3RydWN0dXJlZCBSZW5kZXJpbmdSZXN1bHRzIGRhdGEgaW5zdGVhZCBvZiB0ZXh0IHN0cmluZ3MuXG4gKlxuICogVW5sZXNzIGBvcHRpb25zLmZvcmNlUmVuZGVyQWxsYCBpcyBzZXQsIGRvY3VtZW50cyB3aG9zZSBvdXRwdXRcbiAqIGZpbGUgaXMgbmV3ZXIgdGhhbiBib3RoIHRoZSBzb3VyY2UgZG9jdW1lbnQgYW5kIGl0cyBsYXlvdXRcbiAqIHRlbXBsYXRlIGFyZSBza2lwcGVkIChzZWUgaXNEb2N1bWVudFVwVG9EYXRlKS5cbiAqXG4gKiBAcGFyYW0gY29uZmlnXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCByZW5kZXJpbmcgY29udHJvbHMgKGUuZy4gZm9yY2VSZW5kZXJBbGwpXG4gKiBAcmV0dXJucyBBcnJheSBvZiBSZW5kZXJpbmdSZXN1bHRzIHdpdGggcGVyZm9ybWFuY2UgYW5kIGVycm9yIGRhdGFcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlcihcbiAgICBjb25maWcsXG4gICAgb3B0aW9ucz86IFJlbmRlck9wdGlvbnNcbik6IFByb21pc2U8QXJyYXk8UmVuZGVyaW5nUmVzdWx0cz4+IHtcblxuICAgIGNvbnN0IGZvcmNlUmVuZGVyQWxsID0gb3B0aW9ucz8uZm9yY2VSZW5kZXJBbGwgPT09IHRydWU7XG5cbiAgICBjb25zdCBkb2N1bWVudHMgPSA8RG9jdW1lbnRzQ2FjaGU+Y29uZmlnLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAvLyBjb25zb2xlLmxvZygnQ0FMTElORyBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCcpO1xuICAgIGF3YWl0IGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkKCk7XG4gICAgXG4gICAgLy8gMS4gR2F0aGVyIGxpc3Qgb2YgZmlsZXMgZnJvbSBSZW5kZXJGaWxlQ2FjaGVcbiAgICBjb25zdCBmaWxleiA9IGF3YWl0IGRvY3VtZW50cy5wYXRocygpO1xuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXIgZmlsZXogJHtmaWxlei5sZW5ndGh9YCk7XG5cbiAgICAvLyAyLiBFeGNsdWRlIGFueSB0aGF0IHdlIHdhbnQgdG8gaWdub3JlXG4gICAgY29uc3QgZmlsZXoyID0gW10gYXMgQXJyYXk8e1xuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgfT47XG4gICAgLy8gRG9jdW1lbnRzIHRoYXQgd2VyZSBza2lwcGVkIGJlY2F1c2UgdGhlaXIgb3V0cHV0IGlzIHVwLXRvLWRhdGUuXG4gICAgLy8gVGhlc2UgYXJlIHJlcG9ydGVkIGFsb25nc2lkZSB0aGUgcmVuZGVyZWQgZG9jdW1lbnRzLlxuICAgIGNvbnN0IHNraXBwZWRSZXN1bHRzID0gW10gYXMgQXJyYXk8UmVuZGVyaW5nUmVzdWx0cz47XG4gICAgZm9yIChsZXQgZW50cnkgb2YgZmlsZXopIHtcbiAgICAgICAgbGV0IGluY2x1ZGUgPSB0cnVlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlbnRyeSk7XG4gICAgICAgIGxldCBzdGF0cztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0YXRzID0gYXdhaXQgZnNwLnN0YXQoZW50cnkuZnNwYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7IHN0YXRzID0gdW5kZWZpbmVkOyB9XG4gICAgICAgIGlmICghZW50cnkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgZWxzZSBpZiAoIXN0YXRzIHx8IHN0YXRzLmlzRGlyZWN0b3J5KCkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gVGhpcyBzaG91bGQgYXJpc2UgdXNpbmcgYW4gaWdub3JlIGNsYXVzZVxuICAgICAgICAvLyBlbHNlIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LnZwYXRoKSA9PT0gJy5EU19TdG9yZScpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcucGxhY2Vob2xkZXInKSBpbmNsdWRlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGluY2x1ZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBkb2N1bWVudHMuZmluZChlbnRyeS52cGF0aCk7XG5cbiAgICAgICAgICAgIC8vIFNraXAgZG9jdW1lbnRzIHdob3NlIG91dHB1dCBmaWxlIGlzIG5ld2VyIHRoYW4gYm90aCB0aGVcbiAgICAgICAgICAgIC8vIHNvdXJjZSBkb2N1bWVudCBhbmQgaXRzIGxheW91dCB0ZW1wbGF0ZSwgdW5sZXNzIHRoZVxuICAgICAgICAgICAgLy8gY2FsbGVyIGZvcmNlZCBhIGZ1bGwgcmUtcmVuZGVyLlxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzLzYxXG4gICAgICAgICAgICBpZiAoIWZvcmNlUmVuZGVyQWxsXG4gICAgICAgICAgICAgJiYgYXdhaXQgaXNEb2N1bWVudFVwVG9EYXRlKGNvbmZpZywgaW5mbylcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHNraXBwZWRSZXN1bHRzLnB1c2goPFJlbmRlcmluZ1Jlc3VsdHM+e1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJGb3JtYXQ6ICdIVE1MJyxcbiAgICAgICAgICAgICAgICAgICAgc2tpcHBlZDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUaGUgcXVldWUgaXMgYW4gYXJyYXkgb2YgdHVwbGVzIGNvbnRhaW5pbmcgdGhlXG4gICAgICAgICAgICAvLyBjb25maWcgb2JqZWN0IGFuZCB0aGUgcGF0aCBzdHJpbmdcbiAgICAgICAgICAgIGZpbGV6Mi5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb25maWc6IGNvbmZpZyxcbiAgICAgICAgICAgICAgICBpbmZvOiBpbmZvXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyIGZpbGV6MiBhZnRlciBpZ25vcmUgJHtmaWxlejIubGVuZ3RofWApO1xuXG4gICAgLy8gMy4gTWFrZSBhIGZhc3RxIHRvIHByb2Nlc3MgdXNpbmcgcmVuZGVyRG9jdW1lbnQsXG4gICAgLy8gICAgcHVzaGluZyByZXN1bHRzIHRvIHRoZSByZXN1bHRzIGFycmF5XG5cbiAgICAvLyBUaGlzIHNldHMgdXAgdGhlIHF1ZXVlIHByb2Nlc3NvclxuICAgIC8vIFRoZSBjb25jdXJyZW5jeSBzZXR0aW5nIGxldHMgdXMgcHJvY2VzcyBkb2N1bWVudHNcbiAgICAvLyBpbiBwYXJhbGxlbCB3aGlsZSBsaW1pdGluZyB0b3RhbCBpbXBhY3QuXG4gICAgY29uc3QgcXVldWU6IHF1ZXVlQXNQcm9taXNlZDx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PiA9IGZhc3RxLnByb21pc2UoXG5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIGZvciBlYWNoIGVudHJ5IGluIHRoZVxuICAgICAgICAvLyBxdWV1ZS4gSXQgaGFuZGxlcyByZW5kZXJpbmcgdGhlIHF1ZXVlXG4gICAgICAgIC8vIFRoZSBxdWV1ZSBoYXMgY29uZmlnIG9iamVjdHMgYW5kIHBhdGggc3RyaW5nc1xuICAgICAgICAvLyB3aGljaCBpcyBleGFjdGx5IHdoYXQncyByZXF1aXJlZCBieVxuICAgICAgICAvLyByZW5kZXJEb2N1bWVudFxuICAgICAgICBhc3luYyBmdW5jdGlvbiByZW5kZXJEb2N1bWVudEluUXVldWUoZW50cnkpXG4gICAgICAgICAgICA6IFByb21pc2U8UmVuZGVyaW5nUmVzdWx0cz5cbiAgICAgICAge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudChcbiAgICAgICAgICAgICAgICAgICAgZW50cnkuY29uZmlnLCBlbnRyeS5pbmZvXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgRE9ORSByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBFUlJPUiByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWAsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb25maWcuY29uY3VycmVuY3kpO1xuXG4gICAgLy8gcXVldWUucHVzaCByZXR1cm5zIGEgUHJvbWlzZSB0aGF0J3MgZnVsZmlsbGVkIHdoZW5cbiAgICAvLyB0aGUgdGFzayBmaW5pc2hlcy5cbiAgICAvLyBIZW5jZSB3YWl0Rm9yIGlzIGFuIGFycmF5IG9mIFByb21pc2VzLlxuICAgIGNvbnN0IHdhaXRGb3IgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxlejIpIHtcbiAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGF1dG9tYXRpY2FsbHkgd2FpdHMgZm9yIGFsbCB0aG9zZVxuICAgIC8vIFByb21pc2VzIHRvIHJlc29sdmUsIHdoaWxlIG1ha2luZyB0aGUgcmVzdWx0c1xuICAgIC8vIGFycmF5IGNvbnRhaW4gcmVzdWx0cy5cbiAgICBjb25zdCByZXN1bHRzOiBBcnJheTxSZW5kZXJpbmdSZXN1bHRzPiA9IFtdO1xuICAgIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgIH1cblxuICAgIC8vIEluY2x1ZGUgdGhlIGRvY3VtZW50cyB0aGF0IHdlcmUgc2tpcHBlZCBiZWNhdXNlIHRoZWlyXG4gICAgLy8gb3V0cHV0IHdhcyB1cC10by1kYXRlLCBzbyBjYWxsZXJzIGNhbiByZXBvcnQgdGhlbS5cbiAgICBmb3IgKGxldCBza2lwcGVkIG9mIHNraXBwZWRSZXN1bHRzKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChza2lwcGVkKTtcbiAgICB9XG5cbiAgICAvLyA0LiBJbnZva2UgaG9va1NpdGVSZW5kZXJlZFxuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ0ludm9raW5nIGhvb2tTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgYXdhaXQgY29uZmlnLmhvb2tTaXRlUmVuZGVyZWQoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaG9va1NpdGVSZW5kZXJlZCBmYWlsZWQgYmVjYXVzZSAke2V9YCk7XG4gICAgfVxuXG4gICAgLy8gNS4gcmV0dXJuIHJlc3VsdHNcbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG4iXX0=