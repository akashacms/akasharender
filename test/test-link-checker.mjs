
import { describe, it } from 'node:test';
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
