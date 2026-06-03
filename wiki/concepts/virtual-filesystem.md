---
title: "Virtual Filesystem"
type: concept
Sources:
  - lib/cache/vfstack.ts
  - lib/cache/cache-sqlite.ts
Categories:
  - filesystem
  - virtualization
  - architecture
date-created: 2026-05-21T06:35:00+03:00
last-updated: 2026-05-21T06:35:00+03:00
confidence: high
---

# Virtual Filesystem

## Definition

A Virtual Filesystem is a unified file hierarchy created by combining multiple physical directory trees into a single logical namespace, enabling file overriding, plugin extensibility, and theme customization without modifying original files (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)). AkashaRender implements this through the VFStack class, which scans physical directories and presents them as a virtual file structure where later mounts can shadow earlier ones.

## How It Works

### The VFStack Class

VFStack (Virtual Filesystem Stack) creates a unified filesystem from multiple directories (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
import { VFStack } from './cache/vfstack.js';

// Create a virtual filesystem stack
const vfs = new VFStack('documents', [
    '/project/documents',              // Base directory
    '/project/override/documents',     // Override directory
    'node_modules/theme/documents'     // Plugin directory
]);

// Scan physical directories
await vfs.scan();

// Find file in virtual space
const file = vfs.find('blog/post.html.md');
// Returns: VPathData with fspath, vpath, mime, etc.
```

### Directory Mounting

Directories are mounted using the `dirToMount` structure (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

**Simple String Form**:
```javascript
'/path/to/directory'  // Mounts at virtual root /
```

**Object Form** (with options):
```typescript
{
    src: '/physical/path',       // Physical directory to mount
    dest: '/virtual/path',        // Virtual mount point
    ignore: ['*.tmp', '*.bak'],  // Glob patterns to exclude
    baseMetadata: {              // Metadata for all files
        section: 'blog'
    }
}
```

### Virtual Path Resolution

VFStack converts between physical and virtual paths (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

**Physical to Virtual**:
```javascript
// Physical: /home/user/project/documents/blog/post.html.md
// Mount: { src: '/home/user/project/documents', dest: '/' }
// Virtual: blog/post.html.md

const vpathData = vfs.vpathForFSPath('/home/user/project/documents/blog/post.html.md');
console.log(vpathData.vpath);  // 'blog/post.html.md'
```

**Virtual to Physical**:
```javascript
const vpathData = vfs.find('blog/post.html.md');
console.log(vpathData.fspath);  // '/home/user/project/documents/blog/post.html.md'
```

### Directory Scanning

VFStack recursively scans all mounted directories (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
async scan(): Promise<void> {
    this.#vpathMap.clear();
    
    for (const dir of this.#dirs) {
        // Walk directory tree
        const files = await this.#walkDirectory(dir.src);
        
        for (const fspath of files) {
            // Convert to VPathData
            const vpathData = this.vpathForFSPath(fspath);
            
            // Add to virtual filesystem map
            if (!this.#vpathMap.has(vpathData.vpath)) {
                this.#vpathMap.set(vpathData.vpath, vpathData);
            }
        }
    }
}
```

The scan:
1. Clears existing virtual path map
2. Walks each mounted directory recursively
3. Converts physical paths to virtual paths
4. Stores first occurrence (later mounts shadow earlier)

### VPathData Structure

Each file is represented by VPathData (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```typescript
type VPathData = {
    fspath: string;         // Full physical path
                            // e.g., /home/user/project/documents/blog/post.html.md
    
    vpath: string;          // Virtual path (no leading slash)
                            // e.g., blog/post.html.md
    
    mime?: string;          // MIME type from file extension
                            // e.g., text/x-markdown
    
    mounted: string;        // Physical mount source
                            // e.g., /home/user/project/documents
    
    mountPoint: string;     // Virtual mount destination
                            // e.g., /
    
    pathInMounted: string;  // Relative path within mount
                            // e.g., blog/post.html.md
    
    statsMtime: number;     // Modification timestamp (ms)
    
    stack?: VPathData[];    // All matching files across mounts
};
```

### File Ignore Patterns

Directories can specify glob patterns to exclude files (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
{
    src: '/project/documents',
    dest: '/',
    ignore: [
        '**/*.tmp',           // All .tmp files
        '**/*.bak',           // All .bak files
        '**/node_modules/**', // node_modules directories
        '**/.git/**',         // .git directories
        '**/draft-*.md'       // Draft files
    ]
}
```

Uses `micromatch` library for glob matching.

### Virtual Paths (No Leading Slash)

Virtual paths in VFStack never have leading slashes (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
// CORRECT
'blog/post.html.md'
'images/photo.jpg'
'index.html'

// INCORRECT
'/blog/post.html.md'  // Leading slash
'/images/photo.jpg'
'/index.html'
```

Methods normalize input by stripping leading slashes:

```javascript
find(vpath: string): VPathData | undefined {
    const normalizedVpath = vpath.startsWith('/')
        ? vpath.substring(1)
        : vpath;
    return this.#vpathMap.get(normalizedVpath);
}
```

### Integration with File Caching

The file caching system uses VFStack for directory scanning (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):

```javascript
class DocumentsCache extends BaseCache {
    async setup(config, dirs) {
        // Create VFStack for documents
        this.vfs = new VFStack('documents', dirs);
        
        // Scan directories
        await this.vfs.scan();
        
        // Store files in SQLite
        for (const vpathData of this.vfs.findAll()) {
            await this.addFile(vpathData);
        }
    }
}
```

Four separate VFStack instances:
- `documentsCache.vfs` - Document files
- `assetsCache.vfs` - Asset files
- `layoutsCache.vfs` - Layout templates
- `partialsCache.vfs` - Partial templates

### Iterator Protocol

VFStack implements JavaScript iteration (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
// Iterate over all files
for (const vpathData of vfs) {
    console.log(vpathData.vpath, vpathData.fspath);
}

// Or using findAll()
const allFiles = vfs.findAll();
```

## Key Parameters

**VFStack Constructor**:
- `name` - Descriptive name (e.g., 'documents', 'assets')
- `dirs` - Array of directories to mount (string or dirToMount objects)

**dirToMount Options**:
- `src` - Physical directory path (required)
- `dest` - Virtual mount point (default: '/')
- `ignore` - Glob patterns to exclude files (optional)
- `baseMetadata` - Metadata applied to all files (optional)

**VFStack Methods**:
- `scan()` - Scan directories and populate virtual filesystem
- `find(vpath)` - Locate file by virtual path
- `findAll()` - Return all VPathData objects
- `has(vpath)` - Check if virtual path exists
- `vpathForFSPath(fspath)` - Convert physical to virtual path
- `toIgnore(fspath)` - Check if file should be ignored
- `size` - Number of files in virtual filesystem

**VPathData Fields**:
- `fspath`, `vpath`, `mime` - File identifiers
- `mounted`, `mountPoint`, `pathInMounted` - Mount information
- `statsMtime` - Modification timestamp
- `stack` - File shadow information

## When To Use

Use virtual filesystems:

1. **Theme Overriding**: Override plugin or theme files
   ```javascript
   config.addDocumentsDir('node_modules/theme/documents');
   config.addDocumentsDir('custom-overrides/documents');
   // custom-overrides shadows theme files
   ```

2. **Plugin Extensibility**: Plugins provide default files
   ```javascript
   class MyPlugin extends Plugin {
       configure(config) {
           config.addLayoutsDir(__dirname + '/layouts');
           config.addPartialsDir(__dirname + '/partials');
       }
   }
   ```

3. **Multi-Source Content**: Combine content from multiple locations
   ```javascript
   config.addDocumentsDir('main-content');
   config.addDocumentsDir('blog-content');
   config.addDocumentsDir('archive-content');
   ```

4. **Section-Specific Metadata**: Apply metadata by directory
   ```javascript
   config.addDocumentsDir({
       src: 'blog',
       dest: '/blog',
       baseMetadata: { section: 'blog', layout: 'blog.html.ejs' }
   });
   ```

5. **Virtual Path Remapping**: Mount directories at different virtual locations
   ```javascript
   config.addDocumentsDir({
       src: 'archive/old-posts',
       dest: '/blog/archive'  // Appears at /blog/archive in output
   });
   ```

6. **Selective Inclusion**: Ignore unnecessary files
   ```javascript
   config.addDocumentsDir({
       src: 'all-content',
       dest: '/',
       ignore: ['**/*.draft.md', '**/_*']
   });
   ```

## Risks & Pitfalls

**Mount Order Matters**: Later mounts override earlier ones (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):
```javascript
// WRONG: Override won't work
config.addDocumentsDir('custom-overrides');
config.addDocumentsDir('node_modules/theme');
// theme files take precedence

// CORRECT: Override works
config.addDocumentsDir('node_modules/theme');
config.addDocumentsDir('custom-overrides');
// custom-overrides shadows theme
```

**Leading Slash Confusion**: Virtual paths don't have leading slashes (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):
```javascript
// Methods normalize, but be aware
vfs.find('/blog/post.md');   // Works (slash stripped)
vfs.find('blog/post.md');     // Also works (no slash)

// But VPathData.vpath never has leading slash
vpathData.vpath === 'blog/post.md';  // true
vpathData.vpath === '/blog/post.md'; // false
```

**Ignore Pattern Complexity**: Complex globs slow scanning (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):
```javascript
// SLOW: Many complex patterns
ignore: [
    '**/*.(tmp|bak|old|backup)',
    '**/node_modules/**/!(package.json)',
    '**/{.git,.svn,.hg}/**'
]

// FASTER: Simpler patterns
ignore: [
    '**/*.tmp',
    '**/node_modules/**',
    '**/.git/**'
]
```

**Missing Directory Errors**: Non-existent directories cause warnings (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):
```javascript
// Directory doesn't exist
config.addDocumentsDir('/nonexistent/path');

// During scan(): 
// Warning: "VFStack: Directory does not exist: /nonexistent/path"
// Scanning continues with other directories
```

**Modification Time Caching**: VFStack caches mtime during scan (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):
```javascript
await vfs.scan();  // Caches mtimes
// File changes externally
// vfs.find() still returns old mtime
// Need to re-scan to detect changes
```

**Virtual Path Collisions**: Same vpath from multiple mounts, first wins (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):
```javascript
// mount1/blog/post.md (scanned first)
// mount2/blog/post.md (ignored - collision)

// Only mount1 version visible
const file = vfs.find('blog/post.md');
// Returns mount1 version
```

This is intentional for shadowing but can surprise if unaware.

**Dest Path Confusion**: `dest` controls virtual location, not output path:
```javascript
config.addDocumentsDir({
    src: 'content',
    dest: '/blog'  // Virtual path, not output directory
});

// File: content/post.md
// Virtual path: blog/post.md
// Output path: out/blog/post.html (determined by rendering)
```

**BaseMetadata Scope**: Metadata applies to all files in mount (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):
```javascript
config.addDocumentsDir({
    src: 'all-content',
    baseMetadata: { layout: 'default.html.ejs' }
});

// ALL files get this metadata
// Cannot exclude specific files
// Use frontmatter to override per-file
```

**Iterator Modification**: Don't modify VFStack during iteration:
```javascript
// WRONG: Modifying during iteration
for (const vpathData of vfs) {
    await vfs.scan();  // Re-scanning during iteration!
}

// CORRECT: Iterate over snapshot
const files = vfs.findAll();
for (const vpathData of files) {
    // Now safe to re-scan if needed
}
```

**Memory Usage with Large Filesystems**: VFStack holds all VPathData in memory (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):
```javascript
// 10,000 files × ~500 bytes per VPathData = ~5MB
// Acceptable for most projects
// May be significant for very large sites (100,000+ files)
```

## Sources

- [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts) - VFStack implementation
- [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts) - VFStack integration

## Related Pages

- [Stacked Directories](./stacked-directories.md) - High-level stacking concept
- [File Shadowing](./file-shadowing.md) - File override mechanism
- [Virtual Paths](./virtual-paths.md) - Virtual path conventions
- [MIME Type Detection](./mime-type-detection.md) - MIME type handling
- [File Caching](./file-caching.md) - Cache system using VFStack

## Backlinks

- [wiki/summaries/lib/cache/vfstack.ts.md](../summaries/lib/cache/vfstack.ts.md)
- [wiki/concepts/stacked-directories.md](./stacked-directories.md)
