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

import { AsyncDatabase } from 'promised-sqlite3';

import SqlString from 'sqlstring-sqlite';

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
}
