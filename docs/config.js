'use strict';

const util    = require('util');
const akasha  = require('akasharender');
const async   = require('async');
// const cheerio = require('cheerio');
const path    = require('path');

const log    = require('debug')('akasharender-docs:configuration');
const error  = require('debug')('akasharender-docs:error-configuration');

const config = new akasha.Configuration();

config
    .addAssetsDir('assets')
    .addLayoutsDir('layouts')
    .addDocumentsDir('documents')
    .addPartialsDir('partials');

config
    .use(require('akashacms-theme-bootstrap'))
    .use(require('akashacms-base'))
    .use(require('akashacms-breadcrumbs'))
    .use(require('akashacms-booknav'));

config.setMahabhutaConfig({
    recognizeSelfClosing: true,
    recognizeCDATA: true,
    xmlMode: true
});

// config.addMahabhuta(require('../../ebooks/book-range-confidence/mahafuncs'));

config.prepare();

module.exports = config;
