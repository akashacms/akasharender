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

const tempura = require("tempura");
const partialFuncs = import('./partial-funcs.mjs');


function extractFileNameMetaData(args) {
    let fileName;
    let data = {};
    for (var prop in args) {
        if (prop === 'fileName') {
            fileName = args[prop];
            continue;
        }
        if (!(prop in data)) {
            data[prop] = args[prop];
        }
    }
    return { fileName, metadata: data };
}


module.exports = class TempuraRenderer extends HTMLRenderer {
    constructor() {
        super(".html.tempura", /^(.*\.html)\.(tempura)$/);
    }

    async render(text, metadata) {
        try {
            const renderer = this;
            const template = tempura.compile(text, {
                async: true,
                loose: true,
                blocks: {
                    async partial (args) {
                        let {
                            fileName, metadata
                        } = extractFileNameMetaData(args);
                        // console.log(`TempuraRenderer render partial ${fileName}`, metadata);
                        return renderer.akasha.partial(
                               renderer.config, fileName, metadata);
                    },
                    partialSync (args) {
                        let {
                            fileName, metadata
                        } = extractFileNameMetaData(args);
                        // console.log(`TempuraRenderer render partialSync ${fileName}`, metadata);
                        return renderer.akasha.partialSync(
                               renderer.config, fileName, metadata);
                    }
                }
            });
            // console.log(`TempuraRenderer render ${text}`, metadata.data);
            return template(metadata ? metadata : {});
        } catch(e) { 
            let docpath = metadata.document
                        ? metadata.document.path : "unknown";
            let errstack = e.stack ? e.stack : e;
            throw new Error(`Error with Handlebars in file ${docpath} ${errstack}`);
        }
    }

    renderSync(text, metadata) {
        try {
            const renderer = this;
            const template = tempura.compile(text, {
                async: false,
                loose: true,
                blocks: {
                    async partial (args) {
                        throw new Error(`TempuraRenderer does not support asynchronous rendering in synchronous mode`);
                    },
                    partialSync (args) {
                        let {
                            fileName, metadata
                        } = extractFileNameMetaData(args);
                        // console.log(`TempuraRenderer renderSync partialSync ${fileName}`, metadata);
                        return renderer.akasha.partialSync(
                               renderer.config, fileName, metadata);
                    }
                }
            });
            return template(metadata ? metadata : {});
        } catch(e) { 
            let docpath = metadata.document
                        ? metadata.document.path : "unknown";
            let errstack = e.stack ? e.stack : e;
            throw new Error(`Error with Handlebars in file ${docpath} ${errstack}`);
        }
    }

    /**
     * We cannot allow PHP code to run through Mahabhuta.
     */
    doMahabhuta(fpath) {
        return true;
    }
}
