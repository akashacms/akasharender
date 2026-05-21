---
title: "Dry Run Pattern"
type: concept
Sources:
  - lib/refactor-tags.ts
Categories:
  - patterns
  - safety
  - preview
date-created: 2026-05-21T00:00:00+00:00
last-updated: 2026-05-21T00:00:00+00:00
confidence: high
---

# Dry Run Pattern

## Definition

The Dry Run Pattern is a software design pattern where potentially destructive operations can be executed in preview mode, performing all analysis and validation steps without making actual modifications to data or files. The operation returns the same result structure showing what would have been changed, allowing users to verify correctness before committing changes (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):31,53,123).

## How It Works

The pattern is implemented using a boolean flag (typically named `dryRun`) passed in options to control whether modifications are written (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):

**Execution Flow**:
1. Operation executes normally, performing all read operations and analysis
2. Changes are calculated and recorded in result structures
3. At the write step, the `dryRun` flag is checked
4. If `dryRun === true`, writes are skipped but change tracking continues
5. If `dryRun === false`, writes are performed as normal
6. Same result structure is returned in both cases

**In Tag Refactoring** (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):
```typescript
// Process continues normally: read files, parse frontmatter,
// calculate new tag arrays, record all changes...

// Only at the write step does dry run matter:
if (!options.dryRun) {
    parsed.data.tags = newTags;
    const newContent = matter.stringify(parsed.content, parsed.data);
    await fsp.writeFile(fspath, newContent, 'utf-8');
}
// Whether dry run or not, change is recorded in result
```

**Result Structure**: The returned result is identical whether dry run or not, except for the `dryRun` boolean flag itself. This allows users to inspect exactly what would change before committing (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):50-57).

## Key Parameters

**dryRun flag**: Boolean value controlling whether writes occur (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):31):
- `true` - Preview mode, no modifications made
- `false` - Normal mode, changes written to disk/database

**Result tracking**: Both dry run and live execution maintain identical change tracking, allowing comparison and verification (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):50-57).

**Options interface**: Typically implemented as part of an options object rather than a direct parameter, allowing for future extensibility (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts):30-32).

## When To Use

**Before Bulk Operations**: Always run destructive batch operations in dry run mode first to verify the scope and correctness of changes (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Preview for Users**: In CLI tools, show users what will change before asking for confirmation (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Testing**: Use dry run mode in tests to verify operation logic without requiring cleanup of test modifications (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Debugging**: When troubleshooting why an operation produces unexpected results, dry run lets you inspect the logic without side effects (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Documentation**: Dry run output can be used to generate documentation showing what an operation would do (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

## Risks & Pitfalls

**Incomplete Preview**: If read operations have side effects or if dry run mode doesn't perfectly simulate live execution, the preview may be misleading (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**State Changes Between Runs**: Running in dry run mode, then running again in live mode assumes nothing changed in between. In concurrent or distributed systems, this assumption may not hold (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Forgotten Flag**: Users might forget to remove the dry run flag when they actually want to make changes, leading to confusion about why nothing happened (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**Performance Overhead**: If the operation is expensive and you always dry run first, you're essentially running it twice. Consider whether the safety is worth the performance cost (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

**External Dependencies**: Dry run works well for file operations, but may not be meaningful for operations with external side effects (API calls, emails, etc.) that can't be "undone" (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)).

## Sources

- [lib/refactor-tags.ts](../../lib/refactor-tags.ts) - Implementation in tag refactoring

## Related Pages

- [Tag Refactoring](./tag-refactoring.md) - Primary use case in AkashaRender
- [Tag System](./tag-system.md) - Context for tag operations

## Backlinks
