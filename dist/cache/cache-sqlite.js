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
var _BaseCache_instances, _BaseCache_config, _BaseCache_name, _BaseCache_dirs, _BaseCache_is_ready, _BaseCache_db, _BaseCache_dbname, _BaseCache_watcher, _BaseCache_queue, _BaseCache_fExistsInDir, _AssetsCache_insertDocAssets, _AssetsCache_updateDocAssets, _PartialsCache_insertDocPartials, _PartialsCache_updateDocPartials, _LayoutsCache_insertDocLayouts, _LayoutsCache_updateDocLayouts, _DocumentsCache_insertDocDocuments, _DocumentsCache_updateDocDocuments, _DocumentsCache_siblingsSQL, _DocumentsCache_docsForDirname, _DocumentsCache_dirsForParentdir, _DocumentsCache_indexFilesSQL, _DocumentsCache_filesForSetTimes, _DocumentsCache_docLinkData;
import FS, { promises as fsp } from 'node:fs';
import { DirsWatcher } from '@akashacms/stacked-dirs';
import path from 'node:path';
import util from 'node:util';
import EventEmitter from 'events';
import micromatch from 'micromatch';
import fastq from 'fastq';
import { TagGlue, TagDescriptions } from './tag-glue-new.js';
import { doCreateAssetsTable, doCreateDocumentsTable, doCreateLayoutsTable, doCreatePartialsTable, validateAsset, validateDocument, validateLayout, validatePartial, validatePathsReturnType } from './schema.js';
import SqlString from 'sqlstring-sqlite';
import Cache from 'cache';
const tglue = new TagGlue();
// tglue.init(sqdb._db);
const tdesc = new TagDescriptions();
// tdesc.init(sqdb._db);
// Convert AkashaCMS mount points into the mountpoint
// used by DirsWatcher
const remapdirs = (dirz) => {
    return dirz.map(dir => {
        // console.log('document dir ', dir);
        if (typeof dir === 'string') {
            return {
                mounted: dir,
                mountPoint: '/',
                baseMetadata: {}
            };
        }
        else {
            if (!dir.dest) {
                throw new Error(`remapdirs invalid mount specification ${util.inspect(dir)}`);
            }
            return {
                mounted: dir.src,
                mountPoint: dir.dest,
                baseMetadata: dir.baseMetadata,
                ignore: dir.ignore
            };
        }
    });
};
export class BaseCache extends EventEmitter {
    /**
     * @param config AkashaRender Configuration object
     * @param dirs array of directories and mount points to watch
     * @param name string giving the name for this watcher name
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
        _BaseCache_watcher.set(this, void 0);
        _BaseCache_queue.set(this, void 0);
        this.findPathMountedSQL = new Map();
        this.findByPathSQL = new Map();
        this.handleUnlinkedSQL = new Map();
        this.pathsSQL = new Map();
        // console.log(`BaseFileCache ${name} constructor dirs=${util.inspect(dirs)}`);
        __classPrivateFieldSet(this, _BaseCache_config, config, "f");
        __classPrivateFieldSet(this, _BaseCache_name, name, "f");
        __classPrivateFieldSet(this, _BaseCache_dirs, dirs, "f");
        __classPrivateFieldSet(this, _BaseCache_is_ready, false, "f");
        __classPrivateFieldSet(this, _BaseCache_db, db, "f");
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
        if (__classPrivateFieldGet(this, _BaseCache_queue, "f")) {
            __classPrivateFieldGet(this, _BaseCache_queue, "f").killAndDrain();
            __classPrivateFieldSet(this, _BaseCache_queue, undefined, "f");
        }
        if (__classPrivateFieldGet(this, _BaseCache_watcher, "f")) {
            // console.log(`CLOSING ${this.name}`);
            await __classPrivateFieldGet(this, _BaseCache_watcher, "f").close();
            __classPrivateFieldSet(this, _BaseCache_watcher, undefined, "f");
        }
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
     * Set up receiving events from DirsWatcher, and dispatching to
     * the handler methods.
     */
    async setup() {
        const fcache = this;
        if (__classPrivateFieldGet(this, _BaseCache_watcher, "f")) {
            await __classPrivateFieldGet(this, _BaseCache_watcher, "f").close();
        }
        __classPrivateFieldSet(this, _BaseCache_queue, fastq.promise(async function (event) {
            if (event.code === 'changed') {
                try {
                    // console.log(`change ${event.name} ${event.info.vpath}`);
                    await fcache.handleChanged(event.name, event.info);
                    fcache.emit('change', event.name, event.info);
                }
                catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        name: event.name,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            }
            else if (event.code === 'added') {
                try {
                    // console.log(`add ${event.name} ${event.info.vpath}`);
                    await fcache.handleAdded(event.name, event.info);
                    fcache.emit('add', event.name, event.info);
                }
                catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        name: event.name,
                        vpath: event.info.vpath,
                        info: event.info,
                        error: e
                    });
                }
            }
            else if (event.code === 'unlinked') {
                try {
                    // console.log(`unlink ${event.name} ${event.info.vpath}`, event.info);
                    await fcache.handleUnlinked(event.name, event.info);
                    fcache.emit('unlink', event.name, event.info);
                }
                catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        name: event.name,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
                /* } else if (event.code === 'error') {
                    await fcache.handleError(event.name) */
            }
            else if (event.code === 'ready') {
                await fcache.handleReady(event.name);
                fcache.emit('ready', event.name);
            }
        }, 10), "f");
        __classPrivateFieldSet(this, _BaseCache_watcher, new DirsWatcher(this.name), "f");
        __classPrivateFieldGet(this, _BaseCache_watcher, "f").on('change', async (name, info) => {
            // console.log(`${name} changed ${info.mountPoint} ${info.vpath}`);
            try {
                if (!this.ignoreFile(info)) {
                    // console.log(`PUSH ${name} changed ${info.mountPoint} ${info.vpath}`);
                    __classPrivateFieldGet(this, _BaseCache_queue, "f").push({
                        code: 'changed',
                        name, info
                    });
                }
                else {
                    console.log(`Ignored 'change' for ${info.vpath}`);
                }
            }
            catch (err) {
                console.error(`FAIL change ${info.vpath} because ${err.stack}`);
            }
        })
            .on('add', async (name, info) => {
            try {
                // console.log(`${name} add ${info.mountPoint} ${info.vpath}`);
                if (!this.ignoreFile(info)) {
                    // console.log(`PUSH ${name} add ${info.mountPoint} ${info.vpath}`);
                    __classPrivateFieldGet(this, _BaseCache_queue, "f").push({
                        code: 'added',
                        name, info
                    });
                }
                else {
                    console.log(`Ignored 'add' for ${info.vpath}`);
                }
            }
            catch (err) {
                console.error(`FAIL add ${info.vpath} because ${err.stack}`);
            }
        })
            .on('unlink', async (name, info) => {
            // console.log(`unlink ${name} ${info.vpath}`);
            try {
                if (!this.ignoreFile(info)) {
                    __classPrivateFieldGet(this, _BaseCache_queue, "f").push({
                        code: 'unlinked',
                        name, info
                    });
                }
                else {
                    console.log(`Ignored 'unlink' for ${info.vpath}`);
                }
            }
            catch (err) {
                console.error(`FAIL unlink ${info.vpath} because ${err.stack}`);
            }
        })
            .on('ready', async (name) => {
            // console.log(`${name} ready`);
            __classPrivateFieldGet(this, _BaseCache_queue, "f").push({
                code: 'ready',
                name
            });
        });
        const mapped = remapdirs(this.dirs);
        // console.log(`setup ${this.#name} watch ${util.inspect(this.#dirs)} ==> ${util.inspect(mapped)}`);
        await __classPrivateFieldGet(this, _BaseCache_watcher, "f").watch(mapped);
        // console.log(`DAO ${this.dao.table.name} ${util.inspect(this.dao.table.fields)}`);
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
    async handleChanged(name, info) {
        // console.log(`PROCESS ${name} handleChanged`, info.vpath);
        if (this.ignoreFile(info)) {
            // console.log(`OOOOOOOOGA!!! Received a file that should be ingored `, info);
            return;
        }
        if (name !== this.name) {
            throw new Error(`handleChanged event for wrong name; got ${name}, expected ${this.name}`);
        }
        // console.log(`handleChanged ${info.vpath} ${info.metadata && info.metadata.publicationDate ? info.metadata.publicationDate : '???'}`);
        this.gatherInfoData(info);
        info.stack = undefined;
        const result = await this.findPathMounted(info.vpath, info.mounted);
        if (!Array.isArray(result)
            || result.length <= 0) {
            // It wasn't found in the database.
            // Hence we should add it.
            return this.handleAdded(name, info);
        }
        info.stack = undefined;
        await this.updateDocInDB(info);
        await this.config.hookFileChanged(name, info);
    }
    /**
     * We receive this:
     *
     * {
     *    fspath: fspath,
     *    vpath: vpath,
     *    mime: mime.getType(fspath),
     *    mounted: dir.mounted,
     *    mountPoint: dir.mountPoint,
     *    pathInMounted: computed relative path
     *    stack: [ array of these instances ]
     * }
     *
     * Need to add:
     *    renderPath
     *    And for HTML render files, add the baseMetadata and docMetadata
     *
     * Should remove the stack, since it's likely not useful to us.
     */
    async handleAdded(name, info) {
        //  console.log(`PROCESS ${name} handleAdded`, info.vpath);
        if (this.ignoreFile(info)) {
            // console.log(`OOOOOOOOGA!!! Received a file that should be ingored `, info);
            return;
        }
        if (name !== this.name) {
            throw new Error(`handleAdded event for wrong name; got ${name}, expected ${this.name}`);
        }
        this.gatherInfoData(info);
        info.stack = undefined;
        await this.insertDocToDB(info);
        await this.config.hookFileAdded(name, info);
    }
    async insertDocToDB(info) {
        throw new Error(`insertDocToDB must be overridden`);
    }
    async updateDocInDB(info) {
        throw new Error(`updateDocInDB must be overridden`);
    }
    async handleUnlinked(name, info) {
        // console.log(`PROCESS ${name} handleUnlinked`, info.vpath);
        if (name !== this.name) {
            throw new Error(`handleUnlinked event for wrong name; got ${name}, expected ${this.name}`);
        }
        await this.config.hookFileUnlinked(name, info);
        let sql = this.handleUnlinkedSQL.get(this.dbname);
        if (!sql) {
            sql = SqlString.format(await fsp.readFile(path.join(import.meta.dirname, 'sql', 'handle-unlinked.sql')), [this.dbname]);
            this.handleUnlinkedSQL.set(this.dbname, sql);
        }
        await this.db.run(sql, {
            $vpath: info.vpath,
            $mounted: info.mounted
        });
        // await this.#dao.deleteAll({
        //     vpath: { eq: info.vpath },
        //     mounted: { eq: info.mounted }
        // } as Where<T>);
    }
    async handleReady(name) {
        // console.log(`PROCESS ${name} handleReady`);
        if (name !== this.name) {
            throw new Error(`handleReady event for wrong name; got ${name}, expected ${this.name}`);
        }
        __classPrivateFieldSet(this, _BaseCache_is_ready, true, "f");
        this.emit('ready', name);
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
        const mapped = remapdirs(this.dirs);
        for (const dir of mapped) {
            // console.log(`dirMount for ${info.vpath} -- ${util.inspect(info)} === ${util.inspect(dir)}`);
            if (info.mountPoint === dir.mountPoint) {
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
        const fcache = this;
        const mapped = remapdirs(this.dirs);
        // console.log(`findSync looking for ${fpath} in ${util.inspect(mapped)}`);
        for (const dir of mapped) {
            if (!(dir?.mountPoint)) {
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
_BaseCache_config = new WeakMap(), _BaseCache_name = new WeakMap(), _BaseCache_dirs = new WeakMap(), _BaseCache_is_ready = new WeakMap(), _BaseCache_db = new WeakMap(), _BaseCache_dbname = new WeakMap(), _BaseCache_watcher = new WeakMap(), _BaseCache_queue = new WeakMap(), _BaseCache_instances = new WeakSet(), _BaseCache_fExistsInDir = function _BaseCache_fExistsInDir(fpath, dir) {
    // console.log(`#fExistsInDir ${fpath} ${util.inspect(dir)}`);
    if (dir.mountPoint === '/') {
        const fspath = path.join(dir.mounted, fpath);
        let fsexists = FS.existsSync(fspath);
        if (fsexists) {
            let stats = FS.statSync(fspath);
            return {
                vpath: fpath,
                renderPath: fpath,
                fspath: fspath,
                mime: undefined,
                mounted: dir.mounted,
                mountPoint: dir.mountPoint,
                pathInMounted: fpath,
                statsMtime: stats.mtimeMs
            };
        }
        else {
            return undefined;
        }
    }
    let mp = dir.mountPoint.startsWith('/')
        ? dir.mountPoint.substring(1)
        : dir.mountPoint;
    mp = mp.endsWith('/')
        ? mp
        : (mp + '/');
    if (fpath.startsWith(mp)) {
        let pathInMounted = fpath.replace(dir.mountPoint, '');
        let fspath = path.join(dir.mounted, pathInMounted);
        // console.log(`Checking exist for ${dir.mountPoint} ${dir.mounted} ${pathInMounted} ${fspath}`);
        let fsexists = FS.existsSync(fspath);
        if (fsexists) {
            let stats = FS.statSync(fspath);
            return {
                vpath: fpath,
                renderPath: fpath,
                fspath: fspath,
                mime: undefined,
                mounted: dir.mounted,
                mountPoint: dir.mountPoint,
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
        _DocumentsCache_updateDocDocuments.set(this, void 0);
        _DocumentsCache_siblingsSQL.set(this, void 0);
        _DocumentsCache_docsForDirname.set(this, void 0);
        _DocumentsCache_dirsForParentdir.set(this, void 0);
        _DocumentsCache_indexFilesSQL.set(this, void 0);
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
        for (let dir of remapdirs(this.dirs)) {
            if (dir.mounted === info.mounted) {
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
        // console.log(toInsert);
        await this.db.run(__classPrivateFieldGet(this, _DocumentsCache_insertDocDocuments, "f"), toInsert);
        // await this.dao.insert(docInfo);
        if (info.metadata) {
            await this.addDocTagGlue(info.vpath, info.metadata.tags);
        }
    }
    async updateDocInDB(info) {
        if (!__classPrivateFieldGet(this, _DocumentsCache_updateDocDocuments, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_updateDocDocuments, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'update-doc-documents.sql'), 'utf-8'), "f");
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
    async handleUnlinked(name, info) {
        await super.handleUnlinked(name, info);
        tglue.deleteTagGlue(info.vpath);
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
            __classPrivateFieldSet(this, _DocumentsCache_dirsForParentdir, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'dirs-for-dirname.sql'), 'utf-8'), "f");
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
        // Optionally appendable sub-query
        // to handle when rootPath is specified
        let rootQ = (typeof rootP === 'string'
            && rootP.length >= 1)
            ? ` AND ( renderPath LIKE '${rootP}%' )`
            : '';
        if (!__classPrivateFieldGet(this, _DocumentsCache_indexFilesSQL, "f")) {
            __classPrivateFieldSet(this, _DocumentsCache_indexFilesSQL, await fsp.readFile(path.join(import.meta.dirname, 'sql', 'index-doc-files.sql'), 'utf-8'), "f");
        }
        const indexes = await this.db.all(__classPrivateFieldGet(this, _DocumentsCache_indexFilesSQL, "f") + rootQ + ';');
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
            // const docInfo = await this.find(vpath);
            return {
                vpath,
                renderPath: doc.renderPath,
                title: doc.metadata.title,
                teaser: doc.metadata.teaser,
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
                orderBy = `ORDER BY d.${options.sortBy}`;
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
_DocumentsCache_insertDocDocuments = new WeakMap(), _DocumentsCache_updateDocDocuments = new WeakMap(), _DocumentsCache_siblingsSQL = new WeakMap(), _DocumentsCache_docsForDirname = new WeakMap(), _DocumentsCache_dirsForParentdir = new WeakMap(), _DocumentsCache_indexFilesSQL = new WeakMap(), _DocumentsCache_filesForSetTimes = new WeakMap(), _DocumentsCache_docLinkData = new WeakMap();
export var assetsCache;
export var partialsCache;
export var layoutsCache;
export var documentsCache;
export async function setup(config, db) {
    //// ASSETS
    await doCreateAssetsTable(db);
    assetsCache = new AssetsCache(config, 'assets', config.assetDirs, db, 'ASSETS');
    await assetsCache.setup();
    assetsCache.on('error', (...args) => {
        console.error(`assetsCache ERROR ${util.inspect(args)}`);
    });
    //// PARTIALS
    await doCreatePartialsTable(db);
    partialsCache = new PartialsCache(config, 'partials', config.partialsDirs, db, 'PARTIALS');
    await partialsCache.setup();
    partialsCache.on('error', (...args) => {
        console.error(`partialsCache ERROR ${util.inspect(args)}`);
    });
    //// LAYOUTS
    await doCreateLayoutsTable(db);
    layoutsCache = new LayoutsCache(config, 'layouts', config.layoutDirs, db, 'LAYOUTS');
    await layoutsCache.setup();
    layoutsCache.on('error', (...args) => {
        console.error(`layoutsCache ERROR ${util.inspect(args)}`);
    });
    //// DOCUMENTS
    await doCreateDocumentsTable(db);
    documentsCache = new DocumentsCache(config, 'documents', config.documentDirs, db, 'DOCUMENTS');
    await documentsCache.setup();
    await tglue.init(db);
    await tdesc.init(db);
    documentsCache.on('error', (err) => {
        console.error(`documentsCache ERROR ${util.inspect(err)}`);
        // process.exit(0);
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUtc3FsaXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NhY2hlL2NhY2hlLXNxbGl0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDOUMsT0FBTyxFQUNILFdBQVcsRUFDZCxNQUFNLHlCQUF5QixDQUFDO0FBSWpDLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxZQUFZLE1BQU0sUUFBUSxDQUFDO0FBQ2xDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUNILE9BQU8sRUFBRSxlQUFlLEVBQzNCLE1BQU0sbUJBQW1CLENBQUM7QUFDM0IsT0FBTyxFQUtILG1CQUFtQixFQUNuQixzQkFBc0IsRUFDdEIsb0JBQW9CLEVBQ3BCLHFCQUFxQixFQUNKLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLHVCQUF1QixFQUM3RyxNQUFNLGFBQWEsQ0FBQztBQUlyQixPQUFPLFNBQVMsTUFBTSxrQkFBa0IsQ0FBQztBQVF6QyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFFMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM1Qix3QkFBd0I7QUFFeEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztBQUNwQyx3QkFBd0I7QUFFeEIscURBQXFEO0FBQ3JELHNCQUFzQjtBQUN0QixNQUFNLFNBQVMsR0FBRyxDQUFDLElBQWtCLEVBQWdCLEVBQUU7SUFDbkQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ2xCLHFDQUFxQztRQUNyQyxJQUFJLE9BQU8s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Q0FBQztJQUNGLE1BQU0sY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzdCLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNyQixNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFckIsY0FBYyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUMvQixPQUFPLENBQUMsS0FBSyxDQUFDLHdCQUF3QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMzRCxtQkFBbUI7SUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBRXhDLENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLGVBQWU7SUFDakMsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUNqQixNQUFNLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM3QixjQUFjLEdBQUcsU0FBUyxDQUFDO0lBQy9CLENBQUM7SUFDRCxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2QsTUFBTSxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsV0FBVyxHQUFHLFNBQVMsQ0FBQztJQUM1QixDQUFDO0lBQ0QsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUNmLE1BQU0sWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzNCLFlBQVksR0FBRyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUNELElBQUksYUFBYSxFQUFFLENBQUM7UUFDaEIsTUFBTSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDNUIsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUM5QixDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IEZTLCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHtcbiAgICBEaXJzV2F0Y2hlciwgZGlyVG9XYXRjaCwgVlBhdGhEYXRhXG59IGZyb20gJ0Bha2FzaGFjbXMvc3RhY2tlZC1kaXJzJztcbmltcG9ydCB7XG4gICAgQ29uZmlndXJhdGlvbiwgZGlyVG9Nb3VudCwgaW5kZXhDaGFpbkl0ZW1cbn0gZnJvbSAnLi4vaW5kZXguanMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQge1xuICAgIFRhZ0dsdWUsIFRhZ0Rlc2NyaXB0aW9uc1xufSBmcm9tICcuL3RhZy1nbHVlLW5ldy5qcyc7XG5pbXBvcnQge1xuICAgIGNyZWF0ZUFzc2V0c1RhYmxlLFxuICAgIGNyZWF0ZURvY3VtZW50c1RhYmxlLFxuICAgIGNyZWF0ZUxheW91dHNUYWJsZSxcbiAgICBjcmVhdGVQYXJ0aWFsc1RhYmxlLFxuICAgIGRvQ3JlYXRlQXNzZXRzVGFibGUsXG4gICAgZG9DcmVhdGVEb2N1bWVudHNUYWJsZSxcbiAgICBkb0NyZWF0ZUxheW91dHNUYWJsZSxcbiAgICBkb0NyZWF0ZVBhcnRpYWxzVGFibGUsXG4gICAgUGF0aHNSZXR1cm5UeXBlLCB2YWxpZGF0ZUFzc2V0LCB2YWxpZGF0ZURvY3VtZW50LCB2YWxpZGF0ZUxheW91dCwgdmFsaWRhdGVQYXJ0aWFsLCB2YWxpZGF0ZVBhdGhzUmV0dXJuVHlwZVxufSBmcm9tICcuL3NjaGVtYS5qcyc7XG5cbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnc3FsaXRlMyc7XG5pbXBvcnQgeyBBc3luY0RhdGFiYXNlIH0gZnJvbSAncHJvbWlzZWQtc3FsaXRlMyc7XG5pbXBvcnQgU3FsU3RyaW5nIGZyb20gJ3NxbHN0cmluZy1zcWxpdGUnO1xuaW1wb3J0IHtcbiAgICBCYXNlQ2FjaGVFbnRyeSxcbiAgICBBc3NldCxcbiAgICBQYXJ0aWFsLFxuICAgIExheW91dCxcbiAgICBEb2N1bWVudFxufSBmcm9tICcuL3NjaGVtYS5qcyc7XG5pbXBvcnQgQ2FjaGUgZnJvbSAnY2FjaGUnO1xuXG5jb25zdCB0Z2x1ZSA9IG5ldyBUYWdHbHVlKCk7XG4vLyB0Z2x1ZS5pbml0KHNxZGIuX2RiKTtcblxuY29uc3QgdGRlc2MgPSBuZXcgVGFnRGVzY3JpcHRpb25zKCk7XG4vLyB0ZGVzYy5pbml0KHNxZGIuX2RiKTtcblxuLy8gQ29udmVydCBBa2FzaGFDTVMgbW91bnQgcG9pbnRzIGludG8gdGhlIG1vdW50cG9pbnRcbi8vIHVzZWQgYnkgRGlyc1dhdGNoZXJcbmNvbnN0IHJlbWFwZGlycyA9IChkaXJ6OiBkaXJUb01vdW50W10pOiBkaXJUb1dhdGNoW10gPT4ge1xuICAgIHJldHVybiBkaXJ6Lm1hcChkaXIgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZG9jdW1lbnQgZGlyICcsIGRpcik7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogJy8nLFxuICAgICAgICAgICAgICAgIGJhc2VNZXRhZGF0YToge31cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWRpci5kZXN0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW1hcGRpcnMgaW52YWxpZCBtb3VudCBzcGVjaWZpY2F0aW9uICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5zcmMsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLmRlc3QsXG4gICAgICAgICAgICAgICAgYmFzZU1ldGFkYXRhOiBkaXIuYmFzZU1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGlnbm9yZTogZGlyLmlnbm9yZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuZXhwb3J0IGNsYXNzIEJhc2VDYWNoZTxcbiAgICBUIGV4dGVuZHMgQmFzZUNhY2hlRW50cnlcbj4gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgI2NvbmZpZz86IENvbmZpZ3VyYXRpb247XG4gICAgI25hbWU/OiBzdHJpbmc7XG4gICAgI2RpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2lzX3JlYWR5OiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAjZGI6IEFzeW5jRGF0YWJhc2U7XG4gICAgI2RibmFtZTogc3RyaW5nO1xuXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICAgICAqIEBwYXJhbSBkaXJzIGFycmF5IG9mIGRpcmVjdG9yaWVzIGFuZCBtb3VudCBwb2ludHMgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gbmFtZSBzdHJpbmcgZ2l2aW5nIHRoZSBuYW1lIGZvciB0aGlzIHdhdGNoZXIgbmFtZVxuICAgICAqIEBwYXJhbSBkYiBUaGUgUFJPTUlTRUQgU1FMSVRFMyBBc3luY0RhdGFiYXNlIGluc3RhbmNlIHRvIHVzZVxuICAgICAqIEBwYXJhbSBkYm5hbWUgVGhlIGRhdGFiYXNlIG5hbWUgdG8gdXNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb01vdW50W10sXG4gICAgICAgIGRiOiBBc3luY0RhdGFiYXNlLFxuICAgICAgICBkYm5hbWU6IHN0cmluZ1xuICAgICkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQmFzZUZpbGVDYWNoZSAke25hbWV9IGNvbnN0cnVjdG9yIGRpcnM9JHt1dGlsLmluc3BlY3QoZGlycyl9YCk7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy4jbmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuI2RpcnMgPSBkaXJzO1xuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNkYiA9IGRiO1xuICAgICAgICB0aGlzLiNkYm5hbWUgPSBkYm5hbWU7XG4gICAgfVxuXG4gICAgZ2V0IGNvbmZpZygpICAgICB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICBnZXQgbmFtZSgpICAgICAgIHsgcmV0dXJuIHRoaXMuI25hbWU7IH1cbiAgICBnZXQgZGlycygpICAgICAgIHsgcmV0dXJuIHRoaXMuI2RpcnM7IH1cbiAgICBnZXQgZGIoKSAgICAgICAgIHsgcmV0dXJuIHRoaXMuI2RiOyB9XG4gICAgZ2V0IGRibmFtZSgpICAgICB7IHJldHVybiB0aGlzLiNkYm5hbWU7IH1cbiAgICBnZXQgcXVvdGVkREJOYW1lKCkge1xuICAgICAgICByZXR1cm4gU3FsU3RyaW5nLmVzY2FwZSh0aGlzLiNkYm5hbWUpO1xuICAgIH1cblxuICAgICN3YXRjaGVyOiBEaXJzV2F0Y2hlcjtcbiAgICAjcXVldWU7XG5cbiAgICBhc3luYyBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuI3F1ZXVlKSB7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZS5raWxsQW5kRHJhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLiN3YXRjaGVyKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0xPU0lORyAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuI3dhdGNoZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2NoYW5nZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2FkZGVkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCd1bmxpbmtlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVhZHknKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy4jZGIuY2xvc2UoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYCR7dGhpcy5uYW1lfSBlcnJvciBvbiBjbG9zZSAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHVwIHJlY2VpdmluZyBldmVudHMgZnJvbSBEaXJzV2F0Y2hlciwgYW5kIGRpc3BhdGNoaW5nIHRvXG4gICAgICogdGhlIGhhbmRsZXIgbWV0aG9kcy5cbiAgICAgKi9cbiAgICBhc3luYyBzZXR1cCgpIHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBpZiAodGhpcy4jd2F0Y2hlcikge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy4jd2F0Y2hlci5jbG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jcXVldWUgPSBmYXN0cS5wcm9taXNlKGFzeW5jIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmNvZGUgPT09ICdjaGFuZ2VkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGFuZ2UgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVDaGFuZ2VkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnY2hhbmdlJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAnYWRkZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGFkZCAke2V2ZW50Lm5hbWV9ICR7ZXZlbnQuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZUFkZGVkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnYWRkJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mbzogZXZlbnQuaW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ3VubGlua2VkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGB1bmxpbmsgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVVbmxpbmtlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ3VubGluaycsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVFcnJvcihldmVudC5uYW1lKSAqL1xuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAncmVhZHknKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZVJlYWR5KGV2ZW50Lm5hbWUpO1xuICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdyZWFkeScsIGV2ZW50Lm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMCk7XG5cbiAgICAgICAgdGhpcy4jd2F0Y2hlciA9IG5ldyBEaXJzV2F0Y2hlcih0aGlzLm5hbWUpO1xuXG4gICAgICAgIHRoaXMuI3dhdGNoZXIub24oJ2NoYW5nZScsIGFzeW5jIChuYW1lOiBzdHJpbmcsIGluZm86IFZQYXRoRGF0YSkgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gY2hhbmdlZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFVTSCAke25hbWV9IGNoYW5nZWQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICdjaGFuZ2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ2NoYW5nZScgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIGNoYW5nZSAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignYWRkJywgYXN5bmMgKG5hbWU6IHN0cmluZywgaW5mbzogVlBhdGhEYXRhKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IGFkZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBQVVNIICR7bmFtZX0gYWRkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnYWRkZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAnYWRkJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgYWRkICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCd1bmxpbmsnLCBhc3luYyAobmFtZTogc3RyaW5nLCBpbmZvOiBWUGF0aERhdGEpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGB1bmxpbmsgJHtuYW1lfSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ3VubGlua2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ3VubGluaycgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCB1bmxpbmsgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ3JlYWR5JywgYXN5bmMgKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gcmVhZHlgKTtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvZGU6ICdyZWFkeScsXG4gICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2V0dXAgJHt0aGlzLiNuYW1lfSB3YXRjaCAke3V0aWwuaW5zcGVjdCh0aGlzLiNkaXJzKX0gPT0+ICR7dXRpbC5pbnNwZWN0KG1hcHBlZCl9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIud2F0Y2gobWFwcGVkKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgREFPICR7dGhpcy5kYW8udGFibGUubmFtZX0gJHt1dGlsLmluc3BlY3QodGhpcy5kYW8udGFibGUuZmllbGRzKX1gKTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIGFuIGl0ZW0sIHdoaWNoIGlzIGV4cGVjdGVkIHRvIGJlXG4gICAgICogYSByb3cgZnJvbSBkYXRhYmFzZSBxdWVyeSByZXN1bHRzLCB1c2luZ1xuICAgICAqIG9uZSBvZiB0aGUgdmFsaWRhdG9yIGZ1bmN0aW9ucyBpbiBzY2hlbWEudHMuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIG11c3QgYmUgc3ViY2xhc3NlZCB0b1xuICAgICAqIGZ1bmN0aW9uIGNvcnJlY3RseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb3cgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93KHJvdzogYW55KTogVCB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdmFsaWRhdGVSb3cgbXVzdCBiZSBzdWJjbGFzc2VkYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGUgYW4gYXJyYXksIHdoaWNoIGlzIGV4cGVjdGVkIHRvIGJlXG4gICAgICogZGF0YWJhc2UgcXVlcnkgcmVzdWx0cywgdXNpbmcgb25lIG9mIHRoZVxuICAgICAqIHZhbGlkYXRvciBmdW5jdGlvbnMgaW4gc2NoZW1hLnRzLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBtdXN0IGJlIHN1YmNsYXNzZWQgdG9cbiAgICAgKiBmdW5jdGlvbiBjb3JyZWN0bHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm93IFxuICAgICAqL1xuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvd3Mocm93czogYW55W10pOiBUW10ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHZhbGlkYXRlUm93cyBtdXN0IGJlIHN1YmNsYXNzZWRgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGZpZWxkcyBmcm9tIHRoZSBkYXRhYmFzZVxuICAgICAqIHJlcHJlc2VudGF0aW9uIHRvIHRoZSBmb3JtIHJlcXVpcmVkXG4gICAgICogZm9yIGV4ZWN1dGlvbi5cbiAgICAgKiBcbiAgICAgKiBUaGUgZGF0YWJhc2UgY2Fubm90IHN0b3JlcyBKU09OIGZpZWxkc1xuICAgICAqIGFzIGFuIG9iamVjdCBzdHJ1Y3R1cmUsIGJ1dCBhcyBhIHNlcmlhbGllZFxuICAgICAqIEpTT04gc3RyaW5nLiAgSW5zaWRlIEFrYXNoYUNNUyBjb2RlIHRoYXRcbiAgICAgKiBvYmplY3QgbXVzdCBiZSBhbiBvYmplY3QgcmF0aGVyIHRoYW5cbiAgICAgKiBhIHN0cmluZy5cbiAgICAgKiBcbiAgICAgKiBUaGUgb2JqZWN0IHBhc3NlZCBhcyBcInJvd1wiIHNob3VsZCBhbHJlYWR5XG4gICAgICogaGF2ZSBiZWVuIHZhbGlkYXRlZCB1c2luZyB2YWxpZGF0ZVJvdy5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gcm93IFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IFQge1xuICAgICAgICBpZiAodHlwZW9mIHJvdy5pbmZvID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmluZm8gPSBKU09OLnBhcnNlKHJvdy5pbmZvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPFQ+cm93O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBzcWxGb3JtYXQoZm5hbWUsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBzcWwgPSBTcWxTdHJpbmcuZm9ybWF0KFxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShmbmFtZSksIHBhcmFtc1xuICAgICAgICApO1xuICAgICAgICByZXR1cm4gc3FsO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBmaW5kUGF0aE1vdW50ZWRTUUxcbiAgICAgICAgICAgID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICAgIC8qKlxuICAgICAqIEZpbmQgYW4gaW5mbyBvYmplY3QgYmFzZWQgb24gdnBhdGggYW5kIG1vdW50ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHBhcmFtIG1vdW50ZWQgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIGZpbmRQYXRoTW91bnRlZChcbiAgICAgICAgdnBhdGg6IHN0cmluZywgbW91bnRlZDogc3RyaW5nXG4gICAgKTogUHJvbWlzZTxBcnJheTx7XG4gICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgIG1vdW50ZWQ6IHN0cmluZ1xuICAgIH0+PiAge1xuICAgICAgICBcbiAgICAgICAgbGV0IHNxbCA9IHRoaXMuZmluZFBhdGhNb3VudGVkU1FMLmdldCh0aGlzLmRibmFtZSk7XG4gICAgICAgIGlmICghc3FsKSB7XG4gICAgICAgICAgICBzcWwgPSBhd2FpdCB0aGlzLnNxbEZvcm1hdChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdmaW5kLXBhdGgtbW91bnRlZC5zcWwnKSxcbiAgICAgICAgICAgICAgICBbIHRoaXMuZGJuYW1lIF1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmZpbmRQYXRoTW91bnRlZFNRTC5zZXQodGhpcy5kYm5hbWUsIHNxbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZm91bmQgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoc3FsLCB7XG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoLFxuICAgICAgICAgICAgJG1vdW50ZWQ6IG1vdW50ZWRcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IG5ldyBBcnJheTx7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgbW91bnRlZDogc3RyaW5nXG4gICAgICAgIH0+KCk7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBmb3VuZCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLnZwYXRoID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICYmIHR5cGVvZiBpdGVtLm1vdW50ZWQgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBtYXBwZWQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLCBtb3VudGVkOiBpdGVtLm1vdW50ZWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaW5kUGF0aE1vdW50ZWQ6IEludmFsaWQgb2JqZWN0ICBmb3VuZCBpbiBxdWVyeSAoJHt2cGF0aH0sICR7bW91bnRlZH0pIHJlc3VsdHMgJHt1dGlsLmluc3BlY3QoaXRlbSl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hcHBlZDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZmluZEJ5UGF0aENhY2hlO1xuICAgIHByb3RlY3RlZCBmaW5kQnlQYXRoU1FMID0gbmV3IE1hcDxcbiAgICAgICAgc3RyaW5nLCBzdHJpbmdcbiAgICA+KCk7XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGFuIGluZm8gb2JqZWN0IGJ5IHRoZSB2cGF0aC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZmluZEJ5UGF0aCh2cGF0aDogc3RyaW5nKSB7XG5cbiAgICAgICAgY29uc3QgZG9DYWNoaW5nXG4gICAgICAgICAgICA9IHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0ID4gMDtcbiAgICAgICAgbGV0IGNhY2hlS2V5O1xuXG4gICAgICAgIGlmICghdGhpcy5maW5kQnlQYXRoQ2FjaGUpIHtcbiAgICAgICAgICAgIHRoaXMuZmluZEJ5UGF0aENhY2hlXG4gICAgICAgICAgICAgICAgPSBuZXcgQ2FjaGUodGhpcy5jb25maWcuY2FjaGluZ1RpbWVvdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZykge1xuXG4gICAgICAgICAgICBjYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBkYm5hbWU6IHRoaXMucXVvdGVkREJOYW1lLFxuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZFxuICAgICAgICAgICAgICAgID0gdGhpcy5maW5kQnlQYXRoQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRCeVBhdGggJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfSAke3ZwYXRofWApO1xuXG4gICAgICAgIGxldCBzcWwgPSB0aGlzLmZpbmRCeVBhdGhTUUwuZ2V0KHRoaXMuZGJuYW1lKTtcbiAgICAgICAgaWYgKCFzcWwpIHtcbiAgICAgICAgICAgIHNxbCA9IGF3YWl0IHRoaXMuc3FsRm9ybWF0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2ZpbmQtYnktY2FjaGUuc3FsJyksXG4gICAgICAgICAgICAgICAgWyB0aGlzLmRibmFtZSBdXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5maW5kQnlQYXRoU1FMLnNldCh0aGlzLmRibmFtZSwgc3FsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBmb3VuZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvdW5kID0gPGFueVtdPmF3YWl0IHRoaXMuZGIuYWxsKHNxbCwge1xuICAgICAgICAgICAgICAgICR2cGF0aDogdnBhdGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBkYi5hbGwgJHtzcWx9YCwgZXJyLnN0YWNrKTtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHRoaXMudmFsaWRhdGVSb3dzKGZvdW5kKTtcblxuICAgICAgICBjb25zdCByZXQgPSBtYXBwZWQubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZyAmJiBjYWNoZUtleSkge1xuICAgICAgICAgICAgdGhpcy5maW5kQnlQYXRoQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm86IFQpIHtcbiAgICAgICAgLy8gUGxhY2Vob2xkZXIgd2hpY2ggc29tZSBzdWJjbGFzc2VzXG4gICAgICAgIC8vIGFyZSBleHBlY3RlZCB0byBvdmVycmlkZVxuXG4gICAgICAgIC8vIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgZ2F0aGVySW5mb0RhdGEgbXVzdCBiZSBvdmVycmlkZGVuYCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZUNoYW5nZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZUNoYW5nZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09PT09PR0EhISEgUmVjZWl2ZWQgYSBmaWxlIHRoYXQgc2hvdWxkIGJlIGluZ29yZWQgYCwgaW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVDaGFuZ2VkIGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhhbmRsZUNoYW5nZWQgJHtpbmZvLnZwYXRofSAke2luZm8ubWV0YWRhdGEgJiYgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPyBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA6ICc/Pz8nfWApO1xuXG4gICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5maW5kUGF0aE1vdW50ZWQoaW5mby52cGF0aCwgaW5mby5tb3VudGVkKTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhQXJyYXkuaXNBcnJheShyZXN1bHQpXG4gICAgICAgICB8fCByZXN1bHQubGVuZ3RoIDw9IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBJdCB3YXNuJ3QgZm91bmQgaW4gdGhlIGRhdGFiYXNlLlxuICAgICAgICAgICAgLy8gSGVuY2Ugd2Ugc2hvdWxkIGFkZCBpdC5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUFkZGVkKG5hbWUsIGluZm8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVEb2NJbkRCKGluZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUNoYW5nZWQobmFtZSwgaW5mbyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2UgcmVjZWl2ZSB0aGlzOlxuICAgICAqXG4gICAgICoge1xuICAgICAqICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAqICAgIHZwYXRoOiB2cGF0aCxcbiAgICAgKiAgICBtaW1lOiBtaW1lLmdldFR5cGUoZnNwYXRoKSxcbiAgICAgKiAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgKiAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgKiAgICBwYXRoSW5Nb3VudGVkOiBjb21wdXRlZCByZWxhdGl2ZSBwYXRoXG4gICAgICogICAgc3RhY2s6IFsgYXJyYXkgb2YgdGhlc2UgaW5zdGFuY2VzIF1cbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBOZWVkIHRvIGFkZDpcbiAgICAgKiAgICByZW5kZXJQYXRoXG4gICAgICogICAgQW5kIGZvciBIVE1MIHJlbmRlciBmaWxlcywgYWRkIHRoZSBiYXNlTWV0YWRhdGEgYW5kIGRvY01ldGFkYXRhXG4gICAgICpcbiAgICAgKiBTaG91bGQgcmVtb3ZlIHRoZSBzdGFjaywgc2luY2UgaXQncyBsaWtlbHkgbm90IHVzZWZ1bCB0byB1cy5cbiAgICAgKi9cblxuICAgIHByb3RlY3RlZCBhc3luYyBoYW5kbGVBZGRlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vICBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZUFkZGVkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmICh0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBPT09PT09PT0dBISEhIFJlY2VpdmVkIGEgZmlsZSB0aGF0IHNob3VsZCBiZSBpbmdvcmVkIGAsIGluZm8pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlQWRkZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5zZXJ0RG9jVG9EQihpbmZvKTtcbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVBZGRlZChuYW1lLCBpbmZvKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihpbmZvOiBUKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW5zZXJ0RG9jVG9EQiBtdXN0IGJlIG92ZXJyaWRkZW5gKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvOiBUKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdXBkYXRlRG9jSW5EQiBtdXN0IGJlIG92ZXJyaWRkZW5gKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgaGFuZGxlVW5saW5rZWRTUUxcbiAgICAgICAgICAgID0gbmV3IE1hcDxzdHJpbmcsc3RyaW5nPigpO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZVVubGlua2VkKG5hbWUsIGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVVbmxpbmtlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZVVubGlua2VkIGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZVVubGlua2VkKG5hbWUsIGluZm8pO1xuXG4gICAgICAgIGxldCBzcWwgPSB0aGlzLmhhbmRsZVVubGlua2VkU1FMLmdldCh0aGlzLmRibmFtZSk7XG4gICAgICAgIGlmICghc3FsKSB7XG4gICAgICAgICAgICBzcWwgPSBTcWxTdHJpbmcuZm9ybWF0KFxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKGltcG9ydC5tZXRhLmRpcm5hbWUsICdzcWwnLCAnaGFuZGxlLXVubGlua2VkLnNxbCcpXG4gICAgICAgICAgICAgICAgKSwgWyB0aGlzLmRibmFtZSBdKTtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlVW5saW5rZWRTUUwuc2V0KHRoaXMuZGJuYW1lLCBzcWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oc3FsLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBhd2FpdCB0aGlzLiNkYW8uZGVsZXRlQWxsKHtcbiAgICAgICAgLy8gICAgIHZwYXRoOiB7IGVxOiBpbmZvLnZwYXRoIH0sXG4gICAgICAgIC8vICAgICBtb3VudGVkOiB7IGVxOiBpbmZvLm1vdW50ZWQgfVxuICAgICAgICAvLyB9IGFzIFdoZXJlPFQ+KTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaGFuZGxlUmVhZHkobmFtZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZVJlYWR5YCk7XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlUmVhZHkgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdCgncmVhZHknLCBuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGxvdyBhIGNhbGxlciB0byB3YWl0IHVudGlsIHRoZSA8ZW0+cmVhZHk8L2VtPiBldmVudCBoYXNcbiAgICAgKiBiZWVuIHNlbnQgZnJvbSB0aGUgRGlyc1dhdGNoZXIgaW5zdGFuY2UuICBUaGlzIGV2ZW50IG1lYW5zIHRoZVxuICAgICAqIGluaXRpYWwgaW5kZXhpbmcgaGFzIGhhcHBlbmVkLlxuICAgICAqL1xuICAgIGFzeW5jIGlzUmVhZHkoKSB7XG4gICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZGlyZWN0b3JpZXMsIHRoZXJlIHdvbid0IGJlIGFueSBmaWxlcyBcbiAgICAgICAgLy8gdG8gbG9hZCwgYW5kIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICB3aGlsZSAodGhpcy4jZGlycy5sZW5ndGggPiAwICYmICF0aGlzLiNpc19yZWFkeSkge1xuICAgICAgICAgICAgLy8gVGhpcyBkb2VzIGEgMTAwbXMgcGF1c2VcbiAgICAgICAgICAgIC8vIFRoYXQgbGV0cyB1cyBjaGVjayBpc19yZWFkeSBldmVyeSAxMDBtc1xuICAgICAgICAgICAgLy8gYXQgdmVyeSBsaXR0bGUgY29zdFxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCFpc1JlYWR5ICR7dGhpcy5uYW1lfSAke3RoaXNbX3N5bWJfZGlyc10ubGVuZ3RofSAke3RoaXNbX3N5bWJfaXNfcmVhZHldfWApO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGRpcmVjdG9yeSBtb3VudCBjb3JyZXNwb25kaW5nIHRvIHRoZSBmaWxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBpbmZvXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBmaWxlRGlyTW91bnQoaW5mbykge1xuICAgICAgICBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgbWFwcGVkKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZGlyTW91bnQgZm9yICR7aW5mby52cGF0aH0gLS0gJHt1dGlsLmluc3BlY3QoaW5mbyl9ID09PSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICAgICAgaWYgKGluZm8ubW91bnRQb2ludCA9PT0gZGlyLm1vdW50UG9pbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2hvdWxkIHRoaXMgZmlsZSBiZSBpZ25vcmVkLCBiYXNlZCBvbiB0aGUgYGlnbm9yZWAgZmllbGRcbiAgICAgKiBpbiB0aGUgbWF0Y2hpbmcgYGRpcmAgbW91bnQgZW50cnkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGluZm9cbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGlnbm9yZUZpbGUoaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgIGNvbnN0IGRpck1vdW50ID0gdGhpcy5maWxlRGlyTW91bnQoaW5mbyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH0gZGlyTW91bnQgJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICBsZXQgaWdub3JlID0gZmFsc2U7XG4gICAgICAgIGlmIChkaXJNb3VudCkge1xuXG4gICAgICAgICAgICBsZXQgaWdub3JlcztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyTW91bnQuaWdub3JlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBbIGRpck1vdW50Lmlnbm9yZSBdO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRpck1vdW50Lmlnbm9yZSkpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gZGlyTW91bnQuaWdub3JlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaWdub3Jlcykge1xuICAgICAgICAgICAgICAgIGlmIChtaWNyb21hdGNoLmlzTWF0Y2goaW5mby52cGF0aCwgaSkpIGlnbm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRpck1vdW50Lmlnbm9yZSAke2ZzcGF0aH0gJHtpfSA9PiAke2lnbm9yZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIChpZ25vcmUpIGNvbnNvbGUubG9nKGBNVVNUIGlnbm9yZSBGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlIGZvciAke2luZm8udnBhdGh9ID09PiAke2lnbm9yZX1gKTtcbiAgICAgICAgICAgIHJldHVybiBpZ25vcmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBubyBtb3VudD8gIHRoYXQgbWVhbnMgc29tZXRoaW5nIHN0cmFuZ2VcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYE5vIGRpck1vdW50IGZvdW5kIGZvciAke2luZm8udnBhdGh9IC8gJHtpbmZvLmRpck1vdW50ZWRPbn1gKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHBhdGhzQ2FjaGU7XG4gICAgcHJvdGVjdGVkIHBhdGhzU1FMID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBzaW1wbGUgaW5mb3JtYXRpb24gYWJvdXQgZWFjaFxuICAgICAqIHBhdGggaW4gdGhlIGNvbGxlY3Rpb24uICBUaGUgcmV0dXJuXG4gICAgICogdHlwZSBpcyBhbiBhcnJheSBvZiBQYXRoc1JldHVyblR5cGUuXG4gICAgICogXG4gICAgICogSSBmb3VuZCB0d28gdXNlcyBmb3IgdGhpcyBmdW5jdGlvbi5cbiAgICAgKiBJbiBjb3B5QXNzZXRzLCB0aGUgdnBhdGggYW5kIG90aGVyXG4gICAgICogc2ltcGxlIGRhdGEgaXMgdXNlZCBmb3IgY29weWluZyBpdGVtc1xuICAgICAqIHRvIHRoZSBvdXRwdXQgZGlyZWN0b3J5LlxuICAgICAqIEluIHJlbmRlci50cywgdGhlIHNpbXBsZSBmaWVsZHMgYXJlXG4gICAgICogdXNlZCB0byB0aGVuIGNhbGwgZmluZCB0byByZXRyaWV2ZVxuICAgICAqIHRoZSBmdWxsIGluZm9ybWF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHBhdGhzKHJvb3RQYXRoPzogc3RyaW5nKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8UGF0aHNSZXR1cm5UeXBlPj5cbiAgICB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIGNvbnN0IGRvQ2FjaGluZ1xuICAgICAgICAgICAgPSB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDA7XG4gICAgICAgIGxldCBjYWNoZUtleTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMucGF0aHNDYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGF0aHNDYWNoZVxuICAgICAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgcm9vdFAsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgY2FjaGVkXG4gICAgICAgICAgICAgICAgPSB0aGlzLnBhdGhzQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNxbFJvb3RQID0gdGhpcy5wYXRoc1NRTC5nZXQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgZGJuYW1lOiB0aGlzLmRibmFtZSwgcm9vdFA6IHRydWVcbiAgICAgICAgfSkpO1xuICAgICAgICBpZiAoIXNxbFJvb3RQKSB7XG4gICAgICAgICAgICBzcWxSb290UCA9IGF3YWl0IHRoaXMuc3FsRm9ybWF0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3BhdGhzLXJvb3RwLnNxbCcpLFxuICAgICAgICAgICAgICAgIFsgdGhpcy5kYm5hbWUgXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMucGF0aHNTUUwuc2V0KHRoaXMuZGJuYW1lLCBzcWxSb290UCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNxbE5vUm9vdCA9IHRoaXMucGF0aHNTUUwuZ2V0KEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGRibmFtZTogdGhpcy5kYm5hbWUsIHJvb3RQOiBmYWxzZVxuICAgICAgICB9KSk7XG4gICAgICAgIGlmICghc3FsTm9Sb290KSB7XG4gICAgICAgICAgICBzcWxOb1Jvb3QgPSBhd2FpdCB0aGlzLnNxbEZvcm1hdChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdwYXRocy1uby1yb290LnNxbCcpLFxuICAgICAgICAgICAgICAgIFsgdGhpcy5kYm5hbWUgXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMucGF0aHNTUUwuc2V0KHRoaXMuZGJuYW1lLCBzcWxOb1Jvb3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBpcyBjb3BpZWQgZnJvbSB0aGUgb2xkZXIgdmVyc2lvblxuICAgICAgICAvLyAoTG9raUpTIHZlcnNpb24pIG9mIHRoaXMgZnVuY3Rpb24uICBJdFxuICAgICAgICAvLyBzZWVtcyBtZWFudCB0byBlbGltaW5hdGUgZHVwbGljYXRlcy5cbiAgICAgICAgY29uc3QgdnBhdGhzU2VlbiA9IG5ldyBTZXQoKTtcblxuICAgICAgICAvLyBTZWxlY3QgdGhlIGZpZWxkcyBpbiBQYXRoc1JldHVyblR5cGVcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9ICh0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnKSBcbiAgICAgICAgPyA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoc3FsUm9vdFAsIHtcbiAgICAgICAgICAgICRyb290UDogYCR7cm9vdFB9JWBcbiAgICAgICAgfSlcbiAgICAgICAgOiA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoc3FsTm9Sb290KTtcblxuICAgICAgICBjb25zdCByZXN1bHQyOiBQYXRoc1JldHVyblR5cGVbXVxuICAgICAgICAgICAgICAgID0gbmV3IEFycmF5PFBhdGhzUmV0dXJuVHlwZT4oKTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICAgIGlmIChmY2FjaGUuaWdub3JlRmlsZShpdGVtKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZwYXRoc1NlZW4uaGFzKChpdGVtIGFzIFQpLnZwYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2cGF0aHNTZWVuLmFkZCgoaXRlbSBhcyBUKS52cGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5taW1lID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVQYXRoc1JldHVyblR5cGUoaXRlbSk7XG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUEFUSFMgVkFMSURBVElPTiAke3V0aWwuaW5zcGVjdChpdGVtKX1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQyLnB1c2godmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZyAmJiBjYWNoZUtleSkge1xuICAgICAgICAgICAgdGhpcy5wYXRoc0NhY2hlLnB1dChcbiAgICAgICAgICAgICAgICBjYWNoZUtleSwgcmVzdWx0MlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGZpbGUgd2l0aGluIHRoZSBjYWNoZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggVGhlIHZwYXRoIG9yIHJlbmRlclBhdGggdG8gbG9vayBmb3JcbiAgICAgKiBAcmV0dXJucyBib29sZWFuIHRydWUgaWYgZm91bmQsIGZhbHNlIG90aGVyd2lzZVxuICAgICAqL1xuICAgIGFzeW5jIGZpbmQoX2ZwYXRoKTogUHJvbWlzZTxUIHwgdW5kZWZpbmVkPiB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfZnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmQgcGFyYW1ldGVyIG5vdCBzdHJpbmcgJHt0eXBlb2YgX2ZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmZpbmRCeVBhdGgoZnBhdGgpO1xuXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAvLyAgICAgb3I6IFtcbiAgICAgICAgLy8gICAgICAgICB7IHZwYXRoOiB7IGVxOiBmcGF0aCB9fSxcbiAgICAgICAgLy8gICAgICAgICB7IHJlbmRlclBhdGg6IHsgZXE6IGZwYXRoIH19XG4gICAgICAgIC8vICAgICBdXG4gICAgICAgIC8vIH0gYXMgRmlsdGVyPFQ+KTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZCAke19mcGF0aH0gJHtmcGF0aH0gPT0+IHJlc3VsdDEgJHt1dGlsLmluc3BlY3QocmVzdWx0MSl9IGApO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDIgPSByZXN1bHQxLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0Mikge1xuICAgICAgICAvLyAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShyZXN1bHQpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmQgJHtfZnBhdGh9ICR7ZnBhdGh9ID09PiByZXN1bHQyICR7dXRpbC5pbnNwZWN0KHJlc3VsdDIpfSBgKTtcblxuICAgICAgICBsZXQgcmV0O1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldCA9IHJlc3VsdDJbMF07XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICByZXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXQgPSByZXN1bHQyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlOiBUID0gdGhpcy5jdnRSb3dUb09iaihcbiAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRlUm93KHJldClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUFJPQkxFTTpcbiAgICAgICAgLy8gdGhlIG1ldGFkYXRhLCBkb2NNZXRhZGF0YSwgYmFzZU1ldGFkYXRhLFxuICAgICAgICAvLyBhbmQgaW5mbyBmaWVsZHMsIGFyZSBzdG9yZWQgaW5cbiAgICAgICAgLy8gdGhlIGRhdGFiYXNlIGFzIHN0cmluZ3MsIGJ1dCBuZWVkXG4gICAgICAgIC8vIHRvIGJlIHVucGFja2VkIGludG8gb2JqZWN0cy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVXNpbmcgdmFsaWRhdGVSb3cgb3IgdmFsaWRhdGVSb3dzIGlzXG4gICAgICAgIC8vIHVzZWZ1bCwgYnV0IGRvZXMgbm90IGNvbnZlcnQgdGhvc2VcbiAgICAgICAgLy8gZmllbGRzLlxuICAgIH1cblxuICAgICNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgI2ZFeGlzdHNJbkRpciAke2ZwYXRofSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICBpZiAoZGlyLm1vdW50UG9pbnQgPT09ICcvJykge1xuICAgICAgICAgICAgY29uc3QgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5tb3VudGVkLCBmcGF0aFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxldCBmc2V4aXN0cyA9IEZTLmV4aXN0c1N5bmMoZnNwYXRoKTtcblxuICAgICAgICAgICAgaWYgKGZzZXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0gRlMuc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFZQYXRoRGF0YT4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBzdGF0cy5tdGltZU1zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtcCA9IGRpci5tb3VudFBvaW50LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgPyBkaXIubW91bnRQb2ludC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgIDogZGlyLm1vdW50UG9pbnQ7XG4gICAgICAgIG1wID0gbXAuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgPyBtcFxuICAgICAgICAgICAgOiAobXArJy8nKTtcblxuICAgICAgICBpZiAoZnBhdGguc3RhcnRzV2l0aChtcCkpIHtcbiAgICAgICAgICAgIGxldCBwYXRoSW5Nb3VudGVkXG4gICAgICAgICAgICAgICAgPSBmcGF0aC5yZXBsYWNlKGRpci5tb3VudFBvaW50LCAnJyk7XG4gICAgICAgICAgICBsZXQgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5tb3VudGVkLCBwYXRoSW5Nb3VudGVkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDaGVja2luZyBleGlzdCBmb3IgJHtkaXIubW91bnRQb2ludH0gJHtkaXIubW91bnRlZH0gJHtwYXRoSW5Nb3VudGVkfSAke2ZzcGF0aH1gKTtcbiAgICAgICAgICAgIGxldCBmc2V4aXN0cyA9IEZTLmV4aXN0c1N5bmMoZnNwYXRoKTtcblxuICAgICAgICAgICAgaWYgKGZzZXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0gRlMuc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFZQYXRoRGF0YT4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzTXRpbWU6IHN0YXRzLm10aW1lTXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGdWxmaWxscyB0aGUgXCJmaW5kXCIgb3BlcmF0aW9uIG5vdCBieVxuICAgICAqIGxvb2tpbmcgaW4gdGhlIGRhdGFiYXNlLCBidXQgYnkgc2Nhbm5pbmdcbiAgICAgKiB0aGUgZmlsZXN5c3RlbSB1c2luZyBzeW5jaHJvbm91cyBjYWxscy5cbiAgICAgKiBcbiAgICAgKiBOT1RFOiBUaGlzIGlzIHVzZWQgaW4gcGFydGlhbFN5bmNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgZmluZFN5bmMoX2ZwYXRoKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcblxuICAgICAgICBpZiAodHlwZW9mIF9mcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZCBwYXJhbWV0ZXIgbm90IHN0cmluZyAke3R5cGVvZiBfZnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gcmVtYXBkaXJzKHRoaXMuZGlycyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kU3luYyBsb29raW5nIGZvciAke2ZwYXRofSBpbiAke3V0aWwuaW5zcGVjdChtYXBwZWQpfWApO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIG1hcHBlZCkge1xuICAgICAgICAgICAgaWYgKCEoZGlyPy5tb3VudFBvaW50KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgZmluZFN5bmMgYmFkIGRpcnMgaW4gJHt1dGlsLmluc3BlY3QodGhpcy5kaXJzKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy4jZkV4aXN0c0luRGlyKGZwYXRoLCBkaXIpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRTeW5jICR7ZnBhdGh9IGZvdW5kYCwgZm91bmQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQXNzZXRzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8QXNzZXQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBBc3NldCB7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIHZhbHVlIH0gPSB2YWxpZGF0ZUFzc2V0KHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgLy8gY29uc29sZS5lcnJvcihgQVNTRVQgVkFMSURBVElPTiBFUlJPUiBmb3JgLCByb3cpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0gZWxzZSByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93cyhyb3dzOiBhbnlbXSk6IEFzc2V0W10ge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocm93cykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXRzQ2FjaGUgdmFsaWRhdGVSb3dzIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXlgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXk8QXNzZXQ+KCk7XG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICAgIHJldC5wdXNoKHRoaXMudmFsaWRhdGVSb3cocm93KSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IEFzc2V0IHtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDxBc3NldD5yb3c7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbzogQXNzZXQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjaW5zZXJ0RG9jQXNzZXRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IEFzc2V0XG4gICAgKSB7XG4gICAgICAgIGlmICghdGhpcy4jaW5zZXJ0RG9jQXNzZXRzKSB7XG4gICAgICAgICAgICB0aGlzLiNpbnNlcnREb2NBc3NldHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1hc3NldHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bih0aGlzLiNpbnNlcnREb2NBc3NldHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbylcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgI3VwZGF0ZURvY0Fzc2V0cztcblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm86IEFzc2V0KSB7XG4gICAgICAgIGlmICghdGhpcy4jdXBkYXRlRG9jQXNzZXRzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NBc3NldHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAndXBkYXRlLWRvYy1hc3NldHMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bih0aGlzLiN1cGRhdGVEb2NBc3NldHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbylcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBQYXJ0aWFsc0NhY2hlXG4gICAgICAgIGV4dGVuZHMgQmFzZUNhY2hlPFBhcnRpYWw+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBQYXJ0aWFsIHtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9IHZhbGlkYXRlUGFydGlhbChyb3cpO1xuICAgICAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xuICAgICAgICBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogUGFydGlhbFtdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhcnRpYWxzQ2FjaGUgdmFsaWRhdGVSb3dzIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXlgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXk8UGFydGlhbD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogUGFydGlhbCB7XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuaW5mbyA9IEpTT04ucGFyc2Uocm93LmluZm8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8UGFydGlhbD5yb3c7XG4gICAgfVxuXG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBQYXJ0aWFsKSB7XG5cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9IHJlbmRlcmVyLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAjaW5zZXJ0RG9jUGFydGlhbHM7XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihcbiAgICAgICAgaW5mbzogUGFydGlhbFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI2luc2VydERvY1BhcnRpYWxzKSB7XG4gICAgICAgICAgICB0aGlzLiNpbnNlcnREb2NQYXJ0aWFscyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdpbnNlcnQtZG9jLXBhcnRpYWxzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0RG9jUGFydGlhbHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAjdXBkYXRlRG9jUGFydGlhbHM7XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihcbiAgICAgICAgaW5mbzogUGFydGlhbFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI3VwZGF0ZURvY1BhcnRpYWxzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NQYXJ0aWFscyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICd1cGRhdGUtZG9jLXBhcnRpYWxzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jdXBkYXRlRG9jUGFydGlhbHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIExheW91dHNDYWNoZVxuICAgICAgICBleHRlbmRzIEJhc2VDYWNoZTxMYXlvdXQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBMYXlvdXQge1xuICAgICAgICBjb25zdCB7IGVycm9yLCB2YWx1ZSB9ID0gdmFsaWRhdGVMYXlvdXQocm93KTtcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcjtcbiAgICAgICAgZWxzZSByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93cyhyb3dzOiBhbnlbXSk6IExheW91dFtdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYExheW91dHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxMYXlvdXQ+KCk7XG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICAgIHJldC5wdXNoKHRoaXMudmFsaWRhdGVSb3cocm93KSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IExheW91dCB7XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuaW5mbyA9IEpTT04ucGFyc2Uocm93LmluZm8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8TGF5b3V0PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBMYXlvdXQpIHtcblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodHlwZW9mICg8YW55PmluZm8pLnN0YXRzTXRpbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpbmZvLm10aW1lTXMgPSAoPGFueT5pbmZvKS5zdGF0c010aW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbmZvLm1pbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGluZm8ubWltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgICAgIGluZm8ucmVuZGVyZXJOYW1lID0gcmVuZGVyZXIubmFtZTtcblxuICAgICAgICAgICAgY29uc3QgcmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby52cGF0aCk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9XG4gICAgICAgICAgICAgICAgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKiovKi5odG1sJylcbiAgICAgICAgICAgICB8fCBtaWNyb21hdGNoLmlzTWF0Y2goXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqLmh0bWwnKVxuICAgICAgICAgICAgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcnNUb0hUTUwgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICNpbnNlcnREb2NMYXlvdXRzO1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IExheW91dFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI2luc2VydERvY0xheW91dHMpIHtcbiAgICAgICAgICAgIHRoaXMuI2luc2VydERvY0xheW91dHMgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnaW5zZXJ0LWRvYy1sYXlvdXRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4odGhpcy4jaW5zZXJ0RG9jTGF5b3V0cywge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcblxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAjdXBkYXRlRG9jTGF5b3V0cztcblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKFxuICAgICAgICBpbmZvOiBMYXlvdXRcbiAgICApIHtcbiAgICAgICAgaWYgKCF0aGlzLiN1cGRhdGVEb2NMYXlvdXRzKSB7XG4gICAgICAgICAgICB0aGlzLiN1cGRhdGVEb2NMYXlvdXRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ3VwZGF0ZS1kb2MtbGF5b3V0cy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI3VwZGF0ZURvY0xheW91dHMsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWVcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8RG9jdW1lbnQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBEb2N1bWVudCB7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIHZhbHVlIH1cbiAgICAgICAgICAgICAgICAgICAgPSB2YWxpZGF0ZURvY3VtZW50KHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRE9DVU1FTlQgVkFMSURBVElPTiBFUlJPUiBmb3IgJHt1dGlsLmluc3BlY3Qocm93KX1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogRG9jdW1lbnRbXSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxEb2N1bWVudD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogRG9jdW1lbnQge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgRG9jdW1lbnRzIGN2dFJvd1RvT2JqYCwgcm93KTtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cuYmFzZU1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmJhc2VNZXRhZGF0YVxuICAgICAgICAgICAgICAgID0gSlNPTi5wYXJzZShyb3cuYmFzZU1ldGFkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJvdy5kb2NNZXRhZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgID0gSlNPTi5wYXJzZShyb3cuZG9jTWV0YWRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygcm93Lm1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93Lm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy5tZXRhZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cudGFncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy50YWdzXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy50YWdzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPERvY3VtZW50PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBEb2N1bWVudCkge1xuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIGluZm8uZGlybmFtZSA9IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8uZGlybmFtZSA9PT0gJy4nKSBpbmZvLmRpcm5hbWUgPSAnLyc7XG4gICAgICAgIGluZm8ucGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGluZm8uZGlybmFtZSk7XG5cbiAgICAgICAgLy8gZmluZCB0aGUgbW91bnRlZCBkaXJlY3RvcnksXG4gICAgICAgIC8vIGdldCB0aGUgYmFzZU1ldGFkYXRhXG4gICAgICAgIGZvciAobGV0IGRpciBvZiByZW1hcGRpcnModGhpcy5kaXJzKSkge1xuICAgICAgICAgICAgaWYgKGRpci5tb3VudGVkID09PSBpbmZvLm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlyLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLmJhc2VNZXRhZGF0YSA9IGRpci5iYXNlTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9IHJlbmRlcmVyLm5hbWU7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby52cGF0aCk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9XG4gICAgICAgICAgICAgICAgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqKi8qLmh0bWwnKVxuICAgICAgICAgICAgIHx8IG1pY3JvbWF0Y2guaXNNYXRjaChcbiAgICAgICAgICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKi5odG1sJylcbiAgICAgICAgICAgID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAocmVuZGVyZXIucGFyc2VNZXRhZGF0YSkge1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKDxhbnk+e1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGluZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBGUy5yZWFkRmlsZVN5bmMoaW5mby5mc3BhdGgsICd1dGYtOCcpXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkb2NNZXRhZGF0YSBpcyB0aGUgdW5tb2RpZmllZCBtZXRhZGF0YS9mcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBkb2N1bWVudFxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEgPSByYy5tZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvLyBkb2NDb250ZW50IGlzIHRoZSB1bnBhcnNlZCBvcmlnaW5hbCBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gaW5jbHVkaW5nIGFueSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9IHJjLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIGNvbXB1dGVkIG1ldGFkYXRhIHRoYXQgaW5jbHVkZXMgZGF0YSBmcm9tIFxuICAgICAgICAgICAgICAgIC8vIHNldmVyYWwgc291cmNlc1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEgPSB7IH07XG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLmRvY01ldGFkYXRhKSBpbmZvLmRvY01ldGFkYXRhID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcmVzdCBvZiB0aGlzIGlzIGFkYXB0ZWQgZnJvbSB0aGUgb2xkIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgLy8gSFRNTFJlbmRlcmVyLm5ld0luaXRNZXRhZGF0YVxuXG4gICAgICAgICAgICAgICAgLy8gRm9yIHN0YXJ0ZXJzIHRoZSBtZXRhZGF0YSBpcyBjb2xsZWN0ZWQgZnJvbSBzZXZlcmFsIHNvdXJjZXMuXG4gICAgICAgICAgICAgICAgLy8gMSkgdGhlIG1ldGFkYXRhIHNwZWNpZmllZCBpbiB0aGUgZGlyZWN0b3J5IG1vdW50IHdoZXJlXG4gICAgICAgICAgICAgICAgLy8gICAgdGhpcyBkb2N1bWVudCB3YXMgZm91bmRcbiAgICAgICAgICAgICAgICAvLyAyKSBtZXRhZGF0YSBpbiB0aGUgcHJvamVjdCBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgLy8gMykgdGhlIG1ldGFkYXRhIGluIHRoZSBkb2N1bWVudCwgYXMgY2FwdHVyZWQgaW4gZG9jTWV0YWRhdGFcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbml0TWV0YWRhdGEgJHtiYXNlZGlyfSAke2ZwYXRofSBiYXNlTWV0YWRhdGEgJHtiYXNlTWV0YWRhdGFbeXByb3BdfWApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uYmFzZU1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gdGhpcy5jb25maWcubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSB0aGlzLmNvbmZpZy5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGZtbWNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmRvY01ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5kb2NNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgICAgIGZtbWNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhlIGNvbnRlbnQgbGFuZHMgaGVyZVxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGRvY3VtZW50IG9iamVjdCBoYXMgYmVlbiB1c2VmdWwgZm9yIFxuICAgICAgICAgICAgICAgIC8vIGNvbW11bmljYXRpbmcgdGhlIGZpbGUgcGF0aCBhbmQgb3RoZXIgZGF0YS5cbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50ID0ge307XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5iYXNlZGlyID0gaW5mby5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscGF0aCA9IGluZm8ucGF0aEluTW91bnRlZDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHJlbmRlciA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8ucGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5wYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvID0gaW5mby5yZW5kZXJQYXRoO1xuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIHRoZSA8ZW0+dGFnczwvZW0+IGZpZWxkIGlzIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgaWYgKCEoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoaW5mby5tZXRhZGF0YS50YWdzKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhZ2xpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmUgPSAvXFxzKixcXHMqLztcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzLnNwbGl0KHJlKS5mb3JFYWNoKHRhZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdsaXN0LnB1c2godGFnLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSB0YWdsaXN0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBgRk9STUFUIEVSUk9SIC0gJHtpbmZvLnZwYXRofSBoYXMgYmFkbHkgZm9ybWF0dGVkIHRhZ3MgYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEudGFncyA9IGluZm8ubWV0YWRhdGEudGFncztcblxuICAgICAgICAgICAgICAgIC8vIFRoZSByb290IFVSTCBmb3IgdGhlIHByb2plY3RcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJvb3RfdXJsID0gdGhpcy5jb25maWcucm9vdF91cmw7XG5cbiAgICAgICAgICAgICAgICAvLyBDb21wdXRlIHRoZSBVUkwgdGhpcyBkb2N1bWVudCB3aWxsIHJlbmRlciB0b1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdVJvb3RVcmwgPSBuZXcgVVJMKHRoaXMuY29uZmlnLnJvb3RfdXJsLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICAgICAgICAgIHVSb290VXJsLnBhdGhuYW1lID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKHVSb290VXJsLnBhdGhuYW1lLCBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX3VybCA9IHVSb290VXJsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfZGF0ZSA9IGluZm8uc3RhdHMubXRpbWU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZVB1YmxEYXRlID0gKGRhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gRGF0ZS5wYXJzZShkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRlU2V0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAmJiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgZGF0ZVNldCAmJiBpbmZvLm10aW1lTXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBuZXcgRGF0ZShpbmZvLm10aW1lTXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBpbmZvLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gc3RhdHMubXRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7aW5mby52cGF0aH0gbWV0YWRhdGEucHVibGljYXRpb25EYXRlICR7aW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGV9IHNldCBmcm9tIGN1cnJlbnQgdGltZWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID0gZmFsc2U7XG4gICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhID0ge307XG4gICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSAnJztcbiAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9ICcnO1xuICAgICAgICAgICAgaW5mby5yZW5kZXJlck5hbWUgPSAnJztcbiAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lID0gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5PVEU6IENlcnRhaW4gZmllbGRzIGFyZSBub3QgaGFuZGxlZFxuICAgIC8vIGhlcmUgYmVjYXVzZSB0aGV5J3JlIEdFTkVSQVRFRCBmcm9tXG4gICAgLy8gSlNPTiBkYXRhLlxuICAgIC8vXG4gICAgLy8gICAgICBwdWJsaWNhdGlvblRpbWVcbiAgICAvLyAgICAgIGJhc2VNZXRhZGF0YVxuICAgIC8vICAgICAgbWV0YWRhdGFcbiAgICAvLyAgICAgIHRhZ3NcbiAgICAvLyAgICAgIGxheW91dFxuICAgIC8vICAgICAgYmxvZ3RhZ1xuICAgIC8vXG4gICAgLy8gVGhvc2UgZmllbGRzIGFyZSBub3QgdG91Y2hlZCBieVxuICAgIC8vIHRoZSBpbnNlcnQvdXBkYXRlIGZ1bmN0aW9ucyBiZWNhdXNlXG4gICAgLy8gU1FMSVRFMyB0YWtlcyBjYXJlIG9mIGl0LlxuXG4gICAgI2luc2VydERvY0RvY3VtZW50cztcblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKFxuICAgICAgICBpbmZvOiBEb2N1bWVudFxuICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuI2luc2VydERvY0RvY3VtZW50cykge1xuICAgICAgICAgICAgdGhpcy4jaW5zZXJ0RG9jRG9jdW1lbnRzID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2luc2VydC1kb2MtZG9jdW1lbnRzLnNxbCdcbiAgICAgICAgICAgICAgICAgICAgKSwgJ3V0Zi04J1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsZXQgbXRpbWU7XG4gICAgICAgIC8vIGlmICh0eXBlb2YgaW5mby5tdGltZU1zID09PSAnbnVtYmVyJ1xuICAgICAgICAvLyAgfHwgdHlwZW9mIGluZm8ubXRpbWVNcyA9PT0gJ3N0cmluZydcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBtdGltZSA9IG5ldyBEYXRlKGluZm8ubXRpbWVNcykudG9JU09TdHJpbmcoKTtcbiAgICAgICAgLy8gfVxuICAgICAgICBjb25zdCB0b0luc2VydCA9IHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG4gICAgICAgICAgICAkcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICRwYXJlbnREaXI6IGluZm8ucGFyZW50RGlyLFxuICAgICAgICAgICAgJGRvY01ldGFkYXRhOiBKU09OLnN0cmluZ2lmeShpbmZvLmRvY01ldGFkYXRhKSxcbiAgICAgICAgICAgICRkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWVcbiAgICAgICAgfTtcbiAgICAgICAgLy8gY29uc29sZS5sb2codG9JbnNlcnQpO1xuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bih0aGlzLiNpbnNlcnREb2NEb2N1bWVudHMsXG4gICAgICAgICAgICAgICAgICAgIHRvSW5zZXJ0KTtcbiAgICAgICAgLy8gYXdhaXQgdGhpcy5kYW8uaW5zZXJ0KGRvY0luZm8pO1xuICAgICAgICBpZiAoaW5mby5tZXRhZGF0YSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5hZGREb2NUYWdHbHVlKFxuICAgICAgICAgICAgICAgIGluZm8udnBhdGgsIGluZm8ubWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICN1cGRhdGVEb2NEb2N1bWVudHM7XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICApIHtcbiAgICAgICAgaWYgKCF0aGlzLiN1cGRhdGVEb2NEb2N1bWVudHMpIHtcbiAgICAgICAgICAgIHRoaXMuI3VwZGF0ZURvY0RvY3VtZW50cyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICd1cGRhdGUtZG9jLWRvY3VtZW50cy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKHRoaXMuI3VwZGF0ZURvY0RvY3VtZW50cywge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcblxuICAgICAgICAgICAgJHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAkcGFyZW50RGlyOiBpbmZvLnBhcmVudERpcixcbiAgICAgICAgICAgICRkb2NNZXRhZGF0YTogSlNPTi5zdHJpbmdpZnkoaW5mby5kb2NNZXRhZGF0YSksXG4gICAgICAgICAgICAkZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgJGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgICRyZW5kZXJlck5hbWU6IGluZm8ucmVuZGVyZXJOYW1lXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCB0Z2x1ZS5kZWxldGVUYWdHbHVlKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAoaW5mby5tZXRhZGF0YSkge1xuICAgICAgICAgICAgYXdhaXQgdGdsdWUuYWRkVGFnR2x1ZShpbmZvLnZwYXRoLCBpbmZvLm1ldGFkYXRhLnRhZ3MpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGRlbGV0ZURvY1RhZ0dsdWUodnBhdGgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUodnBhdGgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIGlnbm9yZVxuICAgICAgICAgICAgLy8gVGhpcyBjYW4gdGhyb3cgYW4gZXJyb3IgbGlrZTpcbiAgICAgICAgICAgIC8vIGRvY3VtZW50c0NhY2hlIEVSUk9SIHtcbiAgICAgICAgICAgIC8vICAgICBjb2RlOiAnY2hhbmdlZCcsXG4gICAgICAgICAgICAvLyAgICAgbmFtZTogJ2RvY3VtZW50cycsXG4gICAgICAgICAgICAvLyAgICAgdnBhdGg6ICdfbWVybWFpZC9yZW5kZXIzMzU2NzM5MzgyLm1lcm1haWQnLFxuICAgICAgICAgICAgLy8gICAgIGVycm9yOiBFcnJvcjogZGVsZXRlIGZyb20gJ1RBR0dMVUUnIGZhaWxlZDogbm90aGluZyBjaGFuZ2VkXG4gICAgICAgICAgICAvLyAgICAgIC4uLiBzdGFjayB0cmFjZVxuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gSW4gc3VjaCBhIGNhc2UgdGhlcmUgaXMgbm8gdGFnR2x1ZSBmb3IgdGhlIGRvY3VtZW50LlxuICAgICAgICAgICAgLy8gVGhpcyBcImVycm9yXCIgaXMgc3B1cmlvdXMuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gVE9ETyBJcyB0aGVyZSBhbm90aGVyIHF1ZXJ5IHRvIHJ1biB0aGF0IHdpbGxcbiAgICAgICAgICAgIC8vIG5vdCB0aHJvdyBhbiBlcnJvciBpZiBub3RoaW5nIHdhcyBjaGFuZ2VkP1xuICAgICAgICAgICAgLy8gSW4gb3RoZXIgd29yZHMsIHRoaXMgY291bGQgaGlkZSBhIGxlZ2l0aW1hdGVcbiAgICAgICAgICAgIC8vIGVycm9yLlxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGFkZERvY1RhZ0dsdWUodnBhdGg6IHN0cmluZywgdGFnczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0YWdzICE9PSAnc3RyaW5nJ1xuICAgICAgICAgJiYgIUFycmF5LmlzQXJyYXkodGFncylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZERvY1RhZ0dsdWUgbXVzdCBiZSBnaXZlbiBhIHRhZ3MgYXJyYXksIHdhcyBnaXZlbjogJHt1dGlsLmluc3BlY3QodGFncyl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGdsdWUuYWRkVGFnR2x1ZSh2cGF0aCwgXG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KHRhZ3MpXG4gICAgICAgICAgICA/IHRhZ3NcbiAgICAgICAgICAgIDogWyB0YWdzIF0pO1xuICAgIH1cblxuICAgIGFzeW5jIGFkZFRhZ0Rlc2NyaXB0aW9uKHRhZzogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0ZGVzYy5hZGREZXNjKHRhZywgZGVzY3JpcHRpb24pO1xuICAgIH1cblxuICAgIGFzeW5jIGdldFRhZ0Rlc2NyaXB0aW9uKHRhZzogc3RyaW5nKVxuICAgICAgICA6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRkZXNjLmdldERlc2ModGFnKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaGFuZGxlVW5saW5rZWQobmFtZTogYW55LCBpbmZvOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgc3VwZXIuaGFuZGxlVW5saW5rZWQobmFtZSwgaW5mbyk7XG4gICAgICAgIHRnbHVlLmRlbGV0ZVRhZ0dsdWUoaW5mby52cGF0aCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGluZGV4Q2hhaW5DYWNoZTtcblxuICAgIGFzeW5jIGluZGV4Q2hhaW4oX2ZwYXRoKVxuICAgICAgICA6IFByb21pc2U8aW5kZXhDaGFpbkl0ZW1bXT5cbiAgICB7XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKSBcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IHBhdGgucGFyc2UoZnBhdGgpO1xuXG4gICAgICAgIGNvbnN0IGRvQ2FjaGluZ1xuICAgICAgICAgICAgPSB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDA7XG4gICAgICAgIGxldCBjYWNoZUtleTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaW5kZXhDaGFpbkNhY2hlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleENoYWluQ2FjaGVcbiAgICAgICAgICAgICAgICAgICAgPSBuZXcgQ2FjaGUodGhpcy5jb25maWcuY2FjaGluZ1RpbWVvdXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBkYm5hbWU6IHRoaXMucXVvdGVkREJOYW1lLFxuICAgICAgICAgICAgICAgIGZwYXRoLFxuICAgICAgICAgICAgICAgIHBhcnNlZFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZFxuICAgICAgICAgICAgICAgID0gdGhpcy5pbmRleENoYWluQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluZGV4Q2hhaW4gJHtfZnBhdGh9ICR7ZnBhdGh9YCwgcGFyc2VkKTtcblxuICAgICAgICBjb25zdCBmaWxlejogRG9jdW1lbnRbXSA9IFtdO1xuICAgICAgICBjb25zdCBzZWxmID0gYXdhaXQgdGhpcy5maW5kQnlQYXRoKGZwYXRoKTtcbiAgICAgICAgbGV0IGZpbGVOYW1lID0gZnBhdGg7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNlbGYpICYmIHNlbGYubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIGZpbGV6LnB1c2goc2VsZlswXSk7XG4gICAgICAgICAgICBmaWxlTmFtZSA9IHNlbGZbMF0ucmVuZGVyUGF0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnREaXI7XG4gICAgICAgIGxldCBkaXJOYW1lID0gcGF0aC5kaXJuYW1lKGZwYXRoKTtcbiAgICAgICAgbGV0IGRvbmUgPSBmYWxzZTtcbiAgICAgICAgd2hpbGUgKCEoZGlyTmFtZSA9PT0gJy4nIHx8IGRpck5hbWUgPT09IHBhcnNlZC5yb290KSkge1xuICAgICAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZmlsZU5hbWUpID09PSAnaW5kZXguaHRtbCcpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUocGF0aC5kaXJuYW1lKGZpbGVOYW1lKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmVudERpciA9IHBhdGguZGlybmFtZShmaWxlTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgbG9va0ZvciA9IHBhdGguam9pbihwYXJlbnREaXIsIFwiaW5kZXguaHRtbFwiKTtcblxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBhd2FpdCB0aGlzLmZpbmRCeVBhdGgobG9va0Zvcik7XG5cbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGluZGV4KSAmJiBpbmRleC5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgICAgIGZpbGV6LnB1c2goaW5kZXhbMF0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaWxlTmFtZSA9IGxvb2tGb3I7XG4gICAgICAgICAgICBkaXJOYW1lID0gcGF0aC5kaXJuYW1lKGxvb2tGb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmV0ID0gZmlsZXpcbiAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uKG9iajogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiA8aW5kZXhDaGFpbkl0ZW0+e1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IG9iai5kb2NNZXRhZGF0YS50aXRsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBvYmoudnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZERpcjogb2JqLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZFBhdGg6IG9iai5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6ICcvJyArIG9iai5yZW5kZXJQYXRoXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIG9iai5mb3VuZERpciA9IG9iai5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgICAgICAvLyBvYmouZm91bmRQYXRoID0gb2JqLnJlbmRlclBhdGg7XG4gICAgICAgICAgICAgICAgICAgIC8vIG9iai5maWxlbmFtZSA9ICcvJyArIG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gb2JqO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnJldmVyc2UoKTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nICYmIGNhY2hlS2V5KSB7XG4gICAgICAgICAgICB0aGlzLmluZGV4Q2hhaW5DYWNoZS5wdXQoXG4gICAgICAgICAgICAgICAgY2FjaGVLZXksIHJldFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNpYmxpbmdzQ2FjaGU7XG4gICAgI3NpYmxpbmdzU1FMO1xuXG4gICAgLyoqXG4gICAgICogRmluZHMgYWxsIHRoZSBkb2N1bWVudHMgaW4gdGhlIHNhbWUgZGlyZWN0b3J5XG4gICAgICogYXMgdGhlIG5hbWVkIGZpbGUuXG4gICAgICpcbiAgICAgKiBUaGlzIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIHVzZWQgYW55d2hlcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHNpYmxpbmdzKF9mcGF0aCkge1xuICAgICAgICBsZXQgdnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZSh2cGF0aCk7XG5cbiAgICAgICAgY29uc3QgZG9DYWNoaW5nXG4gICAgICAgICAgICA9IHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0ID4gMDtcbiAgICAgICAgbGV0IGNhY2hlS2V5O1xuXG4gICAgICAgIGlmIChkb0NhY2hpbmcpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5zaWJsaW5nc0NhY2hlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaWJsaW5nc0NhY2hlXG4gICAgICAgICAgICAgICAgICAgID0gbmV3IENhY2hlKHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FjaGVLZXkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgZGJuYW1lOiB0aGlzLnF1b3RlZERCTmFtZSxcbiAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICBkaXJuYW1lXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgY2FjaGVkXG4gICAgICAgICAgICAgICAgPSB0aGlzLnNpYmxpbmdzQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLiNzaWJsaW5nc1NRTCkge1xuICAgICAgICAgICAgdGhpcy4jc2libGluZ3NTUUwgPVxuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5yZWFkRmlsZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzcWwnLCAnc2libGluZ3Muc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNpYmxpbmdzXG4gICAgICAgICAgICA9IGF3YWl0IHRoaXMuZGIuYWxsKHRoaXMuI3NpYmxpbmdzU1FMLCB7XG4gICAgICAgICAgICAkZGlybmFtZTogZGlybmFtZSxcbiAgICAgICAgICAgICR2cGF0aDogdnBhdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgaWdub3JlZCA9IHNpYmxpbmdzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhdGhpcy5pZ25vcmVGaWxlKGl0ZW0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSB0aGlzLnZhbGlkYXRlUm93cyhpZ25vcmVkKTtcbiAgICAgICAgY29uc3QgcmV0ID0gbWFwcGVkLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN2dFJvd1RvT2JqKGl0ZW0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChkb0NhY2hpbmcgJiYgY2FjaGVLZXkpIHtcbiAgICAgICAgICAgIHRoaXMuc2libGluZ3NDYWNoZS5wdXQoXG4gICAgICAgICAgICAgICAgY2FjaGVLZXksIHJldFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgI2RvY3NGb3JEaXJuYW1lO1xuICAgICNkaXJzRm9yUGFyZW50ZGlyO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHRyZWUgb2YgaXRlbXMgc3RhcnRpbmcgZnJvbSB0aGUgZG9jdW1lbnRcbiAgICAgKiBuYW1lZCBpbiBfcm9vdEl0ZW0uICBUaGUgcGFyYW1ldGVyIHNob3VsZCBiZSBhblxuICAgICAqIGFjdHVhbCBkb2N1bWVudCBpbiB0aGUgdHJlZSwgc3VjaCBhcyBgcGF0aC90by9pbmRleC5odG1sYC5cbiAgICAgKiBUaGUgcmV0dXJuIGlzIGEgdHJlZS1zaGFwZWQgc2V0IG9mIG9iamVjdHMgbGlrZSB0aGUgZm9sbG93aW5nO1xuICAgICAqIFxuICB0cmVlOlxuICAgIHJvb3RJdGVtOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyXG4gICAgaXRlbXM6XG4gICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgIGNoaWxkRm9sZGVyczpcbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlclxuICAgICAgICAgIGNoaWxkcmVuOlxuICAgICAgICAgICAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlclxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTEuaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UyLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAgICAtIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgIGNoaWxkcmVuOlxuICAgICAgICAgICAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyXG4gICAgICAgICAgICAgIGl0ZW1zOlxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMS5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbFxuICAgICAgICAgICAgICBjaGlsZEZvbGRlcnM6IFtdXG4gICAgICpcbiAgICAgKiBUaGUgb2JqZWN0cyB1bmRlciBgaXRlbXNgIGFyZSBhY3R1bGx5IHRoZSBmdWxsIERvY3VtZW50IG9iamVjdFxuICAgICAqIGZyb20gdGhlIGNhY2hlLCBidXQgZm9yIHRoZSBpbnRlcmVzdCBvZiBjb21wYWN0bmVzcyBtb3N0IG9mXG4gICAgICogdGhlIGZpZWxkcyBoYXZlIGJlZW4gZGVsZXRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfcm9vdEl0ZW0gXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgY2hpbGRJdGVtVHJlZShfcm9vdEl0ZW06IHN0cmluZykge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGlsZEl0ZW1UcmVlICR7X3Jvb3RJdGVtfWApO1xuXG4gICAgICAgIGxldCByb290SXRlbSA9IGF3YWl0IHRoaXMuZmluZChcbiAgICAgICAgICAgICAgICBfcm9vdEl0ZW0uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX3Jvb3RJdGVtLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9yb290SXRlbSk7XG4gICAgICAgIGlmICghcm9vdEl0ZW0pIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybihgY2hpbGRJdGVtVHJlZSBubyByb290SXRlbSBmb3VuZCBmb3IgcGF0aCAke19yb290SXRlbX1gKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEodHlwZW9mIHJvb3RJdGVtID09PSAnb2JqZWN0JylcbiAgICAgICAgIHx8ICEoJ3ZwYXRoJyBpbiByb290SXRlbSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYGNoaWxkSXRlbVRyZWUgZm91bmQgaW52YWxpZCBvYmplY3QgZm9yICR7X3Jvb3RJdGVtfSAtICR7dXRpbC5pbnNwZWN0KHJvb3RJdGVtKX1gKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUocm9vdEl0ZW0udnBhdGgpO1xuXG4gICAgICAgIGlmICghdGhpcy4jZG9jc0ZvckRpcm5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuI2RvY3NGb3JEaXJuYW1lID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2RvY3MtZm9yLWRpcm5hbWUuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBpY2tzIHVwIGV2ZXJ5dGhpbmcgZnJvbSB0aGUgY3VycmVudCBsZXZlbC5cbiAgICAgICAgLy8gRGlmZmVycyBmcm9tIHNpYmxpbmdzIGJ5IGdldHRpbmcgZXZlcnl0aGluZy5cbiAgICAgICAgY29uc3QgX2l0ZW1zID0gPGFueVtdPmF3YWl0IHRoaXMuZGIuYWxsKHRoaXMuI2RvY3NGb3JEaXJuYW1lLCB7XG4gICAgICAgICAgICAkZGlybmFtZTogZGlybmFtZVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgaXRlbXM6IERvY3VtZW50W11cbiAgICAgICAgICAgID0gdGhpcy52YWxpZGF0ZVJvd3MoX2l0ZW1zKVxuICAgICAgICAgICAgLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCF0aGlzLiNkaXJzRm9yUGFyZW50ZGlyKSB7XG4gICAgICAgICAgICB0aGlzLiNkaXJzRm9yUGFyZW50ZGlyID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2RpcnMtZm9yLWRpcm5hbWUuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF9jaGlsZEZvbGRlcnMgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwodGhpcy4jZGlyc0ZvclBhcmVudGRpciwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNoaWxkRm9sZGVycyA9IG5ldyBBcnJheTx7IGRpcm5hbWU6IHN0cmluZyB9PigpO1xuICAgICAgICBmb3IgKGNvbnN0IGNmIG9mIF9jaGlsZEZvbGRlcnMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2YuZGlybmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjaGlsZEZvbGRlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGRpcm5hbWU6IGNmLmRpcm5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjaGlsZEl0ZW1UcmVlKCR7X3Jvb3RJdGVtfSkgbm8gZGlybmFtZSBmaWVsZHMgaW4gY2hpbGRGb2xkZXJzYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2ZzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgY2Ygb2YgY2hpbGRGb2xkZXJzKSB7XG4gICAgICAgICAgICBjZnMucHVzaChhd2FpdCB0aGlzLmNoaWxkSXRlbVRyZWUoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKGNmLmRpcm5hbWUsICdpbmRleC5odG1sJylcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvb3RJdGVtLFxuICAgICAgICAgICAgZGlybmFtZSxcbiAgICAgICAgICAgIGl0ZW1zOiBpdGVtcyxcbiAgICAgICAgICAgIC8vIFVuY29tbWVudCB0aGlzIHRvIGdlbmVyYXRlIHNpbXBsaWZpZWQgb3V0cHV0XG4gICAgICAgICAgICAvLyBmb3IgZGVidWdnaW5nLlxuICAgICAgICAgICAgLy8gLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoXG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSksXG4gICAgICAgICAgICBjaGlsZEZvbGRlcnM6IGNmc1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgI2luZGV4RmlsZXNTUUw7XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBpbmRleCBmaWxlcyAocmVuZGVycyB0byBpbmRleC5odG1sKVxuICAgICAqIHdpdGhpbiB0aGUgbmFtZWQgc3VidHJlZS5cbiAgICAgKiBcbiAgICAgKiBJdCBhcHBlYXJzIHRoaXMgd2FzIHdyaXR0ZW4gZm9yIGJvb2tuYXYuXG4gICAgICogQnV0LCBpdCBhcHBlYXJzIHRoYXQgYm9va25hdiBkb2VzIG5vdFxuICAgICAqIHVzZSB0aGlzIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGluZGV4RmlsZXMocm9vdFBhdGg/OiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsbHkgYXBwZW5kYWJsZSBzdWItcXVlcnlcbiAgICAgICAgLy8gdG8gaGFuZGxlIHdoZW4gcm9vdFBhdGggaXMgc3BlY2lmaWVkXG4gICAgICAgIGxldCByb290USA9IChcbiAgICAgICAgICAgICAgICB0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgJiYgcm9vdFAubGVuZ3RoID49IDFcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgID8gYCBBTkQgKCByZW5kZXJQYXRoIExJS0UgJyR7cm9vdFB9JScgKWBcbiAgICAgICAgICAgIDogJyc7XG5cbiAgICAgICAgaWYgKCF0aGlzLiNpbmRleEZpbGVzU1FMKSB7XG4gICAgICAgICAgICB0aGlzLiNpbmRleEZpbGVzU1FMID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2luZGV4LWRvYy1maWxlcy5zcWwnXG4gICAgICAgICAgICAgICAgICAgICksICd1dGYtOCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXhlcyA9IDxhbnlbXT4gYXdhaXQgdGhpcy5kYi5hbGwoXG4gICAgICAgICAgICB0aGlzLiNpbmRleEZpbGVzU1FMICsgcm9vdFEgKyAnOydcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHRoaXMudmFsaWRhdGVSb3dzKGluZGV4ZXMpO1xuICAgICAgICByZXR1cm4gbWFwcGVkLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN2dFJvd1RvT2JqKGl0ZW0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEl0J3MgcHJvdmVkIGRpZmZpY3VsdCB0byBnZXQgdGhlIHJlZ2V4cFxuICAgICAgICAvLyB0byB3b3JrIGluIHRoaXMgbW9kZTpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gcmV0dXJuIGF3YWl0IHRoaXMuc2VhcmNoKHtcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0hUTUw6IHRydWUsXG4gICAgICAgIC8vICAgICByZW5kZXJwYXRobWF0Y2g6IC9cXC9pbmRleC5odG1sJC8sXG4gICAgICAgIC8vICAgICByb290UGF0aDogcm9vdFBhdGhcbiAgICAgICAgLy8gfSk7XG4gICAgfVxuXG4gICAgI2ZpbGVzRm9yU2V0VGltZXM7XG5cbiAgICAvKipcbiAgICAgKiBGb3IgZXZlcnkgZmlsZSBpbiB0aGUgZG9jdW1lbnRzIGNhY2hlLFxuICAgICAqIHNldCB0aGUgYWNjZXNzIGFuZCBtb2RpZmljYXRpb25zLlxuICAgICAqIFxuICAgICAqIFRoaXMgaXMgdXNlZCBmcm9tIGNsaS50cyBkb2NzLXNldC1kYXRlc1xuICAgICAqXG4gICAgICogPz8/Pz8gV2h5IHdvdWxkIHRoaXMgYmUgdXNlZnVsP1xuICAgICAqIEkgY2FuIHNlZSBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWRcbiAgICAgKiBmaWxlcyBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeS4gIEJ1dCB0aGlzIGlzXG4gICAgICogZm9yIHRoZSBmaWxlcyBpbiB0aGUgZG9jdW1lbnRzIGRpcmVjdG9yaWVzLiA/Pz8/XG4gICAgICovXG4gICAgYXN5bmMgc2V0VGltZXMoKSB7XG5cbiAgICAgICAgLy8gVGhlIFNFTEVDVCBiZWxvdyBwcm9kdWNlcyByb3cgb2JqZWN0cyBwZXJcbiAgICAgICAgLy8gdGhpcyBpbnRlcmZhY2UgZGVmaW5pdGlvbi4gIFRoaXMgZnVuY3Rpb24gbG9va3NcbiAgICAgICAgLy8gZm9yIGEgdmFsaWQgZGF0ZSBmcm9tIHRoZSBkb2N1bWVudCBtZXRhZGF0YSxcbiAgICAgICAgLy8gYW5kIGVuc3VyZXMgdGhlIGZzcGF0aCBmaWxlIGlzIHNldCB0byB0aGF0IGRhdGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHNhaWQgaW4gdGhlIGNvbW1lbnQgYWJvdmUuLi4uIFdIWT9cbiAgICAgICAgLy8gSSBjYW4gdW5kZXJzdGFuZCBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWQgb3V0cHV0LlxuICAgICAgICAvLyBGb3Igd2hhdCBwdXJwb3NlIGRpZCBJIGNyZWF0ZSB0aGlzIGZ1bmN0aW9uP1xuICAgICAgICBjb25zdCBzZXR0ZXIgPSAocm93OiB7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgZnNwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBtdGltZU1zOiBudW1iZXIsXG4gICAgICAgICAgICBwdWJsaWNhdGlvblRpbWU6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxEYXRlOiBzdHJpbmcsXG4gICAgICAgICAgICBwdWJsaWNhdGlvbkRhdGU6IHN0cmluZ1xuICAgICAgICB9KSA9PiB7XG4gICAgICAgICAgICBsZXQgcGFyc2VkID0gTmFOO1xuICAgICAgICAgICAgaWYgKHJvdy5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxEYXRlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93LnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5wdWJsaWNhdGlvblRpbWUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZWQgPSByb3cucHVibGljYXRpb25UaW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRwID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICBGUy51dGltZXNTeW5jKFxuICAgICAgICAgICAgICAgICAgICByb3cuZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBkcCxcbiAgICAgICAgICAgICAgICAgICAgZHBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy4jZmlsZXNGb3JTZXRUaW1lcykge1xuICAgICAgICAgICAgdGhpcy4jZmlsZXNGb3JTZXRUaW1lcyA9XG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLnJlYWRGaWxlKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NxbCcsICdmaWxlcy1mb3Itc2V0dGltZXMuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuZGIuZWFjaCh0aGlzLiNmaWxlc0ZvclNldFRpbWVzLCB7IH0sXG4gICAgICAgIChyb3c6IHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBmc3BhdGg6IHN0cmluZyxcbiAgICAgICAgICAgIG10aW1lTXM6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uVGltZTogbnVtYmVyLFxuICAgICAgICAgICAgcHVibERhdGU6IHN0cmluZyxcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uRGF0ZTogc3RyaW5nXG4gICAgICAgIH0pID0+IHtcbiAgICAgICAgICAgIGlmIChyb3cucHVibERhdGVcbiAgICAgICAgICAgICB8fCByb3cucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgfHwgcm93LnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc2V0dGVyKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRoaXMgd2FzIHdyaXR0ZW4gZm9yIHRhZ2dlZC1jb250ZW50XG4gICAgYXN5bmMgZG9jdW1lbnRzV2l0aFRhZyh0YWdubTogc3RyaW5nIHwgc3RyaW5nW10pXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxzdHJpbmc+PlxuICAgIHtcbiAgICAgICAgbGV0IHRhZ3M6IHN0cmluZ1tdO1xuICAgICAgICBpZiAodHlwZW9mIHRhZ25tID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGFncyA9IFsgdGFnbm0gXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRhZ25tKSkge1xuICAgICAgICAgICAgdGFncyA9IHRhZ25tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudHNXaXRoVGFnIGdpdmVuIGJhZCB0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KHRhZ25tKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvcnJlY3RseSBoYW5kbGUgdGFnIHN0cmluZ3Mgd2l0aFxuICAgICAgICAvLyB2YXJ5aW5nIHF1b3Rlcy4gIEEgZG9jdW1lbnQgbWlnaHQgaGF2ZSB0aGVzZSB0YWdzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICB0YWdzOlxuICAgICAgICAvLyAgICAtIFRlYXNlcidzXG4gICAgICAgIC8vICAgIC0gVGVhc2Vyc1xuICAgICAgICAvLyAgICAtIFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZXNlIFNRTCBxdWVyaWVzIHdvcms6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVvdGVkXCInLCBcIlRlYXNlcidzXCIgKTtcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxUZWFzZXInc1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVvdGVkXCInLCAnVGVhc2VyJydzJyApO1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFRlYXNlcidzXG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8U29tZXRoaW5nIFwicXVvdGVkXCJcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQnV0LCB0aGlzIGRvZXMgbm90OlxuICAgICAgICAvL1xuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lID0gJ1RlYXNlcidzJztcbiAgICAgICAgLy8gJyAgLi4uPiBcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIG9yaWdpbmFsIGNvZGUgYmVoYXZpb3Igd2FzIHRoaXM6XG4gICAgICAgIC8vXG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInNcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuIGF0dGVtcHRlZCBmaXg6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgXCJUZWFzZXInc1wiIF0gICggJ1RlYXNlclxcJ3MnICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwic1wiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5vdGhlciBhdHRlbXB0ZWQgZml4OlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiBdICAoIFwiVGVhc2VyJydzXCIgKSBcbiAgICAgICAgLy8gW11cbiAgICAgICAgLy8gW11cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5kOlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyAnU29tZXRoaW5nIFwicXVvdGVkXCInXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyAnU29tZXRoaW5nIFwicXVvdGVkXCInIF0gICggXCJTb21ldGhpbmcgXCJxdW90ZWRcIlwiICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwicXVvdGVkXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgY29kZSBiZWxvdyBwcm9kdWNlczpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiICdTb21ldGhpbmcgXCJxdW90ZWRcIidcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiwgJ1NvbWV0aGluZyBcInF1b3RlZFwiJyBdICAoICdUZWFzZXInJ3MnLCdTb21ldGhpbmcgXCJxdW90ZWRcIicgKSBcbiAgICAgICAgLy8gWyB7IHZwYXRoOiAndGVhc2VyLWNvbnRlbnQuaHRtbC5tZCcgfSBdXG4gICAgICAgIC8vIFsgJ3RlYXNlci1jb250ZW50Lmh0bWwubWQnIF1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZG9jdW1lbnRzV2l0aFRhZyAke3V0aWwuaW5zcGVjdCh0YWdzKX0gJHt0YWdzdHJpbmd9YCk7XG5cbiAgICAgICAgY29uc3QgdnBhdGhzID0gYXdhaXQgdGdsdWUucGF0aHNGb3JUYWcodGFncyk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zb2xlLmxvZyh2cGF0aHMpO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2cGF0aHMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50c1dpdGhUYWcgbm9uLUFycmF5IHJlc3VsdCAke3V0aWwuaW5zcGVjdCh2cGF0aHMpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZwYXRocztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gYXJyYXkgb2YgdGFncyB1c2VkIGJ5IGFsbCBkb2N1bWVudHMuXG4gICAgICogVGhpcyB1c2VzIHRoZSBKU09OIGV4dGVuc2lvbiB0byBleHRyYWN0XG4gICAgICogdGhlIHRhZ3MgZnJvbSB0aGUgbWV0YWRhdGEgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgdGFncygpIHtcbiAgICAgICAgY29uc3QgdGFncyA9IGF3YWl0IHRnbHVlLnRhZ3MoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHJldCA9IEFycmF5LmZyb20odGFncyk7XG4gICAgICAgIHJldHVybiByZXQuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHZhciB0YWdBID0gYS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIHRhZ0IgPSBiLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAodGFnQSA8IHRhZ0IpIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmICh0YWdBID4gdGFnQikgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgI2RvY0xpbmtEYXRhO1xuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIGRhdGEgZm9yIGFuIGludGVybmFsIGxpbmtcbiAgICAgKiB3aXRoaW4gdGhlIHNpdGUgZG9jdW1lbnRzLiAgRm9ybWluZyBhblxuICAgICAqIGludGVybmFsIGxpbmsgaXMgYXQgYSBtaW5pbXVtIHRoZSByZW5kZXJlZFxuICAgICAqIHBhdGggZm9yIHRoZSBkb2N1bWVudCBhbmQgaXRzIHRpdGxlLlxuICAgICAqIFRoZSB0ZWFzZXIsIGlmIGF2YWlsYWJsZSwgY2FuIGJlIHVzZWQgaW5cbiAgICAgKiBhIHRvb2x0aXAuIFRoZSB0aHVtYm5haWwgaXMgYW4gaW1hZ2UgdGhhdFxuICAgICAqIGNvdWxkIGJlIGRpc3BsYXllZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBkb2NMaW5rRGF0YSh2cGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG5cbiAgICAgICAgLy8gVGhlIHZwYXRoIHJlZmVyZW5jZVxuICAgICAgICB2cGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgcGF0aCBpdCByZW5kZXJzIHRvXG4gICAgICAgIHJlbmRlclBhdGg6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIHRpdGxlIHN0cmluZyBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0aXRsZTogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGVhc2VyIHRleHQgZnJvbSB0aGF0IHBhZ2VcbiAgICAgICAgdGVhc2VyPzogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgaGVybyBpbWFnZSAodGh1bWJuYWlsKVxuICAgICAgICB0aHVtYm5haWw/OiBzdHJpbmc7XG4gICAgfT4ge1xuXG4gICAgICAgIGlmICghdGhpcy4jZG9jTGlua0RhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuI2RvY0xpbmtEYXRhID1cbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AucmVhZEZpbGUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3FsJywgJ2RvYy1saW5rLWRhdGEuc3FsJ1xuICAgICAgICAgICAgICAgICAgICApLCAndXRmLTgnXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZvdW5kID0gPGFueVtdPiBhd2FpdCB0aGlzLmRiLmFsbCh0aGlzLiNkb2NMaW5rRGF0YSwge1xuICAgICAgICAgICAgJHZwYXRoOiB2cGF0aFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmb3VuZCkpIHtcblxuICAgICAgICAgICAgY29uc3QgZG9jID0gZm91bmRbMF07XG5cbiAgICAgICAgICAgIC8vIGNvbnN0IGRvY0luZm8gPSBhd2FpdCB0aGlzLmZpbmQodnBhdGgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBkb2MucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICB0aXRsZTogZG9jLm1ldGFkYXRhLnRpdGxlLFxuICAgICAgICAgICAgICAgIHRlYXNlcjogZG9jLm1ldGFkYXRhLnRlYXNlcixcbiAgICAgICAgICAgICAgICAvLyB0aHVtYm5haWxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB0aXRsZTogdW5kZWZpbmVkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZWFyY2hDYWNoZTtcblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gZGVzY3JpcHRpdmUgc2VhcmNoIG9wZXJhdGlvbnMgdXNpbmcgZGlyZWN0IFNRTCBxdWVyaWVzXG4gICAgICogZm9yIGJldHRlciBwZXJmb3JtYW5jZSBhbmQgc2NhbGFiaWxpdHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBTZWFyY2ggb3B0aW9ucyBvYmplY3RcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlPEFycmF5PERvY3VtZW50Pj5cbiAgICAgKi9cbiAgICBhc3luYyBzZWFyY2gob3B0aW9ucyk6IFByb21pc2U8QXJyYXk8RG9jdW1lbnQ+PiB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLnNlYXJjaENhY2hlKSB7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaENhY2hlID0gbmV3IENhY2hlKFxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmlyc3QsIHNlZSBpZiB0aGUgc2VhcmNoIHJlc3VsdHMgYXJlIGFscmVhZHlcbiAgICAgICAgLy8gY29tcHV0ZWQgYW5kIGluIHRoZSBjYWNoZS5cblxuICAgICAgICAvLyBUaGUgaXNzdWUgaGVyZSBpcyB0aGF0IHRoZSBvcHRpb25zXG4gICAgICAgIC8vIG9iamVjdCBjYW4gY29udGFpbiBSZWdFeHAgdmFsdWVzLlxuICAgICAgICAvLyBUaGUgUmVnRXhwIG9iamVjdCBkb2VzIG5vdCBoYXZlXG4gICAgICAgIC8vIGEgdG9KU09OIGZ1bmN0aW9uLiAgVGhpcyBob29rXG4gICAgICAgIC8vIGNhdXNlcyBSZWdFeHAgdG8gcmV0dXJuIHRoZVxuICAgICAgICAvLyAudG9TdHJpbmcoKSB2YWx1ZSBpbnN0ZWFkLlxuICAgICAgICAvL1xuICAgICAgICAvLyBTb3VyY2U6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIwMjc2NTMxL3N0cmluZ2lmeWluZy1hLXJlZ3VsYXItZXhwcmVzc2lvblxuICAgICAgICAvL1xuICAgICAgICAvLyBBIHNpbWlsYXIgaXNzdWUgZXhpc3RzIHdpdGggRnVuY3Rpb25zXG4gICAgICAgIC8vIGluIHRoZSBvYmplY3QuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFNvdXJjZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjc1NDkxOS9qc29uLXN0cmluZ2lmeS1mdW5jdGlvblxuICAgICAgICBjb25zdCBjYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlICsgJyc7IC8vIGltcGxpY2l0bHkgYHRvU3RyaW5nYCBpdFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gQSB0aW1lb3V0IG9mIDAgbWVhbnMgdG8gZGlzYWJsZSBjYWNoaW5nXG4gICAgICAgIGNvbnN0IGNhY2hlZCA9XG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5zZWFyY2hDYWNoZS5nZXQoY2FjaGVLZXkpXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfSA9PT4gJHtjYWNoZUtleX0gJHtjYWNoZWQgPyAnaGFzQ2FjaGVkJyA6ICdub0NhY2hlZCd9YCk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGNhY2hlIGhhcyBhbiBlbnRyeSwgc2tpcCBjb21wdXRpbmdcbiAgICAgICAgLy8gYW55dGhpbmcuXG4gICAgICAgIGlmIChjYWNoZWQpIHsgLy8gMSBtaW51dGUgY2FjaGVcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOT1RFOiBFbnRyaWVzIGFyZSBhZGRlZCB0byB0aGUgY2FjaGUgYXQgdGhlIGJvdHRvbVxuICAgICAgICAvLyBvZiB0aGlzIGZ1bmN0aW9uXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgc3FsLCBwYXJhbXMgfSA9IHRoaXMuYnVpbGRTZWFyY2hRdWVyeShvcHRpb25zKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggJHtzcWx9YCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHRzXG4gICAgICAgICAgICAgICAgPSBhd2FpdCB0aGlzLmRiLmFsbChzcWwsIHBhcmFtcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50c1xuICAgICAgICAgICAgICAgID0gdGhpcy52YWxpZGF0ZVJvd3MocmVzdWx0cylcbiAgICAgICAgICAgICAgICAubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBBcHBseSBwb3N0LVNRTCBmaWx0ZXJzIHRoYXQgY2FuJ3QgYmUgZG9uZSBpbiBTUUxcbiAgICAgICAgICAgIGxldCBmaWx0ZXJlZFJlc3VsdHMgPSBkb2N1bWVudHM7XG5cbiAgICAgICAgICAgIC8vIEZpbHRlciBieSByZW5kZXJlcnMgKHJlcXVpcmVzIGNvbmZpZyBsb29rdXApXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJlcnNcbiAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVyZXJzKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbmRlcmVyID0gZmNhY2hlLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGl0ZW0udnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlbmRlcmVyKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCByIG9mIG9wdGlvbnMucmVuZGVyZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnICYmIHIgPT09IHJlbmRlcmVyLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1dBUk5JTkc6IE1hdGNoaW5nIHJlbmRlcmVyIGJ5IG9iamVjdCBjbGFzcyBpcyBubyBsb25nZXIgc3VwcG9ydGVkJywgcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBcHBseSBjdXN0b20gZmlsdGVyIGZ1bmN0aW9uXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXJmdW5jKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZmlsdGVyZnVuYyhmY2FjaGUuY29uZmlnLCBvcHRpb25zLCBpdGVtKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXBwbHkgY3VzdG9tIHNvcnQgZnVuY3Rpb24gKGlmIFNRTCBzb3J0aW5nIHdhc24ndCB1c2VkKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRGdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLnNvcnQob3B0aW9ucy5zb3J0RnVuYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFkZCB0aGUgcmVzdWx0cyB0byB0aGUgY2FjaGVcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaENhY2hlLnB1dChcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVLZXksIGZpbHRlcmVkUmVzdWx0c1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyZWRSZXN1bHRzO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5zZWFyY2ggZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCBTUUwgcXVlcnkgYW5kIHBhcmFtZXRlcnMgZm9yIHNlYXJjaCBvcHRpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZFNlYXJjaFF1ZXJ5KG9wdGlvbnMpOiB7XG4gICAgICAgIHNxbDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IGFueVxuICAgIH0ge1xuICAgICAgICBjb25zdCBwYXJhbXM6IGFueSA9IHt9O1xuICAgICAgICBjb25zdCB3aGVyZUNsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGpvaW5zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBsZXQgcGFyYW1Db3VudGVyID0gMDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgYnVpbGRTZWFyY2hRdWVyeSAke3V0aWwuaW5zcGVjdChvcHRpb25zKX1gKTtcblxuICAgICAgICAvLyBIZWxwZXIgdG8gY3JlYXRlIHVuaXF1ZSBwYXJhbWV0ZXIgbmFtZXNcbiAgICAgICAgY29uc3QgYWRkUGFyYW0gPSAodmFsdWU6IGFueSk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgJHBhcmFtJHsrK3BhcmFtQ291bnRlcn1gO1xuICAgICAgICAgICAgcGFyYW1zW3BhcmFtTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbU5hbWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQmFzZSBxdWVyeVxuICAgICAgICBsZXQgc3FsID0gYFxuICAgICAgICAgICAgU0VMRUNUIERJU1RJTkNUIGQuKiBGUk9NICR7dGhpcy5xdW90ZWREQk5hbWV9IGRcbiAgICAgICAgYDtcblxuICAgICAgICAvLyBNSU1FIHR5cGUgZmlsdGVyaW5nXG4gICAgICAgIGlmIChvcHRpb25zLm1pbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLm1pbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMubWltZSl9YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5taW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubWltZS5tYXAobWltZSA9PiBhZGRQYXJhbShtaW1lKSkuam9pbignLCAnKTtcbiAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5taW1lIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW5kZXJzIHRvIEhUTUwgZmlsdGVyaW5nXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJzVG9IVE1MID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnJlbmRlcnNUb0hUTUwgPSAke2FkZFBhcmFtKG9wdGlvbnMucmVuZGVyc1RvSFRNTCA/IDEgOiAwKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJvb3QgcGF0aCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJvb3RQYXRoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBMSUtFICR7YWRkUGFyYW0ob3B0aW9ucy5yb290UGF0aCArICclJyl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5nbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMuZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5nbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQudnBhdGggR0xPQiAke2FkZFBhcmFtKGVzY2FwZWRHbG9iKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciBnbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMucmVuZGVyZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5yZW5kZXJnbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLnJlbmRlcmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMucmVuZGVyZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5yZW5kZXJnbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBHTE9CICR7YWRkUGFyYW0oZXNjYXBlZEdsb2IpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmxvZyB0YWcgZmlsdGVyaW5nXG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBibG9ndGFncyBhcnJheSBpcyB1c2VkLFxuICAgICAgICAvLyBpZiBwcmVzZW50LCB3aXRoIHRoZSBibG9ndGFnIHZhbHVlIHVzZWRcbiAgICAgICAgLy8gb3RoZXJ3aXNlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgcHVycG9zZSBmb3IgdGhlIGJsb2d0YWdzIHZhbHVlIGlzIHRvXG4gICAgICAgIC8vIHN1cHBvcnQgYSBwc2V1ZG8tYmxvZyBtYWRlIG9mIHRoZSBpdGVtc1xuICAgICAgICAvLyBmcm9tIG11bHRpcGxlIGFjdHVhbCBibG9ncy5cbiAgICAgICAgLy8gaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAvLyAgfHwgdHlwZW9mIG9wdGlvbnMuYmxvZ3RhZyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhgIGJsb2d0YWdzICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZ3MpfSBibG9ndGFnICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZyl9YCk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5ibG9ndGFncykpIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMuYmxvZ3RhZ3MubWFwKHRhZyA9PiBhZGRQYXJhbSh0YWcpKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5ibG9ndGFnID0gJHthZGRQYXJhbShvcHRpb25zLmJsb2d0YWcpfWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQuYmxvZ3RhZyA9ICR7b3B0aW9ucy5ibG9ndGFnfWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBibG9ndGFncyBhcnJheSAke3V0aWwuaW5zcGVjdChvcHRpb25zLmJsb2d0YWdzKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRhZyBmaWx0ZXJpbmcgdXNpbmcgVEFHR0xVRSB0YWJsZVxuICAgICAgICBpZiAob3B0aW9ucy50YWcgJiYgdHlwZW9mIG9wdGlvbnMudGFnID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgam9pbnMucHVzaChgSU5ORVIgSk9JTiBUQUdHTFVFIHRnIE9OIGQudnBhdGggPSB0Zy5kb2N2cGF0aGApO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYHRnLnRhZ05hbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMudGFnKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExheW91dCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMubGF5b3V0cykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5sYXlvdXRzKSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxheW91dHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5sYXlvdXRzWzBdKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubGF5b3V0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubGF5b3V0cy5tYXAobGF5b3V0ID0+IGFkZFBhcmFtKGxheW91dCkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubGF5b3V0ID0gJHthZGRQYXJhbShvcHRpb25zLmxheW91dHMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGF0aCByZWdleCBtYXRjaGluZ1xuICAgICAgICBjb25zdCByZWdleENsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5wYXRobWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucGF0aG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5wYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciBwYXRoIHJlZ2V4IG1hdGNoaW5nXG4gICAgICAgIC8vIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3Qob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gsIGZhbHNlLCAzKSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIHN0cmluZyAke29wdGlvbnMucmVuZGVycGF0aG1hdGNofWApO1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIHJlZ2V4cCAke29wdGlvbnMucmVuZGVycGF0aG1hdGNoLnNvdXJjZX1gKTtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIGFycmF5IHN0cmluZyAke21hdGNofWApO1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIGFycmF5IHJlZ2V4cCAke21hdGNoLnNvdXJjZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdyZW5kZXJwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZWdleENsYXVzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYCgke3JlZ2V4Q2xhdXNlcy5qb2luKCcgT1IgJyl9KWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIEpPSU5zIHRvIHF1ZXJ5XG4gICAgICAgIGlmIChqb2lucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzcWwgKz0gJyAnICsgam9pbnMuam9pbignICcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIFdIRVJFIGNsYXVzZVxuICAgICAgICBpZiAod2hlcmVDbGF1c2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNxbCArPSAnIFdIRVJFICcgKyB3aGVyZUNsYXVzZXMuam9pbignIEFORCAnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBPUkRFUiBCWSBjbGF1c2VcbiAgICAgICAgbGV0IG9yZGVyQnkgPSAnJztcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRCeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIEhhbmRsZSBzcGVjaWFsIGNhc2VzIHRoYXQgbmVlZCBKU09OIGV4dHJhY3Rpb24gb3IgY29tcGxleCBsb2dpY1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25EYXRlJ1xuICAgICAgICAgICAgIHx8IG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25UaW1lJ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIENPQUxFU0NFIHRvIGhhbmRsZSBudWxsIHB1YmxpY2F0aW9uIGRhdGVzXG4gICAgICAgICAgICAgICAgb3JkZXJCeSA9IGBPUkRFUiBCWSBDT0FMRVNDRShcbiAgICAgICAgICAgICAgICAgICAgZC5wdWJsaWNhdGlvblRpbWUsXG4gICAgICAgICAgICAgICAgICAgIGQubXRpbWVNc1xuICAgICAgICAgICAgICAgIClgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIG90aGVyIGZpZWxkcywgc29ydCBieSB0aGUgY29sdW1uIGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBhbGxvd3Mgc29ydGluZyBieSBhbnkgdmFsaWQgY29sdW1uIGluIHRoZSBET0NVTUVOVFMgdGFibGVcbiAgICAgICAgICAgICAgICBvcmRlckJ5ID0gYE9SREVSIEJZIGQuJHtvcHRpb25zLnNvcnRCeX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMucmV2ZXJzZSB8fCBvcHRpb25zLnNvcnRCeURlc2NlbmRpbmcpIHtcbiAgICAgICAgICAgIC8vIElmIHJldmVyc2Uvc29ydEJ5RGVzY2VuZGluZyBpcyBzcGVjaWZpZWQgd2l0aG91dCBzb3J0QnksIFxuICAgICAgICAgICAgLy8gdXNlIGEgZGVmYXVsdCBvcmRlcmluZyAoYnkgbW9kaWZpY2F0aW9uIHRpbWUpXG4gICAgICAgICAgICBvcmRlckJ5ID0gJ09SREVSIEJZIGQubXRpbWVNcyc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgc29ydCBkaXJlY3Rpb25cbiAgICAgICAgaWYgKG9yZGVyQnkpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNvcnRCeURlc2NlbmRpbmcgfHwgb3B0aW9ucy5yZXZlcnNlKSB7XG4gICAgICAgICAgICAgICAgb3JkZXJCeSArPSAnIERFU0MnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcmRlckJ5ICs9ICcgQVNDJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNxbCArPSAnICcgKyBvcmRlckJ5O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIExJTUlUIGFuZCBPRkZTRVRcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxpbWl0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3FsICs9IGAgTElNSVQgJHthZGRQYXJhbShvcHRpb25zLmxpbWl0KX1gO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vZmZzZXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBzcWwgKz0gYCBPRkZTRVQgJHthZGRQYXJhbShvcHRpb25zLm9mZnNldCl9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IHNxbCwgcGFyYW1zIH07XG4gICAgfVxuXG59XG5cbmV4cG9ydCB2YXIgYXNzZXRzQ2FjaGU6IEFzc2V0c0NhY2hlO1xuZXhwb3J0IHZhciBwYXJ0aWFsc0NhY2hlOiBQYXJ0aWFsc0NhY2hlO1xuZXhwb3J0IHZhciBsYXlvdXRzQ2FjaGU6IExheW91dHNDYWNoZTtcbmV4cG9ydCB2YXIgZG9jdW1lbnRzQ2FjaGU6IERvY3VtZW50c0NhY2hlO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIGRiOiBBc3luY0RhdGFiYXNlXG4pOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgIC8vLy8gQVNTRVRTXG5cbiAgICBhd2FpdCBkb0NyZWF0ZUFzc2V0c1RhYmxlKGRiKTtcblxuICAgIGFzc2V0c0NhY2hlID0gbmV3IEFzc2V0c0NhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdhc3NldHMnLFxuICAgICAgICBjb25maWcuYXNzZXREaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ0FTU0VUUydcbiAgICApO1xuICAgIGF3YWl0IGFzc2V0c0NhY2hlLnNldHVwKCk7XG5cbiAgICBhc3NldHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChhcmdzKX1gKVxuICAgIH0pO1xuXG4gICAgLy8vLyBQQVJUSUFMU1xuXG4gICAgYXdhaXQgZG9DcmVhdGVQYXJ0aWFsc1RhYmxlKGRiKTtcblxuICAgIHBhcnRpYWxzQ2FjaGUgPSBuZXcgUGFydGlhbHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAncGFydGlhbHMnLFxuICAgICAgICBjb25maWcucGFydGlhbHNEaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ1BBUlRJQUxTJ1xuICAgICk7XG4gICAgYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgcGFydGlhbHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsc0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICAvLy8vIExBWU9VVFNcblxuICAgIGF3YWl0IGRvQ3JlYXRlTGF5b3V0c1RhYmxlKGRiKTtcblxuICAgIGxheW91dHNDYWNoZSA9IG5ldyBMYXlvdXRzQ2FjaGUoXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2xheW91dHMnLFxuICAgICAgICBjb25maWcubGF5b3V0RGlycyxcbiAgICAgICAgZGIsXG4gICAgICAgICdMQVlPVVRTJ1xuICAgICk7XG4gICAgYXdhaXQgbGF5b3V0c0NhY2hlLnNldHVwKCk7XG5cbiAgICBsYXlvdXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICAvLy8vIERPQ1VNRU5UU1xuXG4gICAgYXdhaXQgZG9DcmVhdGVEb2N1bWVudHNUYWJsZShkYik7XG5cbiAgICBkb2N1bWVudHNDYWNoZSA9IG5ldyBEb2N1bWVudHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAnZG9jdW1lbnRzJyxcbiAgICAgICAgY29uZmlnLmRvY3VtZW50RGlycyxcbiAgICAgICAgZGIsXG4gICAgICAgICdET0NVTUVOVFMnXG4gICAgKTtcbiAgICBhd2FpdCBkb2N1bWVudHNDYWNoZS5zZXR1cCgpO1xuICAgIGF3YWl0IHRnbHVlLmluaXQoZGIpO1xuICAgIGF3YWl0IHRkZXNjLmluaXQoZGIpO1xuXG4gICAgZG9jdW1lbnRzQ2FjaGUub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChlcnIpfWApO1xuICAgICAgICAvLyBwcm9jZXNzLmV4aXQoMCk7XG4gICAgfSk7XG5cbiAgICBhd2FpdCBjb25maWcuaG9va1BsdWdpbkNhY2hlU2V0dXAoKTtcblxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VGaWxlQ2FjaGVzKCkge1xuICAgIGlmIChkb2N1bWVudHNDYWNoZSkge1xuICAgICAgICBhd2FpdCBkb2N1bWVudHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBkb2N1bWVudHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGFzc2V0c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGFzc2V0c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGFzc2V0c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAobGF5b3V0c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGxheW91dHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBsYXlvdXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChwYXJ0aWFsc0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IHBhcnRpYWxzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgcGFydGlhbHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG4iXX0=