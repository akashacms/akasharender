/**
 *
 * Copyright 2014-2022 David Herron
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
    // console.log(`documentRender ${docInfo.vpath} rendered=`, docRendered);
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
    // console.log(`renderDocument ${docInfo.vpath} after layout render `, layoutRendered);
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
// export async function renderDocument2(config, docInfo) {
//     const renderStart = new Date();
//     const renderBaseMetadata = docInfo.baseMetadata;
//     // console.log(`renderDocument `, docInfo);
//     const renderer = config.findRendererPath(docInfo.vpath);
//     if (renderer) {
//         // console.log(`ABOUT TO RENDER ${renderer.name} ${docInfo.vpath} ==> ${renderToFpath}`);
//         try {
//             // Set up required metadata values
//             docInfo.metadata.config      = config;
//             docInfo.metadata.partial = (fname, metadata) => {
//                 return config.akasha.partial(config, fname, metadata);
//             }
//             docInfo.metadata.partialSync = (fname, metadata) => {
//                 return config.akasha.partialSync(config, fname, metadata);
//             }
//             docInfo.metadata.akasha = config.akasha;
//             docInfo.metadata.plugin = config.plugin;
//             // Render the document - output goes to "docrendered"
//             let docrendered;
//             try {
//                 const context = {
//                     fspath: docInfo.fspath,
//                     content: docInfo.docContent,
//                     body: docInfo.docBody,
//                     metadata: docInfo.metadata
//                 };
//                 // console.log({
//                 //     title: 'before DOCUMENT renderer.render',
//                 //     fspath: docInfo.fspath,
//                 //     content: docInfo.docContent,
//                 //     body: docInfo.docBody,
//                 //     metadata: docInfo.metadata,
//                 //     info: docInfo.info
//                 // });
//                 if (typeof context.content !== 'string'
//                  || typeof context.body !== 'string') {
//                     // console.warn(`render should fail for ${util.inspect(context)} `, docInfo);
//                 }
//                 docrendered = await renderer.render(context);
//             } catch (err) {
//                 console.error(`Error rendering ${docInfo.vpath} ${(err.stack ? err.stack : err)}`);
//                 throw new Error(`Error rendering ${docInfo.vpath} ${(err.stack ? err.stack : err)}`);
//             }
//             // console.log(docrendered);
//             await data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, 
//                                 "FIRST RENDER", renderStart);
//             // There may be a layout, which will be in metadata.layout
//             // If so, get the layout file
//             // Construct a new metadata -- and it's "content" is
//             // set from docrendered
//             // Then render the document into "layoutrendered"
//             // Otherwise cpy docrendered to layoutrendered
//             let layoutrendered;
//             if (docInfo.metadata.layout) {
//                 const layouts = config.akasha.filecache.layoutsCache;
//                 // await layouts.isReady();
//                 let found = await layouts.find(docInfo.metadata.layout);
//                 if (!found) {
//                     throw new Error(`No layout found in ${util.inspect(config.layoutDirs)} for ${docInfo.metadata.layout} in file ${docInfo.vpath}`);
//                 }
//                 let layoutmetadata: any = {};
//                 for (var yprop in found.metadata) {
//                     layoutmetadata[yprop] = found.metadata[yprop];
//                 }
//                 for (var yprop in docInfo.metadata) {
//                     if (yprop !== 'layout') {
//                         layoutmetadata[yprop] = docInfo.metadata[yprop];
//                     }
//                 }
//                 layoutmetadata.content = docrendered;
//                 const renderer = config.findRendererPath(docInfo.metadata.layout);
//                 if (!renderer) {
//                     throw new Error(`No renderer for ${layoutmetadata.layout} in file ${docInfo.vpath}`);;
//                 }
//                 const context = {
//                     fspath: found.fspath,
//                     content: found.docContent,
//                     body: found.docBody,
//                     metadata: layoutmetadata
//                 };
//                 if (typeof context.content !== 'string'
//                  || typeof context.body !== 'string') {
//                     throw new Error(`renderDocument LAYOUT RENDERING for ${docInfo.vpath} with layout ${docInfo.metadata.layout} has no context.content or context.body to which to render the content ${util.inspect(context)} ${util.inspect(found)}`);
//                 }
//                 // console.log(`renderDocument `, found);
//                 // console.log(`renderDocument `, layoutmetadata);
//                 try {
//                     layoutrendered
//                         = await renderer.render(context);
//                 } catch (e) {
//                     let ee = new Error(`Error rendering ${docInfo.vpath} with ${docInfo.metadata.layout} ${e.stack ? e.stack : e}`);
//                     console.error(ee);
//                     throw ee;
//                 }
//             } else {
//                 layoutrendered = docrendered;
//             }
//             const renderSecondRender = new Date();
//             await data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, 
//                                 "SECOND RENDER", renderStart);
//             // Next step is to run Mahabhuta on the rendered content
//             // Of course, Mahabhuta is not appropriate for everything
//             // because not everything is HTML
//             const format = renderer.renderFormat({ fspath: docInfo.fspath });
//             const doMahabhuta = (format === 'HTML') ? true :false;
//             if (doMahabhuta) {
//                 try {
//                     const mahametadata: any = {};
//                     for (var yprop in docInfo.metadata) {
//                         mahametadata[yprop] = docInfo.metadata[yprop];
//                     }
//                     mahametadata.content = docrendered;
//                     if (docInfo.metadata.config.mahabhutaConfig) {
//                         mahabhuta.config(docInfo.metadata.config.mahabhutaConfig);
//                     }
//                     // console.log(`mahametadata`, mahametadata);
//                     layoutrendered = await mahabhuta.processAsync(
//                         layoutrendered, mahametadata, config.mahafuncs
//                     );
//                     // OLD docrendered = await this.maharun(layoutrendered, docdata, config.mahafuncs);
//                 } catch (e2) {
//                     let eee = new Error(`Error with Mahabhuta ${docInfo.vpath} with ${docInfo.metadata.layout} ${e2.stack ? e2.stack : e2}`);
//                     console.error(eee);
//                     throw eee;
//                 }
//             }
//             await data.report(docInfo.mountPoint, docInfo.vpath, config.renderTo, 
//                 "MAHABHUTA", renderStart);
//             const renderDest = path.join(config.renderTo, docInfo.renderPath);
//             await fsp.mkdir(path.dirname(renderDest), { recursive: true });
//             await fsp.writeFile(renderDest, layoutrendered, 'utf-8');
//             // console.log(`RENDERED ${renderer.name} ${docInfo.path} ==> ${renderToFpath}`);
//             const renderEndRendered = new Date();
//             await data.report(
//                 docInfo.mountPoint, docInfo.vpath,
//                 config.renderTo,
//                 "RENDERED", renderStart);
//             return `${renderer.name} ${docInfo.vpath} ==> ${docInfo.renderPath} (${(renderEndRendered.valueOf() - renderStart.valueOf()) / 1000} seconds)\n${await data.data4file(docInfo.mountPoint, docInfo.vpath)}`;
//         } catch (err) {
//             console.error(`in renderer branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
//             throw new Error(`in renderer branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
//         }
//     } else {
//         // console.log(`COPYING ${docInfo.path} ==> ${renderToFpath}`);
//         try {
//             const renderToFpath = path.join(config.renderTo, docInfo.renderPath);
//             const renderToDir = path.dirname(renderToFpath);
//             await fsp.mkdir(renderToDir, { recursive: true });
//             await fsp.copyFile(docInfo.fspath, renderToFpath);
//             // console.log(`COPIED ${docInfo.path} ==> ${renderToFpath}`);
//             const renderEndCopied = new Date();
//             return `COPY ${docInfo.vpath} ==> ${renderToFpath} (${(renderEndCopied.valueOf() - renderStart.valueOf()) / 1000} seconds)`;
//         } catch(err) {
//             console.error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
//             throw new Error(`in copy branch for ${docInfo.vpath} to ${docInfo.renderPath} error=${err.stack ? err.stack : err}`);
//         }
//     }
// }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL3JlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUVsQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFRMUIsMERBQTBEO0FBRTFEOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxxQkFBcUIsQ0FDdkMsTUFBcUIsRUFDckIsT0FNQztJQUlELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FDaEMsT0FBTyxDQUFDLEtBQUssQ0FDcEIsQ0FBQztJQUVGLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUM7UUFDOUIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3JCLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUTtRQUN6QixRQUFRLEVBQUUsRUFBRTtLQUNmLENBQUMsQ0FBQztJQUVILHNDQUFzQztJQUN0QyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDNUIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDdEMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQztJQUNGLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLENBQUMsS0FB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LENBQUM7SUFDTCxDQUFDLEVBQ0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRXhCLHFEQUFxRDtJQUNyRCxxQkFBcUI7SUFDckIseUNBQXlDO0lBQ3pDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNuQixLQUFLLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3ZCLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCx5Q0FBeUM7SUFDekMsZ0RBQWdEO0lBQ2hELHlCQUF5QjtJQUN6QixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDbkIsS0FBSyxJQUFJLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUN6QixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sTUFBTSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELDZCQUE2QjtJQUU3QixJQUFJLENBQUM7UUFDRCw0Q0FBNEM7UUFDNUMsTUFBTSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVELG9CQUFvQjtJQUNwQixPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDO0FBQUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjIgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0ICogYXMgZGF0YSBmcm9tICcuL2RhdGEuanMnO1xuaW1wb3J0IG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuXG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHR5cGUgeyBxdWV1ZUFzUHJvbWlzZWQgfSBmcm9tIFwiZmFzdHFcIjtcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24gfSBmcm9tICcuL2luZGV4LmpzJztcbmltcG9ydCB7IFJlbmRlcmluZ0NvbnRleHQgfSBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQge1xuICAgIERvY3VtZW50c0ZpbGVDYWNoZSwgRG9jdW1lbnRcbn0gZnJvbSAnLi9jYWNoZS9maWxlLWNhY2hlLXNxbGl0ZS5qcyc7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBXaGVyZSByZW5kZXJEb2N1bWVudCBpcyBtZWFudCBmb3IgYSBkb2N1bWVudCBvbiBkaXNrXG4gKiBhbmQgaW5kZXhlZCBieSBhIERvY3VtZW50c0ZpbGVDYWNoZSBpbnN0YW5jZSwgdGhpc1xuICogZnVuY3Rpb24gaXMgbWVhbnQgZm9yIGRvY3VtZW50cyBjcmVhdGVkIGZyb20gaW4tbWVtb3J5XG4gKiBkYXRhLiAgRm9yIGluc3RhbmNlLCB0aGUgdGFnZ2VkLWNvbnRlbnQgcGx1Z2luIGdlbmVyYXRlc1xuICogdGFnIHBhZ2VzIGxpc3RpbmcgbGlua3MgdG8gZG9jdW1lbnRzIGJhc2VkIG9uIHRoZWlyIHRhZy5cbiAqIFRoZXNlIHBhZ2VzIGFyZSBpbnN0YW50aWF0ZSBvdXQgb2YgZGF0YSByYXRoZXIgdGhhblxuICogZXhpc3Rpbmcgb24tZGlzay5cbiAqXG4gKiBSZXF1aXJlZCBkYXRhOlxuICogICAgICogQmxhbmsgcGFnZSAtIHdpdGggZnJvbnRtYXR0ZXIgaW5jbHVkaW5nIGEgXCJsYXlvdXRcIiB0ZW1wbGF0ZSByZWZlcmVuY2VcbiAqICAgICAqIEZpbGUtbmFtZSB0byB1c2UgZm9yIHZpcnR1YWwgcGFnZSwgd2hpY2ggYWxzbyBkZXRlcm1pbmVzIHRoZSByZW5kZXJlZCBvdXRwdXQgZmlsZVxuICogICAgICogTWV0YWRhdGEgZGVyaXZlZCBmcm9tIHRoZSBmcm9udG1hdHRlciBhbmQgZmlsbGVkIHdpdGggb3RoZXIgc3R1ZmYgaW5jbHVkaW5nIHRoZSBkYXRhIHRvIHJlbmRlciBpbnRvIHRoZSBwYWdlLCAgXG4gKlxuICogQHBhcmFtIGNvbmZpZyBcbiAqIEBwYXJhbSBkb2NJbmZvIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyVmlydHVhbERvY3VtZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvOiB7XG4gICAgICAgIC8vIFRoZSB2aXJ0dWFsIHBhdGhuYW1lXG4gICAgICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBkb2N1bWVudCB0byByZW5kZXIgYXMgaWYgaXQnc1xuICAgICAgICAvLyBhdCB0aGF0IHBhdGhcbiAgICAgICAgZG9jdW1lbnQ6IHN0cmluZztcbiAgICB9XG4pIHtcblxuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChcbiAgICAgICAgICAgIGRvY0luZm8udnBhdGhcbiAgICApO1xuXG4gICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKHtcbiAgICAgICAgZnNwYXRoOiBkb2NJbmZvLnZwYXRoLFxuICAgICAgICBjb250ZW50OiBkb2NJbmZvLmRvY3VtZW50LFxuICAgICAgICBtZXRhZGF0YToge31cbiAgICB9KTtcblxuICAgIC8vIEFkZCBuZWNlc3NhcnkgaXRlbXMgdG8gdGhlIG1ldGFkYXRhXG4gICAgcmMubWV0YWRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgIHJjLm1ldGFkYXRhLnBhcnRpYWwgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWwoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgcmMubWV0YWRhdGEucGFydGlhbFN5bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4gICAgICAgIHJldHVybiBjb25maWcuYWthc2hhLnBhcnRpYWxTeW5jKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbiAgICB9O1xuICAgIHJjLm1ldGFkYXRhLmFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgcmMubWV0YWRhdGEucGx1Z2luID0gY29uZmlnLnBsdWdpbjtcblxuICAgIC8vIFJlbmRlciB0aGUgcHJpbWFyeSBjb250ZW50XG4gICAgbGV0IGRvY3JlbmRlcmVkID0gYXdhaXQgcmVuZGVyZXIucmVuZGVyKHJjKTtcblxuICAgIC8vIElmIHRoZXJlIGlzIGEgbGF5b3V0IHRlbXBsYXRlLCByZW5kZXIgdGhhdFxuICAgIC8vIHRlbXBsYXRlIHBhc3NpbmcgdGhlIHJlbmRlcmVkIHByaW1hcnkgY29udGVudFxuICAgIGxldCBsYXlvdXRyZW5kZXJlZDtcbiAgICBpZiAocmMubWV0YWRhdGEubGF5b3V0KSB7XG4gICAgICAgIGNvbnN0IGxheW91dHMgPSBjb25maWcuYWthc2hhXG4gICAgICAgICAgICAgICAgLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGxheW91dEluZm8gPSBhd2FpdCBsYXlvdXRzLmZpbmQocmMubWV0YWRhdGEubGF5b3V0KTtcbiAgICAgICAgaWYgKCFsYXlvdXRJbmZvKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGxheW91dCBmb3VuZCBpbiAke3V0aWwuaW5zcGVjdChjb25maWcubGF5b3V0RGlycyl9IGZvciAke3JjLm1ldGFkYXRhLmxheW91dH0gaW4gZmlsZSAke2RvY0luZm8udnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCdWlsZCB0aGUgbWV0YWRhdGEgZm9yIHRoZSBsYXlvdXQgcmVuZGVyaW5nXG4gICAgICAgIGxldCBsYXlvdXRtZXRhZGF0YTogYW55ID0ge307XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIGxheW91dEluZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIGxheW91dG1ldGFkYXRhW3lwcm9wXSA9IGxheW91dEluZm8ubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIHJjLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICBpZiAoeXByb3AgIT09ICdsYXlvdXQnKSB7XG4gICAgICAgICAgICAgICAgbGF5b3V0bWV0YWRhdGFbeXByb3BdID0gcmMubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTWFrZSB0aGUgZmlyc3QgcmVuZGVyaW5nIGF2YWlsYWJsZVxuICAgICAgICAvLyBpbiB0aGUgbWV0YWRhdGEgYXMgXCJjb250ZW50XCIgdmFyaWFibGVcbiAgICAgICAgbGF5b3V0bWV0YWRhdGEuY29udGVudCA9IGRvY3JlbmRlcmVkO1xuXG4gICAgICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoXG4gICAgICAgICAgICByYy5tZXRhZGF0YS5sYXlvdXRcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIXJlbmRlcmVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHJlbmRlcmVyIGZvciAke2xheW91dG1ldGFkYXRhLmxheW91dH0gaW4gZmlsZSAke2RvY0luZm8udnBhdGh9YCk7O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGF5b3V0Q29udGV4dCA9IHtcbiAgICAgICAgICAgIGZzcGF0aDogbGF5b3V0SW5mby5mc3BhdGgsXG4gICAgICAgICAgICBjb250ZW50OiBsYXlvdXRJbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBsYXlvdXRJbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogbGF5b3V0bWV0YWRhdGFcbiAgICAgICAgfTtcblxuICAgICAgICBsYXlvdXRyZW5kZXJlZFxuICAgICAgICA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihsYXlvdXRDb250ZXh0KTtcblxuICAgIH1cblxuICAgIC8vIEZvciBIVE1MIHJlbmRlcmluZywgZnVuIE1haGFiaHV0YSBmdW5jdGlvbnNcbiAgICBjb25zdCBmb3JtYXQgPSByZW5kZXJlci5yZW5kZXJGb3JtYXQocmMpO1xuICAgIGNvbnN0IGRvTWFoYWJodXRhID0gKGZvcm1hdCA9PT0gJ0hUTUwnKTtcblxuICAgIGlmIChkb01haGFiaHV0YSkge1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbWFoYW1ldGFkYXRhOiBhbnkgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgeXByb3AgaW4gcmMubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIG1haGFtZXRhZGF0YVt5cHJvcF0gPSByYy5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgbWFoYW1ldGFkYXRhLmNvbnRlbnQgPSBkb2NyZW5kZXJlZDtcblxuICAgICAgICBpZiAocmMubWV0YWRhdGEuY29uZmlnLm1haGFiaHV0YUNvbmZpZykge1xuICAgICAgICAgICAgbWFoYWJodXRhLmNvbmZpZyhyYy5tZXRhZGF0YS5jb25maWcubWFoYWJodXRhQ29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxheW91dHJlbmRlcmVkID0gYXdhaXQgbWFoYWJodXRhLnByb2Nlc3NBc3luYyhcbiAgICAgICAgICAgIHR5cGVvZiBsYXlvdXRyZW5kZXJlZCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyBsYXlvdXRyZW5kZXJlZFxuICAgICAgICAgICAgICAgICAgICA6IGRvY3JlbmRlcmVkLFxuICAgICAgICAgICAgbWFoYW1ldGFkYXRhLFxuICAgICAgICAgICAgY29uZmlnLm1haGFmdW5jc1xuICAgICAgICApO1xuICAgIH1cblxuICAgIC8vIGxheW91dHJlbmRlcmVkIGdldHMgdGhlIGZpbmFsIHJlbmRlcmluZ1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogVGhlIGNvcmUgcGFydCBvZiByZW5kZXJpbmcgY29udGVudCB1c2luZyBhIHJlbmRlcmVyLlxuICogVGhpcyBmdW5jdGlvbiBsb29rcyBmb3IgdGhlIHJlbmRlcmVyLCBhbmQgaWYgbm9uZSBpc1xuICogZm91bmQgaXQgc2ltcGx5IHJldHVybnMuICBJdCB0aGVuIGRvZXMgYSBsaXR0bGUgc2V0dXBcbiAqIHRvIHRoZSBtZXRhZGF0YSBvYmplY3QsIGFuZCBjYWxscyB0aGUgcmVuZGVyIGZ1bmN0aW9uXG4gKlxuICogQHBhcmFtIGNvbmZpZyAtIEFrYXNoYUNNUyBDb25maWd1cmF0aW9uXG4gKiBAcGFyYW0gcmMgLSBSZW5kZXJpbmdDb250ZXh0IGZvciB1c2Ugd2l0aCBSZW5kZXJlcnNcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVyQ29udGVudChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgcmM6IFJlbmRlcmluZ0NvbnRleHRcbilcbiAgICAvLyBUaGUgcmV0dXJuIGlzIGEgc2ltcGxlIG9iamVjdFxuICAgIC8vIGNvbnRhaW5pbmcgdXNlZnVsIGRhdGFcbiAgICA6IFByb21pc2U8e1xuICAgICAgICByZW5kZXJlck5hbWU/OiBzdHJpbmcsXG4gICAgICAgIGZvcm1hdD86IHN0cmluZyxcbiAgICAgICAgcmVuZGVyZWQ6IHN0cmluZ1xuICAgIH0+XG57XG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckNvbnRlbnQgYCwgcmMpO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoXG4gICAgICAgIHJjLmZzcGF0aFxuICAgICk7XG4gICAgaWYgKCFyZW5kZXJlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVuZGVyZXJOYW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBmb3JtYXQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHJlbmRlcmVkOiByYy5ib2R5XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gQWRkIG5lY2Vzc2FyeSBpdGVtcyB0byB0aGUgbWV0YWRhdGFcbiAgICByYy5tZXRhZGF0YS5jb25maWcgPSBjb25maWc7XG4gICAgcmMubWV0YWRhdGEucGFydGlhbCA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbChjb25maWcsIGZuYW1lLCBtZXRhZGF0YSk7XG4gICAgfTtcbiAgICByYy5tZXRhZGF0YS5wYXJ0aWFsU3luYyA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuICAgIH07XG4gICAgcmMubWV0YWRhdGEuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICByYy5tZXRhZGF0YS5wbHVnaW4gPSBjb25maWcucGx1Z2luO1xuXG4gICAgLy8gUmVuZGVyIHRoZSBwcmltYXJ5IGNvbnRlbnRcbiAgICBsZXQgZG9jcmVuZGVyZWQgPSBhd2FpdCByZW5kZXJlci5yZW5kZXIocmMpO1xuXG4gICAgLy8gY29uc29sZS5sb2coYHJlbmRlckNvbnRlbnQgcmVuZGVyZWQ9YCwgZG9jcmVuZGVyZWQpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcmVyTmFtZTogcmVuZGVyZXIubmFtZSxcbiAgICAgICAgZm9ybWF0OiByZW5kZXJlci5yZW5kZXJGb3JtYXQocmMpLFxuICAgICAgICByZW5kZXJlZDogZG9jcmVuZGVyZWRcbiAgICB9O1xufVxuXG4vKipcbiAqIFJlbmRlciBhIGRvY3VtZW50LCBhY2NvdW50aW5nIGZvciB0aGUgbWFpbiBjb250ZW50LFxuICogYSBsYXlvdXQgdGVtcGxhdGUgKGlmIGFueSksIGFuZCBNYWhhYmh1dGEgKGlmIHRoZSBjb250ZW50XG4gKiBvdXRwdXQgaXMgSFRNTCkuICBUaGlzIGFsc28gaGFuZGxlcyByZW5kZXJpbmcgb3RoZXIgdHlwZXNcbiAqIG9mIGNvbnRlbnQgc3VjaCBhcyBMRVNTIENTUyBmaWxlcy5cbiAqXG4gKiBAcGFyYW0gY29uZmlnIFxuICogQHBhcmFtIGRvY0luZm8gXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50KFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICBkb2NJbmZvXG4pOiBQcm9taXNlPHN0cmluZz5cbntcbiAgICBjb25zdCByZW5kZXJTdGFydCA9IG5ldyBEYXRlKCk7XG5cbiAgICAvLyBSZW5kZXIgdGhlIG1haW4gY29udGVudFxuXG4gICAgY29uc3QgcmMgPSA8UmVuZGVyaW5nQ29udGV4dD57XG4gICAgICAgIGZzcGF0aDogZG9jSW5mby52cGF0aCxcbiAgICAgICAgY29udGVudDogZG9jSW5mby5kb2NDb250ZW50LFxuICAgICAgICBib2R5OiBkb2NJbmZvLmRvY0JvZHksXG4gICAgICAgIG1ldGFkYXRhOiBkb2NJbmZvLm1ldGFkYXRhXG4gICAgfTtcblxuICAgIGxldCBkb2NGb3JtYXQ7ICAgICAgLy8gS25vd2luZyB0aGUgZm9ybWF0IFxuICAgIGxldCBkb2NSZW5kZXJlZDtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZW5kZXJDb250ZW50KGNvbmZpZywgcmMpO1xuICAgICAgICBkb2NGb3JtYXQgPSByZXN1bHQuZm9ybWF0O1xuICAgICAgICBkb2NSZW5kZXJlZCA9IHJlc3VsdC5yZW5kZXJlZDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gJHsoZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyKX1gKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciByZW5kZXJpbmcgJHtkb2NJbmZvLnZwYXRofSAkeyhlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnIpfWApO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgZG9jdW1lbnRSZW5kZXIgJHtkb2NJbmZvLnZwYXRofSByZW5kZXJlZD1gLCBkb2NSZW5kZXJlZCk7XG4gICAgYXdhaXQgZGF0YS5yZXBvcnQoZG9jSW5mby5tb3VudFBvaW50LCBcbiAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICBcIkZJUlNUIFJFTkRFUlwiLCByZW5kZXJTdGFydCk7XG5cbiAgICAvLyBSZW5kZXIgdGhlIG1haW4gY29udGVudCBpbnRvIGEgbGF5b3V0IHRlbXBsYXRlLFxuICAgIC8vIGlmIG9uZSBpcyBzcGVjaWZpZWRcblxuICAgIGxldCBsYXlvdXRGb3JtYXQ7XG4gICAgbGV0IGxheW91dFJlbmRlcmVkO1xuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCBsYXlvdXQgJHtkb2NJbmZvPy5tZXRhZGF0YT8ubGF5b3V0fSBkb2NNZXRhZGF0YSAke3V0aWwuaW5zcGVjdChkb2NJbmZvLmRvY01ldGFkYXRhKX0gbWV0YWRhdGEgJHt1dGlsLmluc3BlY3QoZG9jSW5mby5tZXRhZGF0YSl9YCk7XG4gICAgaWYgKGRvY0luZm8/Lm1ldGFkYXRhPy5sYXlvdXQpIHtcblxuICAgICAgICBjb25zdCBsYXlvdXRzID0gY29uZmlnLmFrYXNoYS5maWxlY2FjaGUubGF5b3V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBsYXlvdXRzLmlzUmVhZHkoKTtcblxuICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBsYXlvdXRzLmZpbmQoZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQpO1xuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGxheW91dCBmb3VuZCBpbiAke3V0aWwuaW5zcGVjdChjb25maWcubGF5b3V0RGlycyl9IGZvciAke2RvY0luZm8ubWV0YWRhdGEubGF5b3V0fSBpbiBmaWxlICR7ZG9jSW5mby52cGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJjTGF5b3V0ID0gPFJlbmRlcmluZ0NvbnRleHQ+e1xuICAgICAgICAgICAgZnNwYXRoOiBkb2NJbmZvLm1ldGFkYXRhLmxheW91dCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGZvdW5kLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBib2R5OiBmb3VuZC5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IHt9XG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIHlwcm9wIGluIGZvdW5kLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICByY0xheW91dC5tZXRhZGF0YVt5cHJvcF0gPSBmb3VuZC5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgeXByb3AgaW4gZG9jSW5mby5tZXRhZGF0YSkge1xuICAgICAgICAgICAgaWYgKHlwcm9wICE9PSAnbGF5b3V0Jykge1xuICAgICAgICAgICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhW3lwcm9wXSA9IGRvY0luZm8ubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJjTGF5b3V0Lm1ldGFkYXRhLmNvbnRlbnQgPSBkb2NSZW5kZXJlZDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0XG4gICAgICAgICAgICAgICAgPSBhd2FpdCByZW5kZXJDb250ZW50KGNvbmZpZywgcmNMYXlvdXQpO1xuICAgICAgICAgICAgbGF5b3V0Rm9ybWF0ID0gcmVzdWx0LmZvcm1hdDtcbiAgICAgICAgICAgIGxheW91dFJlbmRlcmVkID0gcmVzdWx0LnJlbmRlcmVkO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBsZXQgZWUgPSBuZXcgRXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9IHdpdGggJHtkb2NJbmZvLm1ldGFkYXRhLmxheW91dH0gJHtlLnN0YWNrID8gZS5zdGFjayA6IGV9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVlKTtcbiAgICAgICAgICAgIHRocm93IGVlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGF5b3V0Rm9ybWF0ID0gZG9jRm9ybWF0O1xuICAgICAgICBsYXlvdXRSZW5kZXJlZCA9IGRvY1JlbmRlcmVkO1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCAke2RvY0luZm8udnBhdGh9IGFmdGVyIGxheW91dCByZW5kZXIgYCwgbGF5b3V0UmVuZGVyZWQpO1xuXG4gICAgY29uc3QgcmVuZGVyU2Vjb25kUmVuZGVyID0gbmV3IERhdGUoKTtcbiAgICBhd2FpdCBkYXRhLnJlcG9ydChkb2NJbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgICAgZG9jSW5mby52cGF0aCwgY29uZmlnLnJlbmRlclRvLCBcbiAgICAgICAgICAgICAgICAgICAgICBcIlNFQ09ORCBSRU5ERVJcIixcbiAgICAgICAgICAgICAgICAgICAgICByZW5kZXJTdGFydCk7XG5cbiAgICBcbiAgICAvLyBOZXh0IHN0ZXAgaXMgdG8gcnVuIE1haGFiaHV0YSBvbiB0aGUgcmVuZGVyZWQgY29udGVudFxuICAgIC8vIE9mIGNvdXJzZSwgTWFoYWJodXRhIGlzIG5vdCBhcHByb3ByaWF0ZSBmb3IgZXZlcnl0aGluZ1xuICAgIC8vIGJlY2F1c2Ugbm90IGV2ZXJ5dGhpbmcgaXMgSFRNTFxuXG4gICAgY29uc3QgZG9NYWhhYmh1dGEgPSAobGF5b3V0Rm9ybWF0ID09PSAnSFRNTCcpO1xuICAgIGlmIChkb01haGFiaHV0YSkge1xuXG4gICAgICAgIHRyeSB7XG5cbiAgICAgICAgICAgIGNvbnN0IG1haGFtZXRhZGF0YTogYW55ID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiBkb2NJbmZvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgbWFoYW1ldGFkYXRhW3lwcm9wXSA9IGRvY0luZm8ubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFoYW1ldGFkYXRhLmNvbnRlbnQgPSBkb2NSZW5kZXJlZDtcblxuICAgICAgICAgICAgaWYgKGRvY0luZm8ubWV0YWRhdGEuY29uZmlnLm1haGFiaHV0YUNvbmZpZykge1xuICAgICAgICAgICAgICAgIG1haGFiaHV0YS5jb25maWcoZG9jSW5mby5tZXRhZGF0YS5jb25maWcubWFoYWJodXRhQ29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBtYWhhbWV0YWRhdGFgLCBtYWhhbWV0YWRhdGEpO1xuICAgICAgICAgICAgbGF5b3V0UmVuZGVyZWQgPSBhd2FpdCBtYWhhYmh1dGEucHJvY2Vzc0FzeW5jKFxuICAgICAgICAgICAgICAgIGxheW91dFJlbmRlcmVkLCBtYWhhbWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgY29uZmlnLm1haGFmdW5jc1xuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy8gT0xEIGRvY3JlbmRlcmVkID0gYXdhaXQgdGhpcy5tYWhhcnVuKGxheW91dHJlbmRlcmVkLCBkb2NkYXRhLCBjb25maWcubWFoYWZ1bmNzKTtcbiAgICAgICAgfSBjYXRjaCAoZTIpIHtcbiAgICAgICAgICAgIGxldCBlZWUgPSBuZXcgRXJyb3IoYEVycm9yIHdpdGggTWFoYWJodXRhICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8ubWV0YWRhdGEubGF5b3V0fSAke2UyLnN0YWNrID8gZTIuc3RhY2sgOiBlMn1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZWVlKTtcbiAgICAgICAgICAgIHRocm93IGVlZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IGRhdGEucmVwb3J0KGRvY0luZm8ubW91bnRQb2ludCwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRvY0luZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiTUFIQUJIVVRBXCIsIHJlbmRlclN0YXJ0KTtcblxuICAgICAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHtcbiAgICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJEZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dFJlbmRlcmVkLCAndXRmLTgnKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUkVOREVSRUQgJHtyZW5kZXJlci5uYW1lfSAke2RvY0luZm8ucGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH1gKTtcbiAgICAgICAgY29uc3QgcmVuZGVyRW5kUmVuZGVyZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBhd2FpdCBkYXRhLnJlcG9ydChcbiAgICAgICAgICAgIGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCxcbiAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbyxcbiAgICAgICAgICAgIFwiUkVOREVSRURcIiwgcmVuZGVyU3RhcnQpO1xuICAgICAgICByZXR1cm4gYCR7bGF5b3V0Rm9ybWF0fSAke2RvY0luZm8udnBhdGh9ID09PiAke2RvY0luZm8ucmVuZGVyUGF0aH0gKCR7KHJlbmRlckVuZFJlbmRlcmVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKVxcbiR7YXdhaXQgZGF0YS5kYXRhNGZpbGUoZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoKX1gO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlclRvRnBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyVG8sIGRvY0luZm8ucmVuZGVyUGF0aCk7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJUb0RpciA9IHBhdGguZGlybmFtZShyZW5kZXJUb0ZwYXRoKTtcbiAgICAgICAgICAgIGF3YWl0IGZzcC5ta2RpcihyZW5kZXJUb0Rpciwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXdhaXQgZnNwLmNvcHlGaWxlKGRvY0luZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclRvRnBhdGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENPUElFRCAke2RvY0luZm8ucGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH1gKTtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlckVuZENvcGllZCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICByZXR1cm4gYENPUFkgJHtkb2NJbmZvLnZwYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofSAoJHsocmVuZGVyRW5kQ29waWVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKWA7XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbiBjb3B5IGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluIGNvcHkgYnJhbmNoIGZvciAke2RvY0luZm8udnBhdGh9IHRvICR7ZG9jSW5mby5yZW5kZXJQYXRofSBlcnJvcj0ke2Vyci5zdGFjayA/IGVyci5zdGFjayA6IGVycn1gKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckRvY3VtZW50Mihjb25maWcsIGRvY0luZm8pIHtcbi8vICAgICBjb25zdCByZW5kZXJTdGFydCA9IG5ldyBEYXRlKCk7XG4vLyAgICAgY29uc3QgcmVuZGVyQmFzZU1ldGFkYXRhID0gZG9jSW5mby5iYXNlTWV0YWRhdGE7XG4vLyAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50IGAsIGRvY0luZm8pO1xuXG4vLyAgICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChkb2NJbmZvLnZwYXRoKTtcbi8vICAgICBpZiAocmVuZGVyZXIpIHtcblxuLy8gICAgICAgICAvLyBjb25zb2xlLmxvZyhgQUJPVVQgVE8gUkVOREVSICR7cmVuZGVyZXIubmFtZX0gJHtkb2NJbmZvLnZwYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofWApO1xuLy8gICAgICAgICB0cnkge1xuXG5cbi8vICAgICAgICAgICAgIC8vIFNldCB1cCByZXF1aXJlZCBtZXRhZGF0YSB2YWx1ZXNcblxuLy8gICAgICAgICAgICAgZG9jSW5mby5tZXRhZGF0YS5jb25maWcgICAgICA9IGNvbmZpZztcbi8vICAgICAgICAgICAgIGRvY0luZm8ubWV0YWRhdGEucGFydGlhbCA9IChmbmFtZSwgbWV0YWRhdGEpID0+IHtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gY29uZmlnLmFrYXNoYS5wYXJ0aWFsKGNvbmZpZywgZm5hbWUsIG1ldGFkYXRhKTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGRvY0luZm8ubWV0YWRhdGEucGFydGlhbFN5bmMgPSAoZm5hbWUsIG1ldGFkYXRhKSA9PiB7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZy5ha2FzaGEucGFydGlhbFN5bmMoY29uZmlnLCBmbmFtZSwgbWV0YWRhdGEpO1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgZG9jSW5mby5tZXRhZGF0YS5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuLy8gICAgICAgICAgICAgZG9jSW5mby5tZXRhZGF0YS5wbHVnaW4gPSBjb25maWcucGx1Z2luO1xuXG4vLyAgICAgICAgICAgICAvLyBSZW5kZXIgdGhlIGRvY3VtZW50IC0gb3V0cHV0IGdvZXMgdG8gXCJkb2NyZW5kZXJlZFwiXG5cbi8vICAgICAgICAgICAgIGxldCBkb2NyZW5kZXJlZDtcbi8vICAgICAgICAgICAgIHRyeSB7XG4vLyAgICAgICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbi8vICAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBkb2NJbmZvLmZzcGF0aCxcbi8vICAgICAgICAgICAgICAgICAgICAgY29udGVudDogZG9jSW5mby5kb2NDb250ZW50LFxuLy8gICAgICAgICAgICAgICAgICAgICBib2R5OiBkb2NJbmZvLmRvY0JvZHksXG4vLyAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiBkb2NJbmZvLm1ldGFkYXRhXG4vLyAgICAgICAgICAgICAgICAgfTtcbi8vICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh7XG4vLyAgICAgICAgICAgICAgICAgLy8gICAgIHRpdGxlOiAnYmVmb3JlIERPQ1VNRU5UIHJlbmRlcmVyLnJlbmRlcicsXG4vLyAgICAgICAgICAgICAgICAgLy8gICAgIGZzcGF0aDogZG9jSW5mby5mc3BhdGgsXG4vLyAgICAgICAgICAgICAgICAgLy8gICAgIGNvbnRlbnQ6IGRvY0luZm8uZG9jQ29udGVudCxcbi8vICAgICAgICAgICAgICAgICAvLyAgICAgYm9keTogZG9jSW5mby5kb2NCb2R5LFxuLy8gICAgICAgICAgICAgICAgIC8vICAgICBtZXRhZGF0YTogZG9jSW5mby5tZXRhZGF0YSxcbi8vICAgICAgICAgICAgICAgICAvLyAgICAgaW5mbzogZG9jSW5mby5pbmZvXG4vLyAgICAgICAgICAgICAgICAgLy8gfSk7XG4vLyAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0LmNvbnRlbnQgIT09ICdzdHJpbmcnXG4vLyAgICAgICAgICAgICAgICAgIHx8IHR5cGVvZiBjb250ZXh0LmJvZHkgIT09ICdzdHJpbmcnKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybihgcmVuZGVyIHNob3VsZCBmYWlsIGZvciAke3V0aWwuaW5zcGVjdChjb250ZXh0KX0gYCwgZG9jSW5mbyk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGRvY3JlbmRlcmVkID0gYXdhaXQgcmVuZGVyZXIucmVuZGVyKGNvbnRleHQpO1xuLy8gICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4vLyAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gJHsoZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyKX1gKTtcbi8vICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHJlbmRlcmluZyAke2RvY0luZm8udnBhdGh9ICR7KGVyci5zdGFjayA/IGVyci5zdGFjayA6IGVycil9YCk7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkb2NyZW5kZXJlZCk7XG4vLyAgICAgICAgICAgICBhd2FpdCBkYXRhLnJlcG9ydChkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgsIGNvbmZpZy5yZW5kZXJUbywgXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRklSU1QgUkVOREVSXCIsIHJlbmRlclN0YXJ0KTtcbiAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgLy8gVGhlcmUgbWF5IGJlIGEgbGF5b3V0LCB3aGljaCB3aWxsIGJlIGluIG1ldGFkYXRhLmxheW91dFxuLy8gICAgICAgICAgICAgLy8gSWYgc28sIGdldCB0aGUgbGF5b3V0IGZpbGVcbi8vICAgICAgICAgICAgIC8vIENvbnN0cnVjdCBhIG5ldyBtZXRhZGF0YSAtLSBhbmQgaXQncyBcImNvbnRlbnRcIiBpc1xuLy8gICAgICAgICAgICAgLy8gc2V0IGZyb20gZG9jcmVuZGVyZWRcbi8vICAgICAgICAgICAgIC8vIFRoZW4gcmVuZGVyIHRoZSBkb2N1bWVudCBpbnRvIFwibGF5b3V0cmVuZGVyZWRcIlxuLy8gICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGNweSBkb2NyZW5kZXJlZCB0byBsYXlvdXRyZW5kZXJlZFxuXG4vLyAgICAgICAgICAgICBsZXQgbGF5b3V0cmVuZGVyZWQ7XG4vLyAgICAgICAgICAgICBpZiAoZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQpIHtcblxuLy8gICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dHMgPSBjb25maWcuYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGU7XG4vLyAgICAgICAgICAgICAgICAgLy8gYXdhaXQgbGF5b3V0cy5pc1JlYWR5KCk7XG5cbi8vICAgICAgICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBsYXlvdXRzLmZpbmQoZG9jSW5mby5tZXRhZGF0YS5sYXlvdXQpO1xuLy8gICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBsYXlvdXQgZm91bmQgaW4gJHt1dGlsLmluc3BlY3QoY29uZmlnLmxheW91dERpcnMpfSBmb3IgJHtkb2NJbmZvLm1ldGFkYXRhLmxheW91dH0gaW4gZmlsZSAke2RvY0luZm8udnBhdGh9YCk7XG4vLyAgICAgICAgICAgICAgICAgfVxuXG4vLyAgICAgICAgICAgICAgICAgbGV0IGxheW91dG1ldGFkYXRhOiBhbnkgPSB7fTtcbi8vICAgICAgICAgICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiBmb3VuZC5tZXRhZGF0YSkge1xuLy8gICAgICAgICAgICAgICAgICAgICBsYXlvdXRtZXRhZGF0YVt5cHJvcF0gPSBmb3VuZC5tZXRhZGF0YVt5cHJvcF07XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGZvciAodmFyIHlwcm9wIGluIGRvY0luZm8ubWV0YWRhdGEpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgaWYgKHlwcm9wICE9PSAnbGF5b3V0Jykge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0bWV0YWRhdGFbeXByb3BdID0gZG9jSW5mby5tZXRhZGF0YVt5cHJvcF07XG4vLyAgICAgICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgbGF5b3V0bWV0YWRhdGEuY29udGVudCA9IGRvY3JlbmRlcmVkO1xuXG4vLyAgICAgICAgICAgICAgICAgY29uc3QgcmVuZGVyZXIgPSBjb25maWcuZmluZFJlbmRlcmVyUGF0aChkb2NJbmZvLm1ldGFkYXRhLmxheW91dCk7XG5cbi8vICAgICAgICAgICAgICAgICBpZiAoIXJlbmRlcmVyKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcmVuZGVyZXIgZm9yICR7bGF5b3V0bWV0YWRhdGEubGF5b3V0fSBpbiBmaWxlICR7ZG9jSW5mby52cGF0aH1gKTs7XG4vLyAgICAgICAgICAgICAgICAgfVxuXG4vLyAgICAgICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbi8vICAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBmb3VuZC5mc3BhdGgsXG4vLyAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZvdW5kLmRvY0NvbnRlbnQsXG4vLyAgICAgICAgICAgICAgICAgICAgIGJvZHk6IGZvdW5kLmRvY0JvZHksXG4vLyAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiBsYXlvdXRtZXRhZGF0YVxuLy8gICAgICAgICAgICAgICAgIH07XG5cbi8vICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnRleHQuY29udGVudCAhPT0gJ3N0cmluZydcbi8vICAgICAgICAgICAgICAgICAgfHwgdHlwZW9mIGNvbnRleHQuYm9keSAhPT0gJ3N0cmluZycpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW5kZXJEb2N1bWVudCBMQVlPVVQgUkVOREVSSU5HIGZvciAke2RvY0luZm8udnBhdGh9IHdpdGggbGF5b3V0ICR7ZG9jSW5mby5tZXRhZGF0YS5sYXlvdXR9IGhhcyBubyBjb250ZXh0LmNvbnRlbnQgb3IgY29udGV4dC5ib2R5IHRvIHdoaWNoIHRvIHJlbmRlciB0aGUgY29udGVudCAke3V0aWwuaW5zcGVjdChjb250ZXh0KX0gJHt1dGlsLmluc3BlY3QoZm91bmQpfWApO1xuLy8gICAgICAgICAgICAgICAgIH1cblxuLy8gICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJEb2N1bWVudCBgLCBmb3VuZCk7XG4vLyAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50IGAsIGxheW91dG1ldGFkYXRhKTtcblxuLy8gICAgICAgICAgICAgICAgIHRyeSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIGxheW91dHJlbmRlcmVkXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICA9IGF3YWl0IHJlbmRlcmVyLnJlbmRlcihjb250ZXh0KTtcbi8vICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIGxldCBlZSA9IG5ldyBFcnJvcihgRXJyb3IgcmVuZGVyaW5nICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8ubWV0YWRhdGEubGF5b3V0fSAke2Uuc3RhY2sgPyBlLnN0YWNrIDogZX1gKTtcbi8vICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlZSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93IGVlO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgbGF5b3V0cmVuZGVyZWQgPSBkb2NyZW5kZXJlZDtcbi8vICAgICAgICAgICAgIH1cblxuLy8gICAgICAgICAgICAgY29uc3QgcmVuZGVyU2Vjb25kUmVuZGVyID0gbmV3IERhdGUoKTtcbi8vICAgICAgICAgICAgIGF3YWl0IGRhdGEucmVwb3J0KGRvY0luZm8ubW91bnRQb2ludCwgZG9jSW5mby52cGF0aCwgY29uZmlnLnJlbmRlclRvLCBcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJTRUNPTkQgUkVOREVSXCIsIHJlbmRlclN0YXJ0KTtcblxuLy8gICAgICAgICAgICAgLy8gTmV4dCBzdGVwIGlzIHRvIHJ1biBNYWhhYmh1dGEgb24gdGhlIHJlbmRlcmVkIGNvbnRlbnRcbi8vICAgICAgICAgICAgIC8vIE9mIGNvdXJzZSwgTWFoYWJodXRhIGlzIG5vdCBhcHByb3ByaWF0ZSBmb3IgZXZlcnl0aGluZ1xuLy8gICAgICAgICAgICAgLy8gYmVjYXVzZSBub3QgZXZlcnl0aGluZyBpcyBIVE1MXG5cbi8vICAgICAgICAgICAgIGNvbnN0IGZvcm1hdCA9IHJlbmRlcmVyLnJlbmRlckZvcm1hdCh7IGZzcGF0aDogZG9jSW5mby5mc3BhdGggfSk7XG4vLyAgICAgICAgICAgICBjb25zdCBkb01haGFiaHV0YSA9IChmb3JtYXQgPT09ICdIVE1MJykgPyB0cnVlIDpmYWxzZTtcbi8vICAgICAgICAgICAgIGlmIChkb01haGFiaHV0YSkge1xuXG4vLyAgICAgICAgICAgICAgICAgdHJ5IHtcblxuLy8gICAgICAgICAgICAgICAgICAgICBjb25zdCBtYWhhbWV0YWRhdGE6IGFueSA9IHt9O1xuLy8gICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB5cHJvcCBpbiBkb2NJbmZvLm1ldGFkYXRhKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBtYWhhbWV0YWRhdGFbeXByb3BdID0gZG9jSW5mby5tZXRhZGF0YVt5cHJvcF07XG4vLyAgICAgICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICAgICAgbWFoYW1ldGFkYXRhLmNvbnRlbnQgPSBkb2NyZW5kZXJlZDtcblxuLy8gICAgICAgICAgICAgICAgICAgICBpZiAoZG9jSW5mby5tZXRhZGF0YS5jb25maWcubWFoYWJodXRhQ29uZmlnKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBtYWhhYmh1dGEuY29uZmlnKGRvY0luZm8ubWV0YWRhdGEuY29uZmlnLm1haGFiaHV0YUNvbmZpZyk7XG4vLyAgICAgICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYG1haGFtZXRhZGF0YWAsIG1haGFtZXRhZGF0YSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIGxheW91dHJlbmRlcmVkID0gYXdhaXQgbWFoYWJodXRhLnByb2Nlc3NBc3luYyhcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGxheW91dHJlbmRlcmVkLCBtYWhhbWV0YWRhdGEsIGNvbmZpZy5tYWhhZnVuY3Ncbi8vICAgICAgICAgICAgICAgICAgICAgKTtcblxuLy8gICAgICAgICAgICAgICAgICAgICAvLyBPTEQgZG9jcmVuZGVyZWQgPSBhd2FpdCB0aGlzLm1haGFydW4obGF5b3V0cmVuZGVyZWQsIGRvY2RhdGEsIGNvbmZpZy5tYWhhZnVuY3MpO1xuLy8gICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUyKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIGxldCBlZWUgPSBuZXcgRXJyb3IoYEVycm9yIHdpdGggTWFoYWJodXRhICR7ZG9jSW5mby52cGF0aH0gd2l0aCAke2RvY0luZm8ubWV0YWRhdGEubGF5b3V0fSAke2UyLnN0YWNrID8gZTIuc3RhY2sgOiBlMn1gKTtcbi8vICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlZWUpO1xuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdyBlZWU7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgfVxuXG4vLyAgICAgICAgICAgICBhd2FpdCBkYXRhLnJlcG9ydChkb2NJbmZvLm1vdW50UG9pbnQsIGRvY0luZm8udnBhdGgsIGNvbmZpZy5yZW5kZXJUbywgXG4vLyAgICAgICAgICAgICAgICAgXCJNQUhBQkhVVEFcIiwgcmVuZGVyU3RhcnQpO1xuXG4vLyAgICAgICAgICAgICBjb25zdCByZW5kZXJEZXN0ID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJUbywgZG9jSW5mby5yZW5kZXJQYXRoKTtcbi8vICAgICAgICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVuZGVyRGVzdCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuLy8gICAgICAgICAgICAgYXdhaXQgZnNwLndyaXRlRmlsZShyZW5kZXJEZXN0LCBsYXlvdXRyZW5kZXJlZCwgJ3V0Zi04Jyk7XG5cbi8vICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBSRU5ERVJFRCAke3JlbmRlcmVyLm5hbWV9ICR7ZG9jSW5mby5wYXRofSA9PT4gJHtyZW5kZXJUb0ZwYXRofWApO1xuLy8gICAgICAgICAgICAgY29uc3QgcmVuZGVyRW5kUmVuZGVyZWQgPSBuZXcgRGF0ZSgpO1xuLy8gICAgICAgICAgICAgYXdhaXQgZGF0YS5yZXBvcnQoXG4vLyAgICAgICAgICAgICAgICAgZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoLFxuLy8gICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJUbyxcbi8vICAgICAgICAgICAgICAgICBcIlJFTkRFUkVEXCIsIHJlbmRlclN0YXJ0KTtcbi8vICAgICAgICAgICAgIHJldHVybiBgJHtyZW5kZXJlci5uYW1lfSAke2RvY0luZm8udnBhdGh9ID09PiAke2RvY0luZm8ucmVuZGVyUGF0aH0gKCR7KHJlbmRlckVuZFJlbmRlcmVkLnZhbHVlT2YoKSAtIHJlbmRlclN0YXJ0LnZhbHVlT2YoKSkgLyAxMDAwfSBzZWNvbmRzKVxcbiR7YXdhaXQgZGF0YS5kYXRhNGZpbGUoZG9jSW5mby5tb3VudFBvaW50LCBkb2NJbmZvLnZwYXRoKX1gO1xuLy8gICAgICAgICB9IGNhdGNoIChlcnIpIHtcbi8vICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluIHJlbmRlcmVyIGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4vLyAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluIHJlbmRlcmVyIGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ09QWUlORyAke2RvY0luZm8ucGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH1gKTtcbi8vICAgICAgICAgdHJ5IHtcbi8vICAgICAgICAgICAgIGNvbnN0IHJlbmRlclRvRnBhdGggPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlclRvLCBkb2NJbmZvLnJlbmRlclBhdGgpO1xuLy8gICAgICAgICAgICAgY29uc3QgcmVuZGVyVG9EaXIgPSBwYXRoLmRpcm5hbWUocmVuZGVyVG9GcGF0aCk7XG4vLyAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocmVuZGVyVG9EaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuLy8gICAgICAgICAgICAgYXdhaXQgZnNwLmNvcHlGaWxlKGRvY0luZm8uZnNwYXRoLCByZW5kZXJUb0ZwYXRoKTtcbi8vICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDT1BJRUQgJHtkb2NJbmZvLnBhdGh9ID09PiAke3JlbmRlclRvRnBhdGh9YCk7XG4vLyAgICAgICAgICAgICBjb25zdCByZW5kZXJFbmRDb3BpZWQgPSBuZXcgRGF0ZSgpO1xuLy8gICAgICAgICAgICAgcmV0dXJuIGBDT1BZICR7ZG9jSW5mby52cGF0aH0gPT0+ICR7cmVuZGVyVG9GcGF0aH0gKCR7KHJlbmRlckVuZENvcGllZC52YWx1ZU9mKCkgLSByZW5kZXJTdGFydC52YWx1ZU9mKCkpIC8gMTAwMH0gc2Vjb25kcylgO1xuLy8gICAgICAgICB9IGNhdGNoKGVycikge1xuLy8gICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW4gY29weSBicmFuY2ggZm9yICR7ZG9jSW5mby52cGF0aH0gdG8gJHtkb2NJbmZvLnJlbmRlclBhdGh9IGVycm9yPSR7ZXJyLnN0YWNrID8gZXJyLnN0YWNrIDogZXJyfWApO1xuLy8gICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbiBjb3B5IGJyYW5jaCBmb3IgJHtkb2NJbmZvLnZwYXRofSB0byAke2RvY0luZm8ucmVuZGVyUGF0aH0gZXJyb3I9JHtlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnJ9YCk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9XG4vLyB9XG5cbi8qKlxuICogUmVuZGVyIGFsbCB0aGUgZG9jdW1lbnRzIGluIGEgc2l0ZSwgbGltaXRpbmdcbiAqIHRoZSBudW1iZXIgb2Ygc2ltdWx0YW5lb3VzIHJlbmRlcmluZyB0YXNrc1xuICogdG8gdGhlIG51bWJlciBpbiBjb25maWcuY29uY3VycmVuY3kuXG4gKlxuICogQHBhcmFtIGNvbmZpZ1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbmRlcihjb25maWcpIHtcblxuICAgIGNvbnN0IGRvY3VtZW50cyA9IDxEb2N1bWVudHNGaWxlQ2FjaGU+Y29uZmlnLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAvLyBjb25zb2xlLmxvZygnQ0FMTElORyBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCcpO1xuICAgIGF3YWl0IGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkKCk7XG4gICAgXG4gICAgLy8gMS4gR2F0aGVyIGxpc3Qgb2YgZmlsZXMgZnJvbSBSZW5kZXJGaWxlQ2FjaGVcbiAgICBjb25zdCBmaWxleiA9IGF3YWl0IGRvY3VtZW50cy5wYXRocygpO1xuICAgIC8vIGNvbnNvbGUubG9nKGBuZXdlcnJlbmRlciBmaWxleiAke2ZpbGV6Lmxlbmd0aH1gKTtcblxuICAgIC8vIDIuIEV4Y2x1ZGUgYW55IHRoYXQgd2Ugd2FudCB0byBpZ25vcmVcbiAgICBjb25zdCBmaWxlejIgPSBbXSBhcyBBcnJheTx7XG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICB9PjtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxleikge1xuICAgICAgICBsZXQgaW5jbHVkZSA9IHRydWU7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGVudHJ5KTtcbiAgICAgICAgbGV0IHN0YXRzO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RhdHMgPSBhd2FpdCBmc3Auc3RhdChlbnRyeS5mc3BhdGgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHsgc3RhdHMgPSB1bmRlZmluZWQ7IH1cbiAgICAgICAgaWYgKCFlbnRyeSkgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICBlbHNlIGlmICghc3RhdHMgfHwgc3RhdHMuaXNEaXJlY3RvcnkoKSkgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICAvLyBUaGlzIHNob3VsZCBhcmlzZSB1c2luZyBhbiBpZ25vcmUgY2xhdXNlXG4gICAgICAgIC8vIGVsc2UgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkudnBhdGgpID09PSAnLkRTX1N0b3JlJykgaW5jbHVkZSA9IGZhbHNlO1xuICAgICAgICAvLyBlbHNlIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LnZwYXRoKSA9PT0gJy5wbGFjZWhvbGRlcicpIGluY2x1ZGUgPSBmYWxzZTtcblxuICAgICAgICBpZiAoaW5jbHVkZSkge1xuICAgICAgICAgICAgLy8gVGhlIHF1ZXVlIGlzIGFuIGFycmF5IG9mIHR1cGxlcyBjb250YWluaW5nIHRoZVxuICAgICAgICAgICAgLy8gY29uZmlnIG9iamVjdCBhbmQgdGhlIHBhdGggc3RyaW5nXG4gICAgICAgICAgICBmaWxlejIucHVzaCh7XG4gICAgICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXG4gICAgICAgICAgICAgICAgaW5mbzogYXdhaXQgZG9jdW1lbnRzLmZpbmQoZW50cnkudnBhdGgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgbmV3ZXJyZW5kZXIgZmlsZXoyIGFmdGVyIGlnbm9yZSAke2ZpbGV6Mi5sZW5ndGh9YCk7XG5cblxuICAgIC8vIDMuIE1ha2UgYSBmYXN0cSB0byBwcm9jZXNzIHVzaW5nIHJlbmRlckRvY3VtZW50LFxuICAgIC8vICAgIHB1c2hpbmcgcmVzdWx0cyB0byB0aGUgcmVzdWx0cyBhcnJheVxuXG4gICAgLy8gVGhpcyBzZXRzIHVwIHRoZSBxdWV1ZSBwcm9jZXNzb3JcbiAgICAvLyBUaGUgY29uY3VycmVuY3kgc2V0dGluZyBsZXRzIHVzIHByb2Nlc3MgZG9jdW1lbnRzXG4gICAgLy8gaW4gcGFyYWxsZWwgd2hpbGUgbGltaXRpbmcgdG90YWwgaW1wYWN0LlxuICAgIGNvbnN0IHF1ZXVlOiBxdWV1ZUFzUHJvbWlzZWQ8e1xuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgfT4gPSBmYXN0cS5wcm9taXNlKFxuXG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgaW52b2tlZCBmb3IgZWFjaCBlbnRyeSBpbiB0aGVcbiAgICAgICAgLy8gcXVldWUuIEl0IGhhbmRsZXMgcmVuZGVyaW5nIHRoZSBxdWV1ZVxuICAgICAgICAvLyBUaGUgcXVldWUgaGFzIGNvbmZpZyBvYmplY3RzIGFuZCBwYXRoIHN0cmluZ3NcbiAgICAgICAgLy8gd2hpY2ggaXMgZXhhY3RseSB3aGF0J3MgcmVxdWlyZWQgYnlcbiAgICAgICAgLy8gcmVuZGVyRG9jdW1lbnRcbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gcmVuZGVyRG9jdW1lbnRJblF1ZXVlKGVudHJ5KVxuICAgICAgICAgICAgOiBQcm9taXNlPHsgcmVzdWx0PzogYW55OyBlcnJvcj86IGFueTsgfT5cbiAgICAgICAge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlckRvY3VtZW50SW5RdWV1ZSAke2VudHJ5LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCByZW5kZXJEb2N1bWVudChcbiAgICAgICAgICAgICAgICAgICAgZW50cnkuY29uZmlnLCBlbnRyeS5pbmZvXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgRE9ORSByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWAsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcmVzdWx0IH07XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBFUlJPUiByZW5kZXJEb2N1bWVudEluUXVldWUgJHtlbnRyeS5pbmZvLnZwYXRofWAsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBlcnJvciB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjb25maWcuY29uY3VycmVuY3kpO1xuXG4gICAgLy8gcXVldWUucHVzaCByZXR1cm5zIGEgUHJvbWlzZSB0aGF0J3MgZnVsZmlsbGVkIHdoZW5cbiAgICAvLyB0aGUgdGFzayBmaW5pc2hlcy5cbiAgICAvLyBIZW5jZSB3YWl0Rm9yIGlzIGFuIGFycmF5IG9mIFByb21pc2VzLlxuICAgIGNvbnN0IHdhaXRGb3IgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBmaWxlejIpIHtcbiAgICAgICAgd2FpdEZvci5wdXNoKHF1ZXVlLnB1c2goZW50cnkpKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGF1dG9tYXRpY2FsbHkgd2FpdHMgZm9yIGFsbCB0aG9zZVxuICAgIC8vIFByb21pc2VzIHRvIHJlc29sdmUsIHdoaWxlIG1ha2luZyB0aGUgcmVzdWx0c1xuICAgIC8vIGFycmF5IGNvbnRhaW4gcmVzdWx0cy5cbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgZm9yIChsZXQgcmVzdWx0IG9mIHdhaXRGb3IpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHJlc3VsdCk7XG4gICAgfVxuXG4gICAgLy8gNC4gSW52b2tlIGhvb2tTaXRlUmVuZGVyZWRcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdJbnZva2luZyBob29rU2l0ZVJlbmRlcmVkJyk7XG4gICAgICAgIGF3YWl0IGNvbmZpZy5ob29rU2l0ZVJlbmRlcmVkKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2spO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhvb2tTaXRlUmVuZGVyZWQgZmFpbGVkIGJlY2F1c2UgJHtlfWApO1xuICAgIH1cblxuICAgIC8vIDUuIHJldHVybiByZXN1bHRzXG4gICAgcmV0dXJuIHJlc3VsdHM7XG59O1xuIl19