/**
 *
 * Copyright 2024-2025 David Herron
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
/**
 * SQL Database support using SQLITE3.
 *
 * What's supported is SQLITE3ORM - a lightweight
 * ORM that runs on top of SQLITE3.
 */
import { Database } from 'sqlite3';
import { SqlDatabase } from 'sqlite3orm';
import { SQ3DataStore } from 'sq3-kv-data-store';
/**
 * Subclass the SqlDatabase so we can expose
 * the underlying SQLITE3 Database object and
 * some useful methods on that class.
 */
export declare class SqlDatabaseChild extends SqlDatabase {
    get _db(): Database;
    loadExtension(filename: string, callback?: (err?: Error | null) => void): Database;
}
export declare const sqdb: SqlDatabaseChild;
export declare function newSQ3DataStore(name: string): SQ3DataStore;
//# sourceMappingURL=sqdb.d.ts.map