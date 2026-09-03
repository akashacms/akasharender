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
last-updated: 2026-09-03T19:30:00+03:00
confidence: high
---

# Site Rendering

## Definition

Site Rendering is the complete workflow that transforms all source documents in an AkashaRender project into a rendered website by iterating through the documents cache, processing each document through the three-stage rendering pipeline in parallel using a concurrency-limited queue, invoking lifecycle hooks before and after rendering, and returning results for all processed documents (source: [lib/render.ts](../../lib/render.ts):548-680, [lib/cli.ts](../../lib/cli.ts)).

## How It Works

The site rendering process follows a five-stage workflow (source: [lib/render.ts](../../lib/render.ts):548-680):

**Stage 1: Pre-Rendering Hook** - Invokes `config.hookBeforeSiteRendered()` allowing plugins to perform setup, generate auxiliary files, or validate configuration before any documents are processed (source: [lib/render.ts](../../lib/render.ts):558).

**Stage 2: Document Collection** - Retrieves all document paths from the documents cache and filters the list (source: [lib/render.ts](../../lib/render.ts):561-601):
- Calls `documents.paths()` to get all documents
- Excludes directories by checking `stats.isDirectory()`
- Skips documents whose output is up-to-date via `isDocumentUpToDate()` (unless `forceRenderAll`); skipped documents are reported with `skipped: true`
- Creates array of `{config, info}` tuples for the queue
- Each entry includes full document metadata from cache

**Stage 3: Concurrent Rendering** - Processes documents in parallel using fastq promise queue (source: [lib/render.ts](../../lib/render.ts):604-668):
- Queue concurrency set by `config.concurrency` (default typically 2-4)
- Each document processed via `renderDocument(config, info)`
- Returns `RenderingResults` objects; errors are accumulated in `result.errors` rather than thrown
- All rendering happens asynchronously with Promise.all coordination
- Results collected in an array preserving order

**Stage 4: Post-Rendering Hook** - Invokes `config.hookSiteRendered()` allowing plugins to perform post-processing like image resizing, sitemap generation, or cleanup (source: [lib/render.ts](../../lib/render.ts):669-678).

**Stage 5: Result Return** - Returns array of rendering results containing either successful render data or error information for each document (source: [lib/render.ts](../../lib/render.ts):680).

**Queue Processing**: Uses fastq for controlled concurrency (source: [lib/render.ts](../../lib/render.ts):619-648):
```typescript
const queue = fastq.promise(
    async function renderDocumentInQueue(entry)
        : Promise<RenderingResults>
    {
        try {
            let result = await renderDocument(
                entry.config, entry.info
            );
            return result;
        } catch (error) {
            console.log(`ERROR renderDocumentInQueue ${entry.info.vpath}`, error.stack);
            return undefined;
        }
    },
    config.concurrency
);
```

**CLI Integration**: The `render <configFN>` command wraps this function, providing options for asset copying, results file output, and performance profiling (source: [lib/cli.ts](../../lib/cli.ts)).

## Key Parameters

**config**: Configuration object containing all settings, directories, plugins, and caching (source: [lib/render.ts](../../lib/render.ts):548).

**config.concurrency**: Number of simultaneous rendering tasks, controls parallelism level (source: [lib/render.ts](../../lib/render.ts):645).

**config.hookBeforeSiteRendered()**: Lifecycle hook invoked before rendering begins (source: [lib/render.ts](../../lib/render.ts):558).

**config.hookSiteRendered()**: Lifecycle hook invoked after all documents rendered (source: [lib/render.ts](../../lib/render.ts):673).

**documents.paths()**: Method returning all document entries from cache (source: [lib/render.ts](../../lib/render.ts):561).

**renderDocument()**: Function rendering single document through three-stage pipeline (source: [lib/render.ts](../../lib/render.ts):236).

**results array**: Array of `RenderingResults` objects, one per document processed (rendered or skipped) (source: [lib/render.ts](../../lib/render.ts):660-666,680).

## When To Use

**Full Site Build**: Run site rendering when building the complete website from scratch or after major changes (source: [lib/render.ts](../../lib/render.ts)).

**Deployment Preparation**: Execute before deploying to ensure all content is current (source: [lib/render.ts](../../lib/render.ts)).

**CI/CD Pipelines**: Integrate site rendering in continuous integration workflows for automated builds (source: [lib/render.ts](../../lib/render.ts)).

**Content Updates**: After adding multiple new documents or updating templates that affect many pages (source: [lib/render.ts](../../lib/render.ts)).

**Plugin Testing**: Run full site render to test plugin behavior across all content (source: [lib/render.ts](../../lib/render.ts)).

## Risks & Pitfalls

**Memory Usage**: Rendering entire site keeps all results in memory. Large sites may exhaust RAM (source: [lib/render.ts](../../lib/render.ts):660-666).

**Concurrency Tuning**: Too high concurrency overwhelms system resources; too low wastes time. Optimal value depends on hardware and content complexity (source: [lib/render.ts](../../lib/render.ts):645).

**Error Handling**: Errors in individual documents are accumulated into each result's `errors` array (and unexpected queue failures are caught) but don't stop overall rendering. Must check `result.errors` on each entry (source: [lib/render.ts](../../lib/render.ts):634-640).

**Hook Failures**: If `hookBeforeSiteRendered()` or `hookSiteRendered()` throw exceptions, the entire build fails. Plugins must handle errors internally (source: [lib/render.ts](../../lib/render.ts):558,669-678).

**Directory Exclusion**: Only explicitly checks for directories. Other special files must be excluded via ignore patterns in configuration (source: [lib/render.ts](../../lib/render.ts):580).

**Stat Call Overhead**: Calls `fsp.stat()` for each document to verify it's not a directory, adding I/O overhead (source: [lib/render.ts](../../lib/render.ts):577-578).

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
