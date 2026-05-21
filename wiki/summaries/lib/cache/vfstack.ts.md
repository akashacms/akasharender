---
title: "lib/cache/vfstack.ts - Virtual Filesystem Stack"
type: summary
Sources:
  - lib/cache/vfstack.ts
Categories:
  - virtual-filesystem
  - cache
  - directory-stacking
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/cache/vfstack.ts - Virtual Filesystem Stack

## Code Complexity

- **Lines of code**: 416
- **Exported functions**: 1 (mimedefine utility)
- **Classes**: 1 (VFStack class)
- **Complexity**: Medium - recursive directory scanning, virtual path resolution
- **Key methods**: scan(), vpathToFspath(), toIgnore(), iterator protocol implementation

## Key Points

- Implements stacked directory functionality for layered file overrides
- Scans multiple directories and presents unified virtual filesystem
- Supports glob-based file ignoring patterns
- Handles MIME type detection using mime library
- Enables file shadowing where files in later mounts override earlier ones

## Summary

This module implements the VFStack class which creates a virtual filesystem by stacking multiple physical directories (source: [lib/cache/vfstack.ts](../../../lib/cache/vfstack.ts)).

**dirToMount Type**: Specifies how to mount a directory (source: [lib/cache/vfstack.ts](../../../lib/cache/vfstack.ts)):
- `src` - Physical filesystem path to mount
- `dest` - Virtual location to mount at
- `ignore` - Optional glob patterns for files to exclude
- `baseMetadata` - Optional metadata to apply to all files

**VPathData Type**: Represents a file in the virtual filesystem (source: [lib/cache/vfstack.ts](../../../lib/cache/vfstack.ts)):
- `fspath` - Full physical path
- `vpath` - Virtual path (no leading slash)
- `mime` - MIME type from file extension
- `mounted`, `mountPoint`, `pathInMounted` - Mount information
- `statsMtime` - Modification time
- `stack` - Array of all matching VPathData across mounts

**VFStack Class**: Core functionality (source: [lib/cache/vfstack.ts](../../../lib/cache/vfstack.ts)):
- `scan()` - Recursively scans all directories in the stack
- `toIgnore(fspath)` - Checks if file matches ignore patterns
- `vpathToFspath(vpath)` - Converts virtual path to physical path
- Implements iteration protocol to enumerate all files

**File Shadowing**: When multiple mounts contain files with the same virtual path, the last mount in the array takes precedence, allowing files to be overridden (source: [lib/cache/vfstack.ts](../../../lib/cache/vfstack.ts)).

**MIME Type Handling**: Uses the `mime` library with standard types, plus custom definitions added via `mimedefine()` (source: [lib/cache/vfstack.ts](../../../lib/cache/vfstack.ts)).

## Relevant Concepts

- [Stacked Directories](../../concepts/stacked-directories.md)
- [Virtual Filesystem](../../concepts/virtual-filesystem.md)
- [File Shadowing](../../concepts/file-shadowing.md)
- [MIME Type Detection](../../concepts/mime-type-detection.md)

## Related Pages

- [lib/index.ts](../index.ts) - Exports dirToMount and VPathData types
- [lib/cache/cache-sqlite.ts](./cache-sqlite.ts) - Uses VFStack for file scanning
- [lib/cache/schema.ts](./schema.ts) - Related type definitions

## Backlinks

