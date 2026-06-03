

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
    BaseDAO,
    Filter,
    Where
} from 'sqlite3orm';


import { sqdb } from "../sqdb.js";

@table({
    name: 'TEST',
    withoutRowId: true
})
class TestDB {

    // Primary key
    @id({
        name: 'vpath', dbtype: 'TEXT'
    })
    @index('asset_vpath')
    vpath: string;

    @field({
        name: 'info', dbtype: 'JSON', isJson: true
    })
    info?: any;
}


await schema().createTable(sqdb, 'TEST');
type TassetsDAO = BaseDAO<TestDB>;
const assetsDAO: TassetsDAO
    = new BaseDAO<TestDB>(TestDB, sqdb);

const fullobj = await assetsDAO.insert({
    vpath: '/path/to/paradise',
    info: {
        fspath: '/path/to/docs/path/to/paradise',
        tags: [
            'Linux',
            'Cell Phone',
            'Pine'
        ]
    }
});

const noinfo = await assetsDAO.insert({
    vpath: 'no info'
});

const notags = await assetsDAO.insert({
    vpath: 'no tags',
    info: {
        fspath: '/path/to/no tags'
    }
});

console.log(await assetsDAO.selectAll({
    info: { isNotNull: true }
}));

// Does not work
//
// Error: select 'TEST' failed: unknown comparison operation: 'tags'
// at QueryModel.selectAll (/home/david/Projects/akasharender/akasharender/node_modules/sqlite3orm/src/lib/query/QueryModel.js:95:35)
// at async file:///home/david/Projects/akasharender/akasharender/dist/cache/tjson.js:58:13
//
// console.log(await assetsDAO.selectAll({
//     info: {
//         tags: {
//             isNotNull: true 
//         }
//     }
// }));

console.log(await assetsDAO.selectAll({}));


console.log(await assetsDAO.select(fullobj));
console.log(await assetsDAO.select(noinfo));
console.log(await assetsDAO.select(notags));

// console.log(await sqdb.run('.schema'));

console.log(await sqdb.all('SELECT * FROM TEST, json_each(TEST.info)'))