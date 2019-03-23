'use strict';

const Renderer = require('./Renderer');
const less     = require('less');

module.exports = class CSSLESSRenderer extends Renderer {
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

    async renderToFile(basedir, fpath, renderTo, renderToPlus, metadata, config) {
        var thisRenderer = this;
        var lesstxt = await thisRenderer.readFile(basedir, fpath);
        var css = await thisRenderer.render(lesstxt, {});
        return await thisRenderer.writeFile(renderTo,
                                    thisRenderer.filePath(fpath),
                                    css.css);
    }
}
