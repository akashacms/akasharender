# AkashaRender Source Code Complexity Analysis

This document provides a complexity overview of the AkashaRender source code based on static analysis metrics.

## Summary Statistics

- **Total source files analyzed**: 15
- **Total lines of code**: 9,227
- **Average lines per file**: 615
- **Largest file**: cache-sqlite.ts (2,638 lines)
- **Smallest file**: Plugin.ts (96 lines)

## Complexity Distribution

### Very High Complexity (2 files)

**lib/cache/cache-sqlite.ts** - 2,638 lines
- **Exported functions**: ~2 major setup functions
- **Classes**: 5 (BaseCache, DocumentsCache, AssetsCache, LayoutsCache, PartialsCache)
- **Description**: Largest file, complex class hierarchy, extensive database operations. BaseCache abstract class with 50+ methods, DocumentsCache with additional 30+ methods.
- **Summary link**: [wiki/summaries/lib/cache/cache-sqlite.ts.md](wiki/summaries/lib/cache/cache-sqlite.ts.md)

**lib/built-in.ts** - 1,218 lines
- **Exported functions**: ~5 major functions
- **Classes**: 20+ (BuiltInPlugin class plus ~19 Mahabhuta function classes)
- **Description**: Extensive plugin with numerous custom elements and DOM processors. Includes BuiltInPlugin class, Mahabhuta arrays, Nunjucks extensions, and image resize queue.
- **Summary link**: [wiki/summaries/lib/built-in.ts.md](wiki/summaries/lib/built-in.ts.md)

### High Complexity (3 files)

**lib/index.ts** - 1,498 lines
- **Exported functions**: ~12 major functions
- **Classes**: 1 (Configuration class)
- **Description**: Main entry point with large Configuration class containing 100+ methods and complex initialization logic. Exports Configuration class, setup functions, rendering functions, and partial functions.
- **Summary link**: [wiki/summaries/lib/index.ts.md](wiki/summaries/lib/index.ts.md)

**lib/cli.ts** - 1,019 lines
- **Exported functions**: ~1 (module uses Commander.js command pattern)
- **Classes**: 0
- **Description**: Many command definitions with similar patterns and extensive option handling. Defines ~30+ CLI commands using Commander.js.
- **Summary link**: [wiki/summaries/lib/cli.ts.md](wiki/summaries/lib/cli.ts.md)

**lib/render.ts** - 953 lines
- **Exported functions**: ~11 major functions (render, render2, renderDocument, renderDocument2, renderContent, etc.)
- **Classes**: 0 (uses type definitions)
- **Description**: Complex async rendering pipeline with multiple stages and error handling. Implements render/render2 (site-wide), renderDocument/renderDocument2 (single doc), and renderContent (core).
- **Summary link**: [wiki/summaries/lib/render.ts.md](wiki/summaries/lib/render.ts.md)

### Medium Complexity (6 files)

**lib/cache/schema.ts** - 497 lines
- **Exported functions**: 10 (validation and table creation functions)
- **Classes**: 0
- **Description**: Type definitions with Joi validation schemas. Exports 4 interfaces (Asset, Document, Layout, Partial) plus validation functions.
- **Summary link**: [wiki/summaries/lib/cache/schema.ts.md](wiki/summaries/lib/cache/schema.ts.md)

**lib/cache/tag-glue.ts** - 424 lines
- **Exported functions**: 0
- **Classes**: 2 (TagGlue, TagDescriptions)
- **Description**: Database operations with similarity algorithms (Levenshtein, pluralization). Key method: findSimilarTags() with multiple similarity detection strategies.
- **Summary link**: [wiki/summaries/lib/cache/tag-glue.ts.md](wiki/summaries/lib/cache/tag-glue.ts.md)

**lib/cache/vfstack.ts** - 416 lines
- **Exported functions**: 1 (mimedefine utility)
- **Classes**: 1 (VFStack class)
- **Description**: Recursive directory scanning and virtual path resolution. Key methods: scan(), vpathToFspath(), toIgnore(), iterator protocol implementation.
- **Summary link**: [wiki/summaries/lib/cache/vfstack.ts.md](wiki/summaries/lib/cache/vfstack.ts.md)

**lib/cache/watchman.ts** - 241 lines
- **Exported functions**: 5 internal helper functions, 1 main export (watchman)
- **Classes**: 0
- **Description**: Event-driven architecture with async rendering queue. Pattern: Event listeners on cache instances, fastq for concurrent rendering.
- **Summary link**: [wiki/summaries/lib/cache/watchman.ts.md](wiki/summaries/lib/cache/watchman.ts.md)

**lib/data.ts** - 153 lines
- **Exported functions**: 6 (init, report, remove, removeAll, print, data4file)
- **Classes**: 1 internal (Trace class)
- **Description**: Straightforward database operations. Pattern: SQL loaded from external files, simple CRUD operations.
- **Summary link**: [wiki/summaries/lib/data.ts.md](wiki/summaries/lib/data.ts.md)

**lib/refactor-tags.ts** - 138 lines
- **Exported functions**: 1 (refactorTag async function)
- **Classes**: 0
- **Description**: Async iteration over documents with frontmatter parsing and file I/O. Key operations: Document query, frontmatter modification, optional dry-run mode.
- **Summary link**: [wiki/summaries/lib/refactor-tags.ts.md](wiki/summaries/lib/refactor-tags.ts.md)

### Low Complexity (4 files)

**lib/mahafuncs.ts** - 125 lines
- **Exported functions**: 0
- **Classes**: 5 (Mahafunc, CustomElement, ElementTweaker, Munger, PageProcessor)
- **Description**: Simple wrapper classes with identical structure. Pattern: Each class extends Mahabhuta base, adds config/akasha/plugin getters.
- **Summary link**: [wiki/summaries/lib/mahafuncs.ts.md](wiki/summaries/lib/mahafuncs.ts.md)

**lib/types.ts** - 117 lines
- **Exported functions**: 1 (validTagDescription type guard)
- **Classes**: 0
- **Description**: Pure type definitions and interfaces. Exports 7 interfaces/types for tag management and refactoring.
- **Summary link**: [wiki/summaries/lib/types.ts.md](wiki/summaries/lib/types.ts.md)

**lib/sqdb.ts** - 114 lines
- **Exported functions**: 1 (newSQ3DataStore factory function)
- **Classes**: 0
- **Description**: Module-level initialization and configuration. Exports sqdb (AsyncDatabase instance) and lembedModelName constant.
- **Summary link**: [wiki/summaries/lib/sqdb.ts.md](wiki/summaries/lib/sqdb.ts.md)

**lib/Plugin.ts** - 96 lines
- **Exported functions**: 0
- **Classes**: 1 (Plugin base class)
- **Description**: Simple abstract base class with getters/setters. Key methods: configure() (abstract), cacheIndexes getter.
- **Summary link**: [wiki/summaries/lib/Plugin.ts.md](wiki/summaries/lib/Plugin.ts.md)

## Files by Size

| Rank | File | Lines | Complexity |
|------|------|-------|------------|
| 1 | cache-sqlite.ts | 2,638 | Very High |
| 2 | index.ts | 1,498 | High |
| 3 | built-in.ts | 1,218 | Very High |
| 4 | cli.ts | 1,019 | High |
| 5 | render.ts | 953 | High |
| 6 | schema.ts | 497 | Medium |
| 7 | tag-glue.ts | 424 | Medium |
| 8 | vfstack.ts | 416 | Medium |
| 9 | watchman.ts | 241 | Medium |
| 10 | data.ts | 153 | Medium |
| 11 | refactor-tags.ts | 138 | Medium |
| 12 | mahafuncs.ts | 125 | Low |
| 13 | types.ts | 117 | Low |
| 14 | sqdb.ts | 114 | Low |
| 15 | Plugin.ts | 96 | Low |

## Complexity Guidelines

### Very High (2,000+ lines or extensive class hierarchies)
- Requires careful refactoring consideration
- May benefit from splitting into multiple modules
- Thorough testing is critical

### High (900-2,000 lines or complex algorithms)
- Monitor for growth
- Consider extracting reusable components
- Ensure comprehensive documentation

### Medium (150-900 lines)
- Reasonable complexity for focused modules
- Maintain current structure
- Regular code review recommended

### Low (<150 lines)
- Simple, focused modules
- Easy to understand and maintain
- Good candidate for stable interfaces

## Recommendations

1. **cache-sqlite.ts** (2,638 lines): Consider splitting BaseCache and DocumentsCache into separate files
2. **index.ts** (1,498 lines): Consider extracting Configuration class to separate file
3. **built-in.ts** (1,218 lines): Consider organizing Mahabhuta functions into logical groups in separate files
4. **cli.ts** (1,019 lines): Consider extracting command definitions into separate command modules
5. **render.ts** (953 lines): Consider splitting rendering stages into separate modules

## Maintenance Notes

- The top 5 files (5,786 lines) represent 63% of the total codebase
- Cache system files (cache-sqlite.ts, schema.ts, vfstack.ts, tag-glue.ts, watchman.ts) total 4,214 lines (46% of codebase)
- Consider modularization of large files to improve maintainability

---

*This document is automatically generated from the wiki summaries. Last updated: 2026-05-20*
