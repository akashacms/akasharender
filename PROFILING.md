# AkashaCMS Performance Profiling Guide

This guide provides comprehensive strategies for profiling and optimizing AkashaCMS performance, particularly focusing on the file cache system and SQL query performance.

## Performance Regression Analysis

Based on the analysis of the rewritten `search` function in `lib/cache/file-cache-sqlite.ts`, here are the likely causes of the 3-5 minute performance regression:

### 1. **Complex SQL Query Generation**
The new `buildSearchQuery` method (lines 2386-2561) generates complex SQL with multiple JOINs, WHERE clauses, and parameter binding. This adds overhead compared to the simpler ORM approach.

### 2. **Post-SQL Processing Overhead**
The search function now does significant post-processing:
- `gatherInfoData()` is called for every result (line 2340)
- Multiple filter passes (renderers, custom filters)
- Additional sorting operations

### 3. **Potential N+1 Query Problems**
The `gatherInfoData` method may be making additional database calls or file system operations for each document.

## Profiling Tools and Techniques

### 1. Enable Built-in Profiling

Add this to your build script:

```bash
# Enable profiling
export AKASHA_PROFILE=true

# Method 1: Basic CPU profiling
time node --prof your-build-script.js
node --prof-process isolate-*.log > cpu-profile.txt

# Method 2: Chrome DevTools profiling
node --inspect your-build-script.js
# Then open chrome://inspect in Chrome

# Method 3: Clinic.js (install first: npm install -g clinic)
clinic doctor -- node your-build-script.js
clinic flame -- node your-build-script.js
```

### 2. Use the Performance Utils

```typescript
import { profiler, sqlProfiler } from './lib/performance-utils.js';

// Enable profiling
profiler.enable();
sqlProfiler.enable();

// Your build code here...

// Generate reports
console.log(profiler.getReport());
console.log(sqlProfiler.getReport());
```

### 3. Memory Profiling

```bash
# Monitor memory usage during build
node --max-old-space-size=4096 --expose-gc your-build-script.js

# Or use clinic.js for detailed analysis
npm install -g clinic
clinic doctor -- node your-build-script.js
```

## Specific Performance Bottlenecks to Investigate

### 1. **Search Function Performance**

The rewritten search function has several potential bottlenecks:

```typescript
// In DocumentsFileCache.search() - lines 2326-2381
// These operations happen for EVERY search result:

for (const item of documents) {
    this.gatherInfoData(item);  // Potentially expensive!
}
```

**Investigation Steps:**
1. Profile `gatherInfoData()` - it reads files from disk
2. Check if `findRendererPath()` is being called repeatedly
3. Measure SQL query execution time vs. result processing time

### 2. **File System Operations**

The `gatherInfoData` method (lines 1551-1733) performs file system operations:

```typescript
// Line 1600 in gatherInfoData
content: FS.readFileSync(info.fspath, 'utf-8')
```

**Optimization Opportunities:**
- Cache file contents
- Use async file operations
- Batch file reads

### 3. **Database Query Patterns**

Look for these patterns that could cause performance issues:

```sql
-- Complex JOINs (line 2450)
INNER JOIN TAGGLUE tg ON d.vpath = tg.docvpath

-- Multiple OR conditions (lines 2507-2508)
(d.vpath regexp $param1 OR d.vpath regexp $param2)

-- JSON extraction in ORDER BY (lines 2527-2530)
ORDER BY COALESCE(json_extract(d.metadata, '$.publicationDate'), d.mtimeMs)
```

## Performance Optimization Strategies

### 1. **Immediate Fixes**

#### A. Optimize gatherInfoData
```typescript
// Cache file contents to avoid repeated reads
private fileContentCache = new Map<string, string>();

gatherInfoData(info) {
    // Only read file if not cached or if mtime changed
    const cacheKey = `${info.fspath}:${info.mtimeMs}`;
    if (!this.fileContentCache.has(cacheKey)) {
        const content = FS.readFileSync(info.fspath, 'utf-8');
        this.fileContentCache.set(cacheKey, content);
    }
    // ... rest of method
}
```

#### B. Batch Database Operations
```typescript
// Instead of individual queries, use batch operations
async searchBatch(queries: SearchQuery[]): Promise<Document[][]> {
    // Execute multiple searches in a single transaction
}
```

#### C. Lazy Loading
```typescript
// Don't call gatherInfoData for all results immediately
// Only call it when the data is actually needed
```

### 2. **Database Optimizations**

#### A. Add Missing Indexes
```sql
-- Add indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_docs_metadata_json ON DOCUMENTS(json_extract(metadata, '$.publicationDate'));
CREATE INDEX IF NOT EXISTS idx_docs_render_path_pattern ON DOCUMENTS(renderPath);
```

#### B. Query Optimization
```typescript
// Simplify complex queries by breaking them into steps
// Use EXPLAIN QUERY PLAN to analyze query performance
async analyzeQuery(sql: string, params: any) {
    const plan = await this.dao.sqldb.all(`EXPLAIN QUERY PLAN ${sql}`, params);
    console.log('Query plan:', plan);
}
```

### 3. **Caching Strategies**

#### A. Result Caching
```typescript
private searchCache = new Map<string, { results: Document[], timestamp: number }>();

async search(options: any): Promise<Document[]> {
    const cacheKey = JSON.stringify(options);
    const cached = this.searchCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.results;
    }
    
    const results = await this.performSearch(options);
    this.searchCache.set(cacheKey, { results, timestamp: Date.now() });
    return results;
}
```

#### B. Metadata Caching
```typescript
// Cache parsed metadata to avoid repeated file parsing
private metadataCache = new Map<string, any>();
```

### 4. **Parallel Processing**

```typescript
// Process documents in parallel where possible
async processDocuments(documents: Document[]): Promise<void> {
    const chunks = this.chunkArray(documents, 10); // Process 10 at a time
    
    for (const chunk of chunks) {
        await Promise.all(chunk.map(doc => this.processDocument(doc)));
    }
}
```

## Measurement and Monitoring

### 1. **Add Performance Metrics to Your Build**

```typescript
import { profiler, getMemoryUsage, formatMemoryUsage } from './lib/performance-utils.js';

async function profiledBuild() {
    profiler.enable();
    
    console.log('Starting build...');
    console.log('Initial memory:', formatMemoryUsage(getMemoryUsage()));
    
    const startTime = Date.now();
    
    // Your build process
    await config.render();
    
    const endTime = Date.now();
    console.log(`Build completed in ${endTime - startTime}ms`);
    console.log('Final memory:', formatMemoryUsage(getMemoryUsage()));
    console.log(profiler.getReport());
}
```

### 2. **Continuous Performance Monitoring**

```bash
# Add to your CI/CD pipeline
echo "Performance baseline: 10-11 minutes"
time npm run build 2>&1 | tee build-performance.log

# Alert if build time exceeds threshold
BUILD_TIME=$(grep "real" build-performance.log | awk '{print $2}')
# Parse and compare with threshold
```

## Recommended Investigation Order

1. **Enable profiling** and run a build to get baseline metrics
2. **Profile the search function** specifically - it's likely the main culprit
3. **Analyze gatherInfoData** - file I/O is often a bottleneck
4. **Check database query performance** - use EXPLAIN QUERY PLAN
5. **Look for N+1 query patterns** - multiple small queries vs. fewer large ones
6. **Measure memory usage** - ensure no memory leaks during build

## Quick Performance Testing

I've created several scripts to help you profile AkashaCMS:

### 1. Basic Performance Test
```bash
# Test search performance specifically
node test-search-performance.mjs config.mjs
```

### 2. Full Build Profiling
```bash
# Basic profiling with memory tracking
node profile-akasha.mjs config.mjs

# Node.js CPU profiling
node profile-akasha.mjs config.mjs --method=prof

# Chrome DevTools profiling
node profile-akasha.mjs config.mjs --method=inspector

# Clinic.js profiling (install first: npm install -g clinic)
node profile-akasha.mjs config.mjs --method=clinic
```

### 3. Manual Node.js Profiling
```bash
# Generate CPU profile
time node --prof lib/cli.js render config.mjs

# Process the profile
node --prof-process isolate-*.log > cpu-profile.txt

# View the profile
less cpu-profile.txt
```

This comprehensive approach should help you identify and fix the performance regression in your AkashaCMS build process.