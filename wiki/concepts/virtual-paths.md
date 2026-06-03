---
title: "Virtual Paths"
type: concept
Sources:
  - lib/cache/vfstack.ts
  - lib/cache/cache-sqlite.ts
Categories:
  - filesystem
  - paths
  - conventions
date-created: 2026-05-21T06:45:00+03:00
last-updated: 2026-05-21T06:45:00+03:00
confidence: high
---

# Virtual Paths

## Definition

Virtual Paths are location-independent file identifiers within the [Virtual Filesystem](./virtual-filesystem.md) that abstract away physical directory structures, enabling portable file references without leading slashes that work regardless of where files are physically stored (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)). They provide a consistent addressing scheme across stacked directories, plugins, and themes.

## How It Works

### Virtual Path Format

Virtual paths in AkashaRender follow strict conventions (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

**Characteristics**:
- **No leading slash**: `blog/post.html.md` not `/blog/post.html.md`
- **Relative to virtual root**: Paths start from top of virtual filesystem
- **Forward slashes**: Always `/` even on Windows
- **Normalized**: No `./` or `../` components

**Examples**:
```
Valid Virtual Paths:
  blog/post.html.md
  images/photo.jpg
  index.html
  css/styles.css
  2024/12/article.html.md

Invalid Virtual Paths:
  /blog/post.html.md          ← Leading slash
  ./blog/post.html.md         ← Relative component
  ../images/photo.jpg         ← Parent reference
  blog\post.html.md           ← Backslash (Windows)
```

### Physical to Virtual Mapping

VFStack converts physical paths to virtual paths based on mount configuration (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

**Simple Mount (dest = '/')**:
```javascript
{
    src: '/project/documents',
    dest: '/'
}

Physical: /project/documents/blog/post.html.md
Virtual:  blog/post.html.md
```

**Custom Mount Point**:
```javascript
{
    src: '/archive/old-posts',
    dest: '/blog/archive'
}

Physical: /archive/old-posts/2020/article.html.md
Virtual:  blog/archive/2020/article.html.md
```

**Computation** (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):
```javascript
vpathForFSPath(fspath: string): VPathData | undefined {
    for (const dir of this.#dirs) {
        const dirsrc = dir.src.endsWith('/')
            ? dir.src
            : (dir.src + '/');
        
        if (fspath.indexOf(dirsrc) === 0) {
            // Extract path relative to mount source
            const pathInMounted = fspath.substring(dirsrc.length);
            
            // Combine with mount destination
            const vpath = dir.dest === '/'
                ? pathInMounted
                : path.join(dir.dest, pathInMounted);
            
            return { fspath, vpath, ... };
        }
    }
}
```

### Virtual Path Normalization

Methods normalize virtual paths by stripping leading slashes (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
find(vpath: string): VPathData | undefined {
    const normalizedVpath = vpath.startsWith('/')
        ? vpath.substring(1)
        : vpath;
    return this.#vpathMap.get(normalizedVpath);
}

has(vpath: string): boolean {
    const normalizedVpath = vpath.startsWith('/')
        ? vpath.substring(1)
        : vpath;
    return this.#vpathMap.has(normalizedVpath);
}
```

This allows both forms to work:
```javascript
vfs.find('blog/post.md');   // Works
vfs.find('/blog/post.md');  // Also works (slash stripped)
```

But stored VPathData never has leading slash:
```javascript
const vpathData = vfs.find('/blog/post.md');
vpathData.vpath === 'blog/post.md';  // true (no leading slash)
```

### Virtual Path Components

VPathData breaks down virtual paths into components (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```typescript
type VPathData = {
    vpath: string;          // Full virtual path: 'blog/post.html.md'
    mounted: string;        // Physical mount: '/project/documents'
    mountPoint: string;     // Virtual mount: '/'
    pathInMounted: string;  // Relative to mount: 'blog/post.html.md'
    fspath: string;         // Full physical: '/project/documents/blog/post.html.md'
};
```

**Example**:
```javascript
Mount: { src: '/project/docs', dest: '/guide' }
File: /project/docs/intro/getting-started.md

VPathData:
  vpath:          'guide/intro/getting-started.md'
  mounted:        '/project/docs'
  mountPoint:     '/guide'
  pathInMounted:  'intro/getting-started.md'
  fspath:         '/project/docs/intro/getting-started.md'
```

### Virtual Paths vs. Output Paths

Virtual paths determine **where content comes from**, not **where it renders to** (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):

```javascript
// Virtual path (input)
const vpathData = documentsCache.find('blog/post.html.md');

// Output path (determined by rendering)
// Default: blog/post.html (strips template extensions)
// Can be overridden via frontmatter or configuration
```

**Frontmatter Override**:
```yaml
---
renderPath: /articles/2024/my-post.html
---
```

Virtual path and render path are independent.

### Path Queries in Caches

File caches use virtual paths for lookups (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):

```javascript
// Find by virtual path
const doc = await documentsCache.find('blog/post.html.md');
const layout = await layoutsCache.find('page.html.ejs');
const partial = await partialsCache.find('header.html.ejs');

// All use virtual paths, not physical paths
```

**SQL Queries**:
```sql
SELECT * FROM documents WHERE vpath = ?;
-- vpath values never have leading slashes
```

### Virtual Path Patterns

Common virtual path patterns in AkashaRender:

**Date-Based Hierarchy**:
```
blog/2024/05/post.html.md
blog/2024/06/another.html.md
blog/2025/01/latest.html.md
```

**Category Organization**:
```
tutorials/javascript/intro.html.md
tutorials/nodejs/advanced.html.md
reference/api/functions.html.md
```

**Multi-Language**:
```
en/about.html.md
es/acerca-de.html.md
fr/a-propos.html.md
```

**Asset Types**:
```
images/logo.png
css/main.css
js/app.js
fonts/roboto.woff2
```

### Cross-Platform Compatibility

Virtual paths use forward slashes on all platforms (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
// Windows physical path
const fspath = 'C:\\project\\documents\\blog\\post.md';

// Virtual path (forward slashes)
const vpath = 'blog/post.md';

// Node.js path.join handles conversion
const vpathNormalized = path.join(dir.dest, pathInMounted);
// On Windows: converts backslashes to forward slashes for virtual paths
```

## Key Parameters

**Virtual Path Properties**:
- No leading slash
- Forward slashes only
- Relative to virtual root
- Case-sensitive (on Unix systems)
- Portable across platforms

**VPathData Fields**:
- `vpath` - Virtual path string
- `fspath` - Corresponding physical path
- `mounted` - Physical mount source
- `mountPoint` - Virtual mount destination
- `pathInMounted` - Path relative to mount

**Path Operations**:
- `vfs.find(vpath)` - Locate file by virtual path
- `vfs.has(vpath)` - Check if virtual path exists
- `vfs.vpathForFSPath(fspath)` - Convert physical to virtual

## When To Use

Use virtual paths:

1. **File Lookups**: Reference files in caches
   ```javascript
   const doc = await documentsCache.find('blog/post.html.md');
   ```

2. **Template References**: Include partials, specify layouts
   ```yaml
   layout: page.html.ejs
   ```
   ```html
   <partial file-name="header.html.ejs"></partial>
   ```

3. **Link Generation**: Create internal links
   ```javascript
   const href = `/${vpath.replace(/\.html\.md$/, '.html')}`;
   ```

4. **Database Queries**: Query documents by path patterns
   ```sql
   SELECT * FROM documents WHERE vpath LIKE 'blog/%';
   ```

5. **Programmatic File Access**: Iterate over documents
   ```javascript
   const allPosts = await documentsCache.search({
       vpathPattern: 'blog/2024/%'
   });
   ```

6. **Configuration**: Specify files in config
   ```javascript
   config.metadata.homePage = 'index.html';
   ```

## Risks & Pitfalls

**Leading Slash Inconsistency**: Mixing with/without leading slashes:
```javascript
// Methods accept both, but VPathData never has leading slash
const v1 = vfs.find('/blog/post.md');   // Works
const v2 = vfs.find('blog/post.md');    // Works

// But comparisons fail
'/blog/post.md' === v1.vpath;   // false
'blog/post.md' === v1.vpath;    // true
```

Always compare without leading slash.

**Physical Path Confusion**: Using physical paths where virtual expected:
```javascript
// WRONG: Physical path
const doc = await documentsCache.find('/project/documents/blog/post.md');
// Returns: undefined (not a virtual path)

// CORRECT: Virtual path
const doc = await documentsCache.find('blog/post.md');
```

**Windows Backslash Errors**: Using backslashes:
```javascript
// WRONG: Backslashes
const doc = await documentsCache.find('blog\\post.md');

// CORRECT: Forward slashes
const doc = await documentsCache.find('blog/post.md');
```

**Output Path Assumptions**: Assuming virtual path = output path:
```javascript
// Virtual path
const vpath = 'blog/post.html.md';

// Assumed output (may be wrong)
const output = vpath.replace(/\.md$/, '');
// 'blog/post.html' (might not match actual output)

// Actual output depends on frontmatter and configuration
```

Always use rendering system to determine output paths.

**Case Sensitivity**: Virtual paths are case-sensitive on case-sensitive filesystems:
```javascript
// On Linux/macOS
vfs.find('blog/Post.md') !== vfs.find('blog/post.md');

// On Windows (case-preserving but insensitive)
vfs.find('blog/Post.md') === vfs.find('blog/post.md');  // May work
```

Use consistent casing.

**Relative Path Components**: Including `./` or `../`:
```javascript
// INVALID: Relative components
'./blog/post.md'
'../images/photo.jpg'

// VALID: Absolute from virtual root
'blog/post.md'
'images/photo.jpg'
```

Virtual paths are always absolute within virtual filesystem.

**Mount Point Confusion**: Forgetting mount points affect virtual paths:
```javascript
config.addDocumentsDir({
    src: '/archive/old',
    dest: '/blog/archive'
});

// File: /archive/old/post.md
// Virtual: blog/archive/post.md (NOT post.md)
```

Mount `dest` prepends to virtual path.

**URL Conversion Errors**: Directly using virtual paths as URLs:
```javascript
// WRONG: Virtual path as URL
<a href="{{ vpath }}">Link</a>
// Produces: <a href="blog/post.html.md">Link</a>
// Not a valid URL (includes template extensions)

// CORRECT: Convert to render path
<a href="/{{ renderPath }}">Link</a>
// Produces: <a href="/blog/post.html">Link</a>
```

Virtual paths are internal identifiers, not web URLs.

**Special Characters**: Characters that need URL encoding:
```javascript
// Virtual path (literal space)
'blog/my post.html.md'

// URL (encoded)
'/blog/my%20post.html'
```

Virtual paths may contain characters invalid in URLs.

## Sources

- [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts) - Virtual path implementation
- [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts) - Cache queries using virtual paths

## Related Pages

- [Virtual Filesystem](./virtual-filesystem.md) - VFStack creates virtual paths
- [File Shadowing](./file-shadowing.md) - Virtual path uniqueness
- [File Caching](./file-caching.md) - Cache queries by virtual path
- [Stacked Directories](./stacked-directories.md) - Virtual path origins

## Backlinks

- [wiki/summaries/lib/cache/vfstack.ts.md](../summaries/lib/cache/vfstack.ts.md)
- [wiki/concepts/virtual-filesystem.md](./virtual-filesystem.md)
