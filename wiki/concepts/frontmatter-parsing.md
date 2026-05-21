---
title: "Frontmatter Parsing"
type: concept
Sources:
  - lib/refactor-tags.ts
  - guide/3-create-content.html.md
  - guide/layouts-partials.html.md
Categories:
  - parsing
  - metadata
  - yaml
date-created: 2026-05-21T06:30:00+03:00
last-updated: 2026-05-21T06:30:00+03:00
confidence: high
---

# Frontmatter Parsing

## Definition

Frontmatter Parsing is the process of extracting YAML metadata from the header section of content files, separating descriptive information from document content to enable template variable substitution, layout specification, and content categorization (source: [guide/3-create-content.html.md](../../guide/3-create-content.html.md)). AkashaRender uses the `gray-matter` library to parse frontmatter while preserving document content integrity.

## How It Works

### Frontmatter Structure

Content files are split into two sections (source: [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md)):

```markdown
---
layout: article.html.ejs
title: My Blog Post
author: Jane Doe
tags:
  - javascript
  - nodejs
date: 2026-05-21
---

<p>This is the content of the article.</p>

The content can be Markdown, HTML, or any supported format.
```

**Frontmatter Section** (lines 1-9):
- Delimited by `---` markers
- Contains YAML-formatted metadata
- Parsed into JavaScript object

**Content Section** (line 11+):
- Everything after closing `---`
- Processed by appropriate renderer
- Receives frontmatter metadata as variables

### The gray-matter Library

AkashaRender uses `gray-matter` for frontmatter processing (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):

```javascript
import matter from 'gray-matter';

// Parse frontmatter
const content = await fs.readFile('blog/post.html.md', 'utf-8');
const parsed = matter(content);

// Access parsed data
parsed.data      // Frontmatter as JavaScript object
parsed.content   // Document content (after frontmatter)
parsed.matter    // Original frontmatter string
parsed.isEmpty   // Whether frontmatter exists
```

**Parsing Example**:
```javascript
const fileContent = `---
title: My Article
tags: [javascript, nodejs]
---
Content here`;

const parsed = matter(fileContent);

console.log(parsed.data);
// {
//   title: 'My Article',
//   tags: ['javascript', 'nodejs']
// }

console.log(parsed.content);
// 'Content here'
```

### Modifying Frontmatter

`gray-matter` enables safe frontmatter modification (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):

```javascript
// Read and parse
const content = await fs.readFile(fspath, 'utf-8');
const parsed = matter(content);

// Modify frontmatter
parsed.data.tags = ['updated', 'tags'];
parsed.data.title = 'New Title';

// Serialize back to file format
const newContent = matter.stringify(parsed.content, parsed.data);

// Write back to file
await fs.writeFile(fspath, newContent, 'utf-8');
```

The `stringify()` method:
- Converts JavaScript object back to YAML
- Adds `---` delimiters
- Preserves content section unchanged
- Maintains file structure integrity

### Frontmatter in Rendering

Frontmatter metadata flows through the rendering pipeline (source: [guide/3-create-content.html.md](../../guide/3-create-content.html.md)):

**Stage 1: Content Rendering**
```markdown
---
title: Welcome
subtitle: A Great Site
---
# <%= title %>
<p><%= subtitle %></p>
```

Renders to:
```html
<h1>Welcome</h1>
<p>A Great Site</p>
```

**Stage 2: Layout Application**
```html
<!-- layout.html.ejs -->
<!DOCTYPE html>
<html>
<head>
    <title><%= title %></title>
</head>
<body>
    <%- content %>
</body>
</html>
```

Final output:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Welcome</title>
</head>
<body>
    <h1>Welcome</h1>
    <p>A Great Site</p>
</body>
</html>
```

### Common Frontmatter Fields

**Layout and Rendering**:
```yaml
layout: article.html.ejs    # Layout template to use
```

**Document Metadata**:
```yaml
title: Article Title         # Document title
author: Jane Doe             # Author name
date: 2026-05-21            # Publication date
description: Brief summary  # Meta description
```

**Taxonomies**:
```yaml
tags:                       # Array of tags
  - javascript
  - tutorial
categories:                 # Array of categories
  - Programming
  - Web Development
```

**Page-Specific Assets**:
```yaml
headerStylesheetsAdd:       # Additional CSS for this page
  - href: /css/special.css
headerJavaScriptAddTop:     # Additional JS in <head>
  - href: /js/analytics.js
```

**Custom Metadata**:
```yaml
customField: value          # Any custom metadata
nestedData:
  foo: bar
  baz: 42
```

### YAML Data Types

Frontmatter supports standard YAML types (source: [guide/3-create-content.html.md](../../guide/3-create-content.html.md)):

**Strings**:
```yaml
title: Simple String
quoted: "String with: colon"
multiline: |
  This is a
  multiline string
```

**Numbers**:
```yaml
count: 42
price: 19.99
```

**Booleans**:
```yaml
published: true
draft: false
```

**Arrays**:
```yaml
tags: [tag1, tag2, tag3]    # Inline
categories:                  # Block
  - cat1
  - cat2
```

**Objects**:
```yaml
author:
  name: Jane Doe
  email: jane@example.com
```

**Null**:
```yaml
optional: null
missing: ~
```

### Metadata Inheritance

Metadata can be provided at multiple levels (source: [guide/configuration.html.md](../../guide/configuration.html.md)):

1. **Global Configuration**: `config.metadata`
2. **Directory Metadata**: `baseMetadata` in `addDocumentsDir()`
3. **Layout Frontmatter**: Metadata in layout file
4. **Document Frontmatter**: Metadata in document file (highest priority)

Document frontmatter overrides all other metadata sources.

### Metadata for AsciiDoc

AsciiDoc documents have limitations (source: [guide/3-create-content.html.md](../../guide/3-create-content.html.md)):

```yaml
---
title: My Doc
count: 42
author: Jane
complex:        # NOT passed to AsciiDoc
  nested: data
---
= Document

Title: {title}
Count: {count}
```

Only String and Number values passed to AsciiDoc as attributes. Objects and functions dropped.

### Tag Refactoring Example

The tag refactoring system demonstrates frontmatter modification (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):

```javascript
export async function refactorTag(config, oldTag, newTag, options) {
    // Find all documents with old tag
    const vpaths = await documentsCache.documentsWithTag(oldTag);
    
    for (const vpath of vpaths) {
        // Read file
        const content = await fs.readFile(fspath, 'utf-8');
        
        // Parse frontmatter
        const parsed = matter(content);
        const originalTags = parsed.data.tags || [];
        
        // Modify tags
        const newTags = originalTags.map(t => 
            t === oldTag ? newTag : t
        );
        
        // Update frontmatter
        parsed.data.tags = newTags;
        
        // Write back (unless dry run)
        if (!options.dryRun) {
            const newContent = matter.stringify(parsed.content, parsed.data);
            await fs.writeFile(fspath, newContent, 'utf-8');
        }
    }
}
```

## Key Parameters

**gray-matter API**:
- `matter(string)` - Parse frontmatter from file content
- `matter.stringify(content, data)` - Serialize frontmatter + content
- `parsed.data` - Frontmatter as JavaScript object
- `parsed.content` - Content after frontmatter
- `parsed.matter` - Original frontmatter string
- `parsed.isEmpty` - Boolean indicating if frontmatter exists

**Frontmatter Delimiters**:
- Opening: `---` on first line
- Closing: `---` after YAML block
- Must be at start of line
- No whitespace before delimiters

**Rendering Context**:
- Frontmatter variables available in templates
- Accessed like `<%= title %>` (EJS), `{{ title }}` (Nunjucks)
- Type preserved from YAML (strings, numbers, arrays, objects)

## When To Use

Use frontmatter:

1. **Layout Specification**: Control page structure per document
   ```yaml
   layout: blog-post.html.ejs
   ```

2. **Document Metadata**: Title, author, date for templates
   ```yaml
   title: My Article
   author: Jane Doe
   date: 2026-05-21
   ```

3. **Taxonomy and Organization**: Tags and categories
   ```yaml
   tags: [javascript, tutorial]
   categories: [Programming]
   ```

4. **SEO and Social**: Meta descriptions, Open Graph data
   ```yaml
   description: Learn JavaScript fundamentals
   ogImage: /images/social.png
   ```

5. **Conditional Rendering**: Control template behavior
   ```yaml
   showToc: true
   enableComments: false
   ```

6. **Custom Data**: Domain-specific metadata
   ```yaml
   recipe:
     prepTime: 15
     cookTime: 30
     servings: 4
   ```

7. **Programmatic Access**: Query documents by metadata
   ```javascript
   const drafts = await documentsCache.search({
       metadata: { draft: true }
   });
   ```

## Risks & Pitfalls

**YAML Syntax Errors**: Invalid YAML causes parsing failures:
```yaml
# WRONG: Unquoted colon
title: My Article: A Deep Dive
# ERROR: Unexpected colon

# CORRECT: Quote strings with colons
title: "My Article: A Deep Dive"
```

**Indentation Errors**: YAML is whitespace-sensitive:
```yaml
# WRONG: Inconsistent indentation
author:
  name: Jane
    email: jane@example.com
# ERROR: Invalid indentation

# CORRECT: Consistent indentation
author:
  name: Jane
  email: jane@example.com
```

**Missing Closing Delimiter**: Frontmatter must close properly:
```markdown
---
title: My Doc
# ERROR: Missing closing ---

Content here
```

Entire file treated as frontmatter or parsing fails.

**Array Syntax Confusion**: Mixing inline and block syntax:
```yaml
# INCONSISTENT (but valid)
tags: [tag1, tag2]
categories:
  - cat1
  - cat2

# CONSISTENT: Choose one style
tags:
  - tag1
  - tag2
categories:
  - cat1
  - cat2
```

**Reserved Keywords**: Some keys have special meaning:
```yaml
layout: ...      # Controls layout template
content: ...     # Overrides rendered content variable (avoid)
```

**Data Type Loss**: Modifying frontmatter can change types:
```javascript
// Original: count: 42
parsed.data.count = "42";  // Accidentally stringified

// Serialize back writes: count: "42"
// Type changed from number to string
```

**Encoding Issues**: Non-UTF-8 files cause parsing errors (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):
```javascript
// CORRECT: Specify UTF-8 encoding
const content = await fs.readFile(fspath, 'utf-8');

// WRONG: Default encoding may differ
const content = await fs.readFile(fspath);
```

**Merge Conflicts**: Git merges in frontmatter can corrupt YAML:
```yaml
<<<<<<< HEAD
title: Version A
=======
title: Version B
>>>>>>> branch
```

Manually resolve conflicts to valid YAML.

**Multiline String Pitfalls**: Different styles behave differently:
```yaml
# Literal (preserves newlines and indentation)
description: |
  Line 1
  Line 2

# Folded (joins lines, preserves paragraphs)
description: >
  Line 1
  Line 2

# Plain (joins all lines)
description:
  Line 1
  Line 2
```

**Metadata vs. Content Confusion**: Variables must be in frontmatter to be available:
```markdown
---
title: My Article
---

# The title is: <%= title %>  <!-- Works -->
# The author is: <%= author %> <!-- ERROR: author not defined -->
```

**Security with User-Provided Frontmatter**: Allowing users to edit frontmatter enables code injection (source: [lib/refactor-tags.ts](../../lib/refactor-tags.ts)):
```yaml
---
malicious: '<script>alert("XSS")</script>'
---
```

Always escape when rendering: `<%= value %>` (EJS) auto-escapes, `<%- value %>` does not.

## Sources

- [lib/refactor-tags.ts](../../lib/refactor-tags.ts) - Frontmatter modification with gray-matter
- [guide/3-create-content.html.md](../../guide/3-create-content.html.md) - Content file format
- [guide/layouts-partials.html.md](../../guide/layouts-partials.html.md) - Frontmatter in layouts

## Related Pages

- [Template Rendering](./template-rendering.md) - How frontmatter variables are used
- [Layout Templates](./layout-templates.md) - Layout specification via frontmatter
- [Tag System](./tag-system.md) - Tags in frontmatter
- [Tag Refactoring](./tag-refactoring.md) - Batch frontmatter modification

## Backlinks

- [wiki/summaries/lib/refactor-tags.ts.md](../summaries/lib/refactor-tags.ts.md)
