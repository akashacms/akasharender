'use strict';

const util     = require('util');
const path     = require('path');
const HTMLRenderer = require('./HTMLRenderer');
const akasha   = require('./index');
class JSONRenderer extends HTMLRenderer {
    constructor() {
        super(".html.json", /^(.*\.html)\.(json)$/);
    }

    renderSync(text, metadata) {
        var json = JSON.parse(text);
        return akasha.partialSync(metadata.config, metadata.JSONFormatter, { data: json });
    }

    async render(text, metadata) {
        try {
            var json = JSON.parse(text);
            // console.log(`JSONRenderer ${text} ==> ${util.inspect(json)}`);
            // console.log(`JSONRenderer JSONFormatter ${metadata.JSONFormatter}`);
            await akasha.partial(metadata.config, metadata.JSONFormatter, { data: json });
        } catch(e) {
            var docpath = metadata.document ? metadata.document.path : "unknown";
            var errstack = e.stack ? e.stack : e;
            throw "Error with JSON in file "+ docpath +" "+ errstack;
        }
    }
}

module.exports = new JSONRenderer();
