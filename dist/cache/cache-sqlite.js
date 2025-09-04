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
        this.findByPathCache = new Map();
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
        const cacheKey = JSON.stringify({
            dbname: this.quotedDBName,
            vpath,
        });
        const cached = this.findByPathCache.get(cacheKey);
        if (cached
            && (Date.now() - cached.timestamp) < 60000) {
            return cached.result;
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
        // TODO add a row validator to generic interface
        const mapped = this.validateRows(found);
        // for (const item of mapped) {
        //     this.gatherInfoData(item);
        // }
        const ret = mapped.map(item => {
            return this.cvtRowToObj(item);
        });
        this.findByPathCache.set(cacheKey, {
            result: ret,
            timestamp: Date.now()
        });
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
    constructor() {
        super(...arguments);
        // This is a simple cache to hold results
        // of search operations.  The key side of this
        // Map is meant to be the stringified selector.
        this.searchCache = new Map();
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
        return filez
            .map(function (obj) {
            return {
                title: obj.docMetadata.title,
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
        let ret;
        let vpath = _fpath.startsWith('/')
            ? _fpath.substring(1)
            : _fpath;
        let dirname = path.dirname(vpath);
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
        return mapped.map(item => {
            return this.cvtRowToObj(item);
        });
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
    /**
     * Perform descriptive search operations using direct SQL queries
     * for better performance and scalability.
     *
     * @param options Search options object
     * @returns Promise<Array<Document>>
     */
    async search(options) {
        const fcache = this;
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
        const cached = this.config.searchCacheTimeout > 0
            ? this.searchCache.get(cacheKey)
            : undefined;
        // console.log(`search ${util.inspect(options)} ==> ${cacheKey} ${cached ? 'hasCached' : 'noCached'}`);
        // If the cache has an entry, skip computing
        // anything.
        if (cached
            && (Date.now() - cached.timestamp)
                < this.config.searchCacheTimeout) { // 1 minute cache
            return cached.results;
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
            if (this.config.searchCacheTimeout > 0) {
                this.searchCache.set(cacheKey, {
                    results: filteredResults, timestamp: Date.now()
                });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUtc3FsaXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NhY2hlL2NhY2hlLXNxbGl0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSxPQUFPLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDekIsT0FBTyxFQUNILFdBQVcsRUFDZCxNQUFNLHlCQUF5QixDQUFDO0FBSWpDLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxZQUFZLE1BQU0sUUFBUSxDQUFDO0FBQ2xDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUNILE9BQU8sRUFBRSxlQUFlLEVBQzNCLE1BQU0sbUJBQW1CLENBQUM7QUFDM0IsT0FBTyxFQUNILGlCQUFpQixFQUNqQixvQkFBb0IsRUFDcEIsa0JBQWtCLEVBQ2xCLG1CQUFtQixFQUNGLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLHVCQUF1QixFQUM3RyxNQUFNLGFBQWEsQ0FBQztBQUlyQixPQUFPLFNBQVMsTUFBTSxrQkFBa0IsQ0FBQztBQVV6QyxNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzVCLHdCQUF3QjtBQUV4QixNQUFNLEtBQUssR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO0FBQ3BDLHdCQUF3QjtBQUV4QixxREFBcUQ7QUFDckQsc0JBQXNCO0FBQ3RCLE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBa0IsRUFBZ0IsRUFBRTtJQUNuRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDbEIscUNBQXFDO1FBQ3JDLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDMUIsT0FBTztnQkFDSCxPQUFPLEVBQUUsR0FBRztnQkFD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Q0FBQztJQUMvQixDQUFDO0lBQ0QsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNkLE1BQU0sV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFCLFdBQVcsR0FBRyxTQUFTLENBQUM7SUFDNUIsQ0FBQztJQUNELElBQUksWUFBWSxFQUFFLENBQUM7UUFDZixNQUFNLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMzQixZQUFZLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUM7SUFDRCxJQUFJLGFBQWEsRUFBRSxDQUFDO1FBQ2hCLE1BQU0sYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVCLGFBQWEsR0FBRyxTQUFTLENBQUM7SUFDOUIsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBGUyBmcm9tICdub2RlOmZzJztcbmltcG9ydCB7XG4gICAgRGlyc1dhdGNoZXIsIGRpclRvV2F0Y2gsIFZQYXRoRGF0YVxufSBmcm9tICdAYWthc2hhY21zL3N0YWNrZWQtZGlycyc7XG5pbXBvcnQge1xuICAgIENvbmZpZ3VyYXRpb24sIGRpclRvTW91bnQsIGluZGV4Q2hhaW5JdGVtXG59IGZyb20gJy4uL2luZGV4LmpzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaW1wb3J0IG1pY3JvbWF0Y2ggZnJvbSAnbWljcm9tYXRjaCc7XG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHtcbiAgICBUYWdHbHVlLCBUYWdEZXNjcmlwdGlvbnNcbn0gZnJvbSAnLi90YWctZ2x1ZS1uZXcuanMnO1xuaW1wb3J0IHtcbiAgICBjcmVhdGVBc3NldHNUYWJsZSxcbiAgICBjcmVhdGVEb2N1bWVudHNUYWJsZSxcbiAgICBjcmVhdGVMYXlvdXRzVGFibGUsXG4gICAgY3JlYXRlUGFydGlhbHNUYWJsZSxcbiAgICBQYXRoc1JldHVyblR5cGUsIHZhbGlkYXRlQXNzZXQsIHZhbGlkYXRlRG9jdW1lbnQsIHZhbGlkYXRlTGF5b3V0LCB2YWxpZGF0ZVBhcnRpYWwsIHZhbGlkYXRlUGF0aHNSZXR1cm5UeXBlXG59IGZyb20gJy4vc2NoZW1hLmpzJztcblxuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tICdzcWxpdGUzJztcbmltcG9ydCB7IEFzeW5jRGF0YWJhc2UgfSBmcm9tICdwcm9taXNlZC1zcWxpdGUzJztcbmltcG9ydCBTcWxTdHJpbmcgZnJvbSAnc3Fsc3RyaW5nLXNxbGl0ZSc7XG5pbXBvcnQge1xuICAgIEJhc2VDYWNoZUVudHJ5LFxuICAgIEFzc2V0LFxuICAgIFBhcnRpYWwsXG4gICAgTGF5b3V0LFxuICAgIERvY3VtZW50XG59IGZyb20gJy4vc2NoZW1hLmpzJztcbmltcG9ydCB7IGZ1bmMgfSBmcm9tICdqb2knO1xuXG5jb25zdCB0Z2x1ZSA9IG5ldyBUYWdHbHVlKCk7XG4vLyB0Z2x1ZS5pbml0KHNxZGIuX2RiKTtcblxuY29uc3QgdGRlc2MgPSBuZXcgVGFnRGVzY3JpcHRpb25zKCk7XG4vLyB0ZGVzYy5pbml0KHNxZGIuX2RiKTtcblxuLy8gQ29udmVydCBBa2FzaGFDTVMgbW91bnQgcG9pbnRzIGludG8gdGhlIG1vdW50cG9pbnRcbi8vIHVzZWQgYnkgRGlyc1dhdGNoZXJcbmNvbnN0IHJlbWFwZGlycyA9IChkaXJ6OiBkaXJUb01vdW50W10pOiBkaXJUb1dhdGNoW10gPT4ge1xuICAgIHJldHVybiBkaXJ6Lm1hcChkaXIgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZG9jdW1lbnQgZGlyICcsIGRpcik7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogJy8nLFxuICAgICAgICAgICAgICAgIGJhc2VNZXRhZGF0YToge31cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWRpci5kZXN0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW1hcGRpcnMgaW52YWxpZCBtb3VudCBzcGVjaWZpY2F0aW9uICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5zcmMsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLmRlc3QsXG4gICAgICAgICAgICAgICAgYmFzZU1ldGFkYXRhOiBkaXIuYmFzZU1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGlnbm9yZTogZGlyLmlnbm9yZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuZXhwb3J0IGNsYXNzIEJhc2VDYWNoZTxcbiAgICBUIGV4dGVuZHMgQmFzZUNhY2hlRW50cnlcbj4gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgI2NvbmZpZz86IENvbmZpZ3VyYXRpb247XG4gICAgI25hbWU/OiBzdHJpbmc7XG4gICAgI2RpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2lzX3JlYWR5OiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAjZGI6IEFzeW5jRGF0YWJhc2U7XG4gICAgI2RibmFtZTogc3RyaW5nO1xuXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICAgICAqIEBwYXJhbSBkaXJzIGFycmF5IG9mIGRpcmVjdG9yaWVzIGFuZCBtb3VudCBwb2ludHMgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gbmFtZSBzdHJpbmcgZ2l2aW5nIHRoZSBuYW1lIGZvciB0aGlzIHdhdGNoZXIgbmFtZVxuICAgICAqIEBwYXJhbSBkYiBUaGUgUFJPTUlTRUQgU1FMSVRFMyBBc3luY0RhdGFiYXNlIGluc3RhbmNlIHRvIHVzZVxuICAgICAqIEBwYXJhbSBkYm5hbWUgVGhlIGRhdGFiYXNlIG5hbWUgdG8gdXNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb01vdW50W10sXG4gICAgICAgIGRiOiBBc3luY0RhdGFiYXNlLFxuICAgICAgICBkYm5hbWU6IHN0cmluZ1xuICAgICkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQmFzZUZpbGVDYWNoZSAke25hbWV9IGNvbnN0cnVjdG9yIGRpcnM9JHt1dGlsLmluc3BlY3QoZGlycyl9YCk7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy4jbmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuI2RpcnMgPSBkaXJzO1xuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNkYiA9IGRiO1xuICAgICAgICB0aGlzLiNkYm5hbWUgPSBkYm5hbWU7XG4gICAgfVxuXG4gICAgZ2V0IGNvbmZpZygpICAgICB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICBnZXQgbmFtZSgpICAgICAgIHsgcmV0dXJuIHRoaXMuI25hbWU7IH1cbiAgICBnZXQgZGlycygpICAgICAgIHsgcmV0dXJuIHRoaXMuI2RpcnM7IH1cbiAgICBnZXQgZGIoKSAgICAgICAgIHsgcmV0dXJuIHRoaXMuI2RiOyB9XG4gICAgZ2V0IGRibmFtZSgpICAgICB7IHJldHVybiB0aGlzLiNkYm5hbWU7IH1cbiAgICBnZXQgcXVvdGVkREJOYW1lKCkge1xuICAgICAgICByZXR1cm4gU3FsU3RyaW5nLmVzY2FwZSh0aGlzLiNkYm5hbWUpO1xuICAgIH1cblxuICAgICN3YXRjaGVyOiBEaXJzV2F0Y2hlcjtcbiAgICAjcXVldWU7XG5cbiAgICBhc3luYyBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuI3F1ZXVlKSB7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZS5raWxsQW5kRHJhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLiN3YXRjaGVyKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0xPU0lORyAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuI3dhdGNoZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2NoYW5nZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2FkZGVkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCd1bmxpbmtlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVhZHknKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy4jZGIuY2xvc2UoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYCR7dGhpcy5uYW1lfSBlcnJvciBvbiBjbG9zZSAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHVwIHJlY2VpdmluZyBldmVudHMgZnJvbSBEaXJzV2F0Y2hlciwgYW5kIGRpc3BhdGNoaW5nIHRvXG4gICAgICogdGhlIGhhbmRsZXIgbWV0aG9kcy5cbiAgICAgKi9cbiAgICBhc3luYyBzZXR1cCgpIHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBpZiAodGhpcy4jd2F0Y2hlcikge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy4jd2F0Y2hlci5jbG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jcXVldWUgPSBmYXN0cS5wcm9taXNlKGFzeW5jIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmNvZGUgPT09ICdjaGFuZ2VkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGFuZ2UgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVDaGFuZ2VkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnY2hhbmdlJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAnYWRkZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGFkZCAke2V2ZW50Lm5hbWV9ICR7ZXZlbnQuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZUFkZGVkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnYWRkJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mbzogZXZlbnQuaW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ3VubGlua2VkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGB1bmxpbmsgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVVbmxpbmtlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ3VubGluaycsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVFcnJvcihldmVudC5uYW1lKSAqL1xuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAncmVhZHknKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZVJlYWR5KGV2ZW50Lm5hbWUpO1xuICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdyZWFkeScsIGV2ZW50Lm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMCk7XG5cbiAgICAgICAgdGhpcy4jd2F0Y2hlciA9IG5ldyBEaXJzV2F0Y2hlcih0aGlzLm5hbWUpO1xuXG4gICAgICAgIHRoaXMuI3dhdGNoZXIub24oJ2NoYW5nZScsIGFzeW5jIChuYW1lOiBzdHJpbmcsIGluZm86IFZQYXRoRGF0YSkgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gY2hhbmdlZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFVTSCAke25hbWV9IGNoYW5nZWQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICdjaGFuZ2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ2NoYW5nZScgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIGNoYW5nZSAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignYWRkJywgYXN5bmMgKG5hbWU6IHN0cmluZywgaW5mbzogVlBhdGhEYXRhKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IGFkZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBQVVNIICR7bmFtZX0gYWRkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnYWRkZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAnYWRkJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgYWRkICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCd1bmxpbmsnLCBhc3luYyAobmFtZTogc3RyaW5nLCBpbmZvOiBWUGF0aERhdGEpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGB1bmxpbmsgJHtuYW1lfSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ3VubGlua2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ3VubGluaycgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCB1bmxpbmsgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ3JlYWR5JywgYXN5bmMgKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gcmVhZHlgKTtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvZGU6ICdyZWFkeScsXG4gICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2V0dXAgJHt0aGlzLiNuYW1lfSB3YXRjaCAke3V0aWwuaW5zcGVjdCh0aGlzLiNkaXJzKX0gPT0+ICR7dXRpbC5pbnNwZWN0KG1hcHBlZCl9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIud2F0Y2gobWFwcGVkKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgREFPICR7dGhpcy5kYW8udGFibGUubmFtZX0gJHt1dGlsLmluc3BlY3QodGhpcy5kYW8udGFibGUuZmllbGRzKX1gKTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFZhbGlkYXRlIGFuIGl0ZW0sIHdoaWNoIGlzIGV4cGVjdGVkIHRvIGJlXG4gICAgICogYSByb3cgZnJvbSBkYXRhYmFzZSBxdWVyeSByZXN1bHRzLCB1c2luZ1xuICAgICAqIG9uZSBvZiB0aGUgdmFsaWRhdG9yIGZ1bmN0aW9ucyBpbiBzY2hlbWEudHMuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIG11c3QgYmUgc3ViY2xhc3NlZCB0b1xuICAgICAqIGZ1bmN0aW9uIGNvcnJlY3RseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb3cgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93KHJvdzogYW55KTogVCB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdmFsaWRhdGVSb3cgbXVzdCBiZSBzdWJjbGFzc2VkYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVmFsaWRhdGUgYW4gYXJyYXksIHdoaWNoIGlzIGV4cGVjdGVkIHRvIGJlXG4gICAgICogZGF0YWJhc2UgcXVlcnkgcmVzdWx0cywgdXNpbmcgb25lIG9mIHRoZVxuICAgICAqIHZhbGlkYXRvciBmdW5jdGlvbnMgaW4gc2NoZW1hLnRzLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBtdXN0IGJlIHN1YmNsYXNzZWQgdG9cbiAgICAgKiBmdW5jdGlvbiBjb3JyZWN0bHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm93IFxuICAgICAqL1xuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvd3Mocm93czogYW55W10pOiBUW10ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHZhbGlkYXRlUm93cyBtdXN0IGJlIHN1YmNsYXNzZWRgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IGZpZWxkcyBmcm9tIHRoZSBkYXRhYmFzZVxuICAgICAqIHJlcHJlc2VudGF0aW9uIHRvIHRoZSBmb3JtIHJlcXVpcmVkXG4gICAgICogZm9yIGV4ZWN1dGlvbi5cbiAgICAgKiBcbiAgICAgKiBUaGUgZGF0YWJhc2UgY2Fubm90IHN0b3JlcyBKU09OIGZpZWxkc1xuICAgICAqIGFzIGFuIG9iamVjdCBzdHJ1Y3R1cmUsIGJ1dCBhcyBhIHNlcmlhbGllZFxuICAgICAqIEpTT04gc3RyaW5nLiAgSW5zaWRlIEFrYXNoYUNNUyBjb2RlIHRoYXRcbiAgICAgKiBvYmplY3QgbXVzdCBiZSBhbiBvYmplY3QgcmF0aGVyIHRoYW5cbiAgICAgKiBhIHN0cmluZy5cbiAgICAgKiBcbiAgICAgKiBUaGUgb2JqZWN0IHBhc3NlZCBhcyBcInJvd1wiIHNob3VsZCBhbHJlYWR5XG4gICAgICogaGF2ZSBiZWVuIHZhbGlkYXRlZCB1c2luZyB2YWxpZGF0ZVJvdy5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gcm93IFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IFQge1xuICAgICAgICBpZiAodHlwZW9mIHJvdy5pbmZvID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmluZm8gPSBKU09OLnBhcnNlKHJvdy5pbmZvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPFQ+cm93O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYW4gaW5mbyBvYmplY3QgYmFzZWQgb24gdnBhdGggYW5kIG1vdW50ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHBhcmFtIG1vdW50ZWQgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIGZpbmRQYXRoTW91bnRlZChcbiAgICAgICAgdnBhdGg6IHN0cmluZywgbW91bnRlZDogc3RyaW5nXG4gICAgKTogUHJvbWlzZTxBcnJheTx7XG4gICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgIG1vdW50ZWQ6IHN0cmluZ1xuICAgIH0+PiAge1xuICAgICAgICBcbiAgICAgICAgY29uc3QgZm91bmQgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUIHZwYXRoLCBtb3VudGVkXG4gICAgICAgICAgICBGUk9NICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICBXSEVSRSBcbiAgICAgICAgICAgIHZwYXRoID0gJHZwYXRoIEFORCBtb3VudGVkID0gJG1vdW50ZWRcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJHZwYXRoOiB2cGF0aCxcbiAgICAgICAgICAgICRtb3VudGVkOiBtb3VudGVkXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBtYXBwZWQgPSBuZXcgQXJyYXk8e1xuICAgICAgICAgICAgdnBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgIG1vdW50ZWQ6IHN0cmluZ1xuICAgICAgICB9PigpO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZm91bmQpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbS52cGF0aCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAmJiB0eXBlb2YgaXRlbS5tb3VudGVkID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgbWFwcGVkLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogaXRlbS52cGF0aCwgbW91bnRlZDogaXRlbS5tb3VudGVkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZFBhdGhNb3VudGVkOiBJbnZhbGlkIG9iamVjdCAgZm91bmQgaW4gcXVlcnkgKCR7dnBhdGh9LCAke21vdW50ZWR9KSByZXN1bHRzICR7dXRpbC5pbnNwZWN0KGl0ZW0pfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXBwZWQ7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGZpbmRCeVBhdGhDYWNoZSA9IG5ldyBNYXA8XG4gICAgICAgIHN0cmluZyxcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzdWx0OiBhbnksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG51bWJlclxuICAgICAgICB9XG4gICAgPigpO1xuXG4gICAgLyoqXG4gICAgICogRmluZCBhbiBpbmZvIG9iamVjdCBieSB0aGUgdnBhdGguXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIGZpbmRCeVBhdGgodnBhdGg6IHN0cmluZykge1xuXG4gICAgICAgIGNvbnN0IGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgZGJuYW1lOiB0aGlzLnF1b3RlZERCTmFtZSxcbiAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjYWNoZWRcbiAgICAgICAgICAgID0gdGhpcy5maW5kQnlQYXRoQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgaWYgKGNhY2hlZFxuICAgICAgICAgJiYgKERhdGUubm93KCkgLSBjYWNoZWQudGltZXN0YW1wKSA8IDYwMDAwXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZEJ5UGF0aCAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9ICR7dnBhdGh9YCk7XG5cbiAgICAgICAgY29uc3QgZm91bmQgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUICpcbiAgICAgICAgICAgIEZST00gJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIFdIRVJFIFxuICAgICAgICAgICAgdnBhdGggPSAkdnBhdGggT1IgcmVuZGVyUGF0aCA9ICR2cGF0aFxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRPRE8gYWRkIGEgcm93IHZhbGlkYXRvciB0byBnZW5lcmljIGludGVyZmFjZVxuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHRoaXMudmFsaWRhdGVSb3dzKGZvdW5kKTtcblxuICAgICAgICAvLyBmb3IgKGNvbnN0IGl0ZW0gb2YgbWFwcGVkKSB7XG4gICAgICAgIC8vICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGl0ZW0pO1xuICAgICAgICAvLyB9XG4gICAgICAgIGNvbnN0IHJldCA9IG1hcHBlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmZpbmRCeVBhdGhDYWNoZS5zZXQoXG4gICAgICAgICAgICBjYWNoZUtleSwge1xuICAgICAgICAgICAgICAgIHJlc3VsdDogcmV0LFxuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbzogVCkge1xuICAgICAgICAvLyBQbGFjZWhvbGRlciB3aGljaCBzb21lIHN1YmNsYXNzZXNcbiAgICAgICAgLy8gYXJlIGV4cGVjdGVkIHRvIG92ZXJyaWRlXG5cbiAgICAgICAgLy8gaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBnYXRoZXJJbmZvRGF0YSBtdXN0IGJlIG92ZXJyaWRkZW5gKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaGFuZGxlQ2hhbmdlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlQ2hhbmdlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgT09PT09PT09HQSEhISBSZWNlaXZlZCBhIGZpbGUgdGhhdCBzaG91bGQgYmUgaW5nb3JlZCBgLCBpbmZvKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZUNoYW5nZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGFuZGxlQ2hhbmdlZCAke2luZm8udnBhdGh9ICR7aW5mby5tZXRhZGF0YSAmJiBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA/IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlIDogJz8/Pyd9YCk7XG5cbiAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpbmZvKTtcbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmZpbmRQYXRoTW91bnRlZChpbmZvLnZwYXRoLCBpbmZvLm1vdW50ZWQpO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICFBcnJheS5pc0FycmF5KHJlc3VsdClcbiAgICAgICAgIHx8IHJlc3VsdC5sZW5ndGggPD0gMFxuICAgICAgICApIHtcbiAgICAgICAgICAgIC8vIEl0IHdhc24ndCBmb3VuZCBpbiB0aGUgZGF0YWJhc2UuXG4gICAgICAgICAgICAvLyBIZW5jZSB3ZSBzaG91bGQgYWRkIGl0LlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlQWRkZWQobmFtZSwgaW5mbyk7XG4gICAgICAgIH1cblxuICAgICAgICBpbmZvLnN0YWNrID0gdW5kZWZpbmVkO1xuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZURvY0luREIoaW5mbyk7XG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmhvb2tGaWxlQ2hhbmdlZChuYW1lLCBpbmZvKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXZSByZWNlaXZlIHRoaXM6XG4gICAgICpcbiAgICAgKiB7XG4gICAgICogICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICogICAgdnBhdGg6IHZwYXRoLFxuICAgICAqICAgIG1pbWU6IG1pbWUuZ2V0VHlwZShmc3BhdGgpLFxuICAgICAqICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAqICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAqICAgIHBhdGhJbk1vdW50ZWQ6IGNvbXB1dGVkIHJlbGF0aXZlIHBhdGhcbiAgICAgKiAgICBzdGFjazogWyBhcnJheSBvZiB0aGVzZSBpbnN0YW5jZXMgXVxuICAgICAqIH1cbiAgICAgKlxuICAgICAqIE5lZWQgdG8gYWRkOlxuICAgICAqICAgIHJlbmRlclBhdGhcbiAgICAgKiAgICBBbmQgZm9yIEhUTUwgcmVuZGVyIGZpbGVzLCBhZGQgdGhlIGJhc2VNZXRhZGF0YSBhbmQgZG9jTWV0YWRhdGFcbiAgICAgKlxuICAgICAqIFNob3VsZCByZW1vdmUgdGhlIHN0YWNrLCBzaW5jZSBpdCdzIGxpa2VseSBub3QgdXNlZnVsIHRvIHVzLlxuICAgICAqL1xuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZUFkZGVkKG5hbWUsIGluZm8pIHtcbiAgICAgICAgLy8gIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlQWRkZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09PT09PR0EhISEgUmVjZWl2ZWQgYSBmaWxlIHRoYXQgc2hvdWxkIGJlIGluZ29yZWQgYCwgaW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVBZGRlZCBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpbmZvKTtcbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnNlcnREb2NUb0RCKGluZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUFkZGVkKG5hbWUsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKGluZm86IFQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnNlcnREb2NUb0RCIG11c3QgYmUgb3ZlcnJpZGRlbmApO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm86IFQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1cGRhdGVEb2NJbkRCIG11c3QgYmUgb3ZlcnJpZGRlbmApO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBoYW5kbGVVbmxpbmtlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlVW5saW5rZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVVbmxpbmtlZCBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVVbmxpbmtlZChuYW1lLCBpbmZvKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bihgXG4gICAgICAgICAgICBERUxFVEUgRlJPTSAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICAgICAgV0hFUkVcbiAgICAgICAgICAgIHZwYXRoID0gJHZwYXRoIEFORCBtb3VudGVkID0gJG1vdW50ZWRcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1vdW50ZWQ6IGluZm8ubW91bnRlZFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gYXdhaXQgdGhpcy4jZGFvLmRlbGV0ZUFsbCh7XG4gICAgICAgIC8vICAgICB2cGF0aDogeyBlcTogaW5mby52cGF0aCB9LFxuICAgICAgICAvLyAgICAgbW91bnRlZDogeyBlcTogaW5mby5tb3VudGVkIH1cbiAgICAgICAgLy8gfSBhcyBXaGVyZTxUPik7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZVJlYWR5KG5hbWUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVSZWFkeWApO1xuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZVJlYWR5IGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jaXNfcmVhZHkgPSB0cnVlO1xuICAgICAgICB0aGlzLmVtaXQoJ3JlYWR5JywgbmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxsb3cgYSBjYWxsZXIgdG8gd2FpdCB1bnRpbCB0aGUgPGVtPnJlYWR5PC9lbT4gZXZlbnQgaGFzXG4gICAgICogYmVlbiBzZW50IGZyb20gdGhlIERpcnNXYXRjaGVyIGluc3RhbmNlLiAgVGhpcyBldmVudCBtZWFucyB0aGVcbiAgICAgKiBpbml0aWFsIGluZGV4aW5nIGhhcyBoYXBwZW5lZC5cbiAgICAgKi9cbiAgICBhc3luYyBpc1JlYWR5KCkge1xuICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIGRpcmVjdG9yaWVzLCB0aGVyZSB3b24ndCBiZSBhbnkgZmlsZXMgXG4gICAgICAgIC8vIHRvIGxvYWQsIGFuZCBubyBuZWVkIHRvIHdhaXRcbiAgICAgICAgd2hpbGUgKHRoaXMuI2RpcnMubGVuZ3RoID4gMCAmJiAhdGhpcy4jaXNfcmVhZHkpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZG9lcyBhIDEwMG1zIHBhdXNlXG4gICAgICAgICAgICAvLyBUaGF0IGxldHMgdXMgY2hlY2sgaXNfcmVhZHkgZXZlcnkgMTAwbXNcbiAgICAgICAgICAgIC8vIGF0IHZlcnkgbGl0dGxlIGNvc3RcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAhaXNSZWFkeSAke3RoaXMubmFtZX0gJHt0aGlzW19zeW1iX2RpcnNdLmxlbmd0aH0gJHt0aGlzW19zeW1iX2lzX3JlYWR5XX1gKTtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBkaXJlY3RvcnkgbW91bnQgY29ycmVzcG9uZGluZyB0byB0aGUgZmlsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgZmlsZURpck1vdW50KGluZm8pIHtcbiAgICAgICAgY29uc3QgbWFwcGVkID0gcmVtYXBkaXJzKHRoaXMuZGlycyk7XG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIG1hcHBlZCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRpck1vdW50IGZvciAke2luZm8udnBhdGh9IC0tICR7dXRpbC5pbnNwZWN0KGluZm8pfSA9PT0gJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgICAgIGlmIChpbmZvLm1vdW50UG9pbnQgPT09IGRpci5tb3VudFBvaW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNob3VsZCB0aGlzIGZpbGUgYmUgaWdub3JlZCwgYmFzZWQgb24gdGhlIGBpZ25vcmVgIGZpZWxkXG4gICAgICogaW4gdGhlIG1hdGNoaW5nIGBkaXJgIG1vdW50IGVudHJ5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBpbmZvXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBpZ25vcmVGaWxlKGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICBjb25zdCBkaXJNb3VudCA9IHRoaXMuZmlsZURpck1vdW50KGluZm8pO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSAke2luZm8udnBhdGh9IGRpck1vdW50ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgbGV0IGlnbm9yZSA9IGZhbHNlO1xuICAgICAgICBpZiAoZGlyTW91bnQpIHtcblxuICAgICAgICAgICAgbGV0IGlnbm9yZXM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRpck1vdW50Lmlnbm9yZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gWyBkaXJNb3VudC5pZ25vcmUgXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkaXJNb3VudC5pZ25vcmUpKSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IGRpck1vdW50Lmlnbm9yZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBpIG9mIGlnbm9yZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAobWljcm9tYXRjaC5pc01hdGNoKGluZm8udnBhdGgsIGkpKSBpZ25vcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkaXJNb3VudC5pZ25vcmUgJHtmc3BhdGh9ICR7aX0gPT4gJHtpZ25vcmV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiAoaWdub3JlKSBjb25zb2xlLmxvZyhgTVVTVCBpZ25vcmUgRmlsZSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSBmb3IgJHtpbmZvLnZwYXRofSA9PT4gJHtpZ25vcmV9YCk7XG4gICAgICAgICAgICByZXR1cm4gaWdub3JlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gbm8gbW91bnQ/ICB0aGF0IG1lYW5zIHNvbWV0aGluZyBzdHJhbmdlXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBObyBkaXJNb3VudCBmb3VuZCBmb3IgJHtpbmZvLnZwYXRofSAvICR7aW5mby5kaXJNb3VudGVkT259YCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBzaW1wbGUgaW5mb3JtYXRpb24gYWJvdXQgZWFjaFxuICAgICAqIHBhdGggaW4gdGhlIGNvbGxlY3Rpb24uICBUaGUgcmV0dXJuXG4gICAgICogdHlwZSBpcyBhbiBhcnJheSBvZiBQYXRoc1JldHVyblR5cGUuXG4gICAgICogXG4gICAgICogSSBmb3VuZCB0d28gdXNlcyBmb3IgdGhpcyBmdW5jdGlvbi5cbiAgICAgKiBJbiBjb3B5QXNzZXRzLCB0aGUgdnBhdGggYW5kIG90aGVyXG4gICAgICogc2ltcGxlIGRhdGEgaXMgdXNlZCBmb3IgY29weWluZyBpdGVtc1xuICAgICAqIHRvIHRoZSBvdXRwdXQgZGlyZWN0b3J5LlxuICAgICAqIEluIHJlbmRlci50cywgdGhlIHNpbXBsZSBmaWVsZHMgYXJlXG4gICAgICogdXNlZCB0byB0aGVuIGNhbGwgZmluZCB0byByZXRyaWV2ZVxuICAgICAqIHRoZSBmdWxsIGluZm9ybWF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHBhdGhzKHJvb3RQYXRoPzogc3RyaW5nKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8UGF0aHNSZXR1cm5UeXBlPj5cbiAgICB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIC8vIFRoaXMgaXMgY29waWVkIGZyb20gdGhlIG9sZGVyIHZlcnNpb25cbiAgICAgICAgLy8gKExva2lKUyB2ZXJzaW9uKSBvZiB0aGlzIGZ1bmN0aW9uLiAgSXRcbiAgICAgICAgLy8gc2VlbXMgbWVhbnQgdG8gZWxpbWluYXRlIGR1cGxpY2F0ZXMuXG4gICAgICAgIGNvbnN0IHZwYXRoc1NlZW4gPSBuZXcgU2V0KCk7XG5cbiAgICAgICAgLy8gU2VsZWN0IHRoZSBmaWVsZHMgaW4gUGF0aHNSZXR1cm5UeXBlXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSAodHlwZW9mIHJvb3RQID09PSAnc3RyaW5nJykgXG4gICAgICAgID8gPGFueVtdPmF3YWl0IHRoaXMuZGIuYWxsKFxuICAgICAgICBgXG4gICAgICAgICAgICBTRUxFQ1RcbiAgICAgICAgICAgICAgICB2cGF0aCwgbWltZSwgbW91bnRlZCwgbW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkLCBtdGltZU1zLFxuICAgICAgICAgICAgICAgIGluZm8sIGZzcGF0aCwgcmVuZGVyUGF0aFxuICAgICAgICAgICAgRlJPTSAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICAgICAgV0hFUkVcbiAgICAgICAgICAgIHJlbmRlclBhdGggTElLRSAkcm9vdFBcbiAgICAgICAgICAgIE9SREVSIEJZIG10aW1lTXMgQVNDXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICRyb290UDogYCR7cm9vdFB9JWBcbiAgICAgICAgfSlcbiAgICAgICAgOiA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoXG4gICAgICAgIGBcbiAgICAgICAgICAgIFNFTEVDVFxuICAgICAgICAgICAgICAgIHZwYXRoLCBtaW1lLCBtb3VudGVkLCBtb3VudFBvaW50LFxuICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQsIG10aW1lTXMsXG4gICAgICAgICAgICAgICAgaW5mbywgZnNwYXRoLCByZW5kZXJQYXRoXG4gICAgICAgICAgICBGUk9NICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICBPUkRFUiBCWSBtdGltZU1zIEFTQ1xuICAgICAgICBgKTtcblxuICAgICAgICBjb25zdCByZXN1bHQyOiBQYXRoc1JldHVyblR5cGVbXVxuICAgICAgICAgICAgICAgID0gbmV3IEFycmF5PFBhdGhzUmV0dXJuVHlwZT4oKTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICAgIGlmIChmY2FjaGUuaWdub3JlRmlsZShpdGVtKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZwYXRoc1NlZW4uaGFzKChpdGVtIGFzIFQpLnZwYXRoKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2cGF0aHNTZWVuLmFkZCgoaXRlbSBhcyBUKS52cGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS5taW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5taW1lID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfSA9XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVQYXRoc1JldHVyblR5cGUoaXRlbSk7XG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUEFUSFMgVkFMSURBVElPTiAke3V0aWwuaW5zcGVjdChpdGVtKX1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQyLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcmVzdWx0MjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBmaWxlIHdpdGhpbiB0aGUgY2FjaGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFRoZSB2cGF0aCBvciByZW5kZXJQYXRoIHRvIGxvb2sgZm9yXG4gICAgICogQHJldHVybnMgYm9vbGVhbiB0cnVlIGlmIGZvdW5kLCBmYWxzZSBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBhc3luYyBmaW5kKF9mcGF0aCk6IFByb21pc2U8VCB8IHVuZGVmaW5lZD4ge1xuXG4gICAgICAgIGlmICh0eXBlb2YgX2ZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaW5kIHBhcmFtZXRlciBub3Qgc3RyaW5nICR7dHlwZW9mIF9mcGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBjb25zdCByZXN1bHQxID0gYXdhaXQgdGhpcy5maW5kQnlQYXRoKGZwYXRoKTtcblxuICAgICAgICAvLyBjb25zdCByZXN1bHQxID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgLy8gICAgIG9yOiBbXG4gICAgICAgIC8vICAgICAgICAgeyB2cGF0aDogeyBlcTogZnBhdGggfX0sXG4gICAgICAgIC8vICAgICAgICAgeyByZW5kZXJQYXRoOiB7IGVxOiBmcGF0aCB9fVxuICAgICAgICAvLyAgICAgXVxuICAgICAgICAvLyB9IGFzIEZpbHRlcjxUPik7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmQgJHtfZnBhdGh9ICR7ZnBhdGh9ID09PiByZXN1bHQxICR7dXRpbC5pbnNwZWN0KHJlc3VsdDEpfSBgKTtcblxuICAgICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0MS5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gIShmY2FjaGUuaWdub3JlRmlsZShpdGVtKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdDIpIHtcbiAgICAgICAgLy8gICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEocmVzdWx0KTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kICR7X2ZwYXRofSAke2ZwYXRofSA9PT4gcmVzdWx0MiAke3V0aWwuaW5zcGVjdChyZXN1bHQyKX0gYCk7XG5cbiAgICAgICAgbGV0IHJldDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0MikgJiYgcmVzdWx0Mi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXQgPSByZXN1bHQyWzBdO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0MikgJiYgcmVzdWx0Mi5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgcmV0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0ID0gcmVzdWx0MjtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmV0KSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZTogVCA9IHRoaXMuY3Z0Um93VG9PYmooXG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0ZVJvdyhyZXQpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBST0JMRU06XG4gICAgICAgIC8vIHRoZSBtZXRhZGF0YSwgZG9jTWV0YWRhdGEsIGJhc2VNZXRhZGF0YSxcbiAgICAgICAgLy8gYW5kIGluZm8gZmllbGRzLCBhcmUgc3RvcmVkIGluXG4gICAgICAgIC8vIHRoZSBkYXRhYmFzZSBhcyBzdHJpbmdzLCBidXQgbmVlZFxuICAgICAgICAvLyB0byBiZSB1bnBhY2tlZCBpbnRvIG9iamVjdHMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFVzaW5nIHZhbGlkYXRlUm93IG9yIHZhbGlkYXRlUm93cyBpc1xuICAgICAgICAvLyB1c2VmdWwsIGJ1dCBkb2VzIG5vdCBjb252ZXJ0IHRob3NlXG4gICAgICAgIC8vIGZpZWxkcy5cbiAgICB9XG5cbiAgICAjZkV4aXN0c0luRGlyKGZwYXRoLCBkaXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYCNmRXhpc3RzSW5EaXIgJHtmcGF0aH0gJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgaWYgKGRpci5tb3VudFBvaW50ID09PSAnLycpIHtcbiAgICAgICAgICAgIGNvbnN0IGZzcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBkaXIubW91bnRlZCwgZnBhdGhcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsZXQgZnNleGlzdHMgPSBGUy5leGlzdHNTeW5jKGZzcGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChmc2V4aXN0cykge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IEZTLnN0YXRTeW5jKGZzcGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxWUGF0aERhdGE+IHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLm1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogc3RhdHMubXRpbWVNc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbXAgPSBkaXIubW91bnRQb2ludC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gZGlyLm1vdW50UG9pbnQuc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IGRpci5tb3VudFBvaW50O1xuICAgICAgICBtcCA9IG1wLmVuZHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gbXBcbiAgICAgICAgICAgIDogKG1wKycvJyk7XG5cbiAgICAgICAgaWYgKGZwYXRoLnN0YXJ0c1dpdGgobXApKSB7XG4gICAgICAgICAgICBsZXQgcGF0aEluTW91bnRlZFxuICAgICAgICAgICAgICAgID0gZnBhdGgucmVwbGFjZShkaXIubW91bnRQb2ludCwgJycpO1xuICAgICAgICAgICAgbGV0IGZzcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBkaXIubW91bnRlZCwgcGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ2hlY2tpbmcgZXhpc3QgZm9yICR7ZGlyLm1vdW50UG9pbnR9ICR7ZGlyLm1vdW50ZWR9ICR7cGF0aEluTW91bnRlZH0gJHtmc3BhdGh9YCk7XG4gICAgICAgICAgICBsZXQgZnNleGlzdHMgPSBGUy5leGlzdHNTeW5jKGZzcGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChmc2V4aXN0cykge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IEZTLnN0YXRTeW5jKGZzcGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxWUGF0aERhdGE+IHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLm1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBzdGF0cy5tdGltZU1zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRnVsZmlsbHMgdGhlIFwiZmluZFwiIG9wZXJhdGlvbiBub3QgYnlcbiAgICAgKiBsb29raW5nIGluIHRoZSBkYXRhYmFzZSwgYnV0IGJ5IHNjYW5uaW5nXG4gICAgICogdGhlIGZpbGVzeXN0ZW0gdXNpbmcgc3luY2hyb25vdXMgY2FsbHMuXG4gICAgICogXG4gICAgICogTk9URTogVGhpcyBpcyB1c2VkIGluIHBhcnRpYWxTeW5jXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGZpbmRTeW5jKF9mcGF0aCk6IFZQYXRoRGF0YSB8IHVuZGVmaW5lZCB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfZnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmQgcGFyYW1ldGVyIG5vdCBzdHJpbmcgJHt0eXBlb2YgX2ZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZFN5bmMgbG9va2luZyBmb3IgJHtmcGF0aH0gaW4gJHt1dGlsLmluc3BlY3QobWFwcGVkKX1gKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiBtYXBwZWQpIHtcbiAgICAgICAgICAgIGlmICghKGRpcj8ubW91bnRQb2ludCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYGZpbmRTeW5jIGJhZCBkaXJzIGluICR7dXRpbC5pbnNwZWN0KHRoaXMuZGlycyl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmb3VuZCA9IHRoaXMuI2ZFeGlzdHNJbkRpcihmcGF0aCwgZGlyKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kU3luYyAke2ZwYXRofSBmb3VuZGAsIGZvdW5kKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0c0NhY2hlXG4gICAgICAgIGV4dGVuZHMgQmFzZUNhY2hlPEFzc2V0PiB7XG4gICAgXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93KHJvdzogYW55KTogQXNzZXQge1xuICAgICAgICBjb25zdCB7IGVycm9yLCB2YWx1ZSB9ID0gdmFsaWRhdGVBc3NldChyb3cpO1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZXJyb3IoYEFTU0VUIFZBTElEQVRJT04gRVJST1IgZm9yYCwgcm93KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9IGVsc2UgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvd3Mocm93czogYW55W10pOiBBc3NldFtdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFzc2V0c0NhY2hlIHZhbGlkYXRlUm93cyBtdXN0IGJlIGdpdmVuIGFuIGFycmF5YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IEFycmF5PEFzc2V0PigpO1xuICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICByZXQucHVzaCh0aGlzLnZhbGlkYXRlUm93KHJvdykpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoocm93OiBhbnkpOiBBc3NldCB7XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuaW5mbyA9IEpTT04ucGFyc2Uocm93LmluZm8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8QXNzZXQ+cm93O1xuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm86IEFzc2V0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgKDxhbnk+aW5mbykuc3RhdHNNdGltZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGluZm8ubXRpbWVNcyA9ICg8YW55PmluZm8pLnN0YXRzTXRpbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluZm8ubWltZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgaW5mby5taW1lID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoXG4gICAgICAgIGluZm86IEFzc2V0XG4gICAgKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKGBcbiAgICAgICAgICAgIElOU0VSVCBJTlRPICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgbWltZSxcbiAgICAgICAgICAgICAgICBtb3VudGVkLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICBmc3BhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZSxcbiAgICAgICAgICAgICAgICBtdGltZU1zLFxuICAgICAgICAgICAgICAgIGluZm9cbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIFZBTFVFU1xuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICR2cGF0aCxcbiAgICAgICAgICAgICAgICAkbWltZSxcbiAgICAgICAgICAgICAgICAkbW91bnRlZCxcbiAgICAgICAgICAgICAgICAkbW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAkcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAkZnNwYXRoLFxuICAgICAgICAgICAgICAgICRkaXJuYW1lLFxuICAgICAgICAgICAgICAgICRtdGltZU1zLFxuICAgICAgICAgICAgICAgICRpbmZvXG4gICAgICAgICAgICApXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbylcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoaW5mbzogQXNzZXQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYFxuICAgICAgICAgICAgVVBEQVRFICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICBTRVQgXG4gICAgICAgICAgICAgICAgbWltZSA9ICRtaW1lLFxuICAgICAgICAgICAgICAgIG1vdW50ZWQgPSAkbW91bnRlZCxcbiAgICAgICAgICAgICAgICBtb3VudFBvaW50ID0gJG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCA9ICRwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgIGZzcGF0aCA9ICRmc3BhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZSA9ICRkaXJuYW1lLFxuICAgICAgICAgICAgICAgIG10aW1lTXMgPSAkbXRpbWVNcyxcbiAgICAgICAgICAgICAgICBpbmZvID0gJGluZm9cbiAgICAgICAgICAgIFdIRVJFXG4gICAgICAgICAgICAgICAgdnBhdGggPSAkdnBhdGhcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKVxuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnRpYWxzQ2FjaGVcbiAgICAgICAgZXh0ZW5kcyBCYXNlQ2FjaGU8UGFydGlhbD4ge1xuICAgIFxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvdyhyb3c6IGFueSk6IFBhcnRpYWwge1xuICAgICAgICBjb25zdCB7IGVycm9yLCB2YWx1ZSB9ID0gdmFsaWRhdGVQYXJ0aWFsKHJvdyk7XG4gICAgICAgIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XG4gICAgICAgIGVsc2UgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvd3Mocm93czogYW55W10pOiBQYXJ0aWFsW10ge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocm93cykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUGFydGlhbHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxQYXJ0aWFsPigpO1xuICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICByZXQucHVzaCh0aGlzLnZhbGlkYXRlUm93KHJvdykpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoocm93OiBhbnkpOiBQYXJ0aWFsIHtcbiAgICAgICAgaWYgKHR5cGVvZiByb3cuaW5mbyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJvdy5pbmZvID0gSlNPTi5wYXJzZShyb3cuaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDxQYXJ0aWFsPnJvdztcbiAgICB9XG5cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm86IFBhcnRpYWwpIHtcblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodHlwZW9mICg8YW55PmluZm8pLnN0YXRzTXRpbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpbmZvLm10aW1lTXMgPSAoPGFueT5pbmZvKS5zdGF0c010aW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbmZvLm1pbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGluZm8ubWltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgICAgIGluZm8ucmVuZGVyZXJOYW1lID0gcmVuZGVyZXIubmFtZTtcblxuICAgICAgICAgICAgaWYgKHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEpIHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJjID0gcmVuZGVyZXIucGFyc2VNZXRhZGF0YSg8YW55PntcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBpbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogRlMucmVhZEZpbGVTeW5jKGluZm8uZnNwYXRoLCAndXRmLTgnKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKFxuICAgICAgICBpbmZvOiBQYXJ0aWFsXG4gICAgKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGIucnVuKGBcbiAgICAgICAgICAgIElOU0VSVCBJTlRPICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgbWltZSxcbiAgICAgICAgICAgICAgICBtb3VudGVkLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICBmc3BhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZSxcbiAgICAgICAgICAgICAgICBtdGltZU1zLFxuICAgICAgICAgICAgICAgIGluZm8sXG5cbiAgICAgICAgICAgICAgICBkb2NCb2R5LFxuICAgICAgICAgICAgICAgIHJlbmRlcmVyTmFtZVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgVkFMVUVTXG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgJHZwYXRoLFxuICAgICAgICAgICAgICAgICRtaW1lLFxuICAgICAgICAgICAgICAgICRtb3VudGVkLFxuICAgICAgICAgICAgICAgICRtb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICRmc3BhdGgsXG4gICAgICAgICAgICAgICAgJGRpcm5hbWUsXG4gICAgICAgICAgICAgICAgJG10aW1lTXMsXG4gICAgICAgICAgICAgICAgJGluZm8sXG5cbiAgICAgICAgICAgICAgICAkZG9jQm9keSxcbiAgICAgICAgICAgICAgICAkcmVuZGVyZXJOYW1lXG4gICAgICAgICAgICApXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihcbiAgICAgICAgaW5mbzogUGFydGlhbFxuICAgICkge1xuICAgICAgICBhd2FpdCB0aGlzLmRiLnJ1bihgXG4gICAgICAgICAgICBVUERBVEUgJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIFNFVCBcbiAgICAgICAgICAgICAgICBtaW1lID0gJG1pbWUsXG4gICAgICAgICAgICAgICAgbW91bnRlZCA9ICRtb3VudGVkLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQgPSAkbW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkID0gJHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgZnNwYXRoID0gJGZzcGF0aCxcbiAgICAgICAgICAgICAgICBkaXJuYW1lID0gJGRpcm5hbWUsXG4gICAgICAgICAgICAgICAgbXRpbWVNcyA9ICRtdGltZU1zLFxuICAgICAgICAgICAgICAgIGluZm8gPSAkaW5mbyxcblxuICAgICAgICAgICAgICAgIGRvY0JvZHkgPSAkZG9jQm9keSxcbiAgICAgICAgICAgICAgICByZW5kZXJlck5hbWUgPSAkcmVuZGVyZXJOYW1lXG4gICAgICAgICAgICBXSEVSRVxuICAgICAgICAgICAgICAgIHZwYXRoID0gJHZwYXRoXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIExheW91dHNDYWNoZVxuICAgICAgICBleHRlbmRzIEJhc2VDYWNoZTxMYXlvdXQ+IHtcbiAgICBcbiAgICBwcm90ZWN0ZWQgdmFsaWRhdGVSb3cocm93OiBhbnkpOiBMYXlvdXQge1xuICAgICAgICBjb25zdCB7IGVycm9yLCB2YWx1ZSB9ID0gdmFsaWRhdGVMYXlvdXQocm93KTtcbiAgICAgICAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcjtcbiAgICAgICAgZWxzZSByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHZhbGlkYXRlUm93cyhyb3dzOiBhbnlbXSk6IExheW91dFtdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYExheW91dHNDYWNoZSB2YWxpZGF0ZVJvd3MgbXVzdCBiZSBnaXZlbiBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBBcnJheTxMYXlvdXQ+KCk7XG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICAgIHJldC5wdXNoKHRoaXMudmFsaWRhdGVSb3cocm93KSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihyb3c6IGFueSk6IExheW91dCB7XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmluZm8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuaW5mbyA9IEpTT04ucGFyc2Uocm93LmluZm8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8TGF5b3V0PnJvdztcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBMYXlvdXQpIHtcblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodHlwZW9mICg8YW55PmluZm8pLnN0YXRzTXRpbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpbmZvLm10aW1lTXMgPSAoPGFueT5pbmZvKS5zdGF0c010aW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbmZvLm1pbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGluZm8ubWltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgICAgIGluZm8ucmVuZGVyZXJOYW1lID0gcmVuZGVyZXIubmFtZTtcblxuICAgICAgICAgICAgY29uc3QgcmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby52cGF0aCk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9XG4gICAgICAgICAgICAgICAgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKiovKi5odG1sJylcbiAgICAgICAgICAgICB8fCBtaWNyb21hdGNoLmlzTWF0Y2goXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqLmh0bWwnKVxuICAgICAgICAgICAgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcnNUb0hUTUwgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKFxuICAgICAgICBpbmZvOiBMYXlvdXRcbiAgICApIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYFxuICAgICAgICAgICAgSU5TRVJUIElOVE8gJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICBtaW1lLFxuICAgICAgICAgICAgICAgIG1vdW50ZWQsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgIGZzcGF0aCxcbiAgICAgICAgICAgICAgICBkaXJuYW1lLFxuICAgICAgICAgICAgICAgIG10aW1lTXMsXG4gICAgICAgICAgICAgICAgaW5mbyxcblxuICAgICAgICAgICAgICAgIHJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAgICAgZG9jQm9keSxcbiAgICAgICAgICAgICAgICByZW5kZXJlck5hbWVcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIFZBTFVFU1xuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICR2cGF0aCxcbiAgICAgICAgICAgICAgICAkbWltZSxcbiAgICAgICAgICAgICAgICAkbW91bnRlZCxcbiAgICAgICAgICAgICAgICAkbW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAkcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAkZnNwYXRoLFxuICAgICAgICAgICAgICAgICRkaXJuYW1lLFxuICAgICAgICAgICAgICAgICRtdGltZU1zLFxuICAgICAgICAgICAgICAgICRpbmZvLFxuXG4gICAgICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAgICAgJGRvY0JvZHksXG4gICAgICAgICAgICAgICAgJHJlbmRlcmVyTmFtZVxuICAgICAgICAgICAgKVxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgJG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgICRtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAkcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgJGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgICRkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCksXG4gICAgICAgICAgICAkbXRpbWVNczogaW5mby5tdGltZU1zLFxuICAgICAgICAgICAgJGluZm86IEpTT04uc3RyaW5naWZ5KGluZm8pLFxuXG4gICAgICAgICAgICAkcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgJGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgICRyZW5kZXJlck5hbWU6IGluZm8ucmVuZGVyZXJOYW1lXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKFxuICAgICAgICBpbmZvOiBMYXlvdXRcbiAgICApIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYFxuICAgICAgICAgICAgVVBEQVRFICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICBTRVQgXG4gICAgICAgICAgICAgICAgbWltZSA9ICRtaW1lLFxuICAgICAgICAgICAgICAgIG1vdW50ZWQgPSAkbW91bnRlZCxcbiAgICAgICAgICAgICAgICBtb3VudFBvaW50ID0gJG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCA9ICRwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgIGZzcGF0aCA9ICRmc3BhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZSA9ICRkaXJuYW1lLFxuICAgICAgICAgICAgICAgIG10aW1lTXMgPSAkbXRpbWVNcyxcbiAgICAgICAgICAgICAgICBpbmZvID0gJGluZm8sXG5cbiAgICAgICAgICAgICAgICByZW5kZXJzVG9IVE1MID0gJHJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAgICAgZG9jQm9keSA9ICRkb2NCb2R5LFxuICAgICAgICAgICAgICAgIHJlbmRlcmVyTmFtZSA9ICRyZW5kZXJlck5hbWVcbiAgICAgICAgICAgIFdIRVJFXG4gICAgICAgICAgICAgICAgdnBhdGggPSAkdnBhdGhcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICRmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICAkZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpLFxuICAgICAgICAgICAgJG10aW1lTXM6IGluZm8ubXRpbWVNcyxcbiAgICAgICAgICAgICRpbmZvOiBKU09OLnN0cmluZ2lmeShpbmZvKSxcblxuICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEb2N1bWVudHNDYWNoZVxuICAgICAgICBleHRlbmRzIEJhc2VDYWNoZTxEb2N1bWVudD4ge1xuICAgIFxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvdyhyb3c6IGFueSk6IERvY3VtZW50IHtcbiAgICAgICAgY29uc3QgeyBlcnJvciwgdmFsdWUgfVxuICAgICAgICAgICAgICAgICAgICA9IHZhbGlkYXRlRG9jdW1lbnQocm93KTtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBET0NVTUVOVCBWQUxJREFUSU9OIEVSUk9SIGZvciAke3V0aWwuaW5zcGVjdChyb3cpfWAsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9IGVsc2UgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCB2YWxpZGF0ZVJvd3Mocm93czogYW55W10pOiBEb2N1bWVudFtdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0NhY2hlIHZhbGlkYXRlUm93cyBtdXN0IGJlIGdpdmVuIGFuIGFycmF5YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IEFycmF5PERvY3VtZW50PigpO1xuICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICByZXQucHVzaCh0aGlzLnZhbGlkYXRlUm93KHJvdykpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoocm93OiBhbnkpOiBEb2N1bWVudCB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBEb2N1bWVudHMgY3Z0Um93VG9PYmpgLCByb3cpO1xuICAgICAgICBpZiAodHlwZW9mIHJvdy5pbmZvID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmluZm8gPSBKU09OLnBhcnNlKHJvdy5pbmZvKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJvdy5iYXNlTWV0YWRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cuYmFzZU1ldGFkYXRhXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy5iYXNlTWV0YWRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygcm93LmRvY01ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgPSBKU09OLnBhcnNlKHJvdy5kb2NNZXRhZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiByb3cubWV0YWRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByb3cubWV0YWRhdGFcbiAgICAgICAgICAgICAgICA9IEpTT04ucGFyc2Uocm93Lm1ldGFkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJvdy50YWdzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcm93LnRhZ3NcbiAgICAgICAgICAgICAgICA9IEpTT04ucGFyc2Uocm93LnRhZ3MpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8RG9jdW1lbnQ+cm93O1xuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm86IERvY3VtZW50KSB7XG5cbiAgICAgICAgaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgaW5mby5kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAoaW5mby5kaXJuYW1lID09PSAnLicpIGluZm8uZGlybmFtZSA9ICcvJztcbiAgICAgICAgaW5mby5wYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoaW5mby5kaXJuYW1lKTtcblxuICAgICAgICAvLyBmaW5kIHRoZSBtb3VudGVkIGRpcmVjdG9yeSxcbiAgICAgICAgLy8gZ2V0IHRoZSBiYXNlTWV0YWRhdGFcbiAgICAgICAgZm9yIChsZXQgZGlyIG9mIHJlbWFwZGlycyh0aGlzLmRpcnMpKSB7XG4gICAgICAgICAgICBpZiAoZGlyLm1vdW50ZWQgPT09IGluZm8ubW91bnRlZCkge1xuICAgICAgICAgICAgICAgIGlmIChkaXIuYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8uYmFzZU1ldGFkYXRhID0gZGlyLmJhc2VNZXRhZGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mICg8YW55PmluZm8pLnN0YXRzTXRpbWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBpbmZvLm10aW1lTXMgPSAoPGFueT5pbmZvKS5zdGF0c010aW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbmZvLm1pbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGluZm8ubWltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgICAgIGluZm8ucmVuZGVyZXJOYW1lID0gcmVuZGVyZXIubmFtZTtcblxuICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoXG4gICAgICAgICAgICAgICAgPSByZW5kZXJlci5maWxlUGF0aChpbmZvLnZwYXRoKTtcblxuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID1cbiAgICAgICAgICAgICAgICBtaWNyb21hdGNoLmlzTWF0Y2goXG4gICAgICAgICAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgJyoqLyouaHRtbCcpXG4gICAgICAgICAgICAgfHwgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqLmh0bWwnKVxuICAgICAgICAgICAgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY01ldGFkYXRhIGlzIHRoZSB1bm1vZGlmaWVkIG1ldGFkYXRhL2Zyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YSA9IHJjLm1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQgaXMgdGhlIHVucGFyc2VkIG9yaWdpbmFsIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAvLyBpbmNsdWRpbmcgYW55IGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NDb250ZW50ID0gcmMuY29udGVudDtcbiAgICAgICAgICAgICAgICAvLyBkb2NCb2R5IGlzIHRoZSBwYXJzZWQgYm9keSAtLSBlLmcuIGZvbGxvd2luZyB0aGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSByYy5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY29tcHV0ZWQgbWV0YWRhdGEgdGhhdCBpbmNsdWRlcyBkYXRhIGZyb20gXG4gICAgICAgICAgICAgICAgLy8gc2V2ZXJhbCBzb3VyY2VzXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YSA9IHsgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8uZG9jTWV0YWRhdGEpIGluZm8uZG9jTWV0YWRhdGEgPSB7fTtcblxuICAgICAgICAgICAgICAgIC8vIFRoZSByZXN0IG9mIHRoaXMgaXMgYWRhcHRlZCBmcm9tIHRoZSBvbGQgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAvLyBIVE1MUmVuZGVyZXIubmV3SW5pdE1ldGFkYXRhXG5cbiAgICAgICAgICAgICAgICAvLyBGb3Igc3RhcnRlcnMgdGhlIG1ldGFkYXRhIGlzIGNvbGxlY3RlZCBmcm9tIHNldmVyYWwgc291cmNlcy5cbiAgICAgICAgICAgICAgICAvLyAxKSB0aGUgbWV0YWRhdGEgc3BlY2lmaWVkIGluIHRoZSBkaXJlY3RvcnkgbW91bnQgd2hlcmVcbiAgICAgICAgICAgICAgICAvLyAgICB0aGlzIGRvY3VtZW50IHdhcyBmb3VuZFxuICAgICAgICAgICAgICAgIC8vIDIpIG1ldGFkYXRhIGluIHRoZSBwcm9qZWN0IGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgICAgICAvLyAzKSB0aGUgbWV0YWRhdGEgaW4gdGhlIGRvY3VtZW50LCBhcyBjYXB0dXJlZCBpbiBkb2NNZXRhZGF0YVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gaW5mby5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGluaXRNZXRhZGF0YSAke2Jhc2VkaXJ9ICR7ZnBhdGh9IGJhc2VNZXRhZGF0YSAke2Jhc2VNZXRhZGF0YVt5cHJvcF19YCk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5iYXNlTWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiB0aGlzLmNvbmZpZy5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IHRoaXMuY29uZmlnLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgZm1tY291bnQgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uZG9jTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSBpbmZvLmRvY01ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgZm1tY291bnQrKztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcmVuZGVyZWQgdmVyc2lvbiBvZiB0aGUgY29udGVudCBsYW5kcyBoZXJlXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5jb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAvLyBUaGUgZG9jdW1lbnQgb2JqZWN0IGhhcyBiZWVuIHVzZWZ1bCBmb3IgXG4gICAgICAgICAgICAgICAgLy8gY29tbXVuaWNhdGluZyB0aGUgZmlsZSBwYXRoIGFuZCBvdGhlciBkYXRhLlxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQgPSB7fTtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LmJhc2VkaXIgPSBpbmZvLm1vdW50UG9pbnQ7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZWxwYXRoID0gaW5mby5wYXRoSW5Nb3VudGVkO1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscmVuZGVyID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby5wYXRoSW5Nb3VudGVkKTtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8gPSBpbmZvLnJlbmRlclBhdGg7XG5cbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgdGhlIDxlbT50YWdzPC9lbT4gZmllbGQgaXMgYW4gYXJyYXlcbiAgICAgICAgICAgICAgICBpZiAoIShpbmZvLm1ldGFkYXRhLnRhZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyA9IFtdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIChpbmZvLm1ldGFkYXRhLnRhZ3MpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGFnbGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZSA9IC9cXHMqLFxccyovO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3Muc3BsaXQocmUpLmZvckVhY2godGFnID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ2xpc3QucHVzaCh0YWcudHJpbSgpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyA9IHRhZ2xpc3Q7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghQXJyYXkuaXNBcnJheShpbmZvLm1ldGFkYXRhLnRhZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGBGT1JNQVQgRVJST1IgLSAke2luZm8udnBhdGh9IGhhcyBiYWRseSBmb3JtYXR0ZWQgdGFncyBgLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YS50YWdzID0gaW5mby5tZXRhZGF0YS50YWdzO1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJvb3QgVVJMIGZvciB0aGUgcHJvamVjdFxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucm9vdF91cmwgPSB0aGlzLmNvbmZpZy5yb290X3VybDtcblxuICAgICAgICAgICAgICAgIC8vIENvbXB1dGUgdGhlIFVSTCB0aGlzIGRvY3VtZW50IHdpbGwgcmVuZGVyIHRvXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLnJvb3RfdXJsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB1Um9vdFVybCA9IG5ldyBVUkwodGhpcy5jb25maWcucm9vdF91cmwsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgICAgICAgICAgdVJvb3RVcmwucGF0aG5hbWUgPSBwYXRoLm5vcm1hbGl6ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4odVJvb3RVcmwucGF0aG5hbWUsIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfdXJsID0gdVJvb3RVcmwudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX3VybCA9IGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG87XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gaW5mby5tZXRhZGF0YS5yZW5kZXJlZF9kYXRlID0gaW5mby5zdGF0cy5tdGltZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlUHVibERhdGUgPSAoZGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBEYXRlLnBhcnNlKGRhdGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoISBpc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGVTZXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICYmIGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoISBkYXRlU2V0ICYmIGluZm8ubXRpbWVNcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG5ldyBEYXRlKGluZm8ubXRpbWVNcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IGluZm8ubXRpbWVNcztcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2luZm8udnBhdGh9IG1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSAke2luZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlfSBzZXQgZnJvbSBzdGF0cy5tdGltZWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gY3VycmVudCB0aW1lYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcnNUb0hUTUwgPSBmYWxzZTtcbiAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEgPSB7fTtcbiAgICAgICAgICAgIGluZm8uZG9jQm9keSA9ICcnO1xuICAgICAgICAgICAgaW5mby5kb2NDb250ZW50ID0gJyc7XG4gICAgICAgICAgICBpbmZvLnJlbmRlcmVyTmFtZSA9ICcnO1xuICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSAwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTk9URTogQ2VydGFpbiBmaWVsZHMgYXJlIG5vdCBoYW5kbGVkXG4gICAgLy8gaGVyZSBiZWNhdXNlIHRoZXkncmUgR0VORVJBVEVEIGZyb21cbiAgICAvLyBKU09OIGRhdGEuXG4gICAgLy9cbiAgICAvLyAgICAgIHB1YmxpY2F0aW9uVGltZVxuICAgIC8vICAgICAgYmFzZU1ldGFkYXRhXG4gICAgLy8gICAgICBtZXRhZGF0YVxuICAgIC8vICAgICAgdGFnc1xuICAgIC8vICAgICAgbGF5b3V0XG4gICAgLy8gICAgICBibG9ndGFnXG4gICAgLy9cbiAgICAvLyBUaG9zZSBmaWVsZHMgYXJlIG5vdCB0b3VjaGVkIGJ5XG4gICAgLy8gdGhlIGluc2VydC91cGRhdGUgZnVuY3Rpb25zIGJlY2F1c2VcbiAgICAvLyBTUUxJVEUzIHRha2VzIGNhcmUgb2YgaXQuXG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICApIHtcbiAgICAgICAgLy8gbGV0IG10aW1lO1xuICAgICAgICAvLyBpZiAodHlwZW9mIGluZm8ubXRpbWVNcyA9PT0gJ251bWJlcidcbiAgICAgICAgLy8gIHx8IHR5cGVvZiBpbmZvLm10aW1lTXMgPT09ICdzdHJpbmcnXG4gICAgICAgIC8vICkge1xuICAgICAgICAvLyAgICAgbXRpbWUgPSBuZXcgRGF0ZShpbmZvLm10aW1lTXMpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgY29uc3QgdG9JbnNlcnQgPSB7XG4gICAgICAgICAgICAkdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICAkbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgJG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgICRtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAkcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgJGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgICRkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCksXG4gICAgICAgICAgICAkbXRpbWVNczogaW5mby5tdGltZU1zLFxuICAgICAgICAgICAgJGluZm86IEpTT04uc3RyaW5naWZ5KGluZm8pLFxuICAgICAgICAgICAgJHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICRyZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAkcGFyZW50RGlyOiBpbmZvLnBhcmVudERpcixcbiAgICAgICAgICAgICRkb2NNZXRhZGF0YTogSlNPTi5zdHJpbmdpZnkoaW5mby5kb2NNZXRhZGF0YSksXG4gICAgICAgICAgICAkZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgJGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgICRyZW5kZXJlck5hbWU6IGluZm8ucmVuZGVyZXJOYW1lXG4gICAgICAgIH07XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRvSW5zZXJ0KTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYFxuICAgICAgICAgICAgSU5TRVJUIElOVE8gJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICBtaW1lLFxuICAgICAgICAgICAgICAgIG1vdW50ZWQsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgIGZzcGF0aCxcbiAgICAgICAgICAgICAgICBkaXJuYW1lLFxuICAgICAgICAgICAgICAgIG10aW1lTXMsXG4gICAgICAgICAgICAgICAgaW5mbyxcblxuXG4gICAgICAgICAgICAgICAgcmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICByZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgICAgIHBhcmVudERpcixcbiAgICAgICAgICAgICAgICBkb2NNZXRhZGF0YSxcbiAgICAgICAgICAgICAgICBkb2NDb250ZW50LFxuICAgICAgICAgICAgICAgIGRvY0JvZHksXG4gICAgICAgICAgICAgICAgcmVuZGVyZXJOYW1lXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBWQUxVRVNcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAkdnBhdGgsXG4gICAgICAgICAgICAgICAgJG1pbWUsXG4gICAgICAgICAgICAgICAgJG1vdW50ZWQsXG4gICAgICAgICAgICAgICAgJG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgJHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgJGZzcGF0aCxcbiAgICAgICAgICAgICAgICAkZGlybmFtZSxcbiAgICAgICAgICAgICAgICAkbXRpbWVNcyxcbiAgICAgICAgICAgICAgICAkaW5mbyxcblxuXG4gICAgICAgICAgICAgICAgJHJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgJHJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICAgICAgJHBhcmVudERpcixcbiAgICAgICAgICAgICAgICAkZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgJGRvY0NvbnRlbnQsXG4gICAgICAgICAgICAgICAgJGRvY0JvZHksXG4gICAgICAgICAgICAgICAgJHJlbmRlcmVyTmFtZVxuICAgICAgICAgICAgKVxuICAgICAgICBgLCB0b0luc2VydCk7XG4gICAgICAgIC8vIGF3YWl0IHRoaXMuZGFvLmluc2VydChkb2NJbmZvKTtcbiAgICAgICAgaWYgKGluZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYWRkRG9jVGFnR2x1ZShcbiAgICAgICAgICAgICAgICBpbmZvLnZwYXRoLCBpbmZvLm1ldGFkYXRhLnRhZ3NcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihcbiAgICAgICAgaW5mbzogRG9jdW1lbnRcbiAgICApIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYi5ydW4oYFxuICAgICAgICAgICAgVVBEQVRFICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICBTRVQgXG4gICAgICAgICAgICAgICAgbWltZSA9ICRtaW1lLFxuICAgICAgICAgICAgICAgIG1vdW50ZWQgPSAkbW91bnRlZCxcbiAgICAgICAgICAgICAgICBtb3VudFBvaW50ID0gJG1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCA9ICRwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgIGZzcGF0aCA9ICRmc3BhdGgsXG4gICAgICAgICAgICAgICAgZGlybmFtZSA9ICRkaXJuYW1lLFxuICAgICAgICAgICAgICAgIG10aW1lTXMgPSAkbXRpbWVNcyxcbiAgICAgICAgICAgICAgICBpbmZvID0gJGluZm8sXG5cbiAgICAgICAgICAgICAgICByZW5kZXJQYXRoID0gJHJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgcmVuZGVyc1RvSFRNTCA9ICRyZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgICAgIHBhcmVudERpciA9ICRwYXJlbnREaXIsXG4gICAgICAgICAgICAgICAgZG9jTWV0YWRhdGEgPSAkZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgZG9jQ29udGVudCA9ICRkb2NDb250ZW50LFxuICAgICAgICAgICAgICAgIGRvY0JvZHkgPSAkZG9jQm9keSxcbiAgICAgICAgICAgICAgICByZW5kZXJlck5hbWUgPSAkcmVuZGVyZXJOYW1lXG4gICAgICAgICAgICBXSEVSRVxuICAgICAgICAgICAgICAgIHZwYXRoID0gJHZwYXRoXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgJG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKSxcbiAgICAgICAgICAgICRtdGltZU1zOiBpbmZvLm10aW1lTXMsXG4gICAgICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbyksXG5cbiAgICAgICAgICAgICRyZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAkcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgJHBhcmVudERpcjogaW5mby5wYXJlbnREaXIsXG4gICAgICAgICAgICAkZG9jTWV0YWRhdGE6IEpTT04uc3RyaW5naWZ5KGluZm8uZG9jTWV0YWRhdGEpLFxuICAgICAgICAgICAgJGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICAkcmVuZGVyZXJOYW1lOiBpbmZvLnJlbmRlcmVyTmFtZVxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgdGdsdWUuZGVsZXRlVGFnR2x1ZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8ubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIGF3YWl0IHRnbHVlLmFkZFRhZ0dsdWUoaW5mby52cGF0aCwgaW5mby5tZXRhZGF0YS50YWdzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBkZWxldGVEb2NUYWdHbHVlKHZwYXRoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0Z2x1ZS5kZWxldGVUYWdHbHVlKHZwYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBpZ25vcmVcbiAgICAgICAgICAgIC8vIFRoaXMgY2FuIHRocm93IGFuIGVycm9yIGxpa2U6XG4gICAgICAgICAgICAvLyBkb2N1bWVudHNDYWNoZSBFUlJPUiB7XG4gICAgICAgICAgICAvLyAgICAgY29kZTogJ2NoYW5nZWQnLFxuICAgICAgICAgICAgLy8gICAgIG5hbWU6ICdkb2N1bWVudHMnLFxuICAgICAgICAgICAgLy8gICAgIHZwYXRoOiAnX21lcm1haWQvcmVuZGVyMzM1NjczOTM4Mi5tZXJtYWlkJyxcbiAgICAgICAgICAgIC8vICAgICBlcnJvcjogRXJyb3I6IGRlbGV0ZSBmcm9tICdUQUdHTFVFJyBmYWlsZWQ6IG5vdGhpbmcgY2hhbmdlZFxuICAgICAgICAgICAgLy8gICAgICAuLi4gc3RhY2sgdHJhY2VcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIEluIHN1Y2ggYSBjYXNlIHRoZXJlIGlzIG5vIHRhZ0dsdWUgZm9yIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICAgIC8vIFRoaXMgXCJlcnJvclwiIGlzIHNwdXJpb3VzLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRPRE8gSXMgdGhlcmUgYW5vdGhlciBxdWVyeSB0byBydW4gdGhhdCB3aWxsXG4gICAgICAgICAgICAvLyBub3QgdGhyb3cgYW4gZXJyb3IgaWYgbm90aGluZyB3YXMgY2hhbmdlZD9cbiAgICAgICAgICAgIC8vIEluIG90aGVyIHdvcmRzLCB0aGlzIGNvdWxkIGhpZGUgYSBsZWdpdGltYXRlXG4gICAgICAgICAgICAvLyBlcnJvci5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBhZGREb2NUYWdHbHVlKHZwYXRoOiBzdHJpbmcsIHRhZ3M6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGFncyAhPT0gJ3N0cmluZydcbiAgICAgICAgICYmICFBcnJheS5pc0FycmF5KHRhZ3MpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGREb2NUYWdHbHVlIG11c3QgYmUgZ2l2ZW4gYSB0YWdzIGFycmF5LCB3YXMgZ2l2ZW46ICR7dXRpbC5pbnNwZWN0KHRhZ3MpfWApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRnbHVlLmFkZFRhZ0dsdWUodnBhdGgsIFxuICAgICAgICAgICAgQXJyYXkuaXNBcnJheSh0YWdzKVxuICAgICAgICAgICAgPyB0YWdzXG4gICAgICAgICAgICA6IFsgdGFncyBdKTtcbiAgICB9XG5cbiAgICBhc3luYyBhZGRUYWdEZXNjcmlwdGlvbih0YWc6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGRlc2MuYWRkRGVzYyh0YWcsIGRlc2NyaXB0aW9uKTtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRUYWdEZXNjcmlwdGlvbih0YWc6IHN0cmluZylcbiAgICAgICAgOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD5cbiAgICB7XG4gICAgICAgIHJldHVybiB0ZGVzYy5nZXREZXNjKHRhZyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZVVubGlua2VkKG5hbWU6IGFueSwgaW5mbzogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHN1cGVyLmhhbmRsZVVubGlua2VkKG5hbWUsIGluZm8pO1xuICAgICAgICB0Z2x1ZS5kZWxldGVUYWdHbHVlKGluZm8udnBhdGgpO1xuICAgIH1cblxuICAgIGFzeW5jIGluZGV4Q2hhaW4oX2ZwYXRoKTogUHJvbWlzZTxpbmRleENoYWluSXRlbVtdPiB7XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKSBcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IHBhdGgucGFyc2UoZnBhdGgpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbmRleENoYWluICR7X2ZwYXRofSAke2ZwYXRofWAsIHBhcnNlZCk7XG5cbiAgICAgICAgY29uc3QgZmlsZXo6IERvY3VtZW50W10gPSBbXTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChmcGF0aCk7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGZwYXRoO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmKSAmJiBzZWxmLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICBmaWxlei5wdXNoKHNlbGZbMF0pO1xuICAgICAgICAgICAgZmlsZU5hbWUgPSBzZWxmWzBdLnJlbmRlclBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50RGlyO1xuICAgICAgICBsZXQgZGlyTmFtZSA9IHBhdGguZGlybmFtZShmcGF0aCk7XG4gICAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICghKGRpck5hbWUgPT09ICcuJyB8fCBkaXJOYW1lID09PSBwYXJzZWQucm9vdCkpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGVOYW1lKSA9PT0gJ2luZGV4Lmh0bWwnKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShmaWxlTmFtZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxvb2tGb3IgPSBwYXRoLmpvaW4ocGFyZW50RGlyLCBcImluZGV4Lmh0bWxcIik7XG5cbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gYXdhaXQgdGhpcy5maW5kQnlQYXRoKGxvb2tGb3IpO1xuXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpbmRleCkgJiYgaW5kZXgubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgICAgICBmaWxlei5wdXNoKGluZGV4WzBdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsZU5hbWUgPSBsb29rRm9yO1xuICAgICAgICAgICAgZGlyTmFtZSA9IHBhdGguZGlybmFtZShsb29rRm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWxlelxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24ob2JqOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxpbmRleENoYWluSXRlbT57XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogb2JqLmRvY01ldGFkYXRhLnRpdGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmREaXI6IG9iai5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRQYXRoOiBvYmoucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiAnLycgKyBvYmoucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBvYmouZm91bmREaXIgPSBvYmoubW91bnRQb2ludDtcbiAgICAgICAgICAgICAgICAgICAgLy8gb2JqLmZvdW5kUGF0aCA9IG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICAvLyBvYmouZmlsZW5hbWUgPSAnLycgKyBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIG9iajtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgYWxsIHRoZSBkb2N1bWVudHMgaW4gdGhlIHNhbWUgZGlyZWN0b3J5XG4gICAgICogYXMgdGhlIG5hbWVkIGZpbGUuXG4gICAgICpcbiAgICAgKiBUaGlzIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIHVzZWQgYW55d2hlcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHNpYmxpbmdzKF9mcGF0aCkge1xuICAgICAgICBsZXQgcmV0O1xuICAgICAgICBsZXQgdnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZSh2cGF0aCk7XG5cbiAgICAgICAgY29uc3Qgc2libGluZ3MgPSBhd2FpdCB0aGlzLmRiLmFsbChgXG4gICAgICAgICAgICBTRUxFQ1QgKiBGUk9NICR7dGhpcy5xdW90ZWREQk5hbWV9XG4gICAgICAgICAgICBXSEVSRVxuICAgICAgICAgICAgZGlybmFtZSA9ICRkaXJuYW1lIEFORFxuICAgICAgICAgICAgdnBhdGggPD4gJHZwYXRoIEFORFxuICAgICAgICAgICAgcmVuZGVyUGF0aCA8PiAkdnBhdGggQU5EXG4gICAgICAgICAgICByZW5kZXJzVG9IdG1sID0gdHJ1ZVxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkZGlybmFtZTogZGlybmFtZSxcbiAgICAgICAgICAgICR2cGF0aDogdnBhdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgaWdub3JlZCA9IHNpYmxpbmdzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhdGhpcy5pZ25vcmVGaWxlKGl0ZW0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSB0aGlzLnZhbGlkYXRlUm93cyhpZ25vcmVkKTtcbiAgICAgICAgcmV0dXJuIG1hcHBlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB0cmVlIG9mIGl0ZW1zIHN0YXJ0aW5nIGZyb20gdGhlIGRvY3VtZW50XG4gICAgICogbmFtZWQgaW4gX3Jvb3RJdGVtLiAgVGhlIHBhcmFtZXRlciBzaG91bGQgYmUgYW5cbiAgICAgKiBhY3R1YWwgZG9jdW1lbnQgaW4gdGhlIHRyZWUsIHN1Y2ggYXMgYHBhdGgvdG8vaW5kZXguaHRtbGAuXG4gICAgICogVGhlIHJldHVybiBpcyBhIHRyZWUtc2hhcGVkIHNldCBvZiBvYmplY3RzIGxpa2UgdGhlIGZvbGxvd2luZztcbiAgICAgKiBcbiAgdHJlZTpcbiAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlclxuICAgIGl0ZW1zOlxuICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBjaGlsZEZvbGRlcnM6XG4gICAgICAgIC0gZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICAgICAgaXRlbXM6XG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sXG4gICAgICAgICAgICAgIGNoaWxkRm9sZGVyczogW11cbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sXG4gICAgICAgICAgICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAqXG4gICAgICogVGhlIG9iamVjdHMgdW5kZXIgYGl0ZW1zYCBhcmUgYWN0dWxseSB0aGUgZnVsbCBEb2N1bWVudCBvYmplY3RcbiAgICAgKiBmcm9tIHRoZSBjYWNoZSwgYnV0IGZvciB0aGUgaW50ZXJlc3Qgb2YgY29tcGFjdG5lc3MgbW9zdCBvZlxuICAgICAqIHRoZSBmaWVsZHMgaGF2ZSBiZWVuIGRlbGV0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX3Jvb3RJdGVtIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGNoaWxkSXRlbVRyZWUoX3Jvb3RJdGVtOiBzdHJpbmcpIHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hpbGRJdGVtVHJlZSAke19yb290SXRlbX1gKTtcblxuICAgICAgICBsZXQgcm9vdEl0ZW0gPSBhd2FpdCB0aGlzLmZpbmQoXG4gICAgICAgICAgICAgICAgX3Jvb3RJdGVtLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9yb290SXRlbS5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfcm9vdEl0ZW0pO1xuICAgICAgICBpZiAoIXJvb3RJdGVtKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYGNoaWxkSXRlbVRyZWUgbm8gcm9vdEl0ZW0gZm91bmQgZm9yIHBhdGggJHtfcm9vdEl0ZW19YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKHR5cGVvZiByb290SXRlbSA9PT0gJ29iamVjdCcpXG4gICAgICAgICB8fCAhKCd2cGF0aCcgaW4gcm9vdEl0ZW0pXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGBjaGlsZEl0ZW1UcmVlIGZvdW5kIGludmFsaWQgb2JqZWN0IGZvciAke19yb290SXRlbX0gLSAke3V0aWwuaW5zcGVjdChyb290SXRlbSl9YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKHJvb3RJdGVtLnZwYXRoKTtcbiAgICAgICAgLy8gUGlja3MgdXAgZXZlcnl0aGluZyBmcm9tIHRoZSBjdXJyZW50IGxldmVsLlxuICAgICAgICAvLyBEaWZmZXJzIGZyb20gc2libGluZ3MgYnkgZ2V0dGluZyBldmVyeXRoaW5nLlxuICAgICAgICBjb25zdCBfaXRlbXMgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUICpcbiAgICAgICAgICAgIEZST00gJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIFdIRVJFIGRpcm5hbWUgPSAkZGlybmFtZSBBTkQgcmVuZGVyc1RvSFRNTCA9IHRydWVcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJGRpcm5hbWU6IGRpcm5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGl0ZW1zOiBEb2N1bWVudFtdXG4gICAgICAgICAgICA9IHRoaXMudmFsaWRhdGVSb3dzKF9pdGVtcylcbiAgICAgICAgICAgIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IF9jaGlsZEZvbGRlcnMgPSA8YW55W10+YXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUIGRpc3RpbmN0IGRpcm5hbWUgRlJPTSBET0NVTUVOVFNcbiAgICAgICAgICAgIFdIRVJFIHBhcmVudERpciA9ICRkaXJuYW1lXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICRkaXJuYW1lOiBkaXJuYW1lXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjaGlsZEZvbGRlcnMgPSBuZXcgQXJyYXk8eyBkaXJuYW1lOiBzdHJpbmcgfT4oKTtcbiAgICAgICAgZm9yIChjb25zdCBjZiBvZiBfY2hpbGRGb2xkZXJzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNmLmRpcm5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBkaXJuYW1lOiBjZi5kaXJuYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY2hpbGRJdGVtVHJlZSgke19yb290SXRlbX0pIG5vIGRpcm5hbWUgZmllbGRzIGluIGNoaWxkRm9sZGVyc2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNmcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGNmIG9mIGNoaWxkRm9sZGVycykge1xuICAgICAgICAgICAgY2ZzLnB1c2goYXdhaXQgdGhpcy5jaGlsZEl0ZW1UcmVlKFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihjZi5kaXJuYW1lLCAnaW5kZXguaHRtbCcpXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByb290SXRlbSxcbiAgICAgICAgICAgIGRpcm5hbWUsXG4gICAgICAgICAgICBpdGVtczogaXRlbXMsXG4gICAgICAgICAgICAvLyBVbmNvbW1lbnQgdGhpcyB0byBnZW5lcmF0ZSBzaW1wbGlmaWVkIG91dHB1dFxuICAgICAgICAgICAgLy8gZm9yIGRlYnVnZ2luZy5cbiAgICAgICAgICAgIC8vIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0pLFxuICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBjZnNcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGluZGV4IGZpbGVzIChyZW5kZXJzIHRvIGluZGV4Lmh0bWwpXG4gICAgICogd2l0aGluIHRoZSBuYW1lZCBzdWJ0cmVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGluZGV4RmlsZXMocm9vdFBhdGg/OiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsbHkgYXBwZW5kYWJsZSBzdWItcXVlcnlcbiAgICAgICAgLy8gdG8gaGFuZGxlIHdoZW4gcm9vdFBhdGggaXMgc3BlY2lmaWVkXG4gICAgICAgIGxldCByb290USA9IChcbiAgICAgICAgICAgICAgICB0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgJiYgcm9vdFAubGVuZ3RoID49IDFcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgID8gYEFORCAoIHJlbmRlclBhdGggTElLRSAnJHtyb290UH0lJyApYFxuICAgICAgICAgICAgOiAnJztcblxuICAgICAgICBjb25zdCBpbmRleGVzID0gPGFueVtdPiBhd2FpdCB0aGlzLmRiLmFsbChgXG4gICAgICAgIFNFTEVDVCAqXG4gICAgICAgIEZST00gRE9DVU1FTlRTXG4gICAgICAgIFdIRVJFXG4gICAgICAgICAgICAoIHJlbmRlcnNUb0hUTUwgPSB0cnVlIClcbiAgICAgICAgQU5EIChcbiAgICAgICAgICAgICggcmVuZGVyUGF0aCBMSUtFICclL2luZGV4Lmh0bWwnIClcbiAgICAgICAgIE9SICggcmVuZGVyUGF0aCA9ICdpbmRleC5odG1sJyApXG4gICAgICAgIClcbiAgICAgICAgJHtyb290UX1cbiAgICAgICAgYCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBtYXBwZWQgPSB0aGlzLnZhbGlkYXRlUm93cyhpbmRleGVzKTtcbiAgICAgICAgcmV0dXJuIG1hcHBlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJdCdzIHByb3ZlZCBkaWZmaWN1bHQgdG8gZ2V0IHRoZSByZWdleHBcbiAgICAgICAgLy8gdG8gd29yayBpbiB0aGlzIG1vZGU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHJldHVybiBhd2FpdCB0aGlzLnNlYXJjaCh7XG4gICAgICAgIC8vICAgICByZW5kZXJzVG9IVE1MOiB0cnVlLFxuICAgICAgICAvLyAgICAgcmVuZGVycGF0aG1hdGNoOiAvXFwvaW5kZXguaHRtbCQvLFxuICAgICAgICAvLyAgICAgcm9vdFBhdGg6IHJvb3RQYXRoXG4gICAgICAgIC8vIH0pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBGb3IgZXZlcnkgZmlsZSBpbiB0aGUgZG9jdW1lbnRzIGNhY2hlLFxuICAgICAqIHNldCB0aGUgYWNjZXNzIGFuZCBtb2RpZmljYXRpb25zLlxuICAgICAqIFxuICAgICAqIFRoaXMgaXMgdXNlZCBmcm9tIGNsaS50cyBkb2NzLXNldC1kYXRlc1xuICAgICAqXG4gICAgICogPz8/Pz8gV2h5IHdvdWxkIHRoaXMgYmUgdXNlZnVsP1xuICAgICAqIEkgY2FuIHNlZSBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWRcbiAgICAgKiBmaWxlcyBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeS4gIEJ1dCB0aGlzIGlzXG4gICAgICogZm9yIHRoZSBmaWxlcyBpbiB0aGUgZG9jdW1lbnRzIGRpcmVjdG9yaWVzLiA/Pz8/XG4gICAgICovXG4gICAgYXN5bmMgc2V0VGltZXMoKSB7XG5cbiAgICAgICAgLy8gVGhlIFNFTEVDVCBiZWxvdyBwcm9kdWNlcyByb3cgb2JqZWN0cyBwZXJcbiAgICAgICAgLy8gdGhpcyBpbnRlcmZhY2UgZGVmaW5pdGlvbi4gIFRoaXMgZnVuY3Rpb24gbG9va3NcbiAgICAgICAgLy8gZm9yIGEgdmFsaWQgZGF0ZSBmcm9tIHRoZSBkb2N1bWVudCBtZXRhZGF0YSxcbiAgICAgICAgLy8gYW5kIGVuc3VyZXMgdGhlIGZzcGF0aCBmaWxlIGlzIHNldCB0byB0aGF0IGRhdGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHNhaWQgaW4gdGhlIGNvbW1lbnQgYWJvdmUuLi4uIFdIWT9cbiAgICAgICAgLy8gSSBjYW4gdW5kZXJzdGFuZCBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWQgb3V0cHV0LlxuICAgICAgICAvLyBGb3Igd2hhdCBwdXJwb3NlIGRpZCBJIGNyZWF0ZSB0aGlzIGZ1bmN0aW9uP1xuICAgICAgICBjb25zdCBzZXR0ZXIgPSAocm93OiB7XG4gICAgICAgICAgICB2cGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgZnNwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBtdGltZU1zOiBudW1iZXIsXG4gICAgICAgICAgICBwdWJsaWNhdGlvblRpbWU6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxEYXRlOiBzdHJpbmcsXG4gICAgICAgICAgICBwdWJsaWNhdGlvbkRhdGU6IHN0cmluZ1xuICAgICAgICB9KSA9PiB7XG4gICAgICAgICAgICBsZXQgcGFyc2VkID0gTmFOO1xuICAgICAgICAgICAgaWYgKHJvdy5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxEYXRlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93LnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZCA9IERhdGUucGFyc2Uocm93LnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJvdy5wdWJsaWNhdGlvblRpbWUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZWQgPSByb3cucHVibGljYXRpb25UaW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRwID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICBGUy51dGltZXNTeW5jKFxuICAgICAgICAgICAgICAgICAgICByb3cuZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBkcCxcbiAgICAgICAgICAgICAgICAgICAgZHBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuZGIuZWFjaChgXG4gICAgICAgICAgICBTRUxFQ1RcbiAgICAgICAgICAgICAgICB2cGF0aCwgZnNwYXRoLFxuICAgICAgICAgICAgICAgIG10aW1lTXMsIHB1YmxpY2F0aW9uVGltZSxcbiAgICAgICAgICAgICAgICBqc29uX2V4dHJhY3QoaW5mbywgJyQuZG9jTWV0YWRhdGEucHVibERhdGUnKSBhcyBwdWJsRGF0ZSxcbiAgICAgICAgICAgICAgICBqc29uX2V4dHJhY3QoaW5mbywgJyQuZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlJykgYXMgcHVibGljYXRpb25EYXRlLFxuICAgICAgICAgICAgRlJPTSAke3RoaXMucXVvdGVkREJOYW1lfVxuICAgICAgICBgLCB7IH0sXG4gICAgICAgIChyb3c6IHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICBmc3BhdGg6IHN0cmluZyxcbiAgICAgICAgICAgIG10aW1lTXM6IG51bWJlcixcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uVGltZTogbnVtYmVyLFxuICAgICAgICAgICAgcHVibERhdGU6IHN0cmluZyxcbiAgICAgICAgICAgIHB1YmxpY2F0aW9uRGF0ZTogc3RyaW5nXG4gICAgICAgIH0pID0+IHtcbiAgICAgICAgICAgIGlmIChyb3cucHVibERhdGVcbiAgICAgICAgICAgICB8fCByb3cucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgfHwgcm93LnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc2V0dGVyKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGRvY3VtZW50c1dpdGhUYWcodGFnbm06IHN0cmluZyB8IHN0cmluZ1tdKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8c3RyaW5nPj5cbiAgICB7XG4gICAgICAgIGxldCB0YWdzOiBzdHJpbmdbXTtcbiAgICAgICAgaWYgKHR5cGVvZiB0YWdubSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRhZ3MgPSBbIHRhZ25tIF07XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0YWdubSkpIHtcbiAgICAgICAgICAgIHRhZ3MgPSB0YWdubTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnRzV2l0aFRhZyBnaXZlbiBiYWQgdGFncyBhcnJheSAke3V0aWwuaW5zcGVjdCh0YWdubSl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb3JyZWN0bHkgaGFuZGxlIHRhZyBzdHJpbmdzIHdpdGhcbiAgICAgICAgLy8gdmFyeWluZyBxdW90ZXMuICBBIGRvY3VtZW50IG1pZ2h0IGhhdmUgdGhlc2UgdGFnczpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgdGFnczpcbiAgICAgICAgLy8gICAgLSBUZWFzZXInc1xuICAgICAgICAvLyAgICAtIFRlYXNlcnNcbiAgICAgICAgLy8gICAgLSBTb21ldGhpbmcgXCJxdW90ZWRcIlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGVzZSBTUUwgcXVlcmllcyB3b3JrOlxuICAgICAgICAvL1xuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lIElOICggJ1NvbWV0aGluZyBcInF1b3RlZFwiJywgXCJUZWFzZXInc1wiICk7XG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8VGVhc2VyJ3NcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxTb21ldGhpbmcgXCJxdW90ZWRcIlxuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lIElOICggJ1NvbWV0aGluZyBcInF1b3RlZFwiJywgJ1RlYXNlcicncycgKTtcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxUZWFzZXInc1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEJ1dCwgdGhpcyBkb2VzIG5vdDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gc3FsaXRlPiBzZWxlY3QgKiBmcm9tIFRBR0dMVUUgd2hlcmUgdGFnTmFtZSA9ICdUZWFzZXIncyc7XG4gICAgICAgIC8vICcgIC4uLj4gXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBvcmlnaW5hbCBjb2RlIGJlaGF2aW9yIHdhcyB0aGlzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEIEVycm9yOiBTUUxJVEVfRVJST1I6IG5lYXIgXCJzXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBBbiBhdHRlbXB0ZWQgZml4OlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiBdICAoICdUZWFzZXJcXCdzJyApIFxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInNcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFub3RoZXIgYXR0ZW1wdGVkIGZpeDpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyBcIlRlYXNlcidzXCIgXSAgKCBcIlRlYXNlcicnc1wiICkgXG4gICAgICAgIC8vIFtdXG4gICAgICAgIC8vIFtdXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuZDpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgJ1NvbWV0aGluZyBcInF1b3RlZFwiJ1xuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgJ1NvbWV0aGluZyBcInF1b3RlZFwiJyBdICAoIFwiU29tZXRoaW5nIFwicXVvdGVkXCJcIiApIFxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInF1b3RlZFwiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIGNvZGUgYmVsb3cgcHJvZHVjZXM6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIiAnU29tZXRoaW5nIFwicXVvdGVkXCInXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyBcIlRlYXNlcidzXCIsICdTb21ldGhpbmcgXCJxdW90ZWRcIicgXSAgKCAnVGVhc2VyJydzJywnU29tZXRoaW5nIFwicXVvdGVkXCInICkgXG4gICAgICAgIC8vIFsgeyB2cGF0aDogJ3RlYXNlci1jb250ZW50Lmh0bWwubWQnIH0gXVxuICAgICAgICAvLyBbICd0ZWFzZXItY29udGVudC5odG1sLm1kJyBdXG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGRvY3VtZW50c1dpdGhUYWcgJHt1dGlsLmluc3BlY3QodGFncyl9ICR7dGFnc3RyaW5nfWApO1xuXG4gICAgICAgIGNvbnN0IHZwYXRocyA9IGF3YWl0IHRnbHVlLnBhdGhzRm9yVGFnKHRhZ3MpO1xuICAgICAgICBcbiAgICAgICAgLy8gY29uc29sZS5sb2codnBhdGhzKTtcblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodnBhdGhzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudHNXaXRoVGFnIG5vbi1BcnJheSByZXN1bHQgJHt1dGlsLmluc3BlY3QodnBhdGhzKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2cGF0aHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFuIGFycmF5IG9mIHRhZ3MgdXNlZCBieSBhbGwgZG9jdW1lbnRzLlxuICAgICAqIFRoaXMgdXNlcyB0aGUgSlNPTiBleHRlbnNpb24gdG8gZXh0cmFjdFxuICAgICAqIHRoZSB0YWdzIGZyb20gdGhlIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHRhZ3MoKSB7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCB0Z2x1ZS50YWdzKCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXQgPSBBcnJheS5mcm9tKHRhZ3MpO1xuICAgICAgICByZXR1cm4gcmV0LnNvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB2YXIgdGFnQSA9IGEudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHZhciB0YWdCID0gYi50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKHRhZ0EgPCB0YWdCKSByZXR1cm4gLTE7XG4gICAgICAgICAgICBpZiAodGFnQSA+IHRhZ0IpIHJldHVybiAxO1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlIHRoZSBkYXRhIGZvciBhbiBpbnRlcm5hbCBsaW5rXG4gICAgICogd2l0aGluIHRoZSBzaXRlIGRvY3VtZW50cy4gIEZvcm1pbmcgYW5cbiAgICAgKiBpbnRlcm5hbCBsaW5rIGlzIGF0IGEgbWluaW11bSB0aGUgcmVuZGVyZWRcbiAgICAgKiBwYXRoIGZvciB0aGUgZG9jdW1lbnQgYW5kIGl0cyB0aXRsZS5cbiAgICAgKiBUaGUgdGVhc2VyLCBpZiBhdmFpbGFibGUsIGNhbiBiZSB1c2VkIGluXG4gICAgICogYSB0b29sdGlwLiBUaGUgdGh1bWJuYWlsIGlzIGFuIGltYWdlIHRoYXRcbiAgICAgKiBjb3VsZCBiZSBkaXNwbGF5ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgZG9jTGlua0RhdGEodnBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuXG4gICAgICAgIC8vIFRoZSB2cGF0aCByZWZlcmVuY2VcbiAgICAgICAgdnBhdGg6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIHBhdGggaXQgcmVuZGVycyB0b1xuICAgICAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSB0aXRsZSBzdHJpbmcgZnJvbSB0aGF0IHBhZ2VcbiAgICAgICAgdGl0bGU6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIHRlYXNlciB0ZXh0IGZyb20gdGhhdCBwYWdlXG4gICAgICAgIHRlYXNlcj86IHN0cmluZztcbiAgICAgICAgLy8gVGhlIGhlcm8gaW1hZ2UgKHRodW1ibmFpbClcbiAgICAgICAgdGh1bWJuYWlsPzogc3RyaW5nO1xuICAgIH0+IHtcblxuICAgICAgICBjb25zdCBmb3VuZCA9IDxhbnlbXT4gYXdhaXQgdGhpcy5kYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUICpcbiAgICAgICAgICAgIEZST00gJHt0aGlzLnF1b3RlZERCTmFtZX1cbiAgICAgICAgICAgIFdIRVJFIFxuICAgICAgICAgICAgdnBhdGggPSAkdnBhdGggT1IgcmVuZGVyUGF0aCA9ICR2cGF0aFxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZvdW5kKSkge1xuXG4gICAgICAgICAgICBjb25zdCBkb2MgPSB0aGlzLnZhbGlkYXRlUm93KGZvdW5kWzBdKTtcblxuICAgICAgICAgICAgLy8gY29uc3QgZG9jSW5mbyA9IGF3YWl0IHRoaXMuZmluZCh2cGF0aCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGRvYy5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBkb2MubWV0YWRhdGEudGl0bGUsXG4gICAgICAgICAgICAgICAgdGVhc2VyOiBkb2MubWV0YWRhdGEudGVhc2VyLFxuICAgICAgICAgICAgICAgIC8vIHRodW1ibmFpbFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHRpdGxlOiB1bmRlZmluZWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIGEgc2ltcGxlIGNhY2hlIHRvIGhvbGQgcmVzdWx0c1xuICAgIC8vIG9mIHNlYXJjaCBvcGVyYXRpb25zLiAgVGhlIGtleSBzaWRlIG9mIHRoaXNcbiAgICAvLyBNYXAgaXMgbWVhbnQgdG8gYmUgdGhlIHN0cmluZ2lmaWVkIHNlbGVjdG9yLlxuICAgIHByaXZhdGUgc2VhcmNoQ2FjaGUgPSBuZXcgTWFwPFxuICAgICAgICAgICAgc3RyaW5nLCB7IHJlc3VsdHM6IERvY3VtZW50W10sIHRpbWVzdGFtcDogbnVtYmVyIH1cbiAgICA+KCk7XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtIGRlc2NyaXB0aXZlIHNlYXJjaCBvcGVyYXRpb25zIHVzaW5nIGRpcmVjdCBTUUwgcXVlcmllc1xuICAgICAqIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UgYW5kIHNjYWxhYmlsaXR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgU2VhcmNoIG9wdGlvbnMgb2JqZWN0XG4gICAgICogQHJldHVybnMgUHJvbWlzZTxBcnJheTxEb2N1bWVudD4+XG4gICAgICovXG4gICAgYXN5bmMgc2VhcmNoKG9wdGlvbnMpOiBQcm9taXNlPEFycmF5PERvY3VtZW50Pj4ge1xuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIC8vIEZpcnN0LCBzZWUgaWYgdGhlIHNlYXJjaCByZXN1bHRzIGFyZSBhbHJlYWR5XG4gICAgICAgIC8vIGNvbXB1dGVkIGFuZCBpbiB0aGUgY2FjaGUuXG5cbiAgICAgICAgLy8gVGhlIGlzc3VlIGhlcmUgaXMgdGhhdCB0aGUgb3B0aW9uc1xuICAgICAgICAvLyBvYmplY3QgY2FuIGNvbnRhaW4gUmVnRXhwIHZhbHVlcy5cbiAgICAgICAgLy8gVGhlIFJlZ0V4cCBvYmplY3QgZG9lcyBub3QgaGF2ZVxuICAgICAgICAvLyBhIHRvSlNPTiBmdW5jdGlvbi4gIFRoaXMgaG9va1xuICAgICAgICAvLyBjYXVzZXMgUmVnRXhwIHRvIHJldHVybiB0aGVcbiAgICAgICAgLy8gLnRvU3RyaW5nKCkgdmFsdWUgaW5zdGVhZC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gU291cmNlOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMDI3NjUzMS9zdHJpbmdpZnlpbmctYS1yZWd1bGFyLWV4cHJlc3Npb25cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQSBzaW1pbGFyIGlzc3VlIGV4aXN0cyB3aXRoIEZ1bmN0aW9uc1xuICAgICAgICAvLyBpbiB0aGUgb2JqZWN0LlxuICAgICAgICAvL1xuICAgICAgICAvLyBTb3VyY2U6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzY3NTQ5MTkvanNvbi1zdHJpbmdpZnktZnVuY3Rpb25cbiAgICAgICAgY29uc3QgY2FjaGVLZXkgPSBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZSArICcnOyAvLyBpbXBsaWNpdGx5IGB0b1N0cmluZ2AgaXRcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIEEgdGltZW91dCBvZiAwIG1lYW5zIHRvIGRpc2FibGUgY2FjaGluZ1xuICAgICAgICBjb25zdCBjYWNoZWQgPVxuICAgICAgICAgICAgdGhpcy5jb25maWcuc2VhcmNoQ2FjaGVUaW1lb3V0ID4gMFxuICAgICAgICAgICAgPyB0aGlzLnNlYXJjaENhY2hlLmdldChjYWNoZUtleSlcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggJHt1dGlsLmluc3BlY3Qob3B0aW9ucyl9ID09PiAke2NhY2hlS2V5fSAke2NhY2hlZCA/ICdoYXNDYWNoZWQnIDogJ25vQ2FjaGVkJ31gKTtcblxuICAgICAgICAvLyBJZiB0aGUgY2FjaGUgaGFzIGFuIGVudHJ5LCBza2lwIGNvbXB1dGluZ1xuICAgICAgICAvLyBhbnl0aGluZy5cbiAgICAgICAgaWYgKGNhY2hlZFxuICAgICAgICAgJiYgKERhdGUubm93KCkgLSBjYWNoZWQudGltZXN0YW1wKVxuICAgICAgICAgICAgPCB0aGlzLmNvbmZpZy5zZWFyY2hDYWNoZVRpbWVvdXRcbiAgICAgICAgKSB7IC8vIDEgbWludXRlIGNhY2hlXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdHM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOT1RFOiBFbnRyaWVzIGFyZSBhZGRlZCB0byB0aGUgY2FjaGUgYXQgdGhlIGJvdHRvbVxuICAgICAgICAvLyBvZiB0aGlzIGZ1bmN0aW9uXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgc3FsLCBwYXJhbXMgfSA9IHRoaXMuYnVpbGRTZWFyY2hRdWVyeShvcHRpb25zKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggJHtzcWx9YCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHRzXG4gICAgICAgICAgICAgICAgPSBhd2FpdCB0aGlzLmRiLmFsbChzcWwsIHBhcmFtcyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50c1xuICAgICAgICAgICAgICAgID0gdGhpcy52YWxpZGF0ZVJvd3MocmVzdWx0cylcbiAgICAgICAgICAgICAgICAubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBBcHBseSBwb3N0LVNRTCBmaWx0ZXJzIHRoYXQgY2FuJ3QgYmUgZG9uZSBpbiBTUUxcbiAgICAgICAgICAgIGxldCBmaWx0ZXJlZFJlc3VsdHMgPSBkb2N1bWVudHM7XG5cbiAgICAgICAgICAgIC8vIEZpbHRlciBieSByZW5kZXJlcnMgKHJlcXVpcmVzIGNvbmZpZyBsb29rdXApXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJlcnNcbiAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVyZXJzKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbmRlcmVyID0gZmNhY2hlLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGl0ZW0udnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlbmRlcmVyKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCByIG9mIG9wdGlvbnMucmVuZGVyZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnICYmIHIgPT09IHJlbmRlcmVyLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1dBUk5JTkc6IE1hdGNoaW5nIHJlbmRlcmVyIGJ5IG9iamVjdCBjbGFzcyBpcyBubyBsb25nZXIgc3VwcG9ydGVkJywgcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBcHBseSBjdXN0b20gZmlsdGVyIGZ1bmN0aW9uXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXJmdW5jKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZmlsdGVyZnVuYyhmY2FjaGUuY29uZmlnLCBvcHRpb25zLCBpdGVtKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXBwbHkgY3VzdG9tIHNvcnQgZnVuY3Rpb24gKGlmIFNRTCBzb3J0aW5nIHdhc24ndCB1c2VkKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRGdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRSZXN1bHRzID0gZmlsdGVyZWRSZXN1bHRzLnNvcnQob3B0aW9ucy5zb3J0RnVuYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFkZCB0aGUgcmVzdWx0cyB0byB0aGUgY2FjaGVcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5zZWFyY2hDYWNoZVRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hDYWNoZS5zZXQoY2FjaGVLZXksIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0czogZmlsdGVyZWRSZXN1bHRzLCB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJlZFJlc3VsdHM7XG5cbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLnNlYXJjaCBlcnJvcjogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJ1aWxkIFNRTCBxdWVyeSBhbmQgcGFyYW1ldGVycyBmb3Igc2VhcmNoIG9wdGlvbnNcbiAgICAgKi9cbiAgICBwcml2YXRlIGJ1aWxkU2VhcmNoUXVlcnkob3B0aW9ucyk6IHtcbiAgICAgICAgc3FsOiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogYW55XG4gICAgfSB7XG4gICAgICAgIGNvbnN0IHBhcmFtczogYW55ID0ge307XG4gICAgICAgIGNvbnN0IHdoZXJlQ2xhdXNlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3Qgam9pbnM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGxldCBwYXJhbUNvdW50ZXIgPSAwO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBidWlsZFNlYXJjaFF1ZXJ5ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfWApO1xuXG4gICAgICAgIC8vIEhlbHBlciB0byBjcmVhdGUgdW5pcXVlIHBhcmFtZXRlciBuYW1lc1xuICAgICAgICBjb25zdCBhZGRQYXJhbSA9ICh2YWx1ZTogYW55KTogc3RyaW5nID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtTmFtZSA9IGAkcGFyYW0keysrcGFyYW1Db3VudGVyfWA7XG4gICAgICAgICAgICBwYXJhbXNbcGFyYW1OYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHBhcmFtTmFtZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBCYXNlIHF1ZXJ5XG4gICAgICAgIGxldCBzcWwgPSBgXG4gICAgICAgICAgICBTRUxFQ1QgRElTVElOQ1QgZC4qIEZST00gJHt0aGlzLnF1b3RlZERCTmFtZX0gZFxuICAgICAgICBgO1xuXG4gICAgICAgIC8vIE1JTUUgdHlwZSBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMubWltZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm1pbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubWltZSA9ICR7YWRkUGFyYW0ob3B0aW9ucy5taW1lKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLm1pbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGxhY2Vob2xkZXJzID0gb3B0aW9ucy5taW1lLm1hcChtaW1lID0+IGFkZFBhcmFtKG1pbWUpKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLm1pbWUgSU4gKCR7cGxhY2Vob2xkZXJzfSlgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlcnMgdG8gSFRNTCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnNUb0hUTUwgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyc1RvSFRNTCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJzVG9IVE1MID8gMSA6IDApfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUm9vdCBwYXRoIGZpbHRlcmluZ1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucm9vdFBhdGggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIExJS0UgJHthZGRQYXJhbShvcHRpb25zLnJvb3RQYXRoICsgJyUnKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdsb2IgcGF0dGVybiBtYXRjaGluZ1xuICAgICAgICBpZiAob3B0aW9ucy5nbG9iICYmIHR5cGVvZiBvcHRpb25zLmdsb2IgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25zdCBlc2NhcGVkR2xvYiA9IG9wdGlvbnMuZ2xvYi5pbmRleE9mKFwiJ1wiKSA+PSAwIFxuICAgICAgICAgICAgICAgID8gb3B0aW9ucy5nbG9iLnJlcGxhY2VBbGwoXCInXCIsIFwiJydcIikgXG4gICAgICAgICAgICAgICAgOiBvcHRpb25zLmdsb2I7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC52cGF0aCBHTE9CICR7YWRkUGFyYW0oZXNjYXBlZEdsb2IpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVuZGVyIGdsb2IgcGF0dGVybiBtYXRjaGluZ1xuICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJnbG9iICYmIHR5cGVvZiBvcHRpb25zLnJlbmRlcmdsb2IgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25zdCBlc2NhcGVkR2xvYiA9IG9wdGlvbnMucmVuZGVyZ2xvYi5pbmRleE9mKFwiJ1wiKSA+PSAwIFxuICAgICAgICAgICAgICAgID8gb3B0aW9ucy5yZW5kZXJnbG9iLnJlcGxhY2VBbGwoXCInXCIsIFwiJydcIikgXG4gICAgICAgICAgICAgICAgOiBvcHRpb25zLnJlbmRlcmdsb2I7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIEdMT0IgJHthZGRQYXJhbShlc2NhcGVkR2xvYil9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCbG9nIHRhZyBmaWx0ZXJpbmdcbiAgICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIGJsb2d0YWdzIGFycmF5IGlzIHVzZWQsXG4gICAgICAgIC8vIGlmIHByZXNlbnQsIHdpdGggdGhlIGJsb2d0YWcgdmFsdWUgdXNlZFxuICAgICAgICAvLyBvdGhlcndpc2UuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBwdXJwb3NlIGZvciB0aGUgYmxvZ3RhZ3MgdmFsdWUgaXMgdG9cbiAgICAgICAgLy8gc3VwcG9ydCBhIHBzZXVkby1ibG9nIG1hZGUgb2YgdGhlIGl0ZW1zXG4gICAgICAgIC8vIGZyb20gbXVsdGlwbGUgYWN0dWFsIGJsb2dzLlxuICAgICAgICAvLyBpZiAodHlwZW9mIG9wdGlvbnMuYmxvZ3RhZ3MgIT09ICd1bmRlZmluZWQnXG4gICAgICAgIC8vICB8fCB0eXBlb2Ygb3B0aW9ucy5ibG9ndGFnICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAvLyApIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGAgYmxvZ3RhZ3MgJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5ibG9ndGFncyl9IGJsb2d0YWcgJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5ibG9ndGFnKX1gKTtcbiAgICAgICAgLy8gfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmJsb2d0YWdzKSkge1xuICAgICAgICAgICAgY29uc3QgcGxhY2Vob2xkZXJzID0gb3B0aW9ucy5ibG9ndGFncy5tYXAodGFnID0+IGFkZFBhcmFtKHRhZykpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5ibG9ndGFnIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZC5ibG9ndGFnIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMuYmxvZ3RhZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmJsb2d0YWcgPSAke2FkZFBhcmFtKG9wdGlvbnMuYmxvZ3RhZyl9YCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZC5ibG9ndGFnID0gJHtvcHRpb25zLmJsb2d0YWd9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMuYmxvZ3RhZ3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIGJsb2d0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZ3MpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGFnIGZpbHRlcmluZyB1c2luZyBUQUdHTFVFIHRhYmxlXG4gICAgICAgIGlmIChvcHRpb25zLnRhZyAmJiB0eXBlb2Ygb3B0aW9ucy50YWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBqb2lucy5wdXNoKGBJTk5FUiBKT0lOIFRBR0dMVUUgdGcgT04gZC52cGF0aCA9IHRnLmRvY3ZwYXRoYCk7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgdGcudGFnTmFtZSA9ICR7YWRkUGFyYW0ob3B0aW9ucy50YWcpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTGF5b3V0IGZpbHRlcmluZ1xuICAgICAgICBpZiAob3B0aW9ucy5sYXlvdXRzKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmxheW91dHMpKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubGF5b3V0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubGF5b3V0ID0gJHthZGRQYXJhbShvcHRpb25zLmxheW91dHNbMF0pfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5sYXlvdXRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGxhY2Vob2xkZXJzID0gb3B0aW9ucy5sYXlvdXRzLm1hcChsYXlvdXQgPT4gYWRkUGFyYW0obGF5b3V0KSkuam9pbignLCAnKTtcbiAgICAgICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubGF5b3V0IElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5sYXlvdXQgPSAke2FkZFBhcmFtKG9wdGlvbnMubGF5b3V0cyl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQYXRoIHJlZ2V4IG1hdGNoaW5nXG4gICAgICAgIGNvbnN0IHJlZ2V4Q2xhdXNlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnBhdGhtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnBhdGhtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQudnBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5wYXRobWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBwYXRobWF0Y2ggcmVnZXhwICR7dXRpbC5pbnNwZWN0KG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoJ3BhdGhtYXRjaCcgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBwYXRobWF0Y2ggJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5wYXRobWF0Y2gpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVuZGVyIHBhdGggcmVnZXggbWF0Y2hpbmdcbiAgICAgICAgLy8gaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKHV0aWwuaW5zcGVjdChvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCwgZmFsc2UsIDMpKTtcbiAgICAgICAgLy8gfVxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQucmVuZGVyUGF0aCByZWdleHAgc3RyaW5nICR7b3B0aW9ucy5yZW5kZXJwYXRobWF0Y2h9YCk7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQucmVuZGVyUGF0aCByZWdleHAgcmVnZXhwICR7b3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlfWApO1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQucmVuZGVyUGF0aCByZWdleHAgYXJyYXkgc3RyaW5nICR7bWF0Y2h9YCk7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0obWF0Y2gpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQucmVuZGVyUGF0aCByZWdleHAgYXJyYXkgcmVnZXhwICR7bWF0Y2guc291cmNlfWApO1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCByZW5kZXJwYXRobWF0Y2ggcmVnZXhwICR7dXRpbC5pbnNwZWN0KG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoJ3JlbmRlcnBhdGhtYXRjaCcgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCByZW5kZXJwYXRobWF0Y2ggJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlZ2V4Q2xhdXNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgKCR7cmVnZXhDbGF1c2VzLmpvaW4oJyBPUiAnKX0pYCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgSk9JTnMgdG8gcXVlcnlcbiAgICAgICAgaWYgKGpvaW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNxbCArPSAnICcgKyBqb2lucy5qb2luKCcgJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgV0hFUkUgY2xhdXNlXG4gICAgICAgIGlmICh3aGVyZUNsYXVzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3FsICs9ICcgV0hFUkUgJyArIHdoZXJlQ2xhdXNlcy5qb2luKCcgQU5EICcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIE9SREVSIEJZIGNsYXVzZVxuICAgICAgICBsZXQgb3JkZXJCeSA9ICcnO1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc29ydEJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gSGFuZGxlIHNwZWNpYWwgY2FzZXMgdGhhdCBuZWVkIEpTT04gZXh0cmFjdGlvbiBvciBjb21wbGV4IGxvZ2ljXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zb3J0QnkgPT09ICdwdWJsaWNhdGlvbkRhdGUnXG4gICAgICAgICAgICAgfHwgb3B0aW9ucy5zb3J0QnkgPT09ICdwdWJsaWNhdGlvblRpbWUnXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgQ09BTEVTQ0UgdG8gaGFuZGxlIG51bGwgcHVibGljYXRpb24gZGF0ZXNcbiAgICAgICAgICAgICAgICBvcmRlckJ5ID0gYE9SREVSIEJZIENPQUxFU0NFKFxuICAgICAgICAgICAgICAgICAgICBkLnB1YmxpY2F0aW9uVGltZSxcbiAgICAgICAgICAgICAgICAgICAgZC5tdGltZU1zXG4gICAgICAgICAgICAgICAgKWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgb3RoZXIgZmllbGRzLCBzb3J0IGJ5IHRoZSBjb2x1bW4gZGlyZWN0bHlcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGFsbG93cyBzb3J0aW5nIGJ5IGFueSB2YWxpZCBjb2x1bW4gaW4gdGhlIERPQ1VNRU5UUyB0YWJsZVxuICAgICAgICAgICAgICAgIG9yZGVyQnkgPSBgT1JERVIgQlkgZC4ke29wdGlvbnMuc29ydEJ5fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZXZlcnNlIHx8IG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZykge1xuICAgICAgICAgICAgLy8gSWYgcmV2ZXJzZS9zb3J0QnlEZXNjZW5kaW5nIGlzIHNwZWNpZmllZCB3aXRob3V0IHNvcnRCeSwgXG4gICAgICAgICAgICAvLyB1c2UgYSBkZWZhdWx0IG9yZGVyaW5nIChieSBtb2RpZmljYXRpb24gdGltZSlcbiAgICAgICAgICAgIG9yZGVyQnkgPSAnT1JERVIgQlkgZC5tdGltZU1zJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBzb3J0IGRpcmVjdGlvblxuICAgICAgICBpZiAob3JkZXJCeSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZyB8fCBvcHRpb25zLnJldmVyc2UpIHtcbiAgICAgICAgICAgICAgICBvcmRlckJ5ICs9ICcgREVTQyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9yZGVyQnkgKz0gJyBBU0MnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3FsICs9ICcgJyArIG9yZGVyQnk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgTElNSVQgYW5kIE9GRlNFVFxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubGltaXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBzcWwgKz0gYCBMSU1JVCAke2FkZFBhcmFtKG9wdGlvbnMubGltaXQpfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHNxbCArPSBgIE9GRlNFVCAke2FkZFBhcmFtKG9wdGlvbnMub2Zmc2V0KX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgc3FsLCBwYXJhbXMgfTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IHZhciBhc3NldHNDYWNoZTogQXNzZXRzQ2FjaGU7XG5leHBvcnQgdmFyIHBhcnRpYWxzQ2FjaGU6IFBhcnRpYWxzQ2FjaGU7XG5leHBvcnQgdmFyIGxheW91dHNDYWNoZTogTGF5b3V0c0NhY2hlO1xuZXhwb3J0IHZhciBkb2N1bWVudHNDYWNoZTogRG9jdW1lbnRzQ2FjaGU7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgZGI6IEFzeW5jRGF0YWJhc2Vcbik6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgLy8gY29uc29sZS5sb2coY3JlYXRlQXNzZXRzVGFibGUpO1xuICAgIGF3YWl0IGRiLnJ1bihjcmVhdGVBc3NldHNUYWJsZSk7XG5cbiAgICBhc3NldHNDYWNoZSA9IG5ldyBBc3NldHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAnYXNzZXRzJyxcbiAgICAgICAgY29uZmlnLmFzc2V0RGlycyxcbiAgICAgICAgZGIsXG4gICAgICAgICdBU1NFVFMnXG4gICAgKTtcbiAgICBhd2FpdCBhc3NldHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgYXNzZXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGNyZWF0ZVBhcnRpYWxzVGFibGUpO1xuICAgIGF3YWl0IGRiLnJ1bihjcmVhdGVQYXJ0aWFsc1RhYmxlKTtcblxuICAgIHBhcnRpYWxzQ2FjaGUgPSBuZXcgUGFydGlhbHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAncGFydGlhbHMnLFxuICAgICAgICBjb25maWcucGFydGlhbHNEaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ1BBUlRJQUxTJ1xuICAgICk7XG4gICAgYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgcGFydGlhbHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsc0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhjcmVhdGVMYXlvdXRzVGFibGUpO1xuICAgIGF3YWl0IGRiLnJ1bihjcmVhdGVMYXlvdXRzVGFibGUpO1xuXG4gICAgbGF5b3V0c0NhY2hlID0gbmV3IExheW91dHNDYWNoZShcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAnbGF5b3V0cycsXG4gICAgICAgIGNvbmZpZy5sYXlvdXREaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ0xBWU9VVFMnXG4gICAgKTtcbiAgICBhd2FpdCBsYXlvdXRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIGxheW91dHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGBEb2N1bWVudHNGaWxlQ2FjaGUgJ2RvY3VtZW50cycgJHt1dGlsLmluc3BlY3QoY29uZmlnLmRvY3VtZW50RGlycyl9YCk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhjcmVhdGVEb2N1bWVudHNUYWJsZSk7XG4gICAgYXdhaXQgZGIucnVuKGNyZWF0ZURvY3VtZW50c1RhYmxlKTtcblxuICAgIGRvY3VtZW50c0NhY2hlID0gbmV3IERvY3VtZW50c0NhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdkb2N1bWVudHMnLFxuICAgICAgICBjb25maWcuZG9jdW1lbnREaXJzLFxuICAgICAgICBkYixcbiAgICAgICAgJ0RPQ1VNRU5UUydcbiAgICApO1xuICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLnNldHVwKCk7XG4gICAgYXdhaXQgdGdsdWUuaW5pdChkYik7XG4gICAgYXdhaXQgdGRlc2MuaW5pdChkYik7XG5cbiAgICBkb2N1bWVudHNDYWNoZS5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3VtZW50c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGVycil9YCk7XG4gICAgICAgIC8vIHByb2Nlc3MuZXhpdCgwKTtcbiAgICB9KTtcblxuICAgIGF3YWl0IGNvbmZpZy5ob29rUGx1Z2luQ2FjaGVTZXR1cCgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VGaWxlQ2FjaGVzKCkge1xuICAgIGlmIChkb2N1bWVudHNDYWNoZSkge1xuICAgICAgICBhd2FpdCBkb2N1bWVudHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBkb2N1bWVudHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGFzc2V0c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGFzc2V0c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGFzc2V0c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAobGF5b3V0c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGxheW91dHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBsYXlvdXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChwYXJ0aWFsc0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IHBhcnRpYWxzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgcGFydGlhbHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG4iXX0=