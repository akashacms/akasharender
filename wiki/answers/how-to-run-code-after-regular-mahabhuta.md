---
title: "How To Run Code After All Regular Mahabhuta Processing, Before HTML Serialization"
type: answer
Sources:
  - lib/render.ts
  - lib/index.ts
  - lib/mahafuncs.ts
  - lib/built-in.ts
  - test/final-mahabhuta.js
  - node_modules/mahabhuta/dist/index.js
  - node_modules/mahabhuta/dist/MahafuncArray.js
Categories:
  - mahabhuta
  - dom-manipulation
  - plugins
  - extensibility
date-created: 2026-08-25T00:33:00+03:00
last-updated: 2026-08-25T00:33:00+03:00
confidence: high
---

# How To Run Code After All Regular Mahabhuta Processing, Before HTML Serialization

## Query

When a document is rendered, how do I execute some code doing Mahabhuta processing **after all the regular Mahabhuta processing is finished** but **before the Cheerio structures have been rendered back to HTML**? According to `../akashacms-website/documents/howto/final-post-processing.html.md`, calling `akasha.emitter.on('file-rendered', ...)` causes the callback to be executed after file rendering is finished, before the Cheerio structures are re-serialized. But `akasha.emitter` does not exist and the string `file-rendered` does not appear anywhere in the source. Presumably a different way to implement this was created?

## Answer

Yes — the replacement mechanism lives inside **Mahabhuta** itself, not in AkashaRender's source: the `MahafuncArray` class supports **final mahafuncs** — functions that run on the live Cheerio DOM *after* all regular mahafuncs, but *before* `processAsync()` serializes the DOM back to HTML with `$.html()`.

There is no `akasha.emitter` and no `file-rendered` event anywhere in `lib/` (verified by search). The how-to page's intended behavior is provided by the "final mahafunc" pattern:

### How It Works

In Mahabhuta's `processAsync()` (`node_modules/mahabhuta/dist/index.js:152`), the master array's `process()` iterates `this.functions` and then `this.final_functions` (source: [node_modules/mahabhuta/dist/MahafuncArray.js](../../node_modules/mahabhuta/dist/MahafuncArray.js):202: `for (let funclist of [this.functions, this.final_functions])`). Only after both lists complete does `processAsync()` return `$.html()` (source: [node_modules/mahabhuta/dist/index.js](../../node_modules/mahabhuta/dist/index.js):195). That is exactly the "after all regular Mahabhuta processing, before Cheerio is rendered back to HTML" window.

AkashaRender's per-document pipeline calls `mahabhuta.processAsync(...)`, passing `config.mahafuncs` as the function list (source: [lib/render.ts](../../lib/render.ts):495-505). Every object registered with `config.addMahabhuta()` (source: [lib/index.ts](../../lib/index.ts):1117-1121) participates in that run; the built-in plugin's own array runs last, in registration order, and its two final mahafuncs (`MungedAttrRemover`, `BlankLinkDefanger`) are registered with `addFinalMahafunc()` (source: [lib/built-in.ts](../../lib/built-in.ts):433-434) — so the project already relies on this exact pattern.

### How To Use It

```js
import * as mahabhuta from 'mahabhuta';

class MyFinalPass extends mahabhuta.Munger {
    get selector() { return 'html body'; }
    get elementName() { return 'html body'; }
    async process($, $element, metadata, dirty, done) {
        // Runs after every other mahafunc, while the DOM is still live.
        // `metadata` carries the document frontmatter; use metadata.vpath /
        // the fspath in the context to identify the source document.
        $element.attr('data-final-pass', 'done');
    }
}

const arr = new mahabhuta.MahafuncArray('my-final-pass', {});
arr.addFinalMahafunc(new MyFinalPass());
config.addMahabhuta(arr);
```

The relevant public API on the installed Mahabhuta version:

- `addFinalMahafunc(func)` (source: [node_modules/mahabhuta/dist/MahafuncArray.js](../../node_modules/mahabhuta/dist/MahafuncArray.js):169) — appends a final mahafunc.
- `setFinalMahafuncArray(arr)` (source: [node_modules/mahabhuta/dist/MahafuncArray.js](../../node_modules/mahabhuta/dist/MahafuncArray.js):144) — **replaces** the whole final list; prefer `addFinalMahafunc` to avoid clobbering.
- Final mahafuncs may be any supported mahafunc type, including a bare function (the function branch of `process()` is shared by both lists, source: [node_modules/mahabhuta/dist/MahafuncArray.js](../../node_modules/mahabhuta/dist/MahafuncArray.js):299-326).

An AkashaRender-specific variant is available: AkashaRender re-exports `PageProcessor` (and `Munger`, `CustomElement`, `ElementTweaker`) from `lib/mahafuncs.ts` with `config`/`akasha`/`plugin` getters (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts):108-123), so `class MyFinalPass extends PageProcessor { async process($, metadata, setDirty) { ... } }` works too — a `PageProcessor`'s `process()` receives the whole document rather than a selected element (source: [node_modules/mahabhuta/dist/PageProcessor.js](../../node_modules/mahabhuta/dist/PageProcessor.js):6-8).

The test fixture `test/final-mahabhuta.js` demonstrates the pattern — a `Munger` added via `addFinalMahafunc()` that stamps `final="ran"` onto `<body>`, then `config.addMahabhuta(final_array)` (source: [test/final-mahabhuta.js](../../test/final-mahabhuta.js):6-18).

### Caveats

- **Per-document, not per-site.** Every final mahafunc runs once per `processAsync()` call (per rendered document). For once-per-site work (sitemaps, image-resize queue, whole-site scans) use the plugin's `onSiteRendered(config)` hook instead (source: [lib/index.ts](../../lib/index.ts):1372-1378, [lib/built-in.ts](../../lib/built-in.ts):284).
- **Ordering.** Since arrays are run in the order they are added to `config.mahafuncs`, a final mahafunc in an array added *after* the built-in plugin's array runs after the built-in final mahafuncs. Register early if you must run before them.
- **Dirty flag.** A final mahafunc can still call `dirty`/`setDirty` to request another pass; `processAsync()` loops while the flag is set (source: [node_modules/mahabhuta/dist/index.js](../../node_modules/mahabhuta/dist/index.js):170-188).
- **`metadata` contents.** It is the document's frontmatter merged with a few fields (config, fspath); it is *not* the render context object.
- **Errors.** A throwing final mahafunc is caught by `processAsync`'s caller; in AkashaRender it becomes a `ret.results.errors` entry and the fallback (pre-Mahabhuta HTML) is used (source: [lib/render.ts](../../lib/render.ts):506-512).

### What the How-To Page Should Say

The how-to page `../akashacms-website/documents/howto/final-post-processing.html.md` in the akashacms-website project documents a mechanism (`akasha.emitter.on('file-rendered', ...)`) that has never been implemented in this codebase. It should be updated to describe `addFinalMahafunc()` on a `mahabhuta.MahafuncArray` added via `config.addMahabhuta()` — which satisfies both claims of the original page ("after regular Mahabhuta processing" and "before Cheerio is rendered back to HTML").

## Sources

- [lib/render.ts](../../lib/render.ts) — the per-document pipeline that calls `mahabhuta.processAsync()` with `config.mahafuncs` (lines 495-505) and its error fallback (lines 506-512)
- [lib/index.ts](../../lib/index.ts) — `Configuration.addMahabhuta()` (lines 1117-1125) and the `onSiteRendered` hook (lines 1372-1378)
- [lib/mahafuncs.ts](../../lib/mahafuncs.ts) — AkashaRender's `PageProcessor`/`Munger` wrapper classes
- [lib/built-in.ts](../../lib/built-in.ts) — the Built-in Plugin's own final mahafuncs (`MungedAttrRemover`, `BlankLinkDefanger`, lines 433-434)
- [test/final-mahabhuta.js](../../test/final-mahabhuta.js) — example final-mahafunc fixture
- Mahabhuta's compiled `dist/index.js` and `dist/MahafuncArray.js` in `node_modules/mahabhuta/` — the `functions` + `final_functions` execution order and `$.html()` serialization

## Related Pages

- [Three-Stage Rendering](../concepts/three-stage-rendering.md) — the pipeline this answer plugs into
- [Lifecycle Hooks](../concepts/lifecycle-hooks.md) — the `onSiteRendered` alternative for site-wide work
- [lib/mahafuncs.ts](../summaries/lib/mahafuncs.ts.md) — the AkashaRender mahafunc wrapper classes
- [lib/render.ts](../summaries/lib/render.ts.md) — where `processAsync` is invoked

## Backlinks
