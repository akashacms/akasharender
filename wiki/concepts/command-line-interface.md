---
title: "Command-Line Interface"
type: concept
Sources:
  - lib/cli.ts
Categories:
  - cli
  - tooling
  - user-interface
date-created: 2026-05-21T01:00:00+00:00
last-updated: 2026-05-21T01:00:00+00:00
confidence: high
---

# Command-Line Interface

## Definition

The Command-Line Interface (CLI) is the `akasharender` executable tool built with Commander.js that provides over 30 commands for rendering websites, managing content, inspecting configuration, analyzing tags, watching for changes, and publishing to GitHub Pages. It serves as the primary user interface for AkashaRender, dynamically importing configuration files and orchestrating the rendering, caching, and deployment workflows (source: [lib/cli.ts](../../lib/cli.ts):1-1019).

## How It Works

The CLI is implemented as a Node.js script using the Commander.js framework for command definition and argument parsing (source: [lib/cli.ts](../../lib/cli.ts)):

**Program Structure**: Uses Commander's declarative command API (source: [lib/cli.ts](../../lib/cli.ts):24,38):
```typescript
import { program } from 'commander';
program.version('0.9.5');
program.command('command-name <configFN>')
    .description('Command description')
    .option('--flag', 'Option description')
    .action(async (configFN, cmdObj) => {
        // Command implementation
    });
```

**Configuration Loading Pattern**: Most commands follow this pattern (source: [lib/cli.ts](../../lib/cli.ts):45-55):
1. Import configuration file dynamically from current working directory
2. Extract `config.akasha` object
3. Call `akasha.setup(config)` to initialize caches
4. Perform command-specific operations
5. Call `akasha.closeCaches()` for cleanup
6. Catch and report errors

**Command Categories**:

**Rendering Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `render <configFN>` - Renders entire site with options for quiet mode (`-q`), asset copying (`--copy-assets`), results output to file (`--results-file`), and performance profiling (`--perf-data-dir`)
- `render-document <configFN> <documentFN>` - Renders single document with optional performance data output
- `copy-assets <configFN>` - Copies all assets to output directory without rendering

**Publishing Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `gh-pages-publish <configFN>` - Publishes rendered site to GitHub Pages with extensive options for branch, repository, remote, CNAME, Git user configuration, and commit messages using the gh-pages library

**Inspection Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `config <configFN>` - Prints configuration as JSON
- `plugins <configFN>` - Lists installed plugins
- `docdirs`, `assetdirs`, `partialdirs`, `layoutsdirs` - Lists configured directory stacks
- `documents <configFN> [rootPath]` - Lists documents under path
- `document <configFN> <documentFN>` - Shows detailed document info (vpath, fspath, renderer, metadata)
- `docinfo <configFN> <docFN>` - Shows document metadata
- `index-files <configFN> [rootPath]` - Lists index pages
- `index-chain <configFN> startPath` - Shows index chain from starting path
- `siblings <configFN> <vpath>` - Lists sibling documents

**Tag Management Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `tags <configFN>` - Lists all tags in YAML format
- `similar-tags <configFN>` - Finds groups of similar tags using Levenshtein distance and other algorithms
- `tags-without-descriptions <configFN>` - Identifies tags lacking descriptions
- `refactor-tag <configFN> <oldTag> <newTag>` - Renames tag across documents with dry-run support

**Search Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `docs-semantic <configFN> <searchFor>` - Semantic search for documents using vector embeddings

**Development Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `watch <configFN>` - Watches for file changes and automatically rebuilds, using the watchman module

**Utility Commands** (source: [lib/cli.ts](../../lib/cli.ts)):
- `docs-set-dates <configFN>` - Sets filesystem access and modification times for documents based on metadata

**Error Handling**: Each command wraps its logic in try-catch blocks and reports errors with stack traces (source: [lib/cli.ts](../../lib/cli.ts):52-54).

**Process Title**: Sets process title to 'akasharender' for easier identification in process lists (source: [lib/cli.ts](../../lib/cli.ts):37).

**Environment Variables**: Some commands respect environment variables like `AK_PROFILE` for enabling performance profiling (source: [lib/cli.ts](../../lib/cli.ts)).

## Key Parameters

**configFN**: Path to configuration file (typically `config.mjs`), required by nearly all commands. Imported dynamically from current working directory (source: [lib/cli.ts](../../lib/cli.ts):45-47).

**documentFN / vpath**: Document virtual path for commands operating on single documents (source: [lib/cli.ts](../../lib/cli.ts):59,97).

**rootPath**: Optional starting path for listing documents or indexes, defaults to root (source: [lib/cli.ts](../../lib/cli.ts)).

**Command-specific options**:
- `--quiet` / `-q`: Suppress output in render command
- `--copy-assets`: Copy assets during render
- `--results-file <file>`: Write rendering results to JSON file
- `--perf-data-dir <dir>`: Directory for performance measurement output
- `--branch <branch>`: GitHub Pages branch
- `--repo <repo>`: GitHub repository URL
- `--dry-run`: Preview tag refactoring without modifying files

**Global options**: `-V, --version` shows version number (source: [lib/cli.ts](../../lib/cli.ts):38).

## When To Use

**Site Building**: Run `render` to build entire site from source to output directory (source: [lib/cli.ts](../../lib/cli.ts)).

**Development**: Use `watch` during development to automatically rebuild on file changes (source: [lib/cli.ts](../../lib/cli.ts)).

**Deployment**: Use `gh-pages-publish` to deploy rendered site to GitHub Pages (source: [lib/cli.ts](../../lib/cli.ts)).

**Content Inspection**: Use document inspection commands to debug rendering issues or verify metadata (source: [lib/cli.ts](../../lib/cli.ts)).

**Tag Maintenance**: Use tag commands to audit, analyze, and refactor tag vocabulary (source: [lib/cli.ts](../../lib/cli.ts)).

**Configuration Debugging**: Use `config` and `plugins` commands to verify configuration is loaded correctly (source: [lib/cli.ts](../../lib/cli.ts)).

**Performance Analysis**: Use `--perf-data-dir` option to collect performance data for optimization (source: [lib/cli.ts](../../lib/cli.ts):99).

## Risks & Pitfalls

**Configuration Path**: configFN is resolved relative to current working directory. Must run CLI from project root or use absolute paths (source: [lib/cli.ts](../../lib/cli.ts):45-47).

**Dynamic Import**: Configuration files are imported dynamically, so they must export a default configuration object (source: [lib/cli.ts](../../lib/cli.ts):45-47).

**Error Reporting**: Errors are logged to console but commands don't necessarily exit with non-zero status codes, which could cause issues in CI/CD pipelines (source: [lib/cli.ts](../../lib/cli.ts):52-54).

**Cache Cleanup**: If commands fail before calling `closeCaches()`, SQLite connections may remain open. The try-catch pattern helps but isn't foolproof (source: [lib/cli.ts](../../lib/cli.ts):51).

**gh-pages Dependency**: GitHub Pages publishing requires the gh-pages npm package and proper Git configuration (source: [lib/cli.ts](../../lib/cli.ts):25).

**Watch Mode**: The watch command uses a separate watchman module that must be imported dynamically, adding complexity (source: [lib/cli.ts](../../lib/cli.ts):35).

**Command Count**: With 30+ commands, the help output can be overwhelming. Consider grouping or using subcommands (source: [lib/cli.ts](../../lib/cli.ts)).

**Async Everywhere**: All command actions are async, requiring proper promise handling. Missing await can cause silent failures (source: [lib/cli.ts](../../lib/cli.ts)).

**Path Separators**: Commands deal with virtual paths (using `/`) and filesystem paths (using OS separator). Confusion can lead to path resolution errors (source: [lib/cli.ts](../../lib/cli.ts)).

## Sources

- [lib/cli.ts](../../lib/cli.ts) - Complete CLI implementation with all commands

## Related Pages

- [Configuration Class](./configuration-class.md) - Configuration object loaded by CLI
- [Rendering Pipeline](./rendering-pipeline.md) - Executed by render commands
- [Tag Refactoring](./tag-refactoring.md) - Invoked by refactor-tag command
- [Tag System](./tag-system.md) - Queried by tag commands
- [File Watching](./file-watching.md) - Implemented in watch command
- [Performance Profiling](./performance-profiling.md) - Enabled via CLI options

## Backlinks
