/**
 *
 * Copyright 2014-2019 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

 'use strict';

const Renderer = require('./Renderer');
const fs       = require('fs').promises;
const path     = require('path');
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

    async newRenderToFile(config, docInfo) {
        let lesstxt = await fs.readFile(docInfo.fspath, 'utf8');
        let css = await this.render(lesstxt, {});
        let writeTo = path.join(config.renderDestination, docInfo.renderPath);
        await fs.writeFile(writeTo, css.css);
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
