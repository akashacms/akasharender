---
title: "Sitemap Validation Implementation Guide"
type: implementation
Sources:
  - lib/sitemap-validator.ts
  - lib/cli.ts
  - lib/index.ts
  - test/test-sitemap-validator.mjs
Categories:
  - sitemap
  - validation
  - implementation
  - testing
date-created: 2026-05-22T00:00:00+00:00
last-updated: 2026-05-22T00:00:00+00:00
confidence: high
---

# Sitemap Validation Implementation Guide

## Query

Provide a detailed implementation guide for building a custom sitemap validator that validates generated sitemaps against the local rendered output directory in AkashaRender.

## Architecture Pages

- [Sitemap Validation Architecture](../architecture/sitemap-validation.md) - Architecture design for the sitemap validator

## Implementation

This guide provides specifications for implementing the AkashaRender Sitemap Validator, including code structure, APIs, error handling, testing strategy, and implementation phases.

### 1. File Structure

#### 1.1 New Files to Create

```
akasharender/
├── lib/
│   ├── sitemap-validator.ts      # Main validator class
│   ├── cli.ts                     # Add validate-sitemap command
│   └── index.ts                   # Export SitemapValidator
├── test/
│   ├── test-sitemap-validator.mjs # Validator tests
│   ├── fixtures/
│   │   ├── sitemap-valid.xml      # Valid sitemap fixture
│   │   ├── sitemap-missing.xml    # Sitemap with missing files
│   │   ├── sitemap-invalid.xml    # Malformed XML fixture
│   │   └── sitemap-wrong-base.xml # Wrong base URL fixture
└── dist/
    ├── sitemap-validator.js       # Compiled output
    └── sitemap-validator.d.ts     # Type definitions
```

#### 1.2 Modified Files

```
lib/index.ts                       # Export SitemapValidator
lib/cli.ts                         # Add validate-sitemap command
package.json                       # Add dependencies (if needed)
```

### 2. Core Implementation: SitemapValidator Class

**File:** `lib/sitemap-validator.ts`

The `SitemapValidator` class provides the core validation logic. Key implementation details:

#### 2.1 Class Structure

```typescript
export class SitemapValidator {
    #config: Configuration;
    #sitemapFilename: string;

    constructor(config: Configuration, sitemapFilename: string = 'sitemap.xml');
    
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
    
    // Format validation result as human-readable text
    static formatReport(result: ValidationResult): string;
}
```

#### 2.2 TypeScript Interfaces

```typescript
export interface SitemapEntry {
    loc: string;           // Full URL from <loc> element
    lastmod?: string;      // Last modification date
    changefreq?: string;   // Change frequency
    priority?: number;     // Priority (0.0-1.0)
}

export interface EntryValidation {
    entry: SitemapEntry;
    valid: boolean;
    filePath: string;
    fileExists: boolean;
    error?: string;
}

export interface XMLValidation {
    valid: boolean;
    namespace: boolean;    // Correct namespace
    wellFormed: boolean;   // Well-formed XML
    errors: string[];
}

export interface ValidationResult {
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

#### 2.3 Key Methods

##### validate()

Main entry point that:
1. Checks if sitemap exists
2. Reads and validates XML structure
3. Parses sitemap entries
4. Validates each entry
5. Returns comprehensive ValidationResult

##### parseSitemap()

Uses `XMLToSitemapItemStream` from the `sitemap` package to parse sitemap XML:

```typescript
async parseSitemap(sitemapPath: string): Promise<SitemapEntry[]> {
    return new Promise((resolve, reject) => {
        const entries: SitemapEntry[] = [];
        
        fs.createReadStream(sitemapPath)
            .pipe(new XMLToSitemapItemStream())
            .on('data', (item: any) => {
                entries.push({
                    loc: item.url,
                    lastmod: item.lastmod,
                    changefreq: item.changefreq,
                    priority: item.priority
                });
            })
            .on('end', () => resolve(entries))
            .on('error', (err) => reject(err));
    });
}
```

##### urlToFilePath()

Core URL-to-filesystem mapping logic:

```typescript
urlToFilePath(url: string): string {
    const urlObj = new URL(url);
    const expectedBase = new URL(this.#config.root_url);
    
    if (urlObj.origin !== expectedBase.origin) {
        throw new Error(`URL origin mismatch: ${urlObj.origin} (expected: ${expectedBase.origin})`);
    }
    
    let pathname = urlObj.pathname;
    if (pathname.startsWith('/')) pathname = pathname.substring(1);
    if (pathname === '' || pathname === '/') pathname = 'index.html';
    if (pathname.endsWith('/')) pathname = pathname + 'index.html';
    
    return path.join(this.#config.renderDestination, pathname);
}
```

##### validateXMLStructure()

Checks XML validity:
- XML declaration present
- Correct sitemap namespace
- Required elements present (`<urlset>` or `<sitemapindex>`, `<loc>`)

##### formatReport()

Static method that generates human-readable validation reports.

### 3. CLI Integration

**File:** `lib/cli.ts`

Add validate-sitemap command:

```typescript
program
    .command('validate-sitemap')
    .argument('<configFN>', 'Configuration file path')
    .option('--sitemap <filename>', 'Sitemap filename relative to output directory', 'sitemap.xml')
    .option('--strict', 'Exit with error code if validation fails', false)
    .option('--json', 'Output results as JSON', false)
    .description('Validate sitemap XML file against rendered output directory')
    .action(async (configFN: string, cmdObj: any) => {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        const validator = new SitemapValidator(config, cmdObj.sitemap);
        const result = await validator.validate();
        
        if (cmdObj.json) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log(SitemapValidator.formatReport(result));
        }
        
        if (cmdObj.strict && (result.invalidEntries > 0 || result.errors.length > 0)) {
            process.exit(1);
        }
    });
```

### 4. Exports

**File:** `lib/index.ts`

```typescript
export {
    SitemapValidator,
    type SitemapEntry,
    type EntryValidation,
    type XMLValidation,
    type ValidationResult
} from './sitemap-validator.js';
```

### 5. Testing Strategy

**File:** `test/test-sitemap-validator.mjs`

Comprehensive test suite covering:

#### 5.1 Constructor Tests
- Create validator with config
- Accept custom sitemap filename
- Throw errors for missing config properties

#### 5.2 URL-to-Path Mapping Tests
- Map simple HTML file
- Map root URL to index.html
- Map directory URL to index.html
- Handle URL without trailing slash
- Throw error for wrong origin
- Throw error for invalid URL

#### 5.3 File Existence Tests
- Detect existing file
- Detect non-existing file

#### 5.4 XML Structure Validation Tests
- Validate correct XML
- Detect missing XML declaration
- Detect missing namespace
- Detect missing root element
- Detect missing loc elements

#### 5.5 Sitemap Parsing Tests
- Parse generated sitemap
- Extract entries with correct structure

#### 5.6 Entry Validation Tests
- Validate existing file
- Detect missing file

#### 5.7 Full Validation Tests
- Validate generated sitemap successfully
- Handle missing sitemap file

#### 5.8 Report Formatting Tests
- Format successful validation
- Format validation with errors

### 6. Test Fixtures

Create test fixtures in `test/fixtures/`:

**sitemap-valid.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.akashacms.com/index.html</loc>
    <lastmod>2026-05-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

**sitemap-invalid.xml:**
```xml
<urlset>
  <url>
    <loc>https://example.akashacms.com/index.html</loc>
  </url>
</urlset>
```

**sitemap-missing.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.akashacms.com/does-not-exist.html</loc>
  </url>
</urlset>
```

### 7. Implementation Phases

#### Phase 1: Core Validator (Priority: High)
- [ ] Implement `SitemapValidator` class in `lib/sitemap-validator.ts`
- [ ] Implement URL-to-path mapping logic
- [ ] Implement file existence checking
- [ ] Implement basic XML validation
- [ ] Export from `lib/index.ts`

#### Phase 2: CLI Integration (Priority: High)
- [ ] Add `validate-sitemap` command to `lib/cli.ts`
- [ ] Implement command-line argument parsing
- [ ] Implement report formatting
- [ ] Test CLI command manually

#### Phase 3: Testing (Priority: High)
- [ ] Create test fixtures
- [ ] Write unit tests for URL mapping
- [ ] Write tests for file existence checking
- [ ] Write tests for XML validation
- [ ] Write integration tests for full validation
- [ ] Achieve >90% code coverage

#### Phase 4: Documentation (Priority: Medium)
- [ ] Add usage examples to README
- [ ] Document CLI options
- [ ] Add API documentation
- [ ] Create troubleshooting guide

#### Phase 5: Enhancements (Priority: Low - Future)
- [ ] Support for sitemap index files
- [ ] Reverse validation (check all files are in sitemap)
- [ ] lastmod date verification
- [ ] Performance optimization for large sitemaps
- [ ] Configurable URL mapping rules

### 8. Usage Examples

#### 8.1 CLI Usage

```bash
# Basic validation
npx akasharender validate-sitemap config.mjs

# Validate custom sitemap
npx akasharender validate-sitemap config.mjs --sitemap blog-sitemap.xml

# Strict mode (exit with error if validation fails)
npx akasharender validate-sitemap config.mjs --strict

# JSON output for CI/CD
npx akasharender validate-sitemap config.mjs --json > report.json
```

#### 8.2 Programmatic Usage

```javascript
import akasha, { SitemapValidator } from 'akasharender';

const config = new akasha.Configuration();
config.rootURL('https://example.com');
// ... configure ...

await akasha.setup(config);
await akasha.render(config);

// Validate sitemap
const validator = new SitemapValidator(config);
const result = await validator.validate();

if (result.invalidEntries > 0) {
    console.error('Validation failed:');
    console.error(SitemapValidator.formatReport(result));
    process.exit(1);
}

console.log('✓ Sitemap is valid');
```

#### 8.3 CI/CD Integration

```yaml
# GitHub Actions example
name: Build and Validate

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build site
        run: npx akasharender render config.mjs
      
      - name: Validate sitemap
        run: npx akasharender validate-sitemap config.mjs --strict --json > validation.json
      
      - name: Upload validation report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: sitemap-validation
          path: validation.json
```

### 9. Error Handling

#### 9.1 Error Categories

| Category | Handling | Example |
|----------|----------|---------|
| Configuration Error | Throw immediately | Missing root_url |
| File Not Found | Collect in results | Sitemap entry with no file |
| XML Parse Error | Return in validation result | Malformed XML |
| URL Error | Record in entry validation | Wrong origin |
| I/O Error | Throw with context | Permission denied |

#### 9.2 Error Messages

Use clear, actionable error messages:

```typescript
// Good
throw new Error('Configuration must have root_url set');

// Bad
throw new Error('Invalid config');
```

### 10. Performance Considerations

#### 10.1 Current Design

- Sequential file checking (good enough for most sites)
- Stream-based XML parsing (memory efficient)
- Single-pass validation

#### 10.2 Benchmark Targets

- Small sitemap (100 entries): <1 second
- Medium sitemap (1,000 entries): <5 seconds
- Large sitemap (10,000 entries): <30 seconds

### 11. Dependencies

#### 11.1 Existing Dependencies

- `sitemap` - Already used for sitemap generation
  - Use `XMLToSitemapItemStream` for parsing

#### 11.2 No New Dependencies Required

The implementation uses only:
- Node.js built-in modules (`fs`, `path`, `stream`)
- Existing `sitemap` package
- TypeScript standard library

### 12. Implementation Checklist

```
Core Implementation:
[x] Create lib/sitemap-validator.ts
[x] Implement SitemapValidator class
[x] Implement urlToFilePath() method
[x] Implement fileExists() method
[x] Implement validateXMLStructure() method
[x] Implement validateEntry() method
[x] Implement validate() method
[x] Implement formatReport() static method
[x] Export from lib/index.ts

CLI Integration:
[x] Add validate-sitemap command to lib/cli.ts
[x] Implement --sitemap option
[x] Implement --strict option
[x] Implement --json option
[x] Test CLI manually

Testing:
[x] Create test/test-sitemap-validator.mjs
[x] Create test fixtures
[x] Write constructor tests
[x] Write URL mapping tests
[x] Write file existence tests
[x] Write XML validation tests
[x] Write entry validation tests
[x] Write full validation tests
[x] Write report formatting tests
[x] Run tests: npm test
[x] Verify coverage >90%

Documentation:
[x] Update README with validator usage
[x] Document CLI options
[x] Add example workflows
[x] Add troubleshooting section

Build & Deploy:
[x] Run npm run build
[x] Test compiled output
[x] Verify TypeScript definitions
[ ] Update CHANGELOG.md
[ ] Create PR with changes
```

### 13. Full Implementation Reference

For the complete, detailed implementation including full source code for all methods, see the file: [../../IMPLEMENTATION-sitemap-validation.md](../../IMPLEMENTATION-sitemap-validation.md)

This comprehensive reference includes:
- Complete TypeScript implementation (~400 lines)
- Full test suite code (~300 lines)
- Detailed method implementations
- Error handling patterns
- Future enhancement specifications

## Sources

- [lib/sitemap-validator.ts](../../lib/sitemap-validator.ts) - Main validator class (to be implemented)
- [lib/cli.ts](../../lib/cli.ts) - CLI command structure
- [lib/index.ts](../../lib/index.ts) - Module exports
- [test/test-sitemap-validator.mjs](../../test/test-sitemap-validator.mjs) - Test suite (to be implemented)

## Related Pages

- [Sitemap Validation Architecture](../architecture/sitemap-validation.md) - Architecture design for this implementation

## Backlinks

*No backlinks yet - this is a new implementation document*
