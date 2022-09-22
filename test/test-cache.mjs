import util   from 'util';
import path   from 'path';
import { promises as fsp } from 'fs';
import akasha from '../index.js';
import * as filecache from '../cache/file-cache-lokijs.mjs';
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
            await fsp.rm(config.cacheDir, {
                recursive: true
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    it('should successfully setup cache database', async function() {
        try {
            await akasha.setup(config);
            // await akasha.fileCachesReady(config);
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    /*
    it('should successfully setup file caches', async function() {
        this.timeout(75000);
        try {
            /* await Promise.all([
                akasha.setupDocuments(config),
                akasha.setupAssets(config),
                akasha.setupLayouts(config),
                akasha.setupPartials(config)
            ]); * /
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
    */

});

/*
 * The issue behind these tests had to do with:
 *   1) Running multiple suites in a row
 *   2) Some suites using `ignore` clauses, and others not
 *   3) The configuration using autosave/autoload
 * 
 * In that scenario - one suite not using `ignore` clauses will
 * load data for files which other suites say to ignore because
 * of `ignore` clauses.  If the cache is autosaved, then autoloaded,
 * the cache then has files in it that some suites will say to
 * ignore.
 * 
 * The purpose of this section is to test when the cache has
 * items it would not normally have.  In the normal case, the ignore
 * clause makes StackedDirs ignore certain files, and avoid emitting
 * events for matching file info objects.  But in the case of
 * sometimes having ignore clauses, and other times not, then an
 * autosaved cache will have file info objects for files it should 
 * ignore.
 * 
 * The solution is for the FileCache to also check if files are to
 * be ignored and to prevent telling the application about files
 * covered by the ignore clauses.
 * 
 * Such an application can use getCollection() to access the underlying
 * collection object, if desired, and bypass the checks for files
 * that should be ignored. 
 *
 */

describe('Disallowed files', function() {

    // Somehow files which are supposed to be ignored have
    // made it into the documents cache
    it('should not find files which should be ignored', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        for (const info of documents.getCollection().find()) {
            assert.isFalse(filecache.documents.ignoreFile(info),
                `Found file ${util.inspect(info)} which must be ignored`);
        }
    });

    it('should be able to add an ignorable file', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        documents.getCollection().insert({
            fspath: '/home/david/Projects/akasharender/akasharender/test/documents/subdir/toignore.html',
            vpath: 'subdir/toignore.html',
            mime: null,
            mounted: '/home/david/Projects/akasharender/akasharender/test/documents',
            mountPoint: '/',
            pathInMounted: 'subdir/toignore.html',
            renderPath: 'subdir/toignore.html',
            dirname: 'subdir',
            baseMetadata: {},
            basedir: '/home/david/Projects/akasharender/akasharender/test/documents',
            dirMountedOn: '/',
            mountedDirMetadata: {},
            metadata: {
                tags: [ 'IgnoreTag' ]
            },
            docpath: 'subdir/toignore.html',
            docdestpath: 'subdir/toignore.html',
            renderpath: 'subdir/toignore.html'
        });

    });

    it('should find ignorable file in collection', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        let found = false;
        documents.getCollection().chain()
        .where(function(obj) {
            if (obj.vpath === 'subdir/toignore.html') found = true;
        });

        assert.isTrue(found);
    });

    it('should not find ignorable file in find', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        const found = documents.find('subdir/toignore.html');

        // console.log(found);
        assert.isTrue(typeof found === 'undefined');
    });

    it('should not find ignorable file in siblings', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        const siblings = documents.siblings('subdir/shown-content-local.html.md');

        // console.log(siblings);
        for (const sibling of siblings) {
            assert.notEqual(sibling.vpath, 'subdir/toignore.html');
        }
    });

    it('should not find ignorable file in documentsWithTags', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        const withtags = documents.documentsWithTags();
        for (const doc of withtags) {
            assert.notEqual(doc.vpath, 'subdir/toignore.html');

        }
    });

    it('should not find ignorable tag in tags', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        const tags = documents.tags();
        for (const tag of tags) {
            assert.notEqual(tag, 'IgnoreTag');

        }
    });

    it('should not find ignorable file in search', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        const found1 = documents.search({
            pathmatch: 'subdir/toignore.html'
        });

        for (const doc of found1) {
            assert.notEqual(doc.vpath, 'subdir/toignore.html');
        }

        const found2 = documents.search({
            tag: 'IgnoreTag'
        });

        for (const doc of found2) {
            assert.notEqual(doc.vpath, 'subdir/toignore.html');
        }
    });

    it('should not find ignorable file in paths', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        let found = false;
        const docs = documents.paths();
        for (const doc of docs) {
            if (doc.vpath === 'subdir/toignore.html') found = true;
        }

        assert.isFalse(found);
    });

    it('should remove ignorable file using collection', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        documents.getCollection().findAndRemove({
            vpath: 'subdir/toignore.html'
        });

        let found = false;
        documents.getCollection().chain()
        .where(function(obj) {
            if (obj.vpath === 'subdir/toignore.html') found = true;
        });

        assert.isFalse(found);

    });
});

function isPathAllowed(pathinfo, allowed_paths) {
    for (const allowed of allowed_paths) {
        // console.log(`isPathAllowed pathinfo ${util.inspect(pathinfo)} allowed ${util.inspect(allowed)}`);
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
            fspath: '**/documents/anchor-cleanups.html.md',
            renderPath: 'anchor-cleanups-nunjucks.html',
            vpath: 'anchor-cleanups-nunjucks.html.md'
        },
        {
            fspath: '**/documents/show-content-nunjucks.html.md',
            renderPath: 'show-content-nunjucks.html',
            vpath: 'show-content-nunjucks.html.md'
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
            fspath: '**/documents/tags-array.html.md',
            renderPath: 'tags-array.html',
            vpath: 'tags-array.html.md'
        },
        {
            fspath: '**/documents/tags-string.html.md',
            renderPath: 'tags-string.html',
            vpath: 'tags-string.html.md'
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
        },
        {
            fspath: '**/documents/style.css.less',
            renderPath: 'style.css',
            vpath: 'style.css.less'
        },
        {
            fspath: '**/documents/anchor-cleanups-tempura.html.md-MOOT',
            renderPath: 'anchor-cleanups-tempura.html.md-MOOT',
            vpath: 'anchor-cleanups-tempura.html.md-MOOT'
        },
        {
            fspath: '**/documents/asciidoctor-tempura.html.adoc-MOOT',
            renderPath: 'asciidoctor-tempura.html.adoc-MOOT',
            vpath: 'asciidoctor-tempura.html.adoc-MOOT'
        },
        {
            fspath: '**/documents/body-class-tempura.html.md-MOOT',
            renderPath: 'body-class-tempura.html.md-MOOT',
            vpath: 'body-class-tempura.html.md-MOOT'
        },
        {
            fspath: '**/documents/code-embed-tempura.html.md-MOOT',
            renderPath: 'code-embed-tempura.html.md-MOOT',
            vpath: 'code-embed-tempura.html.md-MOOT'
        },
        {
            fspath: '**/documents/fig-img-tempura.html.md-MOOT',
            renderPath: 'fig-img-tempura.html.md-MOOT',
            vpath: 'fig-img-tempura.html.md-MOOT'
        },
        {
            fspath: '**/documents/img2figimg-tempura.html.md-MOOT',
            renderPath: 'img2figimg-tempura.html.md-MOOT',
            vpath: 'img2figimg-tempura.html.md-MOOT'
        },
        {
            fspath: '**/documents/img2resize-tempura.html.md-MOOT',
            renderPath: 'img2resize-tempura.html.md-MOOT',
            vpath: 'img2resize-tempura.html.md-MOOT'
        },
        {
            fspath: '**/documents/json-data-tempura.html.json-MOOT',
            renderPath: 'json-data-tempura.html.md-MOOT',
            vpath: 'json-data-tempura.html.json-MOOT'
        },
        {
            fspath: '**/documents/json-data-tempura.html.json-ignore',
            renderPath: 'json-data-tempura.html.json-ignore',
            vpath: 'json-data-tempura.html.json-ignore'
        },
        {
            fspath: '**/documents/partials-tempura.html.tempura-MOOT',
            renderPath: 'partials-tempura.html.tempura-MOOT',
            vpath: 'partials-tempura.html.tempura-MOOT'
        },
        {
            fspath: '**/documents/ejs-include.html.ejs',
            vpath: 'ejs-include.html.ejs',
            renderPath: 'ejs-include.html'
        },
        {
            fspath: '**/documents/teaser-njk-macro.html.md',
            vpath: 'teaser-njk-macro.html.md',
            renderPath: 'teaser-njk-macro.html'
        }
    ];
    
    it('should find only allowed document paths', async function() {
        this.timeout(75000);
        const documents = filecache.documents;
        await documents.isReady();

        // console.log(`allowed documents pre paths`);

        const found = filecache.documents.paths();

        assert.isDefined(found);
        assert.isArray(found);

        // console.log(`allowed documents length ${found.length}`);

        const vpathseen = new Set();

        for (const pathinfo of found) {
            assert.isFalse(vpathseen.has(pathinfo.vpath), `Two or more entries for ${pathinfo.vpath}`);
            vpathseen.add(pathinfo.vpath);
            assert.isTrue(isPathAllowed(pathinfo, allowed_paths), util.inspect(pathinfo));
        }
    });

    /* it('should have same for paths and pathsViews', async function() {

        this.timeout(75000);
        const documents = filecache.documents;
        await documents.isReady();

        // console.log(`allowed documents pre paths`);

        const found = filecache.documents.paths();
        const foundV = filecache.documents.pathsView();

        assert.isDefined(found);
        assert.isArray(found);

        assert.isDefined(foundV);
        assert.isArray(foundV);

        assert.equal(found.length, foundV.length);
    }); */

    // Somehow files which are supposed to be ignored have
    // made it into the documents cache
    it('should not find files which should be ignored', async function() {

        const documents = filecache.documents;
        await documents.isReady();

        for (const info of documents.getCollection().find()) {
            assert.isFalse(filecache.documents.ignoreFile(info),
                `Found file ${util.inspect(info)} which must be ignored`);
        }
    })

    it('should find /index.html.md', function() {
        const found = filecache.documents.find('/index.html.md');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'index.html.md');
        assert.equal(found.vpath, 'index.html.md');
        assert.equal(found.renderPath, 'index.html');
        assert.equal(found.dirname, '/');
    });

    it('should find index.html.md', function() {
        const found = filecache.documents.find('index.html.md');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'index.html.md');
        assert.equal(found.vpath, 'index.html.md');
        assert.equal(found.renderPath, 'index.html');
        assert.equal(found.dirname, '/');
    });

    it('should find index.html', function() {
        const found = filecache.documents.find('index.html');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'index.html.md');
        assert.equal(found.vpath, 'index.html.md');
        assert.equal(found.renderPath, 'index.html');
        assert.equal(found.dirname, '/');
    });

    function filezContains(siblings, vpath) {
        let ret = false;
        for (const sibling of siblings) {
            if (sibling.vpath === vpath) {
                ret = true;
                break;
            }
        }
        return ret;
    }
    
    it('should find siblings for index.html', function() {
        const siblings = filecache.documents.siblings('index.html.md');
        for (const sibling of siblings) {
            assert.equal(sibling.dirname, '/');
        }
        assert.isOk(filezContains(siblings, 'img2figimg-liquid.html.md'));
        assert.isOk(filezContains(siblings, 'img2figimg-handlebars.html.md'));
        assert.isOk(filezContains(siblings, 'img2resize-handlebars.html.md'));
        assert.isOk(filezContains(siblings, 'img2resize-nunjucks.html.md'));
        assert.isOk(filezContains(siblings, 'img2figimg.html.md'));
        assert.isNotOk(filezContains(siblings, 'index.html.md'));
        assert.isOk(filezContains(siblings, 'fig-img.html.md'));
        assert.isOk(filezContains(siblings, 'json-data-handlebars.html.json'));
        assert.isOk(filezContains(siblings, 'json-data-nunjucks.html.json'));
        assert.isOk(filezContains(siblings, 'json-data-liquid.html.json'));
        assert.isOk(filezContains(siblings, 'json-data.html.json'));
        assert.isOk(filezContains(siblings, 'metadata-style-javascript.html.md'));
        assert.isOk(filezContains(siblings, 'njk-incl.html.md'));
        assert.isOk(filezContains(siblings, 'img2resize.html.md'));
        assert.isOk(filezContains(siblings, 'img2resize-liquid.html.md'));
        assert.isOk(filezContains(siblings, 'njk-func.html.md'));
        assert.isOk(filezContains(siblings, 'partials.html.md'));
        assert.isOk(filezContains(siblings, 'partials-handlebars.html.handlebars'));
        assert.isOk(filezContains(siblings, 'select-elements.html.md'));
        assert.isOk(filezContains(siblings, 'show-content-handlebars.html.md'));
        assert.isOk(filezContains(siblings, 'show-content-nunjucks.html.md'));
        assert.isOk(filezContains(siblings, 'show-content.html.md'));
        assert.isOk(filezContains(siblings, 'shown-content.html.md'));
        assert.isOk(filezContains(siblings, 'simple-style-javascript.html.md'));
        assert.isOk(filezContains(siblings, 'teaser-content.html.md'));
        assert.isOk(filezContains(siblings, 'partials-liquid.html.liquid'));
        assert.isOk(filezContains(siblings, 'show-content-liquid.html.md'));
        assert.isOk(filezContains(siblings, 'partials-nunjucks.html.njk'));
    });

    /* it('should find siblings for index.html with View', function() {
        const siblings = filecache.documents.siblingsView('index.html.md');
        for (const sibling of siblings) {
            assert.equal(sibling.dirname, '/');
        }
        assert.isOk(filezContains(siblings, 'img2figimg-liquid.html.md'));
        assert.isOk(filezContains(siblings, 'img2figimg-handlebars.html.md'));
        assert.isOk(filezContains(siblings, 'img2resize-handlebars.html.md'));
        assert.isOk(filezContains(siblings, 'img2resize-nunjucks.html.md'));
        assert.isOk(filezContains(siblings, 'img2figimg.html.md'));
        assert.isNotOk(filezContains(siblings, 'index.html.md'));
        assert.isOk(filezContains(siblings, 'fig-img.html.md'));
        assert.isOk(filezContains(siblings, 'json-data-handlebars.html.json'));
        assert.isOk(filezContains(siblings, 'json-data-nunjucks.html.json'));
        assert.isOk(filezContains(siblings, 'json-data-liquid.html.json'));
        assert.isOk(filezContains(siblings, 'json-data.html.json'));
        assert.isOk(filezContains(siblings, 'metadata-style-javascript.html.md'));
        assert.isOk(filezContains(siblings, 'njk-incl.html.md'));
        assert.isOk(filezContains(siblings, 'img2resize.html.md'));
        assert.isOk(filezContains(siblings, 'img2resize-liquid.html.md'));
        assert.isOk(filezContains(siblings, 'njk-func.html.md'));
        assert.isOk(filezContains(siblings, 'partials.html.md'));
        assert.isOk(filezContains(siblings, 'partials-handlebars.html.handlebars'));
        assert.isOk(filezContains(siblings, 'select-elements.html.md'));
        assert.isOk(filezContains(siblings, 'show-content-handlebars.html.md'));
        assert.isOk(filezContains(siblings, 'show-content-nunjucks.html.md'));
        assert.isOk(filezContains(siblings, 'show-content.html.md'));
        assert.isOk(filezContains(siblings, 'shown-content.html.md'));
        assert.isOk(filezContains(siblings, 'simple-style-javascript.html.md'));
        assert.isOk(filezContains(siblings, 'teaser-content.html.md'));
        assert.isOk(filezContains(siblings, 'partials-liquid.html.liquid'));
        assert.isOk(filezContains(siblings, 'show-content-liquid.html.md'));
        assert.isOk(filezContains(siblings, 'partials-nunjucks.html.njk'));
    }); */

    it('should find indexes', async function() {

        /* const found = [
            filecache.documents.find('hier/dir1/dir2/index.html'),
            filecache.documents.find('hier/dir1/index.html'),
            filecache.documents.find('hier/index.html'),
            filecache.documents.find('index.html')
        ];
        console.log(`index chain `, found.map(f => {
            return f.vpath;
        }));

        const foundColl = 
            filecache.documents.getCollection().find({
                '$or': [
                    { '$or': [
                        { vpath: 'hier/dir1/dir2/index.html' },
                        { renderPath: 'hier/dir1/dir2/index.html' },
                    ]},
                    { '$or': [
                        { vpath: 'hier/dir1/index.html' },
                        { renderPath: 'hier/dir1/index.html'},
                    ]},
                    { '$or': [
                        { vpath: 'hier/index.html' },
                        { renderPath: 'hier/index.html'},
                    ]},
                    { '$or': [
                        { vpath: 'hier/non-existant.html' },
                        { renderPath: 'hier/non-existant.html'},
                    ]},
                    { '$or': [
                        { vpath: 'index.html' },
                        { renderPath: 'index.html'}
                    ]}
                ]
            });
        console.log(`index chain collection `, foundColl.map(f => {
            return f.vpath;
        })); */

        const foundChain = await filecache.documents.indexChain('hier/dir1/dir2/nested-anchor.html.md');
        /* console.log(`index chain foundChain `, foundChain.map(item => {
            return item.vpath;
        })); */

        assert.deepEqual([
            'index.html.md',
            'hier/index.html.md',
            'hier/dir1/index.html.md',
            'hier/dir1/dir2/index.html.md',
            'hier/dir1/dir2/nested-anchor.html.md'
        ],
        foundChain.map(item => {
            return item.vpath;
        }))

        /* const list = filecache.documents.getCollection().find({
            '$or': [
                { vpath: 'hier/dir1/dir2/index.html' },
                { vpath: 'hier/dir1/index.html' },
                { vpath: 'hier/index.html' },
                { vpath: 'index.html' },
            ]
        });

        console.log(`index chain list `, list /*.map(item => {
            return item.vpath;
        }) * /); */
    });

    describe('tags', function() {

        it('should not find tags in show-content.html', function() {
            const found = filecache.documents.find('show-content.html');

            assert.isDefined(found);
            assert.equal(found.mime, 'text/markdown');
            assert.equal(found.mountPoint, '/');

            assert.isDefined(found.metadata);
            assert.isDefined(found.metadata.tags);
            assert.isArray(found.metadata.tags);
            assert.equal(found.metadata.tags.length, 0);
        });

        it('should find tags in tags-array.html', function() {
            const found = filecache.documents.find('tags-array.html');

            assert.isDefined(found);
            assert.equal(found.mime, 'text/markdown');
            assert.equal(found.mountPoint, '/');

            assert.isDefined(found.docMetadata);
            assert.isDefined(found.docMetadata.tags);
            assert.isArray(found.docMetadata.tags);
            assert.equal(found.docMetadata.tags.length, 3);

            assert.isTrue(found.docMetadata.tags.includes('Tag1'));
            assert.isTrue(found.docMetadata.tags.includes('Tag2'));
            assert.isTrue(found.docMetadata.tags.includes('Tag3'));
            assert.isFalse(found.docMetadata.tags.includes('Tag-string-1'));
            assert.isFalse(found.docMetadata.tags.includes('Tag-string-2'));
            assert.isFalse(found.docMetadata.tags.includes('Tag-string-3'));
            assert.isFalse(found.docMetadata.tags.includes('not-found'));

            assert.isDefined(found.metadata);
            assert.isDefined(found.metadata.tags);
            assert.isArray(found.metadata.tags);
            assert.equal(found.metadata.tags.length, 3);

            assert.isTrue(found.metadata.tags.includes('Tag1'));
            assert.isTrue(found.metadata.tags.includes('Tag2'));
            assert.isTrue(found.metadata.tags.includes('Tag3'));
            assert.isFalse(found.metadata.tags.includes('Tag-string-1'));
            assert.isFalse(found.metadata.tags.includes('Tag-string-2'));
            assert.isFalse(found.metadata.tags.includes('Tag-string-3'));
            assert.isFalse(found.metadata.tags.includes('not-found'));
        });

        it('should find tags in tags-string.html', function() {
            const found = filecache.documents.find('/tags-string.html.md');

            assert.isDefined(found);
            assert.equal(found.mime, 'text/markdown');
            assert.equal(found.mountPoint, '/');

            assert.isDefined(found.docMetadata);
            assert.isDefined(found.docMetadata.tags);
            assert.isArray(found.docMetadata.tags);
            assert.equal(found.docMetadata.tags.length, 3);

            assert.isFalse(found.docMetadata.tags.includes('Tag1'));
            assert.isFalse(found.docMetadata.tags.includes('Tag2'));
            assert.isFalse(found.docMetadata.tags.includes('Tag3'));
            assert.isTrue(found.docMetadata.tags.includes('Tag-string-1'));
            assert.isTrue(found.docMetadata.tags.includes('Tag-string-2'));
            assert.isTrue(found.docMetadata.tags.includes('Tag-string-3'));
            assert.isFalse(found.docMetadata.tags.includes('not-found'));

            assert.isDefined(found.metadata);
            assert.isDefined(found.metadata.tags);
            assert.isArray(found.metadata.tags);
            assert.equal(found.metadata.tags.length, 3);

            assert.isFalse(found.metadata.tags.includes('Tag1'));
            assert.isFalse(found.metadata.tags.includes('Tag2'));
            assert.isFalse(found.metadata.tags.includes('Tag3'));
            assert.isTrue(found.metadata.tags.includes('Tag-string-1'));
            assert.isTrue(found.metadata.tags.includes('Tag-string-2'));
            assert.isTrue(found.metadata.tags.includes('Tag-string-3'));
            assert.isFalse(found.metadata.tags.includes('not-found'));
        });

        it('should find documents with Tag1', function() {
            const found = filecache.documents.search({
                tag: 'Tag1'
            });
            /* console.log(`test Tag1 found `, found.map(f => {
                return f.vpath;
            })); */

            assert.isDefined(found);
            assert.isArray(found);
            assert.equal(found.length, 1);

            assert.equal(found[0].vpath, 'tags-array.html.md');
        });

        it('should find documents with Tag-string-2', function() {
            const found = filecache.documents.search({
                tag: 'Tag-string-2'
            });
            /* console.log(`test Tag-string-2 found `, found.map(f => {
                return f.vpath;
            })); */

            assert.isDefined(found);
            assert.isArray(found);
            assert.equal(found.length, 1);

            assert.equal(found[0].vpath, 'tags-string.html.md');
        });

        it('should not find documents with foober', function() {
            const found = filecache.documents.search({
                tag: 'foober'
            });
            /* console.log(`test foober found `, found.map(f => {
                return f.vpath;
            })); */

            assert.isDefined(found);
            assert.isArray(found);
            assert.equal(found.length, 0);
        });

        it('should find all tags', function() {
            const found = filecache.documents.tags();

            assert.isDefined(found);
            assert.isArray(found);
            assert.equal(found.length, 6);

            assert.deepEqual(found, [
                'Tag-string-1',
                'Tag-string-2',
                'Tag-string-3',
                'Tag1',
                'Tag2',
                'Tag3'
            ]);
        });


        it('should find documents with tags', function() {
            const found = filecache.documents.documentsWithTags();

            assert.isDefined(found);
            assert.isArray(found);
            assert.equal(found.length, 2);

            const goodvpath = (vp) => {
                return (vp === 'tags-array.html.md')
                    || (vp === 'tags-string.html.md');
            };

            assert.isTrue(goodvpath(found[0].vpath));
            assert.isTrue(goodvpath(found[1].vpath));
        });

        /* it('should find documents with tags and with View', function() {
            const found = filecache.documents.documentsWithTags();
            const foundV = filecache.documents.documentsWithTagsView();

            assert.isDefined(found);
            assert.isArray(found);
            assert.equal(found.length, 2);

            assert.isDefined(foundV);
            assert.isArray(foundV);
            assert.equal(foundV.length, 2);

            const goodvpath = (vp) => {
                return (vp === 'tags-array.html.md')
                    || (vp === 'tags-string.html.md');
            };

            assert.isTrue(goodvpath(found[0].vpath));
            assert.isTrue(goodvpath(found[1].vpath));

            assert.isTrue(goodvpath(foundV[0].vpath));
            assert.isTrue(goodvpath(foundV[1].vpath));
        }); */

    });

    it('should find /subdir/show-content-local.html', function() {
        const found = filecache.documents.find('/subdir/show-content-local.html');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'subdir/show-content-local.html.md');
        assert.equal(found.vpath, 'subdir/show-content-local.html.md');
        assert.equal(found.renderPath, 'subdir/show-content-local.html');
        assert.equal(found.dirname, 'subdir');
    });
    
    it('should find subdir/show-content-local.html.md', function() {
        const found = filecache.documents.find('/subdir/show-content-local.html.md');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'subdir/show-content-local.html.md');
        assert.equal(found.vpath, 'subdir/show-content-local.html.md');
        assert.equal(found.renderPath, 'subdir/show-content-local.html');
        assert.equal(found.dirname, 'subdir');
    });
    
    it('should find siblings for /subdir/show-content-local.html.md', function() {
        const siblings = filecache.documents.siblings('subdir/show-content-local.html.md');
        assert.isOk(filezContains(siblings, 'subdir/index.html.md'));
        assert.isNotOk(filezContains(siblings, 'subdir/show-content-local.html.md'));
        assert.isOk(filezContains(siblings, 'subdir/shown-content-local.html.md'));
        for (const sibling of siblings) {
            assert.equal(sibling.dirname, 'subdir');
        }
    });

    it('should find /mounted/img2resize.html.md', function() {
        const found = filecache.documents.find('/mounted/img2resize.html.md');

        // console.log(found);
        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.include(found.mounted, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInMounted, 'img2resize.html.md');
        assert.equal(found.vpath, 'mounted/img2resize.html.md');
        assert.equal(found.renderPath, 'mounted/img2resize.html');
        assert.equal(found.dirname, 'mounted');
    });
    
    it('should find mounted/img2resize.html', function() {
        const found = filecache.documents.find('mounted/img2resize.html');

        assert.isDefined(found);
        assert.equal(found.mime, 'text/markdown');
        assert.include(found.mounted, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInMounted, 'img2resize.html.md');
        assert.equal(found.vpath, 'mounted/img2resize.html.md');
        assert.equal(found.renderPath, 'mounted/img2resize.html');
        assert.equal(found.dirname, 'mounted');
    });
    
    it('should find no siblings for mounted/img2resize.html', function() {
        const siblings = filecache.documents.siblings('mounted/img2resize.html');
        assert.isDefined(siblings);
        assert.isTrue(Array.isArray(siblings));

        /* console.log(siblings.map(s => {
            return {
                vpath: s.vpath, dirname: s.dirname
            }
        })) */
        assert.equal(siblings.length, 0);
    });

    it('should find /mounted/img/Human-Skeleton.jpg', function() {
        const found = filecache.documents.find('/mounted/img/Human-Skeleton.jpg');

        assert.isDefined(found);
        assert.equal(found.mime, 'image/jpeg');
        assert.include(found.mounted, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInMounted, 'img/Human-Skeleton.jpg');
        assert.equal(found.vpath, 'mounted/img/Human-Skeleton.jpg');
        assert.equal(found.renderPath, 'mounted/img/Human-Skeleton.jpg');
        assert.equal(found.dirname, 'mounted/img');
    });
    
    it('should find mounted/img/Human-Skeleton.jpg', function() {
        const found = filecache.documents.find('mounted/img/Human-Skeleton.jpg');

        // console.log(found);
        assert.isDefined(found);
        assert.equal(found.mime, 'image/jpeg');
        assert.include(found.mounted, 'mounted2');
        assert.equal(found.mountPoint, 'mounted');
        assert.equal(found.pathInMounted, 'img/Human-Skeleton.jpg');
        assert.equal(found.vpath, 'mounted/img/Human-Skeleton.jpg');
        assert.equal(found.renderPath, 'mounted/img/Human-Skeleton.jpg');
        assert.equal(found.dirname, 'mounted/img');
    });
    
    it('should find siblings for /mounted/img/Human-Skeleton.jpg', function() {
        const siblings = filecache.documents.siblings('/mounted/img/Human-Skeleton.jpg');
        assert.isNotOk(filezContains(siblings, 'mounted/img/Human-Skeleton.jpg'));
        for (const sibling of siblings) {
            assert.equal(sibling.dirname, 'mounted/img');
        }
    });

    it('should find siblings for mounted/img/Human-Skeleton.jpg', function() {
        const siblings = filecache.documents.siblings('mounted/img/Human-Skeleton.jpg');
        assert.isNotOk(filezContains(siblings, 'mounted/img/Human-Skeleton.jpg'));
        for (const sibling of siblings) {
            assert.equal(sibling.dirname, 'mounted/img');
        }
    });

    describe('Unknown files', function() {

        it('should not find mounted/unknown-Skeleton.jpg', function() {
            const found = filecache.documents.find('mounted/unknown-Skeleton.jpg');

            assert.isUndefined(found);
        });

        it('should not find /mounted/unknown-Skeleton.jpg', function() {
            const found = filecache.documents.find('/mounted/unknown-Skeleton.jpg');

            assert.isUndefined(found);
        });

        it('should not find unknown-Skeleton.jpg', function() {
            const found = filecache.documents.find('unknown-Skeleton.jpg');

            assert.isUndefined(found);
        });

        it('should not find /unknown-Skeleton.jpg', function() {
            const found = filecache.documents.find('/unknown-Skeleton.jpg');

            assert.isUndefined(found);
        });

    });

    describe('Index files', function() {

        it('should find index files for /', function() {
            const indexes = filecache.documents.indexFiles('/');

            assert.isOk(filezContains(indexes, 'index.html.md'));
            assert.isOk(filezContains(indexes, 'subdir/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier-broke/dir1/dir2/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/dir2/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/imgdir/index.html.md'));
        });

        /* it('should find index files for / with View', function() {
            const indexes = filecache.documents.indexFilesView('/');

            assert.isOk(filezContains(indexes, 'index.html.md'));
            assert.isOk(filezContains(indexes, 'subdir/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier-broke/dir1/dir2/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/dir2/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/imgdir/index.html.md'));
        }); */

        it('should find index files for undefined', function() {
            const indexes = filecache.documents.indexFiles();

            assert.isOk(filezContains(indexes, 'index.html.md'));
            assert.isOk(filezContains(indexes, 'subdir/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier-broke/dir1/dir2/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/dir2/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/imgdir/index.html.md'));
        });

        /* it('should find index files for undefined with View', function() {
            const indexes = filecache.documents.indexFilesView();

            assert.isOk(filezContains(indexes, 'index.html.md'));
            assert.isOk(filezContains(indexes, 'subdir/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier-broke/dir1/dir2/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/dir2/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/imgdir/index.html.md'));
        }); */

        it('should find index files for hier', function() {
            const indexes = filecache.documents.indexFiles('hier/');
            assert.isOk(filezContains(indexes, 'hier/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/dir2/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/imgdir/index.html.md'));

            assert.isFalse(filezContains(indexes, 'index.html.md'));
            assert.isFalse(filezContains(indexes, 'subdir/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier-broke/dir1/dir2/index.html.md'));
        });

        /* it('should find index files for hier with View', function() {
            const indexes = filecache.documents.indexFilesView('hier/');
            assert.isOk(filezContains(indexes, 'hier/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/dir2/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/imgdir/index.html.md'));

            assert.isFalse(filezContains(indexes, 'index.html.md'));
            assert.isFalse(filezContains(indexes, 'subdir/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier-broke/dir1/dir2/index.html.md'));
        }); */

        it('should find index files for hier/dir1', function() {
            const indexes = filecache.documents.indexFiles('hier/dir1');
            assert.isFalse(filezContains(indexes, 'hier/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/dir2/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier/imgdir/index.html.md'));
        });

        /* it('should find index files for hier/dir1 with View', function() {
            const indexes = filecache.documents.indexFilesView('hier/dir1');
            assert.isFalse(filezContains(indexes, 'hier/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/index.html.md'));
            assert.isOk(filezContains(indexes, 'hier/dir1/dir2/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier/imgdir/index.html.md'));
        }); */

        it('should find index files for hier-broke', function() {
            const indexes = filecache.documents.indexFiles('hier-broke');
            assert.isOk(filezContains(indexes, 'hier-broke/dir1/dir2/index.html.md'));


            assert.isFalse(filezContains(indexes, 'index.html.md'));
            assert.isFalse(filezContains(indexes, 'subdir/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier/dir1/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier/dir1/dir2/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier/imgdir/index.html.md'));
        });

        /* it('should find index files for hier-broke with View', function() {
            const indexes = filecache.documents.indexFilesView('hier-broke');
            assert.isOk(filezContains(indexes, 'hier-broke/dir1/dir2/index.html.md'));


            assert.isFalse(filezContains(indexes, 'index.html.md'));
            assert.isFalse(filezContains(indexes, 'subdir/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier/dir1/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier/dir1/dir2/index.html.md'));
            assert.isFalse(filezContains(indexes, 'hier/imgdir/index.html.md'));
        }); */

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
        },
        {
            fspath: '**/layouts/default-once.html.tempura',
            renderPath: 'default-once.html.tempura',
            vpath: 'default-once.html.tempura'
        },
        {
            fspath: '**/layouts/default.html.tempura',
            renderPath: 'default.html.tempura',
            vpath: 'default.html.tempura'
        },
        {
            fspath: '**/layouts/default-once-teaser.html.njk',
            vpath: 'default-once-teaser.html.njk',
            renderPath: 'default-once-teaser.html.njk'
        }
    ];
    
    it('should find only allowed layouts paths', async function() {
        const layouts = filecache.layouts;
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
        },
        {
            fspath: '**/partials/listrender.html.tempura',
            renderPath: 'listrender.html.tempura',
            vpath: 'listrender.html.tempura'
        },
        {
            fspath: '**/partials/json-format.html.tempura',
            renderPath: 'json-format.html.tempura',
            vpath: 'json-format.html.tempura'
        },
        {
            fspath: '**/partials/strong.html.tempura',
            renderPath: 'strong.html.tempura',
            vpath: 'strong.html.tempura'
        },
        {
            fspath: '**/partials/ak_teaser.html.njk',
            vpath: 'ak_teaser.html.njk',
            renderPath: 'ak_teaser.html.njk'
        }
    ];
    
    it('should find only allowed partial paths', async function() {
        const partials = filecache.partials;
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
        const assets = filecache.assets;
        await assets.isReady();

        let found = filecache.assets.paths();

        assert.isDefined(found);
        assert.isArray(found);

        for (let pathinfo of found) {
            assert.isTrue(isPathAllowed(pathinfo, allowed_paths), util.inspect(pathinfo));
        }
    });

    it('should find rss_button.png', function() {
        const found = filecache.assets.find('rss_button.png');

        assert.isDefined(found);
        assert.equal(found.mime, 'image/png');
        assert.equal(found.mountPoint, '/');
        assert.equal(found.pathInMounted, 'rss_button.png');
        assert.equal(found.vpath, 'rss_button.png');
        assert.equal(found.renderPath, 'rss_button.png');
    });

    it('should find file.txt', function() {
        const found = filecache.assets.find('file.txt');

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
        const found = filecache.documents.search({
            rootPath: 'hier/dir1'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        // console.log(`search rootpath hier/dir1 gives `, found.map(f => { return f.vpath; }));
        for (let doc of found) {
            assert.equal(doc.vpath.indexOf('hier/dir1'), 0);
        }
    });

    it('should select nothing for nonexistent rootPath', function() {
        const found = filecache.documents.search({
            rootPath: 'hier/dir1/nowhere'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.equal(found.length, 0);
    });

    it('should select by pathmatch string', function() {
        const found = filecache.assets.search({
            pathmatch: '.png$'
        });
        // console.log(`search pathmatch /.png$/ gives `, found.map(f => { return f.vpath; }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);

        for (const doc of found) {
            assert.isOk(doc.vpath.match(/\.png$/));
        }
    });

    it('should select by multiple pathmatch strings', function() {
        const found = filecache.documents.search({
            pathmatch: [
                '.*anchor-cleanups.*',
                '.*body-class.*',
                /.*fig-img.*/
            ]
        });
        // console.log(`search pathmatch /.png$/ gives `, found.map(f => { return f.vpath; }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);

        for (const doc of found) {
            assert.isOk(doc.vpath.match(/anchor-cleanups|body-class|fig-img/));
        }
    });

    it('should select by pathmatch RegExp', function() {
        const found = filecache.documents.search({
            pathmatch: /.json$/
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isOk(doc.vpath.match(/\.json$/));
        }
    });

    it('should select nothing for nonexistent pathmatch RegExp', function() {
        const found = filecache.documents.search({
            pathmatch: /.json.nowhere$/
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.equal(found.length, 0);
    });

    it('should select by renderpathmatch string', function() {
        const found = filecache.documents.search({
            renderpathmatch: '.html$'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isOk(doc.renderPath.match(/\.html$/));
        }
    });

    it('should select by multiple renderpathmatch strings', function() {
        const found = filecache.documents.search({
            renderpathmatch: [
                '.*asciidoctor.*',
                '.*code-embed.*',
                /.*img2figimg.*/
            ]
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isOk(doc.renderPath.match(/asciidoctor|code-embed|img2figimg/));
        }
    });

    it('should select by renderpathmatch RegExp', function() {
        const found = filecache.documents.search({
            renderpathmatch: /.html$/
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isOk(doc.renderPath.match(/\.html$/));
        }
    });

    it('should select nothing with nonexistent renderpathmatch RegExp', function() {
        const found = filecache.documents.search({
            renderpathmatch: /.html.nowhere$/
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.equal(found.length, 0);
    });

    it('should select by GLOB', function() {
        const found = filecache.documents.search({
            glob: '**/*.json'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isOk(doc.vpath.match(/\.json$/));
        }
    });

    it('should select nothing with nonexistent GLOB', function() {
        const found = filecache.documents.search({
            glob: '**/*.nowhere'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.equal(found.length, 0);
    });

    it('should select renderPath by GLOB', function() {
        const found = filecache.documents.search({
            renderglob: '**/*.html'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isOk(doc.renderPath.match(/\.html$/));
        }
    });

    it('should select nothing with nonexistent renderPath GLOB', function() {
        const found = filecache.documents.search({
            renderglob: '**/*.nowhere'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.equal(found.length, 0);
    });

    it('should select rendersToHTML true', function() {
        const found = filecache.documents.search({
            rendersToHTML: true
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isTrue(doc.rendersToHTML);
            assert.isOk(doc.renderPath.match(/\.html$/));
        }
    });

    it('should select rendersToHTML false', function() {
        const found = filecache.documents.search({
            rendersToHTML: false
        });

        // console.log(`rendersToHTML false `, found.map(f => { return f.vpath; }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isFalse(doc.rendersToHTML);
            assert.isNotOk(doc.renderPath.match(/\.html$/));
        }
    });

    it('should select by MIME', function() {
        const found = filecache.assets.search({
            mime: 'image/png'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.equal(doc.mime, "image/png");
        }
    });

    it('should select nothing with nonexistent MIME', function() {
        const found = filecache.assets.search({
            mime: 'image/nowhere'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.equal(found.length, 0);
    });

    it('should select by layout string', function() {
        const found = filecache.documents.search({
            layouts: 'default-once.html.liquid'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isDefined(doc.docMetadata);
            assert.isDefined(doc.docMetadata.layout);
            assert.equal(doc.docMetadata.layout, 'default-once.html.liquid');
        }
    });

    it('should select nothing with nonexistent layout string', function() {
        const found = filecache.documents.search({
            layouts: 'default-once.html.nowhere'
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.equal(found.length, 0);
    });

    it('should select by layout array', function() {
        const found = filecache.documents.search({
            layouts: [ 'default-once.html.liquid', 'default-once.html.njk' ]
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isDefined(doc.docMetadata);
            assert.isDefined(doc.docMetadata.layout);
            assert.match(doc.docMetadata.layout,
                /default-once.html.liquid|default-once.html.njk/ );
        }
    });

    it('should select nothing with nonexistent layout array', function() {
        const found = filecache.documents.search({
            layouts: [ 'default-once.html.nowhere', 'default-once.html.nowhere-else' ]
        });

        assert.isDefined(found);
        assert.isArray(found);
        assert.equal(found.length, 0);
    });

    // This feature was found to not be useful.
    // One should instead match renderers by
    // the renderer name.

    /* it('should select by renderer', function() {
        const found = filecache.documents.search({
            renderers: [ akasha.HTMLRenderer ]
        });

        // console.log(`renderers `, found.map(f => { return f.vpath }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isDefined(doc.docMetadata);
            assert.isDefined(doc.docMetadata.layout);
            assert.match(doc.vpath,
                /.html.md$|.html.adoc$|.html.ejs$|.html.json$|.html.handlebars|.html.liquid$|.html.njk$/ );
        }
    }); */

    it('should select by renderer name', function() {
        const found = filecache.documents.search({
            renderers: [ '.html.md' ]
        });

        // console.log(`renderers `, found.map(f => { return f.vpath }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isDefined(doc.docMetadata);
            assert.isDefined(doc.docMetadata.layout);
            assert.match(doc.vpath, /\.html\.md$/);
        }
    });

    it('should select nothing with nonexistent renderer name', function() {
        const found = filecache.documents.search({
            renderers: [ '.html.nowhere' ]
        });

        // console.log(`renderers `, found.map(f => { return f.vpath }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.equal(found.length, 0);
    });

    it('should select sort by vpath field', function() {
        const found = filecache.documents.search({
            sortBy: 'vpath'
        });

        // console.log(`renderers `, found.map(f => { return f.vpath }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        let lastVpath = '';
        for (const doc of found) {
            assert.isTrue(doc.vpath >= lastVpath);
            lastVpath = doc.vpath;
        }
    });

    it('should select reverse sort by vpath field', function() {
        const found = filecache.documents.search({
            sortBy: 'vpath',
            reverse: true
        });

        // console.log(`renderers `, found.map(f => { return f.vpath }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        let lastVpath = '';
        for (const doc of found) {
            assert.isTrue(lastVpath === '' || doc.vpath <= lastVpath);
            lastVpath = doc.vpath;
        }
    });


    it('should select sort by dirname field', function() {
        const found = filecache.documents.search({
            sortBy: 'dirname'
        });

        // console.log(`renderers `, found.map(f => { return f.vpath }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        let lastDirname = '';
        for (const doc of found) {
            assert.isTrue(doc.dirname >= lastDirname);
            lastDirname = doc.dirname;
        }
    });

    it('should select reverse sort by dirname field', function() {
        const found = filecache.documents.search({
            sortBy: 'dirname',
            reverse: true
        });

        // console.log(`renderers `, found.map(f => { return f.vpath }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        let lastDirname = '';
        for (const doc of found) {
            assert.isTrue(lastDirname === '' || doc.dirname <= lastDirname);
            lastDirname = doc.dirname;
        }
    });
    
    // This had been an async function.  In retrospect, how
    // could that have ever worked correctly.  This sort
    // relies on gatherInfoData ensuring that the
    // DOC.metadata.publicationDate field always has a
    // reasonable value, and that DOC.publicationDate
    // is derived from stat'ing the file.
    const sortFunc = (a, b) => {
        let publA = a.metadata && a.metadata.publicationDate 
                ? a.metadata.publicationDate : a.publicationDate;
        let aPublicationDate = Date.parse(publA);
        /* if (isNaN(aPublicationDate)) {
            dateErrors.push(`findBlogDocs ${a.renderPath} BAD DATE publA ${publA}`);
        } */

        let publB = b.metadata && b.metadata.publicationDate 
                ? b.metadata.publicationDate : b.publicationDate;
        let bPublicationDate = Date.parse(publB);
        // console.log(`findBlogDocs publA ${publA} aPublicationDate ${aPublicationDate} publB ${publB} bPublicationDate ${bPublicationDate}`);
        /* if (isNaN(bPublicationDate)) {
            dateErrors.push(`findBlogDocs ${b.renderPath} BAD DATE publB ${publB}`);
        } */

        if (aPublicationDate < bPublicationDate) return -1;
        else if (aPublicationDate === bPublicationDate) return 0;
        else return 1;
    };

    it('should select sort by custom sort function', async function() {
        const found = filecache.documents.search({
            sortFunc: sortFunc,
            rendersToHTML: true
        });

        // console.log(`renderers `, found.map(f => { return f.vpath }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        let lastpublDate = 0;
        /* console.log(found.map(f => {
            return { vpath: f.vpath,
                publ: f.metadata && f.metadata.publicationDate 
                ? f.metadata.publicationDate : "???" };
        })); */
        for (const doc of found) {
            if (!doc.stat) doc.stat = await fsp.stat(doc.fspath);
            let publDoc = doc.metadata && doc.metadata.publicationDate 
                ? doc.metadata.publicationDate : doc.publicationDate;
            let docPublicationDate = Date.parse(publDoc);
            // console.log(`${doc.vpath} ${docPublicationDate} >= ${lastpublDate}`);
            assert.isTrue(docPublicationDate >= lastpublDate);
            lastpublDate = docPublicationDate;
        }
    });

    it('should select limit elements sort by custom sort function', async function() {
        const found = filecache.documents.search({
            sortFunc: sortFunc,
            rendersToHTML: true,
            limit: 20
        });

        // console.log(`renderers `, found.map(f => { return f.vpath }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0 && found.length <= 20);
        let lastpublDate = 0;
        for (const doc of found) {
            if (!doc.stat) doc.stat = await fsp.stat(doc.fspath);
            let publDoc = doc.docMetadata && doc.docMetadata.publicationDate 
                ? doc.docMetadata.publicationDate : doc.stat.mtime;
            let docPublicationDate = Date.parse(publDoc);
            assert.isTrue(docPublicationDate >= lastpublDate);
            lastpublDate = docPublicationDate;
        }
    });

    it('should select offset and limit elements sort by custom sort function', async function() {
        const foundLimit = filecache.documents.search({
            sortFunc: sortFunc,
            rendersToHTML: true,
            limit: 20
        });
        const foundOffset = filecache.documents.search({
            sortFunc: sortFunc,
            rendersToHTML: true,
            limit: 20,
            offset: 10
        });

        // console.log(`renderers `, found.map(f => { return f.vpath }));

        assert.isDefined(foundLimit);
        assert.isArray(foundLimit);
        assert.isTrue(foundLimit.length > 0 && foundLimit.length <= 20);

        assert.isDefined(foundOffset);
        assert.isArray(foundOffset);
        assert.isTrue(foundOffset.length > 0 && foundOffset.length <= 20);

        // console.log(foundLimit.map(f => { return f.vpath }));
        // console.log(foundOffset.map(f => { return f.vpath }));

        // This is two searches configured the same, except that
        // foundOffset starts at index 10.  This first set of
        // assertions checks that the first few items do not match.

        assert.notEqual(foundLimit.at(0).vpath, foundOffset.at(0).vpath);
        assert.notEqual(foundLimit.at(1).vpath, foundOffset.at(0).vpath);
        assert.notEqual(foundLimit.at(2).vpath, foundOffset.at(0).vpath);
        assert.notEqual(foundLimit.at(3).vpath, foundOffset.at(0).vpath);
        assert.notEqual(foundLimit.at(4).vpath, foundOffset.at(0).vpath);

        // offset: 10 means to start with the item at index 10
        // This second set of assertions ensure that the matching
        // items are offset from each other

        assert.equal(foundLimit.at(10).vpath, foundOffset.at(0).vpath);
        assert.equal(foundLimit.at(11).vpath, foundOffset.at(1).vpath);
        assert.equal(foundLimit.at(12).vpath, foundOffset.at(2).vpath);
        assert.equal(foundLimit.at(13).vpath, foundOffset.at(3).vpath);
        assert.equal(foundLimit.at(14).vpath, foundOffset.at(4).vpath);

    });



    it('should select by custom function', function() {
        const found = filecache.documents.search({
            filterfunc: (config, options, doc) => {
                // console.log(`filterfunc ${doc.vpath} ${doc.isDirectory} ${doc.mountPoint}`, doc);
                return doc.stats.isDirectory() === false
                    && doc.mountPoint === 'mounted'
            }
        });

        // console.log(`custom function `, found.map(f => { return f.vpath }));

        assert.isDefined(found);
        assert.isArray(found);
        assert.isTrue(found.length > 0);
        for (const doc of found) {
            assert.isFalse(doc.stats.isDirectory());
            assert.match(doc.vpath, /^mounted\// );
        }
    });



});

describe('Close caches', function() {

    it('should close caches', async function() {
        await filecache.close();
    });
});
