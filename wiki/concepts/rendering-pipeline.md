---
title: "Rendering Pipeline"
type: concept
Sources:
  - lib/render.ts
  - lib/index.ts
Categories:
  - rendering
  - architecture
  - workflow
date-created: 2026-05-21T06:15:00+03:00
last-updated: 2026-05-21T06:15:00+03:00
confidence: high
---

# Rendering Pipeline

## Definition

The Rendering Pipeline is the complete workflow for transforming an entire AkashaRender project from source files into a rendered website, orchestrating file discovery, concurrent processing, error handling, and performance tracking across all documents (source: [lib/render.ts](../../lib/render.ts)). While [Three-Stage Rendering](./three-stage-rendering.md) describes how a single document is processed, the Rendering Pipeline describes how all documents flow through the system.

## How It Works

### Full Site Rendering

The main rendering functions orchestrate site-wide builds (source: [lib/render.ts](../../lib/render.ts)):

**`render(config)`** - Primary rendering function:
```javascript
export async function render(config) {
    // 1. Get all documents from cache
    const documents = filecache.documentsCache;
    const paths = await documents.paths();
    
    // 2. Create rendering queue with concurrency control
    const queue = fastq.promise(renderWorker, config.concurrency);
    
    // 3. Queue all documents for rendering
    const results = await Promise.all(
        paths.map(vpath => queue.push({ config, vpath }))
    );
    
    // 4. Return aggregated results
    return results;
}
```

**`render2(config)`** - Alternative rendering function with different result format

### Pipeline Stages

The rendering pipeline executes these high-level stages (source: [lib/render.ts](../../lib/render.ts)):

**1. Initialization**
- Configuration prepared via `config.prepare()`
- File caches initialized via `setup(config)`
- All source directories scanned
- SQLite database populated with file metadata

**2. Discovery**
- Query documentsCache for all renderable files
- Filter by virtual paths
- Identify render targets and output paths

**3. Concurrent Rendering**
- Create fastq worker queue with `config.concurrency` workers
- Each worker processes one document through [Three-Stage Rendering](./three-stage-rendering.md)
- Documents render in parallel up to concurrency limit
- Results collected as Promises

**4. Individual Document Processing**
For each document, the worker:
- Retrieves document info from cache
- Determines appropriate renderer
- Executes [Three-Stage Rendering](./three-stage-rendering.md):
  - Stage 1: Content rendering
  - Stage 2: Layout application (if specified)
  - Stage 3: Mahabhuta DOM manipulation
- Writes output to `config.renderDestination`
- Tracks performance metrics
- Captures errors

**5. Result Aggregation**
- Collect RenderingResults from all documents
- Aggregate errors
- Compile performance statistics
- Return to caller

### Concurrency Control

The pipeline uses `fastq` for promise-based concurrent processing (source: [lib/render.ts](../../lib/render.ts)):

```javascript
import fastq from 'fastq';

const queue = fastq.promise(
    async (task) => {
        return await renderDocument(task.config, task.docInfo);
    },
    config.concurrency  // Concurrency limit (default: 3)
);
```

Benefits:
- Render multiple documents simultaneously
- CPU and I/O parallelism
- Configurable concurrency prevents resource exhaustion
- Promise-based async/await interface

### Result Tracking

Each document produces a `RenderingResults` object (source: [lib/render.ts](../../lib/render.ts)):

```typescript
type RenderingResults = {
    vpath: string;                  // Virtual path
    renderPath: string;             // Output path
    renderFormat: string;           // Format (HTML, CSS, COPY)
    
    firstRenderStart?: number;      // Stage 1 start time
    firstRenderEnd?: number;        // Stage 1 end time
    firstRenderElapsed?: number;    // Stage 1 duration
    
    layoutStart?: number;           // Stage 2 start time
    layoutEnd?: number;             // Stage 2 end time
    layoutElapsed?: number;         // Stage 2 duration
    
    mahabStart?: number;            // Stage 3 start time
    mahabEnd?: number;              // Stage 3 end time
    mahabElapsed?: number;          // Stage 3 duration
    
    totalElapsed?: number;          // Total duration
    errors: any[];                  // Errors encountered
};
```

Uses `performance.now()` for high-resolution timing.

### Special Rendering Paths

**CSS Files** (source: [lib/render.ts](../../lib/render.ts)):
- Rendered through Stage 1 only
- Skip layout application (Stage 2)
- Skip Mahabhuta processing (Stage 3)
- Allows template variables in CSS (e.g., `.css.ejs`)

**Asset Copying** (source: [lib/render.ts](../../lib/render.ts)):
- Binary files copied directly
- No rendering stages
- Determined by MIME type
- Images, fonts, PDFs, etc.

**Error Handling**:
- Errors captured per-document
- Stored in `RenderingResults.errors[]`
- Failed documents don't block other renders
- Aggregate errors reported at end

### Performance Optimization

The pipeline optimizes rendering through (source: [lib/render.ts](../../lib/render.ts)):

**Concurrent Processing**:
- Multiple documents render in parallel
- Configurable via `config.concurrency`
- Balances CPU/I/O utilization

**File Caching**:
- SQLite database avoids filesystem scans
- Metadata queries instead of file reads
- [File Caching](./file-caching.md) provides fast lookups

**Query Result Caching**:
- Repeated database queries cached
- Tag lists, layout queries cached
- Reduces redundant SQL execution

### Integration with CLI

The command-line interface invokes the rendering pipeline (source: [lib/cli.mjs](../../lib/cli.mjs)):

```javascript
// From cli.mjs render command
const config = (await import(configPath)).default;
let akasha = config.akasha;

await akasha.setup(config);
if (cmdObj.copyAssets) {
    await config.copyAssets();
}
let results = await akasha.render(config);
```

### Lifecycle Hooks

Plugins can hook into the pipeline at various points (source: [lib/index.ts](../../lib/index.ts)):

**Before Rendering**:
```javascript
await config.hookBeforeSiteRendered();
```

**After Rendering**:
```javascript
await config.hookSiteRendered();
```

## Key Parameters

**Configuration Settings**:
- `config.concurrency` - Number of concurrent render operations (default: 3)
- `config.renderDestination` - Output directory (default: `out/`)
- `config.documentDirs` - Source document directories
- `config.layoutDirs` - Layout template directories
- `config.partialDirs` - Partial template directories

**Rendering Functions**:
- `render(config)` - Render all documents, return array of results
- `render2(config)` - Render all documents, alternate result format
- `renderDocument(config, docInfo)` - Render single document
- `renderDocument2(config, docInfo)` - Render single document, alternate format
- `renderPath(config, path)` - Render document by virtual path

**Result Properties**:
- `renderFormat` - Format type: `'HTML'`, `'CSS'`, `'COPY'`
- Performance timestamps for each stage
- Elapsed times in milliseconds
- Error array for captured exceptions

## When To Use

Use the rendering pipeline:

1. **Full Site Builds**: Render entire project for deployment
   ```bash
   npx akasharender render config.mjs
   ```

2. **Development Builds**: Render during development
   ```bash
   npx akasharender render --copy-assets config.mjs
   ```

3. **Programmatic Rendering**: Invoke from custom scripts
   ```javascript
   import * as akasha from 'akasharender';
   const config = new akasha.Configuration();
   // ... configure ...
   await config.prepare();
   await akasha.setup(config);
   const results = await akasha.render(config);
   ```

5. **Performance Analysis**: Measure rendering performance
   ```javascript
   const results = await render(config);
   const avgTime = results.reduce((sum, r) => 
       sum + r.totalElapsed, 0) / results.length;
   console.log(`Average render time: ${avgTime}ms`);
   ```

6. **Selective Rendering**: Render specific documents
   ```javascript
   const result = await renderPath(config, 'blog/my-post.html.md');
   ```

## Risks & Pitfalls

**Concurrency Too High**: Setting `config.concurrency` too high causes resource exhaustion (source: [lib/render.ts](../../lib/render.ts)):
- Excessive memory usage
- CPU thrashing
- Slower overall performance
- Default of 3 is conservative but reliable
- Optimal value depends on hardware and document complexity

**Concurrency Too Low**: Setting concurrency to 1 serializes rendering:
- No parallelism benefits
- Slower builds on multi-core systems
- Underutilizes I/O during network operations

**Cache Not Ready**: Rendering before `setup()` completes causes errors (source: [lib/index.ts](../../lib/index.ts)):
```javascript
// WRONG: Cache not initialized
const config = new Configuration();
await render(config);  // FAILS

// CORRECT: Proper initialization
const config = new Configuration();
config.prepare();
await setup(config);
await render(config);  // SUCCESS
```

**Missing Error Handling**: Errors in individual documents don't stop the pipeline (source: [lib/render.ts](../../lib/render.ts)). Check `RenderingResults.errors[]` to detect failures:
```javascript
const results = await render(config);
const failed = results.filter(r => r.errors.length > 0);
if (failed.length > 0) {
    console.error(`${failed.length} documents failed to render`);
    failed.forEach(r => console.error(r.vpath, r.errors));
}
```

**Performance Bottlenecks**: Expensive operations in individual documents slow the entire pipeline:
- Complex Mahabhuta functions
- Heavy image processing
- External API calls
- Large document sizes

Profile using `RenderingResults` timestamps to identify slow documents.

**Memory Leaks with Large Sites**: Rendering thousands of documents accumulates memory:
- Cheerio DOM trees
- Cached query results
- Event listener accumulation

Consider batch rendering or process restarts for very large sites.

**Output Directory Conflicts**: Multiple documents rendering to the same output path cause race conditions:
```javascript
// Both render to out/index.html
documents/index.html.md
documents/index.html.ejs
```

Ensure unique output paths or use frontmatter to control destination.

**Asset Copying Race**: If `copyAssets()` runs concurrently with rendering, files may be read while being written. Run `copyAssets()` before or after rendering, not during.

**Lifecycle Hook Failures**: Exceptions in lifecycle hooks abort the pipeline (source: [lib/index.ts](../../lib/index.ts)):
```javascript
// If this throws, rendering stops
await config.hookBeforeSiteRendered();
```

Always handle errors in plugin lifecycle hooks.

## Sources

- [lib/render.ts](../../lib/render.ts) - Rendering pipeline implementation
- [lib/index.ts](../../lib/index.ts) - Setup and lifecycle hooks
- [lib/cli.mjs](../../lib/cli.mjs) - CLI integration

## Related Pages

- [Three-Stage Rendering](./three-stage-rendering.md) - Single document processing
- [Concurrent Rendering](./concurrent-rendering.md) - Parallel processing details
- [File Caching](./file-caching.md) - File discovery and metadata
- [Configuration Class](./configuration-class.md) - Pipeline configuration
- [Template Rendering](./template-rendering.md) - Stages 1 and 2

## Backlinks

- [wiki/summaries/lib/render.ts.md](../summaries/lib/render.ts.md)
- [wiki/concepts/three-stage-rendering.md](./three-stage-rendering.md)
