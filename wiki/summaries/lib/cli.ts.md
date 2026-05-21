---
title: "lib/cli.ts - Command-Line Interface"
type: summary
Sources:
  - lib/cli.ts
Categories:
  - cli
  - commands
  - tools
date-created: 2026-05-20T12:00:00+00:00
last-updated: 2026-05-20T12:00:00+00:00
confidence: high
---

# lib/cli.ts - Command-Line Interface

## Code Complexity

- **Lines of code**: 1,019
- **Exported functions**: ~1 (module uses Commander.js command pattern)
- **Classes**: 0
- **Complexity**: Medium-High - many command definitions with similar patterns, extensive option handling
- **Key commands**: ~30+ CLI commands defined using Commander.js

## Key Points

- Provides the `akasharender` command-line tool using Commander.js
- Implements commands for rendering, watching, publishing, and inspecting sites
- Supports GitHub Pages publishing via gh-pages library
- Includes tag management and analysis commands
- Provides debugging and inspection commands for configuration and documents

## Summary

This file implements the AkashaRender command-line interface (CLI) tool (source: [lib/cli.ts](../../lib/cli.ts)).

**Core Rendering Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `render <configFN>` - Renders entire site with options for quiet mode, asset copying, results output, and performance profiling
- `render-document <configFN> <documentFN>` - Renders a single document with optional performance data output
- `copy-assets <configFN>` - Copies all assets to output directory
- `watch <configFN>` - Watches for file changes and automatically rebuilds

**Publishing Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `gh-pages-publish <configFN>` - Publishes to GitHub Pages with extensive options for branch, repo, remote, CNAME, Git user config, and commit messages

**Inspection Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `config <configFN>` - Prints site configuration
- `plugins <configFN>` - Lists installed plugins
- `docdirs`, `assetdirs`, `partialdirs`, `layoutsdirs` - Lists configured directory paths
- `documents <configFN> [rootPath]` - Lists documents under a path
- `document <configFN> <documentFN>` - Shows detailed document information
- `docinfo <configFN> <docFN>` - Shows document metadata
- `index-files <configFN> [rootPath]` - Lists index pages under a path
- `index-chain <configFN> startPath` - Shows the index chain from a starting path
- `siblings <configFN> <vpath>` - Lists sibling documents

**Tag Management Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `tags <configFN>` - Lists all tags in YAML format
- `similar-tags <configFN>` - Finds groups of similar tags using Levenshtein distance
- `tags-without-descriptions <configFN>` - Identifies tags lacking descriptions
- Commands for tag refactoring and analysis

**Search Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `docs-semantic <configFN> <searchFor>` - Semantic search for documents

**Utility Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `docs-set-dates <configFN>` - Sets access and modification times for documents

Each command follows a pattern of importing the configuration file dynamically, setting up the akasha environment, performing the requested operation, and closing caches (source: [lib/cli.ts](../../lib/cli.ts)).

The CLI uses environment variables and command-line options for configuration, including performance profiling (`AK_PROFILE`) and caching timeouts (source: [lib/cli.ts](../../lib/cli.ts)).

## Relevant Concepts

- [Command-Line Interface](../concepts/command-line-interface.md)
- [Site Rendering](../concepts/site-rendering.md)
- [GitHub Pages Publishing](../concepts/github-pages-publishing.md)
- [Tag Management](../concepts/tag-management.md)
- [File Watching](../concepts/file-watching.md)

## Related Pages

- [lib/index.ts](./index.ts) - Core API used by CLI
- [lib/render.ts](./render.ts) - Rendering functions
- [lib/refactor-tags.ts](./refactor-tags.ts) - Tag refactoring
- [lib/cache/watchman.ts](./cache/watchman.ts) - File watching implementation

## Backlinks

