---
title: "lib/cache/schema.ts - Cache Data Schemas"
type: summary
Sources:
  - lib/cache/schema.ts
Categories:
  - cache
  - types
  - validation
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/cache/schema.ts - Cache Data Schemas

## Code Complexity

- **Lines of code**: 497
- **Exported functions**: 10 (validation and table creation functions)
- **Classes**: 0
- **Complexity**: Medium - type definitions with Joi validation schemas
- **Key exports**: 4 interfaces (Asset, Document, Layout, Partial) plus validation functions

## Key Points

- Defines TypeScript interfaces and types for all cache entry types
- Uses Joi for runtime validation of database records
- Provides SQL table creation scripts for each cache type
- Defines four main cache types: Document, Asset, Layout, Partial
- Includes support for vector embeddings in document cache

## Summary

This module defines the data schemas used throughout the AkashaRender caching system (source: [lib/cache/schema.ts](../../../lib/cache/schema.ts)).

**BaseCacheEntry Interface**: Core fields present in all cache entries (source: [lib/cache/schema.ts](../../../lib/cache/schema.ts)):
- `vpath` - Virtual path
- `mime` - MIME type
- `mounted`, `mountPoint`, `pathInMounted` - Mount location information
- `fspath`, `dirname` - Filesystem paths
- `mtimeMs` - Modification time
- `info` - Additional metadata object

**Document Type**: Extends BaseCacheEntry with fields for renderable documents including `docBody`, `docContent`, `metadata`, `layout`, `tags`, and optional vector embedding support (source: [lib/cache/schema.ts](../../../lib/cache/schema.ts)).

**Asset Type**: Extends BaseCacheEntry for files copied without rendering (source: [lib/cache/schema.ts](../../../lib/cache/schema.ts)).

**Partial Type**: Extends BaseCacheEntry with `docBody` and `rendererName` for template partials (source: [lib/cache/schema.ts](../../../lib/cache/schema.ts)).

**Layout Type**: Extends BaseCacheEntry with `docBody` and `rendererName` for layout templates (source: [lib/cache/schema.ts](../../../lib/cache/schema.ts)).

**Validation Functions**: Each type has a `validate*` function using Joi schemas for runtime type checking (source: [lib/cache/schema.ts](../../../lib/cache/schema.ts)).

**SQL Creation**: Exports functions like `doCreateDocumentsTable()`, `doCreateAssetsTable()` that execute table creation SQL loaded from external `.sql` files (source: [lib/cache/schema.ts](../../../lib/cache/schema.ts)).

## Relevant Concepts

- [Cache Schema](../../concepts/cache-schema.md)
- [Type Validation](../../concepts/type-validation.md)
- [Virtual Paths](../../concepts/virtual-paths.md)
- [Vector Embeddings](../../concepts/vector-embeddings.md)

## Related Pages

- [lib/cache/cache-sqlite.ts](./cache-sqlite.ts) - Uses these schemas
- [lib/cache/vfstack.ts](./vfstack.ts) - VPathData type
- [lib/types.ts](../types.ts) - Related type definitions

## Backlinks

