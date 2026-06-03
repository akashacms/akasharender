---
title: "Tag Refactoring"
type: concept
Sources:
  - lib/refactor-tags.ts
  - lib/types.ts
Categories:
  - tags
  - refactoring
  - batch-operations
date-created: 2026-05-21T00:00:00+00:00
last-updated: 2026-05-21T00:00:00+00:00
confidence: high
---

# Tag Refactoring

## Definition

Tag Refactoring is a batch operation that renames a tag across all documents in an AkashaRender project by modifying the YAML frontmatter of every file containing the old tag name. The system uses the gray-matter library to safely parse and rewrite frontmatter while preserving document content, and supports dry-run mode to preview changes before committing them (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):34-49).

## How It Works

The refactoring process is implemented in the `refactorTag()` async function and follows a structured workflow (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):

**Query Phase**: First queries the documents cache to find all documents containing the old tag using `documentsCache.documentsWithTag(oldTag)` (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):64).

**Document Processing**: For each document found (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):66-135):

1. **Retrieves filesystem path** from the document cache entry (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):69-77)
2. **Reads the file** from disk as UTF-8 text (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):82)
3. **Parses frontmatter** using gray-matter library which separates YAML metadata from content (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):85)
4. **Extracts current tags** from parsed frontmatter as an array (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):86-88)
5. **Checks for merge scenario**: If document already contains the new tag, the old tag is simply removed. Otherwise, the old tag is replaced with the new tag (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):91-107)
6. **Records the change** in either `modifiedDocuments` (tag replaced) or `mergedDocuments` (tag removed because new tag exists) arrays (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):116-120)
7. **Writes back** (if not dry run): Uses gray-matter's stringify to reconstruct the file with modified tags array and writes to disk (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):123-127)

**Error Handling**: Any errors during processing are caught and recorded in the result's errors array, allowing the operation to continue with other documents (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):128-134).

**Result Reporting**: Returns a `RefactorTagResult` containing (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):50-57, [lib/types.ts](../../lib/types.ts):81-94):
- Old and new tag names
- Dry run flag
- Arrays of modified and merged documents with before/after tag arrays
- Any errors encountered

## Key Parameters

**oldTag**: String name of the tag to be replaced (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):46).

**newTag**: String name of the replacement tag (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):47).

**options.dryRun**: Boolean flag that when true prevents file modifications. All analysis and change detection occurs, but files are not written back (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):31,123).

**RefactorDocumentChange**: Interface tracking each document modification (source: [lib/types.ts](../../lib/types.ts):99-108):
- `vpath` - Virtual path of document
- `fspath` - Filesystem path
- `originalTags` - Tag array before refactoring
- `newTags` - Tag array after refactoring

## When To Use

**Consolidating Similar Tags**: After running tag similarity detection, use refactoring to merge variants like "JavaScript"/"javascript"/"Javascript" into a single canonical form (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Fixing Typos**: When a typo is discovered in a tag name that's been used across multiple documents (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Renaming for Clarity**: When a tag name needs to be changed to better describe its meaning (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Standardizing Plural/Singular**: Enforcing a convention like "always use singular form" across all tags (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Tag Vocabulary Refactoring**: When restructuring the entire tag taxonomy of a project (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

## Risks & Pitfalls

**Always Dry Run First**: Run with `dryRun: true` to preview changes before modifying files. Review the results carefully to ensure the operation will do what you expect (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):31,53,123).

**Database Desynchronization**: After refactoring, the database cache will be out of sync with file contents. You must re-run `akasha.setup()` to rebuild the cache from the modified files (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Frontmatter Preservation**: While gray-matter preserves content, it may reformat the YAML frontmatter (e.g., changing quote styles or spacing). Review changes before committing (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):21,85,125).

**Merge Scenarios**: Documents that already have the new tag will have the old tag removed but won't get a duplicate. Be aware this changes the tag count for affected documents (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):101-103).

**No Undo**: There is no automatic undo mechanism. Use version control (git) to commit before refactoring so you can revert if needed (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Error Handling**: If errors occur on some documents, the operation continues with others. Check the errors array in results to identify any failures (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):128-134).

## Sources

- [lib/refactor-tags.ts](../../lib/refactor-tags.ts) - Main refactorTag() implementation
- [lib/types.ts](../../lib/types.ts) - RefactorTagResult and related interfaces

## Related Pages

- [Tag System](./tag-system.md) - Overall tag management architecture
- [Tag Similarity Detection](./tag-similarity-detection.md) - Identifies tags that should be refactored
- [Frontmatter Parsing](./frontmatter-parsing.md) - How YAML metadata is extracted and modified
- [Dry Run Pattern](./dry-run-pattern.md) - Preview-before-execute pattern

## Backlinks
