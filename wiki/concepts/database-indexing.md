---
title: "Database Indexing"
type: concept
Sources:
  - lib/cache/sql/create-table-documents.sql
  - lib/cache/sql/create-table-tagglue.sql
  - lib/cache/schema.ts
Categories:
  - database
  - performance
  - optimization
date-created: 2026-05-21T01:00:00+00:00
last-updated: 2026-05-21T01:00:00+00:00
confidence: high
---

# Database Indexing

## Definition

Database Indexing is the strategic creation of SQLite indexes on cache table columns to accelerate query performance for common operations like finding documents by path, tags, parent directory, or publication time. AkashaRender creates comprehensive indexes on all four cache tables (DOCUMENTS, ASSETS, LAYOUTS, PARTIALS) and auxiliary tables like TAGGLUE, using both single-column and composite indexes to optimize the most frequent query patterns (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql), [lib/cache/sql/create-table-tagglue.sql](../../lib/cache/sql/create-table-tagglue.sql)).

## How It Works

Indexes are created as part of table creation SQL scripts and provide fast lookup paths for query predicates (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql)):

**Documents Table Indexes** (17 total indexes) (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):33-64):

Single-column indexes:
- `document_vpath` - Primary virtual path lookups
- `document_mounted` - Find documents in a specific mounted directory
- `document_mountPoint` - Find documents at a mount point
- `document_pathInMounted` - Find documents by their relative path
- `document_fspath` - Lookup by filesystem path
- `document_dirname` - Find documents in a directory
- `document_renderPath` - Find by output path
- `document_rendersToHTML` - Filter documents that render to HTML
- `document_parentDir` - Find documents under a parent directory
- `document_mtimeMs` - Sort/filter by modification time
- `document_publicationTime` - Sort/filter by publication time
- `document_title` - Search/sort by document title
- `document_tags` - Filter documents by tag metadata
- `document_layout` - Find documents using a specific layout
- `document_blogtag` - Find blog posts by tag

Composite indexes:
- `document_vpath_renderpath` - Join queries involving both paths

**TAGGLUE Table Indexes** (3 total indexes) (source: [lib/cache/sql/create-table-tagglue.sql](../../lib/cache/sql/create-table-tagglue.sql):6-11):
- `tagglue_vpath` - Find all tags for a document
- `tagglue_name` - Find all documents with a specific tag
- `tagglue_tuple` (UNIQUE) - Prevent duplicate tag associations, enforce one-to-many relationship

**Index Types**:

1. **Regular Index**: Standard B-tree index for fast lookups (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):33-62)
   ```sql
   CREATE INDEX "document_vpath" ON "DOCUMENTS" ("vpath");
   ```

2. **Unique Index**: Enforces uniqueness constraint while providing index benefits (source: [lib/cache/sql/create-table-tagglue.sql](../../lib/cache/sql/create-table-tagglue.sql):10-11)
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS
       tagglue_tuple ON TAGGLUE (docvpath, tagName);
   ```

3. **Generated Column Indexes**: Indexes on virtual columns extracted from JSON (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):22-29,53-62)
   ```sql
   `title` TEXT GENERATED ALWAYS
       AS (json_extract(info, '$.metadata.title')) STORED,
   ...
   CREATE INDEX "document_title" ON "DOCUMENTS" ("title");
   ```

**Primary Keys**: Documents table uses `vpath` as PRIMARY KEY with WITHOUT ROWID optimization for additional efficiency (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):2,32).

**Generated Columns**: Several indexes target generated columns that extract JSON fields, making JSON metadata searchable without full JSON parsing in queries (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):13-29).

**IF NOT EXISTS**: All index creations use `IF NOT EXISTS` to safely handle re-initialization without errors (source: [lib/cache/sql/create-table-tagglue.sql](../../lib/cache/sql/create-table-tagglue.sql):6,8,10).

**Index Coverage**: Indexes cover nearly every column used in WHERE clauses, ORDER BY, or JOIN conditions throughout the codebase (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql)).

## Key Parameters

**Column selection**: Choose columns that appear in WHERE clauses, JOIN conditions, or ORDER BY clauses of frequent queries (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql)).

**Composite indexes**: Multi-column indexes like `(vpath, renderPath)` optimize queries filtering or sorting on both columns (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):63-64).

**UNIQUE constraint**: Unique indexes both enforce data integrity and provide performance benefits (source: [lib/cache/sql/create-table-tagglue.sql](../../lib/cache/sql/create-table-tagglue.sql):10-11).

**WITHOUT ROWID**: Table option that eliminates internal rowid, using primary key directly for storage, saving space and improving lookups (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):32).

**GENERATED ALWAYS AS STORED**: Creates materialized computed columns that can be indexed for efficient JSON querying (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):13-29).

## When To Use

**Frequent Queries**: Index columns that appear in WHERE clauses of frequently executed queries like finding documents by dirname, tags, or renderPath (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql)).

**Sorting Operations**: Index columns used in ORDER BY clauses, such as publicationTime for chronological sorting (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):53-54).

**Join Conditions**: Index foreign key columns used in joins, like docvpath in TAGGLUE joining to DOCUMENTS.vpath (source: [lib/cache/sql/create-table-tagglue.sql](../../lib/cache/sql/create-table-tagglue.sql):6-7).

**Uniqueness Enforcement**: Use unique indexes to prevent duplicate entries while gaining query performance (source: [lib/cache/sql/create-table-tagglue.sql](../../lib/cache/sql/create-table-tagglue.sql):10-11).

**JSON Field Queries**: Create generated columns with indexes when frequently querying into JSON fields (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):13-29).

**Plugin Requirements**: Plugins can define custom indexes through the `cacheIndexes` property to optimize their specific query patterns (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

## Risks & Pitfalls

**Write Performance**: Every index slows down INSERT, UPDATE, and DELETE operations. AkashaRender's cache is heavily read-biased (many queries, few writes), making extensive indexing appropriate (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql)).

**Storage Overhead**: Indexes consume disk space. With 17 indexes on the DOCUMENTS table, significant storage is used, but acceptable for in-memory SQLite databases (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql)).

**Index Selection**: SQLite's query planner chooses which index to use. Sometimes it makes suboptimal choices. Use EXPLAIN QUERY PLAN to verify index usage (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql)).

**Redundant Indexes**: Indexing both `(A)` and `(A, B)` can be redundant since SQLite can use `(A, B)` for queries on just `A`. However, single-column indexes may still be beneficial for simpler queries (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql)).

**Column Order in Composite Indexes**: Order matters. Index `(A, B)` helps queries filtering on A alone or A+B together, but not B alone (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):63-64).

**Generated Column Costs**: STORED generated columns consume space and are updated on every row modification. They're worthwhile when the extraction cost exceeds the storage cost (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):13-29).

**Index Maintenance**: Indexes are automatically maintained by SQLite. No manual REINDEX is typically needed unless database corruption occurs (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql)).

**NULL Values**: SQLite indexes include NULL values. Queries with `IS NULL` or `IS NOT NULL` can use indexes (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql)).

## Sources

- [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql) - Documents table with 17 indexes
- [lib/cache/sql/create-table-tagglue.sql](../../lib/cache/sql/create-table-tagglue.sql) - TAGGLUE table with 3 indexes
- [lib/cache/schema.ts](../../lib/cache/schema.ts) - Schema definitions and table creation

## Related Pages

- [SQLite Database](./sqlite-database.md) - Database system using these indexes
- [Cache Schema](./cache-schema.md) - Table structures being indexed
- [Tag System](./tag-system.md) - Uses TAGGLUE indexes for tag queries
- [File Caching](./file-caching.md) - System that queries indexed tables
- [Performance Profiling](./performance-profiling.md) - Measuring query performance

## Backlinks
