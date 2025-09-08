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
import { Database } from 'sqlite3';
// import sqleanLibs from 'sqlite3-sqlean';
import * as sqlite_regex from "sqlite-regex";

import { SQ3DataStore } from 'sq3-kv-data-store';

import { AsyncDatabase } from 'promised-sqlite3';
import { init } from './data-new.js';

import { default as SQ3QueryLog } from 'sqlite3-query-log';

const dburl = typeof process.env.AK_DB_URL === 'string'
        ? process.env.AK_DB_URL
        : ':memory:';

export const sqdb = await AsyncDatabase.open(dburl);
// await sqdb.open(dburl);
// await sqdb.open('test.db');
// sqdb.loadExtension(sqleanLibs.reLibPath);
sqdb.inner.loadExtension(sqlite_regex.getLoadablePath());

// if (typeof process.env.AK_PROFILE === 'string') {
//     SQ3QueryLog(sqdb.inner, process.env.AK_PROFILE);
// }

await init();

// This traces SQL statements
//
// sqdb.inner.on('trace', sql => {
//     console.log(sql);
// });
sqdb.inner.on('error', err => {
    console.error(err);
});

sqdb.inner.on('error', err => {
    console.error(err);
});

// Profiling SQL queries
// This might be useful for performance evaluation.
// The output is TSV separated fields:
//   1. base64-encoded SQL
//      This was chosen to prevent newlines in this field
//      and to keep the format simple
//   2. Approximate number of milliseconds to execute
//
if (typeof process.env.AK_PROFILE === 'string') {
    SQ3QueryLog(sqdb.inner, process.env.AK_PROFILE);
}

////////////////////////

export function newSQ3DataStore(name: string)
    : SQ3DataStore
{
    // console.log(`newSQ3DataStore ${name}`);
    return new SQ3DataStore(sqdb.inner, name);
}
