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
- **SQL**: SQL commands are mostly kept in `sql/` subdirectories, with a file name having a `.sql` extension. These files are dynamically read from disk into an in-memory variable.  In some cases the table name is dynamically selected, and inserted using `SqlString.format`.

## Architecture
- Main entry: `lib/index.ts` exports Configuration class and utilities
- Plugin system: Extend `Plugin` class from `lib/Plugin.ts`
- Rendering: Uses `@akashacms/renderers` for template processing
- Server-side DOM Manipulation: After rendering to HTML, Mahabhuta (`mahabhuta`) is used to drive DOM manipulation using functions defined in the plugins.
- Stacked Directories: Four kinds of directories are defined: assets, partials, layouts, and documents.  For each type, multiple directories can be stacked on top of one another in a virtual filesystem.  A key principle is the ability to override a file, such as a partial template, by mounting a directory on the corresponding directory stack, and adding a file of the same name to that directory.  This is implemented by the VFStack class in `lib/cache/vfstack.ts`.
- Caching: SQLite-based file caching in `lib/cache/`.  The file information is gathered by the VFStack scanning process during initialization.
- In-Memory SQLITE3 database: A lot of data is kept in this database, allowing for ease of accessing the data in any desired fashion.
- Database request caching: Some database queries are repeated multiple times, and a cache is used to hold such data to prevent excess queries for the same data.
- Testing: Mocha with Chai assertions, ES modules (.mjs files)

## Configuring an AkashaCMS project

The sibling directories ../akashacms-blog-skeleton, ../akashacms-example, ../akashacms-skeleton, ../akashacms-website, ../open-source-site, and ../pdf-document-construction-set/guide all contain examples of an AkashaCMS project which renders to a website.

The key features of a project directory are:

1. `package.json` containing dependencies to packages required by the project, as well as scripts used for building, previewing, or deploying the website
2. `config.mjs` containing configuration declarations, in JavaScript, for the project

In the configuration, one lists:

* the required plugins, their configuration.  A plugin is added using the `use` function.
* the directories in which to find assets, partial templates, layout templates, and documents.  This is done with `addAssetsDir`, `.addPartialsDir`, `addLayoutsDir`, and `addDocumentsDir` function calls.
* possible configuration for Markdown-IT, such as plugins from its ecosystem -- such configuration is accessed with `config.findRendererName('.html.md')`
* adding JavaScript references for the top of the document (using `addHeaderJavaScript`) or the bottom of the document (using `addFooterJavaScript`)
* Adding CSS stylesheet references (using `addStylesheet`)

The `config.prepare` function prepares the configuration for use.

The `export default config` declaration makes it available for use by AkashaRender.

## Rendering an AkashaCMS project into a website

With the configuration of an AkashaCMS project directory, and with the creation of files related to the project, one runs the command:

```shell
npx akasharender render config.mjs
```

The file `lib/cli.mjs` serves as an example of invoking various API methods in AkashaRender.  The `render` command is useful to see how the configuration object and other parts of the system work together.

It starts with importing the configuration:

```js
const config = (await import(
    path.join(process.cwd(), configFN)
)).default;
```

It's used this way because the pathname for the configuration is not known at compile time, but at execution time.

Next:

```js
let akasha = config.akasha;
await akasha.setup(config);
await data.removeAll();
if (cmdObj.copyAssets) {
    await config.copyAssets();
}
let results = await akasha.render(config);
```

Running `akasha.setup` performs additional setup.  The primary step there is to use the StackedDirs package to read all file information into the caches.

The `copyAssets` function copies the asset files into the output directory.

The `render` function renders all files in the documents directories into the output directory, using the plugin templates and layout templates as appropriate.

## Core Dependencies
- **mahabhuta**: DOM manipulation engine for post-processing HTML (../mahabhuta, https://www.npmjs.com/package/mahabhuta, https://github.com/akashacms/mahabhuta).
- **VFStack** (lib/cache/vfstack.ts): Internal virtual file system for layered directory structures. Provides stacked directory functionality for assets, partials, layouts, and documents.
- **@akashacms/renderers**: Template rendering engines (Markdown, EJS, Nunjucks, etc.) (../renderers, https://www.npmjs.com/package/@akashacms/renderers, https://github.com/akashacms/rendering-engines)

## AkashaCMS plugins

"AkashaCMS" is the name for an ecosystem including AkashaRender, Mahabhuta, @akashacms/renderers, and the plugins.  The plugins are used by AkashaRender to extend its functionality.

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

## Wiki Directory - LLM-CODE-WIKI

The `wiki/` directory contains an LLM-CODE-WIKI knowledge base that documents AkashaRender's codebase through AI-generated summaries, concepts, and architectural documentation.

**IMPORTANT: When modifying files in the `wiki/` directory, you MUST follow the rules and workflows defined in `wiki/AGENTS.md`.**

Key points:
- The wiki has its own comprehensive ruleset in `wiki/AGENTS.md` covering file naming, frontmatter format, required sections, workflows, and citation rules
- Wiki files are structured documentation (summaries, concepts, answers, architecture, implementation, logs)
- Log files in `wiki/log/` are write-once, read-only audit trails (must be set to chmod 0444 after creation)
- All wiki changes must be logged in `wiki/log/` with timestamped entries
- Wiki pages must follow strict formatting and citation requirements

Before making any changes to wiki files, read and follow the guidelines in `wiki/AGENTS.md`.

## Multi-Agent Development Workflow

This project uses a collaborative multi-agent system for software development. Four specialized agents work together, iterating through requirements, implementation, review, and testing until the code is correct.

### The Agents

| Agent | Role | Tools |
|-------|------|-------|
| **Program Manager** | Requirements, coordination, validation | Read, Write, Grep, Glob |
| **Builder** | Code implementation | Read, Write, Edit, Bash, Grep, Glob |
| **Code Reviewer** | Quality and architecture checks | Read, Grep, Glob, Write |
| **Quality Assurance** | Test writing and execution | Read, Write, Edit, Bash, Grep, Glob |

Agent definitions are in `.opencode/agents/`.

### Workflow Process

```
PM (requirements) --> Builder --> Code Reviewer --> QA --> PM (validation)
                         ^              |            |           |
                         |              v            v           v
                         +-------- NEEDS_REVISION ---------------+
```

1. **Program Manager** defines requirements and acceptance criteria
2. **Builder** implements the code and runs the build
3. **Code Reviewer** validates quality, architecture, and conventions
4. **QA** writes comprehensive tests and runs them
5. **Program Manager** validates deliverables against requirements
6. Any agent can route back to Builder if issues are found

### State Management

Agents communicate via `WORKFLOW.md` in the project root. Each agent runs with fresh context (no inherited memory), so all state must be persisted in this file.

The workflow file tracks:
- Source feature plan (if applicable)
- Current phase and task
- Requirements with acceptance criteria
- Handoff notes between agents
- Files changed
- Validation results

### Starting New Work

**Option 1: Ad-hoc Task**
```
@program-manager Add a function to validate configuration options
```

**Option 2: From a Feature Plan**
```
@program-manager Please start working on @FEATURE-Tag-Wrangling.md
```

Or use the command:
```
/feature-plan FEATURE-Tag-Wrangling.md
```

### Feature Plan Files

Feature plans (e.g., `FEATURE-*.md`) document larger features with:
- Problem context and background
- Requested functionality
- Main tasks with detailed specifications
- Phased implementation plan
- Testing requirements

When working from a feature plan:
1. Program Manager reads the entire plan
2. Identifies completed tasks (marked DONE) vs pending tasks
3. Extracts requirements for the next task
4. Creates `WORKFLOW.md` scoped to that task
5. After task completion, returns to the plan for the next task

### Continuing Work

If `WORKFLOW.md` exists:
1. Check the "Next Agent" field to see who should work
2. Invoke that agent: `@builder`, `@code-reviewer`, `@quality-assurance`, or `@program-manager`
3. The agent reads `WORKFLOW.md` and continues from the current state

### Agent Invocation Examples

```
# Start from a feature plan
@program-manager Read FEATURE-Tag-Wrangling.md and begin Phase 1

# Continue with builder after PM sets requirements
@builder

# Review code after builder completes
@code-reviewer

# Run QA after code review passes
@quality-assurance

# Validate completion after QA passes
@program-manager
```

### Commands

- `/workflow` - Start or continue the development workflow
- `/feature-plan <file>` - Start work from a feature plan file
- `/build` - Build the project (can be used independently)
- `/test` - Run the test suite (can be used independently)

### Best Practices

1. **One task at a time**: Complete each task fully before starting the next
2. **Read WORKFLOW.md first**: Every agent should read the workflow state before starting
3. **Update handoff notes**: Document decisions, issues, and context for the next agent
4. **Mark completed tasks**: Update feature plan files when tasks are done
5. **Don't skip steps**: Every code change should go through Code Review and QA
6. **Route back when needed**: If something is wrong, send it back rather than proceeding