---
layout: ebook-page.html.ejs
title: Using the In-memory SQL+ORM database
---

AkashaRender supports storing data in an in-memory SQL database.  AkashaRender uses this to index all documents and other assets, and to run complex queries on website content.

The database is built on top of SQLITE3 (https://sqlite.org/), using the Node-SQLITE3 package (https://www.npmjs.com/package/sqlite3) as wrapped by the `'promised-sqlite3'` package (https://www.npmjs.com/package/promised-sqlite3).

There is one instance of this `AsyncDatabase` object instantiated for use by AkashaRender and any plugin.  This instance is created in `sqdb.ts`, and by default:

* It is an in-memory database (`:memory`) and is therefore ephemeral
* The `sqlite-regex` extension is loaded
* The `PRAGMA journal_mode=WAL;` command has been run
* An `error` listener causes any errors to be printed by `console.error`

By using AsyncDatabase, the functions on this database instance return a Promise and execute asynchronously, as opposed to how the default `sqlite3` package executes synchronously.  Asynchronous functions fit better with the AkashaRender architecture.

Code which wants to use the SQLITE3 database directly should import it as so:

```js
import { sqdb } from 'akasharender/dist/sqdb.js';
```

This object has asynchronous functions as documented in `'promised-sqlite3'`, while `sqdb.inner` has the synchronous functions of the `sqlite3` package.

Be careful because this gives you access to the same tables running AkashaRender.  Before manipulating any of those tables, spend some time reading the code to make sure you know what you're doing.  It's better to use the API exposed by the cache instances.

# Analyzing slow SQLITE3 queries

AkashaRender makes it easy to use `'sqlite3-query-log'` (https://www.npmjs.com/package/sqlite3-query-log) to analyze database performance.  A slow SQL query that's run many times can negatively impact the rendering time for your site.

Set the environment variable `AK_PROFILE` with the file name to which to store logging data.

Before running AkashaRender make sure to delete existing logging data.  Then after running AkashaRender, run the commands described in the package README to analyze the results.

# Key/Value data table supported by AkashaRender

There is also a key/value data store, `sq3-kv-data-store` (https://www.npmjs.com/package/sq3-kv-data-store).  This supports the get/put semantics of a typical key/value data store.  There can be multiple key/value pools.  But, unlike other K/V stores, this also supports storing arbitrary data using Mango/MongoDB-like queries.

First, import this function:

```js
import { newSQ3DataStore } from 'akasharender/dist/sqdb.js';
```

This function creates a K/V data store pool on the database instance, `sqdb.inner`.  Your code should simply do this:

```js
sq3db = newSQ3DataStore('affiliates');
```

Your code can then call the functions described by the package.  The `@akashacms/plugins-affiliates` and `@akashacms/plugins-embeddables` packages both use this feature, and can serve as examples of working code.

# Saving the in-memory database to disk

Setting the environment variable `AK_DB_URL` to a file-name will cause the database to be saved to that file.  Otherwise the database is solely kept in memory, and disappears once AkashaRender exits.

# Solely indexing the project content

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
--- Print out of the schema
sqlite> 
```
