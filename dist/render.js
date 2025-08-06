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
            const result = await renderContent(config, rcLayout);
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
    // console.log(`renderDocument ${docInfo.vpath} after layout render format ${layoutFormat} `);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUVsQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFRMUIsMERBQTBEO0FBRTFEOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxxQkFBcUIsQ0FDdkMsTUFBcUIsRUFDckIsT0FNQztJQUlELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FDaEMsT0FBTyxDQUFDLEtBQUssQ0FDcEIsQ0FBQztJQUVGLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUM7UUFDOUIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUTtRQUN6QixRQUFRLEVBQUUsRUFBRTtLQUNmLENBQUMsQ0FBQztJQUVILHNDQUFzQztJQUN0QyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDNUIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDdEMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQztJQUNGLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLENBQUMsS0FB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QUFxQjtJQUNyQix5Q0FBeUM7SUFDekMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLEtBQUssSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7UUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxnREFBZ0Q7SUFDaEQseUJBQXlCO0lBQ3pCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNuQixLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsNkJBQTZCO0lBRTdCLElBQUksQ0FBQztRQUNELDRDQUE0QztRQUM1QyxNQUFNLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsb0JBQW9CO0lBQ3BCLE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUM7QUFBQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgKiBhcyBkYXRhIGZyb20gJy4vZGF0YS5qcyc7XG5pbXBvcnQgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5cbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgdHlwZSB7IHF1ZXVlQXNQcm9taXNlZCB9IGZyb20gXCJmYXN0cVwiO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vaW5kZXguanMnO1xuaW1wb3J0IHsgUmVuZGVyaW5nQ29udGV4dCB9IGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCB7XG4gICAgRG9jdW1lbnRzRmlsZUNhY2hlLCBEb2N1bWVudFxufSBmcm9tICcuL2NhY2hlL2ZpbGUtY2FjaGUtc3FsaXRlLmpzJztcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFdoZXJlIHJlbmRlckRvY3VtZW50IGlzIG1lYW50IGZvciBhIGRvY3VtZW50IG9uIGRpc2tcbiAqIGFuZCBpbmRleGVkIGJ5IGEgRG9jdW1lbnRzRmlsZUNhY2hlIGluc3RhbmNlLCB0aGlzXG4gKiBmdW5jdGlvbiBpcyBtZWFudCBmb3IgZG9jdW1lbnRzIGNyZWF0ZWQgZnJvbSBpbi1tZW1vcnlcbiAqIGRhdGEuICBGb3IgaW5zdGFuY2UsIHRoZSB0YWdnZWQtY29udGVudCBwbHVnaW4gZ2VuZXJhdGVzXG4gKiB0YWcgcGFnZXMgbGlzdGluZyBsaW5rcyB0byBkb2N1bWVudHMgYmFzZWQgb24gdGhlaXIgdGFnLlxuICogVGhlc2UgcGFnZXMgYXJlIGluc3RhbnRpYXRlIG91dCBvZiBkYXRhIHJhdGhlciB0aGFuXG4gKiBleGlzdGluZyBvbi1kaXNrLlxuICpcbiAqIFJlcXVpcmVkIGRhdGE6XG4gKiAgICAgKiBCbGFuayBwYWdlIC0gd2l0aCBmcm9udG1hdHRlciBpbmNsdWRpbmcgYSBcImxheW91dFwiIHRlbXBsYXRlIHJlZmVyZW5jZVxuICogICAgICogRmlsZS1uYW1lIHRvIHVzZSBmb3IgdmlydHVhbCBwYWdlLCB3aGljaCBhbHNvIGRldGVybWluZXMgdGhlIHJlbmRlcmVkIG91dHB1dCBmaWxlXG4gKiAgICAgKiBNZXRhZGF0YSBkZXJpdmVkIGZyb20gdGhlIGZyb250bWF0dGVyIGFuZCBmaWxsZWQgd2l0aCBvdGhlciBzdHVmZiBpbmNsdWRpbmcgdGhlIGRhdGEgdG8gcmVuZGVyIGludG8gdGhlIHBhZ2UsICBcbiAqXG4gKiBAcGFyYW0gY29uZmlnIFxuICogQHBhcmFtIGRvY0luZm8gXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJWaXJ0dWFsRG9jdW1lbnQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm86IHtcbiAgICAgICAgLy8gVGhlIHZpcnR1YWwgcGF0aG5hbWVcbiAgICAgICAgdnBhdGg6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIGRvY3VtZW50IHRvIHJlbmRlciBhcyBpZiBpdCdzXG4gICAgICAgIC8vIGF0IHRoYXQgcGF0aFxuICAgICAgICBkb2N1bWVudDogc3RyaW5nO1xuICAgIH1cbikge1xuXG5cbiAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKFxuICAgICAgICAgICAgZG9jSW5mby52cGF0aFxuICAgICk7XG5cbiAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoe1xuICAgICAgICBmc3BhdGg6IGRvY0luZm8udnBhdGgsXG4gICAgICAgIGNvbnRlbnQ6IGRvY0luZm8uZG9jdW1lbnQsXG4gICAgICAgIG1ldGFkYXRhOiB7fVxuICAgIH0pO1xuXG4gICAgLy8gQWRkIG5lY2Vzc2FyeSBpdGVtcyB0byB0aGUgbWV0YWRhdGFcbiAgICByYy5tZXRhZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgcmMubWV0YWRhdGEucGFydGlhbCA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsU3luYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgcmMubWV0YWRhdGEuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICByYy5tZXRhZGF0YS5wbHVnaW4gPSBjb25maWcucGx1Z2luO1xuXG4gICAgLy8gUmVuZGVyIHRoZSBwcmltYXJ5IGNvbnRlbnRcbiAgICBsZXQgZG9jcmVuZGVyZWQgPSBhd2FpdCByZW5kZXJlci5yZW5kZXIocmMpO1xuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSBsYXlvdXQgdGVtcGxhdGUsIHJlbmRlciB0aGF0XG4gICAgLy8gdGVtcGxhdGUgcGFzc2luZyB0aGUgcmVuZGVyZWQgcHJpbWFyeSBjb250ZW50XG4gICAgbGV0IGxheW91dHJlbmRlcmVkO1xuICAgIGlmIChyYy5tZXRhZGF0YS5sYXlvdXQpIHtcbiAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGFcbiAgICAgICAgICAgICAgICAuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgY29uc3QgbGF5b3V0SW5mbyA9IGF3YWl0IGxheW91dHMuZmluZChyYy5tZXRhZGF0YS5sYXlvdXQpO1xuICAgICAgICBpZiAoIWxheW91dEluZm8pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gbGF5b3V0IGZvdW5kIGluICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5sYXlvdXREaXJzKX0gZm9yICR7cmMubWV0YWRhdGEubGF5b3V0fSBpbiBmaWxlICR7ZG9jSW5mby52cGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJ1aWxkIHRoZSBtZXRhZGF0YSBmb3IgdGhlIGxheW91dCByZW5kZXJpbmdcbiAgICAgICAgbGV0IGxheW91dG1ldGFkYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgeXByb3AgaW4gbGF5b3V0SW5mby5tZXRhZGF0YSkge1xuICAgICAgICAgICAgbGF5b3V0bWV0YWRhdGFbeXByb3BdID0gbGF5b3V0SW5mby5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgeXByb3AgaW4gcmMubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIGlmICh5cHJvcCAhPT0gJ2xheW91dCcpIHtcbiAgICAgICAgICAgICAgICBsYXlvdXRtZXRhZGF0YVt5cHJvcF0gPSByYy5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYWtlIHRoZSBmaXJzdCByZW5kZXJpbmcgYXZhaWxhYmxlXG4gICAgICAgIC8vIGluIHRoZSBtZXRhZGF0YSBhcyBcImNvbnRlbnRcIiB2YXJpYWJsZVxuICAgICAgICBsYXlvdXRtZXRhZGF0YS5jb250ZW50ID0gZG9jcmVuZGVyZWQ7XG5cbiAgICAgICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgICAgIHJjLm1ldGFkYXRhLmxheW91dFxuICAgICAgICApO1xuXG4gICAgICAgIGlmICghcmVuZGVyZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcmVuZGVyZXIgZm9yICR7bGF5b3V0bWV0YWRhdGEubGF5b3V0fSBpbiBmaWxlICR7ZG9jSW5mby52cGF0aH1gKTs7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsYXlvdXRDb250ZXh0ID0ge1xuICAgICAgICAgICAgZnNwYXRoOiBsYXlvdXRJbmZvLmZzcGF0aCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGxheW91dEluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIGJvZHk6IGxheW91dEluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBsYXlvdXRtZXRhZGF0YVxuICAgICAgICB9O1xuXG4gICAgICAgIGxheW91dHJlbmRlcmVkXG4gICAgICAgID0gYXdhaXQgcmVuZGVyZXIucmVuZGVyKGxheW91dENvbnRleHQpO1xuXG4gICAgfVxuXG4gICAgLy8gRm9yIEhUTUwgcmVuZGVyaW5nLCBmdW4gTWFoYWJodXRhIGZ1bmN0aW9uc1xuICAgIGNvbnN0IGZvcm1hdCA9IHJlbmRlcmVyLnJlbmRlckZvcm1hdChyYyk7XG4gICAgY29uc3QgZG9NYWhhYmh1dGEgPSAoZm9ybWF0ID09PSAnSFRNTCcpO1xuXG4gICAgaWYgKGRvTWFoYWJodXRhKSB7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBtYWhhbWV0YWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiByYy5tZXRhZGF0YSkge1xuICAgICAgICAgICAgbWFoYW1ldGFkYXRhW3lwcm9wXSA9IHJjLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBtYWhhbWV0YWRhdGEuY29udGVudCA9IGRvY3JlbmRlcmVkO1xuXG4gICAgICAgIGlmIChyYy5tZXRhZGF0YS5jb25maWcubWFoYWJodXRhQ29uZmlnKSB7XG4gICAgICAgICAgICBtYWhhYmh1dGEuY29uZmlnKHJjLm1ldGFkYXRhLmNvbmZpZy5tYWhhYmh1dGFDb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGF5b3V0cmVuZGVyZWQgPSBhd2FpdCBtYWhhYmh1dGEucHJvY2Vzc0FzeW5jKFxuICAgICAgICAgICAgdHlwZW9mIGxheW91dHJlbmRlcmVkID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICA/IGxheW91dHJlbmRlcmVkXG4gICAgICAgICAgICAgICAgICAgIDogZG9jcmVuZGVyZWQsXG4gICAgICAgICAgICBtYWhhbWV0YWRhdGEsXG4gICAgICAgICAgICBjb25maWcubWFoYWZ1bmNzXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gbGF5b3V0cmVuZGVyZWQgZ2V0cyB0aGUgZmluYWwgcmVuZGVyaW5nXG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBUaGUgY29yZSBwYXJ0IG9mIHJlbmRlcmluZyBjb250ZW50IHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBUaGlzIGZ1bmN0aW9uIGxvb2tzIGZvciB0aGUgcmVuZGVyZXIsIGFuZCBpZiBub25lIGlzXG4gKiBmb3VuZCBpdCBzaW1wbHkgcmV0dXJucy4gIEl0IHRoZW4gZG9lcyBhIGxpdHRsZSBzZXR1cFxuICogdG8gdGhlIG1ldGFkYXRhIG9iamVjdCwgYW5kIGNhbGxzIHRoZSByZW5kZXIgZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0gY29uZmlnIC0gQWthc2hhQ01TIENvbmZpZ3VyYXRpb25cbiAqIEBwYXJhbSByYyAtIFJlbmRlcmluZ0NvbnRleHQgZm9yIHVzZSB3aXRoIFJlbmRlcmVyc1xuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJDb250ZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICByYzogUmVuZGVyaW5nQ29udGV4dFxuKVxuICAgIC8vIFRoZSByZXR1cm4gaXMgYSBzaW1wbGUgb2JqZWN0XG4gICAgLy8gY29udGFpbmluZyB1c2VmdWwgZGF0YVxuICAgIDogUHJvbWlzZTx7XG4gICAgICAgIHJlbmRlcmVyTmFtZT86IHN0cmluZyxcbiAgICAgICAgZm9ybWF0Pzogc3RyaW5nLFxuICAgICAgICByZW5kZXJlZDogc3RyaW5nXG4gICAgfT5cbntcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ29udGVudCBgLCByYyk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgcmMuZnNwYXRoXG4gICAgKTtcbiAgICBpZiAoIXJlbmRlcmVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZW5kZXJlck5hbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGZvcm1hdDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcmVuZGVyZWQ6IHJjLmJvZHlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBBZGQgbmVjZXNzYXJ5IGl0ZW1zIHRvIHRoZSBtZXRhZGF0YVxuICAgIHJjLm1ldGFkYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIHJjLm1ldGFkYXRhLnBhcnRpYWxTeW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgIHJjLm1ldGFkYXRhLnBsdWdpbiA9IGNvbmZpZy5wbHVnaW47XG5cbiAgICAvLyBSZW5kZXIgdGhlIHByaW1hcnkgY29udGVudFxuICAgIGxldCBkb2NyZW5kZXJlZCA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihyYyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyQ29udGVudCByZW5kZXJlZD1gLCBkb2NyZW5kZXJlZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyZXJOYW1lOiByZW5kZXJlci5uYW1lLFxuICAgICAgICBmb3JtYXQ6IHJlbmRlcmVyLnJlbmRlckZvcm1hdChyYyksXG4gICAgICAgIHJlbmRlcmVkOiBkb2NyZW5kZXJlZFxuICAgIH07XG59XG5cbi8qKlxuICogUmVuZGVyIGEgZG9jdW1lbnQsIGFjY291bnRpbmcgZm9yIHRoZSBtYWluIGNvbnRlbnQsXG4gKiBhIGxheW91dCB0ZW1wbGF0ZSAoaWYgYW55KSwgYW5kIE1haGFiaHV0YSAoaWYgdGhlIGNvbnRlbnRcbiAqIG91dHB1dCBpcyBIVE1MKS4gIFRoaXMgYWxzbyBoYW5kbGVzIHJlbmRlcmluZyBvdGhlciB0eXBlc1xuICogb2YgY29udGVudCBzdWNoIGFzIExFU1MgQ1NTIGZpbGVzLlxuICpcbiAqIEBwYXJhbSBjb25maWcgXG4gKiBAcGFyYW0gZG9jSW5mbyBcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRvY0luZm9cbik6IFByb21pc2U8c3RyaW5nPlxue1xuICAgIGNvbnN0IHJlbmRlclN0YXJ0ID0gbmV3IERhdGUoKTtcblxuICAgIC8vIFJlbmRlciB0aGUgbWFpbiBjb250ZW50XG5cbiAgICBjb25zdCByYyA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgZnNwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgIGJvZHk6IGRvY0luZm8uZG9jQm9keSxcbiAgICAgICAgbWV0YWRhdGE6IGRvY0luZm8ubWV0YWRhdGFcbiAgICB9O1xuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50IGNvbnRleHQ9ICR7cmMuZnNwYXRofWApXG5cbiAgICBsZXQgZG9jRm9ybWF0OyAgICAgIC8vIEtub3dpbmcgdGhlIGZvcm1hdCBcbiAgICBsZXQgZG9jUmVuZGVyZWQ7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVuZGVyQ29udGVudChjb25maWcsIHJjKTtcbiAgICAgICAgZG9jRm9ybWF0ID0gcmVzdWx0LmZvcm1hdDtcbiAgICAgICAgZG9jUmVuZGVyZWQgPSByZXN1bHQucmVuZGVyZWQ7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9ICR7KGVyci5zdGFjayA/IGVyci5zdGFjayA6IGVycil9YCk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gJHsoZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyKX1gKTtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50ICR7ZG9jSW5mby52cGF0aH0gcmVuZGVyZWQ9YCwgZG9jUmVuZGVyZWQpO1xuICAgIGF3YWl0IGRhdGEucmVwb3J0KGRvY0luZm8ubW91bnRQb2ludCwgXG4gICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIFxuICAgICAgICAgICAgICAgICAgICAgXCJGSVJTVCBSRU5ERVJcIiwgcmVuZGVyU3RhcnQpO1xuXG4gICAgLy8gUmVuZGVyIHRoZSBtYWluIGNvbnRlbnQgaW50byBhIGxheW91dCB0ZW1wbGF0ZSxcbiAgICAvLyBpZiBvbmUgaXMgc3BlY2lmaWVkXG5cbiAgICBsZXQgbGF5b3V0Rm9ybWF0O1xuICAgIGxldCBsYXlvdXRSZW5kZXJlZDtcbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgbGF5b3V0ICR7ZG9jSW5mbz8ubWV0YWRhdGE/LmxheW91dH0gZG9jTWV0YWRhdGEgJHt1dGlsLmluc3BlY3QoZG9jSW5mby5kb2NNZXRhZGF0YSl9IG1ldGFkYXRhICR7dXRpbC5pbnNwZWN0KGRvY0luZm8ubWV0YWRhdGEpfWApO1xuICAgIGlmIChkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0KSB7XG5cbiAgICAgICAgY29uc3QgbGF5b3V0cyA9IGNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgbGF5b3V0cy5pc1JlYWR5KCk7XG5cbiAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgbGF5b3V0cy5maW5kKGRvY0luZm8ubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBsYXlvdXQgZm91bmQgaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLmxheW91dERpcnMpfSBmb3IgJHtkb2NJbmZvLm1ldGFkYXRhLmxheW91dH0gaW4gZmlsZSAke2RvY0luZm8udnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByY0xheW91dCA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgICAgIGZzcGF0aDogZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQsXG4gICAgICAgICAgICBjb250ZW50OiBmb3VuZC5kb2NDb250ZW50LFxuICAgICAgICAgICAgYm9keTogZm91bmQuZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7fVxuICAgICAgICB9O1xuICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiBmb3VuZC5tZXRhZGF0YSkge1xuICAgICAgICAgICAgcmNMYXlvdXQubWV0YWRhdGFbeXByb3BdID0gZm91bmQubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIGRvY0luZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIGlmICh5cHJvcCAhPT0gJ2xheW91dCcpIHtcbiAgICAgICAgICAgICAgICByY0xheW91dC5tZXRhZGF0YVt5cHJvcF0gPSBkb2NJbmZvLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByY0xheW91dC5tZXRhZGF0YS5jb250ZW50ID0gZG9jUmVuZGVyZWQ7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdFxuICAgICAgICAgICAgICAgID0gYXdhaXQgcmVuZGVyQ29udGVudChjb25maWcsIHJjTGF5b3V0KTtcbiAgICAgICAgICAgIGxheW91dEZvcm1hdCA9IHJlc3VsdC5mb3JtYXQ7XG4gICAgICAgICAgICBsYXlvdXRSZW5kZXJlZCA9IHJlc3VsdC5yZW5kZXJlZDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbGV0IGVlID0gbmV3IEVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSB3aXRoICR7ZG9jSW5mby5tZXRhZGF0YS5sYXlvdXR9ICR7ZS5zdGFjayA/IGUuc3RhY2sgOiBlfWApO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlZSk7XG4gICAgICAgICAgICB0aHJvdyBlZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGxheW91dEZvcm1hdCA9IGRvY0Zvcm1hdDtcbiAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSBkb2NSZW5kZXJlZDtcbiAgICB9XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgJHtkb2NJbmZvLnZwYXRofSBhZnRlciBsYXlvdXQgcmVuZGVyIGZvcm1hdCAke2xheW91dEZvcm1hdH0gYCk7XG5cbiAgICBjb25zdCByZW5kZXJTZWNvbmRSZW5kZXIgPSBuZXcgRGF0ZSgpO1xuICAgIGF3YWl0IGRhdGEucmVwb3J0KGRvY0luZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLnZwYXRoLCBjb25maWcucmVuZGVyVG8sIFxuICAgICAgICAgICAgICAgICAgICAgIFwiU0VDT05EIFJFTkRFUlwiLFxuICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclN0YXJ0KTtcblxuICAgIFxuICAgIC8vIE5leHQgc3RlcCBpcyB0byBydW4gTWFoYWJodXRhIG9uIHRoZSByZW5kZXJlZCBjb250ZW50XG4gICAgLy8gT2YgY291cnNlLCBNYWhhYmh1dGEgaXMgbm90IGFwcHJvcHJpYXRlIGZvciBldmVyeXRoaW5nXG4gICAgLy8gYmVjYXVzZSBub3QgZXZlcnl0aGluZyBpcyBIVE1MXG5cbiAgICBjb25zdCBkb01haGFiaHV0YSA9IChsYXlvdXRGb3JtYXQgPT09ICdIVE1MJyk7XG4gICAgaWYgKGRvTWFoYWJodXRhKSB7XG5cbiAgICAgICAgdHJ5IHtcblxuICAgICAgICAgICAgY29uc3QgbWFoYW1ldGFkYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIHlwcm9wIGluIGRvY0luZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICBtYWhhbWV0YWRhdGFbeXByb3BdID0gZG9jSW5mby5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtYWhhbWV0YWRhdGEuY29udGVudCA9IGRvY1JlbmRlcmVkO1xuXG4gICAgICAgICAgICBpZiAoZG9jSW5mby5tZXRhZGF0YS5jb25maWcubWFoYWJodXRhQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgbWFoYWJodXRhLmNvbmZpZyhkb2NJbmZvLm1ldGFkYXRhLmNvbmZpZy5tYWhhYmh1dGFDb25maWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYG1haGFtZXRhZGF0YWAsIG1haGFtZXRhZGF0YSk7XG4gICAgICAgICAgICBsYXlvdXRSZW5kZXJlZCA9IGF3YWl0IG1haGFiaHV0YS5wcm9jZXNzQXN5bmMoXG4gICAgICAgICAgICAgICAgbGF5b3V0UmVuZGVyZWQsIG1haGFtZXRhZGF0YSxcbiAgICAgICAgICAgICAgICBjb25maWcubWFoYWZ1bmNzXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAvLyBPTEQgZG9jcmVuZGVyZWQgPSBhd2FpdCB0aGlzLm1haGFydW4obGF5b3V0cmVuZGVyZWQsIGRvY2RhdGEsIGNvbmZpZy5tYWhhZnVuY3MpO1xuICAgICAgICB9IGNhdGNoIChlMikge1xuICAgICAgICAgICAgbGV0IGVlZSA9IG5ldyBFcnJvcihgRXJyb3Igd2l0aCBNYWhhYmh1dGEgJHtkb2NJbmZvLnZwYXRofSB3aXRoICR7ZG9jSW5mby5tZXRhZGF0YS5sYXlvdXR9ICR7ZTIuc3RhY2sgPyBlMi5zdGFjayA6IGUyfWApO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlZWUpO1xuICAgICAgICAgICAgdGhyb3cgZWVlO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgZGF0YS5yZXBvcnQoZG9jSW5mby5tb3VudFBvaW50LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXCJNQUhBQkhVVEFcIiwgcmVuZGVyU3RhcnQpO1xuXG4gICAgICAgIGNvbnN0IHJlbmRlckRlc3QgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZW5kZXJEZXN0KSwge1xuICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBmc3Aud3JpdGVGaWxlKHJlbmRlckRlc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0UmVuZGVyZWQsICd1dGYtOCcpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBSRU5ERVJFRCAke3JlbmRlcmVyLm5hbWV9ICR7ZG9jSW5mby5wYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofWApO1xuICAgICAgICBjb25zdCByZW5kZXJFbmRSZW5kZXJlZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGF3YWl0IGRhdGEucmVwb3J0KFxuICAgICAgICAgICAgZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLFxuICAgICAgICAgICAgXCJSRU5ERVJFRFwiLCByZW5kZXJTdGFydCk7XG4gICAgICAgIHJldHVybiBgJHtsYXlvdXRGb3JtYXR9ICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7ZG9jSW5mby5yZW5kZXJQYXRofSAoJHsocmVuZGVyRW5kUmVuZGVyZWQudmFsdWVPZigpIC0gcmVuZGVyU3RhcnQudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHMpXFxuJHthd2FpdCBkYXRhLmRhdGE0ZmlsZShkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgpfWA7XG4gICAgfSBlbHNlIGlmIChsYXlvdXRGb3JtYXQgPT09ICdDU1MnKSB7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlclRvRnBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJUb0RpciA9IHBhdGguZGlybmFtZShyZW5kZXJUb0ZwYXRoKTtcbiAgICAgICAgICAgIGF3YWl0IGZzcC5ta2RpcihyZW5kZXJUb0Rpciwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJUb0ZwYXRoLCBsYXlvdXRSZW5kZXJlZCwgJ3V0ZjgnKTtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlckVuZFJlbmRlcmVkID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGF3YWl0IGRhdGEucmVwb3J0KFxuICAgICAgICAgICAgICAgIGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sXG4gICAgICAgICAgICAgICAgXCJSRU5ERVJFRFwiLCByZW5kZXJTdGFydCk7XG4gICAgICAgICAgICByZXR1cm4gYCR7bGF5b3V0Rm9ybWF0fSAke2RvY0luZm8udnBhdGh9ID09PiAke2RvY0luZm8ucmVuZGVyUGF0aH0gKCR7KHJlbmRlckVuZFJlbmRlcmVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKVxcbiR7YXdhaXQgZGF0YS5kYXRhNGZpbGUoZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoKX1gO1xuICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW4gUkVOREVSIENTUyBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbiBSRU5ERVIgQ1NTIGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJUb0ZwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBkb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICAgICAgY29uc3QgcmVuZGVyVG9EaXIgPSBwYXRoLmRpcm5hbWUocmVuZGVyVG9GcGF0aCk7XG4gICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocmVuZGVyVG9EaXIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGF3YWl0IGZzcC5jb3B5RmlsZShkb2NJbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJUb0ZwYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDT1BJRUQgJHtkb2NJbmZvLnBhdGh9ID09PiAke3JlbmRlclRvRnBhdGh9YCk7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJFbmRDb3BpZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgcmV0dXJuIGBDT1BZICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH0gKCR7KHJlbmRlckVuZENvcGllZC52YWx1ZU9mKCkgLSByZW5kZXJTdGFydC52YWx1ZU9mKCkpIC8gMTAwMH0gc2Vjb25kcylgO1xuICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW4gY29weSBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbiBjb3B5IGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogUmVuZGVyIGFsbCB0aGUgZG9jdW1lbnRzIGluIGEgc2l0ZSwgbGltaXRpbmdcbiAqIHRoZSBudW1iZXIgb2Ygc2ltdWx0YW5lb3VzIHJlbmRlcmluZyB0YXNrc1xuICogdG8gdGhlIG51bWJlciBpbiBjb25maWcuY29uY3VycmVuY3kuXG4gKlxuICogQHBhcmFtIGNvbmZpZ1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlcihjb25maWcpIHtcblxuICAgIGNvbnN0IGRvY3VtZW50cyA9IDxEb2N1bWVudHNGaWxlQ2FjaGU+Y29uZmlnLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAvLyBjb25zb2xlLmxvZygnQ0FMTElORyBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCcpO1xuICAgIGF3YWl0IGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkKCk7XG4gICAgXG4gICAgLy8gMS4gR2F0aGVyIGxpc3Qgb2YgZmlsZXMgZnJvbSBSZW5kZXJGaWxlQ2FjaGVcbiAgICBjb25zdCBmaWxleiA9IGF3YWl0IGRvY3VtZW50cy5wYXRocygpO1xuICAgIC8vIGNvbnNvbGUubG9nKGBuZXdlcnJlbmRlciBmaWxleiAke2ZpbGV6Lmxlbmd0aH1gKTtcblxuICAgIC8vIDIuIEV4Y2x1ZGUgYW55IHRoYXQgd2Ugd2FudCB0byBpZ25vcmVcbiAgICBjb25zdCBmaWxlejIgPSBbXSBhcyBBcnJheTx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PjtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxleikge1xuICAgICAgICBsZXQgaW5jbHVkZSA9IHRydWU7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGVudHJ5KTtcbiAgICAgICAgbGV0IHN0YXRzO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RhdHMgPSBhd2FpdCBmc3Auc3RhdChlbnRyeS5mc3BhdGgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHsgc3RhdHMgPSB1bmRlZmluZWQ7IH1cbiAgICAgICAgaWYgKCFlbnRyeSkgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICBlbHNlIGlmICghc3RhdHMgfHwgc3RhdHMuaXNEaXJlY3RvcnkoKSkgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICAvLyBUaGlzIHNob3VsZCBhcmlzZSB1c2luZyBhbiBpZ25vcmUgY2xhdXNlXG4gICAgICAgIC8vIGVsc2UgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkudnBhdGgpID09PSAnLkRTX1N0b3JlJykgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICAvLyBlbHNlIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LnZwYXRoKSA9PT0gJy5wbGFjZWhvbGRlcicpIGluY2x1ZGUgPSBmYWxzZTtcblxuICAgICAgICBpZiAoaW5jbHVkZSkge1xuICAgICAgICAgICAgLy8gVGhlIHF1ZXVlIGlzIGFuIGFycmF5IG9mIHR1cGxlcyBjb250YWluaW5nIHRoZVxuICAgICAgICAgICAgLy8gY29uZmlnIG9iamVjdCBhbmQgdGhlIHBhdGggc3RyaW5nXG4gICAgICAgICAgICBmaWxlejIucHVzaCh7XG4gICAgICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXG4gICAgICAgICAgICAgICAgaW5mbzogYXdhaXQgZG9jdW1lbnRzLmZpbmQoZW50cnkudnBhdGgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgbmV3ZXJyZW5kZXIgZmlsZXoyIGFmdGVyIGlnbm9yZSAke2ZpbGV6Mi5sZW5ndGh9YCk7XG5cblxuICAgIC8vIDMuIE1ha2UgYSBmYXN0cSB0byBwcm9jZXNzIHVzaW5nIHJlbmRlckRvY3VtZW50LFxuICAgIC8vICAgIHB1c2hpbmcgcmVzdWx0cyB0byB0aGUgcmVzdWx0cyBhcnJheVxuXG4gICAgLy8gVGhpcyBzZXRzIHVwIHRoZSBxdWV1ZSBwcm9jZXNzb3JcbiAgICAvLyBUaGUgY29uY3VycmVuY3kgc2V0dGluZyBsZXRzIHVzIHByb2Nlc3MgZG9jdW1lbnRzXG4gICAgLy8gaW4gcGFyYWxsZWwgd2hpbGUgbGltaXRpbmcgdG90YWwgaW1wYWN0LlxuICAgIGNvbnN0IHF1ZXVlOiBxdWV1ZUFzUHJvbWlzZWQ8e1xuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgfT4gPSBmYXN0cS5wcm9taXNlKFxuXG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgaW52b2tlZCBmb3IgZWFjaCBlbnRyeSBpbiB0aGVcbiAgICAgICAgLy8gcXVldWUuIEl0IGhhbmRsZXMgcmVuZGVyaW5nIHRoZSBxdWV1ZVxuICAgICAgICAvLyBUaGUgcXVldWUgaGFzIGNvbmZpZyBvYmplY3RzIGFuZCBwYXRoIHN0cmluZ3NcbiAgICAgICAgLy8gd2hpY2ggaXMgZXhhY3RseSB3aGF0J3MgcmVxdWlyZWQgYnlcbiAgICAgICAgLy8gcmVuZGVyRG9jdW1lbnRcbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnRJblF1ZXVlKGVudHJ5KVxuICAgICAgICAgICAgOiBQcm9taXNlPHsgcmVzdWx0PzogYW55OyBlcnJvcj86IGFueTsgfT5cbiAgICAgICAge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudChcbiAgICAgICAgICAgICAgICAgICAgZW50cnkuY29uZmlnLCBlbnRyeS5pbmZvXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgRE9ORSByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWAsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcmVzdWx0IH07XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBFUlJPUiByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWAsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBlcnJvciB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb25maWcuY29uY3VycmVuY3kpO1xuXG4gICAgLy8gcXVldWUucHVzaCByZXR1cm5zIGEgUHJvbWlzZSB0aGF0J3MgZnVsZmlsbGVkIHdoZW5cbiAgICAvLyB0aGUgdGFzayBmaW5pc2hlcy5cbiAgICAvLyBIZW5jZSB3YWl0Rm9yIGlzIGFuIGFycmF5IG9mIFByb21pc2VzLlxuICAgIGNvbnN0IHdhaXRGb3IgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxlejIpIHtcbiAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGF1dG9tYXRpY2FsbHkgd2FpdHMgZm9yIGFsbCB0aG9zZVxuICAgIC8vIFByb21pc2VzIHRvIHJlc29sdmUsIHdoaWxlIG1ha2luZyB0aGUgcmVzdWx0c1xuICAgIC8vIGFycmF5IGNvbnRhaW4gcmVzdWx0cy5cbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgZm9yIChsZXQgcmVzdWx0IG9mIHdhaXRGb3IpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHJlc3VsdCk7XG4gICAgfVxuXG4gICAgLy8gNC4gSW52b2tlIGhvb2tTaXRlUmVuZGVyZWRcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdJbnZva2luZyBob29rU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGF3YWl0IGNvbmZpZy5ob29rU2l0ZVJlbmRlcmVkKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2spO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhvb2tTaXRlUmVuZGVyZWQgZmFpbGVkIGJlY2F1c2UgJHtlfWApO1xuICAgIH1cblxuICAgIC8vIDUuIHJldHVybiByZXN1bHRzXG4gICAgcmV0dXJuIHJlc3VsdHM7XG59O1xuIl19