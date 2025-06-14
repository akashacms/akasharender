/**
 *
 * Copyright 2025- David Herron
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
import { CustomElement as MahaCustomElement, ElementTweaker as MahaElementTweaker, Munger as MahaMunger, PageProcessor as MahaPageProcessor, Mahafunc as MahaMahafunc } from "mahabhuta";
import { Configuration, Plugin } from "./index.js";
export declare class Mahafunc extends MahaMahafunc {
    #private;
    constructor(config: Configuration, akasha: any, plugin: Plugin);
    get config(): Configuration;
    get akasha(): any;
    get plugin(): Plugin;
}
export declare class CustomElement extends MahaCustomElement {
    #private;
    constructor(config: Configuration, akasha: any, plugin: Plugin);
    get config(): Configuration;
    get akasha(): any;
    get plugin(): Plugin;
}
export declare class ElementTweaker extends MahaElementTweaker {
    #private;
    constructor(config: Configuration, akasha: any, plugin: Plugin);
    get config(): Configuration;
    get akasha(): any;
    get plugin(): Plugin;
}
export declare class Munger extends MahaMunger {
    #private;
    constructor(config: Configuration, akasha: any, plugin: Plugin);
    get config(): Configuration;
    get akasha(): any;
    get plugin(): Plugin;
}
export declare class PageProcessor extends MahaPageProcessor {
    #private;
    constructor(config: Configuration, akasha: any, plugin: Plugin);
    get config(): Configuration;
    get akasha(): any;
    get plugin(): Plugin;
}
//# sourceMappingURL=mahafuncs.d.ts.map