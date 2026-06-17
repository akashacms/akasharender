---
title: "Migrating AkashaRender to promised.node.sqlite"
type: architecture
Sources:
  - lib/sqdb.ts
  - lib/data.ts
  - lib/cache/cache-sqlite.ts
  - lib/cache/tag-glue.ts
  - lib/cache/schema.ts
  - lib/index.ts
  - package.json
  - MIGRATION-NODE-SQLITE.md
  - MIGRATION-COMPLETE.md
  - MIGRATION-SUMMARY.md
  - MIGRATION-UNDEFINED-VALUES-ANALYSIS.md
Categories:
  - database
  - sqlite
  - migration
  - dependencies
date-created: 2026-06-17T15:16:07+0300
last-updated: 2026-06-17T16:04:19+0300
confidence: high
---

# Migrating AkashaRender to promised.node.sqlite

## Query

Convert the cache system (`lib/cache/cache-sqlite.ts`), the database
module (`lib/sqdb.ts`), and any affected code, to use the
`promised.node.sqlite` package, replacing use of the `sqlite3` and
`promised-sqlite3` packages. The goal is to rest on the built-in
`node:sqlite` module and eliminate the heavy native dependency of the
`sqlite3` package. A previous attempt embedded the wrapper inside
AkashaRender (`MIGRATION-*.md`); the new plan uses a standalone fork
named `promised.node.sqlite`. This document captures the architecture
and migration plan **before** any code changes are made.

## Architecture

### 1. Background and what changed since the previous attempt

The previous migration attempt (documented in
`MIGRATION-NODE-SQLITE.md`, `MIGRATION-SUMMARY.md`,
`MIGRATION-COMPLETE.md`, and `MIGRATION-UNDEFINED-VALUES-ANALYSIS.md`)
created a wrapper file `lib/async-node-sqlite.ts` *inside* AkashaRender
that wrapped `node:sqlite`'s `DatabaseSync` with a Promise-based API
mimicking `promised-sqlite3`
(source: [MIGRATION-NODE-SQLITE.md](../../MIGRATION-NODE-SQLITE.md),
[MIGRATION-SUMMARY.md](../../MIGRATION-SUMMARY.md)).

The decision was later made to factor that wrapper out into a standalone,
independently published package, `promised.node.sqlite`. That package is
a near-complete rewrite of `promised.sqlite`, retaining its API while
targeting `node:sqlite`
(source: [promised.node.sqlite/README.md](../../../promised.node.sqlite/README.md)).
The in-tree `lib/async-node-sqlite.ts` no longer exists in `lib/`;
the migration now consists of swapping the third-party package imports.

The `promised.node.sqlite` package lives at
`/home/david/Projects/akasharender/promised.node.sqlite` and on GitHub at
`https://github.com/robogeek/promised.node.sqlite`. It has **not yet been
published to npmjs**; publication will follow once this AkashaRender port
verifies it works correctly.

### 2. Current dependency surface

AkashaRender currently depends on these SQLite-related packages
(source: [package.json](../../package.json)):

The project owner confirmed these dispositions (decisions of 2026-06-17):

| Package | Purpose | Disposition |
|---------|---------|-------------|
| `sqlite3` | Native SQLite driver | **Remove** (replaced by `node:sqlite`) |
| `promised-sqlite3` | Promise wrapper for `sqlite3` | **Remove** (replaced by `promised.node.sqlite`) |
| `sqlite3-query-log` | Query profiling via `sqlite3` events | **Remove** — the `AK_PROFILE` block is deleted |
| `sq3-kv-data-store` | Key-value store on top of a `sqlite3.Database` | **Update the package itself** to a node:sqlite-only major version; keep it as a dependency |
| `sqlite-regex` | Regex SQL extension | **Keep** |
| `sqlite-vec` | Vector search extension | **Remove for now** — not currently used; re-add when vector search is enabled |
| `sqlite-lembed` | Local embeddings extension | **Remove for now** — not currently used; re-add when embeddings are enabled |
| `sqlstring-sqlite` | SQL string formatting | **Keep** |

The `promised.node.sqlite` package itself has **zero runtime
dependencies** and requires Node.js 24+
(source: [promised.node.sqlite/package.json](../../../promised.node.sqlite/package.json)),
which AkashaRender already requires (source: [package.json](../../package.json)).

#### 2.1 Impact of removing `sqlite-vec` and `sqlite-lembed`

These two extensions support semantic/vector search, which is currently
gated entirely behind the `AK_LEMBED_MODEL` / `AK_LEMBED_MODEL_NAME`
environment variables and is not used in normal operation
(source: [lib/sqdb.ts](../../lib/sqdb.ts)). Removing them touches:

- `lib/sqdb.ts` — delete the `sqlite_vec` / `sqlite_lembed` imports, the
  `getLoadablePath()`/`load()` calls, and the conditional
  `INSERT INTO temp.lembed_models` block; `lembedModelName` may remain as
  an exported constant (it will simply stay `undefined`)
  (source: [lib/sqdb.ts](../../lib/sqdb.ts)).
- `lib/cache/schema.ts` — `doCreateVecDocumentsTable` only creates the
  `vec_documents` table when `lembedModelName` is a string; with the
  extension gone and the variable unset, it becomes a no-op. The function
  can stay in place (guarded) or have its body neutralized
  (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).
- `lib/cache/cache-sqlite.ts` — the `insert-lembed-documents.sql` /
  `update-lembed-documents.sql` runs and `semanticSearchDocs()` are all
  guarded by `typeof lembedModelName === 'string'`, so they are dormant
  once the variable is unset. `semanticSearchDocs()` and the
  `docs-semantic` CLI command remain in the code but will return nothing
  / fail gracefully without the extension
  (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts),
  [lib/cli.ts](../../lib/cli.ts)).

The safest minimal change is to **keep the guarded code paths but remove
the extension loading and the npm dependencies**, so re-enabling later
only requires re-adding the packages and the loader calls. This is
preferred over ripping out `semanticSearchDocs`, the SQL files, and the
schema function, which would be a larger, harder-to-reverse change. This
is itself a small decision to confirm during implementation.

### 3. Files that import the packages being replaced

The `sqlite3` and `promised-sqlite3` packages are referenced from the
following source files (the complete affected surface):

- `lib/sqdb.ts` — imports `Database` from `sqlite3`, `AsyncDatabase` from
  `promised-sqlite3`, plus `SQ3DataStore` and `SQ3QueryLog`; constructs
  the shared `sqdb` singleton (source: [lib/sqdb.ts](../../lib/sqdb.ts)).
- `lib/data.ts` — imports `AsyncDatabase` from `promised-sqlite3` (type
  only) and uses the `sqdb` singleton for tracing
  (source: [lib/data.ts](../../lib/data.ts)).
- `lib/cache/cache-sqlite.ts` — imports `Database` from `sqlite3` and
  `AsyncDatabase` from `promised-sqlite3`; the `AsyncDatabase` type
  annotates `BaseCache.#db` and the `setup()` parameter
  (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)).
- `lib/cache/tag-glue.ts` — imports `AsyncDatabase` from
  `promised-sqlite3` (type only) for `TagGlue` and `TagDescriptions`
  (source: [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts)).
- `lib/cache/schema.ts` — imports `AsyncDatabase` from `promised-sqlite3`
  (type only) for the table-creation helper signatures
  (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)).

Note that `lib/index.ts` re-exports `newSQ3DataStore` from `lib/sqdb.ts`
and passes `await sqdb` into `filecache.setup`, but does not itself import
the SQLite packages (source: [lib/index.ts](../../lib/index.ts)).

### 4. API compatibility assessment

`promised.node.sqlite` exports a **superset** of the `promised-sqlite3`
API, and is designed as a drop-in replacement
(source: [promised.node.sqlite/README.md](../../../promised.node.sqlite/README.md),
[promised.node.sqlite/SPEC.md](../../../promised.node.sqlite/SPEC.md)).
The methods AkashaRender actually uses all exist with matching semantics:

- `AsyncDatabase.open(filename, options)` — used in `lib/sqdb.ts`.
- `db.run(sql, params)` — used in `data.ts`, `cache-sqlite.ts`, `tag-glue.ts`.
- `db.get(sql, params)` — used in `tag-glue.ts`.
- `db.all(sql, params)` — used throughout `cache-sqlite.ts`.
- `db.each(sql, params, callback)` — used in `cache-sqlite.ts` (`setTimes`).
- `db.close()` — used in `cache-sqlite.ts`.
- `db.inner` getter — used in `lib/sqdb.ts` for extension loading and the
  key-value store. In `promised.node.sqlite` `inner` returns the
  `DatabaseSync` object
  (source: [promised.node.sqlite/src/index.ts](../../../promised.node.sqlite/src/index.ts)).

The parameter binding supports the three forms AkashaRender relies on:
inline positional, array, and `$`-prefixed named-parameter objects
(source: [promised.node.sqlite/SPEC.md](../../../promised.node.sqlite/SPEC.md)).
This matters because `cache-sqlite.ts` heavily uses named parameters such
as `{ $vpath, $mime, $info, ... }`.

This is a key change from the
[SQLite Database](../concepts/sqlite-database.md) concept page, which
still describes the `promised-sqlite3` + `sqlite3` stack.

### 5. Behavioral differences that drive the migration work

These differences between `sqlite3`/`promised-sqlite3` and
`node:sqlite`/`promised.node.sqlite` define the work items.

#### 5.1 Extension loading requires `allowExtension: true`

`node:sqlite` only allows `loadExtension()` when the database was opened
with `allowExtension: true`
(source: [promised.node.sqlite/src/index.ts](../../../promised.node.sqlite/src/index.ts)).
The current `lib/sqdb.ts` calls `AsyncDatabase.open(dburl)` with no
options, then immediately calls
`sqdb.inner.loadExtension(sqlite_regex.getLoadablePath())`
(source: [lib/sqdb.ts](../../lib/sqdb.ts)). After migration the open call
must pass `{ allowExtension: true }`, or extension loading will throw.
This is the single most important required code change in `sqdb.ts`.

#### 5.2 `DatabaseSync` is not an EventEmitter

The current `lib/sqdb.ts` registers `sqdb.inner.on('error', ...)`
(source: [lib/sqdb.ts](../../lib/sqdb.ts)). `DatabaseSync` does not emit
events, so this call must be removed (it would throw a `TypeError`
because `.on` is not a function). Error handling instead relies on
promise rejection from the wrapper methods. The commented-out
`trace`/`error` listeners can be deleted.

#### 5.3 Query profiling (`sqlite3-query-log`) is incompatible

`sqlite3-query-log` hooks `sqlite3.Database` events
(source: [lib/sqdb.ts](../../lib/sqdb.ts),
[MIGRATION-SUMMARY.md](../../MIGRATION-SUMMARY.md)). Because
`DatabaseSync` has no events, the `AK_PROFILE` feature cannot work
unchanged.

**Decision (2026-06-17): remove it.** The `sqlite3-query-log`
dependency is dropped from `package.json`, its `import` is removed from
`lib/sqdb.ts`, and the `if (typeof process.env.AK_PROFILE === 'string')`
block that calls `SQ3QueryLog(sqdb.inner, ...)` is deleted
(source: [lib/sqdb.ts](../../lib/sqdb.ts)). The other two levels of
profiling described in the
[Performance Profiling](../concepts/performance-profiling.md) concept
(document-stage timing and Mahabhuta function timing) are unaffected
because they do not depend on `sqlite3-query-log`. The SQL-query
profiling level is the only capability lost; if it is wanted later it can
be reintroduced as a timing wrapper around the `promised.node.sqlite`
methods, as a separate task.

The loss of this capability is tracked by GitHub issue
[akashacms/akasharender#192](https://github.com/akashacms/akasharender/issues/192),
opened by the project owner on 2026-06-17, which follows up the work to
restore SQL query profiling under `node:sqlite`.

#### 5.4 `sq3-kv-data-store` consumes a raw driver handle

`newSQ3DataStore()` constructs `new SQ3DataStore(sqdb.inner, name)`
(source: [lib/sqdb.ts](../../lib/sqdb.ts)), and the value is re-exported
from the public API (source: [lib/index.ts](../../lib/index.ts)). The
package was written against `sqlite3.Database` and is used by external
plugins (`akashacms-affiliates`, `akashacms-embeddables`)
(source: [MIGRATION-SUMMARY.md](../../MIGRATION-SUMMARY.md)).

**Decision (2026-06-17, revised): modify `sq3-kv-data-store` itself to a
node:sqlite-only major version, dropping `sqlite3` entirely.** AkashaRender
continues to depend on the package and passes `sqdb.inner` (a
`DatabaseSync`) to its constructor. A local reimplementation inside
AkashaRender was rejected as duplicating the package's logic.

Inspection of the package source (`src/index.ts`, at the local repo
`/home/david/Projects/nodejs/sqlite3-key-value-data-store`) shows two
reasons the *current* package cannot be handed a `DatabaseSync`
unchanged, and therefore why the package must change:

1. Its constructor does
   `if (typeof DB === 'object' && DB instanceof sqlite3.Database)`. A
   `DatabaseSync` is **not** an instance of `sqlite3.Database`, so the
   check fails and the constructor silently falls through to
   `new sqlite3.Database(':memory:')` — creating a *separate* throwaway
   database and re-pulling the `sqlite3` native dependency we are trying
   to remove (source: `sqlite3-key-value-data-store/src/index.ts`).
2. Every query uses node-sqlite3 callback style, e.g.
   `this.#DB.run(sql, paramsObj, (err) => ...)` and
   `this.#DB.all(sql, paramsObj, (err, rows) => ...)`. `DatabaseSync` has
   no `run`/`all` methods at all (those live on `StatementSync`), and
   there is no callback style (source:
   `sqlite3-key-value-data-store/src/index.ts`).

This change is already on the package's own roadmap — its README carries
"TODO: Support this against the SQLITE3 due to be implemented in Node.js
24" (source: `sqlite3-key-value-data-store/README.md`). The package repo
is `https://github.com/robogeek/sqlite3-key-value-data-store`, checked out
locally at `/home/david/Projects/nodejs/sqlite3-key-value-data-store`. See
section 5.7 for the package's new design. This preserves the
[Key-Value Store](../concepts/key-value-store.md) capability and keeps
`newSQ3DataStore(name)` working unchanged for external plugins.

Note: `sq3-kv-data-store` is a separate repository, so its modification is
a companion task to this AkashaRender migration, analogous to the
`promised.node.sqlite` work. Like `promised.node.sqlite`, the updated
version is unpublished until verified, so AkashaRender must temporarily
reference it via a local/git dependency.

#### 5.5 `undefined` parameter binding is rejected

`node:sqlite` rejects `undefined` parameter values at the native
boundary, even when a JavaScript wrapper tries to convert them to `null`
afterward
(source: [MIGRATION-UNDEFINED-VALUES-ANALYSIS.md](../../MIGRATION-UNDEFINED-VALUES-ANALYSIS.md)).
`promised.node.sqlite`'s `#normalizeParams` *does* map `undefined` → `null`
when building the parameter object
(source: [promised.node.sqlite/src/index.ts](../../../promised.node.sqlite/src/index.ts)),
which may resolve the earlier 10 failing tests. However, the analysis
showed the safest fix is to set explicit defaults at the data-gathering
phase. The current `cache-sqlite.ts` already sets full defaults in
`DocumentsCache.gatherInfoData` (the `else` branch zeroes `docBody`,
`docContent`, `rendererName`, etc.)
(source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)),
but `PartialsCache.gatherInfoData` and `LayoutsCache.gatherInfoData` do
**not** fully default `docBody`/`rendererName` when no renderer or no
`parseMetadata` is present (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)).

Strategy: rely first on the wrapper's `undefined`→`null` normalization
(verify with the test suite). If any binding errors remain, add the
explicit defaults in the two `gatherInfoData` methods as the analysis
recommends. Either way this is verified empirically, not assumed.

#### 5.6 Boolean and BigInt handling

`node:sqlite` requires INTEGER boolean columns to receive `0`/`1` rather
than `true`/`false`, and returns row ids as `BigInt`
(source: [MIGRATION-COMPLETE.md](../../MIGRATION-COMPLETE.md)). The
wrapper already converts `BigInt` results back to `number` in `run()`
(source: [promised.node.sqlite/src/index.ts](../../../promised.node.sqlite/src/index.ts)).
Boolean parameters (`$rendersToHTML`) flow through `cache-sqlite.ts`; the
current code stores `info.rendersToHTML` directly. This must be verified
under the test suite; if boolean binding errors appear, convert to
`? 1 : 0` at the binding sites, consistent with the prior completed
migration.

#### 5.7 Changes to the `sq3-kv-data-store` package

`sq3-kv-data-store` is updated in its own repository
(`/home/david/Projects/nodejs/sqlite3-key-value-data-store`, sources in
`src/index.ts` and `src/finder.ts`, TypeScript with a `tsc` build) to a
node:sqlite-only major version. The public API (`put`, `update`, `get`,
`exists`, `keys`, `find`, `findAll`, `delete`, `drop`, and the `DB`
getter) and its semantics are preserved so existing callers, including
`newSQ3DataStore()` and the external plugins, are unaffected
(source: `sqlite3-key-value-data-store/src/index.ts`). Verified external
usage covers `get`, `put`, `find`, and `findAll`
(source: `akashacms-affiliates/index.mjs`,
`akashacms-embeddables/index.mjs`).

Changes within the package (`src/index.ts`):

- **Constructor accepts `DatabaseSync | string`.** Replace the
  `instanceof sqlite3.Database` check with a check for a `DatabaseSync`
  object; when given a string, open a `new DatabaseSync(path)` instead of
  `new sqlite3.Database(path)`. The `#DB` field type and the `DB` getter
  change from `sqlite3.Database` to `DatabaseSync`
  (source: `sqlite3-key-value-data-store/src/index.ts`).
- **Query execution moves to `StatementSync`.** `DatabaseSync` has no
  `run`/`all`; the package prepares a statement with
  `db.prepare(sql)` and calls `stmt.run(params)` / `stmt.all(params)`.
  The `new Promise((resolve, reject) => this.#DB.run/all(..., cb))`
  wrappers in `put`/`update`/`get`/`exists`/`keys`/`find`/`findAll`/
  `delete`/`drop` are replaced with direct synchronous calls (these
  methods can remain `async` to keep the `Promise`-returning signatures).
  Named `$`-parameters are already in the form `node:sqlite` expects.
- **Table creation.** Keep the
  `CREATE TABLE <name> (key TEXT PRIMARY KEY, value TEXT) WITHOUT ROWID;`
  plus the unique index, executed via `db.exec(...)`. Since the original
  swallowed "table already exists" errors in its callback, the rewrite
  should use `CREATE TABLE IF NOT EXISTS` / `CREATE UNIQUE INDEX IF NOT
  EXISTS`. The constructor was previously fire-and-forget; with
  `DatabaseSync.exec` being synchronous, table creation completes within
  the constructor, so the synchronous `new SQ3DataStore(...)` /
  `newSQ3DataStore(name)` signatures are preserved (no `await` needed by
  callers such as `sq3db = newSQ3DataStore('affiliates')`)
  (source: `akashacms-affiliates/index.mjs`).
- **`find` query building is unchanged.** The `selectors2where(selectors)`
  helper in `src/finder.ts` produces a SQL `WHERE` clause over
  `json_extract(value, ...)` using `sqlstring`, supporting
  `$or`/`$and`/`$exists`/`$null`/`$notnull` and
  `$eq`/`$lt`/`$lte`/`$gt`/`$gte`/`$ne`/`$like`/`$glob`/`$regexp`
  (source: `sqlite3-key-value-data-store/src/finder.ts`). This logic is
  driver-agnostic and stays as-is; the `$regexp` operator still depends on
  the `sqlite-regex` extension being loaded on the `DatabaseSync`, which
  AkashaRender does in `lib/sqdb.ts`.
- **Dependencies.** Remove `sqlite3` from the package's `peerDependencies`
  and replace `import sqlite3 from 'sqlite3'` with
  `import { DatabaseSync } from 'node:sqlite'`. The `sqlite-regex` peer
  dependency is no longer needed by the package itself (the host
  application loads the extension on its own `DatabaseSync`), though it
  may remain documented. `sqlstring` (and `@types/sqlstring`) stay. Bump
  the package to a new major version and set `engines.node` to `>= 24`.
- **Tests.** The package has an existing Mocha suite (`test/index.mjs`,
  run with `mocha`) (source:
  `sqlite3-key-value-data-store/test/package.json`). These tests must be
  updated to construct the store with a `DatabaseSync` and must continue
  to pass; they are the primary verification for the package rewrite.

Within AkashaRender, `lib/sqdb.ts` keeps
`return new SQ3DataStore(sqdb.inner, name);` unchanged — `sqdb.inner` is
now a `DatabaseSync`, which the updated package accepts
(source: [lib/sqdb.ts](../../lib/sqdb.ts)). `lib/index.ts` continues to
re-export `newSQ3DataStore` unchanged
(source: [lib/index.ts](../../lib/index.ts)). AkashaRender's
`package.json` references the updated (initially unpublished)
`sq3-kv-data-store` via a local/git dependency until it is published.

### 6. Target design

After migration, the SQLite stack becomes:

```
AkashaRender lib/*  ──uses──▶  promised.node.sqlite (AsyncDatabase)
   │                                    │
   │ newSQ3DataStore()                  │ .inner
   ▼                                    ▼
sq3-kv-data-store ──uses (DatabaseSync)──▶ node:sqlite (DatabaseSync)
(node:sqlite-only                            │
 major version)                              ▼
                                  sqlite-regex extension
                                  (via inner.loadExtension)

  (sqlite-vec / sqlite-lembed removed for now;
   re-added when vector/semantic search is enabled)
```

Concrete `lib/sqdb.ts` shape (illustrative, not yet applied):

- `import { AsyncDatabase } from 'promised.node.sqlite';`
- Remove `import { Database } from 'sqlite3';`
- Remove `import { default as SQ3QueryLog } from 'sqlite3-query-log';`
  and the `AK_PROFILE` block (per 5.3).
- Remove `import * as sqlite_vec from 'sqlite-vec';` and
  `import * as sqlite_lembed from 'sqlite-lembed';`, and the
  conditional embedding model registration block (per 2.1).
- Keep `import { SQ3DataStore } from 'sq3-kv-data-store';` (now the
  node:sqlite-only major version) and keep
  `newSQ3DataStore` returning `new SQ3DataStore(sqdb.inner, name)`
  (per 5.7).
- `export const sqdb = await AsyncDatabase.open(dburl, { allowExtension: true });`
- Keep `sqdb.inner.loadExtension(sqlite_regex.getLoadablePath());` (the
  `<any>` casts can be dropped since `inner` is typed as `DatabaseSync`).
- Remove `sqdb.inner.on('error', ...)`.
- Keep `newSQ3DataStore` returning `new SQ3DataStore(sqdb.inner, name)`
  against the updated node:sqlite-only package (per 5.7).

For `lib/data.ts`, `lib/cache/cache-sqlite.ts`, `lib/cache/tag-glue.ts`,
and `lib/cache/schema.ts`, the change is purely the import source:
`'promised-sqlite3'` → `'promised.node.sqlite'`. No method-call changes
are anticipated because the API is compatible.

`package.json` changes:

- Add `promised.node.sqlite`. Because the package is unpublished, this
  must initially be a local/`file:` or git dependency pointing at
  `../promised.node.sqlite` (or the GitHub repo), to be switched to a
  semver range once published to npmjs. **This remains a decision point**
  for the implementation step.
- Update the `sq3-kv-data-store` reference to the new node:sqlite-only
  major version. Because that update is also initially unpublished, it
  too is referenced via a local/git dependency until published. **Decision
  point**: where its source repo lives locally for development.
- Remove `sqlite3`, `promised-sqlite3`, `sqlite3-query-log`,
  `sqlite-vec`, and `sqlite-lembed`.
- Keep `sqlite-regex`, `sqlstring-sqlite`, and (updated) `sq3-kv-data-store`.

### 7. Migration phases

This migration spans two repositories. The companion package updates
(`promised.node.sqlite`, already done; `sq3-kv-data-store`, to be done)
are prerequisites for the AkashaRender steps.

0. **Companion package: update `sq3-kv-data-store`** (separate repo) to
   the node:sqlite-only major version per section 5.7 — constructor
   accepts `DatabaseSync`, queries use `StatementSync`, `sqlite3` removed,
   `CREATE TABLE IF NOT EXISTS`. Verify with its own tests.
1. **Add the dependencies**: wire `promised.node.sqlite` and the updated
   `sq3-kv-data-store` into `package.json` (local/git references),
   install, confirm they resolve.
2. **Swap type-only imports**: update `data.ts`, `cache-sqlite.ts`,
   `tag-glue.ts`, `schema.ts` to import `AsyncDatabase` from
   `promised.node.sqlite`. These are low-risk.
3. **Rework `sqdb.ts`**: change the `AsyncDatabase` import; add
   `{ allowExtension: true }`; remove the `sqlite3` import and the
   `.on('error')` listener; delete the `sqlite3-query-log` import and the
   `AK_PROFILE` block; remove the `sqlite-vec`/`sqlite-lembed` imports and
   the embedding registration block; keep `SQ3DataStore` /
   `newSQ3DataStore` passing `sqdb.inner`.
4. **Build**: `npm run build` and fix any TypeScript errors (most likely
   the `inner` casts and the `Database` type usages).
5. **Run the test suite** (`cd test && npm test`). Investigate any
   binding errors per sections 5.5 / 5.6 and apply explicit defaults or
   boolean coercion only where the tests demonstrate a need.
6. **Verify extensions and KV store**: confirm `sqlite-regex` still loads
   and regex queries work, and exercise `newSQ3DataStore` operations
   (`get`/`put`/`find`/`findAll`) against the updated package.
7. **Clean up**: remove the obsolete dependencies from `package.json`,
   and remove the now-historical `MIGRATION-*.md` files if desired
   (separate decision).
8. **Update the wiki**: refresh the
   [SQLite Database](../concepts/sqlite-database.md) and
   [Key-Value Store](../concepts/key-value-store.md) concepts, the
   `lib/sqdb.ts` summary, and related pages to describe
   `promised.node.sqlite`, the node:sqlite-only `sq3-kv-data-store`, and
   the removed extensions.

### 8. Risks and verification

- **`sq3-kv-data-store` rewrite correctness** is a key risk: the
  `StatementSync`-based queries and the preserved `selectors2where`
  behavior must match the prior semantics. External plugins
  (`akashacms-affiliates`, `akashacms-embeddables`) exercise `get`,
  `put`, `find`, and `findAll`, so those paths must be tested — ideally in
  the package's own test suite, and again via AkashaRender.
- **Cross-repository coordination**: the AkashaRender migration cannot
  complete until the updated `sq3-kv-data-store` exists; both companion
  packages are unpublished and referenced via local/git deps until
  published. The npmjs publishes gate a clean AkashaRender release.
- **Strictness of `node:sqlite`** (undefined/boolean/BigInt) is the most
  likely source of test failures; the prior analysis gives a proven
  remediation path.
- **Loss of `AK_PROFILE` SQL profiling** is an accepted capability
  regression (decision 5.3).
- **Dormant semantic search**: with `sqlite-vec`/`sqlite-lembed` removed,
  `semanticSearchDocs()` and the `docs-semantic` CLI command will not
  function until the extensions are re-added; the guarded code paths stay
  in place so re-enabling is straightforward (decision 2.1).

Verification is the existing Mocha suite (103 tests in the prior attempt)
plus manual checks of a full site render and direct exercise of the
KV-store operations used by the external plugins.

## Sources

- [lib/sqdb.ts](../../lib/sqdb.ts) - Shared database singleton and extension loading
- [lib/data.ts](../../lib/data.ts) - Trace storage using the database
- [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts) - File caching consumer of `AsyncDatabase`
- [lib/cache/tag-glue.ts](../../lib/cache/tag-glue.ts) - Tag tables using `AsyncDatabase`
- [lib/cache/schema.ts](../../lib/cache/schema.ts) - Table-creation helpers typed with `AsyncDatabase`
- [lib/index.ts](../../lib/index.ts) - Setup flow and `newSQ3DataStore` re-export
- [package.json](../../package.json) - Current dependency declarations
- [MIGRATION-NODE-SQLITE.md](../../MIGRATION-NODE-SQLITE.md) - Prior in-tree migration plan
- [MIGRATION-COMPLETE.md](../../MIGRATION-COMPLETE.md) - Prior migration completion notes
- [MIGRATION-SUMMARY.md](../../MIGRATION-SUMMARY.md) - Prior migration summary and dependency status
- [MIGRATION-UNDEFINED-VALUES-ANALYSIS.md](../../MIGRATION-UNDEFINED-VALUES-ANALYSIS.md) - Analysis of `undefined` binding behavior
- `promised.node.sqlite/README.md`, `SPEC.md`, `src/index.ts`, `package.json` - The replacement async wrapper package (outside this repository, at `/home/david/Projects/akasharender/promised.node.sqlite`)
- `sqlite3-key-value-data-store/src/index.ts`, `src/finder.ts`, `package.json`, `test/package.json`, `README.md` - The key-value store package to be updated to node:sqlite (outside this repository, at `/home/david/Projects/nodejs/sqlite3-key-value-data-store`)
- `akashacms-affiliates/index.mjs`, `akashacms-embeddables/index.mjs` - External plugins consuming `newSQ3DataStore` (outside this repository)

## Related Pages

- [SQLite Database](../concepts/sqlite-database.md) - Concept describing the current SQLite stack
- [Key-Value Store](../concepts/key-value-store.md) - Concept describing the SQ3DataStore-based KV store
- [Sitemap Validation Architecture](./sitemap-validation.md) - Other architecture document
- [lib/sqdb.ts summary](../summaries/lib/sqdb.ts.md) - Summary of the database module
- [lib/cache/cache-sqlite.ts summary](../summaries/lib/cache/cache-sqlite.ts.md) - Summary of the caching module
- [lib/data.ts summary](../summaries/lib/data.ts.md) - Summary of the trace data module

## Backlinks

- [wiki/architecture/README.md](./README.md)
- [wiki/index.md](../index.md)
