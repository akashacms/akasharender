---
title: "Nunjucks Extensions"
type: concept
Sources:
  - lib/built-in.ts
Categories:
  - templates
  - nunjucks
  - customization
date-created: 2026-05-21T00:00:00+00:00
last-updated: 2026-05-21T00:00:00+00:00
confidence: high
---

# Nunjucks Extensions

## Definition

Nunjucks Extensions are custom template tags added to the Nunjucks template engine that provide specialized functionality beyond Nunjucks' built-in features. AkashaRender's built-in plugin adds three custom extensions - `akstylesheets`, `akheaderjs`, and `akfooterjs` - that automatically inject CSS stylesheet and JavaScript references into rendered HTML based on configuration settings and document metadata (source: [lib/built-in.ts](../../lib/built-in.ts):90-98,1068-1180).

## How It Works

Nunjucks extensions are implemented as classes with specific methods that Nunjucks calls during template processing (source: [lib/built-in.ts](../../lib/built-in.ts)):

**Extension Registration**: During plugin configuration, extensions are added to the Nunjucks environment (source: [lib/built-in.ts](../../lib/built-in.ts):89-99):
```typescript
const njk = this.config.findRendererName('.html.njk') as Renderers.NunjucksRenderer;
njk.njkenv().addExtension('akstylesheets',
    new stylesheetsExtension(this.config, this, njk)
);
```

**Extension Structure**: Each extension class implements (source: [lib/built-in.ts](../../lib/built-in.ts):1068-1180):
- `tags` property: Array of tag names recognized by this extension
- `parse()` method: Called when Nunjucks encounters the tag during template parsing
- `run()` method: Called when the tag is executed during rendering

**Tag Syntax**: Extensions use block syntax with start and end tags (source: [lib/built-in.ts](../../lib/built-in.ts):1095,1132,1166):
```nunjucks
{% akstylesheets %}{% endakstylesheets %}
{% akheaderjs %}{% endakheaderjs %}
{% akfooterjs %}{% endakfooterjs %}
```

**The Three Extensions**:

1. **stylesheetsExtension** (`akstylesheets`): Generates `<link rel="stylesheet">` tags (source: [lib/built-in.ts](../../lib/built-in.ts):1068-1110)
   - Calls `plugin.doStylesheets(context.ctx)` which invokes `_doStylesheets()`
   - Reads stylesheet configuration from `config.scripts.stylesheets`
   - Can be augmented per-document via `metadata.headerStylesheetsAdd`
   - Applies link relativization if enabled
   - Outputs HTML string of `<link>` tags

2. **headerJavaScriptExtension** (`akheaderjs`): Generates `<script>` tags for document head (source: [lib/built-in.ts](../../lib/built-in.ts):1112-1144)
   - Calls `plugin.doHeaderJavaScript(context.ctx)`
   - Reads from `config.scripts.javaScriptTop`
   - Can be augmented per-document via `metadata.headerJavaScriptAddTop`
   - Applies script relativization if enabled

3. **footerJavaScriptExtension** (`akfooterjs`): Generates `<script>` tags for end of body (source: [lib/built-in.ts](../../lib/built-in.ts):1146-1180)
   - Calls `plugin.doFooterJavaScript(context.ctx)`
   - Reads from `config.scripts.javaScriptBottom`
   - Can be augmented per-document via `metadata.headerJavaScriptAddBottom`
   - Applies script relativization if enabled

**Context Access**: The `run()` method receives the template context as `context.ctx`, providing access to document metadata and configuration (source: [lib/built-in.ts](../../lib/built-in.ts):1106-1108,1140-1142).

**HTML Generation**: Extension functions build HTML strings manually using template literals with proper encoding via the `encode()` function to prevent XSS vulnerabilities (source: [lib/built-in.ts](../../lib/built-in.ts):315-403,405-480).

**Verification**: The built-in plugin verifies extensions were properly installed using `njk.njkenv().hasExtension()`, throwing an error if any are missing (source: [lib/built-in.ts](../../lib/built-in.ts):101-109).

## Key Parameters

**Extension tag names**: 'akstylesheets', 'akheaderjs', 'akfooterjs' - the custom tags available in Nunjucks templates (source: [lib/built-in.ts](../../lib/built-in.ts):1074,1118,1152).

**config.scripts.stylesheets**: Array of stylesheet objects with `href` and optional `media` properties (source: [lib/built-in.ts](../../lib/built-in.ts):319-323).

**config.scripts.javaScriptTop**: Array of JavaScript items for document head (source: [lib/built-in.ts](../../lib/built-in.ts)).

**config.scripts.javaScriptBottom**: Array of JavaScript items for end of body (source: [lib/built-in.ts](../../lib/built-in.ts)).

**metadata.headerStylesheetsAdd**: Per-document array to add extra stylesheets (source: [lib/built-in.ts](../../lib/built-in.ts):319).

**metadata.headerJavaScriptAddTop**: Per-document array to add extra header scripts (source: [lib/built-in.ts](../../lib/built-in.ts)).

**metadata.headerJavaScriptAddBottom**: Per-document array to add extra footer scripts (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Relativization options**: Built-in plugin's `relativizeHeadLinks` and `relativizeScriptLinks` control URL transformation (source: [lib/built-in.ts](../../lib/built-in.ts):347,437).

## When To Use

**Layout Templates**: Use these extensions in layout templates to automatically inject stylesheets and scripts configured at the project level (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Consistent Asset Loading**: Instead of manually adding `<link>` and `<script>` tags to every layout, use extensions to centralize asset management (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Per-Document Customization**: Add document-specific assets by setting metadata fields like `headerStylesheetsAdd` in frontmatter (source: [lib/built-in.ts](../../lib/built-in.ts):319).

**Nunjucks Templates Only**: These extensions work exclusively in Nunjucks (.njk) templates. For EJS or Handlebars layouts, use different mechanisms (source: [lib/built-in.ts](../../lib/built-in.ts):89).

**Automatic Relativization**: When combined with relativization options, extensions handle complex URL transformations automatically (source: [lib/built-in.ts](../../lib/built-in.ts):347-361).

## Risks & Pitfalls

**Nunjucks-Specific**: Extensions only work with Nunjucks templates. Projects using other template engines must implement similar functionality differently (source: [lib/built-in.ts](../../lib/built-in.ts):89-99).

**Must Use Correct Syntax**: Missing the end tag (`{% endakstylesheets %}`) causes template parsing errors (source: [lib/built-in.ts](../../lib/built-in.ts):1095,1132,1166).

**Context Dependency**: Extensions depend on `context.ctx` containing proper metadata. If context is malformed, extensions may fail (source: [lib/built-in.ts](../../lib/built-in.ts):1108,1142).

**Manual HTML Construction**: The extension functions build HTML strings rather than using DOM manipulation, which could lead to XSS if encoding is not applied properly (source: [lib/built-in.ts](../../lib/built-in.ts):371).

**Registration Timing**: Extensions must be added during plugin configuration, before any template rendering occurs (source: [lib/built-in.ts](../../lib/built-in.ts):90-98).

**Silent Output**: Extensions return HTML strings that are inserted into templates. There's no visual indication in template source where assets will appear - you must know the extension's behavior (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Error Handling**: Parse errors are logged to console but may not provide clear feedback about what went wrong (source: [lib/built-in.ts](../../lib/built-in.ts):1102,1136).

**Configuration Complexity**: The interaction between global configuration, per-document metadata, and relativization settings can be complex to reason about (source: [lib/built-in.ts](../../lib/built-in.ts):315-403).

## Sources

- [lib/built-in.ts](../../lib/built-in.ts) - Extension implementations and registration

## Related Pages

- [Built-in Plugin](./built-in-plugin.md) - Plugin providing these extensions
- [Link Relativization](./link-relativization.md) - URL transformation applied by extensions
- [Template Rendering](./template-rendering.md) - Template processing pipeline
- [Configuration Class](./configuration-class.md) - Where stylesheet and JavaScript arrays are configured

## Backlinks
