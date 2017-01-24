'use strict';

const util    = require('util');
const akasha  = require('akasharender');
const async   = require('async');
// const cheerio = require('cheerio');
const path    = require('path');

const log    = require('debug')('akasharender-docs:configuration');
const error  = require('debug')('akasharender-docs:error-configuration');

const config = new akasha.Configuration();

config.rootURL("https://akasharender.akashacms.com/");

config
    .addAssetsDir('assets')
    .addAssetsDir({
        src: 'node_modules/bootstrap/dist',
        dest: 'vendor/bootstrap'
    })
   .addAssetsDir({
        src: 'node_modules/jquery/dist',
        dest: 'vendor/jquery'
    })
    .addLayoutsDir('layouts')
    .addDocumentsDir('documents')
    .addPartialsDir('partials')
    .setRenderDestination('../docs');

config
    .use(require('akashacms-theme-bootstrap'))
    .use(require('akashacms-base'))
    .use(require('akashacms-breadcrumbs'))
    .use(require('akashacms-booknav'))
    .use(require('akashacms-embeddables'))
    .use(require('akashacms-blog-podcast'))
    .use(require('akashacms-social-buttons'))
    .use(require('akashacms-tagged-content'))
    .use(require('epub-website'));

config
    .addFooterJavaScript({ href: "/vendor/jquery/jquery.min.js" })
    .addFooterJavaScript({ href: "/vendor/bootstrap/js/bootstrap.min.js"  })
    .addStylesheet({       href: "/vendor/bootstrap/css/bootstrap.min.css" })
    .addStylesheet({       href: "/vendor/bootstrap/css/bootstrap-theme.min.css" })
    .addStylesheet({       href: "/style.css" });

config.setMahabhutaConfig({
    recognizeSelfClosing: true,
    recognizeCDATA: true,
    xmlMode: true
});

// config.addMahabhuta(require('../../ebooks/book-range-confidence/mahafuncs'));

config.plugin("akashacms-tagged-content")
    .sortBy('title')
    .headerTemplate("---\ntitle: @title@\nlayout: tagpage.html.ejs\n---\n<p>Pages with tag @tagName@</p>")
    .tagsDirectory('/tags/');

config.prepare();

module.exports = config;
