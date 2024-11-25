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
import { Plugin } from './Plugin.js';
import mahabhuta from 'mahabhuta';
export declare class BuiltInPlugin extends Plugin {
    #private;
    constructor();
    configure(config: any, options: any): void;
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
    doStylesheets(metadata: any): string;
    doHeaderJavaScript(metadata: any): string;
    doFooterJavaScript(metadata: any): string;
    addImageToResize(src: any, resizewidth: any, resizeto: any, docPath: any): void;
    onSiteRendered(config: any): Promise<void>;
}
export declare const mahabhutaArray: (options: any) => mahabhuta.MahafuncArray;
//# sourceMappingURL=built-in.d.ts.map