/**
 *
 * Copyright 2020 David Herron
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

const path      = require('path');
const HTMLRenderer = require('./HTMLRenderer');

const Liquid = require('liquid');
const engine = new Liquid.Engine();

module.exports = class LiquidRenderer extends HTMLRenderer {
    constructor() {
        super(".html.liquid", /^(.*\.html)\.(liquid)$/);
    }

    async render(text, metadata) {
        try {
            let template = await engine.parse(text);
            let result = await template.render(metadata);
            return result;
        } catch(e) { 
            var docpath = metadata.document ? metadata.document.path : "unknown";
            var errstack = e.stack ? e.stack : e;
            throw new Error(`Error with Liquid in file ${docpath} ${errstack}`);
        }
    }

    /**
     * We cannot allow PHP code to run through Mahabhuta.
     */
    doMahabhuta(fpath) {
        return true;
    }
}
