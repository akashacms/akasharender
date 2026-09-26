---
title: "Assets Cache findByPath Is Exact-Match — Use find() for Leading-Slash vpaths"
type: memory
Sources:
  - lib/cache/cache-sqlite.ts
  - ../tabler-icons/index.mjs
Categories:
  - caching
  - plugins
  - debugging
Symptoms:
  - "TablerIconsElement no vpath for <name> during render"
  - a plugin's asset lookup returns undefined/[] even though the file was copied to out/
  - icon/custom-element Mahafuncs throw even though the asset exists
Keywords:
  - assetsCache
  - findByPath
  - find
  - vpath
  - leading slash
  - tabler-icons
  - ASSETS table
date-created: 2026-09-26T23:10:00+0300
last-updated: 2026-09-26T23:10:00+0300
confidence: high
---

# Assets Cache findByPath Is Exact-Match — Use find() for Leading-Slash vpaths

## Context

`../akashacms-example` failed rendering `tabler-icons.html.md` with
`TablerIconsElement no vpath for category`, although
`out/vendor/tabler-icons/icons/filled/category.svg` existed.  The plugin's
`findIcon` looked up `path.join('/vendor/tabler-icons/icons', mode, name.svg)`
— a **leading-slash** vpath — with `assetsCache.findByPath()`.

## Technique

The ASSETS cache stores vpaths **without** a leading slash
(`vendor/tabler-icons/icons/filled/category.svg`).
`findByPath()` (`lib/cache/cache-sqlite.ts`) queries
`WHERE vpath = $vpath OR renderPath = $vpath` — exact match, no
normalization — so a leading-slash argument finds nothing.
`find()` strips the leading `/` (and accepts either vpath or renderPath), so
it succeeds where `findByPath` fails.  It also returns the entry object
directly instead of an array.  Diagnose live with the project's own config:

```js
const assets = config.akasha.filecache.assetsCache;
await assets.findByPath('/vendor/x/y'); // []
await assets.find('/vendor/x/y');       // { vpath: 'vendor/x/y', ... }
```

Plugins doing vpath lookups should prefer `find()`; reserve `findByPath` for
callers that already hold the stored (slash-less) form.

## Pitfalls

- `findByPath` is declared `protected` in TypeScript; plugins in plain
  `.mjs` can still call it at runtime, so the misuse does not fail loudly.
- `findFilledIcon`-style helpers that return `findByPath`'s array unextracted
  give callers a `[]`/object mismatch; `find()` removes that inconsistency.
- A render that *skips* up-to-date documents hides such errors; use
  `--force-render-all` to surface them.

## Sources

- [lib/cache/cache-sqlite.ts](../../../lib/cache/cache-sqlite.ts) — `findByPath` exact-match SQL vs `find()` normalization
- [../tabler-icons/index.mjs](../../../tabler-icons/index.mjs) — the fixed `findIcon`/`findFilledIcon`

## Related Pages

- [./README.md](./README.md)
- [Cache Schema](../concepts/cache-schema.md)
- [Link Checker Sentinel-Origin Collision (http://example.com Misclassified as Internal)](./link-checker-sentinel-origin-collision.md)

## Backlinks

- [Memory index](./README.md)
