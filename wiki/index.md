---
title: "AkashaRender Code Wiki"
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-22T00:00:00+00:00
---

# AkashaRender Code Wiki

Welcome to the LLM-CODE-WIKI for AkashaRender. This knowledge base is derived from the AkashaRender source code to facilitate understanding, development, and maintenance.

## Overview

AkashaRender is the core component of AkashaCMS, a static site generator that renders websites, EPUB books, and PDF documents from the same content source.

## Wiki Sections

### [Summaries](./summaries/README.md)

File-by-file summaries of the source code in `lib/` and `lib/cache/`:

- **Core modules**: index.ts, types.ts, Plugin.ts, render.ts
- **CLI & Tools**: cli.ts, refactor-tags.ts
- **Database & Performance**: sqdb.ts, data.ts
- **Caching System**: cache-sqlite.ts, vfstack.ts, schema.ts, tag-glue.ts, watchman.ts
- **DOM Processing**: mahafuncs.ts, built-in.ts

### [Concepts](./concepts/README.md)

Key architectural concepts and patterns:

**Architecture**:
- **[Stacked Directories](./concepts/stacked-directories.md)**: Virtual filesystem with layered file overrides
- **[Three-Stage Rendering](./concepts/three-stage-rendering.md)**: Pipeline from source to final HTML
- **[Plugin System](./concepts/plugin-system.md)**: Extensibility mechanism for reusable functionality

**Content Organization**:
- **[Tag System](./concepts/tag-system.md)**: Categorizing content with vocabulary tags
- **[Tag Similarity Detection](./concepts/tag-similarity-detection.md)**: Finding tag variants and typos
- **[Tag Refactoring](./concepts/tag-refactoring.md)**: Batch renaming tags across documents

**Built-in Plugin Features**:
- **[Built-in Plugin](./concepts/built-in-plugin.md)**: Automatically-added core functionality
- **[Link Relativization](./concepts/link-relativization.md)**: URL transformation for portable sites
- **[Image Resizing](./concepts/image-resizing.md)**: Responsive image generation
- **[Nunjucks Extensions](./concepts/nunjucks-extensions.md)**: Custom template tags for assets

**Plugin Extensibility**:
- **[Lifecycle Hooks](./concepts/lifecycle-hooks.md)**: Plugin callback methods for build events
- **[Custom Elements](./concepts/custom-elements.md)**: Custom HTML tags via Mahabhuta

**Database and Caching**:
- **[Database Indexing](./concepts/database-indexing.md)**: SQLite index strategies
- **[Cache Schema](./concepts/cache-schema.md)**: File cache data model
- **[Key-Value Store](./concepts/key-value-store.md)**: Simple plugin storage using sq3-kv-data-store

**Architecture Patterns**:
- **[Event-Driven Architecture](./concepts/event-driven-architecture.md)**: EventEmitter pattern for reactive caching

**Development Tools**:
- **[Command-Line Interface](./concepts/command-line-interface.md)**: The akasharender CLI tool
- **[Performance Profiling](./concepts/performance-profiling.md)**: Rendering timing measurements
- **[Performance Tracing](./concepts/performance-tracing.md)**: Per-stage timing data in TRACES table
- **[File Watching](./concepts/file-watching.md)**: Auto-rebuild on file changes

**Advanced Database**:
- **[Database Extensions](./concepts/database-extensions.md)**: SQLite extensions for regex, vectors, embeddings
- **[Vector Embeddings](./concepts/vector-embeddings.md)**: ML-powered semantic representations
- **[Semantic Search](./concepts/semantic-search.md)**: Meaning-based content discovery

**Quality and Deployment**:
- **[Type Validation](./concepts/type-validation.md)**: Runtime data verification with Joi
- **[Site Rendering](./concepts/site-rendering.md)**: Complete site build workflow
- **[GitHub Pages Publishing](./concepts/github-pages-publishing.md)**: Automated deployment

### [Answers](./answers/README.md)

Detailed answers to technical questions about the codebase:

- **[Detailed Flow for Rendering a Single Page from vpath](./answers/rendering-flow-from-vpath.md)**: Step-by-step walkthrough of the complete rendering process

### [Architecture](./architecture/README.md)

High-level architecture documentation for major subsystems:

- **[Sitemap Validation Architecture](./architecture/sitemap-validation.md)**: Design for validating generated sitemaps against local filesystem

### [Implementation](./implementation/README.md)

Implementation guides for features and modifications:

- **[Sitemap Validation Implementation](./implementation/sitemap-validation.md)**: Complete implementation guide for building the sitemap validator

### [Log](./log/README.md)

Audit trail of changes to the wiki.

## Quick Reference

**Main Entry Point**: [lib/index.ts](./summaries/lib/index.ts.md) exports the Configuration class and public API

**Rendering**: [lib/render.ts](./summaries/lib/render.ts.md) implements the three-stage rendering pipeline

**File Caching**: [lib/cache/cache-sqlite.ts](./summaries/lib/cache/cache-sqlite.ts.md) provides SQLite-based file caching

**Virtual Filesystem**: [lib/cache/vfstack.ts](./summaries/lib/cache/vfstack.ts.md) implements directory stacking

**CLI Tool**: [lib/cli.ts](./summaries/lib/cli.ts.md) provides the `akasharender` command with rendering, watching, and inspection commands

## Getting Started

1. Start with [lib/index.ts](./summaries/lib/index.ts.md) to understand the public API
2. Read [Configuration Class](./concepts/configuration-class.md) to learn about project setup
3. Explore [Three-Stage Rendering](./concepts/three-stage-rendering.md) to understand document processing
4. Study [Plugin System](./concepts/plugin-system.md) to learn about extensibility

## Contributing to the Wiki

The wiki follows the rules defined in [AGENTS.md](../AGENTS.md):

- All source files outside `wiki/` are immutable
- Summary pages document individual source files
- Concept pages explain software patterns and architecture
- All claims should cite their sources
- Cross-link related pages

## Recent Activity

See [log/README.md](./log/README.md) for a chronological list of changes.
