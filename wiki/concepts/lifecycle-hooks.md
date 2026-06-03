---
title: "Lifecycle Hooks"
type: concept
Sources:
  - lib/index.ts
  - lib/Plugin.ts
  - lib/built-in.ts
  - lib/render.ts
Categories:
  - plugins
  - extensibility
  - events
date-created: 2026-05-21T01:00:00+00:00
last-updated: 2026-05-21T01:00:00+00:00
confidence: high
---

# Lifecycle Hooks

## Definition

Lifecycle Hooks are callback methods that plugins can implement to execute custom code at specific points during the AkashaRender build and file watching processes. The Configuration class iterates through all registered plugins and invokes these optional hook methods when key lifecycle events occur, such as before site rendering begins, after rendering completes, or when files are added, changed, or removed (source: [lib/index.ts](../../lib/index.ts):1253-1325, [lib/Plugin.ts](../../lib/Plugin.ts)).

## How It Works

The hook system operates through a plugin-callback pattern where Configuration orchestrates hook execution (source: [lib/index.ts](../../lib/index.ts)):

**Hook Discovery**: Each hook function checks if a plugin implements the corresponding method using `typeof plugin.hookName !== 'undefined'` before calling it (source: [lib/index.ts](../../lib/index.ts):1257,1271,1282,1292,1302,1312,1321).

**Sequential Execution**: Hooks are called sequentially for each plugin in the order plugins were registered using a for-loop with await, ensuring one plugin completes before the next begins (source: [lib/index.ts](../../lib/index.ts):1256,1270,1281,1291,1301,1311,1320).

**Seven Core Hooks**:

1. **beforeSiteRendered** - Called before site rendering begins (source: [lib/index.ts](../../lib/index.ts):1253-1262):
   - Signature: `async beforeSiteRendered(config: Configuration)`
   - Invoked by: `config.hookBeforeSiteRendered()`
   - Use case: Perform setup, generate auxiliary files, validate configuration
   - Called from: render.ts before document rendering loop

2. **onSiteRendered** - Called after all documents are rendered (source: [lib/index.ts](../../lib/index.ts):1267-1276):
   - Signature: `async onSiteRendered(config: Configuration)`
   - Invoked by: `config.hookSiteRendered()`
   - Use case: Post-processing, cleanup, generating indexes
   - Example: Built-in plugin processes image resize queue (source: [lib/built-in.ts](../../lib/built-in.ts):216)

3. **onFileAdded** - Called when a file is added to a cache collection (source: [lib/index.ts](../../lib/index.ts):1278-1287):
   - Signature: `async onFileAdded(config: Configuration, collection: string, vpinfo: VPathData)`
   - Invoked by: `config.hookFileAdded(collection, vpinfo)`
   - Use case: React to new files, update plugin state, trigger rebuilds
   - Called from: File cache when new files are discovered

4. **onFileChanged** - Called when a file is modified (source: [lib/index.ts](../../lib/index.ts):1289-1297):
   - Signature: `async onFileChanged(config: Configuration, collection: string, vpinfo: VPathData)`
   - Invoked by: `config.hookFileChanged(collection, vpinfo)`
   - Use case: Incremental updates, cache invalidation
   - Called from: File watching system

5. **onFileUnlinked** - Called when a file is deleted (source: [lib/index.ts](../../lib/index.ts):1299-1307):
   - Signature: `async onFileUnlinked(config: Configuration, collection: string, vpinfo: VPathData)`
   - Invoked by: `config.hookFileUnlinked(collection, vpinfo)`
   - Use case: Clean up related resources, remove from indexes
   - Called from: File watching system

6. **onFileCacheSetup** - Called after a file cache collection is initialized (source: [lib/index.ts](../../lib/index.ts):1309-1316):
   - Signature: `async onFileCacheSetup(config: Configuration, collectionnm: string, collection)`
   - Invoked by: `config.hookFileCacheSetup(collectionnm, collection)`
   - Use case: Add custom cache indexes, perform initial cache analysis
   - Called from: Cache initialization

7. **onPluginCacheSetup** - Called after all plugin caches are initialized (source: [lib/index.ts](../../lib/index.ts):1318-1325):
   - Signature: `async onPluginCacheSetup(config: Configuration)`
   - Invoked by: `config.hookPluginCacheSetup()`
   - Use case: Populate database with plugin-specific data
   - Special treatment: Tag descriptions are installed here (source: [lib/index.ts](../../lib/index.ts):1326-1332)

**Implementation in Plugins**: Plugins extend the Plugin base class and implement whichever hooks they need (source: [lib/Plugin.ts](../../lib/Plugin.ts):42-96):
```typescript
export class MyPlugin extends Plugin {
    async onSiteRendered(config: Configuration) {
        // Custom post-rendering logic
    }
}
```

**Optional Hooks**: Plugins only implement hooks they need. The configuration's hook functions gracefully skip plugins that don't implement a particular hook (source: [lib/index.ts](../../lib/index.ts)).

## Key Parameters

**config: Configuration**: The configuration object passed to most hooks, providing access to plugins, directories, caches, and settings (source: [lib/index.ts](../../lib/index.ts):1259,1273,1284,1294,1304,1313,1322).

**collection: string**: Name of the cache collection ('documents', 'assets', 'layouts', 'partials') for file-related hooks (source: [lib/index.ts](../../lib/index.ts):1278,1289,1299,1309).

**vpinfo: VPathData**: Object containing file metadata including virtual path, filesystem path, and other properties for file-related hooks (source: [lib/index.ts](../../lib/index.ts):1278,1289,1299).

**collectionnm: string**: Collection name for cache setup hook (source: [lib/index.ts](../../lib/index.ts):1309).

**collection**: The cache collection object itself for cache setup hook (source: [lib/index.ts](../../lib/index.ts):1309).

## When To Use

**beforeSiteRendered**: Prepare environment, validate prerequisites, generate configuration-derived files before rendering begins (source: [lib/index.ts](../../lib/index.ts):1253-1262).

**onSiteRendered**: Post-process rendered output, generate site-wide indexes, optimize images, create sitemaps, clean up temporary files (source: [lib/index.ts](../../lib/index.ts):1267-1276, [lib/built-in.ts](../../lib/built-in.ts):216).

**onFileAdded/Changed/Unlinked**: Implement incremental builds, maintain plugin-specific file indexes, trigger dependent rebuilds, update search indexes (source: [lib/index.ts](../../lib/index.ts):1278-1307).

**onFileCacheSetup**: Register custom cache indexes, perform one-time analysis of cache contents, populate plugin databases (source: [lib/index.ts](../../lib/index.ts):1309-1316).

**onPluginCacheSetup**: Install plugin-specific data into shared database after cache infrastructure is ready (source: [lib/index.ts](../../lib/index.ts):1318-1325).

## Risks & Pitfalls

**Sequential Not Parallel**: Hooks execute sequentially, so slow plugins block others. Keep hook implementations fast or use async background tasks (source: [lib/index.ts](../../lib/index.ts):1256,1270).

**Error Propagation**: If a hook throws an exception, it halts the build. Always use try-catch in hooks and decide whether to log warnings or fail fast (source: [lib/index.ts](../../lib/index.ts)).

**No Hook Registration**: Plugins don't explicitly register hooks. They're discovered by existence checking, so typos in method names silently fail (source: [lib/index.ts](../../lib/index.ts):1257,1271).

**Hook Timing**: beforeSiteRendered runs before documents are processed, so document cache may not be fully populated. onSiteRendered runs after rendering but before cleanup (source: [lib/index.ts](../../lib/index.ts):1253,1267).

**File Hook Timing**: File hooks are called during cache scanning and watching. During initial scan, many onFileAdded calls occur. Batch operations rather than processing individually (source: [lib/index.ts](../../lib/index.ts):1278).

**Cache Access**: In onFileCacheSetup, the specific cache being set up is passed in. In other hooks, access caches via `config.akasha.filecache` (source: [lib/index.ts](../../lib/index.ts):1309).

**Async Required**: All hooks must be async or return promises. Synchronous hooks will still work but break the async flow (source: [lib/index.ts](../../lib/index.ts)).

**Plugin Order Matters**: Hooks execute in plugin registration order. If plugin B depends on plugin A's hook completing first, ensure A is registered before B (source: [lib/index.ts](../../lib/index.ts):1256,1270).

## Sources

- [lib/index.ts](../../lib/index.ts) - Configuration class with hook orchestration methods
- [lib/Plugin.ts](../../lib/Plugin.ts) - Plugin base class
- [lib/built-in.ts](../../lib/built-in.ts) - Example onSiteRendered implementation
- [lib/render.ts](../../lib/render.ts) - Hook invocation during rendering

## Related Pages

- [Plugin System](./plugin-system.md) - Plugin architecture overview
- [Built-in Plugin](./built-in-plugin.md) - Example plugin using onSiteRendered
- [Image Resizing](./image-resizing.md) - Feature implemented via onSiteRendered hook
- [File Caching](./file-caching.md) - Cache system that triggers file hooks
- [Configuration Class](./configuration-class.md) - Configuration object passed to hooks

## Backlinks
