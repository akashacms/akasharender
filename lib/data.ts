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

import path from 'node:path';
import { promises as fsp } from 'node:fs';
// import { __dirname } from './index.js';

import { sqdb } from './sqdb.js';

const sql_create_table = await fsp.readFile(
    path.join(
        import.meta.dirname, 'sql', 'data-create-table.sql'
    ),
    'utf-8'
);

const sql_delete_traces = await fsp.readFile(
    path.join(
        import.meta.dirname, 'sql', 'data-delete-traces.sql'
    ),
    'utf-8'
);

const sql_delete_all_traces = await fsp.readFile(
    path.join(
        import.meta.dirname, 'sql', 'data-delete-all-traces.sql'
    ),
    'utf-8'
);

const sql_get_all_traces = await fsp.readFile(
    path.join(
        import.meta.dirname, 'sql', 'data-get-all-traces.sql'
    ),
    'utf-8'
);

class Trace {
    basedir: string;
    fpath: string;
    fullpath?: string;
    renderTo: string;
    stage: string;
    start: string;
    now: string;
}

export async function init() {
    await (await sqdb).run(sql_create_table);
}

/**
 * Support removing items from the saved data.  This is useful
 * when we're rendering the same file multiple times.
 *
 * @param {*} basedir
 * @param {*} fpath
 */
export async function remove(basedir, fpath) {
    try {
        await (await sqdb).run(await sql_delete_traces, {
            $basedir: basedir,
            $fpath:   fpath
        });
    } catch (err) {}
};

export async function removeAll() {
    try {
        await (await sqdb).run(await sql_delete_all_traces);
    } catch (err) {}
};

export async function print() {
    const traces
        = await (await sqdb).all<Trace>(await sql_get_all_traces);

    for (let trace of traces) {
        console.log(`${trace.fullpath} ${trace.renderTo} ${trace.stage} ${(new Date(trace.now).valueOf() - new Date(trace.start).valueOf()) / 1000} seconds`)
    }
};
