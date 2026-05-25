---
title: Architecture index
---

# Architecture Pages

This directory contains high-level architecture documentation for major subsystems in AkashaRender.

## Architecture Documents

- **[Sitemap Validation Architecture](./sitemap-validation.md)**: Architecture design for validating generated sitemaps against local filesystem. Covers current sitemap generation process, research on existing tools, and proposed validator design with URL-to-filesystem mapping algorithm.

## Suggested Topics

Based on the ingested code, the following architecture documents would be valuable:

- **Caching System Architecture**: How the four caches (documents, assets, layouts, partials) work together
- **Rendering Pipeline Architecture**: Flow from source files to final output
- **Plugin Architecture**: How plugins extend the system and interact with the core
- **Tag System Architecture**: How tags are stored, queried, and managed
- **File Watching Architecture**: How the watchman system monitors and rebuilds files
