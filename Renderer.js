'use strict';

const filez = require('./filez');
const fs    = require('fs-extra');
const path  = require('path');

const log   = require('debug')('akasha:Renderer');
const error = require('debug')('akasha:error-Renderer');

const _renderer_name = Symbol('name');
const _renderer_regex = Symbol('regex');


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
    }

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
        return filez.writeFile(renderTo, fpath, text);
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
