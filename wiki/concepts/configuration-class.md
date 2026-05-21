---
title: "Configuration Class"
type: concept
Sources:
  - lib/index.ts
Categories:
  - core
  - configuration
  - initialization
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# Configuration Class

## Definition

The Configuration class is the central object in AkashaRender that manages all settings, directories, plugins, and rendering options for a static site project (source: [lib/index.ts](../../lib/index.ts)). It serves as both a configuration container and the primary interface for coordinating the rendering system, encapsulating directory paths, plugin registration, renderer settings, metadata, and lifecycle hooks.

## How It Works

The Configuration class follows a builder pattern where methods return `this` for method chaining, allowing fluent configuration setup (source: [lib/index.ts](../../lib/index.ts)). The typical initialization workflow is:

1. **Instantiation**: Create a new Configuration object with `new akasharender.Configuration(modulepath)`
2. **Configuration**: Chain method calls to add directories, plugins, and settings
3. **Preparation**: Call `config.prepare()` to finalize configuration with defaults
4. **Setup**: Call `akasharender.setup(config)` to initialize caches and asynchronous components

The class uses private fields with the `#` syntax for encapsulation, exposing configuration values through getter/setter methods (source: [lib/index.ts](../../lib/index.ts)):

```typescript
class Configuration {
    #renderers: Renderers.Configuration;
    #configdir: string;
    #cachedir: string;
    #assetsDirs?: dirToMount[];
    #layoutDirs?: dirToMount[];
    #documentDirs?: dirToMount[];
    #partialDirs?: dirToMount[];
    #mahafuncs;
    #cheerio?: cheerio.CheerioOptions;
    #renderTo: string;
    #scripts?: {
        stylesheets?: stylesheetItem[],
        javaScriptTop?: javaScriptItem[],
        javaScriptBottom?: javaScriptItem[]
    };
    #concurrency: number;
    #cachingTimeout: number;
    #metadata: any;
    #root_url: string;
    #plugins;
    #pluginData;
    #verbose: boolean;
    #perfDataDir: string;
    // ...
}
```

### Directory Management

The Configuration class manages four types of [Stacked Directories](./stacked-directories.md) (source: [lib/index.ts](../../lib/index.ts)):

- **Documents**: Source files that render to output pages (added via `addDocumentsDir()`)
- **Assets**: Static files copied without processing (added via `addAssetsDir()`)
- **Layouts**: Page layout templates (added via `addLayoutsDir()`)
- **Partials**: Reusable template fragments (added via `addPartialsDir()`)

Each directory type supports the `dirToMount` structure, which allows mounting directories at specific virtual paths, applying ignore patterns, and attaching metadata to entire directory trees (source: [lib/index.ts](../../lib/index.ts)).

### Plugin System

Plugins extend AkashaRender functionality and are registered using the `use()` method (source: [lib/index.ts](../../lib/index.ts)). The Configuration class:

- Maintains a list of registered plugins
- Stores per-plugin configuration data
- Invokes plugin lifecycle hooks at appropriate times
- Automatically adds the BuiltInPlugin last in `prepare()` so its templates can be overridden

### Defaults and Preparation

The `prepare()` method finalizes configuration by setting intelligent defaults (source: [lib/index.ts](../../lib/index.ts)):

- Creates `cache/` directory if not configured
- Looks for default directories (`assets/`, `layouts/`, `partials/`, `documents/`, `out/`)
- Creates missing directories with `{ recursive: true }`
- Adds the BuiltInPlugin as the last plugin
- Returns `this` for continued chaining

Default values (source: [lib/index.ts](../../lib/index.ts)):
- Render destination: `out/`
- Cache directory: `cache/`
- Concurrency: 3
- Caching timeout: 60000ms (1 minute)

## Key Parameters

**Core Directories:**
- `configDir`: Base directory for resolving relative paths in configuration
- `cacheDir`: Location for SQLite cache database (default: `cache/`)
- `renderDestination`: Output directory for rendered files (default: `out/`)

**Content Directories** (arrays of `dirToMount`):
- `documentDirs`: Source content to be rendered
- `assetsDirs`: Static files to be copied
- `layoutDirs`: Page layout templates
- `partialDirs`: Reusable template components

**Rendering Configuration:**
- `renderers`: Configuration object for template engines (Markdown, EJS, Nunjucks, etc.)
- `mahafuncs`: Array of Mahabhuta functions for DOM manipulation
- `cheerio`: Options for Cheerio HTML parser configuration
- `concurrency`: Number of concurrent rendering operations (default: 3)

**Metadata and Resources:**
- `metadata`: Global metadata available to all templates
- `root_url`: Base URL for the site
- `scripts`: Configuration for CSS stylesheets and JavaScript references
  - `stylesheets`: Array of CSS files to include
  - `javaScriptTop`: Scripts to include in `<head>`
  - `javaScriptBottom`: Scripts to include before `</body>`

**Performance and Debugging:**
- `cachingTimeout`: Cache timeout in milliseconds (default: 60000)
- `verbose`: Enable verbose logging output
- `perfDataDir`: Directory for performance trace data

**Plugin Management:**
- `plugins`: Array of registered Plugin instances
- `pluginData`: Per-plugin configuration storage

## When To Use

Use the Configuration class:

1. **Project Setup**: As the first step when creating an AkashaRender project, instantiate and configure a Configuration object in your `config.js` or `config.mjs` file

2. **Directory Structure**: When defining where source content, templates, assets, and output should be located, using the `add*Dir()` methods

3. **Plugin Registration**: When adding plugins to extend functionality, using the `use()` method with plugin classes and options

4. **Rendering Control**: When invoking rendering operations, pass the Configuration object to rendering functions like `render()`, `renderDocument()`, or `partial()`

5. **Template Access**: Within templates and Mahabhuta functions, the Configuration object is available (often as `config`) to access metadata, render partials, or query file caches

6. **Testing**: In test suites, create isolated Configuration instances with test-specific directories and settings

The Configuration object is passed throughout the rendering pipeline and should be treated as read-only after the `prepare()` and `setup()` calls complete (source: [lib/index.ts](../../lib/index.ts)).

## Risks & Pitfalls

**Initialization Order**: The Configuration class has a strict initialization sequence that must be followed (source: [lib/index.ts](../../lib/index.ts)):
```javascript
const config = new akasharender.Configuration();
// ... add directories, plugins, settings ...
config.prepare();              // MUST be called before setup
await akasharender.setup(config);  // MUST be called before rendering
```
Skipping `prepare()` or `setup()` will result in missing defaults and uninitialized caches.

**Built-in Plugin Position**: The `prepare()` method automatically adds the BuiltInPlugin as the last plugin so its templates can be overridden (source: [lib/index.ts](../../lib/index.ts)). Calling `prepare()` multiple times may add the plugin multiple times, causing unexpected behavior.

**Directory Path Resolution**: Relative paths in directory configurations are resolved based on `configDir` (source: [lib/index.ts](../../lib/index.ts)). If `configDir` is not set correctly, directory paths may resolve to unexpected locations.

**Concurrency Setting**: The `concurrency` parameter controls parallel rendering operations (default: 3) (source: [lib/index.ts](../../lib/index.ts)). Setting this too high may cause resource exhaustion; setting it too low reduces performance. The optimal value depends on system resources and document complexity.

**Metadata Mutation**: The `metadata` object is shared across all templates (source: [lib/index.ts](../../lib/index.ts)). Mutating metadata within templates can cause unexpected side effects in other documents. Use document-specific frontmatter for per-document metadata.

**Cache Timeout**: The `cachingTimeout` affects how long file information is cached (source: [lib/index.ts](../../lib/index.ts)). Too short a timeout causes excessive disk I/O; too long a timeout delays detection of file changes during development.

**Plugin Dependencies**: Plugins are processed in registration order (source: [lib/index.ts](../../lib/index.ts)). If Plugin B depends on resources from Plugin A, ensure Plugin A is registered first using `use()`.

## Sources

- [lib/index.ts](../../lib/index.ts) - Configuration class definition and implementation
- [wiki/summaries/lib/index.ts.md](../summaries/lib/index.ts.md) - Summary of main entry point

## Related Pages

- [Plugin System](./plugin-system.md) - How plugins extend Configuration functionality
- [Stacked Directories](./stacked-directories.md) - Virtual filesystem used by Configuration
- [Three-Stage Rendering](./three-stage-rendering.md) - How Configuration coordinates rendering
- [Lifecycle Hooks](./lifecycle-hooks.md) - Plugin hooks invoked by Configuration
- [File Caching](./file-caching.md) - Cache system initialized by Configuration

## Backlinks

- [wiki/summaries/lib/index.ts.md](../summaries/lib/index.ts.md)
