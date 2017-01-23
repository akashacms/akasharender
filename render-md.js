'use strict';

const path      = require('path');
const HTMLRenderer = require('./HTMLRenderer');
const render   = require('./render');

const log   = require('debug')('akasha:markdownRenderer');
const error = require('debug')('akasha:error-markdownRenderer');

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


class MarkdownRenderer extends HTMLRenderer {
    constructor() {
        super(".html.md", /^(.*\.html)\.(md)$/);
        md = mdit(mditConfig);
    }

    configuration(newConfig) {
        md = mdit(newConfig);
        return this;
    }

    use(mditPlugin) {
        md.use(mditPlugin);
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

module.exports = new MarkdownRenderer();
