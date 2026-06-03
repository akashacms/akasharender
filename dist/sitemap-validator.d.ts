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
export declare class SitemapValidator {
    #private;
    /**
     * Create a new SitemapValidator
     *
     * @param config - AkashaRender configuration object
     * @param sitemapFilename - Name of the sitemap file (default: 'sitemap.xml')
     */
    constructor(config: Configuration, sitemapFilename?: string);
    /**
     * Main validation method
     *
     * Validates the sitemap file against the rendered output directory.
     *
     * @returns Promise resolving to validation result
     */
    validate(): Promise<ValidationResult>;
    /**
     * Parse sitemap XML file
     *
     * Uses the sitemap package's XMLToSitemapItemStream to parse the sitemap.
     *
     * @param sitemapPath - Path to the sitemap file
     * @returns Promise resolving to array of sitemap entries
     */
    parseSitemap(sitemapPath: string): Promise<SitemapEntry[]>;
    /**
     * Map sitemap URL to filesystem path
     *
     * Converts a sitemap URL to the corresponding filesystem path in the output directory.
     *
     * @param url - Full URL from sitemap
     * @returns Filesystem path where the file should exist
     */
    urlToFilePath(url: string): string;
    /**
     * Check if file exists
     *
     * @param filePath - Path to check
     * @returns Promise resolving to true if file exists
     */
    fileExists(filePath: string): Promise<boolean>;
    /**
     * Validate a single sitemap entry
     *
     * @param entry - Sitemap entry to validate
     * @returns Promise resolving to entry validation result
     */
    validateEntry(entry: SitemapEntry): Promise<EntryValidation>;
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
    validateXMLStructure(xml: string): XMLValidation;
    /**
     * Format validation result as human-readable text
     *
     * @param result - Validation result to format
     * @returns Formatted report as string
     */
    static formatReport(result: ValidationResult): string;
}
//# sourceMappingURL=sitemap-validator.d.ts.map