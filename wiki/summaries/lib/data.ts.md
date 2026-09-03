---
title: "lib/data.ts - Rendering Performance Tracking"
type: summary
Sources:
  - lib/data.ts
Categories:
  - performance
  - tracing
  - database
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-09-03T18:10:00+03:00
confidence: high
---

# lib/data.ts - Rendering Performance Tracking

## Code Complexity

- **Lines of code**: ~105
- **Exported functions**: 4 (init, remove, removeAll, print)
- **Classes**: 1 internal (Trace class)
- **Complexity**: Low - straightforward database operations
- **Key pattern**: SQL loaded from external files, simple CRUD operations

## Key Points

- Maintenance functions for the TRACES table in the SQLite database
- SQL statements loaded from external `.sql` files
- **Nothing currently writes to TRACES**: the `report()` and `data4file()` functions (and their SQL files) were removed on 2026-09-03 when the legacy string-returning render path was deleted — per-stage timing now lives in `RenderingResults` (see [lib/render.ts summary](./render.ts.md))
- `init()` is still called by the CLI and the akasharender-epub plugin; `removeAll()` is called by the CLI before each render

## Summary

This module manages the TRACES table used historically for tracking document rendering performance through stages (source: [lib/data.ts](../../lib/data.ts)).

The Trace class stores information about each rendering operation (source: [lib/data.ts](../../lib/data.ts)):
- `basedir` - Base directory path
- `fpath` - File path relative to basedir
- `fullpath` - Combined full path
- `renderTo` - Destination path
- `stage` - Current rendering stage
- `start` - Start timestamp (ISO string)
- `now` - Current timestamp (ISO string)

SQL statements are loaded from external files in the `sql/` directory (source: [lib/data.ts](../../lib/data.ts)):
- `data-create-table.sql` - Creates the traces table
- `data-delete-traces.sql` - Deletes traces for a specific file
- `data-delete-all-traces.sql` - Clears all traces
- `data-get-all-traces.sql` - Retrieves all traces

(`data-add-report.sql` and `data-for-file.sql` were deleted with `report()`/`data4file()`.)

Functions provided (source: [lib/data.ts](../../lib/data.ts)):
- `init()` - Creates the database table
- `remove(basedir, fpath)` - Removes traces for a file
- `removeAll()` - Clears all traces
- `print()` - Prints all traces to console with timing

## Relevant Concepts

- [Performance Tracing](../concepts/performance-tracing.md)
- [SQLite Database](../concepts/sqlite-database.md)
- [Rendering Stages](../concepts/rendering-stages.md)

## Related Pages

- [lib/sqdb.ts](./sqdb.ts) - SQLite database initialization
- [lib/render.ts](./render.ts) - Rendering (timing now carried in RenderingResults)

## Backlinks
