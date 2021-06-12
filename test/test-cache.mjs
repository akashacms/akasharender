import util   from 'util';
import path   from 'path';
import fse    from 'fs-extra';
import akasha from '../index.js';
import * as filecache from '../cache/file-cache.mjs';
import * as cache from '../cache/cache-forerunner.mjs';
import minimatch from 'minimatch';
import Chai   from 'chai';
const assert = Chai.assert;

// See https://techsparx.com/nodejs/esnext/dirname-es-modules.html
const moduleURL = new URL(import.meta.url);
const __dirname = path.dirname(moduleURL.pathname);

let config;

describe('Initialize cache test configuration', function() {
    it('should successfully configure test site', async function() {
        try {
            this.timeout(25000);
            config = new akasha.Configuration();
            config.rootURL("https://example.akashacms.com");
            config.configDir = __dirname;
            config
                .addAssetsDir({
                    src: 'assets2',
                    dest: '/',
                    ignore: [
                        '**/.placeholder'
                    ]
                })
                .addAssetsDir({
                    src: 'assets',
                    dest: '/',
                    ignore: [
                        '**/.placeholder'
                    ]
                })
                .addLayoutsDir({
                    src: 'layouts-extra',
                    dest: '/',
                    ignore: [
                        '**/.placeholder'
                    ]
                })
                .addLayoutsDir({
                    src: 'layouts',
                    dest: '/',
                    ignore: [
                        '**/.placeholder'
                    ]
                })
                .addDocumentsDir({
                    src: 'documents',
                    dest: '/',
                    ignore: [
                        '**/.placeholder',
                        '**/toignore.*',
                        '**/*.ignore'
                    ]
                })
                .addDocumentsDir({ // Test overriding a file
                    src: 'mounted2',
                    dest: 'mounted',
                    ignore: [
                        '**/.placeholder'
                    ]
                })
                .addDocumentsDir({
                    src: 'mounted',
                    dest: 'mounted',
                    ignore: [
                        '**/.placeholder'
                    ]
                })
                .addPartialsDir({
                    src: 'partials2',
                    dest: '/',
                    ignore: [
                        '**/.placeholder'
                    ]
                })
                .addPartialsDir({
                    src: 'partials',
                    dest: '/',
                    ignore: [
                        '**/.placeholder'
                    ]
                });
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
                .addStylesheet({ href: "/style.css" })
                .addStylesheet({ href: "/print.css", media: "print" });
            config.prepare();
        } catch (e) {
            console.error(e);
            throw e;
        }
    });
});

describe('Setup cache', function() {
    it('should delete cache DB dir', async function() {
        try {
            await fse.remove(config.cacheDir);
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    it('should successfully setup cache database', async function() {
        try {
            await akasha.cacheSetup(config);
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    it('should successfully setup file caches', async function() {
        this.timeout(75000);
        try {
            await Promise.all([
                akasha.setupDocuments(config),
                akasha.setupAssets(config),
                akasha.setupLayouts(config),
                akasha.setupPartials(config)
            ])
            await Promise.all([
                filecache.documents.isReady(),
                filecache.assets.isReady(),
                filecache.layouts.isReady(),
                filecache.partials.isReady()
            ]);
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

});

describe('Test cache', function() {

    const cachenm = 'test';
    
    it('should not have test cache', async function() {
        try {
            assert.isFalse(await cache.cacheExists(cachenm));
        } catch (e) {
            console.error(`FAIL should not have test cache ${e}`);
            throw e;
        }
    });

    it('should create test cache', async function() {
        try {
            await cache.addCache(cachenm);
        } catch (e) {
            console.error(`FAIL should create test cache ${e}`);
            throw e;
        }
    });

    it('should have test cache', async function() {
        try {
            assert.isTrue(await cache.cacheExists(cachenm));
        } catch (e) {
            console.error(`FAIL should have test cache ${e}`);
            throw e;
        }
    });

    it('should add item to cache', async function() {
        try {
            const c = await cache.getCache(cachenm);
            assert.isDefined(c);
            c.insert({ meaning: 42, something: 'completely different' });
            // await cache.save();
        } catch (e) {
            console.error(`FAIL should add item to cache ${e}`);
            throw e;
        }
    });
    
    it('should find item in cache', async function() {
        try {
            const c = await cache.getCache(cachenm);
            assert.isDefined(c);
            let found = c.find({ meaning: 42 });
            assert.isArray(found);
            assert.equal(found.length, 1);
            assert.deepEqual({
                    meaning: found[0].meaning,
                    something: found[0].something
                }, {
                    meaning: 42,
                    something: 'completely different'
                });
            found = c.find({ something: 'completely different' });
            assert.isArray(found);
            assert.equal(found.length, 1);
            assert.deepEqual({
                    meaning: found[0].meaning,
                    something: found[0].something
                }, {
                    meaning: 42,
                    something: 'completely different'
                });
            found = cache.find(cachenm, { meaning: 42 });
            assert.isArray(found);
            assert.equal(found.length, 1);
            assert.deepEqual({
                    meaning: found[0].meaning,
                    something: found[0].something
                }, {
                    meaning: 42,
                    something: 'completely different'
                });
            found = cache.find(cachenm,
                { something: 'completely different' });
            assert.isArray(found);
            assert.equal(found.length, 1);
            assert.deepEqual({
                    meaning: found[0].meaning,
                    something: found[0].something
                }, {
                    meaning: 42,
                    something: 'completely different'
                });
        } catch (e) {
            console.error(`FAIL should find item in cache ${e}`);
            throw e;
        }
    });

    it('should not find bad item', async function() {
        try {
            const notfound = cache.find(cachenm, {
                doesnotexist: true
            });
            assert.isArray(notfound);
            assert.equal(notfound.length, 0);
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    it('should upsert item', async function() {
        try {
            await cache.upsert(cachenm, {
                meaning: 55,
                upsert: 'rocks'
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    it('should find upserted item in cache', async function() {
        try {
            const c = await cache.getCache(cachenm);
            assert.isDefined(c);
            let found = c.find({ meaning: 55 });
            assert.isArray(found);
            assert.equal(found.length, 1);
            assert.deepEqual({
                    meaning: found[0].meaning,
                    upsert: found[0].upsert
                }, {
                    meaning: 55,
                    upsert: 'rocks'
                });
            found = c.find({ upsert: 'rocks' });
            assert.isArray(found);
            assert.equal(found.length, 1);
            assert.deepEqual({
                    meaning: found[0].meaning,
                    upsert: found[0].upsert
                }, {
                    meaning: 55,
                    upsert: 'rocks'
                });
            found = cache.find(cachenm, { meaning: 55 });
            assert.isArray(found);
            assert.equal(found.length, 1);
            assert.deepEqual({
                    meaning: found[0].meaning,
                    upsert: found[0].upsert
                }, {
                    meaning: 55,
                    upsert: 'rocks'
                });
            found = cache.find(cachenm, { upsert: 'rocks' });
            assert.deepEqual({
                    meaning: found[0].meaning,
                    upsert: found[0].upsert
                }, {
                    meaning: 55,
                    upsert: 'rocks'
                });
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    it('should remove item', async function() {
        try {
            (await cache.getCache(cachenm)).remove({
                upsert: 'rocks'
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    it('should not find removed item', async function() {
        try {
            const c = await cache.getCache(cachenm);
            assert.isDefined(c);
            let found = c.find({ meaning: 55 });
            assert.isArray(found);
            assert.equal(found.length, 0);
            found = c.find({ upsert: 'rocks' });
            assert.isArray(found);
            assert.equal(found.length, 0);
            found = cache.find(cachenm, { meaning: 55 });
            assert.isArray(found);
            assert.equal(found.length, 0);
            found = cache.find(cachenm, { upsert: 'rocks' });
            assert.isArray(found);
            assert.equal(found.length, 0);
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    describe('Unknown cache', function() {

        it('shound not find unknown cache', async function() {
            try {
                assert.isFalse(await cache.cacheExists('unknown'));
            } catch (e) {
                console.error(e);
                throw e;
            }
        });

        it('should not find item in unknown cache', async function() {
            try {
                let notfound = cache.find('unknown', {
                    meaning: 42
                });
                assert.isArray(notfound);
                assert.equal(notfound.length, 0);
            } catch (e) {
                console.error(e);
                throw e;
            }
        });

    });

    describe('Close cache', function() {
        it('should close cache', function() {
            cache.close();
        });
    });

    describe('Reopen cache', function() {

        it('should successfully reopen cache database', async function() {
            try {
                await cache.setup(config);
            } catch (e) {
                console.error(e);
                throw e;
            }
        });

        it('should have cache dir', async function() {
            try {
                assert.isTrue(await fse.pathExists(config.cacheDir));
            } catch (e) {
                console.error(e);
                throw e;
            }
        });

        it('should find item in cache', async function() {
            try {
                const c = await cache.getCache(cachenm);
                assert.isDefined(c);
                let found = c.find({ meaning: 42 });
                assert.isArray(found);
                assert.equal(found.length, 1);
                assert.deepEqual({
                        meaning: found[0].meaning,
                        something: found[0].something
                    }, {
                        meaning: 42,
                        something: 'completely different'
                    });
                found = c.find({ something: 'completely different' });
                assert.isArray(found);
                assert.equal(found.length, 1);
                assert.deepEqual({
                        meaning: found[0].meaning,
                        something: found[0].something
                    }, {
                        meaning: 42,
                        something: 'completely different'
                    });
                found = cache.find(cachenm, { meaning: 42 });
                assert.isArray(found);
                assert.equal(found.length, 1);
                assert.deepEqual({
                        meaning: found[0].meaning,
                        something: found[0].something
                    }, {
                        meaning: 42,
                        something: 'completely different'
                    });
                found = cache.find(cachenm,
                    { something: 'completely different' });
                assert.isArray(found);
                assert.equal(found.length, 1);
                assert.deepEqual({
                        meaning: found[0].meaning,
                        something: found[0].something
                    }, {
                        meaning: 42,
                        something: 'completely different'
                    });
            } catch (e) {
                console.error(`FAIL should find item in cache ${e}`);
                throw e;
            }
        });

        it('should not find bad item', async function() {
            try {
                const notfound = cache.find(cachenm, {
                    doesnotexist: true
                });
                assert.isArray(notfound);
                assert.equal(notfound.length, 0);
            } catch (e) {
                console.error(e);
                throw e;
            }
        });

        it('should not find removed item', async function() {
            try {
                const c = await cache.getCache(cachenm);
                assert.isDefined(c);
                let found = c.find({ meaning: 55 });
                assert.isArray(found);
                assert.equal(found.length, 0);
                found = c.find({ upsert: 'rocks' });
                assert.isArray(found);
                assert.equal(found.length, 0);
                found = cache.find(cachenm, { meaning: 55 });
                assert.isArray(found);
                assert.equal(found.length, 0);
                found = cache.find(cachenm, { upsert: 'rocks' });
                assert.isArray(found);
                assert.equal(found.length, 0);
            } catch (e) {
                console.error(e);
                throw e;
            }
        });

    });
});

function isPathAllowed(pathinfo, allowed_paths) {
    for (let allowed of allowed_paths) {
        // console.log(`pathinfo ${util.inspect(pathinfo)} allowed ${util.inspect(allowed)}`);
        if (minimatch(pathinfo.fspath, allowed.fspath)
            && pathinfo.renderPath === allowed.renderPath
            && pathinfo.vpath === allowed.vpath) {
                return true;
            }
    }
    return false;
}

describe('Documents cache', function() {
    const allowed_paths = [
        {
            fspath: '**/mounted2/img2resize.html.md',
            renderPath: 'mounted/img2resize.html',
            vpath: 'mounted/img2resize.html.md'
        },
        {
            fspath: '**/documents/anchor-cleanups-handlebars.html.md',
            renderPath: 'anchor-cleanups-handlebars.html',
            vpath: 'anchor-cleanups-handlebars.html.md'
        },
        {
            fspath: '**/documents/anchor-cleanups-liquid.html.md',
            renderPath: 'anchor-cleanups-liquid.html',
            vpath: 'anchor-cleanups-liquid.html.md'
        },
        {
            fspath: '**/documents/anchor-cleanups-nunjucks.html.md',
            renderPath: 'anchor-cleanups-nunjucks.html',
            vpath: 'anchor-cleanups-nunjucks.html.md'
        },
        {
            fspath: '**/documents/anchor-cleanups.html.md',
            renderPath: 'anchor-cleanups.html',
            vpath: 'anchor-cleanups.html.md'
        },
        {
            fspath: '**/documents/asciidoctor-handlebars.html.adoc',
            renderPath: 'asciidoctor-handlebars.html',
            vpath: 'asciidoctor-handlebars.html.adoc'
        },
        {
            fspath: '**/documents/asciidoctor-liquid.html.adoc',
            renderPath: 'asciidoctor-liquid.html',
            vpath: 'asciidoctor-liquid.html.adoc'
        },
        {
            fspath: '**/documents/asciidoctor-nunjucks.html.adoc',
            renderPath: 'asciidoctor-nunjucks.html',
            vpath: 'asciidoctor-nunjucks.html.adoc'
        },
        {
            fspath: '**/documents/asciidoctor.html.adoc',
            renderPath: 'asciidoctor.html',
            vpath: 'asciidoctor.html.adoc'
        },
        {
            fspath: '**/documents/body-class-handlebars.html.md',
            renderPath: 'body-class-handlebars.html',
            vpath: 'body-class-handlebars.html.md'
        },
        {
            fspath: '**/documents/body-class-liquid.html.md',
            renderPath: 'body-class-liquid.html',
            vpath: 'body-class-liquid.html.md'
        },
        {
            fspath: '**/documents/body-class-nunjucks.html.md',
            renderPath: 'body-class-nunjucks.html',
            vpath: 'body-class-nunjucks.html.md'
        },
        {
            fspath: '**/documents/body-class.html.md',
            renderPath: 'body-class.html',
            vpath: 'body-class.html.md'
        },
        {
            fspath: '**/documents/code-embed-handlebars.html.md',
            renderPath: 'code-embed-handlebars.html',
            vpath: 'code-embed-handlebars.html.md'
        },
        {
            fspath: '**/documents/code-embed-liquid.html.md',
            renderPath: 'code-embed-liquid.html',
            vpath: 'code-embed-liquid.html.md'
        },
        {
            fspath: '**/documents/code-embed-nunjucks.html.md',
            renderPath: 'code-embed-nunjucks.html',
            vpath: 'code-embed-nunjucks.html.md'
        },
        {
            fspath: '**/documents/code-embed.html.md',
            renderPath: 'code-embed.html',
            vpath: 'code-embed.html.md'
        },
        {
            fspath: '**/documents/fig-img-handlebars.html.md',
            renderPath: 'fig-img-handlebars.html',
            vpath: 'fig-img-handlebars.html.md'
        },
        {
            fspath: '**/documents/fig-img-liquid.html.md',
            renderPath: 'fig-img-liquid.html',
            vpath: 'fig-img-liquid.html.md'
        },
        {
            fspath: '**/documents/fig-img-nunjucks.html.md',
            renderPath: 'fig-img-nunjucks.html',
            vpath: 'fig-img-nunjucks.html.md'
        },
        {
            fspath: '**/documents/fig-img.html.md',
            renderPath: 'fig-img.html',
            vpath: 'fig-img.html.md'
        },
        {
            fspath: '**/documents/img2figimg-handlebars.html.md',
            renderPath: 'img2figimg-handlebars.html',
            vpath: 'img2figimg-handlebars.html.md'
        },
        {
            fspath: '**/documents/img2figimg-liquid.html.md',
            renderPath: 'img2figimg-liquid.html',
            vpath: 'img2figimg-liquid.html.md'
        },
        {
            fspath: '**/documents/img2figimg-nunjucks.html.md',
            renderPath: 'img2figimg-nunjucks.html',
            vpath: 'img2figimg-nunjucks.html.md'
        },
        {
            fspath: '**/documents/img2figimg.html.md',
            renderPath: 'img2figimg.html',
            vpath: 'img2figimg.html.md'
        },
        {
            fspath: '**/documents/img2resize-handlebars.html.md',
            renderPath: 'img2resize-handlebars.html',
            vpath: 'img2resize-handlebars.html.md'
        },
        {
            fspath: '**/documents/img2resize-liquid.html.md',
            renderPath: 'img2resize-liquid.html',
            vpath: 'img2resize-liquid.html.md'
        },
        {
            fspath: '**/documents/img2resize-nunjucks.html.md',
            renderPath: 'img2resize-nunjucks.html',
            vpath: 'img2resize-nunjucks.html.md'
        },
        {
            fspath: '**/documents/img2resize.html.md',
            renderPath: 'img2resize.html',
            vpath: 'img2resize.html.md'
        },
        {
            fspath: '**/documents/index.html.md',
            renderPath: 'index.html',
            vpath: 'index.html.md'
        },
        {
            fspath: '**/documents/json-data-handlebars.html.json',
            renderPath: 'json-data-handlebars.html',
            vpath: 'json-data-handlebars.html.json'
        },
        {
            fspath: '**/documents/json-data-liquid.html.json',
            renderPath: 'json-data-liquid.html',
            vpath: 'json-data-liquid.html.json'
        },
        {
            fspath: '**/documents/json-data-nunjucks.html.json',
            renderPath: 'json-data-nunjucks.html',
            vpath: 'json-data-nunjucks.html.json'
        },
        {
            fspath: '**/documents/json-data.html.json',
            renderPath: 'json-data.html',
            vpath: 'json-data.html.json'
        },
        {
            fspath: '**/documents/metadata-style-javascript.html.md',
            renderPath: 'metadata-style-javascript.html',
            vpath: 'metadata-style-javascript.html.md'
        },
        {
            fspath: '**/documents/njk-func.html.md',
            renderPath: 'njk-func.html',
            vpath: 'njk-func.html.md'
        },
        {
            fspath: '**/documents/njk-incl.html.md',
            renderPath: 'njk-incl.html',
            vpath: 'njk-incl.html.md'
        },
        {
            fspath: '**/documents/partials-handlebars.html.handlebars',
            renderPath: 'partials-handlebars.html',
            vpath: 'partials-handlebars.html.handlebars'
        },
        {
            fspath: '**/documents/partials-liquid.html.liquid',
            renderPath: 'partials-liquid.html',
            vpath: 'partials-liquid.html.liquid'
        },
        {
            fspath: '**/documents/partials-nunjucks.html.njk',
            renderPath: 'partials-nunjucks.html',
            vpath: 'partials-nunjucks.html.njk'
        },
        {
            fspath: '**/documents/partials.html.md',
            renderPath: 'partials.html',
            vpath: 'partials.html.md'
        },
        {
            fspath: '**/documents/select-elements.html.md',
            renderPath: 'select-elements.html',
            vpath: 'select-elements.html.md'
        },
        {
            fspath: '**/documents/show-content-handlebars.html.md',
            renderPath: 'show-content-handlebars.html',
            vpath: 'show-content-handlebars.html.md'
        },
        {
            fspath: '**/documents/show-content-liquid.html.md',
            renderPath: 'show-content-liquid.html',
            vpath: 'show-content-liquid.html.md'
        },
        {
            fspath: '**/documents/show-content-nunjucks.html.md',
            renderPath: 'show-content-nunjucks.html',
            vpath: 'show-content-nunjucks.html.md'
        },
        {
            fspath: '**/documents/show-content.html.md',
            renderPath: 'show-content.html',
            vpath: 'show-content.html.md'
        },
        {
            fspath: '**/documents/shown-content.html.md',
            renderPath: 'shown-content.html',
            vpath: 'shown-content.html.md'
        },
        {
            fspath: '**/documents/simple-style-javascript.html.md',
            renderPath: 'simple-style-javascript.html',
            vpath: 'simple-style-javascript.html.md'
        },
        {
            fspath: '**/documents/teaser-content.html.md',
            renderPath: 'teaser-content.html',
            vpath: 'teaser-content.html.md'
        },
        {
            fspath: '**/mounted2/img/Human-Skeleton.jpg',
            renderPath: 'mounted/img/Human-Skeleton.jpg',
            vpath: 'mounted/img/Human-Skeleton.jpg'
        },
        {
            fspath: '**/documents/subdir/index.html.md',
            renderPath: 'subdir/index.html',
            vpath: 'subdir/index.html.md'
        },
        {
            fspath: '**/documents/subdir/show-content-local.html.md',
            renderPath: 'subdir/show-content-local.html',
            vpath: 'subdir/show-content-local.html.md'
        },
        {
            fspath: '**/documents/subdir/shown-content-local.html.md',
            renderPath: 'subdir/shown-content-local.html',
            vpath: 'subdir/shown-content-local.html.md'
        },
        {
            fspath: '**/documents/img/Human-Skeleton.jpg',
            renderPath: 'img/Human-Skeleton.jpg',
            vpath: 'img/Human-Skeleton.jpg'
        },
        {
            fspath: '**/documents/hier-broke/dir1/sibling.html.md',
            renderPath: 'hier-broke/dir1/sibling.html',
            vpath: 'hier-broke/dir1/sibling.html.md'
        },
        {
            fspath: '**/documents/hier-broke/dir1/dir2/index.html.md',
            renderPath: 'hier-broke/dir1/dir2/index.html',
            vpath: 'hier-broke/dir1/dir2/index.html.md'
        },
        {
            fspath: '**/documents/hier-broke/dir1/dir2/sibling.html.md',
            renderPath: 'hier-broke/dir1/dir2/sibling.html',
            vpath: 'hier-broke/dir1/dir2/sibling.html.md'
        },
        {
            fspath: '**/documents/hier/index.html.md',
            renderPath: 'hier/index.html',
            vpath: 'hier/index.html.md'
        },
        {
            fspath: '**/documents/hier/imgdir/index.html.md',
            renderPath: 'hier/imgdir/index.html',
            vpath: 'hier/imgdir/index.html.md'
        },
        {
            fspath: '**/documents/hier/imgdir/img/tesla-nema.jpg',
            renderPath: 'hier/imgdir/img/tesla-nema.jpg',
            vpath: 'hier/imgdir/img/tesla-nema.jpg'
        },
        {
            fspath: '**/documents/hier/dir1/index.html.md',
            renderPath: 'hier/dir1/index.html',
            vpath: 'hier/dir1/index.html.md'
        },
        {
            fspath: '**/documents/hier/dir1/sibling.html.md',
            renderPath: 'hier/dir1/sibling.html',
            vpath: 'hier/dir1/sibling.html.md'
        },
        {
            fspath: '**/documents/hier/dir1/dir2/index.html.md',
            renderPath: 'hier/dir1/dir2/index.html',
            vpath: 'hier/dir1/dir2/index.html.md'
        },
        {
            fspath: '**/documents/hier/dir1/dir2/nested-anchor.html.md',
            renderPath: 'hier/dir1/dir2/nested-anchor.html',
            vpath: 'hier/dir1/dir2/nested-anchor.html.md'
        },
        {
            fspath: '**/documents/hier/dir1/dir2/nested-img-resize.html.md',
            renderPath: 'hier/dir1/dir2/nested-img-resize.html',
            vpath: 'hier/dir1/dir2/nested-img-resize.html.md'
        },
        {
            fspath: '**/documents/hier/dir1/dir2/sibling.html.md',
            renderPath: 'hier/dir1/dir2/sibling.html',
            vpath: 'hier/dir1/dir2/sibling.html.md'
        },
        {
            fspath: '**/documents/code/foo.css',
            renderPath: 'code/foo.css',
            vpath: 'code/foo.css'
        },
        {
            fspath: '**/documents/code/foo.js',
            renderPath: 'code/foo.js',
            vpath: 'code/foo.js'
        }
    ];

    it('should find only allowed document paths', async function() {
        this.timeout(75000);
        const documents = (await akasha.filecache).documents;
        await documents.isReady();

        let found = filecache.documents.paths();

        assert.isDefined(found);
        assert.isArray(found);

        for (let pathinfo of found) {
            assert.isTrue(isPathAllowed(pathinfo, allowed_paths), util.inspect(pathinfo));
        }
    });

    it('should find /index.html.md', function() {
        let found = filecache.documents.find('/index.html.md');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'index.html.md');
        assert.equal(found.vpath, 'index.html.md');
        assert.equal(found.renderPath, 'index.html');
    });

    it('should find index.html.md', function() {
        let found = filecache.documents.find('index.html.md');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'index.html.md');
        assert.equal(found.vpath, 'index.html.md');
        assert.equal(found.renderPath, 'index.html');
    });

    it('should find index.html', function() {
        let found = filecache.documents.find('index.html');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'index.html.md');
        assert.equal(found.vpath, 'index.html.md');
        assert.equal(found.renderPath, 'index.html');
    });
    
    it('should find /subdir/show-content-local.html', function() {
        let found = filecache.documents.find('/subdir/show-content-local.html');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'subdir/show-content-local.html.md');
        assert.equal(found.vpath, 'subdir/show-content-local.html.md');
        assert.equal(found.renderPath, 'subdir/show-content-local.html');
    });
    
    it('should find subdir/show-content-local.html.md', function() {
        let found = filecache.documents.find('/subdir/show-content-local.html.md');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'subdir/show-content-local.html.md');
        assert.equal(found.vpath, 'subdir/show-content-local.html.md');
        assert.equal(found.renderPath, 'subdir/show-content-local.html');
    });
    
    it('should find /mounted/img2resize.html.md', function() {
        let found = filecache.documents.find('/mounted/img2resize.html.md');

        // console.log(found);
        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.include(found.mounted, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInMounted, 'img2resize.html.md');
        assert.equal(found.vpath, 'mounted/img2resize.html.md');
        assert.equal(found.renderPath, 'mounted/img2resize.html');
    });
    
    it('should find mounted/img2resize.html', function() {
        let found = filecache.documents.find('mounted/img2resize.html');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.include(found.mounted, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInMounted, 'img2resize.html.md');
        assert.equal(found.vpath, 'mounted/img2resize.html.md');
        assert.equal(found.renderPath, 'mounted/img2resize.html');
    });
    
    it('should find /mounted/img/Human-Skeleton.jpg', function() {
        let found = filecache.documents.find('/mounted/img/Human-Skeleton.jpg');

        assert.isDefined(found);
        assert.equal(found.mime, 'image/jpeg');
        assert.include(found.mounted, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInMounted, 'img/Human-Skeleton.jpg');
        assert.equal(found.vpath, 'mounted/img/Human-Skeleton.jpg');
        assert.equal(found.renderPath, 'mounted/img/Human-Skeleton.jpg');
    });
    
    it('should find mounted/img/Human-Skeleton.jpg', function() {
        let found = filecache.documents.find('mounted/img/Human-Skeleton.jpg');

        // console.log(found);
        assert.isDefined(found);
        assert.equal(found.mime, 'image/jpeg');
        assert.include(found.mounted, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInMounted, 'img/Human-Skeleton.jpg');
        assert.equal(found.vpath, 'mounted/img/Human-Skeleton.jpg');
        assert.equal(found.renderPath, 'mounted/img/Human-Skeleton.jpg');
    });
    
    it('should not find mounted/unknown-Skeleton.jpg', function() {
        let found = filecache.documents.find('mounted/unknown-Skeleton.jpg');

        assert.isUndefined(found);
    });

    it('should not find /mounted/unknown-Skeleton.jpg', function() {
        let found = filecache.documents.find('/mounted/unknown-Skeleton.jpg');

        assert.isUndefined(found);
    });
    
    it('should not find unknown-Skeleton.jpg', function() {
        let found = filecache.documents.find('unknown-Skeleton.jpg');

        assert.isUndefined(found);
    });

    it('should not find /unknown-Skeleton.jpg', function() {
        let found = filecache.documents.find('/unknown-Skeleton.jpg');

        assert.isUndefined(found);
    });

});

describe('Layouts cache', function() {
    const allowed_paths = [
        {
            fspath: '**/layouts-extra/inclusion2.html',
            renderPath: 'inclusion2.html',
            vpath: 'inclusion2.html'
        },
        {
            fspath: '**/layouts-extra/njkincl.html.njk',
            renderPath: 'njkincl.html.njk',
            vpath: 'njkincl.html.njk'
        },
        {
            fspath: '**/layouts/ak_core_macros.njk',
            renderPath: 'ak_core_macros.njk',
            vpath: 'ak_core_macros.njk'
        },
        {
            fspath: '**/layouts/default-once.html.ejs',
            renderPath: 'default-once.html.ejs',
            vpath: 'default-once.html.ejs'
        },
        {
            fspath: '**/layouts/default-once.html.handlebars',
            renderPath: 'default-once.html.handlebars',
            vpath: 'default-once.html.handlebars'
        },
        {
            fspath: '**/layouts/default-once.html.liquid',
            renderPath: 'default-once.html.liquid',
            vpath: 'default-once.html.liquid'
        },
        {
            fspath: '**/layouts/default-once.html.njk',
            renderPath: 'default-once.html.njk',
            vpath: 'default-once.html.njk'
        },
        {
            fspath: '**/layouts/default.html.ejs',
            renderPath: 'default.html.ejs',
            vpath: 'default.html.ejs'
        },
        {
            fspath: '**/layouts/inclusion.html',
            renderPath: 'inclusion.html',
            vpath: 'inclusion.html'
        },
        {
            fspath: '**/layouts/njk-funcs.html.njk',
            renderPath: 'njk-funcs.html.njk',
            vpath: 'njk-funcs.html.njk'
        },
        {
            fspath: '**/layouts/njkincl.html.njk',
            renderPath: 'njkincl.html.njk',
            vpath: 'njkincl.html.njk'
        }
    ];

    it('should find only allowed layouts paths', async function() {
        const layouts = (await akasha.filecache).layouts;
        await layouts.isReady();

        let found = filecache.layouts.paths();

        assert.isDefined(found);
        assert.isArray(found);

        for (let pathinfo of found) {
            assert.isTrue(isPathAllowed(pathinfo, allowed_paths), util.inspect(pathinfo));
        }
    });

    it('should find njkincl.html.njk', function() {
        let found = filecache.layouts.find('njkincl.html.njk');

        assert.isDefined(found);
        // No MIME type available assert.equal(found.mime, 'text/html');
        assert.include(found.mounted, 'layouts-extra');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'njkincl.html.njk');
        assert.equal(found.vpath, 'njkincl.html.njk');
        assert.equal(found.renderPath, 'njkincl.html.njk');
    });
});

describe('Partials cache', function() {
    const allowed_paths = [
        {
            fspath: '**/partials2/helloworld.html',
            renderPath: 'helloworld.html',
            vpath: 'helloworld.html'
        },
        {
            fspath: '**/partials2/helloworld2.html',
            renderPath: 'helloworld2.html',
            vpath: 'helloworld2.html'
        },
        {
            fspath: '**/partials2/json-format.html.ejs',
            renderPath: 'json-format.html.ejs',
            vpath: 'json-format.html.ejs'
        },
        {
            fspath: '**/partials2/listrender.html.ejs',
            renderPath: 'listrender.html.ejs',
            vpath: 'listrender.html.ejs'
        },
        {
            fspath: '**/partials2/listrender.html.handlebars',
            renderPath: 'listrender.html.handlebars',
            vpath: 'listrender.html.handlebars'
        },
        {
            fspath: '**/partials2/strong.html.ejs',
            renderPath: 'strong.html.ejs',
            vpath: 'strong.html.ejs'
        },
        {
            fspath: '**/partials2/strong.html.handlebars',
            renderPath: 'strong.html.handlebars',
            vpath: 'strong.html.handlebars'
        },
        {
            fspath: '**/partials2/test.html.njk',
            renderPath: 'test.html.njk',
            vpath: 'test.html.njk'
        },
        {
            fspath: '**/partials/ak_figimg.html.ejs',
            renderPath: 'ak_figimg.html.ejs',
            vpath: 'ak_figimg.html.ejs'
        },
        {
            fspath: '**/partials/ak_figimg.html.handlebars',
            renderPath: 'ak_figimg.html.handlebars',
            vpath: 'ak_figimg.html.handlebars'
        },
        {
            fspath: '**/partials/ak_figimg.html.njk',
            renderPath: 'ak_figimg.html.njk',
            vpath: 'ak_figimg.html.njk'
        },
        {
            fspath: '**/partials/ak_show-content-card.html.ejs',
            renderPath: 'ak_show-content-card.html.ejs',
            vpath: 'ak_show-content-card.html.ejs'
        },
        {
            fspath: '**/partials/ak_show-content.html.ejs',
            renderPath: 'ak_show-content.html.ejs',
            vpath: 'ak_show-content.html.ejs'
        },
        {
            fspath: '**/partials/ak_show-content.html.handlebars',
            renderPath: 'ak_show-content.html.handlebars',
            vpath: 'ak_show-content.html.handlebars'
        },
        {
            fspath: '**/partials/ak_show-content.html.njk',
            renderPath: 'ak_show-content.html.njk',
            vpath: 'ak_show-content.html.njk'
        },
        {
            fspath: '**/partials/ak_teaser.html.ejs',
            renderPath: 'ak_teaser.html.ejs',
            vpath: 'ak_teaser.html.ejs'
        }
    ];

    it('should find only allowed partial paths', async function() {
        const partials = (await akasha.filecache).partials;
        await partials.isReady();

        let found = filecache.partials.paths();

        assert.isDefined(found);
        assert.isArray(found);

        for (let pathinfo of found) {
            assert.isTrue(isPathAllowed(pathinfo, allowed_paths), util.inspect(pathinfo));
        }
    });

    it('should find helloworld.html', function() {
        let found = filecache.partials.find('helloworld.html');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/html');
        assert.include(found.mounted, 'partials2');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'helloworld.html');
        assert.equal(found.vpath, 'helloworld.html');
        assert.equal(found.renderPath, 'helloworld.html');
    });
});

describe('Assets cache', function() {
    const allowed_paths = [
        {
            fspath: '**/assets2/file.txt',
            renderPath: 'file.txt',
            vpath: 'file.txt'
        },
        {
            fspath: '**/assets/rss_button.png',
            renderPath: 'rss_button.png',
            vpath: 'rss_button.png'
        }
    ];

    it('should find only allowed assets paths', async function() {
        const assets = (await akasha.filecache).assets;
        await assets.isReady();

        let found = filecache.assets.paths();

        assert.isDefined(found);
        assert.isArray(found);

        for (let pathinfo of found) {
            assert.isTrue(isPathAllowed(pathinfo, allowed_paths), util.inspect(pathinfo));
        }
    });

    it('should find rss_button.png', function() {
        let found = filecache.assets.find('rss_button.png');

        assert.isDefined(found);
        assert.equal(found.mime, 'image/png');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'rss_button.png');
        assert.equal(found.vpath, 'rss_button.png');
        assert.equal(found.renderPath, 'rss_button.png');
    });

    it('should find file.txt', function() {
        let found = filecache.assets.find('file.txt');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/plain');
        assert.include(found.mounted, 'assets2');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'file.txt');
        assert.equal(found.vpath, 'file.txt');
        assert.equal(found.renderPath, 'file.txt');
    });
});

describe('Search', function() {
    it('should select by rootPath', function() {
        let found = filecache.assets.search(config, {
            rootPath: 'hier/dir1'
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.equal(doc.path.indexOf('hier/dir1'), 0);
        }
    });

    it('should select by pathmatch string', function() {
        let found = filecache.assets.search(config, {
            pathmatch: '.jpg$'
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.isOk(doc.path.match(/\.jpg$/));
        }
    });

    it('should select by pathmatch RegExp', function() {
        let found = filecache.assets.search(config, {
            pathmatch: /.json$/
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.isOk(doc.path.match(/\.json$/));
        }
    });

    it('should select by renderpathmatch string', function() {
        let found = filecache.assets.search(config, {
            renderpathmatch: '.html$'
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.isOk(doc.renderPath.match(/\.html$/));
        }
    });

    it('should select by renderpathmatch RegExp', function() {
        let found = filecache.assets.search(config, {
            renderpathmatch: /.html$/
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.isOk(doc.renderPath.match(/\.html$/));
        }
    });

    it('should select by GLOB', function() {
        let found = filecache.assets.search(config, {
            glob: '**/*.json'
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.isOk(doc.path.match(/\.json$/));
        }
    });

    it('should select renderPath by GLOB', function() {
        let found = filecache.assets.search(config, {
            renderglob: '**/*.html'
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.isOk(doc.renderPath.match(/\.html$/));
        }
    });

    it('should select by MIME', function() {
        let found = filecache.assets.search(config, {
            mime: 'image/jpeg'
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.equal(doc.mime, "image/jpeg");
        }
    });

    it('should select by layout string', function() {
        let found = filecache.assets.search(config, {
            layouts: 'default-once.html.liquid'
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.isDefined(doc.docMetadata);
            assert.isDefined(doc.docMetadata.layout);
            assert.equal(doc.docMetadata.layout, 'default-once.html.liquid');
        }
    });

    it('should select by layout array', function() {
        let found = filecache.assets.search(config, {
            layouts: [ 'default-once.html.liquid', 'default-once.html.njk' ]
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.isDefined(doc.docMetadata);
            assert.isDefined(doc.docMetadata.layout);
            assert.match(doc.docMetadata.layout,
                /default-once.html.liquid|default-once.html.njk/ );
        }
    });

    it('should select by renderer', function() {
        let found = filecache.assets.search(config, {
            renderers: [ akasha.HTMLRenderer ]
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.isDefined(doc.docMetadata);
            assert.isDefined(doc.docMetadata.layout);
            assert.match(doc.path,
                /.html.md$|.html.adoc$|.html.json$|.html.handlebars|.html.liquid$|.html.njk$/ );
        }
    });

    it('should select by custom function', function() {
        let found = filecache.assets.search(config, {
            filterfunc: (config, options, doc) => {
                return doc.isDirectory === false
                    && doc.mountPoint === 'mounted'
            }
        });

        assert.isDefined(found);
        assert.isArray(found);
        for (let doc of found) {
            assert.isFalse(doc.isDirectory);
            assert.match(doc.path, /^mounted\// );
        }
    });



});

describe('Close caches', function() {

    it('should close caches', async function() {
        try {
            await akasha.closeCaches();
        } catch (e) {
            console.error(e);
            throw e;
        }
    });
});