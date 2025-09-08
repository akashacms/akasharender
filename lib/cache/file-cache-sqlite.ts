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

import { DirsWatcher, dirToWatch, VPathData } from '@akashacms/stacked-dirs';
import path from 'node:path';
import util from 'node:util';
import url  from 'node:url';
import { promises as fs } from 'fs';
import FS from 'fs';
import EventEmitter from 'events';
import micromatch from 'micromatch';

// import {
//     field,
//     FieldOpts,
//     fk,
//     id,
//     index,
//     table,
//     TableOpts,
//     SqlDatabase,
//     schema,
//     BaseDAO,
//     Filter,
//     Where
// } from 'sqlite3orm';

// import { sqdb } from '../sqdb.js';
// import { Configuration, dirToMount } from '../index.js';
// import fastq from 'fastq';
// import { TagGlue, TagDescriptions } from './tag-glue.js';

///////////// Assets table

// @table({
//     name: 'ASSETS',
//     withoutRowId: true,
// } as TableOpts)
// export class Asset {

//     // Primary key
//     @id({
//         name: 'vpath', dbtype: 'TEXT'
//     })
//     @index('asset_vpath')
//     vpath: string;

//     @field({
//         name: 'mime', dbtype: 'TEXT'
//     })
//     mime: string;

//     @field({
//         name: 'mounted', dbtype: 'TEXT'
//     })
//     @index('asset_mounted')
//     mounted: string;

//     @field({
//         name: 'mountPoint', dbtype: 'TEXT'
//     })
//     @index('asset_mountPoint')
//     mountPoint: string;

//     @field({
//         name: 'pathInMounted', dbtype: 'TEXT'
//     })
//     @index('asset_pathInMounted')
//     pathInMounted: string;

//     @field({
//         name: 'fspath', dbtype: 'TEXT'
//     })
//     @index('asset_fspath')
//     fspath: string;

//     @field({
//         name: 'renderPath', dbtype: 'TEXT'
//     })
//     @index('asset_renderPath')
//     renderPath: string;

//     @field({
//         name: 'dirname', dbtype: 'TEXT'
//     })
//     @index('asset_dirname')
//     dirname: string;

//     @field({
//         name: 'rendersToHTML', dbtype: 'INTEGER'
//     })
//     @index('assets_rendersToHTML')
//     rendersToHTML: boolean;

//     @field({
//         name: 'mtimeMs',
//         dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
//     })
//     @index('asset_mtimeMs')
//     mtimeMs: string;

//     @field({
//         name: 'docMetadata', dbtype: 'TEXT',
//         isJson: true
//     })
//     @index('asset_docMetadata')
//     docMetadata: any;

//     @field({
//         name: 'metadata', dbtype: 'TEXT',
//         isJson: true
//     })
//     @index('asset_metadata')
//     metadata: any;

//     @field({
//         name: 'info', dbtype: 'TEXT',
//         isJson: true
//     })
//     info: any;

// }

// await schema().createTable(sqdb, 'ASSETSZZZZZZZZ');
// type TassetsDAO = BaseDAO<Asset>;
// export const assetsDAO: TassetsDAO
    // = new BaseDAO<Asset>(Asset, sqdb);

// await assetsDAO.createIndex('asset_vpath');
// await assetsDAO.createIndex('asset_mounted');
// await assetsDAO.createIndex('asset_mountPoint');
// await assetsDAO.createIndex('asset_pathInMounted');
// await assetsDAO.createIndex('asset_fspath');
// await assetsDAO.createIndex('asset_renderPath');
// await assetsDAO.createIndex('assets_rendersToHTML');
// await assetsDAO.createIndex('asset_dirname');
// await assetsDAO.createIndex('asset_mtimeMs');
// await assetsDAO.createIndex('asset_docMetadata');
// await assetsDAO.createIndex('asset_metadata');

//////////// Partials Table

// @table({
//     name: 'PARTIALS',
//     withoutRowId: true,
// })
// export class Partial {

//     // Primary key
//     @id({
//         name: 'vpath', dbtype: 'TEXT'
//     })
//     @index('partial_vpath')
//     vpath: string;

//     @field({
//         name: 'mime', dbtype: 'TEXT'
//     })
//     mime: string;

//     @field({
//         name: 'mounted', dbtype: 'TEXT'
//     })
//     @index('partial_mounted')
//     mounted: string;

//     @field({
//         name: 'mountPoint', dbtype: 'TEXT'
//     })
//     @index('partial_mountPoint')
//     mountPoint: string;

//     @field({
//         name: 'pathInMounted', dbtype: 'TEXT'
//     })
//     @index('partial_pathInMounted')
//     pathInMounted: string;

//     @field({
//         name: 'fspath', dbtype: 'TEXT'
//     })
//     @index('partial_fspath')
//     fspath: string;

//     @field({
//         name: 'renderPath', dbtype: 'TEXT'
//     })
//     @index('partial_renderPath')
//     renderPath: string;

//     @field({
//         name: 'dirname', dbtype: 'TEXT'
//     })
//     @index('partial_dirname')
//     dirname: string;

//     @field({
//         name: 'rendersToHTML', dbtype: 'INTEGER'
//     })
//     @index('partial_rendersToHTML')
//     rendersToHTML: boolean;

//     @field({
//         name: 'mtimeMs',
//         dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
//     })
//     @index('partial_mtimeMs')
//     mtimeMs: string;

//     @field({
//         name: 'docMetadata', dbtype: 'TEXT', isJson: true
//     })
//     docMetadata: any;

//     @field({
//         name: 'docContent', dbtype: 'TEXT'
//     })
//     docContent: any;

//     @field({
//         name: 'docBody', dbtype: 'TEXT'
//     })
//     docBody: any;

//     @field({
//         name: 'metadata', dbtype: 'TEXT',
//         isJson: true
//     })
//     metadata: any;

//     @field({
//         name: 'info', dbtype: 'TEXT', isJson: true
//     })
//     info: any;
// }

// await schema().createTable(sqdb, 'PARTIALSZZZZZZZ');
// type TpartialsDAO = BaseDAO<Partial>;
// export const partialsDAO
    // = new BaseDAO<Partial>(Partial, sqdb);

// await partialsDAO.createIndex('partial_vpath');
// await partialsDAO.createIndex('partial_mounted');
// await partialsDAO.createIndex('partial_mountPoint');
// await partialsDAO.createIndex('partial_pathInMounted');
// await partialsDAO.createIndex('partial_fspath');
// await partialsDAO.createIndex('partial_renderPath');
// await partialsDAO.createIndex('partial_dirname');
// await partialsDAO.createIndex('partial_rendersToHTML');
// await partialsDAO.createIndex('partial_mtimeMs');

///////////////// Layouts Table

// @table({
//     name: 'LAYOUTS',
//     withoutRowId: true,
// })
// export class Layout {

//     // Primary key
//     @id({
//         name: 'vpath', dbtype: 'TEXT'
//     })
//     @index('layout_vpath')
//     vpath: string;

//     @field({
//         name: 'mime', dbtype: 'TEXT'
//     })
//     mime: string;

//     @field({
//         name: 'mounted', dbtype: 'TEXT'
//     })
//     @index('layout_mounted')
//     mounted: string;

//     @field({
//         name: 'mountPoint', dbtype: 'TEXT'
//     })
//     @index('layout_mountPoint')
//     mountPoint: string;

//     @field({
//         name: 'pathInMounted', dbtype: 'TEXT'
//     })
//     @index('layout_pathInMounted')
//     pathInMounted: string;

//     @field({
//         name: 'fspath', dbtype: 'TEXT'
//     })
//     @index('layout_fspath')
//     fspath: string;

//     @field({
//         name: 'renderPath', dbtype: 'TEXT'
//     })
//     @index('layout_renderPath')
//     renderPath: string;

//     @field({
//         name: 'dirname', dbtype: 'TEXT'
//     })
//     @index('layout_dirname')
//     dirname: string;

//     @field({
//         name: 'rendersToHTML', dbtype: 'INTEGER'
//     })
//     @index('layout_rendersToHTML')
//     rendersToHTML: boolean;

//     @field({
//         name: 'mtimeMs',
//         dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
//     })
//     @index('layout_mtimeMs')
//     mtimeMs: string;

//     @field({
//         name: 'docMetadata', dbtype: 'TEXT', isJson: true
//     })
//     docMetadata: any;

//     @field({
//         name: 'docContent', dbtype: 'TEXT'
//     })
//     docContent: any;

//     @field({
//         name: 'docBody', dbtype: 'TEXT'
//     })
//     docBody: any;

//     @field({
//         name: 'metadata', dbtype: 'TEXT', isJson: true
//     })
//     metadata: any;

//     @field({
//         name: 'info', dbtype: 'TEXT', isJson: true
//     })
//     info: any;

// }

// await schema().createTable(sqdb, 'LAYOUTSZZZZZZZZZZ');
// type TlayoutsDAO = BaseDAO<Layout>;
// export const layoutsDAO
//     = new BaseDAO<Layout>(Layout, sqdb);

// await layoutsDAO.createIndex('layout_vpath');
// await layoutsDAO.createIndex('layout_mounted');
// await layoutsDAO.createIndex('layout_mountPoint');
// await layoutsDAO.createIndex('layout_pathInMounted');
// await layoutsDAO.createIndex('layout_fspath');
// await layoutsDAO.createIndex('layout_renderPath');
// await layoutsDAO.createIndex('layout_rendersToHTML');
// await layoutsDAO.createIndex('layout_dirname');
// await layoutsDAO.createIndex('layout_mtimeMs');

/////////////// Documents Table

// @table({
//     name: 'DOCUMENTS',
//     withoutRowId: true,
// })
// export class Document {

//     // Primary key
//     @id({
//         name: 'vpath', dbtype: 'TEXT'
//     })
//     @index('docs_vpath')
//     vpath: string;

//     @field({
//         name: 'mime', dbtype: 'TEXT'
//     })
//     mime?: string;

//     @field({
//         name: 'mounted', dbtype: 'TEXT'
//     })
//     @index('docs_mounted')
//     mounted: string;

//     @field({
//         name: 'mountPoint', dbtype: 'TEXT'
//     })
//     @index('docs_mountPoint')
//     mountPoint: string;

//     @field({
//         name: 'pathInMounted', dbtype: 'TEXT'
//     })
//     @index('docs_pathInMounted')
//     pathInMounted: string;

//     @field({
//         name: 'fspath', dbtype: 'TEXT'
//     })
//     @index('docs_fspath')
//     fspath: string;

//     @field({
//         name: 'renderPath', dbtype: 'TEXT'
//     })
//     @index('docs_renderPath')
//     renderPath: string;

//     @field({
//         name: 'rendersToHTML', dbtype: 'INTEGER'
//     })
//     @index('docs_rendersToHTML')
//     rendersToHTML: boolean;

//     @field({
//         name: 'dirname', dbtype: 'TEXT'
//     })
//     @index('docs_dirname')
//     dirname: string;

//     @field({
//         name: 'parentDir', dbtype: 'TEXT'
//     })
//     @index('docs_parentDir')
//     parentDir: string;

//     @field({
//         name: 'mtimeMs',
//         dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
//     })
//     @index('docs_mtimeMs')
//     mtimeMs: string;

//     @field({
//         name: 'publicationTime',
//         dbtype: `INTEGER GENERATED ALWAYS AS (json_extract(info, '$.publicationTime')) STORED`
//     })
//     @index('docs_publicationTime')
//     publicationTime: number;

//     @field({
//         name: 'baseMetadata',
//         dbtype: `TEXT GENERATED ALWAYS AS (json_extract(info, '$.baseMetadata')) STORED`,
//         isJson: true
//     })
//     baseMetadata?: any;

//     @field({
//         name: 'docMetadata', dbtype: 'TEXT',
//         isJson: true
//     })
//     docMetadata?: any;

//     @field({
//         name: 'docContent', dbtype: 'TEXT'
//     })
//     docContent?: string;

//     @field({
//         name: 'docBody', dbtype: 'TEXT'
//     })
//     docBody?: string;

//     //  GENERATED ALWAYS AS (json_extract(info, '$.metadata')) STORED
//     // @field({
//     //     name: 'metadata',
//     //     dbtype: `TEXT`,
//     //     isJson: true
//     // })
//     // metadata?: any;

//     @field({
//         name: 'metadata',
//         dbtype: `TEXT GENERATED ALWAYS AS (json_extract(info, '$.metadata')) STORED`,
//         isJson: true
//     })
//     metadata?: any;

//     @field({
//         name: 'tags',
//         dbtype: `TEXT GENERATED ALWAYS AS (json_extract(info, '$.metadata.tags')) STORED`,
//         isJson: true
//     })
//     @index('docs_tags')
//     tags?: any;

//     @field({
//         name: 'layout',
//         dbtype: `TEXT GENERATED ALWAYS AS (json_extract(metadata, '$.layout')) STORED`
//     })
//     @index('docs_layout')
//     layout?: string;

//     @field({
//         name: 'blogtag',
//         dbtype: `TEXT GENERATED ALWAYS AS (json_extract(metadata, '$.blogtag')) STORED`
//     })
//     @index('docs_blogtag')
//     blogtag?: string;

//     @field({
//         name: 'info', dbtype: 'TEXT', isJson: true
//     })
//     info: any;

// }

// await schema().createTable(sqdb, 'DOCUMENTSZZZZZZZZZ');
// type TdocumentssDAO = BaseDAO<Document>;
// export const documentsDAO
//     = new BaseDAO<Document>(Document, sqdb);

// await documentsDAO.createIndex('docs_vpath');
// await documentsDAO.createIndex('docs_mounted');
// await documentsDAO.createIndex('docs_mountPoint');
// await documentsDAO.createIndex('docs_pathInMounted');
// await documentsDAO.createIndex('docs_fspath');
// await documentsDAO.createIndex('docs_renderPath');
// await documentsDAO.createIndex('docs_rendersToHTML');
// await documentsDAO.createIndex('docs_dirname');
// await documentsDAO.createIndex('docs_parentDir');
// await documentsDAO.createIndex('docs_mtimeMs');
// await documentsDAO.createIndex('docs_publicationTime');
// await documentsDAO.createIndex('docs_tags');
// await documentsDAO.createIndex('docs_layout');
// await documentsDAO.createIndex('docs_blogtag');

// await documentsDAO.sqldb.run(`
//     CREATE INDEX IF NOT EXISTS 
//     idx_docs_metadata_json ON 
//     DOCUMENTS(json_extract(metadata, '$.publicationDate'));
// `);
// await documentsDAO.sqldb.run(`
//     CREATE INDEX IF NOT EXISTS 
//     idx_docs_render_path_pattern ON DOCUMENTS(renderPath);
// `);

// const tglue = new TagGlue();
// tglue.init(sqdb._db);

// const tdesc = new TagDescriptions();
// tdesc.init(sqdb._db);

// Convert AkashaCMS mount points into the mountpoint
// used by DirsWatcher
// const remapdirs = (dirz: dirToMount[]): dirToWatch[] => {
//     return dirz.map(dir => {
//         // console.log('document dir ', dir);
//         if (typeof dir === 'string') {
//             return {
//                 mounted: dir,
//                 mountPoint: '/',
//                 baseMetadata: {}
//             };
//         } else {
//             if (!dir.dest) {
//                 throw new Error(`remapdirs invalid mount specification ${util.inspect(dir)}`);
//             }
//             return {
//                 mounted: dir.src,
//                 mountPoint: dir.dest,
//                 baseMetadata: dir.baseMetadata,
//                 ignore: dir.ignore
//             };
//         }
//     });
// };

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
        T, // extends Asset | Layout | Partial | Document,
        Tdao // extends BaseDAO<T>
> extends EventEmitter {

    // #config?: Configuration;
    #name?: string;
    // #dirs?: dirToMount[];
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
        // config: Configuration,
        name: string,
        // dirs: dirToMount[],
        dao: Tdao // BaseDAO<T>
    ) {
        super();
        // console.log(`BaseFileCache ${name} constructor dirs=${util.inspect(dirs)}`);
        // this.#config = config;
        this.#name = name;
        // this.#dirs = dirs;
        this.#is_ready = false;
        this.#cache_content = false;
        this.#map_renderpath = false;
        this.#dao = dao;
    }

    // get config()     { return this.#config; }
    get name()       { return this.#name; }
    // get dirs()       { return this.#dirs; }
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

        // await sqdb.close();
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

        // const mapped = remapdirs(this.dirs);
        // console.log(`setup ${this.#name} watch ${util.inspect(this.#dirs)} ==> ${util.inspect(mapped)}`);
        // await this.#watcher.watch(mapped);

        // console.log(`DAO ${this.dao.table.name} ${util.inspect(this.dao.table.fields)}`);

    }

    gatherInfoData(info: T) {
        // Placeholder which some subclasses
        // are expected to override

        // info.renderPath = info.vpath;
    }

    protected cvtRowToObj(obj: any) {
        throw new Error(`BaseFileCache.cvtRowToObj must be overridden`);
    }

    protected cvtRowToObjBASE(obj: any, dest: any): void {

        if (typeof obj !== 'object') {
            throw new Error(`BaseFileCache.cvtRowToObjBASE must receive an object, got ${util.inspect(obj)}`);
        }
        if (typeof obj.vpath !== 'undefined') {
            if (typeof obj.vpath !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a vpath, got ${util.inspect(obj)}`);
            } else {
                dest.vpath = obj.vpath;
            }
        }
        if (typeof obj.mime !== 'undefined'
         && obj.mime !== null
        ) {
            if (typeof obj.mime !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a mime, got ${util.inspect(obj)}`);
            } else {
                dest.mime = obj.mime;
            }
        }
        if (typeof obj.mounted !== 'undefined') {
            if (typeof obj.mounted !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a mounted, got ${util.inspect(obj)}`);
            } else {
                dest.mounted = obj.mounted;
            }
        }
        if (typeof obj.mountPoint !== 'undefined') {
            if (typeof obj.mountPoint !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a mountPoint, got ${util.inspect(obj)}`);
            } else {
                dest.mountPoint = obj.mountPoint;
            }
        }
        if (typeof obj.pathInMounted !== 'undefined') {
            if (typeof obj.pathInMounted !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a pathInMounted, got ${util.inspect(obj)}`);
            } else {
                dest.pathInMounted = obj.pathInMounted;
            }
        }
        if (typeof obj.fspath !== 'undefined') {
            if (typeof obj.fspath !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a fspath, got ${util.inspect(obj)}`);
            } else {
                dest.fspath = obj.fspath;
            }
        }
        if (typeof obj.renderPath !== 'undefined') {
            if (typeof obj.renderPath !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a renderPath, got ${util.inspect(obj)}`);
            } else {
                dest.renderPath = obj.renderPath;
            }
        }
        if (typeof obj.dirname !== 'undefined') {
            if (typeof obj.dirname !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a dirname, got ${util.inspect(obj)}`);
            } else {
                dest.dirname = obj.dirname;
            }
        }
        if (typeof obj.rendersToHTML !== 'undefined'
         || obj.rendersToHTML === null
        ) {
            if (typeof obj.rendersToHTML === 'number') {
                if (obj.rendersToHTML === 0) {
                    // if (obj.renderPath.match(/.*\.html$/)) {
                    //     console.log(`${obj.renderPath} === 0 === FALSE`);
                    // }
                    dest.rendersToHTML = false;
                } else if (obj.rendersToHTML === 1) {
                    // if (obj.renderPath.match(/.*\.html$/)) {
                    //     console.log(`${obj.renderPath} === 1 === TRUE`);
                    // }
                    dest.rendersToHTML = true;
                } else {
                    throw new Error(`BaseFileCache.cvtRowToObjBASE rendersToHTML incorrect value, got ${util.inspect(obj)}`);
                }
            } else if (obj.rendersToHTML === null) {
                dest.rendersToHTML = false;
            } else {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a INTEGER rendersToHTML, got ${util.inspect(obj)}`);
            }
        } else {

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
            } else {
                dest.mtimeMs = obj.mtimeMs;
            }
        }
        if (typeof obj.docMetadata !== 'undefined') {
            if (obj.docMetadata === null) {
                dest.docMetadata = {};
            } else if (typeof obj.docMetadata !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a docMetadata, got ${util.inspect(obj)}`);
            } else {
                dest.docMetadata = JSON.parse(obj.docMetadata);
            }
        } else {
            dest.docMetadata = {};
        }
        if (typeof obj.metadata !== 'undefined') {
            if (obj.metadata === null) {
                dest.metadata = {};
            } else if (typeof obj.metadata !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a metadata, got ${util.inspect(obj)}`);
            } else {
                dest.metadata = JSON.parse(obj.metadata);
            }
        } else {
            dest.metadata = {};
        }
        if (typeof obj.info !== 'undefined') {
            if (obj.info === null) {
                dest.info = {};
            } else if (typeof obj.info !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a info, got ${util.inspect(obj)}`);
            } else {
                dest.info = JSON.parse(obj.info);
            }
        } else {
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
    protected async findPathMounted(vpath: string, mounted: string) {
        
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
    protected async findByPath(vpath: string) {

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
        // await this.config.hookFileChanged(name, info);
    }

    protected async updateDocInDB(info) {
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

    protected async insertDocToDB(info) {
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
    async paths(rootPath?: string)
        // : Promise<Array<PathsReturnType>>
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
    async find(_fpath) /*: Promise<T> */ {

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

    // TODO Is this function used anywhere?
    // async findAll() {

    //     const fcache = this;

    //     // const result1 = await this.dao.selectAll({
    //     // } as Filter<T>);

    //     const result1 = await this.dao.sqldb.all(`
    //         SELECT * FROM ${this.dao.table.quotedName}
    //     `, {});

    //     const result2 = result1.filter(item => {
    //         // console.log(`findAll ?ignore? ${item.vpath}`);
    //         return !(fcache.ignoreFile(item));
    //     });
    //     const result3 = result2.map(item => {
    //         return this.cvtRowToObj(item);
    //     })
    //     return result3;
    // }
}

export class AssetsFileCache<
    T, // extends Asset,
    Tdao // extends BaseDAO<T>
> extends BaseFileCache<T, Tdao> {
    constructor(
        // config: Configuration,
        name: string,
        // dirs: dirToMount[],
        dao: Tdao
    ) {
        super(name, dao);
    }

    // protected cvtRowToObj(obj: any): Asset {
    //     const ret: Asset = new Asset();
    //     this.cvtRowToObjBASE(obj, ret);
    //     return ret;
    // }

}

export class TemplatesFileCache<
    T, // extends Layout | Partial,
    Tdao // extends BaseDAO<T>>
    extends BaseFileCache<T, Tdao>> {

    constructor(
        // config: Configuration,
        name: string,
        // dirs: dirToMount[],
        dao: Tdao,
        type: "layout" | "partial"
    ) {
        // super(config, name, dirs, dao);
        this.#type = type;
    }

    // Because this class serves two purposes, Layout
    // and Partials, this flag helps to distinguish.
    // Any place, like cvtRowToObj, which needs to know
    // which is which can use these getters to do
    // the right thing.

    #type: "layout" | "partial";
    get isLayout() { return this.#type === "layout"; }
    get isPartial() { return this.#type === "partial"; }

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
        if (info.dirname === '.') info.dirname = '/';

        let renderer = undefined; // this.config.findRendererPath(info.vpath);
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

    protected async insertDocToDB(info: any) {
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

export class DocumentsFileCache
    /* extends BaseFileCache<Document , TdocumentssDAO > */ {

    // constructor(
    //     config: Configuration,
    //     name: string,
    //     dirs: dirToMount[]
    // ) {
    //     super(config, name, dirs, documentsDAO);
    // }

    protected cvtRowToObj(obj: any): Document {
        const ret: Document = new Document();
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
         && obj.publicationTime !== null
        ) {
            if (typeof obj.publicationTime !== 'number') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a publicationTime, got ${util.inspect(obj)}`);
            } else {
                // ret.publicationTime = obj.publicationTime;
            }
        }
        if (typeof obj.docContent !== 'undefined'
         && obj.docContent !== null
        ) {
            if (typeof obj.docContent !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a docContent, got ${util.inspect(obj)}`);
            } else {
                // ret.docContent = obj.docContent;
            }
        }
        if (typeof obj.docBody !== 'undefined'
         && obj.docBody !== null
        ) {
            if (typeof obj.docBody !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a docBody, got ${util.inspect(obj)}`);
            } else {
                // ret.docBody = obj.docBody;
            }
        }
        if (typeof obj.layout !== 'undefined'
         && obj.layout !== null
        ) {
            if (typeof obj.layout !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a layout, got ${util.inspect(obj)}`);
            } else {
                // ret.layout = obj.layout;
            }
        }
        if (typeof obj.blogtag !== 'undefined'
         && obj.blogtag !== null
        ) {
            if (typeof obj.blogtag !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a blogtag, got ${util.inspect(obj)}`);
            } else {
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
        if (info.dirname === '.') info.dirname = '/';
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

        if (/*renderer*/ false) {

            // info.renderPath
            //     = renderer.filePath(info.vpath);

            // This was in the LokiJS code, but
            // was not in use.
            // info.rendername = path.basename(
            //     info.renderPath
            // );

            info.rendersToHTML =
                micromatch.isMatch(
                    info.renderPath,
                    '**/*.html')
             || micromatch.isMatch(
                    info.renderPath,
                    '*.html')
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

    protected async deleteDocTagGlue(vpath) {
        try {
            // await tglue.deleteTagGlue(vpath);
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
        // await tglue.addTagGlue(vpath, 
        //     Array.isArray(tags)
        //     ? tags
        //     : [ tags ]);
    }

    async addTagDescription(tag: string, description: string) {
        // return tdesc.addDesc(tag, description);
    }

    async getTagDescription(tag: string)
        // : Promise<string | undefined>
    {
        // return tdesc.getDesc(tag);
    }

    protected async updateDocInDB(info) {
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

    protected async insertDocToDB(info: any) {
        if (typeof info.rendersToHTML === 'undefined'
         || info.rendersToHTML === null
        ) {
            info.rendersToHTML = false;
        }
        if (!info.baseMetadata) info.baseMetadata = {};
        if (!info.docMetadata) info.docMetadata = {};
        if (!info.docContent) info.docContent = '';
        if (!info.docBody) info.docBody = '';
        if (!info.metadata) info.metadata = {};
        if (!Array.isArray(info.metadata?.tags)) info.metadata.tags = [];
        if (!info.metadata.layout) info.metadata.layout = '';
        if (!info.metadata.blogtag) info.metadata.blogtag = '';
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
        await this.addDocTagGlue(
            info.vpath, info.metadata.tags
        );
    }

    async handleUnlinked(name: any, info: any): Promise<void> {
        // await super.handleUnlinked(name, info);
        // tglue.deleteTagGlue(info.vpath);
    }

    async indexChain(_fpath) {

        const fpath = _fpath.startsWith('/')
                    ? _fpath.substring(1) 
                    : _fpath;
        const parsed = path.parse(fpath);

        // console.log(`indexChain ${_fpath} ${fpath}`, parsed);

        const filez: Document[] = [];
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
            } else {
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
    async childItemTree(_rootItem: string) {

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

    async documentsWithTag(tagnm: string | string[])
        // : Promise<Array<string>>
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
    async docLinkData(vpath: string) /*: Promise<{

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
    }> */ {

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
        const cached = this.searchCache.get(cacheKey);

        // console.log(`search ${util.inspect(options)} ==> ${cacheKey} ${cached ? 'hasCached' : 'noCached'}`);

        // If the cache has an entry, skip computing
        // anything.
        if (cached
         && Date.now() - cached.timestamp < 60000
        ) { // 1 minute cache
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
             && Array.isArray(options.renderers)
            ) {
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
        let sql = `SELECT DISTINCT d.* FROM $ {this.dao.table.quotedName} d`;

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

// export var assetsCache: AssetsFileCache< Asset, typeof assetsDAO>;
// export var partialsCache: TemplatesFileCache<Partial, typeof partialsDAO>;
// export var layoutsCache: TemplatesFileCache<Layout, typeof layoutsDAO>;
// export var documentsCache: DocumentsFileCache;

export async function setup(
    // config: Configuration
): Promise<void> {

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
