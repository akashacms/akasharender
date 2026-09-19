/**
 * Tests for Configuration#addAssetsDir / addDocumentsDir /
 * addLayoutsDir / addPartialsDir:
 *
 * - `dest` normalization: a leading `/` on `dest` is stripped at
 *   ingestion time (except for the `'/'` root sentinel) so that the
 *   stored `vpath`/`renderPath` values in the caches are canonical.
 *
 * - Duplicate-mount detection: registering the same
 *   `(canonical src, canonical dest)` pair twice logs a
 *   `console.warn` (non-fatal).  This catches the class of bug where
 *   both the site's config and a plugin mount the same source tree
 *   at the same destination, which produces duplicate cache rows and
 *   causes `copyAssets` to race on `fsp.cp`'s internal `unlink`.
 *
 * These are pure Configuration-level unit tests; no rendering is
 * performed and no cache is initialized.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import { assert } from './test-assert.mjs';
import * as akasha from '../dist/index.js';

/**
 * Capture calls to `console.warn` for the duration of the test.
 * Returns an object with a `messages` array and a `restore()` function
 * that puts the real `console.warn` back.
 */
function captureWarnings() {
    const original = console.warn;
    const messages = [];
    console.warn = (...args) => {
        messages.push(args.map(a =>
            typeof a === 'string' ? a : JSON.stringify(a)
        ).join(' '));
    };
    return {
        messages,
        restore() { console.warn = original; }
    };
}

/** Build a fresh Configuration with a stable configDir for each test. */
function makeConfig() {
    const config = new akasha.Configuration();
    config.configDir = '/tmp/akasharender-mount-tests';
    return config;
}

describe('Configuration dest normalization', () => {

    it('strips a leading / from addAssetsDir dest', () => {
        const config = makeConfig();
        config.addAssetsDir({ src: '/abs/src/a', dest: '/vendor/a' });
        assert.equal(config.assetDirs.length, 1);
        assert.equal(config.assetDirs[0].dest, 'vendor/a');
    });

    it('strips a leading / from addDocumentsDir dest', () => {
        const config = makeConfig();
        config.addDocumentsDir({ src: '/abs/src/d', dest: '/mounted/d' });
        assert.equal(config.documentDirs.length, 1);
        assert.equal(config.documentDirs[0].dest, 'mounted/d');
    });

    it('strips a leading / from addLayoutsDir dest', () => {
        const config = makeConfig();
        config.addLayoutsDir({ src: '/abs/src/l', dest: '/layouts/l' });
        assert.equal(config.layoutDirs.length, 1);
        assert.equal(config.layoutDirs[0].dest, 'layouts/l');
    });

    it('strips a leading / from addPartialsDir dest', () => {
        const config = makeConfig();
        config.addPartialsDir({ src: '/abs/src/p', dest: '/partials/p' });
        assert.equal(config.partialsDirs.length, 1);
        assert.equal(config.partialsDirs[0].dest, 'partials/p');
    });

    it('strips repeated leading slashes', () => {
        const config = makeConfig();
        config.addAssetsDir({ src: '/abs/src/a', dest: '///vendor/a' });
        assert.equal(config.assetDirs[0].dest, 'vendor/a');
    });

    it('preserves the /-root sentinel', () => {
        // '/' is a magic value that VFStack interprets as "mount at the
        // virtual filesystem root".  It must NOT be normalized to ''.
        const config = makeConfig();
        config.addAssetsDir({ src: '/abs/src/a', dest: '/' });
        assert.equal(config.assetDirs[0].dest, '/');
    });

    it('leaves a non-slash-prefixed dest unchanged', () => {
        const config = makeConfig();
        config.addAssetsDir({ src: '/abs/src/a', dest: 'vendor/a' });
        assert.equal(config.assetDirs[0].dest, 'vendor/a');
    });

    it('gives a bare string arg dest = "/" (unchanged)', () => {
        const config = makeConfig();
        config.addAssetsDir('/abs/src/a');
        assert.equal(config.assetDirs[0].dest, '/');
    });

    it('does not mutate the caller\'s dirToMount object', () => {
        const config = makeConfig();
        const arg = { src: '/abs/src/a', dest: '/vendor/a' };
        config.addAssetsDir(arg);
        // The caller's object must still show the original dest.
        assert.equal(arg.dest, '/vendor/a');
        // But the stored copy is normalized.
        assert.equal(config.assetDirs[0].dest, 'vendor/a');
    });
});

describe('Configuration duplicate-mount detection', () => {

    let cap;
    beforeEach(() => { cap = captureWarnings(); });
    afterEach(() => { cap.restore(); });

    it('warns when addAssetsDir is called twice with the same src and dest', () => {
        const config = makeConfig();
        config.addAssetsDir({ src: '/abs/src/a', dest: 'vendor/a' });
        config.addAssetsDir({ src: '/abs/src/a', dest: 'vendor/a' });
        // Both mounts are still recorded (Position 2: warn, do not skip).
        assert.equal(config.assetDirs.length, 2);
        assert.equal(cap.messages.length, 1);
        assert.include(cap.messages[0], 'addAssetsDir');
        assert.include(cap.messages[0], 'duplicate mount');
        assert.include(cap.messages[0], '/abs/src/a');
        assert.include(cap.messages[0], 'vendor/a');
    });

    it('warns when addDocumentsDir is called twice with the same src and dest', () => {
        const config = makeConfig();
        config.addDocumentsDir({ src: '/abs/src/d', dest: 'sub' });
        config.addDocumentsDir({ src: '/abs/src/d', dest: 'sub' });
        assert.equal(cap.messages.length, 1);
        assert.include(cap.messages[0], 'addDocumentsDir');
    });

    it('warns when addLayoutsDir is called twice with the same src and dest', () => {
        const config = makeConfig();
        config.addLayoutsDir({ src: '/abs/src/l', dest: 'l' });
        config.addLayoutsDir({ src: '/abs/src/l', dest: 'l' });
        assert.equal(cap.messages.length, 1);
        assert.include(cap.messages[0], 'addLayoutsDir');
    });

    it('warns when addPartialsDir is called twice with the same src and dest', () => {
        const config = makeConfig();
        config.addPartialsDir({ src: '/abs/src/p', dest: 'p' });
        config.addPartialsDir({ src: '/abs/src/p', dest: 'p' });
        assert.equal(cap.messages.length, 1);
        assert.include(cap.messages[0], 'addPartialsDir');
    });

    it('warns when the second call differs only by dest\'s leading slash', () => {
        // This is the class of bug that caused the akashacms-website
        // bootstrap failure: one caller uses `/vendor/foo`, another uses
        // `vendor/foo`.  Both normalize to `vendor/foo`.
        const config = makeConfig();
        config.addAssetsDir({ src: '/abs/src/a', dest: 'vendor/a' });
        config.addAssetsDir({ src: '/abs/src/a', dest: '/vendor/a' });
        assert.equal(cap.messages.length, 1);
    });

    it('does NOT warn when the same src is mounted at different dests (aliasing)', () => {
        // Legitimate: mount the same source at two paths.
        const config = makeConfig();
        config.addAssetsDir({ src: '/abs/src/a', dest: 'vendor/a' });
        config.addAssetsDir({ src: '/abs/src/a', dest: 'legacy/a' });
        assert.equal(cap.messages.length, 0);
    });

    it('does NOT warn when different srcs are mounted at the same dest (stacking)', () => {
        // Legitimate: stacked directories share a dest so later entries
        // override earlier ones.
        const config = makeConfig();
        config.addPartialsDir({ src: '/abs/src/base', dest: '/' });
        config.addPartialsDir({ src: '/abs/src/override', dest: '/' });
        assert.equal(cap.messages.length, 0);
    });

    it('does NOT cross-warn across different mount kinds', () => {
        // A partial and an asset sharing an (src, dest) tuple is unusual
        // but not the same kind of duplicate: they populate different
        // caches and are checked independently.
        const config = makeConfig();
        config.addAssetsDir({ src: '/abs/src/x', dest: 'x' });
        config.addPartialsDir({ src: '/abs/src/x', dest: 'x' });
        assert.equal(cap.messages.length, 0);
    });

    it('warns once per duplicate call (three calls => two warnings)', () => {
        const config = makeConfig();
        config.addAssetsDir({ src: '/abs/src/a', dest: 'a' });
        config.addAssetsDir({ src: '/abs/src/a', dest: 'a' });
        config.addAssetsDir({ src: '/abs/src/a', dest: 'a' });
        assert.equal(cap.messages.length, 2);
    });

    it('deduplicates across string-arg and object-arg forms', () => {
        // The bare string form is equivalent to `{ src: <resolved>, dest: '/' }`.
        // Registering '/tmp/foo' as a string and again as { src, dest: '/' }
        // should be recognized as the same mount.
        const config = makeConfig();
        config.addAssetsDir('/tmp/foo');
        config.addAssetsDir({ src: '/tmp/foo', dest: '/' });
        assert.equal(cap.messages.length, 1);
    });
});
