---
title: "UNIQUE constraint failed: ASSETS.vpath (and DOCUMENTS.vpath) During Indexing"
type: answer
Sources:
  - lib/sqdb.ts
  - lib/cache/cache-sqlite.ts
  - lib/cache/schema.ts
  - lib/cache/sql/create-table-assets.sql
  - lib/cache/vfstack.ts
  - lib/cli.ts
Categories:
  - database
  - file-caching
  - troubleshooting
date-created: 2026-07-28T17:07:58+03:00
last-updated: 2026-07-28T17:07:58+03:00
confidence: high
---

# UNIQUE constraint failed: ASSETS.vpath (and DOCUMENTS.vpath) During Indexing

## Query

While running `npx akasharender assetdirs config.mjs` (for the akashacms.com website
project), indexing produced a long list of errors of the form:

```
Error gathering info for .htaccess: UNIQUE constraint failed: ASSETS.vpath
Error gathering info for akashaepub-logo.jpg: UNIQUE constraint failed: ASSETS.vpath
Error gathering info for /vendor/bootstrap/css/bootstrap-grid.css: UNIQUE constraint failed: ASSETS.vpath
...
```

with similar `UNIQUE constraint failed: DOCUMENTS.vpath` errors for document paths.
The error is thrown from `lib/cache/cache-sqlite.ts` when adding a cache row whose
`vpath` already exists in the table. What causes this?

## Answer

### Short answer

The errors appear when the SQLite database used by the file caches is **persistent
across runs** — that is, when the `AK_DB_URL` environment variable points at a real
file (or otherwise reusable database) instead of the default `:memory:` database. On
the second and later runs the `ASSETS` / `DOCUMENTS` tables still contain the rows
written by the previous run, so the fresh insert of each file collides with the
existing row on the `vpath` primary key, producing `UNIQUE constraint failed`.

The fix is to unset `AK_DB_URL` (or set it back to `:memory:`), or to start from a
clean database file, so that indexing begins with empty tables.

### Where the error is raised

During `setup()`, `BaseCache` scans the directory stack and, for every non-ignored
file, calls `insertDocToDB(info)` inside a single transaction. Per-file errors are
caught and logged with exactly the message seen above (source:
[cache-sqlite.ts.md](../summaries/lib/cache/cache-sqlite.ts.md)):

```js
} catch (err) {
    console.error(`Error gathering info for ${(info as any).vpath}: ${err.message}`);
}
```

The insert itself is a plain `INSERT` (not `INSERT OR REPLACE`) into a table whose
`vpath` column is the primary key. `AssetsCache.insertDocToDB` runs
`insert-doc-assets.sql` binding `$vpath: info.vpath`, and the `ASSETS` table is
declared with `` `vpath` TEXT PRIMARY KEY `` in `create-table-assets.sql` (source:
[create-table-assets.sql](../../lib/cache/sql/create-table-assets.sql)). Inserting a
`vpath` that already exists therefore violates the primary-key uniqueness constraint,
and SQLite reports `UNIQUE constraint failed: ASSETS.vpath`. The `DOCUMENTS` table is
structured the same way, which is why the same error appears for document paths.

### Why the duplicate rows are not coming from the scan

It is tempting to blame the directory scan for producing duplicate `vpath` values, but
it does not. `VFStack` stores discovered files in a `Map` keyed by `vpath`
(`#vpathMap`), and `#scanDirectory` only inserts a file when the map does not already
contain that `vpath` (source: [vfstack.ts.md](../summaries/lib/cache/vfstack.ts.md)):

```js
if (!this.#vpathMap.has(vpathData.vpath)) {
    this.#vpathMap.set(vpathData.vpath, vpathData);
}
```

This is the whole point of the stacked / virtual filesystem: a file in a
higher-priority mounted directory *shadows* the same `vpath` in a lower one, so each
`vpath` is yielded exactly once. Consequently, within a single run the list of entries
handed to `insertDocToDB` contains unique `vpath` values, and the inserts cannot
collide with one another. The collision must therefore be with rows that were already
in the table before this run started.

### The real cause: a persistent database across runs

The tables are created with `CREATE TABLE IF NOT EXISTS` and are **never truncated** at
the start of `setup()` (source: [schema.ts.md](../summaries/lib/cache/schema.ts.md),
[cache-sqlite.ts.md](../summaries/lib/cache/cache-sqlite.ts.md)). Nothing in the
indexing path deletes prior rows. This is fine when the database is thrown away between
runs, which is the default: `lib/sqdb.ts` opens the connection using `:memory:` unless
overridden (source: [sqdb.ts.md](../summaries/lib/sqdb.ts.md)):

```js
const dburl = typeof process.env.AK_DB_URL === 'string'
        ? process.env.AK_DB_URL
        : ':memory:';

export const sqdb = await AsyncDatabase.open(dburl, {
    allowExtension: true
});
```

An in-memory database is empty every time the process starts, so `CREATE TABLE IF NOT
EXISTS` effectively creates fresh, empty tables and the `IF NOT EXISTS` clause is
harmless.

However, if `AK_DB_URL` is set to a filesystem path (a persistent SQLite file), the
database — and all the `ASSETS` / `DOCUMENTS` rows written previously — survives between
runs. On the next invocation:

1. `CREATE TABLE IF NOT EXISTS` finds the tables already present and leaves the
   existing rows in place.
2. `setup()` re-scans the directories and tries to `INSERT` every file again.
3. Every file whose `vpath` was inserted on the prior run now collides on the primary
   key, and each collision is caught and logged as
   `Error gathering info for <vpath>: UNIQUE constraint failed: ASSETS.vpath`.

Because the per-file `try/catch` swallows the error and continues, the run does not
crash; it just prints one line per already-present file — which is exactly the "a lot
of these for both ASSETS and DOCUMENT paths" behaviour described.

### How to confirm and resolve

- **Confirm:** check whether `AK_DB_URL` is exported in the shell or project scripts:

  ```shell
  echo "$AK_DB_URL"
  ```

  If it prints a file path (anything other than empty or `:memory:`), that is the
  cause.

- **Resolve (any one of):**
  - Unset the variable so indexing uses the default in-memory database:
    `unset AK_DB_URL`.
  - Explicitly set it back to in-memory: `export AK_DB_URL=:memory:`.
  - If a persistent database is intentionally desired, delete or recreate the database
    file before re-running so that the tables start empty.

### Note for future work

This is a known, recurring point of confusion: a persistent `AK_DB_URL` combined with
`CREATE TABLE IF NOT EXISTS` and plain (non-upsert) inserts means a second run will
always collide on `vpath`. If persistent databases become a supported workflow, the
indexing path would need to either clear the four cache tables at the start of
`setup()` or switch the insert statements to an upsert form (e.g. `INSERT ... ON
CONFLICT(vpath) DO UPDATE`, or use the existing `updateDocInDB` path for rows that
already exist). Until then, the operational fix is to keep the database in-memory for
one-shot commands like `assetdirs`, `docdirs`, and `render`.

## Sources

- [lib/sqdb.ts](../../lib/sqdb.ts) — chooses `:memory:` unless `AK_DB_URL` is set
- [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts) — `setup()`, `insertDocToDB`, and the per-file error logging
- [lib/cache/schema.ts](../../lib/cache/schema.ts) — table creation via `CREATE TABLE IF NOT EXISTS`
- [lib/cache/sql/create-table-assets.sql](../../lib/cache/sql/create-table-assets.sql) — `vpath TEXT PRIMARY KEY`
- [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts) — vpath-keyed `#vpathMap` guarantees unique vpaths per scan
- [lib/cli.ts](../../lib/cli.ts) — the `assetdirs` command that triggers `akasha.setup`

## Related Pages

- [Summary: lib/sqdb.ts](../summaries/lib/sqdb.ts.md)
- [Summary: lib/cache/cache-sqlite.ts](../summaries/lib/cache/cache-sqlite.ts.md)
- [Summary: lib/cache/vfstack.ts](../summaries/lib/cache/vfstack.ts.md)
- [Concept: SQLite Database](../concepts/sqlite-database.md)
- [Concept: File Caching](../concepts/file-caching.md)
- [Concept: Virtual Paths](../concepts/virtual-paths.md)
- [Concept: Cache Schema](../concepts/cache-schema.md)
- [Concept: Command-Line Interface](../concepts/command-line-interface.md)

## Backlinks

- (none yet)
