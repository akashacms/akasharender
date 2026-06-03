---
title: "SQLite Database"
type: concept
Sources:
  - lib/sqdb.ts
  - lib/cache/cache-sqlite.ts
Categories:
  - database
  - sqlite
  - infrastructure
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# SQLite Database

## Definition

AkashaRender uses a shared SQLite database as its central data store for file metadata, caching, and performance tracing (source: [lib/sqdb.ts](../../lib/sqdb.ts)). By default, the database runs in-memory for fast access, with optional disk persistence, and is enhanced with extensions for regex matching, vector similarity search, and local embeddings.

## How It Works

### Database Initialization

The database is initialized once at module load time in `lib/sqdb.ts` and exported as a singleton `AsyncDatabase` instance (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

```typescript
const dburl = typeof process.env.AK_DB_URL === 'string'
        ? process.env.AK_DB_URL
        : ':memory:';

export const sqdb = await AsyncDatabase.open(dburl);
```

The `promised-sqlite3` library wraps the native `sqlite3` driver with Promise-based async/await APIs.

### Database Location

The database location is controlled by the `AK_DB_URL` environment variable (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

- **`:memory:`** (default): Fully in-memory database, fastest but ephemeral
- **`file.db`**: Disk-backed persistent database
- **`:memory:?cache=shared`**: Shared in-memory database across connections

### Write-Ahead Logging (WAL)

The database enables WAL mode for improved concurrency (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

```typescript
await sqdb.run('PRAGMA journal_mode=WAL;');
```

WAL benefits:
- Readers don't block writers
- Writers don't block readers
- Improved performance for concurrent operations
- Safer crash recovery

### SQLite Extensions

Three extensions enhance database capabilities (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

**1. sqlite-regex**: Adds regular expression support to SQL queries
```sql
SELECT * FROM documents WHERE vpath REGEXP '^blog/.*\.md$';
```

**2. sqlite-vec**: Enables vector similarity search for semantic queries
```sql
SELECT * FROM documents 
ORDER BY vec_distance_cosine(embedding, ?) 
LIMIT 10;
```

**3. sqlite-lembed** (optional): Provides local embedding generation
- Loads ML models directly into SQLite
- Generates text embeddings for semantic search
- Requires two environment variables:
  - `AK_LEMBED_MODEL`: Path to embedding model file
  - `AK_LEMBED_MODEL_NAME`: Model registration name

```typescript
if (typeof lembedModelFile !== 'undefined') {
    sqlite_lembed.load(sqdb.inner);
    sqlite_vec.load(sqdb.inner);
    
    await sqdb.run(`
        INSERT INTO temp.lembed_models(name, model)
        select ?, lembed_model_from_file(?);
    `, [lembedModelName, lembedModelFile]);
}
```

### Query Profiling

Optional query profiling tracks SQL performance (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

```typescript
if (typeof process.env.AK_PROFILE === 'string') {
    SQ3QueryLog(sqdb.inner, process.env.AK_PROFILE);
}
```

When `AK_PROFILE` is set to a file path, the `sqlite3-query-log` library writes TSV-formatted profiling data:
- Column 1: Base64-encoded SQL query (prevents newline issues)
- Column 2: Execution time in milliseconds

This enables performance analysis to identify slow queries.

### Database Usage Patterns

The database serves multiple purposes in AkashaRender:

**File Caching** (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):
- Documents, assets, layouts, partials metadata
- Virtual path to filesystem path mappings
- Frontmatter and file attributes
- Tag relationships and hierarchies

**Key-Value Storage** (source: [lib/sqdb.ts](../../lib/sqdb.ts)):
- Factory function `newSQ3DataStore(name)` creates isolated KV stores
- Uses `sq3-kv-data-store` library
- Each store has its own table namespace

**Performance Tracing**:
- Render timings
- File processing durations
- Plugin execution metrics

### AsyncDatabase API

The `promised-sqlite3` wrapper provides async/await methods (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

- `sqdb.run(sql, params)` - Execute statement (INSERT, UPDATE, DELETE)
- `sqdb.get(sql, params)` - Fetch single row
- `sqdb.all(sql, params)` - Fetch all rows
- `sqdb.each(sql, params, callback)` - Process rows iteratively
- `sqdb.exec(sql)` - Execute multiple statements

All methods return Promises and support parameter binding to prevent SQL injection.

### Error Handling

Database errors are logged to console (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

```typescript
sqdb.inner.on('error', err => {
    console.error(err);
});
```

Critical database failures during initialization cause `process.exit(1)` (source: [lib/index.ts](../../lib/index.ts)).

## Key Parameters

**Environment Variables**:
- `AK_DB_URL` - Database location (default: `:memory:`)
- `AK_LEMBED_MODEL` - Path to embedding model file (optional)
- `AK_LEMBED_MODEL_NAME` - Model registration name (optional)
- `AK_PROFILE` - SQL profiling output file path (optional)

**Database Configuration**:
- Journal mode: WAL (Write-Ahead Logging)
- Location: In-memory by default
- Extensions: sqlite-regex, sqlite-vec, sqlite-lembed (conditional)

**Exported API**:
- `sqdb` - Shared AsyncDatabase instance
- `lembedModelName` - Configured embedding model name
- `newSQ3DataStore(name)` - Factory for key-value stores

## When To Use

**Use the SQLite database for**:

1. **File Metadata Queries**: Query document properties, tags, layouts without filesystem access (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts))

2. **Pattern Matching**: Find files using regex patterns via sqlite-regex extension

3. **Semantic Search**: Vector-based document search with sqlite-vec and sqlite-lembed

4. **Tag Management**: Query tag hierarchies, find similar tags, list documents by tag

5. **Performance Analysis**: Track render times, identify bottlenecks with profiling

6. **Key-Value Storage**: Store plugin state, configuration, or transient data via `newSQ3DataStore()`

7. **Relational Queries**: Complex multi-table joins, aggregations, and filtering

**Do NOT use the SQLite database for**:

1. **Long-term Persistence**: In-memory database is ephemeral (unless `AK_DB_URL` points to disk file)

2. **Large Binary Data**: Store images, fonts, etc. on filesystem, reference paths in database

3. **High-Concurrency Writes**: SQLite has limitations for heavy write workloads

## Risks & Pitfalls

**In-Memory Data Loss**: The default `:memory:` database loses all data when the process exits (source: [lib/sqdb.ts](../../lib/sqdb.ts)). For persistent caching across builds, set `AK_DB_URL` to a file path. However, this requires cache invalidation logic to detect stale data.

**Extension Loading Failures**: SQLite extensions must be compiled for the correct platform and architecture (source: [lib/sqdb.ts](../../lib/sqdb.ts)). Missing or incompatible extensions cause initialization failure. The lembed extension is particularly platform-sensitive.

**Memory Consumption**: An in-memory database holds all tables and indexes in RAM (source: [lib/sqdb.ts](../../lib/sqdb.ts)). Large projects with thousands of documents and extensive embeddings can consume significant memory. Monitor process memory usage.

**Concurrent Write Limitations**: While WAL improves concurrency, SQLite still serializes writes (source: [lib/sqdb.ts](../../lib/sqdb.ts)). Heavy concurrent writes from parallel rendering operations may encounter lock contention. The `concurrency` setting in Configuration helps manage this.

**Embedding Model Size**: Local embedding models loaded via sqlite-lembed can be 100MB+ (source: [lib/sqdb.ts](../../lib/sqdb.ts)). This increases memory usage and startup time. Only enable if semantic search is needed.

**Query Profiling Overhead**: The `AK_PROFILE` setting adds per-query overhead (source: [lib/sqdb.ts](../../lib/sqdb.ts)). Enable only during performance investigation, not in production.

**Parameter Binding Required**: Direct SQL string interpolation is vulnerable to SQL injection (source: [lib/sqdb.ts](../../lib/sqdb.ts)). Always use parameterized queries:
```javascript
// UNSAFE: await sqdb.all(`SELECT * FROM docs WHERE tag = '${tag}'`);
// SAFE: await sqdb.all('SELECT * FROM docs WHERE tag = ?', [tag]);
```

**Singleton Database**: The `sqdb` export is a global singleton (source: [lib/sqdb.ts](../../lib/sqdb.ts)). Multiple Configuration instances share the same database. Table names must be unique or namespaced to avoid conflicts.

**WAL File Cleanup**: When using disk-backed databases, WAL creates additional files (`-wal`, `-shm`) (source: [lib/sqdb.ts](../../lib/sqdb.ts)). These must be deleted or checkpointed to reclaim space.

## Sources

- [lib/sqdb.ts](../../lib/sqdb.ts) - Database initialization and configuration
- [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts) - Primary database consumer

## Related Pages

- [File Caching](./file-caching.md) - Major use of SQLite database
- [Database Extensions](./database-extensions.md) - sqlite-regex, sqlite-vec, sqlite-lembed
- [Performance Profiling](./performance-profiling.md) - SQL query profiling
- [Key-Value Store](./key-value-store.md) - SQ3DataStore usage
- [Semantic Search](./semantic-search.md) - Vector embeddings with sqlite-vec

## Backlinks

- [wiki/summaries/lib/sqdb.ts.md](../summaries/lib/sqdb.ts.md)
- [wiki/summaries/lib/cache/cache-sqlite.ts.md](../summaries/lib/cache/cache-sqlite.ts.md)
