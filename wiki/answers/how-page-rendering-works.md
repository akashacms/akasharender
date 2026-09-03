---
title: "How the AkashaCMS Page Rendering Process Works"
type: answer
Sources:
  - lib/render.ts
  - lib/index.ts
  - lib/cli.ts
Categories:
  - rendering
  - pipeline
  - workflow
  - overview
date-created: 2026-08-17T23:01:56+03:00
last-updated: 2026-09-03T18:20:00+03:00
confidence: high
---

# How the AkashaCMS Page Rendering Process Works

## Query

How does the AkashaCMS page rendering process work?

## Answer

AkashaRender turns source documents (Markdown, EJS, Nunjucks, etc.) into a finished
website in two nested loops: a **site-wide loop** that discovers every document and
renders them concurrently, and, for each document, a **three-stage per-page pipeline**
(content render → layout render → Mahabhuta DOM manipulation). This page gives the
high-level overview; for a line-by-line walkthrough of a single document see
[Detailed Flow for Rendering a Single Page from vpath](./rendering-flow-from-vpath.md).

### Site-Wide Orchestration

Site rendering is driven by `render(config, options)` in `lib/render.ts`
(source: [lib/render.ts](../../lib/render.ts)). It returns an array of
structured `RenderingResults`. The CLI's `render` command invokes it after
`akasha.setup(config)` and, optionally, `config.copyAssets()`
(source: [lib/cli.ts](../summaries/lib/cli.ts.md)). The steps are:

1. **Before-hook** — `config.hookBeforeSiteRendered()` lets plugins do setup or generate
   auxiliary files before any document is processed (source: [lib/render.ts](../../lib/render.ts)).
2. **Gather documents** — pulls all document paths from the SQLite-backed
   `documentsCache` via `documents.paths()` (source: [lib/render.ts](../../lib/render.ts)).
3. **Filter** — skips directories and missing files, and also skips
   documents whose output is already up-to-date via `isDocumentUpToDate()`, unless
   `forceRenderAll` is set (source: [lib/render.ts](../../lib/render.ts)).
4. **Concurrent render** — a `fastq` queue processes documents in parallel, bounded by
   `config.concurrency`; each entry calls `renderDocument`
   (source: [lib/render.ts](../../lib/render.ts)).
5. **After-hook** — `config.hookSiteRendered()` runs so plugins can build sitemaps,
   index pages, etc. (source: [lib/render.ts](../../lib/render.ts):838).
6. **Return results** — an array of per-document results.

This orchestration is documented in more depth in
[Site Rendering](../concepts/site-rendering.md) and
[Rendering Pipeline](../concepts/rendering-pipeline.md).

### Per-Document: Format Branch

Each document is classified by the renderer selected from its file extension
(`config.findRendererPath()`), then routed (source: [lib/render.ts](../../lib/render.ts):361):

- **CSS** (e.g. LESS/SCSS) → `renderCSSFile()`: render and write; no layout or Mahabhuta
  (source: [lib/render.ts](../../lib/render.ts):253).
- **Non-HTML asset / no renderer** → `copyAssetFile()`: straight file copy
  (source: [lib/render.ts](../../lib/render.ts):288).
- **HTML** → the three-stage pipeline below.

### Per-Document: Three-Stage Pipeline

The HTML path runs three sequential stages, each timed with `performance.now()`
(source: [lib/render.ts](../../lib/render.ts):352). This is the
[Three-Stage Rendering](../concepts/three-stage-rendering.md) concept.

**Stage 1 — First Render (content).** The document's primary renderer
([Template Rendering](../concepts/template-rendering.md) via `@akashacms/renderers`)
converts the source body to HTML — Markdown via markdown-it, EJS/Nunjucks templates
evaluated. Before rendering, helpers (`partial`, `partialSync`, `config`, `akasha`,
`plugin`) are injected into the metadata, and frontmatter is available as variables. The
output is raw HTML with no page structure (source: [lib/render.ts](../../lib/render.ts):386,
[lib/render.ts](../../lib/render.ts):153).

**Stage 2 — Layout Render.** If frontmatter specifies a `layout`, the template is looked
up in `layoutsCache`; layout metadata and document metadata are merged (document wins,
except `layout` is excluded to avoid recursion), the Stage-1 HTML is passed in as the
`content` variable, and the layout template is rendered to wrap the content in the page
shell (head, nav, footer). Layouts can nest. If no layout is specified, this stage is
skipped (source: [lib/render.ts](../../lib/render.ts):409). See
[Layout Templates](../concepts/layout-templates.md).

**Stage 3 — Mahabhuta (DOM post-processing).** The rendered HTML is passed to
`mahabhuta.processAsync()` with `config.mahafuncs` — the DOM-manipulation functions
registered by plugins. Mahabhuta loads the HTML into a Cheerio DOM and lets plugins
rewrite it: expanding custom elements (e.g. `<embed-video>` → `<iframe>`), relativizing
links, adding favicons, building breadcrumbs, injecting stylesheet/JavaScript references,
and more (source: [lib/render.ts](../../lib/render.ts):472). See
[Mahabhuta System](../concepts/mahabhuta-system.md).

**Write output.** The final HTML is written to `config.renderTo` at the document's
`renderPath`, creating directories as needed (source: [lib/render.ts](../../lib/render.ts):517).

### History: the former "2" implementations

Until September 2026 there were two parallel per-document implementations —
the legacy string-returning `renderDocument`/`render` and the structured
"2" versions. The legacy versions (and their helpers `renderContent`,
`writeCSStoOutput`, `copyAssetToOutput`) were deleted and the "2" versions
renamed to the base names on 2026-09-03; see
[Removing the Legacy Non-2 Render Functions](../implementation/removing-legacy-render-functions.md).

### The Key Architectural Idea

**Templating happens first (text → HTML), then DOM manipulation happens second
(HTML → HTML).** That separation is what lets plugins define custom HTML tags that are
resolved by Mahabhuta *after* the templates have already run
(source: [lib/render.ts](../../lib/render.ts):352). See
[Custom Elements](../concepts/custom-elements.md).

### Visual Overview

```
render(config, options)
   │
   ├─ hookBeforeSiteRendered()
   ├─ documentsCache.paths()        ← gather all documents
   ├─ filter (dirs, up-to-date)     ← skips up-to-date docs unless forceRenderAll
   │
   ├─ fastq queue (concurrency) ──► renderDocument(config, docInfo)
   │                                    │
   │                                    ├─ CSS   → renderCSSFile()  → write
   │                                    ├─ asset → copyAssetFile()  → copy
   │                                    └─ HTML:
   │                                         Stage 1  content render (Markdown/EJS/Njk)
   │                                         Stage 2  layout render  (wrap in layout)
   │                                         Stage 3  Mahabhuta       (DOM mahafuncs)
   │                                         → write to renderTo/renderPath
   │
   └─ hookSiteRendered()            ← plugins build sitemaps, indexes
```

## Sources

- [lib/render.ts](../../lib/render.ts)
- [lib/index.ts](../../lib/index.ts)
- [lib/cli.ts](../../lib/cli.ts)

## Related Pages

- [Detailed Flow for Rendering a Single Page from vpath](./rendering-flow-from-vpath.md): Line-by-line walkthrough of a single document
- [Three-Stage Rendering](../concepts/three-stage-rendering.md): Concept overview of the per-document pipeline
- [Site Rendering](../concepts/site-rendering.md): Site-wide build workflow
- [Rendering Pipeline](../concepts/rendering-pipeline.md): Site-wide orchestration and concurrency
- [Template Rendering](../concepts/template-rendering.md): Stage 1/2 template engines
- [Layout Templates](../concepts/layout-templates.md): Stage 2 layout application
- [Mahabhuta System](../concepts/mahabhuta-system.md): Stage 3 DOM manipulation
- [Custom Elements](../concepts/custom-elements.md): Custom HTML tags via Mahabhuta
- [Lifecycle Hooks](../concepts/lifecycle-hooks.md): before/after site-render hooks
- [lib/render.ts summary](../summaries/lib/render.ts.md): Source file summary

## Backlinks

- [Answer index](./README.md)
