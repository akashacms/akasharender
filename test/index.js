
const { promisify } = require('util');
const akasha   = require('../index');
const { assert } = require('chai');
const sizeOf = promisify(require('image-size'));


const config = new akasha.Configuration();
config.rootURL("https://example.akashacms.com");
config.configDir = __dirname;
config.addLayoutsDir('layouts')
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
        it('should find stylesheets, javascript values', async function() {
            let { html, $ } = await akasha.readRenderedFile(config, 'simple-style-javascript.html');
    
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
        });
    });
    
    describe('metadata-style-javascript.html', function() {
        it('should find stylesheets, javascript from metadata values', async function() {
            let { html, $ } = await akasha.readRenderedFile(config, 'metadata-style-javascript.html');

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
        });
    });
});

describe('header metadata', function() {

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
            assert.equal($('head link[rel="alternate"][type="application/rss+xml"][href="rss-for-header.xml"]').length, 1);
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
            assert.equal($('head link[rel="sitemap"][type="application/xml"][title="Sitemap"][href="sitemap.xml"]').length, 1);
            assert.equal($('head link[rel="sitemap"][type="application/xml"][title="Foo Bar Sitemap"][href="foo-bar-sitemap.xml"]').length, 1);
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

    it('should find added body class values', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'body-class.html');

        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.equal($('body.addedClass').length, 1);
    });

    it('should render fig-img', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'fig-img.html');

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
    });

    it('should find figure/image pair for img', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'img2figimg.html');

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
    });

    it('should resize img', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'img2resize.html');

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
        assert.equal(config.plugin('akashacms-builtin').resizequeue.length, 12);
        assert.deepEqual(config.plugin('akashacms-builtin').resizequeue, [
            {
                src: '../../imgdir/img/tesla-nema.jpg',
                resizewidth: '200',
                resizeto: 'img/tesla-nema.jpg',
                docPath: 'hier/dir1/dir2/nested-img-resize.html'
            },
            {
                src: '../../imgdir/img/tesla-nema.jpg',
                resizewidth: '200',
                resizeto: 'img/tesla-nema.jpg',
                docPath: 'hier/dir1/dir2/nested-img-resize.html'
            },
            {
                src: 'img/Human-Skeleton.jpg',
                resizewidth: '50',
                resizeto: undefined,
                docPath: "img2resize.html"
            },
            {
                src: 'img/Human-Skeleton.jpg',
                resizewidth: '150',
                resizeto: 'img/Human-Skeleton-150.jpg',
                docPath: "img2resize.html"
            },
            {
                src: 'img/Human-Skeleton.jpg',
                resizewidth: '250',
                resizeto: 'img/Human-Skeleton-250-figure.jpg',
                docPath: "img2resize.html"
            },
            {
                resizeto: undefined,
                resizewidth: "50",
                src: "rss_button.png",
                docPath: "img2resize.html"
            },
            {
                resizeto: "rss_button.jpg",
                resizewidth: "50",
                src: "rss_button.png",
                docPath: "img2resize.html"
            },
            {
              docPath: "img2resize.html",
              resizeto: "/img/Human-Skeleton-mounted-100.jpg",
              resizewidth: "100",
              src: "/mounted/img/Human-Skeleton.jpg"
            },
            {
              "docPath": "mounted/img2resize.html",
              "resizeto": "img/Human-Skeleton-150.jpg",
              "resizewidth": "150",
              "src": "img/Human-Skeleton.jpg",
            },
            {
              "docPath": "mounted/img2resize.html",
              "resizeto": "img/Human-Skeleton-250-figure.jpg",
              "resizewidth": "250",
              "src": "img/Human-Skeleton.jpg",
            },
            {
              "docPath": "mounted/img2resize.html",
              "resizeto": "img/Human-Skeleton-mounted-100.jpg",
              "resizewidth": "100",
              "src": "/mounted/img/Human-Skeleton.jpg",
            },
            {
              "docPath": "mounted/img2resize.html",
              "resizeto": "/img/Human-Skeleton-from-mounted-to-img-100.jpg",
              "resizewidth": "100",
              "src": "/mounted/img/Human-Skeleton.jpg",
            }
        ]);

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

    });

    it('should render show-content', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'show-content.html');

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
        assert.equal($('article#original div#template figure a[href="shown-content.html"] img[src="imgz/shown-content-image.jpg"]').length, 1);
        assert.equal($('article#original div#template figure figcaption').length, 1);
        assert.equal($('article#original div#template figure figcaption a[href="shown-content.html"]').length, 1);
        assert.include($('article#original div#template figure figcaption a[href="shown-content.html"]').html(), 
            "Shown Content - solely for use of show-content.html");
        
        assert.equal($('article#original div#template2').length, 1);
        assert.equal($('article#original div#template2 figure').length, 1);
        assert.equal($('article#original div#template2 figure a[href="http://dest.url"] img[src="imgz/shown-content-image.jpg"]').length, 1);
        assert.equal($('article#original div#template2 figure figcaption').length, 1);
        assert.equal($('article#original div#template2 figure figcaption a[href="http://dest.url"]').length, 1);
        assert.include($('article#original div#template2 figure figcaption a[href="http://dest.url"]').html(), 
            "Shown Content - solely for use of show-content.html");
            
    });


    it('should process anchor cleanups', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'anchor-cleanups.html');

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

    it('should have correct fourth-selected-elements', function() {
        assert.equal($('article foo#fourth-select-elements').length, 1);
        assert.equal($('article foo#fourth-select-elements').children().length, 3);
        assert.include($('article foo#fourth-select-elements').html(), 'Element');
        assert.include($('article foo#fourth-select-elements').html(), 'Inner content');
    });
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

describe('Partials', function() {
    it('should render HTML and EJS partials', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'partials.html');

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
    });
});

describe('JSON document', function() {
    it('should render JSON document', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'json-data.html');

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
    });
});

describe('AsciiDoc document', function() {
    it('should render AsciiDoc document', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'asciidoctor.html');

        assert.exists(html, 'result exists');
        assert.isString(html, 'result isString');

        assert.equal($('article#original div.olist.arabic ol.arabic').length, 5);
        assert.include($('article#original div.olist.arabic ol.arabic').html(), 'Step 1');
        assert.equal($('article#original div[class="title"]:contains("AsciiDoc history")').length, 1);
        assert.equal($('article#original div[class="paragraph"] a[href="http://asciidoctor.org"]:contains("Asciidoctor")').length, 1);
        assert.equal($('article#original div[class="paragraph"] a[href="https://github.com/asciidoctor"]:contains("Asciidoctor")').length, 1);

    });
});

describe('code-embed element', function() {

    it('should render code-embed document', async function() {
        let { html, $ } = await akasha.readRenderedFile(config, 'code-embed.html');

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
        
    });
});


// TODO HBS support does not exist
// Layout using HBS

// partial using HBS

// Anchor cleanups



