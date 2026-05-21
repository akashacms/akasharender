---
title: "Plugin System"
type: concept
Categories:
  - architecture
  - extensibility
  - plugins
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# Plugin System

## Definition

The Plugin System is AkashaRender's extensibility mechanism allowing functionality to be packaged as reusable modules that can add renderers, Mahabhuta functions, templates, and custom behavior to projects.

## How It Works

Plugins extend the Plugin base class defined in `lib/Plugin.ts` (source: [lib/Plugin.ts](../summaries/lib/Plugin.ts.md)).

### Plugin Structure

A plugin must:
1. Extend the Plugin base class
2. Call `super(pluginName)` in constructor
3. Implement `configure(config, options)` method
4. Optionally override `cacheIndexes` getter for custom cache fields

### Plugin Registration

Plugins are added to a configuration using the `use()` method (source: [lib/index.ts](../summaries/lib/index.ts.md)):

```javascript
config.use(MyPlugin, {
    option1: 'value1',
    option2: 'value2'
});
```

The `use()` method:
- Instantiates the plugin class
- Stores reference to akasha module
- Calls the plugin's `configure()` method with config and options
- Adds plugin to the configuration's plugin array

### Plugin Capabilities

Plugins can (source: [lib/Plugin.ts](../summaries/lib/Plugin.ts.md), [lib/index.ts](../summaries/lib/index.ts.md)):

- **Add directories**: Mount assets, layouts, partials, or document directories
- **Register renderers**: Add support for new template formats
- **Add Mahabhuta functions**: Contribute DOM manipulation functions
- **Define cache indexes**: Specify custom fields to index in file caches
- **Hook into lifecycle events**: Implement methods like:
  - `beforeSiteRendered(config)` - Called before rendering starts
  - `onSiteRendered(config)` - Called after rendering completes
  - `onFileAdded(config, collection, vpinfo)` - File added to cache
  - `onFileChanged(config, collection, vpinfo)` - File modified
  - `onFileUnlinked(config, collection, vpinfo)` - File removed
  - `onFileCacheSetup(config, collectionnm, collection)` - Cache initialized
  - `onPluginCacheSetup(config)` - Plugin-specific cache setup

### Built-in Plugin

Every project automatically includes the built-in plugin (source: [lib/built-in.ts](../summaries/lib/built-in.ts.md)), which is added last in `Configuration.prepare()` so its files can be overridden. It provides core features like metadata handling, link processing, and image resizing.

## Key Parameters

- **name** - Unique identifier for the plugin
- **config** - Reference to Configuration object
- **options** - Plugin-specific configuration options
- **akasha** - Reference to the akasha module for accessing core functionality

## When To Use

Create a plugin when you want to:

- **Package reusable functionality**: Share capabilities across multiple projects
- **Organize complex features**: Keep related functionality together
- **Extend AkashaRender**: Add support for new formats or behaviors
- **Provide themes**: Bundle layouts, partials, and styles

Use existing plugins when you need functionality like blogging, breadcrumbs, external link processing, etc.

## Risks & Pitfalls

- **Plugin order matters**: Plugins are processed in registration order; later plugins can override earlier ones
- **Resource conflicts**: Multiple plugins might provide files with the same vpath
- **Lifecycle dependencies**: Ensure plugins don't assume specific order of lifecycle hook execution
- **Configuration complexity**: Too many plugins can make configuration harder to understand
- **Version compatibility**: Plugins may depend on specific AkashaRender versions

## Sources

- [lib/Plugin.ts](../summaries/lib/Plugin.ts.md)
- [lib/index.ts](../summaries/lib/index.ts.md)
- [lib/built-in.ts](../summaries/lib/built-in.ts.md)

## Related Pages

- [Built-in Plugin](./built-in-plugin.md)
- [Lifecycle Hooks](./lifecycle-hooks.md)
- [Configuration Class](./configuration-class.md)
- [Stacked Directories](./stacked-directories.md)

## Backlinks

