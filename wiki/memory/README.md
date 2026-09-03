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

- **[How To Debug the Rendering Pipeline](./debugging-rendering-pipeline.md)**: Techniques and entry points for diagnosing why a document renders incorrectly or fails, using TRACES timing data, the three-stage pipeline, and the CLI.
- **[Render Skips Up-To-Date Documents - Use forceRenderAll in Build-Verify Tests](./render2-force-render-all-in-tests.md)**: When a test needs an unconditional full re-render, pass `{ forceRenderAll: true }` to `akasha.render` and check `result.errors[]` — skipped documents don't run Mahabhuta, so side effects like in-place image resizing (after `copyAssets()` restores originals) silently don't happen.

## By Category

<!-- Group memory pages by their primary Categories tag. Update when adding pages. -->

- **debugging**: [How To Debug the Rendering Pipeline](./debugging-rendering-pipeline.md)
- **rendering**: [How To Debug the Rendering Pipeline](./debugging-rendering-pipeline.md), [Render Skips Up-To-Date Documents - Use forceRenderAll in Build-Verify Tests](./render2-force-render-all-in-tests.md)
- **testing**: [Render Skips Up-To-Date Documents - Use forceRenderAll in Build-Verify Tests](./render2-force-render-all-in-tests.md)

## Related Pages

- [Wiki Index](../index.md)
- [Answers Index](../answers/README.md)
- [Concepts Index](../concepts/README.md)
</content>
</invoke>
