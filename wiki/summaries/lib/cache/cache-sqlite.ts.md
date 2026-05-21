---
title: "lib/cache/cache-sqlite.ts - SQLite-based File Caching"
type: summary
Sources:
  - lib/cache/cache-sqlite.ts
Categories:
  - cache
  - sqlite
  - file-management
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/cache/cache-sqlite.ts - SQLite-based File Caching

## Code Complexity

- **Lines of code**: 2,638
- **Exported functions**: ~2 major setup functions
- **Classes**: 5 (BaseCache, DocumentsCache, AssetsCache, LayoutsCache, PartialsCache)
- **Complexity**: Very High - largest file, complex class hierarchy, extensive database operations
- **Key complexity**: BaseCache abstract class with 50+ methods, DocumentsCache with additional 30+ methods

## Key Points

- Implements file caching system using SQLite database
- Provides four cache instances: documents, assets, layouts, partials
- Extends EventEmitter for file change notifications
- Supports complex queries including tag searches and semantic search
- Includes query result caching for performance optimization

## Summary

This module implements the core file caching system for AkashaRender using SQLite (source: [lib/cache/cache-sqlite.ts](../../../lib/cache/cache-sqlite.ts)).

**BaseCache Class**: Abstract base class for all file caches with common functionality (source: [lib/cache/cache-sqlite.ts](../../../lib/cache/cache-sqlite.ts)):
- Scans directory stacks using VFStack
- Stores file information in SQLite database
- Emits events: `'added'`, `'ready'`, `'error'`, `'change'`, `'add'`, `'unlink'`
- Provides `find()`, `paths()`, `search()` methods
- Implements query result caching with configurable timeout

**DocumentsCache Class**: Specialized cache for renderable documents with additional methods (source: [lib/cache/cache-sqlite.ts](../../../lib/cache/cache-sqlite.ts)):
- Tag management: `tags()`, `documentsWithTag()`, `findSimilarTags()`
- Layout tracking: `documentsForLayout()`
- Index chain computation: `indexChain()`, `indexFiles()`
- Sibling document queries: `siblings()`
- Semantic search: `semanticSearchDocs()` (with vector embeddings)

**AssetsCache, LayoutsCache, PartialsCache Classes**: Specialized cache instances extending BaseCache for their respective file types (source: [lib/cache/cache-sqlite.ts](../../../lib/cache/cache-sqlite.ts)).

**Module Exports**: Singleton instances (source: [lib/cache/cache-sqlite.ts](../../../lib/cache/cache-sqlite.ts)):
- `documentsCache` - Documents cache instance
- `assetsCache` - Assets cache instance  
- `layoutsCache` - Layouts cache instance
- `partialsCache` - Partials cache instance

**Query Caching**: Uses `cache` library to cache query results for configured timeout period, reducing redundant database queries (source: [lib/cache/cache-sqlite.ts](../../../lib/cache/cache-sqlite.ts)).

**SQL Management**: SQL statements loaded from external `.sql` files and executed with parameter binding for security (source: [lib/cache/cache-sqlite.ts](../../../lib/cache/cache-sqlite.ts)).

## Relevant Concepts

- [File Caching](../../concepts/file-caching.md)
- [SQLite Database](../../concepts/sqlite-database.md)
- [Event-Driven Architecture](../../concepts/event-driven-architecture.md)
- [Tag System](../../concepts/tag-system.md)
- [Semantic Search](../../concepts/semantic-search.md)

## Related Pages

- [lib/cache/vfstack.ts](./vfstack.ts) - Virtual filesystem scanning
- [lib/cache/schema.ts](./schema.ts) - Cache data schemas
- [lib/cache/tag-glue.ts](./tag-glue.ts) - Tag database management
- [lib/sqdb.ts](../sqdb.ts) - Database initialization

## Backlinks

