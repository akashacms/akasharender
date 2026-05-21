---
title: "Layout Templates"
type: concept
Sources:
  - lib/render.ts
  - lib/cache/schema.ts
  - guide/layouts-partials.html.md
  - lib/cache/watchman.ts
Categories:
  - templates
  - rendering
  - page-structure
date-created: 2026-05-21T06:20:00+03:00
last-updated: 2026-05-21T06:20:00+03:00
confidence: high
---

# Layout Templates

## Definition

Layout Templates are reusable page structure templates that wrap content documents with consistent HTML scaffolding such as headers, footers, navigation, and semantic markup (source: [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md)). They separate content authoring from page design, allowing content authors to focus on writing while website designers control the overall page structure independently.

## How It Works

### Layout Application in Rendering

Layout templates are applied in Stage 2 of the [Three-Stage Rendering](./three-stage-rendering.md) pipeline (source: [lib/render.ts](../../lib/render.ts)):

1. **Stage 1**: Document content rendered to HTML
2. **Stage 2**: If document specifies `layout` in frontmatter, wrap content with layout template
3. **Stage 3**: Mahabhuta DOM manipulation

The layout receives the rendered content from Stage 1 in a variable called `content` and can access all document metadata.

### Specifying a Layout

Documents specify their layout in frontmatter (source: [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md)):

```yaml
---
layout: article.html.ejs
title: My Blog Post
author: Jane Doe
---

<p>This is the content of the article.</p>
```

When this document renders:
1. Content renders to HTML: `<p>This is the content of the article.</p>`
2. Layout `article.html.ejs` is located in layouts directories
3. Content passed to layout as `content` variable
4. Metadata (`title`, `author`, etc.) available in layout

### Layout Template Structure

A typical layout template structure (source: [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md)):

**EJS Example** (`layouts/article.html.ejs`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><%= title %></title>
    <meta name="author" content="<%= author %>">
</head>
<body>
    <header>
        <nav><!-- navigation --></nav>
    </header>
    
    <main>
        <article>
            <h1><%= title %></h1>
            <p class="byline">By <%= author %></p>
            
            <%- content %>  <!-- Document content inserted here -->
        </article>
    </main>
    
    <footer>
        <p>&copy; 2025 My Website</p>
    </footer>
</body>
</html>
```

**Nunjucks Example** (`layouts/article.html.njk`):
```html
<!DOCTYPE html>
<html>
<head>
    <title>{{ title }}</title>
</head>
<body>
    <main>
        {{ content }}  <!-- Raw HTML output, not escaped -->
    </main>
</body>
</html>
```

**Handlebars Example** (`layouts/article.html.handlebars`):
```html
<!DOCTYPE html>
<html>
<head>
    <title>{{ title }}</title>
</head>
<body>
    {{{ content }}}  <!-- Three braces for unescaped HTML -->
</body>
</html>
```

### Variable Substitution

Layout templates receive variables from document metadata (source: [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md)):

**EJS**:
- `<%= value %>` - Escaped HTML (safe for text)
- `<%- value %>` - Raw HTML (for `content` variable)

**Nunjucks/Liquid**:
- `{{ value | escape }}` - Escaped HTML
- `{{ value }}` - Raw HTML

**Handlebars**:
- `{{ value }}` - Escaped HTML (default)
- `{{{ value }}}` - Raw HTML (three braces)

For the `content` variable, always use raw/unescaped output since it contains HTML from Stage 1.

### Layout Discovery

Layouts are stored in directories specified via Configuration (source: [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md)):

```javascript
config.addLayoutsDir('layouts');
config.addLayoutsDir('node_modules/my-theme/layouts');
```

AkashaRender searches directories in order and uses the first matching file. This enables [Stacked Directories](./stacked-directories.md) for layout overriding:
- Later directories can override layouts from earlier directories
- Plugins can provide default layouts
- Projects can override plugin layouts

### Nested Layouts

Layouts can themselves specify a layout, creating nested structures (source: [lib/render.ts](../../lib/render.ts)):

**Inner Layout** (`layouts/article-content.html.ejs`):
```yaml
---
layout: site-wrapper.html.ejs
---
<article>
    <h1><%= title %></h1>
    <%- content %>
</article>
```

**Outer Layout** (`layouts/site-wrapper.html.ejs`):
```html
<!DOCTYPE html>
<html>
<head><title><%= title %></title></head>
<body>
    <header><!-- site header --></header>
    <%- content %>  <!-- Inner layout content inserted here -->
    <footer><!-- site footer --></footer>
</body>
</html>
```

**Document** (`blog/post.html.md`):
```yaml
---
layout: article-content.html.ejs
title: My Post
---
Content here
```

Rendering flow:
1. Document → `<p>Content here</p>`
2. Wrap in `article-content.html.ejs` → `<article><h1>My Post</h1><p>Content here</p></article>`
3. Wrap in `site-wrapper.html.ejs` → Full HTML page

### Layout Metadata Merging

Metadata flows through nested layouts (source: [lib/render.ts](../../lib/render.ts)):
- Document frontmatter has highest priority
- Layout can provide defaults
- Outer layouts inherit merged metadata

### Layout Cache Schema

Layouts are stored in the LayoutsCache with this structure (source: [lib/cache/schema.ts](../../lib/cache/schema.ts)):

```typescript
type Layout = {
    // From BaseCacheEntry
    vpath: string;           // Virtual path (e.g., 'article.html.ejs')
    fspath: string;          // Physical file path
    mime: string;            // MIME type
    mounted: string;         // Mount directory
    mountPoint: string;      // Virtual mount point
    pathInMounted: string;   // Path within mount
    statsMtime: number;      // Modification timestamp
    stack: VPathData[];      // All matching layouts across mounts
    
    // Layout-specific
    docBody: string;         // Template source code
    rendererName: string;    // Renderer to use (e.g., 'EJS')
};
```

### Layout Changes and Re-rendering

When a layout file changes during development, all documents using that layout must be re-rendered (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)):

```javascript
// Watchman detects layout change
layoutsCache.on('change', async (info) => {
    // Find all documents using this layout
    const docs = await documentsCache.documentsForLayout(info.vpath);
    
    // Re-render all affected documents
    await renderForLayout(config, info);
});
```

This uses `documentsForLayout()` query and concurrent re-rendering with a queue.

### No Layout Option

Documents can opt out of layouts (source: [lib/render.ts](../../lib/render.ts)):

```yaml
---
title: Standalone Page
# No layout specified
---
<p>This renders without a layout wrapper.</p>
```

Stage 2 is skipped, and the document proceeds directly from Stage 1 to Stage 3 (Mahabhuta).

### CSS Files and Layouts

CSS files skip layout processing (source: [lib/render.ts](../../lib/render.ts)):

```css
/* styles.css.ejs */
:root {
    --primary-color: <%= theme.primaryColor %>;
}
```

This renders through Stage 1 (template expansion) but skips Stage 2 (layout) and Stage 3 (Mahabhuta), producing a pure CSS file.

## Key Parameters

**Frontmatter Settings**:
- `layout` - Path to layout template (e.g., `article.html.ejs`)
- Metadata fields available to layout (title, author, tags, etc.)

**Configuration Methods**:
- `config.addLayoutsDir(path)` - Add directory containing layouts
- Supports multiple directories for [Stacked Directories](./stacked-directories.md)

**Layout Variables**:
- `content` - Rendered HTML from Stage 1 (required)
- All document frontmatter fields
- Merged metadata from nested layouts

**Cache Queries**:
- `layoutsCache.find(vpath)` - Locate layout by virtual path
- `documentsCache.documentsForLayout(layoutPath)` - Find documents using a layout

## When To Use

Use layout templates:

1. **Site-Wide Page Structure**: Consistent HTML scaffolding across all pages
   ```html
   <!DOCTYPE html>
   <html>
     <head><!-- common head elements --></head>
     <body>
       <header><!-- site header --></header>
       <%- content %>
       <footer><!-- site footer --></footer>
     </body>
   </html>
   ```

2. **Multiple Page Types**: Different layouts for different content types
   - `blog-post.html.ejs` - Blog article layout
   - `landing-page.html.ejs` - Marketing page layout
   - `documentation.html.ejs` - Doc page layout

3. **Responsive Design**: Wrap content in responsive grid structures
   ```html
   <div class="container">
     <div class="row">
       <div class="col-md-8"><%- content %></div>
       <div class="col-md-4"><!-- sidebar --></div>
     </div>
   </div>
   ```

4. **SEO and Metadata**: Inject meta tags, Open Graph, schema.org
   ```html
   <meta property="og:title" content="<%= title %>">
   <meta property="og:description" content="<%= description %>">
   ```

5. **Navigation and Menus**: Consistent navigation across pages
   ```html
   <nav>
     <a href="/">Home</a>
     <a href="/blog/">Blog</a>
     <a href="/about/">About</a>
   </nav>
   ```

6. **Asset References**: Include stylesheets and scripts
   ```html
   <link rel="stylesheet" href="/css/main.css">
   <script src="/js/app.js"></script>
   ```

7. **Hierarchical Structures**: Nested layouts for section-specific wrapping
   - Outer: Site-wide shell
   - Middle: Section layout (blog, docs, etc.)
   - Inner: Content-specific structure

## Risks & Pitfalls

**Forgetting Content Variable**: The layout must include `<%- content %>` or equivalent, otherwise the document content disappears (source: [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md)):
```html
<!-- WRONG: No content variable -->
<html>
  <body>
    <h1>My Site</h1>
    <!-- Where is the content??? -->
  </body>
</html>

<!-- CORRECT: Content variable present -->
<html>
  <body>
    <h1>My Site</h1>
    <%- content %>
  </body>
</html>
```

**Escaping Content**: The `content` variable contains HTML and must not be escaped (source: [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md)):
```html
<!-- WRONG: Escaped content shows HTML as text -->
<%= content %>  <!-- EJS: Shows <p>Text</p> literally -->

<!-- CORRECT: Raw content renders as HTML -->
<%- content %>  <!-- EJS: Renders HTML properly -->
```

**Layout File Extension Mismatch**: Layout file extension determines template engine (source: [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md)):
```yaml
# Document specifies:
layout: article.html.ejs

# File must be named exactly:
layouts/article.html.ejs

# NOT:
layouts/article.html.njk  # Different extension won't match
```

**Circular Layout References**: If layout A references layout B which references layout A, rendering loops forever (source: [lib/render.ts](../../lib/render.ts)). AkashaRender doesn't detect cycles:
```yaml
# layouts/a.html.ejs
---
layout: b.html.ejs
---
Content A

# layouts/b.html.ejs
---
layout: a.html.ejs  # CIRCULAR REFERENCE
---
Content B
```

**Metadata Override Confusion**: Layout metadata can conflict with document metadata (source: [lib/render.ts](../../lib/render.ts)):
```yaml
# Document
---
title: Document Title
layout: my-layout.html.ejs
---

# Layout: my-layout.html.ejs
---
title: Layout Title  # Overridden by document
---
<title><%= title %></title>  <!-- "Document Title" wins -->
```

Document frontmatter takes precedence over layout frontmatter.

**Partial Rendering in Layouts**: Using `<partial>` tags in layouts is powerful but can cause performance issues (source: [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md)):
```html
<!-- Layout with many partials -->
<%- partial('header.html.ejs') %>
<%- partial('nav.html.ejs') %>
<%- partial('sidebar.html.ejs') %>
<%- content %>
<%- partial('footer.html.ejs') %>
```

Each partial renders separately. Consider inline HTML for performance-critical layouts.

**Watch Mode Re-rendering**: Changing a layout re-renders all documents using it (source: [lib/cache/watchman.ts](../../lib/cache/watchman.ts)). A widely-used layout change can trigger hundreds of re-renders, slowing development.

**Template Engine Limitations**: Different template engines have different capabilities:
- **EJS**: Full JavaScript expressions
- **Nunjucks**: Limited JavaScript access
- **Handlebars**: Logic-less, requires helpers

Choose engines appropriate for layout complexity.

**Missing Layout Errors**: If a document specifies a layout that doesn't exist, rendering fails:
```yaml
---
layout: nonexistent.html.ejs  # ERROR: File not found
---
```

Ensure all referenced layouts exist in `layoutsDirs`.

**Nested Layout Depth**: Deep nesting (4+ levels) complicates debugging and performance (source: [lib/render.ts](../../lib/render.ts)). Each level adds rendering overhead and potential points of failure.

## Sources

- [lib/render.ts](../../lib/render.ts) - Layout rendering implementation
- [lib/cache/schema.ts](../../lib/cache/schema.ts) - Layout data structure
- [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md) - Layout documentation
- [lib/cache/watchman.ts](../../lib/cache/watchman.ts) - Layout change handling

## Related Pages

- [Three-Stage Rendering](./three-stage-rendering.md) - Layout as Stage 2
- [Template Rendering](./template-rendering.md) - Template engine integration
- [Stacked Directories](./stacked-directories.md) - Layout directory stacking
- [File Caching](./file-caching.md) - LayoutsCache implementation

## Backlinks

- [wiki/summaries/lib/render.ts.md](../summaries/lib/render.ts.md)
- [wiki/summaries/lib/cache/schema.ts.md](../summaries/lib/cache/schema.ts.md)
- [wiki/concepts/three-stage-rendering.md](./three-stage-rendering.md)
