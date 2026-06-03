---
title: "Tag System"
type: concept
Sources:
  - lib/cache/tag-glue.ts
  - lib/types.ts
  - lib/refactor-tags.ts
Categories:
  - tags
  - database
  - content-organization
date-created: 2026-05-21T00:00:00+00:00
last-updated: 2026-05-21T00:00:00+00:00
confidence: high
---

# Tag System

## Definition

The Tag System is AkashaRender's mechanism for categorizing and organizing content documents using vocabulary tags. Tags are stored as arrays in document frontmatter and tracked in an SQLite database table (TAGGLUE) that maintains many-to-many relationships between documents and tags, enabling efficient querying, analysis, and refactoring of tagged content (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

## How It Works

The tag system operates through several integrated components (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)):

**Tag Storage**: Tags are defined in document frontmatter as YAML arrays and synchronized to a database table during document processing (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Database Structure**: The TAGGLUE table maintains associations with two fields - `docvpath` (document virtual path) and `tagName` (tag string). Three indexes optimize queries:
- Index on `docvpath` for finding all tags on a document
- Index on `tagName` for finding all documents with a tag  
- Unique index on `(docvpath, tagName)` tuple to prevent duplicate associations

**Tag Management Operations** (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)):
- `addTagGlue(vpath, tags)` - Associates an array of tags with a document
- `deleteTagGlue(vpath)` - Removes all tag associations for a document
- `tags()` - Returns array of all unique tags across all documents
- `pathsForTag(tagName)` - Returns vpaths of all documents with a specific tag

**Tag Descriptions**: Tags can have optional descriptions stored in a separate database table. These descriptions are used when generating tag index pages to explain what each tag represents (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Tag Analysis**: The system provides `findSimilarTags()` to identify potentially problematic tag variations using multiple similarity detection algorithms (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Tag Refactoring**: Documents can be batch-updated to rename tags across the entire project using the `refactorTag()` function, with support for dry-run preview mode (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

## Key Parameters

**Tag Names**: String values used to categorize content. Case-sensitive by default, though similarity detection can find case variants (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Virtual Paths (vpaths)**: Location-independent identifiers for documents, used as the foreign key linking tags to documents (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Similarity Threshold**: For tag analysis, the maximum Levenshtein distance to consider tags similar (default: 2). Lower values are more strict (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Tag Descriptions**: Optional explanatory text for tags, stored via `TagDescription` interface with `tagName` and `description` fields (source: [lib/types.ts](../../lib/types.ts)).

## When To Use

**Content Organization**: Use tags to categorize content into logical groupings that can span multiple directory structures (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Tag Index Pages**: Query documents by tag to generate dynamic index pages listing all content with a specific tag (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Tag Analysis**: Use `findSimilarTags()` before generating tag index pages to identify and fix inconsistent tag usage (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Tag Refactoring**: When consolidating similar tags or fixing typos, use `refactorTag()` to batch-rename tags across all documents (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Cross-Plugin Features**: Plugins like `@akashacms/plugins-tagged-content` build on the tag system to provide advanced tag-based functionality (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

## Risks & Pitfalls

**Tag Inconsistency**: Tags are case-sensitive, so "JavaScript", "javascript", and "Javascript" are treated as different tags. Use tag similarity detection and refactoring tools to maintain consistency (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Plural/Singular Variants**: Tags like "tutorial" and "tutorials" are separate. The similarity detection can identify these, but you must manually decide which form to standardize on (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Database Synchronization**: Tag associations in the database must stay synchronized with frontmatter. The caching system handles this during normal rendering, but manual frontmatter edits require re-running setup to update the database (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Tag Refactoring Without Dry Run**: Always run refactoring operations with `dryRun: true` first to preview changes before modifying files (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Missing Tag Descriptions**: Tags without descriptions can still be used, but tag index pages are more useful when tags have explanatory descriptions (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

## Sources

- [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts) - TagGlue and TagDescriptions classes
- [lib/types.ts](../../lib/types.ts) - Tag-related TypeScript interfaces
- [lib/refactor-tags.ts](../../lib/refactor-tags.ts) - Tag refactoring implementation

## Related Pages

- [Tag Similarity Detection](./tag-similarity-detection.md) - How similar tags are identified
- [Tag Refactoring](./tag-refactoring.md) - Batch renaming tags across documents
- [Levenshtein Distance](./levenshtein-distance.md) - String similarity algorithm used in tag analysis
- [Frontmatter Parsing](./frontmatter-parsing.md) - How tags are extracted from document headers
- [SQLite Database](./sqlite-database.md) - Database system storing tag associations

## Backlinks
