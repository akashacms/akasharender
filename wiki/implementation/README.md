---
title: Implementation index
---

# Implementation Pages

This directory contains implementation guides for developing new features, fixing bugs, and making modifications to AkashaRender.

## Implementation Guides

- **[Sitemap Validation Implementation Guide](./sitemap-validation.md)**: Detailed implementation specifications for building a custom sitemap validator. Includes complete TypeScript class implementation, CLI integration, test suite design, and phase-by-phase implementation plan.
- **[oEmbed Provider Implementation Guide for plugins-base](./oembed-provider.md)**: Concrete coding plan for adding an oEmbed provider to `@akashacms/plugins-base`: config-flag API (`generateOEmbed`), shared URL/path helper, `<head>` `<link>` injection via a new Mahabhuta element/partial, per-page JSON/XML file generation folded into `onSiteRendered`, payload builders, tests, and a phased plan.

## Guide Types

Implementation guides typically include:

- **Feature Implementation**: Step-by-step guides for adding new capabilities
- **Bug Fix Guides**: Approach for diagnosing and fixing issues  
- **Refactoring Plans**: Strategies for improving code structure
- **Integration Guides**: How to integrate with external systems or libraries
