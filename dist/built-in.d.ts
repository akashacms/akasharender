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
import { Plugin } from './Plugin.js';
import mahabhuta from 'mahabhuta';
import { Configuration } from './index.js';
import { type LinkCheckMode } from './link-checker.js';
export declare class BuiltInPlugin extends Plugin {
    #private;
    constructor();
    configure(config: Configuration, options: any): void;
    get config(): any;
    get resizequeue(): any;
    /**
     * Determine whether <link> tags in the <head> for local
     * URLs are relativized or absolutized.
     */
    set relativizeHeadLinks(rel: any);
    /**
     * Determine whether <script> tags for local
     * URLs are relativized or absolutized.
     */
    set relativizeScriptLinks(rel: any);
    /**
     * Determine whether <A> tags for local
     * URLs are relativized or absolutized.
     */
    set relativizeBodyLinks(rel: any);
    /**
     * Set the severity mode for internal (local) link checking.
     * One of 'ignore' | 'warn' | 'error' | 'fatal'.
     */
    setInternalLinkMode(config: any, mode: LinkCheckMode): this;
    /**
     * Set the severity mode for external (http/https) link checking.
     * One of 'ignore' | 'warn' | 'error' | 'fatal'.  'ignore' (the default)
     * disables external checking.
     */
    setExternalLinkMode(config: any, mode: LinkCheckMode): this;
    /**
     * Set the severity mode for non-HTTP links (mailto:, tel:, ...).
     * One of 'ignore' | 'warn' | 'error' | 'fatal'.  'ignore' (the default)
     * silently skips them; 'warn' logs them for review.
     */
    setOtherSchemesMode(config: any, mode: LinkCheckMode): this;
    /**
     * Add an external domain or URL (string) or RegExp to the link-check
     * whitelist.  Whitelisted external URLs are assumed valid and never fetched.
     */
    addLinkCheckWhitelist(config: any, entry: string | RegExp): this;
    /**
     * Select which external per-URL checker to use: 'fetch' (built-in,
     * zero-dependency) or 'link-check' (lazy-loads the site-author-installed
     * `link-check` package).
     */
    setExternalChecker(config: any, which: 'fetch' | 'link-check'): this;
    doStylesheets(metadata: any): string;
    doHeaderJavaScript(metadata: any): string;
    doFooterJavaScript(metadata: any): string;
    addImageToResize(src: string, resizewidth: number, resizeto: string, docPath: string): void;
    onSiteRendered(config: any): Promise<void>;
}
export declare const mahabhutaArray: (options: any, config?: Configuration, akasha?: any, plugin?: Plugin) => mahabhuta.MahafuncArray;
//# sourceMappingURL=built-in.d.ts.map