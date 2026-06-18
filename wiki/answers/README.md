---
title: Answer index
---

# Answer Pages

This directory contains answers to questions about the AkashaRender codebase. Answers are generated in response to user queries and saved when they provide valuable insights.

## Questions Answered

- **[Detailed Flow for Rendering a Single Page from vpath](./rendering-flow-from-vpath.md)**: Complete step-by-step walkthrough of the rendering process from virtual path lookup through document cache query, three-stage rendering (first render, layout, Mahabhuta), filesystem output, and performance tracking. Includes visual flow diagram, key data structures, special cases, and performance considerations.
- **[When Was Clinic Added as a Dependency, and How Would It Help AkashaRender?](./clinic-dependency.md)**: Finds that `clinic` was never a dependency in `package.json` (it is documented in `PROFILING.md` only as an optional global-install profiling tool) and explains how Clinic.js (doctor, flame, bubbleprof) would help diagnose performance bottlenecks in AkashaRender builds.
- **[Elements Required for ActivityPub and Fediverse Integration](./activitypub-fediverse-html-elements.md)**: Outlines what is actually required to make AkashaCMS content Fediverse-friendly. Clarifies that ActivityPub is a JSON-LD/HTTP protocol (not an HTML-tag standard), so the "HTML schema tags" are really Open Graph + Twitter Card + the Mastodon `fediverse:creator` convention. Presents a tiered/phased plugin design: Tier 1 `<head>` metadata, Tier 2 discovery endpoints (WebFinger, NodeInfo, host-meta), Tier 3 static ActivityPub actor/object JSON-LD, and Tier 4 live federation. Because shared hosting almost always provides **PHP**, the page details how small PHP scripts (WebFinger query handler with `.htaccess`, content-negotiating router, inbox, signed delivery) supply the dynamic shim, and explains the Actor / Collections / Objects-Activities entities in detail.
- **[Bluesky / AT Protocol Integration and Crossover with the Fediverse](./bluesky-atproto-integration.md)**: Explains that Bluesky (AT Protocol) and the Fediverse (ActivityPub) are separate networks that only cross over via bridges such as Bridgy Fed. Bluesky does not crawl a site for content; it fetches **Open Graph** tags for link-preview cards and, if the owner opts in, a **domain-handle verification** artifact. Recommends an AkashaCMS approach: reuse the shared Open Graph metadata, and optionally generate `/.well-known/atproto-did` (or document the `_atproto` DNS TXT record) so the domain can serve as the owner's Bluesky handle. Protocol-level federation is left to a bridge.
