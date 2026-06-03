---
title: "guide/configuration.html.md - Configuration Guide"
type: summary
Sources:
  - guide/configuration.html.md
Categories:
  - documentation
  - configuration
date-created: 2026-05-20T21:00:00+00:00
last-updated: 2026-05-20T21:00:00+00:00
confidence: high
---

# guide/configuration.html.md - Configuration Guide

## Key Points

- Configuration object contains everything AkashaRender needs to render a project
- Created in a Node.js module and passed to akasharender command-line
- Supports assets, documents, layouts, and partials directories
- Multiple configurations allow different outputs (website vs EPUB) from same content
- Uses stacked directories for file override capability

## Summary

This guide documents how to configure an AkashaRender project using the Configuration object (source: [guide/configuration.html.md](../../guide/configuration.html.md)).

The configuration file is a standard Node.js module that creates a Configuration instance, configures it, calls `config.prepare()`, and exports it via `module.exports` (source: [guide/configuration.html.md](../../guide/configuration.html.md)).

**Key Configuration Elements** (source: [guide/configuration.html.md](../../guide/configuration.html.md)):
- `rootURL()` - Declares the base URL for the project
- `configDir` - Sets the configuration directory for resolving relative paths
- `setRenderDestination()` - Specifies output directory (defaults to 'out')
- `addAssetsDir()` - Adds directories with files copied verbatim
- `addDocumentsDir()` - Adds directories with files to be rendered
- `addLayoutsDir()` - Adds directories with layout templates
- `addPartialsDir()` - Adds directories with partial templates

Directories can be specified as strings or objects. The object form allows mounting directories at specific virtual locations and including metadata for all files (source: [guide/configuration.html.md](../../guide/configuration.html.md)).

Multiple configurations can be used for the same project, such as one for website output and another for EPUB generation (source: [guide/configuration.html.md](../../guide/configuration.html.md)).

## Relevant Concepts

- [Configuration Class](../concepts/configuration-class.md)
- [Stacked Directories](../concepts/stacked-directories.md)
- [Project Structure](../concepts/project-structure.md)

## Related Pages

- [lib/index.ts](../lib/index.ts.md) - Configuration implementation
- [guide/2-setup.html.md](./2-setup.html.md) - Setup guide
- [guide/vfstack.html.md](./vfstack.html.md) - Virtual filesystem details

## Backlinks

