'use strict';

const path      = require('path');
const HTMLRenderer = require('./HTMLRenderer');
const render   = require('./render');

const log   = require('debug')('akasha:ejsRenderer');
const error = require('debug')('akasha:error-ejsRenderer');

const ejs      = require('ejs');

// TODO support .php.ejs
class EJSRenderer extends HTMLRenderer {
    constructor() {
        super(".html.ejs", /^(.*\.html|.*\.php)\.(ejs)$/);
    }

    renderSync(text, metadata) {
        return ejs.render(text, metadata);
    }

    render(text, metadata) {
        /* return Promise.resolve(ejs.render(text, metadata)); */
        return new Promise((resolve, reject) => {
            try {
                resolve(ejs.render(text, metadata));
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

module.exports = new EJSRenderer();
