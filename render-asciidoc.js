'use strict';

const path      = require('path');
const HTMLRenderer = require('./HTMLRenderer');
const render   = require('./render');

const log   = require('debug')('akasha:asciidocRenderer');
const error = require('debug')('akasha:error-asciidocRenderer');

const asciidoctor = require('asciidoctor.js')();

const options = {
    doctype: 'book',
    attributes: 'showtitle'
};

class AsciidocRenderer extends HTMLRenderer {
    constructor() {
        super(".html.adoc", /^(.*\.html)\.(adoc)$/);
    }

    configuration() {
        return this;
    }


    renderSync(text, metadata) {
        // console.log('AsciidocRenderer renderSync '+ text);
        var ret = asciidoctor.convert(text, options);
        // console.log(ret);
        return ret;
    }

    render(text, metadata) {
        // console.log('AsciidocRenderer render');
        return new Promise((resolve, reject) => {
            try {
                resolve(asciidoctor.convert(text, options));
            } catch(e) {
                reject(e);
            }
        });
    }
}

module.exports = new AsciidocRenderer();
