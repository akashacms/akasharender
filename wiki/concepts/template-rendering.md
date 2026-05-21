---
title: "Template Rendering"
type: concept
Sources:
  - lib/render.ts
  - lib/index.ts
  - AGENTS.md
Categories:
  - rendering
  - templates
  - content-processing
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# Template Rendering

## Definition

Template Rendering is the process of transforming source documents (Markdown, EJS, Nunjucks, etc.) into HTML through template engines, forming the first two stages of AkashaRender's [Three-Stage Rendering](./three-stage-rendering.md) pipeline (source: [lib/render.ts](../../lib/render.ts)). This system uses the `@akashacms/renderers` package to provide pluggable support for multiple template formats, enabling content authors to use their preferred markup and templating languages.

## How It Works

### The @akashacms/renderers Package

Template rendering is handled by an external dependency, `@akashacms/renderers`, which is separate from AkashaRender itself (source: [AGENTS.md](../../AGENTS.md)):

- **npm**: `@akashacms/renderers` package
- **GitHub**: https://github.com/akashacms/rendering-engines
- **Documentation**: https://www.npmjs.com/package/@akashacms/renderers

AkashaRender integrates this package through its Configuration class and uses it throughout the rendering pipeline.

### Two-Stage Template Processing

Template rendering occurs in two stages within the overall three-stage pipeline (source: [lib/render.ts](../../lib/render.ts)):

**Stage 1: First Render (Content Rendering)**
- Reads the source document from the file cache
- Extracts frontmatter metadata
- Selects appropriate renderer based on file extension
- Renders content to HTML (e.g., Markdown → HTML, EJS → HTML)
- Returns rendered content + metadata

**Stage 2: Layout Render (Layout Application)**
- Checks if document specifies a layout in frontmatter
- Finds layout template in layouts cache
- Merges document metadata with layout metadata
- Renders layout with content in `content` variable
- Supports recursive nested layouts
- Returns fully-wrapped HTML

After these two stages, the HTML proceeds to Stage 3 ([Mahabhuta System](./mahabhuta-system.md)) for DOM manipulation.

### Supported Template Formats

AkashaRender defines MIME types for various template formats to enable proper renderer selection (source: [lib/index.ts](../../lib/index.ts)):

```javascript
mimedefine({'text/asciidoc': [ 'adoc', 'asciidoc' ]});
mimedefine({'text/x-markdoc': [ 'markdoc' ]});
mimedefine({'text/x-ejs': [ 'ejs']});
mimedefine({'text/x-nunjucks': [ 'njk' ]});
mimedefine({'text/x-handlebars': [ 'handlebars' ]});
mimedefine({'text/x-liquid': [ 'liquid' ]});
mimedefine({'text/x-tempura': [ 'tempura' ]});
```

Common renderer types:
- **Markdown**: `.md`, `.html.md` - Content authoring
- **AsciiDoc**: `.adoc`, `.asciidoc` - Technical documentation
- **EJS**: `.ejs`, `.html.ejs` - JavaScript-based templating
- **Nunjucks**: `.njk`, `.html.njk` - Jinja2-like templating
- **Handlebars**: `.handlebars` - Mustache-based templating
- **Liquid**: `.liquid` - Shopify-style templating

### File Extension Chaining

AkashaRender supports extension chaining to apply multiple renderers sequentially (source: [lib/render.ts](../../lib/render.ts)):

```
blog-post.html.md       → Markdown to HTML → blog-post.html
template.html.ejs       → EJS to HTML      → template.html
styles.css.ejs          → EJS to CSS       → styles.css
data.json.ejs           → EJS to JSON      → data.json
```

The rendering engine processes extensions from right to left:
1. Identifies the rightmost template extension (`.md`, `.ejs`, etc.)
2. Applies that renderer
3. If more template extensions remain, repeats
4. Final extension determines output MIME type

### Renderer Configuration

The Configuration class manages renderer settings (source: [lib/index.ts](../../lib/index.ts)):

```typescript
class Configuration {
    #renderers: Renderers.Configuration;
    
    constructor(modulepath) {
        this.#renderers = new Renderers.Configuration({});
    }
}
```

Renderer-specific configuration can be accessed:
```javascript
// Example: Configure Markdown-IT plugins
const markdownRenderer = config.findRendererName('.html.md');
markdownRenderer.use(markdownItPlugin, options);
```

### Partial Template Rendering

AkashaRender provides functions for rendering partial templates (reusable template fragments) (source: [lib/index.ts](../../lib/index.ts)):

```javascript
// Async version
export async function partial(config, fname, metadata) {
    const found = await filecache.partialsCache.find(fname);
    if (!found) {
        throw new Error(`No partial found for ${fname}`);
    }
    // Render using appropriate renderer for partial's file type
    return await renderers.render(found, metadata);
}

// Synchronous version
export function partialSync(config, fname, metadata) {
    // Similar but synchronous
}
```

Partials are:
- Stored in directories added via `config.addPartialsDir()`
- Can use any supported template format
- Receive metadata object for dynamic rendering
- Used within documents, layouts, or other partials

### Integration with File Caching

The rendering system integrates tightly with [File Caching](./file-caching.md) (source: [lib/render.ts](../../lib/render.ts)):

1. Document info retrieved from documentsCache
2. Layout templates retrieved from layoutsCache
3. Partial templates retrieved from partialsCache
4. Caches provide virtual paths, filesystem paths, and metadata

### Metadata Flow

Metadata flows through the rendering stages (source: [lib/render.ts](../../lib/render.ts)):

**Document Frontmatter**:
```yaml
---
title: My Blog Post
layout: blog-layout.html.ejs
tags: [javascript, nodejs]
---
```

**First Render**:
- Frontmatter parsed and merged with Configuration metadata
- Available in template as variables (e.g., `title`, `tags`)

**Layout Render**:
- Document metadata passed to layout
- Layout has access to `content` (rendered document HTML)
- Layout can add/override metadata

**Partial Render**:
- Explicitly passed metadata object
- Inherits nothing by default (isolated scope)

### Performance Tracking

The rendering system tracks detailed performance metrics (source: [lib/render.ts](../../lib/render.ts)):

```typescript
type RenderingResults = {
    vpath: string;
    renderPath: string;
    renderFormat: string;
    
    firstRenderStart?: number;
    firstRenderEnd?: number;
    firstRenderElapsed?: number;
    
    layoutStart?: number;
    layoutEnd?: number;
    layoutElapsed?: number;
    
    mahabStart?: number;
    mahabEnd?: number;
    mahabElapsed?: number;
    
    totalElapsed?: number;
    errors: any[];
};
```

Uses `performance.now()` for high-resolution timing to identify rendering bottlenecks.

### Special Rendering Cases

**CSS Files** (source: [lib/render.ts](../../lib/render.ts)):
- Rendered without layout application
- Skips Mahabhuta processing
- Allows templating in stylesheets (e.g., `.css.ejs`)

**Asset Copy** (source: [lib/render.ts](../../lib/render.ts)):
- Some file types copied directly without rendering
- Images, fonts, binaries
- Determined by MIME type

## Key Parameters

**Configuration Settings**:
- `renderers` - Renderers.Configuration instance managing template engines
- `documentDirs` - Directories containing source documents
- `layoutDirs` - Directories containing layout templates
- `partialDirs` - Directories containing partial templates
- `metadata` - Global metadata available to all templates

**Renderer Access Methods**:
- `config.findRendererName(ext)` - Get renderer for file extension
- `config.renderers.partialFunc` - Function for async partial rendering
- `config.renderers.partialSyncFunc` - Function for sync partial rendering

**Rendering Functions**:
- `render(config)` - Render all documents in project
- `renderDocument(config, docInfo)` - Render single document
- `renderContent(config, rc)` - Core rendering logic
- `partial(config, fname, metadata)` - Render partial template
- `partialSync(config, fname, metadata)` - Sync partial rendering

**Frontmatter Properties**:
- `layout` - Layout template to wrap content
- `title`, `tags`, custom properties - Available in templates
- Renderer-specific properties

## When To Use

**Use template rendering for**:

1. **Content Authoring**: Write documents in Markdown for readable source
   ```markdown
   # My Article
   This is **bold** and this is *italic*.
   ```

2. **Layout Templates**: Define page structure with EJS or Nunjucks
   ```html
   <!DOCTYPE html>
   <html>
     <head><title><%= title %></title></head>
     <body><%- content %></body>
   </html>
   ```

3. **Partial Components**: Reusable template fragments
   ```html
   <!-- partials/header.html.ejs -->
   <header>
     <h1><%= site.title %></h1>
   </header>
   ```

4. **Dynamic Stylesheets**: Generate CSS from templates
   ```css
   /* styles.css.ejs */
   :root {
     --primary-color: <%= theme.primaryColor %>;
   }
   ```

5. **Nested Layouts**: Apply different layouts at different hierarchy levels

6. **Multi-Format Output**: Same template for HTML, JSON, XML, etc.

**Do NOT use template rendering for**:

1. **DOM Manipulation**: Use [Mahabhuta System](./mahabhuta-system.md) for post-processing HTML
2. **Client-Side Rendering**: Templates render server-side during build
3. **Runtime Dynamic Content**: All rendering happens at build time
4. **Binary Files**: Images, PDFs, etc. are copied, not rendered

## Risks & Pitfalls

**Extension Order Confusion**: Extension chaining processes right-to-left (source: [lib/render.ts](../../lib/render.ts)). A file named `page.ejs.md` renders as Markdown first, then EJS, which is likely not intended. Use `page.html.md` for Markdown or `page.html.ejs` for EJS.

**Renderer Not Found**: If a file extension lacks a registered renderer, rendering fails. Ensure renderer plugins are loaded for all file types used:
```javascript
// Check registered renderers
const renderer = config.findRendererName('.html.xyz');
if (!renderer) {
  console.error('No renderer for .xyz files');
}
```

**Partial Scope Isolation**: Partials receive only the metadata explicitly passed to them (source: [lib/index.ts](../../lib/index.ts)). They don't inherit the parent template's scope:
```javascript
// Won't work: partial can't access 'title' from parent scope
await partial(config, 'header.html.ejs', {});

// Works: explicitly pass metadata
await partial(config, 'header.html.ejs', { title: metadata.title });
```

**Layout Metadata Precedence**: When a document uses a layout, metadata can be overridden in unexpected ways (source: [lib/render.ts](../../lib/render.ts)). Document frontmatter takes precedence over layout frontmatter, but layouts can inject additional metadata.

**Recursive Layout Loops**: If layout A includes layout B which includes layout A, rendering never completes. AkashaRender doesn't detect circular layout references. Design layout hierarchies carefully.

**Synchronous Rendering Limitations**: The `partialSync()` function cannot render templates that require async operations (source: [lib/index.ts](../../lib/index.ts)). Use `partial()` (async version) when:
- Template performs I/O operations
- Template calls async functions
- Template renders nested partials asynchronously

**Performance with Many Partials**: Each partial renders separately (source: [lib/index.ts](../../lib/index.ts)). Documents with dozens of partial includes can slow rendering. Consider:
- Consolidating partials
- Caching partial results
- Using layout templates for shared structure

**MIME Type Registration**: Custom template formats require MIME type registration before use (source: [lib/index.ts](../../lib/index.ts)). Forgetting this causes "unknown MIME type" errors:
```javascript
// Register before using .xyz files
mimedefine({'text/x-xyz': ['xyz']});
```

**Template Engine Limitations**: Each template engine has limitations:
- **Markdown**: No logic, only content formatting
- **EJS**: JavaScript syntax errors crash rendering
- **Nunjucks**: Limited JavaScript access for security
- **Handlebars**: No arbitrary JavaScript execution

**Frontmatter Parsing Errors**: Invalid YAML in frontmatter causes rendering failure. Common issues:
- Unquoted strings with colons (e.g., `title: My: Article`)
- Incorrect indentation
- Missing closing quotes or brackets

**CSS Rendering Special Case**: CSS files render without layouts/Mahabhuta (source: [lib/render.ts](../../lib/render.ts)). This means:
- Layout templates ignored for `.css` files
- Mahabhuta custom tags won't work in CSS
- Useful for variables but not DOM manipulation

## Sources

- [lib/render.ts](../../lib/render.ts) - Rendering pipeline implementation
- [lib/index.ts](../../lib/index.ts) - Configuration and partial rendering
- [AGENTS.md](../../AGENTS.md) - @akashacms/renderers description

## Related Pages

- [Three-Stage Rendering](./three-stage-rendering.md) - Overall rendering pipeline
- [Configuration Class](./configuration-class.md) - Manages renderer configuration
- [File Caching](./file-caching.md) - Provides document/layout/partial files
- [Mahabhuta System](./mahabhuta-system.md) - Third stage after template rendering
- [Layout Templates](./layout-templates.md) - Layout template patterns

## Backlinks

- [wiki/summaries/lib/render.ts.md](../summaries/lib/render.ts.md)
- [wiki/summaries/lib/index.ts.md](../summaries/lib/index.ts.md)
