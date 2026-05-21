---
title: Performance Tracing
type: concept
Sources:
  - lib/data.ts
  - lib/render.ts
  - lib/sql/data-create-table.sql
  - lib/sql/data-delete-traces.sql
  - lib/sql/data-delete-all-traces.sql
  - lib/sql/data-get-all-traces.sql
Categories:
  - performance
  - monitoring
  - development
  - database
created: 2026-05-21T03:00:00Z
updated: 2026-05-21T03:00:00Z
confidence: high
---

# Performance Tracing

## Definition

Performance Tracing is AkashaRender's built-in system for recording and analyzing the time taken at different stages of document rendering, storing timing data in a SQLite TRACES table to help developers identify performance bottlenecks.

(source: [lib/data.ts](../../lib/data.ts), [lib/render.ts](../../lib/render.ts))

## How It Works

The tracing system records timing information for each document's rendering stages:

1. **Data Structure**: Each trace record contains:
   - `basedir`: Source directory mount point
   - `fpath`: Relative file path within directory
   - `fullpath`: Absolute file path
   - `renderTo`: Output directory path
   - `stage`: Rendering stage name (e.g., "FIRST RENDER", "LAYOUT RENDERED", "MAHABHUTA")
   - `start`: ISO 8601 timestamp when rendering started
   - `now`: ISO 8601 timestamp when stage completed

2. **Recording Traces**: During rendering, `data.report()` is called at key stages:
   ```typescript
   await data.report(docInfo.mountPoint, 
                     docInfo.vpath,
                     config.renderTo, 
                     "FIRST RENDER", renderStart);
   ```

3. **Storage**: Traces are stored in the TRACES table with indexes on basedir, fpath, and fullpath for efficient querying.

4. **Retrieval**: Trace data can be accessed via:
   - `data.print()`: Prints all traces with calculated durations
   - `data.data4file(basedir, fpath)`: Returns trace report for a specific file
   - Duration calculated as: `(now - start) / 1000` seconds

5. **Cleanup**: Traces can be removed individually (`data.remove()`) or entirely (`data.removeAll()`), useful when re-rendering files multiple times.

(source: [lib/data.ts](../../lib/data.ts), [lib/render.ts](../../lib/render.ts), [lib/sql/data-create-table.sql](../../lib/sql/data-create-table.sql))

## Key Parameters

### Trace Record Fields

- **basedir** (string): The source directory mount point where the file originated
- **fpath** (string): The relative file path within the directory
- **renderTo** (string): The output directory path where the file will be rendered
- **stage** (string): The rendering stage name (e.g., "FIRST RENDER", "LAYOUT RENDERED", "MAHABHUTA")
- **start** (Date): The ISO 8601 timestamp when rendering started for this file

### API Functions

- **data.report(basedir, fpath, renderTo, stage, start)**: Records a trace entry for a rendering stage
- **data.print()**: Prints all trace records with calculated durations to console
- **data.data4file(basedir, fpath)**: Returns formatted trace report string for a specific file
- **data.remove(basedir, fpath)**: Removes trace records for a specific file
- **data.removeAll()**: Clears all trace records from the database

(source: [lib/data.ts](../../lib/data.ts))

## When To Use

Use performance tracing when:

1. **Diagnosing Slow Renders**: Identifying which files or stages take the longest to render
2. **Optimizing Rendering**: Comparing rendering times before and after optimization changes
3. **Debugging Performance**: Understanding where time is spent during complex rendering pipelines
4. **Development**: Monitoring rendering performance during active development
5. **Per-File Analysis**: Getting detailed timing breakdowns for specific documents

The tracing system is particularly useful during development when you need to understand why certain files are slow to render or which rendering stages are bottlenecks.

(source: [lib/data.ts](../../lib/data.ts), [lib/render.ts](../../lib/render.ts))

## Risks & Pitfalls

### Storage Overhead

Trace records accumulate in the database, potentially using significant storage for large sites with many renders. Use `data.removeAll()` to clear traces when no longer needed.

### Development-Only Feature

The tracing system is primarily for development debugging and may impact performance if used in production builds. Consider disabling or cleaning up traces for production.

### Multiple Renders

When re-rendering the same file multiple times, traces accumulate. Use `data.remove(basedir, fpath)` to clean up old traces before re-rendering.

### Stage Name Consistency

Stage names are hardcoded strings (e.g., "FIRST RENDER", "LAYOUT RENDERED"). Using inconsistent stage names makes it harder to analyze traces across different code paths.

### Time Precision

Durations are calculated using JavaScript Date objects, which provide millisecond precision but may not be accurate enough for very short operations.

(source: [lib/data.ts](../../lib/data.ts))

## Related Pages

- [Performance Profiling](./performance-profiling.md): Uses trace data to analyze rendering performance
- [Cache Schema](./cache-schema.md): TRACES table is part of the cache database schema
- [Database Indexing](./database-indexing.md): TRACES table has indexes for efficient querying
- [Site Rendering](./site-rendering.md): Rendering workflow that generates trace data

## Backlinks

The Performance Tracing concept is referenced by:

- [concepts/README.md](./README.md): Listed under "Validation and Quality" (should be moved to "Development Tools and Performance")
