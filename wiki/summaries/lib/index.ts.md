---
title: "lib/index.ts - AkashaRender Main Entry Point"
type: summary
Sources:
  - lib/index.ts
Categories:
  - core
  - configuration
  - initialization
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/index.ts - AkashaRender Main Entry Point

## Code Complexity

- **Lines of code**: 1,498
- **Exported functions**: ~12 major functions
- **Classes**: 1 (Configuration class)
- **Complexity**: High - large configuration class with 100+ methods, complex initialization logic
- **Key exports**: Configuration class, setup functions, rendering functions, partial functions

## Key Points

- Main entry point and public API for the AkashaRender package
- Exports the `Configuration` class which is the central configuration object
- Provides initialization functions `setup()`, `cacheSetup()`, and `fileCachesReady()`
- Implements template rendering functions `partial()` and `partialSync()` for rendering partial templates
- Exports rendering functions from `render.js` including `render()`, `renderDocument()`, etc.
- Defines MIME types for various template formats (AsciiDoc, EJS, Nunjucks, etc.)
- Re-exports functionality from other core modules like Plugin, Renderers, and mahabhuta

## Summary

This file serves as the main entry point for AkashaRender. It exports the Configuration class and various utility functions that form the public API of the library.

The Configuration class is the central object for configuring an AkashaRender project. It manages (source: [lib/index.ts](../../lib/index.ts)):
- Directory paths for documents, assets, layouts, and partials
- Plugin registration and management
- Renderer configuration
- Metadata and rendering settings
- Mahabhuta (DOM manipulation) configuration

Key initialization functions include (source: [lib/index.ts](../../lib/index.ts)):
- `setup(config)` - Performs asynchronous setup of AkashaRender, initializes caches and renderers
- `cacheSetup(config)` - Initializes the SQLite-based file caching system
- `fileCachesReady(config)` - Waits for all file caches (documents, assets, layouts, partials) to be ready

The file defines custom MIME types for template formats that lack official registrations (source: [lib/index.ts](../../lib/index.ts)):
- `text/asciidoc` for `.adoc`, `.asciidoc`
- `text/x-markdoc` for `.markdoc`
- `text/x-ejs` for `.ejs`
- `text/x-nunjucks` for `.njk`
- `text/x-handlebars` for `.handlebars`
- `text/x-liquid` for `.liquid`
- `text/x-tempura` for `.tempura`

Partial template rendering is provided through two functions (source: [lib/index.ts](../../lib/index.ts)):
- `partial(config, fname, metadata)` - Async version for rendering partial templates
- `partialSync(config, fname, metadata)` - Synchronous version for rendering partial templates

The Configuration class uses private fields (with `#` prefix) for encapsulation and provides getter/setter methods for accessing configuration values. It follows a builder pattern where methods return `this` for chaining (source: [lib/index.ts](../../lib/index.ts)).

The `prepare()` method finalizes configuration by setting defaults and automatically adding the built-in plugin (source: [lib/index.ts](../../lib/index.ts)):
- Creates default directories if not specified (assets, layouts, partials, documents, cache, out)
- Adds the BuiltInPlugin as the last plugin so its templates can be overridden

The Configuration class provides several lifecycle hooks that plugins can implement (source: [lib/index.ts](../../lib/index.ts)):
- `hookBeforeSiteRendered()` - Called before rendering starts
- `hookSiteRendered()` - Called after rendering completes
- `hookFileAdded()`, `hookFileChanged()`, `hookFileUnlinked()` - File system event hooks
- `hookFileCacheSetup()`, `hookPluginCacheSetup()` - Cache initialization hooks

Additional utility functions include (source: [lib/index.ts](../../lib/index.ts)):
- `renderPath(config, path)` - Renders a document by its virtual path
- `readRenderedFile(config, fpath)` - Reads and parses a rendered HTML file with Cheerio
- `indexChain(config, fname)` - Finds index.html files up the directory hierarchy
- `linkRelSetAttr($link, attr, doattr)` - Manipulates `rel=` attributes on links
- `generateRSS(config, configrss, feedData, items, renderTo)` - Generates RSS feeds

The module uses ES6 imports and exports throughout, with a default export object for backwards compatibility that aggregates all major exports (source: [lib/index.ts](../../lib/index.ts)).

## Relevant Concepts

- [Configuration Class](../concepts/configuration-class.md)
- [Plugin System](../concepts/plugin-system.md)
- [File Caching](../concepts/file-caching.md)
- [Template Rendering](../concepts/template-rendering.md)
- [Stacked Directories](../concepts/stacked-directories.md)
- [Lifecycle Hooks](../concepts/lifecycle-hooks.md)

## Related Pages

- [lib/Plugin.ts](./Plugin.ts) - Plugin base class
- [lib/render.ts](./render.ts) - Document rendering implementation
- [lib/cache/cache-sqlite.ts](./cache/cache-sqlite.ts) - SQLite caching implementation
- [lib/cache/vfstack.ts](./cache/vfstack.ts) - Virtual file system stacking
- [lib/built-in.ts](./built-in.ts) - Built-in plugin

## Backlinks

