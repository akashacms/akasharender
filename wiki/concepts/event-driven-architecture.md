---
title: Event-Driven Architecture
type: concept
Sources:
  - lib/cache/cache-sqlite.ts
  - lib/cache/watchman.ts
Categories:
  - architecture
  - cache
  - file-watching
  - development
created: 2026-05-21T03:00:00Z
updated: 2026-05-21T03:00:00Z
confidence: high
---

# Event-Driven Architecture

## Definition

Event-Driven Architecture in AkashaRender is the pattern where file cache components (BaseCache and its subclasses) extend Node.js EventEmitter to emit events during file processing, enabling loose coupling between cache operations, file watching, and lifecycle hooks while providing visibility into the caching system's state.

(source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts), [lib/cache/watchman.ts](../../lib/cache/watchman.ts))

## How It Works

The event-driven architecture uses Node.js's EventEmitter pattern to publish events that other components can subscribe to:

1. **BaseCache Extends EventEmitter**: All file cache classes (DocumentsCache, AssetsCache, LayoutsCache, PartialsCache) inherit from BaseCache, which extends EventEmitter.

2. **Events Emitted During Setup**: When `BaseCache.setup()` scans directories:
   - `'added'` event fired for each file successfully processed: `emit('added', name, vpath)`
   - `'ready'` event fired when all files are processed: `emit('ready', name)`
   - `'error'` event fired if processing fails: `emit('error', error)`

3. **File Watching Events**: The watchman module listens to cache events for file changes:
   - `'change'` event: File modified
   - `'add'` event: New file detected
   - `'unlink'` event: File deleted

4. **Event Handlers**: Components register listeners using `.on(event, handler)`:
   ```typescript
   documentsCache.on('change', async (collection, info) => {
       // Re-render the changed document
   });
   
   documentsCache.on('ready', (name) => {
       console.log(`Cache ${name} is ready`);
   });
   ```

5. **Error Propagation**: Errors during file operations are emitted as events rather than thrown, allowing graceful error handling without stopping the entire process.

(source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts):72-81, 153-176, [lib/cache/watchman.ts](../../lib/cache/watchman.ts))

## Key Parameters

### Emitted Events

#### added
- **Signature**: `emit('added', name: string, vpath: string)`
- **When**: File successfully added to cache during initial scan or update
- **Purpose**: Track file processing, verify all files loaded before 'ready'

#### ready
- **Signature**: `emit('ready', name: string)`
- **When**: Initial directory scan and file processing complete
- **Purpose**: Signal that `isReady()` will now return immediately, cache is usable

#### error
- **Signature**: `emit('error', error: Error)`
- **When**: Error occurs during file processing or watching
- **Purpose**: Graceful error handling without crashing the process

#### change, add, unlink (File Watching)
- **Signature**: `emit(event, collection: string, info: FileInfo)`
- **When**: File system changes detected during watch mode
- **Purpose**: Trigger incremental re-rendering or asset copying

### Event Listener Registration

```typescript
cache.on('added', (name: string, vpath: string) => {
    console.log(`[ADDED] ${name}: ${vpath}`);
});

cache.on('ready', (name: string) => {
    console.log(`[READY] ${name}`);
});

cache.on('error', (err: Error) => {
    console.error(`[ERROR]`, err);
});
```

(source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts):74-81, 2530-2547)

## When To Use

Use the event-driven architecture when:

1. **Loose Coupling**: Components need to react to cache operations without tight dependencies
2. **File Watching**: Implementing automatic rebuilding when files change
3. **Progress Tracking**: Monitoring file processing during initialization
4. **Diagnostic Tools**: Building CLI commands that inspect cache state (e.g., `check-ready`, `index --verbose`)
5. **Lifecycle Integration**: Plugins need to react to file additions or changes
6. **Asynchronous Operations**: Operations that should not block the main processing flow

The event-driven approach allows multiple independent components to observe cache behavior without modifying the cache classes themselves.

(source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts), [lib/cache/watchman.ts](../../lib/cache/watchman.ts))

## Risks & Pitfalls

### Memory Leaks from Listeners

Event listeners that are not properly cleaned up can cause memory leaks. The `BaseCache.close()` method removes all listeners, but if you register listeners elsewhere, you must remove them manually.

```typescript
// BaseCache.close() handles cleanup:
this.removeAllListeners('changed');
this.removeAllListeners('added');
this.removeAllListeners('unlinked');
this.removeAllListeners('ready');
```

(source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts):137-148)

### Error Event Not Handled

If an 'error' event is emitted and no listener is registered, Node.js will throw an uncaught exception and crash the process. Always register at least one error listener.

### Event Timing Assumptions

Don't assume events fire synchronously. Event handlers are called in the order they were registered, but each handler is async and may take time to complete.

### Missing Events During Setup

If you register event listeners after `setup()` completes, you'll miss the 'added' and 'ready' events. Register listeners before calling `setup()` or `akasha.setup(config)`.

### Verbose Mode Event Spam

When verbose mode is enabled (`config.verbose = true`), every file addition is logged. For large sites with thousands of files, this creates significant console output.

(source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts):2530-2547)

## Related Pages

- [Cache Schema](./cache-schema.md): Database schema used by event-emitting BaseCache
- [File Watching](./file-watching.md): Uses events to trigger incremental rebuilds
- [Database Indexing](./database-indexing.md): Database operations that trigger events
- [Lifecycle Hooks](./lifecycle-hooks.md): Hooks can be invoked in response to events
- [Command-Line Interface](./command-line-interface.md): CLI commands that register event listeners for diagnostics

## Backlinks

The Event-Driven Architecture concept is referenced by:

- [concepts/README.md](./README.md): Listed under "To Be Documented"
