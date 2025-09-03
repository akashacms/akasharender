
import FS from 'node:fs';
import {
    DirsWatcher, dirToWatch, VPathData
} from '@akashacms/stacked-dirs';
import {
    Configuration, dirToMount
} from '../index.js';
import path from 'node:path';
import util from 'node:util';
import EventEmitter from 'events';
import micromatch from 'micromatch';
import fastq from 'fastq';
import {
    TagGlue, TagDescriptions
} from './tag-glue-new.js';
import {
    createAssetsTable,
    createDocumentsTable,
    createLayoutsTable,
    createPartialsTable,
    PathsReturnType, validateAsset, validateDocument, validateLayout, validatePartial, validatePathsReturnType
} from './schema.js';

import { Database } from 'sqlite3';
import { AsyncDatabase } from 'promised-sqlite3';
import { quoteIdentifier } from './identifiers.js';
import {
    BaseCacheEntry,
    Asset,
    Partial,
    Layout,
    Document
} from './schema.js';
import { func } from 'joi';

const tglue = new TagGlue();
// tglue.init(sqdb._db);

const tdesc = new TagDescriptions();
// tdesc.init(sqdb._db);

// Convert AkashaCMS mount points into the mountpoint
// used by DirsWatcher
const remapdirs = (dirz: dirToMount[]): dirToWatch[] => {
    return dirz.map(dir => {
        // console.log('document dir ', dir);
        if (typeof dir === 'string') {
            return {
                mounted: dir,
                mountPoint: '/',
                baseMetadata: {}
            };
        } else {
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

export class BaseCache<
    T extends BaseCacheEntry
> extends EventEmitter {

    #config?: Configuration;
    #name?: string;
    #dirs?: dirToMount[];
    #is_ready: boolean = false;

    #db: AsyncDatabase;
    #dbname: string;


    /**
     * @param config AkashaRender Configuration object
     * @param dirs array of directories and mount points to watch
     * @param name string giving the name for this watcher name
     * @param db The PROMISED SQLITE3 AsyncDatabase instance to use
     * @param dbname The database name to use
     */
    constructor(
        config: Configuration,
        name: string,
        dirs: dirToMount[],
        db: AsyncDatabase,
        dbname: string
    ) {
        super();
        // console.log(`BaseFileCache ${name} constructor dirs=${util.inspect(dirs)}`);
        this.#config = config;
        this.#name = name;
        this.#dirs = dirs;
        this.#is_ready = false;
        this.#db = db;
        this.#dbname = dbname;
    }

    get config()     { return this.#config; }
    get name()       { return this.#name; }
    get dirs()       { return this.#dirs; }
    get db()         { return this.#db; }
    get dbname()     { return this.#dbname; }
    get quotedDBName() {
        return quoteIdentifier(this.#dbname);
    }

    #watcher: DirsWatcher;
    #queue;

    async close() {
        if (this.#queue) {
            this.#queue.killAndDrain();
            this.#queue = undefined;
        }
        if (this.#watcher) {
            // console.log(`CLOSING ${this.name}`);
            await this.#watcher.close();
            this.#watcher = undefined;
        }
        this.removeAllListeners('changed');
        this.removeAllListeners('added');
        this.removeAllListeners('unlinked');
        this.removeAllListeners('ready');

        try {
            await this.#db.close();
        } catch (err) {
            // console.warn(`${this.name} error on close ${err.message}`);
        }
    }

    /**
     * Set up receiving events from DirsWatcher, and dispatching to
     * the handler methods.
     */
    async setup() {
        const fcache = this;

        if (this.#watcher) {
            await this.#watcher.close();
        }

        this.#queue = fastq.promise(async function (event) {
            if (event.code === 'changed') {
                try {
                    // console.log(`change ${event.name} ${event.info.vpath}`);
                    await fcache.handleChanged(event.name, event.info);
                    fcache.emit('change', event.name, event.info);
                } catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        name: event.name,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            } else if (event.code === 'added') {
                try {
                    // console.log(`add ${event.name} ${event.info.vpath}`);
                    await fcache.handleAdded(event.name, event.info);
                    fcache.emit('add', event.name, event.info);
                } catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        name: event.name,
                        vpath: event.info.vpath,
                        info: event.info,
                        error: e
                    });
                }
            } else if (event.code === 'unlinked') {
                try {
                    // console.log(`unlink ${event.name} ${event.info.vpath}`, event.info);
                    await fcache.handleUnlinked(event.name, event.info);
                    fcache.emit('unlink', event.name, event.info);
                } catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        name: event.name,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            /* } else if (event.code === 'error') {
                await fcache.handleError(event.name) */
            } else if (event.code === 'ready') {
                await fcache.handleReady(event.name);
                fcache.emit('ready', event.name);
            }
        }, 10);

        this.#watcher = new DirsWatcher(this.name);

        this.#watcher.on('change', async (name: string, info: VPathData) => {
            // console.log(`${name} changed ${info.mountPoint} ${info.vpath}`);
            try {
                if (!this.ignoreFile(info)) {
                    // console.log(`PUSH ${name} changed ${info.mountPoint} ${info.vpath}`);

                    this.#queue.push({
                        code: 'changed',
                        name, info
                    });
                } else {
                    console.log(`Ignored 'change' for ${info.vpath}`);
                }
            } catch (err) {
                console.error(`FAIL change ${info.vpath} because ${err.stack}`);
            }
        })
        .on('add', async (name: string, info: VPathData) => {
            try {
                // console.log(`${name} add ${info.mountPoint} ${info.vpath}`);
                if (!this.ignoreFile(info)) {
                    // console.log(`PUSH ${name} add ${info.mountPoint} ${info.vpath}`);

                    this.#queue.push({
                        code: 'added',
                        name, info
                    });
                } else {
                    console.log(`Ignored 'add' for ${info.vpath}`);
                }
            } catch (err) {
                console.error(`FAIL add ${info.vpath} because ${err.stack}`);
            }
        })
        .on('unlink', async (name: string, info: VPathData) => {
            // console.log(`unlink ${name} ${info.vpath}`);
            try {
                if (!this.ignoreFile(info)) {
                    this.#queue.push({
                        code: 'unlinked',
                        name, info
                    });
                } else {
                    console.log(`Ignored 'unlink' for ${info.vpath}`);
                }
             } catch (err) {
                console.error(`FAIL unlink ${info.vpath} because ${err.stack}`);
            }
        })
        .on('ready', async (name: string) => {
            // console.log(`${name} ready`);
            this.#queue.push({
                code: 'ready',
                name
            });
        });

        const mapped = remapdirs(this.dirs);
        // console.log(`setup ${this.#name} watch ${util.inspect(this.#dirs)} ==> ${util.inspect(mapped)}`);
        await this.#watcher.watch(mapped);

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
    protected validateRow(row: any): T {
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
    protected validateRows(rows: any[]): T[] {
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
    protected cvtRowToObj(row: any): T {
        row.info = JSON.parse(row.info);
        return <T>row;
    }

    /**
     * Find an info object based on vpath and mounted.
     *
     * @param vpath 
     * @param mounted 
     * @returns 
     */
    protected async findPathMounted(
        vpath: string, mounted: string
    ): Promise<Array<{
        vpath: string,
        mounted: string
    }>>  {
        
        const found = <any[]>await this.db.all(`
            SELECT vpath, mounted
            FROM ${this.quotedDBName}
            WHERE 
            vpath = $vpath AND mounted = $mounted
        `, {
            $vpath: vpath,
            $mounted: mounted
        });
        const mapped = new Array<{
            vpath: string,
            mounted: string
        }>();
        for (const item of found) {
            if (typeof item.vpath === 'string'
             && typeof item.mounted === 'string'
            ) {
                mapped.push({
                    vpath: item.vpath, mounted: item.mounted
                });
            } else {
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
    protected async findByPath(vpath: string) {

        // console.log(`findByPath ${this.dao.table.quotedName} ${vpath}`);

        const found = <any[]>await this.db.all(`
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
        return mapped.map(item => {
            return this.cvtRowToObj(item)
        });
    }

    gatherInfoData(info: T) {
        // Placeholder which some subclasses
        // are expected to override

        // info.renderPath = info.vpath;
        throw new Error(`gatherInfoData must be overridden`);
    }

    protected async handleChanged(name, info) {
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

        if (
            !Array.isArray(result)
         || result.length <= 0
        ) {
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

    protected async handleAdded(name, info) {
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

    protected async insertDocToDB(info: T) {
        throw new Error(`insertDocToDB must be overridden`);
    }

    protected async updateDocInDB(info: T) {
        throw new Error(`updateDocInDB must be overridden`);
    }

    protected async handleUnlinked(name, info) {
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

    protected async handleReady(name) {
        // console.log(`PROCESS ${name} handleReady`);
        if (name !== this.name) {
            throw new Error(`handleReady event for wrong name; got ${name}, expected ${this.name}`);
        }
        this.#is_ready = true;
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
        while (this.#dirs.length > 0 && !this.#is_ready) {
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
                ignores = [ dirMount.ignore ];
            } else if (Array.isArray(dirMount.ignore)) {
                ignores = dirMount.ignore;
            } else {
                ignores = [];
            }
            for (const i of ignores) {
                if (micromatch.isMatch(info.vpath, i)) ignore = true;
                // console.log(`dirMount.ignore ${fspath} ${i} => ${ignore}`);
            }
            // if (ignore) console.log(`MUST ignore File ${info.vpath}`);
            // console.log(`ignoreFile for ${info.vpath} ==> ${ignore}`);
            return ignore;
        } else {
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
    async paths(rootPath?: string)
        : Promise<Array<PathsReturnType>>
    {
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
        ? <any[]>await this.db.all(
        `
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
        : <any[]>await this.db.all(
        `
            SELECT
                vpath, mime, mounted, mountPoint,
                pathInMounted, mtimeMs,
                info, fspath, renderPath
            FROM ${this.quotedDBName}
            ORDER BY mtimeMs ASC
        `);

        const result2: PathsReturnType[]
                = new Array<PathsReturnType>();
        for (const item of results) {
            if (fcache.ignoreFile(item)) {
                continue;
            }
            if (vpathsSeen.has((item as T).vpath)) {
                continue;
            } else {
                vpathsSeen.add((item as T).vpath);
            }
            if (item.mime === null) {
                item.mime = undefined;
            }
            const { error, value } =
                validatePathsReturnType(item);
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
    async find(_fpath): Promise<T | undefined> {

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
        } else if (Array.isArray(result2) && result2.length <= 0) {
            ret = undefined;
        } else {
            ret = result2;
        }
        if (ret) {
            const value: T = this.cvtRowToObj(
                this.validateRow(ret)
            );
            return value;
        } else {
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

    #fExistsInDir(fpath, dir) {
        // console.log(`#fExistsInDir ${fpath} ${util.inspect(dir)}`);
        if (dir.mountPoint === '/') {
            const fspath = path.join(
                dir.mounted, fpath
            );
            let fsexists = FS.existsSync(fspath);

            if (fsexists) {
                let stats = FS.statSync(fspath);
                return <VPathData> {
                    vpath: fpath,
                    renderPath: fpath,
                    fspath: fspath,
                    mime: undefined,
                    mounted: dir.mounted,
                    mountPoint: dir.mountPoint,
                    pathInMounted: fpath,
                    statsMtime: stats.mtimeMs
                };
            } else {
                return undefined;
            }
        }

        let mp = dir.mountPoint.startsWith('/')
            ? dir.mountPoint.substring(1)
            : dir.mountPoint;
        mp = mp.endsWith('/')
            ? mp
            : (mp+'/');

        if (fpath.startsWith(mp)) {
            let pathInMounted
                = fpath.replace(dir.mountPoint, '');
            let fspath = path.join(
                dir.mounted, pathInMounted);
            // console.log(`Checking exist for ${dir.mountPoint} ${dir.mounted} ${pathInMounted} ${fspath}`);
            let fsexists = FS.existsSync(fspath);

            if (fsexists) {
                let stats = FS.statSync(fspath);
                return <VPathData> {
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
    findSync(_fpath): VPathData | undefined {

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
            const found = this.#fExistsInDir(fpath, dir);
            if (found) {
                // console.log(`findSync ${fpath} found`, found);
                return found;
            }
        }
        return undefined;
    }

}

export class AssetsCache
        extends BaseCache<Asset> {
    
    protected validateRow(row: any): Asset {
        const { error, value } = validateAsset(row);
        if (error) {
            // console.error(`ASSET VALIDATION ERROR for`, row);
            throw error;
        } else return value;
    }

    protected validateRows(rows: any[]): Asset[] {
        if (!Array.isArray(rows)) {
            throw new Error(`AssetsCache validateRows must be given an array`);
        }
        const ret = new Array<Asset>();
        for (const row of rows) {
            ret.push(this.validateRow(row))
        }
        return ret;
    }

    protected cvtRowToObj(row: any): Asset {
        if (typeof row.info === 'string') {
            row.info = JSON.parse(row.info);
        }
        return <Asset>row;
    }

    gatherInfoData(info: Asset) {
        if (typeof (<any>info).statsMtime === 'number') {
            info.mtimeMs = (<any>info).statsMtime;
        }
        if (info.mime === null) {
            info.mime = undefined;
        }
    }

    protected async insertDocToDB(
        info: Asset
    ) {
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

    protected async updateDocInDB(info: Asset) {
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

export class PartialsCache
        extends BaseCache<Partial> {
    
    protected validateRow(row: any): Partial {
        const { error, value } = validatePartial(row);
        if (error) throw error;
        else return value;
    }

    protected validateRows(rows: any[]): Partial[] {
        if (!Array.isArray(rows)) {
            throw new Error(`PartialsCache validateRows must be given an array`);
        }
        const ret = new Array<Partial>();
        for (const row of rows) {
            ret.push(this.validateRow(row))
        }
        return ret;
    }

    protected cvtRowToObj(row: any): Partial {
        if (typeof row.info === 'string') {
            row.info = JSON.parse(row.info);
        }
        return <Partial>row;
    }


    gatherInfoData(info: Partial) {

        let renderer = this.config.findRendererPath(info.vpath);
        if (typeof (<any>info).statsMtime === 'number') {
            info.mtimeMs = (<any>info).statsMtime;
        }
        if (info.mime === null) {
            info.mime = undefined;
        }
        if (renderer) {
            info.rendererName = renderer.name;

            if (renderer.parseMetadata) {

                const rc = renderer.parseMetadata(<any>{
                    fspath: info.fspath,
                    content: FS.readFileSync(info.fspath, 'utf-8')
                });

                // docBody is the parsed body -- e.g. following the frontmatter
                info.docBody = rc.body;
            }
        }
    }

    protected async insertDocToDB(
        info: Partial
    ) {
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

    protected async updateDocInDB(
        info: Partial
    ) {
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

export class LayoutsCache
        extends BaseCache<Layout> {
    
    protected validateRow(row: any): Layout {
        const { error, value } = validateLayout(row);
        if (error) throw error;
        else return value;
    }

    protected validateRows(rows: any[]): Layout[] {
        if (!Array.isArray(rows)) {
            throw new Error(`LayoutsCache validateRows must be given an array`);
        }
        const ret = new Array<Layout>();
        for (const row of rows) {
            ret.push(this.validateRow(row))
        }
        return ret;
    }

    protected cvtRowToObj(row: any): Layout {
        if (typeof row.info === 'string') {
            row.info = JSON.parse(row.info);
        }
        return <Layout>row;
    }

    gatherInfoData(info: Layout) {

        let renderer = this.config.findRendererPath(info.vpath);
        if (typeof (<any>info).statsMtime === 'number') {
            info.mtimeMs = (<any>info).statsMtime;
        }
        if (info.mime === null) {
            info.mime = undefined;
        }
        if (renderer) {
            info.rendererName = renderer.name;

            const renderPath
                = renderer.filePath(info.vpath);

            info.rendersToHTML =
                micromatch.isMatch(
                    renderPath,
                    '**/*.html')
             || micromatch.isMatch(
                    renderPath,
                    '*.html')
            ? true : false;

            if (renderer.parseMetadata) {

                const rc = renderer.parseMetadata(<any>{
                    fspath: info.fspath,
                    content: FS.readFileSync(info.fspath, 'utf-8')
                });

                // docBody is the parsed body -- e.g. following the frontmatter
                info.docBody = rc.body;
            }
        } else {
            info.rendersToHTML = false;
        }
    }

    protected async insertDocToDB(
        info: Layout
    ) {
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

    protected async updateDocInDB(
        info: Layout
    ) {
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

export class DocumentsCache
        extends BaseCache<Document> {
    
    protected validateRow(row: any): Document {
        const { error, value }
                    = validateDocument(row);
        if (error) {
            console.error(`DOCUMENT VALIDATION ERROR for ${util.inspect(row)}`, error.stack);
            throw error;
        } else return value;
    }

    protected validateRows(rows: any[]): Document[] {
        if (!Array.isArray(rows)) {
            throw new Error(`DocumentsCache validateRows must be given an array`);
        }
        const ret = new Array<Document>();
        for (const row of rows) {
            ret.push(this.validateRow(row))
        }
        return ret;
    }

    protected cvtRowToObj(row: any): Document {
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
        return <Document>row;
    }

    gatherInfoData(info: Document) {

        info.renderPath = info.vpath;
        info.dirname = path.dirname(info.vpath);
        if (info.dirname === '.') info.dirname = '/';
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

        if (typeof (<any>info).statsMtime === 'number') {
            info.mtimeMs = (<any>info).statsMtime;
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
                micromatch.isMatch(
                    info.renderPath,
                    '**/*.html')
             || micromatch.isMatch(
                    info.renderPath,
                    '*.html')
            ? true : false;

            if (renderer.parseMetadata) {

                const rc = renderer.parseMetadata(<any>{
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
                info.metadata = { };
                if (!info.docMetadata) info.docMetadata = {};

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
                } else if (typeof (info.metadata.tags) === 'string') {
                    let taglist = [];
                    const re = /\s*,\s*/;
                    info.metadata.tags.split(re).forEach(tag => {
                        taglist.push(tag.trim());
                    });
                    info.metadata.tags = taglist;
                } else if (!Array.isArray(info.metadata.tags)) {
                    throw new Error(
                        `FORMAT ERROR - ${info.vpath} has badly formatted tags `,
                        info.metadata.tags);
                }
                info.docMetadata.tags = info.metadata.tags;

                // The root URL for the project
                info.metadata.root_url = this.config.root_url;

                // Compute the URL this document will render to
                if (this.config.root_url) {
                    let uRootUrl = new URL(this.config.root_url, 'http://example.com');
                    uRootUrl.pathname = path.normalize(
                            path.join(uRootUrl.pathname, info.metadata.document.renderTo)
                    );
                    info.metadata.rendered_url = uRootUrl.toString();
                } else {
                    info.metadata.rendered_url = info.metadata.document.renderTo;
                }

                // info.metadata.rendered_date = info.stats.mtime;

                const parsePublDate = (date) => {
                    const parsed = Date.parse(date);
                    if (! isNaN(parsed)) {
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
                    if (! dateSet && info.mtimeMs) {
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
        } else {
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

    protected async insertDocToDB(
        info: Document
    ) {
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
            await this.addDocTagGlue(
                info.vpath, info.metadata.tags
            );
        }
    }

    protected async updateDocInDB(
        info: Document
    ) {
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

    protected async deleteDocTagGlue(vpath) {
        try {
            await tglue.deleteTagGlue(vpath);
        } catch (err) {
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

    protected async addDocTagGlue(vpath: string, tags: string | string[]) {
        if (typeof tags !== 'string'
         && !Array.isArray(tags)
        ) {
            throw new Error(`addDocTagGlue must be given a tags array, was given: ${util.inspect(tags)}`);
        }
        await tglue.addTagGlue(vpath, 
            Array.isArray(tags)
            ? tags
            : [ tags ]);
    }

    async addTagDescription(tag: string, description: string) {
        return tdesc.addDesc(tag, description);
    }

    async getTagDescription(tag: string)
        : Promise<string | undefined>
    {
        return tdesc.getDesc(tag);
    }

    protected async handleUnlinked(name: any, info: any): Promise<void> {
        await super.handleUnlinked(name, info);
        tglue.deleteTagGlue(info.vpath);
    }

    async indexChain(_fpath) {

        const fpath = _fpath.startsWith('/')
                    ? _fpath.substring(1) 
                    : _fpath;
        const parsed = path.parse(fpath);

        // console.log(`indexChain ${_fpath} ${fpath}`, parsed);

        const filez: Document[] = [];
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
            } else {
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
                .map(function(obj: any) {
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
            return this.cvtRowToObj(item)
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
    async childItemTree(_rootItem: string) {

        // console.log(`childItemTree ${_rootItem}`);

        let rootItem = await this.find(
                _rootItem.startsWith('/')
                    ? _rootItem.substring(1)
                    : _rootItem);
        if (!rootItem) {
            // console.warn(`childItemTree no rootItem found for path ${_rootItem}`);
            return undefined;
        }
        if (!(typeof rootItem === 'object')
         || !('vpath' in rootItem)
        ) {
            // console.warn(`childItemTree found invalid object for ${_rootItem} - ${util.inspect(rootItem)}`);
            return undefined;
        }
        let dirname = path.dirname(rootItem.vpath);
        // Picks up everything from the current level.
        // Differs from siblings by getting everything.
        const _items = <any[]>await this.db.all(`
            SELECT *
            FROM ${this.quotedDBName}
            WHERE dirname = $dirname AND rendersToHTML = true
        `, {
            $dirname: dirname
        });
        const items: Document[]
            = this.validateRows(_items)
            .map(item => {
                return this.cvtRowToObj(item)
            });

        const _childFolders = <any[]>await this.db.all(`
            SELECT distinct dirname FROM DOCUMENTS
            WHERE parentDir = $dirname
        `, {
            $dirname: dirname
        });
        const childFolders = new Array<{ dirname: string }>();
        for (const cf of _childFolders) {
            if (typeof cf.dirname === 'string') {
                childFolders.push({
                    dirname: cf.dirname
                });
            } else {
                throw new Error(`childItemTree(${_rootItem}) no dirname fields in childFolders`);
            }
        }
        const cfs = [];
        for (const cf of childFolders) {
            cfs.push(await this.childItemTree(
                path.join(cf.dirname, 'index.html')
            ));
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
        }
    }

    /**
     * Find the index files (renders to index.html)
     * within the named subtree.
     *
     * @param rootPath 
     * @returns 
     */
    async indexFiles(rootPath?: string) {
        let rootP = rootPath?.startsWith('/')
                  ? rootPath?.substring(1)
                  : rootPath;

        // Optionally appendable sub-query
        // to handle when rootPath is specified
        let rootQ = (
                typeof rootP === 'string'
             && rootP.length >= 1
            )
            ? `AND ( renderPath LIKE '${rootP}%' )`
            : '';

        const indexes = <any[]> await this.db.all(`
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
            return this.cvtRowToObj(item)
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
        const setter = (row: {
            vpath: string,
            fspath: string,
            mtimeMs: number,
            publicationTime: number,
            publDate: string,
            publicationDate: string
        }) => {
            let parsed = NaN;
            if (row.publDate) {
                parsed = Date.parse(row.publDate);
            } else if (row.publicationDate) {
                parsed = Date.parse(row.publicationDate);
            } else if (row.publicationTime) {
                parsed = row.publicationTime;
            }
            if (! isNaN(parsed)) {
                const dp = new Date(parsed);
                FS.utimesSync(
                    row.fspath,
                    dp,
                    dp
                );
            } 
        }

        await this.db.each(`
            SELECT
                vpath, fspath,
                mtimeMs, publicationTime,
                json_extract(info, '$.docMetadata.publDate') as publDate,
                json_extract(info, '$.docMetadata.publicationDate') as publicationDate,
            FROM ${this.quotedDBName}
        `, { },
        (row: {
            vpath: string,
            fspath: string,
            mtimeMs: number,
            publicationTime: number,
            publDate: string,
            publicationDate: string
        }) => {
            if (row.publDate
             || row.publicationDate
             || row.publicationTime
            ) {
                setter(row);
            }
        });
    }

    async documentsWithTag(tagnm: string | string[])
        : Promise<Array<string>>
    {
        let tags: string[];
        if (typeof tagnm === 'string') {
            tags = [ tagnm ];
        } else if (Array.isArray(tagnm)) {
            tags = tagnm;
        } else {
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
        return ret.sort((a: string, b: string) => {
            var tagA = a.toLowerCase();
            var tagB = b.toLowerCase();
            if (tagA < tagB) return -1;
            if (tagA > tagB) return 1;
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
    async docLinkData(vpath: string): Promise<{

        // The vpath reference
        vpath: string;
        // The path it renders to
        renderPath: string;
        // The title string from that page
        title: string;
        // The teaser text from that page
        teaser?: string;
        // The hero image (thumbnail)
        thumbnail?: string;
    }> {

        const found = <any[]> await this.db.all(`
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
        } else {
            return {
                vpath,
                renderPath: undefined,
                title: undefined
            };
        }
    }

    // This is a simple cache to hold results
    // of search operations.  The key side of this
    // Map is meant to be the stringified selector.
    private searchCache = new Map<
            string, { results: Document[], timestamp: number }
    >();

    /**
     * Perform descriptive search operations using direct SQL queries
     * for better performance and scalability.
     *
     * @param options Search options object
     * @returns Promise<Array<Document>>
     */
    async search(options): Promise<Array<Document>> {
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
        const cacheKey = JSON.stringify(
            options,
            function(key, value) {
                if (value instanceof RegExp) {
                    return value.toString();
                } else if (typeof value === 'function') {
                    return value + ''; // implicitly `toString` it
                } else {
                    return value;
                }
            }
        );

        // A timeout of 0 means to disable caching
        const cached =
            this.config.searchCacheTimeout > 0
            ? this.searchCache.get(cacheKey)
            : undefined;

        // console.log(`search ${util.inspect(options)} ==> ${cacheKey} ${cached ? 'hasCached' : 'noCached'}`);

        // If the cache has an entry, skip computing
        // anything.
        if (cached
         && (Date.now() - cached.timestamp)
            < this.config.searchCacheTimeout
        ) { // 1 minute cache
            return cached.results;
        }

        // NOTE: Entries are added to the cache at the bottom
        // of this function

        try {
            const { sql, params } = this.buildSearchQuery(options);
            // console.log(`search ${sql}`);
            const results
                = await this.db.all(sql, params);

            const documents
                = this.validateRows(results)
                .map(item => {
                    return this.cvtRowToObj(item)
                });

            // Apply post-SQL filters that can't be done in SQL
            let filteredResults = documents;

            // Filter by renderers (requires config lookup)
            if (options.renderers
             && Array.isArray(options.renderers)
            ) {
                filteredResults = filteredResults.filter(item => {
                    let renderer = fcache.config.findRendererPath(item.vpath);
                    if (!renderer) return false;
                    
                    let found = false;
                    for (const r of options.renderers) {
                        if (typeof r === 'string' && r === renderer.name) {
                            found = true;
                        } else if (typeof r === 'object' || typeof r === 'function') {
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

        } catch (err: any) {
            throw new Error(`DocumentsFileCache.search error: ${err.message}`);
        }
    }

    /**
     * Build SQL query and parameters for search options
     */
    private buildSearchQuery(options): {
        sql: string,
        params: any
    } {
        const params: any = {};
        const whereClauses: string[] = [];
        const joins: string[] = [];
        let paramCounter = 0;

        // console.log(`buildSearchQuery ${util.inspect(options)}`);

        // Helper to create unique parameter names
        const addParam = (value: any): string => {
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
            } else if (Array.isArray(options.mime)) {
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
        } else if (typeof options.blogtag === 'string') {
            whereClauses.push(`d.blogtag = ${addParam(options.blogtag)}`);
            // console.log(`d.blogtag = ${options.blogtag}`);
        } else if (typeof options.blogtags === 'string') {
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
                } else if (options.layouts.length > 1) {
                    const placeholders = options.layouts.map(layout => addParam(layout)).join(', ');
                    whereClauses.push(`d.layout IN (${placeholders})`);
                }
            } else {
                whereClauses.push(`d.layout = ${addParam(options.layouts)}`);
            }
        }

        // Path regex matching
        const regexClauses: string[] = [];
        if (typeof options.pathmatch === 'string') {
            regexClauses.push(`d.vpath regexp ${addParam(options.pathmatch)}`);
        } else if (options.pathmatch instanceof RegExp) {
            regexClauses.push(`d.vpath regexp ${addParam(options.pathmatch.source)}`);
        } else if (Array.isArray(options.pathmatch)) {
            for (const match of options.pathmatch) {
                if (typeof match === 'string') {
                    regexClauses.push(`d.vpath regexp ${addParam(match)}`);
                } else if (match instanceof RegExp) {
                    regexClauses.push(`d.vpath regexp ${addParam(match.source)}`);
                } else {
                    throw new Error(`search ERROR invalid pathmatch regexp ${util.inspect(match)}`);
                }
            }
        } else if ('pathmatch' in options) {
            throw new Error(`search ERROR invalid pathmatch ${util.inspect(options.pathmatch)}`);
        }

        // Render path regex matching
        // if (typeof options.renderpathmatch !== 'undefined') {
        //     console.log(util.inspect(options.renderpathmatch, false, 3));
        // }
        if (typeof options.renderpathmatch === 'string') {
            // console.log(`d.renderPath regexp string ${options.renderpathmatch}`);
            regexClauses.push(`d.renderPath regexp ${addParam(options.renderpathmatch)}`);
        } else if (options.renderpathmatch instanceof RegExp) {
            // console.log(`d.renderPath regexp regexp ${options.renderpathmatch.source}`);
            regexClauses.push(`d.renderPath regexp ${addParam(options.renderpathmatch.source)}`);
        } else if (Array.isArray(options.renderpathmatch)) {
            for (const match of options.renderpathmatch) {
                if (typeof match === 'string') {
                    // console.log(`d.renderPath regexp array string ${match}`);
                    regexClauses.push(`d.renderPath regexp ${addParam(match)}`);
                } else if (match instanceof RegExp) {
                    // console.log(`d.renderPath regexp array regexp ${match.source}`);
                    regexClauses.push(`d.renderPath regexp ${addParam(match.source)}`);
                } else {
                    throw new Error(`search ERROR invalid renderpathmatch regexp ${util.inspect(match)}`);
                }
            }
        } else if ('renderpathmatch' in options) {
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
            } else {
                // For all other fields, sort by the column directly
                // This allows sorting by any valid column in the DOCUMENTS table
                orderBy = `ORDER BY d.${options.sortBy}`;
            }
        } else if (options.reverse || options.sortByDescending) {
            // If reverse/sortByDescending is specified without sortBy, 
            // use a default ordering (by modification time)
            orderBy = 'ORDER BY d.mtimeMs';
        }

        // Handle sort direction
        if (orderBy) {
            if (options.sortByDescending || options.reverse) {
                orderBy += ' DESC';
            } else {
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

export var assetsCache: AssetsCache;
export var partialsCache: PartialsCache;
export var layoutsCache: LayoutsCache;
export var documentsCache: DocumentsCache;

export async function setup(
    config: Configuration,
    db: AsyncDatabase
): Promise<void> {

    // console.log(createAssetsTable);
    await db.run(createAssetsTable);

    assetsCache = new AssetsCache(
        config,
        'assets',
        config.assetDirs,
        db,
        'ASSETS'
    );
    await assetsCache.setup();

    assetsCache.on('error', (...args) => {
        console.error(`assetsCache ERROR ${util.inspect(args)}`)
    });

    // console.log(createPartialsTable);
    await db.run(createPartialsTable);

    partialsCache = new PartialsCache(
        config,
        'partials',
        config.partialsDirs,
        db,
        'PARTIALS'
    );
    await partialsCache.setup();

    partialsCache.on('error', (...args) => {
        console.error(`partialsCache ERROR ${util.inspect(args)}`)
    });

    // console.log(createLayoutsTable);
    await db.run(createLayoutsTable);

    layoutsCache = new LayoutsCache(
        config,
        'layouts',
        config.layoutDirs,
        db,
        'LAYOUTS'
    );
    await layoutsCache.setup();

    layoutsCache.on('error', (...args) => {
        console.error(`layoutsCache ERROR ${util.inspect(args)}`)
    });

    // console.log(`DocumentsFileCache 'documents' ${util.inspect(config.documentDirs)}`);

    // console.log(createDocumentsTable);
    await db.run(createDocumentsTable);

    documentsCache = new DocumentsCache(
        config,
        'documents',
        config.documentDirs,
        db,
        'DOCUMENTS'
    );
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
