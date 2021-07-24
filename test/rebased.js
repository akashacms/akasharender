
const { promisify } = require('util');
const akasha   = require('../index');
const { assert } = require('chai');
const sizeOf = promisify(require('image-size'));
// Note this is an ES6 module and to use it we must 
// use an async function along with the await keyword
const _filecache = import('../cache/file-cache.mjs');


// This is about hosting a website on a subdirectory
// The renderDestination will still have the root of the files
// but the files will have their base URL's rewritten to
// start with /rebase/to/ ... 
// Hence /index.html would become /rebase/to/index.html

let config_rebase;

describe('build rebased site', function() {
    it('should create configuration', async function() {

        this.timeout(75000);
        config_rebase = new akasha.Configuration();
        config_rebase.rootURL("https://example.akashacms.com/rebase/to/");
        config_rebase.configDir = __dirname;
        config_rebase.use(require('./test-plugin/plugin.js'));
        config_rebase.addLayoutsDir('layouts')
            .addLayoutsDir('layouts-extra')
            .addDocumentsDir('documents')
            .addDocumentsDir({
                src: 'mounted',
                dest: 'mounted'
            })
            .addPartialsDir('partials')
            .setRenderDestination('out-rebased');
            config_rebase.setMahabhutaConfig({
            recognizeSelfClosing: true,
            recognizeCDATA: true,
            decodeEntities: true
        });
        config_rebase
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
        config_rebase.setConcurrency(5);
        config_rebase.prepare();
    });

    it('should run setup', async function() {
        this.timeout(75000);
        await akasha.cacheSetupComplete(config_rebase);
        /* await akasha.cacheSetup(config_rebase);
        await Promise.all([
            akasha.setupDocuments(config_rebase),
            akasha.setupAssets(config_rebase),
            akasha.setupLayouts(config_rebase),
            akasha.setupPartials(config_rebase)
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
        assert.isOk(config_rebase.plugin('akashacms-test-plugin')
                            .onPluginCacheSetupCalled);
    });

    it('should copy assets', async function() {
        this.timeout(75000);
        await config_rebase.copyAssets();
    });

    it('should build site', async function() {
        this.timeout(75000);
        let failed = false;
        let results = await akasha.render(config_rebase);
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

describe('rebased stylesheets, javascripts', function() {
    describe('simple-style-javascript.html', function() {

        checkStyleJS = (html, $) => {

            assert.exists(html, 'result exists');
            assert.isString(html, 'result isString');
    
            assert.equal($('head link[rel="stylesheet"][type="text/css"][href="vendor/bootstrap/css/bootstrap.min.css"]').length, 1);
            assert.equal($('head link[rel="stylesheet"][type="text/css"][href="style.css"]').length, 1);
            assert.equal($('head link[rel="stylesheet"][type="text/css"][media="print"][href="print.css"]').length, 1);
    
            assert.equal($('head script[src="vendor/header-js.js"]').length, 1);
            assert.equal($('head script[type="no-known-lang"][src="vendor/popper.js/popper.min.js"]').length, 1);
            assert.equal($('head script:contains("alert(\'in header with inline script\');")').length, 1);
    
            assert.equal($('body script[src="vendor/jquery/jquery.min.js"]').length, 1);
            assert.equal($('body script[type="no-known-lang"][src="vendor/popper.js/umd/popper.min.js"]').length, 1);
            assert.equal($('body script[src="vendor/bootstrap/js/bootstrap.min.js"]').length, 1);
        };

        it('should find stylesheets, javascript values', async function() {
            let { html, $ } = await akasha.readRenderedFile(config_rebase, 'simple-style-javascript.html');

            checkStyleJS(html, $);
        });

        it('should find stylesheets, javascript values IN njk-func.html', async function() {
            let { html, $ } = await akasha.readRenderedFile(config_rebase, 'njk-func.html');

            checkStyleJS(html, $);
        });
    });
    
    describe('metadata-style-javascript.html', function() {

        checkMetadataStyleJS = (html, $) => {

            assert.exists(html, 'result exists');
            assert.isString(html, 'result isString');

            assert.equal($('head link[rel="stylesheet"][type="text/css"][href="vendor/metadata-css-added.css"]').length, 1);
            assert.equal($('head link[rel="stylesheet"][type="text/css"][media="print"][href="vendor/metadata-css-with-media-added.css"]').length, 1);

            assert.equal($('head script[src="vender/metadata-js-add-top.js"]').length, 1);
            assert.equal($('head script[type="no-known-lang"][src="vender/metadata-js-with-lang-add-top.js"]').length, 1);
            assert.equal($('head script:contains("alert(\'added to top from metadata\');")').length, 1);


            assert.equal($('body script[src="vender/metadata-js-add-bottom.js"]').length, 1);
            assert.equal($('body script[type="no-known-lang"][src="vender/metadata-js-with-lang-add-bottom.js"]').length, 1);
            assert.equal($('body script:contains("alert(\'added to bottom from metadata\')")').length, 1);
        };


        it('should find stylesheets, javascript from metadata values', async function() {
            let { html, $ } = await akasha.readRenderedFile(config_rebase, 'metadata-style-javascript.html');
            checkMetadataStyleJS(html, $);
        });

        it('should find stylesheets, javascript from metadata values IN njk-func.html', async function() {
            let { html, $ } = await akasha.readRenderedFile(config_rebase, 'njk-func.html');
            checkMetadataStyleJS(html, $);
        });
    });
});

describe('rebased header metadata', function() {

    let checkRSSHeaderMeta = (html, $) => {
        assert.equal($('head link[rel="alternate"][type="application/rss+xml"][href="rss-for-header.xml"]').length, 1);
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
        assert.equal($('head link[rel="sitemap"][type="application/xml"][title="Sitemap"][href="sitemap.xml"]').length, 1);
        assert.equal($('head link[rel="sitemap"][type="application/xml"][title="Foo Bar Sitemap"][href="foo-bar-sitemap.xml"]').length, 1);
    };

    describe('/index.html', function() {
        let html;
        let $;

        before(async function() {
            let results = await akasha.readRenderedFile(config_rebase, 'index.html');
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

    describe('/njk-func.html', function() {
        let html;
        let $;

        before(async function() {
            let results = await akasha.readRenderedFile(config_rebase, 'njk-func.html');
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
            let results = await akasha.readRenderedFile(config_rebase, '/hier/dir1/dir2/nested-anchor.html');
            html = results.html;
            $ = results.$;
        });

        it('should read in correctly', function() {
            assert.exists(html, 'result exists');
            assert.isString(html, 'result isString');
        });

        it('should find RSS header meta', async function() {
            assert.equal($('head link[rel="alternate"][type="application/rss+xml"][href="../../../rss-for-header.xml"]').length, 1);
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
            assert.equal($('head link[rel="sitemap"][type="application/xml"][title="Sitemap"][href="../../../sitemap.xml"]').length, 1);
            assert.equal($('head link[rel="sitemap"][type="application/xml"][title="Foo Bar Sitemap"][href="../../../foo-bar-sitemap.xml"]').length, 1);
        });
    });

    describe('/hier/dir1/dir2/nested-img-resize.html', function() {
        let html;
        let $;

        before(async function() {
            let results = await akasha.readRenderedFile(config_rebase, '/hier/dir1/dir2/nested-img-resize.html');
            html = results.html;
            $ = results.$;
        });

        it('should read in correctly', function() {
            assert.exists(html, 'result exists');
            assert.isString(html, 'result isString');
        });

        it('should have resized image', function() {
            assert.equal($('img#nested-img-reference').attr('src'), 'img/tesla-nema.jpg');
        })
    });
});


describe('rebased teaser, content', function() {

    const checkFigImg = (html, $) => {

        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.equal($('article#original figure img[src="simple-fig-img.jpg"]').length, 1);
        assert.equal($('article#original figure#with-caption img[src="fig-img-caption.jpg"]').length, 1);
        assert.include($('article#original figure#with-caption figcaption').html(), 'Caption text');
        assert.equal($('article#original figure.added-class#with-class img[src="fig-img-class.jpg"]').length, 1);
        assert.equal($('article#original figure#width[width="200px;"] img[src="fig-img-width.jpg"]').length, 1);
        assert.equal($('article#original figure#style[style="border: 200 solid black;"] img[src="fig-img-style.jpg"]').length, 1);
        assert.equal($('article#original figure#dest a[href="http://dest.url"]').length, 1);
        assert.equal($('article#original figure#dest img[src="fig-img-dest.jpg"]').length, 1);
    };

    it('should render fig-img', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'fig-img.html');
        checkFigImg(html, $);
    });

    it('should render fig-img with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'fig-img-liquid.html');
        checkFigImg(html, $);
    });

    it('should render fig-img with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'fig-img-nunjucks.html');
        checkFigImg(html, $);
    });

    it('should render fig-img with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'fig-img-handlebars.html');
        checkFigImg(html, $);
    });

    const checkIMG2FigIMG = (html, $) => {
        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        // console.log(html);

        assert.equal($('body figure#change1').length, 1);
        assert.equal($('body figure#change1 img[src="img/Human-Skeleton.jpg"]').length, 1);

        assert.equal($('body figure.some-class').length, 1);
        assert.equal($('body figure.some-class img[src="img/Human-Skeleton.jpg"]').length, 1);

        assert.equal($('body figure#change-caption').length, 1);
        assert.equal($('body figure#change-caption img[src="img/Human-Skeleton.jpg"]').length, 1);
        assert.equal($('body figure#change-caption figcaption').length, 1);
        assert.include($('body figure#change-caption figcaption').html(), 
            "This is a caption");

        assert.equal($('body figure#change-dest').length, 1);
        assert.equal($('body figure#change-dest a[href="https://somewhere.else"]').length, 1);
        assert.equal($('body figure#change-dest a[href="https://somewhere.else"] img[src="img/Human-Skeleton.jpg"]').length, 1);

        // Do this in akashacms-base-test
        // assert.equal($('head meta[name="og:image"]').length, 1);
        // assert.include($('head meta[name="og:image"]').attr('content'), 
        //      "https://example.akashacms.com/img/Human-Skeleton.jpg");
    };

    it('should find figure/image pair for img', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'img2figimg.html');
        checkIMG2FigIMG(html, $);
    });

    it('should find figure/image pair for img with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'img2figimg-liquid.html');
        checkIMG2FigIMG(html, $);
    });

    it('should find figure/image pair for img with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'img2figimg-nunjucks.html');
        checkIMG2FigIMG(html, $);
    });

    it('should find figure/image pair for img with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'img2figimg-handlebars.html');
        checkIMG2FigIMG(html, $);
    });

    const checkImg2Resize = async (html, $, config) => {
        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        // console.log(html);

        assert.equal($('body #resizeto50').length, 1);
        assert.include([
            "img/Human-Skeleton-50.jpg",
            "img/Human-Skeleton.jpg"
        ], $('body #resizeto50').attr('src'));
        assert.notExists($('body #resizeto50').attr('resize-width'));

        assert.equal($('body #resizeto150').length, 1);
        assert.include("img/Human-Skeleton-150.jpg", $('body #resizeto150').attr('src'));
        assert.notExists($('body #resizeto150').attr('resize-width'));
        assert.notExists($('body #resizeto150').attr('resize-to'));

        assert.equal($('body #resizeto250figure').length, 1);
        assert.equal($('body #resizeto250figure figcaption').length, 1);
        assert.include("img/Human-Skeleton-250-figure.jpg", $('body #resizeto250figure img').attr('src'));
        assert.notExists($('body #resizeto250figure img').attr('resize-width'));
        assert.notExists($('body #resizeto250figure img').attr('resize-to'));
        assert.include("Image caption", $('body #resizeto250figure figcaption').html());

        assert.equal($('body #resizerss').length, 1);
        assert.include("rss_button.png", $('body #resizerss').attr('src'));
        assert.notExists($('body #resizerss').attr('resize-width'));
        assert.notExists($('body #resizerss').attr('resize-to'));

        assert.equal($('body #png2jpg').length, 1);
        assert.include("rss_button.jpg", $('body #png2jpg').attr('src'));
        assert.notExists($('body #png2jpg').attr('resize-width'));
        assert.notExists($('body #png2jpg').attr('resize-to'));

        // console.log(config.plugin('akashacms-builtin').resizequeue);
        assert.equal(config.plugin('akashacms-builtin').resizequeue.length, 0);
        /*
        const queueContains = (queue, item) => {
            let found = false;
            for (let _item of queue) {
                if (_item.src === item.src
                 && _item.resizewidth === item.resizewidth
                 && _item.resizeto === item.resizeto
                 && _item.docPath === item.docPath) {
                    found = true;
                }
            }
            return found;
        };
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            src: '../../imgdir/img/tesla-nema.jpg',
            resizewidth: '200',
            resizeto: 'img/tesla-nema.jpg',
            docPath: 'hier/dir1/dir2/nested-img-resize.html'
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            src: '../../imgdir/img/tesla-nema.jpg',
            resizewidth: '200',
            resizeto: 'img/tesla-nema.jpg',
            docPath: 'hier/dir1/dir2/nested-img-resize.html'
        }));


        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-handlebars.html",
            "resizeto": undefined,
            "resizewidth": "50",
            "src": "img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-handlebars.html",
            "resizeto": "img/Human-Skeleton-150.jpg",
            "resizewidth": "150",
            "src": "img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-handlebars.html",
            "resizeto": "img/Human-Skeleton-250-figure.jpg",
            "resizewidth": "250",
            "src": "img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-handlebars.html",
            "resizeto": undefined,
            "resizewidth": "50",
            "src": "rss_button.png"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-handlebars.html",
            "resizeto": "rss_button.jpg",
            "resizewidth": "50",
            "src": "rss_button.png"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-handlebars.html",
            "resizeto": "/img/Human-Skeleton-mounted-100.jpg",
            "resizewidth": "100",
            "src": "/mounted/img/Human-Skeleton.jpg"
        }));



        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-liquid.html",
            "resizeto": undefined,
            "resizewidth": "50",
            "src": "img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-liquid.html",
            "resizeto": "img/Human-Skeleton-150.jpg",
            "resizewidth": "150",
            "src": "img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-liquid.html",
            "resizeto": "img/Human-Skeleton-250-figure.jpg",
            "resizewidth": "250",
            "src": "img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-liquid.html",
            "resizeto": undefined,
            "resizewidth": "50",
            "src": "rss_button.png"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-liquid.html",
            "resizeto": "rss_button.jpg",
            "resizewidth": "50",
            "src": "rss_button.png"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-liquid.html",
            "resizeto": "/img/Human-Skeleton-mounted-100.jpg",
            "resizewidth": "100",
            "src": "/mounted/img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-nunjucks.html",
            "resizeto": undefined,
            "resizewidth": "50",
            "src": "img/Human-Skeleton.jpg",
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-nunjucks.html",
            "resizeto": "img/Human-Skeleton-150.jpg",
            "resizewidth": "150",
            "src": "img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-nunjucks.html",
            "resizeto": "img/Human-Skeleton-250-figure.jpg",
            "resizewidth": "250",
            "src": "img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-nunjucks.html",
            "resizeto": undefined,
            "resizewidth": "50",
            "src": "rss_button.png"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-nunjucks.html",
            "resizeto": "rss_button.jpg",
            "resizewidth": "50",
            "src": "rss_button.png"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "img2resize-nunjucks.html",
            "resizeto": "/img/Human-Skeleton-mounted-100.jpg",
            "resizewidth": "100",
            "src": "/mounted/img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            src: 'img/Human-Skeleton.jpg',
            resizewidth: '50',
            resizeto: 'img/Human-Skeleton-50.jpg',
            docPath: "img2resize.html"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            src: 'img/Human-Skeleton.jpg',
            resizewidth: '150',
            resizeto: 'img/Human-Skeleton-150.jpg',
            docPath: "img2resize.html"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            src: 'img/Human-Skeleton.jpg',
            resizewidth: '250',
            resizeto: 'img/Human-Skeleton-250-figure.jpg',
            docPath: "img2resize.html"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            resizeto: undefined,
            resizewidth: "50",
            src: "rss_button.png",
            docPath: "img2resize.html"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            resizeto: "rss_button.jpg",
            resizewidth: "50",
            src: "rss_button.png",
            docPath: "img2resize.html"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            docPath: "img2resize.html",
            resizeto: "/img/Human-Skeleton-mounted-100.jpg",
            resizewidth: "100",
            src: "/mounted/img/Human-Skeleton.jpg"
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            docPath: "mounted/img2resize.html",
            resizeto: "img/Human-Skeleton-150.jpg",
            resizewidth: "150",
            src: "img/Human-Skeleton.jpg",
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "mounted/img2resize.html",
            "resizeto": "img/Human-Skeleton-250-figure.jpg",
            "resizewidth": "250",
            "src": "img/Human-Skeleton.jpg",
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "mounted/img2resize.html",
            "resizeto": "img/Human-Skeleton-mounted-100.jpg",
            "resizewidth": "100",
            "src": "/mounted/img/Human-Skeleton.jpg",
        }));
        assert.isTrue(queueContains(config.plugin('akashacms-builtin').resizequeue, {
            "docPath": "mounted/img2resize.html",
            "resizeto": "/img/Human-Skeleton-from-mounted-to-img-100.jpg",
            "resizewidth": "100",
            "src": "/mounted/img/Human-Skeleton.jpg",
        }));
        */

        let size50 = await sizeOf('out-rebased/img/Human-Skeleton.jpg');
        assert.equal(size50.width, 50);

        let size150 = await sizeOf('out-rebased/img/Human-Skeleton-150.jpg');
        assert.equal(size150.width, 150);

        let size250 = await sizeOf('out-rebased/img/Human-Skeleton-250-figure.jpg');
        assert.equal(size250.width, 250);

        let sizerss = await sizeOf('out-rebased/rss_button.png');
        assert.equal(sizerss.width, 50);

        let sizerssjpg = await sizeOf('out-rebased/rss_button.jpg');
        assert.equal(sizerssjpg.width, 50);
    };

    it('should resize img', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'img2resize.html');
        await checkImg2Resize(html, $, config_rebase);
    });

    it('should resize img with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'img2resize-liquid.html');
        await checkImg2Resize(html, $, config_rebase);
    });

    it('should resize img with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'img2resize-nunjucks.html');
        await checkImg2Resize(html, $, config_rebase);
    });

    it('should resize img with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'img2resize-handlebars.html');
        await checkImg2Resize(html, $, config_rebase);
    });

    const checkShowContent = (html, $) => {
        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.equal($('article#original span#simple').length, 1);
        assert.equal($('article#original span#simple a[href="shown-content.html"]').length, 1);
        assert.include($('article#original span#simple a[href="shown-content.html"]').html(), 
                "Shown Content - solely for use of show-content.html");

        assert.equal($('article#original span#dest').length, 1);
        assert.equal($('article#original span#dest a[href="http://dest.url"]').length, 1);
        assert.include($('article#original span#dest a[href="http://dest.url"]').html(), 
                "Shown Content - solely for use of show-content.html");

        assert.equal($('article#original div#template').length, 1);
        assert.equal($('article#original div#template figure').length, 1);
        assert.equal($('article#original div#template figure a[href="shown-content.html"]').length, 2);
        assert.equal($('article#original div#template figure a[href="shown-content.html"] img').length, 1);
        assert.equal($('article#original div#template figure figcaption').length, 1);
        assert.equal($('article#original div#template figure figcaption a[href="shown-content.html"]').length, 1);
        assert.include($('article#original div#template figure figcaption a[href="shown-content.html"]').html(), 
            "Shown Content - solely for use of show-content.html");
        
        assert.equal($('article#original div#template2').length, 1);
        assert.equal($('article#original div#template2 figure').length, 1);
        assert.equal($('article#original div#template2 figure a[href="http://dest.url"]').length, 2);
        assert.equal($('article#original div#template2 figure a[href="http://dest.url"] img').length, 1);
        assert.equal($('article#original div#template2 figure figcaption').length, 1);
        assert.equal($('article#original div#template2 figure figcaption a[href="http://dest.url"]').length, 1);
        assert.include($('article#original div#template2 figure figcaption a[href="http://dest.url"]').html(), 
            "Shown Content - solely for use of show-content.html");
    };

    it('should render show-content', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'show-content.html');
        checkShowContent(html, $);
    });

    it('should render show-content with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'show-content-liquid.html');
        checkShowContent(html, $);
    });

    it('should render show-content with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'show-content-nunjucks.html');
        checkShowContent(html, $);
    });

    it('should render show-content with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'show-content-handlebars.html');
        checkShowContent(html, $);
    });

    const checkAnchorCleanups = (html, $) => {

        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.equal($('article#original a#not-affected').html(), '');
        assert.equal($('article#original a#not-affected').attr('href'), 'http://external.url');
        assert.equal($('article#original a#not-affected-2').html(), 'Not Affected');
        assert.equal($('article#original a#not-affected-2').attr('href'), 'http://external.url');

        // Actuallhy this does not get converted to an absolute path
        // The relative path is still correct
        assert.equal($('article#original a#convert-to-absolute-path').attr('href'), 'shown-content.html');
        assert.equal($('article#original a#convert-to-absolute-path').html(), 
            'Will be converted to absolute path, anchor text not affected');

        // Here the absolute path is left alone, and this is correct
        assert.equal($('article#original a#insert-title-from-document').attr('href'), 'shown-content.html');
        assert.include($('article#original a#insert-title-from-document').attr('title'), 
            'Shown Content - solely for use of show-content.html');
        assert.include($('article#original a#insert-title-from-document').html(), 
                'Shown Content - solely for use of show-content.html');
        
        assert.equal($('article#original a#img-causes-no-modify').attr('href'), 'shown-content.html');

        assert.equal($('article#original a#img-causes-no-modify').html(), '<img src="http://external.url/foo.jpg">');
        assert.equal($('article#original a#img-causes-no-modify img[src="http://external.url/foo.jpg"]').length, 1);

        assert.equal($('article#original a#link-to-hier').attr('href'), 'hier/index.html');
        assert.equal($('article#original a#link-to-hier').html(), 'Top index item');
        assert.equal($('article#original a#link-to-hier-dir1').attr('href'), 'hier/dir1/index.html');
        assert.equal($('article#original a#link-to-hier-dir1').html(), 'dir1 index item');

    };

    it('should process anchor cleanups', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'anchor-cleanups.html');
        checkAnchorCleanups(html, $);
    });

    it('should process anchor cleanups with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'anchor-cleanups-liquid.html');
        checkAnchorCleanups(html, $);
    });

    it('should process anchor cleanups with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'anchor-cleanups-nunjucks.html');
        checkAnchorCleanups(html, $);
    });

    it('should process anchor cleanups with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'anchor-cleanups-handlebars.html');
        checkAnchorCleanups(html, $);
    });

    describe('/mounted/img2resize.html', function() {
        let html;
        let $;

        before(async function() {
            let result = await akasha.readRenderedFile(config_rebase, 'mounted/img2resize.html');
            html = result.html;
            $ = result.$;
        });

        it('should correctly read mounted file', function() {
            assert.exists(html, 'result exists');
            assert.isString(html, 'result isString');
        });

        it('should have correctly processed images', function() {
            assert.equal($('body #resizeto150').length, 1);
            assert.include($('body #resizeto150').attr('src'), "img/Human-Skeleton-150.jpg");
            assert.notExists($('body #resizeto150').attr('resize-width'));

            assert.equal($('body #resizeto250figure').length, 1);
            assert.equal($('body #resizeto250figure figcaption').length, 1);
            assert.include($('body #resizeto250figure img').attr('src'), "img/Human-Skeleton-250-figure.jpg");
            assert.notExists($('body #resizeto250figure img').attr('resize-width'));
            assert.notExists($('body #resizeto250figure img').attr('resize-to'));
            assert.include($('body #resizeto250figure figcaption').html(), "Image caption");

            assert.equal($('body #mountedimg').length, 1);
            assert.include($('body #mountedimg').attr('src'), "img/Human-Skeleton-mounted-100.jpg");
            assert.notExists($('body #mountedimg').attr('resize-width'));

            assert.equal($('body #mountedimg2nonmounted').length, 1);
            assert.include($('body #mountedimg2nonmounted').attr('src'), "/img/Human-Skeleton-from-mounted-to-img-100.jpg");
            assert.notExists($('body #mountedimg2nonmounted').attr('resize-width'));
        });

        it('should have correctly sized images', async function() {
            let size150 = await sizeOf('out-rebased/mounted/img/Human-Skeleton-150.jpg');
            assert.equal(size150.width, 150);

            let size250 = await sizeOf('out-rebased/mounted/img/Human-Skeleton-250-figure.jpg');
            assert.equal(size250.width, 250);

            let size100 = await sizeOf('out-rebased/mounted/img/Human-Skeleton-mounted-100.jpg');
            assert.equal(size100.width, 100);

            let size100tononmounted = await sizeOf('out-rebased/img/Human-Skeleton-from-mounted-to-img-100.jpg');
            assert.equal(size100tononmounted.width, 100);
        });

    });

    describe('/hier/dir1/dir2/nested-anchor.html', function() {
        let html;
        let $;

        before(async function() {
            let result = await akasha.readRenderedFile(config_rebase, 'hier/dir1/dir2/nested-anchor.html');
            html = result.html;
            $ = result.$;
        });

        it('should correctly read nested file', function() {
            assert.exists(html, 'result exists');
            assert.isString(html, 'result isString');
        });

        it('should have correct hrefs', function() {
            assert.equal($('article#original a#link-to-root').attr('href'), '../../../index.html');
            assert.equal($('article#original a#link-to-root').html(), 'Home Page');
            assert.equal($('article#original a#link-to-hier').attr('href'), '../../index.html');
            assert.equal($('article#original a#link-to-hier').html(), 'Top index item');
            assert.equal($('article#original a#link-to-hier-dir1').attr('href'), '../index.html');
            assert.equal($('article#original a#link-to-hier-dir1').html(), 'dir1 index item');
        });

        it('should have correct img srcs', function() {
            assert.equal($('article#original figure#change-img-url-figure img').attr('src'), '../../../img/Human-Skeleton.jpg');
            assert.equal($('article#original img#change-img-url').attr('src'), '../../../img/Human-Skeleton.jpg');
            assert.equal($('article#original figure#fig-img-url img').attr('src'), '../../../simple-fig-img.jpg');    
        });

        it('should have correct CSS and JS references', function() {
            assert.equal($('head script[src="../../../vendor/header-js.js"]').length, 1);
            assert.equal($('head script[type="no-known-lang"][src="../../../vendor/popper.js/popper.min.js"]').length, 1);
            assert.equal($('head script:contains("alert(\'in header with inline script\');")').length, 1);
    
            assert.equal($('body script[src="../../../vendor/jquery/jquery.min.js"]').length, 1);
            assert.equal($('body script[type="no-known-lang"][src="../../../vendor/popper.js/umd/popper.min.js"]').length, 1);
            assert.equal($('body script[src="../../../vendor/bootstrap/js/bootstrap.min.js"]').length, 1);
        });
    });
});


describe('Rebased index Chain', function() {
    before(async function() {
        await akasha.cacheSetupComplete(config_rebase);
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
        // console.log(`before documents.isReady`);
        // await documents.isReady();
    });

    it('should generate correct index chain for /hier/dir1/dir2/sibling.html', async function() {
        let chain = await akasha.indexChain(config_rebase, '/hier/dir1/dir2/sibling.html');

        assert.equal(chain.length, 5);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier/index.html');
        assert.include(chain[1].filename, '/hier/index.html');

        assert.include(chain[2].foundPath, 'hier/dir1/index.html');
        assert.include(chain[2].filename, '/hier/dir1/index.html');

        assert.include(chain[3].foundPath, 'hier/dir1/dir2/index.html');
        assert.include(chain[3].filename, '/hier/dir1/dir2/index.html');

        assert.include(chain[4].foundPath, 'hier/dir1/dir2/sibling.html');
        assert.include(chain[4].filename, '/hier/dir1/dir2/sibling.html');
    });

    it('should generate correct index chain for /hier-broke/dir1/dir2/sibling.html', async function() {
        let chain = await akasha.indexChain(config_rebase, '/hier-broke/dir1/dir2/sibling.html');

        assert.equal(chain.length, 3);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier-broke/dir1/dir2/index.html');
        assert.include(chain[1].filename, '/hier-broke/dir1/dir2/index.html');

        assert.include(chain[2].foundPath, 'hier-broke/dir1/dir2/sibling.html');
        assert.include(chain[2].filename, '/hier-broke/dir1/dir2/sibling.html');
    });

    it('should generate correct index chain for /hier/dir1/dir2/index.html', async function() {
        let chain = await akasha.indexChain(config_rebase, '/hier/dir1/dir2/index.html');

        assert.equal(chain.length, 4);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier/index.html');
        assert.include(chain[1].filename, '/hier/index.html');

        assert.include(chain[2].foundPath, 'hier/dir1/index.html');
        assert.include(chain[2].filename, '/hier/dir1/index.html');

        assert.include(chain[3].foundPath, 'hier/dir1/dir2/index.html');
        assert.include(chain[3].filename, '/hier/dir1/dir2/index.html');

    });

    it('should generate correct index chain for /hier/dir1/sibling.html', async function() {
        let chain = await akasha.indexChain(config_rebase, '/hier/dir1/sibling.html');

        assert.equal(chain.length, 4);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier/index.html');
        assert.include(chain[1].filename, '/hier/index.html');

        assert.include(chain[2].foundPath, 'hier/dir1/index.html');
        assert.include(chain[2].filename, '/hier/dir1/index.html');

        assert.include(chain[3].foundPath, 'hier/dir1/sibling.html');
        assert.include(chain[3].filename, '/hier/dir1/sibling.html');

    });

    it('should generate correct index chain for /hier-broke/dir1/sibling.html', async function() {
        let chain = await akasha.indexChain(config_rebase, '/hier-broke/dir1/sibling.html');

        assert.equal(chain.length, 2);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier-broke/dir1/sibling.html');
        assert.include(chain[1].filename, '/hier-broke/dir1/sibling.html');

    });

    it('should generate correct index chain for /hier/dir1/index.html', async function() {
        let chain = await akasha.indexChain(config_rebase, '/hier/dir1/index.html');

        assert.equal(chain.length, 3);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier/index.html');
        assert.include(chain[1].filename, '/hier/index.html');

        assert.include(chain[2].foundPath, 'hier/dir1/index.html');
        assert.include(chain[2].filename, '/hier/dir1/index.html');

    });

    it('should generate correct index chain for /hier/index.html', async function() {
        let chain = await akasha.indexChain(config_rebase, '/hier/index.html');

        assert.equal(chain.length, 2);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier/index.html');
        assert.include(chain[1].filename, '/hier/index.html');
    });

    it('should generate correct index chain for /index.html', async function() {
        let chain = await akasha.indexChain(config_rebase, '/index.html');

        assert.equal(chain.length, 1);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');
    });

    after(async function() {
        this.timeout(75000);
        await akasha.closeCaches();
    });

});

describe('Rebased Nunjucks Include', function() {
    it('should render local Nunjucks include', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'njk-incl.html');

        assert.equal($('#p1').length, 1);
        assert.equal($('#p2').length, 1);
    });

    it('should render secondary Nunjucks include', async function() {
        let { html, $ } = await akasha.readRenderedFile(config_rebase, 'njk-incl.html');

        assert.equal($('#inclusion2').length, 1);
        assert.equal($('#p3').length, 1);
        assert.equal($('#p4').length, 1);
        assert.equal($('#inclusion2 #p3').length, 1);
        assert.equal($('#inclusion2 #p4').length, 1);
    });
});
