'use strict';

const Renderer = require('./Renderer');
const render   = require('./render');
const less     = require('less');

class CSSLESSRenderer extends Renderer {
    constructor() {
        super(".css.less", /^(.*\.css)\.(less)$/);
    }

    renderSync(text, metadata) {
        throw new Error("Cannot render .css.less in synchronous environment");
    }

    render(lesstxt, metadata) {
        return new Promise((resolve, reject) => {
            less.render(lesstxt, function (err, css) {
                if (err) reject(err);
                else     resolve(css);
            });
        });
    }

    renderToFile(basedir, fpath, renderTo, renderToPlus, metadata, config) {
        return this.readFile(basedir, fpath)
        .then(lesstxt => this.render(lesstxt, {}))
        .then(css => this.writeFile(renderTo, this.filePath(fpath), css.css));
    }
}

module.exports = new CSSLESSRenderer();
