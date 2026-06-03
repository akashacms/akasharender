---
title: Concept index
---

# Concept Pages

This directory contains documentation of key concepts, patterns, and architectural decisions in AkashaRender.

## Architecture

- **[Stacked Directories](./stacked-directories.md)**: Virtual filesystem pattern where multiple directories are layered to allow file overrides
- **[Three-Stage Rendering](./three-stage-rendering.md)**: Document processing pipeline with initial rendering, layout application, and DOM manipulation
- **[Plugin System](./plugin-system.md)**: Extensibility mechanism allowing reusable modules to add functionality

## Core Infrastructure

- **[Configuration Class](./configuration-class.md)**: Central configuration object managing settings, directories, plugins, and rendering options
- **[File Caching](./file-caching.md)**: SQLite-based system for indexing and tracking file metadata from stacked directories
- **[SQLite Database](./sqlite-database.md)**: Shared in-memory database with extensions for regex, vector search, and embeddings
- **[Template Rendering](./template-rendering.md)**: Process of transforming source documents through template engines in the rendering pipeline
- **[Mahabhuta System](./mahabhuta-system.md)**: DOM manipulation engine for post-processing HTML after initial rendering

## Rendering System

- **[Rendering Pipeline](./rendering-pipeline.md)**: Complete workflow for transforming an entire project from source files into a rendered website
- **[DOM Manipulation](./dom-manipulation.md)**: Programmatic HTML modification using jQuery-like selectors and Cheerio operations
- **[Layout Templates](./layout-templates.md)**: Reusable page structure templates that wrap content with consistent HTML scaffolding
- **[Concurrent Rendering](./concurrent-rendering.md)**: Parallel document processing using promise-based queues to maximize throughput
- **[Frontmatter Parsing](./frontmatter-parsing.md)**: Extracting YAML metadata from content file headers for template variables and configuration

## File System

- **[Virtual Filesystem](./virtual-filesystem.md)**: Unified file hierarchy created by combining multiple physical directories into a single logical namespace
- **[File Shadowing](./file-shadowing.md)**: Mechanism where files in later-mounted directories override files at the same virtual path in earlier mounts
- **[Virtual Paths](./virtual-paths.md)**: Location-independent file identifiers without leading slashes that abstract away physical directory structures
- **[MIME Type Detection](./mime-type-detection.md)**: Automatic file content type identification based on extensions using the mime library

## Content Organization

- **[Tag System](./tag-system.md)**: Mechanism for categorizing and organizing content documents using vocabulary tags stored in frontmatter and tracked in SQLite database
- **[Tag Similarity Detection](./tag-similarity-detection.md)**: Automated analysis identifying tag variants using case-insensitive matching, plural/singular detection, and Levenshtein distance
- **[Tag Refactoring](./tag-refactoring.md)**: Batch operation that renames tags across all documents by modifying YAML frontmatter with dry-run preview support
- **[Levenshtein Distance](./levenshtein-distance.md)**: String similarity algorithm measuring minimum edit distance to detect typos and near-duplicates in tag names

## Built-in Plugin Features

- **[Built-in Plugin](./built-in-plugin.md)**: Special plugin automatically added to every configuration providing core functionality for rendering websites
- **[Link Relativization](./link-relativization.md)**: Automatic transformation of absolute local URLs into relative paths based on document location in output hierarchy
- **[Image Resizing](./image-resizing.md)**: Automated responsive image generation at specified widths using sharp library during rendering process
- **[Nunjucks Extensions](./nunjucks-extensions.md)**: Custom template tags for automatically injecting CSS stylesheets and JavaScript references into rendered HTML

## Design Patterns

- **[Dry Run Pattern](./dry-run-pattern.md)**: Preview-before-execute pattern where potentially destructive operations can run without making actual modifications

## Plugin Extensibility

- **[Lifecycle Hooks](./lifecycle-hooks.md)**: Callback methods that plugins implement to execute custom code at specific points during build and file watching processes
- **[Custom Elements](./custom-elements.md)**: Mahabhuta functions that replace custom HTML tags with generated content during DOM manipulation phase

## Database and Caching

- **[Database Indexing](./database-indexing.md)**: Strategic creation of SQLite indexes on cache table columns to accelerate query performance
- **[Cache Schema](./cache-schema.md)**: TypeScript interfaces, SQLite table structures, and Joi validation schemas defining the data model for file cache types

## Command-Line and Development

- **[Command-Line Interface](./command-line-interface.md)**: The akasharender executable tool with 30+ commands for rendering, managing content, and publishing
- **[Performance Profiling](./performance-profiling.md)**: Built-in capability to measure and record rendering timing data at document, Mahabhuta, and SQL levels
- **[File Watching](./file-watching.md)**: Development mode feature monitoring file system changes and automatically triggering selective re-rendering

## Advanced Database Features

- **[Database Extensions](./database-extensions.md)**: SQLite loadable extensions for regex matching, vector similarity search, and text embedding generation
- **[Vector Embeddings](./vector-embeddings.md)**: Numerical representations of text content as 384-dimensional vectors for semantic similarity comparisons
- **[Semantic Search](./semantic-search.md)**: Content discovery using ML-generated embeddings to find documents by meaning rather than keywords

## Architecture Patterns

- **[Event-Driven Architecture](./event-driven-architecture.md)**: EventEmitter pattern in cache components enabling loose coupling and reactive file processing

## Data Storage

- **[Key-Value Store](./key-value-store.md)**: SQLite-backed simple storage API for plugins using sq3-kv-data-store package

## Validation and Quality

- **[Type Validation](./type-validation.md)**: Runtime verification using Joi schemas to ensure database values match TypeScript interfaces
- **[Performance Tracing](./performance-tracing.md)**: Built-in timing system recording render stage durations in SQLite TRACES table

## Site Building and Deployment

- **[Site Rendering](./site-rendering.md)**: Complete workflow transforming all source documents into a rendered website using concurrent processing
- **[GitHub Pages Publishing](./github-pages-publishing.md)**: Built-in deployment feature pushing rendered content to GitHub Pages branches
