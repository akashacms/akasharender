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

import { promises as fsp } from 'node:fs';
import matter from 'gray-matter';

import type { Configuration } from './index.js';
import type {
    RefactorTagResult,
    RefactorDocumentChange,
    RefactorError
} from './types.js';

export interface RefactorOptions {
    dryRun: boolean;
}

/**
 * Refactor tag names across all documents.
 * Changes all occurrences of oldTag to newTag in document frontmatter.
 * 
 * @param config - The AkashaRender configuration
 * @param oldTag - The tag name to replace
 * @param newTag - The new tag name
 * @param options - Options including dryRun mode
 * @returns Result object with details of all changes made or that would be made
 */
export async function refactorTag(
    config: Configuration,
    oldTag: string,
    newTag: string,
    options: RefactorOptions
): Promise<RefactorTagResult> {
    const result: RefactorTagResult = {
        oldTag,
        newTag,
        dryRun: options.dryRun,
        modifiedDocuments: [],
        mergedDocuments: [],
        errors: []
    };

    // Get documents cache from the filecache
    const filecache = config.akasha.filecache;
    const documentsCache = filecache.documentsCache;

    // Find all documents with the old tag
    const vpaths = await documentsCache.documentsWithTag(oldTag);

    for (const vpath of vpaths) {
        try {
            // Get the document info to get the filesystem path
            const docInfo = await documentsCache.find(vpath);
            if (!docInfo || !docInfo.fspath) {
                result.errors.push({
                    vpath,
                    fspath: '',
                    error: `Could not find document info for ${vpath}`
                });
                continue;
            }

            const fspath = docInfo.fspath;

            // Read the file
            const content = await fsp.readFile(fspath, 'utf-8');

            // Parse frontmatter
            const parsed = matter(content);
            const originalTags = Array.isArray(parsed.data.tags) 
                ? [...parsed.data.tags] 
                : [];

            // Check if document already has the new tag
            const hasNewTag = originalTags.includes(newTag);
            const hasOldTag = originalTags.includes(oldTag);

            if (!hasOldTag) {
                // This shouldn't happen, but handle it gracefully
                continue;
            }

            // Compute new tags array
            let newTags: string[];
            if (hasNewTag) {
                // Document already has new tag, just remove the old tag
                newTags = originalTags.filter(t => t !== oldTag);
            } else {
                // Replace old tag with new tag
                newTags = originalTags.map(t => t === oldTag ? newTag : t);
            }

            const change: RefactorDocumentChange = {
                vpath,
                fspath,
                originalTags,
                newTags
            };

            if (hasNewTag) {
                result.mergedDocuments.push(change);
            } else {
                result.modifiedDocuments.push(change);
            }

            // If not dry run, write the file
            if (!options.dryRun) {
                parsed.data.tags = newTags;
                const newContent = matter.stringify(parsed.content, parsed.data);
                await fsp.writeFile(fspath, newContent, 'utf-8');
            }
        } catch (err) {
            result.errors.push({
                vpath,
                fspath: '',
                error: err instanceof Error ? err.message : String(err)
            });
        }
    }

    return result;
}
