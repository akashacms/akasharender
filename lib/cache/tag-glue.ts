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

import util from 'node:util';
import path from 'node:path';
import { promises as fsp } from 'node:fs';

import { AsyncDatabase } from '../async-node-sqlite.js';

import SqlString from 'sqlstring-sqlite';
import { distance as levenshtein } from 'fastest-levenshtein';
import pluralize from 'pluralize';

import type {
    SimilarTagGroup,
    SimilarityReason,
    TagWithoutDescription
} from '../types.js';

// function to initialize a TAGGLUE database table

const createTableTagglue = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'create-table-tagglue.sql'
    ),
    'utf-8'
);

const insertTagglue = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'insert-tagglue.sql'
    ),
    'utf-8'
);

const deleteTagglue = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'delete-tagglue.sql'
    ),
    'utf-8'
);

const selectAllTags = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'select-all-tags.sql'
    ),
    'utf-8'
);

const selectVpathForTag = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'select-vpath-for-tag.sql'
    ),
    'utf-8'
);

const selectAllTagsWithDocs = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'select-all-tags-with-docs.sql'
    ),
    'utf-8'
);

const selectTagsWithoutDescriptions = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'select-tags-without-descriptions.sql'
    ),
    'utf-8'
);

export class TagGlue {
    #db: AsyncDatabase;

    get db(): AsyncDatabase { return this.#db; }

    async init(db: AsyncDatabase) {
        this.#db = db;

        // console.log(`
        // CREATE TABLE IF NOT EXISTS
        // TAGGLUE (
        //     docvpath STRING,
        //     tagName STRING
        // );
        // CREATE INDEX IF NOT EXISTS 
        //     tagglue_vpath on TAGGLUE (docvpath);
        // CREATE INDEX IF NOT EXISTS
        //     tagglue_name  on TAGGLUE (tagName);
        // CREATE UNIQUE INDEX IF NOT EXISTS
        //     tagglue_tuple ON TAGGLUE (docvpath, tagName);
        //     `)
        await this.db.run(await createTableTagglue);
    }

    async addTagGlue(vpath: string, tags: string[]) {
        for (const tag of tags) {
            // console.log(`
            // INSERT INTO TAGGLUE (
            //     docvpath, tagName
            // )
            // VALUES (
            //     ${vpath}, ${tag}
            // )
            // `)
            await this.db.run(await insertTagglue, {
                $vpath: vpath,
                $tag: tag
            });
        }
    }

    async deleteTagGlue(vpath: string) {
        try {
            await this.db.run(
                await deleteTagglue, {
                    $vpath: vpath,
                }
            );
        } catch (err) {
        }
    }

    async tags(): Promise<string[]> {
        const rows = <{
            tag: string
        }[]> await this.db.all(await selectAllTags);
        return rows.map((item) => {
            return item.tag;
        });
    }

    async pathsForTag(tagName: string | string[])
        : Promise<string[]>
    {
        let rows;
        if (typeof tagName === 'string') {
            rows = <{
                vpath: string
            }[]> await this.db.all(
                await selectVpathForTag, {
                    $tag: tagName
                });
        } else {

            let tagstring = ` (
                ${SqlString.escape(tagName)}
            )`;

            // console.log(tagstring);
            // console.log(`
            //     SELECT DISTINCT docvpath AS vpath
            //     FROM TAGGLUE
            //     WHERE tagName IN ${tagstring}
            //     `)

            rows = <{
                vpath: string
            }[]> await this.db.all(`
                SELECT DISTINCT docvpath AS vpath
                FROM TAGGLUE
                WHERE tagName IN ${tagstring}
                `);
        }
        // console.log(`pathsForTag ${util.inspect(tagName)}`);
        return rows.map(item => {
            return item.vpath;
        });
    }

    /**
     * Find groups of similar tags based on case-insensitive matching,
     * plural/singular variants, and Levenshtein distance.
     * 
     * @param threshold - Maximum Levenshtein distance to consider tags similar (default: 2)
     * @returns Array of SimilarTagGroup objects, each containing similar tags and their documents
     */
    async findSimilarTags(threshold: number = 2): Promise<SimilarTagGroup[]> {
        // Get all tags with their documents
        const rows = <{
            tagName: string;
            docvpath: string;
        }[]> await this.db.all(selectAllTagsWithDocs);

        // Build a map of tag -> documents
        const tagDocs = new Map<string, string[]>();
        for (const row of rows) {
            if (!tagDocs.has(row.tagName)) {
                tagDocs.set(row.tagName, []);
            }
            tagDocs.get(row.tagName)!.push(row.docvpath);
        }

        const allTags = Array.from(tagDocs.keys());
        const processed = new Set<string>();
        const groups: SimilarTagGroup[] = [];

        for (let i = 0; i < allTags.length; i++) {
            const tag1 = allTags[i];
            if (processed.has(tag1)) continue;

            const similarTags: string[] = [tag1];
            const reasons = new Set<SimilarityReason>();

            for (let j = i + 1; j < allTags.length; j++) {
                const tag2 = allTags[j];
                if (processed.has(tag2)) continue;

                const tagReasons = this.#checkSimilarity(tag1, tag2, threshold);
                if (tagReasons.length > 0) {
                    similarTags.push(tag2);
                    tagReasons.forEach(r => reasons.add(r));
                }
            }

            // Only create a group if there are multiple similar tags
            if (similarTags.length > 1) {
                const documentsByTag: Record<string, string[]> = {};
                for (const tag of similarTags) {
                    documentsByTag[tag] = tagDocs.get(tag) || [];
                    processed.add(tag);
                }

                groups.push({
                    tags: similarTags,
                    reasons: Array.from(reasons),
                    documentsByTag
                });
            }
        }

        return groups;
    }

    /**
     * Check if two tags are similar and return the reasons why.
     */
    #checkSimilarity(tag1: string, tag2: string, threshold: number): SimilarityReason[] {
        const reasons: SimilarityReason[] = [];

        // Case-insensitive match
        if (tag1.toLowerCase() === tag2.toLowerCase()) {
            reasons.push('case-insensitive');
        }

        // Plural/singular match
        const singular1 = pluralize.singular(tag1.toLowerCase());
        const singular2 = pluralize.singular(tag2.toLowerCase());
        if (singular1 === singular2 && tag1.toLowerCase() !== tag2.toLowerCase()) {
            reasons.push('plural-singular');
        }

        // Levenshtein distance (only check if not already matched by other criteria)
        if (reasons.length === 0) {
            const dist = levenshtein(tag1.toLowerCase(), tag2.toLowerCase());
            if (dist > 0 && dist <= threshold) {
                reasons.push('levenshtein');
            }
        }

        return reasons;
    }

    /**
     * Find tags that have no description in the TAGDESCRIPTION table.
     * 
     * @returns Array of TagWithoutDescription objects
     */
    async tagsWithoutDescriptions(): Promise<TagWithoutDescription[]> {
        const rows = <{
            tagName: string;
            docvpath: string;
        }[]> await this.db.all(selectTagsWithoutDescriptions);

        // Group by tagName
        const tagDocs = new Map<string, string[]>();
        for (const row of rows) {
            if (!tagDocs.has(row.tagName)) {
                tagDocs.set(row.tagName, []);
            }
            tagDocs.get(row.tagName)!.push(row.docvpath);
        }

        const result: TagWithoutDescription[] = [];
        for (const [tagName, documents] of tagDocs) {
            result.push({ tagName, documents });
        }

        return result;
    }

}

const createTableTagDescription = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'create-table-tag-description.sql'
    ),
    'utf-8'
);

const insertTagDescription = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'insert-tag-description.sql'
    ),
    'utf-8'
);

const deleteTagDescription = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'delete-tag-description.sql'
    ),
    'utf-8'
);

const selectTagDescription = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'select-tag-description.sql'
    ),
    'utf-8'
);

const selectUnusedDescriptions = await fsp.readFile(
    path.join(import.meta.dirname, 'sql',
        'select-unused-descriptions.sql'
    ),
    'utf-8'
);

export class TagDescriptions {

    #db: AsyncDatabase;

    get db(): AsyncDatabase { return this.#db; }

    async init(db: AsyncDatabase) {
        // console.log(`TagDescriptions 
        // CREATE TABLE IF NOT EXISTS
        // TAGDESCRIPTION (
        //     tagName STRING UNIQUE,
        //     description STRING
        // );
        // CREATE UNIQUE INDEX IF NOT EXISTS
        //     tagdesc_name  on TAGDESCRIPTION (tagName);`)
        this.#db = db;

        await this.db.run(
            await createTableTagDescription
        );
    }

    async addDesc(tag: string, description: string) {
        // console.log(`TagDescriptions addDesc ${tag} ${description}`);
        await this.db.run(
            await insertTagDescription, {
            $tag: tag,
            $desc: description
        });
    }

    async deleteDesc(tag: string) {
        // console.log(`TagDescriptions deleteDesc ${tag}`);
        try {
            await this.db.run(
                await deleteTagDescription, {
                    $tag: tag
                }
            );
        } catch (err) {
        }
    }

    async getDesc(
        tag: string
    ): Promise<string | undefined> {

        // console.log(`TagDescriptions getDesc ${tag}`);
        const rows = <{
            description: string
        }[]> await this.db.all(
            await selectTagDescription, {
                $tag: tag
            });
        if (rows.length <= 0) {
            // throw new Error(`No tag information found for ${util.inspect(tag)}`);
            return undefined;
        }
        if (rows.length > 1) {
            throw new Error(`UNEXPECTED CONDITION more than one tag entry for ${util.inspect(tag)}`);
        }
        return (rows[0].description === null
            || typeof rows[0].description === 'undefined'
        )
            ? undefined
            : rows[0].description;
    }

    /**
     * Find tag descriptions that are defined but not used by any document.
     * 
     * @returns Array of tag names that have descriptions but no documents use them
     */
    async unusedTagDescriptions(): Promise<string[]> {
        const rows = <{
            tagName: string;
        }[]> await this.db.all(selectUnusedDescriptions);

        return rows.map(row => row.tagName);
    }
}
