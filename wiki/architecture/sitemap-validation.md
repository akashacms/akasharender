---
title: "Sitemap Validation Architecture"
type: architecture
Sources:
  - ../akashacms-base/index.mjs
  - lib/index.ts
  - lib/cli.ts
Categories:
  - sitemap
  - validation
  - architecture
  - quality-assurance
date-created: 2026-05-22T00:00:00+00:00
last-updated: 2026-05-22T00:00:00+00:00
confidence: high
---

# Sitemap Validation Architecture

## Query

Document the current sitemap generation process in AkashaCMS, research existing sitemap validation tools, and design an architecture for a custom sitemap validator that validates generated sitemaps against the local rendered output directory.

## Architecture

### 1. Current Sitemap Generation Process

#### 1.1 Overview

Sitemap generation in AkashaCMS is handled by the `@akashacms/plugins-base` plugin, which generates XML sitemaps compliant with the [Sitemaps Protocol](https://www.sitemaps.org/protocol.html) after the site rendering process completes (source: [../akashacms-base/index.mjs](../../akashacms-base/index.mjs)).

#### 1.2 Implementation Location

- **File:** `../akashacms-base/index.mjs`
- **Class:** `BasePlugin`
- **Method:** `onSiteRendered(config)`
- **Lines:** 144-196

#### 1.3 Process Flow

```
1. Site rendering completes (all HTML files generated)
   ↓
2. BasePlugin.onSiteRendered() triggered
   ↓
3. Query documents cache for all HTML files
   ↓
4. Collect URL entries with metadata (lastmod, changefreq, priority)
   ↓
5. Generate sitemap XML using simpleSitemapAndIndex()
   ↓
6. Write sitemap.xml to renderDestination directory
```

#### 1.4 Code Details

The sitemap generation happens in the `onSiteRendered()` method (source: [../akashacms-base/index.mjs](../../akashacms-base/index.mjs)):

```javascript
async onSiteRendered(config) {
    if (!this.options.generateSitemapFlag) {
        return Promise.resolve("skipped");
    }
    
    var rendered_files = [];
    
    // Query for all HTML documents
    const documents = await this.akasha.filecache.documentsCache.search({
        renderpathmatch: '\.html$'
    });
    
    // Build sitemap entry list
    for (let doc of documents) {
        // Get file modification time
        if (!doc.stat) {
            doc.stat = await fsp.stat(doc.fspath);
        }
        var fDate = new Date(doc.stat.mtime);
        
        // Format date as YYYY-MM-DD
        var mm = /* ... pad month ... */;
        var dd = /* ... pad day ... */;
        
        // Construct full URL
        const baseURL = new URL(config.root_url);
        baseURL.pathname = doc.renderPath;
        
        rendered_files.push({
            url: baseURL.toLocaleString(),
            changefreq: 'weekly',
            priority: 0.5,
            lastmod: fDate.getUTCFullYear() + "-" + mm + "-" + dd
        })
    }
    
    // Generate sitemap using sitemap.js library
    await simpleSitemapAndIndex({
        hostname: config.root_url,
        destinationDir: config.renderDestination,
        sourceData: rendered_files,
    });
    
    return "okay";
}
```

#### 1.5 Key Configuration Properties

- **`config.root_url`**: Base URL for the website (e.g., `https://example.com`)
- **`config.renderDestination`**: Output directory where rendered files are written (e.g., `./out/`)
- **`doc.renderPath`**: Relative path where document is rendered (e.g., `/blog/post.html`)
- **`doc.fspath`**: Filesystem path to source document

#### 1.6 Dependencies

- **`sitemap` npm package**: Provides `simpleSitemapAndIndex()` function
  - GitHub: https://github.com/ekalinin/sitemap.js
  - NPM: https://www.npmjs.com/package/sitemap
  - Version: 9.0.1
  - Stars: 1.7k
  - Monthly Downloads: 12M+

#### 1.7 Output Format

The `simpleSitemapAndIndex()` function generates standard XML sitemap files:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/blog/post.html</loc>
    <lastmod>2026-05-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <!-- ... more URLs ... -->
</urlset>
```

For large sites (>50,000 URLs), it may also generate a sitemap index file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-0.xml</loc>
    <lastmod>2026-05-22T12:00:00.000Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-1.xml</loc>
    <lastmod>2026-05-22T12:00:00.000Z</lastmod>
  </sitemap>
</sitemapindex>
```

#### 1.8 Current Limitations

1. **No validation**: There is no verification that generated URLs correspond to actual rendered files
2. **Potential for drift**: If rendering fails for some files, they may still appear in the sitemap
3. **No integrity checking**: No way to verify sitemap completeness or correctness
4. **Manual testing only**: Users must manually check sitemap validity

---

### 2. Research: Sitemap Validation Tools

#### 2.1 Problem Statement

**Requirement**: Validate that a generated sitemap:
1. Is correctly formatted XML
2. Every URL in the sitemap corresponds to an actual file in the output directory
3. URL paths correctly map to filesystem paths

**NOT Required**: HTTP status code checking, live website validation

#### 2.2 Existing Tool Landscape

##### 2.2.1 Live Website Validators (Not Suitable)

These tools validate sitemaps against **live HTTP servers**, not local filesystems:

| Tool | Language | Purpose | Limitation |
|------|----------|---------|------------|
| sitemap-checker | Go | Check URL accessibility via HTTP | Requires live server |
| sitemap-validator | Node.js | Validate URLs return 200 status | Requires live server |
| Google Search Console | Web | SEO monitoring and validation | Requires live site + ownership |
| sitemap-generator | Node.js | Crawl live site to generate sitemap | Requires live server |

##### 2.2.2 Sitemap Generation Libraries

| Tool | Language | Purpose | Validation Capability |
|------|----------|---------|----------------------|
| sitemap.js | Node.js | Generate and parse sitemaps | Can parse XML, but no validation |
| @astrojs/sitemap | Node.js | Astro framework sitemap plugin | Generation only |
| next-sitemap | Node.js | Next.js sitemap plugin | Generation only |

##### 2.2.3 XML Validators (Insufficient)

| Tool | Purpose | Limitation |
|------|---------|------------|
| W3C Markup Validator | Validate XML structure | Doesn't check file existence |
| xmllint | Parse and validate XML | Doesn't map URLs to filesystem |

#### 2.3 Key Finding

**No existing tool validates sitemaps against a local filesystem.**

Static site generators (Hugo, Jekyll, 11ty, Gatsby) do not include sitemap validation tools. They generate sitemaps but do not verify them against the actual rendered output.

#### 2.4 Custom Script Approaches

Developers have created ad-hoc scripts in various languages:

**Node.js approach:**
```javascript
const { XMLToSitemapItemStream } = require('sitemap');
const fs = require('fs');
const path = require('path');

fs.createReadStream('./out/sitemap.xml')
  .pipe(new XMLToSitemapItemStream())
  .on('data', (item) => {
    const urlPath = new URL(item.url).pathname;
    const filePath = path.join('./out', urlPath);
    if (!fs.existsSync(filePath)) {
      console.error(`Missing: ${filePath}`);
    }
  });
```

**Shell script approach:**
```bash
xmllint --xpath '//loc/text()' sitemap.xml | while read url; do
    path=$(echo "$url" | sed 's|https://example.com||')
    [ ! -f "./out$path" ] && echo "Missing: $path"
done
```

#### 2.5 Core Challenge: URL-to-Path Mapping

The fundamental challenge is mapping sitemap URLs to filesystem paths:

| Scenario | Sitemap URL | Expected File Path | Notes |
|----------|-------------|-------------------|-------|
| Direct mapping | `/blog/post.html` | `out/blog/post.html` | Simple case |
| Clean URLs | `/about/` | `out/about/index.html` | Directory index |
| Root | `/` | `out/index.html` | Root index |
| Nested clean URLs | `/blog/2024/` | `out/blog/2024/index.html` | Nested directory |
| Extension variations | `/page` | `out/page.html` or `out/page/index.html` | Depends on configuration |

Different static site generators use different conventions, making a universal tool difficult.

---

### 3. Proposed Sitemap Validator Architecture

#### 3.1 Design Principles

1. **AkashaRender-specific**: Designed for AkashaRender's URL/path conventions
2. **Post-build validation**: Runs after site rendering completes
3. **Filesystem-based**: Validates against local output directory, not HTTP
4. **Comprehensive reporting**: Clear error messages with actionable information
5. **CLI integration**: Available as `npx akasharender validate-sitemap`
6. **Programmatic API**: Usable from code, not just CLI
7. **Zero false positives**: Should not report valid files as missing

#### 3.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Sitemap Validator                        │
└─────────────────────────────────────────────────────────────┘
           │
           ├─► 1. Parse sitemap.xml (or sitemap-index.xml)
           │       └─► Extract all <loc> URLs
           │
           ├─► 2. For each URL:
           │       ├─► Strip base URL (config.root_url)
           │       ├─► Map to filesystem path
           │       └─► Check file exists in renderDestination
           │
           ├─► 3. Validate XML format
           │       ├─► Check namespace correctness
           │       ├─► Validate required elements
           │       └─► Check date formats
           │
           └─► 4. Generate validation report
                   ├─► Missing files
                   ├─► Malformed URLs
                   ├─► XML format errors
                   └─► Summary statistics
```

#### 3.3 Component Architecture

##### 3.3.1 SitemapValidator Class

**Location:** `lib/sitemap-validator.ts`

```typescript
export class SitemapValidator {
    #config: Configuration;
    
    constructor(config: Configuration);
    
    // Main validation method
    async validate(): Promise<ValidationResult>;
    
    // Parse sitemap XML
    async parseSitemap(sitemapPath: string): Promise<SitemapEntry[]>;
    
    // Map URL to filesystem path
    urlToFilePath(url: string): string;
    
    // Check if file exists
    async fileExists(filePath: string): Promise<boolean>;
    
    // Validate single URL entry
    async validateEntry(entry: SitemapEntry): Promise<EntryValidation>;
    
    // Validate XML structure
    validateXMLStructure(xml: string): XMLValidation;
}
```

##### 3.3.2 Data Structures

```typescript
interface SitemapEntry {
    loc: string;           // URL from sitemap
    lastmod?: string;      // Last modification date
    changefreq?: string;   // Change frequency
    priority?: number;     // Priority (0.0-1.0)
}

interface EntryValidation {
    entry: SitemapEntry;
    valid: boolean;
    filePath: string;
    fileExists: boolean;
    error?: string;
}

interface XMLValidation {
    valid: boolean;
    namespace: boolean;    // Correct namespace
    wellFormed: boolean;   // Well-formed XML
    errors: string[];
}

interface ValidationResult {
    sitemapPath: string;
    totalEntries: number;
    validEntries: number;
    invalidEntries: number;
    missingFiles: EntryValidation[];
    xmlValidation: XMLValidation;
    errors: string[];
    warnings: string[];
}
```

#### 3.4 URL-to-Path Mapping Algorithm

This is the core logic that maps sitemap URLs to filesystem paths:

```typescript
urlToFilePath(url: string): string {
    // 1. Parse the URL
    const urlObj = new URL(url);
    
    // 2. Validate base URL matches config.root_url
    const expectedBase = new URL(this.#config.root_url);
    if (urlObj.origin !== expectedBase.origin) {
        throw new Error(`URL origin mismatch: ${urlObj.origin} vs ${expectedBase.origin}`);
    }
    
    // 3. Get pathname (e.g., "/blog/post.html")
    let pathname = urlObj.pathname;
    
    // 4. Remove leading slash
    if (pathname.startsWith('/')) {
        pathname = pathname.substring(1);
    }
    
    // 5. Handle empty pathname (root)
    if (pathname === '' || pathname === '/') {
        pathname = 'index.html';
    }
    
    // 6. Handle directory paths (trailing slash)
    if (pathname.endsWith('/')) {
        pathname = pathname + 'index.html';
    }
    
    // 7. Construct full filesystem path
    const filePath = path.join(this.#config.renderDestination, pathname);
    
    return filePath;
}
```

#### 3.5 Validation Process Flow

```
Start
  ↓
Check if sitemap exists in renderDestination
  ↓ (no) → Error: Sitemap not found
  ↓ (yes)
Read sitemap.xml
  ↓
Parse XML → validate structure
  ↓ (invalid) → Error: Malformed XML
  ↓ (valid)
Extract all <loc> URLs
  ↓
For each URL:
  ├─► Parse URL
  ├─► Validate base URL matches config.root_url
  ├─► Map to filesystem path
  ├─► Check if file exists
  └─► Record result
  ↓
Generate ValidationResult
  ↓
Return result or throw on errors
```

#### 3.6 CLI Integration

**File:** `lib/cli.ts`

Add new command:

```typescript
program
    .command('validate-sitemap')
    .argument('<configFN>', 'Configuration file')
    .option('--sitemap <path>', 'Path to sitemap file (relative to output)', 'sitemap.xml')
    .option('--strict', 'Exit with error code if validation fails')
    .option('--json', 'Output results as JSON')
    .description('Validate sitemap against rendered output')
    .action(async (configFN, cmdObj) => {
        const config = await loadConfig(configFN);
        const validator = new SitemapValidator(config);
        
        const result = await validator.validate();
        
        if (cmdObj.json) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            printValidationReport(result);
        }
        
        if (cmdObj.strict && result.invalidEntries > 0) {
            process.exit(1);
        }
    });
```

#### 3.7 Usage Examples

##### Command Line

```bash
# Basic validation
npx akasharender validate-sitemap config.mjs

# Validate specific sitemap file
npx akasharender validate-sitemap config.mjs --sitemap foo-sitemap.xml

# Strict mode (exit with error on validation failure)
npx akasharender validate-sitemap config.mjs --strict

# JSON output for CI/CD integration
npx akasharender validate-sitemap config.mjs --json > validation-report.json
```

##### Programmatic API

```javascript
import akasha from 'akasharender';
import { SitemapValidator } from 'akasharender';

const config = new akasha.Configuration();
// ... configure ...
await akasha.setup(config);
await akasha.render(config);

// Validate sitemap
const validator = new SitemapValidator(config);
const result = await validator.validate();

if (result.invalidEntries > 0) {
    console.error(`Found ${result.invalidEntries} invalid entries`);
    for (const invalid of result.missingFiles) {
        console.error(`Missing: ${invalid.filePath} for URL: ${invalid.entry.loc}`);
    }
}
```

#### 3.8 Error Handling

##### Categories of Errors

1. **File Not Found Errors**
   - Sitemap entry references URL with no corresponding file
   - Report: `Missing file: ./out/blog/post.html for URL: https://example.com/blog/post.html`

2. **XML Format Errors**
   - Malformed XML
   - Incorrect namespace
   - Missing required elements
   - Report: `XML validation error: Missing required element <loc> in <url>`

3. **URL Errors**
   - URL doesn't match config.root_url
   - Malformed URLs
   - Report: `URL origin mismatch: https://wrong.com/page.html (expected: https://example.com)`

4. **Configuration Errors**
   - Missing renderDestination
   - Missing root_url
   - Report: `Configuration error: root_url not set`

#### 3.9 Output Format

##### Human-Readable Report

```
Sitemap Validation Report
=========================

Sitemap: ./out/sitemap.xml
Total Entries: 150
Valid Entries: 148
Invalid Entries: 2

Missing Files:
  ✗ ./out/blog/old-post.html
    URL: https://example.com/blog/old-post.html
  ✗ ./out/projects/archived.html
    URL: https://example.com/projects/archived.html

XML Validation: ✓ Valid
  - Namespace: ✓ Correct
  - Well-formed: ✓ Yes

Summary: 2 errors found
```

##### JSON Report

```json
{
  "sitemapPath": "./out/sitemap.xml",
  "totalEntries": 150,
  "validEntries": 148,
  "invalidEntries": 2,
  "missingFiles": [
    {
      "entry": {
        "loc": "https://example.com/blog/old-post.html",
        "lastmod": "2026-05-20"
      },
      "valid": false,
      "filePath": "./out/blog/old-post.html",
      "fileExists": false,
      "error": "File does not exist"
    }
  ],
  "xmlValidation": {
    "valid": true,
    "namespace": true,
    "wellFormed": true,
    "errors": []
  },
  "errors": [],
  "warnings": []
}
```

#### 3.10 Integration with Build Process

The validator can be integrated into various workflows:

##### Post-Build Validation

```javascript
// In config.mjs or build script
const config = new akasha.Configuration();
// ... configure ...

await akasha.setup(config);
await akasha.render(config);

// Validate sitemap after render
const validator = new SitemapValidator(config);
const result = await validator.validate();

if (result.invalidEntries > 0) {
    throw new Error('Sitemap validation failed');
}
```

##### CI/CD Integration

```yaml
# .github/workflows/build.yml
- name: Build site
  run: npx akasharender render config.mjs

- name: Validate sitemap
  run: npx akasharender validate-sitemap config.mjs --strict --json > validation.json

- name: Upload validation report
  uses: actions/upload-artifact@v3
  with:
    name: sitemap-validation
    path: validation.json
```

#### 3.11 Future Enhancements

Potential future improvements (not in initial implementation):

1. **Reverse validation**: Check that all rendered HTML files appear in sitemap
2. **lastmod verification**: Verify lastmod dates match actual file mtimes
3. **Priority validation**: Warn about unusual priority distributions
4. **Sitemap index support**: Handle sitemap-index.xml with multiple sitemaps
5. **URL pattern validation**: Check URLs follow expected patterns
6. **Broken link detection**: Optionally check internal links within HTML files
7. **Performance optimization**: Parallel file existence checking for large sitemaps

#### 3.12 Benefits

1. **Confidence**: Ensures sitemap accurately reflects rendered content
2. **Early error detection**: Catch rendering issues before deployment
3. **Automation**: Can be integrated into CI/CD pipelines
4. **Debugging**: Helps identify why pages aren't being indexed
5. **Quality assurance**: Part of comprehensive site validation
6. **Universally applicable**: Pattern can be used by other static site generators

---

### 4. Conclusion

This architecture provides a comprehensive solution for validating AkashaRender-generated sitemaps against the actual rendered output directory. The design is specific to AkashaRender's conventions while remaining extensible for future enhancements.

The key innovation is the URL-to-filesystem mapping logic that understands AkashaRender's rendering conventions, filling a gap that no existing tool addresses.

#### Next Steps

1. Implement `SitemapValidator` class in `lib/sitemap-validator.ts`
2. Add CLI command to `lib/cli.ts`
3. Write comprehensive tests in `test/test-sitemap-validator.mjs`
4. Update documentation to explain usage
5. Add validation to example projects

## Sources

- [../akashacms-base/index.mjs](../../akashacms-base/index.mjs) - Current sitemap generation implementation
- [lib/index.ts](../../lib/index.ts) - Configuration class definition
- [lib/cli.ts](../../lib/cli.ts) - CLI command structure

## Related Pages

- [Sitemap Validation Implementation](../implementation/sitemap-validation.md) - Detailed implementation guide for this architecture

## Backlinks

*No backlinks yet - this is a new architecture document*
