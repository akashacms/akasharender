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
 * Represents a tag with its description.
 * Used for providing descriptions that appear on tag index pages.
 */
export interface TagDescription {
    tagName: string;
    description: string;
}
/**
 * Validates that an object conforms to the TagDescription interface.
 *
 * @param obj - The object to validate
 * @returns true if the object is a valid TagDescription, false otherwise
 */
export declare function validTagDescription(obj: unknown): obj is TagDescription;
/**
 * Represents a group of similar tags found during tag analysis.
 * Tags may be similar due to case differences, plural/singular variants,
 * or small Levenshtein distances (typos).
 */
export interface SimilarTagGroup {
    /** Array of tag names that are similar to each other */
    tags: string[];
    /** Reason(s) why these tags are considered similar */
    reasons: SimilarityReason[];
    /** Map of tag name to array of document vpaths using that tag */
    documentsByTag: Record<string, string[]>;
}
/**
 * Describes why two or more tags are considered similar.
 */
export type SimilarityReason = 'case-insensitive' | 'plural-singular' | 'levenshtein';
/**
 * Represents a tag that has no description, along with
 * the documents that use it.
 */
export interface TagWithoutDescription {
    tagName: string;
    documents: string[];
}
/**
 * Result of a tag refactoring operation.
 */
export interface RefactorTagResult {
    /** The old tag name being replaced */
    oldTag: string;
    /** The new tag name */
    newTag: string;
    /** Whether this was a dry run (no files modified) */
    dryRun: boolean;
    /** Documents that were modified (or would be modified in dry run) */
    modifiedDocuments: RefactorDocumentChange[];
    /** Documents that already had the new tag (old tag just removed) */
    mergedDocuments: RefactorDocumentChange[];
    /** Any errors encountered */
    errors: RefactorError[];
}
/**
 * Represents a change made to a single document during refactoring.
 */
export interface RefactorDocumentChange {
    /** Virtual path of the document */
    vpath: string;
    /** Filesystem path of the document */
    fspath: string;
    /** The original tags array */
    originalTags: string[];
    /** The new tags array after refactoring */
    newTags: string[];
}
/**
 * Represents an error encountered during tag refactoring.
 */
export interface RefactorError {
    vpath: string;
    fspath: string;
    error: string;
}
//# sourceMappingURL=types.d.ts.map