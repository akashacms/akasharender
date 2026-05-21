---
title: "lib/types.ts - TypeScript Type Definitions"
type: summary
Sources:
  - lib/types.ts
Categories:
  - types
  - tags
  - refactoring
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/types.ts - TypeScript Type Definitions

## Code Complexity

- **Lines of code**: 117
- **Exported functions**: 1 (validTagDescription type guard)
- **Classes**: 0
- **Complexity**: Low - pure type definitions and interfaces
- **Key exports**: 7 interfaces/types for tag management and refactoring

## Key Points

- Defines TypeScript interfaces and types used throughout AkashaRender
- Primary focus is on tag-related types for tag management and refactoring
- Includes validation functions for runtime type checking
- Supports tag similarity analysis (case differences, plurals, typos)
- Defines types for tag refactoring operations including dry-run support

## Summary

This file contains TypeScript type definitions that are shared across the AkashaRender codebase. The types primarily focus on tag management, validation, and refactoring operations (source: [lib/types.ts](../../lib/types.ts)).

**TagDescription Interface**: Represents a tag with its description, used for displaying descriptions on tag index pages. It contains two required fields (source: [lib/types.ts](../../lib/types.ts)):
- `tagName: string` - The name of the tag
- `description: string` - The description to display

**validTagDescription Function**: A type guard function that validates whether an object conforms to the TagDescription interface. It performs runtime checks to ensure the object has valid `tagName` and `description` string properties, with the tagName being non-empty (source: [lib/types.ts](../../lib/types.ts)).

**SimilarTagGroup Interface**: Used for tag analysis to identify groups of similar tags. Tags may be similar due to (source: [lib/types.ts](../../lib/types.ts)):
- Case differences (e.g., "JavaScript" vs "javascript")
- Plural/singular variants (e.g., "tag" vs "tags")
- Small Levenshtein distances indicating typos

The interface includes:
- `tags: string[]` - Array of similar tag names
- `reasons: SimilarityReason[]` - Why these tags are considered similar
- `documentsByTag: Record<string, string[]>` - Maps each tag to documents using it

**SimilarityReason Type**: An enumeration of reasons why tags are considered similar (source: [lib/types.ts](../../lib/types.ts)):
- `'case-insensitive'` - Tags differ only in capitalization
- `'plural-singular'` - Plural vs singular forms
- `'levenshtein'` - Small edit distance (typos)

**TagWithoutDescription Interface**: Identifies tags that lack descriptions, containing (source: [lib/types.ts](../../lib/types.ts)):
- `tagName: string` - The tag without a description
- `documents: string[]` - Documents using this tag

**RefactorTagResult Interface**: Comprehensive result type for tag refactoring operations, tracking (source: [lib/types.ts](../../lib/types.ts)):
- `oldTag: string` - The tag being replaced
- `newTag: string` - The replacement tag
- `dryRun: boolean` - Whether this was a dry run (no actual modifications)
- `modifiedDocuments: RefactorDocumentChange[]` - Documents that were modified
- `mergedDocuments: RefactorDocumentChange[]` - Documents that already had the new tag
- `errors: RefactorError[]` - Any errors encountered

**RefactorDocumentChange Interface**: Tracks changes made to individual documents during refactoring (source: [lib/types.ts](../../lib/types.ts)):
- `vpath: string` - Virtual path of the document
- `fspath: string` - Filesystem path of the document
- `originalTags: string[]` - Tags before refactoring
- `newTags: string[]` - Tags after refactoring

**RefactorError Interface**: Records errors during tag refactoring operations (source: [lib/types.ts](../../lib/types.ts)):
- `vpath: string` - Virtual path where error occurred
- `fspath: string` - Filesystem path where error occurred
- `error: string` - Error description

These types support AkashaRender's tag management system, which allows content to be categorized and indexed by tags. The refactoring types enable batch operations to rename or merge tags across all documents in a project.

## Relevant Concepts

- [Tag System](../concepts/tag-system.md)
- [Tag Refactoring](../concepts/tag-refactoring.md)
- [Type Guards](../concepts/type-guards.md)
- [Virtual Paths](../concepts/virtual-paths.md)

## Related Pages

- [lib/refactor-tags.ts](./refactor-tags.ts) - Tag refactoring implementation
- [lib/index.ts](./index.ts) - Main entry point using these types
- [lib/cache/tag-glue.ts](./cache/tag-glue.ts) - Tag database operations

## Backlinks

