
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const akasha   = require('../index');
const mahabhuta = akasha.mahabhuta;
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
            .addAssetsDir('assets2')
            .addAssetsDir('assets')
            .addLayoutsDir('layouts')
            .addLayoutsDir('layouts-extra')
            .addDocumentsDir('documents')
            .addDocumentsDir({
                src: 'mounted',
                dest: 'mounted'
            })
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
        
        config.setRenderDestination('out-absolute');

        config.prepare();

        config.plugin('akashacms-builtin').relativizeHeadLinks = false;
        config.plugin('akashacms-builtin').relativizeScriptLinks = false;
        config.plugin('akashacms-builtin').relativizeBodyLinks = false;

        require('./final-mahabhuta.js').addFinalMahabhuta(config, mahabhuta);
    });

    it('should run setup', async function() {
        this.timeout(75000);
        await akasha.setup(config);
        // await akasha.fileCachesReady(config);
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

    it('should overwrite file from stacked directory', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'file.txt');
        assert.include(html, 'overriding');
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


describe('stylesheets, javascripts', function() {
    describe('simple-style-javascript.html', function() {

        checkStyleJS = (html, $) => {

            assert.exists(html, 'result exists');
            assert.isString(html, 'result isString');
    
            assert.equal($('head link[rel="stylesheet"][type="text/css"][href="/vendor/bootstrap/css/bootstrap.min.css"]').length, 1);
            assert.equal($('head link[rel="stylesheet"][type="text/css"][href="/style.css"]').length, 1);
            assert.equal($('head link[rel="stylesheet"][type="text/css"][media="print"][href="/print.css"]').length, 1);
    
            assert.equal($('head script[src="/vendor/header-js.js"]').length, 1);
            assert.equal($('head script[type="no-known-lang"][src="/vendor/popper.js/popper.min.js"]').length, 1);
            assert.equal($('head script:contains("alert(\'in header with inline script\');")').length, 1);
    
            assert.equal($('body script[src="/vendor/jquery/jquery.min.js"]').length, 1);
            assert.equal($('body script[type="no-known-lang"][src="/vendor/popper.js/umd/popper.min.js"]').length, 1);
            assert.equal($('body script[src="/vendor/bootstrap/js/bootstrap.min.js"]').length, 1);
        };

        it('should find stylesheets, javascript values', async function() {
            let { html, $ } = await akasha.readRenderedFile(config, 'simple-style-javascript.html');
            checkStyleJS(html, $);
        });

        it('should find stylesheets, javascript values IN njk-func', async function() {
            let { html, $ } = await akasha.readRenderedFile(config, 'njk-func.html');
            checkStyleJS(html, $);
        });
    });
    
    describe('metadata-style-javascript.html', function() {

        checkMetadataStyleJS = (html, $) => {

            assert.exists(html, 'result exists');
            assert.isString(html, 'result isString');

            assert.equal($('head link[rel="stylesheet"][type="text/css"][href="/vendor/metadata-css-added.css"]').length, 1);
            assert.equal($('head link[rel="stylesheet"][type="text/css"][media="print"][href="/vendor/metadata-css-with-media-added.css"]').length, 1);

            assert.equal($('head script[src="/vender/metadata-js-add-top.js"]').length, 1);
            assert.equal($('head script[type="no-known-lang"][src="/vender/metadata-js-with-lang-add-top.js"]').length, 1);
            assert.equal($('head script:contains("alert(\'added to top from metadata\');")').length, 1);


            assert.equal($('body script[src="/vender/metadata-js-add-bottom.js"]').length, 1);
            assert.equal($('body script[type="no-known-lang"][src="/vender/metadata-js-with-lang-add-bottom.js"]').length, 1);
            assert.equal($('body script:contains("alert(\'added to bottom from metadata\')")').length, 1);
        };

        it('should find stylesheets, javascript from metadata values', async function() {
            let { html, $ } = await akasha.readRenderedFile(config, 'metadata-style-javascript.html');
            checkMetadataStyleJS(html, $);
        });

        it('should find stylesheets, javascript from metadata values IN njk-func.html', async function() {
            let { html, $ } = await akasha.readRenderedFile(config, 'njk-func.html');
            checkMetadataStyleJS(html, $);
        });

        it('should find style.css', async function() {
            let style = path.join(config.renderDestination, 'style.css');
            let stats = await fs.stat(style);
            assert.isOk(stats);
        });
    });
});


describe('header metadata', function() {

    let checkRSSHeaderMeta = (html, $) => {
        assert.equal($('head link[rel="alternate"][type="application/rss+xml"][href="/rss-for-header.xml"]').length, 1);
    };

    let checkExternalStylesheet = (html, $) => {
        assert.equal($('head link[rel="stylesheet"][type="text/css"][href="http://external.site/foo.css"]').length, 1);
    };

    let checkDNSPrefetch = (html, $) => {
        assert.equal($('head meta[http-equiv="x-dns-prefetch-control"][content="we must have control"]').length, 1);
        assert.equal($('head link[rel="dns-prefetch"][href="foo1.com"]').length, 1);
        assert.equal($('head link[rel="dns-prefetch"][href="foo2.com"]').length, 1);
        assert.equal($('head link[rel="dns-prefetch"][href="foo3.com"]').length, 1);
    };

    let checkSiteVerification = (html, $) => {
        assert.equal($('head meta[name="google-site-verification"][content="We are good"]').length, 1);;
    };

    let checkXMLSitemap = (html, $) => {
        assert.equal($('head link[rel="sitemap"][type="application/xml"][title="Sitemap"][href="/sitemap.xml"]').length, 1);
        assert.equal($('head link[rel="sitemap"][type="application/xml"][title="Foo Bar Sitemap"][href="/foo-bar-sitemap.xml"]').length, 1);
    };

    describe('/index.html', function() {
        let html;
        let $;

        before(async function() {
            let results = await akasha.readRenderedFile(config, 'index.html');
            html = results.html;
            $ = results.$;
        });

        it('should read in correctly', function() {
            assert.exists(html, 'result exists');
            assert.isString(html, 'result isString');
        });

        it('should find RSS header meta', async function() {
            checkRSSHeaderMeta(html, $);
        });

        it('should find external stylesheet', async function() {
            checkExternalStylesheet(html, $);
        });
    
        it('should find dns-prefetch values', async function() {
            checkDNSPrefetch(html, $);
        });

        it('should find site-verification values', async function() {
            checkSiteVerification(html, $);
        });

        it('should find xml-sitemap values', async function() {
            checkXMLSitemap(html, $);
        });
    });

    describe('/hier/dir1/dir2/nested-anchor.html', function() {
        let html;
        let $;

        before(async function() {
            let results = await akasha.readRenderedFile(config, '/hier/dir1/dir2/nested-anchor.html');
            html = results.html;
            $ = results.$;
        });

        it('should read in correctly', function() {
            assert.exists(html, 'result exists');
            assert.isString(html, 'result isString');
        });

        it('should find RSS header meta', async function() {
            assert.equal($('head link[rel="alternate"][type="application/rss+xml"][href="/rss-for-header.xml"]').length, 1);
        });

        it('should find external stylesheet', async function() {
            assert.equal($('head link[rel="stylesheet"][type="text/css"][href="http://external.site/foo.css"]').length, 1);
        });
    
        it('should find dns-prefetch values', async function() {
            assert.equal($('head meta[http-equiv="x-dns-prefetch-control"][content="we must have control"]').length, 1);
            assert.equal($('head link[rel="dns-prefetch"][href="foo1.com"]').length, 1);
            assert.equal($('head link[rel="dns-prefetch"][href="foo2.com"]').length, 1);
            assert.equal($('head link[rel="dns-prefetch"][href="foo3.com"]').length, 1);
        });

        it('should find site-verification values', async function() {
            assert.equal($('head meta[name="google-site-verification"][content="We are good"]').length, 1);
        });

        it('should find xml-sitemap values', async function() {
            assert.equal($('head link[rel="sitemap"][type="application/xml"][title="Sitemap"][href="/sitemap.xml"]').length, 1);
            assert.equal($('head link[rel="sitemap"][type="application/xml"][title="Foo Bar Sitemap"][href="/foo-bar-sitemap.xml"]').length, 1);
        });
    });

});
