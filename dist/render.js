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
        context: {
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
        const mahametadata = {};
        for (var yprop in docInfo.metadata) {
            mahametadata[yprop] = docInfo.metadata[yprop];
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUVsQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFVMUIsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBK0M5QyxTQUFTLG1CQUFtQixDQUN4QixNQUFxQixFQUNyQixPQUFPO0lBRVAsTUFBTSxHQUFHLEdBQWtCO1FBQ3ZCLE1BQU07UUFFTixPQUFPLEVBQW9CO1lBQ3ZCLE1BQU0sRUFBRSxPQUFPLENBQUMsS0FBSztZQUNyQixPQUFPLEVBQUUsT0FBTyxDQUFDLFVBQVU7WUFDM0IsSUFBSSxFQUFFLE9BQU8sQ0FBQyxPQUFPO1lBQ3JCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtTQUM3QjtRQUVELFFBQVEsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQ2pCLE9BQU8sQ0FBQyxLQUFLLENBQzVCO1FBRUQsT0FBTztRQUNQLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztRQUNwQixVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVU7UUFDOUIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1FBQzlCLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTtRQUV6QixPQUFPLEVBQW9CO1lBQ3ZCLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztZQUNwQixVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVU7WUFDOUIsV0FBVyxFQUFFLFdBQVcsQ0FBQyxH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WUFDekUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2IsK0VBQStFO1lBQy9FLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDO0lBQ0wsQ0FBQyxFQUNELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUV4QixxREFBcUQ7SUFDckQscUJBQXFCO0lBQ3JCLHlDQUF5QztJQUN6QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDbkIsS0FBSyxJQUFJLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQseUNBQXlDO0lBQ3pDLGdEQUFnRDtJQUNoRCx5QkFBeUI7SUFDekIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLEtBQUssSUFBSSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7UUFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLE1BQU0sQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRCw2QkFBNkI7SUFFN0IsSUFBSSxDQUFDO1FBQ0QsNENBQTRDO1FBQzVDLE1BQU0sTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDcEMsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxvQkFBb0I7SUFDcEIsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQztBQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCAqIGFzIGRhdGEgZnJvbSAnLi9kYXRhLmpzJztcbmltcG9ydCBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcblxuaW1wb3J0IGZhc3RxIGZyb20gJ2Zhc3RxJztcbmltcG9ydCB0eXBlIHsgcXVldWVBc1Byb21pc2VkIH0gZnJvbSBcImZhc3RxXCI7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uIH0gZnJvbSAnLi9pbmRleC5qcyc7XG5pbXBvcnQgeyBSZW5kZXJlciwgUmVuZGVyaW5nQ29udGV4dCB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCB7XG4gICAgRG9jdW1lbnRzQ2FjaGVcbn0gZnJvbSAnLi9jYWNoZS9jYWNoZS1zcWxpdGUuanMnO1xuaW1wb3J0IHtcbiAgICBEb2N1bWVudFxufSBmcm9tICcuL2NhY2hlL3NjaGVtYS5qcyc7XG5pbXBvcnQgeyBwZXJmb3JtYW5jZSB9IGZyb20gJ25vZGU6cGVyZl9ob29rcyc7XG5cbi8vIEZvciBodHRwczovL2dpdGh1Yi5jb20vYWthc2hhY21zL2FrYXNoYXJlbmRlci9pc3N1ZXMvMTAzXG4vLyBUaGUgaWRlYSBpcyBub3JtYWxpemluZyB0aGUgZGF0YSByZXR1cm5lZC4gIFRoaXMgc2hvdWxkXG4vLyBlbGltaW5hdGUgdGhlIG5lZWQgZm9yIHRoZSBkYXRhIG1vZHVsZS4gIFRoaXMgc2hvdWxkXG4vLyBpbXByb3ZlIHRoZSBhbmFseXplYWJpbGl0eSBvZiBkYXRhIGFib3V0IHRoZSByZW5kZXJpbmcgcHJvY2Vzcy5cblxudHlwZSBSZW5kZXJpbmdSZXN1bHRzID0ge1xuXG4gICAgdnBhdGg/OiBzdHJpbmc7XG4gICAgcmVuZGVyUGF0aD86IHN0cmluZztcblxuICAgIHJlbmRlckZvcm1hdDogc3RyaW5nO1xuXG4gICAgcmVuZGVyU3RhcnQ/OiBudW1iZXI7XG5cbiAgICByZW5kZXJGaXJzdFN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlckZpcnN0RW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyTGF5b3V0U3RhcnQ/OiBudW1iZXI7XG4gICAgcmVuZGVyTGF5b3V0RW5kPzogbnVtYmVyO1xuXG4gICAgcmVuZGVyTWFoYVN0YXJ0PzogbnVtYmVyO1xuICAgIHJlbmRlck1haGFFbmQ/OiBudW1iZXI7XG59O1xuXG4vLyBDb2xsZWN0IGFsbCByZXF1aXJlZCBkYXRhIGluIGFuIGluc3RhbmNlIG9mIHRoaXMgb2JqZWN0LlxudHlwZSBSZW5kZXJpbmdEYXRhID0ge1xuICAgIGNvbmZpZz86IENvbmZpZ3VyYXRpb247XG4gICAgY29udGV4dD86IFJlbmRlcmluZ0NvbnRleHQ7XG4gICAgcmVuZGVyZXI/OiBSZW5kZXJlcjtcblxuICAgIGRvY0luZm8/OiBhbnk7XG5cbiAgICB2cGF0aD86IHN0cmluZztcbiAgICByZW5kZXJQYXRoPzogc3RyaW5nO1xuICAgIG1vdW50UG9pbnQ/OiBzdHJpbmc7XG4gICAgcmVuZGVyVG8/OiBzdHJpbmc7XG5cbiAgICByZW5kZXJlZEZpcnN0Pzogc3RyaW5nO1xuXG4gICAgbGF5b3V0Rm9ybWF0Pzogc3RyaW5nO1xuICAgIHJlbmRlcmVkTGF5b3V0Pzogc3RyaW5nO1xuXG4gICAgcmVzdWx0cz86IFJlbmRlcmluZ1Jlc3VsdHM7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVSZW5kZXJpbmdEYXRhKFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvXG4pIHtcbiAgICBjb25zdCByZXQgPSA8UmVuZGVyaW5nRGF0YT57XG4gICAgICAgIGNvbmZpZyxcblxuICAgICAgICBjb250ZXh0OiA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgICAgICBmc3BhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBkb2NJbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogZG9jSW5mby5tZXRhZGF0YVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlcmVyOiBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGhcbiAgICAgICAgKSxcblxuICAgICAgICBkb2NJbmZvLFxuICAgICAgICB2cGF0aDogZG9jSW5mby52cGF0aCxcbiAgICAgICAgcmVuZGVyUGF0aDogZG9jSW5mby5yZW5kZXJQYXRoLFxuICAgICAgICBtb3VudFBvaW50OiBkb2NJbmZvLm1vdW50UG9pbnQsXG4gICAgICAgIHJlbmRlclRvOiBjb25maWcucmVuZGVyVG8sXG5cbiAgICAgICAgcmVzdWx0czogPFJlbmRlcmluZ1Jlc3VsdHM+e1xuICAgICAgICAgICAgdnBhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBkb2NJbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJTdGFydDogcGVyZm9ybWFuY2Uubm93KCksXG4gICAgICAgIH1cbiAgICB9O1xuICAgIGlmIChyZXQucmVuZGVyZXIpIHtcbiAgICAgICAgcmV0LnJlc3VsdHMucmVuZGVyRm9ybWF0ID0gcmV0LnJlbmRlcmVyLnJlbmRlckZvcm1hdChyZXQuY29udGV4dCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBUaGUgY29yZSBwYXJ0IG9mIHJlbmRlcmluZyBjb250ZW50IHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBUaGlzIGZ1bmN0aW9uIGxvb2tzIGZvciB0aGUgcmVuZGVyZXIsIGFuZCBpZiBub25lIGlzXG4gKiBmb3VuZCBpdCBzaW1wbHkgcmV0dXJucy4gIEl0IHRoZW4gZG9lcyBhIGxpdHRsZSBzZXR1cFxuICogdG8gdGhlIG1ldGFkYXRhIG9iamVjdCwgYW5kIGNhbGxzIHRoZSByZW5kZXIgZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0gY29uZmlnIC0gQWthc2hhQ01TIENvbmZpZ3VyYXRpb25cbiAqIEBwYXJhbSByYyAtIFJlbmRlcmluZ0NvbnRleHQgZm9yIHVzZSB3aXRoIFJlbmRlcmVyc1xuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJDb250ZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICByYzogUmVuZGVyaW5nQ29udGV4dFxuKVxuICAgIC8vIFRoZSByZXR1cm4gaXMgYSBzaW1wbGUgb2JqZWN0XG4gICAgLy8gY29udGFpbmluZyB1c2VmdWwgZGF0YVxuICAgIDogUHJvbWlzZTx7XG4gICAgICAgIHJlbmRlcmVyTmFtZT86IHN0cmluZyxcbiAgICAgICAgZm9ybWF0Pzogc3RyaW5nLFxuICAgICAgICByZW5kZXJlZDogc3RyaW5nXG4gICAgfT5cbntcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ29udGVudCBgLCByYyk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgcmMuZnNwYXRoXG4gICAgKTtcbiAgICBpZiAoIXJlbmRlcmVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZW5kZXJlck5hbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGZvcm1hdDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcmVuZGVyZWQ6IHJjLmJvZHlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBBZGQgbmVjZXNzYXJ5IGl0ZW1zIHRvIHRoZSBtZXRhZGF0YVxuICAgIHJjLm1ldGFkYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIHJjLm1ldGFkYXRhLnBhcnRpYWxTeW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgIHJjLm1ldGFkYXRhLnBsdWdpbiA9IGNvbmZpZy5wbHVnaW47XG5cbiAgICAvLyBSZW5kZXIgdGhlIHByaW1hcnkgY29udGVudFxuICAgIGxldCBkb2NyZW5kZXJlZCA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihyYyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ29udGVudCByZW5kZXJlZD1gLCBkb2NyZW5kZXJlZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyZXJOYW1lOiByZW5kZXJlci5uYW1lLFxuICAgICAgICBmb3JtYXQ6IHJlbmRlcmVyLnJlbmRlckZvcm1hdChyYyksXG4gICAgICAgIHJlbmRlcmVkOiBkb2NyZW5kZXJlZFxuICAgIH07XG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gYW5kIHRoZSBuZXh0IGV4aXN0IHNvbGVseSB0b1xuLy8gc2ltcGxpZnkgcmVuZGVyRG9jdW1lbnQuXG5cbmFzeW5jIGZ1bmN0aW9uIHdyaXRlQ1NTdG9PdXRwdXQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm8sXG4gICAgZG9jUmVuZGVyZWQsXG4gICAgcmVuZGVyU3RhcnQ6IERhdGVcbikge1xuXG4gICAgY29uc3QgcmVuZGVyVG9GcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgY29uc3QgcmVuZGVyVG9EaXIgPSBwYXRoLmRpcm5hbWUocmVuZGVyVG9GcGF0aCk7XG4gICAgYXdhaXQgZnNwLm1rZGlyKHJlbmRlclRvRGlyLCB7XG4gICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlclRvRnBhdGgsIGRvY1JlbmRlcmVkLCAndXRmOCcpO1xuICAgIGNvbnN0IHJlbmRlckVuZFJlbmRlcmVkID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBkYXRhLnJlcG9ydChcbiAgICAgICAgZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb25maWcucmVuZGVyVG8sXG4gICAgICAgIFwiUkVOREVSRURcIiwgcmVuZGVyU3RhcnQpO1xuICAgIHJldHVybiBgQ1NTICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7ZG9jSW5mby5yZW5kZXJQYXRofSAoJHsocmVuZGVyRW5kUmVuZGVyZWQudmFsdWVPZigpIC0gcmVuZGVyU3RhcnQudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHMpXFxuJHthd2FpdCBkYXRhLmRhdGE0ZmlsZShkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgpfWA7XG5cbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weUFzc2V0VG9PdXRwdXQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm8sXG4gICAgZG9jUmVuZGVyZWQsXG4gICAgcmVuZGVyU3RhcnQ6IERhdGVcbikge1xuXG4gICAgY29uc3QgcmVuZGVyVG9GcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgY29uc3QgcmVuZGVyVG9EaXIgPSBwYXRoLmRpcm5hbWUocmVuZGVyVG9GcGF0aCk7XG4gICAgYXdhaXQgZnNwLm1rZGlyKHJlbmRlclRvRGlyLCB7XG4gICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICBhd2FpdCBmc3AuY29weUZpbGUoZG9jSW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJUb0ZwYXRoKTtcbiAgICAvLyBjb25zb2xlLmxvZyhgQ09QSUVEICR7ZG9jSW5mby5wYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofWApO1xuICAgIGNvbnN0IHJlbmRlckVuZENvcGllZCA9IG5ldyBEYXRlKCk7XG4gICAgcmV0dXJuIGBDT1BZICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH0gKCR7KHJlbmRlckVuZENvcGllZC52YWx1ZU9mKCkgLSByZW5kZXJTdGFydC52YWx1ZU9mKCkpIC8gMTAwMH0gc2Vjb25kcylgO1xufVxuXG4vKipcbiAqIFJlbmRlciBhIGRvY3VtZW50LCBhY2NvdW50aW5nIGZvciB0aGUgbWFpbiBjb250ZW50LFxuICogYSBsYXlvdXQgdGVtcGxhdGUgKGlmIGFueSksIGFuZCBNYWhhYmh1dGEgKGlmIHRoZSBjb250ZW50XG4gKiBvdXRwdXQgaXMgSFRNTCkuICBUaGlzIGFsc28gaGFuZGxlcyByZW5kZXJpbmcgb3RoZXIgdHlwZXNcbiAqIG9mIGNvbnRlbnQgc3VjaCBhcyBMRVNTIENTUyBmaWxlcy5cbiAqXG4gKiBAcGFyYW0gY29uZmlnIFxuICogQHBhcmFtIGRvY0luZm8gXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvXG4pOiBQcm9taXNlPHN0cmluZz5cbntcbiAgICBjb25zdCByZW5kZXJTdGFydCA9IG5ldyBEYXRlKCk7XG5cbiAgICAvLyBSZW5kZXIgdGhlIG1haW4gY29udGVudFxuXG4gICAgaWYgKHR5cGVvZiBkb2NJbmZvLmRvY0NvbnRlbnQgIT09ICdzdHJpbmcnXG4gICAgIHx8IHR5cGVvZiBkb2NJbmZvLmRvY0JvZHkgIT09ICdzdHJpbmcnXG4gICAgKSB7XG4gICAgICAgIC8vIGNvbnNvbGUud2FybihgTm8gY29udGVudCB0byByZW5kZXIgZm9yIGAsIGRvY0luZm8pO1xuICAgIH1cblxuICAgIGNvbnN0IHJjID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICBmc3BhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgIGNvbnRlbnQ6IGRvY0luZm8uZG9jQ29udGVudCxcbiAgICAgICAgYm9keTogZG9jSW5mby5kb2NCb2R5LFxuICAgICAgICBtZXRhZGF0YTogZG9jSW5mby5tZXRhZGF0YVxuICAgIH07XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgY29udGV4dD0gJHtyYy5mc3BhdGh9YCwgcmMpO1xuXG4gICAgbGV0IGRvY0Zvcm1hdDsgICAgICAvLyBLbm93aW5nIHRoZSBmb3JtYXQgXG4gICAgbGV0IGRvY1JlbmRlcmVkO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckNvbnRlbnQoY29uZmlnLCByYyk7XG4gICAgICAgIGRvY0Zvcm1hdCA9IHJlc3VsdC5mb3JtYXQ7XG4gICAgICAgIGRvY1JlbmRlcmVkID0gcmVzdWx0LnJlbmRlcmVkO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSAkeyhlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnIpfWApO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9ICR7KGVyci5zdGFjayA/IGVyci5zdGFjayA6IGVycil9YCk7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCAke2RvY0Zvcm1hdH0gJHtkb2NJbmZvLnZwYXRofSByZW5kZXJlZD1gLCBkb2NSZW5kZXJlZCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoZG9jSW5mby5tb3VudFBvaW50LCBcbiAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICBcIkZJUlNUIFJFTkRFUlwiLCByZW5kZXJTdGFydCk7XG5cbiAgICAvLyBIYW5kbGUgdGhlc2UgY2FzZXMgdXAgZnJvbnQgc28gdGhhdCB0aGUgcmVtYWluaW5nXG4gICAgLy8gY29kZSBjYW4gYmUgY2xlYW5lciBhbmQgZm9jdXMgb24gSFRNTCBsYXlvdXQgcmVuZGVyaW5nLlxuXG4gICAgaWYgKGRvY0Zvcm1hdCA9PT0gJ0NTUycpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB3cml0ZUNTU3RvT3V0cHV0KGNvbmZpZywgZG9jSW5mbywgZG9jUmVuZGVyZWQsIHJlbmRlclN0YXJ0KTtcbiAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluIFJFTkRFUiBDU1MgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW4gUkVOREVSIENTUyBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRvY0Zvcm1hdCAhPT0gJ0hUTUwnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb3B5QXNzZXRUb091dHB1dChjb25maWcsIGRvY0luZm8sIGRvY1JlbmRlcmVkLCByZW5kZXJTdGFydCk7XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbiBjb3B5IGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluIGNvcHkgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbmRlciB0aGUgbWFpbiBjb250ZW50IGludG8gYSBsYXlvdXQgdGVtcGxhdGUsXG4gICAgLy8gaWYgb25lIGlzIHNwZWNpZmllZFxuXG4gICAgbGV0IGxheW91dEZvcm1hdDtcbiAgICBsZXQgbGF5b3V0UmVuZGVyZWQ7XG4gICAgbGV0IHJlc3VsdDtcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgbGF5b3V0ICR7ZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gZG9jTWV0YWRhdGEgJHt1dGlsLmluc3BlY3QoZG9jSW5mby5kb2NNZXRhZGF0YSl9IG1ldGFkYXRhICR7dXRpbC5pbnNwZWN0KGRvY0luZm8ubWV0YWRhdGEpfWApO1xuICAgIGlmIChkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0KSB7XG5cbiAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgbGF5b3V0cy5pc1JlYWR5KCk7XG5cbiAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgbGF5b3V0cy5maW5kKGRvY0luZm8ubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBsYXlvdXQgZm91bmQgaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLmxheW91dERpcnMpfSBmb3IgJHtkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSBpbiBmaWxlICR7ZG9jSW5mby52cGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJjTGF5b3V0ID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBkb2NJbmZvLm1ldGFkYXRhLmxheW91dCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGZvdW5kLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBmb3VuZC5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IHt9XG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIGZvdW5kLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICByY0xheW91dC5tZXRhZGF0YVt5cHJvcF0gPSBmb3VuZC5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgeXByb3AgaW4gZG9jSW5mby5tZXRhZGF0YSkge1xuICAgICAgICAgICAgaWYgKHlwcm9wICE9PSAnbGF5b3V0Jykge1xuICAgICAgICAgICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhW3lwcm9wXSA9IGRvY0luZm8ubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhLmNvbnRlbnQgPSBkb2NSZW5kZXJlZDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgICAgICAgICAgPSBhd2FpdCByZW5kZXJDb250ZW50KGNvbmZpZywgcmNMYXlvdXQpO1xuICAgICAgICAgICAgbGF5b3V0Rm9ybWF0ID0gcmVzdWx0LmZvcm1hdDtcbiAgICAgICAgICAgIGxheW91dFJlbmRlcmVkID0gcmVzdWx0LnJlbmRlcmVkO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBsZXQgZWUgPSBuZXcgRXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9IHdpdGggJHtkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSAke2Uuc3RhY2sgPyBlLnN0YWNrIDogZX1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZWUpO1xuICAgICAgICAgICAgdGhyb3cgZWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBsYXlvdXRGb3JtYXQgPSBkb2NGb3JtYXQ7XG4gICAgICAgIGxheW91dFJlbmRlcmVkID0gZG9jUmVuZGVyZWQ7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50ICR7ZG9jSW5mby52cGF0aH0gYWZ0ZXIgbGF5b3V0IHJlbmRlciBmb3JtYXQgJHtsYXlvdXRGb3JtYXR9IGAsIHJlc3VsdCk7XG5cbiAgICBjb25zdCByZW5kZXJTZWNvbmRSZW5kZXIgPSBuZXcgRGF0ZSgpO1xuICAgIGF3YWl0IGRhdGEucmVwb3J0KGRvY0luZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLnZwYXRoLCBjb25maWcucmVuZGVyVG8sIFxuICAgICAgICAgICAgICAgICAgICAgIFwiU0VDT05EIFJFTkRFUlwiLFxuICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclN0YXJ0KTtcblxuICAgIFxuICAgIC8vIE5leHQgc3RlcCBpcyB0byBydW4gTWFoYWJodXRhIG9uIHRoZSByZW5kZXJlZCBjb250ZW50XG4gICAgLy8gT2YgY291cnNlLCBNYWhhYmh1dGEgaXMgbm90IGFwcHJvcHJpYXRlIGZvciBldmVyeXRoaW5nXG4gICAgLy8gYmVjYXVzZSBub3QgZXZlcnl0aGluZyBpcyBIVE1MXG5cbiAgICB0cnkge1xuXG4gICAgICAgIGNvbnN0IG1haGFtZXRhZGF0YTogYW55ID0ge307XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIGRvY0luZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIG1haGFtZXRhZGF0YVt5cHJvcF0gPSBkb2NJbmZvLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBtYWhhbWV0YWRhdGEuY29udGVudCA9IGRvY1JlbmRlcmVkO1xuXG4gICAgICAgIGlmIChkb2NJbmZvPy5tZXRhZGF0YT8uY29uZmlnPy5tYWhhYmh1dGFDb25maWcpIHtcbiAgICAgICAgICAgIG1haGFiaHV0YS5jb25maWcoZG9jSW5mbz8ubWV0YWRhdGE/LmNvbmZpZz8ubWFoYWJodXRhQ29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgbWFoYW1ldGFkYXRhYCwgbWFoYW1ldGFkYXRhKTtcbiAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSBhd2FpdCBtYWhhYmh1dGEucHJvY2Vzc0FzeW5jKFxuICAgICAgICAgICAgbGF5b3V0UmVuZGVyZWQsIG1haGFtZXRhZGF0YSxcbiAgICAgICAgICAgIGNvbmZpZy5tYWhhZnVuY3NcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBPTEQgZG9jcmVuZGVyZWQgPSBhd2FpdCB0aGlzLm1haGFydW4obGF5b3V0cmVuZGVyZWQsIGRvY2RhdGEsIGNvbmZpZy5tYWhhZnVuY3MpO1xuICAgIH0gY2F0Y2ggKGUyKSB7XG4gICAgICAgIGxldCBlZWUgPSBuZXcgRXJyb3IoYEVycm9yIHdpdGggTWFoYWJodXRhICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9ICR7ZTIuc3RhY2sgPyBlMi5zdGFjayA6IGUyfWApO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVlZSk7XG4gICAgICAgIHRocm93IGVlZTtcbiAgICB9XG5cbiAgICBhd2FpdCBkYXRhLnJlcG9ydChkb2NJbmZvLm1vdW50UG9pbnQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICAgICBcIk1BSEFCSFVUQVwiLCByZW5kZXJTdGFydCk7XG5cbiAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlckRlc3QpLCB7XG4gICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgIH0pO1xuICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyRGVzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dFJlbmRlcmVkLCAndXRmLTgnKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGBSRU5ERVJFRCAke3JlbmRlcmVyLm5hbWV9ICR7ZG9jSW5mby5wYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofWApO1xuICAgIGNvbnN0IHJlbmRlckVuZFJlbmRlcmVkID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBkYXRhLnJlcG9ydChcbiAgICAgICAgZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb25maWcucmVuZGVyVG8sXG4gICAgICAgIFwiUkVOREVSRURcIiwgcmVuZGVyU3RhcnQpO1xuICAgIHJldHVybiBgJHtsYXlvdXRGb3JtYXR9ICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7ZG9jSW5mby5yZW5kZXJQYXRofSAoJHsocmVuZGVyRW5kUmVuZGVyZWQudmFsdWVPZigpIC0gcmVuZGVyU3RhcnQudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHMpXFxuJHthd2FpdCBkYXRhLmRhdGE0ZmlsZShkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgpfWA7XG5cbn1cblxuLyoqXG4gKiBSZW5kZXIgYWxsIHRoZSBkb2N1bWVudHMgaW4gYSBzaXRlLCBsaW1pdGluZ1xuICogdGhlIG51bWJlciBvZiBzaW11bHRhbmVvdXMgcmVuZGVyaW5nIHRhc2tzXG4gKiB0byB0aGUgbnVtYmVyIGluIGNvbmZpZy5jb25jdXJyZW5jeS5cbiAqXG4gKiBAcGFyYW0gY29uZmlnXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyKGNvbmZpZykge1xuXG4gICAgY29uc3QgZG9jdW1lbnRzID0gPERvY3VtZW50c0NhY2hlPmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIC8vIGF3YWl0IGRvY3VtZW50cy5pc1JlYWR5KCk7XG4gICAgLy8gY29uc29sZS5sb2coJ0NBTExJTkcgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQnKTtcbiAgICBhd2FpdCBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCgpO1xuICAgIFxuICAgIC8vIDEuIEdhdGhlciBsaXN0IG9mIGZpbGVzIGZyb20gUmVuZGVyRmlsZUNhY2hlXG4gICAgY29uc3QgZmlsZXogPSBhd2FpdCBkb2N1bWVudHMucGF0aHMoKTtcbiAgICAvLyBjb25zb2xlLmxvZyhgbmV3ZXJyZW5kZXIgZmlsZXogJHtmaWxlei5sZW5ndGh9YCk7XG5cbiAgICAvLyAyLiBFeGNsdWRlIGFueSB0aGF0IHdlIHdhbnQgdG8gaWdub3JlXG4gICAgY29uc3QgZmlsZXoyID0gW10gYXMgQXJyYXk8e1xuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgfT47XG4gICAgZm9yIChsZXQgZW50cnkgb2YgZmlsZXopIHtcbiAgICAgICAgbGV0IGluY2x1ZGUgPSB0cnVlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhlbnRyeSk7XG4gICAgICAgIGxldCBzdGF0cztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0YXRzID0gYXdhaXQgZnNwLnN0YXQoZW50cnkuZnNwYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7IHN0YXRzID0gdW5kZWZpbmVkOyB9XG4gICAgICAgIGlmICghZW50cnkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgZWxzZSBpZiAoIXN0YXRzIHx8IHN0YXRzLmlzRGlyZWN0b3J5KCkpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gVGhpcyBzaG91bGQgYXJpc2UgdXNpbmcgYW4gaWdub3JlIGNsYXVzZVxuICAgICAgICAvLyBlbHNlIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LnZwYXRoKSA9PT0gJy5EU19TdG9yZScpIGluY2x1ZGUgPSBmYWxzZTtcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcucGxhY2Vob2xkZXInKSBpbmNsdWRlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGluY2x1ZGUpIHtcbiAgICAgICAgICAgIC8vIFRoZSBxdWV1ZSBpcyBhbiBhcnJheSBvZiB0dXBsZXMgY29udGFpbmluZyB0aGVcbiAgICAgICAgICAgIC8vIGNvbmZpZyBvYmplY3QgYW5kIHRoZSBwYXRoIHN0cmluZ1xuICAgICAgICAgICAgZmlsZXoyLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnLFxuICAgICAgICAgICAgICAgIGluZm86IGF3YWl0IGRvY3VtZW50cy5maW5kKGVudHJ5LnZwYXRoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYG5ld2VycmVuZGVyIGZpbGV6MiBhZnRlciBpZ25vcmUgJHtmaWxlejIubGVuZ3RofWApO1xuXG5cbiAgICAvLyAzLiBNYWtlIGEgZmFzdHEgdG8gcHJvY2VzcyB1c2luZyByZW5kZXJEb2N1bWVudCxcbiAgICAvLyAgICBwdXNoaW5nIHJlc3VsdHMgdG8gdGhlIHJlc3VsdHMgYXJyYXlcblxuICAgIC8vIFRoaXMgc2V0cyB1cCB0aGUgcXVldWUgcHJvY2Vzc29yXG4gICAgLy8gVGhlIGNvbmN1cnJlbmN5IHNldHRpbmcgbGV0cyB1cyBwcm9jZXNzIGRvY3VtZW50c1xuICAgIC8vIGluIHBhcmFsbGVsIHdoaWxlIGxpbWl0aW5nIHRvdGFsIGltcGFjdC5cbiAgICBjb25zdCBxdWV1ZTogcXVldWVBc1Byb21pc2VkPHtcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgIH0+ID0gZmFzdHEucHJvbWlzZShcblxuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgZm9yIGVhY2ggZW50cnkgaW4gdGhlXG4gICAgICAgIC8vIHF1ZXVlLiBJdCBoYW5kbGVzIHJlbmRlcmluZyB0aGUgcXVldWVcbiAgICAgICAgLy8gVGhlIHF1ZXVlIGhhcyBjb25maWcgb2JqZWN0cyBhbmQgcGF0aCBzdHJpbmdzXG4gICAgICAgIC8vIHdoaWNoIGlzIGV4YWN0bHkgd2hhdCdzIHJlcXVpcmVkIGJ5XG4gICAgICAgIC8vIHJlbmRlckRvY3VtZW50XG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50SW5RdWV1ZShlbnRyeSlcbiAgICAgICAgICAgIDogUHJvbWlzZTx7IHJlc3VsdD86IGFueTsgZXJyb3I/OiBhbnk7IH0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVuZGVyRG9jdW1lbnQoXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5LmNvbmZpZywgZW50cnkuaW5mb1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYERPTkUgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHJlc3VsdCB9O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgRVJST1IgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZXJyb3IgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnLmNvbmN1cnJlbmN5KTtcblxuICAgIC8vIHF1ZXVlLnB1c2ggcmV0dXJucyBhIFByb21pc2UgdGhhdCdzIGZ1bGZpbGxlZCB3aGVuXG4gICAgLy8gdGhlIHRhc2sgZmluaXNoZXMuXG4gICAgLy8gSGVuY2Ugd2FpdEZvciBpcyBhbiBhcnJheSBvZiBQcm9taXNlcy5cbiAgICBjb25zdCB3YWl0Rm9yID0gW107XG4gICAgZm9yIChsZXQgZW50cnkgb2YgZmlsZXoyKSB7XG4gICAgICAgIHdhaXRGb3IucHVzaChxdWV1ZS5wdXNoKGVudHJ5KSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBhdXRvbWF0aWNhbGx5IHdhaXRzIGZvciBhbGwgdGhvc2VcbiAgICAvLyBQcm9taXNlcyB0byByZXNvbHZlLCB3aGlsZSBtYWtpbmcgdGhlIHJlc3VsdHNcbiAgICAvLyBhcnJheSBjb250YWluIHJlc3VsdHMuXG4gICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAobGV0IHJlc3VsdCBvZiB3YWl0Rm9yKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXN1bHQpO1xuICAgIH1cblxuICAgIC8vIDQuIEludm9rZSBob29rU2l0ZVJlbmRlcmVkXG5cbiAgICB0cnkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnSW52b2tpbmcgaG9va1NpdGVSZW5kZXJlZCcpO1xuICAgICAgICBhd2FpdCBjb25maWcuaG9va1NpdGVSZW5kZXJlZCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBob29rU2l0ZVJlbmRlcmVkIGZhaWxlZCBiZWNhdXNlICR7ZX1gKTtcbiAgICB9XG5cbiAgICAvLyA1LiByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiByZXN1bHRzO1xufTtcbiJdfQ==