---
title: "lib/cache/tag-glue.ts - Tag Database Management"
type: summary
Sources:
  - lib/cache/tag-glue.ts
Categories:
  - tags
  - database
  - search
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/cache/tag-glue.ts - Tag Database Management

## Code Complexity

- **Lines of code**: 424
- **Exported functions**: 0
- **Classes**: 2 (TagGlue, TagDescriptions)
- **Complexity**: Medium - database operations, similarity algorithms (Levenshtein, pluralization)
- **Key methods**: findSimilarTags() with multiple similarity detection strategies

## Key Points

- Manages document-to-tag associations in SQLite database
- Provides tag search and analysis functionality
- Implements similarity detection using Levenshtein distance
- Supports plural/singular tag matching using pluralize library
- Handles tag descriptions for tag index pages

## Summary

This module implements tag database management for AkashaRender's tagging system (source: [lib/cache/tag-glue.ts](../../../lib/cache/tag-glue.ts)).

**TagGlue Class**: Manages the TAGGLUE database table linking documents to tags (source: [lib/cache/tag-glue.ts](../../../lib/cache/tag-glue.ts)):
- `init(db)` - Creates TAGGLUE table with indexes
- `addTagGlue(vpath, tags)` - Associates tags with a document
- `deleteTagGlue(vpath)` - Removes all tag associations for a document
- `tags()` - Returns array of all unique tags
- `pathsForTag(tagName)` - Returns vpaths for documents with specific tag
- `find Similar Tags(threshold)` - Finds groups of similar tags

**Similarity Detection**: Uses three methods to identify similar tags (source: [lib/cache/tag-glue.ts](../../../lib/cache/tag-glue.ts)):
1. **Case-insensitive matching** - Detects capitalization differences
2. **Plural/singular** - Uses pluralize library to match variants
3. **Levenshtein distance** - Finds typos within threshold distance

**TagDescriptions Class**: Manages tag descriptions stored in database (source: [lib/cache/tag-glue.ts](../../../lib/cache/tag-glue.ts)):
- `addTagDescription(tagName, description)` - Stores description for a tag
- `tagDescription(tagName)` - Retrieves description for a tag
- `tagsWithoutDescriptions()` - Lists tags lacking descriptions

**Database Structure**: Uses indexed table for efficient tag queries (source: [lib/cache/tag-glue.ts](../../../lib/cache/tag-glue.ts)):
- Indexes on `docvpath` and `tagName` for fast lookups
- Unique index on tuple `(docvpath, tagName)` to prevent duplicates

**SQL Files**: All SQL statements loaded from external files in `sql/` directory (source: [lib/cache/tag-glue.ts](../../../lib/cache/tag-glue.ts)).

## Relevant Concepts

- [Tag System](../../concepts/tag-system.md)
- [Tag Similarity Detection](../../concepts/tag-similarity-detection.md)
- [Levenshtein Distance](../../concepts/levenshtein-distance.md)
- [Database Indexing](../../concepts/database-indexing.md)

## Related Pages

- [lib/types.ts](../types.ts) - SimilarTagGroup and related types
- [lib/cache/cache-sqlite.ts](./cache-sqlite.ts) - Uses TagGlue
- [lib/refactor-tags.ts](../refactor-tags.ts) - Tag refactoring operations

## Backlinks

