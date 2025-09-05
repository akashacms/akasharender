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
var _BaseCache_instances, _BaseCache_config, _BaseCache_name, _BaseCache_dirs, _BaseCache_is_ready, _BaseCache_db, _BaseCache_dbname, _BaseCache_watcher, _BaseCache_queue, _BaseCache_fExistsInDir;
import FS from 'node:fs';
import { DirsWatcher } from '@akashacms/stacked-dirs';
import path from 'node:path';
import util from 'node:util';
import EventEmitter from 'events';
import micromatch from 'micromatch';
import fastq from 'fastq';
import { TagGlue, TagDescriptions } from './tag-glue-new.js';
import { createAssetsTable, createDocumentsTable, createLayoutsTable, createPartialsTable, validateAsset, validateDocument, validateLayout, validatePartial, validatePathsReturnType } from './schema.js';
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
    /**
     * Find an info object based on vpath and mounted.
     *
     * @param vpath
     * @param mounted
     * @returns
     */
    async findPathMounted(vpath, mounted) {
        const found = await this.db.all(`
            SELECT vpath, mounted
            FROM ${this.quotedDBName}
            WHERE 
            vpath = $vpath AND mounted = $mounted
        `, {
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
        if (doCaching) {
            if (!this.findByPathCache) {
                this.findByPathCache
                    = new Cache(this.config.cachingTimeout);
            }
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
        const found = await this.db.all(`
            SELECT *
            FROM ${this.quotedDBName}
            WHERE 
            vpath = $vpath OR renderPath = $vpath
        `, {
            $vpath: vpath
        });
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
        await this.db.run(`
            DELETE FROM ${this.quotedDBName}
            WHERE
            vpath = $vpath AND mounted = $mounted
        `, {
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
        // This is copied from the older version
        // (LokiJS version) of this function.  It
        // seems meant to eliminate duplicates.
        const vpathsSeen = new Set();
        // Select the fields in PathsReturnType
        const results = (typeof rootP === 'string')
            ? await this.db.all(`
            SELECT
                vpath, mime, mounted, mountPoint,
                pathInMounted, mtimeMs,
                info, fspath, renderPath
            FROM ${this.quotedDBName}
            WHERE
            renderPath LIKE $rootP
            ORDER BY mtimeMs ASC
        `, {
                $rootP: `${rootP}%`
            })
            : await this.db.all(`
            SELECT
                vpath, mime, mounted, mountPoint,
                pathInMounted, mtimeMs,
                info, fspath, renderPath
            FROM ${this.quotedDBName}
            ORDER BY mtimeMs ASC
        `);
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
        await this.db.run(`
            INSERT INTO ${this.quotedDBName}
            (
                vpath,
                mime,
                mounted,
                mountPoint,
                pathInMounted,
                fspath,
                dirname,
                mtimeMs,
                info
            )
            VALUES
            (
                $vpath,
                $mime,
                $mounted,
                $mountPoint,
                $pathInMounted,
                $fspath,
                $dirname,
                $mtimeMs,
                $info
            )
        `, {
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
        await this.db.run(`
            UPDATE ${this.quotedDBName}
            SET 
                mime = $mime,
                mounted = $mounted,
                mountPoint = $mountPoint,
                pathInMounted = $pathInMounted,
                fspath = $fspath,
                dirname = $dirname,
                mtimeMs = $mtimeMs,
                info = $info
            WHERE
                vpath = $vpath
        `, {
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
export class PartialsCache extends BaseCache {
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
        await this.db.run(`
            INSERT INTO ${this.quotedDBName}
            (
                vpath,
                mime,
                mounted,
                mountPoint,
                pathInMounted,
                fspath,
                dirname,
                mtimeMs,
                info,

                docBody,
                rendererName
            )
            VALUES
            (
                $vpath,
                $mime,
                $mounted,
                $mountPoint,
                $pathInMounted,
                $fspath,
                $dirname,
                $mtimeMs,
                $info,

                $docBody,
                $rendererName
            )
        `, {
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
        await this.db.run(`
            UPDATE ${this.quotedDBName}
            SET 
                mime = $mime,
                mounted = $mounted,
                mountPoint = $mountPoint,
                pathInMounted = $pathInMounted,
                fspath = $fspath,
                dirname = $dirname,
                mtimeMs = $mtimeMs,
                info = $info,

                docBody = $docBody,
                rendererName = $rendererName
            WHERE
                vpath = $vpath
        `, {
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
export class LayoutsCache extends BaseCache {
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
        await this.db.run(`
            INSERT INTO ${this.quotedDBName}
            (
                vpath,
                mime,
                mounted,
                mountPoint,
                pathInMounted,
                fspath,
                dirname,
                mtimeMs,
                info,

                rendersToHTML,
                docBody,
                rendererName
            )
            VALUES
            (
                $vpath,
                $mime,
                $mounted,
                $mountPoint,
                $pathInMounted,
                $fspath,
                $dirname,
                $mtimeMs,
                $info,

                $rendersToHTML,
                $docBody,
                $rendererName
            )
        `, {
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
        await this.db.run(`
            UPDATE ${this.quotedDBName}
            SET 
                mime = $mime,
                mounted = $mounted,
                mountPoint = $mountPoint,
                pathInMounted = $pathInMounted,
                fspath = $fspath,
                dirname = $dirname,
                mtimeMs = $mtimeMs,
                info = $info,

                rendersToHTML = $rendersToHTML,
                docBody = $docBody,
                rendererName = $rendererName
            WHERE
                vpath = $vpath
        `, {
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
export class DocumentsCache extends BaseCache {
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
    async insertDocToDB(info) {
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
        await this.db.run(`
            INSERT INTO ${this.quotedDBName}
            (
                vpath,
                mime,
                mounted,
                mountPoint,
                pathInMounted,
                fspath,
                dirname,
                mtimeMs,
                info,


                renderPath,
                rendersToHTML,
                parentDir,
                docMetadata,
                docContent,
                docBody,
                rendererName
            )
            VALUES
            (
                $vpath,
                $mime,
                $mounted,
                $mountPoint,
                $pathInMounted,
                $fspath,
                $dirname,
                $mtimeMs,
                $info,


                $renderPath,
                $rendersToHTML,
                $parentDir,
                $docMetadata,
                $docContent,
                $docBody,
                $rendererName
            )
        `, toInsert);
        // await this.dao.insert(docInfo);
        if (info.metadata) {
            await this.addDocTagGlue(info.vpath, info.metadata.tags);
        }
    }
    async updateDocInDB(info) {
        await this.db.run(`
            UPDATE ${this.quotedDBName}
            SET 
                mime = $mime,
                mounted = $mounted,
                mountPoint = $mountPoint,
                pathInMounted = $pathInMounted,
                fspath = $fspath,
                dirname = $dirname,
                mtimeMs = $mtimeMs,
                info = $info,

                renderPath = $renderPath,
                rendersToHTML = $rendersToHTML,
                parentDir = $parentDir,
                docMetadata = $docMetadata,
                docContent = $docContent,
                docBody = $docBody,
                rendererName = $rendererName
            WHERE
                vpath = $vpath
        `, {
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
        const siblings = await this.db.all(`
            SELECT * FROM ${this.quotedDBName}
            WHERE
            dirname = $dirname AND
            vpath <> $vpath AND
            renderPath <> $vpath AND
            rendersToHtml = true
        `, {
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
        // Picks up everything from the current level.
        // Differs from siblings by getting everything.
        const _items = await this.db.all(`
            SELECT *
            FROM ${this.quotedDBName}
            WHERE dirname = $dirname AND rendersToHTML = true
        `, {
            $dirname: dirname
        });
        const items = this.validateRows(_items)
            .map(item => {
            return this.cvtRowToObj(item);
        });
        const _childFolders = await this.db.all(`
            SELECT distinct dirname FROM DOCUMENTS
            WHERE parentDir = $dirname
        `, {
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
            ? `AND ( renderPath LIKE '${rootP}%' )`
            : '';
        const indexes = await this.db.all(`
        SELECT *
        FROM DOCUMENTS
        WHERE
            ( rendersToHTML = true )
        AND (
            ( renderPath LIKE '%/index.html' )
         OR ( renderPath = 'index.html' )
        )
        ${rootQ}
        `);
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
        await this.db.each(`
            SELECT
                vpath, fspath,
                mtimeMs, publicationTime,
                json_extract(info, '$.docMetadata.publDate') as publDate,
                json_extract(info, '$.docMetadata.publicationDate') as publicationDate,
            FROM ${this.quotedDBName}
        `, {}, (row) => {
            if (row.publDate
                || row.publicationDate
                || row.publicationTime) {
                setter(row);
            }
        });
    }
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
        const found = await this.db.all(`
            SELECT *
            FROM ${this.quotedDBName}
            WHERE 
            vpath = $vpath OR renderPath = $vpath
        `, {
            $vpath: vpath
        });
        if (Array.isArray(found)) {
            const doc = this.validateRow(found[0]);
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
    //  = new Map<
    //         string, { results: Document[], timestamp: number }
    // >();
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
export var assetsCache;
export var partialsCache;
export var layoutsCache;
export var documentsCache;
export async function setup(config, db) {
    // console.log(createAssetsTable);
    await db.run(createAssetsTable);
    assetsCache = new AssetsCache(config, 'assets', config.assetDirs, db, 'ASSETS');
    await assetsCache.setup();
    assetsCache.on('error', (...args) => {
        console.error(`assetsCache ERROR ${util.inspect(args)}`);
    });
    // console.log(createPartialsTable);
    await db.run(createPartialsTable);
    partialsCache = new PartialsCache(config, 'partials', config.partialsDirs, db, 'PARTIALS');
    await partialsCache.setup();
    partialsCache.on('error', (...args) => {
        console.error(`partialsCache ERROR ${util.inspect(args)}`);
    });
    // console.log(createLayoutsTable);
    await db.run(createLayoutsTable);
    layoutsCache = new LayoutsCache(config, 'layouts', config.layoutDirs, db, 'LAYOUTS');
    await layoutsCache.setup();
    layoutsCache.on('error', (...args) => {
        console.error(`layoutsCache ERROR ${util.inspect(args)}`);
    });
    // console.log(`DocumentsFileCache 'documents' ${util.inspect(config.documentDirs)}`);
    // console.log(createDocumentsTable);
    await db.run(createDocumentsTable);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUtc3FsaXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NhY2hlL2NhY2hlLXNxbGl0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSxPQUFPLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDekIsT0FBTyxFQUNILFdBQVcsRUFDZCxNQUFNLHlCQUF5QixDQUFDO0FBSWpDLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxZQUFZLE1BQU0sUUFBUSxDQUFDO0FBQ2xDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUNILE9BQU8sRUFBRSxlQUFlLEVBQzNCLE1BQU0sbUJBQW1CLENBQUM7QUFDM0IsT0FBTyxFQUNILGlCQUFpQixFQUNqQixvQkFBb0IsRUFDcEIsa0JBQWtCLEVBQ2xCLG1CQUFtQixFQUNGLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLHVCQUF1QixFQUM3RyxNQUFNLGFBQWEsQ0FBQztBQUlyQixPQUFPLFNBQVMsTUFBTSxrQkFBa0IsQ0FBQztBQVF6QyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFFMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM1Qix3QkFBd0I7QUFFeEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztBQUNwQyx3QkFBd0I7QUFFeEIscURBQXFEO0FBQ3JELHNCQUFzQjtBQUN0QixNQUFNLFNBQVMsR0FBRyxDQUFDLElBQWtCLEVBQWdCLEVBQUU7SUFDbkQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ2xCLHFDQUFxQztRQUNyQyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzFC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QUcsU0FBUyxDQUFDO0lBQy9CLENBQUM7SUFDRCxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2QsTUFBTSxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsV0FBVyxHQUFHLFNBQVMsQ0FBQztJQUM1QixDQUFDO0lBQ0QsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUNmLE1BQU0sWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzNCLFlBQVksR0FBRyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUNELElBQUksYUFBYSxFQUFFLENBQUM7UUFDaEIsTUFBTSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDNUIsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUM5QixDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IEZTIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHtcbiAgICBEaXJzV2F0Y2hlciwgZGlyVG9XYXRjaCwgVlBhdGhEYXRhXG59IGZyb20gJ0Bha2FzaGFjbXMvc3RhY2tlZC1kaXJzJztcbmltcG9ydCB7XG4gICAgQ29uZmlndXJhdGlvbiwgZGlyVG9Nb3VudCwgaW5kZXhDaGFpbkl0ZW1cbn0gZnJvbSAnLi4vaW5kZXguanMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQge1xuICAgIFRhZ0dsdWUsIFRhZ0Rlc2NyaXB0aW9uc1xufSBmcm9tICcuL3RhZy1nbHVlLW5ldy5qcyc7XG5pbXBvcnQge1xuICAgIGNyZWF0ZUFzc2V0c1RhYmxlLFxuICAgIGNyZWF0ZURvY3VtZW50c1RhYmxlLFxuICAgIGNyZWF0ZUxheW91dHNUYWJsZSxcbiAgICBjcmVhdGVQYXJ0aWFsc1RhYmxlLFxuICAgIFBhdGhzUmV0dXJuVHlwZSwgdmFsaWRhdGVBc3NldCwgdmFsaWRhdGVEb2N1bWVudCwgdmFsaWRhdGVMYXlvdXQsIHZhbGlkYXRlUGFydGlhbCwgdmFsaWRhdGVQYXRoc1JldHVyblR5cGVcbn0gZnJvbSAnLi9zY2hlbWEuanMnO1xuXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gJ3NxbGl0ZTMnO1xuaW1wb3J0IHsgQXN5bmNEYXRhYmFzZSB9IGZyb20gJ3Byb21pc2VkLXNxbGl0ZTMnO1xuaW1wb3J0IFNxbFN0cmluZyBmcm9tICdzcWxzdHJpbmctc3FsaXRlJztcbmltcG9ydCB7XG4gICAgQmFzZUNhY2hlRW50cnksXG4gICAgQXNzZXQsXG4gICAgUGFydGlhbCxcbiAgICBMYXlvdXQsXG4gICAgRG9jdW1lbnRcbn0gZnJvbSAnLi9zY2hlbWEuanMnO1xuaW1wb3J0IENhY2hlIGZyb20gJ2NhY2hlJztcblxuY29uc3QgdGdsdWUgPSBuZXcgVGFnR2x1ZSgpO1xuLy8gdGdsdWUuaW5pdChzcWRiLl9kYik7XG5cbmNvbnN0IHRkZXNjID0gbmV3IFRhZ0Rlc2NyaXB0aW9ucygpO1xuLy8gdGRlc2MuaW5pdChzcWRiLl9kYik7XG5cbi8vIENvbnZlcnQgQWthc2hhQ01TIG1vdW50IHBvaW50cyBpbnRvIHRoZSBtb3VudHBvaW50XG4vLyB1c2VkIGJ5IERpcnNXYXRjaGVyXG5jb25zdCByZW1hcGRpcnMgPSAoZGlyejogZGlyVG9Nb3VudFtdKTogZGlyVG9XYXRjaFtdID0+IHtcbiAgICByZXR1cm4gZGlyei5tYXAoZGlyID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2RvY3VtZW50IGRpciAnLCBkaXIpO1xuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6ICcvJyxcbiAgICAgICAgICAgICAgICBiYXNlTWV0YWRhdGE6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFkaXIuZGVzdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVtYXBkaXJzIGludmFsaWQgbW91bnQgc3BlY2lmaWNhdGlvbiAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIuc3JjLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5kZXN0LFxuICAgICAgICAgICAgICAgIGJhc2VNZXRhZGF0YTogZGlyLmJhc2VNZXRhZGF0YSxcbiAgICAgICAgICAgICAgICBpZ25vcmU6IGRpci5pZ25vcmVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbmV4cG9ydCBjbGFzcyBCYXNlQ2FjaGU8XG4gICAgVCBleHRlbmRzIEJhc2VDYWNoZUVudHJ5XG4+IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICAgICNjb25maWc/OiBDb25maWd1cmF0aW9uO1xuICAgICNuYW1lPzogc3RyaW5nO1xuICAgICNkaXJzPzogZGlyVG9Nb3VudFtdO1xuICAgICNpc19yZWFkeTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgI2RiOiBBc3luY0RhdGFiYXNlO1xuICAgICNkYm5hbWU6IHN0cmluZztcblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAgICAgKiBAcGFyYW0gZGlycyBhcnJheSBvZiBkaXJlY3RvcmllcyBhbmQgbW91bnQgcG9pbnRzIHRvIHdhdGNoXG4gICAgICogQHBhcmFtIG5hbWUgc3RyaW5nIGdpdmluZyB0aGUgbmFtZSBmb3IgdGhpcyB3YXRjaGVyIG5hbWVcbiAgICAgKiBAcGFyYW0gZGIgVGhlIFBST01JU0VEIFNRTElURTMgQXN5bmNEYXRhYmFzZSBpbnN0YW5jZSB0byB1c2VcbiAgICAgKiBAcGFyYW0gZGJuYW1lIFRoZSBkYXRhYmFzZSBuYW1lIHRvIHVzZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZGlyczogZGlyVG9Nb3VudFtdLFxuICAgICAgICBkYjogQXN5bmNEYXRhYmFzZSxcbiAgICAgICAgZGJuYW1lOiBzdHJpbmdcbiAgICApIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEJhc2VGaWxlQ2FjaGUgJHtuYW1lfSBjb25zdHJ1Y3RvciBkaXJzPSR7dXRpbC5pbnNwZWN0KGRpcnMpfWApO1xuICAgICAgICB0aGlzLiNjb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuI25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLiNkaXJzID0gZGlycztcbiAgICAgICAgdGhpcy4jaXNfcmVhZHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jZGIgPSBkYjtcbiAgICAgICAgdGhpcy4jZGJuYW1lID0gZGJuYW1lO1xuICAgIH1cblxuICAgIGdldCBjb25maWcoKSAgICAgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgZ2V0IG5hbWUoKSAgICAgICB7IHJldHVybiB0aGlzLiNuYW1lOyB9XG4gICAgZ2V0IGRpcnMoKSAgICAgICB7IHJldHVybiB0aGlzLiNkaXJzOyB9XG4gICAgZ2V0IGRiKCkgICAgICAgICB7IHJldHVybiB0aGlzLiNkYjsgfVxuICAgIGdldCBkYm5hbWUoKSAgICAgeyByZXR1cm4gdGhpcy4jZGJuYW1lOyB9XG4gICAgZ2V0IHF1b3RlZERCTmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIFNxbFN0cmluZy5lc2NhcGUodGhpcy4jZGJuYW1lKTtcbiAgICB9XG5cbiAgICAjd2F0Y2hlcjogRGlyc1dhdGNoZXI7XG4gICAgI3F1ZXVlO1xuXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLiNxdWV1ZSkge1xuICAgICAgICAgICAgdGhpcy4jcXVldWUua2lsbEFuZERyYWluKCk7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4jd2F0Y2hlcikge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENMT1NJTkcgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiN3YXRjaGVyLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLiN3YXRjaGVyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdjaGFuZ2VkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdhZGRlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygndW5saW5rZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlYWR5Jyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuI2RiLmNsb3NlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGAke3RoaXMubmFtZX0gZXJyb3Igb24gY2xvc2UgJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB1cCByZWNlaXZpbmcgZXZlbnRzIGZyb20gRGlyc1dhdGNoZXIsIGFuZCBkaXNwYXRjaGluZyB0b1xuICAgICAqIHRoZSBoYW5kbGVyIG1ldGhvZHMuXG4gICAgICovXG4gICAgYXN5bmMgc2V0dXAoKSB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuI3dhdGNoZXIpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI3F1ZXVlID0gZmFzdHEucHJvbWlzZShhc3luYyBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5jb2RlID09PSAnY2hhbmdlZCcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hhbmdlICR7ZXZlbnQubmFtZX0gJHtldmVudC5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlQ2hhbmdlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2NoYW5nZScsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ2FkZGVkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGQgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVBZGRlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2FkZCcsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm86IGV2ZW50LmluZm8sXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICd1bmxpbmtlZCcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgdW5saW5rICR7ZXZlbnQubmFtZX0gJHtldmVudC5pbmZvLnZwYXRofWAsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlVW5saW5rZWQoZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCd1bmxpbmsnLCBldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlRXJyb3IoZXZlbnQubmFtZSkgKi9cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ3JlYWR5Jykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVSZWFkeShldmVudC5uYW1lKTtcbiAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgncmVhZHknLCBldmVudC5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTApO1xuXG4gICAgICAgIHRoaXMuI3dhdGNoZXIgPSBuZXcgRGlyc1dhdGNoZXIodGhpcy5uYW1lKTtcblxuICAgICAgICB0aGlzLiN3YXRjaGVyLm9uKCdjaGFuZ2UnLCBhc3luYyAobmFtZTogc3RyaW5nLCBpbmZvOiBWUGF0aERhdGEpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IGNoYW5nZWQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFBVU0ggJHtuYW1lfSBjaGFuZ2VkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnY2hhbmdlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICdjaGFuZ2UnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCBjaGFuZ2UgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ2FkZCcsIGFzeW5jIChuYW1lOiBzdHJpbmcsIGluZm86IFZQYXRoRGF0YSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtuYW1lfSBhZGQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFVTSCAke25hbWV9IGFkZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ2FkZGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ2FkZCcgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIGFkZCAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigndW5saW5rJywgYXN5bmMgKG5hbWU6IHN0cmluZywgaW5mbzogVlBhdGhEYXRhKSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgdW5saW5rICR7bmFtZX0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICd1bmxpbmtlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICd1bmxpbmsnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgdW5saW5rICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdyZWFkeScsIGFzeW5jIChuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IHJlYWR5YCk7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb2RlOiAncmVhZHknLFxuICAgICAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHNldHVwICR7dGhpcy4jbmFtZX0gd2F0Y2ggJHt1dGlsLmluc3BlY3QodGhpcy4jZGlycyl9ID09PiAke3V0aWwuaW5zcGVjdChtYXBwZWQpfWApO1xuICAgICAgICBhd2FpdCB0aGlzLiN3YXRjaGVyLndhdGNoKG1hcHBlZCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYERBTyAke3RoaXMuZGFvLnRhYmxlLm5hbWV9ICR7dXRpbC5pbnNwZWN0KHRoaXMuZGFvLnRhYmxlLmZpZWxkcyl9YCk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0ZSBhbiBpdGVtLCB3aGljaCBpcyBleHBlY3RlZCB0byBiZVxuICAgICAqIGEgcm93IGZyb20gZGF0YWJhc2UgcXVlcnkgcmVzdWx0cywgdXNpbmdcbiAgICAgKiBvbmUgb2YgdGhlIHZhbGlkYXRvciBmdW5jdGlvbnMgaW4gc2NoZW1hLnRzLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBtdXN0IGJlIHN1YmNsYXNzZWQgdG9cbiAgICAgKiBmdW5jdGlvbiBjb3JyZWN0bHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm93IFxuICAgICAqL1xuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvdyhyb3c6IGFueSk6IFQge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHZhbGlkYXRlUm93IG11c3QgYmUgc3ViY2xhc3NlZGApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIGFuIGFycmF5LCB3aGljaCBpcyBleHBlY3RlZCB0byBiZVxuICAgICAqIGRhdGFiYXNlIHF1ZXJ5IHJlc3VsdHMsIHVzaW5nIG9uZSBvZiB0aGVcbiAgICAgKiB2YWxpZGF0b3IgZnVuY3Rpb25zIGluIHNjaGVtYS50cy5cbiAgICAgKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gbXVzdCBiZSBzdWJjbGFzc2VkIHRvXG4gICAgICogZnVuY3Rpb24gY29ycmVjdGx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvdyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogVFtdIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBzdWJjbGFzc2VkYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBmaWVsZHMgZnJvbSB0aGUgZGF0YWJhc2VcbiAgICAgKiByZXByZXNlbnRhdGlvbiB0byB0aGUgZm9ybSByZXF1aXJlZFxuICAgICAqIGZvciBleGVjdXRpb24uXG4gICAgICogXG4gICAgICogVGhlIGRhdGFiYXNlIGNhbm5vdCBzdG9yZXMgSlNPTiBmaWVsZHNcbiAgICAgKiBhcyBhbiBvYmplY3Qgc3RydWN0dXJlLCBidXQgYXMgYSBzZXJpYWxpZWRcbiAgICAgKiBKU09OIHN0cmluZy4gIEluc2lkZSBBa2FzaGFDTVMgY29kZSB0aGF0XG4gICAgICogb2JqZWN0IG11c3QgYmUgYW4gb2JqZWN0IHJhdGhlciB0aGFuXG4gICAgICogYSBzdHJpbmcuXG4gICAgICogXG4gICAgICogVGhlIG9iamVjdCBwYXNzZWQgYXMgXCJyb3dcIiBzaG91bGQgYWxyZWFkeVxuICAgICAqIGhhdmUgYmVlbiB2YWxpZGF0ZWQgdXNpbmcgdmFsaWRhdGVSb3cuXG4gICAgICogXG4gICAgICogQHBhcmFtIHJvdyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoocm93OiBhbnkpOiBUIHtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDxUPnJvdztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGFuIGluZm8gb2JqZWN0IGJhc2VkIG9uIHZwYXRoIGFuZCBtb3VudGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEBwYXJhbSBtb3VudGVkIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBmaW5kUGF0aE1vdW50ZWQoXG4gICAgICAgIHZwYXRoOiBzdHJpbmcsIG1vdW50ZWQ6IHN0cmluZ1xuICAgICk6IFByb21pc2U8QXJyYXk8e1xuICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICBtb3VudGVkOiBzdHJpbmdcbiAgICB9Pj4gIHtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGZvdW5kID0gPGFueVtdPmF3YWl0IHRoaXMuZGIuYWxsKGBcbiAgICAgICAgICAgIFNFTEVDVCB2cGF0aCwgbW91bnRlZFxuICAgICAgICAgICAgRlJPTSAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICAgICAgV0hFUkUgXG4gICAgICAgICAgICB2cGF0aCA9ICR2cGF0aCBBTkQgbW91bnRlZCA9ICRtb3VudGVkXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICR2cGF0aDogdnBhdGgsXG4gICAgICAgICAgICAkbW91bnRlZDogbW91bnRlZFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgbWFwcGVkID0gbmV3IEFycmF5PHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBtb3VudGVkOiBzdHJpbmdcbiAgICAgICAgfT4oKTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGZvdW5kKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0udnBhdGggPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgJiYgdHlwZW9mIGl0ZW0ubW91bnRlZCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIG1hcHBlZC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsIG1vdW50ZWQ6IGl0ZW0ubW91bnRlZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmRQYXRoTW91bnRlZDogSW52YWxpZCBvYmplY3QgIGZvdW5kIGluIHF1ZXJ5ICgke3ZwYXRofSwgJHttb3VudGVkfSkgcmVzdWx0cyAke3V0aWwuaW5zcGVjdChpdGVtKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFwcGVkO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBmaW5kQnlQYXRoQ2FjaGU7XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGFuIGluZm8gb2JqZWN0IGJ5IHRoZSB2cGF0aC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZmluZEJ5UGF0aCh2cGF0aDogc3RyaW5nKSB7XG5cbiAgICAgICAgY29uc3QgZG9DYWNoaW5nXG4gICAgICAgICAgICA9IHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0ID4gMDtcbiAgICAgICAgbGV0IGNhY2hlS2V5O1xuXG4gICAgICAgIGlmIChkb0NhY2hpbmcpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5maW5kQnlQYXRoQ2FjaGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRCeVBhdGhDYWNoZVxuICAgICAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgY2FjaGVkXG4gICAgICAgICAgICAgICAgPSB0aGlzLmZpbmRCeVBhdGhDYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgICAgICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZEJ5UGF0aCAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9ICR7dnBhdGh9YCk7XG5cbiAgICAgICAgY29uc3QgZm91bmQgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUICpcbiAgICAgICAgICAgIEZST00gJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIFdIRVJFIFxuICAgICAgICAgICAgdnBhdGggPSAkdnBhdGggT1IgcmVuZGVyUGF0aCA9ICR2cGF0aFxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHRoaXMudmFsaWRhdGVSb3dzKGZvdW5kKTtcblxuICAgICAgICBjb25zdCByZXQgPSBtYXBwZWQubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGRvQ2FjaGluZyAmJiBjYWNoZUtleSkge1xuICAgICAgICAgICAgdGhpcy5maW5kQnlQYXRoQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm86IFQpIHtcbiAgICAgICAgLy8gUGxhY2Vob2xkZXIgd2hpY2ggc29tZSBzdWJjbGFzc2VzXG4gICAgICAgIC8vIGFyZSBleHBlY3RlZCB0byBvdmVycmlkZVxuXG4gICAgICAgIC8vIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgZ2F0aGVySW5mb0RhdGEgbXVzdCBiZSBvdmVycmlkZGVuYCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZUNoYW5nZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZUNoYW5nZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09PT09PR0EhISEgUmVjZWl2ZWQgYSBmaWxlIHRoYXQgc2hvdWxkIGJlIGluZ29yZWQgYCwgaW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVDaGFuZ2VkIGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhhbmRsZUNoYW5nZWQgJHtpbmZvLnZwYXRofSAke2luZm8ubWV0YWRhdGEgJiYgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPyBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA6ICc/Pz8nfWApO1xuXG4gICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5maW5kUGF0aE1vdW50ZWQoaW5mby52cGF0aCwgaW5mby5tb3VudGVkKTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhQXJyYXkuaXNBcnJheShyZXN1bHQpXG4gICAgICAgICB8fCByZXN1bHQubGVuZ3RoIDw9IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBJdCB3YXNuJ3QgZm91bmQgaW4gdGhlIGRhdGFiYXNlLlxuICAgICAgICAgICAgLy8gSGVuY2Ugd2Ugc2hvdWxkIGFkZCBpdC5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUFkZGVkKG5hbWUsIGluZm8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVEb2NJbkRCKGluZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUNoYW5nZWQobmFtZSwgaW5mbyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2UgcmVjZWl2ZSB0aGlzOlxuICAgICAqXG4gICAgICoge1xuICAgICAqICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAqICAgIHZwYXRoOiB2cGF0aCxcbiAgICAgKiAgICBtaW1lOiBtaW1lLmdldFR5cGUoZnNwYXRoKSxcbiAgICAgKiAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgKiAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgKiAgICBwYXRoSW5Nb3VudGVkOiBjb21wdXRlZCByZWxhdGl2ZSBwYXRoXG4gICAgICogICAgc3RhY2s6IFsgYXJyYXkgb2YgdGhlc2UgaW5zdGFuY2VzIF1cbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBOZWVkIHRvIGFkZDpcbiAgICAgKiAgICByZW5kZXJQYXRoXG4gICAgICogICAgQW5kIGZvciBIVE1MIHJlbmRlciBmaWxlcywgYWRkIHRoZSBiYXNlTWV0YWRhdGEgYW5kIGRvY01ldGFkYXRhXG4gICAgICpcbiAgICAgKiBTaG91bGQgcmVtb3ZlIHRoZSBzdGFjaywgc2luY2UgaXQncyBsaWtlbHkgbm90IHVzZWZ1bCB0byB1cy5cbiAgICAgKi9cblxuICAgIHByb3RlY3RlZCBhc3luYyBoYW5kbGVBZGRlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vICBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZUFkZGVkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmICh0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBPT09PT09PT0dBISEhIFJlY2VpdmVkIGEgZmlsZSB0aGF0IHNob3VsZCBiZSBpbmdvcmVkIGAsIGluZm8pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlQWRkZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5zZXJ0RG9jVG9EQihpbmZvKTtcbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVBZGRlZChuYW1lLCBpbmZvKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihpbmZvOiBUKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW5zZXJ0RG9jVG9EQiBtdXN0IGJlIG92ZXJyaWRkZW5gKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvOiBUKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdXBkYXRlRG9jSW5EQiBtdXN0IGJlIG92ZXJyaWRkZW5gKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaGFuZGxlVW5saW5rZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZVVubGlua2VkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlVW5saW5rZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmhvb2tGaWxlVW5saW5rZWQobmFtZSwgaW5mbyk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYFxuICAgICAgICAgICAgREVMRVRFIEZST00gJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIFdIRVJFXG4gICAgICAgICAgICB2cGF0aCA9ICR2cGF0aCBBTkQgbW91bnRlZCA9ICRtb3VudGVkXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWRcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGF3YWl0IHRoaXMuI2Rhby5kZWxldGVBbGwoe1xuICAgICAgICAvLyAgICAgdnBhdGg6IHsgZXE6IGluZm8udnBhdGggfSxcbiAgICAgICAgLy8gICAgIG1vdW50ZWQ6IHsgZXE6IGluZm8ubW91bnRlZCB9XG4gICAgICAgIC8vIH0gYXMgV2hlcmU8VD4pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBoYW5kbGVSZWFkeShuYW1lKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlUmVhZHlgKTtcbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVSZWFkeSBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2lzX3JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0KCdyZWFkeScsIG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFsbG93IGEgY2FsbGVyIHRvIHdhaXQgdW50aWwgdGhlIDxlbT5yZWFkeTwvZW0+IGV2ZW50IGhhc1xuICAgICAqIGJlZW4gc2VudCBmcm9tIHRoZSBEaXJzV2F0Y2hlciBpbnN0YW5jZS4gIFRoaXMgZXZlbnQgbWVhbnMgdGhlXG4gICAgICogaW5pdGlhbCBpbmRleGluZyBoYXMgaGFwcGVuZWQuXG4gICAgICovXG4gICAgYXN5bmMgaXNSZWFkeSgpIHtcbiAgICAgICAgLy8gSWYgdGhlcmUncyBubyBkaXJlY3RvcmllcywgdGhlcmUgd29uJ3QgYmUgYW55IGZpbGVzIFxuICAgICAgICAvLyB0byBsb2FkLCBhbmQgbm8gbmVlZCB0byB3YWl0XG4gICAgICAgIHdoaWxlICh0aGlzLiNkaXJzLmxlbmd0aCA+IDAgJiYgIXRoaXMuI2lzX3JlYWR5KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGRvZXMgYSAxMDBtcyBwYXVzZVxuICAgICAgICAgICAgLy8gVGhhdCBsZXRzIHVzIGNoZWNrIGlzX3JlYWR5IGV2ZXJ5IDEwMG1zXG4gICAgICAgICAgICAvLyBhdCB2ZXJ5IGxpdHRsZSBjb3N0XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgIWlzUmVhZHkgJHt0aGlzLm5hbWV9ICR7dGhpc1tfc3ltYl9kaXJzXS5sZW5ndGh9ICR7dGhpc1tfc3ltYl9pc19yZWFkeV19YCk7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgZGlyZWN0b3J5IG1vdW50IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGZpbGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGluZm9cbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGZpbGVEaXJNb3VudChpbmZvKSB7XG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiBtYXBwZWQpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkaXJNb3VudCBmb3IgJHtpbmZvLnZwYXRofSAtLSAke3V0aWwuaW5zcGVjdChpbmZvKX0gPT09ICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgICAgICBpZiAoaW5mby5tb3VudFBvaW50ID09PSBkaXIubW91bnRQb2ludCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaG91bGQgdGhpcyBmaWxlIGJlIGlnbm9yZWQsIGJhc2VkIG9uIHRoZSBgaWdub3JlYCBmaWVsZFxuICAgICAqIGluIHRoZSBtYXRjaGluZyBgZGlyYCBtb3VudCBlbnRyeS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgaWdub3JlRmlsZShpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgY29uc3QgZGlyTW91bnQgPSB0aGlzLmZpbGVEaXJNb3VudChpbmZvKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgJHtpbmZvLnZwYXRofSBkaXJNb3VudCAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIGxldCBpZ25vcmUgPSBmYWxzZTtcbiAgICAgICAgaWYgKGRpck1vdW50KSB7XG5cbiAgICAgICAgICAgIGxldCBpZ25vcmVzO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXJNb3VudC5pZ25vcmUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IFsgZGlyTW91bnQuaWdub3JlIF07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGlyTW91bnQuaWdub3JlKSkge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBkaXJNb3VudC5pZ25vcmU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpZ25vcmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1pY3JvbWF0Y2guaXNNYXRjaChpbmZvLnZwYXRoLCBpKSkgaWdub3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZGlyTW91bnQuaWdub3JlICR7ZnNwYXRofSAke2l9ID0+ICR7aWdub3JlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgKGlnbm9yZSkgY29uc29sZS5sb2coYE1VU1QgaWdub3JlIEZpbGUgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgZm9yICR7aW5mby52cGF0aH0gPT0+ICR7aWdub3JlfWApO1xuICAgICAgICAgICAgcmV0dXJuIGlnbm9yZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vIG1vdW50PyAgdGhhdCBtZWFucyBzb21ldGhpbmcgc3RyYW5nZVxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgTm8gZGlyTW91bnQgZm91bmQgZm9yICR7aW5mby52cGF0aH0gLyAke2luZm8uZGlyTW91bnRlZE9ufWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcGF0aHNDYWNoZTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBzaW1wbGUgaW5mb3JtYXRpb24gYWJvdXQgZWFjaFxuICAgICAqIHBhdGggaW4gdGhlIGNvbGxlY3Rpb24uICBUaGUgcmV0dXJuXG4gICAgICogdHlwZSBpcyBhbiBhcnJheSBvZiBQYXRoc1JldHVyblR5cGUuXG4gICAgICogXG4gICAgICogSSBmb3VuZCB0d28gdXNlcyBmb3IgdGhpcyBmdW5jdGlvbi5cbiAgICAgKiBJbiBjb3B5QXNzZXRzLCB0aGUgdnBhdGggYW5kIG90aGVyXG4gICAgICogc2ltcGxlIGRhdGEgaXMgdXNlZCBmb3IgY29weWluZyBpdGVtc1xuICAgICAqIHRvIHRoZSBvdXRwdXQgZGlyZWN0b3J5LlxuICAgICAqIEluIHJlbmRlci50cywgdGhlIHNpbXBsZSBmaWVsZHMgYXJlXG4gICAgICogdXNlZCB0byB0aGVuIGNhbGwgZmluZCB0byByZXRyaWV2ZVxuICAgICAqIHRoZSBmdWxsIGluZm9ybWF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHBhdGhzKHJvb3RQYXRoPzogc3RyaW5nKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8UGF0aHNSZXR1cm5UeXBlPj5cbiAgICB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIGNvbnN0IGRvQ2FjaGluZ1xuICAgICAgICAgICAgPSB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDA7XG4gICAgICAgIGxldCBjYWNoZUtleTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMucGF0aHNDYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGF0aHNDYWNoZVxuICAgICAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgcm9vdFAsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgY2FjaGVkXG4gICAgICAgICAgICAgICAgPSB0aGlzLnBhdGhzQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBpcyBjb3BpZWQgZnJvbSB0aGUgb2xkZXIgdmVyc2lvblxuICAgICAgICAvLyAoTG9raUpTIHZlcnNpb24pIG9mIHRoaXMgZnVuY3Rpb24uICBJdFxuICAgICAgICAvLyBzZWVtcyBtZWFudCB0byBlbGltaW5hdGUgZHVwbGljYXRlcy5cbiAgICAgICAgY29uc3QgdnBhdGhzU2VlbiA9IG5ldyBTZXQoKTtcblxuICAgICAgICAvLyBTZWxlY3QgdGhlIGZpZWxkcyBpbiBQYXRoc1JldHVyblR5cGVcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9ICh0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnKSBcbiAgICAgICAgPyA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoXG4gICAgICAgIGBcbiAgICAgICAgICAgIFNFTEVDVFxuICAgICAgICAgICAgICAgIHZwYXRoLCBtaW1lLCBtb3VudGVkLCBtb3VudFBvaW50LFxuICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQsIG10aW1lTXMsXG4gICAgICAgICAgICAgICAgaW5mbywgZnNwYXRoLCByZW5kZXJQYXRoXG4gICAgICAgICAgICBGUk9NICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICBXSEVSRVxuICAgICAgICAgICAgcmVuZGVyUGF0aCBMSUtFICRyb290UFxuICAgICAgICAgICAgT1JERVIgQlkgbXRpbWVNcyBBU0NcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJHJvb3RQOiBgJHtyb290UH0lYFxuICAgICAgICB9KVxuICAgICAgICA6IDxhbnlbXT5hd2FpdCB0aGlzLmRiLmFsbChcbiAgICAgICAgYFxuICAgICAgICAgICAgU0VMRUNUXG4gICAgICAgICAgICAgICAgdnBhdGgsIG1pbWUsIG1vdW50ZWQsIG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCwgbXRpbWVNcyxcbiAgICAgICAgICAgICAgICBpbmZvLCBmc3BhdGgsIHJlbmRlclBhdGhcbiAgICAgICAgICAgIEZST00gJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIE9SREVSIEJZIG10aW1lTXMgQVNDXG4gICAgICAgIGApO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDI6IFBhdGhzUmV0dXJuVHlwZVtdXG4gICAgICAgICAgICAgICAgPSBuZXcgQXJyYXk8UGF0aHNSZXR1cm5UeXBlPigpO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcmVzdWx0cykge1xuICAgICAgICAgICAgaWYgKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodnBhdGhzU2Vlbi5oYXMoKGl0ZW0gYXMgVCkudnBhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZwYXRoc1NlZW4uYWRkKChpdGVtIGFzIFQpLnZwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLm1pbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpdGVtLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB7IGVycm9yLCB2YWx1ZSB9ID1cbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVBhdGhzUmV0dXJuVHlwZShpdGVtKTtcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBQQVRIUyBWQUxJREFUSU9OICR7dXRpbC5pbnNwZWN0KGl0ZW0pfWAsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdDIucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9DYWNoaW5nICYmIGNhY2hlS2V5KSB7XG4gICAgICAgICAgICB0aGlzLnBhdGhzQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXN1bHQyXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgZmlsZSB3aXRoaW4gdGhlIGNhY2hlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBUaGUgdnBhdGggb3IgcmVuZGVyUGF0aCB0byBsb29rIGZvclxuICAgICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgICovXG4gICAgYXN5bmMgZmluZChfZnBhdGgpOiBQcm9taXNlPFQgfCB1bmRlZmluZWQ+IHtcblxuICAgICAgICBpZiAodHlwZW9mIF9mcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZCBwYXJhbWV0ZXIgbm90IHN0cmluZyAke3R5cGVvZiBfZnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChmcGF0aCk7XG5cbiAgICAgICAgLy8gY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgIC8vICAgICBvcjogW1xuICAgICAgICAvLyAgICAgICAgIHsgdnBhdGg6IHsgZXE6IGZwYXRoIH19LFxuICAgICAgICAvLyAgICAgICAgIHsgcmVuZGVyUGF0aDogeyBlcTogZnBhdGggfX1cbiAgICAgICAgLy8gICAgIF1cbiAgICAgICAgLy8gfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kICR7X2ZwYXRofSAke2ZwYXRofSA9PT4gcmVzdWx0MSAke3V0aWwuaW5zcGVjdChyZXN1bHQxKX0gYCk7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MiA9IHJlc3VsdDEuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuICEoZmNhY2hlLmlnbm9yZUZpbGUoaXRlbSkpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHQyKSB7XG4gICAgICAgIC8vICAgICB0aGlzLmdhdGhlckluZm9EYXRhKHJlc3VsdCk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZCAke19mcGF0aH0gJHtmcGF0aH0gPT0+IHJlc3VsdDIgJHt1dGlsLmluc3BlY3QocmVzdWx0Mil9IGApO1xuXG4gICAgICAgIGxldCByZXQ7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdDIpICYmIHJlc3VsdDIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0ID0gcmVzdWx0MlswXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdDIpICYmIHJlc3VsdDIubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHJldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IHJlc3VsdDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJldCkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWU6IFQgPSB0aGlzLmN2dFJvd1RvT2JqKFxuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdGVSb3cocmV0KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQUk9CTEVNOlxuICAgICAgICAvLyB0aGUgbWV0YWRhdGEsIGRvY01ldGFkYXRhLCBiYXNlTWV0YWRhdGEsXG4gICAgICAgIC8vIGFuZCBpbmZvIGZpZWxkcywgYXJlIHN0b3JlZCBpblxuICAgICAgICAvLyB0aGUgZGF0YWJhc2UgYXMgc3RyaW5ncywgYnV0IG5lZWRcbiAgICAgICAgLy8gdG8gYmUgdW5wYWNrZWQgaW50byBvYmplY3RzLlxuICAgICAgICAvL1xuICAgICAgICAvLyBVc2luZyB2YWxpZGF0ZVJvdyBvciB2YWxpZGF0ZVJvd3MgaXNcbiAgICAgICAgLy8gdXNlZnVsLCBidXQgZG9lcyBub3QgY29udmVydCB0aG9zZVxuICAgICAgICAvLyBmaWVsZHMuXG4gICAgfVxuXG4gICAgI2ZFeGlzdHNJbkRpcihmcGF0aCwgZGlyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGAjZkV4aXN0c0luRGlyICR7ZnBhdGh9ICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgIGlmIChkaXIubW91bnRQb2ludCA9PT0gJy8nKSB7XG4gICAgICAgICAgICBjb25zdCBmc3BhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgZGlyLm1vdW50ZWQsIGZwYXRoXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzTXRpbWU6IHN0YXRzLm10aW1lTXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1wID0gZGlyLm1vdW50UG9pbnQuc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IGRpci5tb3VudFBvaW50LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgOiBkaXIubW91bnRQb2ludDtcbiAgICAgICAgbXAgPSBtcC5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IG1wXG4gICAgICAgICAgICA6IChtcCsnLycpO1xuXG4gICAgICAgIGlmIChmcGF0aC5zdGFydHNXaXRoKG1wKSkge1xuICAgICAgICAgICAgbGV0IHBhdGhJbk1vdW50ZWRcbiAgICAgICAgICAgICAgICA9IGZwYXRoLnJlcGxhY2UoZGlyLm1vdW50UG9pbnQsICcnKTtcbiAgICAgICAgICAgIGxldCBmc3BhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgZGlyLm1vdW50ZWQsIHBhdGhJbk1vdW50ZWQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENoZWNraW5nIGV4aXN0IGZvciAke2Rpci5tb3VudFBvaW50fSAke2Rpci5tb3VudGVkfSAke3BhdGhJbk1vdW50ZWR9ICR7ZnNwYXRofWApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogc3RhdHMubXRpbWVNc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZ1bGZpbGxzIHRoZSBcImZpbmRcIiBvcGVyYXRpb24gbm90IGJ5XG4gICAgICogbG9va2luZyBpbiB0aGUgZGF0YWJhc2UsIGJ1dCBieSBzY2FubmluZ1xuICAgICAqIHRoZSBmaWxlc3lzdGVtIHVzaW5nIHN5bmNocm9ub3VzIGNhbGxzLlxuICAgICAqIFxuICAgICAqIE5PVEU6IFRoaXMgaXMgdXNlZCBpbiBwYXJ0aWFsU3luY1xuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBmaW5kU3luYyhfZnBhdGgpOiBWUGF0aERhdGEgfCB1bmRlZmluZWQge1xuXG4gICAgICAgIGlmICh0eXBlb2YgX2ZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaW5kIHBhcmFtZXRlciBub3Qgc3RyaW5nICR7dHlwZW9mIF9mcGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRTeW5jIGxvb2tpbmcgZm9yICR7ZnBhdGh9IGluICR7dXRpbC5pbnNwZWN0KG1hcHBlZCl9YCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgbWFwcGVkKSB7XG4gICAgICAgICAgICBpZiAoIShkaXI/Lm1vdW50UG9pbnQpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBmaW5kU3luYyBiYWQgZGlycyBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmRpcnMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZm91bmQgPSB0aGlzLiNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcik7XG4gICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZFN5bmMgJHtmcGF0aH0gZm91bmRgLCBmb3VuZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldHNDYWNoZVxuICAgICAgICBleHRlbmRzIEJhc2VDYWNoZTxBc3NldD4ge1xuICAgIFxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvdyhyb3c6IGFueSk6IEFzc2V0IHtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9IHZhbGlkYXRlQXNzZXQocm93KTtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmVycm9yKGBBU1NFVCBWQUxJREFUSU9OIEVSUk9SIGZvcmAsIHJvdyk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogQXNzZXRbXSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NldHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxBc3NldD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogQXNzZXQge1xuICAgICAgICBpZiAodHlwZW9mIHJvdy5pbmZvID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmluZm8gPSBKU09OLnBhcnNlKHJvdy5pbmZvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPEFzc2V0PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBBc3NldCkge1xuICAgICAgICBpZiAodHlwZW9mICg8YW55PmluZm8pLnN0YXRzTXRpbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpbmZvLm10aW1lTXMgPSAoPGFueT5pbmZvKS5zdGF0c010aW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbmZvLm1pbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGluZm8ubWltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKFxuICAgICAgICBpbmZvOiBBc3NldFxuICAgICkge1xuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bihgXG4gICAgICAgICAgICBJTlNFUlQgSU5UTyAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgIG1pbWUsXG4gICAgICAgICAgICAgICAgbW91bnRlZCxcbiAgICAgICAgICAgICAgICBtb3VudFBvaW50LFxuICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgZnNwYXRoLFxuICAgICAgICAgICAgICAgIGRpcm5hbWUsXG4gICAgICAgICAgICAgICAgbXRpbWVNcyxcbiAgICAgICAgICAgICAgICBpbmZvXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBWQUxVRVNcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAkdnBhdGgsXG4gICAgICAgICAgICAgICAgJG1pbWUsXG4gICAgICAgICAgICAgICAgJG1vdW50ZWQsXG4gICAgICAgICAgICAgICAgJG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgJGZzcGF0aCxcbiAgICAgICAgICAgICAgICAkZGlybmFtZSxcbiAgICAgICAgICAgICAgICAkbXRpbWVNcyxcbiAgICAgICAgICAgICAgICAkaW5mb1xuICAgICAgICAgICAgKVxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgJG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgICRtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAkcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgJGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgICRkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCksXG4gICAgICAgICAgICAkbXRpbWVNczogaW5mby5tdGltZU1zLFxuICAgICAgICAgICAgJGluZm86IEpTT04uc3RyaW5naWZ5KGluZm8pXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm86IEFzc2V0KSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKGBcbiAgICAgICAgICAgIFVQREFURSAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICAgICAgU0VUIFxuICAgICAgICAgICAgICAgIG1pbWUgPSAkbWltZSxcbiAgICAgICAgICAgICAgICBtb3VudGVkID0gJG1vdW50ZWQsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludCA9ICRtb3VudFBvaW50LFxuICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQgPSAkcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICBmc3BhdGggPSAkZnNwYXRoLFxuICAgICAgICAgICAgICAgIGRpcm5hbWUgPSAkZGlybmFtZSxcbiAgICAgICAgICAgICAgICBtdGltZU1zID0gJG10aW1lTXMsXG4gICAgICAgICAgICAgICAgaW5mbyA9ICRpbmZvXG4gICAgICAgICAgICBXSEVSRVxuICAgICAgICAgICAgICAgIHZwYXRoID0gJHZwYXRoXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbylcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBQYXJ0aWFsc0NhY2hlXG4gICAgICAgIGV4dGVuZHMgQmFzZUNhY2hlPFBhcnRpYWw+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBQYXJ0aWFsIHtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9IHZhbGlkYXRlUGFydGlhbChyb3cpO1xuICAgICAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xuICAgICAgICBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogUGFydGlhbFtdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhcnRpYWxzQ2FjaGUgdmFsaWRhdGVSb3dzIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXlgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXk8UGFydGlhbD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogUGFydGlhbCB7XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuaW5mbyA9IEpTT04ucGFyc2Uocm93LmluZm8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8UGFydGlhbD5yb3c7XG4gICAgfVxuXG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBQYXJ0aWFsKSB7XG5cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9IHJlbmRlcmVyLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihcbiAgICAgICAgaW5mbzogUGFydGlhbFxuICAgICkge1xuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bihgXG4gICAgICAgICAgICBJTlNFUlQgSU5UTyAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgIG1pbWUsXG4gICAgICAgICAgICAgICAgbW91bnRlZCxcbiAgICAgICAgICAgICAgICBtb3VudFBvaW50LFxuICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgZnNwYXRoLFxuICAgICAgICAgICAgICAgIGRpcm5hbWUsXG4gICAgICAgICAgICAgICAgbXRpbWVNcyxcbiAgICAgICAgICAgICAgICBpbmZvLFxuXG4gICAgICAgICAgICAgICAgZG9jQm9keSxcbiAgICAgICAgICAgICAgICByZW5kZXJlck5hbWVcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIFZBTFVFU1xuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICR2cGF0aCxcbiAgICAgICAgICAgICAgICAkbWltZSxcbiAgICAgICAgICAgICAgICAkbW91bnRlZCxcbiAgICAgICAgICAgICAgICAkbW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAkcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAkZnNwYXRoLFxuICAgICAgICAgICAgICAgICRkaXJuYW1lLFxuICAgICAgICAgICAgICAgICRtdGltZU1zLFxuICAgICAgICAgICAgICAgICRpbmZvLFxuXG4gICAgICAgICAgICAgICAgJGRvY0JvZHksXG4gICAgICAgICAgICAgICAgJHJlbmRlcmVyTmFtZVxuICAgICAgICAgICAgKVxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgJG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgICRtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAkcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgJGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgICRkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCksXG4gICAgICAgICAgICAkbXRpbWVNczogaW5mby5tdGltZU1zLFxuICAgICAgICAgICAgJGluZm86IEpTT04uc3RyaW5naWZ5KGluZm8pLFxuXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoXG4gICAgICAgIGluZm86IFBhcnRpYWxcbiAgICApIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYFxuICAgICAgICAgICAgVVBEQVRFICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICBTRVQgXG4gICAgICAgICAgICAgICAgbWltZSA9ICRtaW1lLFxuICAgICAgICAgICAgICAgIG1vdW50ZWQgPSAkbW91bnRlZCxcbiAgICAgICAgICAgICAgICBtb3VudFBvaW50ID0gJG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCA9ICRwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgIGZzcGF0aCA9ICRmc3BhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZSA9ICRkaXJuYW1lLFxuICAgICAgICAgICAgICAgIG10aW1lTXMgPSAkbXRpbWVNcyxcbiAgICAgICAgICAgICAgICBpbmZvID0gJGluZm8sXG5cbiAgICAgICAgICAgICAgICBkb2NCb2R5ID0gJGRvY0JvZHksXG4gICAgICAgICAgICAgICAgcmVuZGVyZXJOYW1lID0gJHJlbmRlcmVyTmFtZVxuICAgICAgICAgICAgV0hFUkVcbiAgICAgICAgICAgICAgICB2cGF0aCA9ICR2cGF0aFxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgJG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgICRtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAkcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgJGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgICRkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCksXG4gICAgICAgICAgICAkbXRpbWVNczogaW5mby5tdGltZU1zLFxuICAgICAgICAgICAgJGluZm86IEpTT04uc3RyaW5naWZ5KGluZm8pLFxuXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWVcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBMYXlvdXRzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8TGF5b3V0PiB7XG4gICAgXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93KHJvdzogYW55KTogTGF5b3V0IHtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9IHZhbGlkYXRlTGF5b3V0KHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XG4gICAgICAgIGVsc2UgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvd3Mocm93czogYW55W10pOiBMYXlvdXRbXSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBMYXlvdXRzQ2FjaGUgdmFsaWRhdGVSb3dzIG11c3QgYmUgZ2l2ZW4gYW4gYXJyYXlgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXk8TGF5b3V0PigpO1xuICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICByZXQucHVzaCh0aGlzLnZhbGlkYXRlUm93KHJvdykpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoocm93OiBhbnkpOiBMYXlvdXQge1xuICAgICAgICBpZiAodHlwZW9mIHJvdy5pbmZvID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmluZm8gPSBKU09OLnBhcnNlKHJvdy5pbmZvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPExheW91dD5yb3c7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbzogTGF5b3V0KSB7XG5cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9IHJlbmRlcmVyLm5hbWU7XG5cbiAgICAgICAgICAgIGNvbnN0IHJlbmRlclBhdGhcbiAgICAgICAgICAgICAgICA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8udnBhdGgpO1xuXG4gICAgICAgICAgICBpbmZvLnJlbmRlcnNUb0hUTUwgPVxuICAgICAgICAgICAgICAgIG1pY3JvbWF0Y2guaXNNYXRjaChcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgJyoqLyouaHRtbCcpXG4gICAgICAgICAgICAgfHwgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKi5odG1sJylcbiAgICAgICAgICAgID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAocmVuZGVyZXIucGFyc2VNZXRhZGF0YSkge1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKDxhbnk+e1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGluZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBGUy5yZWFkRmlsZVN5bmMoaW5mby5mc3BhdGgsICd1dGYtOCcpXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkb2NCb2R5IGlzIHRoZSBwYXJzZWQgYm9keSAtLSBlLmcuIGZvbGxvd2luZyB0aGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSByYy5ib2R5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihcbiAgICAgICAgaW5mbzogTGF5b3V0XG4gICAgKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKGBcbiAgICAgICAgICAgIElOU0VSVCBJTlRPICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgbWltZSxcbiAgICAgICAgICAgICAgICBtb3VudGVkLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICBmc3BhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZSxcbiAgICAgICAgICAgICAgICBtdGltZU1zLFxuICAgICAgICAgICAgICAgIGluZm8sXG5cbiAgICAgICAgICAgICAgICByZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgICAgIGRvY0JvZHksXG4gICAgICAgICAgICAgICAgcmVuZGVyZXJOYW1lXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBWQUxVRVNcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAkdnBhdGgsXG4gICAgICAgICAgICAgICAgJG1pbWUsXG4gICAgICAgICAgICAgICAgJG1vdW50ZWQsXG4gICAgICAgICAgICAgICAgJG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgJGZzcGF0aCxcbiAgICAgICAgICAgICAgICAkZGlybmFtZSxcbiAgICAgICAgICAgICAgICAkbXRpbWVNcyxcbiAgICAgICAgICAgICAgICAkaW5mbyxcblxuICAgICAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgICAgICRkb2NCb2R5LFxuICAgICAgICAgICAgICAgICRyZW5kZXJlck5hbWVcbiAgICAgICAgICAgIClcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcblxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihcbiAgICAgICAgaW5mbzogTGF5b3V0XG4gICAgKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKGBcbiAgICAgICAgICAgIFVQREFURSAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICAgICAgU0VUIFxuICAgICAgICAgICAgICAgIG1pbWUgPSAkbWltZSxcbiAgICAgICAgICAgICAgICBtb3VudGVkID0gJG1vdW50ZWQsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludCA9ICRtb3VudFBvaW50LFxuICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQgPSAkcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICBmc3BhdGggPSAkZnNwYXRoLFxuICAgICAgICAgICAgICAgIGRpcm5hbWUgPSAkZGlybmFtZSxcbiAgICAgICAgICAgICAgICBtdGltZU1zID0gJG10aW1lTXMsXG4gICAgICAgICAgICAgICAgaW5mbyA9ICRpbmZvLFxuXG4gICAgICAgICAgICAgICAgcmVuZGVyc1RvSFRNTCA9ICRyZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgICAgIGRvY0JvZHkgPSAkZG9jQm9keSxcbiAgICAgICAgICAgICAgICByZW5kZXJlck5hbWUgPSAkcmVuZGVyZXJOYW1lXG4gICAgICAgICAgICBXSEVSRVxuICAgICAgICAgICAgICAgIHZwYXRoID0gJHZwYXRoXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWVcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8RG9jdW1lbnQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBEb2N1bWVudCB7XG4gICAgICAgIGNvbnN0IHsgZXJyb3IsIHZhbHVlIH1cbiAgICAgICAgICAgICAgICAgICAgPSB2YWxpZGF0ZURvY3VtZW50KHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRE9DVU1FTlQgVkFMSURBVElPTiBFUlJPUiBmb3IgJHt1dGlsLmluc3BlY3Qocm93KX1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBlbHNlIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3dzKHJvd3M6IGFueVtdKTogRG9jdW1lbnRbXSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxEb2N1bWVudD4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgcmV0LnB1c2godGhpcy52YWxpZGF0ZVJvdyhyb3cpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKHJvdzogYW55KTogRG9jdW1lbnQge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgRG9jdW1lbnRzIGN2dFJvd1RvT2JqYCwgcm93KTtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cuYmFzZU1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmJhc2VNZXRhZGF0YVxuICAgICAgICAgICAgICAgID0gSlNPTi5wYXJzZShyb3cuYmFzZU1ldGFkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJvdy5kb2NNZXRhZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgID0gSlNPTi5wYXJzZShyb3cuZG9jTWV0YWRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygcm93Lm1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93Lm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy5tZXRhZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cudGFncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy50YWdzXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy50YWdzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPERvY3VtZW50PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBEb2N1bWVudCkge1xuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIGluZm8uZGlybmFtZSA9IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8uZGlybmFtZSA9PT0gJy4nKSBpbmZvLmRpcm5hbWUgPSAnLyc7XG4gICAgICAgIGluZm8ucGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGluZm8uZGlybmFtZSk7XG5cbiAgICAgICAgLy8gZmluZCB0aGUgbW91bnRlZCBkaXJlY3RvcnksXG4gICAgICAgIC8vIGdldCB0aGUgYmFzZU1ldGFkYXRhXG4gICAgICAgIGZvciAobGV0IGRpciBvZiByZW1hcGRpcnModGhpcy5kaXJzKSkge1xuICAgICAgICAgICAgaWYgKGRpci5tb3VudGVkID09PSBpbmZvLm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlyLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLmJhc2VNZXRhZGF0YSA9IGRpci5iYXNlTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiAoPGFueT5pbmZvKS5zdGF0c010aW1lID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaW5mby5tdGltZU1zID0gKDxhbnk+aW5mbykuc3RhdHNNdGltZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLm1pbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9IHJlbmRlcmVyLm5hbWU7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby52cGF0aCk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9XG4gICAgICAgICAgICAgICAgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqKi8qLmh0bWwnKVxuICAgICAgICAgICAgIHx8IG1pY3JvbWF0Y2guaXNNYXRjaChcbiAgICAgICAgICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKi5odG1sJylcbiAgICAgICAgICAgID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAocmVuZGVyZXIucGFyc2VNZXRhZGF0YSkge1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKDxhbnk+e1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGluZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBGUy5yZWFkRmlsZVN5bmMoaW5mby5mc3BhdGgsICd1dGYtOCcpXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkb2NNZXRhZGF0YSBpcyB0aGUgdW5tb2RpZmllZCBtZXRhZGF0YS9mcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBkb2N1bWVudFxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEgPSByYy5tZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvLyBkb2NDb250ZW50IGlzIHRoZSB1bnBhcnNlZCBvcmlnaW5hbCBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gaW5jbHVkaW5nIGFueSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9IHJjLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIGNvbXB1dGVkIG1ldGFkYXRhIHRoYXQgaW5jbHVkZXMgZGF0YSBmcm9tIFxuICAgICAgICAgICAgICAgIC8vIHNldmVyYWwgc291cmNlc1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEgPSB7IH07XG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLmRvY01ldGFkYXRhKSBpbmZvLmRvY01ldGFkYXRhID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcmVzdCBvZiB0aGlzIGlzIGFkYXB0ZWQgZnJvbSB0aGUgb2xkIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgLy8gSFRNTFJlbmRlcmVyLm5ld0luaXRNZXRhZGF0YVxuXG4gICAgICAgICAgICAgICAgLy8gRm9yIHN0YXJ0ZXJzIHRoZSBtZXRhZGF0YSBpcyBjb2xsZWN0ZWQgZnJvbSBzZXZlcmFsIHNvdXJjZXMuXG4gICAgICAgICAgICAgICAgLy8gMSkgdGhlIG1ldGFkYXRhIHNwZWNpZmllZCBpbiB0aGUgZGlyZWN0b3J5IG1vdW50IHdoZXJlXG4gICAgICAgICAgICAgICAgLy8gICAgdGhpcyBkb2N1bWVudCB3YXMgZm91bmRcbiAgICAgICAgICAgICAgICAvLyAyKSBtZXRhZGF0YSBpbiB0aGUgcHJvamVjdCBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgLy8gMykgdGhlIG1ldGFkYXRhIGluIHRoZSBkb2N1bWVudCwgYXMgY2FwdHVyZWQgaW4gZG9jTWV0YWRhdGFcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbml0TWV0YWRhdGEgJHtiYXNlZGlyfSAke2ZwYXRofSBiYXNlTWV0YWRhdGEgJHtiYXNlTWV0YWRhdGFbeXByb3BdfWApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uYmFzZU1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gdGhpcy5jb25maWcubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSB0aGlzLmNvbmZpZy5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGZtbWNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmRvY01ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5kb2NNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgICAgIGZtbWNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhlIGNvbnRlbnQgbGFuZHMgaGVyZVxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGRvY3VtZW50IG9iamVjdCBoYXMgYmVlbiB1c2VmdWwgZm9yIFxuICAgICAgICAgICAgICAgIC8vIGNvbW11bmljYXRpbmcgdGhlIGZpbGUgcGF0aCBhbmQgb3RoZXIgZGF0YS5cbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50ID0ge307XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5iYXNlZGlyID0gaW5mby5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscGF0aCA9IGluZm8ucGF0aEluTW91bnRlZDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHJlbmRlciA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8ucGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5wYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvID0gaW5mby5yZW5kZXJQYXRoO1xuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIHRoZSA8ZW0+dGFnczwvZW0+IGZpZWxkIGlzIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgaWYgKCEoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoaW5mby5tZXRhZGF0YS50YWdzKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhZ2xpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmUgPSAvXFxzKixcXHMqLztcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzLnNwbGl0KHJlKS5mb3JFYWNoKHRhZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdsaXN0LnB1c2godGFnLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSB0YWdsaXN0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBgRk9STUFUIEVSUk9SIC0gJHtpbmZvLnZwYXRofSBoYXMgYmFkbHkgZm9ybWF0dGVkIHRhZ3MgYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEudGFncyA9IGluZm8ubWV0YWRhdGEudGFncztcblxuICAgICAgICAgICAgICAgIC8vIFRoZSByb290IFVSTCBmb3IgdGhlIHByb2plY3RcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJvb3RfdXJsID0gdGhpcy5jb25maWcucm9vdF91cmw7XG5cbiAgICAgICAgICAgICAgICAvLyBDb21wdXRlIHRoZSBVUkwgdGhpcyBkb2N1bWVudCB3aWxsIHJlbmRlciB0b1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdVJvb3RVcmwgPSBuZXcgVVJMKHRoaXMuY29uZmlnLnJvb3RfdXJsLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICAgICAgICAgIHVSb290VXJsLnBhdGhuYW1lID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKHVSb290VXJsLnBhdGhuYW1lLCBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX3VybCA9IHVSb290VXJsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfZGF0ZSA9IGluZm8uc3RhdHMubXRpbWU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZVB1YmxEYXRlID0gKGRhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gRGF0ZS5wYXJzZShkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRlU2V0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAmJiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgZGF0ZVNldCAmJiBpbmZvLm10aW1lTXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBuZXcgRGF0ZShpbmZvLm10aW1lTXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBpbmZvLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gc3RhdHMubXRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7aW5mby52cGF0aH0gbWV0YWRhdGEucHVibGljYXRpb25EYXRlICR7aW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGV9IHNldCBmcm9tIGN1cnJlbnQgdGltZWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID0gZmFsc2U7XG4gICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhID0ge307XG4gICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSAnJztcbiAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9ICcnO1xuICAgICAgICAgICAgaW5mby5yZW5kZXJlck5hbWUgPSAnJztcbiAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lID0gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5PVEU6IENlcnRhaW4gZmllbGRzIGFyZSBub3QgaGFuZGxlZFxuICAgIC8vIGhlcmUgYmVjYXVzZSB0aGV5J3JlIEdFTkVSQVRFRCBmcm9tXG4gICAgLy8gSlNPTiBkYXRhLlxuICAgIC8vXG4gICAgLy8gICAgICBwdWJsaWNhdGlvblRpbWVcbiAgICAvLyAgICAgIGJhc2VNZXRhZGF0YVxuICAgIC8vICAgICAgbWV0YWRhdGFcbiAgICAvLyAgICAgIHRhZ3NcbiAgICAvLyAgICAgIGxheW91dFxuICAgIC8vICAgICAgYmxvZ3RhZ1xuICAgIC8vXG4gICAgLy8gVGhvc2UgZmllbGRzIGFyZSBub3QgdG91Y2hlZCBieVxuICAgIC8vIHRoZSBpbnNlcnQvdXBkYXRlIGZ1bmN0aW9ucyBiZWNhdXNlXG4gICAgLy8gU1FMSVRFMyB0YWtlcyBjYXJlIG9mIGl0LlxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgKSB7XG4gICAgICAgIC8vIGxldCBtdGltZTtcbiAgICAgICAgLy8gaWYgKHR5cGVvZiBpbmZvLm10aW1lTXMgPT09ICdudW1iZXInXG4gICAgICAgIC8vICB8fCB0eXBlb2YgaW5mby5tdGltZU1zID09PSAnc3RyaW5nJ1xuICAgICAgICAvLyApIHtcbiAgICAgICAgLy8gICAgIG10aW1lID0gbmV3IERhdGUoaW5mby5tdGltZU1zKS50b0lTT1N0cmluZygpO1xuICAgICAgICAvLyB9XG4gICAgICAgIGNvbnN0IHRvSW5zZXJ0ID0ge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcbiAgICAgICAgICAgICRyZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAkcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgJHBhcmVudERpcjogaW5mby5wYXJlbnREaXIsXG4gICAgICAgICAgICAkZG9jTWV0YWRhdGE6IEpTT04uc3RyaW5naWZ5KGluZm8uZG9jTWV0YWRhdGEpLFxuICAgICAgICAgICAgJGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9O1xuICAgICAgICAvLyBjb25zb2xlLmxvZyh0b0luc2VydCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKGBcbiAgICAgICAgICAgIElOU0VSVCBJTlRPICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgbWltZSxcbiAgICAgICAgICAgICAgICBtb3VudGVkLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICBmc3BhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZSxcbiAgICAgICAgICAgICAgICBtdGltZU1zLFxuICAgICAgICAgICAgICAgIGluZm8sXG5cblxuICAgICAgICAgICAgICAgIHJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgcmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIsXG4gICAgICAgICAgICAgICAgZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgZG9jQ29udGVudCxcbiAgICAgICAgICAgICAgICBkb2NCb2R5LFxuICAgICAgICAgICAgICAgIHJlbmRlcmVyTmFtZVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgVkFMVUVTXG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgJHZwYXRoLFxuICAgICAgICAgICAgICAgICRtaW1lLFxuICAgICAgICAgICAgICAgICRtb3VudGVkLFxuICAgICAgICAgICAgICAgICRtb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICRmc3BhdGgsXG4gICAgICAgICAgICAgICAgJGRpcm5hbWUsXG4gICAgICAgICAgICAgICAgJG10aW1lTXMsXG4gICAgICAgICAgICAgICAgJGluZm8sXG5cblxuICAgICAgICAgICAgICAgICRyZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgICAgICRwYXJlbnREaXIsXG4gICAgICAgICAgICAgICAgJGRvY01ldGFkYXRhLFxuICAgICAgICAgICAgICAgICRkb2NDb250ZW50LFxuICAgICAgICAgICAgICAgICRkb2NCb2R5LFxuICAgICAgICAgICAgICAgICRyZW5kZXJlck5hbWVcbiAgICAgICAgICAgIClcbiAgICAgICAgYCwgdG9JbnNlcnQpO1xuICAgICAgICAvLyBhd2FpdCB0aGlzLmRhby5pbnNlcnQoZG9jSW5mbyk7XG4gICAgICAgIGlmIChpbmZvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFkZERvY1RhZ0dsdWUoXG4gICAgICAgICAgICAgICAgaW5mby52cGF0aCwgaW5mby5tZXRhZGF0YS50YWdzXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoXG4gICAgICAgIGluZm86IERvY3VtZW50XG4gICAgKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKGBcbiAgICAgICAgICAgIFVQREFURSAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICAgICAgU0VUIFxuICAgICAgICAgICAgICAgIG1pbWUgPSAkbWltZSxcbiAgICAgICAgICAgICAgICBtb3VudGVkID0gJG1vdW50ZWQsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludCA9ICRtb3VudFBvaW50LFxuICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQgPSAkcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICBmc3BhdGggPSAkZnNwYXRoLFxuICAgICAgICAgICAgICAgIGRpcm5hbWUgPSAkZGlybmFtZSxcbiAgICAgICAgICAgICAgICBtdGltZU1zID0gJG10aW1lTXMsXG4gICAgICAgICAgICAgICAgaW5mbyA9ICRpbmZvLFxuXG4gICAgICAgICAgICAgICAgcmVuZGVyUGF0aCA9ICRyZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgIHJlbmRlcnNUb0hUTUwgPSAkcmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSAkcGFyZW50RGlyLFxuICAgICAgICAgICAgICAgIGRvY01ldGFkYXRhID0gJGRvY01ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGRvY0NvbnRlbnQgPSAkZG9jQ29udGVudCxcbiAgICAgICAgICAgICAgICBkb2NCb2R5ID0gJGRvY0JvZHksXG4gICAgICAgICAgICAgICAgcmVuZGVyZXJOYW1lID0gJHJlbmRlcmVyTmFtZVxuICAgICAgICAgICAgV0hFUkVcbiAgICAgICAgICAgICAgICB2cGF0aCA9ICR2cGF0aFxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgJG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgICRtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAkcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgJGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgICRkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCksXG4gICAgICAgICAgICAkbXRpbWVNczogaW5mby5tdGltZU1zLFxuICAgICAgICAgICAgJGluZm86IEpTT04uc3RyaW5naWZ5KGluZm8pLFxuXG4gICAgICAgICAgICAkcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICRwYXJlbnREaXI6IGluZm8ucGFyZW50RGlyLFxuICAgICAgICAgICAgJGRvY01ldGFkYXRhOiBKU09OLnN0cmluZ2lmeShpbmZvLmRvY01ldGFkYXRhKSxcbiAgICAgICAgICAgICRkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgJHJlbmRlcmVyTmFtZTogaW5mby5yZW5kZXJlck5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICBhd2FpdCB0Z2x1ZS5hZGRUYWdHbHVlKGluZm8udnBhdGgsIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZGVsZXRlRG9jVGFnR2x1ZSh2cGF0aCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGdsdWUuZGVsZXRlVGFnR2x1ZSh2cGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gaWdub3JlXG4gICAgICAgICAgICAvLyBUaGlzIGNhbiB0aHJvdyBhbiBlcnJvciBsaWtlOlxuICAgICAgICAgICAgLy8gZG9jdW1lbnRzQ2FjaGUgRVJST1Ige1xuICAgICAgICAgICAgLy8gICAgIGNvZGU6ICdjaGFuZ2VkJyxcbiAgICAgICAgICAgIC8vICAgICBuYW1lOiAnZG9jdW1lbnRzJyxcbiAgICAgICAgICAgIC8vICAgICB2cGF0aDogJ19tZXJtYWlkL3JlbmRlcjMzNTY3MzkzODIubWVybWFpZCcsXG4gICAgICAgICAgICAvLyAgICAgZXJyb3I6IEVycm9yOiBkZWxldGUgZnJvbSAnVEFHR0xVRScgZmFpbGVkOiBub3RoaW5nIGNoYW5nZWRcbiAgICAgICAgICAgIC8vICAgICAgLi4uIHN0YWNrIHRyYWNlXG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBJbiBzdWNoIGEgY2FzZSB0aGVyZSBpcyBubyB0YWdHbHVlIGZvciB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAgICAvLyBUaGlzIFwiZXJyb3JcIiBpcyBzcHVyaW91cy5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUT0RPIElzIHRoZXJlIGFub3RoZXIgcXVlcnkgdG8gcnVuIHRoYXQgd2lsbFxuICAgICAgICAgICAgLy8gbm90IHRocm93IGFuIGVycm9yIGlmIG5vdGhpbmcgd2FzIGNoYW5nZWQ/XG4gICAgICAgICAgICAvLyBJbiBvdGhlciB3b3JkcywgdGhpcyBjb3VsZCBoaWRlIGEgbGVnaXRpbWF0ZVxuICAgICAgICAgICAgLy8gZXJyb3IuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgYWRkRG9jVGFnR2x1ZSh2cGF0aDogc3RyaW5nLCB0YWdzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAodHlwZW9mIHRhZ3MgIT09ICdzdHJpbmcnXG4gICAgICAgICAmJiAhQXJyYXkuaXNBcnJheSh0YWdzKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYWRkRG9jVGFnR2x1ZSBtdXN0IGJlIGdpdmVuIGEgdGFncyBhcnJheSwgd2FzIGdpdmVuOiAke3V0aWwuaW5zcGVjdCh0YWdzKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0Z2x1ZS5hZGRUYWdHbHVlKHZwYXRoLCBcbiAgICAgICAgICAgIEFycmF5LmlzQXJyYXkodGFncylcbiAgICAgICAgICAgID8gdGFnc1xuICAgICAgICAgICAgOiBbIHRhZ3MgXSk7XG4gICAgfVxuXG4gICAgYXN5bmMgYWRkVGFnRGVzY3JpcHRpb24odGFnOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRkZXNjLmFkZERlc2ModGFnLCBkZXNjcmlwdGlvbik7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0VGFnRGVzY3JpcHRpb24odGFnOiBzdHJpbmcpXG4gICAgICAgIDogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+XG4gICAge1xuICAgICAgICByZXR1cm4gdGRlc2MuZ2V0RGVzYyh0YWcpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBoYW5kbGVVbmxpbmtlZChuYW1lOiBhbnksIGluZm86IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBzdXBlci5oYW5kbGVVbmxpbmtlZChuYW1lLCBpbmZvKTtcbiAgICAgICAgdGdsdWUuZGVsZXRlVGFnR2x1ZShpbmZvLnZwYXRoKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgaW5kZXhDaGFpbkNhY2hlO1xuXG4gICAgYXN5bmMgaW5kZXhDaGFpbihfZnBhdGgpXG4gICAgICAgIDogUHJvbWlzZTxpbmRleENoYWluSXRlbVtdPlxuICAgIHtcblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpIFxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcbiAgICAgICAgY29uc3QgcGFyc2VkID0gcGF0aC5wYXJzZShmcGF0aCk7XG5cbiAgICAgICAgY29uc3QgZG9DYWNoaW5nXG4gICAgICAgICAgICA9IHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0ID4gMDtcbiAgICAgICAgbGV0IGNhY2hlS2V5O1xuXG4gICAgICAgIGlmIChkb0NhY2hpbmcpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pbmRleENoYWluQ2FjaGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4Q2hhaW5DYWNoZVxuICAgICAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgZnBhdGgsXG4gICAgICAgICAgICAgICAgcGFyc2VkXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgY2FjaGVkXG4gICAgICAgICAgICAgICAgPSB0aGlzLmluZGV4Q2hhaW5DYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgICAgICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW5kZXhDaGFpbiAke19mcGF0aH0gJHtmcGF0aH1gLCBwYXJzZWQpO1xuXG4gICAgICAgIGNvbnN0IGZpbGV6OiBEb2N1bWVudFtdID0gW107XG4gICAgICAgIGNvbnN0IHNlbGYgPSBhd2FpdCB0aGlzLmZpbmRCeVBhdGgoZnBhdGgpO1xuICAgICAgICBsZXQgZmlsZU5hbWUgPSBmcGF0aDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZikgJiYgc2VsZi5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgZmlsZXoucHVzaChzZWxmWzBdKTtcbiAgICAgICAgICAgIGZpbGVOYW1lID0gc2VsZlswXS5yZW5kZXJQYXRoO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHBhcmVudERpcjtcbiAgICAgICAgbGV0IGRpck5hbWUgPSBwYXRoLmRpcm5hbWUoZnBhdGgpO1xuICAgICAgICBsZXQgZG9uZSA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAoIShkaXJOYW1lID09PSAnLicgfHwgZGlyTmFtZSA9PT0gcGFyc2VkLnJvb3QpKSB7XG4gICAgICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShmaWxlTmFtZSkgPT09ICdpbmRleC5odG1sJykge1xuICAgICAgICAgICAgICAgIHBhcmVudERpciA9IHBhdGguZGlybmFtZShwYXRoLmRpcm5hbWUoZmlsZU5hbWUpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGZpbGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBsb29rRm9yID0gcGF0aC5qb2luKHBhcmVudERpciwgXCJpbmRleC5odG1sXCIpO1xuXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChsb29rRm9yKTtcblxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW5kZXgpICYmIGluZGV4Lmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICAgICAgZmlsZXoucHVzaChpbmRleFswXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbGVOYW1lID0gbG9va0ZvcjtcbiAgICAgICAgICAgIGRpck5hbWUgPSBwYXRoLmRpcm5hbWUobG9va0Zvcik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXQgPSBmaWxlelxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24ob2JqOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxpbmRleENoYWluSXRlbT57XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogb2JqLmRvY01ldGFkYXRhLnRpdGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IG9iai52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kRGlyOiBvYmoubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kUGF0aDogb2JqLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogJy8nICsgb2JqLnJlbmRlclBhdGhcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gb2JqLmZvdW5kRGlyID0gb2JqLm1vdW50UG9pbnQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIG9iai5mb3VuZFBhdGggPSBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgLy8gb2JqLmZpbGVuYW1lID0gJy8nICsgb2JqLnJlbmRlclBhdGg7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiBvYmo7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAucmV2ZXJzZSgpO1xuXG4gICAgICAgIGlmIChkb0NhY2hpbmcgJiYgY2FjaGVLZXkpIHtcbiAgICAgICAgICAgIHRoaXMuaW5kZXhDaGFpbkNhY2hlLnB1dChcbiAgICAgICAgICAgICAgICBjYWNoZUtleSwgcmV0XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2libGluZ3NDYWNoZTtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIGFsbCB0aGUgZG9jdW1lbnRzIGluIHRoZSBzYW1lIGRpcmVjdG9yeVxuICAgICAqIGFzIHRoZSBuYW1lZCBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBkb2Vzbid0IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBzaWJsaW5ncyhfZnBhdGgpIHtcbiAgICAgICAgbGV0IHZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUodnBhdGgpO1xuXG4gICAgICAgIGNvbnN0IGRvQ2FjaGluZ1xuICAgICAgICAgICAgPSB0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCA+IDA7XG4gICAgICAgIGxldCBjYWNoZUtleTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc2libGluZ3NDYWNoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2libGluZ3NDYWNoZVxuICAgICAgICAgICAgICAgICAgICA9IG5ldyBDYWNoZSh0aGlzLmNvbmZpZy5jYWNoaW5nVGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGRibmFtZTogdGhpcy5xdW90ZWREQk5hbWUsXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZFxuICAgICAgICAgICAgICAgID0gdGhpcy5zaWJsaW5nc0NhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNpYmxpbmdzID0gYXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUICogRlJPTSAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICAgICAgV0hFUkVcbiAgICAgICAgICAgIGRpcm5hbWUgPSAkZGlybmFtZSBBTkRcbiAgICAgICAgICAgIHZwYXRoIDw+ICR2cGF0aCBBTkRcbiAgICAgICAgICAgIHJlbmRlclBhdGggPD4gJHZwYXRoIEFORFxuICAgICAgICAgICAgcmVuZGVyc1RvSHRtbCA9IHRydWVcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWUsXG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGlnbm9yZWQgPSBzaWJsaW5ncy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuaWdub3JlRmlsZShpdGVtKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gdGhpcy52YWxpZGF0ZVJvd3MoaWdub3JlZCk7XG4gICAgICAgIGNvbnN0IHJldCA9IG1hcHBlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZG9DYWNoaW5nICYmIGNhY2hlS2V5KSB7XG4gICAgICAgICAgICB0aGlzLnNpYmxpbmdzQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgIGNhY2hlS2V5LCByZXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB0cmVlIG9mIGl0ZW1zIHN0YXJ0aW5nIGZyb20gdGhlIGRvY3VtZW50XG4gICAgICogbmFtZWQgaW4gX3Jvb3RJdGVtLiAgVGhlIHBhcmFtZXRlciBzaG91bGQgYmUgYW5cbiAgICAgKiBhY3R1YWwgZG9jdW1lbnQgaW4gdGhlIHRyZWUsIHN1Y2ggYXMgYHBhdGgvdG8vaW5kZXguaHRtbGAuXG4gICAgICogVGhlIHJldHVybiBpcyBhIHRyZWUtc2hhcGVkIHNldCBvZiBvYmplY3RzIGxpa2UgdGhlIGZvbGxvd2luZztcbiAgICAgKiBcbiAgdHJlZTpcbiAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlclxuICAgIGl0ZW1zOlxuICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBjaGlsZEZvbGRlcnM6XG4gICAgICAgIC0gZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICAgICAgaXRlbXM6XG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sXG4gICAgICAgICAgICAgIGNoaWxkRm9sZGVyczogW11cbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sXG4gICAgICAgICAgICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAqXG4gICAgICogVGhlIG9iamVjdHMgdW5kZXIgYGl0ZW1zYCBhcmUgYWN0dWxseSB0aGUgZnVsbCBEb2N1bWVudCBvYmplY3RcbiAgICAgKiBmcm9tIHRoZSBjYWNoZSwgYnV0IGZvciB0aGUgaW50ZXJlc3Qgb2YgY29tcGFjdG5lc3MgbW9zdCBvZlxuICAgICAqIHRoZSBmaWVsZHMgaGF2ZSBiZWVuIGRlbGV0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX3Jvb3RJdGVtIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGNoaWxkSXRlbVRyZWUoX3Jvb3RJdGVtOiBzdHJpbmcpIHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hpbGRJdGVtVHJlZSAke19yb290SXRlbX1gKTtcblxuICAgICAgICBsZXQgcm9vdEl0ZW0gPSBhd2FpdCB0aGlzLmZpbmQoXG4gICAgICAgICAgICAgICAgX3Jvb3RJdGVtLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9yb290SXRlbS5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfcm9vdEl0ZW0pO1xuICAgICAgICBpZiAoIXJvb3RJdGVtKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYGNoaWxkSXRlbVRyZWUgbm8gcm9vdEl0ZW0gZm91bmQgZm9yIHBhdGggJHtfcm9vdEl0ZW19YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKHR5cGVvZiByb290SXRlbSA9PT0gJ29iamVjdCcpXG4gICAgICAgICB8fCAhKCd2cGF0aCcgaW4gcm9vdEl0ZW0pXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGBjaGlsZEl0ZW1UcmVlIGZvdW5kIGludmFsaWQgb2JqZWN0IGZvciAke19yb290SXRlbX0gLSAke3V0aWwuaW5zcGVjdChyb290SXRlbSl9YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKHJvb3RJdGVtLnZwYXRoKTtcbiAgICAgICAgLy8gUGlja3MgdXAgZXZlcnl0aGluZyBmcm9tIHRoZSBjdXJyZW50IGxldmVsLlxuICAgICAgICAvLyBEaWZmZXJzIGZyb20gc2libGluZ3MgYnkgZ2V0dGluZyBldmVyeXRoaW5nLlxuICAgICAgICBjb25zdCBfaXRlbXMgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUICpcbiAgICAgICAgICAgIEZST00gJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIFdIRVJFIGRpcm5hbWUgPSAkZGlybmFtZSBBTkQgcmVuZGVyc1RvSFRNTCA9IHRydWVcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGl0ZW1zOiBEb2N1bWVudFtdXG4gICAgICAgICAgICA9IHRoaXMudmFsaWRhdGVSb3dzKF9pdGVtcylcbiAgICAgICAgICAgIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IF9jaGlsZEZvbGRlcnMgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUIGRpc3RpbmN0IGRpcm5hbWUgRlJPTSBET0NVTUVOVFNcbiAgICAgICAgICAgIFdIRVJFIHBhcmVudERpciA9ICRkaXJuYW1lXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICRkaXJuYW1lOiBkaXJuYW1lXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjaGlsZEZvbGRlcnMgPSBuZXcgQXJyYXk8eyBkaXJuYW1lOiBzdHJpbmcgfT4oKTtcbiAgICAgICAgZm9yIChjb25zdCBjZiBvZiBfY2hpbGRGb2xkZXJzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNmLmRpcm5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBkaXJuYW1lOiBjZi5kaXJuYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY2hpbGRJdGVtVHJlZSgke19yb290SXRlbX0pIG5vIGRpcm5hbWUgZmllbGRzIGluIGNoaWxkRm9sZGVyc2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNmcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGNmIG9mIGNoaWxkRm9sZGVycykge1xuICAgICAgICAgICAgY2ZzLnB1c2goYXdhaXQgdGhpcy5jaGlsZEl0ZW1UcmVlKFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihjZi5kaXJuYW1lLCAnaW5kZXguaHRtbCcpXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByb290SXRlbSxcbiAgICAgICAgICAgIGRpcm5hbWUsXG4gICAgICAgICAgICBpdGVtczogaXRlbXMsXG4gICAgICAgICAgICAvLyBVbmNvbW1lbnQgdGhpcyB0byBnZW5lcmF0ZSBzaW1wbGlmaWVkIG91dHB1dFxuICAgICAgICAgICAgLy8gZm9yIGRlYnVnZ2luZy5cbiAgICAgICAgICAgIC8vIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0pLFxuICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBjZnNcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGluZGV4IGZpbGVzIChyZW5kZXJzIHRvIGluZGV4Lmh0bWwpXG4gICAgICogd2l0aGluIHRoZSBuYW1lZCBzdWJ0cmVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGluZGV4RmlsZXMocm9vdFBhdGg/OiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsbHkgYXBwZW5kYWJsZSBzdWItcXVlcnlcbiAgICAgICAgLy8gdG8gaGFuZGxlIHdoZW4gcm9vdFBhdGggaXMgc3BlY2lmaWVkXG4gICAgICAgIGxldCByb290USA9IChcbiAgICAgICAgICAgICAgICB0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgJiYgcm9vdFAubGVuZ3RoID49IDFcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgID8gYEFORCAoIHJlbmRlclBhdGggTElLRSAnJHtyb290UH0lJyApYFxuICAgICAgICAgICAgOiAnJztcblxuICAgICAgICBjb25zdCBpbmRleGVzID0gPGFueVtdPiBhd2FpdCB0aGlzLmRiLmFsbChgXG4gICAgICAgIFNFTEVDVCAqXG4gICAgICAgIEZST00gRE9DVU1FTlRTXG4gICAgICAgIFdIRVJFXG4gICAgICAgICAgICAoIHJlbmRlcnNUb0hUTUwgPSB0cnVlIClcbiAgICAgICAgQU5EIChcbiAgICAgICAgICAgICggcmVuZGVyUGF0aCBMSUtFICclL2luZGV4Lmh0bWwnIClcbiAgICAgICAgIE9SICggcmVuZGVyUGF0aCA9ICdpbmRleC5odG1sJyApXG4gICAgICAgIClcbiAgICAgICAgJHtyb290UX1cbiAgICAgICAgYCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBtYXBwZWQgPSB0aGlzLnZhbGlkYXRlUm93cyhpbmRleGVzKTtcbiAgICAgICAgcmV0dXJuIG1hcHBlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJdCdzIHByb3ZlZCBkaWZmaWN1bHQgdG8gZ2V0IHRoZSByZWdleHBcbiAgICAgICAgLy8gdG8gd29yayBpbiB0aGlzIG1vZGU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHJldHVybiBhd2FpdCB0aGlzLnNlYXJjaCh7XG4gICAgICAgIC8vICAgICByZW5kZXJzVG9IVE1MOiB0cnVlLFxuICAgICAgICAvLyAgICAgcmVuZGVycGF0aG1hdGNoOiAvXFwvaW5kZXguaHRtbCQvLFxuICAgICAgICAvLyAgICAgcm9vdFBhdGg6IHJvb3RQYXRoXG4gICAgICAgIC8vIH0pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBGb3IgZXZlcnkgZmlsZSBpbiB0aGUgZG9jdW1lbnRzIGNhY2hlLFxuICAgICAqIHNldCB0aGUgYWNjZXNzIGFuZCBtb2RpZmljYXRpb25zLlxuICAgICAqIFxuICAgICAqIFRoaXMgaXMgdXNlZCBmcm9tIGNsaS50cyBkb2NzLXNldC1kYXRlc1xuICAgICAqXG4gICAgICogPz8/Pz8gV2h5IHdvdWxkIHRoaXMgYmUgdXNlZnVsP1xuICAgICAqIEkgY2FuIHNlZSBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWRcbiAgICAgKiBmaWxlcyBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeS4gIEJ1dCB0aGlzIGlzXG4gICAgICogZm9yIHRoZSBmaWxlcyBpbiB0aGUgZG9jdW1lbnRzIGRpcmVjdG9yaWVzLiA/Pz8/XG4gICAgICovXG4gICAgYXN5bmMgc2V0VGltZXMoKSB7XG5cbiAgICAgICAgLy8gVGhlIFNFTEVDVCBiZWxvdyBwcm9kdWNlcyByb3cgb2JqZWN0cyBwZXJcbiAgICAgICAgLy8gdGhpcyBpbnRlcmZhY2UgZGVmaW5pdGlvbi4gIFRoaXMgZnVuY3Rpb24gbG9va3NcbiAgICAgICAgLy8gZm9yIGEgdmFsaWQgZGF0ZSBmcm9tIHRoZSBkb2N1bWVudCBtZXRhZGF0YSxcbiAgICAgICAgLy8gYW5kIGVuc3VyZXMgdGhlIGZzcGF0aCBmaWxlIGlzIHNldCB0byB0aGF0IGRhdGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHNhaWQgaW4gdGhlIGNvbW1lbnQgYWJvdmUuLi4uIFdIWT9cbiAgICAgICAgLy8gSSBjYW4gdW5kZXJzdGFuZCBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWQgb3V0cHV0LlxuICAgICAgICAvLyBGb3Igd2hhdCBwdXJwb3NlIGRpZCBJIGNyZWF0ZSB0aGlzIGZ1bmN0aW9uP1xuICAgICAgICBjb25zdCBzZXR0ZXIgPSAocm93OiB7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgZnNwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBtdGltZU1zOiBudW1iZXIsXG4gICAgICAgICAgICBwdWJsaWNhdGlvblRpbWU6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxEYXRlOiBzdHJpbmcsXG4gICAgICAgICAgICBwdWJsaWNhdGlvbkRhdGU6IHN0cmluZ1xuICAgICAgICB9KSA9PiB7XG4gICAgICAgICAgICBsZXQgcGFyc2VkID0gTmFOO1xuICAgICAgICAgICAgaWYgKHJvdy5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxEYXRlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93LnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5wdWJsaWNhdGlvblRpbWUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZWQgPSByb3cucHVibGljYXRpb25UaW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRwID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICBGUy51dGltZXNTeW5jKFxuICAgICAgICAgICAgICAgICAgICByb3cuZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBkcCxcbiAgICAgICAgICAgICAgICAgICAgZHBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuZGIuZWFjaChgXG4gICAgICAgICAgICBTRUxFQ1RcbiAgICAgICAgICAgICAgICB2cGF0aCwgZnNwYXRoLFxuICAgICAgICAgICAgICAgIG10aW1lTXMsIHB1YmxpY2F0aW9uVGltZSxcbiAgICAgICAgICAgICAgICBqc29uX2V4dHJhY3QoaW5mbywgJyQuZG9jTWV0YWRhdGEucHVibERhdGUnKSBhcyBwdWJsRGF0ZSxcbiAgICAgICAgICAgICAgICBqc29uX2V4dHJhY3QoaW5mbywgJyQuZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlJykgYXMgcHVibGljYXRpb25EYXRlLFxuICAgICAgICAgICAgRlJPTSAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICBgLCB7IH0sXG4gICAgICAgIChyb3c6IHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBmc3BhdGg6IHN0cmluZyxcbiAgICAgICAgICAgIG10aW1lTXM6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uVGltZTogbnVtYmVyLFxuICAgICAgICAgICAgcHVibERhdGU6IHN0cmluZyxcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uRGF0ZTogc3RyaW5nXG4gICAgICAgIH0pID0+IHtcbiAgICAgICAgICAgIGlmIChyb3cucHVibERhdGVcbiAgICAgICAgICAgICB8fCByb3cucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgfHwgcm93LnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc2V0dGVyKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGRvY3VtZW50c1dpdGhUYWcodGFnbm06IHN0cmluZyB8IHN0cmluZ1tdKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8c3RyaW5nPj5cbiAgICB7XG4gICAgICAgIGxldCB0YWdzOiBzdHJpbmdbXTtcbiAgICAgICAgaWYgKHR5cGVvZiB0YWdubSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRhZ3MgPSBbIHRhZ25tIF07XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0YWdubSkpIHtcbiAgICAgICAgICAgIHRhZ3MgPSB0YWdubTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnRzV2l0aFRhZyBnaXZlbiBiYWQgdGFncyBhcnJheSAke3V0aWwuaW5zcGVjdCh0YWdubSl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb3JyZWN0bHkgaGFuZGxlIHRhZyBzdHJpbmdzIHdpdGhcbiAgICAgICAgLy8gdmFyeWluZyBxdW90ZXMuICBBIGRvY3VtZW50IG1pZ2h0IGhhdmUgdGhlc2UgdGFnczpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgdGFnczpcbiAgICAgICAgLy8gICAgLSBUZWFzZXInc1xuICAgICAgICAvLyAgICAtIFRlYXNlcnNcbiAgICAgICAgLy8gICAgLSBTb21ldGhpbmcgXCJxdW90ZWRcIlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGVzZSBTUUwgcXVlcmllcyB3b3JrOlxuICAgICAgICAvL1xuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lIElOICggJ1NvbWV0aGluZyBcInF1b3RlZFwiJywgXCJUZWFzZXInc1wiICk7XG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8VGVhc2VyJ3NcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxTb21ldGhpbmcgXCJxdW90ZWRcIlxuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lIElOICggJ1NvbWV0aGluZyBcInF1b3RlZFwiJywgJ1RlYXNlcicncycgKTtcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxUZWFzZXInc1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEJ1dCwgdGhpcyBkb2VzIG5vdDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gc3FsaXRlPiBzZWxlY3QgKiBmcm9tIFRBR0dMVUUgd2hlcmUgdGFnTmFtZSA9ICdUZWFzZXIncyc7XG4gICAgICAgIC8vICcgIC4uLj4gXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBvcmlnaW5hbCBjb2RlIGJlaGF2aW9yIHdhcyB0aGlzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEIEVycm9yOiBTUUxJVEVfRVJST1I6IG5lYXIgXCJzXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBBbiBhdHRlbXB0ZWQgZml4OlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiBdICAoICdUZWFzZXJcXCdzJyApIFxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInNcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFub3RoZXIgYXR0ZW1wdGVkIGZpeDpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyBcIlRlYXNlcidzXCIgXSAgKCBcIlRlYXNlcicnc1wiICkgXG4gICAgICAgIC8vIFtdXG4gICAgICAgIC8vIFtdXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuZDpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgJ1NvbWV0aGluZyBcInF1b3RlZFwiJ1xuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgJ1NvbWV0aGluZyBcInF1b3RlZFwiJyBdICAoIFwiU29tZXRoaW5nIFwicXVvdGVkXCJcIiApIFxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInF1b3RlZFwiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIGNvZGUgYmVsb3cgcHJvZHVjZXM6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIiAnU29tZXRoaW5nIFwicXVvdGVkXCInXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyBcIlRlYXNlcidzXCIsICdTb21ldGhpbmcgXCJxdW90ZWRcIicgXSAgKCAnVGVhc2VyJydzJywnU29tZXRoaW5nIFwicXVvdGVkXCInICkgXG4gICAgICAgIC8vIFsgeyB2cGF0aDogJ3RlYXNlci1jb250ZW50Lmh0bWwubWQnIH0gXVxuICAgICAgICAvLyBbICd0ZWFzZXItY29udGVudC5odG1sLm1kJyBdXG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGRvY3VtZW50c1dpdGhUYWcgJHt1dGlsLmluc3BlY3QodGFncyl9ICR7dGFnc3RyaW5nfWApO1xuXG4gICAgICAgIGNvbnN0IHZwYXRocyA9IGF3YWl0IHRnbHVlLnBhdGhzRm9yVGFnKHRhZ3MpO1xuICAgICAgICBcbiAgICAgICAgLy8gY29uc29sZS5sb2codnBhdGhzKTtcblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodnBhdGhzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudHNXaXRoVGFnIG5vbi1BcnJheSByZXN1bHQgJHt1dGlsLmluc3BlY3QodnBhdGhzKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2cGF0aHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFuIGFycmF5IG9mIHRhZ3MgdXNlZCBieSBhbGwgZG9jdW1lbnRzLlxuICAgICAqIFRoaXMgdXNlcyB0aGUgSlNPTiBleHRlbnNpb24gdG8gZXh0cmFjdFxuICAgICAqIHRoZSB0YWdzIGZyb20gdGhlIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHRhZ3MoKSB7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCB0Z2x1ZS50YWdzKCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXQgPSBBcnJheS5mcm9tKHRhZ3MpO1xuICAgICAgICByZXR1cm4gcmV0LnNvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB2YXIgdGFnQSA9IGEudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHZhciB0YWdCID0gYi50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKHRhZ0EgPCB0YWdCKSByZXR1cm4gLTE7XG4gICAgICAgICAgICBpZiAodGFnQSA+IHRhZ0IpIHJldHVybiAxO1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlIHRoZSBkYXRhIGZvciBhbiBpbnRlcm5hbCBsaW5rXG4gICAgICogd2l0aGluIHRoZSBzaXRlIGRvY3VtZW50cy4gIEZvcm1pbmcgYW5cbiAgICAgKiBpbnRlcm5hbCBsaW5rIGlzIGF0IGEgbWluaW11bSB0aGUgcmVuZGVyZWRcbiAgICAgKiBwYXRoIGZvciB0aGUgZG9jdW1lbnQgYW5kIGl0cyB0aXRsZS5cbiAgICAgKiBUaGUgdGVhc2VyLCBpZiBhdmFpbGFibGUsIGNhbiBiZSB1c2VkIGluXG4gICAgICogYSB0b29sdGlwLiBUaGUgdGh1bWJuYWlsIGlzIGFuIGltYWdlIHRoYXRcbiAgICAgKiBjb3VsZCBiZSBkaXNwbGF5ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgZG9jTGlua0RhdGEodnBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuXG4gICAgICAgIC8vIFRoZSB2cGF0aCByZWZlcmVuY2VcbiAgICAgICAgdnBhdGg6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIHBhdGggaXQgcmVuZGVycyB0b1xuICAgICAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSB0aXRsZSBzdHJpbmcgZnJvbSB0aGF0IHBhZ2VcbiAgICAgICAgdGl0bGU6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIHRlYXNlciB0ZXh0IGZyb20gdGhhdCBwYWdlXG4gICAgICAgIHRlYXNlcj86IHN0cmluZztcbiAgICAgICAgLy8gVGhlIGhlcm8gaW1hZ2UgKHRodW1ibmFpbClcbiAgICAgICAgdGh1bWJuYWlsPzogc3RyaW5nO1xuICAgIH0+IHtcblxuICAgICAgICBjb25zdCBmb3VuZCA9IDxhbnlbXT4gYXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUICpcbiAgICAgICAgICAgIEZST00gJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIFdIRVJFIFxuICAgICAgICAgICAgdnBhdGggPSAkdnBhdGggT1IgcmVuZGVyUGF0aCA9ICR2cGF0aFxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZvdW5kKSkge1xuXG4gICAgICAgICAgICBjb25zdCBkb2MgPSB0aGlzLnZhbGlkYXRlUm93KGZvdW5kWzBdKTtcblxuICAgICAgICAgICAgLy8gY29uc3QgZG9jSW5mbyA9IGF3YWl0IHRoaXMuZmluZCh2cGF0aCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGRvYy5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBkb2MubWV0YWRhdGEudGl0bGUsXG4gICAgICAgICAgICAgICAgdGVhc2VyOiBkb2MubWV0YWRhdGEudGVhc2VyLFxuICAgICAgICAgICAgICAgIC8vIHRodW1ibmFpbFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHRpdGxlOiB1bmRlZmluZWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIGEgc2ltcGxlIGNhY2hlIHRvIGhvbGQgcmVzdWx0c1xuICAgIC8vIG9mIHNlYXJjaCBvcGVyYXRpb25zLiAgVGhlIGtleSBzaWRlIG9mIHRoaXNcbiAgICAvLyBNYXAgaXMgbWVhbnQgdG8gYmUgdGhlIHN0cmluZ2lmaWVkIHNlbGVjdG9yLlxuICAgIHByaXZhdGUgc2VhcmNoQ2FjaGU7XG4gICAgLy8gID0gbmV3IE1hcDxcbiAgICAvLyAgICAgICAgIHN0cmluZywgeyByZXN1bHRzOiBEb2N1bWVudFtdLCB0aW1lc3RhbXA6IG51bWJlciB9XG4gICAgLy8gPigpO1xuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybSBkZXNjcmlwdGl2ZSBzZWFyY2ggb3BlcmF0aW9ucyB1c2luZyBkaXJlY3QgU1FMIHF1ZXJpZXNcbiAgICAgKiBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlIGFuZCBzY2FsYWJpbGl0eS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIFNlYXJjaCBvcHRpb25zIG9iamVjdFxuICAgICAqIEByZXR1cm5zIFByb21pc2U8QXJyYXk8RG9jdW1lbnQ+PlxuICAgICAqL1xuICAgIGFzeW5jIHNlYXJjaChvcHRpb25zKTogUHJvbWlzZTxBcnJheTxEb2N1bWVudD4+IHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBpZiAoIXRoaXMuc2VhcmNoQ2FjaGUpIHtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoQ2FjaGUgPSBuZXcgQ2FjaGUoXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcuY2FjaGluZ1RpbWVvdXRcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaXJzdCwgc2VlIGlmIHRoZSBzZWFyY2ggcmVzdWx0cyBhcmUgYWxyZWFkeVxuICAgICAgICAvLyBjb21wdXRlZCBhbmQgaW4gdGhlIGNhY2hlLlxuXG4gICAgICAgIC8vIFRoZSBpc3N1ZSBoZXJlIGlzIHRoYXQgdGhlIG9wdGlvbnNcbiAgICAgICAgLy8gb2JqZWN0IGNhbiBjb250YWluIFJlZ0V4cCB2YWx1ZXMuXG4gICAgICAgIC8vIFRoZSBSZWdFeHAgb2JqZWN0IGRvZXMgbm90IGhhdmVcbiAgICAgICAgLy8gYSB0b0pTT04gZnVuY3Rpb24uICBUaGlzIGhvb2tcbiAgICAgICAgLy8gY2F1c2VzIFJlZ0V4cCB0byByZXR1cm4gdGhlXG4gICAgICAgIC8vIC50b1N0cmluZygpIHZhbHVlIGluc3RlYWQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFNvdXJjZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjAyNzY1MzEvc3RyaW5naWZ5aW5nLWEtcmVndWxhci1leHByZXNzaW9uXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEEgc2ltaWxhciBpc3N1ZSBleGlzdHMgd2l0aCBGdW5jdGlvbnNcbiAgICAgICAgLy8gaW4gdGhlIG9iamVjdC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gU291cmNlOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy82NzU0OTE5L2pzb24tc3RyaW5naWZ5LWZ1bmN0aW9uXG4gICAgICAgIGNvbnN0IGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUgKyAnJzsgLy8gaW1wbGljaXRseSBgdG9TdHJpbmdgIGl0XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICAvLyBBIHRpbWVvdXQgb2YgMCBtZWFucyB0byBkaXNhYmxlIGNhY2hpbmdcbiAgICAgICAgY29uc3QgY2FjaGVkID1cbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0ID4gMFxuICAgICAgICAgICAgPyB0aGlzLnNlYXJjaENhY2hlLmdldChjYWNoZUtleSlcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggJHt1dGlsLmluc3BlY3Qob3B0aW9ucyl9ID09PiAke2NhY2hlS2V5fSAke2NhY2hlZCA/ICdoYXNDYWNoZWQnIDogJ25vQ2FjaGVkJ31gKTtcblxuICAgICAgICAvLyBJZiB0aGUgY2FjaGUgaGFzIGFuIGVudHJ5LCBza2lwIGNvbXB1dGluZ1xuICAgICAgICAvLyBhbnl0aGluZy5cbiAgICAgICAgaWYgKGNhY2hlZCkgeyAvLyAxIG1pbnV0ZSBjYWNoZVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5PVEU6IEVudHJpZXMgYXJlIGFkZGVkIHRvIHRoZSBjYWNoZSBhdCB0aGUgYm90dG9tXG4gICAgICAgIC8vIG9mIHRoaXMgZnVuY3Rpb25cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBzcWwsIHBhcmFtcyB9ID0gdGhpcy5idWlsZFNlYXJjaFF1ZXJ5KG9wdGlvbnMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHNlYXJjaCAke3NxbH1gKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHNcbiAgICAgICAgICAgICAgICA9IGF3YWl0IHRoaXMuZGIuYWxsKHNxbCwgcGFyYW1zKTtcblxuICAgICAgICAgICAgY29uc3QgZG9jdW1lbnRzXG4gICAgICAgICAgICAgICAgPSB0aGlzLnZhbGlkYXRlUm93cyhyZXN1bHRzKVxuICAgICAgICAgICAgICAgIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmN2dFJvd1RvT2JqKGl0ZW0pXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIEFwcGx5IHBvc3QtU1FMIGZpbHRlcnMgdGhhdCBjYW4ndCBiZSBkb25lIGluIFNRTFxuICAgICAgICAgICAgbGV0IGZpbHRlcmVkUmVzdWx0cyA9IGRvY3VtZW50cztcblxuICAgICAgICAgICAgLy8gRmlsdGVyIGJ5IHJlbmRlcmVycyAocmVxdWlyZXMgY29uZmlnIGxvb2t1cClcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbmRlcmVyc1xuICAgICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkob3B0aW9ucy5yZW5kZXJlcnMpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFJlc3VsdHMgPSBmaWx0ZXJlZFJlc3VsdHMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVuZGVyZXIgPSBmY2FjaGUuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoaXRlbS52cGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVuZGVyZXIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHIgb2Ygb3B0aW9ucy5yZW5kZXJlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gJ3N0cmluZycgJiYgciA9PT0gcmVuZGVyZXIubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHIgPT09ICdvYmplY3QnIHx8IHR5cGVvZiByID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignV0FSTklORzogTWF0Y2hpbmcgcmVuZGVyZXIgYnkgb2JqZWN0IGNsYXNzIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnLCByKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFwcGx5IGN1c3RvbSBmaWx0ZXIgZnVuY3Rpb25cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmZpbHRlcmZ1bmMpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFJlc3VsdHMgPSBmaWx0ZXJlZFJlc3VsdHMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5maWx0ZXJmdW5jKGZjYWNoZS5jb25maWcsIG9wdGlvbnMsIGl0ZW0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBcHBseSBjdXN0b20gc29ydCBmdW5jdGlvbiAoaWYgU1FMIHNvcnRpbmcgd2Fzbid0IHVzZWQpXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc29ydEZ1bmMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFJlc3VsdHMgPSBmaWx0ZXJlZFJlc3VsdHMuc29ydChvcHRpb25zLnNvcnRGdW5jKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQWRkIHRoZSByZXN1bHRzIHRvIHRoZSBjYWNoZVxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmNhY2hpbmdUaW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoQ2FjaGUucHV0KFxuICAgICAgICAgICAgICAgICAgICBjYWNoZUtleSwgZmlsdGVyZWRSZXN1bHRzXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJlZFJlc3VsdHM7XG5cbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLnNlYXJjaCBlcnJvcjogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJ1aWxkIFNRTCBxdWVyeSBhbmQgcGFyYW1ldGVycyBmb3Igc2VhcmNoIG9wdGlvbnNcbiAgICAgKi9cbiAgICBwcml2YXRlIGJ1aWxkU2VhcmNoUXVlcnkob3B0aW9ucyk6IHtcbiAgICAgICAgc3FsOiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogYW55XG4gICAgfSB7XG4gICAgICAgIGNvbnN0IHBhcmFtczogYW55ID0ge307XG4gICAgICAgIGNvbnN0IHdoZXJlQ2xhdXNlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3Qgam9pbnM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGxldCBwYXJhbUNvdW50ZXIgPSAwO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBidWlsZFNlYXJjaFF1ZXJ5ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfWApO1xuXG4gICAgICAgIC8vIEhlbHBlciB0byBjcmVhdGUgdW5pcXVlIHBhcmFtZXRlciBuYW1lc1xuICAgICAgICBjb25zdCBhZGRQYXJhbSA9ICh2YWx1ZTogYW55KTogc3RyaW5nID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtTmFtZSA9IGAkcGFyYW0keysrcGFyYW1Db3VudGVyfWA7XG4gICAgICAgICAgICBwYXJhbXNbcGFyYW1OYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtTmFtZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBCYXNlIHF1ZXJ5XG4gICAgICAgIGxldCBzcWwgPSBgXG4gICAgICAgICAgICBTRUxFQ1QgRElTVElOQ1QgZC4qIEZST00gJHt0aGlzLnF1b3RlZERCTmFtZX0gZFxuICAgICAgICBgO1xuXG4gICAgICAgIC8vIE1JTUUgdHlwZSBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMubWltZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm1pbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubWltZSA9ICR7YWRkUGFyYW0ob3B0aW9ucy5taW1lKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLm1pbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGxhY2Vob2xkZXJzID0gb3B0aW9ucy5taW1lLm1hcChtaW1lID0+IGFkZFBhcmFtKG1pbWUpKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLm1pbWUgSU4gKCR7cGxhY2Vob2xkZXJzfSlgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlcnMgdG8gSFRNTCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnNUb0hUTUwgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyc1RvSFRNTCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJzVG9IVE1MID8gMSA6IDApfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUm9vdCBwYXRoIGZpbHRlcmluZ1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucm9vdFBhdGggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIExJS0UgJHthZGRQYXJhbShvcHRpb25zLnJvb3RQYXRoICsgJyUnKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdsb2IgcGF0dGVybiBtYXRjaGluZ1xuICAgICAgICBpZiAob3B0aW9ucy5nbG9iICYmIHR5cGVvZiBvcHRpb25zLmdsb2IgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25zdCBlc2NhcGVkR2xvYiA9IG9wdGlvbnMuZ2xvYi5pbmRleE9mKFwiJ1wiKSA+PSAwIFxuICAgICAgICAgICAgICAgID8gb3B0aW9ucy5nbG9iLnJlcGxhY2VBbGwoXCInXCIsIFwiJydcIikgXG4gICAgICAgICAgICAgICAgOiBvcHRpb25zLmdsb2I7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC52cGF0aCBHTE9CICR7YWRkUGFyYW0oZXNjYXBlZEdsb2IpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVuZGVyIGdsb2IgcGF0dGVybiBtYXRjaGluZ1xuICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJnbG9iICYmIHR5cGVvZiBvcHRpb25zLnJlbmRlcmdsb2IgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25zdCBlc2NhcGVkR2xvYiA9IG9wdGlvbnMucmVuZGVyZ2xvYi5pbmRleE9mKFwiJ1wiKSA+PSAwIFxuICAgICAgICAgICAgICAgID8gb3B0aW9ucy5yZW5kZXJnbG9iLnJlcGxhY2VBbGwoXCInXCIsIFwiJydcIikgXG4gICAgICAgICAgICAgICAgOiBvcHRpb25zLnJlbmRlcmdsb2I7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIEdMT0IgJHthZGRQYXJhbShlc2NhcGVkR2xvYil9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCbG9nIHRhZyBmaWx0ZXJpbmdcbiAgICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIGJsb2d0YWdzIGFycmF5IGlzIHVzZWQsXG4gICAgICAgIC8vIGlmIHByZXNlbnQsIHdpdGggdGhlIGJsb2d0YWcgdmFsdWUgdXNlZFxuICAgICAgICAvLyBvdGhlcndpc2UuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBwdXJwb3NlIGZvciB0aGUgYmxvZ3RhZ3MgdmFsdWUgaXMgdG9cbiAgICAgICAgLy8gc3VwcG9ydCBhIHBzZXVkby1ibG9nIG1hZGUgb2YgdGhlIGl0ZW1zXG4gICAgICAgIC8vIGZyb20gbXVsdGlwbGUgYWN0dWFsIGJsb2dzLlxuICAgICAgICAvLyBpZiAodHlwZW9mIG9wdGlvbnMuYmxvZ3RhZ3MgIT09ICd1bmRlZmluZWQnXG4gICAgICAgIC8vICB8fCB0eXBlb2Ygb3B0aW9ucy5ibG9ndGFnICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAvLyApIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGAgYmxvZ3RhZ3MgJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5ibG9ndGFncyl9IGJsb2d0YWcgJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5ibG9ndGFnKX1gKTtcbiAgICAgICAgLy8gfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmJsb2d0YWdzKSkge1xuICAgICAgICAgICAgY29uc3QgcGxhY2Vob2xkZXJzID0gb3B0aW9ucy5ibG9ndGFncy5tYXAodGFnID0+IGFkZFBhcmFtKHRhZykpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5ibG9ndGFnIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZC5ibG9ndGFnIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMuYmxvZ3RhZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmJsb2d0YWcgPSAke2FkZFBhcmFtKG9wdGlvbnMuYmxvZ3RhZyl9YCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZC5ibG9ndGFnID0gJHtvcHRpb25zLmJsb2d0YWd9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMuYmxvZ3RhZ3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIGJsb2d0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZ3MpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGFnIGZpbHRlcmluZyB1c2luZyBUQUdHTFVFIHRhYmxlXG4gICAgICAgIGlmIChvcHRpb25zLnRhZyAmJiB0eXBlb2Ygb3B0aW9ucy50YWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBqb2lucy5wdXNoKGBJTk5FUiBKT0lOIFRBR0dMVUUgdGcgT04gZC52cGF0aCA9IHRnLmRvY3ZwYXRoYCk7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgdGcudGFnTmFtZSA9ICR7YWRkUGFyYW0ob3B0aW9ucy50YWcpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTGF5b3V0IGZpbHRlcmluZ1xuICAgICAgICBpZiAob3B0aW9ucy5sYXlvdXRzKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmxheW91dHMpKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubGF5b3V0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubGF5b3V0ID0gJHthZGRQYXJhbShvcHRpb25zLmxheW91dHNbMF0pfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5sYXlvdXRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGxhY2Vob2xkZXJzID0gb3B0aW9ucy5sYXlvdXRzLm1hcChsYXlvdXQgPT4gYWRkUGFyYW0obGF5b3V0KSkuam9pbignLCAnKTtcbiAgICAgICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubGF5b3V0IElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5sYXlvdXQgPSAke2FkZFBhcmFtKG9wdGlvbnMubGF5b3V0cyl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQYXRoIHJlZ2V4IG1hdGNoaW5nXG4gICAgICAgIGNvbnN0IHJlZ2V4Q2xhdXNlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnBhdGhtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnBhdGhtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQudnBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5wYXRobWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBwYXRobWF0Y2ggcmVnZXhwICR7dXRpbC5pbnNwZWN0KG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoJ3BhdGhtYXRjaCcgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBwYXRobWF0Y2ggJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5wYXRobWF0Y2gpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVuZGVyIHBhdGggcmVnZXggbWF0Y2hpbmdcbiAgICAgICAgLy8gaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKHV0aWwuaW5zcGVjdChvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCwgZmFsc2UsIDMpKTtcbiAgICAgICAgLy8gfVxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQucmVuZGVyUGF0aCByZWdleHAgc3RyaW5nICR7b3B0aW9ucy5yZW5kZXJwYXRobWF0Y2h9YCk7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQucmVuZGVyUGF0aCByZWdleHAgcmVnZXhwICR7b3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlfWApO1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQucmVuZGVyUGF0aCByZWdleHAgYXJyYXkgc3RyaW5nICR7bWF0Y2h9YCk7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0obWF0Y2gpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQucmVuZGVyUGF0aCByZWdleHAgYXJyYXkgcmVnZXhwICR7bWF0Y2guc291cmNlfWApO1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCByZW5kZXJwYXRobWF0Y2ggcmVnZXhwICR7dXRpbC5pbnNwZWN0KG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoJ3JlbmRlcnBhdGhtYXRjaCcgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCByZW5kZXJwYXRobWF0Y2ggJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlZ2V4Q2xhdXNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgKCR7cmVnZXhDbGF1c2VzLmpvaW4oJyBPUiAnKX0pYCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgSk9JTnMgdG8gcXVlcnlcbiAgICAgICAgaWYgKGpvaW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNxbCArPSAnICcgKyBqb2lucy5qb2luKCcgJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgV0hFUkUgY2xhdXNlXG4gICAgICAgIGlmICh3aGVyZUNsYXVzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3FsICs9ICcgV0hFUkUgJyArIHdoZXJlQ2xhdXNlcy5qb2luKCcgQU5EICcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIE9SREVSIEJZIGNsYXVzZVxuICAgICAgICBsZXQgb3JkZXJCeSA9ICcnO1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc29ydEJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gSGFuZGxlIHNwZWNpYWwgY2FzZXMgdGhhdCBuZWVkIEpTT04gZXh0cmFjdGlvbiBvciBjb21wbGV4IGxvZ2ljXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zb3J0QnkgPT09ICdwdWJsaWNhdGlvbkRhdGUnXG4gICAgICAgICAgICAgfHwgb3B0aW9ucy5zb3J0QnkgPT09ICdwdWJsaWNhdGlvblRpbWUnXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgQ09BTEVTQ0UgdG8gaGFuZGxlIG51bGwgcHVibGljYXRpb24gZGF0ZXNcbiAgICAgICAgICAgICAgICBvcmRlckJ5ID0gYE9SREVSIEJZIENPQUxFU0NFKFxuICAgICAgICAgICAgICAgICAgICBkLnB1YmxpY2F0aW9uVGltZSxcbiAgICAgICAgICAgICAgICAgICAgZC5tdGltZU1zXG4gICAgICAgICAgICAgICAgKWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgb3RoZXIgZmllbGRzLCBzb3J0IGJ5IHRoZSBjb2x1bW4gZGlyZWN0bHlcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGFsbG93cyBzb3J0aW5nIGJ5IGFueSB2YWxpZCBjb2x1bW4gaW4gdGhlIERPQ1VNRU5UUyB0YWJsZVxuICAgICAgICAgICAgICAgIG9yZGVyQnkgPSBgT1JERVIgQlkgZC4ke29wdGlvbnMuc29ydEJ5fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZXZlcnNlIHx8IG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZykge1xuICAgICAgICAgICAgLy8gSWYgcmV2ZXJzZS9zb3J0QnlEZXNjZW5kaW5nIGlzIHNwZWNpZmllZCB3aXRob3V0IHNvcnRCeSwgXG4gICAgICAgICAgICAvLyB1c2UgYSBkZWZhdWx0IG9yZGVyaW5nIChieSBtb2RpZmljYXRpb24gdGltZSlcbiAgICAgICAgICAgIG9yZGVyQnkgPSAnT1JERVIgQlkgZC5tdGltZU1zJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBzb3J0IGRpcmVjdGlvblxuICAgICAgICBpZiAob3JkZXJCeSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZyB8fCBvcHRpb25zLnJldmVyc2UpIHtcbiAgICAgICAgICAgICAgICBvcmRlckJ5ICs9ICcgREVTQyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9yZGVyQnkgKz0gJyBBU0MnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3FsICs9ICcgJyArIG9yZGVyQnk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgTElNSVQgYW5kIE9GRlNFVFxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubGltaXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBzcWwgKz0gYCBMSU1JVCAke2FkZFBhcmFtKG9wdGlvbnMubGltaXQpfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHNxbCArPSBgIE9GRlNFVCAke2FkZFBhcmFtKG9wdGlvbnMub2Zmc2V0KX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgc3FsLCBwYXJhbXMgfTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IHZhciBhc3NldHNDYWNoZTogQXNzZXRzQ2FjaGU7XG5leHBvcnQgdmFyIHBhcnRpYWxzQ2FjaGU6IFBhcnRpYWxzQ2FjaGU7XG5leHBvcnQgdmFyIGxheW91dHNDYWNoZTogTGF5b3V0c0NhY2hlO1xuZXhwb3J0IHZhciBkb2N1bWVudHNDYWNoZTogRG9jdW1lbnRzQ2FjaGU7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZGI6IEFzeW5jRGF0YWJhc2Vcbik6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgLy8gY29uc29sZS5sb2coY3JlYXRlQXNzZXRzVGFibGUpO1xuICAgIGF3YWl0IGRiLnJ1bihjcmVhdGVBc3NldHNUYWJsZSk7XG5cbiAgICBhc3NldHNDYWNoZSA9IG5ldyBBc3NldHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAnYXNzZXRzJyxcbiAgICAgICAgY29uZmlnLmFzc2V0RGlycyxcbiAgICAgICAgZGIsXG4gICAgICAgICdBU1NFVFMnXG4gICAgKTtcbiAgICBhd2FpdCBhc3NldHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgYXNzZXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGNyZWF0ZVBhcnRpYWxzVGFibGUpO1xuICAgIGF3YWl0IGRiLnJ1bihjcmVhdGVQYXJ0aWFsc1RhYmxlKTtcblxuICAgIHBhcnRpYWxzQ2FjaGUgPSBuZXcgUGFydGlhbHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAncGFydGlhbHMnLFxuICAgICAgICBjb25maWcucGFydGlhbHNEaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ1BBUlRJQUxTJ1xuICAgICk7XG4gICAgYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgcGFydGlhbHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsc0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhjcmVhdGVMYXlvdXRzVGFibGUpO1xuICAgIGF3YWl0IGRiLnJ1bihjcmVhdGVMYXlvdXRzVGFibGUpO1xuXG4gICAgbGF5b3V0c0NhY2hlID0gbmV3IExheW91dHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAnbGF5b3V0cycsXG4gICAgICAgIGNvbmZpZy5sYXlvdXREaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ0xBWU9VVFMnXG4gICAgKTtcbiAgICBhd2FpdCBsYXlvdXRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIGxheW91dHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGBEb2N1bWVudHNGaWxlQ2FjaGUgJ2RvY3VtZW50cycgJHt1dGlsLmluc3BlY3QoY29uZmlnLmRvY3VtZW50RGlycyl9YCk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhjcmVhdGVEb2N1bWVudHNUYWJsZSk7XG4gICAgYXdhaXQgZGIucnVuKGNyZWF0ZURvY3VtZW50c1RhYmxlKTtcblxuICAgIGRvY3VtZW50c0NhY2hlID0gbmV3IERvY3VtZW50c0NhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdkb2N1bWVudHMnLFxuICAgICAgICBjb25maWcuZG9jdW1lbnREaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ0RPQ1VNRU5UUydcbiAgICApO1xuICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLnNldHVwKCk7XG4gICAgYXdhaXQgdGdsdWUuaW5pdChkYik7XG4gICAgYXdhaXQgdGRlc2MuaW5pdChkYik7XG5cbiAgICBkb2N1bWVudHNDYWNoZS5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3VtZW50c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGVycil9YCk7XG4gICAgICAgIC8vIHByb2Nlc3MuZXhpdCgwKTtcbiAgICB9KTtcblxuICAgIGF3YWl0IGNvbmZpZy5ob29rUGx1Z2luQ2FjaGVTZXR1cCgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VGaWxlQ2FjaGVzKCkge1xuICAgIGlmIChkb2N1bWVudHNDYWNoZSkge1xuICAgICAgICBhd2FpdCBkb2N1bWVudHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBkb2N1bWVudHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGFzc2V0c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGFzc2V0c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGFzc2V0c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAobGF5b3V0c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGxheW91dHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBsYXlvdXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChwYXJ0aWFsc0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IHBhcnRpYWxzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgcGFydGlhbHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG4iXX0=