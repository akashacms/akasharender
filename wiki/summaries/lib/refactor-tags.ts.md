---
title: "lib/refactor-tags.ts - Tag Refactoring Implementation"
type: summary
Sources:
  - lib/refactor-tags.ts
Categories:
  - tags
  - refactoring
  - frontmatter
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/refactor-tags.ts - Tag Refactoring Implementation

## Code Complexity

- **Lines of code**: 138
- **Exported functions**: 1 (refactorTag async function)
- **Classes**: 0
- **Complexity**: Medium - async iteration over documents, frontmatter parsing, file I/O
- **Key operations**: Document query, frontmatter modification, optional dry-run mode

## Key Points

- Implements batch tag renaming across all documents
- Supports dry-run mode to preview changes without modifying files
- Uses gray-matter for frontmatter parsing and modification
- Handles merging when document already has the new tag
- Returns detailed results including modified files and errors

## Summary

This module provides functionality for refactoring (renaming) tags across all documents in an AkashaRender project (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

The main function `refactorTag(config, oldTag, newTag, options)` performs a batch rename operation (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

The `RefactorOptions` interface supports (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):
- `dryRun: boolean` - When true, analyzes changes without modifying files

The refactoring process (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):
1. Queries the documents cache for all documents with `oldTag`
2. For each document, reads the file and parses frontmatter using gray-matter
3. Checks if document already has `newTag`
4. If document has both tags, removes `oldTag` (merge case)
5. If document only has `oldTag`, replaces it with `newTag`
6. In non-dry-run mode, writes modified frontmatter back to file
7. Tracks all changes and errors in the result object

The function returns a `RefactorTagResult` containing (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):
- `oldTag`, `newTag` - The tags being refactored
- `dryRun` - Whether this was a dry run
- `modifiedDocuments[]` - Documents where tag was replaced
- `mergedDocuments[]` - Documents where old tag was removed (already had new tag)
- `errors[]` - Any errors encountered during processing

Each document change records the vpath, fspath, originalTags array, and newTags array (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

The gray-matter library is used to safely parse and modify YAML frontmatter while preserving the document content (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

## Relevant Concepts

- [Tag Refactoring](../concepts/tag-refactoring.md)
- [Frontmatter Parsing](../concepts/frontmatter-parsing.md)
- [Tag System](../concepts/tag-system.md)
- [Dry Run Pattern](../concepts/dry-run-pattern.md)

## Related Pages

- [lib/types.ts](./types.ts) - Defines RefactorTagResult and related types
- [lib/cli.ts](./cli.ts) - CLI commands for tag refactoring
- [lib/cache/cache-sqlite.ts](./cache/cache-sqlite.ts) - Documents cache with tag queries

## Backlinks

