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
        // console.log(`pathsForTag ${util.inspect(tagName)}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLWdsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvdGFnLWdsdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBSUEsOENBQThDO0FBRTlDLGtEQUFrRDtBQUVsRCxNQUFNLE9BQU8sT0FBTztJQUFwQjtRQUNJLDhCQUFjO0lBb0lsQixDQUFDO0lBbElHLElBQUksRUFBRSxLQUFlLE9BQU8sdUJBQUEsSUFBSSxtQkFBSSxDQUFDLENBQUMsQ0FBQztJQUV2QyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQVk7UUFDbkIsdUJBQUEsSUFBSSxlQUFPLEVBQUUsTUFBQSxDQUFDO1FBRWQsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQzs7Ozs7OztTQU9qQixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFhLEVBQUUsSUFBYztRQUMxQyxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Ozs7Ozs7YUFPakIsRUFBRTtnQkFDQyxNQUFNLEVBQUUsS0FBSztnQkFDYixJQUFJLEVBQUUsR0FBRzthQUNaLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLO1FBQ3JCLElBQUksQ0FBQztZQUNELE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQ2IsNkNBQTZDLEVBQUU7Z0JBQzNDLE1BQU0sRUFBRSxLQUFLO2FBQ2hCLENBQ0osQ0FBQztRQUNOLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2YsQ0FBQztJQUNMLENBQUM7SUFFRCxvQkFBb0I7SUFDcEIsS0FBSyxDQUFDLElBQUk7UUFDTixNQUFNLElBQUksR0FBRyxFQUFFLENBQUM7UUFDaEIsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFD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QUFDLENBQUM7Z0JBQ25CLENBQUMsQ0FDSixDQUFDO1lBRU4sQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ25CLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUN0QixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnc3FsaXRlMyc7XG5cbi8vIFVzZSB0aGlzLmRhby5zcWxkYiB0byBnZXQgRGF0YWJhc2UgaW5zdGFuY2VcblxuLy8gZnVuY3Rpb24gdG8gaW5pdGlhbGl6ZSBhIFRBR0dMVUUgZGF0YWJhc2UgdGFibGVcblxuZXhwb3J0IGNsYXNzIFRhZ0dsdWUge1xuICAgICNkYjogRGF0YWJhc2U7XG5cbiAgICBnZXQgZGIoKTogRGF0YWJhc2UgeyByZXR1cm4gdGhpcy4jZGI7IH1cblxuICAgIGFzeW5jIGluaXQoZGI6IERhdGFiYXNlKSB7XG4gICAgICAgIHRoaXMuI2RiID0gZGI7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYFxuICAgICAgICBDUkVBVEUgVEFCTEUgSUYgTk9UIEVYSVNUUyBUQUdHTFVFIChcbiAgICAgICAgICAgIGRvY3ZwYXRoIFNUUklORyxcbiAgICAgICAgICAgIHRhZ05hbWUgU1RSSU5HXG4gICAgICAgICk7XG4gICAgICAgIENSRUFURSBJTkRFWCBJRiBOT1QgRVhJU1RTIHRhZ2dsdWVfdnBhdGggb24gVEFHR0xVRSAodnBhdGgpO1xuICAgICAgICBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyB0YWdnbHVlX25hbWUgIG9uIFRBR0dMVUUgKHRhZ05hbWUpO1xuICAgICAgICBgKTtcbiAgICB9XG5cbiAgICBhc3luYyBhZGRUYWdHbHVlKHZwYXRoOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdKSB7XG4gICAgICAgIGZvciAoY29uc3QgdGFnIG9mIHRhZ3MpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKGBcbiAgICAgICAgICAgIElOU0VSVCBJTlRPIFRBR0dMVUUgKFxuICAgICAgICAgICAgICAgIGRvY3ZwYXRoLCB0YWdOYW1lXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBWQUxVRVMgKFxuICAgICAgICAgICAgICAgICR2cGF0aCwgJHRhZ1xuICAgICAgICAgICAgKVxuICAgICAgICAgICAgYCwge1xuICAgICAgICAgICAgICAgICR2cGF0aDogdnBhdGgsXG4gICAgICAgICAgICAgICAgJHRhZzogdGFnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGRlbGV0ZVRhZ0dsdWUodnBhdGgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKFxuICAgICAgICAgICAgICAgIGBERUxFVEUgRlJPTSBUQUdHTFVFIFdIRVJFIGRvY3ZwYXRoID0gJHZwYXRoYCwge1xuICAgICAgICAgICAgICAgICAgICAkdnBhdGg6IHZwYXRoLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETyByZXR1cm4gdmFsdWVcbiAgICBhc3luYyB0YWdzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgY29uc3Qgcm93cyA9IFtdO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRiLmVhY2goYFNFTEVDVCBESVNUSU5DVCB0YWdOYW1lIEFTIHRhZyBGUk9NIFRBR0dMVUVgLFxuICAgICAgICAgICAgICAgIChlcnIsIHJvdykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoZXJyLCBjb3VudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjb3VudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByb3dzLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udGFnO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBUT0RPIHJldHVybiB2YWx1ZVxuICAgIGFzeW5jIHBhdGhzRm9yVGFnKHRhZ05hbWU6IHN0cmluZyB8IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgICBjb25zdCByb3dzID0gW107XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXRoc0ZvclRhZyAke3V0aWwuaW5zcGVjdCh0YWdOYW1lKX1gKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0YWdOYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGIuZWFjaChgXG4gICAgICAgICAgICAgICAgICAgIFNFTEVDVCBESVNUSU5DVCBkb2N2cGF0aCBBUyB2cGF0aFxuICAgICAgICAgICAgICAgICAgICBGUk9NIFRBR0dMVUVcbiAgICAgICAgICAgICAgICAgICAgV0hFUkUgdGFnTmFtZSA9ICR0YWdcbiAgICAgICAgICAgICAgICAgICAgYCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRhZzogdGFnTmFtZVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAoZXJyLCByb3cpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIChlcnIsIGNvdW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY291bnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0YWdOYW1lKSkge1xuXG4gICAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgYXJyYXkgaW50byB0aGUgU1FMXG4gICAgICAgICAgICAgICAgLy8gcmVwcmVzZW50YXRpb24gb2YgdGhlIGFycmF5XG4gICAgICAgICAgICAgICAgLy8gc3VpdGFibGUgZm9yIHRoZSBXSEVSRSBjbGF1c2UgYmVsb3cuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbGV0IHRhZ3N0cmluZyA9IGAgKCAke3RhZ05hbWUubWFwKHQgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCcke3QuaW5kZXhPZihcIidcIikgPj0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgPyB0LnJlcGxhY2VBbGwoXCInXCIsIFwiJydcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIDogdH0nYDtcbiAgICAgICAgICAgICAgICB9KS5qb2luKCcsJyl9ICkgYDtcblxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRhZ3N0cmluZyk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRiLmVhY2goYFxuICAgICAgICAgICAgICAgICAgICBTRUxFQ1QgRElTVElOQ1QgZG9jdnBhdGggQVMgdnBhdGhcbiAgICAgICAgICAgICAgICAgICAgRlJPTSBUQUdHTFVFXG4gICAgICAgICAgICAgICAgICAgIFdIRVJFIHRhZ05hbWUgSU4gJHt0YWdzdHJpbmd9XG4gICAgICAgICAgICAgICAgICAgIGBcbiAgICAgICAgICAgICAgICAgICAgLy8gSW5zZXJ0aW5nIHRoZSB0YWdzdHJpbmcgaW4gdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vcm1hbCB3YXkgZGlkIG5vdCB3b3JrLCBhbmRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5zdGVhZCBnYXZlIGEgc3ludGF4IGVycm9yLlxuICAgICAgICAgICAgICAgICAgICAvLyBVc2luZyBKYXZhU2NyaXB0IHRlbXBsYXRlIHN0cmluZ3NcbiAgICAgICAgICAgICAgICAgICAgLy8gd29ya2VkLCBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAvLyAsIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICR0YWdzOiB0YWdzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAsXG4gICAgICAgICAgICAgICAgICAgIChlcnIsIHJvdykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByb3dzLnB1c2gocm93KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgKGVyciwgY291bnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcm93cy5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS52cGF0aDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbiJdfQ==