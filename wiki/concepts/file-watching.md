---
title: "File Watching"
type: concept
Sources:
  - lib/cache/watchman.ts
  - lib/cli.ts
Categories:
  - development
  - automation
  - file-system
date-created: 2026-05-21T01:00:00+00:00
last-updated: 2026-05-21T01:00:00+00:00
confidence: high
---

# File Watching

## Definition

File Watching is AkashaRender's development mode feature that monitors file system changes in all configured directories (documents, assets, layouts, partials) using Node.js fs.watch API, automatically triggering cache updates and selective re-rendering when files are added, modified, or deleted, enabling rapid iterative development without manual rebuild commands (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts), [lib/cli.ts](../../lib/cli.ts)).

## How It Works

The watch system is implemented in the watchman module and activated via the `akasharender watch <configFN>` CLI command (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts), [lib/cli.ts](../../lib/cli.ts)):

**Watcher Setup**: For each configured directory stack (documents, assets, layouts, partials), a file system watcher is created using Node.js `fs.watch()` to monitor for changes (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

**Event Detection**: The watcher detects three types of file system events:
- `add` - New file created
- `change` - Existing file modified
- `unlink` - File deleted

**Lifecycle Hook Invocation**: When events are detected, the system invokes corresponding lifecycle hooks (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)):
- File added → `config.hookFileAdded(collection, vpinfo)`
- File changed → `config.hookFileChanged(collection, vpinfo)`
- File unlinked → `config.hookFileUnlinked(collection, vpinfo)`

**Cache Synchronization**: The cache system updates its internal state based on these events, ensuring the in-memory database reflects current file system state (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

**Selective Re-rendering**: Rather than rebuilding the entire site, only affected documents are re-rendered when their dependencies change (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

**CLI Integration**: The `watch` command initializes the system, starts watchers, and keeps the process running until interrupted (source: [lib/cli.ts](../../lib/cli.ts)).

## Key Parameters

**collection**: String identifying which cache type is being watched ('documents', 'assets', 'layouts', 'partials') (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

**vpinfo**: VPathData object containing file metadata including vpath, fspath, and other properties (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

**Directory paths**: All mounted directories in each directory stack are monitored (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

## When To Use

**Active Development**: Run `akasharender watch` during content authoring to see changes reflected immediately without manual rebuilds (source: [lib/cli.ts](../../lib/cli.ts)).

**Template Development**: When modifying layouts or partials, watch mode automatically re-renders affected documents (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

**Asset Updates**: Changes to CSS, JavaScript, or images are detected and copied to output directory (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

**Plugin Development**: Test plugin modifications in real-time as watch mode picks up changes to plugin files (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

## Risks & Pitfalls

**Performance Impact**: Watching large directory trees with many files can consume system resources (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

**Race Conditions**: Rapid file changes may trigger overlapping rebuild operations (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

**Platform Differences**: File watching behavior varies across operating systems (Linux, macOS, Windows) (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

**Partial State**: If watching is interrupted during a rebuild, the output directory may be in an inconsistent state (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)).

## Sources

- [lib/cache/watchman.ts](../../lib/cache/watchman.ts) - File watching implementation
- [lib/cli.ts](../../lib/cli.ts) - Watch command

## Related Pages

- [Lifecycle Hooks](./lifecycle-hooks.md) - Hooks invoked by file changes
- [File Caching](./file-caching.md) - Cache updated by watchers
- [Command-Line Interface](./command-line-interface.md) - Watch command
- [Rendering Pipeline](./rendering-pipeline.md) - Triggered by changes

## Backlinks
