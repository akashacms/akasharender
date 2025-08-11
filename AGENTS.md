# AkashaRender Agent Guidelines

AkashaRender is the core component of a system called AkashaCMS.  AkashaCMS refers to the full set of AkashaCMS modules, which are spread out over multiple repositories within the GitHub organization: https://github.com/akashacms/

The scope for AkashaCMS is rendering static HTML websites, rendering EPUB books from the same content, and generating good looking PDF documents from the same content.  In other words, the goal is using the same content files for websites, PDF documents, and/or EPUB books.

## Build Commands
- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode compilation
- `cd test && npm test` - Run full test suite
- `cd test && npm run test-normal` - Run main tests (mocha ./index.mjs)
- `cd test && npm run test-cache` - Run cache tests
- `cd test && npm run test-rebased` - Run rebased tests

## Code Style
- **Language**: TypeScript with ES2021 target, NodeNext modules
- **Imports**: Use ES6 imports (`import ... from '...'`), Node.js built-ins with `node:` prefix
- **Types**: Explicit TypeScript types, use `any` sparingly with proper typing
- **Classes**: Private fields with `#` syntax, proper encapsulation
- **Error Handling**: Throw descriptive Error objects with context
- **Async**: Use async/await, avoid callbacks
- **Comments**: Apache 2.0 license headers, JSDoc for public APIs, minimal inline comments
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **File Structure**: Source in `lib/`, compiled output in `dist/`, tests in `test/`

## Architecture
- Main entry: `lib/index.ts` exports Configuration class and utilities
- Plugin system: Extend `Plugin` class from `lib/Plugin.ts`
- Rendering: Uses `@akashacms/renderers` for template processing
- Server-side DOM Manipulation: After rendering to HTML, Mahabhuta (`mahabhuta`) is used to drive DOM manipulation using functions defined in the plugins.
- Stacked Directories: Four kinds of directories are defined: assets, partials, layouts, and documents.  For each type, multiple directories can be stacked on top of one another in a virtual filesystem.  A key principle is the ability to override a file, such as a partial template, by mounting a directory on the corresponding directory stack, and adding a file of the same name to that directory.  The @akashacms/stacked-dirs package is key to this.
- Caching: SQLite-based file caching in `lib/cache/`.  The file information is gathered by the Stacked Directories feature, and also supports dynamically updating files that change in the filesystem.
- Testing: Mocha with Chai assertions, ES modules (.mjs files)

## Core Dependencies (Sibling Workspaces)
- **mahabhuta**: DOM manipulation engine for post-processing HTML (../mahabhuta, https://www.npmjs.com/package/mahabhuta, https://github.com/akashacms/mahabhuta).
- **@akashacms/stacked-dirs**: Virtual file system for layered directory structures, as well as interactive watching for file changes. (../stacked-directories, https://www.npmjs.com/package/@akashacms/stacked-dirs, https://akashacms.github.io/stacked-directories/, https://github.com/akashacms/stacked-directories)
- **@akashacms/renderers**: Template rendering engines (Markdown, EJS, Nunjucks, etc.) (../renderers, https://www.npmjs.com/package/@akashacms/renderers, https://github.com/akashacms/rendering-engines)

## AkashaCMS plugins

"AkashaCMS" is the name for an ecosystem including AkashaRender, Mahabhuta, @akashacms/stacked-dirs, @akashacms/renderers, and the plugins.  The plugins are used by AkashaRender to extend its functionality.

* **@akashacms/plugins-base** - Base functionality for building websites (../akashacms-base, https://www.npmjs.com/package/@akashacms/plugins-base, https://github.com/akashacms/akashacms-base)
* **@akashacms/plugins-blog-podcast** - Supports building a blog on an AkashaCMS website (../akashacms-blog-podcast, https://www.npmjs.com/package/@akashacms/plugins-blog-podcast, https://github.com/akashacms/akashacms-blog-podcast)
* **@akashacms/plugins-booknav** - Supports a certain useful navigational style (../akashacms-booknav, https://www.npmjs.com/package/@akashacms/plugins-booknav, https://github.com/akashacms/akashacms-booknav)
* **@akashacms/plugins-breadcrumbs** - Constructs breadcrumb trails to help navigate the website (../akashacms-breadcrumbs, https://www.npmjs.com/package/@akashacms/plugins-breadcrumbs, https://github.com/akashacms/akashacms-breadcrumbs)
* **@akashacms/diagrams-maker** - Handles rendering diagrams using PlantUML, Mermaid, or Printora (../plugins-diagrams, https://www.npmjs.com/package/@akashacms/diagrams-maker, https://github.com/akashacms/plugins-diagrams)
* **@akashacms/plugins-external-links** - Processes links to external sites, adding FAVICONs and a glyph for external links (../akashacms-external-links, https://www.npmjs.com/package/@akashacms/plugins-external-links)
* **@akashacms/plugins-footnotes** - Processes custom tags to add footnotes at the bottom of a web page (../akashacms-footnotes, https://www.npmjs.com/package/@akashacms/plugins-footnotes)
* **@akashacms/plugins-authors** - For showing an information block describing the author of an article (../akashacms-plugins-authors, https://www.npmjs.com/package/@akashacms/plugins-authors)
* **@akashacms/plugins-tagged-content** - Supports categorizing content using vocabulary tags, and generates per-tag index pages (../akashacms-tagged-content, https://www.npmjs.com/package/@akashacms/plugins-tagged-content)
* **@akashacms/theme-bootstrap** - Provides custom tags and partial template overrides for using Bootstrap 4 components on a website (../akashacms-theme-bootstrap, https://www.npmjs.com/package/@akashacms/theme-bootstrap)

## AkashaCMS-based PDF document creator application

**PDF Document Maker** is a comprehensive tool built using AkashaCMS components with the primary purpose of creating good looking PDF documents from Markdown or AsciiDoc source files.  It also contains several PDF manipulation commands. (../pdf-document-construction-set, https://www.npmjs.com/package/@akashacms/pdf-document-maker, https://github.com/akashacms/pdf-document-construction-set)

## Documentation website

The site, http://akashacms.com/, is the primary site for AkashaCMS documentation and news.  It serves three purposes:

1. Publishing documentation and news about AkashaCMS
2. Demonstrating how to configure a somewhat complex AkashaCMS website
3. Demonstrating how to incorporate content that can be rendered as an EPUB into a book-like reading experience on a website

## Example AkashaCMS websites

* **Full example** - Demonstrates all features of AkashaCMS.  Meant to help test features, while providing an example.  (../akashacms-example, https://example.akashacms.com)
* **Blog Skeleton** - Shows how to configure the `@akashacms/plugins-blog-podcast` plugin.  (../akashacms-blog-skeleton)
* **Minimal example** - Small example website (../akashacms-skeleton)
* **Open Source Site** - Demonstrates how an open source software project could build a website, host it on GitHub Pages, while incorporating advanced features.