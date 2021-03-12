
const { promisify } = require('util');
const akasha   = require('../index');
const { assert } = require('chai');
const sizeOf = promisify(require('image-size'));


const config = new akasha.Configuration();
config.rootURL("https://example.akashacms.com");
config.configDir = __dirname;
config.addLayoutsDir('layouts')
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
config.prepare();

describe('build site', function() {
    it('should build site', async function() {
        this.timeout(25000);
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
});

describe('stylesheets, javascripts', function() {
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
            let { html, $ } = await akasha.readRenderedFile(config, 'metadata-style-javascript.html');
            checkMetadataStyleJS(html, $);
        });

        it('should find stylesheets, javascript from metadata values IN njk-func.html', async function() {
            let { html, $ } = await akasha.readRenderedFile(config, 'njk-func.html');
            checkMetadataStyleJS(html, $);
        });
    });
});

describe('header metadata', function() {

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

    describe('/njk-func.html', function() {
        let html;
        let $;

        before(async function() {
            let results = await akasha.readRenderedFile(config, 'njk-func.html');
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
            let results = await akasha.readRenderedFile(config, '/hier/dir1/dir2/nested-img-resize.html');
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

describe('teaser, content', function() {
    it('should find teaser, content values', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'teaser-content.html');

        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.include($('body section#teaser').html(), 'This is teaser text');
        assert.include($('body article#original').html(), 'This is content text');
        assert.include($('body article#duplicate').html(), 'This is content text');
    });

    const checkBodyClass = (html, $) => {

        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.equal($('body.addedClass').length, 1);
    };

    it('should find added body class values', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'body-class.html');
        checkBodyClass(html, $);
    });

    it('should find added body class values with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'body-class-liquid.html');
        checkBodyClass(html, $);
    });

    it('should find added body class values with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'body-class-nunjucks.html');
        checkBodyClass(html, $);
    });

    it('should find added body class values with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'body-class-handlebars.html');
        checkBodyClass(html, $);
    });

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
        let { html, $ } = await akasha.readRenderedFile(config, 'fig-img.html');
        checkFigImg(html, $);
    });

    it('should render fig-img with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'fig-img-liquid.html');
        checkFigImg(html, $);
    });

    it('should render fig-img with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'fig-img-nunjucks.html');
        checkFigImg(html, $);
    });

    it('should render fig-img with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'fig-img-handlebars.html');
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
        let { html, $ } = await akasha.readRenderedFile(config, 'img2figimg.html');
        checkIMG2FigIMG(html, $);
    });

    it('should find figure/image pair for img with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'img2figimg-liquid.html');
        checkIMG2FigIMG(html, $);
    });

    it('should find figure/image pair for img with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'img2figimg-nunjucks.html');
        checkIMG2FigIMG(html, $);
    });

    it('should find figure/image pair for img with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'img2figimg-handlebars.html');
        checkIMG2FigIMG(html, $);
    });

    const checkImg2Resize = async (html, $, config) => {
        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        // console.log(html);

        assert.equal($('body #resizeto50').length, 1);
        assert.include($('body #resizeto50').attr('src'), "img/Human-Skeleton.jpg");
        assert.notExists($('body #resizeto50').attr('resize-width'));

        assert.equal($('body #resizeto150').length, 1);
        assert.include($('body #resizeto150').attr('src'), "img/Human-Skeleton-150.jpg");
        assert.notExists($('body #resizeto150').attr('resize-width'));
        assert.notExists($('body #resizeto150').attr('resize-to'));

        assert.equal($('body #resizeto250figure').length, 1);
        assert.equal($('body #resizeto250figure figcaption').length, 1);
        assert.include($('body #resizeto250figure img').attr('src'), "img/Human-Skeleton-250-figure.jpg");
        assert.notExists($('body #resizeto250figure img').attr('resize-width'));
        assert.notExists($('body #resizeto250figure img').attr('resize-to'));
        assert.include($('body #resizeto250figure figcaption').html(), "Image caption");

        assert.equal($('body #resizerss').length, 1);
        assert.include($('body #resizerss').attr('src'), "rss_button.png");
        assert.notExists($('body #resizerss').attr('resize-width'));
        assert.notExists($('body #resizerss').attr('resize-to'));

        assert.equal($('body #png2jpg').length, 1);
        assert.include($('body #png2jpg').attr('src'), "rss_button.jpg");
        assert.notExists($('body #png2jpg').attr('resize-width'));
        assert.notExists($('body #png2jpg').attr('resize-to'));

        // console.log(config.plugin('akashacms-builtin').resizequeue);
        assert.equal(config.plugin('akashacms-builtin').resizequeue.length, 30);
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
            resizeto: undefined,
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

        let size50 = await sizeOf('out/img/Human-Skeleton.jpg');
        assert.equal(size50.width, 50);

        let size150 = await sizeOf('out/img/Human-Skeleton-150.jpg');
        assert.equal(size150.width, 150);

        let size250 = await sizeOf('out/img/Human-Skeleton-250-figure.jpg');
        assert.equal(size250.width, 250);

        let sizerss = await sizeOf('out/rss_button.png');
        assert.equal(sizerss.width, 50);

        let sizerssjpg = await sizeOf('out/rss_button.jpg');
        assert.equal(sizerssjpg.width, 50);
    };

    it('should resize img', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'img2resize.html');
        await checkImg2Resize(html, $, config);
    });

    it('should resize img with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'img2resize-liquid.html');
        await checkImg2Resize(html, $, config);
    });

    it('should resize img with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'img2resize-nunjucks.html');
        await checkImg2Resize(html, $, config);
    });

    it('should resize img with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'img2resize-handlebars.html');
        await checkImg2Resize(html, $, config);
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
        let { html, $ } = await akasha.readRenderedFile(config, 'show-content.html');
        checkShowContent(html, $);
    });

    it('should render show-content with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'show-content-liquid.html');
        checkShowContent(html, $);
    });

    it('should render show-content with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'show-content-nunjucks.html');
        checkShowContent(html, $);
    });

    it('should render show-content with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'show-content-handlebars.html');
        checkShowContent(html, $);
    });

    it('should render show-content w/ local reference', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'subdir/show-content-local.html');

        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.equal($('article#original span#simple').length, 1);
        assert.equal($('article#original span#simple a[href="shown-content-local.html"]').length, 1);
        assert.include($('article#original span#simple a[href="shown-content-local.html"]').html(),
                "Shown LOCAL Content - solely for use of show-content-local.html");

        assert.equal($('article#original span#dest').length, 1);
        assert.equal($('article#original span#dest a[href="http://dest.url"]').length, 1);
        assert.include($('article#original span#dest a[href="http://dest.url"]').html(),
                "Shown LOCAL Content - solely for use of show-content-local.html");

        assert.equal($('article#original div#template').length, 1);
        assert.equal($('article#original div#template figure').length, 1);
        assert.equal($('article#original div#template figure a[href="shown-content-local.html"]').length, 2);
        assert.equal($('article#original div#template figure a[href="shown-content-local.html"] img').length, 1);
        assert.equal($('article#original div#template figure figcaption').length, 1);
        assert.equal($('article#original div#template figure figcaption a[href="shown-content-local.html"]').length, 1);
        assert.include($('article#original div#template figure figcaption a[href="shown-content-local.html"]').html(),
            "Shown LOCAL Content - solely for use of show-content-local.html");

        assert.equal($('article#original div#template2').length, 1);
        assert.equal($('article#original div#template2 figure').length, 1);
        assert.equal($('article#original div#template2 figure a[href="http://dest.url"]').length, 2);
        assert.equal($('article#original div#template2 figure a[href="http://dest.url"] img').length, 1);
        assert.equal($('article#original div#template2 figure figcaption').length, 1);
        assert.equal($('article#original div#template2 figure figcaption a[href="http://dest.url"]').length, 1);
        assert.include($('article#original div#template2 figure figcaption a[href="http://dest.url"]').html(),
            "Shown LOCAL Content - solely for use of show-content-local.html");

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
        let { html, $ } = await akasha.readRenderedFile(config, 'anchor-cleanups.html');
        checkAnchorCleanups(html, $);
    });

    it('should process anchor cleanups with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'anchor-cleanups-liquid.html');
        checkAnchorCleanups(html, $);
    });

    it('should process anchor cleanups with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'anchor-cleanups-nunjucks.html');
        checkAnchorCleanups(html, $);
    });

    it('should process anchor cleanups with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'anchor-cleanups-handlebars.html');
        checkAnchorCleanups(html, $);
    });

    describe('/mounted/img2resize.html', function() {
        let html;
        let $;

        before(async function() {
            let result = await akasha.readRenderedFile(config, 'mounted/img2resize.html');
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
            let size150 = await sizeOf('out/mounted/img/Human-Skeleton-150.jpg');
            assert.equal(size150.width, 150);

            let size250 = await sizeOf('out/mounted/img/Human-Skeleton-250-figure.jpg');
            assert.equal(size250.width, 250);

            let size100 = await sizeOf('out/mounted/img/Human-Skeleton-mounted-100.jpg');
            assert.equal(size100.width, 100);

            let size100tononmounted = await sizeOf('out/img/Human-Skeleton-from-mounted-to-img-100.jpg');
            assert.equal(size100tononmounted.width, 100);
        });

    });

    describe('/hier/dir1/dir2/nested-anchor.html', function() {
        let html;
        let $;

        before(async function() {
            let result = await akasha.readRenderedFile(config, 'hier/dir1/dir2/nested-anchor.html');
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

describe('Select Elements', function() {
    let html;
    let $;

    before(async function() {
        let result = await akasha.readRenderedFile(config, 'select-elements.html');
        html = result.html;
        $ = result.$;
    });

    it('should correctly read selected elements file', function() {
        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');
    });

    it('should have correct first-selected-elements', function() {
        assert.equal($('article div#first-select-elements').length, 1);
        assert.isTrue($('article div#first-select-elements').hasClass('foobar'));
        assert.include($('article div#first-select-elements').html(), 'Element');
        assert.include($('article div#first-select-elements').html(), 'Inner content');
    });

    it('should have correct second-selected-elements', function() {
        assert.equal($('article div#second-select-elements').length, 1);
        assert.include($('article div#second-select-elements').html(), 'Element');
        assert.include($('article div#second-select-elements').html(), 'Inner content');
    });

    it('should have correct third-selected-elements', function() {
        assert.equal($('article span#third-select-elements').length, 1);
        assert.include($('article span#third-select-elements').html(), 'Element');
        assert.include($('article span#third-select-elements').html(), 'Inner content');
    });

    /*
    it('should have correct fourth-selected-elements', function() {
        assert.equal($('article foo#fourth-select-elements').length, 1);
        assert.equal($('article foo#fourth-select-elements').children().length, 3);
        assert.include($('article foo#fourth-select-elements').html(), 'Element');
        assert.include($('article foo#fourth-select-elements').html(), 'Inner content');
    });
    */
});

describe('Index Chain', function() {
    it('should generate correct index chain for /hier/dir1/dir2/sibling.html', async function() {
        let chain = await akasha.indexChain(config, '/hier/dir1/dir2/sibling.html');

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
        let chain = await akasha.indexChain(config, '/hier-broke/dir1/dir2/sibling.html');

        assert.equal(chain.length, 3);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier-broke/dir1/dir2/index.html');
        assert.include(chain[1].filename, '/hier-broke/dir1/dir2/index.html');

        assert.include(chain[2].foundPath, 'hier-broke/dir1/dir2/sibling.html');
        assert.include(chain[2].filename, '/hier-broke/dir1/dir2/sibling.html');
    });

    it('should generate correct index chain for /hier/dir1/dir2/index.html', async function() {
        let chain = await akasha.indexChain(config, '/hier/dir1/dir2/index.html');

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
        let chain = await akasha.indexChain(config, '/hier/dir1/sibling.html');

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
        let chain = await akasha.indexChain(config, '/hier-broke/dir1/sibling.html');

        assert.equal(chain.length, 2);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier-broke/dir1/sibling.html');
        assert.include(chain[1].filename, '/hier-broke/dir1/sibling.html');

    });

    it('should generate correct index chain for /hier/dir1/index.html', async function() {
        let chain = await akasha.indexChain(config, '/hier/dir1/index.html');

        assert.equal(chain.length, 3);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier/index.html');
        assert.include(chain[1].filename, '/hier/index.html');

        assert.include(chain[2].foundPath, 'hier/dir1/index.html');
        assert.include(chain[2].filename, '/hier/dir1/index.html');

    });

    it('should generate correct index chain for /hier/index.html', async function() {
        let chain = await akasha.indexChain(config, '/hier/index.html');

        assert.equal(chain.length, 2);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');

        assert.include(chain[1].foundPath, 'hier/index.html');
        assert.include(chain[1].filename, '/hier/index.html');
    });

    it('should generate correct index chain for /index.html', async function() {
        let chain = await akasha.indexChain(config, '/index.html');

        assert.equal(chain.length, 1);
        assert.include(chain[0].foundPath, 'index.html');
        assert.include(chain[0].filename, '/index.html');
    });
});

describe('Nunjucks Include', function() {
    it('should render local Nunjucks include', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'njk-incl.html');

        assert.equal($('#p1').length, 1);
        assert.equal($('#p2').length, 1);
    });

    it('should render secondary Nunjucks include', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'njk-incl.html');

        assert.equal($('#inclusion2').length, 1);
        assert.equal($('#p3').length, 1);
        assert.equal($('#p4').length, 1);
        assert.equal($('#inclusion2 #p3').length, 1);
        assert.equal($('#inclusion2 #p4').length, 1);
    });
});

describe('Partials', function() {

    const checkPartials = (html, $) => {
        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        // console.log(html);
        // TODO The rendering of a Partiall with JSON body is not working
        // correctly and is therefore not tested.

        assert.include($('article#original div#html-partial').html(), 
            'This is a tiny partial meant to demonstrate synchronous templates');
        assert.include($('article#original strong').html(), 
            'Hello, world!');
        assert.include($('article#original strong').html(), 
            'And some other');
    };

    it('should render HTML and EJS partials', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'partials.html');
        checkPartials(html, $);
    });

    it('should render HTML and EJS partials with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'partials-liquid.html');
        checkPartials(html, $);
    });

    it('should render HTML and EJS partials with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'partials-nunjucks.html');
        checkPartials(html, $);

        // Checking that a call to partialSync from a Nunjuks
        // template works, and also passes data to partial.
        assert.include($('article#original').html(),
                'This is a Nunjuks test partial');
        assert.include($('article#original #html-partial2').html(),
                'This is the second tiny partial');
        assert.include($('article#original #p1').html(),
                'This is to be included');
    });

    it('should render HTML and EJS partials with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'partials-handlebars.html');
        checkPartials(html, $);
    });
});

describe('JSON document', function() {
    const checkJSONdata = (html, $) => {
        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.equal($('article#original ul.json-data').length, 1);
        assert.equal($('article#original ul.json-data li').length, 3);
        assert.include($('article#original ul.json-data li:nth-child(1)').html(), 'Row1');
        assert.include($('article#original ul.json-data li:nth-child(1)').html(), 'value 1');
        assert.include($('article#original ul.json-data li:nth-child(2)').html(), 'Row2');
        assert.include($('article#original ul.json-data li:nth-child(2)').html(), 'value 2');
        assert.include($('article#original ul.json-data li:nth-child(3)').html(), 'Row3');
        assert.include($('article#original ul.json-data li:nth-child(3)').html(), 'value 3');
    };

    it('should render JSON document', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'json-data.html');
        checkJSONdata(html, $);
    });

    it('should render JSON document with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'json-data-liquid.html');
        checkJSONdata(html, $);
    });

    it('should render JSON document with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'json-data-nunjucks.html');
        checkJSONdata(html, $);
    });

    it('should render JSON document with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'json-data-handlebars.html');
        checkJSONdata(html, $);
    });
});

describe('AsciiDoc document', function() {
    const checkAsciidoc = (html, $) => {

        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.equal($('article#original div.olist.arabic ol.arabic').length, 5);
        assert.include($('article#original div.olist.arabic ol.arabic').html(), 'Step 1');
        assert.equal($('article#original div[class="title"]:contains("AsciiDoc history")').length, 1);
        assert.equal($('article#original div[class="paragraph"] a[href="http://asciidoctor.org"]:contains("Asciidoctor")').length, 1);
        assert.equal($('article#original div[class="paragraph"] a[href="https://github.com/asciidoctor"]:contains("Asciidoctor")').length, 1);
    };

    it('should render AsciiDoc document', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'asciidoctor.html');
        checkAsciidoc(html, $);
    });

    it('should render AsciiDoc document with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'asciidoctor-liquid.html');
        checkAsciidoc(html, $);
    });

    it('should render AsciiDoc document with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'asciidoctor-nunjucks.html');
        checkAsciidoc(html, $);
    });

    it('should render AsciiDoc document with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'asciidoctor-handlebars.html');
        checkAsciidoc(html, $);
    });
});

describe('code-embed element', function() {

    const checkCodeEmbed = (html, $) => {
        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.equal($('article#original pre#relative-fn-css').length, 1);
        assert.include($('article#original pre#relative-fn-css code').html(), 'header');

        assert.equal($('article#original pre#relative-fn-js').length, 1);
        assert.include($('article#original pre#relative-fn-js code').html(), 'foo');
        
        assert.equal($('article#original pre#absolute-fn-css').length, 1);
        assert.include($('article#original pre#absolute-fn-css code').html(), 'header');

        assert.equal($('article#original pre#absolute-fn-js').length, 1);
        assert.include($('article#original pre#absolute-fn-js code').html(), 'foo');
        
        assert.equal($('article#original pre#relative-fn-lang-css').length, 1);
        assert.include($('article#original pre#relative-fn-lang-css code').html(), 'header');
        assert.isTrue($('article#original pre#relative-fn-lang-css code').hasClass('css'));

        assert.equal($('article#original pre#relative-fn-lang-js').length, 1);
        assert.include($('article#original pre#relative-fn-lang-js code').html(), 'foo');
        assert.isTrue($('article#original pre#relative-fn-lang-js code').hasClass('js'));
    };

    it('should render code-embed document', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'code-embed.html');
        checkCodeEmbed(html, $);
    });

    it('should render code-embed document rendered with Liquid', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'code-embed-liquid.html');
        checkCodeEmbed(html, $);
    });

    it('should render code-embed document rendered with Nunjucks', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'code-embed-nunjucks.html');
        checkCodeEmbed(html, $);
    });

    it('should render code-embed document rendered with Handlebars', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'code-embed-handlebars.html');
        checkCodeEmbed(html, $);
    });
});


// TODO HBS support does not exist
// Layout using HBS

// partial using HBS

// Anchor cleanups



