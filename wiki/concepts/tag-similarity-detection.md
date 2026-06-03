---
title: "Tag Similarity Detection"
type: concept
Sources:
  - lib/cache/tag-glue.ts
  - lib/types.ts
Categories:
  - tags
  - algorithms
  - quality-assurance
date-created: 2026-05-21T00:00:00+00:00
last-updated: 2026-05-21T00:00:00+00:00
confidence: high
---

# Tag Similarity Detection

## Definition

Tag Similarity Detection is an automated analysis system that identifies groups of tags that are likely variants of the same concept but are treated as separate tags due to minor differences. The system uses three algorithms - case-insensitive matching, plural/singular detection, and Levenshtein distance - to find tags that should potentially be consolidated into a single canonical form (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

## How It Works

The detection system is implemented in the `TagGlue.findSimilarTags()` method and operates through a multi-stage comparison process (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)):

**Data Collection**: First retrieves all tags with their associated documents from the database using a SQL query that joins the TAGGLUE table (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Pairwise Comparison**: Compares each unique tag against every other tag using three similarity algorithms, applied in sequence (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)):

1. **Case-Insensitive Matching**: Converts both tags to lowercase and compares. Detects variants like "JavaScript" vs "javascript" vs "JAVASCRIPT" (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts):257-259).

2. **Plural/Singular Detection**: Uses the `pluralize` library to convert both tags to their singular forms and compares. Detects variants like "tutorial" vs "tutorials" or "category" vs "categories" (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts):262-266).

3. **Levenshtein Distance**: If neither case nor plural matching succeeded, calculates the Levenshtein edit distance between lowercase versions. Tags within the threshold distance are considered similar. This catches typos like "javascript" vs "javascrpt" (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts):269-274).

**Group Formation**: Tags that match via any algorithm are collected into groups. Each group contains the similar tag names, the reasons for similarity, and a mapping of which documents use each variant (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts):232-244).

**Result Structure**: Returns an array of `SimilarTagGroup` objects (source: [lib/types.ts](../../lib/types.ts)):
- `tags: string[]` - Array of similar tag names
- `reasons: SimilarityReason[]` - Why these tags are similar ('case-insensitive', 'plural-singular', or 'levenshtein')
- `documentsByTag: Record<string, string[]>` - Map of tag name to document vpaths using that tag

**Optimization**: The algorithm uses a `processed` set to avoid duplicate work and only creates groups when multiple similar tags are found (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts):210-244).

## Key Parameters

**Threshold (default: 2)**: Maximum Levenshtein distance for tags to be considered similar. Lower values (1) only catch very close typos. Higher values (3-4) may generate false positives. The default of 2 balances sensitivity and precision (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts):193).

**SimilarityReason**: Union type indicating why tags are similar. Can be 'case-insensitive', 'plural-singular', or 'levenshtein' (source: [lib/types.ts](../../lib/types.ts):64-67).

**SimilarTagGroup**: Interface containing the complete analysis result for one group of similar tags, including the tags themselves, reasons for similarity, and document associations (source: [lib/types.ts](../../lib/types.ts):52-59).

## When To Use

**Tag Quality Audits**: Run similarity detection periodically to identify inconsistent tag usage across your content (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Before Generating Tag Indexes**: Check for similar tags before publishing tag index pages to avoid splitting content across near-duplicate tag pages (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Content Migration**: When importing content from multiple sources, use similarity detection to identify tags that should be standardized (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Establishing Tag Guidelines**: Analyze results to decide on tag naming conventions (e.g., always lowercase, always singular) (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Identifying Refactoring Candidates**: The results directly inform which tags should be consolidated using the tag refactoring system (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

## Risks & Pitfalls

**False Positives with High Threshold**: Setting threshold above 2-3 may flag tags that are genuinely different, like "Java" and "JavaScript" (Levenshtein distance of 6) wouldn't match, but "CSS" and "CSR" (distance of 1) might incorrectly match (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Intentional Variants**: Some projects may intentionally use both singular and plural forms for different purposes. The detection system cannot distinguish intentional from accidental variants (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

**Non-English Tags**: The pluralize library is English-specific. Tags in other languages won't benefit from plural/singular detection (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts):262-266).

**Performance on Large Tag Sets**: The algorithm is O(n²) where n is the number of unique tags. Projects with thousands of unique tags may experience slow analysis times (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts):213-228).

**Detection Doesn't Fix**: This system only identifies problems. You must manually review results and use the tag refactoring system to actually consolidate tags (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).

## Sources

- [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts) - TagGlue.findSimilarTags() implementation
- [lib/types.ts](../../lib/types.ts) - SimilarTagGroup and SimilarityReason types

## Related Pages

- [Tag System](./tag-system.md) - Overall tag management architecture
- [Levenshtein Distance](./levenshtein-distance.md) - String similarity algorithm
- [Tag Refactoring](./tag-refactoring.md) - How to fix inconsistent tags
- [Database Indexing](./database-indexing.md) - Database optimizations for tag queries

## Backlinks
