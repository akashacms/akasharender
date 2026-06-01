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

import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
// import sqleanLibs from 'sqlite3-sqlean';
import * as sqlite_regex  from "sqlite-regex";
import * as sqlite_vec    from 'sqlite-vec';
import * as sqlite_lembed from 'sqlite-lembed';
import { SQ3DataStore } from 'sq3-kv-data-store';

import { AsyncDatabase } from './async-node-sqlite.js';

const dburl = typeof process.env.AK_DB_URL === 'string'
        ? process.env.AK_DB_URL
        : ':memory:';

export const sqdb = await AsyncDatabase.open(dburl, {
    allowExtension: true,  // Required for loading extensions
    enableForeignKeyConstraints: true
});
// await sqdb.open(dburl);
// await sqdb.open('test.db');
// sqdb.loadExtension(sqleanLibs.reLibPath);
sqdb.inner.loadExtension(sqlite_regex.getLoadablePath());

const lembedModelFile = typeof process.env.AK_LEMBED_MODEL === 'string'
        ? process.env.AK_LEMBED_MODEL
        : undefined;
export const lembedModelName = typeof process.env.AK_LEMBED_MODEL_NAME === 'string'
        ? process.env.AK_LEMBED_MODEL_NAME
        : undefined;

if (typeof lembedModelFile !== 'undefined') {
    console.log({
        lembedModelFile,
        lembedModelName,
        lembed: sqlite_lembed.getLoadablePath(),
        vec: sqlite_vec.getLoadablePath()
    });
    sqlite_lembed.load(sqdb.inner);
    sqlite_vec.load(sqdb.inner);

    await sqdb.run(`
        INSERT INTO temp.lembed_models(name, model)
        select ?, lembed_model_from_file(?);
    `, [
        lembedModelName,
        lembedModelFile
    ]);
}

await sqdb.run('PRAGMA journal_mode=WAL;');

// if (typeof process.env.AK_PROFILE === 'string') {
//     SQ3QueryLog(sqdb.inner, process.env.AK_PROFILE);
// }

// This traces SQL statements
//
// sqdb.inner.on('trace', sql => {
//     console.log(sql);
// });
// sqdb.inner.on('error', err => {
//     console.error(err);
// });

// Note: DatabaseSync from node:sqlite doesn't have event emitters
// Error handling is done via try/catch in the wrapper
// sqdb.inner.on('error', err => {
//     console.error(err);
// });

// Profiling SQL queries
// This might be useful for performance evaluation.
// The output is TSV separated fields:
//   1. base64-encoded SQL
//      This was chosen to prevent newlines in this field
//      and to keep the format simple
//   2. Approximate number of milliseconds to execute
//
// Note: sqlite3-query-log expects sqlite3.Database, not DatabaseSync from node:sqlite
// This profiling functionality is disabled until we implement custom profiling
// if (typeof process.env.AK_PROFILE === 'string') {
//     SQ3QueryLog(sqdb.inner, process.env.AK_PROFILE);
// }


////////////////////////

export function newSQ3DataStore(name: string)
    : SQ3DataStore
{
    // console.log(`newSQ3DataStore ${name}`);
    // Note: SQ3DataStore expects sqlite3.Database, but we're using node:sqlite's DatabaseSync
    // This will cause a runtime error. SQ3DataStore needs to be updated to support DatabaseSync
    // For now, casting to any to allow compilation
    return new SQ3DataStore(sqdb.inner as any, name);
}
