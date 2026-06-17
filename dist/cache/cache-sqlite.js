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
        __classPrivateFieldSet(this, _BaseCache_vfstack, new VFStack(this.name, this.dirs), "f");
        await __classPrivateFieldGet(this, _BaseCache_vfstack, "f").scan();
        for (const vpathData of __classPrivateFieldGet(this, _BaseCache_vfstack, "f")) {
            if (!this.ignoreFile(vpathData)) {
                try {
                    this.gatherInfoData(vpathData);
                    await this.insertDocToDB(vpathData);
                    await this.config.hookFileAdded(this.name, vpathData);
                    // Emit 'added' event to track when files are processed
                    // This helps verify that all files are added before 'ready' is emitted
                    this.emit('added', this.name, vpathData.vpath);
                }
                catch (err) {
                    console.error(`Error gathering info for ${vpathData.vpath}: ${err.message}`);
                }
            }
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
                    content: FS.readFileSync(info.fspath, 'utf-8')
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
                    content: FS.readFileSync(info.fspath, 'utf-8')
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
                    content: FS.readFileSync(info.fspath, 'utf-8')
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUtc3FsaXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NhY2hlL2NhY2hlLXNxbGl0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7Ozs7Ozs7Ozs7Ozs7QUFFSCxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDOUMsT0FBTyxFQUNILE9BQU8sRUFDVixNQUFNLGNBQWMsQ0FBQztBQUl0QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sWUFBWSxNQUFNLFFBQVEsQ0FBQztBQUNsQyxPQUFPLFVBQVUsTUFBTSxZQUFZLENBQUM7QUFDcEMsT0FBTyxFQUNILE9BQU8sRUFBRSxlQUFlLEVBQzNCLE1BQU0sZUFBZSxDQUFDO0FBS3ZCLE9BQU8sRUFLSCxtQkFBbUIsRUFDbkIsc0JBQXNCLEVBQ3RCLG9CQUFvQixFQUNwQixxQkFBcUIsRUFDckIseUJBQXlCLEVBQ1IsYUFBYSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsdUJBQXVCLEVBQzdHLE1BQU0sYUFBYSxDQUFDO0FBR3JCLE9BQU8sU0FBUyxNQUFNLGtCQUFrQixDQUFDO0FBUXpDLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUVuRCxNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLHdCQUF3QjtBQUV4QixNQUFNLEtBQUssR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO0FBQ3BDLHdCQUF3QjtBQUV4Qjs7Ozs7Ozs7Ozs7R0FXRztBQUNILE1BQU0sT0FBTyxTQUVYLFNBQVEsWUFBWTtJQVdsQjs7Ozs7T0FLRztJQUNILFlBQ0ksTUFBcUIsRUFDckIs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QyxNQUFNLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUM7WUFDRCxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLCtDQUErQztRQUNuRCxDQUFDO0lBQ0wsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IEZTLCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHtcbiAgICBWRlN0YWNrLCBWUGF0aERhdGEsIGRpclRvTW91bnRcbn0gZnJvbSAnLi92ZnN0YWNrLmpzJztcbmltcG9ydCB7XG4gICAgQ29uZmlndXJhdGlvbiwgaW5kZXhDaGFpbkl0ZW1cbn0gZnJvbSAnLi4vaW5kZXguanMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcbmltcG9ydCB7XG4gICAgVGFnR2x1ZSwgVGFnRGVzY3JpcHRpb25zXG59IGZyb20gJy4vdGFnLWdsdWUuanMnO1xuaW1wb3J0IHR5cGUge1xuICAgIFNpbWlsYXJUYWdHcm91cCxcbiAgICBUYWdXaXRob3V0RGVzY3JpcHRpb25cbn0gZnJvbSAnLi4vdHlwZXMuanMnO1xuaW1wb3J0IHtcbiAgICBjcmVhdGVBc3NldHNUYWJsZSxcbiAgICBjcmVhdGVEb2N1bWVudHNUYWJsZSxcbiAgICBjcmVhdGVMYXlvdXRzVGFibGUsXG4gICAgY3JlYXRlUGFydGlhbHNUYWJsZSxcbiAgICBkb0NyZWF0ZUFzc2V0c1RhYmxlLFxuICAgIGRvQ3JlYXRlRG9jdW1lbnRzVGFibGUsXG4gICAgZG9DcmVhdGVMYXlvdXRzVGFibGUsXG4gICAgZG9DcmVhdGVQYXJ0aWFsc1RhYmxlLFxuICAgIGRvQ3JlYXRlVmVjRG9jdW1lbnRzVGFibGUsXG4gICAgUGF0aHNSZXR1cm5UeXBlLCB2YWxpZGF0ZUFzc2V0LCB2YWxpZGF0ZURvY3VtZW50LCB2YWxpZGF0ZUxheW91dCwgdmFsaWRhdGVQYXJ0aWFsLCB2YWxpZGF0ZVBhdGhzUmV0dXJuVHlwZVxufSBmcm9tICcuL3NjaGVtYS5qcyc7XG5cbmltcG9ydCB7IEFzeW5jRGF0YWJhc2UgfSBmcm9tICdwcm9taXNlZC5ub2RlLnNxbGl0ZSc7XG5pbXBvcnQgU3FsU3RyaW5nIGZyb20gJ3NxbHN0cmluZy1zcWxpdGUnO1xuaW1wb3J0IHtcbiAgICBCYXNlQ2FjaGVFbnRyeSxcbiAgICBBc3NldCxcbiAgICBQYXJ0aWFsLFxuICAgIExheW91dCxcbiAgICBEb2N1bWVudFxufSBmcm9tICcuL3NjaGVtYS5qcyc7XG5pbXBvcnQgQ2FjaGUgZnJvbSAnY2FjaGUnO1xuaW1wb3J0IHsgc3FkYiwgbGVtYmVkTW9kZWxOYW1lIH0gZnJvbSAnLi4vc3FkYi5qcyc7XG5cbmNvbnN0IHRnbHVlID0gbmV3IFRhZ0dsdWUoKTtcbi8vIHRnbHVlLmluaXQoc3FkYi5fZGIpO1xuXG5jb25zdCB0ZGVzYyA9IG5ldyBUYWdEZXNjcmlwdGlvbnMoKTtcbi8vIHRkZXNjLmluaXQoc3FkYi5fZGIpO1xuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIGZpbGUgY2FjaGVzIChkb2N1bWVudHMsIGFzc2V0cywgbGF5b3V0cywgcGFydGlhbHMpLlxuICogU2NhbnMgZGlyZWN0b3JpZXMsIHN0b3JlcyBmaWxlIGluZm9ybWF0aW9uIGluIFNRTGl0ZSBkYXRhYmFzZSwgYW5kIGVtaXRzIGV2ZW50cy5cbiAqIFxuICogRXZlbnRzIGVtaXR0ZWQ6XG4gKiAtICdhZGRlZCcgKG5hbWU6IHN0cmluZywgdnBhdGg6IHN0cmluZykgLSBFbWl0dGVkIHdoZW4gYSBmaWxlIGlzIHN1Y2Nlc3NmdWxseSBcbiAqICAgYWRkZWQgdG8gdGhlIGNhY2hlIGR1cmluZyBpbml0aWFsIHNjYW4gb3IgdXBkYXRlLiBVc2VmdWwgZm9yIHRyYWNraW5nIHRoYXQgXG4gKiAgIGFsbCBmaWxlcyBhcmUgcHJvY2Vzc2VkIGJlZm9yZSAncmVhZHknIGlzIGVtaXR0ZWQuXG4gKiAtICdyZWFkeScgKG5hbWU6IHN0cmluZykgLSBFbWl0dGVkIHdoZW4gaW5pdGlhbCBkaXJlY3Rvcnkgc2NhbiBhbmQgZmlsZSBcbiAqICAgcHJvY2Vzc2luZyBpcyBjb21wbGV0ZS4gQWZ0ZXIgdGhpcyBldmVudCwgaXNSZWFkeSgpIHdpbGwgcmV0dXJuIGltbWVkaWF0ZWx5LlxuICogLSAnZXJyb3InIChlcnJvcjogRXJyb3IpIC0gRW1pdHRlZCB3aGVuIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgcHJvY2Vzc2luZy5cbiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VDYWNoZTxcbiAgICBUIGV4dGVuZHMgQmFzZUNhY2hlRW50cnlcbj4gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgI2NvbmZpZz86IENvbmZpZ3VyYXRpb247XG4gICAgI25hbWU/OiBzdHJpbmc7XG4gICAgI2RpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2lzX3JlYWR5OiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAjZGI6IEFzeW5jRGF0YWJhc2U7XG4gICAgI2RibmFtZTogc3RyaW5nO1xuXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICAgICAqIEBwYXJhbSBuYW1lIHN0cmluZyBnaXZpbmcgdGhlIG5hbWUgZm9yIHRoaXMgY2FjaGVcbiAgICAgKiBAcGFyYW0gZGIgVGhlIFBST01JU0VEIFNRTElURTMgQXN5bmNEYXRhYmFzZSBpbnN0YW5jZSB0byB1c2VcbiAgICAgKiBAcGFyYW0gZGJuYW1lIFRoZSBkYXRhYmFzZSBuYW1lIHRvIHVzZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZGlyczogZGlyVG9Nb3VudFtdLFxuICAgICAgICBkYjogQXN5bmNEYXRhYmFzZSxcbiAgICAgICAgZGJuYW1lOiBzdHJpbmdcbiAgICApIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEJhc2VGaWxlQ2FjaGUgJHtuYW1lfSBjb25zdHJ1Y3RvciBkaXJzPSR7dXRpbC5pbnNwZWN0KGRpcnMpfWApO1xuICAgICAgICB0aGlzLiNjb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuI25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLiNkaXJzID0gZGlycztcbiAgICAgICAgdGhpcy4jaXNfcmVhZHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jZGIgPSBkYjtcbiAgICAgICAgaWYgKGRibmFtZSAhPT0gJ0FTU0VUUydcbiAgICAgICAgICYmIGRibmFtZSAhPT0gJ0xBWU9VVFMnXG4gICAgICAgICAmJiBkYm5hbWUgIT09ICdQQVJUSUFMUydcbiAgICAgICAgICYmIGRibmFtZSAhPT0gJ0RPQ1VNRU5UUydcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYElsbGVnYWwgZGF0YWJhc2UgbmFtZSwgbXVzdCBiZSBBU1NFVFMsIExBWU9VVFMsIFBBUlRJQUxTLCBvciBET0NVTUVOVFNgKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2RibmFtZSA9IGRibmFtZTtcbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCkgICAgIHsgcmV0dXJuIHRoaXMuI2NvbmZpZzsgfVxuICAgIGdldCBuYW1lKCkgICAgICAgeyByZXR1cm4gdGhpcy4jbmFtZTsgfVxuICAgIGdldCBkaXJzKCkgICAgICAgeyByZXR1cm4gdGhpcy4jZGlyczsgfVxuICAgIGdldCBkYigpICAgICAgICAgeyByZXR1cm4gdGhpcy4jZGI7IH1cbiAgICBnZXQgZGJuYW1lKCkgICAgIHsgcmV0dXJuIHRoaXMuI2RibmFtZTsgfVxuICAgIGdldCBxdW90ZWREQk5hbWUoKSB7XG4gICAgICAgIHJldHVybiBTcWxTdHJpbmcuZXNjYXBlKHRoaXMuI2RibmFtZSk7XG4gICAgfVxuXG4gICAgI3Zmc3RhY2s6IFZGU3RhY2s7XG5cbiAgICBhc3luYyBjbG9zZSgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2NoYW5nZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2FkZGVkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCd1bmxpbmtlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVhZHknKTtcblxuICAgICAgICAvLyBOT1RFOiBUaGUgZGF0YWJhc2UgY29ubmVjdGlvbiBpcyBOT1QgY2xvc2VkIGhlcmUuXG4gICAgICAgIC8vIEFsbCBmb3VyIGNhY2hlcyAoYXNzZXRzLCBwYXJ0aWFscywgbGF5b3V0cywgZG9jdW1lbnRzKVxuICAgICAgICAvLyBzaGFyZSB0aGUgc2luZ2xlIHByb2Nlc3MtZ2xvYmFsIGBzcWRiYCBjb25uZWN0aW9uLlxuICAgICAgICAvLyBDbG9zaW5nIGl0IHBlci1jYWNoZSB3b3VsZCBjbG9zZSB0aGUgc2hhcmVkIGNvbm5lY3Rpb25cbiAgICAgICAgLy8gb24gdGhlIGZpcnN0IGNhY2hlIGFuZCB0aGVuIHRocm93IFwiZGF0YWJhc2UgaXMgbm90IG9wZW5cIlxuICAgICAgICAvLyBvbiB0aGUgcmVzdC4gIFRoZSBzaGFyZWQgY29ubmVjdGlvbiBpcyBjbG9zZWQgb25jZSBieVxuICAgICAgICAvLyBjbG9zZUZpbGVDYWNoZXMoKS5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTY2FuIHRoZSBkaXJlY3Rvcnkgc3RhY2sgYW5kIHBvcHVsYXRlIHRoZSBkYXRhYmFzZS5cbiAgICAgKi9cbiAgICBhc3luYyBzZXR1cCgpIHtcbiAgICAgICAgdGhpcy4jaXNfcmVhZHkgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLiN2ZnN0YWNrID0gbmV3IFZGU3RhY2sodGhpcy5uYW1lLCB0aGlzLmRpcnMpO1xuICAgICAgICBhd2FpdCB0aGlzLiN2ZnN0YWNrLnNjYW4oKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHZwYXRoRGF0YSBvZiB0aGlzLiN2ZnN0YWNrKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZSh2cGF0aERhdGEpKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YSh2cGF0aERhdGEgYXMgYW55IGFzIFQpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmluc2VydERvY1RvREIodnBhdGhEYXRhIGFzIGFueSBhcyBUKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVBZGRlZCh0aGlzLm5hbWUsIHZwYXRoRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVtaXQgJ2FkZGVkJyBldmVudCB0byB0cmFjayB3aGVuIGZpbGVzIGFyZSBwcm9jZXNzZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBoZWxwcyB2ZXJpZnkgdGhhdCBhbGwgZmlsZXMgYXJlIGFkZGVkIGJlZm9yZSAncmVhZHknIGlzIGVtaXR0ZWRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdhZGRlZCcsIHRoaXMubmFtZSwgdnBhdGhEYXRhLnZwYXRoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgZ2F0aGVyaW5nIGluZm8gZm9yICR7dnBhdGhEYXRhLnZwYXRofTogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdCgncmVhZHknLCB0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIGFuIGl0ZW0sIHdoaWNoIGlzIGV4cGVjdGVkIHRvIGJlXG4gICAgICogYSByb3cgZnJvbSBkYXRhYmFzZSBxdWVyeSByZXN1bHRzLCB1c2luZ1xuICAgICAqIG9uZSBvZiB0aGUgdmFsaWRhdG9yIGZ1bmN0aW9ucyBpbiBzY2hlbWEudHMuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIG11c3QgYmUgc3ViY2xhc3NlZCB0b1xuICAgICAqIGZ1bmN0aW9uIGNvcnJlY3RseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb3cgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93KHJvdzogYW55KTogVCB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdmFsaWRhdGVSb3cgbXVzdCBiZSBzdWJjbGFzc2VkYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGUgYW4gYXJyYXksIHdoaWNoIGlzIGV4cGVjdGVkIHRvIGJlXG4gICAgICogZGF0YWJhc2UgcXVlcnkgcmVzdWx0cywgdXNpbmcgb25lIG9mIHRoZVxuICAgICAqIHZhbGlkYXRvciBmdW5jdGlvbnMgaW4gc2NoZW1hLnRzLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBtdXN0IGJlIHN1YmNsYXNzZWQgdG9cbiAgICAgKiBmdW5jdGlvbiBjb3JyZWN0bHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm93IFxuICAgICAqL1xuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvd3Mocm93czogYW55W10pOiBUW10ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHZhbGlkYXRlUm93cyBtdXN0IGJlIHN1YmNsYXNzZWRgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGZpZWxkcyBmcm9tIHRoZSBkYXRhYmFzZVxuICAgICAqIHJlcHJlc2VudGF0aW9uIHRvIHRoZSBmb3JtIHJlcXVpcmVkXG4gICAgICogZm9yIGV4ZWN1dGlvbi5cbiAgICAgKiBcbiAgICAgKiBUaGUgZGF0YWJhc2UgY2Fubm90IHN0b3JlcyBKU09OIGZpZWxkc1xuICAgICAqIGFzIGFuIG9iamVjdCBzdHJ1Y3R1cmUsIGJ1dCBhcyBhIHNlcmlhbGllZFxuICAgICAqIEpTT04gc3RyaW5nLiAgSW5zaWRlIEFrYXNoYUNNUyBjb2RlIHRoYXRcbiAgICAgKiBvYmplY3QgbXVzdCBiZSBhbiBvYmplY3QgcmF0aGVyIHRoYW5cbiAgICAgKiBhIHN0cmluZy5cbiAgICAgKiBcbiAgICAgKiBUaGUgb2JqZWN0IHBhc3NlZCBhcyBcInJvd1wiIHNob3VsZCBhbHJlYWR5XG4gICAgICogaGF2ZSBiZWVuIHZhbGlkYXRlZCB1c2luZyB2YWxpZGF0ZVJvdy5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gcm93IFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IFQge1xuICAgICAgICBpZiAodHlwZW9mIHJvdy5pbmZvID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmluZm8gPSBKU09OLnBhcnNlKHJvdy5pbmZvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPFQ+cm93O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBzcWxGb3JtYXQoZm5hbWUsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBzcWwgPSBTcWxTdHJpbmcuZm9ybWF0KFxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShmbmFtZSksIHBhcmFtc1xuICAgICAgICApO1xuICAgICAgICByZXR1cm4gc3FsO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBmaW5kUGF0aE1vdW50ZWRTUUxcbiAgICAgICAgICAgID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICAgIC8qKlxuICAgICAqIEZpbmQgYW4gaW5mbyBvYmplY3QgYmFzZWQgb24gdnBhdGggYW5kIG1vdW50ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHBhcmFtIG1vdW50ZWQgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIGZpbmRQYXRoTW91bnRlZChcbiAgICAgICAgdnBhdGg6IHN0cmluZywgbW91bnRlZDogc3RyaW5nXG4gICAgKTogUHJvbWlzZTxBcnJheTx7XG4gICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgIG1vdW50ZWQ6IHN0cmluZ1xuICAgIH0+PiAge1xuICAgICAgICBcbiAgICAgICAgbGV0IHNxbCA9IHRoaXMuZmluZFBhdGhNb3VudGVkU1FMLmdldCh0aGlzLmRibmFtZSk7XG4gICAgICAgIGlmICghc3FsKSB7XG4gICAgICAgICAgICBzcWwgPSBhd2FpdCB0aGlzLnNxbEZvcm1hdChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdmaW5kLXBhdGgtbW91bnRlZC5zcWwnKSxcbiAgICAgICAgICAgICAgICBbIHRoaXMuZGJuYW1lIF1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmZpbmRQYXRoTW91bnRlZFNRTC5zZXQodGhpcy5kYm5hbWUsIHNxbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZm91bmQgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoc3FsLCB7XG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoLFxuICAgICAgICAgICAgJG1vdW50ZWQ6IG1vdW50ZWRcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IG5ldyBBcnJheTx7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgbW91bnRlZDogc3RyaW5nXG4gICAgICAgIH0+KCk7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBmb3VuZCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLnZwYXRoID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICYmIHR5cGVvZiBpdGVtLm1vdW50ZWQgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBtYXBwZWQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLCBtb3VudGVkOiBpdGVtLm1vdW50ZWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaW5kUGF0aE1vdW50ZWQ6IEludmFsaWQgb2JqZWN0ICBmb3VuZCBpbiBxdWVyeSAoJHt2cGF0aH0sICR7bW91bnRlZH0pIHJlc3VsdHMgJHt1dGlsLmluc3BlY3QoaXRlbSl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hcHBlZDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZmluZEJ5UGF0aENhY2hlO1xuICAgIHByb3RlY3RlZCBmaW5kQnlQYXRoU1FMID0gbmV3IE1hcDxcbiAgICAgICAgc3RyaW5nLCBzdHJpbmdcbiAgICA+KCk7XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGFuIGluZm8gb2JqZWN0IGJ5IHRoZSB2cGF0aC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZmluZEJ5UGF0aCh2cGF0aDogc3RyaW5nKSB7XG5cbiAgICAgICAgY29uc3QgZG9DYWNoaW5nXG4gICAgICAgICAgICA9IHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0ID4gMDtcbiAgICAgICAgbGV0IGNhY2hlS2V5O1xuXG4gICAgICAgIGlmICghdGhpcy5maW5kQnlQYXRoQ2FjaGUpIHtcbiAgICAgICAgICAgIHRoaXMuZmluZEJ5UGF0aENhY2hlXG4gICAgICAgICAgICAgICAgPSBuZXcgQ2FjaGUodGhpcy5jb25maWcuY2FjaGluZ1RpbWVvdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZykge1xuXG4gICAgICAgICAgICBjYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBkYm5hbWU6IHRoaXMucXVvdGVkREJOYW1lLFxuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZFxuICAgICAgICAgICAgICAgID0gdGhpcy5maW5kQnlQYXRoQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRCeVBhdGggJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfSAke3ZwYXRofWApO1xuXG4gICAgICAgIGxldCBzcWwgPSB0aGlzLmZpbmRCeVBhdGhTUUwuZ2V0KHRoaXMuZGJuYW1lKTtcbiAgICAgICAgaWYgKCFzcWwpIHtcbiAgICAgICAgICAgIHNxbCA9IGF3YWl0IHRoaXMuc3FsRm9ybWF0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2ZpbmQtYnktY2FjaGUuc3FsJyksXG4gICAgICAgICAgICAgICAgWyB0aGlzLmRibmFtZSBdXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5maW5kQnlQYXRoU1FMLnNldCh0aGlzLmRibmFtZSwgc3FsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBmb3VuZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvdW5kID0gPGFueVtdPmF3YWl0IHRoaXMuZGIuYWxsKHNxbCwge1xuICAgICAgICAgICAgICAgICR2cGF0aDogdnBhdGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBkYi5hbGwgJHtzcWx9YCwgZXJyLnN0YWNrKTtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHRoaXMudmFsaWRhdGVSb3dzKGZvdW5kKTtcblxuICAgICAgICBjb25zdCByZXQgPSBtYXBwZWQubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZyAmJiBjYWNoZUtleSkge1xuICAgICAgICAgICAgdGhpcy5maW5kQnlQYXRoQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm86IFQpIHtcbiAgICAgICAgLy8gUGxhY2Vob2xkZXIgd2hpY2ggc29tZSBzdWJjbGFzc2VzXG4gICAgICAgIC8vIGFyZSBleHBlY3RlZCB0byBvdmVycmlkZVxuXG4gICAgICAgIC8vIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgZ2F0aGVySW5mb0RhdGEgbXVzdCBiZSBvdmVycmlkZGVuYCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbzogVCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGluc2VydERvY1RvREIgbXVzdCBiZSBvdmVycmlkZGVuYCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoaW5mbzogVCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVwZGF0ZURvY0luREIgbXVzdCBiZSBvdmVycmlkZGVuYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxsb3cgYSBjYWxsZXIgdG8gd2FpdCB1bnRpbCB0aGUgPGVtPnJlYWR5PC9lbT4gZXZlbnQgaGFzXG4gICAgICogYmVlbiBzZW50IGZyb20gdGhlIERpcnNXYXRjaGVyIGluc3RhbmNlLiAgVGhpcyBldmVudCBtZWFucyB0aGVcbiAgICAgKiBpbml0aWFsIGluZGV4aW5nIGhhcyBoYXBwZW5lZC5cbiAgICAgKi9cbiAgICBhc3luYyBpc1JlYWR5KCkge1xuICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIGRpcmVjdG9yaWVzLCB0aGVyZSB3b24ndCBiZSBhbnkgZmlsZXMgXG4gICAgICAgIC8vIHRvIGxvYWQsIGFuZCBubyBuZWVkIHRvIHdhaXRcbiAgICAgICAgd2hpbGUgKHRoaXMuI2RpcnMubGVuZ3RoID4gMCAmJiAhdGhpcy4jaXNfcmVhZHkpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZG9lcyBhIDEwMG1zIHBhdXNlXG4gICAgICAgICAgICAvLyBUaGF0IGxldHMgdXMgY2hlY2sgaXNfcmVhZHkgZXZlcnkgMTAwbXNcbiAgICAgICAgICAgIC8vIGF0IHZlcnkgbGl0dGxlIGNvc3RcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAhaXNSZWFkeSAke3RoaXMubmFtZX0gJHt0aGlzW19zeW1iX2RpcnNdLmxlbmd0aH0gJHt0aGlzW19zeW1iX2lzX3JlYWR5XX1gKTtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBkaXJlY3RvcnkgbW91bnQgY29ycmVzcG9uZGluZyB0byB0aGUgZmlsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgZmlsZURpck1vdW50KGluZm8pIHtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgaWYgKGluZm8ubW91bnRQb2ludCA9PT0gZGlyLmRlc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2hvdWxkIHRoaXMgZmlsZSBiZSBpZ25vcmVkLCBiYXNlZCBvbiB0aGUgYGlnbm9yZWAgZmllbGRcbiAgICAgKiBpbiB0aGUgbWF0Y2hpbmcgYGRpcmAgbW91bnQgZW50cnkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGluZm9cbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGlnbm9yZUZpbGUoaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgIGNvbnN0IGRpck1vdW50ID0gdGhpcy5maWxlRGlyTW91bnQoaW5mbyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH0gZGlyTW91bnQgJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICBsZXQgaWdub3JlID0gZmFsc2U7XG4gICAgICAgIGlmIChkaXJNb3VudCkge1xuXG4gICAgICAgICAgICBsZXQgaWdub3JlcztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyTW91bnQuaWdub3JlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBbIGRpck1vdW50Lmlnbm9yZSBdO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRpck1vdW50Lmlnbm9yZSkpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gZGlyTW91bnQuaWdub3JlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaWdub3Jlcykge1xuICAgICAgICAgICAgICAgIGlmIChtaWNyb21hdGNoLmlzTWF0Y2goaW5mby52cGF0aCwgaSkpIGlnbm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRpck1vdW50Lmlnbm9yZSAke2ZzcGF0aH0gJHtpfSA9PiAke2lnbm9yZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIChpZ25vcmUpIGNvbnNvbGUubG9nKGBNVVNUIGlnbm9yZSBGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlIGZvciAke2luZm8udnBhdGh9ID09PiAke2lnbm9yZX1gKTtcbiAgICAgICAgICAgIHJldHVybiBpZ25vcmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBubyBtb3VudD8gIHRoYXQgbWVhbnMgc29tZXRoaW5nIHN0cmFuZ2VcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYE5vIGRpck1vdW50IGZvdW5kIGZvciAke2luZm8udnBhdGh9IC8gJHtpbmZvLmRpck1vdW50ZWRPbn1gKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHBhdGhzQ2FjaGU7XG4gICAgcHJvdGVjdGVkIHBhdGhzU1FMID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBzaW1wbGUgaW5mb3JtYXRpb24gYWJvdXQgZWFjaFxuICAgICAqIHBhdGggaW4gdGhlIGNvbGxlY3Rpb24uICBUaGUgcmV0dXJuXG4gICAgICogdHlwZSBpcyBhbiBhcnJheSBvZiBQYXRoc1JldHVyblR5cGUuXG4gICAgICogXG4gICAgICogSSBmb3VuZCB0d28gdXNlcyBmb3IgdGhpcyBmdW5jdGlvbi5cbiAgICAgKiBJbiBjb3B5QXNzZXRzLCB0aGUgdnBhdGggYW5kIG90aGVyXG4gICAgICogc2ltcGxlIGRhdGEgaXMgdXNlZCBmb3IgY29weWluZyBpdGVtc1xuICAgICAqIHRvIHRoZSBvdXRwdXQgZGlyZWN0b3J5LlxuICAgICAqIEluIHJlbmRlci50cywgdGhlIHNpbXBsZSBmaWVsZHMgYXJlXG4gICAgICogdXNlZCB0byB0aGVuIGNhbGwgZmluZCB0byByZXRyaWV2ZVxuICAgICAqIHRoZSBmdWxsIGluZm9ybWF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHBhdGhzKHJvb3RQYXRoPzogc3RyaW5nKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8UGF0aHNSZXR1cm5UeXBlPj5cbiAgICB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIGNvbnN0IGRvQ2FjaGluZ1xuICAgICAgICAgICAgPSB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDA7XG4gICAgICAgIGxldCBjYWNoZUtleTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMucGF0aHNDYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGF0aHNDYWNoZVxuICAgICAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgcm9vdFAsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgY2FjaGVkXG4gICAgICAgICAgICAgICAgPSB0aGlzLnBhdGhzQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNxbFJvb3RQID0gdGhpcy5wYXRoc1NRTC5nZXQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgZGJuYW1lOiB0aGlzLmRibmFtZSwgcm9vdFA6IHRydWVcbiAgICAgICAgfSkpO1xuICAgICAgICBpZiAoIXNxbFJvb3RQKSB7XG4gICAgICAgICAgICBzcWxSb290UCA9IGF3YWl0IHRoaXMuc3FsRm9ybWF0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3BhdGhzLXJvb3RwLnNxbCcpLFxuICAgICAgICAgICAgICAgIFsgdGhpcy5kYm5hbWUgXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMucGF0aHNTUUwuc2V0KHRoaXMuZGJuYW1lLCBzcWxSb290UCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNxbE5vUm9vdCA9IHRoaXMucGF0aHNTUUwuZ2V0KEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGRibmFtZTogdGhpcy5kYm5hbWUsIHJvb3RQOiBmYWxzZVxuICAgICAgICB9KSk7XG4gICAgICAgIGlmICghc3FsTm9Sb290KSB7XG4gICAgICAgICAgICBzcWxOb1Jvb3QgPSBhd2FpdCB0aGlzLnNxbEZvcm1hdChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdwYXRocy1uby1yb290LnNxbCcpLFxuICAgICAgICAgICAgICAgIFsgdGhpcy5kYm5hbWUgXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMucGF0aHNTUUwuc2V0KHRoaXMuZGJuYW1lLCBzcWxOb1Jvb3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBpcyBjb3BpZWQgZnJvbSB0aGUgb2xkZXIgdmVyc2lvblxuICAgICAgICAvLyAoTG9raUpTIHZlcnNpb24pIG9mIHRoaXMgZnVuY3Rpb24uICBJdFxuICAgICAgICAvLyBzZWVtcyBtZWFudCB0byBlbGltaW5hdGUgZHVwbGljYXRlcy5cbiAgICAgICAgY29uc3QgdnBhdGhzU2VlbiA9IG5ldyBTZXQoKTtcblxuICAgICAgICAvLyBTZWxlY3QgdGhlIGZpZWxkcyBpbiBQYXRoc1JldHVyblR5cGVcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9ICh0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnKSBcbiAgICAgICAgPyA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoc3FsUm9vdFAsIHtcbiAgICAgICAgICAgICRyb290UDogYCR7cm9vdFB9JWBcbiAgICAgICAgfSlcbiAgICAgICAgOiA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoc3FsTm9Sb290KTtcblxuICAgICAgICBjb25zdCByZXN1bHQyOiBQYXRoc1JldHVyblR5cGVbXVxuICAgICAgICAgICAgICAgID0gbmV3IEFycmF5PFBhdGhzUmV0dXJuVHlwZT4oKTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICAgIGlmIChmY2FjaGUuaWdub3JlRmlsZShpdGVtKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZwYXRoc1NlZW4uaGFzKChpdGVtIGFzIFQpLnZwYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2cGF0aHNTZWVuLmFkZCgoaXRlbSBhcyBUKS52cGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5taW1lID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVQYXRoc1JldHVyblR5cGUoaXRlbSk7XG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUEFUSFMgVkFMSURBVElPTiAke3V0aWwuaW5zcGVjdChpdGVtKX1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQyLnB1c2godmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZyAmJiBjYWNoZUtleSkge1xuICAgICAgICAgICAgdGhpcy5wYXRoc0NhY2hlLnB1dChcbiAgICAgICAgICAgICAgICBjYWNoZUtleSwgcmVzdWx0MlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGZpbGUgd2l0aGluIHRoZSBjYWNoZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggVGhlIHZwYXRoIG9yIHJlbmRlclBhdGggdG8gbG9vayBmb3JcbiAgICAgKiBAcmV0dXJucyBib29sZWFuIHRydWUgaWYgZm91bmQsIGZhbHNlIG90aGVyd2lzZVxuICAgICAqL1xuICAgIGFzeW5jIGZpbmQoX2ZwYXRoKTogUHJvbWlzZTxUIHwgdW5kZWZpbmVkPiB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfZnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmQgcGFyYW1ldGVyIG5vdCBzdHJpbmcgJHt0eXBlb2YgX2ZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmZpbmRCeVBhdGgoZnBhdGgpO1xuXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAvLyAgICAgb3I6IFtcbiAgICAgICAgLy8gICAgICAgICB7IHZwYXRoOiB7IGVxOiBmcGF0aCB9fSxcbiAgICAgICAgLy8gICAgICAgICB7IHJlbmRlclBhdGg6IHsgZXE6IGZwYXRoIH19XG4gICAgICAgIC8vICAgICBdXG4gICAgICAgIC8vIH0gYXMgRmlsdGVyPFQ+KTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZCAke19mcGF0aH0gJHtmcGF0aH0gPT0+IHJlc3VsdDEgJHt1dGlsLmluc3BlY3QocmVzdWx0MSl9IGApO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDIgPSByZXN1bHQxLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0Mikge1xuICAgICAgICAvLyAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShyZXN1bHQpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmQgJHtfZnBhdGh9ICR7ZnBhdGh9ID09PiByZXN1bHQyICR7dXRpbC5pbnNwZWN0KHJlc3VsdDIpfSBgKTtcblxuICAgICAgICBsZXQgcmV0O1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldCA9IHJlc3VsdDJbMF07XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICByZXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXQgPSByZXN1bHQyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlOiBUID0gdGhpcy5jdnRSb3dUb09iaihcbiAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRlUm93KHJldClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUFJPQkxFTTpcbiAgICAgICAgLy8gdGhlIG1ldGFkYXRhLCBkb2NNZXRhZGF0YSwgYmFzZU1ldGFkYXRhLFxuICAgICAgICAvLyBhbmQgaW5mbyBmaWVsZHMsIGFyZSBzdG9yZWQgaW5cbiAgICAgICAgLy8gdGhlIGRhdGFiYXNlIGFzIHN0cmluZ3MsIGJ1dCBuZWVkXG4gICAgICAgIC8vIHRvIGJlIHVucGFja2VkIGludG8gb2JqZWN0cy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVXNpbmcgdmFsaWRhdGVSb3cgb3IgdmFsaWRhdGVSb3dzIGlzXG4gICAgICAgIC8vIHVzZWZ1bCwgYnV0IGRvZXMgbm90IGNvbnZlcnQgdGhvc2VcbiAgICAgICAgLy8gZmllbGRzLlxuICAgIH1cblxuICAgICNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcjogZGlyVG9Nb3VudCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgI2ZFeGlzdHNJbkRpciAke2ZwYXRofSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICBpZiAoZGlyLmRlc3QgPT09ICcvJykge1xuICAgICAgICAgICAgY29uc3QgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5zcmMsIGZwYXRoXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5zcmMsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5kZXN0LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogc3RhdHMubXRpbWVNc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbXAgPSBkaXIuZGVzdC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gZGlyLmRlc3Quc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IGRpci5kZXN0O1xuICAgICAgICBtcCA9IG1wLmVuZHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gbXBcbiAgICAgICAgICAgIDogKG1wKycvJyk7XG5cbiAgICAgICAgaWYgKGZwYXRoLnN0YXJ0c1dpdGgobXApKSB7XG4gICAgICAgICAgICBsZXQgcGF0aEluTW91bnRlZFxuICAgICAgICAgICAgICAgID0gZnBhdGgucmVwbGFjZShkaXIuZGVzdCwgJycpO1xuICAgICAgICAgICAgbGV0IGZzcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBkaXIuc3JjLCBwYXRoSW5Nb3VudGVkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDaGVja2luZyBleGlzdCBmb3IgJHtkaXIuZGVzdH0gJHtkaXIuc3JjfSAke3BhdGhJbk1vdW50ZWR9ICR7ZnNwYXRofWApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5zcmMsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5kZXN0LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBzdGF0cy5tdGltZU1zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRnVsZmlsbHMgdGhlIFwiZmluZFwiIG9wZXJhdGlvbiBub3QgYnlcbiAgICAgKiBsb29raW5nIGluIHRoZSBkYXRhYmFzZSwgYnV0IGJ5IHNjYW5uaW5nXG4gICAgICogdGhlIGZpbGVzeXN0ZW0gdXNpbmcgc3luY2hyb25vdXMgY2FsbHMuXG4gICAgICogXG4gICAgICogTk9URTogVGhpcyBpcyB1c2VkIGluIHBhcnRpYWxTeW5jXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGZpbmRTeW5jKF9mcGF0aCk6IFZQYXRoRGF0YSB8IHVuZGVmaW5lZCB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfZnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmQgcGFyYW1ldGVyIG5vdCBzdHJpbmcgJHt0eXBlb2YgX2ZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZFN5bmMgbG9va2luZyBmb3IgJHtmcGF0aH0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy4jZGlycyl9YCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgaWYgKCEoZGlyPy5kZXN0KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgZmluZFN5bmMgYmFkIGRpcnMgaW4gJHt1dGlsLmluc3BlY3QodGhpcy5kaXJzKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy4jZkV4aXN0c0luRGlyKGZwYXRoLCBkaXIpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRTeW5jICR7ZnBhdGh9IGZvdW5kYCwgZm91bmQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQXNzZXRzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8QXNzZXQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBBc3NldCB7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIHZhbHVlIH0gPSB2YWxpZGF0ZUFzc2V0KHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgLy8gY29uc29sZS5lcnJvcihgQVNTRVQgVkFMSURBVElPTiBFUlJPUiBmb3JgLCByb3cpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0gZWxzZSByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93cyhyb3dzOiBhbnlbXSk6IEFzc2V0W10ge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocm93cykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXRzQ2FjaGUgdmFsaWRhdGVSb3dzIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXlgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXk8QXNzZXQ+KCk7XG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICAgIHJldC5wdXNoKHRoaXMudmFsaWRhdGVSb3cocm93KSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IEFzc2V0IHtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDxBc3NldD5yb3c7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbzogQXNzZXQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjaW5zZXJ0RG9jQXNzZXRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IEFzc2V0XG4gICAgKSB7XG4gICAgICAgIGlmICghdGhpcy4jaW5zZXJ0RG9jQXNzZXRzKSB7XG4gICAgICAgICAgICB0aGlzLiNpbnNlcnREb2NBc3NldHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1hc3NldHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bih0aGlzLiNpbnNlcnREb2NBc3NldHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbylcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgI3VwZGF0ZURvY0Fzc2V0cztcblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm86IEFzc2V0KSB7XG4gICAgICAgIGlmICghdGhpcy4jdXBkYXRlRG9jQXNzZXRzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NBc3NldHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAndXBkYXRlLWRvYy1hc3NldHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bih0aGlzLiN1cGRhdGVEb2NBc3NldHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbylcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBQYXJ0aWFsc0NhY2hlXG4gICAgICAgIGV4dGVuZHMgQmFzZUNhY2hlPFBhcnRpYWw+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBQYXJ0aWFsIHtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9IHZhbGlkYXRlUGFydGlhbChyb3cpO1xuICAgICAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xuICAgICAgICBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogUGFydGlhbFtdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhcnRpYWxzQ2FjaGUgdmFsaWRhdGVSb3dzIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXlgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXk8UGFydGlhbD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogUGFydGlhbCB7XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuaW5mbyA9IEpTT04ucGFyc2Uocm93LmluZm8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8UGFydGlhbD5yb3c7XG4gICAgfVxuXG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBQYXJ0aWFsKSB7XG5cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9IHJlbmRlcmVyLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjaW5zZXJ0RG9jUGFydGlhbHM7XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihcbiAgICAgICAgaW5mbzogUGFydGlhbFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI2luc2VydERvY1BhcnRpYWxzKSB7XG4gICAgICAgICAgICB0aGlzLiNpbnNlcnREb2NQYXJ0aWFscyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdpbnNlcnQtZG9jLXBhcnRpYWxzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0RG9jUGFydGlhbHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAjdXBkYXRlRG9jUGFydGlhbHM7XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihcbiAgICAgICAgaW5mbzogUGFydGlhbFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI3VwZGF0ZURvY1BhcnRpYWxzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NQYXJ0aWFscyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICd1cGRhdGUtZG9jLXBhcnRpYWxzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jdXBkYXRlRG9jUGFydGlhbHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIExheW91dHNDYWNoZVxuICAgICAgICBleHRlbmRzIEJhc2VDYWNoZTxMYXlvdXQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBMYXlvdXQge1xuICAgICAgICBjb25zdCB7IGVycm9yLCB2YWx1ZSB9ID0gdmFsaWRhdGVMYXlvdXQocm93KTtcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcjtcbiAgICAgICAgZWxzZSByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93cyhyb3dzOiBhbnlbXSk6IExheW91dFtdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYExheW91dHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxMYXlvdXQ+KCk7XG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICAgIHJldC5wdXNoKHRoaXMudmFsaWRhdGVSb3cocm93KSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IExheW91dCB7XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuaW5mbyA9IEpTT04ucGFyc2Uocm93LmluZm8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8TGF5b3V0PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBMYXlvdXQpIHtcblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodHlwZW9mICg8YW55PmluZm8pLnN0YXRzTXRpbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpbmZvLm10aW1lTXMgPSAoPGFueT5pbmZvKS5zdGF0c010aW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbmZvLm1pbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGluZm8ubWltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgICAgIGluZm8ucmVuZGVyZXJOYW1lID0gcmVuZGVyZXIubmFtZTtcblxuICAgICAgICAgICAgY29uc3QgcmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby52cGF0aCk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9XG4gICAgICAgICAgICAgICAgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKiovKi5odG1sJylcbiAgICAgICAgICAgICB8fCBtaWNyb21hdGNoLmlzTWF0Y2goXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqLmh0bWwnKVxuICAgICAgICAgICAgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcnNUb0hUTUwgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICNpbnNlcnREb2NMYXlvdXRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IExheW91dFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI2luc2VydERvY0xheW91dHMpIHtcbiAgICAgICAgICAgIHRoaXMuI2luc2VydERvY0xheW91dHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1sYXlvdXRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0RG9jTGF5b3V0cywge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcblxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAjdXBkYXRlRG9jTGF5b3V0cztcblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKFxuICAgICAgICBpbmZvOiBMYXlvdXRcbiAgICApIHtcbiAgICAgICAgaWYgKCF0aGlzLiN1cGRhdGVEb2NMYXlvdXRzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NMYXlvdXRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3VwZGF0ZS1kb2MtbGF5b3V0cy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI3VwZGF0ZURvY0xheW91dHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWVcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8RG9jdW1lbnQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBEb2N1bWVudCB7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIHZhbHVlIH1cbiAgICAgICAgICAgICAgICAgICAgPSB2YWxpZGF0ZURvY3VtZW50KHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRE9DVU1FTlQgVkFMSURBVElPTiBFUlJPUiBmb3IgJHt1dGlsLmluc3BlY3Qocm93KX1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogRG9jdW1lbnRbXSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxEb2N1bWVudD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogRG9jdW1lbnQge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgRG9jdW1lbnRzIGN2dFJvd1RvT2JqYCwgcm93KTtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cuYmFzZU1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmJhc2VNZXRhZGF0YVxuICAgICAgICAgICAgICAgID0gSlNPTi5wYXJzZShyb3cuYmFzZU1ldGFkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJvdy5kb2NNZXRhZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgID0gSlNPTi5wYXJzZShyb3cuZG9jTWV0YWRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygcm93Lm1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93Lm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy5tZXRhZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cudGFncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy50YWdzXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy50YWdzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPERvY3VtZW50PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBEb2N1bWVudCkge1xuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIGluZm8uZGlybmFtZSA9IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8uZGlybmFtZSA9PT0gJy4nKSBpbmZvLmRpcm5hbWUgPSAnLyc7XG4gICAgICAgIGluZm8ucGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGluZm8uZGlybmFtZSk7XG5cbiAgICAgICAgLy8gZmluZCB0aGUgbW91bnRlZCBkaXJlY3RvcnksXG4gICAgICAgIC8vIGdldCB0aGUgYmFzZU1ldGFkYXRhXG4gICAgICAgIGZvciAobGV0IGRpciBvZiB0aGlzLmRpcnMpIHtcbiAgICAgICAgICAgIGlmIChkaXIuc3JjID09PSBpbmZvLm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlyLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLmJhc2VNZXRhZGF0YSA9IGRpci5iYXNlTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9IHJlbmRlcmVyLm5hbWU7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby52cGF0aCk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9XG4gICAgICAgICAgICAgICAgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqKi8qLmh0bWwnKVxuICAgICAgICAgICAgIHx8IG1pY3JvbWF0Y2guaXNNYXRjaChcbiAgICAgICAgICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKi5odG1sJylcbiAgICAgICAgICAgID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAocmVuZGVyZXIucGFyc2VNZXRhZGF0YSkge1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKDxhbnk+e1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGluZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBGUy5yZWFkRmlsZVN5bmMoaW5mby5mc3BhdGgsICd1dGYtOCcpXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkb2NNZXRhZGF0YSBpcyB0aGUgdW5tb2RpZmllZCBtZXRhZGF0YS9mcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBkb2N1bWVudFxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEgPSByYy5tZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvLyBkb2NDb250ZW50IGlzIHRoZSB1bnBhcnNlZCBvcmlnaW5hbCBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gaW5jbHVkaW5nIGFueSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9IHJjLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIGNvbXB1dGVkIG1ldGFkYXRhIHRoYXQgaW5jbHVkZXMgZGF0YSBmcm9tIFxuICAgICAgICAgICAgICAgIC8vIHNldmVyYWwgc291cmNlc1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEgPSB7IH07XG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLmRvY01ldGFkYXRhKSBpbmZvLmRvY01ldGFkYXRhID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcmVzdCBvZiB0aGlzIGlzIGFkYXB0ZWQgZnJvbSB0aGUgb2xkIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgLy8gSFRNTFJlbmRlcmVyLm5ld0luaXRNZXRhZGF0YVxuXG4gICAgICAgICAgICAgICAgLy8gRm9yIHN0YXJ0ZXJzIHRoZSBtZXRhZGF0YSBpcyBjb2xsZWN0ZWQgZnJvbSBzZXZlcmFsIHNvdXJjZXMuXG4gICAgICAgICAgICAgICAgLy8gMSkgdGhlIG1ldGFkYXRhIHNwZWNpZmllZCBpbiB0aGUgZGlyZWN0b3J5IG1vdW50IHdoZXJlXG4gICAgICAgICAgICAgICAgLy8gICAgdGhpcyBkb2N1bWVudCB3YXMgZm91bmRcbiAgICAgICAgICAgICAgICAvLyAyKSBtZXRhZGF0YSBpbiB0aGUgcHJvamVjdCBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgLy8gMykgdGhlIG1ldGFkYXRhIGluIHRoZSBkb2N1bWVudCwgYXMgY2FwdHVyZWQgaW4gZG9jTWV0YWRhdGFcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbml0TWV0YWRhdGEgJHtiYXNlZGlyfSAke2ZwYXRofSBiYXNlTWV0YWRhdGEgJHtiYXNlTWV0YWRhdGFbeXByb3BdfWApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uYmFzZU1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gdGhpcy5jb25maWcubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSB0aGlzLmNvbmZpZy5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGZtbWNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmRvY01ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5kb2NNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgICAgIGZtbWNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhlIGNvbnRlbnQgbGFuZHMgaGVyZVxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGRvY3VtZW50IG9iamVjdCBoYXMgYmVlbiB1c2VmdWwgZm9yIFxuICAgICAgICAgICAgICAgIC8vIGNvbW11bmljYXRpbmcgdGhlIGZpbGUgcGF0aCBhbmQgb3RoZXIgZGF0YS5cbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50ID0ge307XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5iYXNlZGlyID0gaW5mby5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscGF0aCA9IGluZm8ucGF0aEluTW91bnRlZDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHJlbmRlciA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8ucGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5wYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvID0gaW5mby5yZW5kZXJQYXRoO1xuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIHRoZSA8ZW0+dGFnczwvZW0+IGZpZWxkIGlzIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgaWYgKCEoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoaW5mby5tZXRhZGF0YS50YWdzKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhZ2xpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmUgPSAvXFxzKixcXHMqLztcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzLnNwbGl0KHJlKS5mb3JFYWNoKHRhZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdsaXN0LnB1c2godGFnLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSB0YWdsaXN0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBgRk9STUFUIEVSUk9SIC0gJHtpbmZvLnZwYXRofSBoYXMgYmFkbHkgZm9ybWF0dGVkIHRhZ3MgYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEudGFncyA9IGluZm8ubWV0YWRhdGEudGFncztcblxuICAgICAgICAgICAgICAgIC8vIFRoZSByb290IFVSTCBmb3IgdGhlIHByb2plY3RcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJvb3RfdXJsID0gdGhpcy5jb25maWcucm9vdF91cmw7XG5cbiAgICAgICAgICAgICAgICAvLyBDb21wdXRlIHRoZSBVUkwgdGhpcyBkb2N1bWVudCB3aWxsIHJlbmRlciB0b1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdVJvb3RVcmwgPSBuZXcgVVJMKHRoaXMuY29uZmlnLnJvb3RfdXJsLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICAgICAgICAgIHVSb290VXJsLnBhdGhuYW1lID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKHVSb290VXJsLnBhdGhuYW1lLCBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX3VybCA9IHVSb290VXJsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfZGF0ZSA9IGluZm8uc3RhdHMubXRpbWU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZVB1YmxEYXRlID0gKGRhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gRGF0ZS5wYXJzZShkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRlU2V0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAmJiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgZGF0ZVNldCAmJiBpbmZvLm10aW1lTXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBuZXcgRGF0ZShpbmZvLm10aW1lTXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBpbmZvLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gc3RhdHMubXRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7aW5mby52cGF0aH0gbWV0YWRhdGEucHVibGljYXRpb25EYXRlICR7aW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGV9IHNldCBmcm9tIGN1cnJlbnQgdGltZWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID0gZmFsc2U7XG4gICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhID0ge307XG4gICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSAnJztcbiAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9ICcnO1xuICAgICAgICAgICAgaW5mby5yZW5kZXJlck5hbWUgPSAnJztcbiAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lID0gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5PVEU6IENlcnRhaW4gZmllbGRzIGFyZSBub3QgaGFuZGxlZFxuICAgIC8vIGhlcmUgYmVjYXVzZSB0aGV5J3JlIEdFTkVSQVRFRCBmcm9tXG4gICAgLy8gSlNPTiBkYXRhLlxuICAgIC8vXG4gICAgLy8gICAgICBwdWJsaWNhdGlvblRpbWVcbiAgICAvLyAgICAgIGJhc2VNZXRhZGF0YVxuICAgIC8vICAgICAgbWV0YWRhdGFcbiAgICAvLyAgICAgIHRhZ3NcbiAgICAvLyAgICAgIGxheW91dFxuICAgIC8vICAgICAgYmxvZ3RhZ1xuICAgIC8vXG4gICAgLy8gVGhvc2UgZmllbGRzIGFyZSBub3QgdG91Y2hlZCBieVxuICAgIC8vIHRoZSBpbnNlcnQvdXBkYXRlIGZ1bmN0aW9ucyBiZWNhdXNlXG4gICAgLy8gU1FMSVRFMyB0YWtlcyBjYXJlIG9mIGl0LlxuXG4gICAgI2luc2VydERvY0RvY3VtZW50cztcbiAgICAjaW5zZXJ0TGVtYmVkRG9jdW1lbnRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgKSB7XG4gICAgICAgIGlmICghdGhpcy4jaW5zZXJ0RG9jRG9jdW1lbnRzKSB7XG4gICAgICAgICAgICB0aGlzLiNpbnNlcnREb2NEb2N1bWVudHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1kb2N1bWVudHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuI2luc2VydExlbWJlZERvY3VtZW50cykge1xuICAgICAgICAgICAgdGhpcy4jaW5zZXJ0TGVtYmVkRG9jdW1lbnRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2luc2VydC1sZW1iZWQtZG9jdW1lbnRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsZXQgbXRpbWU7XG4gICAgICAgIC8vIGlmICh0eXBlb2YgaW5mby5tdGltZU1zID09PSAnbnVtYmVyJ1xuICAgICAgICAvLyAgfHwgdHlwZW9mIGluZm8ubXRpbWVNcyA9PT0gJ3N0cmluZydcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBtdGltZSA9IG5ldyBEYXRlKGluZm8ubXRpbWVNcykudG9JU09TdHJpbmcoKTtcbiAgICAgICAgLy8gfVxuICAgICAgICBjb25zdCB0b0luc2VydCA9IHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG4gICAgICAgICAgICAkcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICRwYXJlbnREaXI6IGluZm8ucGFyZW50RGlyLFxuICAgICAgICAgICAgJGRvY01ldGFkYXRhOiBKU09OLnN0cmluZ2lmeShpbmZvLmRvY01ldGFkYXRhKSxcbiAgICAgICAgICAgICRkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWVcbiAgICAgICAgfTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluc2VydCBkb2MgJHtpbmZvLnZwYXRofWAsIHRvSW5zZXJ0KTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0RG9jRG9jdW1lbnRzLCB0b0luc2VydCk7XG5cblxuICAgICAgICAvLyBpZiAodHlwZW9mIGxlbWJlZE1vZGVsTmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKHtcbiAgICAgICAgLy8gICAgICAgICBsZW1iZWRNb2RlbE5hbWUsXG4gICAgICAgIC8vICAgICAgICAgYm9keVR5cGU6IHR5cGVvZiBpbmZvLmRvY0JvZHlcbiAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coe1xuICAgICAgICAvLyAgICAgICAgIHR5cGVOYW1lOiB0eXBlb2YgbGVtYmVkTW9kZWxOYW1lLFxuICAgICAgICAvLyAgICAgICAgIGJvZHlUeXBlOiB0eXBlb2YgaW5mby5kb2NCb2R5XG4gICAgICAgIC8vICAgICB9KVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gVGhpcyBoYW5kbGVzIGNvbXB1dGluZyBlbWJlZGRpbmdzXG4gICAgICAgIC8vIGZvciB0aGUgdGl0bGUgYW5kIGJvZHlcbiAgICAgICAgaWYgKHR5cGVvZiBsZW1iZWRNb2RlbE5hbWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAvLyAmJiB0eXBlb2YgaW5mby50aXRsZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY0JvZHkgPT09ICdzdHJpbmcnXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy4jaW5zZXJ0TGVtYmVkRG9jdW1lbnRzLCB7XG4gICAgICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICRsZW1iZWRNb2RlbDogbGVtYmVkTW9kZWxOYW1lLFxuICAgICAgICAgICAgICAgIC8vICR0aXRsZUVtYmVkOiBpbmZvLnRpdGxlLFxuICAgICAgICAgICAgICAgICRib2R5RW1iZWQ6ICBpbmZvLmRvY0JvZHlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0TGVtYmVkRG9jdW1lbnRzLCB7XG4gICAgICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICRsZW1iZWRNb2RlbDogbGVtYmVkTW9kZWxOYW1lLFxuICAgICAgICAgICAgICAgIC8vICR0aXRsZUVtYmVkOiBpbmZvLnRpdGxlLFxuICAgICAgICAgICAgICAgICRib2R5RW1iZWQ6ICBpbmZvLmRvY0JvZHlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYHZlY19kb2N1bWVudHMgaW5zZXJ0ZWQgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHtcbiAgICAgICAgICAgIC8vICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICB0YWdzOiBpbmZvLm1ldGFkYXRhLnRhZ3NcbiAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5hZGREb2NUYWdHbHVlKFxuICAgICAgICAgICAgICAgIGluZm8udnBhdGgsIGluZm8ubWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICN1cGRhdGVEb2NEb2N1bWVudHM7XG4gICAgI3VwZGF0ZUxlbWJlZERvY3VtZW50cztcblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI3VwZGF0ZURvY0RvY3VtZW50cykge1xuICAgICAgICAgICAgdGhpcy4jdXBkYXRlRG9jRG9jdW1lbnRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3VwZGF0ZS1kb2MtZG9jdW1lbnRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLiN1cGRhdGVMZW1iZWREb2N1bWVudHMpIHtcbiAgICAgICAgICAgIHRoaXMuI3VwZGF0ZUxlbWJlZERvY3VtZW50cyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICd1cGRhdGUtbGVtYmVkLWRvY3VtZW50cy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI3VwZGF0ZURvY0RvY3VtZW50cywge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcblxuICAgICAgICAgICAgJHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAkcGFyZW50RGlyOiBpbmZvLnBhcmVudERpcixcbiAgICAgICAgICAgICRkb2NNZXRhZGF0YTogSlNPTi5zdHJpbmdpZnkoaW5mby5kb2NNZXRhZGF0YSksXG4gICAgICAgICAgICAkZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgJGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgICRyZW5kZXJlck5hbWU6IGluZm8ucmVuZGVyZXJOYW1lXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRoaXMgaGFuZGxlcyBjb21wdXRpbmcgZW1iZWRkaW5nc1xuICAgICAgICAvLyBmb3IgdGhlIHRpdGxlIGFuZCBib2R5XG4gICAgICAgIGlmICh0eXBlb2YgbGVtYmVkTW9kZWxOYW1lID09PSAnc3RyaW5nJ1xuICAgICAgICAgLy8gJiYgdHlwZW9mIGluZm8udGl0bGUgPT09ICdzdHJpbmcnXG4gICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NCb2R5ID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI3VwZGF0ZUxlbWJlZERvY3VtZW50cywge1xuICAgICAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAkbGVtYmVkTW9kZWw6IGxlbWJlZE1vZGVsTmFtZSxcbiAgICAgICAgICAgICAgICAvLyAkdGl0bGVFbWJlZDogaW5mby50aXRsZSxcbiAgICAgICAgICAgICAgICAkYm9keUVtYmVkOiAgaW5mby5kb2NCb2R5XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICBhd2FpdCB0Z2x1ZS5hZGRUYWdHbHVlKGluZm8udnBhdGgsIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZGVsZXRlRG9jVGFnR2x1ZSh2cGF0aCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGdsdWUuZGVsZXRlVGFnR2x1ZSh2cGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gaWdub3JlXG4gICAgICAgICAgICAvLyBUaGlzIGNhbiB0aHJvdyBhbiBlcnJvciBsaWtlOlxuICAgICAgICAgICAgLy8gZG9jdW1lbnRzQ2FjaGUgRVJST1Ige1xuICAgICAgICAgICAgLy8gICAgIGNvZGU6ICdjaGFuZ2VkJyxcbiAgICAgICAgICAgIC8vICAgICBuYW1lOiAnZG9jdW1lbnRzJyxcbiAgICAgICAgICAgIC8vICAgICB2cGF0aDogJ19tZXJtYWlkL3JlbmRlcjMzNTY3MzkzODIubWVybWFpZCcsXG4gICAgICAgICAgICAvLyAgICAgZXJyb3I6IEVycm9yOiBkZWxldGUgZnJvbSAnVEFHR0xVRScgZmFpbGVkOiBub3RoaW5nIGNoYW5nZWRcbiAgICAgICAgICAgIC8vICAgICAgLi4uIHN0YWNrIHRyYWNlXG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBJbiBzdWNoIGEgY2FzZSB0aGVyZSBpcyBubyB0YWdHbHVlIGZvciB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAgICAvLyBUaGlzIFwiZXJyb3JcIiBpcyBzcHVyaW91cy5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUT0RPIElzIHRoZXJlIGFub3RoZXIgcXVlcnkgdG8gcnVuIHRoYXQgd2lsbFxuICAgICAgICAgICAgLy8gbm90IHRocm93IGFuIGVycm9yIGlmIG5vdGhpbmcgd2FzIGNoYW5nZWQ/XG4gICAgICAgICAgICAvLyBJbiBvdGhlciB3b3JkcywgdGhpcyBjb3VsZCBoaWRlIGEgbGVnaXRpbWF0ZVxuICAgICAgICAgICAgLy8gZXJyb3IuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgYWRkRG9jVGFnR2x1ZSh2cGF0aDogc3RyaW5nLCB0YWdzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAodHlwZW9mIHRhZ3MgIT09ICdzdHJpbmcnXG4gICAgICAgICAmJiAhQXJyYXkuaXNBcnJheSh0YWdzKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkRG9jVGFnR2x1ZSBtdXN0IGJlIGdpdmVuIGEgdGFncyBhcnJheSwgd2FzIGdpdmVuOiAke3V0aWwuaW5zcGVjdCh0YWdzKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0Z2x1ZS5hZGRUYWdHbHVlKHZwYXRoLCBcbiAgICAgICAgICAgIEFycmF5LmlzQXJyYXkodGFncylcbiAgICAgICAgICAgID8gdGFnc1xuICAgICAgICAgICAgOiBbIHRhZ3MgXSk7XG4gICAgfVxuXG4gICAgYXN5bmMgYWRkVGFnRGVzY3JpcHRpb24odGFnOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRkZXNjLmFkZERlc2ModGFnLCBkZXNjcmlwdGlvbik7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0VGFnRGVzY3JpcHRpb24odGFnOiBzdHJpbmcpXG4gICAgICAgIDogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+XG4gICAge1xuICAgICAgICByZXR1cm4gdGRlc2MuZ2V0RGVzYyh0YWcpO1xuICAgIH1cblxuICAgICNzZWFyY2hTZW1hbnRpYztcblxuICAgIGFzeW5jIHNlbWFudGljU2VhcmNoRG9jcyhzZWFyY2hGb3I6IHN0cmluZylcbiAgICAgICAgOiBQcm9taXNlPEFycmF5PHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBkaXN0YW5jZTogbnVtYmVyXG4gICAgICAgIH0+PlxuICAgIHtcbiAgICAgICAgaWYgKCF0aGlzLiNzZWFyY2hTZW1hbnRpYykge1xuICAgICAgICAgICAgdGhpcy4jc2VhcmNoU2VtYW50aWMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnZG9jLXNlYXJjaC1zZW1hbnRpYy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IDxBcnJheTx7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgZGlzdGFuY2U6IG51bWJlclxuICAgICAgICB9Pj4gYXdhaXQgdGhpcy5kYi5hbGwodGhpcy4jc2VhcmNoU2VtYW50aWMsIHtcbiAgICAgICAgICAgICRsZW1iZWRNb2RlbDogbGVtYmVkTW9kZWxOYW1lLFxuICAgICAgICAgICAgJHNlYXJjaEZvcjogc2VhcmNoRm9yXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBpbmRleENoYWluQ2FjaGU7XG5cbiAgICBhc3luYyBpbmRleENoYWluKF9mcGF0aClcbiAgICAgICAgOiBQcm9taXNlPGluZGV4Q2hhaW5JdGVtW10+XG4gICAge1xuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSkgXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXRoLnBhcnNlKGZwYXRoKTtcblxuICAgICAgICBjb25zdCBkb0NhY2hpbmdcbiAgICAgICAgICAgID0gdGhpcy5jb25maWcuY2FjaGluZ1RpbWVvdXQgPiAwO1xuICAgICAgICBsZXQgY2FjaGVLZXk7XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmluZGV4Q2hhaW5DYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhDaGFpbkNhY2hlXG4gICAgICAgICAgICAgICAgICAgID0gbmV3IENhY2hlKHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FjaGVLZXkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgZGJuYW1lOiB0aGlzLnF1b3RlZERCTmFtZSxcbiAgICAgICAgICAgICAgICBmcGF0aCxcbiAgICAgICAgICAgICAgICBwYXJzZWRcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBjYWNoZWRcbiAgICAgICAgICAgICAgICA9IHRoaXMuaW5kZXhDaGFpbkNhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbmRleENoYWluICR7X2ZwYXRofSAke2ZwYXRofWAsIHBhcnNlZCk7XG5cbiAgICAgICAgY29uc3QgZmlsZXo6IERvY3VtZW50W10gPSBbXTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChmcGF0aCk7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGZwYXRoO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmKSAmJiBzZWxmLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICBmaWxlei5wdXNoKHNlbGZbMF0pO1xuICAgICAgICAgICAgZmlsZU5hbWUgPSBzZWxmWzBdLnJlbmRlclBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50RGlyO1xuICAgICAgICBsZXQgZGlyTmFtZSA9IHBhdGguZGlybmFtZShmcGF0aCk7XG4gICAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICghKGRpck5hbWUgPT09ICcuJyB8fCBkaXJOYW1lID09PSBwYXJzZWQucm9vdCkpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGVOYW1lKSA9PT0gJ2luZGV4Lmh0bWwnKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShmaWxlTmFtZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxvb2tGb3IgPSBwYXRoLmpvaW4ocGFyZW50RGlyLCBcImluZGV4Lmh0bWxcIik7XG5cbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gYXdhaXQgdGhpcy5maW5kQnlQYXRoKGxvb2tGb3IpO1xuXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpbmRleCkgJiYgaW5kZXgubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgICAgICBmaWxlei5wdXNoKGluZGV4WzBdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsZU5hbWUgPSBsb29rRm9yO1xuICAgICAgICAgICAgZGlyTmFtZSA9IHBhdGguZGlybmFtZShsb29rRm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJldCA9IGZpbGV6XG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbihvYmo6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGluZGV4Q2hhaW5JdGVtPntcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBvYmouZG9jTWV0YWRhdGEudGl0bGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogb2JqLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmREaXI6IG9iai5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRQYXRoOiBvYmoucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiAnLycgKyBvYmoucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBvYmouZm91bmREaXIgPSBvYmoubW91bnRQb2ludDtcbiAgICAgICAgICAgICAgICAgICAgLy8gb2JqLmZvdW5kUGF0aCA9IG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICAvLyBvYmouZmlsZW5hbWUgPSAnLycgKyBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIG9iajtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5yZXZlcnNlKCk7XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZyAmJiBjYWNoZUtleSkge1xuICAgICAgICAgICAgdGhpcy5pbmRleENoYWluQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBzaWJsaW5nc0NhY2hlO1xuICAgICNzaWJsaW5nc1NRTDtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIGFsbCB0aGUgZG9jdW1lbnRzIGluIHRoZSBzYW1lIGRpcmVjdG9yeVxuICAgICAqIGFzIHRoZSBuYW1lZCBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBkb2Vzbid0IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBzaWJsaW5ncyhfZnBhdGgpIHtcbiAgICAgICAgbGV0IHZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUodnBhdGgpO1xuXG4gICAgICAgIGNvbnN0IGRvQ2FjaGluZ1xuICAgICAgICAgICAgPSB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDA7XG4gICAgICAgIGxldCBjYWNoZUtleTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc2libGluZ3NDYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2libGluZ3NDYWNoZVxuICAgICAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZFxuICAgICAgICAgICAgICAgID0gdGhpcy5zaWJsaW5nc0NhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy4jc2libGluZ3NTUUwpIHtcbiAgICAgICAgICAgIHRoaXMuI3NpYmxpbmdzU1FMID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3NpYmxpbmdzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzaWJsaW5nc1xuICAgICAgICAgICAgPSBhd2FpdCB0aGlzLmRiLmFsbCh0aGlzLiNzaWJsaW5nc1NRTCwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWUsXG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGlnbm9yZWQgPSBzaWJsaW5ncy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuaWdub3JlRmlsZShpdGVtKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gdGhpcy52YWxpZGF0ZVJvd3MoaWdub3JlZCk7XG4gICAgICAgIGNvbnN0IHJldCA9IG1hcHBlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nICYmIGNhY2hlS2V5KSB7XG4gICAgICAgICAgICB0aGlzLnNpYmxpbmdzQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgICNkb2NzRm9yRGlybmFtZTtcbiAgICAjZGlyc0ZvclBhcmVudGRpcjtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB0cmVlIG9mIGl0ZW1zIHN0YXJ0aW5nIGZyb20gdGhlIGRvY3VtZW50XG4gICAgICogbmFtZWQgaW4gX3Jvb3RJdGVtLiAgVGhlIHBhcmFtZXRlciBzaG91bGQgYmUgYW5cbiAgICAgKiBhY3R1YWwgZG9jdW1lbnQgaW4gdGhlIHRyZWUsIHN1Y2ggYXMgYHBhdGgvdG8vaW5kZXguaHRtbGAuXG4gICAgICogVGhlIHJldHVybiBpcyBhIHRyZWUtc2hhcGVkIHNldCBvZiBvYmplY3RzIGxpa2UgdGhlIGZvbGxvd2luZztcbiAgICAgKiBcbiAgdHJlZTpcbiAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlclxuICAgIGl0ZW1zOlxuICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBjaGlsZEZvbGRlcnM6XG4gICAgICAgIC0gZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICAgICAgaXRlbXM6XG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sXG4gICAgICAgICAgICAgIGNoaWxkRm9sZGVyczogW11cbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sXG4gICAgICAgICAgICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAqXG4gICAgICogVGhlIG9iamVjdHMgdW5kZXIgYGl0ZW1zYCBhcmUgYWN0dWxseSB0aGUgZnVsbCBEb2N1bWVudCBvYmplY3RcbiAgICAgKiBmcm9tIHRoZSBjYWNoZSwgYnV0IGZvciB0aGUgaW50ZXJlc3Qgb2YgY29tcGFjdG5lc3MgbW9zdCBvZlxuICAgICAqIHRoZSBmaWVsZHMgaGF2ZSBiZWVuIGRlbGV0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX3Jvb3RJdGVtIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGNoaWxkSXRlbVRyZWUoX3Jvb3RJdGVtOiBzdHJpbmcpIHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hpbGRJdGVtVHJlZSAke19yb290SXRlbX1gKTtcblxuICAgICAgICBsZXQgcm9vdEl0ZW0gPSBhd2FpdCB0aGlzLmZpbmQoXG4gICAgICAgICAgICAgICAgX3Jvb3RJdGVtLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9yb290SXRlbS5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfcm9vdEl0ZW0pO1xuICAgICAgICBpZiAoIXJvb3RJdGVtKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYGNoaWxkSXRlbVRyZWUgbm8gcm9vdEl0ZW0gZm91bmQgZm9yIHBhdGggJHtfcm9vdEl0ZW19YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKHR5cGVvZiByb290SXRlbSA9PT0gJ29iamVjdCcpXG4gICAgICAgICB8fCAhKCd2cGF0aCcgaW4gcm9vdEl0ZW0pXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGBjaGlsZEl0ZW1UcmVlIGZvdW5kIGludmFsaWQgb2JqZWN0IGZvciAke19yb290SXRlbX0gLSAke3V0aWwuaW5zcGVjdChyb290SXRlbSl9YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKHJvb3RJdGVtLnZwYXRoKTtcblxuICAgICAgICBpZiAoIXRoaXMuI2RvY3NGb3JEaXJuYW1lKSB7XG4gICAgICAgICAgICB0aGlzLiNkb2NzRm9yRGlybmFtZSA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdkb2NzLWZvci1kaXJuYW1lLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQaWNrcyB1cCBldmVyeXRoaW5nIGZyb20gdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIC8vIERpZmZlcnMgZnJvbSBzaWJsaW5ncyBieSBnZXR0aW5nIGV2ZXJ5dGhpbmcuXG4gICAgICAgIGNvbnN0IF9pdGVtcyA9IDxhbnlbXT5hd2FpdCB0aGlzLmRiLmFsbCh0aGlzLiNkb2NzRm9yRGlybmFtZSwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGl0ZW1zOiBEb2N1bWVudFtdXG4gICAgICAgICAgICA9IHRoaXMudmFsaWRhdGVSb3dzKF9pdGVtcylcbiAgICAgICAgICAgIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghdGhpcy4jZGlyc0ZvclBhcmVudGRpcikge1xuICAgICAgICAgICAgdGhpcy4jZGlyc0ZvclBhcmVudGRpciA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdkaXJzLWZvci1wYXJlbnRkaXIuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF9jaGlsZEZvbGRlcnMgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwodGhpcy4jZGlyc0ZvclBhcmVudGRpciwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNoaWxkRm9sZGVycyA9IG5ldyBBcnJheTx7IGRpcm5hbWU6IHN0cmluZyB9PigpO1xuICAgICAgICBmb3IgKGNvbnN0IGNmIG9mIF9jaGlsZEZvbGRlcnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2YuZGlybmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjaGlsZEZvbGRlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGRpcm5hbWU6IGNmLmRpcm5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjaGlsZEl0ZW1UcmVlKCR7X3Jvb3RJdGVtfSkgbm8gZGlybmFtZSBmaWVsZHMgaW4gY2hpbGRGb2xkZXJzYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2ZzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgY2Ygb2YgY2hpbGRGb2xkZXJzKSB7XG4gICAgICAgICAgICBjZnMucHVzaChhd2FpdCB0aGlzLmNoaWxkSXRlbVRyZWUoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKGNmLmRpcm5hbWUsICdpbmRleC5odG1sJylcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvb3RJdGVtLFxuICAgICAgICAgICAgZGlybmFtZSxcbiAgICAgICAgICAgIGl0ZW1zOiBpdGVtcyxcbiAgICAgICAgICAgIC8vIFVuY29tbWVudCB0aGlzIHRvIGdlbmVyYXRlIHNpbXBsaWZpZWQgb3V0cHV0XG4gICAgICAgICAgICAvLyBmb3IgZGVidWdnaW5nLlxuICAgICAgICAgICAgLy8gLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoXG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSksXG4gICAgICAgICAgICBjaGlsZEZvbGRlcnM6IGNmc1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgI2luZGV4RmlsZXNTUUw7XG4gICAgI2luZGV4RmlsZXNTUUxyZW5kZXJQYXRoO1xuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgaW5kZXggZmlsZXMgKHJlbmRlcnMgdG8gaW5kZXguaHRtbClcbiAgICAgKiB3aXRoaW4gdGhlIG5hbWVkIHN1YnRyZWUuXG4gICAgICogXG4gICAgICogSXQgYXBwZWFycyB0aGlzIHdhcyB3cml0dGVuIGZvciBib29rbmF2LlxuICAgICAqIEJ1dCwgaXQgYXBwZWFycyB0aGF0IGJvb2tuYXYgZG9lcyBub3RcbiAgICAgKiB1c2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb290UGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBpbmRleEZpbGVzKHJvb3RQYXRoPzogc3RyaW5nKSB7XG4gICAgICAgIGxldCByb290UCA9IHJvb3RQYXRoPy5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgID8gcm9vdFBhdGg/LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgOiByb290UGF0aDtcblxuICAgICAgICBpZiAoIXRoaXMuI2luZGV4RmlsZXNTUUwpIHtcbiAgICAgICAgICAgIHRoaXMuI2luZGV4RmlsZXNTUUwgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5kZXgtZG9jLWZpbGVzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuI2luZGV4RmlsZXNTUUxyZW5kZXJQYXRoKSB7XG4gICAgICAgICAgICB0aGlzLiNpbmRleEZpbGVzU1FMcmVuZGVyUGF0aCA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdpbmRleC1kb2MtZmlsZXMtcmVuZGVyUGF0aC5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXhlcyA9IFxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIHR5cGVvZiByb290UCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAmJiByb290UC5sZW5ndGggPj0gMVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgPyA8YW55W10+IGF3YWl0IHRoaXMuZGIuYWxsKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLiNpbmRleEZpbGVzU1FMcmVuZGVyUGF0aCwgeyAkcm9vdFA6IGAke3Jvb3RQfSVgIH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICA6IDxhbnlbXT4gYXdhaXQgdGhpcy5kYi5hbGwoXG4gICAgICAgICAgICAgICAgdGhpcy4jaW5kZXhGaWxlc1NRTFxuICAgICAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHRoaXMudmFsaWRhdGVSb3dzKGluZGV4ZXMpO1xuICAgICAgICByZXR1cm4gbWFwcGVkLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN2dFJvd1RvT2JqKGl0ZW0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEl0J3MgcHJvdmVkIGRpZmZpY3VsdCB0byBnZXQgdGhlIHJlZ2V4cFxuICAgICAgICAvLyB0byB3b3JrIGluIHRoaXMgbW9kZTpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gcmV0dXJuIGF3YWl0IHRoaXMuc2VhcmNoKHtcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0hUTUw6IHRydWUsXG4gICAgICAgIC8vICAgICByZW5kZXJwYXRobWF0Y2g6IC9cXC9pbmRleC5odG1sJC8sXG4gICAgICAgIC8vICAgICByb290UGF0aDogcm9vdFBhdGhcbiAgICAgICAgLy8gfSk7XG4gICAgfVxuXG4gICAgI2ZpbGVzRm9yU2V0VGltZXM7XG5cbiAgICAvKipcbiAgICAgKiBGb3IgZXZlcnkgZmlsZSBpbiB0aGUgZG9jdW1lbnRzIGNhY2hlLFxuICAgICAqIHNldCB0aGUgYWNjZXNzIGFuZCBtb2RpZmljYXRpb25zLlxuICAgICAqIFxuICAgICAqIFRoaXMgaXMgdXNlZCBmcm9tIGNsaS50cyBkb2NzLXNldC1kYXRlc1xuICAgICAqXG4gICAgICogPz8/Pz8gV2h5IHdvdWxkIHRoaXMgYmUgdXNlZnVsP1xuICAgICAqIEkgY2FuIHNlZSBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWRcbiAgICAgKiBmaWxlcyBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeS4gIEJ1dCB0aGlzIGlzXG4gICAgICogZm9yIHRoZSBmaWxlcyBpbiB0aGUgZG9jdW1lbnRzIGRpcmVjdG9yaWVzLiA/Pz8/XG4gICAgICovXG4gICAgYXN5bmMgc2V0VGltZXMoKSB7XG5cbiAgICAgICAgLy8gVGhlIFNFTEVDVCBiZWxvdyBwcm9kdWNlcyByb3cgb2JqZWN0cyBwZXJcbiAgICAgICAgLy8gdGhpcyBpbnRlcmZhY2UgZGVmaW5pdGlvbi4gIFRoaXMgZnVuY3Rpb24gbG9va3NcbiAgICAgICAgLy8gZm9yIGEgdmFsaWQgZGF0ZSBmcm9tIHRoZSBkb2N1bWVudCBtZXRhZGF0YSxcbiAgICAgICAgLy8gYW5kIGVuc3VyZXMgdGhlIGZzcGF0aCBmaWxlIGlzIHNldCB0byB0aGF0IGRhdGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHNhaWQgaW4gdGhlIGNvbW1lbnQgYWJvdmUuLi4uIFdIWT9cbiAgICAgICAgLy8gSSBjYW4gdW5kZXJzdGFuZCBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWQgb3V0cHV0LlxuICAgICAgICAvLyBGb3Igd2hhdCBwdXJwb3NlIGRpZCBJIGNyZWF0ZSB0aGlzIGZ1bmN0aW9uP1xuICAgICAgICBjb25zdCBzZXR0ZXIgPSAocm93OiB7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgZnNwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBtdGltZU1zOiBudW1iZXIsXG4gICAgICAgICAgICBwdWJsaWNhdGlvblRpbWU6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxEYXRlOiBzdHJpbmcsXG4gICAgICAgICAgICBwdWJsaWNhdGlvbkRhdGU6IHN0cmluZ1xuICAgICAgICB9KSA9PiB7XG4gICAgICAgICAgICBsZXQgcGFyc2VkID0gTmFOO1xuICAgICAgICAgICAgaWYgKHJvdy5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxEYXRlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93LnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5wdWJsaWNhdGlvblRpbWUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZWQgPSByb3cucHVibGljYXRpb25UaW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRwID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICBGUy51dGltZXNTeW5jKFxuICAgICAgICAgICAgICAgICAgICByb3cuZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBkcCxcbiAgICAgICAgICAgICAgICAgICAgZHBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy4jZmlsZXNGb3JTZXRUaW1lcykge1xuICAgICAgICAgICAgdGhpcy4jZmlsZXNGb3JTZXRUaW1lcyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdmaWxlcy1mb3Itc2V0dGltZXMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuZGIuZWFjaCh0aGlzLiNmaWxlc0ZvclNldFRpbWVzLCB7IH0sXG4gICAgICAgIChyb3c6IHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBmc3BhdGg6IHN0cmluZyxcbiAgICAgICAgICAgIG10aW1lTXM6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uVGltZTogbnVtYmVyLFxuICAgICAgICAgICAgcHVibERhdGU6IHN0cmluZyxcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uRGF0ZTogc3RyaW5nXG4gICAgICAgIH0pID0+IHtcbiAgICAgICAgICAgIGlmIChyb3cucHVibERhdGVcbiAgICAgICAgICAgICB8fCByb3cucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgfHwgcm93LnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc2V0dGVyKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRoaXMgd2FzIHdyaXR0ZW4gZm9yIHRhZ2dlZC1jb250ZW50XG4gICAgYXN5bmMgZG9jdW1lbnRzV2l0aFRhZyh0YWdubTogc3RyaW5nIHwgc3RyaW5nW10pXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxzdHJpbmc+PlxuICAgIHtcbiAgICAgICAgbGV0IHRhZ3M6IHN0cmluZ1tdO1xuICAgICAgICBpZiAodHlwZW9mIHRhZ25tID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGFncyA9IFsgdGFnbm0gXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRhZ25tKSkge1xuICAgICAgICAgICAgdGFncyA9IHRhZ25tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudHNXaXRoVGFnIGdpdmVuIGJhZCB0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KHRhZ25tKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvcnJlY3RseSBoYW5kbGUgdGFnIHN0cmluZ3Mgd2l0aFxuICAgICAgICAvLyB2YXJ5aW5nIHF1b3Rlcy4gIEEgZG9jdW1lbnQgbWlnaHQgaGF2ZSB0aGVzZSB0YWdzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICB0YWdzOlxuICAgICAgICAvLyAgICAtIFRlYXNlcidzXG4gICAgICAgIC8vICAgIC0gVGVhc2Vyc1xuICAgICAgICAvLyAgICAtIFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZXNlIFNRTCBxdWVyaWVzIHdvcms6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVvdGVkXCInLCBcIlRlYXNlcidzXCIgKTtcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxUZWFzZXInc1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVvdGVkXCInLCAnVGVhc2VyJydzJyApO1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFRlYXNlcidzXG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8U29tZXRoaW5nIFwicXVvdGVkXCJcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQnV0LCB0aGlzIGRvZXMgbm90OlxuICAgICAgICAvL1xuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lID0gJ1RlYXNlcidzJztcbiAgICAgICAgLy8gJyAgLi4uPiBcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIG9yaWdpbmFsIGNvZGUgYmVoYXZpb3Igd2FzIHRoaXM6XG4gICAgICAgIC8vXG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInNcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuIGF0dGVtcHRlZCBmaXg6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgXCJUZWFzZXInc1wiIF0gICggJ1RlYXNlclxcJ3MnICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwic1wiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5vdGhlciBhdHRlbXB0ZWQgZml4OlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiBdICAoIFwiVGVhc2VyJydzXCIgKSBcbiAgICAgICAgLy8gW11cbiAgICAgICAgLy8gW11cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5kOlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyAnU29tZXRoaW5nIFwicXVvdGVkXCInXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyAnU29tZXRoaW5nIFwicXVvdGVkXCInIF0gICggXCJTb21ldGhpbmcgXCJxdW90ZWRcIlwiICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwicXVvdGVkXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgY29kZSBiZWxvdyBwcm9kdWNlczpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiICdTb21ldGhpbmcgXCJxdW90ZWRcIidcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiwgJ1NvbWV0aGluZyBcInF1b3RlZFwiJyBdICAoICdUZWFzZXInJ3MnLCdTb21ldGhpbmcgXCJxdW90ZWRcIicgKSBcbiAgICAgICAgLy8gWyB7IHZwYXRoOiAndGVhc2VyLWNvbnRlbnQuaHRtbC5tZCcgfSBdXG4gICAgICAgIC8vIFsgJ3RlYXNlci1jb250ZW50Lmh0bWwubWQnIF1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZG9jdW1lbnRzV2l0aFRhZyAke3V0aWwuaW5zcGVjdCh0YWdzKX0gJHt0YWdzdHJpbmd9YCk7XG5cbiAgICAgICAgY29uc3QgdnBhdGhzID0gYXdhaXQgdGdsdWUucGF0aHNGb3JUYWcodGFncyk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zb2xlLmxvZyh2cGF0aHMpO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2cGF0aHMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50c1dpdGhUYWcgbm9uLUFycmF5IHJlc3VsdCAke3V0aWwuaW5zcGVjdCh2cGF0aHMpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZwYXRocztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gYXJyYXkgb2YgdGFncyB1c2VkIGJ5IGFsbCBkb2N1bWVudHMuXG4gICAgICogVGhpcyB1c2VzIHRoZSBKU09OIGV4dGVuc2lvbiB0byBleHRyYWN0XG4gICAgICogdGhlIHRhZ3MgZnJvbSB0aGUgbWV0YWRhdGEgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgdGFncygpIHtcbiAgICAgICAgY29uc3QgdGFncyA9IGF3YWl0IHRnbHVlLnRhZ3MoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHJldCA9IEFycmF5LmZyb20odGFncyk7XG4gICAgICAgIHJldHVybiByZXQuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHZhciB0YWdBID0gYS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIHRhZ0IgPSBiLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAodGFnQSA8IHRhZ0IpIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmICh0YWdBID4gdGFnQikgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBncm91cHMgb2Ygc2ltaWxhciB0YWdzIGJhc2VkIG9uIGNhc2UtaW5zZW5zaXRpdmUgbWF0Y2hpbmcsXG4gICAgICogcGx1cmFsL3Npbmd1bGFyIHZhcmlhbnRzLCBhbmQgTGV2ZW5zaHRlaW4gZGlzdGFuY2UuXG4gICAgICogXG4gICAgICogQHBhcmFtIHRocmVzaG9sZCAtIE1heGltdW0gTGV2ZW5zaHRlaW4gZGlzdGFuY2UgdG8gY29uc2lkZXIgdGFncyBzaW1pbGFyIChkZWZhdWx0OiAyKVxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIFNpbWlsYXJUYWdHcm91cCBvYmplY3RzXG4gICAgICovXG4gICAgYXN5bmMgZmluZFNpbWlsYXJUYWdzKHRocmVzaG9sZDogbnVtYmVyID0gMik6IFByb21pc2U8U2ltaWxhclRhZ0dyb3VwW10+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRnbHVlLmZpbmRTaW1pbGFyVGFncyh0aHJlc2hvbGQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGFncyB0aGF0IGhhdmUgbm8gZGVzY3JpcHRpb24gaW4gdGhlIFRBR0RFU0NSSVBUSU9OIHRhYmxlLlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIFRhZ1dpdGhvdXREZXNjcmlwdGlvbiBvYmplY3RzXG4gICAgICovXG4gICAgYXN5bmMgdGFnc1dpdGhvdXREZXNjcmlwdGlvbnMoKTogUHJvbWlzZTxUYWdXaXRob3V0RGVzY3JpcHRpb25bXT4ge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGdsdWUudGFnc1dpdGhvdXREZXNjcmlwdGlvbnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRhZyBkZXNjcmlwdGlvbnMgdGhhdCBhcmUgZGVmaW5lZCBidXQgbm90IHVzZWQgYnkgYW55IGRvY3VtZW50LlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIHRhZyBuYW1lc1xuICAgICAqL1xuICAgIGFzeW5jIHVudXNlZFRhZ0Rlc2NyaXB0aW9ucygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0ZGVzYy51bnVzZWRUYWdEZXNjcmlwdGlvbnMoKTtcbiAgICB9XG5cbiAgICAjZG9jTGlua0RhdGE7XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgZGF0YSBmb3IgYW4gaW50ZXJuYWwgbGlua1xuICAgICAqIHdpdGhpbiB0aGUgc2l0ZSBkb2N1bWVudHMuICBGb3JtaW5nIGFuXG4gICAgICogaW50ZXJuYWwgbGluayBpcyBhdCBhIG1pbmltdW0gdGhlIHJlbmRlcmVkXG4gICAgICogcGF0aCBmb3IgdGhlIGRvY3VtZW50IGFuZCBpdHMgdGl0bGUuXG4gICAgICogVGhlIHRlYXNlciwgaWYgYXZhaWxhYmxlLCBjYW4gYmUgdXNlZCBpblxuICAgICAqIGEgdG9vbHRpcC4gVGhlIHRodW1ibmFpbCBpcyBhbiBpbWFnZSB0aGF0XG4gICAgICogY291bGQgYmUgZGlzcGxheWVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGRvY0xpbmtEYXRhKHZwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcblxuICAgICAgICAvLyBUaGUgdnBhdGggcmVmZXJlbmNlXG4gICAgICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBwYXRoIGl0IHJlbmRlcnMgdG9cbiAgICAgICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGl0bGUgc3RyaW5nIGZyb20gdGhhdCBwYWdlXG4gICAgICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSB0ZWFzZXIgdGV4dCBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0ZWFzZXI/OiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBoZXJvIGltYWdlICh0aHVtYm5haWwpXG4gICAgICAgIHRodW1ibmFpbD86IHN0cmluZztcbiAgICB9PiB7XG5cbiAgICAgICAgaWYgKCF0aGlzLiNkb2NMaW5rRGF0YSkge1xuICAgICAgICAgICAgdGhpcy4jZG9jTGlua0RhdGEgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnZG9jLWxpbmstZGF0YS5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm91bmQgPSA8YW55W10+IGF3YWl0IHRoaXMuZGIuYWxsKHRoaXMuI2RvY0xpbmtEYXRhLCB7XG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZvdW5kKSkge1xuXG4gICAgICAgICAgICBjb25zdCBkb2MgPSBmb3VuZFswXTtcblxuICAgICAgICAgICAgLy8gaWYgKCFkb2MubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIC8vICAgICBjb25zb2xlLndhcm4oYFdBUk5JTkcgZG9jTGlua0RhdGEgbm8gbWV0YWRhdGEgZm9yICR7dnBhdGh9YCk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8vIGNvbnN0IGRvY0luZm8gPSBhd2FpdCB0aGlzLmZpbmQodnBhdGgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBkb2MucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICB0aXRsZTogZG9jLnRpdGxlLFxuICAgICAgICAgICAgICAgIHRlYXNlcjogZG9jLnRlYXNlcixcbiAgICAgICAgICAgICAgICAvLyB0aHVtYm5haWxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB0aXRsZTogdW5kZWZpbmVkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZWFyY2hDYWNoZTtcblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gZGVzY3JpcHRpdmUgc2VhcmNoIG9wZXJhdGlvbnMgdXNpbmcgZGlyZWN0IFNRTCBxdWVyaWVzXG4gICAgICogZm9yIGJldHRlciBwZXJmb3JtYW5jZSBhbmQgc2NhbGFiaWxpdHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBTZWFyY2ggb3B0aW9ucyBvYmplY3RcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlPEFycmF5PERvY3VtZW50Pj5cbiAgICAgKi9cbiAgICBhc3luYyBzZWFyY2gob3B0aW9ucyk6IFByb21pc2U8QXJyYXk8RG9jdW1lbnQ+PiB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLnNlYXJjaENhY2hlKSB7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaENhY2hlID0gbmV3IENhY2hlKFxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmlyc3QsIHNlZSBpZiB0aGUgc2VhcmNoIHJlc3VsdHMgYXJlIGFscmVhZHlcbiAgICAgICAgLy8gY29tcHV0ZWQgYW5kIGluIHRoZSBjYWNoZS5cblxuICAgICAgICAvLyBUaGUgaXNzdWUgaGVyZSBpcyB0aGF0IHRoZSBvcHRpb25zXG4gICAgICAgIC8vIG9iamVjdCBjYW4gY29udGFpbiBSZWdFeHAgdmFsdWVzLlxuICAgICAgICAvLyBUaGUgUmVnRXhwIG9iamVjdCBkb2VzIG5vdCBoYXZlXG4gICAgICAgIC8vIGEgdG9KU09OIGZ1bmN0aW9uLiAgVGhpcyBob29rXG4gICAgICAgIC8vIGNhdXNlcyBSZWdFeHAgdG8gcmV0dXJuIHRoZVxuICAgICAgICAvLyAudG9TdHJpbmcoKSB2YWx1ZSBpbnN0ZWFkLlxuICAgICAgICAvL1xuICAgICAgICAvLyBTb3VyY2U6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIwMjc2NTMxL3N0cmluZ2lmeWluZy1hLXJlZ3VsYXItZXhwcmVzc2lvblxuICAgICAgICAvL1xuICAgICAgICAvLyBBIHNpbWlsYXIgaXNzdWUgZXhpc3RzIHdpdGggRnVuY3Rpb25zXG4gICAgICAgIC8vIGluIHRoZSBvYmplY3QuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFNvdXJjZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjc1NDkxOS9qc29uLXN0cmluZ2lmeS1mdW5jdGlvblxuICAgICAgICBjb25zdCBjYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlICsgJyc7IC8vIGltcGxpY2l0bHkgYHRvU3RyaW5nYCBpdFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gQSB0aW1lb3V0IG9mIDAgbWVhbnMgdG8gZGlzYWJsZSBjYWNoaW5nXG4gICAgICAgIGNvbnN0IGNhY2hlZCA9XG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5zZWFyY2hDYWNoZS5nZXQoY2FjaGVLZXkpXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfSA9PT4gJHtjYWNoZUtleX0gJHtjYWNoZWQgPyAnaGFzQ2FjaGVkJyA6ICdub0NhY2hlZCd9YCk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGNhY2hlIGhhcyBhbiBlbnRyeSwgc2tpcCBjb21wdXRpbmdcbiAgICAgICAgLy8gYW55dGhpbmcuXG4gICAgICAgIGlmIChjYWNoZWQpIHsgLy8gMSBtaW51dGUgY2FjaGVcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOT1RFOiBFbnRyaWVzIGFyZSBhZGRlZCB0byB0aGUgY2FjaGUgYXQgdGhlIGJvdHRvbVxuICAgICAgICAvLyBvZiB0aGlzIGZ1bmN0aW9uXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgc3FsLCBwYXJhbXMgfSA9IHRoaXMuYnVpbGRTZWFyY2hRdWVyeShvcHRpb25zKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggJHtzcWx9YCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHRzXG4gICAgICAgICAgICAgICAgPSBhd2FpdCB0aGlzLmRiLmFsbChzcWwsIHBhcmFtcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50c1xuICAgICAgICAgICAgICAgID0gdGhpcy52YWxpZGF0ZVJvd3MocmVzdWx0cylcbiAgICAgICAgICAgICAgICAubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBBcHBseSBwb3N0LVNRTCBmaWx0ZXJzIHRoYXQgY2FuJ3QgYmUgZG9uZSBpbiBTUUxcbiAgICAgICAgICAgIGxldCBmaWx0ZXJlZFJlc3VsdHMgPSBkb2N1bWVudHM7XG5cbiAgICAgICAgICAgIC8vIEZpbHRlciBieSByZW5kZXJlcnMgKHJlcXVpcmVzIGNvbmZpZyBsb29rdXApXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJlcnNcbiAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVyZXJzKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbmRlcmVyID0gZmNhY2hlLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGl0ZW0udnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlbmRlcmVyKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCByIG9mIG9wdGlvbnMucmVuZGVyZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnICYmIHIgPT09IHJlbmRlcmVyLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1dBUk5JTkc6IE1hdGNoaW5nIHJlbmRlcmVyIGJ5IG9iamVjdCBjbGFzcyBpcyBubyBsb25nZXIgc3VwcG9ydGVkJywgcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBcHBseSBjdXN0b20gZmlsdGVyIGZ1bmN0aW9uXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXJmdW5jKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZmlsdGVyZnVuYyhmY2FjaGUuY29uZmlnLCBvcHRpb25zLCBpdGVtKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXBwbHkgY3VzdG9tIHNvcnQgZnVuY3Rpb24gKGlmIFNRTCBzb3J0aW5nIHdhc24ndCB1c2VkKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRGdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLnNvcnQob3B0aW9ucy5zb3J0RnVuYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFkZCB0aGUgcmVzdWx0cyB0byB0aGUgY2FjaGVcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaENhY2hlLnB1dChcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVLZXksIGZpbHRlcmVkUmVzdWx0c1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyZWRSZXN1bHRzO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5zZWFyY2ggZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCBTUUwgcXVlcnkgYW5kIHBhcmFtZXRlcnMgZm9yIHNlYXJjaCBvcHRpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZFNlYXJjaFF1ZXJ5KG9wdGlvbnMpOiB7XG4gICAgICAgIHNxbDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IGFueVxuICAgIH0ge1xuICAgICAgICBjb25zdCBwYXJhbXM6IGFueSA9IHt9O1xuICAgICAgICBjb25zdCB3aGVyZUNsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGpvaW5zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBsZXQgcGFyYW1Db3VudGVyID0gMDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgYnVpbGRTZWFyY2hRdWVyeSAke3V0aWwuaW5zcGVjdChvcHRpb25zKX1gKTtcblxuICAgICAgICAvLyBIZWxwZXIgdG8gY3JlYXRlIHVuaXF1ZSBwYXJhbWV0ZXIgbmFtZXNcbiAgICAgICAgY29uc3QgYWRkUGFyYW0gPSAodmFsdWU6IGFueSk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgJHBhcmFtJHsrK3BhcmFtQ291bnRlcn1gO1xuICAgICAgICAgICAgcGFyYW1zW3BhcmFtTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbU5hbWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQmFzZSBxdWVyeVxuICAgICAgICBsZXQgc3FsID0gYFxuICAgICAgICAgICAgU0VMRUNUIERJU1RJTkNUIGQuKiBGUk9NICR7dGhpcy5xdW90ZWREQk5hbWV9IGRcbiAgICAgICAgYDtcblxuICAgICAgICAvLyBNSU1FIHR5cGUgZmlsdGVyaW5nXG4gICAgICAgIGlmIChvcHRpb25zLm1pbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLm1pbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMubWltZSl9YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5taW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubWltZS5tYXAobWltZSA9PiBhZGRQYXJhbShtaW1lKSkuam9pbignLCAnKTtcbiAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5taW1lIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW5kZXJzIHRvIEhUTUwgZmlsdGVyaW5nXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJzVG9IVE1MID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnJlbmRlcnNUb0hUTUwgPSAke2FkZFBhcmFtKG9wdGlvbnMucmVuZGVyc1RvSFRNTCA/IDEgOiAwKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJvb3QgcGF0aCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJvb3RQYXRoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBMSUtFICR7YWRkUGFyYW0ob3B0aW9ucy5yb290UGF0aCArICclJyl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5nbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMuZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5nbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQudnBhdGggR0xPQiAke2FkZFBhcmFtKGVzY2FwZWRHbG9iKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciBnbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMucmVuZGVyZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5yZW5kZXJnbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLnJlbmRlcmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMucmVuZGVyZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5yZW5kZXJnbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBHTE9CICR7YWRkUGFyYW0oZXNjYXBlZEdsb2IpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmxvZyB0YWcgZmlsdGVyaW5nXG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBibG9ndGFncyBhcnJheSBpcyB1c2VkLFxuICAgICAgICAvLyBpZiBwcmVzZW50LCB3aXRoIHRoZSBibG9ndGFnIHZhbHVlIHVzZWRcbiAgICAgICAgLy8gb3RoZXJ3aXNlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgcHVycG9zZSBmb3IgdGhlIGJsb2d0YWdzIHZhbHVlIGlzIHRvXG4gICAgICAgIC8vIHN1cHBvcnQgYSBwc2V1ZG8tYmxvZyBtYWRlIG9mIHRoZSBpdGVtc1xuICAgICAgICAvLyBmcm9tIG11bHRpcGxlIGFjdHVhbCBibG9ncy5cbiAgICAgICAgLy8gaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAvLyAgfHwgdHlwZW9mIG9wdGlvbnMuYmxvZ3RhZyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhgIGJsb2d0YWdzICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZ3MpfSBibG9ndGFnICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZyl9YCk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5ibG9ndGFncykpIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMuYmxvZ3RhZ3MubWFwKHRhZyA9PiBhZGRQYXJhbSh0YWcpKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5ibG9ndGFnID0gJHthZGRQYXJhbShvcHRpb25zLmJsb2d0YWcpfWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQuYmxvZ3RhZyA9ICR7b3B0aW9ucy5ibG9ndGFnfWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBibG9ndGFncyBhcnJheSAke3V0aWwuaW5zcGVjdChvcHRpb25zLmJsb2d0YWdzKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRhZyBmaWx0ZXJpbmcgdXNpbmcgVEFHR0xVRSB0YWJsZVxuICAgICAgICBpZiAob3B0aW9ucy50YWcgJiYgdHlwZW9mIG9wdGlvbnMudGFnID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgam9pbnMucHVzaChgSU5ORVIgSk9JTiBUQUdHTFVFIHRnIE9OIGQudnBhdGggPSB0Zy5kb2N2cGF0aGApO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYHRnLnRhZ05hbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMudGFnKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExheW91dCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMubGF5b3V0cykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5sYXlvdXRzKSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxheW91dHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5sYXlvdXRzWzBdKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubGF5b3V0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubGF5b3V0cy5tYXAobGF5b3V0ID0+IGFkZFBhcmFtKGxheW91dCkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubGF5b3V0ID0gJHthZGRQYXJhbShvcHRpb25zLmxheW91dHMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGF0aCByZWdleCBtYXRjaGluZ1xuICAgICAgICBjb25zdCByZWdleENsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5wYXRobWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucGF0aG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5wYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciBwYXRoIHJlZ2V4IG1hdGNoaW5nXG4gICAgICAgIC8vIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3Qob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gsIGZhbHNlLCAzKSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIHN0cmluZyAke29wdGlvbnMucmVuZGVycGF0aG1hdGNofWApO1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIHJlZ2V4cCAke29wdGlvbnMucmVuZGVycGF0aG1hdGNoLnNvdXJjZX1gKTtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIGFycmF5IHN0cmluZyAke21hdGNofWApO1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIGFycmF5IHJlZ2V4cCAke21hdGNoLnNvdXJjZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdyZW5kZXJwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZWdleENsYXVzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYCgke3JlZ2V4Q2xhdXNlcy5qb2luKCcgT1IgJyl9KWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIEpPSU5zIHRvIHF1ZXJ5XG4gICAgICAgIGlmIChqb2lucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzcWwgKz0gJyAnICsgam9pbnMuam9pbignICcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIFdIRVJFIGNsYXVzZVxuICAgICAgICBpZiAod2hlcmVDbGF1c2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNxbCArPSAnIFdIRVJFICcgKyB3aGVyZUNsYXVzZXMuam9pbignIEFORCAnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBPUkRFUiBCWSBjbGF1c2VcbiAgICAgICAgbGV0IG9yZGVyQnkgPSAnJztcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRCeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIEhhbmRsZSBzcGVjaWFsIGNhc2VzIHRoYXQgbmVlZCBKU09OIGV4dHJhY3Rpb24gb3IgY29tcGxleCBsb2dpY1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25EYXRlJ1xuICAgICAgICAgICAgIHx8IG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25UaW1lJ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIENPQUxFU0NFIHRvIGhhbmRsZSBudWxsIHB1YmxpY2F0aW9uIGRhdGVzXG4gICAgICAgICAgICAgICAgb3JkZXJCeSA9IGBPUkRFUiBCWSBDT0FMRVNDRShcbiAgICAgICAgICAgICAgICAgICAgZC5wdWJsaWNhdGlvblRpbWUsXG4gICAgICAgICAgICAgICAgICAgIGQubXRpbWVNc1xuICAgICAgICAgICAgICAgIClgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIG90aGVyIGZpZWxkcywgc29ydCBieSB0aGUgY29sdW1uIGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBhbGxvd3Mgc29ydGluZyBieSBhbnkgdmFsaWQgY29sdW1uIGluIHRoZSBET0NVTUVOVFMgdGFibGVcbiAgICAgICAgICAgICAgICBvcmRlckJ5ID0gYE9SREVSIEJZIGQuJHtTcWxTdHJpbmcuZXNjYXBlSWQob3B0aW9ucy5zb3J0QnkpfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZXZlcnNlIHx8IG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZykge1xuICAgICAgICAgICAgLy8gSWYgcmV2ZXJzZS9zb3J0QnlEZXNjZW5kaW5nIGlzIHNwZWNpZmllZCB3aXRob3V0IHNvcnRCeSwgXG4gICAgICAgICAgICAvLyB1c2UgYSBkZWZhdWx0IG9yZGVyaW5nIChieSBtb2RpZmljYXRpb24gdGltZSlcbiAgICAgICAgICAgIG9yZGVyQnkgPSAnT1JERVIgQlkgZC5tdGltZU1zJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBzb3J0IGRpcmVjdGlvblxuICAgICAgICBpZiAob3JkZXJCeSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZyB8fCBvcHRpb25zLnJldmVyc2UpIHtcbiAgICAgICAgICAgICAgICBvcmRlckJ5ICs9ICcgREVTQyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9yZGVyQnkgKz0gJyBBU0MnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3FsICs9ICcgJyArIG9yZGVyQnk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgTElNSVQgYW5kIE9GRlNFVFxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubGltaXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBzcWwgKz0gYCBMSU1JVCAke2FkZFBhcmFtKG9wdGlvbnMubGltaXQpfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHNxbCArPSBgIE9GRlNFVCAke2FkZFBhcmFtKG9wdGlvbnMub2Zmc2V0KX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgc3FsLCBwYXJhbXMgfTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IHZhciBhc3NldHNDYWNoZTogQXNzZXRzQ2FjaGU7XG5leHBvcnQgdmFyIHBhcnRpYWxzQ2FjaGU6IFBhcnRpYWxzQ2FjaGU7XG5leHBvcnQgdmFyIGxheW91dHNDYWNoZTogTGF5b3V0c0NhY2hlO1xuZXhwb3J0IHZhciBkb2N1bWVudHNDYWNoZTogRG9jdW1lbnRzQ2FjaGU7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZGI6IEFzeW5jRGF0YWJhc2Vcbik6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgLy8gSW5pdGlhbGl6ZSB0YWcgYW5kIHRhZyBkZXNjcmlwdGlvbiBzdXBwb3J0ICh1c2VkIGJ5IERvY3VtZW50c0NhY2hlKVxuICAgIGF3YWl0IHRnbHVlLmluaXQoZGIpO1xuICAgIGF3YWl0IHRkZXNjLmluaXQoZGIpO1xuXG4gICAgLy8gSGVscGVyIHRvIHNldHVwIHZlcmJvc2UgZXZlbnQgbGlzdGVuZXJzIGlmIHZlcmJvc2UgbW9kZSBpcyBlbmFibGVkXG4gICAgY29uc3Qgc2V0dXBWZXJib3NlTGlzdGVuZXJzID0gKGNhY2hlOiBhbnksIGNhY2hlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmIChjb25maWcudmVyYm9zZSkge1xuICAgICAgICAgICAgY2FjaGUub24oJ2FkZGVkJywgKG5hbWU6IHN0cmluZywgdnBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQURERURdICR7bmFtZX06ICR7dnBhdGh9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FjaGUub24oJ3JlYWR5JywgKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbUkVBRFldICR7bmFtZX1cXG5gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjYWNoZS5vbignZXJyb3InLCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtFUlJPUl0gJHtjYWNoZU5hbWV9OmAsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQWx3YXlzIHNldHVwIGVycm9yIGxpc3RlbmVyLCBldmVuIGluIG5vbi12ZXJib3NlIG1vZGVcbiAgICAgICAgICAgIGNhY2hlLm9uKCdlcnJvcicsICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjYWNoZU5hbWV9IEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8vLyBBU1NFVFNcblxuICAgIGF3YWl0IGRvQ3JlYXRlQXNzZXRzVGFibGUoZGIpO1xuXG4gICAgYXNzZXRzQ2FjaGUgPSBuZXcgQXNzZXRzQ2FjaGUoXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2Fzc2V0cycsXG4gICAgICAgIGNvbmZpZy5hc3NldERpcnMsXG4gICAgICAgIGRiLFxuICAgICAgICAnQVNTRVRTJ1xuICAgICk7XG4gICAgXG4gICAgc2V0dXBWZXJib3NlTGlzdGVuZXJzKGFzc2V0c0NhY2hlLCAnYXNzZXRzQ2FjaGUnKTtcbiAgICBcbiAgICBhd2FpdCBhc3NldHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgLy8vLyBQQVJUSUFMU1xuXG4gICAgYXdhaXQgZG9DcmVhdGVQYXJ0aWFsc1RhYmxlKGRiKTtcblxuICAgIHBhcnRpYWxzQ2FjaGUgPSBuZXcgUGFydGlhbHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAncGFydGlhbHMnLFxuICAgICAgICBjb25maWcucGFydGlhbHNEaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ1BBUlRJQUxTJ1xuICAgICk7XG4gICAgXG4gICAgc2V0dXBWZXJib3NlTGlzdGVuZXJzKHBhcnRpYWxzQ2FjaGUsICdwYXJ0aWFsc0NhY2hlJyk7XG4gICAgXG4gICAgYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgLy8vLyBMQVlPVVRTXG5cbiAgICBhd2FpdCBkb0NyZWF0ZUxheW91dHNUYWJsZShkYik7XG5cbiAgICBsYXlvdXRzQ2FjaGUgPSBuZXcgTGF5b3V0c0NhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdsYXlvdXRzJyxcbiAgICAgICAgY29uZmlnLmxheW91dERpcnMsXG4gICAgICAgIGRiLFxuICAgICAgICAnTEFZT1VUUydcbiAgICApO1xuICAgIFxuICAgIHNldHVwVmVyYm9zZUxpc3RlbmVycyhsYXlvdXRzQ2FjaGUsICdsYXlvdXRzQ2FjaGUnKTtcbiAgICBcbiAgICBhd2FpdCBsYXlvdXRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIC8vLy8gRE9DVU1FTlRTXG5cbiAgICBhd2FpdCBkb0NyZWF0ZURvY3VtZW50c1RhYmxlKGRiKTtcbiAgICBhd2FpdCBkb0NyZWF0ZVZlY0RvY3VtZW50c1RhYmxlKGRiKTtcblxuICAgIGRvY3VtZW50c0NhY2hlID0gbmV3IERvY3VtZW50c0NhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdkb2N1bWVudHMnLFxuICAgICAgICBjb25maWcuZG9jdW1lbnREaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ0RPQ1VNRU5UUydcbiAgICApO1xuICAgIFxuICAgIHNldHVwVmVyYm9zZUxpc3RlbmVycyhkb2N1bWVudHNDYWNoZSwgJ2RvY3VtZW50c0NhY2hlJyk7XG4gICAgXG4gICAgYXdhaXQgZG9jdW1lbnRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIGF3YWl0IGNvbmZpZy5ob29rUGx1Z2luQ2FjaGVTZXR1cCgpO1xuXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZUZpbGVDYWNoZXMoKSB7XG4gICAgaWYgKGRvY3VtZW50c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGRvY3VtZW50c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoYXNzZXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgYXNzZXRzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgYXNzZXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChsYXlvdXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgbGF5b3V0c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGxheW91dHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHBhcnRpYWxzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgcGFydGlhbHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBwYXJ0aWFsc0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIFRoZSBmb3VyIGNhY2hlcyBzaGFyZSB0aGUgc2luZ2xlIHByb2Nlc3MtZ2xvYmFsIGBzcWRiYFxuICAgIC8vIGNvbm5lY3Rpb24uICBDbG9zZSBpdCBvbmNlIGhlcmUsIGFmdGVyIGFsbCBjYWNoZXMgaGF2ZVxuICAgIC8vIGRldGFjaGVkLiAgQ2xvc2luZyBhbiBhbHJlYWR5LWNsb3NlZCBjb25uZWN0aW9uIHRocm93c1xuICAgIC8vIChhbmQgdGhlIHdyYXBwZXIgbG9ncyBpdCksIHNvIG9ubHkgY2xvc2Ugd2hlbiBzdGlsbCBvcGVuLlxuICAgIC8vIFRoaXMgbWFrZXMgY2xvc2VGaWxlQ2FjaGVzKCkgaWRlbXBvdGVudCwgZS5nLiB3aGVuIGEgdGVzdFxuICAgIC8vIGNsb3NlcyB0aGUgY2FjaGVzIG1vcmUgdGhhbiBvbmNlLlxuICAgIGlmIChzcWRiLmlubmVyLmlzT3Blbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgc3FkYi5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIFRoZSBzaGFyZWQgY29ubmVjdGlvbiBtYXkgYWxyZWFkeSBiZSBjbG9zZWQuXG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=