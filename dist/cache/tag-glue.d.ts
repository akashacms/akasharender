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
import { AsyncDatabase } from 'promised-sqlite3';
import type { SimilarTagGroup, TagWithoutDescription } from '../types.js';
export declare class TagGlue {
    #private;
    get db(): AsyncDatabase;
    init(db: AsyncDatabase): Promise<void>;
    addTagGlue(vpath: string, tags: string[]): Promise<void>;
    deleteTagGlue(vpath: string): Promise<void>;
    tags(): Promise<string[]>;
    pathsForTag(tagName: string | string[]): Promise<string[]>;
    /**
     * Find groups of similar tags based on case-insensitive matching,
     * plural/singular variants, and Levenshtein distance.
     *
     * @param threshold - Maximum Levenshtein distance to consider tags similar (default: 2)
     * @returns Array of SimilarTagGroup objects, each containing similar tags and their documents
     */
    findSimilarTags(threshold?: number): Promise<SimilarTagGroup[]>;
    /**
     * Find tags that have no description in the TAGDESCRIPTION table.
     *
     * @returns Array of TagWithoutDescription objects
     */
    tagsWithoutDescriptions(): Promise<TagWithoutDescription[]>;
}
export declare class TagDescriptions {
    #private;
    get db(): AsyncDatabase;
    init(db: AsyncDatabase): Promise<void>;
    addDesc(tag: string, description: string): Promise<void>;
    deleteDesc(tag: string): Promise<void>;
    getDesc(tag: string): Promise<string | undefined>;
    /**
     * Find tag descriptions that are defined but not used by any document.
     *
     * @returns Array of tag names that have descriptions but no documents use them
     */
    unusedTagDescriptions(): Promise<string[]>;
}
//# sourceMappingURL=tag-glue.d.ts.map