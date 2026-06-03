---
title: "lib/render.ts - Document Rendering Engine"
type: summary
Sources:
  - lib/render.ts
Categories:
  - rendering
  - document-processing
  - performance
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/render.ts - Document Rendering Engine

## Code Complexity

- **Lines of code**: 953
- **Exported functions**: ~11 major functions (render, render2, renderDocument, renderDocument2, renderContent, etc.)
- **Classes**: 0 (uses type definitions)
- **Complexity**: High - complex async rendering pipeline with multiple stages and error handling
- **Key functions**: render/render2 (site-wide), renderDocument/renderDocument2 (single doc), renderContent (core)

## Key Points

- Implements core document rendering pipeline with three stages
- Uses fastq for concurrent rendering with configurable concurrency
- Tracks detailed performance metrics for each rendering stage
- Supports multiple render formats (HTML, CSS, assets)
- Returns structured RenderingResults with timing and error information

## Summary

This module implements the core document rendering pipeline for AkashaRender (source: [lib/render.ts](../../lib/render.ts)).

**Rendering Pipeline**: Documents are rendered in three stages (source: [lib/render.ts](../../lib/render.ts)):
1. **First Render** - Renders document content using its primary renderer (Markdown, EJS, etc.)
2. **Layout Render** - Wraps content in layout template if specified
3. **Mahabhuta Pass** - Applies DOM manipulation using Mahabhuta functions

**RenderingResults Type**: Comprehensive result object tracking (source: [lib/render.ts](../../lib/render.ts)):
- `vpath`, `renderPath` - Document paths
- `renderFormat` - Format being rendered (HTML, CSS, COPY)
- Start/end timestamps for each stage
- Elapsed times for first, layout, mahabhuta, and total rendering
- `errors[]` - Array of any errors encountered

**RenderingData Type**: Internal type collecting all data needed during rendering including config, renderer, document info, rendering contexts for each stage, and results (source: [lib/render.ts](../../lib/render.ts)).

**Key Functions** (source: [lib/render.ts](../../lib/render.ts)):
- `render(config)` / `render2(config)` - Renders all documents in the project
- `renderDocument(config, docInfo)` / `renderDocument2(config, docInfo)` - Renders a single document
- `renderContent(config, rc)` - Core content rendering with a renderer
- `renderCSSFile(ret)` - Specialized rendering for CSS files
- `copyAssetFile(ret)` - Copies non-rendered asset files

**Concurrency**: Uses fastq promise queue with concurrency set by `config.concurrency` to render multiple documents in parallel (source: [lib/render.ts](../../lib/render.ts)).

**Special Cases**: Handles CSS files separately (renders without layout/mahabhuta) and copies certain asset types directly without rendering (source: [lib/render.ts](../../lib/render.ts)).

**Performance Tracking**: Uses Node.js `performance.now()` to measure timing for each rendering stage, enabling performance analysis and bottleneck identification (source: [lib/render.ts](../../lib/render.ts)).

**Layout Processing**: Finds layout templates, merges metadata, and recursively applies nested layouts if specified (source: [lib/render.ts](../../lib/render.ts)).

**Mahabhuta Integration**: Loads cheerio with HTML, applies all registered mahabhuta functions, and returns processed HTML (source: [lib/render.ts](../../lib/render.ts)).

## Relevant Concepts

- [Rendering Pipeline](../concepts/rendering-pipeline.md)
- [Three-Stage Rendering](../concepts/three-stage-rendering.md)
- [Layout Templates](../concepts/layout-templates.md)
- [Mahabhuta Processing](../concepts/mahabhuta-processing.md)
- [Concurrent Rendering](../concepts/concurrent-rendering.md)

## Related Pages

- [lib/index.ts](./index.ts) - Exports render functions
- [lib/mahafuncs.ts](./mahafuncs.ts) - Mahabhuta function classes
- [lib/data.ts](./data.ts) - Performance tracing
- [lib/cache/cache-sqlite.ts](./cache/cache-sqlite.ts) - Document cache

## Backlinks

