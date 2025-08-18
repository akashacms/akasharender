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
 * These pages are instantiate out of data rather than
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
export async function renderVirtualDocument(config, docInfo) {
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
    // console.log(`renderDocument context= ${rc.fspath}`)
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
    // console.log(`renderDocument ${docInfo.vpath} rendered=`, docRendered);
    await data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, "FIRST RENDER", renderStart);
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
            throw new Error(`No layout found in ${util.inspect(config.layoutDirs)} for ${docInfo.metadata.layout} in file ${docInfo.vpath}`);
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
            let ee = new Error(`Error rendering ${docInfo.vpath} with ${docInfo.metadata.layout} ${e.stack ? e.stack : e}`);
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
    const doMahabhuta = (layoutFormat === 'HTML');
    if (doMahabhuta) {
        try {
            const mahametadata = {};
            for (var yprop in docInfo.metadata) {
                mahametadata[yprop] = docInfo.metadata[yprop];
            }
            mahametadata.content = docRendered;
            if (docInfo.metadata.config.mahabhutaConfig) {
                mahabhuta.config(docInfo.metadata.config.mahabhutaConfig);
            }
            // console.log(`mahametadata`, mahametadata);
            layoutRendered = await mahabhuta.processAsync(layoutRendered, mahametadata, config.mahafuncs);
            // OLD docrendered = await this.maharun(layoutrendered, docdata, config.mahafuncs);
        }
        catch (e2) {
            let eee = new Error(`Error with Mahabhuta ${docInfo.vpath} with ${docInfo.metadata.layout} ${e2.stack ? e2.stack : e2}`);
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
    else if (layoutFormat === 'CSS') {
        try {
            const renderToFpath = path.join(config.renderTo, docInfo.renderPath);
            const renderToDir = path.dirname(renderToFpath);
            await fsp.mkdir(renderToDir, {
                recursive: true
            });
            await fsp.writeFile(renderToFpath, layoutRendered, 'utf8');
            const renderEndRendered = new Date();
            await data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, "RENDERED", renderStart);
            return `${layoutFormat} ${docInfo.vpath} ==> ${docInfo.renderPath} (${(renderEndRendered.valueOf() - renderStart.valueOf()) / 1000} seconds)\n${await data.data4file(docInfo.mountPoint, docInfo.vpath)}`;
        }
        catch (err) {
            console.error(`in RENDER CSS branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in RENDER CSS branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
        }
    }
    else {
        try {
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
        catch (err) {
            console.error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
            throw new Error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
        }
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUVsQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFRMUIsMERBQTBEO0FBRTFEOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxxQkFBcUIsQ0FDdkMsTUFBcUIsRUFDckIsT0FNQztJQUlELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FDaEMsT0FBTyxDQUFDLEtBQUssQ0FDcEIsQ0FBQztJQUVGLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUM7UUFDOUIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUTtRQUN6QixRQUFRLEVBQUUsRUFBRTtLQUNmLENBQUMsQ0FBQztJQUVILHNDQUFzQztJQUN0QyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDNUIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDdEMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQztJQUNGLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLENBQUMsS0FB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LEVBQUUsQ0FBQztZQUNiLCtFQUErRTtZQUMvRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQztJQUNMLENBQUMsRUFDRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFeEIscURBQXFEO0lBQ3JELHFCQUFxQjtJQUNyQix5Q0FBeUM7SUFDekMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLEtBQUssSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7UUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxnREFBZ0Q7SUFDaEQseUJBQXlCO0lBQ3pCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNuQixLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsNkJBQTZCO0lBRTdCLElBQUksQ0FBQztRQUNELDRDQUE0QztRQUM1QyxNQUFNLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsb0JBQW9CO0lBQ3BCLE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUM7QUFBQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgKiBhcyBkYXRhIGZyb20gJy4vZGF0YS5qcyc7XG5pbXBvcnQgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5cbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgdHlwZSB7IHF1ZXVlQXNQcm9taXNlZCB9IGZyb20gXCJmYXN0cVwiO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vaW5kZXguanMnO1xuaW1wb3J0IHsgUmVuZGVyaW5nQ29udGV4dCB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCB7XG4gICAgRG9jdW1lbnRzRmlsZUNhY2hlLCBEb2N1bWVudFxufSBmcm9tICcuL2NhY2hlL2ZpbGUtY2FjaGUtc3FsaXRlLmpzJztcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFdoZXJlIHJlbmRlckRvY3VtZW50IGlzIG1lYW50IGZvciBhIGRvY3VtZW50IG9uIGRpc2tcbiAqIGFuZCBpbmRleGVkIGJ5IGEgRG9jdW1lbnRzRmlsZUNhY2hlIGluc3RhbmNlLCB0aGlzXG4gKiBmdW5jdGlvbiBpcyBtZWFudCBmb3IgZG9jdW1lbnRzIGNyZWF0ZWQgZnJvbSBpbi1tZW1vcnlcbiAqIGRhdGEuICBGb3IgaW5zdGFuY2UsIHRoZSB0YWdnZWQtY29udGVudCBwbHVnaW4gZ2VuZXJhdGVzXG4gKiB0YWcgcGFnZXMgbGlzdGluZyBsaW5rcyB0byBkb2N1bWVudHMgYmFzZWQgb24gdGhlaXIgdGFnLlxuICogVGhlc2UgcGFnZXMgYXJlIGluc3RhbnRpYXRlIG91dCBvZiBkYXRhIHJhdGhlciB0aGFuXG4gKiBleGlzdGluZyBvbi1kaXNrLlxuICpcbiAqIFJlcXVpcmVkIGRhdGE6XG4gKiAgICAgKiBCbGFuayBwYWdlIC0gd2l0aCBmcm9udG1hdHRlciBpbmNsdWRpbmcgYSBcImxheW91dFwiIHRlbXBsYXRlIHJlZmVyZW5jZVxuICogICAgICogRmlsZS1uYW1lIHRvIHVzZSBmb3IgdmlydHVhbCBwYWdlLCB3aGljaCBhbHNvIGRldGVybWluZXMgdGhlIHJlbmRlcmVkIG91dHB1dCBmaWxlXG4gKiAgICAgKiBNZXRhZGF0YSBkZXJpdmVkIGZyb20gdGhlIGZyb250bWF0dGVyIGFuZCBmaWxsZWQgd2l0aCBvdGhlciBzdHVmZiBpbmNsdWRpbmcgdGhlIGRhdGEgdG8gcmVuZGVyIGludG8gdGhlIHBhZ2UsICBcbiAqXG4gKiBAcGFyYW0gY29uZmlnIFxuICogQHBhcmFtIGRvY0luZm8gXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJWaXJ0dWFsRG9jdW1lbnQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm86IHtcbiAgICAgICAgLy8gVGhlIHZpcnR1YWwgcGF0aG5hbWVcbiAgICAgICAgdnBhdGg6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIGRvY3VtZW50IHRvIHJlbmRlciBhcyBpZiBpdCdzXG4gICAgICAgIC8vIGF0IHRoYXQgcGF0aFxuICAgICAgICBkb2N1bWVudDogc3RyaW5nO1xuICAgIH1cbikge1xuXG5cbiAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKFxuICAgICAgICAgICAgZG9jSW5mby52cGF0aFxuICAgICk7XG5cbiAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoe1xuICAgICAgICBmc3BhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgIGNvbnRlbnQ6IGRvY0luZm8uZG9jdW1lbnQsXG4gICAgICAgIG1ldGFkYXRhOiB7fVxuICAgIH0pO1xuXG4gICAgLy8gQWRkIG5lY2Vzc2FyeSBpdGVtcyB0byB0aGUgbWV0YWRhdGFcbiAgICByYy5tZXRhZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgcmMubWV0YWRhdGEucGFydGlhbCA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsU3luYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgcmMubWV0YWRhdGEuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICByYy5tZXRhZGF0YS5wbHVnaW4gPSBjb25maWcucGx1Z2luO1xuXG4gICAgLy8gUmVuZGVyIHRoZSBwcmltYXJ5IGNvbnRlbnRcbiAgICBsZXQgZG9jcmVuZGVyZWQgPSBhd2FpdCByZW5kZXJlci5yZW5kZXIocmMpO1xuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSBsYXlvdXQgdGVtcGxhdGUsIHJlbmRlciB0aGF0XG4gICAgLy8gdGVtcGxhdGUgcGFzc2luZyB0aGUgcmVuZGVyZWQgcHJpbWFyeSBjb250ZW50XG4gICAgbGV0IGxheW91dHJlbmRlcmVkO1xuICAgIGlmIChyYy5tZXRhZGF0YS5sYXlvdXQpIHtcbiAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGFcbiAgICAgICAgICAgICAgICAuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgY29uc3QgbGF5b3V0SW5mbyA9IGF3YWl0IGxheW91dHMuZmluZChyYy5tZXRhZGF0YS5sYXlvdXQpO1xuICAgICAgICBpZiAoIWxheW91dEluZm8pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gbGF5b3V0IGZvdW5kIGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5sYXlvdXREaXJzKX0gZm9yICR7cmMubWV0YWRhdGEubGF5b3V0fSBpbiBmaWxlICR7ZG9jSW5mby52cGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJ1aWxkIHRoZSBtZXRhZGF0YSBmb3IgdGhlIGxheW91dCByZW5kZXJpbmdcbiAgICAgICAgbGV0IGxheW91dG1ldGFkYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgeXByb3AgaW4gbGF5b3V0SW5mby5tZXRhZGF0YSkge1xuICAgICAgICAgICAgbGF5b3V0bWV0YWRhdGFbeXByb3BdID0gbGF5b3V0SW5mby5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgeXByb3AgaW4gcmMubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIGlmICh5cHJvcCAhPT0gJ2xheW91dCcpIHtcbiAgICAgICAgICAgICAgICBsYXlvdXRtZXRhZGF0YVt5cHJvcF0gPSByYy5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYWtlIHRoZSBmaXJzdCByZW5kZXJpbmcgYXZhaWxhYmxlXG4gICAgICAgIC8vIGluIHRoZSBtZXRhZGF0YSBhcyBcImNvbnRlbnRcIiB2YXJpYWJsZVxuICAgICAgICBsYXlvdXRtZXRhZGF0YS5jb250ZW50ID0gZG9jcmVuZGVyZWQ7XG5cbiAgICAgICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgICAgIHJjLm1ldGFkYXRhLmxheW91dFxuICAgICAgICApO1xuXG4gICAgICAgIGlmICghcmVuZGVyZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcmVuZGVyZXIgZm9yICR7bGF5b3V0bWV0YWRhdGEubGF5b3V0fSBpbiBmaWxlICR7ZG9jSW5mby52cGF0aH1gKTs7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXlvdXRDb250ZXh0ID0ge1xuICAgICAgICAgICAgZnNwYXRoOiBsYXlvdXRJbmZvLmZzcGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGxheW91dEluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIGJvZHk6IGxheW91dEluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBsYXlvdXRtZXRhZGF0YVxuICAgICAgICB9O1xuXG4gICAgICAgIGxheW91dHJlbmRlcmVkXG4gICAgICAgID0gYXdhaXQgcmVuZGVyZXIucmVuZGVyKGxheW91dENvbnRleHQpO1xuXG4gICAgfVxuXG4gICAgLy8gRm9yIEhUTUwgcmVuZGVyaW5nLCBmdW4gTWFoYWJodXRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGZvcm1hdCA9IHJlbmRlcmVyLnJlbmRlckZvcm1hdChyYyk7XG4gICAgY29uc3QgZG9NYWhhYmh1dGEgPSAoZm9ybWF0ID09PSAnSFRNTCcpO1xuXG4gICAgaWYgKGRvTWFoYWJodXRhKSB7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBtYWhhbWV0YWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiByYy5tZXRhZGF0YSkge1xuICAgICAgICAgICAgbWFoYW1ldGFkYXRhW3lwcm9wXSA9IHJjLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBtYWhhbWV0YWRhdGEuY29udGVudCA9IGRvY3JlbmRlcmVkO1xuXG4gICAgICAgIGlmIChyYy5tZXRhZGF0YS5jb25maWcubWFoYWJodXRhQ29uZmlnKSB7XG4gICAgICAgICAgICBtYWhhYmh1dGEuY29uZmlnKHJjLm1ldGFkYXRhLmNvbmZpZy5tYWhhYmh1dGFDb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGF5b3V0cmVuZGVyZWQgPSBhd2FpdCBtYWhhYmh1dGEucHJvY2Vzc0FzeW5jKFxuICAgICAgICAgICAgdHlwZW9mIGxheW91dHJlbmRlcmVkID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICA/IGxheW91dHJlbmRlcmVkXG4gICAgICAgICAgICAgICAgICAgIDogZG9jcmVuZGVyZWQsXG4gICAgICAgICAgICBtYWhhbWV0YWRhdGEsXG4gICAgICAgICAgICBjb25maWcubWFoYWZ1bmNzXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gbGF5b3V0cmVuZGVyZWQgZ2V0cyB0aGUgZmluYWwgcmVuZGVyaW5nXG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBUaGUgY29yZSBwYXJ0IG9mIHJlbmRlcmluZyBjb250ZW50IHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBUaGlzIGZ1bmN0aW9uIGxvb2tzIGZvciB0aGUgcmVuZGVyZXIsIGFuZCBpZiBub25lIGlzXG4gKiBmb3VuZCBpdCBzaW1wbHkgcmV0dXJucy4gIEl0IHRoZW4gZG9lcyBhIGxpdHRsZSBzZXR1cFxuICogdG8gdGhlIG1ldGFkYXRhIG9iamVjdCwgYW5kIGNhbGxzIHRoZSByZW5kZXIgZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0gY29uZmlnIC0gQWthc2hhQ01TIENvbmZpZ3VyYXRpb25cbiAqIEBwYXJhbSByYyAtIFJlbmRlcmluZ0NvbnRleHQgZm9yIHVzZSB3aXRoIFJlbmRlcmVyc1xuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJDb250ZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICByYzogUmVuZGVyaW5nQ29udGV4dFxuKVxuICAgIC8vIFRoZSByZXR1cm4gaXMgYSBzaW1wbGUgb2JqZWN0XG4gICAgLy8gY29udGFpbmluZyB1c2VmdWwgZGF0YVxuICAgIDogUHJvbWlzZTx7XG4gICAgICAgIHJlbmRlcmVyTmFtZT86IHN0cmluZyxcbiAgICAgICAgZm9ybWF0Pzogc3RyaW5nLFxuICAgICAgICByZW5kZXJlZDogc3RyaW5nXG4gICAgfT5cbntcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ29udGVudCBgLCByYyk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgcmMuZnNwYXRoXG4gICAgKTtcbiAgICBpZiAoIXJlbmRlcmVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZW5kZXJlck5hbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGZvcm1hdDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcmVuZGVyZWQ6IHJjLmJvZHlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBBZGQgbmVjZXNzYXJ5IGl0ZW1zIHRvIHRoZSBtZXRhZGF0YVxuICAgIHJjLm1ldGFkYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIHJjLm1ldGFkYXRhLnBhcnRpYWxTeW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgIHJjLm1ldGFkYXRhLnBsdWdpbiA9IGNvbmZpZy5wbHVnaW47XG5cbiAgICAvLyBSZW5kZXIgdGhlIHByaW1hcnkgY29udGVudFxuICAgIGxldCBkb2NyZW5kZXJlZCA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihyYyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ29udGVudCByZW5kZXJlZD1gLCBkb2NyZW5kZXJlZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyZXJOYW1lOiByZW5kZXJlci5uYW1lLFxuICAgICAgICBmb3JtYXQ6IHJlbmRlcmVyLnJlbmRlckZvcm1hdChyYyksXG4gICAgICAgIHJlbmRlcmVkOiBkb2NyZW5kZXJlZFxuICAgIH07XG59XG5cbi8qKlxuICogUmVuZGVyIGEgZG9jdW1lbnQsIGFjY291bnRpbmcgZm9yIHRoZSBtYWluIGNvbnRlbnQsXG4gKiBhIGxheW91dCB0ZW1wbGF0ZSAoaWYgYW55KSwgYW5kIE1haGFiaHV0YSAoaWYgdGhlIGNvbnRlbnRcbiAqIG91dHB1dCBpcyBIVE1MKS4gIFRoaXMgYWxzbyBoYW5kbGVzIHJlbmRlcmluZyBvdGhlciB0eXBlc1xuICogb2YgY29udGVudCBzdWNoIGFzIExFU1MgQ1NTIGZpbGVzLlxuICpcbiAqIEBwYXJhbSBjb25maWcgXG4gKiBAcGFyYW0gZG9jSW5mbyBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm9cbik6IFByb21pc2U8c3RyaW5nPlxue1xuICAgIGNvbnN0IHJlbmRlclN0YXJ0ID0gbmV3IERhdGUoKTtcblxuICAgIC8vIFJlbmRlciB0aGUgbWFpbiBjb250ZW50XG5cbiAgICBpZiAodHlwZW9mIGRvY0luZm8uZG9jQ29udGVudCAhPT0gJ3N0cmluZydcbiAgICAgfHwgdHlwZW9mIGRvY0luZm8uZG9jQm9keSAhPT0gJ3N0cmluZydcbiAgICApIHtcbiAgICAgICAgLy8gY29uc29sZS53YXJuKGBObyBjb250ZW50IHRvIHJlbmRlciBmb3IgYCwgZG9jSW5mbyk7XG4gICAgfVxuXG4gICAgY29uc3QgcmMgPSA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgIGZzcGF0aDogZG9jSW5mby52cGF0aCxcbiAgICAgICAgY29udGVudDogZG9jSW5mby5kb2NDb250ZW50LFxuICAgICAgICBib2R5OiBkb2NJbmZvLmRvY0JvZHksXG4gICAgICAgIG1ldGFkYXRhOiBkb2NJbmZvLm1ldGFkYXRhXG4gICAgfTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCBjb250ZXh0PSAke3JjLmZzcGF0aH1gKVxuXG4gICAgbGV0IGRvY0Zvcm1hdDsgICAgICAvLyBLbm93aW5nIHRoZSBmb3JtYXQgXG4gICAgbGV0IGRvY1JlbmRlcmVkO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckNvbnRlbnQoY29uZmlnLCByYyk7XG4gICAgICAgIGRvY0Zvcm1hdCA9IHJlc3VsdC5mb3JtYXQ7XG4gICAgICAgIGRvY1JlbmRlcmVkID0gcmVzdWx0LnJlbmRlcmVkO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSAkeyhlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnIpfWApO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9ICR7KGVyci5zdGFjayA/IGVyci5zdGFjayA6IGVycil9YCk7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCAke2RvY0luZm8udnBhdGh9IHJlbmRlcmVkPWAsIGRvY1JlbmRlcmVkKTtcbiAgICBhd2FpdCBkYXRhLnJlcG9ydChkb2NJbmZvLm1vdW50UG9pbnQsIFxuICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBcbiAgICAgICAgICAgICAgICAgICAgIFwiRklSU1QgUkVOREVSXCIsIHJlbmRlclN0YXJ0KTtcblxuICAgIC8vIFJlbmRlciB0aGUgbWFpbiBjb250ZW50IGludG8gYSBsYXlvdXQgdGVtcGxhdGUsXG4gICAgLy8gaWYgb25lIGlzIHNwZWNpZmllZFxuXG4gICAgbGV0IGxheW91dEZvcm1hdDtcbiAgICBsZXQgbGF5b3V0UmVuZGVyZWQ7XG4gICAgbGV0IHJlc3VsdDtcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgbGF5b3V0ICR7ZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gZG9jTWV0YWRhdGEgJHt1dGlsLmluc3BlY3QoZG9jSW5mby5kb2NNZXRhZGF0YSl9IG1ldGFkYXRhICR7dXRpbC5pbnNwZWN0KGRvY0luZm8ubWV0YWRhdGEpfWApO1xuICAgIGlmIChkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0KSB7XG5cbiAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgbGF5b3V0cy5pc1JlYWR5KCk7XG5cbiAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgbGF5b3V0cy5maW5kKGRvY0luZm8ubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBsYXlvdXQgZm91bmQgaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLmxheW91dERpcnMpfSBmb3IgJHtkb2NJbmZvLm1ldGFkYXRhLmxheW91dH0gaW4gZmlsZSAke2RvY0luZm8udnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByY0xheW91dCA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgICAgIGZzcGF0aDogZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQsXG4gICAgICAgICAgICBjb250ZW50OiBmb3VuZC5kb2NDb250ZW50LFxuICAgICAgICAgICAgYm9keTogZm91bmQuZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7fVxuICAgICAgICB9O1xuICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiBmb3VuZC5tZXRhZGF0YSkge1xuICAgICAgICAgICAgcmNMYXlvdXQubWV0YWRhdGFbeXByb3BdID0gZm91bmQubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIGRvY0luZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIGlmICh5cHJvcCAhPT0gJ2xheW91dCcpIHtcbiAgICAgICAgICAgICAgICByY0xheW91dC5tZXRhZGF0YVt5cHJvcF0gPSBkb2NJbmZvLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByY0xheW91dC5tZXRhZGF0YS5jb250ZW50ID0gZG9jUmVuZGVyZWQ7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3VsdFxuICAgICAgICAgICAgICAgID0gYXdhaXQgcmVuZGVyQ29udGVudChjb25maWcsIHJjTGF5b3V0KTtcbiAgICAgICAgICAgIGxheW91dEZvcm1hdCA9IHJlc3VsdC5mb3JtYXQ7XG4gICAgICAgICAgICBsYXlvdXRSZW5kZXJlZCA9IHJlc3VsdC5yZW5kZXJlZDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbGV0IGVlID0gbmV3IEVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSB3aXRoICR7ZG9jSW5mby5tZXRhZGF0YS5sYXlvdXR9ICR7ZS5zdGFjayA/IGUuc3RhY2sgOiBlfWApO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlZSk7XG4gICAgICAgICAgICB0aHJvdyBlZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGxheW91dEZvcm1hdCA9IGRvY0Zvcm1hdDtcbiAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSBkb2NSZW5kZXJlZDtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgJHtkb2NJbmZvLnZwYXRofSBhZnRlciBsYXlvdXQgcmVuZGVyIGZvcm1hdCAke2xheW91dEZvcm1hdH0gYCwgcmVzdWx0KTtcblxuICAgIGNvbnN0IHJlbmRlclNlY29uZFJlbmRlciA9IG5ldyBEYXRlKCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoZG9jSW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGgsIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICAgXCJTRUNPTkQgUkVOREVSXCIsXG4gICAgICAgICAgICAgICAgICAgICAgcmVuZGVyU3RhcnQpO1xuXG4gICAgXG4gICAgLy8gTmV4dCBzdGVwIGlzIHRvIHJ1biBNYWhhYmh1dGEgb24gdGhlIHJlbmRlcmVkIGNvbnRlbnRcbiAgICAvLyBPZiBjb3Vyc2UsIE1haGFiaHV0YSBpcyBub3QgYXBwcm9wcmlhdGUgZm9yIGV2ZXJ5dGhpbmdcbiAgICAvLyBiZWNhdXNlIG5vdCBldmVyeXRoaW5nIGlzIEhUTUxcblxuICAgIGNvbnN0IGRvTWFoYWJodXRhID0gKGxheW91dEZvcm1hdCA9PT0gJ0hUTUwnKTtcbiAgICBpZiAoZG9NYWhhYmh1dGEpIHtcblxuICAgICAgICB0cnkge1xuXG4gICAgICAgICAgICBjb25zdCBtYWhhbWV0YWRhdGE6IGFueSA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgeXByb3AgaW4gZG9jSW5mby5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgIG1haGFtZXRhZGF0YVt5cHJvcF0gPSBkb2NJbmZvLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1haGFtZXRhZGF0YS5jb250ZW50ID0gZG9jUmVuZGVyZWQ7XG5cbiAgICAgICAgICAgIGlmIChkb2NJbmZvLm1ldGFkYXRhLmNvbmZpZy5tYWhhYmh1dGFDb25maWcpIHtcbiAgICAgICAgICAgICAgICBtYWhhYmh1dGEuY29uZmlnKGRvY0luZm8ubWV0YWRhdGEuY29uZmlnLm1haGFiaHV0YUNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgbWFoYW1ldGFkYXRhYCwgbWFoYW1ldGFkYXRhKTtcbiAgICAgICAgICAgIGxheW91dFJlbmRlcmVkID0gYXdhaXQgbWFoYWJodXRhLnByb2Nlc3NBc3luYyhcbiAgICAgICAgICAgICAgICBsYXlvdXRSZW5kZXJlZCwgbWFoYW1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGNvbmZpZy5tYWhhZnVuY3NcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIC8vIE9MRCBkb2NyZW5kZXJlZCA9IGF3YWl0IHRoaXMubWFoYXJ1bihsYXlvdXRyZW5kZXJlZCwgZG9jZGF0YSwgY29uZmlnLm1haGFmdW5jcyk7XG4gICAgICAgIH0gY2F0Y2ggKGUyKSB7XG4gICAgICAgICAgICBsZXQgZWVlID0gbmV3IEVycm9yKGBFcnJvciB3aXRoIE1haGFiaHV0YSAke2RvY0luZm8udnBhdGh9IHdpdGggJHtkb2NJbmZvLm1ldGFkYXRhLmxheW91dH0gJHtlMi5zdGFjayA/IGUyLnN0YWNrIDogZTJ9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVlZSk7XG4gICAgICAgICAgICB0aHJvdyBlZWU7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBkYXRhLnJlcG9ydChkb2NJbmZvLm1vdW50UG9pbnQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICBcIk1BSEFCSFVUQVwiLCByZW5kZXJTdGFydCk7XG5cbiAgICAgICAgY29uc3QgcmVuZGVyRGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBkb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlbmRlckRlc3QpLCB7XG4gICAgICAgICAgICByZWN1cnNpdmU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyRGVzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXRSZW5kZXJlZCwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFJFTkRFUkVEICR7cmVuZGVyZXIubmFtZX0gJHtkb2NJbmZvLnBhdGh9ID09PiAke3JlbmRlclRvRnBhdGh9YCk7XG4gICAgICAgIGNvbnN0IHJlbmRlckVuZFJlbmRlcmVkID0gbmV3IERhdGUoKTtcbiAgICAgICAgYXdhaXQgZGF0YS5yZXBvcnQoXG4gICAgICAgICAgICBkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICBjb25maWcucmVuZGVyVG8sXG4gICAgICAgICAgICBcIlJFTkRFUkVEXCIsIHJlbmRlclN0YXJ0KTtcbiAgICAgICAgcmV0dXJuIGAke2xheW91dEZvcm1hdH0gJHtkb2NJbmZvLnZwYXRofSA9PT4gJHtkb2NJbmZvLnJlbmRlclBhdGh9ICgkeyhyZW5kZXJFbmRSZW5kZXJlZC52YWx1ZU9mKCkgLSByZW5kZXJTdGFydC52YWx1ZU9mKCkpIC8gMTAwMH0gc2Vjb25kcylcXG4ke2F3YWl0IGRhdGEuZGF0YTRmaWxlKGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCl9YDtcbiAgICB9IGVsc2UgaWYgKGxheW91dEZvcm1hdCA9PT0gJ0NTUycpIHtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVuZGVyVG9GcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlclRvRGlyID0gcGF0aC5kaXJuYW1lKHJlbmRlclRvRnBhdGgpO1xuICAgICAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHJlbmRlclRvRGlyLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWN1cnNpdmU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlclRvRnBhdGgsIGxheW91dFJlbmRlcmVkLCAndXRmOCcpO1xuICAgICAgICAgICAgY29uc3QgcmVuZGVyRW5kUmVuZGVyZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgYXdhaXQgZGF0YS5yZXBvcnQoXG4gICAgICAgICAgICAgICAgZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbyxcbiAgICAgICAgICAgICAgICBcIlJFTkRFUkVEXCIsIHJlbmRlclN0YXJ0KTtcbiAgICAgICAgICAgIHJldHVybiBgJHtsYXlvdXRGb3JtYXR9ICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7ZG9jSW5mby5yZW5kZXJQYXRofSAoJHsocmVuZGVyRW5kUmVuZGVyZWQudmFsdWVPZigpIC0gcmVuZGVyU3RhcnQudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHMpXFxuJHthd2FpdCBkYXRhLmRhdGE0ZmlsZShkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgpfWA7XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbiBSRU5ERVIgQ1NTIGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluIFJFTkRFUiBDU1MgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlclRvRnBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJUb0RpciA9IHBhdGguZGlybmFtZShyZW5kZXJUb0ZwYXRoKTtcbiAgICAgICAgICAgIGF3YWl0IGZzcC5ta2RpcihyZW5kZXJUb0Rpciwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXdhaXQgZnNwLmNvcHlGaWxlKGRvY0luZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclRvRnBhdGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENPUElFRCAke2RvY0luZm8ucGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH1gKTtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlckVuZENvcGllZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICByZXR1cm4gYENPUFkgJHtkb2NJbmZvLnZwYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofSAoJHsocmVuZGVyRW5kQ29waWVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKWA7XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbiBjb3B5IGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluIGNvcHkgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBSZW5kZXIgYWxsIHRoZSBkb2N1bWVudHMgaW4gYSBzaXRlLCBsaW1pdGluZ1xuICogdGhlIG51bWJlciBvZiBzaW11bHRhbmVvdXMgcmVuZGVyaW5nIHRhc2tzXG4gKiB0byB0aGUgbnVtYmVyIGluIGNvbmZpZy5jb25jdXJyZW5jeS5cbiAqXG4gKiBAcGFyYW0gY29uZmlnXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyKGNvbmZpZykge1xuXG4gICAgY29uc3QgZG9jdW1lbnRzID0gPERvY3VtZW50c0ZpbGVDYWNoZT5jb25maWcuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdDQUxMSU5HIGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkJyk7XG4gICAgYXdhaXQgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKTtcbiAgICBcbiAgICAvLyAxLiBHYXRoZXIgbGlzdCBvZiBmaWxlcyBmcm9tIFJlbmRlckZpbGVDYWNoZVxuICAgIGNvbnN0IGZpbGV6ID0gYXdhaXQgZG9jdW1lbnRzLnBhdGhzKCk7XG4gICAgLy8gY29uc29sZS5sb2coYG5ld2VycmVuZGVyIGZpbGV6ICR7ZmlsZXoubGVuZ3RofWApO1xuXG4gICAgLy8gMi4gRXhjbHVkZSBhbnkgdGhhdCB3ZSB3YW50IHRvIGlnbm9yZVxuICAgIGNvbnN0IGZpbGV6MiA9IFtdIGFzIEFycmF5PHtcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgIH0+O1xuICAgIGZvciAobGV0IGVudHJ5IG9mIGZpbGV6KSB7XG4gICAgICAgIGxldCBpbmNsdWRlID0gdHJ1ZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZW50cnkpO1xuICAgICAgICBsZXQgc3RhdHM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdGF0cyA9IGF3YWl0IGZzcC5zdGF0KGVudHJ5LmZzcGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikgeyBzdGF0cyA9IHVuZGVmaW5lZDsgfVxuICAgICAgICBpZiAoIWVudHJ5KSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIGVsc2UgaWYgKCFzdGF0cyB8fCBzdGF0cy5pc0RpcmVjdG9yeSgpKSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIC8vIFRoaXMgc2hvdWxkIGFyaXNlIHVzaW5nIGFuIGlnbm9yZSBjbGF1c2VcbiAgICAgICAgLy8gZWxzZSBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS52cGF0aCkgPT09ICcuRFNfU3RvcmUnKSBpbmNsdWRlID0gZmFsc2U7XG4gICAgICAgIC8vIGVsc2UgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkudnBhdGgpID09PSAnLnBsYWNlaG9sZGVyJykgaW5jbHVkZSA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChpbmNsdWRlKSB7XG4gICAgICAgICAgICAvLyBUaGUgcXVldWUgaXMgYW4gYXJyYXkgb2YgdHVwbGVzIGNvbnRhaW5pbmcgdGhlXG4gICAgICAgICAgICAvLyBjb25maWcgb2JqZWN0IGFuZCB0aGUgcGF0aCBzdHJpbmdcbiAgICAgICAgICAgIGZpbGV6Mi5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb25maWc6IGNvbmZpZyxcbiAgICAgICAgICAgICAgICBpbmZvOiBhd2FpdCBkb2N1bWVudHMuZmluZChlbnRyeS52cGF0aClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGBuZXdlcnJlbmRlciBmaWxlejIgYWZ0ZXIgaWdub3JlICR7ZmlsZXoyLmxlbmd0aH1gKTtcblxuXG4gICAgLy8gMy4gTWFrZSBhIGZhc3RxIHRvIHByb2Nlc3MgdXNpbmcgcmVuZGVyRG9jdW1lbnQsXG4gICAgLy8gICAgcHVzaGluZyByZXN1bHRzIHRvIHRoZSByZXN1bHRzIGFycmF5XG5cbiAgICAvLyBUaGlzIHNldHMgdXAgdGhlIHF1ZXVlIHByb2Nlc3NvclxuICAgIC8vIFRoZSBjb25jdXJyZW5jeSBzZXR0aW5nIGxldHMgdXMgcHJvY2VzcyBkb2N1bWVudHNcbiAgICAvLyBpbiBwYXJhbGxlbCB3aGlsZSBsaW1pdGluZyB0b3RhbCBpbXBhY3QuXG4gICAgY29uc3QgcXVldWU6IHF1ZXVlQXNQcm9taXNlZDx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PiA9IGZhc3RxLnByb21pc2UoXG5cbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbnZva2VkIGZvciBlYWNoIGVudHJ5IGluIHRoZVxuICAgICAgICAvLyBxdWV1ZS4gSXQgaGFuZGxlcyByZW5kZXJpbmcgdGhlIHF1ZXVlXG4gICAgICAgIC8vIFRoZSBxdWV1ZSBoYXMgY29uZmlnIG9iamVjdHMgYW5kIHBhdGggc3RyaW5nc1xuICAgICAgICAvLyB3aGljaCBpcyBleGFjdGx5IHdoYXQncyByZXF1aXJlZCBieVxuICAgICAgICAvLyByZW5kZXJEb2N1bWVudFxuICAgICAgICBhc3luYyBmdW5jdGlvbiByZW5kZXJEb2N1bWVudEluUXVldWUoZW50cnkpXG4gICAgICAgICAgICA6IFByb21pc2U8eyByZXN1bHQ/OiBhbnk7IGVycm9yPzogYW55OyB9PlxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnRJblF1ZXVlICR7ZW50cnkuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHJlbmRlckRvY3VtZW50KFxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5jb25maWcsIGVudHJ5LmluZm9cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBET05FIHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyByZXN1bHQgfTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEVSUk9SIHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCwgZXJyb3Iuc3RhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZy5jb25jdXJyZW5jeSk7XG5cbiAgICAvLyBxdWV1ZS5wdXNoIHJldHVybnMgYSBQcm9taXNlIHRoYXQncyBmdWxmaWxsZWQgd2hlblxuICAgIC8vIHRoZSB0YXNrIGZpbmlzaGVzLlxuICAgIC8vIEhlbmNlIHdhaXRGb3IgaXMgYW4gYXJyYXkgb2YgUHJvbWlzZXMuXG4gICAgY29uc3Qgd2FpdEZvciA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5IG9mIGZpbGV6Mikge1xuICAgICAgICB3YWl0Rm9yLnB1c2gocXVldWUucHVzaChlbnRyeSkpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgYXV0b21hdGljYWxseSB3YWl0cyBmb3IgYWxsIHRob3NlXG4gICAgLy8gUHJvbWlzZXMgdG8gcmVzb2x2ZSwgd2hpbGUgbWFraW5nIHRoZSByZXN1bHRzXG4gICAgLy8gYXJyYXkgY29udGFpbiByZXN1bHRzLlxuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGxldCByZXN1bHQgb2Ygd2FpdEZvcikge1xuICAgICAgICByZXN1bHRzLnB1c2goYXdhaXQgcmVzdWx0KTtcbiAgICB9XG5cbiAgICAvLyA0LiBJbnZva2UgaG9va1NpdGVSZW5kZXJlZFxuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ0ludm9raW5nIGhvb2tTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgYXdhaXQgY29uZmlnLmhvb2tTaXRlUmVuZGVyZWQoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaG9va1NpdGVSZW5kZXJlZCBmYWlsZWQgYmVjYXVzZSAke2V9YCk7XG4gICAgfVxuXG4gICAgLy8gNS4gcmV0dXJuIHJlc3VsdHNcbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG4iXX0=