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
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/sqdb.ts - SQLite Database Setup

## Code Complexity

- **Lines of code**: 114
- **Exported functions**: 1 (newSQ3DataStore factory function)
- **Classes**: 0
- **Complexity**: Low - module-level initialization and configuration
- **Key exports**: sqdb (AsyncDatabase instance), lembedModelName constant

## Key Points

- Initializes and exports a shared SQLite database instance
- Loads extensions for regex, vector search, and embeddings
- Configured via environment variables
- Uses Write-Ahead Logging (WAL) mode for better concurrency
- Supports optional SQL query profiling

## Summary

This module sets up the shared SQLite database used throughout AkashaRender (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

The database URL is configurable via the `AK_DB_URL` environment variable, defaulting to `:memory:` for an in-memory database (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

Three SQLite extensions are loaded (source: [lib/sqdb.ts](../../lib/sqdb.ts)):
- `sqlite-regex` - Regular expression support in SQL queries
- `sqlite-vec` - Vector similarity search capabilities
- `sqlite-lembed` - Local embedding model support (optional)

The lembed extension for embeddings is conditionally loaded based on environment variables (source: [lib/sqdb.ts](../../lib/sqdb.ts)):
- `AK_LEMBED_MODEL` - Path to the embedding model file
- `AK_LEMBED_MODEL_NAME` - Name to register the model under

The database uses Write-Ahead Logging (WAL) mode via `PRAGMA journal_mode=WAL`, which improves concurrent read/write performance (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

Optional SQL query profiling can be enabled by setting `AK_PROFILE` environment variable to a file path. This logs query execution times in TSV format with base64-encoded SQL statements and millisecond timing (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

The module exports (source: [lib/sqdb.ts](../../lib/sqdb.ts)):
- `sqdb` - The AsyncDatabase instance (promised-sqlite3 wrapper)
- `lembedModelName` - The configured embedding model name
- `newSQ3DataStore(name)` - Factory function for creating SQ3DataStore instances

Error events from the database are logged to console (source: [lib/sqdb.ts](../../lib/sqdb.ts)).

## Relevant Concepts

- [SQLite Database](../concepts/sqlite-database.md)
- [Database Extensions](../concepts/database-extensions.md)
- [Performance Profiling](../concepts/performance-profiling.md)
- [Key-Value Store](../concepts/key-value-store.md)

## Related Pages

- [lib/data.ts](./data.ts) - Uses sqdb for tracing
- [lib/cache/cache-sqlite.ts](./cache/cache-sqlite.ts) - Uses sqdb for file caching

## Backlinks

