---
title: Key-Value Store
type: concept
Sources:
  - lib/sqdb.ts
  - lib/index.ts
Categories:
  - database
  - storage
  - plugin-api
created: 2026-05-21T03:00:00Z
updated: 2026-05-21T03:00:00Z
confidence: medium
---

# Key-Value Store

## Definition

Key-Value Store is AkashaRender's SQLite-backed storage API that provides plugins and applications with simple key-value persistence using the `sq3-kv-data-store` package, enabling efficient data storage and retrieval with search capabilities.

(source: [lib/sqdb.ts](../../lib/sqdb.ts))

## How It Works

The key-value store functionality is provided through the `newSQ3DataStore()` factory function:

1. **Factory Function**: `newSQ3DataStore(name: string)` creates a new SQ3DataStore instance bound to a named table in the shared SQLite database.

2. **SQLite Backend**: Each data store is backed by a SQLite table, leveraging the existing database infrastructure (including WAL mode, extensions, and profiling).

3. **Named Stores**: Each plugin or component can have its own isolated key-value store by using a unique table name.

4. **Shared Database**: All stores use the same SQLite connection (`sqdb.inner`), managed by the main database configuration.

5. **Export**: The function is exported from `lib/index.ts`, making it available to plugins and external code.

The `sq3-kv-data-store` package provides the underlying implementation, described as "Node.js key/value store for SQLITE3 that includes data search features."

(source: [lib/sqdb.ts](../../lib/sqdb.ts), [lib/index.ts](../../lib/index.ts))

## Key Parameters

### Factory Function

- **newSQ3DataStore(name: string)**: Creates a new SQ3DataStore instance
  - `name`: The table name for this key-value store (used for isolation between stores)
  - Returns: `SQ3DataStore` instance with methods for storing and retrieving data

### Usage Example

```typescript
import { newSQ3DataStore } from 'akasharender';

// Create a store for plugin data
const myStore = newSQ3DataStore('my_plugin_data');

// Store and retrieve values (exact API depends on sq3-kv-data-store)
await myStore.set('key', 'value');
const value = await myStore.get('key');
```

(source: [lib/sqdb.ts](../../lib/sqdb.ts))

## When To Use

Use the key-value store when:

1. **Plugin State**: Plugins need to persist configuration or state data across rendering sessions
2. **Simple Storage**: You need simple key-value persistence without complex queries
3. **Cached Data**: Storing preprocessed or computed data that doesn't fit the main cache schema
4. **Search Requirements**: The package includes "data search features" beyond simple key lookup
5. **Isolated Storage**: Different components need their own storage without conflicts

The key-value store is particularly useful for plugins that need to persist data but don't require the complexity of custom database tables and SQL queries.

## Risks & Pitfalls

### Limited Documentation

The concept is minimally documented in the codebase. The exact API of `SQ3DataStore` is not specified—developers must refer to the `sq3-kv-data-store` package documentation.

### Table Name Conflicts

Using the same table name in multiple places will cause data conflicts. Ensure unique table names for each logical data store.

### Shared Database Connection

All stores share the same SQLite connection and database file. Performance issues or locks in one store can affect others.

### Memory Mode

If using the default `:memory:` database (when AK_DB_URL is not set), key-value data is lost when the process exits. Set `AK_DB_URL` to a file path for persistence.

### No Schema Validation

Unlike the main cache tables, key-value stores don't have TypeScript interfaces or Joi schemas enforcing data structure. It's up to the plugin to maintain data integrity.

### Package Dependency

This feature depends on an external package (`sq3-kv-data-store@1.0.1`). Changes or deprecation of that package could affect functionality.

(source: [lib/sqdb.ts](../../lib/sqdb.ts))

## Related Pages

- [Database Indexing](./database-indexing.md): SQLite database infrastructure used by key-value stores
- [Database Extensions](./database-extensions.md): Extensions available to the shared database connection
- [Built-in Plugin](./built-in-plugin.md): Plugins can use key-value stores for persistence
- [Cache Schema](./cache-schema.md): Structured alternative to key-value storage

## Backlinks

The Key-Value Store concept is referenced by:

- [concepts/README.md](./README.md): Listed under "To Be Documented"
