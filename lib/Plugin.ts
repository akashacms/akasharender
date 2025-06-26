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

import { Configuration } from "./index.js";

/*
 * Ideally, the options object would have a declared data type,
 * and TypeScript could help us enforce types.
 *
 * The base type has a link to the config, and each Plugin
 * adds its own fields.  In loosey-goosey JavaScript we just
 * declare a blank object and add fields as we wish.
 *
 * I attempted to use this as a base type, then use Union
 * types in each Plugin.  The type machinations became
 * impossible, unfortunately.
 *
export type PluginBaseOptions = {
    config?: Configuration
};
 *
 * The solution is adding a new attribute, config.  Any
 * plugin can now get the config with this.config.
 */

export class Plugin {

    #name: string;
    #options;
    #config: Configuration;
    #akasha;

    constructor(name) {
        this.#name  = name;
    }

    set options(newOptions) { this.#options = newOptions; }
    get options() { return this.#options; }
    set config(newConfig) { this.#config = newConfig; }
    get config(): Configuration { return this.#config; }
    get akasha() { return this.#akasha; }
    set akasha(_akasha) { this.#akasha = _akasha; }

    /**
     * Add this plugin to the configuration object.
     */
    configure(config, options) {
        throw new Error("Must implement configure function");
    }

    /**
     * Getter for the plugin name
     */
    get name() { return this.#name; }

    /**
     * Getter for object describing the additional FileCache fields
     * to index.  Plugins may be interested in specific data that must
     * be indexed.
     *
     * This function returns an empty object.  Any plugin wishing to
     * have an indexed field should implement this, and modify this object
     * appropriately.
     *
     * The object returned has four fields, <code>documents</code>,
     * <code>assets</code>, <code>layouts</code>, and <code>partials</code>.
     *
     * Any field that is <code>undefined</code> is to be ignored.  Otherwise
     * the field must be an object listing the fields to index.  This
     * mechanism does not support setting the index type.
     */
    get cacheIndexes() {
        return {
            documents: undefined, // {},
            assets: undefined, // {},
            layouts: undefined, // {},
            partials: undefined, // {}
        };
    }
};
