---
title: "lib/mahafuncs.ts - Mahabhuta Function Base Classes"
type: summary
Sources:
  - lib/mahafuncs.ts
Categories:
  - mahabhuta
  - dom-manipulation
  - base-classes
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/mahafuncs.ts - Mahabhuta Function Base Classes

## Code Complexity

- **Lines of code**: 125
- **Exported functions**: 0
- **Classes**: 5 (Mahafunc, CustomElement, ElementTweaker, Munger, PageProcessor)
- **Complexity**: Low - simple wrapper classes with identical structure
- **Pattern**: Each class extends Mahabhuta base, adds config/akasha/plugin getters

## Key Points

- Provides wrapper classes for Mahabhuta function types
- Simplifies access to Configuration, akasha, and Plugin objects
- Eliminates need for verbose `this.array.options.config` access patterns
- Exports five base classes extending Mahabhuta types
- Used by plugins to create DOM manipulation functions

## Summary

This module provides convenient wrapper classes around the Mahabhuta DOM manipulation function types (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)).

Mahabhuta is the DOM manipulation engine used by AkashaRender to post-process HTML after initial rendering. Previously, mahafunc code required verbose patterns like `this.array.options.config` and `this.array.options.config.akasha` to access core objects. These wrapper classes simplify this to `this.config`, `this.akasha`, and `this.plugin` (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)).

Five wrapper classes are provided, each extending a Mahabhuta base class (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)):
- `Mahafunc` extends `MahaMahafunc` - Base mahafunc type
- `CustomElement` extends `MahaCustomElement` - For processing custom HTML elements
- `ElementTweaker` extends `MahaElementTweaker` - For modifying existing elements
- `Munger` extends `MahaMunger` - For general HTML munging
- `PageProcessor` extends `MahaPageProcessor` - For full-page processing

Each class stores three private fields (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)):
- `#config: Configuration` - The AkashaRender configuration object
- `#akasha: any` - Reference to the akasha module
- `#plugin: Plugin` - The plugin that owns this mahafunc

All three are passed to the constructor and exposed via getters, providing convenient access throughout the mahafunc's implementation (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)).

## Relevant Concepts

- [Mahabhuta System](../concepts/mahabhuta-system.md)
- [DOM Manipulation](../concepts/dom-manipulation.md)
- [Custom Elements](../concepts/custom-elements.md)
- [Plugin System](../concepts/plugin-system.md)

## Related Pages

- [lib/Plugin.ts](./Plugin.ts) - Plugin base class
- [lib/index.ts](./index.ts) - Configuration class
- [lib/built-in.ts](./built-in.ts) - Uses these classes for built-in mahafuncs

## Backlinks

