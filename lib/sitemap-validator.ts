/**
 *
 * Copyright 2014-2025 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * Sitemap Validator
 * 
 * Validates generated sitemap XML files against the local rendered output directory.
 * Ensures that every URL in the sitemap corresponds to an actual file in the output.
 * 
 * @module sitemap-validator
 */

import { promises as fsp } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';
import { XMLToSitemapItemStream } from 'sitemap';
import type { Configuration } from './index.js';

/**
 * Represents a single entry from a sitemap XML file
 */
export interface SitemapEntry {
    /** Full URL from <loc> element */
    loc: string;
    /** Last modification date */
    lastmod?: string;
    /** Change frequency */
    changefreq?: string;
    /** Priority (0.0-1.0) */
    priority?: number;
}

/**
 * Validation result for a single sitemap entry
 */
export interface EntryValidation {
    /** The sitemap entry being validated */
    entry: SitemapEntry;
    /** Whether the entry is valid */
    valid: boolean;
    /** Filesystem path where the file should exist */
    filePath: string;
    /** Whether the file exists on the filesystem */
    fileExists: boolean;
    /** Error message if validation failed */
    error?: string;
}

/**
 * XML structure validation result
 */
export interface XMLValidation {
    /** Whether the XML is valid overall */
    valid: boolean;
    /** Whether the namespace is correct */
    namespace: boolean;
    /** Whether the XML is well-formed */
    wellFormed: boolean;
    /** List of validation errors */
    errors: string[];
    /** List of validation warnings */
    warnings?: string[];
}

/**
 * Complete validation result
 */
export interface ValidationResult {
    /** Path to the sitemap file that was validated */
    sitemapPath: string;
    /** Total number of entries in the sitemap */
    totalEntries: number;
    /** Number of valid entries */
    validEntries: number;
    /** Number of invalid entries */
    invalidEntries: number;
    /** List of entries with missing files */
    missingFiles: EntryValidation[];
    /** XML structure validation result */
    xmlValidation: XMLValidation;
    /** List of errors encountered during validation */
    errors: string[];
    /** List of warnings encountered during validation */
    warnings: string[];
}

/**
 * Sitemap Validator Class
 * 
 * Validates generated sitemap XML files against the local rendered output directory.
 */
export class SitemapValidator {
    #config: Configuration;
    #sitemapFilename: string;

    /**
     * Create a new SitemapValidator
     * 
     * @param config - AkashaRender configuration object
     * @param sitemapFilename - Name of the sitemap file (default: 'sitemap.xml')
     */
    constructor(config: Configuration, sitemapFilename: string = 'sitemap.xml') {
        if (!config) {
            throw new Error('Configuration is required');
        }
        if (!config.root_url) {
            throw new Error('Configuration must have root_url set');
        }
        if (!config.renderDestination) {
            throw new Error('Configuration must have renderDestination set');
        }
        
        this.#config = config;
        this.#sitemapFilename = sitemapFilename;
    }

    /**
     * Main validation method
     * 
     * Validates the sitemap file against the rendered output directory.
     * 
     * @returns Promise resolving to validation result
     */
    async validate(): Promise<ValidationResult> {
        const sitemapPath = path.join(this.#config.renderDestination, this.#sitemapFilename);
        
        const result: ValidationResult = {
            sitemapPath,
            totalEntries: 0,
            validEntries: 0,
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

        // Check if sitemap file exists
        if (!fs.existsSync(sitemapPath)) {
            result.errors.push(`Sitemap file not found: ${sitemapPath}`);
            result.xmlValidation.valid = false;
            return result;
        }

        try {
            // Read and validate XML structure
            const xmlContent = await fsp.readFile(sitemapPath, 'utf8');
            result.xmlValidation = this.validateXMLStructure(xmlContent);
            
            if (!result.xmlValidation.valid) {
                result.errors.push(...result.xmlValidation.errors);
                return result;
            }

            // Parse sitemap entries
            const entries = await this.parseSitemap(sitemapPath);
            result.totalEntries = entries.length;

            // Validate each entry
            for (const entry of entries) {
                try {
                    const entryValidation = await this.validateEntry(entry);
                    
                    if (entryValidation.valid) {
                        result.validEntries++;
                    } else {
                        result.invalidEntries++;
                        result.missingFiles.push(entryValidation);
                    }
                } catch (err) {
                    result.invalidEntries++;
                    result.errors.push(`Error validating entry ${entry.loc}: ${(err as Error).message}`);
                }
            }
        } catch (err) {
            result.errors.push(`Error during validation: ${(err as Error).message}`);
        }

        return result;
    }

    /**
     * Parse sitemap XML file
     * 
     * Uses the sitemap package's XMLToSitemapItemStream to parse the sitemap.
     * 
     * @param sitemapPath - Path to the sitemap file
     * @returns Promise resolving to array of sitemap entries
     */
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

    /**
     * Map sitemap URL to filesystem path
     * 
     * Converts a sitemap URL to the corresponding filesystem path in the output directory.
     * 
     * @param url - Full URL from sitemap
     * @returns Filesystem path where the file should exist
     */
    urlToFilePath(url: string): string {
        // 1. Parse the URL
        const urlObj = new URL(url);
        
        // 2. Validate base URL matches config.root_url
        const expectedBase = new URL(this.#config.root_url);
        if (urlObj.origin !== expectedBase.origin) {
            throw new Error(`URL origin mismatch: ${urlObj.origin} (expected: ${expectedBase.origin})`);
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

    /**
     * Check if file exists
     * 
     * @param filePath - Path to check
     * @returns Promise resolving to true if file exists
     */
    async fileExists(filePath: string): Promise<boolean> {
        try {
            await fsp.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate a single sitemap entry
     * 
     * @param entry - Sitemap entry to validate
     * @returns Promise resolving to entry validation result
     */
    async validateEntry(entry: SitemapEntry): Promise<EntryValidation> {
        const filePath = this.urlToFilePath(entry.loc);
        const fileExists = await this.fileExists(filePath);
        
        return {
            entry,
            valid: fileExists,
            filePath,
            fileExists,
            error: fileExists ? undefined : 'File does not exist'
        };
    }

    /**
     * Validate XML structure
     * 
     * Performs basic XML structure validation:
     * - Checks for XML declaration
     * - Validates sitemap namespace
     * - Checks for required elements
     * 
     * @param xml - XML content as string
     * @returns XML validation result
     */
    validateXMLStructure(xml: string): XMLValidation {
        const result: XMLValidation = {
            valid: true,
            namespace: true,
            wellFormed: true,
            errors: [],
            warnings: []
        };

        // Check for XML declaration
        if (!xml.includes('<?xml')) {
            result.warnings.push('Missing XML declaration');
        }

        // Check for sitemap namespace
        if (!xml.includes('http://www.sitemaps.org/schemas/sitemap/0.9')) {
            result.namespace = false;
            result.valid = false;
            result.errors.push('Missing or incorrect sitemap namespace');
        }

        // Check for urlset or sitemapindex root element
        if (!xml.includes('<urlset') && !xml.includes('<sitemapindex')) {
            result.wellFormed = false;
            result.valid = false;
            result.errors.push('Missing root element (<urlset> or <sitemapindex>)');
        }

        // Check for loc elements
        if (!xml.includes('<loc>')) {
            result.wellFormed = false;
            result.valid = false;
            result.errors.push('No <loc> elements found');
        }

        return result;
    }

    /**
     * Format validation result as human-readable text
     * 
     * @param result - Validation result to format
     * @returns Formatted report as string
     */
    static formatReport(result: ValidationResult): string {
        let report = 'Sitemap Validation Report\n';
        report += '=========================\n\n';
        
        report += `Sitemap: ${result.sitemapPath}\n`;
        report += `Total Entries: ${result.totalEntries}\n`;
        report += `Valid Entries: ${result.validEntries}\n`;
        report += `Invalid Entries: ${result.invalidEntries}\n\n`;

        if (result.missingFiles.length > 0) {
            report += 'Missing Files:\n';
            for (const missing of result.missingFiles) {
                report += `  ✗ ${missing.filePath}\n`;
                report += `    URL: ${missing.entry.loc}\n`;
            }
            report += '\n';
        }

        report += 'XML Validation: ';
        if (result.xmlValidation.valid) {
            report += '✓ Valid\n';
            report += `  - Namespace: ✓ Correct\n`;
            report += `  - Well-formed: ✓ Yes\n`;
        } else {
            report += '✗ Invalid\n';
            for (const error of result.xmlValidation.errors) {
                report += `  - ${error}\n`;
            }
        }
        report += '\n';

        if (result.errors.length > 0) {
            report += 'Errors:\n';
            for (const error of result.errors) {
                report += `  - ${error}\n`;
            }
            report += '\n';
        }

        if (result.warnings.length > 0) {
            report += 'Warnings:\n';
            for (const warning of result.warnings) {
                report += `  - ${warning}\n`;
            }
            report += '\n';
        }

        const summary = result.invalidEntries === 0 && result.errors.length === 0
            ? '✓ Validation passed'
            : `✗ Validation failed: ${result.invalidEntries} invalid entries, ${result.errors.length} errors`;
        
        report += `Summary: ${summary}\n`;

        return report;
    }
}
