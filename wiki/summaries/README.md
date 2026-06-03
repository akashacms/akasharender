---
title: Summary index
---

# Summary Pages

This directory contains summaries of source files from the AkashaRender codebase.

## lib/

- **[lib/index.ts](./lib/index.ts.md)**: Main entry point and public API for AkashaRender, exports Configuration class and core functions
- **[lib/types.ts](./lib/types.ts.md)**: TypeScript type definitions for tags, refactoring, and validation
- **[lib/Plugin.ts](./lib/Plugin.ts.md)**: Base class for all AkashaRender plugins with extensibility support
- **[lib/built-in.ts](./lib/built-in.ts.md)**: Built-in plugin providing core Mahabhuta functions and template features
- **[lib/cli.ts](./lib/cli.ts.md)**: Command-line interface with commands for rendering, watching, publishing, and inspection
- **[lib/render.ts](./lib/render.ts.md)**: Document rendering engine implementing three-stage rendering pipeline
- **[lib/data.ts](./lib/data.ts.md)**: Performance tracking system storing rendering traces in SQLite
- **[lib/sqdb.ts](./lib/sqdb.ts.md)**: SQLite database initialization with extensions for regex, vectors, and embeddings
- **[lib/mahafuncs.ts](./lib/mahafuncs.ts.md)**: Wrapper classes for Mahabhuta DOM manipulation functions
- **[lib/refactor-tags.ts](./lib/refactor-tags.ts.md)**: Tag refactoring implementation with dry-run support

## lib/cache/

- **[lib/cache/schema.ts](./lib/cache/schema.ts.md)**: Data schemas and validation for cache entries (documents, assets, layouts, partials)
- **[lib/cache/cache-sqlite.ts](./lib/cache/cache-sqlite.ts.md)**: SQLite-based file caching with tag search and semantic search support
- **[lib/cache/vfstack.ts](./lib/cache/vfstack.ts.md)**: Virtual filesystem implementation supporting directory stacking and file shadowing
- **[lib/cache/tag-glue.ts](./lib/cache/tag-glue.ts.md)**: Tag database management with similarity detection and descriptions
- **[lib/cache/watchman.ts](./lib/cache/watchman.ts.md)**: File watching system for automatic rebuilding during development

## built-in-guide/

- **[built-in-guide/index.html.md](./built-in-guide/index.html.md)**: Documentation for built-in plugin features and custom tags

## guide/

- **[guide/index.html.md](./guide/index.html.md)**: AkashaRender guide introduction and overview
- **[guide/configuration.html.md](./guide/configuration.html.md)**: Project configuration guide
- **[guide/vfstack.html.md](./guide/vfstack.html.md)**: VFStack virtual filesystem documentation
- **[guide/database.html.md](./guide/database.html.md)**: Database and caching guide
- **[guide/2-setup.html.md](./guide/2-setup.html.md)**: Setup guide
- **[guide/3-create-content.html.md](./guide/3-create-content.html.md)**: Content creation guide
- **[guide/command-line.html.md](./guide/command-line.html.md)**: Command-line reference
- **[guide/layouts-partials.html.md](./guide/layouts-partials.html.md)**: Layouts and partials guide
- **[guide/rendering-engines.html.md](./guide/rendering-engines.html.md)**: Rendering engines documentation
- **[guide/plugins-using.html.md](./guide/plugins-using.html.md)**: Using plugins guide
- **[guide/plugins-writing.html.md](./guide/plugins-writing.html.md)**: Writing plugins guide
- **[guide/theming.html.md](./guide/theming.html.md)**: Theming guide
- **[guide/css-less.html.md](./guide/css-less.html.md)**: CSS and LESS guide
- **[guide/toc.html.md](./guide/toc.html.md)**: Table of contents
- **[guide/cover.html](./guide/cover.html)**: Guide cover page

## layouts/

- **[layouts/ak_core_macros.njk](./layouts/ak_core_macros.njk.md)**: Nunjucks core macros for built-in plugin

## partials/

- **[partials/ak_figimg.html.ejs](./partials/ak_figimg.html.ejs.md)**: Figure/image partial template (EJS)
- **[partials/ak_figimg.html.njk](./partials/ak_figimg.html.njk.md)**: Figure/image partial template (Nunjucks)
- **[partials/ak_figimg.html.handlebars](./partials/ak_figimg.html.handlebars.md)**: Figure/image partial template (Handlebars)
- **[partials/ak_teaser.html.ejs](./partials/ak_teaser.html.ejs.md)**: Teaser partial template (EJS)
- **[partials/ak_teaser.html.njk](./partials/ak_teaser.html.njk.md)**: Teaser partial template (Nunjucks)
- **[partials/ak_show-content.html.ejs](./partials/ak_show-content.html.ejs.md)**: Show content partial (EJS)
- **[partials/ak_show-content.html.njk](./partials/ak_show-content.html.njk.md)**: Show content partial (Nunjucks)
- **[partials/ak_show-content.html.handlebars](./partials/ak_show-content.html.handlebars.md)**: Show content partial (Handlebars)
- **[partials/ak_show-content-card.html.ejs](./partials/ak_show-content-card.html.ejs.md)**: Show content card partial (EJS)
