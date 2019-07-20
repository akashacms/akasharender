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

const path      = require('path');
const HTMLRenderer = require('./HTMLRenderer');

const mditConfig = {
    html:         true,         // Enable html tags in source
    xhtmlOut:     true,         // Use '/' to close single tags (<br />)
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    // langPrefix:   'language-',  // CSS language prefix for fenced blocks
    linkify:      true,         // Autoconvert url-like texts to links
    typographer:  false,        // Enable smartypants and other sweet transforms
  
    // Highlighter function. Should return escaped html,
    // or '' if input not changed
    highlight: function (/*str, , lang*/) { return ''; }
};

const mdit = require('markdown-it');
var md;
  
module.exports = class MarkdownRenderer extends HTMLRenderer {
    constructor() {
        super(".html.md", /^(.*\.html)\.(md)$/);
        md = mdit(mditConfig);
    }
  
    configuration(newConfig) {
        md = mdit(newConfig);
        return this;
    }
  
    use(mditPlugin, options) {
        md.use(mditPlugin, options);
        return this;
    }
  
    renderSync(text, metadata) {
        // console.log('MarkdownRenderer renderSync '+ text);
        var ret = md.render(text);
        // console.log(ret);
        return ret;
    }
  
    render(text, metadata) {
        // console.log('MarkdownRenderer render');
        return new Promise((resolve, reject) => {
            try {
                resolve(md.render(text));
            } catch(e) {
                reject(e);
            }
        });
    }
}
