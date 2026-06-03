---
title: "Type Validation"
type: concept
Sources:
  - lib/cache/schema.ts
  - lib/types.ts
Categories:
  - validation
  - types
  - data-integrity
date-created: 2026-05-21T03:00:00+00:00
last-updated: 2026-05-21T03:00:00+00:00
confidence: high
---

# Type Validation

## Definition

Type Validation is the runtime verification of data structures using Joi schemas to ensure values retrieved from the SQLite database match expected TypeScript interfaces, catching type mismatches, missing fields, and invalid values that TypeScript's compile-time checking cannot detect. Each cache entry type (Asset, Document, Layout, Partial) has a corresponding Joi schema and validation function that validates database rows before use, preventing runtime errors from malformed data (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):135-152,209-214,280-285).

## How It Works

Validation combines TypeScript compile-time types with Joi runtime schemas (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)):

**Joi Schema Definition**: Each TypeScript interface has a matching Joi object schema (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):135-146):
```typescript
export const joiAsset = Joi.object({
    vpath: Joi.string(),
    mime: Joi.string().optional().allow(null),
    mounted: Joi.string(),
    mountPoint: Joi.string(),
    pathInMounted: Joi.string(),
    fspath: Joi.string(),
    dirname: Joi.string(),
    mtimeMs: Joi.number(),
    info: Joi.any()
});
```

**Validation Function Pattern**: Each type has a validation function returning `{error, value}` tuple (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):148-152):
```typescript
export function validateAsset(obj: any): {
    error: any,
    value: Asset
} {
    return joiAsset.validate(obj);
}
```

**Field Type Specifications**:
- `Joi.string()` - Required string field
- `Joi.string().optional().allow(null)` - Optional string that can be null
- `Joi.number()` - Numeric field (REAL or INTEGER from SQLite)
- `Joi.any()` - Unvalidated field accepting any value
- `Joi.alternatives().try(...)` - Multiple acceptable types

**Type Guards**: Validation functions serve as TypeScript type guards, narrowing `any` to specific interfaces (source: [lib/types.ts](../../lib/types.ts):35-45):
```typescript
export function validTagDescription(obj: unknown): obj is TagDescription {
    if (obj === null || typeof obj !== 'object') {
        return false;
    }
    const candidate = obj as Record<string, unknown>;
    return (
        typeof candidate.tagName === 'string' &&
        candidate.tagName.length > 0 &&
        typeof candidate.description === 'string'
    );
}
```

**Validation Timing**: Typically performed after retrieving rows from database, before using the data in application logic (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**Error Handling**: If validation fails, `error` field contains details about what failed. Application code should check for errors and handle appropriately (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):148-152).

## Key Parameters

**obj: any**: The value to validate, typically a database row deserialized from SQL (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):148).

**error**: Joi validation error object containing failure details, or null if valid (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):149).

**value**: The validated object, typed to the interface if validation succeeded (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):150).

**.optional()**: Joi modifier indicating field can be undefined (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):138).

**.allow(null)**: Joi modifier permitting null values, necessary for SQL NULL (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):138).

**.number()**: Joi type for numeric fields. Can be refined with `.integer()` for INTEGER columns (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):144).

## When To Use

**Database Boundaries**: Validate data immediately after reading from database before passing to application logic (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**API Boundaries**: Validate user input or external data before processing (source: [lib/types.ts](../../lib/types.ts):35-45).

**Configuration Validation**: Verify configuration objects have required fields with correct types (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**Data Migration**: When changing schemas, validation catches incompatibilities between old and new formats (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**Plugin Data**: Validate plugin-provided data structures to prevent malformed data from crashing the system (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

## Risks & Pitfalls

**Performance Overhead**: Joi validation has measurable cost. For bulk operations with many rows, consider sampling or caching validation results (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**Schema Synchronization**: Joi schemas must be manually kept in sync with TypeScript interfaces. Mismatches cause either validation failures or type unsafety (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**Optional vs Required**: Easy to get wrong. Field marked required in TypeScript but `.optional()` in Joi (or vice versa) causes issues (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):138).

**NULL Handling**: SQL NULL is distinct from undefined. Use `.allow(null)` for nullable SQL columns, `.optional()` for omittable JavaScript properties (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):138).

**Number Types**: Joi `.number()` accepts both integers and floats. Use `.integer()` if SQL column is INTEGER (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):144).

**Any Types**: `Joi.any()` provides no validation. Use sparingly and only for truly unstructured data like JSON blobs (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):145).

**Error Messages**: Default Joi error messages may not be user-friendly. Consider custom messages for user-facing validation (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

**Boolean Storage**: SQLite stores booleans as 0/1 integers. Use `Joi.alternatives().try(Joi.boolean(), Joi.number().integer().min(0).max(1))` to accept both (source: [lib/cache/schema.ts](../../lib/cache/schema.ts):270-274).

## Sources

- [lib/cache/schema.ts](../../lib/cache/schema.ts) - Joi schemas and validation functions
- [lib/types.ts](../../lib/types.ts) - Type guard validation functions

## Related Pages

- [Cache Schema](./cache-schema.md) - Data structures being validated
- [SQLite Database](./sqlite-database.md) - Source of data requiring validation
- [File Caching](./file-caching.md) - System using validated data

## Backlinks
