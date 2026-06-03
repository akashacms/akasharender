---
title: "Link Relativization"
type: concept
Sources:
  - lib/built-in.ts
Categories:
  - urls
  - links
  - configuration
date-created: 2026-05-21T00:00:00+00:00
last-updated: 2026-05-21T00:00:00+00:00
confidence: high
---

# Link Relativization

## Definition

Link Relativization is the automatic transformation of absolute local URLs (starting with `/`) into relative URLs during HTML rendering. AkashaRender converts links like `/css/style.css` in source documents into relative paths like `../../css/style.css` based on the rendered document's location in the output hierarchy, allowing generated websites to work correctly when deployed to subdirectories or served from the filesystem (source: [lib/built-in.ts](../../lib/built-in.ts):56-64,132-151,347-361,928-933).

## How It Works

The transformation is controlled by three independent boolean options in the Built-in Plugin, each targeting a different HTML element type (source: [lib/built-in.ts](../../lib/built-in.ts)):

**Stylesheet Links** (`relativizeHeadLinks`, default: true):
- Applies to `<link rel="stylesheet">` tags in the document head
- Transforms absolute `href` attributes using the `relative()` function
- Example: `/css/style.css` becomes `../../css/style.css` for a document at `blog/2024/post.html`
- Implementation in stylesheet Nunjucks extension (source: [lib/built-in.ts](../../lib/built-in.ts):347-361)

**Script Tags** (`relativizeScriptLinks`, default: true):
- Applies to `<script>` tags for JavaScript files
- Transforms absolute `src` attributes
- Example: `/js/app.js` becomes `../../js/app.js`
- Implementation in JavaScript Nunjucks extensions (source: [lib/built-in.ts](../../lib/built-in.ts):436-437)

**Anchor Tags** (`relativizeBodyLinks`, default: true):
- Applies to `<a>` tags in document body
- Transforms absolute `href` attributes
- Example: `/about.html` becomes `../about.html`
- Implementation in AnchorCleanup Mahabhuta function (source: [lib/built-in.ts](../../lib/built-in.ts):928-933)

**Detection of Local URLs**: Before transforming, the system must identify which URLs are local (source: [lib/built-in.ts](../../lib/built-in.ts)):
1. URLs are parsed to extract origin and pathname
2. Local URLs have origin `http://example.com` (internal placeholder) or start with `/`
3. Only absolute local paths (starting with `/`) are transformed
4. Already-relative paths and external URLs are left unchanged

**Relative Path Calculation**: Uses the `relative` npm package to compute the relative path from the rendered document's location to the target URL (source: [lib/built-in.ts](../../lib/built-in.ts):29,358,930):
```typescript
let newHref = relative(`/${metadata.document.renderTo}`, href);
```

**Metadata Dependency**: The transformation requires `metadata.document.renderTo` which contains the output path of the current document (source: [lib/built-in.ts](../../lib/built-in.ts):358,930).

## Key Parameters

**relativizeHeadLinks** (default: true): Boolean controlling transformation of `<link>` tags in document head (source: [lib/built-in.ts](../../lib/built-in.ts):56-58,134-136).

**relativizeScriptLinks** (default: true): Boolean controlling transformation of `<script>` tags (source: [lib/built-in.ts](../../lib/built-in.ts):59-61,142-144).

**relativizeBodyLinks** (default: true): Boolean controlling transformation of `<a>` tags in body (source: [lib/built-in.ts](../../lib/built-in.ts):62-64,150-152).

**metadata.document.renderTo**: String containing the output path of the document being rendered, used as the base for relative path calculation (source: [lib/built-in.ts](../../lib/built-in.ts):358,930).

**path.isAbsolute()**: Node.js function used to test if a URL path starts with `/` and therefore needs transformation (source: [lib/built-in.ts](../../lib/built-in.ts):348,929).

## When To Use

**Subdirectory Deployment**: Enable relativization (default) when websites will be deployed to subdirectories rather than domain roots. For example, GitHub Pages project sites at `username.github.io/projectname/` (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Filesystem Browsing**: Relative links allow HTML files to be opened directly from the filesystem (e.g., `file:///path/to/site/index.html`) with working navigation (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Portable Sites**: Relative links make generated sites portable - they can be moved to different server paths without breaking internal links (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Disable for Absolute URLs**: Set options to false when you need absolute paths, such as for sites deployed to domain roots where you want canonical URLs, or when working with CDNs (source: [lib/built-in.ts](../../lib/built-in.ts):56-64).

**Selective Control**: The three separate options allow fine-grained control. For example, relativize body links for navigation but use absolute paths for stylesheet CDN URLs (source: [lib/built-in.ts](../../lib/built-in.ts):56-64).

## Risks & Pitfalls

**Base URL Confusion**: Relative links can be confusing during development. When viewing `blog/post.html`, a link `../css/style.css` references `css/style.css`, not `blog/css/style.css` (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Search Engine Optimization**: Some SEO tools prefer absolute URLs for canonical references. Consider disabling relativization for production sites at domain roots (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Mixed Content**: If some links are relative and others absolute, it can create inconsistent behavior. Choose a consistent strategy (source: [lib/built-in.ts](../../lib/built-in.ts)).

**External URL Detection**: The system must correctly distinguish local from external URLs. If URL parsing fails, external links might be incorrectly treated as local (source: [lib/built-in.ts](../../lib/built-in.ts):336-362).

**Template Engine Dependency**: Stylesheet and JavaScript relativization only works in Nunjucks templates through custom extensions. Other template engines would need different implementations (source: [lib/built-in.ts](../../lib/built-in.ts):90-98).

**Absolute Paths in Source**: Authors must use absolute paths like `/images/photo.jpg` in source documents for relativization to work. Paths like `images/photo.jpg` are already relative and won't be transformed (source: [lib/built-in.ts](../../lib/built-in.ts):348,929).

**Performance**: Each link transformation requires string manipulation and path calculation. For documents with many links, this adds processing overhead (source: [lib/built-in.ts](../../lib/built-in.ts)).

## Sources

- [lib/built-in.ts](../../lib/built-in.ts) - BuiltInPlugin implementation with relativization logic

## Related Pages

- [Built-in Plugin](./built-in-plugin.md) - Plugin providing this functionality
- [Mahabhuta System](./mahabhuta-system.md) - DOM processing framework
- [Nunjucks Extensions](./nunjucks-extensions.md) - Template engine extensions for stylesheets and scripts
- [Three-Stage Rendering](./three-stage-rendering.md) - When relativization occurs in the rendering pipeline

## Backlinks
