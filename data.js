
/**
 *
 * Copyright 2014-2019 David Herron
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

// TODO - write a module to take rendering data and produce a table

const path = require('path');

var traces;

module.exports.init = function() {
    traces = [];
};

module.exports.report = function(basedir, fpath, renderTo, stage, start) {
    if (traces) traces.push({
        file: {
            basedir, fpath, renderTo
        },
        time: {
            stage, start, now: new Date()
        }
    });
};

/**
 * Support removing items from the saved data.  This is useful
 * when we're rendering the same file multiple times.
 *
 * @param {*} basedir
 * @param {*} fpath
 */
module.exports.remove = function(basedir, fpath) {
    traces = traces.filter(item => {
        if (item.file.basedir !== basedir || item.file.fpath !== fpath) {
            return true;
        } else {
            return false;
        }
    });
};

module.exports.removeAll = function() {
    traces = [];
};

module.exports.print = function() {
    if (!traces) return;
    let traces2 = traces.sort((a, b) => {
        let aFile = path.join(a.file.basedir, a.file.fpath);
        let bFile = path.join(b.file.basedir, b.file.fpath);
        if (aFile < bFile) return -1;
        else if (aFile === bFile) return 0;
        else return 1;
    });
    for (let trace of traces2) {
        console.log(`${trace.file.basedir} ${trace.file.fpath} ${trace.file.renderTo} ${trace.time.stage} ${(trace.time.now - trace.time.start) / 1000} seconds`)
    }
};

module.exports.data4file = function(basedir, fpath) {
    let ret = "";
    if (!traces) return ret;
    for (let trace of traces) {
        if (trace.file.basedir === basedir && trace.file.fpath === fpath) {
            ret += `${trace.file.basedir} ${trace.file.fpath} ${trace.file.renderTo} ${trace.time.stage} ${(trace.time.now - trace.time.start) / 1000} seconds\n`;
        }
    }
    return ret;
}
