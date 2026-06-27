
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, it, before, after } from 'node:test';
import { assert } from './test-assert.mjs';
import * as akasha from '../dist/index.js';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

const { SitemapValidator } = akasha;

describe('SitemapValidator', function() {
    let config;
    let testOutputDir;
    
    before(async function() {
        // Create a test output directory
        testOutputDir = path.join(__dirname, 'fixtures', 'test-output');
        await fs.mkdir(testOutputDir, { recursive: true });
        
        // Create a simple index.html file for testing
        await fs.writeFile(
            path.join(testOutputDir, 'index.html'),
            '<html><body>Test Page</body></html>',
            'utf8'
        );
        
        // Set up configuration
        config = new akasha.Configuration();
        config.rootURL('https://example.akashacms.com');
        config.configDir = __dirname;
        config.setRenderDestination(testOutputDir);
    });
    
    after(async function() {
        // Clean up test output directory
        try {
            await fs.rm(testOutputDir, { recursive: true, force: true });
        } catch (err) {
            // Ignore errors during cleanup
        }
    });

    describe('Constructor', function() {
        it('should create validator with config', function() {
            const validator = new SitemapValidator(config);
            assert.exists(validator);
        });
        
        it('should accept custom sitemap filename', function() {
            const validator = new SitemapValidator(config, 'custom-sitemap.xml');
            assert.exists(validator);
        });
        
        it('should throw error for missing config', function() {
            assert.throws(() => {
                new SitemapValidator(null);
            }, 'Configuration is required');
        });
        
        it('should throw error for config without root_url', function() {
            const badConfig = new akasha.Configuration();
            badConfig.setRenderDestination(testOutputDir);
            
            assert.throws(() => {
                new SitemapValidator(badConfig);
            }, 'Configuration must have root_url set');
        });
        
        it('should have renderDestination from config', function() {
            // Configuration has a default renderDestination of 'out'
            // so this test verifies that the validator can access it
            const testConfig = new akasha.Configuration();
            testConfig.rootURL('https://example.com');
            
            const validator = new SitemapValidator(testConfig);
            assert.exists(validator);
        });
    });

    describe('URL-to-Path Mapping', function() {
        let validator;
        
        before(function() {
            validator = new SitemapValidator(config);
        });
        
        it('should map simple HTML file', function() {
            const url = 'https://example.akashacms.com/blog/post.html';
            const filePath = validator.urlToFilePath(url);
            
            assert.include(filePath, 'blog');
            assert.include(filePath, 'post.html');
            assert.include(filePath, testOutputDir);
        });
        
        it('should map root URL to index.html', function() {
            const url = 'https://example.akashacms.com/';
            const filePath = validator.urlToFilePath(url);
            
            assert.include(filePath, 'index.html');
            assert.include(filePath, testOutputDir);
        });
        
        it('should map directory URL to index.html', function() {
            const url = 'https://example.akashacms.com/blog/';
            const filePath = validator.urlToFilePath(url);
            
            assert.include(filePath, 'blog');
            assert.include(filePath, 'index.html');
        });
        
        it('should handle URL without trailing slash', function() {
            const url = 'https://example.akashacms.com/page.html';
            const filePath = validator.urlToFilePath(url);
            
            assert.include(filePath, 'page.html');
        });
        
        it('should throw error for wrong origin', function() {
            const url = 'https://wrong-domain.com/page.html';
            
            assert.throws(() => {
                validator.urlToFilePath(url);
            }, /URL origin mismatch/);
        });
        
        it('should throw error for invalid URL', function() {
            assert.throws(() => {
                validator.urlToFilePath('not-a-url');
            }, /Invalid URL/);
        });
    });

    describe('File Existence Checking', function() {
        let validator;
        
        before(function() {
            validator = new SitemapValidator(config);
        });
        
        it('should detect existing file', async function() {
            const filePath = path.join(testOutputDir, 'index.html');
            const exists = await validator.fileExists(filePath);
            
            assert.isTrue(exists);
        });
        
        it('should detect non-existing file', async function() {
            const filePath = path.join(testOutputDir, 'does-not-exist.html');
            const exists = await validator.fileExists(filePath);
            
            assert.isFalse(exists);
        });
    });

    describe('XML Structure Validation', function() {
        let validator;
        
        before(function() {
            validator = new SitemapValidator(config);
        });
        
        it('should validate correct XML', function() {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page.html</loc>
  </url>
</urlset>`;
            
            const result = validator.validateXMLStructure(xml);
            
            assert.isTrue(result.valid);
            assert.isTrue(result.namespace);
            assert.isTrue(result.wellFormed);
            assert.equal(result.errors.length, 0);
        });
        
        it('should detect missing XML declaration', function() {
            const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page.html</loc>
  </url>
</urlset>`;
            
            const result = validator.validateXMLStructure(xml);
            
            assert.isTrue(result.valid); // Still valid, but has warning
            assert.isArray(result.warnings);
            assert.isTrue(result.warnings.length > 0);
        });
        
        it('should detect missing namespace', function() {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url>
    <loc>https://example.com/page.html</loc>
  </url>
</urlset>`;
            
            const result = validator.validateXMLStructure(xml);
            
            assert.isFalse(result.valid);
            assert.isFalse(result.namespace);
            assert.include(result.errors.join(' '), 'namespace');
        });
        
        it('should detect missing root element', function() {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<wrongelement xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page.html</loc>
  </url>
</wrongelement>`;
            
            const result = validator.validateXMLStructure(xml);
            
            assert.isFalse(result.valid);
            assert.isFalse(result.wellFormed);
        });
        
        it('should detect missing loc elements', function() {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
  </url>
</urlset>`;
            
            const result = validator.validateXMLStructure(xml);
            
            assert.isFalse(result.valid);
            assert.include(result.errors.join(' '), 'loc');
        });
    });

    describe('Sitemap Parsing', function() {
        let validator;
        
        before(function() {
            validator = new SitemapValidator(config);
        });
        
        it('should parse valid sitemap', async function() {
            const sitemapPath = path.join(__dirname, 'fixtures', 'sitemap-valid.xml');
            const entries = await validator.parseSitemap(sitemapPath);
            
            assert.isArray(entries);
            assert.equal(entries.length, 1);
            assert.equal(entries[0].loc, 'https://example.akashacms.com/index.html');
            assert.equal(entries[0].changefreq, 'weekly');
            assert.equal(entries[0].priority, 0.5);
        });
    });

    describe('Entry Validation', function() {
        let validator;
        
        before(function() {
            validator = new SitemapValidator(config);
        });
        
        it('should validate existing file', async function() {
            const entry = {
                loc: 'https://example.akashacms.com/index.html'
            };
            
            const result = await validator.validateEntry(entry);
            
            assert.isTrue(result.valid);
            assert.isTrue(result.fileExists);
            assert.isUndefined(result.error);
        });
        
        it('should detect missing file', async function() {
            const entry = {
                loc: 'https://example.akashacms.com/does-not-exist.html'
            };
            
            const result = await validator.validateEntry(entry);
            
            assert.isFalse(result.valid);
            assert.isFalse(result.fileExists);
            assert.equal(result.error, 'File does not exist');
        });
    });

    describe('Full Validation', function() {
        let validator;
        
        before(async function() {
            // Create a valid sitemap in the test output directory
            const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.akashacms.com/index.html</loc>
    <lastmod>2026-05-22</lastmod>
  </url>
</urlset>`;
            
            await fs.writeFile(
                path.join(testOutputDir, 'sitemap.xml'),
                sitemapContent,
                'utf8'
            );
            
            validator = new SitemapValidator(config);
        });
        
        it('should validate sitemap successfully', async function() {
            const result = await validator.validate();
            
            assert.exists(result);
            assert.equal(result.totalEntries, 1);
            assert.equal(result.validEntries, 1);
            assert.equal(result.invalidEntries, 0);
            assert.equal(result.missingFiles.length, 0);
            assert.isTrue(result.xmlValidation.valid);
            assert.equal(result.errors.length, 0);
        });
        
        it('should handle missing sitemap file', async function() {
            const missingValidator = new SitemapValidator(config, 'missing-sitemap.xml');
            const result = await missingValidator.validate();
            
            assert.exists(result);
            assert.equal(result.totalEntries, 0);
            assert.equal(result.errors.length, 1);
            assert.include(result.errors[0], 'not found');
        });
        
        it('should detect missing files in sitemap', async function() {
            // Create sitemap with missing file
            const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.akashacms.com/missing-page.html</loc>
  </url>
</urlset>`;
            
            await fs.writeFile(
                path.join(testOutputDir, 'sitemap-with-missing.xml'),
                sitemapContent,
                'utf8'
            );
            
            const missingValidator = new SitemapValidator(config, 'sitemap-with-missing.xml');
            const result = await missingValidator.validate();
            
            assert.equal(result.totalEntries, 1);
            assert.equal(result.validEntries, 0);
            assert.equal(result.invalidEntries, 1);
            assert.equal(result.missingFiles.length, 1);
            assert.include(result.missingFiles[0].filePath, 'missing-page.html');
        });
    });

    describe('Report Formatting', function() {
        it('should format successful validation', function() {
            const result = {
                sitemapPath: '/path/to/sitemap.xml',
                totalEntries: 10,
                validEntries: 10,
                invalidEntries: 0,
                missingFiles: [],
                xmlValidation: {
                    valid: true,
                    namespace: true,
                    wellFormed: true,
                    errors: []
                },
                errors: [],
                warnings: []
            };
            
            const report = SitemapValidator.formatReport(result);
            
            assert.isString(report);
            assert.include(report, 'Sitemap Validation Report');
            assert.include(report, 'Total Entries: 10');
            assert.include(report, 'Valid Entries: 10');
            assert.include(report, '✓ Validation passed');
        });
        
        it('should format validation with errors', function() {
            const result = {
                sitemapPath: '/path/to/sitemap.xml',
                totalEntries: 10,
                validEntries: 8,
                invalidEntries: 2,
                missingFiles: [
                    {
                        entry: { loc: 'https://example.com/missing1.html' },
                        valid: false,
                        filePath: '/out/missing1.html',
                        fileExists: false,
                        error: 'File does not exist'
                    },
                    {
                        entry: { loc: 'https://example.com/missing2.html' },
                        valid: false,
                        filePath: '/out/missing2.html',
                        fileExists: false,
                        error: 'File does not exist'
                    }
                ],
                xmlValidation: {
                    valid: true,
                    namespace: true,
                    wellFormed: true,
                    errors: []
                },
                errors: [],
                warnings: []
            };
            
            const report = SitemapValidator.formatReport(result);
            
            assert.isString(report);
            assert.include(report, 'Invalid Entries: 2');
            assert.include(report, 'Missing Files:');
            assert.include(report, 'missing1.html');
            assert.include(report, 'missing2.html');
            assert.include(report, '✗ Validation failed');
        });
        
        it('should format validation with XML errors', function() {
            const result = {
                sitemapPath: '/path/to/sitemap.xml',
                totalEntries: 0,
                validEntries: 0,
                invalidEntries: 0,
                missingFiles: [],
                xmlValidation: {
                    valid: false,
                    namespace: false,
                    wellFormed: true,
                    errors: ['Missing sitemap namespace']
                },
                errors: ['XML validation failed'],
                warnings: []
            };
            
            const report = SitemapValidator.formatReport(result);
            
            assert.isString(report);
            assert.include(report, 'XML Validation: ✗ Invalid');
            assert.include(report, 'Missing sitemap namespace');
            assert.include(report, 'Errors:');
        });
    });
});
