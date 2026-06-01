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
import { lembedModelName } from '../sqdb.js';
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
        try {
            await __classPrivateFieldGet(this, _BaseCache_db, "f").close();
        }
        catch (err) {
            // console.warn(`${this.name} error on close ${err.message}`);
        }
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
     * Convert undefined values to null in parameter object
     * node:sqlite does not accept undefined values
     */
    nullifyUndefined(params) {
        const result = {};
        for (const [key, value] of Object.entries(params)) {
            result[key] = value === undefined ? null : value;
        }
        return result;
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
        // Keep mime as null if it's null or undefined - SQL NULL is valid
        if (info.mime === undefined) {
            info.mime = null;
        }
    }
    async insertDocToDB(info) {
        if (!__classPrivateFieldGet(this, _AssetsCache_insertDocAssets, "f")) {
            __classPrivateFieldSet(this, _AssetsCache_insertDocAssets, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-doc-assets.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _AssetsCache_insertDocAssets, "f"), {
            $vpath: info.vpath ?? '',
            $mime: info.mime ?? null,
            $mounted: info.mounted ?? '',
            $mountPoint: info.mountPoint ?? '',
            $pathInMounted: info.pathInMounted ?? '',
            $fspath: path.join(info.mounted ?? '', info.pathInMounted ?? ''),
            $dirname: path.dirname(info.vpath ?? ''),
            $mtimeMs: info.mtimeMs ?? 0,
            $info: JSON.stringify(info)
        });
    }
    async updateDocInDB(info) {
        if (!__classPrivateFieldGet(this, _AssetsCache_updateDocAssets, "f")) {
            __classPrivateFieldSet(this, _AssetsCache_updateDocAssets, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'update-doc-assets.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _AssetsCache_updateDocAssets, "f"), {
            $vpath: info.vpath ?? '',
            $mime: info.mime ?? null,
            $mounted: info.mounted ?? '',
            $mountPoint: info.mountPoint ?? '',
            $pathInMounted: info.pathInMounted ?? '',
            $fspath: path.join(info.mounted ?? '', info.pathInMounted ?? ''),
            $dirname: path.dirname(info.vpath ?? ''),
            $mtimeMs: info.mtimeMs ?? 0,
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
        // Keep mime as null if it's null or undefined - SQL NULL is valid
        if (info.mime === undefined) {
            info.mime = null;
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
            else {
                // Renderer exists but doesn't parse metadata
                info.docBody = '';
            }
        }
        else {
            // No renderer found
            info.docBody = '';
            info.rendererName = '';
        }
    }
    async insertDocToDB(info) {
        if (!__classPrivateFieldGet(this, _PartialsCache_insertDocPartials, "f")) {
            __classPrivateFieldSet(this, _PartialsCache_insertDocPartials, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-doc-partials.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _PartialsCache_insertDocPartials, "f"), {
            $vpath: info.vpath ?? '',
            $mime: info.mime ?? null,
            $mounted: info.mounted ?? '',
            $mountPoint: info.mountPoint ?? '',
            $pathInMounted: info.pathInMounted ?? '',
            $fspath: path.join(info.mounted ?? '', info.pathInMounted ?? ''),
            $dirname: path.dirname(info.vpath ?? ''),
            $mtimeMs: info.mtimeMs ?? 0,
            $info: JSON.stringify(info),
            $docBody: info.docBody ?? '',
            $rendererName: info.rendererName ?? ''
        });
    }
    async updateDocInDB(info) {
        if (!__classPrivateFieldGet(this, _PartialsCache_updateDocPartials, "f")) {
            __classPrivateFieldSet(this, _PartialsCache_updateDocPartials, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'update-doc-partials.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _PartialsCache_updateDocPartials, "f"), {
            $vpath: info.vpath ?? '',
            $mime: info.mime ?? null,
            $mounted: info.mounted ?? '',
            $mountPoint: info.mountPoint ?? '',
            $pathInMounted: info.pathInMounted ?? '',
            $fspath: path.join(info.mounted ?? '', info.pathInMounted ?? ''),
            $dirname: path.dirname(info.vpath ?? ''),
            $mtimeMs: info.mtimeMs ?? 0,
            $info: JSON.stringify(info),
            $docBody: info.docBody ?? '',
            $rendererName: info.rendererName ?? ''
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
        // Keep mime as null if it's null or undefined - SQL NULL is valid
        if (info.mime === undefined) {
            info.mime = null;
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
            else {
                // Renderer exists but doesn't parse metadata
                info.docBody = '';
            }
        }
        else {
            // No renderer found
            info.rendersToHTML = false;
            info.docBody = '';
            info.rendererName = '';
        }
    }
    async insertDocToDB(info) {
        if (!__classPrivateFieldGet(this, _LayoutsCache_insertDocLayouts, "f")) {
            __classPrivateFieldSet(this, _LayoutsCache_insertDocLayouts, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'insert-doc-layouts.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _LayoutsCache_insertDocLayouts, "f"), {
            $vpath: info.vpath ?? '',
            $mime: info.mime ?? null,
            $mounted: info.mounted ?? '',
            $mountPoint: info.mountPoint ?? '',
            $pathInMounted: info.pathInMounted ?? '',
            $fspath: path.join(info.mounted ?? '', info.pathInMounted ?? ''),
            $dirname: path.dirname(info.vpath ?? ''),
            $mtimeMs: info.mtimeMs ?? 0,
            $info: JSON.stringify(info),
            $rendersToHTML: (info.rendersToHTML ?? false) ? 1 : 0, // Convert boolean to 0/1
            $docBody: info.docBody ?? '',
            $rendererName: info.rendererName ?? ''
        });
    }
    async updateDocInDB(info) {
        if (!__classPrivateFieldGet(this, _LayoutsCache_updateDocLayouts, "f")) {
            __classPrivateFieldSet(this, _LayoutsCache_updateDocLayouts, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'update-doc-layouts.sql'), 'utf-8'), "f");
        }
        await this.db.run(__classPrivateFieldGet(this, _LayoutsCache_updateDocLayouts, "f"), {
            $vpath: info.vpath ?? '',
            $mime: info.mime ?? null,
            $mounted: info.mounted ?? '',
            $mountPoint: info.mountPoint ?? '',
            $pathInMounted: info.pathInMounted ?? '',
            $fspath: path.join(info.mounted ?? '', info.pathInMounted ?? ''),
            $dirname: path.dirname(info.vpath ?? ''),
            $mtimeMs: info.mtimeMs ?? 0,
            $info: JSON.stringify(info),
            $rendersToHTML: (info.rendersToHTML ?? false) ? 1 : 0, // Convert boolean to 0/1
            $docBody: info.docBody ?? '',
            $rendererName: info.rendererName ?? ''
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
        // Keep mime as null if it's null or undefined - SQL NULL is valid
        if (info.mime === undefined) {
            info.mime = null;
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
            info.renderPath = info.vpath; // No renderer, use vpath as renderPath
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
        await this.db.run(__classPrivateFieldGet(this, _DocumentsCache_insertDocDocuments, "f"), {
            $vpath: info.vpath ?? '',
            $mime: info.mime ?? null,
            $mounted: info.mounted ?? '',
            $mountPoint: info.mountPoint ?? '',
            $pathInMounted: info.pathInMounted ?? '',
            $fspath: path.join(info.mounted ?? '', info.pathInMounted ?? ''),
            $dirname: path.dirname(info.vpath ?? ''),
            $mtimeMs: info.mtimeMs ?? 0,
            $info: JSON.stringify(info),
            $renderPath: info.renderPath ?? info.vpath ?? '',
            $rendersToHTML: (info.rendersToHTML ?? false) ? 1 : 0, // Convert boolean to 0/1
            $parentDir: info.parentDir ?? '',
            $docMetadata: JSON.stringify(info.docMetadata ?? {}),
            $docContent: info.docContent ?? '',
            $docBody: info.docBody ?? '',
            $rendererName: info.rendererName ?? ''
        });
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
                $vpath: info.vpath ?? '',
                $lembedModel: lembedModelName ?? '',
                // $titleEmbed: info.title,
                $bodyEmbed: info.docBody ?? ''
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
            $vpath: info.vpath ?? '',
            $mime: info.mime ?? null,
            $mounted: info.mounted ?? '',
            $mountPoint: info.mountPoint ?? '',
            $pathInMounted: info.pathInMounted ?? '',
            $fspath: path.join(info.mounted ?? '', info.pathInMounted ?? ''),
            $dirname: path.dirname(info.vpath ?? ''),
            $mtimeMs: info.mtimeMs ?? 0,
            $info: JSON.stringify(info),
            $renderPath: info.renderPath ?? info.vpath ?? '',
            $rendersToHTML: (info.rendersToHTML ?? false) ? 1 : 0, // Convert boolean to 0/1
            $parentDir: info.parentDir ?? '',
            $docMetadata: JSON.stringify(info.docMetadata ?? {}),
            $docContent: info.docContent ?? '',
            $docBody: info.docBody ?? '',
            $rendererName: info.rendererName ?? ''
        });
        // This handles computing embeddings
        // for the title and body
        if (typeof lembedModelName === 'string'
            // && typeof info.title === 'string'
            && typeof info.docBody === 'string') {
            await this.db.run(__classPrivateFieldGet(this, _DocumentsCache_updateLembedDocuments, "f"), {
                $vpath: info.vpath ?? '',
                $lembedModel: lembedModelName ?? '',
                // $titleEmbed: info.title,
                $bodyEmbed: info.docBody ?? ''
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUtc3FsaXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NhY2hlL2NhY2hlLXNxbGl0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7Ozs7Ozs7Ozs7Ozs7QUFFSCxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDOUMsT0FBTyxFQUNILE9BQU8sRUFDVixNQUFNLGNBQWMsQ0FBQztBQUl0QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sWUFBWSxNQUFNLFFBQVEsQ0FBQztBQUNsQyxPQUFPLFVBQVUsTUFBTSxZQUFZLENBQUM7QUFDcEMsT0FBTyxFQUNILE9BQU8sRUFBRSxlQUFlLEVBQzNCLE1BQU0sZUFBZSxDQUFDO0FBS3ZCLE9BQU8sRUFLSCxtQkFBbUIsRUFDbkIsc0JBQXNCLEVBQ3RCLG9CQUFvQixFQUNwQixxQkFBcUIsRUFDckIseUJBQXlCLEVBQ1IsYUFBYSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsdUJBQXVCLEVBQzdHLE1BQU0sYUFBYSxDQUFDO0FBSXJCLE9BQU8sU0FBUyxNQUFNLGtCQUFrQixDQUFDO0FBUXpDLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRTdDLE1BQU0sS0FBSyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDNUIsd0JBQXdCO0FBRXhCLE1BQU0sS0FBSyxHQUFHLElBQUksZUFBZSxFQUFFLENBQUM7QUFDcEMsd0JBQXdCO0FBRXhCOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsTUFBTSxPQUFPLFNBRVgsU0FBUSxZQUFZO0lBV2xCOzs7OztPQUtHO0lBQ0gsWUFDSSxNQUFxQixFQUNyQixJQUFZLEVBQ1os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SUFDN0IsQ0FBQztJQUNELElBQUksYUFBYSxFQUFFLENBQUM7UUFDaEIsTUFBTSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDNUIsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUM5QixDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgRlMsIHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQge1xuICAgIFZGU3RhY2ssIFZQYXRoRGF0YSwgZGlyVG9Nb3VudFxufSBmcm9tICcuL3Zmc3RhY2suanMnO1xuaW1wb3J0IHtcbiAgICBDb25maWd1cmF0aW9uLCBpbmRleENoYWluSXRlbVxufSBmcm9tICcuLi9pbmRleC5qcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCBtaWNyb21hdGNoIGZyb20gJ21pY3JvbWF0Y2gnO1xuaW1wb3J0IHtcbiAgICBUYWdHbHVlLCBUYWdEZXNjcmlwdGlvbnNcbn0gZnJvbSAnLi90YWctZ2x1ZS5qcyc7XG5pbXBvcnQgdHlwZSB7XG4gICAgU2ltaWxhclRhZ0dyb3VwLFxuICAgIFRhZ1dpdGhvdXREZXNjcmlwdGlvblxufSBmcm9tICcuLi90eXBlcy5qcyc7XG5pbXBvcnQge1xuICAgIGNyZWF0ZUFzc2V0c1RhYmxlLFxuICAgIGNyZWF0ZURvY3VtZW50c1RhYmxlLFxuICAgIGNyZWF0ZUxheW91dHNUYWJsZSxcbiAgICBjcmVhdGVQYXJ0aWFsc1RhYmxlLFxuICAgIGRvQ3JlYXRlQXNzZXRzVGFibGUsXG4gICAgZG9DcmVhdGVEb2N1bWVudHNUYWJsZSxcbiAgICBkb0NyZWF0ZUxheW91dHNUYWJsZSxcbiAgICBkb0NyZWF0ZVBhcnRpYWxzVGFibGUsXG4gICAgZG9DcmVhdGVWZWNEb2N1bWVudHNUYWJsZSxcbiAgICBQYXRoc1JldHVyblR5cGUsIHZhbGlkYXRlQXNzZXQsIHZhbGlkYXRlRG9jdW1lbnQsIHZhbGlkYXRlTGF5b3V0LCB2YWxpZGF0ZVBhcnRpYWwsIHZhbGlkYXRlUGF0aHNSZXR1cm5UeXBlXG59IGZyb20gJy4vc2NoZW1hLmpzJztcblxuaW1wb3J0IHsgRGF0YWJhc2VTeW5jIH0gZnJvbSAnbm9kZTpzcWxpdGUnO1xuaW1wb3J0IHsgQXN5bmNEYXRhYmFzZSB9IGZyb20gJy4uL2FzeW5jLW5vZGUtc3FsaXRlLmpzJztcbmltcG9ydCBTcWxTdHJpbmcgZnJvbSAnc3Fsc3RyaW5nLXNxbGl0ZSc7XG5pbXBvcnQge1xuICAgIEJhc2VDYWNoZUVudHJ5LFxuICAgIEFzc2V0LFxuICAgIFBhcnRpYWwsXG4gICAgTGF5b3V0LFxuICAgIERvY3VtZW50XG59IGZyb20gJy4vc2NoZW1hLmpzJztcbmltcG9ydCBDYWNoZSBmcm9tICdjYWNoZSc7XG5pbXBvcnQgeyBsZW1iZWRNb2RlbE5hbWUgfSBmcm9tICcuLi9zcWRiLmpzJztcblxuY29uc3QgdGdsdWUgPSBuZXcgVGFnR2x1ZSgpO1xuLy8gdGdsdWUuaW5pdChzcWRiLl9kYik7XG5cbmNvbnN0IHRkZXNjID0gbmV3IFRhZ0Rlc2NyaXB0aW9ucygpO1xuLy8gdGRlc2MuaW5pdChzcWRiLl9kYik7XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgZmlsZSBjYWNoZXMgKGRvY3VtZW50cywgYXNzZXRzLCBsYXlvdXRzLCBwYXJ0aWFscykuXG4gKiBTY2FucyBkaXJlY3Rvcmllcywgc3RvcmVzIGZpbGUgaW5mb3JtYXRpb24gaW4gU1FMaXRlIGRhdGFiYXNlLCBhbmQgZW1pdHMgZXZlbnRzLlxuICogXG4gKiBFdmVudHMgZW1pdHRlZDpcbiAqIC0gJ2FkZGVkJyAobmFtZTogc3RyaW5nLCB2cGF0aDogc3RyaW5nKSAtIEVtaXR0ZWQgd2hlbiBhIGZpbGUgaXMgc3VjY2Vzc2Z1bGx5IFxuICogICBhZGRlZCB0byB0aGUgY2FjaGUgZHVyaW5nIGluaXRpYWwgc2NhbiBvciB1cGRhdGUuIFVzZWZ1bCBmb3IgdHJhY2tpbmcgdGhhdCBcbiAqICAgYWxsIGZpbGVzIGFyZSBwcm9jZXNzZWQgYmVmb3JlICdyZWFkeScgaXMgZW1pdHRlZC5cbiAqIC0gJ3JlYWR5JyAobmFtZTogc3RyaW5nKSAtIEVtaXR0ZWQgd2hlbiBpbml0aWFsIGRpcmVjdG9yeSBzY2FuIGFuZCBmaWxlIFxuICogICBwcm9jZXNzaW5nIGlzIGNvbXBsZXRlLiBBZnRlciB0aGlzIGV2ZW50LCBpc1JlYWR5KCkgd2lsbCByZXR1cm4gaW1tZWRpYXRlbHkuXG4gKiAtICdlcnJvcicgKGVycm9yOiBFcnJvcikgLSBFbWl0dGVkIHdoZW4gYW4gZXJyb3Igb2NjdXJzIGR1cmluZyBwcm9jZXNzaW5nLlxuICovXG5leHBvcnQgY2xhc3MgQmFzZUNhY2hlPFxuICAgIFQgZXh0ZW5kcyBCYXNlQ2FjaGVFbnRyeVxuPiBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cbiAgICAjY29uZmlnPzogQ29uZmlndXJhdGlvbjtcbiAgICAjbmFtZT86IHN0cmluZztcbiAgICAjZGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjaXNfcmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgICNkYjogQXN5bmNEYXRhYmFzZTtcbiAgICAjZGJuYW1lOiBzdHJpbmc7XG5cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAgICogQHBhcmFtIG5hbWUgc3RyaW5nIGdpdmluZyB0aGUgbmFtZSBmb3IgdGhpcyBjYWNoZVxuICAgICAqIEBwYXJhbSBkYiBUaGUgUFJPTUlTRUQgU1FMSVRFMyBBc3luY0RhdGFiYXNlIGluc3RhbmNlIHRvIHVzZVxuICAgICAqIEBwYXJhbSBkYm5hbWUgVGhlIGRhdGFiYXNlIG5hbWUgdG8gdXNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb01vdW50W10sXG4gICAgICAgIGRiOiBBc3luY0RhdGFiYXNlLFxuICAgICAgICBkYm5hbWU6IHN0cmluZ1xuICAgICkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQmFzZUZpbGVDYWNoZSAke25hbWV9IGNvbnN0cnVjdG9yIGRpcnM9JHt1dGlsLmluc3BlY3QoZGlycyl9YCk7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy4jbmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuI2RpcnMgPSBkaXJzO1xuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNkYiA9IGRiO1xuICAgICAgICBpZiAoZGJuYW1lICE9PSAnQVNTRVRTJ1xuICAgICAgICAgJiYgZGJuYW1lICE9PSAnTEFZT1VUUydcbiAgICAgICAgICYmIGRibmFtZSAhPT0gJ1BBUlRJQUxTJ1xuICAgICAgICAgJiYgZGJuYW1lICE9PSAnRE9DVU1FTlRTJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSWxsZWdhbCBkYXRhYmFzZSBuYW1lLCBtdXN0IGJlIEFTU0VUUywgTEFZT1VUUywgUEFSVElBTFMsIG9yIERPQ1VNRU5UU2ApXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jZGJuYW1lID0gZGJuYW1lO1xuICAgIH1cblxuICAgIGdldCBjb25maWcoKSAgICAgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgZ2V0IG5hbWUoKSAgICAgICB7IHJldHVybiB0aGlzLiNuYW1lOyB9XG4gICAgZ2V0IGRpcnMoKSAgICAgICB7IHJldHVybiB0aGlzLiNkaXJzOyB9XG4gICAgZ2V0IGRiKCkgICAgICAgICB7IHJldHVybiB0aGlzLiNkYjsgfVxuICAgIGdldCBkYm5hbWUoKSAgICAgeyByZXR1cm4gdGhpcy4jZGJuYW1lOyB9XG4gICAgZ2V0IHF1b3RlZERCTmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIFNxbFN0cmluZy5lc2NhcGUodGhpcy4jZGJuYW1lKTtcbiAgICB9XG5cbiAgICAjdmZzdGFjazogVkZTdGFjaztcblxuICAgIGFzeW5jIGNsb3NlKCkge1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygnY2hhbmdlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygnYWRkZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3VubGlua2VkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZWFkeScpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiNkYi5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybihgJHt0aGlzLm5hbWV9IGVycm9yIG9uIGNsb3NlICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTY2FuIHRoZSBkaXJlY3Rvcnkgc3RhY2sgYW5kIHBvcHVsYXRlIHRoZSBkYXRhYmFzZS5cbiAgICAgKi9cbiAgICBhc3luYyBzZXR1cCgpIHtcbiAgICAgICAgdGhpcy4jaXNfcmVhZHkgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLiN2ZnN0YWNrID0gbmV3IFZGU3RhY2sodGhpcy5uYW1lLCB0aGlzLmRpcnMpO1xuICAgICAgICBhd2FpdCB0aGlzLiN2ZnN0YWNrLnNjYW4oKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHZwYXRoRGF0YSBvZiB0aGlzLiN2ZnN0YWNrKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZSh2cGF0aERhdGEpKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YSh2cGF0aERhdGEgYXMgYW55IGFzIFQpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmluc2VydERvY1RvREIodnBhdGhEYXRhIGFzIGFueSBhcyBUKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVBZGRlZCh0aGlzLm5hbWUsIHZwYXRoRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVtaXQgJ2FkZGVkJyBldmVudCB0byB0cmFjayB3aGVuIGZpbGVzIGFyZSBwcm9jZXNzZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBoZWxwcyB2ZXJpZnkgdGhhdCBhbGwgZmlsZXMgYXJlIGFkZGVkIGJlZm9yZSAncmVhZHknIGlzIGVtaXR0ZWRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdhZGRlZCcsIHRoaXMubmFtZSwgdnBhdGhEYXRhLnZwYXRoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgZ2F0aGVyaW5nIGluZm8gZm9yICR7dnBhdGhEYXRhLnZwYXRofTogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdCgncmVhZHknLCB0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIGFuIGl0ZW0sIHdoaWNoIGlzIGV4cGVjdGVkIHRvIGJlXG4gICAgICogYSByb3cgZnJvbSBkYXRhYmFzZSBxdWVyeSByZXN1bHRzLCB1c2luZ1xuICAgICAqIG9uZSBvZiB0aGUgdmFsaWRhdG9yIGZ1bmN0aW9ucyBpbiBzY2hlbWEudHMuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIG11c3QgYmUgc3ViY2xhc3NlZCB0b1xuICAgICAqIGZ1bmN0aW9uIGNvcnJlY3RseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb3cgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93KHJvdzogYW55KTogVCB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdmFsaWRhdGVSb3cgbXVzdCBiZSBzdWJjbGFzc2VkYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGUgYW4gYXJyYXksIHdoaWNoIGlzIGV4cGVjdGVkIHRvIGJlXG4gICAgICogZGF0YWJhc2UgcXVlcnkgcmVzdWx0cywgdXNpbmcgb25lIG9mIHRoZVxuICAgICAqIHZhbGlkYXRvciBmdW5jdGlvbnMgaW4gc2NoZW1hLnRzLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBtdXN0IGJlIHN1YmNsYXNzZWQgdG9cbiAgICAgKiBmdW5jdGlvbiBjb3JyZWN0bHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm93IFxuICAgICAqL1xuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvd3Mocm93czogYW55W10pOiBUW10ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHZhbGlkYXRlUm93cyBtdXN0IGJlIHN1YmNsYXNzZWRgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGZpZWxkcyBmcm9tIHRoZSBkYXRhYmFzZVxuICAgICAqIHJlcHJlc2VudGF0aW9uIHRvIHRoZSBmb3JtIHJlcXVpcmVkXG4gICAgICogZm9yIGV4ZWN1dGlvbi5cbiAgICAgKiBcbiAgICAgKiBUaGUgZGF0YWJhc2UgY2Fubm90IHN0b3JlcyBKU09OIGZpZWxkc1xuICAgICAqIGFzIGFuIG9iamVjdCBzdHJ1Y3R1cmUsIGJ1dCBhcyBhIHNlcmlhbGllZFxuICAgICAqIEpTT04gc3RyaW5nLiAgSW5zaWRlIEFrYXNoYUNNUyBjb2RlIHRoYXRcbiAgICAgKiBvYmplY3QgbXVzdCBiZSBhbiBvYmplY3QgcmF0aGVyIHRoYW5cbiAgICAgKiBhIHN0cmluZy5cbiAgICAgKiBcbiAgICAgKiBUaGUgb2JqZWN0IHBhc3NlZCBhcyBcInJvd1wiIHNob3VsZCBhbHJlYWR5XG4gICAgICogaGF2ZSBiZWVuIHZhbGlkYXRlZCB1c2luZyB2YWxpZGF0ZVJvdy5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gcm93IFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IFQge1xuICAgICAgICBpZiAodHlwZW9mIHJvdy5pbmZvID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmluZm8gPSBKU09OLnBhcnNlKHJvdy5pbmZvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPFQ+cm93O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBzcWxGb3JtYXQoZm5hbWUsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBzcWwgPSBTcWxTdHJpbmcuZm9ybWF0KFxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShmbmFtZSksIHBhcmFtc1xuICAgICAgICApO1xuICAgICAgICByZXR1cm4gc3FsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgdW5kZWZpbmVkIHZhbHVlcyB0byBudWxsIGluIHBhcmFtZXRlciBvYmplY3RcbiAgICAgKiBub2RlOnNxbGl0ZSBkb2VzIG5vdCBhY2NlcHQgdW5kZWZpbmVkIHZhbHVlc1xuICAgICAqL1xuICAgIHByb3RlY3RlZCBudWxsaWZ5VW5kZWZpbmVkKHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55Pik6IFJlY29yZDxzdHJpbmcsIGFueT4ge1xuICAgICAgICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocGFyYW1zKSkge1xuICAgICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGZpbmRQYXRoTW91bnRlZFNRTFxuICAgICAgICAgICAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG4gICAgLyoqXG4gICAgICogRmluZCBhbiBpbmZvIG9iamVjdCBiYXNlZCBvbiB2cGF0aCBhbmQgbW91bnRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcGFyYW0gbW91bnRlZCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZmluZFBhdGhNb3VudGVkKFxuICAgICAgICB2cGF0aDogc3RyaW5nLCBtb3VudGVkOiBzdHJpbmdcbiAgICApOiBQcm9taXNlPEFycmF5PHtcbiAgICAgICAgdnBhdGg6IHN0cmluZyxcbiAgICAgICAgbW91bnRlZDogc3RyaW5nXG4gICAgfT4+ICB7XG4gICAgICAgIFxuICAgICAgICBsZXQgc3FsID0gdGhpcy5maW5kUGF0aE1vdW50ZWRTUUwuZ2V0KHRoaXMuZGJuYW1lKTtcbiAgICAgICAgaWYgKCFzcWwpIHtcbiAgICAgICAgICAgIHNxbCA9IGF3YWl0IHRoaXMuc3FsRm9ybWF0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2ZpbmQtcGF0aC1tb3VudGVkLnNxbCcpLFxuICAgICAgICAgICAgICAgIFsgdGhpcy5kYm5hbWUgXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuZmluZFBhdGhNb3VudGVkU1FMLnNldCh0aGlzLmRibmFtZSwgc3FsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmb3VuZCA9IDxhbnlbXT5hd2FpdCB0aGlzLmRiLmFsbChzcWwsIHtcbiAgICAgICAgICAgICR2cGF0aDogdnBhdGgsXG4gICAgICAgICAgICAkbW91bnRlZDogbW91bnRlZFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgbWFwcGVkID0gbmV3IEFycmF5PHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBtb3VudGVkOiBzdHJpbmdcbiAgICAgICAgfT4oKTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGZvdW5kKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0udnBhdGggPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgJiYgdHlwZW9mIGl0ZW0ubW91bnRlZCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIG1hcHBlZC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsIG1vdW50ZWQ6IGl0ZW0ubW91bnRlZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmRQYXRoTW91bnRlZDogSW52YWxpZCBvYmplY3QgIGZvdW5kIGluIHF1ZXJ5ICgke3ZwYXRofSwgJHttb3VudGVkfSkgcmVzdWx0cyAke3V0aWwuaW5zcGVjdChpdGVtKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFwcGVkO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBmaW5kQnlQYXRoQ2FjaGU7XG4gICAgcHJvdGVjdGVkIGZpbmRCeVBhdGhTUUwgPSBuZXcgTWFwPFxuICAgICAgICBzdHJpbmcsIHN0cmluZ1xuICAgID4oKTtcblxuICAgIC8qKlxuICAgICAqIEZpbmQgYW4gaW5mbyBvYmplY3QgYnkgdGhlIHZwYXRoLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBmaW5kQnlQYXRoKHZwYXRoOiBzdHJpbmcpIHtcblxuICAgICAgICBjb25zdCBkb0NhY2hpbmdcbiAgICAgICAgICAgID0gdGhpcy5jb25maWcuY2FjaGluZ1RpbWVvdXQgPiAwO1xuICAgICAgICBsZXQgY2FjaGVLZXk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmZpbmRCeVBhdGhDYWNoZSkge1xuICAgICAgICAgICAgdGhpcy5maW5kQnlQYXRoQ2FjaGVcbiAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgY2FjaGVkXG4gICAgICAgICAgICAgICAgPSB0aGlzLmZpbmRCeVBhdGhDYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgICAgICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZEJ5UGF0aCAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9ICR7dnBhdGh9YCk7XG5cbiAgICAgICAgbGV0IHNxbCA9IHRoaXMuZmluZEJ5UGF0aFNRTC5nZXQodGhpcy5kYm5hbWUpO1xuICAgICAgICBpZiAoIXNxbCkge1xuICAgICAgICAgICAgc3FsID0gYXdhaXQgdGhpcy5zcWxGb3JtYXQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICdzcWwnLCAnZmluZC1ieS1jYWNoZS5zcWwnKSxcbiAgICAgICAgICAgICAgICBbIHRoaXMuZGJuYW1lIF1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmZpbmRCeVBhdGhTUUwuc2V0KHRoaXMuZGJuYW1lLCBzcWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGZvdW5kO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZm91bmQgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoc3FsLCB7XG4gICAgICAgICAgICAgICAgJHZwYXRoOiB2cGF0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGRiLmFsbCAke3NxbH1gLCBlcnIuc3RhY2spO1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gdGhpcy52YWxpZGF0ZVJvd3MoZm91bmQpO1xuXG4gICAgICAgIGNvbnN0IHJldCA9IG1hcHBlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nICYmIGNhY2hlS2V5KSB7XG4gICAgICAgICAgICB0aGlzLmZpbmRCeVBhdGhDYWNoZS5wdXQoXG4gICAgICAgICAgICAgICAgY2FjaGVLZXksIHJldFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbzogVCkge1xuICAgICAgICAvLyBQbGFjZWhvbGRlciB3aGljaCBzb21lIHN1YmNsYXNzZXNcbiAgICAgICAgLy8gYXJlIGV4cGVjdGVkIHRvIG92ZXJyaWRlXG5cbiAgICAgICAgLy8gaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBnYXRoZXJJbmZvRGF0YSBtdXN0IGJlIG92ZXJyaWRkZW5gKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihpbmZvOiBUKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW5zZXJ0RG9jVG9EQiBtdXN0IGJlIG92ZXJyaWRkZW5gKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvOiBUKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdXBkYXRlRG9jSW5EQiBtdXN0IGJlIG92ZXJyaWRkZW5gKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGxvdyBhIGNhbGxlciB0byB3YWl0IHVudGlsIHRoZSA8ZW0+cmVhZHk8L2VtPiBldmVudCBoYXNcbiAgICAgKiBiZWVuIHNlbnQgZnJvbSB0aGUgRGlyc1dhdGNoZXIgaW5zdGFuY2UuICBUaGlzIGV2ZW50IG1lYW5zIHRoZVxuICAgICAqIGluaXRpYWwgaW5kZXhpbmcgaGFzIGhhcHBlbmVkLlxuICAgICAqL1xuICAgIGFzeW5jIGlzUmVhZHkoKSB7XG4gICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZGlyZWN0b3JpZXMsIHRoZXJlIHdvbid0IGJlIGFueSBmaWxlcyBcbiAgICAgICAgLy8gdG8gbG9hZCwgYW5kIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICB3aGlsZSAodGhpcy4jZGlycy5sZW5ndGggPiAwICYmICF0aGlzLiNpc19yZWFkeSkge1xuICAgICAgICAgICAgLy8gVGhpcyBkb2VzIGEgMTAwbXMgcGF1c2VcbiAgICAgICAgICAgIC8vIFRoYXQgbGV0cyB1cyBjaGVjayBpc19yZWFkeSBldmVyeSAxMDBtc1xuICAgICAgICAgICAgLy8gYXQgdmVyeSBsaXR0bGUgY29zdFxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCFpc1JlYWR5ICR7dGhpcy5uYW1lfSAke3RoaXNbX3N5bWJfZGlyc10ubGVuZ3RofSAke3RoaXNbX3N5bWJfaXNfcmVhZHldfWApO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGRpcmVjdG9yeSBtb3VudCBjb3JyZXNwb25kaW5nIHRvIHRoZSBmaWxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBpbmZvXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBmaWxlRGlyTW91bnQoaW5mbykge1xuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLiNkaXJzKSB7XG4gICAgICAgICAgICBpZiAoaW5mby5tb3VudFBvaW50ID09PSBkaXIuZGVzdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaG91bGQgdGhpcyBmaWxlIGJlIGlnbm9yZWQsIGJhc2VkIG9uIHRoZSBgaWdub3JlYCBmaWVsZFxuICAgICAqIGluIHRoZSBtYXRjaGluZyBgZGlyYCBtb3VudCBlbnRyeS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgaWdub3JlRmlsZShpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgY29uc3QgZGlyTW91bnQgPSB0aGlzLmZpbGVEaXJNb3VudChpbmZvKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgJHtpbmZvLnZwYXRofSBkaXJNb3VudCAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIGxldCBpZ25vcmUgPSBmYWxzZTtcbiAgICAgICAgaWYgKGRpck1vdW50KSB7XG5cbiAgICAgICAgICAgIGxldCBpZ25vcmVzO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXJNb3VudC5pZ25vcmUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IFsgZGlyTW91bnQuaWdub3JlIF07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGlyTW91bnQuaWdub3JlKSkge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBkaXJNb3VudC5pZ25vcmU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpZ25vcmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1pY3JvbWF0Y2guaXNNYXRjaChpbmZvLnZwYXRoLCBpKSkgaWdub3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZGlyTW91bnQuaWdub3JlICR7ZnNwYXRofSAke2l9ID0+ICR7aWdub3JlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgKGlnbm9yZSkgY29uc29sZS5sb2coYE1VU1QgaWdub3JlIEZpbGUgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgZm9yICR7aW5mby52cGF0aH0gPT0+ICR7aWdub3JlfWApO1xuICAgICAgICAgICAgcmV0dXJuIGlnbm9yZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vIG1vdW50PyAgdGhhdCBtZWFucyBzb21ldGhpbmcgc3RyYW5nZVxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgTm8gZGlyTW91bnQgZm91bmQgZm9yICR7aW5mby52cGF0aH0gLyAke2luZm8uZGlyTW91bnRlZE9ufWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcGF0aHNDYWNoZTtcbiAgICBwcm90ZWN0ZWQgcGF0aHNTUUwgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHNpbXBsZSBpbmZvcm1hdGlvbiBhYm91dCBlYWNoXG4gICAgICogcGF0aCBpbiB0aGUgY29sbGVjdGlvbi4gIFRoZSByZXR1cm5cbiAgICAgKiB0eXBlIGlzIGFuIGFycmF5IG9mIFBhdGhzUmV0dXJuVHlwZS5cbiAgICAgKiBcbiAgICAgKiBJIGZvdW5kIHR3byB1c2VzIGZvciB0aGlzIGZ1bmN0aW9uLlxuICAgICAqIEluIGNvcHlBc3NldHMsIHRoZSB2cGF0aCBhbmQgb3RoZXJcbiAgICAgKiBzaW1wbGUgZGF0YSBpcyB1c2VkIGZvciBjb3B5aW5nIGl0ZW1zXG4gICAgICogdG8gdGhlIG91dHB1dCBkaXJlY3RvcnkuXG4gICAgICogSW4gcmVuZGVyLnRzLCB0aGUgc2ltcGxlIGZpZWxkcyBhcmVcbiAgICAgKiB1c2VkIHRvIHRoZW4gY2FsbCBmaW5kIHRvIHJldHJpZXZlXG4gICAgICogdGhlIGZ1bGwgaW5mb3JtYXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm9vdFBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcGF0aHMocm9vdFBhdGg/OiBzdHJpbmcpXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxQYXRoc1JldHVyblR5cGU+PlxuICAgIHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBsZXQgcm9vdFAgPSByb290UGF0aD8uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IHJvb3RQYXRoPy5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogcm9vdFBhdGg7XG5cbiAgICAgICAgY29uc3QgZG9DYWNoaW5nXG4gICAgICAgICAgICA9IHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0ID4gMDtcbiAgICAgICAgbGV0IGNhY2hlS2V5O1xuXG4gICAgICAgIGlmIChkb0NhY2hpbmcpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5wYXRoc0NhY2hlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoc0NhY2hlXG4gICAgICAgICAgICAgICAgICAgID0gbmV3IENhY2hlKHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FjaGVLZXkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgZGJuYW1lOiB0aGlzLnF1b3RlZERCTmFtZSxcbiAgICAgICAgICAgICAgICByb290UCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBjYWNoZWRcbiAgICAgICAgICAgICAgICA9IHRoaXMucGF0aHNDYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgICAgICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3FsUm9vdFAgPSB0aGlzLnBhdGhzU1FMLmdldChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBkYm5hbWU6IHRoaXMuZGJuYW1lLCByb290UDogdHJ1ZVxuICAgICAgICB9KSk7XG4gICAgICAgIGlmICghc3FsUm9vdFApIHtcbiAgICAgICAgICAgIHNxbFJvb3RQID0gYXdhaXQgdGhpcy5zcWxGb3JtYXQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICdzcWwnLCAncGF0aHMtcm9vdHAuc3FsJyksXG4gICAgICAgICAgICAgICAgWyB0aGlzLmRibmFtZSBdXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5wYXRoc1NRTC5zZXQodGhpcy5kYm5hbWUsIHNxbFJvb3RQKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc3FsTm9Sb290ID0gdGhpcy5wYXRoc1NRTC5nZXQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgZGJuYW1lOiB0aGlzLmRibmFtZSwgcm9vdFA6IGZhbHNlXG4gICAgICAgIH0pKTtcbiAgICAgICAgaWYgKCFzcWxOb1Jvb3QpIHtcbiAgICAgICAgICAgIHNxbE5vUm9vdCA9IGF3YWl0IHRoaXMuc3FsRm9ybWF0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3BhdGhzLW5vLXJvb3Quc3FsJyksXG4gICAgICAgICAgICAgICAgWyB0aGlzLmRibmFtZSBdXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5wYXRoc1NRTC5zZXQodGhpcy5kYm5hbWUsIHNxbE5vUm9vdCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGlzIGNvcGllZCBmcm9tIHRoZSBvbGRlciB2ZXJzaW9uXG4gICAgICAgIC8vIChMb2tpSlMgdmVyc2lvbikgb2YgdGhpcyBmdW5jdGlvbi4gIEl0XG4gICAgICAgIC8vIHNlZW1zIG1lYW50IHRvIGVsaW1pbmF0ZSBkdXBsaWNhdGVzLlxuICAgICAgICBjb25zdCB2cGF0aHNTZWVuID0gbmV3IFNldCgpO1xuXG4gICAgICAgIC8vIFNlbGVjdCB0aGUgZmllbGRzIGluIFBhdGhzUmV0dXJuVHlwZVxuICAgICAgICBjb25zdCByZXN1bHRzID0gKHR5cGVvZiByb290UCA9PT0gJ3N0cmluZycpIFxuICAgICAgICA/IDxhbnlbXT5hd2FpdCB0aGlzLmRiLmFsbChzcWxSb290UCwge1xuICAgICAgICAgICAgJHJvb3RQOiBgJHtyb290UH0lYFxuICAgICAgICB9KVxuICAgICAgICA6IDxhbnlbXT5hd2FpdCB0aGlzLmRiLmFsbChzcWxOb1Jvb3QpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDI6IFBhdGhzUmV0dXJuVHlwZVtdXG4gICAgICAgICAgICAgICAgPSBuZXcgQXJyYXk8UGF0aHNSZXR1cm5UeXBlPigpO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcmVzdWx0cykge1xuICAgICAgICAgICAgaWYgKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodnBhdGhzU2Vlbi5oYXMoKGl0ZW0gYXMgVCkudnBhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZwYXRoc1NlZW4uYWRkKChpdGVtIGFzIFQpLnZwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLm1pbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpdGVtLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB7IGVycm9yLCB2YWx1ZSB9ID1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVBhdGhzUmV0dXJuVHlwZShpdGVtKTtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBQQVRIUyBWQUxJREFUSU9OICR7dXRpbC5pbnNwZWN0KGl0ZW0pfWAsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdDIucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9DYWNoaW5nICYmIGNhY2hlS2V5KSB7XG4gICAgICAgICAgICB0aGlzLnBhdGhzQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXN1bHQyXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgZmlsZSB3aXRoaW4gdGhlIGNhY2hlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBUaGUgdnBhdGggb3IgcmVuZGVyUGF0aCB0byBsb29rIGZvclxuICAgICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgICovXG4gICAgYXN5bmMgZmluZChfZnBhdGgpOiBQcm9taXNlPFQgfCB1bmRlZmluZWQ+IHtcblxuICAgICAgICBpZiAodHlwZW9mIF9mcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZCBwYXJhbWV0ZXIgbm90IHN0cmluZyAke3R5cGVvZiBfZnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChmcGF0aCk7XG5cbiAgICAgICAgLy8gY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgIC8vICAgICBvcjogW1xuICAgICAgICAvLyAgICAgICAgIHsgdnBhdGg6IHsgZXE6IGZwYXRoIH19LFxuICAgICAgICAvLyAgICAgICAgIHsgcmVuZGVyUGF0aDogeyBlcTogZnBhdGggfX1cbiAgICAgICAgLy8gICAgIF1cbiAgICAgICAgLy8gfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kICR7X2ZwYXRofSAke2ZwYXRofSA9PT4gcmVzdWx0MSAke3V0aWwuaW5zcGVjdChyZXN1bHQxKX0gYCk7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MiA9IHJlc3VsdDEuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuICEoZmNhY2hlLmlnbm9yZUZpbGUoaXRlbSkpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHQyKSB7XG4gICAgICAgIC8vICAgICB0aGlzLmdhdGhlckluZm9EYXRhKHJlc3VsdCk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZCAke19mcGF0aH0gJHtmcGF0aH0gPT0+IHJlc3VsdDIgJHt1dGlsLmluc3BlY3QocmVzdWx0Mil9IGApO1xuXG4gICAgICAgIGxldCByZXQ7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdDIpICYmIHJlc3VsdDIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0ID0gcmVzdWx0MlswXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdDIpICYmIHJlc3VsdDIubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHJldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IHJlc3VsdDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJldCkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWU6IFQgPSB0aGlzLmN2dFJvd1RvT2JqKFxuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdGVSb3cocmV0KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQUk9CTEVNOlxuICAgICAgICAvLyB0aGUgbWV0YWRhdGEsIGRvY01ldGFkYXRhLCBiYXNlTWV0YWRhdGEsXG4gICAgICAgIC8vIGFuZCBpbmZvIGZpZWxkcywgYXJlIHN0b3JlZCBpblxuICAgICAgICAvLyB0aGUgZGF0YWJhc2UgYXMgc3RyaW5ncywgYnV0IG5lZWRcbiAgICAgICAgLy8gdG8gYmUgdW5wYWNrZWQgaW50byBvYmplY3RzLlxuICAgICAgICAvL1xuICAgICAgICAvLyBVc2luZyB2YWxpZGF0ZVJvdyBvciB2YWxpZGF0ZVJvd3MgaXNcbiAgICAgICAgLy8gdXNlZnVsLCBidXQgZG9lcyBub3QgY29udmVydCB0aG9zZVxuICAgICAgICAvLyBmaWVsZHMuXG4gICAgfVxuXG4gICAgI2ZFeGlzdHNJbkRpcihmcGF0aCwgZGlyOiBkaXJUb01vdW50KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGAjZkV4aXN0c0luRGlyICR7ZnBhdGh9ICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgIGlmIChkaXIuZGVzdCA9PT0gJy8nKSB7XG4gICAgICAgICAgICBjb25zdCBmc3BhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgZGlyLnNyYywgZnBhdGhcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsZXQgZnNleGlzdHMgPSBGUy5leGlzdHNTeW5jKGZzcGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChmc2V4aXN0cykge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IEZTLnN0YXRTeW5jKGZzcGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxWUGF0aERhdGE+IHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLnNyYyxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLmRlc3QsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBzdGF0cy5tdGltZU1zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtcCA9IGRpci5kZXN0LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgPyBkaXIuZGVzdC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgIDogZGlyLmRlc3Q7XG4gICAgICAgIG1wID0gbXAuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgPyBtcFxuICAgICAgICAgICAgOiAobXArJy8nKTtcblxuICAgICAgICBpZiAoZnBhdGguc3RhcnRzV2l0aChtcCkpIHtcbiAgICAgICAgICAgIGxldCBwYXRoSW5Nb3VudGVkXG4gICAgICAgICAgICAgICAgPSBmcGF0aC5yZXBsYWNlKGRpci5kZXN0LCAnJyk7XG4gICAgICAgICAgICBsZXQgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5zcmMsIHBhdGhJbk1vdW50ZWQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENoZWNraW5nIGV4aXN0IGZvciAke2Rpci5kZXN0fSAke2Rpci5zcmN9ICR7cGF0aEluTW91bnRlZH0gJHtmc3BhdGh9YCk7XG4gICAgICAgICAgICBsZXQgZnNleGlzdHMgPSBGUy5leGlzdHNTeW5jKGZzcGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChmc2V4aXN0cykge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IEZTLnN0YXRTeW5jKGZzcGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxWUGF0aERhdGE+IHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLnNyYyxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLmRlc3QsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzTXRpbWU6IHN0YXRzLm10aW1lTXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGdWxmaWxscyB0aGUgXCJmaW5kXCIgb3BlcmF0aW9uIG5vdCBieVxuICAgICAqIGxvb2tpbmcgaW4gdGhlIGRhdGFiYXNlLCBidXQgYnkgc2Nhbm5pbmdcbiAgICAgKiB0aGUgZmlsZXN5c3RlbSB1c2luZyBzeW5jaHJvbm91cyBjYWxscy5cbiAgICAgKiBcbiAgICAgKiBOT1RFOiBUaGlzIGlzIHVzZWQgaW4gcGFydGlhbFN5bmNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgZmluZFN5bmMoX2ZwYXRoKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcblxuICAgICAgICBpZiAodHlwZW9mIF9mcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZCBwYXJhbWV0ZXIgbm90IHN0cmluZyAke3R5cGVvZiBfZnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kU3luYyBsb29raW5nIGZvciAke2ZwYXRofSBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLiNkaXJzKX1gKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLiNkaXJzKSB7XG4gICAgICAgICAgICBpZiAoIShkaXI/LmRlc3QpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBmaW5kU3luYyBiYWQgZGlycyBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmRpcnMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZm91bmQgPSB0aGlzLiNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcik7XG4gICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZFN5bmMgJHtmcGF0aH0gZm91bmRgLCBmb3VuZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldHNDYWNoZVxuICAgICAgICBleHRlbmRzIEJhc2VDYWNoZTxBc3NldD4ge1xuICAgIFxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvdyhyb3c6IGFueSk6IEFzc2V0IHtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9IHZhbGlkYXRlQXNzZXQocm93KTtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmVycm9yKGBBU1NFVCBWQUxJREFUSU9OIEVSUk9SIGZvcmAsIHJvdyk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogQXNzZXRbXSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NldHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxBc3NldD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogQXNzZXQge1xuICAgICAgICBpZiAodHlwZW9mIHJvdy5pbmZvID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmluZm8gPSBKU09OLnBhcnNlKHJvdy5pbmZvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPEFzc2V0PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBBc3NldCkge1xuICAgICAgICBpZiAodHlwZW9mICg8YW55PmluZm8pLnN0YXRzTXRpbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpbmZvLm10aW1lTXMgPSAoPGFueT5pbmZvKS5zdGF0c010aW1lO1xuICAgICAgICB9XG4gICAgICAgIC8vIEtlZXAgbWltZSBhcyBudWxsIGlmIGl0J3MgbnVsbCBvciB1bmRlZmluZWQgLSBTUUwgTlVMTCBpcyB2YWxpZFxuICAgICAgICBpZiAoaW5mby5taW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGluZm8ubWltZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjaW5zZXJ0RG9jQXNzZXRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IEFzc2V0XG4gICAgKSB7XG4gICAgICAgIGlmICghdGhpcy4jaW5zZXJ0RG9jQXNzZXRzKSB7XG4gICAgICAgICAgICB0aGlzLiNpbnNlcnREb2NBc3NldHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1hc3NldHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bih0aGlzLiNpbnNlcnREb2NBc3NldHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCA/PyAnJyxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUgPz8gbnVsbCxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQgPz8gJycsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50ID8/ICcnLFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCA/PyAnJyxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQgPz8gJycsIGluZm8ucGF0aEluTW91bnRlZCA/PyAnJyksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGggPz8gJycpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyA/PyAwLFxuICAgICAgICAgICAgJGluZm86IEpTT04uc3RyaW5naWZ5KGluZm8pXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgICN1cGRhdGVEb2NBc3NldHM7XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvOiBBc3NldCkge1xuICAgICAgICBpZiAoIXRoaXMuI3VwZGF0ZURvY0Fzc2V0cykge1xuICAgICAgICAgICAgdGhpcy4jdXBkYXRlRG9jQXNzZXRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3VwZGF0ZS1kb2MtYXNzZXRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jdXBkYXRlRG9jQXNzZXRzLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGggPz8gJycsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lID8/IG51bGwsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkID8/ICcnLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCA/PyAnJyxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQgPz8gJycsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkID8/ICcnLCBpbmZvLnBhdGhJbk1vdW50ZWQgPz8gJycpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoID8/ICcnKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMgPz8gMCxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKVxuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnRpYWxzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8UGFydGlhbD4ge1xuICAgIFxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvdyhyb3c6IGFueSk6IFBhcnRpYWwge1xuICAgICAgICBjb25zdCB7IGVycm9yLCB2YWx1ZSB9ID0gdmFsaWRhdGVQYXJ0aWFsKHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XG4gICAgICAgIGVsc2UgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvd3Mocm93czogYW55W10pOiBQYXJ0aWFsW10ge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocm93cykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUGFydGlhbHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxQYXJ0aWFsPigpO1xuICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICByZXQucHVzaCh0aGlzLnZhbGlkYXRlUm93KHJvdykpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoocm93OiBhbnkpOiBQYXJ0aWFsIHtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDxQYXJ0aWFsPnJvdztcbiAgICB9XG5cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm86IFBhcnRpYWwpIHtcblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodHlwZW9mICg8YW55PmluZm8pLnN0YXRzTXRpbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpbmZvLm10aW1lTXMgPSAoPGFueT5pbmZvKS5zdGF0c010aW1lO1xuICAgICAgICB9XG4gICAgICAgIC8vIEtlZXAgbWltZSBhcyBudWxsIGlmIGl0J3MgbnVsbCBvciB1bmRlZmluZWQgLSBTUUwgTlVMTCBpcyB2YWxpZFxuICAgICAgICBpZiAoaW5mby5taW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGluZm8ubWltZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9IHJlbmRlcmVyLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFJlbmRlcmVyIGV4aXN0cyBidXQgZG9lc24ndCBwYXJzZSBtZXRhZGF0YVxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTm8gcmVuZGVyZXIgZm91bmRcbiAgICAgICAgICAgIGluZm8uZG9jQm9keSA9ICcnO1xuICAgICAgICAgICAgaW5mby5yZW5kZXJlck5hbWUgPSAnJztcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgI2luc2VydERvY1BhcnRpYWxzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IFBhcnRpYWxcbiAgICApIHtcbiAgICAgICAgaWYgKCF0aGlzLiNpbnNlcnREb2NQYXJ0aWFscykge1xuICAgICAgICAgICAgdGhpcy4jaW5zZXJ0RG9jUGFydGlhbHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1wYXJ0aWFscy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI2luc2VydERvY1BhcnRpYWxzLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGggPz8gJycsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lID8/IG51bGwsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkID8/ICcnLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCA/PyAnJyxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQgPz8gJycsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkID8/ICcnLCBpbmZvLnBhdGhJbk1vdW50ZWQgPz8gJycpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoID8/ICcnKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMgPz8gMCxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHkgPz8gJycsXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZSA/PyAnJ1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAjdXBkYXRlRG9jUGFydGlhbHM7XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihcbiAgICAgICAgaW5mbzogUGFydGlhbFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI3VwZGF0ZURvY1BhcnRpYWxzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NQYXJ0aWFscyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICd1cGRhdGUtZG9jLXBhcnRpYWxzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jdXBkYXRlRG9jUGFydGlhbHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCA/PyAnJyxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUgPz8gbnVsbCxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQgPz8gJycsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50ID8/ICcnLFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCA/PyAnJyxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQgPz8gJycsIGluZm8ucGF0aEluTW91bnRlZCA/PyAnJyksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGggPz8gJycpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyA/PyAwLFxuICAgICAgICAgICAgJGluZm86IEpTT04uc3RyaW5naWZ5KGluZm8pLFxuXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5ID8/ICcnLFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWUgPz8gJydcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBMYXlvdXRzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8TGF5b3V0PiB7XG4gICAgXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93KHJvdzogYW55KTogTGF5b3V0IHtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9IHZhbGlkYXRlTGF5b3V0KHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XG4gICAgICAgIGVsc2UgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvd3Mocm93czogYW55W10pOiBMYXlvdXRbXSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBMYXlvdXRzQ2FjaGUgdmFsaWRhdGVSb3dzIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXlgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXk8TGF5b3V0PigpO1xuICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICByZXQucHVzaCh0aGlzLnZhbGlkYXRlUm93KHJvdykpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoocm93OiBhbnkpOiBMYXlvdXQge1xuICAgICAgICBpZiAodHlwZW9mIHJvdy5pbmZvID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmluZm8gPSBKU09OLnBhcnNlKHJvdy5pbmZvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPExheW91dD5yb3c7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbzogTGF5b3V0KSB7XG5cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBLZWVwIG1pbWUgYXMgbnVsbCBpZiBpdCdzIG51bGwgb3IgdW5kZWZpbmVkIC0gU1FMIE5VTEwgaXMgdmFsaWRcbiAgICAgICAgaWYgKGluZm8ubWltZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZW5kZXJlcikge1xuICAgICAgICAgICAgaW5mby5yZW5kZXJlck5hbWUgPSByZW5kZXJlci5uYW1lO1xuXG4gICAgICAgICAgICBjb25zdCByZW5kZXJQYXRoXG4gICAgICAgICAgICAgICAgPSByZW5kZXJlci5maWxlUGF0aChpbmZvLnZwYXRoKTtcblxuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID1cbiAgICAgICAgICAgICAgICBtaWNyb21hdGNoLmlzTWF0Y2goXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqKi8qLmh0bWwnKVxuICAgICAgICAgICAgIHx8IG1pY3JvbWF0Y2guaXNNYXRjaChcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgJyouaHRtbCcpXG4gICAgICAgICAgICA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEpIHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJjID0gcmVuZGVyZXIucGFyc2VNZXRhZGF0YSg8YW55PntcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBpbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogRlMucmVhZEZpbGVTeW5jKGluZm8uZnNwYXRoLCAndXRmLTgnKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gUmVuZGVyZXIgZXhpc3RzIGJ1dCBkb2Vzbid0IHBhcnNlIG1ldGFkYXRhXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBObyByZW5kZXJlciBmb3VuZFxuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID0gZmFsc2U7XG4gICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSAnJztcbiAgICAgICAgICAgIGluZm8ucmVuZGVyZXJOYW1lID0gJyc7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgICNpbnNlcnREb2NMYXlvdXRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IExheW91dFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI2luc2VydERvY0xheW91dHMpIHtcbiAgICAgICAgICAgIHRoaXMuI2luc2VydERvY0xheW91dHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1sYXlvdXRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI2luc2VydERvY0xheW91dHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCA/PyAnJyxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUgPz8gbnVsbCxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQgPz8gJycsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50ID8/ICcnLFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCA/PyAnJyxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQgPz8gJycsIGluZm8ucGF0aEluTW91bnRlZCA/PyAnJyksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGggPz8gJycpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyA/PyAwLFxuICAgICAgICAgICAgJGluZm86IEpTT04uc3RyaW5naWZ5KGluZm8pLFxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IChpbmZvLnJlbmRlcnNUb0hUTUwgPz8gZmFsc2UpID8gMSA6IDAsICAvLyBDb252ZXJ0IGJvb2xlYW4gdG8gMC8xXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5ID8/ICcnLFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWUgPz8gJydcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgI3VwZGF0ZURvY0xheW91dHM7XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihcbiAgICAgICAgaW5mbzogTGF5b3V0XG4gICAgKSB7XG4gICAgICAgIGlmICghdGhpcy4jdXBkYXRlRG9jTGF5b3V0cykge1xuICAgICAgICAgICAgdGhpcy4jdXBkYXRlRG9jTGF5b3V0cyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICd1cGRhdGUtZG9jLWxheW91dHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bih0aGlzLiN1cGRhdGVEb2NMYXlvdXRzLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGggPz8gJycsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lID8/IG51bGwsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkID8/ICcnLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCA/PyAnJyxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQgPz8gJycsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkID8/ICcnLCBpbmZvLnBhdGhJbk1vdW50ZWQgPz8gJycpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoID8/ICcnKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMgPz8gMCxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcblxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IChpbmZvLnJlbmRlcnNUb0hUTUwgPz8gZmFsc2UpID8gMSA6IDAsICAvLyBDb252ZXJ0IGJvb2xlYW4gdG8gMC8xXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5ID8/ICcnLFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWUgPz8gJydcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8RG9jdW1lbnQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBEb2N1bWVudCB7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIHZhbHVlIH1cbiAgICAgICAgICAgICAgICAgICAgPSB2YWxpZGF0ZURvY3VtZW50KHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRE9DVU1FTlQgVkFMSURBVElPTiBFUlJPUiBmb3IgJHt1dGlsLmluc3BlY3Qocm93KX1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogRG9jdW1lbnRbXSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxEb2N1bWVudD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogRG9jdW1lbnQge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgRG9jdW1lbnRzIGN2dFJvd1RvT2JqYCwgcm93KTtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cuYmFzZU1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmJhc2VNZXRhZGF0YVxuICAgICAgICAgICAgICAgID0gSlNPTi5wYXJzZShyb3cuYmFzZU1ldGFkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJvdy5kb2NNZXRhZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgID0gSlNPTi5wYXJzZShyb3cuZG9jTWV0YWRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygcm93Lm1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93Lm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy5tZXRhZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cudGFncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy50YWdzXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy50YWdzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPERvY3VtZW50PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBEb2N1bWVudCkge1xuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIGluZm8uZGlybmFtZSA9IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8uZGlybmFtZSA9PT0gJy4nKSBpbmZvLmRpcm5hbWUgPSAnLyc7XG4gICAgICAgIGluZm8ucGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGluZm8uZGlybmFtZSk7XG5cbiAgICAgICAgLy8gZmluZCB0aGUgbW91bnRlZCBkaXJlY3RvcnksXG4gICAgICAgIC8vIGdldCB0aGUgYmFzZU1ldGFkYXRhXG4gICAgICAgIGZvciAobGV0IGRpciBvZiB0aGlzLmRpcnMpIHtcbiAgICAgICAgICAgIGlmIChkaXIuc3JjID09PSBpbmZvLm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlyLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLmJhc2VNZXRhZGF0YSA9IGRpci5iYXNlTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBLZWVwIG1pbWUgYXMgbnVsbCBpZiBpdCdzIG51bGwgb3IgdW5kZWZpbmVkIC0gU1FMIE5VTEwgaXMgdmFsaWRcbiAgICAgICAgaWYgKGluZm8ubWltZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZW5kZXJlciA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChyZW5kZXJlcikge1xuICAgICAgICAgICAgaW5mby5yZW5kZXJlck5hbWUgPSByZW5kZXJlci5uYW1lO1xuXG4gICAgICAgICAgICBpbmZvLnJlbmRlclBhdGhcbiAgICAgICAgICAgICAgICA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8udnBhdGgpO1xuXG4gICAgICAgICAgICBpbmZvLnJlbmRlcnNUb0hUTUwgPVxuICAgICAgICAgICAgICAgIG1pY3JvbWF0Y2guaXNNYXRjaChcbiAgICAgICAgICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKiovKi5odG1sJylcbiAgICAgICAgICAgICB8fCBtaWNyb21hdGNoLmlzTWF0Y2goXG4gICAgICAgICAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgJyouaHRtbCcpXG4gICAgICAgICAgICA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEpIHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJjID0gcmVuZGVyZXIucGFyc2VNZXRhZGF0YSg8YW55PntcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBpbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogRlMucmVhZEZpbGVTeW5jKGluZm8uZnNwYXRoLCAndXRmLTgnKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gZG9jTWV0YWRhdGEgaXMgdGhlIHVubW9kaWZpZWQgbWV0YWRhdGEvZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgZG9jdW1lbnRcbiAgICAgICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhID0gcmMubWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgLy8gZG9jQ29udGVudCBpcyB0aGUgdW5wYXJzZWQgb3JpZ2luYWwgY29udGVudFxuICAgICAgICAgICAgICAgIC8vIGluY2x1ZGluZyBhbnkgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0NvbnRlbnQgPSByYy5jb250ZW50O1xuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBjb21wdXRlZCBtZXRhZGF0YSB0aGF0IGluY2x1ZGVzIGRhdGEgZnJvbSBcbiAgICAgICAgICAgICAgICAvLyBzZXZlcmFsIHNvdXJjZXNcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhID0geyB9O1xuICAgICAgICAgICAgICAgIGlmICghaW5mby5kb2NNZXRhZGF0YSkgaW5mby5kb2NNZXRhZGF0YSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlc3Qgb2YgdGhpcyBpcyBhZGFwdGVkIGZyb20gdGhlIG9sZCBmdW5jdGlvblxuICAgICAgICAgICAgICAgIC8vIEhUTUxSZW5kZXJlci5uZXdJbml0TWV0YWRhdGFcblxuICAgICAgICAgICAgICAgIC8vIEZvciBzdGFydGVycyB0aGUgbWV0YWRhdGEgaXMgY29sbGVjdGVkIGZyb20gc2V2ZXJhbCBzb3VyY2VzLlxuICAgICAgICAgICAgICAgIC8vIDEpIHRoZSBtZXRhZGF0YSBzcGVjaWZpZWQgaW4gdGhlIGRpcmVjdG9yeSBtb3VudCB3aGVyZVxuICAgICAgICAgICAgICAgIC8vICAgIHRoaXMgZG9jdW1lbnQgd2FzIGZvdW5kXG4gICAgICAgICAgICAgICAgLy8gMikgbWV0YWRhdGEgaW4gdGhlIHByb2plY3QgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgICAgIC8vIDMpIHRoZSBtZXRhZGF0YSBpbiB0aGUgZG9jdW1lbnQsIGFzIGNhcHR1cmVkIGluIGRvY01ldGFkYXRhXG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW5pdE1ldGFkYXRhICR7YmFzZWRpcn0gJHtmcGF0aH0gYmFzZU1ldGFkYXRhICR7YmFzZU1ldGFkYXRhW3lwcm9wXX1gKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSBpbmZvLmJhc2VNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIHRoaXMuY29uZmlnLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gdGhpcy5jb25maWcubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBmbW1jb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gaW5mby5kb2NNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uZG9jTWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgICAgICBmbW1jb3VudCsrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFRoZSByZW5kZXJlZCB2ZXJzaW9uIG9mIHRoZSBjb250ZW50IGxhbmRzIGhlcmVcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmNvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIC8vIFRoZSBkb2N1bWVudCBvYmplY3QgaGFzIGJlZW4gdXNlZnVsIGZvciBcbiAgICAgICAgICAgICAgICAvLyBjb21tdW5pY2F0aW5nIHRoZSBmaWxlIHBhdGggYW5kIG90aGVyIGRhdGEuXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudCA9IHt9O1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQuYmFzZWRpciA9IGluZm8ubW91bnRQb2ludDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHBhdGggPSBpbmZvLnBhdGhJbk1vdW50ZWQ7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZWxyZW5kZXIgPSByZW5kZXJlci5maWxlUGF0aChpbmZvLnBhdGhJbk1vdW50ZWQpO1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbyA9IGluZm8ucmVuZGVyUGF0aDtcblxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSB0aGUgPGVtPnRhZ3M8L2VtPiBmaWVsZCBpcyBhbiBhcnJheVxuICAgICAgICAgICAgICAgIGlmICghKGluZm8ubWV0YWRhdGEudGFncykpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzID0gW107XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKGluZm8ubWV0YWRhdGEudGFncykgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0YWdsaXN0ID0gW107XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlID0gL1xccyosXFxzKi87XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncy5zcGxpdChyZSkuZm9yRWFjaCh0YWcgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFnbGlzdC5wdXNoKHRhZy50cmltKCkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzID0gdGFnbGlzdDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KGluZm8ubWV0YWRhdGEudGFncykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgYEZPUk1BVCBFUlJPUiAtICR7aW5mby52cGF0aH0gaGFzIGJhZGx5IGZvcm1hdHRlZCB0YWdzIGAsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhLnRhZ3MgPSBpbmZvLm1ldGFkYXRhLnRhZ3M7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcm9vdCBVUkwgZm9yIHRoZSBwcm9qZWN0XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yb290X3VybCA9IHRoaXMuY29uZmlnLnJvb3RfdXJsO1xuXG4gICAgICAgICAgICAgICAgLy8gQ29tcHV0ZSB0aGUgVVJMIHRoaXMgZG9jdW1lbnQgd2lsbCByZW5kZXIgdG9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jb25maWcucm9vdF91cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHVSb290VXJsID0gbmV3IFVSTCh0aGlzLmNvbmZpZy5yb290X3VybCwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgICAgICAgICB1Um9vdFVybC5wYXRobmFtZSA9IHBhdGgubm9ybWFsaXplKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbih1Um9vdFVybC5wYXRobmFtZSwgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbylcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSB1Um9vdFVybC50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfdXJsID0gaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX2RhdGUgPSBpbmZvLnN0YXRzLm10aW1lO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VQdWJsRGF0ZSA9IChkYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IERhdGUucGFyc2UoZGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghIGlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBuZXcgRGF0ZShwYXJzZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0ZVNldCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICAgJiYgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghIGRhdGVTZXQgJiYgaW5mby5tdGltZU1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IERhdGUoaW5mby5tdGltZU1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gaW5mby5tdGltZU1zO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7aW5mby52cGF0aH0gbWV0YWRhdGEucHVibGljYXRpb25EYXRlICR7aW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGV9IHNldCBmcm9tIHN0YXRzLm10aW1lYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2luZm8udnBhdGh9IG1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSAke2luZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlfSBzZXQgZnJvbSBjdXJyZW50IHRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9IGZhbHNlO1xuICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YSA9IHt9O1xuICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gJyc7XG4gICAgICAgICAgICBpbmZvLmRvY0NvbnRlbnQgPSAnJztcbiAgICAgICAgICAgIGluZm8ucmVuZGVyZXJOYW1lID0gJyc7XG4gICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IDA7XG4gICAgICAgICAgICBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoOyAgLy8gTm8gcmVuZGVyZXIsIHVzZSB2cGF0aCBhcyByZW5kZXJQYXRoXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOT1RFOiBDZXJ0YWluIGZpZWxkcyBhcmUgbm90IGhhbmRsZWRcbiAgICAvLyBoZXJlIGJlY2F1c2UgdGhleSdyZSBHRU5FUkFURUQgZnJvbVxuICAgIC8vIEpTT04gZGF0YS5cbiAgICAvL1xuICAgIC8vICAgICAgcHVibGljYXRpb25UaW1lXG4gICAgLy8gICAgICBiYXNlTWV0YWRhdGFcbiAgICAvLyAgICAgIG1ldGFkYXRhXG4gICAgLy8gICAgICB0YWdzXG4gICAgLy8gICAgICBsYXlvdXRcbiAgICAvLyAgICAgIGJsb2d0YWdcbiAgICAvL1xuICAgIC8vIFRob3NlIGZpZWxkcyBhcmUgbm90IHRvdWNoZWQgYnlcbiAgICAvLyB0aGUgaW5zZXJ0L3VwZGF0ZSBmdW5jdGlvbnMgYmVjYXVzZVxuICAgIC8vIFNRTElURTMgdGFrZXMgY2FyZSBvZiBpdC5cblxuICAgICNpbnNlcnREb2NEb2N1bWVudHM7XG4gICAgI2luc2VydExlbWJlZERvY3VtZW50cztcblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI2luc2VydERvY0RvY3VtZW50cykge1xuICAgICAgICAgICAgdGhpcy4jaW5zZXJ0RG9jRG9jdW1lbnRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2luc2VydC1kb2MtZG9jdW1lbnRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLiNpbnNlcnRMZW1iZWREb2N1bWVudHMpIHtcbiAgICAgICAgICAgIHRoaXMuI2luc2VydExlbWJlZERvY3VtZW50cyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdpbnNlcnQtbGVtYmVkLWRvY3VtZW50cy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbGV0IG10aW1lO1xuICAgICAgICAvLyBpZiAodHlwZW9mIGluZm8ubXRpbWVNcyA9PT0gJ251bWJlcidcbiAgICAgICAgLy8gIHx8IHR5cGVvZiBpbmZvLm10aW1lTXMgPT09ICdzdHJpbmcnXG4gICAgICAgIC8vICkge1xuICAgICAgICAvLyAgICAgbXRpbWUgPSBuZXcgRGF0ZShpbmZvLm10aW1lTXMpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0RG9jRG9jdW1lbnRzLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGggPz8gJycsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lID8/IG51bGwsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkID8/ICcnLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCA/PyAnJyxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQgPz8gJycsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkID8/ICcnLCBpbmZvLnBhdGhJbk1vdW50ZWQgPz8gJycpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoID8/ICcnKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMgPz8gMCxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcbiAgICAgICAgICAgICRyZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGggPz8gaW5mby52cGF0aCA/PyAnJyxcbiAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MOiAoaW5mby5yZW5kZXJzVG9IVE1MID8/IGZhbHNlKSA/IDEgOiAwLCAgLy8gQ29udmVydCBib29sZWFuIHRvIDAvMVxuICAgICAgICAgICAgJHBhcmVudERpcjogaW5mby5wYXJlbnREaXIgPz8gJycsXG4gICAgICAgICAgICAkZG9jTWV0YWRhdGE6IEpTT04uc3RyaW5naWZ5KGluZm8uZG9jTWV0YWRhdGEgPz8ge30pLFxuICAgICAgICAgICAgJGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCA/PyAnJyxcbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHkgPz8gJycsXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZSA/PyAnJ1xuICAgICAgICB9KTtcblxuXG4gICAgICAgIC8vIGlmICh0eXBlb2YgbGVtYmVkTW9kZWxOYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coe1xuICAgICAgICAvLyAgICAgICAgIGxlbWJlZE1vZGVsTmFtZSxcbiAgICAgICAgLy8gICAgICAgICBib2R5VHlwZTogdHlwZW9mIGluZm8uZG9jQm9keVxuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyh7XG4gICAgICAgIC8vICAgICAgICAgdHlwZU5hbWU6IHR5cGVvZiBsZW1iZWRNb2RlbE5hbWUsXG4gICAgICAgIC8vICAgICAgICAgYm9keVR5cGU6IHR5cGVvZiBpbmZvLmRvY0JvZHlcbiAgICAgICAgLy8gICAgIH0pXG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyBUaGlzIGhhbmRsZXMgY29tcHV0aW5nIGVtYmVkZGluZ3NcbiAgICAgICAgLy8gZm9yIHRoZSB0aXRsZSBhbmQgYm9keVxuICAgICAgICBpZiAodHlwZW9mIGxlbWJlZE1vZGVsTmFtZSA9PT0gJ3N0cmluZydcbiAgICAgICAgIC8vICYmIHR5cGVvZiBpbmZvLnRpdGxlID09PSAnc3RyaW5nJ1xuICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jQm9keSA9PT0gJ3N0cmluZydcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLiNpbnNlcnRMZW1iZWREb2N1bWVudHMsIHtcbiAgICAgICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgJGxlbWJlZE1vZGVsOiBsZW1iZWRNb2RlbE5hbWUsXG4gICAgICAgICAgICAgICAgLy8gJHRpdGxlRW1iZWQ6IGluZm8udGl0bGUsXG4gICAgICAgICAgICAgICAgJGJvZHlFbWJlZDogIGluZm8uZG9jQm9keVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bih0aGlzLiNpbnNlcnRMZW1iZWREb2N1bWVudHMsIHtcbiAgICAgICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGggPz8gJycsXG4gICAgICAgICAgICAgICAgJGxlbWJlZE1vZGVsOiBsZW1iZWRNb2RlbE5hbWUgPz8gJycsXG4gICAgICAgICAgICAgICAgLy8gJHRpdGxlRW1iZWQ6IGluZm8udGl0bGUsXG4gICAgICAgICAgICAgICAgJGJvZHlFbWJlZDogIGluZm8uZG9jQm9keSA/PyAnJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgdmVjX2RvY3VtZW50cyBpbnNlcnRlZCAke2luZm8udnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5mby5tZXRhZGF0YSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coe1xuICAgICAgICAgICAgLy8gICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgLy8gICAgIHRhZ3M6IGluZm8ubWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgLy8gfSk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFkZERvY1RhZ0dsdWUoXG4gICAgICAgICAgICAgICAgaW5mby52cGF0aCwgaW5mby5tZXRhZGF0YS50YWdzXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgI3VwZGF0ZURvY0RvY3VtZW50cztcbiAgICAjdXBkYXRlTGVtYmVkRG9jdW1lbnRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgKSB7XG4gICAgICAgIGlmICghdGhpcy4jdXBkYXRlRG9jRG9jdW1lbnRzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NEb2N1bWVudHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAndXBkYXRlLWRvYy1kb2N1bWVudHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuI3VwZGF0ZUxlbWJlZERvY3VtZW50cykge1xuICAgICAgICAgICAgdGhpcy4jdXBkYXRlTGVtYmVkRG9jdW1lbnRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3VwZGF0ZS1sZW1iZWQtZG9jdW1lbnRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jdXBkYXRlRG9jRG9jdW1lbnRzLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGggPz8gJycsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lID8/IG51bGwsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkID8/ICcnLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCA/PyAnJyxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQgPz8gJycsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkID8/ICcnLCBpbmZvLnBhdGhJbk1vdW50ZWQgPz8gJycpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoID8/ICcnKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMgPz8gMCxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcblxuICAgICAgICAgICAgJHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCA/PyBpbmZvLnZwYXRoID8/ICcnLFxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IChpbmZvLnJlbmRlcnNUb0hUTUwgPz8gZmFsc2UpID8gMSA6IDAsICAvLyBDb252ZXJ0IGJvb2xlYW4gdG8gMC8xXG4gICAgICAgICAgICAkcGFyZW50RGlyOiBpbmZvLnBhcmVudERpciA/PyAnJyxcbiAgICAgICAgICAgICRkb2NNZXRhZGF0YTogSlNPTi5zdHJpbmdpZnkoaW5mby5kb2NNZXRhZGF0YSA/PyB7fSksXG4gICAgICAgICAgICAkZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50ID8/ICcnLFxuICAgICAgICAgICAgJGRvY0JvZHk6IGluZm8uZG9jQm9keSA/PyAnJyxcbiAgICAgICAgICAgICRyZW5kZXJlck5hbWU6IGluZm8ucmVuZGVyZXJOYW1lID8/ICcnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRoaXMgaGFuZGxlcyBjb21wdXRpbmcgZW1iZWRkaW5nc1xuICAgICAgICAvLyBmb3IgdGhlIHRpdGxlIGFuZCBib2R5XG4gICAgICAgIGlmICh0eXBlb2YgbGVtYmVkTW9kZWxOYW1lID09PSAnc3RyaW5nJ1xuICAgICAgICAgLy8gJiYgdHlwZW9mIGluZm8udGl0bGUgPT09ICdzdHJpbmcnXG4gICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NCb2R5ID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI3VwZGF0ZUxlbWJlZERvY3VtZW50cywge1xuICAgICAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCA/PyAnJyxcbiAgICAgICAgICAgICAgICAkbGVtYmVkTW9kZWw6IGxlbWJlZE1vZGVsTmFtZSA/PyAnJyxcbiAgICAgICAgICAgICAgICAvLyAkdGl0bGVFbWJlZDogaW5mby50aXRsZSxcbiAgICAgICAgICAgICAgICAkYm9keUVtYmVkOiAgaW5mby5kb2NCb2R5ID8/ICcnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICBhd2FpdCB0Z2x1ZS5hZGRUYWdHbHVlKGluZm8udnBhdGgsIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZGVsZXRlRG9jVGFnR2x1ZSh2cGF0aCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGdsdWUuZGVsZXRlVGFnR2x1ZSh2cGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gaWdub3JlXG4gICAgICAgICAgICAvLyBUaGlzIGNhbiB0aHJvdyBhbiBlcnJvciBsaWtlOlxuICAgICAgICAgICAgLy8gZG9jdW1lbnRzQ2FjaGUgRVJST1Ige1xuICAgICAgICAgICAgLy8gICAgIGNvZGU6ICdjaGFuZ2VkJyxcbiAgICAgICAgICAgIC8vICAgICBuYW1lOiAnZG9jdW1lbnRzJyxcbiAgICAgICAgICAgIC8vICAgICB2cGF0aDogJ19tZXJtYWlkL3JlbmRlcjMzNTY3MzkzODIubWVybWFpZCcsXG4gICAgICAgICAgICAvLyAgICAgZXJyb3I6IEVycm9yOiBkZWxldGUgZnJvbSAnVEFHR0xVRScgZmFpbGVkOiBub3RoaW5nIGNoYW5nZWRcbiAgICAgICAgICAgIC8vICAgICAgLi4uIHN0YWNrIHRyYWNlXG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBJbiBzdWNoIGEgY2FzZSB0aGVyZSBpcyBubyB0YWdHbHVlIGZvciB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAgICAvLyBUaGlzIFwiZXJyb3JcIiBpcyBzcHVyaW91cy5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUT0RPIElzIHRoZXJlIGFub3RoZXIgcXVlcnkgdG8gcnVuIHRoYXQgd2lsbFxuICAgICAgICAgICAgLy8gbm90IHRocm93IGFuIGVycm9yIGlmIG5vdGhpbmcgd2FzIGNoYW5nZWQ/XG4gICAgICAgICAgICAvLyBJbiBvdGhlciB3b3JkcywgdGhpcyBjb3VsZCBoaWRlIGEgbGVnaXRpbWF0ZVxuICAgICAgICAgICAgLy8gZXJyb3IuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgYWRkRG9jVGFnR2x1ZSh2cGF0aDogc3RyaW5nLCB0YWdzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAodHlwZW9mIHRhZ3MgIT09ICdzdHJpbmcnXG4gICAgICAgICAmJiAhQXJyYXkuaXNBcnJheSh0YWdzKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkRG9jVGFnR2x1ZSBtdXN0IGJlIGdpdmVuIGEgdGFncyBhcnJheSwgd2FzIGdpdmVuOiAke3V0aWwuaW5zcGVjdCh0YWdzKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0Z2x1ZS5hZGRUYWdHbHVlKHZwYXRoLCBcbiAgICAgICAgICAgIEFycmF5LmlzQXJyYXkodGFncylcbiAgICAgICAgICAgID8gdGFnc1xuICAgICAgICAgICAgOiBbIHRhZ3MgXSk7XG4gICAgfVxuXG4gICAgYXN5bmMgYWRkVGFnRGVzY3JpcHRpb24odGFnOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRkZXNjLmFkZERlc2ModGFnLCBkZXNjcmlwdGlvbik7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0VGFnRGVzY3JpcHRpb24odGFnOiBzdHJpbmcpXG4gICAgICAgIDogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+XG4gICAge1xuICAgICAgICByZXR1cm4gdGRlc2MuZ2V0RGVzYyh0YWcpO1xuICAgIH1cblxuICAgICNzZWFyY2hTZW1hbnRpYztcblxuICAgIGFzeW5jIHNlbWFudGljU2VhcmNoRG9jcyhzZWFyY2hGb3I6IHN0cmluZylcbiAgICAgICAgOiBQcm9taXNlPEFycmF5PHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBkaXN0YW5jZTogbnVtYmVyXG4gICAgICAgIH0+PlxuICAgIHtcbiAgICAgICAgaWYgKCF0aGlzLiNzZWFyY2hTZW1hbnRpYykge1xuICAgICAgICAgICAgdGhpcy4jc2VhcmNoU2VtYW50aWMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnZG9jLXNlYXJjaC1zZW1hbnRpYy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IDxBcnJheTx7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgZGlzdGFuY2U6IG51bWJlclxuICAgICAgICB9Pj4gYXdhaXQgdGhpcy5kYi5hbGwodGhpcy4jc2VhcmNoU2VtYW50aWMsIHtcbiAgICAgICAgICAgICRsZW1iZWRNb2RlbDogbGVtYmVkTW9kZWxOYW1lLFxuICAgICAgICAgICAgJHNlYXJjaEZvcjogc2VhcmNoRm9yXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBpbmRleENoYWluQ2FjaGU7XG5cbiAgICBhc3luYyBpbmRleENoYWluKF9mcGF0aClcbiAgICAgICAgOiBQcm9taXNlPGluZGV4Q2hhaW5JdGVtW10+XG4gICAge1xuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSkgXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXRoLnBhcnNlKGZwYXRoKTtcblxuICAgICAgICBjb25zdCBkb0NhY2hpbmdcbiAgICAgICAgICAgID0gdGhpcy5jb25maWcuY2FjaGluZ1RpbWVvdXQgPiAwO1xuICAgICAgICBsZXQgY2FjaGVLZXk7XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmluZGV4Q2hhaW5DYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhDaGFpbkNhY2hlXG4gICAgICAgICAgICAgICAgICAgID0gbmV3IENhY2hlKHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FjaGVLZXkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgZGJuYW1lOiB0aGlzLnF1b3RlZERCTmFtZSxcbiAgICAgICAgICAgICAgICBmcGF0aCxcbiAgICAgICAgICAgICAgICBwYXJzZWRcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBjYWNoZWRcbiAgICAgICAgICAgICAgICA9IHRoaXMuaW5kZXhDaGFpbkNhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbmRleENoYWluICR7X2ZwYXRofSAke2ZwYXRofWAsIHBhcnNlZCk7XG5cbiAgICAgICAgY29uc3QgZmlsZXo6IERvY3VtZW50W10gPSBbXTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChmcGF0aCk7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGZwYXRoO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmKSAmJiBzZWxmLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICBmaWxlei5wdXNoKHNlbGZbMF0pO1xuICAgICAgICAgICAgZmlsZU5hbWUgPSBzZWxmWzBdLnJlbmRlclBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50RGlyO1xuICAgICAgICBsZXQgZGlyTmFtZSA9IHBhdGguZGlybmFtZShmcGF0aCk7XG4gICAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICghKGRpck5hbWUgPT09ICcuJyB8fCBkaXJOYW1lID09PSBwYXJzZWQucm9vdCkpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGVOYW1lKSA9PT0gJ2luZGV4Lmh0bWwnKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShmaWxlTmFtZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxvb2tGb3IgPSBwYXRoLmpvaW4ocGFyZW50RGlyLCBcImluZGV4Lmh0bWxcIik7XG5cbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gYXdhaXQgdGhpcy5maW5kQnlQYXRoKGxvb2tGb3IpO1xuXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpbmRleCkgJiYgaW5kZXgubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgICAgICBmaWxlei5wdXNoKGluZGV4WzBdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsZU5hbWUgPSBsb29rRm9yO1xuICAgICAgICAgICAgZGlyTmFtZSA9IHBhdGguZGlybmFtZShsb29rRm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJldCA9IGZpbGV6XG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbihvYmo6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGluZGV4Q2hhaW5JdGVtPntcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBvYmouZG9jTWV0YWRhdGEudGl0bGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogb2JqLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmREaXI6IG9iai5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRQYXRoOiBvYmoucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiAnLycgKyBvYmoucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBvYmouZm91bmREaXIgPSBvYmoubW91bnRQb2ludDtcbiAgICAgICAgICAgICAgICAgICAgLy8gb2JqLmZvdW5kUGF0aCA9IG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICAvLyBvYmouZmlsZW5hbWUgPSAnLycgKyBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIG9iajtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5yZXZlcnNlKCk7XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZyAmJiBjYWNoZUtleSkge1xuICAgICAgICAgICAgdGhpcy5pbmRleENoYWluQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBzaWJsaW5nc0NhY2hlO1xuICAgICNzaWJsaW5nc1NRTDtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIGFsbCB0aGUgZG9jdW1lbnRzIGluIHRoZSBzYW1lIGRpcmVjdG9yeVxuICAgICAqIGFzIHRoZSBuYW1lZCBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBkb2Vzbid0IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBzaWJsaW5ncyhfZnBhdGgpIHtcbiAgICAgICAgbGV0IHZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUodnBhdGgpO1xuXG4gICAgICAgIGNvbnN0IGRvQ2FjaGluZ1xuICAgICAgICAgICAgPSB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDA7XG4gICAgICAgIGxldCBjYWNoZUtleTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc2libGluZ3NDYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2libGluZ3NDYWNoZVxuICAgICAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZFxuICAgICAgICAgICAgICAgID0gdGhpcy5zaWJsaW5nc0NhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy4jc2libGluZ3NTUUwpIHtcbiAgICAgICAgICAgIHRoaXMuI3NpYmxpbmdzU1FMID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3NpYmxpbmdzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzaWJsaW5nc1xuICAgICAgICAgICAgPSBhd2FpdCB0aGlzLmRiLmFsbCh0aGlzLiNzaWJsaW5nc1NRTCwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWUsXG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGlnbm9yZWQgPSBzaWJsaW5ncy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuaWdub3JlRmlsZShpdGVtKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gdGhpcy52YWxpZGF0ZVJvd3MoaWdub3JlZCk7XG4gICAgICAgIGNvbnN0IHJldCA9IG1hcHBlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nICYmIGNhY2hlS2V5KSB7XG4gICAgICAgICAgICB0aGlzLnNpYmxpbmdzQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgICNkb2NzRm9yRGlybmFtZTtcbiAgICAjZGlyc0ZvclBhcmVudGRpcjtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB0cmVlIG9mIGl0ZW1zIHN0YXJ0aW5nIGZyb20gdGhlIGRvY3VtZW50XG4gICAgICogbmFtZWQgaW4gX3Jvb3RJdGVtLiAgVGhlIHBhcmFtZXRlciBzaG91bGQgYmUgYW5cbiAgICAgKiBhY3R1YWwgZG9jdW1lbnQgaW4gdGhlIHRyZWUsIHN1Y2ggYXMgYHBhdGgvdG8vaW5kZXguaHRtbGAuXG4gICAgICogVGhlIHJldHVybiBpcyBhIHRyZWUtc2hhcGVkIHNldCBvZiBvYmplY3RzIGxpa2UgdGhlIGZvbGxvd2luZztcbiAgICAgKiBcbiAgdHJlZTpcbiAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlclxuICAgIGl0ZW1zOlxuICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBjaGlsZEZvbGRlcnM6XG4gICAgICAgIC0gZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICAgICAgaXRlbXM6XG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sXG4gICAgICAgICAgICAgIGNoaWxkRm9sZGVyczogW11cbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sXG4gICAgICAgICAgICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAqXG4gICAgICogVGhlIG9iamVjdHMgdW5kZXIgYGl0ZW1zYCBhcmUgYWN0dWxseSB0aGUgZnVsbCBEb2N1bWVudCBvYmplY3RcbiAgICAgKiBmcm9tIHRoZSBjYWNoZSwgYnV0IGZvciB0aGUgaW50ZXJlc3Qgb2YgY29tcGFjdG5lc3MgbW9zdCBvZlxuICAgICAqIHRoZSBmaWVsZHMgaGF2ZSBiZWVuIGRlbGV0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX3Jvb3RJdGVtIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGNoaWxkSXRlbVRyZWUoX3Jvb3RJdGVtOiBzdHJpbmcpIHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hpbGRJdGVtVHJlZSAke19yb290SXRlbX1gKTtcblxuICAgICAgICBsZXQgcm9vdEl0ZW0gPSBhd2FpdCB0aGlzLmZpbmQoXG4gICAgICAgICAgICAgICAgX3Jvb3RJdGVtLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9yb290SXRlbS5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfcm9vdEl0ZW0pO1xuICAgICAgICBpZiAoIXJvb3RJdGVtKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYGNoaWxkSXRlbVRyZWUgbm8gcm9vdEl0ZW0gZm91bmQgZm9yIHBhdGggJHtfcm9vdEl0ZW19YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKHR5cGVvZiByb290SXRlbSA9PT0gJ29iamVjdCcpXG4gICAgICAgICB8fCAhKCd2cGF0aCcgaW4gcm9vdEl0ZW0pXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGBjaGlsZEl0ZW1UcmVlIGZvdW5kIGludmFsaWQgb2JqZWN0IGZvciAke19yb290SXRlbX0gLSAke3V0aWwuaW5zcGVjdChyb290SXRlbSl9YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKHJvb3RJdGVtLnZwYXRoKTtcblxuICAgICAgICBpZiAoIXRoaXMuI2RvY3NGb3JEaXJuYW1lKSB7XG4gICAgICAgICAgICB0aGlzLiNkb2NzRm9yRGlybmFtZSA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdkb2NzLWZvci1kaXJuYW1lLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQaWNrcyB1cCBldmVyeXRoaW5nIGZyb20gdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIC8vIERpZmZlcnMgZnJvbSBzaWJsaW5ncyBieSBnZXR0aW5nIGV2ZXJ5dGhpbmcuXG4gICAgICAgIGNvbnN0IF9pdGVtcyA9IDxhbnlbXT5hd2FpdCB0aGlzLmRiLmFsbCh0aGlzLiNkb2NzRm9yRGlybmFtZSwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGl0ZW1zOiBEb2N1bWVudFtdXG4gICAgICAgICAgICA9IHRoaXMudmFsaWRhdGVSb3dzKF9pdGVtcylcbiAgICAgICAgICAgIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghdGhpcy4jZGlyc0ZvclBhcmVudGRpcikge1xuICAgICAgICAgICAgdGhpcy4jZGlyc0ZvclBhcmVudGRpciA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdkaXJzLWZvci1wYXJlbnRkaXIuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF9jaGlsZEZvbGRlcnMgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwodGhpcy4jZGlyc0ZvclBhcmVudGRpciwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNoaWxkRm9sZGVycyA9IG5ldyBBcnJheTx7IGRpcm5hbWU6IHN0cmluZyB9PigpO1xuICAgICAgICBmb3IgKGNvbnN0IGNmIG9mIF9jaGlsZEZvbGRlcnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2YuZGlybmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjaGlsZEZvbGRlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGRpcm5hbWU6IGNmLmRpcm5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjaGlsZEl0ZW1UcmVlKCR7X3Jvb3RJdGVtfSkgbm8gZGlybmFtZSBmaWVsZHMgaW4gY2hpbGRGb2xkZXJzYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2ZzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgY2Ygb2YgY2hpbGRGb2xkZXJzKSB7XG4gICAgICAgICAgICBjZnMucHVzaChhd2FpdCB0aGlzLmNoaWxkSXRlbVRyZWUoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKGNmLmRpcm5hbWUsICdpbmRleC5odG1sJylcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvb3RJdGVtLFxuICAgICAgICAgICAgZGlybmFtZSxcbiAgICAgICAgICAgIGl0ZW1zOiBpdGVtcyxcbiAgICAgICAgICAgIC8vIFVuY29tbWVudCB0aGlzIHRvIGdlbmVyYXRlIHNpbXBsaWZpZWQgb3V0cHV0XG4gICAgICAgICAgICAvLyBmb3IgZGVidWdnaW5nLlxuICAgICAgICAgICAgLy8gLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoXG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSksXG4gICAgICAgICAgICBjaGlsZEZvbGRlcnM6IGNmc1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgI2luZGV4RmlsZXNTUUw7XG4gICAgI2luZGV4RmlsZXNTUUxyZW5kZXJQYXRoO1xuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgaW5kZXggZmlsZXMgKHJlbmRlcnMgdG8gaW5kZXguaHRtbClcbiAgICAgKiB3aXRoaW4gdGhlIG5hbWVkIHN1YnRyZWUuXG4gICAgICogXG4gICAgICogSXQgYXBwZWFycyB0aGlzIHdhcyB3cml0dGVuIGZvciBib29rbmF2LlxuICAgICAqIEJ1dCwgaXQgYXBwZWFycyB0aGF0IGJvb2tuYXYgZG9lcyBub3RcbiAgICAgKiB1c2UgdGhpcyBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb290UGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBpbmRleEZpbGVzKHJvb3RQYXRoPzogc3RyaW5nKSB7XG4gICAgICAgIGxldCByb290UCA9IHJvb3RQYXRoPy5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgID8gcm9vdFBhdGg/LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgOiByb290UGF0aDtcblxuICAgICAgICBpZiAoIXRoaXMuI2luZGV4RmlsZXNTUUwpIHtcbiAgICAgICAgICAgIHRoaXMuI2luZGV4RmlsZXNTUUwgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5kZXgtZG9jLWZpbGVzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuI2luZGV4RmlsZXNTUUxyZW5kZXJQYXRoKSB7XG4gICAgICAgICAgICB0aGlzLiNpbmRleEZpbGVzU1FMcmVuZGVyUGF0aCA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdpbmRleC1kb2MtZmlsZXMtcmVuZGVyUGF0aC5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXhlcyA9IFxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIHR5cGVvZiByb290UCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAmJiByb290UC5sZW5ndGggPj0gMVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgPyA8YW55W10+IGF3YWl0IHRoaXMuZGIuYWxsKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLiNpbmRleEZpbGVzU1FMcmVuZGVyUGF0aCwgeyAkcm9vdFA6IGAke3Jvb3RQfSVgIH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICA6IDxhbnlbXT4gYXdhaXQgdGhpcy5kYi5hbGwoXG4gICAgICAgICAgICAgICAgdGhpcy4jaW5kZXhGaWxlc1NRTFxuICAgICAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHRoaXMudmFsaWRhdGVSb3dzKGluZGV4ZXMpO1xuICAgICAgICByZXR1cm4gbWFwcGVkLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN2dFJvd1RvT2JqKGl0ZW0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEl0J3MgcHJvdmVkIGRpZmZpY3VsdCB0byBnZXQgdGhlIHJlZ2V4cFxuICAgICAgICAvLyB0byB3b3JrIGluIHRoaXMgbW9kZTpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gcmV0dXJuIGF3YWl0IHRoaXMuc2VhcmNoKHtcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0hUTUw6IHRydWUsXG4gICAgICAgIC8vICAgICByZW5kZXJwYXRobWF0Y2g6IC9cXC9pbmRleC5odG1sJC8sXG4gICAgICAgIC8vICAgICByb290UGF0aDogcm9vdFBhdGhcbiAgICAgICAgLy8gfSk7XG4gICAgfVxuXG4gICAgI2ZpbGVzRm9yU2V0VGltZXM7XG5cbiAgICAvKipcbiAgICAgKiBGb3IgZXZlcnkgZmlsZSBpbiB0aGUgZG9jdW1lbnRzIGNhY2hlLFxuICAgICAqIHNldCB0aGUgYWNjZXNzIGFuZCBtb2RpZmljYXRpb25zLlxuICAgICAqIFxuICAgICAqIFRoaXMgaXMgdXNlZCBmcm9tIGNsaS50cyBkb2NzLXNldC1kYXRlc1xuICAgICAqXG4gICAgICogPz8/Pz8gV2h5IHdvdWxkIHRoaXMgYmUgdXNlZnVsP1xuICAgICAqIEkgY2FuIHNlZSBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWRcbiAgICAgKiBmaWxlcyBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeS4gIEJ1dCB0aGlzIGlzXG4gICAgICogZm9yIHRoZSBmaWxlcyBpbiB0aGUgZG9jdW1lbnRzIGRpcmVjdG9yaWVzLiA/Pz8/XG4gICAgICovXG4gICAgYXN5bmMgc2V0VGltZXMoKSB7XG5cbiAgICAgICAgLy8gVGhlIFNFTEVDVCBiZWxvdyBwcm9kdWNlcyByb3cgb2JqZWN0cyBwZXJcbiAgICAgICAgLy8gdGhpcyBpbnRlcmZhY2UgZGVmaW5pdGlvbi4gIFRoaXMgZnVuY3Rpb24gbG9va3NcbiAgICAgICAgLy8gZm9yIGEgdmFsaWQgZGF0ZSBmcm9tIHRoZSBkb2N1bWVudCBtZXRhZGF0YSxcbiAgICAgICAgLy8gYW5kIGVuc3VyZXMgdGhlIGZzcGF0aCBmaWxlIGlzIHNldCB0byB0aGF0IGRhdGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHNhaWQgaW4gdGhlIGNvbW1lbnQgYWJvdmUuLi4uIFdIWT9cbiAgICAgICAgLy8gSSBjYW4gdW5kZXJzdGFuZCBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWQgb3V0cHV0LlxuICAgICAgICAvLyBGb3Igd2hhdCBwdXJwb3NlIGRpZCBJIGNyZWF0ZSB0aGlzIGZ1bmN0aW9uP1xuICAgICAgICBjb25zdCBzZXR0ZXIgPSAocm93OiB7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgZnNwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBtdGltZU1zOiBudW1iZXIsXG4gICAgICAgICAgICBwdWJsaWNhdGlvblRpbWU6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxEYXRlOiBzdHJpbmcsXG4gICAgICAgICAgICBwdWJsaWNhdGlvbkRhdGU6IHN0cmluZ1xuICAgICAgICB9KSA9PiB7XG4gICAgICAgICAgICBsZXQgcGFyc2VkID0gTmFOO1xuICAgICAgICAgICAgaWYgKHJvdy5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxEYXRlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93LnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5wdWJsaWNhdGlvblRpbWUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZWQgPSByb3cucHVibGljYXRpb25UaW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRwID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICBGUy51dGltZXNTeW5jKFxuICAgICAgICAgICAgICAgICAgICByb3cuZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBkcCxcbiAgICAgICAgICAgICAgICAgICAgZHBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy4jZmlsZXNGb3JTZXRUaW1lcykge1xuICAgICAgICAgICAgdGhpcy4jZmlsZXNGb3JTZXRUaW1lcyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdmaWxlcy1mb3Itc2V0dGltZXMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuZGIuZWFjaCh0aGlzLiNmaWxlc0ZvclNldFRpbWVzLCB7IH0sXG4gICAgICAgIChyb3c6IHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBmc3BhdGg6IHN0cmluZyxcbiAgICAgICAgICAgIG10aW1lTXM6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uVGltZTogbnVtYmVyLFxuICAgICAgICAgICAgcHVibERhdGU6IHN0cmluZyxcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uRGF0ZTogc3RyaW5nXG4gICAgICAgIH0pID0+IHtcbiAgICAgICAgICAgIGlmIChyb3cucHVibERhdGVcbiAgICAgICAgICAgICB8fCByb3cucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgfHwgcm93LnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc2V0dGVyKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRoaXMgd2FzIHdyaXR0ZW4gZm9yIHRhZ2dlZC1jb250ZW50XG4gICAgYXN5bmMgZG9jdW1lbnRzV2l0aFRhZyh0YWdubTogc3RyaW5nIHwgc3RyaW5nW10pXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxzdHJpbmc+PlxuICAgIHtcbiAgICAgICAgbGV0IHRhZ3M6IHN0cmluZ1tdO1xuICAgICAgICBpZiAodHlwZW9mIHRhZ25tID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGFncyA9IFsgdGFnbm0gXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRhZ25tKSkge1xuICAgICAgICAgICAgdGFncyA9IHRhZ25tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudHNXaXRoVGFnIGdpdmVuIGJhZCB0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KHRhZ25tKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvcnJlY3RseSBoYW5kbGUgdGFnIHN0cmluZ3Mgd2l0aFxuICAgICAgICAvLyB2YXJ5aW5nIHF1b3Rlcy4gIEEgZG9jdW1lbnQgbWlnaHQgaGF2ZSB0aGVzZSB0YWdzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICB0YWdzOlxuICAgICAgICAvLyAgICAtIFRlYXNlcidzXG4gICAgICAgIC8vICAgIC0gVGVhc2Vyc1xuICAgICAgICAvLyAgICAtIFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZXNlIFNRTCBxdWVyaWVzIHdvcms6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVvdGVkXCInLCBcIlRlYXNlcidzXCIgKTtcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxUZWFzZXInc1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVvdGVkXCInLCAnVGVhc2VyJydzJyApO1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFRlYXNlcidzXG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8U29tZXRoaW5nIFwicXVvdGVkXCJcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQnV0LCB0aGlzIGRvZXMgbm90OlxuICAgICAgICAvL1xuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lID0gJ1RlYXNlcidzJztcbiAgICAgICAgLy8gJyAgLi4uPiBcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIG9yaWdpbmFsIGNvZGUgYmVoYXZpb3Igd2FzIHRoaXM6XG4gICAgICAgIC8vXG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInNcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuIGF0dGVtcHRlZCBmaXg6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgXCJUZWFzZXInc1wiIF0gICggJ1RlYXNlclxcJ3MnICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwic1wiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5vdGhlciBhdHRlbXB0ZWQgZml4OlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiBdICAoIFwiVGVhc2VyJydzXCIgKSBcbiAgICAgICAgLy8gW11cbiAgICAgICAgLy8gW11cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5kOlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyAnU29tZXRoaW5nIFwicXVvdGVkXCInXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyAnU29tZXRoaW5nIFwicXVvdGVkXCInIF0gICggXCJTb21ldGhpbmcgXCJxdW90ZWRcIlwiICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwicXVvdGVkXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgY29kZSBiZWxvdyBwcm9kdWNlczpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiICdTb21ldGhpbmcgXCJxdW90ZWRcIidcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiwgJ1NvbWV0aGluZyBcInF1b3RlZFwiJyBdICAoICdUZWFzZXInJ3MnLCdTb21ldGhpbmcgXCJxdW90ZWRcIicgKSBcbiAgICAgICAgLy8gWyB7IHZwYXRoOiAndGVhc2VyLWNvbnRlbnQuaHRtbC5tZCcgfSBdXG4gICAgICAgIC8vIFsgJ3RlYXNlci1jb250ZW50Lmh0bWwubWQnIF1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZG9jdW1lbnRzV2l0aFRhZyAke3V0aWwuaW5zcGVjdCh0YWdzKX0gJHt0YWdzdHJpbmd9YCk7XG5cbiAgICAgICAgY29uc3QgdnBhdGhzID0gYXdhaXQgdGdsdWUucGF0aHNGb3JUYWcodGFncyk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zb2xlLmxvZyh2cGF0aHMpO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2cGF0aHMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50c1dpdGhUYWcgbm9uLUFycmF5IHJlc3VsdCAke3V0aWwuaW5zcGVjdCh2cGF0aHMpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZwYXRocztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gYXJyYXkgb2YgdGFncyB1c2VkIGJ5IGFsbCBkb2N1bWVudHMuXG4gICAgICogVGhpcyB1c2VzIHRoZSBKU09OIGV4dGVuc2lvbiB0byBleHRyYWN0XG4gICAgICogdGhlIHRhZ3MgZnJvbSB0aGUgbWV0YWRhdGEgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgdGFncygpIHtcbiAgICAgICAgY29uc3QgdGFncyA9IGF3YWl0IHRnbHVlLnRhZ3MoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHJldCA9IEFycmF5LmZyb20odGFncyk7XG4gICAgICAgIHJldHVybiByZXQuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHZhciB0YWdBID0gYS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIHRhZ0IgPSBiLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAodGFnQSA8IHRhZ0IpIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmICh0YWdBID4gdGFnQikgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBncm91cHMgb2Ygc2ltaWxhciB0YWdzIGJhc2VkIG9uIGNhc2UtaW5zZW5zaXRpdmUgbWF0Y2hpbmcsXG4gICAgICogcGx1cmFsL3Npbmd1bGFyIHZhcmlhbnRzLCBhbmQgTGV2ZW5zaHRlaW4gZGlzdGFuY2UuXG4gICAgICogXG4gICAgICogQHBhcmFtIHRocmVzaG9sZCAtIE1heGltdW0gTGV2ZW5zaHRlaW4gZGlzdGFuY2UgdG8gY29uc2lkZXIgdGFncyBzaW1pbGFyIChkZWZhdWx0OiAyKVxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIFNpbWlsYXJUYWdHcm91cCBvYmplY3RzXG4gICAgICovXG4gICAgYXN5bmMgZmluZFNpbWlsYXJUYWdzKHRocmVzaG9sZDogbnVtYmVyID0gMik6IFByb21pc2U8U2ltaWxhclRhZ0dyb3VwW10+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRnbHVlLmZpbmRTaW1pbGFyVGFncyh0aHJlc2hvbGQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGFncyB0aGF0IGhhdmUgbm8gZGVzY3JpcHRpb24gaW4gdGhlIFRBR0RFU0NSSVBUSU9OIHRhYmxlLlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIFRhZ1dpdGhvdXREZXNjcmlwdGlvbiBvYmplY3RzXG4gICAgICovXG4gICAgYXN5bmMgdGFnc1dpdGhvdXREZXNjcmlwdGlvbnMoKTogUHJvbWlzZTxUYWdXaXRob3V0RGVzY3JpcHRpb25bXT4ge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGdsdWUudGFnc1dpdGhvdXREZXNjcmlwdGlvbnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRhZyBkZXNjcmlwdGlvbnMgdGhhdCBhcmUgZGVmaW5lZCBidXQgbm90IHVzZWQgYnkgYW55IGRvY3VtZW50LlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIHRhZyBuYW1lc1xuICAgICAqL1xuICAgIGFzeW5jIHVudXNlZFRhZ0Rlc2NyaXB0aW9ucygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0ZGVzYy51bnVzZWRUYWdEZXNjcmlwdGlvbnMoKTtcbiAgICB9XG5cbiAgICAjZG9jTGlua0RhdGE7XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgZGF0YSBmb3IgYW4gaW50ZXJuYWwgbGlua1xuICAgICAqIHdpdGhpbiB0aGUgc2l0ZSBkb2N1bWVudHMuICBGb3JtaW5nIGFuXG4gICAgICogaW50ZXJuYWwgbGluayBpcyBhdCBhIG1pbmltdW0gdGhlIHJlbmRlcmVkXG4gICAgICogcGF0aCBmb3IgdGhlIGRvY3VtZW50IGFuZCBpdHMgdGl0bGUuXG4gICAgICogVGhlIHRlYXNlciwgaWYgYXZhaWxhYmxlLCBjYW4gYmUgdXNlZCBpblxuICAgICAqIGEgdG9vbHRpcC4gVGhlIHRodW1ibmFpbCBpcyBhbiBpbWFnZSB0aGF0XG4gICAgICogY291bGQgYmUgZGlzcGxheWVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGRvY0xpbmtEYXRhKHZwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcblxuICAgICAgICAvLyBUaGUgdnBhdGggcmVmZXJlbmNlXG4gICAgICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBwYXRoIGl0IHJlbmRlcnMgdG9cbiAgICAgICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGl0bGUgc3RyaW5nIGZyb20gdGhhdCBwYWdlXG4gICAgICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSB0ZWFzZXIgdGV4dCBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0ZWFzZXI/OiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBoZXJvIGltYWdlICh0aHVtYm5haWwpXG4gICAgICAgIHRodW1ibmFpbD86IHN0cmluZztcbiAgICB9PiB7XG5cbiAgICAgICAgaWYgKCF0aGlzLiNkb2NMaW5rRGF0YSkge1xuICAgICAgICAgICAgdGhpcy4jZG9jTGlua0RhdGEgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnZG9jLWxpbmstZGF0YS5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm91bmQgPSA8YW55W10+IGF3YWl0IHRoaXMuZGIuYWxsKHRoaXMuI2RvY0xpbmtEYXRhLCB7XG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZvdW5kKSkge1xuXG4gICAgICAgICAgICBjb25zdCBkb2MgPSBmb3VuZFswXTtcblxuICAgICAgICAgICAgLy8gaWYgKCFkb2MubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIC8vICAgICBjb25zb2xlLndhcm4oYFdBUk5JTkcgZG9jTGlua0RhdGEgbm8gbWV0YWRhdGEgZm9yICR7dnBhdGh9YCk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8vIGNvbnN0IGRvY0luZm8gPSBhd2FpdCB0aGlzLmZpbmQodnBhdGgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBkb2MucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICB0aXRsZTogZG9jLnRpdGxlLFxuICAgICAgICAgICAgICAgIHRlYXNlcjogZG9jLnRlYXNlcixcbiAgICAgICAgICAgICAgICAvLyB0aHVtYm5haWxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB0aXRsZTogdW5kZWZpbmVkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZWFyY2hDYWNoZTtcblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gZGVzY3JpcHRpdmUgc2VhcmNoIG9wZXJhdGlvbnMgdXNpbmcgZGlyZWN0IFNRTCBxdWVyaWVzXG4gICAgICogZm9yIGJldHRlciBwZXJmb3JtYW5jZSBhbmQgc2NhbGFiaWxpdHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBTZWFyY2ggb3B0aW9ucyBvYmplY3RcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlPEFycmF5PERvY3VtZW50Pj5cbiAgICAgKi9cbiAgICBhc3luYyBzZWFyY2gob3B0aW9ucyk6IFByb21pc2U8QXJyYXk8RG9jdW1lbnQ+PiB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLnNlYXJjaENhY2hlKSB7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaENhY2hlID0gbmV3IENhY2hlKFxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmlyc3QsIHNlZSBpZiB0aGUgc2VhcmNoIHJlc3VsdHMgYXJlIGFscmVhZHlcbiAgICAgICAgLy8gY29tcHV0ZWQgYW5kIGluIHRoZSBjYWNoZS5cblxuICAgICAgICAvLyBUaGUgaXNzdWUgaGVyZSBpcyB0aGF0IHRoZSBvcHRpb25zXG4gICAgICAgIC8vIG9iamVjdCBjYW4gY29udGFpbiBSZWdFeHAgdmFsdWVzLlxuICAgICAgICAvLyBUaGUgUmVnRXhwIG9iamVjdCBkb2VzIG5vdCBoYXZlXG4gICAgICAgIC8vIGEgdG9KU09OIGZ1bmN0aW9uLiAgVGhpcyBob29rXG4gICAgICAgIC8vIGNhdXNlcyBSZWdFeHAgdG8gcmV0dXJuIHRoZVxuICAgICAgICAvLyAudG9TdHJpbmcoKSB2YWx1ZSBpbnN0ZWFkLlxuICAgICAgICAvL1xuICAgICAgICAvLyBTb3VyY2U6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIwMjc2NTMxL3N0cmluZ2lmeWluZy1hLXJlZ3VsYXItZXhwcmVzc2lvblxuICAgICAgICAvL1xuICAgICAgICAvLyBBIHNpbWlsYXIgaXNzdWUgZXhpc3RzIHdpdGggRnVuY3Rpb25zXG4gICAgICAgIC8vIGluIHRoZSBvYmplY3QuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFNvdXJjZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjc1NDkxOS9qc29uLXN0cmluZ2lmeS1mdW5jdGlvblxuICAgICAgICBjb25zdCBjYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlICsgJyc7IC8vIGltcGxpY2l0bHkgYHRvU3RyaW5nYCBpdFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gQSB0aW1lb3V0IG9mIDAgbWVhbnMgdG8gZGlzYWJsZSBjYWNoaW5nXG4gICAgICAgIGNvbnN0IGNhY2hlZCA9XG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5zZWFyY2hDYWNoZS5nZXQoY2FjaGVLZXkpXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfSA9PT4gJHtjYWNoZUtleX0gJHtjYWNoZWQgPyAnaGFzQ2FjaGVkJyA6ICdub0NhY2hlZCd9YCk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGNhY2hlIGhhcyBhbiBlbnRyeSwgc2tpcCBjb21wdXRpbmdcbiAgICAgICAgLy8gYW55dGhpbmcuXG4gICAgICAgIGlmIChjYWNoZWQpIHsgLy8gMSBtaW51dGUgY2FjaGVcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOT1RFOiBFbnRyaWVzIGFyZSBhZGRlZCB0byB0aGUgY2FjaGUgYXQgdGhlIGJvdHRvbVxuICAgICAgICAvLyBvZiB0aGlzIGZ1bmN0aW9uXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgc3FsLCBwYXJhbXMgfSA9IHRoaXMuYnVpbGRTZWFyY2hRdWVyeShvcHRpb25zKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggJHtzcWx9YCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHRzXG4gICAgICAgICAgICAgICAgPSBhd2FpdCB0aGlzLmRiLmFsbChzcWwsIHBhcmFtcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50c1xuICAgICAgICAgICAgICAgID0gdGhpcy52YWxpZGF0ZVJvd3MocmVzdWx0cylcbiAgICAgICAgICAgICAgICAubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBBcHBseSBwb3N0LVNRTCBmaWx0ZXJzIHRoYXQgY2FuJ3QgYmUgZG9uZSBpbiBTUUxcbiAgICAgICAgICAgIGxldCBmaWx0ZXJlZFJlc3VsdHMgPSBkb2N1bWVudHM7XG5cbiAgICAgICAgICAgIC8vIEZpbHRlciBieSByZW5kZXJlcnMgKHJlcXVpcmVzIGNvbmZpZyBsb29rdXApXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJlcnNcbiAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVyZXJzKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbmRlcmVyID0gZmNhY2hlLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGl0ZW0udnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlbmRlcmVyKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCByIG9mIG9wdGlvbnMucmVuZGVyZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnICYmIHIgPT09IHJlbmRlcmVyLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1dBUk5JTkc6IE1hdGNoaW5nIHJlbmRlcmVyIGJ5IG9iamVjdCBjbGFzcyBpcyBubyBsb25nZXIgc3VwcG9ydGVkJywgcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBcHBseSBjdXN0b20gZmlsdGVyIGZ1bmN0aW9uXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXJmdW5jKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZmlsdGVyZnVuYyhmY2FjaGUuY29uZmlnLCBvcHRpb25zLCBpdGVtKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXBwbHkgY3VzdG9tIHNvcnQgZnVuY3Rpb24gKGlmIFNRTCBzb3J0aW5nIHdhc24ndCB1c2VkKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRGdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLnNvcnQob3B0aW9ucy5zb3J0RnVuYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFkZCB0aGUgcmVzdWx0cyB0byB0aGUgY2FjaGVcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaENhY2hlLnB1dChcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVLZXksIGZpbHRlcmVkUmVzdWx0c1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyZWRSZXN1bHRzO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5zZWFyY2ggZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCBTUUwgcXVlcnkgYW5kIHBhcmFtZXRlcnMgZm9yIHNlYXJjaCBvcHRpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZFNlYXJjaFF1ZXJ5KG9wdGlvbnMpOiB7XG4gICAgICAgIHNxbDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IGFueVxuICAgIH0ge1xuICAgICAgICBjb25zdCBwYXJhbXM6IGFueSA9IHt9O1xuICAgICAgICBjb25zdCB3aGVyZUNsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGpvaW5zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBsZXQgcGFyYW1Db3VudGVyID0gMDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgYnVpbGRTZWFyY2hRdWVyeSAke3V0aWwuaW5zcGVjdChvcHRpb25zKX1gKTtcblxuICAgICAgICAvLyBIZWxwZXIgdG8gY3JlYXRlIHVuaXF1ZSBwYXJhbWV0ZXIgbmFtZXNcbiAgICAgICAgY29uc3QgYWRkUGFyYW0gPSAodmFsdWU6IGFueSk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgJHBhcmFtJHsrK3BhcmFtQ291bnRlcn1gO1xuICAgICAgICAgICAgcGFyYW1zW3BhcmFtTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbU5hbWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQmFzZSBxdWVyeVxuICAgICAgICBsZXQgc3FsID0gYFxuICAgICAgICAgICAgU0VMRUNUIERJU1RJTkNUIGQuKiBGUk9NICR7dGhpcy5xdW90ZWREQk5hbWV9IGRcbiAgICAgICAgYDtcblxuICAgICAgICAvLyBNSU1FIHR5cGUgZmlsdGVyaW5nXG4gICAgICAgIGlmIChvcHRpb25zLm1pbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLm1pbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMubWltZSl9YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5taW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubWltZS5tYXAobWltZSA9PiBhZGRQYXJhbShtaW1lKSkuam9pbignLCAnKTtcbiAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5taW1lIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW5kZXJzIHRvIEhUTUwgZmlsdGVyaW5nXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJzVG9IVE1MID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnJlbmRlcnNUb0hUTUwgPSAke2FkZFBhcmFtKG9wdGlvbnMucmVuZGVyc1RvSFRNTCA/IDEgOiAwKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJvb3QgcGF0aCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJvb3RQYXRoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBMSUtFICR7YWRkUGFyYW0ob3B0aW9ucy5yb290UGF0aCArICclJyl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5nbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMuZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5nbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQudnBhdGggR0xPQiAke2FkZFBhcmFtKGVzY2FwZWRHbG9iKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciBnbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMucmVuZGVyZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5yZW5kZXJnbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLnJlbmRlcmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMucmVuZGVyZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5yZW5kZXJnbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBHTE9CICR7YWRkUGFyYW0oZXNjYXBlZEdsb2IpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmxvZyB0YWcgZmlsdGVyaW5nXG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBibG9ndGFncyBhcnJheSBpcyB1c2VkLFxuICAgICAgICAvLyBpZiBwcmVzZW50LCB3aXRoIHRoZSBibG9ndGFnIHZhbHVlIHVzZWRcbiAgICAgICAgLy8gb3RoZXJ3aXNlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgcHVycG9zZSBmb3IgdGhlIGJsb2d0YWdzIHZhbHVlIGlzIHRvXG4gICAgICAgIC8vIHN1cHBvcnQgYSBwc2V1ZG8tYmxvZyBtYWRlIG9mIHRoZSBpdGVtc1xuICAgICAgICAvLyBmcm9tIG11bHRpcGxlIGFjdHVhbCBibG9ncy5cbiAgICAgICAgLy8gaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAvLyAgfHwgdHlwZW9mIG9wdGlvbnMuYmxvZ3RhZyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhgIGJsb2d0YWdzICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZ3MpfSBibG9ndGFnICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZyl9YCk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5ibG9ndGFncykpIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMuYmxvZ3RhZ3MubWFwKHRhZyA9PiBhZGRQYXJhbSh0YWcpKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5ibG9ndGFnID0gJHthZGRQYXJhbShvcHRpb25zLmJsb2d0YWcpfWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQuYmxvZ3RhZyA9ICR7b3B0aW9ucy5ibG9ndGFnfWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBibG9ndGFncyBhcnJheSAke3V0aWwuaW5zcGVjdChvcHRpb25zLmJsb2d0YWdzKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRhZyBmaWx0ZXJpbmcgdXNpbmcgVEFHR0xVRSB0YWJsZVxuICAgICAgICBpZiAob3B0aW9ucy50YWcgJiYgdHlwZW9mIG9wdGlvbnMudGFnID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgam9pbnMucHVzaChgSU5ORVIgSk9JTiBUQUdHTFVFIHRnIE9OIGQudnBhdGggPSB0Zy5kb2N2cGF0aGApO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYHRnLnRhZ05hbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMudGFnKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExheW91dCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMubGF5b3V0cykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5sYXlvdXRzKSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxheW91dHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5sYXlvdXRzWzBdKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubGF5b3V0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubGF5b3V0cy5tYXAobGF5b3V0ID0+IGFkZFBhcmFtKGxheW91dCkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubGF5b3V0ID0gJHthZGRQYXJhbShvcHRpb25zLmxheW91dHMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGF0aCByZWdleCBtYXRjaGluZ1xuICAgICAgICBjb25zdCByZWdleENsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5wYXRobWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucGF0aG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5wYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciBwYXRoIHJlZ2V4IG1hdGNoaW5nXG4gICAgICAgIC8vIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3Qob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gsIGZhbHNlLCAzKSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIHN0cmluZyAke29wdGlvbnMucmVuZGVycGF0aG1hdGNofWApO1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIHJlZ2V4cCAke29wdGlvbnMucmVuZGVycGF0aG1hdGNoLnNvdXJjZX1gKTtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIGFycmF5IHN0cmluZyAke21hdGNofWApO1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIGFycmF5IHJlZ2V4cCAke21hdGNoLnNvdXJjZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdyZW5kZXJwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZWdleENsYXVzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYCgke3JlZ2V4Q2xhdXNlcy5qb2luKCcgT1IgJyl9KWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIEpPSU5zIHRvIHF1ZXJ5XG4gICAgICAgIGlmIChqb2lucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzcWwgKz0gJyAnICsgam9pbnMuam9pbignICcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIFdIRVJFIGNsYXVzZVxuICAgICAgICBpZiAod2hlcmVDbGF1c2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNxbCArPSAnIFdIRVJFICcgKyB3aGVyZUNsYXVzZXMuam9pbignIEFORCAnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBPUkRFUiBCWSBjbGF1c2VcbiAgICAgICAgbGV0IG9yZGVyQnkgPSAnJztcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRCeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIEhhbmRsZSBzcGVjaWFsIGNhc2VzIHRoYXQgbmVlZCBKU09OIGV4dHJhY3Rpb24gb3IgY29tcGxleCBsb2dpY1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25EYXRlJ1xuICAgICAgICAgICAgIHx8IG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25UaW1lJ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIENPQUxFU0NFIHRvIGhhbmRsZSBudWxsIHB1YmxpY2F0aW9uIGRhdGVzXG4gICAgICAgICAgICAgICAgb3JkZXJCeSA9IGBPUkRFUiBCWSBDT0FMRVNDRShcbiAgICAgICAgICAgICAgICAgICAgZC5wdWJsaWNhdGlvblRpbWUsXG4gICAgICAgICAgICAgICAgICAgIGQubXRpbWVNc1xuICAgICAgICAgICAgICAgIClgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIG90aGVyIGZpZWxkcywgc29ydCBieSB0aGUgY29sdW1uIGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBhbGxvd3Mgc29ydGluZyBieSBhbnkgdmFsaWQgY29sdW1uIGluIHRoZSBET0NVTUVOVFMgdGFibGVcbiAgICAgICAgICAgICAgICBvcmRlckJ5ID0gYE9SREVSIEJZIGQuJHtTcWxTdHJpbmcuZXNjYXBlSWQob3B0aW9ucy5zb3J0QnkpfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZXZlcnNlIHx8IG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZykge1xuICAgICAgICAgICAgLy8gSWYgcmV2ZXJzZS9zb3J0QnlEZXNjZW5kaW5nIGlzIHNwZWNpZmllZCB3aXRob3V0IHNvcnRCeSwgXG4gICAgICAgICAgICAvLyB1c2UgYSBkZWZhdWx0IG9yZGVyaW5nIChieSBtb2RpZmljYXRpb24gdGltZSlcbiAgICAgICAgICAgIG9yZGVyQnkgPSAnT1JERVIgQlkgZC5tdGltZU1zJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBzb3J0IGRpcmVjdGlvblxuICAgICAgICBpZiAob3JkZXJCeSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZyB8fCBvcHRpb25zLnJldmVyc2UpIHtcbiAgICAgICAgICAgICAgICBvcmRlckJ5ICs9ICcgREVTQyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9yZGVyQnkgKz0gJyBBU0MnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3FsICs9ICcgJyArIG9yZGVyQnk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgTElNSVQgYW5kIE9GRlNFVFxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubGltaXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBzcWwgKz0gYCBMSU1JVCAke2FkZFBhcmFtKG9wdGlvbnMubGltaXQpfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHNxbCArPSBgIE9GRlNFVCAke2FkZFBhcmFtKG9wdGlvbnMub2Zmc2V0KX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgc3FsLCBwYXJhbXMgfTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IHZhciBhc3NldHNDYWNoZTogQXNzZXRzQ2FjaGU7XG5leHBvcnQgdmFyIHBhcnRpYWxzQ2FjaGU6IFBhcnRpYWxzQ2FjaGU7XG5leHBvcnQgdmFyIGxheW91dHNDYWNoZTogTGF5b3V0c0NhY2hlO1xuZXhwb3J0IHZhciBkb2N1bWVudHNDYWNoZTogRG9jdW1lbnRzQ2FjaGU7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZGI6IEFzeW5jRGF0YWJhc2Vcbik6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgLy8gSW5pdGlhbGl6ZSB0YWcgYW5kIHRhZyBkZXNjcmlwdGlvbiBzdXBwb3J0ICh1c2VkIGJ5IERvY3VtZW50c0NhY2hlKVxuICAgIGF3YWl0IHRnbHVlLmluaXQoZGIpO1xuICAgIGF3YWl0IHRkZXNjLmluaXQoZGIpO1xuXG4gICAgLy8gSGVscGVyIHRvIHNldHVwIHZlcmJvc2UgZXZlbnQgbGlzdGVuZXJzIGlmIHZlcmJvc2UgbW9kZSBpcyBlbmFibGVkXG4gICAgY29uc3Qgc2V0dXBWZXJib3NlTGlzdGVuZXJzID0gKGNhY2hlOiBhbnksIGNhY2hlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmIChjb25maWcudmVyYm9zZSkge1xuICAgICAgICAgICAgY2FjaGUub24oJ2FkZGVkJywgKG5hbWU6IHN0cmluZywgdnBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQURERURdICR7bmFtZX06ICR7dnBhdGh9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FjaGUub24oJ3JlYWR5JywgKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbUkVBRFldICR7bmFtZX1cXG5gKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjYWNoZS5vbignZXJyb3InLCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtFUlJPUl0gJHtjYWNoZU5hbWV9OmAsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQWx3YXlzIHNldHVwIGVycm9yIGxpc3RlbmVyLCBldmVuIGluIG5vbi12ZXJib3NlIG1vZGVcbiAgICAgICAgICAgIGNhY2hlLm9uKCdlcnJvcicsICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjYWNoZU5hbWV9IEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8vLyBBU1NFVFNcblxuICAgIGF3YWl0IGRvQ3JlYXRlQXNzZXRzVGFibGUoZGIpO1xuXG4gICAgYXNzZXRzQ2FjaGUgPSBuZXcgQXNzZXRzQ2FjaGUoXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2Fzc2V0cycsXG4gICAgICAgIGNvbmZpZy5hc3NldERpcnMsXG4gICAgICAgIGRiLFxuICAgICAgICAnQVNTRVRTJ1xuICAgICk7XG4gICAgXG4gICAgc2V0dXBWZXJib3NlTGlzdGVuZXJzKGFzc2V0c0NhY2hlLCAnYXNzZXRzQ2FjaGUnKTtcbiAgICBcbiAgICBhd2FpdCBhc3NldHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgLy8vLyBQQVJUSUFMU1xuXG4gICAgYXdhaXQgZG9DcmVhdGVQYXJ0aWFsc1RhYmxlKGRiKTtcblxuICAgIHBhcnRpYWxzQ2FjaGUgPSBuZXcgUGFydGlhbHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAncGFydGlhbHMnLFxuICAgICAgICBjb25maWcucGFydGlhbHNEaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ1BBUlRJQUxTJ1xuICAgICk7XG4gICAgXG4gICAgc2V0dXBWZXJib3NlTGlzdGVuZXJzKHBhcnRpYWxzQ2FjaGUsICdwYXJ0aWFsc0NhY2hlJyk7XG4gICAgXG4gICAgYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgLy8vLyBMQVlPVVRTXG5cbiAgICBhd2FpdCBkb0NyZWF0ZUxheW91dHNUYWJsZShkYik7XG5cbiAgICBsYXlvdXRzQ2FjaGUgPSBuZXcgTGF5b3V0c0NhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdsYXlvdXRzJyxcbiAgICAgICAgY29uZmlnLmxheW91dERpcnMsXG4gICAgICAgIGRiLFxuICAgICAgICAnTEFZT1VUUydcbiAgICApO1xuICAgIFxuICAgIHNldHVwVmVyYm9zZUxpc3RlbmVycyhsYXlvdXRzQ2FjaGUsICdsYXlvdXRzQ2FjaGUnKTtcbiAgICBcbiAgICBhd2FpdCBsYXlvdXRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIC8vLy8gRE9DVU1FTlRTXG5cbiAgICBhd2FpdCBkb0NyZWF0ZURvY3VtZW50c1RhYmxlKGRiKTtcbiAgICBhd2FpdCBkb0NyZWF0ZVZlY0RvY3VtZW50c1RhYmxlKGRiKTtcblxuICAgIGRvY3VtZW50c0NhY2hlID0gbmV3IERvY3VtZW50c0NhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdkb2N1bWVudHMnLFxuICAgICAgICBjb25maWcuZG9jdW1lbnREaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ0RPQ1VNRU5UUydcbiAgICApO1xuICAgIFxuICAgIHNldHVwVmVyYm9zZUxpc3RlbmVycyhkb2N1bWVudHNDYWNoZSwgJ2RvY3VtZW50c0NhY2hlJyk7XG4gICAgXG4gICAgYXdhaXQgZG9jdW1lbnRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIGF3YWl0IGNvbmZpZy5ob29rUGx1Z2luQ2FjaGVTZXR1cCgpO1xuXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZUZpbGVDYWNoZXMoKSB7XG4gICAgaWYgKGRvY3VtZW50c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGRvY3VtZW50c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoYXNzZXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgYXNzZXRzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgYXNzZXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChsYXlvdXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgbGF5b3V0c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGxheW91dHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHBhcnRpYWxzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgcGFydGlhbHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBwYXJ0aWFsc0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbn1cbiJdfQ==