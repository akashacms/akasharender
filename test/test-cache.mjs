import util   from 'util';
import path   from 'path';
import fse    from 'fs-extra';
import akasha from '../index.js';
import * as cache from '../cache-forerunner.mjs';
import Chai   from 'chai';
const assert = Chai.assert;

// See https://techsparx.com/nodejs/esnext/dirname-es-modules.html
const moduleURL = new URL(import.meta.url);
const __dirname = path.dirname(moduleURL.pathname);

let config;
const cachenm = 'test';

describe('Initialize cache test configuration', function() {
    it('should successfully configure test site', async function() {
        try {
            this.timeout(25000);
            config = new akasha.Configuration();
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
            await cache.setup(config);
            // await cache.save();
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
});

describe('Test cache', function() {

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

