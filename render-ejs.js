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

const path      = require('path');
const HTMLRenderer = require('./HTMLRenderer');

const ejs      = require('ejs');
const ejsutils = require('ejs/lib/utils.js');

const getMounted = (dir) => {
    if (typeof dir === 'string') return dir;
    else return dir.src;
};

// TODO support .php.ejs
module.exports = class EJSRenderer extends HTMLRenderer {
    constructor() {
        super(".html.ejs", /^(.*\.html|.*\.php)\.(ejs)$/);
    }

    // This was for an attempt to list the directories to search when
    // satisfying an "include" EJS tag.  This could have been a way
    // to circumvent <partial> tags

    getEJSOptions(fspath) {
        if (this.ejsOptions) {
            let opts = ejsutils.shallowCopy({}, this.ejsOptions);
            opts.filename = fspath;
            return opts;
        }

        this.ejsOptions = {
            rmWhitespace: true,
            filename: fspath
        };

        // console.log(`getEJSOptions `, this);
        if (!this.config) throw new Error(`getEJSOptions no config`);
        const layoutsMounted = this.config.layoutDirs
                        ? this.config.layoutDirs.map(getMounted)
                        : undefined;
        const partialsMounted = this.config.partialsDirs
                        ? this.config.partialsDirs.map(getMounted)
                        : undefined;
        const loadFrom = partialsMounted
                        ? partialsMounted.concat(layoutsMounted)
                        : layoutsMounted;
        // console.log(`getEJSOptions loadFrom `, loadFrom);
        if (loadFrom) this.ejsOptions.views = loadFrom;
        return this.ejsOptions;
    }

    renderSync(text, metadata, vpinfo) {
        let opts = this.getEJSOptions(vpinfo ? vpinfo.fspath : undefined);
        // console.log(`render  ${text} ${metadata} ${opts}`);
        return ejs.render(text, metadata, opts);
    }

    render(text, metadata, vpinfo) {
        /* return Promise.resolve(ejs.render(text, metadata)); */
        return new Promise((resolve, reject) => {
            try {
                let opts = this.getEJSOptions(vpinfo ? vpinfo.fspath : undefined);
                // console.log(`render async ${text} ${metadata} ${opts}`);
                resolve(ejs.render(text, metadata, opts));
            } catch(e) {
                var docpath = metadata.document ? metadata.document.path : "unknown";
                var errstack = e.stack ? e.stack : e;
                reject("Error with EJS in file "+ docpath +" "+ errstack);
            }
        });
    }

    /**
     * We cannot allow PHP code to run through Mahabhuta.
     */
    doMahabhuta(fpath) {
        if (/\.php\.ejs$/.test(fpath))
            return false;
        else
            return true;
    }
}
