---
title: "lib/Plugin.ts - Plugin Base Class"
type: summary
Sources:
  - lib/Plugin.ts
Categories:
  - plugin-system
  - extensibility
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/Plugin.ts - Plugin Base Class

## Code Complexity

- **Lines of code**: 96
- **Exported functions**: 0
- **Classes**: 1 (Plugin base class)
- **Complexity**: Low - simple abstract base class with getters/setters
- **Key methods**: configure() (abstract), cacheIndexes getter

## Key Points

- Base class for all AkashaRender plugins
- Uses private fields with `#` syntax for encapsulation
- Provides `configure()` method that must be implemented by subclasses
- Supports optional cache indexing through `cacheIndexes` getter
- Stores reference to Configuration object and akasha module

## Summary

This file defines the Plugin base class that all AkashaRender plugins must extend (source: [lib/Plugin.ts](../../lib/Plugin.ts)).

The Plugin class uses TypeScript private fields (with `#` prefix) to store (source: [lib/Plugin.ts](../../lib/Plugin.ts)):
- `#name` - The plugin name
- `#options` - Plugin configuration options
- `#config` - Reference to the Configuration object
- `#akasha` - Reference to the akasha module

The `configure(config, options)` method is abstract and must be implemented by each plugin subclass. This method is called when the plugin is added to a configuration via `config.use()` and is where the plugin should register its renderers, mahabhuta functions, and other resources (source: [lib/Plugin.ts](../../lib/Plugin.ts)).

The `cacheIndexes` getter allows plugins to specify additional fields to index in the file caches. By default it returns an object with undefined values for documents, assets, layouts, and partials. Plugins can override this to add custom indexed fields for their specific needs (source: [lib/Plugin.ts](../../lib/Plugin.ts)).

## Relevant Concepts

- [Plugin System](../concepts/plugin-system.md)
- [Cache Indexing](../concepts/cache-indexing.md)
- [Configuration](../concepts/configuration-class.md)

## Related Pages

- [lib/index.ts](./index.ts) - Main entry point that uses Plugin class
- [lib/built-in.ts](./built-in.ts) - Example Plugin implementation

## Backlinks

