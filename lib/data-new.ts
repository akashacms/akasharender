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

import { sqdb } from './sqdb.js';

class Trace {
    basedir: string;
    fpath: string;
    fullpath?: string;
    renderTo: string;
    stage: string;
    start: string;
    now: string;
}

await (await sqdb).run(`
CREATE TABLE IF NOT EXISTS "TRACES" (
    basedir  TEXT,
    fpath    TEXT,
    fullpath TEXt,
    renderTo TEXT,
    stage    TEXT DEFAULT(datetime('now') || 'Z'),
    start    TEXT DEFAULT(datetime('now') || 'Z'),
    now      TEXT DEFAULT(datetime('now') || 'Z')
) WITHOUT ROWID;
CREATE INDEX "traces_basedir" ON "TRACES" ("basedir");
CREATE INDEX "traces_fpath"   ON "TRACES" ("fpath");
`)

export async function report(
    basedir, fpath, renderTo, stage, start
) {
    const trace    = new Trace();
    trace.basedir  = basedir;
    trace.fpath    = fpath;
    trace.fullpath = path.join(basedir, fpath);
    trace.renderTo = renderTo;
    trace.stage    = stage;
    trace.start    = start;
    trace.now      = new Date().toISOString();
    await (await sqdb).run(`
    INSERT INTO "TRACES"
        (
            basedir,
            fpath,
            fullpath,
            renderTo,
            stage,
            start,
            now
        )
        VALUES
        (
            $basedir,
            $fpath,
            $fullpath,
            $renderTo,
            $stage,
            $start,
            $now
        )
    `, {
        $basedir:  trace.basedir,
        $fpath:    trace.fpath,
        $fullpath: path.join(basedir, fpath),
        $renderTo: trace.renderTo,
        $stage:    trace.stage,
        $start:    trace.start,
        now:       new Date().toISOString()
    });
};

/**
 * Support removing items from the saved data.  This is useful
 * when we're rendering the same file multiple times.
 *
 * @param {*} basedir
 * @param {*} fpath
 */
export async function remove(basedir, fpath) {
    try {
        await (await sqdb).run(`
            DELETE FROM "TRACES"
            WHERE
            basedir = $basedir AND fpath = $fpath
        `, {
            $basedir: basedir,
            $fpath:   fpath
        });
    } catch (err) {}
};

export async function removeAll() {
    try {
        await (await sqdb).run(`
            DELETE FROM "TRACES"
        `);
    } catch (err) {}
};

export async function print() {
    const traces = await (await sqdb).all<Trace>(`
        SELECT * FROM "TRACES"
        ORDER BY fullpath
    `);

    for (let trace of traces) {
        console.log(`${trace.fullpath} ${trace.renderTo} ${trace.stage} ${(new Date(trace.now).valueOf() - new Date(trace.start).valueOf()) / 1000} seconds`)
    }
};

export async function data4file(basedir, fpath) {
    let ret = "";

    const traces = await (await sqdb).all<Trace>(`
        SELECT * FROM "TRACES"
        WHERE 
            basedir = $basedir AND fpath = $fpath
        ORDER BY fullpath
    `, {
        $basedir: basedir,
        $fpath:   fpath
    });

    for (let trace of traces) {
        if (trace.basedir === basedir && trace.fpath === fpath) {
            ret += `${trace.fullpath} ${trace.renderTo} ${trace.stage} ${(new Date(trace.now).valueOf() - new Date(trace.start).valueOf()) / 1000} seconds\n`;
        }
    }
    return ret;
}
