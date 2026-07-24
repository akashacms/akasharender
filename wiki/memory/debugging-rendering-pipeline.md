---
title: "How To Debug the Rendering Pipeline"
type: memory
Sources:
  - lib/render.ts
Categories:
  - debugging
  - rendering
Symptoms:
  - "document renders with wrong HTML"
  - "page missing expected content"
  - "render throws an error for one document"
  - "slow build"
Keywords:
  - render
  - three-stage rendering
  - mahabhuta
  - layout
  - TRACES
  - vpath
date-created: 2026-07-24T12:31:18+03:00
last-updated: 2026-07-24T12:31:18+03:00
confidence: medium
---

# How To Debug the Rendering Pipeline

This memory records where to start, and which tools to reach for, when a
document renders incorrectly, is missing content, or fails outright. It exists
so future debugging sessions do not have to re-derive the entry points.

## Context

AkashaRender renders each document through a three-stage pipeline (first
render, layout wrapping, then Mahabhuta DOM processing). A symptom seen in the
final HTML can originate in any of the three stages, so the first debugging job
is to localize *which stage* produced the bad output. See the
[Three-Stage Rendering](../concepts/three-stage-rendering.md) concept and the
[render.ts summary](../summaries/lib/render.ts.md) for the pipeline structure.

## Technique

1. **Reproduce a single document.** Do not debug against a full site build.
   Render just the affected virtual path (vpath) so the output is small and the
   log noise is low. The rendering flow from a vpath is documented in
   [Detailed Flow for Rendering a Single Page from vpath](../answers/rendering-flow-from-vpath.md).

2. **Localize the stage.** Compare the three intermediate outputs:
   - If the *first render* output is already wrong, the bug is in the renderer
     (Markdown/EJS/Nunjucks) or the document frontmatter/content.
   - If the first render is correct but the wrapped output is wrong, the bug is
     in the layout template or the partials it pulls in.
   - If both are correct but the *final* HTML is wrong, the bug is in a
     Mahabhuta custom element or mahafunc. See
     [Custom Elements](../concepts/custom-elements.md).

3. **Use the TRACES timing data** to spot which stage is slow or is being run
   an unexpected number of times. Per-stage timing is written to the TRACES
   table; see [Performance Tracing](../concepts/performance-tracing.md).

4. **Check the stacked-directory resolution** when the wrong template or
   partial is being used. Because partials and layouts are layered, an override
   from a mounted directory can silently replace the file you expect. See
   [Stacked Directories](../concepts/stacked-directories.md).

## Pitfalls

- Assuming the final HTML defect is in the renderer when it is actually a
  Mahabhuta post-processing step — always localize the stage first.
- Debugging against a full build, which buries the one failing document in
  hundreds of successful ones.
- Forgetting that a file may be overridden by a higher layer in the
  stacked-directory virtual filesystem.

## Sources

- [lib/render.ts](../summaries/lib/render.ts.md)

## Related Pages

- [Memory Index](./README.md)
- [Three-Stage Rendering](../concepts/three-stage-rendering.md)
- [Detailed Flow for Rendering a Single Page from vpath](../answers/rendering-flow-from-vpath.md)
- [Performance Tracing](../concepts/performance-tracing.md)
- [Stacked Directories](../concepts/stacked-directories.md)

## Backlinks

- [Memory Index](./README.md)
