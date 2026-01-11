
import { AsyncDatabase } from 'promised-sqlite3';
import SqlString from 'sqlstring-sqlite';

const sql = SqlString.format(`
            SELECT *
            FROM ?
            WHERE 
            vpath = $vpath OR renderPath = $vpath
        `, [ 'DOCUMENTS' ]);

console.log(sql);