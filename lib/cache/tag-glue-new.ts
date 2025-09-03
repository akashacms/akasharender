
import util from 'node:util';

import { AsyncDatabase } from 'promised-sqlite3';

import SqlString from 'sqlstring-sqlite';

// function to initialize a TAGGLUE database table

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
        await this.db.run(`
        CREATE TABLE IF NOT EXISTS
        TAGGLUE (
            docvpath STRING,
            tagName STRING
        );
        CREATE INDEX IF NOT EXISTS 
            tagglue_vpath on TAGGLUE (docvpath);
        CREATE INDEX IF NOT EXISTS
            tagglue_name  on TAGGLUE (tagName);
        CREATE UNIQUE INDEX IF NOT EXISTS
            tagglue_tuple ON TAGGLUE (docvpath, tagName);
        `);
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
            await this.db.run(`
            INSERT INTO TAGGLUE (
                docvpath, tagName
            )
            VALUES (
                $vpath, $tag
            )
            `, {
                $vpath: vpath,
                $tag: tag
            });
        }
    }

    async deleteTagGlue(vpath: string) {
        try {
            await this.db.run(
                `DELETE FROM TAGGLUE WHERE docvpath = $vpath`, {
                    $vpath: vpath,
                }
            );
        } catch (err) {
        }
    }

    async tags(): Promise<string[]> {
        const rows = <{
            tag: string
        }[]> await this.db.all(
            `SELECT DISTINCT tagName AS tag 
            FROM TAGGLUE`);
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
            }[]> await this.db.all(`
                SELECT DISTINCT docvpath AS vpath
                FROM TAGGLUE
                WHERE tagName = $tag
                `, {
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

        await this.db.run(`
        CREATE TABLE IF NOT EXISTS
        TAGDESCRIPTION (
            tagName STRING UNIQUE,
            description STRING
        );
        CREATE UNIQUE INDEX IF NOT EXISTS
            tagdesc_name  on TAGDESCRIPTION (tagName);
        `);
    }

    async addDesc(tag: string, description: string) {
        // console.log(`TagDescriptions addDesc ${tag} ${description}`);
        await this.db.run(`
        INSERT INTO TAGDESCRIPTION (
            tagName, description
        )
        VALUES (
            $tag, $desc
        )
        `, {
            $tag: tag,
            $desc: description
        });
    }

    async deleteDesc(tag: string) {
        // console.log(`TagDescriptions deleteDesc ${tag}`);
        try {
            await this.db.run(
                `DELETE FROM TAGDESCRIPTION
                WHERE tagName = $tag`, {
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
            `SELECT description FROM TAGDESCRIPTION
                WHERE tagName = $tag`, {
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
