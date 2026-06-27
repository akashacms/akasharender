# AkashaRender Test Directory Guidelines

This document describes how to write tests, create test fixtures, and validate rendering correctness for AkashaRender.

## Test Framework

Tests use the Node.js built-in test runner (**`node:test`**) as the test
runner.  Assertions use a small Chai-compatible helper, `test-assert.mjs`,
which is implemented on top of `node:assert`.  Test files are ES modules
with the `.mjs` extension.  Mocha and Chai are no longer used.

### Basic Test Structure

```javascript
import { describe, it, before, after } from 'node:test';
import { assert } from './test-assert.mjs';
import * as akasha from '../dist/index.js';
const filecache = await import('../dist/cache/cache-sqlite.js');

describe('Feature name', function() {
    it('should do something specific', async function() {
        const result = await someApiFunction();

        assert.isDefined(result);
        assert.isArray(result);
        assert.equal(result.length, 3);
    });
});
```

### Notes on the migration from Mocha/Chai

- `describe`, `it`, `before`, and `after` are imported from `node:test`.
- The `assert` object comes from the local `test-assert.mjs` helper, which
  provides the Chai `assert.*` methods used by this suite (`equal`,
  `include`, `isTrue`, `isOk`, `exists`, `isArray`, `match`, `throws`,
  etc.) backed by `node:assert`.  If a test needs an assertion that the
  helper does not yet provide, add it to `test-assert.mjs`.
- Mocha's `this.timeout(...)` is **not** available.  `node:test` does not
  apply a default per-test timeout, so long-running tests no longer need
  one.  If you must bound a test's run time, pass an options object:
  `it('name', { timeout: 75000 }, async () => { ... })`.
- Do not reference `this` inside test callbacks; `node:test` passes a
  `TestContext` as the first argument instead.

### Key Test Files

- `index.mjs` - Main test suite, builds and renders the full test site
- `test-cache.mjs` - Tests for caching, document queries, tags, and search functionality
- `test-vfstack.mjs` - Tests for the virtual filesystem stack

## Test Configuration

Tests use a programmatic configuration rather than a config file. See the `describe('Initialize...')` blocks in test files for examples.

```javascript
config = new akasha.Configuration();
config.rootURL("https://example.akashacms.com");
config.configDir = __dirname;
config
    .addAssetsDir('assets')
    .addLayoutsDir('layouts')
    .addDocumentsDir('documents')
    .addPartialsDir('partials');
config.prepare();
await akasha.setup(config);
```

## Test Fixtures

### Document Fixtures

Place test documents in `test/documents/`. Documents are Markdown or other renderable formats with YAML frontmatter.

```markdown
---
layout: default.html.ejs
title: Test Document Title
publicationDate: 2021-11-19
tags:
    - Tag1
    - Tag2
---

Document content here.
```

### Directory Structure

```
test/
├── documents/       # Source documents (Markdown, etc.)
├── layouts/         # Layout templates (EJS, Nunjucks)
├── layouts-extra/   # Additional layouts (tests directory stacking)
├── partials/        # Partial templates
├── partials2/       # Additional partials (tests directory stacking)
├── assets/          # Static assets
├── assets2/         # Additional assets (tests directory stacking)
├── mounted/         # Documents mounted at a subdirectory
├── mounted2/        # Tests overriding files in mounted/
└── out/             # Rendered output directory
```

### Stacked Directory Testing

Multiple directories can be stacked to test file overriding. The order of `addDocumentsDir()` calls determines priority - later additions override earlier ones.

## Testing Patterns

### Testing API Functions (Preferred)

Test the underlying API functions rather than CLI commands:

```javascript
// Good: Test the API directly
it('should find all tags', async function() {
    const found = await filecache.documentsCache.tags();
    assert.isArray(found);
    assert.equal(found.length, 12);
});

// Good: Test search functionality
it('should find documents with Tag1', async function() {
    const found = await filecache.documentsCache.search({
        tag: 'Tag1'
    });
    assert.equal(found.length, 1);
    assert.equal(found[0].vpath, 'tags-array.html.md');
});
```

### Testing Document Metadata

```javascript
it('should find tags in document', async function() {
    const found = await filecache.documentsCache.find('tags-array.html');
    
    assert.isDefined(found);
    assert.isDefined(found.metadata);
    assert.isDefined(found.metadata.tags);
    assert.isArray(found.metadata.tags);
    assert.isTrue(found.metadata.tags.includes('Tag1'));
});
```

### Validating Rendered Output

Use `akasha.readRenderedFile()` to read rendered HTML and query it with jQuery-like selectors:

```javascript
it('should render correctly', async function() {
    let { html, $ } = await akasha.readRenderedFile(config, 'page.html');
    
    // Check content exists
    assert.exists(html);
    assert.isString(html);
    
    // Query rendered DOM
    assert.equal($('head title').length, 1);
    assert.equal($('h1').text(), 'Expected Title');
    assert.equal($('a[href="/path/to/page"]').length, 1);
    
    // Check for absence
    assert.equal($('.should-not-exist').length, 0);
});
```

### Testing Tag Descriptions

Tag descriptions are configured in the test setup:

```javascript
config.addTagDescriptions([
    {
        tagName: 'NJK',
        description: 'NJK Template'
    },
    {
        tagName: 'Tag1',
        description: 'Tag1'
    }
]);
```

Then test retrieval:

```javascript
it('should find description for tag', async function() {
    const desc = await filecache.documentsCache.getTagDescription('NJK');
    assert.isDefined(desc);
    assert.equal(desc, 'NJK Template');
});

it('should return undefined for tag without description', async function() {
    const desc = await filecache.documentsCache.getTagDescription('Tag3');
    assert.equal(typeof desc, 'undefined');
});
```

## Running Tests

```bash
cd test
npm test              # Run full test suite
npm run test-normal   # Run main tests (node --test ./index.mjs)
npm run test-cache    # Run cache tests
npm run test-rebased  # Run rebased tests
```

A single file can also be run directly:

```bash
node --test ./index.mjs
```

This directory is part of the parent npm workspaces setup (see the
`workspaces` array in `../../package.json`).  Running `npm install` from the
workspace root installs and links dependencies for the test directory, and
resolves `akasharender` from the live working-tree checkout.

## Common Assertions

These Chai-style methods are provided by `test-assert.mjs`:

```javascript
// Existence
assert.isDefined(value);
assert.exists(value);
assert.isUndefined(value);

// Types
assert.isArray(value);
assert.isString(value);
assert.isBoolean(value);
assert.isObject(value);

// Equality
assert.equal(actual, expected);
assert.deepEqual(actual, expected);

// Boolean
assert.isTrue(value);
assert.isFalse(value);
assert.isOk(value);  // truthy

// Arrays
assert.include(array, item);
assert.equal(array.length, expectedLength);

// Strings
assert.include(string, substring);
```

## Tips

1. **Set timeouts** for operations that involve file I/O or rendering: `this.timeout(25000);`

2. **Test both positive and negative cases** - verify that searches return expected results AND that they don't return incorrect results.

3. **Use descriptive test names** that explain what is being tested and expected outcome.

4. **Group related tests** in `describe` blocks for organization.

5. **Avoid modifying shared fixtures** in tests. If a test needs to modify files, use a dedicated directory or restore files after the test.

6. **Test edge cases** like empty arrays, missing fields, special characters in tags (quotes, apostrophes).
