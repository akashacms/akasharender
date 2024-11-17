
import { DirsWatcher, dirToWatch, VPathData } from '@akashacms/stacked-dirs';
import path from 'path';
import util from 'util';
import url  from 'url';
import { promises as fs } from 'fs';
import FS from 'fs';
import EventEmitter from 'events';
import { minimatch } from 'minimatch';

import {
    field,
    FieldOpts,
    fk,
    id,
    index,
    table,
    TableOpts,
    SqlDatabase,
    schema,
    BaseDAO,
    Filter,
    Where
} from 'sqlite3orm';

import { sqdb } from '../sqdb.js';
import { Configuration } from '../index.js';
import fastq from 'fastq';

///////////// Assets table

@table({
    name: 'ASSETS',
    withoutRowId: true,
} as TableOpts)
class Asset {

    // Primary key
    @id({
        name: 'vpath', dbtype: 'TEXT'
    })
    @index('asset_vpath')
    vpath: string;

    @field({
        name: 'mime', dbtype: 'TEXT'
    })
    mime: string;

    @field({
        name: 'mounted', dbtype: 'TEXT'
    })
    @index('asset_mounted')
    mounted: string;

    @field({
        name: 'mountPoint', dbtype: 'TEXT'
    })
    @index('asset_mountPoint')
    mountPoint: string;

    @field({
        name: 'pathInMounted', dbtype: 'TEXT'
    })
    @index('asset_pathInMounted')
    pathInMounted: string;

    @field({
        name: 'fspath', dbtype: 'TEXT'
    })
    @index('asset_fspath')
    fspath: string;

    @field({
        name: 'renderPath', dbtype: 'TEXT'
    })
    @index('asset_renderPath')
    renderPath: string;

    @field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    })
    mtimeMs: string;

    @field({
        name: 'info', dbtype: 'TEXT', isJson: true
    })
    info: any;

}

await schema().createTable(sqdb, 'ASSETS');
type TassetsDAO = BaseDAO<Asset>;
export const assetsDAO: TassetsDAO
    = new BaseDAO<Asset>(Asset, sqdb);

//////////// Partials Table

@table({
    name: 'PARTIALS',
    withoutRowId: true,
})
class Partial {

    // Primary key
    @id({
        name: 'vpath', dbtype: 'TEXT'
    })
    @index('partial_vpath')
    vpath: string;

    @field({
        name: 'mime', dbtype: 'TEXT'
    })
    mime: string;

    @field({
        name: 'mounted', dbtype: 'TEXT'
    })
    @index('partial_mounted')
    mounted: string;

    @field({
        name: 'mountPoint', dbtype: 'TEXT'
    })
    @index('partial_mountPoint')
    mountPoint: string;

    @field({
        name: 'pathInMounted', dbtype: 'TEXT'
    })
    @index('partial_pathInMounted')
    pathInMounted: string;

    @field({
        name: 'fspath', dbtype: 'TEXT'
    })
    @index('partial_fspath')
    fspath: string;

    @field({
        name: 'renderPath', dbtype: 'TEXT'
    })
    @index('partial_renderPath')
    renderPath: string;

    @field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    })
    mtimeMs: string;

    @field({
        name: 'docMetadata', dbtype: 'TEXT', isJson: true
    })
    docMetadata: any;

    @field({
        name: 'docContent', dbtype: 'TEXT', isJson: true
    })
    docContent: any;

    @field({
        name: 'docBody', dbtype: 'TEXT', isJson: true
    })
    docBody: any;

    @field({
        name: 'metadata', dbtype: 'TEXT', isJson: true
    })
    metadata: any;

    @field({
        name: 'info', dbtype: 'TEXT', isJson: true
    })
    info: any;
}

await schema().createTable(sqdb, 'PARTIALS');
type TpartialsDAO = BaseDAO<Partial>;
export const partialsDAO
    = new BaseDAO<Partial>(Partial, sqdb);

///////////////// Layouts Table

@table({
    name: 'LAYOUTS',
    withoutRowId: true,
})
class Layout {

    // Primary key
    @id({
        name: 'vpath', dbtype: 'TEXT'
    })
    @index('layout_vpath')
    vpath: string;

    @field({
        name: 'mime', dbtype: 'TEXT'
    })
    mime: string;

    @field({
        name: 'mounted', dbtype: 'TEXT'
    })
    @index('layout_mounted')
    mounted: string;

    @field({
        name: 'mountPoint', dbtype: 'TEXT'
    })
    @index('layout_mountPoint')
    mountPoint: string;

    @field({
        name: 'pathInMounted', dbtype: 'TEXT'
    })
    @index('layout_pathInMounted')
    pathInMounted: string;

    @field({
        name: 'fspath', dbtype: 'TEXT'
    })
    @index('layout_fspath')
    fspath: string;

    @field({
        name: 'renderPath', dbtype: 'TEXT'
    })
    @index('layout_renderPath')
    renderPath: string;

    @field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    })
    mtimeMs: string;

    @field({
        name: 'docMetadata', dbtype: 'TEXT', isJson: true
    })
    docMetadata: any;

    @field({
        name: 'docContent', dbtype: 'TEXT', isJson: true
    })
    docContent: any;

    @field({
        name: 'docBody', dbtype: 'TEXT', isJson: true
    })
    docBody: any;

    @field({
        name: 'metadata', dbtype: 'TEXT', isJson: true
    })
    metadata: any;

    @field({
        name: 'info', dbtype: 'TEXT', isJson: true
    })
    info: any;

}

await schema().createTable(sqdb, 'LAYOUTS');
type TlayoutsDAO = BaseDAO<Layout>;
export const layoutsDAO
    = new BaseDAO<Layout>(Layout, sqdb);

/////////////// Documents Table

@table({
    name: 'DOCUMENTS',
    withoutRowId: true,
})
class Document {

    // Primary key
    @id({
        name: 'vpath', dbtype: 'TEXT'
    })
    @index('docs_vpath')
    vpath: string;

    @field({
        name: 'mime', dbtype: 'TEXT'
    })
    mime: string;

    @field({
        name: 'mounted', dbtype: 'TEXT'
    })
    @index('docs_mounted')
    mounted: string;

    @field({
        name: 'mountPoint', dbtype: 'TEXT'
    })
    @index('docs_mountPoint')
    mountPoint: string;

    @field({
        name: 'pathInMounted', dbtype: 'TEXT'
    })
    @index('docs_pathInMounted')
    pathInMounted: string;

    @field({
        name: 'fspath', dbtype: 'TEXT'
    })
    @index('docs_fspath')
    fspath: string;

    @field({
        name: 'renderPath', dbtype: 'TEXT'
    })
    @index('docs_renderPath')
    renderPath: string;

    @field({
        name: 'rendersToHTML', dbtype: 'INTEGER'
    })
    @index('docs_rendersToHTML')
    rendersToHTML: boolean;

    @field({
        name: 'dirname', dbtype: 'TEXT'
    })
    @index('docs_dirname')
    dirname: string;

    @field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    })
    mtimeMs: string;

    @field({
        name: 'docMetadata', dbtype: 'TEXT', isJson: true
    })
    docMetadata: any;

    @field({
        name: 'docContent', dbtype: 'TEXT', isJson: false
    })
    docContent: string;

    @field({
        name: 'docBody', dbtype: 'TEXT', isJson: false
    })
    docBody: string;

    @field({
        name: 'metadata', dbtype: 'TEXT', isJson: true
    })
    metadata: any;

    @field({
        name: 'tags', dbtype: 'TEXT', isJson: true
    })
    tags: any;

    @field({
        name: 'layout', dbtype: 'TEXT', isJson: false
    })
    @index('docs_layout')
    layout: string;

    @field({
        name: 'info', dbtype: 'TEXT', isJson: true
    })
    info: any;

}

await schema().createTable(sqdb, 'DOCUMENTS');
type TdocumentssDAO = BaseDAO<Document>;
export const documentsDAO
    = new BaseDAO<Document>(Document, sqdb);

@table({ name: 'TAGGLUE' })
class TagGlue {

    @field({ name: 'docvpath', dbtype: 'string' })
    @fk('tag_docvpath', 'DOCUMENTS', 'vpath')
    @index('tagglue_vpath')
    docvpath: string;

    @field({ name: 'slug', dbtype: 'string' })
    @fk('tag_slug', 'TAGS', 'slug')
    @index('tagglue_slug')
    slug: string;
}

await schema().createTable(sqdb, 'TAGGLUE');
const tagGlueDAO = new BaseDAO<TagGlue>(TagGlue, sqdb);

@table({ name: 'TAGS' })
class Tag {
    @field({
        name: 'tagname',
        dbtype: 'TEXT'
    })
    tagname: string;

    @id({
        name: 'slug', dbtype: 'TEXT'
    })
    @index('tag_slug')
    slug: string;

    @field({
        name: 'description', dbtype: 'TEXT'
    })
    description?: string;
}

await schema().createTable(sqdb, 'TAGS');
const tagsDAO = new BaseDAO<Tag>(Tag, sqdb);


// Convert AkashaCMS mount points into the mountpoint
// used by DirsWatcher
const remapdirs = dirz => {
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

/**
 * Type for return from paths method.  The fields here
 * are whats in the Asset/Layout/Partial classes above
 * plus a couple fields that older code expected
 * from the paths method.
 */
export type PathsReturnType = {
    vpath: string,
    mime: string,
    mounted: string,
    mountPoint: string,
    pathInMounted: string,
    mtimeMs: string,
    info: any,
    // These will be computed in BaseFileCache
    // They were returned in previous versions.
    fspath: string,
    renderPath: string
};

export class BaseFileCache<
        T extends Asset | Layout | Partial | Document,
        Tdao extends BaseDAO<T>
> extends EventEmitter {

    #config?: Configuration;
    #name?: string;
    #dirs?: dirToWatch[];
    #is_ready: boolean = false;
    #cache_content: boolean;
    #map_renderpath: boolean;
    #dao: Tdao; // BaseDAO<T>;


    /**
     * @param config AkashaRender Configuration object
     * @param dirs array of directories and mount points to watch
     * @param name string giving the name for this watcher name
     * @param dao The SQLITE3ORM DAO instance to use
     */
    constructor(
        config: Configuration,
        name: string,
        dirs: dirToWatch[],
        dao: Tdao // BaseDAO<T>
    ) {
        super();
        // console.log(`BaseFileCache ${name} constructor dirs=${util.inspect(dirs)}`);
        this.#config = config;
        this.#name = name;
        this.#dirs = dirs;
        this.#is_ready = false;
        this.#cache_content = false;
        this.#map_renderpath = false;
        this.#dao = dao;
    }

    get config()     { return this.#config; }
    get name()       { return this.#name; }
    get dirs()       { return this.#dirs; }
    set cacheContent(doit) { this.#cache_content = doit; }
    get gacheContent() { return this.#cache_content; }
    set mapRenderPath(doit) { this.#map_renderpath = doit; }
    get mapRenderPath() { return this.#map_renderpath; }
    get dao(): Tdao { return this.#dao; }

    // SKIP: getDynamicView


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

        await sqdb.close();
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

        this.#watcher.on('change', async (name, info) => {
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
        .on('add', async (name, info) => {
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
        .on('unlink', async (name, info) => {
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
        .on('ready', async (name) => {
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

    gatherInfoData(info: T) {
        // Placeholder which some subclasses
        // are expected to override

        info.renderPath = info.vpath;
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

        const result = await this.dao.selectAll({
            vpath: { eq: info.vpath },
            mounted: { eq: info.mounted }
        } as Filter<T>);

        if (
            !Array.isArray(result)
         || result.length <= 0
        ) {
            // It wasn't found in the database.  Hence
            // we should add it.
            return this.handleAdded(name, info);
        }

        info.stack = undefined;
        await this.updateDocInDB(info);
        await this.config.hookFileChanged(name, info);
    }

    protected async updateDocInDB(info) {
        await this.#dao.update({
            vpath: info.vpath,
            mime: info.mime,
            mounted: info.mounted,
            mountPoint: info.mountPoint,
            pathInMounted: info.pathInMounted,
            mtimeMs: new Date(info.statsMtime).toISOString(),
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            rendersToHTML: info.rendersToHTML,
            dirname: path.dirname(info.renderPath),
            docMetadata: info.docMetadata,
            // docContent: info.docContent,
            // docBody: info.docBody,
            metadata: info.metadata,
            info,
        } as T);
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

    protected async insertDocToDB(info) {
        await this.#dao.insert({
            vpath: info.vpath,
            mime: info.mime,
            mounted: info.mounted,
            mountPoint: info.mountPoint,
            pathInMounted: info.pathInMounted,
            mtimeMs: new Date(info.statsMtime).toISOString(),
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            rendersToHTML: info.rendersToHTML,
            dirname: path.dirname(info.renderPath),
            docMetadata: info.docMetadata,
            // docContent: info.docContent,
            // docBody: info.docBody,
            metadata: info.metadata,
            info,
        } as T);
    }

    async handleUnlinked(name, info) {
        // console.log(`PROCESS ${name} handleUnlinked`, info.vpath);
        if (name !== this.name) {
            throw new Error(`handleUnlinked event for wrong name; got ${name}, expected ${this.name}`);
        }

        await this.config.hookFileUnlinked(name, info);

        await this.#dao.deleteAll({
            vpath: { eq: info.vpath },
            mounted: { eq: info.mounted }
        } as Where<T>);
    }

    async handleReady(name) {
        // console.log(`PROCESS ${name} handleReady`);
        if (name !== this.name) {
            throw new Error(`handleReady event for wrong name; got ${name}, expected ${this.name}`);
        }
        this.#is_ready = true;
        this.emit('ready', name);
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
                if (minimatch(info.vpath, i)) ignore = true;
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

    async paths()
        : Promise<Array<PathsReturnType>>
    {
        const fcache = this;

        // This is copied from the older version
        // (LokiJS version) of this function.  It
        // seems meant to eliminate duplicates.
        const vpathsSeen = new Set();

        const result = await this.dao.selectAll({
            order: { mtimeMs: true }
        });
        const result2 = result.filter(item => {
            // console.log(`paths ?ignore? ${item.vpath}`);
            if (fcache.ignoreFile(item)) {
                return false;
            }
            if (vpathsSeen.has((item as Asset).vpath)) {
                return false;
            } else {
                vpathsSeen.add((item as Asset).vpath);
                return true;
            }
        });
        // const result3 = result2.sort((a, b) => {
        //     // We need these to be one of the concrete
        //     // types so that the mtimeMs field is
        //     // recognized by TypeScript.  The Asset
        //     // class is a good substitute for the base
        //     // class of cached files.
        //     const aa = <Asset>a;
        //     const bb = <Asset>b;
        //     if (aa.mtimeMs < bb.mtimeMs) return 1;
        //     if (aa.mtimeMs === bb.mtimeMs) return 0;
        //     if (aa.mtimeMs > bb.mtimeMs) return -1;
        // });

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

        // console.log(result2/*.map(item => {
        //     return {
        //         vpath: item.vpath,
        //         mtimeMs: item.mtimeMs
        //     };
        // }) */);

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

        const result1 = await this.dao.selectAll({
            or: [
                { vpath: { eq: fpath }},
                { renderPath: { eq: fpath }}
            ]
        } as Filter<T>);

        // console.log(`find ${_fpath} ${fpath} ==> result1 ${util.inspect(result1)} `);

        const result2 = result1.filter(item => {
            return !(fcache.ignoreFile(item));
        });

        // console.log(`find ${_fpath} ${fpath} ==> result2 ${util.inspect(result2)} `);

        let ret;
        if (Array.isArray(result2) && result2.length > 0) {
            ret = result2[0];
        } else if (Array.isArray(result2) && result2.length <= 0) {
            ret = undefined;
        } else {
            ret = result2;
        }
        return ret;
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

    async findAll() {

        const fcache = this;

        const result1 = await this.dao.selectAll({
        } as Filter<T>);

        const result2 = result1.filter(item => {
            // console.log(`findAll ?ignore? ${item.vpath}`);
            return !(fcache.ignoreFile(item));
        });
        return result2;
    }
}

export class TemplatesFileCache<
    T extends Layout | Partial,
    Tdao extends BaseDAO<T>>
    extends BaseFileCache<T, Tdao> {

    constructor(
        config: Configuration,
        name: string,
        dirs: dirToWatch[],
        dao: Tdao
    ) {
        super(config, name, dirs, dao);
    }

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
        if (info.dirname === '.') info.dirname = '/';

        let renderer = this.config.findRendererPath(info.vpath);
        info.renderer = renderer;


        if (renderer) {


            if (renderer.parseMetadata) {

                // Using <any> here covers over
                // that parseMetadata requires
                // a RenderingContext which
                // in turn requires a 
                // metadata object.
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

                for (let yprop in info.baseMetadata) {
                    // console.log(`initMetadata ${basedir} ${fpath} baseMetadata ${baseMetadata[yprop]}`);
                    info.metadata[yprop] = info.baseMetadata[yprop];
                }
            }
        }

        // console.log(`TemplatesFileCache after gatherInfoData `, info);
    }

    protected async updateDocInDB(info) {
        await this.dao.update(({
            vpath: info.vpath,
            mime: info.mime,
            mounted: info.mounted,
            mountPoint: info.mountPoint,
            pathInMounted: info.pathInMounted,
            mtimeMs: new Date(info.statsMtime).toISOString(),
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            rendersToHTML: info.rendersToHTML,
            dirname: path.dirname(info.renderPath),
            docMetadata: info.docMetadata,
            docContent: info.docContent,
            docBody: info.docBody,
            metadata: info.metadata,
            info,
        } as unknown) as T);
    }

    protected async insertDocToDB(info: any) {
        await this.dao.insert(({
            vpath: info.vpath,
            mime: info.mime,
            mounted: info.mounted,
            mountPoint: info.mountPoint,
            pathInMounted: info.pathInMounted,
            mtimeMs: new Date(info.statsMtime).toISOString(),
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            rendersToHTML: info.rendersToHTML,
            dirname: path.dirname(info.renderPath),
            docMetadata: info.docMetadata,
            docContent: info.docContent,
            docBody: info.docBody,
            metadata: info.metadata,
            info,
        } as unknown) as T);
    }
}

export class DocumentsFileCache
    extends BaseFileCache<Document, TdocumentssDAO> {

    constructor(
        config: Configuration,
        name: string,
        dirs: dirToWatch[]
    ) {
        super(config, name, dirs, documentsDAO);
    }

    gatherInfoData(info) {

        info.renderPath = info.vpath;
        info.dirname = path.dirname(info.vpath);
        if (info.dirname === '.') info.dirname = '/';

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

        // set publicationDate somehow


        let renderer = this.config.findRendererPath(info.vpath);
        info.renderer = renderer;

        if (renderer) {

            info.renderPath
                = renderer.filePath(info.vpath);

            // This was in the LokiJS code, but
            // was not in use.
            // info.rendername = path.basename(
            //     info.renderPath
            // );

            info.rendersToHTML = minimatch(
                info.renderPath,
                '**/*.html')
            ? true : false;

            if (renderer.parseMetadata) {

                // Using <any> here covers over
                // that parseMetadata requires
                // a RenderingContext which
                // in turn requires a 
                // metadata object.
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
                    let pRootUrl = url.parse(this.config.root_url);
                    pRootUrl.pathname = path.normalize(
                            path.join(pRootUrl.pathname, info.metadata.document.renderTo)
                    );
                    info.metadata.rendered_url = url.format(pRootUrl);
                } else {
                    info.metadata.rendered_url = info.metadata.document.renderTo;
                }

                // info.metadata.rendered_date = info.stats.mtime;

                const parsePublDate = (date) => {
                    const parsed = Date.parse(date);
                    if (! isNaN(parsed)) {
                        info.metadata.publicationDate = new Date(parsed);
                        info.publicationDate = info.metadata.publicationDate;
                        info.publicationTime = info.publicationDate.getTime();
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
                        info.metadata.publicationDate = new Date(info.mtimeMs);
                        info.publicationDate = info.metadata.publicationDate;
                        info.publicationTime = info.publicationDate.getTime();
                        // console.log(`${info.vpath} metadata.publicationDate ${info.metadata.publicationDate} set from stats.mtime`);
                    }
                    if (!info.metadata.publicationDate) {
                        info.metadata.publicationDate = new Date();
                        info.publicationDate = info.metadata.publicationDate;
                        info.publicationTime = info.publicationDate.getTime();
                        // console.log(`${info.vpath} metadata.publicationDate ${info.metadata.publicationDate} set from current time`);
                    }
                }

            }
        }
    }

    protected async updateDocInDB(info) {
        await this.dao.update(({
            vpath: info.vpath,
            mime: info.mime,
            mounted: info.mounted,
            mountPoint: info.mountPoint,
            pathInMounted: info.pathInMounted,
            mtimeMs: new Date(info.statsMtime).toISOString(),
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            rendersToHTML: info.rendersToHTML,
            dirname: path.dirname(info.renderPath),
            docMetadata: info.docMetadata,
            docContent: info.docContent,
            docBody: info.docBody,
            metadata: info.metadata,
            tags: Array.isArray(info.metadata?.tags)
                    ? info.metadata.tags
                    : [],
            layout: info.metadata?.layout,
            info,
        } as unknown) as Document);
    }

    protected async insertDocToDB(info: any) {
        await this.dao.insert(({
            vpath: info.vpath,
            mime: info.mime,
            mounted: info.mounted,
            mountPoint: info.mountPoint,
            pathInMounted: info.pathInMounted,
            mtimeMs: new Date(info.statsMtime).toISOString(),
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            rendersToHTML: info.rendersToHTML,
            dirname: path.dirname(info.renderPath),
            docMetadata: info.docMetadata,
            docContent: info.docContent,
            docBody: info.docBody,
            metadata: info.metadata,
            tags: Array.isArray(info.metadata?.tags)
                    ? info.metadata.tags
                    : [],
            layout: info.metadata?.layout,
            info,
        } as unknown) as Document);
    }

    async indexChain(_fpath) {

        const fpath = _fpath.startsWith('/')
                    ? _fpath.substring(1) 
                    : _fpath;
        const parsed = path.parse(fpath);

        const filez: Document[] = [];
        const self = await this.dao.selectAll({
            'or': [
                { vpath: { eq: fpath } },
                { renderPath: { eq: fpath } }
            ]
        });
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

            const index = await this.dao.selectAll({
                'or': [
                    { vpath: { eq: lookFor } },
                    { renderPath: { eq: lookFor } }
                ]
            });

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
        // if (dirname === '.') dirname = '/';

        const siblings = await this.dao.selectAll({
            dirname: { eq: dirname },
            // The siblings cannot include the self.
            vpath: { neq: vpath },
            renderPath: { neq: vpath },
            rendersToHTML: true
        });
        return siblings.filter(item => {
            return !this.ignoreFile(item);
        });
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
        let rootQ = typeof rootP === 'string'
            ? `AND ( renderPath regexp '^${rootP}' )`
            : '';

        return this.dao.sqldb.all(`
        SELECT *
        FROM DOCUMENTS
        WHERE
            ( rendersToHTML = true )
        AND (
            ( renderPath regexp '/index.html$' )
         OR ( renderPath regexp '^index.html$' )
        )
        ${rootQ}
        `);
        

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
        await this.dao.selectEach(
            (err, model) => {

                const setter = async (date) => {
                    const parsed = Date.parse(date);;
                    if (! isNaN(parsed)) {
                        const dp = new Date(parsed);
                        FS.utimesSync(
                            model.fspath,
                            dp,
                            dp
                        );
                    } 
                }
                if (model.info.docMetadata
                 && model.info.docMetadata.publDate) {
                    setter(model.info.docMetadata.publDate);
                }
                if (model.info.docMetadata
                 && model.info.docMetadata.publicationDate) {
                    setter(model.info.docMetadata.publicationDate);
                }
            },
            {} as Where<Document>
        );
    }

    /**
     * Retrieve the documents which have tags.
     *
     * @returns 
     */
    async documentsWithTags() {
        const docs = new Array<Document>();
        await this.dao.selectEach(
            (err, doc) => {
                if (doc
                 && doc.docMetadata
                 && doc.docMetadata.tags
                 && Array.isArray(
                    doc.docMetadata.tags
                 )
                 && doc.docMetadata.tags.length >= 1
                ) {
                    docs.push(doc);
                }
            },
            {
                rendersToHTML: { eq: true },
                info: { isNotNull: true }
            } as Where<Document>
        );

        // console.log(docs);
        return docs;
    }

    /**
     * Get an array of tags used by all documents.
     * This uses the JSON extension to extract
     * the tags from the metadata object.
     *
     * @returns 
     */
    async tags() {
        const res = await this.dao.sqldb.all(`
            SELECT
                vpath,
                json_extract(docMetadata, '$.tags') as tags
            FROM DOCUMENTS
        `);

        // console.log(res);

        // The query above produces this result:
        //
        // {
        //     vpath: 'tags-array.html.md',
        //     tags: '["Tag1","Tag2","Tag3"]'
        // },
        // {
        //     vpath: 'tags-string.html.md',
        //     tags: '["Tag-string-1","Tag-string-2","Tag-string-3"]'
        // }
        //
        // In other words, the tags array arrives
        // as JSON which we must parse.

        const tags = new Set();
        for (const item of res) {
            if (!('tags' in item)) continue;
            let tagsP = [];
            if (typeof item.tags === 'string') {
                tagsP = JSON.parse(item.tags);
            } else if (Array.isArray(item.tags)) {
                tagsP = item.tags;
            }
            for (const tag of tagsP) {
                tags.add(tag);
            }
        }

        // The Set class made sure to weed out
        // duplicate tags.  With Array.from
        // we can make the set into an array
        // which can be sorted.
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
     * Perform descriptive search operations
     * with many options.
     *
     * @param options 
     * @returns 
     */
    async search(options) {

        const fcache = this;
        const vpathsSeen = new Set();

        const selector = {} as any;
        if (options.mime) {
            if (typeof options.mime === 'string') {
                selector.mime = {
                    eq: options.mime
                };
            } else if (Array.isArray(options.mime)) {
                selector.mime = {
                    in: options.mime
                };
            } /* else {
                throw new Error(`Incorrect MIME check ${options.mime}`);
            } */
        }
        if (
            typeof options.rendersToHTML === 'boolean'
        ) {
            selector.rendersToHTML = {
                eq: options.rendersToHTML
            };
        }

        const regexSQL = {
            or: []
        };
        if (
            typeof options.pathmatch === 'string'
        ) {
            regexSQL.or.push({
                sql: ` ( vpath regexp '${options.pathmatch}' ) `
            });
        } else if (
            options.pathmatch instanceof RegExp
        ) {
            regexSQL.or.push({
                sql: ` ( vpath regexp '${options.pathmatch.source}' ) `
            });
        } else if (Array.isArray(options.pathmatch)) {
            for (const match of options.pathmatch) {
                if (typeof match === 'string') {
                    regexSQL.or.push({
                        sql: ` ( vpath regexp '${match}' ) `
                    });
                } else if (match instanceof RegExp) {
                    regexSQL.or.push({
                        sql: ` ( vpath regexp '${match.source}' )`
                    });
                } else {
                    throw new Error(`search ERROR invalid pathmatch regexp ${util.inspect(match)}`);
                }
            }
        } else if ('pathmatch' in options) {
            // There's a pathmatch field, that
            // isn't correct
            throw new Error(`search ERROR invalid pathmatch ${util.inspect(options.pathmatch)}`);
        }

        if (options.layouts) {
            if (Array.isArray(options.layouts)) {
                for (const layout of options.layouts) {
                    regexSQL.or.push({
                        layout: { eq: layout }
                    });
                }
            } else {
                selector.layout = { eq: options.layouts };
            }
        }

        // Attempting to do the following:
        //
        // sqlite> select vpath, renderPath from DOCUMENTS where renderPath regexp '/index.html$';
        // hier-broke/dir1/dir2/index.html.md|hier-broke/dir1/dir2/index.html
        // hier/dir1/dir2/index.html.md|hier/dir1/dir2/index.html
        // hier/dir1/index.html.md|hier/dir1/index.html
        // hier/imgdir/index.html.md|hier/imgdir/index.html
        // hier/index.html.md|hier/index.html
        // subdir/index.html.md|subdir/index.html

        if (
            typeof options.renderpathmatch === 'string'
        ) {
            regexSQL.or.push({
                sql: ` renderPath regexp '${options.renderpathmatch}' `
            });
        } else if (
            options.renderpathmatch instanceof RegExp
        ) {
            regexSQL.or.push({
                sql: ` renderPath regexp '${options.renderpathmatch.source}' `
            });
        } else if (Array.isArray(options.renderpathmatch)) {
            for (const match of options.renderpathmatch) {
                if (typeof match === 'string') {
                    regexSQL.or.push({
                        sql: ` renderPath regexp '${match}' `
                    });
                } else if (match instanceof RegExp) {
                    regexSQL.or.push({
                        sql: ` renderPath regexp '${match.source}' `
                    });
                } else {
                    throw new Error(`search ERROR invalid renderpathmatch regexp ${util.inspect(match)}`);
                }
            }
        } else if ('renderpathmatch' in options) {
            throw new Error(`search ERROR invalid renderpathmatch ${util.inspect(options.pathmatch)}`);
        }
        if (regexSQL.or.length >= 1) {
            selector.or = regexSQL.or;
        }

        // console.log(selector)

        // Select based on things we can query
        // directly from  the Document object.
        const result1 = await this.dao.selectAll(selector);

        // If the search options include layout(s)
        // we check docMetadata.layout
        // NOW MOVED ABOVE
        const result2 = result1;

        // Check for match against tags
        const result3 = 
            (
                options.tag
                && typeof options.tag === 'string'
            ) ? result2.filter(item => {
                if (item.vpath
                 && item.docMetadata
                 && item.docMetadata.tags
                 && Array.isArray(item.docMetadata.tags)
                ) {
                    if (item.docMetadata.tags.includes(options.tag)) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            })
            : result2;

        const result4 =
            (
                options.rootPath
             && typeof options.rootPath === 'string'
            ) ? result3.filter(item => {
                if (item.vpath
                 && item.renderPath
                ) {
                    if (item.renderPath.startsWith(options.rootPath)) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            })
            : result3;

        const result5 =
            (
                options.glob
             && typeof options.glob === 'string'
            ) ? result4.filter(item => {
                if (item.vpath) {
                    return minimatch(item.vpath, options.glob);
                } else {
                    return false;
                }
            })
            : result4;

        const result6 =
            (
                options.renderglob
            && typeof options.renderglob === 'string'
            ) ? result5.filter(item => {
                if (item.renderPath) {
                    return minimatch(item.renderPath, options.renderglob);
                } else {
                    return false;
                }
            })
            : result5;

        const result7 =
            (
                options.renderers
             && Array.isArray(options.renderers)
            ) ? result6.filter(item => {

                let renderer = fcache.config.findRendererPath(item.vpath);
                // console.log(`renderer for ${obj.vpath} `, renderer);
                if (!renderer) return false;

                let found = false;
                for (const r of options.renderers) {
                    // console.log(`check renderer ${typeof r} ${renderer.name} ${renderer instanceof r}`);
                    if (typeof r === 'string'
                     && r === renderer.name) {
                        found = true;
                    } else if (typeof r === 'object'
                     || typeof r === 'function') {
                        console.error('WARNING: Matching renderer by object class is no longer supported', r);
                    }
                }
                return found;
            })
            : result6;

        const result8 =
            (options.filterfunc)
            ? result7.filter(item => {
                return options.filterfunc(
                    fcache.config,
                    options,
                    item
                );
            })
            : result7;

        
        let result9 = result8;
        if (
            typeof options.sortBy === 'string'
         && (
             options.sortBy === 'publicationDate'
          || options.sortBy === 'publicationTime'
         )
        ) {
            result9 = result8.sort((a, b) => {
                let aDate = a.metadata
                         && a.metadata.publicationDate
                    ? new Date(a.metadata.publicationDate)
                    : new Date(a.mtimeMs);
                let bDate = b.metadata 
                         && b.metadata.publicationDate
                    ? new Date(b.metadata.publicationDate)
                    : new Date(b.mtimeMs);
                if (aDate === bDate) return 0;
                if (aDate > bDate) return -1;
                if (aDate < bDate) return 1;
            });
        } else if (
            typeof options.sortBy === 'string'
         && options.sortBy === 'dirname'
        ) {
            result9 = result8.sort((a, b) => {
                if (a.dirname === b.dirname) return 0;
                if (a.dirname < b.dirname) return -1;
                if (a.dirname > b.dirname) return 1;
            });
        }

        let result9a = result9;
        if (typeof options.sortFunc === 'function') {
            result9a = result9.sort(options.sortFunc);
        }

        let result10 = result9a;
        if (
            typeof options.sortByDescending === 'boolean'
         || typeof options.reverse === 'boolean'
        ) {
            if (typeof options.sortByDescending === 'boolean'
             && options.sortByDescending
            ) {
                result10 = result9a.reverse();
            }
            if (typeof options.reverse === 'boolean'
             && options.reverse
            ) {
                result10 = result9a.reverse();
            }
        }

        let result11 = result10;
        if (typeof options.offset === 'number') {
            result11 = result10.slice(options.offset);
        }

        let result12 = result11;
        if (typeof options.limit === 'number') {
            result12 = result11.slice(
                0, options.limit - 1
            );
        }

        return result12;
    }

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

export var assetsCache;
export var partialsCache;
export var layoutsCache;
export var documentsCache;

export async function setup(
    config: Configuration
): Promise<void> {

    assetsCache = new BaseFileCache<Asset, TassetsDAO>(
        config,
        'assets',
        config.assetDirs,
        assetsDAO
    );
    await assetsCache.setup();

    assetsCache.on('error', (...args) => {
        console.error(`assetsCache ERROR ${util.inspect(args)}`)
    });

    partialsCache = new TemplatesFileCache<
            Partial, TpartialsDAO
    >(
        config,
        'partials',
        config.partialsDirs,
        partialsDAO
    );
    await partialsCache.setup();

    partialsCache.on('error', (...args) => {
        console.error(`partialsCache ERROR ${util.inspect(args)}`)
    });

    layoutsCache = new TemplatesFileCache<
            Layout, TlayoutsDAO
    >(
        config,
        'layouts',
        config.layoutDirs,
        layoutsDAO
    );
    await layoutsCache.setup();

    layoutsCache.on('error', (...args) => {
        console.error(`layoutsCache ERROR ${util.inspect(args)}`)
    });

    // console.log(`DocumentsFileCache 'documents' ${util.inspect(config.documentDirs)}`);

    documentsCache = new DocumentsFileCache(
        config,
        'documents',
        config.documentDirs
    );
    await documentsCache.setup();

    documentsCache.on('error', (...args) => {
        console.error(`documentsCache ERROR ${util.inspect(args)}`)
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
