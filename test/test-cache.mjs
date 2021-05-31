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
            await config.setup();
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    it('should successfully setup file caches', async function() {
        try {
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
            && pathinfo.path === allowed.path) {
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
            path: 'mounted/img2resize.html.md'
        },
        {
            fspath: '**/documents/anchor-cleanups-handlebars.html.md',
            renderPath: 'anchor-cleanups-handlebars.html',
            path: 'anchor-cleanups-handlebars.html.md'
        },
        {
            fspath: '**/documents/anchor-cleanups-liquid.html.md',
            renderPath: 'anchor-cleanups-liquid.html',
            path: 'anchor-cleanups-liquid.html.md'
        },
        {
            fspath: '**/documents/anchor-cleanups-nunjucks.html.md',
            renderPath: 'anchor-cleanups-nunjucks.html',
            path: 'anchor-cleanups-nunjucks.html.md'
        },
        {
            fspath: '**/documents/anchor-cleanups.html.md',
            renderPath: 'anchor-cleanups.html',
            path: 'anchor-cleanups.html.md'
        },
        {
            fspath: '**/documents/asciidoctor-handlebars.html.adoc',
            renderPath: 'asciidoctor-handlebars.html',
            path: 'asciidoctor-handlebars.html.adoc'
        },
        {
            fspath: '**/documents/asciidoctor-liquid.html.adoc',
            renderPath: 'asciidoctor-liquid.html',
            path: 'asciidoctor-liquid.html.adoc'
        },
        {
            fspath: '**/documents/asciidoctor-nunjucks.html.adoc',
            renderPath: 'asciidoctor-nunjucks.html',
            path: 'asciidoctor-nunjucks.html.adoc'
        },
        {
            fspath: '**/documents/asciidoctor.html.adoc',
            renderPath: 'asciidoctor.html',
            path: 'asciidoctor.html.adoc'
        },
        {
            fspath: '**/documents/body-class-handlebars.html.md',
            renderPath: 'body-class-handlebars.html',
            path: 'body-class-handlebars.html.md'
        },
        {
            fspath: '**/documents/body-class-liquid.html.md',
            renderPath: 'body-class-liquid.html',
            path: 'body-class-liquid.html.md'
        },
        {
            fspath: '**/documents/body-class-nunjucks.html.md',
            renderPath: 'body-class-nunjucks.html',
            path: 'body-class-nunjucks.html.md'
        },
        {
            fspath: '**/documents/body-class.html.md',
            renderPath: 'body-class.html',
            path: 'body-class.html.md'
        },
        {
            fspath: '**/documents/code-embed-handlebars.html.md',
            renderPath: 'code-embed-handlebars.html',
            path: 'code-embed-handlebars.html.md'
        },
        {
            fspath: '**/documents/code-embed-liquid.html.md',
            renderPath: 'code-embed-liquid.html',
            path: 'code-embed-liquid.html.md'
        },
        {
            fspath: '**/documents/code-embed-nunjucks.html.md',
            renderPath: 'code-embed-nunjucks.html',
            path: 'code-embed-nunjucks.html.md'
        },
        {
            fspath: '**/documents/code-embed.html.md',
            renderPath: 'code-embed.html',
            path: 'code-embed.html.md'
        },
        {
            fspath: '**/documents/fig-img-handlebars.html.md',
            renderPath: 'fig-img-handlebars.html',
            path: 'fig-img-handlebars.html.md'
        },
        {
            fspath: '**/documents/fig-img-liquid.html.md',
            renderPath: 'fig-img-liquid.html',
            path: 'fig-img-liquid.html.md'
        },
        {
            fspath: '**/documents/fig-img-nunjucks.html.md',
            renderPath: 'fig-img-nunjucks.html',
            path: 'fig-img-nunjucks.html.md'
        },
        {
            fspath: '**/documents/fig-img.html.md',
            renderPath: 'fig-img.html',
            path: 'fig-img.html.md'
        },
        {
            fspath: '**/documents/img2figimg-handlebars.html.md',
            renderPath: 'img2figimg-handlebars.html',
            path: 'img2figimg-handlebars.html.md'
        },
        {
            fspath: '**/documents/img2figimg-liquid.html.md',
            renderPath: 'img2figimg-liquid.html',
            path: 'img2figimg-liquid.html.md'
        },
        {
            fspath: '**/documents/img2figimg-nunjucks.html.md',
            renderPath: 'img2figimg-nunjucks.html',
            path: 'img2figimg-nunjucks.html.md'
        },
        {
            fspath: '**/documents/img2figimg.html.md',
            renderPath: 'img2figimg.html',
            path: 'img2figimg.html.md'
        },
        {
            fspath: '**/documents/img2resize-handlebars.html.md',
            renderPath: 'img2resize-handlebars.html',
            path: 'img2resize-handlebars.html.md'
        },
        {
            fspath: '**/documents/img2resize-liquid.html.md',
            renderPath: 'img2resize-liquid.html',
            path: 'img2resize-liquid.html.md'
        },
        {
            fspath: '**/documents/img2resize-nunjucks.html.md',
            renderPath: 'img2resize-nunjucks.html',
            path: 'img2resize-nunjucks.html.md'
        },
        {
            fspath: '**/documents/img2resize.html.md',
            renderPath: 'img2resize.html',
            path: 'img2resize.html.md'
        },
        {
            fspath: '**/documents/index.html.md',
            renderPath: 'index.html',
            path: 'index.html.md'
        },
        {
            fspath: '**/documents/json-data-handlebars.html.json',
            renderPath: 'json-data-handlebars.html',
            path: 'json-data-handlebars.html.json'
        },
        {
            fspath: '**/documents/json-data-liquid.html.json',
            renderPath: 'json-data-liquid.html',
            path: 'json-data-liquid.html.json'
        },
        {
            fspath: '**/documents/json-data-nunjucks.html.json',
            renderPath: 'json-data-nunjucks.html',
            path: 'json-data-nunjucks.html.json'
        },
        {
            fspath: '**/documents/json-data.html.json',
            renderPath: 'json-data.html',
            path: 'json-data.html.json'
        },
        {
            fspath: '**/documents/metadata-style-javascript.html.md',
            renderPath: 'metadata-style-javascript.html',
            path: 'metadata-style-javascript.html.md'
        },
        {
            fspath: '**/documents/njk-func.html.md',
            renderPath: 'njk-func.html',
            path: 'njk-func.html.md'
        },
        {
            fspath: '**/documents/njk-incl.html.md',
            renderPath: 'njk-incl.html',
            path: 'njk-incl.html.md'
        },
        {
            fspath: '**/documents/partials-handlebars.html.handlebars',
            renderPath: 'partials-handlebars.html',
            path: 'partials-handlebars.html.handlebars'
        },
        {
            fspath: '**/documents/partials-liquid.html.liquid',
            renderPath: 'partials-liquid.html',
            path: 'partials-liquid.html.liquid'
        },
        {
            fspath: '**/documents/partials-nunjucks.html.njk',
            renderPath: 'partials-nunjucks.html',
            path: 'partials-nunjucks.html.njk'
        },
        {
            fspath: '**/documents/partials.html.md',
            renderPath: 'partials.html',
            path: 'partials.html.md'
        },
        {
            fspath: '**/documents/select-elements.html.md',
            renderPath: 'select-elements.html',
            path: 'select-elements.html.md'
        },
        {
            fspath: '**/documents/show-content-handlebars.html.md',
            renderPath: 'show-content-handlebars.html',
            path: 'show-content-handlebars.html.md'
        },
        {
            fspath: '**/documents/show-content-liquid.html.md',
            renderPath: 'show-content-liquid.html',
            path: 'show-content-liquid.html.md'
        },
        {
            fspath: '**/documents/show-content-nunjucks.html.md',
            renderPath: 'show-content-nunjucks.html',
            path: 'show-content-nunjucks.html.md'
        },
        {
            fspath: '**/documents/show-content.html.md',
            renderPath: 'show-content.html',
            path: 'show-content.html.md'
        },
        {
            fspath: '**/documents/shown-content.html.md',
            renderPath: 'shown-content.html',
            path: 'shown-content.html.md'
        },
        {
            fspath: '**/documents/simple-style-javascript.html.md',
            renderPath: 'simple-style-javascript.html',
            path: 'simple-style-javascript.html.md'
        },
        {
            fspath: '**/documents/teaser-content.html.md',
            renderPath: 'teaser-content.html',
            path: 'teaser-content.html.md'
        },
        {
            fspath: '**/mounted2/img/Human-Skeleton.jpg',
            renderPath: 'mounted/img/Human-Skeleton.jpg',
            path: 'mounted/img/Human-Skeleton.jpg'
        },
        {
            fspath: '**/documents/subdir/index.html.md',
            renderPath: 'subdir/index.html',
            path: 'subdir/index.html.md'
        },
        {
            fspath: '**/documents/subdir/show-content-local.html.md',
            renderPath: 'subdir/show-content-local.html',
            path: 'subdir/show-content-local.html.md'
        },
        {
            fspath: '**/documents/subdir/shown-content-local.html.md',
            renderPath: 'subdir/shown-content-local.html',
            path: 'subdir/shown-content-local.html.md'
        },
        {
            fspath: '**/documents/img/Human-Skeleton.jpg',
            renderPath: 'img/Human-Skeleton.jpg',
            path: 'img/Human-Skeleton.jpg'
        },
        {
            fspath: '**/documents/hier-broke/dir1/sibling.html.md',
            renderPath: 'hier-broke/dir1/sibling.html',
            path: 'hier-broke/dir1/sibling.html.md'
        },
        {
            fspath: '**/documents/hier-broke/dir1/dir2/index.html.md',
            renderPath: 'hier-broke/dir1/dir2/index.html',
            path: 'hier-broke/dir1/dir2/index.html.md'
        },
        {
            fspath: '**/documents/hier-broke/dir1/dir2/sibling.html.md',
            renderPath: 'hier-broke/dir1/dir2/sibling.html',
            path: 'hier-broke/dir1/dir2/sibling.html.md'
        },
        {
            fspath: '**/documents/hier/index.html.md',
            renderPath: 'hier/index.html',
            path: 'hier/index.html.md'
        },
        {
            fspath: '**/documents/hier/imgdir/index.html.md',
            renderPath: 'hier/imgdir/index.html',
            path: 'hier/imgdir/index.html.md'
        },
        {
            fspath: '**/documents/hier/imgdir/img/tesla-nema.jpg',
            renderPath: 'hier/imgdir/img/tesla-nema.jpg',
            path: 'hier/imgdir/img/tesla-nema.jpg'
        },
        {
            fspath: '**/documents/hier/dir1/index.html.md',
            renderPath: 'hier/dir1/index.html',
            path: 'hier/dir1/index.html.md'
        },
        {
            fspath: '**/documents/hier/dir1/sibling.html.md',
            renderPath: 'hier/dir1/sibling.html',
            path: 'hier/dir1/sibling.html.md'
        },
        {
            fspath: '**/documents/hier/dir1/dir2/index.html.md',
            renderPath: 'hier/dir1/dir2/index.html',
            path: 'hier/dir1/dir2/index.html.md'
        },
        {
            fspath: '**/documents/hier/dir1/dir2/nested-anchor.html.md',
            renderPath: 'hier/dir1/dir2/nested-anchor.html',
            path: 'hier/dir1/dir2/nested-anchor.html.md'
        },
        {
            fspath: '**/documents/hier/dir1/dir2/nested-img-resize.html.md',
            renderPath: 'hier/dir1/dir2/nested-img-resize.html',
            path: 'hier/dir1/dir2/nested-img-resize.html.md'
        },
        {
            fspath: '**/documents/hier/dir1/dir2/sibling.html.md',
            renderPath: 'hier/dir1/dir2/sibling.html',
            path: 'hier/dir1/dir2/sibling.html.md'
        },
        {
            fspath: '**/documents/code/foo.css',
            renderPath: 'code/foo.css',
            path: 'code/foo.css'
        },
        {
            fspath: '**/documents/code/foo.js',
            renderPath: 'code/foo.js',
            path: 'code/foo.js'
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
        assert.equal(found.pathInSource, 'index.html.md');
        assert.equal(found.path, 'index.html.md');
        assert.equal(found.renderPath, 'index.html');
    });

    it('should find index.html.md', function() {
        let found = filecache.documents.find('index.html.md');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInSource, 'index.html.md');
        assert.equal(found.path, 'index.html.md');
        assert.equal(found.renderPath, 'index.html');
    });

    it('should find index.html', function() {
        let found = filecache.documents.find('index.html');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInSource, 'index.html.md');
        assert.equal(found.path, 'index.html.md');
        assert.equal(found.renderPath, 'index.html');
    });
    
    it('should find /subdir/show-content-local.html', function() {
        let found = filecache.documents.find('/subdir/show-content-local.html');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInSource, 'subdir/show-content-local.html.md');
        assert.equal(found.path, 'subdir/show-content-local.html.md');
        assert.equal(found.renderPath, 'subdir/show-content-local.html');
    });
    
    it('should find subdir/show-content-local.html.md', function() {
        let found = filecache.documents.find('/subdir/show-content-local.html.md');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInSource, 'subdir/show-content-local.html.md');
        assert.equal(found.path, 'subdir/show-content-local.html.md');
        assert.equal(found.renderPath, 'subdir/show-content-local.html');
    });
    
    it('should find /mounted/img2resize.html.md', function() {
        let found = filecache.documents.find('/mounted/img2resize.html.md');

        // console.log(found);
        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.include(found.sourcePath, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInSource, 'img2resize.html.md');
        assert.equal(found.path, 'mounted/img2resize.html.md');
        assert.equal(found.renderPath, 'mounted/img2resize.html');
    });
    
    it('should find mounted/img2resize.html', function() {
        let found = filecache.documents.find('mounted/img2resize.html');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.include(found.sourcePath, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInSource, 'img2resize.html.md');
        assert.equal(found.path, 'mounted/img2resize.html.md');
        assert.equal(found.renderPath, 'mounted/img2resize.html');
    });
    
    it('should find /mounted/img/Human-Skeleton.jpg', function() {
        let found = filecache.documents.find('/mounted/img/Human-Skeleton.jpg');

        assert.isDefined(found);
        assert.equal(found.mime, 'image/jpeg');
        assert.include(found.sourcePath, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInSource, 'img/Human-Skeleton.jpg');
        assert.equal(found.path, 'mounted/img/Human-Skeleton.jpg');
        assert.equal(found.renderPath, 'mounted/img/Human-Skeleton.jpg');
    });
    
    it('should find mounted/img/Human-Skeleton.jpg', function() {
        let found = filecache.documents.find('mounted/img/Human-Skeleton.jpg');

        // console.log(found);
        assert.isDefined(found);
        assert.equal(found.mime, 'image/jpeg');
        assert.include(found.sourcePath, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInSource, 'img/Human-Skeleton.jpg');
        assert.equal(found.path, 'mounted/img/Human-Skeleton.jpg');
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
            path: 'inclusion2.html'
        },
        {
            fspath: '**/layouts-extra/njkincl.html.njk',
            renderPath: 'njkincl.html.njk',
            path: 'njkincl.html.njk'
        },
        {
            fspath: '**/layouts/ak_core_macros.njk',
            renderPath: 'ak_core_macros.njk',
            path: 'ak_core_macros.njk'
        },
        {
            fspath: '**/layouts/default-once.html.ejs',
            renderPath: 'default-once.html.ejs',
            path: 'default-once.html.ejs'
        },
        {
            fspath: '**/layouts/default-once.html.handlebars',
            renderPath: 'default-once.html.handlebars',
            path: 'default-once.html.handlebars'
        },
        {
            fspath: '**/layouts/default-once.html.liquid',
            renderPath: 'default-once.html.liquid',
            path: 'default-once.html.liquid'
        },
        {
            fspath: '**/layouts/default-once.html.njk',
            renderPath: 'default-once.html.njk',
            path: 'default-once.html.njk'
        },
        {
            fspath: '**/layouts/default.html.ejs',
            renderPath: 'default.html.ejs',
            path: 'default.html.ejs'
        },
        {
            fspath: '**/layouts/inclusion.html',
            renderPath: 'inclusion.html',
            path: 'inclusion.html'
        },
        {
            fspath: '**/layouts/njk-funcs.html.njk',
            renderPath: 'njk-funcs.html.njk',
            path: 'njk-funcs.html.njk'
        },
        {
            fspath: '**/layouts/njkincl.html.njk',
            renderPath: 'njkincl.html.njk',
            path: 'njkincl.html.njk'
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
        assert.include(found.sourcePath, 'layouts-extra');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInSource, 'njkincl.html.njk');
        assert.equal(found.path, 'njkincl.html.njk');
        assert.equal(found.renderPath, 'njkincl.html.njk');
    });
});

describe('Partials cache', function() {
    const allowed_paths = [
        {
            fspath: '**/partials2/helloworld.html',
            renderPath: 'helloworld.html',
            path: 'helloworld.html'
        },
        {
            fspath: '**/partials2/helloworld2.html',
            renderPath: 'helloworld2.html',
            path: 'helloworld2.html'
        },
        {
            fspath: '**/partials2/json-format.html.ejs',
            renderPath: 'json-format.html.ejs',
            path: 'json-format.html.ejs'
        },
        {
            fspath: '**/partials2/listrender.html.ejs',
            renderPath: 'listrender.html.ejs',
            path: 'listrender.html.ejs'
        },
        {
            fspath: '**/partials2/listrender.html.handlebars',
            renderPath: 'listrender.html.handlebars',
            path: 'listrender.html.handlebars'
        },
        {
            fspath: '**/partials2/strong.html.ejs',
            renderPath: 'strong.html.ejs',
            path: 'strong.html.ejs'
        },
        {
            fspath: '**/partials2/strong.html.handlebars',
            renderPath: 'strong.html.handlebars',
            path: 'strong.html.handlebars'
        },
        {
            fspath: '**/partials2/test.html.njk',
            renderPath: 'test.html.njk',
            path: 'test.html.njk'
        },
        {
            fspath: '**/partials/ak_figimg.html.ejs',
            renderPath: 'ak_figimg.html.ejs',
            path: 'ak_figimg.html.ejs'
        },
        {
            fspath: '**/partials/ak_figimg.html.handlebars',
            renderPath: 'ak_figimg.html.handlebars',
            path: 'ak_figimg.html.handlebars'
        },
        {
            fspath: '**/partials/ak_figimg.html.njk',
            renderPath: 'ak_figimg.html.njk',
            path: 'ak_figimg.html.njk'
        },
        {
            fspath: '**/partials/ak_show-content-card.html.ejs',
            renderPath: 'ak_show-content-card.html.ejs',
            path: 'ak_show-content-card.html.ejs'
        },
        {
            fspath: '**/partials/ak_show-content.html.ejs',
            renderPath: 'ak_show-content.html.ejs',
            path: 'ak_show-content.html.ejs'
        },
        {
            fspath: '**/partials/ak_show-content.html.handlebars',
            renderPath: 'ak_show-content.html.handlebars',
            path: 'ak_show-content.html.handlebars'
        },
        {
            fspath: '**/partials/ak_show-content.html.njk',
            renderPath: 'ak_show-content.html.njk',
            path: 'ak_show-content.html.njk'
        },
        {
            fspath: '**/partials/ak_teaser.html.ejs',
            renderPath: 'ak_teaser.html.ejs',
            path: 'ak_teaser.html.ejs'
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
        assert.include(found.sourcePath, 'partials2');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInSource, 'helloworld.html');
        assert.equal(found.path, 'helloworld.html');
        assert.equal(found.renderPath, 'helloworld.html');
    });
});

describe('Assets cache', function() {
    const allowed_paths = [
        {
            fspath: '**/assets2/file.txt',
            renderPath: 'file.txt',
            path: 'file.txt'
        },
        {
            fspath: '**/assets/rss_button.png',
            renderPath: 'rss_button.png',
            path: 'rss_button.png'
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
        assert.equal(found.pathInSource, 'rss_button.png');
        assert.equal(found.path, 'rss_button.png');
        assert.equal(found.renderPath, 'rss_button.png');
    });

    it('should find file.txt', function() {
        let found = filecache.assets.find('file.txt');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/plain');
        assert.include(found.sourcePath, 'assets2');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInSource, 'file.txt');
        assert.equal(found.path, 'file.txt');
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
            await config.close();
        } catch (e) {
            console.error(e);
            throw e;
        }
    });
});