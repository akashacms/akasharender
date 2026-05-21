---
title: "Mahabhuta System"
type: concept
Sources:
  - lib/mahafuncs.ts
  - lib/render.ts
  - lib/index.ts
  - AGENTS.md
Categories:
  - mahabhuta
  - dom-manipulation
  - post-processing
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# Mahabhuta System

## Definition

Mahabhuta is a DOM manipulation engine that post-processes HTML after initial rendering, enabling plugins to transform HTML elements, add custom tags, modify attributes, and implement complex document transformations (source: [AGENTS.md](../../AGENTS.md)). It is an external dependency (`mahabhuta` npm package) integrated into AkashaRender's [Three-Stage Rendering](./three-stage-rendering.md) pipeline as the third and final stage.

## How It Works

### Integration with Rendering Pipeline

Mahabhuta runs as the third stage in the rendering pipeline, after initial content rendering and layout application (source: [lib/render.ts](../../lib/render.ts)):

1. **First Render**: Document content rendered to HTML (Markdown → HTML, EJS → HTML, etc.)
2. **Layout Render**: HTML wrapped in layout template
3. **Mahabhuta Pass**: HTML parsed with Cheerio, mahafuncs manipulate DOM, modified HTML returned

The Mahabhuta pass receives the fully-rendered HTML and can:
- Query and modify the DOM using jQuery-like selectors
- Add, remove, or transform elements
- Insert dynamic content
- Resolve custom tags
- Apply final transformations before output

### Mahabhuta Function Types

Mahabhuta provides five function types for different DOM manipulation patterns (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)):

**1. Mahafunc** (`MahaMahafunc`): Base mahafunc type for general operations

**2. CustomElement** (`MahaCustomElement`): Processes custom HTML elements
- Triggered by specific element names (e.g., `<embed-video>`)
- Replaces custom elements with standard HTML
- Enables custom tag vocabulary

**3. ElementTweaker** (`MahaElementTweaker`): Modifies existing standard elements
- Triggered by selectors (e.g., `a[href]` for all links)
- Tweaks attributes, classes, content
- Useful for link processing, image optimization

**4. Munger** (`MahaMunger`): General HTML munging operations
- Broad DOM transformations
- Multi-element operations
- Content injection

**5. PageProcessor** (`MahaPageProcessor`): Full-page processing
- Access to entire document
- Global operations
- Final cleanup or validation

### AkashaRender Wrapper Classes

AkashaRender provides wrapper classes around Mahabhuta's base types to simplify plugin development (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)):

```typescript
export class CustomElement extends MahaCustomElement {
    #config: Configuration;
    #akasha: any;
    #plugin: Plugin;
    
    constructor(config, akasha, plugin) {
        super();
        this.#config = config;
        this.#akasha = akasha;
        this.#plugin = plugin;
    }
    
    get config() { return this.#config; }
    get akasha() { return this.#akasha; }
    get plugin() { return this.#plugin; }
}
```

This pattern eliminates verbose access patterns like `this.array.options.config.akasha` in favor of simple `this.config`, `this.akasha`, and `this.plugin` getters (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)).

### Registration and Execution

Plugins register mahafuncs during configuration (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)):

```javascript
class MyPlugin extends Plugin {
    configure(config, options) {
        config.addMahabhuta([
            new MyCustomElement(config, this.akasha, this),
            new MyElementTweaker(config, this.akasha, this)
        ]);
    }
}
```

During rendering, the Mahabhuta engine (source: [lib/render.ts](../../lib/render.ts)):
1. Parses HTML with Cheerio (jQuery-like DOM library)
2. Executes all registered mahafuncs in registration order
3. Each mahafunc inspects the DOM and makes modifications
4. Returns the transformed HTML as a string

### Configuration Options

The Configuration class provides Mahabhuta-related settings (source: [lib/index.ts](../../lib/index.ts)):

- `addMahabhuta(funcs)` - Register mahafuncs (single function or array)
- `mahabhutaConfig` - Cheerio parser options passed to `cheerio.load()`
- Access to registered mahafuncs via internal array

### Partial Template Support

Mahabhuta includes built-in support for rendering partial templates via a `<partial>` tag (source: [lib/index.ts](../../lib/index.ts)):

```javascript
// Registered in Configuration constructor
this.addMahabhuta(mahaPartial.mahabhutaArray({
    renderPartial: function(fname, metadata) {
        return partial(config, fname, metadata);
    }
}));
```

This allows documents to include partial templates:
```html
<partial file-name="header.html.ejs" />
```

### Mahabhuta as External Dependency

Mahabhuta is maintained as a separate package (source: [AGENTS.md](../../AGENTS.md)):
- **npm**: `mahabhuta` package
- **GitHub**: https://github.com/akashacms/mahabhuta
- **Documentation**: https://www.npmjs.com/package/mahabhuta

AkashaRender depends on and extends Mahabhuta but does not implement it. Changes to Mahabhuta's core engine happen in its own repository.

## Key Parameters

**Mahabhuta Configuration** (via Configuration class):
- `mahafuncs` - Array of registered Mahabhuta functions
- `mahabhutaConfig` - Options passed to Cheerio parser
  - `decodeEntities`: Controls HTML entity decoding
  - `xmlMode`: Enables XML parsing mode
  - Other Cheerio options

**Mahafunc Constructor Parameters** (in AkashaRender wrappers):
- `config` - AkashaRender Configuration instance
- `akasha` - Reference to AkashaRender module
- `plugin` - Plugin instance that owns this mahafunc

**Execution Context** (available in mahafunc methods):
- `$` - Cheerio instance with loaded HTML
- `metadata` - Document frontmatter and metadata
- `dirty` - Flag indicating if DOM was modified
- `options` - Options passed from Configuration

## When To Use

Use the Mahabhuta system:

1. **Custom HTML Tags**: Implement domain-specific markup vocabulary
   ```html
   <youtube-video id="abc123" />
   ```

2. **Link Processing**: Modify links for deployment, add icons, relativize paths
   ```javascript
   class LinkProcessor extends ElementTweaker {
       selector() { return 'a[href]'; }
       async process($link, metadata, dirty) {
           // Modify link attributes
       }
   }
   ```

3. **Image Optimization**: Resize images, add lazy loading, generate responsive images

4. **Content Injection**: Insert dynamic content based on frontmatter or global data

5. **Accessibility Improvements**: Add ARIA attributes, alt text, semantic markup

6. **SEO Enhancements**: Generate structured data, meta tags, Open Graph markup

7. **Widget Insertion**: Embed third-party content (videos, maps, social media)

8. **Code Block Enhancement**: Add syntax highlighting, copy buttons, line numbers

9. **Table of Contents**: Generate navigation from heading structure

10. **Cross-References**: Link to related documents, show backlinks

**Do NOT use Mahabhuta for**:

1. **Initial Content Rendering**: Use template engines (EJS, Nunjucks) instead
2. **Frontmatter Processing**: Handle metadata in earlier rendering stages
3. **Heavy Computation**: Mahabhuta runs per-document; expensive operations slow rendering
4. **File I/O**: Load data before rendering or cache results

## Risks & Pitfalls

**Performance Impact**: Mahabhuta processes the entire DOM for every document (source: [lib/render.ts](../../lib/render.ts)). Expensive operations in mahafuncs multiply across all documents. Profile mahafunc execution times to identify bottlenecks.

**Selector Efficiency**: Inefficient selectors (e.g., `$('*')`) scan the entire DOM (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)). Use specific selectors and early returns:
```javascript
// SLOW: const links = $('*').filter('[href]');
// FAST: const links = $('a[href]');
```

**Order-Dependent Transformations**: Mahafuncs execute in registration order (source: [lib/index.ts](../../lib/index.ts)). If Mahafunc B depends on Mahafunc A's changes, register A first. Plugin registration order matters.

**DOM Mutation Tracking**: The `dirty` parameter tracks whether the DOM was modified. Setting `dirty.dirty = true` is critical for Mahabhuta to know serialization is needed. Forgetting this causes changes to be lost.

**Cheerio Limitations**: Cheerio is not a full browser environment:
- No CSS rendering or layout calculations
- No JavaScript execution
- Limited CSS selector support vs. real browsers
- Some HTML5 behaviors differ

**Async Operations**: Mahafuncs can be async, but excessive awaiting serializes execution (source: [lib/render.ts](../../lib/render.ts)). Batch async operations where possible:
```javascript
// SLOW: Multiple sequential awaits
for (const img of $('img')) {
    await processImage(img);
}

// FASTER: Parallel processing
await Promise.all($('img').map(async (i, img) => {
    await processImage(img);
}));
```

**Memory Leaks**: Cheerio instances hold the full DOM in memory. Processing very large documents (100MB+ HTML) can exhaust memory. Consider document size limits or streaming approaches for edge cases.

**HTML Serialization Quirks**: Cheerio's HTML serialization may differ slightly from input (e.g., self-closing tags, attribute order). Test critical HTML patterns.

**Plugin Conflicts**: Multiple plugins modifying the same elements can conflict (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)). Coordinate with plugin authors or use namespaced attributes/classes to avoid collisions.

**Error Handling**: Exceptions in mahafuncs propagate to the rendering pipeline (source: [lib/render.ts](../../lib/render.ts)). Always catch and handle errors gracefully:
```javascript
async process($element, metadata, dirty) {
    try {
        // DOM manipulation
    } catch (err) {
        console.error(`Mahafunc error:`, err);
        // Optionally leave element unmodified
    }
}
```

**Partial Rendering Recursion**: Using `<partial>` tags within partials can cause infinite recursion if not carefully designed. Mahabhuta doesn't prevent circular partial references.

## Sources

- [lib/mahafuncs.ts](../../lib/mahafuncs.ts) - Wrapper classes for Mahabhuta functions
- [lib/render.ts](../../lib/render.ts) - Mahabhuta integration in rendering pipeline
- [lib/index.ts](../../lib/index.ts) - Configuration and setup
- [AGENTS.md](../../AGENTS.md) - Mahabhuta description and context

## Related Pages

- [Three-Stage Rendering](./three-stage-rendering.md) - Mahabhuta as stage three
- [DOM Manipulation](./dom-manipulation.md) - DOM manipulation techniques
- [Custom Elements](./custom-elements.md) - Implementing custom HTML tags
- [Plugin System](./plugin-system.md) - How plugins register mahafuncs
- [Template Rendering](./template-rendering.md) - Stages one and two

## Backlinks

- [wiki/summaries/lib/mahafuncs.ts.md](../summaries/lib/mahafuncs.ts.md)
- [wiki/summaries/lib/render.ts.md](../summaries/lib/render.ts.md)
- [wiki/summaries/lib/index.ts.md](../summaries/lib/index.ts.md)
