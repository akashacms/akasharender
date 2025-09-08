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
var _BaseFileCache_instances, _BaseFileCache_name, _BaseFileCache_is_ready, _BaseFileCache_cache_content, _BaseFileCache_map_renderpath, _BaseFileCache_dao, _BaseFileCache_watcher, _BaseFileCache_queue, _BaseFileCache_fExistsInDir, _TemplatesFileCache_type;
import { DirsWatcher } from '@akashacms/stacked-dirs';
import path from 'node:path';
import util from 'node:util';
import FS from 'fs';
import EventEmitter from 'events';
import micromatch from 'micromatch';
export class BaseFileCache extends EventEmitter {
    /**
     * @param config AkashaRender Configuration object
     * @param dirs array of directories and mount points to watch
     * @param name string giving the name for this watcher name
     * @param dao The SQLITE3ORM DAO instance to use
     */
    constructor(
    // config: Configuration,
    name, 
    // dirs: dirToMount[],
    dao // BaseDAO<T>
    ) {
        super();
        _BaseFileCache_instances.add(this);
        // #config?: Configuration;
        _BaseFileCache_name.set(this, void 0);
        // #dirs?: dirToMount[];
        _BaseFileCache_is_ready.set(this, false);
        _BaseFileCache_cache_content.set(this, void 0);
        _BaseFileCache_map_renderpath.set(this, void 0);
        _BaseFileCache_dao.set(this, void 0); // BaseDAO<T>;
        // SKIP: getDynamicView
        _BaseFileCache_watcher.set(this, void 0);
        _BaseFileCache_queue.set(this, void 0);
        // console.log(`BaseFileCache ${name} constructor dirs=${util.inspect(dirs)}`);
        // this.#config = config;
        __classPrivateFieldSet(this, _BaseFileCache_name, name, "f");
        // this.#dirs = dirs;
        __classPrivateFieldSet(this, _BaseFileCache_is_ready, false, "f");
        __classPrivateFieldSet(this, _BaseFileCache_cache_content, false, "f");
        __classPrivateFieldSet(this, _BaseFileCache_map_renderpath, false, "f");
        __classPrivateFieldSet(this, _BaseFileCache_dao, dao, "f");
    }
    // get config()     { return this.#config; }
    get name() { return __classPrivateFieldGet(this, _BaseFileCache_name, "f"); }
    // get dirs()       { return this.#dirs; }
    set cacheContent(doit) { __classPrivateFieldSet(this, _BaseFileCache_cache_content, doit, "f"); }
    get gacheContent() { return __classPrivateFieldGet(this, _BaseFileCache_cache_content, "f"); }
    set mapRenderPath(doit) { __classPrivateFieldSet(this, _BaseFileCache_map_renderpath, doit, "f"); }
    get mapRenderPath() { return __classPrivateFieldGet(this, _BaseFileCache_map_renderpath, "f"); }
    get dao() { return __classPrivateFieldGet(this, _BaseFileCache_dao, "f"); }
    async close() {
        if (__classPrivateFieldGet(this, _BaseFileCache_queue, "f")) {
            __classPrivateFieldGet(this, _BaseFileCache_queue, "f").killAndDrain();
            __classPrivateFieldSet(this, _BaseFileCache_queue, undefined, "f");
        }
        if (__classPrivateFieldGet(this, _BaseFileCache_watcher, "f")) {
            // console.log(`CLOSING ${this.name}`);
            await __classPrivateFieldGet(this, _BaseFileCache_watcher, "f").close();
            __classPrivateFieldSet(this, _BaseFileCache_watcher, undefined, "f");
        }
        this.removeAllListeners('changed');
        this.removeAllListeners('added');
        this.removeAllListeners('unlinked');
        this.removeAllListeners('ready');
        // await sqdb.close();
    }
    /**
     * Set up receiving events from DirsWatcher, and dispatching to
     * the handler methods.
     */
    async setup() {
        const fcache = this;
        if (__classPrivateFieldGet(this, _BaseFileCache_watcher, "f")) {
            await __classPrivateFieldGet(this, _BaseFileCache_watcher, "f").close();
        }
        // this.#queue = fastq.promise(async function (event) {
        //     if (event.code === 'changed') {
        //         try {
        //             // console.log(`change ${event.name} ${event.info.vpath}`);
        //             await fcache.handleChanged(event.name, event.info);
        //             fcache.emit('change', event.name, event.info);
        //         } catch (e) {
        //             fcache.emit('error', {
        //                 code: event.code,
        //                 name: event.name,
        //                 vpath: event.info.vpath,
        //                 error: e
        //             });
        //         }
        //     } else if (event.code === 'added') {
        //         try {
        //             // console.log(`add ${event.name} ${event.info.vpath}`);
        //             await fcache.handleAdded(event.name, event.info);
        //             fcache.emit('add', event.name, event.info);
        //         } catch (e) {
        //             fcache.emit('error', {
        //                 code: event.code,
        //                 name: event.name,
        //                 vpath: event.info.vpath,
        //                 info: event.info,
        //                 error: e
        //             });
        //         }
        //     } else if (event.code === 'unlinked') {
        //         try {
        //             // console.log(`unlink ${event.name} ${event.info.vpath}`, event.info);
        //             await fcache.handleUnlinked(event.name, event.info);
        //             fcache.emit('unlink', event.name, event.info);
        //         } catch (e) {
        //             fcache.emit('error', {
        //                 code: event.code,
        //                 name: event.name,
        //                 vpath: event.info.vpath,
        //                 error: e
        //             });
        //         }
        //     /* } else if (event.code === 'error') {
        //         await fcache.handleError(event.name) */
        //     } else if (event.code === 'ready') {
        //         // await fcache.handleReady(event.name);
        //         fcache.emit('ready', event.name);
        //     }
        // }, 10);
        __classPrivateFieldSet(this, _BaseFileCache_watcher, new DirsWatcher(this.name), "f");
        __classPrivateFieldGet(this, _BaseFileCache_watcher, "f").on('change', async (name, info) => {
            // console.log(`${name} changed ${info.mountPoint} ${info.vpath}`);
            try {
                if (!this.ignoreFile(info)) {
                    // console.log(`PUSH ${name} changed ${info.mountPoint} ${info.vpath}`);
                    __classPrivateFieldGet(this, _BaseFileCache_queue, "f").push({
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
                    __classPrivateFieldGet(this, _BaseFileCache_queue, "f").push({
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
                    __classPrivateFieldGet(this, _BaseFileCache_queue, "f").push({
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
            __classPrivateFieldGet(this, _BaseFileCache_queue, "f").push({
                code: 'ready',
                name
            });
        });
        // const mapped = remapdirs(this.dirs);
        // console.log(`setup ${this.#name} watch ${util.inspect(this.#dirs)} ==> ${util.inspect(mapped)}`);
        // await this.#watcher.watch(mapped);
        // console.log(`DAO ${this.dao.table.name} ${util.inspect(this.dao.table.fields)}`);
    }
    gatherInfoData(info) {
        // Placeholder which some subclasses
        // are expected to override
        // info.renderPath = info.vpath;
    }
    cvtRowToObj(obj) {
        throw new Error(`BaseFileCache.cvtRowToObj must be overridden`);
    }
    cvtRowToObjBASE(obj, dest) {
        if (typeof obj !== 'object') {
            throw new Error(`BaseFileCache.cvtRowToObjBASE must receive an object, got ${util.inspect(obj)}`);
        }
        if (typeof obj.vpath !== 'undefined') {
            if (typeof obj.vpath !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a vpath, got ${util.inspect(obj)}`);
            }
            else {
                dest.vpath = obj.vpath;
            }
        }
        if (typeof obj.mime !== 'undefined'
            && obj.mime !== null) {
            if (typeof obj.mime !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a mime, got ${util.inspect(obj)}`);
            }
            else {
                dest.mime = obj.mime;
            }
        }
        if (typeof obj.mounted !== 'undefined') {
            if (typeof obj.mounted !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a mounted, got ${util.inspect(obj)}`);
            }
            else {
                dest.mounted = obj.mounted;
            }
        }
        if (typeof obj.mountPoint !== 'undefined') {
            if (typeof obj.mountPoint !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a mountPoint, got ${util.inspect(obj)}`);
            }
            else {
                dest.mountPoint = obj.mountPoint;
            }
        }
        if (typeof obj.pathInMounted !== 'undefined') {
            if (typeof obj.pathInMounted !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a pathInMounted, got ${util.inspect(obj)}`);
            }
            else {
                dest.pathInMounted = obj.pathInMounted;
            }
        }
        if (typeof obj.fspath !== 'undefined') {
            if (typeof obj.fspath !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a fspath, got ${util.inspect(obj)}`);
            }
            else {
                dest.fspath = obj.fspath;
            }
        }
        if (typeof obj.renderPath !== 'undefined') {
            if (typeof obj.renderPath !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a renderPath, got ${util.inspect(obj)}`);
            }
            else {
                dest.renderPath = obj.renderPath;
            }
        }
        if (typeof obj.dirname !== 'undefined') {
            if (typeof obj.dirname !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a dirname, got ${util.inspect(obj)}`);
            }
            else {
                dest.dirname = obj.dirname;
            }
        }
        if (typeof obj.rendersToHTML !== 'undefined'
            || obj.rendersToHTML === null) {
            if (typeof obj.rendersToHTML === 'number') {
                if (obj.rendersToHTML === 0) {
                    // if (obj.renderPath.match(/.*\.html$/)) {
                    //     console.log(`${obj.renderPath} === 0 === FALSE`);
                    // }
                    dest.rendersToHTML = false;
                }
                else if (obj.rendersToHTML === 1) {
                    // if (obj.renderPath.match(/.*\.html$/)) {
                    //     console.log(`${obj.renderPath} === 1 === TRUE`);
                    // }
                    dest.rendersToHTML = true;
                }
                else {
                    throw new Error(`BaseFileCache.cvtRowToObjBASE rendersToHTML incorrect value, got ${util.inspect(obj)}`);
                }
            }
            else if (obj.rendersToHTML === null) {
                dest.rendersToHTML = false;
            }
            else {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a INTEGER rendersToHTML, got ${util.inspect(obj)}`);
            }
        }
        else {
            // if (obj.renderPath.match(/.*\.html$/)) {
            //     console.log(`${obj.renderPath} default to FALSE`);
            // }
            dest.rendersToHTML = false;
        }
        // if (obj.renderPath.match(/.*\.html$/)) {
        //     console.log(`${obj.renderPath} ${obj.rendersToHTML} ${dest.rendersToHTML}`);
        // }
        if (typeof obj.mtimeMs !== 'undefined') {
            if (typeof obj.mtimeMs !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a mtimeMs, got ${util.inspect(obj)}`);
            }
            else {
                dest.mtimeMs = obj.mtimeMs;
            }
        }
        if (typeof obj.docMetadata !== 'undefined') {
            if (obj.docMetadata === null) {
                dest.docMetadata = {};
            }
            else if (typeof obj.docMetadata !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a docMetadata, got ${util.inspect(obj)}`);
            }
            else {
                dest.docMetadata = JSON.parse(obj.docMetadata);
            }
        }
        else {
            dest.docMetadata = {};
        }
        if (typeof obj.metadata !== 'undefined') {
            if (obj.metadata === null) {
                dest.metadata = {};
            }
            else if (typeof obj.metadata !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a metadata, got ${util.inspect(obj)}`);
            }
            else {
                dest.metadata = JSON.parse(obj.metadata);
            }
        }
        else {
            dest.metadata = {};
        }
        if (typeof obj.info !== 'undefined') {
            if (obj.info === null) {
                dest.info = {};
            }
            else if (typeof obj.info !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a info, got ${util.inspect(obj)}`);
            }
            else {
                dest.info = JSON.parse(obj.info);
            }
        }
        else {
            dest.info = {};
        }
    }
    /**
     * Find an info object based on vpath and mounted.
     *
     * @param vpath
     * @param mounted
     * @returns
     */
    async findPathMounted(vpath, mounted) {
        // const found = await this.dao.sqldb.all(`
        //     SELECT vpath, mounted
        //     FROM ${this.dao.table.quotedName}
        //     WHERE 
        //     vpath = $vpath AND mounted = $mounted
        // `, {
        //     $vpath: vpath,
        //     $mounted: mounted
        // });
        // const mapped = <any[]>found.map(item => {
        //     return { vpath: item.vpath, mounted: item.mounted }
        // });
        // return mapped;
    }
    /**
     * Find an info object by the vpath.
     *
     * @param vpath
     * @returns
     */
    async findByPath(vpath) {
        // console.log(`findByPath ${this.dao.table.quotedName} ${vpath}`);
        // const found = await this.dao.sqldb.all(`
        //     SELECT *
        //     FROM ${this.dao.table.quotedName}
        //     WHERE 
        //     vpath = $vpath OR renderPath = $vpath
        // `, {
        //     $vpath: vpath
        // });
        // const mapped = <any[]>found.map(item => {
        //     return this.cvtRowToObj(item);
        // });
        // for (const item of mapped) {
        //     this.gatherInfoData(item);
        // }
        // return mapped;
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
        // const result = await this.dao.selectAll({
        //     vpath: { eq: info.vpath },
        //     mounted: { eq: info.mounted }
        // } as Filter<T>);
        if (!Array.isArray(result)
            || result.length <= 0) {
            // It wasn't found in the database.  Hence
            // we should add it.
            return this.handleAdded(name, info);
        }
        info.stack = undefined;
        await this.updateDocInDB(info);
        // await this.config.hookFileChanged(name, info);
    }
    async updateDocInDB(info) {
        // await this.#dao.update({
        //     vpath: info.vpath,
        //     mime: info.mime,
        //     mounted: info.mounted,
        //     mountPoint: info.mountPoint,
        //     pathInMounted: info.pathInMounted,
        //     fspath: path.join(info.mounted, info.pathInMounted),
        //     renderPath: info.renderPath,
        //     dirname: path.dirname(info.renderPath),
        //     rendersToHTML: false,
        //     mtimeMs: new Date(info.statsMtime).toISOString(),
        //     docMetadata: info.docMetadata,
        //     // docContent: info.docContent,
        //     // docBody: info.docBody,
        //     metadata: info.metadata,
        //     info,
        // } as T);
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
        // await this.config.hookFileAdded(name, info);
    }
    async insertDocToDB(info) {
        // await this.#dao.insert({
        //     vpath: info.vpath,
        //     mime: info.mime,
        //     mounted: info.mounted,
        //     mountPoint: info.mountPoint,
        //     pathInMounted: info.pathInMounted,
        //     fspath: path.join(info.mounted, info.pathInMounted),
        //     renderPath: info.renderPath,
        //     dirname: path.dirname(info.renderPath),
        //     rendersToHTML: false,
        //     mtimeMs: new Date(info.statsMtime).toISOString(),
        //     docMetadata: info.docMetadata,
        //     // docContent: info.docContent,
        //     // docBody: info.docBody,
        //     metadata: info.metadata,
        //     info,
        // } as T);
    }
    async handleUnlinked(name, info) {
        // console.log(`PROCESS ${name} handleUnlinked`, info.vpath);
        if (name !== this.name) {
            throw new Error(`handleUnlinked event for wrong name; got ${name}, expected ${this.name}`);
        }
        // await this.config.hookFileUnlinked(name, info);
        //     await this.#dao.sqldb.run(`
        //         DELETE FROM ${this.dao.table.quotedName}
        //         WHERE
        //         vpath = $vpath AND mounted = $mounted
        //     `, {
        //         $vpath: info.vpath,
        //         $mounted: info.mounted
        //     });
        //     // await this.#dao.deleteAll({
        //     //     vpath: { eq: info.vpath },
        //     //     mounted: { eq: info.mounted }
        //     // } as Where<T>);
    }
    // async handleReady(name) {
    //     // console.log(`PROCESS ${name} handleReady`);
    //     if (name !== this.name) {
    //         throw new Error(`handleReady event for wrong name; got ${name}, expected ${this.name}`);
    //     }
    //     this.#is_ready = true;
    //     this.emit('ready', name);
    // }
    /**
     * Find the directory mount corresponding to the file.
     *
     * @param {*} info
     * @returns
     */
    fileDirMount(info) {
        // const mapped = remapdirs(this.dirs);
        // for (const dir of mapped) {
        //     // console.log(`dirMount for ${info.vpath} -- ${util.inspect(info)} === ${util.inspect(dir)}`);
        //     if (info.mountPoint === dir.mountPoint) {
        //         return dir;
        //     }
        // }
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
     * Allow a caller to wait until the <em>ready</em> event has
     * been sent from the DirsWatcher instance.  This event means the
     * initial indexing has happened.
     */
    async isReady() {
        // If there's no directories, there won't be any files 
        // to load, and no need to wait
        // while (this.#dirs.length > 0 && !this.#is_ready) {
        //     // This does a 100ms pause
        //     // That lets us check is_ready every 100ms
        //     // at very little cost
        //     // console.log(`!isReady ${this.name} ${this[_symb_dirs].length} ${this[_symb_is_ready]}`);
        //     await new Promise((resolve, reject) => {
        //         setTimeout(() => {
        //             resolve(undefined);
        //         }, 100);
        //     });
        // }
        return true;
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
        // const results = await this.dao.sqldb.all(
        // (typeof rootP === 'string') ?
        // `
        //     SELECT
        //         vpath, mime, mounted, mountPoint,
        //         pathInMounted, mtimeMs,
        //         info, fspath, renderPath
        //     FROM ${this.dao.table.quotedName}
        //     WHERE
        //     renderPath LIKE $rootP
        //     ORDER BY mtimeMs ASC
        // `
        // : `
        //     SELECT
        //         vpath, mime, mounted, mountPoint,
        //         pathInMounted, mtimeMs,
        //         info, fspath, renderPath
        //     FROM ${this.dao.table.quotedName}
        //     ORDER BY mtimeMs ASC
        // `,
        // (typeof rootP === 'string')
        // ? { $rootP: `${rootP}%` }
        // : {})
        // const selector = {
        //     order: { mtimeMs: true }
        // } as any;
        // if (typeof rootP === 'string'
        // && rootP.length >= 1) {
        //     selector.renderPath = {
        //         isLike: `${rootP}%`
        //         // sql: ` renderPath regexp '^${rootP}' `
        //     };
        // }
        // // console.log(`paths ${util.inspect(selector)}`);
        // const result = await this.dao.selectAll(selector);
        // const result2 = results.filter(item => {
        //     // console.log(`paths ?ignore? ${item.vpath}`);
        //     if (fcache.ignoreFile(item)) {
        //         return false;
        //     }
        //     if (vpathsSeen.has((item as Asset).vpath)) {
        //         return false;
        //     } else {
        //         vpathsSeen.add((item as Asset).vpath);
        //         return true;
        //     }
        // });
        // return result2;
        // This stage converts the items 
        // received by this function into
        // what is required from
        // the paths method.
        // const result4
        //         = new Array<PathsReturnType>();
        // for (const item of result3) {
        //     result4.push(<PathsReturnType>{
        //         vpath: item.vpath,
        //         mime: item.mime,
        //         mounted: item.mounted,
        //         mountPoint: item.mountPoint,
        //         pathInMounted: item.pathInMounted,
        //         mtimeMs: item.mtimeMs,
        //         info: item.info,
        //         fspath: path.join(item.mounted, item.pathInMounted),
        //         renderPath: item.vpath
        //     });
        // }
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
        // const result2 = <any[]>result1.filter(item => {
        //     return !(fcache.ignoreFile(item));
        // });
        // // for (const result of result2) {
        // //     this.gatherInfoData(result);
        // // }
        // // console.log(`find ${_fpath} ${fpath} ==> result2 ${util.inspect(result2)} `);
        // let ret;
        // if (Array.isArray(result2) && result2.length > 0) {
        //     ret = result2[0];
        // } else if (Array.isArray(result2) && result2.length <= 0) {
        //     ret = undefined;
        // } else {
        //     ret = result2;
        // }
        // return ret;
    }
    /**
     * Fulfills the "find" operation not by
     * looking in the database, but by scanning
     * the filesystem using synchronous calls.
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
        // const mapped = remapdirs(this.dirs);
        // console.log(`findSync looking for ${fpath} in ${util.inspect(mapped)}`);
        // for (const dir of mapped) {
        //     if (!(dir?.mountPoint)) {
        //         console.warn(`findSync bad dirs in ${util.inspect(this.dirs)}`);
        //     }
        //     const found = this.#fExistsInDir(fpath, dir);
        //     if (found) {
        //         // console.log(`findSync ${fpath} found`, found);
        //         return found;
        //     }
        // }
        return undefined;
    }
}
_BaseFileCache_name = new WeakMap(), _BaseFileCache_is_ready = new WeakMap(), _BaseFileCache_cache_content = new WeakMap(), _BaseFileCache_map_renderpath = new WeakMap(), _BaseFileCache_dao = new WeakMap(), _BaseFileCache_watcher = new WeakMap(), _BaseFileCache_queue = new WeakMap(), _BaseFileCache_instances = new WeakSet(), _BaseFileCache_fExistsInDir = function _BaseFileCache_fExistsInDir(fpath, dir) {
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
export class AssetsFileCache extends BaseFileCache {
    constructor(
    // config: Configuration,
    name, 
    // dirs: dirToMount[],
    dao) {
        super(name, dao);
    }
}
export class TemplatesFileCache {
    constructor(
    // config: Configuration,
    name, 
    // dirs: dirToMount[],
    dao, type) {
        // Because this class serves two purposes, Layout
        // and Partials, this flag helps to distinguish.
        // Any place, like cvtRowToObj, which needs to know
        // which is which can use these getters to do
        // the right thing.
        _TemplatesFileCache_type.set(this, void 0);
        // super(config, name, dirs, dao);
        __classPrivateFieldSet(this, _TemplatesFileCache_type, type, "f");
    }
    get isLayout() { return __classPrivateFieldGet(this, _TemplatesFileCache_type, "f") === "layout"; }
    get isPartial() { return __classPrivateFieldGet(this, _TemplatesFileCache_type, "f") === "partial"; }
    // protected cvtRowToObj(obj: any): Layout | Partial {
    //     const ret: Layout | Partial = 
    //             this.isLayout ? new Layout() : new Partial();
    //     this.cvtRowToObjBASE(obj, ret);
    //     // if (typeof obj.docMetadata !== 'undefined'
    //     //  && obj.docMetadata !== null
    //     // ) {
    //     //     if (typeof obj.docMetadata !== 'string') {
    //     //         throw new Error(`TemplatesFileCache.cvtRowToObj must have a docMetadata, got ${util.inspect(obj)}`);
    //     //     } else {
    //     //         ret.docMetadata = obj.docMetadata;
    //     //     }
    //     // }
    //     if (typeof obj.docContent !== 'undefined'
    //      && obj.docContent !== null
    //     ) {
    //         if (obj.docContent === null) {
    //             ret.docContent = undefined;
    //         } else if (typeof obj.docContent !== 'string') {
    //             throw new Error(`TemplatesFileCache.cvtRowToObj must have a docContent, got ${util.inspect(obj)}`);
    //         } else {
    //             ret.docContent = obj.docContent;
    //         }
    //     }
    //     if (typeof obj.docBody !== 'undefined'
    //      && obj.docBody !== null
    //     ) {
    //         if (obj.docBody === null) {
    //             ret.docBody = undefined;
    //         } else if (typeof obj.docBody !== 'string') {
    //             throw new Error(`TemplatesFileCache.cvtRowToObj must have a docBody, got ${util.inspect(obj)}`);
    //         } else {
    //             ret.docBody = obj.docBody;
    //         }
    //     }
    //     // if (typeof obj.metadata !== 'undefined'
    //     //  && obj.metadata !== null
    //     // ) {
    //     //     if (typeof obj.metadata !== 'string') {
    //     //         throw new Error(`TemplatesFileCache.cvtRowToObj must have a metadata, got ${util.inspect(obj)}`);
    //     //     } else {
    //     //         ret.metadata = obj.metadata;
    //     //     }
    //     // }
    //     return ret;
    // }
    /**
     * Gather the additional data suitable
     * for Partial and Layout templates.  The
     * full data set required for Documents is
     * not suitable for the templates.
     *
     * @param info
     */
    gatherInfoData(info) {
        info.renderPath = info.vpath;
        info.dirname = path.dirname(info.vpath);
        if (info.dirname === '.')
            info.dirname = '/';
        let renderer = undefined; // this.config.findRendererPath(info.vpath);
        info.renderer = renderer;
        if (renderer) {
            if (renderer.parseMetadata) {
                // Using <any> here covers over
                // that parseMetadata requires
                // a RenderingContext which
                // in turn requires a 
                // metadata object.
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
                for (let yprop in info.baseMetadata) {
                    // console.log(`initMetadata ${basedir} ${fpath} baseMetadata ${baseMetadata[yprop]}`);
                    info.metadata[yprop] = info.baseMetadata[yprop];
                }
            }
        }
        // console.log(`TemplatesFileCache after gatherInfoData `, info);
    }
    async updateDocInDB(info) {
        // await this.dao.update(({
        //     vpath: info.vpath,
        //     mime: info.mime,
        //     mounted: info.mounted,
        //     mountPoint: info.mountPoint,
        //     pathInMounted: info.pathInMounted,
        //     fspath: path.join(info.mounted, info.pathInMounted),
        //     renderPath: info.renderPath,
        //     dirname: path.dirname(info.renderPath),
        //     rendersToHTML: info.rendersToHTML,
        //     mtimeMs: new Date(info.statsMtime).toISOString(),
        //     docMetadata: info.docMetadata,
        //     docContent: info.docContent,
        //     docBody: info.docBody,
        //     metadata: info.metadata,
        //     info,
        // } as unknown) as T);
    }
    async insertDocToDB(info) {
        // await this.dao.insert(({
        //     vpath: info.vpath,
        //     mime: info.mime,
        //     mounted: info.mounted,
        //     mountPoint: info.mountPoint,
        //     pathInMounted: info.pathInMounted,
        //     fspath: path.join(info.mounted, info.pathInMounted),
        //     renderPath: info.renderPath,
        //     dirname: path.dirname(info.renderPath),
        //     rendersToHTML: info.rendersToHTML,
        //     mtimeMs: new Date(info.statsMtime).toISOString(),
        //     docMetadata: info.docMetadata,
        //     docContent: info.docContent,
        //     docBody: info.docBody,
        //     metadata: info.metadata,
        //     info,
        // } as unknown) as T);
    }
}
_TemplatesFileCache_type = new WeakMap();
export class DocumentsFileCache {
    constructor() {
        // constructor(
        //     config: Configuration,
        //     name: string,
        //     dirs: dirToMount[]
        // ) {
        //     super(config, name, dirs, documentsDAO);
        // }
        // This is a simple cache to hold results
        // of search operations.  The key side of this
        // Map is meant to be the stringified selector.
        this.searchCache = new Map();
        // Skip tags for now.  Should be easy.
        // For tags support, this can be useful
        //  -- https://antonz.org/json-virtual-columns/
        // It shows how to do generated columns
        // from fields in JSON
        // But, how to do generated columns
        // using SQLITE3ORM?
        // https://antonz.org/sqlean-regexp/ -- RegExp
        // extension for SQLITE3
        // https://github.com/asg017/sqlite-regex includes
        // a node.js package
        // https://www.npmjs.com/package/sqlite-regex
    }
    cvtRowToObj(obj) {
        const ret = new Document();
        // this.cvtRowToObjBASE(obj, ret);
        // if (typeof obj.docMetadata !== 'undefined'
        //  && obj.docMetadata !== null
        // ) {
        //     if (typeof obj.docMetadata !== 'string') {
        //         throw new Error(`DocumentsFileCache.cvtRowToObj must have a docMetadata, got ${util.inspect(obj)}`);
        //     } else {
        //         ret.docMetadata = obj.docMetadata;
        //     }
        // }
        if (typeof obj.publicationTime !== 'undefined'
            && obj.publicationTime !== null) {
            if (typeof obj.publicationTime !== 'number') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a publicationTime, got ${util.inspect(obj)}`);
            }
            else {
                // ret.publicationTime = obj.publicationTime;
            }
        }
        if (typeof obj.docContent !== 'undefined'
            && obj.docContent !== null) {
            if (typeof obj.docContent !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a docContent, got ${util.inspect(obj)}`);
            }
            else {
                // ret.docContent = obj.docContent;
            }
        }
        if (typeof obj.docBody !== 'undefined'
            && obj.docBody !== null) {
            if (typeof obj.docBody !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a docBody, got ${util.inspect(obj)}`);
            }
            else {
                // ret.docBody = obj.docBody;
            }
        }
        if (typeof obj.layout !== 'undefined'
            && obj.layout !== null) {
            if (typeof obj.layout !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a layout, got ${util.inspect(obj)}`);
            }
            else {
                // ret.layout = obj.layout;
            }
        }
        if (typeof obj.blogtag !== 'undefined'
            && obj.blogtag !== null) {
            if (typeof obj.blogtag !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a blogtag, got ${util.inspect(obj)}`);
            }
            else {
                // ret.blogtag = obj.blogtag;
            }
        }
        // if (typeof obj.metadata !== 'undefined'
        //  && obj.metadata !== null
        // ) {
        //     if (typeof obj.metadata !== 'string') {
        //         throw new Error(`DocumentsFileCache.cvtRowToObj must have a metadata, got ${util.inspect(obj)}`);
        //     } else {
        //         ret.metadata = obj.metadata;
        //     }
        // }
        return ret;
    }
    gatherInfoData(info) {
        info.renderPath = info.vpath;
        info.dirname = path.dirname(info.vpath);
        if (info.dirname === '.')
            info.dirname = '/';
        info.parentDir = path.dirname(info.dirname);
        // find the mounted directory,
        // get the baseMetadata
        // for (let dir of remapdirs(this.dirs)) {
        //     if (dir.mounted === info.mounted) {
        //         if (dir.baseMetadata) {
        //             info.baseMetadata = dir.baseMetadata;
        //         }
        //         break;
        //     }
        // }
        // set publicationDate somehow
        // let renderer = this.config.findRendererPath(info.vpath);
        // info.renderer = renderer;
        if ( /*renderer*/false) {
            // info.renderPath
            //     = renderer.filePath(info.vpath);
            // This was in the LokiJS code, but
            // was not in use.
            // info.rendername = path.basename(
            //     info.renderPath
            // );
            info.rendersToHTML =
                micromatch.isMatch(info.renderPath, '**/*.html')
                    || micromatch.isMatch(info.renderPath, '*.html')
                    ? true : false;
            // if (renderer.parseMetadata) {
            //     // Using <any> here covers over
            //     // that parseMetadata requires
            //     // a RenderingContext which
            //     // in turn requires a 
            //     // metadata object.
            //     const rc = renderer.parseMetadata(<any>{
            //         fspath: info.fspath,
            //         content: FS.readFileSync(info.fspath, 'utf-8')
            //     });
            //     // docMetadata is the unmodified metadata/frontmatter
            //     // in the document
            //     info.docMetadata = rc.metadata;
            //     // docContent is the unparsed original content
            //     // including any frontmatter
            //     info.docContent = rc.content;
            //     // docBody is the parsed body -- e.g. following the frontmatter
            //     info.docBody = rc.body;
            //     // This is the computed metadata that includes data from 
            //     // several sources
            //     info.metadata = { };
            //     if (!info.docMetadata) info.docMetadata = {};
            //     // The rest of this is adapted from the old function
            //     // HTMLRenderer.newInitMetadata
            //     // For starters the metadata is collected from several sources.
            //     // 1) the metadata specified in the directory mount where
            //     //    this document was found
            //     // 2) metadata in the project configuration
            //     // 3) the metadata in the document, as captured in docMetadata
            //     for (let yprop in info.baseMetadata) {
            //         // console.log(`initMetadata ${basedir} ${fpath} baseMetadata ${baseMetadata[yprop]}`);
            //         info.metadata[yprop] = info.baseMetadata[yprop];
            //     }
            //     for (let yprop in this.config.metadata) {
            //         info.metadata[yprop] = this.config.metadata[yprop];
            //     }
            //     let fmmcount = 0;
            //     for (let yprop in info.docMetadata) {
            //         info.metadata[yprop] = info.docMetadata[yprop];
            //         fmmcount++;
            //     }
            //     // The rendered version of the content lands here
            //     info.metadata.content = "";
            //     // The document object has been useful for 
            //     // communicating the file path and other data.
            //     info.metadata.document = {};
            //     info.metadata.document.basedir = info.mountPoint;
            //     info.metadata.document.relpath = info.pathInMounted;
            //     info.metadata.document.relrender = renderer.filePath(info.pathInMounted);
            //     info.metadata.document.path = info.vpath;
            //     info.metadata.document.renderTo = info.renderPath;
            //     // Ensure the <em>tags</em> field is an array
            //     if (!(info.metadata.tags)) {
            //         info.metadata.tags = [];
            //     } else if (typeof (info.metadata.tags) === 'string') {
            //         let taglist = [];
            //         const re = /\s*,\s*/;
            //         info.metadata.tags.split(re).forEach(tag => {
            //             taglist.push(tag.trim());
            //         });
            //         info.metadata.tags = taglist;
            //     } else if (!Array.isArray(info.metadata.tags)) {
            //         throw new Error(
            //             `FORMAT ERROR - ${info.vpath} has badly formatted tags `,
            //             info.metadata.tags);
            //     }
            //     info.docMetadata.tags = info.metadata.tags;
            //     // if (info.metadata.blogtag) {
            //     //     info.blogtag = info.metadata.blogtag;
            //     // }
            //     // The root URL for the project
            //     info.metadata.root_url = this.config.root_url;
            //     // Compute the URL this document will render to
            //     if (this.config.root_url) {
            //         let uRootUrl = new URL(this.config.root_url, 'http://example.com');
            //         uRootUrl.pathname = path.normalize(
            //                 path.join(uRootUrl.pathname, info.metadata.document.renderTo)
            //         );
            //         info.metadata.rendered_url = uRootUrl.toString();
            //     } else {
            //         info.metadata.rendered_url = info.metadata.document.renderTo;
            //     }
            //     // info.metadata.rendered_date = info.stats.mtime;
            //     const parsePublDate = (date) => {
            //         const parsed = Date.parse(date);
            //         if (! isNaN(parsed)) {
            //             info.metadata.publicationDate = new Date(parsed);
            //             info.publicationDate = info.metadata.publicationDate;
            //             info.publicationTime = info.publicationDate.getTime();
            //         }
            //     };
            //     if (info.docMetadata
            //      && typeof info.docMetadata.publDate === 'string') {
            //         parsePublDate(info.docMetadata.publDate);
            //     }
            //     if (info.docMetadata
            //      && typeof info.docMetadata.publicationDate === 'string') {
            //         parsePublDate(info.docMetadata.publicationDate);
            //     }
            //     if (!info.metadata.publicationDate) {
            //         var dateSet = false;
            //         if (info.docMetadata
            //          && info.docMetadata.publDate) {
            //             parsePublDate(info.docMetadata.publDate);
            //             dateSet = true;
            //         }
            //         if (info.docMetadata
            //          && typeof info.docMetadata.publicationDate === 'string') {
            //             parsePublDate(info.docMetadata.publicationDate);
            //             dateSet = true;
            //         }
            //         if (! dateSet && info.mtimeMs) {
            //             info.metadata.publicationDate = new Date(info.mtimeMs);
            //             info.publicationDate = info.metadata.publicationDate;
            //             info.publicationTime = info.publicationDate.getTime();
            //             // console.log(`${info.vpath} metadata.publicationDate ${info.metadata.publicationDate} set from stats.mtime`);
            //         }
            //         if (!info.metadata.publicationDate) {
            //             info.metadata.publicationDate = new Date();
            //             info.publicationDate = info.metadata.publicationDate;
            //             info.publicationTime = info.publicationDate.getTime();
            //             // console.log(`${info.vpath} metadata.publicationDate ${info.metadata.publicationDate} set from current time`);
            //         }
            //     }
            // }
        }
    }
    async deleteDocTagGlue(vpath) {
        try {
            // await tglue.deleteTagGlue(vpath);
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
        // await tglue.addTagGlue(vpath, 
        //     Array.isArray(tags)
        //     ? tags
        //     : [ tags ]);
    }
    async addTagDescription(tag, description) {
        // return tdesc.addDesc(tag, description);
    }
    async getTagDescription(tag) {
        // return tdesc.getDesc(tag);
    }
    async updateDocInDB(info) {
        // const docInfo = <Document>{
        //     vpath: info.vpath,
        //     mime: info.mime,
        //     mounted: info.mounted,
        //     mountPoint: info.mountPoint,
        //     pathInMounted: info.pathInMounted,
        //     fspath: path.join(info.mounted, info.pathInMounted),
        //     renderPath: info.renderPath,
        //     rendersToHTML:
        //         typeof info.rendersToHTML === 'undefined'
        //         ? false
        //         : info.rendersToHTML,
        //     dirname: path.dirname(info.renderPath),
        //     parentDir: info.parentDir,
        //     mtimeMs: new Date(info.statsMtime).toISOString(),
        //     baseMetadata: info.baseMetadata,
        //     docMetadata: info.docMetadata,
        //     docContent: info.docContent,
        //     docBody: info.docBody,
        //     metadata: info.metadata,
        //     tags: Array.isArray(info.metadata?.tags)
        //             ? info.metadata.tags
        //             : [],
        //     // layout: info.layout, // info.metadata?.layout,
        //     // blogtag: info.blogtag,
        //     info,
        // };
        // await this.dao.update(docInfo);
        // await tglue.deleteTagGlue(docInfo.vpath);
        // await tglue.addTagGlue(docInfo.vpath, docInfo.tags);
    }
    async insertDocToDB(info) {
        if (typeof info.rendersToHTML === 'undefined'
            || info.rendersToHTML === null) {
            info.rendersToHTML = false;
        }
        if (!info.baseMetadata)
            info.baseMetadata = {};
        if (!info.docMetadata)
            info.docMetadata = {};
        if (!info.docContent)
            info.docContent = '';
        if (!info.docBody)
            info.docBody = '';
        if (!info.metadata)
            info.metadata = {};
        if (!Array.isArray(info.metadata?.tags))
            info.metadata.tags = [];
        if (!info.metadata.layout)
            info.metadata.layout = '';
        if (!info.metadata.blogtag)
            info.metadata.blogtag = '';
        // const siblings = await this.dao.sqldb.run(
        //     `INSERT INTO DOCUMENTS
        //         (
        //          vpath, mime,
        //          mounted, mountPoint, pathInMounted,
        //          fspath, renderPath,
        //          rendersToHTML,
        //          dirname, parentDir,
        //          mtimeMs,
        //          docMetadata,
        //          docContent,
        //          docBody,
        //          info
        //         )
        //         VALUES (
        //          $vpath, $mime,
        //          $mounted, $mountPoint, $pathInMounted,
        //          $fspath, $renderPath,
        //          $rendersToHTML,
        //          $dirname, $parentDir,
        //          $mtimeMs,
        //          $docMetadata,
        //          $docContent,
        //          $docBody,
        //          $info
        //         )
        //     `, {
        //         $vpath: info.vpath,
        //         $mime: info.mime,
        //         $mounted: info.mounted,
        //         $mountPoint: info.mountPoint,
        //         $pathInMounted: info.pathInMounted,
        //         $fspath: path.join(
        //             info.mounted, info.pathInMounted
        //         ),
        //         $renderPath: info.renderPath,
        //         $rendersToHTML: info.rendersToHTML,
        //         $dirname: path.dirname(info.renderPath),
        //         $parentDir: path.dirname(
        //             path.dirname(
        //                 info.renderPath
        //         )),
        //         $mtimeMs: new Date(info.statsMtime).toISOString(),
        //         // $baseMetadata: JSON.stringify(info.baseMetadata),
        //         $docMetadata: JSON.stringify(info.docMetadata),
        //         $docContent: info.docContent,
        //         $docBody: info.docBody,
        //         // $metadata: JSON.stringify(info.metadata),
        //         $info: JSON.stringify(info)
        //     }
        // )
        // // await this.dao.insert(docInfo);
        await this.addDocTagGlue(info.vpath, info.metadata.tags);
    }
    async handleUnlinked(name, info) {
        // await super.handleUnlinked(name, info);
        // tglue.deleteTagGlue(info.vpath);
    }
    async indexChain(_fpath) {
        const fpath = _fpath.startsWith('/')
            ? _fpath.substring(1)
            : _fpath;
        const parsed = path.parse(fpath);
        // console.log(`indexChain ${_fpath} ${fpath}`, parsed);
        const filez = [];
        // const self = await this.findByPath(fpath);
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
            // const index = await this.findByPath(lookFor);
            // if (Array.isArray(index) && index.length >= 1) {
            //     filez.push(index[0]);
            // }
            fileName = lookFor;
            dirName = path.dirname(lookFor);
        }
        return filez
            .map(function (obj) {
            obj.foundDir = obj.mountPoint;
            obj.foundPath = obj.renderPath;
            obj.filename = '/' + obj.renderPath;
            return obj;
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
        // const siblings = await this.dao.sqldb.all(`
        //     SELECT * FROM ${this.dao.table.quotedName}
        //     WHERE
        //     dirname = $dirname AND
        //     vpath <> $vpath AND
        //     renderPath <> $vpath AND
        //     rendersToHtml = true
        // `, {
        //     $dirname: dirname,
        //     $vpath: vpath
        // });
        // const ignored = siblings.filter(item => {
        //     return !this.ignoreFile(item);
        // });
        // const mapped = ignored.map(item => {
        //     return this.cvtRowToObj(item);
        // });
        // return mapped;
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
        // let rootItem = await this.find(
        //         _rootItem.startsWith('/')
        //             ? _rootItem.substring(1)
        //             : _rootItem);
        // if (!rootItem) {
        //     // console.warn(`childItemTree no rootItem found for path ${_rootItem}`);
        //     return undefined;
        // }
        // if (!(typeof rootItem === 'object')
        //  || !('vpath' in rootItem)
        // ) {
        //     // console.warn(`childItemTree found invalid object for ${_rootItem} - ${util.inspect(rootItem)}`);
        //     return undefined;
        // }
        // let dirname = path.dirname(rootItem.vpath);
        // // Picks up everything from the current level.
        // // Differs from siblings by getting everything.
        // const items = await this.dao.selectAll({
        //     dirname: { eq: dirname },
        //     rendersToHTML: true
        // }) as unknown[] as any[];
        // const childFolders = await this.dao.sqldb.all(
        //     `SELECT distinct dirname FROM DOCUMENTS
        //     WHERE parentDir = '${dirname}'`
        // ) as unknown[] as Document[];
        // const cfs = [];
        // for (const cf of childFolders) {
        //     cfs.push(await this.childItemTree(
        //         path.join(cf.dirname, 'index.html')
        //     ));
        // }
        // return {
        //     rootItem,
        //     dirname,
        //     items: items,
        //     // Uncomment this to generate simplified output
        //     // for debugging.
        //     // .map(item => {
        //     //     return {
        //     //         vpath: item.vpath,
        //     //         renderPath: item.renderPath
        //     //     }
        //     // }),
        //     childFolders: cfs
        // }
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
        // return this.dao.sqldb.all(`
        // SELECT *
        // FROM DOCUMENTS
        // WHERE
        //     ( rendersToHTML = true )
        // AND (
        //     ( renderPath LIKE '%/index.html' )
        //  OR ( renderPath = 'index.html' )
        // )
        // ${rootQ}
        // `);
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
     * ????? Why would this be useful?
     * I can see doing this for the rendered
     * files in the output directory.  But this is
     * for the files in the documents directories. ????
     */
    async setTimes() {
        // await this.dao.selectEach(
        //     (err, model) => {
        //         const setter = async (date) => {
        //             const parsed = Date.parse(date);;
        //             if (! isNaN(parsed)) {
        //                 const dp = new Date(parsed);
        //                 FS.utimesSync(
        //                     model.fspath,
        //                     dp,
        //                     dp
        //                 );
        //             } 
        //         }
        //         if (model.info.docMetadata
        //          && model.info.docMetadata.publDate) {
        //             setter(model.info.docMetadata.publDate);
        //         }
        //         if (model.info.docMetadata
        //          && model.info.docMetadata.publicationDate) {
        //             setter(model.info.docMetadata.publicationDate);
        //         }
        //     },
        //     {} as Where<Document>
        // );
    }
    /**
     * Retrieve the documents which have tags.
     *
     * TODO - Is this function used anywhere?
     *   It is not referenced in akasharender, nor
     *   in any plugin that I can find.
     *
     * @returns
     */
    // async documentsWithTags() {
    //     const docs = new Array<Document>();
    //     await this.dao.selectEach(
    //         (err, doc) => {
    //             if (doc
    //              && doc.docMetadata
    //              && doc.docMetadata.tags
    //              && Array.isArray(
    //                 doc.docMetadata.tags
    //              )
    //              && doc.docMetadata.tags.length >= 1
    //             ) {
    //                 docs.push(doc);
    //             }
    //         },
    //         {
    //             rendersToHTML: { eq: true },
    //             info: { isNotNull: true }
    //         } as Where<Document>
    //     );
    //     // console.log(docs);
    //     return docs;
    // }
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
        // const vpaths = await tglue.pathsForTag(tags);
        // console.log(vpaths);
        // if (!Array.isArray(vpaths)) {
        //     throw new Error(`documentsWithTag non-Array result ${util.inspect(vpaths)}`);
        // }
        // return vpaths;
    }
    /**
     * Get an array of tags used by all documents.
     * This uses the JSON extension to extract
     * the tags from the metadata object.
     *
     * @returns
     */
    async tags() {
        // const tags = await tglue.tags();
        // const ret = Array.from(tags);
        // return ret.sort((a: string, b: string) => {
        //     var tagA = a.toLowerCase();
        //     var tagB = b.toLowerCase();
        //     if (tagA < tagB) return -1;
        //     if (tagA > tagB) return 1;
        //     return 0;
        // });
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
        // const found = await this.dao.sqldb.all(`
        //     SELECT *
        //     FROM ${this.dao.table.quotedName}
        //     WHERE 
        //     vpath = $vpath OR renderPath = $vpath
        // `, {
        //     $vpath: vpath
        // });
        // if (Array.isArray(found)) {
        //     // const docInfo = await this.find(vpath);
        //     return {
        //         vpath,
        //         renderPath: found[0].renderPath,
        //         title: found[0].metadata.title,
        //         teaser: found[0].metadata.teaser,
        //         // thumbnail
        //     };
        // } else {
        //     return {
        //         vpath,
        //         renderPath: undefined,
        //         title: undefined
        //     };
        // }
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
        const cached = this.searchCache.get(cacheKey);
        // console.log(`search ${util.inspect(options)} ==> ${cacheKey} ${cached ? 'hasCached' : 'noCached'}`);
        // If the cache has an entry, skip computing
        // anything.
        if (cached
            && Date.now() - cached.timestamp < 60000) { // 1 minute cache
            return cached.results;
        }
        // NOTE: Entries are added to the cache at the bottom
        // of this function
        try {
            const { sql, params } = this.buildSearchQuery(options);
            // console.log(`search ${sql}`);
            // const results = await this.dao.sqldb.all(sql, params);
            // Convert raw SQL results to Document objects
            // const documents = results.map(row => {
            //     return this.cvtRowToObj(row);
            // });
            // Gather additional info data for each result FIRST
            // This is crucial because filters and sort functions may depend on this data
            // for (const item of documents) {
            //     this.gatherInfoData(item);
            // }
            // Apply post-SQL filters that can't be done in SQL
            let filteredResults = []; // documents;
            // Filter by renderers (requires config lookup)
            if (options.renderers
                && Array.isArray(options.renderers)) {
                filteredResults = filteredResults.filter(item => {
                    // let renderer = fcache.config.findRendererPath(item.vpath);
                    // if (!renderer) return false;
                    let found = false;
                    // for (const r of options.renderers) {
                    //     if (typeof r === 'string' && r === renderer.name) {
                    //         found = true;
                    //     } else if (typeof r === 'object' || typeof r === 'function') {
                    //         console.error('WARNING: Matching renderer by object class is no longer supported', r);
                    //     }
                    // }
                    return found;
                });
            }
            // Apply custom filter function
            // if (options.filterfunc) {
            //     filteredResults = filteredResults.filter(item => {
            //         return options.filterfunc(fcache.config, options, item);
            //     });
            // }
            // Apply custom sort function (if SQL sorting wasn't used)
            if (typeof options.sortFunc === 'function') {
                filteredResults = filteredResults.sort(options.sortFunc);
            }
            // Add the results to the cache
            if (true) {
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
        let sql = `SELECT DISTINCT d.* FROM $ {this.dao.table.quotedName} d`;
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
            if (options.sortBy === 'publicationDate' || options.sortBy === 'publicationTime') {
                // Use COALESCE to handle null publication dates
                orderBy = `ORDER BY COALESCE(
                    json_extract(d.metadata, '$.publicationDate'), 
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
// export var assetsCache: AssetsFileCache< Asset, typeof assetsDAO>;
// export var partialsCache: TemplatesFileCache<Partial, typeof partialsDAO>;
// export var layoutsCache: TemplatesFileCache<Layout, typeof layoutsDAO>;
// export var documentsCache: DocumentsFileCache;
export async function setup(
// config: Configuration
) {
    // assetsCache = new AssetsFileCache<Asset, TassetsDAO>(
    //     config,
    //     'assets',
    //     config.assetDirs,
    //     assetsDAO
    // );
    // await assetsCache.setup();
    // assetsCache.on('error', (...args) => {
    //     console.error(`assetsCache ERROR ${util.inspect(args)}`)
    // });
    // partialsCache = new TemplatesFileCache<
    //         Partial, TpartialsDAO
    // >(
    //     config,
    //     'partials',
    //     config.partialsDirs,
    //     partialsDAO,
    //     "partial"
    // );
    // await partialsCache.setup();
    // partialsCache.on('error', (...args) => {
    //     console.error(`partialsCache ERROR ${util.inspect(args)}`)
    // });
    // layoutsCache = new TemplatesFileCache<
    //         Layout, TlayoutsDAO
    // >(
    //     config,
    //     'layouts',
    //     config.layoutDirs,
    //     layoutsDAO,
    //     "layout"
    // );
    // await layoutsCache.setup();
    // layoutsCache.on('error', (...args) => {
    //     console.error(`layoutsCache ERROR ${util.inspect(args)}`)
    // });
    // // console.log(`DocumentsFileCache 'documents' ${util.inspect(config.documentDirs)}`);
    // documentsCache = new DocumentsFileCache(
    //     config,
    //     'documents',
    //     config.documentDirs
    // );
    // await documentsCache.setup();
    // documentsCache.on('error', (err) => {
    //     console.error(`documentsCache ERROR ${util.inspect(err)}`);
    // });
    // await config.hookPluginCacheSetup();
}
export async function closeFileCaches() {
    // if (documentsCache) {
    //     await documentsCache.close();
    //     documentsCache = undefined;
    // }
    // if (assetsCache) {
    //     await assetsCache.close();
    //     assetsCache = undefined;
    // }
    // if (layoutsCache) {
    //     await layoutsCache.close();
    //     layoutsCache = undefined;
    // }
    // if (partialsCache) {
    //     await partialsCache.close();
    //     partialsCache = undefined;
    // }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1jYWNoZS1zcWxpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvZmlsZS1jYWNoZS1zcWxpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxFQUFFLFdBQVcsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUM3RSxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRzdCLE9BQU8sRUFBRSxNQUFNLElBQUksQ0FBQztBQUNwQixPQUFPLFlBQVksTUFBTSxRQUFRLENBQUM7QUFDbEMsT0FBTyxVQUFVLE1BQU0sWUFBWSxDQUFDO0FBc2tCcEMsTUFBTSxPQUFPLGFBR1gsU0FBUSxZQUFZO0lBV2xCOzs7OztPQUtHO0lBQ0g7SUFDSSx5QkFBeUI7SUFDekIsSUFBWTtJQUNaLHNCQUFzQjtJQUN0QixHQUFTLENBQUMsYUFBYTs7UUFFdkIsS0FBSyxFQUFFLENBQUM7O1FBckJaLDJCQUEyQjtRQUMzQixzQ0FBZTtRQUNmLHdCQUF3QjtRQUN4QixrQ0FBcUIsS0FBSyxFQUFDO1FBQzNCLCtDQUF3QjtRQUN4QixnREFBeUI7UUFDekIscUNBQVcsQ0FBQyxjQUFjO1FBbUMxQix1QkFBdUI7UUFHdkIseUNBQXNCO1FBQ3RCLHVDQUFPO1FBdkJILCtFQUErRTtRQUMvRSx5QkFBeUI7UUFDekIsdUJBQUEsSUFBSSx1QkFBUyxJQUFJLE1BQUEsQ0FBQztRQUNsQixxQkFBcUI7UUFDckIsdUJBQUEsSUFBSSwyQkFBYSxLQUFLLE1BQUEsQ0FBQztRQUN2Qix1QkFBQSxJQUFJLGdDQUFrQixLQUFLLE1BQUEsQ0FBQztRQUM1Qix1QkFBQSxJQUFJLGlDQUFtQixLQUFLLE1BQUEsQ0FBQztRQUM3Qix1QkFBQSxJQUFJLHNCQUFRLEdBQUcsTUFBQSxDQUFDO0lBQ3BCLENBQUM7SUFFRCw0Q0FB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QztJQUNsQyxJQUFJO0lBQ0oscUJBQXFCO0lBQ3JCLGlDQUFpQztJQUNqQywrQkFBK0I7SUFDL0IsSUFBSTtJQUNKLHNCQUFzQjtJQUN0QixrQ0FBa0M7SUFDbEMsZ0NBQWdDO0lBQ2hDLElBQUk7SUFDSix1QkFBdUI7SUFDdkIsbUNBQW1DO0lBQ25DLGlDQUFpQztJQUNqQyxJQUFJO0FBQ1IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBEaXJzV2F0Y2hlciwgZGlyVG9XYXRjaCwgVlBhdGhEYXRhIH0gZnJvbSAnQGFrYXNoYWNtcy9zdGFja2VkLWRpcnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgdXJsICBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gJ2ZzJztcbmltcG9ydCBGUyBmcm9tICdmcyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcblxuLy8gaW1wb3J0IHtcbi8vICAgICBmaWVsZCxcbi8vICAgICBGaWVsZE9wdHMsXG4vLyAgICAgZmssXG4vLyAgICAgaWQsXG4vLyAgICAgaW5kZXgsXG4vLyAgICAgdGFibGUsXG4vLyAgICAgVGFibGVPcHRzLFxuLy8gICAgIFNxbERhdGFiYXNlLFxuLy8gICAgIHNjaGVtYSxcbi8vICAgICBCYXNlREFPLFxuLy8gICAgIEZpbHRlcixcbi8vICAgICBXaGVyZVxuLy8gfSBmcm9tICdzcWxpdGUzb3JtJztcblxuLy8gaW1wb3J0IHsgc3FkYiB9IGZyb20gJy4uL3NxZGIuanMnO1xuLy8gaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgZGlyVG9Nb3VudCB9IGZyb20gJy4uL2luZGV4LmpzJztcbi8vIGltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG4vLyBpbXBvcnQgeyBUYWdHbHVlLCBUYWdEZXNjcmlwdGlvbnMgfSBmcm9tICcuL3RhZy1nbHVlLmpzJztcblxuLy8vLy8vLy8vLy8vLyBBc3NldHMgdGFibGVcblxuLy8gQHRhYmxlKHtcbi8vICAgICBuYW1lOiAnQVNTRVRTJyxcbi8vICAgICB3aXRob3V0Um93SWQ6IHRydWUsXG4vLyB9IGFzIFRhYmxlT3B0cylcbi8vIGV4cG9ydCBjbGFzcyBBc3NldCB7XG5cbi8vICAgICAvLyBQcmltYXJ5IGtleVxuLy8gICAgIEBpZCh7XG4vLyAgICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2Fzc2V0X3ZwYXRoJylcbi8vICAgICB2cGF0aDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ21pbWUnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgbWltZTogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdhc3NldF9tb3VudGVkJylcbi8vICAgICBtb3VudGVkOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2Fzc2V0X21vdW50UG9pbnQnKVxuLy8gICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnYXNzZXRfcGF0aEluTW91bnRlZCcpXG4vLyAgICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2Fzc2V0X2ZzcGF0aCcpXG4vLyAgICAgZnNwYXRoOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2Fzc2V0X3JlbmRlclBhdGgnKVxuLy8gICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkaXJuYW1lJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnYXNzZXRfZGlybmFtZScpXG4vLyAgICAgZGlybmFtZTogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ3JlbmRlcnNUb0hUTUwnLCBkYnR5cGU6ICdJTlRFR0VSJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdhc3NldHNfcmVuZGVyc1RvSFRNTCcpXG4vLyAgICAgcmVuZGVyc1RvSFRNTDogYm9vbGVhbjtcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtdGltZU1zJyxcbi8vICAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2Fzc2V0X210aW1lTXMnKVxuLy8gICAgIG10aW1lTXM6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLFxuLy8gICAgICAgICBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnYXNzZXRfZG9jTWV0YWRhdGEnKVxuLy8gICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJyxcbi8vICAgICAgICAgaXNKc29uOiB0cnVlXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2Fzc2V0X21ldGFkYXRhJylcbi8vICAgICBtZXRhZGF0YTogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJyxcbi8vICAgICAgICAgaXNKc29uOiB0cnVlXG4vLyAgICAgfSlcbi8vICAgICBpbmZvOiBhbnk7XG5cbi8vIH1cblxuLy8gYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0FTU0VUU1paWlpaWlpaJyk7XG4vLyB0eXBlIFRhc3NldHNEQU8gPSBCYXNlREFPPEFzc2V0Pjtcbi8vIGV4cG9ydCBjb25zdCBhc3NldHNEQU86IFRhc3NldHNEQU9cbiAgICAvLyA9IG5ldyBCYXNlREFPPEFzc2V0PihBc3NldCwgc3FkYik7XG5cbi8vIGF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfdnBhdGgnKTtcbi8vIGF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfbW91bnRlZCcpO1xuLy8gYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9tb3VudFBvaW50Jyk7XG4vLyBhd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X3BhdGhJbk1vdW50ZWQnKTtcbi8vIGF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfZnNwYXRoJyk7XG4vLyBhd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X3JlbmRlclBhdGgnKTtcbi8vIGF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRzX3JlbmRlcnNUb0hUTUwnKTtcbi8vIGF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfZGlybmFtZScpO1xuLy8gYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9tdGltZU1zJyk7XG4vLyBhd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X2RvY01ldGFkYXRhJyk7XG4vLyBhd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X21ldGFkYXRhJyk7XG5cbi8vLy8vLy8vLy8vLyBQYXJ0aWFscyBUYWJsZVxuXG4vLyBAdGFibGUoe1xuLy8gICAgIG5hbWU6ICdQQVJUSUFMUycsXG4vLyAgICAgd2l0aG91dFJvd0lkOiB0cnVlLFxuLy8gfSlcbi8vIGV4cG9ydCBjbGFzcyBQYXJ0aWFsIHtcblxuLy8gICAgIC8vIFByaW1hcnkga2V5XG4vLyAgICAgQGlkKHtcbi8vICAgICAgICAgbmFtZTogJ3ZwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgncGFydGlhbF92cGF0aCcpXG4vLyAgICAgdnBhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtaW1lJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIG1pbWU6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgncGFydGlhbF9tb3VudGVkJylcbi8vICAgICBtb3VudGVkOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ3BhcnRpYWxfbW91bnRQb2ludCcpXG4vLyAgICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ3BhdGhJbk1vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdwYXJ0aWFsX3BhdGhJbk1vdW50ZWQnKVxuLy8gICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdmc3BhdGgnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdwYXJ0aWFsX2ZzcGF0aCcpXG4vLyAgICAgZnNwYXRoOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ3BhcnRpYWxfcmVuZGVyUGF0aCcpXG4vLyAgICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2Rpcm5hbWUnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdwYXJ0aWFsX2Rpcm5hbWUnKVxuLy8gICAgIGRpcm5hbWU6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdyZW5kZXJzVG9IVE1MJywgZGJ0eXBlOiAnSU5URUdFUidcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgncGFydGlhbF9yZW5kZXJzVG9IVE1MJylcbi8vICAgICByZW5kZXJzVG9IVE1MOiBib29sZWFuO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuLy8gICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgncGFydGlhbF9tdGltZU1zJylcbi8vICAgICBtdGltZU1zOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZG9jTWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4vLyAgICAgfSlcbi8vICAgICBkb2NNZXRhZGF0YTogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2RvY0NvbnRlbnQnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgZG9jQ29udGVudDogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2RvY0JvZHknLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgZG9jQm9keTogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ21ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsXG4vLyAgICAgICAgIGlzSnNvbjogdHJ1ZVxuLy8gICAgIH0pXG4vLyAgICAgbWV0YWRhdGE6IGFueTtcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdpbmZvJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuLy8gICAgIH0pXG4vLyAgICAgaW5mbzogYW55O1xuLy8gfVxuXG4vLyBhd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnUEFSVElBTFNaWlpaWlpaJyk7XG4vLyB0eXBlIFRwYXJ0aWFsc0RBTyA9IEJhc2VEQU88UGFydGlhbD47XG4vLyBleHBvcnQgY29uc3QgcGFydGlhbHNEQU9cbiAgICAvLyA9IG5ldyBCYXNlREFPPFBhcnRpYWw+KFBhcnRpYWwsIHNxZGIpO1xuXG4vLyBhd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF92cGF0aCcpO1xuLy8gYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfbW91bnRlZCcpO1xuLy8gYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfbW91bnRQb2ludCcpO1xuLy8gYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfcGF0aEluTW91bnRlZCcpO1xuLy8gYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfZnNwYXRoJyk7XG4vLyBhd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9yZW5kZXJQYXRoJyk7XG4vLyBhd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9kaXJuYW1lJyk7XG4vLyBhd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9yZW5kZXJzVG9IVE1MJyk7XG4vLyBhd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9tdGltZU1zJyk7XG5cbi8vLy8vLy8vLy8vLy8vLy8vIExheW91dHMgVGFibGVcblxuLy8gQHRhYmxlKHtcbi8vICAgICBuYW1lOiAnTEFZT1VUUycsXG4vLyAgICAgd2l0aG91dFJvd0lkOiB0cnVlLFxuLy8gfSlcbi8vIGV4cG9ydCBjbGFzcyBMYXlvdXQge1xuXG4vLyAgICAgLy8gUHJpbWFyeSBrZXlcbi8vICAgICBAaWQoe1xuLy8gICAgICAgICBuYW1lOiAndnBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdsYXlvdXRfdnBhdGgnKVxuLy8gICAgIHZwYXRoOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBtaW1lOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2xheW91dF9tb3VudGVkJylcbi8vICAgICBtb3VudGVkOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2xheW91dF9tb3VudFBvaW50Jylcbi8vICAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2xheW91dF9wYXRoSW5Nb3VudGVkJylcbi8vICAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnbGF5b3V0X2ZzcGF0aCcpXG4vLyAgICAgZnNwYXRoOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2xheW91dF9yZW5kZXJQYXRoJylcbi8vICAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZGlybmFtZScsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2xheW91dF9kaXJuYW1lJylcbi8vICAgICBkaXJuYW1lOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncmVuZGVyc1RvSFRNTCcsIGRidHlwZTogJ0lOVEVHRVInXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2xheW91dF9yZW5kZXJzVG9IVE1MJylcbi8vICAgICByZW5kZXJzVG9IVE1MOiBib29sZWFuO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuLy8gICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnbGF5b3V0X210aW1lTXMnKVxuLy8gICAgIG10aW1lTXM6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZG9jQ29udGVudCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBkb2NDb250ZW50OiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZG9jQm9keScsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBkb2NCb2R5OiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4vLyAgICAgfSlcbi8vICAgICBtZXRhZGF0YTogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4vLyAgICAgfSlcbi8vICAgICBpbmZvOiBhbnk7XG5cbi8vIH1cblxuLy8gYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0xBWU9VVFNaWlpaWlpaWlpaJyk7XG4vLyB0eXBlIFRsYXlvdXRzREFPID0gQmFzZURBTzxMYXlvdXQ+O1xuLy8gZXhwb3J0IGNvbnN0IGxheW91dHNEQU9cbi8vICAgICA9IG5ldyBCYXNlREFPPExheW91dD4oTGF5b3V0LCBzcWRiKTtcblxuLy8gYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X3ZwYXRoJyk7XG4vLyBhd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfbW91bnRlZCcpO1xuLy8gYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X21vdW50UG9pbnQnKTtcbi8vIGF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9wYXRoSW5Nb3VudGVkJyk7XG4vLyBhd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfZnNwYXRoJyk7XG4vLyBhd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfcmVuZGVyUGF0aCcpO1xuLy8gYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X3JlbmRlcnNUb0hUTUwnKTtcbi8vIGF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9kaXJuYW1lJyk7XG4vLyBhd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfbXRpbWVNcycpO1xuXG4vLy8vLy8vLy8vLy8vLy8gRG9jdW1lbnRzIFRhYmxlXG5cbi8vIEB0YWJsZSh7XG4vLyAgICAgbmFtZTogJ0RPQ1VNRU5UUycsXG4vLyAgICAgd2l0aG91dFJvd0lkOiB0cnVlLFxuLy8gfSlcbi8vIGV4cG9ydCBjbGFzcyBEb2N1bWVudCB7XG5cbi8vICAgICAvLyBQcmltYXJ5IGtleVxuLy8gICAgIEBpZCh7XG4vLyAgICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2RvY3NfdnBhdGgnKVxuLy8gICAgIHZwYXRoOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBtaW1lPzogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdkb2NzX21vdW50ZWQnKVxuLy8gICAgIG1vdW50ZWQ6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtb3VudFBvaW50JywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc19tb3VudFBvaW50Jylcbi8vICAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2RvY3NfcGF0aEluTW91bnRlZCcpXG4vLyAgICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2RvY3NfZnNwYXRoJylcbi8vICAgICBmc3BhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdyZW5kZXJQYXRoJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc19yZW5kZXJQYXRoJylcbi8vICAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncmVuZGVyc1RvSFRNTCcsIGRidHlwZTogJ0lOVEVHRVInXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2RvY3NfcmVuZGVyc1RvSFRNTCcpXG4vLyAgICAgcmVuZGVyc1RvSFRNTDogYm9vbGVhbjtcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkaXJuYW1lJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc19kaXJuYW1lJylcbi8vICAgICBkaXJuYW1lOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncGFyZW50RGlyJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc19wYXJlbnREaXInKVxuLy8gICAgIHBhcmVudERpcjogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuLy8gICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc19tdGltZU1zJylcbi8vICAgICBtdGltZU1zOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncHVibGljYXRpb25UaW1lJyxcbi8vICAgICAgICAgZGJ0eXBlOiBgSU5URUdFUiBHRU5FUkFURUQgQUxXQVlTIEFTIChqc29uX2V4dHJhY3QoaW5mbywgJyQucHVibGljYXRpb25UaW1lJykpIFNUT1JFRGBcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc19wdWJsaWNhdGlvblRpbWUnKVxuLy8gICAgIHB1YmxpY2F0aW9uVGltZTogbnVtYmVyO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2Jhc2VNZXRhZGF0YScsXG4vLyAgICAgICAgIGRidHlwZTogYFRFWFQgR0VORVJBVEVEIEFMV0FZUyBBUyAoanNvbl9leHRyYWN0KGluZm8sICckLmJhc2VNZXRhZGF0YScpKSBTVE9SRURgLFxuLy8gICAgICAgICBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIGJhc2VNZXRhZGF0YT86IGFueTtcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLFxuLy8gICAgICAgICBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIGRvY01ldGFkYXRhPzogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2RvY0NvbnRlbnQnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgZG9jQ29udGVudD86IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkb2NCb2R5JywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIGRvY0JvZHk/OiBzdHJpbmc7XG5cbi8vICAgICAvLyAgR0VORVJBVEVEIEFMV0FZUyBBUyAoanNvbl9leHRyYWN0KGluZm8sICckLm1ldGFkYXRhJykpIFNUT1JFRFxuLy8gICAgIC8vIEBmaWVsZCh7XG4vLyAgICAgLy8gICAgIG5hbWU6ICdtZXRhZGF0YScsXG4vLyAgICAgLy8gICAgIGRidHlwZTogYFRFWFRgLFxuLy8gICAgIC8vICAgICBpc0pzb246IHRydWVcbi8vICAgICAvLyB9KVxuLy8gICAgIC8vIG1ldGFkYXRhPzogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ21ldGFkYXRhJyxcbi8vICAgICAgICAgZGJ0eXBlOiBgVEVYVCBHRU5FUkFURUQgQUxXQVlTIEFTIChqc29uX2V4dHJhY3QoaW5mbywgJyQubWV0YWRhdGEnKSkgU1RPUkVEYCxcbi8vICAgICAgICAgaXNKc29uOiB0cnVlXG4vLyAgICAgfSlcbi8vICAgICBtZXRhZGF0YT86IGFueTtcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICd0YWdzJyxcbi8vICAgICAgICAgZGJ0eXBlOiBgVEVYVCBHRU5FUkFURUQgQUxXQVlTIEFTIChqc29uX2V4dHJhY3QoaW5mbywgJyQubWV0YWRhdGEudGFncycpKSBTVE9SRURgLFxuLy8gICAgICAgICBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc190YWdzJylcbi8vICAgICB0YWdzPzogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2xheW91dCcsXG4vLyAgICAgICAgIGRidHlwZTogYFRFWFQgR0VORVJBVEVEIEFMV0FZUyBBUyAoanNvbl9leHRyYWN0KG1ldGFkYXRhLCAnJC5sYXlvdXQnKSkgU1RPUkVEYFxuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdkb2NzX2xheW91dCcpXG4vLyAgICAgbGF5b3V0Pzogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2Jsb2d0YWcnLFxuLy8gICAgICAgICBkYnR5cGU6IGBURVhUIEdFTkVSQVRFRCBBTFdBWVMgQVMgKGpzb25fZXh0cmFjdChtZXRhZGF0YSwgJyQuYmxvZ3RhZycpKSBTVE9SRURgXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2RvY3NfYmxvZ3RhZycpXG4vLyAgICAgYmxvZ3RhZz86IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdpbmZvJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuLy8gICAgIH0pXG4vLyAgICAgaW5mbzogYW55O1xuXG4vLyB9XG5cbi8vIGF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdET0NVTUVOVFNaWlpaWlpaWlonKTtcbi8vIHR5cGUgVGRvY3VtZW50c3NEQU8gPSBCYXNlREFPPERvY3VtZW50Pjtcbi8vIGV4cG9ydCBjb25zdCBkb2N1bWVudHNEQU9cbi8vICAgICA9IG5ldyBCYXNlREFPPERvY3VtZW50PihEb2N1bWVudCwgc3FkYik7XG5cbi8vIGF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc192cGF0aCcpO1xuLy8gYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX21vdW50ZWQnKTtcbi8vIGF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19tb3VudFBvaW50Jyk7XG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfcGF0aEluTW91bnRlZCcpO1xuLy8gYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX2ZzcGF0aCcpO1xuLy8gYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3JlbmRlclBhdGgnKTtcbi8vIGF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19yZW5kZXJzVG9IVE1MJyk7XG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfZGlybmFtZScpO1xuLy8gYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3BhcmVudERpcicpO1xuLy8gYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX210aW1lTXMnKTtcbi8vIGF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19wdWJsaWNhdGlvblRpbWUnKTtcbi8vIGF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc190YWdzJyk7XG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfbGF5b3V0Jyk7XG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfYmxvZ3RhZycpO1xuXG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uc3FsZGIucnVuKGBcbi8vICAgICBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyBcbi8vICAgICBpZHhfZG9jc19tZXRhZGF0YV9qc29uIE9OIFxuLy8gICAgIERPQ1VNRU5UUyhqc29uX2V4dHJhY3QobWV0YWRhdGEsICckLnB1YmxpY2F0aW9uRGF0ZScpKTtcbi8vIGApO1xuLy8gYXdhaXQgZG9jdW1lbnRzREFPLnNxbGRiLnJ1bihgXG4vLyAgICAgQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFMgXG4vLyAgICAgaWR4X2RvY3NfcmVuZGVyX3BhdGhfcGF0dGVybiBPTiBET0NVTUVOVFMocmVuZGVyUGF0aCk7XG4vLyBgKTtcblxuLy8gY29uc3QgdGdsdWUgPSBuZXcgVGFnR2x1ZSgpO1xuLy8gdGdsdWUuaW5pdChzcWRiLl9kYik7XG5cbi8vIGNvbnN0IHRkZXNjID0gbmV3IFRhZ0Rlc2NyaXB0aW9ucygpO1xuLy8gdGRlc2MuaW5pdChzcWRiLl9kYik7XG5cbi8vIENvbnZlcnQgQWthc2hhQ01TIG1vdW50IHBvaW50cyBpbnRvIHRoZSBtb3VudHBvaW50XG4vLyB1c2VkIGJ5IERpcnNXYXRjaGVyXG4vLyBjb25zdCByZW1hcGRpcnMgPSAoZGlyejogZGlyVG9Nb3VudFtdKTogZGlyVG9XYXRjaFtdID0+IHtcbi8vICAgICByZXR1cm4gZGlyei5tYXAoZGlyID0+IHtcbi8vICAgICAgICAgLy8gY29uc29sZS5sb2coJ2RvY3VtZW50IGRpciAnLCBkaXIpO1xuLy8gICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbi8vICAgICAgICAgICAgIHJldHVybiB7XG4vLyAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLFxuLy8gICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6ICcvJyxcbi8vICAgICAgICAgICAgICAgICBiYXNlTWV0YWRhdGE6IHt9XG4vLyAgICAgICAgICAgICB9O1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgaWYgKCFkaXIuZGVzdCkge1xuLy8gICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVtYXBkaXJzIGludmFsaWQgbW91bnQgc3BlY2lmaWNhdGlvbiAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgcmV0dXJuIHtcbi8vICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIuc3JjLFxuLy8gICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5kZXN0LFxuLy8gICAgICAgICAgICAgICAgIGJhc2VNZXRhZGF0YTogZGlyLmJhc2VNZXRhZGF0YSxcbi8vICAgICAgICAgICAgICAgICBpZ25vcmU6IGRpci5pZ25vcmVcbi8vICAgICAgICAgICAgIH07XG4vLyAgICAgICAgIH1cbi8vICAgICB9KTtcbi8vIH07XG5cbi8qKlxuICogVHlwZSBmb3IgcmV0dXJuIGZyb20gcGF0aHMgbWV0aG9kLiAgVGhlIGZpZWxkcyBoZXJlXG4gKiBhcmUgd2hhdHMgaW4gdGhlIEFzc2V0L0xheW91dC9QYXJ0aWFsIGNsYXNzZXMgYWJvdmVcbiAqIHBsdXMgYSBjb3VwbGUgZmllbGRzIHRoYXQgb2xkZXIgY29kZSBleHBlY3RlZFxuICogZnJvbSB0aGUgcGF0aHMgbWV0aG9kLlxuICovXG5leHBvcnQgdHlwZSBQYXRoc1JldHVyblR5cGUgPSB7XG4gICAgdnBhdGg6IHN0cmluZyxcbiAgICBtaW1lOiBzdHJpbmcsXG4gICAgbW91bnRlZDogc3RyaW5nLFxuICAgIG1vdW50UG9pbnQ6IHN0cmluZyxcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmcsXG4gICAgbXRpbWVNczogc3RyaW5nLFxuICAgIGluZm86IGFueSxcbiAgICAvLyBUaGVzZSB3aWxsIGJlIGNvbXB1dGVkIGluIEJhc2VGaWxlQ2FjaGVcbiAgICAvLyBUaGV5IHdlcmUgcmV0dXJuZWQgaW4gcHJldmlvdXMgdmVyc2lvbnMuXG4gICAgZnNwYXRoOiBzdHJpbmcsXG4gICAgcmVuZGVyUGF0aDogc3RyaW5nXG59O1xuXG5leHBvcnQgY2xhc3MgQmFzZUZpbGVDYWNoZTxcbiAgICAgICAgVCwgLy8gZXh0ZW5kcyBBc3NldCB8IExheW91dCB8IFBhcnRpYWwgfCBEb2N1bWVudCxcbiAgICAgICAgVGRhbyAvLyBleHRlbmRzIEJhc2VEQU88VD5cbj4gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgLy8gI2NvbmZpZz86IENvbmZpZ3VyYXRpb247XG4gICAgI25hbWU/OiBzdHJpbmc7XG4gICAgLy8gI2RpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2lzX3JlYWR5OiBib29sZWFuID0gZmFsc2U7XG4gICAgI2NhY2hlX2NvbnRlbnQ6IGJvb2xlYW47XG4gICAgI21hcF9yZW5kZXJwYXRoOiBib29sZWFuO1xuICAgICNkYW86IFRkYW87IC8vIEJhc2VEQU88VD47XG5cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAgICogQHBhcmFtIGRpcnMgYXJyYXkgb2YgZGlyZWN0b3JpZXMgYW5kIG1vdW50IHBvaW50cyB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBuYW1lIHN0cmluZyBnaXZpbmcgdGhlIG5hbWUgZm9yIHRoaXMgd2F0Y2hlciBuYW1lXG4gICAgICogQHBhcmFtIGRhbyBUaGUgU1FMSVRFM09STSBEQU8gaW5zdGFuY2UgdG8gdXNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIC8vIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICAvLyBkaXJzOiBkaXJUb01vdW50W10sXG4gICAgICAgIGRhbzogVGRhbyAvLyBCYXNlREFPPFQ+XG4gICAgKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBCYXNlRmlsZUNhY2hlICR7bmFtZX0gY29uc3RydWN0b3IgZGlycz0ke3V0aWwuaW5zcGVjdChkaXJzKX1gKTtcbiAgICAgICAgLy8gdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLiNuYW1lID0gbmFtZTtcbiAgICAgICAgLy8gdGhpcy4jZGlycyA9IGRpcnM7XG4gICAgICAgIHRoaXMuI2lzX3JlYWR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuI2NhY2hlX2NvbnRlbnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jbWFwX3JlbmRlcnBhdGggPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jZGFvID0gZGFvO1xuICAgIH1cblxuICAgIC8vIGdldCBjb25maWcoKSAgICAgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgZ2V0IG5hbWUoKSAgICAgICB7IHJldHVybiB0aGlzLiNuYW1lOyB9XG4gICAgLy8gZ2V0IGRpcnMoKSAgICAgICB7IHJldHVybiB0aGlzLiNkaXJzOyB9XG4gICAgc2V0IGNhY2hlQ29udGVudChkb2l0KSB7IHRoaXMuI2NhY2hlX2NvbnRlbnQgPSBkb2l0OyB9XG4gICAgZ2V0IGdhY2hlQ29udGVudCgpIHsgcmV0dXJuIHRoaXMuI2NhY2hlX2NvbnRlbnQ7IH1cbiAgICBzZXQgbWFwUmVuZGVyUGF0aChkb2l0KSB7IHRoaXMuI21hcF9yZW5kZXJwYXRoID0gZG9pdDsgfVxuICAgIGdldCBtYXBSZW5kZXJQYXRoKCkgeyByZXR1cm4gdGhpcy4jbWFwX3JlbmRlcnBhdGg7IH1cbiAgICBnZXQgZGFvKCk6IFRkYW8geyByZXR1cm4gdGhpcy4jZGFvOyB9XG5cbiAgICAvLyBTS0lQOiBnZXREeW5hbWljVmlld1xuXG5cbiAgICAjd2F0Y2hlcjogRGlyc1dhdGNoZXI7XG4gICAgI3F1ZXVlO1xuXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLiNxdWV1ZSkge1xuICAgICAgICAgICAgdGhpcy4jcXVldWUua2lsbEFuZERyYWluKCk7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4jd2F0Y2hlcikge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENMT1NJTkcgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiN3YXRjaGVyLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLiN3YXRjaGVyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdjaGFuZ2VkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdhZGRlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygndW5saW5rZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlYWR5Jyk7XG5cbiAgICAgICAgLy8gYXdhaXQgc3FkYi5jbG9zZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB1cCByZWNlaXZpbmcgZXZlbnRzIGZyb20gRGlyc1dhdGNoZXIsIGFuZCBkaXNwYXRjaGluZyB0b1xuICAgICAqIHRoZSBoYW5kbGVyIG1ldGhvZHMuXG4gICAgICovXG4gICAgYXN5bmMgc2V0dXAoKSB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuI3dhdGNoZXIpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoaXMuI3F1ZXVlID0gZmFzdHEucHJvbWlzZShhc3luYyBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gICAgIGlmIChldmVudC5jb2RlID09PSAnY2hhbmdlZCcpIHtcbiAgICAgICAgLy8gICAgICAgICB0cnkge1xuICAgICAgICAvLyAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hhbmdlICR7ZXZlbnQubmFtZX0gJHtldmVudC5pbmZvLnZwYXRofWApO1xuICAgICAgICAvLyAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlQ2hhbmdlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgLy8gICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2NoYW5nZScsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAvLyAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgIC8vICAgICAgICAgICAgIH0pO1xuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ2FkZGVkJykge1xuICAgICAgICAvLyAgICAgICAgIHRyeSB7XG4gICAgICAgIC8vICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGQgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCk7XG4gICAgICAgIC8vICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVBZGRlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgLy8gICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2FkZCcsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAvLyAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIGluZm86IGV2ZW50LmluZm8sXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAvLyAgICAgICAgICAgICB9KTtcbiAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgIC8vICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICd1bmxpbmtlZCcpIHtcbiAgICAgICAgLy8gICAgICAgICB0cnkge1xuICAgICAgICAvLyAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgdW5saW5rICR7ZXZlbnQubmFtZX0gJHtldmVudC5pbmZvLnZwYXRofWAsIGV2ZW50LmluZm8pO1xuICAgICAgICAvLyAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlVW5saW5rZWQoZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgIC8vICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCd1bmxpbmsnLCBldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgLy8gICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAvLyAgICAgICAgICAgICB9KTtcbiAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgIC8vICAgICAvKiB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgLy8gICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlRXJyb3IoZXZlbnQubmFtZSkgKi9cbiAgICAgICAgLy8gICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ3JlYWR5Jykge1xuICAgICAgICAvLyAgICAgICAgIC8vIGF3YWl0IGZjYWNoZS5oYW5kbGVSZWFkeShldmVudC5uYW1lKTtcbiAgICAgICAgLy8gICAgICAgICBmY2FjaGUuZW1pdCgncmVhZHknLCBldmVudC5uYW1lKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfSwgMTApO1xuXG4gICAgICAgIHRoaXMuI3dhdGNoZXIgPSBuZXcgRGlyc1dhdGNoZXIodGhpcy5uYW1lKTtcblxuICAgICAgICB0aGlzLiN3YXRjaGVyLm9uKCdjaGFuZ2UnLCBhc3luYyAobmFtZTogc3RyaW5nLCBpbmZvOiBWUGF0aERhdGEpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IGNoYW5nZWQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFBVU0ggJHtuYW1lfSBjaGFuZ2VkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnY2hhbmdlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICdjaGFuZ2UnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCBjaGFuZ2UgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ2FkZCcsIGFzeW5jIChuYW1lOiBzdHJpbmcsIGluZm86IFZQYXRoRGF0YSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtuYW1lfSBhZGQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFVTSCAke25hbWV9IGFkZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ2FkZGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ2FkZCcgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIGFkZCAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigndW5saW5rJywgYXN5bmMgKG5hbWU6IHN0cmluZywgaW5mbzogVlBhdGhEYXRhKSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgdW5saW5rICR7bmFtZX0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICd1bmxpbmtlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICd1bmxpbmsnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgdW5saW5rICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdyZWFkeScsIGFzeW5jIChuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IHJlYWR5YCk7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb2RlOiAncmVhZHknLFxuICAgICAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHNldHVwICR7dGhpcy4jbmFtZX0gd2F0Y2ggJHt1dGlsLmluc3BlY3QodGhpcy4jZGlycyl9ID09PiAke3V0aWwuaW5zcGVjdChtYXBwZWQpfWApO1xuICAgICAgICAvLyBhd2FpdCB0aGlzLiN3YXRjaGVyLndhdGNoKG1hcHBlZCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYERBTyAke3RoaXMuZGFvLnRhYmxlLm5hbWV9ICR7dXRpbC5pbnNwZWN0KHRoaXMuZGFvLnRhYmxlLmZpZWxkcyl9YCk7XG5cbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBUKSB7XG4gICAgICAgIC8vIFBsYWNlaG9sZGVyIHdoaWNoIHNvbWUgc3ViY2xhc3Nlc1xuICAgICAgICAvLyBhcmUgZXhwZWN0ZWQgdG8gb3ZlcnJpZGVcblxuICAgICAgICAvLyBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihvYmo6IGFueSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBiZSBvdmVycmlkZGVuYCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqQkFTRShvYmo6IGFueSwgZGVzdDogYW55KTogdm9pZCB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgcmVjZWl2ZSBhbiBvYmplY3QsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLnZwYXRoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoudnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSB2cGF0aCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QudnBhdGggPSBvYmoudnBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoubWltZSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5taW1lICE9PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoubWltZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIG1pbWUsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0Lm1pbWUgPSBvYmoubWltZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5tb3VudGVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoubW91bnRlZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIG1vdW50ZWQsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0Lm1vdW50ZWQgPSBvYmoubW91bnRlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5tb3VudFBvaW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoubW91bnRQb2ludCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIG1vdW50UG9pbnQsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0Lm1vdW50UG9pbnQgPSBvYmoubW91bnRQb2ludDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5wYXRoSW5Nb3VudGVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoucGF0aEluTW91bnRlZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIHBhdGhJbk1vdW50ZWQsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0LnBhdGhJbk1vdW50ZWQgPSBvYmoucGF0aEluTW91bnRlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5mc3BhdGggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5mc3BhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBmc3BhdGgsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0LmZzcGF0aCA9IG9iai5mc3BhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoucmVuZGVyUGF0aCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLnJlbmRlclBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSByZW5kZXJQYXRoLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5yZW5kZXJQYXRoID0gb2JqLnJlbmRlclBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouZGlybmFtZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmRpcm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBkaXJuYW1lLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5kaXJuYW1lID0gb2JqLmRpcm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoucmVuZGVyc1RvSFRNTCAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgIHx8IG9iai5yZW5kZXJzVG9IVE1MID09PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoucmVuZGVyc1RvSFRNTCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqLnJlbmRlcnNUb0hUTUwgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKG9iai5yZW5kZXJQYXRoLm1hdGNoKC8uKlxcLmh0bWwkLykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGAke29iai5yZW5kZXJQYXRofSA9PT0gMCA9PT0gRkFMU0VgKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICBkZXN0LnJlbmRlcnNUb0hUTUwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9iai5yZW5kZXJzVG9IVE1MID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIChvYmoucmVuZGVyUGF0aC5tYXRjaCgvLipcXC5odG1sJC8pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhgJHtvYmoucmVuZGVyUGF0aH0gPT09IDEgPT09IFRSVUVgKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICBkZXN0LnJlbmRlcnNUb0hUTUwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgcmVuZGVyc1RvSFRNTCBpbmNvcnJlY3QgdmFsdWUsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAob2JqLnJlbmRlcnNUb0hUTUwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZXN0LnJlbmRlcnNUb0hUTUwgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBJTlRFR0VSIHJlbmRlcnNUb0hUTUwsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBpZiAob2JqLnJlbmRlclBhdGgubWF0Y2goLy4qXFwuaHRtbCQvKSkge1xuICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGAke29iai5yZW5kZXJQYXRofSBkZWZhdWx0IHRvIEZBTFNFYCk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICBkZXN0LnJlbmRlcnNUb0hUTUwgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiAob2JqLnJlbmRlclBhdGgubWF0Y2goLy4qXFwuaHRtbCQvKSkge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYCR7b2JqLnJlbmRlclBhdGh9ICR7b2JqLnJlbmRlcnNUb0hUTUx9ICR7ZGVzdC5yZW5kZXJzVG9IVE1MfWApO1xuICAgICAgICAvLyB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLm10aW1lTXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5tdGltZU1zICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgbXRpbWVNcywgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QubXRpbWVNcyA9IG9iai5tdGltZU1zO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmRvY01ldGFkYXRhICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKG9iai5kb2NNZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlc3QuZG9jTWV0YWRhdGEgPSB7fTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9iai5kb2NNZXRhZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIGRvY01ldGFkYXRhLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5kb2NNZXRhZGF0YSA9IEpTT04ucGFyc2Uob2JqLmRvY01ldGFkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc3QuZG9jTWV0YWRhdGEgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5tZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChvYmoubWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZXN0Lm1ldGFkYXRhID0ge307XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmoubWV0YWRhdGEgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBtZXRhZGF0YSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QubWV0YWRhdGEgPSBKU09OLnBhcnNlKG9iai5tZXRhZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXN0Lm1ldGFkYXRhID0ge307XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouaW5mbyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChvYmouaW5mbyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlc3QuaW5mbyA9IHt9O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLmluZm8gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBpbmZvLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5pbmZvID0gSlNPTi5wYXJzZShvYmouaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXN0LmluZm8gPSB7fTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBhbiBpbmZvIG9iamVjdCBiYXNlZCBvbiB2cGF0aCBhbmQgbW91bnRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcGFyYW0gbW91bnRlZCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZmluZFBhdGhNb3VudGVkKHZwYXRoOiBzdHJpbmcsIG1vdW50ZWQ6IHN0cmluZykge1xuICAgICAgICBcbiAgICAgICAgLy8gY29uc3QgZm91bmQgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5hbGwoYFxuICAgICAgICAvLyAgICAgU0VMRUNUIHZwYXRoLCBtb3VudGVkXG4gICAgICAgIC8vICAgICBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgLy8gICAgIFdIRVJFIFxuICAgICAgICAvLyAgICAgdnBhdGggPSAkdnBhdGggQU5EIG1vdW50ZWQgPSAkbW91bnRlZFxuICAgICAgICAvLyBgLCB7XG4gICAgICAgIC8vICAgICAkdnBhdGg6IHZwYXRoLFxuICAgICAgICAvLyAgICAgJG1vdW50ZWQ6IG1vdW50ZWRcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIGNvbnN0IG1hcHBlZCA9IDxhbnlbXT5mb3VuZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgIC8vICAgICByZXR1cm4geyB2cGF0aDogaXRlbS52cGF0aCwgbW91bnRlZDogaXRlbS5tb3VudGVkIH1cbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIHJldHVybiBtYXBwZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBhbiBpbmZvIG9iamVjdCBieSB0aGUgdnBhdGguXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIGZpbmRCeVBhdGgodnBhdGg6IHN0cmluZykge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kQnlQYXRoICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX0gJHt2cGF0aH1gKTtcblxuICAgICAgICAvLyBjb25zdCBmb3VuZCA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgIC8vICAgICBTRUxFQ1QgKlxuICAgICAgICAvLyAgICAgRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9XG4gICAgICAgIC8vICAgICBXSEVSRSBcbiAgICAgICAgLy8gICAgIHZwYXRoID0gJHZwYXRoIE9SIHJlbmRlclBhdGggPSAkdnBhdGhcbiAgICAgICAgLy8gYCwge1xuICAgICAgICAvLyAgICAgJHZwYXRoOiB2cGF0aFxuICAgICAgICAvLyB9KTtcblxuICAgICAgICAvLyBjb25zdCBtYXBwZWQgPSA8YW55W10+Zm91bmQubWFwKGl0ZW0gPT4ge1xuICAgICAgICAvLyAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvLyBmb3IgKGNvbnN0IGl0ZW0gb2YgbWFwcGVkKSB7XG4gICAgICAgIC8vICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGl0ZW0pO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHJldHVybiBtYXBwZWQ7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFuZGxlQ2hhbmdlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlQ2hhbmdlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgT09PT09PT09HQSEhISBSZWNlaXZlZCBhIGZpbGUgdGhhdCBzaG91bGQgYmUgaW5nb3JlZCBgLCBpbmZvKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZUNoYW5nZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGFuZGxlQ2hhbmdlZCAke2luZm8udnBhdGh9ICR7aW5mby5tZXRhZGF0YSAmJiBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA/IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlIDogJz8/Pyd9YCk7XG5cbiAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpbmZvKTtcbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmZpbmRQYXRoTW91bnRlZChpbmZvLnZwYXRoLCBpbmZvLm1vdW50ZWQpO1xuXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgIC8vICAgICB2cGF0aDogeyBlcTogaW5mby52cGF0aCB9LFxuICAgICAgICAvLyAgICAgbW91bnRlZDogeyBlcTogaW5mby5tb3VudGVkIH1cbiAgICAgICAgLy8gfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICFBcnJheS5pc0FycmF5KHJlc3VsdClcbiAgICAgICAgIHx8IHJlc3VsdC5sZW5ndGggPD0gMFxuICAgICAgICApIHtcbiAgICAgICAgICAgIC8vIEl0IHdhc24ndCBmb3VuZCBpbiB0aGUgZGF0YWJhc2UuICBIZW5jZVxuICAgICAgICAgICAgLy8gd2Ugc2hvdWxkIGFkZCBpdC5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUFkZGVkKG5hbWUsIGluZm8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVEb2NJbkRCKGluZm8pO1xuICAgICAgICAvLyBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUNoYW5nZWQobmFtZSwgaW5mbyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoaW5mbykge1xuICAgICAgICAvLyBhd2FpdCB0aGlzLiNkYW8udXBkYXRlKHtcbiAgICAgICAgLy8gICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAvLyAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAvLyAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAvLyAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAvLyAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAvLyAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAvLyAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAvLyAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgIC8vICAgICByZW5kZXJzVG9IVE1MOiBmYWxzZSxcbiAgICAgICAgLy8gICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgLy8gICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAvLyAgICAgLy8gZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAvLyAgICAgLy8gZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAvLyAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgIC8vICAgICBpbmZvLFxuICAgICAgICAvLyB9IGFzIFQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdlIHJlY2VpdmUgdGhpczpcbiAgICAgKlxuICAgICAqIHtcbiAgICAgKiAgICBmc3BhdGg6IGZzcGF0aCxcbiAgICAgKiAgICB2cGF0aDogdnBhdGgsXG4gICAgICogICAgbWltZTogbWltZS5nZXRUeXBlKGZzcGF0aCksXG4gICAgICogICAgbW91bnRlZDogZGlyLm1vdW50ZWQsXG4gICAgICogICAgbW91bnRQb2ludDogZGlyLm1vdW50UG9pbnQsXG4gICAgICogICAgcGF0aEluTW91bnRlZDogY29tcHV0ZWQgcmVsYXRpdmUgcGF0aFxuICAgICAqICAgIHN0YWNrOiBbIGFycmF5IG9mIHRoZXNlIGluc3RhbmNlcyBdXG4gICAgICogfVxuICAgICAqXG4gICAgICogTmVlZCB0byBhZGQ6XG4gICAgICogICAgcmVuZGVyUGF0aFxuICAgICAqICAgIEFuZCBmb3IgSFRNTCByZW5kZXIgZmlsZXMsIGFkZCB0aGUgYmFzZU1ldGFkYXRhIGFuZCBkb2NNZXRhZGF0YVxuICAgICAqXG4gICAgICogU2hvdWxkIHJlbW92ZSB0aGUgc3RhY2ssIHNpbmNlIGl0J3MgbGlrZWx5IG5vdCB1c2VmdWwgdG8gdXMuXG4gICAgICovXG5cbiAgICBhc3luYyBoYW5kbGVBZGRlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vICBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZUFkZGVkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmICh0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBPT09PT09PT0dBISEhIFJlY2VpdmVkIGEgZmlsZSB0aGF0IHNob3VsZCBiZSBpbmdvcmVkIGAsIGluZm8pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlQWRkZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5zZXJ0RG9jVG9EQihpbmZvKTtcbiAgICAgICAgLy8gYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVBZGRlZChuYW1lLCBpbmZvKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihpbmZvKSB7XG4gICAgICAgIC8vIGF3YWl0IHRoaXMuI2Rhby5pbnNlcnQoe1xuICAgICAgICAvLyAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgIC8vICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgIC8vICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgIC8vICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgIC8vICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgIC8vICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgIC8vICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgIC8vICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0hUTUw6IGZhbHNlLFxuICAgICAgICAvLyAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAvLyAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgIC8vICAgICAvLyBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgIC8vICAgICAvLyBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgIC8vICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgLy8gICAgIGluZm8sXG4gICAgICAgIC8vIH0gYXMgVCk7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFuZGxlVW5saW5rZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZVVubGlua2VkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlVW5saW5rZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGF3YWl0IHRoaXMuY29uZmlnLmhvb2tGaWxlVW5saW5rZWQobmFtZSwgaW5mbyk7XG5cbiAgICAvLyAgICAgYXdhaXQgdGhpcy4jZGFvLnNxbGRiLnJ1bihgXG4gICAgLy8gICAgICAgICBERUxFVEUgRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9XG4gICAgLy8gICAgICAgICBXSEVSRVxuICAgIC8vICAgICAgICAgdnBhdGggPSAkdnBhdGggQU5EIG1vdW50ZWQgPSAkbW91bnRlZFxuICAgIC8vICAgICBgLCB7XG4gICAgLy8gICAgICAgICAkdnBhdGg6IGluZm8udnBhdGgsXG4gICAgLy8gICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkXG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgICAvLyBhd2FpdCB0aGlzLiNkYW8uZGVsZXRlQWxsKHtcbiAgICAvLyAgICAgLy8gICAgIHZwYXRoOiB7IGVxOiBpbmZvLnZwYXRoIH0sXG4gICAgLy8gICAgIC8vICAgICBtb3VudGVkOiB7IGVxOiBpbmZvLm1vdW50ZWQgfVxuICAgIC8vICAgICAvLyB9IGFzIFdoZXJlPFQ+KTtcbiAgICB9XG5cbiAgICAvLyBhc3luYyBoYW5kbGVSZWFkeShuYW1lKSB7XG4gICAgLy8gICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlUmVhZHlgKTtcbiAgICAvLyAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgIC8vICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVSZWFkeSBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIHRoaXMuI2lzX3JlYWR5ID0gdHJ1ZTtcbiAgICAvLyAgICAgdGhpcy5lbWl0KCdyZWFkeScsIG5hbWUpO1xuICAgIC8vIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGRpcmVjdG9yeSBtb3VudCBjb3JyZXNwb25kaW5nIHRvIHRoZSBmaWxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBpbmZvXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBmaWxlRGlyTW91bnQoaW5mbykge1xuICAgICAgICAvLyBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgLy8gZm9yIChjb25zdCBkaXIgb2YgbWFwcGVkKSB7XG4gICAgICAgIC8vICAgICAvLyBjb25zb2xlLmxvZyhgZGlyTW91bnQgZm9yICR7aW5mby52cGF0aH0gLS0gJHt1dGlsLmluc3BlY3QoaW5mbyl9ID09PSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICAvLyAgICAgaWYgKGluZm8ubW91bnRQb2ludCA9PT0gZGlyLm1vdW50UG9pbnQpIHtcbiAgICAgICAgLy8gICAgICAgICByZXR1cm4gZGlyO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2hvdWxkIHRoaXMgZmlsZSBiZSBpZ25vcmVkLCBiYXNlZCBvbiB0aGUgYGlnbm9yZWAgZmllbGRcbiAgICAgKiBpbiB0aGUgbWF0Y2hpbmcgYGRpcmAgbW91bnQgZW50cnkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGluZm9cbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGlnbm9yZUZpbGUoaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgIGNvbnN0IGRpck1vdW50ID0gdGhpcy5maWxlRGlyTW91bnQoaW5mbyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH0gZGlyTW91bnQgJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICBsZXQgaWdub3JlID0gZmFsc2U7XG4gICAgICAgIGlmIChkaXJNb3VudCkge1xuXG4gICAgICAgICAgICBsZXQgaWdub3JlcztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyTW91bnQuaWdub3JlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBbIGRpck1vdW50Lmlnbm9yZSBdO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRpck1vdW50Lmlnbm9yZSkpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gZGlyTW91bnQuaWdub3JlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaWdub3Jlcykge1xuICAgICAgICAgICAgICAgIGlmIChtaWNyb21hdGNoLmlzTWF0Y2goaW5mby52cGF0aCwgaSkpIGlnbm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRpck1vdW50Lmlnbm9yZSAke2ZzcGF0aH0gJHtpfSA9PiAke2lnbm9yZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIChpZ25vcmUpIGNvbnNvbGUubG9nKGBNVVNUIGlnbm9yZSBGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlIGZvciAke2luZm8udnBhdGh9ID09PiAke2lnbm9yZX1gKTtcbiAgICAgICAgICAgIHJldHVybiBpZ25vcmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBubyBtb3VudD8gIHRoYXQgbWVhbnMgc29tZXRoaW5nIHN0cmFuZ2VcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYE5vIGRpck1vdW50IGZvdW5kIGZvciAke2luZm8udnBhdGh9IC8gJHtpbmZvLmRpck1vdW50ZWRPbn1gKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxsb3cgYSBjYWxsZXIgdG8gd2FpdCB1bnRpbCB0aGUgPGVtPnJlYWR5PC9lbT4gZXZlbnQgaGFzXG4gICAgICogYmVlbiBzZW50IGZyb20gdGhlIERpcnNXYXRjaGVyIGluc3RhbmNlLiAgVGhpcyBldmVudCBtZWFucyB0aGVcbiAgICAgKiBpbml0aWFsIGluZGV4aW5nIGhhcyBoYXBwZW5lZC5cbiAgICAgKi9cbiAgICBhc3luYyBpc1JlYWR5KCkge1xuICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIGRpcmVjdG9yaWVzLCB0aGVyZSB3b24ndCBiZSBhbnkgZmlsZXMgXG4gICAgICAgIC8vIHRvIGxvYWQsIGFuZCBubyBuZWVkIHRvIHdhaXRcbiAgICAgICAgLy8gd2hpbGUgKHRoaXMuI2RpcnMubGVuZ3RoID4gMCAmJiAhdGhpcy4jaXNfcmVhZHkpIHtcbiAgICAgICAgLy8gICAgIC8vIFRoaXMgZG9lcyBhIDEwMG1zIHBhdXNlXG4gICAgICAgIC8vICAgICAvLyBUaGF0IGxldHMgdXMgY2hlY2sgaXNfcmVhZHkgZXZlcnkgMTAwbXNcbiAgICAgICAgLy8gICAgIC8vIGF0IHZlcnkgbGl0dGxlIGNvc3RcbiAgICAgICAgLy8gICAgIC8vIGNvbnNvbGUubG9nKGAhaXNSZWFkeSAke3RoaXMubmFtZX0gJHt0aGlzW19zeW1iX2RpcnNdLmxlbmd0aH0gJHt0aGlzW19zeW1iX2lzX3JlYWR5XX1gKTtcbiAgICAgICAgLy8gICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgLy8gICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAvLyAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgLy8gfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gc2ltcGxlIGluZm9ybWF0aW9uIGFib3V0IGVhY2hcbiAgICAgKiBwYXRoIGluIHRoZSBjb2xsZWN0aW9uLiAgVGhlIHJldHVyblxuICAgICAqIHR5cGUgaXMgYW4gYXJyYXkgb2YgUGF0aHNSZXR1cm5UeXBlLlxuICAgICAqIFxuICAgICAqIEkgZm91bmQgdHdvIHVzZXMgZm9yIHRoaXMgZnVuY3Rpb24uXG4gICAgICogSW4gY29weUFzc2V0cywgdGhlIHZwYXRoIGFuZCBvdGhlclxuICAgICAqIHNpbXBsZSBkYXRhIGlzIHVzZWQgZm9yIGNvcHlpbmcgaXRlbXNcbiAgICAgKiB0byB0aGUgb3V0cHV0IGRpcmVjdG9yeS5cbiAgICAgKiBJbiByZW5kZXIudHMsIHRoZSBzaW1wbGUgZmllbGRzIGFyZVxuICAgICAqIHVzZWQgdG8gdGhlbiBjYWxsIGZpbmQgdG8gcmV0cmlldmVcbiAgICAgKiB0aGUgZnVsbCBpbmZvcm1hdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb290UGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBwYXRocyhyb290UGF0aD86IHN0cmluZylcbiAgICAgICAgLy8gOiBQcm9taXNlPEFycmF5PFBhdGhzUmV0dXJuVHlwZT4+XG4gICAge1xuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG5cbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIC8vIFRoaXMgaXMgY29waWVkIGZyb20gdGhlIG9sZGVyIHZlcnNpb25cbiAgICAgICAgLy8gKExva2lKUyB2ZXJzaW9uKSBvZiB0aGlzIGZ1bmN0aW9uLiAgSXRcbiAgICAgICAgLy8gc2VlbXMgbWVhbnQgdG8gZWxpbWluYXRlIGR1cGxpY2F0ZXMuXG4gICAgICAgIGNvbnN0IHZwYXRoc1NlZW4gPSBuZXcgU2V0KCk7XG5cbiAgICAgICAgLy8gU2VsZWN0IHRoZSBmaWVsZHMgaW4gUGF0aHNSZXR1cm5UeXBlXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5hbGwoXG4gICAgICAgIC8vICh0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnKSA/XG4gICAgICAgIC8vIGBcbiAgICAgICAgLy8gICAgIFNFTEVDVFxuICAgICAgICAvLyAgICAgICAgIHZwYXRoLCBtaW1lLCBtb3VudGVkLCBtb3VudFBvaW50LFxuICAgICAgICAvLyAgICAgICAgIHBhdGhJbk1vdW50ZWQsIG10aW1lTXMsXG4gICAgICAgIC8vICAgICAgICAgaW5mbywgZnNwYXRoLCByZW5kZXJQYXRoXG4gICAgICAgIC8vICAgICBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgLy8gICAgIFdIRVJFXG4gICAgICAgIC8vICAgICByZW5kZXJQYXRoIExJS0UgJHJvb3RQXG4gICAgICAgIC8vICAgICBPUkRFUiBCWSBtdGltZU1zIEFTQ1xuICAgICAgICAvLyBgXG4gICAgICAgIC8vIDogYFxuICAgICAgICAvLyAgICAgU0VMRUNUXG4gICAgICAgIC8vICAgICAgICAgdnBhdGgsIG1pbWUsIG1vdW50ZWQsIG1vdW50UG9pbnQsXG4gICAgICAgIC8vICAgICAgICAgcGF0aEluTW91bnRlZCwgbXRpbWVNcyxcbiAgICAgICAgLy8gICAgICAgICBpbmZvLCBmc3BhdGgsIHJlbmRlclBhdGhcbiAgICAgICAgLy8gICAgIEZST00gJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfVxuICAgICAgICAvLyAgICAgT1JERVIgQlkgbXRpbWVNcyBBU0NcbiAgICAgICAgLy8gYCxcbiAgICAgICAgLy8gKHR5cGVvZiByb290UCA9PT0gJ3N0cmluZycpXG4gICAgICAgIC8vID8geyAkcm9vdFA6IGAke3Jvb3RQfSVgIH1cbiAgICAgICAgLy8gOiB7fSlcblxuICAgICAgICAvLyBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICAgLy8gICAgIG9yZGVyOiB7IG10aW1lTXM6IHRydWUgfVxuICAgICAgICAvLyB9IGFzIGFueTtcbiAgICAgICAgLy8gaWYgKHR5cGVvZiByb290UCA9PT0gJ3N0cmluZydcbiAgICAgICAgLy8gJiYgcm9vdFAubGVuZ3RoID49IDEpIHtcbiAgICAgICAgLy8gICAgIHNlbGVjdG9yLnJlbmRlclBhdGggPSB7XG4gICAgICAgIC8vICAgICAgICAgaXNMaWtlOiBgJHtyb290UH0lYFxuICAgICAgICAvLyAgICAgICAgIC8vIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnXiR7cm9vdFB9JyBgXG4gICAgICAgIC8vICAgICB9O1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIC8vIGNvbnNvbGUubG9nKGBwYXRocyAke3V0aWwuaW5zcGVjdChzZWxlY3Rvcil9YCk7XG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbChzZWxlY3Rvcik7XG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdDIgPSByZXN1bHRzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgLy8gICAgIC8vIGNvbnNvbGUubG9nKGBwYXRocyA/aWdub3JlPyAke2l0ZW0udnBhdGh9YCk7XG4gICAgICAgIC8vICAgICBpZiAoZmNhY2hlLmlnbm9yZUZpbGUoaXRlbSkpIHtcbiAgICAgICAgLy8gICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICBpZiAodnBhdGhzU2Vlbi5oYXMoKGl0ZW0gYXMgQXNzZXQpLnZwYXRoKSkge1xuICAgICAgICAvLyAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgICAgdnBhdGhzU2Vlbi5hZGQoKGl0ZW0gYXMgQXNzZXQpLnZwYXRoKTtcbiAgICAgICAgLy8gICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gcmV0dXJuIHJlc3VsdDI7XG5cbiAgICAgICAgLy8gVGhpcyBzdGFnZSBjb252ZXJ0cyB0aGUgaXRlbXMgXG4gICAgICAgIC8vIHJlY2VpdmVkIGJ5IHRoaXMgZnVuY3Rpb24gaW50b1xuICAgICAgICAvLyB3aGF0IGlzIHJlcXVpcmVkIGZyb21cbiAgICAgICAgLy8gdGhlIHBhdGhzIG1ldGhvZC5cbiAgICAgICAgLy8gY29uc3QgcmVzdWx0NFxuICAgICAgICAvLyAgICAgICAgID0gbmV3IEFycmF5PFBhdGhzUmV0dXJuVHlwZT4oKTtcbiAgICAgICAgLy8gZm9yIChjb25zdCBpdGVtIG9mIHJlc3VsdDMpIHtcbiAgICAgICAgLy8gICAgIHJlc3VsdDQucHVzaCg8UGF0aHNSZXR1cm5UeXBlPntcbiAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgLy8gICAgICAgICBtaW1lOiBpdGVtLm1pbWUsXG4gICAgICAgIC8vICAgICAgICAgbW91bnRlZDogaXRlbS5tb3VudGVkLFxuICAgICAgICAvLyAgICAgICAgIG1vdW50UG9pbnQ6IGl0ZW0ubW91bnRQb2ludCxcbiAgICAgICAgLy8gICAgICAgICBwYXRoSW5Nb3VudGVkOiBpdGVtLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgIC8vICAgICAgICAgbXRpbWVNczogaXRlbS5tdGltZU1zLFxuICAgICAgICAvLyAgICAgICAgIGluZm86IGl0ZW0uaW5mbyxcbiAgICAgICAgLy8gICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpdGVtLm1vdW50ZWQsIGl0ZW0ucGF0aEluTW91bnRlZCksXG4gICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS52cGF0aFxuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGZpbGUgd2l0aGluIHRoZSBjYWNoZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggVGhlIHZwYXRoIG9yIHJlbmRlclBhdGggdG8gbG9vayBmb3JcbiAgICAgKiBAcmV0dXJucyBib29sZWFuIHRydWUgaWYgZm91bmQsIGZhbHNlIG90aGVyd2lzZVxuICAgICAqL1xuICAgIGFzeW5jIGZpbmQoX2ZwYXRoKSAvKjogUHJvbWlzZTxUPiAqLyB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfZnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmQgcGFyYW1ldGVyIG5vdCBzdHJpbmcgJHt0eXBlb2YgX2ZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmZpbmRCeVBhdGgoZnBhdGgpO1xuXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAvLyAgICAgb3I6IFtcbiAgICAgICAgLy8gICAgICAgICB7IHZwYXRoOiB7IGVxOiBmcGF0aCB9fSxcbiAgICAgICAgLy8gICAgICAgICB7IHJlbmRlclBhdGg6IHsgZXE6IGZwYXRoIH19XG4gICAgICAgIC8vICAgICBdXG4gICAgICAgIC8vIH0gYXMgRmlsdGVyPFQ+KTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZCAke19mcGF0aH0gJHtmcGF0aH0gPT0+IHJlc3VsdDEgJHt1dGlsLmluc3BlY3QocmVzdWx0MSl9IGApO1xuXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdDIgPSA8YW55W10+cmVzdWx0MS5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgIC8vICAgICByZXR1cm4gIShmY2FjaGUuaWdub3JlRmlsZShpdGVtKSk7XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIC8vIC8vIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdDIpIHtcbiAgICAgICAgLy8gLy8gICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEocmVzdWx0KTtcbiAgICAgICAgLy8gLy8gfVxuXG4gICAgICAgIC8vIC8vIGNvbnNvbGUubG9nKGBmaW5kICR7X2ZwYXRofSAke2ZwYXRofSA9PT4gcmVzdWx0MiAke3V0aWwuaW5zcGVjdChyZXN1bHQyKX0gYCk7XG5cbiAgICAgICAgLy8gbGV0IHJldDtcbiAgICAgICAgLy8gaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0MikgJiYgcmVzdWx0Mi5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vICAgICByZXQgPSByZXN1bHQyWzBdO1xuICAgICAgICAvLyB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0MikgJiYgcmVzdWx0Mi5sZW5ndGggPD0gMCkge1xuICAgICAgICAvLyAgICAgcmV0ID0gdW5kZWZpbmVkO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgcmV0ID0gcmVzdWx0MjtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgICNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgI2ZFeGlzdHNJbkRpciAke2ZwYXRofSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICBpZiAoZGlyLm1vdW50UG9pbnQgPT09ICcvJykge1xuICAgICAgICAgICAgY29uc3QgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5tb3VudGVkLCBmcGF0aFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxldCBmc2V4aXN0cyA9IEZTLmV4aXN0c1N5bmMoZnNwYXRoKTtcblxuICAgICAgICAgICAgaWYgKGZzZXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0gRlMuc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFZQYXRoRGF0YT4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBzdGF0cy5tdGltZU1zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtcCA9IGRpci5tb3VudFBvaW50LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgPyBkaXIubW91bnRQb2ludC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgIDogZGlyLm1vdW50UG9pbnQ7XG4gICAgICAgIG1wID0gbXAuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgPyBtcFxuICAgICAgICAgICAgOiAobXArJy8nKTtcblxuICAgICAgICBpZiAoZnBhdGguc3RhcnRzV2l0aChtcCkpIHtcbiAgICAgICAgICAgIGxldCBwYXRoSW5Nb3VudGVkXG4gICAgICAgICAgICAgICAgPSBmcGF0aC5yZXBsYWNlKGRpci5tb3VudFBvaW50LCAnJyk7XG4gICAgICAgICAgICBsZXQgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5tb3VudGVkLCBwYXRoSW5Nb3VudGVkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDaGVja2luZyBleGlzdCBmb3IgJHtkaXIubW91bnRQb2ludH0gJHtkaXIubW91bnRlZH0gJHtwYXRoSW5Nb3VudGVkfSAke2ZzcGF0aH1gKTtcbiAgICAgICAgICAgIGxldCBmc2V4aXN0cyA9IEZTLmV4aXN0c1N5bmMoZnNwYXRoKTtcblxuICAgICAgICAgICAgaWYgKGZzZXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0gRlMuc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFZQYXRoRGF0YT4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzTXRpbWU6IHN0YXRzLm10aW1lTXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGdWxmaWxscyB0aGUgXCJmaW5kXCIgb3BlcmF0aW9uIG5vdCBieVxuICAgICAqIGxvb2tpbmcgaW4gdGhlIGRhdGFiYXNlLCBidXQgYnkgc2Nhbm5pbmdcbiAgICAgKiB0aGUgZmlsZXN5c3RlbSB1c2luZyBzeW5jaHJvbm91cyBjYWxscy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgZmluZFN5bmMoX2ZwYXRoKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcblxuICAgICAgICBpZiAodHlwZW9mIF9mcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZCBwYXJhbWV0ZXIgbm90IHN0cmluZyAke3R5cGVvZiBfZnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgLy8gY29uc3QgbWFwcGVkID0gcmVtYXBkaXJzKHRoaXMuZGlycyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kU3luYyBsb29raW5nIGZvciAke2ZwYXRofSBpbiAke3V0aWwuaW5zcGVjdChtYXBwZWQpfWApO1xuXG4gICAgICAgIC8vIGZvciAoY29uc3QgZGlyIG9mIG1hcHBlZCkge1xuICAgICAgICAvLyAgICAgaWYgKCEoZGlyPy5tb3VudFBvaW50KSkge1xuICAgICAgICAvLyAgICAgICAgIGNvbnNvbGUud2FybihgZmluZFN5bmMgYmFkIGRpcnMgaW4gJHt1dGlsLmluc3BlY3QodGhpcy5kaXJzKX1gKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gICAgIGNvbnN0IGZvdW5kID0gdGhpcy4jZkV4aXN0c0luRGlyKGZwYXRoLCBkaXIpO1xuICAgICAgICAvLyAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgIC8vICAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRTeW5jICR7ZnBhdGh9IGZvdW5kYCwgZm91bmQpO1xuICAgICAgICAvLyAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIFRPRE8gSXMgdGhpcyBmdW5jdGlvbiB1c2VkIGFueXdoZXJlP1xuICAgIC8vIGFzeW5jIGZpbmRBbGwoKSB7XG5cbiAgICAvLyAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgIC8vICAgICAvLyBjb25zdCByZXN1bHQxID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAvLyAgICAgLy8gfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgLy8gICAgIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5hbGwoYFxuICAgIC8vICAgICAgICAgU0VMRUNUICogRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9XG4gICAgLy8gICAgIGAsIHt9KTtcblxuICAgIC8vICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0MS5maWx0ZXIoaXRlbSA9PiB7XG4gICAgLy8gICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZEFsbCA/aWdub3JlPyAke2l0ZW0udnBhdGh9YCk7XG4gICAgLy8gICAgICAgICByZXR1cm4gIShmY2FjaGUuaWdub3JlRmlsZShpdGVtKSk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgICBjb25zdCByZXN1bHQzID0gcmVzdWx0Mi5tYXAoaXRlbSA9PiB7XG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKTtcbiAgICAvLyAgICAgfSlcbiAgICAvLyAgICAgcmV0dXJuIHJlc3VsdDM7XG4gICAgLy8gfVxufVxuXG5leHBvcnQgY2xhc3MgQXNzZXRzRmlsZUNhY2hlPFxuICAgIFQsIC8vIGV4dGVuZHMgQXNzZXQsXG4gICAgVGRhbyAvLyBleHRlbmRzIEJhc2VEQU88VD5cbj4gZXh0ZW5kcyBCYXNlRmlsZUNhY2hlPFQsIFRkYW8+IHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgLy8gY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIC8vIGRpcnM6IGRpclRvTW91bnRbXSxcbiAgICAgICAgZGFvOiBUZGFvXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKG5hbWUsIGRhbyk7XG4gICAgfVxuXG4gICAgLy8gcHJvdGVjdGVkIGN2dFJvd1RvT2JqKG9iajogYW55KTogQXNzZXQge1xuICAgIC8vICAgICBjb25zdCByZXQ6IEFzc2V0ID0gbmV3IEFzc2V0KCk7XG4gICAgLy8gICAgIHRoaXMuY3Z0Um93VG9PYmpCQVNFKG9iaiwgcmV0KTtcbiAgICAvLyAgICAgcmV0dXJuIHJldDtcbiAgICAvLyB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlc0ZpbGVDYWNoZTxcbiAgICBULCAvLyBleHRlbmRzIExheW91dCB8IFBhcnRpYWwsXG4gICAgVGRhbyAvLyBleHRlbmRzIEJhc2VEQU88VD4+XG4gICAgZXh0ZW5kcyBCYXNlRmlsZUNhY2hlPFQsIFRkYW8+PiB7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgLy8gY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIC8vIGRpcnM6IGRpclRvTW91bnRbXSxcbiAgICAgICAgZGFvOiBUZGFvLFxuICAgICAgICB0eXBlOiBcImxheW91dFwiIHwgXCJwYXJ0aWFsXCJcbiAgICApIHtcbiAgICAgICAgLy8gc3VwZXIoY29uZmlnLCBuYW1lLCBkaXJzLCBkYW8pO1xuICAgICAgICB0aGlzLiN0eXBlID0gdHlwZTtcbiAgICB9XG5cbiAgICAvLyBCZWNhdXNlIHRoaXMgY2xhc3Mgc2VydmVzIHR3byBwdXJwb3NlcywgTGF5b3V0XG4gICAgLy8gYW5kIFBhcnRpYWxzLCB0aGlzIGZsYWcgaGVscHMgdG8gZGlzdGluZ3Vpc2guXG4gICAgLy8gQW55IHBsYWNlLCBsaWtlIGN2dFJvd1RvT2JqLCB3aGljaCBuZWVkcyB0byBrbm93XG4gICAgLy8gd2hpY2ggaXMgd2hpY2ggY2FuIHVzZSB0aGVzZSBnZXR0ZXJzIHRvIGRvXG4gICAgLy8gdGhlIHJpZ2h0IHRoaW5nLlxuXG4gICAgI3R5cGU6IFwibGF5b3V0XCIgfCBcInBhcnRpYWxcIjtcbiAgICBnZXQgaXNMYXlvdXQoKSB7IHJldHVybiB0aGlzLiN0eXBlID09PSBcImxheW91dFwiOyB9XG4gICAgZ2V0IGlzUGFydGlhbCgpIHsgcmV0dXJuIHRoaXMuI3R5cGUgPT09IFwicGFydGlhbFwiOyB9XG5cbiAgICAvLyBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoob2JqOiBhbnkpOiBMYXlvdXQgfCBQYXJ0aWFsIHtcbiAgICAvLyAgICAgY29uc3QgcmV0OiBMYXlvdXQgfCBQYXJ0aWFsID0gXG4gICAgLy8gICAgICAgICAgICAgdGhpcy5pc0xheW91dCA/IG5ldyBMYXlvdXQoKSA6IG5ldyBQYXJ0aWFsKCk7XG4gICAgLy8gICAgIHRoaXMuY3Z0Um93VG9PYmpCQVNFKG9iaiwgcmV0KTtcblxuICAgIC8vICAgICAvLyBpZiAodHlwZW9mIG9iai5kb2NNZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAvLyAgICAgLy8gICYmIG9iai5kb2NNZXRhZGF0YSAhPT0gbnVsbFxuICAgIC8vICAgICAvLyApIHtcbiAgICAvLyAgICAgLy8gICAgIGlmICh0eXBlb2Ygb2JqLmRvY01ldGFkYXRhICE9PSAnc3RyaW5nJykge1xuICAgIC8vICAgICAvLyAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGVtcGxhdGVzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIGRvY01ldGFkYXRhLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAvLyAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgLy8gICAgIC8vICAgICAgICAgcmV0LmRvY01ldGFkYXRhID0gb2JqLmRvY01ldGFkYXRhO1xuICAgIC8vICAgICAvLyAgICAgfVxuICAgIC8vICAgICAvLyB9XG4gICAgLy8gICAgIGlmICh0eXBlb2Ygb2JqLmRvY0NvbnRlbnQgIT09ICd1bmRlZmluZWQnXG4gICAgLy8gICAgICAmJiBvYmouZG9jQ29udGVudCAhPT0gbnVsbFxuICAgIC8vICAgICApIHtcbiAgICAvLyAgICAgICAgIGlmIChvYmouZG9jQ29udGVudCA9PT0gbnVsbCkge1xuICAgIC8vICAgICAgICAgICAgIHJldC5kb2NDb250ZW50ID0gdW5kZWZpbmVkO1xuICAgIC8vICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLmRvY0NvbnRlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUZW1wbGF0ZXNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgZG9jQ29udGVudCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgLy8gICAgICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgICAgIHJldC5kb2NDb250ZW50ID0gb2JqLmRvY0NvbnRlbnQ7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgaWYgKHR5cGVvZiBvYmouZG9jQm9keSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAvLyAgICAgICYmIG9iai5kb2NCb2R5ICE9PSBudWxsXG4gICAgLy8gICAgICkge1xuICAgIC8vICAgICAgICAgaWYgKG9iai5kb2NCb2R5ID09PSBudWxsKSB7XG4gICAgLy8gICAgICAgICAgICAgcmV0LmRvY0JvZHkgPSB1bmRlZmluZWQ7XG4gICAgLy8gICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmouZG9jQm9keSAhPT0gJ3N0cmluZycpIHtcbiAgICAvLyAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRlbXBsYXRlc0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBkb2NCb2R5LCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAvLyAgICAgICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICAgICAgcmV0LmRvY0JvZHkgPSBvYmouZG9jQm9keTtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgfVxuICAgIC8vICAgICAvLyBpZiAodHlwZW9mIG9iai5tZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAvLyAgICAgLy8gICYmIG9iai5tZXRhZGF0YSAhPT0gbnVsbFxuICAgIC8vICAgICAvLyApIHtcbiAgICAvLyAgICAgLy8gICAgIGlmICh0eXBlb2Ygb2JqLm1ldGFkYXRhICE9PSAnc3RyaW5nJykge1xuICAgIC8vICAgICAvLyAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGVtcGxhdGVzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIG1ldGFkYXRhLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAvLyAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgLy8gICAgIC8vICAgICAgICAgcmV0Lm1ldGFkYXRhID0gb2JqLm1ldGFkYXRhO1xuICAgIC8vICAgICAvLyAgICAgfVxuICAgIC8vICAgICAvLyB9XG4gICAgLy8gICAgIHJldHVybiByZXQ7XG4gICAgLy8gfVxuXG4gICAgLyoqXG4gICAgICogR2F0aGVyIHRoZSBhZGRpdGlvbmFsIGRhdGEgc3VpdGFibGVcbiAgICAgKiBmb3IgUGFydGlhbCBhbmQgTGF5b3V0IHRlbXBsYXRlcy4gIFRoZVxuICAgICAqIGZ1bGwgZGF0YSBzZXQgcmVxdWlyZWQgZm9yIERvY3VtZW50cyBpc1xuICAgICAqIG5vdCBzdWl0YWJsZSBmb3IgdGhlIHRlbXBsYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmZvIFxuICAgICAqL1xuICAgIGdhdGhlckluZm9EYXRhKGluZm8pIHtcblxuICAgICAgICBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICBpbmZvLmRpcm5hbWUgPSBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLmRpcm5hbWUgPT09ICcuJykgaW5mby5kaXJuYW1lID0gJy8nO1xuXG4gICAgICAgIGxldCByZW5kZXJlciA9IHVuZGVmaW5lZDsgLy8gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaW5mby5yZW5kZXJlciA9IHJlbmRlcmVyO1xuXG5cbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG5cblxuICAgICAgICAgICAgaWYgKHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEpIHtcblxuICAgICAgICAgICAgICAgIC8vIFVzaW5nIDxhbnk+IGhlcmUgY292ZXJzIG92ZXJcbiAgICAgICAgICAgICAgICAvLyB0aGF0IHBhcnNlTWV0YWRhdGEgcmVxdWlyZXNcbiAgICAgICAgICAgICAgICAvLyBhIFJlbmRlcmluZ0NvbnRleHQgd2hpY2hcbiAgICAgICAgICAgICAgICAvLyBpbiB0dXJuIHJlcXVpcmVzIGEgXG4gICAgICAgICAgICAgICAgLy8gbWV0YWRhdGEgb2JqZWN0LlxuICAgICAgICAgICAgICAgIGNvbnN0IHJjID0gcmVuZGVyZXIucGFyc2VNZXRhZGF0YSg8YW55PntcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBpbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogRlMucmVhZEZpbGVTeW5jKGluZm8uZnNwYXRoLCAndXRmLTgnKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gZG9jTWV0YWRhdGEgaXMgdGhlIHVubW9kaWZpZWQgbWV0YWRhdGEvZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgZG9jdW1lbnRcbiAgICAgICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhID0gcmMubWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgLy8gZG9jQ29udGVudCBpcyB0aGUgdW5wYXJzZWQgb3JpZ2luYWwgY29udGVudFxuICAgICAgICAgICAgICAgIC8vIGluY2x1ZGluZyBhbnkgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0NvbnRlbnQgPSByYy5jb250ZW50O1xuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBjb21wdXRlZCBtZXRhZGF0YSB0aGF0IGluY2x1ZGVzIGRhdGEgZnJvbSBcbiAgICAgICAgICAgICAgICAvLyBzZXZlcmFsIHNvdXJjZXNcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhID0geyB9O1xuICAgICAgICAgICAgICAgIGlmICghaW5mby5kb2NNZXRhZGF0YSkgaW5mby5kb2NNZXRhZGF0YSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gaW5mby5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGluaXRNZXRhZGF0YSAke2Jhc2VkaXJ9ICR7ZnBhdGh9IGJhc2VNZXRhZGF0YSAke2Jhc2VNZXRhZGF0YVt5cHJvcF19YCk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5iYXNlTWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBUZW1wbGF0ZXNGaWxlQ2FjaGUgYWZ0ZXIgZ2F0aGVySW5mb0RhdGEgYCwgaW5mbyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoaW5mbykge1xuICAgICAgICAvLyBhd2FpdCB0aGlzLmRhby51cGRhdGUoKHtcbiAgICAgICAgLy8gICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAvLyAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAvLyAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAvLyAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAvLyAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAvLyAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAvLyAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAvLyAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgIC8vICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgIC8vICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIC8vICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgLy8gICAgIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgLy8gICAgIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgLy8gICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAvLyAgICAgaW5mbyxcbiAgICAgICAgLy8gfSBhcyB1bmtub3duKSBhcyBUKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihpbmZvOiBhbnkpIHtcbiAgICAgICAgLy8gYXdhaXQgdGhpcy5kYW8uaW5zZXJ0KCh7XG4gICAgICAgIC8vICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgLy8gICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgLy8gICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgLy8gICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgLy8gICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgLy8gICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgLy8gICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgLy8gICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAvLyAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAvLyAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAvLyAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgIC8vICAgICBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgIC8vICAgICBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgIC8vICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgLy8gICAgIGluZm8sXG4gICAgICAgIC8vIH0gYXMgdW5rbm93bikgYXMgVCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRzRmlsZUNhY2hlXG4gICAgLyogZXh0ZW5kcyBCYXNlRmlsZUNhY2hlPERvY3VtZW50ICwgVGRvY3VtZW50c3NEQU8gPiAqLyB7XG5cbiAgICAvLyBjb25zdHJ1Y3RvcihcbiAgICAvLyAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgIC8vICAgICBuYW1lOiBzdHJpbmcsXG4gICAgLy8gICAgIGRpcnM6IGRpclRvTW91bnRbXVxuICAgIC8vICkge1xuICAgIC8vICAgICBzdXBlcihjb25maWcsIG5hbWUsIGRpcnMsIGRvY3VtZW50c0RBTyk7XG4gICAgLy8gfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKG9iajogYW55KTogRG9jdW1lbnQge1xuICAgICAgICBjb25zdCByZXQ6IERvY3VtZW50ID0gbmV3IERvY3VtZW50KCk7XG4gICAgICAgIC8vIHRoaXMuY3Z0Um93VG9PYmpCQVNFKG9iaiwgcmV0KTtcblxuICAgICAgICAvLyBpZiAodHlwZW9mIG9iai5kb2NNZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgLy8gICYmIG9iai5kb2NNZXRhZGF0YSAhPT0gbnVsbFxuICAgICAgICAvLyApIHtcbiAgICAgICAgLy8gICAgIGlmICh0eXBlb2Ygb2JqLmRvY01ldGFkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIGRvY01ldGFkYXRhLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgICAgcmV0LmRvY01ldGFkYXRhID0gb2JqLmRvY01ldGFkYXRhO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLnB1YmxpY2F0aW9uVGltZSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5wdWJsaWNhdGlvblRpbWUgIT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5wdWJsaWNhdGlvblRpbWUgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgcHVibGljYXRpb25UaW1lLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gcmV0LnB1YmxpY2F0aW9uVGltZSA9IG9iai5wdWJsaWNhdGlvblRpbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jQ29udGVudCAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5kb2NDb250ZW50ICE9PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jQ29udGVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBkb2NDb250ZW50LCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gcmV0LmRvY0NvbnRlbnQgPSBvYmouZG9jQ29udGVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5kb2NCb2R5ICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgJiYgb2JqLmRvY0JvZHkgIT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5kb2NCb2R5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIGRvY0JvZHksIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyByZXQuZG9jQm9keSA9IG9iai5kb2NCb2R5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmxheW91dCAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5sYXlvdXQgIT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5sYXlvdXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgbGF5b3V0LCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gcmV0LmxheW91dCA9IG9iai5sYXlvdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouYmxvZ3RhZyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5ibG9ndGFnICE9PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouYmxvZ3RhZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBibG9ndGFnLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gcmV0LmJsb2d0YWcgPSBvYmouYmxvZ3RhZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBpZiAodHlwZW9mIG9iai5tZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgLy8gICYmIG9iai5tZXRhZGF0YSAhPT0gbnVsbFxuICAgICAgICAvLyApIHtcbiAgICAgICAgLy8gICAgIGlmICh0eXBlb2Ygb2JqLm1ldGFkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIG1ldGFkYXRhLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgICAgcmV0Lm1ldGFkYXRhID0gb2JqLm1ldGFkYXRhO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbykge1xuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIGluZm8uZGlybmFtZSA9IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8uZGlybmFtZSA9PT0gJy4nKSBpbmZvLmRpcm5hbWUgPSAnLyc7XG4gICAgICAgIGluZm8ucGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGluZm8uZGlybmFtZSk7XG5cbiAgICAgICAgLy8gZmluZCB0aGUgbW91bnRlZCBkaXJlY3RvcnksXG4gICAgICAgIC8vIGdldCB0aGUgYmFzZU1ldGFkYXRhXG4gICAgICAgIC8vIGZvciAobGV0IGRpciBvZiByZW1hcGRpcnModGhpcy5kaXJzKSkge1xuICAgICAgICAvLyAgICAgaWYgKGRpci5tb3VudGVkID09PSBpbmZvLm1vdW50ZWQpIHtcbiAgICAgICAgLy8gICAgICAgICBpZiAoZGlyLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLmJhc2VNZXRhZGF0YSA9IGRpci5iYXNlTWV0YWRhdGE7XG4gICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAvLyAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gc2V0IHB1YmxpY2F0aW9uRGF0ZSBzb21laG93XG5cblxuICAgICAgICAvLyBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICAvLyBpbmZvLnJlbmRlcmVyID0gcmVuZGVyZXI7XG5cbiAgICAgICAgaWYgKC8qcmVuZGVyZXIqLyBmYWxzZSkge1xuXG4gICAgICAgICAgICAvLyBpbmZvLnJlbmRlclBhdGhcbiAgICAgICAgICAgIC8vICAgICA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8udnBhdGgpO1xuXG4gICAgICAgICAgICAvLyBUaGlzIHdhcyBpbiB0aGUgTG9raUpTIGNvZGUsIGJ1dFxuICAgICAgICAgICAgLy8gd2FzIG5vdCBpbiB1c2UuXG4gICAgICAgICAgICAvLyBpbmZvLnJlbmRlcm5hbWUgPSBwYXRoLmJhc2VuYW1lKFxuICAgICAgICAgICAgLy8gICAgIGluZm8ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gKTtcblxuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID1cbiAgICAgICAgICAgICAgICBtaWNyb21hdGNoLmlzTWF0Y2goXG4gICAgICAgICAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgJyoqLyouaHRtbCcpXG4gICAgICAgICAgICAgfHwgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqLmh0bWwnKVxuICAgICAgICAgICAgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgIC8vICAgICAvLyBVc2luZyA8YW55PiBoZXJlIGNvdmVycyBvdmVyXG4gICAgICAgICAgICAvLyAgICAgLy8gdGhhdCBwYXJzZU1ldGFkYXRhIHJlcXVpcmVzXG4gICAgICAgICAgICAvLyAgICAgLy8gYSBSZW5kZXJpbmdDb250ZXh0IHdoaWNoXG4gICAgICAgICAgICAvLyAgICAgLy8gaW4gdHVybiByZXF1aXJlcyBhIFxuICAgICAgICAgICAgLy8gICAgIC8vIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgICAgICAgIC8vICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAvLyAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgIC8vICAgICB9KTtcblxuICAgICAgICAgICAgLy8gICAgIC8vIGRvY01ldGFkYXRhIGlzIHRoZSB1bm1vZGlmaWVkIG1ldGFkYXRhL2Zyb250bWF0dGVyXG4gICAgICAgICAgICAvLyAgICAgLy8gaW4gdGhlIGRvY3VtZW50XG4gICAgICAgICAgICAvLyAgICAgaW5mby5kb2NNZXRhZGF0YSA9IHJjLm1ldGFkYXRhO1xuICAgICAgICAgICAgLy8gICAgIC8vIGRvY0NvbnRlbnQgaXMgdGhlIHVucGFyc2VkIG9yaWdpbmFsIGNvbnRlbnRcbiAgICAgICAgICAgIC8vICAgICAvLyBpbmNsdWRpbmcgYW55IGZyb250bWF0dGVyXG4gICAgICAgICAgICAvLyAgICAgaW5mby5kb2NDb250ZW50ID0gcmMuY29udGVudDtcbiAgICAgICAgICAgIC8vICAgICAvLyBkb2NCb2R5IGlzIHRoZSBwYXJzZWQgYm9keSAtLSBlLmcuIGZvbGxvd2luZyB0aGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgIC8vICAgICBpbmZvLmRvY0JvZHkgPSByYy5ib2R5O1xuXG4gICAgICAgICAgICAvLyAgICAgLy8gVGhpcyBpcyB0aGUgY29tcHV0ZWQgbWV0YWRhdGEgdGhhdCBpbmNsdWRlcyBkYXRhIGZyb20gXG4gICAgICAgICAgICAvLyAgICAgLy8gc2V2ZXJhbCBzb3VyY2VzXG4gICAgICAgICAgICAvLyAgICAgaW5mby5tZXRhZGF0YSA9IHsgfTtcbiAgICAgICAgICAgIC8vICAgICBpZiAoIWluZm8uZG9jTWV0YWRhdGEpIGluZm8uZG9jTWV0YWRhdGEgPSB7fTtcblxuICAgICAgICAgICAgLy8gICAgIC8vIFRoZSByZXN0IG9mIHRoaXMgaXMgYWRhcHRlZCBmcm9tIHRoZSBvbGQgZnVuY3Rpb25cbiAgICAgICAgICAgIC8vICAgICAvLyBIVE1MUmVuZGVyZXIubmV3SW5pdE1ldGFkYXRhXG5cbiAgICAgICAgICAgIC8vICAgICAvLyBGb3Igc3RhcnRlcnMgdGhlIG1ldGFkYXRhIGlzIGNvbGxlY3RlZCBmcm9tIHNldmVyYWwgc291cmNlcy5cbiAgICAgICAgICAgIC8vICAgICAvLyAxKSB0aGUgbWV0YWRhdGEgc3BlY2lmaWVkIGluIHRoZSBkaXJlY3RvcnkgbW91bnQgd2hlcmVcbiAgICAgICAgICAgIC8vICAgICAvLyAgICB0aGlzIGRvY3VtZW50IHdhcyBmb3VuZFxuICAgICAgICAgICAgLy8gICAgIC8vIDIpIG1ldGFkYXRhIGluIHRoZSBwcm9qZWN0IGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIC8vICAgICAvLyAzKSB0aGUgbWV0YWRhdGEgaW4gdGhlIGRvY3VtZW50LCBhcyBjYXB0dXJlZCBpbiBkb2NNZXRhZGF0YVxuXG4gICAgICAgICAgICAvLyAgICAgZm9yIChsZXQgeXByb3AgaW4gaW5mby5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgLy8gY29uc29sZS5sb2coYGluaXRNZXRhZGF0YSAke2Jhc2VkaXJ9ICR7ZnBhdGh9IGJhc2VNZXRhZGF0YSAke2Jhc2VNZXRhZGF0YVt5cHJvcF19YCk7XG4gICAgICAgICAgICAvLyAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5iYXNlTWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vICAgICBmb3IgKGxldCB5cHJvcCBpbiB0aGlzLmNvbmZpZy5tZXRhZGF0YSkge1xuICAgICAgICAgICAgLy8gICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IHRoaXMuY29uZmlnLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyAgICAgbGV0IGZtbWNvdW50ID0gMDtcbiAgICAgICAgICAgIC8vICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmRvY01ldGFkYXRhKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5kb2NNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAvLyAgICAgICAgIGZtbWNvdW50Kys7XG4gICAgICAgICAgICAvLyAgICAgfVxuXG4gICAgICAgICAgICAvLyAgICAgLy8gVGhlIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhlIGNvbnRlbnQgbGFuZHMgaGVyZVxuICAgICAgICAgICAgLy8gICAgIGluZm8ubWV0YWRhdGEuY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICAvLyAgICAgLy8gVGhlIGRvY3VtZW50IG9iamVjdCBoYXMgYmVlbiB1c2VmdWwgZm9yIFxuICAgICAgICAgICAgLy8gICAgIC8vIGNvbW11bmljYXRpbmcgdGhlIGZpbGUgcGF0aCBhbmQgb3RoZXIgZGF0YS5cbiAgICAgICAgICAgIC8vICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50ID0ge307XG4gICAgICAgICAgICAvLyAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5iYXNlZGlyID0gaW5mby5tb3VudFBvaW50O1xuICAgICAgICAgICAgLy8gICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscGF0aCA9IGluZm8ucGF0aEluTW91bnRlZDtcbiAgICAgICAgICAgIC8vICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHJlbmRlciA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8ucGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAvLyAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5wYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgICAgIC8vICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvID0gaW5mby5yZW5kZXJQYXRoO1xuXG4gICAgICAgICAgICAvLyAgICAgLy8gRW5zdXJlIHRoZSA8ZW0+dGFnczwvZW0+IGZpZWxkIGlzIGFuIGFycmF5XG4gICAgICAgICAgICAvLyAgICAgaWYgKCEoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgLy8gICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSBbXTtcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoaW5mby5tZXRhZGF0YS50YWdzKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgbGV0IHRhZ2xpc3QgPSBbXTtcbiAgICAgICAgICAgIC8vICAgICAgICAgY29uc3QgcmUgPSAvXFxzKixcXHMqLztcbiAgICAgICAgICAgIC8vICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzLnNwbGl0KHJlKS5mb3JFYWNoKHRhZyA9PiB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB0YWdsaXN0LnB1c2godGFnLnRyaW0oKSk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSB0YWdsaXN0O1xuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgLy8gICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBgRk9STUFUIEVSUk9SIC0gJHtpbmZvLnZwYXRofSBoYXMgYmFkbHkgZm9ybWF0dGVkIHRhZ3MgYCxcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gICAgIGluZm8uZG9jTWV0YWRhdGEudGFncyA9IGluZm8ubWV0YWRhdGEudGFncztcblxuICAgICAgICAgICAgLy8gICAgIC8vIGlmIChpbmZvLm1ldGFkYXRhLmJsb2d0YWcpIHtcbiAgICAgICAgICAgIC8vICAgICAvLyAgICAgaW5mby5ibG9ndGFnID0gaW5mby5tZXRhZGF0YS5ibG9ndGFnO1xuICAgICAgICAgICAgLy8gICAgIC8vIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIC8vICAgICAvLyBUaGUgcm9vdCBVUkwgZm9yIHRoZSBwcm9qZWN0XG4gICAgICAgICAgICAvLyAgICAgaW5mby5tZXRhZGF0YS5yb290X3VybCA9IHRoaXMuY29uZmlnLnJvb3RfdXJsO1xuXG4gICAgICAgICAgICAvLyAgICAgLy8gQ29tcHV0ZSB0aGUgVVJMIHRoaXMgZG9jdW1lbnQgd2lsbCByZW5kZXIgdG9cbiAgICAgICAgICAgIC8vICAgICBpZiAodGhpcy5jb25maWcucm9vdF91cmwpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgbGV0IHVSb290VXJsID0gbmV3IFVSTCh0aGlzLmNvbmZpZy5yb290X3VybCwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgLy8gICAgICAgICB1Um9vdFVybC5wYXRobmFtZSA9IHBhdGgubm9ybWFsaXplKFxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgIHBhdGguam9pbih1Um9vdFVybC5wYXRobmFtZSwgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbylcbiAgICAgICAgICAgIC8vICAgICAgICAgKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSB1Um9vdFVybC50b1N0cmluZygpO1xuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfdXJsID0gaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbztcbiAgICAgICAgICAgIC8vICAgICB9XG5cbiAgICAgICAgICAgIC8vICAgICAvLyBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX2RhdGUgPSBpbmZvLnN0YXRzLm10aW1lO1xuXG4gICAgICAgICAgICAvLyAgICAgY29uc3QgcGFyc2VQdWJsRGF0ZSA9IChkYXRlKSA9PiB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGNvbnN0IHBhcnNlZCA9IERhdGUucGFyc2UoZGF0ZSk7XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmICghIGlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH07XG5cbiAgICAgICAgICAgIC8vICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgLy8gICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgIC8vICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgIC8vICAgICB9XG5cbiAgICAgICAgICAgIC8vICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHZhciBkYXRlU2V0ID0gZmFsc2U7XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAvLyAgICAgICAgICAmJiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgIC8vICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICAgICAgICAgaWYgKCEgZGF0ZVNldCAmJiBpbmZvLm10aW1lTXMpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUoaW5mby5tdGltZU1zKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2luZm8udnBhdGh9IG1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSAke2luZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlfSBzZXQgZnJvbSBzdGF0cy5tdGltZWApO1xuICAgICAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmICghaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2luZm8udnBhdGh9IG1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSAke2luZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlfSBzZXQgZnJvbSBjdXJyZW50IHRpbWVgKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH1cblxuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGRlbGV0ZURvY1RhZ0dsdWUodnBhdGgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUodnBhdGgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIGlnbm9yZVxuICAgICAgICAgICAgLy8gVGhpcyBjYW4gdGhyb3cgYW4gZXJyb3IgbGlrZTpcbiAgICAgICAgICAgIC8vIGRvY3VtZW50c0NhY2hlIEVSUk9SIHtcbiAgICAgICAgICAgIC8vICAgICBjb2RlOiAnY2hhbmdlZCcsXG4gICAgICAgICAgICAvLyAgICAgbmFtZTogJ2RvY3VtZW50cycsXG4gICAgICAgICAgICAvLyAgICAgdnBhdGg6ICdfbWVybWFpZC9yZW5kZXIzMzU2NzM5MzgyLm1lcm1haWQnLFxuICAgICAgICAgICAgLy8gICAgIGVycm9yOiBFcnJvcjogZGVsZXRlIGZyb20gJ1RBR0dMVUUnIGZhaWxlZDogbm90aGluZyBjaGFuZ2VkXG4gICAgICAgICAgICAvLyAgICAgIC4uLiBzdGFjayB0cmFjZVxuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gSW4gc3VjaCBhIGNhc2UgdGhlcmUgaXMgbm8gdGFnR2x1ZSBmb3IgdGhlIGRvY3VtZW50LlxuICAgICAgICAgICAgLy8gVGhpcyBcImVycm9yXCIgaXMgc3B1cmlvdXMuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gVE9ETyBJcyB0aGVyZSBhbm90aGVyIHF1ZXJ5IHRvIHJ1biB0aGF0IHdpbGxcbiAgICAgICAgICAgIC8vIG5vdCB0aHJvdyBhbiBlcnJvciBpZiBub3RoaW5nIHdhcyBjaGFuZ2VkP1xuICAgICAgICAgICAgLy8gSW4gb3RoZXIgd29yZHMsIHRoaXMgY291bGQgaGlkZSBhIGxlZ2l0aW1hdGVcbiAgICAgICAgICAgIC8vIGVycm9yLlxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGFkZERvY1RhZ0dsdWUodnBhdGg6IHN0cmluZywgdGFnczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0YWdzICE9PSAnc3RyaW5nJ1xuICAgICAgICAgJiYgIUFycmF5LmlzQXJyYXkodGFncylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZERvY1RhZ0dsdWUgbXVzdCBiZSBnaXZlbiBhIHRhZ3MgYXJyYXksIHdhcyBnaXZlbjogJHt1dGlsLmluc3BlY3QodGFncyl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYXdhaXQgdGdsdWUuYWRkVGFnR2x1ZSh2cGF0aCwgXG4gICAgICAgIC8vICAgICBBcnJheS5pc0FycmF5KHRhZ3MpXG4gICAgICAgIC8vICAgICA/IHRhZ3NcbiAgICAgICAgLy8gICAgIDogWyB0YWdzIF0pO1xuICAgIH1cblxuICAgIGFzeW5jIGFkZFRhZ0Rlc2NyaXB0aW9uKHRhZzogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIC8vIHJldHVybiB0ZGVzYy5hZGREZXNjKHRhZywgZGVzY3JpcHRpb24pO1xuICAgIH1cblxuICAgIGFzeW5jIGdldFRhZ0Rlc2NyaXB0aW9uKHRhZzogc3RyaW5nKVxuICAgICAgICAvLyA6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPlxuICAgIHtcbiAgICAgICAgLy8gcmV0dXJuIHRkZXNjLmdldERlc2ModGFnKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvKSB7XG4gICAgICAgIC8vIGNvbnN0IGRvY0luZm8gPSA8RG9jdW1lbnQ+e1xuICAgICAgICAvLyAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgIC8vICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgIC8vICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgIC8vICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgIC8vICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgIC8vICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgIC8vICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgIC8vICAgICByZW5kZXJzVG9IVE1MOlxuICAgICAgICAvLyAgICAgICAgIHR5cGVvZiBpbmZvLnJlbmRlcnNUb0hUTUwgPT09ICd1bmRlZmluZWQnXG4gICAgICAgIC8vICAgICAgICAgPyBmYWxzZVxuICAgICAgICAvLyAgICAgICAgIDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAvLyAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgIC8vICAgICBwYXJlbnREaXI6IGluZm8ucGFyZW50RGlyLFxuICAgICAgICAvLyAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAvLyAgICAgYmFzZU1ldGFkYXRhOiBpbmZvLmJhc2VNZXRhZGF0YSxcbiAgICAgICAgLy8gICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAvLyAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAvLyAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAvLyAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgIC8vICAgICB0YWdzOiBBcnJheS5pc0FycmF5KGluZm8ubWV0YWRhdGE/LnRhZ3MpXG4gICAgICAgIC8vICAgICAgICAgICAgID8gaW5mby5tZXRhZGF0YS50YWdzXG4gICAgICAgIC8vICAgICAgICAgICAgIDogW10sXG4gICAgICAgIC8vICAgICAvLyBsYXlvdXQ6IGluZm8ubGF5b3V0LCAvLyBpbmZvLm1ldGFkYXRhPy5sYXlvdXQsXG4gICAgICAgIC8vICAgICAvLyBibG9ndGFnOiBpbmZvLmJsb2d0YWcsXG4gICAgICAgIC8vICAgICBpbmZvLFxuICAgICAgICAvLyB9O1xuXG4gICAgICAgIC8vIGF3YWl0IHRoaXMuZGFvLnVwZGF0ZShkb2NJbmZvKTtcblxuICAgICAgICAvLyBhd2FpdCB0Z2x1ZS5kZWxldGVUYWdHbHVlKGRvY0luZm8udnBhdGgpO1xuICAgICAgICAvLyBhd2FpdCB0Z2x1ZS5hZGRUYWdHbHVlKGRvY0luZm8udnBhdGgsIGRvY0luZm8udGFncyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbzogYW55KSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5mby5yZW5kZXJzVG9IVE1MID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgfHwgaW5mby5yZW5kZXJzVG9IVE1MID09PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpbmZvLmJhc2VNZXRhZGF0YSkgaW5mby5iYXNlTWV0YWRhdGEgPSB7fTtcbiAgICAgICAgaWYgKCFpbmZvLmRvY01ldGFkYXRhKSBpbmZvLmRvY01ldGFkYXRhID0ge307XG4gICAgICAgIGlmICghaW5mby5kb2NDb250ZW50KSBpbmZvLmRvY0NvbnRlbnQgPSAnJztcbiAgICAgICAgaWYgKCFpbmZvLmRvY0JvZHkpIGluZm8uZG9jQm9keSA9ICcnO1xuICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEpIGluZm8ubWV0YWRhdGEgPSB7fTtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGluZm8ubWV0YWRhdGE/LnRhZ3MpKSBpbmZvLm1ldGFkYXRhLnRhZ3MgPSBbXTtcbiAgICAgICAgaWYgKCFpbmZvLm1ldGFkYXRhLmxheW91dCkgaW5mby5tZXRhZGF0YS5sYXlvdXQgPSAnJztcbiAgICAgICAgaWYgKCFpbmZvLm1ldGFkYXRhLmJsb2d0YWcpIGluZm8ubWV0YWRhdGEuYmxvZ3RhZyA9ICcnO1xuICAgICAgICAvLyBjb25zdCBzaWJsaW5ncyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLnJ1bihcbiAgICAgICAgLy8gICAgIGBJTlNFUlQgSU5UTyBET0NVTUVOVFNcbiAgICAgICAgLy8gICAgICAgICAoXG4gICAgICAgIC8vICAgICAgICAgIHZwYXRoLCBtaW1lLFxuICAgICAgICAvLyAgICAgICAgICBtb3VudGVkLCBtb3VudFBvaW50LCBwYXRoSW5Nb3VudGVkLFxuICAgICAgICAvLyAgICAgICAgICBmc3BhdGgsIHJlbmRlclBhdGgsXG4gICAgICAgIC8vICAgICAgICAgIHJlbmRlcnNUb0hUTUwsXG4gICAgICAgIC8vICAgICAgICAgIGRpcm5hbWUsIHBhcmVudERpcixcbiAgICAgICAgLy8gICAgICAgICAgbXRpbWVNcyxcbiAgICAgICAgLy8gICAgICAgICAgZG9jTWV0YWRhdGEsXG4gICAgICAgIC8vICAgICAgICAgIGRvY0NvbnRlbnQsXG4gICAgICAgIC8vICAgICAgICAgIGRvY0JvZHksXG4gICAgICAgIC8vICAgICAgICAgIGluZm9cbiAgICAgICAgLy8gICAgICAgICApXG4gICAgICAgIC8vICAgICAgICAgVkFMVUVTIChcbiAgICAgICAgLy8gICAgICAgICAgJHZwYXRoLCAkbWltZSxcbiAgICAgICAgLy8gICAgICAgICAgJG1vdW50ZWQsICRtb3VudFBvaW50LCAkcGF0aEluTW91bnRlZCxcbiAgICAgICAgLy8gICAgICAgICAgJGZzcGF0aCwgJHJlbmRlclBhdGgsXG4gICAgICAgIC8vICAgICAgICAgICRyZW5kZXJzVG9IVE1MLFxuICAgICAgICAvLyAgICAgICAgICAkZGlybmFtZSwgJHBhcmVudERpcixcbiAgICAgICAgLy8gICAgICAgICAgJG10aW1lTXMsXG4gICAgICAgIC8vICAgICAgICAgICRkb2NNZXRhZGF0YSxcbiAgICAgICAgLy8gICAgICAgICAgJGRvY0NvbnRlbnQsXG4gICAgICAgIC8vICAgICAgICAgICRkb2NCb2R5LFxuICAgICAgICAvLyAgICAgICAgICAkaW5mb1xuICAgICAgICAvLyAgICAgICAgIClcbiAgICAgICAgLy8gICAgIGAsIHtcbiAgICAgICAgLy8gICAgICAgICAkdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgIC8vICAgICAgICAgJG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgLy8gICAgICAgICAkbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAvLyAgICAgICAgICRtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgIC8vICAgICAgICAgJHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgLy8gICAgICAgICAkZnNwYXRoOiBwYXRoLmpvaW4oXG4gICAgICAgIC8vICAgICAgICAgICAgIGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkXG4gICAgICAgIC8vICAgICAgICAgKSxcbiAgICAgICAgLy8gICAgICAgICAkcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAvLyAgICAgICAgICRyZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgIC8vICAgICAgICAgJGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAvLyAgICAgICAgICRwYXJlbnREaXI6IHBhdGguZGlybmFtZShcbiAgICAgICAgLy8gICAgICAgICAgICAgcGF0aC5kaXJuYW1lKFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoXG4gICAgICAgIC8vICAgICAgICAgKSksXG4gICAgICAgIC8vICAgICAgICAgJG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgLy8gICAgICAgICAvLyAkYmFzZU1ldGFkYXRhOiBKU09OLnN0cmluZ2lmeShpbmZvLmJhc2VNZXRhZGF0YSksXG4gICAgICAgIC8vICAgICAgICAgJGRvY01ldGFkYXRhOiBKU09OLnN0cmluZ2lmeShpbmZvLmRvY01ldGFkYXRhKSxcbiAgICAgICAgLy8gICAgICAgICAkZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAvLyAgICAgICAgICRkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgIC8vICAgICAgICAgLy8gJG1ldGFkYXRhOiBKU09OLnN0cmluZ2lmeShpbmZvLm1ldGFkYXRhKSxcbiAgICAgICAgLy8gICAgICAgICAkaW5mbzogSlNPTi5zdHJpbmdpZnkoaW5mbylcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gKVxuICAgICAgICAvLyAvLyBhd2FpdCB0aGlzLmRhby5pbnNlcnQoZG9jSW5mbyk7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRkRG9jVGFnR2x1ZShcbiAgICAgICAgICAgIGluZm8udnBhdGgsIGluZm8ubWV0YWRhdGEudGFnc1xuICAgICAgICApO1xuICAgIH1cblxuICAgIGFzeW5jIGhhbmRsZVVubGlua2VkKG5hbWU6IGFueSwgaW5mbzogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIC8vIGF3YWl0IHN1cGVyLmhhbmRsZVVubGlua2VkKG5hbWUsIGluZm8pO1xuICAgICAgICAvLyB0Z2x1ZS5kZWxldGVUYWdHbHVlKGluZm8udnBhdGgpO1xuICAgIH1cblxuICAgIGFzeW5jIGluZGV4Q2hhaW4oX2ZwYXRoKSB7XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKSBcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IHBhdGgucGFyc2UoZnBhdGgpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbmRleENoYWluICR7X2ZwYXRofSAke2ZwYXRofWAsIHBhcnNlZCk7XG5cbiAgICAgICAgY29uc3QgZmlsZXo6IERvY3VtZW50W10gPSBbXTtcbiAgICAgICAgLy8gY29uc3Qgc2VsZiA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChmcGF0aCk7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGZwYXRoO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmKSAmJiBzZWxmLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICBmaWxlei5wdXNoKHNlbGZbMF0pO1xuICAgICAgICAgICAgZmlsZU5hbWUgPSBzZWxmWzBdLnJlbmRlclBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50RGlyO1xuICAgICAgICBsZXQgZGlyTmFtZSA9IHBhdGguZGlybmFtZShmcGF0aCk7XG4gICAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICghKGRpck5hbWUgPT09ICcuJyB8fCBkaXJOYW1lID09PSBwYXJzZWQucm9vdCkpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGVOYW1lKSA9PT0gJ2luZGV4Lmh0bWwnKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShmaWxlTmFtZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxvb2tGb3IgPSBwYXRoLmpvaW4ocGFyZW50RGlyLCBcImluZGV4Lmh0bWxcIik7XG5cbiAgICAgICAgICAgIC8vIGNvbnN0IGluZGV4ID0gYXdhaXQgdGhpcy5maW5kQnlQYXRoKGxvb2tGb3IpO1xuXG4gICAgICAgICAgICAvLyBpZiAoQXJyYXkuaXNBcnJheShpbmRleCkgJiYgaW5kZXgubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIC8vICAgICBmaWxlei5wdXNoKGluZGV4WzBdKTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgZmlsZU5hbWUgPSBsb29rRm9yO1xuICAgICAgICAgICAgZGlyTmFtZSA9IHBhdGguZGlybmFtZShsb29rRm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWxlelxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24ob2JqOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmZvdW5kRGlyID0gb2JqLm1vdW50UG9pbnQ7XG4gICAgICAgICAgICAgICAgICAgIG9iai5mb3VuZFBhdGggPSBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmZpbGVuYW1lID0gJy8nICsgb2JqLnJlbmRlclBhdGg7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAucmV2ZXJzZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmRzIGFsbCB0aGUgZG9jdW1lbnRzIGluIHRoZSBzYW1lIGRpcmVjdG9yeVxuICAgICAqIGFzIHRoZSBuYW1lZCBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBkb2Vzbid0IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBzaWJsaW5ncyhfZnBhdGgpIHtcbiAgICAgICAgbGV0IHJldDtcbiAgICAgICAgbGV0IHZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUodnBhdGgpO1xuXG4gICAgICAgIC8vIGNvbnN0IHNpYmxpbmdzID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgLy8gICAgIFNFTEVDVCAqIEZST00gJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfVxuICAgICAgICAvLyAgICAgV0hFUkVcbiAgICAgICAgLy8gICAgIGRpcm5hbWUgPSAkZGlybmFtZSBBTkRcbiAgICAgICAgLy8gICAgIHZwYXRoIDw+ICR2cGF0aCBBTkRcbiAgICAgICAgLy8gICAgIHJlbmRlclBhdGggPD4gJHZwYXRoIEFORFxuICAgICAgICAvLyAgICAgcmVuZGVyc1RvSHRtbCA9IHRydWVcbiAgICAgICAgLy8gYCwge1xuICAgICAgICAvLyAgICAgJGRpcm5hbWU6IGRpcm5hbWUsXG4gICAgICAgIC8vICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIC8vIGNvbnN0IGlnbm9yZWQgPSBzaWJsaW5ncy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgIC8vICAgICByZXR1cm4gIXRoaXMuaWdub3JlRmlsZShpdGVtKTtcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gY29uc3QgbWFwcGVkID0gaWdub3JlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgIC8vICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIHJldHVybiBtYXBwZWQ7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdHJlZSBvZiBpdGVtcyBzdGFydGluZyBmcm9tIHRoZSBkb2N1bWVudFxuICAgICAqIG5hbWVkIGluIF9yb290SXRlbS4gIFRoZSBwYXJhbWV0ZXIgc2hvdWxkIGJlIGFuXG4gICAgICogYWN0dWFsIGRvY3VtZW50IGluIHRoZSB0cmVlLCBzdWNoIGFzIGBwYXRoL3RvL2luZGV4Lmh0bWxgLlxuICAgICAqIFRoZSByZXR1cm4gaXMgYSB0cmVlLXNoYXBlZCBzZXQgb2Ygb2JqZWN0cyBsaWtlIHRoZSBmb2xsb3dpbmc7XG4gICAgICogXG4gIHRyZWU6XG4gICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXJcbiAgICBpdGVtczpcbiAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sLm1kXG4gICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgY2hpbGRGb2xkZXJzOlxuICAgICAgICAtIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyXG4gICAgICAgICAgY2hpbGRyZW46XG4gICAgICAgICAgICAgIHJvb3RJdGVtOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgICAgICAgICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyXG4gICAgICAgICAgICAgIGl0ZW1zOlxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMS5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMS5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTIuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTIuaHRtbFxuICAgICAgICAgICAgICBjaGlsZEZvbGRlcnM6IFtdXG4gICAgICAgIC0gZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyXG4gICAgICAgICAgY2hpbGRyZW46XG4gICAgICAgICAgICAgIHJvb3RJdGVtOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjJcbiAgICAgICAgICAgICAgaXRlbXM6XG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UxLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMS5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UyLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMi5odG1sXG4gICAgICAgICAgICAgIGNoaWxkRm9sZGVyczogW11cbiAgICAgKlxuICAgICAqIFRoZSBvYmplY3RzIHVuZGVyIGBpdGVtc2AgYXJlIGFjdHVsbHkgdGhlIGZ1bGwgRG9jdW1lbnQgb2JqZWN0XG4gICAgICogZnJvbSB0aGUgY2FjaGUsIGJ1dCBmb3IgdGhlIGludGVyZXN0IG9mIGNvbXBhY3RuZXNzIG1vc3Qgb2ZcbiAgICAgKiB0aGUgZmllbGRzIGhhdmUgYmVlbiBkZWxldGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9yb290SXRlbSBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBjaGlsZEl0ZW1UcmVlKF9yb290SXRlbTogc3RyaW5nKSB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNoaWxkSXRlbVRyZWUgJHtfcm9vdEl0ZW19YCk7XG5cbiAgICAgICAgLy8gbGV0IHJvb3RJdGVtID0gYXdhaXQgdGhpcy5maW5kKFxuICAgICAgICAvLyAgICAgICAgIF9yb290SXRlbS5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgLy8gICAgICAgICAgICAgPyBfcm9vdEl0ZW0uc3Vic3RyaW5nKDEpXG4gICAgICAgIC8vICAgICAgICAgICAgIDogX3Jvb3RJdGVtKTtcbiAgICAgICAgLy8gaWYgKCFyb290SXRlbSkge1xuICAgICAgICAvLyAgICAgLy8gY29uc29sZS53YXJuKGBjaGlsZEl0ZW1UcmVlIG5vIHJvb3RJdGVtIGZvdW5kIGZvciBwYXRoICR7X3Jvb3RJdGVtfWApO1xuICAgICAgICAvLyAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBpZiAoISh0eXBlb2Ygcm9vdEl0ZW0gPT09ICdvYmplY3QnKVxuICAgICAgICAvLyAgfHwgISgndnBhdGgnIGluIHJvb3RJdGVtKVxuICAgICAgICAvLyApIHtcbiAgICAgICAgLy8gICAgIC8vIGNvbnNvbGUud2FybihgY2hpbGRJdGVtVHJlZSBmb3VuZCBpbnZhbGlkIG9iamVjdCBmb3IgJHtfcm9vdEl0ZW19IC0gJHt1dGlsLmluc3BlY3Qocm9vdEl0ZW0pfWApO1xuICAgICAgICAvLyAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZShyb290SXRlbS52cGF0aCk7XG4gICAgICAgIC8vIC8vIFBpY2tzIHVwIGV2ZXJ5dGhpbmcgZnJvbSB0aGUgY3VycmVudCBsZXZlbC5cbiAgICAgICAgLy8gLy8gRGlmZmVycyBmcm9tIHNpYmxpbmdzIGJ5IGdldHRpbmcgZXZlcnl0aGluZy5cbiAgICAgICAgLy8gY29uc3QgaXRlbXMgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAvLyAgICAgZGlybmFtZTogeyBlcTogZGlybmFtZSB9LFxuICAgICAgICAvLyAgICAgcmVuZGVyc1RvSFRNTDogdHJ1ZVxuICAgICAgICAvLyB9KSBhcyB1bmtub3duW10gYXMgYW55W107XG5cbiAgICAgICAgLy8gY29uc3QgY2hpbGRGb2xkZXJzID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKFxuICAgICAgICAvLyAgICAgYFNFTEVDVCBkaXN0aW5jdCBkaXJuYW1lIEZST00gRE9DVU1FTlRTXG4gICAgICAgIC8vICAgICBXSEVSRSBwYXJlbnREaXIgPSAnJHtkaXJuYW1lfSdgXG4gICAgICAgIC8vICkgYXMgdW5rbm93bltdIGFzIERvY3VtZW50W107XG5cbiAgICAgICAgLy8gY29uc3QgY2ZzID0gW107XG4gICAgICAgIC8vIGZvciAoY29uc3QgY2Ygb2YgY2hpbGRGb2xkZXJzKSB7XG4gICAgICAgIC8vICAgICBjZnMucHVzaChhd2FpdCB0aGlzLmNoaWxkSXRlbVRyZWUoXG4gICAgICAgIC8vICAgICAgICAgcGF0aC5qb2luKGNmLmRpcm5hbWUsICdpbmRleC5odG1sJylcbiAgICAgICAgLy8gICAgICkpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gcmV0dXJuIHtcbiAgICAgICAgLy8gICAgIHJvb3RJdGVtLFxuICAgICAgICAvLyAgICAgZGlybmFtZSxcbiAgICAgICAgLy8gICAgIGl0ZW1zOiBpdGVtcyxcbiAgICAgICAgLy8gICAgIC8vIFVuY29tbWVudCB0aGlzIHRvIGdlbmVyYXRlIHNpbXBsaWZpZWQgb3V0cHV0XG4gICAgICAgIC8vICAgICAvLyBmb3IgZGVidWdnaW5nLlxuICAgICAgICAvLyAgICAgLy8gLm1hcChpdGVtID0+IHtcbiAgICAgICAgLy8gICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAvLyAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgLy8gICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoXG4gICAgICAgIC8vICAgICAvLyAgICAgfVxuICAgICAgICAvLyAgICAgLy8gfSksXG4gICAgICAgIC8vICAgICBjaGlsZEZvbGRlcnM6IGNmc1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgaW5kZXggZmlsZXMgKHJlbmRlcnMgdG8gaW5kZXguaHRtbClcbiAgICAgKiB3aXRoaW4gdGhlIG5hbWVkIHN1YnRyZWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm9vdFBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgaW5kZXhGaWxlcyhyb290UGF0aD86IHN0cmluZykge1xuICAgICAgICBsZXQgcm9vdFAgPSByb290UGF0aD8uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IHJvb3RQYXRoPy5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogcm9vdFBhdGg7XG5cbiAgICAgICAgLy8gT3B0aW9uYWxseSBhcHBlbmRhYmxlIHN1Yi1xdWVyeVxuICAgICAgICAvLyB0byBoYW5kbGUgd2hlbiByb290UGF0aCBpcyBzcGVjaWZpZWRcbiAgICAgICAgbGV0IHJvb3RRID0gKFxuICAgICAgICAgICAgICAgIHR5cGVvZiByb290UCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAmJiByb290UC5sZW5ndGggPj0gMVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgPyBgQU5EICggcmVuZGVyUGF0aCBMSUtFICcke3Jvb3RQfSUnIClgXG4gICAgICAgICAgICA6ICcnO1xuXG4gICAgICAgIC8vIHJldHVybiB0aGlzLmRhby5zcWxkYi5hbGwoYFxuICAgICAgICAvLyBTRUxFQ1QgKlxuICAgICAgICAvLyBGUk9NIERPQ1VNRU5UU1xuICAgICAgICAvLyBXSEVSRVxuICAgICAgICAvLyAgICAgKCByZW5kZXJzVG9IVE1MID0gdHJ1ZSApXG4gICAgICAgIC8vIEFORCAoXG4gICAgICAgIC8vICAgICAoIHJlbmRlclBhdGggTElLRSAnJS9pbmRleC5odG1sJyApXG4gICAgICAgIC8vICBPUiAoIHJlbmRlclBhdGggPSAnaW5kZXguaHRtbCcgKVxuICAgICAgICAvLyApXG4gICAgICAgIC8vICR7cm9vdFF9XG4gICAgICAgIC8vIGApO1xuICAgICAgICBcblxuICAgICAgICAvLyBJdCdzIHByb3ZlZCBkaWZmaWN1bHQgdG8gZ2V0IHRoZSByZWdleHBcbiAgICAgICAgLy8gdG8gd29yayBpbiB0aGlzIG1vZGU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHJldHVybiBhd2FpdCB0aGlzLnNlYXJjaCh7XG4gICAgICAgIC8vICAgICByZW5kZXJzVG9IVE1MOiB0cnVlLFxuICAgICAgICAvLyAgICAgcmVuZGVycGF0aG1hdGNoOiAvXFwvaW5kZXguaHRtbCQvLFxuICAgICAgICAvLyAgICAgcm9vdFBhdGg6IHJvb3RQYXRoXG4gICAgICAgIC8vIH0pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBGb3IgZXZlcnkgZmlsZSBpbiB0aGUgZG9jdW1lbnRzIGNhY2hlLFxuICAgICAqIHNldCB0aGUgYWNjZXNzIGFuZCBtb2RpZmljYXRpb25zLlxuICAgICAqXG4gICAgICogPz8/Pz8gV2h5IHdvdWxkIHRoaXMgYmUgdXNlZnVsP1xuICAgICAqIEkgY2FuIHNlZSBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWRcbiAgICAgKiBmaWxlcyBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeS4gIEJ1dCB0aGlzIGlzXG4gICAgICogZm9yIHRoZSBmaWxlcyBpbiB0aGUgZG9jdW1lbnRzIGRpcmVjdG9yaWVzLiA/Pz8/XG4gICAgICovXG4gICAgYXN5bmMgc2V0VGltZXMoKSB7XG4gICAgICAgIC8vIGF3YWl0IHRoaXMuZGFvLnNlbGVjdEVhY2goXG4gICAgICAgIC8vICAgICAoZXJyLCBtb2RlbCkgPT4ge1xuXG4gICAgICAgIC8vICAgICAgICAgY29uc3Qgc2V0dGVyID0gYXN5bmMgKGRhdGUpID0+IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gRGF0ZS5wYXJzZShkYXRlKTs7XG4gICAgICAgIC8vICAgICAgICAgICAgIGlmICghIGlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIGNvbnN0IGRwID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIEZTLnV0aW1lc1N5bmMoXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgbW9kZWwuZnNwYXRoLFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIGRwLFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIGRwXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICApO1xuICAgICAgICAvLyAgICAgICAgICAgICB9IFxuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgICBpZiAobW9kZWwuaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAvLyAgICAgICAgICAmJiBtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgIHNldHRlcihtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgIC8vICAgICAgICAgaWYgKG1vZGVsLmluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgLy8gICAgICAgICAgJiYgbW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgc2V0dGVyKG1vZGVsLmluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgIC8vICAgICB9LFxuICAgICAgICAvLyAgICAge30gYXMgV2hlcmU8RG9jdW1lbnQ+XG4gICAgICAgIC8vICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIGRvY3VtZW50cyB3aGljaCBoYXZlIHRhZ3MuXG4gICAgICogXG4gICAgICogVE9ETyAtIElzIHRoaXMgZnVuY3Rpb24gdXNlZCBhbnl3aGVyZT9cbiAgICAgKiAgIEl0IGlzIG5vdCByZWZlcmVuY2VkIGluIGFrYXNoYXJlbmRlciwgbm9yXG4gICAgICogICBpbiBhbnkgcGx1Z2luIHRoYXQgSSBjYW4gZmluZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIC8vIGFzeW5jIGRvY3VtZW50c1dpdGhUYWdzKCkge1xuICAgIC8vICAgICBjb25zdCBkb2NzID0gbmV3IEFycmF5PERvY3VtZW50PigpO1xuICAgIC8vICAgICBhd2FpdCB0aGlzLmRhby5zZWxlY3RFYWNoKFxuICAgIC8vICAgICAgICAgKGVyciwgZG9jKSA9PiB7XG4gICAgLy8gICAgICAgICAgICAgaWYgKGRvY1xuICAgIC8vICAgICAgICAgICAgICAmJiBkb2MuZG9jTWV0YWRhdGFcbiAgICAvLyAgICAgICAgICAgICAgJiYgZG9jLmRvY01ldGFkYXRhLnRhZ3NcbiAgICAvLyAgICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShcbiAgICAvLyAgICAgICAgICAgICAgICAgZG9jLmRvY01ldGFkYXRhLnRhZ3NcbiAgICAvLyAgICAgICAgICAgICAgKVxuICAgIC8vICAgICAgICAgICAgICAmJiBkb2MuZG9jTWV0YWRhdGEudGFncy5sZW5ndGggPj0gMVxuICAgIC8vICAgICAgICAgICAgICkge1xuICAgIC8vICAgICAgICAgICAgICAgICBkb2NzLnB1c2goZG9jKTtcbiAgICAvLyAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAge1xuICAgIC8vICAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHsgZXE6IHRydWUgfSxcbiAgICAvLyAgICAgICAgICAgICBpbmZvOiB7IGlzTm90TnVsbDogdHJ1ZSB9XG4gICAgLy8gICAgICAgICB9IGFzIFdoZXJlPERvY3VtZW50PlxuICAgIC8vICAgICApO1xuXG4gICAgLy8gICAgIC8vIGNvbnNvbGUubG9nKGRvY3MpO1xuICAgIC8vICAgICByZXR1cm4gZG9jcztcbiAgICAvLyB9XG5cbiAgICBhc3luYyBkb2N1bWVudHNXaXRoVGFnKHRhZ25tOiBzdHJpbmcgfCBzdHJpbmdbXSlcbiAgICAgICAgLy8gOiBQcm9taXNlPEFycmF5PHN0cmluZz4+XG4gICAge1xuICAgICAgICBsZXQgdGFnczogc3RyaW5nW107XG4gICAgICAgIGlmICh0eXBlb2YgdGFnbm0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0YWdzID0gWyB0YWdubSBdO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodGFnbm0pKSB7XG4gICAgICAgICAgICB0YWdzID0gdGFnbm07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50c1dpdGhUYWcgZ2l2ZW4gYmFkIHRhZ3MgYXJyYXkgJHt1dGlsLmluc3BlY3QodGFnbm0pfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29ycmVjdGx5IGhhbmRsZSB0YWcgc3RyaW5ncyB3aXRoXG4gICAgICAgIC8vIHZhcnlpbmcgcXVvdGVzLiAgQSBkb2N1bWVudCBtaWdodCBoYXZlIHRoZXNlIHRhZ3M6XG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgIHRhZ3M6XG4gICAgICAgIC8vICAgIC0gVGVhc2VyJ3NcbiAgICAgICAgLy8gICAgLSBUZWFzZXJzXG4gICAgICAgIC8vICAgIC0gU29tZXRoaW5nIFwicXVvdGVkXCJcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlc2UgU1FMIHF1ZXJpZXMgd29yazpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gc3FsaXRlPiBzZWxlY3QgKiBmcm9tIFRBR0dMVUUgd2hlcmUgdGFnTmFtZSBJTiAoICdTb21ldGhpbmcgXCJxdW90ZWRcIicsIFwiVGVhc2VyJ3NcIiApO1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFRlYXNlcidzXG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8U29tZXRoaW5nIFwicXVvdGVkXCJcbiAgICAgICAgLy8gc3FsaXRlPiBzZWxlY3QgKiBmcm9tIFRBR0dMVUUgd2hlcmUgdGFnTmFtZSBJTiAoICdTb21ldGhpbmcgXCJxdW90ZWRcIicsICdUZWFzZXInJ3MnICk7XG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8VGVhc2VyJ3NcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxTb21ldGhpbmcgXCJxdW90ZWRcIlxuICAgICAgICAvL1xuICAgICAgICAvLyBCdXQsIHRoaXMgZG9lcyBub3Q6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgPSAnVGVhc2VyJ3MnO1xuICAgICAgICAvLyAnICAuLi4+IFxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgb3JpZ2luYWwgY29kZSBiZWhhdmlvciB3YXMgdGhpczpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwic1wiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW4gYXR0ZW1wdGVkIGZpeDpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyBcIlRlYXNlcidzXCIgXSAgKCAnVGVhc2VyXFwncycgKSBcbiAgICAgICAgLy8gZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEIEVycm9yOiBTUUxJVEVfRVJST1I6IG5lYXIgXCJzXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBBbm90aGVyIGF0dGVtcHRlZCBmaXg6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgXCJUZWFzZXInc1wiIF0gICggXCJUZWFzZXInJ3NcIiApIFxuICAgICAgICAvLyBbXVxuICAgICAgICAvLyBbXVxuICAgICAgICAvL1xuICAgICAgICAvLyBBbmQ6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzICdTb21ldGhpbmcgXCJxdW90ZWRcIidcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbICdTb21ldGhpbmcgXCJxdW90ZWRcIicgXSAgKCBcIlNvbWV0aGluZyBcInF1b3RlZFwiXCIgKSBcbiAgICAgICAgLy8gZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEIEVycm9yOiBTUUxJVEVfRVJST1I6IG5lYXIgXCJxdW90ZWRcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBjb2RlIGJlbG93IHByb2R1Y2VzOlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCIgJ1NvbWV0aGluZyBcInF1b3RlZFwiJ1xuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgXCJUZWFzZXInc1wiLCAnU29tZXRoaW5nIFwicXVvdGVkXCInIF0gICggJ1RlYXNlcicncycsJ1NvbWV0aGluZyBcInF1b3RlZFwiJyApIFxuICAgICAgICAvLyBbIHsgdnBhdGg6ICd0ZWFzZXItY29udGVudC5odG1sLm1kJyB9IF1cbiAgICAgICAgLy8gWyAndGVhc2VyLWNvbnRlbnQuaHRtbC5tZCcgXVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBkb2N1bWVudHNXaXRoVGFnICR7dXRpbC5pbnNwZWN0KHRhZ3MpfSAke3RhZ3N0cmluZ31gKTtcblxuICAgICAgICAvLyBjb25zdCB2cGF0aHMgPSBhd2FpdCB0Z2x1ZS5wYXRoc0ZvclRhZyh0YWdzKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHZwYXRocyk7XG5cbiAgICAgICAgLy8gaWYgKCFBcnJheS5pc0FycmF5KHZwYXRocykpIHtcbiAgICAgICAgLy8gICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnRzV2l0aFRhZyBub24tQXJyYXkgcmVzdWx0ICR7dXRpbC5pbnNwZWN0KHZwYXRocyl9YCk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyByZXR1cm4gdnBhdGhzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhbiBhcnJheSBvZiB0YWdzIHVzZWQgYnkgYWxsIGRvY3VtZW50cy5cbiAgICAgKiBUaGlzIHVzZXMgdGhlIEpTT04gZXh0ZW5zaW9uIHRvIGV4dHJhY3RcbiAgICAgKiB0aGUgdGFncyBmcm9tIHRoZSBtZXRhZGF0YSBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyB0YWdzKCkge1xuICAgICAgICAvLyBjb25zdCB0YWdzID0gYXdhaXQgdGdsdWUudGFncygpO1xuICAgICAgICBcbiAgICAgICAgLy8gY29uc3QgcmV0ID0gQXJyYXkuZnJvbSh0YWdzKTtcbiAgICAgICAgLy8gcmV0dXJuIHJldC5zb3J0KChhOiBzdHJpbmcsIGI6IHN0cmluZykgPT4ge1xuICAgICAgICAvLyAgICAgdmFyIHRhZ0EgPSBhLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIC8vICAgICB2YXIgdGFnQiA9IGIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgLy8gICAgIGlmICh0YWdBIDwgdGFnQikgcmV0dXJuIC0xO1xuICAgICAgICAvLyAgICAgaWYgKHRhZ0EgPiB0YWdCKSByZXR1cm4gMTtcbiAgICAgICAgLy8gICAgIHJldHVybiAwO1xuICAgICAgICAvLyB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgZGF0YSBmb3IgYW4gaW50ZXJuYWwgbGlua1xuICAgICAqIHdpdGhpbiB0aGUgc2l0ZSBkb2N1bWVudHMuICBGb3JtaW5nIGFuXG4gICAgICogaW50ZXJuYWwgbGluayBpcyBhdCBhIG1pbmltdW0gdGhlIHJlbmRlcmVkXG4gICAgICogcGF0aCBmb3IgdGhlIGRvY3VtZW50IGFuZCBpdHMgdGl0bGUuXG4gICAgICogVGhlIHRlYXNlciwgaWYgYXZhaWxhYmxlLCBjYW4gYmUgdXNlZCBpblxuICAgICAqIGEgdG9vbHRpcC4gVGhlIHRodW1ibmFpbCBpcyBhbiBpbWFnZSB0aGF0XG4gICAgICogY291bGQgYmUgZGlzcGxheWVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGRvY0xpbmtEYXRhKHZwYXRoOiBzdHJpbmcpIC8qOiBQcm9taXNlPHtcblxuICAgICAgICAvLyBUaGUgdnBhdGggcmVmZXJlbmNlXG4gICAgICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBwYXRoIGl0IHJlbmRlcnMgdG9cbiAgICAgICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGl0bGUgc3RyaW5nIGZyb20gdGhhdCBwYWdlXG4gICAgICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSB0ZWFzZXIgdGV4dCBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0ZWFzZXI/OiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBoZXJvIGltYWdlICh0aHVtYm5haWwpXG4gICAgICAgIHRodW1ibmFpbD86IHN0cmluZztcbiAgICB9PiAqLyB7XG5cbiAgICAgICAgLy8gY29uc3QgZm91bmQgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5hbGwoYFxuICAgICAgICAvLyAgICAgU0VMRUNUICpcbiAgICAgICAgLy8gICAgIEZST00gJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfVxuICAgICAgICAvLyAgICAgV0hFUkUgXG4gICAgICAgIC8vICAgICB2cGF0aCA9ICR2cGF0aCBPUiByZW5kZXJQYXRoID0gJHZwYXRoXG4gICAgICAgIC8vIGAsIHtcbiAgICAgICAgLy8gICAgICR2cGF0aDogdnBhdGhcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gaWYgKEFycmF5LmlzQXJyYXkoZm91bmQpKSB7XG5cbiAgICAgICAgLy8gICAgIC8vIGNvbnN0IGRvY0luZm8gPSBhd2FpdCB0aGlzLmZpbmQodnBhdGgpO1xuICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gICAgICAgICB2cGF0aCxcbiAgICAgICAgLy8gICAgICAgICByZW5kZXJQYXRoOiBmb3VuZFswXS5yZW5kZXJQYXRoLFxuICAgICAgICAvLyAgICAgICAgIHRpdGxlOiBmb3VuZFswXS5tZXRhZGF0YS50aXRsZSxcbiAgICAgICAgLy8gICAgICAgICB0ZWFzZXI6IGZvdW5kWzBdLm1ldGFkYXRhLnRlYXNlcixcbiAgICAgICAgLy8gICAgICAgICAvLyB0aHVtYm5haWxcbiAgICAgICAgLy8gICAgIH07XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAvLyAgICAgICAgIHZwYXRoLFxuICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IHVuZGVmaW5lZCxcbiAgICAgICAgLy8gICAgICAgICB0aXRsZTogdW5kZWZpbmVkXG4gICAgICAgIC8vICAgICB9O1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBhIHNpbXBsZSBjYWNoZSB0byBob2xkIHJlc3VsdHNcbiAgICAvLyBvZiBzZWFyY2ggb3BlcmF0aW9ucy4gIFRoZSBrZXkgc2lkZSBvZiB0aGlzXG4gICAgLy8gTWFwIGlzIG1lYW50IHRvIGJlIHRoZSBzdHJpbmdpZmllZCBzZWxlY3Rvci5cbiAgICBwcml2YXRlIHNlYXJjaENhY2hlID0gbmV3IE1hcDxcbiAgICAgICAgICAgIHN0cmluZywgeyByZXN1bHRzOiBEb2N1bWVudFtdLCB0aW1lc3RhbXA6IG51bWJlciB9XG4gICAgPigpO1xuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybSBkZXNjcmlwdGl2ZSBzZWFyY2ggb3BlcmF0aW9ucyB1c2luZyBkaXJlY3QgU1FMIHF1ZXJpZXNcbiAgICAgKiBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlIGFuZCBzY2FsYWJpbGl0eS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIFNlYXJjaCBvcHRpb25zIG9iamVjdFxuICAgICAqIEByZXR1cm5zIFByb21pc2U8QXJyYXk8RG9jdW1lbnQ+PlxuICAgICAqL1xuICAgIGFzeW5jIHNlYXJjaChvcHRpb25zKTogUHJvbWlzZTxBcnJheTxEb2N1bWVudD4+IHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICAvLyBGaXJzdCwgc2VlIGlmIHRoZSBzZWFyY2ggcmVzdWx0cyBhcmUgYWxyZWFkeVxuICAgICAgICAvLyBjb21wdXRlZCBhbmQgaW4gdGhlIGNhY2hlLlxuXG4gICAgICAgIC8vIFRoZSBpc3N1ZSBoZXJlIGlzIHRoYXQgdGhlIG9wdGlvbnNcbiAgICAgICAgLy8gb2JqZWN0IGNhbiBjb250YWluIFJlZ0V4cCB2YWx1ZXMuXG4gICAgICAgIC8vIFRoZSBSZWdFeHAgb2JqZWN0IGRvZXMgbm90IGhhdmVcbiAgICAgICAgLy8gYSB0b0pTT04gZnVuY3Rpb24uICBUaGlzIGhvb2tcbiAgICAgICAgLy8gY2F1c2VzIFJlZ0V4cCB0byByZXR1cm4gdGhlXG4gICAgICAgIC8vIC50b1N0cmluZygpIHZhbHVlIGluc3RlYWQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFNvdXJjZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjAyNzY1MzEvc3RyaW5naWZ5aW5nLWEtcmVndWxhci1leHByZXNzaW9uXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEEgc2ltaWxhciBpc3N1ZSBleGlzdHMgd2l0aCBGdW5jdGlvbnNcbiAgICAgICAgLy8gaW4gdGhlIG9iamVjdC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gU291cmNlOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy82NzU0OTE5L2pzb24tc3RyaW5naWZ5LWZ1bmN0aW9uXG4gICAgICAgIGNvbnN0IGNhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUgKyAnJzsgLy8gaW1wbGljaXRseSBgdG9TdHJpbmdgIGl0XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy5zZWFyY2hDYWNoZS5nZXQoY2FjaGVLZXkpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggJHt1dGlsLmluc3BlY3Qob3B0aW9ucyl9ID09PiAke2NhY2hlS2V5fSAke2NhY2hlZCA/ICdoYXNDYWNoZWQnIDogJ25vQ2FjaGVkJ31gKTtcblxuICAgICAgICAvLyBJZiB0aGUgY2FjaGUgaGFzIGFuIGVudHJ5LCBza2lwIGNvbXB1dGluZ1xuICAgICAgICAvLyBhbnl0aGluZy5cbiAgICAgICAgaWYgKGNhY2hlZFxuICAgICAgICAgJiYgRGF0ZS5ub3coKSAtIGNhY2hlZC50aW1lc3RhbXAgPCA2MDAwMFxuICAgICAgICApIHsgLy8gMSBtaW51dGUgY2FjaGVcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0cztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5PVEU6IEVudHJpZXMgYXJlIGFkZGVkIHRvIHRoZSBjYWNoZSBhdCB0aGUgYm90dG9tXG4gICAgICAgIC8vIG9mIHRoaXMgZnVuY3Rpb25cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBzcWwsIHBhcmFtcyB9ID0gdGhpcy5idWlsZFNlYXJjaFF1ZXJ5KG9wdGlvbnMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHNlYXJjaCAke3NxbH1gKTtcbiAgICAgICAgICAgIC8vIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5hbGwoc3FsLCBwYXJhbXMpO1xuXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHJhdyBTUUwgcmVzdWx0cyB0byBEb2N1bWVudCBvYmplY3RzXG4gICAgICAgICAgICAvLyBjb25zdCBkb2N1bWVudHMgPSByZXN1bHRzLm1hcChyb3cgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiB0aGlzLmN2dFJvd1RvT2JqKHJvdyk7XG4gICAgICAgICAgICAvLyB9KTtcblxuICAgICAgICAgICAgLy8gR2F0aGVyIGFkZGl0aW9uYWwgaW5mbyBkYXRhIGZvciBlYWNoIHJlc3VsdCBGSVJTVFxuICAgICAgICAgICAgLy8gVGhpcyBpcyBjcnVjaWFsIGJlY2F1c2UgZmlsdGVycyBhbmQgc29ydCBmdW5jdGlvbnMgbWF5IGRlcGVuZCBvbiB0aGlzIGRhdGFcbiAgICAgICAgICAgIC8vIGZvciAoY29uc3QgaXRlbSBvZiBkb2N1bWVudHMpIHtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGl0ZW0pO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAvLyBBcHBseSBwb3N0LVNRTCBmaWx0ZXJzIHRoYXQgY2FuJ3QgYmUgZG9uZSBpbiBTUUxcbiAgICAgICAgICAgIGxldCBmaWx0ZXJlZFJlc3VsdHMgPSBbXTsgLy8gZG9jdW1lbnRzO1xuXG4gICAgICAgICAgICAvLyBGaWx0ZXIgYnkgcmVuZGVyZXJzIChyZXF1aXJlcyBjb25maWcgbG9va3VwKVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVuZGVyZXJzXG4gICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zLnJlbmRlcmVycylcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkUmVzdWx0cyA9IGZpbHRlcmVkUmVzdWx0cy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGxldCByZW5kZXJlciA9IGZjYWNoZS5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpdGVtLnZwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKCFyZW5kZXJlcikgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZvciAoY29uc3QgciBvZiBvcHRpb25zLnJlbmRlcmVycykge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHR5cGVvZiByID09PSAnc3RyaW5nJyAmJiByID09PSByZW5kZXJlci5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfSBlbHNlIGlmICh0eXBlb2YgciA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBjb25zb2xlLmVycm9yKCdXQVJOSU5HOiBNYXRjaGluZyByZW5kZXJlciBieSBvYmplY3QgY2xhc3MgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCcsIHIpO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXBwbHkgY3VzdG9tIGZpbHRlciBmdW5jdGlvblxuICAgICAgICAgICAgLy8gaWYgKG9wdGlvbnMuZmlsdGVyZnVuYykge1xuICAgICAgICAgICAgLy8gICAgIGZpbHRlcmVkUmVzdWx0cyA9IGZpbHRlcmVkUmVzdWx0cy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHJldHVybiBvcHRpb25zLmZpbHRlcmZ1bmMoZmNhY2hlLmNvbmZpZywgb3B0aW9ucywgaXRlbSk7XG4gICAgICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8vIEFwcGx5IGN1c3RvbSBzb3J0IGZ1bmN0aW9uIChpZiBTUUwgc29ydGluZyB3YXNuJ3QgdXNlZClcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zb3J0RnVuYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkUmVzdWx0cyA9IGZpbHRlcmVkUmVzdWx0cy5zb3J0KG9wdGlvbnMuc29ydEZ1bmMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBZGQgdGhlIHJlc3VsdHMgdG8gdGhlIGNhY2hlXG4gICAgICAgICAgICBpZiAodHJ1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoQ2FjaGUuc2V0KGNhY2hlS2V5LCB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHM6IGZpbHRlcmVkUmVzdWx0cywgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyZWRSZXN1bHRzO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5zZWFyY2ggZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCBTUUwgcXVlcnkgYW5kIHBhcmFtZXRlcnMgZm9yIHNlYXJjaCBvcHRpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZFNlYXJjaFF1ZXJ5KG9wdGlvbnMpOiB7XG4gICAgICAgIHNxbDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IGFueVxuICAgIH0ge1xuICAgICAgICBjb25zdCBwYXJhbXM6IGFueSA9IHt9O1xuICAgICAgICBjb25zdCB3aGVyZUNsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGpvaW5zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBsZXQgcGFyYW1Db3VudGVyID0gMDtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgYnVpbGRTZWFyY2hRdWVyeSAke3V0aWwuaW5zcGVjdChvcHRpb25zKX1gKTtcblxuICAgICAgICAvLyBIZWxwZXIgdG8gY3JlYXRlIHVuaXF1ZSBwYXJhbWV0ZXIgbmFtZXNcbiAgICAgICAgY29uc3QgYWRkUGFyYW0gPSAodmFsdWU6IGFueSk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgJHBhcmFtJHsrK3BhcmFtQ291bnRlcn1gO1xuICAgICAgICAgICAgcGFyYW1zW3BhcmFtTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbU5hbWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQmFzZSBxdWVyeVxuICAgICAgICBsZXQgc3FsID0gYFNFTEVDVCBESVNUSU5DVCBkLiogRlJPTSAkIHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfSBkYDtcblxuICAgICAgICAvLyBNSU1FIHR5cGUgZmlsdGVyaW5nXG4gICAgICAgIGlmIChvcHRpb25zLm1pbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLm1pbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMubWltZSl9YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5taW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubWltZS5tYXAobWltZSA9PiBhZGRQYXJhbShtaW1lKSkuam9pbignLCAnKTtcbiAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5taW1lIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW5kZXJzIHRvIEhUTUwgZmlsdGVyaW5nXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJzVG9IVE1MID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnJlbmRlcnNUb0hUTUwgPSAke2FkZFBhcmFtKG9wdGlvbnMucmVuZGVyc1RvSFRNTCA/IDEgOiAwKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJvb3QgcGF0aCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJvb3RQYXRoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBMSUtFICR7YWRkUGFyYW0ob3B0aW9ucy5yb290UGF0aCArICclJyl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5nbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMuZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5nbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQudnBhdGggR0xPQiAke2FkZFBhcmFtKGVzY2FwZWRHbG9iKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciBnbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMucmVuZGVyZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5yZW5kZXJnbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLnJlbmRlcmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMucmVuZGVyZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5yZW5kZXJnbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBHTE9CICR7YWRkUGFyYW0oZXNjYXBlZEdsb2IpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmxvZyB0YWcgZmlsdGVyaW5nXG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBibG9ndGFncyBhcnJheSBpcyB1c2VkLFxuICAgICAgICAvLyBpZiBwcmVzZW50LCB3aXRoIHRoZSBibG9ndGFnIHZhbHVlIHVzZWRcbiAgICAgICAgLy8gb3RoZXJ3aXNlLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgcHVycG9zZSBmb3IgdGhlIGJsb2d0YWdzIHZhbHVlIGlzIHRvXG4gICAgICAgIC8vIHN1cHBvcnQgYSBwc2V1ZG8tYmxvZyBtYWRlIG9mIHRoZSBpdGVtc1xuICAgICAgICAvLyBmcm9tIG11bHRpcGxlIGFjdHVhbCBibG9ncy5cbiAgICAgICAgLy8gaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAvLyAgfHwgdHlwZW9mIG9wdGlvbnMuYmxvZ3RhZyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhgIGJsb2d0YWdzICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZ3MpfSBibG9ndGFnICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZyl9YCk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5ibG9ndGFncykpIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMuYmxvZ3RhZ3MubWFwKHRhZyA9PiBhZGRQYXJhbSh0YWcpKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5ibG9ndGFnID0gJHthZGRQYXJhbShvcHRpb25zLmJsb2d0YWcpfWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGQuYmxvZ3RhZyA9ICR7b3B0aW9ucy5ibG9ndGFnfWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBibG9ndGFncyBhcnJheSAke3V0aWwuaW5zcGVjdChvcHRpb25zLmJsb2d0YWdzKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRhZyBmaWx0ZXJpbmcgdXNpbmcgVEFHR0xVRSB0YWJsZVxuICAgICAgICBpZiAob3B0aW9ucy50YWcgJiYgdHlwZW9mIG9wdGlvbnMudGFnID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgam9pbnMucHVzaChgSU5ORVIgSk9JTiBUQUdHTFVFIHRnIE9OIGQudnBhdGggPSB0Zy5kb2N2cGF0aGApO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYHRnLnRhZ05hbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMudGFnKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExheW91dCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMubGF5b3V0cykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5sYXlvdXRzKSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxheW91dHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5sYXlvdXRzWzBdKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubGF5b3V0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubGF5b3V0cy5tYXAobGF5b3V0ID0+IGFkZFBhcmFtKGxheW91dCkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubGF5b3V0ID0gJHthZGRQYXJhbShvcHRpb25zLmxheW91dHMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGF0aCByZWdleCBtYXRjaGluZ1xuICAgICAgICBjb25zdCByZWdleENsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5wYXRobWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucGF0aG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5wYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciBwYXRoIHJlZ2V4IG1hdGNoaW5nXG4gICAgICAgIC8vIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3Qob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gsIGZhbHNlLCAzKSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIHN0cmluZyAke29wdGlvbnMucmVuZGVycGF0aG1hdGNofWApO1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIHJlZ2V4cCAke29wdGlvbnMucmVuZGVycGF0aG1hdGNoLnNvdXJjZX1gKTtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIGFycmF5IHN0cmluZyAke21hdGNofWApO1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLnJlbmRlclBhdGggcmVnZXhwIGFycmF5IHJlZ2V4cCAke21hdGNoLnNvdXJjZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdyZW5kZXJwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZWdleENsYXVzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYCgke3JlZ2V4Q2xhdXNlcy5qb2luKCcgT1IgJyl9KWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIEpPSU5zIHRvIHF1ZXJ5XG4gICAgICAgIGlmIChqb2lucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzcWwgKz0gJyAnICsgam9pbnMuam9pbignICcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIFdIRVJFIGNsYXVzZVxuICAgICAgICBpZiAod2hlcmVDbGF1c2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNxbCArPSAnIFdIRVJFICcgKyB3aGVyZUNsYXVzZXMuam9pbignIEFORCAnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBPUkRFUiBCWSBjbGF1c2VcbiAgICAgICAgbGV0IG9yZGVyQnkgPSAnJztcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRCeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIEhhbmRsZSBzcGVjaWFsIGNhc2VzIHRoYXQgbmVlZCBKU09OIGV4dHJhY3Rpb24gb3IgY29tcGxleCBsb2dpY1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25EYXRlJyB8fCBvcHRpb25zLnNvcnRCeSA9PT0gJ3B1YmxpY2F0aW9uVGltZScpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgQ09BTEVTQ0UgdG8gaGFuZGxlIG51bGwgcHVibGljYXRpb24gZGF0ZXNcbiAgICAgICAgICAgICAgICBvcmRlckJ5ID0gYE9SREVSIEJZIENPQUxFU0NFKFxuICAgICAgICAgICAgICAgICAgICBqc29uX2V4dHJhY3QoZC5tZXRhZGF0YSwgJyQucHVibGljYXRpb25EYXRlJyksIFxuICAgICAgICAgICAgICAgICAgICBkLm10aW1lTXNcbiAgICAgICAgICAgICAgICApYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCBvdGhlciBmaWVsZHMsIHNvcnQgYnkgdGhlIGNvbHVtbiBkaXJlY3RseVxuICAgICAgICAgICAgICAgIC8vIFRoaXMgYWxsb3dzIHNvcnRpbmcgYnkgYW55IHZhbGlkIGNvbHVtbiBpbiB0aGUgRE9DVU1FTlRTIHRhYmxlXG4gICAgICAgICAgICAgICAgb3JkZXJCeSA9IGBPUkRFUiBCWSBkLiR7b3B0aW9ucy5zb3J0Qnl9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnJldmVyc2UgfHwgb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nKSB7XG4gICAgICAgICAgICAvLyBJZiByZXZlcnNlL3NvcnRCeURlc2NlbmRpbmcgaXMgc3BlY2lmaWVkIHdpdGhvdXQgc29ydEJ5LCBcbiAgICAgICAgICAgIC8vIHVzZSBhIGRlZmF1bHQgb3JkZXJpbmcgKGJ5IG1vZGlmaWNhdGlvbiB0aW1lKVxuICAgICAgICAgICAgb3JkZXJCeSA9ICdPUkRFUiBCWSBkLm10aW1lTXMnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIHNvcnQgZGlyZWN0aW9uXG4gICAgICAgIGlmIChvcmRlckJ5KSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nIHx8IG9wdGlvbnMucmV2ZXJzZSkge1xuICAgICAgICAgICAgICAgIG9yZGVyQnkgKz0gJyBERVNDJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3JkZXJCeSArPSAnIEFTQyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcWwgKz0gJyAnICsgb3JkZXJCeTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBMSU1JVCBhbmQgT0ZGU0VUXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5saW1pdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHNxbCArPSBgIExJTUlUICR7YWRkUGFyYW0ob3B0aW9ucy5saW1pdCl9YDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub2Zmc2V0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3FsICs9IGAgT0ZGU0VUICR7YWRkUGFyYW0ob3B0aW9ucy5vZmZzZXQpfWA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyBzcWwsIHBhcmFtcyB9O1xuICAgIH1cblxuICAgIC8vIFNraXAgdGFncyBmb3Igbm93LiAgU2hvdWxkIGJlIGVhc3kuXG5cbiAgICAvLyBGb3IgdGFncyBzdXBwb3J0LCB0aGlzIGNhbiBiZSB1c2VmdWxcbiAgICAvLyAgLS0gaHR0cHM6Ly9hbnRvbnoub3JnL2pzb24tdmlydHVhbC1jb2x1bW5zL1xuICAgIC8vIEl0IHNob3dzIGhvdyB0byBkbyBnZW5lcmF0ZWQgY29sdW1uc1xuICAgIC8vIGZyb20gZmllbGRzIGluIEpTT05cblxuICAgIC8vIEJ1dCwgaG93IHRvIGRvIGdlbmVyYXRlZCBjb2x1bW5zXG4gICAgLy8gdXNpbmcgU1FMSVRFM09STT9cblxuICAgIC8vIGh0dHBzOi8vYW50b256Lm9yZy9zcWxlYW4tcmVnZXhwLyAtLSBSZWdFeHBcbiAgICAvLyBleHRlbnNpb24gZm9yIFNRTElURTNcblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hc2cwMTcvc3FsaXRlLXJlZ2V4IGluY2x1ZGVzXG4gICAgLy8gYSBub2RlLmpzIHBhY2thZ2VcbiAgICAvLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9zcWxpdGUtcmVnZXhcbn1cblxuLy8gZXhwb3J0IHZhciBhc3NldHNDYWNoZTogQXNzZXRzRmlsZUNhY2hlPCBBc3NldCwgdHlwZW9mIGFzc2V0c0RBTz47XG4vLyBleHBvcnQgdmFyIHBhcnRpYWxzQ2FjaGU6IFRlbXBsYXRlc0ZpbGVDYWNoZTxQYXJ0aWFsLCB0eXBlb2YgcGFydGlhbHNEQU8+O1xuLy8gZXhwb3J0IHZhciBsYXlvdXRzQ2FjaGU6IFRlbXBsYXRlc0ZpbGVDYWNoZTxMYXlvdXQsIHR5cGVvZiBsYXlvdXRzREFPPjtcbi8vIGV4cG9ydCB2YXIgZG9jdW1lbnRzQ2FjaGU6IERvY3VtZW50c0ZpbGVDYWNoZTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKFxuICAgIC8vIGNvbmZpZzogQ29uZmlndXJhdGlvblxuKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAvLyBhc3NldHNDYWNoZSA9IG5ldyBBc3NldHNGaWxlQ2FjaGU8QXNzZXQsIFRhc3NldHNEQU8+KFxuICAgIC8vICAgICBjb25maWcsXG4gICAgLy8gICAgICdhc3NldHMnLFxuICAgIC8vICAgICBjb25maWcuYXNzZXREaXJzLFxuICAgIC8vICAgICBhc3NldHNEQU9cbiAgICAvLyApO1xuICAgIC8vIGF3YWl0IGFzc2V0c0NhY2hlLnNldHVwKCk7XG5cbiAgICAvLyBhc3NldHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgIC8vICAgICBjb25zb2xlLmVycm9yKGBhc3NldHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChhcmdzKX1gKVxuICAgIC8vIH0pO1xuXG4gICAgLy8gcGFydGlhbHNDYWNoZSA9IG5ldyBUZW1wbGF0ZXNGaWxlQ2FjaGU8XG4gICAgLy8gICAgICAgICBQYXJ0aWFsLCBUcGFydGlhbHNEQU9cbiAgICAvLyA+KFxuICAgIC8vICAgICBjb25maWcsXG4gICAgLy8gICAgICdwYXJ0aWFscycsXG4gICAgLy8gICAgIGNvbmZpZy5wYXJ0aWFsc0RpcnMsXG4gICAgLy8gICAgIHBhcnRpYWxzREFPLFxuICAgIC8vICAgICBcInBhcnRpYWxcIlxuICAgIC8vICk7XG4gICAgLy8gYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgLy8gcGFydGlhbHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgIC8vICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsc0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgLy8gfSk7XG5cbiAgICAvLyBsYXlvdXRzQ2FjaGUgPSBuZXcgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgIC8vICAgICAgICAgTGF5b3V0LCBUbGF5b3V0c0RBT1xuICAgIC8vID4oXG4gICAgLy8gICAgIGNvbmZpZyxcbiAgICAvLyAgICAgJ2xheW91dHMnLFxuICAgIC8vICAgICBjb25maWcubGF5b3V0RGlycyxcbiAgICAvLyAgICAgbGF5b3V0c0RBTyxcbiAgICAvLyAgICAgXCJsYXlvdXRcIlxuICAgIC8vICk7XG4gICAgLy8gYXdhaXQgbGF5b3V0c0NhY2hlLnNldHVwKCk7XG5cbiAgICAvLyBsYXlvdXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAvLyAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgLy8gfSk7XG5cbiAgICAvLyAvLyBjb25zb2xlLmxvZyhgRG9jdW1lbnRzRmlsZUNhY2hlICdkb2N1bWVudHMnICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5kb2N1bWVudERpcnMpfWApO1xuXG4gICAgLy8gZG9jdW1lbnRzQ2FjaGUgPSBuZXcgRG9jdW1lbnRzRmlsZUNhY2hlKFxuICAgIC8vICAgICBjb25maWcsXG4gICAgLy8gICAgICdkb2N1bWVudHMnLFxuICAgIC8vICAgICBjb25maWcuZG9jdW1lbnREaXJzXG4gICAgLy8gKTtcbiAgICAvLyBhd2FpdCBkb2N1bWVudHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgLy8gZG9jdW1lbnRzQ2FjaGUub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgIC8vICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChlcnIpfWApO1xuICAgIC8vIH0pO1xuXG4gICAgLy8gYXdhaXQgY29uZmlnLmhvb2tQbHVnaW5DYWNoZVNldHVwKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZUZpbGVDYWNoZXMoKSB7XG4gICAgLy8gaWYgKGRvY3VtZW50c0NhY2hlKSB7XG4gICAgLy8gICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLmNsb3NlKCk7XG4gICAgLy8gICAgIGRvY3VtZW50c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIC8vIH1cbiAgICAvLyBpZiAoYXNzZXRzQ2FjaGUpIHtcbiAgICAvLyAgICAgYXdhaXQgYXNzZXRzQ2FjaGUuY2xvc2UoKTtcbiAgICAvLyAgICAgYXNzZXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgLy8gfVxuICAgIC8vIGlmIChsYXlvdXRzQ2FjaGUpIHtcbiAgICAvLyAgICAgYXdhaXQgbGF5b3V0c0NhY2hlLmNsb3NlKCk7XG4gICAgLy8gICAgIGxheW91dHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICAvLyB9XG4gICAgLy8gaWYgKHBhcnRpYWxzQ2FjaGUpIHtcbiAgICAvLyAgICAgYXdhaXQgcGFydGlhbHNDYWNoZS5jbG9zZSgpO1xuICAgIC8vICAgICBwYXJ0aWFsc0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIC8vIH1cbn1cbiJdfQ==