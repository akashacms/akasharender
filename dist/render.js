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
//////////////////////////////////////////////////////////
/**
 * Where renderDocument is meant for a document on disk
 * and indexed by a DocumentsFileCache instance, this
 * function is meant for documents created from in-memory
 * data.  For instance, the tagged-content plugin generates
 * tag pages listing links to documents based on their tag.
 * These pages are instantiated out of data rather than
 * existing on-disk.
 *
 * Required data:
 *     * Blank page - with frontmatter including a "layout" template reference
 *     * File-name to use for virtual page, which also determines the rendered output file
 *     * Metadata derived from the frontmatter and filled with other stuff including the data to render into the page,
 *
 * @param config
 * @param docInfo
 */
export async function renderVirtualDocument(config, 
// Instead of the full docInfo document
// use a simplified object with this
// subset of fields.
docInfo) {
    const renderer = config.findRendererPath(docInfo.vpath);
    const rc = renderer.parseMetadata({
        fspath: docInfo.vpath,
        content: docInfo.document,
        metadata: {}
    });
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
    // If there is a layout template, render that
    // template passing the rendered primary content
    let layoutrendered;
    if (rc.metadata.layout) {
        const layouts = config.akasha
            .filecache.layoutsCache;
        const layoutInfo = await layouts.find(rc.metadata.layout);
        if (!layoutInfo) {
            throw new Error(`No layout found in ${util.inspect(config.layoutDirs)} for ${rc.metadata.layout} in file ${docInfo.vpath}`);
        }
        // Build the metadata for the layout rendering
        let layoutmetadata = {};
        for (var yprop in layoutInfo.metadata) {
            layoutmetadata[yprop] = layoutInfo.metadata[yprop];
        }
        for (var yprop in rc.metadata) {
            if (yprop !== 'layout') {
                layoutmetadata[yprop] = rc.metadata[yprop];
            }
        }
        // Make the first rendering available
        // in the metadata as "content" variable
        layoutmetadata.content = docrendered;
        const renderer = config.findRendererPath(rc.metadata.layout);
        if (!renderer) {
            throw new Error(`No renderer for ${layoutmetadata.layout} in file ${docInfo.vpath}`);
            ;
        }
        const layoutContext = {
            fspath: layoutInfo.fspath,
            content: layoutInfo.docContent,
            body: layoutInfo.docBody,
            metadata: layoutmetadata
        };
        layoutrendered
            = await renderer.render(layoutContext);
    }
    // For HTML rendering, fun Mahabhuta functions
    const format = renderer.renderFormat(rc);
    const doMahabhuta = (format === 'HTML');
    if (doMahabhuta) {
        const mahametadata = {};
        for (var yprop in rc.metadata) {
            mahametadata[yprop] = rc.metadata[yprop];
        }
        mahametadata.content = docrendered;
        if (rc.metadata.config.mahabhutaConfig) {
            mahabhuta.config(rc.metadata.config.mahabhutaConfig);
        }
        layoutrendered = await mahabhuta.processAsync(typeof layoutrendered === 'string'
            ? layoutrendered
            : docrendered, mahametadata, config.mahafuncs);
    }
    // layoutrendered gets the final rendering
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
    /* else if (layoutFormat === 'CSS') {

        try {
            const renderToFpath = path.join(
                        config.renderTo, docInfo.renderPath);
            const renderToDir = path.dirname(renderToFpath);
            await fsp.mkdir(renderToDir, {
                        recursive: true
                    });
            await fsp.writeFile(renderToFpath, layoutRendered, 'utf8');
            const renderEndRendered = new Date();
            await data.report(
                docInfo.mountPoint, docInfo.vpath,
                config.renderTo,
                "RENDERED", renderStart);
            return `${layoutFormat} ${docInfo.vpath} ==> ${docInfo.renderPath} (${(renderEndRendered.valueOf() - renderStart.valueOf()) / 1000} seconds)\n${await data.data4file(docInfo.mountPoint, docInfo.vpath)}`;
        } catch(err) {
            console.error(`in RENDER CSS branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in RENDER CSS branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
        }
    } */ /* else {

        try {
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
        } catch(err) {
            console.error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
        }
    } */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUVsQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFXMUIsMERBQTBEO0FBRTFEOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxxQkFBcUIsQ0FDdkMsTUFBcUI7QUFDckIsdUNBQXVDO0FBQ3ZDLG9DQUFvQztBQUNwQyxvQkFBb0I7QUFDcEIsT0FNQztJQUlELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FDaEMsT0FBTyxDQUFDLEtBQUssQ0FDcEIsQ0FBQztJQUVGLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUM7UUFDOUIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUTtRQUN6QixRQUFRLEVBQUUsRUFBRTtLQUNmLENBQUMsQ0FBQztJQUVILHNDQUFzQztJQUN0QyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDNUIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDdEMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQztJQUNG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Q3BDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsb0JBQW9CO0lBQ3BCLE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUM7QUFBQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgKiBhcyBkYXRhIGZyb20gJy4vZGF0YS5qcyc7XG5pbXBvcnQgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5cbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgdHlwZSB7IHF1ZXVlQXNQcm9taXNlZCB9IGZyb20gXCJmYXN0cVwiO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vaW5kZXguanMnO1xuaW1wb3J0IHsgUmVuZGVyaW5nQ29udGV4dCB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCB7XG4gICAgRG9jdW1lbnRzQ2FjaGVcbn0gZnJvbSAnLi9jYWNoZS9jYWNoZS1zcWxpdGUuanMnO1xuaW1wb3J0IHtcbiAgICBEb2N1bWVudFxufSBmcm9tICcuL2NhY2hlL3NjaGVtYS5qcyc7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBXaGVyZSByZW5kZXJEb2N1bWVudCBpcyBtZWFudCBmb3IgYSBkb2N1bWVudCBvbiBkaXNrXG4gKiBhbmQgaW5kZXhlZCBieSBhIERvY3VtZW50c0ZpbGVDYWNoZSBpbnN0YW5jZSwgdGhpc1xuICogZnVuY3Rpb24gaXMgbWVhbnQgZm9yIGRvY3VtZW50cyBjcmVhdGVkIGZyb20gaW4tbWVtb3J5XG4gKiBkYXRhLiAgRm9yIGluc3RhbmNlLCB0aGUgdGFnZ2VkLWNvbnRlbnQgcGx1Z2luIGdlbmVyYXRlc1xuICogdGFnIHBhZ2VzIGxpc3RpbmcgbGlua3MgdG8gZG9jdW1lbnRzIGJhc2VkIG9uIHRoZWlyIHRhZy5cbiAqIFRoZXNlIHBhZ2VzIGFyZSBpbnN0YW50aWF0ZWQgb3V0IG9mIGRhdGEgcmF0aGVyIHRoYW5cbiAqIGV4aXN0aW5nIG9uLWRpc2suXG4gKlxuICogUmVxdWlyZWQgZGF0YTpcbiAqICAgICAqIEJsYW5rIHBhZ2UgLSB3aXRoIGZyb250bWF0dGVyIGluY2x1ZGluZyBhIFwibGF5b3V0XCIgdGVtcGxhdGUgcmVmZXJlbmNlXG4gKiAgICAgKiBGaWxlLW5hbWUgdG8gdXNlIGZvciB2aXJ0dWFsIHBhZ2UsIHdoaWNoIGFsc28gZGV0ZXJtaW5lcyB0aGUgcmVuZGVyZWQgb3V0cHV0IGZpbGVcbiAqICAgICAqIE1ldGFkYXRhIGRlcml2ZWQgZnJvbSB0aGUgZnJvbnRtYXR0ZXIgYW5kIGZpbGxlZCB3aXRoIG90aGVyIHN0dWZmIGluY2x1ZGluZyB0aGUgZGF0YSB0byByZW5kZXIgaW50byB0aGUgcGFnZSwgIFxuICpcbiAqIEBwYXJhbSBjb25maWcgXG4gKiBAcGFyYW0gZG9jSW5mbyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlclZpcnR1YWxEb2N1bWVudChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgLy8gSW5zdGVhZCBvZiB0aGUgZnVsbCBkb2NJbmZvIGRvY3VtZW50XG4gICAgLy8gdXNlIGEgc2ltcGxpZmllZCBvYmplY3Qgd2l0aCB0aGlzXG4gICAgLy8gc3Vic2V0IG9mIGZpZWxkcy5cbiAgICBkb2NJbmZvOiB7XG4gICAgICAgIC8vIFRoZSB2aXJ0dWFsIHBhdGhuYW1lXG4gICAgICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBkb2N1bWVudCB0byByZW5kZXIgYXMgaWYgaXQnc1xuICAgICAgICAvLyBhdCB0aGF0IHBhdGhcbiAgICAgICAgZG9jdW1lbnQ6IHN0cmluZztcbiAgICB9XG4pIHtcblxuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgICAgIGRvY0luZm8udnBhdGhcbiAgICApO1xuXG4gICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKHtcbiAgICAgICAgZnNwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY3VtZW50LFxuICAgICAgICBtZXRhZGF0YToge31cbiAgICB9KTtcblxuICAgIC8vIEFkZCBuZWNlc3NhcnkgaXRlbXMgdG8gdGhlIG1ldGFkYXRhXG4gICAgcmMubWV0YWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgIHJjLm1ldGFkYXRhLnBhcnRpYWwgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgcmMubWV0YWRhdGEucGFydGlhbFN5bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIHJjLm1ldGFkYXRhLmFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgcmMubWV0YWRhdGEucGx1Z2luID0gY29uZmlnLnBsdWdpbjtcblxuICAgIC8vIFJlbmRlciB0aGUgcHJpbWFyeSBjb250ZW50XG4gICAgbGV0IGRvY3JlbmRlcmVkID0gYXdhaXQgcmVuZGVyZXIucmVuZGVyKHJjKTtcblxuICAgIC8vIElmIHRoZXJlIGlzIGEgbGF5b3V0IHRlbXBsYXRlLCByZW5kZXIgdGhhdFxuICAgIC8vIHRlbXBsYXRlIHBhc3NpbmcgdGhlIHJlbmRlcmVkIHByaW1hcnkgY29udGVudFxuICAgIGxldCBsYXlvdXRyZW5kZXJlZDtcbiAgICBpZiAocmMubWV0YWRhdGEubGF5b3V0KSB7XG4gICAgICAgIGNvbnN0IGxheW91dHMgPSBjb25maWcuYWthc2hhXG4gICAgICAgICAgICAgICAgLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGxheW91dEluZm8gPSBhd2FpdCBsYXlvdXRzLmZpbmQocmMubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgaWYgKCFsYXlvdXRJbmZvKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGxheW91dCBmb3VuZCBpbiAke3V0aWwuaW5zcGVjdChjb25maWcubGF5b3V0RGlycyl9IGZvciAke3JjLm1ldGFkYXRhLmxheW91dH0gaW4gZmlsZSAke2RvY0luZm8udnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCdWlsZCB0aGUgbWV0YWRhdGEgZm9yIHRoZSBsYXlvdXQgcmVuZGVyaW5nXG4gICAgICAgIGxldCBsYXlvdXRtZXRhZGF0YTogYW55ID0ge307XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIGxheW91dEluZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIGxheW91dG1ldGFkYXRhW3lwcm9wXSA9IGxheW91dEluZm8ubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIHJjLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICBpZiAoeXByb3AgIT09ICdsYXlvdXQnKSB7XG4gICAgICAgICAgICAgICAgbGF5b3V0bWV0YWRhdGFbeXByb3BdID0gcmMubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTWFrZSB0aGUgZmlyc3QgcmVuZGVyaW5nIGF2YWlsYWJsZVxuICAgICAgICAvLyBpbiB0aGUgbWV0YWRhdGEgYXMgXCJjb250ZW50XCIgdmFyaWFibGVcbiAgICAgICAgbGF5b3V0bWV0YWRhdGEuY29udGVudCA9IGRvY3JlbmRlcmVkO1xuXG4gICAgICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoXG4gICAgICAgICAgICByYy5tZXRhZGF0YS5sYXlvdXRcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIXJlbmRlcmVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHJlbmRlcmVyIGZvciAke2xheW91dG1ldGFkYXRhLmxheW91dH0gaW4gZmlsZSAke2RvY0luZm8udnBhdGh9YCk7O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGF5b3V0Q29udGV4dCA9IHtcbiAgICAgICAgICAgIGZzcGF0aDogbGF5b3V0SW5mby5mc3BhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBsYXlvdXRJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBsYXlvdXRJbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogbGF5b3V0bWV0YWRhdGFcbiAgICAgICAgfTtcblxuICAgICAgICBsYXlvdXRyZW5kZXJlZFxuICAgICAgICA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihsYXlvdXRDb250ZXh0KTtcblxuICAgIH1cblxuICAgIC8vIEZvciBIVE1MIHJlbmRlcmluZywgZnVuIE1haGFiaHV0YSBmdW5jdGlvbnNcbiAgICBjb25zdCBmb3JtYXQgPSByZW5kZXJlci5yZW5kZXJGb3JtYXQocmMpO1xuICAgIGNvbnN0IGRvTWFoYWJodXRhID0gKGZvcm1hdCA9PT0gJ0hUTUwnKTtcblxuICAgIGlmIChkb01haGFiaHV0YSkge1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbWFoYW1ldGFkYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgeXByb3AgaW4gcmMubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIG1haGFtZXRhZGF0YVt5cHJvcF0gPSByYy5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgbWFoYW1ldGFkYXRhLmNvbnRlbnQgPSBkb2NyZW5kZXJlZDtcblxuICAgICAgICBpZiAocmMubWV0YWRhdGEuY29uZmlnLm1haGFiaHV0YUNvbmZpZykge1xuICAgICAgICAgICAgbWFoYWJodXRhLmNvbmZpZyhyYy5tZXRhZGF0YS5jb25maWcubWFoYWJodXRhQ29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxheW91dHJlbmRlcmVkID0gYXdhaXQgbWFoYWJodXRhLnByb2Nlc3NBc3luYyhcbiAgICAgICAgICAgIHR5cGVvZiBsYXlvdXRyZW5kZXJlZCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyBsYXlvdXRyZW5kZXJlZFxuICAgICAgICAgICAgICAgICAgICA6IGRvY3JlbmRlcmVkLFxuICAgICAgICAgICAgbWFoYW1ldGFkYXRhLFxuICAgICAgICAgICAgY29uZmlnLm1haGFmdW5jc1xuICAgICAgICApO1xuICAgIH1cblxuICAgIC8vIGxheW91dHJlbmRlcmVkIGdldHMgdGhlIGZpbmFsIHJlbmRlcmluZ1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogVGhlIGNvcmUgcGFydCBvZiByZW5kZXJpbmcgY29udGVudCB1c2luZyBhIHJlbmRlcmVyLlxuICogVGhpcyBmdW5jdGlvbiBsb29rcyBmb3IgdGhlIHJlbmRlcmVyLCBhbmQgaWYgbm9uZSBpc1xuICogZm91bmQgaXQgc2ltcGx5IHJldHVybnMuICBJdCB0aGVuIGRvZXMgYSBsaXR0bGUgc2V0dXBcbiAqIHRvIHRoZSBtZXRhZGF0YSBvYmplY3QsIGFuZCBjYWxscyB0aGUgcmVuZGVyIGZ1bmN0aW9uXG4gKlxuICogQHBhcmFtIGNvbmZpZyAtIEFrYXNoYUNNUyBDb25maWd1cmF0aW9uXG4gKiBAcGFyYW0gcmMgLSBSZW5kZXJpbmdDb250ZXh0IGZvciB1c2Ugd2l0aCBSZW5kZXJlcnNcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyQ29udGVudChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgcmM6IFJlbmRlcmluZ0NvbnRleHRcbilcbiAgICAvLyBUaGUgcmV0dXJuIGlzIGEgc2ltcGxlIG9iamVjdFxuICAgIC8vIGNvbnRhaW5pbmcgdXNlZnVsIGRhdGFcbiAgICA6IFByb21pc2U8e1xuICAgICAgICByZW5kZXJlck5hbWU/OiBzdHJpbmcsXG4gICAgICAgIGZvcm1hdD86IHN0cmluZyxcbiAgICAgICAgcmVuZGVyZWQ6IHN0cmluZ1xuICAgIH0+XG57XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckNvbnRlbnQgYCwgcmMpO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoXG4gICAgICAgIHJjLmZzcGF0aFxuICAgICk7XG4gICAgaWYgKCFyZW5kZXJlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVuZGVyZXJOYW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBmb3JtYXQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHJlbmRlcmVkOiByYy5ib2R5XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gQWRkIG5lY2Vzc2FyeSBpdGVtcyB0byB0aGUgbWV0YWRhdGFcbiAgICByYy5tZXRhZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgcmMubWV0YWRhdGEucGFydGlhbCA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsU3luYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgcmMubWV0YWRhdGEuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICByYy5tZXRhZGF0YS5wbHVnaW4gPSBjb25maWcucGx1Z2luO1xuXG4gICAgLy8gUmVuZGVyIHRoZSBwcmltYXJ5IGNvbnRlbnRcbiAgICBsZXQgZG9jcmVuZGVyZWQgPSBhd2FpdCByZW5kZXJlci5yZW5kZXIocmMpO1xuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckNvbnRlbnQgcmVuZGVyZWQ9YCwgZG9jcmVuZGVyZWQpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcmVyTmFtZTogcmVuZGVyZXIubmFtZSxcbiAgICAgICAgZm9ybWF0OiByZW5kZXJlci5yZW5kZXJGb3JtYXQocmMpLFxuICAgICAgICByZW5kZXJlZDogZG9jcmVuZGVyZWRcbiAgICB9O1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGFuZCB0aGUgbmV4dCBleGlzdCBzb2xlbHkgdG9cbi8vIHNpbXBsaWZ5IHJlbmRlckRvY3VtZW50LlxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZUNTU3RvT3V0cHV0KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvLFxuICAgIGRvY1JlbmRlcmVkLFxuICAgIHJlbmRlclN0YXJ0OiBEYXRlXG4pIHtcblxuICAgIGNvbnN0IHJlbmRlclRvRnBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBkb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgIGNvbnN0IHJlbmRlclRvRGlyID0gcGF0aC5kaXJuYW1lKHJlbmRlclRvRnBhdGgpO1xuICAgIGF3YWl0IGZzcC5ta2RpcihyZW5kZXJUb0Rpciwge1xuICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJUb0ZwYXRoLCBkb2NSZW5kZXJlZCwgJ3V0ZjgnKTtcbiAgICBjb25zdCByZW5kZXJFbmRSZW5kZXJlZCA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoXG4gICAgICAgIGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCxcbiAgICAgICAgY29uZmlnLnJlbmRlclRvLFxuICAgICAgICBcIlJFTkRFUkVEXCIsIHJlbmRlclN0YXJ0KTtcbiAgICByZXR1cm4gYENTUyAke2RvY0luZm8udnBhdGh9ID09PiAke2RvY0luZm8ucmVuZGVyUGF0aH0gKCR7KHJlbmRlckVuZFJlbmRlcmVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKVxcbiR7YXdhaXQgZGF0YS5kYXRhNGZpbGUoZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoKX1gO1xuXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvcHlBc3NldFRvT3V0cHV0KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvLFxuICAgIGRvY1JlbmRlcmVkLFxuICAgIHJlbmRlclN0YXJ0OiBEYXRlXG4pIHtcblxuICAgIGNvbnN0IHJlbmRlclRvRnBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBkb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgIGNvbnN0IHJlbmRlclRvRGlyID0gcGF0aC5kaXJuYW1lKHJlbmRlclRvRnBhdGgpO1xuICAgIGF3YWl0IGZzcC5ta2RpcihyZW5kZXJUb0Rpciwge1xuICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgYXdhaXQgZnNwLmNvcHlGaWxlKGRvY0luZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyVG9GcGF0aCk7XG4gICAgLy8gY29uc29sZS5sb2coYENPUElFRCAke2RvY0luZm8ucGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH1gKTtcbiAgICBjb25zdCByZW5kZXJFbmRDb3BpZWQgPSBuZXcgRGF0ZSgpO1xuICAgIHJldHVybiBgQ09QWSAke2RvY0luZm8udnBhdGh9ID09PiAke3JlbmRlclRvRnBhdGh9ICgkeyhyZW5kZXJFbmRDb3BpZWQudmFsdWVPZigpIC0gcmVuZGVyU3RhcnQudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHMpYDtcbn1cblxuLyoqXG4gKiBSZW5kZXIgYSBkb2N1bWVudCwgYWNjb3VudGluZyBmb3IgdGhlIG1haW4gY29udGVudCxcbiAqIGEgbGF5b3V0IHRlbXBsYXRlIChpZiBhbnkpLCBhbmQgTWFoYWJodXRhIChpZiB0aGUgY29udGVudFxuICogb3V0cHV0IGlzIEhUTUwpLiAgVGhpcyBhbHNvIGhhbmRsZXMgcmVuZGVyaW5nIG90aGVyIHR5cGVzXG4gKiBvZiBjb250ZW50IHN1Y2ggYXMgTEVTUyBDU1MgZmlsZXMuXG4gKlxuICogQHBhcmFtIGNvbmZpZyBcbiAqIEBwYXJhbSBkb2NJbmZvIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJEb2N1bWVudChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mb1xuKTogUHJvbWlzZTxzdHJpbmc+XG57XG4gICAgY29uc3QgcmVuZGVyU3RhcnQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgLy8gUmVuZGVyIHRoZSBtYWluIGNvbnRlbnRcblxuICAgIGlmICh0eXBlb2YgZG9jSW5mby5kb2NDb250ZW50ICE9PSAnc3RyaW5nJ1xuICAgICB8fCB0eXBlb2YgZG9jSW5mby5kb2NCb2R5ICE9PSAnc3RyaW5nJ1xuICAgICkge1xuICAgICAgICAvLyBjb25zb2xlLndhcm4oYE5vIGNvbnRlbnQgdG8gcmVuZGVyIGZvciBgLCBkb2NJbmZvKTtcbiAgICB9XG5cbiAgICBjb25zdCByYyA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgZnNwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgIGJvZHk6IGRvY0luZm8uZG9jQm9keSxcbiAgICAgICAgbWV0YWRhdGE6IGRvY0luZm8ubWV0YWRhdGFcbiAgICB9O1xuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50IGNvbnRleHQ9ICR7cmMuZnNwYXRofWAsIHJjKTtcblxuICAgIGxldCBkb2NGb3JtYXQ7ICAgICAgLy8gS25vd2luZyB0aGUgZm9ybWF0IFxuICAgIGxldCBkb2NSZW5kZXJlZDtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZW5kZXJDb250ZW50KGNvbmZpZywgcmMpO1xuICAgICAgICBkb2NGb3JtYXQgPSByZXN1bHQuZm9ybWF0O1xuICAgICAgICBkb2NSZW5kZXJlZCA9IHJlc3VsdC5yZW5kZXJlZDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gJHsoZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyKX1gKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSAkeyhlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnIpfWApO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgJHtkb2NGb3JtYXR9ICR7ZG9jSW5mby52cGF0aH0gcmVuZGVyZWQ9YCwgZG9jUmVuZGVyZWQpO1xuICAgIGF3YWl0IGRhdGEucmVwb3J0KGRvY0luZm8ubW91bnRQb2ludCwgXG4gICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIFxuICAgICAgICAgICAgICAgICAgICAgXCJGSVJTVCBSRU5ERVJcIiwgcmVuZGVyU3RhcnQpO1xuXG4gICAgLy8gSGFuZGxlIHRoZXNlIGNhc2VzIHVwIGZyb250IHNvIHRoYXQgdGhlIHJlbWFpbmluZ1xuICAgIC8vIGNvZGUgY2FuIGJlIGNsZWFuZXIgYW5kIGZvY3VzIG9uIEhUTUwgbGF5b3V0IHJlbmRlcmluZy5cblxuICAgIGlmIChkb2NGb3JtYXQgPT09ICdDU1MnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gd3JpdGVDU1N0b091dHB1dChjb25maWcsIGRvY0luZm8sIGRvY1JlbmRlcmVkLCByZW5kZXJTdGFydCk7XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbiBSRU5ERVIgQ1NTIGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluIFJFTkRFUiBDU1MgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkb2NGb3JtYXQgIT09ICdIVE1MJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29weUFzc2V0VG9PdXRwdXQoY29uZmlnLCBkb2NJbmZvLCBkb2NSZW5kZXJlZCwgcmVuZGVyU3RhcnQpO1xuICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW4gY29weSBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbiBjb3B5IGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgdGhlIG1haW4gY29udGVudCBpbnRvIGEgbGF5b3V0IHRlbXBsYXRlLFxuICAgIC8vIGlmIG9uZSBpcyBzcGVjaWZpZWRcblxuICAgIGxldCBsYXlvdXRGb3JtYXQ7XG4gICAgbGV0IGxheW91dFJlbmRlcmVkO1xuICAgIGxldCByZXN1bHQ7XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50IGxheW91dCAke2RvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXR9IGRvY01ldGFkYXRhICR7dXRpbC5pbnNwZWN0KGRvY0luZm8uZG9jTWV0YWRhdGEpfSBtZXRhZGF0YSAke3V0aWwuaW5zcGVjdChkb2NJbmZvLm1ldGFkYXRhKX1gKTtcbiAgICBpZiAoZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dCkge1xuXG4gICAgICAgIGNvbnN0IGxheW91dHMgPSBjb25maWcuYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGxheW91dHMuaXNSZWFkeSgpO1xuXG4gICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGxheW91dHMuZmluZChkb2NJbmZvLm1ldGFkYXRhLmxheW91dCk7XG4gICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gbGF5b3V0IGZvdW5kIGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5sYXlvdXREaXJzKX0gZm9yICR7ZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gaW4gZmlsZSAke2RvY0luZm8udnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByY0xheW91dCA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgICAgIGZzcGF0aDogZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQsXG4gICAgICAgICAgICBjb250ZW50OiBmb3VuZC5kb2NDb250ZW50LFxuICAgICAgICAgICAgYm9keTogZm91bmQuZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7fVxuICAgICAgICB9O1xuICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiBmb3VuZC5tZXRhZGF0YSkge1xuICAgICAgICAgICAgcmNMYXlvdXQubWV0YWRhdGFbeXByb3BdID0gZm91bmQubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIGRvY0luZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIGlmICh5cHJvcCAhPT0gJ2xheW91dCcpIHtcbiAgICAgICAgICAgICAgICByY0xheW91dC5tZXRhZGF0YVt5cHJvcF0gPSBkb2NJbmZvLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByY0xheW91dC5tZXRhZGF0YS5jb250ZW50ID0gZG9jUmVuZGVyZWQ7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3VsdFxuICAgICAgICAgICAgICAgID0gYXdhaXQgcmVuZGVyQ29udGVudChjb25maWcsIHJjTGF5b3V0KTtcbiAgICAgICAgICAgIGxheW91dEZvcm1hdCA9IHJlc3VsdC5mb3JtYXQ7XG4gICAgICAgICAgICBsYXlvdXRSZW5kZXJlZCA9IHJlc3VsdC5yZW5kZXJlZDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbGV0IGVlID0gbmV3IEVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSB3aXRoICR7ZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gJHtlLnN0YWNrID8gZS5zdGFjayA6IGV9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVlKTtcbiAgICAgICAgICAgIHRocm93IGVlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGF5b3V0Rm9ybWF0ID0gZG9jRm9ybWF0O1xuICAgICAgICBsYXlvdXRSZW5kZXJlZCA9IGRvY1JlbmRlcmVkO1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCAke2RvY0luZm8udnBhdGh9IGFmdGVyIGxheW91dCByZW5kZXIgZm9ybWF0ICR7bGF5b3V0Rm9ybWF0fSBgLCByZXN1bHQpO1xuXG4gICAgY29uc3QgcmVuZGVyU2Vjb25kUmVuZGVyID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBkYXRhLnJlcG9ydChkb2NJbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCwgY29uZmlnLnJlbmRlclRvLCBcbiAgICAgICAgICAgICAgICAgICAgICBcIlNFQ09ORCBSRU5ERVJcIixcbiAgICAgICAgICAgICAgICAgICAgICByZW5kZXJTdGFydCk7XG5cbiAgICBcbiAgICAvLyBOZXh0IHN0ZXAgaXMgdG8gcnVuIE1haGFiaHV0YSBvbiB0aGUgcmVuZGVyZWQgY29udGVudFxuICAgIC8vIE9mIGNvdXJzZSwgTWFoYWJodXRhIGlzIG5vdCBhcHByb3ByaWF0ZSBmb3IgZXZlcnl0aGluZ1xuICAgIC8vIGJlY2F1c2Ugbm90IGV2ZXJ5dGhpbmcgaXMgSFRNTFxuXG4gICAgdHJ5IHtcblxuICAgICAgICBjb25zdCBtYWhhbWV0YWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiBkb2NJbmZvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICBtYWhhbWV0YWRhdGFbeXByb3BdID0gZG9jSW5mby5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgbWFoYW1ldGFkYXRhLmNvbnRlbnQgPSBkb2NSZW5kZXJlZDtcblxuICAgICAgICBpZiAoZG9jSW5mbz8ubWV0YWRhdGE/LmNvbmZpZz8ubWFoYWJodXRhQ29uZmlnKSB7XG4gICAgICAgICAgICBtYWhhYmh1dGEuY29uZmlnKGRvY0luZm8/Lm1ldGFkYXRhPy5jb25maWc/Lm1haGFiaHV0YUNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYG1haGFtZXRhZGF0YWAsIG1haGFtZXRhZGF0YSk7XG4gICAgICAgIGxheW91dFJlbmRlcmVkID0gYXdhaXQgbWFoYWJodXRhLnByb2Nlc3NBc3luYyhcbiAgICAgICAgICAgIGxheW91dFJlbmRlcmVkLCBtYWhhbWV0YWRhdGEsXG4gICAgICAgICAgICBjb25maWcubWFoYWZ1bmNzXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gT0xEIGRvY3JlbmRlcmVkID0gYXdhaXQgdGhpcy5tYWhhcnVuKGxheW91dHJlbmRlcmVkLCBkb2NkYXRhLCBjb25maWcubWFoYWZ1bmNzKTtcbiAgICB9IGNhdGNoIChlMikge1xuICAgICAgICBsZXQgZWVlID0gbmV3IEVycm9yKGBFcnJvciB3aXRoIE1haGFiaHV0YSAke2RvY0luZm8udnBhdGh9IHdpdGggJHtkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSAke2UyLnN0YWNrID8gZTIuc3RhY2sgOiBlMn1gKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihlZWUpO1xuICAgICAgICB0aHJvdyBlZWU7XG4gICAgfVxuXG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoZG9jSW5mby5tb3VudFBvaW50LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJNQUhBQkhVVEFcIiwgcmVuZGVyU3RhcnQpO1xuXG4gICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJEZXN0KSwge1xuICAgICAgICByZWN1cnNpdmU6IHRydWVcbiAgICB9KTtcbiAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlckRlc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXRSZW5kZXJlZCwgJ3V0Zi04Jyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgUkVOREVSRUQgJHtyZW5kZXJlci5uYW1lfSAke2RvY0luZm8ucGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH1gKTtcbiAgICBjb25zdCByZW5kZXJFbmRSZW5kZXJlZCA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoXG4gICAgICAgIGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCxcbiAgICAgICAgY29uZmlnLnJlbmRlclRvLFxuICAgICAgICBcIlJFTkRFUkVEXCIsIHJlbmRlclN0YXJ0KTtcbiAgICByZXR1cm4gYCR7bGF5b3V0Rm9ybWF0fSAke2RvY0luZm8udnBhdGh9ID09PiAke2RvY0luZm8ucmVuZGVyUGF0aH0gKCR7KHJlbmRlckVuZFJlbmRlcmVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKVxcbiR7YXdhaXQgZGF0YS5kYXRhNGZpbGUoZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoKX1gO1xuICAgICAgICBcbiAgICAvKiBlbHNlIGlmIChsYXlvdXRGb3JtYXQgPT09ICdDU1MnKSB7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlclRvRnBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJUb0RpciA9IHBhdGguZGlybmFtZShyZW5kZXJUb0ZwYXRoKTtcbiAgICAgICAgICAgIGF3YWl0IGZzcC5ta2RpcihyZW5kZXJUb0Rpciwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJUb0ZwYXRoLCBsYXlvdXRSZW5kZXJlZCwgJ3V0ZjgnKTtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlckVuZFJlbmRlcmVkID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGF3YWl0IGRhdGEucmVwb3J0KFxuICAgICAgICAgICAgICAgIGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sXG4gICAgICAgICAgICAgICAgXCJSRU5ERVJFRFwiLCByZW5kZXJTdGFydCk7XG4gICAgICAgICAgICByZXR1cm4gYCR7bGF5b3V0Rm9ybWF0fSAke2RvY0luZm8udnBhdGh9ID09PiAke2RvY0luZm8ucmVuZGVyUGF0aH0gKCR7KHJlbmRlckVuZFJlbmRlcmVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKVxcbiR7YXdhaXQgZGF0YS5kYXRhNGZpbGUoZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoKX1gO1xuICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW4gUkVOREVSIENTUyBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbiBSRU5ERVIgQ1NTIGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgIH1cbiAgICB9ICovIC8qIGVsc2Uge1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJUb0ZwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBkb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICAgICAgY29uc3QgcmVuZGVyVG9EaXIgPSBwYXRoLmRpcm5hbWUocmVuZGVyVG9GcGF0aCk7XG4gICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocmVuZGVyVG9EaXIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGF3YWl0IGZzcC5jb3B5RmlsZShkb2NJbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJUb0ZwYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDT1BJRUQgJHtkb2NJbmZvLnBhdGh9ID09PiAke3JlbmRlclRvRnBhdGh9YCk7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJFbmRDb3BpZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgcmV0dXJuIGBDT1BZICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH0gKCR7KHJlbmRlckVuZENvcGllZC52YWx1ZU9mKCkgLSByZW5kZXJTdGFydC52YWx1ZU9mKCkpIC8gMTAwMH0gc2Vjb25kcylgO1xuICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW4gY29weSBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbiBjb3B5IGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgIH1cbiAgICB9ICovXG59XG5cbi8qKlxuICogUmVuZGVyIGFsbCB0aGUgZG9jdW1lbnRzIGluIGEgc2l0ZSwgbGltaXRpbmdcbiAqIHRoZSBudW1iZXIgb2Ygc2ltdWx0YW5lb3VzIHJlbmRlcmluZyB0YXNrc1xuICogdG8gdGhlIG51bWJlciBpbiBjb25maWcuY29uY3VycmVuY3kuXG4gKlxuICogQHBhcmFtIGNvbmZpZ1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlcihjb25maWcpIHtcblxuICAgIGNvbnN0IGRvY3VtZW50cyA9IDxEb2N1bWVudHNDYWNoZT5jb25maWcuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdDQUxMSU5HIGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgYXdhaXQgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKTtcbiAgICBcbiAgICAvLyAxLiBHYXRoZXIgbGlzdCBvZiBmaWxlcyBmcm9tIFJlbmRlckZpbGVDYWNoZVxuICAgIGNvbnN0IGZpbGV6ID0gYXdhaXQgZG9jdW1lbnRzLnBhdGhzKCk7XG4gICAgLy8gY29uc29sZS5sb2coYG5ld2VycmVuZGVyIGZpbGV6ICR7ZmlsZXoubGVuZ3RofWApO1xuXG4gICAgLy8gMi4gRXhjbHVkZSBhbnkgdGhhdCB3ZSB3YW50IHRvIGlnbm9yZVxuICAgIGNvbnN0IGZpbGV6MiA9IFtdIGFzIEFycmF5PHtcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgIH0+O1xuICAgIGZvciAobGV0IGVudHJ5IG9mIGZpbGV6KSB7XG4gICAgICAgIGxldCBpbmNsdWRlID0gdHJ1ZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZW50cnkpO1xuICAgICAgICBsZXQgc3RhdHM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdGF0cyA9IGF3YWl0IGZzcC5zdGF0KGVudHJ5LmZzcGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikgeyBzdGF0cyA9IHVuZGVmaW5lZDsgfVxuICAgICAgICBpZiAoIWVudHJ5KSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIGVsc2UgaWYgKCFzdGF0cyB8fCBzdGF0cy5pc0RpcmVjdG9yeSgpKSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIC8vIFRoaXMgc2hvdWxkIGFyaXNlIHVzaW5nIGFuIGlnbm9yZSBjbGF1c2VcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcuRFNfU3RvcmUnKSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIC8vIGVsc2UgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkudnBhdGgpID09PSAnLnBsYWNlaG9sZGVyJykgaW5jbHVkZSA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChpbmNsdWRlKSB7XG4gICAgICAgICAgICAvLyBUaGUgcXVldWUgaXMgYW4gYXJyYXkgb2YgdHVwbGVzIGNvbnRhaW5pbmcgdGhlXG4gICAgICAgICAgICAvLyBjb25maWcgb2JqZWN0IGFuZCB0aGUgcGF0aCBzdHJpbmdcbiAgICAgICAgICAgIGZpbGV6Mi5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb25maWc6IGNvbmZpZyxcbiAgICAgICAgICAgICAgICBpbmZvOiBhd2FpdCBkb2N1bWVudHMuZmluZChlbnRyeS52cGF0aClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGBuZXdlcnJlbmRlciBmaWxlejIgYWZ0ZXIgaWdub3JlICR7ZmlsZXoyLmxlbmd0aH1gKTtcblxuXG4gICAgLy8gMy4gTWFrZSBhIGZhc3RxIHRvIHByb2Nlc3MgdXNpbmcgcmVuZGVyRG9jdW1lbnQsXG4gICAgLy8gICAgcHVzaGluZyByZXN1bHRzIHRvIHRoZSByZXN1bHRzIGFycmF5XG5cbiAgICAvLyBUaGlzIHNldHMgdXAgdGhlIHF1ZXVlIHByb2Nlc3NvclxuICAgIC8vIFRoZSBjb25jdXJyZW5jeSBzZXR0aW5nIGxldHMgdXMgcHJvY2VzcyBkb2N1bWVudHNcbiAgICAvLyBpbiBwYXJhbGxlbCB3aGlsZSBsaW1pdGluZyB0b3RhbCBpbXBhY3QuXG4gICAgY29uc3QgcXVldWU6IHF1ZXVlQXNQcm9taXNlZDx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PiA9IGZhc3RxLnByb21pc2UoXG5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIGZvciBlYWNoIGVudHJ5IGluIHRoZVxuICAgICAgICAvLyBxdWV1ZS4gSXQgaGFuZGxlcyByZW5kZXJpbmcgdGhlIHF1ZXVlXG4gICAgICAgIC8vIFRoZSBxdWV1ZSBoYXMgY29uZmlnIG9iamVjdHMgYW5kIHBhdGggc3RyaW5nc1xuICAgICAgICAvLyB3aGljaCBpcyBleGFjdGx5IHdoYXQncyByZXF1aXJlZCBieVxuICAgICAgICAvLyByZW5kZXJEb2N1bWVudFxuICAgICAgICBhc3luYyBmdW5jdGlvbiByZW5kZXJEb2N1bWVudEluUXVldWUoZW50cnkpXG4gICAgICAgICAgICA6IFByb21pc2U8eyByZXN1bHQ/OiBhbnk7IGVycm9yPzogYW55OyB9PlxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckRvY3VtZW50KFxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5jb25maWcsIGVudHJ5LmluZm9cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBET05FIHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyByZXN1bHQgfTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEVSUk9SIHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCwgZXJyb3Iuc3RhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZy5jb25jdXJyZW5jeSk7XG5cbiAgICAvLyBxdWV1ZS5wdXNoIHJldHVybnMgYSBQcm9taXNlIHRoYXQncyBmdWxmaWxsZWQgd2hlblxuICAgIC8vIHRoZSB0YXNrIGZpbmlzaGVzLlxuICAgIC8vIEhlbmNlIHdhaXRGb3IgaXMgYW4gYXJyYXkgb2YgUHJvbWlzZXMuXG4gICAgY29uc3Qgd2FpdEZvciA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5IG9mIGZpbGV6Mikge1xuICAgICAgICB3YWl0Rm9yLnB1c2gocXVldWUucHVzaChlbnRyeSkpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgYXV0b21hdGljYWxseSB3YWl0cyBmb3IgYWxsIHRob3NlXG4gICAgLy8gUHJvbWlzZXMgdG8gcmVzb2x2ZSwgd2hpbGUgbWFraW5nIHRoZSByZXN1bHRzXG4gICAgLy8gYXJyYXkgY29udGFpbiByZXN1bHRzLlxuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGxldCByZXN1bHQgb2Ygd2FpdEZvcikge1xuICAgICAgICByZXN1bHRzLnB1c2goYXdhaXQgcmVzdWx0KTtcbiAgICB9XG5cbiAgICAvLyA0LiBJbnZva2UgaG9va1NpdGVSZW5kZXJlZFxuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ0ludm9raW5nIGhvb2tTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgYXdhaXQgY29uZmlnLmhvb2tTaXRlUmVuZGVyZWQoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaG9va1NpdGVSZW5kZXJlZCBmYWlsZWQgYmVjYXVzZSAke2V9YCk7XG4gICAgfVxuXG4gICAgLy8gNS4gcmV0dXJuIHJlc3VsdHNcbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG4iXX0=