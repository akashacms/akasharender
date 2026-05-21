---
title: "Database Extensions"
type: concept
Sources:
  - lib/sqdb.ts
Categories:
  - database
  - sqlite
  - extensions
date-created: 2026-05-21T03:00:00+00:00
last-updated: 2026-05-21T03:00:00+00:00
confidence: high
---

# Database Extensions

## Definition

Database Extensions are SQLite loadable extensions that add specialized functionality beyond standard SQL, including regular expression matching (sqlite-regex), vector similarity search (sqlite-vec), and text embedding generation (sqlite-lembed). AkashaRender loads these extensions at startup to enable advanced querying capabilities like regex-based text search, semantic document search using vector embeddings, and ML-powered similarity matching (source: [lib/sqdb.ts](../../lib/sqdb.ts):30-73).

## How It Works

Extensions are loaded into the shared in-memory SQLite database during initialization (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

**Three Core Extensions**:

1. **sqlite-regex** (always loaded): Provides regular expression functions for SQL queries (source: [lib/sqdb.ts](../../lib/sqdb.ts):30,47):
   ```typescript
   import * as sqlite_regex from "sqlite-regex";
   sqdb.inner.loadExtension(sqlite_regex.getLoadablePath());
   ```
   Enables `REGEXP` operator in WHERE clauses for pattern matching.

2. **sqlite-vec** (conditionally loaded): Vector similarity search extension enabling nearest-neighbor queries on embeddings (source: [lib/sqdb.ts](../../lib/sqdb.ts):31,64):
   ```typescript
   import * as sqlite_vec from 'sqlite-vec';
   sqlite_vec.load(<any>sqdb.inner);
   ```
   Loaded only when `AK_LEMBED_MODEL` environment variable is set.

3. **sqlite-lembed** (conditionally loaded): Text embedding generation using machine learning models (source: [lib/sqdb.ts](../../lib/sqdb.ts):32,63):
   ```typescript
   import * as sqlite_lembed from 'sqlite-lembed';
   sqlite_lembed.load(<any>sqdb.inner);
   ```
   Loaded only when embedding model is configured via environment variables.

**Environment Variable Configuration** (source: [lib/sqdb.ts](../../lib/sqdb.ts):49-54):
- `AK_LEMBED_MODEL` - Path to embedding model file (e.g., ONNX model)
- `AK_LEMBED_MODEL_NAME` - Name identifier for the loaded model
- When both are set, vector search capabilities are enabled

**Model Registration**: When embedding model is configured, it's registered in a temporary table (source: [lib/sqdb.ts](../../lib/sqdb.ts):66-72):
```sql
INSERT INTO temp.lembed_models(name, model)
select ?, lembed_model_from_file(?);
```
This makes the model available for use by `lembed()` SQL function.

**WAL Mode**: Write-Ahead Logging is enabled for better concurrent access and crash recovery (source: [lib/sqdb.ts](../../lib/sqdb.ts):75):
```typescript
await sqdb.run('PRAGMA journal_mode=WAL;');
```

**Extension Loading API**: Extensions use `sqdb.inner.loadExtension()` which requires the path to the compiled extension binary (source: [lib/sqdb.ts](../../lib/sqdb.ts):47).

## Key Parameters

**sqlite_regex.getLoadablePath()**: Returns filesystem path to the compiled regex extension binary (source: [lib/sqdb.ts](../../lib/sqdb.ts):47).

**sqlite_vec.getLoadablePath()**: Returns path to vector search extension binary (source: [lib/sqdb.ts](../../lib/sqdb.ts):61).

**sqlite_lembed.getLoadablePath()**: Returns path to embedding generation extension binary (source: [lib/sqdb.ts](../../lib/sqdb.ts):60).

**AK_LEMBED_MODEL environment variable**: Path to ML model file used for generating text embeddings (source: [lib/sqdb.ts](../../lib/sqdb.ts):49-50).

**AK_LEMBED_MODEL_NAME environment variable**: String identifier for the model, used when multiple models might be available (source: [lib/sqdb.ts](../../lib/sqdb.ts):52-53).

**lembedModelName export**: Exported constant allowing other modules to check if embedding is enabled (source: [lib/sqdb.ts](../../lib/sqdb.ts):52-54).

## When To Use

**Regular Expressions**: Use sqlite-regex extension for complex text pattern matching in SQL queries, like finding documents with specific URL patterns or text formats (source: [lib/sqdb.ts](../../lib/sqdb.ts):30,47).

**Semantic Search**: Enable vector embeddings when you need content-based similarity search beyond keyword matching. Requires downloading an appropriate ML model (source: [lib/sqdb.ts](../../lib/sqdb.ts):49-73).

**Similarity Queries**: Use vector search to find documents similar to a given document or query text, useful for "related articles" features (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

**Development vs Production**: Regex extension is always available. Vector search is opt-in and adds significant overhead, so only enable when needed (source: [lib/sqdb.ts](../../lib/sqdb.ts):56).

## Risks & Pitfalls

**Extension Dependencies**: Extensions are native compiled binaries. They must match the SQLite version and platform architecture. The npm packages handle this but may fail on unusual platforms (source: [lib/sqdb.ts](../../lib/sqdb.ts):30-32).

**Model Download Size**: Embedding models can be hundreds of megabytes. Users must download and configure models separately, not included with AkashaRender (source: [lib/sqdb.ts](../../lib/sqdb.ts):49-51).

**Performance Overhead**: Vector operations and embedding generation are CPU-intensive. Enabling these features significantly increases build times (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

**Memory Usage**: Loading ML models into memory increases RAM requirements. In-memory database already uses significant memory; vector features add more (source: [lib/sqdb.ts](../../lib/sqdb.ts):43).

**Configuration Complexity**: Vector search requires correct environment variable setup. Missing or incorrect paths cause silent failures or errors (source: [lib/sqdb.ts](../../lib/sqdb.ts):49-73).

**Extension Availability**: Not all SQLite extensions are universally available. Some platforms may not support loadable extensions at all (source: [lib/sqdb.ts](../../lib/sqdb.ts):47).

**Type Safety**: Extension loading uses `<any>` type cast, bypassing TypeScript checks. Runtime errors are possible if extension APIs change (source: [lib/sqdb.ts](../../lib/sqdb.ts):63-64).

**Conditional Features**: Code depending on vector search must check `lembedModelName !== undefined` to ensure feature is enabled (source: [lib/sqdb.ts](../../lib/sqdb.ts):52-54).

## Sources

- [lib/sqdb.ts](../../lib/sqdb.ts) - Extension loading and configuration

## Related Pages

- [SQLite Database](./sqlite-database.md) - Database system hosting extensions
- [Semantic Search](./semantic-search.md) - Feature using vector extensions
- [Vector Embeddings](./vector-embeddings.md) - Data structure for similarity search
- [Database Indexing](./database-indexing.md) - Standard SQL optimization
- [Performance Profiling](./performance-profiling.md) - Measuring extension overhead

## Backlinks
