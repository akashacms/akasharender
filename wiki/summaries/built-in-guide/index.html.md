---
title: "built-in-guide/index.html.md - Built-in Plugin Documentation"
type: summary
Sources:
  - built-in-guide/index.html.md
Categories:
  - documentation
  - built-in-plugin
  - features
date-created: 2026-05-20T21:00:00+00:00
last-updated: 2026-05-20T21:00:00+00:00
confidence: high
---

# built-in-guide/index.html.md - Built-in Plugin Documentation

## Key Points

- Documents the features and custom tags provided by the built-in plugin
- Built-in plugin is automatically included in every AkashaRender project
- Provides foundational HTML features usable for websites, EPUBs, and other HTML targets
- Includes custom tags for figures, images, stylesheets, JavaScript, and code embedding
- Supports automatic URL relativization and link cleanup

## Summary

This documentation file describes the built-in plugin that is automatically included in every AkashaRender project (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**Purpose**: The built-in plugin provides foundational features useful for any HTML target, including both websites and EPUBs. It differs from `akashacms-base` which provides website-specific features (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**Installation**: No installation required - the plugin is built into AkashaRender (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**Nunjucks Macros**: Macros are available through `ak_core_macros.njk`. Import with `{% import "ak_core_macros.njk" as ak_core with context %}` (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**Figure/Image Features** (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)):
- `<fig-img>` tag simplifies creating figure/img/figcaption structures
- `<img>` tags with `figure` attribute are automatically wrapped in `<figure>`
- Attributes like `id`, `class`, `width`, `style` apply to the figure element
- `caption` attribute becomes `<figcaption>`, `dest` wraps image in `<a>` tag
- Uses `ak_figimg.html.ejs` template (customizable)

**Image Resizing**: `<img>` tags with `resize-width` and `resize-to` attributes automatically resize images during rendering using the sharp library. Supports format conversion (e.g., PNG to JPG) (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**Stylesheets**: `<ak-stylesheets>` tag or `{% akstylesheets %}` Nunjucks tag generates CSS links from `config.addStylesheet()` declarations or per-document `headerStylesheetsAdd` metadata (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**JavaScript**: `<ak-headerJavaScript>` and `<ak-footerJavaScript>` tags generate script tags from configuration or per-document metadata. Supports both external scripts (`href`) and inline scripts (`script`) (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**Teaser Content**: `<ak-teaser>` tag inserts teaser text from document metadata using `ak_teaser.html.ejs` partial (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**Code Embedding**: `<code-embed>` tag embeds code from files with syntax highlighting via Highlight.js. Supports `file-name` (path), `lang` (language code), and `id` attributes (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**Element Selection**: `<select-elements>` tag randomly selects and displays one or more child elements. Useful for rotating content like advertisements. Supports `count` attribute to select multiple elements (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**Anchor Tag Cleanup**: Empty `<a>` tags referencing local documents are automatically filled with the target document's title from its metadata (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

**URL Relativization**: By default, absolute local URLs (e.g., `/index.html`) are converted to relative URLs (e.g., `./index.html` or `../index.html`) for easier preview and EPUB compatibility. This can be controlled separately for head links, script links, and body links using plugin options: `relativizeHeadLinks`, `relativizeScriptLinks`, `relativizeBodyLinks` (source: [built-in-guide/index.html.md](../../built-in-guide/index.html.md)).

## Relevant Concepts

- [Built-in Plugin](../concepts/built-in-plugin.md)
- [Custom Elements](../concepts/custom-elements.md)
- [Link Relativization](../concepts/link-relativization.md)
- [Image Resizing](../concepts/image-resizing.md)
- [Nunjucks Extensions](../concepts/nunjucks-extensions.md)

## Related Pages

- [lib/built-in.ts](../lib/built-in.ts.md) - Built-in plugin implementation
- [partials/ak_figimg.html.ejs](../partials/ak_figimg.html.ejs.md) - Figure/image template
- [partials/ak_teaser.html.ejs](../partials/ak_teaser.html.ejs.md) - Teaser template
- [layouts/ak_core_macros.njk](../layouts/ak_core_macros.njk.md) - Nunjucks macros

## Backlinks

