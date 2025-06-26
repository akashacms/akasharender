---
layout: ebook-page.html.ejs
title: Using the In-memory SQL+ORM database
---

AkashaRender supports storing data in an in-memory SQL database.  This allows AkashaRender and the plugins to create complex queries on website content.

The database is built on top of SQLITE3 (https://sqlite.org/), the Node-SQLITE3 package (https://www.npmjs.com/package/sqlite3), and a light-weight ORM (https://www.npmjs.com/package/sqlite3orm).

The most common use is to build one or more tables, add/remove/modify data, and make queries.

```js
import {
    BaseDAO, field, schema, table
} from 'sqlite3orm';
import { sqdb } from './sqdb.js';
```

This shows importing some tools from SQLITE3ORM, and accessing the `sqdb` object.  `Sqdb` is an `SqlDatabase` instance open on a `:memory:` database.

Be aware that multiple actors within the AkashaCMS environment will create and use tables.  Take care to leave other tables alone.

```js
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
```

A table is defined this way.  These decorators require coding in TypeScript.

```js
await schema().createTable(sqdb, 'TRACES');
const dao = new BaseDAO<Trace>(Trace, sqdb);
```

This creates a matching database table.  The `dao` object allows ORM-like queries against data in the table.

For example, inserting a data item is this simple:

```js
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
```

SQLITE3ORM also supports access to the SQL layer.  This has not been tested in AkashaRender, but there are examples in their test suite: https://github.com/gms1/HomeOfThings/blob/master/packages/node/sqlite3orm/src/lib/spec/core/SqlStatement.spec.ts

Basically:

* `sqdb.prepare` is for SQL Prepared statements
* `sql.exec` executes SQL statements
* `sql.run` executes SQL statements with the option of inserting parameters


## Saving the in-memory database to disk

Setting the environment variable `AK_DB_URL` to a file-name will cause the database to be saved to that file.  Otherwise the database is solely kept in memory.

## Solely indexing the project content

When the API function `akasha.setup(CONFIG)` is executed, many things happen, including the indexing of all content files.

The CLI tool command `index` solely executes that API function, then executes `akasha.closeCaches()`.  The side effects are that all content files are indexed and the CLI tool exits.

For example:

```shell
$ AK_DB_URL=test.db \
    node ../dist/cli.js index config-normal.mjs 
```

This indexes the content files, and saves the data into the named database file.

You can then use the `sqlite3` program to inspect the database like so:

```shell
$ sqlite3 test.db 
SQLite version 3.37.2 2022-01-06 13:25:41
Enter ".help" for usage hints.
sqlite> .schema
CREATE TABLE IF NOT EXISTS "TRACES" (
  `basedir` TEXT,
  `fpath` TEXT,
  `fullpath` TEXT,
  `renderTo` TEXT,
  `stage` TEXT DEFAULT(datetime('now') || 'Z'),
  `start` TEXT DEFAULT(datetime('now') || 'Z'),
  `now` TEXT DEFAULT(datetime('now') || 'Z')
);
CREATE TABLE IF NOT EXISTS "ASSETS" (
  `vpath` TEXT PRIMARY KEY,
  `mime` TEXT,
  `mounted` TEXT,
  `mountPoint` TEXT,
  `pathInMounted` TEXT,
  `fspath` TEXT,
  `renderPath` TEXT,
  `mtimeMs` TEXT DEFAULT(datetime('now') || 'Z'),
  `info` TEXT
) WITHOUT ROWID;CREATE TABLE IF NOT EXISTS "PARTIALS" (
  `vpath` TEXT PRIMARY KEY,
  `mime` TEXT,
  `mounted` TEXT,
  `mountPoint` TEXT,
  `pathInMounted` TEXT,
  `fspath` TEXT,
  `renderPath` TEXT,
  `mtimeMs` TEXT DEFAULT(datetime('now') || 'Z'),
  `docMetadata` TEXT,
  `docContent` TEXT,
  `docBody` TEXT,
  `metadata` TEXT,
  `info` TEXT
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS "LAYOUTS" (
  `vpath` TEXT PRIMARY KEY,
  `mime` TEXT,
  `mounted` TEXT,
  `mountPoint` TEXT,
  `pathInMounted` TEXT,
  `fspath` TEXT,
  `renderPath` TEXT,
  `mtimeMs` TEXT DEFAULT(datetime('now') || 'Z'),
  `docMetadata` TEXT,
  `docContent` TEXT,
  `docBody` TEXT,
  `metadata` TEXT,
  `info` TEXT
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS "DOCUMENTS" (
  `vpath` TEXT PRIMARY KEY,
  `mime` TEXT,
  `mounted` TEXT,
  `mountPoint` TEXT,
  `pathInMounted` TEXT,
  `fspath` TEXT,
  `renderPath` TEXT,
  `rendersToHTML` INTEGER,
  `dirname` TEXT,
  `mtimeMs` TEXT DEFAULT(datetime('now') || 'Z'),
  `docMetadata` TEXT,
  `metadata` TEXT,
  `info` TEXT
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS "TAGGLUE" (
  `docvpath` string,
  `slug` string,
  CONSTRAINT "tag_docvpath"
    FOREIGN KEY ("docvpath")
    REFERENCES "DOCUMENTS" ("vpath") ON DELETE CASCADE
,
  CONSTRAINT "tag_slug"
    FOREIGN KEY ("slug")
    REFERENCES "TAGS" ("slug") ON DELETE CASCADE

);
CREATE TABLE IF NOT EXISTS "TAGS" (
  `tagname` TEXT,
  `slug` TEXT PRIMARY KEY,
  `description` TEXT
);
sqlite> 
```
