This file describes an LLM-CODE-WIKI for the AkashaRender project.  LLM-CODE-WIKI is meant to be an LLM-WIKI for CODE.  The LLM-WIKI concept is a knowledge base derived from DOCUMENTS.  An LLM-CODE-WIKI is meant to be a knowledge base derived from CODE, meaning text written in a programming language, and there might be some documents.

Programmers tend to be too lazy to properly document their code.  But, really, it is a good idea to write some documentation.  You shouldn't treat documentation as a backlog item, but as part of writing the code.  Right?

Anyway, what we're doing here is an experiment with applying the LLM-WIKI idea to a pile of software.  This means:

- Writing "*summary*" files from every source file.
- Deriving "*concept documents*" from what's found in the source files
- This should be enough for a human to ask questions of an LLM about the code
- The LLM should be able to derive "*answer documents*" from those queries
- The LLM should be able to derive "*architecture documents*" from everything
- The LLM should be able to help design new features, work on bug fixes, etc

The rules in `AGENTS.MD` should be consulted for 
# Directory structure

The directory structure we'll use is:

- *`../built-in-guide/`* -- This is existing documentation for the "Built-in Plugin" which is in the file `lib/built-in.ts`.  This documentation was written by the human project leader.  
- *`../layouts/`* -- Page layout template files for use by the Built-in Plugin.
- *`../partials`* -- Templates for use by the Built-in Plugin.
- *`../guide/`* -- This is the existing for AkashaRender.   This documentation was written by the human project leader.
- *`../lib/`* -- The source code for AkashaRender.  The LLM should treat
- *`../test/`* -- The AkashaRender test suite.
- `../ai-assistance/` -- Documents created by LLMs for previous work on AkashaRender.  These files contain architectural and implementation details for some tasks performed on AkashaRender.
- *`../wiki/`* -- The generated LLM-CODE-WIKI
- *`../wiki/index.md`* -- Master index of the Wiki
- *`../wiki/log`* -- Holds log files tracking the changes made in a given work session.  This forms an audit trail of what has happened in the wiki.
- *`../wiki/summaries/`* -- Summarizes the content of each source file in the `../lib/` and `../test/` directories.  This directory must be structured with the same directory hierarchy as in the  `../lib/` and `../test/` directories.    Hence, a file `../lib/file.ts` will be summarized as `../wiki/summaries/lib/file.ts`.
- *`../wiki/concepts/`* -- Documents the *concepts* found in the source files.  In this context, a concept is a software idiom that's frequently used, or software architecture idioms.
- *`../wiki/answers/`* -- As the user asks questions about the code base, some of the answers written by the LLM will be good enough to save.  Hence, this directory contains answers to questions.
- *`../wiki/architecture/`*  -- The user may ask the LLM to write an overview of the architecture for the source code.
- *`../wiki/implementation/`* -- The user may ask the LLM to write an implementation guide for a new feature, bug fix, or other task.

The paths labeled `../wiki/` actually correspond to the directory where this file resides.

The content in the `built-in-guide/`, `layouts/`, `partials/`, `guide/`, `lib/`, and `test/` directories must be treated by the LLM-CODE-WIKI as immutable source documents.  The LLM, when acting as the LLM-CODE-WIKI, must never modify those files.

The files in `node_modules/` and `dist/` must always be completely ignored.
## File Naming

- All lowercase, hyphens for word separation: `concept-name.md`
- No spaces, no special characters (especially `:`), no uppercase
- Name should match the page title slug

## Page Format

Every wiki page,  uses these frontmatter properties:

```yaml
---
title: "Page Title"
type: concept | summary | answer | log
Sources:
  # List of raw source files this page draws from.
  - raw/path/to/file1.md
  - raw/path/to/file2.md
Categories:
  # List of categorization tags
  - category1
  - category2
date-created: 2026-04-18T12:00:00+03:00
last-updated: 2026-04-18T12:00:00+03:00
confidence: high | medium | low
---
```


The page frontmatter is to be in YAML format, with the target being the Obsidian program. For example the entry for _Sources_ is described as a list, which means it should be formatted as a YAML array. The sources are to be relative file URLs from the root of the repository.

You must make sure the frontmatter is in correct YAML format. This means quoting values when necessary.  An example is a frontmatter property including the `:` letter in the text, which would cause a YAML formatting error.  In such cases quote the property value. 

Other frontmatter fields may be used.

The Sources list should refer to any files in the directories outside `wiki/` that was used as a source in this document.

The entry for Categories is also described as a list, which means it should be formatted as a YAML array. The content of the Categories list is a short keyword phrase to be used for categorizing information.

The _type_ field records what type of page this is.
### Required Sections by Page Type

When generating a file in the `wiki/` directory, it is of a *page type* as defined by the string in the `type` frontmatter field.  Each of the generated page types be structured with these sections.

**Summary pages** (`wiki/summaries/path/to/file.ext.md`):

Always generate the file under `wiki/summaries/` with a path corresponding to the location of the file within the source tree.

The summary file name must be the source file name with `.md` appended:
- For a TypeScript file `lib/cli.ts`, create `wiki/summaries/lib/cli.ts.md`
- For a JavaScript file `lib/foo.js`, create `wiki/summaries/lib/foo.js.md`
- For a Markdown file `docs/guide.md`, create `wiki/summaries/docs/guide.md` (no double `.md.md`)
- The rule is: append `.md` unless the source already ends in `.md`

For **source code files** (TypeScript, JavaScript, etc.), include a Code Complexity section before Key Points:

- `## Code Complexity` — Metrics about the source code
  - **Lines of code**: Total line count
  - **Exported functions**: Number of major exported functions
  - **Classes**: Number of classes defined
  - **Complexity**: Overall assessment (Low/Medium/High/Very High)
  - **Key components**: Brief description of notable functions, methods, or patterns

For **documentation files** (Markdown, etc.), omit the Code Complexity section.

- `## Key Points` — Bulleted list of main claims/ideas
- `## Summary` -- Summarize the source material
- `## Relevant Concepts` — Links to concept pages this source touches
- `## Related Pages` — Wiki links to related pages
- `## Backlinks` -- Links to pages that link to this page


**Concept pages** (`wiki/concepts/`):

- `## Definition` — One-paragraph plain-English definition
- `## How It Works` — Mechanics, process, or structure of the concept
- `## Key Parameters` — Important variables, dimensions, or factors
- `## When To Use` — Situations and contexts where this concept applies
- `## Risks & Pitfalls` — Known failure modes, common mistakes, limitations
- `## Sources` — Which raw sources inform this page
- `## Related Pages` — Wiki links to related pages
- `## Backlinks` -- Links to pages that link to this page


**Answer pages (`wiki/answers/`)**

These are answers in response to a query.  Make the *Answer* section as long as necessary to comprehensively answer the question.

- `## Query` -- The user query which prompted this answer
- `## Answer` -- The summary answer
- `## Sources` — Which raw sources inform this page
- `## Related Pages` — Wiki links to related pages
- `## Backlinks` -- Links to pages that link to this page

**Architecture pages (`wiki/architecture/`)**

- `## Query` -- The user query which prompted this architecture
- `## Architecture` -- Discuss the architecture related to the user's query
- `## Sources` — Which raw sources inform this page
- `## Related Pages` — Wiki links to related pages
- `## Backlinks` -- Links to pages that link to this page

**Implementation pages (`wiki/implementation/`)**

- `## Query` -- The user query which prompted this architecture
- `## Architecture Pages` — Links to the related architecture pages
- `## Architecture` -- Discuss the how an LLM or human coder should implement the task described in the *Query* section
- `## Sources` — Which raw sources inform this page
- `## Related Pages` — Wiki links to related pages
- `## Backlinks` -- Links to pages that link to this page

**Log pages (`wiki/log/`)**

This is an audit trail describing modifications to the wiki.

- Start with a summary of the changes performed.  Follow by any of the following sections which are appropriate
- `## Analysis` -- List the results of analysis
- `## Changes` -- List the actions taken
- `## Changed files` -- List of any files which were changed
- `## Results` -- List the results of the actions
- `## Recommendations` -- List any recommendations for further work
- `## Conclusion` -- Final result summary
## Linking convention

- Never Obsidian-style wiki links: `[[concepts/concept-name]]`.  This link format is not portable to other Markdown tools, and Obsidian is perfectly able to use normal Markdown links
- Always use normal Markdown links: `[Display Text](../relative/to/file-name.md)`
- Always use relative paths from wiki root
- Every page must link to at least one other page (no orphans)
- When mentioning a concept that has a page, always link it

## Confidence Levels

- **high** — Well-established idea, multiple corroborating sources, demonstrated with concrete examples
- **medium** — Supported by sources but limited examples or single-source
- **low** — Single mention, anecdotal, or speculative

# Workflows

## Ingest workflow

When the user says "ingest [source]" or adds a file to a directory outside the `wiki` directory.  The file to be ingested may be in either the `Clippings/` or `raw/` directories:

1. Read the raw source completely
2. Create `wiki/summaries/path/to/file-name.md` with full summary as described in the *Summary Pages* section above.
3. Identify all concepts mentioned
4. For each concept: create the page if it doesn't exist, or else update the existing page with new information
5. Add cross-links in both directions between all touched pages
6. Update `wiki/index.md` — add new entries, update summaries of changed pages
7. Add a log file to `wiki/log/` with timestamp, source name, pages created/updated
8. Flag any contradictions with existing wiki content

**Note on test files**: Do not ingest files from the `test/` directory. Test files are typically very large and provide limited value for the knowledge base compared to their size. Focus on source code, documentation, and template files instead.
### Update workflow

The files outside the `wiki/` directory will be changed from time to time by processes outside the rules defined for the Wiki.  These changes may invalidate some information in the wiki, or may require adding new content to the wiki.

Therefore the *Update* workflow must either update, delete, or add information as appropriate to the wiki.


1. **Identify document pairs**: List all old/new version pairs found in the specified directory, showing the version numbers clearly
2. **Present pairs to user**: Ask user to confirm which pairs should be processed
3. **For each approved pair**:
   a. Read both the old and new versions completely
   b. Create a structured diff report showing:
      - **DELETED**: Information present in old version but absent in new
      - **MODIFIED**: Information that changed between versions (show what it was and what it became)
      - **ADDED**: Information present in new version but absent in old
   c. Present this diff report to the user for review
4. **After user approval of the diff**:
   a. Update affected summary pages:
      - Remove content based on deletions
      - Modify content based on changes
      - Add content based on additions
      - Update the source reference from old filename to new filename
      - Update the `last-updated` timestamp
   b. Update affected concept pages:
      - Remove or modify sections that reference deleted/changed information
      - Add new sections for new concepts
      - Update source references
      - Update the `last-updated` timestamp
   c. Update affected answer pages if they reference changed information
   d. Update affected architecture pages if they reference changed information
   e. Check and update backlinks in pages that referenced deleted or significantly changed information
   f. Update `wiki/index.md` if page descriptions need to change
   g. Update appropriate README.md files in wiki subdirectories
   h. Create a detailed log entry in `wiki/log/` documenting:
      - Which document was updated (old version → new version)
      - Summary of deletions, modifications, and additions
      - List of all wiki pages modified
5. **Cleanup**: After successful wiki updates, delete the old version from `raw/`
6. **Verification**: Provide a summary showing:
   - Number of pages updated
   - Number of old source files removed
   - Location of the log entry

**Important notes:**
- Always process one document pair at a time to maintain accuracy
- Be thorough in finding all wiki pages that reference the old information
- When information is deleted from a source, carefully assess whether concept pages should remove sections or simply remove the source reference
- If a concept is only mentioned in the old version being replaced, consider whether the concept page should be deleted entirely
- Update all cross-references and backlinks to maintain wiki integrity
### Question answering Workflow

When the user asks a question:

1. Read `wiki/index.md` first to find relevant pages
2. Read those pages and synthesize an answer
3. Cite specific wiki pages in your response
4. If the answer is not in the wiki, say so clearly
5. If the answer is valuable, offer to save it as a new wiki page, in the answers directory

Good answers should be filed back into the wiki so they compound over time.

### Architecture answering Workflow

When the user asks a question about the architecture of an aspect of AkashaRender:

1. Read `wiki/index.md` first to find relevant pages
2. Read those pages and synthesize an architecture document -- focusing on software architecture
3. Cite specific wiki pages in your response
4. If the architecture document is not in the wiki, say so clearly
5. If the architecture document is valuable, offer to save it as a new wiki page, in the architecture directory

Good architecture documents should be filed back into the wiki so they compound over time.
### Implementation design Workflow

When the user asks a question about implementation about a feature in AkashaRender:

1. Read `wiki/index.md` first to find relevant pages
2. The user should have identified an architecture document, and the LLM should look for other architecture, concept, and summary documents
3. Read those pages and synthesize an implementation plan document -- focusing on software implementation
4. Cite specific wiki pages in your response
5. Add the implementation plan document to the wiki

### Lint Workflow

When the user asks you to lint or audit the wiki:

- Check for contradictions between pages
- Find orphan pages (no inbound links from other pages)
- Identify concepts mentioned in pages that lack their own page
- Flag claims that may be outdated based on newer sources
- Check that all pages follow the page format above
- Check that the frontmatter in each document is in correct YAML format
- Check that all links are a relative path reference to the destination, and are not prefixed with "/"
- Check that all `wiki/summaries` files are linked from `wiki/summaries/README.md`
- Check that all `wiki/answers` files are linked from `wiki/answers/README.md`
- Check that all `wiki/concepts` files are linked from `wiki/concepts/README.md`
- Check that all `wiki/architecture files are linked from `wiki/architecture/README.md`
- Check that all `wiki/implementation` files are linked from `wiki/implementation/README.md`
- Report findings as a numbered list with suggested fixes

### Maintaining navigation helper pages Workflow

The directories `wiki/summaries/`, `wiki/concepts/`, `wiki/architecture/`, `wiki/answers/`, `wiki/implementation/`, and `wiki/log/` should have a file `README.md` listing links to the files contained in each directory.

Each `README.md` should have a frontmatter section:

```markdown
---
title: PAGE TYPE index
---
```

The body of the page should be a Markdown list where each item is in the format:

```markdown
- **[TITLE OF DOCUMENT](./document-file-name.md)**: The text of the summary field for that document, or otherwise summarize its content
```

For the `wiki/logs/` directory, the document list in `README.md` should be in reverse chronological order, and should start with the date/time stamp.

### Logging changes in the wiki/log/ directory Workflow

Log files are to be added to `wiki/log/` for every change in the wiki, with the ingest workflow being one example.   The purpose is to have an audit trail when examining why something is said in a generated file.

Each file in the `wiki/log/` directory must be named with a date timestamp in ISO8601 basic format -- `YYYYMMDDTHHMMSSZhhmm.md` -- for cross-platform compatibility (Windows does not allow colons in filenames). For example: `20260425T170000+0300.md`. The timezone offset should match the user's local timezone.

The file should be formatted as follows:

```markdown
---
title: YYYY-MM-DD HH:MM - DESCRIPTION OF THE CHANGE
type: log
Sources:
    # List of the files which were changed
    - wiki/path/to/file1.md
    - wiki/path/to/file2.md
date-created: 2026-04-18T12:00:00+03:00
---

# YYYY-MM-DD HH:MM - DESCRIPTION OF THE CHANGE

Describe the change(s) and rationale

## Changed files

Add a Markdown list of the files being changed
```


## Citation rules

- Every factual claim should reference its source file, using the format `(source: [filename.md](../relative/path/to/filename.md))` after the claim, using relative paths from the current file
- If two sources disagree, note the contradiction explicitly
- If a claim has no source in the wiki, call the users attention, mark it in the text with: *NEEDS VERIFICATION*

## Rules

- Never modify anything in folders outside the `wiki/` folder
- Always update `wiki/index.md` and `wiki/log/` after changes
- Keep page names lowercase with hyphens (e.g. `machine-learning.md`)
- Write in clear, plain language
- When uncertain about how to categorize something, ask the user
- Always express date/time strings in files in the ISO8601 format shown earlier, YYYY-MM-DDTHH:MM:SS+ZZZZ (where ZZZZ is the timezone offset for the user)
