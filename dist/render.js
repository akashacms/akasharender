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
// This function and the next exist solely to
// simplify renderDocument.
async function writeCSStoOutput(config, docInfo, docRendered, renderStart) {
    const renderToFpath = path.join(config.renderTo, docInfo.renderPath);
    const renderToDir = path.dirname(renderToFpath);
    await fsp.mkdir(renderToDir, {
        recursive: true
    });
    await fsp.writeFile(renderToFpath, docRendered, 'utf8');
    const renderEndRendered = new Date();
    await data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, "RENDERED", renderStart);
    return `CSS ${docInfo.vpath} ==> ${docInfo.renderPath} (${(renderEndRendered.valueOf() - renderStart.valueOf()) / 1000} seconds)\n${await data.data4file(docInfo.mountPoint, docInfo.vpath)}`;
}
async function copyAssetToOutput(config, docInfo, docRendered, renderStart) {
    const renderToFpath = path.join(config.renderTo, docInfo.renderPath);
    const renderToDir = path.dirname(renderToFpath);
    await fsp.mkdir(renderToDir, {
        recursive: true
    });
    await fsp.copyFile(docInfo.fspath, renderToFpath);
    // console.log(`COPIED ${docInfo.path} ==> ${renderToFpath}`);
    const renderEndCopied = new Date();
    return `COPY ${docInfo.vpath} ==> ${renderToFpath} (${(renderEndCopied.valueOf() - renderStart.valueOf()) / 1000} seconds)`;
}
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
 * Attempt to rewrite renderDocument with cleaner code, and a
 * different method for collecting performance/timing data.
 *
 * The existing renderDocument is messy and hard to understand.
 * Goal: make it more straight-forward, easy to understand.
 * Goal: store all data in a well designed object
 *
 * The existing performance measurements are imprecise by using
 * the Date object, and by not computing the elapsed time of
 * each segment.  Instead, it computs the time from the start
 * for each segment, which isn't useful.  We want to see the
 * elapsed time.
 *
 * For precise time measures this uses the Node.js performance
 * hooks to get accurate timestamps.
 *
 * This code has not been executed as yet.
 *
 * Tasks:
 * * TODO Implement CSS renderFormat
 * * TODO Implement the != HTML renderFormat
 * * TODO Test and fix bugs
 *
 * @param config
 * @param docInfo
 * @returns
 */
export async function renderDocument2(config, docInfo) {
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
    // console.log(`renderDocument2 ${ret.vpath}`, ret);
    return ret.results;
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
export async function renderDocument(config, docInfo) {
    const renderStart = new Date();
    // Render the main content
    if (typeof docInfo.docContent !== 'string'
        || typeof docInfo.docBody !== 'string') {
        // console.warn(`No content to render for `, docInfo);
    }
    const rc = {
        fspath: docInfo.vpath,
        content: docInfo.docContent,
        body: docInfo.docBody,
        metadata: docInfo.metadata
    };
    // console.log(`renderDocument context= ${rc.fspath}`, rc);
    let docFormat; // Knowing the format 
    let docRendered;
    try {
        const result = await renderContent(config, rc);
        docFormat = result.format;
        docRendered = result.rendered;
    }
    catch (err) {
        console.error(`Error rendering ${docInfo.vpath} ${(err.stack ? err.stack : err)}`);
        throw new Error(`Error rendering ${docInfo.vpath} ${(err.stack ? err.stack : err)}`);
    }
    // console.log(`renderDocument ${docFormat} ${docInfo.vpath} rendered=`, docRendered);
    await data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, "FIRST RENDER", renderStart);
    // Handle these cases up front so that the remaining
    // code can be cleaner and focus on HTML layout rendering.
    if (docFormat === 'CSS') {
        try {
            return writeCSStoOutput(config, docInfo, docRendered, renderStart);
        }
        catch (err) {
            console.error(`in RENDER CSS branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in RENDER CSS branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
        }
    }
    if (docFormat !== 'HTML') {
        try {
            copyAssetToOutput(config, docInfo, docRendered, renderStart);
        }
        catch (err) {
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
        const rcLayout = {
            fspath: docInfo.metadata.layout,
            content: found.docContent,
            body: found.docBody,
            metadata: {}
        };
        rcLayout.metadata
            = copyProperties(rcLayout.metadata, found.metadata, false);
        rcLayout.metadata
            = copyProperties(rcLayout.metadata, docInfo.metadata, true);
        rcLayout.metadata.content = docRendered;
        try {
            result
                = await renderContent(config, rcLayout);
            layoutFormat = result.format;
            layoutRendered = result.rendered;
        }
        catch (e) {
            let ee = new Error(`Error rendering ${docInfo.vpath} with ${docInfo?.metadata?.layout} ${e.stack ? e.stack : e}`);
            console.error(ee);
            throw ee;
        }
    }
    else {
        layoutFormat = docFormat;
        layoutRendered = docRendered;
    }
    // console.log(`renderDocument ${docInfo.vpath} after layout render format ${layoutFormat} `, result);
    const renderSecondRender = new Date();
    await data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, "SECOND RENDER", renderStart);
    // Next step is to run Mahabhuta on the rendered content
    // Of course, Mahabhuta is not appropriate for everything
    // because not everything is HTML
    try {
        const mahametadata = copyProperties({}, docInfo.metadata, false);
        mahametadata.content = docRendered;
        if (docInfo?.metadata?.config?.mahabhutaConfig) {
            mahabhuta.config(docInfo?.metadata?.config?.mahabhutaConfig);
        }
        // console.log(`mahametadata`, mahametadata);
        layoutRendered = await mahabhuta.processAsync(layoutRendered, mahametadata, config.mahafuncs);
        // OLD docrendered = await this.maharun(layoutrendered, docdata, config.mahafuncs);
    }
    catch (e2) {
        let eee = new Error(`Error with Mahabhuta ${docInfo.vpath} with ${docInfo?.metadata?.layout} ${e2.stack ? e2.stack : e2}`);
        console.error(eee);
        throw eee;
    }
    await data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, "MAHABHUTA", renderStart);
    const renderDest = path.join(config.renderTo, docInfo.renderPath);
    await fsp.mkdir(path.dirname(renderDest), {
        recursive: true
    });
    await fsp.writeFile(renderDest, layoutRendered, 'utf-8');
    // console.log(`RENDERED ${renderer.name} ${docInfo.path} ==> ${renderToFpath}`);
    const renderEndRendered = new Date();
    await data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, "RENDERED", renderStart);
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
    const documents = config.akasha.filecache.documentsCache;
    // await documents.isReady();
    // console.log('CALLING config.hookBeforeSiteRendered');
    await config.hookBeforeSiteRendered();
    // 1. Gather list of files from RenderFileCache
    const filez = await documents.paths();
    // console.log(`newerrender filez ${filez.length}`);
    // 2. Exclude any that we want to ignore
    const filez2 = [];
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
            // console.log(`DONE renderDocumentInQueue ${entry.info.vpath}`, result);
            return { result };
        }
        catch (error) {
            // console.log(`ERROR renderDocumentInQueue ${entry.info.vpath}`, error.stack);
            return { error };
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
            // so the existing error reporting in renderDocument2 runs.
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
 * Render all the documents in a site using renderDocument2,
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
export async function render2(config, options) {
    const forceRenderAll = options?.forceRenderAll === true;
    const documents = config.akasha.filecache.documentsCache;
    // await documents.isReady();
    // console.log('CALLING config.hookBeforeSiteRendered');
    await config.hookBeforeSiteRendered();
    // 1. Gather list of files from RenderFileCache
    const filez = await documents.paths();
    // console.log(`render2 filez ${filez.length}`);
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
    // console.log(`render2 filez2 after ignore ${filez2.length}`);
    // 3. Make a fastq to process using renderDocument2,
    //    pushing results to the results array
    // This sets up the queue processor
    // The concurrency setting lets us process documents
    // in parallel while limiting total impact.
    const queue = fastq.promise(
    // This function is invoked for each entry in the
    // queue. It handles rendering the queue
    // The queue has config objects and path strings
    // which is exactly what's required by
    // renderDocument2
    async function renderDocument2InQueue(entry) {
        // console.log(`renderDocument2InQueue ${entry.info.vpath}`);
        try {
            let result = await renderDocument2(entry.config, entry.info);
            // console.log(`DONE renderDocument2InQueue ${entry.info.vpath}`);
            return result;
        }
        catch (error) {
            console.log(`ERROR renderDocument2InQueue ${entry.info.vpath}`, error.stack);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sU0FBUyxFQUFFLEVBQ2QsdUJBQXVCLEVBQzFCLE1BQU0sV0FBVyxDQUFDO0FBRW5CLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQVUxQixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFrRTlDLFNBQVMsbUJBQW1CLENBQ3hCLE1BQXFCLEVBQ3JCLE9BQU87SUFFUCxNQUFNLEdBQUcsR0FBa0I7UUFDdkIsTUFBTTtRQUVOLGtCQUFrQixFQUFvQjtZQUNsQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEtBQUs7WUFDckIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxVQUFVO1lBQzNCLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTztZQUNyQixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7U0FDN0I7UUFFRCxRQUFRLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUNqQixPQUFPLENBQUMsS0FBSyxDQUM1QjtRQUVELE9BQU87UUFDUCxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7UUFDcEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1FBQzlCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtRQUM5QixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7UUFFekIsT0FBTyxFQUFvQjtZQUN2QixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7WUFDcEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1lB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QyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQseUNBQXlDO0lBQ3pDLGdEQUFnRDtJQUNoRCx5QkFBeUI7SUFDekIsTUFBTSxPQUFPLEdBQTRCLEVBQUUsQ0FBQztJQUM1QyxLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsd0RBQXdEO0lBQ3hELHFEQUFxRDtJQUNyRCxLQUFLLElBQUksT0FBTyxJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVELDZCQUE2QjtJQUU3QixJQUFJLENBQUM7UUFDRCw0Q0FBNEM7UUFDNUMsTUFBTSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVELG9CQUFvQjtJQUNwQixPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDO0FBQUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0ICogYXMgZGF0YSBmcm9tICcuL2RhdGEuanMnO1xuaW1wb3J0IG1haGFiaHV0YSwge1xuICAgIEZpbGVzeXN0ZW1QZXJmRGF0YVN0b3JlXG59IGZyb20gJ21haGFiaHV0YSc7XG5cbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgdHlwZSB7IHF1ZXVlQXNQcm9taXNlZCB9IGZyb20gXCJmYXN0cVwiO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vaW5kZXguanMnO1xuaW1wb3J0IHsgUmVuZGVyZXIsIFJlbmRlcmluZ0NvbnRleHQgfSBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQge1xuICAgIERvY3VtZW50c0NhY2hlXG59IGZyb20gJy4vY2FjaGUvY2FjaGUtc3FsaXRlLmpzJztcbmltcG9ydCB7XG4gICAgRG9jdW1lbnRcbn0gZnJvbSAnLi9jYWNoZS9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGVyZm9ybWFuY2UgfSBmcm9tICdub2RlOnBlcmZfaG9va3MnO1xuXG4vLyBGb3IgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzLzEwM1xuLy8gVGhlIGlkZWEgaXMgbm9ybWFsaXppbmcgdGhlIGRhdGEgcmV0dXJuZWQuICBUaGlzIHNob3VsZFxuLy8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB0aGUgZGF0YSBtb2R1bGUuICBUaGlzIHNob3VsZFxuLy8gaW1wcm92ZSB0aGUgYW5hbHl6ZWFiaWxpdHkgb2YgZGF0YSBhYm91dCB0aGUgcmVuZGVyaW5nIHByb2Nlc3MuXG5cbmV4cG9ydCB0eXBlIFJlbmRlcmluZ1Jlc3VsdHMgPSB7XG5cbiAgICB2cGF0aD86IHN0cmluZztcbiAgICByZW5kZXJQYXRoPzogc3RyaW5nO1xuXG4gICAgcmVuZGVyRm9ybWF0OiBzdHJpbmc7XG5cbiAgICByZW5kZXJTdGFydD86IG51bWJlcjtcbiAgICByZW5kZXJFbmQ/OiBudW1iZXI7XG5cbiAgICByZW5kZXJGaXJzdFN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlckZpcnN0RW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyTGF5b3V0U3RhcnQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTGF5b3V0RW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyTWFoYVN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlck1haGFFbmQ/OiBudW1iZXI7XG5cbiAgICAvLyBFbGFwc2VkIHRpbWUgY2FsY3VsYXRpb25zXG4gICAgcmVuZGVyRmlyc3RFbGFwc2VkPzogbnVtYmVyO1xuICAgIHJlbmRlckxheW91dEVsYXBzZWQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTWFoYUVsYXBzZWQ/OiBudW1iZXI7XG4gICAgcmVuZGVyVG90YWxFbGFwc2VkPzogbnVtYmVyO1xuXG4gICAgLy8gVHJ1ZSB3aGVuIHRoaXMgZG9jdW1lbnQgd2FzIG5vdCByZS1yZW5kZXJlZCBiZWNhdXNlIHRoZVxuICAgIC8vIGV4aXN0aW5nIG91dHB1dCBmaWxlIGlzIG5ld2VyIHRoYW4gdGhlIHNvdXJjZSBkb2N1bWVudCBhbmRcbiAgICAvLyBpdHMgbGF5b3V0IHRlbXBsYXRlLiAgU2VlIHJlbmRlcjIgYW5kIHRoZSAtLWZvcmNlLXJlbmRlci1hbGxcbiAgICAvLyBvcHRpb24uICBodHRwczovL2dpdGh1Yi5jb20vYWthc2hhY21zL2FrYXNoYXJlbmRlci9pc3N1ZXMvNjFcbiAgICBza2lwcGVkPzogYm9vbGVhbjtcblxuICAgIGVycm9ycz86IEFycmF5PEVycm9yPjtcbn07XG5cbi8vIENvbGxlY3QgYWxsIHJlcXVpcmVkIGRhdGEgaW4gYW4gaW5zdGFuY2Ugb2YgdGhpcyBvYmplY3QuXG50eXBlIFJlbmRlcmluZ0RhdGEgPSB7XG4gICAgY29uZmlnPzogQ29uZmlndXJhdGlvbjtcbiAgICByZW5kZXJlcj86IFJlbmRlcmVyO1xuXG4gICAgZG9jSW5mbz86IGFueTtcblxuICAgIHZwYXRoPzogc3RyaW5nO1xuICAgIHJlbmRlclBhdGg/OiBzdHJpbmc7XG4gICAgbW91bnRQb2ludD86IHN0cmluZztcbiAgICByZW5kZXJUbz86IHN0cmluZztcblxuICAgIHJlbmRlckZpcnN0Q29udGV4dD86IFJlbmRlcmluZ0NvbnRleHQ7XG4gICAgcmVuZGVyZWRGaXJzdD86IHN0cmluZztcblxuICAgIGxheW91dEZvcm1hdD86IHN0cmluZztcbiAgICByZW5kZXJMYXlvdXRDb250ZXh0PzogUmVuZGVyaW5nQ29udGV4dDtcbiAgICByZW5kZXJlZExheW91dD86IHN0cmluZztcblxuICAgIHJlbmRlck1haGFDb250ZXh0PzogUmVuZGVyaW5nQ29udGV4dDtcbiAgICByZW5kZXJlZE1haGE/OiBzdHJpbmc7XG5cbiAgICByZXN1bHRzPzogUmVuZGVyaW5nUmVzdWx0cztcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlbmRlcmluZ0RhdGEoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm9cbik6IFJlbmRlcmluZ0RhdGEge1xuICAgIGNvbnN0IHJldCA9IDxSZW5kZXJpbmdEYXRhPntcbiAgICAgICAgY29uZmlnLFxuXG4gICAgICAgIHJlbmRlckZpcnN0Q29udGV4dDogPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgY29udGVudDogZG9jSW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgYm9keTogZG9jSW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGRvY0luZm8ubWV0YWRhdGFcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJlcjogY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLnZwYXRoXG4gICAgICAgICksXG5cbiAgICAgICAgZG9jSW5mbyxcbiAgICAgICAgdnBhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgIHJlbmRlclBhdGg6IGRvY0luZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgbW91bnRQb2ludDogZG9jSW5mby5tb3VudFBvaW50LFxuICAgICAgICByZW5kZXJUbzogY29uZmlnLnJlbmRlclRvLFxuXG4gICAgICAgIHJlc3VsdHM6IDxSZW5kZXJpbmdSZXN1bHRzPntcbiAgICAgICAgICAgIHZwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogZG9jSW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyU3RhcnQ6IHBlcmZvcm1hbmNlLm5vdygpLFxuICAgICAgICAgICAgZXJyb3JzOiBuZXcgQXJyYXk8RXJyb3I+KClcbiAgICAgICAgfVxuICAgIH07XG4gICAgaWYgKHJldC5yZW5kZXJlcikge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGb3JtYXQgPSByZXQucmVuZGVyZXIucmVuZGVyRm9ybWF0KHJldC5yZW5kZXJGaXJzdENvbnRleHQpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogVGhlIGNvcmUgcGFydCBvZiByZW5kZXJpbmcgY29udGVudCB1c2luZyBhIHJlbmRlcmVyLlxuICogVGhpcyBmdW5jdGlvbiBsb29rcyBmb3IgdGhlIHJlbmRlcmVyLCBhbmQgaWYgbm9uZSBpc1xuICogZm91bmQgaXQgc2ltcGx5IHJldHVybnMuICBJdCB0aGVuIGRvZXMgYSBsaXR0bGUgc2V0dXBcbiAqIHRvIHRoZSBtZXRhZGF0YSBvYmplY3QsIGFuZCBjYWxscyB0aGUgcmVuZGVyIGZ1bmN0aW9uXG4gKlxuICogQHBhcmFtIGNvbmZpZyAtIEFrYXNoYUNNUyBDb25maWd1cmF0aW9uXG4gKiBAcGFyYW0gcmMgLSBSZW5kZXJpbmdDb250ZXh0IGZvciB1c2Ugd2l0aCBSZW5kZXJlcnNcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyQ29udGVudChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgcmM6IFJlbmRlcmluZ0NvbnRleHRcbilcbiAgICAvLyBUaGUgcmV0dXJuIGlzIGEgc2ltcGxlIG9iamVjdFxuICAgIC8vIGNvbnRhaW5pbmcgdXNlZnVsIGRhdGFcbiAgICA6IFByb21pc2U8e1xuICAgICAgICByZW5kZXJlck5hbWU/OiBzdHJpbmcsXG4gICAgICAgIGZvcm1hdD86IHN0cmluZyxcbiAgICAgICAgcmVuZGVyZWQ6IHN0cmluZ1xuICAgIH0+XG57XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckNvbnRlbnQgYCwgcmMpO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoXG4gICAgICAgIHJjLmZzcGF0aFxuICAgICk7XG4gICAgaWYgKCFyZW5kZXJlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVuZGVyZXJOYW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBmb3JtYXQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHJlbmRlcmVkOiByYy5ib2R5XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gQWRkIG5lY2Vzc2FyeSBpdGVtcyB0byB0aGUgbWV0YWRhdGFcbiAgICByYy5tZXRhZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgcmMubWV0YWRhdGEucGFydGlhbCA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsU3luYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgcmMubWV0YWRhdGEuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICByYy5tZXRhZGF0YS5wbHVnaW4gPSBjb25maWcucGx1Z2luO1xuXG4gICAgLy8gUmVuZGVyIHRoZSBwcmltYXJ5IGNvbnRlbnRcbiAgICBsZXQgZG9jcmVuZGVyZWQgPSBhd2FpdCByZW5kZXJlci5yZW5kZXIocmMpO1xuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckNvbnRlbnQgcmVuZGVyZWQ9YCwgZG9jcmVuZGVyZWQpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcmVyTmFtZTogcmVuZGVyZXIubmFtZSxcbiAgICAgICAgZm9ybWF0OiByZW5kZXJlci5yZW5kZXJGb3JtYXQocmMpLFxuICAgICAgICByZW5kZXJlZDogZG9jcmVuZGVyZWRcbiAgICB9O1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGFuZCB0aGUgbmV4dCBleGlzdCBzb2xlbHkgdG9cbi8vIHNpbXBsaWZ5IHJlbmRlckRvY3VtZW50LlxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZUNTU3RvT3V0cHV0KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvLFxuICAgIGRvY1JlbmRlcmVkLFxuICAgIHJlbmRlclN0YXJ0OiBEYXRlXG4pIHtcblxuICAgIGNvbnN0IHJlbmRlclRvRnBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBkb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgIGNvbnN0IHJlbmRlclRvRGlyID0gcGF0aC5kaXJuYW1lKHJlbmRlclRvRnBhdGgpO1xuICAgIGF3YWl0IGZzcC5ta2RpcihyZW5kZXJUb0Rpciwge1xuICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJUb0ZwYXRoLCBkb2NSZW5kZXJlZCwgJ3V0ZjgnKTtcbiAgICBjb25zdCByZW5kZXJFbmRSZW5kZXJlZCA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoXG4gICAgICAgIGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCxcbiAgICAgICAgY29uZmlnLnJlbmRlclRvLFxuICAgICAgICBcIlJFTkRFUkVEXCIsIHJlbmRlclN0YXJ0KTtcbiAgICByZXR1cm4gYENTUyAke2RvY0luZm8udnBhdGh9ID09PiAke2RvY0luZm8ucmVuZGVyUGF0aH0gKCR7KHJlbmRlckVuZFJlbmRlcmVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKVxcbiR7YXdhaXQgZGF0YS5kYXRhNGZpbGUoZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoKX1gO1xuXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvcHlBc3NldFRvT3V0cHV0KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvLFxuICAgIGRvY1JlbmRlcmVkLFxuICAgIHJlbmRlclN0YXJ0OiBEYXRlXG4pIHtcblxuICAgIGNvbnN0IHJlbmRlclRvRnBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBkb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgIGNvbnN0IHJlbmRlclRvRGlyID0gcGF0aC5kaXJuYW1lKHJlbmRlclRvRnBhdGgpO1xuICAgIGF3YWl0IGZzcC5ta2RpcihyZW5kZXJUb0Rpciwge1xuICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgYXdhaXQgZnNwLmNvcHlGaWxlKGRvY0luZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyVG9GcGF0aCk7XG4gICAgLy8gY29uc29sZS5sb2coYENPUElFRCAke2RvY0luZm8ucGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH1gKTtcbiAgICBjb25zdCByZW5kZXJFbmRDb3BpZWQgPSBuZXcgRGF0ZSgpO1xuICAgIHJldHVybiBgQ09QWSAke2RvY0luZm8udnBhdGh9ID09PiAke3JlbmRlclRvRnBhdGh9ICgkeyhyZW5kZXJFbmRDb3BpZWQudmFsdWVPZigpIC0gcmVuZGVyU3RhcnQudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHMpYDtcbn1cblxuZnVuY3Rpb24gY29weVByb3BlcnRpZXMoZGVzdDogYW55LCBzcmM6IGFueSwgZXhjZXB0TGF5b3V0OiBib29sZWFuKSB7XG4gICAgZm9yICh2YXIgeXByb3AgaW4gc3JjKSB7XG4gICAgICAgIGlmIChleGNlcHRMYXlvdXQgJiYgeXByb3AgPT09ICdsYXlvdXQnKSBjb250aW51ZTtcbiAgICAgICAgZGVzdFt5cHJvcF0gPSBzcmNbeXByb3BdO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVuZGVyQ1NTRmlsZShyZXQ6IFJlbmRlcmluZ0RhdGEpOiBQcm9taXNlPFJlbmRlcmluZ0RhdGE+IHtcbiAgICB0cnkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGb3JtYXQgPSAnQ1NTJztcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgICAgIC8vIFJlbmRlciB0aGUgQ1NTIGNvbnRlbnRcbiAgICAgICAgcmV0LnJlbmRlcmVkRmlyc3QgPSBhd2FpdCByZXQucmVuZGVyZXIucmVuZGVyKHJldC5yZW5kZXJGaXJzdENvbnRleHQpO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgICAgIC8vIFdyaXRlIHRoZSByZW5kZXJlZCBDU1MgdG8gb3V0cHV0XG4gICAgICAgIGNvbnN0IHJlbmRlckRlc3QgPSBwYXRoLmpvaW4ocmV0LmNvbmZpZy5yZW5kZXJUbywgcmV0LmRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlckRlc3QsIHJldC5yZW5kZXJlZEZpcnN0LCAndXRmLTgnKTtcblxuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKSk7XG4gICAgfVxuICAgIC8vIENhbGN1bGF0ZSBlbGFwc2VkIHRpbWVzXG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0O1xuICAgIH1cbiAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbGFwc2VkID0gMDtcbiAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhRWxhcHNlZCA9IDA7XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJUb3RhbEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJTdGFydDtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ1NTRmlsZSAke3JldC52cGF0aH1gLCByZXQpO1xuXG4gICAgcmV0dXJuIHJldDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weUFzc2V0RmlsZShyZXQ6IFJlbmRlcmluZ0RhdGEpOiBQcm9taXNlPFJlbmRlcmluZ0RhdGE+IHtcbiAgICB0cnkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGb3JtYXQgPSAnQ09QWSc7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgICAgICAvLyBDb3B5IHRoZSBhc3NldCBmaWxlIHRvIG91dHB1dCBkaXJlY3RvcnlcbiAgICAgICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihyZXQuY29uZmlnLnJlbmRlclRvLCByZXQuZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJEZXN0KSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGF3YWl0IGZzcC5jb3B5RmlsZShyZXQuZG9jSW5mby5mc3BhdGgsIHJlbmRlckRlc3QpO1xuXG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpKTtcbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgZWxhcHNlZCB0aW1lc1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydDtcbiAgICB9XG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RWxhcHNlZCA9IDA7XG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVsYXBzZWQgPSAwO1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyVG90YWxFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyU3RhcnQ7XG4gICAgfVxuXG4gICAgLy8gVXNlIHRoaXMgdG8gdmVyaWZ5IGVycm9yIGhhbmRsaW5nXG4gICAgLy8gcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2gobmV3IEVycm9yKGBSYW5kb20gZXJyb3JgKSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgY29weUFzc2V0RmlsZSAke3JldC52cGF0aH1gLCByZXQpO1xuICAgIHJldHVybiByZXQ7XG59XG5cblxuXG4vKipcbiAqIEF0dGVtcHQgdG8gcmV3cml0ZSByZW5kZXJEb2N1bWVudCB3aXRoIGNsZWFuZXIgY29kZSwgYW5kIGFcbiAqIGRpZmZlcmVudCBtZXRob2QgZm9yIGNvbGxlY3RpbmcgcGVyZm9ybWFuY2UvdGltaW5nIGRhdGEuXG4gKiBcbiAqIFRoZSBleGlzdGluZyByZW5kZXJEb2N1bWVudCBpcyBtZXNzeSBhbmQgaGFyZCB0byB1bmRlcnN0YW5kLlxuICogR29hbDogbWFrZSBpdCBtb3JlIHN0cmFpZ2h0LWZvcndhcmQsIGVhc3kgdG8gdW5kZXJzdGFuZC5cbiAqIEdvYWw6IHN0b3JlIGFsbCBkYXRhIGluIGEgd2VsbCBkZXNpZ25lZCBvYmplY3RcbiAqIFxuICogVGhlIGV4aXN0aW5nIHBlcmZvcm1hbmNlIG1lYXN1cmVtZW50cyBhcmUgaW1wcmVjaXNlIGJ5IHVzaW5nXG4gKiB0aGUgRGF0ZSBvYmplY3QsIGFuZCBieSBub3QgY29tcHV0aW5nIHRoZSBlbGFwc2VkIHRpbWUgb2ZcbiAqIGVhY2ggc2VnbWVudC4gIEluc3RlYWQsIGl0IGNvbXB1dHMgdGhlIHRpbWUgZnJvbSB0aGUgc3RhcnRcbiAqIGZvciBlYWNoIHNlZ21lbnQsIHdoaWNoIGlzbid0IHVzZWZ1bC4gIFdlIHdhbnQgdG8gc2VlIHRoZVxuICogZWxhcHNlZCB0aW1lLlxuICogXG4gKiBGb3IgcHJlY2lzZSB0aW1lIG1lYXN1cmVzIHRoaXMgdXNlcyB0aGUgTm9kZS5qcyBwZXJmb3JtYW5jZVxuICogaG9va3MgdG8gZ2V0IGFjY3VyYXRlIHRpbWVzdGFtcHMuXG4gKiBcbiAqIFRoaXMgY29kZSBoYXMgbm90IGJlZW4gZXhlY3V0ZWQgYXMgeWV0LlxuICogXG4gKiBUYXNrczpcbiAqICogVE9ETyBJbXBsZW1lbnQgQ1NTIHJlbmRlckZvcm1hdFxuICogKiBUT0RPIEltcGxlbWVudCB0aGUgIT0gSFRNTCByZW5kZXJGb3JtYXRcbiAqICogVE9ETyBUZXN0IGFuZCBmaXggYnVnc1xuICogXG4gKiBAcGFyYW0gY29uZmlnIFxuICogQHBhcmFtIGRvY0luZm8gXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50MihcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mb1xuKTogUHJvbWlzZTxSZW5kZXJpbmdSZXN1bHRzPiB7XG5cbiAgICAvLyBDcmVhdGUgdGhlIG1hc3RlciBvYmplY3QgdG8gaG9sZCBhbGwgZGF0YVxuICAgIGNvbnN0IHJldDogUmVuZGVyaW5nRGF0YSA9IGNyZWF0ZVJlbmRlcmluZ0RhdGEoY29uZmlnLCBkb2NJbmZvKTtcblxuICAgIC8vIFBlZWwgb2ZmIHRvIG1vZGUtc3BlY2lmaWMgZnVuY3Rpb25zXG4gICAgaWYgKHJldD8ucmVuZGVyZXI/LnJlbmRlckZvcm1hdChyZXQucmVuZGVyRmlyc3RDb250ZXh0KSA9PT0gJ0NTUycpIHtcbiAgICAgICAgY29uc3QgY3NzUmVzdWx0ID0gYXdhaXQgcmVuZGVyQ1NTRmlsZShyZXQpO1xuICAgICAgICByZXR1cm4gY3NzUmVzdWx0LnJlc3VsdHM7XG4gICAgfSBlbHNlIGlmICghcmV0LnJlbmRlcmVyXG4gICAgIHx8IChyZXQucmVuZGVyZXIucmVuZGVyRm9ybWF0KHJldC5yZW5kZXJGaXJzdENvbnRleHQpICE9PSAnSFRNTCcpXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0UmVzdWx0ID0gYXdhaXQgY29weUFzc2V0RmlsZShyZXQpO1xuICAgICAgICByZXR1cm4gYXNzZXRSZXN1bHQucmVzdWx0cztcbiAgICB9XG5cbiAgICAvLyBPdGhlcndpc2UgaXQgaXMgSFRNTFxuICAgIC8vIFRoaXMgaXMgd2hlcmUgd2UgcmVuZGVyIHRoZSBjb250ZW50LCB0aGVuIHJlbmRlciB0aGF0XG4gICAgLy8gaW50byB0aGUgbGF5b3V0IChpZiBvbmUgZXhpc3RzKSwgdGhlbiBydW4gTWFoYWJodXRhLlxuXG4gICAgLy8gVGhlc2UgZnVuY3Rpb25zIGFyZSBkdXBsaWNhdGVzIGJldHdlZW4gdGhlIGZpcnN0XG4gICAgLy8gdHdvIHN0YWdlcy4gIFNhdmUgYSBjb3VwbGUgbWljcm9zZWNvbmRzIGJ5IGluc3RhbnRpYXRpbmdcbiAgICAvLyB0aGUgZnVuY3Rpb25zIG9uY2UuXG4gICAgY29uc3QgZG9QYXJ0aWFsID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIGNvbnN0IGRvUGFydGlhbFN5bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuXG4gICAgLy8gRmlyc3QgUmVuZGVyXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gQWRkIG5lY2Vzc2FyeSBpdGVtcyB0byB0aGUgbWV0YWRhdGFcbiAgICAgICAgcmV0LnJlbmRlckZpcnN0Q29udGV4dC5tZXRhZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHJldC5yZW5kZXJGaXJzdENvbnRleHQubWV0YWRhdGEucGFydGlhbCA9IGRvUGFydGlhbDtcbiAgICAgICAgcmV0LnJlbmRlckZpcnN0Q29udGV4dC5tZXRhZGF0YS5wYXJ0aWFsU3luYyA9IGRvUGFydGlhbFN5bmM7XG4gICAgICAgIHJldC5yZW5kZXJGaXJzdENvbnRleHQubWV0YWRhdGEuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgcmV0LnJlbmRlckZpcnN0Q29udGV4dC5tZXRhZGF0YS5wbHVnaW4gPSBjb25maWcucGx1Z2luO1xuXG4gICAgICAgIC8vIFJlbmRlciB0aGUgcHJpbWFyeSBjb250ZW50XG4gICAgICAgIHJldC5yZW5kZXJlZEZpcnN0ID0gYXdhaXQgcmV0LnJlbmRlcmVyLnJlbmRlcihyZXQucmVuZGVyRmlyc3RDb250ZXh0KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKSk7XG4gICAgICAgIC8vIFVzZSBlbXB0eSBzdHJpbmcgYXMgZmFsbGJhY2sgaWYgcmVuZGVyaW5nIGZhaWxzXG4gICAgICAgIHJldC5yZW5kZXJlZEZpcnN0ID0gJyc7XG4gICAgfVxuXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAvLyBFTkQgRmlyc3QgUmVuZGVyXG5cbiAgICAvLyBMYXlvdXQgUmVuZGVyXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0U3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIGlmIChyZXQ/LmRvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dHMgPSBjb25maWcuYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGU7XG4gICAgICAgICAgICAvLyBhd2FpdCBsYXlvdXRzLmlzUmVhZHkoKTtcblxuICAgICAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgbGF5b3V0cy5maW5kKHJldC5kb2NJbmZvLm1ldGFkYXRhLmxheW91dCk7XG4gICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYE5vIGxheW91dCBmb3VuZCBpbiAke3V0aWwuaW5zcGVjdChyZXQuY29uZmlnLmxheW91dERpcnMpfSBmb3IgJHtyZXQ/LmRvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9IGluIGZpbGUgJHtyZXQuZG9jSW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgICAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICAgICAgICAgIC8vIFNraXAgbGF5b3V0IHJlbmRlcmluZywgdXNlIGZpcnN0IHJlbmRlciByZXN1bHRcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyZWRMYXlvdXQgPSByZXQucmVuZGVyZWRGaXJzdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgICAgICAgICAgICAgcmV0LmRvY0luZm8ubWV0YWRhdGEubGF5b3V0XG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0ID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IHJldC5kb2NJbmZvLm1ldGFkYXRhLmxheW91dCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogZm91bmQuZG9jQ29udGVudCxcbiAgICAgICAgICAgICAgICAgICAgYm9keTogZm91bmQuZG9jQm9keSxcbiAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHt9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgID0gY29weVByb3BlcnRpZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICA9IGNvcHlQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXQuZG9jSW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLmNvbnRlbnQgPSByZXQucmVuZGVyZWRGaXJzdDtcblxuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YS5wYXJ0aWFsID0gZG9QYXJ0aWFsO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLnBhcnRpYWxTeW5jID0gZG9QYXJ0aWFsU3luYztcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLnBsdWdpbiA9IGNvbmZpZy5wbHVnaW47XG5cbiAgICAgICAgICAgICAgICAvLyBSZW5kZXIgdGhlIGxheW91dCBjb250ZW50XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlcmVkTGF5b3V0ID0gYXdhaXQgcmVuZGVyZXIucmVuZGVyKHJldC5yZW5kZXJMYXlvdXRDb250ZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9IHdpdGggJHtkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSAke2Uuc3RhY2sgPyBlLnN0YWNrIDogZX1gKTtcbiAgICAgICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgICAgIC8vIFVzZSBmaXJzdCByZW5kZXIgcmVzdWx0IGFzIGZhbGxiYWNrXG4gICAgICAgICAgICByZXQucmVuZGVyZWRMYXlvdXQgPSByZXQucmVuZGVyZWRGaXJzdDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldC5yZXN1bHRzLnJlbmRlckxheW91dEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIC8vIEVORCBMYXlvdXQgUmVuZGVyXG5cbiAgICAvLyBNYWhhYmh1dGFcbiAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhU3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIHJldC5yZW5kZXJNYWhhQ29udGV4dCA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgZnNwYXRoOiByZXQuZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQsXG4gICAgICAgIGNvbnRlbnQ6IHJldC5yZW5kZXJlZExheW91dFxuICAgICAgICAgICAgPyByZXQucmVuZGVyZWRMYXlvdXQgOiByZXQucmVuZGVyZWRGaXJzdCxcbiAgICAgICAgYm9keTogcmV0LnJlbmRlcmVkTGF5b3V0XG4gICAgICAgICAgICA/IHJldC5yZW5kZXJlZExheW91dCA6IHJldC5yZW5kZXJlZEZpcnN0LFxuICAgICAgICBtZXRhZGF0YToge31cbiAgICB9O1xuXG4gICAgcmV0LnJlbmRlck1haGFDb250ZXh0Lm1ldGFkYXRhXG4gICAgICAgID0gY29weVByb3BlcnRpZXMoXG4gICAgICAgICAgICByZXQucmVuZGVyTWFoYUNvbnRleHQubWV0YWRhdGEsXG4gICAgICAgICAgICByZXQuZG9jSW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG5cbiAgICB0cnkge1xuICAgICAgICBpZiAocmV0LmRvY0luZm8/Lm1ldGFkYXRhPy5jb25maWc/Lm1haGFiaHV0YUNvbmZpZykge1xuICAgICAgICAgICAgbWFoYWJodXRhLmNvbmZpZyhyZXQuZG9jSW5mbz8ubWV0YWRhdGE/LmNvbmZpZz8ubWFoYWJodXRhQ29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0LnJlbmRlcmVkTWFoYSA9ICBhd2FpdCBtYWhhYmh1dGEucHJvY2Vzc0FzeW5jKFxuICAgICAgICAgICAgcmV0LnJlbmRlck1haGFDb250ZXh0LmNvbnRlbnQsIHJldC5yZW5kZXJNYWhhQ29udGV4dC5tZXRhZGF0YSxcbiAgICAgICAgICAgIHJldC5jb25maWcubWFoYWZ1bmNzLFxuICAgICAgICAgICAgLy8gRm9yIHBlcmZvcm1hbmNlIGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGNvbmZpZy5wZXJmRGF0YURpciBcbiAgICAgICAgICAgID8gbmV3IEZpbGVzeXN0ZW1QZXJmRGF0YVN0b3JlKGNvbmZpZy5wZXJmRGF0YURpcilcbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgY29uZmlnLnBlcmZEYXRhRGlyIFxuICAgICAgICAgICAgPyByZXQuZG9jSW5mby52cGF0aFxuICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgKTtcbiAgICB9IGNhdGNoIChlMikge1xuICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgRXJyb3Igd2l0aCBNYWhhYmh1dGEgJHtyZXQuZG9jSW5mby52cGF0aH0gd2l0aCAke3JldC5kb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSAke2UyLnN0YWNrID8gZTIuc3RhY2sgOiBlMn1gKTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvcik7XG4gICAgICAgIC8vIFVzZSBsYXlvdXQgcmVzdWx0IG9yIGZpcnN0IHJlbmRlciBhcyBmYWxsYmFja1xuICAgICAgICByZXQucmVuZGVyZWRNYWhhID0gcmV0LnJlbmRlck1haGFDb250ZXh0LmNvbnRlbnQ7XG4gICAgfVxuXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIC8vIEVORCBNYWhhYmh1dGFcblxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlbmRlckRlc3QgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgIHJldC5jb25maWcucmVuZGVyVG8sIHJldC5kb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlckRlc3QpLCB7XG4gICAgICAgICAgICByZWN1cnNpdmU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyRGVzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQucmVuZGVyZWRNYWhhLCAndXRmLTgnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKSk7XG4gICAgfVxuXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyRW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZWxhcHNlZCB0aW1lc1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydDtcbiAgICB9XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlckxheW91dFN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckxheW91dEVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0U3RhcnQ7XG4gICAgfVxuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJNYWhhU3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhRWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlck1haGFFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJNYWhhU3RhcnQ7XG4gICAgfVxuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyVG90YWxFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyU3RhcnQ7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50MiAke3JldC52cGF0aH1gLCByZXQpO1xuICAgIHJldHVybiByZXQucmVzdWx0cztcbn1cblxuLyoqXG4gKiBSZW5kZXIgYSBkb2N1bWVudCwgYWNjb3VudGluZyBmb3IgdGhlIG1haW4gY29udGVudCxcbiAqIGEgbGF5b3V0IHRlbXBsYXRlIChpZiBhbnkpLCBhbmQgTWFoYWJodXRhIChpZiB0aGUgY29udGVudFxuICogb3V0cHV0IGlzIEhUTUwpLiAgVGhpcyBhbHNvIGhhbmRsZXMgcmVuZGVyaW5nIG90aGVyIHR5cGVzXG4gKiBvZiBjb250ZW50IHN1Y2ggYXMgTEVTUyBDU1MgZmlsZXMuXG4gKlxuICogQHBhcmFtIGNvbmZpZyBcbiAqIEBwYXJhbSBkb2NJbmZvIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJEb2N1bWVudChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mb1xuKTogUHJvbWlzZTxzdHJpbmc+XG57XG4gICAgY29uc3QgcmVuZGVyU3RhcnQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgLy8gUmVuZGVyIHRoZSBtYWluIGNvbnRlbnRcblxuICAgIGlmICh0eXBlb2YgZG9jSW5mby5kb2NDb250ZW50ICE9PSAnc3RyaW5nJ1xuICAgICB8fCB0eXBlb2YgZG9jSW5mby5kb2NCb2R5ICE9PSAnc3RyaW5nJ1xuICAgICkge1xuICAgICAgICAvLyBjb25zb2xlLndhcm4oYE5vIGNvbnRlbnQgdG8gcmVuZGVyIGZvciBgLCBkb2NJbmZvKTtcbiAgICB9XG5cbiAgICBjb25zdCByYyA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgZnNwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgIGJvZHk6IGRvY0luZm8uZG9jQm9keSxcbiAgICAgICAgbWV0YWRhdGE6IGRvY0luZm8ubWV0YWRhdGFcbiAgICB9O1xuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50IGNvbnRleHQ9ICR7cmMuZnNwYXRofWAsIHJjKTtcblxuICAgIGxldCBkb2NGb3JtYXQ7ICAgICAgLy8gS25vd2luZyB0aGUgZm9ybWF0IFxuICAgIGxldCBkb2NSZW5kZXJlZDtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZW5kZXJDb250ZW50KGNvbmZpZywgcmMpO1xuICAgICAgICBkb2NGb3JtYXQgPSByZXN1bHQuZm9ybWF0O1xuICAgICAgICBkb2NSZW5kZXJlZCA9IHJlc3VsdC5yZW5kZXJlZDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gJHsoZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyKX1gKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSAkeyhlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnIpfWApO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgJHtkb2NGb3JtYXR9ICR7ZG9jSW5mby52cGF0aH0gcmVuZGVyZWQ9YCwgZG9jUmVuZGVyZWQpO1xuICAgIGF3YWl0IGRhdGEucmVwb3J0KGRvY0luZm8ubW91bnRQb2ludCwgXG4gICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIFxuICAgICAgICAgICAgICAgICAgICAgXCJGSVJTVCBSRU5ERVJcIiwgcmVuZGVyU3RhcnQpO1xuXG4gICAgLy8gSGFuZGxlIHRoZXNlIGNhc2VzIHVwIGZyb250IHNvIHRoYXQgdGhlIHJlbWFpbmluZ1xuICAgIC8vIGNvZGUgY2FuIGJlIGNsZWFuZXIgYW5kIGZvY3VzIG9uIEhUTUwgbGF5b3V0IHJlbmRlcmluZy5cblxuICAgIGlmIChkb2NGb3JtYXQgPT09ICdDU1MnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gd3JpdGVDU1N0b091dHB1dChjb25maWcsIGRvY0luZm8sIGRvY1JlbmRlcmVkLCByZW5kZXJTdGFydCk7XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbiBSRU5ERVIgQ1NTIGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluIFJFTkRFUiBDU1MgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkb2NGb3JtYXQgIT09ICdIVE1MJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29weUFzc2V0VG9PdXRwdXQoY29uZmlnLCBkb2NJbmZvLCBkb2NSZW5kZXJlZCwgcmVuZGVyU3RhcnQpO1xuICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW4gY29weSBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbiBjb3B5IGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgdGhlIG1haW4gY29udGVudCBpbnRvIGEgbGF5b3V0IHRlbXBsYXRlLFxuICAgIC8vIGlmIG9uZSBpcyBzcGVjaWZpZWRcblxuICAgIGxldCBsYXlvdXRGb3JtYXQ7XG4gICAgbGV0IGxheW91dFJlbmRlcmVkO1xuICAgIGxldCByZXN1bHQ7XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50IGxheW91dCAke2RvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9IGRvY01ldGFkYXRhICR7dXRpbC5pbnNwZWN0KGRvY0luZm8uZG9jTWV0YWRhdGEpfSBtZXRhZGF0YSAke3V0aWwuaW5zcGVjdChkb2NJbmZvLm1ldGFkYXRhKX1gKTtcbiAgICBpZiAoZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dCkge1xuXG4gICAgICAgIGNvbnN0IGxheW91dHMgPSBjb25maWcuYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGxheW91dHMuaXNSZWFkeSgpO1xuXG4gICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGxheW91dHMuZmluZChkb2NJbmZvLm1ldGFkYXRhLmxheW91dCk7XG4gICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gbGF5b3V0IGZvdW5kIGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5sYXlvdXREaXJzKX0gZm9yICR7ZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gaW4gZmlsZSAke2RvY0luZm8udnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByY0xheW91dCA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgICAgIGZzcGF0aDogZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQsXG4gICAgICAgICAgICBjb250ZW50OiBmb3VuZC5kb2NDb250ZW50LFxuICAgICAgICAgICAgYm9keTogZm91bmQuZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7fVxuICAgICAgICB9O1xuXG4gICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhXG4gICAgICAgICAgICA9IGNvcHlQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGZvdW5kLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICApO1xuICAgICAgICByY0xheW91dC5tZXRhZGF0YVxuICAgICAgICAgICAgPSBjb3B5UHJvcGVydGllcyhcbiAgICAgICAgICAgICAgICByY0xheW91dC5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICBkb2NJbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgICk7XG4gICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhLmNvbnRlbnQgPSBkb2NSZW5kZXJlZDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgICAgICAgICAgPSBhd2FpdCByZW5kZXJDb250ZW50KGNvbmZpZywgcmNMYXlvdXQpO1xuICAgICAgICAgICAgbGF5b3V0Rm9ybWF0ID0gcmVzdWx0LmZvcm1hdDtcbiAgICAgICAgICAgIGxheW91dFJlbmRlcmVkID0gcmVzdWx0LnJlbmRlcmVkO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBsZXQgZWUgPSBuZXcgRXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9IHdpdGggJHtkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSAke2Uuc3RhY2sgPyBlLnN0YWNrIDogZX1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZWUpO1xuICAgICAgICAgICAgdGhyb3cgZWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBsYXlvdXRGb3JtYXQgPSBkb2NGb3JtYXQ7XG4gICAgICAgIGxheW91dFJlbmRlcmVkID0gZG9jUmVuZGVyZWQ7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50ICR7ZG9jSW5mby52cGF0aH0gYWZ0ZXIgbGF5b3V0IHJlbmRlciBmb3JtYXQgJHtsYXlvdXRGb3JtYXR9IGAsIHJlc3VsdCk7XG5cbiAgICBjb25zdCByZW5kZXJTZWNvbmRSZW5kZXIgPSBuZXcgRGF0ZSgpO1xuICAgIGF3YWl0IGRhdGEucmVwb3J0KGRvY0luZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLnZwYXRoLCBjb25maWcucmVuZGVyVG8sIFxuICAgICAgICAgICAgICAgICAgICAgIFwiU0VDT05EIFJFTkRFUlwiLFxuICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclN0YXJ0KTtcblxuICAgIFxuICAgIC8vIE5leHQgc3RlcCBpcyB0byBydW4gTWFoYWJodXRhIG9uIHRoZSByZW5kZXJlZCBjb250ZW50XG4gICAgLy8gT2YgY291cnNlLCBNYWhhYmh1dGEgaXMgbm90IGFwcHJvcHJpYXRlIGZvciBldmVyeXRoaW5nXG4gICAgLy8gYmVjYXVzZSBub3QgZXZlcnl0aGluZyBpcyBIVE1MXG5cbiAgICB0cnkge1xuXG4gICAgICAgIGNvbnN0IG1haGFtZXRhZGF0YVxuICAgICAgICAgICAgPSBjb3B5UHJvcGVydGllcyhcbiAgICAgICAgICAgICAgICB7IH0sXG4gICAgICAgICAgICAgICAgZG9jSW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgbWFoYW1ldGFkYXRhLmNvbnRlbnQgPSBkb2NSZW5kZXJlZDtcblxuICAgICAgICBpZiAoZG9jSW5mbz8ubWV0YWRhdGE/LmNvbmZpZz8ubWFoYWJodXRhQ29uZmlnKSB7XG4gICAgICAgICAgICBtYWhhYmh1dGEuY29uZmlnKGRvY0luZm8/Lm1ldGFkYXRhPy5jb25maWc/Lm1haGFiaHV0YUNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYG1haGFtZXRhZGF0YWAsIG1haGFtZXRhZGF0YSk7XG4gICAgICAgIGxheW91dFJlbmRlcmVkID0gYXdhaXQgbWFoYWJodXRhLnByb2Nlc3NBc3luYyhcbiAgICAgICAgICAgIGxheW91dFJlbmRlcmVkLCBtYWhhbWV0YWRhdGEsXG4gICAgICAgICAgICBjb25maWcubWFoYWZ1bmNzXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gT0xEIGRvY3JlbmRlcmVkID0gYXdhaXQgdGhpcy5tYWhhcnVuKGxheW91dHJlbmRlcmVkLCBkb2NkYXRhLCBjb25maWcubWFoYWZ1bmNzKTtcbiAgICB9IGNhdGNoIChlMikge1xuICAgICAgICBsZXQgZWVlID0gbmV3IEVycm9yKGBFcnJvciB3aXRoIE1haGFiaHV0YSAke2RvY0luZm8udnBhdGh9IHdpdGggJHtkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSAke2UyLnN0YWNrID8gZTIuc3RhY2sgOiBlMn1gKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihlZWUpO1xuICAgICAgICB0aHJvdyBlZWU7XG4gICAgfVxuXG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoZG9jSW5mby5tb3VudFBvaW50LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJNQUhBQkhVVEFcIiwgcmVuZGVyU3RhcnQpO1xuXG4gICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJEZXN0KSwge1xuICAgICAgICByZWN1cnNpdmU6IHRydWVcbiAgICB9KTtcbiAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlckRlc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXRSZW5kZXJlZCwgJ3V0Zi04Jyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgUkVOREVSRUQgJHtyZW5kZXJlci5uYW1lfSAke2RvY0luZm8ucGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH1gKTtcbiAgICBjb25zdCByZW5kZXJFbmRSZW5kZXJlZCA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoXG4gICAgICAgIGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCxcbiAgICAgICAgY29uZmlnLnJlbmRlclRvLFxuICAgICAgICBcIlJFTkRFUkVEXCIsIHJlbmRlclN0YXJ0KTtcbiAgICByZXR1cm4gYCR7bGF5b3V0Rm9ybWF0fSAke2RvY0luZm8udnBhdGh9ID09PiAke2RvY0luZm8ucmVuZGVyUGF0aH0gKCR7KHJlbmRlckVuZFJlbmRlcmVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKVxcbiR7YXdhaXQgZGF0YS5kYXRhNGZpbGUoZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoKX1gO1xuXG59XG5cbi8qKlxuICogUmVuZGVyIGFsbCB0aGUgZG9jdW1lbnRzIGluIGEgc2l0ZSwgbGltaXRpbmdcbiAqIHRoZSBudW1iZXIgb2Ygc2ltdWx0YW5lb3VzIHJlbmRlcmluZyB0YXNrc1xuICogdG8gdGhlIG51bWJlciBpbiBjb25maWcuY29uY3VycmVuY3kuXG4gKlxuICogQHBhcmFtIGNvbmZpZ1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlcihjb25maWcpIHtcblxuICAgIGNvbnN0IGRvY3VtZW50cyA9IDxEb2N1bWVudHNDYWNoZT5jb25maWcuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdDQUxMSU5HIGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgYXdhaXQgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKTtcbiAgICBcbiAgICAvLyAxLiBHYXRoZXIgbGlzdCBvZiBmaWxlcyBmcm9tIFJlbmRlckZpbGVDYWNoZVxuICAgIGNvbnN0IGZpbGV6ID0gYXdhaXQgZG9jdW1lbnRzLnBhdGhzKCk7XG4gICAgLy8gY29uc29sZS5sb2coYG5ld2VycmVuZGVyIGZpbGV6ICR7ZmlsZXoubGVuZ3RofWApO1xuXG4gICAgLy8gMi4gRXhjbHVkZSBhbnkgdGhhdCB3ZSB3YW50IHRvIGlnbm9yZVxuICAgIGNvbnN0IGZpbGV6MiA9IFtdIGFzIEFycmF5PHtcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgIH0+O1xuICAgIGZvciAobGV0IGVudHJ5IG9mIGZpbGV6KSB7XG4gICAgICAgIGxldCBpbmNsdWRlID0gdHJ1ZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZW50cnkpO1xuICAgICAgICBsZXQgc3RhdHM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdGF0cyA9IGF3YWl0IGZzcC5zdGF0KGVudHJ5LmZzcGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikgeyBzdGF0cyA9IHVuZGVmaW5lZDsgfVxuICAgICAgICBpZiAoIWVudHJ5KSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIGVsc2UgaWYgKCFzdGF0cyB8fCBzdGF0cy5pc0RpcmVjdG9yeSgpKSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIC8vIFRoaXMgc2hvdWxkIGFyaXNlIHVzaW5nIGFuIGlnbm9yZSBjbGF1c2VcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcuRFNfU3RvcmUnKSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIC8vIGVsc2UgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkudnBhdGgpID09PSAnLnBsYWNlaG9sZGVyJykgaW5jbHVkZSA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChpbmNsdWRlKSB7XG4gICAgICAgICAgICAvLyBUaGUgcXVldWUgaXMgYW4gYXJyYXkgb2YgdHVwbGVzIGNvbnRhaW5pbmcgdGhlXG4gICAgICAgICAgICAvLyBjb25maWcgb2JqZWN0IGFuZCB0aGUgcGF0aCBzdHJpbmdcbiAgICAgICAgICAgIGZpbGV6Mi5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb25maWc6IGNvbmZpZyxcbiAgICAgICAgICAgICAgICBpbmZvOiBhd2FpdCBkb2N1bWVudHMuZmluZChlbnRyeS52cGF0aClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGBuZXdlcnJlbmRlciBmaWxlejIgYWZ0ZXIgaWdub3JlICR7ZmlsZXoyLmxlbmd0aH1gKTtcblxuXG4gICAgLy8gMy4gTWFrZSBhIGZhc3RxIHRvIHByb2Nlc3MgdXNpbmcgcmVuZGVyRG9jdW1lbnQsXG4gICAgLy8gICAgcHVzaGluZyByZXN1bHRzIHRvIHRoZSByZXN1bHRzIGFycmF5XG5cbiAgICAvLyBUaGlzIHNldHMgdXAgdGhlIHF1ZXVlIHByb2Nlc3NvclxuICAgIC8vIFRoZSBjb25jdXJyZW5jeSBzZXR0aW5nIGxldHMgdXMgcHJvY2VzcyBkb2N1bWVudHNcbiAgICAvLyBpbiBwYXJhbGxlbCB3aGlsZSBsaW1pdGluZyB0b3RhbCBpbXBhY3QuXG4gICAgY29uc3QgcXVldWU6IHF1ZXVlQXNQcm9taXNlZDx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PiA9IGZhc3RxLnByb21pc2UoXG5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIGZvciBlYWNoIGVudHJ5IGluIHRoZVxuICAgICAgICAvLyBxdWV1ZS4gSXQgaGFuZGxlcyByZW5kZXJpbmcgdGhlIHF1ZXVlXG4gICAgICAgIC8vIFRoZSBxdWV1ZSBoYXMgY29uZmlnIG9iamVjdHMgYW5kIHBhdGggc3RyaW5nc1xuICAgICAgICAvLyB3aGljaCBpcyBleGFjdGx5IHdoYXQncyByZXF1aXJlZCBieVxuICAgICAgICAvLyByZW5kZXJEb2N1bWVudFxuICAgICAgICBhc3luYyBmdW5jdGlvbiByZW5kZXJEb2N1bWVudEluUXVldWUoZW50cnkpXG4gICAgICAgICAgICA6IFByb21pc2U8eyByZXN1bHQ/OiBhbnk7IGVycm9yPzogYW55OyB9PlxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckRvY3VtZW50KFxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5jb25maWcsIGVudHJ5LmluZm9cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBET05FIHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyByZXN1bHQgfTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEVSUk9SIHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCwgZXJyb3Iuc3RhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZy5jb25jdXJyZW5jeSk7XG5cbiAgICAvLyBxdWV1ZS5wdXNoIHJldHVybnMgYSBQcm9taXNlIHRoYXQncyBmdWxmaWxsZWQgd2hlblxuICAgIC8vIHRoZSB0YXNrIGZpbmlzaGVzLlxuICAgIC8vIEhlbmNlIHdhaXRGb3IgaXMgYW4gYXJyYXkgb2YgUHJvbWlzZXMuXG4gICAgY29uc3Qgd2FpdEZvciA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5IG9mIGZpbGV6Mikge1xuICAgICAgICB3YWl0Rm9yLnB1c2gocXVldWUucHVzaChlbnRyeSkpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgYXV0b21hdGljYWxseSB3YWl0cyBmb3IgYWxsIHRob3NlXG4gICAgLy8gUHJvbWlzZXMgdG8gcmVzb2x2ZSwgd2hpbGUgbWFraW5nIHRoZSByZXN1bHRzXG4gICAgLy8gYXJyYXkgY29udGFpbiByZXN1bHRzLlxuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGxldCByZXN1bHQgb2Ygd2FpdEZvcikge1xuICAgICAgICByZXN1bHRzLnB1c2goYXdhaXQgcmVzdWx0KTtcbiAgICB9XG5cbiAgICAvLyA0LiBJbnZva2UgaG9va1NpdGVSZW5kZXJlZFxuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ0ludm9raW5nIGhvb2tTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgYXdhaXQgY29uZmlnLmhvb2tTaXRlUmVuZGVyZWQoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaG9va1NpdGVSZW5kZXJlZCBmYWlsZWQgYmVjYXVzZSAke2V9YCk7XG4gICAgfVxuXG4gICAgLy8gNS4gcmV0dXJuIHJlc3VsdHNcbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBkb2N1bWVudCBjYW4gYmUgc2tpcHBlZCBiZWNhdXNlIGl0cyBleGlzdGluZ1xuICogb3V0cHV0IGZpbGUgaXMgdXAtdG8tZGF0ZS5cbiAqXG4gKiBBIGRvY3VtZW50IGlzIGNvbnNpZGVyZWQgdXAtdG8tZGF0ZSB3aGVuIGFuIG91dHB1dCBmaWxlIGV4aXN0cyBhbmRcbiAqIGlzIG5ld2VyIHRoYW4gQk9USDpcbiAqXG4gKiAgIDEuIHRoZSBzb3VyY2UgZG9jdW1lbnQsIGFuZFxuICogICAyLiB0aGUgbGF5b3V0IHRlbXBsYXRlIChpZiBhbnkpIHVzZWQgYnkgdGhlIGRvY3VtZW50LlxuICpcbiAqIEFzIGRlc2NyaWJlZCBpbiBodHRwczovL2dpdGh1Yi5jb20vYWthc2hhY21zL2FrYXNoYXJlbmRlci9pc3N1ZXMvNjFcbiAqIGl0IGlzIG5vdCBmZWFzaWJsZSB0byBkZXRlcm1pbmUgdGhlIHNldCBvZiBwYXJ0aWFscyB1c2VkIGJ5IGEgZ2l2ZW5cbiAqIGRvY3VtZW50LCBzbyBjaGFuZ2VzIHRvIHBhcnRpYWxzIGFyZSBOT1QgZGV0ZWN0ZWQgaGVyZS4gIFVzZVxuICogYC0tZm9yY2UtcmVuZGVyLWFsbGAgKG9yIHRoZSBgZm9yY2VSZW5kZXJBbGxgIG9wdGlvbikgdG8gZm9yY2UgZXZlcnlcbiAqIGRvY3VtZW50IHRvIGJlIHJlLXJlbmRlcmVkLCBmb3IgZXhhbXBsZSBhZnRlciBlZGl0aW5nIGEgcGFydGlhbC5cbiAqXG4gKiBAcGFyYW0gY29uZmlnICAgQWthc2hhQ01TIENvbmZpZ3VyYXRpb25cbiAqIEBwYXJhbSBkb2NJbmZvICBUaGUgZG9jdW1lbnQgaW5mbyBvYmplY3QgKGZyb20gZG9jdW1lbnRzQ2FjaGUuZmluZClcbiAqIEByZXR1cm5zIGB0cnVlYCB3aGVuIHJlbmRlcmluZyBjYW4gYmUgc2tpcHBlZCwgYGZhbHNlYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpc0RvY3VtZW50VXBUb0RhdGUoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm9cbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXG4gICAgLy8gV2l0aG91dCBhIGtub3duIHJlbmRlciBwYXRoIHdlIGNhbm5vdCBsb2NhdGUgdGhlIG91dHB1dCBmaWxlLlxuICAgIGlmICghZG9jSW5mbyB8fCAhZG9jSW5mby5yZW5kZXJQYXRoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IEhUTUwgZG9jdW1lbnRzIHBhc3MgdGhyb3VnaCB0aGUgbGF5b3V0L3BhcnRpYWwgcGlwZWxpbmUuXG4gICAgLy8gQ1NTIGZpbGVzIGFuZCBjb3BpZWQgYXNzZXRzIGFyZSBjaGVhcCBhbmQgaGF2ZSBubyBsYXlvdXRcbiAgICAvLyBkZXBlbmRlbmN5LCBzbyBhbHdheXMgcmUtcHJvY2VzcyB0aGVtIHRvIHN0YXkgY29ycmVjdC5cbiAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGRvY0luZm8udnBhdGgpO1xuICAgIGlmICghcmVuZGVyZXIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCByYyA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgZnNwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgIGJvZHk6IGRvY0luZm8uZG9jQm9keSxcbiAgICAgICAgbWV0YWRhdGE6IGRvY0luZm8ubWV0YWRhdGFcbiAgICB9O1xuICAgIGlmIChyZW5kZXJlci5yZW5kZXJGb3JtYXQocmMpICE9PSAnSFRNTCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIExvY2F0ZSB0aGUgb3V0cHV0IGZpbGUgYW5kIHJlYWQgaXRzIG1vZGlmaWNhdGlvbiB0aW1lLlxuICAgIGxldCBvdXRwdXRNdGltZU1zO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlbmRlckRlc3QgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGNvbnN0IG91dFN0YXRzID0gYXdhaXQgZnNwLnN0YXQocmVuZGVyRGVzdCk7XG4gICAgICAgIG91dHB1dE10aW1lTXMgPSBvdXRTdGF0cy5tdGltZU1zO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBObyBvdXRwdXQgZmlsZSAob3Igbm90IHJlYWRhYmxlKSA9PiBtdXN0IHJlbmRlci5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFRoZSBvdXRwdXQgbXVzdCBiZSBuZXdlciB0aGFuIHRoZSBzb3VyY2UgZG9jdW1lbnQuXG4gICAgaWYgKHR5cGVvZiBkb2NJbmZvLm10aW1lTXMgIT09ICdudW1iZXInXG4gICAgIHx8IGRvY0luZm8ubXRpbWVNcyA+IG91dHB1dE10aW1lTXNcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFRoZSBvdXRwdXQgbXVzdCBiZSBuZXdlciB0aGFuIHRoZSBsYXlvdXQgdGVtcGxhdGUsIGlmIGFueS5cbiAgICBpZiAoZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dCA9IGF3YWl0IGxheW91dHMuZmluZChkb2NJbmZvLm1ldGFkYXRhLmxheW91dCk7XG4gICAgICAgICAgICAvLyBJZiB0aGUgbGF5b3V0IGNhbm5vdCBiZSBmb3VuZCwgZmFsbCB0aHJvdWdoIHRvIHJlbmRlcmluZ1xuICAgICAgICAgICAgLy8gc28gdGhlIGV4aXN0aW5nIGVycm9yIHJlcG9ydGluZyBpbiByZW5kZXJEb2N1bWVudDIgcnVucy5cbiAgICAgICAgICAgIGlmICghbGF5b3V0XG4gICAgICAgICAgICAgfHwgdHlwZW9mIGxheW91dC5tdGltZU1zICE9PSAnbnVtYmVyJ1xuICAgICAgICAgICAgIHx8IGxheW91dC5tdGltZU1zID4gb3V0cHV0TXRpbWVNc1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIE9wdGlvbnMgY29udHJvbGxpbmcgdGhlIGJlaGF2aW9yIG9mIHJlbmRlcjIuXG4gKi9cbmV4cG9ydCB0eXBlIFJlbmRlcjJPcHRpb25zID0ge1xuICAgIC8qKlxuICAgICAqIFdoZW4gdHJ1ZSwgZXZlcnkgZG9jdW1lbnQgaXMgcmUtcmVuZGVyZWQgcmVnYXJkbGVzcyBvZlxuICAgICAqIG91dHB1dCBmaWxlIHRpbWVzdGFtcHMuICBUaGlzIG1hdGNoZXMgdGhlIGhpc3RvcmljYWxcbiAgICAgKiBiZWhhdmlvciBhbmQgaXMgZXhwb3NlZCBvbiB0aGUgQ0xJIGFzIGAtLWZvcmNlLXJlbmRlci1hbGxgLlxuICAgICAqL1xuICAgIGZvcmNlUmVuZGVyQWxsPzogYm9vbGVhbjtcbn07XG5cbi8qKlxuICogUmVuZGVyIGFsbCB0aGUgZG9jdW1lbnRzIGluIGEgc2l0ZSB1c2luZyByZW5kZXJEb2N1bWVudDIsXG4gKiBsaW1pdGluZyB0aGUgbnVtYmVyIG9mIHNpbXVsdGFuZW91cyByZW5kZXJpbmcgdGFza3NcbiAqIHRvIHRoZSBudW1iZXIgaW4gY29uZmlnLmNvbmN1cnJlbmN5LlxuICogXG4gKiBSZXR1cm5zIHN0cnVjdHVyZWQgUmVuZGVyaW5nUmVzdWx0cyBkYXRhIGluc3RlYWQgb2YgdGV4dCBzdHJpbmdzLlxuICpcbiAqIFVubGVzcyBgb3B0aW9ucy5mb3JjZVJlbmRlckFsbGAgaXMgc2V0LCBkb2N1bWVudHMgd2hvc2Ugb3V0cHV0XG4gKiBmaWxlIGlzIG5ld2VyIHRoYW4gYm90aCB0aGUgc291cmNlIGRvY3VtZW50IGFuZCBpdHMgbGF5b3V0XG4gKiB0ZW1wbGF0ZSBhcmUgc2tpcHBlZCAoc2VlIGlzRG9jdW1lbnRVcFRvRGF0ZSkuXG4gKlxuICogQHBhcmFtIGNvbmZpZ1xuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgcmVuZGVyaW5nIGNvbnRyb2xzIChlLmcuIGZvcmNlUmVuZGVyQWxsKVxuICogQHJldHVybnMgQXJyYXkgb2YgUmVuZGVyaW5nUmVzdWx0cyB3aXRoIHBlcmZvcm1hbmNlIGFuZCBlcnJvciBkYXRhXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXIyKFxuICAgIGNvbmZpZyxcbiAgICBvcHRpb25zPzogUmVuZGVyMk9wdGlvbnNcbik6IFByb21pc2U8QXJyYXk8UmVuZGVyaW5nUmVzdWx0cz4+IHtcblxuICAgIGNvbnN0IGZvcmNlUmVuZGVyQWxsID0gb3B0aW9ucz8uZm9yY2VSZW5kZXJBbGwgPT09IHRydWU7XG5cbiAgICBjb25zdCBkb2N1bWVudHMgPSA8RG9jdW1lbnRzQ2FjaGU+Y29uZmlnLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAvLyBjb25zb2xlLmxvZygnQ0FMTElORyBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCcpO1xuICAgIGF3YWl0IGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkKCk7XG4gICAgXG4gICAgLy8gMS4gR2F0aGVyIGxpc3Qgb2YgZmlsZXMgZnJvbSBSZW5kZXJGaWxlQ2FjaGVcbiAgICBjb25zdCBmaWxleiA9IGF3YWl0IGRvY3VtZW50cy5wYXRocygpO1xuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXIyIGZpbGV6ICR7ZmlsZXoubGVuZ3RofWApO1xuXG4gICAgLy8gMi4gRXhjbHVkZSBhbnkgdGhhdCB3ZSB3YW50IHRvIGlnbm9yZVxuICAgIGNvbnN0IGZpbGV6MiA9IFtdIGFzIEFycmF5PHtcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgIH0+O1xuICAgIC8vIERvY3VtZW50cyB0aGF0IHdlcmUgc2tpcHBlZCBiZWNhdXNlIHRoZWlyIG91dHB1dCBpcyB1cC10by1kYXRlLlxuICAgIC8vIFRoZXNlIGFyZSByZXBvcnRlZCBhbG9uZ3NpZGUgdGhlIHJlbmRlcmVkIGRvY3VtZW50cy5cbiAgICBjb25zdCBza2lwcGVkUmVzdWx0cyA9IFtdIGFzIEFycmF5PFJlbmRlcmluZ1Jlc3VsdHM+O1xuICAgIGZvciAobGV0IGVudHJ5IG9mIGZpbGV6KSB7XG4gICAgICAgIGxldCBpbmNsdWRlID0gdHJ1ZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZW50cnkpO1xuICAgICAgICBsZXQgc3RhdHM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdGF0cyA9IGF3YWl0IGZzcC5zdGF0KGVudHJ5LmZzcGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikgeyBzdGF0cyA9IHVuZGVmaW5lZDsgfVxuICAgICAgICBpZiAoIWVudHJ5KSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIGVsc2UgaWYgKCFzdGF0cyB8fCBzdGF0cy5pc0RpcmVjdG9yeSgpKSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIC8vIFRoaXMgc2hvdWxkIGFyaXNlIHVzaW5nIGFuIGlnbm9yZSBjbGF1c2VcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcuRFNfU3RvcmUnKSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIC8vIGVsc2UgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkudnBhdGgpID09PSAnLnBsYWNlaG9sZGVyJykgaW5jbHVkZSA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChpbmNsdWRlKSB7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZW50cnkudnBhdGgpO1xuXG4gICAgICAgICAgICAvLyBTa2lwIGRvY3VtZW50cyB3aG9zZSBvdXRwdXQgZmlsZSBpcyBuZXdlciB0aGFuIGJvdGggdGhlXG4gICAgICAgICAgICAvLyBzb3VyY2UgZG9jdW1lbnQgYW5kIGl0cyBsYXlvdXQgdGVtcGxhdGUsIHVubGVzcyB0aGVcbiAgICAgICAgICAgIC8vIGNhbGxlciBmb3JjZWQgYSBmdWxsIHJlLXJlbmRlci5cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ha2FzaGFjbXMvYWthc2hhcmVuZGVyL2lzc3Vlcy82MVxuICAgICAgICAgICAgaWYgKCFmb3JjZVJlbmRlckFsbFxuICAgICAgICAgICAgICYmIGF3YWl0IGlzRG9jdW1lbnRVcFRvRGF0ZShjb25maWcsIGluZm8pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBza2lwcGVkUmVzdWx0cy5wdXNoKDxSZW5kZXJpbmdSZXN1bHRzPntcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyRm9ybWF0OiAnSFRNTCcsXG4gICAgICAgICAgICAgICAgICAgIHNraXBwZWQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlIHF1ZXVlIGlzIGFuIGFycmF5IG9mIHR1cGxlcyBjb250YWluaW5nIHRoZVxuICAgICAgICAgICAgLy8gY29uZmlnIG9iamVjdCBhbmQgdGhlIHBhdGggc3RyaW5nXG4gICAgICAgICAgICBmaWxlejIucHVzaCh7XG4gICAgICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXG4gICAgICAgICAgICAgICAgaW5mbzogaW5mb1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjIgZmlsZXoyIGFmdGVyIGlnbm9yZSAke2ZpbGV6Mi5sZW5ndGh9YCk7XG5cbiAgICAvLyAzLiBNYWtlIGEgZmFzdHEgdG8gcHJvY2VzcyB1c2luZyByZW5kZXJEb2N1bWVudDIsXG4gICAgLy8gICAgcHVzaGluZyByZXN1bHRzIHRvIHRoZSByZXN1bHRzIGFycmF5XG5cbiAgICAvLyBUaGlzIHNldHMgdXAgdGhlIHF1ZXVlIHByb2Nlc3NvclxuICAgIC8vIFRoZSBjb25jdXJyZW5jeSBzZXR0aW5nIGxldHMgdXMgcHJvY2VzcyBkb2N1bWVudHNcbiAgICAvLyBpbiBwYXJhbGxlbCB3aGlsZSBsaW1pdGluZyB0b3RhbCBpbXBhY3QuXG4gICAgY29uc3QgcXVldWU6IHF1ZXVlQXNQcm9taXNlZDx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PiA9IGZhc3RxLnByb21pc2UoXG5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIGZvciBlYWNoIGVudHJ5IGluIHRoZVxuICAgICAgICAvLyBxdWV1ZS4gSXQgaGFuZGxlcyByZW5kZXJpbmcgdGhlIHF1ZXVlXG4gICAgICAgIC8vIFRoZSBxdWV1ZSBoYXMgY29uZmlnIG9iamVjdHMgYW5kIHBhdGggc3RyaW5nc1xuICAgICAgICAvLyB3aGljaCBpcyBleGFjdGx5IHdoYXQncyByZXF1aXJlZCBieVxuICAgICAgICAvLyByZW5kZXJEb2N1bWVudDJcbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnQySW5RdWV1ZShlbnRyeSlcbiAgICAgICAgICAgIDogUHJvbWlzZTxSZW5kZXJpbmdSZXN1bHRzPlxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQySW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudDIoXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5LmNvbmZpZywgZW50cnkuaW5mb1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYERPTkUgcmVuZGVyRG9jdW1lbnQySW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEVSUk9SIHJlbmRlckRvY3VtZW50MkluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWAsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb25maWcuY29uY3VycmVuY3kpO1xuXG4gICAgLy8gcXVldWUucHVzaCByZXR1cm5zIGEgUHJvbWlzZSB0aGF0J3MgZnVsZmlsbGVkIHdoZW5cbiAgICAvLyB0aGUgdGFzayBmaW5pc2hlcy5cbiAgICAvLyBIZW5jZSB3YWl0Rm9yIGlzIGFuIGFycmF5IG9mIFByb21pc2VzLlxuICAgIGNvbnN0IHdhaXRGb3IgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxlejIpIHtcbiAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGF1dG9tYXRpY2FsbHkgd2FpdHMgZm9yIGFsbCB0aG9zZVxuICAgIC8vIFByb21pc2VzIHRvIHJlc29sdmUsIHdoaWxlIG1ha2luZyB0aGUgcmVzdWx0c1xuICAgIC8vIGFycmF5IGNvbnRhaW4gcmVzdWx0cy5cbiAgICBjb25zdCByZXN1bHRzOiBBcnJheTxSZW5kZXJpbmdSZXN1bHRzPiA9IFtdO1xuICAgIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgIH1cblxuICAgIC8vIEluY2x1ZGUgdGhlIGRvY3VtZW50cyB0aGF0IHdlcmUgc2tpcHBlZCBiZWNhdXNlIHRoZWlyXG4gICAgLy8gb3V0cHV0IHdhcyB1cC10by1kYXRlLCBzbyBjYWxsZXJzIGNhbiByZXBvcnQgdGhlbS5cbiAgICBmb3IgKGxldCBza2lwcGVkIG9mIHNraXBwZWRSZXN1bHRzKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChza2lwcGVkKTtcbiAgICB9XG5cbiAgICAvLyA0LiBJbnZva2UgaG9va1NpdGVSZW5kZXJlZFxuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ0ludm9raW5nIGhvb2tTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgYXdhaXQgY29uZmlnLmhvb2tTaXRlUmVuZGVyZWQoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaG9va1NpdGVSZW5kZXJlZCBmYWlsZWQgYmVjYXVzZSAke2V9YCk7XG4gICAgfVxuXG4gICAgLy8gNS4gcmV0dXJuIHJlc3VsdHNcbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG4iXX0=