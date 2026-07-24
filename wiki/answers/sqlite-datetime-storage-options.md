---
title: "Options for Storing Date/Time Values in the In-Memory SQLite Database"
type: answer
Sources:
  - lib/cache/sql/create-table-documents.sql
  - lib/cache/sql/create-table-assets.sql
  - lib/cache/sql/create-table-layouts.sql
  - lib/cache/sql/create-table-partials.sql
  - lib/cache/sql/files-for-settimes.sql
  - lib/cache/sql/paths-rootp.sql
  - lib/cache/sql/paths-no-root.sql
  - lib/cache/cache-sqlite.ts
  - lib/cache/schema.ts
  - lib/cache/vfstack.ts
  - lib/sql/data-create-table.sql
  - lib/data.ts
  - lib/render.ts
Categories:
  - sqlite
  - date-time
  - database-schema
  - caching
date-created: 2026-07-07T00:16:37+03:00
last-updated: 2026-07-07T00:16:37+03:00
confidence: high
related-issue: "https://github.com/akashacms/akasharender/issues/120"
---

# Options for Storing Date/Time Values in the In-Memory SQLite Database

## Query

Check the implementation of date/time values in the in-memory database. In
[issue #120](https://github.com/akashacms/akasharender/issues/120), it is
written that the current implementation stores a raw number rather than the
"weird" column definition suggested by the SQLite team. What are the options
for storing date/time values?

## Answer

### Current implementation

Two date/time storage conventions coexist in the AkashaRender in-memory
SQLite database.

**1. Numeric epoch milliseconds** — used by the file-cache tables. This is
the "raw number" approach referred to in issue #120:

- `mtimeMs REAL` appears in all four cache tables: DOCUMENTS
  (source: [create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql), line 9),
  ASSETS (source: [create-table-assets.sql](../../lib/cache/sql/create-table-assets.sql), line 11),
  LAYOUTS (source: [create-table-layouts.sql](../../lib/cache/sql/create-table-layouts.sql), line 12),
  and PARTIALS (source: [create-table-partials.sql](../../lib/cache/sql/create-table-partials.sql), line 12).
  The value comes directly from `fs.Stats.mtimeMs`, gathered during the
  VFStack scan (source: [vfstack.ts](../../lib/cache/vfstack.ts), lines
  274-291) and bound into the insert/update statements without conversion
  (source: [cache-sqlite.ts](../../lib/cache/cache-sqlite.ts), e.g. lines
  863, 1428). Each table has an index on `mtimeMs`.
- `publicationTime INTEGER GENERATED ALWAYS AS (json_extract(info,
  '$.publicationTime')) STORED` in the DOCUMENTS table
  (source: [create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql), lines 13-14).
  The value is computed in JavaScript by `DocumentsCache.gatherInfoData`
  using `Date.parse()` / `Date.prototype.getTime()` — i.e. epoch
  milliseconds — with fallbacks to `mtimeMs` and to the current time
  (source: [cache-sqlite.ts](../../lib/cache/cache-sqlite.ts), lines
  1314-1360). It is stored inside the JSON `info` blob and extracted by the
  generated column, which is also indexed. Note that the `GENERATED ALWAYS
  AS (json_extract(...))` definition is not itself a date/time technique; it
  is the mechanism for lifting a value out of the JSON blob into an
  indexable column, and it would work equally well for any storage format.
- Commented-out code shows an abandoned `toISOString()` approach for
  `mtimeMs`, confirming the deliberate 0.9.5 switch to raw numbers
  mentioned in the issue (source:
  [cache-sqlite.ts](../../lib/cache/cache-sqlite.ts), lines 1414-1419).

**2. ISO-8601 text** — used only by the TRACES diagnostics table:
`start TEXT DEFAULT(datetime('now') || 'Z')` and
`now TEXT DEFAULT(datetime('now') || 'Z')`
(source: [data-create-table.sql](../../lib/sql/data-create-table.sql), lines 7-10).
The values written from JavaScript use `Date.prototype.toISOString()`
(source: [data.ts](../../lib/data.ts), lines 91-92). The `|| 'Z'` is needed
because SQLite's `datetime('now')` returns UTC but omits any timezone
designator.

All consumers of the numeric columns do plain numeric operations:

- `ORDER BY mtimeMs ASC` in the `paths()` queries (source:
  [paths-rootp.sql](../../lib/cache/sql/paths-rootp.sql), line 8;
  [paths-no-root.sql](../../lib/cache/sql/paths-no-root.sql), line 6).
- `ORDER BY COALESCE(d.publicationTime, d.mtimeMs)` in document search
  (source: [cache-sqlite.ts](../../lib/cache/cache-sqlite.ts), lines
  2548-2579).
- JavaScript-side numeric comparison for incremental rebuild:
  `docInfo.mtimeMs > outputMtimeMs`
  (source: [render.ts](../../lib/render.ts), lines 895-930).
- `setTimes()` reads `publicationTime` as a number, or falls back to
  `Date.parse()` on date strings extracted from the JSON metadata
  (source: [cache-sqlite.ts](../../lib/cache/cache-sqlite.ts), lines
  2003-2065; [files-for-settimes.sql](../../lib/cache/sql/files-for-settimes.sql)).

**Documentation bug**: the schema comment describes `publicationTime` as
"seconds since Jan 1 1970", but the code stores milliseconds
(source: [schema.ts](../../lib/cache/schema.ts), lines 331-339, versus
[cache-sqlite.ts](../../lib/cache/cache-sqlite.ts), lines 1314-1360). This
should be corrected regardless of any storage-format decision.

### The options for storing date/time in SQLite

SQLite has no native date/time column type. Per the SQLite documentation
(<https://sqlite.org/lang_datefunc.html>), the built-in date/time functions
accept three interchangeable representations, and a fourth (epoch
milliseconds) plus extensions are practical variants:

| Option | Column type | Pros | Cons |
|---|---|---|---|
| 1. ISO-8601 text (`YYYY-MM-DD HH:MM:SS.SSS`) | TEXT | Human-readable in queries and dumps; directly usable with `datetime()`, `date()`, `strftime()`; lexicographic sort equals chronological sort; the format the SQLite team usually recommends | Larger storage (~23 bytes vs 8); string comparisons slightly slower than numeric; timezone must be normalized manually (the TRACES table appends a literal `'Z'` for exactly this reason) |
| 2. Julian day number | REAL | The native internal unit of SQLite's date functions; fractional days give sub-second precision | Opaque to humans and to JavaScript; requires conversion at every JS boundary |
| 3. Unix epoch seconds | INTEGER | Compact (8 bytes); fast comparisons and indexes; `unixepoch()` and `datetime(x, 'unixepoch')` convert both ways | 1-second resolution unless the `'subsec'` modifier is used (SQLite >= 3.42); JS uses milliseconds, so a divide/multiply by 1000 is needed at every boundary |
| 4. Epoch milliseconds (current approach) | INTEGER / REAL | Zero conversion with JavaScript (`Date.now()`, `Date.parse()`, `fs.Stats.mtimeMs` are all epoch ms); compact; fast numeric sort and index | Not directly consumable by SQLite date functions — SQL that wants a readable date must write `datetime(col/1000.0, 'unixepoch')` |
| 5. sqlean `time` extension (<https://github.com/nalgeon/sqlean>) | INTEGER (nanoseconds) | High-precision timestamps; rich date/time arithmetic available inside SQL | External native extension: adds a loadable-extension step to database setup, plus portability and maintenance burden; see [Database Extensions](../concepts/database-extensions.md) for how AkashaRender already handles optional extensions |

### Assessment for AkashaRender

Given the actual usage patterns — numeric sorting in SQL, JavaScript-side
comparisons, `Date.parse()` at ingest, and no SQL that performs date
arithmetic — epoch milliseconds is a good fit for the file caches, because
every producer and consumer of these values is JavaScript. The realistic
choices are:

1. **Stay with epoch milliseconds** (recommended, lowest cost). Where a SQL
   query needs a readable date or date arithmetic, wrap the column:
   `datetime(mtimeMs/1000.0, 'unixepoch')`. Nothing else changes; the
   existing indexes and `ORDER BY` clauses keep working.
2. **Switch to ISO-8601 TEXT** if human-readable database dumps and direct
   use of SQLite's date functions are valued. Sorting still works
   (lexicographic = chronological). Costs: migrating all `mtimeMs` /
   `publicationTime` producers and consumers listed above, slightly larger
   rows, and careful timezone normalization (always store UTC with a
   consistent designator).
3. **Adopt the sqlean `time` extension** only if sub-millisecond precision
   or heavy in-SQL date arithmetic becomes a requirement. Neither appears
   anywhere in the current code, so this would be premature complexity
   today.

A hybrid is also reasonable and is effectively what exists now: raw numbers
for the hot, machine-compared file-cache columns, and ISO-8601 text for the
human-inspected TRACES diagnostics table. If the two-convention split is
felt to be confusing, the cheapest unification is option 1 plus a fix to the
misleading `schema.ts` comment.

## Sources

- [lib/cache/sql/create-table-documents.sql](../../lib/cache/sql/create-table-documents.sql) — DOCUMENTS schema: `mtimeMs`, generated `publicationTime` column, indexes
- [lib/cache/sql/create-table-assets.sql](../../lib/cache/sql/create-table-assets.sql), [create-table-layouts.sql](../../lib/cache/sql/create-table-layouts.sql), [create-table-partials.sql](../../lib/cache/sql/create-table-partials.sql) — `mtimeMs` in the other cache tables
- [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts) — value computation (`gatherInfoData`), binding, search `ORDER BY`, `setTimes()`
- [lib/cache/schema.ts](../../lib/cache/schema.ts) — type declarations and Joi validation for `mtimeMs` / `publicationTime`
- [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts) — origin of `mtimeMs` from `fs.statSync().mtimeMs`
- [lib/sql/data-create-table.sql](../../lib/sql/data-create-table.sql) and [lib/data.ts](../../lib/data.ts) — ISO-8601 text timestamps in TRACES
- [lib/render.ts](../../lib/render.ts) — numeric `mtimeMs` comparison for incremental rebuild
- [SQLite date and time functions](https://sqlite.org/lang_datefunc.html) — supported storage formats
- [sqlean extensions](https://github.com/nalgeon/sqlean) — high-precision `time` extension
- [Issue #120](https://github.com/akashacms/akasharender/issues/120) — the question this page answers

## Related Pages

- [Cache Schema](../concepts/cache-schema.md) — the file-cache data model these columns belong to
- [Database Indexing](../concepts/database-indexing.md) — the indexes on `mtimeMs` and `publicationTime`
- [Performance Tracing](../concepts/performance-tracing.md) — the TRACES table with ISO-8601 timestamps
- [Database Extensions](../concepts/database-extensions.md) — how loadable SQLite extensions (relevant to sqlean) are handled
- [lib/cache/cache-sqlite.ts summary](../summaries/lib/cache/cache-sqlite.ts.md)
- [lib/cache/schema.ts summary](../summaries/lib/cache/schema.ts.md)
- [lib/data.ts summary](../summaries/lib/data.ts.md)
- [lib/render.ts summary](../summaries/lib/render.ts.md)

## Backlinks

- [Answer index](./README.md)
- [Wiki index](../index.md)
