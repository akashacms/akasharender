
import util from 'node:util';
import { Database } from 'sqlite3';

// Use this.dao.sqldb to get Database instance

// function to initialize a TAGGLUE database table

export class TagGlue {
    #db: Database;

    get db(): Database { return this.#db; }

    async init(db: Database) {
        this.#db = db;

        await this.db.run(`
        CREATE TABLE IF NOT EXISTS TAGGLUE (
            docvpath STRING,
            tagName STRING
        );
        CREATE INDEX IF NOT EXISTS tagglue_vpath on TAGGLUE (vpath);
        CREATE INDEX IF NOT EXISTS tagglue_name  on TAGGLUE (tagName);
        `);
    }

    async addTagGlue(vpath: string, tags: string[]) {
        for (const tag of tags) {
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

    async deleteTagGlue(vpath) {
        try {
            await this.db.run(
                `DELETE FROM TAGGLUE WHERE docvpath = $vpath`, {
                    $vpath: vpath,
                }
            );
        } catch (err) {
        }
    }

    // TODO return value
    async tags(): Promise<string[]> {
        const rows = [];
        await new Promise((resolve, reject) => {
            this.db.each(`SELECT DISTINCT tagName AS tag FROM TAGGLUE`,
                (err, row) => {
                    if (err) reject(err);
                    rows.push(row);
                },
                (err, count) => {
                    if (err) reject(err);
                    resolve(count);
                }
            );
        });
        return rows.map((item) => {
            return item.tag;
        });
    }

    // TODO return value
    async pathsForTag(tagName: string | string[]): Promise<string[]> {
        const rows = [];
        // console.log(`pathsForTag ${util.inspect(tagName)}`);
        await new Promise((resolve, reject) => {
            if (typeof tagName === 'string') {
                this.db.each(`
                    SELECT DISTINCT docvpath AS vpath
                    FROM TAGGLUE
                    WHERE tagName = $tag
                    `, {
                        $tag: tagName
                    },
                    (err, row) => {
                        if (err) reject(err);
                        rows.push(row);
                    },
                    (err, count) => {
                        if (err) reject(err);
                        resolve(count);
                    }
                );
            } else if (Array.isArray(tagName)) {

                // Convert the array into the SQL
                // representation of the array
                // suitable for the WHERE clause below.
                
                let tagstring = ` ( ${tagName.map(t => {
                    return `'${t.indexOf("'") >= 0
                        ? t.replaceAll("'", "''")
                        : t}'`;
                }).join(',')} ) `;

                // console.log(tagstring);

                this.db.each(`
                    SELECT DISTINCT docvpath AS vpath
                    FROM TAGGLUE
                    WHERE tagName IN ${tagstring}
                    `
                    // Inserting the tagstring in the
                    // normal way did not work, and
                    // instead gave a syntax error.
                    // Using JavaScript template strings
                    // worked, instead.
                    //
                    // , {
                    //     $tags: tagstring
                    // }
                    ,
                    (err, row) => {
                        if (err) reject(err);
                        rows.push(row);
                    },
                    (err, count) => {
                        if (err) reject(err);
                        resolve(count);
                    }
                );

            }
        });
        return rows.map(item => {
            return item.vpath;
        });
    }

}

