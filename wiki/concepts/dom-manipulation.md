---
title: "DOM Manipulation"
type: concept
Sources:
  - lib/mahafuncs.ts
  - lib/render.ts
  - lib/built-in.ts
Categories:
  - dom
  - html-processing
  - post-processing
date-created: 2026-05-21T06:10:00+03:00
last-updated: 2026-05-21T06:10:00+03:00
confidence: high
---

# DOM Manipulation

## Definition

DOM Manipulation is the technique of programmatically modifying HTML structure, attributes, and content after initial rendering using jQuery-like selectors and operations (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)). In AkashaRender, DOM manipulation is performed by the [Mahabhuta System](./mahabhuta-system.md) using the Cheerio library, enabling plugins to transform HTML without writing complex regex or string operations.

## How It Works

### Cheerio as the DOM Engine

AkashaRender uses Cheerio, a fast, flexible implementation of jQuery core designed for server-side HTML manipulation (source: [lib/render.ts](../../lib/render.ts)). Cheerio provides:

- jQuery-compatible selector syntax (`$('div.class')`, `$('#id')`, etc.)
- DOM traversal methods (`.find()`, `.parent()`, `.siblings()`, etc.)
- Element modification (`.attr()`, `.addClass()`, `.html()`, etc.)
- Element creation and insertion (`.append()`, `.prepend()`, `.replaceWith()`, etc.)
- No browser overhead or JavaScript execution

### DOM Manipulation Workflow

DOM manipulation occurs in the third stage of the [Three-Stage Rendering](./three-stage-rendering.md) pipeline (source: [lib/render.ts](../../lib/render.ts)):

1. **HTML Input**: Fully-rendered HTML from Stage 2 (after layout application)
2. **Parse**: Cheerio parses HTML into a DOM tree
3. **Select**: Mahafuncs use selectors to find target elements
4. **Modify**: Mahafuncs transform elements, attributes, content
5. **Serialize**: Modified DOM tree serialized back to HTML string
6. **Output**: Final HTML written to output directory

### Common DOM Operations

**Querying Elements**:
```javascript
const links = $('a[href]');              // All links with href
const images = $('img');                  // All images
const headers = $('h1, h2, h3');          // Multiple selectors
const firstPara = $('p').first();         // First paragraph
const navLinks = $('#nav a');             // Links within #nav
```

**Reading Attributes and Content**:
```javascript
const href = $link.attr('href');          // Get href attribute
const title = $element.attr('title');     // Get title
const text = $element.text();             // Get text content
const html = $element.html();             // Get inner HTML
```

**Modifying Attributes**:
```javascript
$link.attr('href', newUrl);               // Set href
$link.attr('target', '_blank');           // Add target
$link.removeAttr('title');                // Remove attribute
$img.attr({                               // Set multiple attributes
    'src': newSrc,
    'alt': altText,
    'loading': 'lazy'
});
```

**Modifying Classes**:
```javascript
$element.addClass('highlight');           // Add class
$element.removeClass('old');              // Remove class
$element.toggleClass('active');           // Toggle class
$element.hasClass('selected');            // Check for class
```

**Modifying Content**:
```javascript
$element.text('New text');                // Set text content
$element.html('<strong>HTML</strong>');   // Set HTML content
$element.empty();                         // Remove all children
```

**Creating and Inserting Elements**:
```javascript
const newDiv = $('<div class="wrapper"></div>');
$element.append(newDiv);                  // Insert as last child
$element.prepend(newDiv);                 // Insert as first child
$element.before(newDiv);                  // Insert before
$element.after(newDiv);                   // Insert after
$element.replaceWith(newDiv);             // Replace element
$element.wrap(newDiv);                    // Wrap element
```

**Removing Elements**:
```javascript
$element.remove();                        // Remove from DOM
$element.removeAttr('onclick');           // Remove attribute
```

**Traversing the DOM**:
```javascript
$element.parent();                        // Parent element
$element.parents('div');                  // All ancestor divs
$element.children();                      // Direct children
$element.find('a');                       // Descendant links
$element.siblings();                      // Sibling elements
$element.next();                          // Next sibling
$element.prev();                          // Previous sibling
```

### Mahafunc Types for DOM Manipulation

Different mahafunc types are optimized for different DOM manipulation patterns (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)):

**CustomElement**: For replacing custom tags
```javascript
class EmbedVideo extends CustomElement {
    get elementName() { return 'embed-video'; }
    
    async process($element, metadata, dirty) {
        const videoId = $element.attr('id');
        const iframe = $(`
            <iframe src="https://youtube.com/embed/${videoId}"></iframe>
        `);
        $element.replaceWith(iframe);
        dirty.dirty = true;
    }
}
```

**ElementTweaker**: For modifying existing elements
```javascript
class LinkProcessor extends ElementTweaker {
    selector() { return 'a[href]'; }
    
    async process($link, metadata, dirty) {
        const href = $link.attr('href');
        if (href.startsWith('http')) {
            $link.attr('target', '_blank');
            $link.attr('rel', 'noopener noreferrer');
            dirty.dirty = true;
        }
    }
}
```

**Munger**: For multi-element transformations
```javascript
class TableOfContents extends Munger {
    async process($, metadata, dirty) {
        const headings = $('h2, h3');
        const toc = $('<ul class="toc"></ul>');
        
        headings.each((i, elem) => {
            const $heading = $(elem);
            const id = $heading.attr('id') || `heading-${i}`;
            $heading.attr('id', id);
            
            toc.append(`
                <li><a href="#${id}">${$heading.text()}</a></li>
            `);
        });
        
        $('#toc-placeholder').replaceWith(toc);
        dirty.dirty = true;
    }
}
```

**PageProcessor**: For whole-document operations
```javascript
class MetaTagInjector extends PageProcessor {
    async process($, metadata, dirty) {
        $('head').append(`
            <meta property="og:title" content="${metadata.title}">
            <meta property="og:description" content="${metadata.description}">
        `);
        dirty.dirty = true;
    }
}
```

### The Dirty Flag

Mahafuncs must set `dirty.dirty = true` when they modify the DOM (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)). This signals to Mahabhuta that serialization is needed. Without this flag, changes are silently lost:

```javascript
async process($element, metadata, dirty) {
    $element.addClass('processed');
    dirty.dirty = true;  // CRITICAL: Must set dirty flag
}
```

### Cheerio Configuration

Cheerio behavior can be configured via `mahabhutaConfig` in Configuration (source: [lib/render.ts](../../lib/render.ts)):

```javascript
config.mahabhutaConfig = {
    decodeEntities: false,    // Don't decode HTML entities
    xmlMode: false,           // Parse as HTML, not XML
    lowerCaseTags: true,      // Normalize tag names
    lowerCaseAttributeNames: true
};
```

## Key Parameters

**Cheerio Configuration Options** (via `config.mahabhutaConfig`):
- `decodeEntities` - Whether to decode HTML entities (default varies)
- `xmlMode` - Parse as XML instead of HTML (default: false)
- `lowerCaseTags` - Normalize tag names to lowercase
- `lowerCaseAttributeNames` - Normalize attribute names

**Mahafunc Context Parameters**:
- `$` - Cheerio instance with loaded HTML
- `$element` - Specific element being processed (for CustomElement/ElementTweaker)
- `metadata` - Document frontmatter and metadata
- `dirty` - Object with `dirty` flag to indicate DOM modifications

**Common Selector Patterns**:
- `'tag'` - All elements with tag name
- `'.class'` - All elements with class
- `'#id'` - Element with ID
- `'[attr]'` - Elements with attribute
- `'[attr="value"]'` - Elements with attribute value
- `'tag.class'` - Compound selector
- `'parent > child'` - Direct children
- `'ancestor descendant'` - All descendants

## When To Use

Use DOM manipulation:

1. **Custom Tag Replacement**: Convert custom tags to standard HTML
   ```html
   <youtube-video id="abc123" /> → <iframe src="..."></iframe>
   ```

2. **Link Processing**: Modify link attributes based on URL patterns
   - Add `target="_blank"` for external links
   - Add icons for different link types
   - Relativize absolute URLs

3. **Image Enhancement**: Add responsive image attributes, lazy loading
   ```javascript
   $('img').attr('loading', 'lazy');
   $('img').addClass('img-fluid');
   ```

4. **Accessibility Improvements**: Add ARIA attributes, alt text validation
   ```javascript
   $('nav').attr('role', 'navigation');
   ```

5. **Table of Contents Generation**: Extract headings, generate navigation
   ```javascript
   const toc = $('h2, h3').map((i, h) => $(h).text()).get();
   ```

6. **Code Block Enhancement**: Add syntax highlighting, copy buttons
   ```javascript
   $('pre code').each((i, block) => {
       $(block).parent().addClass('highlight');
   });
   ```

7. **Metadata Injection**: Add Open Graph tags, schema.org markup
   ```javascript
   $('head').append(`<meta property="og:title" content="${title}">`);
   ```

8. **Content Sanitization**: Remove unwanted elements, attributes
   ```javascript
   $('script').remove();
   $('*').removeAttr('onclick');
   ```

9. **Responsive Embeds**: Wrap iframes in responsive containers
   ```javascript
   $('iframe').wrap('<div class="embed-responsive"></div>');
   ```

10. **Link Analysis**: Collect URLs, validate internal links
    ```javascript
    const links = $('a[href]').map((i, a) => $(a).attr('href')).get();
    ```

## Risks & Pitfalls

**Forgetting the Dirty Flag**: The most common mistake is modifying the DOM but not setting `dirty.dirty = true` (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)). Changes appear to work during development but silently disappear in output:
```javascript
// WRONG: Changes lost
async process($element, metadata, dirty) {
    $element.addClass('modified');
    // Missing: dirty.dirty = true;
}

// CORRECT: Changes preserved
async process($element, metadata, dirty) {
    $element.addClass('modified');
    dirty.dirty = true;
}
```

**Inefficient Selectors**: Broad selectors scan the entire DOM (source: [lib/mahafuncs.ts](../../lib/mahafuncs.ts)). Prefer specific selectors:
```javascript
// SLOW: Scans all elements
$('*').filter('.highlight');

// FAST: Direct selection
$('.highlight');
```

**Repeated Queries**: Querying the same elements multiple times is wasteful:
```javascript
// INEFFICIENT
$('img').attr('loading', 'lazy');
$('img').addClass('img-fluid');
$('img').each((i, img) => { /* ... */ });

// EFFICIENT
$('img').each((i, img) => {
    const $img = $(img);
    $img.attr('loading', 'lazy');
    $img.addClass('img-fluid');
    // Other operations
});
```

**Modifying During Iteration**: Modifying elements while iterating can cause unexpected behavior:
```javascript
// RISKY: Wrapping during iteration
$('img').each((i, img) => {
    $(img).wrap('<figure></figure>'); // May cause issues
});

// SAFER: Collect first, then modify
const images = $('img').toArray();
images.forEach(img => {
    $(img).wrap('<figure></figure>');
});
```

**Cheerio vs. Browser Differences**: Cheerio is server-side and lacks browser features:
- No CSS layout calculations (`offsetWidth`, `getBoundingClientRect()`)
- No JavaScript execution or event handling
- Some CSS selectors unsupported (`:hover`, `:focus`)
- No `window`, `document.cookie`, localStorage

**HTML Serialization Changes**: Cheerio may serialize HTML differently than input:
- Self-closing tags become explicit open/close pairs
- Attribute order may change
- Whitespace normalization

**Memory with Large DOMs**: Very large HTML documents consume significant memory when parsed:
- Cheerio holds entire DOM tree in memory
- Consider document size limits for huge pages

**Escaping Issues**: Incorrectly escaped content can break HTML:
```javascript
// WRONG: XSS vulnerability
const userInput = metadata.userComment;
$div.html(userInput); // Dangerous if userInput contains script tags

// CORRECT: Use .text() for plain text
$div.text(userInput); // Escapes HTML entities
```

**Case Sensitivity**: Depending on Cheerio configuration, tag/attribute names may be normalized:
```javascript
// If lowerCaseTags: true
$('DIV') === $('div') // true

// Attribute names may also be normalized
$element.attr('DATA-ID') === $element.attr('data-id')
```

**Element Removal While Iterating**: Removing elements during `.each()` can skip elements:
```javascript
// WRONG: May skip elements
$('script').each((i, elem) => {
    $(elem).remove(); // Modifies collection during iteration
});

// CORRECT: Remove after iteration
$('script').remove(); // Single operation
```

**Context Loss**: Storing selectors across async operations loses context:
```javascript
// RISKY: $ may be different after await
const $links = $('a');
await someAsyncOperation();
$links.addClass('processed'); // May not work as expected

// SAFER: Re-query after async
await someAsyncOperation();
$('a').addClass('processed');
```

## Sources

- [lib/mahafuncs.ts](../../lib/mahafuncs.ts) - Mahafunc base classes
- [lib/render.ts](../../lib/render.ts) - DOM manipulation integration
- [lib/built-in.ts](../../lib/built-in.ts) - Built-in DOM manipulation examples

## Related Pages

- [Mahabhuta System](./mahabhuta-system.md) - DOM manipulation engine
- [Custom Elements](./custom-elements.md) - Custom tag processing
- [Three-Stage Rendering](./three-stage-rendering.md) - Rendering pipeline
- [Plugin System](./plugin-system.md) - How plugins register mahafuncs

## Backlinks

- [wiki/summaries/lib/mahafuncs.ts.md](../summaries/lib/mahafuncs.ts.md)
