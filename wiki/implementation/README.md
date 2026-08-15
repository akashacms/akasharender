---
title: Implementation index
---

# Implementation Pages

This directory contains implementation guides for developing new features, fixing bugs, and making modifications to AkashaRender.

## Implementation Guides

- **[Sitemap Validation Implementation Guide](./sitemap-validation.md)**: Detailed implementation specifications for building a custom sitemap validator. Includes complete TypeScript class implementation, CLI integration, test suite design, and phase-by-phase implementation plan.
- **[oEmbed Provider Implementation Guide for plugins-base](./oembed-provider.md)**: Concrete coding plan for adding an oEmbed provider to `@akashacms/plugins-base`: config-flag API (`generateOEmbed`), shared URL/path helper, `<head>` `<link>` injection via a new Mahabhuta element/partial, per-page JSON/XML file generation folded into `onSiteRendered`, payload builders, tests, and a phased plan.
- **[csv-table Custom Element Implementation Guide](./csv-table-custom-element.md)**: Coding plan for issue #85's `<csv-table file-name="..." template="..."/>` tag — a Built-in Plugin custom element modeled on `CodeEmbed` that reads a CSV/TSV/YAML data file, normalizes it to a row-object model (`fields`/`columns`/`index`/`rowNumber`), and renders a before-template, a per-row template, and an after-template into an HTML table, with a pure parser helper, default `<table>`/`</table>` partials, escaping guidance, tests, and phasing.
- **[Link Checker Implementation Guide (Built-in Plugin)](./link-checker.md)**: Coding plan for a link-validity checker in the `akashacms-builtin` plugin — internal links resolved against the documents/assets cache (reusing `AnchorCleanup`), external links validated over HTTP with the best-practice HEAD-then-GET `fetch` recipe and status-code classification, four configurable severity modes (ignore/warn/error/fatal) declarable from `config.mjs`, a whole-site scan in `onSiteRendered`, an external-domain whitelist, optional logging of non-HTTP links, dedupe/caching, a build-vs-buy evaluation of the `link-check` npm package (buy the per-URL check behind a pluggable boundary, build the harness), tests, and a phased plan.
- **[Implementing Self-Hosted Favicon Discovery in plugins-external-links (favicon-fetcher.mjs)](./favicon-fetcher-self-hosted.md)**: Coding plan to replace the Google Favicon service in `@akashacms/plugins-external-links` with build-time self-hosted discovery. A new `favicon-fetcher.mjs` uses `fetch()` (following redirects, faux `User-Agent`) to retrieve the target page, deduces the favicon from `<link rel=icon>`/`apple-touch-icon`/`mask-icon`/manifest with a `/favicon.ico` fallback, and caches per canonical domain under a directory (default `favicon-cache`, automounted at `/vendor/favicon-cache`) with a `meta.json` and the icon bytes (including negative-result caching). Adds config for favicon size and optional Sharp resize/convert to PNG — **never converting ICO** (store the ICO as-is) — plus the `index.mjs` automount/setters and the `mahafuncs.mjs` change to emit a local `<img>`; includes phasing, tests, and security notes.

## Guide Types

Implementation guides typically include:

- **Feature Implementation**: Step-by-step guides for adding new capabilities
- **Bug Fix Guides**: Approach for diagnosing and fixing issues  
- **Refactoring Plans**: Strategies for improving code structure
- **Integration Guides**: How to integrate with external systems or libraries
