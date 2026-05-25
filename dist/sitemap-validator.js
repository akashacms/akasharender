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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SitemapValidator_config, _SitemapValidator_sitemapFilename;
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
/**
 * Sitemap Validator Class
 *
 * Validates generated sitemap XML files against the local rendered output directory.
 */
export class SitemapValidator {
    /**
     * Create a new SitemapValidator
     *
     * @param config - AkashaRender configuration object
     * @param sitemapFilename - Name of the sitemap file (default: 'sitemap.xml')
     */
    constructor(config, sitemapFilename = 'sitemap.xml') {
        _SitemapValidator_config.set(this, void 0);
        _SitemapValidator_sitemapFilename.set(this, void 0);
        if (!config) {
            throw new Error('Configuration is required');
        }
        if (!config.root_url) {
            throw new Error('Configuration must have root_url set');
        }
        if (!config.renderDestination) {
            throw new Error('Configuration must have renderDestination set');
        }
        __classPrivateFieldSet(this, _SitemapValidator_config, config, "f");
        __classPrivateFieldSet(this, _SitemapValidator_sitemapFilename, sitemapFilename, "f");
    }
    /**
     * Main validation method
     *
     * Validates the sitemap file against the rendered output directory.
     *
     * @returns Promise resolving to validation result
     */
    async validate() {
        const sitemapPath = path.join(__classPrivateFieldGet(this, _SitemapValidator_config, "f").renderDestination, __classPrivateFieldGet(this, _SitemapValidator_sitemapFilename, "f"));
        const result = {
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
                    }
                    else {
                        result.invalidEntries++;
                        result.missingFiles.push(entryValidation);
                    }
                }
                catch (err) {
                    result.invalidEntries++;
                    result.errors.push(`Error validating entry ${entry.loc}: ${err.message}`);
                }
            }
        }
        catch (err) {
            result.errors.push(`Error during validation: ${err.message}`);
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
    async parseSitemap(sitemapPath) {
        return new Promise((resolve, reject) => {
            const entries = [];
            fs.createReadStream(sitemapPath)
                .pipe(new XMLToSitemapItemStream())
                .on('data', (item) => {
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
    urlToFilePath(url) {
        // 1. Parse the URL
        const urlObj = new URL(url);
        // 2. Validate base URL matches config.root_url
        const expectedBase = new URL(__classPrivateFieldGet(this, _SitemapValidator_config, "f").root_url);
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
        const filePath = path.join(__classPrivateFieldGet(this, _SitemapValidator_config, "f").renderDestination, pathname);
        return filePath;
    }
    /**
     * Check if file exists
     *
     * @param filePath - Path to check
     * @returns Promise resolving to true if file exists
     */
    async fileExists(filePath) {
        try {
            await fsp.access(filePath, fs.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Validate a single sitemap entry
     *
     * @param entry - Sitemap entry to validate
     * @returns Promise resolving to entry validation result
     */
    async validateEntry(entry) {
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
    validateXMLStructure(xml) {
        const result = {
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
    static formatReport(result) {
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
        }
        else {
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
_SitemapValidator_config = new WeakMap(), _SitemapValidator_sitemapFilename = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2l0ZW1hcC12YWxpZGF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvc2l0ZW1hcC12YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUg7Ozs7Ozs7R0FPRztBQUVILE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN6QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sU0FBUyxDQUFDO0FBdUVqRDs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLGdCQUFnQjtJQUl6Qjs7Ozs7T0FLRztJQUNILFlBQVksTUFBcUIsRUFBRSxrQkFBMEIsYUFBYTtRQVQxRSwyQ0FBdUI7UUFDdkIsb0RBQXlCO1FBU3JCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUNELElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVELHVCQUFBLElBQUksNEJBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSxxQ0FBb0IsZUFBZSxNQUFBLENBQUM7SUFDNUMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxRQUFRO1FBQ1YsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLGdDQUFRLENB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NC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBTaXRlbWFwIFZhbGlkYXRvclxuICogXG4gKiBWYWxpZGF0ZXMgZ2VuZXJhdGVkIHNpdGVtYXAgWE1MIGZpbGVzIGFnYWluc3QgdGhlIGxvY2FsIHJlbmRlcmVkIG91dHB1dCBkaXJlY3RvcnkuXG4gKiBFbnN1cmVzIHRoYXQgZXZlcnkgVVJMIGluIHRoZSBzaXRlbWFwIGNvcnJlc3BvbmRzIHRvIGFuIGFjdHVhbCBmaWxlIGluIHRoZSBvdXRwdXQuXG4gKiBcbiAqIEBtb2R1bGUgc2l0ZW1hcC12YWxpZGF0b3JcbiAqL1xuXG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBYTUxUb1NpdGVtYXBJdGVtU3RyZWFtIH0gZnJvbSAnc2l0ZW1hcCc7XG5pbXBvcnQgdHlwZSB7IENvbmZpZ3VyYXRpb24gfSBmcm9tICcuL2luZGV4LmpzJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgc2luZ2xlIGVudHJ5IGZyb20gYSBzaXRlbWFwIFhNTCBmaWxlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2l0ZW1hcEVudHJ5IHtcbiAgICAvKiogRnVsbCBVUkwgZnJvbSA8bG9jPiBlbGVtZW50ICovXG4gICAgbG9jOiBzdHJpbmc7XG4gICAgLyoqIExhc3QgbW9kaWZpY2F0aW9uIGRhdGUgKi9cbiAgICBsYXN0bW9kPzogc3RyaW5nO1xuICAgIC8qKiBDaGFuZ2UgZnJlcXVlbmN5ICovXG4gICAgY2hhbmdlZnJlcT86IHN0cmluZztcbiAgICAvKiogUHJpb3JpdHkgKDAuMC0xLjApICovXG4gICAgcHJpb3JpdHk/OiBudW1iZXI7XG59XG5cbi8qKlxuICogVmFsaWRhdGlvbiByZXN1bHQgZm9yIGEgc2luZ2xlIHNpdGVtYXAgZW50cnlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFbnRyeVZhbGlkYXRpb24ge1xuICAgIC8qKiBUaGUgc2l0ZW1hcCBlbnRyeSBiZWluZyB2YWxpZGF0ZWQgKi9cbiAgICBlbnRyeTogU2l0ZW1hcEVudHJ5O1xuICAgIC8qKiBXaGV0aGVyIHRoZSBlbnRyeSBpcyB2YWxpZCAqL1xuICAgIHZhbGlkOiBib29sZWFuO1xuICAgIC8qKiBGaWxlc3lzdGVtIHBhdGggd2hlcmUgdGhlIGZpbGUgc2hvdWxkIGV4aXN0ICovXG4gICAgZmlsZVBhdGg6IHN0cmluZztcbiAgICAvKiogV2hldGhlciB0aGUgZmlsZSBleGlzdHMgb24gdGhlIGZpbGVzeXN0ZW0gKi9cbiAgICBmaWxlRXhpc3RzOiBib29sZWFuO1xuICAgIC8qKiBFcnJvciBtZXNzYWdlIGlmIHZhbGlkYXRpb24gZmFpbGVkICovXG4gICAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogWE1MIHN0cnVjdHVyZSB2YWxpZGF0aW9uIHJlc3VsdFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFhNTFZhbGlkYXRpb24ge1xuICAgIC8qKiBXaGV0aGVyIHRoZSBYTUwgaXMgdmFsaWQgb3ZlcmFsbCAqL1xuICAgIHZhbGlkOiBib29sZWFuO1xuICAgIC8qKiBXaGV0aGVyIHRoZSBuYW1lc3BhY2UgaXMgY29ycmVjdCAqL1xuICAgIG5hbWVzcGFjZTogYm9vbGVhbjtcbiAgICAvKiogV2hldGhlciB0aGUgWE1MIGlzIHdlbGwtZm9ybWVkICovXG4gICAgd2VsbEZvcm1lZDogYm9vbGVhbjtcbiAgICAvKiogTGlzdCBvZiB2YWxpZGF0aW9uIGVycm9ycyAqL1xuICAgIGVycm9yczogc3RyaW5nW107XG4gICAgLyoqIExpc3Qgb2YgdmFsaWRhdGlvbiB3YXJuaW5ncyAqL1xuICAgIHdhcm5pbmdzPzogc3RyaW5nW107XG59XG5cbi8qKlxuICogQ29tcGxldGUgdmFsaWRhdGlvbiByZXN1bHRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICAvKiogUGF0aCB0byB0aGUgc2l0ZW1hcCBmaWxlIHRoYXQgd2FzIHZhbGlkYXRlZCAqL1xuICAgIHNpdGVtYXBQYXRoOiBzdHJpbmc7XG4gICAgLyoqIFRvdGFsIG51bWJlciBvZiBlbnRyaWVzIGluIHRoZSBzaXRlbWFwICovXG4gICAgdG90YWxFbnRyaWVzOiBudW1iZXI7XG4gICAgLyoqIE51bWJlciBvZiB2YWxpZCBlbnRyaWVzICovXG4gICAgdmFsaWRFbnRyaWVzOiBudW1iZXI7XG4gICAgLyoqIE51bWJlciBvZiBpbnZhbGlkIGVudHJpZXMgKi9cbiAgICBpbnZhbGlkRW50cmllczogbnVtYmVyO1xuICAgIC8qKiBMaXN0IG9mIGVudHJpZXMgd2l0aCBtaXNzaW5nIGZpbGVzICovXG4gICAgbWlzc2luZ0ZpbGVzOiBFbnRyeVZhbGlkYXRpb25bXTtcbiAgICAvKiogWE1MIHN0cnVjdHVyZSB2YWxpZGF0aW9uIHJlc3VsdCAqL1xuICAgIHhtbFZhbGlkYXRpb246IFhNTFZhbGlkYXRpb247XG4gICAgLyoqIExpc3Qgb2YgZXJyb3JzIGVuY291bnRlcmVkIGR1cmluZyB2YWxpZGF0aW9uICovXG4gICAgZXJyb3JzOiBzdHJpbmdbXTtcbiAgICAvKiogTGlzdCBvZiB3YXJuaW5ncyBlbmNvdW50ZXJlZCBkdXJpbmcgdmFsaWRhdGlvbiAqL1xuICAgIHdhcm5pbmdzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBTaXRlbWFwIFZhbGlkYXRvciBDbGFzc1xuICogXG4gKiBWYWxpZGF0ZXMgZ2VuZXJhdGVkIHNpdGVtYXAgWE1MIGZpbGVzIGFnYWluc3QgdGhlIGxvY2FsIHJlbmRlcmVkIG91dHB1dCBkaXJlY3RvcnkuXG4gKi9cbmV4cG9ydCBjbGFzcyBTaXRlbWFwVmFsaWRhdG9yIHtcbiAgICAjY29uZmlnOiBDb25maWd1cmF0aW9uO1xuICAgICNzaXRlbWFwRmlsZW5hbWU6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBTaXRlbWFwVmFsaWRhdG9yXG4gICAgICogXG4gICAgICogQHBhcmFtIGNvbmZpZyAtIEFrYXNoYVJlbmRlciBjb25maWd1cmF0aW9uIG9iamVjdFxuICAgICAqIEBwYXJhbSBzaXRlbWFwRmlsZW5hbWUgLSBOYW1lIG9mIHRoZSBzaXRlbWFwIGZpbGUgKGRlZmF1bHQ6ICdzaXRlbWFwLnhtbCcpXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBDb25maWd1cmF0aW9uLCBzaXRlbWFwRmlsZW5hbWU6IHN0cmluZyA9ICdzaXRlbWFwLnhtbCcpIHtcbiAgICAgICAgaWYgKCFjb25maWcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uZmlndXJhdGlvbiBpcyByZXF1aXJlZCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY29uZmlnLnJvb3RfdXJsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmZpZ3VyYXRpb24gbXVzdCBoYXZlIHJvb3RfdXJsIHNldCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmZpZ3VyYXRpb24gbXVzdCBoYXZlIHJlbmRlckRlc3RpbmF0aW9uIHNldCcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLiNjb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuI3NpdGVtYXBGaWxlbmFtZSA9IHNpdGVtYXBGaWxlbmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYWluIHZhbGlkYXRpb24gbWV0aG9kXG4gICAgICogXG4gICAgICogVmFsaWRhdGVzIHRoZSBzaXRlbWFwIGZpbGUgYWdhaW5zdCB0aGUgcmVuZGVyZWQgb3V0cHV0IGRpcmVjdG9yeS5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlIHJlc29sdmluZyB0byB2YWxpZGF0aW9uIHJlc3VsdFxuICAgICAqL1xuICAgIGFzeW5jIHZhbGlkYXRlKCk6IFByb21pc2U8VmFsaWRhdGlvblJlc3VsdD4ge1xuICAgICAgICBjb25zdCBzaXRlbWFwUGF0aCA9IHBhdGguam9pbih0aGlzLiNjb25maWcucmVuZGVyRGVzdGluYXRpb24sIHRoaXMuI3NpdGVtYXBGaWxlbmFtZSk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQgPSB7XG4gICAgICAgICAgICBzaXRlbWFwUGF0aCxcbiAgICAgICAgICAgIHRvdGFsRW50cmllczogMCxcbiAgICAgICAgICAgIHZhbGlkRW50cmllczogMCxcbiAgICAgICAgICAgIGludmFsaWRFbnRyaWVzOiAwLFxuICAgICAgICAgICAgbWlzc2luZ0ZpbGVzOiBbXSxcbiAgICAgICAgICAgIHhtbFZhbGlkYXRpb246IHtcbiAgICAgICAgICAgICAgICB2YWxpZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6IHRydWUsXG4gICAgICAgICAgICAgICAgd2VsbEZvcm1lZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBlcnJvcnM6IFtdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3JzOiBbXSxcbiAgICAgICAgICAgIHdhcm5pbmdzOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHNpdGVtYXAgZmlsZSBleGlzdHNcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHNpdGVtYXBQYXRoKSkge1xuICAgICAgICAgICAgcmVzdWx0LmVycm9ycy5wdXNoKGBTaXRlbWFwIGZpbGUgbm90IGZvdW5kOiAke3NpdGVtYXBQYXRofWApO1xuICAgICAgICAgICAgcmVzdWx0LnhtbFZhbGlkYXRpb24udmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gUmVhZCBhbmQgdmFsaWRhdGUgWE1MIHN0cnVjdHVyZVxuICAgICAgICAgICAgY29uc3QgeG1sQ29udGVudCA9IGF3YWl0IGZzcC5yZWFkRmlsZShzaXRlbWFwUGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgICAgIHJlc3VsdC54bWxWYWxpZGF0aW9uID0gdGhpcy52YWxpZGF0ZVhNTFN0cnVjdHVyZSh4bWxDb250ZW50KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFyZXN1bHQueG1sVmFsaWRhdGlvbi52YWxpZCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5lcnJvcnMucHVzaCguLi5yZXN1bHQueG1sVmFsaWRhdGlvbi5lcnJvcnMpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFBhcnNlIHNpdGVtYXAgZW50cmllc1xuICAgICAgICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHRoaXMucGFyc2VTaXRlbWFwKHNpdGVtYXBQYXRoKTtcbiAgICAgICAgICAgIHJlc3VsdC50b3RhbEVudHJpZXMgPSBlbnRyaWVzLmxlbmd0aDtcblxuICAgICAgICAgICAgLy8gVmFsaWRhdGUgZWFjaCBlbnRyeVxuICAgICAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW50cnlWYWxpZGF0aW9uID0gYXdhaXQgdGhpcy52YWxpZGF0ZUVudHJ5KGVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbnRyeVZhbGlkYXRpb24udmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC52YWxpZEVudHJpZXMrKztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5pbnZhbGlkRW50cmllcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm1pc3NpbmdGaWxlcy5wdXNoKGVudHJ5VmFsaWRhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmludmFsaWRFbnRyaWVzKys7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5lcnJvcnMucHVzaChgRXJyb3IgdmFsaWRhdGluZyBlbnRyeSAke2VudHJ5LmxvY306ICR7KGVyciBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVzdWx0LmVycm9ycy5wdXNoKGBFcnJvciBkdXJpbmcgdmFsaWRhdGlvbjogJHsoZXJyIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQYXJzZSBzaXRlbWFwIFhNTCBmaWxlXG4gICAgICogXG4gICAgICogVXNlcyB0aGUgc2l0ZW1hcCBwYWNrYWdlJ3MgWE1MVG9TaXRlbWFwSXRlbVN0cmVhbSB0byBwYXJzZSB0aGUgc2l0ZW1hcC5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gc2l0ZW1hcFBhdGggLSBQYXRoIHRvIHRoZSBzaXRlbWFwIGZpbGVcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlIHJlc29sdmluZyB0byBhcnJheSBvZiBzaXRlbWFwIGVudHJpZXNcbiAgICAgKi9cbiAgICBhc3luYyBwYXJzZVNpdGVtYXAoc2l0ZW1hcFBhdGg6IHN0cmluZyk6IFByb21pc2U8U2l0ZW1hcEVudHJ5W10+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVudHJpZXM6IFNpdGVtYXBFbnRyeVtdID0gW107XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZzLmNyZWF0ZVJlYWRTdHJlYW0oc2l0ZW1hcFBhdGgpXG4gICAgICAgICAgICAgICAgLnBpcGUobmV3IFhNTFRvU2l0ZW1hcEl0ZW1TdHJlYW0oKSlcbiAgICAgICAgICAgICAgICAub24oJ2RhdGEnLCAoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGVudHJpZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2M6IGl0ZW0udXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdG1vZDogaXRlbS5sYXN0bW9kLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZnJlcTogaXRlbS5jaGFuZ2VmcmVxLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJpb3JpdHk6IGl0ZW0ucHJpb3JpdHlcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAub24oJ2VuZCcsICgpID0+IHJlc29sdmUoZW50cmllcykpXG4gICAgICAgICAgICAgICAgLm9uKCdlcnJvcicsIChlcnIpID0+IHJlamVjdChlcnIpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFwIHNpdGVtYXAgVVJMIHRvIGZpbGVzeXN0ZW0gcGF0aFxuICAgICAqIFxuICAgICAqIENvbnZlcnRzIGEgc2l0ZW1hcCBVUkwgdG8gdGhlIGNvcnJlc3BvbmRpbmcgZmlsZXN5c3RlbSBwYXRoIGluIHRoZSBvdXRwdXQgZGlyZWN0b3J5LlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB1cmwgLSBGdWxsIFVSTCBmcm9tIHNpdGVtYXBcbiAgICAgKiBAcmV0dXJucyBGaWxlc3lzdGVtIHBhdGggd2hlcmUgdGhlIGZpbGUgc2hvdWxkIGV4aXN0XG4gICAgICovXG4gICAgdXJsVG9GaWxlUGF0aCh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIC8vIDEuIFBhcnNlIHRoZSBVUkxcbiAgICAgICAgY29uc3QgdXJsT2JqID0gbmV3IFVSTCh1cmwpO1xuICAgICAgICBcbiAgICAgICAgLy8gMi4gVmFsaWRhdGUgYmFzZSBVUkwgbWF0Y2hlcyBjb25maWcucm9vdF91cmxcbiAgICAgICAgY29uc3QgZXhwZWN0ZWRCYXNlID0gbmV3IFVSTCh0aGlzLiNjb25maWcucm9vdF91cmwpO1xuICAgICAgICBpZiAodXJsT2JqLm9yaWdpbiAhPT0gZXhwZWN0ZWRCYXNlLm9yaWdpbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVUkwgb3JpZ2luIG1pc21hdGNoOiAke3VybE9iai5vcmlnaW59IChleHBlY3RlZDogJHtleHBlY3RlZEJhc2Uub3JpZ2lufSlgKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gMy4gR2V0IHBhdGhuYW1lIChlLmcuLCBcIi9ibG9nL3Bvc3QuaHRtbFwiKVxuICAgICAgICBsZXQgcGF0aG5hbWUgPSB1cmxPYmoucGF0aG5hbWU7XG4gICAgICAgIFxuICAgICAgICAvLyA0LiBSZW1vdmUgbGVhZGluZyBzbGFzaFxuICAgICAgICBpZiAocGF0aG5hbWUuc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICAgICAgICBwYXRobmFtZSA9IHBhdGhuYW1lLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gNS4gSGFuZGxlIGVtcHR5IHBhdGhuYW1lIChyb290KVxuICAgICAgICBpZiAocGF0aG5hbWUgPT09ICcnIHx8IHBhdGhuYW1lID09PSAnLycpIHtcbiAgICAgICAgICAgIHBhdGhuYW1lID0gJ2luZGV4Lmh0bWwnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyA2LiBIYW5kbGUgZGlyZWN0b3J5IHBhdGhzICh0cmFpbGluZyBzbGFzaClcbiAgICAgICAgaWYgKHBhdGhuYW1lLmVuZHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgIHBhdGhuYW1lID0gcGF0aG5hbWUgKyAnaW5kZXguaHRtbCc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIDcuIENvbnN0cnVjdCBmdWxsIGZpbGVzeXN0ZW0gcGF0aFxuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLiNjb25maWcucmVuZGVyRGVzdGluYXRpb24sIHBhdGhuYW1lKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBmaWxlUGF0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBmaWxlIGV4aXN0c1xuICAgICAqIFxuICAgICAqIEBwYXJhbSBmaWxlUGF0aCAtIFBhdGggdG8gY2hlY2tcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlIHJlc29sdmluZyB0byB0cnVlIGlmIGZpbGUgZXhpc3RzXG4gICAgICovXG4gICAgYXN5bmMgZmlsZUV4aXN0cyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBmc3AuYWNjZXNzKGZpbGVQYXRoLCBmcy5jb25zdGFudHMuRl9PSyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0ZSBhIHNpbmdsZSBzaXRlbWFwIGVudHJ5XG4gICAgICogXG4gICAgICogQHBhcmFtIGVudHJ5IC0gU2l0ZW1hcCBlbnRyeSB0byB2YWxpZGF0ZVxuICAgICAqIEByZXR1cm5zIFByb21pc2UgcmVzb2x2aW5nIHRvIGVudHJ5IHZhbGlkYXRpb24gcmVzdWx0XG4gICAgICovXG4gICAgYXN5bmMgdmFsaWRhdGVFbnRyeShlbnRyeTogU2l0ZW1hcEVudHJ5KTogUHJvbWlzZTxFbnRyeVZhbGlkYXRpb24+IHtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSB0aGlzLnVybFRvRmlsZVBhdGgoZW50cnkubG9jKTtcbiAgICAgICAgY29uc3QgZmlsZUV4aXN0cyA9IGF3YWl0IHRoaXMuZmlsZUV4aXN0cyhmaWxlUGF0aCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZW50cnksXG4gICAgICAgICAgICB2YWxpZDogZmlsZUV4aXN0cyxcbiAgICAgICAgICAgIGZpbGVQYXRoLFxuICAgICAgICAgICAgZmlsZUV4aXN0cyxcbiAgICAgICAgICAgIGVycm9yOiBmaWxlRXhpc3RzID8gdW5kZWZpbmVkIDogJ0ZpbGUgZG9lcyBub3QgZXhpc3QnXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGUgWE1MIHN0cnVjdHVyZVxuICAgICAqIFxuICAgICAqIFBlcmZvcm1zIGJhc2ljIFhNTCBzdHJ1Y3R1cmUgdmFsaWRhdGlvbjpcbiAgICAgKiAtIENoZWNrcyBmb3IgWE1MIGRlY2xhcmF0aW9uXG4gICAgICogLSBWYWxpZGF0ZXMgc2l0ZW1hcCBuYW1lc3BhY2VcbiAgICAgKiAtIENoZWNrcyBmb3IgcmVxdWlyZWQgZWxlbWVudHNcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0geG1sIC0gWE1MIGNvbnRlbnQgYXMgc3RyaW5nXG4gICAgICogQHJldHVybnMgWE1MIHZhbGlkYXRpb24gcmVzdWx0XG4gICAgICovXG4gICAgdmFsaWRhdGVYTUxTdHJ1Y3R1cmUoeG1sOiBzdHJpbmcpOiBYTUxWYWxpZGF0aW9uIHtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBYTUxWYWxpZGF0aW9uID0ge1xuICAgICAgICAgICAgdmFsaWQ6IHRydWUsXG4gICAgICAgICAgICBuYW1lc3BhY2U6IHRydWUsXG4gICAgICAgICAgICB3ZWxsRm9ybWVkOiB0cnVlLFxuICAgICAgICAgICAgZXJyb3JzOiBbXSxcbiAgICAgICAgICAgIHdhcm5pbmdzOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENoZWNrIGZvciBYTUwgZGVjbGFyYXRpb25cbiAgICAgICAgaWYgKCF4bWwuaW5jbHVkZXMoJzw/eG1sJykpIHtcbiAgICAgICAgICAgIHJlc3VsdC53YXJuaW5ncy5wdXNoKCdNaXNzaW5nIFhNTCBkZWNsYXJhdGlvbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIHNpdGVtYXAgbmFtZXNwYWNlXG4gICAgICAgIGlmICgheG1sLmluY2x1ZGVzKCdodHRwOi8vd3d3LnNpdGVtYXBzLm9yZy9zY2hlbWFzL3NpdGVtYXAvMC45JykpIHtcbiAgICAgICAgICAgIHJlc3VsdC5uYW1lc3BhY2UgPSBmYWxzZTtcbiAgICAgICAgICAgIHJlc3VsdC52YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmVzdWx0LmVycm9ycy5wdXNoKCdNaXNzaW5nIG9yIGluY29ycmVjdCBzaXRlbWFwIG5hbWVzcGFjZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIHVybHNldCBvciBzaXRlbWFwaW5kZXggcm9vdCBlbGVtZW50XG4gICAgICAgIGlmICgheG1sLmluY2x1ZGVzKCc8dXJsc2V0JykgJiYgIXhtbC5pbmNsdWRlcygnPHNpdGVtYXBpbmRleCcpKSB7XG4gICAgICAgICAgICByZXN1bHQud2VsbEZvcm1lZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmVzdWx0LnZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICByZXN1bHQuZXJyb3JzLnB1c2goJ01pc3Npbmcgcm9vdCBlbGVtZW50ICg8dXJsc2V0PiBvciA8c2l0ZW1hcGluZGV4PiknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGZvciBsb2MgZWxlbWVudHNcbiAgICAgICAgaWYgKCF4bWwuaW5jbHVkZXMoJzxsb2M+JykpIHtcbiAgICAgICAgICAgIHJlc3VsdC53ZWxsRm9ybWVkID0gZmFsc2U7XG4gICAgICAgICAgICByZXN1bHQudmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJlc3VsdC5lcnJvcnMucHVzaCgnTm8gPGxvYz4gZWxlbWVudHMgZm91bmQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRm9ybWF0IHZhbGlkYXRpb24gcmVzdWx0IGFzIGh1bWFuLXJlYWRhYmxlIHRleHRcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gcmVzdWx0IC0gVmFsaWRhdGlvbiByZXN1bHQgdG8gZm9ybWF0XG4gICAgICogQHJldHVybnMgRm9ybWF0dGVkIHJlcG9ydCBhcyBzdHJpbmdcbiAgICAgKi9cbiAgICBzdGF0aWMgZm9ybWF0UmVwb3J0KHJlc3VsdDogVmFsaWRhdGlvblJlc3VsdCk6IHN0cmluZyB7XG4gICAgICAgIGxldCByZXBvcnQgPSAnU2l0ZW1hcCBWYWxpZGF0aW9uIFJlcG9ydFxcbic7XG4gICAgICAgIHJlcG9ydCArPSAnPT09PT09PT09PT09PT09PT09PT09PT09PVxcblxcbic7XG4gICAgICAgIFxuICAgICAgICByZXBvcnQgKz0gYFNpdGVtYXA6ICR7cmVzdWx0LnNpdGVtYXBQYXRofVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgVG90YWwgRW50cmllczogJHtyZXN1bHQudG90YWxFbnRyaWVzfVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgVmFsaWQgRW50cmllczogJHtyZXN1bHQudmFsaWRFbnRyaWVzfVxcbmA7XG4gICAgICAgIHJlcG9ydCArPSBgSW52YWxpZCBFbnRyaWVzOiAke3Jlc3VsdC5pbnZhbGlkRW50cmllc31cXG5cXG5gO1xuXG4gICAgICAgIGlmIChyZXN1bHQubWlzc2luZ0ZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJlcG9ydCArPSAnTWlzc2luZyBGaWxlczpcXG4nO1xuICAgICAgICAgICAgZm9yIChjb25zdCBtaXNzaW5nIG9mIHJlc3VsdC5taXNzaW5nRmlsZXMpIHtcbiAgICAgICAgICAgICAgICByZXBvcnQgKz0gYCAg4pyXICR7bWlzc2luZy5maWxlUGF0aH1cXG5gO1xuICAgICAgICAgICAgICAgIHJlcG9ydCArPSBgICAgIFVSTDogJHttaXNzaW5nLmVudHJ5LmxvY31cXG5gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVwb3J0ICs9ICdcXG4nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVwb3J0ICs9ICdYTUwgVmFsaWRhdGlvbjogJztcbiAgICAgICAgaWYgKHJlc3VsdC54bWxWYWxpZGF0aW9uLnZhbGlkKSB7XG4gICAgICAgICAgICByZXBvcnQgKz0gJ+KckyBWYWxpZFxcbic7XG4gICAgICAgICAgICByZXBvcnQgKz0gYCAgLSBOYW1lc3BhY2U6IOKckyBDb3JyZWN0XFxuYDtcbiAgICAgICAgICAgIHJlcG9ydCArPSBgICAtIFdlbGwtZm9ybWVkOiDinJMgWWVzXFxuYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcG9ydCArPSAn4pyXIEludmFsaWRcXG4nO1xuICAgICAgICAgICAgZm9yIChjb25zdCBlcnJvciBvZiByZXN1bHQueG1sVmFsaWRhdGlvbi5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICByZXBvcnQgKz0gYCAgLSAke2Vycm9yfVxcbmA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVwb3J0ICs9ICdcXG4nO1xuXG4gICAgICAgIGlmIChyZXN1bHQuZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJlcG9ydCArPSAnRXJyb3JzOlxcbic7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICByZXBvcnQgKz0gYCAgLSAke2Vycm9yfVxcbmA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXBvcnQgKz0gJ1xcbic7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVzdWx0Lndhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJlcG9ydCArPSAnV2FybmluZ3M6XFxuJztcbiAgICAgICAgICAgIGZvciAoY29uc3Qgd2FybmluZyBvZiByZXN1bHQud2FybmluZ3MpIHtcbiAgICAgICAgICAgICAgICByZXBvcnQgKz0gYCAgLSAke3dhcm5pbmd9XFxuYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcG9ydCArPSAnXFxuJztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN1bW1hcnkgPSByZXN1bHQuaW52YWxpZEVudHJpZXMgPT09IDAgJiYgcmVzdWx0LmVycm9ycy5sZW5ndGggPT09IDBcbiAgICAgICAgICAgID8gJ+KckyBWYWxpZGF0aW9uIHBhc3NlZCdcbiAgICAgICAgICAgIDogYOKclyBWYWxpZGF0aW9uIGZhaWxlZDogJHtyZXN1bHQuaW52YWxpZEVudHJpZXN9IGludmFsaWQgZW50cmllcywgJHtyZXN1bHQuZXJyb3JzLmxlbmd0aH0gZXJyb3JzYDtcbiAgICAgICAgXG4gICAgICAgIHJlcG9ydCArPSBgU3VtbWFyeTogJHtzdW1tYXJ5fVxcbmA7XG5cbiAgICAgICAgcmV0dXJuIHJlcG9ydDtcbiAgICB9XG59XG4iXX0=