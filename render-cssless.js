'use strict';

const Renderer = require('./Renderer');
const render   = require('./render');
const less     = require('less');
const co       = require('co');

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
        var thisRenderer = this;
        return co(function* () {
            var lesstxt = yield thisRenderer.readFile(basedir, fpath);
            var css = yield thisRenderer.render(lesstxt, {});
            return yield thisRenderer.writeFile(renderTo,
                                    thisRenderer.filePath(fpath),
                                    css.css);
        });
    }
}

module.exports = new CSSLESSRenderer();
