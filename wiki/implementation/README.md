---
title: Implementation index
---

# Implementation Pages

This directory contains implementation guides for developing new features, fixing bugs, and making modifications to AkashaRender.

## Implementation Guides

- **[Sitemap Validation Implementation Guide](./sitemap-validation.md)**: Detailed implementation specifications for building a custom sitemap validator. Includes complete TypeScript class implementation, CLI integration, test suite design, and phase-by-phase implementation plan.
- **[oEmbed Provider Implementation Guide for plugins-base](./oembed-provider.md)**: Concrete coding plan for adding an oEmbed provider to `@akashacms/plugins-base`: config-flag API (`generateOEmbed`), shared URL/path helper, `<head>` `<link>` injection via a new Mahabhuta element/partial, per-page JSON/XML file generation folded into `onSiteRendered`, payload builders, tests, and a phased plan.
- **[csv-table Custom Element Implementation Guide](./csv-table-custom-element.md)**: Coding plan for issue #85's `<csv-table file-name="..." template="..."/>` tag — a Built-in Plugin custom element modeled on `CodeEmbed` that reads a CSV/TSV/YAML data file, normalizes it to a row-object model (`fields`/`columns`/`index`/`rowNumber`), and renders a before-template, a per-row template, and an after-template into an HTML table, with a pure parser helper, default `<table>`/`</table>` partials, escaping guidance, tests, and phasing.

## Guide Types

Implementation guides typically include:

- **Feature Implementation**: Step-by-step guides for adding new capabilities
- **Bug Fix Guides**: Approach for diagnosing and fixing issues  
- **Refactoring Plans**: Strategies for improving code structure
- **Integration Guides**: How to integrate with external systems or libraries
