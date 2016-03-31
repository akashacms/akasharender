'use strict';

const HTMLRenderer = require('./HTMLRenderer');
const render   = require('./render');

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
        return new Promise((resolve, reject) => {
            resolve(ejs.render(text, metadata));
        });
    }
}

module.exports = new EJSRenderer();