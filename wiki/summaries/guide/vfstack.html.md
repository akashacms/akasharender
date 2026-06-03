---
title: "guide/vfstack.html.md - VFStack Documentation"
type: summary
Sources:
  - guide/vfstack.html.md
Categories:
  - documentation
  - virtual-filesystem
  - api-reference
date-created: 2026-05-20T21:00:00+00:00
last-updated: 2026-05-20T21:00:00+00:00
confidence: high
---

# guide/vfstack.html.md - VFStack Documentation

## Key Points

- VFStack is a lightweight virtual filesystem for managing stacked directories
- Replaces the complex `@akashacms/stacked-dirs` package with simpler implementation
- Provides file override capability where higher-priority directories take precedence
- Supports glob patterns for ignoring files and directories
- Implements JavaScript iterator protocol for efficient file enumeration

## Summary

This documentation describes the VFStack class which implements virtual filesystem stacking in AkashaRender (source: [guide/vfstack.html.md](../../guide/vfstack.html.md)).

**Core Concept**: Multiple physical directories are overlaid into a single virtual filesystem. When the same file exists in multiple directories, the first match wins (highest priority) (source: [guide/vfstack.html.md](../../guide/vfstack.html.md)).

**Key Features** (source: [guide/vfstack.html.md](../../guide/vfstack.html.md)):
- Simple API for scanning and querying files
- Override support with first-match-wins resolution
- Glob patterns for excluding files/directories
- Full iterator protocol support
- No external dependencies except micromatch
- Fast directory walking with early termination for ignored paths

**Mount Points**: Each directory can be mounted at a specific virtual location, allowing organization of files from different sources (source: [guide/vfstack.html.md](../../guide/vfstack.html.md)).

**VPathData**: Each file is represented by an object containing physical path, virtual path, MIME type, mount information, and modification time (source: [guide/vfstack.html.md](../../guide/vfstack.html.md)).

**API Methods** include `scan()` for building the index, `vpathToFspath()` for path resolution, and iterator support for enumeration (source: [guide/vfstack.html.md](../../guide/vfstack.html.md)).

The design prioritizes simplicity and maintainability over the previous complex implementation (source: [guide/vfstack.html.md](../../guide/vfstack.html.md)).

## Relevant Concepts

- [Virtual Filesystem](../concepts/virtual-filesystem.md)
- [Stacked Directories](../concepts/stacked-directories.md)
- [File Shadowing](../concepts/file-shadowing.md)
- [Mount Points](../concepts/mount-points.md)

## Related Pages

- [lib/cache/vfstack.ts](../lib/cache/vfstack.ts.md) - VFStack implementation
- [guide/configuration.html.md](./configuration.html.md) - Configuration using VFStack
- [lib/cache/cache-sqlite.ts](../lib/cache/cache-sqlite.ts.md) - Uses VFStack

## Backlinks

