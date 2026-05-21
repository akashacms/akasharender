---
title: "Performance Profiling"
type: concept
Sources:
  - lib/render.ts
  - lib/cli.ts
  - lib/index.ts
  - lib/sqdb.ts
Categories:
  - performance
  - optimization
  - tooling
date-created: 2026-05-21T01:00:00+00:00
last-updated: 2026-05-21T01:00:00+00:00
confidence: high
---

# Performance Profiling

## Definition

Performance Profiling is AkashaRender's built-in capability to measure and record rendering timing data at multiple levels - document rendering stages (first render, layout, Mahabhuta), individual Mahabhuta function execution, and SQL query performance - using Node.js `performance.now()` for precise millisecond measurements and optional filesystem storage via the `--perf-data-dir` CLI option and `AK_PROFILE` environment variable (source: [lib/render.ts](../../lib/render.ts):38,318-334,380-524, [lib/cli.ts](../../lib/cli.ts):99,134,185-207, [lib/sqdb.ts](../../lib/sqdb.ts):102-103).

## How It Works

Performance profiling operates at three distinct levels (source: [lib/render.ts](../../lib/render.ts), [lib/sqdb.ts](../../lib/sqdb.ts)):

**Document Rendering Timing**: The `RenderingResults` object tracks timestamps for each rendering phase using `performance.now()` from Node.js perf_hooks module (source: [lib/render.ts](../../lib/render.ts):38,380-524):
- `renderFirstStart`/`renderFirstEnd` - Initial content rendering
- `renderLayoutStart`/`renderLayoutEnd` - Layout template application
- `renderMahaStart`/`renderMahaEnd` - Mahabhuta DOM manipulation
- `renderEnd` - Total completion time

These are captured in milliseconds with sub-millisecond precision and can be written to a JSON file via `--perfresults` CLI option (source: [lib/cli.ts](../../lib/cli.ts):134,185-207).

**Mahabhuta Function Profiling**: When `config.perfDataDir` is set, a `FilesystemPerfDataStore` is created to record individual Mahabhuta function execution times during DOM processing (source: [lib/render.ts](../../lib/render.ts):492-496). This allows identifying which custom elements or mungers are performance bottlenecks.

**SQL Query Logging**: The `AK_PROFILE` environment variable enables SQLite query logging via `SQ3QueryLog()` which writes all SQL statements and their execution times to a specified file (source: [lib/sqdb.ts](../../lib/sqdb.ts):102-103). This helps optimize database queries.

**CLI Integration**: The render commands support `--perf-data-dir` to enable Mahabhuta profiling and `--perfresults` to save rendering times to JSON (source: [lib/cli.ts](../../lib/cli.ts):99,134).

**Configuration Property**: The `perfDataDir` property on Configuration object controls where profiling data is stored (source: [lib/index.ts](../../lib/index.ts):597,812-815).

## Key Parameters

**performance.now()**: Node.js API providing high-resolution timestamp in milliseconds (source: [lib/render.ts](../../lib/render.ts):38,380).

**--perf-data-dir <dir>**: CLI option specifying directory for Mahabhuta performance data (source: [lib/cli.ts](../../lib/cli.ts):99).

**--perfresults <file>**: CLI option specifying JSON file for document rendering times (source: [lib/cli.ts](../../lib/cli.ts):134).

**AK_PROFILE environment variable**: When set, enables SQL query logging to specified file path (source: [lib/sqdb.ts](../../lib/sqdb.ts):102).

**config.perfDataDir**: Configuration property controlling performance data storage location (source: [lib/index.ts](../../lib/index.ts):812-815).

## When To Use

**Performance Optimization**: Use profiling to identify slow rendering stages, expensive Mahabhuta functions, or inefficient SQL queries (source: [lib/render.ts](../../lib/render.ts), [lib/sqdb.ts](../../lib/sqdb.ts)).

**Regression Testing**: Compare rendering times across code changes to detect performance regressions (source: [lib/cli.ts](../../lib/cli.ts)).

**Plugin Development**: Profile Mahabhuta functions to ensure custom elements don't slow rendering (source: [lib/render.ts](../../lib/render.ts):492-496).

**Database Optimization**: Use SQL profiling to find slow queries needing indexes or optimization (source: [lib/sqdb.ts](../../lib/sqdb.ts):102-103).

## Risks & Pitfalls

**Overhead**: Profiling itself adds overhead. Performance measurements with profiling enabled may not reflect production performance (source: [lib/render.ts](../../lib/render.ts)).

**File I/O Impact**: Writing profiling data to disk during rendering can skew measurements (source: [lib/render.ts](../../lib/render.ts):492-496).

**Storage Requirements**: Profiling large sites generates significant data. Ensure adequate disk space when using `--perf-data-dir` (source: [lib/cli.ts](../../lib/cli.ts):99).

**Precision Limits**: While `performance.now()` is precise, very fast operations may still show as 0ms (source: [lib/render.ts](../../lib/render.ts):38).

## Sources

- [lib/render.ts](../../lib/render.ts) - Document rendering timing
- [lib/cli.ts](../../lib/cli.ts) - CLI profiling options
- [lib/index.ts](../../lib/index.ts) - Configuration perfDataDir property
- [lib/sqdb.ts](../../lib/sqdb.ts) - SQL query profiling

## Related Pages

- [Rendering Pipeline](./rendering-pipeline.md) - Stages being profiled
- [Mahabhuta System](./mahabhuta-system.md) - DOM processing profiled
- [Database Indexing](./database-indexing.md) - Optimizing profiled queries
- [Command-Line Interface](./command-line-interface.md) - Profiling CLI options

## Backlinks
