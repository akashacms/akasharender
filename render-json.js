'use strict';

const util     = require('util');
const path     = require('path');
const HTMLRenderer = require('./HTMLRenderer');
const render   = require('./render');
const akasha   = require('./index');
const co       = require('co');
const mahaPartial = require('mahabhuta/maha/partial');

const log   = require('debug')('akasha:jsonRenderer');
const error = require('debug')('akasha:error-jsonRenderer');

class JSONRenderer extends HTMLRenderer {
    constructor() {
        super(".html.json", /^(.*\.html)\.(json)$/);
    }

    renderSync(text, metadata) {
        var json = JSON.parse(text);
        return mahaPartial.doPartialSync(metadata.JSONFormatter, { data: json });
        // return akasha.partialSync(config, metadata.JSONFormatter, { data: json });
    }

    render(text, metadata) {
        return co(function* () {
            var json = JSON.parse(text);
            // console.log(`JSONRenderer ${text} ==> ${util.inspect(json)}`);
            // console.log(`JSONRenderer JSONFormatter ${metadata.JSONFormatter}`);
            return yield mahaPartial.doPartialAsync(metadata.JSONFormatter, { data: json });
            // return yield akasha.partial(config, metadata.JSONFormatter, { data: json });
        })
        .catch(e => {
            var docpath = metadata.document ? metadata.document.path : "unknown";
            var errstack = e.stack ? e.stack : e;
            throw "Error with JSON in file "+ docpath +" "+ errstack;
        });
        /* return new Promise((resolve, reject) => {
            try {
                var json = JSON.parse(text);
                resolve(akasha.partial(metadata.JSONFormatter, { data: json }));
            } catch(e) {
                var docpath = metadata.document ? metadata.document.path : "unknown";
                var errstack = e.stack ? e.stack : e;
                reject("Error with EJS in file "+ docpath +" "+ errstack);
            }
        }); */
    }

    /**
     * We cannot allow PHP code to run through Mahabhuta.
     * /
    doMahabhuta(fpath) {
        if (/\.php\.ejs$/.test(fpath))
            return false;
        else
            return true;
    } */
}

module.exports = new JSONRenderer();
