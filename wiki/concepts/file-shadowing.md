---
title: "File Shadowing"
type: concept
Sources:
  - lib/cache/vfstack.ts
  - wiki/concepts/stacked-directories.md
Categories:
  - filesystem
  - overriding
  - customization
date-created: 2026-05-21T06:40:00+03:00
last-updated: 2026-05-21T06:40:00+03:00
confidence: high
---

# File Shadowing

## Definition

File Shadowing is the mechanism where files in later-mounted directories override files at the same virtual path in earlier-mounted directories, enabling theme customization, plugin template overriding, and content layering without modifying original files (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)). When multiple directories contain files with identical virtual paths, only the file from the last mount is visible in the [Virtual Filesystem](./virtual-filesystem.md).

## How It Works

### Shadowing Mechanism

VFStack scans directories in mount order and keeps only the first occurrence of each virtual path (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
async #scanDirectory(dir: dirToMount): Promise<void> {
    const files = await this.#walkDirectory(dir.src);
    
    for (const fspath of files) {
        const vpathData = this.vpathForFSPath(fspath);
        
        // Only add if vpath not already in map
        if (!this.#vpathMap.has(vpathData.vpath)) {
            this.#vpathMap.set(vpathData.vpath, vpathData);
        }
        // If vpath exists, this file is shadowed (ignored)
    }
}
```

**Key Principle**: First occurrence wins in the virtual filesystem map, but directories are processed in mount order, so later mounts process first.

### Mount Order and Precedence

Directories are processed in the order they're added to Configuration (source: [wiki/concepts/stacked-directories.md](../stacked-directories.md)):

```javascript
const config = new Configuration();

// Mount order determines precedence
config.addLayoutsDir('node_modules/plugin-a/layouts');  // Precedence: 3 (lowest)
config.addLayoutsDir('node_modules/plugin-b/layouts');  // Precedence: 2
config.addLayoutsDir('custom-overrides/layouts');       // Precedence: 1 (highest)
```

**File Resolution**:
```
custom-overrides/layouts/page.html.ejs  ← Used (highest precedence)
plugin-b/layouts/page.html.ejs          ← Shadowed
plugin-a/layouts/page.html.ejs          ← Shadowed
```

When rendering `page.html.ejs`, only `custom-overrides/layouts/page.html.ejs` is visible.

### Shadowing Example

**Setup**:
```javascript
config.addPartialsDir('node_modules/theme/partials');
config.addPartialsDir('my-overrides/partials');
```

**Directory Contents**:
```
node_modules/theme/partials/
  ├── header.html.ejs       ← Base version
  ├── footer.html.ejs       ← Base version
  └── sidebar.html.ejs      ← Base version

my-overrides/partials/
  └── header.html.ejs       ← Custom version
```

**Virtual Filesystem Result**:
```
Virtual Path                 Physical Path
header.html.ejs       →      my-overrides/partials/header.html.ejs
footer.html.ejs       →      node_modules/theme/partials/footer.html.ejs
sidebar.html.ejs      →      node_modules/theme/partials/sidebar.html.ejs
```

`header.html.ejs` shadows the theme version; `footer.html.ejs` and `sidebar.html.ejs` use theme versions.

### Selective Overriding

Shadowing enables selective customization (source: [wiki/concepts/stacked-directories.md](../stacked-directories.md)):

**Full Theme**:
```
theme-plugin/
  ├── layouts/page.html.ejs
  ├── layouts/post.html.ejs
  ├── partials/header.html.ejs
  └── partials/footer.html.ejs
```

**Override One File**:
```
custom/
  └── partials/header.html.ejs    ← Only override header
```

**Mount**:
```javascript
config.addLayoutsDir('node_modules/theme-plugin/layouts');
config.addPartialsDir('node_modules/theme-plugin/partials');
config.addLayoutsDir('custom/layouts');
config.addPartialsDir('custom/partials');
```

Result: Custom header, theme footer, theme layouts.

### Cascading Overrides

Multiple override layers create cascades (source: [wiki/concepts/stacked-directories.md](../stacked-directories.md)):

```javascript
// Base layer: Default plugin
config.addLayoutsDir('node_modules/base-plugin/layouts');

// Middle layer: Theme plugin (overrides base)
config.addLayoutsDir('node_modules/theme-plugin/layouts');

// Top layer: Project customizations (overrides all)
config.addLayoutsDir('custom/layouts');
```

**Resolution**:
```
file.html.ejs exists in:
- base-plugin       (shadowed by theme-plugin)
- theme-plugin      (shadowed by custom)
- custom            ← USED
```

### Shadowing Across File Types

Each file type has independent shadowing (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
// Independent VFStack instances
documentsCache.vfs    // Shadows within documents
assetsCache.vfs       // Shadows within assets
layoutsCache.vfs      // Shadows within layouts
partialsCache.vfs     // Shadows within partials
```

**Example**:
```javascript
config.addDocumentsDir('base/documents');
config.addDocumentsDir('override/documents');
config.addLayoutsDir('base/layouts');
config.addLayoutsDir('override/layouts');
```

Documents and layouts shadow independently:
- `override/documents/post.md` shadows `base/documents/post.md`
- `override/layouts/page.ejs` shadows `base/layouts/page.ejs`
- No cross-type shadowing

### Programmatic Detection

Check which files are shadowed (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
// Find file in virtual filesystem
const vpathData = vfs.find('header.html.ejs');

console.log('Active file:', vpathData.fspath);
// '/project/custom/partials/header.html.ejs'

// Check if multiple mounts have this file
if (vpathData.stack && vpathData.stack.length > 1) {
    console.log('Shadowed files:');
    vpathData.stack.slice(1).forEach(shadowed => {
        console.log('-', shadowed.fspath);
    });
}
// Output:
// - /project/node_modules/theme/partials/header.html.ejs
```

The `stack` property contains all matching files across mounts.

### Plugin Template Override Pattern

Common pattern for plugin extensibility (source: [wiki/concepts/stacked-directories.md](../stacked-directories.md)):

**Plugin Implementation**:
```javascript
class MyPlugin extends Plugin {
    configure(config, options) {
        // Plugin provides default templates
        config.addPartialsDir(__dirname + '/partials');
        config.addLayoutsDir(__dirname + '/layouts');
    }
}
```

**Plugin Usage**:
```javascript
// Add plugin (provides defaults)
config.use(MyPlugin);

// Add project overrides (shadows plugin templates)
config.addPartialsDir('my-partials');
config.addLayoutsDir('my-layouts');
```

Plugin templates act as fallbacks; project overrides take precedence.

### Built-in Plugin Special Case

The BuiltInPlugin is added last in `prepare()` specifically so its templates can be overridden (source: [wiki/concepts/stacked-directories.md](../stacked-directories.md)):

```javascript
prepare() {
    // ... other setup ...
    
    // Add BuiltInPlugin last so templates can be overridden
    this.use(BuiltInPlugin, {});
    
    return this;
}
```

Users and plugins can override built-in templates by mounting directories before `prepare()` is called.

## Key Parameters

**Mount Order** (in Configuration):
- Order matters: later mounts have higher precedence
- Use `addDocumentsDir()`, `addLayoutsDir()`, `addPartialsDir()`, `addAssetsDir()`

**VPathData.stack** (from VFStack):
- Array of all VPathData objects for same virtual path
- First element: active (visible) file
- Remaining elements: shadowed files

**Shadowing Scope**:
- Per file type (documents, assets, layouts, partials)
- Not cross-type

## When To Use

Use file shadowing:

1. **Theme Customization**: Override theme templates selectively
   ```javascript
   config.addLayoutsDir('node_modules/my-theme/layouts');
   config.addLayoutsDir('custom-layouts');  // Shadows theme
   ```

2. **Plugin Template Override**: Customize plugin-provided templates
   ```javascript
   config.use(BlogPlugin);  // Provides templates
   config.addPartialsDir('custom-blog-partials');  // Overrides
   ```

3. **Environment-Specific Overrides**: Different templates per environment
   ```javascript
   config.addLayoutsDir('layouts');
   if (process.env.NODE_ENV === 'development') {
       config.addLayoutsDir('dev-overrides');
   }
   ```

4. **Multi-Tenant Sites**: Tenant-specific customizations
   ```javascript
   config.addLayoutsDir('base-layouts');
   config.addLayoutsDir(`tenants/${tenantId}/layouts`);
   ```

5. **Progressive Enhancement**: Start with defaults, override incrementally
   ```javascript
   config.addPartialsDir('node_modules/starter-kit/partials');
   config.addPartialsDir('improvements/partials');  // Phase 1
   config.addPartialsDir('final-design/partials');  // Phase 2
   ```

6. **Testing**: Override templates for test scenarios
   ```javascript
   config.addLayoutsDir('layouts');
   if (isTest) {
       config.addLayoutsDir('test-fixtures/layouts');
   }
   ```

## Risks & Pitfalls

**Unintentional Shadowing**: Accidentally creating files that shadow others:
```javascript
// Plugin provides: partials/header.html.ejs
config.use(MyPlugin);

// Developer creates: my-partials/header.html.ejs (unaware of plugin file)
config.addPartialsDir('my-partials');

// Result: Plugin header never used, developer confused why
```

Check plugin documentation to understand what files are provided.

**Reverse Mount Order**: Adding overrides before base:
```javascript
// WRONG: Override won't work
config.addLayoutsDir('custom-layouts');       // Processed first
config.addLayoutsDir('node_modules/theme');   // Shadows custom!

// CORRECT: Override works
config.addLayoutsDir('node_modules/theme');
config.addLayoutsDir('custom-layouts');       // Shadows theme
```

Later `add*Dir()` calls have higher precedence.

**Silent Shadowing**: No warning when files are shadowed:
```javascript
// Both have header.html.ejs
config.addPartialsDir('partials-v1');
config.addPartialsDir('partials-v2');

// partials-v2 version used, partials-v1 silently ignored
// No error or warning
```

Use VPathData.stack to detect shadowing if needed.

**Cross-Type Confusion**: Shadowing doesn't work across file types:
```javascript
// These don't shadow each other
config.addDocumentsDir('base/documents/header.html.ejs');
config.addPartialsDir('override/partials/header.html.ejs');

// Both exist in separate virtual filesystems
// header.html.ejs in documents ≠ header.html.ejs in partials
```

**Plugin Order Dependency**: Plugin order affects shadowing:
```javascript
config.use(PluginA);  // Adds partials/common.html.ejs
config.use(PluginB);  // Adds partials/common.html.ejs
// PluginB shadows PluginA

// Reverse order:
config.use(PluginB);
config.use(PluginA);
// PluginA shadows PluginB
```

Document plugin dependencies to avoid conflicts.

**Built-in Override Timing**: BuiltInPlugin added in `prepare()`:
```javascript
// WRONG: Won't shadow built-in
config.prepare();
config.addLayoutsDir('custom');  // After prepare()!

// CORRECT: Shadows built-in
config.addLayoutsDir('custom');
config.prepare();  // Built-in added after custom
```

Add custom directories before calling `prepare()`.

**Debugging Shadowed Files**: Hard to know which file is actually used:
```javascript
// Multiple candidates for header.html.ejs
// Which one renders?

// Solution: Log VPathData
const vpathData = partialsCache.find('header.html.ejs');
console.log('Using:', vpathData.fspath);
console.log('Shadowing:', vpathData.stack.slice(1).map(v => v.fspath));
```

**Partial Override Incompleteness**: Forgetting to override related files:
```javascript
// Override header.html.ejs but not footer.html.ejs
// Styles may not match between overridden and original
```

Ensure visual/functional consistency across overrides.

**Development vs. Production Paths**: Shadowing depends on absolute paths:
```javascript
// Development: /Users/dev/project/custom
config.addLayoutsDir('custom');

// Production: /var/www/project/custom
// Same relative path, different absolute paths
// VFStack uses absolute paths internally
```

Use relative paths in configuration for portability.

## Sources

- [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts) - VFStack shadowing implementation
- [wiki/concepts/stacked-directories.md](../stacked-directories.md) - High-level stacking concept

## Related Pages

- [Stacked Directories](./stacked-directories.md) - Directory stacking concept
- [Virtual Filesystem](./virtual-filesystem.md) - VFStack implementation
- [Plugin System](./plugin-system.md) - How plugins use shadowing
- [Configuration Class](./configuration-class.md) - Directory mounting methods

## Backlinks

- [wiki/summaries/lib/cache/vfstack.ts.md](../summaries/lib/cache/vfstack.ts.md)
- [wiki/concepts/stacked-directories.md](./stacked-directories.md)
- [wiki/concepts/virtual-filesystem.md](./virtual-filesystem.md)
