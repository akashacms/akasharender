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
var _TagGlue_db;
import util from 'node:util';
// Use this.dao.sqldb to get Database instance
// function to initialize a TAGGLUE database table
export class TagGlue {
    constructor() {
        _TagGlue_db.set(this, void 0);
    }
    get db() { return __classPrivateFieldGet(this, _TagGlue_db, "f"); }
    async init(db) {
        __classPrivateFieldSet(this, _TagGlue_db, db, "f");
        await this.db.run(`
        CREATE TABLE IF NOT EXISTS TAGGLUE (
            docvpath STRING,
            tagName STRING
        );
        CREATE INDEX IF NOT EXISTS tagglue_vpath on TAGGLUE (vpath);
        CREATE INDEX IF NOT EXISTS tagglue_name  on TAGGLUE (tagName);
        `);
    }
    async addTagGlue(vpath, tags) {
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
            await this.db.run(`DELETE FROM TAGGLUE WHERE docvpath = $vpath`, {
                $vpath: vpath,
            });
        }
        catch (err) {
        }
    }
    // TODO return value
    async tags() {
        const rows = [];
        await new Promise((resolve, reject) => {
            this.db.each(`SELECT DISTINCT tagName AS tag FROM TAGGLUE`, (err, row) => {
                if (err)
                    reject(err);
                rows.push(row);
            }, (err, count) => {
                if (err)
                    reject(err);
                resolve(count);
            });
        });
        return rows.map((item) => {
            return item.tag;
        });
    }
    // TODO return value
    async pathsForTag(tagName) {
        const rows = [];
        console.log(`pathsForTag ${util.inspect(tagName)}`);
        await new Promise((resolve, reject) => {
            if (typeof tagName === 'string') {
                this.db.each(`
                    SELECT DISTINCT docvpath AS vpath
                    FROM TAGGLUE
                    WHERE tagName = $tag
                    `, {
                    $tag: tagName
                }, (err, row) => {
                    if (err)
                        reject(err);
                    rows.push(row);
                }, (err, count) => {
                    if (err)
                        reject(err);
                    resolve(count);
                });
            }
            else if (Array.isArray(tagName)) {
                // Convert the array into the SQL
                // representation of the array
                // suitable for the WHERE clause below.
                let tagstring = ` ( ${tagName.map(t => {
                    return `'${t.indexOf("'") >= 0
                        ? t.replaceAll("'", "''")
                        : t}'`;
                }).join(',')} ) `;
                console.log(tagstring);
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
                , (err, row) => {
                    if (err)
                        reject(err);
                    rows.push(row);
                }, (err, count) => {
                    if (err)
                        reject(err);
                    resolve(count);
                });
            }
        });
        return rows.map(item => {
            return item.vpath;
        });
    }
}
_TagGlue_db = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLWdsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvdGFnLWdsdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQ0EsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRzdCLDhDQUE4QztBQUU5QyxrREFBa0Q7QUFFbEQsTUFBTSxPQUFPLE9BQU87SUFBcEI7UUFDSSw4QkFBYztJQW9JbEIsQ0FBQztJQWxJRyxJQUFJLEVBQUUsS0FBZSxPQUFPLHVCQUFBLElBQUksbUJBQUksQ0FBQyxDQUFDLENBQUM7SUFFdkMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFZO1FBQ25CLHVCQUFBLElBQUksZUFBTyxFQUFFLE1BQUEsQ0FBQztRQUVkLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Ozs7Ozs7U0FPakIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBYSxFQUFFLElBQWM7UUFDMUMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNyQixNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDOzs7Ozs7O2FBT2pCLEVBQUU7Z0JBQ0MsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsSUFBSSxFQUFFLEdBQUc7YUFDWixDQUFDLENBQUM7UUFDUCxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSztRQUNyQixJQUFJLENBQUM7WUFDRCxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUNiLDZDQUE2QyxFQUFFO2dCQUMzQyxNQUFNLEVBQUUsS0FBSzthQUNoQixDQUNKLENBQUM7UUFDTixDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNmLENBQUM7SUFDTCxDQUFDO0lBRUQsb0JBQW9CO0lBQ3BCLEtBQUssQ0FBQyxJQUFJO1FBQ04sTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFD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Q0FBQztnQkFDbkIsQ0FBQyxFQUNELENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO29CQUNYLElBQUksR0FBRzt3QkFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3JCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsQ0FBQyxDQUNKLENBQUM7WUFFTixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDbkIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tICdzcWxpdGUzJztcblxuLy8gVXNlIHRoaXMuZGFvLnNxbGRiIHRvIGdldCBEYXRhYmFzZSBpbnN0YW5jZVxuXG4vLyBmdW5jdGlvbiB0byBpbml0aWFsaXplIGEgVEFHR0xVRSBkYXRhYmFzZSB0YWJsZVxuXG5leHBvcnQgY2xhc3MgVGFnR2x1ZSB7XG4gICAgI2RiOiBEYXRhYmFzZTtcblxuICAgIGdldCBkYigpOiBEYXRhYmFzZSB7IHJldHVybiB0aGlzLiNkYjsgfVxuXG4gICAgYXN5bmMgaW5pdChkYjogRGF0YWJhc2UpIHtcbiAgICAgICAgdGhpcy4jZGIgPSBkYjtcblxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bihgXG4gICAgICAgIENSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTIFRBR0dMVUUgKFxuICAgICAgICAgICAgZG9jdnBhdGggU1RSSU5HLFxuICAgICAgICAgICAgdGFnTmFtZSBTVFJJTkdcbiAgICAgICAgKTtcbiAgICAgICAgQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFMgdGFnZ2x1ZV92cGF0aCBvbiBUQUdHTFVFICh2cGF0aCk7XG4gICAgICAgIENSRUFURSBJTkRFWCBJRiBOT1QgRVhJU1RTIHRhZ2dsdWVfbmFtZSAgb24gVEFHR0xVRSAodGFnTmFtZSk7XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGFzeW5jIGFkZFRhZ0dsdWUodnBhdGg6IHN0cmluZywgdGFnczogc3RyaW5nW10pIHtcbiAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgdGFncykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYFxuICAgICAgICAgICAgSU5TRVJUIElOVE8gVEFHR0xVRSAoXG4gICAgICAgICAgICAgICAgZG9jdnBhdGgsIHRhZ05hbWVcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIFZBTFVFUyAoXG4gICAgICAgICAgICAgICAgJHZwYXRoLCAkdGFnXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBgLCB7XG4gICAgICAgICAgICAgICAgJHZwYXRoOiB2cGF0aCxcbiAgICAgICAgICAgICAgICAkdGFnOiB0YWdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZGVsZXRlVGFnR2x1ZSh2cGF0aCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oXG4gICAgICAgICAgICAgICAgYERFTEVURSBGUk9NIFRBR0dMVUUgV0hFUkUgZG9jdnBhdGggPSAkdnBhdGhgLCB7XG4gICAgICAgICAgICAgICAgICAgICR2cGF0aDogdnBhdGgsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIHJldHVybiB2YWx1ZVxuICAgIGFzeW5jIHRhZ3MoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgICBjb25zdCByb3dzID0gW107XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZGIuZWFjaChgU0VMRUNUIERJU1RJTkNUIHRhZ05hbWUgQVMgdGFnIEZST00gVEFHR0xVRWAsXG4gICAgICAgICAgICAgICAgKGVyciwgcm93KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICByb3dzLnB1c2gocm93KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChlcnIsIGNvdW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNvdW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS50YWc7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRPRE8gcmV0dXJuIHZhbHVlXG4gICAgYXN5bmMgcGF0aHNGb3JUYWcodGFnTmFtZTogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIGNvbnN0IHJvd3MgPSBbXTtcbiAgICAgICAgY29uc29sZS5sb2coYHBhdGhzRm9yVGFnICR7dXRpbC5pbnNwZWN0KHRhZ05hbWUpfWApO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRhZ05hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYi5lYWNoKGBcbiAgICAgICAgICAgICAgICAgICAgU0VMRUNUIERJU1RJTkNUIGRvY3ZwYXRoIEFTIHZwYXRoXG4gICAgICAgICAgICAgICAgICAgIEZST00gVEFHR0xVRVxuICAgICAgICAgICAgICAgICAgICBXSEVSRSB0YWdOYW1lID0gJHRhZ1xuICAgICAgICAgICAgICAgICAgICBgLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdGFnOiB0YWdOYW1lXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIChlcnIsIHJvdykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByb3dzLnB1c2gocm93KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgKGVyciwgY291bnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRhZ05hbWUpKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBhcnJheSBpbnRvIHRoZSBTUUxcbiAgICAgICAgICAgICAgICAvLyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYXJyYXlcbiAgICAgICAgICAgICAgICAvLyBzdWl0YWJsZSBmb3IgdGhlIFdIRVJFIGNsYXVzZSBiZWxvdy5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBsZXQgdGFnc3RyaW5nID0gYCAoICR7dGFnTmFtZS5tYXAodCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgJyR7dC5pbmRleE9mKFwiJ1wiKSA+PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHQucmVwbGFjZUFsbChcIidcIiwgXCInJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiB0fSdgO1xuICAgICAgICAgICAgICAgIH0pLmpvaW4oJywnKX0gKSBgO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGFnc3RyaW5nKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZGIuZWFjaChgXG4gICAgICAgICAgICAgICAgICAgIFNFTEVDVCBESVNUSU5DVCBkb2N2cGF0aCBBUyB2cGF0aFxuICAgICAgICAgICAgICAgICAgICBGUk9NIFRBR0dMVUVcbiAgICAgICAgICAgICAgICAgICAgV0hFUkUgdGFnTmFtZSBJTiAke3RhZ3N0cmluZ31cbiAgICAgICAgICAgICAgICAgICAgYFxuICAgICAgICAgICAgICAgICAgICAvLyBJbnNlcnRpbmcgdGhlIHRhZ3N0cmluZyBpbiB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gbm9ybWFsIHdheSBkaWQgbm90IHdvcmssIGFuZFxuICAgICAgICAgICAgICAgICAgICAvLyBpbnN0ZWFkIGdhdmUgYSBzeW50YXggZXJyb3IuXG4gICAgICAgICAgICAgICAgICAgIC8vIFVzaW5nIEphdmFTY3JpcHQgdGVtcGxhdGUgc3RyaW5nc1xuICAgICAgICAgICAgICAgICAgICAvLyB3b3JrZWQsIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgIC8vICwge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgJHRhZ3M6IHRhZ3N0cmluZ1xuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICxcbiAgICAgICAgICAgICAgICAgICAgKGVyciwgcm93KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAoZXJyLCBjb3VudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByb3dzLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnZwYXRoO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxuIl19