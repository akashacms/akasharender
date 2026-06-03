
// This processes an AkashaCMS SQL log into a report showing
// the SQL strings which took more than 1 ms to execute.
//
// First step is:
//
//    export AK_PROFILE=sql.txt
//    npx akasharender build config.mjs
//
// The raw SQL query log will appear in the file.  Note that
// this script is hardcoded to take data from sql.txt.
//
// Next step is to run this file.  The report is generated
// into the file sql-processed.txt.

import fs, { promises as fsp } from 'node:fs';
import { Base64 } from 'js-base64';

const readings = await fsp.readFile('sql.txt', 'utf8');

// type sqlPerfData = {
//         total: number,
//         count: number,
//         avg: number
//     }
const sqlData = new Map();
for (const reading of readings.split('\n')) {
    const vals = reading.split('\t');

    let perfData = sqlData.get(vals[0]);
    if (perfData) {
        perfData.total += Number.parseFloat(vals[1]);
        perfData.count ++;
        perfData.avg = perfData.total / perfData.count;
    } else {
        perfData = {
            total: Number.parseFloat(vals[1]),
            count: 1,
            avg: Number.parseFloat(vals[1]),
        };
    }
    sqlData.set(vals[0], perfData);
    // console.log(`${vals[0]}`, perfData);
}

// type sqlPerfData = {
//         sql: string,
//         total: number,
//         count: number,
//         avg: number
//     }
const sqlArray = [];
for (const key of sqlData.keys()) {
    const item = sqlData.get(key);
    // Only look at items with significant execution time
    if (item.avg <= 1) continue;
    sqlArray.push({
        sql: Base64.decode(key),
        total: item.total,
        count: item.count,
        avg: item.avg
    });
}

// TODO insert a sort function.

// This makes an array of items which are
// a readable report format.
const towrite = sqlArray.map(item => {
    return `

${item.sql}
${item.total}\t${item.count}\t${item.avg}`
});
await fsp.writeFile('sql-processed.txt',
            towrite.join('\n'),
            'utf8'
);