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
 * Render all the documents in a site using renderDocument2,
 * limiting the number of simultaneous rendering tasks
 * to the number in config.concurrency.
 *
 * Returns structured RenderingResults data instead of text strings.
 *
 * @param config
 * @returns Array of RenderingResults with performance and error data
 */
export async function render2(config) {
    const documents = config.akasha.filecache.documentsCache;
    // await documents.isReady();
    // console.log('CALLING config.hookBeforeSiteRendered');
    await config.hookBeforeSiteRendered();
    // 1. Gather list of files from RenderFileCache
    const filez = await documents.paths();
    // console.log(`render2 filez ${filez.length}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sU0FBUyxFQUFFLEVBQ2QsdUJBQXVCLEVBQzFCLE1BQU0sV0FBVyxDQUFDO0FBRW5CLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQVUxQixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUE0RDlDLFNBQVMsbUJBQW1CLENBQ3hCLE1BQXFCLEVBQ3JCLE9BQU87SUFFUCxNQUFNLEdBQUcsR0FBa0I7UUFDdkIsTUFBTTtRQUVOLGtCQUFrQixFQUFvQjtZQUNsQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEtBQUs7WUFDckIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxVQUFVO1lBQzNCLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTztZQUNyQixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7U0FDN0I7UUFFRCxRQUFRLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUNqQixPQUFPLENBQUMsS0FBSyxDQUM1QjtRQUVELE9BQU87UUFDUCxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7UUFDcEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1FBQzlCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtRQUM5QixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7UUFFekIsT0FBTyxFQUFvQjtZQUN2QixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7WUFDcEIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1lBQzlCLFdBQVcsRUFBRSxXQUFXLENBQUMsR0FBRyxFQUFFO1lBQzlCLE1BQU0sRUFBRSxJQUFJLEtBQUssRUFBUztTQUM3QjtLQUNKLENBQUM7SUFDRixJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNmLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFFRCwwREFBMEQ7QUFFMUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxhQUFhLENBQy9CLE1BQXFCLEVBQ3JCLEVBQW9CO0lBVXBCLHFDQUFxQztJQUNyQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQ3BDLEVBQUUsQ0FBQyxNQUFNLENBQ1osQ0FBQztJQUNGLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNaLE9BQU87WUFDSCxZQUFZLEVBQUUsU0FBUztZQUN2QixNQUFNLEVBQUUsU0FBUztZQUNqQixRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUk7U0FDcEIsQ0FBQztJQUNOLENBQUM7SUFFRCxzQ0FBc0M7SUFDdEMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQzVCLEVBQUUsQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO1FBQ3RDLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUM7SUFDRixFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUMxQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDOUQsQ0FBQyxDQUFDO0lBQ0YsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNuQyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBRW5DLDZCQUE2QjtJQUM3QixJQUFJLFdBQVcsR0FBRyxNQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFNUMsdURBQXVEO0lBQ3ZELE9BQU87UUFDSCxZQUFZLEVBQUUsUUFBUSxDQUFDLElBQUk7UUFDM0IsTUFBTSxFQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1FBQ2pDLFFBQVEsRUFBRSxXQUFXO0tBQ3hCLENBQUM7QUFDTixDQUFDO0FBRUQsNkNBQTZDO0FBQzdDLDJCQUEyQjtBQUUzQixLQUFLLFVBQVUsZ0JBQWdCLENBQzNCLE1BQXFCLEVBQ3JCLE9BQU8sRUFDUCxXQUFXLEVBQ1gsV0FBaUI7SUFHakIsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FDbkIsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDakQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNoRCxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFO1FBQ2pCLFNBQVMsRUFBRSxJQUFJO0tBQ2xCLENBQUMsQ0FBQztJQUNYLE1BQU0sR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3hELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUNyQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQ2IsT0FBTyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsS0FBSyxFQUNqQyxNQUFNLENBQUMsUUFBUSxFQUNmLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM3QixPQUFPLE9BQU8sT0FBTyxDQUFDLEtBQUssUUFBUSxPQUFPLENBQUMsVUFBVSxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsSUFBSSxjQUFjLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0FBRWxNLENBQUM7QUFFRCxLQUFLLFVBQVUsaUJBQWlCLENBQzVCLE1BQXFCLEVBQ3JCLE9BQU8sRUFDUCxXQUFXLEVBQ1gsV0FBaUI7SUFHakIsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FDbkIsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDakQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNoRCxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFO1FBQ2pCLFNBQVMsRUFBRSxJQUFJO0tBQ2xCLENBQUMsQ0FBQztJQUNYLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUNiLGFBQWEsQ0FBQyxDQUFDO0lBQ25DLDhEQUE4RDtJQUM5RCxNQUFNLGVBQWUsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ25DLE9BQU8sUUFBUSxPQUFPLENBQUMsS0FBSyxRQUFRLGFBQWEsS0FBSyxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxJQUFJLFdBQVcsQ0FBQztBQUNoSSxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsSUFBUyxFQUFFLEdBQVEsRUFBRSxZQUFxQjtJQUM5RCxLQUFLLElBQUksS0FBSyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLElBQUksWUFBWSxJQUFJLEtBQUssS0FBSyxRQUFRO1lBQUUsU0FBUztRQUNqRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDO0FBRUQsS0FBSyxVQUFVLGFBQWEsQ0FBQyxHQUFrQjtJQUMzQyxJQUFJLENBQUM7UUFDRCxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDakMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFakQseUJBQXlCO1FBQ3pCLEdBQUcsQ0FBQyxhQUFhLEdBQUcsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUN0RSxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFL0MsbUNBQW1DO1FBQ25DLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxRSxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUU1RCxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDL0MsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzlDLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkYsQ0FBQztJQUNELDBCQUEwQjtJQUMxQixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM3RCxHQUFHLENBQUMsT0FBTyxDQUFDLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7SUFDL0YsQ0FBQztJQUNELEdBQUcsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLEdBQUcsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNuRCxHQUFHLENBQUMsT0FBTyxDQUFDLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO0lBQ3JGLENBQUM7SUFFRCxrREFBa0Q7SUFFbEQsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQsS0FBSyxVQUFVLGFBQWEsQ0FBQyxHQUFrQjtJQUMzQyxJQUFJLENBQUM7UUFDRCxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7UUFDbEMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFakQsMENBQTBDO1FBQzFDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxRSxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUVuRCxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDL0MsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzlDLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkYsQ0FBQztJQUVELDBCQUEwQjtJQUMxQixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM3RCxHQUFHLENBQUMsT0FBTyxDQUFDLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7SUFDL0YsQ0FBQztJQUNELEdBQUcsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLEdBQUcsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNuRCxHQUFHLENBQUMsT0FBTyxDQUFDLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO0lBQ3JGLENBQUM7SUFFRCxvQ0FBb0M7SUFDcEMsc0RBQXNEO0lBRXRELGtEQUFrRDtJQUNsRCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFJRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBMkJHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxlQUFlLENBQ2pDLE1BQXFCLEVBQ3JCLE9BQU87SUFHUCw0Q0FBNEM7SUFDNUMsTUFBTSxHQUFHLEdBQWtCLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUVoRSxzQ0FBc0M7SUFDdEMsSUFBSSxHQUFHLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQztRQUNoRSxNQUFNLFNBQVMsR0FBRyxNQUFNLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQyxPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUM7SUFDN0IsQ0FBQztTQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUTtXQUNwQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxFQUNoRSxDQUFDO1FBQ0MsTUFBTSxXQUFXLEdBQUcsTUFBTSxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0MsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDO0lBQy9CLENBQUM7SUFFRCx1QkFBdUI7SUFDdkIsd0RBQXdEO0lBQ3hELHVEQUF1RDtJQUV2RCxtREFBbUQ7SUFDbkQsMkRBQTJEO0lBQzNELHNCQUFzQjtJQUN0QixNQUFNLFNBQVMsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUNsQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDdEMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzlELENBQUMsQ0FBQztJQUVGLGVBQWU7SUFDZixHQUFHLENBQUMsT0FBTyxDQUFDLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUVqRCxJQUFJLENBQUM7UUFDRCxzQ0FBc0M7UUFDdEMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ2hELEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQztRQUNwRCxHQUFHLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxhQUFhLENBQUM7UUFDNUQsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUN2RCxHQUFHLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBRXZELDZCQUE2QjtRQUM3QixHQUFHLENBQUMsYUFBYSxHQUFHLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDOUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRixrREFBa0Q7UUFDbEQsR0FBRyxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVELEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUMvQyxtQkFBbUI7SUFFbkIsZ0JBQWdCO0lBQ2hCLEdBQUcsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRWxELElBQUksR0FBRyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUM7UUFDakMsSUFBSSxDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO1lBQ3JELDJCQUEyQjtZQUUzQixJQUFJLEtBQUssR0FBRyxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNULE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLHNCQUFzQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxZQUFZLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDeEosR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDO2dCQUM5QyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9CLGlEQUFpRDtnQkFDakQsR0FBRyxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDO1lBQzNDLENBQUM7aUJBQU0sQ0FBQztnQkFDSixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQ3BDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FDOUIsQ0FBQztnQkFFRixHQUFHLENBQUMsbUJBQW1CLEdBQXFCO29CQUN4QyxNQUFNLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTTtvQkFDbkMsT0FBTyxFQUFFLEtBQUssQ0FBQyxVQUFVO29CQUN6QixJQUFJLEVBQUUsS0FBSyxDQUFDLE9BQU87b0JBQ25CLFFBQVEsRUFBRSxFQUFFO2lCQUNmLENBQUM7Z0JBRUYsR0FBRyxDQUFDLG1CQUFtQixDQUFDLFFBQVE7c0JBQzFCLGNBQWMsQ0FDWixHQUFHLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUNoQyxLQUFLLENBQUMsUUFBUSxFQUNkLEtBQUssQ0FDUixDQUFDO2dCQUNOLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRO3NCQUMxQixjQUFjLENBQ1osR0FBRyxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFDaEMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQ3BCLElBQUksQ0FDUCxDQUFDO2dCQUVOLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUM7Z0JBRTdELEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztnQkFDakQsR0FBRyxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDO2dCQUNyRCxHQUFHLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxhQUFhLENBQUM7Z0JBQzdELEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQ3hELEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBRXhELDRCQUE0QjtnQkFDNUIsR0FBRyxDQUFDLGNBQWMsR0FBRyxNQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDeEUsQ0FBQztRQUNMLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsbUJBQW1CLE9BQU8sQ0FBQyxLQUFLLFNBQVMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN2SCxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7WUFDOUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLHNDQUFzQztZQUN0QyxHQUFHLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUM7UUFDM0MsQ0FBQztJQUNMLENBQUM7SUFFRCxHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDaEQsb0JBQW9CO0lBRXBCLFlBQVk7SUFDWixHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFaEQsR0FBRyxDQUFDLGlCQUFpQixHQUFxQjtRQUN0QyxNQUFNLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTTtRQUNuQyxPQUFPLEVBQUUsR0FBRyxDQUFDLGNBQWM7WUFDdkIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhO1FBQzVDLElBQUksRUFBRSxHQUFHLENBQUMsY0FBYztZQUNwQixDQUFDLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWE7UUFDNUMsUUFBUSxFQUFFLEVBQUU7S0FDZixDQUFDO0lBRUYsR0FBRyxDQUFDLGlCQUFpQixDQUFDLFFBQVE7VUFDeEIsY0FBYyxDQUNaLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQzlCLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUNwQixLQUFLLENBQ1IsQ0FBQztJQUVOLElBQUksQ0FBQztRQUNELElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxDQUFDO1lBQ2pELFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFRCxHQUFHLENBQUMsWUFBWSxHQUFJLE1BQU0sU0FBUyxDQUFDLFlBQVksQ0FDNUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUM3RCxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVM7UUFDcEIsNkJBQTZCO1FBQzdCLE1BQU0sQ0FBQyxXQUFXO1lBQ2xCLENBQUMsQ0FBQyxJQUFJLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFDakQsQ0FBQyxDQUFDLFNBQVMsRUFDWCxNQUFNLENBQUMsV0FBVztZQUNsQixDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLO1lBQ25CLENBQUMsQ0FBQyxTQUFTLENBQ2QsQ0FBQztJQUNOLENBQUM7SUFBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1FBQ1YsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxTQUFTLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZJLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUM5QyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0IsZ0RBQWdEO1FBQ2hELEdBQUcsQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQztJQUNyRCxDQUFDO0lBRUQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzlDLGdCQUFnQjtJQUVoQixJQUFJLENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUNoQixHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3RDLFNBQVMsRUFBRSxJQUFJO1NBQ2xCLENBQUMsQ0FBQztRQUNILE1BQU0sR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQ1YsR0FBRyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUM5QyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFRCxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFMUMsMEJBQTBCO0lBQzFCLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdELEdBQUcsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztJQUMvRixDQUFDO0lBQ0QsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDL0QsR0FBRyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO0lBQ2xHLENBQUM7SUFDRCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDM0QsR0FBRyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQztJQUM1RixDQUFDO0lBQ0QsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25ELEdBQUcsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7SUFDckYsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDdkIsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sQ0FBQyxLQUFLLFVBQVUsY0FBYyxDQUNoQyxNQUFxQixFQUNyQixPQUFPO0lBR1AsTUFBTSxXQUFXLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUUvQiwwQkFBMEI7SUFFMUIsSUFBSSxPQUFPLE9BQU8sQ0FBQyxVQUFVLEtBQUssUUFBUTtXQUN0QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEtBQUssUUFBUSxFQUNyQyxDQUFDO1FBQ0Msc0RBQXNEO0lBQzFELENBQUM7SUFFRCxNQUFNLEVBQUUsR0FBcUI7UUFDekIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsVUFBVTtRQUMzQixJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU87UUFDckIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO0tBQzdCLENBQUM7SUFFRiwyREFBMkQ7SUFFM0QsSUFBSSxTQUFTLENBQUMsQ0FBTSxzQkFBc0I7SUFDMUMsSUFBSSxXQUFXLENBQUM7SUFDaEIsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxhQUFhLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzFCLFdBQVcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO0lBQ2xDLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsT0FBTyxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNuRixNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixPQUFPLENBQUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3pGLENBQUM7SUFDRCxzRkFBc0Y7SUFDdEYsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQ2xCLE9BQU8sQ0FBQyxLQUFLLEVBQ2IsTUFBTSxDQUFDLFFBQVEsRUFDaEIsY0FBYyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRTlDLG9EQUFvRDtJQUNwRCwwREFBMEQ7SUFFMUQsSUFBSSxTQUFTLEtBQUssS0FBSyxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDO1lBQ0QsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBQUMsT0FBTSxHQUFHLEVBQUUsQ0FBQztZQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLE9BQU8sQ0FBQyxLQUFLLE9BQU8sT0FBTyxDQUFDLFVBQVUsVUFBVSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3pILE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLE9BQU8sQ0FBQyxLQUFLLE9BQU8sT0FBTyxDQUFDLFVBQVUsVUFBVSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQy9ILENBQUM7SUFDTCxDQUFDO0lBRUQsSUFBSSxTQUFTLEtBQUssTUFBTSxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDO1lBQ0QsaUJBQWlCLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUFDLE9BQU0sR0FBRyxFQUFFLENBQUM7WUFDVixPQUFPLENBQUMsS0FBSyxDQUFDLHNCQUFzQixPQUFPLENBQUMsS0FBSyxPQUFPLE9BQU8sQ0FBQyxVQUFVLFVBQVUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNuSCxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixPQUFPLENBQUMsS0FBSyxPQUFPLE9BQU8sQ0FBQyxVQUFVLFVBQVUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN6SCxDQUFDO0lBQ0wsQ0FBQztJQUVELGtEQUFrRDtJQUNsRCxzQkFBc0I7SUFFdEIsSUFBSSxZQUFZLENBQUM7SUFDakIsSUFBSSxjQUFjLENBQUM7SUFDbkIsSUFBSSxNQUFNLENBQUM7SUFDWCxpS0FBaUs7SUFDakssSUFBSSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDO1FBRTVCLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztRQUNyRCwyQkFBMkI7UUFFM0IsSUFBSSxLQUFLLEdBQUcsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDdkksQ0FBQztRQUVELE1BQU0sUUFBUSxHQUFxQjtZQUMvQixNQUFNLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNO1lBQy9CLE9BQU8sRUFBRSxLQUFLLENBQUMsVUFBVTtZQUN6QixJQUFJLEVBQUUsS0FBSyxDQUFDLE9BQU87WUFDbkIsUUFBUSxFQUFFLEVBQUU7U0FDZixDQUFDO1FBRUYsUUFBUSxDQUFDLFFBQVE7Y0FDWCxjQUFjLENBQ1osUUFBUSxDQUFDLFFBQVEsRUFDakIsS0FBSyxDQUFDLFFBQVEsRUFDZCxLQUFLLENBQ1IsQ0FBQztRQUNOLFFBQVEsQ0FBQyxRQUFRO2NBQ1gsY0FBYyxDQUNaLFFBQVEsQ0FBQyxRQUFRLEVBQ2pCLE9BQU8sQ0FBQyxRQUFRLEVBQ2hCLElBQUksQ0FDUCxDQUFDO1FBQ04sUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDO1FBRXhDLElBQUksQ0FBQztZQUNELE1BQU07a0JBQ0EsTUFBTSxhQUFhLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzVDLFlBQVksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQzdCLGNBQWMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ3JDLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsSUFBSSxFQUFFLEdBQUcsSUFBSSxLQUFLLENBQUMsbUJBQW1CLE9BQU8sQ0FBQyxLQUFLLFNBQVMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsSCxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sRUFBRSxDQUFDO1FBQ2IsQ0FBQztJQUNMLENBQUM7U0FBTSxDQUFDO1FBQ0osWUFBWSxHQUFHLFNBQVMsQ0FBQztRQUN6QixjQUFjLEdBQUcsV0FBVyxDQUFDO0lBQ2pDLENBQUM7SUFFRCxzR0FBc0c7SUFFdEcsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ3RDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUNsQixPQUFPLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQzlCLGVBQWUsRUFDZixXQUFXLENBQUMsQ0FBQztJQUcvQix3REFBd0Q7SUFDeEQseURBQXlEO0lBQ3pELGlDQUFpQztJQUVqQyxJQUFJLENBQUM7UUFFRCxNQUFNLFlBQVksR0FDWixjQUFjLENBQ1osRUFBRyxFQUNILE9BQU8sQ0FBQyxRQUFRLEVBQ2hCLEtBQUssQ0FDUixDQUFDO1FBQ04sWUFBWSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUM7UUFFbkMsSUFBSSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsQ0FBQztZQUM3QyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFDRCw2Q0FBNkM7UUFDN0MsY0FBYyxHQUFHLE1BQU0sU0FBUyxDQUFDLFlBQVksQ0FDekMsY0FBYyxFQUFFLFlBQVksRUFDNUIsTUFBTSxDQUFDLFNBQVMsQ0FDbkIsQ0FBQztRQUVGLG1GQUFtRjtJQUN2RixDQUFDO0lBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztRQUNWLElBQUksR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLHdCQUF3QixPQUFPLENBQUMsS0FBSyxTQUFTLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0gsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixNQUFNLEdBQUcsQ0FBQztJQUNkLENBQUM7SUFFRCxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFDaEIsT0FBTyxDQUFDLEtBQUssRUFDYixNQUFNLENBQUMsUUFBUSxFQUNmLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUU5QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUNoQixNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNqRCxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUN0QyxTQUFTLEVBQUUsSUFBSTtLQUNsQixDQUFDLENBQUM7SUFDSCxNQUFNLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUNWLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUU3QyxpRkFBaUY7SUFDakYsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0lBQ3JDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FDYixPQUFPLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQ2pDLE1BQU0sQ0FBQyxRQUFRLEVBQ2YsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQzdCLE9BQU8sR0FBRyxZQUFZLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxPQUFPLENBQUMsVUFBVSxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsSUFBSSxjQUFjLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0FBRTlNLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxNQUFNLENBQUMsTUFBTTtJQUUvQixNQUFNLFNBQVMsR0FBbUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDO0lBQ3pFLDZCQUE2QjtJQUM3Qix3REFBd0Q7SUFDeEQsTUFBTSxNQUFNLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztJQUV0QywrQ0FBK0M7SUFDL0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdEMsb0RBQW9EO0lBRXBELHdDQUF3QztJQUN4QyxNQUFNLE1BQU0sR0FBRyxFQUdiLENBQUM7SUFDSCxLQUFLLElBQUksS0FBSyxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ3RCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztRQUNuQixzQkFBc0I7UUFDdEIsSUFBSSxLQUFLLENBQUM7UUFDVixJQUFJLENBQUM7WUFDRCxLQUFLLEdBQUcsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7UUFBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxLQUFLO1lBQUUsT0FBTyxHQUFHLEtBQUssQ0FBQzthQUN2QixJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFBRSxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3hELDJDQUEyQztRQUMzQyx3RUFBd0U7UUFDeEUsMkVBQTJFO1FBRTNFLElBQUksT0FBTyxFQUFFLENBQUM7WUFDVixpREFBaUQ7WUFDakQsb0NBQW9DO1lBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUM7Z0JBQ1IsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsSUFBSSxFQUFFLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO2FBQzFDLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDTCxDQUFDO0lBQ0QsbUVBQW1FO0lBR25FLG1EQUFtRDtJQUNuRCwwQ0FBMEM7SUFFMUMsbUNBQW1DO0lBQ25DLG9EQUFvRDtJQUNwRCwyQ0FBMkM7SUFDM0MsTUFBTSxLQUFLLEdBR04sS0FBSyxDQUFDLE9BQU87SUFFZCxpREFBaUQ7SUFDakQsd0NBQXdDO0lBQ3hDLGdEQUFnRDtJQUNoRCxzQ0FBc0M7SUFDdEMsaUJBQWlCO0lBQ2pCLEtBQUssVUFBVSxxQkFBcUIsQ0FBQyxLQUFLO1FBR3RDLDREQUE0RDtRQUM1RCxJQUFJLENBQUM7WUFDRCxJQUFJLE1BQU0sR0FBRyxNQUFNLGNBQWMsQ0FDN0IsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUMzQixDQUFDO1lBQ0YseUVBQXlFO1lBQ3pFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQztRQUN0QixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLCtFQUErRTtZQUMvRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQztJQUNMLENBQUMsRUFDRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFeEIscURBQXFEO0lBQ3JELHFCQUFxQjtJQUNyQix5Q0FBeUM7SUFDekMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLEtBQUssSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7UUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxnREFBZ0Q7SUFDaEQseUJBQXlCO0lBQ3pCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNuQixLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsNkJBQTZCO0lBRTdCLElBQUksQ0FBQztRQUNELDRDQUE0QztRQUM1QyxNQUFNLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsb0JBQW9CO0lBQ3BCLE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUM7QUFBQSxDQUFDO0FBRUY7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxPQUFPLENBQUMsTUFBTTtJQUVoQyxNQUFNLFNBQVMsR0FBbUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDO0lBQ3pFLDZCQUE2QjtJQUM3Qix3REFBd0Q7SUFDeEQsTUFBTSxNQUFNLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztJQUV0QywrQ0FBK0M7SUFDL0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdEMsZ0RBQWdEO0lBRWhELHdDQUF3QztJQUN4QyxNQUFNLE1BQU0sR0FBRyxFQUdiLENBQUM7SUFDSCxLQUFLLElBQUksS0FBSyxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ3RCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztRQUNuQixzQkFBc0I7UUFDdEIsSUFBSSxLQUFLLENBQUM7UUFDVixJQUFJLENBQUM7WUFDRCxLQUFLLEdBQUcsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7UUFBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxLQUFLO1lBQUUsT0FBTyxHQUFHLEtBQUssQ0FBQzthQUN2QixJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFBRSxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3hELDJDQUEyQztRQUMzQyx3RUFBd0U7UUFDeEUsMkVBQTJFO1FBRTNFLElBQUksT0FBTyxFQUFFLENBQUM7WUFDVixpREFBaUQ7WUFDakQsb0NBQW9DO1lBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUM7Z0JBQ1IsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsSUFBSSxFQUFFLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO2FBQzFDLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDTCxDQUFDO0lBQ0QsK0RBQStEO0lBRS9ELG9EQUFvRDtJQUNwRCwwQ0FBMEM7SUFFMUMsbUNBQW1DO0lBQ25DLG9EQUFvRDtJQUNwRCwyQ0FBMkM7SUFDM0MsTUFBTSxLQUFLLEdBR04sS0FBSyxDQUFDLE9BQU87SUFFZCxpREFBaUQ7SUFDakQsd0NBQXdDO0lBQ3hDLGdEQUFnRDtJQUNoRCxzQ0FBc0M7SUFDdEMsa0JBQWtCO0lBQ2xCLEtBQUssVUFBVSxzQkFBc0IsQ0FBQyxLQUFLO1FBR3ZDLDZEQUE2RDtRQUM3RCxJQUFJLENBQUM7WUFDRCxJQUFJLE1BQU0sR0FBRyxNQUFNLGVBQWUsQ0FDOUIsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUMzQixDQUFDO1lBQ0Ysa0VBQWtFO1lBQ2xFLE9BQU8sTUFBTSxDQUFDO1FBQ2xCLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0UsT0FBTyxTQUFTLENBQUM7UUFDckIsQ0FBQztJQUNMLENBQUMsRUFDRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFeEIscURBQXFEO0lBQ3JELHFCQUFxQjtJQUNyQix5Q0FBeUM7SUFDekMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLEtBQUssSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7UUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxnREFBZ0Q7SUFDaEQseUJBQXlCO0lBQ3pCLE1BQU0sT0FBTyxHQUE0QixFQUFFLENBQUM7SUFDNUMsS0FBSyxJQUFJLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUN6QixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sTUFBTSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELDZCQUE2QjtJQUU3QixJQUFJLENBQUM7UUFDRCw0Q0FBNEM7UUFDNUMsTUFBTSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVELG9CQUFvQjtJQUNwQixPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDO0FBQUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0ICogYXMgZGF0YSBmcm9tICcuL2RhdGEuanMnO1xuaW1wb3J0IG1haGFiaHV0YSwge1xuICAgIEZpbGVzeXN0ZW1QZXJmRGF0YVN0b3JlXG59IGZyb20gJ21haGFiaHV0YSc7XG5cbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgdHlwZSB7IHF1ZXVlQXNQcm9taXNlZCB9IGZyb20gXCJmYXN0cVwiO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vaW5kZXguanMnO1xuaW1wb3J0IHsgUmVuZGVyZXIsIFJlbmRlcmluZ0NvbnRleHQgfSBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQge1xuICAgIERvY3VtZW50c0NhY2hlXG59IGZyb20gJy4vY2FjaGUvY2FjaGUtc3FsaXRlLmpzJztcbmltcG9ydCB7XG4gICAgRG9jdW1lbnRcbn0gZnJvbSAnLi9jYWNoZS9zY2hlbWEuanMnO1xuaW1wb3J0IHsgcGVyZm9ybWFuY2UgfSBmcm9tICdub2RlOnBlcmZfaG9va3MnO1xuXG4vLyBGb3IgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzLzEwM1xuLy8gVGhlIGlkZWEgaXMgbm9ybWFsaXppbmcgdGhlIGRhdGEgcmV0dXJuZWQuICBUaGlzIHNob3VsZFxuLy8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB0aGUgZGF0YSBtb2R1bGUuICBUaGlzIHNob3VsZFxuLy8gaW1wcm92ZSB0aGUgYW5hbHl6ZWFiaWxpdHkgb2YgZGF0YSBhYm91dCB0aGUgcmVuZGVyaW5nIHByb2Nlc3MuXG5cbmV4cG9ydCB0eXBlIFJlbmRlcmluZ1Jlc3VsdHMgPSB7XG5cbiAgICB2cGF0aD86IHN0cmluZztcbiAgICByZW5kZXJQYXRoPzogc3RyaW5nO1xuXG4gICAgcmVuZGVyRm9ybWF0OiBzdHJpbmc7XG5cbiAgICByZW5kZXJTdGFydD86IG51bWJlcjtcbiAgICByZW5kZXJFbmQ/OiBudW1iZXI7XG5cbiAgICByZW5kZXJGaXJzdFN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlckZpcnN0RW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyTGF5b3V0U3RhcnQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTGF5b3V0RW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyTWFoYVN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlck1haGFFbmQ/OiBudW1iZXI7XG5cbiAgICAvLyBFbGFwc2VkIHRpbWUgY2FsY3VsYXRpb25zXG4gICAgcmVuZGVyRmlyc3RFbGFwc2VkPzogbnVtYmVyO1xuICAgIHJlbmRlckxheW91dEVsYXBzZWQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTWFoYUVsYXBzZWQ/OiBudW1iZXI7XG4gICAgcmVuZGVyVG90YWxFbGFwc2VkPzogbnVtYmVyO1xuXG4gICAgZXJyb3JzPzogQXJyYXk8RXJyb3I+O1xufTtcblxuLy8gQ29sbGVjdCBhbGwgcmVxdWlyZWQgZGF0YSBpbiBhbiBpbnN0YW5jZSBvZiB0aGlzIG9iamVjdC5cbnR5cGUgUmVuZGVyaW5nRGF0YSA9IHtcbiAgICBjb25maWc/OiBDb25maWd1cmF0aW9uO1xuICAgIHJlbmRlcmVyPzogUmVuZGVyZXI7XG5cbiAgICBkb2NJbmZvPzogYW55O1xuXG4gICAgdnBhdGg/OiBzdHJpbmc7XG4gICAgcmVuZGVyUGF0aD86IHN0cmluZztcbiAgICBtb3VudFBvaW50Pzogc3RyaW5nO1xuICAgIHJlbmRlclRvPzogc3RyaW5nO1xuXG4gICAgcmVuZGVyRmlyc3RDb250ZXh0PzogUmVuZGVyaW5nQ29udGV4dDtcbiAgICByZW5kZXJlZEZpcnN0Pzogc3RyaW5nO1xuXG4gICAgbGF5b3V0Rm9ybWF0Pzogc3RyaW5nO1xuICAgIHJlbmRlckxheW91dENvbnRleHQ/OiBSZW5kZXJpbmdDb250ZXh0O1xuICAgIHJlbmRlcmVkTGF5b3V0Pzogc3RyaW5nO1xuXG4gICAgcmVuZGVyTWFoYUNvbnRleHQ/OiBSZW5kZXJpbmdDb250ZXh0O1xuICAgIHJlbmRlcmVkTWFoYT86IHN0cmluZztcblxuICAgIHJlc3VsdHM/OiBSZW5kZXJpbmdSZXN1bHRzO1xufTtcblxuZnVuY3Rpb24gY3JlYXRlUmVuZGVyaW5nRGF0YShcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mb1xuKTogUmVuZGVyaW5nRGF0YSB7XG4gICAgY29uc3QgcmV0ID0gPFJlbmRlcmluZ0RhdGE+e1xuICAgICAgICBjb25maWcsXG5cbiAgICAgICAgcmVuZGVyRmlyc3RDb250ZXh0OiA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgICAgICBmc3BhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBkb2NJbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogZG9jSW5mby5tZXRhZGF0YVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlcmVyOiBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGhcbiAgICAgICAgKSxcblxuICAgICAgICBkb2NJbmZvLFxuICAgICAgICB2cGF0aDogZG9jSW5mby52cGF0aCxcbiAgICAgICAgcmVuZGVyUGF0aDogZG9jSW5mby5yZW5kZXJQYXRoLFxuICAgICAgICBtb3VudFBvaW50OiBkb2NJbmZvLm1vdW50UG9pbnQsXG4gICAgICAgIHJlbmRlclRvOiBjb25maWcucmVuZGVyVG8sXG5cbiAgICAgICAgcmVzdWx0czogPFJlbmRlcmluZ1Jlc3VsdHM+e1xuICAgICAgICAgICAgdnBhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBkb2NJbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJTdGFydDogcGVyZm9ybWFuY2Uubm93KCksXG4gICAgICAgICAgICBlcnJvcnM6IG5ldyBBcnJheTxFcnJvcj4oKVxuICAgICAgICB9XG4gICAgfTtcbiAgICBpZiAocmV0LnJlbmRlcmVyKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZvcm1hdCA9IHJldC5yZW5kZXJlci5yZW5kZXJGb3JtYXQocmV0LnJlbmRlckZpcnN0Q29udGV4dCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBUaGUgY29yZSBwYXJ0IG9mIHJlbmRlcmluZyBjb250ZW50IHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBUaGlzIGZ1bmN0aW9uIGxvb2tzIGZvciB0aGUgcmVuZGVyZXIsIGFuZCBpZiBub25lIGlzXG4gKiBmb3VuZCBpdCBzaW1wbHkgcmV0dXJucy4gIEl0IHRoZW4gZG9lcyBhIGxpdHRsZSBzZXR1cFxuICogdG8gdGhlIG1ldGFkYXRhIG9iamVjdCwgYW5kIGNhbGxzIHRoZSByZW5kZXIgZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0gY29uZmlnIC0gQWthc2hhQ01TIENvbmZpZ3VyYXRpb25cbiAqIEBwYXJhbSByYyAtIFJlbmRlcmluZ0NvbnRleHQgZm9yIHVzZSB3aXRoIFJlbmRlcmVyc1xuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJDb250ZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICByYzogUmVuZGVyaW5nQ29udGV4dFxuKVxuICAgIC8vIFRoZSByZXR1cm4gaXMgYSBzaW1wbGUgb2JqZWN0XG4gICAgLy8gY29udGFpbmluZyB1c2VmdWwgZGF0YVxuICAgIDogUHJvbWlzZTx7XG4gICAgICAgIHJlbmRlcmVyTmFtZT86IHN0cmluZyxcbiAgICAgICAgZm9ybWF0Pzogc3RyaW5nLFxuICAgICAgICByZW5kZXJlZDogc3RyaW5nXG4gICAgfT5cbntcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ29udGVudCBgLCByYyk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgcmMuZnNwYXRoXG4gICAgKTtcbiAgICBpZiAoIXJlbmRlcmVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZW5kZXJlck5hbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGZvcm1hdDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcmVuZGVyZWQ6IHJjLmJvZHlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBBZGQgbmVjZXNzYXJ5IGl0ZW1zIHRvIHRoZSBtZXRhZGF0YVxuICAgIHJjLm1ldGFkYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIHJjLm1ldGFkYXRhLnBhcnRpYWxTeW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgIHJjLm1ldGFkYXRhLnBsdWdpbiA9IGNvbmZpZy5wbHVnaW47XG5cbiAgICAvLyBSZW5kZXIgdGhlIHByaW1hcnkgY29udGVudFxuICAgIGxldCBkb2NyZW5kZXJlZCA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihyYyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ29udGVudCByZW5kZXJlZD1gLCBkb2NyZW5kZXJlZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyZXJOYW1lOiByZW5kZXJlci5uYW1lLFxuICAgICAgICBmb3JtYXQ6IHJlbmRlcmVyLnJlbmRlckZvcm1hdChyYyksXG4gICAgICAgIHJlbmRlcmVkOiBkb2NyZW5kZXJlZFxuICAgIH07XG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gYW5kIHRoZSBuZXh0IGV4aXN0IHNvbGVseSB0b1xuLy8gc2ltcGxpZnkgcmVuZGVyRG9jdW1lbnQuXG5cbmFzeW5jIGZ1bmN0aW9uIHdyaXRlQ1NTdG9PdXRwdXQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm8sXG4gICAgZG9jUmVuZGVyZWQsXG4gICAgcmVuZGVyU3RhcnQ6IERhdGVcbikge1xuXG4gICAgY29uc3QgcmVuZGVyVG9GcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgY29uc3QgcmVuZGVyVG9EaXIgPSBwYXRoLmRpcm5hbWUocmVuZGVyVG9GcGF0aCk7XG4gICAgYXdhaXQgZnNwLm1rZGlyKHJlbmRlclRvRGlyLCB7XG4gICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlclRvRnBhdGgsIGRvY1JlbmRlcmVkLCAndXRmOCcpO1xuICAgIGNvbnN0IHJlbmRlckVuZFJlbmRlcmVkID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBkYXRhLnJlcG9ydChcbiAgICAgICAgZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb25maWcucmVuZGVyVG8sXG4gICAgICAgIFwiUkVOREVSRURcIiwgcmVuZGVyU3RhcnQpO1xuICAgIHJldHVybiBgQ1NTICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7ZG9jSW5mby5yZW5kZXJQYXRofSAoJHsocmVuZGVyRW5kUmVuZGVyZWQudmFsdWVPZigpIC0gcmVuZGVyU3RhcnQudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHMpXFxuJHthd2FpdCBkYXRhLmRhdGE0ZmlsZShkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgpfWA7XG5cbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weUFzc2V0VG9PdXRwdXQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm8sXG4gICAgZG9jUmVuZGVyZWQsXG4gICAgcmVuZGVyU3RhcnQ6IERhdGVcbikge1xuXG4gICAgY29uc3QgcmVuZGVyVG9GcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgY29uc3QgcmVuZGVyVG9EaXIgPSBwYXRoLmRpcm5hbWUocmVuZGVyVG9GcGF0aCk7XG4gICAgYXdhaXQgZnNwLm1rZGlyKHJlbmRlclRvRGlyLCB7XG4gICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICBhd2FpdCBmc3AuY29weUZpbGUoZG9jSW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJUb0ZwYXRoKTtcbiAgICAvLyBjb25zb2xlLmxvZyhgQ09QSUVEICR7ZG9jSW5mby5wYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofWApO1xuICAgIGNvbnN0IHJlbmRlckVuZENvcGllZCA9IG5ldyBEYXRlKCk7XG4gICAgcmV0dXJuIGBDT1BZICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH0gKCR7KHJlbmRlckVuZENvcGllZC52YWx1ZU9mKCkgLSByZW5kZXJTdGFydC52YWx1ZU9mKCkpIC8gMTAwMH0gc2Vjb25kcylgO1xufVxuXG5mdW5jdGlvbiBjb3B5UHJvcGVydGllcyhkZXN0OiBhbnksIHNyYzogYW55LCBleGNlcHRMYXlvdXQ6IGJvb2xlYW4pIHtcbiAgICBmb3IgKHZhciB5cHJvcCBpbiBzcmMpIHtcbiAgICAgICAgaWYgKGV4Y2VwdExheW91dCAmJiB5cHJvcCA9PT0gJ2xheW91dCcpIGNvbnRpbnVlO1xuICAgICAgICBkZXN0W3lwcm9wXSA9IHNyY1t5cHJvcF07XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xufVxuXG5hc3luYyBmdW5jdGlvbiByZW5kZXJDU1NGaWxlKHJldDogUmVuZGVyaW5nRGF0YSk6IFByb21pc2U8UmVuZGVyaW5nRGF0YT4ge1xuICAgIHRyeSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZvcm1hdCA9ICdDU1MnO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAgICAgLy8gUmVuZGVyIHRoZSBDU1MgY29udGVudFxuICAgICAgICByZXQucmVuZGVyZWRGaXJzdCA9IGF3YWl0IHJldC5yZW5kZXJlci5yZW5kZXIocmV0LnJlbmRlckZpcnN0Q29udGV4dCk7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAgICAgLy8gV3JpdGUgdGhlIHJlbmRlcmVkIENTUyB0byBvdXRwdXRcbiAgICAgICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihyZXQuY29uZmlnLnJlbmRlclRvLCByZXQuZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJEZXN0KSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyRGVzdCwgcmV0LnJlbmRlcmVkRmlyc3QsICd1dGYtOCcpO1xuXG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpKTtcbiAgICB9XG4gICAgLy8gQ2FsY3VsYXRlIGVsYXBzZWQgdGltZXNcbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCAtIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQ7XG4gICAgfVxuICAgIHJldC5yZXN1bHRzLnJlbmRlckxheW91dEVsYXBzZWQgPSAwO1xuICAgIHJldC5yZXN1bHRzLnJlbmRlck1haGFFbGFwc2VkID0gMDtcbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyU3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlclRvdGFsRWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckVuZCAtIHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0O1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJDU1NGaWxlICR7cmV0LnZwYXRofWAsIHJldCk7XG5cbiAgICByZXR1cm4gcmV0O1xufVxuXG5hc3luYyBmdW5jdGlvbiBjb3B5QXNzZXRGaWxlKHJldDogUmVuZGVyaW5nRGF0YSk6IFByb21pc2U8UmVuZGVyaW5nRGF0YT4ge1xuICAgIHRyeSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZvcm1hdCA9ICdDT1BZJztcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgICAgIC8vIENvcHkgdGhlIGFzc2V0IGZpbGUgdG8gb3V0cHV0IGRpcmVjdG9yeVxuICAgICAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKHJldC5jb25maWcucmVuZGVyVG8sIHJldC5kb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlckRlc3QpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgYXdhaXQgZnNwLmNvcHlGaWxlKHJldC5kb2NJbmZvLmZzcGF0aCwgcmVuZGVyRGVzdCk7XG5cbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoU3RyaW5nKGVycm9yKSkpO1xuICAgIH1cblxuICAgIC8vIENhbGN1bGF0ZSBlbGFwc2VkIHRpbWVzXG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0O1xuICAgIH1cbiAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbGFwc2VkID0gMDtcbiAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhRWxhcHNlZCA9IDA7XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJUb3RhbEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJTdGFydDtcbiAgICB9XG5cbiAgICAvLyBVc2UgdGhpcyB0byB2ZXJpZnkgZXJyb3IgaGFuZGxpbmdcbiAgICAvLyByZXQucmVzdWx0cy5lcnJvcnMucHVzaChuZXcgRXJyb3IoYFJhbmRvbSBlcnJvcmApKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGBjb3B5QXNzZXRGaWxlICR7cmV0LnZwYXRofWAsIHJldCk7XG4gICAgcmV0dXJuIHJldDtcbn1cblxuXG5cbi8qKlxuICogQXR0ZW1wdCB0byByZXdyaXRlIHJlbmRlckRvY3VtZW50IHdpdGggY2xlYW5lciBjb2RlLCBhbmQgYVxuICogZGlmZmVyZW50IG1ldGhvZCBmb3IgY29sbGVjdGluZyBwZXJmb3JtYW5jZS90aW1pbmcgZGF0YS5cbiAqIFxuICogVGhlIGV4aXN0aW5nIHJlbmRlckRvY3VtZW50IGlzIG1lc3N5IGFuZCBoYXJkIHRvIHVuZGVyc3RhbmQuXG4gKiBHb2FsOiBtYWtlIGl0IG1vcmUgc3RyYWlnaHQtZm9yd2FyZCwgZWFzeSB0byB1bmRlcnN0YW5kLlxuICogR29hbDogc3RvcmUgYWxsIGRhdGEgaW4gYSB3ZWxsIGRlc2lnbmVkIG9iamVjdFxuICogXG4gKiBUaGUgZXhpc3RpbmcgcGVyZm9ybWFuY2UgbWVhc3VyZW1lbnRzIGFyZSBpbXByZWNpc2UgYnkgdXNpbmdcbiAqIHRoZSBEYXRlIG9iamVjdCwgYW5kIGJ5IG5vdCBjb21wdXRpbmcgdGhlIGVsYXBzZWQgdGltZSBvZlxuICogZWFjaCBzZWdtZW50LiAgSW5zdGVhZCwgaXQgY29tcHV0cyB0aGUgdGltZSBmcm9tIHRoZSBzdGFydFxuICogZm9yIGVhY2ggc2VnbWVudCwgd2hpY2ggaXNuJ3QgdXNlZnVsLiAgV2Ugd2FudCB0byBzZWUgdGhlXG4gKiBlbGFwc2VkIHRpbWUuXG4gKiBcbiAqIEZvciBwcmVjaXNlIHRpbWUgbWVhc3VyZXMgdGhpcyB1c2VzIHRoZSBOb2RlLmpzIHBlcmZvcm1hbmNlXG4gKiBob29rcyB0byBnZXQgYWNjdXJhdGUgdGltZXN0YW1wcy5cbiAqIFxuICogVGhpcyBjb2RlIGhhcyBub3QgYmVlbiBleGVjdXRlZCBhcyB5ZXQuXG4gKiBcbiAqIFRhc2tzOlxuICogKiBUT0RPIEltcGxlbWVudCBDU1MgcmVuZGVyRm9ybWF0XG4gKiAqIFRPRE8gSW1wbGVtZW50IHRoZSAhPSBIVE1MIHJlbmRlckZvcm1hdFxuICogKiBUT0RPIFRlc3QgYW5kIGZpeCBidWdzXG4gKiBcbiAqIEBwYXJhbSBjb25maWcgXG4gKiBAcGFyYW0gZG9jSW5mbyBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnQyKFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvXG4pOiBQcm9taXNlPFJlbmRlcmluZ1Jlc3VsdHM+IHtcblxuICAgIC8vIENyZWF0ZSB0aGUgbWFzdGVyIG9iamVjdCB0byBob2xkIGFsbCBkYXRhXG4gICAgY29uc3QgcmV0OiBSZW5kZXJpbmdEYXRhID0gY3JlYXRlUmVuZGVyaW5nRGF0YShjb25maWcsIGRvY0luZm8pO1xuXG4gICAgLy8gUGVlbCBvZmYgdG8gbW9kZS1zcGVjaWZpYyBmdW5jdGlvbnNcbiAgICBpZiAocmV0Py5yZW5kZXJlcj8ucmVuZGVyRm9ybWF0KHJldC5yZW5kZXJGaXJzdENvbnRleHQpID09PSAnQ1NTJykge1xuICAgICAgICBjb25zdCBjc3NSZXN1bHQgPSBhd2FpdCByZW5kZXJDU1NGaWxlKHJldCk7XG4gICAgICAgIHJldHVybiBjc3NSZXN1bHQucmVzdWx0cztcbiAgICB9IGVsc2UgaWYgKCFyZXQucmVuZGVyZXJcbiAgICAgfHwgKHJldC5yZW5kZXJlci5yZW5kZXJGb3JtYXQocmV0LnJlbmRlckZpcnN0Q29udGV4dCkgIT09ICdIVE1MJylcbiAgICApIHtcbiAgICAgICAgY29uc3QgYXNzZXRSZXN1bHQgPSBhd2FpdCBjb3B5QXNzZXRGaWxlKHJldCk7XG4gICAgICAgIHJldHVybiBhc3NldFJlc3VsdC5yZXN1bHRzO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSBpdCBpcyBIVE1MXG4gICAgLy8gVGhpcyBpcyB3aGVyZSB3ZSByZW5kZXIgdGhlIGNvbnRlbnQsIHRoZW4gcmVuZGVyIHRoYXRcbiAgICAvLyBpbnRvIHRoZSBsYXlvdXQgKGlmIG9uZSBleGlzdHMpLCB0aGVuIHJ1biBNYWhhYmh1dGEuXG5cbiAgICAvLyBUaGVzZSBmdW5jdGlvbnMgYXJlIGR1cGxpY2F0ZXMgYmV0d2VlbiB0aGUgZmlyc3RcbiAgICAvLyB0d28gc3RhZ2VzLiAgU2F2ZSBhIGNvdXBsZSBtaWNyb3NlY29uZHMgYnkgaW5zdGFudGlhdGluZ1xuICAgIC8vIHRoZSBmdW5jdGlvbnMgb25jZS5cbiAgICBjb25zdCBkb1BhcnRpYWwgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgY29uc3QgZG9QYXJ0aWFsU3luYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG5cbiAgICAvLyBGaXJzdCBSZW5kZXJcbiAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBBZGQgbmVjZXNzYXJ5IGl0ZW1zIHRvIHRoZSBtZXRhZGF0YVxuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgcmV0LnJlbmRlckZpcnN0Q29udGV4dC5tZXRhZGF0YS5wYXJ0aWFsID0gZG9QYXJ0aWFsO1xuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLnBhcnRpYWxTeW5jID0gZG9QYXJ0aWFsU3luYztcbiAgICAgICAgcmV0LnJlbmRlckZpcnN0Q29udGV4dC5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLnBsdWdpbiA9IGNvbmZpZy5wbHVnaW47XG5cbiAgICAgICAgLy8gUmVuZGVyIHRoZSBwcmltYXJ5IGNvbnRlbnRcbiAgICAgICAgcmV0LnJlbmRlcmVkRmlyc3QgPSBhd2FpdCByZXQucmVuZGVyZXIucmVuZGVyKHJldC5yZW5kZXJGaXJzdENvbnRleHQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpKTtcbiAgICAgICAgLy8gVXNlIGVtcHR5IHN0cmluZyBhcyBmYWxsYmFjayBpZiByZW5kZXJpbmcgZmFpbHNcbiAgICAgICAgcmV0LnJlbmRlcmVkRmlyc3QgPSAnJztcbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIC8vIEVORCBGaXJzdCBSZW5kZXJcblxuICAgIC8vIExheW91dCBSZW5kZXJcbiAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgaWYgKHJldD8uZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgICAgIC8vIGF3YWl0IGxheW91dHMuaXNSZWFkeSgpO1xuXG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBsYXlvdXRzLmZpbmQocmV0LmRvY0luZm8ubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgTm8gbGF5b3V0IGZvdW5kIGluICR7dXRpbC5pbnNwZWN0KHJldC5jb25maWcubGF5b3V0RGlycyl9IGZvciAke3JldD8uZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gaW4gZmlsZSAke3JldC5kb2NJbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvcik7XG4gICAgICAgICAgICAgICAgLy8gU2tpcCBsYXlvdXQgcmVuZGVyaW5nLCB1c2UgZmlyc3QgcmVuZGVyIHJlc3VsdFxuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJlZExheW91dCA9IHJldC5yZW5kZXJlZEZpcnN0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKFxuICAgICAgICAgICAgICAgICAgICByZXQuZG9jSW5mby5tZXRhZGF0YS5sYXlvdXRcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQgPSA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogcmV0LmRvY0luZm8ubWV0YWRhdGEubGF5b3V0LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBmb3VuZC5kb2NDb250ZW50LFxuICAgICAgICAgICAgICAgICAgICBib2R5OiBmb3VuZC5kb2NCb2R5LFxuICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YToge31cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgPSBjb3B5UHJvcGVydGllcyhcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgID0gY29weVByb3BlcnRpZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldC5kb2NJbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEuY29udGVudCA9IHJldC5yZW5kZXJlZEZpcnN0O1xuXG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLnBhcnRpYWwgPSBkb1BhcnRpYWw7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEucGFydGlhbFN5bmMgPSBkb1BhcnRpYWxTeW5jO1xuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLmFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEucGx1Z2luID0gY29uZmlnLnBsdWdpbjtcblxuICAgICAgICAgICAgICAgIC8vIFJlbmRlciB0aGUgbGF5b3V0IGNvbnRlbnRcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyZWRMYXlvdXQgPSBhd2FpdCByZW5kZXJlci5yZW5kZXIocmV0LnJlbmRlckxheW91dENvbnRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZS5zdGFjayA/IGUuc3RhY2sgOiBlfWApO1xuICAgICAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICAgICAgLy8gVXNlIGZpcnN0IHJlbmRlciByZXN1bHQgYXMgZmFsbGJhY2tcbiAgICAgICAgICAgIHJldC5yZW5kZXJlZExheW91dCA9IHJldC5yZW5kZXJlZEZpcnN0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgLy8gRU5EIExheW91dCBSZW5kZXJcblxuICAgIC8vIE1haGFiaHV0YVxuICAgIHJldC5yZXN1bHRzLnJlbmRlck1haGFTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgcmV0LnJlbmRlck1haGFDb250ZXh0ID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICBmc3BhdGg6IHJldC5kb2NJbmZvLm1ldGFkYXRhLmxheW91dCxcbiAgICAgICAgY29udGVudDogcmV0LnJlbmRlcmVkTGF5b3V0XG4gICAgICAgICAgICA/IHJldC5yZW5kZXJlZExheW91dCA6IHJldC5yZW5kZXJlZEZpcnN0LFxuICAgICAgICBib2R5OiByZXQucmVuZGVyZWRMYXlvdXRcbiAgICAgICAgICAgID8gcmV0LnJlbmRlcmVkTGF5b3V0IDogcmV0LnJlbmRlcmVkRmlyc3QsXG4gICAgICAgIG1ldGFkYXRhOiB7fVxuICAgIH07XG5cbiAgICByZXQucmVuZGVyTWFoYUNvbnRleHQubWV0YWRhdGFcbiAgICAgICAgPSBjb3B5UHJvcGVydGllcyhcbiAgICAgICAgICAgIHJldC5yZW5kZXJNYWhhQ29udGV4dC5tZXRhZGF0YSxcbiAgICAgICAgICAgIHJldC5kb2NJbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcblxuICAgIHRyeSB7XG4gICAgICAgIGlmIChyZXQuZG9jSW5mbz8ubWV0YWRhdGE/LmNvbmZpZz8ubWFoYWJodXRhQ29uZmlnKSB7XG4gICAgICAgICAgICBtYWhhYmh1dGEuY29uZmlnKHJldC5kb2NJbmZvPy5tZXRhZGF0YT8uY29uZmlnPy5tYWhhYmh1dGFDb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXQucmVuZGVyZWRNYWhhID0gIGF3YWl0IG1haGFiaHV0YS5wcm9jZXNzQXN5bmMoXG4gICAgICAgICAgICByZXQucmVuZGVyTWFoYUNvbnRleHQuY29udGVudCwgcmV0LnJlbmRlck1haGFDb250ZXh0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgcmV0LmNvbmZpZy5tYWhhZnVuY3MsXG4gICAgICAgICAgICAvLyBGb3IgcGVyZm9ybWFuY2UgY29sbGVjdGlvblxuICAgICAgICAgICAgY29uZmlnLnBlcmZEYXRhRGlyIFxuICAgICAgICAgICAgPyBuZXcgRmlsZXN5c3RlbVBlcmZEYXRhU3RvcmUoY29uZmlnLnBlcmZEYXRhRGlyKVxuICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjb25maWcucGVyZkRhdGFEaXIgXG4gICAgICAgICAgICA/IHJldC5kb2NJbmZvLnZwYXRoXG4gICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICApO1xuICAgIH0gY2F0Y2ggKGUyKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBFcnJvciB3aXRoIE1haGFiaHV0YSAke3JldC5kb2NJbmZvLnZwYXRofSB3aXRoICR7cmV0LmRvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZTIuc3RhY2sgPyBlMi5zdGFjayA6IGUyfWApO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgLy8gVXNlIGxheW91dCByZXN1bHQgb3IgZmlyc3QgcmVuZGVyIGFzIGZhbGxiYWNrXG4gICAgICAgIHJldC5yZW5kZXJlZE1haGEgPSByZXQucmVuZGVyTWFoYUNvbnRleHQuY29udGVudDtcbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhRW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgLy8gRU5EIE1haGFiaHV0YVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgcmV0LmNvbmZpZy5yZW5kZXJUbywgcmV0LmRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHtcbiAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJEZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldC5yZW5kZXJlZE1haGEsICd1dGYtOCcpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpKTtcbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIC8vIENhbGN1bGF0ZSBlbGFwc2VkIHRpbWVzXG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0O1xuICAgIH1cbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0U3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckxheW91dEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRTdGFydDtcbiAgICB9XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlck1haGFTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJNYWhhRW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlck1haGFFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVuZCAtIHJldC5yZXN1bHRzLnJlbmRlck1haGFTdGFydDtcbiAgICB9XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJUb3RhbEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJTdGFydDtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQyICR7cmV0LnZwYXRofWAsIHJldCk7XG4gICAgcmV0dXJuIHJldC5yZXN1bHRzO1xufVxuXG4vKipcbiAqIFJlbmRlciBhIGRvY3VtZW50LCBhY2NvdW50aW5nIGZvciB0aGUgbWFpbiBjb250ZW50LFxuICogYSBsYXlvdXQgdGVtcGxhdGUgKGlmIGFueSksIGFuZCBNYWhhYmh1dGEgKGlmIHRoZSBjb250ZW50XG4gKiBvdXRwdXQgaXMgSFRNTCkuICBUaGlzIGFsc28gaGFuZGxlcyByZW5kZXJpbmcgb3RoZXIgdHlwZXNcbiAqIG9mIGNvbnRlbnQgc3VjaCBhcyBMRVNTIENTUyBmaWxlcy5cbiAqXG4gKiBAcGFyYW0gY29uZmlnIFxuICogQHBhcmFtIGRvY0luZm8gXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvXG4pOiBQcm9taXNlPHN0cmluZz5cbntcbiAgICBjb25zdCByZW5kZXJTdGFydCA9IG5ldyBEYXRlKCk7XG5cbiAgICAvLyBSZW5kZXIgdGhlIG1haW4gY29udGVudFxuXG4gICAgaWYgKHR5cGVvZiBkb2NJbmZvLmRvY0NvbnRlbnQgIT09ICdzdHJpbmcnXG4gICAgIHx8IHR5cGVvZiBkb2NJbmZvLmRvY0JvZHkgIT09ICdzdHJpbmcnXG4gICAgKSB7XG4gICAgICAgIC8vIGNvbnNvbGUud2FybihgTm8gY29udGVudCB0byByZW5kZXIgZm9yIGAsIGRvY0luZm8pO1xuICAgIH1cblxuICAgIGNvbnN0IHJjID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICBmc3BhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgIGNvbnRlbnQ6IGRvY0luZm8uZG9jQ29udGVudCxcbiAgICAgICAgYm9keTogZG9jSW5mby5kb2NCb2R5LFxuICAgICAgICBtZXRhZGF0YTogZG9jSW5mby5tZXRhZGF0YVxuICAgIH07XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgY29udGV4dD0gJHtyYy5mc3BhdGh9YCwgcmMpO1xuXG4gICAgbGV0IGRvY0Zvcm1hdDsgICAgICAvLyBLbm93aW5nIHRoZSBmb3JtYXQgXG4gICAgbGV0IGRvY1JlbmRlcmVkO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckNvbnRlbnQoY29uZmlnLCByYyk7XG4gICAgICAgIGRvY0Zvcm1hdCA9IHJlc3VsdC5mb3JtYXQ7XG4gICAgICAgIGRvY1JlbmRlcmVkID0gcmVzdWx0LnJlbmRlcmVkO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSAkeyhlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnIpfWApO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9ICR7KGVyci5zdGFjayA/IGVyci5zdGFjayA6IGVycil9YCk7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCAke2RvY0Zvcm1hdH0gJHtkb2NJbmZvLnZwYXRofSByZW5kZXJlZD1gLCBkb2NSZW5kZXJlZCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoZG9jSW5mby5tb3VudFBvaW50LCBcbiAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICBcIkZJUlNUIFJFTkRFUlwiLCByZW5kZXJTdGFydCk7XG5cbiAgICAvLyBIYW5kbGUgdGhlc2UgY2FzZXMgdXAgZnJvbnQgc28gdGhhdCB0aGUgcmVtYWluaW5nXG4gICAgLy8gY29kZSBjYW4gYmUgY2xlYW5lciBhbmQgZm9jdXMgb24gSFRNTCBsYXlvdXQgcmVuZGVyaW5nLlxuXG4gICAgaWYgKGRvY0Zvcm1hdCA9PT0gJ0NTUycpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB3cml0ZUNTU3RvT3V0cHV0KGNvbmZpZywgZG9jSW5mbywgZG9jUmVuZGVyZWQsIHJlbmRlclN0YXJ0KTtcbiAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluIFJFTkRFUiBDU1MgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW4gUkVOREVSIENTUyBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRvY0Zvcm1hdCAhPT0gJ0hUTUwnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb3B5QXNzZXRUb091dHB1dChjb25maWcsIGRvY0luZm8sIGRvY1JlbmRlcmVkLCByZW5kZXJTdGFydCk7XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbiBjb3B5IGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluIGNvcHkgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbmRlciB0aGUgbWFpbiBjb250ZW50IGludG8gYSBsYXlvdXQgdGVtcGxhdGUsXG4gICAgLy8gaWYgb25lIGlzIHNwZWNpZmllZFxuXG4gICAgbGV0IGxheW91dEZvcm1hdDtcbiAgICBsZXQgbGF5b3V0UmVuZGVyZWQ7XG4gICAgbGV0IHJlc3VsdDtcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgbGF5b3V0ICR7ZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gZG9jTWV0YWRhdGEgJHt1dGlsLmluc3BlY3QoZG9jSW5mby5kb2NNZXRhZGF0YSl9IG1ldGFkYXRhICR7dXRpbC5pbnNwZWN0KGRvY0luZm8ubWV0YWRhdGEpfWApO1xuICAgIGlmIChkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0KSB7XG5cbiAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgbGF5b3V0cy5pc1JlYWR5KCk7XG5cbiAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgbGF5b3V0cy5maW5kKGRvY0luZm8ubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBsYXlvdXQgZm91bmQgaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLmxheW91dERpcnMpfSBmb3IgJHtkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSBpbiBmaWxlICR7ZG9jSW5mby52cGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJjTGF5b3V0ID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBkb2NJbmZvLm1ldGFkYXRhLmxheW91dCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGZvdW5kLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBmb3VuZC5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmNMYXlvdXQubWV0YWRhdGFcbiAgICAgICAgICAgID0gY29weVByb3BlcnRpZXMoXG4gICAgICAgICAgICAgICAgcmNMYXlvdXQubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgZm91bmQubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICk7XG4gICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhXG4gICAgICAgICAgICA9IGNvcHlQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGRvY0luZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgcmNMYXlvdXQubWV0YWRhdGEuY29udGVudCA9IGRvY1JlbmRlcmVkO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHRcbiAgICAgICAgICAgICAgICA9IGF3YWl0IHJlbmRlckNvbnRlbnQoY29uZmlnLCByY0xheW91dCk7XG4gICAgICAgICAgICBsYXlvdXRGb3JtYXQgPSByZXN1bHQuZm9ybWF0O1xuICAgICAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSByZXN1bHQucmVuZGVyZWQ7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGxldCBlZSA9IG5ldyBFcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZS5zdGFjayA/IGUuc3RhY2sgOiBlfWApO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlZSk7XG4gICAgICAgICAgICB0aHJvdyBlZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGxheW91dEZvcm1hdCA9IGRvY0Zvcm1hdDtcbiAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSBkb2NSZW5kZXJlZDtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgJHtkb2NJbmZvLnZwYXRofSBhZnRlciBsYXlvdXQgcmVuZGVyIGZvcm1hdCAke2xheW91dEZvcm1hdH0gYCwgcmVzdWx0KTtcblxuICAgIGNvbnN0IHJlbmRlclNlY29uZFJlbmRlciA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoZG9jSW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGgsIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICAgXCJTRUNPTkQgUkVOREVSXCIsXG4gICAgICAgICAgICAgICAgICAgICAgcmVuZGVyU3RhcnQpO1xuXG4gICAgXG4gICAgLy8gTmV4dCBzdGVwIGlzIHRvIHJ1biBNYWhhYmh1dGEgb24gdGhlIHJlbmRlcmVkIGNvbnRlbnRcbiAgICAvLyBPZiBjb3Vyc2UsIE1haGFiaHV0YSBpcyBub3QgYXBwcm9wcmlhdGUgZm9yIGV2ZXJ5dGhpbmdcbiAgICAvLyBiZWNhdXNlIG5vdCBldmVyeXRoaW5nIGlzIEhUTUxcblxuICAgIHRyeSB7XG5cbiAgICAgICAgY29uc3QgbWFoYW1ldGFkYXRhXG4gICAgICAgICAgICA9IGNvcHlQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgICAgIHsgfSxcbiAgICAgICAgICAgICAgICBkb2NJbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICApO1xuICAgICAgICBtYWhhbWV0YWRhdGEuY29udGVudCA9IGRvY1JlbmRlcmVkO1xuXG4gICAgICAgIGlmIChkb2NJbmZvPy5tZXRhZGF0YT8uY29uZmlnPy5tYWhhYmh1dGFDb25maWcpIHtcbiAgICAgICAgICAgIG1haGFiaHV0YS5jb25maWcoZG9jSW5mbz8ubWV0YWRhdGE/LmNvbmZpZz8ubWFoYWJodXRhQ29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgbWFoYW1ldGFkYXRhYCwgbWFoYW1ldGFkYXRhKTtcbiAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSBhd2FpdCBtYWhhYmh1dGEucHJvY2Vzc0FzeW5jKFxuICAgICAgICAgICAgbGF5b3V0UmVuZGVyZWQsIG1haGFtZXRhZGF0YSxcbiAgICAgICAgICAgIGNvbmZpZy5tYWhhZnVuY3NcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBPTEQgZG9jcmVuZGVyZWQgPSBhd2FpdCB0aGlzLm1haGFydW4obGF5b3V0cmVuZGVyZWQsIGRvY2RhdGEsIGNvbmZpZy5tYWhhZnVuY3MpO1xuICAgIH0gY2F0Y2ggKGUyKSB7XG4gICAgICAgIGxldCBlZWUgPSBuZXcgRXJyb3IoYEVycm9yIHdpdGggTWFoYWJodXRhICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZTIuc3RhY2sgPyBlMi5zdGFjayA6IGUyfWApO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVlZSk7XG4gICAgICAgIHRocm93IGVlZTtcbiAgICB9XG5cbiAgICBhd2FpdCBkYXRhLnJlcG9ydChkb2NJbmZvLm1vdW50UG9pbnQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1BSEFCSFVUQVwiLCByZW5kZXJTdGFydCk7XG5cbiAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlckRlc3QpLCB7XG4gICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgIH0pO1xuICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyRGVzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dFJlbmRlcmVkLCAndXRmLTgnKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGBSRU5ERVJFRCAke3JlbmRlcmVyLm5hbWV9ICR7ZG9jSW5mby5wYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofWApO1xuICAgIGNvbnN0IHJlbmRlckVuZFJlbmRlcmVkID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBkYXRhLnJlcG9ydChcbiAgICAgICAgZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb25maWcucmVuZGVyVG8sXG4gICAgICAgIFwiUkVOREVSRURcIiwgcmVuZGVyU3RhcnQpO1xuICAgIHJldHVybiBgJHtsYXlvdXRGb3JtYXR9ICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7ZG9jSW5mby5yZW5kZXJQYXRofSAoJHsocmVuZGVyRW5kUmVuZGVyZWQudmFsdWVPZigpIC0gcmVuZGVyU3RhcnQudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHMpXFxuJHthd2FpdCBkYXRhLmRhdGE0ZmlsZShkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgpfWA7XG5cbn1cblxuLyoqXG4gKiBSZW5kZXIgYWxsIHRoZSBkb2N1bWVudHMgaW4gYSBzaXRlLCBsaW1pdGluZ1xuICogdGhlIG51bWJlciBvZiBzaW11bHRhbmVvdXMgcmVuZGVyaW5nIHRhc2tzXG4gKiB0byB0aGUgbnVtYmVyIGluIGNvbmZpZy5jb25jdXJyZW5jeS5cbiAqXG4gKiBAcGFyYW0gY29uZmlnXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyKGNvbmZpZykge1xuXG4gICAgY29uc3QgZG9jdW1lbnRzID0gPERvY3VtZW50c0NhY2hlPmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIC8vIGF3YWl0IGRvY3VtZW50cy5pc1JlYWR5KCk7XG4gICAgLy8gY29uc29sZS5sb2coJ0NBTExJTkcgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQnKTtcbiAgICBhd2FpdCBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCgpO1xuICAgIFxuICAgIC8vIDEuIEdhdGhlciBsaXN0IG9mIGZpbGVzIGZyb20gUmVuZGVyRmlsZUNhY2hlXG4gICAgY29uc3QgZmlsZXogPSBhd2FpdCBkb2N1bWVudHMucGF0aHMoKTtcbiAgICAvLyBjb25zb2xlLmxvZyhgbmV3ZXJyZW5kZXIgZmlsZXogJHtmaWxlei5sZW5ndGh9YCk7XG5cbiAgICAvLyAyLiBFeGNsdWRlIGFueSB0aGF0IHdlIHdhbnQgdG8gaWdub3JlXG4gICAgY29uc3QgZmlsZXoyID0gW10gYXMgQXJyYXk8e1xuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgfT47XG4gICAgZm9yIChsZXQgZW50cnkgb2YgZmlsZXopIHtcbiAgICAgICAgbGV0IGluY2x1ZGUgPSB0cnVlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlbnRyeSk7XG4gICAgICAgIGxldCBzdGF0cztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0YXRzID0gYXdhaXQgZnNwLnN0YXQoZW50cnkuZnNwYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7IHN0YXRzID0gdW5kZWZpbmVkOyB9XG4gICAgICAgIGlmICghZW50cnkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgZWxzZSBpZiAoIXN0YXRzIHx8IHN0YXRzLmlzRGlyZWN0b3J5KCkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gVGhpcyBzaG91bGQgYXJpc2UgdXNpbmcgYW4gaWdub3JlIGNsYXVzZVxuICAgICAgICAvLyBlbHNlIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LnZwYXRoKSA9PT0gJy5EU19TdG9yZScpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcucGxhY2Vob2xkZXInKSBpbmNsdWRlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGluY2x1ZGUpIHtcbiAgICAgICAgICAgIC8vIFRoZSBxdWV1ZSBpcyBhbiBhcnJheSBvZiB0dXBsZXMgY29udGFpbmluZyB0aGVcbiAgICAgICAgICAgIC8vIGNvbmZpZyBvYmplY3QgYW5kIHRoZSBwYXRoIHN0cmluZ1xuICAgICAgICAgICAgZmlsZXoyLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICAgICAgICAgIGluZm86IGF3YWl0IGRvY3VtZW50cy5maW5kKGVudHJ5LnZwYXRoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYG5ld2VycmVuZGVyIGZpbGV6MiBhZnRlciBpZ25vcmUgJHtmaWxlejIubGVuZ3RofWApO1xuXG5cbiAgICAvLyAzLiBNYWtlIGEgZmFzdHEgdG8gcHJvY2VzcyB1c2luZyByZW5kZXJEb2N1bWVudCxcbiAgICAvLyAgICBwdXNoaW5nIHJlc3VsdHMgdG8gdGhlIHJlc3VsdHMgYXJyYXlcblxuICAgIC8vIFRoaXMgc2V0cyB1cCB0aGUgcXVldWUgcHJvY2Vzc29yXG4gICAgLy8gVGhlIGNvbmN1cnJlbmN5IHNldHRpbmcgbGV0cyB1cyBwcm9jZXNzIGRvY3VtZW50c1xuICAgIC8vIGluIHBhcmFsbGVsIHdoaWxlIGxpbWl0aW5nIHRvdGFsIGltcGFjdC5cbiAgICBjb25zdCBxdWV1ZTogcXVldWVBc1Byb21pc2VkPHtcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgIH0+ID0gZmFzdHEucHJvbWlzZShcblxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgZm9yIGVhY2ggZW50cnkgaW4gdGhlXG4gICAgICAgIC8vIHF1ZXVlLiBJdCBoYW5kbGVzIHJlbmRlcmluZyB0aGUgcXVldWVcbiAgICAgICAgLy8gVGhlIHF1ZXVlIGhhcyBjb25maWcgb2JqZWN0cyBhbmQgcGF0aCBzdHJpbmdzXG4gICAgICAgIC8vIHdoaWNoIGlzIGV4YWN0bHkgd2hhdCdzIHJlcXVpcmVkIGJ5XG4gICAgICAgIC8vIHJlbmRlckRvY3VtZW50XG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50SW5RdWV1ZShlbnRyeSlcbiAgICAgICAgICAgIDogUHJvbWlzZTx7IHJlc3VsdD86IGFueTsgZXJyb3I/OiBhbnk7IH0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVuZGVyRG9jdW1lbnQoXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5LmNvbmZpZywgZW50cnkuaW5mb1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYERPTkUgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHJlc3VsdCB9O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgRVJST1IgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZXJyb3IgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnLmNvbmN1cnJlbmN5KTtcblxuICAgIC8vIHF1ZXVlLnB1c2ggcmV0dXJucyBhIFByb21pc2UgdGhhdCdzIGZ1bGZpbGxlZCB3aGVuXG4gICAgLy8gdGhlIHRhc2sgZmluaXNoZXMuXG4gICAgLy8gSGVuY2Ugd2FpdEZvciBpcyBhbiBhcnJheSBvZiBQcm9taXNlcy5cbiAgICBjb25zdCB3YWl0Rm9yID0gW107XG4gICAgZm9yIChsZXQgZW50cnkgb2YgZmlsZXoyKSB7XG4gICAgICAgIHdhaXRGb3IucHVzaChxdWV1ZS5wdXNoKGVudHJ5KSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBhdXRvbWF0aWNhbGx5IHdhaXRzIGZvciBhbGwgdGhvc2VcbiAgICAvLyBQcm9taXNlcyB0byByZXNvbHZlLCB3aGlsZSBtYWtpbmcgdGhlIHJlc3VsdHNcbiAgICAvLyBhcnJheSBjb250YWluIHJlc3VsdHMuXG4gICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgIH1cblxuICAgIC8vIDQuIEludm9rZSBob29rU2l0ZVJlbmRlcmVkXG5cbiAgICB0cnkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnSW52b2tpbmcgaG9va1NpdGVSZW5kZXJlZCcpO1xuICAgICAgICBhd2FpdCBjb25maWcuaG9va1NpdGVSZW5kZXJlZCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBob29rU2l0ZVJlbmRlcmVkIGZhaWxlZCBiZWNhdXNlICR7ZX1gKTtcbiAgICB9XG5cbiAgICAvLyA1LiByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiByZXN1bHRzO1xufTtcblxuLyoqXG4gKiBSZW5kZXIgYWxsIHRoZSBkb2N1bWVudHMgaW4gYSBzaXRlIHVzaW5nIHJlbmRlckRvY3VtZW50MixcbiAqIGxpbWl0aW5nIHRoZSBudW1iZXIgb2Ygc2ltdWx0YW5lb3VzIHJlbmRlcmluZyB0YXNrc1xuICogdG8gdGhlIG51bWJlciBpbiBjb25maWcuY29uY3VycmVuY3kuXG4gKiBcbiAqIFJldHVybnMgc3RydWN0dXJlZCBSZW5kZXJpbmdSZXN1bHRzIGRhdGEgaW5zdGVhZCBvZiB0ZXh0IHN0cmluZ3MuXG4gKlxuICogQHBhcmFtIGNvbmZpZ1xuICogQHJldHVybnMgQXJyYXkgb2YgUmVuZGVyaW5nUmVzdWx0cyB3aXRoIHBlcmZvcm1hbmNlIGFuZCBlcnJvciBkYXRhXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXIyKGNvbmZpZyk6IFByb21pc2U8QXJyYXk8UmVuZGVyaW5nUmVzdWx0cz4+IHtcblxuICAgIGNvbnN0IGRvY3VtZW50cyA9IDxEb2N1bWVudHNDYWNoZT5jb25maWcuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdDQUxMSU5HIGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgYXdhaXQgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKTtcbiAgICBcbiAgICAvLyAxLiBHYXRoZXIgbGlzdCBvZiBmaWxlcyBmcm9tIFJlbmRlckZpbGVDYWNoZVxuICAgIGNvbnN0IGZpbGV6ID0gYXdhaXQgZG9jdW1lbnRzLnBhdGhzKCk7XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjIgZmlsZXogJHtmaWxlei5sZW5ndGh9YCk7XG5cbiAgICAvLyAyLiBFeGNsdWRlIGFueSB0aGF0IHdlIHdhbnQgdG8gaWdub3JlXG4gICAgY29uc3QgZmlsZXoyID0gW10gYXMgQXJyYXk8e1xuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgfT47XG4gICAgZm9yIChsZXQgZW50cnkgb2YgZmlsZXopIHtcbiAgICAgICAgbGV0IGluY2x1ZGUgPSB0cnVlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlbnRyeSk7XG4gICAgICAgIGxldCBzdGF0cztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0YXRzID0gYXdhaXQgZnNwLnN0YXQoZW50cnkuZnNwYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7IHN0YXRzID0gdW5kZWZpbmVkOyB9XG4gICAgICAgIGlmICghZW50cnkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgZWxzZSBpZiAoIXN0YXRzIHx8IHN0YXRzLmlzRGlyZWN0b3J5KCkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gVGhpcyBzaG91bGQgYXJpc2UgdXNpbmcgYW4gaWdub3JlIGNsYXVzZVxuICAgICAgICAvLyBlbHNlIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LnZwYXRoKSA9PT0gJy5EU19TdG9yZScpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcucGxhY2Vob2xkZXInKSBpbmNsdWRlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGluY2x1ZGUpIHtcbiAgICAgICAgICAgIC8vIFRoZSBxdWV1ZSBpcyBhbiBhcnJheSBvZiB0dXBsZXMgY29udGFpbmluZyB0aGVcbiAgICAgICAgICAgIC8vIGNvbmZpZyBvYmplY3QgYW5kIHRoZSBwYXRoIHN0cmluZ1xuICAgICAgICAgICAgZmlsZXoyLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICAgICAgICAgIGluZm86IGF3YWl0IGRvY3VtZW50cy5maW5kKGVudHJ5LnZwYXRoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjIgZmlsZXoyIGFmdGVyIGlnbm9yZSAke2ZpbGV6Mi5sZW5ndGh9YCk7XG5cbiAgICAvLyAzLiBNYWtlIGEgZmFzdHEgdG8gcHJvY2VzcyB1c2luZyByZW5kZXJEb2N1bWVudDIsXG4gICAgLy8gICAgcHVzaGluZyByZXN1bHRzIHRvIHRoZSByZXN1bHRzIGFycmF5XG5cbiAgICAvLyBUaGlzIHNldHMgdXAgdGhlIHF1ZXVlIHByb2Nlc3NvclxuICAgIC8vIFRoZSBjb25jdXJyZW5jeSBzZXR0aW5nIGxldHMgdXMgcHJvY2VzcyBkb2N1bWVudHNcbiAgICAvLyBpbiBwYXJhbGxlbCB3aGlsZSBsaW1pdGluZyB0b3RhbCBpbXBhY3QuXG4gICAgY29uc3QgcXVldWU6IHF1ZXVlQXNQcm9taXNlZDx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PiA9IGZhc3RxLnByb21pc2UoXG5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIGZvciBlYWNoIGVudHJ5IGluIHRoZVxuICAgICAgICAvLyBxdWV1ZS4gSXQgaGFuZGxlcyByZW5kZXJpbmcgdGhlIHF1ZXVlXG4gICAgICAgIC8vIFRoZSBxdWV1ZSBoYXMgY29uZmlnIG9iamVjdHMgYW5kIHBhdGggc3RyaW5nc1xuICAgICAgICAvLyB3aGljaCBpcyBleGFjdGx5IHdoYXQncyByZXF1aXJlZCBieVxuICAgICAgICAvLyByZW5kZXJEb2N1bWVudDJcbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnQySW5RdWV1ZShlbnRyeSlcbiAgICAgICAgICAgIDogUHJvbWlzZTxSZW5kZXJpbmdSZXN1bHRzPlxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQySW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudDIoXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5LmNvbmZpZywgZW50cnkuaW5mb1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYERPTkUgcmVuZGVyRG9jdW1lbnQySW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEVSUk9SIHJlbmRlckRvY3VtZW50MkluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWAsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb25maWcuY29uY3VycmVuY3kpO1xuXG4gICAgLy8gcXVldWUucHVzaCByZXR1cm5zIGEgUHJvbWlzZSB0aGF0J3MgZnVsZmlsbGVkIHdoZW5cbiAgICAvLyB0aGUgdGFzayBmaW5pc2hlcy5cbiAgICAvLyBIZW5jZSB3YWl0Rm9yIGlzIGFuIGFycmF5IG9mIFByb21pc2VzLlxuICAgIGNvbnN0IHdhaXRGb3IgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxlejIpIHtcbiAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGF1dG9tYXRpY2FsbHkgd2FpdHMgZm9yIGFsbCB0aG9zZVxuICAgIC8vIFByb21pc2VzIHRvIHJlc29sdmUsIHdoaWxlIG1ha2luZyB0aGUgcmVzdWx0c1xuICAgIC8vIGFycmF5IGNvbnRhaW4gcmVzdWx0cy5cbiAgICBjb25zdCByZXN1bHRzOiBBcnJheTxSZW5kZXJpbmdSZXN1bHRzPiA9IFtdO1xuICAgIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgIH1cblxuICAgIC8vIDQuIEludm9rZSBob29rU2l0ZVJlbmRlcmVkXG5cbiAgICB0cnkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnSW52b2tpbmcgaG9va1NpdGVSZW5kZXJlZCcpO1xuICAgICAgICBhd2FpdCBjb25maWcuaG9va1NpdGVSZW5kZXJlZCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBob29rU2l0ZVJlbmRlcmVkIGZhaWxlZCBiZWNhdXNlICR7ZX1gKTtcbiAgICB9XG5cbiAgICAvLyA1LiByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiByZXN1bHRzO1xufTtcbiJdfQ==