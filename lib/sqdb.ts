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
 * SQL Database support using node:sqlite.
 *
 * The database connection is an AsyncDatabase from the
 * promised.node.sqlite package, which wraps the built-in
 * node:sqlite DatabaseSync class with an async API.
 */

import * as sqlite_regex  from "sqlite-regex";
import { SQ3DataStore } from 'sq3-kv-data-store';

import { AsyncDatabase } from 'promised.node.sqlite';

const dburl = typeof process.env.AK_DB_URL === 'string'
        ? process.env.AK_DB_URL
        : ':memory:';

// node:sqlite requires allowExtension:true to permit
// loadExtension, which is used to load sqlite-regex below.
export const sqdb = await AsyncDatabase.open(dburl, {
    allowExtension: true
});

sqdb.inner.loadExtension(sqlite_regex.getLoadablePath());

// Embeddings (sqlite-lembed) and vector search (sqlite-vec)
// are not currently used and have been removed.  The
// lembedModelName export is retained, always undefined,
// so the guarded code paths in schema.ts and
// cache-sqlite.ts continue to compile and stay dormant.
// Re-enabling semantic search requires re-adding the
// sqlite-vec and sqlite-lembed packages and the loader
// calls here.
export const lembedModelName: string | undefined = undefined;

await sqdb.run('PRAGMA journal_mode=WAL;');

// NOTE: SQL query profiling via the AK_PROFILE environment
// variable used the sqlite3-query-log package, which depended
// on sqlite3.Database events.  node:sqlite's DatabaseSync does
// not emit events, so that profiling has been removed.
// See https://github.com/akashacms/akasharender/issues/192


////////////////////////

export function newSQ3DataStore(name: string)
    : SQ3DataStore
{
    // console.log(`newSQ3DataStore ${name}`);
    return new SQ3DataStore(sqdb.inner, name);
}
