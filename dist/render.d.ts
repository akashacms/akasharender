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
import { Configuration } from './index.js';
import { RenderingContext } from '@akashacms/renderers';
export type RenderingResults = {
    vpath?: string;
    renderPath?: string;
    renderFormat: string;
    renderStart?: number;
    renderEnd?: number;
    renderFirstStart?: number;
    renderFirstEnd?: number;
    renderLayoutStart?: number;
    renderLayoutEnd?: number;
    renderMahaStart?: number;
    renderMahaEnd?: number;
    renderFirstElapsed?: number;
    renderLayoutElapsed?: number;
    renderMahaElapsed?: number;
    renderTotalElapsed?: number;
    skipped?: boolean;
    errors?: Array<Error>;
};
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
export declare function renderContent(config: Configuration, rc: RenderingContext): Promise<{
    rendererName?: string;
    format?: string;
    rendered: string;
}>;
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
export declare function renderDocument2(config: Configuration, docInfo: any): Promise<RenderingResults>;
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
export declare function renderDocument(config: Configuration, docInfo: any): Promise<string>;
/**
 * Render all the documents in a site, limiting
 * the number of simultaneous rendering tasks
 * to the number in config.concurrency.
 *
 * @param config
 * @returns
 */
export declare function render(config: any): Promise<any[]>;
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
export declare function isDocumentUpToDate(config: Configuration, docInfo: any): Promise<boolean>;
/**
 * Options controlling the behavior of render2.
 */
export type Render2Options = {
    /**
     * When true, every document is re-rendered regardless of
     * output file timestamps.  This matches the historical
     * behavior and is exposed on the CLI as `--force-render-all`.
     */
    forceRenderAll?: boolean;
};
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
export declare function render2(config: any, options?: Render2Options): Promise<Array<RenderingResults>>;
//# sourceMappingURL=render.d.ts.map