'use strict';

const path      = require('path');
const util      = require('util');
const HTMLRenderer = require('./HTMLRenderer');
const render    = require('./render');

const log   = require('debug')('akasha:asciidocRenderer');
const error = require('debug')('akasha:error-asciidocRenderer');

const asciidoctor = require('asciidoctor.js')();

const _renderer_doctype = Symbol('doctype');

class AsciidocRenderer extends HTMLRenderer {
    constructor() {
        super(".html.adoc", /^(.*\.html)\.(adoc)$/);
        this[_renderer_doctype] = 'article';
    }

    configuration(options) {
        if (options && options.doctype) {
            this[_renderer_doctype] = options.doctype;
        }
        return this;
    }

    // http://asciidoctor.org/docs/user-manual/#ruby-api-options
    // That lists all the options which can be set
    // Of interest are:
    //     base_dir - controls where the include directive pulls files
    //     safe - enables safe mode (?? what does that mean ??)
    //     template_dir - controls where template files are found
    convert(text, metadata) {
        var options = metadata.asciidoctor ? metadata.asciidoctor : {
            doctype: this[_renderer_doctype]
        };
        // AsciiDoctor.js doesn't allow non-String/Number items in 
        // the attributes object.  That means we cannot simply use
        // the metadata as-is, but have to select out the items to include.
        //
        // First, this steps through the keys in metadata object looking
        // for the items that are strings or numbers.  That limits the
        // data items to what AsciiDoctor supports.
        //
        // Second, we skip the 'title' item because AsciiDoctor has
        // special treatment for that attribute.
        options.attributes = {};
        for (let key in metadata) {
            if ((typeof metadata[key] === 'string'
              || typeof metadata[key] === 'number')
              && key !== 'title') {
                options.attributes[key] = metadata[key];
            }
        }
        // console.log(`convert ${util.inspect(options)}`);
        return asciidoctor.convert(text, options);
    }

    renderSync(text, metadata) {
        // console.log('AsciidocRenderer renderSync '+ text);
        var ret = this.convert(text, metadata);
        // console.log(ret);
        return ret;
    }

    render(text, metadata) {
        // console.log('AsciidocRenderer render');
        return new Promise((resolve, reject) => {
            try {
                resolve(this.convert(text, metadata));
            } catch(e) {
                reject(e);
            }
        });
    }
}

module.exports = new AsciidocRenderer();
