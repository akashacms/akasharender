/**
 *
 * Copyright 2014-2019 David Herron
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

 'use strict';

const _plugin_name = Symbol('name');
const _plugin_options = Symbol('options');
const _plugin_akasha = Symbol('akasha');

module.exports = class Plugin {

    constructor(name) {
        this[_plugin_name]  = name;
    }

    set options(newOptions) { this[_plugin_options] = newOptions; }
    get options() { return this[_plugin_options]; }
    get akasha() { return this[_plugin_akasha]; }
    set akasha(_akasha) { this[_plugin_akasha] = _akasha; }

    /**
     * Add this plugin to the configuration object.
     */
    configure(config, options) {
        throw new Error("Must implement configure function");
    }

    /**
     * Getter for the plugin name
     */
    get name() { return this[_plugin_name]; }

};
