---
title: "minimatch v10 Is Pure ESM — Import the Named Export"
type: memory
Sources:
  - test/test-cache.mjs
  - test/package.json
Categories:
  - testing
  - dependencies
Symptoms:
  - "SyntaxError: The requested module 'minimatch' does not provide an export named 'default'"
  - test-cache.mjs fails as a whole file in npm test with a module-load error
Keywords:
  - minimatch
  - test-cache
  - ESM
  - import
  - npm test
date-created: 2026-09-26T22:40:51+0300
last-updated: 2026-09-26T22:40:51+0300
confidence: high
---

# minimatch v10 Is Pure ESM — Import the Named Export

## Context

`cd test && npm test` failed at the `test-cache` step with:

```
file:///…/test/test-cache.mjs:7
import minimatch from 'minimatch';
       ^^^^^^^^^
SyntaxError: The requested module 'minimatch' does not provide an export named 'default'
```

The test directory depends on `minimatch: ^10.x`, and minimatch v10 is pure
ESM with **named** exports only (`minimatch`, `Minimatch`, `match`, …), so a
default-import fails at module-load time.

## Technique

Use the named export:

```js
import { minimatch } from 'minimatch';
```

To confirm what an ESM-only package actually exports before choosing the
import form:

```sh
node -e "import('minimatch').then(m => console.log(Object.keys(m)))"
```

## Pitfalls

- The failure surfaces as a **file-level** test failure (`✖ test-cache.mjs`,
  1 test, 0 pass) rather than an assertion failure, which can look like a
  flaky suite; read the stack trace for the `SyntaxError`.
- The same default-import pattern may lurk in other test files or plugins
  that were written against minimatch ≤ 9 (CJS-compatible).
- In the npm-workspaces layout, `test/` may resolve a hoisted root
  `node_modules/minimatch`; `npm ls minimatch` from the root shows where it
  comes from.

## Sources

- [test/test-cache.mjs](../../../test/test-cache.mjs) — the fixed import
- [test/package.json](../../../test/package.json) — `minimatch: ^10.x` dependency

## Related Pages

- [./README.md](./README.md)

## Backlinks

- [Memory index](./README.md)
