/**
 *
 * Copyright 2014-2024 David Herron
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

import {
    BaseDAO, field, schema, table
} from 'sqlite3orm';
import { sqdb } from './sqdb.js';

@table({ name: 'TRACES' })
class Trace {
    @field({ name: 'basedir', dbtype: 'TEXT' })
    basedir: string;

    @field({ name: 'fpath', dbtype: 'TEXT' })
    fpath: string;

    @field({ name: 'fullpath', dbtype: 'TEXT' })
    fullpath: string;

    @field({ name: 'renderTo', dbtype: 'TEXT' })
    renderTo: string;

    @field({
        name: 'stage',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    })
    stage: string;
    
    @field({
        name: 'start',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    })
    start: string;

    @field({
        name: 'now',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    })
    now: string;
    
}

await schema().createTable(sqdb, 'TRACES');
const dao = new BaseDAO<Trace>(Trace, sqdb);

export async function report(basedir, fpath, renderTo, stage, start) {
    const trace    = new Trace();
    trace.basedir  = basedir;
    trace.fpath    = fpath;
    trace.fullpath = path.join(basedir, fpath);
    trace.renderTo = renderTo;
    trace.stage    = stage;
    trace.start    = start;
    trace.now      = new Date().toISOString();
    await dao.insert(trace);
};

/**
 * Support removing items from the saved data.  This is useful
 * when we're rendering the same file multiple times.
 *
 * @param {*} basedir
 * @param {*} fpath
 */
export async function remove(basedir, fpath) {
    await dao.deleteAll({ basedir, fpath });
};

export async function removeAll() {
    await dao.deleteAll({});
};

export async function print() {

    const traces = await dao.selectAll({
        order: { fullpath: true }
    });

    for (let trace of traces) {
        console.log(`${trace.fullpath} ${trace.renderTo} ${trace.stage} ${(new Date(trace.now).valueOf() - new Date(trace.start).valueOf()) / 1000} seconds`)
    }
};

export async function data4file(basedir, fpath) {
    let ret = "";
    const traces = await dao.selectAll({
        where: {
            basedir: { eq: basedir },
            fpath:   { eq: fpath }
        }
    });
    for (let trace of traces) {
        if (trace.basedir === basedir && trace.fpath === fpath) {
            ret += `${trace.basedir} ${trace.fpath} ${trace.renderTo} ${trace.stage} ${(new Date(trace.now).valueOf() - new Date(trace.start).valueOf()) / 1000} seconds\n`;
        }
    }
    return ret;
}
