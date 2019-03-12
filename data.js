
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
