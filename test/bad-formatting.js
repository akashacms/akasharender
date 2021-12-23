
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const akasha   = require('../index');
const { assert } = require('chai');
const sizeOf = promisify(require('image-size'));
// Note this is an ES6 module and to use it we must 
// use an async function along with the await keyword
const _filecache = import('../cache/file-cache.mjs');


let config;

describe('build site', function() {
    it('should construct configuration', async function() {
        this.timeout(75000);
        config = new akasha.Configuration();
        config.rootURL("https://example.akashacms.com");
        config.configDir = __dirname;
        config.use(require('./test-plugin/plugin.js'));
        config
            .addAssetsDir('assets')
            .addLayoutsDir('layouts')
            .addDocumentsDir('documents-bad')
            .addPartialsDir('partials');
        config.setMahabhutaConfig({
            recognizeSelfClosing: true,
            recognizeCDATA: true,
            decodeEntities: true
        });
        config
            .addFooterJavaScript({ href: "/vendor/jquery/jquery.min.js" })
            .addFooterJavaScript({ 
                href: "/vendor/popper.js/umd/popper.min.js",
                lang: 'no-known-lang'
            })
            .addFooterJavaScript({ href: "/vendor/bootstrap/js/bootstrap.min.js" })
            .addHeaderJavaScript({ href: "/vendor/header-js.js"})
            .addHeaderJavaScript({ 
                href: "/vendor/popper.js/popper.min.js",
                lang: 'no-known-lang'
            })
            .addHeaderJavaScript({
                script: "alert('in header with inline script');"
            })
            .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap.min.css" })
            .addStylesheet({       href: "/style.css" })
            .addStylesheet({       href: "/print.css", media: "print" });
        config.setConcurrency(5);
        config.prepare();
    });

    it('should run setup', async function() {
        this.timeout(75000);
        await akasha.cacheSetupComplete(config);
        /* await Promise.all([
            akasha.setupDocuments(config),
            akasha.setupAssets(config),
            akasha.setupLayouts(config),
            akasha.setupPartials(config)
        ])
        let filecache = await _filecache;
        await Promise.all([
            filecache.documents.isReady(),
            filecache.assets.isReady(),
            filecache.layouts.isReady(),
            filecache.partials.isReady()
        ]); */
    });

    it('should have called onPluginCacheSetup', function() {
        assert.isOk(config.plugin('akashacms-test-plugin')
                            .onPluginCacheSetupCalled);
    });

    it('should copy assets', async function() {
        this.timeout(75000);
        await config.copyAssets();
    });

    it('should build site', async function() {
        this.timeout(75000);
        let failed = false;
        let results = await akasha.render(config);
        for (let result of results) {
            if (result.error) {
                failed = true;
                console.error(result.error);
            }
        }
        assert.isFalse(failed);
    });

    it('should close the configuration', async function() {
        this.timeout(75000);
        await akasha.closeCaches();
    });
});
