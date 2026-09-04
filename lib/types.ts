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
import type { Document } from './cache/schema.js';

/**
 * A regular-expression match specification accepted by the
 * `pathmatch` and `renderpathmatch` fields of {@link SearchOptions}.
 *
 * A value may be:
 * - a `string` containing a regular-expression source,
 * - a `RegExp` object,
 * - or an array mixing the two, in which case a document matches when
 *   it matches any entry (the clauses are OR'd together).
 */
export type RegexMatch = string | RegExp | Array<string | RegExp>;

/**
 * Custom filter applied to each candidate {@link Document} after the
 * SQL query has run.  Return `true` to keep the document, `false` to
 * discard it.
 *
 * @param config  The active {@link Configuration}.
 * @param options The {@link SearchOptions} the search was invoked with.
 * @param doc     The document being considered.
 */
export type SearchFilterFunc = (
    config: Configuration,
    options: SearchOptions,
    doc: Document
) => boolean;

/**
 * Custom comparator used to sort the search results after the SQL
 * query has run.  Has the same contract as the callback passed to
 * `Array.prototype.sort`.
 *
 * When supplied, this runs in addition to (after) any SQL-level
 * ordering requested via {@link SearchOptions.sortBy}.
 */
export type SearchSortFunc = (a: Document, b: Document) => number;

/**
 * Options accepted by `DocumentsCache.search()` (and the other file
 * caches' `search()` methods) to select and order documents.
 *
 * Every field is optional; an empty object matches every document in
 * the cache.  Unless noted otherwise, providing multiple fields
 * narrows the result (the conditions are AND'd together).
 *
 * Most fields are translated into a single SQL query.  The
 * `renderers`, `filterfunc`, and `sortFunc` fields are applied in
 * JavaScript to the rows returned by that query.
 */
export interface SearchOptions {

    /**
     * Match documents whose MIME type equals this value, or — when an
     * array is given — is one of these values.
     */
    mime?: string | string[];

    /**
     * When `true`, match only documents that render to HTML; when
     * `false`, match only documents that do not.  When omitted, both
     * are matched.
     */
    rendersToHTML?: boolean;

    /**
     * Match documents whose rendered path begins with this prefix
     * (SQL `renderPath LIKE 'rootPath%'`).  Useful for restricting a
     * search to a subtree of the rendered site.
     */
    rootPath?: string;

    /**
     * Match documents whose parent directory (the parent of the
     * containing directory) equals this value.
     */
    parentDir?: string;

    /**
     * Match documents whose containing directory equals this value.
     */
    dirname?: string;

    /**
     * Match documents whose vpath matches this shell-style glob
     * (SQL `vpath GLOB`).
     */
    glob?: string;

    /**
     * Match documents whose rendered path matches this shell-style
     * glob (SQL `renderPath GLOB`).
     */
    renderglob?: string;

    /**
     * Exclude documents whose rendered path matches this shell-style
     * glob (SQL `renderPath NOT GLOB`).
     */
    skipglob?: string;

    /**
     * Match documents belonging to this single blog tag.
     *
     * Ignored when {@link SearchOptions.blogtags} is provided.
     */
    blogtag?: string;

    /**
     * Match documents belonging to any of these blog tags.  Used to
     * assemble a pseudo-blog from the entries of several actual blogs.
     *
     * Takes precedence over {@link SearchOptions.blogtag}.
     */
    blogtags?: string[];

    /**
     * Match documents carrying this tag, or — when an array is given —
     * any of these tags (the tag conditions are OR'd together).
     */
    tag?: string | string[];

    /**
     * Match documents rendered with one of these layouts.  A single
     * string is treated as a one-element array.
     */
    layouts?: string | string[];

    /**
     * Match documents whose vpath matches this regular expression (or
     * any of them when an array is given).  See {@link RegexMatch}.
     */
    pathmatch?: RegexMatch;

    /**
     * Match documents whose rendered path matches this regular
     * expression (or any of them when an array is given).  See
     * {@link RegexMatch}.
     */
    renderpathmatch?: RegexMatch;

    /**
     * Filter the SQL results to documents handled by one of these
     * renderers, identified by renderer name.  Applied in JavaScript
     * after the query runs.
     */
    renderers?: string[];

    /**
     * Custom predicate applied in JavaScript to each SQL result.  See
     * {@link SearchFilterFunc}.
     */
    filterfunc?: SearchFilterFunc;

    /**
     * Field to sort by.  The special values `'publicationDate'` and
     * `'publicationTime'` sort by publication time, falling back to
     * modification time when unset.  A value naming a column of the
     * documents table (such as `'title'`, `'renderPath'`, `'vpath'`, or
     * `'parentDir'`) sorts by that column.  Any other value is treated
     * as a frontmatter field name and sorted by extracting that field
     * from each document's metadata, so sort-by works for arbitrary
     * custom frontmatter fields (for example a `step` ordering field).
     */
    sortBy?: string;

    /**
     * Sort in descending order.  Equivalent in effect to
     * {@link SearchOptions.reverse}.
     */
    sortByDescending?: boolean;

    /**
     * Sort in descending order.  When set without
     * {@link SearchOptions.sortBy}, results are ordered by
     * modification time.
     */
    reverse?: boolean;

    /**
     * Custom comparator applied in JavaScript to sort the results,
     * running after any SQL-level ordering.  See {@link SearchSortFunc}.
     */
    sortFunc?: SearchSortFunc;

    /**
     * Maximum number of documents to return.
     */
    limit?: number;

    /**
     * Number of leading documents to skip.  May be used with or
     * without {@link SearchOptions.limit}.
     */
    offset?: number;

    /**
     * Fields to return.  These must be in the form of an SQL
     * snippet as used in `SELECT field_names FROM`
     */
    return_fields?: Array<string>;
}

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
export function validTagDescription(obj: unknown): obj is TagDescription {
    if (obj === null || typeof obj !== 'object') {
        return false;
    }
    const candidate = obj as Record<string, unknown>;
    return (
        typeof candidate.tagName === 'string' &&
        candidate.tagName.length > 0 &&
        typeof candidate.description === 'string'
    );
}

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
export type SimilarityReason = 
    | 'case-insensitive'
    | 'plural-singular'
    | 'levenshtein';

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
