
import { DirsWatcher } from '@akashacms/stacked-dirs';
import path from 'path';
import util from 'util';
import url  from 'url';
import { promises as fs } from 'fs';
import FS from 'fs';
import EventEmitter from 'events';
import { minimatch } from 'minimatch';

import {
    field,
    FieldOpts,
    fk,
    id,
    index,
    table,
    TableOpts,
    SqlDatabase,
    schema,
    BaseDAO
} from 'sqlite3orm';
import { after } from 'utils-decorators';


// import sqlite3 from 'sqlite3';
// const db = new sqlite3.Database(':memory:');

const db = new SqlDatabase();
// opens a memory database in shared mode
await db.open('file:sqlite3orm?mode=memory&cache=shared');
// get the user_version from the database:
const userVersion = await db.getUserVersion();

@table({ name: 'FILES' })
class File {

    @id({
        name: 'file_id',
        dbtype: 'INTEGER PRIMARY KEY AUTOINCREMENT'
    })
    userId /* !: number */;

    @field({
        name: 'name', dbtype: 'TEXT'
    })
    name;

    @field({
        name: 'vpath', dbtype: 'TEXT'
    })
    vpath;
    
    @field({
        name: 'info', dbtype: 'TEXT', isJson: true
    })
    info /* : any */;
}

await schema().createTable(db, 'FILES');

// Make a table to store fsinfo thingies
// db.run(`CREATE TABLE `)

const filesDAO = new BaseDAO(File, db);




const docsWatcher = new DirsWatcher('documents');
const batchmode = true;

docsWatcher.on('ready', async (name) => {
    console.log(`documents ready ${name}`);
    const files = filesDAO.selectAll();
    console.log(files);
    if (batchmode) await close();
})
.on('change', async (name, info) => {
    // console.log(`documents change ${name} ${info.vpath}`, info);
    try {
        // await render(info);
        // const result = await filesDAO.select({
        //     // select: { name: true, vpath: true },
        //     name: { eq: name },
        //     vpath: { eq: info.vpath }
        // });
        // console.log(`change ${name} ${info.vpath} updating result`, result);
        // TODO add info to DB
    } catch (err) {
        console.error(`documents change ERROR `, err.stack);
    }
})
.on('add', async (name, info) => {
    // console.log(`documents add ${name} ${info.vpath}`, info);
    try {
        // await render(info);
        let file = new File();
        file.name = name;
        file.vpath = info.vpath;
        file.info  = info;
        file = await filesDAO.insert(file);

        console.log(`documents add ${name} ${info.vpath}`, file);
        // TODO add info to DB
    } catch (err) {
        console.error(`documents add ERROR `, err.stack);
    }
})
.on('unlink', async (name, info) => {
    console.log(`documents unlink ${name} ${info.vpath}`, info);
    // TODO Convert the path into a path within renderedOutput
    try {
        // await fs.unlink(path.join(renderedOutput, renderedPath(info.vpath)));
        // await filesDAO.delete({
        //     name: { eq: name },
        //     vpath: { eq: info.vpath }
        // });
        // TODO remove info from DB
    } catch (err) {
        console.error(`documents unlink ERROR `, err.stack);
    }
});

// import { dirToWatch } from '@akashacms/stacked-dirs';

const docsDirectories = [
    '/home/david/Projects/akasharender/akasharender/guide'
];
// docsWatcher.watch(docsDirectories);

async function close() {
    await docsWatcher.close();
}


