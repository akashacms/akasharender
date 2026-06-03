---
title: "Stacked Directories"
type: concept
Categories:
  - architecture
  - filesystem
  - virtual-filesystem
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# Stacked Directories

## Definition

Stacked Directories is a virtual filesystem pattern where multiple physical directories are layered on top of each other to create a unified view. Files in later-mounted directories can override or shadow files in earlier-mounted directories that have the same virtual path.

## How It Works

AkashaRender uses stacked directories for four types of content (source: [lib/index.ts](../summaries/lib/index.ts.md)):

1. **Documents** - Content files to be rendered
2. **Assets** - Static files to be copied
3. **Layouts** - Page layout templates
4. **Partials** - Reusable template fragments

Each directory stack is configured through the Configuration object using methods like `addDocumentsDir()`, `addAssetsDir()`, `addLayoutsDir()`, and `addPartialsDir()` (source: [lib/index.ts](../summaries/lib/index.ts.md)).

The VFStack class (source: [lib/cache/vfstack.ts](../summaries/lib/cache/vfstack.ts.md)) implements the stacking mechanism:
- Scans all mounted directories recursively
- Creates a virtual path (vpath) for each file
- When multiple files map to the same vpath, the last mount wins
- Presents a unified view through iteration and lookup methods

## Key Parameters

- **src** - Physical filesystem path to mount
- **dest** - Virtual location to mount at (typically "/")
- **ignore** - Optional array of glob patterns for files to exclude
- **baseMetadata** - Optional metadata to apply to all files in the mount

## When To Use

Use stacked directories when you want to:

- **Override default files**: Place custom layouts or partials in your project to override those from plugins
- **Organize by concern**: Keep different types of content in separate directories
- **Enable plugins to contribute**: Plugins add their own directories to the stack
- **Support theming**: Themes can provide base files that projects can selectively override

The built-in plugin is specifically added last so its templates can be easily overridden (source: [lib/built-in.ts](../summaries/lib/built-in.ts.md)).

## Risks & Pitfalls

- **Unexpected shadowing**: A file in a later mount may unintentionally override an earlier file
- **Order dependency**: The order directories are added matters; changing order changes which files are selected
- **Debugging complexity**: When a file is loaded, it may not be obvious which physical directory it came from
- **No merge semantics**: Files completely override rather than merge; you cannot partially override a file

## Sources

- [lib/index.ts](../summaries/lib/index.ts.md)
- [lib/cache/vfstack.ts](../summaries/lib/cache/vfstack.ts.md)
- [lib/cache/cache-sqlite.ts](../summaries/lib/cache/cache-sqlite.ts.md)

## Related Pages

- [Virtual Filesystem](./virtual-filesystem.md)
- [File Shadowing](./file-shadowing.md)
- [Plugin System](./plugin-system.md)
- [Configuration Class](./configuration-class.md)

## Backlinks

