---
title: "layouts/ak_core_macros.njk - Nunjucks Core Macros"
type: summary
Sources:
  - layouts/ak_core_macros.njk
Categories:
  - templates
  - nunjucks
  - macros
date-created: 2026-05-20T21:00:00+00:00
last-updated: 2026-05-20T21:00:00+00:00
confidence: high
---

# layouts/ak_core_macros.njk - Nunjucks Core Macros

## Key Points

- Nunjucks macros for core AkashaRender functionality
- Used by built-in plugin for generating HTML elements
- Includes macros for stylesheets, JavaScript, and metadata
- Imported via `{% import "ak_core_macros.njk" as ak_core with context %}`

## Summary

This Nunjucks template file defines core macros used throughout AkashaRender projects (source: [layouts/ak_core_macros.njk](../../layouts/ak_core_macros.njk)).

The macros provide reusable functionality for generating HTML elements like stylesheet links, JavaScript tags, and metadata tags. They are used by the built-in plugin's Nunjucks extensions (source: [layouts/ak_core_macros.njk](../../layouts/ak_core_macros.njk)).

## Relevant Concepts

- [Nunjucks Macros](../concepts/nunjucks-macros.md)
- [Nunjucks Extensions](../concepts/nunjucks-extensions.md)
- [Built-in Plugin](../concepts/built-in-plugin.md)

## Related Pages

- [lib/built-in.ts](../lib/built-in.ts.md) - Uses these macros
- [built-in-guide/index.html.md](../built-in-guide/index.html.md) - Documents macro usage

## Backlinks

