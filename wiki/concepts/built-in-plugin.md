---
title: "Built-in Plugin"
type: concept
Sources:
  - lib/built-in.ts
  - lib/index.ts
Categories:
  - plugins
  - core-functionality
  - dom-manipulation
date-created: 2026-05-21T00:00:00+00:00
last-updated: 2026-05-21T00:00:00+00:00
confidence: high
---

# Built-in Plugin

## Definition

The Built-in Plugin is a special plugin automatically added to every AkashaRender configuration that provides core functionality essential for rendering websites. Unlike optional plugins that users explicitly add with `config.use()`, the built-in plugin is added internally during `Configuration.prepare()` and is positioned last in the plugin chain so its templates and functionality can be easily overridden by user code and other plugins (source: [lib/built-in.ts](../../lib/built-in.ts):38-123, [lib/index.ts](../../lib/index.ts)).

## How It Works

The built-in plugin is implemented as the `BuiltInPlugin` class extending the standard `Plugin` base class (source: [lib/built-in.ts](../../lib/built-in.ts):40-123):

**Automatic Registration**: During configuration preparation, AkashaRender automatically instantiates and adds the built-in plugin without requiring user action (source: [lib/index.ts](../../lib/index.ts)).

**Template Directories**: Adds default directories for layouts and partials from the `layouts/` and `partials/` folders bundled with AkashaRender (source: [lib/built-in.ts](../../lib/built-in.ts):67-68).

**Mahabhuta Integration**: Registers multiple Mahabhuta function arrays for DOM processing (source: [lib/built-in.ts](../../lib/built-in.ts)):
- `mahaMetadata` - Metadata handling for title, description, Open Graph tags, etc.
- `mahaPartial` - Partial template processing (registered in Configuration constructor for proper ordering)
- Custom Mahabhuta array with 20+ DOM processors and custom elements

**Nunjucks Extensions**: Adds three custom Nunjucks extensions to the template engine (source: [lib/built-in.ts](../../lib/built-in.ts):90-98):
- `akstylesheets` - Injects CSS stylesheet references into templates
- `akheaderjs` - Injects JavaScript references for the document head
- `akfooterjs` - Injects JavaScript references for the document footer

**Link Relativization Control**: Provides three configurable options controlling whether local URLs are converted to relative or absolute paths (source: [lib/built-in.ts](../../lib/built-in.ts):56-64,134-151):
- `relativizeHeadLinks` - Controls `<link>` tags in `<head>` (default: true)
- `relativizeScriptLinks` - Controls `<script>` tags (default: true)
- `relativizeBodyLinks` - Controls `<a>` tags in body (default: true)

**Image Resizing**: Maintains an internal queue for image resize operations using the sharp library to generate responsive image variants (source: [lib/built-in.ts](../../lib/built-in.ts):24,43,128).

**Code Highlighting**: Integrates highlight.js for syntax highlighting of code blocks (source: [lib/built-in.ts](../../lib/built-in.ts):30).

## Key Parameters

**pluginName**: Always "akashacms-builtin" to identify this plugin (source: [lib/built-in.ts](../../lib/built-in.ts):38).

**options.relativizeHeadLinks** (default: true): Boolean controlling link relativization in document head (source: [lib/built-in.ts](../../lib/built-in.ts):56-58).

**options.relativizeScriptLinks** (default: true): Boolean controlling script tag relativization (source: [lib/built-in.ts](../../lib/built-in.ts):59-61).

**options.relativizeBodyLinks** (default: true): Boolean controlling anchor tag relativization in body (source: [lib/built-in.ts](../../lib/built-in.ts):62-64).

**resizequeue**: Internal array tracking pending image resize operations (source: [lib/built-in.ts](../../lib/built-in.ts):43,128).

**config**: Reference to the Configuration instance, provided during configure() (source: [lib/built-in.ts](../../lib/built-in.ts):47,50-51,125).

## When To Use

**Automatic Use**: Users don't explicitly "use" the built-in plugin - it's automatically present in every AkashaRender project (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Override Templates**: To customize default layouts or partials, add your own directories earlier in the configuration. The stacked directory system will use your versions instead of the built-in defaults (source: [lib/built-in.ts](../../lib/built-in.ts):67-68).

**Configure Link Behavior**: Set the relativize options to control whether your site uses relative or absolute URLs for local resources (source: [lib/built-in.ts](../../lib/built-in.ts):56-64).

**Extend Core Functionality**: Understanding what the built-in plugin provides helps when writing other plugins - you can rely on metadata handling, partial processing, and stylesheet/JavaScript injection being available (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Image Resizing**: The resize queue is populated by Mahabhuta functions during DOM processing and executed during the rendering pipeline (source: [lib/built-in.ts](../../lib/built-in.ts):128).

## Risks & Pitfalls

**Cannot Remove**: The built-in plugin is always present and cannot be removed or disabled. If you don't want certain built-in functionality, you must work around it (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Template Override Order**: Because the built-in plugin is added last, its templates have lowest priority. This is intentional, but if you're having trouble with template resolution, remember built-in templates exist as fallbacks (source: [lib/built-in.ts](../../lib/built-in.ts):67-68).

**Dependency on Mahabhuta**: Many core features depend on the Mahabhuta DOM manipulation system. If Mahabhuta processing fails, essential functionality may not work (source: [lib/built-in.ts](../../lib/built-in.ts):80-87).

**Nunjucks-Specific Extensions**: The stylesheet and JavaScript injection extensions only work with Nunjucks templates, not with EJS, Handlebars, or other template engines (source: [lib/built-in.ts](../../lib/built-in.ts):89-99).

**Extension Verification**: The plugin verifies that Nunjucks extensions were properly installed, throwing an error if any are missing. This protects against configuration issues but could cause setup to fail unexpectedly (source: [lib/built-in.ts](../../lib/built-in.ts):101-109).

**Complex Codebase**: The built-in.ts file is 1,218 lines long with 20+ Mahabhuta function classes, making it challenging to understand or debug (source: [lib/built-in.ts](../../lib/built-in.ts)).

## Sources

- [lib/built-in.ts](../../lib/built-in.ts) - BuiltInPlugin implementation
- [lib/index.ts](../../lib/index.ts) - Configuration.prepare() adds built-in plugin

## Related Pages

- [Plugin System](./plugin-system.md) - How plugins extend AkashaRender
- [Mahabhuta System](./mahabhuta-system.md) - DOM manipulation framework used by built-in plugin
- [Link Relativization](./link-relativization.md) - URL transformation controlled by built-in plugin
- [Image Resizing](./image-resizing.md) - Responsive image generation
- [Nunjucks Extensions](./nunjucks-extensions.md) - Custom template engine extensions
- [Stacked Directories](./stacked-directories.md) - How template override works

## Backlinks
