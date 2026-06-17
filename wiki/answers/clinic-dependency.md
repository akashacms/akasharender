---
title: "When Was Clinic Added as a Dependency, and How Would It Help AkashaRender?"
type: answer
Sources:
  - PROFILING.md
  - package.json
Categories:
  - performance
  - profiling
  - tooling
  - dependencies
date-created: 2026-06-17T18:27:03+03:00
last-updated: 2026-06-17T18:27:03+03:00
confidence: high
---

# When Was Clinic Added as a Dependency, and How Would It Help AkashaRender?

## Query

I want to know when "clinic" was added as a dependency in package.json. How would clinic help the AkashaRender project?

## Answer

**`clinic` was never added as a dependency in AkashaRender's `package.json`.** Searches of the current `package.json` and of the full git history (for both `package.json` and `package-lock.json`) find no occurrence of `clinic` in either file. The string `clinic` appears in the repository only inside the documentation file `PROFILING.md`, which was introduced in commit `27ba185` ("Add isDirToMount type guard for validation", 2026-10-18). That commit's primary purpose was unrelated; `PROFILING.md` was added alongside it as documentation (source: [PROFILING.md](../../PROFILING.md)).

Importantly, `PROFILING.md` does not list Clinic.js as a project dependency. It documents Clinic.js as an **external, globally installed** profiling tool, explicitly instructing the user to run `npm install -g clinic` rather than adding it to the project (source: [PROFILING.md](../../PROFILING.md):39-41,66-68,279-280). Keeping it out of the dependency tree is deliberate: it is an optional diagnostic aid, not something AkashaRender imports or requires at runtime or build time.

### Summary of findings

- Not present in current `package.json` (source: [package.json](../../package.json)).
- Not present anywhere in the git history of `package.json` or `package-lock.json`.
- Referenced only as a recommended global install in `PROFILING.md` (source: [PROFILING.md](../../PROFILING.md):39-41,66-68,279-280).

> **Note:** The user indicated this question may have been intended for a different repository. Within the AkashaRender repository, the finding is unambiguous: `clinic` has never been a declared dependency here.

### How Clinic.js would help AkashaRender

[Clinic.js](https://clinicjs.org/) is a suite of Node.js performance-profiling tools. AkashaRender is an I/O- and CPU-intensive Node.js application: a build run scans stacked directories into the VFStack, performs many SQLite cache queries, renders documents through `@akashacms/renderers`, and post-processes HTML with Mahabhuta DOM manipulation. Clinic.js complements AkashaRender's own built-in timing instrumentation (see [Performance Profiling](../concepts/performance-profiling.md)) by profiling the whole Node process from the outside:

- **`clinic doctor`** — Runs a build and diagnoses whether the bottleneck is CPU, I/O, garbage collection, or event-loop delay. Useful for deciding *which* phase of a slow render to investigate (source: [PROFILING.md](../../PROFILING.md):40,68,279).
- **`clinic flame`** — Produces a flamegraph of CPU time by function, exposing hot paths in rendering or Mahabhuta processing across many documents (source: [PROFILING.md](../../PROFILING.md):41).
- **`clinic bubbleprof`** — Visualizes async/I/O operations, helping reveal serialized `await`s or excessive repeated SQLite queries — the kind of redundancy that AkashaRender's database request caching is intended to reduce.

In short, Clinic.js is an optional, externally installed diagnostic for finding performance bottlenecks in large builds. That is precisely why it is documented in `PROFILING.md` as a global install rather than declared as a dependency in `package.json`.

## Sources

- [PROFILING.md](../../PROFILING.md) — Documents Clinic.js as a recommended global-install profiling tool.
- [package.json](../../package.json) — Project dependency manifest (does not contain `clinic`).

## Related Pages

- [Performance Profiling](../concepts/performance-profiling.md) — AkashaRender's built-in rendering timing and profiling capability.
- [Detailed Flow for Rendering a Single Page from vpath](./rendering-flow-from-vpath.md) — The rendering pipeline whose performance Clinic.js would help analyze.

## Backlinks

- [Answer index](./README.md)
