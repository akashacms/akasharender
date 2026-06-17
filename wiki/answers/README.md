---
title: Answer index
---

# Answer Pages

This directory contains answers to questions about the AkashaRender codebase. Answers are generated in response to user queries and saved when they provide valuable insights.

## Questions Answered

- **[Detailed Flow for Rendering a Single Page from vpath](./rendering-flow-from-vpath.md)**: Complete step-by-step walkthrough of the rendering process from virtual path lookup through document cache query, three-stage rendering (first render, layout, Mahabhuta), filesystem output, and performance tracking. Includes visual flow diagram, key data structures, special cases, and performance considerations.
- **[When Was Clinic Added as a Dependency, and How Would It Help AkashaRender?](./clinic-dependency.md)**: Finds that `clinic` was never a dependency in `package.json` (it is documented in `PROFILING.md` only as an optional global-install profiling tool) and explains how Clinic.js (doctor, flame, bubbleprof) would help diagnose performance bottlenecks in AkashaRender builds.
