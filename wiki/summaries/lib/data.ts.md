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
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/data.ts - Rendering Performance Tracking

## Code Complexity

- **Lines of code**: 153
- **Exported functions**: 6 (init, report, remove, removeAll, print, data4file)
- **Classes**: 1 internal (Trace class)
- **Complexity**: Low-Medium - straightforward database operations
- **Key pattern**: SQL loaded from external files, simple CRUD operations

## Key Points

- Tracks rendering performance and stages for documents
- Stores trace data in SQLite database
- SQL statements loaded from external `.sql` files
- Provides functions to add, remove, and query trace data
- Used for performance analysis and debugging

## Summary

This module implements a tracing system for tracking document rendering performance through various stages (source: [lib/data.ts](../../lib/data.ts)).

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
- `data-add-report.sql` - Inserts trace records
- `data-delete-traces.sql` - Deletes traces for a specific file
- `data-delete-all-traces.sql` - Clears all traces
- `data-get-all-traces.sql` - Retrieves all traces
- `data-for-file.sql` - Gets traces for a specific file

Key functions provided (source: [lib/data.ts](../../lib/data.ts)):
- `init()` - Creates the database table
- `report(basedir, fpath, renderTo, stage, start)` - Records a trace
- `remove(basedir, fpath)` - Removes traces for a file
- `removeAll()` - Clears all traces
- `print()` - Prints all traces to console with timing
- `data4file(basedir, fpath)` - Returns formatted trace data for a file

The timing information shows elapsed milliseconds between `start` and `now` for each stage, allowing performance bottlenecks to be identified (source: [lib/data.ts](../../lib/data.ts)).

## Relevant Concepts

- [Performance Tracing](../concepts/performance-tracing.md)
- [SQLite Database](../concepts/sqlite-database.md)
- [Rendering Stages](../concepts/rendering-stages.md)

## Related Pages

- [lib/sqdb.ts](./sqdb.ts) - SQLite database initialization
- [lib/render.ts](./render.ts) - Uses tracing during rendering

## Backlinks

