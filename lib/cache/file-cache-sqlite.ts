
import { DirsWatcher, dirToWatch } from '@akashacms/stacked-dirs';
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
const assetsDAO: TassetsDAO
    = new BaseDAO<Asset>(Asset, sqdb);



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
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    })
    mtimeMs: string;

    @field({
        name: 'info', dbtype: 'TEXT', isJson: true
    })
    info: any;
}

await schema().createTable(sqdb, 'PARTIALS');
const partialsDAO = new BaseDAO<Partial>(Partial, sqdb);

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
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    })
    mtimeMs: string;

    @field({
        name: 'info', dbtype: 'TEXT', isJson: true
    })
    info: any;

}

await schema().createTable(sqdb, 'LAYOUTS');
const layoutsDAO = new BaseDAO<Layout>(Layout, sqdb);

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
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    })
    mtimeMs: string;

    @field({
        name: 'info', dbtype: 'TEXT', isJson: true
    })
    info: any;

}

await schema().createTable(sqdb, 'DOCUMENTS');
const documentsDAO = new BaseDAO<Document>(Document, sqdb);

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


class BaseFileCache<T extends object> extends EventEmitter {

    #config?: Configuration;
    #name?: string;
    #dirs?: dirToWatch[];
    #is_ready: boolean = false;
    #cache_content: boolean;
    #map_renderpath: boolean;
    #dao: BaseDAO<T>;


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
        dao: BaseDAO<T>
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
    get dao(): BaseDAO<T> { return this.#dao; }

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

        await this.#watcher.watch(remapdirs(this.dirs));

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

        info.stack = undefined;

        assetsDAO.selectAll({
            vpath: { eq: info.vpath }
        });

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
        await this.#dao.update({
            vpath: info.vpath,
            mime: info.mime,
            mounted: info.mounted,
            mountPoint: info.mountPoint,
            pathInMounted: info.pathInMounted,
            info,
            mtimeMs: new Date(info.statsMtime).toISOString()
        } as T);

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

        info.stack = undefined;

        await this.#dao.insert({
            vpath: info.vpath,
            mime: info.mime,
            mounted: info.mounted,
            mountPoint: info.mountPoint,
            pathInMounted: info.pathInMounted,
            info,
            mtimeMs: new Date(info.statsMtime).toISOString()
        } as T);

        await this.config.hookFileAdded(name, info);
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
            return ignore;
        } else {
            // no mount?  that means something strange
            // console.error(`No dirMount found for ${info.vpath} / ${info.dirMountedOn}`);
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

    async paths() {
        const fcache = this;

        // This is copied from the older version
        // (LokiJS version) of this function.  It
        // seems meant to eliminate duplicates.
        const vpathsSeen = new Set();

        const result = await this.#dao.selectAll({});
        const result2 = result.filter(item => {
            if (fcache.ignoreFile(item)) {
                return false;
            }
            if (vpathsSeen.has((item as any).vpath)) {
                return false;
            } else {
                vpathsSeen.add((item as any).vpath);
                return true;
            }
        });
        const result3 = result2.sort((a, b) => {
            // We need these to be one of the concrete
            // types so that the mtimeMs field is
            // recognized by TypeScript.  The Asset
            // class is a good substitute for the base
            // class of cached files.
            const aa = <Asset>a;
            const bb = <Asset>b;
            if (aa.mtimeMs < bb.mtimeMs) return 1;
            if (aa.mtimeMs === bb.mtimeMs) return 0;
            if (aa.mtimeMs > bb.mtimeMs) return -1;
        });

        // The old version of this function had a
        // stage in which the values were map'd into
        // an undocumented object.
        return result3;
    }

    async find(_fpath) {

        const fpath = _fpath.startsWith('/')
                    ? _fpath.substring(1)
                    : _fpath;

        const fcache = this;

        const result1 = await this.#dao.selectAll({
            or: [
                { vpath: { eq: fpath }},
                { renderPath: { eq: fpath }}
            ]
        } as Filter<T>);

        const result2 = result1.filter(item => {
            if (fcache.ignoreFile(item)) {
                return false;
            }
        });

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
}

export var assetsCache;
export var partialsCache;
export var layoutsCache;
export var documentsCache;

export async function setup(
    config: Configuration
): Promise<void> {

    assetsCache = new BaseFileCache<Asset>(
        config,
        'assets',
        config.assetDirs,
        assetsDAO
    );
    await assetsCache.setup();

    partialsCache = new BaseFileCache<Partial>(
        config,
        'partials',
        config.partialsDirs,
        partialsDAO
    );
    await partialsCache.setup();

    layoutsCache = new BaseFileCache<Asset>(
        config,
        'layouts',
        config.layoutDirs,
        layoutsDAO
    );
    await layoutsCache.setup();

    // TODO documentsCache
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
