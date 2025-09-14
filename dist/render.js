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
        ret.renderedMaha = await mahabhuta.processAsync(ret.renderMahaContext.content, ret.renderMahaContext.metadata, ret.config.mahafuncs);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUVsQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFVMUIsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBNEQ5QyxTQUFTLG1CQUFtQixDQUN4QixNQUFxQixFQUNyQixPQUFPO0lBRVAsTUFBTSxHQUFHLEdBQWtCO1FBQ3ZCLE1BQU07UUFFTixrQkFBa0IsRUFBb0I7WUFDbEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1lBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsVUFBVTtZQUMzQixJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU87WUFDckIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1NBQzdCO1FBRUQsUUFBUSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FDakIsT0FBTyxDQUFDLEtBQUssQ0FDNUI7UUFFRCxPQUFPO1FBQ1AsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3BCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtRQUM5QixVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVU7UUFDOUIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1FBRXpCLE9BQU8sRUFBb0I7WUFDdkIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1lBQ3BCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtZQUM5QixXQUFXLEVBQUUsV0FBVyxDQUFD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LElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxvQkFBb0I7SUFDcEIsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQztBQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCAqIGFzIGRhdGEgZnJvbSAnLi9kYXRhLmpzJztcbmltcG9ydCBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcblxuaW1wb3J0IGZhc3RxIGZyb20gJ2Zhc3RxJztcbmltcG9ydCB0eXBlIHsgcXVldWVBc1Byb21pc2VkIH0gZnJvbSBcImZhc3RxXCI7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uIH0gZnJvbSAnLi9pbmRleC5qcyc7XG5pbXBvcnQgeyBSZW5kZXJlciwgUmVuZGVyaW5nQ29udGV4dCB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCB7XG4gICAgRG9jdW1lbnRzQ2FjaGVcbn0gZnJvbSAnLi9jYWNoZS9jYWNoZS1zcWxpdGUuanMnO1xuaW1wb3J0IHtcbiAgICBEb2N1bWVudFxufSBmcm9tICcuL2NhY2hlL3NjaGVtYS5qcyc7XG5pbXBvcnQgeyBwZXJmb3JtYW5jZSB9IGZyb20gJ25vZGU6cGVyZl9ob29rcyc7XG5cbi8vIEZvciBodHRwczovL2dpdGh1Yi5jb20vYWthc2hhY21zL2FrYXNoYXJlbmRlci9pc3N1ZXMvMTAzXG4vLyBUaGUgaWRlYSBpcyBub3JtYWxpemluZyB0aGUgZGF0YSByZXR1cm5lZC4gIFRoaXMgc2hvdWxkXG4vLyBlbGltaW5hdGUgdGhlIG5lZWQgZm9yIHRoZSBkYXRhIG1vZHVsZS4gIFRoaXMgc2hvdWxkXG4vLyBpbXByb3ZlIHRoZSBhbmFseXplYWJpbGl0eSBvZiBkYXRhIGFib3V0IHRoZSByZW5kZXJpbmcgcHJvY2Vzcy5cblxuZXhwb3J0IHR5cGUgUmVuZGVyaW5nUmVzdWx0cyA9IHtcblxuICAgIHZwYXRoPzogc3RyaW5nO1xuICAgIHJlbmRlclBhdGg/OiBzdHJpbmc7XG5cbiAgICByZW5kZXJGb3JtYXQ6IHN0cmluZztcblxuICAgIHJlbmRlclN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlckVuZD86IG51bWJlcjtcblxuICAgIHJlbmRlckZpcnN0U3RhcnQ/OiBudW1iZXI7XG4gICAgcmVuZGVyRmlyc3RFbmQ/OiBudW1iZXI7XG5cbiAgICByZW5kZXJMYXlvdXRTdGFydD86IG51bWJlcjtcbiAgICByZW5kZXJMYXlvdXRFbmQ/OiBudW1iZXI7XG5cbiAgICByZW5kZXJNYWhhU3RhcnQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTWFoYUVuZD86IG51bWJlcjtcblxuICAgIC8vIEVsYXBzZWQgdGltZSBjYWxjdWxhdGlvbnNcbiAgICByZW5kZXJGaXJzdEVsYXBzZWQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTGF5b3V0RWxhcHNlZD86IG51bWJlcjtcbiAgICByZW5kZXJNYWhhRWxhcHNlZD86IG51bWJlcjtcbiAgICByZW5kZXJUb3RhbEVsYXBzZWQ/OiBudW1iZXI7XG5cbiAgICBlcnJvcnM/OiBBcnJheTxFcnJvcj47XG59O1xuXG4vLyBDb2xsZWN0IGFsbCByZXF1aXJlZCBkYXRhIGluIGFuIGluc3RhbmNlIG9mIHRoaXMgb2JqZWN0LlxudHlwZSBSZW5kZXJpbmdEYXRhID0ge1xuICAgIGNvbmZpZz86IENvbmZpZ3VyYXRpb247XG4gICAgcmVuZGVyZXI/OiBSZW5kZXJlcjtcblxuICAgIGRvY0luZm8/OiBhbnk7XG5cbiAgICB2cGF0aD86IHN0cmluZztcbiAgICByZW5kZXJQYXRoPzogc3RyaW5nO1xuICAgIG1vdW50UG9pbnQ/OiBzdHJpbmc7XG4gICAgcmVuZGVyVG8/OiBzdHJpbmc7XG5cbiAgICByZW5kZXJGaXJzdENvbnRleHQ/OiBSZW5kZXJpbmdDb250ZXh0O1xuICAgIHJlbmRlcmVkRmlyc3Q/OiBzdHJpbmc7XG5cbiAgICBsYXlvdXRGb3JtYXQ/OiBzdHJpbmc7XG4gICAgcmVuZGVyTGF5b3V0Q29udGV4dD86IFJlbmRlcmluZ0NvbnRleHQ7XG4gICAgcmVuZGVyZWRMYXlvdXQ/OiBzdHJpbmc7XG5cbiAgICByZW5kZXJNYWhhQ29udGV4dD86IFJlbmRlcmluZ0NvbnRleHQ7XG4gICAgcmVuZGVyZWRNYWhhPzogc3RyaW5nO1xuXG4gICAgcmVzdWx0cz86IFJlbmRlcmluZ1Jlc3VsdHM7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVSZW5kZXJpbmdEYXRhKFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvXG4pOiBSZW5kZXJpbmdEYXRhIHtcbiAgICBjb25zdCByZXQgPSA8UmVuZGVyaW5nRGF0YT57XG4gICAgICAgIGNvbmZpZyxcblxuICAgICAgICByZW5kZXJGaXJzdENvbnRleHQ6IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgICAgIGZzcGF0aDogZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGRvY0luZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIGJvZHk6IGRvY0luZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBkb2NJbmZvLm1ldGFkYXRhXG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVuZGVyZXI6IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKFxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aFxuICAgICAgICApLFxuXG4gICAgICAgIGRvY0luZm8sXG4gICAgICAgIHZwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICByZW5kZXJQYXRoOiBkb2NJbmZvLnJlbmRlclBhdGgsXG4gICAgICAgIG1vdW50UG9pbnQ6IGRvY0luZm8ubW91bnRQb2ludCxcbiAgICAgICAgcmVuZGVyVG86IGNvbmZpZy5yZW5kZXJUbyxcblxuICAgICAgICByZXN1bHRzOiA8UmVuZGVyaW5nUmVzdWx0cz57XG4gICAgICAgICAgICB2cGF0aDogZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGRvY0luZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlclN0YXJ0OiBwZXJmb3JtYW5jZS5ub3coKSxcbiAgICAgICAgICAgIGVycm9yczogbmV3IEFycmF5PEVycm9yPigpXG4gICAgICAgIH1cbiAgICB9O1xuICAgIGlmIChyZXQucmVuZGVyZXIpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRm9ybWF0ID0gcmV0LnJlbmRlcmVyLnJlbmRlckZvcm1hdChyZXQucmVuZGVyRmlyc3RDb250ZXh0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFRoZSBjb3JlIHBhcnQgb2YgcmVuZGVyaW5nIGNvbnRlbnQgdXNpbmcgYSByZW5kZXJlci5cbiAqIFRoaXMgZnVuY3Rpb24gbG9va3MgZm9yIHRoZSByZW5kZXJlciwgYW5kIGlmIG5vbmUgaXNcbiAqIGZvdW5kIGl0IHNpbXBseSByZXR1cm5zLiAgSXQgdGhlbiBkb2VzIGEgbGl0dGxlIHNldHVwXG4gKiB0byB0aGUgbWV0YWRhdGEgb2JqZWN0LCBhbmQgY2FsbHMgdGhlIHJlbmRlciBmdW5jdGlvblxuICpcbiAqIEBwYXJhbSBjb25maWcgLSBBa2FzaGFDTVMgQ29uZmlndXJhdGlvblxuICogQHBhcmFtIHJjIC0gUmVuZGVyaW5nQ29udGV4dCBmb3IgdXNlIHdpdGggUmVuZGVyZXJzXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckNvbnRlbnQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIHJjOiBSZW5kZXJpbmdDb250ZXh0XG4pXG4gICAgLy8gVGhlIHJldHVybiBpcyBhIHNpbXBsZSBvYmplY3RcbiAgICAvLyBjb250YWluaW5nIHVzZWZ1bCBkYXRhXG4gICAgOiBQcm9taXNlPHtcbiAgICAgICAgcmVuZGVyZXJOYW1lPzogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ/OiBzdHJpbmcsXG4gICAgICAgIHJlbmRlcmVkOiBzdHJpbmdcbiAgICB9Plxue1xuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJDb250ZW50IGAsIHJjKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKFxuICAgICAgICByYy5mc3BhdGhcbiAgICApO1xuICAgIGlmICghcmVuZGVyZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlbmRlcmVyTmFtZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZm9ybWF0OiB1bmRlZmluZWQsXG4gICAgICAgICAgICByZW5kZXJlZDogcmMuYm9keVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIEFkZCBuZWNlc3NhcnkgaXRlbXMgdG8gdGhlIG1ldGFkYXRhXG4gICAgcmMubWV0YWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgIHJjLm1ldGFkYXRhLnBhcnRpYWwgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgcmMubWV0YWRhdGEucGFydGlhbFN5bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIHJjLm1ldGFkYXRhLmFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgcmMubWV0YWRhdGEucGx1Z2luID0gY29uZmlnLnBsdWdpbjtcblxuICAgIC8vIFJlbmRlciB0aGUgcHJpbWFyeSBjb250ZW50XG4gICAgbGV0IGRvY3JlbmRlcmVkID0gYXdhaXQgcmVuZGVyZXIucmVuZGVyKHJjKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJDb250ZW50IHJlbmRlcmVkPWAsIGRvY3JlbmRlcmVkKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXJlck5hbWU6IHJlbmRlcmVyLm5hbWUsXG4gICAgICAgIGZvcm1hdDogcmVuZGVyZXIucmVuZGVyRm9ybWF0KHJjKSxcbiAgICAgICAgcmVuZGVyZWQ6IGRvY3JlbmRlcmVkXG4gICAgfTtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBhbmQgdGhlIG5leHQgZXhpc3Qgc29sZWx5IHRvXG4vLyBzaW1wbGlmeSByZW5kZXJEb2N1bWVudC5cblxuYXN5bmMgZnVuY3Rpb24gd3JpdGVDU1N0b091dHB1dChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mbyxcbiAgICBkb2NSZW5kZXJlZCxcbiAgICByZW5kZXJTdGFydDogRGF0ZVxuKSB7XG5cbiAgICBjb25zdCByZW5kZXJUb0ZwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICBjb25zdCByZW5kZXJUb0RpciA9IHBhdGguZGlybmFtZShyZW5kZXJUb0ZwYXRoKTtcbiAgICBhd2FpdCBmc3AubWtkaXIocmVuZGVyVG9EaXIsIHtcbiAgICAgICAgICAgICAgICByZWN1cnNpdmU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyVG9GcGF0aCwgZG9jUmVuZGVyZWQsICd1dGY4Jyk7XG4gICAgY29uc3QgcmVuZGVyRW5kUmVuZGVyZWQgPSBuZXcgRGF0ZSgpO1xuICAgIGF3YWl0IGRhdGEucmVwb3J0KFxuICAgICAgICBkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgsXG4gICAgICAgIGNvbmZpZy5yZW5kZXJUbyxcbiAgICAgICAgXCJSRU5ERVJFRFwiLCByZW5kZXJTdGFydCk7XG4gICAgcmV0dXJuIGBDU1MgJHtkb2NJbmZvLnZwYXRofSA9PT4gJHtkb2NJbmZvLnJlbmRlclBhdGh9ICgkeyhyZW5kZXJFbmRSZW5kZXJlZC52YWx1ZU9mKCkgLSByZW5kZXJTdGFydC52YWx1ZU9mKCkpIC8gMTAwMH0gc2Vjb25kcylcXG4ke2F3YWl0IGRhdGEuZGF0YTRmaWxlKGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCl9YDtcblxufVxuXG5hc3luYyBmdW5jdGlvbiBjb3B5QXNzZXRUb091dHB1dChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mbyxcbiAgICBkb2NSZW5kZXJlZCxcbiAgICByZW5kZXJTdGFydDogRGF0ZVxuKSB7XG5cbiAgICBjb25zdCByZW5kZXJUb0ZwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICBjb25zdCByZW5kZXJUb0RpciA9IHBhdGguZGlybmFtZShyZW5kZXJUb0ZwYXRoKTtcbiAgICBhd2FpdCBmc3AubWtkaXIocmVuZGVyVG9EaXIsIHtcbiAgICAgICAgICAgICAgICByZWN1cnNpdmU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgIGF3YWl0IGZzcC5jb3B5RmlsZShkb2NJbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclRvRnBhdGgpO1xuICAgIC8vIGNvbnNvbGUubG9nKGBDT1BJRUQgJHtkb2NJbmZvLnBhdGh9ID09PiAke3JlbmRlclRvRnBhdGh9YCk7XG4gICAgY29uc3QgcmVuZGVyRW5kQ29waWVkID0gbmV3IERhdGUoKTtcbiAgICByZXR1cm4gYENPUFkgJHtkb2NJbmZvLnZwYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofSAoJHsocmVuZGVyRW5kQ29waWVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKWA7XG59XG5cbmZ1bmN0aW9uIGNvcHlQcm9wZXJ0aWVzKGRlc3Q6IGFueSwgc3JjOiBhbnksIGV4Y2VwdExheW91dDogYm9vbGVhbikge1xuICAgIGZvciAodmFyIHlwcm9wIGluIHNyYykge1xuICAgICAgICBpZiAoZXhjZXB0TGF5b3V0ICYmIHlwcm9wID09PSAnbGF5b3V0JykgY29udGludWU7XG4gICAgICAgIGRlc3RbeXByb3BdID0gc3JjW3lwcm9wXTtcbiAgICB9XG4gICAgcmV0dXJuIGRlc3Q7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlbmRlckNTU0ZpbGUocmV0OiBSZW5kZXJpbmdEYXRhKTogUHJvbWlzZTxSZW5kZXJpbmdEYXRhPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRm9ybWF0ID0gJ0NTUyc7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgICAgICAvLyBSZW5kZXIgdGhlIENTUyBjb250ZW50XG4gICAgICAgIHJldC5yZW5kZXJlZEZpcnN0ID0gYXdhaXQgcmV0LnJlbmRlcmVyLnJlbmRlcihyZXQucmVuZGVyRmlyc3RDb250ZXh0KTtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgICAgICAvLyBXcml0ZSB0aGUgcmVuZGVyZWQgQ1NTIHRvIG91dHB1dFxuICAgICAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKHJldC5jb25maWcucmVuZGVyVG8sIHJldC5kb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlckRlc3QpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJEZXN0LCByZXQucmVuZGVyZWRGaXJzdCwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoU3RyaW5nKGVycm9yKSkpO1xuICAgIH1cbiAgICAvLyBDYWxjdWxhdGUgZWxhcHNlZCB0aW1lc1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydDtcbiAgICB9XG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RWxhcHNlZCA9IDA7XG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVsYXBzZWQgPSAwO1xuICAgIGlmIChyZXQucmVzdWx0cy5yZW5kZXJTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyVG90YWxFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRW5kIC0gcmV0LnJlc3VsdHMucmVuZGVyU3RhcnQ7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckNTU0ZpbGUgJHtyZXQudnBhdGh9YCwgcmV0KTtcblxuICAgIHJldHVybiByZXQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvcHlBc3NldEZpbGUocmV0OiBSZW5kZXJpbmdEYXRhKTogUHJvbWlzZTxSZW5kZXJpbmdEYXRhPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRm9ybWF0ID0gJ0NPUFknO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAgICAgLy8gQ29weSB0aGUgYXNzZXQgZmlsZSB0byBvdXRwdXQgZGlyZWN0b3J5XG4gICAgICAgIGNvbnN0IHJlbmRlckRlc3QgPSBwYXRoLmpvaW4ocmV0LmNvbmZpZy5yZW5kZXJUbywgcmV0LmRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICBhd2FpdCBmc3AuY29weUZpbGUocmV0LmRvY0luZm8uZnNwYXRoLCByZW5kZXJEZXN0KTtcblxuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKSk7XG4gICAgfVxuXG4gICAgLy8gQ2FsY3VsYXRlIGVsYXBzZWQgdGltZXNcbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyRmlyc3RTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdEVuZCAtIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQ7XG4gICAgfVxuICAgIHJldC5yZXN1bHRzLnJlbmRlckxheW91dEVsYXBzZWQgPSAwO1xuICAgIHJldC5yZXN1bHRzLnJlbmRlck1haGFFbGFwc2VkID0gMDtcbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyU3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlclRvdGFsRWxhcHNlZCA9IHJldC5yZXN1bHRzLnJlbmRlckVuZCAtIHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0O1xuICAgIH1cblxuICAgIC8vIFVzZSB0aGlzIHRvIHZlcmlmeSBlcnJvciBoYW5kbGluZ1xuICAgIC8vIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKG5ldyBFcnJvcihgUmFuZG9tIGVycm9yYCkpO1xuXG4gICAgLy8gY29uc29sZS5sb2coYGNvcHlBc3NldEZpbGUgJHtyZXQudnBhdGh9YCwgcmV0KTtcbiAgICByZXR1cm4gcmV0O1xufVxuXG5cblxuLyoqXG4gKiBBdHRlbXB0IHRvIHJld3JpdGUgcmVuZGVyRG9jdW1lbnQgd2l0aCBjbGVhbmVyIGNvZGUsIGFuZCBhXG4gKiBkaWZmZXJlbnQgbWV0aG9kIGZvciBjb2xsZWN0aW5nIHBlcmZvcm1hbmNlL3RpbWluZyBkYXRhLlxuICogXG4gKiBUaGUgZXhpc3RpbmcgcmVuZGVyRG9jdW1lbnQgaXMgbWVzc3kgYW5kIGhhcmQgdG8gdW5kZXJzdGFuZC5cbiAqIEdvYWw6IG1ha2UgaXQgbW9yZSBzdHJhaWdodC1mb3J3YXJkLCBlYXN5IHRvIHVuZGVyc3RhbmQuXG4gKiBHb2FsOiBzdG9yZSBhbGwgZGF0YSBpbiBhIHdlbGwgZGVzaWduZWQgb2JqZWN0XG4gKiBcbiAqIFRoZSBleGlzdGluZyBwZXJmb3JtYW5jZSBtZWFzdXJlbWVudHMgYXJlIGltcHJlY2lzZSBieSB1c2luZ1xuICogdGhlIERhdGUgb2JqZWN0LCBhbmQgYnkgbm90IGNvbXB1dGluZyB0aGUgZWxhcHNlZCB0aW1lIG9mXG4gKiBlYWNoIHNlZ21lbnQuICBJbnN0ZWFkLCBpdCBjb21wdXRzIHRoZSB0aW1lIGZyb20gdGhlIHN0YXJ0XG4gKiBmb3IgZWFjaCBzZWdtZW50LCB3aGljaCBpc24ndCB1c2VmdWwuICBXZSB3YW50IHRvIHNlZSB0aGVcbiAqIGVsYXBzZWQgdGltZS5cbiAqIFxuICogRm9yIHByZWNpc2UgdGltZSBtZWFzdXJlcyB0aGlzIHVzZXMgdGhlIE5vZGUuanMgcGVyZm9ybWFuY2VcbiAqIGhvb2tzIHRvIGdldCBhY2N1cmF0ZSB0aW1lc3RhbXBzLlxuICogXG4gKiBUaGlzIGNvZGUgaGFzIG5vdCBiZWVuIGV4ZWN1dGVkIGFzIHlldC5cbiAqIFxuICogVGFza3M6XG4gKiAqIFRPRE8gSW1wbGVtZW50IENTUyByZW5kZXJGb3JtYXRcbiAqICogVE9ETyBJbXBsZW1lbnQgdGhlICE9IEhUTUwgcmVuZGVyRm9ybWF0XG4gKiAqIFRPRE8gVGVzdCBhbmQgZml4IGJ1Z3NcbiAqIFxuICogQHBhcmFtIGNvbmZpZyBcbiAqIEBwYXJhbSBkb2NJbmZvIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJEb2N1bWVudDIoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm9cbik6IFByb21pc2U8UmVuZGVyaW5nUmVzdWx0cz4ge1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBtYXN0ZXIgb2JqZWN0IHRvIGhvbGQgYWxsIGRhdGFcbiAgICBjb25zdCByZXQ6IFJlbmRlcmluZ0RhdGEgPSBjcmVhdGVSZW5kZXJpbmdEYXRhKGNvbmZpZywgZG9jSW5mbyk7XG5cbiAgICAvLyBQZWVsIG9mZiB0byBtb2RlLXNwZWNpZmljIGZ1bmN0aW9uc1xuICAgIGlmIChyZXQ/LnJlbmRlcmVyPy5yZW5kZXJGb3JtYXQocmV0LnJlbmRlckZpcnN0Q29udGV4dCkgPT09ICdDU1MnKSB7XG4gICAgICAgIGNvbnN0IGNzc1Jlc3VsdCA9IGF3YWl0IHJlbmRlckNTU0ZpbGUocmV0KTtcbiAgICAgICAgcmV0dXJuIGNzc1Jlc3VsdC5yZXN1bHRzO1xuICAgIH0gZWxzZSBpZiAoIXJldC5yZW5kZXJlclxuICAgICB8fCAocmV0LnJlbmRlcmVyLnJlbmRlckZvcm1hdChyZXQucmVuZGVyRmlyc3RDb250ZXh0KSAhPT0gJ0hUTUwnKVxuICAgICkge1xuICAgICAgICBjb25zdCBhc3NldFJlc3VsdCA9IGF3YWl0IGNvcHlBc3NldEZpbGUocmV0KTtcbiAgICAgICAgcmV0dXJuIGFzc2V0UmVzdWx0LnJlc3VsdHM7XG4gICAgfVxuXG4gICAgLy8gT3RoZXJ3aXNlIGl0IGlzIEhUTUxcbiAgICAvLyBUaGlzIGlzIHdoZXJlIHdlIHJlbmRlciB0aGUgY29udGVudCwgdGhlbiByZW5kZXIgdGhhdFxuICAgIC8vIGludG8gdGhlIGxheW91dCAoaWYgb25lIGV4aXN0cyksIHRoZW4gcnVuIE1haGFiaHV0YS5cblxuICAgIC8vIFRoZXNlIGZ1bmN0aW9ucyBhcmUgZHVwbGljYXRlcyBiZXR3ZWVuIHRoZSBmaXJzdFxuICAgIC8vIHR3byBzdGFnZXMuICBTYXZlIGEgY291cGxlIG1pY3Jvc2Vjb25kcyBieSBpbnN0YW50aWF0aW5nXG4gICAgLy8gdGhlIGZ1bmN0aW9ucyBvbmNlLlxuICAgIGNvbnN0IGRvUGFydGlhbCA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICBjb25zdCBkb1BhcnRpYWxTeW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcblxuICAgIC8vIEZpcnN0IFJlbmRlclxuICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIEFkZCBuZWNlc3NhcnkgaXRlbXMgdG8gdGhlIG1ldGFkYXRhXG4gICAgICAgIHJldC5yZW5kZXJGaXJzdENvbnRleHQubWV0YWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLnBhcnRpYWwgPSBkb1BhcnRpYWw7XG4gICAgICAgIHJldC5yZW5kZXJGaXJzdENvbnRleHQubWV0YWRhdGEucGFydGlhbFN5bmMgPSBkb1BhcnRpYWxTeW5jO1xuICAgICAgICByZXQucmVuZGVyRmlyc3RDb250ZXh0Lm1ldGFkYXRhLmFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgIHJldC5yZW5kZXJGaXJzdENvbnRleHQubWV0YWRhdGEucGx1Z2luID0gY29uZmlnLnBsdWdpbjtcblxuICAgICAgICAvLyBSZW5kZXIgdGhlIHByaW1hcnkgY29udGVudFxuICAgICAgICByZXQucmVuZGVyZWRGaXJzdCA9IGF3YWl0IHJldC5yZW5kZXJlci5yZW5kZXIocmV0LnJlbmRlckZpcnN0Q29udGV4dCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoU3RyaW5nKGVycm9yKSkpO1xuICAgICAgICAvLyBVc2UgZW1wdHkgc3RyaW5nIGFzIGZhbGxiYWNrIGlmIHJlbmRlcmluZyBmYWlsc1xuICAgICAgICByZXQucmVuZGVyZWRGaXJzdCA9ICcnO1xuICAgIH1cblxuICAgIHJldC5yZXN1bHRzLnJlbmRlckZpcnN0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgLy8gRU5EIEZpcnN0IFJlbmRlclxuXG4gICAgLy8gTGF5b3V0IFJlbmRlclxuICAgIHJldC5yZXN1bHRzLnJlbmRlckxheW91dFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICBpZiAocmV0Py5kb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXRzID0gY29uZmlnLmFrYXNoYS5maWxlY2FjaGUubGF5b3V0c0NhY2hlO1xuICAgICAgICAgICAgLy8gYXdhaXQgbGF5b3V0cy5pc1JlYWR5KCk7XG5cbiAgICAgICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGxheW91dHMuZmluZChyZXQuZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQpO1xuICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBObyBsYXlvdXQgZm91bmQgaW4gJHt1dGlsLmluc3BlY3QocmV0LmNvbmZpZy5sYXlvdXREaXJzKX0gZm9yICR7cmV0Py5kb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSBpbiBmaWxlICR7cmV0LmRvY0luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzID0gcmV0LnJlc3VsdHMuZXJyb3JzIHx8IFtdO1xuICAgICAgICAgICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgICAgICAgICAvLyBTa2lwIGxheW91dCByZW5kZXJpbmcsIHVzZSBmaXJzdCByZW5kZXIgcmVzdWx0XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlcmVkTGF5b3V0ID0gcmV0LnJlbmRlcmVkRmlyc3Q7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoXG4gICAgICAgICAgICAgICAgICAgIHJldC5kb2NJbmZvLm1ldGFkYXRhLmxheW91dFxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dCA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiByZXQuZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZvdW5kLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IGZvdW5kLmRvY0JvZHksXG4gICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7fVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICA9IGNvcHlQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZC5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgPSBjb3B5UHJvcGVydGllcyhcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldC5yZW5kZXJMYXlvdXRDb250ZXh0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0LmRvY0luZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YS5jb250ZW50ID0gcmV0LnJlbmRlcmVkRmlyc3Q7XG5cbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEucGFydGlhbCA9IGRvUGFydGlhbDtcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YS5wYXJ0aWFsU3luYyA9IGRvUGFydGlhbFN5bmM7XG4gICAgICAgICAgICAgICAgcmV0LnJlbmRlckxheW91dENvbnRleHQubWV0YWRhdGEuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgICAgICByZXQucmVuZGVyTGF5b3V0Q29udGV4dC5tZXRhZGF0YS5wbHVnaW4gPSBjb25maWcucGx1Z2luO1xuXG4gICAgICAgICAgICAgICAgLy8gUmVuZGVyIHRoZSBsYXlvdXQgY29udGVudFxuICAgICAgICAgICAgICAgIHJldC5yZW5kZXJlZExheW91dCA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihyZXQucmVuZGVyTGF5b3V0Q29udGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSB3aXRoICR7ZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gJHtlLnN0YWNrID8gZS5zdGFjayA6IGV9YCk7XG4gICAgICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMucHVzaChlcnJvcik7XG4gICAgICAgICAgICAvLyBVc2UgZmlyc3QgcmVuZGVyIHJlc3VsdCBhcyBmYWxsYmFja1xuICAgICAgICAgICAgcmV0LnJlbmRlcmVkTGF5b3V0ID0gcmV0LnJlbmRlcmVkRmlyc3Q7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAvLyBFTkQgTGF5b3V0IFJlbmRlclxuXG4gICAgLy8gTWFoYWJodXRhXG4gICAgcmV0LnJlc3VsdHMucmVuZGVyTWFoYVN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICByZXQucmVuZGVyTWFoYUNvbnRleHQgPSA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgIGZzcGF0aDogcmV0LmRvY0luZm8ubWV0YWRhdGEubGF5b3V0LFxuICAgICAgICBjb250ZW50OiByZXQucmVuZGVyZWRMYXlvdXRcbiAgICAgICAgICAgID8gcmV0LnJlbmRlcmVkTGF5b3V0IDogcmV0LnJlbmRlcmVkRmlyc3QsXG4gICAgICAgIGJvZHk6IHJldC5yZW5kZXJlZExheW91dFxuICAgICAgICAgICAgPyByZXQucmVuZGVyZWRMYXlvdXQgOiByZXQucmVuZGVyZWRGaXJzdCxcbiAgICAgICAgbWV0YWRhdGE6IHt9XG4gICAgfTtcblxuICAgIHJldC5yZW5kZXJNYWhhQ29udGV4dC5tZXRhZGF0YVxuICAgICAgICA9IGNvcHlQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgcmV0LnJlbmRlck1haGFDb250ZXh0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgcmV0LmRvY0luZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHJldC5kb2NJbmZvPy5tZXRhZGF0YT8uY29uZmlnPy5tYWhhYmh1dGFDb25maWcpIHtcbiAgICAgICAgICAgIG1haGFiaHV0YS5jb25maWcocmV0LmRvY0luZm8/Lm1ldGFkYXRhPy5jb25maWc/Lm1haGFiaHV0YUNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldC5yZW5kZXJlZE1haGEgPSAgYXdhaXQgbWFoYWJodXRhLnByb2Nlc3NBc3luYyhcbiAgICAgICAgICAgIHJldC5yZW5kZXJNYWhhQ29udGV4dC5jb250ZW50LCByZXQucmVuZGVyTWFoYUNvbnRleHQubWV0YWRhdGEsXG4gICAgICAgICAgICByZXQuY29uZmlnLm1haGFmdW5jc1xuICAgICAgICApO1xuICAgIH0gY2F0Y2ggKGUyKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBFcnJvciB3aXRoIE1haGFiaHV0YSAke3JldC5kb2NJbmZvLnZwYXRofSB3aXRoICR7cmV0LmRvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZTIuc3RhY2sgPyBlMi5zdGFjayA6IGUyfWApO1xuICAgICAgICByZXQucmVzdWx0cy5lcnJvcnMgPSByZXQucmVzdWx0cy5lcnJvcnMgfHwgW107XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgLy8gVXNlIGxheW91dCByZXN1bHQgb3IgZmlyc3QgcmVuZGVyIGFzIGZhbGxiYWNrXG4gICAgICAgIHJldC5yZW5kZXJlZE1haGEgPSByZXQucmVuZGVyTWFoYUNvbnRleHQuY29udGVudDtcbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJNYWhhRW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgLy8gRU5EIE1haGFiaHV0YVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgcmV0LmNvbmZpZy5yZW5kZXJUbywgcmV0LmRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHtcbiAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJEZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldC5yZW5kZXJlZE1haGEsICd1dGYtOCcpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLmVycm9ycyA9IHJldC5yZXN1bHRzLmVycm9ycyB8fCBbXTtcbiAgICAgICAgcmV0LnJlc3VsdHMuZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpKTtcbiAgICB9XG5cbiAgICByZXQucmVzdWx0cy5yZW5kZXJFbmQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIC8vIENhbGN1bGF0ZSBlbGFwc2VkIHRpbWVzXG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlckZpcnN0U3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyRmlyc3RFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJGaXJzdFN0YXJ0O1xuICAgIH1cbiAgICBpZiAocmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0U3RhcnQgJiYgcmV0LnJlc3VsdHMucmVuZGVyTGF5b3V0RW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlckxheW91dEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJMYXlvdXRTdGFydDtcbiAgICB9XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlck1haGFTdGFydCAmJiByZXQucmVzdWx0cy5yZW5kZXJNYWhhRW5kKSB7XG4gICAgICAgIHJldC5yZXN1bHRzLnJlbmRlck1haGFFbGFwc2VkID0gcmV0LnJlc3VsdHMucmVuZGVyTWFoYUVuZCAtIHJldC5yZXN1bHRzLnJlbmRlck1haGFTdGFydDtcbiAgICB9XG4gICAgaWYgKHJldC5yZXN1bHRzLnJlbmRlclN0YXJ0ICYmIHJldC5yZXN1bHRzLnJlbmRlckVuZCkge1xuICAgICAgICByZXQucmVzdWx0cy5yZW5kZXJUb3RhbEVsYXBzZWQgPSByZXQucmVzdWx0cy5yZW5kZXJFbmQgLSByZXQucmVzdWx0cy5yZW5kZXJTdGFydDtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQyICR7cmV0LnZwYXRofWAsIHJldCk7XG4gICAgcmV0dXJuIHJldC5yZXN1bHRzO1xufVxuXG4vKipcbiAqIFJlbmRlciBhIGRvY3VtZW50LCBhY2NvdW50aW5nIGZvciB0aGUgbWFpbiBjb250ZW50LFxuICogYSBsYXlvdXQgdGVtcGxhdGUgKGlmIGFueSksIGFuZCBNYWhhYmh1dGEgKGlmIHRoZSBjb250ZW50XG4gKiBvdXRwdXQgaXMgSFRNTCkuICBUaGlzIGFsc28gaGFuZGxlcyByZW5kZXJpbmcgb3RoZXIgdHlwZXNcbiAqIG9mIGNvbnRlbnQgc3VjaCBhcyBMRVNTIENTUyBmaWxlcy5cbiAqXG4gKiBAcGFyYW0gY29uZmlnIFxuICogQHBhcmFtIGRvY0luZm8gXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvXG4pOiBQcm9taXNlPHN0cmluZz5cbntcbiAgICBjb25zdCByZW5kZXJTdGFydCA9IG5ldyBEYXRlKCk7XG5cbiAgICAvLyBSZW5kZXIgdGhlIG1haW4gY29udGVudFxuXG4gICAgaWYgKHR5cGVvZiBkb2NJbmZvLmRvY0NvbnRlbnQgIT09ICdzdHJpbmcnXG4gICAgIHx8IHR5cGVvZiBkb2NJbmZvLmRvY0JvZHkgIT09ICdzdHJpbmcnXG4gICAgKSB7XG4gICAgICAgIC8vIGNvbnNvbGUud2FybihgTm8gY29udGVudCB0byByZW5kZXIgZm9yIGAsIGRvY0luZm8pO1xuICAgIH1cblxuICAgIGNvbnN0IHJjID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICBmc3BhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgIGNvbnRlbnQ6IGRvY0luZm8uZG9jQ29udGVudCxcbiAgICAgICAgYm9keTogZG9jSW5mby5kb2NCb2R5LFxuICAgICAgICBtZXRhZGF0YTogZG9jSW5mby5tZXRhZGF0YVxuICAgIH07XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgY29udGV4dD0gJHtyYy5mc3BhdGh9YCwgcmMpO1xuXG4gICAgbGV0IGRvY0Zvcm1hdDsgICAgICAvLyBLbm93aW5nIHRoZSBmb3JtYXQgXG4gICAgbGV0IGRvY1JlbmRlcmVkO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckNvbnRlbnQoY29uZmlnLCByYyk7XG4gICAgICAgIGRvY0Zvcm1hdCA9IHJlc3VsdC5mb3JtYXQ7XG4gICAgICAgIGRvY1JlbmRlcmVkID0gcmVzdWx0LnJlbmRlcmVkO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSAkeyhlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnIpfWApO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9ICR7KGVyci5zdGFjayA/IGVyci5zdGFjayA6IGVycil9YCk7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCAke2RvY0Zvcm1hdH0gJHtkb2NJbmZvLnZwYXRofSByZW5kZXJlZD1gLCBkb2NSZW5kZXJlZCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoZG9jSW5mby5tb3VudFBvaW50LCBcbiAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICBcIkZJUlNUIFJFTkRFUlwiLCByZW5kZXJTdGFydCk7XG5cbiAgICAvLyBIYW5kbGUgdGhlc2UgY2FzZXMgdXAgZnJvbnQgc28gdGhhdCB0aGUgcmVtYWluaW5nXG4gICAgLy8gY29kZSBjYW4gYmUgY2xlYW5lciBhbmQgZm9jdXMgb24gSFRNTCBsYXlvdXQgcmVuZGVyaW5nLlxuXG4gICAgaWYgKGRvY0Zvcm1hdCA9PT0gJ0NTUycpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB3cml0ZUNTU3RvT3V0cHV0KGNvbmZpZywgZG9jSW5mbywgZG9jUmVuZGVyZWQsIHJlbmRlclN0YXJ0KTtcbiAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluIFJFTkRFUiBDU1MgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW4gUkVOREVSIENTUyBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRvY0Zvcm1hdCAhPT0gJ0hUTUwnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb3B5QXNzZXRUb091dHB1dChjb25maWcsIGRvY0luZm8sIGRvY1JlbmRlcmVkLCByZW5kZXJTdGFydCk7XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbiBjb3B5IGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluIGNvcHkgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbmRlciB0aGUgbWFpbiBjb250ZW50IGludG8gYSBsYXlvdXQgdGVtcGxhdGUsXG4gICAgLy8gaWYgb25lIGlzIHNwZWNpZmllZFxuXG4gICAgbGV0IGxheW91dEZvcm1hdDtcbiAgICBsZXQgbGF5b3V0UmVuZGVyZWQ7XG4gICAgbGV0IHJlc3VsdDtcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgbGF5b3V0ICR7ZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gZG9jTWV0YWRhdGEgJHt1dGlsLmluc3BlY3QoZG9jSW5mby5kb2NNZXRhZGF0YSl9IG1ldGFkYXRhICR7dXRpbC5pbnNwZWN0KGRvY0luZm8ubWV0YWRhdGEpfWApO1xuICAgIGlmIChkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0KSB7XG5cbiAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgbGF5b3V0cy5pc1JlYWR5KCk7XG5cbiAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgbGF5b3V0cy5maW5kKGRvY0luZm8ubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBsYXlvdXQgZm91bmQgaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLmxheW91dERpcnMpfSBmb3IgJHtkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSBpbiBmaWxlICR7ZG9jSW5mby52cGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJjTGF5b3V0ID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBkb2NJbmZvLm1ldGFkYXRhLmxheW91dCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGZvdW5kLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBmb3VuZC5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmNMYXlvdXQubWV0YWRhdGFcbiAgICAgICAgICAgID0gY29weVByb3BlcnRpZXMoXG4gICAgICAgICAgICAgICAgcmNMYXlvdXQubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgZm91bmQubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICk7XG4gICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhXG4gICAgICAgICAgICA9IGNvcHlQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGRvY0luZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgcmNMYXlvdXQubWV0YWRhdGEuY29udGVudCA9IGRvY1JlbmRlcmVkO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHRcbiAgICAgICAgICAgICAgICA9IGF3YWl0IHJlbmRlckNvbnRlbnQoY29uZmlnLCByY0xheW91dCk7XG4gICAgICAgICAgICBsYXlvdXRGb3JtYXQgPSByZXN1bHQuZm9ybWF0O1xuICAgICAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSByZXN1bHQucmVuZGVyZWQ7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGxldCBlZSA9IG5ldyBFcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZS5zdGFjayA/IGUuc3RhY2sgOiBlfWApO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlZSk7XG4gICAgICAgICAgICB0aHJvdyBlZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGxheW91dEZvcm1hdCA9IGRvY0Zvcm1hdDtcbiAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSBkb2NSZW5kZXJlZDtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgJHtkb2NJbmZvLnZwYXRofSBhZnRlciBsYXlvdXQgcmVuZGVyIGZvcm1hdCAke2xheW91dEZvcm1hdH0gYCwgcmVzdWx0KTtcblxuICAgIGNvbnN0IHJlbmRlclNlY29uZFJlbmRlciA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoZG9jSW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGgsIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICAgXCJTRUNPTkQgUkVOREVSXCIsXG4gICAgICAgICAgICAgICAgICAgICAgcmVuZGVyU3RhcnQpO1xuXG4gICAgXG4gICAgLy8gTmV4dCBzdGVwIGlzIHRvIHJ1biBNYWhhYmh1dGEgb24gdGhlIHJlbmRlcmVkIGNvbnRlbnRcbiAgICAvLyBPZiBjb3Vyc2UsIE1haGFiaHV0YSBpcyBub3QgYXBwcm9wcmlhdGUgZm9yIGV2ZXJ5dGhpbmdcbiAgICAvLyBiZWNhdXNlIG5vdCBldmVyeXRoaW5nIGlzIEhUTUxcblxuICAgIHRyeSB7XG5cbiAgICAgICAgY29uc3QgbWFoYW1ldGFkYXRhXG4gICAgICAgICAgICA9IGNvcHlQcm9wZXJ0aWVzKFxuICAgICAgICAgICAgICAgIHsgfSxcbiAgICAgICAgICAgICAgICBkb2NJbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICApO1xuICAgICAgICBtYWhhbWV0YWRhdGEuY29udGVudCA9IGRvY1JlbmRlcmVkO1xuXG4gICAgICAgIGlmIChkb2NJbmZvPy5tZXRhZGF0YT8uY29uZmlnPy5tYWhhYmh1dGFDb25maWcpIHtcbiAgICAgICAgICAgIG1haGFiaHV0YS5jb25maWcoZG9jSW5mbz8ubWV0YWRhdGE/LmNvbmZpZz8ubWFoYWJodXRhQ29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgbWFoYW1ldGFkYXRhYCwgbWFoYW1ldGFkYXRhKTtcbiAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSBhd2FpdCBtYWhhYmh1dGEucHJvY2Vzc0FzeW5jKFxuICAgICAgICAgICAgbGF5b3V0UmVuZGVyZWQsIG1haGFtZXRhZGF0YSxcbiAgICAgICAgICAgIGNvbmZpZy5tYWhhZnVuY3NcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBPTEQgZG9jcmVuZGVyZWQgPSBhd2FpdCB0aGlzLm1haGFydW4obGF5b3V0cmVuZGVyZWQsIGRvY2RhdGEsIGNvbmZpZy5tYWhhZnVuY3MpO1xuICAgIH0gY2F0Y2ggKGUyKSB7XG4gICAgICAgIGxldCBlZWUgPSBuZXcgRXJyb3IoYEVycm9yIHdpdGggTWFoYWJodXRhICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZTIuc3RhY2sgPyBlMi5zdGFjayA6IGUyfWApO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVlZSk7XG4gICAgICAgIHRocm93IGVlZTtcbiAgICB9XG5cbiAgICBhd2FpdCBkYXRhLnJlcG9ydChkb2NJbmZvLm1vdW50UG9pbnQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1BSEFCSFVUQVwiLCByZW5kZXJTdGFydCk7XG5cbiAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlckRlc3QpLCB7XG4gICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgIH0pO1xuICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyRGVzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dFJlbmRlcmVkLCAndXRmLTgnKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGBSRU5ERVJFRCAke3JlbmRlcmVyLm5hbWV9ICR7ZG9jSW5mby5wYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofWApO1xuICAgIGNvbnN0IHJlbmRlckVuZFJlbmRlcmVkID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBkYXRhLnJlcG9ydChcbiAgICAgICAgZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb25maWcucmVuZGVyVG8sXG4gICAgICAgIFwiUkVOREVSRURcIiwgcmVuZGVyU3RhcnQpO1xuICAgIHJldHVybiBgJHtsYXlvdXRGb3JtYXR9ICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7ZG9jSW5mby5yZW5kZXJQYXRofSAoJHsocmVuZGVyRW5kUmVuZGVyZWQudmFsdWVPZigpIC0gcmVuZGVyU3RhcnQudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHMpXFxuJHthd2FpdCBkYXRhLmRhdGE0ZmlsZShkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgpfWA7XG5cbn1cblxuLyoqXG4gKiBSZW5kZXIgYWxsIHRoZSBkb2N1bWVudHMgaW4gYSBzaXRlLCBsaW1pdGluZ1xuICogdGhlIG51bWJlciBvZiBzaW11bHRhbmVvdXMgcmVuZGVyaW5nIHRhc2tzXG4gKiB0byB0aGUgbnVtYmVyIGluIGNvbmZpZy5jb25jdXJyZW5jeS5cbiAqXG4gKiBAcGFyYW0gY29uZmlnXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyKGNvbmZpZykge1xuXG4gICAgY29uc3QgZG9jdW1lbnRzID0gPERvY3VtZW50c0NhY2hlPmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIC8vIGF3YWl0IGRvY3VtZW50cy5pc1JlYWR5KCk7XG4gICAgLy8gY29uc29sZS5sb2coJ0NBTExJTkcgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQnKTtcbiAgICBhd2FpdCBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCgpO1xuICAgIFxuICAgIC8vIDEuIEdhdGhlciBsaXN0IG9mIGZpbGVzIGZyb20gUmVuZGVyRmlsZUNhY2hlXG4gICAgY29uc3QgZmlsZXogPSBhd2FpdCBkb2N1bWVudHMucGF0aHMoKTtcbiAgICAvLyBjb25zb2xlLmxvZyhgbmV3ZXJyZW5kZXIgZmlsZXogJHtmaWxlei5sZW5ndGh9YCk7XG5cbiAgICAvLyAyLiBFeGNsdWRlIGFueSB0aGF0IHdlIHdhbnQgdG8gaWdub3JlXG4gICAgY29uc3QgZmlsZXoyID0gW10gYXMgQXJyYXk8e1xuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgfT47XG4gICAgZm9yIChsZXQgZW50cnkgb2YgZmlsZXopIHtcbiAgICAgICAgbGV0IGluY2x1ZGUgPSB0cnVlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlbnRyeSk7XG4gICAgICAgIGxldCBzdGF0cztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0YXRzID0gYXdhaXQgZnNwLnN0YXQoZW50cnkuZnNwYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7IHN0YXRzID0gdW5kZWZpbmVkOyB9XG4gICAgICAgIGlmICghZW50cnkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgZWxzZSBpZiAoIXN0YXRzIHx8IHN0YXRzLmlzRGlyZWN0b3J5KCkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gVGhpcyBzaG91bGQgYXJpc2UgdXNpbmcgYW4gaWdub3JlIGNsYXVzZVxuICAgICAgICAvLyBlbHNlIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LnZwYXRoKSA9PT0gJy5EU19TdG9yZScpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcucGxhY2Vob2xkZXInKSBpbmNsdWRlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGluY2x1ZGUpIHtcbiAgICAgICAgICAgIC8vIFRoZSBxdWV1ZSBpcyBhbiBhcnJheSBvZiB0dXBsZXMgY29udGFpbmluZyB0aGVcbiAgICAgICAgICAgIC8vIGNvbmZpZyBvYmplY3QgYW5kIHRoZSBwYXRoIHN0cmluZ1xuICAgICAgICAgICAgZmlsZXoyLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICAgICAgICAgIGluZm86IGF3YWl0IGRvY3VtZW50cy5maW5kKGVudHJ5LnZwYXRoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYG5ld2VycmVuZGVyIGZpbGV6MiBhZnRlciBpZ25vcmUgJHtmaWxlejIubGVuZ3RofWApO1xuXG5cbiAgICAvLyAzLiBNYWtlIGEgZmFzdHEgdG8gcHJvY2VzcyB1c2luZyByZW5kZXJEb2N1bWVudCxcbiAgICAvLyAgICBwdXNoaW5nIHJlc3VsdHMgdG8gdGhlIHJlc3VsdHMgYXJyYXlcblxuICAgIC8vIFRoaXMgc2V0cyB1cCB0aGUgcXVldWUgcHJvY2Vzc29yXG4gICAgLy8gVGhlIGNvbmN1cnJlbmN5IHNldHRpbmcgbGV0cyB1cyBwcm9jZXNzIGRvY3VtZW50c1xuICAgIC8vIGluIHBhcmFsbGVsIHdoaWxlIGxpbWl0aW5nIHRvdGFsIGltcGFjdC5cbiAgICBjb25zdCBxdWV1ZTogcXVldWVBc1Byb21pc2VkPHtcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgIH0+ID0gZmFzdHEucHJvbWlzZShcblxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgZm9yIGVhY2ggZW50cnkgaW4gdGhlXG4gICAgICAgIC8vIHF1ZXVlLiBJdCBoYW5kbGVzIHJlbmRlcmluZyB0aGUgcXVldWVcbiAgICAgICAgLy8gVGhlIHF1ZXVlIGhhcyBjb25maWcgb2JqZWN0cyBhbmQgcGF0aCBzdHJpbmdzXG4gICAgICAgIC8vIHdoaWNoIGlzIGV4YWN0bHkgd2hhdCdzIHJlcXVpcmVkIGJ5XG4gICAgICAgIC8vIHJlbmRlckRvY3VtZW50XG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50SW5RdWV1ZShlbnRyeSlcbiAgICAgICAgICAgIDogUHJvbWlzZTx7IHJlc3VsdD86IGFueTsgZXJyb3I/OiBhbnk7IH0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVuZGVyRG9jdW1lbnQoXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5LmNvbmZpZywgZW50cnkuaW5mb1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYERPTkUgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHJlc3VsdCB9O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgRVJST1IgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZXJyb3IgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnLmNvbmN1cnJlbmN5KTtcblxuICAgIC8vIHF1ZXVlLnB1c2ggcmV0dXJucyBhIFByb21pc2UgdGhhdCdzIGZ1bGZpbGxlZCB3aGVuXG4gICAgLy8gdGhlIHRhc2sgZmluaXNoZXMuXG4gICAgLy8gSGVuY2Ugd2FpdEZvciBpcyBhbiBhcnJheSBvZiBQcm9taXNlcy5cbiAgICBjb25zdCB3YWl0Rm9yID0gW107XG4gICAgZm9yIChsZXQgZW50cnkgb2YgZmlsZXoyKSB7XG4gICAgICAgIHdhaXRGb3IucHVzaChxdWV1ZS5wdXNoKGVudHJ5KSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBhdXRvbWF0aWNhbGx5IHdhaXRzIGZvciBhbGwgdGhvc2VcbiAgICAvLyBQcm9taXNlcyB0byByZXNvbHZlLCB3aGlsZSBtYWtpbmcgdGhlIHJlc3VsdHNcbiAgICAvLyBhcnJheSBjb250YWluIHJlc3VsdHMuXG4gICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgIH1cblxuICAgIC8vIDQuIEludm9rZSBob29rU2l0ZVJlbmRlcmVkXG5cbiAgICB0cnkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnSW52b2tpbmcgaG9va1NpdGVSZW5kZXJlZCcpO1xuICAgICAgICBhd2FpdCBjb25maWcuaG9va1NpdGVSZW5kZXJlZCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBob29rU2l0ZVJlbmRlcmVkIGZhaWxlZCBiZWNhdXNlICR7ZX1gKTtcbiAgICB9XG5cbiAgICAvLyA1LiByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiByZXN1bHRzO1xufTtcblxuLyoqXG4gKiBSZW5kZXIgYWxsIHRoZSBkb2N1bWVudHMgaW4gYSBzaXRlIHVzaW5nIHJlbmRlckRvY3VtZW50MixcbiAqIGxpbWl0aW5nIHRoZSBudW1iZXIgb2Ygc2ltdWx0YW5lb3VzIHJlbmRlcmluZyB0YXNrc1xuICogdG8gdGhlIG51bWJlciBpbiBjb25maWcuY29uY3VycmVuY3kuXG4gKiBcbiAqIFJldHVybnMgc3RydWN0dXJlZCBSZW5kZXJpbmdSZXN1bHRzIGRhdGEgaW5zdGVhZCBvZiB0ZXh0IHN0cmluZ3MuXG4gKlxuICogQHBhcmFtIGNvbmZpZ1xuICogQHJldHVybnMgQXJyYXkgb2YgUmVuZGVyaW5nUmVzdWx0cyB3aXRoIHBlcmZvcm1hbmNlIGFuZCBlcnJvciBkYXRhXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXIyKGNvbmZpZyk6IFByb21pc2U8QXJyYXk8UmVuZGVyaW5nUmVzdWx0cz4+IHtcblxuICAgIGNvbnN0IGRvY3VtZW50cyA9IDxEb2N1bWVudHNDYWNoZT5jb25maWcuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdDQUxMSU5HIGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgYXdhaXQgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKTtcbiAgICBcbiAgICAvLyAxLiBHYXRoZXIgbGlzdCBvZiBmaWxlcyBmcm9tIFJlbmRlckZpbGVDYWNoZVxuICAgIGNvbnN0IGZpbGV6ID0gYXdhaXQgZG9jdW1lbnRzLnBhdGhzKCk7XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjIgZmlsZXogJHtmaWxlei5sZW5ndGh9YCk7XG5cbiAgICAvLyAyLiBFeGNsdWRlIGFueSB0aGF0IHdlIHdhbnQgdG8gaWdub3JlXG4gICAgY29uc3QgZmlsZXoyID0gW10gYXMgQXJyYXk8e1xuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgfT47XG4gICAgZm9yIChsZXQgZW50cnkgb2YgZmlsZXopIHtcbiAgICAgICAgbGV0IGluY2x1ZGUgPSB0cnVlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlbnRyeSk7XG4gICAgICAgIGxldCBzdGF0cztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0YXRzID0gYXdhaXQgZnNwLnN0YXQoZW50cnkuZnNwYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7IHN0YXRzID0gdW5kZWZpbmVkOyB9XG4gICAgICAgIGlmICghZW50cnkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgZWxzZSBpZiAoIXN0YXRzIHx8IHN0YXRzLmlzRGlyZWN0b3J5KCkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gVGhpcyBzaG91bGQgYXJpc2UgdXNpbmcgYW4gaWdub3JlIGNsYXVzZVxuICAgICAgICAvLyBlbHNlIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LnZwYXRoKSA9PT0gJy5EU19TdG9yZScpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcucGxhY2Vob2xkZXInKSBpbmNsdWRlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGluY2x1ZGUpIHtcbiAgICAgICAgICAgIC8vIFRoZSBxdWV1ZSBpcyBhbiBhcnJheSBvZiB0dXBsZXMgY29udGFpbmluZyB0aGVcbiAgICAgICAgICAgIC8vIGNvbmZpZyBvYmplY3QgYW5kIHRoZSBwYXRoIHN0cmluZ1xuICAgICAgICAgICAgZmlsZXoyLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICAgICAgICAgIGluZm86IGF3YWl0IGRvY3VtZW50cy5maW5kKGVudHJ5LnZwYXRoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjIgZmlsZXoyIGFmdGVyIGlnbm9yZSAke2ZpbGV6Mi5sZW5ndGh9YCk7XG5cbiAgICAvLyAzLiBNYWtlIGEgZmFzdHEgdG8gcHJvY2VzcyB1c2luZyByZW5kZXJEb2N1bWVudDIsXG4gICAgLy8gICAgcHVzaGluZyByZXN1bHRzIHRvIHRoZSByZXN1bHRzIGFycmF5XG5cbiAgICAvLyBUaGlzIHNldHMgdXAgdGhlIHF1ZXVlIHByb2Nlc3NvclxuICAgIC8vIFRoZSBjb25jdXJyZW5jeSBzZXR0aW5nIGxldHMgdXMgcHJvY2VzcyBkb2N1bWVudHNcbiAgICAvLyBpbiBwYXJhbGxlbCB3aGlsZSBsaW1pdGluZyB0b3RhbCBpbXBhY3QuXG4gICAgY29uc3QgcXVldWU6IHF1ZXVlQXNQcm9taXNlZDx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PiA9IGZhc3RxLnByb21pc2UoXG5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIGZvciBlYWNoIGVudHJ5IGluIHRoZVxuICAgICAgICAvLyBxdWV1ZS4gSXQgaGFuZGxlcyByZW5kZXJpbmcgdGhlIHF1ZXVlXG4gICAgICAgIC8vIFRoZSBxdWV1ZSBoYXMgY29uZmlnIG9iamVjdHMgYW5kIHBhdGggc3RyaW5nc1xuICAgICAgICAvLyB3aGljaCBpcyBleGFjdGx5IHdoYXQncyByZXF1aXJlZCBieVxuICAgICAgICAvLyByZW5kZXJEb2N1bWVudDJcbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnQySW5RdWV1ZShlbnRyeSlcbiAgICAgICAgICAgIDogUHJvbWlzZTxSZW5kZXJpbmdSZXN1bHRzPlxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQySW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudDIoXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5LmNvbmZpZywgZW50cnkuaW5mb1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYERPTkUgcmVuZGVyRG9jdW1lbnQySW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEVSUk9SIHJlbmRlckRvY3VtZW50MkluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWAsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb25maWcuY29uY3VycmVuY3kpO1xuXG4gICAgLy8gcXVldWUucHVzaCByZXR1cm5zIGEgUHJvbWlzZSB0aGF0J3MgZnVsZmlsbGVkIHdoZW5cbiAgICAvLyB0aGUgdGFzayBmaW5pc2hlcy5cbiAgICAvLyBIZW5jZSB3YWl0Rm9yIGlzIGFuIGFycmF5IG9mIFByb21pc2VzLlxuICAgIGNvbnN0IHdhaXRGb3IgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxlejIpIHtcbiAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGF1dG9tYXRpY2FsbHkgd2FpdHMgZm9yIGFsbCB0aG9zZVxuICAgIC8vIFByb21pc2VzIHRvIHJlc29sdmUsIHdoaWxlIG1ha2luZyB0aGUgcmVzdWx0c1xuICAgIC8vIGFycmF5IGNvbnRhaW4gcmVzdWx0cy5cbiAgICBjb25zdCByZXN1bHRzOiBBcnJheTxSZW5kZXJpbmdSZXN1bHRzPiA9IFtdO1xuICAgIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgIH1cblxuICAgIC8vIDQuIEludm9rZSBob29rU2l0ZVJlbmRlcmVkXG5cbiAgICB0cnkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnSW52b2tpbmcgaG9va1NpdGVSZW5kZXJlZCcpO1xuICAgICAgICBhd2FpdCBjb25maWcuaG9va1NpdGVSZW5kZXJlZCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBob29rU2l0ZVJlbmRlcmVkIGZhaWxlZCBiZWNhdXNlICR7ZX1gKTtcbiAgICB9XG5cbiAgICAvLyA1LiByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiByZXN1bHRzO1xufTtcbiJdfQ==