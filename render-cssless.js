'use strict';

const Renderer = require('./Renderer');
const render   = require('./render');
const less     = require('less');

class CSSLESSRenderer extends Renderer {
    constructor() {
        super(".css.less", /^(.*\.css)\.(less)$/);
    }
    
    renderSync(text, metadata) {
        return text;
    }
    
    render(lesstxt, metadata) {
        return new Promise((resolve, reject) => {
            less.render(lesstxt, function (err, css) {
                if (err) reject(err);
                else     resolve(css);
            });
        });
    }
    
    renderToFile(basedir, fpath, metadata, renderTo, layoutDirs, partialDirs, mahafuncs) {
        return this.readFile(basedir, fpath)
        .then(lesstxt => this.render(lesstxt, {}))
        .then(css => this.writeFile(renderTo, fpath, css));
    }
}

module.exports = new CSSLESSRenderer();