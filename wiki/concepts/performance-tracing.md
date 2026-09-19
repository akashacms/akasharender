---
title: Performance Tracing
type: concept
Sources:
  - lib/render.ts
  - lib/cli.ts
Categories:
  - performance
  - monitoring
  - development
created: 2026-05-21T03:00:00Z
updated: 2026-09-19T12:00:00+03:00
confidence: high
---

# Performance Tracing

## Definition

Performance Tracing was AkashaRender's original system for recording the time
taken at different stages of document rendering into a SQLite `TRACES` table.
The subsystem was **fully removed on 2026-09-19**: `lib/data.ts`, the four
`lib/sql/data-*.sql` files, and every call site (`data.init()` in
`lib/index.ts`, `data.removeAll()` in `lib/cli.ts`, the unused
`import * as data` in `lib/render.ts`) are gone. The writer half
(`data.report()` / `data.data4file()`) had already been deleted on
2026-09-03 alongside the legacy string-returning render path, and the
remaining maintenance functions (`init`, `remove`, `removeAll`, `print`)
had no active consumers, so the whole apparatus was removed in one pass.

Per-stage timing now lives entirely in the `RenderingResults` objects
returned by `render` / `renderDocument` (measured with `performance.now()`),
optionally persisted through Mahabhuta's `FilesystemPerfDataStore` when
`config.perfDataDir` is set. See
[Performance Profiling](./performance-profiling.md) and
[Performance Measurement Methodology](./performance-measurement-methodology.md).

## How It Works

The current mechanism, replacing the deleted TRACES subsystem:

1. **`RenderingResults` timing** — every rendered document produces a
   `RenderingResults` object containing per-stage durations
   (`performance.now()` deltas). Site-level `render` returns the array of
   these objects; the CLI's `--perfresults <file>` option writes them to
   disk.
2. **`FilesystemPerfDataStore`** — when `config.perfDataDir` is set (via
   the CLI's `--perf-data-dir` option or programmatically), Mahabhuta's
   `FilesystemPerfDataStore` accumulates per-mahafunc timing into files
   under that directory for later analysis.
3. **No SQLite table** — nothing writes rendering timings to the
   in-memory SQLite database anymore. The `TRACES` table is not created.

(source: [lib/render.ts](../../lib/render.ts), [lib/cli.ts](../../lib/cli.ts))

## Key Parameters

- **`config.perfDataDir`** — directory into which the Mahabhuta
  `FilesystemPerfDataStore` writes per-mahafunc timing. Unset by default;
  set via CLI `--perf-data-dir` or programmatically.
- **CLI `--perfresults <file>`** — write per-document `RenderingResults`
  (including per-stage durations) to a JSON file after a full render.

## When To Use

Reach for these mechanisms when:

1. **Diagnosing slow renders** — inspect the `--perfresults` output to
   see which documents dominate build time.
2. **Attributing time to a stage** — the per-stage numbers in
   `RenderingResults` show whether time is going into the first render,
   layout wrapping, or Mahabhuta.
3. **Attributing time to a mahafunc** — enable `perfDataDir` and inspect
   the `FilesystemPerfDataStore` output for per-mahafunc totals.

## Risks & Pitfalls

### Do not look for a TRACES table

Older documentation, comments, and prior wiki logs refer to a `TRACES`
SQLite table populated during rendering. That table no longer exists,
and no code path creates or writes to it. Any tooling that queried
`TRACES` must switch to `RenderingResults` or the `FilesystemPerfDataStore`.

### Time precision

`performance.now()` provides sub-millisecond precision, but for very
fast individual stages the numbers can still be noisy. Aggregate over
many documents when comparing before/after.

## Sources

- [lib/render.ts](../../lib/render.ts) — `RenderingResults` and per-stage
  timing
- [lib/cli.ts](../../lib/cli.ts) — `--perfresults` and `--perf-data-dir`
  wiring

## Related Pages

- [Performance Profiling](./performance-profiling.md): Uses the current
  timing data to analyze rendering performance
- [Performance Measurement Methodology](./performance-measurement-methodology.md):
  How to attribute and interpret timing data
- [Site Rendering](./site-rendering.md): Rendering workflow that produces
  the timing data

## Backlinks

- [concepts/README.md](./README.md)
- [How To Debug the Rendering Pipeline](../memory/debugging-rendering-pipeline.md)
