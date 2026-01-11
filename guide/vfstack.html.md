---
layout: article.html.ejs
title: VFStack - Virtual Filesystem Stack
---

VFStack is a lightweight virtual filesystem implementation for managing stacked directories in AkashaRender. It provides a simple, efficient way to overlay multiple directories, allowing files in higher-priority directories to override files in lower-priority ones.

# Overview

VFStack replaces the complex `@akashacms/stacked-dirs` package with a simpler, more maintainable implementation. It focuses on the core stacked directory functionality without the complexity of file watching and event emission.

## Key Features

- **Simple API**: Straightforward methods for scanning and querying files
- **Override Support**: First-match-wins principle for file resolution
- **Ignore Patterns**: Support for glob patterns to exclude files/directories
- **Iterator Protocol**: Full support for JavaScript iteration
- **No External Dependencies**: Uses only Node.js built-ins and micromatch
- **Fast Scanning**: Efficient directory walking with early termination for ignored paths

# Concepts

## Stacked Directories

A stacked directory is a collection of physical directories combined into a single virtual filesystem. Each directory in the stack contributes files, with higher-priority directories (earlier in the list) overriding lower-priority ones.

### Example

Given these directories:

| Directory | Priority | Files Present |
|-----------|----------|---------------|
| `/project/partials` | 1 (highest) | header.html, footer.html |
| `/theme/partials` | 2 | header.html, sidebar.html |
| `/plugin/partials` | 3 (lowest) | header.html, footer.html, sidebar.html |

The virtual filesystem will contain:
- `header.html` → from `/project/partials` (priority 1)
- `footer.html` → from `/project/partials` (priority 1)
- `sidebar.html` → from `/theme/partials` (priority 2)

## Mount Points

Each directory can be mounted at a specific location in the virtual filesystem:

```javascript
const stack = new VFStack('documents', [
    {
        mounted: '/home/user/project/docs',
        mountPoint: '/'
    },
    {
        mounted: '/usr/share/app/docs',
        mountPoint: '/reference'
    }
]);
```

This creates a virtual filesystem where:
- Files in `/home/user/project/docs` appear at the root (`/`)
- Files in `/usr/share/app/docs` appear under `/reference`

## VPathData

Each file in the virtual filesystem is represented by a `VPathData` object:

```typescript
{
    fspath: '/home/user/project/docs/index.html.md',  // Physical path
    vpath: 'index.html.md',                            // Virtual path
    mime: 'text/markdown',                             // MIME type
    mounted: '/home/user/project/docs',                // Mount source
    mountPoint: '/',                                   // Mount destination
    pathInMounted: 'index.html.md',                    // Relative path
    statsMtime: 1634567890000                          // Modification time
}
```

# API Reference

## Constructor

```typescript
new VFStack(name: string, dirs: DirStackItem[])
```

Creates a new VFStack instance.

**Parameters:**
- `name`: A descriptive name for this stack (used in logging)
- `dirs`: Array of directory stack items to mount

**Example:**
```javascript
import { VFStack } from 'akasharender/cache/vfstack.js';

const stack = new VFStack('documents', [
    {
        mounted: './documents',
        mountPoint: '/',
        ignore: ['**/*.tmp', '**/node_modules/**']
    },
    {
        mounted: './theme/documents',
        mountPoint: '/',
        baseMetadata: { theme: 'default' }
    }
]);
```

## Properties

### `name` (getter)

Returns the name of this VFStack instance.

```javascript
console.log(stack.name);  // 'documents'
```

### `dirs` (getter)

Returns the array of directory stack items.

```javascript
for (const dir of stack.dirs) {
    console.log(dir.mounted, '->', dir.mountPoint);
}
```

### `size` (getter)

Returns the number of files in the virtual filesystem.

```javascript
console.log(`Found ${stack.size} files`);
```

## Methods

### `async scan(): Promise<void>`

Scans all directories in the stack and builds the virtual filesystem index.

**Must be called before using any query methods.**

```javascript
await stack.scan();
console.log(`Scanned ${stack.size} files`);
```

### `find(vpath: string): VPathData | undefined`

Finds a specific file by its virtual path.

**Parameters:**
- `vpath`: Virtual path to search for (with or without leading slash)

**Returns:** `VPathData` object if found, `undefined` otherwise

```javascript
const file = stack.find('index.html.md');
if (file) {
    console.log('Physical path:', file.fspath);
    console.log('Mounted from:', file.mounted);
}
```

### `findAll(): VPathData[]`

Returns all files in the virtual filesystem as an array.

```javascript
const allFiles = stack.findAll();
for (const file of allFiles) {
    console.log(file.vpath, '->', file.fspath);
}
```

### `has(vpath: string): boolean`

Tests whether a virtual path exists in the filesystem.

```javascript
if (stack.has('config.json')) {
    console.log('Config file found');
}
```

### `toIgnore(fspath: string): boolean`

Determines if a file path should be ignored based on ignore patterns.

**Parameters:**
- `fspath`: Physical filesystem path to test

```javascript
if (!stack.toIgnore('/path/to/file.txt')) {
    // Process the file
}
```

### `vpathForFSPath(fspath: string, statsMtime?: number): VPathData | undefined`

Converts a physical filesystem path to virtual path data.

**Parameters:**
- `fspath`: Physical filesystem path
- `statsMtime`: Optional modification time (if already known)

```javascript
const vpathData = stack.vpathForFSPath('/home/user/project/docs/index.html.md');
console.log(vpathData.vpath);  // 'index.html.md'
```

## Iterator Protocol

VFStack implements the JavaScript iterator protocol, enabling use with `for...of` loops and other iteration patterns.

### `[Symbol.iterator](): Iterator<VPathData>`

Enables `for...of` iteration over all files.

```javascript
for (const file of stack) {
    console.log(file.vpath);
}
```

### `entries(): IterableIterator<[string, VPathData]>`

Returns an iterator of `[vpath, VPathData]` pairs.

```javascript
for (const [vpath, data] of stack.entries()) {
    console.log(`${vpath} -> ${data.fspath}`);
}
```

### `keys(): IterableIterator<string>`

Returns an iterator of virtual paths.

```javascript
const vpaths = Array.from(stack.keys());
console.log('All virtual paths:', vpaths);
```

### `values(): IterableIterator<VPathData>`

Returns an iterator of VPathData objects.

```javascript
for (const data of stack.values()) {
    console.log(data.fspath);
}
```

# Types

## `DirStackItem`

Describes one entry in the directory stack.

```typescript
type DirStackItem = {
    // Physical filesystem path to mount
    mounted: string;
    
    // Virtual path where this directory appears
    mountPoint: string;
    
    // Optional metadata for files in this directory
    baseMetadata?: any;
    
    // Optional glob patterns for files to ignore
    ignore?: string | string[];
}
```

**Example:**
```javascript
{
    mounted: '/home/user/project/documents',
    mountPoint: '/',
    baseMetadata: { author: 'John Doe' },
    ignore: ['**/*.draft.md', '**/tmp/**']
}
```

## `VPathData`

Describes one file in the virtual filesystem.

```typescript
type VPathData = {
    // Full physical filesystem path
    fspath: string;
    
    // Virtual path (no leading slash)
    vpath: string;
    
    // MIME type determined from file extension
    mime?: string;
    
    // Physical path that was mounted
    mounted: string;
    
    // Virtual directory where mounted
    mountPoint: string;
    
    // Relative path under the mount point
    pathInMounted: string;
    
    // File modification time in milliseconds
    statsMtime: number;
    
    // Stack of all VPathData for this vpath (used for debugging)
    stack?: VPathData[];
}
```

# Usage Examples

## Basic File Scanning

```javascript
import { VFStack } from 'akasharender/cache/vfstack.js';

const stack = new VFStack('assets', [
    { mounted: './assets', mountPoint: '/' }
]);

await stack.scan();

console.log(`Found ${stack.size} asset files`);

// Find a specific file
const logo = stack.find('images/logo.png');
if (logo) {
    console.log('Logo found at:', logo.fspath);
}
```

## Multiple Directories with Overrides

```javascript
const stack = new VFStack('layouts', [
    // Project layouts (highest priority)
    { mounted: './layouts', mountPoint: '/' },
    
    // Theme layouts (medium priority)
    { mounted: './node_modules/my-theme/layouts', mountPoint: '/' },
    
    // Default layouts (lowest priority)
    { mounted: './node_modules/akasharender/layouts', mountPoint: '/' }
]);

await stack.scan();

// Will use project version if it exists, otherwise theme, then default
const layout = stack.find('article.html.ejs');
```

## Using Mount Points

```javascript
const stack = new VFStack('documentation', [
    // Main docs at root
    { mounted: './docs', mountPoint: '/' },
    
    // API docs under /api
    { mounted: './api-docs', mountPoint: '/api' },
    
    // Guides under /guides
    { mounted: './guides', mountPoint: '/guides' }
]);

await stack.scan();

// Files appear in their mounted locations
const apiDoc = stack.find('api/reference.html');
const guide = stack.find('guides/getting-started.html');
```

## Ignore Patterns

```javascript
const stack = new VFStack('source', [
    {
        mounted: './src',
        mountPoint: '/',
        ignore: [
            '**/*.tmp',
            '**/*.backup',
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**'
        ]
    }
]);

await stack.scan();

// Ignored files won't appear in results
console.log(`Found ${stack.size} source files (excluding ignored patterns)`);
```

## Iterating Over Files

```javascript
const stack = new VFStack('content', [
    { mounted: './content', mountPoint: '/' }
]);

await stack.scan();

// Using for...of
for (const file of stack) {
    if (file.vpath.endsWith('.md')) {
        console.log('Markdown file:', file.vpath);
    }
}

// Using entries()
for (const [vpath, data] of stack.entries()) {
    console.log(`${vpath} (${data.mime})`);
}

// Convert to array for filtering
const htmlFiles = Array.from(stack)
    .filter(f => f.vpath.endsWith('.html'));

console.log(`Found ${htmlFiles.length} HTML files`);
```

## Metadata and Base Metadata

```javascript
const stack = new VFStack('articles', [
    {
        mounted: './blog/posts',
        mountPoint: '/blog',
        baseMetadata: { 
            layout: 'post.html',
            author: 'John Doe',
            section: 'blog'
        }
    },
    {
        mounted: './docs',
        mountPoint: '/docs',
        baseMetadata: { 
            layout: 'documentation.html',
            section: 'docs'
        }
    }
]);

await stack.scan();

// Base metadata is available in the VPathData
for (const file of stack) {
    // Access via the dir's baseMetadata
    const dir = stack.dirs.find(d => d.mounted === file.mounted);
    if (dir?.baseMetadata) {
        console.log(`${file.vpath}: ${dir.baseMetadata.section}`);
    }
}
```

## Error Handling

```javascript
const stack = new VFStack('content', [
    { mounted: './content', mountPoint: '/' },
    { mounted: './missing-dir', mountPoint: '/extra' }
]);

try {
    await stack.scan();
    // Warning logged for missing directory, but scan continues
    console.log(`Successfully scanned ${stack.size} files`);
} catch (err) {
    console.error('Scan failed:', err);
}
```

# Performance Considerations

## Early Termination

VFStack checks ignore patterns during directory traversal, which means:
- Ignored directories are not recursed into
- Ignored files are not processed
- Reduces memory usage and scan time

```javascript
// Good: Large node_modules directory is never scanned
{
    mounted: './project',
    mountPoint: '/',
    ignore: ['**/node_modules/**']
}
```

## Caching

The scan results are cached in memory. Call `scan()` again to refresh:

```javascript
await stack.scan();  // Initial scan

// ... files might have changed ...

await stack.scan();  // Rescan to pick up changes
```

## Memory Usage

VFStack stores all file information in memory. For very large projects:
- Consider using ignore patterns to exclude unnecessary files
- Each `VPathData` object is ~200-300 bytes
- A project with 10,000 files uses ~2-3 MB of memory

# Migration from @akashacms/stacked-dirs

VFStack is designed as a drop-in replacement for the core functionality of `@akashacms/stacked-dirs`:

## Key Differences

1. **No File Watching**: VFStack does not watch for file changes. Use `nodemon` or similar tools for rebuild triggering.

2. **No EventEmitter**: VFStack does not emit events. It's synchronous after the initial `scan()`.

3. **Simpler API**: Focused on core directory stacking without extra complexity.

## API Mapping

| @akashacms/stacked-dirs | VFStack |
|------------------------|---------|
| `DirsWatcher.watch()` | `VFStack.scan()` |
| `DirsWatcher.on('add')` | Not available (use scan) |
| `DirsWatcher.on('change')` | Not available (use scan) |
| `dirToWatch` | `DirStackItem` (similar) |
| `VPathData` | `VPathData` (compatible) |

## Example Migration

**Before:**
```javascript
import { DirsWatcher } from '@akashacms/stacked-dirs';

const watcher = new DirsWatcher('documents');
watcher.on('ready', () => {
    console.log('Scan complete');
});
await watcher.watch([
    { mounted: './docs', mountPoint: '/' }
]);
```

**After:**
```javascript
import { VFStack } from 'akasharender/cache/vfstack.js';

const stack = new VFStack('documents', [
    { mounted: './docs', mountPoint: '/' }
]);
await stack.scan();
console.log('Scan complete');
```

# Troubleshooting

## "Directory does not exist" Warning

If you see a warning about a missing directory:

```
VFStack: Directory does not exist: /path/to/dir
```

This is just a warning. The scan continues with remaining directories. Check that the path is correct.

## Files Not Found

If `find()` returns `undefined`:

1. Ensure `scan()` was called first
2. Check the virtual path doesn't have a leading slash (use `index.html` not `/index.html`)
3. Verify the file isn't being ignored by an ignore pattern
4. Use `findAll()` to see all available files

## Ignore Patterns Not Working

If files aren't being ignored:

1. Patterns are matched against the **physical** path, not virtual path
2. Use `**/` prefix for recursive matching: `**/node_modules/**`
3. Test with `toIgnore(fspath)` to debug
4. Remember patterns are cumulative (all directories' patterns apply)

## Performance Issues

If scanning is slow:

1. Add ignore patterns for large directories (node_modules, .git, etc.)
2. Check for symlink loops
3. Consider splitting into multiple smaller stacks
4. Profile with `console.time('scan')` / `console.timeEnd('scan')`
