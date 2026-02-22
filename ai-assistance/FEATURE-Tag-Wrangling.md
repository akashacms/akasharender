A site developer will want a better view of the tags in use on the site, and ability to manage the tags.

Recall that document tags are defined in the frontmatter of each document.  A frontmatter field, `tags`, holds an array of tag names.  There is no central registry of tag names.

A tag definition is this object:

```typescript
{
	tagName: string,
	description: string
}
```

I don't remember if this object is formally defined anywhere.  In `index.ts`, in the `Configuration` class, there is an internal array where this is defined:

```typescript
#descriptions: Array<{
	tagName: string,
	description: string
}>;
```

The configuration file might call the `addTagDescriptions` function to provide descriptions for some tags.

The `description` field is primarily used by the `@akashacms/plugins-tagged-content` plugin when it generates tag index pages.  The description is meant to appear at the top of the tag index page.

The `addTagDescriptions` function probably has a bug in that it simply assigns the tag descriptions to the internal array.  The bug is what if there are existing tag descriptions?  Shouldn't it instead merge the new descriptions into the array rather than blowing away the array?  The assumption is this function will be called only one time, from the configuration file, and this problem scenario will not happen.

The existing internal API for tags and tag management is in `cache/tag-glue.ts`.  A table is defined, `TAGGLUE`, where the schema is:

```sql
CREATE TABLE IF NOT EXISTS
TAGGLUE (
  docvpath STRING,
  tagName STRING
);
```

That is, it maps the `vpath` of a document with a `tagName`.

Getting the list of all tags is:

```sql
SELECT DISTINCT tagName AS tag
FROM TAGGLUE;
```
Or, the list of documents which use a given tag is:

```sql
SELECT DISTINCT docvpath AS vpath
FROM TAGGLUE
WHERE tagName = $tag;
```
In `cli.ts` the commands related to tags are:

- `tags` -- Retrieves the list of all tags
- `docs-with-tag` -- Retrieves the list of documents with a given tag
- `search` -- takes an option allowing one to select by tag name

# Requested new functionality

- Finding similar tag names - to detect excess tag names
- Refactoring tag names, meaning to change all uses of a given tag to another tag
- Finding tags that have no description
- Finding unused tags. 

These should be

- API functions
- Commands in `cli.ts`

The output format from `cli.ts` should be YAML formatted for easy reading.

_Finding similar tags_ should consider:

- Case insensitive matching
- Plural/singular variants -- using `pluralize`
- Common typos
- Levenshtein Distance -- using `fastest-levenshtein`

_Refactoring tag names_ means:

- There are two tag names - *old* and *new* - where the task is to change all instances of the old tag name to the new tag name.  The old tag name should no longer exist after the refactoring.  For any documents that already had the new tag name, there is no need to add the new tag name again because it is already in the file.
- Modifying the front-matter in the documents.
- Akasharender is not involved with version control of documents, that's up to the author of the site
- There should be a dry-run mode, where it lists the changes that would be made rather than performing the changes

_Tags without descriptions_ -- Just list those tag names, along with the files where the tag name is used.  However, the site author will be adding descriptions into the configuration file.

_Finding unused tags_ -- One possible way this condition occurs is when a tag is listed in the configuration file, but no document uses that tag.  The result should simply be to list these tags.
# Main tasks

## 1. Add dependencies

Add to `package.json`:
- `fastest-levenshtein` - for computing edit distance between tag names
- `pluralize` - for detecting singular/plural variants

## 2. Create type definitions

DONE: Created `lib/types.ts` with:
- `TagDescription` interface
- `validTagDescription()` validation function
- `SimilarTagGroup` interface for grouping similar tags
- `SimilarityReason` type
- `TagWithoutDescription` interface
- `RefactorTagResult` and related interfaces

## 3. Create API functions in `lib/cache/tag-glue.ts`

Add the following methods to the `TagGlue` class:

### `findSimilarTags(threshold?: number): Promise<SimilarTagGroup[]>`

Returns groups of tags that are similar to each other. Similarity is determined by:
1. Case-insensitive exact matches (e.g., `JavaScript` and `javascript`)
2. Plural/singular variants using `pluralize` (e.g., `tag` and `tags`)
3. Levenshtein distance ≤ threshold (default 2)

Returns an array of `SimilarTagGroup` objects. Each group contains:
- `tags`: Array of similar tag names
- `reasons`: Why they are similar (case-insensitive, plural-singular, levenshtein)
- `documentsByTag`: Map of tag name to array of document vpaths using that tag

### `tagsWithoutDescriptions(): Promise<TagWithoutDescription[]>`

Queries TAGGLUE for all tags, then checks TAGDESCRIPTION for each. Returns tags that have no entry in TAGDESCRIPTION, along with the list of document vpaths using each tag.

### `unusedTagDescriptions(): Promise<string[]>`

Queries TAGDESCRIPTION for all defined tags, then checks TAGGLUE. Returns tag names that have descriptions but are not used by any document.

## 4. Create SQL files

Add to `lib/cache/sql/`:
- `select-all-tags-with-docs.sql` - Get all tags with their document vpaths
- `select-tags-without-descriptions.sql` - LEFT JOIN to find tags missing descriptions
- `select-unused-descriptions.sql` - Find descriptions with no matching tags in TAGGLUE

## 5. Create refactoring function in `lib/refactor-tags.ts`

### `refactorTag(config, oldTag: string, newTag: string, options: { dryRun: boolean }): Promise<RefactorTagResult>`

1. Query TAGGLUE for all documents with `oldTag`
2. For each document:
   - Read the file from disk using the document's `fspath`
   - Parse the frontmatter
   - If document already has `newTag`, just remove `oldTag` from the tags array
   - Otherwise, replace `oldTag` with `newTag` in the tags array
   - If `dryRun` is false, write the modified frontmatter back to the file
3. Return a `RefactorTagResult` object listing all changes made (or that would be made)

Note: This function modifies source files on disk, not the database. The database will reflect the changes on the next `akasha.setup()` call.

## 6. Add CLI commands in `lib/cli.ts`

### `similar-tags <configFN>`
Options: `--threshold <n>` (default: 2)

Calls `findSimilarTags()` and outputs results in YAML format.

### `tags-without-descriptions <configFN>`

Calls `tagsWithoutDescriptions()` and outputs results in YAML format.

### `unused-tag-descriptions <configFN>`

Calls `unusedTagDescriptions()` and outputs results in YAML format.

### `refactor-tag <configFN> <oldTag> <newTag>`
Options: `--dry-run` (default: false)

Calls `refactorTag()` and outputs results in YAML format showing files modified (or that would be modified).

## 7. Update existing `tags` command

Modify the existing `tags` command in `cli.ts` to output YAML format for consistency with the new commands.

## 8. Add comment about potential bug in `addTagDescriptions`

In `lib/index.ts`, add a comment at line 1062 noting that the current implementation replaces the array rather than merging, which could lose descriptions if called multiple times. This is deferred for future fix.

## 9. Refactor existing code to use TagDescription type

Update `lib/index.ts` to import and use the `TagDescription` type from `lib/types.ts` instead of inline type definitions. This includes the `#descriptions` array and the `addTagDescriptions()` method parameter.

## 10. Document the tags implementation

Create `IMPLEMENTATION-tags.md` discussing all aspects of document tags in AkashaRender.

This must also include documenting the `@akashacms/plugins-tagged-content` plugin. Its implementation is in the https://github.com/akashacms/akashacms-tagged-content repository. That repository is checked out on disk in the `/home/david/Projects/akasharender/akashacms-tagged-content` directory.

# Backlog tasks

**~~Add formal type description for a tag with description~~**: DONE - Created `lib/types.ts` with `TagDescription` interface and `validTagDescription()` function. 

# Plan

## Phase 1: Setup

1. Add `fastest-levenshtein` and `pluralize` to `package.json` dependencies
2. ~~Create `lib/types.ts` with type definitions~~ DONE

## Phase 2: API Implementation

3. Create SQL files in `lib/cache/sql/`:
   - `select-all-tags-with-docs.sql`
   - `select-tags-without-descriptions.sql`
   - `select-unused-descriptions.sql`

4. Implement `findSimilarTags()` in `TagGlue` class (`lib/cache/tag-glue.ts`)
   - Load SQL file
   - Fetch all tags with documents
   - Compare tags for similarity (case, plural/singular, Levenshtein)
   - Group similar tags together
   
5. Implement `tagsWithoutDescriptions()` in `TagGlue` class
   - Load SQL file
   - Return tags missing from TAGDESCRIPTION table
   
6. Implement `unusedTagDescriptions()` in `TagDescriptions` class
   - Load SQL file  
   - Return descriptions with no matching tags

7. Create `lib/refactor-tags.ts` with `refactorTag()` function
   - Handle frontmatter parsing and modification
   - Implement dry-run mode
   - Return structured result

## Phase 3: CLI Commands

8. Add `similar-tags` command to `lib/cli.ts`
9. Add `tags-without-descriptions` command to `lib/cli.ts`
10. Add `unused-tag-descriptions` command to `lib/cli.ts`
11. Add `refactor-tag` command to `lib/cli.ts`
12. Update existing `tags` command to output YAML format

## Phase 4: Documentation and Cleanup

13. Add comment about potential bug in `addTagDescriptions` (line 1062 of `lib/index.ts`)
14. Refactor `lib/index.ts` to use `TagDescription` type from `lib/types.ts`
15. Create `IMPLEMENTATION-tags.md` documenting the tags implementation

## Testing

Tests follow the project pattern: test API functions directly rather than CLI commands. Tests are written in Mocha with Chai assertions, using ES modules (`.mjs` files).

### Test file location

Add a new `describe` block in `test/test-cache.mjs` within the existing `tags` describe block (around line 1001), or create a new describe block for "tag wrangling" after the existing tags tests.

### Test fixtures needed

Add new document files to `test/documents/` to create conditions for similarity detection:

- `tags-similar-case.html.md` - with tags like `javascript`, `JavaScript` (case variants)
- `tags-similar-plural.html.md` - with tags like `tag`, `tags` (plural/singular)
- `tags-similar-typo.html.md` - with tags like `JavaScipt` (typo, Levenshtein distance 1)

Update the `addTagDescriptions` call in the test configuration (around line 23 of `test-cache.mjs`) to include:
- A description for a tag that no document uses (to test `unusedTagDescriptions`)
- Leave some tags without descriptions (already the case for Tag2, Tag3, etc.)

### Tests for `findSimilarTags()`

- Should return empty array when no similar tags exist
- Should group case-insensitive matches (e.g., `javascript` and `JavaScript`)
- Should group plural/singular variants (e.g., `tag` and `tags`)
- Should group tags within Levenshtein threshold
- Should include correct documents for each tag in the group
- Should respect custom threshold parameter

### Tests for `tagsWithoutDescriptions()`

- Should return tags that have no entry in TAGDESCRIPTION
- Should include document vpaths for each tag
- Should return empty array when all tags have descriptions

### Tests for `unusedTagDescriptions()`

- Should return tag names that have descriptions but no documents
- Should return empty array when all described tags are used

### Tests for `refactorTag()`

For refactor testing, use a dedicated test documents directory or create temporary files to avoid modifying the main test fixtures.

- Should identify all documents with the old tag (dry-run mode)
- Should correctly replace old tag with new tag in frontmatter
- Should handle case where document already has the new tag (merge case)
- Should preserve other frontmatter fields unchanged
- Should return accurate counts in result object
- Should not modify files in dry-run mode
