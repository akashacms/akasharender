---
title: "MIME Type Detection"
type: concept
Sources:
  - lib/cache/vfstack.ts
  - lib/index.ts
Categories:
  - filesystem
  - mime-types
  - file-detection
date-created: 2026-05-21T06:50:00+03:00
last-updated: 2026-05-21T06:50:00+03:00
confidence: high
---

# MIME Type Detection

## Definition

MIME Type Detection is the automatic identification of file content types based on file extensions using the `mime` library, augmented with custom MIME type definitions for template formats that lack official registrations (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)). This enables renderer selection, content-type headers, and file classification throughout AkashaRender's processing pipeline.

## How It Works

### The mime Library

VFStack uses the `mime` library for MIME type detection (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
import { Mime } from 'mime/lite';
import standardTypes from 'mime/types/standard.js';

const mime = new Mime(standardTypes);
```

**Standard Types** include:
- `text/html` for `.html`
- `text/css` for `.css`
- `application/javascript` for `.js`
- `image/png` for `.png`
- `image/jpeg` for `.jpg`, `.jpeg`
- Hundreds of other standard MIME types

### Custom MIME Type Registration

AkashaRender registers custom MIME types for template formats (source: [lib/index.ts](../../lib/index.ts)):

```javascript
import { mimedefine } from './cache/vfstack.js';

// Register custom MIME types
mimedefine({'text/asciidoc': [ 'adoc', 'asciidoc' ]});
mimedefine({'text/x-markdoc': [ 'markdoc' ]});
mimedefine({'text/x-ejs': [ 'ejs']});
mimedefine({'text/x-nunjucks': [ 'njk' ]});
mimedefine({'text/x-handlebars': [ 'handlebars' ]});
mimedefine({'text/x-liquid': [ 'liquid' ]});
mimedefine({'text/x-tempura': [ 'tempura' ]});
```

**Rationale** (source: [lib/index.ts](../../lib/index.ts)):
- Template formats lack official MIME type registrations
- Custom MIME types enable renderer selection
- Using standard `text/*` prefix for text-based formats
- `x-` prefix indicates experimental/unofficial type

### mimedefine Function

The `mimedefine()` function extends the mime library (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
export function mimedefine(defs: Record<string, string[]>) {
    mime.define(defs);
}
```

**Usage**:
```javascript
// MIME type → file extensions mapping
mimedefine({
    'text/asciidoc': ['adoc', 'asciidoc'],
    'text/x-ejs': ['ejs']
});

// Now mime.getType() recognizes these extensions
mime.getType('file.adoc');      // 'text/asciidoc'
mime.getType('template.ejs');   // 'text/x-ejs'
```

### MIME Type Detection in VFStack

VFStack detects MIME types during path conversion (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
vpathForFSPath(fspath: string): VPathData | undefined {
    // ... path calculation ...
    
    return {
        fspath,
        vpath,
        mime: mime.getType(fspath),  // Detect MIME type from extension
        mounted: dir.src,
        mountPoint: dir.dest,
        pathInMounted,
        statsMtime: mtime
    };
}
```

**Extension-Based Detection**:
```javascript
// File extensions determine MIME types
'/path/to/post.html.md'     → undefined (mime doesn't know .md)
'/path/to/post.md'          → undefined
'/path/to/style.css'        → 'text/css'
'/path/to/template.ejs'     → 'text/x-ejs'
'/path/to/photo.jpg'        → 'image/jpeg'
```

### Compound Extensions

AkashaRender uses compound extensions for templates (source: [lib/index.ts](../../lib/index.ts)):

```
file.html.md          → Markdown rendering to HTML
file.html.ejs         → EJS rendering to HTML
file.css.ejs          → EJS rendering to CSS
file.json.ejs         → EJS rendering to JSON
```

**MIME Type Detection**:
```javascript
mime.getType('file.html.md');     // undefined (mime sees .md)
mime.getType('file.html.ejs');    // undefined (mime sees .ejs)
mime.getType('file.css.ejs');     // undefined (mime sees .ejs)
```

The `mime` library only considers the final extension, not compound extensions. However, if `.ejs` is registered:

```javascript
mimedefine({'text/x-ejs': ['ejs']});
mime.getType('file.html.ejs');    // 'text/x-ejs'
mime.getType('file.css.ejs');     // 'text/x-ejs'
```

### MIME Types in VPathData

MIME types are stored in VPathData for later use (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```typescript
type VPathData = {
    fspath: string;
    vpath: string;
    mime?: string;      // MIME type from extension
    // ... other fields
};
```

**Example**:
```javascript
const vpathData = vfs.vpathForFSPath('/project/styles.css');
console.log(vpathData.mime);  // 'text/css'

const templateData = vfs.vpathForFSPath('/project/page.html.ejs');
console.log(templateData.mime);  // 'text/x-ejs'
```

### Renderer Selection

Renderers are selected based on file extensions, not MIME types directly (source: [lib/index.ts](../../lib/index.ts)):

```javascript
// Renderers match file extensions
const renderer = config.findRendererName('.html.md');   // Markdown renderer
const renderer = config.findRendererName('.html.ejs');  // EJS renderer
```

MIME types provide additional metadata but don't drive renderer selection.

### Standard vs. Custom MIME Types

**Standard Types** (from `mime/types/standard.js`):
```javascript
'.html'  → 'text/html'
'.css'   → 'text/css'
'.js'    → 'application/javascript'
'.json'  → 'application/json'
'.png'   → 'image/png'
'.jpg'   → 'image/jpeg'
'.pdf'   → 'application/pdf'
```

**Custom Types** (registered by AkashaRender):
```javascript
'.adoc'        → 'text/asciidoc'
'.ejs'         → 'text/x-ejs'
'.njk'         → 'text/x-nunjucks'
'.handlebars'  → 'text/x-handlebars'
'.liquid'      → 'text/x-liquid'
'.markdoc'     → 'text/x-markdoc'
'.tempura'     → 'text/x-tempura'
```

### Missing MIME Types

If no MIME type is registered, `mime.getType()` returns `null` (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):

```javascript
mime.getType('file.unknown');  // null
mime.getType('file.md');       // null (unless registered)
```

VPathData.mime will be `null` or `undefined` for unrecognized extensions.

### Official MIME Type Status

Template formats generally lack official MIME type registrations (source: [lib/index.ts](../../lib/index.ts)):

**AsciiDoc** (`text/asciidoc`):
- No official registration as of 2022
- AsciiDoctor project attempting registration
- AkashaRender uses `text/asciidoc` preemptively

**Other Template Formats**:
- EJS, Nunjucks, Handlebars, Liquid: No official MIME types
- AkashaRender uses `text/x-*` for experimental types
- May change if official types are registered

## Key Parameters

**mimedefine Function**:
- Parameter: `Record<string, string[]>` - MIME type to extensions mapping
- Example: `{'text/asciidoc': ['adoc', 'asciidoc']}`

**mime.getType**:
- Parameter: `string` - File path or extension
- Returns: `string | null` - MIME type or null if unknown

**Custom MIME Types** (registered in lib/index.ts):
- `text/asciidoc` - AsciiDoc files (`.adoc`, `.asciidoc`)
- `text/x-markdoc` - Markdoc files (`.markdoc`)
- `text/x-ejs` - EJS templates (`.ejs`)
- `text/x-nunjucks` - Nunjucks templates (`.njk`)
- `text/x-handlebars` - Handlebars templates (`.handlebars`)
- `text/x-liquid` - Liquid templates (`.liquid`)
- `text/x-tempura` - Tempura templates (`.tempura`)

**VPathData.mime**:
- Type: `string | undefined`
- Value: MIME type string or undefined if unknown

## When To Use

Use MIME type detection:

1. **File Classification**: Categorize files by content type
   ```javascript
   if (vpathData.mime?.startsWith('image/')) {
       console.log('Image file');
   }
   ```

2. **Content-Type Headers**: Set HTTP headers for served files
   ```javascript
   const contentType = vpathData.mime || 'application/octet-stream';
   response.setHeader('Content-Type', contentType);
   ```

3. **Asset Processing**: Route files to appropriate processors
   ```javascript
   if (vpathData.mime === 'text/css') {
       await processCSSFile(vpathData);
   }
   ```

4. **File Filtering**: Query files by content type
   ```javascript
   const images = vfs.findAll().filter(v => 
       v.mime?.startsWith('image/')
   );
   ```

5. **Custom Type Registration**: Add MIME types for new formats
   ```javascript
   mimedefine({'text/x-custom': ['custom']});
   ```

**Do NOT use MIME types for**:

1. **Renderer Selection**: Use file extensions instead
   ```javascript
   // WRONG: Based on MIME
   if (mime === 'text/x-ejs') { renderEJS(); }
   
   // CORRECT: Based on extension
   const renderer = config.findRendererName('.html.ejs');
   ```

2. **Template Extension Parsing**: Use path parsing
   ```javascript
   // WRONG: MIME doesn't see compound extensions
   mime.getType('file.html.ejs');  // Only sees .ejs
   
   // CORRECT: Parse extensions manually
   const exts = path.basename('file.html.ejs').split('.').slice(1);
   // ['html', 'ejs']
   ```

## Risks & Pitfalls

**Compound Extension Limitation**: MIME library only sees final extension (source: [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts)):
```javascript
mime.getType('page.html.md');     // undefined (sees .md, not .html.md)
mime.getType('style.css.ejs');    // 'text/x-ejs' (sees .ejs, not .css.ejs)
```

Cannot differentiate `file.html.ejs` from `file.css.ejs` by MIME type alone.

**Missing Markdown MIME Type**: Markdown has no official or custom MIME type:
```javascript
mime.getType('post.md');       // null
mime.getType('post.html.md');  // null

// Need to register if needed
mimedefine({'text/markdown': ['md', 'markdown']});
```

**Unofficial MIME Types**: Custom types may conflict with future official registrations (source: [lib/index.ts](../../lib/index.ts)):
```javascript
// Current: AkashaRender uses text/asciidoc
// Future: Official registration might use different type
// May need migration if official type differs
```

**Case Sensitivity**: File extensions are case-sensitive on some systems:
```javascript
// Linux/macOS
mime.getType('file.EJS');  // undefined (not 'text/x-ejs')
mime.getType('file.ejs');  // 'text/x-ejs'

// Need lowercase extensions
mimedefine({'text/x-ejs': ['ejs']});  // Only lowercase
```

**Null vs. Undefined**: MIME type may be `null` or `undefined`:
```javascript
// Must check both
if (vpathData.mime === 'image/jpeg') { }         // OK
if (vpathData.mime?.startsWith('image/')) { }    // Safe with ?
if (!vpathData.mime) { /* unknown */ }           // Handle missing
```

**Multiple Extensions per Type**: One MIME type can have multiple extensions:
```javascript
mimedefine({'text/asciidoc': ['adoc', 'asciidoc']});

mime.getType('file.adoc');      // 'text/asciidoc'
mime.getType('file.asciidoc');  // 'text/asciidoc'

// But mime.getExtension() returns only first extension
mime.getExtension('text/asciidoc');  // 'adoc' (not 'asciidoc')
```

**Registration Order**: Later definitions override earlier ones:
```javascript
mimedefine({'text/custom': ['ejs']});
// Overwrites text/x-ejs registration!

mime.getType('file.ejs');  // 'text/custom' (not 'text/x-ejs')
```

Register custom types before standard types or use unique extensions.

**Path vs. Extension**: `mime.getType()` accepts full paths:
```javascript
mime.getType('/path/to/file.ejs');   // 'text/x-ejs' (extracts extension)
mime.getType('file.ejs');            // 'text/x-ejs'
mime.getType('.ejs');                // 'text/x-ejs'
mime.getType('ejs');                 // undefined (no dot)
```

Must include leading dot if passing bare extension.

**Binary vs. Text**: MIME types indicate content type but not encoding:
```javascript
// Text types (UTF-8 assumed)
'text/html'
'text/css'
'text/x-ejs'

// Binary types
'image/png'
'application/pdf'
'application/zip'
```

Must handle encoding separately.

## Sources

- [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts) - MIME type detection in VFStack
- [lib/index.ts](../../lib/index.ts) - Custom MIME type registration

## Related Pages

- [Virtual Filesystem](./virtual-filesystem.md) - VFStack uses MIME detection
- [Template Rendering](./template-rendering.md) - Template format identification
- [File Caching](./file-caching.md) - Stores MIME types in cache

## Backlinks

- [wiki/summaries/lib/cache/vfstack.ts.md](../summaries/lib/cache/vfstack.ts.md)
- [wiki/summaries/lib/index.ts.md](../summaries/lib/index.ts.md)
