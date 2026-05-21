---
title: "Image Resizing"
type: concept
Sources:
  - lib/built-in.ts
Categories:
  - images
  - responsive-design
  - optimization
date-created: 2026-05-21T00:00:00+00:00
last-updated: 2026-05-21T00:00:00+00:00
confidence: high
---

# Image Resizing

## Definition

Image Resizing is an automated system in AkashaRender's built-in plugin that generates responsive image variants at specified widths during the rendering process. Authors add special `resize-width` and `resize-to` attributes to `<img>` tags in source documents, which are processed by Mahabhuta DOM manipulation to queue resize operations that execute using the sharp library after HTML rendering completes (source: [lib/built-in.ts](../../lib/built-in.ts):43,166-273,714-730).

## How It Works

The image resizing system operates through a queued processing model spanning multiple rendering stages (source: [lib/built-in.ts](../../lib/built-in.ts)):

**Attribute Detection**: During DOM manipulation, the `ImageRewriter` Mahabhuta function scans for `<img>` tags with `resize-width` attributes (source: [lib/built-in.ts](../../lib/built-in.ts):697-731):
```html
<img src="/images/photo.jpg" resize-width="800" resize-to="/images/photo-800.jpg">
```

**Queue Addition**: When a resize attribute is detected, the operation is added to the plugin's resize queue rather than executed immediately (source: [lib/built-in.ts](../../lib/built-in.ts):718-721):
```typescript
this.config.plugin(pluginName)
    .addImageToResize(src, resizewidth, resizeto, metadata.document.renderTo);
```

**Attribute Manipulation**: After queuing, the DOM is modified (source: [lib/built-in.ts](../../lib/built-in.ts):723-730):
- If `resize-to` is specified, the `src` attribute is updated to point to the resized image path
- The `resize-width` and `resize-to` attributes are removed from the final HTML
- This ensures the rendered HTML contains only standard img attributes

**Deferred Execution**: After all documents are rendered, the `onSiteRendered()` hook processes the accumulated resize queue (source: [lib/built-in.ts](../../lib/built-in.ts):218-273).

**Queue Processing**: For each queued resize operation (source: [lib/built-in.ts](../../lib/built-in.ts):222-272):
1. **Resolve source path**: Converts relative paths to absolute using the document's location (source: [lib/built-in.ts](../../lib/built-in.ts):228-235)
2. **Find source file**: Searches assets cache, then documents cache for the original image (source: [lib/built-in.ts](../../lib/built-in.ts):239-245)
3. **Load with sharp**: Uses the sharp library to load the source image (source: [lib/built-in.ts](../../lib/built-in.ts):249)
4. **Resize**: Calls `img.resize()` with the target width, maintaining aspect ratio (source: [lib/built-in.ts](../../lib/built-in.ts):250)
5. **Compute destination**: Determines output path in render destination directory (source: [lib/built-in.ts](../../lib/built-in.ts):253-264)
6. **Create directory**: Ensures destination directory exists (source: [lib/built-in.ts](../../lib/built-in.ts):267)
7. **Write file**: Saves resized image to destination (source: [lib/built-in.ts](../../lib/built-in.ts):268)

**Error Handling**: If resizing fails, throws descriptive error with source file and resize parameters (source: [lib/built-in.ts](../../lib/built-in.ts):269-271).

## Key Parameters

**resize-width**: HTML attribute specifying target width in pixels. Height is calculated automatically to maintain aspect ratio (source: [lib/built-in.ts](../../lib/built-in.ts):683,715).

**resize-to** (optional): HTML attribute specifying the output path for the resized image. If omitted, uses the same path as the source (source: [lib/built-in.ts](../../lib/built-in.ts):684,716,723-726).

**src**: Standard img src attribute pointing to the original image. Can be relative or absolute path (source: [lib/built-in.ts](../../lib/built-in.ts):704,728-234).

**Resize queue**: Internal array (`#resize_queue`) storing pending resize operations as objects with `src`, `resizewidth`, `resizeto`, and `docPath` properties (source: [lib/built-in.ts](../../lib/built-in.ts):43,48,128,168,222-225).

**sharp library**: Node.js image processing library providing the actual resizing functionality (source: [lib/built-in.ts](../../lib/built-in.ts):24,249-250).

## When To Use

**Responsive Images**: Generate multiple image sizes for responsive web design, allowing browsers to load appropriately-sized images based on viewport (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Performance Optimization**: Automatically create smaller versions of large images to reduce page load times (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Thumbnails**: Generate thumbnail versions of full-size images for gallery pages or index listings (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Mobile Optimization**: Create mobile-friendly image sizes without manually processing images in external tools (source: [lib/built-in.ts](../../lib/built-in.ts)).

**Build-Time Processing**: Resize operations occur during site build rather than runtime, ensuring optimized images are ready when deployed (source: [lib/built-in.ts](../../lib/built-in.ts):222-272).

## Risks & Pitfalls

**Source File Must Exist**: Resize queue processing fails if the source image cannot be found in assets or documents cache. Ensure images are properly added to asset directories (source: [lib/built-in.ts](../../lib/built-in.ts):239-246).

**Queue Processing Timing**: Resizing happens in `onSiteRendered()` after all documents are rendered. If you need resized images earlier in the build process, this won't work (source: [lib/built-in.ts](../../lib/built-in.ts):218-273).

**No Format Conversion**: The resize operation maintains the source image format. It doesn't convert PNG to JPEG or vice versa. Use the sharp library directly if format conversion is needed (source: [lib/built-in.ts](../../lib/built-in.ts):249-250).

**Aspect Ratio Only**: Only width can be specified. The system maintains aspect ratio and calculates height automatically. For cropping or specific aspect ratios, use external tools (source: [lib/built-in.ts](../../lib/built-in.ts):250).

**No Caching**: Images are resized on every build even if source hasn't changed. For large sites with many images, this can slow build times. Consider external build tools with caching for production (source: [lib/built-in.ts](../../lib/built-in.ts):222-272).

**Path Resolution**: Relative paths are resolved relative to the document path, not the project root. Be careful with relative image paths in partials used across multiple documents (source: [lib/built-in.ts](../../lib/built-in.ts):228-232).

**Attribute Removal**: The resize attributes are removed from final HTML, so inspect source documents, not rendered output, to see resize configuration (source: [lib/built-in.ts](../../lib/built-in.ts):729-730).

**Overwrites Existing**: If a resized image already exists at the destination path, it will be silently overwritten (source: [lib/built-in.ts](../../lib/built-in.ts):268).

## Sources

- [lib/built-in.ts](../../lib/built-in.ts) - BuiltInPlugin with resize queue and ImageRewriter

## Related Pages

- [Built-in Plugin](./built-in-plugin.md) - Plugin providing image resizing
- [Mahabhuta System](./mahabhuta-system.md) - DOM manipulation framework
- [DOM Manipulation](./dom-manipulation.md) - How attributes are processed
- [Three-Stage Rendering](./three-stage-rendering.md) - When resizing occurs in pipeline

## Backlinks
