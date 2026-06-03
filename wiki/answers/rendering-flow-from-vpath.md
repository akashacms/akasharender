---
title: "Detailed Flow for Rendering a Single Page from vpath"
type: answer
Sources:
  - lib/render.ts
  - wiki/concepts/three-stage-rendering.md
  - wiki/summaries/lib/render.ts.md
Categories:
  - rendering
  - pipeline
  - workflow
date-created: 2026-05-21T04:30:00Z
last-updated: 2026-05-21T04:30:00Z
confidence: high
---

# Detailed Flow for Rendering a Single Page from vpath

## Query

What is the detailed flow for rendering a single page starting from its vpath?

## Answer

The rendering flow transforms a virtual path (vpath) like `blog/my-post.html.md` into a final HTML file through document lookup, format detection, three-stage rendering (first render, layout, Mahabhuta), and filesystem output. The process is orchestrated by `renderDocument2()` in lib/render.ts and involves SQLite cache queries, template rendering via @akashacms/renderers, and DOM manipulation via Mahabhuta.

### Complete Step-by-Step Flow

#### 1. Input: vpath (virtual path)
Example: `blog/my-post.html.md`

(source: [lib/render.ts](../../lib/render.ts):346)

#### 2. Document Lookup
```typescript
const docInfo = await documents.find(vpath);
```

Queries the DocumentsCache (SQLite database) and returns a `Document` object containing (source: [lib/render.ts](../../lib/render.ts):772):
- `vpath`: Virtual path
- `fspath`: Filesystem path
- `renderPath`: Output path (e.g., `blog/my-post.html`)
- `docContent`: Full file content with frontmatter
- `docBody`: Content without frontmatter
- `metadata`: Parsed frontmatter + computed metadata
- `mountPoint`: Source directory

#### 3. Create RenderingData Object
```typescript
const ret = createRenderingData(config, docInfo);
```

Creates master object to track all rendering state (source: [lib/render.ts](../../lib/render.ts):352):
- Finds appropriate renderer based on file extension
- Creates `renderFirstContext` with fspath, content, body, metadata
- Initializes `RenderingResults` with performance tracking fields

#### 4. Branch by Format

The renderer determines the format and branches accordingly (source: [lib/render.ts](../../lib/render.ts):355-363):

**If CSS file:**
- Call `renderCSSFile()` → write to output
- Skip layout and Mahabhuta stages
- Return early

**If non-HTML asset:**
- Call `copyAssetFile()` → copy to output
- Skip all rendering stages
- Return early

**If HTML (Markdown, EJS, Nunjucks, etc.):**
- Continue to three-stage pipeline

#### 5. Stage 1: First Render

(source: [lib/render.ts](../../lib/render.ts):379-400)

```typescript
ret.results.renderFirstStart = performance.now();

// Add helper functions to metadata
ret.renderFirstContext.metadata.config = config;
ret.renderFirstContext.metadata.partial = doPartial;
ret.renderFirstContext.metadata.partialSync = doPartialSync;
ret.renderFirstContext.metadata.akasha = config.akasha;
ret.renderFirstContext.metadata.plugin = config.plugin;

// Render using appropriate renderer
ret.renderedFirst = await ret.renderer.render(ret.renderFirstContext);

ret.results.renderFirstEnd = performance.now();
```

**What happens:**
- Markdown → HTML conversion (via markdown-it)
- EJS/Nunjucks templates evaluated
- Frontmatter metadata available as variables
- Partials can be called via `partial()` function
- Output: Raw HTML content (no page structure)

**Record trace:** `data.report(mountPoint, vpath, renderTo, "FIRST RENDER", start)` (source: [lib/render.ts](../../lib/render.ts):589-592)

#### 6. Stage 2: Layout Render

(source: [lib/render.ts](../../lib/render.ts):402-463)

```typescript
ret.results.renderLayoutStart = performance.now();

if (ret?.docInfo?.metadata?.layout) {
    // 1. Find layout file
    const found = await layouts.find(ret.docInfo.metadata.layout);
    
    // 2. Get renderer for layout
    const renderer = config.findRendererPath(ret.docInfo.metadata.layout);
    
    // 3. Create layout context
    ret.renderLayoutContext = {
        fspath: ret.docInfo.metadata.layout,
        content: found.docContent,
        body: found.docBody,
        metadata: { ...found.metadata, ...ret.docInfo.metadata }
    };
    
    // 4. Pass rendered content as 'content' variable
    ret.renderLayoutContext.metadata.content = ret.renderedFirst;
    
    // 5. Render layout
    ret.renderedLayout = await renderer.render(ret.renderLayoutContext);
}

ret.results.renderLayoutEnd = performance.now();
```

**What happens:**
- Look up layout file from `layoutsCache` (e.g., `page.html.ejs`)
- Merge layout metadata with document metadata (document wins)
- Inject first-stage HTML as `content` variable
- Render layout template around content
- Layouts can be nested (layout can have its own layout)
- Output: HTML with page structure

**If no layout specified:** Skip this stage, use `renderedFirst` as output

#### 7. Stage 3: Mahabhuta DOM Processing

(source: [lib/render.ts](../../lib/render.ts):465-509)

```typescript
ret.results.renderMahaStart = performance.now();

ret.renderMahaContext = {
    fspath: ret.docInfo.metadata.layout,
    content: ret.renderedLayout || ret.renderedFirst,
    body: ret.renderedLayout || ret.renderedFirst,
    metadata: { ...ret.docInfo.metadata }
};

// Process with Mahabhuta
ret.renderedMaha = await mahabhuta.processAsync(
    ret.renderMahaContext.content,
    ret.renderMahaContext.metadata,
    ret.config.mahafuncs,  // Array of custom element processors
    perfDataStore,         // Optional performance tracking
    ret.docInfo.vpath
);

ret.results.renderMahaEnd = performance.now();
```

**What happens:**
- HTML loaded into Cheerio (jQuery-like DOM)
- Each Mahabhuta function processes the DOM:
  - Custom elements transformed (e.g., `<embed-video>` → `<iframe>`)
  - Links relativized
  - Metadata tags inserted
  - Images processed
  - Plugin-specific DOM manipulation
- Output: Final processed HTML

#### 8. Write to Output

(source: [lib/render.ts](../../lib/render.ts):511-522)

```typescript
const renderDest = path.join(config.renderTo, ret.docInfo.renderPath);
await fsp.mkdir(path.dirname(renderDest), { recursive: true });
await fsp.writeFile(renderDest, ret.renderedMaha, 'utf-8');
```

**What happens:**
- Create output directory structure if needed
- Write final HTML to `renderTo/renderPath`
- Example: `out/blog/my-post.html`

#### 9. Performance Tracking

(source: [lib/render.ts](../../lib/render.ts):526-538)

```typescript
ret.results.renderFirstElapsed = renderFirstEnd - renderFirstStart;
ret.results.renderLayoutElapsed = renderLayoutEnd - renderLayoutStart;
ret.results.renderMahaElapsed = renderMahaEnd - renderMahaStart;
ret.results.renderTotalElapsed = renderEnd - renderStart;
```

Calculates elapsed time in milliseconds for each stage and total rendering time.

#### 10. Return Results

```typescript
return ret.results;  // RenderingResults object
```

Contains (source: [lib/render.ts](../../lib/render.ts):45-71):
- `vpath`, `renderPath`
- Timing data for each stage
- Any errors encountered
- Format information

### Visual Flow Diagram

```
vpath → DocumentsCache.find()
         ↓
    Document object
         ↓
    createRenderingData()
         ↓
    Branch by format
         ├─ CSS → renderCSSFile() → Write → Done
         ├─ Asset → copyAssetFile() → Done
         └─ HTML ↓

    STAGE 1: First Render (performance.now())
         ├─ Load docContent + metadata
         ├─ Select renderer (Markdown/EJS/Nunjucks)
         ├─ Add helpers (partial, config, akasha)
         └─ renderer.render() → Raw HTML
         
    STAGE 2: Layout Render (if layout specified)
         ├─ Find layout in layoutsCache
         ├─ Merge metadata (document overrides layout)
         ├─ Inject content from Stage 1
         └─ renderer.render() → HTML with page structure
         
    STAGE 3: Mahabhuta
         ├─ Load HTML into Cheerio DOM
         ├─ Process each mahafunc in order
         │   ├─ Transform custom elements
         │   ├─ Relativize links
         │   └─ Plugin DOM manipulations
         └─ mahabhuta.processAsync() → Final HTML
         
    Write to filesystem
         ├─ mkdir renderTo/dirname(renderPath)
         └─ writeFile renderTo/renderPath
         
    Return RenderingResults
```

### Key Data Structures

**RenderingContext** (passed to each stage):
```typescript
{
    fspath: string,       // File path for error messages
    content: string,      // Full content to render
    body: string,         // Body without frontmatter
    metadata: object      // All metadata + helpers
}
```

(source: [lib/render.ts](../../lib/render.ts):569-574, [@akashacms/renderers](https://github.com/akashacms/rendering-engines))

**RenderingResults** (returned):
```typescript
{
    vpath: string,
    renderPath: string,
    renderFormat: string,
    renderFirstElapsed: number,   // ms
    renderLayoutElapsed: number,  // ms  
    renderMahaElapsed: number,    // ms
    renderTotalElapsed: number,   // ms
    errors: Array<Error>
}
```

(source: [lib/render.ts](../../lib/render.ts):45-71)

### Special Cases

1. **No Layout**: Skip Stage 2, go directly from Stage 1 to Stage 3
2. **CSS Files**: Only Stage 1, no layout or Mahabhuta (source: [lib/render.ts](../../lib/render.ts):597-604)
3. **Assets**: No rendering, direct copy (source: [lib/render.ts](../../lib/render.ts):606-613)
4. **Nested Layouts**: Layout can specify its own layout, recursively processed
5. **Error Handling**: Each stage has try/catch, errors collected in `results.errors` array, rendering continues with fallback content (source: [lib/render.ts](../../lib/render.ts):392-397, 453-459, 500-506)

### Performance Considerations

- Each stage is timed using `performance.now()` for microsecond precision
- Timing data stored in TRACES table via `data.report()` calls (source: [wiki/concepts/performance-tracing.md](../concepts/performance-tracing.md))
- Rendering can be parallelized across multiple documents using fastq queue with configurable concurrency (source: [lib/render.ts](../../lib/render.ts):738-809)
- Mahabhuta processing can optionally write performance data to `FilesystemPerfDataStore` if `config.perfDataDir` is set (source: [lib/render.ts](../../lib/render.ts):493-498)

## Related Pages

- [Three-Stage Rendering](../concepts/three-stage-rendering.md): Concept overview of the rendering pipeline
- [Rendering Pipeline](../concepts/rendering-pipeline.md): Site-wide rendering orchestration
- [Mahabhuta System](../concepts/mahabhuta-system.md): DOM manipulation stage
- [Performance Tracing](../concepts/performance-tracing.md): Timing data collection
- [lib/render.ts](../summaries/lib/render.ts.md): Source file summary

## Backlinks

This answer is referenced by:
- (to be populated as links are added)
