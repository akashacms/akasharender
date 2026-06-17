---
title: "lib/sqdb.ts - SQLite Database Setup"
type: summary
Sources:
  - lib/sqdb.ts
Categories:
  - database
  - sqlite
  - configuration
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-06-17T16:45:26+03:00
confidence: high
---

# lib/sqdb.ts - SQLite Database Setup

## Code Complexity

- **Lines of code**: ~70
- **Exported functions**: 1 (newSQ3DataStore factory function)
- **Classes**: 0
- **Complexity**: Low - module-level initialization and configuration
- **Key exports**: sqdb (AsyncDatabase instance), lembedModelName constant

## Key Points

- Initializes and exports a shared SQLite database instance built on the
  built-in `node:sqlite` module via the `promised.node.sqlite` wrapper
- Loads the `sqlite-regex` extension (requires opening with `allowExtension: true`)
- Configured via environment variables
- Uses Write-Ahead Logging (WAL) mode for better concurrency

## Summary

This module sets up the shared SQLite database used throughout AkashaRender (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

As of the June 2026 migration, the database connection is an `AsyncDatabase`
from the `promised.node.sqlite` package, which wraps Node.js's built-in
`node:sqlite` `DatabaseSync` class with an async API. This replaced the
previous `sqlite3` + `promised-sqlite3` stack, eliminating the heavy native
dependency (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

The database URL is configurable via the `AK_DB_URL` environment variable, defaulting to `:memory:` for an in-memory database (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

The database is opened with `{ allowExtension: true }`, which `node:sqlite`
requires before `loadExtension` may be called (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

One SQLite extension is loaded (source: [lib/sqdb.ts](../../lib/sqdb.ts)):
- `sqlite-regex` - Regular expression support in SQL queries

The `sqlite-vec` (vector similarity search) and `sqlite-lembed` (local
embeddings) extensions were removed during the migration because they were
not in use. The `lembedModelName` export is retained but is always
`undefined`, so the guarded semantic-search code paths in
[schema.ts](./cache/schema.ts) and [cache-sqlite.ts](./cache/cache-sqlite.ts)
remain dormant. Re-enabling them requires re-adding the packages and the
loader calls (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

The database uses Write-Ahead Logging (WAL) mode via `PRAGMA journal_mode=WAL`, which improves concurrent read/write performance (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

SQL query profiling via the `AK_PROFILE` environment variable was removed
during the migration. It depended on the `sqlite3-query-log` package, which
hooked `sqlite3.Database` events; `node:sqlite`'s `DatabaseSync` does not
emit events. The follow-up is tracked by
[akashacms/akasharender#192](https://github.com/akashacms/akasharender/issues/192)
(source: [lib/sqdb.ts](../../lib/sqdb.ts)).

The module exports (source: [lib/sqdb.ts](../../lib/sqdb.ts)):
- `sqdb` - The AsyncDatabase instance (promised.node.sqlite wrapper)
- `lembedModelName` - Always `undefined` (semantic search disabled)
- `newSQ3DataStore(name)` - Factory function for creating SQ3DataStore instances, passing `sqdb.inner` (the `DatabaseSync`)

Unlike the previous `sqlite3.Database`, `node:sqlite`'s `DatabaseSync` is not
an EventEmitter, so the previous `on('error', ...)` listener was removed
(source: [lib/sqdb.ts](../../lib/sqdb.ts)).

## Relevant Concepts

- [SQLite Database](../concepts/sqlite-database.md)
- [Database Extensions](../concepts/database-extensions.md)
- [Performance Profiling](../concepts/performance-profiling.md)
- [Key-Value Store](../concepts/key-value-store.md)

## Related Pages

- [lib/data.ts](./data.ts) - Uses sqdb for tracing
- [lib/cache/cache-sqlite.ts](./cache/cache-sqlite.ts) - Uses sqdb for file caching
- [Migrating AkashaRender to promised.node.sqlite](../architecture/promised-node-sqlite-migration.md) - Architecture for this migration

## Backlinks

