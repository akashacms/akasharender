---
title: Architecture index
---

# Architecture Pages

This directory contains high-level architecture documentation for major subsystems in AkashaRender.

## Architecture Documents

- **[Sitemap Validation Architecture](./sitemap-validation.md)**: Architecture design for validating generated sitemaps against local filesystem. Covers current sitemap generation process, research on existing tools, and proposed validator design with URL-to-filesystem mapping algorithm.
- **[Migrating AkashaRender to promised.node.sqlite](./promised-node-sqlite-migration.md)**: Architecture and phased migration plan for replacing the `sqlite3` + `promised-sqlite3` stack with the standalone `promised.node.sqlite` package built on `node:sqlite`. Covers the affected files, API compatibility, behavioral differences (extension loading, profiling, key-value store, undefined/boolean binding), the target design, and risks.

## Suggested Topics

Based on the ingested code, the following architecture documents would be valuable:

- **Caching System Architecture**: How the four caches (documents, assets, layouts, partials) work together
- **Rendering Pipeline Architecture**: Flow from source files to final output
- **Plugin Architecture**: How plugins extend the system and interact with the core
- **Tag System Architecture**: How tags are stored, queried, and managed
- **File Watching Architecture**: How the watchman system monitors and rebuilds files
