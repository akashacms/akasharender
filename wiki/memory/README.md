---
title: Memory index
---

# Memory Pages

This directory holds the **memory system** for the AkashaRender LLM-CODE-WIKI. Memory pages capture durable, reusable knowledge that helps an LLM or LLM Agent write, debug, and maintain code in this project more effectively.

A memory page records a fact, technique, gotcha, or workflow that was learned while working on the code and that is worth remembering for future tasks. Examples include:

- A debugging technique for a subsystem (e.g. how to trace a rendering failure)
- A non-obvious build, test, or environment quirk
- A recurring pitfall and its fix
- A working recipe for a common task (e.g. adding a new CLI command)
- A hard-won insight about how two subsystems interact

Unlike **summaries** (which describe individual source files), **concepts** (which describe software idioms), or **answers** (which respond to a specific question), a memory page is an operational note-to-self intended to save future time.

## How To Use These Pages

1. **Before starting a debugging or coding task**, scan this index for a memory page relevant to the subsystem or symptom you are dealing with.
2. Follow the links to the matching memory pages and apply the recorded technique.
3. **When you learn something worth remembering**, create a new memory page following the format in [wiki/AGENTS.md](../AGENTS.md) (see the "Memory system" section) and add it to the index below.

## Finding Memory Pages

Memory pages are indexed three ways so they are easy to locate:

- **By index list** — the alphabetical list below, each entry showing its summary.
- **By category** — the "By Category" list groups pages by their `Categories` frontmatter tag.
- **By full-text search** — every page has a descriptive `title`, `Categories`, and a `Symptoms`/`Keywords` frontmatter field so a grep or semantic search finds them.

## Memory Pages

<!-- Add each new memory page here, alphabetically by title, in the format:
- **[Title Of Memory](./memory-file-name.md)**: One-line summary of what this memory records and when to use it.
-->

- **[Assets Cache findByPath Is Exact-Match — Use find() for Leading-Slash vpaths](./assets-findbypath-exact-match.md)**: `assetsCache.findByPath('/vendor/…')` returns nothing because stored vpaths lack the leading slash and the SQL is exact-match; `find()` normalizes — the fix for `TablerIconsElement no vpath for …`.
- **[How To Debug the Rendering Pipeline](./debugging-rendering-pipeline.md)**: Techniques and entry points for diagnosing why a document renders incorrectly or fails, using per-stage `RenderingResults` timing data, the three-stage pipeline, and the CLI.
- **[Link Checker Sentinel-Origin Collision (http://example.com Misclassified as Internal)](./link-checker-sentinel-origin-collision.md)**: Why an outbound `http://example.com/` link is reported as `internal link not found (/http:/example.com/)` — the `LOCAL_BASE` sentinel-origin trick collides with a real URL; test for a leading URI scheme (`hasUrlScheme()`) before comparing origins.
- **[minimatch v10 Is Pure ESM — Import the Named Export](./minimatch-esm-default-export.md)**: `import minimatch from 'minimatch'` fails with "does not provide an export named 'default'" under minimatch ^10; use `import { minimatch } from 'minimatch'`.
- **[Render Skips Up-To-Date Documents - Use forceRenderAll in Build-Verify Tests](./render2-force-render-all-in-tests.md)**: When a test needs an unconditional full re-render, pass `{ forceRenderAll: true }` to `akasha.render` and check `result.errors[]` — skipped documents don't run Mahabhuta, so side effects like in-place image resizing (after `copyAssets()` restores originals) silently don't happen.
- **[URL Fragments and Queries Are Opaque to Path Relativization in AnchorCleanup](./url-fragments-opaque-to-relativization.md)**: Why a `/img/foo.pdf` reference renders as `../vendor/img/foo.pdf` — AnchorCleanup must split path/query/fragment before `relative()`/`resolveVpath`, else a fragment like `#../../../img/foo.pdf` is path-normalized into the href.

## By Category

<!-- Group memory pages by their primary Categories tag. Update when adding pages. -->

- **caching**: [Assets Cache findByPath Is Exact-Match — Use find() for Leading-Slash vpaths](./assets-findbypath-exact-match.md)
- **debugging**: [How To Debug the Rendering Pipeline](./debugging-rendering-pipeline.md), [Link Checker Sentinel-Origin Collision (http://example.com Misclassified as Internal)](./link-checker-sentinel-origin-collision.md), [URL Fragments and Queries Are Opaque to Path Relativization in AnchorCleanup](./url-fragments-opaque-to-relativization.md)
- **dependencies**: [minimatch v10 Is Pure ESM — Import the Named Export](./minimatch-esm-default-export.md)
- **link-checking**: [Link Checker Sentinel-Origin Collision (http://example.com Misclassified as Internal)](./link-checker-sentinel-origin-collision.md)
- **plugins**: [Assets Cache findByPath Is Exact-Match — Use find() for Leading-Slash vpaths](./assets-findbypath-exact-match.md)
- **rendering**: [How To Debug the Rendering Pipeline](./debugging-rendering-pipeline.md), [Render Skips Up-To-Date Documents - Use forceRenderAll in Build-Verify Tests](./render2-force-render-all-in-tests.md)
- **testing**: [Render Skips Up-To-Date Documents - Use forceRenderAll in Build-Verify Tests](./render2-force-render-all-in-tests.md), [minimatch v10 Is Pure ESM — Import the Named Export](./minimatch-esm-default-export.md)
- **url-handling**: [Link Checker Sentinel-Origin Collision (http://example.com Misclassified as Internal)](./link-checker-sentinel-origin-collision.md), [URL Fragments and Queries Are Opaque to Path Relativization in AnchorCleanup](./url-fragments-opaque-to-relativization.md)

## Related Pages

- [Wiki Index](../index.md)
- [Answers Index](../answers/README.md)
- [Concepts Index](../concepts/README.md)
</content>
</invoke>
