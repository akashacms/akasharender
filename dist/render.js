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
import * as data from './data-new.js';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sS0FBSyxJQUFJLE1BQU0sZUFBZSxDQUFDO0FBQ3RDLE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUVsQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFXMUIsMERBQTBEO0FBRTFEOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxxQkFBcUIsQ0FDdkMsTUFBcUIsRUFDckIsT0FNQztJQUlELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FDaEMsT0FBTyxDQUFDLEtBQUssQ0FDcEIsQ0FBQztJQUVGLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUM7UUFDOUIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUTtRQUN6QixRQUFRLEVBQUUsRUFBRTtLQUNmLENBQUMsQ0FBQztJQUVILHNDQUFzQztJQUN0QyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDNUIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDdEMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQztJQUNGLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLENBQUMsS0FB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LEVBQUUsQ0FBQztZQUNiLCtFQUErRTtZQUMvRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQztJQUNMLENBQUMsRUFDRCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFeEIscURBQXFEO0lBQ3JELHFCQUFxQjtJQUNyQix5Q0FBeUM7SUFDekMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLEtBQUssSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7UUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxnREFBZ0Q7SUFDaEQseUJBQXlCO0lBQ3pCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNuQixLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsNkJBQTZCO0lBRTdCLElBQUksQ0FBQztRQUNELDRDQUE0QztRQUM1QyxNQUFNLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsb0JBQW9CO0lBQ3BCLE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUM7QUFBQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgKiBhcyBkYXRhIGZyb20gJy4vZGF0YS1uZXcuanMnO1xuaW1wb3J0IG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuXG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHR5cGUgeyBxdWV1ZUFzUHJvbWlzZWQgfSBmcm9tIFwiZmFzdHFcIjtcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24gfSBmcm9tICcuL2luZGV4LmpzJztcbmltcG9ydCB7IFJlbmRlcmluZ0NvbnRleHQgfSBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQge1xuICAgIERvY3VtZW50c0NhY2hlXG59IGZyb20gJy4vY2FjaGUvY2FjaGUtc3FsaXRlLmpzJztcbmltcG9ydCB7XG4gICAgRG9jdW1lbnRcbn0gZnJvbSAnLi9jYWNoZS9zY2hlbWEuanMnO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogV2hlcmUgcmVuZGVyRG9jdW1lbnQgaXMgbWVhbnQgZm9yIGEgZG9jdW1lbnQgb24gZGlza1xuICogYW5kIGluZGV4ZWQgYnkgYSBEb2N1bWVudHNGaWxlQ2FjaGUgaW5zdGFuY2UsIHRoaXNcbiAqIGZ1bmN0aW9uIGlzIG1lYW50IGZvciBkb2N1bWVudHMgY3JlYXRlZCBmcm9tIGluLW1lbW9yeVxuICogZGF0YS4gIEZvciBpbnN0YW5jZSwgdGhlIHRhZ2dlZC1jb250ZW50IHBsdWdpbiBnZW5lcmF0ZXNcbiAqIHRhZyBwYWdlcyBsaXN0aW5nIGxpbmtzIHRvIGRvY3VtZW50cyBiYXNlZCBvbiB0aGVpciB0YWcuXG4gKiBUaGVzZSBwYWdlcyBhcmUgaW5zdGFudGlhdGUgb3V0IG9mIGRhdGEgcmF0aGVyIHRoYW5cbiAqIGV4aXN0aW5nIG9uLWRpc2suXG4gKlxuICogUmVxdWlyZWQgZGF0YTpcbiAqICAgICAqIEJsYW5rIHBhZ2UgLSB3aXRoIGZyb250bWF0dGVyIGluY2x1ZGluZyBhIFwibGF5b3V0XCIgdGVtcGxhdGUgcmVmZXJlbmNlXG4gKiAgICAgKiBGaWxlLW5hbWUgdG8gdXNlIGZvciB2aXJ0dWFsIHBhZ2UsIHdoaWNoIGFsc28gZGV0ZXJtaW5lcyB0aGUgcmVuZGVyZWQgb3V0cHV0IGZpbGVcbiAqICAgICAqIE1ldGFkYXRhIGRlcml2ZWQgZnJvbSB0aGUgZnJvbnRtYXR0ZXIgYW5kIGZpbGxlZCB3aXRoIG90aGVyIHN0dWZmIGluY2x1ZGluZyB0aGUgZGF0YSB0byByZW5kZXIgaW50byB0aGUgcGFnZSwgIFxuICpcbiAqIEBwYXJhbSBjb25maWcgXG4gKiBAcGFyYW0gZG9jSW5mbyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlclZpcnR1YWxEb2N1bWVudChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mbzoge1xuICAgICAgICAvLyBUaGUgdmlydHVhbCBwYXRobmFtZVxuICAgICAgICB2cGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgZG9jdW1lbnQgdG8gcmVuZGVyIGFzIGlmIGl0J3NcbiAgICAgICAgLy8gYXQgdGhhdCBwYXRoXG4gICAgICAgIGRvY3VtZW50OiBzdHJpbmc7XG4gICAgfVxuKSB7XG5cblxuICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoXG4gICAgICAgICAgICBkb2NJbmZvLnZwYXRoXG4gICAgKTtcblxuICAgIGNvbnN0IHJjID0gcmVuZGVyZXIucGFyc2VNZXRhZGF0YSh7XG4gICAgICAgIGZzcGF0aDogZG9jSW5mby52cGF0aCxcbiAgICAgICAgY29udGVudDogZG9jSW5mby5kb2N1bWVudCxcbiAgICAgICAgbWV0YWRhdGE6IHt9XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgbmVjZXNzYXJ5IGl0ZW1zIHRvIHRoZSBtZXRhZGF0YVxuICAgIHJjLm1ldGFkYXRhLmNvbmZpZyA9IGNvbmZpZztcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIHJjLm1ldGFkYXRhLnBhcnRpYWxTeW5jID0gKGZuYW1lLCBtZXRhZGF0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsU3luYyhjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgIHJjLm1ldGFkYXRhLnBsdWdpbiA9IGNvbmZpZy5wbHVnaW47XG5cbiAgICAvLyBSZW5kZXIgdGhlIHByaW1hcnkgY29udGVudFxuICAgIGxldCBkb2NyZW5kZXJlZCA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihyYyk7XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhIGxheW91dCB0ZW1wbGF0ZSwgcmVuZGVyIHRoYXRcbiAgICAvLyB0ZW1wbGF0ZSBwYXNzaW5nIHRoZSByZW5kZXJlZCBwcmltYXJ5IGNvbnRlbnRcbiAgICBsZXQgbGF5b3V0cmVuZGVyZWQ7XG4gICAgaWYgKHJjLm1ldGFkYXRhLmxheW91dCkge1xuICAgICAgICBjb25zdCBsYXlvdXRzID0gY29uZmlnLmFrYXNoYVxuICAgICAgICAgICAgICAgIC5maWxlY2FjaGUubGF5b3V0c0NhY2hlO1xuICAgICAgICBjb25zdCBsYXlvdXRJbmZvID0gYXdhaXQgbGF5b3V0cy5maW5kKHJjLm1ldGFkYXRhLmxheW91dCk7XG4gICAgICAgIGlmICghbGF5b3V0SW5mbykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBsYXlvdXQgZm91bmQgaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLmxheW91dERpcnMpfSBmb3IgJHtyYy5tZXRhZGF0YS5sYXlvdXR9IGluIGZpbGUgJHtkb2NJbmZvLnZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQnVpbGQgdGhlIG1ldGFkYXRhIGZvciB0aGUgbGF5b3V0IHJlbmRlcmluZ1xuICAgICAgICBsZXQgbGF5b3V0bWV0YWRhdGE6IGFueSA9IHt9O1xuICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiBsYXlvdXRJbmZvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICBsYXlvdXRtZXRhZGF0YVt5cHJvcF0gPSBsYXlvdXRJbmZvLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiByYy5tZXRhZGF0YSkge1xuICAgICAgICAgICAgaWYgKHlwcm9wICE9PSAnbGF5b3V0Jykge1xuICAgICAgICAgICAgICAgIGxheW91dG1ldGFkYXRhW3lwcm9wXSA9IHJjLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1ha2UgdGhlIGZpcnN0IHJlbmRlcmluZyBhdmFpbGFibGVcbiAgICAgICAgLy8gaW4gdGhlIG1ldGFkYXRhIGFzIFwiY29udGVudFwiIHZhcmlhYmxlXG4gICAgICAgIGxheW91dG1ldGFkYXRhLmNvbnRlbnQgPSBkb2NyZW5kZXJlZDtcblxuICAgICAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKFxuICAgICAgICAgICAgcmMubWV0YWRhdGEubGF5b3V0XG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCFyZW5kZXJlcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyByZW5kZXJlciBmb3IgJHtsYXlvdXRtZXRhZGF0YS5sYXlvdXR9IGluIGZpbGUgJHtkb2NJbmZvLnZwYXRofWApOztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxheW91dENvbnRleHQgPSB7XG4gICAgICAgICAgICBmc3BhdGg6IGxheW91dEluZm8uZnNwYXRoLFxuICAgICAgICAgICAgY29udGVudDogbGF5b3V0SW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgYm9keTogbGF5b3V0SW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGxheW91dG1ldGFkYXRhXG4gICAgICAgIH07XG5cbiAgICAgICAgbGF5b3V0cmVuZGVyZWRcbiAgICAgICAgPSBhd2FpdCByZW5kZXJlci5yZW5kZXIobGF5b3V0Q29udGV4dCk7XG5cbiAgICB9XG5cbiAgICAvLyBGb3IgSFRNTCByZW5kZXJpbmcsIGZ1biBNYWhhYmh1dGEgZnVuY3Rpb25zXG4gICAgY29uc3QgZm9ybWF0ID0gcmVuZGVyZXIucmVuZGVyRm9ybWF0KHJjKTtcbiAgICBjb25zdCBkb01haGFiaHV0YSA9IChmb3JtYXQgPT09ICdIVE1MJyk7XG5cbiAgICBpZiAoZG9NYWhhYmh1dGEpIHtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1haGFtZXRhZGF0YTogYW55ID0ge307XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIHJjLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICBtYWhhbWV0YWRhdGFbeXByb3BdID0gcmMubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICB9XG4gICAgICAgIG1haGFtZXRhZGF0YS5jb250ZW50ID0gZG9jcmVuZGVyZWQ7XG5cbiAgICAgICAgaWYgKHJjLm1ldGFkYXRhLmNvbmZpZy5tYWhhYmh1dGFDb25maWcpIHtcbiAgICAgICAgICAgIG1haGFiaHV0YS5jb25maWcocmMubWV0YWRhdGEuY29uZmlnLm1haGFiaHV0YUNvbmZpZyk7XG4gICAgICAgIH1cblxuICAgICAgICBsYXlvdXRyZW5kZXJlZCA9IGF3YWl0IG1haGFiaHV0YS5wcm9jZXNzQXN5bmMoXG4gICAgICAgICAgICB0eXBlb2YgbGF5b3V0cmVuZGVyZWQgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgID8gbGF5b3V0cmVuZGVyZWRcbiAgICAgICAgICAgICAgICAgICAgOiBkb2NyZW5kZXJlZCxcbiAgICAgICAgICAgIG1haGFtZXRhZGF0YSxcbiAgICAgICAgICAgIGNvbmZpZy5tYWhhZnVuY3NcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBsYXlvdXRyZW5kZXJlZCBnZXRzIHRoZSBmaW5hbCByZW5kZXJpbmdcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFRoZSBjb3JlIHBhcnQgb2YgcmVuZGVyaW5nIGNvbnRlbnQgdXNpbmcgYSByZW5kZXJlci5cbiAqIFRoaXMgZnVuY3Rpb24gbG9va3MgZm9yIHRoZSByZW5kZXJlciwgYW5kIGlmIG5vbmUgaXNcbiAqIGZvdW5kIGl0IHNpbXBseSByZXR1cm5zLiAgSXQgdGhlbiBkb2VzIGEgbGl0dGxlIHNldHVwXG4gKiB0byB0aGUgbWV0YWRhdGEgb2JqZWN0LCBhbmQgY2FsbHMgdGhlIHJlbmRlciBmdW5jdGlvblxuICpcbiAqIEBwYXJhbSBjb25maWcgLSBBa2FzaGFDTVMgQ29uZmlndXJhdGlvblxuICogQHBhcmFtIHJjIC0gUmVuZGVyaW5nQ29udGV4dCBmb3IgdXNlIHdpdGggUmVuZGVyZXJzXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckNvbnRlbnQoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIHJjOiBSZW5kZXJpbmdDb250ZXh0XG4pXG4gICAgLy8gVGhlIHJldHVybiBpcyBhIHNpbXBsZSBvYmplY3RcbiAgICAvLyBjb250YWluaW5nIHVzZWZ1bCBkYXRhXG4gICAgOiBQcm9taXNlPHtcbiAgICAgICAgcmVuZGVyZXJOYW1lPzogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ/OiBzdHJpbmcsXG4gICAgICAgIHJlbmRlcmVkOiBzdHJpbmdcbiAgICB9Plxue1xuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJDb250ZW50IGAsIHJjKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKFxuICAgICAgICByYy5mc3BhdGhcbiAgICApO1xuICAgIGlmICghcmVuZGVyZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlbmRlcmVyTmFtZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZm9ybWF0OiB1bmRlZmluZWQsXG4gICAgICAgICAgICByZW5kZXJlZDogcmMuYm9keVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIEFkZCBuZWNlc3NhcnkgaXRlbXMgdG8gdGhlIG1ldGFkYXRhXG4gICAgcmMubWV0YWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgIHJjLm1ldGFkYXRhLnBhcnRpYWwgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgcmMubWV0YWRhdGEucGFydGlhbFN5bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIHJjLm1ldGFkYXRhLmFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgcmMubWV0YWRhdGEucGx1Z2luID0gY29uZmlnLnBsdWdpbjtcblxuICAgIC8vIFJlbmRlciB0aGUgcHJpbWFyeSBjb250ZW50XG4gICAgbGV0IGRvY3JlbmRlcmVkID0gYXdhaXQgcmVuZGVyZXIucmVuZGVyKHJjKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJDb250ZW50IHJlbmRlcmVkPWAsIGRvY3JlbmRlcmVkKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXJlck5hbWU6IHJlbmRlcmVyLm5hbWUsXG4gICAgICAgIGZvcm1hdDogcmVuZGVyZXIucmVuZGVyRm9ybWF0KHJjKSxcbiAgICAgICAgcmVuZGVyZWQ6IGRvY3JlbmRlcmVkXG4gICAgfTtcbn1cblxuLyoqXG4gKiBSZW5kZXIgYSBkb2N1bWVudCwgYWNjb3VudGluZyBmb3IgdGhlIG1haW4gY29udGVudCxcbiAqIGEgbGF5b3V0IHRlbXBsYXRlIChpZiBhbnkpLCBhbmQgTWFoYWJodXRhIChpZiB0aGUgY29udGVudFxuICogb3V0cHV0IGlzIEhUTUwpLiAgVGhpcyBhbHNvIGhhbmRsZXMgcmVuZGVyaW5nIG90aGVyIHR5cGVzXG4gKiBvZiBjb250ZW50IHN1Y2ggYXMgTEVTUyBDU1MgZmlsZXMuXG4gKlxuICogQHBhcmFtIGNvbmZpZyBcbiAqIEBwYXJhbSBkb2NJbmZvIFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJEb2N1bWVudChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZG9jSW5mb1xuKTogUHJvbWlzZTxzdHJpbmc+XG57XG4gICAgY29uc3QgcmVuZGVyU3RhcnQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgLy8gUmVuZGVyIHRoZSBtYWluIGNvbnRlbnRcblxuICAgIGlmICh0eXBlb2YgZG9jSW5mby5kb2NDb250ZW50ICE9PSAnc3RyaW5nJ1xuICAgICB8fCB0eXBlb2YgZG9jSW5mby5kb2NCb2R5ICE9PSAnc3RyaW5nJ1xuICAgICkge1xuICAgICAgICAvLyBjb25zb2xlLndhcm4oYE5vIGNvbnRlbnQgdG8gcmVuZGVyIGZvciBgLCBkb2NJbmZvKTtcbiAgICB9XG5cbiAgICBjb25zdCByYyA9IDxSZW5kZXJpbmdDb250ZXh0PntcbiAgICAgICAgZnNwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgIGJvZHk6IGRvY0luZm8uZG9jQm9keSxcbiAgICAgICAgbWV0YWRhdGE6IGRvY0luZm8ubWV0YWRhdGFcbiAgICB9O1xuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50IGNvbnRleHQ9ICR7cmMuZnNwYXRofWAsIHJjKTtcblxuICAgIGxldCBkb2NGb3JtYXQ7ICAgICAgLy8gS25vd2luZyB0aGUgZm9ybWF0IFxuICAgIGxldCBkb2NSZW5kZXJlZDtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZW5kZXJDb250ZW50KGNvbmZpZywgcmMpO1xuICAgICAgICBkb2NGb3JtYXQgPSByZXN1bHQuZm9ybWF0O1xuICAgICAgICBkb2NSZW5kZXJlZCA9IHJlc3VsdC5yZW5kZXJlZDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gJHsoZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyKX1gKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSAkeyhlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnIpfWApO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyRG9jdW1lbnQgJHtkb2NGb3JtYXR9ICR7ZG9jSW5mby52cGF0aH0gcmVuZGVyZWQ9YCwgZG9jUmVuZGVyZWQpO1xuICAgIGF3YWl0IGRhdGEucmVwb3J0KGRvY0luZm8ubW91bnRQb2ludCwgXG4gICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIFxuICAgICAgICAgICAgICAgICAgICAgXCJGSVJTVCBSRU5ERVJcIiwgcmVuZGVyU3RhcnQpO1xuXG4gICAgLy8gUmVuZGVyIHRoZSBtYWluIGNvbnRlbnQgaW50byBhIGxheW91dCB0ZW1wbGF0ZSxcbiAgICAvLyBpZiBvbmUgaXMgc3BlY2lmaWVkXG5cbiAgICBsZXQgbGF5b3V0Rm9ybWF0O1xuICAgIGxldCBsYXlvdXRSZW5kZXJlZDtcbiAgICBsZXQgcmVzdWx0O1xuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCBsYXlvdXQgJHtkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSBkb2NNZXRhZGF0YSAke3V0aWwuaW5zcGVjdChkb2NJbmZvLmRvY01ldGFkYXRhKX0gbWV0YWRhdGEgJHt1dGlsLmluc3BlY3QoZG9jSW5mby5tZXRhZGF0YSl9YCk7XG4gICAgaWYgKGRvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXQpIHtcblxuICAgICAgICBjb25zdCBsYXlvdXRzID0gY29uZmlnLmFrYXNoYS5maWxlY2FjaGUubGF5b3V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBsYXlvdXRzLmlzUmVhZHkoKTtcblxuICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBsYXlvdXRzLmZpbmQoZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQpO1xuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGxheW91dCBmb3VuZCBpbiAke3V0aWwuaW5zcGVjdChjb25maWcubGF5b3V0RGlycyl9IGZvciAke2RvY0luZm8ubWV0YWRhdGEubGF5b3V0fSBpbiBmaWxlICR7ZG9jSW5mby52cGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJjTGF5b3V0ID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBkb2NJbmZvLm1ldGFkYXRhLmxheW91dCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGZvdW5kLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBmb3VuZC5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IHt9XG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIGZvdW5kLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICByY0xheW91dC5tZXRhZGF0YVt5cHJvcF0gPSBmb3VuZC5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgeXByb3AgaW4gZG9jSW5mby5tZXRhZGF0YSkge1xuICAgICAgICAgICAgaWYgKHlwcm9wICE9PSAnbGF5b3V0Jykge1xuICAgICAgICAgICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhW3lwcm9wXSA9IGRvY0luZm8ubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhLmNvbnRlbnQgPSBkb2NSZW5kZXJlZDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgICAgICAgICAgPSBhd2FpdCByZW5kZXJDb250ZW50KGNvbmZpZywgcmNMYXlvdXQpO1xuICAgICAgICAgICAgbGF5b3V0Rm9ybWF0ID0gcmVzdWx0LmZvcm1hdDtcbiAgICAgICAgICAgIGxheW91dFJlbmRlcmVkID0gcmVzdWx0LnJlbmRlcmVkO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBsZXQgZWUgPSBuZXcgRXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9IHdpdGggJHtkb2NJbmZvLm1ldGFkYXRhLmxheW91dH0gJHtlLnN0YWNrID8gZS5zdGFjayA6IGV9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVlKTtcbiAgICAgICAgICAgIHRocm93IGVlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGF5b3V0Rm9ybWF0ID0gZG9jRm9ybWF0O1xuICAgICAgICBsYXlvdXRSZW5kZXJlZCA9IGRvY1JlbmRlcmVkO1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCAke2RvY0luZm8udnBhdGh9IGFmdGVyIGxheW91dCByZW5kZXIgZm9ybWF0ICR7bGF5b3V0Rm9ybWF0fSBgLCByZXN1bHQpO1xuXG4gICAgY29uc3QgcmVuZGVyU2Vjb25kUmVuZGVyID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBkYXRhLnJlcG9ydChkb2NJbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCwgY29uZmlnLnJlbmRlclRvLCBcbiAgICAgICAgICAgICAgICAgICAgICBcIlNFQ09ORCBSRU5ERVJcIixcbiAgICAgICAgICAgICAgICAgICAgICByZW5kZXJTdGFydCk7XG5cbiAgICBcbiAgICAvLyBOZXh0IHN0ZXAgaXMgdG8gcnVuIE1haGFiaHV0YSBvbiB0aGUgcmVuZGVyZWQgY29udGVudFxuICAgIC8vIE9mIGNvdXJzZSwgTWFoYWJodXRhIGlzIG5vdCBhcHByb3ByaWF0ZSBmb3IgZXZlcnl0aGluZ1xuICAgIC8vIGJlY2F1c2Ugbm90IGV2ZXJ5dGhpbmcgaXMgSFRNTFxuXG4gICAgY29uc3QgZG9NYWhhYmh1dGEgPSAobGF5b3V0Rm9ybWF0ID09PSAnSFRNTCcpO1xuICAgIGlmIChkb01haGFiaHV0YSkge1xuXG4gICAgICAgIHRyeSB7XG5cbiAgICAgICAgICAgIGNvbnN0IG1haGFtZXRhZGF0YTogYW55ID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiBkb2NJbmZvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgbWFoYW1ldGFkYXRhW3lwcm9wXSA9IGRvY0luZm8ubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFoYW1ldGFkYXRhLmNvbnRlbnQgPSBkb2NSZW5kZXJlZDtcblxuICAgICAgICAgICAgaWYgKGRvY0luZm8ubWV0YWRhdGEuY29uZmlnLm1haGFiaHV0YUNvbmZpZykge1xuICAgICAgICAgICAgICAgIG1haGFiaHV0YS5jb25maWcoZG9jSW5mby5tZXRhZGF0YS5jb25maWcubWFoYWJodXRhQ29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBtYWhhbWV0YWRhdGFgLCBtYWhhbWV0YWRhdGEpO1xuICAgICAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSBhd2FpdCBtYWhhYmh1dGEucHJvY2Vzc0FzeW5jKFxuICAgICAgICAgICAgICAgIGxheW91dFJlbmRlcmVkLCBtYWhhbWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgY29uZmlnLm1haGFmdW5jc1xuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy8gT0xEIGRvY3JlbmRlcmVkID0gYXdhaXQgdGhpcy5tYWhhcnVuKGxheW91dHJlbmRlcmVkLCBkb2NkYXRhLCBjb25maWcubWFoYWZ1bmNzKTtcbiAgICAgICAgfSBjYXRjaCAoZTIpIHtcbiAgICAgICAgICAgIGxldCBlZWUgPSBuZXcgRXJyb3IoYEVycm9yIHdpdGggTWFoYWJodXRhICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8ubWV0YWRhdGEubGF5b3V0fSAke2UyLnN0YWNrID8gZTIuc3RhY2sgOiBlMn1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZWVlKTtcbiAgICAgICAgICAgIHRocm93IGVlZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGRhdGEucmVwb3J0KGRvY0luZm8ubW91bnRQb2ludCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiTUFIQUJIVVRBXCIsIHJlbmRlclN0YXJ0KTtcblxuICAgICAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHtcbiAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJEZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dFJlbmRlcmVkLCAndXRmLTgnKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUkVOREVSRUQgJHtyZW5kZXJlci5uYW1lfSAke2RvY0luZm8ucGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH1gKTtcbiAgICAgICAgY29uc3QgcmVuZGVyRW5kUmVuZGVyZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBhd2FpdCBkYXRhLnJlcG9ydChcbiAgICAgICAgICAgIGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbyxcbiAgICAgICAgICAgIFwiUkVOREVSRURcIiwgcmVuZGVyU3RhcnQpO1xuICAgICAgICByZXR1cm4gYCR7bGF5b3V0Rm9ybWF0fSAke2RvY0luZm8udnBhdGh9ID09PiAke2RvY0luZm8ucmVuZGVyUGF0aH0gKCR7KHJlbmRlckVuZFJlbmRlcmVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKVxcbiR7YXdhaXQgZGF0YS5kYXRhNGZpbGUoZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoKX1gO1xuICAgIH0gZWxzZSBpZiAobGF5b3V0Rm9ybWF0ID09PSAnQ1NTJykge1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJUb0ZwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLCBkb2NJbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICAgICAgY29uc3QgcmVuZGVyVG9EaXIgPSBwYXRoLmRpcm5hbWUocmVuZGVyVG9GcGF0aCk7XG4gICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocmVuZGVyVG9EaXIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGF3YWl0IGZzcC53cml0ZUZpbGUocmVuZGVyVG9GcGF0aCwgbGF5b3V0UmVuZGVyZWQsICd1dGY4Jyk7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJFbmRSZW5kZXJlZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBhd2FpdCBkYXRhLnJlcG9ydChcbiAgICAgICAgICAgICAgICBkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlclRvLFxuICAgICAgICAgICAgICAgIFwiUkVOREVSRURcIiwgcmVuZGVyU3RhcnQpO1xuICAgICAgICAgICAgcmV0dXJuIGAke2xheW91dEZvcm1hdH0gJHtkb2NJbmZvLnZwYXRofSA9PT4gJHtkb2NJbmZvLnJlbmRlclBhdGh9ICgkeyhyZW5kZXJFbmRSZW5kZXJlZC52YWx1ZU9mKCkgLSByZW5kZXJTdGFydC52YWx1ZU9mKCkpIC8gMTAwMH0gc2Vjb25kcylcXG4ke2F3YWl0IGRhdGEuZGF0YTRmaWxlKGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCl9YDtcbiAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluIFJFTkRFUiBDU1MgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW4gUkVOREVSIENTUyBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVuZGVyVG9GcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgZG9jSW5mby5yZW5kZXJQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlclRvRGlyID0gcGF0aC5kaXJuYW1lKHJlbmRlclRvRnBhdGgpO1xuICAgICAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHJlbmRlclRvRGlyLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWN1cnNpdmU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhd2FpdCBmc3AuY29weUZpbGUoZG9jSW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyVG9GcGF0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ09QSUVEICR7ZG9jSW5mby5wYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofWApO1xuICAgICAgICAgICAgY29uc3QgcmVuZGVyRW5kQ29waWVkID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIHJldHVybiBgQ09QWSAke2RvY0luZm8udnBhdGh9ID09PiAke3JlbmRlclRvRnBhdGh9ICgkeyhyZW5kZXJFbmRDb3BpZWQudmFsdWVPZigpIC0gcmVuZGVyU3RhcnQudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHMpYDtcbiAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluIGNvcHkgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW4gY29weSBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIFJlbmRlciBhbGwgdGhlIGRvY3VtZW50cyBpbiBhIHNpdGUsIGxpbWl0aW5nXG4gKiB0aGUgbnVtYmVyIG9mIHNpbXVsdGFuZW91cyByZW5kZXJpbmcgdGFza3NcbiAqIHRvIHRoZSBudW1iZXIgaW4gY29uZmlnLmNvbmN1cnJlbmN5LlxuICpcbiAqIEBwYXJhbSBjb25maWdcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXIoY29uZmlnKSB7XG5cbiAgICBjb25zdCBkb2N1bWVudHMgPSA8RG9jdW1lbnRzQ2FjaGU+Y29uZmlnLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAvLyBjb25zb2xlLmxvZygnQ0FMTElORyBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCcpO1xuICAgIGF3YWl0IGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkKCk7XG4gICAgXG4gICAgLy8gMS4gR2F0aGVyIGxpc3Qgb2YgZmlsZXMgZnJvbSBSZW5kZXJGaWxlQ2FjaGVcbiAgICBjb25zdCBmaWxleiA9IGF3YWl0IGRvY3VtZW50cy5wYXRocygpO1xuICAgIC8vIGNvbnNvbGUubG9nKGBuZXdlcnJlbmRlciBmaWxleiAke2ZpbGV6Lmxlbmd0aH1gKTtcblxuICAgIC8vIDIuIEV4Y2x1ZGUgYW55IHRoYXQgd2Ugd2FudCB0byBpZ25vcmVcbiAgICBjb25zdCBmaWxlejIgPSBbXSBhcyBBcnJheTx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PjtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxleikge1xuICAgICAgICBsZXQgaW5jbHVkZSA9IHRydWU7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGVudHJ5KTtcbiAgICAgICAgbGV0IHN0YXRzO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RhdHMgPSBhd2FpdCBmc3Auc3RhdChlbnRyeS5mc3BhdGgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHsgc3RhdHMgPSB1bmRlZmluZWQ7IH1cbiAgICAgICAgaWYgKCFlbnRyeSkgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICBlbHNlIGlmICghc3RhdHMgfHwgc3RhdHMuaXNEaXJlY3RvcnkoKSkgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICAvLyBUaGlzIHNob3VsZCBhcmlzZSB1c2luZyBhbiBpZ25vcmUgY2xhdXNlXG4gICAgICAgIC8vIGVsc2UgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkudnBhdGgpID09PSAnLkRTX1N0b3JlJykgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICAvLyBlbHNlIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LnZwYXRoKSA9PT0gJy5wbGFjZWhvbGRlcicpIGluY2x1ZGUgPSBmYWxzZTtcblxuICAgICAgICBpZiAoaW5jbHVkZSkge1xuICAgICAgICAgICAgLy8gVGhlIHF1ZXVlIGlzIGFuIGFycmF5IG9mIHR1cGxlcyBjb250YWluaW5nIHRoZVxuICAgICAgICAgICAgLy8gY29uZmlnIG9iamVjdCBhbmQgdGhlIHBhdGggc3RyaW5nXG4gICAgICAgICAgICBmaWxlejIucHVzaCh7XG4gICAgICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXG4gICAgICAgICAgICAgICAgaW5mbzogYXdhaXQgZG9jdW1lbnRzLmZpbmQoZW50cnkudnBhdGgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgbmV3ZXJyZW5kZXIgZmlsZXoyIGFmdGVyIGlnbm9yZSAke2ZpbGV6Mi5sZW5ndGh9YCk7XG5cblxuICAgIC8vIDMuIE1ha2UgYSBmYXN0cSB0byBwcm9jZXNzIHVzaW5nIHJlbmRlckRvY3VtZW50LFxuICAgIC8vICAgIHB1c2hpbmcgcmVzdWx0cyB0byB0aGUgcmVzdWx0cyBhcnJheVxuXG4gICAgLy8gVGhpcyBzZXRzIHVwIHRoZSBxdWV1ZSBwcm9jZXNzb3JcbiAgICAvLyBUaGUgY29uY3VycmVuY3kgc2V0dGluZyBsZXRzIHVzIHByb2Nlc3MgZG9jdW1lbnRzXG4gICAgLy8gaW4gcGFyYWxsZWwgd2hpbGUgbGltaXRpbmcgdG90YWwgaW1wYWN0LlxuICAgIGNvbnN0IHF1ZXVlOiBxdWV1ZUFzUHJvbWlzZWQ8e1xuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgfT4gPSBmYXN0cS5wcm9taXNlKFxuXG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgaW52b2tlZCBmb3IgZWFjaCBlbnRyeSBpbiB0aGVcbiAgICAgICAgLy8gcXVldWUuIEl0IGhhbmRsZXMgcmVuZGVyaW5nIHRoZSBxdWV1ZVxuICAgICAgICAvLyBUaGUgcXVldWUgaGFzIGNvbmZpZyBvYmplY3RzIGFuZCBwYXRoIHN0cmluZ3NcbiAgICAgICAgLy8gd2hpY2ggaXMgZXhhY3RseSB3aGF0J3MgcmVxdWlyZWQgYnlcbiAgICAgICAgLy8gcmVuZGVyRG9jdW1lbnRcbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnRJblF1ZXVlKGVudHJ5KVxuICAgICAgICAgICAgOiBQcm9taXNlPHsgcmVzdWx0PzogYW55OyBlcnJvcj86IGFueTsgfT5cbiAgICAgICAge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudChcbiAgICAgICAgICAgICAgICAgICAgZW50cnkuY29uZmlnLCBlbnRyeS5pbmZvXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgRE9ORSByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWAsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcmVzdWx0IH07XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBFUlJPUiByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWAsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBlcnJvciB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb25maWcuY29uY3VycmVuY3kpO1xuXG4gICAgLy8gcXVldWUucHVzaCByZXR1cm5zIGEgUHJvbWlzZSB0aGF0J3MgZnVsZmlsbGVkIHdoZW5cbiAgICAvLyB0aGUgdGFzayBmaW5pc2hlcy5cbiAgICAvLyBIZW5jZSB3YWl0Rm9yIGlzIGFuIGFycmF5IG9mIFByb21pc2VzLlxuICAgIGNvbnN0IHdhaXRGb3IgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxlejIpIHtcbiAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGF1dG9tYXRpY2FsbHkgd2FpdHMgZm9yIGFsbCB0aG9zZVxuICAgIC8vIFByb21pc2VzIHRvIHJlc29sdmUsIHdoaWxlIG1ha2luZyB0aGUgcmVzdWx0c1xuICAgIC8vIGFycmF5IGNvbnRhaW4gcmVzdWx0cy5cbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgZm9yIChsZXQgcmVzdWx0IG9mIHdhaXRGb3IpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHJlc3VsdCk7XG4gICAgfVxuXG4gICAgLy8gNC4gSW52b2tlIGhvb2tTaXRlUmVuZGVyZWRcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdJbnZva2luZyBob29rU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGF3YWl0IGNvbmZpZy5ob29rU2l0ZVJlbmRlcmVkKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2spO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhvb2tTaXRlUmVuZGVyZWQgZmFpbGVkIGJlY2F1c2UgJHtlfWApO1xuICAgIH1cblxuICAgIC8vIDUuIHJldHVybiByZXN1bHRzXG4gICAgcmV0dXJuIHJlc3VsdHM7XG59O1xuIl19