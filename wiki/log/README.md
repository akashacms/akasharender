---
title: Log index
---

# Log Entries

This directory contains a chronological audit trail of changes made to the wiki.

## 2026-06-19

- **[20260619T173000+0300.md](./20260619T173000+0300.md)**: 2026-06-19 17:30 - Added Answer Page on the Webmention Protocol - New answer describing Webmention (W3C protocol for decentralized cross-site reply/like/repost notifications, IndieWeb successor to Pingback): the `rel="webmention"` markup and microformats2 classification, the full discovery/`POST`/source-fetch-verification protocol, and server options (Webmention.io and other hosted services, or a self-hosted PHP receiver) with a build-time fetch-and-render approach for AkashaCMS; cross-linked the four companion answers
- **[20260619T163000+0300.md](./20260619T163000+0300.md)**: 2026-06-19 16:30 - Added Answer Page on Open Graph / Twitter Cards / Facebook Social Metadata - New answer describing the three link-card vocabularies (OG primary, Facebook consumes OG, Twitter falls back to OG); audits the existing `@akashacms/plugins-base` `ak_headermeta` implementation read from the sibling repo (finds `og:*` emitted with wrong `name=` attribute, no Twitter Cards, latent `fixHeaderMeta` bugs, bug-encoding tests) and proposes a frontmatter-driven `social:` block emitted from one data-table template loop; cross-linked the three companion answers
- **[20260619T153000+0300.md](./20260619T153000+0300.md)**: 2026-06-19 15:30 - Added Answer Page on Microformats and IndieWeb Markup for Static Blogs - New answer (for issue #33) recommending microformats2 (`h-entry`/`h-card`/`h-feed`); maps the author-listing case to a nested `p-author h-card`, adds `rel="me"` identity and `p-category`/`rel="tag"` tags, and locates the work in the content/teaser partials and the blog/authors plugins; cross-linked the Fediverse and Bluesky companion answers
- **[20260619T143000+0300.md](./20260619T143000+0300.md)**: 2026-06-19 14:30 - Added Answer Page on Bluesky / AT Protocol Integration - New answer covering Fediverse-vs-Bluesky crossover (separate protocols, bridged only via Bridgy Fed), why Bluesky does not crawl sites for content, and how an AkashaCMS site presents to Bluesky via shared Open Graph link cards and an optional `/.well-known/atproto-did` domain-handle verification artifact; cross-linked the companion Fediverse answer
- **[20260619T133000+0300.md](./20260619T133000+0300.md)**: 2026-06-19 13:30 - Expanded Fediverse Answer with PHP Shim and Entity Explanations - Reframed the static-vs-dynamic limitation around shared hosting's PHP availability; added a minimal WebFinger PHP script + `.htaccess` rewrite (Tier 2); gave full explanations of the Actor, Collections, and Objects/Activities entities with example JSON and where PHP scripts (`inbox.php`, content-negotiating router, delivery) fit (Tier 3); updated the phased plan, bottom line, and summaries
- **[20260619T120000+0300.md](./20260619T120000+0300.md)**: 2026-06-19 12:00 - Added Answer Page on ActivityPub and Fediverse Integration Elements - Created an answer outlining the elements required for ActivityPub/Fediverse integration; clarifies that ActivityPub is a JSON-LD/HTTP protocol (not an HTML-tag standard) and presents a tiered plugin design (Open Graph + `fediverse:creator` metadata, WebFinger/NodeInfo discovery, static actor JSON-LD, and live federation requiring a server)

## 2026-06-17

- **[20260617T182703+0300.md](./20260617T182703+0300.md)**: 2026-06-17 18:27 - Added Answer Page on Clinic Dependency and Profiling - Documented that `clinic` was never a dependency in `package.json` (it appears only in `PROFILING.md` as an optional global-install profiler) and explained how Clinic.js would help diagnose AkashaRender build performance
- **[20260617T164526+0300.md](./20260617T164526+0300.md)**: 2026-06-17 16:45 - Implemented node:sqlite Migration and Updated Wiki - Completed the migration to promised.node.sqlite + node:sqlite-only sq3-kv-data-store (boolean/undefined coercion, single shared-DB close, removed sqlite-vec/lembed/query-log); full test suite passes; updated the sqdb summary and the sqlite-database / key-value-store concepts
- **[20260617T160419+0300.md](./20260617T160419+0300.md)**: 2026-06-17 16:04 - Grounded sq3-kv-data-store Plan in Real Source and Cited Profiling Issue - Updated the plan to reference the real package source at `/home/david/Projects/nodejs/sqlite3-key-value-data-store` (src/index.ts, src/finder.ts, Mocha tests) and cited issue akashacms/akasharender#192 for the dropped SQL profiling
- **[20260617T154222+0300.md](./20260617T154222+0300.md)**: 2026-06-17 15:42 - Revised KV-Store Strategy to Modify sq3-kv-data-store Instead of a Local Shim - Owner chose to make `sq3-kv-data-store` node:sqlite-only (drop `sqlite3`) and pass `sqdb.inner`, replacing the earlier local-shim plan
- **[20260617T153519+0300.md](./20260617T153519+0300.md)**: 2026-06-17 15:35 - Updated promised.node.sqlite Migration Architecture with Dependency Decisions - Recorded owner decisions (remove sqlite-vec/sqlite-lembed/sqlite3-query-log; local adapter/shim for sq3-kv-data-store) and added the KVDataStore shim design
- **[20260617T151607+0300.md](./20260617T151607+0300.md)**: 2026-06-17 15:16 - Added promised.node.sqlite Migration Architecture Document - Planned the migration of the SQLite stack from `sqlite3` + `promised-sqlite3` to the standalone `promised.node.sqlite` package on `node:sqlite`, with affected files, API compatibility, behavioral differences, target design, and risks

## 2026-05-22

- **[20260522T000000+0000.md](./20260522T000000+0000.md)**: 2026-05-22 00:00 - Added Sitemap Validation Architecture and Implementation Documents - Created comprehensive architecture and implementation documentation for proposed sitemap validator feature

## 2026-05-21

- **[20260521T040000+0000.md](./20260521T040000+0000.md)**: 2026-05-21 04:00 - Fourth Documentation Session (3 concepts, completed backlog) - Documented performance tracing, key-value store, and event-driven architecture; completed 100% of original concept backlog (25 total concepts)
- **[20260521T030000+0000.md](./20260521T030000+0000.md)**: 2026-05-21 03:00 - Document Six Concepts Completing Major Areas - Documented database extensions, vector embeddings, semantic search, type validation, site rendering, and GitHub Pages publishing
- **[20260521T020000+0000.md](./20260521T020000+0000.md)**: 2026-05-21 02:00 - Document Seven Additional Core Concepts - Documented lifecycle hooks, custom elements, database indexing, command-line interface, cache schema, performance profiling, and file watching
- **[20260521T000000+0000.md](./20260521T000000+0000.md)**: 2026-05-21 00:00 - Document Nine Core Concepts - Documented tag system, tag similarity detection, Levenshtein distance, tag refactoring, dry run pattern, built-in plugin, link relativization, image resizing, and Nunjucks extensions

## 2026-05-20

- **[20260520T210000+0000.md](./20260520T210000+0000.md)**: Ingestion of documentation, layouts, and partials (26 files)
- **[20260520T120000+0000.md](./20260520T120000+0000.md)**: Initial ingestion of lib/ directory source files (15 files)
