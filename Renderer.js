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

// const filez = require('./filez');
const fs    = require('fs-extra');
const path  = require('path');

const _renderer_name = Symbol('name');
const _renderer_regex = Symbol('regex');
const _renderer_akasha = Symbol('akasha');
const _renderer_config = Symbol('config');


module.exports = class Renderer {
    constructor(name, regex) {
        this[_renderer_name]  = name;
        if (regex instanceof RegExp) {
            this[_renderer_regex] = [ regex ];
        } else if (regex instanceof Array) {
            this[_renderer_regex] = regex;
        } else {
            throw new Error('regex must be RegExp or Array of RegExp');
        }
        this[_renderer_akasha] = undefined;
        this[_renderer_config] = undefined;
    }

    get akasha() { return this[_renderer_akasha]; }
    set akasha(_akasha) { this[_renderer_akasha] = _akasha; }
    get config() { return this[_renderer_config]; }
    set config(_config) { this[_renderer_config] = _config; }
    get name() { return this[_renderer_name]; }
    get regex() { return this[_renderer_regex]; }

    match(fname) {
        var matches;
        for (var regex of this.regex) {
            if ((matches = fname.match(regex)) !== null) {
                return true;
            }
        }
        return false;
    }

    /* {
    	path: matches[0],
    	renderedFileName: matches[1],
    	extension: matches[2]
    }; */

    filePath(fname) {
        // log(`${this._name} filePath ${fname}`);
        var matches;
        for (var regex of this.regex) {
            if ((matches = fname.match(regex)) !== null) {
                return matches[1];
            }
        }
        return null;
    }

    sourcePathMatchRenderPath(sourcePath, rendersTo) {
        // console.log(`sourcePathMatchRenderPath sourcePath ${sourcePath} rendersTo ${rendersTo}`);
        if (path.dirname(sourcePath) !== path.dirname(rendersTo)) {
            // console.log(`sourcePathMatchRenderPath DIR sourcePath ${path.dirname(sourcePath)}  DID NOT MATCH DIR rendersTo ${path.dirname(rendersTo)}`);
            return false;
        }
        let renderPath = this.filePath(sourcePath);
        // console.log(`sourcePathMatchRenderPath renderPath ${renderPath} rendersTo ${rendersTo}`);
        if (path.basename(renderPath) === path.basename(rendersTo)) {
            // console.log(`sourcePathMatchRenderPath basename renderPath ${path.basename(renderPath)} MATCHES rendersTo ${path.basename(rendersTo)}`);
            return true;
        }
        // console.log(`sourcePathMatchRenderPath basename renderPath ${path.basename(renderPath)} DOES NOT MATCH rendersTo ${path.basename(rendersTo)}`);
        return false;
    }

    fileExtension(fname) {
        var matches;
        for (var regex of this.regex) {
            if ((matches = fname.match(regex)) !== null) {
                return matches[2];
            }
        }
        return null;
    }

    readFile(basedir, fpath) {
        return fs.readFile(path.join(basedir, fpath), 'utf8');
    }

    writeFile(renderTo, fpath, text) {
        return fs.outputFile(path.join(renderTo, fpath), text, 'utf8');
        // remove circular dependency
        // return filez.writeFile(renderTo, fpath, text);
    }

    render(text, metadata) {
        throw new Error('implement render method');
    }

    renderSync(text, metadata) {
        throw new Error('implement renderSync method');
    }

    renderToFile(dir, fpath, renderTo, renderToPlus, metadata, config) {
        throw new Error('implement renderToFile method');
    }

};
