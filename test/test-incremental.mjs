/**
 * Tests for incremental rendering: skipping documents whose output is
 * already up-to-date.  See https://github.com/akashacms/akasharender/issues/61
 *
 * These tests drive the CLI (`node ../dist/cli.js render ...`) exactly as
 * the "build" npm script does, using a configuration that renders into a
 * dedicated `out-incremental/` directory so it does not collide with the
 * other suites that use `out/`.
 *
 * Each CLI invocation is a fresh process, so the in-memory file cache is
 * re-scanned every time.  That is what makes a "touch one file then
 * rebuild" workflow observable: the rebuild sees the new source mtime and
 * re-renders just the affected documents.
 *
 * The scenarios:
 *   1. Full build with --force-render-all (baseline; nothing skipped).
 *   2. Rebuild without the flag (everything up-to-date => much faster,
 *      all HTML documents skipped).
 *   3. Touch one document, rebuild => that document is re-rendered (its
 *      output mtime advances) while the rest are skipped (still fast).
 *   4. Touch a shared layout template, rebuild => every document using
 *      that layout is re-rendered (their output mtimes advance).
 */

import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, it, before, after } from 'node:test';
import { assert } from './test-assert.mjs';

const __dirname = import.meta.dirname;

const CLI = path.join(__dirname, '..', 'dist', 'cli.js');
const CONFIG = 'config-incremental.mjs';
const OUT = path.join(__dirname, 'out-incremental');

// A document that uses the shared default.html.ejs layout.
const TOUCH_DOC = path.join(__dirname, 'documents', 'fig-img.html.md');
const TOUCH_DOC_OUTPUT = path.join(OUT, 'fig-img.html');

// The layout shared by many documents.
const TOUCH_LAYOUT = path.join(__dirname, 'layouts', 'default.html.ejs');
// A sample of output files known to be produced from documents that use
// default.html.ejs.  Touching the layout must re-render all of these.
const LAYOUT_OUTPUTS = [
    path.join(OUT, 'index.html'),
    path.join(OUT, 'anchor-cleanups.html'),
    path.join(OUT, 'body-class.html'),
    path.join(OUT, 'code-embed.html'),
    path.join(OUT, 'partials.html')
];

/**
 * Run the render CLI as a child process.  Returns the elapsed wall-clock
 * time (ms), the parsed counts of skipped vs rendered documents, and the
 * raw stdout for debugging.
 */
function runRender({ force = false } = {}) {
    const args = [CLI, 'render'];
    if (force) args.push('--force-render-all');
    args.push(CONFIG);

    const start = Date.now();
    const res = spawnSync(process.execPath, args, {
        cwd: __dirname,
        encoding: 'utf-8',
        maxBuffer: 64 * 1024 * 1024
    });
    const elapsed = Date.now() - start;

    if (res.status !== 0) {
        throw new Error(
            `render exited with ${res.status}\n`
            + `STDOUT:\n${res.stdout}\nSTDERR:\n${res.stderr}`
        );
    }

    const stdout = res.stdout ?? '';
    const lines = stdout.split('\n');
    let skipped = 0;
    let rendered = 0;
    for (const line of lines) {
        if (line.startsWith('SKIPPED ')) {
            skipped++;
        } else if (/ ==> /.test(line) && !line.startsWith('SKIPPED ')) {
            // Non-skipped result lines have the form
            //   "HTML foo.html.md ==> foo.html"
            rendered++;
        }
    }
    return { elapsed, skipped, rendered, stdout };
}

async function mtimeOf(file) {
    const st = await fsp.stat(file);
    return st.mtimeMs;
}

/**
 * Set a file's mtime to "now + 2s" so that it is unambiguously newer than
 * any previously-written output file, regardless of filesystem mtime
 * granularity.
 */
async function touchFuture(file) {
    const when = new Date(Date.now() + 2000);
    await fsp.utimes(file, when, when);
}

describe('Incremental rendering (issue #61)', function() {

    // Time of the initial forced build, shared across scenarios.
    let forceElapsed;
    // The number of HTML documents (skippable on a clean rebuild).
    let htmlCount;

    before(async function() {
        // Start from a clean output directory so the first build is a
        // genuine full render.
        await fsp.rm(OUT, { recursive: true, force: true });
    });

    after(async function() {
        // These scenarios advance the mtimes of source fixtures.  Reset
        // them to "now" so the working tree is left in a sane state and
        // future runs (or other suites) are not affected by the
        // artificially future-dated timestamps.
        const now = new Date();
        for (const f of [TOUCH_DOC, TOUCH_LAYOUT]) {
            try {
                await fsp.utimes(f, now, now);
            } catch (err) { /* ignore */ }
        }
        // Remove the dedicated output directory.
        await fsp.rm(OUT, { recursive: true, force: true });
    });

    it('Scenario 1: full build with --force-render-all renders everything', async function() {
        const result = runRender({ force: true });

        // Nothing should be skipped on a forced build.
        assert.equal(result.skipped, 0,
            `forced build should skip nothing, skipped=${result.skipped}`);
        // It should render a meaningful number of documents.
        assert.isTrue(result.rendered > 1,
            `forced build should render many documents, rendered=${result.rendered}`);

        forceElapsed = result.elapsed;
        htmlCount = result.rendered;
    });

    it('Scenario 2: rebuild with no changes skips all HTML and is much faster', async function() {
        const result = runRender({ force: false });

        // Every HTML document should now be skipped.
        assert.isTrue(result.skipped > 1,
            `clean rebuild should skip many documents, skipped=${result.skipped}`);
        // Only non-HTML outputs (e.g. CSS/LESS) are re-processed; HTML
        // documents are all skipped.
        assert.isTrue(result.rendered < htmlCount,
            `clean rebuild should render far fewer than the ${htmlCount} from the forced build, rendered=${result.rendered}`);

        // The incremental rebuild must be substantially faster than the
        // forced full build.  A generous margin avoids CI flakiness.
        assert.isTrue(result.elapsed < forceElapsed,
            `incremental rebuild (${result.elapsed}ms) should be faster than forced build (${forceElapsed}ms)`);
    });

    it('Scenario 3: touching one document re-renders only that document', async function() {
        const before = await mtimeOf(TOUCH_DOC_OUTPUT);

        // Make the source document newer than its output.
        await touchFuture(TOUCH_DOC);

        const result = runRender({ force: false });

        // Most documents are still skipped (so it stays fast).
        assert.isTrue(result.skipped > 1,
            `most documents should still be skipped, skipped=${result.skipped}`);
        assert.isTrue(result.elapsed < forceElapsed,
            `rebuild (${result.elapsed}ms) should be faster than forced build (${forceElapsed}ms)`);

        // The touched document must NOT be among the skipped set.
        assert.isFalse(
            result.stdout.includes('SKIPPED HTML fig-img.html.md'),
            `the touched document fig-img.html.md should have been re-rendered, not skipped`);

        // Its output file timestamp must have advanced.
        const after = await mtimeOf(TOUCH_DOC_OUTPUT);
        assert.isTrue(after > before,
            `output mtime should advance after touching the document (before=${before}, after=${after})`);
    });

    it('Scenario 4: touching a shared layout re-renders all documents using it', async function() {
        // Record output timestamps for several documents that use the
        // default.html.ejs layout.
        const beforeTimes = {};
        for (const f of LAYOUT_OUTPUTS) {
            beforeTimes[f] = await mtimeOf(f);
        }

        // Make the layout newer than the existing output files.
        await touchFuture(TOUCH_LAYOUT);

        const result = runRender({ force: false });

        // The rebuild should still be faster than a full forced build.
        assert.isTrue(result.elapsed < forceElapsed,
            `rebuild (${result.elapsed}ms) should be faster than forced build (${forceElapsed}ms)`);

        // Every sampled output file that uses the layout must have been
        // re-rendered (its timestamp advanced).
        for (const f of LAYOUT_OUTPUTS) {
            const after = await mtimeOf(f);
            assert.isTrue(after > beforeTimes[f],
                `output ${path.basename(f)} should be re-rendered after touching its layout `
                + `(before=${beforeTimes[f]}, after=${after})`);
        }

        // None of those documents should appear in the skipped set.
        for (const f of LAYOUT_OUTPUTS) {
            const renderPath = path.basename(f);
            assert.isFalse(
                skippedIncludes(result.stdout, renderPath),
                `document rendering to ${renderPath} should not be skipped after its layout changed`);
        }

        // A layout change affects many documents, so the number rendered
        // here should be substantially more than the single document of
        // Scenario 3.
        assert.isTrue(result.rendered >= LAYOUT_OUTPUTS.length,
            `touching the shared layout should re-render at least ${LAYOUT_OUTPUTS.length} documents, rendered=${result.rendered}`);
    });
});

/**
 * Returns true if the CLI output contains a SKIPPED line whose render
 * path matches the given output basename.
 */
function skippedIncludes(stdout, renderBasename) {
    for (const line of stdout.split('\n')) {
        if (line.startsWith('SKIPPED ')
         && line.includes(`==> ${renderBasename}`)) {
            return true;
        }
    }
    return false;
}
