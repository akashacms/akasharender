---
title: "Cache Schema"
type: concept
Sources:
  - lib/cache/schema.ts
  - lib/cache/sql/create-table-documents.sql
  - lib/cache/sql/create-table-assets.sql
  - lib/cache/sql/create-table-partials.sql
  - lib/cache/sql/create-table-layouts.sql
Categories:
  - cache
  - database
  - types
date-created: 2026-05-21T01:00:00+00:00
last-updated: 2026-05-21T01:00:00+00:00
confidence: high
---

# Cache Schema

## Definition

Cache Schema is the set of TypeScript interfaces, SQLite table structures, and Joi validation schemas that define the data model for AkashaRender's four file cache types (Documents, Assets, Layouts, Partials). Each cache type extends a common base structure with type-specific fields, uses generated columns for JSON extraction, and includes comprehensive runtime validation to ensure data integrity across the file caching system (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):1-497).

## How It Works

The schema system provides three layers of definition: TypeScript types for compile-time checking, SQLite tables for storage, and Joi schemas for runtime validation (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)):

**Base Structure**: All cache entries share common fields defined in `BaseCacheEntry` (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):31-81):
- `vpath` - Virtual path identifier
- `mime` - MIME type for content type
- `mounted` - Filesystem path that's mounted
- `mountPoint` - Virtual directory of mount
- `pathInMounted` - Relative path under mount point
- `fspath` - Absolute physical filesystem path
- `dirname` - Directory of fspath
- `mtimeMs` - Modification time in milliseconds
- `info` - Additional metadata object

**Four Cache Types**:

1. **Asset** (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):124-170):
   - Extends BaseCacheEntry with no additional fields
   - Used for files copied without rendering (images, CSS, JS)
   - Simplest schema since assets don't need content or metadata

2. **Partial** (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):174-227):
   - Extends BaseCacheEntry with:
     - `docBody` - Template content
     - `rendererName` - Name of renderer class
   - Used for reusable template fragments

3. **Layout** (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):231-297):
   - Extends BaseCacheEntry with:
     - `rendersToHTML` - Whether template produces HTML
     - `docBody` - Template content
     - `rendererName` - Name of renderer class
   - Used for page structure templates

4. **Document** (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):299+):
   - Most complex schema with extensive fields for:
     - `renderPath` - Output path after rendering
     - `rendersToHTML` - Whether document renders to HTML
     - `parentDir` - Parent directory path
     - `docMetadata` - Document frontmatter
     - `docContent` - Document body content
     - `docBody` - Processed body
     - `metadata` - Combined metadata
     - `rendererName` - Name of renderer class
   - Includes generated columns extracting JSON metadata
   - Supports vector embeddings for semantic search

**SQL Table Creation**: Each cache type has a corresponding SQL file loaded at module initialization (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):155-170):
```typescript
export const createAssetsTable = await fsp.readFile(
    path.join(import.meta.dirname, 'sql', 'create-table-assets.sql'),
    'utf-8'
);

export async function doCreateAssetsTable(db: AsyncDatabase) {
    await db.run(await createAssetsTable);
}
```

**Generated Columns**: Documents table uses GENERATED ALWAYS AS STORED for JSON extraction (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):13-29):
```sql
`title` TEXT GENERATED ALWAYS
    AS (json_extract(info, '$.metadata.title')) STORED,
`tags` TEXT GENERATED ALWAYS
    AS (json_extract(info, '$.metadata.tags')) STORED
```

This allows indexing and querying JSON fields without runtime extraction overhead.

**Joi Validation**: Each type has a Joi schema and validation function (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):135-152):
```typescript
export const joiAsset = Joi.object({
    vpath: Joi.string(),
    mime: Joi.string().optional().allow(null),
    mounted: Joi.string(),
    // ... other fields
});

export function validateAsset(obj: any): {
    error: any,
    value: Asset
} {
    return joiAsset.validate(obj);
}
```

**Type Composition**: TypeScript intersection types combine base and specific fields (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):133,189,254):
```typescript
export type Asset = BaseCacheEntry & AssetFields;
export type Partial = BaseCacheEntry & PartialFields;
export type Layout = BaseCacheEntry & LayoutFields;
export type Document = BaseCacheEntry & DocumentFields;
```

**Primary Keys**: Documents table uses `vpath` as PRIMARY KEY with WITHOUT ROWID optimization for space efficiency (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):2,32).

## Key Parameters

**vpath (primary key)**: Virtual path uniquely identifying each cache entry. Must be unique within each cache type (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):36).

**mime**: MIME type string, optional, can be null (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):41).

**mtimeMs**: Modification time as number in milliseconds for precise timestamp comparison (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):74).

**info**: Flexible JSON object storing additional metadata. Structure varies by cache type but always serialized as TEXT in SQLite (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):80).

**docBody**: Template or document content as string. Used in Partial, Layout, and Document types (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):179,244).

**rendererName**: String identifying the Renderer class for processing this file (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):186,251).

**rendersToHTML**: Boolean (stored as INTEGER 0/1 in SQLite) indicating if template produces HTML output (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):239).

## When To Use

**Cache Implementation**: Reference these schemas when implementing or modifying file cache classes (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**Data Validation**: Use validation functions when reading from database to ensure data integrity (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):148-152).

**Query Design**: Understand available fields and indexes when writing SQL queries against cache tables (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**Plugin Development**: Plugins defining custom cache fields should follow the same pattern of TypeScript interfaces + Joi schemas + SQL (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**Schema Migration**: When adding fields, update all three layers: TypeScript type, SQL table, and Joi schema (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

## Risks & Pitfalls

**Schema Synchronization**: TypeScript, SQL, and Joi schemas must stay synchronized. Updating one without the others causes validation or type errors (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**Optional vs Required**: Be careful with `.optional()` and `.allow(null)` in Joi. SQLite TEXT columns can be NULL, but TypeScript might not reflect this (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):138,194).

**Number vs Integer**: Joi has both `.number()` and `.number().integer()`. SQLite stores all numbers as REAL unless explicitly INTEGER. mtimeMs uses REAL to preserve millisecond precision (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):144,200).

**Generated Columns**: Changes to JSON structure in `info` field require regenerating generated columns. This happens automatically on table creation but not on data updates (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):13-29).

**JSON Extraction**: Generated columns use `json_extract()` which requires valid JSON. Malformed JSON in `info` field causes extraction to return NULL (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):14).

**WITHOUT ROWID**: Only Documents table uses this optimization. It's appropriate when primary key is non-integer and frequently used in queries (source: [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql):32).

**Validation Performance**: Joi validation has overhead. For bulk operations, consider validating samples rather than every record (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**SQL File Loading**: SQL files are loaded with `await` at module top-level. This requires modern Node.js with top-level await support (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):155-159).

## Sources

- [lib/cache/schema.ts](../../lib/cache/schema.ts) - TypeScript types, Joi schemas, validation functions
- [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql) - Documents table SQL
- [lib/cache/sql/create-table-assets.sql](../../lib/cache/sql/create-table-assets.sql) - Assets table SQL
- [lib/cache/sql/create-table-partials.sql](../../lib/cache/sql/create-table-partials.sql) - Partials table SQL
- [lib/cache/sql/create-table-layouts.sql](../../lib/cache/sql/create-table-layouts.sql) - Layouts table SQL

## Related Pages

- [File Caching](./file-caching.md) - System using these schemas
- [Database Indexing](./database-indexing.md) - Indexes created on these tables
- [SQLite Database](./sqlite-database.md) - Database storing schema data
- [Virtual Paths](./virtual-paths.md) - Primary key concept
- [Type Validation](./type-validation.md) - Joi validation system

## Backlinks
