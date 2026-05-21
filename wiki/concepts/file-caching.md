---
title: "File Caching"
type: concept
Sources:
  - lib/cache/cache-sqlite.ts
  - lib/cache/vfstack.ts
  - lib/index.ts
Categories:
  - cache
  - performance
  - file-management
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# File Caching

## Definition

File Caching is AkashaRender's system for indexing and tracking information about files in stacked directories using an SQLite database (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)). Rather than repeatedly scanning the filesystem during rendering, the file cache stores metadata, paths, and frontmatter in memory-backed SQLite tables, enabling fast queries for file lookups, tag searches, and document relationships.

## How It Works

The file caching system operates through specialized cache classes that wrap SQLite database operations and emit events for file changes (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)).

### Architecture

Four cache instances handle different file types:

1. **DocumentsCache**: Renderable content files (Markdown, AsciiDoc, etc.)
2. **AssetsCache**: Static files copied without processing (images, fonts, etc.)
3. **LayoutsCache**: Page layout templates
4. **PartialsCache**: Reusable template fragments

All extend the **BaseCache** abstract class which provides common functionality (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)).

### Initialization Workflow

The file cache initializes during the `setup()` call (source: [lib/index.ts](../../lib/index.ts)):

```javascript
export async function setup(config) {
    await cacheSetup(config);      // Initialize SQLite database
    await fileCachesReady(config); // Wait for scanning to complete
}

export async function cacheSetup(config) {
    await filecache.setup(config, await sqdb);
}

export async function fileCachesReady(config) {
    await Promise.all([
        filecache.documentsCache.isReady(),
        filecache.assetsCache.isReady(),
        filecache.layoutsCache.isReady(),
        filecache.partialsCache.isReady()
    ]);
}
```

During `setup()`, each cache:
1. Receives its directory stack from Configuration
2. Creates a VFStack instance to scan directories
3. Populates SQLite tables with file information
4. Emits `'added'` events for each file discovered
5. Emits `'ready'` event when scanning completes

### Directory Scanning with VFStack

The caches use [VFStack](./virtual-filesystem.md) to scan [Stacked Directories](./stacked-directories.md) (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)). VFStack:
- Recursively walks each mounted directory
- Applies ignore patterns (globs) to exclude files
- Detects MIME types from file extensions
- Handles file shadowing (later mounts override earlier ones)
- Returns `VPathData` objects with file metadata

### Data Storage

File information is stored in SQLite tables (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):

**VPathData fields**:
- `vpath` - Virtual path without leading slash
- `fspath` - Full physical filesystem path
- `mime` - MIME type determined from extension
- `mounted` - Which directory mount contains this file
- `mountPoint` - Virtual mount location
- `pathInMounted` - Path relative to mount point
- `statsMtime` - Modification timestamp

**Document-specific fields** (DocumentsCache only):
- Frontmatter metadata (title, layout, tags, etc.)
- Rendered path (what the document renders to)
- Layout template used
- Document tags for categorization

### Query Operations

The BaseCache class provides standard query methods (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):

- `find(vpath)` - Locate a single file by virtual path
- `paths()` - Return all virtual paths in the cache
- `search(options)` - Complex queries with filters
- `isReady()` - Promise that resolves when cache is initialized

**DocumentsCache additions** (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):
- `tags()` - List all unique tags across documents
- `documentsWithTag(tag)` - Find all documents with a specific tag
- `findSimilarTags(tag, threshold)` - Fuzzy tag matching using Levenshtein distance
- `documentsForLayout(layout)` - Documents using a specific layout
- `indexChain(vpath)` - Find index.html files up the directory tree
- `siblings(vpath)` - Documents in the same directory
- `semanticSearchDocs(query)` - Vector-based semantic search

### Query Result Caching

To avoid redundant database queries, the cache implements a second layer of caching using the `cache` library (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):

```javascript
// Results cached for config.cachingTimeout milliseconds (default: 60000)
const cachedTags = cache(async () => {
    // SQL query to fetch tags
}, config.cachingTimeout);
```

Frequently repeated queries (like listing all tags or finding documents by tag) are cached in memory with a configurable timeout (default: 1 minute) (source: [lib/index.ts](../../lib/index.ts)).

### Event-Driven Updates

All cache classes extend EventEmitter and emit events for file lifecycle (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):

- `'added'` - File discovered during initial scan
- `'ready'` - Initial scan completed
- `'error'` - Error during scanning

Plugins and rendering code can listen to these events to respond to file changes.

### SQL Statement Management

Database operations use SQL statements loaded from external `.sql` files (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):

```javascript
// SQL files stored in lib/cache/sql/
const createTableSQL = await fs.readFile('lib/cache/sql/create-table.sql', 'utf8');
```

This separates SQL logic from JavaScript code and enables:
- Easier SQL maintenance and review
- Parameter binding for security (preventing SQL injection)
- Dynamic table name substitution using `SqlString.format()`

## Key Parameters

**Configuration Options** (via Configuration class):
- `documentDirs` - Array of directories to scan for documents
- `assetsDirs` - Array of directories to scan for assets
- `layoutDirs` - Array of directories to scan for layouts
- `partialDirs` - Array of directories to scan for partials
- `cachingTimeout` - Query cache timeout in milliseconds (default: 60000)
- `cacheDir` - Location of SQLite database file (default: `cache/`)

**VFStack Mount Options** (`dirToMount` structure):
- `src` - Physical directory path to mount
- `dest` - Virtual path to mount at
- `ignore` - Glob patterns for files to exclude
- `baseMetadata` - Metadata applied to all files in mount

**Query Options** (for `search()` method):
- Path patterns for filtering
- Tag filters (DocumentsCache only)
- Layout filters (DocumentsCache only)
- MIME type filters

## When To Use

Use the file caching system:

1. **During Initialization**: Call `setup()` to populate caches before rendering (source: [lib/index.ts](../../lib/index.ts))

2. **File Lookups**: Use `cache.find(vpath)` instead of filesystem operations to locate files:
   ```javascript
   const doc = await filecache.documentsCache.find('blog/my-post.html.md');
   ```

3. **Directory Listings**: Query all files or filter by attributes:
   ```javascript
   const allDocs = await filecache.documentsCache.paths();
   ```

4. **Tag Queries**: Find documents by taxonomy tags (DocumentsCache):
   ```javascript
   const tagged = await filecache.documentsCache.documentsWithTag('javascript');
   ```

5. **Rendering Partials**: Partial rendering automatically uses partialsCache (source: [lib/index.ts](../../lib/index.ts)):
   ```javascript
   const html = await partial(config, 'header.html.ejs', metadata);
   ```

6. **Navigation Building**: Query document relationships for menus, breadcrumbs:
   ```javascript
   const chain = await filecache.documentsCache.indexChain('blog/2025/post.html');
   ```

7. **File Watching**: Listen to cache events for hot reload during development

## Risks & Pitfalls

**Initialization Race Conditions**: Rendering before `fileCachesReady()` completes can result in "file not found" errors (source: [lib/index.ts](../../lib/index.ts)). The `renderPath()` function includes retry logic (up to 20 attempts with 100ms delays) to handle files added late in the scanning process, but proper initialization order is critical.

**Stale Cache Data**: The in-memory SQLite database reflects the filesystem state at initialization time. File changes made externally after `setup()` won't be reflected unless:
- File watching is enabled (triggers `'add'`, `'change'`, `'unlink'` events)
- Caches are manually refreshed
- The process is restarted

**Query Cache Timeout**: The `cachingTimeout` setting creates a trade-off (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):
- **Too short**: Excessive database queries, reduced performance
- **Too long**: Stale query results during development with frequent changes
- Default of 60 seconds works for production but may need adjustment for development

**Memory Usage**: An in-memory SQLite database holds all file metadata (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)). Projects with thousands of files may consume significant memory. The database stays in memory for the lifetime of the process.

**Ignore Pattern Complexity**: Glob patterns in `ignore` arrays are processed for every file (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)). Complex patterns or many ignore rules slow down directory scanning.

**Tag Similarity Performance**: The `findSimilarTags()` method uses Levenshtein distance computation (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)), which is O(n*m) for each comparison. With hundreds of unique tags, fuzzy matching can become slow.

**Event Listener Leaks**: Cache objects are singletons that persist across rendering operations (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)). Adding event listeners without removing them causes memory leaks in long-running processes.

**Virtual Path Assumptions**: Virtual paths in the cache never have leading slashes (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)). Code expecting paths with leading slashes must normalize before queries.

## Sources

- [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts) - Cache class implementations
- [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts) - Directory scanning and virtual filesystem
- [lib/index.ts](../../lib/index.ts) - Cache setup and initialization

## Related Pages

- [SQLite Database](./sqlite-database.md) - Database used by file caches
- [Stacked Directories](./stacked-directories.md) - Directory layering concept
- [Virtual Filesystem](./virtual-filesystem.md) - VFStack implementation
- [Configuration Class](./configuration-class.md) - Provides cache settings
- [Event-Driven Architecture](./event-driven-architecture.md) - Cache event system

## Backlinks

- [wiki/summaries/lib/cache/cache-sqlite.ts.md](../summaries/lib/cache/cache-sqlite.ts.md)
- [wiki/summaries/lib/cache/vfstack.ts.md](../summaries/lib/cache/vfstack.ts.md)
- [wiki/summaries/lib/index.ts.md](../summaries/lib/index.ts.md)
