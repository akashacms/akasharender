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
var _TagGlue_db, _TagDescriptions_db;
import util from 'node:util';
import path from 'node:path';
import { promises as fsp } from 'node:fs';
import SqlString from 'sqlstring-sqlite';
// function to initialize a TAGGLUE database table
const createTableTagglue = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'create-table-tagglue.sql'), 'utf-8');
const insertTagglue = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-tagglue.sql'), 'utf-8');
const deleteTagglue = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'delete-tagglue.sql'), 'utf-8');
const selectAllTags = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'select-all-tags.sql'), 'utf-8');
const selectVpathForTag = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'select-vpath-for-tag.sql'), 'utf-8');
export class TagGlue {
    constructor() {
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
}
_TagGlue_db = new WeakMap();
const createTableTagDescription = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'create-table-tag-description.sql'), 'utf-8');
const insertTagDescription = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-tag-description.sql'), 'utf-8');
const deleteTagDescription = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'delete-tag-description.sql'), 'utf-8');
const selectTagDescription = await fsp.readFile(path.join(import.meta.dirname, 'sql', 'select-tag-description.sql'), 'utf-8');
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
}
_TagDescriptions_db = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLWdsdWUtbmV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NhY2hlL3RhZy1nbHVlLW5ldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7Ozs7Ozs7Ozs7Ozs7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBSTFDLE9BQU8sU0FBUyxNQUFNLGtCQUFrQixDQUFDO0FBRXpDLGtEQUFrRDtBQUVsRCxNQUFNLGtCQUFrQixHQUFHLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FDekMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQ2hDLDBCQUEwQixDQUM3QixFQUNELE9BQU8sQ0FDVixDQUFDO0FBRUYsTUFBTSxhQUFhLEdBQUcsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssRUFDaEMsb0JBQW9CLENBQ3ZCLEVBQ0QsT0FBTyxDQUNWLENBQUM7QUFFRixNQUFNLGFBQWEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUNoQyxvQkFBb0IsQ0FDdkIsRUFDRCxPQUFPLENBQ1YsQ0FBQztBQUVGLE1BQU0sYUFBYSxHQUFHLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQ2hDLHFCQUFxQixDQUN4QixFQUNELE9BQU8sQ0FDVixDQUFDO0FBRUYsTUFBTSxpQkFBaUIs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VyxLQUFLLFdBQVcsQ0FDaEQ7WUFDRyxDQUFDLENBQUMsU0FBUztZQUNYLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO0lBQzlCLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuXG5pbXBvcnQgeyBBc3luY0RhdGFiYXNlIH0gZnJvbSAncHJvbWlzZWQtc3FsaXRlMyc7XG5cbmltcG9ydCBTcWxTdHJpbmcgZnJvbSAnc3Fsc3RyaW5nLXNxbGl0ZSc7XG5cbi8vIGZ1bmN0aW9uIHRvIGluaXRpYWxpemUgYSBUQUdHTFVFIGRhdGFiYXNlIHRhYmxlXG5cbmNvbnN0IGNyZWF0ZVRhYmxlVGFnZ2x1ZSA9IGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgJ3NxbCcsXG4gICAgICAgICdjcmVhdGUtdGFibGUtdGFnZ2x1ZS5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5jb25zdCBpbnNlcnRUYWdnbHVlID0gYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLCAnc3FsJyxcbiAgICAgICAgJ2luc2VydC10YWdnbHVlLnNxbCdcbiAgICApLFxuICAgICd1dGYtOCdcbik7XG5cbmNvbnN0IGRlbGV0ZVRhZ2dsdWUgPSBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLFxuICAgICAgICAnZGVsZXRlLXRhZ2dsdWUuc3FsJ1xuICAgICksXG4gICAgJ3V0Zi04J1xuKTtcblxuY29uc3Qgc2VsZWN0QWxsVGFncyA9IGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgJ3NxbCcsXG4gICAgICAgICdzZWxlY3QtYWxsLXRhZ3Muc3FsJ1xuICAgICksXG4gICAgJ3V0Zi04J1xuKTtcblxuY29uc3Qgc2VsZWN0VnBhdGhGb3JUYWcgPSBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLFxuICAgICAgICAnc2VsZWN0LXZwYXRoLWZvci10YWcuc3FsJ1xuICAgICksXG4gICAgJ3V0Zi04J1xuKTtcblxuZXhwb3J0IGNsYXNzIFRhZ0dsdWUge1xuICAgICNkYjogQXN5bmNEYXRhYmFzZTtcblxuICAgIGdldCBkYigpOiBBc3luY0RhdGFiYXNlIHsgcmV0dXJuIHRoaXMuI2RiOyB9XG5cbiAgICBhc3luYyBpbml0KGRiOiBBc3luY0RhdGFiYXNlKSB7XG4gICAgICAgIHRoaXMuI2RiID0gZGI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFxuICAgICAgICAvLyBDUkVBVEUgVEFCTEUgSUYgTk9UIEVYSVNUU1xuICAgICAgICAvLyBUQUdHTFVFIChcbiAgICAgICAgLy8gICAgIGRvY3ZwYXRoIFNUUklORyxcbiAgICAgICAgLy8gICAgIHRhZ05hbWUgU1RSSU5HXG4gICAgICAgIC8vICk7XG4gICAgICAgIC8vIENSRUFURSBJTkRFWCBJRiBOT1QgRVhJU1RTIFxuICAgICAgICAvLyAgICAgdGFnZ2x1ZV92cGF0aCBvbiBUQUdHTFVFIChkb2N2cGF0aCk7XG4gICAgICAgIC8vIENSRUFURSBJTkRFWCBJRiBOT1QgRVhJU1RTXG4gICAgICAgIC8vICAgICB0YWdnbHVlX25hbWUgIG9uIFRBR0dMVUUgKHRhZ05hbWUpO1xuICAgICAgICAvLyBDUkVBVEUgVU5JUVVFIElOREVYIElGIE5PVCBFWElTVFNcbiAgICAgICAgLy8gICAgIHRhZ2dsdWVfdHVwbGUgT04gVEFHR0xVRSAoZG9jdnBhdGgsIHRhZ05hbWUpO1xuICAgICAgICAvLyAgICAgYClcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYXdhaXQgY3JlYXRlVGFibGVUYWdnbHVlKTtcbiAgICB9XG5cbiAgICBhc3luYyBhZGRUYWdHbHVlKHZwYXRoOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdKSB7XG4gICAgICAgIGZvciAoY29uc3QgdGFnIG9mIHRhZ3MpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBcbiAgICAgICAgICAgIC8vIElOU0VSVCBJTlRPIFRBR0dMVUUgKFxuICAgICAgICAgICAgLy8gICAgIGRvY3ZwYXRoLCB0YWdOYW1lXG4gICAgICAgICAgICAvLyApXG4gICAgICAgICAgICAvLyBWQUxVRVMgKFxuICAgICAgICAgICAgLy8gICAgICR7dnBhdGh9LCAke3RhZ31cbiAgICAgICAgICAgIC8vIClcbiAgICAgICAgICAgIC8vIGApXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bihhd2FpdCBpbnNlcnRUYWdnbHVlLCB7XG4gICAgICAgICAgICAgICAgJHZwYXRoOiB2cGF0aCxcbiAgICAgICAgICAgICAgICAkdGFnOiB0YWdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZGVsZXRlVGFnR2x1ZSh2cGF0aDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bihcbiAgICAgICAgICAgICAgICBhd2FpdCBkZWxldGVUYWdnbHVlLCB7XG4gICAgICAgICAgICAgICAgICAgICR2cGF0aDogdnBhdGgsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyB0YWdzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgY29uc3Qgcm93cyA9IDx7XG4gICAgICAgICAgICB0YWc6IHN0cmluZ1xuICAgICAgICB9W10+IGF3YWl0IHRoaXMuZGIuYWxsKGF3YWl0IHNlbGVjdEFsbFRhZ3MpO1xuICAgICAgICByZXR1cm4gcm93cy5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnRhZztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcGF0aHNGb3JUYWcodGFnTmFtZTogc3RyaW5nIHwgc3RyaW5nW10pXG4gICAgICAgIDogUHJvbWlzZTxzdHJpbmdbXT5cbiAgICB7XG4gICAgICAgIGxldCByb3dzO1xuICAgICAgICBpZiAodHlwZW9mIHRhZ05hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3dzID0gPHtcbiAgICAgICAgICAgICAgICB2cGF0aDogc3RyaW5nXG4gICAgICAgICAgICB9W10+IGF3YWl0IHRoaXMuZGIuYWxsKFxuICAgICAgICAgICAgICAgIGF3YWl0IHNlbGVjdFZwYXRoRm9yVGFnLCB7XG4gICAgICAgICAgICAgICAgICAgICR0YWc6IHRhZ05hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgbGV0IHRhZ3N0cmluZyA9IGAgKFxuICAgICAgICAgICAgICAgICR7U3FsU3RyaW5nLmVzY2FwZSh0YWdOYW1lKX1cbiAgICAgICAgICAgIClgO1xuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh0YWdzdHJpbmcpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFxuICAgICAgICAgICAgLy8gICAgIFNFTEVDVCBESVNUSU5DVCBkb2N2cGF0aCBBUyB2cGF0aFxuICAgICAgICAgICAgLy8gICAgIEZST00gVEFHR0xVRVxuICAgICAgICAgICAgLy8gICAgIFdIRVJFIHRhZ05hbWUgSU4gJHt0YWdzdHJpbmd9XG4gICAgICAgICAgICAvLyAgICAgYClcblxuICAgICAgICAgICAgcm93cyA9IDx7XG4gICAgICAgICAgICAgICAgdnBhdGg6IHN0cmluZ1xuICAgICAgICAgICAgfVtdPiBhd2FpdCB0aGlzLmRiLmFsbChgXG4gICAgICAgICAgICAgICAgU0VMRUNUIERJU1RJTkNUIGRvY3ZwYXRoIEFTIHZwYXRoXG4gICAgICAgICAgICAgICAgRlJPTSBUQUdHTFVFXG4gICAgICAgICAgICAgICAgV0hFUkUgdGFnTmFtZSBJTiAke3RhZ3N0cmluZ31cbiAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGF0aHNGb3JUYWcgJHt1dGlsLmluc3BlY3QodGFnTmFtZSl9YCk7XG4gICAgICAgIHJldHVybiByb3dzLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnZwYXRoO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxuY29uc3QgY3JlYXRlVGFibGVUYWdEZXNjcmlwdGlvbiA9IGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgJ3NxbCcsXG4gICAgICAgICdjcmVhdGUtdGFibGUtdGFnLWRlc2NyaXB0aW9uLnNxbCdcbiAgICApLFxuICAgICd1dGYtOCdcbik7XG5cbmNvbnN0IGluc2VydFRhZ0Rlc2NyaXB0aW9uID0gYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLCAnc3FsJyxcbiAgICAgICAgJ2luc2VydC10YWctZGVzY3JpcHRpb24uc3FsJ1xuICAgICksXG4gICAgJ3V0Zi04J1xuKTtcblxuY29uc3QgZGVsZXRlVGFnRGVzY3JpcHRpb24gPSBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLFxuICAgICAgICAnZGVsZXRlLXRhZy1kZXNjcmlwdGlvbi5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5jb25zdCBzZWxlY3RUYWdEZXNjcmlwdGlvbiA9IGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgJ3NxbCcsXG4gICAgICAgICdzZWxlY3QtdGFnLWRlc2NyaXB0aW9uLnNxbCdcbiAgICApLFxuICAgICd1dGYtOCdcbik7XG5cbmV4cG9ydCBjbGFzcyBUYWdEZXNjcmlwdGlvbnMge1xuXG4gICAgI2RiOiBBc3luY0RhdGFiYXNlO1xuXG4gICAgZ2V0IGRiKCk6IEFzeW5jRGF0YWJhc2UgeyByZXR1cm4gdGhpcy4jZGI7IH1cblxuICAgIGFzeW5jIGluaXQoZGI6IEFzeW5jRGF0YWJhc2UpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFRhZ0Rlc2NyaXB0aW9ucyBcbiAgICAgICAgLy8gQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFNcbiAgICAgICAgLy8gVEFHREVTQ1JJUFRJT04gKFxuICAgICAgICAvLyAgICAgdGFnTmFtZSBTVFJJTkcgVU5JUVVFLFxuICAgICAgICAvLyAgICAgZGVzY3JpcHRpb24gU1RSSU5HXG4gICAgICAgIC8vICk7XG4gICAgICAgIC8vIENSRUFURSBVTklRVUUgSU5ERVggSUYgTk9UIEVYSVNUU1xuICAgICAgICAvLyAgICAgdGFnZGVzY19uYW1lICBvbiBUQUdERVNDUklQVElPTiAodGFnTmFtZSk7YClcbiAgICAgICAgdGhpcy4jZGIgPSBkYjtcblxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bihcbiAgICAgICAgICAgIGF3YWl0IGNyZWF0ZVRhYmxlVGFnRGVzY3JpcHRpb25cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBhc3luYyBhZGREZXNjKHRhZzogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBUYWdEZXNjcmlwdGlvbnMgYWRkRGVzYyAke3RhZ30gJHtkZXNjcmlwdGlvbn1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oXG4gICAgICAgICAgICBhd2FpdCBpbnNlcnRUYWdEZXNjcmlwdGlvbiwge1xuICAgICAgICAgICAgJHRhZzogdGFnLFxuICAgICAgICAgICAgJGRlc2M6IGRlc2NyaXB0aW9uXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGRlbGV0ZURlc2ModGFnOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFRhZ0Rlc2NyaXB0aW9ucyBkZWxldGVEZXNjICR7dGFnfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oXG4gICAgICAgICAgICAgICAgYXdhaXQgZGVsZXRlVGFnRGVzY3JpcHRpb24sIHtcbiAgICAgICAgICAgICAgICAgICAgJHRhZzogdGFnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBnZXREZXNjKFxuICAgICAgICB0YWc6IHN0cmluZ1xuICAgICk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFRhZ0Rlc2NyaXB0aW9ucyBnZXREZXNjICR7dGFnfWApO1xuICAgICAgICBjb25zdCByb3dzID0gPHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmdcbiAgICAgICAgfVtdPiBhd2FpdCB0aGlzLmRiLmFsbChcbiAgICAgICAgICAgIGF3YWl0IHNlbGVjdFRhZ0Rlc2NyaXB0aW9uLCB7XG4gICAgICAgICAgICAgICAgJHRhZzogdGFnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKHJvd3MubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgTm8gdGFnIGluZm9ybWF0aW9uIGZvdW5kIGZvciAke3V0aWwuaW5zcGVjdCh0YWcpfWApO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocm93cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVORVhQRUNURUQgQ09ORElUSU9OIG1vcmUgdGhhbiBvbmUgdGFnIGVudHJ5IGZvciAke3V0aWwuaW5zcGVjdCh0YWcpfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocm93c1swXS5kZXNjcmlwdGlvbiA9PT0gbnVsbFxuICAgICAgICAgICAgfHwgdHlwZW9mIHJvd3NbMF0uZGVzY3JpcHRpb24gPT09ICd1bmRlZmluZWQnXG4gICAgICAgIClcbiAgICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgICA6IHJvd3NbMF0uZGVzY3JpcHRpb247XG4gICAgfVxufVxuIl19