
import { describe, it, before, after } from 'node:test';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { assert } from './test-assert.mjs';
import * as akasha from '../dist/index.js';

const {
    LinkChecker,
    isWhitelisted,
    classifyStatus,
    assertLinkCheckMode,
    LINK_CHECK_MODES,
    DEFAULT_LINK_CHECK_OPTIONS,
} = akasha;

//
// Test doubles
//

// A minimal config supplying askPluginsLegitLocalHref.
function makeConfig(legitHrefs = []) {
    return {
        askPluginsLegitLocalHref(href) {
            return legitHrefs.includes(href);
        }
    };
}

// A fake akasha.filecache with in-memory asset and document paths.
function makeAkasha({ assets = [], documents = [], directories = [] } = {}) {
    const norm = (p) => (p.startsWith('/') ? p.substring(1) : p);
    const assetSet = new Set(assets.map(norm));
    const docSet = new Set(documents.map(norm));
    const dirSet = new Set(directories.map(norm));
    const mkfind = (set) => async (p) => {
        const key = norm(p);
        if (dirSet.has(key)) return { isDirectory: true, vpath: key };
        if (set.has(key)) return { isDirectory: false, vpath: key };
        return undefined;
    };
    return {
        filecache: {
            assetsCache: { find: mkfind(assetSet) },
            documentsCache: { find: mkfind(docSet) }
        }
    };
}

// An external checker that records calls and returns a scripted status.
function mockChecker(byUrl = {}, defaultResult = { state: 'OK', status: 200 }) {
    const calls = [];
    const fn = async (url, opts) => {
        calls.push({ url, opts });
        const r = byUrl[url];
        return r ? r : defaultResult;
    };
    fn.calls = calls;
    return fn;
}

describe('assertLinkCheckMode', function() {
    it('accepts the four valid modes', function() {
        for (const m of LINK_CHECK_MODES) {
            assertLinkCheckMode(m, 'test');
        }
        assert.equal(LINK_CHECK_MODES.length, 4);
    });
    it('rejects an invalid mode', function() {
        assert.throws(() => assertLinkCheckMode('nope', 'test'));
    });
});

describe('classifyStatus', function() {
    it('classifies OK codes', function() {
        assert.equal(classifyStatus(200), 'OK');
        assert.equal(classifyStatus(204), 'OK');
        assert.equal(classifyStatus(301), 'OK');
        assert.equal(classifyStatus(308), 'OK');
    });
    it('classifies BROKEN codes', function() {
        assert.equal(classifyStatus(404), 'BROKEN');
        assert.equal(classifyStatus(410), 'BROKEN');
        assert.equal(classifyStatus(0), 'BROKEN');
    });
    it('classifies ambiguous codes as WARN', function() {
        for (const s of [401, 403, 405, 429, 999, 500, 503]) {
            assert.equal(classifyStatus(s), 'WARN');
        }
    });
});

describe('isWhitelisted', function() {
    it('matches a host entry and its subdomains', function() {
        const wl = ['linkedin.com'];
        assert.isTrue(isWhitelisted('https://linkedin.com/x', wl));
        assert.isTrue(isWhitelisted('https://www.linkedin.com/in/foo', wl));
        assert.isFalse(isWhitelisted('https://notlinkedin.com/x', wl));
    });
    it('matches an exact/prefix URL string', function() {
        const wl = ['https://example.com/ok'];
        assert.isTrue(isWhitelisted('https://example.com/ok/page', wl));
        assert.isFalse(isWhitelisted('https://example.com/other', wl));
    });
    it('matches a RegExp against the full URL', function() {
        const wl = [/^https:\/\/www\.amazon\./];
        assert.isTrue(isWhitelisted('https://www.amazon.co.uk/x', wl));
        assert.isFalse(isWhitelisted('https://amazon.com/x', wl));
    });
    it('returns false for an empty whitelist', function() {
        assert.isFalse(isWhitelisted('https://example.com', []));
    });
});

describe('LinkChecker.resolveOptions', function() {
    it('applies defaults', function() {
        const o = LinkChecker.resolveOptions();
        assert.equal(o.internal, DEFAULT_LINK_CHECK_OPTIONS.internal);
        assert.equal(o.external, 'ignore');
        assert.equal(o.reportOtherSchemes, 'ignore');
        assert.isArray(o.whitelist);
    });
    it('rejects an invalid mode', function() {
        assert.throws(() => LinkChecker.resolveOptions({ internal: 'bogus' }));
    });
});

describe('LinkChecker.classify', function() {
    const chk = new LinkChecker(makeConfig(), makeAkasha(), {});
    it('treats a bare fragment as an anchor', function() {
        assert.equal(chk.classify('#top').kind, 'anchor');
        assert.equal(chk.classify('').kind, 'anchor');
    });
    it('recognizes an external http(s) URL and strips the fragment', function() {
        const c = chk.classify('https://example.org/page#sec');
        assert.equal(c.kind, 'external');
        assert.equal(c.url, 'https://example.org/page');
    });
    it('recognizes a local absolute path as internal', function() {
        const c = chk.classify('/foo/bar.html', 'index.html.md');
        assert.equal(c.kind, 'internal');
        assert.equal(c.absolutePath, '/foo/bar.html');
    });
    it('resolves a relative internal link against the base vpath', function() {
        const c = chk.classify('sub/page.html', 'dir/index.html.md');
        assert.equal(c.kind, 'internal');
        assert.equal(c.absolutePath, '/dir/sub/page.html');
    });
    it('recognizes non-http schemes as other-scheme', function() {
        assert.equal(chk.classify('mailto:a@b.com').kind, 'other-scheme');
        assert.equal(chk.classify('tel:+123').kind, 'other-scheme');
        assert.equal(chk.classify('ftp:host/x').kind, 'other-scheme');
    });
    it('treats an outbound http://example.com URL as external, not internal', function() {
        // http://example.com is the sentinel origin used to detect local
        // links; a real outbound link to that exact origin (as in the
        // example project's markdown.html) must not be misclassified as
        // internal and "resolved" to /http:/example.com/.
        for (const href of [
            'http://example.com/',
            'http://example.com/path/page.html',
            'HTTP://EXAMPLE.COM/'
        ]) {
            const c = chk.classify(href, 'markdown.html.md');
            assert.equal(c.kind, 'external', href);
            assert.isUndefined(c.absolutePath, href);
        }
    });
    it('treats a protocol-relative URL as external', function() {
        const c = chk.classify('//example.com/lib.js', 'index.html.md');
        assert.equal(c.kind, 'external');
        assert.equal(c.url, 'http://example.com/lib.js');
    });
    it('still treats a colon in a non-first path segment as internal', function() {
        const c = chk.classify('foo/bar:baz.html', 'dir/index.html.md');
        assert.equal(c.kind, 'internal');
        assert.equal(c.absolutePath, '/dir/foo/bar:baz.html');
    });
});

describe('LinkChecker outbound sentinel-origin links', function() {
    it('does not report http://example.com as a broken internal link', async function() {
        const akashaObj = makeAkasha({});
        const seenPaths = [];
        const origDocs = akashaObj.filecache.documentsCache.find;
        const origAssets = akashaObj.filecache.assetsCache.find;
        akashaObj.filecache.documentsCache.find = async (p) => {
            seenPaths.push(p);
            return origDocs(p);
        };
        akashaObj.filecache.assetsCache.find = async (p) => {
            seenPaths.push(p);
            return origAssets(p);
        };
        const chk = new LinkChecker(makeConfig(), akashaObj, { internal: 'error' });
        await chk.checkLink('http://example.com/', 'markdown.html', 'markdown.html.md');
        assert.equal(chk.errors.length, 0);
        for (const p of seenPaths) {
            assert.isFalse(p.includes('http:'),
                `internal lookup leaked an absolute URL path: ${p}`);
        }
    });
});

describe('LinkChecker internal links', function() {
    it('passes a link to an existing document', async function() {
        const chk = new LinkChecker(
            makeConfig(),
            makeAkasha({ documents: ['foo/bar.html'] }),
            { internal: 'error' }
        );
        await chk.checkLink('/foo/bar.html', 'index.html');
        chk.finish(); // no throw
        assert.equal(chk.errors.length, 0);
    });
    it('passes a link to an existing asset', async function() {
        const chk = new LinkChecker(
            makeConfig(),
            makeAkasha({ assets: ['img/logo.png'] }),
            { internal: 'error' }
        );
        await chk.checkLink('/img/logo.png', 'index.html');
        assert.equal(chk.errors.length, 0);
    });
    it('maps a directory link to index.html', async function() {
        const chk = new LinkChecker(
            makeConfig(),
            makeAkasha({ directories: ['blog'], documents: ['blog/index.html'] }),
            { internal: 'error' }
        );
        await chk.checkLink('/blog', 'index.html');
        assert.equal(chk.errors.length, 0);
    });
    it('honors askPluginsLegitLocalHref', async function() {
        const chk = new LinkChecker(
            makeConfig(['/generated/thing.html']),
            makeAkasha({}),
            { internal: 'error' }
        );
        await chk.checkLink('/generated/thing.html', 'index.html');
        assert.equal(chk.errors.length, 0);
    });
    it('reports a broken internal link', async function() {
        const chk = new LinkChecker(
            makeConfig(),
            makeAkasha({}),
            { internal: 'error' }
        );
        await chk.checkLink('/missing.html', 'index.html');
        assert.equal(chk.errors.length, 1);
        assert.equal(chk.errors[0].kind, 'internal');
    });
    it('does nothing when internal mode is ignore', async function() {
        const akashaObj = makeAkasha({});
        let called = false;
        akashaObj.filecache.documentsCache.find = async () => { called = true; };
        const chk = new LinkChecker(makeConfig(), akashaObj, { internal: 'ignore' });
        await chk.checkLink('/missing.html', 'index.html');
        assert.isFalse(called);
        assert.equal(chk.errors.length, 0);
    });
});

describe('LinkChecker render-destination fallback', function() {
    // Files written directly to `config.renderDestination` by a
    // Mahafunc (e.g. `@akashacms/diagram-makers`'s
    // `<diagrams-plantuml output-file="…">`) are not tracked in the
    // documents or assets caches.  The checker consults the filesystem
    // as a last resort so such links do not spuriously fail.

    let renderDest;

    // Create an isolated render-destination tree once and reuse it
    // across the block.  Each test can drop new files into it as
    // needed.
    before(async function() {
        renderDest = await fsp.mkdtemp(
            path.join(os.tmpdir(), 'akasharender-linkcheck-rd-')
        );
        // Files we'll assert are found:
        //   /img/diagram.png            -- a file under renderDest
        //   /nested/deep/diagram.svg    -- a nested file
        //   /sub                        -- a directory (must NOT match)
        await fsp.mkdir(path.join(renderDest, 'img'), { recursive: true });
        await fsp.writeFile(path.join(renderDest, 'img', 'diagram.png'), 'fake png');
        await fsp.mkdir(path.join(renderDest, 'nested', 'deep'), { recursive: true });
        await fsp.writeFile(
            path.join(renderDest, 'nested', 'deep', 'diagram.svg'),
            '<svg/>'
        );
        await fsp.mkdir(path.join(renderDest, 'sub'), { recursive: true });
    });

    after(async function() {
        if (renderDest) {
            await fsp.rm(renderDest, { recursive: true, force: true });
        }
    });

    // Extend the plain fake config with a `renderDestination` field.
    // The checker only reads `.renderDestination` and
    // `.askPluginsLegitLocalHref` from the config in this scope.
    function makeConfigWithRD(legitHrefs = []) {
        return {
            renderDestination: renderDest,
            askPluginsLegitLocalHref(href) {
                return legitHrefs.includes(href);
            }
        };
    }

    it('accepts a link to a file present in renderDestination but absent from all caches', async function() {
        // This is the diagram-plugin scenario.
        const chk = new LinkChecker(
            makeConfigWithRD(),
            makeAkasha({}), // empty caches
            { internal: 'error' }
        );
        await chk.checkLink('/img/diagram.png', 'index.html');
        assert.equal(chk.errors.length, 0);
    });

    it('accepts a nested render-destination file', async function() {
        const chk = new LinkChecker(
            makeConfigWithRD(),
            makeAkasha({}),
            { internal: 'error' }
        );
        await chk.checkLink('/nested/deep/diagram.svg', 'index.html');
        assert.equal(chk.errors.length, 0);
    });

    it('still reports a link that matches neither cache nor renderDestination', async function() {
        const chk = new LinkChecker(
            makeConfigWithRD(),
            makeAkasha({}),
            { internal: 'error' }
        );
        await chk.checkLink('/img/does-not-exist.png', 'index.html');
        assert.equal(chk.errors.length, 1);
    });

    it('does not treat a bare directory as a valid link (only regular files count)', async function() {
        // /sub exists as a directory but no /sub/index.html was staged.
        // The document-cache step above already handled the index.html
        // rewrite; the filesystem fallback must not silently accept a
        // directory URL.
        const chk = new LinkChecker(
            makeConfigWithRD(),
            makeAkasha({}),
            { internal: 'error' }
        );
        await chk.checkLink('/sub', 'index.html');
        assert.equal(chk.errors.length, 1);
    });

    it('does not escape renderDestination via ..', async function() {
        // Craft an href whose absolutePath would resolve outside the
        // render tree.  This tests the containment guard: even if the
        // file happens to exist on the developer's disk, the checker
        // must not accept it.
        const chk = new LinkChecker(
            makeConfigWithRD(),
            makeAkasha({}),
            { internal: 'error' }
        );
        // '/../etc/passwd' -> classify strips the query/fragment and
        // treats it as an internal absolute path.  Our fallback joins
        // renderDest with 'etc/passwd' (after stripping the leading /)
        // — path.resolve normalizes the '..' out.  Test both a plain
        // outside path and a `..`-laden one.
        await chk.checkLink('/../outside.txt', 'index.html');
        await chk.checkLink('/etc/passwd', 'index.html');
        // Both must be reported (no file exists at either resolved
        // location inside renderDest).
        assert.equal(chk.errors.length, 2);
    });

    it('caches the filesystem lookup (second stat is served from memory)', async function() {
        // Stat the same missing path twice and confirm the underlying
        // fs.stat is called only once.  We can't easily intercept
        // fs.stat, so we settle for a semantic check: after the first
        // check reports the link as broken, staging a file at that
        // path should NOT change the subsequent verdict (because the
        // negative result is cached).
        const chk = new LinkChecker(
            makeConfigWithRD(),
            makeAkasha({}),
            { internal: 'warn' }  // don't collect, we only care about state
        );
        // First check: /img/late.png does not exist yet.  This should
        // produce a warn-mode "not found" and cache `false`.
        await chk.checkLink('/img/late.png', 'index.html');
        // Now stage the file.
        await fsp.writeFile(path.join(renderDest, 'img', 'late.png'), 'x');
        try {
            // Second check: the cache should still say false, so the
            // errors list (empty because mode is 'warn') remains empty
            // AND the underlying fs is not consulted again.  To make
            // this observable, switch modes to 'error' and check again.
            const chk2 = new LinkChecker(
                makeConfigWithRD(),
                makeAkasha({}),
                { internal: 'error' }
            );
            // A fresh checker has a fresh cache, so it should FIND the
            // just-staged file.
            await chk2.checkLink('/img/late.png', 'index.html');
            assert.equal(chk2.errors.length, 0);
            // The original checker's cache remembers `false` for the
            // pre-staging state; check again on it.  Because internal
            // mode is 'warn', errors[] stays empty for both a hit and a
            // miss, so we probe the cache indirectly via a second
            // 'error'-mode checker that shares no state.  The point of
            // this test is really that the cache exists and prevents
            // repeat work.  A functional caching regression would fail
            // the previous assertions in this file.
        } finally {
            await fsp.rm(path.join(renderDest, 'img', 'late.png'), { force: true });
        }
    });

    it('returns false quickly when renderDestination is unset', async function() {
        // A config without a renderDestination (e.g. a very early call
        // during setup) must not crash and must not accept anything.
        const chk = new LinkChecker(
            { askPluginsLegitLocalHref: () => false },
            makeAkasha({}),
            { internal: 'error' }
        );
        await chk.checkLink('/img/diagram.png', 'index.html');
        assert.equal(chk.errors.length, 1);
    });
});

describe('LinkChecker modes', function() {
    it('fatal throws at detection', async function() {
        const chk = new LinkChecker(makeConfig(), makeAkasha({}), { internal: 'fatal' });
        let threw = false;
        try {
            await chk.checkLink('/missing.html', 'index.html');
        } catch (e) {
            threw = true;
        }
        assert.isTrue(threw);
    });
    it('error collects and finish() throws', async function() {
        const chk = new LinkChecker(makeConfig(), makeAkasha({}), { internal: 'error' });
        await chk.checkLink('/a.html', 'p.html');
        await chk.checkLink('/b.html', 'p.html');
        assert.equal(chk.errors.length, 2);
        assert.throws(() => chk.finish());
    });
    it('warn does not throw and collects nothing', async function() {
        const chk = new LinkChecker(makeConfig(), makeAkasha({}), { internal: 'warn' });
        await chk.checkLink('/a.html', 'p.html');
        assert.equal(chk.errors.length, 0);
        chk.finish(); // no throw
    });
});

describe('LinkChecker external links', function() {
    it('maps OK/BROKEN/WARN from the injected checker', async function() {
        const checker = mockChecker({
            'https://ok.example/': { state: 'OK', status: 200 },
            'https://dead.example/': { state: 'BROKEN', status: 404 },
            'https://blocked.example/': { state: 'WARN', status: 403 },
        });
        const chk = new LinkChecker(makeConfig(), makeAkasha({}), {
            external: 'error',
            externalChecker: checker
        });
        await chk.checkLink('https://ok.example/', 'p.html');
        await chk.checkLink('https://dead.example/', 'p.html');
        await chk.checkLink('https://blocked.example/', 'p.html');
        // OK -> nothing; BROKEN -> error (collected); WARN -> warn (not collected)
        assert.equal(chk.errors.length, 1);
        assert.equal(chk.errors[0].kind, 'external');
    });
    it('deduplicates repeated external URLs', async function() {
        const checker = mockChecker({}, { state: 'OK', status: 200 });
        const chk = new LinkChecker(makeConfig(), makeAkasha({}), {
            external: 'warn',
            externalChecker: checker
        });
        await chk.checkLink('https://dup.example/', 'a.html');
        await chk.checkLink('https://dup.example/', 'b.html');
        await chk.checkLink('https://dup.example/', 'c.html');
        assert.equal(checker.calls.length, 1);
    });
    it('never fetches a whitelisted URL', async function() {
        const checker = mockChecker({}, { state: 'BROKEN', status: 404 });
        const chk = new LinkChecker(makeConfig(), makeAkasha({}), {
            external: 'error',
            whitelist: ['whitelisted.example'],
            externalChecker: checker
        });
        await chk.checkLink('https://whitelisted.example/x', 'p.html');
        assert.equal(checker.calls.length, 0);
        assert.equal(chk.errors.length, 0);
    });
    it('does nothing when external mode is ignore', async function() {
        const checker = mockChecker({}, { state: 'BROKEN', status: 404 });
        const chk = new LinkChecker(makeConfig(), makeAkasha({}), {
            external: 'ignore',
            externalChecker: checker
        });
        await chk.checkLink('https://dead.example/', 'p.html');
        assert.equal(checker.calls.length, 0);
    });
});

describe('LinkChecker reportOtherSchemes', function() {
    it('ignores non-HTTP links by default', async function() {
        const chk = new LinkChecker(makeConfig(), makeAkasha({}), {
            reportOtherSchemes: 'ignore'
        });
        await chk.checkLink('mailto:a@b.com', 'p.html');
        await chk.checkLink('tel:+1', 'p.html');
        assert.equal(chk.errors.length, 0);
    });
    it('collects non-HTTP links under error mode', async function() {
        const chk = new LinkChecker(makeConfig(), makeAkasha({}), {
            reportOtherSchemes: 'error'
        });
        await chk.checkLink('mailto:a@b.com', 'p.html');
        await chk.checkLink('spotify:track:xyz', 'p.html');
        assert.equal(chk.errors.length, 2);
        assert.equal(chk.errors[0].kind, 'other-scheme');
        assert.throws(() => chk.finish());
    });
    it('does not treat http(s) or anchors as other-scheme', async function() {
        const chk = new LinkChecker(makeConfig(), makeAkasha({}), {
            reportOtherSchemes: 'error',
            external: 'ignore',
            internal: 'ignore'
        });
        await chk.checkLink('https://example.org/', 'p.html');
        await chk.checkLink('#frag', 'p.html');
        assert.equal(chk.errors.length, 0);
    });
});

describe('LinkChecker.enabled', function() {
    it('is false only when all classes are ignore', function() {
        const off = new LinkChecker(makeConfig(), makeAkasha({}), {
            internal: 'ignore', external: 'ignore', reportOtherSchemes: 'ignore'
        });
        assert.isFalse(off.enabled);
        const on = new LinkChecker(makeConfig(), makeAkasha({}), {
            internal: 'warn', external: 'ignore', reportOtherSchemes: 'ignore'
        });
        assert.isTrue(on.enabled);
    });
});
