---
title: "Render Skips Up-To-Date Documents - Use forceRenderAll in Build-Verify Tests"
type: memory
Sources:
  - lib/render.ts
  - lib/built-in.ts
  - test/index.mjs
  - test/rebased.mjs
  - test/test-relative.mjs
Categories:
  - rendering
  - testing
Symptoms:
  - "test asserts a resized image file but finds the original full-size file (e.g. width 900 instead of 50)"
  - "stale or wrong rendered output after switching a test from legacy akasha.render to the RenderingResults-based render"
  - "image resize tests fail only when output directory already has files"
Keywords:
  - render
  - render2
  - forceRenderAll
  - isDocumentUpToDate
  - incremental rendering
  - copyAssets
  - image resize
  - resizequeue
  - Mahabhuta
date-created: 2026-09-03T17:35:00+03:00
last-updated: 2026-09-03T18:15:00+03:00
confidence: high
---

# Render Skips Up-To-Date Documents - Use forceRenderAll in Build-Verify Tests

> Names changed on 2026-09-03: the former `render2` was renamed to `render` when the legacy string-returning `render` was deleted. This page uses the new names.

## Context

While executing Phase 1 of [Removing the Legacy Non-2 Render Functions](../implementation/removing-legacy-render-functions.md), the three build-and-verify suites (`test/index.mjs`, `test/rebased.mjs`, `test/test-relative.mjs`) were switched from legacy `akasha.render(config)` to the structured-results renderer (then named `render2`, now `render`). The image-resize tests then failed with e.g. `900 == 50` — but only when the output directory already contained files, and the same tests passed on the legacy code path.

## Technique

When a test (or any caller) needs an unconditional full re-render, pass the
force flag:

```js
let results = await akasha.render(config, { forceRenderAll: true });
```

Also use the structured result shape: results are `RenderingResults` objects
with an `errors` **array** (the legacy path returned strings and a singular
`error` field):

```js
for (let result of results) {
    if (result.errors?.length) { failed = true; console.error(result.errors); }
}
```

Why `forceRenderAll` is required: `render` skips any document whose output
file is newer than its source and layout (`isDocumentUpToDate`). Skipping a
document skips its **Mahabhuta stage**. Several Built-in Plugin side effects
happen only in that stage — most notably populating the image-resize queue
(`addImageToResize`, drained in `onSiteRendered`). These test suites run
`config.copyAssets()` before rendering, which overwrites previously resized
in-place images (e.g. `out-rebased/img/Human-Skeleton.jpg`) with the original
full-size file. If documents are then skipped, the resize queue stays empty
and the original file is never re-resized.

## Pitfalls

- A "clean output directory" is **not** sufficient in these suites: `copyAssets()` runs *before* rendering and re-copies originals over resized output. `forceRenderAll` is the reliable equivalent of legacy behavior.
- `skipped: true` results have no `errors` field — use optional chaining when checking.
- `test-incremental.mjs` Scenario 4 compares wall-clock durations ("rebuild should be faster than forced build") and is flaky under full-suite machine load; it passes reliably in isolation. Do not mistake it for a regression from rendering changes.

## Sources

- [lib/render.ts](../../../lib/render.ts) — `render` (formerly `render2`) and `isDocumentUpToDate` skip logic
- [lib/built-in.ts](../../../lib/built-in.ts) — `addImageToResize` / resize queue drained after rendering
- [test/rebased.mjs](../../../test/rebased.mjs) — failing assertions on in-place resized files

## Related Pages

- [Memory index](./README.md)
- [Removing the Legacy Non-2 Render Functions](../implementation/removing-legacy-render-functions.md)
- [How the AkashaCMS Page Rendering Process Works](../answers/how-page-rendering-works.md)

## Backlinks

- [Removing the Legacy Non-2 Render Functions](../implementation/removing-legacy-render-functions.md)
