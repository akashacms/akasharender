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

/*
 * These classes simplify accessing the Configuration, Akasha, and
 * Plugin objects from Mahafuncs.
 * 
 * Previously Mahafunc code had to gyrate through this.array.options.config
 * and this.array.options.config.akasha to get access to these
 * objects.
 * 
 * These classes convert those to this.config and this.akasha and this.plugin
 */

import {
    CustomElement as MahaCustomElement,
    ElementTweaker as MahaElementTweaker,
    Munger as MahaMunger,
    PageProcessor as MahaPageProcessor,
    Mahafunc as MahaMahafunc
} from "mahabhuta";
import { Configuration, Plugin } from "./index.js";

export class Mahafunc extends MahaMahafunc {
    #config: Configuration;
    #akasha: any;
    #plugin: Plugin;

    constructor(config: Configuration, akasha: any, plugin: Plugin) {
        super();
        this.#config = config;
        this.#akasha = akasha;
        this.#plugin = plugin;
    }

    get config(): Configuration { return this.#config; }
    get akasha(): any           { return this.#akasha; }
    get plugin(): Plugin        { return this.#plugin; }
}

export class CustomElement extends MahaCustomElement {
    #config: Configuration;
    #akasha: any;
    #plugin: Plugin;

    constructor(config: Configuration, akasha: any, plugin: Plugin) {
        super();
        this.#config = config;
        this.#akasha = akasha;
        this.#plugin = plugin;
    }

    get config(): Configuration { return this.#config; }
    get akasha(): any           { return this.#akasha; }
    get plugin(): Plugin        { return this.#plugin; }
}

export class ElementTweaker extends MahaElementTweaker {
    #config: Configuration;
    #akasha: any;
    #plugin: Plugin;

    constructor(config: Configuration, akasha: any, plugin: Plugin) {
        super();
        this.#config = config;
        this.#akasha = akasha;
        this.#plugin = plugin;
    }

    get config(): Configuration { return this.#config; }
    get akasha(): any           { return this.#akasha; }
    get plugin(): Plugin        { return this.#plugin; }
}

export class Munger extends MahaMunger {
    #config: Configuration;
    #akasha: any;
    #plugin: Plugin;

    constructor(config: Configuration, akasha: any, plugin: Plugin) {
        super();
        this.#config = config;
        this.#akasha = akasha;
        this.#plugin = plugin;
    }

    get config(): Configuration { return this.#config; }
    get akasha(): any           { return this.#akasha; }
    get plugin(): Plugin        { return this.#plugin; }
}

export class PageProcessor extends MahaPageProcessor {
    #config: Configuration;
    #akasha: any;
    #plugin: Plugin;

    constructor(config: Configuration, akasha: any, plugin: Plugin) {
        super();
        this.#config = config;
        this.#akasha = akasha;
        this.#plugin = plugin;
    }

    get config(): Configuration { return this.#config; }
    get akasha(): any           { return this.#akasha; }
    get plugin(): Plugin        { return this.#plugin; }
}


