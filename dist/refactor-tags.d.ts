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
import type { RefactorTagResult } from './types.js';
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
export declare function refactorTag(config: Configuration, oldTag: string, newTag: string, options: RefactorOptions): Promise<RefactorTagResult>;
//# sourceMappingURL=refactor-tags.d.ts.map