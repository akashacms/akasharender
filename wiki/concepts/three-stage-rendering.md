---
title: "Three-Stage Rendering"
type: concept
Categories:
  - rendering
  - architecture
  - pipeline
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# Three-Stage Rendering

## Definition

Three-Stage Rendering is AkashaRender's document processing pipeline that transforms source documents into final HTML output through three distinct phases: initial rendering, layout application, and DOM manipulation.

## How It Works

The rendering pipeline is implemented in `lib/render.ts` (source: [lib/render.ts](../summaries/lib/render.ts.md)) and executes these stages:

### Stage 1: First Render
The document content is rendered using its primary renderer based on file extension:
- Markdown files (`.html.md`) are converted to HTML
- EJS templates (`.html.ejs`) are evaluated
- Nunjucks templates (`.html.njk`) are rendered
- Other template formats are processed by their respective renderers

Frontmatter metadata is extracted and made available to the renderer. The result is HTML content without any page structure.

### Stage 2: Layout Render
If the document specifies a layout in its frontmatter, the first-stage output is wrapped in the layout template:
- The layout is looked up in the layouts cache
- Content from stage 1 is passed as the `content` variable
- Metadata is merged with layout metadata
- Layouts can be nested (a layout can itself have a layout)

If no layout is specified, this stage is skipped.

### Stage 3: Mahabhuta Pass
The HTML from stage 2 (or stage 1 if no layout) is loaded into Cheerio and processed by Mahabhuta functions:
- Custom HTML elements are transformed (e.g., `<embed-video>` becomes an iframe)
- DOM manipulation functions modify the HTML tree
- Links are processed and potentially relativized
- Metadata tags are inserted
- Any registered Mahabhuta functions from plugins run

The final HTML is written to the output directory.

## Key Parameters

- **config** - Configuration object containing renderers, layouts, and Mahabhuta functions
- **docInfo** - Document information from the cache including metadata and paths
- **concurrency** - Number of documents to render in parallel (configurable via `config.concurrency`)

## When To Use

This three-stage pipeline is used automatically for all document rendering operations:
- Full site rendering via `render(config)`
- Single document rendering via `renderDocument(config, docInfo)`
- Watch mode re-rendering via `watchman`

Special cases bypass some stages (source: [lib/render.ts](../summaries/lib/render.ts.md)):
- CSS files skip layout and Mahabhuta stages
- Assets are copied without any rendering

## Risks & Pitfalls

- **Performance**: Three passes over content can be slow for large sites; use concurrency to parallelize
- **Stage confusion**: Understanding which stage processes what can be unclear; metadata available differs by stage
- **Mahabhuta order**: DOM manipulation functions run in plugin order; dependencies between functions require careful ordering
- **Async complexity**: All stages support async operations which adds complexity but enables flexibility

## Sources

- [lib/render.ts](../summaries/lib/render.ts.md)
- [lib/index.ts](../summaries/lib/index.ts.md)

## Related Pages

- [Rendering Pipeline](./rendering-pipeline.md)
- [Mahabhuta System](./mahabhuta-system.md)
- [Layout Templates](./layout-templates.md)
- [Template Rendering](./template-rendering.md)

## Backlinks

