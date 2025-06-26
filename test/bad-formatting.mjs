
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { default as akasha } from '../index.js';
const mahabhuta = akasha.mahabhuta;
import { assert } from 'chai';
import { default as _image_size } from 'image-size';
const sizeOf = promisify(_image_size);
const _filecache = await import('../cache/file-cache-lokijs.mjs');

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

let config;

describe('build site', function() {
    it('should construct configuration', async function() {
        this.timeout(75000);
        config = new akasha.Configuration();
        config.rootURL("https://example.akashacms.com");
        config.configDir = __dirname;
        config.use((await import('./test-plugin/plugin.js')).default);
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
        await akasha.cacheSetup(config);
        await akasha.fileCachesReady(config);
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
