---
title: "Site Rendering"
type: concept
Sources:
  - lib/render.ts
  - lib/cli.ts
Categories:
  - rendering
  - build
  - workflow
date-created: 2026-05-21T03:00:00+00:00
last-updated: 2026-05-21T03:00:00+00:00
confidence: high
---

# Site Rendering

## Definition

Site Rendering is the complete workflow that transforms all source documents in an AkashaRender project into a rendered website by iterating through the documents cache, processing each document through the three-stage rendering pipeline in parallel using a concurrency-limited queue, invoking lifecycle hooks before and after rendering, and returning results for all processed documents (source: [lib/render.ts](../../lib/render.ts):730-840, [lib/cli.ts](../../lib/cli.ts)).

## How It Works

The site rendering process follows a five-stage workflow (source: [lib/render.ts](../../lib/render.ts):738-840):

**Stage 1: Pre-Rendering Hook** - Invokes `config.hookBeforeSiteRendered()` allowing plugins to perform setup, generate auxiliary files, or validate configuration before any documents are processed (source: [lib/render.ts](../../lib/render.ts):743).

**Stage 2: Document Collection** - Retrieves all document paths from the documents cache and filters the list (source: [lib/render.ts](../../lib/render.ts):746-776):
- Calls `documents.paths()` to get all documents
- Excludes directories by checking `stats.isDirectory()`
- Creates array of `{config, info}` tuples for the queue
- Each entry includes full document metadata from cache

**Stage 3: Concurrent Rendering** - Processes documents in parallel using fastq promise queue (source: [lib/render.ts](../../lib/render.ts):779-826):
- Queue concurrency set by `config.concurrency` (default typically 2-4)
- Each document processed via `renderDocument(config, info)`
- Returns `{result, error}` objects for success/failure tracking
- All rendering happens asynchronously with Promise.all coordination
- Results collected in an array preserving order

**Stage 4: Post-Rendering Hook** - Invokes `config.hookSiteRendered()` allowing plugins to perform post-processing like image resizing, sitemap generation, or cleanup (source: [lib/render.ts](../../lib/render.ts):830-836).

**Stage 5: Result Return** - Returns array of rendering results containing either successful render data or error information for each document (source: [lib/render.ts](../../lib/render.ts):839).

**Queue Processing**: Uses fastq for controlled concurrency (source: [lib/render.ts](../../lib/render.ts):785-810):
```typescript
const queue = fastq.promise(
    async function renderDocumentInQueue(entry) {
        try {
            let result = await renderDocument(entry.config, entry.info);
            return { result };
        } catch (error) {
            return { error };
        }
    },
    config.concurrency
);
```

**CLI Integration**: The `render <configFN>` command wraps this function, providing options for asset copying, results file output, and performance profiling (source: [lib/cli.ts](../../lib/cli.ts)).

## Key Parameters

**config**: Configuration object containing all settings, directories, plugins, and caching (source: [lib/render.ts](../../lib/render.ts):738).

**config.concurrency**: Number of simultaneous rendering tasks, controls parallelism level (source: [lib/render.ts](../../lib/render.ts):810).

**config.hookBeforeSiteRendered()**: Lifecycle hook invoked before rendering begins (source: [lib/render.ts](../../lib/render.ts):743).

**config.hookSiteRendered()**: Lifecycle hook invoked after all documents rendered (source: [lib/render.ts](../../lib/render.ts):832).

**documents.paths()**: Method returning all document entries from cache (source: [lib/render.ts](../../lib/render.ts):746).

**renderDocument()**: Function rendering single document through three-stage pipeline (source: [lib/render.ts](../../lib/render.ts):800-801).

**results array**: Array of `{result, error}` objects, one per document processed (source: [lib/render.ts](../../lib/render.ts):823-826,839).

## When To Use

**Full Site Build**: Run site rendering when building the complete website from scratch or after major changes (source: [lib/render.ts](../../lib/render.ts)).

**Deployment Preparation**: Execute before deploying to ensure all content is current (source: [lib/render.ts](../../lib/render.ts)).

**CI/CD Pipelines**: Integrate site rendering in continuous integration workflows for automated builds (source: [lib/render.ts](../../lib/render.ts)).

**Content Updates**: After adding multiple new documents or updating templates that affect many pages (source: [lib/render.ts](../../lib/render.ts)).

**Plugin Testing**: Run full site render to test plugin behavior across all content (source: [lib/render.ts](../../lib/render.ts)).

## Risks & Pitfalls

**Memory Usage**: Rendering entire site keeps all results in memory. Large sites may exhaust RAM (source: [lib/render.ts](../../lib/render.ts):823-826).

**Concurrency Tuning**: Too high concurrency overwhelms system resources; too low wastes time. Optimal value depends on hardware and content complexity (source: [lib/render.ts](../../lib/render.ts):810).

**Error Handling**: Errors in individual documents are caught and returned in results array but don't stop overall rendering. Must check results for errors (source: [lib/render.ts](../../lib/render.ts):805-808).

**Hook Failures**: If `hookBeforeSiteRendered()` or `hookSiteRendered()` throw exceptions, the entire build fails. Plugins must handle errors internally (source: [lib/render.ts](../../lib/render.ts):743,830-836).

**Directory Exclusion**: Only explicitly checks for directories. Other special files must be excluded via ignore patterns in configuration (source: [lib/render.ts](../../lib/render.ts):762).

**Stat Call Overhead**: Calls `fsp.stat()` for each document to verify it's not a directory, adding I/O overhead (source: [lib/render.ts](../../lib/render.ts):759-760).

**No Progress Indication**: Function provides no progress updates. For large sites, users may think process is hung (source: [lib/render.ts](../../lib/render.ts)).

**Asset Copying**: Site rendering doesn't automatically copy assets. Must call `config.copyAssets()` separately or use CLI with `--copy-assets` flag (source: [lib/render.ts](../../lib/render.ts)).

## Sources

- [lib/render.ts](../../lib/render.ts) - Site rendering implementation
- [lib/cli.ts](../../lib/cli.ts) - CLI render command

## Related Pages

- [Rendering Pipeline](./rendering-pipeline.md) - Three-stage document processing
- [Lifecycle Hooks](./lifecycle-hooks.md) - Pre and post-rendering hooks
- [Concurrent Rendering](./concurrent-rendering.md) - Parallel processing pattern
- [Command-Line Interface](./command-line-interface.md) - CLI render command
- [File Caching](./file-caching.md) - Document cache providing paths

## Backlinks
