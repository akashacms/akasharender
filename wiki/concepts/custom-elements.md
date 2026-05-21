---
title: "Custom Elements"
type: concept
Sources:
  - lib/mahafuncs.ts
  - lib/built-in.ts
  - lib/index.ts
Categories:
  - mahabhuta
  - dom-manipulation
  - extensibility
date-created: 2026-05-21T01:00:00+00:00
last-updated: 2026-05-21T01:00:00+00:00
confidence: high
---

# Custom Elements

## Definition

Custom Elements are Mahabhuta functions that replace custom HTML tags with generated content during the DOM manipulation phase of rendering. Implemented by extending the CustomElement base class and defining an `elementName` getter and `process()` method, custom elements allow plugins to add domain-specific tags like `<ak-stylesheets/>`, `<ak-teaser/>`, or `<fig-img/>` that are transformed into standard HTML during rendering (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts):57-72, [lib/built-in.ts](../../lib/built-in.ts):477-695).

## How It Works

The custom element system is built on Mahabhuta's DOM processing framework with AkashaRender-specific wrappers (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)):

**Base Class Structure**: AkashaRender provides a `CustomElement` class that wraps Mahabhuta's `MahaCustomElement` and adds convenient access to configuration, akasha, and plugin objects (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts):57-72):
```typescript
export class CustomElement extends MahaCustomElement {
    constructor(config: Configuration, akasha: any, plugin: Plugin) {
        super();
        this.#config = config;
        this.#akasha = akasha;
        this.#plugin = plugin;
    }
    get config(): Configuration { return this.#config; }
    get akasha(): any           { return this.#akasha; }
    get plugin(): Plugin        { return this.#plugin; }
}
```

**Implementation Pattern**: Plugins create custom element classes by extending CustomElement (source: [lib/built-in.ts](../../lib/built-in.ts)):
```typescript
class StylesheetsElement extends CustomElement {
    get elementName() { return "ak-stylesheets"; }
    async process($element, metadata, setDirty: Function, done?: Function) {
        // Generate and return replacement HTML
        return _doStylesheets(metadata, this.array.options, this.config);
    }
}
```

**Element Registration**: Custom elements are added to Mahabhuta arrays in plugin configuration (source: [lib/built-in.ts](../../lib/built-in.ts):277-304):
```typescript
ret.addMahafunc(new StylesheetsElement(config, akasha, plugin));
ret.addMahafunc(new InsertTeaser(config, akasha, plugin));
ret.addMahafunc(new FigureImage(config, akasha, plugin));
```

**Processing Flow**:
1. During DOM manipulation, Mahabhuta scans HTML for elements matching registered element names
2. When found, the custom element's `process()` method is called with the element, metadata, and dirty flag
3. The method returns replacement HTML as a string or Promise
4. Mahabhuta replaces the custom element with the returned HTML
5. Processing continues on the modified DOM

**Element Name Matching**: The `elementName` getter returns the tag name to match, like "ak-stylesheets" matches `<ak-stylesheets/>` (source: [lib/built-in.ts](../../lib/built-in.ts):478,487,496,546).

**Access to Context**: Through the wrapper class, custom elements have direct access to (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts):69-71):
- `this.config` - Configuration object with all settings
- `this.akasha` - Akasha API for rendering partials, etc.
- `this.plugin` - The plugin instance that created this element

**Async Processing**: The `process()` method is async, allowing database queries, file I/O, or rendering partials (source: [lib/built-in.ts](../../lib/built-in.ts):479,488,497,547).

**Built-in Examples** (source: [lib/built-in.ts](../../lib/built-in.ts)):
- `StylesheetsElement` - Replaces `<ak-stylesheets/>` with stylesheet link tags
- `HeaderJavaScript` - Replaces `<ak-headerJavaScript/>` with script tags for head
- `FooterJavaScript` - Replaces `<ak-footerJavaScript/>` with script tags for footer
- `InsertTeaser` - Replaces `<ak-teaser/>` with rendered teaser partial
- `FigureImage` - Replaces `<fig-img>` with HTML5 figure/img structure
- `ShowContent` - Replaces `<show-content/>` with rendered content from another document

## Key Parameters

**elementName (getter)**: Returns the HTML tag name to match, without angle brackets. Case-sensitive. (source: [lib/built-in.ts](../../lib/built-in.ts):478,487,496,546).

**$element**: Cheerio object representing the matched element, providing access to attributes via `$element.attr('attrname')` (source: [lib/built-in.ts](../../lib/built-in.ts):479,488,497,547).

**metadata**: Object containing document metadata from frontmatter plus rendering context like `metadata.document.renderTo` (source: [lib/built-in.ts](../../lib/built-in.ts):479,488,497,547).

**setDirty**: Function to call if the process modified the DOM and another processing pass is needed (source: [lib/built-in.ts](../../lib/built-in.ts):479,488).

**done**: Optional callback for completion (legacy pattern, prefer returning promises) (source: [lib/built-in.ts](../../lib/built-in.ts):479,488).

**Return value**: String of HTML to replace the element, or Promise resolving to such string (source: [lib/built-in.ts](../../lib/built-in.ts):480,489,498).

## When To Use

**Domain-Specific Markup**: Create custom tags for concepts specific to your content domain, like `<recipe-card>`, `<product-showcase>`, or `<author-bio>` (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Content Injection**: Replace placeholders with dynamically generated content like stylesheet lists, navigation menus, or related articles (source: [lib/built-in.ts](../../lib/built-in.ts):477-500).

**Partial Rendering**: Wrap partial template calls in custom elements to make them more semantic in source documents (source: [lib/built-in.ts](../../lib/built-in.ts):545-558).

**Attribute-Based Configuration**: Use element attributes to parameterize rendering, like `<fig-img src="/photo.jpg" width="800"/>` (source: [lib/built-in.ts](../../lib/built-in.ts):650-695).

**Plugin Features**: Expose plugin functionality through custom tags rather than requiring users to write template code (source: [lib/built-in.ts](../../lib/built-in.ts)).

## Risks & Pitfalls

**Tag Name Conflicts**: Multiple plugins could define elements with the same name. Use plugin-specific prefixes like `ak-`, `blog-`, `commerce-` to avoid collisions (source: [lib/built-in.ts](../../lib/built-in.ts):478,487,496).

**Invalid HTML Generation**: Ensure returned HTML is well-formed. Malformed HTML can break subsequent DOM processing (source: [lib/built-in.ts](../../lib/built-in.ts):480).

**Async Errors**: Unhandled promise rejections in process() will fail the entire rendering. Always use try-catch in async process methods (source: [lib/built-in.ts](../../lib/built-in.ts):548-557).

**Performance**: Complex custom elements that query databases or render many partials can slow rendering. Profile and optimize hot paths (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Self-Closing Tags**: Some template engines or HTML parsers handle self-closing tags differently. Test with both `<element/>` and `<element></element>` forms (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Dirty Flag**: If your element modifies the DOM structure and other elements should re-process, call `setDirty()`. Otherwise, changes might not be seen by other Mahafuncs (source: [lib/built-in.ts](../../lib/built-in.ts):479).

**Context Access**: The old pattern of accessing config via `this.array.options.config` still works but the new pattern using `this.config` is cleaner (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts):20-29, [lib/built-in.ts](../../lib/built-in.ts):480).

**Constructor Parameters**: Custom elements must be constructed with `(config, akasha, plugin)` parameters when added to Mahabhuta arrays (source: [lib/built-in.ts](../../lib/built-in.ts):285-296).

## Sources

- [lib/mahafuncs.ts](../../lib/mahafuncs.ts) - CustomElement wrapper class
- [lib/built-in.ts](../../lib/built-in.ts) - Multiple custom element implementations
- [lib/index.ts](../../lib/index.ts) - Configuration and plugin system

## Related Pages

- [Mahabhuta System](./mahabhuta-system.md) - DOM manipulation framework
- [DOM Manipulation](./dom-manipulation.md) - How DOM processing works
- [Plugin System](./plugin-system.md) - How plugins register custom elements
- [Built-in Plugin](./built-in-plugin.md) - Provides several custom elements
- [Template Rendering](./template-rendering.md) - First stage before DOM manipulation
- [Three-Stage Rendering](./three-stage-rendering.md) - Where custom elements fit in pipeline

## Backlinks
