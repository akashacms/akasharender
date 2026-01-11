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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLWdsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvdGFnLWdsdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEVBQUUsUUFBUSxJQUFJLEdBQUcsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUkxQyxPQUFPLFNBQVMsTUFBTSxrQkFBa0IsQ0FBQztBQUV6QyxrREFBa0Q7QUFFbEQsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUNoQywwQkFBMEIsQ0FDN0IsRUFDRCxPQUFPLENBQ1YsQ0FBQztBQUVGLE1BQU0sYUFBYSxHQUFHLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQ2hDLG9CQUFvQixDQUN2QixFQUNELE9BQU8sQ0FDVixDQUFDO0FBRUYsTUFBTSxhQUFhLEdBQUcsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssRUFDaEMsb0JBQW9CLENBQ3ZCLEVBQ0QsT0FBTyxDQUNWLENBQUM7QUFFRixNQUFNLGFBQWEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUNoQyxxQkFBcUIsQ0FDeEIsRUFDRCxPQUFPLENBQ1YsQ0FBQztBQUVGLE1BQU0saUJBQWlCLEdBQUcsTUFB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QUFXLENBQ2hEO1lBQ0csQ0FBQyxDQUFDLFNBQVM7WUFDWCxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUM5QixDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcblxuaW1wb3J0IHsgQXN5bmNEYXRhYmFzZSB9IGZyb20gJ3Byb21pc2VkLXNxbGl0ZTMnO1xuXG5pbXBvcnQgU3FsU3RyaW5nIGZyb20gJ3NxbHN0cmluZy1zcWxpdGUnO1xuXG4vLyBmdW5jdGlvbiB0byBpbml0aWFsaXplIGEgVEFHR0xVRSBkYXRhYmFzZSB0YWJsZVxuXG5jb25zdCBjcmVhdGVUYWJsZVRhZ2dsdWUgPSBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLFxuICAgICAgICAnY3JlYXRlLXRhYmxlLXRhZ2dsdWUuc3FsJ1xuICAgICksXG4gICAgJ3V0Zi04J1xuKTtcblxuY29uc3QgaW5zZXJ0VGFnZ2x1ZSA9IGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgJ3NxbCcsXG4gICAgICAgICdpbnNlcnQtdGFnZ2x1ZS5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5jb25zdCBkZWxldGVUYWdnbHVlID0gYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLCAnc3FsJyxcbiAgICAgICAgJ2RlbGV0ZS10YWdnbHVlLnNxbCdcbiAgICApLFxuICAgICd1dGYtOCdcbik7XG5cbmNvbnN0IHNlbGVjdEFsbFRhZ3MgPSBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLFxuICAgICAgICAnc2VsZWN0LWFsbC10YWdzLnNxbCdcbiAgICApLFxuICAgICd1dGYtOCdcbik7XG5cbmNvbnN0IHNlbGVjdFZwYXRoRm9yVGFnID0gYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLCAnc3FsJyxcbiAgICAgICAgJ3NlbGVjdC12cGF0aC1mb3ItdGFnLnNxbCdcbiAgICApLFxuICAgICd1dGYtOCdcbik7XG5cbmV4cG9ydCBjbGFzcyBUYWdHbHVlIHtcbiAgICAjZGI6IEFzeW5jRGF0YWJhc2U7XG5cbiAgICBnZXQgZGIoKTogQXN5bmNEYXRhYmFzZSB7IHJldHVybiB0aGlzLiNkYjsgfVxuXG4gICAgYXN5bmMgaW5pdChkYjogQXN5bmNEYXRhYmFzZSkge1xuICAgICAgICB0aGlzLiNkYiA9IGRiO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBcbiAgICAgICAgLy8gQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFNcbiAgICAgICAgLy8gVEFHR0xVRSAoXG4gICAgICAgIC8vICAgICBkb2N2cGF0aCBTVFJJTkcsXG4gICAgICAgIC8vICAgICB0YWdOYW1lIFNUUklOR1xuICAgICAgICAvLyApO1xuICAgICAgICAvLyBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyBcbiAgICAgICAgLy8gICAgIHRhZ2dsdWVfdnBhdGggb24gVEFHR0xVRSAoZG9jdnBhdGgpO1xuICAgICAgICAvLyBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUU1xuICAgICAgICAvLyAgICAgdGFnZ2x1ZV9uYW1lICBvbiBUQUdHTFVFICh0YWdOYW1lKTtcbiAgICAgICAgLy8gQ1JFQVRFIFVOSVFVRSBJTkRFWCBJRiBOT1QgRVhJU1RTXG4gICAgICAgIC8vICAgICB0YWdnbHVlX3R1cGxlIE9OIFRBR0dMVUUgKGRvY3ZwYXRoLCB0YWdOYW1lKTtcbiAgICAgICAgLy8gICAgIGApXG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKGF3YWl0IGNyZWF0ZVRhYmxlVGFnZ2x1ZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgYWRkVGFnR2x1ZSh2cGF0aDogc3RyaW5nLCB0YWdzOiBzdHJpbmdbXSkge1xuICAgICAgICBmb3IgKGNvbnN0IHRhZyBvZiB0YWdzKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgXG4gICAgICAgICAgICAvLyBJTlNFUlQgSU5UTyBUQUdHTFVFIChcbiAgICAgICAgICAgIC8vICAgICBkb2N2cGF0aCwgdGFnTmFtZVxuICAgICAgICAgICAgLy8gKVxuICAgICAgICAgICAgLy8gVkFMVUVTIChcbiAgICAgICAgICAgIC8vICAgICAke3ZwYXRofSwgJHt0YWd9XG4gICAgICAgICAgICAvLyApXG4gICAgICAgICAgICAvLyBgKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYXdhaXQgaW5zZXJ0VGFnZ2x1ZSwge1xuICAgICAgICAgICAgICAgICR2cGF0aDogdnBhdGgsXG4gICAgICAgICAgICAgICAgJHRhZzogdGFnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGRlbGV0ZVRhZ0dsdWUodnBhdGg6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oXG4gICAgICAgICAgICAgICAgYXdhaXQgZGVsZXRlVGFnZ2x1ZSwge1xuICAgICAgICAgICAgICAgICAgICAkdnBhdGg6IHZwYXRoLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgdGFncygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIGNvbnN0IHJvd3MgPSA8e1xuICAgICAgICAgICAgdGFnOiBzdHJpbmdcbiAgICAgICAgfVtdPiBhd2FpdCB0aGlzLmRiLmFsbChhd2FpdCBzZWxlY3RBbGxUYWdzKTtcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS50YWc7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHBhdGhzRm9yVGFnKHRhZ05hbWU6IHN0cmluZyB8IHN0cmluZ1tdKVxuICAgICAgICA6IFByb21pc2U8c3RyaW5nW10+XG4gICAge1xuICAgICAgICBsZXQgcm93cztcbiAgICAgICAgaWYgKHR5cGVvZiB0YWdOYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93cyA9IDx7XG4gICAgICAgICAgICAgICAgdnBhdGg6IHN0cmluZ1xuICAgICAgICAgICAgfVtdPiBhd2FpdCB0aGlzLmRiLmFsbChcbiAgICAgICAgICAgICAgICBhd2FpdCBzZWxlY3RWcGF0aEZvclRhZywge1xuICAgICAgICAgICAgICAgICAgICAkdGFnOiB0YWdOYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGxldCB0YWdzdHJpbmcgPSBgIChcbiAgICAgICAgICAgICAgICAke1NxbFN0cmluZy5lc2NhcGUodGFnTmFtZSl9XG4gICAgICAgICAgICApYDtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGFnc3RyaW5nKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBcbiAgICAgICAgICAgIC8vICAgICBTRUxFQ1QgRElTVElOQ1QgZG9jdnBhdGggQVMgdnBhdGhcbiAgICAgICAgICAgIC8vICAgICBGUk9NIFRBR0dMVUVcbiAgICAgICAgICAgIC8vICAgICBXSEVSRSB0YWdOYW1lIElOICR7dGFnc3RyaW5nfVxuICAgICAgICAgICAgLy8gICAgIGApXG5cbiAgICAgICAgICAgIHJvd3MgPSA8e1xuICAgICAgICAgICAgICAgIHZwYXRoOiBzdHJpbmdcbiAgICAgICAgICAgIH1bXT4gYXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgICAgIFNFTEVDVCBESVNUSU5DVCBkb2N2cGF0aCBBUyB2cGF0aFxuICAgICAgICAgICAgICAgIEZST00gVEFHR0xVRVxuICAgICAgICAgICAgICAgIFdIRVJFIHRhZ05hbWUgSU4gJHt0YWdzdHJpbmd9XG4gICAgICAgICAgICAgICAgYCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhdGhzRm9yVGFnICR7dXRpbC5pbnNwZWN0KHRhZ05hbWUpfWApO1xuICAgICAgICByZXR1cm4gcm93cy5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS52cGF0aDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbmNvbnN0IGNyZWF0ZVRhYmxlVGFnRGVzY3JpcHRpb24gPSBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLFxuICAgICAgICAnY3JlYXRlLXRhYmxlLXRhZy1kZXNjcmlwdGlvbi5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5jb25zdCBpbnNlcnRUYWdEZXNjcmlwdGlvbiA9IGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgJ3NxbCcsXG4gICAgICAgICdpbnNlcnQtdGFnLWRlc2NyaXB0aW9uLnNxbCdcbiAgICApLFxuICAgICd1dGYtOCdcbik7XG5cbmNvbnN0IGRlbGV0ZVRhZ0Rlc2NyaXB0aW9uID0gYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLCAnc3FsJyxcbiAgICAgICAgJ2RlbGV0ZS10YWctZGVzY3JpcHRpb24uc3FsJ1xuICAgICksXG4gICAgJ3V0Zi04J1xuKTtcblxuY29uc3Qgc2VsZWN0VGFnRGVzY3JpcHRpb24gPSBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLFxuICAgICAgICAnc2VsZWN0LXRhZy1kZXNjcmlwdGlvbi5zcWwnXG4gICAgKSxcbiAgICAndXRmLTgnXG4pO1xuXG5leHBvcnQgY2xhc3MgVGFnRGVzY3JpcHRpb25zIHtcblxuICAgICNkYjogQXN5bmNEYXRhYmFzZTtcblxuICAgIGdldCBkYigpOiBBc3luY0RhdGFiYXNlIHsgcmV0dXJuIHRoaXMuI2RiOyB9XG5cbiAgICBhc3luYyBpbml0KGRiOiBBc3luY0RhdGFiYXNlKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBUYWdEZXNjcmlwdGlvbnMgXG4gICAgICAgIC8vIENSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTXG4gICAgICAgIC8vIFRBR0RFU0NSSVBUSU9OIChcbiAgICAgICAgLy8gICAgIHRhZ05hbWUgU1RSSU5HIFVOSVFVRSxcbiAgICAgICAgLy8gICAgIGRlc2NyaXB0aW9uIFNUUklOR1xuICAgICAgICAvLyApO1xuICAgICAgICAvLyBDUkVBVEUgVU5JUVVFIElOREVYIElGIE5PVCBFWElTVFNcbiAgICAgICAgLy8gICAgIHRhZ2Rlc2NfbmFtZSAgb24gVEFHREVTQ1JJUFRJT04gKHRhZ05hbWUpO2ApXG4gICAgICAgIHRoaXMuI2RiID0gZGI7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oXG4gICAgICAgICAgICBhd2FpdCBjcmVhdGVUYWJsZVRhZ0Rlc2NyaXB0aW9uXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgYXN5bmMgYWRkRGVzYyh0YWc6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgVGFnRGVzY3JpcHRpb25zIGFkZERlc2MgJHt0YWd9ICR7ZGVzY3JpcHRpb259YCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKFxuICAgICAgICAgICAgYXdhaXQgaW5zZXJ0VGFnRGVzY3JpcHRpb24sIHtcbiAgICAgICAgICAgICR0YWc6IHRhZyxcbiAgICAgICAgICAgICRkZXNjOiBkZXNjcmlwdGlvblxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBkZWxldGVEZXNjKHRhZzogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBUYWdEZXNjcmlwdGlvbnMgZGVsZXRlRGVzYyAke3RhZ31gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKFxuICAgICAgICAgICAgICAgIGF3YWl0IGRlbGV0ZVRhZ0Rlc2NyaXB0aW9uLCB7XG4gICAgICAgICAgICAgICAgICAgICR0YWc6IHRhZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0RGVzYyhcbiAgICAgICAgdGFnOiBzdHJpbmdcbiAgICApOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBUYWdEZXNjcmlwdGlvbnMgZ2V0RGVzYyAke3RhZ31gKTtcbiAgICAgICAgY29uc3Qgcm93cyA9IDx7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogc3RyaW5nXG4gICAgICAgIH1bXT4gYXdhaXQgdGhpcy5kYi5hbGwoXG4gICAgICAgICAgICBhd2FpdCBzZWxlY3RUYWdEZXNjcmlwdGlvbiwge1xuICAgICAgICAgICAgICAgICR0YWc6IHRhZ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIGlmIChyb3dzLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoYE5vIHRhZyBpbmZvcm1hdGlvbiBmb3VuZCBmb3IgJHt1dGlsLmluc3BlY3QodGFnKX1gKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJvd3MubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVTkVYUEVDVEVEIENPTkRJVElPTiBtb3JlIHRoYW4gb25lIHRhZyBlbnRyeSBmb3IgJHt1dGlsLmluc3BlY3QodGFnKX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHJvd3NbMF0uZGVzY3JpcHRpb24gPT09IG51bGxcbiAgICAgICAgICAgIHx8IHR5cGVvZiByb3dzWzBdLmRlc2NyaXB0aW9uID09PSAndW5kZWZpbmVkJ1xuICAgICAgICApXG4gICAgICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICAgICAgOiByb3dzWzBdLmRlc2NyaXB0aW9uO1xuICAgIH1cbn1cbiJdfQ==