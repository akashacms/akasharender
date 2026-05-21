---
title: "lib/cache/watchman.ts - File Watching and Auto-Rebuild"
type: summary
Sources:
  - lib/cache/watchman.ts
Categories:
  - file-watching
  - hot-reload
  - development
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/cache/watchman.ts - File Watching and Auto-Rebuild

## Code Complexity

- **Lines of code**: 241
- **Exported functions**: 5 internal helper functions, 1 main export (watchman)
- **Classes**: 0
- **Complexity**: Medium - event-driven architecture, async rendering queue
- **Key pattern**: Event listeners on cache instances, fastq for concurrent rendering

## Key Points

- Implements file watching for automatic site rebuilding during development
- Listens to cache events (add, change, unlink) from file caches
- Handles different file types appropriately (documents, assets, layouts, partials)
- Rerenders documents affected by layout changes
- Uses fastq for concurrent rendering operations

## Summary

This module implements the file watching system that automatically rebuilds content when files change (source: [lib/cache/watchman.ts](../../../lib/cache/watchman.ts)).

**Main Function**: `watchman(config)` sets up event listeners on all four file caches (source: [lib/cache/watchman.ts](../../../lib/cache/watchman.ts)).

**Documents Cache Handlers** (source: [lib/cache/watchman.ts](../../../lib/cache/watchman.ts)):
- `'change'` event - Rerenders the changed document
- `'add'` event - Renders the newly added document
- `'unlink'` event - Deletes the rendered output file

**Assets Cache Handlers** (source: [lib/cache/watchman.ts](../../../lib/cache/watchman.ts)):
- `'change'` event - Copies the changed asset to output
- `'add'` event - Copies the new asset to output
- `'unlink'` event - Deletes the asset from output

**Layouts Cache Handlers** (source: [lib/cache/watchman.ts](../../../lib/cache/watchman.ts)):
- `'change'` / `'add'` events - Finds all documents using the layout and rerenders them using `renderForLayout()`
- `'unlink'` event - Triggers full site rebuild

**Partials Cache Handlers** (source: [lib/cache/watchman.ts](../../../lib/cache/watchman.ts)):
- `'change'` / `'add'` / `'unlink'` events - Triggers full site rebuild (since partials may be used anywhere)

**Helper Functions** (source: [lib/cache/watchman.ts](../../../lib/cache/watchman.ts)):
- `renderVPath(config, info)` - Renders a single document
- `renderForLayout(config, info)` - Finds and rerenders all documents using a layout
- `rebuild(config)` - Performs full site rebuild
- `unlinkVPath(config, info)` - Deletes rendered output for a document

**Concurrency**: Uses fastq with concurrency of 10 to render multiple affected documents in parallel when layout changes (source: [lib/cache/watchman.ts](../../../lib/cache/watchman.ts)).

## Relevant Concepts

- [File Watching](../../concepts/file-watching.md)
- [Hot Reload](../../concepts/hot-reload.md)
- [Event-Driven Architecture](../../concepts/event-driven-architecture.md)
- [Development Workflow](../../concepts/development-workflow.md)

## Related Pages

- [lib/cli.ts](../cli.ts) - watch command implementation
- [lib/cache/cache-sqlite.ts](./cache-sqlite.ts) - Emits events
- [lib/render.ts](../render.ts) - Rendering functions

## Backlinks

