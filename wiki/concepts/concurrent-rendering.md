---
title: "Concurrent Rendering"
type: concept
Sources:
  - lib/render.ts
  - lib/index.ts
  - lib/cache/watchman.ts
Categories:
  - performance
  - rendering
  - parallelism
date-created: 2026-05-21T06:25:00+03:00
last-updated: 2026-05-21T06:25:00+03:00
confidence: high
---

# Concurrent Rendering

## Definition

Concurrent Rendering is the technique of processing multiple documents simultaneously using promise-based queues to maximize throughput and minimize total build time (source: [lib/render.ts](../../lib/render.ts)). AkashaRender uses the `fastq` library to manage a configurable number of parallel rendering workers, balancing CPU utilization and memory consumption.

## How It Works

### The fastq Library

AkashaRender uses `fastq` for promise-based concurrent queue processing (source: [lib/render.ts](../../lib/render.ts)):

```javascript
import fastq from 'fastq';

const queue = fastq.promise(
    async (task) => {
        // Worker function: renders one document
        return await renderDocument(task.config, task.docInfo);
    },
    config.concurrency  // Number of concurrent workers
);

// Queue all documents
const results = await Promise.all(
    documents.map(doc => queue.push({ config, doc }))
);
```

Benefits of `fastq`:
- Promise-based async/await API
- Configurable concurrency limit
- FIFO queue ordering
- Automatic worker pooling
- Error handling per task

### Concurrency Configuration

The number of concurrent workers is controlled by `config.concurrency` (source: [lib/index.ts](../../lib/index.ts)):

```javascript
class Configuration {
    #concurrency: number;
    
    constructor() {
        this.#concurrency = 3;  // Default: 3 concurrent workers
    }
}
```

**Setting concurrency**:
```javascript
const config = new Configuration();
config.concurrency = 5;  // 5 parallel renders
```

### Site-Wide Rendering Concurrency

During full site rendering, documents are queued and processed in parallel (source: [lib/render.ts](../../lib/render.ts)):

```javascript
export async function render(config) {
    const documents = filecache.documentsCache;
    const paths = await documents.paths();
    
    // Create queue with concurrency limit
    const queue = fastq.promise(
        renderWorker,
        config.concurrency
    );
    
    // Queue all documents
    const promises = paths.map(vpath => 
        queue.push({ config, vpath })
    );
    
    // Wait for all to complete
    const results = await Promise.all(promises);
    return results;
}
```

Execution flow:
1. Get list of all document paths
2. Create fastq queue with concurrency limit
3. Push all documents to queue
4. Workers process documents in parallel
5. Collect results as promises resolve

### Worker Function

Each worker processes a single document through the full [Rendering Pipeline](./rendering-pipeline.md) (source: [lib/render.ts](../../lib/render.ts)):

```javascript
async function renderWorker(task) {
    const { config, vpath } = task;
    
    // Find document in cache
    const docInfo = await documentsCache.find(vpath);
    
    // Render through three stages
    const result = await renderDocument(config, docInfo);
    
    return result;  // Returns RenderingResults
}
```

Each worker independently:
- Queries the file cache
- Renders content (Stage 1)
- Applies layout (Stage 2)
- Runs Mahabhuta (Stage 3)
- Writes output file
- Returns performance metrics

### Performance Benefits

Concurrent rendering provides significant speedups for multi-core systems (source: [lib/render.ts](../../lib/render.ts)):

**Sequential (concurrency = 1)**:
```
Document 1: ████████ (800ms)
Document 2:         ████████ (800ms)
Document 3:                 ████████ (800ms)
Total: 2400ms
```

**Concurrent (concurrency = 3)**:
```
Document 1: ████████ (800ms)
Document 2: ████████ (800ms)
Document 3: ████████ (800ms)
Total: 800ms
```

Real-world speedup depends on:
- Number of CPU cores
- Document complexity
- I/O wait time
- Memory available

### Memory Implications

Each concurrent worker consumes memory (source: [lib/render.ts](../../lib/render.ts)):

**Per-worker memory usage**:
- Document content in memory
- Cheerio DOM tree
- Template engine state
- Renderer intermediate results
- Output buffer

**Total memory** = Base + (Workers × Per-worker)

Higher concurrency = faster builds but more memory usage.

### Resource Contention

Concurrent workers compete for resources (source: [lib/render.ts](../../lib/render.ts)):

**SQLite Database**:
- All workers query same database
- Read queries don't block
- Write operations serialized
- [SQLite Database](./sqlite-database.md) uses WAL mode for better concurrency

**File System**:
- Reads parallelized (fast)
- Writes to different files (no contention)
- Writes to same file (undefined behavior - avoid)

**CPU**:
- Template rendering (CPU-bound)
- Mahabhuta processing (CPU-bound)
- Optimal workers ≈ CPU cores

**I/O**:
- File reads
- File writes
- Network (if fetching external resources)

## Key Parameters

**Configuration Settings**:
- `config.concurrency` - Number of concurrent workers (default: 3)
- Higher values = faster builds, more memory
- Lower values = slower builds, less memory

**Queue Configuration** (from fastq):
- Worker function - Async function processing one task
- Concurrency - Maximum simultaneous workers
- Error handling - Per-task vs. queue-level

**Concurrency Values by Context**:
- Full site render: `config.concurrency` (default: 3)
- Layout change re-render: 10 (hardcoded in watchman)
- Development: Lower values (1-3) for easier debugging
- Production builds: Higher values (4-8+) for speed

## When To Use

**Increase concurrency when**:

1. **Multi-Core Systems**: Systems with 4+ CPU cores benefit from higher concurrency
   ```javascript
   const numCPUs = require('os').cpus().length;
   config.concurrency = Math.max(numCPUs - 1, 1);
   ```

2. **I/O-Bound Rendering**: Documents fetch external resources
   - Network API calls
   - Image processing
   - File reads from slow storage

3. **Production Builds**: Optimize build time for CI/CD
   ```javascript
   config.concurrency = 8;  // Aggressive parallelism
   ```

4. **Large Sites**: Hundreds or thousands of documents
   - More documents = more benefit from parallelism
   - Amortizes startup overhead

**Decrease concurrency when**:

1. **Memory Constrained**: Limited RAM available
   ```javascript
   config.concurrency = 1;  // Minimal memory footprint
   ```

2. **CPU-Bound Rendering**: Complex Mahabhuta operations
   - Heavy DOM manipulation
   - Many plugins
   - Each document takes seconds

3. **Debugging**: Easier to trace errors sequentially
   ```javascript
   config.concurrency = 1;  // Sequential for debugging
   ```

4. **Resource Limits**: External API rate limits
   - Avoid overwhelming external services
   - Prevent throttling

5. **Single-Core Systems**: No parallelism benefit
   ```javascript
   config.concurrency = 1;  // Single core
   ```

## Risks & Pitfalls

**Excessive Concurrency**: Setting concurrency too high causes problems (source: [lib/render.ts](../../lib/render.ts)):

**Memory Exhaustion**:
```javascript
config.concurrency = 100;  // TOO HIGH
// Each worker loads full DOM
// 100 × 10MB per document = 1GB RAM
```

**CPU Thrashing**:
- More workers than CPU cores
- Context switching overhead
- Slower than lower concurrency

**Diminishing Returns**:
```
Concurrency 1: 60s
Concurrency 2: 35s (1.7× speedup)
Concurrency 4: 20s (3× speedup)
Concurrency 8: 18s (3.3× speedup)  ← diminishing returns
Concurrency 16: 17s (3.5× speedup) ← minimal gain
```

**Too Little Concurrency**: Single-threaded rendering underutilizes resources (source: [lib/index.ts](../../lib/index.ts)):
```javascript
config.concurrency = 1;
// On 8-core system: 7 cores idle
// Build takes 8× longer than necessary
```

**Non-Deterministic Errors**: Concurrent execution makes debugging harder:
- Errors from multiple documents intermixed
- Race conditions harder to reproduce
- Stack traces less clear

**File Write Collisions**: Multiple documents rendering to same output path:
```javascript
// documents/index.html.md → out/index.html
// documents/index.html.ejs → out/index.html
// RACE CONDITION: Which writes last?
```

Ensure unique output paths or use frontmatter to control destination.

**Database Lock Contention**: SQLite write operations serialize (source: [lib/render.ts](../../lib/render.ts)):
- Rendering is mostly read operations (fast)
- Cache updates are write operations (serialized)
- WAL mode mitigates but doesn't eliminate

**Event Listener Leaks**: Concurrent workers may add event listeners:
```javascript
// BAD: Each worker adds listener
queue.push(async (doc) => {
    cache.on('change', handler);  // Leak!
    await render(doc);
});

// GOOD: Add listeners once
cache.on('change', handler);
queue.push(async (doc) => {
    await render(doc);
});
```

**Inconsistent State During Watch**: File changes while concurrent renders execute:
- Document A references document B
- Document B changes mid-render
- Document A may see old or new state

Watch mode handles this with cache invalidation.

**Progress Reporting**: Concurrent execution complicates progress tracking:
```javascript
// Sequential: Easy to report progress
for (let i = 0; i < docs.length; i++) {
    await render(docs[i]);
    console.log(`${i+1}/${docs.length}`);
}

// Concurrent: Need completion counter
let completed = 0;
await Promise.all(docs.map(async doc => {
    await render(doc);
    console.log(`${++completed}/${docs.length}`);
}));
```

**External Resource Rate Limiting**: Concurrent API requests may exceed rate limits:
```javascript
// 10 concurrent workers all fetching from API
// May hit rate limit (e.g., 5 req/sec)
config.concurrency = 10;  // Too aggressive

// Solution: Lower concurrency or implement rate limiting
config.concurrency = 3;
```

## Sources

- [lib/render.ts](../../lib/render.ts) - Concurrent rendering implementation
- [lib/index.ts](../../lib/index.ts) - Concurrency configuration
- [lib/cache/watchman.ts](../../lib/cache/watchman.ts) - Watch mode re-rendering

## Related Pages

- [Rendering Pipeline](./rendering-pipeline.md) - Overall rendering workflow
- [Configuration Class](./configuration-class.md) - Concurrency configuration
- [File Caching](./file-caching.md) - Shared resource accessed by workers
- [SQLite Database](./sqlite-database.md) - Database concurrency with WAL mode
- [Performance Measurement Methodology](./performance-measurement-methodology.md) - How to verify whether concurrency is actually overlapping work

## Backlinks

- [wiki/summaries/lib/render.ts.md](../summaries/lib/render.ts.md)
- [wiki/concepts/rendering-pipeline.md](./rendering-pipeline.md)
- [Performance Measurement Methodology](./performance-measurement-methodology.md)
