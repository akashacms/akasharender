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
last-updated: 2026-06-17T16:45:26+03:00
confidence: high
---

# SQLite Database

## Definition

AkashaRender uses a shared SQLite database as its central data store for file metadata, caching, and performance tracing (source: [lib/sqdb.ts](../../lib/sqdb.ts)). By default, the database runs in-memory for fast access, with optional disk persistence, and is enhanced with the `sqlite-regex` extension for regular-expression matching.

As of the June 2026 migration, the database is built on Node.js's built-in `node:sqlite` module via the `promised.node.sqlite` async wrapper, replacing the former `sqlite3` + `promised-sqlite3` stack and eliminating the heavy native dependency. See [Migrating AkashaRender to promised.node.sqlite](../architecture/promised-node-sqlite-migration.md).

## How It Works

### Database Initialization

The database is initialized once at module load time in `lib/sqdb.ts` and exported as a singleton `AsyncDatabase` instance (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

```typescript
const dburl = typeof process.env.AK_DB_URL === 'string'
        ? process.env.AK_DB_URL
        : ':memory:';

// allowExtension:true is required by node:sqlite to permit loadExtension
export const sqdb = await AsyncDatabase.open(dburl, {
    allowExtension: true
});
```

The `promised.node.sqlite` library wraps the built-in `node:sqlite` `DatabaseSync` class with Promise-based async/await APIs. The wrapper also coerces JavaScript `undefined` to `null` and booleans to `1`/`0`, because `node:sqlite` rejects both at the parameter-binding boundary (unlike the more permissive `sqlite3`).

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

One extension is loaded by default (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

**sqlite-regex**: Adds regular expression support to SQL queries
```sql
SELECT * FROM documents WHERE vpath REGEXP '^blog/.*\.md$';
```

It is loaded via `sqdb.inner.loadExtension(sqlite_regex.getLoadablePath())`, which requires the database to have been opened with `allowExtension: true`.

**Removed during the June 2026 migration** (because they were unused): the `sqlite-vec` (vector similarity search) and `sqlite-lembed` (local embedding generation) extensions, along with the `AK_LEMBED_MODEL` / `AK_LEMBED_MODEL_NAME` registration. The `lembedModelName` export remains but is always `undefined`, leaving the semantic-search code paths dormant. Re-enabling them requires re-adding the packages and the loader calls. See [Database Extensions](./database-extensions.md) and [Semantic Search](./semantic-search.md).

### Query Profiling

SQL query profiling via the `AK_PROFILE` environment variable was **removed during the June 2026 migration**. It used the `sqlite3-query-log` package, which hooked `sqlite3.Database` events; `node:sqlite`'s `DatabaseSync` does not emit events, so the capability could not be carried over unchanged. The follow-up to restore it is tracked by [akashacms/akasharender#192](https://github.com/akashacms/akasharender/issues/192) (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

The other two profiling levels described in [Performance Profiling](./performance-profiling.md) (document-stage timing and Mahabhuta function timing) are unaffected.

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

The `promised.node.sqlite` wrapper provides async/await methods (source: [lib/sqdb.ts](../../lib/sqdb.ts)):

- `sqdb.run(sql, params)` - Execute statement (INSERT, UPDATE, DELETE)
- `sqdb.get(sql, params)` - Fetch single row
- `sqdb.all(sql, params)` - Fetch all rows
- `sqdb.each(sql, params, callback)` - Process rows iteratively
- `sqdb.exec(sql)` - Execute multiple statements
- `sqdb.inner` - The underlying `node:sqlite` `DatabaseSync` (used for `loadExtension` and by the key-value store)

All methods return Promises and support parameter binding (positional, array, or `$name` objects) to prevent SQL injection.

### Error Handling

Unlike the former `sqlite3.Database`, `node:sqlite`'s `DatabaseSync` is not an EventEmitter, so the previous `sqdb.inner.on('error', ...)` listener was removed during the migration (source: [lib/sqdb.ts](../../lib/sqdb.ts)). Errors now surface as rejected Promises from the `AsyncDatabase` methods.

Critical database failures during initialization cause `process.exit(1)` (source: [lib/index.ts](../../lib/index.ts)).

The shared connection is closed once by `closeFileCaches()` (guarded by `sqdb.inner.isOpen`); the individual file caches no longer each close the shared connection (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)).

## Key Parameters

**Environment Variables**:
- `AK_DB_URL` - Database location (default: `:memory:`)
- `AK_LEMBED_MODEL` / `AK_LEMBED_MODEL_NAME` - *No longer used* (sqlite-lembed removed during the June 2026 migration)
- `AK_PROFILE` - *No longer used* (SQL profiling removed; see [#192](https://github.com/akashacms/akasharender/issues/192))

**Database Configuration**:
- Driver: `node:sqlite` via the `promised.node.sqlite` async wrapper
- Journal mode: WAL (Write-Ahead Logging)
- Location: In-memory by default
- Extensions: sqlite-regex (sqlite-vec and sqlite-lembed removed)

**Exported API**:
- `sqdb` - Shared AsyncDatabase instance
- `lembedModelName` - Always `undefined` (semantic search disabled)
- `newSQ3DataStore(name)` - Factory for key-value stores

## When To Use

**Use the SQLite database for**:

1. **File Metadata Queries**: Query document properties, tags, layouts without filesystem access (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts))

2. **Pattern Matching**: Find files using regex patterns via sqlite-regex extension

3. **Semantic Search**: Vector-based document search with sqlite-vec and sqlite-lembed *(currently disabled — these extensions were removed in the June 2026 migration; the code paths remain dormant)*

4. **Tag Management**: Query tag hierarchies, find similar tags, list documents by tag

5. **Performance Analysis**: Track render times, identify bottlenecks (document-stage and Mahabhuta timing; SQL-query profiling was removed in the migration)

6. **Key-Value Storage**: Store plugin state, configuration, or transient data via `newSQ3DataStore()`

7. **Relational Queries**: Complex multi-table joins, aggregations, and filtering

**Do NOT use the SQLite database for**:

1. **Long-term Persistence**: In-memory database is ephemeral (unless `AK_DB_URL` points to disk file)

2. **Large Binary Data**: Store images, fonts, etc. on filesystem, reference paths in database

3. **High-Concurrency Writes**: SQLite has limitations for heavy write workloads

## Risks & Pitfalls

**In-Memory Data Loss**: The default `:memory:` database loses all data when the process exits (source: [lib/sqdb.ts](../../lib/sqdb.ts)). For persistent caching across builds, set `AK_DB_URL` to a file path. However, this requires cache invalidation logic to detect stale data.

**Extension Loading Failures**: The `sqlite-regex` extension must be compiled for the correct platform and architecture, and the database must be opened with `allowExtension: true` (source: [lib/sqdb.ts](../../lib/sqdb.ts)). Missing or incompatible extensions cause initialization failure.

**Strict Parameter Binding**: `node:sqlite` is stricter than the former `sqlite3` driver — it rejects `undefined` and JavaScript booleans at the binding boundary. The `promised.node.sqlite` wrapper coerces `undefined`→`null` and `true`/`false`→`1`/`0`, but code that bypasses the wrapper must account for this (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

**Memory Consumption**: An in-memory database holds all tables and indexes in RAM (source: [lib/sqdb.ts](../../lib/sqdb.ts)). Large projects with thousands of documents can consume significant memory. Monitor process memory usage.

**Concurrent Write Limitations**: While WAL improves concurrency, SQLite still serializes writes (source: [lib/sqdb.ts](../../lib/sqdb.ts)). Heavy concurrent writes from parallel rendering operations may encounter lock contention. The `concurrency` setting in Configuration helps manage this.

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
- [Database Extensions](./database-extensions.md) - sqlite-regex (sqlite-vec/sqlite-lembed removed)
- [Performance Profiling](./performance-profiling.md) - profiling levels
- [Key-Value Store](./key-value-store.md) - SQ3DataStore usage
- [Semantic Search](./semantic-search.md) - Vector embeddings (currently disabled)
- [Migrating AkashaRender to promised.node.sqlite](../architecture/promised-node-sqlite-migration.md) - The migration architecture

## Backlinks

- [wiki/summaries/lib/sqdb.ts.md](../summaries/lib/sqdb.ts.md)
- [wiki/summaries/lib/cache/cache-sqlite.ts.md](../summaries/lib/cache/cache-sqlite.ts.md)
