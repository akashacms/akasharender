/**
 *
 * Copyright 2024 David Herron
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
// import sqleanLibs from 'sqlite3-sqlean';
import * as sqlite_regex from "sqlite-regex";

import { SqlDatabase } from 'sqlite3orm';

/**
 * Subclass the SqlDatabase so we can expose
 * the underlying SQLITE3 Database object and
 * some useful methods on that class.
 */
export class SqlDatabaseChild extends SqlDatabase {
    _db() { return this.db; }

    loadExtension(filename: string, callback?: (err?: Error | null) => void): Database {
        return this.db.loadExtension(filename, callback);
    }
}

const dburl = typeof process.env.AK_DB_URL === 'string'
        ? process.env.AK_DB_URL
        : ':memory:';

// Turns on full stack traces
// SqlDatabase.verbose();
export const sqdb = new SqlDatabaseChild();
await sqdb.open(dburl);
// await sqdb.open('test.db');
// sqdb.loadExtension(sqleanLibs.reLibPath);
sqdb.loadExtension(sqlite_regex.getLoadablePath());

// This traces SQL statements
//
// sqdb.on('trace', sql => {
//     console.log(sql);
// });