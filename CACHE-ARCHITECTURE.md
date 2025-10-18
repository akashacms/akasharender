# AkashaRender Cache Architecture

## Overview

AkashaRender uses a caching system to efficiently manage file metadata and content information for static site generation. The cache architecture consists of two main components:

1. **VFStack** - Virtual file system for stacked directory management
2. **BaseCache & Subclasses** - SQLite-based metadata storage and querying

This document describes the architecture for developers who need to understand, maintain, or extend the caching system.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Configuration                         │
│  - documentDirs, assetDirs, layoutDirs, partialDirs    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Setup Phase
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Cache Setup (lib/cache/cache-sqlite.ts)│
│                                                          │
│  1. Initialize TagGlue & TagDescriptions                │
│  2. Create database tables                              │
│  3. Instantiate 4 cache instances                       │
│  4. Call setup() on each cache                          │
└─────────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        ▼            ▼            ▼            ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
   │ Assets  │ │Partials │ │ Layouts │ │Documents │
   │ Cache   │ │ Cache   │ │ Cache   │ │  Cache   │
   └────┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘
        │           │           │           │
        │           │           │           │
        └───────────┴───────────┴───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │      VFStack         │
          │  (Per Cache Type)    │
          │                      │
          │  1. Scan directories │
          │  2. Build file map   │
          │  3. Provide iterator │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   SQLite Database    │
          │  (In-Memory or File) │
          │                      │
          │  - File metadata     │
          │  - Render paths      │
          │  - Tags & metadata   │
          │  - Relationships     │
          └──────────────────────┘
```

## Core Components

### 1. VFStack (Virtual File Stack)

**Location:** `lib/cache/vfstack.ts`

**Purpose:** Manages stacked directory structures where files in later directories can override files in earlier directories.

#### Key Concepts

**Stacked Directories:**
```typescript
const dirs = [
    '/project/documents',           // Base directory
    '/project/override/documents',  // Override directory
];

// If both have 'index.html.md', the override version wins
```

**Virtual Paths:**
- Physical path: `/project/documents/blog/post.html.md`
- Virtual path: `blog/post.html.md` (relative to mount point)

**Mount Points:**
```typescript
{
    src: '/project/documents',  // Physical directory
    dest: '/',                  // Virtual mount point
    ignore: ['*.draft.md'],     // Files to ignore
    baseMetadata: {             // Metadata for all files
        layout: 'default.html'
    }
}
```

#### VFStack API

```typescript
class VFStack {
    constructor(name: string, dirs: (string | dirToMount)[]);
    
    // Scan directories and build file map
    async scan(): Promise<void>;
    
    // Query operations
    find(vpath: string): VPathData | undefined;
    findAll(): VPathData[];
    has(vpath: string): boolean;
    
    // Ignore pattern checking
    toIgnore(fspath: string): boolean;
    
    // Iteration
    [Symbol.iterator](): Iterator<VPathData>;
    entries(): IterableIterator<[string, VPathData]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<VPathData>;
    
    // Properties
    get name(): string;
    get dirs(): dirToMount[];
    get size(): number;
}
```

#### VPathData Type

```typescript
type VPathData = {
    fspath: string;         // Physical path: /project/documents/blog/post.html.md
    vpath: string;          // Virtual path: blog/post.html.md
    mime?: string;          // MIME type: text/x-markdown
    mounted: string;        // Mount source: /project/documents
    mountPoint: string;     // Mount destination: /
    pathInMounted: string;  // Relative path: blog/post.html.md
    statsMtime: number;     // Modification time (ms since epoch)
    stack?: VPathData[];    // Override stack (if applicable)
};
```

#### VFStack Operation

1. **Initialization:**
   ```typescript
   const vfstack = new VFStack('documents', config.documentDirs);
   ```

2. **Scanning:**
   ```typescript
   await vfstack.scan();
   // Walks all directories, builds Map<vpath, VPathData>
   // Later directories override earlier ones
   ```

3. **Querying:**
   ```typescript
   const file = vfstack.find('blog/post.html.md');
   if (file) {
       console.log(`Found at: ${file.fspath}`);
   }
   ```

4. **Iteration:**
   ```typescript
   for (const vpathData of vfstack) {
       console.log(`Processing: ${vpathData.vpath}`);
   }
   ```

### 2. BaseCache

**Location:** `lib/cache/cache-sqlite.ts`

**Purpose:** Abstract base class for all cache types. Manages SQLite database operations and file metadata.

#### Class Hierarchy

```
BaseCache<T extends BaseCacheEntry>
├── AssetsCache       (T = Asset)
├── PartialsCache     (T = Partial)
├── LayoutsCache      (T = Layout)
└── DocumentsCache    (T = Document)
```

#### BaseCache Responsibilities

1. **Database Management:**
   - SQLite connection and table access
   - Prepared SQL statement caching
   - Query execution and result validation

2. **Directory Scanning:**
   - Initialize VFStack with configured directories
   - Scan files during setup
   - Populate database with file metadata

3. **File Metadata:**
   - Store file paths, MIME types, modification times
   - Track mount points and virtual paths
   - Manage file relationships

4. **Query API:**
   - Find files by path
   - Search with filters
   - Get directory contents

#### BaseCache Lifecycle

```typescript
// 1. Construction
const cache = new DocumentsCache(
    config,
    'documents',
    config.documentDirs,
    db,
    'DOCUMENTS'
);

// 2. Setup - scans directories and populates database
await cache.setup();

// 3. Usage - query for files
const file = await cache.find('blog/post.html');

// 4. Cleanup
await cache.close();
```

#### BaseCache Key Methods

```typescript
abstract class BaseCache<T extends BaseCacheEntry> extends EventEmitter {
    // Setup and teardown
    async setup(): Promise<void>;
    async close(): Promise<void>;
    
    // Must be implemented by subclasses
    protected validateRow(row: any): T;
    protected validateRows(rows: any[]): T[];
    protected gatherInfoData(info: T): void;
    protected async insertDocToDB(info: T): Promise<void>;
    protected async updateDocInDB(info: T): Promise<void>;
    
    // Query methods
    async find(vpath: string): Promise<T | undefined>;
    async paths(rootPath?: string): Promise<PathsReturnType[]>;
    protected async findPathMounted(vpath: string, mounted: string): Promise<T[]>;
    
    // Utilities
    isReady(): Promise<boolean>;
    fileDirMount(info: VPathData): dirToMount | undefined;
    ignoreFile(info: VPathData): boolean;
}
```

### 3. Cache Subclasses

#### AssetsCache

**Purpose:** Manages static assets (images, CSS, JS, fonts, etc.)

**Database Table:** `ASSETS`

**Key Fields:**
- `vpath` - Virtual path
- `mime` - MIME type
- `mounted`, `mountPoint` - Mount information
- `fspath` - Physical file path
- `mtimeMs` - Modification time

**Example:**
```typescript
const image = await assetsCache.find('images/logo.png');
console.log(image.fspath); // /project/assets/images/logo.png
console.log(image.mime);   // image/png
```

#### PartialsCache

**Purpose:** Manages partial templates (reusable HTML snippets)

**Database Table:** `PARTIALS`

**Additional Fields:**
- `rendererName` - Template engine (ejs, njk, handlebars)
- `renderPath` - Output path after rendering

**Example:**
```typescript
const partial = await partialsCache.find('header.html.njk');
console.log(partial.rendererName); // nunjucks
```

#### LayoutsCache

**Purpose:** Manages layout templates (page wrappers)

**Database Table:** `LAYOUTS`

**Additional Fields:**
- `rendererName` - Template engine
- `rendersToHTML` - Whether it renders to HTML
- `docBody` - Template content

**Example:**
```typescript
const layout = await layoutsCache.find('default.html.ejs');
console.log(layout.rendersToHTML); // true
```

#### DocumentsCache

**Purpose:** Manages content documents (pages, posts, articles)

**Database Table:** `DOCUMENTS`

**Additional Fields:**
- `renderPath` - Final output path
- `rendersToHTML` - Whether it renders to HTML
- `docMetadata` - Frontmatter/metadata
- `docBody` - Content body
- `parentDir` - Parent directory
- `publicationTime` - Publication timestamp

**Special Features:**
- Tag support via TagGlue
- Metadata parsing from frontmatter
- Hierarchical navigation support

**Example:**
```typescript
const doc = await documentsCache.find('blog/post.html.md');
console.log(doc.docMetadata.title);    // "My Blog Post"
console.log(doc.docMetadata.tags);     // ["javascript", "tutorial"]
console.log(doc.renderPath);           // blog/post.html
```

## Setup Flow

### Detailed Setup Sequence

1. **Global Setup** (from `lib/index.ts`):
   ```typescript
   export async function setup(config) {
       await cacheSetup(config);
       await fileCachesReady(config);
   }
   ```

2. **Cache Setup** (in `lib/cache/cache-sqlite.ts`):
   ```typescript
   export async function setup(config: Configuration, db: AsyncDatabase) {
       // Initialize tag support (used by DocumentsCache)
       await tglue.init(db);
       await tdesc.init(db);
       
       // Create database tables
       await doCreateAssetsTable(db);
       await doCreatePartialsTable(db);
       await doCreateLayoutsTable(db);
       await doCreateDocumentsTable(db);
       await doCreateVecDocumentsTable(db);
       
       // Create and setup each cache
       assetsCache = new AssetsCache(config, 'assets', config.assetDirs, db, 'ASSETS');
       await assetsCache.setup();
       
       partialsCache = new PartialsCache(config, 'partials', config.partialsDirs, db, 'PARTIALS');
       await partialsCache.setup();
       
       layoutsCache = new LayoutsCache(config, 'layouts', config.layoutDirs, db, 'LAYOUTS');
       await layoutsCache.setup();
       
       documentsCache = new DocumentsCache(config, 'documents', config.documentDirs, db, 'DOCUMENTS');
       await documentsCache.setup();
       
       // Allow plugins to hook into cache setup
       await config.hookPluginCacheSetup();
   }
   ```

3. **Individual Cache Setup** (BaseCache.setup()):
   ```typescript
   async setup() {
       this.#is_ready = false;
       
       // Create VFStack for this cache's directories
       this.#vfstack = new VFStack(this.name, this.dirs);
       
       // Scan directories and build file map
       await this.#vfstack.scan();
       
       // Process each file
       for (const vpathData of this.#vfstack) {
           if (!this.ignoreFile(vpathData)) {
               try {
                   // Gather additional metadata (subclass-specific)
                   this.gatherInfoData(vpathData as any as T);
                   
                   // Insert into database
                   await this.insertDocToDB(vpathData as any as T);
               } catch (err) {
                   console.error(`Error gathering info for ${vpathData.vpath}: ${err.message}`);
               }
           }
       }
       
       this.#is_ready = true;
       this.emit('ready', this.name);
   }
   ```

### Setup Performance

For a typical site:
- **Small site** (< 100 files): ~100-200ms per cache
- **Medium site** (100-1000 files): ~500ms-2s per cache
- **Large site** (1000+ files): ~2-10s per cache

Total setup time is the sum of all four caches.

## Key Design Decisions

### 1. Synchronous Scanning (No File Watching)

**Decision:** VFStack uses synchronous directory scanning rather than watching for file changes.

**Rationale:**
- Simpler implementation
- More predictable behavior
- Easier to test
- Lower memory overhead
- File watching can be added externally (nodemon, chokidar, etc.)

**Trade-off:** Requires rebuild to pick up file changes during development.

### 2. In-Memory SQLite Database

**Decision:** Use in-memory SQLite database by default.

**Benefits:**
- Fast queries (no disk I/O)
- Automatic cleanup on process exit
- No file locking issues
- Ideal for build-time tool

**Note:** Database can be file-based for debugging or large sites.

### 3. Stacked Directory Override Model

**Decision:** Later directories in the stack override earlier directories.

**Use Case:**
```typescript
config.addDocumentsDir('node_modules/theme/documents');  // Base theme
config.addDocumentsDir('documents');                      // Project overrides
```

If both have `index.html.md`, the project version wins.

### 4. Single Source of Truth for Types

**Decision:** `dirToMount` type is defined once in `lib/cache/vfstack.ts` and re-exported.

**Benefits:**
- No duplicate type definitions
- Easier to maintain
- Consistent behavior across codebase

### 5. Lazy SQL Loading

**Decision:** SQL files are loaded from disk the first time they're needed, then cached.

**Benefits:**
- Faster startup (don't load unused queries)
- Memory efficient
- Easy to modify SQL without recompilation

**Future:** Can migrate to prepared statements for better performance.

## Query Patterns

### Finding a Single File

```typescript
// By virtual path
const doc = await documentsCache.find('blog/post.html.md');

// By physical path (less common)
const vpathData = vfstack.find('blog/post.html.md');
if (vpathData) {
    const doc = await documentsCache.find(vpathData.vpath);
}
```

### Finding All Files

```typescript
// Get all documents
const allDocs = await documentsCache.paths();

// With root path filter
const blogDocs = await documentsCache.paths('blog');
```

### Searching with Filters

```typescript
// Search for documents with specific criteria
const results = await documentsCache.search({
    tag: 'javascript',           // Documents with this tag
    layout: 'post.html.ejs',     // Using this layout
    rendersToHTML: true,         // That render to HTML
    rootPath: 'blog'             // Under this path
});
```

### Tag Operations (DocumentsCache only)

```typescript
// Find documents with tags
const tagged = await documentsCache.documentsWithTag(['javascript', 'tutorial']);

// Get all tags
const allTags = await documentsCache.getAllTags();

// Add tag description
await documentsCache.setTagDescription('javascript', 'JavaScript tutorials and tips');
```

### Directory Operations

```typescript
// Get index files for a directory
const indexes = await documentsCache.indexDocFiles('blog');

// Get child directories
const tree = await documentsCache.childItemTree('blog/index.html');
```

## Extending the Cache System

### Adding a New Cache Type

1. **Create the schema type:**
   ```typescript
   // In lib/cache/schema.ts
   export type MyCustom = BaseCacheEntry & {
       customField: string;
   };
   ```

2. **Create the cache class:**
   ```typescript
   // In lib/cache/cache-sqlite.ts
   export class MyCustomCache extends BaseCache<MyCustom> {
       protected validateRow(row: any): MyCustom {
           // Validate and return typed row
       }
       
       protected gatherInfoData(info: MyCustom): void {
           // Add custom metadata
       }
       
       protected async insertDocToDB(info: MyCustom): Promise<void> {
           // Insert into database
       }
   }
   ```

3. **Create the database table:**
   ```sql
   -- In lib/cache/sql/create-table-mycustom.sql
   CREATE TABLE IF NOT EXISTS MYCUSTOM (
       vpath STRING PRIMARY KEY,
       customField STRING
   );
   ```

4. **Add to setup:**
   ```typescript
   // In setup() function
   await doCreateMyCustomTable(db);
   myCustomCache = new MyCustomCache(config, 'mycustom', config.myCustomDirs, db, 'MYCUSTOM');
   await myCustomCache.setup();
   ```

### Adding Custom Queries

1. **Create SQL file:**
   ```sql
   -- lib/cache/sql/my-query.sql
   SELECT * FROM DOCUMENTS
   WHERE customCondition = $value;
   ```

2. **Add method to cache class:**
   ```typescript
   #myQuerySQL: string;
   
   async myCustomQuery(value: string): Promise<Document[]> {
       if (!this.#myQuerySQL) {
           this.#myQuerySQL = await fsp.readFile(
               path.join(import.meta.dirname, 'sql', 'my-query.sql'),
               'utf-8'
           );
       }
       
       const results = await this.db.all(this.#myQuerySQL, { $value: value });
       return this.validateRows(results);
   }
   ```

### Customizing VFStack Behavior

VFStack can be extended for custom directory scanning:

```typescript
class CustomVFStack extends VFStack {
    // Override to add custom file processing
    async scan(): Promise<void> {
        await super.scan();
        // Add custom post-processing
    }
    
    // Override to customize ignore logic
    toIgnore(fspath: string): boolean {
        if (super.toIgnore(fspath)) return true;
        // Add custom ignore rules
        return false;
    }
}
```

## Debugging

### Enabling SQL Logging

```typescript
import { AsyncDatabase } from 'promised-sqlite3';
import sqlite3 from 'sqlite3';

// Verbose mode
const db = new AsyncDatabase(
    new sqlite3.Database(':memory:', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE)
);
db.inner.on('trace', (sql) => {
    console.log('SQL:', sql);
});
```

### Inspecting Cache Contents

```typescript
// List all cached files
const allFiles = await documentsCache.paths();
console.log(`Cached ${allFiles.length} documents`);

for (const file of allFiles) {
    console.log(`${file.vpath} -> ${file.renderPath}`);
}
```

### Checking VFStack State

```typescript
const vfstack = cache.#vfstack; // Access via debugging

console.log(`VFStack has ${vfstack.size} files`);
console.log(`Directories:`, vfstack.dirs);

// Iterate all files
for (const [vpath, data] of vfstack.entries()) {
    console.log(`${vpath}: ${data.fspath}`);
}
```

### Common Issues

**Issue: File not found in cache**
```typescript
// Check if file exists in VFStack
const inStack = vfstack.has('path/to/file.md');
console.log(`In VFStack: ${inStack}`);

// Check if file is ignored
const vpathData = vfstack.find('path/to/file.md');
if (vpathData) {
    const ignored = cache.ignoreFile(vpathData);
    console.log(`Ignored: ${ignored}`);
}

// Check database
const inDB = await cache.find('path/to/file.md');
console.log(`In database: ${!!inDB}`);
```

**Issue: Wrong file being used (override problem)**
```typescript
// Check the stack to see which file wins
const vpathData = vfstack.find('path/to/file.md');
console.log(`Using file from: ${vpathData.mounted}`);

if (vpathData.stack) {
    console.log('Overridden files:');
    for (const override of vpathData.stack) {
        console.log(`  - ${override.fspath}`);
    }
}
```

## Performance Considerations

### Memory Usage

- **VFStack:** ~1-2KB per file (metadata only, not content)
- **SQLite:** ~2-5KB per file (depends on metadata size)
- **Total:** ~3-7KB per file

For a 1000-file site: ~3-7 MB memory usage.

### Query Performance

- **find() by vpath:** O(log n) - SQLite index lookup
- **paths():** O(n) - Full table scan
- **search() with filters:** O(n) - Depends on indexes

### Optimization Tips

1. **Use specific queries over full scans:**
   ```typescript
   // Good - targeted query
   const doc = await documentsCache.find('blog/post.html');
   
   // Bad - full scan + filter
   const all = await documentsCache.paths();
   const doc = all.find(d => d.vpath === 'blog/post.html');
   ```

2. **Cache query results when iterating:**
   ```typescript
   // Good - query once
   const allDocs = await documentsCache.paths();
   for (const doc of allDocs) {
       // Process doc
   }
   
   // Bad - query repeatedly
   for (const vpath of vpaths) {
       const doc = await documentsCache.find(vpath);
   }
   ```

3. **Use VFStack for simple existence checks:**
   ```typescript
   // Good - in-memory check
   const exists = vfstack.has('path/to/file.md');
   
   // Unnecessary - database query
   const doc = await cache.find('path/to/file.md');
   const exists = !!doc;
   ```

## Testing

### Unit Testing Caches

```typescript
import { AsyncDatabase } from 'promised-sqlite3';
import sqlite3 from 'sqlite3';
import { DocumentsCache } from '../lib/cache/cache-sqlite.js';

describe('DocumentsCache', () => {
    let db, cache, config;
    
    before(async () => {
        db = new AsyncDatabase(new sqlite3.Database(':memory:'));
        await doCreateDocumentsTable(db);
        
        config = new Configuration();
        config.addDocumentsDir('test/documents');
        
        cache = new DocumentsCache(config, 'documents', config.documentDirs, db, 'DOCUMENTS');
        await cache.setup();
    });
    
    after(async () => {
        await cache.close();
    });
    
    it('should find a document by vpath', async () => {
        const doc = await cache.find('index.html.md');
        assert.isDefined(doc);
        assert.equal(doc.vpath, 'index.html.md');
    });
});
```

### Integration Testing

```typescript
describe('Full cache system', () => {
    it('should setup all caches', async () => {
        await setup(config, db);
        
        assert.isDefined(assetsCache);
        assert.isDefined(partialsCache);
        assert.isDefined(layoutsCache);
        assert.isDefined(documentsCache);
        
        await Promise.all([
            assetsCache.isReady(),
            partialsCache.isReady(),
            layoutsCache.isReady(),
            documentsCache.isReady()
        ]);
    });
});
```

## Migration from Old Architecture

### What Changed

**Before (stacked-dirs):**
- Event-based file watching with DirsWatcher
- Async event queue with fastq
- Event handlers: handleAdded, handleChanged, handleUnlinked
- External dependency: @akashacms/stacked-dirs

**After (VFStack):**
- Synchronous directory scanning
- No file watching, no event queue
- Direct database population during setup
- Internal implementation: lib/cache/vfstack.ts

### API Compatibility

The public API remains unchanged:
- `await cache.find(vpath)` - Still works
- `await cache.paths()` - Still works
- `await cache.search(options)` - Still works

Plugins and external code continue to work without changes.

### Migration Benefits

1. **Simpler code:** ~250 lines removed from BaseCache
2. **Faster startup:** No event system overhead
3. **More predictable:** Synchronous scanning is easier to reason about
4. **Easier testing:** No async event coordination needed
5. **No external dependencies:** VFStack is internal

## References

### Key Files

- `lib/cache/vfstack.ts` - VFStack implementation
- `lib/cache/cache-sqlite.ts` - BaseCache and all cache subclasses
- `lib/cache/schema.ts` - Type definitions for cache entries
- `lib/cache/tag-glue.ts` - Tag support for documents
- `lib/cache/sql/*.sql` - SQL query definitions
- `lib/index.ts` - Main entry point and cache setup

### Documentation

- `guide/vfstack.html.md` - VFStack developer guide
- `VFSTACK-INTEGRATION-STATUS.md` - Integration completion status
- `PREPARED-STATEMENTS-PLAN.md` - Future optimization plan

### Related Concepts

- **Stacked Directories:** Allow theme/plugin files to be overridden
- **Virtual File System:** Maps physical paths to virtual paths
- **Mount Points:** Where directories are "mounted" in virtual space
- **Metadata Gathering:** Extracting frontmatter and file information
- **Tag Support:** Categorizing documents with tags

## Conclusion

The AkashaRender cache system provides efficient file metadata management through:

1. **VFStack** - Fast, in-memory virtual file system with stacked directory support
2. **BaseCache** - SQLite-backed queryable metadata storage
3. **Specialized caches** - Type-specific handling for assets, partials, layouts, and documents
4. **Simple synchronous model** - Predictable setup and operation

This architecture balances performance, simplicity, and functionality for static site generation at scale.
