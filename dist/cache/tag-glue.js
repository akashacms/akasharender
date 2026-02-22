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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _TagGlue_instances, _TagGlue_db, _TagGlue_checkSimilarity, _TagDescriptions_db;
import util from 'node:util';
import path from 'node:path';
import { promises as fsp } from 'node:fs';
import SqlString from 'sqlstring-sqlite';
import { distance as levenshtein } from 'fastest-levenshtein';
import pluralize from 'pluralize';
// function to initialize a TAGGLUE database table
const createTableTagglue = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'create-table-tagglue.sql'), 'utf-8');
const insertTagglue = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-tagglue.sql'), 'utf-8');
const deleteTagglue = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'delete-tagglue.sql'), 'utf-8');
const selectAllTags = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'select-all-tags.sql'), 'utf-8');
const selectVpathForTag = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'select-vpath-for-tag.sql'), 'utf-8');
const selectAllTagsWithDocs = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'select-all-tags-with-docs.sql'), 'utf-8');
const selectTagsWithoutDescriptions = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'select-tags-without-descriptions.sql'), 'utf-8');
export class TagGlue {
    constructor() {
        _TagGlue_instances.add(this);
        _TagGlue_db.set(this, void 0);
    }
    get db() { return __classPrivateFieldGet(this, _TagGlue_db, "f"); }
    async init(db) {
        __classPrivateFieldSet(this, _TagGlue_db, db, "f");
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
    async addTagGlue(vpath, tags) {
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
    async deleteTagGlue(vpath) {
        try {
            await this.db.run(await deleteTagglue, {
                $vpath: vpath,
            });
        }
        catch (err) {
        }
    }
    async tags() {
        const rows = await this.db.all(await selectAllTags);
        return rows.map((item) => {
            return item.tag;
        });
    }
    async pathsForTag(tagName) {
        let rows;
        if (typeof tagName === 'string') {
            rows = await this.db.all(await selectVpathForTag, {
                $tag: tagName
            });
        }
        else {
            let tagstring = ` (
                ${SqlString.escape(tagName)}
            )`;
            // console.log(tagstring);
            // console.log(`
            //     SELECT DISTINCT docvpath AS vpath
            //     FROM TAGGLUE
            //     WHERE tagName IN ${tagstring}
            //     `)
            rows = await this.db.all(`
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
    async findSimilarTags(threshold = 2) {
        // Get all tags with their documents
        const rows = await this.db.all(selectAllTagsWithDocs);
        // Build a map of tag -> documents
        const tagDocs = new Map();
        for (const row of rows) {
            if (!tagDocs.has(row.tagName)) {
                tagDocs.set(row.tagName, []);
            }
            tagDocs.get(row.tagName).push(row.docvpath);
        }
        const allTags = Array.from(tagDocs.keys());
        const processed = new Set();
        const groups = [];
        for (let i = 0; i < allTags.length; i++) {
            const tag1 = allTags[i];
            if (processed.has(tag1))
                continue;
            const similarTags = [tag1];
            const reasons = new Set();
            for (let j = i + 1; j < allTags.length; j++) {
                const tag2 = allTags[j];
                if (processed.has(tag2))
                    continue;
                const tagReasons = __classPrivateFieldGet(this, _TagGlue_instances, "m", _TagGlue_checkSimilarity).call(this, tag1, tag2, threshold);
                if (tagReasons.length > 0) {
                    similarTags.push(tag2);
                    tagReasons.forEach(r => reasons.add(r));
                }
            }
            // Only create a group if there are multiple similar tags
            if (similarTags.length > 1) {
                const documentsByTag = {};
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
     * Find tags that have no description in the TAGDESCRIPTION table.
     *
     * @returns Array of TagWithoutDescription objects
     */
    async tagsWithoutDescriptions() {
        const rows = await this.db.all(selectTagsWithoutDescriptions);
        // Group by tagName
        const tagDocs = new Map();
        for (const row of rows) {
            if (!tagDocs.has(row.tagName)) {
                tagDocs.set(row.tagName, []);
            }
            tagDocs.get(row.tagName).push(row.docvpath);
        }
        const result = [];
        for (const [tagName, documents] of tagDocs) {
            result.push({ tagName, documents });
        }
        return result;
    }
}
_TagGlue_db = new WeakMap(), _TagGlue_instances = new WeakSet(), _TagGlue_checkSimilarity = function _TagGlue_checkSimilarity(tag1, tag2, threshold) {
    const reasons = [];
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
};
const createTableTagDescription = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'create-table-tag-description.sql'), 'utf-8');
const insertTagDescription = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-tag-description.sql'), 'utf-8');
const deleteTagDescription = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'delete-tag-description.sql'), 'utf-8');
const selectTagDescription = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'select-tag-description.sql'), 'utf-8');
const selectUnusedDescriptions = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'select-unused-descriptions.sql'), 'utf-8');
export class TagDescriptions {
    constructor() {
        _TagDescriptions_db.set(this, void 0);
    }
    get db() { return __classPrivateFieldGet(this, _TagDescriptions_db, "f"); }
    async init(db) {
        // console.log(`TagDescriptions 
        // CREATE TABLE IF NOT EXISTS
        // TAGDESCRIPTION (
        //     tagName STRING UNIQUE,
        //     description STRING
        // );
        // CREATE UNIQUE INDEX IF NOT EXISTS
        //     tagdesc_name  on TAGDESCRIPTION (tagName);`)
        __classPrivateFieldSet(this, _TagDescriptions_db, db, "f");
        await this.db.run(await createTableTagDescription);
    }
    async addDesc(tag, description) {
        // console.log(`TagDescriptions addDesc ${tag} ${description}`);
        await this.db.run(await insertTagDescription, {
            $tag: tag,
            $desc: description
        });
    }
    async deleteDesc(tag) {
        // console.log(`TagDescriptions deleteDesc ${tag}`);
        try {
            await this.db.run(await deleteTagDescription, {
                $tag: tag
            });
        }
        catch (err) {
        }
    }
    async getDesc(tag) {
        // console.log(`TagDescriptions getDesc ${tag}`);
        const rows = await this.db.all(await selectTagDescription, {
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
            || typeof rows[0].description === 'undefined')
            ? undefined
            : rows[0].description;
    }
    /**
     * Find tag descriptions that are defined but not used by any document.
     *
     * @returns Array of tag names that have descriptions but no documents use them
     */
    async unusedTagDescriptions() {
        const rows = await this.db.all(selectUnusedDescriptions);
        return rows.map(row => row.tagName);
    }
}
_TagDescriptions_db = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLWdsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvdGFnLWdsdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEVBQUUsUUFBUSxJQUFJLEdBQUcsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUkxQyxPQUFPLFNBQVMsTUFBTSxrQkFBa0IsQ0FBQztBQUN6QyxPQUFPLEVBQUUsUUFBUSxJQUFJLFdBQVcsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQzlELE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQVFsQyxrREFBa0Q7QUFFbEQsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUNoQywwQkFBMEIsQ0FDN0IsRUFDRCxPQUFPLENBQ1YsQ0FBQztBQUVGLE1BQU0sYUFBYSxHQUFHLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQ2hDLG9CQUFvQixDQUN2QixFQUNELE9BQU8sQ0FDVixDQUFDO0FBRUYsTUFBTSxhQUFhLEdBQUcsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssRUFDaEMsb0JBQW9CLENBQ3ZCLEVBQ0QsT0FBTyxDQUNWLENBQUM7QUFFRixNQUFNLGFBQWEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUks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LENBQUMsRUFBRSxDQUFDLENBQUM7UUFDN0YsQ0FBQztRQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxLQUFLLElBQUk7ZUFDN0IsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxLQUFLLFdBQVcsQ0FDaEQ7WUFDRyxDQUFDLENBQUMsU0FBUztZQUNYLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO0lBQzlCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLHFCQUFxQjtRQUN2QixNQUFNLElBQUksR0FFTCxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFFakQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuXG5pbXBvcnQgeyBBc3luY0RhdGFiYXNlIH0gZnJvbSAncHJvbWlzZWQtc3FsaXRlMyc7XG5cbmltcG9ydCBTcWxTdHJpbmcgZnJvbSAnc3Fsc3RyaW5nLXNxbGl0ZSc7XG5pbXBvcnQgeyBkaXN0YW5jZSBhcyBsZXZlbnNodGVpbiB9IGZyb20gJ2Zhc3Rlc3QtbGV2ZW5zaHRlaW4nO1xuaW1wb3J0IHBsdXJhbGl6ZSBmcm9tICdwbHVyYWxpemUnO1xuXG5pbXBvcnQgdHlwZSB7XG4gICAgU2ltaWxhclRhZ0dyb3VwLFxuICAgIFNpbWlsYXJpdHlSZWFzb24sXG4gICAgVGFnV2l0aG91dERlc2NyaXB0aW9uXG59IGZyb20gJy4uL3R5cGVzLmpzJztcblxuLy8gZnVuY3Rpb24gdG8gaW5pdGlhbGl6ZSBhIFRBR0dMVUUgZGF0YWJhc2UgdGFibGVcblxuY29uc3QgY3JlYXRlVGFibGVUYWdnbHVlID0gYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLCAnc3FsJyxcbiAgICAgICAgJ2NyZWF0ZS10YWJsZS10YWdnbHVlLnNxbCdcbiAgICApLFxuICAgICd1dGYtOCdcbik7XG5cbmNvbnN0IGluc2VydFRhZ2dsdWUgPSBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLFxuICAgICAgICAnaW5zZXJ0LXRhZ2dsdWUuc3FsJ1xuICAgICksXG4gICAgJ3V0Zi04J1xuKTtcblxuY29uc3QgZGVsZXRlVGFnZ2x1ZSA9IGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgJ3NxbCcsXG4gICAgICAgICdkZWxldGUtdGFnZ2x1ZS5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5jb25zdCBzZWxlY3RBbGxUYWdzID0gYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLCAnc3FsJyxcbiAgICAgICAgJ3NlbGVjdC1hbGwtdGFncy5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5jb25zdCBzZWxlY3RWcGF0aEZvclRhZyA9IGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgJ3NxbCcsXG4gICAgICAgICdzZWxlY3QtdnBhdGgtZm9yLXRhZy5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5jb25zdCBzZWxlY3RBbGxUYWdzV2l0aERvY3MgPSBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLFxuICAgICAgICAnc2VsZWN0LWFsbC10YWdzLXdpdGgtZG9jcy5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5jb25zdCBzZWxlY3RUYWdzV2l0aG91dERlc2NyaXB0aW9ucyA9IGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgJ3NxbCcsXG4gICAgICAgICdzZWxlY3QtdGFncy13aXRob3V0LWRlc2NyaXB0aW9ucy5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5leHBvcnQgY2xhc3MgVGFnR2x1ZSB7XG4gICAgI2RiOiBBc3luY0RhdGFiYXNlO1xuXG4gICAgZ2V0IGRiKCk6IEFzeW5jRGF0YWJhc2UgeyByZXR1cm4gdGhpcy4jZGI7IH1cblxuICAgIGFzeW5jIGluaXQoZGI6IEFzeW5jRGF0YWJhc2UpIHtcbiAgICAgICAgdGhpcy4jZGIgPSBkYjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgXG4gICAgICAgIC8vIENSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTXG4gICAgICAgIC8vIFRBR0dMVUUgKFxuICAgICAgICAvLyAgICAgZG9jdnBhdGggU1RSSU5HLFxuICAgICAgICAvLyAgICAgdGFnTmFtZSBTVFJJTkdcbiAgICAgICAgLy8gKTtcbiAgICAgICAgLy8gQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFMgXG4gICAgICAgIC8vICAgICB0YWdnbHVlX3ZwYXRoIG9uIFRBR0dMVUUgKGRvY3ZwYXRoKTtcbiAgICAgICAgLy8gQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFNcbiAgICAgICAgLy8gICAgIHRhZ2dsdWVfbmFtZSAgb24gVEFHR0xVRSAodGFnTmFtZSk7XG4gICAgICAgIC8vIENSRUFURSBVTklRVUUgSU5ERVggSUYgTk9UIEVYSVNUU1xuICAgICAgICAvLyAgICAgdGFnZ2x1ZV90dXBsZSBPTiBUQUdHTFVFIChkb2N2cGF0aCwgdGFnTmFtZSk7XG4gICAgICAgIC8vICAgICBgKVxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bihhd2FpdCBjcmVhdGVUYWJsZVRhZ2dsdWUpO1xuICAgIH1cblxuICAgIGFzeW5jIGFkZFRhZ0dsdWUodnBhdGg6IHN0cmluZywgdGFnczogc3RyaW5nW10pIHtcbiAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgdGFncykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFxuICAgICAgICAgICAgLy8gSU5TRVJUIElOVE8gVEFHR0xVRSAoXG4gICAgICAgICAgICAvLyAgICAgZG9jdnBhdGgsIHRhZ05hbWVcbiAgICAgICAgICAgIC8vIClcbiAgICAgICAgICAgIC8vIFZBTFVFUyAoXG4gICAgICAgICAgICAvLyAgICAgJHt2cGF0aH0sICR7dGFnfVxuICAgICAgICAgICAgLy8gKVxuICAgICAgICAgICAgLy8gYClcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKGF3YWl0IGluc2VydFRhZ2dsdWUsIHtcbiAgICAgICAgICAgICAgICAkdnBhdGg6IHZwYXRoLFxuICAgICAgICAgICAgICAgICR0YWc6IHRhZ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBkZWxldGVUYWdHbHVlKHZwYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKFxuICAgICAgICAgICAgICAgIGF3YWl0IGRlbGV0ZVRhZ2dsdWUsIHtcbiAgICAgICAgICAgICAgICAgICAgJHZwYXRoOiB2cGF0aCxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHRhZ3MoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgICBjb25zdCByb3dzID0gPHtcbiAgICAgICAgICAgIHRhZzogc3RyaW5nXG4gICAgICAgIH1bXT4gYXdhaXQgdGhpcy5kYi5hbGwoYXdhaXQgc2VsZWN0QWxsVGFncyk7XG4gICAgICAgIHJldHVybiByb3dzLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udGFnO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBwYXRoc0ZvclRhZyh0YWdOYW1lOiBzdHJpbmcgfCBzdHJpbmdbXSlcbiAgICAgICAgOiBQcm9taXNlPHN0cmluZ1tdPlxuICAgIHtcbiAgICAgICAgbGV0IHJvd3M7XG4gICAgICAgIGlmICh0eXBlb2YgdGFnTmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvd3MgPSA8e1xuICAgICAgICAgICAgICAgIHZwYXRoOiBzdHJpbmdcbiAgICAgICAgICAgIH1bXT4gYXdhaXQgdGhpcy5kYi5hbGwoXG4gICAgICAgICAgICAgICAgYXdhaXQgc2VsZWN0VnBhdGhGb3JUYWcsIHtcbiAgICAgICAgICAgICAgICAgICAgJHRhZzogdGFnTmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsZXQgdGFnc3RyaW5nID0gYCAoXG4gICAgICAgICAgICAgICAgJHtTcWxTdHJpbmcuZXNjYXBlKHRhZ05hbWUpfVxuICAgICAgICAgICAgKWA7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRhZ3N0cmluZyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgXG4gICAgICAgICAgICAvLyAgICAgU0VMRUNUIERJU1RJTkNUIGRvY3ZwYXRoIEFTIHZwYXRoXG4gICAgICAgICAgICAvLyAgICAgRlJPTSBUQUdHTFVFXG4gICAgICAgICAgICAvLyAgICAgV0hFUkUgdGFnTmFtZSBJTiAke3RhZ3N0cmluZ31cbiAgICAgICAgICAgIC8vICAgICBgKVxuXG4gICAgICAgICAgICByb3dzID0gPHtcbiAgICAgICAgICAgICAgICB2cGF0aDogc3RyaW5nXG4gICAgICAgICAgICB9W10+IGF3YWl0IHRoaXMuZGIuYWxsKGBcbiAgICAgICAgICAgICAgICBTRUxFQ1QgRElTVElOQ1QgZG9jdnBhdGggQVMgdnBhdGhcbiAgICAgICAgICAgICAgICBGUk9NIFRBR0dMVUVcbiAgICAgICAgICAgICAgICBXSEVSRSB0YWdOYW1lIElOICR7dGFnc3RyaW5nfVxuICAgICAgICAgICAgICAgIGApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXRoc0ZvclRhZyAke3V0aWwuaW5zcGVjdCh0YWdOYW1lKX1gKTtcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udnBhdGg7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgZ3JvdXBzIG9mIHNpbWlsYXIgdGFncyBiYXNlZCBvbiBjYXNlLWluc2Vuc2l0aXZlIG1hdGNoaW5nLFxuICAgICAqIHBsdXJhbC9zaW5ndWxhciB2YXJpYW50cywgYW5kIExldmVuc2h0ZWluIGRpc3RhbmNlLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB0aHJlc2hvbGQgLSBNYXhpbXVtIExldmVuc2h0ZWluIGRpc3RhbmNlIHRvIGNvbnNpZGVyIHRhZ3Mgc2ltaWxhciAoZGVmYXVsdDogMilcbiAgICAgKiBAcmV0dXJucyBBcnJheSBvZiBTaW1pbGFyVGFnR3JvdXAgb2JqZWN0cywgZWFjaCBjb250YWluaW5nIHNpbWlsYXIgdGFncyBhbmQgdGhlaXIgZG9jdW1lbnRzXG4gICAgICovXG4gICAgYXN5bmMgZmluZFNpbWlsYXJUYWdzKHRocmVzaG9sZDogbnVtYmVyID0gMik6IFByb21pc2U8U2ltaWxhclRhZ0dyb3VwW10+IHtcbiAgICAgICAgLy8gR2V0IGFsbCB0YWdzIHdpdGggdGhlaXIgZG9jdW1lbnRzXG4gICAgICAgIGNvbnN0IHJvd3MgPSA8e1xuICAgICAgICAgICAgdGFnTmFtZTogc3RyaW5nO1xuICAgICAgICAgICAgZG9jdnBhdGg6IHN0cmluZztcbiAgICAgICAgfVtdPiBhd2FpdCB0aGlzLmRiLmFsbChzZWxlY3RBbGxUYWdzV2l0aERvY3MpO1xuXG4gICAgICAgIC8vIEJ1aWxkIGEgbWFwIG9mIHRhZyAtPiBkb2N1bWVudHNcbiAgICAgICAgY29uc3QgdGFnRG9jcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXT4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgaWYgKCF0YWdEb2NzLmhhcyhyb3cudGFnTmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0YWdEb2NzLnNldChyb3cudGFnTmFtZSwgW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFnRG9jcy5nZXQocm93LnRhZ05hbWUpIS5wdXNoKHJvdy5kb2N2cGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhbGxUYWdzID0gQXJyYXkuZnJvbSh0YWdEb2NzLmtleXMoKSk7XG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBjb25zdCBncm91cHM6IFNpbWlsYXJUYWdHcm91cFtdID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbGxUYWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB0YWcxID0gYWxsVGFnc1tpXTtcbiAgICAgICAgICAgIGlmIChwcm9jZXNzZWQuaGFzKHRhZzEpKSBjb250aW51ZTtcblxuICAgICAgICAgICAgY29uc3Qgc2ltaWxhclRhZ3M6IHN0cmluZ1tdID0gW3RhZzFdO1xuICAgICAgICAgICAgY29uc3QgcmVhc29ucyA9IG5ldyBTZXQ8U2ltaWxhcml0eVJlYXNvbj4oKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgYWxsVGFncy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhZzIgPSBhbGxUYWdzW2pdO1xuICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWQuaGFzKHRhZzIpKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHRhZ1JlYXNvbnMgPSB0aGlzLiNjaGVja1NpbWlsYXJpdHkodGFnMSwgdGFnMiwgdGhyZXNob2xkKTtcbiAgICAgICAgICAgICAgICBpZiAodGFnUmVhc29ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpbWlsYXJUYWdzLnB1c2godGFnMik7XG4gICAgICAgICAgICAgICAgICAgIHRhZ1JlYXNvbnMuZm9yRWFjaChyID0+IHJlYXNvbnMuYWRkKHIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE9ubHkgY3JlYXRlIGEgZ3JvdXAgaWYgdGhlcmUgYXJlIG11bHRpcGxlIHNpbWlsYXIgdGFnc1xuICAgICAgICAgICAgaWYgKHNpbWlsYXJUYWdzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb2N1bWVudHNCeVRhZzogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge307XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB0YWcgb2Ygc2ltaWxhclRhZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnRzQnlUYWdbdGFnXSA9IHRhZ0RvY3MuZ2V0KHRhZykgfHwgW107XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NlZC5hZGQodGFnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBncm91cHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHRhZ3M6IHNpbWlsYXJUYWdzLFxuICAgICAgICAgICAgICAgICAgICByZWFzb25zOiBBcnJheS5mcm9tKHJlYXNvbnMpLFxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudHNCeVRhZ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0d28gdGFncyBhcmUgc2ltaWxhciBhbmQgcmV0dXJuIHRoZSByZWFzb25zIHdoeS5cbiAgICAgKi9cbiAgICAjY2hlY2tTaW1pbGFyaXR5KHRhZzE6IHN0cmluZywgdGFnMjogc3RyaW5nLCB0aHJlc2hvbGQ6IG51bWJlcik6IFNpbWlsYXJpdHlSZWFzb25bXSB7XG4gICAgICAgIGNvbnN0IHJlYXNvbnM6IFNpbWlsYXJpdHlSZWFzb25bXSA9IFtdO1xuXG4gICAgICAgIC8vIENhc2UtaW5zZW5zaXRpdmUgbWF0Y2hcbiAgICAgICAgaWYgKHRhZzEudG9Mb3dlckNhc2UoKSA9PT0gdGFnMi50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZWFzb25zLnB1c2goJ2Nhc2UtaW5zZW5zaXRpdmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBsdXJhbC9zaW5ndWxhciBtYXRjaFxuICAgICAgICBjb25zdCBzaW5ndWxhcjEgPSBwbHVyYWxpemUuc2luZ3VsYXIodGFnMS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgY29uc3Qgc2luZ3VsYXIyID0gcGx1cmFsaXplLnNpbmd1bGFyKHRhZzIudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIGlmIChzaW5ndWxhcjEgPT09IHNpbmd1bGFyMiAmJiB0YWcxLnRvTG93ZXJDYXNlKCkgIT09IHRhZzIudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmVhc29ucy5wdXNoKCdwbHVyYWwtc2luZ3VsYXInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExldmVuc2h0ZWluIGRpc3RhbmNlIChvbmx5IGNoZWNrIGlmIG5vdCBhbHJlYWR5IG1hdGNoZWQgYnkgb3RoZXIgY3JpdGVyaWEpXG4gICAgICAgIGlmIChyZWFzb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3QgZGlzdCA9IGxldmVuc2h0ZWluKHRhZzEudG9Mb3dlckNhc2UoKSwgdGFnMi50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgICAgIGlmIChkaXN0ID4gMCAmJiBkaXN0IDw9IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIHJlYXNvbnMucHVzaCgnbGV2ZW5zaHRlaW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZWFzb25zO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGFncyB0aGF0IGhhdmUgbm8gZGVzY3JpcHRpb24gaW4gdGhlIFRBR0RFU0NSSVBUSU9OIHRhYmxlLlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIFRhZ1dpdGhvdXREZXNjcmlwdGlvbiBvYmplY3RzXG4gICAgICovXG4gICAgYXN5bmMgdGFnc1dpdGhvdXREZXNjcmlwdGlvbnMoKTogUHJvbWlzZTxUYWdXaXRob3V0RGVzY3JpcHRpb25bXT4ge1xuICAgICAgICBjb25zdCByb3dzID0gPHtcbiAgICAgICAgICAgIHRhZ05hbWU6IHN0cmluZztcbiAgICAgICAgICAgIGRvY3ZwYXRoOiBzdHJpbmc7XG4gICAgICAgIH1bXT4gYXdhaXQgdGhpcy5kYi5hbGwoc2VsZWN0VGFnc1dpdGhvdXREZXNjcmlwdGlvbnMpO1xuXG4gICAgICAgIC8vIEdyb3VwIGJ5IHRhZ05hbWVcbiAgICAgICAgY29uc3QgdGFnRG9jcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXT4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgaWYgKCF0YWdEb2NzLmhhcyhyb3cudGFnTmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0YWdEb2NzLnNldChyb3cudGFnTmFtZSwgW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFnRG9jcy5nZXQocm93LnRhZ05hbWUpIS5wdXNoKHJvdy5kb2N2cGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXN1bHQ6IFRhZ1dpdGhvdXREZXNjcmlwdGlvbltdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgW3RhZ05hbWUsIGRvY3VtZW50c10gb2YgdGFnRG9jcykge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goeyB0YWdOYW1lLCBkb2N1bWVudHMgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxufVxuXG5jb25zdCBjcmVhdGVUYWJsZVRhZ0Rlc2NyaXB0aW9uID0gYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLCAnc3FsJyxcbiAgICAgICAgJ2NyZWF0ZS10YWJsZS10YWctZGVzY3JpcHRpb24uc3FsJ1xuICAgICksXG4gICAgJ3V0Zi04J1xuKTtcblxuY29uc3QgaW5zZXJ0VGFnRGVzY3JpcHRpb24gPSBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLFxuICAgICAgICAnaW5zZXJ0LXRhZy1kZXNjcmlwdGlvbi5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5jb25zdCBkZWxldGVUYWdEZXNjcmlwdGlvbiA9IGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgJ3NxbCcsXG4gICAgICAgICdkZWxldGUtdGFnLWRlc2NyaXB0aW9uLnNxbCdcbiAgICApLFxuICAgICd1dGYtOCdcbik7XG5cbmNvbnN0IHNlbGVjdFRhZ0Rlc2NyaXB0aW9uID0gYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLCAnc3FsJyxcbiAgICAgICAgJ3NlbGVjdC10YWctZGVzY3JpcHRpb24uc3FsJ1xuICAgICksXG4gICAgJ3V0Zi04J1xuKTtcblxuY29uc3Qgc2VsZWN0VW51c2VkRGVzY3JpcHRpb25zID0gYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLCAnc3FsJyxcbiAgICAgICAgJ3NlbGVjdC11bnVzZWQtZGVzY3JpcHRpb25zLnNxbCdcbiAgICApLFxuICAgICd1dGYtOCdcbik7XG5cbmV4cG9ydCBjbGFzcyBUYWdEZXNjcmlwdGlvbnMge1xuXG4gICAgI2RiOiBBc3luY0RhdGFiYXNlO1xuXG4gICAgZ2V0IGRiKCk6IEFzeW5jRGF0YWJhc2UgeyByZXR1cm4gdGhpcy4jZGI7IH1cblxuICAgIGFzeW5jIGluaXQoZGI6IEFzeW5jRGF0YWJhc2UpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFRhZ0Rlc2NyaXB0aW9ucyBcbiAgICAgICAgLy8gQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFNcbiAgICAgICAgLy8gVEFHREVTQ1JJUFRJT04gKFxuICAgICAgICAvLyAgICAgdGFnTmFtZSBTVFJJTkcgVU5JUVVFLFxuICAgICAgICAvLyAgICAgZGVzY3JpcHRpb24gU1RSSU5HXG4gICAgICAgIC8vICk7XG4gICAgICAgIC8vIENSRUFURSBVTklRVUUgSU5ERVggSUYgTk9UIEVYSVNUU1xuICAgICAgICAvLyAgICAgdGFnZGVzY19uYW1lICBvbiBUQUdERVNDUklQVElPTiAodGFnTmFtZSk7YClcbiAgICAgICAgdGhpcy4jZGIgPSBkYjtcblxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bihcbiAgICAgICAgICAgIGF3YWl0IGNyZWF0ZVRhYmxlVGFnRGVzY3JpcHRpb25cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBhc3luYyBhZGREZXNjKHRhZzogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBUYWdEZXNjcmlwdGlvbnMgYWRkRGVzYyAke3RhZ30gJHtkZXNjcmlwdGlvbn1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oXG4gICAgICAgICAgICBhd2FpdCBpbnNlcnRUYWdEZXNjcmlwdGlvbiwge1xuICAgICAgICAgICAgJHRhZzogdGFnLFxuICAgICAgICAgICAgJGRlc2M6IGRlc2NyaXB0aW9uXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGRlbGV0ZURlc2ModGFnOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFRhZ0Rlc2NyaXB0aW9ucyBkZWxldGVEZXNjICR7dGFnfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oXG4gICAgICAgICAgICAgICAgYXdhaXQgZGVsZXRlVGFnRGVzY3JpcHRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgJHRhZzogdGFnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBnZXREZXNjKFxuICAgICAgICB0YWc6IHN0cmluZ1xuICAgICk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFRhZ0Rlc2NyaXB0aW9ucyBnZXREZXNjICR7dGFnfWApO1xuICAgICAgICBjb25zdCByb3dzID0gPHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmdcbiAgICAgICAgfVtdPiBhd2FpdCB0aGlzLmRiLmFsbChcbiAgICAgICAgICAgIGF3YWl0IHNlbGVjdFRhZ0Rlc2NyaXB0aW9uLCB7XG4gICAgICAgICAgICAgICAgJHRhZzogdGFnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKHJvd3MubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgTm8gdGFnIGluZm9ybWF0aW9uIGZvdW5kIGZvciAke3V0aWwuaW5zcGVjdCh0YWcpfWApO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocm93cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVORVhQRUNURUQgQ09ORElUSU9OIG1vcmUgdGhhbiBvbmUgdGFnIGVudHJ5IGZvciAke3V0aWwuaW5zcGVjdCh0YWcpfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocm93c1swXS5kZXNjcmlwdGlvbiA9PT0gbnVsbFxuICAgICAgICAgICAgfHwgdHlwZW9mIHJvd3NbMF0uZGVzY3JpcHRpb24gPT09ICd1bmRlZmluZWQnXG4gICAgICAgIClcbiAgICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgICA6IHJvd3NbMF0uZGVzY3JpcHRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0YWcgZGVzY3JpcHRpb25zIHRoYXQgYXJlIGRlZmluZWQgYnV0IG5vdCB1c2VkIGJ5IGFueSBkb2N1bWVudC5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBBcnJheSBvZiB0YWcgbmFtZXMgdGhhdCBoYXZlIGRlc2NyaXB0aW9ucyBidXQgbm8gZG9jdW1lbnRzIHVzZSB0aGVtXG4gICAgICovXG4gICAgYXN5bmMgdW51c2VkVGFnRGVzY3JpcHRpb25zKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgY29uc3Qgcm93cyA9IDx7XG4gICAgICAgICAgICB0YWdOYW1lOiBzdHJpbmc7XG4gICAgICAgIH1bXT4gYXdhaXQgdGhpcy5kYi5hbGwoc2VsZWN0VW51c2VkRGVzY3JpcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gcm93cy5tYXAocm93ID0+IHJvdy50YWdOYW1lKTtcbiAgICB9XG59XG4iXX0=