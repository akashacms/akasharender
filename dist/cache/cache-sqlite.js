/**
 *
 * Copyright 2014-2025 David Herron
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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BaseCache_instances, _BaseCache_config, _BaseCache_name, _BaseCache_dirs, _BaseCache_is_ready, _BaseCache_db, _BaseCache_dbname, _BaseCache_vfstack, _BaseCache_fExistsInDir, _AssetsCache_insertDocAssets, _AssetsCache_updateDocAssets, _PartialsCache_insertDocPartials, _PartialsCache_updateDocPartials, _LayoutsCache_insertDocLayouts, _LayoutsCache_updateDocLayouts, _DocumentsCache_insertDocDocuments, _DocumentsCache_insertLembedDocuments, _DocumentsCache_updateDocDocuments, _DocumentsCache_updateLembedDocuments, _DocumentsCache_searchSemantic, _DocumentsCache_siblingsSQL, _DocumentsCache_docsForDirname, _DocumentsCache_dirsForParentdir, _DocumentsCache_indexFilesSQL, _DocumentsCache_indexFilesSQLrenderPath, _DocumentsCache_filesForSetTimes, _DocumentsCache_docLinkData;
import FS, { promises as fsp } from 'node:fs';
import { VFStack } from './vfstack.js';
import path from 'node:path';
import util from 'node:util';
import EventEmitter from 'events';
import micromatch from 'micromatch';
import { performance } from 'node:perf_hooks';
import { TagGlue, TagDescriptions } from './tag-glue.js';
import { doCreateAssetsTable, doCreateDocumentsTable, doCreateLayoutsTable, doCreatePartialsTable, doCreateVecDocumentsTable, validateAsset, validateDocument, validateLayout, validatePartial, validatePathsReturnType } from './schema.js';
import SqlString from 'sqlstring-sqlite';
import Cache from 'cache';
import { sqdb, lembedModelName } from '../sqdb.js';
const tglue = new TagGlue();
// tglue.init(sqdb._db);
const tdesc = new TagDescriptions();
// tdesc.init(sqdb._db);
/**
 * Base class for file caches (documents, assets, layouts, partials).
 * Scans directories, stores file information in SQLite database, and emits events.
 *
 * Events emitted:
 * - 'added' (name: string, vpath: string) - Emitted when a file is successfully
 *   added to the cache during initial scan or update. Useful for tracking that
 *   all files are processed before 'ready' is emitted.
 * - 'ready' (name: string) - Emitted when initial directory scan and file
 *   processing is complete. After this event, isReady() will return immediately.
 * - 'error' (error: Error) - Emitted when an error occurs during processing.
 */
export class BaseCache extends EventEmitter {
    /**
     * @param config AkashaRender Configuration object
     * @param name string giving the name for this cache
     * @param db The PROMISED SQLITE3 AsyncDatabase instance to use
     * @param dbname The database name to use
     */
    constructor(config, name, dirs, db, dbname) {
        super();
        _BaseCache_instances.add(this);
        _BaseCache_config.set(this, void 0);
        _BaseCache_name.set(this, void 0);
        _BaseCache_dirs.set(this, void 0);
        _BaseCache_is_ready.set(this, false);
        _BaseCache_db.set(this, void 0);
        _BaseCache_dbname.set(this, void 0);
        _BaseCache_vfstack.set(this, void 0);
        this.findPathMountedSQL = new Map();
        this.findByPathSQL = new Map();
        this.pathsSQL = new Map();
        // console.log(`BaseFileCache ${name} constructor dirs=${util.inspect(dirs)}`);
        __classPrivateFieldSet(this, _BaseCache_config, config, "f");
        __classPrivateFieldSet(this, _BaseCache_name, name, "f");
        __classPrivateFieldSet(this, _BaseCache_dirs, dirs, "f");
        __classPrivateFieldSet(this, _BaseCache_is_ready, false, "f");
        __classPrivateFieldSet(this, _BaseCache_db, db, "f");
        if (dbname !== 'ASSETS'
            && dbname !== 'LAYOUTS'
            && dbname !== 'PARTIALS'
            && dbname !== 'DOCUMENTS') {
            throw new Error(`Illegal database name, must be ASSETS, LAYOUTS, PARTIALS, or DOCUMENTS`);
        }
        __classPrivateFieldSet(this, _BaseCache_dbname, dbname, "f");
    }
    get config() { return __classPrivateFieldGet(this, _BaseCache_config, "f"); }
    get name() { return __classPrivateFieldGet(this, _BaseCache_name, "f"); }
    get dirs() { return __classPrivateFieldGet(this, _BaseCache_dirs, "f"); }
    get db() { return __classPrivateFieldGet(this, _BaseCache_db, "f"); }
    get dbname() { return __classPrivateFieldGet(this, _BaseCache_dbname, "f"); }
    get quotedDBName() {
        return SqlString.escape(__classPrivateFieldGet(this, _BaseCache_dbname, "f"));
    }
    async close() {
        this.removeAllListeners('changed');
        this.removeAllListeners('added');
        this.removeAllListeners('unlinked');
        this.removeAllListeners('ready');
        // NOTE: The database connection is NOT closed here.
        // All four caches (assets, partials, layouts, documents)
        // share the single process-global `sqdb` connection.
        // Closing it per-cache would close the shared connection
        // on the first cache and then throw "database is not open"
        // on the rest.  The shared connection is closed once by
        // closeFileCaches().
    }
    /**
     * Scan the directory stack and populate the database.
     */
    async setup() {
        __classPrivateFieldSet(this, _BaseCache_is_ready, false, "f");
        // Optional indexing profiler, enabled by setting AK_PROFILE_INDEX.
        // Accumulates wall time spent in each phase of indexing so we can
        // see whether indexing time is dominated by file reads (read),
        // metadata parsing (gatherInfoData), DB inserts (insertDocToDB),
        // or plugin hooks (hookFileAdded).  Zero overhead when disabled.
        const profile = !!process.env.AK_PROFILE_INDEX;
        let tScan = 0, tGather = 0, tInsert = 0, tHook = 0;
        let nFiles = 0;
        const now = () => performance.now();
        const scanStart = profile ? now() : 0;
        __classPrivateFieldSet(this, _BaseCache_vfstack, new VFStack(this.name, this.dirs), "f");
        await __classPrivateFieldGet(this, _BaseCache_vfstack, "f").scan();
        if (profile)
            tScan = now() - scanStart;
        // Collect the non-ignored entries once.
        const entries = [];
        for (const vpathData of __classPrivateFieldGet(this, _BaseCache_vfstack, "f")) {
            if (!this.ignoreFile(vpathData)) {
                entries.push(vpathData);
            }
        }
        // Phase 2 (F4): gather metadata and insert into the database within
        // a single transaction per cache.  Without an explicit transaction
        // each db.run is its own implicit commit; wrapping thousands of
        // inserts in one transaction is dramatically faster.  Per-file
        // errors are still caught and logged (preserving prior behaviour);
        // the transaction is committed at the end, or rolled back on a
        // fatal error.
        await this.db.exec('BEGIN');
        try {
            for (const info of entries) {
                try {
                    if (profile) {
                        nFiles++;
                        let t = now();
                        this.gatherInfoData(info);
                        tGather += now() - t;
                        t = now();
                        await this.insertDocToDB(info);
                        tInsert += now() - t;
                        t = now();
                        await this.config.hookFileAdded(this.name, info);
                        tHook += now() - t;
                    }
                    else {
                        this.gatherInfoData(info);
                        await this.insertDocToDB(info);
                        await this.config.hookFileAdded(this.name, info);
                    }
                    // Emit 'added' event to track when files are processed
                    // This helps verify that all files are added before 'ready' is emitted
                    this.emit('added', this.name, info.vpath);
                }
                catch (err) {
                    console.error(`Error gathering info for ${info.vpath}: ${err.message}`);
                }
            }
            await this.db.exec('COMMIT');
        }
        catch (err) {
            // A failure outside the per-file try/catch (e.g. the COMMIT
            // itself) must not leave an open transaction.
            try {
                await this.db.exec('ROLLBACK');
            }
            catch (e) { /* ignore */ }
            throw err;
        }
        if (profile) {
            const f = (n) => (n / 1000).toFixed(3) + 's';
            console.log(`[AK_PROFILE_INDEX] ${this.name}: files=${nFiles} `
                + `scan=${f(tScan)} gatherInfoData=${f(tGather)} `
                + `insertDocToDB=${f(tInsert)} hookFileAdded=${f(tHook)}`);
        }
        __classPrivateFieldSet(this, _BaseCache_is_ready, true, "f");
        this.emit('ready', this.name);
    }
    /**
     * Validate an item, which is expected to be
     * a row from database query results, using
     * one of the validator functions in schema.ts.
     *
     * This function must be subclassed to
     * function correctly.
     *
     * @param row
     */
    validateRow(row) {
        throw new Error(`validateRow must be subclassed`);
    }
    /**
     * Validate an array, which is expected to be
     * database query results, using one of the
     * validator functions in schema.ts.
     *
     * This function must be subclassed to
     * function correctly.
     *
     * @param row
     */
    validateRows(rows) {
        throw new Error(`validateRows must be subclassed`);
    }
    /**
     * Convert fields from the database
     * representation to the form required
     * for execution.
     *
     * The database cannot stores JSON fields
     * as an object structure, but as a serialied
     * JSON string.  Inside AkashaCMS code that
     * object must be an object rather than
     * a string.
     *
     * The object passed as "row" should already
     * have been validated using validateRow.
     *
     * @param row
     */
    cvtRowToObj(row) {
        if (typeof row.info === 'string') {
            row.info = JSON.parse(row.info);
        }
        return row;
    }
    async sqlFormat(fname, params) {
        const sql = SqlString.format(await fsp.readFile(fname), params);
        return sql;
    }
    /**
     * Find an info object based on vpath and mounted.
     *
     * @param vpath
     * @param mounted
     * @returns
     */
    async findPathMounted(vpath, mounted) {
        let sql = this.findPathMountedSQL.get(this.dbname);
        if (!sql) {
            sql = await this.sqlFormat(path.join(import.meta.dirname, 'sql', 'find-path-mounted.sql'), [this.dbname]);
            this.findPathMountedSQL.set(this.dbname, sql);
        }
        const found = await this.db.all(sql, {
            $vpath: vpath,
            $mounted: mounted
        });
        const mapped = new Array();
        for (const item of found) {
            if (typeof item.vpath === 'string'
                && typeof item.mounted === 'string') {
                mapped.push({
                    vpath: item.vpath, mounted: item.mounted
                });
            }
            else {
                throw new Error(`findPathMounted: Invalid object  found in query (${vpath}, ${mounted}) results ${util.inspect(item)}`);
            }
        }
        return mapped;
    }
    /**
     * Find an info object by the vpath.
     *
     * @param vpath
     * @returns
     */
    async findByPath(vpath) {
        const doCaching = this.config.cachingTimeout > 0;
        let cacheKey;
        if (!this.findByPathCache) {
            this.findByPathCache
                = new Cache(this.config.cachingTimeout);
        }
        if (doCaching) {
            cacheKey = JSON.stringify({
                dbname: this.quotedDBName,
                vpath,
            });
            const cached = this.findByPathCache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        // console.log(`findByPath ${this.dao.table.quotedName} ${vpath}`);
        let sql = this.findByPathSQL.get(this.dbname);
        if (!sql) {
            sql = await this.sqlFormat(path.join(import.meta.dirname, 'sql', 'find-by-cache.sql'), [this.dbname]);
            this.findByPathSQL.set(this.dbname, sql);
        }
        let found;
        try {
            found = await this.db.all(sql, {
                $vpath: vpath
            });
        }
        catch (err) {
            console.log(`db.all ${sql}`, err.stack);
            throw err;
        }
        const mapped = this.validateRows(found);
        const ret = mapped.map(item => {
            return this.cvtRowToObj(item);
        });
        if (doCaching && cacheKey) {
            this.findByPathCache.put(cacheKey, ret);
        }
        return ret;
    }
    gatherInfoData(info) {
        // Placeholder which some subclasses
        // are expected to override
        // info.renderPath = info.vpath;
        throw new Error(`gatherInfoData must be overridden`);
    }
    /**
     * Read the textual content for a file being indexed.
     *
     * gatherInfoData is synchronous (because the renderers'
     * parseMetadata is synchronous), so this reads synchronously.
     *
     * NOTE: An earlier attempt (F6) pre-read all files asynchronously
     * into memory before inserting, to overlap disk I/O.  On a large site
     * this held every file's content in memory at once and caused severe
     * GC pressure -- it made indexing ~40x SLOWER, not faster.  It was
     * abandoned.  The synchronous read here, processing one file at a
     * time, keeps the heap small and is fast (the OS page cache makes the
     * reads cheap).  See ARCHITECTURE-performance-review.md.
     *
     * @param info The info object for the file
     * @returns The file content as a UTF-8 string
     */
    fileContentFor(info) {
        return FS.readFileSync(info.fspath, 'utf-8');
    }
    async insertDocToDB(info) {
        throw new Error(`insertDocToDB must be overridden`);
    }
    async updateDocInDB(info) {
        throw new Error(`updateDocInDB must be overridden`);
    }
    /**
     * Allow a caller to wait until the <em>ready</em> event has
     * been sent from the DirsWatcher instance.  This event means the
     * initial indexing has happened.
     */
    async isReady() {
        // If there's no directories, there won't be any files 
        // to load, and no need to wait
        while (__classPrivateFieldGet(this, _BaseCache_dirs, "f").length > 0 && !__classPrivateFieldGet(this, _BaseCache_is_ready, "f")) {
            // This does a 100ms pause
            // That lets us check is_ready every 100ms
            // at very little cost
            // console.log(`!isReady ${this.name} ${this[_symb_dirs].length} ${this[_symb_is_ready]}`);
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(undefined);
                }, 100);
            });
        }
        return true;
    }
    /**
     * Find the directory mount corresponding to the file.
     *
     * @param {*} info
     * @returns
     */
    fileDirMount(info) {
        for (const dir of __classPrivateFieldGet(this, _BaseCache_dirs, "f")) {
            if (info.mountPoint === dir.dest) {
                return dir;
            }
        }
        return undefined;
    }
    /**
     * Should this file be ignored, based on the `ignore` field
     * in the matching `dir` mount entry.
     *
     * @param {*} info
     * @returns
     */
    ignoreFile(info) {
        // console.log(`ignoreFile ${info.vpath}`);
        const dirMount = this.fileDirMount(info);
        // console.log(`ignoreFile ${info.vpath} dirMount ${util.inspect(dirMount)}`);
        let ignore = false;
        if (dirMount) {
            let ignores;
            if (typeof dirMount.ignore === 'string') {
                ignores = [dirMount.ignore];
            }
            else if (Array.isArray(dirMount.ignore)) {
                ignores = dirMount.ignore;
            }
            else {
                ignores = [];
            }
            for (const i of ignores) {
                if (micromatch.isMatch(info.vpath, i))
                    ignore = true;
                // console.log(`dirMount.ignore ${fspath} ${i} => ${ignore}`);
            }
            // if (ignore) console.log(`MUST ignore File ${info.vpath}`);
            // console.log(`ignoreFile for ${info.vpath} ==> ${ignore}`);
            return ignore;
        }
        else {
            // no mount?  that means something strange
            console.error(`No dirMount found for ${info.vpath} / ${info.dirMountedOn}`);
            return true;
        }
    }
    /**
     * Return simple information about each
     * path in the collection.  The return
     * type is an array of PathsReturnType.
     *
     * I found two uses for this function.
     * In copyAssets, the vpath and other
     * simple data is used for copying items
     * to the output directory.
     * In render.ts, the simple fields are
     * used to then call find to retrieve
     * the full information.
     *
     * @param rootPath
     * @returns
     */
    async paths(rootPath) {
        const fcache = this;
        let rootP = rootPath?.startsWith('/')
            ? rootPath?.substring(1)
            : rootPath;
        const doCaching = this.config.cachingTimeout > 0;
        let cacheKey;
        if (doCaching) {
            if (!this.pathsCache) {
                this.pathsCache
                    = new Cache(this.config.cachingTimeout);
            }
            cacheKey = JSON.stringify({
                dbname: this.quotedDBName,
                rootP,
            });
            const cached = this.pathsCache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        let sqlRootP = this.pathsSQL.get(JSON.stringify({
            dbname: this.dbname, rootP: true
        }));
        if (!sqlRootP) {
            sqlRootP = await this.sqlFormat(path.join(import.meta.dirname, 'sql', 'paths-rootp.sql'), [this.dbname]);
            this.pathsSQL.set(this.dbname, sqlRootP);
        }
        let sqlNoRoot = this.pathsSQL.get(JSON.stringify({
            dbname: this.dbname, rootP: false
        }));
        if (!sqlNoRoot) {
            sqlNoRoot = await this.sqlFormat(path.join(import.meta.dirname, 'sql', 'paths-no-root.sql'), [this.dbname]);
            this.pathsSQL.set(this.dbname, sqlNoRoot);
        }
        // This is copied from the older version
        // (LokiJS version) of this function.  It
        // seems meant to eliminate duplicates.
        const vpathsSeen = new Set();
        // Select the fields in PathsReturnType
        const results = (typeof rootP === 'string')
            ? await this.db.all(sqlRootP, {
                $rootP: `${rootP}%`
            })
            : await this.db.all(sqlNoRoot);
        const result2 = new Array();
        for (const item of results) {
            if (fcache.ignoreFile(item)) {
                continue;
            }
            if (vpathsSeen.has(item.vpath)) {
                continue;
            }
            else {
                vpathsSeen.add(item.vpath);
            }
            if (item.mime === null) {
                item.mime = undefined;
            }
            const { error, value } = validatePathsReturnType(item);
            if (error) {
                console.log(`PATHS VALIDATION ${util.inspect(item)}`, error.stack);
                throw error;
            }
            result2.push(value);
        }
        if (doCaching && cacheKey) {
            this.pathsCache.put(cacheKey, result2);
        }
        return result2;
    }
    /**
     * Find the file within the cache.
     *
     * @param _fpath The vpath or renderPath to look for
     * @returns boolean true if found, false otherwise
     */
    async find(_fpath) {
        if (typeof _fpath !== 'string') {
            throw new Error(`find parameter not string ${typeof _fpath}`);
        }
        const fpath = _fpath.startsWith('/')
            ? _fpath.substring(1)
            : _fpath;
        const fcache = this;
        const result1 = await this.findByPath(fpath);
        // const result1 = await this.dao.selectAll({
        //     or: [
        //         { vpath: { eq: fpath }},
        //         { renderPath: { eq: fpath }}
        //     ]
        // } as Filter<T>);
        // console.log(`find ${_fpath} ${fpath} ==> result1 ${util.inspect(result1)} `);
        const result2 = result1.filter(item => {
            return !(fcache.ignoreFile(item));
        });
        // for (const result of result2) {
        //     this.gatherInfoData(result);
        // }
        // console.log(`find ${_fpath} ${fpath} ==> result2 ${util.inspect(result2)} `);
        let ret;
        if (Array.isArray(result2) && result2.length > 0) {
            ret = result2[0];
        }
        else if (Array.isArray(result2) && result2.length <= 0) {
            ret = undefined;
        }
        else {
            ret = result2;
        }
        if (ret) {
            const value = this.cvtRowToObj(this.validateRow(ret));
            return value;
        }
        else {
            return undefined;
        }
        // PROBLEM:
        // the metadata, docMetadata, baseMetadata,
        // and info fields, are stored in
        // the database as strings, but need
        // to be unpacked into objects.
        //
        // Using validateRow or validateRows is
        // useful, but does not convert those
        // fields.
    }
    /**
     * Fulfills the "find" operation not by
     * looking in the database, but by scanning
     * the filesystem using synchronous calls.
     *
     * NOTE: This is used in partialSync
     *
     * @param _fpath
     * @returns
     */
    findSync(_fpath) {
        if (typeof _fpath !== 'string') {
            throw new Error(`find parameter not string ${typeof _fpath}`);
        }
        const fpath = _fpath.startsWith('/')
            ? _fpath.substring(1)
            : _fpath;
        // console.log(`findSync looking for ${fpath} in ${util.inspect(this.#dirs)}`);
        for (const dir of __classPrivateFieldGet(this, _BaseCache_dirs, "f")) {
            if (!(dir?.dest)) {
                console.warn(`findSync bad dirs in ${util.inspect(this.dirs)}`);
            }
            const found = __classPrivateFieldGet(this, _BaseCache_instances, "m", _BaseCache_fExistsInDir).call(this, fpath, dir);
            if (found) {
                // console.log(`findSync ${fpath} found`, found);
                return found;
            }
        }
        return undefined;
    }
}
_BaseCache_config = new WeakMap(), _BaseCache_name = new WeakMap(), _BaseCache_dirs = new WeakMap(), _BaseCache_is_ready = new WeakMap(), _BaseCache_db = new WeakMap(), _BaseCache_dbname = new WeakMap(), _BaseCache_vfstack = new WeakMap(), _BaseCache_instances = new WeakSet(), _BaseCache_fExistsInDir = function _BaseCache_fExistsInDir(fpath, dir) {
    // console.log(`#fExistsInDir ${fpath} ${util.inspect(dir)}`);
    if (dir.dest === '/') {
        const fspath = path.join(dir.src, fpath);
        let fsexists = FS.existsSync(fspath);
        if (fsexists) {
            let stats = FS.statSync(fspath);
            return {
                vpath: fpath,
                renderPath: fpath,
                fspath: fspath,
                mime: undefined,
                mounted: dir.src,
                mountPoint: dir.dest,
                pathInMounted: fpath,
                statsMtime: stats.mtimeMs
            };
        }
        else {
            return undefined;
        }
    }
    let mp = dir.dest.startsWith('/')
        ? dir.dest.substring(1)
        : dir.dest;
    mp = mp.endsWith('/')
        ? mp
        : (mp + '/');
    if (fpath.startsWith(mp)) {
        let pathInMounted = fpath.replace(dir.dest, '');
        let fspath = path.join(dir.src, pathInMounted);
        // console.log(`Checking exist for ${dir.dest} ${dir.src} ${pathInMounted} ${fspath}`);
        let fsexists = FS.existsSync(fspath);
        if (fsexists) {
            let stats = FS.statSync(fspath);
            return {
                vpath: fpath,
                renderPath: fpath,
                fspath: fspath,
                mime: undefined,
                mounted: dir.src,
                mountPoint: dir.dest,
                pathInMounted: pathInMounted,
                statsMtime: stats.mtimeMs
            };
        }
    }
    return undefined;
};
export class AssetsCache extends BaseCache {
    constructor() {
        super(...arguments);
        _AssetsCache_insertDocAssets.set(this, void 0);
        _AssetsCache_updateDocAssets.set(this, void 0);
    }
    validateRow(row) {
        const { error, value } = validateAsset(row);
        if (error) {
            // console.error(`ASSET VALIDATION ERROR for`, row);
            throw error;
        }
        else
            return value;
    }
    validateRows(rows) {
        if (!Array.isArray(rows)) {
            throw new Error(`AssetsCache validateRows must be given an array`);
        }
        const ret = new Array();
        for (const row of rows) {
            ret.push(this.validateRow(row));
        }
        return ret;
    }
    cvtRowToObj(row) {
        if (typeof row.info === 'string') {
            row.info = JSON.parse(row.info);
        }
        return row;
    }
    gatherInfoData(info) {
        if (typeof info.statsMtime === 'number') {
            info.mtimeMs = info.statsMtime;
        }
        if (info.mime === null) {
            info.mime = undefined;
        }
    }
    async insertDocToDB(info) {
        if (!__classPrivateFieldGet(this, _AssetsCache_insertDocAssets, "f")) {
            __classPrivateFieldSet(this, _AssetsCache_insertDocAssets, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-doc-assets.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _AssetsCache_insertDocAssets, "f"), {
            $vpath: info.vpath,
            $mime: info.mime,
            $mounted: info.mounted,
            $mountPoint: info.mountPoint,
            $pathInMounted: info.pathInMounted,
            $fspath: path.join(info.mounted, info.pathInMounted),
            $dirname: path.dirname(info.vpath),
            $mtimeMs: info.mtimeMs,
            $info: JSON.stringify(info)
        });
    }
    async updateDocInDB(info) {
        if (!__classPrivateFieldGet(this, _AssetsCache_updateDocAssets, "f")) {
            __classPrivateFieldSet(this, _AssetsCache_updateDocAssets, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'update-doc-assets.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _AssetsCache_updateDocAssets, "f"), {
            $vpath: info.vpath,
            $mime: info.mime,
            $mounted: info.mounted,
            $mountPoint: info.mountPoint,
            $pathInMounted: info.pathInMounted,
            $fspath: path.join(info.mounted, info.pathInMounted),
            $dirname: path.dirname(info.vpath),
            $mtimeMs: info.mtimeMs,
            $info: JSON.stringify(info)
        });
    }
}
_AssetsCache_insertDocAssets = new WeakMap(), _AssetsCache_updateDocAssets = new WeakMap();
export class PartialsCache extends BaseCache {
    constructor() {
        super(...arguments);
        _PartialsCache_insertDocPartials.set(this, void 0);
        _PartialsCache_updateDocPartials.set(this, void 0);
    }
    validateRow(row) {
        const { error, value } = validatePartial(row);
        if (error)
            throw error;
        else
            return value;
    }
    validateRows(rows) {
        if (!Array.isArray(rows)) {
            throw new Error(`PartialsCache validateRows must be given an array`);
        }
        const ret = new Array();
        for (const row of rows) {
            ret.push(this.validateRow(row));
        }
        return ret;
    }
    cvtRowToObj(row) {
        if (typeof row.info === 'string') {
            row.info = JSON.parse(row.info);
        }
        return row;
    }
    gatherInfoData(info) {
        let renderer = this.config.findRendererPath(info.vpath);
        if (typeof info.statsMtime === 'number') {
            info.mtimeMs = info.statsMtime;
        }
        if (info.mime === null) {
            info.mime = undefined;
        }
        if (renderer) {
            info.rendererName = renderer.name;
            if (renderer.parseMetadata) {
                const rc = renderer.parseMetadata({
                    fspath: info.fspath,
                    content: this.fileContentFor(info)
                });
                // docBody is the parsed body -- e.g. following the frontmatter
                info.docBody = rc.body;
            }
        }
    }
    async insertDocToDB(info) {
        if (!__classPrivateFieldGet(this, _PartialsCache_insertDocPartials, "f")) {
            __classPrivateFieldSet(this, _PartialsCache_insertDocPartials, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-doc-partials.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _PartialsCache_insertDocPartials, "f"), {
            $vpath: info.vpath,
            $mime: info.mime,
            $mounted: info.mounted,
            $mountPoint: info.mountPoint,
            $pathInMounted: info.pathInMounted,
            $fspath: path.join(info.mounted, info.pathInMounted),
            $dirname: path.dirname(info.vpath),
            $mtimeMs: info.mtimeMs,
            $info: JSON.stringify(info),
            $docBody: info.docBody,
            $rendererName: info.rendererName
        });
    }
    async updateDocInDB(info) {
        if (!__classPrivateFieldGet(this, _PartialsCache_updateDocPartials, "f")) {
            __classPrivateFieldSet(this, _PartialsCache_updateDocPartials, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'update-doc-partials.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _PartialsCache_updateDocPartials, "f"), {
            $vpath: info.vpath,
            $mime: info.mime,
            $mounted: info.mounted,
            $mountPoint: info.mountPoint,
            $pathInMounted: info.pathInMounted,
            $fspath: path.join(info.mounted, info.pathInMounted),
            $dirname: path.dirname(info.vpath),
            $mtimeMs: info.mtimeMs,
            $info: JSON.stringify(info),
            $docBody: info.docBody,
            $rendererName: info.rendererName
        });
    }
}
_PartialsCache_insertDocPartials = new WeakMap(), _PartialsCache_updateDocPartials = new WeakMap();
export class LayoutsCache extends BaseCache {
    constructor() {
        super(...arguments);
        _LayoutsCache_insertDocLayouts.set(this, void 0);
        _LayoutsCache_updateDocLayouts.set(this, void 0);
    }
    validateRow(row) {
        const { error, value } = validateLayout(row);
        if (error)
            throw error;
        else
            return value;
    }
    validateRows(rows) {
        if (!Array.isArray(rows)) {
            throw new Error(`LayoutsCache validateRows must be given an array`);
        }
        const ret = new Array();
        for (const row of rows) {
            ret.push(this.validateRow(row));
        }
        return ret;
    }
    cvtRowToObj(row) {
        if (typeof row.info === 'string') {
            row.info = JSON.parse(row.info);
        }
        return row;
    }
    gatherInfoData(info) {
        let renderer = this.config.findRendererPath(info.vpath);
        if (typeof info.statsMtime === 'number') {
            info.mtimeMs = info.statsMtime;
        }
        if (info.mime === null) {
            info.mime = undefined;
        }
        if (renderer) {
            info.rendererName = renderer.name;
            const renderPath = renderer.filePath(info.vpath);
            info.rendersToHTML =
                micromatch.isMatch(renderPath, '**/*.html')
                    || micromatch.isMatch(renderPath, '*.html')
                    ? true : false;
            if (renderer.parseMetadata) {
                const rc = renderer.parseMetadata({
                    fspath: info.fspath,
                    content: this.fileContentFor(info)
                });
                // docBody is the parsed body -- e.g. following the frontmatter
                info.docBody = rc.body;
            }
        }
        else {
            info.rendersToHTML = false;
        }
    }
    async insertDocToDB(info) {
        if (!__classPrivateFieldGet(this, _LayoutsCache_insertDocLayouts, "f")) {
            __classPrivateFieldSet(this, _LayoutsCache_insertDocLayouts, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-doc-layouts.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _LayoutsCache_insertDocLayouts, "f"), {
            $vpath: info.vpath,
            $mime: info.mime,
            $mounted: info.mounted,
            $mountPoint: info.mountPoint,
            $pathInMounted: info.pathInMounted,
            $fspath: path.join(info.mounted, info.pathInMounted),
            $dirname: path.dirname(info.vpath),
            $mtimeMs: info.mtimeMs,
            $info: JSON.stringify(info),
            $rendersToHTML: info.rendersToHTML,
            $docBody: info.docBody,
            $rendererName: info.rendererName
        });
    }
    async updateDocInDB(info) {
        if (!__classPrivateFieldGet(this, _LayoutsCache_updateDocLayouts, "f")) {
            __classPrivateFieldSet(this, _LayoutsCache_updateDocLayouts, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'update-doc-layouts.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _LayoutsCache_updateDocLayouts, "f"), {
            $vpath: info.vpath,
            $mime: info.mime,
            $mounted: info.mounted,
            $mountPoint: info.mountPoint,
            $pathInMounted: info.pathInMounted,
            $fspath: path.join(info.mounted, info.pathInMounted),
            $dirname: path.dirname(info.vpath),
            $mtimeMs: info.mtimeMs,
            $info: JSON.stringify(info),
            $rendersToHTML: info.rendersToHTML,
            $docBody: info.docBody,
            $rendererName: info.rendererName
        });
    }
}
_LayoutsCache_insertDocLayouts = new WeakMap(), _LayoutsCache_updateDocLayouts = new WeakMap();
export class DocumentsCache extends BaseCache {
    constructor() {
        super(...arguments);
        // NOTE: Certain fields are not handled
        // here because they're GENERATED from
        // JSON data.
        //
        //      publicationTime
        //      baseMetadata
        //      metadata
        //      tags
        //      layout
        //      blogtag
        //
        // Those fields are not touched by
        // the insert/update functions because
        // SQLITE3 takes care of it.
        _DocumentsCache_insertDocDocuments.set(this, void 0);
        _DocumentsCache_insertLembedDocuments.set(this, void 0);
        _DocumentsCache_updateDocDocuments.set(this, void 0);
        _DocumentsCache_updateLembedDocuments.set(this, void 0);
        _DocumentsCache_searchSemantic.set(this, void 0);
        _DocumentsCache_siblingsSQL.set(this, void 0);
        _DocumentsCache_docsForDirname.set(this, void 0);
        _DocumentsCache_dirsForParentdir.set(this, void 0);
        _DocumentsCache_indexFilesSQL.set(this, void 0);
        _DocumentsCache_indexFilesSQLrenderPath.set(this, void 0);
        _DocumentsCache_filesForSetTimes.set(this, void 0);
        _DocumentsCache_docLinkData.set(this, void 0);
    }
    validateRow(row) {
        const { error, value } = validateDocument(row);
        if (error) {
            console.error(`DOCUMENT VALIDATION ERROR for ${util.inspect(row)}`, error.stack);
            throw error;
        }
        else
            return value;
    }
    validateRows(rows) {
        if (!Array.isArray(rows)) {
            throw new Error(`DocumentsCache validateRows must be given an array`);
        }
        const ret = new Array();
        for (const row of rows) {
            ret.push(this.validateRow(row));
        }
        return ret;
    }
    cvtRowToObj(row) {
        // console.log(`Documents cvtRowToObj`, row);
        if (typeof row.info === 'string') {
            row.info = JSON.parse(row.info);
        }
        if (typeof row.baseMetadata === 'string') {
            row.baseMetadata
                = JSON.parse(row.baseMetadata);
        }
        if (typeof row.docMetadata === 'string') {
            row.docMetadata
                = JSON.parse(row.docMetadata);
        }
        if (typeof row.metadata === 'string') {
            row.metadata
                = JSON.parse(row.metadata);
        }
        if (typeof row.tags === 'string') {
            row.tags
                = JSON.parse(row.tags);
        }
        return row;
    }
    gatherInfoData(info) {
        info.renderPath = info.vpath;
        info.dirname = path.dirname(info.vpath);
        if (info.dirname === '.')
            info.dirname = '/';
        info.parentDir = path.dirname(info.dirname);
        // find the mounted directory,
        // get the baseMetadata
        for (let dir of this.dirs) {
            if (dir.src === info.mounted) {
                if (dir.baseMetadata) {
                    info.baseMetadata = dir.baseMetadata;
                }
                break;
            }
        }
        if (typeof info.statsMtime === 'number') {
            info.mtimeMs = info.statsMtime;
        }
        if (info.mime === null) {
            info.mime = undefined;
        }
        let renderer = this.config.findRendererPath(info.vpath);
        if (renderer) {
            info.rendererName = renderer.name;
            info.renderPath
                = renderer.filePath(info.vpath);
            info.rendersToHTML =
                micromatch.isMatch(info.renderPath, '**/*.html')
                    || micromatch.isMatch(info.renderPath, '*.html')
                    ? true : false;
            if (renderer.parseMetadata) {
                const rc = renderer.parseMetadata({
                    fspath: info.fspath,
                    content: this.fileContentFor(info)
                });
                // docMetadata is the unmodified metadata/frontmatter
                // in the document
                info.docMetadata = rc.metadata;
                // docContent is the unparsed original content
                // including any frontmatter
                info.docContent = rc.content;
                // docBody is the parsed body -- e.g. following the frontmatter
                info.docBody = rc.body;
                // This is the computed metadata that includes data from 
                // several sources
                info.metadata = {};
                if (!info.docMetadata)
                    info.docMetadata = {};
                // The rest of this is adapted from the old function
                // HTMLRenderer.newInitMetadata
                // For starters the metadata is collected from several sources.
                // 1) the metadata specified in the directory mount where
                //    this document was found
                // 2) metadata in the project configuration
                // 3) the metadata in the document, as captured in docMetadata
                for (let yprop in info.baseMetadata) {
                    // console.log(`initMetadata ${basedir} ${fpath} baseMetadata ${baseMetadata[yprop]}`);
                    info.metadata[yprop] = info.baseMetadata[yprop];
                }
                for (let yprop in this.config.metadata) {
                    info.metadata[yprop] = this.config.metadata[yprop];
                }
                let fmmcount = 0;
                for (let yprop in info.docMetadata) {
                    info.metadata[yprop] = info.docMetadata[yprop];
                    fmmcount++;
                }
                // The rendered version of the content lands here
                info.metadata.content = "";
                // The document object has been useful for 
                // communicating the file path and other data.
                info.metadata.document = {};
                info.metadata.document.basedir = info.mountPoint;
                info.metadata.document.relpath = info.pathInMounted;
                info.metadata.document.relrender = renderer.filePath(info.pathInMounted);
                info.metadata.document.path = info.vpath;
                info.metadata.document.renderTo = info.renderPath;
                // Ensure the <em>tags</em> field is an array
                if (!(info.metadata.tags)) {
                    info.metadata.tags = [];
                }
                else if (typeof (info.metadata.tags) === 'string') {
                    let taglist = [];
                    const re = /\s*,\s*/;
                    info.metadata.tags.split(re).forEach(tag => {
                        taglist.push(tag.trim());
                    });
                    info.metadata.tags = taglist;
                }
                else if (!Array.isArray(info.metadata.tags)) {
                    throw new Error(`FORMAT ERROR - ${info.vpath} has badly formatted tags `, info.metadata.tags);
                }
                info.docMetadata.tags = info.metadata.tags;
                // The root URL for the project
                info.metadata.root_url = this.config.root_url;
                // Compute the URL this document will render to
                if (this.config.root_url) {
                    let uRootUrl = new URL(this.config.root_url, 'http://example.com');
                    uRootUrl.pathname = path.normalize(path.join(uRootUrl.pathname, info.metadata.document.renderTo));
                    info.metadata.rendered_url = uRootUrl.toString();
                }
                else {
                    info.metadata.rendered_url = info.metadata.document.renderTo;
                }
                // info.metadata.rendered_date = info.stats.mtime;
                const parsePublDate = (date) => {
                    const parsed = Date.parse(date);
                    if (!isNaN(parsed)) {
                        info.metadata.publicationDate
                            = new Date(parsed);
                        // info.publicationDate = info.metadata.publicationDate;
                        info.publicationTime
                            = info.metadata.publicationDate.getTime();
                    }
                };
                if (info.docMetadata
                    && typeof info.docMetadata.publDate === 'string') {
                    parsePublDate(info.docMetadata.publDate);
                }
                if (info.docMetadata
                    && typeof info.docMetadata.publicationDate === 'string') {
                    parsePublDate(info.docMetadata.publicationDate);
                }
                if (!info.metadata.publicationDate) {
                    var dateSet = false;
                    if (info.docMetadata
                        && info.docMetadata.publDate) {
                        parsePublDate(info.docMetadata.publDate);
                        dateSet = true;
                    }
                    if (info.docMetadata
                        && typeof info.docMetadata.publicationDate === 'string') {
                        parsePublDate(info.docMetadata.publicationDate);
                        dateSet = true;
                    }
                    if (!dateSet && info.mtimeMs) {
                        info.metadata.publicationDate
                            = new Date(info.mtimeMs);
                        // info.publicationDate = info.metadata.publicationDate;
                        info.publicationTime
                            = info.mtimeMs;
                        // console.log(`${info.vpath} metadata.publicationDate ${info.metadata.publicationDate} set from stats.mtime`);
                    }
                    if (!info.metadata.publicationDate) {
                        info.metadata.publicationDate
                            = new Date();
                        // info.publicationDate = info.metadata.publicationDate;
                        info.publicationTime
                            = info.metadata.publicationDate.getTime();
                        // console.log(`${info.vpath} metadata.publicationDate ${info.metadata.publicationDate} set from current time`);
                    }
                }
            }
        }
        else {
            info.rendersToHTML = false;
            info.docMetadata = {};
            info.docBody = '';
            info.docContent = '';
            info.rendererName = '';
            info.publicationTime = 0;
        }
    }
    async insertDocToDB(info) {
        if (!__classPrivateFieldGet(this, _DocumentsCache_insertDocDocuments, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_insertDocDocuments, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-doc-documents.sql'), 'utf-8'), "f");
        }
        if (!__classPrivateFieldGet(this, _DocumentsCache_insertLembedDocuments, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_insertLembedDocuments, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-lembed-documents.sql'), 'utf-8'), "f");
        }
        // let mtime;
        // if (typeof info.mtimeMs === 'number'
        //  || typeof info.mtimeMs === 'string'
        // ) {
        //     mtime = new Date(info.mtimeMs).toISOString();
        // }
        const toInsert = {
            $vpath: info.vpath,
            $mime: info.mime,
            $mounted: info.mounted,
            $mountPoint: info.mountPoint,
            $pathInMounted: info.pathInMounted,
            $fspath: path.join(info.mounted, info.pathInMounted),
            $dirname: path.dirname(info.vpath),
            $mtimeMs: info.mtimeMs,
            $info: JSON.stringify(info),
            $renderPath: info.renderPath,
            $rendersToHTML: info.rendersToHTML,
            $parentDir: info.parentDir,
            $docMetadata: JSON.stringify(info.docMetadata),
            $docContent: info.docContent,
            $docBody: info.docBody,
            $rendererName: info.rendererName
        };
        // console.log(`insert doc ${info.vpath}`, toInsert);
        await this.db.run(__classPrivateFieldGet(this, _DocumentsCache_insertDocDocuments, "f"), toInsert);
        // if (typeof lembedModelName === 'string') {
        //     console.log({
        //         lembedModelName,
        //         bodyType: typeof info.docBody
        //     });
        // } else {
        //     console.log({
        //         typeName: typeof lembedModelName,
        //         bodyType: typeof info.docBody
        //     })
        // }
        // This handles computing embeddings
        // for the title and body
        if (typeof lembedModelName === 'string'
            // && typeof info.title === 'string'
            && typeof info.docBody === 'string') {
            console.log(__classPrivateFieldGet(this, _DocumentsCache_insertLembedDocuments, "f"), {
                $vpath: info.vpath,
                $lembedModel: lembedModelName,
                // $titleEmbed: info.title,
                $bodyEmbed: info.docBody
            });
            await this.db.run(__classPrivateFieldGet(this, _DocumentsCache_insertLembedDocuments, "f"), {
                $vpath: info.vpath,
                $lembedModel: lembedModelName,
                // $titleEmbed: info.title,
                $bodyEmbed: info.docBody
            });
            console.log(`vec_documents inserted ${info.vpath}`);
        }
        if (info.metadata) {
            // console.log({
            //     vpath: info.vpath,
            //     tags: info.metadata.tags
            // });
            await this.addDocTagGlue(info.vpath, info.metadata.tags);
        }
    }
    async updateDocInDB(info) {
        if (!__classPrivateFieldGet(this, _DocumentsCache_updateDocDocuments, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_updateDocDocuments, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'update-doc-documents.sql'), 'utf-8'), "f");
        }
        if (!__classPrivateFieldGet(this, _DocumentsCache_updateLembedDocuments, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_updateLembedDocuments, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'update-lembed-documents.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _DocumentsCache_updateDocDocuments, "f"), {
            $vpath: info.vpath,
            $mime: info.mime,
            $mounted: info.mounted,
            $mountPoint: info.mountPoint,
            $pathInMounted: info.pathInMounted,
            $fspath: path.join(info.mounted, info.pathInMounted),
            $dirname: path.dirname(info.vpath),
            $mtimeMs: info.mtimeMs,
            $info: JSON.stringify(info),
            $renderPath: info.renderPath,
            $rendersToHTML: info.rendersToHTML,
            $parentDir: info.parentDir,
            $docMetadata: JSON.stringify(info.docMetadata),
            $docContent: info.docContent,
            $docBody: info.docBody,
            $rendererName: info.rendererName
        });
        // This handles computing embeddings
        // for the title and body
        if (typeof lembedModelName === 'string'
            // && typeof info.title === 'string'
            && typeof info.docBody === 'string') {
            await this.db.run(__classPrivateFieldGet(this, _DocumentsCache_updateLembedDocuments, "f"), {
                $vpath: info.vpath,
                $lembedModel: lembedModelName,
                // $titleEmbed: info.title,
                $bodyEmbed: info.docBody
            });
        }
        await tglue.deleteTagGlue(info.vpath);
        if (info.metadata) {
            await tglue.addTagGlue(info.vpath, info.metadata.tags);
        }
    }
    async deleteDocTagGlue(vpath) {
        try {
            await tglue.deleteTagGlue(vpath);
        }
        catch (err) {
            // ignore
            // This can throw an error like:
            // documentsCache ERROR {
            //     code: 'changed',
            //     name: 'documents',
            //     vpath: '_mermaid/render3356739382.mermaid',
            //     error: Error: delete from 'TAGGLUE' failed: nothing changed
            //      ... stack trace
            // }
            // In such a case there is no tagGlue for the document.
            // This "error" is spurious.
            //
            // TODO Is there another query to run that will
            // not throw an error if nothing was changed?
            // In other words, this could hide a legitimate
            // error.
        }
    }
    async addDocTagGlue(vpath, tags) {
        if (typeof tags !== 'string'
            && !Array.isArray(tags)) {
            throw new Error(`addDocTagGlue must be given a tags array, was given: ${util.inspect(tags)}`);
        }
        await tglue.addTagGlue(vpath, Array.isArray(tags)
            ? tags
            : [tags]);
    }
    async addTagDescription(tag, description) {
        return tdesc.addDesc(tag, description);
    }
    async getTagDescription(tag) {
        return tdesc.getDesc(tag);
    }
    async semanticSearchDocs(searchFor) {
        if (!__classPrivateFieldGet(this, _DocumentsCache_searchSemantic, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_searchSemantic, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'doc-search-semantic.sql'), 'utf-8'), "f");
        }
        const results = await this.db.all(__classPrivateFieldGet(this, _DocumentsCache_searchSemantic, "f"), {
            $lembedModel: lembedModelName,
            $searchFor: searchFor
        });
        return results;
    }
    async indexChain(_fpath) {
        const fpath = _fpath.startsWith('/')
            ? _fpath.substring(1)
            : _fpath;
        const parsed = path.parse(fpath);
        const doCaching = this.config.cachingTimeout > 0;
        let cacheKey;
        if (doCaching) {
            if (!this.indexChainCache) {
                this.indexChainCache
                    = new Cache(this.config.cachingTimeout);
            }
            cacheKey = JSON.stringify({
                dbname: this.quotedDBName,
                fpath,
                parsed
            });
            const cached = this.indexChainCache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        // console.log(`indexChain ${_fpath} ${fpath}`, parsed);
        const filez = [];
        const self = await this.findByPath(fpath);
        let fileName = fpath;
        if (Array.isArray(self) && self.length >= 1) {
            filez.push(self[0]);
            fileName = self[0].renderPath;
        }
        let parentDir;
        let dirName = path.dirname(fpath);
        let done = false;
        while (!(dirName === '.' || dirName === parsed.root)) {
            if (path.basename(fileName) === 'index.html') {
                parentDir = path.dirname(path.dirname(fileName));
            }
            else {
                parentDir = path.dirname(fileName);
            }
            let lookFor = path.join(parentDir, "index.html");
            const index = await this.findByPath(lookFor);
            if (Array.isArray(index) && index.length >= 1) {
                filez.push(index[0]);
            }
            fileName = lookFor;
            dirName = path.dirname(lookFor);
        }
        const ret = filez
            .map(function (obj) {
            return {
                title: obj.docMetadata.title,
                vpath: obj.vpath,
                foundDir: obj.mountPoint,
                foundPath: obj.renderPath,
                filename: '/' + obj.renderPath
            };
            // obj.foundDir = obj.mountPoint;
            // obj.foundPath = obj.renderPath;
            // obj.filename = '/' + obj.renderPath;
            // return obj;
        })
            .reverse();
        if (doCaching && cacheKey) {
            this.indexChainCache.put(cacheKey, ret);
        }
        return ret;
    }
    /**
     * Finds all the documents in the same directory
     * as the named file.
     *
     * This doesn't appear to be used anywhere.
     *
     * @param _fpath
     * @returns
     */
    async siblings(_fpath) {
        let vpath = _fpath.startsWith('/')
            ? _fpath.substring(1)
            : _fpath;
        let dirname = path.dirname(vpath);
        const doCaching = this.config.cachingTimeout > 0;
        let cacheKey;
        if (doCaching) {
            if (!this.siblingsCache) {
                this.siblingsCache
                    = new Cache(this.config.cachingTimeout);
            }
            cacheKey = JSON.stringify({
                dbname: this.quotedDBName,
                vpath,
                dirname
            });
            const cached = this.siblingsCache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        if (!__classPrivateFieldGet(this, _DocumentsCache_siblingsSQL, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_siblingsSQL, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'siblings.sql'), 'utf-8'), "f");
        }
        const siblings = await this.db.all(__classPrivateFieldGet(this, _DocumentsCache_siblingsSQL, "f"), {
            $dirname: dirname,
            $vpath: vpath
        });
        const ignored = siblings.filter(item => {
            return !this.ignoreFile(item);
        });
        const mapped = this.validateRows(ignored);
        const ret = mapped.map(item => {
            return this.cvtRowToObj(item);
        });
        if (doCaching && cacheKey) {
            this.siblingsCache.put(cacheKey, ret);
        }
        return ret;
    }
    /**
     * Returns a tree of items starting from the document
     * named in _rootItem.  The parameter should be an
     * actual document in the tree, such as `path/to/index.html`.
     * The return is a tree-shaped set of objects like the following;
     *
  tree:
    rootItem: folder/folder/index.html
    dirname: folder/folder
    items:
        - vpath: folder/folder/index.html.md
          renderPath: folder/folder/index.html
    childFolders:
        - dirname: folder/folder/folder
          children:
              rootItem: folder/folder/folder/index.html
              dirname: folder/folder/folder
              items:
                - vpath: folder/folder/folder/index.html.md
                  renderPath: folder/folder/folder/index.html
                - vpath: folder/folder/folder/page1.html.md
                  renderPath: folder/folder/folder/page1.html
                - vpath: folder/folder/folder/page2.html.md
                  renderPath: folder/folder/folder/page2.html
              childFolders: []
        - dirname: folder/folder/folder2
          children:
              rootItem: folder/folder/folder2/index.html
              dirname: folder/folder/folder2
              items:
                - vpath: folder/folder/folder2/index.html.md
                  renderPath: folder/folder/folder2/index.html
                - vpath: folder/folder/folder2/page1.html.md
                  renderPath: folder/folder/folder2/page1.html
                - vpath: folder/folder/folder2/page2.html.md
                  renderPath: folder/folder/folder2/page2.html
              childFolders: []
     *
     * The objects under `items` are actully the full Document object
     * from the cache, but for the interest of compactness most of
     * the fields have been deleted.
     *
     * @param _rootItem
     * @returns
     */
    async childItemTree(_rootItem) {
        // console.log(`childItemTree ${_rootItem}`);
        let rootItem = await this.find(_rootItem.startsWith('/')
            ? _rootItem.substring(1)
            : _rootItem);
        if (!rootItem) {
            // console.warn(`childItemTree no rootItem found for path ${_rootItem}`);
            return undefined;
        }
        if (!(typeof rootItem === 'object')
            || !('vpath' in rootItem)) {
            // console.warn(`childItemTree found invalid object for ${_rootItem} - ${util.inspect(rootItem)}`);
            return undefined;
        }
        let dirname = path.dirname(rootItem.vpath);
        if (!__classPrivateFieldGet(this, _DocumentsCache_docsForDirname, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_docsForDirname, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'docs-for-dirname.sql'), 'utf-8'), "f");
        }
        // Picks up everything from the current level.
        // Differs from siblings by getting everything.
        const _items = await this.db.all(__classPrivateFieldGet(this, _DocumentsCache_docsForDirname, "f"), {
            $dirname: dirname
        });
        const items = this.validateRows(_items)
            .map(item => {
            return this.cvtRowToObj(item);
        });
        if (!__classPrivateFieldGet(this, _DocumentsCache_dirsForParentdir, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_dirsForParentdir, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'dirs-for-parentdir.sql'), 'utf-8'), "f");
        }
        const _childFolders = await this.db.all(__classPrivateFieldGet(this, _DocumentsCache_dirsForParentdir, "f"), {
            $dirname: dirname
        });
        const childFolders = new Array();
        for (const cf of _childFolders) {
            if (typeof cf.dirname === 'string') {
                childFolders.push({
                    dirname: cf.dirname
                });
            }
            else {
                throw new Error(`childItemTree(${_rootItem}) no dirname fields in childFolders`);
            }
        }
        const cfs = [];
        for (const cf of childFolders) {
            cfs.push(await this.childItemTree(path.join(cf.dirname, 'index.html')));
        }
        return {
            rootItem,
            dirname,
            items: items,
            // Uncomment this to generate simplified output
            // for debugging.
            // .map(item => {
            //     return {
            //         vpath: item.vpath,
            //         renderPath: item.renderPath
            //     }
            // }),
            childFolders: cfs
        };
    }
    /**
     * Find the index files (renders to index.html)
     * within the named subtree.
     *
     * It appears this was written for booknav.
     * But, it appears that booknav does not
     * use this function.
     *
     * @param rootPath
     * @returns
     */
    async indexFiles(rootPath) {
        let rootP = rootPath?.startsWith('/')
            ? rootPath?.substring(1)
            : rootPath;
        if (!__classPrivateFieldGet(this, _DocumentsCache_indexFilesSQL, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_indexFilesSQL, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'index-doc-files.sql'), 'utf-8'), "f");
        }
        if (!__classPrivateFieldGet(this, _DocumentsCache_indexFilesSQLrenderPath, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_indexFilesSQLrenderPath, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'index-doc-files-renderPath.sql'), 'utf-8'), "f");
        }
        const indexes = (typeof rootP === 'string'
            && rootP.length >= 1)
            ? await this.db.all(__classPrivateFieldGet(this, _DocumentsCache_indexFilesSQLrenderPath, "f"), { $rootP: `${rootP}%` })
            : await this.db.all(__classPrivateFieldGet(this, _DocumentsCache_indexFilesSQL, "f"));
        const mapped = this.validateRows(indexes);
        return mapped.map(item => {
            return this.cvtRowToObj(item);
        });
        // It's proved difficult to get the regexp
        // to work in this mode:
        //
        // return await this.search({
        //     rendersToHTML: true,
        //     renderpathmatch: /\/index.html$/,
        //     rootPath: rootPath
        // });
    }
    /**
     * For every file in the documents cache,
     * set the access and modifications.
     *
     * This is used from cli.ts docs-set-dates
     *
     * ????? Why would this be useful?
     * I can see doing this for the rendered
     * files in the output directory.  But this is
     * for the files in the documents directories. ????
     */
    async setTimes() {
        // The SELECT below produces row objects per
        // this interface definition.  This function looks
        // for a valid date from the document metadata,
        // and ensures the fspath file is set to that date.
        //
        // As said in the comment above.... WHY?
        // I can understand doing this for the rendered output.
        // For what purpose did I create this function?
        const setter = (row) => {
            let parsed = NaN;
            if (row.publDate) {
                parsed = Date.parse(row.publDate);
            }
            else if (row.publicationDate) {
                parsed = Date.parse(row.publicationDate);
            }
            else if (row.publicationTime) {
                parsed = row.publicationTime;
            }
            if (!isNaN(parsed)) {
                const dp = new Date(parsed);
                FS.utimesSync(row.fspath, dp, dp);
            }
        };
        if (!__classPrivateFieldGet(this, _DocumentsCache_filesForSetTimes, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_filesForSetTimes, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'files-for-settimes.sql'), 'utf-8'), "f");
        }
        await this.db.each(__classPrivateFieldGet(this, _DocumentsCache_filesForSetTimes, "f"), {}, (row) => {
            if (row.publDate
                || row.publicationDate
                || row.publicationTime) {
                setter(row);
            }
        });
    }
    // This was written for tagged-content
    async documentsWithTag(tagnm) {
        let tags;
        if (typeof tagnm === 'string') {
            tags = [tagnm];
        }
        else if (Array.isArray(tagnm)) {
            tags = tagnm;
        }
        else {
            throw new Error(`documentsWithTag given bad tags array ${util.inspect(tagnm)}`);
        }
        // Correctly handle tag strings with
        // varying quotes.  A document might have these tags:
        //
        //    tags:
        //    - Teaser's
        //    - Teasers
        //    - Something "quoted"
        //
        // These SQL queries work:
        //
        // sqlite> select * from TAGGLUE where tagName IN ( 'Something "quoted"', "Teaser's" );
        // teaser-content.html.md|Teaser's
        // teaser-content.html.md|Something "quoted"
        // sqlite> select * from TAGGLUE where tagName IN ( 'Something "quoted"', 'Teaser''s' );
        // teaser-content.html.md|Teaser's
        // teaser-content.html.md|Something "quoted"
        //
        // But, this does not:
        //
        // sqlite> select * from TAGGLUE where tagName = 'Teaser's';
        // '  ...> 
        //
        // The original code behavior was this:
        //
        // $ node ../dist/cli.js docs-with-tag config-normal.mjs "Teaser's"
        // docs-with-tags command ERRORED Error: SQLITE_ERROR: near "s": syntax error
        //
        // An attempted fix:
        // $ node ../dist/cli.js docs-with-tag config-normal.mjs "Teaser's"
        // documentsWithTag [ "Teaser's" ]  ( 'Teaser\'s' ) 
        // docs-with-tags command ERRORED Error: SQLITE_ERROR: near "s": syntax error
        //
        // Another attempted fix:
        // $ node ../dist/cli.js docs-with-tag config-normal.mjs "Teaser's"
        // documentsWithTag [ "Teaser's" ]  ( "Teaser''s" ) 
        // []
        // []
        //
        // And:
        // $ node ../dist/cli.js docs-with-tag config-normal.mjs 'Something "quoted"'
        // documentsWithTag [ 'Something "quoted"' ]  ( "Something "quoted"" ) 
        // docs-with-tags command ERRORED Error: SQLITE_ERROR: near "quoted": syntax error
        //
        // The code below produces:
        // $ node ../dist/cli.js docs-with-tag config-normal.mjs "Teaser's" 'Something "quoted"'
        // documentsWithTag [ "Teaser's", 'Something "quoted"' ]  ( 'Teaser''s','Something "quoted"' ) 
        // [ { vpath: 'teaser-content.html.md' } ]
        // [ 'teaser-content.html.md' ]
        // console.log(`documentsWithTag ${util.inspect(tags)} ${tagstring}`);
        const vpaths = await tglue.pathsForTag(tags);
        // console.log(vpaths);
        if (!Array.isArray(vpaths)) {
            throw new Error(`documentsWithTag non-Array result ${util.inspect(vpaths)}`);
        }
        return vpaths;
    }
    /**
     * Get an array of tags used by all documents.
     * This uses the JSON extension to extract
     * the tags from the metadata object.
     *
     * @returns
     */
    async tags() {
        const tags = await tglue.tags();
        const ret = Array.from(tags);
        return ret.sort((a, b) => {
            var tagA = a.toLowerCase();
            var tagB = b.toLowerCase();
            if (tagA < tagB)
                return -1;
            if (tagA > tagB)
                return 1;
            return 0;
        });
    }
    /**
     * Find groups of similar tags based on case-insensitive matching,
     * plural/singular variants, and Levenshtein distance.
     *
     * @param threshold - Maximum Levenshtein distance to consider tags similar (default: 2)
     * @returns Array of SimilarTagGroup objects
     */
    async findSimilarTags(threshold = 2) {
        return await tglue.findSimilarTags(threshold);
    }
    /**
     * Find tags that have no description in the TAGDESCRIPTION table.
     *
     * @returns Array of TagWithoutDescription objects
     */
    async tagsWithoutDescriptions() {
        return await tglue.tagsWithoutDescriptions();
    }
    /**
     * Find tag descriptions that are defined but not used by any document.
     *
     * @returns Array of tag names
     */
    async unusedTagDescriptions() {
        return await tdesc.unusedTagDescriptions();
    }
    /**
     * Retrieve the data for an internal link
     * within the site documents.  Forming an
     * internal link is at a minimum the rendered
     * path for the document and its title.
     * The teaser, if available, can be used in
     * a tooltip. The thumbnail is an image that
     * could be displayed.
     *
     * @param vpath
     * @returns
     */
    async docLinkData(vpath) {
        if (!__classPrivateFieldGet(this, _DocumentsCache_docLinkData, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_docLinkData, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'doc-link-data.sql'), 'utf-8'), "f");
        }
        const found = await this.db.all(__classPrivateFieldGet(this, _DocumentsCache_docLinkData, "f"), {
            $vpath: vpath
        });
        if (Array.isArray(found)) {
            const doc = found[0];
            // if (!doc.metadata) {
            //     console.warn(`WARNING docLinkData no metadata for ${vpath}`);
            // }
            // const docInfo = await this.find(vpath);
            return {
                vpath,
                renderPath: doc.renderPath,
                title: doc.title,
                teaser: doc.teaser,
                // thumbnail
            };
        }
        else {
            return {
                vpath,
                renderPath: undefined,
                title: undefined
            };
        }
    }
    /**
     * Perform descriptive search operations using direct SQL queries
     * for better performance and scalability.
     *
     * @param options Search options object
     * @returns Promise<Array<Document>>
     */
    async search(options) {
        const fcache = this;
        if (!this.searchCache) {
            this.searchCache = new Cache(this.config.cachingTimeout);
        }
        // First, see if the search results are already
        // computed and in the cache.
        // The issue here is that the options
        // object can contain RegExp values.
        // The RegExp object does not have
        // a toJSON function.  This hook
        // causes RegExp to return the
        // .toString() value instead.
        //
        // Source: https://stackoverflow.com/questions/20276531/stringifying-a-regular-expression
        //
        // A similar issue exists with Functions
        // in the object.
        //
        // Source: https://stackoverflow.com/questions/6754919/json-stringify-function
        const cacheKey = JSON.stringify(options, function (key, value) {
            if (value instanceof RegExp) {
                return value.toString();
            }
            else if (typeof value === 'function') {
                return value + ''; // implicitly `toString` it
            }
            else {
                return value;
            }
        });
        // A timeout of 0 means to disable caching
        const cached = this.config.cachingTimeout > 0
            ? this.searchCache.get(cacheKey)
            : undefined;
        // console.log(`search ${util.inspect(options)} ==> ${cacheKey} ${cached ? 'hasCached' : 'noCached'}`);
        // If the cache has an entry, skip computing
        // anything.
        if (cached) { // 1 minute cache
            return cached;
        }
        // NOTE: Entries are added to the cache at the bottom
        // of this function
        try {
            const { sql, params } = this.buildSearchQuery(options);
            // console.log(`search ${sql}`);
            const results = await this.db.all(sql, params);
            const documents = this.validateRows(results)
                .map(item => {
                return this.cvtRowToObj(item);
            });
            // Apply post-SQL filters that can't be done in SQL
            let filteredResults = documents;
            // Filter by renderers (requires config lookup)
            if (options.renderers
                && Array.isArray(options.renderers)) {
                filteredResults = filteredResults.filter(item => {
                    let renderer = fcache.config.findRendererPath(item.vpath);
                    if (!renderer)
                        return false;
                    let found = false;
                    for (const r of options.renderers) {
                        if (typeof r === 'string' && r === renderer.name) {
                            found = true;
                        }
                        else if (typeof r === 'object' || typeof r === 'function') {
                            console.error('WARNING: Matching renderer by object class is no longer supported', r);
                        }
                    }
                    return found;
                });
            }
            // Apply custom filter function
            if (options.filterfunc) {
                filteredResults = filteredResults.filter(item => {
                    return options.filterfunc(fcache.config, options, item);
                });
            }
            // Apply custom sort function (if SQL sorting wasn't used)
            if (typeof options.sortFunc === 'function') {
                filteredResults = filteredResults.sort(options.sortFunc);
            }
            // Add the results to the cache
            if (this.config.cachingTimeout > 0) {
                this.searchCache.put(cacheKey, filteredResults);
            }
            return filteredResults;
        }
        catch (err) {
            throw new Error(`DocumentsFileCache.search error: ${err.message}`);
        }
    }
    /**
     * Build SQL query and parameters for search options
     */
    buildSearchQuery(options) {
        const params = {};
        const whereClauses = [];
        const joins = [];
        let paramCounter = 0;
        // console.log(`buildSearchQuery ${util.inspect(options)}`);
        // Helper to create unique parameter names
        const addParam = (value) => {
            const paramName = `$param${++paramCounter}`;
            params[paramName] = value;
            return paramName;
        };
        // Base query
        let sql = `
            SELECT DISTINCT d.* FROM ${this.quotedDBName} d
        `;
        // MIME type filtering
        if (options.mime) {
            if (typeof options.mime === 'string') {
                whereClauses.push(`d.mime = ${addParam(options.mime)}`);
            }
            else if (Array.isArray(options.mime)) {
                const placeholders = options.mime.map(mime => addParam(mime)).join(', ');
                whereClauses.push(`d.mime IN (${placeholders})`);
            }
        }
        // Renders to HTML filtering
        if (typeof options.rendersToHTML === 'boolean') {
            whereClauses.push(`d.rendersToHTML = ${addParam(options.rendersToHTML ? 1 : 0)}`);
        }
        // Root path filtering
        if (typeof options.rootPath === 'string') {
            whereClauses.push(`d.renderPath LIKE ${addParam(options.rootPath + '%')}`);
        }
        // Glob pattern matching
        if (options.glob && typeof options.glob === 'string') {
            const escapedGlob = options.glob.indexOf("'") >= 0
                ? options.glob.replaceAll("'", "''")
                : options.glob;
            whereClauses.push(`d.vpath GLOB ${addParam(escapedGlob)}`);
        }
        // Render glob pattern matching
        if (options.renderglob && typeof options.renderglob === 'string') {
            const escapedGlob = options.renderglob.indexOf("'") >= 0
                ? options.renderglob.replaceAll("'", "''")
                : options.renderglob;
            whereClauses.push(`d.renderPath GLOB ${addParam(escapedGlob)}`);
        }
        // Blog tag filtering
        // Ensure that the blogtags array is used,
        // if present, with the blogtag value used
        // otherwise.
        //
        // The purpose for the blogtags value is to
        // support a pseudo-blog made of the items
        // from multiple actual blogs.
        // if (typeof options.blogtags !== 'undefined'
        //  || typeof options.blogtag !== 'undefined'
        // ) {
        //     console.log(` blogtags ${util.inspect(options.blogtags)} blogtag ${util.inspect(options.blogtag)}`);
        // }
        if (Array.isArray(options.blogtags)) {
            const placeholders = options.blogtags.map(tag => addParam(tag)).join(', ');
            whereClauses.push(`d.blogtag IN (${placeholders})`);
            // console.log(`d.blogtag IN (${placeholders})`);
        }
        else if (typeof options.blogtag === 'string') {
            whereClauses.push(`d.blogtag = ${addParam(options.blogtag)}`);
            // console.log(`d.blogtag = ${options.blogtag}`);
        }
        else if (typeof options.blogtags === 'string') {
            throw new Error(`search ERROR invalid blogtags array ${util.inspect(options.blogtags)}`);
        }
        // Tag filtering using TAGGLUE table
        if (options.tag && typeof options.tag === 'string') {
            joins.push(`INNER JOIN TAGGLUE tg ON d.vpath = tg.docvpath`);
            whereClauses.push(`tg.tagName = ${addParam(options.tag)}`);
        }
        // Layout filtering
        if (options.layouts) {
            if (Array.isArray(options.layouts)) {
                if (options.layouts.length === 1) {
                    whereClauses.push(`d.layout = ${addParam(options.layouts[0])}`);
                }
                else if (options.layouts.length > 1) {
                    const placeholders = options.layouts.map(layout => addParam(layout)).join(', ');
                    whereClauses.push(`d.layout IN (${placeholders})`);
                }
            }
            else {
                whereClauses.push(`d.layout = ${addParam(options.layouts)}`);
            }
        }
        // Path regex matching
        const regexClauses = [];
        if (typeof options.pathmatch === 'string') {
            regexClauses.push(`d.vpath regexp ${addParam(options.pathmatch)}`);
        }
        else if (options.pathmatch instanceof RegExp) {
            regexClauses.push(`d.vpath regexp ${addParam(options.pathmatch.source)}`);
        }
        else if (Array.isArray(options.pathmatch)) {
            for (const match of options.pathmatch) {
                if (typeof match === 'string') {
                    regexClauses.push(`d.vpath regexp ${addParam(match)}`);
                }
                else if (match instanceof RegExp) {
                    regexClauses.push(`d.vpath regexp ${addParam(match.source)}`);
                }
                else {
                    throw new Error(`search ERROR invalid pathmatch regexp ${util.inspect(match)}`);
                }
            }
        }
        else if ('pathmatch' in options) {
            throw new Error(`search ERROR invalid pathmatch ${util.inspect(options.pathmatch)}`);
        }
        // Render path regex matching
        // if (typeof options.renderpathmatch !== 'undefined') {
        //     console.log(util.inspect(options.renderpathmatch, false, 3));
        // }
        if (typeof options.renderpathmatch === 'string') {
            // console.log(`d.renderPath regexp string ${options.renderpathmatch}`);
            regexClauses.push(`d.renderPath regexp ${addParam(options.renderpathmatch)}`);
        }
        else if (options.renderpathmatch instanceof RegExp) {
            // console.log(`d.renderPath regexp regexp ${options.renderpathmatch.source}`);
            regexClauses.push(`d.renderPath regexp ${addParam(options.renderpathmatch.source)}`);
        }
        else if (Array.isArray(options.renderpathmatch)) {
            for (const match of options.renderpathmatch) {
                if (typeof match === 'string') {
                    // console.log(`d.renderPath regexp array string ${match}`);
                    regexClauses.push(`d.renderPath regexp ${addParam(match)}`);
                }
                else if (match instanceof RegExp) {
                    // console.log(`d.renderPath regexp array regexp ${match.source}`);
                    regexClauses.push(`d.renderPath regexp ${addParam(match.source)}`);
                }
                else {
                    throw new Error(`search ERROR invalid renderpathmatch regexp ${util.inspect(match)}`);
                }
            }
        }
        else if ('renderpathmatch' in options) {
            throw new Error(`search ERROR invalid renderpathmatch ${util.inspect(options.renderpathmatch)}`);
        }
        if (regexClauses.length > 0) {
            whereClauses.push(`(${regexClauses.join(' OR ')})`);
        }
        // Add JOINs to query
        if (joins.length > 0) {
            sql += ' ' + joins.join(' ');
        }
        // Add WHERE clause
        if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
        }
        // Add ORDER BY clause
        let orderBy = '';
        if (typeof options.sortBy === 'string') {
            // Handle special cases that need JSON extraction or complex logic
            if (options.sortBy === 'publicationDate'
                || options.sortBy === 'publicationTime') {
                // Use COALESCE to handle null publication dates
                orderBy = `ORDER BY COALESCE(
                    d.publicationTime,
                    d.mtimeMs
                )`;
            }
            else {
                // For all other fields, sort by the column directly
                // This allows sorting by any valid column in the DOCUMENTS table
                orderBy = `ORDER BY d.${SqlString.escapeId(options.sortBy)}`;
            }
        }
        else if (options.reverse || options.sortByDescending) {
            // If reverse/sortByDescending is specified without sortBy, 
            // use a default ordering (by modification time)
            orderBy = 'ORDER BY d.mtimeMs';
        }
        // Handle sort direction
        if (orderBy) {
            if (options.sortByDescending || options.reverse) {
                orderBy += ' DESC';
            }
            else {
                orderBy += ' ASC';
            }
            sql += ' ' + orderBy;
        }
        // Add LIMIT and OFFSET
        if (typeof options.limit === 'number') {
            sql += ` LIMIT ${addParam(options.limit)}`;
        }
        if (typeof options.offset === 'number') {
            sql += ` OFFSET ${addParam(options.offset)}`;
        }
        return { sql, params };
    }
}
_DocumentsCache_insertDocDocuments = new WeakMap(), _DocumentsCache_insertLembedDocuments = new WeakMap(), _DocumentsCache_updateDocDocuments = new WeakMap(), _DocumentsCache_updateLembedDocuments = new WeakMap(), _DocumentsCache_searchSemantic = new WeakMap(), _DocumentsCache_siblingsSQL = new WeakMap(), _DocumentsCache_docsForDirname = new WeakMap(), _DocumentsCache_dirsForParentdir = new WeakMap(), _DocumentsCache_indexFilesSQL = new WeakMap(), _DocumentsCache_indexFilesSQLrenderPath = new WeakMap(), _DocumentsCache_filesForSetTimes = new WeakMap(), _DocumentsCache_docLinkData = new WeakMap();
export var assetsCache;
export var partialsCache;
export var layoutsCache;
export var documentsCache;
export async function setup(config, db) {
    // Initialize tag and tag description support (used by DocumentsCache)
    await tglue.init(db);
    await tdesc.init(db);
    // Helper to setup verbose event listeners if verbose mode is enabled
    const setupVerboseListeners = (cache, cacheName) => {
        if (config.verbose) {
            cache.on('added', (name, vpath) => {
                console.log(`[ADDED] ${name}: ${vpath}`);
            });
            cache.on('ready', (name) => {
                console.log(`[READY] ${name}\n`);
            });
            cache.on('error', (err) => {
                console.error(`[ERROR] ${cacheName}:`, err.message);
            });
        }
        else {
            // Always setup error listener, even in non-verbose mode
            cache.on('error', (...args) => {
                console.error(`${cacheName} ERROR ${util.inspect(args)}`);
            });
        }
    };
    //// ASSETS
    await doCreateAssetsTable(db);
    assetsCache = new AssetsCache(config, 'assets', config.assetDirs, db, 'ASSETS');
    setupVerboseListeners(assetsCache, 'assetsCache');
    await assetsCache.setup();
    //// PARTIALS
    await doCreatePartialsTable(db);
    partialsCache = new PartialsCache(config, 'partials', config.partialsDirs, db, 'PARTIALS');
    setupVerboseListeners(partialsCache, 'partialsCache');
    await partialsCache.setup();
    //// LAYOUTS
    await doCreateLayoutsTable(db);
    layoutsCache = new LayoutsCache(config, 'layouts', config.layoutDirs, db, 'LAYOUTS');
    setupVerboseListeners(layoutsCache, 'layoutsCache');
    await layoutsCache.setup();
    //// DOCUMENTS
    await doCreateDocumentsTable(db);
    await doCreateVecDocumentsTable(db);
    documentsCache = new DocumentsCache(config, 'documents', config.documentDirs, db, 'DOCUMENTS');
    setupVerboseListeners(documentsCache, 'documentsCache');
    await documentsCache.setup();
    await config.hookPluginCacheSetup();
}
export async function closeFileCaches() {
    if (documentsCache) {
        await documentsCache.close();
        documentsCache = undefined;
    }
    if (assetsCache) {
        await assetsCache.close();
        assetsCache = undefined;
    }
    if (layoutsCache) {
        await layoutsCache.close();
        layoutsCache = undefined;
    }
    if (partialsCache) {
        await partialsCache.close();
        partialsCache = undefined;
    }
    // The four caches share the single process-global `sqdb`
    // connection.  Close it once here, after all caches have
    // detached.  Closing an already-closed connection throws
    // (and the wrapper logs it), so only close when still open.
    // This makes closeFileCaches() idempotent, e.g. when a test
    // closes the caches more than once.
    if (sqdb.inner.isOpen) {
        try {
            await sqdb.close();
        }
        catch (err) {
            // The shared connection may already be closed.
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUtc3FsaXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NhY2hlL2NhY2hlLXNxbGl0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7Ozs7Ozs7Ozs7Ozs7QUFFSCxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDOUMsT0FBTyxFQUNILE9BQU8sRUFDVixNQUFNLGNBQWMsQ0FBQztBQUl0QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sWUFBWSxNQUFNLFFBQVEsQ0FBQztBQUNsQyxPQUFPLFVBQVUsTUFBTSxZQUFZLENBQUM7QUFDcEMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQzlDLE9BQU8sRUFDSCxPQUFPLEVBQUUsZUFBZSxFQUMzQixNQUFNLGVBQWUsQ0FBQztBQUt2QixPQUFPLEVBS0gsbUJBQW1CLEVBQ25CLHNCQUFzQixFQUN0QixvQkFBb0IsRUFDcEIscUJBQXFCLEVBQ3JCLHlCQUF5QixFQUNSLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLHVCQUF1QixFQUM3RyxNQUFNLGFBQWEsQ0FBQztBQUdyQixPQUFPLFNBQVMsTUFBTSxrQkFBa0IsQ0FBQztBQVF6QyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFbkQsTUFBTSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM1Qix3QkFBd0I7QUFFeEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztBQUNwQyx3QkFBd0I7QUFFeEI7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLE9BQU8sU0FFWCxTQUFR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QUFhLEdBQUcsU0FBUyxDQUFDO0lBQzlCLENBQUM7SUFFRCx5REFBeUQ7SUFDekQseURBQXlEO0lBQ3pELHlEQUF5RDtJQUN6RCw0REFBNEQ7SUFDNUQsNERBQTREO0lBQzVELG9DQUFvQztJQUNwQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDO1lBQ0QsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDWCwrQ0FBK0M7UUFDbkQsQ0FBQztJQUNMLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBGUywgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCB7XG4gICAgVkZTdGFjaywgVlBhdGhEYXRhLCBkaXJUb01vdW50XG59IGZyb20gJy4vdmZzdGFjay5qcyc7XG5pbXBvcnQge1xuICAgIENvbmZpZ3VyYXRpb24sIGluZGV4Q2hhaW5JdGVtXG59IGZyb20gJy4uL2luZGV4LmpzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaW1wb3J0IG1pY3JvbWF0Y2ggZnJvbSAnbWljcm9tYXRjaCc7XG5pbXBvcnQgeyBwZXJmb3JtYW5jZSB9IGZyb20gJ25vZGU6cGVyZl9ob29rcyc7XG5pbXBvcnQge1xuICAgIFRhZ0dsdWUsIFRhZ0Rlc2NyaXB0aW9uc1xufSBmcm9tICcuL3RhZy1nbHVlLmpzJztcbmltcG9ydCB0eXBlIHtcbiAgICBTaW1pbGFyVGFnR3JvdXAsXG4gICAgVGFnV2l0aG91dERlc2NyaXB0aW9uXG59IGZyb20gJy4uL3R5cGVzLmpzJztcbmltcG9ydCB7XG4gICAgY3JlYXRlQXNzZXRzVGFibGUsXG4gICAgY3JlYXRlRG9jdW1lbnRzVGFibGUsXG4gICAgY3JlYXRlTGF5b3V0c1RhYmxlLFxuICAgIGNyZWF0ZVBhcnRpYWxzVGFibGUsXG4gICAgZG9DcmVhdGVBc3NldHNUYWJsZSxcbiAgICBkb0NyZWF0ZURvY3VtZW50c1RhYmxlLFxuICAgIGRvQ3JlYXRlTGF5b3V0c1RhYmxlLFxuICAgIGRvQ3JlYXRlUGFydGlhbHNUYWJsZSxcbiAgICBkb0NyZWF0ZVZlY0RvY3VtZW50c1RhYmxlLFxuICAgIFBhdGhzUmV0dXJuVHlwZSwgdmFsaWRhdGVBc3NldCwgdmFsaWRhdGVEb2N1bWVudCwgdmFsaWRhdGVMYXlvdXQsIHZhbGlkYXRlUGFydGlhbCwgdmFsaWRhdGVQYXRoc1JldHVyblR5cGVcbn0gZnJvbSAnLi9zY2hlbWEuanMnO1xuXG5pbXBvcnQgeyBBc3luY0RhdGFiYXNlIH0gZnJvbSAncHJvbWlzZWQubm9kZS5zcWxpdGUnO1xuaW1wb3J0IFNxbFN0cmluZyBmcm9tICdzcWxzdHJpbmctc3FsaXRlJztcbmltcG9ydCB7XG4gICAgQmFzZUNhY2hlRW50cnksXG4gICAgQXNzZXQsXG4gICAgUGFydGlhbCxcbiAgICBMYXlvdXQsXG4gICAgRG9jdW1lbnRcbn0gZnJvbSAnLi9zY2hlbWEuanMnO1xuaW1wb3J0IENhY2hlIGZyb20gJ2NhY2hlJztcbmltcG9ydCB7IHNxZGIsIGxlbWJlZE1vZGVsTmFtZSB9IGZyb20gJy4uL3NxZGIuanMnO1xuXG5jb25zdCB0Z2x1ZSA9IG5ldyBUYWdHbHVlKCk7XG4vLyB0Z2x1ZS5pbml0KHNxZGIuX2RiKTtcblxuY29uc3QgdGRlc2MgPSBuZXcgVGFnRGVzY3JpcHRpb25zKCk7XG4vLyB0ZGVzYy5pbml0KHNxZGIuX2RiKTtcblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBmaWxlIGNhY2hlcyAoZG9jdW1lbnRzLCBhc3NldHMsIGxheW91dHMsIHBhcnRpYWxzKS5cbiAqIFNjYW5zIGRpcmVjdG9yaWVzLCBzdG9yZXMgZmlsZSBpbmZvcm1hdGlvbiBpbiBTUUxpdGUgZGF0YWJhc2UsIGFuZCBlbWl0cyBldmVudHMuXG4gKiBcbiAqIEV2ZW50cyBlbWl0dGVkOlxuICogLSAnYWRkZWQnIChuYW1lOiBzdHJpbmcsIHZwYXRoOiBzdHJpbmcpIC0gRW1pdHRlZCB3aGVuIGEgZmlsZSBpcyBzdWNjZXNzZnVsbHkgXG4gKiAgIGFkZGVkIHRvIHRoZSBjYWNoZSBkdXJpbmcgaW5pdGlhbCBzY2FuIG9yIHVwZGF0ZS4gVXNlZnVsIGZvciB0cmFja2luZyB0aGF0IFxuICogICBhbGwgZmlsZXMgYXJlIHByb2Nlc3NlZCBiZWZvcmUgJ3JlYWR5JyBpcyBlbWl0dGVkLlxuICogLSAncmVhZHknIChuYW1lOiBzdHJpbmcpIC0gRW1pdHRlZCB3aGVuIGluaXRpYWwgZGlyZWN0b3J5IHNjYW4gYW5kIGZpbGUgXG4gKiAgIHByb2Nlc3NpbmcgaXMgY29tcGxldGUuIEFmdGVyIHRoaXMgZXZlbnQsIGlzUmVhZHkoKSB3aWxsIHJldHVybiBpbW1lZGlhdGVseS5cbiAqIC0gJ2Vycm9yJyAoZXJyb3I6IEVycm9yKSAtIEVtaXR0ZWQgd2hlbiBhbiBlcnJvciBvY2N1cnMgZHVyaW5nIHByb2Nlc3NpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlQ2FjaGU8XG4gICAgVCBleHRlbmRzIEJhc2VDYWNoZUVudHJ5XG4+IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICAgICNjb25maWc/OiBDb25maWd1cmF0aW9uO1xuICAgICNuYW1lPzogc3RyaW5nO1xuICAgICNkaXJzPzogZGlyVG9Nb3VudFtdO1xuICAgICNpc19yZWFkeTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgI2RiOiBBc3luY0RhdGFiYXNlO1xuICAgICNkYm5hbWU6IHN0cmluZztcblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAgICAgKiBAcGFyYW0gbmFtZSBzdHJpbmcgZ2l2aW5nIHRoZSBuYW1lIGZvciB0aGlzIGNhY2hlXG4gICAgICogQHBhcmFtIGRiIFRoZSBQUk9NSVNFRCBTUUxJVEUzIEFzeW5jRGF0YWJhc2UgaW5zdGFuY2UgdG8gdXNlXG4gICAgICogQHBhcmFtIGRibmFtZSBUaGUgZGF0YWJhc2UgbmFtZSB0byB1c2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRpcnM6IGRpclRvTW91bnRbXSxcbiAgICAgICAgZGI6IEFzeW5jRGF0YWJhc2UsXG4gICAgICAgIGRibmFtZTogc3RyaW5nXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBCYXNlRmlsZUNhY2hlICR7bmFtZX0gY29uc3RydWN0b3IgZGlycz0ke3V0aWwuaW5zcGVjdChkaXJzKX1gKTtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLiNuYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy4jZGlycyA9IGRpcnM7XG4gICAgICAgIHRoaXMuI2lzX3JlYWR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuI2RiID0gZGI7XG4gICAgICAgIGlmIChkYm5hbWUgIT09ICdBU1NFVFMnXG4gICAgICAgICAmJiBkYm5hbWUgIT09ICdMQVlPVVRTJ1xuICAgICAgICAgJiYgZGJuYW1lICE9PSAnUEFSVElBTFMnXG4gICAgICAgICAmJiBkYm5hbWUgIT09ICdET0NVTUVOVFMnXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbGxlZ2FsIGRhdGFiYXNlIG5hbWUsIG11c3QgYmUgQVNTRVRTLCBMQVlPVVRTLCBQQVJUSUFMUywgb3IgRE9DVU1FTlRTYClcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNkYm5hbWUgPSBkYm5hbWU7XG4gICAgfVxuXG4gICAgZ2V0IGNvbmZpZygpICAgICB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICBnZXQgbmFtZSgpICAgICAgIHsgcmV0dXJuIHRoaXMuI25hbWU7IH1cbiAgICBnZXQgZGlycygpICAgICAgIHsgcmV0dXJuIHRoaXMuI2RpcnM7IH1cbiAgICBnZXQgZGIoKSAgICAgICAgIHsgcmV0dXJuIHRoaXMuI2RiOyB9XG4gICAgZ2V0IGRibmFtZSgpICAgICB7IHJldHVybiB0aGlzLiNkYm5hbWU7IH1cbiAgICBnZXQgcXVvdGVkREJOYW1lKCkge1xuICAgICAgICByZXR1cm4gU3FsU3RyaW5nLmVzY2FwZSh0aGlzLiNkYm5hbWUpO1xuICAgIH1cblxuICAgICN2ZnN0YWNrOiBWRlN0YWNrO1xuXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdjaGFuZ2VkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdhZGRlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygndW5saW5rZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlYWR5Jyk7XG5cbiAgICAgICAgLy8gTk9URTogVGhlIGRhdGFiYXNlIGNvbm5lY3Rpb24gaXMgTk9UIGNsb3NlZCBoZXJlLlxuICAgICAgICAvLyBBbGwgZm91ciBjYWNoZXMgKGFzc2V0cywgcGFydGlhbHMsIGxheW91dHMsIGRvY3VtZW50cylcbiAgICAgICAgLy8gc2hhcmUgdGhlIHNpbmdsZSBwcm9jZXNzLWdsb2JhbCBgc3FkYmAgY29ubmVjdGlvbi5cbiAgICAgICAgLy8gQ2xvc2luZyBpdCBwZXItY2FjaGUgd291bGQgY2xvc2UgdGhlIHNoYXJlZCBjb25uZWN0aW9uXG4gICAgICAgIC8vIG9uIHRoZSBmaXJzdCBjYWNoZSBhbmQgdGhlbiB0aHJvdyBcImRhdGFiYXNlIGlzIG5vdCBvcGVuXCJcbiAgICAgICAgLy8gb24gdGhlIHJlc3QuICBUaGUgc2hhcmVkIGNvbm5lY3Rpb24gaXMgY2xvc2VkIG9uY2UgYnlcbiAgICAgICAgLy8gY2xvc2VGaWxlQ2FjaGVzKCkuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2NhbiB0aGUgZGlyZWN0b3J5IHN0YWNrIGFuZCBwb3B1bGF0ZSB0aGUgZGF0YWJhc2UuXG4gICAgICovXG4gICAgYXN5bmMgc2V0dXAoKSB7XG4gICAgICAgIHRoaXMuI2lzX3JlYWR5ID0gZmFsc2U7XG5cbiAgICAgICAgLy8gT3B0aW9uYWwgaW5kZXhpbmcgcHJvZmlsZXIsIGVuYWJsZWQgYnkgc2V0dGluZyBBS19QUk9GSUxFX0lOREVYLlxuICAgICAgICAvLyBBY2N1bXVsYXRlcyB3YWxsIHRpbWUgc3BlbnQgaW4gZWFjaCBwaGFzZSBvZiBpbmRleGluZyBzbyB3ZSBjYW5cbiAgICAgICAgLy8gc2VlIHdoZXRoZXIgaW5kZXhpbmcgdGltZSBpcyBkb21pbmF0ZWQgYnkgZmlsZSByZWFkcyAocmVhZCksXG4gICAgICAgIC8vIG1ldGFkYXRhIHBhcnNpbmcgKGdhdGhlckluZm9EYXRhKSwgREIgaW5zZXJ0cyAoaW5zZXJ0RG9jVG9EQiksXG4gICAgICAgIC8vIG9yIHBsdWdpbiBob29rcyAoaG9va0ZpbGVBZGRlZCkuICBaZXJvIG92ZXJoZWFkIHdoZW4gZGlzYWJsZWQuXG4gICAgICAgIGNvbnN0IHByb2ZpbGUgPSAhIXByb2Nlc3MuZW52LkFLX1BST0ZJTEVfSU5ERVg7XG4gICAgICAgIGxldCB0U2NhbiA9IDAsIHRHYXRoZXIgPSAwLCB0SW5zZXJ0ID0gMCwgdEhvb2sgPSAwO1xuICAgICAgICBsZXQgbkZpbGVzID0gMDtcbiAgICAgICAgY29uc3Qgbm93ID0gKCkgPT4gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAgICAgY29uc3Qgc2NhblN0YXJ0ID0gcHJvZmlsZSA/IG5vdygpIDogMDtcbiAgICAgICAgdGhpcy4jdmZzdGFjayA9IG5ldyBWRlN0YWNrKHRoaXMubmFtZSwgdGhpcy5kaXJzKTtcbiAgICAgICAgYXdhaXQgdGhpcy4jdmZzdGFjay5zY2FuKCk7XG4gICAgICAgIGlmIChwcm9maWxlKSB0U2NhbiA9IG5vdygpIC0gc2NhblN0YXJ0O1xuXG4gICAgICAgIC8vIENvbGxlY3QgdGhlIG5vbi1pZ25vcmVkIGVudHJpZXMgb25jZS5cbiAgICAgICAgY29uc3QgZW50cmllczogVFtdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgdnBhdGhEYXRhIG9mIHRoaXMuI3Zmc3RhY2spIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKHZwYXRoRGF0YSkpIHtcbiAgICAgICAgICAgICAgICBlbnRyaWVzLnB1c2godnBhdGhEYXRhIGFzIGFueSBhcyBUKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBoYXNlIDIgKEY0KTogZ2F0aGVyIG1ldGFkYXRhIGFuZCBpbnNlcnQgaW50byB0aGUgZGF0YWJhc2Ugd2l0aGluXG4gICAgICAgIC8vIGEgc2luZ2xlIHRyYW5zYWN0aW9uIHBlciBjYWNoZS4gIFdpdGhvdXQgYW4gZXhwbGljaXQgdHJhbnNhY3Rpb25cbiAgICAgICAgLy8gZWFjaCBkYi5ydW4gaXMgaXRzIG93biBpbXBsaWNpdCBjb21taXQ7IHdyYXBwaW5nIHRob3VzYW5kcyBvZlxuICAgICAgICAvLyBpbnNlcnRzIGluIG9uZSB0cmFuc2FjdGlvbiBpcyBkcmFtYXRpY2FsbHkgZmFzdGVyLiAgUGVyLWZpbGVcbiAgICAgICAgLy8gZXJyb3JzIGFyZSBzdGlsbCBjYXVnaHQgYW5kIGxvZ2dlZCAocHJlc2VydmluZyBwcmlvciBiZWhhdmlvdXIpO1xuICAgICAgICAvLyB0aGUgdHJhbnNhY3Rpb24gaXMgY29tbWl0dGVkIGF0IHRoZSBlbmQsIG9yIHJvbGxlZCBiYWNrIG9uIGFcbiAgICAgICAgLy8gZmF0YWwgZXJyb3IuXG4gICAgICAgIGF3YWl0IHRoaXMuZGIuZXhlYygnQkVHSU4nKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaW5mbyBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2ZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5GaWxlcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHQgPSBub3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0R2F0aGVyICs9IG5vdygpIC0gdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBub3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuaW5zZXJ0RG9jVG9EQihpbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRJbnNlcnQgKz0gbm93KCkgLSB0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdCA9IG5vdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVBZGRlZCh0aGlzLm5hbWUsIGluZm8gYXMgYW55KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRIb29rICs9IG5vdygpIC0gdDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmluc2VydERvY1RvREIoaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUFkZGVkKHRoaXMubmFtZSwgaW5mbyBhcyBhbnkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIEVtaXQgJ2FkZGVkJyBldmVudCB0byB0cmFjayB3aGVuIGZpbGVzIGFyZSBwcm9jZXNzZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBoZWxwcyB2ZXJpZnkgdGhhdCBhbGwgZmlsZXMgYXJlIGFkZGVkIGJlZm9yZSAncmVhZHknIGlzIGVtaXR0ZWRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdhZGRlZCcsIHRoaXMubmFtZSwgKGluZm8gYXMgYW55KS52cGF0aCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGdhdGhlcmluZyBpbmZvIGZvciAkeyhpbmZvIGFzIGFueSkudnBhdGh9OiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGIuZXhlYygnQ09NTUlUJyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gQSBmYWlsdXJlIG91dHNpZGUgdGhlIHBlci1maWxlIHRyeS9jYXRjaCAoZS5nLiB0aGUgQ09NTUlUXG4gICAgICAgICAgICAvLyBpdHNlbGYpIG11c3Qgbm90IGxlYXZlIGFuIG9wZW4gdHJhbnNhY3Rpb24uXG4gICAgICAgICAgICB0cnkgeyBhd2FpdCB0aGlzLmRiLmV4ZWMoJ1JPTExCQUNLJyk7IH0gY2F0Y2ggKGUpIHsgLyogaWdub3JlICovIH1cbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9maWxlKSB7XG4gICAgICAgICAgICBjb25zdCBmID0gKG46IG51bWJlcikgPT4gKG4gLyAxMDAwKS50b0ZpeGVkKDMpICsgJ3MnO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgYFtBS19QUk9GSUxFX0lOREVYXSAke3RoaXMubmFtZX06IGZpbGVzPSR7bkZpbGVzfSBgXG4gICAgICAgICAgICAgICsgYHNjYW49JHtmKHRTY2FuKX0gZ2F0aGVySW5mb0RhdGE9JHtmKHRHYXRoZXIpfSBgXG4gICAgICAgICAgICAgICsgYGluc2VydERvY1RvREI9JHtmKHRJbnNlcnQpfSBob29rRmlsZUFkZGVkPSR7Zih0SG9vayl9YFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI2lzX3JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0KCdyZWFkeScsIHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGUgYW4gaXRlbSwgd2hpY2ggaXMgZXhwZWN0ZWQgdG8gYmVcbiAgICAgKiBhIHJvdyBmcm9tIGRhdGFiYXNlIHF1ZXJ5IHJlc3VsdHMsIHVzaW5nXG4gICAgICogb25lIG9mIHRoZSB2YWxpZGF0b3IgZnVuY3Rpb25zIGluIHNjaGVtYS50cy5cbiAgICAgKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gbXVzdCBiZSBzdWJjbGFzc2VkIHRvXG4gICAgICogZnVuY3Rpb24gY29ycmVjdGx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvdyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBUIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB2YWxpZGF0ZVJvdyBtdXN0IGJlIHN1YmNsYXNzZWRgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0ZSBhbiBhcnJheSwgd2hpY2ggaXMgZXhwZWN0ZWQgdG8gYmVcbiAgICAgKiBkYXRhYmFzZSBxdWVyeSByZXN1bHRzLCB1c2luZyBvbmUgb2YgdGhlXG4gICAgICogdmFsaWRhdG9yIGZ1bmN0aW9ucyBpbiBzY2hlbWEudHMuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIG11c3QgYmUgc3ViY2xhc3NlZCB0b1xuICAgICAqIGZ1bmN0aW9uIGNvcnJlY3RseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb3cgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93cyhyb3dzOiBhbnlbXSk6IFRbXSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdmFsaWRhdGVSb3dzIG11c3QgYmUgc3ViY2xhc3NlZGApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgZmllbGRzIGZyb20gdGhlIGRhdGFiYXNlXG4gICAgICogcmVwcmVzZW50YXRpb24gdG8gdGhlIGZvcm0gcmVxdWlyZWRcbiAgICAgKiBmb3IgZXhlY3V0aW9uLlxuICAgICAqIFxuICAgICAqIFRoZSBkYXRhYmFzZSBjYW5ub3Qgc3RvcmVzIEpTT04gZmllbGRzXG4gICAgICogYXMgYW4gb2JqZWN0IHN0cnVjdHVyZSwgYnV0IGFzIGEgc2VyaWFsaWVkXG4gICAgICogSlNPTiBzdHJpbmcuICBJbnNpZGUgQWthc2hhQ01TIGNvZGUgdGhhdFxuICAgICAqIG9iamVjdCBtdXN0IGJlIGFuIG9iamVjdCByYXRoZXIgdGhhblxuICAgICAqIGEgc3RyaW5nLlxuICAgICAqIFxuICAgICAqIFRoZSBvYmplY3QgcGFzc2VkIGFzIFwicm93XCIgc2hvdWxkIGFscmVhZHlcbiAgICAgKiBoYXZlIGJlZW4gdmFsaWRhdGVkIHVzaW5nIHZhbGlkYXRlUm93LlxuICAgICAqIFxuICAgICAqIEBwYXJhbSByb3cgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogVCB7XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuaW5mbyA9IEpTT04ucGFyc2Uocm93LmluZm8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8VD5yb3c7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHNxbEZvcm1hdChmbmFtZSwgcGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IHNxbCA9IFNxbFN0cmluZy5mb3JtYXQoXG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKGZuYW1lKSwgcGFyYW1zXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBzcWw7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGZpbmRQYXRoTW91bnRlZFNRTFxuICAgICAgICAgICAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG4gICAgLyoqXG4gICAgICogRmluZCBhbiBpbmZvIG9iamVjdCBiYXNlZCBvbiB2cGF0aCBhbmQgbW91bnRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcGFyYW0gbW91bnRlZCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZmluZFBhdGhNb3VudGVkKFxuICAgICAgICB2cGF0aDogc3RyaW5nLCBtb3VudGVkOiBzdHJpbmdcbiAgICApOiBQcm9taXNlPEFycmF5PHtcbiAgICAgICAgdnBhdGg6IHN0cmluZyxcbiAgICAgICAgbW91bnRlZDogc3RyaW5nXG4gICAgfT4+ICB7XG4gICAgICAgIFxuICAgICAgICBsZXQgc3FsID0gdGhpcy5maW5kUGF0aE1vdW50ZWRTUUwuZ2V0KHRoaXMuZGJuYW1lKTtcbiAgICAgICAgaWYgKCFzcWwpIHtcbiAgICAgICAgICAgIHNxbCA9IGF3YWl0IHRoaXMuc3FsRm9ybWF0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2ZpbmQtcGF0aC1tb3VudGVkLnNxbCcpLFxuICAgICAgICAgICAgICAgIFsgdGhpcy5kYm5hbWUgXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuZmluZFBhdGhNb3VudGVkU1FMLnNldCh0aGlzLmRibmFtZSwgc3FsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmb3VuZCA9IDxhbnlbXT5hd2FpdCB0aGlzLmRiLmFsbChzcWwsIHtcbiAgICAgICAgICAgICR2cGF0aDogdnBhdGgsXG4gICAgICAgICAgICAkbW91bnRlZDogbW91bnRlZFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgbWFwcGVkID0gbmV3IEFycmF5PHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBtb3VudGVkOiBzdHJpbmdcbiAgICAgICAgfT4oKTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGZvdW5kKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0udnBhdGggPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgJiYgdHlwZW9mIGl0ZW0ubW91bnRlZCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIG1hcHBlZC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsIG1vdW50ZWQ6IGl0ZW0ubW91bnRlZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmRQYXRoTW91bnRlZDogSW52YWxpZCBvYmplY3QgIGZvdW5kIGluIHF1ZXJ5ICgke3ZwYXRofSwgJHttb3VudGVkfSkgcmVzdWx0cyAke3V0aWwuaW5zcGVjdChpdGVtKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFwcGVkO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBmaW5kQnlQYXRoQ2FjaGU7XG4gICAgcHJvdGVjdGVkIGZpbmRCeVBhdGhTUUwgPSBuZXcgTWFwPFxuICAgICAgICBzdHJpbmcsIHN0cmluZ1xuICAgID4oKTtcblxuICAgIC8qKlxuICAgICAqIEZpbmQgYW4gaW5mbyBvYmplY3QgYnkgdGhlIHZwYXRoLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBmaW5kQnlQYXRoKHZwYXRoOiBzdHJpbmcpIHtcblxuICAgICAgICBjb25zdCBkb0NhY2hpbmdcbiAgICAgICAgICAgID0gdGhpcy5jb25maWcuY2FjaGluZ1RpbWVvdXQgPiAwO1xuICAgICAgICBsZXQgY2FjaGVLZXk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmZpbmRCeVBhdGhDYWNoZSkge1xuICAgICAgICAgICAgdGhpcy5maW5kQnlQYXRoQ2FjaGVcbiAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgY2FjaGVkXG4gICAgICAgICAgICAgICAgPSB0aGlzLmZpbmRCeVBhdGhDYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgICAgICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZEJ5UGF0aCAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9ICR7dnBhdGh9YCk7XG5cbiAgICAgICAgbGV0IHNxbCA9IHRoaXMuZmluZEJ5UGF0aFNRTC5nZXQodGhpcy5kYm5hbWUpO1xuICAgICAgICBpZiAoIXNxbCkge1xuICAgICAgICAgICAgc3FsID0gYXdhaXQgdGhpcy5zcWxGb3JtYXQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICdzcWwnLCAnZmluZC1ieS1jYWNoZS5zcWwnKSxcbiAgICAgICAgICAgICAgICBbIHRoaXMuZGJuYW1lIF1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmZpbmRCeVBhdGhTUUwuc2V0KHRoaXMuZGJuYW1lLCBzcWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGZvdW5kO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZm91bmQgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoc3FsLCB7XG4gICAgICAgICAgICAgICAgJHZwYXRoOiB2cGF0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGRiLmFsbCAke3NxbH1gLCBlcnIuc3RhY2spO1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gdGhpcy52YWxpZGF0ZVJvd3MoZm91bmQpO1xuXG4gICAgICAgIGNvbnN0IHJldCA9IG1hcHBlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nICYmIGNhY2hlS2V5KSB7XG4gICAgICAgICAgICB0aGlzLmZpbmRCeVBhdGhDYWNoZS5wdXQoXG4gICAgICAgICAgICAgICAgY2FjaGVLZXksIHJldFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbzogVCkge1xuICAgICAgICAvLyBQbGFjZWhvbGRlciB3aGljaCBzb21lIHN1YmNsYXNzZXNcbiAgICAgICAgLy8gYXJlIGV4cGVjdGVkIHRvIG92ZXJyaWRlXG5cbiAgICAgICAgLy8gaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBnYXRoZXJJbmZvRGF0YSBtdXN0IGJlIG92ZXJyaWRkZW5gKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWFkIHRoZSB0ZXh0dWFsIGNvbnRlbnQgZm9yIGEgZmlsZSBiZWluZyBpbmRleGVkLlxuICAgICAqXG4gICAgICogZ2F0aGVySW5mb0RhdGEgaXMgc3luY2hyb25vdXMgKGJlY2F1c2UgdGhlIHJlbmRlcmVycydcbiAgICAgKiBwYXJzZU1ldGFkYXRhIGlzIHN5bmNocm9ub3VzKSwgc28gdGhpcyByZWFkcyBzeW5jaHJvbm91c2x5LlxuICAgICAqXG4gICAgICogTk9URTogQW4gZWFybGllciBhdHRlbXB0IChGNikgcHJlLXJlYWQgYWxsIGZpbGVzIGFzeW5jaHJvbm91c2x5XG4gICAgICogaW50byBtZW1vcnkgYmVmb3JlIGluc2VydGluZywgdG8gb3ZlcmxhcCBkaXNrIEkvTy4gIE9uIGEgbGFyZ2Ugc2l0ZVxuICAgICAqIHRoaXMgaGVsZCBldmVyeSBmaWxlJ3MgY29udGVudCBpbiBtZW1vcnkgYXQgb25jZSBhbmQgY2F1c2VkIHNldmVyZVxuICAgICAqIEdDIHByZXNzdXJlIC0tIGl0IG1hZGUgaW5kZXhpbmcgfjQweCBTTE9XRVIsIG5vdCBmYXN0ZXIuICBJdCB3YXNcbiAgICAgKiBhYmFuZG9uZWQuICBUaGUgc3luY2hyb25vdXMgcmVhZCBoZXJlLCBwcm9jZXNzaW5nIG9uZSBmaWxlIGF0IGFcbiAgICAgKiB0aW1lLCBrZWVwcyB0aGUgaGVhcCBzbWFsbCBhbmQgaXMgZmFzdCAodGhlIE9TIHBhZ2UgY2FjaGUgbWFrZXMgdGhlXG4gICAgICogcmVhZHMgY2hlYXApLiAgU2VlIEFSQ0hJVEVDVFVSRS1wZXJmb3JtYW5jZS1yZXZpZXcubWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5mbyBUaGUgaW5mbyBvYmplY3QgZm9yIHRoZSBmaWxlXG4gICAgICogQHJldHVybnMgVGhlIGZpbGUgY29udGVudCBhcyBhIFVURi04IHN0cmluZ1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBmaWxlQ29udGVudEZvcihpbmZvOiBUKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIEZTLnJlYWRGaWxlU3luYygoaW5mbyBhcyBhbnkpLmZzcGF0aCwgJ3V0Zi04Jyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbzogVCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluc2VydERvY1RvREIgbXVzdCBiZSBvdmVycmlkZGVuYCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoaW5mbzogVCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVwZGF0ZURvY0luREIgbXVzdCBiZSBvdmVycmlkZGVuYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxsb3cgYSBjYWxsZXIgdG8gd2FpdCB1bnRpbCB0aGUgPGVtPnJlYWR5PC9lbT4gZXZlbnQgaGFzXG4gICAgICogYmVlbiBzZW50IGZyb20gdGhlIERpcnNXYXRjaGVyIGluc3RhbmNlLiAgVGhpcyBldmVudCBtZWFucyB0aGVcbiAgICAgKiBpbml0aWFsIGluZGV4aW5nIGhhcyBoYXBwZW5lZC5cbiAgICAgKi9cbiAgICBhc3luYyBpc1JlYWR5KCkge1xuICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIGRpcmVjdG9yaWVzLCB0aGVyZSB3b24ndCBiZSBhbnkgZmlsZXMgXG4gICAgICAgIC8vIHRvIGxvYWQsIGFuZCBubyBuZWVkIHRvIHdhaXRcbiAgICAgICAgd2hpbGUgKHRoaXMuI2RpcnMubGVuZ3RoID4gMCAmJiAhdGhpcy4jaXNfcmVhZHkpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZG9lcyBhIDEwMG1zIHBhdXNlXG4gICAgICAgICAgICAvLyBUaGF0IGxldHMgdXMgY2hlY2sgaXNfcmVhZHkgZXZlcnkgMTAwbXNcbiAgICAgICAgICAgIC8vIGF0IHZlcnkgbGl0dGxlIGNvc3RcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAhaXNSZWFkeSAke3RoaXMubmFtZX0gJHt0aGlzW19zeW1iX2RpcnNdLmxlbmd0aH0gJHt0aGlzW19zeW1iX2lzX3JlYWR5XX1gKTtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBkaXJlY3RvcnkgbW91bnQgY29ycmVzcG9uZGluZyB0byB0aGUgZmlsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgZmlsZURpck1vdW50KGluZm8pIHtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgaWYgKGluZm8ubW91bnRQb2ludCA9PT0gZGlyLmRlc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2hvdWxkIHRoaXMgZmlsZSBiZSBpZ25vcmVkLCBiYXNlZCBvbiB0aGUgYGlnbm9yZWAgZmllbGRcbiAgICAgKiBpbiB0aGUgbWF0Y2hpbmcgYGRpcmAgbW91bnQgZW50cnkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGluZm9cbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGlnbm9yZUZpbGUoaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgIGNvbnN0IGRpck1vdW50ID0gdGhpcy5maWxlRGlyTW91bnQoaW5mbyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH0gZGlyTW91bnQgJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICBsZXQgaWdub3JlID0gZmFsc2U7XG4gICAgICAgIGlmIChkaXJNb3VudCkge1xuXG4gICAgICAgICAgICBsZXQgaWdub3JlcztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyTW91bnQuaWdub3JlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBbIGRpck1vdW50Lmlnbm9yZSBdO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRpck1vdW50Lmlnbm9yZSkpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gZGlyTW91bnQuaWdub3JlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaWdub3Jlcykge1xuICAgICAgICAgICAgICAgIGlmIChtaWNyb21hdGNoLmlzTWF0Y2goaW5mby52cGF0aCwgaSkpIGlnbm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRpck1vdW50Lmlnbm9yZSAke2ZzcGF0aH0gJHtpfSA9PiAke2lnbm9yZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIChpZ25vcmUpIGNvbnNvbGUubG9nKGBNVVNUIGlnbm9yZSBGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlIGZvciAke2luZm8udnBhdGh9ID09PiAke2lnbm9yZX1gKTtcbiAgICAgICAgICAgIHJldHVybiBpZ25vcmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBubyBtb3VudD8gIHRoYXQgbWVhbnMgc29tZXRoaW5nIHN0cmFuZ2VcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYE5vIGRpck1vdW50IGZvdW5kIGZvciAke2luZm8udnBhdGh9IC8gJHtpbmZvLmRpck1vdW50ZWRPbn1gKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHBhdGhzQ2FjaGU7XG4gICAgcHJvdGVjdGVkIHBhdGhzU1FMID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBzaW1wbGUgaW5mb3JtYXRpb24gYWJvdXQgZWFjaFxuICAgICAqIHBhdGggaW4gdGhlIGNvbGxlY3Rpb24uICBUaGUgcmV0dXJuXG4gICAgICogdHlwZSBpcyBhbiBhcnJheSBvZiBQYXRoc1JldHVyblR5cGUuXG4gICAgICogXG4gICAgICogSSBmb3VuZCB0d28gdXNlcyBmb3IgdGhpcyBmdW5jdGlvbi5cbiAgICAgKiBJbiBjb3B5QXNzZXRzLCB0aGUgdnBhdGggYW5kIG90aGVyXG4gICAgICogc2ltcGxlIGRhdGEgaXMgdXNlZCBmb3IgY29weWluZyBpdGVtc1xuICAgICAqIHRvIHRoZSBvdXRwdXQgZGlyZWN0b3J5LlxuICAgICAqIEluIHJlbmRlci50cywgdGhlIHNpbXBsZSBmaWVsZHMgYXJlXG4gICAgICogdXNlZCB0byB0aGVuIGNhbGwgZmluZCB0byByZXRyaWV2ZVxuICAgICAqIHRoZSBmdWxsIGluZm9ybWF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHBhdGhzKHJvb3RQYXRoPzogc3RyaW5nKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8UGF0aHNSZXR1cm5UeXBlPj5cbiAgICB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIGNvbnN0IGRvQ2FjaGluZ1xuICAgICAgICAgICAgPSB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDA7XG4gICAgICAgIGxldCBjYWNoZUtleTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMucGF0aHNDYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGF0aHNDYWNoZVxuICAgICAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgcm9vdFAsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgY2FjaGVkXG4gICAgICAgICAgICAgICAgPSB0aGlzLnBhdGhzQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNxbFJvb3RQID0gdGhpcy5wYXRoc1NRTC5nZXQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgZGJuYW1lOiB0aGlzLmRibmFtZSwgcm9vdFA6IHRydWVcbiAgICAgICAgfSkpO1xuICAgICAgICBpZiAoIXNxbFJvb3RQKSB7XG4gICAgICAgICAgICBzcWxSb290UCA9IGF3YWl0IHRoaXMuc3FsRm9ybWF0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3BhdGhzLXJvb3RwLnNxbCcpLFxuICAgICAgICAgICAgICAgIFsgdGhpcy5kYm5hbWUgXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMucGF0aHNTUUwuc2V0KHRoaXMuZGJuYW1lLCBzcWxSb290UCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNxbE5vUm9vdCA9IHRoaXMucGF0aHNTUUwuZ2V0KEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGRibmFtZTogdGhpcy5kYm5hbWUsIHJvb3RQOiBmYWxzZVxuICAgICAgICB9KSk7XG4gICAgICAgIGlmICghc3FsTm9Sb290KSB7XG4gICAgICAgICAgICBzcWxOb1Jvb3QgPSBhd2FpdCB0aGlzLnNxbEZvcm1hdChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdwYXRocy1uby1yb290LnNxbCcpLFxuICAgICAgICAgICAgICAgIFsgdGhpcy5kYm5hbWUgXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMucGF0aHNTUUwuc2V0KHRoaXMuZGJuYW1lLCBzcWxOb1Jvb3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBpcyBjb3BpZWQgZnJvbSB0aGUgb2xkZXIgdmVyc2lvblxuICAgICAgICAvLyAoTG9raUpTIHZlcnNpb24pIG9mIHRoaXMgZnVuY3Rpb24uICBJdFxuICAgICAgICAvLyBzZWVtcyBtZWFudCB0byBlbGltaW5hdGUgZHVwbGljYXRlcy5cbiAgICAgICAgY29uc3QgdnBhdGhzU2VlbiA9IG5ldyBTZXQoKTtcblxuICAgICAgICAvLyBTZWxlY3QgdGhlIGZpZWxkcyBpbiBQYXRoc1JldHVyblR5cGVcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9ICh0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnKSBcbiAgICAgICAgPyA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoc3FsUm9vdFAsIHtcbiAgICAgICAgICAgICRyb290UDogYCR7cm9vdFB9JWBcbiAgICAgICAgfSlcbiAgICAgICAgOiA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoc3FsTm9Sb290KTtcblxuICAgICAgICBjb25zdCByZXN1bHQyOiBQYXRoc1JldHVyblR5cGVbXVxuICAgICAgICAgICAgICAgID0gbmV3IEFycmF5PFBhdGhzUmV0dXJuVHlwZT4oKTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICAgIGlmIChmY2FjaGUuaWdub3JlRmlsZShpdGVtKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZwYXRoc1NlZW4uaGFzKChpdGVtIGFzIFQpLnZwYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2cGF0aHNTZWVuLmFkZCgoaXRlbSBhcyBUKS52cGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5taW1lID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVQYXRoc1JldHVyblR5cGUoaXRlbSk7XG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUEFUSFMgVkFMSURBVElPTiAke3V0aWwuaW5zcGVjdChpdGVtKX1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQyLnB1c2godmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZyAmJiBjYWNoZUtleSkge1xuICAgICAgICAgICAgdGhpcy5wYXRoc0NhY2hlLnB1dChcbiAgICAgICAgICAgICAgICBjYWNoZUtleSwgcmVzdWx0MlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGZpbGUgd2l0aGluIHRoZSBjYWNoZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggVGhlIHZwYXRoIG9yIHJlbmRlclBhdGggdG8gbG9vayBmb3JcbiAgICAgKiBAcmV0dXJucyBib29sZWFuIHRydWUgaWYgZm91bmQsIGZhbHNlIG90aGVyd2lzZVxuICAgICAqL1xuICAgIGFzeW5jIGZpbmQoX2ZwYXRoKTogUHJvbWlzZTxUIHwgdW5kZWZpbmVkPiB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfZnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmQgcGFyYW1ldGVyIG5vdCBzdHJpbmcgJHt0eXBlb2YgX2ZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmZpbmRCeVBhdGgoZnBhdGgpO1xuXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAvLyAgICAgb3I6IFtcbiAgICAgICAgLy8gICAgICAgICB7IHZwYXRoOiB7IGVxOiBmcGF0aCB9fSxcbiAgICAgICAgLy8gICAgICAgICB7IHJlbmRlclBhdGg6IHsgZXE6IGZwYXRoIH19XG4gICAgICAgIC8vICAgICBdXG4gICAgICAgIC8vIH0gYXMgRmlsdGVyPFQ+KTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZCAke19mcGF0aH0gJHtmcGF0aH0gPT0+IHJlc3VsdDEgJHt1dGlsLmluc3BlY3QocmVzdWx0MSl9IGApO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDIgPSByZXN1bHQxLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0Mikge1xuICAgICAgICAvLyAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShyZXN1bHQpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmQgJHtfZnBhdGh9ICR7ZnBhdGh9ID09PiByZXN1bHQyICR7dXRpbC5pbnNwZWN0KHJlc3VsdDIpfSBgKTtcblxuICAgICAgICBsZXQgcmV0O1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldCA9IHJlc3VsdDJbMF07XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICByZXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXQgPSByZXN1bHQyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlOiBUID0gdGhpcy5jdnRSb3dUb09iaihcbiAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRlUm93KHJldClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUFJPQkxFTTpcbiAgICAgICAgLy8gdGhlIG1ldGFkYXRhLCBkb2NNZXRhZGF0YSwgYmFzZU1ldGFkYXRhLFxuICAgICAgICAvLyBhbmQgaW5mbyBmaWVsZHMsIGFyZSBzdG9yZWQgaW5cbiAgICAgICAgLy8gdGhlIGRhdGFiYXNlIGFzIHN0cmluZ3MsIGJ1dCBuZWVkXG4gICAgICAgIC8vIHRvIGJlIHVucGFja2VkIGludG8gb2JqZWN0cy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVXNpbmcgdmFsaWRhdGVSb3cgb3IgdmFsaWRhdGVSb3dzIGlzXG4gICAgICAgIC8vIHVzZWZ1bCwgYnV0IGRvZXMgbm90IGNvbnZlcnQgdGhvc2VcbiAgICAgICAgLy8gZmllbGRzLlxuICAgIH1cblxuICAgICNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcjogZGlyVG9Nb3VudCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgI2ZFeGlzdHNJbkRpciAke2ZwYXRofSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICBpZiAoZGlyLmRlc3QgPT09ICcvJykge1xuICAgICAgICAgICAgY29uc3QgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5zcmMsIGZwYXRoXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5zcmMsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5kZXN0LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogc3RhdHMubXRpbWVNc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbXAgPSBkaXIuZGVzdC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gZGlyLmRlc3Quc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IGRpci5kZXN0O1xuICAgICAgICBtcCA9IG1wLmVuZHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gbXBcbiAgICAgICAgICAgIDogKG1wKycvJyk7XG5cbiAgICAgICAgaWYgKGZwYXRoLnN0YXJ0c1dpdGgobXApKSB7XG4gICAgICAgICAgICBsZXQgcGF0aEluTW91bnRlZFxuICAgICAgICAgICAgICAgID0gZnBhdGgucmVwbGFjZShkaXIuZGVzdCwgJycpO1xuICAgICAgICAgICAgbGV0IGZzcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBkaXIuc3JjLCBwYXRoSW5Nb3VudGVkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDaGVja2luZyBleGlzdCBmb3IgJHtkaXIuZGVzdH0gJHtkaXIuc3JjfSAke3BhdGhJbk1vdW50ZWR9ICR7ZnNwYXRofWApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5zcmMsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5kZXN0LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBzdGF0cy5tdGltZU1zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRnVsZmlsbHMgdGhlIFwiZmluZFwiIG9wZXJhdGlvbiBub3QgYnlcbiAgICAgKiBsb29raW5nIGluIHRoZSBkYXRhYmFzZSwgYnV0IGJ5IHNjYW5uaW5nXG4gICAgICogdGhlIGZpbGVzeXN0ZW0gdXNpbmcgc3luY2hyb25vdXMgY2FsbHMuXG4gICAgICogXG4gICAgICogTk9URTogVGhpcyBpcyB1c2VkIGluIHBhcnRpYWxTeW5jXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGZpbmRTeW5jKF9mcGF0aCk6IFZQYXRoRGF0YSB8IHVuZGVmaW5lZCB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfZnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmQgcGFyYW1ldGVyIG5vdCBzdHJpbmcgJHt0eXBlb2YgX2ZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZFN5bmMgbG9va2luZyBmb3IgJHtmcGF0aH0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy4jZGlycyl9YCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgaWYgKCEoZGlyPy5kZXN0KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgZmluZFN5bmMgYmFkIGRpcnMgaW4gJHt1dGlsLmluc3BlY3QodGhpcy5kaXJzKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy4jZkV4aXN0c0luRGlyKGZwYXRoLCBkaXIpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRTeW5jICR7ZnBhdGh9IGZvdW5kYCwgZm91bmQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQXNzZXRzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8QXNzZXQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBBc3NldCB7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIHZhbHVlIH0gPSB2YWxpZGF0ZUFzc2V0KHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgLy8gY29uc29sZS5lcnJvcihgQVNTRVQgVkFMSURBVElPTiBFUlJPUiBmb3JgLCByb3cpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0gZWxzZSByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93cyhyb3dzOiBhbnlbXSk6IEFzc2V0W10ge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocm93cykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXRzQ2FjaGUgdmFsaWRhdGVSb3dzIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXlgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXk8QXNzZXQ+KCk7XG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICAgIHJldC5wdXNoKHRoaXMudmFsaWRhdGVSb3cocm93KSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IEFzc2V0IHtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDxBc3NldD5yb3c7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbzogQXNzZXQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjaW5zZXJ0RG9jQXNzZXRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IEFzc2V0XG4gICAgKSB7XG4gICAgICAgIGlmICghdGhpcy4jaW5zZXJ0RG9jQXNzZXRzKSB7XG4gICAgICAgICAgICB0aGlzLiNpbnNlcnREb2NBc3NldHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1hc3NldHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bih0aGlzLiNpbnNlcnREb2NBc3NldHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbylcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgI3VwZGF0ZURvY0Fzc2V0cztcblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm86IEFzc2V0KSB7XG4gICAgICAgIGlmICghdGhpcy4jdXBkYXRlRG9jQXNzZXRzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NBc3NldHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAndXBkYXRlLWRvYy1hc3NldHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bih0aGlzLiN1cGRhdGVEb2NBc3NldHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbylcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBQYXJ0aWFsc0NhY2hlXG4gICAgICAgIGV4dGVuZHMgQmFzZUNhY2hlPFBhcnRpYWw+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBQYXJ0aWFsIHtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9IHZhbGlkYXRlUGFydGlhbChyb3cpO1xuICAgICAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xuICAgICAgICBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogUGFydGlhbFtdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhcnRpYWxzQ2FjaGUgdmFsaWRhdGVSb3dzIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXlgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXk8UGFydGlhbD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogUGFydGlhbCB7XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuaW5mbyA9IEpTT04ucGFyc2Uocm93LmluZm8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8UGFydGlhbD5yb3c7XG4gICAgfVxuXG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBQYXJ0aWFsKSB7XG5cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9IHJlbmRlcmVyLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHRoaXMuZmlsZUNvbnRlbnRGb3IoaW5mbylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjaW5zZXJ0RG9jUGFydGlhbHM7XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihcbiAgICAgICAgaW5mbzogUGFydGlhbFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI2luc2VydERvY1BhcnRpYWxzKSB7XG4gICAgICAgICAgICB0aGlzLiNpbnNlcnREb2NQYXJ0aWFscyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdpbnNlcnQtZG9jLXBhcnRpYWxzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0RG9jUGFydGlhbHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAjdXBkYXRlRG9jUGFydGlhbHM7XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihcbiAgICAgICAgaW5mbzogUGFydGlhbFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI3VwZGF0ZURvY1BhcnRpYWxzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NQYXJ0aWFscyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICd1cGRhdGUtZG9jLXBhcnRpYWxzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jdXBkYXRlRG9jUGFydGlhbHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIExheW91dHNDYWNoZVxuICAgICAgICBleHRlbmRzIEJhc2VDYWNoZTxMYXlvdXQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBMYXlvdXQge1xuICAgICAgICBjb25zdCB7IGVycm9yLCB2YWx1ZSB9ID0gdmFsaWRhdGVMYXlvdXQocm93KTtcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcjtcbiAgICAgICAgZWxzZSByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93cyhyb3dzOiBhbnlbXSk6IExheW91dFtdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYExheW91dHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxMYXlvdXQ+KCk7XG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICAgIHJldC5wdXNoKHRoaXMudmFsaWRhdGVSb3cocm93KSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IExheW91dCB7XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuaW5mbyA9IEpTT04ucGFyc2Uocm93LmluZm8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8TGF5b3V0PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBMYXlvdXQpIHtcblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodHlwZW9mICg8YW55PmluZm8pLnN0YXRzTXRpbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpbmZvLm10aW1lTXMgPSAoPGFueT5pbmZvKS5zdGF0c010aW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbmZvLm1pbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGluZm8ubWltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgICAgIGluZm8ucmVuZGVyZXJOYW1lID0gcmVuZGVyZXIubmFtZTtcblxuICAgICAgICAgICAgY29uc3QgcmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby52cGF0aCk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9XG4gICAgICAgICAgICAgICAgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKiovKi5odG1sJylcbiAgICAgICAgICAgICB8fCBtaWNyb21hdGNoLmlzTWF0Y2goXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqLmh0bWwnKVxuICAgICAgICAgICAgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHRoaXMuZmlsZUNvbnRlbnRGb3IoaW5mbylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcnNUb0hUTUwgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICNpbnNlcnREb2NMYXlvdXRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IExheW91dFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI2luc2VydERvY0xheW91dHMpIHtcbiAgICAgICAgICAgIHRoaXMuI2luc2VydERvY0xheW91dHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1sYXlvdXRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0RG9jTGF5b3V0cywge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcblxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAjdXBkYXRlRG9jTGF5b3V0cztcblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKFxuICAgICAgICBpbmZvOiBMYXlvdXRcbiAgICApIHtcbiAgICAgICAgaWYgKCF0aGlzLiN1cGRhdGVEb2NMYXlvdXRzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NMYXlvdXRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3VwZGF0ZS1kb2MtbGF5b3V0cy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI3VwZGF0ZURvY0xheW91dHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWVcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8RG9jdW1lbnQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBEb2N1bWVudCB7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIHZhbHVlIH1cbiAgICAgICAgICAgICAgICAgICAgPSB2YWxpZGF0ZURvY3VtZW50KHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRE9DVU1FTlQgVkFMSURBVElPTiBFUlJPUiBmb3IgJHt1dGlsLmluc3BlY3Qocm93KX1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogRG9jdW1lbnRbXSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxEb2N1bWVudD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogRG9jdW1lbnQge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgRG9jdW1lbnRzIGN2dFJvd1RvT2JqYCwgcm93KTtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cuYmFzZU1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmJhc2VNZXRhZGF0YVxuICAgICAgICAgICAgICAgID0gSlNPTi5wYXJzZShyb3cuYmFzZU1ldGFkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJvdy5kb2NNZXRhZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgID0gSlNPTi5wYXJzZShyb3cuZG9jTWV0YWRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygcm93Lm1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93Lm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy5tZXRhZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cudGFncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy50YWdzXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy50YWdzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPERvY3VtZW50PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBEb2N1bWVudCkge1xuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIGluZm8uZGlybmFtZSA9IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8uZGlybmFtZSA9PT0gJy4nKSBpbmZvLmRpcm5hbWUgPSAnLyc7XG4gICAgICAgIGluZm8ucGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGluZm8uZGlybmFtZSk7XG5cbiAgICAgICAgLy8gZmluZCB0aGUgbW91bnRlZCBkaXJlY3RvcnksXG4gICAgICAgIC8vIGdldCB0aGUgYmFzZU1ldGFkYXRhXG4gICAgICAgIGZvciAobGV0IGRpciBvZiB0aGlzLmRpcnMpIHtcbiAgICAgICAgICAgIGlmIChkaXIuc3JjID09PSBpbmZvLm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlyLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLmJhc2VNZXRhZGF0YSA9IGRpci5iYXNlTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9IHJlbmRlcmVyLm5hbWU7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby52cGF0aCk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9XG4gICAgICAgICAgICAgICAgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqKi8qLmh0bWwnKVxuICAgICAgICAgICAgIHx8IG1pY3JvbWF0Y2guaXNNYXRjaChcbiAgICAgICAgICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKi5odG1sJylcbiAgICAgICAgICAgID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAocmVuZGVyZXIucGFyc2VNZXRhZGF0YSkge1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKDxhbnk+e1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGluZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB0aGlzLmZpbGVDb250ZW50Rm9yKGluZm8pXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkb2NNZXRhZGF0YSBpcyB0aGUgdW5tb2RpZmllZCBtZXRhZGF0YS9mcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBkb2N1bWVudFxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEgPSByYy5tZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvLyBkb2NDb250ZW50IGlzIHRoZSB1bnBhcnNlZCBvcmlnaW5hbCBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gaW5jbHVkaW5nIGFueSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9IHJjLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIGNvbXB1dGVkIG1ldGFkYXRhIHRoYXQgaW5jbHVkZXMgZGF0YSBmcm9tIFxuICAgICAgICAgICAgICAgIC8vIHNldmVyYWwgc291cmNlc1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEgPSB7IH07XG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLmRvY01ldGFkYXRhKSBpbmZvLmRvY01ldGFkYXRhID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcmVzdCBvZiB0aGlzIGlzIGFkYXB0ZWQgZnJvbSB0aGUgb2xkIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgLy8gSFRNTFJlbmRlcmVyLm5ld0luaXRNZXRhZGF0YVxuXG4gICAgICAgICAgICAgICAgLy8gRm9yIHN0YXJ0ZXJzIHRoZSBtZXRhZGF0YSBpcyBjb2xsZWN0ZWQgZnJvbSBzZXZlcmFsIHNvdXJjZXMuXG4gICAgICAgICAgICAgICAgLy8gMSkgdGhlIG1ldGFkYXRhIHNwZWNpZmllZCBpbiB0aGUgZGlyZWN0b3J5IG1vdW50IHdoZXJlXG4gICAgICAgICAgICAgICAgLy8gICAgdGhpcyBkb2N1bWVudCB3YXMgZm91bmRcbiAgICAgICAgICAgICAgICAvLyAyKSBtZXRhZGF0YSBpbiB0aGUgcHJvamVjdCBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgLy8gMykgdGhlIG1ldGFkYXRhIGluIHRoZSBkb2N1bWVudCwgYXMgY2FwdHVyZWQgaW4gZG9jTWV0YWRhdGFcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbml0TWV0YWRhdGEgJHtiYXNlZGlyfSAke2ZwYXRofSBiYXNlTWV0YWRhdGEgJHtiYXNlTWV0YWRhdGFbeXByb3BdfWApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uYmFzZU1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gdGhpcy5jb25maWcubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSB0aGlzLmNvbmZpZy5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGZtbWNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmRvY01ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5kb2NNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgICAgIGZtbWNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhlIGNvbnRlbnQgbGFuZHMgaGVyZVxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGRvY3VtZW50IG9iamVjdCBoYXMgYmVlbiB1c2VmdWwgZm9yIFxuICAgICAgICAgICAgICAgIC8vIGNvbW11bmljYXRpbmcgdGhlIGZpbGUgcGF0aCBhbmQgb3RoZXIgZGF0YS5cbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50ID0ge307XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5iYXNlZGlyID0gaW5mby5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscGF0aCA9IGluZm8ucGF0aEluTW91bnRlZDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHJlbmRlciA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8ucGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5wYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvID0gaW5mby5yZW5kZXJQYXRoO1xuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIHRoZSA8ZW0+dGFnczwvZW0+IGZpZWxkIGlzIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgaWYgKCEoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoaW5mby5tZXRhZGF0YS50YWdzKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhZ2xpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmUgPSAvXFxzKixcXHMqLztcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzLnNwbGl0KHJlKS5mb3JFYWNoKHRhZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdsaXN0LnB1c2godGFnLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSB0YWdsaXN0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBgRk9STUFUIEVSUk9SIC0gJHtpbmZvLnZwYXRofSBoYXMgYmFkbHkgZm9ybWF0dGVkIHRhZ3MgYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEudGFncyA9IGluZm8ubWV0YWRhdGEudGFncztcblxuICAgICAgICAgICAgICAgIC8vIFRoZSByb290IFVSTCBmb3IgdGhlIHByb2plY3RcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJvb3RfdXJsID0gdGhpcy5jb25maWcucm9vdF91cmw7XG5cbiAgICAgICAgICAgICAgICAvLyBDb21wdXRlIHRoZSBVUkwgdGhpcyBkb2N1bWVudCB3aWxsIHJlbmRlciB0b1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdVJvb3RVcmwgPSBuZXcgVVJMKHRoaXMuY29uZmlnLnJvb3RfdXJsLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICAgICAgICAgIHVSb290VXJsLnBhdGhuYW1lID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKHVSb290VXJsLnBhdGhuYW1lLCBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX3VybCA9IHVSb290VXJsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfZGF0ZSA9IGluZm8uc3RhdHMubXRpbWU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZVB1YmxEYXRlID0gKGRhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gRGF0ZS5wYXJzZShkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRlU2V0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAmJiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgZGF0ZVNldCAmJiBpbmZvLm10aW1lTXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBuZXcgRGF0ZShpbmZvLm10aW1lTXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBpbmZvLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gc3RhdHMubXRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7aW5mby52cGF0aH0gbWV0YWRhdGEucHVibGljYXRpb25EYXRlICR7aW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGV9IHNldCBmcm9tIGN1cnJlbnQgdGltZWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID0gZmFsc2U7XG4gICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhID0ge307XG4gICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSAnJztcbiAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9ICcnO1xuICAgICAgICAgICAgaW5mby5yZW5kZXJlck5hbWUgPSAnJztcbiAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lID0gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5PVEU6IENlcnRhaW4gZmllbGRzIGFyZSBub3QgaGFuZGxlZFxuICAgIC8vIGhlcmUgYmVjYXVzZSB0aGV5J3JlIEdFTkVSQVRFRCBmcm9tXG4gICAgLy8gSlNPTiBkYXRhLlxuICAgIC8vXG4gICAgLy8gICAgICBwdWJsaWNhdGlvblRpbWVcbiAgICAvLyAgICAgIGJhc2VNZXRhZGF0YVxuICAgIC8vICAgICAgbWV0YWRhdGFcbiAgICAvLyAgICAgIHRhZ3NcbiAgICAvLyAgICAgIGxheW91dFxuICAgIC8vICAgICAgYmxvZ3RhZ1xuICAgIC8vXG4gICAgLy8gVGhvc2UgZmllbGRzIGFyZSBub3QgdG91Y2hlZCBieVxuICAgIC8vIHRoZSBpbnNlcnQvdXBkYXRlIGZ1bmN0aW9ucyBiZWNhdXNlXG4gICAgLy8gU1FMSVRFMyB0YWtlcyBjYXJlIG9mIGl0LlxuXG4gICAgI2luc2VydERvY0RvY3VtZW50cztcbiAgICAjaW5zZXJ0TGVtYmVkRG9jdW1lbnRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgKSB7XG4gICAgICAgIGlmICghdGhpcy4jaW5zZXJ0RG9jRG9jdW1lbnRzKSB7XG4gICAgICAgICAgICB0aGlzLiNpbnNlcnREb2NEb2N1bWVudHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1kb2N1bWVudHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuI2luc2VydExlbWJlZERvY3VtZW50cykge1xuICAgICAgICAgICAgdGhpcy4jaW5zZXJ0TGVtYmVkRG9jdW1lbnRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2luc2VydC1sZW1iZWQtZG9jdW1lbnRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsZXQgbXRpbWU7XG4gICAgICAgIC8vIGlmICh0eXBlb2YgaW5mby5tdGltZU1zID09PSAnbnVtYmVyJ1xuICAgICAgICAvLyAgfHwgdHlwZW9mIGluZm8ubXRpbWVNcyA9PT0gJ3N0cmluZydcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBtdGltZSA9IG5ldyBEYXRlKGluZm8ubXRpbWVNcykudG9JU09TdHJpbmcoKTtcbiAgICAgICAgLy8gfVxuICAgICAgICBjb25zdCB0b0luc2VydCA9IHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG4gICAgICAgICAgICAkcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICRwYXJlbnREaXI6IGluZm8ucGFyZW50RGlyLFxuICAgICAgICAgICAgJGRvY01ldGFkYXRhOiBKU09OLnN0cmluZ2lmeShpbmZvLmRvY01ldGFkYXRhKSxcbiAgICAgICAgICAgICRkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWVcbiAgICAgICAgfTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluc2VydCBkb2MgJHtpbmZvLnZwYXRofWAsIHRvSW5zZXJ0KTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0RG9jRG9jdW1lbnRzLCB0b0luc2VydCk7XG5cblxuICAgICAgICAvLyBpZiAodHlwZW9mIGxlbWJlZE1vZGVsTmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKHtcbiAgICAgICAgLy8gICAgICAgICBsZW1iZWRNb2RlbE5hbWUsXG4gICAgICAgIC8vICAgICAgICAgYm9keVR5cGU6IHR5cGVvZiBpbmZvLmRvY0JvZHlcbiAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coe1xuICAgICAgICAvLyAgICAgICAgIHR5cGVOYW1lOiB0eXBlb2YgbGVtYmVkTW9kZWxOYW1lLFxuICAgICAgICAvLyAgICAgICAgIGJvZHlUeXBlOiB0eXBlb2YgaW5mby5kb2NCb2R5XG4gICAgICAgIC8vICAgICB9KVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gVGhpcyBoYW5kbGVzIGNvbXB1dGluZyBlbWJlZGRpbmdzXG4gICAgICAgIC8vIGZvciB0aGUgdGl0bGUgYW5kIGJvZHlcbiAgICAgICAgaWYgKHR5cGVvZiBsZW1iZWRNb2RlbE5hbWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAvLyAmJiB0eXBlb2YgaW5mby50aXRsZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY0JvZHkgPT09ICdzdHJpbmcnXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy4jaW5zZXJ0TGVtYmVkRG9jdW1lbnRzLCB7XG4gICAgICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICRsZW1iZWRNb2RlbDogbGVtYmVkTW9kZWxOYW1lLFxuICAgICAgICAgICAgICAgIC8vICR0aXRsZUVtYmVkOiBpbmZvLnRpdGxlLFxuICAgICAgICAgICAgICAgICRib2R5RW1iZWQ6ICBpbmZvLmRvY0JvZHlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0TGVtYmVkRG9jdW1lbnRzLCB7XG4gICAgICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICRsZW1iZWRNb2RlbDogbGVtYmVkTW9kZWxOYW1lLFxuICAgICAgICAgICAgICAgIC8vICR0aXRsZUVtYmVkOiBpbmZvLnRpdGxlLFxuICAgICAgICAgICAgICAgICRib2R5RW1iZWQ6ICBpbmZvLmRvY0JvZHlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYHZlY19kb2N1bWVudHMgaW5zZXJ0ZWQgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHtcbiAgICAgICAgICAgIC8vICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICB0YWdzOiBpbmZvLm1ldGFkYXRhLnRhZ3NcbiAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5hZGREb2NUYWdHbHVlKFxuICAgICAgICAgICAgICAgIGluZm8udnBhdGgsIGluZm8ubWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICN1cGRhdGVEb2NEb2N1bWVudHM7XG4gICAgI3VwZGF0ZUxlbWJlZERvY3VtZW50cztcblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI3VwZGF0ZURvY0RvY3VtZW50cykge1xuICAgICAgICAgICAgdGhpcy4jdXBkYXRlRG9jRG9jdW1lbnRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3VwZGF0ZS1kb2MtZG9jdW1lbnRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLiN1cGRhdGVMZW1iZWREb2N1bWVudHMpIHtcbiAgICAgICAgICAgIHRoaXMuI3VwZGF0ZUxlbWJlZERvY3VtZW50cyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICd1cGRhdGUtbGVtYmVkLWRvY3VtZW50cy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI3VwZGF0ZURvY0RvY3VtZW50cywge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcblxuICAgICAgICAgICAgJHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAkcGFyZW50RGlyOiBpbmZvLnBhcmVudERpcixcbiAgICAgICAgICAgICRkb2NNZXRhZGF0YTogSlNPTi5zdHJpbmdpZnkoaW5mby5kb2NNZXRhZGF0YSksXG4gICAgICAgICAgICAkZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgJGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgICRyZW5kZXJlck5hbWU6IGluZm8ucmVuZGVyZXJOYW1lXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRoaXMgaGFuZGxlcyBjb21wdXRpbmcgZW1iZWRkaW5nc1xuICAgICAgICAvLyBmb3IgdGhlIHRpdGxlIGFuZCBib2R5XG4gICAgICAgIGlmICh0eXBlb2YgbGVtYmVkTW9kZWxOYW1lID09PSAnc3RyaW5nJ1xuICAgICAgICAgLy8gJiYgdHlwZW9mIGluZm8udGl0bGUgPT09ICdzdHJpbmcnXG4gICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NCb2R5ID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI3VwZGF0ZUxlbWJlZERvY3VtZW50cywge1xuICAgICAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAkbGVtYmVkTW9kZWw6IGxlbWJlZE1vZGVsTmFtZSxcbiAgICAgICAgICAgICAgICAvLyAkdGl0bGVFbWJlZDogaW5mby50aXRsZSxcbiAgICAgICAgICAgICAgICAkYm9keUVtYmVkOiAgaW5mby5kb2NCb2R5XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICBhd2FpdCB0Z2x1ZS5hZGRUYWdHbHVlKGluZm8udnBhdGgsIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZGVsZXRlRG9jVGFnR2x1ZSh2cGF0aCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGdsdWUuZGVsZXRlVGFnR2x1ZSh2cGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gaWdub3JlXG4gICAgICAgICAgICAvLyBUaGlzIGNhbiB0aHJvdyBhbiBlcnJvciBsaWtlOlxuICAgICAgICAgICAgLy8gZG9jdW1lbnRzQ2FjaGUgRVJST1Ige1xuICAgICAgICAgICAgLy8gICAgIGNvZGU6ICdjaGFuZ2VkJyxcbiAgICAgICAgICAgIC8vICAgICBuYW1lOiAnZG9jdW1lbnRzJyxcbiAgICAgICAgICAgIC8vICAgICB2cGF0aDogJ19tZXJtYWlkL3JlbmRlcjMzNTY3MzkzODIubWVybWFpZCcsXG4gICAgICAgICAgICAvLyAgICAgZXJyb3I6IEVycm9yOiBkZWxldGUgZnJvbSAnVEFHR0xVRScgZmFpbGVkOiBub3RoaW5nIGNoYW5nZWRcbiAgICAgICAgICAgIC8vICAgICAgLi4uIHN0YWNrIHRyYWNlXG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBJbiBzdWNoIGEgY2FzZSB0aGVyZSBpcyBubyB0YWdHbHVlIGZvciB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAgICAvLyBUaGlzIFwiZXJyb3JcIiBpcyBzcHVyaW91cy5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUT0RPIElzIHRoZXJlIGFub3RoZXIgcXVlcnkgdG8gcnVuIHRoYXQgd2lsbFxuICAgICAgICAgICAgLy8gbm90IHRocm93IGFuIGVycm9yIGlmIG5vdGhpbmcgd2FzIGNoYW5nZWQ/XG4gICAgICAgICAgICAvLyBJbiBvdGhlciB3b3JkcywgdGhpcyBjb3VsZCBoaWRlIGEgbGVnaXRpbWF0ZVxuICAgICAgICAgICAgLy8gZXJyb3IuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgYWRkRG9jVGFnR2x1ZSh2cGF0aDogc3RyaW5nLCB0YWdzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAodHlwZW9mIHRhZ3MgIT09ICdzdHJpbmcnXG4gICAgICAgICAmJiAhQXJyYXkuaXNBcnJheSh0YWdzKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkRG9jVGFnR2x1ZSBtdXN0IGJlIGdpdmVuIGEgdGFncyBhcnJheSwgd2FzIGdpdmVuOiAke3V0aWwuaW5zcGVjdCh0YWdzKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0Z2x1ZS5hZGRUYWdHbHVlKHZwYXRoLCBcbiAgICAgICAgICAgIEFycmF5LmlzQXJyYXkodGFncylcbiAgICAgICAgICAgID8gdGFnc1xuICAgICAgICAgICAgOiBbIHRhZ3MgXSk7XG4gICAgfVxuXG4gICAgYXN5bmMgYWRkVGFnRGVzY3JpcHRpb24odGFnOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRkZXNjLmFkZERlc2ModGFnLCBkZXNjcmlwdGlvbik7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0VGFnRGVzY3JpcHRpb24odGFnOiBzdHJpbmcpXG4gICAgICAgIDogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+XG4gICAge1xuICAgICAgICByZXR1cm4gdGRlc2MuZ2V0RGVzYyh0YWcpO1xuICAgIH1cblxuICAgICNzZWFyY2hTZW1hbnRpYztcblxuICAgIGFzeW5jIHNlbWFudGljU2VhcmNoRG9jcyhzZWFyY2hGb3I6IHN0cmluZylcbiAgICAgICAgOiBQcm9taXNlPEFycmF5PHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBkaXN0YW5jZTogbnVtYmVyXG4gICAgICAgIH0+PlxuICAgIHtcbiAgICAgICAgaWYgKCF0aGlzLiNzZWFyY2hTZW1hbnRpYykge1xuICAgICAgICAgICAgdGhpcy4jc2VhcmNoU2VtYW50aWMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnZG9jLXNlYXJjaC1zZW1hbnRpYy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IDxBcnJheTx7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgZGlzdGFuY2U6IG51bWJlclxuICAgICAgICB9Pj4gYXdhaXQgdGhpcy5kYi5hbGwodGhpcy4jc2VhcmNoU2VtYW50aWMsIHtcbiAgICAgICAgICAgICRsZW1iZWRNb2RlbDogbGVtYmVkTW9kZWxOYW1lLFxuICAgICAgICAgICAgJHNlYXJjaEZvcjogc2VhcmNoRm9yXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBpbmRleENoYWluQ2FjaGU7XG5cbiAgICBhc3luYyBpbmRleENoYWluKF9mcGF0aClcbiAgICAgICAgOiBQcm9taXNlPGluZGV4Q2hhaW5JdGVtW10+XG4gICAge1xuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSkgXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXRoLnBhcnNlKGZwYXRoKTtcblxuICAgICAgICBjb25zdCBkb0NhY2hpbmdcbiAgICAgICAgICAgID0gdGhpcy5jb25maWcuY2FjaGluZ1RpbWVvdXQgPiAwO1xuICAgICAgICBsZXQgY2FjaGVLZXk7XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmluZGV4Q2hhaW5DYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhDaGFpbkNhY2hlXG4gICAgICAgICAgICAgICAgICAgID0gbmV3IENhY2hlKHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FjaGVLZXkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgZGJuYW1lOiB0aGlzLnF1b3RlZERCTmFtZSxcbiAgICAgICAgICAgICAgICBmcGF0aCxcbiAgICAgICAgICAgICAgICBwYXJzZWRcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBjYWNoZWRcbiAgICAgICAgICAgICAgICA9IHRoaXMuaW5kZXhDaGFpbkNhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbmRleENoYWluICR7X2ZwYXRofSAke2ZwYXRofWAsIHBhcnNlZCk7XG5cbiAgICAgICAgY29uc3QgZmlsZXo6IERvY3VtZW50W10gPSBbXTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChmcGF0aCk7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGZwYXRoO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmKSAmJiBzZWxmLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICBmaWxlei5wdXNoKHNlbGZbMF0pO1xuICAgICAgICAgICAgZmlsZU5hbWUgPSBzZWxmWzBdLnJlbmRlclBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50RGlyO1xuICAgICAgICBsZXQgZGlyTmFtZSA9IHBhdGguZGlybmFtZShmcGF0aCk7XG4gICAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICghKGRpck5hbWUgPT09ICcuJyB8fCBkaXJOYW1lID09PSBwYXJzZWQucm9vdCkpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGVOYW1lKSA9PT0gJ2luZGV4Lmh0bWwnKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShmaWxlTmFtZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxvb2tGb3IgPSBwYXRoLmpvaW4ocGFyZW50RGlyLCBcImluZGV4Lmh0bWxcIik7XG5cbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gYXdhaXQgdGhpcy5maW5kQnlQYXRoKGxvb2tGb3IpO1xuXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpbmRleCkgJiYgaW5kZXgubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgICAgICBmaWxlei5wdXNoKGluZGV4WzBdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsZU5hbWUgPSBsb29rRm9yO1xuICAgICAgICAgICAgZGlyTmFtZSA9IHBhdGguZGlybmFtZShsb29rRm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJldCA9IGZpbGV6XG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbihvYmo6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGluZGV4Q2hhaW5JdGVtPntcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBvYmouZG9jTWV0YWRhdGEudGl0bGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogb2JqLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmREaXI6IG9iai5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRQYXRoOiBvYmoucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiAnLycgKyBvYmoucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBvYmouZm91bmREaXIgPSBvYmoubW91bnRQb2ludDtcbiAgICAgICAgICAgICAgICAgICAgLy8gb2JqLmZvdW5kUGF0aCA9IG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICAvLyBvYmouZmlsZW5hbWUgPSAnLycgKyBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIG9iajtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5yZXZlcnNlKCk7XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZyAmJiBjYWNoZUtleSkge1xuICAgICAgICAgICAgdGhpcy5pbmRleENoYWluQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBzaWJsaW5nc0NhY2hlO1xuICAgICNzaWJsaW5nc1NRTDtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIGFsbCB0aGUgZG9jdW1lbnRzIGluIHRoZSBzYW1lIGRpcmVjdG9yeVxuICAgICAqIGFzIHRoZSBuYW1lZCBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBkb2Vzbid0IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBzaWJsaW5ncyhfZnBhdGgpIHtcbiAgICAgICAgbGV0IHZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUodnBhdGgpO1xuXG4gICAgICAgIGNvbnN0IGRvQ2FjaGluZ1xuICAgICAgICAgICAgPSB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDA7XG4gICAgICAgIGxldCBjYWNoZUtleTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc2libGluZ3NDYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2libGluZ3NDYWNoZVxuICAgICAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZFxuICAgICAgICAgICAgICAgID0gdGhpcy5zaWJsaW5nc0NhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy4jc2libGluZ3NTUUwpIHtcbiAgICAgICAgICAgIHRoaXMuI3NpYmxpbmdzU1FMID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3NpYmxpbmdzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzaWJsaW5nc1xuICAgICAgICAgICAgPSBhd2FpdCB0aGlzLmRiLmFsbCh0aGlzLiNzaWJsaW5nc1NRTCwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWUsXG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGlnbm9yZWQgPSBzaWJsaW5ncy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuaWdub3JlRmlsZShpdGVtKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gdGhpcy52YWxpZGF0ZVJvd3MoaWdub3JlZCk7XG4gICAgICAgIGNvbnN0IHJldCA9IG1hcHBlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nICYmIGNhY2hlS2V5KSB7XG4gICAgICAgICAgICB0aGlzLnNpYmxpbmdzQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgICNkb2NzRm9yRGlybmFtZTtcbiAgICAjZGlyc0ZvclBhcmVudGRpcjtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB0cmVlIG9mIGl0ZW1zIHN0YXJ0aW5nIGZyb20gdGhlIGRvY3VtZW50XG4gICAgICogbmFtZWQgaW4gX3Jvb3RJdGVtLiAgVGhlIHBhcmFtZXRlciBzaG91bGQgYmUgYW5cbiAgICAgKiBhY3R1YWwgZG9jdW1lbnQgaW4gdGhlIHRyZWUsIHN1Y2ggYXMgYHBhdGgvdG8vaW5kZXguaHRtbGAuXG4gICAgICogVGhlIHJldHVybiBpcyBhIHRyZWUtc2hhcGVkIHNldCBvZiBvYmplY3RzIGxpa2UgdGhlIGZvbGxvd2luZztcbiAgICAgKiBcbiAgdHJlZTpcbiAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlclxuICAgIGl0ZW1zOlxuICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBjaGlsZEZvbGRlcnM6XG4gICAgICAgIC0gZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICAgICAgaXRlbXM6XG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sXG4gICAgICAgICAgICAgIGNoaWxkRm9sZGVyczogW11cbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sXG4gICAgICAgICAgICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAqXG4gICAgICogVGhlIG9iamVjdHMgdW5kZXIgYGl0ZW1zYCBhcmUgYWN0dWxseSB0aGUgZnVsbCBEb2N1bWVudCBvYmplY3RcbiAgICAgKiBmcm9tIHRoZSBjYWNoZSwgYnV0IGZvciB0aGUgaW50ZXJlc3Qgb2YgY29tcGFjdG5lc3MgbW9zdCBvZlxuICAgICAqIHRoZSBmaWVsZHMgaGF2ZSBiZWVuIGRlbGV0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX3Jvb3RJdGVtIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGNoaWxkSXRlbVRyZWUoX3Jvb3RJdGVtOiBzdHJpbmcpIHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hpbGRJdGVtVHJlZSAke19yb290SXRlbX1gKTtcblxuICAgICAgICBsZXQgcm9vdEl0ZW0gPSBhd2FpdCB0aGlzLmZpbmQoXG4gICAgICAgICAgICAgICAgX3Jvb3RJdGVtLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9yb290SXRlbS5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfcm9vdEl0ZW0pO1xuICAgICAgICBpZiAoIXJvb3RJdGVtKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYGNoaWxkSXRlbVRyZWUgbm8gcm9vdEl0ZW0gZm91bmQgZm9yIHBhdGggJHtfcm9vdEl0ZW19YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKHR5cGVvZiByb290SXRlbSA9PT0gJ29iamVjdCcpXG4gICAgICAgICB8fCAhKCd2cGF0aCcgaW4gcm9vdEl0ZW0pXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGBjaGlsZEl0ZW1UcmVlIGZvdW5kIGludmFsaWQgb2JqZWN0IGZvciAke19yb290SXRlbX0gLSAke3V0aWwuaW5zcGVjdChyb290SXRlbSl9YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKHJvb3RJdGVtLnZwYXRoKTtcblxuICAgICAgICBpZiAoIXRoaXMuI2RvY3NGb3JEaXJuYW1lKSB7XG4gICAgICAgICAgICB0aGlzLiNkb2NzRm9yRGlybmFtZSA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdkb2NzLWZvci1kaXJuYW1lLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQaWNrcyB1cCBldmVyeXRoaW5nIGZyb20gdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIC8vIERpZmZlcnMgZnJvbSBzaWJsaW5ncyBieSBnZXR0aW5nIGV2ZXJ5dGhpbmcuXG4gICAgICAgIGNvbnN0IF9pdGVtcyA9IDxhbnlbXT5hd2FpdCB0aGlzLmRiLmFsbCh0aGlzLiNkb2NzRm9yRGlybmFtZSwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGl0ZW1zOiBEb2N1bWVudFtdXG4gICAgICAgICAgICA9IHRoaXMudmFsaWRhdGVSb3dzKF9pdGVtcylcbiAgICAgICAgICAgIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghdGhpcy4jZGlyc0ZvclBhcmVudGRpcikge1xuICAgICAgICAgICAgdGhpcy4jZGlyc0ZvclBhcmVudGRpciA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdkaXJzLWZvci1wYXJlbnRkaXIuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF9jaGlsZEZvbGRlcnMgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwodGhpcy4jZGlyc0ZvclBhcmVudGRpciwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNoaWxkRm9sZGVycyA9IG5ldyBBcnJheTx7IGRpcm5hbWU6IHN0cmluZyB9PigpO1xuICAgICAgICBmb3IgKGNvbnN0IGNmIG9mIF9jaGlsZEZvbGRlcnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2YuZGlybmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjaGlsZEZvbGRlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGRpcm5hbWU6IGNmLmRpcm5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjaGlsZEl0ZW1UcmVlKCR7X3Jvb3RJdGVtfSkgbm8gZGlybmFtZSBmaWVsZHMgaW4gY2hpbGRGb2xkZXJzYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2ZzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgY2Ygb2YgY2hpbGRGb2xkZXJzKSB7XG4gICAgICAgICAgICBjZnMucHVzaChhd2FpdCB0aGlzLmNoaWxkSXRlbVRyZWUoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKGNmLmRpcm5hbWUsICdpbmRleC5odG1sJylcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvb3RJdGVtLFxuICAgICAgICAgICAgZGlybmFtZSxcbiAgICAgICAgICAgIGl0ZW1zOiBpdGVtcyxcbiAgICAgICAgICAgIC8vIFVuY29tbWVudCB0aGlzIHRvIGdlbmVyYXRlIHNpbXBsaWZpZWQgb3V0cHV0XG4gICAgICAgICAgICAvLyBmb3IgZGVidWdnaW5nLlxuICAgICAgICAgICAgLy8gLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoXG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSksXG4gICAgICAgICAgICBjaGlsZEZvbGRlcnM6IGNmc1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgI2luZGV4RmlsZXNTUUw7XG4gICAgI2luZGV4RmlsZXNTUUxyZW5kZXJQYXRoO1xuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgaW5kZXggZmlsZXMgKHJlbmRlcnMgdG8gaW5kZXguaHRtbClcbiAgICAgKiB3aXRoaW4gdGhlIG5hbWVkIHN1YnRyZWUuXG4gICAgICogXG4gICAgICogSXQgYXBwZWFycyB0aGlzIHdhcyB3cml0dGVuIGZvciBib29rbmF2LlxuICAgICAqIEJ1dCwgaXQgYXBwZWFycyB0aGF0IGJvb2tuYXYgZG9lcyBub3RcbiAgICAgKiB1c2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb290UGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBpbmRleEZpbGVzKHJvb3RQYXRoPzogc3RyaW5nKSB7XG4gICAgICAgIGxldCByb290UCA9IHJvb3RQYXRoPy5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgID8gcm9vdFBhdGg/LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgOiByb290UGF0aDtcblxuICAgICAgICBpZiAoIXRoaXMuI2luZGV4RmlsZXNTUUwpIHtcbiAgICAgICAgICAgIHRoaXMuI2luZGV4RmlsZXNTUUwgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5kZXgtZG9jLWZpbGVzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuI2luZGV4RmlsZXNTUUxyZW5kZXJQYXRoKSB7XG4gICAgICAgICAgICB0aGlzLiNpbmRleEZpbGVzU1FMcmVuZGVyUGF0aCA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdpbmRleC1kb2MtZmlsZXMtcmVuZGVyUGF0aC5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXhlcyA9IFxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIHR5cGVvZiByb290UCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAmJiByb290UC5sZW5ndGggPj0gMVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgPyA8YW55W10+IGF3YWl0IHRoaXMuZGIuYWxsKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLiNpbmRleEZpbGVzU1FMcmVuZGVyUGF0aCwgeyAkcm9vdFA6IGAke3Jvb3RQfSVgIH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICA6IDxhbnlbXT4gYXdhaXQgdGhpcy5kYi5hbGwoXG4gICAgICAgICAgICAgICAgdGhpcy4jaW5kZXhGaWxlc1NRTFxuICAgICAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHRoaXMudmFsaWRhdGVSb3dzKGluZGV4ZXMpO1xuICAgICAgICByZXR1cm4gbWFwcGVkLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN2dFJvd1RvT2JqKGl0ZW0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEl0J3MgcHJvdmVkIGRpZmZpY3VsdCB0byBnZXQgdGhlIHJlZ2V4cFxuICAgICAgICAvLyB0byB3b3JrIGluIHRoaXMgbW9kZTpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gcmV0dXJuIGF3YWl0IHRoaXMuc2VhcmNoKHtcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0hUTUw6IHRydWUsXG4gICAgICAgIC8vICAgICByZW5kZXJwYXRobWF0Y2g6IC9cXC9pbmRleC5odG1sJC8sXG4gICAgICAgIC8vICAgICByb290UGF0aDogcm9vdFBhdGhcbiAgICAgICAgLy8gfSk7XG4gICAgfVxuXG4gICAgI2ZpbGVzRm9yU2V0VGltZXM7XG5cbiAgICAvKipcbiAgICAgKiBGb3IgZXZlcnkgZmlsZSBpbiB0aGUgZG9jdW1lbnRzIGNhY2hlLFxuICAgICAqIHNldCB0aGUgYWNjZXNzIGFuZCBtb2RpZmljYXRpb25zLlxuICAgICAqIFxuICAgICAqIFRoaXMgaXMgdXNlZCBmcm9tIGNsaS50cyBkb2NzLXNldC1kYXRlc1xuICAgICAqXG4gICAgICogPz8/Pz8gV2h5IHdvdWxkIHRoaXMgYmUgdXNlZnVsP1xuICAgICAqIEkgY2FuIHNlZSBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWRcbiAgICAgKiBmaWxlcyBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeS4gIEJ1dCB0aGlzIGlzXG4gICAgICogZm9yIHRoZSBmaWxlcyBpbiB0aGUgZG9jdW1lbnRzIGRpcmVjdG9yaWVzLiA/Pz8/XG4gICAgICovXG4gICAgYXN5bmMgc2V0VGltZXMoKSB7XG5cbiAgICAgICAgLy8gVGhlIFNFTEVDVCBiZWxvdyBwcm9kdWNlcyByb3cgb2JqZWN0cyBwZXJcbiAgICAgICAgLy8gdGhpcyBpbnRlcmZhY2UgZGVmaW5pdGlvbi4gIFRoaXMgZnVuY3Rpb24gbG9va3NcbiAgICAgICAgLy8gZm9yIGEgdmFsaWQgZGF0ZSBmcm9tIHRoZSBkb2N1bWVudCBtZXRhZGF0YSxcbiAgICAgICAgLy8gYW5kIGVuc3VyZXMgdGhlIGZzcGF0aCBmaWxlIGlzIHNldCB0byB0aGF0IGRhdGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHNhaWQgaW4gdGhlIGNvbW1lbnQgYWJvdmUuLi4uIFdIWT9cbiAgICAgICAgLy8gSSBjYW4gdW5kZXJzdGFuZCBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWQgb3V0cHV0LlxuICAgICAgICAvLyBGb3Igd2hhdCBwdXJwb3NlIGRpZCBJIGNyZWF0ZSB0aGlzIGZ1bmN0aW9uP1xuICAgICAgICBjb25zdCBzZXR0ZXIgPSAocm93OiB7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgZnNwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBtdGltZU1zOiBudW1iZXIsXG4gICAgICAgICAgICBwdWJsaWNhdGlvblRpbWU6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxEYXRlOiBzdHJpbmcsXG4gICAgICAgICAgICBwdWJsaWNhdGlvbkRhdGU6IHN0cmluZ1xuICAgICAgICB9KSA9PiB7XG4gICAgICAgICAgICBsZXQgcGFyc2VkID0gTmFOO1xuICAgICAgICAgICAgaWYgKHJvdy5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxEYXRlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93LnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5wdWJsaWNhdGlvblRpbWUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZWQgPSByb3cucHVibGljYXRpb25UaW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRwID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICBGUy51dGltZXNTeW5jKFxuICAgICAgICAgICAgICAgICAgICByb3cuZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBkcCxcbiAgICAgICAgICAgICAgICAgICAgZHBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy4jZmlsZXNGb3JTZXRUaW1lcykge1xuICAgICAgICAgICAgdGhpcy4jZmlsZXNGb3JTZXRUaW1lcyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdmaWxlcy1mb3Itc2V0dGltZXMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuZGIuZWFjaCh0aGlzLiNmaWxlc0ZvclNldFRpbWVzLCB7IH0sXG4gICAgICAgIChyb3c6IHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBmc3BhdGg6IHN0cmluZyxcbiAgICAgICAgICAgIG10aW1lTXM6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uVGltZTogbnVtYmVyLFxuICAgICAgICAgICAgcHVibERhdGU6IHN0cmluZyxcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uRGF0ZTogc3RyaW5nXG4gICAgICAgIH0pID0+IHtcbiAgICAgICAgICAgIGlmIChyb3cucHVibERhdGVcbiAgICAgICAgICAgICB8fCByb3cucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgfHwgcm93LnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc2V0dGVyKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRoaXMgd2FzIHdyaXR0ZW4gZm9yIHRhZ2dlZC1jb250ZW50XG4gICAgYXN5bmMgZG9jdW1lbnRzV2l0aFRhZyh0YWdubTogc3RyaW5nIHwgc3RyaW5nW10pXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxzdHJpbmc+PlxuICAgIHtcbiAgICAgICAgbGV0IHRhZ3M6IHN0cmluZ1tdO1xuICAgICAgICBpZiAodHlwZW9mIHRhZ25tID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGFncyA9IFsgdGFnbm0gXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRhZ25tKSkge1xuICAgICAgICAgICAgdGFncyA9IHRhZ25tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudHNXaXRoVGFnIGdpdmVuIGJhZCB0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KHRhZ25tKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvcnJlY3RseSBoYW5kbGUgdGFnIHN0cmluZ3Mgd2l0aFxuICAgICAgICAvLyB2YXJ5aW5nIHF1b3Rlcy4gIEEgZG9jdW1lbnQgbWlnaHQgaGF2ZSB0aGVzZSB0YWdzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICB0YWdzOlxuICAgICAgICAvLyAgICAtIFRlYXNlcidzXG4gICAgICAgIC8vICAgIC0gVGVhc2Vyc1xuICAgICAgICAvLyAgICAtIFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZXNlIFNRTCBxdWVyaWVzIHdvcms6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVvdGVkXCInLCBcIlRlYXNlcidzXCIgKTtcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxUZWFzZXInc1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVvdGVkXCInLCAnVGVhc2VyJydzJyApO1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFRlYXNlcidzXG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8U29tZXRoaW5nIFwicXVvdGVkXCJcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQnV0LCB0aGlzIGRvZXMgbm90OlxuICAgICAgICAvL1xuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lID0gJ1RlYXNlcidzJztcbiAgICAgICAgLy8gJyAgLi4uPiBcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIG9yaWdpbmFsIGNvZGUgYmVoYXZpb3Igd2FzIHRoaXM6XG4gICAgICAgIC8vXG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInNcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuIGF0dGVtcHRlZCBmaXg6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgXCJUZWFzZXInc1wiIF0gICggJ1RlYXNlclxcJ3MnICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwic1wiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5vdGhlciBhdHRlbXB0ZWQgZml4OlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiBdICAoIFwiVGVhc2VyJydzXCIgKSBcbiAgICAgICAgLy8gW11cbiAgICAgICAgLy8gW11cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5kOlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyAnU29tZXRoaW5nIFwicXVvdGVkXCInXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyAnU29tZXRoaW5nIFwicXVvdGVkXCInIF0gICggXCJTb21ldGhpbmcgXCJxdW90ZWRcIlwiICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwicXVvdGVkXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgY29kZSBiZWxvdyBwcm9kdWNlczpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiICdTb21ldGhpbmcgXCJxdW90ZWRcIidcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiwgJ1NvbWV0aGluZyBcInF1b3RlZFwiJyBdICAoICdUZWFzZXInJ3MnLCdTb21ldGhpbmcgXCJxdW90ZWRcIicgKSBcbiAgICAgICAgLy8gWyB7IHZwYXRoOiAndGVhc2VyLWNvbnRlbnQuaHRtbC5tZCcgfSBdXG4gICAgICAgIC8vIFsgJ3RlYXNlci1jb250ZW50Lmh0bWwubWQnIF1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZG9jdW1lbnRzV2l0aFRhZyAke3V0aWwuaW5zcGVjdCh0YWdzKX0gJHt0YWdzdHJpbmd9YCk7XG5cbiAgICAgICAgY29uc3QgdnBhdGhzID0gYXdhaXQgdGdsdWUucGF0aHNGb3JUYWcodGFncyk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zb2xlLmxvZyh2cGF0aHMpO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2cGF0aHMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50c1dpdGhUYWcgbm9uLUFycmF5IHJlc3VsdCAke3V0aWwuaW5zcGVjdCh2cGF0aHMpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZwYXRocztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gYXJyYXkgb2YgdGFncyB1c2VkIGJ5IGFsbCBkb2N1bWVudHMuXG4gICAgICogVGhpcyB1c2VzIHRoZSBKU09OIGV4dGVuc2lvbiB0byBleHRyYWN0XG4gICAgICogdGhlIHRhZ3MgZnJvbSB0aGUgbWV0YWRhdGEgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgdGFncygpIHtcbiAgICAgICAgY29uc3QgdGFncyA9IGF3YWl0IHRnbHVlLnRhZ3MoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHJldCA9IEFycmF5LmZyb20odGFncyk7XG4gICAgICAgIHJldHVybiByZXQuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHZhciB0YWdBID0gYS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIHRhZ0IgPSBiLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAodGFnQSA8IHRhZ0IpIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmICh0YWdBID4gdGFnQikgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBncm91cHMgb2Ygc2ltaWxhciB0YWdzIGJhc2VkIG9uIGNhc2UtaW5zZW5zaXRpdmUgbWF0Y2hpbmcsXG4gICAgICogcGx1cmFsL3Npbmd1bGFyIHZhcmlhbnRzLCBhbmQgTGV2ZW5zaHRlaW4gZGlzdGFuY2UuXG4gICAgICogXG4gICAgICogQHBhcmFtIHRocmVzaG9sZCAtIE1heGltdW0gTGV2ZW5zaHRlaW4gZGlzdGFuY2UgdG8gY29uc2lkZXIgdGFncyBzaW1pbGFyIChkZWZhdWx0OiAyKVxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIFNpbWlsYXJUYWdHcm91cCBvYmplY3RzXG4gICAgICovXG4gICAgYXN5bmMgZmluZFNpbWlsYXJUYWdzKHRocmVzaG9sZDogbnVtYmVyID0gMik6IFByb21pc2U8U2ltaWxhclRhZ0dyb3VwW10+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRnbHVlLmZpbmRTaW1pbGFyVGFncyh0aHJlc2hvbGQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGFncyB0aGF0IGhhdmUgbm8gZGVzY3JpcHRpb24gaW4gdGhlIFRBR0RFU0NSSVBUSU9OIHRhYmxlLlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIFRhZ1dpdGhvdXREZXNjcmlwdGlvbiBvYmplY3RzXG4gICAgICovXG4gICAgYXN5bmMgdGFnc1dpdGhvdXREZXNjcmlwdGlvbnMoKTogUHJvbWlzZTxUYWdXaXRob3V0RGVzY3JpcHRpb25bXT4ge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGdsdWUudGFnc1dpdGhvdXREZXNjcmlwdGlvbnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRhZyBkZXNjcmlwdGlvbnMgdGhhdCBhcmUgZGVmaW5lZCBidXQgbm90IHVzZWQgYnkgYW55IGRvY3VtZW50LlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIHRhZyBuYW1lc1xuICAgICAqL1xuICAgIGFzeW5jIHVudXNlZFRhZ0Rlc2NyaXB0aW9ucygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0ZGVzYy51bnVzZWRUYWdEZXNjcmlwdGlvbnMoKTtcbiAgICB9XG5cbiAgICAjZG9jTGlua0RhdGE7XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgZGF0YSBmb3IgYW4gaW50ZXJuYWwgbGlua1xuICAgICAqIHdpdGhpbiB0aGUgc2l0ZSBkb2N1bWVudHMuICBGb3JtaW5nIGFuXG4gICAgICogaW50ZXJuYWwgbGluayBpcyBhdCBhIG1pbmltdW0gdGhlIHJlbmRlcmVkXG4gICAgICogcGF0aCBmb3IgdGhlIGRvY3VtZW50IGFuZCBpdHMgdGl0bGUuXG4gICAgICogVGhlIHRlYXNlciwgaWYgYXZhaWxhYmxlLCBjYW4gYmUgdXNlZCBpblxuICAgICAqIGEgdG9vbHRpcC4gVGhlIHRodW1ibmFpbCBpcyBhbiBpbWFnZSB0aGF0XG4gICAgICogY291bGQgYmUgZGlzcGxheWVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGRvY0xpbmtEYXRhKHZwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcblxuICAgICAgICAvLyBUaGUgdnBhdGggcmVmZXJlbmNlXG4gICAgICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBwYXRoIGl0IHJlbmRlcnMgdG9cbiAgICAgICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGl0bGUgc3RyaW5nIGZyb20gdGhhdCBwYWdlXG4gICAgICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSB0ZWFzZXIgdGV4dCBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0ZWFzZXI/OiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBoZXJvIGltYWdlICh0aHVtYm5haWwpXG4gICAgICAgIHRodW1ibmFpbD86IHN0cmluZztcbiAgICB9PiB7XG5cbiAgICAgICAgaWYgKCF0aGlzLiNkb2NMaW5rRGF0YSkge1xuICAgICAgICAgICAgdGhpcy4jZG9jTGlua0RhdGEgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnZG9jLWxpbmstZGF0YS5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm91bmQgPSA8YW55W10+IGF3YWl0IHRoaXMuZGIuYWxsKHRoaXMuI2RvY0xpbmtEYXRhLCB7XG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZvdW5kKSkge1xuXG4gICAgICAgICAgICBjb25zdCBkb2MgPSBmb3VuZFswXTtcblxuICAgICAgICAgICAgLy8gaWYgKCFkb2MubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIC8vICAgICBjb25zb2xlLndhcm4oYFdBUk5JTkcgZG9jTGlua0RhdGEgbm8gbWV0YWRhdGEgZm9yICR7dnBhdGh9YCk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8vIGNvbnN0IGRvY0luZm8gPSBhd2FpdCB0aGlzLmZpbmQodnBhdGgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBkb2MucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICB0aXRsZTogZG9jLnRpdGxlLFxuICAgICAgICAgICAgICAgIHRlYXNlcjogZG9jLnRlYXNlcixcbiAgICAgICAgICAgICAgICAvLyB0aHVtYm5haWxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB0aXRsZTogdW5kZWZpbmVkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZWFyY2hDYWNoZTtcblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gZGVzY3JpcHRpdmUgc2VhcmNoIG9wZXJhdGlvbnMgdXNpbmcgZGlyZWN0IFNRTCBxdWVyaWVzXG4gICAgICogZm9yIGJldHRlciBwZXJmb3JtYW5jZSBhbmQgc2NhbGFiaWxpdHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBTZWFyY2ggb3B0aW9ucyBvYmplY3RcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlPEFycmF5PERvY3VtZW50Pj5cbiAgICAgKi9cbiAgICBhc3luYyBzZWFyY2gob3B0aW9ucyk6IFByb21pc2U8QXJyYXk8RG9jdW1lbnQ+PiB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLnNlYXJjaENhY2hlKSB7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaENhY2hlID0gbmV3IENhY2hlKFxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmlyc3QsIHNlZSBpZiB0aGUgc2VhcmNoIHJlc3VsdHMgYXJlIGFscmVhZHlcbiAgICAgICAgLy8gY29tcHV0ZWQgYW5kIGluIHRoZSBjYWNoZS5cblxuICAgICAgICAvLyBUaGUgaXNzdWUgaGVyZSBpcyB0aGF0IHRoZSBvcHRpb25zXG4gICAgICAgIC8vIG9iamVjdCBjYW4gY29udGFpbiBSZWdFeHAgdmFsdWVzLlxuICAgICAgICAvLyBUaGUgUmVnRXhwIG9iamVjdCBkb2VzIG5vdCBoYXZlXG4gICAgICAgIC8vIGEgdG9KU09OIGZ1bmN0aW9uLiAgVGhpcyBob29rXG4gICAgICAgIC8vIGNhdXNlcyBSZWdFeHAgdG8gcmV0dXJuIHRoZVxuICAgICAgICAvLyAudG9TdHJpbmcoKSB2YWx1ZSBpbnN0ZWFkLlxuICAgICAgICAvL1xuICAgICAgICAvLyBTb3VyY2U6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIwMjc2NTMxL3N0cmluZ2lmeWluZy1hLXJlZ3VsYXItZXhwcmVzc2lvblxuICAgICAgICAvL1xuICAgICAgICAvLyBBIHNpbWlsYXIgaXNzdWUgZXhpc3RzIHdpdGggRnVuY3Rpb25zXG4gICAgICAgIC8vIGluIHRoZSBvYmplY3QuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFNvdXJjZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjc1NDkxOS9qc29uLXN0cmluZ2lmeS1mdW5jdGlvblxuICAgICAgICBjb25zdCBjYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlICsgJyc7IC8vIGltcGxpY2l0bHkgYHRvU3RyaW5nYCBpdFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gQSB0aW1lb3V0IG9mIDAgbWVhbnMgdG8gZGlzYWJsZSBjYWNoaW5nXG4gICAgICAgIGNvbnN0IGNhY2hlZCA9XG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5zZWFyY2hDYWNoZS5nZXQoY2FjaGVLZXkpXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfSA9PT4gJHtjYWNoZUtleX0gJHtjYWNoZWQgPyAnaGFzQ2FjaGVkJyA6ICdub0NhY2hlZCd9YCk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGNhY2hlIGhhcyBhbiBlbnRyeSwgc2tpcCBjb21wdXRpbmdcbiAgICAgICAgLy8gYW55dGhpbmcuXG4gICAgICAgIGlmIChjYWNoZWQpIHsgLy8gMSBtaW51dGUgY2FjaGVcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOT1RFOiBFbnRyaWVzIGFyZSBhZGRlZCB0byB0aGUgY2FjaGUgYXQgdGhlIGJvdHRvbVxuICAgICAgICAvLyBvZiB0aGlzIGZ1bmN0aW9uXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgc3FsLCBwYXJhbXMgfSA9IHRoaXMuYnVpbGRTZWFyY2hRdWVyeShvcHRpb25zKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggJHtzcWx9YCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHRzXG4gICAgICAgICAgICAgICAgPSBhd2FpdCB0aGlzLmRiLmFsbChzcWwsIHBhcmFtcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50c1xuICAgICAgICAgICAgICAgID0gdGhpcy52YWxpZGF0ZVJvd3MocmVzdWx0cylcbiAgICAgICAgICAgICAgICAubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBBcHBseSBwb3N0LVNRTCBmaWx0ZXJzIHRoYXQgY2FuJ3QgYmUgZG9uZSBpbiBTUUxcbiAgICAgICAgICAgIGxldCBmaWx0ZXJlZFJlc3VsdHMgPSBkb2N1bWVudHM7XG5cbiAgICAgICAgICAgIC8vIEZpbHRlciBieSByZW5kZXJlcnMgKHJlcXVpcmVzIGNvbmZpZyBsb29rdXApXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJlcnNcbiAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVyZXJzKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbmRlcmVyID0gZmNhY2hlLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGl0ZW0udnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlbmRlcmVyKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCByIG9mIG9wdGlvbnMucmVuZGVyZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnICYmIHIgPT09IHJlbmRlcmVyLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1dBUk5JTkc6IE1hdGNoaW5nIHJlbmRlcmVyIGJ5IG9iamVjdCBjbGFzcyBpcyBubyBsb25nZXIgc3VwcG9ydGVkJywgcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBcHBseSBjdXN0b20gZmlsdGVyIGZ1bmN0aW9uXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXJmdW5jKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZmlsdGVyZnVuYyhmY2FjaGUuY29uZmlnLCBvcHRpb25zLCBpdGVtKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXBwbHkgY3VzdG9tIHNvcnQgZnVuY3Rpb24gKGlmIFNRTCBzb3J0aW5nIHdhc24ndCB1c2VkKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRGdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLnNvcnQob3B0aW9ucy5zb3J0RnVuYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFkZCB0aGUgcmVzdWx0cyB0byB0aGUgY2FjaGVcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaENhY2hlLnB1dChcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVLZXksIGZpbHRlcmVkUmVzdWx0c1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyZWRSZXN1bHRzO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5zZWFyY2ggZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCBTUUwgcXVlcnkgYW5kIHBhcmFtZXRlcnMgZm9yIHNlYXJjaCBvcHRpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZFNlYXJjaFF1ZXJ5KG9wdGlvbnMpOiB7XG4gICAgICAgIHNxbDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IGFueVxuICAgIH0ge1xuICAgICAgICBjb25zdCBwYXJhbXM6IGFueSA9IHt9O1xuICAgICAgICBjb25zdCB3aGVyZUNsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGpvaW5zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBsZXQgcGFyYW1Db3VudGVyID0gMDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgYnVpbGRTZWFyY2hRdWVyeSAke3V0aWwuaW5zcGVjdChvcHRpb25zKX1gKTtcblxuICAgICAgICAvLyBIZWxwZXIgdG8gY3JlYXRlIHVuaXF1ZSBwYXJhbWV0ZXIgbmFtZXNcbiAgICAgICAgY29uc3QgYWRkUGFyYW0gPSAodmFsdWU6IGFueSk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgJHBhcmFtJHsrK3BhcmFtQ291bnRlcn1gO1xuICAgICAgICAgICAgcGFyYW1zW3BhcmFtTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbU5hbWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQmFzZSBxdWVyeVxuICAgICAgICBsZXQgc3FsID0gYFxuICAgICAgICAgICAgU0VMRUNUIERJU1RJTkNUIGQuKiBGUk9NICR7dGhpcy5xdW90ZWREQk5hbWV9IGRcbiAgICAgICAgYDtcblxuICAgICAgICAvLyBNSU1FIHR5cGUgZmlsdGVyaW5nXG4gICAgICAgIGlmIChvcHRpb25zLm1pbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLm1pbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMubWltZSl9YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5taW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubWltZS5tYXAobWltZSA9PiBhZGRQYXJhbShtaW1lKSkuam9pbignLCAnKTtcbiAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5taW1lIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW5kZXJzIHRvIEhUTUwgZmlsdGVyaW5nXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJzVG9IVE1MID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnJlbmRlcnNUb0hUTUwgPSAke2FkZFBhcmFtKG9wdGlvbnMucmVuZGVyc1RvSFRNTCA/IDEgOiAwKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJvb3QgcGF0aCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJvb3RQYXRoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBMSUtFICR7YWRkUGFyYW0ob3B0aW9ucy5yb290UGF0aCArICclJyl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5nbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMuZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5nbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQudnBhdGggR0xPQiAke2FkZFBhcmFtKGVzY2FwZWRHbG9iKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciBnbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMucmVuZGVyZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5yZW5kZXJnbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLnJlbmRlcmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMucmVuZGVyZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5yZW5kZXJnbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBHTE9CICR7YWRkUGFyYW0oZXNjYXBlZEdsb2IpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmxvZyB0YWcgZmlsdGVyaW5nXG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBibG9ndGFncyBhcnJheSBpcyB1c2VkLFxuICAgICAgICAvLyBpZiBwcmVzZW50LCB3aXRoIHRoZSBibG9ndGFnIHZhbHVlIHVzZWRcbiAgICAgICAgLy8gb3RoZXJ3aXNlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgcHVycG9zZSBmb3IgdGhlIGJsb2d0YWdzIHZhbHVlIGlzIHRvXG4gICAgICAgIC8vIHN1cHBvcnQgYSBwc2V1ZG8tYmxvZyBtYWRlIG9mIHRoZSBpdGVtc1xuICAgICAgICAvLyBmcm9tIG11bHRpcGxlIGFjdHVhbCBibG9ncy5cbiAgICAgICAgLy8gaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAvLyAgfHwgdHlwZW9mIG9wdGlvbnMuYmxvZ3RhZyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhgIGJsb2d0YWdzICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZ3MpfSBibG9ndGFnICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZyl9YCk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5ibG9ndGFncykpIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMuYmxvZ3RhZ3MubWFwKHRhZyA9PiBhZGRQYXJhbSh0YWcpKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5ibG9ndGFnID0gJHthZGRQYXJhbShvcHRpb25zLmJsb2d0YWcpfWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQuYmxvZ3RhZyA9ICR7b3B0aW9ucy5ibG9ndGFnfWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBibG9ndGFncyBhcnJheSAke3V0aWwuaW5zcGVjdChvcHRpb25zLmJsb2d0YWdzKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRhZyBmaWx0ZXJpbmcgdXNpbmcgVEFHR0xVRSB0YWJsZVxuICAgICAgICBpZiAob3B0aW9ucy50YWcgJiYgdHlwZW9mIG9wdGlvbnMudGFnID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgam9pbnMucHVzaChgSU5ORVIgSk9JTiBUQUdHTFVFIHRnIE9OIGQudnBhdGggPSB0Zy5kb2N2cGF0aGApO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYHRnLnRhZ05hbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMudGFnKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExheW91dCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMubGF5b3V0cykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5sYXlvdXRzKSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxheW91dHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5sYXlvdXRzWzBdKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubGF5b3V0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubGF5b3V0cy5tYXAobGF5b3V0ID0+IGFkZFBhcmFtKGxheW91dCkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubGF5b3V0ID0gJHthZGRQYXJhbShvcHRpb25zLmxheW91dHMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGF0aCByZWdleCBtYXRjaGluZ1xuICAgICAgICBjb25zdCByZWdleENsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5wYXRobWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucGF0aG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5wYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciBwYXRoIHJlZ2V4IG1hdGNoaW5nXG4gICAgICAgIC8vIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3Qob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gsIGZhbHNlLCAzKSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIHN0cmluZyAke29wdGlvbnMucmVuZGVycGF0aG1hdGNofWApO1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIHJlZ2V4cCAke29wdGlvbnMucmVuZGVycGF0aG1hdGNoLnNvdXJjZX1gKTtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIGFycmF5IHN0cmluZyAke21hdGNofWApO1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIGFycmF5IHJlZ2V4cCAke21hdGNoLnNvdXJjZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdyZW5kZXJwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZWdleENsYXVzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYCgke3JlZ2V4Q2xhdXNlcy5qb2luKCcgT1IgJyl9KWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIEpPSU5zIHRvIHF1ZXJ5XG4gICAgICAgIGlmIChqb2lucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzcWwgKz0gJyAnICsgam9pbnMuam9pbignICcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIFdIRVJFIGNsYXVzZVxuICAgICAgICBpZiAod2hlcmVDbGF1c2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNxbCArPSAnIFdIRVJFICcgKyB3aGVyZUNsYXVzZXMuam9pbignIEFORCAnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBPUkRFUiBCWSBjbGF1c2VcbiAgICAgICAgbGV0IG9yZGVyQnkgPSAnJztcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRCeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIEhhbmRsZSBzcGVjaWFsIGNhc2VzIHRoYXQgbmVlZCBKU09OIGV4dHJhY3Rpb24gb3IgY29tcGxleCBsb2dpY1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25EYXRlJ1xuICAgICAgICAgICAgIHx8IG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25UaW1lJ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIENPQUxFU0NFIHRvIGhhbmRsZSBudWxsIHB1YmxpY2F0aW9uIGRhdGVzXG4gICAgICAgICAgICAgICAgb3JkZXJCeSA9IGBPUkRFUiBCWSBDT0FMRVNDRShcbiAgICAgICAgICAgICAgICAgICAgZC5wdWJsaWNhdGlvblRpbWUsXG4gICAgICAgICAgICAgICAgICAgIGQubXRpbWVNc1xuICAgICAgICAgICAgICAgIClgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIG90aGVyIGZpZWxkcywgc29ydCBieSB0aGUgY29sdW1uIGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBhbGxvd3Mgc29ydGluZyBieSBhbnkgdmFsaWQgY29sdW1uIGluIHRoZSBET0NVTUVOVFMgdGFibGVcbiAgICAgICAgICAgICAgICBvcmRlckJ5ID0gYE9SREVSIEJZIGQuJHtTcWxTdHJpbmcuZXNjYXBlSWQob3B0aW9ucy5zb3J0QnkpfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZXZlcnNlIHx8IG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZykge1xuICAgICAgICAgICAgLy8gSWYgcmV2ZXJzZS9zb3J0QnlEZXNjZW5kaW5nIGlzIHNwZWNpZmllZCB3aXRob3V0IHNvcnRCeSwgXG4gICAgICAgICAgICAvLyB1c2UgYSBkZWZhdWx0IG9yZGVyaW5nIChieSBtb2RpZmljYXRpb24gdGltZSlcbiAgICAgICAgICAgIG9yZGVyQnkgPSAnT1JERVIgQlkgZC5tdGltZU1zJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBzb3J0IGRpcmVjdGlvblxuICAgICAgICBpZiAob3JkZXJCeSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZyB8fCBvcHRpb25zLnJldmVyc2UpIHtcbiAgICAgICAgICAgICAgICBvcmRlckJ5ICs9ICcgREVTQyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9yZGVyQnkgKz0gJyBBU0MnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3FsICs9ICcgJyArIG9yZGVyQnk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgTElNSVQgYW5kIE9GRlNFVFxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubGltaXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBzcWwgKz0gYCBMSU1JVCAke2FkZFBhcmFtKG9wdGlvbnMubGltaXQpfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHNxbCArPSBgIE9GRlNFVCAke2FkZFBhcmFtKG9wdGlvbnMub2Zmc2V0KX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgc3FsLCBwYXJhbXMgfTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IHZhciBhc3NldHNDYWNoZTogQXNzZXRzQ2FjaGU7XG5leHBvcnQgdmFyIHBhcnRpYWxzQ2FjaGU6IFBhcnRpYWxzQ2FjaGU7XG5leHBvcnQgdmFyIGxheW91dHNDYWNoZTogTGF5b3V0c0NhY2hlO1xuZXhwb3J0IHZhciBkb2N1bWVudHNDYWNoZTogRG9jdW1lbnRzQ2FjaGU7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZGI6IEFzeW5jRGF0YWJhc2Vcbik6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgLy8gSW5pdGlhbGl6ZSB0YWcgYW5kIHRhZyBkZXNjcmlwdGlvbiBzdXBwb3J0ICh1c2VkIGJ5IERvY3VtZW50c0NhY2hlKVxuICAgIGF3YWl0IHRnbHVlLmluaXQoZGIpO1xuICAgIGF3YWl0IHRkZXNjLmluaXQoZGIpO1xuXG4gICAgLy8gSGVscGVyIHRvIHNldHVwIHZlcmJvc2UgZXZlbnQgbGlzdGVuZXJzIGlmIHZlcmJvc2UgbW9kZSBpcyBlbmFibGVkXG4gICAgY29uc3Qgc2V0dXBWZXJib3NlTGlzdGVuZXJzID0gKGNhY2hlOiBhbnksIGNhY2hlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmIChjb25maWcudmVyYm9zZSkge1xuICAgICAgICAgICAgY2FjaGUub24oJ2FkZGVkJywgKG5hbWU6IHN0cmluZywgdnBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQURERURdICR7bmFtZX06ICR7dnBhdGh9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FjaGUub24oJ3JlYWR5JywgKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbUkVBRFldICR7bmFtZX1cXG5gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjYWNoZS5vbignZXJyb3InLCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtFUlJPUl0gJHtjYWNoZU5hbWV9OmAsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQWx3YXlzIHNldHVwIGVycm9yIGxpc3RlbmVyLCBldmVuIGluIG5vbi12ZXJib3NlIG1vZGVcbiAgICAgICAgICAgIGNhY2hlLm9uKCdlcnJvcicsICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjYWNoZU5hbWV9IEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8vLyBBU1NFVFNcblxuICAgIGF3YWl0IGRvQ3JlYXRlQXNzZXRzVGFibGUoZGIpO1xuXG4gICAgYXNzZXRzQ2FjaGUgPSBuZXcgQXNzZXRzQ2FjaGUoXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2Fzc2V0cycsXG4gICAgICAgIGNvbmZpZy5hc3NldERpcnMsXG4gICAgICAgIGRiLFxuICAgICAgICAnQVNTRVRTJ1xuICAgICk7XG4gICAgXG4gICAgc2V0dXBWZXJib3NlTGlzdGVuZXJzKGFzc2V0c0NhY2hlLCAnYXNzZXRzQ2FjaGUnKTtcbiAgICBcbiAgICBhd2FpdCBhc3NldHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgLy8vLyBQQVJUSUFMU1xuXG4gICAgYXdhaXQgZG9DcmVhdGVQYXJ0aWFsc1RhYmxlKGRiKTtcblxuICAgIHBhcnRpYWxzQ2FjaGUgPSBuZXcgUGFydGlhbHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAncGFydGlhbHMnLFxuICAgICAgICBjb25maWcucGFydGlhbHNEaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ1BBUlRJQUxTJ1xuICAgICk7XG4gICAgXG4gICAgc2V0dXBWZXJib3NlTGlzdGVuZXJzKHBhcnRpYWxzQ2FjaGUsICdwYXJ0aWFsc0NhY2hlJyk7XG4gICAgXG4gICAgYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgLy8vLyBMQVlPVVRTXG5cbiAgICBhd2FpdCBkb0NyZWF0ZUxheW91dHNUYWJsZShkYik7XG5cbiAgICBsYXlvdXRzQ2FjaGUgPSBuZXcgTGF5b3V0c0NhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdsYXlvdXRzJyxcbiAgICAgICAgY29uZmlnLmxheW91dERpcnMsXG4gICAgICAgIGRiLFxuICAgICAgICAnTEFZT1VUUydcbiAgICApO1xuICAgIFxuICAgIHNldHVwVmVyYm9zZUxpc3RlbmVycyhsYXlvdXRzQ2FjaGUsICdsYXlvdXRzQ2FjaGUnKTtcbiAgICBcbiAgICBhd2FpdCBsYXlvdXRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIC8vLy8gRE9DVU1FTlRTXG5cbiAgICBhd2FpdCBkb0NyZWF0ZURvY3VtZW50c1RhYmxlKGRiKTtcbiAgICBhd2FpdCBkb0NyZWF0ZVZlY0RvY3VtZW50c1RhYmxlKGRiKTtcblxuICAgIGRvY3VtZW50c0NhY2hlID0gbmV3IERvY3VtZW50c0NhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdkb2N1bWVudHMnLFxuICAgICAgICBjb25maWcuZG9jdW1lbnREaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ0RPQ1VNRU5UUydcbiAgICApO1xuICAgIFxuICAgIHNldHVwVmVyYm9zZUxpc3RlbmVycyhkb2N1bWVudHNDYWNoZSwgJ2RvY3VtZW50c0NhY2hlJyk7XG4gICAgXG4gICAgYXdhaXQgZG9jdW1lbnRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIGF3YWl0IGNvbmZpZy5ob29rUGx1Z2luQ2FjaGVTZXR1cCgpO1xuXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZUZpbGVDYWNoZXMoKSB7XG4gICAgaWYgKGRvY3VtZW50c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGRvY3VtZW50c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoYXNzZXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgYXNzZXRzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgYXNzZXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChsYXlvdXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgbGF5b3V0c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGxheW91dHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHBhcnRpYWxzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgcGFydGlhbHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBwYXJ0aWFsc0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIFRoZSBmb3VyIGNhY2hlcyBzaGFyZSB0aGUgc2luZ2xlIHByb2Nlc3MtZ2xvYmFsIGBzcWRiYFxuICAgIC8vIGNvbm5lY3Rpb24uICBDbG9zZSBpdCBvbmNlIGhlcmUsIGFmdGVyIGFsbCBjYWNoZXMgaGF2ZVxuICAgIC8vIGRldGFjaGVkLiAgQ2xvc2luZyBhbiBhbHJlYWR5LWNsb3NlZCBjb25uZWN0aW9uIHRocm93c1xuICAgIC8vIChhbmQgdGhlIHdyYXBwZXIgbG9ncyBpdCksIHNvIG9ubHkgY2xvc2Ugd2hlbiBzdGlsbCBvcGVuLlxuICAgIC8vIFRoaXMgbWFrZXMgY2xvc2VGaWxlQ2FjaGVzKCkgaWRlbXBvdGVudCwgZS5nLiB3aGVuIGEgdGVzdFxuICAgIC8vIGNsb3NlcyB0aGUgY2FjaGVzIG1vcmUgdGhhbiBvbmNlLlxuICAgIGlmIChzcWRiLmlubmVyLmlzT3Blbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgc3FkYi5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIFRoZSBzaGFyZWQgY29ubmVjdGlvbiBtYXkgYWxyZWFkeSBiZSBjbG9zZWQuXG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=