/**
 *
 * Copyright 2025 David Herron
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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AsyncDatabase_instances, _AsyncDatabase_db, _AsyncDatabase_stmtCache, _AsyncDatabase_enableCache, _AsyncDatabase_getStatement, _AsyncDatabase_normalizeParams, _AsyncStatement_statement, _AsyncStatement_bindParams;
/**
 * Async wrapper around node:sqlite (DatabaseSync)
 *
 * This module provides a promise-based API wrapper around Node.js's
 * built-in synchronous sqlite module. It mimics the API of promised-sqlite3
 * to allow for drop-in replacement.
 *
 * The wrapper uses setImmediate() to yield control to the event loop,
 * preventing blocking during database operations.
 */
import { DatabaseSync } from 'node:sqlite';
/**
 * A thin wrapper around DatabaseSync that exposes an async API.
 * Compatible with promised-sqlite3's AsyncDatabase interface.
 */
export class AsyncDatabase {
    /**
     * Create a new AsyncDatabase from a DatabaseSync object.
     *
     * @see Use AsyncDatabase.open() to create and open the database with the async API.
     *
     * @param db - The DatabaseSync object.
     * @param enableCache - If true, prepared statements are cached (default: true)
     */
    constructor(db, enableCache = true) {
        _AsyncDatabase_instances.add(this);
        _AsyncDatabase_db.set(this, void 0);
        _AsyncDatabase_stmtCache.set(this, void 0);
        _AsyncDatabase_enableCache.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncDatabase_db, db, "f");
        __classPrivateFieldSet(this, _AsyncDatabase_stmtCache, new Map(), "f");
        __classPrivateFieldSet(this, _AsyncDatabase_enableCache, enableCache, "f");
    }
    /**
     * @returns The inner DatabaseSync object for direct access (e.g., for extension loading)
     */
    get inner() {
        return __classPrivateFieldGet(this, _AsyncDatabase_db, "f");
    }
    /**
     * Returns a new AsyncDatabase object and automatically opens the database.
     *
     * @param filename - The filename or ':memory:' for in-memory database
     * @param options - Database options
     */
    static async open(filename, options) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const dbOptions = {
                        open: true,
                        readOnly: options?.readOnly ?? false,
                        enableForeignKeyConstraints: options?.enableForeignKeyConstraints ?? true,
                        allowExtension: options?.allowExtension ?? false,
                        timeout: options?.timeout ?? 0,
                        readBigInts: options?.readBigInts ?? false,
                        returnArrays: options?.returnArrays ?? false,
                        allowBareNamedParameters: options?.allowBareNamedParameters ?? true,
                        allowUnknownNamedParameters: options?.allowUnknownNamedParameters ?? false,
                    };
                    const db = new DatabaseSync(filename, dbOptions);
                    resolve(new AsyncDatabase(db));
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Close the database.
     */
    async close() {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    // Clear statement cache
                    __classPrivateFieldGet(this, _AsyncDatabase_stmtCache, "f").clear();
                    __classPrivateFieldGet(this, _AsyncDatabase_db, "f").close();
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Runs the SQL query with the specified parameters.
     *
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     */
    async run(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const stmt = __classPrivateFieldGet(this, _AsyncDatabase_instances, "m", _AsyncDatabase_getStatement).call(this, sql);
                    const p = __classPrivateFieldGet(this, _AsyncDatabase_instances, "m", _AsyncDatabase_normalizeParams).call(this, params);
                    const result = p !== undefined ? stmt.run(p) : stmt.run();
                    resolve({
                        changes: typeof result.changes === 'bigint'
                            ? Number(result.changes)
                            : result.changes,
                        lastInsertRowid: typeof result.lastInsertRowid === 'bigint'
                            ? Number(result.lastInsertRowid)
                            : result.lastInsertRowid
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Runs the SQL query and returns the first result row.
     *
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     */
    async get(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const stmt = __classPrivateFieldGet(this, _AsyncDatabase_instances, "m", _AsyncDatabase_getStatement).call(this, sql);
                    const p = __classPrivateFieldGet(this, _AsyncDatabase_instances, "m", _AsyncDatabase_normalizeParams).call(this, params);
                    const result = p !== undefined ? stmt.get(p) : stmt.get();
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Runs the SQL query and returns all result rows.
     *
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     */
    async all(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const stmt = __classPrivateFieldGet(this, _AsyncDatabase_instances, "m", _AsyncDatabase_getStatement).call(this, sql);
                    const p = __classPrivateFieldGet(this, _AsyncDatabase_instances, "m", _AsyncDatabase_normalizeParams).call(this, params);
                    const result = p !== undefined ? stmt.all(p) : stmt.all();
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Runs the SQL query with the specified parameters and calls the callback once for each result row.
     * Returns the number of rows processed.
     *
     * @param sql - The SQL statement
     * @param params - Parameters for the statement
     * @param callback - Function to call for each row
     */
    async each(sql, params, callback) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const stmt = __classPrivateFieldGet(this, _AsyncDatabase_instances, "m", _AsyncDatabase_getStatement).call(this, sql);
                    const iterator = params !== undefined
                        ? stmt.iterate(params)
                        : stmt.iterate();
                    let count = 0;
                    for (const row of iterator) {
                        try {
                            callback(row);
                            count++;
                        }
                        catch (err) {
                            reject(err);
                            return;
                        }
                    }
                    resolve(count);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Runs all SQL queries in the supplied string.
     *
     * @param sql - One or more SQL statements separated by semicolons
     */
    async exec(sql) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    __classPrivateFieldGet(this, _AsyncDatabase_db, "f").exec(sql);
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Prepares the SQL statement and returns an AsyncStatement.
     *
     * @param sql - The SQL statement
     * @param params - Optional parameters to bind immediately
     */
    async prepare(sql, ...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const stmt = __classPrivateFieldGet(this, _AsyncDatabase_db, "f").prepare(sql);
                    const asyncStmt = new AsyncStatement(stmt);
                    // If parameters provided, bind them
                    if (params.length > 0) {
                        const p = __classPrivateFieldGet(this, _AsyncDatabase_instances, "m", _AsyncDatabase_normalizeParams).call(this, params);
                        // Note: node:sqlite auto-binds on run/get/all, 
                        // so we just store for later use
                        asyncStmt['_bindParams'] = p;
                    }
                    resolve(asyncStmt);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Load a SQLite extension.
     * The database must have been opened with allowExtension: true.
     *
     * @param path - Path to the extension library
     * @param entryPoint - Optional entry point name (not supported in node:sqlite currently)
     */
    async loadExtension(path, entryPoint) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    // Note: node:sqlite doesn't support entryPoint parameter yet
                    __classPrivateFieldGet(this, _AsyncDatabase_db, "f").loadExtension(path);
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
}
_AsyncDatabase_db = new WeakMap(), _AsyncDatabase_stmtCache = new WeakMap(), _AsyncDatabase_enableCache = new WeakMap(), _AsyncDatabase_instances = new WeakSet(), _AsyncDatabase_getStatement = function _AsyncDatabase_getStatement(sql) {
    if (__classPrivateFieldGet(this, _AsyncDatabase_enableCache, "f")) {
        let stmt = __classPrivateFieldGet(this, _AsyncDatabase_stmtCache, "f").get(sql);
        if (!stmt) {
            stmt = __classPrivateFieldGet(this, _AsyncDatabase_db, "f").prepare(sql);
            __classPrivateFieldGet(this, _AsyncDatabase_stmtCache, "f").set(sql, stmt);
        }
        return stmt;
    }
    else {
        return __classPrivateFieldGet(this, _AsyncDatabase_db, "f").prepare(sql);
    }
}, _AsyncDatabase_normalizeParams = function _AsyncDatabase_normalizeParams(params) {
    if (params.length === 0) {
        return undefined;
    }
    const normalized = params.length === 1 ? params[0] : params;
    // Convert undefined to null for node:sqlite compatibility
    if (typeof normalized === 'object' && normalized !== null) {
        if (Array.isArray(normalized)) {
            return normalized.map(v => v === undefined ? null : v);
        }
        else {
            const result = {};
            for (const [key, value] of Object.entries(normalized)) {
                result[key] = value === undefined ? null : value;
            }
            return result;
        }
    }
    return normalized;
};
/**
 * A thin wrapper around StatementSync that exposes an async API.
 * Compatible with promised-sqlite3's AsyncStatement interface.
 */
export class AsyncStatement {
    /**
     * Create a new AsyncStatement from a StatementSync object.
     *
     * @param statement - The StatementSync object
     */
    constructor(statement) {
        _AsyncStatement_statement.set(this, void 0);
        _AsyncStatement_bindParams.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncStatement_statement, statement, "f");
    }
    /**
     * @returns The inner StatementSync object
     */
    get inner() {
        return __classPrivateFieldGet(this, _AsyncStatement_statement, "f");
    }
    /**
     * Binds parameters to the prepared statement.
     * Note: In node:sqlite, binding happens automatically on run/get/all,
     * so this method just stores the params for later use.
     *
     * @param params - Parameters to bind
     */
    async bind(...params) {
        return new Promise((resolve) => {
            setImmediate(() => {
                if (params.length === 1) {
                    __classPrivateFieldSet(this, _AsyncStatement_bindParams, params[0], "f");
                }
                else if (params.length > 1) {
                    __classPrivateFieldSet(this, _AsyncStatement_bindParams, params, "f");
                }
                resolve();
            });
        });
    }
    /**
     * Resets the row cursor of the statement.
     * Note: node:sqlite handles this automatically, so this is a no-op for compatibility.
     */
    async reset() {
        return new Promise((resolve) => {
            setImmediate(() => {
                // No-op for compatibility with promised-sqlite3
                // node:sqlite handles statement reuse automatically
                resolve();
            });
        });
    }
    /**
     * Finalizes the statement.
     * Note: node:sqlite handles cleanup automatically, so this is a no-op for compatibility.
     */
    async finalize() {
        return new Promise((resolve) => {
            setImmediate(() => {
                // No-op for compatibility with promised-sqlite3
                // node:sqlite handles cleanup automatically
                resolve();
            });
        });
    }
    /**
     * Binds parameters and executes the statement.
     *
     * @param params - Parameters to bind (overrides any previously bound params)
     */
    async run(...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    let p;
                    if (params.length > 0) {
                        p = params.length === 1 ? params[0] : params;
                    }
                    else {
                        p = __classPrivateFieldGet(this, _AsyncStatement_bindParams, "f");
                    }
                    const result = p !== undefined ? __classPrivateFieldGet(this, _AsyncStatement_statement, "f").run(p) : __classPrivateFieldGet(this, _AsyncStatement_statement, "f").run();
                    resolve({
                        changes: typeof result.changes === 'bigint'
                            ? Number(result.changes)
                            : result.changes,
                        lastInsertRowid: typeof result.lastInsertRowid === 'bigint'
                            ? Number(result.lastInsertRowid)
                            : result.lastInsertRowid
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Binds parameters, executes the statement and retrieves the first result row.
     *
     * @param params - Parameters to bind (overrides any previously bound params)
     */
    async get(...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    let p;
                    if (params.length > 0) {
                        p = params.length === 1 ? params[0] : params;
                    }
                    else {
                        p = __classPrivateFieldGet(this, _AsyncStatement_bindParams, "f");
                    }
                    const result = p !== undefined ? __classPrivateFieldGet(this, _AsyncStatement_statement, "f").get(p) : __classPrivateFieldGet(this, _AsyncStatement_statement, "f").get();
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Binds parameters, executes the statement and returns all result rows.
     *
     * @param params - Parameters to bind (overrides any previously bound params)
     */
    async all(...params) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    let p;
                    if (params.length > 0) {
                        p = params.length === 1 ? params[0] : params;
                    }
                    else {
                        p = __classPrivateFieldGet(this, _AsyncStatement_bindParams, "f");
                    }
                    const result = p !== undefined ? __classPrivateFieldGet(this, _AsyncStatement_statement, "f").all(p) : __classPrivateFieldGet(this, _AsyncStatement_statement, "f").all();
                    resolve(result);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    /**
     * Binds parameters, executes the statement and calls the callback for each result row.
     *
     * @param params - Parameters to bind
     * @param callback - Function to call for each row
     */
    async each(params, callback) {
        return new Promise((resolve, reject) => {
            setImmediate(() => {
                try {
                    const iterator = params !== undefined
                        ? __classPrivateFieldGet(this, _AsyncStatement_statement, "f").iterate(params)
                        : __classPrivateFieldGet(this, _AsyncStatement_statement, "f").iterate();
                    let count = 0;
                    for (const row of iterator) {
                        try {
                            callback(row);
                            count++;
                        }
                        catch (err) {
                            reject(err);
                            return;
                        }
                    }
                    resolve(count);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
}
_AsyncStatement_statement = new WeakMap(), _AsyncStatement_bindParams = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmMtbm9kZS1zcWxpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYXN5bmMtbm9kZS1zcWxpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUg7Ozs7Ozs7OztHQVNHO0FBRUgsT0FBTyxFQUFFLFlBQVksRUFBNEIsTUFBTSxhQUFhLENBQUM7QUE4RHJFOzs7R0FHRztBQUNILE1BQU0sT0FBTyxhQUFhO0lBS3RCOzs7Ozs7O09BT0c7SUFDSCxZQUFZLEVBQWdCLEVBQUUsY0FBdUIsSUFBSTs7UUFaekQsb0NBQWtCO1FBQ2xCLDJDQUF1QztRQUN2Qyw2Q0FBc0I7UUFXbEIsdUJBQUEsSUFBSSxxQkFBTyxFQUFFLE1BQUEsQ0FBQztRQUNkLHVCQUFBLElBQUksNEJBQWMsSUFBSSxHQUFHLEVBQUUsTUFBQSxDQUFDO1FBQzVCLHVCQUFBLElBQUksOEJBQWdCLFdBQVcsTUFBQSxDQUFDO0lBQ3BDLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksS0FBSztRQUNMLE9BQU8sdUJBQUEsSUFBSSx5QkFBSSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUNiLFFBQWdCLEVBQ2hCLE9BQXlCO1FBRXpCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDbkMsWUFBWSxDQUFDLEdBQUcsRUFBRTtnQkFDZCxJQUFJLENBQUM7b0JBQ0QsTUFBTSxTQUFTLEdBQVE7d0JBQ25CLElBQUksRUFBRSxJQUFJO3dCQUNWLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxJQUFJLEtBQUs7d0JBQ3BDLDJCQUEyQixFQUFFLE9BQU8sRUFBRSwyQkFBMkIsSUFBSSxJQUFJO3dCQUN6RSxjQUFjLEVBQUUsT0FBTyxFQUFFLGNBQWMsSUFBSSxLQUFLO3dCQUNoRCxPQUFPLEVB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LFFBQVEsQ0FBQyxHQUFRLENBQUMsQ0FBQzs0QkFDbkIsS0FBSyxFQUFFLENBQUM7d0JBQ1osQ0FBQzt3QkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOzRCQUNYLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDWixPQUFPO3dCQUNYLENBQUM7b0JBQ0wsQ0FBQztvQkFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDWCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2hCLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEFzeW5jIHdyYXBwZXIgYXJvdW5kIG5vZGU6c3FsaXRlIChEYXRhYmFzZVN5bmMpXG4gKiBcbiAqIFRoaXMgbW9kdWxlIHByb3ZpZGVzIGEgcHJvbWlzZS1iYXNlZCBBUEkgd3JhcHBlciBhcm91bmQgTm9kZS5qcydzXG4gKiBidWlsdC1pbiBzeW5jaHJvbm91cyBzcWxpdGUgbW9kdWxlLiBJdCBtaW1pY3MgdGhlIEFQSSBvZiBwcm9taXNlZC1zcWxpdGUzXG4gKiB0byBhbGxvdyBmb3IgZHJvcC1pbiByZXBsYWNlbWVudC5cbiAqIFxuICogVGhlIHdyYXBwZXIgdXNlcyBzZXRJbW1lZGlhdGUoKSB0byB5aWVsZCBjb250cm9sIHRvIHRoZSBldmVudCBsb29wLFxuICogcHJldmVudGluZyBibG9ja2luZyBkdXJpbmcgZGF0YWJhc2Ugb3BlcmF0aW9ucy5cbiAqL1xuXG5pbXBvcnQgeyBEYXRhYmFzZVN5bmMsIFN0YXRlbWVudFN5bmMsIGNvbnN0YW50cyB9IGZyb20gJ25vZGU6c3FsaXRlJztcblxuLyoqXG4gKiBPcHRpb25zIGZvciBvcGVuaW5nIGEgZGF0YWJhc2UgY29ubmVjdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIERhdGFiYXNlT3B0aW9ucyB7XG4gICAgLyoqXG4gICAgICogSWYgdHJ1ZSwgdGhlIGRhdGFiYXNlIGlzIG9wZW5lZCBpbiByZWFkLW9ubHkgbW9kZVxuICAgICAqL1xuICAgIHJlYWRPbmx5PzogYm9vbGVhbjtcbiAgICBcbiAgICAvKipcbiAgICAgKiBJZiB0cnVlLCBmb3JlaWduIGtleSBjb25zdHJhaW50cyBhcmUgZW5hYmxlZFxuICAgICAqL1xuICAgIGVuYWJsZUZvcmVpZ25LZXlDb25zdHJhaW50cz86IGJvb2xlYW47XG4gICAgXG4gICAgLyoqXG4gICAgICogSWYgdHJ1ZSwgYWxsb3dzIGxvYWRpbmcgU1FMaXRlIGV4dGVuc2lvbnNcbiAgICAgKi9cbiAgICBhbGxvd0V4dGVuc2lvbj86IGJvb2xlYW47XG4gICAgXG4gICAgLyoqXG4gICAgICogQnVzeSB0aW1lb3V0IGluIG1pbGxpc2Vjb25kc1xuICAgICAqL1xuICAgIHRpbWVvdXQ/OiBudW1iZXI7XG4gICAgXG4gICAgLyoqXG4gICAgICogSWYgdHJ1ZSwgaW50ZWdlciBmaWVsZHMgYXJlIHJlYWQgYXMgQmlnSW50c1xuICAgICAqL1xuICAgIHJlYWRCaWdJbnRzPzogYm9vbGVhbjtcbiAgICBcbiAgICAvKipcbiAgICAgKiBJZiB0cnVlLCBxdWVyeSByZXN1bHRzIGFyZSByZXR1cm5lZCBhcyBhcnJheXNcbiAgICAgKi9cbiAgICByZXR1cm5BcnJheXM/OiBib29sZWFuO1xuICAgIFxuICAgIC8qKlxuICAgICAqIElmIHRydWUsIGFsbG93cyBiaW5kaW5nIG5hbWVkIHBhcmFtZXRlcnMgd2l0aG91dCBwcmVmaXhcbiAgICAgKi9cbiAgICBhbGxvd0JhcmVOYW1lZFBhcmFtZXRlcnM/OiBib29sZWFuO1xuICAgIFxuICAgIC8qKlxuICAgICAqIElmIHRydWUsIHVua25vd24gbmFtZWQgcGFyYW1ldGVycyBhcmUgaWdub3JlZFxuICAgICAqL1xuICAgIGFsbG93VW5rbm93bk5hbWVkUGFyYW1ldGVycz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogUmVzdWx0IG9mIGEgcnVuIG9wZXJhdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJ1blJlc3VsdCB7XG4gICAgLyoqXG4gICAgICogTnVtYmVyIG9mIHJvd3MgY2hhbmdlZFxuICAgICAqL1xuICAgIGNoYW5nZXM6IG51bWJlcjtcbiAgICBcbiAgICAvKipcbiAgICAgKiBMYXN0IGluc2VydGVkIHJvdyBJRFxuICAgICAqL1xuICAgIGxhc3RJbnNlcnRSb3dpZDogbnVtYmVyO1xufVxuXG4vKipcbiAqIEEgdGhpbiB3cmFwcGVyIGFyb3VuZCBEYXRhYmFzZVN5bmMgdGhhdCBleHBvc2VzIGFuIGFzeW5jIEFQSS5cbiAqIENvbXBhdGlibGUgd2l0aCBwcm9taXNlZC1zcWxpdGUzJ3MgQXN5bmNEYXRhYmFzZSBpbnRlcmZhY2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBBc3luY0RhdGFiYXNlIHtcbiAgICAjZGI6IERhdGFiYXNlU3luYztcbiAgICAjc3RtdENhY2hlOiBNYXA8c3RyaW5nLCBTdGF0ZW1lbnRTeW5jPjtcbiAgICAjZW5hYmxlQ2FjaGU6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgQXN5bmNEYXRhYmFzZSBmcm9tIGEgRGF0YWJhc2VTeW5jIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBzZWUgVXNlIEFzeW5jRGF0YWJhc2Uub3BlbigpIHRvIGNyZWF0ZSBhbmQgb3BlbiB0aGUgZGF0YWJhc2Ugd2l0aCB0aGUgYXN5bmMgQVBJLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRiIC0gVGhlIERhdGFiYXNlU3luYyBvYmplY3QuXG4gICAgICogQHBhcmFtIGVuYWJsZUNhY2hlIC0gSWYgdHJ1ZSwgcHJlcGFyZWQgc3RhdGVtZW50cyBhcmUgY2FjaGVkIChkZWZhdWx0OiB0cnVlKVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGRiOiBEYXRhYmFzZVN5bmMsIGVuYWJsZUNhY2hlOiBib29sZWFuID0gdHJ1ZSkge1xuICAgICAgICB0aGlzLiNkYiA9IGRiO1xuICAgICAgICB0aGlzLiNzdG10Q2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuI2VuYWJsZUNhY2hlID0gZW5hYmxlQ2FjaGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMgVGhlIGlubmVyIERhdGFiYXNlU3luYyBvYmplY3QgZm9yIGRpcmVjdCBhY2Nlc3MgKGUuZy4sIGZvciBleHRlbnNpb24gbG9hZGluZylcbiAgICAgKi9cbiAgICBnZXQgaW5uZXIoKTogRGF0YWJhc2VTeW5jIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2RiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgQXN5bmNEYXRhYmFzZSBvYmplY3QgYW5kIGF1dG9tYXRpY2FsbHkgb3BlbnMgdGhlIGRhdGFiYXNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGZpbGVuYW1lIC0gVGhlIGZpbGVuYW1lIG9yICc6bWVtb3J5OicgZm9yIGluLW1lbW9yeSBkYXRhYmFzZVxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gRGF0YWJhc2Ugb3B0aW9uc1xuICAgICAqL1xuICAgIHN0YXRpYyBhc3luYyBvcGVuKFxuICAgICAgICBmaWxlbmFtZTogc3RyaW5nLFxuICAgICAgICBvcHRpb25zPzogRGF0YWJhc2VPcHRpb25zXG4gICAgKTogUHJvbWlzZTxBc3luY0RhdGFiYXNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBzZXRJbW1lZGlhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRiT3B0aW9uczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlYWRPbmx5OiBvcHRpb25zPy5yZWFkT25seSA/PyBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZUZvcmVpZ25LZXlDb25zdHJhaW50czogb3B0aW9ucz8uZW5hYmxlRm9yZWlnbktleUNvbnN0cmFpbnRzID8/IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0V4dGVuc2lvbjogb3B0aW9ucz8uYWxsb3dFeHRlbnNpb24gPz8gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiBvcHRpb25zPy50aW1lb3V0ID8/IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWFkQmlnSW50czogb3B0aW9ucz8ucmVhZEJpZ0ludHMgPz8gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5BcnJheXM6IG9wdGlvbnM/LnJldHVybkFycmF5cyA/PyBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93QmFyZU5hbWVkUGFyYW1ldGVyczogb3B0aW9ucz8uYWxsb3dCYXJlTmFtZWRQYXJhbWV0ZXJzID8/IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd1Vua25vd25OYW1lZFBhcmFtZXRlcnM6IG9wdGlvbnM/LmFsbG93VW5rbm93bk5hbWVkUGFyYW1ldGVycyA/PyBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYiA9IG5ldyBEYXRhYmFzZVN5bmMoZmlsZW5hbWUsIGRiT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV3IEFzeW5jRGF0YWJhc2UoZGIpKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsb3NlIHRoZSBkYXRhYmFzZS5cbiAgICAgKi9cbiAgICBhc3luYyBjbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgc3RhdGVtZW50IGNhY2hlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3N0bXRDYWNoZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiNkYi5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgb3IgY3JlYXRlIGEgcHJlcGFyZWQgc3RhdGVtZW50IGZyb20gY2FjaGVcbiAgICAgKi9cbiAgICAjZ2V0U3RhdGVtZW50KHNxbDogc3RyaW5nKTogU3RhdGVtZW50U3luYyB7XG4gICAgICAgIGlmICh0aGlzLiNlbmFibGVDYWNoZSkge1xuICAgICAgICAgICAgbGV0IHN0bXQgPSB0aGlzLiNzdG10Q2FjaGUuZ2V0KHNxbCk7XG4gICAgICAgICAgICBpZiAoIXN0bXQpIHtcbiAgICAgICAgICAgICAgICBzdG10ID0gdGhpcy4jZGIucHJlcGFyZShzcWwpO1xuICAgICAgICAgICAgICAgIHRoaXMuI3N0bXRDYWNoZS5zZXQoc3FsLCBzdG10KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdG10O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuI2RiLnByZXBhcmUoc3FsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6ZSBwYXJhbWV0ZXJzIGZvciBiaW5kaW5nXG4gICAgICogSWYgc2luZ2xlIG9iamVjdC9hcnJheSwgdXNlIGFzLWlzIGZvciBuYW1lZC9wb3NpdGlvbmFsIHBhcmFtZXRlcnNcbiAgICAgKiBJZiBtdWx0aXBsZSBhcmdzLCB1c2UgYXMgcG9zaXRpb25hbCBhcnJheVxuICAgICAqIFxuICAgICAqIENvbnZlcnRzIHVuZGVmaW5lZCB2YWx1ZXMgdG8gbnVsbCBhcyBub2RlOnNxbGl0ZSBkb2Vzbid0IGFjY2VwdCB1bmRlZmluZWRcbiAgICAgKi9cbiAgICAjbm9ybWFsaXplUGFyYW1zKHBhcmFtczogdW5rbm93bltdKTogYW55IHtcbiAgICAgICAgaWYgKHBhcmFtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBwYXJhbXMubGVuZ3RoID09PSAxID8gcGFyYW1zWzBdIDogcGFyYW1zO1xuICAgICAgICBcbiAgICAgICAgLy8gQ29udmVydCB1bmRlZmluZWQgdG8gbnVsbCBmb3Igbm9kZTpzcWxpdGUgY29tcGF0aWJpbGl0eVxuICAgICAgICBpZiAodHlwZW9mIG5vcm1hbGl6ZWQgPT09ICdvYmplY3QnICYmIG5vcm1hbGl6ZWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5vcm1hbGl6ZWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQubWFwKHYgPT4gdiA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHYpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9O1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKG5vcm1hbGl6ZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWUgPT09IHVuZGVmaW5lZCA/IG51bGwgOiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUnVucyB0aGUgU1FMIHF1ZXJ5IHdpdGggdGhlIHNwZWNpZmllZCBwYXJhbWV0ZXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNxbCAtIFRoZSBTUUwgc3RhdGVtZW50XG4gICAgICogQHBhcmFtIHBhcmFtcyAtIFBhcmFtZXRlcnMgZm9yIHRoZSBzdGF0ZW1lbnRcbiAgICAgKi9cbiAgICBhc3luYyBydW4oc3FsOiBzdHJpbmcsIC4uLnBhcmFtczogdW5rbm93bltdKTogUHJvbWlzZTxSdW5SZXN1bHQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RtdCA9IHRoaXMuI2dldFN0YXRlbWVudChzcWwpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwID0gdGhpcy4jbm9ybWFsaXplUGFyYW1zKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHAgIT09IHVuZGVmaW5lZCA/IHN0bXQucnVuKHApIDogc3RtdC5ydW4oKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlczogdHlwZW9mIHJlc3VsdC5jaGFuZ2VzID09PSAnYmlnaW50JyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IE51bWJlcihyZXN1bHQuY2hhbmdlcykgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiByZXN1bHQuY2hhbmdlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RJbnNlcnRSb3dpZDogdHlwZW9mIHJlc3VsdC5sYXN0SW5zZXJ0Um93aWQgPT09ICdiaWdpbnQnIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gTnVtYmVyKHJlc3VsdC5sYXN0SW5zZXJ0Um93aWQpIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogcmVzdWx0Lmxhc3RJbnNlcnRSb3dpZFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJ1bnMgdGhlIFNRTCBxdWVyeSBhbmQgcmV0dXJucyB0aGUgZmlyc3QgcmVzdWx0IHJvdy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzcWwgLSBUaGUgU1FMIHN0YXRlbWVudFxuICAgICAqIEBwYXJhbSBwYXJhbXMgLSBQYXJhbWV0ZXJzIGZvciB0aGUgc3RhdGVtZW50XG4gICAgICovXG4gICAgYXN5bmMgZ2V0PFQgPSBhbnk+KHNxbDogc3RyaW5nLCAuLi5wYXJhbXM6IHVua25vd25bXSk6IFByb21pc2U8VCB8IHVuZGVmaW5lZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgc2V0SW1tZWRpYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdG10ID0gdGhpcy4jZ2V0U3RhdGVtZW50KHNxbCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSB0aGlzLiNub3JtYWxpemVQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcCAhPT0gdW5kZWZpbmVkID8gc3RtdC5nZXQocCkgOiBzdG10LmdldCgpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCBhcyBUIHwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJ1bnMgdGhlIFNRTCBxdWVyeSBhbmQgcmV0dXJucyBhbGwgcmVzdWx0IHJvd3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3FsIC0gVGhlIFNRTCBzdGF0ZW1lbnRcbiAgICAgKiBAcGFyYW0gcGFyYW1zIC0gUGFyYW1ldGVycyBmb3IgdGhlIHN0YXRlbWVudFxuICAgICAqL1xuICAgIGFzeW5jIGFsbDxUID0gYW55PihzcWw6IHN0cmluZywgLi4ucGFyYW1zOiB1bmtub3duW10pOiBQcm9taXNlPFRbXT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgc2V0SW1tZWRpYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdG10ID0gdGhpcy4jZ2V0U3RhdGVtZW50KHNxbCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSB0aGlzLiNub3JtYWxpemVQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcCAhPT0gdW5kZWZpbmVkID8gc3RtdC5hbGwocCkgOiBzdG10LmFsbCgpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCBhcyBUW10pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUnVucyB0aGUgU1FMIHF1ZXJ5IHdpdGggdGhlIHNwZWNpZmllZCBwYXJhbWV0ZXJzIGFuZCBjYWxscyB0aGUgY2FsbGJhY2sgb25jZSBmb3IgZWFjaCByZXN1bHQgcm93LlxuICAgICAqIFJldHVybnMgdGhlIG51bWJlciBvZiByb3dzIHByb2Nlc3NlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzcWwgLSBUaGUgU1FMIHN0YXRlbWVudFxuICAgICAqIEBwYXJhbSBwYXJhbXMgLSBQYXJhbWV0ZXJzIGZvciB0aGUgc3RhdGVtZW50XG4gICAgICogQHBhcmFtIGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCByb3dcbiAgICAgKi9cbiAgICBhc3luYyBlYWNoPFQgPSBhbnk+KFxuICAgICAgICBzcWw6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiBhbnksXG4gICAgICAgIGNhbGxiYWNrOiAocm93OiBUKSA9PiB2b2lkXG4gICAgKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RtdCA9IHRoaXMuI2dldFN0YXRlbWVudChzcWwpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVyYXRvciA9IHBhcmFtcyAhPT0gdW5kZWZpbmVkIFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBzdG10Lml0ZXJhdGUocGFyYW1zKSBcbiAgICAgICAgICAgICAgICAgICAgICAgIDogc3RtdC5pdGVyYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsZXQgY291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiBpdGVyYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhyb3cgYXMgVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNvdW50KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJ1bnMgYWxsIFNRTCBxdWVyaWVzIGluIHRoZSBzdXBwbGllZCBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3FsIC0gT25lIG9yIG1vcmUgU1FMIHN0YXRlbWVudHMgc2VwYXJhdGVkIGJ5IHNlbWljb2xvbnNcbiAgICAgKi9cbiAgICBhc3luYyBleGVjKHNxbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBzZXRJbW1lZGlhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI2RiLmV4ZWMoc3FsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJlcGFyZXMgdGhlIFNRTCBzdGF0ZW1lbnQgYW5kIHJldHVybnMgYW4gQXN5bmNTdGF0ZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3FsIC0gVGhlIFNRTCBzdGF0ZW1lbnRcbiAgICAgKiBAcGFyYW0gcGFyYW1zIC0gT3B0aW9uYWwgcGFyYW1ldGVycyB0byBiaW5kIGltbWVkaWF0ZWx5XG4gICAgICovXG4gICAgYXN5bmMgcHJlcGFyZShzcWw6IHN0cmluZywgLi4ucGFyYW1zOiB1bmtub3duW10pOiBQcm9taXNlPEFzeW5jU3RhdGVtZW50PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBzZXRJbW1lZGlhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0bXQgPSB0aGlzLiNkYi5wcmVwYXJlKHNxbCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzeW5jU3RtdCA9IG5ldyBBc3luY1N0YXRlbWVudChzdG10KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHBhcmFtZXRlcnMgcHJvdmlkZWQsIGJpbmQgdGhlbVxuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSB0aGlzLiNub3JtYWxpemVQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGU6IG5vZGU6c3FsaXRlIGF1dG8tYmluZHMgb24gcnVuL2dldC9hbGwsIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UganVzdCBzdG9yZSBmb3IgbGF0ZXIgdXNlXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3luY1N0bXRbJ19iaW5kUGFyYW1zJ10gPSBwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFzeW5jU3RtdCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIGEgU1FMaXRlIGV4dGVuc2lvbi5cbiAgICAgKiBUaGUgZGF0YWJhc2UgbXVzdCBoYXZlIGJlZW4gb3BlbmVkIHdpdGggYWxsb3dFeHRlbnNpb246IHRydWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGF0aCAtIFBhdGggdG8gdGhlIGV4dGVuc2lvbiBsaWJyYXJ5XG4gICAgICogQHBhcmFtIGVudHJ5UG9pbnQgLSBPcHRpb25hbCBlbnRyeSBwb2ludCBuYW1lIChub3Qgc3VwcG9ydGVkIGluIG5vZGU6c3FsaXRlIGN1cnJlbnRseSlcbiAgICAgKi9cbiAgICBhc3luYyBsb2FkRXh0ZW5zaW9uKHBhdGg6IHN0cmluZywgZW50cnlQb2ludD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgc2V0SW1tZWRpYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBOb3RlOiBub2RlOnNxbGl0ZSBkb2Vzbid0IHN1cHBvcnQgZW50cnlQb2ludCBwYXJhbWV0ZXIgeWV0XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI2RiLmxvYWRFeHRlbnNpb24ocGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBBIHRoaW4gd3JhcHBlciBhcm91bmQgU3RhdGVtZW50U3luYyB0aGF0IGV4cG9zZXMgYW4gYXN5bmMgQVBJLlxuICogQ29tcGF0aWJsZSB3aXRoIHByb21pc2VkLXNxbGl0ZTMncyBBc3luY1N0YXRlbWVudCBpbnRlcmZhY2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBBc3luY1N0YXRlbWVudCB7XG4gICAgI3N0YXRlbWVudDogU3RhdGVtZW50U3luYztcbiAgICAjYmluZFBhcmFtcz86IGFueTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBBc3luY1N0YXRlbWVudCBmcm9tIGEgU3RhdGVtZW50U3luYyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RhdGVtZW50IC0gVGhlIFN0YXRlbWVudFN5bmMgb2JqZWN0XG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc3RhdGVtZW50OiBTdGF0ZW1lbnRTeW5jKSB7XG4gICAgICAgIHRoaXMuI3N0YXRlbWVudCA9IHN0YXRlbWVudDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyBUaGUgaW5uZXIgU3RhdGVtZW50U3luYyBvYmplY3RcbiAgICAgKi9cbiAgICBnZXQgaW5uZXIoKTogU3RhdGVtZW50U3luYyB7XG4gICAgICAgIHJldHVybiB0aGlzLiNzdGF0ZW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQmluZHMgcGFyYW1ldGVycyB0byB0aGUgcHJlcGFyZWQgc3RhdGVtZW50LlxuICAgICAqIE5vdGU6IEluIG5vZGU6c3FsaXRlLCBiaW5kaW5nIGhhcHBlbnMgYXV0b21hdGljYWxseSBvbiBydW4vZ2V0L2FsbCxcbiAgICAgKiBzbyB0aGlzIG1ldGhvZCBqdXN0IHN0b3JlcyB0aGUgcGFyYW1zIGZvciBsYXRlciB1c2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byBiaW5kXG4gICAgICovXG4gICAgYXN5bmMgYmluZCguLi5wYXJhbXM6IHVua25vd25bXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jYmluZFBhcmFtcyA9IHBhcmFtc1swXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhcmFtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI2JpbmRQYXJhbXMgPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXNldHMgdGhlIHJvdyBjdXJzb3Igb2YgdGhlIHN0YXRlbWVudC5cbiAgICAgKiBOb3RlOiBub2RlOnNxbGl0ZSBoYW5kbGVzIHRoaXMgYXV0b21hdGljYWxseSwgc28gdGhpcyBpcyBhIG5vLW9wIGZvciBjb21wYXRpYmlsaXR5LlxuICAgICAqL1xuICAgIGFzeW5jIHJlc2V0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gTm8tb3AgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBwcm9taXNlZC1zcWxpdGUzXG4gICAgICAgICAgICAgICAgLy8gbm9kZTpzcWxpdGUgaGFuZGxlcyBzdGF0ZW1lbnQgcmV1c2UgYXV0b21hdGljYWxseVxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5hbGl6ZXMgdGhlIHN0YXRlbWVudC5cbiAgICAgKiBOb3RlOiBub2RlOnNxbGl0ZSBoYW5kbGVzIGNsZWFudXAgYXV0b21hdGljYWxseSwgc28gdGhpcyBpcyBhIG5vLW9wIGZvciBjb21wYXRpYmlsaXR5LlxuICAgICAqL1xuICAgIGFzeW5jIGZpbmFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gTm8tb3AgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBwcm9taXNlZC1zcWxpdGUzXG4gICAgICAgICAgICAgICAgLy8gbm9kZTpzcWxpdGUgaGFuZGxlcyBjbGVhbnVwIGF1dG9tYXRpY2FsbHlcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQmluZHMgcGFyYW1ldGVycyBhbmQgZXhlY3V0ZXMgdGhlIHN0YXRlbWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYXJhbXMgLSBQYXJhbWV0ZXJzIHRvIGJpbmQgKG92ZXJyaWRlcyBhbnkgcHJldmlvdXNseSBib3VuZCBwYXJhbXMpXG4gICAgICovXG4gICAgYXN5bmMgcnVuKC4uLnBhcmFtczogdW5rbm93bltdKTogUHJvbWlzZTxSdW5SZXN1bHQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHA6IGFueTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmFtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwID0gcGFyYW1zLmxlbmd0aCA9PT0gMSA/IHBhcmFtc1swXSA6IHBhcmFtcztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgPSB0aGlzLiNiaW5kUGFyYW1zO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBwICE9PSB1bmRlZmluZWQgPyB0aGlzLiNzdGF0ZW1lbnQucnVuKHApIDogdGhpcy4jc3RhdGVtZW50LnJ1bigpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXM6IHR5cGVvZiByZXN1bHQuY2hhbmdlcyA9PT0gJ2JpZ2ludCcgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBOdW1iZXIocmVzdWx0LmNoYW5nZXMpIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogcmVzdWx0LmNoYW5nZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0SW5zZXJ0Um93aWQ6IHR5cGVvZiByZXN1bHQubGFzdEluc2VydFJvd2lkID09PSAnYmlnaW50JyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IE51bWJlcihyZXN1bHQubGFzdEluc2VydFJvd2lkKSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHJlc3VsdC5sYXN0SW5zZXJ0Um93aWRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCaW5kcyBwYXJhbWV0ZXJzLCBleGVjdXRlcyB0aGUgc3RhdGVtZW50IGFuZCByZXRyaWV2ZXMgdGhlIGZpcnN0IHJlc3VsdCByb3cuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byBiaW5kIChvdmVycmlkZXMgYW55IHByZXZpb3VzbHkgYm91bmQgcGFyYW1zKVxuICAgICAqL1xuICAgIGFzeW5jIGdldDxUID0gYW55PiguLi5wYXJhbXM6IHVua25vd25bXSk6IFByb21pc2U8VCB8IHVuZGVmaW5lZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgc2V0SW1tZWRpYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcDogYW55O1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBwYXJhbXMubGVuZ3RoID09PSAxID8gcGFyYW1zWzBdIDogcGFyYW1zO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHRoaXMuI2JpbmRQYXJhbXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHAgIT09IHVuZGVmaW5lZCA/IHRoaXMuI3N0YXRlbWVudC5nZXQocCkgOiB0aGlzLiNzdGF0ZW1lbnQuZ2V0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0IGFzIFQgfCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQmluZHMgcGFyYW1ldGVycywgZXhlY3V0ZXMgdGhlIHN0YXRlbWVudCBhbmQgcmV0dXJucyBhbGwgcmVzdWx0IHJvd3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFyYW1zIC0gUGFyYW1ldGVycyB0byBiaW5kIChvdmVycmlkZXMgYW55IHByZXZpb3VzbHkgYm91bmQgcGFyYW1zKVxuICAgICAqL1xuICAgIGFzeW5jIGFsbDxUID0gYW55PiguLi5wYXJhbXM6IHVua25vd25bXSk6IFByb21pc2U8VFtdPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBzZXRJbW1lZGlhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwOiBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJhbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHBhcmFtcy5sZW5ndGggPT09IDEgPyBwYXJhbXNbMF0gOiBwYXJhbXM7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwID0gdGhpcy4jYmluZFBhcmFtcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcCAhPT0gdW5kZWZpbmVkID8gdGhpcy4jc3RhdGVtZW50LmFsbChwKSA6IHRoaXMuI3N0YXRlbWVudC5hbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQgYXMgVFtdKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJpbmRzIHBhcmFtZXRlcnMsIGV4ZWN1dGVzIHRoZSBzdGF0ZW1lbnQgYW5kIGNhbGxzIHRoZSBjYWxsYmFjayBmb3IgZWFjaCByZXN1bHQgcm93LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhcmFtcyAtIFBhcmFtZXRlcnMgdG8gYmluZFxuICAgICAqIEBwYXJhbSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggcm93XG4gICAgICovXG4gICAgYXN5bmMgZWFjaDxUID0gYW55PihcbiAgICAgICAgcGFyYW1zOiBhbnksXG4gICAgICAgIGNhbGxiYWNrOiAocm93OiBUKSA9PiB2b2lkXG4gICAgKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlcmF0b3IgPSBwYXJhbXMgIT09IHVuZGVmaW5lZCBcbiAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy4jc3RhdGVtZW50Lml0ZXJhdGUocGFyYW1zKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLiNzdGF0ZW1lbnQuaXRlcmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCByb3cgb2YgaXRlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2socm93IGFzIFQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjb3VudCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=