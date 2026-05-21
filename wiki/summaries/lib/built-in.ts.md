---
title: "lib/built-in.ts - Built-in Plugin"
type: summary
Sources:
  - lib/built-in.ts
Categories:
  - plugins
  - built-in
  - dom-manipulation
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/built-in.ts - Built-in Plugin

## Code Complexity

- **Lines of code**: 1,218
- **Exported functions**: ~5 major functions
- **Classes**: 20+ (BuiltInPlugin class plus ~19 Mahabhuta function classes)
- **Complexity**: Very High - extensive plugin with numerous custom elements and DOM processors
- **Key components**: BuiltInPlugin class, Mahabhuta arrays, Nunjucks extensions, image resize queue

## Key Points

- Provides core functionality automatically added to every AkashaRender project
- Implements essential Mahabhuta custom elements and DOM processors
- Handles stylesheet and JavaScript injection into pages
- Provides image resizing capabilities using sharp library
- Includes syntax highlighting via highlight.js
- Adds Nunjucks extensions for generating head links and scripts

## Summary

This file implements the BuiltInPlugin which is automatically added to every AkashaRender configuration (source: [lib/built-in.ts](../../lib/built-in.ts)).

The plugin is added last in the `Configuration.prepare()` method so its templates and partials can be easily overridden by user code and other plugins (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Core Capabilities** (source: [lib/built-in.ts](../../lib/built-in.ts)):
- Adds default layouts and partials directories
- Registers Mahabhuta arrays for metadata and DOM processing
- Provides Nunjucks extensions: `akstylesheets`, `akheaderjs`, `akfooterjs`
- Manages image resize queue for responsive images
- Controls link relativization options

**Link Relativization**: Three configurable options control whether links are relativized or absolutized (source: [lib/built-in.ts](../../lib/built-in.ts)):
- `relativizeHeadLinks` - Controls `<link>` tags in `<head>`
- `relativizeScriptLinks` - Controls `<script>` tags
- `relativizeBodyLinks` - Controls `<a>` tags in body

**Image Resizing**: Maintains a resize queue and uses the sharp library to generate responsive image variants at specified widths (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Nunjucks Extensions**: Custom Nunjucks extensions inject stylesheets and JavaScript references into templates based on configuration and metadata (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Mahabhuta Functions**: Implements numerous custom elements and processors including metadata handling, partial rendering, link processing, and more (source: [lib/built-in.ts](../../lib/built-in.ts)).

## Relevant Concepts

- [Built-in Plugin](../concepts/built-in-plugin.md)
- [Plugin System](../concepts/plugin-system.md)
- [Link Relativization](../concepts/link-relativization.md)
- [Image Resizing](../concepts/image-resizing.md)
- [Nunjucks Extensions](../concepts/nunjucks-extensions.md)

## Related Pages

- [lib/Plugin.ts](./Plugin.ts) - Plugin base class
- [lib/index.ts](./index.ts) - Adds built-in plugin in prepare()
- [lib/mahafuncs.ts](./mahafuncs.ts) - Mahabhuta function base classes

## Backlinks

