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
var _BaseFileCache_instances, _BaseFileCache_config, _BaseFileCache_name, _BaseFileCache_dirs, _BaseFileCache_is_ready, _BaseFileCache_cache_content, _BaseFileCache_map_renderpath, _BaseFileCache_dao, _BaseFileCache_watcher, _BaseFileCache_queue, _BaseFileCache_fExistsInDir, _TemplatesFileCache_type;
import { DirsWatcher } from '@akashacms/stacked-dirs';
import path from 'node:path';
import util from 'node:util';
import FS from 'fs';
import EventEmitter from 'events';
import micromatch from 'micromatch';
import { index } from 'sqlite3orm';
import { sqdb } from '../sqdb.js';
import fastq from 'fastq';
import { TagGlue, TagDescriptions } from './tag-glue.js';
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
export class BaseFileCache extends EventEmitter {
    /**
     * @param config AkashaRender Configuration object
     * @param dirs array of directories and mount points to watch
     * @param name string giving the name for this watcher name
     * @param dao The SQLITE3ORM DAO instance to use
     */
    constructor(config, name, dirs, dao // BaseDAO<T>
    ) {
        super();
        _BaseFileCache_instances.add(this);
        _BaseFileCache_config.set(this, void 0);
        _BaseFileCache_name.set(this, void 0);
        _BaseFileCache_dirs.set(this, void 0);
        _BaseFileCache_is_ready.set(this, false);
        _BaseFileCache_cache_content.set(this, void 0);
        _BaseFileCache_map_renderpath.set(this, void 0);
        _BaseFileCache_dao.set(this, void 0); // BaseDAO<T>;
        // SKIP: getDynamicView
        _BaseFileCache_watcher.set(this, void 0);
        _BaseFileCache_queue.set(this, void 0);
        // console.log(`BaseFileCache ${name} constructor dirs=${util.inspect(dirs)}`);
        __classPrivateFieldSet(this, _BaseFileCache_config, config, "f");
        __classPrivateFieldSet(this, _BaseFileCache_name, name, "f");
        __classPrivateFieldSet(this, _BaseFileCache_dirs, dirs, "f");
        __classPrivateFieldSet(this, _BaseFileCache_is_ready, false, "f");
        __classPrivateFieldSet(this, _BaseFileCache_cache_content, false, "f");
        __classPrivateFieldSet(this, _BaseFileCache_map_renderpath, false, "f");
        __classPrivateFieldSet(this, _BaseFileCache_dao, dao, "f");
    }
    get config() { return __classPrivateFieldGet(this, _BaseFileCache_config, "f"); }
    get name() { return __classPrivateFieldGet(this, _BaseFileCache_name, "f"); }
    get dirs() { return __classPrivateFieldGet(this, _BaseFileCache_dirs, "f"); }
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
        await sqdb.close();
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
        __classPrivateFieldSet(this, _BaseFileCache_queue, fastq.promise(async function (event) {
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
                // await fcache.handleReady(event.name);
                fcache.emit('ready', event.name);
            }
        }, 10), "f");
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
        const mapped = remapdirs(this.dirs);
        // console.log(`setup ${this.#name} watch ${util.inspect(this.#dirs)} ==> ${util.inspect(mapped)}`);
        await __classPrivateFieldGet(this, _BaseFileCache_watcher, "f").watch(mapped);
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
        await this.config.hookFileChanged(name, info);
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
        await this.config.hookFileAdded(name, info);
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
        await this.config.hookFileUnlinked(name, info);
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
     * Allow a caller to wait until the <em>ready</em> event has
     * been sent from the DirsWatcher instance.  This event means the
     * initial indexing has happened.
     */
    async isReady() {
        // If there's no directories, there won't be any files 
        // to load, and no need to wait
        while (__classPrivateFieldGet(this, _BaseFileCache_dirs, "f").length > 0 && !__classPrivateFieldGet(this, _BaseFileCache_is_ready, "f")) {
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
        const mapped = remapdirs(this.dirs);
        // console.log(`findSync looking for ${fpath} in ${util.inspect(mapped)}`);
        for (const dir of mapped) {
            if (!(dir?.mountPoint)) {
                console.warn(`findSync bad dirs in ${util.inspect(this.dirs)}`);
            }
            const found = __classPrivateFieldGet(this, _BaseFileCache_instances, "m", _BaseFileCache_fExistsInDir).call(this, fpath, dir);
            if (found) {
                // console.log(`findSync ${fpath} found`, found);
                return found;
            }
        }
        return undefined;
    }
}
_BaseFileCache_config = new WeakMap(), _BaseFileCache_name = new WeakMap(), _BaseFileCache_dirs = new WeakMap(), _BaseFileCache_is_ready = new WeakMap(), _BaseFileCache_cache_content = new WeakMap(), _BaseFileCache_map_renderpath = new WeakMap(), _BaseFileCache_dao = new WeakMap(), _BaseFileCache_watcher = new WeakMap(), _BaseFileCache_queue = new WeakMap(), _BaseFileCache_instances = new WeakSet(), _BaseFileCache_fExistsInDir = function _BaseFileCache_fExistsInDir(fpath, dir) {
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
    constructor(config, name, dirs, dao) {
        super(config, name, dirs, dao);
    }
}
export class TemplatesFileCache {
    constructor(config, name, dirs, dao, type) {
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
        tglue.deleteTagGlue(info.vpath);
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
            if (Array.isArray(index) && index.length >= 1) {
                filez.push(index[0]);
            }
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
export async function setup(config) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1jYWNoZS1zcWxpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvZmlsZS1jYWNoZS1zcWxpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxFQUFFLFdBQVcsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUM3RSxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRzdCLE9BQU8sRUFBRSxNQUFNLElBQUksQ0FBQztBQUNwQixPQUFPLFlBQVksTUFBTSxRQUFRLENBQUM7QUFDbEMsT0FBTyxVQUFVLE1BQU0sWUFBWSxDQUFDO0FBRXBDLE9BQU8sRUFLSCxLQUFLLEVBUVIsTUFBTSxZQUFZLENBQUM7QUFFcEIsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFlBQVksQ0FBQztBQUVsQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFekQsMEJBQTBCO0FBRTFCLFdBQVc7QUFDWCxzQkFBc0I7QUFDdEIsMEJBQTBCO0FBQzFCLGtCQUFrQjtBQUNsQix1QkFBdUI7QUFFdkIscUJBQXFCO0FBQ3JCLFlBQVk7QUFDWix3Q0FBd0M7QUFDeEMsU0FBUztBQUNULDRCQUE0QjtBQUM1QixxQkFBcUI7QUFFckIsZUFBZTtBQUNmLHVDQUF1QztBQUN2QyxTQUFTO0FBQ1Qsb0JBQW9CO0FBRXBCLGVBQWU7QUFDZiwwQ0FBMEM7QUFDMUMsU0FBUztBQUNULDhCQUE4QjtBQUM5Qix1QkFBdUI7QUFFdkIsZUFBZTtBQUNmLDZDQUE2QztBQUM3QyxTQUFTO0FBQ1QsaUNBQWlDO0FBQ2pDLDBCQUEwQjtBQUUxQixlQUFlO0FBQ2YsZ0RBQWdEO0FBQ2hELFNBQVM7QUFDVCxvQ0FBb0M7QUFDcEMsNkJB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c0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IERpcnNXYXRjaGVyLCBkaXJUb1dhdGNoLCBWUGF0aERhdGEgfSBmcm9tICdAYWthc2hhY21zL3N0YWNrZWQtZGlycyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCB1cmwgIGZyb20gJ25vZGU6dXJsJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzIH0gZnJvbSAnZnMnO1xuaW1wb3J0IEZTIGZyb20gJ2ZzJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCBtaWNyb21hdGNoIGZyb20gJ21pY3JvbWF0Y2gnO1xuXG5pbXBvcnQge1xuICAgIGZpZWxkLFxuICAgIEZpZWxkT3B0cyxcbiAgICBmayxcbiAgICBpZCxcbiAgICBpbmRleCxcbiAgICB0YWJsZSxcbiAgICBUYWJsZU9wdHMsXG4gICAgU3FsRGF0YWJhc2UsXG4gICAgc2NoZW1hLFxuICAgIEJhc2VEQU8sXG4gICAgRmlsdGVyLFxuICAgIFdoZXJlXG59IGZyb20gJ3NxbGl0ZTNvcm0nO1xuXG5pbXBvcnQgeyBzcWRiIH0gZnJvbSAnLi4vc3FkYi5qcyc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uLCBkaXJUb01vdW50IH0gZnJvbSAnLi4vaW5kZXguanMnO1xuaW1wb3J0IGZhc3RxIGZyb20gJ2Zhc3RxJztcbmltcG9ydCB7IFRhZ0dsdWUsIFRhZ0Rlc2NyaXB0aW9ucyB9IGZyb20gJy4vdGFnLWdsdWUuanMnO1xuXG4vLy8vLy8vLy8vLy8vIEFzc2V0cyB0YWJsZVxuXG4vLyBAdGFibGUoe1xuLy8gICAgIG5hbWU6ICdBU1NFVFMnLFxuLy8gICAgIHdpdGhvdXRSb3dJZDogdHJ1ZSxcbi8vIH0gYXMgVGFibGVPcHRzKVxuLy8gZXhwb3J0IGNsYXNzIEFzc2V0IHtcblxuLy8gICAgIC8vIFByaW1hcnkga2V5XG4vLyAgICAgQGlkKHtcbi8vICAgICAgICAgbmFtZTogJ3ZwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnYXNzZXRfdnBhdGgnKVxuLy8gICAgIHZwYXRoOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBtaW1lOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2Fzc2V0X21vdW50ZWQnKVxuLy8gICAgIG1vdW50ZWQ6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtb3VudFBvaW50JywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnYXNzZXRfbW91bnRQb2ludCcpXG4vLyAgICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ3BhdGhJbk1vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdhc3NldF9wYXRoSW5Nb3VudGVkJylcbi8vICAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnYXNzZXRfZnNwYXRoJylcbi8vICAgICBmc3BhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdyZW5kZXJQYXRoJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnYXNzZXRfcmVuZGVyUGF0aCcpXG4vLyAgICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2Rpcm5hbWUnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdhc3NldF9kaXJuYW1lJylcbi8vICAgICBkaXJuYW1lOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncmVuZGVyc1RvSFRNTCcsIGRidHlwZTogJ0lOVEVHRVInXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2Fzc2V0c19yZW5kZXJzVG9IVE1MJylcbi8vICAgICByZW5kZXJzVG9IVE1MOiBib29sZWFuO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuLy8gICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnYXNzZXRfbXRpbWVNcycpXG4vLyAgICAgbXRpbWVNczogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2RvY01ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsXG4vLyAgICAgICAgIGlzSnNvbjogdHJ1ZVxuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdhc3NldF9kb2NNZXRhZGF0YScpXG4vLyAgICAgZG9jTWV0YWRhdGE6IGFueTtcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLFxuLy8gICAgICAgICBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnYXNzZXRfbWV0YWRhdGEnKVxuLy8gICAgIG1ldGFkYXRhOiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnaW5mbycsIGRidHlwZTogJ1RFWFQnLFxuLy8gICAgICAgICBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIGluZm86IGFueTtcblxuLy8gfVxuXG4vLyBhd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnQVNTRVRTWlpaWlpaWlonKTtcbi8vIHR5cGUgVGFzc2V0c0RBTyA9IEJhc2VEQU88QXNzZXQ+O1xuLy8gZXhwb3J0IGNvbnN0IGFzc2V0c0RBTzogVGFzc2V0c0RBT1xuICAgIC8vID0gbmV3IEJhc2VEQU88QXNzZXQ+KEFzc2V0LCBzcWRiKTtcblxuLy8gYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF92cGF0aCcpO1xuLy8gYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9tb3VudGVkJyk7XG4vLyBhd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X21vdW50UG9pbnQnKTtcbi8vIGF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfcGF0aEluTW91bnRlZCcpO1xuLy8gYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9mc3BhdGgnKTtcbi8vIGF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfcmVuZGVyUGF0aCcpO1xuLy8gYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldHNfcmVuZGVyc1RvSFRNTCcpO1xuLy8gYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9kaXJuYW1lJyk7XG4vLyBhd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X210aW1lTXMnKTtcbi8vIGF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfZG9jTWV0YWRhdGEnKTtcbi8vIGF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfbWV0YWRhdGEnKTtcblxuLy8vLy8vLy8vLy8vIFBhcnRpYWxzIFRhYmxlXG5cbi8vIEB0YWJsZSh7XG4vLyAgICAgbmFtZTogJ1BBUlRJQUxTJyxcbi8vICAgICB3aXRob3V0Um93SWQ6IHRydWUsXG4vLyB9KVxuLy8gZXhwb3J0IGNsYXNzIFBhcnRpYWwge1xuXG4vLyAgICAgLy8gUHJpbWFyeSBrZXlcbi8vICAgICBAaWQoe1xuLy8gICAgICAgICBuYW1lOiAndnBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdwYXJ0aWFsX3ZwYXRoJylcbi8vICAgICB2cGF0aDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ21pbWUnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgbWltZTogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdwYXJ0aWFsX21vdW50ZWQnKVxuLy8gICAgIG1vdW50ZWQ6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtb3VudFBvaW50JywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgncGFydGlhbF9tb3VudFBvaW50Jylcbi8vICAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ3BhcnRpYWxfcGF0aEluTW91bnRlZCcpXG4vLyAgICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ3BhcnRpYWxfZnNwYXRoJylcbi8vICAgICBmc3BhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdyZW5kZXJQYXRoJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgncGFydGlhbF9yZW5kZXJQYXRoJylcbi8vICAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZGlybmFtZScsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ3BhcnRpYWxfZGlybmFtZScpXG4vLyAgICAgZGlybmFtZTogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ3JlbmRlcnNUb0hUTUwnLCBkYnR5cGU6ICdJTlRFR0VSJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdwYXJ0aWFsX3JlbmRlcnNUb0hUTUwnKVxuLy8gICAgIHJlbmRlcnNUb0hUTUw6IGJvb2xlYW47XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbXRpbWVNcycsXG4vLyAgICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdwYXJ0aWFsX210aW1lTXMnKVxuLy8gICAgIG10aW1lTXM6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZG9jQ29udGVudCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBkb2NDb250ZW50OiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZG9jQm9keScsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBkb2NCb2R5OiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJyxcbi8vICAgICAgICAgaXNKc29uOiB0cnVlXG4vLyAgICAgfSlcbi8vICAgICBtZXRhZGF0YTogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4vLyAgICAgfSlcbi8vICAgICBpbmZvOiBhbnk7XG4vLyB9XG5cbi8vIGF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdQQVJUSUFMU1paWlpaWlonKTtcbi8vIHR5cGUgVHBhcnRpYWxzREFPID0gQmFzZURBTzxQYXJ0aWFsPjtcbi8vIGV4cG9ydCBjb25zdCBwYXJ0aWFsc0RBT1xuICAgIC8vID0gbmV3IEJhc2VEQU88UGFydGlhbD4oUGFydGlhbCwgc3FkYik7XG5cbi8vIGF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX3ZwYXRoJyk7XG4vLyBhd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9tb3VudGVkJyk7XG4vLyBhd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9tb3VudFBvaW50Jyk7XG4vLyBhd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9wYXRoSW5Nb3VudGVkJyk7XG4vLyBhd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9mc3BhdGgnKTtcbi8vIGF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX3JlbmRlclBhdGgnKTtcbi8vIGF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX2Rpcm5hbWUnKTtcbi8vIGF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX3JlbmRlcnNUb0hUTUwnKTtcbi8vIGF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX210aW1lTXMnKTtcblxuLy8vLy8vLy8vLy8vLy8vLy8gTGF5b3V0cyBUYWJsZVxuXG4vLyBAdGFibGUoe1xuLy8gICAgIG5hbWU6ICdMQVlPVVRTJyxcbi8vICAgICB3aXRob3V0Um93SWQ6IHRydWUsXG4vLyB9KVxuLy8gZXhwb3J0IGNsYXNzIExheW91dCB7XG5cbi8vICAgICAvLyBQcmltYXJ5IGtleVxuLy8gICAgIEBpZCh7XG4vLyAgICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2xheW91dF92cGF0aCcpXG4vLyAgICAgdnBhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtaW1lJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIG1pbWU6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnbGF5b3V0X21vdW50ZWQnKVxuLy8gICAgIG1vdW50ZWQ6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtb3VudFBvaW50JywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnbGF5b3V0X21vdW50UG9pbnQnKVxuLy8gICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnbGF5b3V0X3BhdGhJbk1vdW50ZWQnKVxuLy8gICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdmc3BhdGgnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdsYXlvdXRfZnNwYXRoJylcbi8vICAgICBmc3BhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdyZW5kZXJQYXRoJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnbGF5b3V0X3JlbmRlclBhdGgnKVxuLy8gICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkaXJuYW1lJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnbGF5b3V0X2Rpcm5hbWUnKVxuLy8gICAgIGRpcm5hbWU6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdyZW5kZXJzVG9IVE1MJywgZGJ0eXBlOiAnSU5URUdFUidcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnbGF5b3V0X3JlbmRlcnNUb0hUTUwnKVxuLy8gICAgIHJlbmRlcnNUb0hUTUw6IGJvb2xlYW47XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbXRpbWVNcycsXG4vLyAgICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdsYXlvdXRfbXRpbWVNcycpXG4vLyAgICAgbXRpbWVNczogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2RvY01ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuLy8gICAgIH0pXG4vLyAgICAgZG9jTWV0YWRhdGE6IGFueTtcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkb2NDb250ZW50JywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIGRvY0NvbnRlbnQ6IGFueTtcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkb2NCb2R5JywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIGRvY0JvZHk6IGFueTtcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIG1ldGFkYXRhOiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnaW5mbycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIGluZm86IGFueTtcblxuLy8gfVxuXG4vLyBhd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnTEFZT1VUU1paWlpaWlpaWlonKTtcbi8vIHR5cGUgVGxheW91dHNEQU8gPSBCYXNlREFPPExheW91dD47XG4vLyBleHBvcnQgY29uc3QgbGF5b3V0c0RBT1xuLy8gICAgID0gbmV3IEJhc2VEQU88TGF5b3V0PihMYXlvdXQsIHNxZGIpO1xuXG4vLyBhd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfdnBhdGgnKTtcbi8vIGF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9tb3VudGVkJyk7XG4vLyBhd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfbW91bnRQb2ludCcpO1xuLy8gYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X3BhdGhJbk1vdW50ZWQnKTtcbi8vIGF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9mc3BhdGgnKTtcbi8vIGF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9yZW5kZXJQYXRoJyk7XG4vLyBhd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfcmVuZGVyc1RvSFRNTCcpO1xuLy8gYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X2Rpcm5hbWUnKTtcbi8vIGF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9tdGltZU1zJyk7XG5cbi8vLy8vLy8vLy8vLy8vLyBEb2N1bWVudHMgVGFibGVcblxuLy8gQHRhYmxlKHtcbi8vICAgICBuYW1lOiAnRE9DVU1FTlRTJyxcbi8vICAgICB3aXRob3V0Um93SWQ6IHRydWUsXG4vLyB9KVxuLy8gZXhwb3J0IGNsYXNzIERvY3VtZW50IHtcblxuLy8gICAgIC8vIFByaW1hcnkga2V5XG4vLyAgICAgQGlkKHtcbi8vICAgICAgICAgbmFtZTogJ3ZwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc192cGF0aCcpXG4vLyAgICAgdnBhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdtaW1lJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIG1pbWU/OiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2RvY3NfbW91bnRlZCcpXG4vLyAgICAgbW91bnRlZDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ21vdW50UG9pbnQnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdkb2NzX21vdW50UG9pbnQnKVxuLy8gICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc19wYXRoSW5Nb3VudGVkJylcbi8vICAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc19mc3BhdGgnKVxuLy8gICAgIGZzcGF0aDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ3JlbmRlclBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdkb2NzX3JlbmRlclBhdGgnKVxuLy8gICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdyZW5kZXJzVG9IVE1MJywgZGJ0eXBlOiAnSU5URUdFUidcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc19yZW5kZXJzVG9IVE1MJylcbi8vICAgICByZW5kZXJzVG9IVE1MOiBib29sZWFuO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2Rpcm5hbWUnLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdkb2NzX2Rpcm5hbWUnKVxuLy8gICAgIGRpcm5hbWU6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdwYXJlbnREaXInLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdkb2NzX3BhcmVudERpcicpXG4vLyAgICAgcGFyZW50RGlyOiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbXRpbWVNcycsXG4vLyAgICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdkb2NzX210aW1lTXMnKVxuLy8gICAgIG10aW1lTXM6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdwdWJsaWNhdGlvblRpbWUnLFxuLy8gICAgICAgICBkYnR5cGU6IGBJTlRFR0VSIEdFTkVSQVRFRCBBTFdBWVMgQVMgKGpzb25fZXh0cmFjdChpbmZvLCAnJC5wdWJsaWNhdGlvblRpbWUnKSkgU1RPUkVEYFxuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdkb2NzX3B1YmxpY2F0aW9uVGltZScpXG4vLyAgICAgcHVibGljYXRpb25UaW1lOiBudW1iZXI7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnYmFzZU1ldGFkYXRhJyxcbi8vICAgICAgICAgZGJ0eXBlOiBgVEVYVCBHRU5FUkFURUQgQUxXQVlTIEFTIChqc29uX2V4dHJhY3QoaW5mbywgJyQuYmFzZU1ldGFkYXRhJykpIFNUT1JFRGAsXG4vLyAgICAgICAgIGlzSnNvbjogdHJ1ZVxuLy8gICAgIH0pXG4vLyAgICAgYmFzZU1ldGFkYXRhPzogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2RvY01ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsXG4vLyAgICAgICAgIGlzSnNvbjogdHJ1ZVxuLy8gICAgIH0pXG4vLyAgICAgZG9jTWV0YWRhdGE/OiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnZG9jQ29udGVudCcsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBkb2NDb250ZW50Pzogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2RvY0JvZHknLCBkYnR5cGU6ICdURVhUJ1xuLy8gICAgIH0pXG4vLyAgICAgZG9jQm9keT86IHN0cmluZztcblxuLy8gICAgIC8vICBHRU5FUkFURUQgQUxXQVlTIEFTIChqc29uX2V4dHJhY3QoaW5mbywgJyQubWV0YWRhdGEnKSkgU1RPUkVEXG4vLyAgICAgLy8gQGZpZWxkKHtcbi8vICAgICAvLyAgICAgbmFtZTogJ21ldGFkYXRhJyxcbi8vICAgICAvLyAgICAgZGJ0eXBlOiBgVEVYVGAsXG4vLyAgICAgLy8gICAgIGlzSnNvbjogdHJ1ZVxuLy8gICAgIC8vIH0pXG4vLyAgICAgLy8gbWV0YWRhdGE/OiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLFxuLy8gICAgICAgICBkYnR5cGU6IGBURVhUIEdFTkVSQVRFRCBBTFdBWVMgQVMgKGpzb25fZXh0cmFjdChpbmZvLCAnJC5tZXRhZGF0YScpKSBTVE9SRURgLFxuLy8gICAgICAgICBpc0pzb246IHRydWVcbi8vICAgICB9KVxuLy8gICAgIG1ldGFkYXRhPzogYW55O1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ3RhZ3MnLFxuLy8gICAgICAgICBkYnR5cGU6IGBURVhUIEdFTkVSQVRFRCBBTFdBWVMgQVMgKGpzb25fZXh0cmFjdChpbmZvLCAnJC5tZXRhZGF0YS50YWdzJykpIFNUT1JFRGAsXG4vLyAgICAgICAgIGlzSnNvbjogdHJ1ZVxuLy8gICAgIH0pXG4vLyAgICAgQGluZGV4KCdkb2NzX3RhZ3MnKVxuLy8gICAgIHRhZ3M/OiBhbnk7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbGF5b3V0Jyxcbi8vICAgICAgICAgZGJ0eXBlOiBgVEVYVCBHRU5FUkFURUQgQUxXQVlTIEFTIChqc29uX2V4dHJhY3QobWV0YWRhdGEsICckLmxheW91dCcpKSBTVE9SRURgXG4vLyAgICAgfSlcbi8vICAgICBAaW5kZXgoJ2RvY3NfbGF5b3V0Jylcbi8vICAgICBsYXlvdXQ/OiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnYmxvZ3RhZycsXG4vLyAgICAgICAgIGRidHlwZTogYFRFWFQgR0VORVJBVEVEIEFMV0FZUyBBUyAoanNvbl9leHRyYWN0KG1ldGFkYXRhLCAnJC5ibG9ndGFnJykpIFNUT1JFRGBcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgnZG9jc19ibG9ndGFnJylcbi8vICAgICBibG9ndGFnPzogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4vLyAgICAgfSlcbi8vICAgICBpbmZvOiBhbnk7XG5cbi8vIH1cblxuLy8gYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0RPQ1VNRU5UU1paWlpaWlpaWicpO1xuLy8gdHlwZSBUZG9jdW1lbnRzc0RBTyA9IEJhc2VEQU88RG9jdW1lbnQ+O1xuLy8gZXhwb3J0IGNvbnN0IGRvY3VtZW50c0RBT1xuLy8gICAgID0gbmV3IEJhc2VEQU88RG9jdW1lbnQ+KERvY3VtZW50LCBzcWRiKTtcblxuLy8gYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3ZwYXRoJyk7XG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfbW91bnRlZCcpO1xuLy8gYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX21vdW50UG9pbnQnKTtcbi8vIGF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19wYXRoSW5Nb3VudGVkJyk7XG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfZnNwYXRoJyk7XG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfcmVuZGVyUGF0aCcpO1xuLy8gYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3JlbmRlcnNUb0hUTUwnKTtcbi8vIGF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19kaXJuYW1lJyk7XG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfcGFyZW50RGlyJyk7XG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfbXRpbWVNcycpO1xuLy8gYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3B1YmxpY2F0aW9uVGltZScpO1xuLy8gYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3RhZ3MnKTtcbi8vIGF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19sYXlvdXQnKTtcbi8vIGF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19ibG9ndGFnJyk7XG5cbi8vIGF3YWl0IGRvY3VtZW50c0RBTy5zcWxkYi5ydW4oYFxuLy8gICAgIENSRUFURSBJTkRFWCBJRiBOT1QgRVhJU1RTIFxuLy8gICAgIGlkeF9kb2NzX21ldGFkYXRhX2pzb24gT04gXG4vLyAgICAgRE9DVU1FTlRTKGpzb25fZXh0cmFjdChtZXRhZGF0YSwgJyQucHVibGljYXRpb25EYXRlJykpO1xuLy8gYCk7XG4vLyBhd2FpdCBkb2N1bWVudHNEQU8uc3FsZGIucnVuKGBcbi8vICAgICBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyBcbi8vICAgICBpZHhfZG9jc19yZW5kZXJfcGF0aF9wYXR0ZXJuIE9OIERPQ1VNRU5UUyhyZW5kZXJQYXRoKTtcbi8vIGApO1xuXG5jb25zdCB0Z2x1ZSA9IG5ldyBUYWdHbHVlKCk7XG4vLyB0Z2x1ZS5pbml0KHNxZGIuX2RiKTtcblxuY29uc3QgdGRlc2MgPSBuZXcgVGFnRGVzY3JpcHRpb25zKCk7XG4vLyB0ZGVzYy5pbml0KHNxZGIuX2RiKTtcblxuLy8gQ29udmVydCBBa2FzaGFDTVMgbW91bnQgcG9pbnRzIGludG8gdGhlIG1vdW50cG9pbnRcbi8vIHVzZWQgYnkgRGlyc1dhdGNoZXJcbmNvbnN0IHJlbWFwZGlycyA9IChkaXJ6OiBkaXJUb01vdW50W10pOiBkaXJUb1dhdGNoW10gPT4ge1xuICAgIHJldHVybiBkaXJ6Lm1hcChkaXIgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZG9jdW1lbnQgZGlyICcsIGRpcik7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogJy8nLFxuICAgICAgICAgICAgICAgIGJhc2VNZXRhZGF0YToge31cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWRpci5kZXN0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW1hcGRpcnMgaW52YWxpZCBtb3VudCBzcGVjaWZpY2F0aW9uICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5zcmMsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLmRlc3QsXG4gICAgICAgICAgICAgICAgYmFzZU1ldGFkYXRhOiBkaXIuYmFzZU1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGlnbm9yZTogZGlyLmlnbm9yZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUeXBlIGZvciByZXR1cm4gZnJvbSBwYXRocyBtZXRob2QuICBUaGUgZmllbGRzIGhlcmVcbiAqIGFyZSB3aGF0cyBpbiB0aGUgQXNzZXQvTGF5b3V0L1BhcnRpYWwgY2xhc3NlcyBhYm92ZVxuICogcGx1cyBhIGNvdXBsZSBmaWVsZHMgdGhhdCBvbGRlciBjb2RlIGV4cGVjdGVkXG4gKiBmcm9tIHRoZSBwYXRocyBtZXRob2QuXG4gKi9cbmV4cG9ydCB0eXBlIFBhdGhzUmV0dXJuVHlwZSA9IHtcbiAgICB2cGF0aDogc3RyaW5nLFxuICAgIG1pbWU6IHN0cmluZyxcbiAgICBtb3VudGVkOiBzdHJpbmcsXG4gICAgbW91bnRQb2ludDogc3RyaW5nLFxuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZyxcbiAgICBtdGltZU1zOiBzdHJpbmcsXG4gICAgaW5mbzogYW55LFxuICAgIC8vIFRoZXNlIHdpbGwgYmUgY29tcHV0ZWQgaW4gQmFzZUZpbGVDYWNoZVxuICAgIC8vIFRoZXkgd2VyZSByZXR1cm5lZCBpbiBwcmV2aW91cyB2ZXJzaW9ucy5cbiAgICBmc3BhdGg6IHN0cmluZyxcbiAgICByZW5kZXJQYXRoOiBzdHJpbmdcbn07XG5cbmV4cG9ydCBjbGFzcyBCYXNlRmlsZUNhY2hlPFxuICAgICAgICBULCAvLyBleHRlbmRzIEFzc2V0IHwgTGF5b3V0IHwgUGFydGlhbCB8IERvY3VtZW50LFxuICAgICAgICBUZGFvIC8vIGV4dGVuZHMgQmFzZURBTzxUPlxuPiBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cbiAgICAjY29uZmlnPzogQ29uZmlndXJhdGlvbjtcbiAgICAjbmFtZT86IHN0cmluZztcbiAgICAjZGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjaXNfcmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAjY2FjaGVfY29udGVudDogYm9vbGVhbjtcbiAgICAjbWFwX3JlbmRlcnBhdGg6IGJvb2xlYW47XG4gICAgI2RhbzogVGRhbzsgLy8gQmFzZURBTzxUPjtcblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAgICAgKiBAcGFyYW0gZGlycyBhcnJheSBvZiBkaXJlY3RvcmllcyBhbmQgbW91bnQgcG9pbnRzIHRvIHdhdGNoXG4gICAgICogQHBhcmFtIG5hbWUgc3RyaW5nIGdpdmluZyB0aGUgbmFtZSBmb3IgdGhpcyB3YXRjaGVyIG5hbWVcbiAgICAgKiBAcGFyYW0gZGFvIFRoZSBTUUxJVEUzT1JNIERBTyBpbnN0YW5jZSB0byB1c2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRpcnM6IGRpclRvTW91bnRbXSxcbiAgICAgICAgZGFvOiBUZGFvIC8vIEJhc2VEQU88VD5cbiAgICApIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEJhc2VGaWxlQ2FjaGUgJHtuYW1lfSBjb25zdHJ1Y3RvciBkaXJzPSR7dXRpbC5pbnNwZWN0KGRpcnMpfWApO1xuICAgICAgICB0aGlzLiNjb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuI25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLiNkaXJzID0gZGlycztcbiAgICAgICAgdGhpcy4jaXNfcmVhZHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jY2FjaGVfY29udGVudCA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNtYXBfcmVuZGVycGF0aCA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNkYW8gPSBkYW87XG4gICAgfVxuXG4gICAgZ2V0IGNvbmZpZygpICAgICB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICBnZXQgbmFtZSgpICAgICAgIHsgcmV0dXJuIHRoaXMuI25hbWU7IH1cbiAgICBnZXQgZGlycygpICAgICAgIHsgcmV0dXJuIHRoaXMuI2RpcnM7IH1cbiAgICBzZXQgY2FjaGVDb250ZW50KGRvaXQpIHsgdGhpcy4jY2FjaGVfY29udGVudCA9IGRvaXQ7IH1cbiAgICBnZXQgZ2FjaGVDb250ZW50KCkgeyByZXR1cm4gdGhpcy4jY2FjaGVfY29udGVudDsgfVxuICAgIHNldCBtYXBSZW5kZXJQYXRoKGRvaXQpIHsgdGhpcy4jbWFwX3JlbmRlcnBhdGggPSBkb2l0OyB9XG4gICAgZ2V0IG1hcFJlbmRlclBhdGgoKSB7IHJldHVybiB0aGlzLiNtYXBfcmVuZGVycGF0aDsgfVxuICAgIGdldCBkYW8oKTogVGRhbyB7IHJldHVybiB0aGlzLiNkYW87IH1cblxuICAgIC8vIFNLSVA6IGdldER5bmFtaWNWaWV3XG5cblxuICAgICN3YXRjaGVyOiBEaXJzV2F0Y2hlcjtcbiAgICAjcXVldWU7XG5cbiAgICBhc3luYyBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuI3F1ZXVlKSB7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZS5raWxsQW5kRHJhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLiN3YXRjaGVyKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0xPU0lORyAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuI3dhdGNoZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2NoYW5nZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2FkZGVkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCd1bmxpbmtlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVhZHknKTtcblxuICAgICAgICBhd2FpdCBzcWRiLmNsb3NlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHVwIHJlY2VpdmluZyBldmVudHMgZnJvbSBEaXJzV2F0Y2hlciwgYW5kIGRpc3BhdGNoaW5nIHRvXG4gICAgICogdGhlIGhhbmRsZXIgbWV0aG9kcy5cbiAgICAgKi9cbiAgICBhc3luYyBzZXR1cCgpIHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBpZiAodGhpcy4jd2F0Y2hlcikge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy4jd2F0Y2hlci5jbG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jcXVldWUgPSBmYXN0cS5wcm9taXNlKGFzeW5jIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmNvZGUgPT09ICdjaGFuZ2VkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGFuZ2UgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVDaGFuZ2VkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnY2hhbmdlJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAnYWRkZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGFkZCAke2V2ZW50Lm5hbWV9ICR7ZXZlbnQuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZUFkZGVkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnYWRkJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mbzogZXZlbnQuaW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ3VubGlua2VkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGB1bmxpbmsgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVVbmxpbmtlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ3VubGluaycsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVFcnJvcihldmVudC5uYW1lKSAqL1xuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAncmVhZHknKSB7XG4gICAgICAgICAgICAgICAgLy8gYXdhaXQgZmNhY2hlLmhhbmRsZVJlYWR5KGV2ZW50Lm5hbWUpO1xuICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdyZWFkeScsIGV2ZW50Lm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMCk7XG5cbiAgICAgICAgdGhpcy4jd2F0Y2hlciA9IG5ldyBEaXJzV2F0Y2hlcih0aGlzLm5hbWUpO1xuXG4gICAgICAgIHRoaXMuI3dhdGNoZXIub24oJ2NoYW5nZScsIGFzeW5jIChuYW1lOiBzdHJpbmcsIGluZm86IFZQYXRoRGF0YSkgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gY2hhbmdlZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFVTSCAke25hbWV9IGNoYW5nZWQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICdjaGFuZ2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ2NoYW5nZScgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIGNoYW5nZSAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignYWRkJywgYXN5bmMgKG5hbWU6IHN0cmluZywgaW5mbzogVlBhdGhEYXRhKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IGFkZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBQVVNIICR7bmFtZX0gYWRkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnYWRkZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAnYWRkJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgYWRkICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCd1bmxpbmsnLCBhc3luYyAobmFtZTogc3RyaW5nLCBpbmZvOiBWUGF0aERhdGEpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGB1bmxpbmsgJHtuYW1lfSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ3VubGlua2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ3VubGluaycgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCB1bmxpbmsgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ3JlYWR5JywgYXN5bmMgKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gcmVhZHlgKTtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvZGU6ICdyZWFkeScsXG4gICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2V0dXAgJHt0aGlzLiNuYW1lfSB3YXRjaCAke3V0aWwuaW5zcGVjdCh0aGlzLiNkaXJzKX0gPT0+ICR7dXRpbC5pbnNwZWN0KG1hcHBlZCl9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIud2F0Y2gobWFwcGVkKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgREFPICR7dGhpcy5kYW8udGFibGUubmFtZX0gJHt1dGlsLmluc3BlY3QodGhpcy5kYW8udGFibGUuZmllbGRzKX1gKTtcblxuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm86IFQpIHtcbiAgICAgICAgLy8gUGxhY2Vob2xkZXIgd2hpY2ggc29tZSBzdWJjbGFzc2VzXG4gICAgICAgIC8vIGFyZSBleHBlY3RlZCB0byBvdmVycmlkZVxuXG4gICAgICAgIC8vIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKG9iajogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGJlIG92ZXJyaWRkZW5gKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmpCQVNFKG9iajogYW55LCBkZXN0OiBhbnkpOiB2b2lkIHtcblxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCByZWNlaXZlIGFuIG9iamVjdCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoudnBhdGggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai52cGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIHZwYXRoLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC52cGF0aCA9IG9iai52cGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5taW1lICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgJiYgb2JqLm1pbWUgIT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5taW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgbWltZSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QubWltZSA9IG9iai5taW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLm1vdW50ZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5tb3VudGVkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgbW91bnRlZCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QubW91bnRlZCA9IG9iai5tb3VudGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLm1vdW50UG9pbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5tb3VudFBvaW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgbW91bnRQb2ludCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QubW91bnRQb2ludCA9IG9iai5tb3VudFBvaW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLnBhdGhJbk1vdW50ZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5wYXRoSW5Nb3VudGVkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgcGF0aEluTW91bnRlZCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QucGF0aEluTW91bnRlZCA9IG9iai5wYXRoSW5Nb3VudGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmZzcGF0aCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmZzcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIGZzcGF0aCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QuZnNwYXRoID0gb2JqLmZzcGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5yZW5kZXJQYXRoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoucmVuZGVyUGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIHJlbmRlclBhdGgsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0LnJlbmRlclBhdGggPSBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5kaXJuYW1lICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouZGlybmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIGRpcm5hbWUsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0LmRpcm5hbWUgPSBvYmouZGlybmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5yZW5kZXJzVG9IVE1MICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgfHwgb2JqLnJlbmRlcnNUb0hUTUwgPT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5yZW5kZXJzVG9IVE1MID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIGlmIChvYmoucmVuZGVyc1RvSFRNTCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiAob2JqLnJlbmRlclBhdGgubWF0Y2goLy4qXFwuaHRtbCQvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYCR7b2JqLnJlbmRlclBhdGh9ID09PSAwID09PSBGQUxTRWApO1xuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgIGRlc3QucmVuZGVyc1RvSFRNTCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob2JqLnJlbmRlcnNUb0hUTUwgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKG9iai5yZW5kZXJQYXRoLm1hdGNoKC8uKlxcLmh0bWwkLykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGAke29iai5yZW5kZXJQYXRofSA9PT0gMSA9PT0gVFJVRWApO1xuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgIGRlc3QucmVuZGVyc1RvSFRNTCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSByZW5kZXJzVG9IVE1MIGluY29ycmVjdCB2YWx1ZSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChvYmoucmVuZGVyc1RvSFRNTCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlc3QucmVuZGVyc1RvSFRNTCA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIElOVEVHRVIgcmVuZGVyc1RvSFRNTCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIGlmIChvYmoucmVuZGVyUGF0aC5tYXRjaCgvLipcXC5odG1sJC8pKSB7XG4gICAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYCR7b2JqLnJlbmRlclBhdGh9IGRlZmF1bHQgdG8gRkFMU0VgKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIGRlc3QucmVuZGVyc1RvSFRNTCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIChvYmoucmVuZGVyUGF0aC5tYXRjaCgvLipcXC5odG1sJC8pKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhgJHtvYmoucmVuZGVyUGF0aH0gJHtvYmoucmVuZGVyc1RvSFRNTH0gJHtkZXN0LnJlbmRlcnNUb0hUTUx9YCk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoubXRpbWVNcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLm10aW1lTXMgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBtdGltZU1zLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5tdGltZU1zID0gb2JqLm10aW1lTXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jTWV0YWRhdGEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAob2JqLmRvY01ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVzdC5kb2NNZXRhZGF0YSA9IHt9O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLmRvY01ldGFkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgZG9jTWV0YWRhdGEsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0LmRvY01ldGFkYXRhID0gSlNPTi5wYXJzZShvYmouZG9jTWV0YWRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVzdC5kb2NNZXRhZGF0YSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLm1ldGFkYXRhICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKG9iai5tZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlc3QubWV0YWRhdGEgPSB7fTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9iai5tZXRhZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIG1ldGFkYXRhLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5tZXRhZGF0YSA9IEpTT04ucGFyc2Uob2JqLm1ldGFkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc3QubWV0YWRhdGEgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5pbmZvICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKG9iai5pbmZvID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVzdC5pbmZvID0ge307XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmouaW5mbyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIGluZm8sIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0LmluZm8gPSBKU09OLnBhcnNlKG9iai5pbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc3QuaW5mbyA9IHt9O1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGFuIGluZm8gb2JqZWN0IGJhc2VkIG9uIHZwYXRoIGFuZCBtb3VudGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEBwYXJhbSBtb3VudGVkIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBmaW5kUGF0aE1vdW50ZWQodnBhdGg6IHN0cmluZywgbW91bnRlZDogc3RyaW5nKSB7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zdCBmb3VuZCA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgIC8vICAgICBTRUxFQ1QgdnBhdGgsIG1vdW50ZWRcbiAgICAgICAgLy8gICAgIEZST00gJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfVxuICAgICAgICAvLyAgICAgV0hFUkUgXG4gICAgICAgIC8vICAgICB2cGF0aCA9ICR2cGF0aCBBTkQgbW91bnRlZCA9ICRtb3VudGVkXG4gICAgICAgIC8vIGAsIHtcbiAgICAgICAgLy8gICAgICR2cGF0aDogdnBhdGgsXG4gICAgICAgIC8vICAgICAkbW91bnRlZDogbW91bnRlZFxuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gY29uc3QgbWFwcGVkID0gPGFueVtdPmZvdW5kLm1hcChpdGVtID0+IHtcbiAgICAgICAgLy8gICAgIHJldHVybiB7IHZwYXRoOiBpdGVtLnZwYXRoLCBtb3VudGVkOiBpdGVtLm1vdW50ZWQgfVxuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gcmV0dXJuIG1hcHBlZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGFuIGluZm8gb2JqZWN0IGJ5IHRoZSB2cGF0aC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZmluZEJ5UGF0aCh2cGF0aDogc3RyaW5nKSB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRCeVBhdGggJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfSAke3ZwYXRofWApO1xuXG4gICAgICAgIC8vIGNvbnN0IGZvdW5kID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgLy8gICAgIFNFTEVDVCAqXG4gICAgICAgIC8vICAgICBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgLy8gICAgIFdIRVJFIFxuICAgICAgICAvLyAgICAgdnBhdGggPSAkdnBhdGggT1IgcmVuZGVyUGF0aCA9ICR2cGF0aFxuICAgICAgICAvLyBgLCB7XG4gICAgICAgIC8vICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIC8vIGNvbnN0IG1hcHBlZCA9IDxhbnlbXT5mb3VuZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgIC8vICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIGZvciAoY29uc3QgaXRlbSBvZiBtYXBwZWQpIHtcbiAgICAgICAgLy8gICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaXRlbSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gcmV0dXJuIG1hcHBlZDtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVDaGFuZ2VkKG5hbWUsIGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVDaGFuZ2VkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmICh0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBPT09PT09PT0dBISEhIFJlY2VpdmVkIGEgZmlsZSB0aGF0IHNob3VsZCBiZSBpbmdvcmVkIGAsIGluZm8pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlQ2hhbmdlZCBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBoYW5kbGVDaGFuZ2VkICR7aW5mby52cGF0aH0gJHtpbmZvLm1ldGFkYXRhICYmIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID8gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgOiAnPz8/J31gKTtcblxuICAgICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGluZm8pO1xuICAgICAgICBpbmZvLnN0YWNrID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZmluZFBhdGhNb3VudGVkKGluZm8udnBhdGgsIGluZm8ubW91bnRlZCk7XG5cbiAgICAgICAgLy8gY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgLy8gICAgIHZwYXRoOiB7IGVxOiBpbmZvLnZwYXRoIH0sXG4gICAgICAgIC8vICAgICBtb3VudGVkOiB7IGVxOiBpbmZvLm1vdW50ZWQgfVxuICAgICAgICAvLyB9IGFzIEZpbHRlcjxUPik7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIUFycmF5LmlzQXJyYXkocmVzdWx0KVxuICAgICAgICAgfHwgcmVzdWx0Lmxlbmd0aCA8PSAwXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gSXQgd2Fzbid0IGZvdW5kIGluIHRoZSBkYXRhYmFzZS4gIEhlbmNlXG4gICAgICAgICAgICAvLyB3ZSBzaG91bGQgYWRkIGl0LlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlQWRkZWQobmFtZSwgaW5mbyk7XG4gICAgICAgIH1cblxuICAgICAgICBpbmZvLnN0YWNrID0gdW5kZWZpbmVkO1xuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZURvY0luREIoaW5mbyk7XG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmhvb2tGaWxlQ2hhbmdlZChuYW1lLCBpbmZvKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvKSB7XG4gICAgICAgIC8vIGF3YWl0IHRoaXMuI2Rhby51cGRhdGUoe1xuICAgICAgICAvLyAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgIC8vICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgIC8vICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgIC8vICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgIC8vICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgIC8vICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgIC8vICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgIC8vICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0hUTUw6IGZhbHNlLFxuICAgICAgICAvLyAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAvLyAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgIC8vICAgICAvLyBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgIC8vICAgICAvLyBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgIC8vICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgLy8gICAgIGluZm8sXG4gICAgICAgIC8vIH0gYXMgVCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2UgcmVjZWl2ZSB0aGlzOlxuICAgICAqXG4gICAgICoge1xuICAgICAqICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAqICAgIHZwYXRoOiB2cGF0aCxcbiAgICAgKiAgICBtaW1lOiBtaW1lLmdldFR5cGUoZnNwYXRoKSxcbiAgICAgKiAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgKiAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgKiAgICBwYXRoSW5Nb3VudGVkOiBjb21wdXRlZCByZWxhdGl2ZSBwYXRoXG4gICAgICogICAgc3RhY2s6IFsgYXJyYXkgb2YgdGhlc2UgaW5zdGFuY2VzIF1cbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBOZWVkIHRvIGFkZDpcbiAgICAgKiAgICByZW5kZXJQYXRoXG4gICAgICogICAgQW5kIGZvciBIVE1MIHJlbmRlciBmaWxlcywgYWRkIHRoZSBiYXNlTWV0YWRhdGEgYW5kIGRvY01ldGFkYXRhXG4gICAgICpcbiAgICAgKiBTaG91bGQgcmVtb3ZlIHRoZSBzdGFjaywgc2luY2UgaXQncyBsaWtlbHkgbm90IHVzZWZ1bCB0byB1cy5cbiAgICAgKi9cblxuICAgIGFzeW5jIGhhbmRsZUFkZGVkKG5hbWUsIGluZm8pIHtcbiAgICAgICAgLy8gIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlQWRkZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09PT09PR0EhISEgUmVjZWl2ZWQgYSBmaWxlIHRoYXQgc2hvdWxkIGJlIGluZ29yZWQgYCwgaW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVBZGRlZCBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpbmZvKTtcbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnNlcnREb2NUb0RCKGluZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUFkZGVkKG5hbWUsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKGluZm8pIHtcbiAgICAgICAgLy8gYXdhaXQgdGhpcy4jZGFvLmluc2VydCh7XG4gICAgICAgIC8vICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgLy8gICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgLy8gICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgLy8gICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgLy8gICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgLy8gICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgLy8gICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgLy8gICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAvLyAgICAgcmVuZGVyc1RvSFRNTDogZmFsc2UsXG4gICAgICAgIC8vICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIC8vICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgLy8gICAgIC8vIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgLy8gICAgIC8vIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgLy8gICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAvLyAgICAgaW5mbyxcbiAgICAgICAgLy8gfSBhcyBUKTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVVbmxpbmtlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlVW5saW5rZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVVbmxpbmtlZCBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVVbmxpbmtlZChuYW1lLCBpbmZvKTtcblxuICAgIC8vICAgICBhd2FpdCB0aGlzLiNkYW8uc3FsZGIucnVuKGBcbiAgICAvLyAgICAgICAgIERFTEVURSBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAvLyAgICAgICAgIFdIRVJFXG4gICAgLy8gICAgICAgICB2cGF0aCA9ICR2cGF0aCBBTkQgbW91bnRlZCA9ICRtb3VudGVkXG4gICAgLy8gICAgIGAsIHtcbiAgICAvLyAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAvLyAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWRcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICAgIC8vIGF3YWl0IHRoaXMuI2Rhby5kZWxldGVBbGwoe1xuICAgIC8vICAgICAvLyAgICAgdnBhdGg6IHsgZXE6IGluZm8udnBhdGggfSxcbiAgICAvLyAgICAgLy8gICAgIG1vdW50ZWQ6IHsgZXE6IGluZm8ubW91bnRlZCB9XG4gICAgLy8gICAgIC8vIH0gYXMgV2hlcmU8VD4pO1xuICAgIH1cblxuICAgIC8vIGFzeW5jIGhhbmRsZVJlYWR5KG5hbWUpIHtcbiAgICAvLyAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVSZWFkeWApO1xuICAgIC8vICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgLy8gICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZVJlYWR5IGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgdGhpcy4jaXNfcmVhZHkgPSB0cnVlO1xuICAgIC8vICAgICB0aGlzLmVtaXQoJ3JlYWR5JywgbmFtZSk7XG4gICAgLy8gfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgZGlyZWN0b3J5IG1vdW50IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGZpbGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGluZm9cbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGZpbGVEaXJNb3VudChpbmZvKSB7XG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiBtYXBwZWQpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkaXJNb3VudCBmb3IgJHtpbmZvLnZwYXRofSAtLSAke3V0aWwuaW5zcGVjdChpbmZvKX0gPT09ICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgICAgICBpZiAoaW5mby5tb3VudFBvaW50ID09PSBkaXIubW91bnRQb2ludCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaG91bGQgdGhpcyBmaWxlIGJlIGlnbm9yZWQsIGJhc2VkIG9uIHRoZSBgaWdub3JlYCBmaWVsZFxuICAgICAqIGluIHRoZSBtYXRjaGluZyBgZGlyYCBtb3VudCBlbnRyeS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgaWdub3JlRmlsZShpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgY29uc3QgZGlyTW91bnQgPSB0aGlzLmZpbGVEaXJNb3VudChpbmZvKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgJHtpbmZvLnZwYXRofSBkaXJNb3VudCAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIGxldCBpZ25vcmUgPSBmYWxzZTtcbiAgICAgICAgaWYgKGRpck1vdW50KSB7XG5cbiAgICAgICAgICAgIGxldCBpZ25vcmVzO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXJNb3VudC5pZ25vcmUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IFsgZGlyTW91bnQuaWdub3JlIF07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGlyTW91bnQuaWdub3JlKSkge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBkaXJNb3VudC5pZ25vcmU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpZ25vcmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1pY3JvbWF0Y2guaXNNYXRjaChpbmZvLnZwYXRoLCBpKSkgaWdub3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZGlyTW91bnQuaWdub3JlICR7ZnNwYXRofSAke2l9ID0+ICR7aWdub3JlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgKGlnbm9yZSkgY29uc29sZS5sb2coYE1VU1QgaWdub3JlIEZpbGUgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgZm9yICR7aW5mby52cGF0aH0gPT0+ICR7aWdub3JlfWApO1xuICAgICAgICAgICAgcmV0dXJuIGlnbm9yZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vIG1vdW50PyAgdGhhdCBtZWFucyBzb21ldGhpbmcgc3RyYW5nZVxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgTm8gZGlyTW91bnQgZm91bmQgZm9yICR7aW5mby52cGF0aH0gLyAke2luZm8uZGlyTW91bnRlZE9ufWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGxvdyBhIGNhbGxlciB0byB3YWl0IHVudGlsIHRoZSA8ZW0+cmVhZHk8L2VtPiBldmVudCBoYXNcbiAgICAgKiBiZWVuIHNlbnQgZnJvbSB0aGUgRGlyc1dhdGNoZXIgaW5zdGFuY2UuICBUaGlzIGV2ZW50IG1lYW5zIHRoZVxuICAgICAqIGluaXRpYWwgaW5kZXhpbmcgaGFzIGhhcHBlbmVkLlxuICAgICAqL1xuICAgIGFzeW5jIGlzUmVhZHkoKSB7XG4gICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZGlyZWN0b3JpZXMsIHRoZXJlIHdvbid0IGJlIGFueSBmaWxlcyBcbiAgICAgICAgLy8gdG8gbG9hZCwgYW5kIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICB3aGlsZSAodGhpcy4jZGlycy5sZW5ndGggPiAwICYmICF0aGlzLiNpc19yZWFkeSkge1xuICAgICAgICAgICAgLy8gVGhpcyBkb2VzIGEgMTAwbXMgcGF1c2VcbiAgICAgICAgICAgIC8vIFRoYXQgbGV0cyB1cyBjaGVjayBpc19yZWFkeSBldmVyeSAxMDBtc1xuICAgICAgICAgICAgLy8gYXQgdmVyeSBsaXR0bGUgY29zdFxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCFpc1JlYWR5ICR7dGhpcy5uYW1lfSAke3RoaXNbX3N5bWJfZGlyc10ubGVuZ3RofSAke3RoaXNbX3N5bWJfaXNfcmVhZHldfWApO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBzaW1wbGUgaW5mb3JtYXRpb24gYWJvdXQgZWFjaFxuICAgICAqIHBhdGggaW4gdGhlIGNvbGxlY3Rpb24uICBUaGUgcmV0dXJuXG4gICAgICogdHlwZSBpcyBhbiBhcnJheSBvZiBQYXRoc1JldHVyblR5cGUuXG4gICAgICogXG4gICAgICogSSBmb3VuZCB0d28gdXNlcyBmb3IgdGhpcyBmdW5jdGlvbi5cbiAgICAgKiBJbiBjb3B5QXNzZXRzLCB0aGUgdnBhdGggYW5kIG90aGVyXG4gICAgICogc2ltcGxlIGRhdGEgaXMgdXNlZCBmb3IgY29weWluZyBpdGVtc1xuICAgICAqIHRvIHRoZSBvdXRwdXQgZGlyZWN0b3J5LlxuICAgICAqIEluIHJlbmRlci50cywgdGhlIHNpbXBsZSBmaWVsZHMgYXJlXG4gICAgICogdXNlZCB0byB0aGVuIGNhbGwgZmluZCB0byByZXRyaWV2ZVxuICAgICAqIHRoZSBmdWxsIGluZm9ybWF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHBhdGhzKHJvb3RQYXRoPzogc3RyaW5nKVxuICAgICAgICAvLyA6IFByb21pc2U8QXJyYXk8UGF0aHNSZXR1cm5UeXBlPj5cbiAgICB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cblxuICAgICAgICBsZXQgcm9vdFAgPSByb290UGF0aD8uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IHJvb3RQYXRoPy5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogcm9vdFBhdGg7XG5cbiAgICAgICAgLy8gVGhpcyBpcyBjb3BpZWQgZnJvbSB0aGUgb2xkZXIgdmVyc2lvblxuICAgICAgICAvLyAoTG9raUpTIHZlcnNpb24pIG9mIHRoaXMgZnVuY3Rpb24uICBJdFxuICAgICAgICAvLyBzZWVtcyBtZWFudCB0byBlbGltaW5hdGUgZHVwbGljYXRlcy5cbiAgICAgICAgY29uc3QgdnBhdGhzU2VlbiA9IG5ldyBTZXQoKTtcblxuICAgICAgICAvLyBTZWxlY3QgdGhlIGZpZWxkcyBpbiBQYXRoc1JldHVyblR5cGVcbiAgICAgICAgLy8gY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChcbiAgICAgICAgLy8gKHR5cGVvZiByb290UCA9PT0gJ3N0cmluZycpID9cbiAgICAgICAgLy8gYFxuICAgICAgICAvLyAgICAgU0VMRUNUXG4gICAgICAgIC8vICAgICAgICAgdnBhdGgsIG1pbWUsIG1vdW50ZWQsIG1vdW50UG9pbnQsXG4gICAgICAgIC8vICAgICAgICAgcGF0aEluTW91bnRlZCwgbXRpbWVNcyxcbiAgICAgICAgLy8gICAgICAgICBpbmZvLCBmc3BhdGgsIHJlbmRlclBhdGhcbiAgICAgICAgLy8gICAgIEZST00gJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfVxuICAgICAgICAvLyAgICAgV0hFUkVcbiAgICAgICAgLy8gICAgIHJlbmRlclBhdGggTElLRSAkcm9vdFBcbiAgICAgICAgLy8gICAgIE9SREVSIEJZIG10aW1lTXMgQVNDXG4gICAgICAgIC8vIGBcbiAgICAgICAgLy8gOiBgXG4gICAgICAgIC8vICAgICBTRUxFQ1RcbiAgICAgICAgLy8gICAgICAgICB2cGF0aCwgbWltZSwgbW91bnRlZCwgbW91bnRQb2ludCxcbiAgICAgICAgLy8gICAgICAgICBwYXRoSW5Nb3VudGVkLCBtdGltZU1zLFxuICAgICAgICAvLyAgICAgICAgIGluZm8sIGZzcGF0aCwgcmVuZGVyUGF0aFxuICAgICAgICAvLyAgICAgRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9XG4gICAgICAgIC8vICAgICBPUkRFUiBCWSBtdGltZU1zIEFTQ1xuICAgICAgICAvLyBgLFxuICAgICAgICAvLyAodHlwZW9mIHJvb3RQID09PSAnc3RyaW5nJylcbiAgICAgICAgLy8gPyB7ICRyb290UDogYCR7cm9vdFB9JWAgfVxuICAgICAgICAvLyA6IHt9KVxuXG4gICAgICAgIC8vIGNvbnN0IHNlbGVjdG9yID0ge1xuICAgICAgICAvLyAgICAgb3JkZXI6IHsgbXRpbWVNczogdHJ1ZSB9XG4gICAgICAgIC8vIH0gYXMgYW55O1xuICAgICAgICAvLyBpZiAodHlwZW9mIHJvb3RQID09PSAnc3RyaW5nJ1xuICAgICAgICAvLyAmJiByb290UC5sZW5ndGggPj0gMSkge1xuICAgICAgICAvLyAgICAgc2VsZWN0b3IucmVuZGVyUGF0aCA9IHtcbiAgICAgICAgLy8gICAgICAgICBpc0xpa2U6IGAke3Jvb3RQfSVgXG4gICAgICAgIC8vICAgICAgICAgLy8gc3FsOiBgIHJlbmRlclBhdGggcmVnZXhwICdeJHtyb290UH0nIGBcbiAgICAgICAgLy8gICAgIH07XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gLy8gY29uc29sZS5sb2coYHBhdGhzICR7dXRpbC5pbnNwZWN0KHNlbGVjdG9yKX1gKTtcbiAgICAgICAgLy8gY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHNlbGVjdG9yKTtcbiAgICAgICAgLy8gY29uc3QgcmVzdWx0MiA9IHJlc3VsdHMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAvLyAgICAgLy8gY29uc29sZS5sb2coYHBhdGhzID9pZ25vcmU/ICR7aXRlbS52cGF0aH1gKTtcbiAgICAgICAgLy8gICAgIGlmIChmY2FjaGUuaWdub3JlRmlsZShpdGVtKSkge1xuICAgICAgICAvLyAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gICAgIGlmICh2cGF0aHNTZWVuLmhhcygoaXRlbSBhcyBBc3NldCkudnBhdGgpKSB7XG4gICAgICAgIC8vICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gICAgICAgICB2cGF0aHNTZWVuLmFkZCgoaXRlbSBhcyBBc3NldCkudnBhdGgpO1xuICAgICAgICAvLyAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9KTtcblxuICAgICAgICAvLyByZXR1cm4gcmVzdWx0MjtcblxuICAgICAgICAvLyBUaGlzIHN0YWdlIGNvbnZlcnRzIHRoZSBpdGVtcyBcbiAgICAgICAgLy8gcmVjZWl2ZWQgYnkgdGhpcyBmdW5jdGlvbiBpbnRvXG4gICAgICAgIC8vIHdoYXQgaXMgcmVxdWlyZWQgZnJvbVxuICAgICAgICAvLyB0aGUgcGF0aHMgbWV0aG9kLlxuICAgICAgICAvLyBjb25zdCByZXN1bHQ0XG4gICAgICAgIC8vICAgICAgICAgPSBuZXcgQXJyYXk8UGF0aHNSZXR1cm5UeXBlPigpO1xuICAgICAgICAvLyBmb3IgKGNvbnN0IGl0ZW0gb2YgcmVzdWx0Mykge1xuICAgICAgICAvLyAgICAgcmVzdWx0NC5wdXNoKDxQYXRoc1JldHVyblR5cGU+e1xuICAgICAgICAvLyAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAvLyAgICAgICAgIG1pbWU6IGl0ZW0ubWltZSxcbiAgICAgICAgLy8gICAgICAgICBtb3VudGVkOiBpdGVtLm1vdW50ZWQsXG4gICAgICAgIC8vICAgICAgICAgbW91bnRQb2ludDogaXRlbS5tb3VudFBvaW50LFxuICAgICAgICAvLyAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGl0ZW0ucGF0aEluTW91bnRlZCxcbiAgICAgICAgLy8gICAgICAgICBtdGltZU1zOiBpdGVtLm10aW1lTXMsXG4gICAgICAgIC8vICAgICAgICAgaW5mbzogaXRlbS5pbmZvLFxuICAgICAgICAvLyAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGl0ZW0ubW91bnRlZCwgaXRlbS5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgLy8gICAgICAgICByZW5kZXJQYXRoOiBpdGVtLnZwYXRoXG4gICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgLy8gfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgZmlsZSB3aXRoaW4gdGhlIGNhY2hlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBUaGUgdnBhdGggb3IgcmVuZGVyUGF0aCB0byBsb29rIGZvclxuICAgICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgICovXG4gICAgYXN5bmMgZmluZChfZnBhdGgpIC8qOiBQcm9taXNlPFQ+ICovIHtcblxuICAgICAgICBpZiAodHlwZW9mIF9mcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZCBwYXJhbWV0ZXIgbm90IHN0cmluZyAke3R5cGVvZiBfZnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChmcGF0aCk7XG5cbiAgICAgICAgLy8gY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgIC8vICAgICBvcjogW1xuICAgICAgICAvLyAgICAgICAgIHsgdnBhdGg6IHsgZXE6IGZwYXRoIH19LFxuICAgICAgICAvLyAgICAgICAgIHsgcmVuZGVyUGF0aDogeyBlcTogZnBhdGggfX1cbiAgICAgICAgLy8gICAgIF1cbiAgICAgICAgLy8gfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kICR7X2ZwYXRofSAke2ZwYXRofSA9PT4gcmVzdWx0MSAke3V0aWwuaW5zcGVjdChyZXN1bHQxKX0gYCk7XG5cbiAgICAgICAgLy8gY29uc3QgcmVzdWx0MiA9IDxhbnlbXT5yZXN1bHQxLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgLy8gICAgIHJldHVybiAhKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKTtcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gLy8gZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0Mikge1xuICAgICAgICAvLyAvLyAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShyZXN1bHQpO1xuICAgICAgICAvLyAvLyB9XG5cbiAgICAgICAgLy8gLy8gY29uc29sZS5sb2coYGZpbmQgJHtfZnBhdGh9ICR7ZnBhdGh9ID09PiByZXN1bHQyICR7dXRpbC5pbnNwZWN0KHJlc3VsdDIpfSBgKTtcblxuICAgICAgICAvLyBsZXQgcmV0O1xuICAgICAgICAvLyBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gICAgIHJldCA9IHJlc3VsdDJbMF07XG4gICAgICAgIC8vIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgIC8vICAgICByZXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICByZXQgPSByZXN1bHQyO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgI2ZFeGlzdHNJbkRpcihmcGF0aCwgZGlyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGAjZkV4aXN0c0luRGlyICR7ZnBhdGh9ICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgIGlmIChkaXIubW91bnRQb2ludCA9PT0gJy8nKSB7XG4gICAgICAgICAgICBjb25zdCBmc3BhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgZGlyLm1vdW50ZWQsIGZwYXRoXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzTXRpbWU6IHN0YXRzLm10aW1lTXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1wID0gZGlyLm1vdW50UG9pbnQuc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IGRpci5tb3VudFBvaW50LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgOiBkaXIubW91bnRQb2ludDtcbiAgICAgICAgbXAgPSBtcC5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IG1wXG4gICAgICAgICAgICA6IChtcCsnLycpO1xuXG4gICAgICAgIGlmIChmcGF0aC5zdGFydHNXaXRoKG1wKSkge1xuICAgICAgICAgICAgbGV0IHBhdGhJbk1vdW50ZWRcbiAgICAgICAgICAgICAgICA9IGZwYXRoLnJlcGxhY2UoZGlyLm1vdW50UG9pbnQsICcnKTtcbiAgICAgICAgICAgIGxldCBmc3BhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgZGlyLm1vdW50ZWQsIHBhdGhJbk1vdW50ZWQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENoZWNraW5nIGV4aXN0IGZvciAke2Rpci5tb3VudFBvaW50fSAke2Rpci5tb3VudGVkfSAke3BhdGhJbk1vdW50ZWR9ICR7ZnNwYXRofWApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogc3RhdHMubXRpbWVNc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZ1bGZpbGxzIHRoZSBcImZpbmRcIiBvcGVyYXRpb24gbm90IGJ5XG4gICAgICogbG9va2luZyBpbiB0aGUgZGF0YWJhc2UsIGJ1dCBieSBzY2FubmluZ1xuICAgICAqIHRoZSBmaWxlc3lzdGVtIHVzaW5nIHN5bmNocm9ub3VzIGNhbGxzLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBmaW5kU3luYyhfZnBhdGgpOiBWUGF0aERhdGEgfCB1bmRlZmluZWQge1xuXG4gICAgICAgIGlmICh0eXBlb2YgX2ZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaW5kIHBhcmFtZXRlciBub3Qgc3RyaW5nICR7dHlwZW9mIF9mcGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRTeW5jIGxvb2tpbmcgZm9yICR7ZnBhdGh9IGluICR7dXRpbC5pbnNwZWN0KG1hcHBlZCl9YCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgbWFwcGVkKSB7XG4gICAgICAgICAgICBpZiAoIShkaXI/Lm1vdW50UG9pbnQpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBmaW5kU3luYyBiYWQgZGlycyBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmRpcnMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZm91bmQgPSB0aGlzLiNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcik7XG4gICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZFN5bmMgJHtmcGF0aH0gZm91bmRgLCBmb3VuZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gVE9ETyBJcyB0aGlzIGZ1bmN0aW9uIHVzZWQgYW55d2hlcmU/XG4gICAgLy8gYXN5bmMgZmluZEFsbCgpIHtcblxuICAgIC8vICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgLy8gICAgIC8vIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgIC8vICAgICAvLyB9IGFzIEZpbHRlcjxUPik7XG5cbiAgICAvLyAgICAgY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgLy8gICAgICAgICBTRUxFQ1QgKiBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAvLyAgICAgYCwge30pO1xuXG4gICAgLy8gICAgIGNvbnN0IHJlc3VsdDIgPSByZXN1bHQxLmZpbHRlcihpdGVtID0+IHtcbiAgICAvLyAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kQWxsID9pZ25vcmU/ICR7aXRlbS52cGF0aH1gKTtcbiAgICAvLyAgICAgICAgIHJldHVybiAhKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICAgIGNvbnN0IHJlc3VsdDMgPSByZXN1bHQyLm1hcChpdGVtID0+IHtcbiAgICAvLyAgICAgICAgIHJldHVybiB0aGlzLmN2dFJvd1RvT2JqKGl0ZW0pO1xuICAgIC8vICAgICB9KVxuICAgIC8vICAgICByZXR1cm4gcmVzdWx0MztcbiAgICAvLyB9XG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldHNGaWxlQ2FjaGU8XG4gICAgVCwgLy8gZXh0ZW5kcyBBc3NldCxcbiAgICBUZGFvIC8vIGV4dGVuZHMgQmFzZURBTzxUPlxuPiBleHRlbmRzIEJhc2VGaWxlQ2FjaGU8VCwgVGRhbz4ge1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZGlyczogZGlyVG9Nb3VudFtdLFxuICAgICAgICBkYW86IFRkYW9cbiAgICApIHtcbiAgICAgICAgc3VwZXIoY29uZmlnLCBuYW1lLCBkaXJzLCBkYW8pO1xuICAgIH1cblxuICAgIC8vIHByb3RlY3RlZCBjdnRSb3dUb09iaihvYmo6IGFueSk6IEFzc2V0IHtcbiAgICAvLyAgICAgY29uc3QgcmV0OiBBc3NldCA9IG5ldyBBc3NldCgpO1xuICAgIC8vICAgICB0aGlzLmN2dFJvd1RvT2JqQkFTRShvYmosIHJldCk7XG4gICAgLy8gICAgIHJldHVybiByZXQ7XG4gICAgLy8gfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZXNGaWxlQ2FjaGU8XG4gICAgVCwgLy8gZXh0ZW5kcyBMYXlvdXQgfCBQYXJ0aWFsLFxuICAgIFRkYW8gLy8gZXh0ZW5kcyBCYXNlREFPPFQ+PlxuICAgIGV4dGVuZHMgQmFzZUZpbGVDYWNoZTxULCBUZGFvPj4ge1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb01vdW50W10sXG4gICAgICAgIGRhbzogVGRhbyxcbiAgICAgICAgdHlwZTogXCJsYXlvdXRcIiB8IFwicGFydGlhbFwiXG4gICAgKSB7XG4gICAgICAgIC8vIHN1cGVyKGNvbmZpZywgbmFtZSwgZGlycywgZGFvKTtcbiAgICAgICAgdGhpcy4jdHlwZSA9IHR5cGU7XG4gICAgfVxuXG4gICAgLy8gQmVjYXVzZSB0aGlzIGNsYXNzIHNlcnZlcyB0d28gcHVycG9zZXMsIExheW91dFxuICAgIC8vIGFuZCBQYXJ0aWFscywgdGhpcyBmbGFnIGhlbHBzIHRvIGRpc3Rpbmd1aXNoLlxuICAgIC8vIEFueSBwbGFjZSwgbGlrZSBjdnRSb3dUb09iaiwgd2hpY2ggbmVlZHMgdG8ga25vd1xuICAgIC8vIHdoaWNoIGlzIHdoaWNoIGNhbiB1c2UgdGhlc2UgZ2V0dGVycyB0byBkb1xuICAgIC8vIHRoZSByaWdodCB0aGluZy5cblxuICAgICN0eXBlOiBcImxheW91dFwiIHwgXCJwYXJ0aWFsXCI7XG4gICAgZ2V0IGlzTGF5b3V0KCkgeyByZXR1cm4gdGhpcy4jdHlwZSA9PT0gXCJsYXlvdXRcIjsgfVxuICAgIGdldCBpc1BhcnRpYWwoKSB7IHJldHVybiB0aGlzLiN0eXBlID09PSBcInBhcnRpYWxcIjsgfVxuXG4gICAgLy8gcHJvdGVjdGVkIGN2dFJvd1RvT2JqKG9iajogYW55KTogTGF5b3V0IHwgUGFydGlhbCB7XG4gICAgLy8gICAgIGNvbnN0IHJldDogTGF5b3V0IHwgUGFydGlhbCA9IFxuICAgIC8vICAgICAgICAgICAgIHRoaXMuaXNMYXlvdXQgPyBuZXcgTGF5b3V0KCkgOiBuZXcgUGFydGlhbCgpO1xuICAgIC8vICAgICB0aGlzLmN2dFJvd1RvT2JqQkFTRShvYmosIHJldCk7XG5cbiAgICAvLyAgICAgLy8gaWYgKHR5cGVvZiBvYmouZG9jTWV0YWRhdGEgIT09ICd1bmRlZmluZWQnXG4gICAgLy8gICAgIC8vICAmJiBvYmouZG9jTWV0YWRhdGEgIT09IG51bGxcbiAgICAvLyAgICAgLy8gKSB7XG4gICAgLy8gICAgIC8vICAgICBpZiAodHlwZW9mIG9iai5kb2NNZXRhZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAvLyAgICAgLy8gICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRlbXBsYXRlc0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBkb2NNZXRhZGF0YSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgLy8gICAgIC8vICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAvLyAgICAgICAgIHJldC5kb2NNZXRhZGF0YSA9IG9iai5kb2NNZXRhZGF0YTtcbiAgICAvLyAgICAgLy8gICAgIH1cbiAgICAvLyAgICAgLy8gfVxuICAgIC8vICAgICBpZiAodHlwZW9mIG9iai5kb2NDb250ZW50ICE9PSAndW5kZWZpbmVkJ1xuICAgIC8vICAgICAgJiYgb2JqLmRvY0NvbnRlbnQgIT09IG51bGxcbiAgICAvLyAgICAgKSB7XG4gICAgLy8gICAgICAgICBpZiAob2JqLmRvY0NvbnRlbnQgPT09IG51bGwpIHtcbiAgICAvLyAgICAgICAgICAgICByZXQuZG9jQ29udGVudCA9IHVuZGVmaW5lZDtcbiAgICAvLyAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9iai5kb2NDb250ZW50ICE9PSAnc3RyaW5nJykge1xuICAgIC8vICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGVtcGxhdGVzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIGRvY0NvbnRlbnQsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgIC8vICAgICAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgICAgICByZXQuZG9jQ29udGVudCA9IG9iai5kb2NDb250ZW50O1xuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICB9XG4gICAgLy8gICAgIGlmICh0eXBlb2Ygb2JqLmRvY0JvZHkgIT09ICd1bmRlZmluZWQnXG4gICAgLy8gICAgICAmJiBvYmouZG9jQm9keSAhPT0gbnVsbFxuICAgIC8vICAgICApIHtcbiAgICAvLyAgICAgICAgIGlmIChvYmouZG9jQm9keSA9PT0gbnVsbCkge1xuICAgIC8vICAgICAgICAgICAgIHJldC5kb2NCb2R5ID0gdW5kZWZpbmVkO1xuICAgIC8vICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLmRvY0JvZHkgIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUZW1wbGF0ZXNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgZG9jQm9keSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgLy8gICAgICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgICAgIHJldC5kb2NCb2R5ID0gb2JqLmRvY0JvZHk7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgLy8gaWYgKHR5cGVvZiBvYmoubWV0YWRhdGEgIT09ICd1bmRlZmluZWQnXG4gICAgLy8gICAgIC8vICAmJiBvYmoubWV0YWRhdGEgIT09IG51bGxcbiAgICAvLyAgICAgLy8gKSB7XG4gICAgLy8gICAgIC8vICAgICBpZiAodHlwZW9mIG9iai5tZXRhZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAvLyAgICAgLy8gICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRlbXBsYXRlc0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBtZXRhZGF0YSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgLy8gICAgIC8vICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAvLyAgICAgICAgIHJldC5tZXRhZGF0YSA9IG9iai5tZXRhZGF0YTtcbiAgICAvLyAgICAgLy8gICAgIH1cbiAgICAvLyAgICAgLy8gfVxuICAgIC8vICAgICByZXR1cm4gcmV0O1xuICAgIC8vIH1cblxuICAgIC8qKlxuICAgICAqIEdhdGhlciB0aGUgYWRkaXRpb25hbCBkYXRhIHN1aXRhYmxlXG4gICAgICogZm9yIFBhcnRpYWwgYW5kIExheW91dCB0ZW1wbGF0ZXMuICBUaGVcbiAgICAgKiBmdWxsIGRhdGEgc2V0IHJlcXVpcmVkIGZvciBEb2N1bWVudHMgaXNcbiAgICAgKiBub3Qgc3VpdGFibGUgZm9yIHRoZSB0ZW1wbGF0ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5mbyBcbiAgICAgKi9cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvKSB7XG5cbiAgICAgICAgaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgaW5mby5kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAoaW5mby5kaXJuYW1lID09PSAnLicpIGluZm8uZGlybmFtZSA9ICcvJztcblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB1bmRlZmluZWQ7IC8vIHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoaW5mby52cGF0aCk7XG4gICAgICAgIGluZm8ucmVuZGVyZXIgPSByZW5kZXJlcjtcblxuXG4gICAgICAgIGlmIChyZW5kZXJlcikge1xuXG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBVc2luZyA8YW55PiBoZXJlIGNvdmVycyBvdmVyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBwYXJzZU1ldGFkYXRhIHJlcXVpcmVzXG4gICAgICAgICAgICAgICAgLy8gYSBSZW5kZXJpbmdDb250ZXh0IHdoaWNoXG4gICAgICAgICAgICAgICAgLy8gaW4gdHVybiByZXF1aXJlcyBhIFxuICAgICAgICAgICAgICAgIC8vIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY01ldGFkYXRhIGlzIHRoZSB1bm1vZGlmaWVkIG1ldGFkYXRhL2Zyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YSA9IHJjLm1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQgaXMgdGhlIHVucGFyc2VkIG9yaWdpbmFsIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAvLyBpbmNsdWRpbmcgYW55IGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NDb250ZW50ID0gcmMuY29udGVudDtcbiAgICAgICAgICAgICAgICAvLyBkb2NCb2R5IGlzIHRoZSBwYXJzZWQgYm9keSAtLSBlLmcuIGZvbGxvd2luZyB0aGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSByYy5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY29tcHV0ZWQgbWV0YWRhdGEgdGhhdCBpbmNsdWRlcyBkYXRhIGZyb20gXG4gICAgICAgICAgICAgICAgLy8gc2V2ZXJhbCBzb3VyY2VzXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YSA9IHsgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8uZG9jTWV0YWRhdGEpIGluZm8uZG9jTWV0YWRhdGEgPSB7fTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbml0TWV0YWRhdGEgJHtiYXNlZGlyfSAke2ZwYXRofSBiYXNlTWV0YWRhdGEgJHtiYXNlTWV0YWRhdGFbeXByb3BdfWApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uYmFzZU1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgVGVtcGxhdGVzRmlsZUNhY2hlIGFmdGVyIGdhdGhlckluZm9EYXRhIGAsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm8pIHtcbiAgICAgICAgLy8gYXdhaXQgdGhpcy5kYW8udXBkYXRlKCh7XG4gICAgICAgIC8vICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgLy8gICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgLy8gICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgLy8gICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgLy8gICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgLy8gICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgLy8gICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgLy8gICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAvLyAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAvLyAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAvLyAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgIC8vICAgICBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgIC8vICAgICBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgIC8vICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgLy8gICAgIGluZm8sXG4gICAgICAgIC8vIH0gYXMgdW5rbm93bikgYXMgVCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbzogYW55KSB7XG4gICAgICAgIC8vIGF3YWl0IHRoaXMuZGFvLmluc2VydCgoe1xuICAgICAgICAvLyAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgIC8vICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgIC8vICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgIC8vICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgIC8vICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgIC8vICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgIC8vICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgIC8vICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgLy8gICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgLy8gICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAvLyAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAvLyAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAvLyAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgIC8vICAgICBpbmZvLFxuICAgICAgICAvLyB9IGFzIHVua25vd24pIGFzIFQpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERvY3VtZW50c0ZpbGVDYWNoZVxuICAgIC8qIGV4dGVuZHMgQmFzZUZpbGVDYWNoZTxEb2N1bWVudCAsIFRkb2N1bWVudHNzREFPID4gKi8ge1xuXG4gICAgLy8gY29uc3RydWN0b3IoXG4gICAgLy8gICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAvLyAgICAgbmFtZTogc3RyaW5nLFxuICAgIC8vICAgICBkaXJzOiBkaXJUb01vdW50W11cbiAgICAvLyApIHtcbiAgICAvLyAgICAgc3VwZXIoY29uZmlnLCBuYW1lLCBkaXJzLCBkb2N1bWVudHNEQU8pO1xuICAgIC8vIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihvYmo6IGFueSk6IERvY3VtZW50IHtcbiAgICAgICAgY29uc3QgcmV0OiBEb2N1bWVudCA9IG5ldyBEb2N1bWVudCgpO1xuICAgICAgICAvLyB0aGlzLmN2dFJvd1RvT2JqQkFTRShvYmosIHJldCk7XG5cbiAgICAgICAgLy8gaWYgKHR5cGVvZiBvYmouZG9jTWV0YWRhdGEgIT09ICd1bmRlZmluZWQnXG4gICAgICAgIC8vICAmJiBvYmouZG9jTWV0YWRhdGEgIT09IG51bGxcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBpZiAodHlwZW9mIG9iai5kb2NNZXRhZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBkb2NNZXRhZGF0YSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgICAgIHJldC5kb2NNZXRhZGF0YSA9IG9iai5kb2NNZXRhZGF0YTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5wdWJsaWNhdGlvblRpbWUgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmoucHVibGljYXRpb25UaW1lICE9PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoucHVibGljYXRpb25UaW1lICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIHB1YmxpY2F0aW9uVGltZSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHJldC5wdWJsaWNhdGlvblRpbWUgPSBvYmoucHVibGljYXRpb25UaW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmRvY0NvbnRlbnQgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmouZG9jQ29udGVudCAhPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmRvY0NvbnRlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgZG9jQ29udGVudCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHJldC5kb2NDb250ZW50ID0gb2JqLmRvY0NvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jQm9keSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5kb2NCb2R5ICE9PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jQm9keSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBkb2NCb2R5LCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gcmV0LmRvY0JvZHkgPSBvYmouZG9jQm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5sYXlvdXQgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmoubGF5b3V0ICE9PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoubGF5b3V0ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIGxheW91dCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHJldC5sYXlvdXQgPSBvYmoubGF5b3V0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmJsb2d0YWcgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmouYmxvZ3RhZyAhPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmJsb2d0YWcgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgYmxvZ3RhZywgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHJldC5ibG9ndGFnID0gb2JqLmJsb2d0YWc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgKHR5cGVvZiBvYmoubWV0YWRhdGEgIT09ICd1bmRlZmluZWQnXG4gICAgICAgIC8vICAmJiBvYmoubWV0YWRhdGEgIT09IG51bGxcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBpZiAodHlwZW9mIG9iai5tZXRhZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBtZXRhZGF0YSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgICAgIHJldC5tZXRhZGF0YSA9IG9iai5tZXRhZGF0YTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm8pIHtcblxuICAgICAgICBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICBpbmZvLmRpcm5hbWUgPSBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLmRpcm5hbWUgPT09ICcuJykgaW5mby5kaXJuYW1lID0gJy8nO1xuICAgICAgICBpbmZvLnBhcmVudERpciA9IHBhdGguZGlybmFtZShpbmZvLmRpcm5hbWUpO1xuXG4gICAgICAgIC8vIGZpbmQgdGhlIG1vdW50ZWQgZGlyZWN0b3J5LFxuICAgICAgICAvLyBnZXQgdGhlIGJhc2VNZXRhZGF0YVxuICAgICAgICAvLyBmb3IgKGxldCBkaXIgb2YgcmVtYXBkaXJzKHRoaXMuZGlycykpIHtcbiAgICAgICAgLy8gICAgIGlmIChkaXIubW91bnRlZCA9PT0gaW5mby5tb3VudGVkKSB7XG4gICAgICAgIC8vICAgICAgICAgaWYgKGRpci5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgaW5mby5iYXNlTWV0YWRhdGEgPSBkaXIuYmFzZU1ldGFkYXRhO1xuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgICBicmVhaztcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIC8vIHNldCBwdWJsaWNhdGlvbkRhdGUgc29tZWhvd1xuXG5cbiAgICAgICAgLy8gbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgLy8gaW5mby5yZW5kZXJlciA9IHJlbmRlcmVyO1xuXG4gICAgICAgIGlmICgvKnJlbmRlcmVyKi8gZmFsc2UpIHtcblxuICAgICAgICAgICAgLy8gaW5mby5yZW5kZXJQYXRoXG4gICAgICAgICAgICAvLyAgICAgPSByZW5kZXJlci5maWxlUGF0aChpbmZvLnZwYXRoKTtcblxuICAgICAgICAgICAgLy8gVGhpcyB3YXMgaW4gdGhlIExva2lKUyBjb2RlLCBidXRcbiAgICAgICAgICAgIC8vIHdhcyBub3QgaW4gdXNlLlxuICAgICAgICAgICAgLy8gaW5mby5yZW5kZXJuYW1lID0gcGF0aC5iYXNlbmFtZShcbiAgICAgICAgICAgIC8vICAgICBpbmZvLnJlbmRlclBhdGhcbiAgICAgICAgICAgIC8vICk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9XG4gICAgICAgICAgICAgICAgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqKi8qLmh0bWwnKVxuICAgICAgICAgICAgIHx8IG1pY3JvbWF0Y2guaXNNYXRjaChcbiAgICAgICAgICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICAnKi5odG1sJylcbiAgICAgICAgICAgID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBpZiAocmVuZGVyZXIucGFyc2VNZXRhZGF0YSkge1xuXG4gICAgICAgICAgICAvLyAgICAgLy8gVXNpbmcgPGFueT4gaGVyZSBjb3ZlcnMgb3ZlclxuICAgICAgICAgICAgLy8gICAgIC8vIHRoYXQgcGFyc2VNZXRhZGF0YSByZXF1aXJlc1xuICAgICAgICAgICAgLy8gICAgIC8vIGEgUmVuZGVyaW5nQ29udGV4dCB3aGljaFxuICAgICAgICAgICAgLy8gICAgIC8vIGluIHR1cm4gcmVxdWlyZXMgYSBcbiAgICAgICAgICAgIC8vICAgICAvLyBtZXRhZGF0YSBvYmplY3QuXG4gICAgICAgICAgICAvLyAgICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKDxhbnk+e1xuICAgICAgICAgICAgLy8gICAgICAgICBmc3BhdGg6IGluZm8uZnNwYXRoLFxuICAgICAgICAgICAgLy8gICAgICAgICBjb250ZW50OiBGUy5yZWFkRmlsZVN5bmMoaW5mby5mc3BhdGgsICd1dGYtOCcpXG4gICAgICAgICAgICAvLyAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vICAgICAvLyBkb2NNZXRhZGF0YSBpcyB0aGUgdW5tb2RpZmllZCBtZXRhZGF0YS9mcm9udG1hdHRlclxuICAgICAgICAgICAgLy8gICAgIC8vIGluIHRoZSBkb2N1bWVudFxuICAgICAgICAgICAgLy8gICAgIGluZm8uZG9jTWV0YWRhdGEgPSByYy5tZXRhZGF0YTtcbiAgICAgICAgICAgIC8vICAgICAvLyBkb2NDb250ZW50IGlzIHRoZSB1bnBhcnNlZCBvcmlnaW5hbCBjb250ZW50XG4gICAgICAgICAgICAvLyAgICAgLy8gaW5jbHVkaW5nIGFueSBmcm9udG1hdHRlclxuICAgICAgICAgICAgLy8gICAgIGluZm8uZG9jQ29udGVudCA9IHJjLmNvbnRlbnQ7XG4gICAgICAgICAgICAvLyAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAvLyAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcblxuICAgICAgICAgICAgLy8gICAgIC8vIFRoaXMgaXMgdGhlIGNvbXB1dGVkIG1ldGFkYXRhIHRoYXQgaW5jbHVkZXMgZGF0YSBmcm9tIFxuICAgICAgICAgICAgLy8gICAgIC8vIHNldmVyYWwgc291cmNlc1xuICAgICAgICAgICAgLy8gICAgIGluZm8ubWV0YWRhdGEgPSB7IH07XG4gICAgICAgICAgICAvLyAgICAgaWYgKCFpbmZvLmRvY01ldGFkYXRhKSBpbmZvLmRvY01ldGFkYXRhID0ge307XG5cbiAgICAgICAgICAgIC8vICAgICAvLyBUaGUgcmVzdCBvZiB0aGlzIGlzIGFkYXB0ZWQgZnJvbSB0aGUgb2xkIGZ1bmN0aW9uXG4gICAgICAgICAgICAvLyAgICAgLy8gSFRNTFJlbmRlcmVyLm5ld0luaXRNZXRhZGF0YVxuXG4gICAgICAgICAgICAvLyAgICAgLy8gRm9yIHN0YXJ0ZXJzIHRoZSBtZXRhZGF0YSBpcyBjb2xsZWN0ZWQgZnJvbSBzZXZlcmFsIHNvdXJjZXMuXG4gICAgICAgICAgICAvLyAgICAgLy8gMSkgdGhlIG1ldGFkYXRhIHNwZWNpZmllZCBpbiB0aGUgZGlyZWN0b3J5IG1vdW50IHdoZXJlXG4gICAgICAgICAgICAvLyAgICAgLy8gICAgdGhpcyBkb2N1bWVudCB3YXMgZm91bmRcbiAgICAgICAgICAgIC8vICAgICAvLyAyKSBtZXRhZGF0YSBpbiB0aGUgcHJvamVjdCBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAvLyAgICAgLy8gMykgdGhlIG1ldGFkYXRhIGluIHRoZSBkb2N1bWVudCwgYXMgY2FwdHVyZWQgaW4gZG9jTWV0YWRhdGFcblxuICAgICAgICAgICAgLy8gICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbml0TWV0YWRhdGEgJHtiYXNlZGlyfSAke2ZwYXRofSBiYXNlTWV0YWRhdGEgJHtiYXNlTWV0YWRhdGFbeXByb3BdfWApO1xuICAgICAgICAgICAgLy8gICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uYmFzZU1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyAgICAgZm9yIChsZXQgeXByb3AgaW4gdGhpcy5jb25maWcubWV0YWRhdGEpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSB0aGlzLmNvbmZpZy5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gICAgIGxldCBmbW1jb3VudCA9IDA7XG4gICAgICAgICAgICAvLyAgICAgZm9yIChsZXQgeXByb3AgaW4gaW5mby5kb2NNZXRhZGF0YSkge1xuICAgICAgICAgICAgLy8gICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uZG9jTWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgLy8gICAgICAgICBmbW1jb3VudCsrO1xuICAgICAgICAgICAgLy8gICAgIH1cblxuICAgICAgICAgICAgLy8gICAgIC8vIFRoZSByZW5kZXJlZCB2ZXJzaW9uIG9mIHRoZSBjb250ZW50IGxhbmRzIGhlcmVcbiAgICAgICAgICAgIC8vICAgICBpbmZvLm1ldGFkYXRhLmNvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgLy8gICAgIC8vIFRoZSBkb2N1bWVudCBvYmplY3QgaGFzIGJlZW4gdXNlZnVsIGZvciBcbiAgICAgICAgICAgIC8vICAgICAvLyBjb21tdW5pY2F0aW5nIHRoZSBmaWxlIHBhdGggYW5kIG90aGVyIGRhdGEuXG4gICAgICAgICAgICAvLyAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudCA9IHt9O1xuICAgICAgICAgICAgLy8gICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQuYmFzZWRpciA9IGluZm8ubW91bnRQb2ludDtcbiAgICAgICAgICAgIC8vICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHBhdGggPSBpbmZvLnBhdGhJbk1vdW50ZWQ7XG4gICAgICAgICAgICAvLyAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZWxyZW5kZXIgPSByZW5kZXJlci5maWxlUGF0aChpbmZvLnBhdGhJbk1vdW50ZWQpO1xuICAgICAgICAgICAgLy8gICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgICAgICAvLyAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbyA9IGluZm8ucmVuZGVyUGF0aDtcblxuICAgICAgICAgICAgLy8gICAgIC8vIEVuc3VyZSB0aGUgPGVtPnRhZ3M8L2VtPiBmaWVsZCBpcyBhbiBhcnJheVxuICAgICAgICAgICAgLy8gICAgIGlmICghKGluZm8ubWV0YWRhdGEudGFncykpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzID0gW107XG4gICAgICAgICAgICAvLyAgICAgfSBlbHNlIGlmICh0eXBlb2YgKGluZm8ubWV0YWRhdGEudGFncykgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGxldCB0YWdsaXN0ID0gW107XG4gICAgICAgICAgICAvLyAgICAgICAgIGNvbnN0IHJlID0gL1xccyosXFxzKi87XG4gICAgICAgICAgICAvLyAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncy5zcGxpdChyZSkuZm9yRWFjaCh0YWcgPT4ge1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgdGFnbGlzdC5wdXNoKHRhZy50cmltKCkpO1xuICAgICAgICAgICAgLy8gICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzID0gdGFnbGlzdDtcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KGluZm8ubWV0YWRhdGEudGFncykpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgYEZPUk1BVCBFUlJPUiAtICR7aW5mby52cGF0aH0gaGFzIGJhZGx5IGZvcm1hdHRlZCB0YWdzIGAsXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MpO1xuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vICAgICBpbmZvLmRvY01ldGFkYXRhLnRhZ3MgPSBpbmZvLm1ldGFkYXRhLnRhZ3M7XG5cbiAgICAgICAgICAgIC8vICAgICAvLyBpZiAoaW5mby5tZXRhZGF0YS5ibG9ndGFnKSB7XG4gICAgICAgICAgICAvLyAgICAgLy8gICAgIGluZm8uYmxvZ3RhZyA9IGluZm8ubWV0YWRhdGEuYmxvZ3RhZztcbiAgICAgICAgICAgIC8vICAgICAvLyB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyAgICAgLy8gVGhlIHJvb3QgVVJMIGZvciB0aGUgcHJvamVjdFxuICAgICAgICAgICAgLy8gICAgIGluZm8ubWV0YWRhdGEucm9vdF91cmwgPSB0aGlzLmNvbmZpZy5yb290X3VybDtcblxuICAgICAgICAgICAgLy8gICAgIC8vIENvbXB1dGUgdGhlIFVSTCB0aGlzIGRvY3VtZW50IHdpbGwgcmVuZGVyIHRvXG4gICAgICAgICAgICAvLyAgICAgaWYgKHRoaXMuY29uZmlnLnJvb3RfdXJsKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGxldCB1Um9vdFVybCA9IG5ldyBVUkwodGhpcy5jb25maWcucm9vdF91cmwsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgdVJvb3RVcmwucGF0aG5hbWUgPSBwYXRoLm5vcm1hbGl6ZShcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICBwYXRoLmpvaW4odVJvb3RVcmwucGF0aG5hbWUsIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pXG4gICAgICAgICAgICAvLyAgICAgICAgICk7XG4gICAgICAgICAgICAvLyAgICAgICAgIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfdXJsID0gdVJvb3RVcmwudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgICAgICBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX3VybCA9IGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG87XG4gICAgICAgICAgICAvLyAgICAgfVxuXG4gICAgICAgICAgICAvLyAgICAgLy8gaW5mby5tZXRhZGF0YS5yZW5kZXJlZF9kYXRlID0gaW5mby5zdGF0cy5tdGltZTtcblxuICAgICAgICAgICAgLy8gICAgIGNvbnN0IHBhcnNlUHVibERhdGUgPSAoZGF0ZSkgPT4ge1xuICAgICAgICAgICAgLy8gICAgICAgICBjb25zdCBwYXJzZWQgPSBEYXRlLnBhcnNlKGRhdGUpO1xuICAgICAgICAgICAgLy8gICAgICAgICBpZiAoISBpc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICAgICB9O1xuXG4gICAgICAgICAgICAvLyAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgIC8vICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSk7XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAvLyAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICAvLyAgICAgfVxuXG4gICAgICAgICAgICAvLyAgICAgaWYgKCFpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgLy8gICAgICAgICB2YXIgZGF0ZVNldCA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgLy8gICAgICAgICAgJiYgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGRhdGVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAvLyAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGRhdGVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmICghIGRhdGVTZXQgJiYgaW5mby5tdGltZU1zKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKGluZm8ubXRpbWVNcyk7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gc3RhdHMubXRpbWVgKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gY3VycmVudCB0aW1lYCk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICAgICB9XG5cbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBkZWxldGVEb2NUYWdHbHVlKHZwYXRoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0Z2x1ZS5kZWxldGVUYWdHbHVlKHZwYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBpZ25vcmVcbiAgICAgICAgICAgIC8vIFRoaXMgY2FuIHRocm93IGFuIGVycm9yIGxpa2U6XG4gICAgICAgICAgICAvLyBkb2N1bWVudHNDYWNoZSBFUlJPUiB7XG4gICAgICAgICAgICAvLyAgICAgY29kZTogJ2NoYW5nZWQnLFxuICAgICAgICAgICAgLy8gICAgIG5hbWU6ICdkb2N1bWVudHMnLFxuICAgICAgICAgICAgLy8gICAgIHZwYXRoOiAnX21lcm1haWQvcmVuZGVyMzM1NjczOTM4Mi5tZXJtYWlkJyxcbiAgICAgICAgICAgIC8vICAgICBlcnJvcjogRXJyb3I6IGRlbGV0ZSBmcm9tICdUQUdHTFVFJyBmYWlsZWQ6IG5vdGhpbmcgY2hhbmdlZFxuICAgICAgICAgICAgLy8gICAgICAuLi4gc3RhY2sgdHJhY2VcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIEluIHN1Y2ggYSBjYXNlIHRoZXJlIGlzIG5vIHRhZ0dsdWUgZm9yIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICAgIC8vIFRoaXMgXCJlcnJvclwiIGlzIHNwdXJpb3VzLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRPRE8gSXMgdGhlcmUgYW5vdGhlciBxdWVyeSB0byBydW4gdGhhdCB3aWxsXG4gICAgICAgICAgICAvLyBub3QgdGhyb3cgYW4gZXJyb3IgaWYgbm90aGluZyB3YXMgY2hhbmdlZD9cbiAgICAgICAgICAgIC8vIEluIG90aGVyIHdvcmRzLCB0aGlzIGNvdWxkIGhpZGUgYSBsZWdpdGltYXRlXG4gICAgICAgICAgICAvLyBlcnJvci5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBhZGREb2NUYWdHbHVlKHZwYXRoOiBzdHJpbmcsIHRhZ3M6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGFncyAhPT0gJ3N0cmluZydcbiAgICAgICAgICYmICFBcnJheS5pc0FycmF5KHRhZ3MpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGREb2NUYWdHbHVlIG11c3QgYmUgZ2l2ZW4gYSB0YWdzIGFycmF5LCB3YXMgZ2l2ZW46ICR7dXRpbC5pbnNwZWN0KHRhZ3MpfWApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRnbHVlLmFkZFRhZ0dsdWUodnBhdGgsIFxuICAgICAgICAgICAgQXJyYXkuaXNBcnJheSh0YWdzKVxuICAgICAgICAgICAgPyB0YWdzXG4gICAgICAgICAgICA6IFsgdGFncyBdKTtcbiAgICB9XG5cbiAgICBhc3luYyBhZGRUYWdEZXNjcmlwdGlvbih0YWc6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGRlc2MuYWRkRGVzYyh0YWcsIGRlc2NyaXB0aW9uKTtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRUYWdEZXNjcmlwdGlvbih0YWc6IHN0cmluZylcbiAgICAgICAgOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD5cbiAgICB7XG4gICAgICAgIHJldHVybiB0ZGVzYy5nZXREZXNjKHRhZyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoaW5mbykge1xuICAgICAgICAvLyBjb25zdCBkb2NJbmZvID0gPERvY3VtZW50PntcbiAgICAgICAgLy8gICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAvLyAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAvLyAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAvLyAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAvLyAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAvLyAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAvLyAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAvLyAgICAgcmVuZGVyc1RvSFRNTDpcbiAgICAgICAgLy8gICAgICAgICB0eXBlb2YgaW5mby5yZW5kZXJzVG9IVE1MID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAvLyAgICAgICAgID8gZmFsc2VcbiAgICAgICAgLy8gICAgICAgICA6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgLy8gICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAvLyAgICAgcGFyZW50RGlyOiBpbmZvLnBhcmVudERpcixcbiAgICAgICAgLy8gICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgLy8gICAgIGJhc2VNZXRhZGF0YTogaW5mby5iYXNlTWV0YWRhdGEsXG4gICAgICAgIC8vICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgLy8gICAgIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgLy8gICAgIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgLy8gICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAvLyAgICAgdGFnczogQXJyYXkuaXNBcnJheShpbmZvLm1ldGFkYXRhPy50YWdzKVxuICAgICAgICAvLyAgICAgICAgICAgICA/IGluZm8ubWV0YWRhdGEudGFnc1xuICAgICAgICAvLyAgICAgICAgICAgICA6IFtdLFxuICAgICAgICAvLyAgICAgLy8gbGF5b3V0OiBpbmZvLmxheW91dCwgLy8gaW5mby5tZXRhZGF0YT8ubGF5b3V0LFxuICAgICAgICAvLyAgICAgLy8gYmxvZ3RhZzogaW5mby5ibG9ndGFnLFxuICAgICAgICAvLyAgICAgaW5mbyxcbiAgICAgICAgLy8gfTtcblxuICAgICAgICAvLyBhd2FpdCB0aGlzLmRhby51cGRhdGUoZG9jSW5mbyk7XG5cbiAgICAgICAgLy8gYXdhaXQgdGdsdWUuZGVsZXRlVGFnR2x1ZShkb2NJbmZvLnZwYXRoKTtcbiAgICAgICAgLy8gYXdhaXQgdGdsdWUuYWRkVGFnR2x1ZShkb2NJbmZvLnZwYXRoLCBkb2NJbmZvLnRhZ3MpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKGluZm86IGFueSkge1xuICAgICAgICBpZiAodHlwZW9mIGluZm8ucmVuZGVyc1RvSFRNTCA9PT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgIHx8IGluZm8ucmVuZGVyc1RvSFRNTCA9PT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaW5mby5iYXNlTWV0YWRhdGEpIGluZm8uYmFzZU1ldGFkYXRhID0ge307XG4gICAgICAgIGlmICghaW5mby5kb2NNZXRhZGF0YSkgaW5mby5kb2NNZXRhZGF0YSA9IHt9O1xuICAgICAgICBpZiAoIWluZm8uZG9jQ29udGVudCkgaW5mby5kb2NDb250ZW50ID0gJyc7XG4gICAgICAgIGlmICghaW5mby5kb2NCb2R5KSBpbmZvLmRvY0JvZHkgPSAnJztcbiAgICAgICAgaWYgKCFpbmZvLm1ldGFkYXRhKSBpbmZvLm1ldGFkYXRhID0ge307XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShpbmZvLm1ldGFkYXRhPy50YWdzKSkgaW5mby5tZXRhZGF0YS50YWdzID0gW107XG4gICAgICAgIGlmICghaW5mby5tZXRhZGF0YS5sYXlvdXQpIGluZm8ubWV0YWRhdGEubGF5b3V0ID0gJyc7XG4gICAgICAgIGlmICghaW5mby5tZXRhZGF0YS5ibG9ndGFnKSBpbmZvLm1ldGFkYXRhLmJsb2d0YWcgPSAnJztcbiAgICAgICAgLy8gY29uc3Qgc2libGluZ3MgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5ydW4oXG4gICAgICAgIC8vICAgICBgSU5TRVJUIElOVE8gRE9DVU1FTlRTXG4gICAgICAgIC8vICAgICAgICAgKFxuICAgICAgICAvLyAgICAgICAgICB2cGF0aCwgbWltZSxcbiAgICAgICAgLy8gICAgICAgICAgbW91bnRlZCwgbW91bnRQb2ludCwgcGF0aEluTW91bnRlZCxcbiAgICAgICAgLy8gICAgICAgICAgZnNwYXRoLCByZW5kZXJQYXRoLFxuICAgICAgICAvLyAgICAgICAgICByZW5kZXJzVG9IVE1MLFxuICAgICAgICAvLyAgICAgICAgICBkaXJuYW1lLCBwYXJlbnREaXIsXG4gICAgICAgIC8vICAgICAgICAgIG10aW1lTXMsXG4gICAgICAgIC8vICAgICAgICAgIGRvY01ldGFkYXRhLFxuICAgICAgICAvLyAgICAgICAgICBkb2NDb250ZW50LFxuICAgICAgICAvLyAgICAgICAgICBkb2NCb2R5LFxuICAgICAgICAvLyAgICAgICAgICBpbmZvXG4gICAgICAgIC8vICAgICAgICAgKVxuICAgICAgICAvLyAgICAgICAgIFZBTFVFUyAoXG4gICAgICAgIC8vICAgICAgICAgICR2cGF0aCwgJG1pbWUsXG4gICAgICAgIC8vICAgICAgICAgICRtb3VudGVkLCAkbW91bnRQb2ludCwgJHBhdGhJbk1vdW50ZWQsXG4gICAgICAgIC8vICAgICAgICAgICRmc3BhdGgsICRyZW5kZXJQYXRoLFxuICAgICAgICAvLyAgICAgICAgICAkcmVuZGVyc1RvSFRNTCxcbiAgICAgICAgLy8gICAgICAgICAgJGRpcm5hbWUsICRwYXJlbnREaXIsXG4gICAgICAgIC8vICAgICAgICAgICRtdGltZU1zLFxuICAgICAgICAvLyAgICAgICAgICAkZG9jTWV0YWRhdGEsXG4gICAgICAgIC8vICAgICAgICAgICRkb2NDb250ZW50LFxuICAgICAgICAvLyAgICAgICAgICAkZG9jQm9keSxcbiAgICAgICAgLy8gICAgICAgICAgJGluZm9cbiAgICAgICAgLy8gICAgICAgICApXG4gICAgICAgIC8vICAgICBgLCB7XG4gICAgICAgIC8vICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAvLyAgICAgICAgICRtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgIC8vICAgICAgICAgJG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgLy8gICAgICAgICAkbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAvLyAgICAgICAgICRwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgIC8vICAgICAgICAgJGZzcGF0aDogcGF0aC5qb2luKFxuICAgICAgICAvLyAgICAgICAgICAgICBpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZFxuICAgICAgICAvLyAgICAgICAgICksXG4gICAgICAgIC8vICAgICAgICAgJHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgLy8gICAgICAgICAkcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAvLyAgICAgICAgICRkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgLy8gICAgICAgICAkcGFyZW50RGlyOiBwYXRoLmRpcm5hbWUoXG4gICAgICAgIC8vICAgICAgICAgICAgIHBhdGguZGlybmFtZShcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aFxuICAgICAgICAvLyAgICAgICAgICkpLFxuICAgICAgICAvLyAgICAgICAgICRtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIC8vICAgICAgICAgLy8gJGJhc2VNZXRhZGF0YTogSlNPTi5zdHJpbmdpZnkoaW5mby5iYXNlTWV0YWRhdGEpLFxuICAgICAgICAvLyAgICAgICAgICRkb2NNZXRhZGF0YTogSlNPTi5zdHJpbmdpZnkoaW5mby5kb2NNZXRhZGF0YSksXG4gICAgICAgIC8vICAgICAgICAgJGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgLy8gICAgICAgICAkZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAvLyAgICAgICAgIC8vICRtZXRhZGF0YTogSlNPTi5zdHJpbmdpZnkoaW5mby5tZXRhZGF0YSksXG4gICAgICAgIC8vICAgICAgICAgJGluZm86IEpTT04uc3RyaW5naWZ5KGluZm8pXG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIClcbiAgICAgICAgLy8gLy8gYXdhaXQgdGhpcy5kYW8uaW5zZXJ0KGRvY0luZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZERvY1RhZ0dsdWUoXG4gICAgICAgICAgICBpbmZvLnZwYXRoLCBpbmZvLm1ldGFkYXRhLnRhZ3NcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVVbmxpbmtlZChuYW1lOiBhbnksIGluZm86IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAvLyBhd2FpdCBzdXBlci5oYW5kbGVVbmxpbmtlZChuYW1lLCBpbmZvKTtcbiAgICAgICAgdGdsdWUuZGVsZXRlVGFnR2x1ZShpbmZvLnZwYXRoKTtcbiAgICB9XG5cbiAgICBhc3luYyBpbmRleENoYWluKF9mcGF0aCkge1xuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSkgXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXRoLnBhcnNlKGZwYXRoKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW5kZXhDaGFpbiAke19mcGF0aH0gJHtmcGF0aH1gLCBwYXJzZWQpO1xuXG4gICAgICAgIGNvbnN0IGZpbGV6OiBEb2N1bWVudFtdID0gW107XG4gICAgICAgIC8vIGNvbnN0IHNlbGYgPSBhd2FpdCB0aGlzLmZpbmRCeVBhdGgoZnBhdGgpO1xuICAgICAgICBsZXQgZmlsZU5hbWUgPSBmcGF0aDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZikgJiYgc2VsZi5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgZmlsZXoucHVzaChzZWxmWzBdKTtcbiAgICAgICAgICAgIGZpbGVOYW1lID0gc2VsZlswXS5yZW5kZXJQYXRoO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHBhcmVudERpcjtcbiAgICAgICAgbGV0IGRpck5hbWUgPSBwYXRoLmRpcm5hbWUoZnBhdGgpO1xuICAgICAgICBsZXQgZG9uZSA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAoIShkaXJOYW1lID09PSAnLicgfHwgZGlyTmFtZSA9PT0gcGFyc2VkLnJvb3QpKSB7XG4gICAgICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShmaWxlTmFtZSkgPT09ICdpbmRleC5odG1sJykge1xuICAgICAgICAgICAgICAgIHBhcmVudERpciA9IHBhdGguZGlybmFtZShwYXRoLmRpcm5hbWUoZmlsZU5hbWUpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGZpbGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBsb29rRm9yID0gcGF0aC5qb2luKHBhcmVudERpciwgXCJpbmRleC5odG1sXCIpO1xuXG4gICAgICAgICAgICAvLyBjb25zdCBpbmRleCA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChsb29rRm9yKTtcblxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW5kZXgpICYmIGluZGV4Lmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICAgICAgZmlsZXoucHVzaChpbmRleFswXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbGVOYW1lID0gbG9va0ZvcjtcbiAgICAgICAgICAgIGRpck5hbWUgPSBwYXRoLmRpcm5hbWUobG9va0Zvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsZXpcbiAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uKG9iajogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5mb3VuZERpciA9IG9iai5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgICAgICBvYmouZm91bmRQYXRoID0gb2JqLnJlbmRlclBhdGg7XG4gICAgICAgICAgICAgICAgICAgIG9iai5maWxlbmFtZSA9ICcvJyArIG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnJldmVyc2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyBhbGwgdGhlIGRvY3VtZW50cyBpbiB0aGUgc2FtZSBkaXJlY3RvcnlcbiAgICAgKiBhcyB0aGUgbmFtZWQgZmlsZS5cbiAgICAgKlxuICAgICAqIFRoaXMgZG9lc24ndCBhcHBlYXIgdG8gYmUgdXNlZCBhbnl3aGVyZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgc2libGluZ3MoX2ZwYXRoKSB7XG4gICAgICAgIGxldCByZXQ7XG4gICAgICAgIGxldCB2cGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG4gICAgICAgIGxldCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKHZwYXRoKTtcblxuICAgICAgICAvLyBjb25zdCBzaWJsaW5ncyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgIC8vICAgICBTRUxFQ1QgKiBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgLy8gICAgIFdIRVJFXG4gICAgICAgIC8vICAgICBkaXJuYW1lID0gJGRpcm5hbWUgQU5EXG4gICAgICAgIC8vICAgICB2cGF0aCA8PiAkdnBhdGggQU5EXG4gICAgICAgIC8vICAgICByZW5kZXJQYXRoIDw+ICR2cGF0aCBBTkRcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0h0bWwgPSB0cnVlXG4gICAgICAgIC8vIGAsIHtcbiAgICAgICAgLy8gICAgICRkaXJuYW1lOiBkaXJuYW1lLFxuICAgICAgICAvLyAgICAgJHZwYXRoOiB2cGF0aFxuICAgICAgICAvLyB9KTtcblxuICAgICAgICAvLyBjb25zdCBpZ25vcmVkID0gc2libGluZ3MuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAvLyAgICAgcmV0dXJuICF0aGlzLmlnbm9yZUZpbGUoaXRlbSk7XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIC8vIGNvbnN0IG1hcHBlZCA9IGlnbm9yZWQubWFwKGl0ZW0gPT4ge1xuICAgICAgICAvLyAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvLyByZXR1cm4gbWFwcGVkO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHRyZWUgb2YgaXRlbXMgc3RhcnRpbmcgZnJvbSB0aGUgZG9jdW1lbnRcbiAgICAgKiBuYW1lZCBpbiBfcm9vdEl0ZW0uICBUaGUgcGFyYW1ldGVyIHNob3VsZCBiZSBhblxuICAgICAqIGFjdHVhbCBkb2N1bWVudCBpbiB0aGUgdHJlZSwgc3VjaCBhcyBgcGF0aC90by9pbmRleC5odG1sYC5cbiAgICAgKiBUaGUgcmV0dXJuIGlzIGEgdHJlZS1zaGFwZWQgc2V0IG9mIG9iamVjdHMgbGlrZSB0aGUgZm9sbG93aW5nO1xuICAgICAqIFxuICB0cmVlOlxuICAgIHJvb3RJdGVtOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyXG4gICAgaXRlbXM6XG4gICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgIGNoaWxkRm9sZGVyczpcbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlclxuICAgICAgICAgIGNoaWxkcmVuOlxuICAgICAgICAgICAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlclxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTEuaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UyLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAgICAtIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgIGNoaWxkcmVuOlxuICAgICAgICAgICAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyXG4gICAgICAgICAgICAgIGl0ZW1zOlxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMS5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbFxuICAgICAgICAgICAgICBjaGlsZEZvbGRlcnM6IFtdXG4gICAgICpcbiAgICAgKiBUaGUgb2JqZWN0cyB1bmRlciBgaXRlbXNgIGFyZSBhY3R1bGx5IHRoZSBmdWxsIERvY3VtZW50IG9iamVjdFxuICAgICAqIGZyb20gdGhlIGNhY2hlLCBidXQgZm9yIHRoZSBpbnRlcmVzdCBvZiBjb21wYWN0bmVzcyBtb3N0IG9mXG4gICAgICogdGhlIGZpZWxkcyBoYXZlIGJlZW4gZGVsZXRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfcm9vdEl0ZW0gXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgY2hpbGRJdGVtVHJlZShfcm9vdEl0ZW06IHN0cmluZykge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGlsZEl0ZW1UcmVlICR7X3Jvb3RJdGVtfWApO1xuXG4gICAgICAgIC8vIGxldCByb290SXRlbSA9IGF3YWl0IHRoaXMuZmluZChcbiAgICAgICAgLy8gICAgICAgICBfcm9vdEl0ZW0uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgIC8vICAgICAgICAgICAgID8gX3Jvb3RJdGVtLnN1YnN0cmluZygxKVxuICAgICAgICAvLyAgICAgICAgICAgICA6IF9yb290SXRlbSk7XG4gICAgICAgIC8vIGlmICghcm9vdEl0ZW0pIHtcbiAgICAgICAgLy8gICAgIC8vIGNvbnNvbGUud2FybihgY2hpbGRJdGVtVHJlZSBubyByb290SXRlbSBmb3VuZCBmb3IgcGF0aCAke19yb290SXRlbX1gKTtcbiAgICAgICAgLy8gICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gaWYgKCEodHlwZW9mIHJvb3RJdGVtID09PSAnb2JqZWN0JylcbiAgICAgICAgLy8gIHx8ICEoJ3ZwYXRoJyBpbiByb290SXRlbSlcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICAvLyBjb25zb2xlLndhcm4oYGNoaWxkSXRlbVRyZWUgZm91bmQgaW52YWxpZCBvYmplY3QgZm9yICR7X3Jvb3RJdGVtfSAtICR7dXRpbC5pbnNwZWN0KHJvb3RJdGVtKX1gKTtcbiAgICAgICAgLy8gICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUocm9vdEl0ZW0udnBhdGgpO1xuICAgICAgICAvLyAvLyBQaWNrcyB1cCBldmVyeXRoaW5nIGZyb20gdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIC8vIC8vIERpZmZlcnMgZnJvbSBzaWJsaW5ncyBieSBnZXR0aW5nIGV2ZXJ5dGhpbmcuXG4gICAgICAgIC8vIGNvbnN0IGl0ZW1zID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgLy8gICAgIGRpcm5hbWU6IHsgZXE6IGRpcm5hbWUgfSxcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0hUTUw6IHRydWVcbiAgICAgICAgLy8gfSkgYXMgdW5rbm93bltdIGFzIGFueVtdO1xuXG4gICAgICAgIC8vIGNvbnN0IGNoaWxkRm9sZGVycyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChcbiAgICAgICAgLy8gICAgIGBTRUxFQ1QgZGlzdGluY3QgZGlybmFtZSBGUk9NIERPQ1VNRU5UU1xuICAgICAgICAvLyAgICAgV0hFUkUgcGFyZW50RGlyID0gJyR7ZGlybmFtZX0nYFxuICAgICAgICAvLyApIGFzIHVua25vd25bXSBhcyBEb2N1bWVudFtdO1xuXG4gICAgICAgIC8vIGNvbnN0IGNmcyA9IFtdO1xuICAgICAgICAvLyBmb3IgKGNvbnN0IGNmIG9mIGNoaWxkRm9sZGVycykge1xuICAgICAgICAvLyAgICAgY2ZzLnB1c2goYXdhaXQgdGhpcy5jaGlsZEl0ZW1UcmVlKFxuICAgICAgICAvLyAgICAgICAgIHBhdGguam9pbihjZi5kaXJuYW1lLCAnaW5kZXguaHRtbCcpXG4gICAgICAgIC8vICAgICApKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIC8vIHJldHVybiB7XG4gICAgICAgIC8vICAgICByb290SXRlbSxcbiAgICAgICAgLy8gICAgIGRpcm5hbWUsXG4gICAgICAgIC8vICAgICBpdGVtczogaXRlbXMsXG4gICAgICAgIC8vICAgICAvLyBVbmNvbW1lbnQgdGhpcyB0byBnZW5lcmF0ZSBzaW1wbGlmaWVkIG91dHB1dFxuICAgICAgICAvLyAgICAgLy8gZm9yIGRlYnVnZ2luZy5cbiAgICAgICAgLy8gICAgIC8vIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgIC8vICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gICAgIC8vICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgIC8vICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAvLyAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gICAgIC8vIH0pLFxuICAgICAgICAvLyAgICAgY2hpbGRGb2xkZXJzOiBjZnNcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGluZGV4IGZpbGVzIChyZW5kZXJzIHRvIGluZGV4Lmh0bWwpXG4gICAgICogd2l0aGluIHRoZSBuYW1lZCBzdWJ0cmVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGluZGV4RmlsZXMocm9vdFBhdGg/OiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsbHkgYXBwZW5kYWJsZSBzdWItcXVlcnlcbiAgICAgICAgLy8gdG8gaGFuZGxlIHdoZW4gcm9vdFBhdGggaXMgc3BlY2lmaWVkXG4gICAgICAgIGxldCByb290USA9IChcbiAgICAgICAgICAgICAgICB0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgJiYgcm9vdFAubGVuZ3RoID49IDFcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgID8gYEFORCAoIHJlbmRlclBhdGggTElLRSAnJHtyb290UH0lJyApYFxuICAgICAgICAgICAgOiAnJztcblxuICAgICAgICAvLyByZXR1cm4gdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgLy8gU0VMRUNUICpcbiAgICAgICAgLy8gRlJPTSBET0NVTUVOVFNcbiAgICAgICAgLy8gV0hFUkVcbiAgICAgICAgLy8gICAgICggcmVuZGVyc1RvSFRNTCA9IHRydWUgKVxuICAgICAgICAvLyBBTkQgKFxuICAgICAgICAvLyAgICAgKCByZW5kZXJQYXRoIExJS0UgJyUvaW5kZXguaHRtbCcgKVxuICAgICAgICAvLyAgT1IgKCByZW5kZXJQYXRoID0gJ2luZGV4Lmh0bWwnIClcbiAgICAgICAgLy8gKVxuICAgICAgICAvLyAke3Jvb3RRfVxuICAgICAgICAvLyBgKTtcbiAgICAgICAgXG5cbiAgICAgICAgLy8gSXQncyBwcm92ZWQgZGlmZmljdWx0IHRvIGdldCB0aGUgcmVnZXhwXG4gICAgICAgIC8vIHRvIHdvcmsgaW4gdGhpcyBtb2RlOlxuICAgICAgICAvL1xuICAgICAgICAvLyByZXR1cm4gYXdhaXQgdGhpcy5zZWFyY2goe1xuICAgICAgICAvLyAgICAgcmVuZGVyc1RvSFRNTDogdHJ1ZSxcbiAgICAgICAgLy8gICAgIHJlbmRlcnBhdGhtYXRjaDogL1xcL2luZGV4Lmh0bWwkLyxcbiAgICAgICAgLy8gICAgIHJvb3RQYXRoOiByb290UGF0aFxuICAgICAgICAvLyB9KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogRm9yIGV2ZXJ5IGZpbGUgaW4gdGhlIGRvY3VtZW50cyBjYWNoZSxcbiAgICAgKiBzZXQgdGhlIGFjY2VzcyBhbmQgbW9kaWZpY2F0aW9ucy5cbiAgICAgKlxuICAgICAqID8/Pz8/IFdoeSB3b3VsZCB0aGlzIGJlIHVzZWZ1bD9cbiAgICAgKiBJIGNhbiBzZWUgZG9pbmcgdGhpcyBmb3IgdGhlIHJlbmRlcmVkXG4gICAgICogZmlsZXMgaW4gdGhlIG91dHB1dCBkaXJlY3RvcnkuICBCdXQgdGhpcyBpc1xuICAgICAqIGZvciB0aGUgZmlsZXMgaW4gdGhlIGRvY3VtZW50cyBkaXJlY3Rvcmllcy4gPz8/P1xuICAgICAqL1xuICAgIGFzeW5jIHNldFRpbWVzKCkge1xuICAgICAgICAvLyBhd2FpdCB0aGlzLmRhby5zZWxlY3RFYWNoKFxuICAgICAgICAvLyAgICAgKGVyciwgbW9kZWwpID0+IHtcblxuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHNldHRlciA9IGFzeW5jIChkYXRlKSA9PiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IERhdGUucGFyc2UoZGF0ZSk7O1xuICAgICAgICAvLyAgICAgICAgICAgICBpZiAoISBpc05hTihwYXJzZWQpKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBjb25zdCBkcCA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBGUy51dGltZXNTeW5jKFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIG1vZGVsLmZzcGF0aCxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICBkcCxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICBkcFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgLy8gICAgICAgICAgICAgfSBcbiAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgIC8vICAgICAgICAgaWYgKG1vZGVsLmluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgLy8gICAgICAgICAgJiYgbW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSkge1xuICAgICAgICAvLyAgICAgICAgICAgICBzZXR0ZXIobW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSk7XG4gICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAvLyAgICAgICAgIGlmIChtb2RlbC5pbmZvLmRvY01ldGFkYXRhXG4gICAgICAgIC8vICAgICAgICAgICYmIG1vZGVsLmluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgIHNldHRlcihtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAvLyAgICAgfSxcbiAgICAgICAgLy8gICAgIHt9IGFzIFdoZXJlPERvY3VtZW50PlxuICAgICAgICAvLyApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlIHRoZSBkb2N1bWVudHMgd2hpY2ggaGF2ZSB0YWdzLlxuICAgICAqIFxuICAgICAqIFRPRE8gLSBJcyB0aGlzIGZ1bmN0aW9uIHVzZWQgYW55d2hlcmU/XG4gICAgICogICBJdCBpcyBub3QgcmVmZXJlbmNlZCBpbiBha2FzaGFyZW5kZXIsIG5vclxuICAgICAqICAgaW4gYW55IHBsdWdpbiB0aGF0IEkgY2FuIGZpbmQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICAvLyBhc3luYyBkb2N1bWVudHNXaXRoVGFncygpIHtcbiAgICAvLyAgICAgY29uc3QgZG9jcyA9IG5ldyBBcnJheTxEb2N1bWVudD4oKTtcbiAgICAvLyAgICAgYXdhaXQgdGhpcy5kYW8uc2VsZWN0RWFjaChcbiAgICAvLyAgICAgICAgIChlcnIsIGRvYykgPT4ge1xuICAgIC8vICAgICAgICAgICAgIGlmIChkb2NcbiAgICAvLyAgICAgICAgICAgICAgJiYgZG9jLmRvY01ldGFkYXRhXG4gICAgLy8gICAgICAgICAgICAgICYmIGRvYy5kb2NNZXRhZGF0YS50YWdzXG4gICAgLy8gICAgICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkoXG4gICAgLy8gICAgICAgICAgICAgICAgIGRvYy5kb2NNZXRhZGF0YS50YWdzXG4gICAgLy8gICAgICAgICAgICAgIClcbiAgICAvLyAgICAgICAgICAgICAgJiYgZG9jLmRvY01ldGFkYXRhLnRhZ3MubGVuZ3RoID49IDFcbiAgICAvLyAgICAgICAgICAgICApIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgZG9jcy5wdXNoKGRvYyk7XG4gICAgLy8gICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgfSxcbiAgICAvLyAgICAgICAgIHtcbiAgICAvLyAgICAgICAgICAgICByZW5kZXJzVG9IVE1MOiB7IGVxOiB0cnVlIH0sXG4gICAgLy8gICAgICAgICAgICAgaW5mbzogeyBpc05vdE51bGw6IHRydWUgfVxuICAgIC8vICAgICAgICAgfSBhcyBXaGVyZTxEb2N1bWVudD5cbiAgICAvLyAgICAgKTtcblxuICAgIC8vICAgICAvLyBjb25zb2xlLmxvZyhkb2NzKTtcbiAgICAvLyAgICAgcmV0dXJuIGRvY3M7XG4gICAgLy8gfVxuXG4gICAgYXN5bmMgZG9jdW1lbnRzV2l0aFRhZyh0YWdubTogc3RyaW5nIHwgc3RyaW5nW10pXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxzdHJpbmc+PlxuICAgIHtcbiAgICAgICAgbGV0IHRhZ3M6IHN0cmluZ1tdO1xuICAgICAgICBpZiAodHlwZW9mIHRhZ25tID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGFncyA9IFsgdGFnbm0gXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRhZ25tKSkge1xuICAgICAgICAgICAgdGFncyA9IHRhZ25tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudHNXaXRoVGFnIGdpdmVuIGJhZCB0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KHRhZ25tKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvcnJlY3RseSBoYW5kbGUgdGFnIHN0cmluZ3Mgd2l0aFxuICAgICAgICAvLyB2YXJ5aW5nIHF1b3Rlcy4gIEEgZG9jdW1lbnQgbWlnaHQgaGF2ZSB0aGVzZSB0YWdzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICB0YWdzOlxuICAgICAgICAvLyAgICAtIFRlYXNlcidzXG4gICAgICAgIC8vICAgIC0gVGVhc2Vyc1xuICAgICAgICAvLyAgICAtIFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZXNlIFNRTCBxdWVyaWVzIHdvcms6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVvdGVkXCInLCBcIlRlYXNlcidzXCIgKTtcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxUZWFzZXInc1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVvdGVkXCInLCAnVGVhc2VyJydzJyApO1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFRlYXNlcidzXG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8U29tZXRoaW5nIFwicXVvdGVkXCJcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQnV0LCB0aGlzIGRvZXMgbm90OlxuICAgICAgICAvL1xuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lID0gJ1RlYXNlcidzJztcbiAgICAgICAgLy8gJyAgLi4uPiBcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIG9yaWdpbmFsIGNvZGUgYmVoYXZpb3Igd2FzIHRoaXM6XG4gICAgICAgIC8vXG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInNcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuIGF0dGVtcHRlZCBmaXg6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgXCJUZWFzZXInc1wiIF0gICggJ1RlYXNlclxcJ3MnICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwic1wiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5vdGhlciBhdHRlbXB0ZWQgZml4OlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiBdICAoIFwiVGVhc2VyJydzXCIgKSBcbiAgICAgICAgLy8gW11cbiAgICAgICAgLy8gW11cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5kOlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyAnU29tZXRoaW5nIFwicXVvdGVkXCInXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyAnU29tZXRoaW5nIFwicXVvdGVkXCInIF0gICggXCJTb21ldGhpbmcgXCJxdW90ZWRcIlwiICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwicXVvdGVkXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgY29kZSBiZWxvdyBwcm9kdWNlczpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiICdTb21ldGhpbmcgXCJxdW90ZWRcIidcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiwgJ1NvbWV0aGluZyBcInF1b3RlZFwiJyBdICAoICdUZWFzZXInJ3MnLCdTb21ldGhpbmcgXCJxdW90ZWRcIicgKSBcbiAgICAgICAgLy8gWyB7IHZwYXRoOiAndGVhc2VyLWNvbnRlbnQuaHRtbC5tZCcgfSBdXG4gICAgICAgIC8vIFsgJ3RlYXNlci1jb250ZW50Lmh0bWwubWQnIF1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZG9jdW1lbnRzV2l0aFRhZyAke3V0aWwuaW5zcGVjdCh0YWdzKX0gJHt0YWdzdHJpbmd9YCk7XG5cbiAgICAgICAgY29uc3QgdnBhdGhzID0gYXdhaXQgdGdsdWUucGF0aHNGb3JUYWcodGFncyk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zb2xlLmxvZyh2cGF0aHMpO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2cGF0aHMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50c1dpdGhUYWcgbm9uLUFycmF5IHJlc3VsdCAke3V0aWwuaW5zcGVjdCh2cGF0aHMpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZwYXRocztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gYXJyYXkgb2YgdGFncyB1c2VkIGJ5IGFsbCBkb2N1bWVudHMuXG4gICAgICogVGhpcyB1c2VzIHRoZSBKU09OIGV4dGVuc2lvbiB0byBleHRyYWN0XG4gICAgICogdGhlIHRhZ3MgZnJvbSB0aGUgbWV0YWRhdGEgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgdGFncygpIHtcbiAgICAgICAgY29uc3QgdGFncyA9IGF3YWl0IHRnbHVlLnRhZ3MoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHJldCA9IEFycmF5LmZyb20odGFncyk7XG4gICAgICAgIHJldHVybiByZXQuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHZhciB0YWdBID0gYS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIHRhZ0IgPSBiLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAodGFnQSA8IHRhZ0IpIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmICh0YWdBID4gdGFnQikgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIGRhdGEgZm9yIGFuIGludGVybmFsIGxpbmtcbiAgICAgKiB3aXRoaW4gdGhlIHNpdGUgZG9jdW1lbnRzLiAgRm9ybWluZyBhblxuICAgICAqIGludGVybmFsIGxpbmsgaXMgYXQgYSBtaW5pbXVtIHRoZSByZW5kZXJlZFxuICAgICAqIHBhdGggZm9yIHRoZSBkb2N1bWVudCBhbmQgaXRzIHRpdGxlLlxuICAgICAqIFRoZSB0ZWFzZXIsIGlmIGF2YWlsYWJsZSwgY2FuIGJlIHVzZWQgaW5cbiAgICAgKiBhIHRvb2x0aXAuIFRoZSB0aHVtYm5haWwgaXMgYW4gaW1hZ2UgdGhhdFxuICAgICAqIGNvdWxkIGJlIGRpc3BsYXllZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBkb2NMaW5rRGF0YSh2cGF0aDogc3RyaW5nKSAvKjogUHJvbWlzZTx7XG5cbiAgICAgICAgLy8gVGhlIHZwYXRoIHJlZmVyZW5jZVxuICAgICAgICB2cGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgcGF0aCBpdCByZW5kZXJzIHRvXG4gICAgICAgIHJlbmRlclBhdGg6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIHRpdGxlIHN0cmluZyBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0aXRsZTogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGVhc2VyIHRleHQgZnJvbSB0aGF0IHBhZ2VcbiAgICAgICAgdGVhc2VyPzogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgaGVybyBpbWFnZSAodGh1bWJuYWlsKVxuICAgICAgICB0aHVtYm5haWw/OiBzdHJpbmc7XG4gICAgfT4gKi8ge1xuXG4gICAgICAgIC8vIGNvbnN0IGZvdW5kID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgLy8gICAgIFNFTEVDVCAqXG4gICAgICAgIC8vICAgICBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgLy8gICAgIFdIRVJFIFxuICAgICAgICAvLyAgICAgdnBhdGggPSAkdnBhdGggT1IgcmVuZGVyUGF0aCA9ICR2cGF0aFxuICAgICAgICAvLyBgLCB7XG4gICAgICAgIC8vICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIC8vIGlmIChBcnJheS5pc0FycmF5KGZvdW5kKSkge1xuXG4gICAgICAgIC8vICAgICAvLyBjb25zdCBkb2NJbmZvID0gYXdhaXQgdGhpcy5maW5kKHZwYXRoKTtcbiAgICAgICAgLy8gICAgIHJldHVybiB7XG4gICAgICAgIC8vICAgICAgICAgdnBhdGgsXG4gICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogZm91bmRbMF0ucmVuZGVyUGF0aCxcbiAgICAgICAgLy8gICAgICAgICB0aXRsZTogZm91bmRbMF0ubWV0YWRhdGEudGl0bGUsXG4gICAgICAgIC8vICAgICAgICAgdGVhc2VyOiBmb3VuZFswXS5tZXRhZGF0YS50ZWFzZXIsXG4gICAgICAgIC8vICAgICAgICAgLy8gdGh1bWJuYWlsXG4gICAgICAgIC8vICAgICB9O1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gICAgICAgICB2cGF0aCxcbiAgICAgICAgLy8gICAgICAgICByZW5kZXJQYXRoOiB1bmRlZmluZWQsXG4gICAgICAgIC8vICAgICAgICAgdGl0bGU6IHVuZGVmaW5lZFxuICAgICAgICAvLyAgICAgfTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIC8vIFRoaXMgaXMgYSBzaW1wbGUgY2FjaGUgdG8gaG9sZCByZXN1bHRzXG4gICAgLy8gb2Ygc2VhcmNoIG9wZXJhdGlvbnMuICBUaGUga2V5IHNpZGUgb2YgdGhpc1xuICAgIC8vIE1hcCBpcyBtZWFudCB0byBiZSB0aGUgc3RyaW5naWZpZWQgc2VsZWN0b3IuXG4gICAgcHJpdmF0ZSBzZWFyY2hDYWNoZSA9IG5ldyBNYXA8XG4gICAgICAgICAgICBzdHJpbmcsIHsgcmVzdWx0czogRG9jdW1lbnRbXSwgdGltZXN0YW1wOiBudW1iZXIgfVxuICAgID4oKTtcblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gZGVzY3JpcHRpdmUgc2VhcmNoIG9wZXJhdGlvbnMgdXNpbmcgZGlyZWN0IFNRTCBxdWVyaWVzXG4gICAgICogZm9yIGJldHRlciBwZXJmb3JtYW5jZSBhbmQgc2NhbGFiaWxpdHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBTZWFyY2ggb3B0aW9ucyBvYmplY3RcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlPEFycmF5PERvY3VtZW50Pj5cbiAgICAgKi9cbiAgICBhc3luYyBzZWFyY2gob3B0aW9ucyk6IFByb21pc2U8QXJyYXk8RG9jdW1lbnQ+PiB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgLy8gRmlyc3QsIHNlZSBpZiB0aGUgc2VhcmNoIHJlc3VsdHMgYXJlIGFscmVhZHlcbiAgICAgICAgLy8gY29tcHV0ZWQgYW5kIGluIHRoZSBjYWNoZS5cblxuICAgICAgICAvLyBUaGUgaXNzdWUgaGVyZSBpcyB0aGF0IHRoZSBvcHRpb25zXG4gICAgICAgIC8vIG9iamVjdCBjYW4gY29udGFpbiBSZWdFeHAgdmFsdWVzLlxuICAgICAgICAvLyBUaGUgUmVnRXhwIG9iamVjdCBkb2VzIG5vdCBoYXZlXG4gICAgICAgIC8vIGEgdG9KU09OIGZ1bmN0aW9uLiAgVGhpcyBob29rXG4gICAgICAgIC8vIGNhdXNlcyBSZWdFeHAgdG8gcmV0dXJuIHRoZVxuICAgICAgICAvLyAudG9TdHJpbmcoKSB2YWx1ZSBpbnN0ZWFkLlxuICAgICAgICAvL1xuICAgICAgICAvLyBTb3VyY2U6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIwMjc2NTMxL3N0cmluZ2lmeWluZy1hLXJlZ3VsYXItZXhwcmVzc2lvblxuICAgICAgICAvL1xuICAgICAgICAvLyBBIHNpbWlsYXIgaXNzdWUgZXhpc3RzIHdpdGggRnVuY3Rpb25zXG4gICAgICAgIC8vIGluIHRoZSBvYmplY3QuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFNvdXJjZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjc1NDkxOS9qc29uLXN0cmluZ2lmeS1mdW5jdGlvblxuICAgICAgICBjb25zdCBjYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlICsgJyc7IC8vIGltcGxpY2l0bHkgYHRvU3RyaW5nYCBpdFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMuc2VhcmNoQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfSA9PT4gJHtjYWNoZUtleX0gJHtjYWNoZWQgPyAnaGFzQ2FjaGVkJyA6ICdub0NhY2hlZCd9YCk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGNhY2hlIGhhcyBhbiBlbnRyeSwgc2tpcCBjb21wdXRpbmdcbiAgICAgICAgLy8gYW55dGhpbmcuXG4gICAgICAgIGlmIChjYWNoZWRcbiAgICAgICAgICYmIERhdGUubm93KCkgLSBjYWNoZWQudGltZXN0YW1wIDwgNjAwMDBcbiAgICAgICAgKSB7IC8vIDEgbWludXRlIGNhY2hlXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdHM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOT1RFOiBFbnRyaWVzIGFyZSBhZGRlZCB0byB0aGUgY2FjaGUgYXQgdGhlIGJvdHRvbVxuICAgICAgICAvLyBvZiB0aGlzIGZ1bmN0aW9uXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgc3FsLCBwYXJhbXMgfSA9IHRoaXMuYnVpbGRTZWFyY2hRdWVyeShvcHRpb25zKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggJHtzcWx9YCk7XG4gICAgICAgICAgICAvLyBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKHNxbCwgcGFyYW1zKTtcblxuICAgICAgICAgICAgLy8gQ29udmVydCByYXcgU1FMIHJlc3VsdHMgdG8gRG9jdW1lbnQgb2JqZWN0c1xuICAgICAgICAgICAgLy8gY29uc3QgZG9jdW1lbnRzID0gcmVzdWx0cy5tYXAocm93ID0+IHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihyb3cpO1xuICAgICAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgICAgIC8vIEdhdGhlciBhZGRpdGlvbmFsIGluZm8gZGF0YSBmb3IgZWFjaCByZXN1bHQgRklSU1RcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgY3J1Y2lhbCBiZWNhdXNlIGZpbHRlcnMgYW5kIHNvcnQgZnVuY3Rpb25zIG1heSBkZXBlbmQgb24gdGhpcyBkYXRhXG4gICAgICAgICAgICAvLyBmb3IgKGNvbnN0IGl0ZW0gb2YgZG9jdW1lbnRzKSB7XG4gICAgICAgICAgICAvLyAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpdGVtKTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgLy8gQXBwbHkgcG9zdC1TUUwgZmlsdGVycyB0aGF0IGNhbid0IGJlIGRvbmUgaW4gU1FMXG4gICAgICAgICAgICBsZXQgZmlsdGVyZWRSZXN1bHRzID0gW107IC8vIGRvY3VtZW50cztcblxuICAgICAgICAgICAgLy8gRmlsdGVyIGJ5IHJlbmRlcmVycyAocmVxdWlyZXMgY29uZmlnIGxvb2t1cClcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbmRlcmVyc1xuICAgICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkob3B0aW9ucy5yZW5kZXJlcnMpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFJlc3VsdHMgPSBmaWx0ZXJlZFJlc3VsdHMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBsZXQgcmVuZGVyZXIgPSBmY2FjaGUuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoaXRlbS52cGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmICghcmVuZGVyZXIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAvLyBmb3IgKGNvbnN0IHIgb2Ygb3B0aW9ucy5yZW5kZXJlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmICh0eXBlb2YgciA9PT0gJ3N0cmluZycgJiYgciA9PT0gcmVuZGVyZXIubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIH0gZWxzZSBpZiAodHlwZW9mIHIgPT09ICdvYmplY3QnIHx8IHR5cGVvZiByID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgY29uc29sZS5lcnJvcignV0FSTklORzogTWF0Y2hpbmcgcmVuZGVyZXIgYnkgb2JqZWN0IGNsYXNzIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnLCByKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFwcGx5IGN1c3RvbSBmaWx0ZXIgZnVuY3Rpb25cbiAgICAgICAgICAgIC8vIGlmIChvcHRpb25zLmZpbHRlcmZ1bmMpIHtcbiAgICAgICAgICAgIC8vICAgICBmaWx0ZXJlZFJlc3VsdHMgPSBmaWx0ZXJlZFJlc3VsdHMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gICAgICAgICByZXR1cm4gb3B0aW9ucy5maWx0ZXJmdW5jKGZjYWNoZS5jb25maWcsIG9wdGlvbnMsIGl0ZW0pO1xuICAgICAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAvLyBBcHBseSBjdXN0b20gc29ydCBmdW5jdGlvbiAoaWYgU1FMIHNvcnRpbmcgd2Fzbid0IHVzZWQpXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc29ydEZ1bmMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFJlc3VsdHMgPSBmaWx0ZXJlZFJlc3VsdHMuc29ydChvcHRpb25zLnNvcnRGdW5jKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQWRkIHRoZSByZXN1bHRzIHRvIHRoZSBjYWNoZVxuICAgICAgICAgICAgaWYgKHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaENhY2hlLnNldChjYWNoZUtleSwge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzOiBmaWx0ZXJlZFJlc3VsdHMsIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlcmVkUmVzdWx0cztcblxuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNGaWxlQ2FjaGUuc2VhcmNoIGVycm9yOiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQnVpbGQgU1FMIHF1ZXJ5IGFuZCBwYXJhbWV0ZXJzIGZvciBzZWFyY2ggb3B0aW9uc1xuICAgICAqL1xuICAgIHByaXZhdGUgYnVpbGRTZWFyY2hRdWVyeShvcHRpb25zKToge1xuICAgICAgICBzcWw6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiBhbnlcbiAgICB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICAgICAgY29uc3Qgd2hlcmVDbGF1c2VzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBqb2luczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgbGV0IHBhcmFtQ291bnRlciA9IDA7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGJ1aWxkU2VhcmNoUXVlcnkgJHt1dGlsLmluc3BlY3Qob3B0aW9ucyl9YCk7XG5cbiAgICAgICAgLy8gSGVscGVyIHRvIGNyZWF0ZSB1bmlxdWUgcGFyYW1ldGVyIG5hbWVzXG4gICAgICAgIGNvbnN0IGFkZFBhcmFtID0gKHZhbHVlOiBhbnkpOiBzdHJpbmcgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyYW1OYW1lID0gYCRwYXJhbSR7KytwYXJhbUNvdW50ZXJ9YDtcbiAgICAgICAgICAgIHBhcmFtc1twYXJhbU5hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1OYW1lO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEJhc2UgcXVlcnlcbiAgICAgICAgbGV0IHNxbCA9IGBTRUxFQ1QgRElTVElOQ1QgZC4qIEZST00gJCB7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX0gZGA7XG5cbiAgICAgICAgLy8gTUlNRSB0eXBlIGZpbHRlcmluZ1xuICAgICAgICBpZiAob3B0aW9ucy5taW1lKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubWltZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5taW1lID0gJHthZGRQYXJhbShvcHRpb25zLm1pbWUpfWApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMubWltZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGFjZWhvbGRlcnMgPSBvcHRpb25zLm1pbWUubWFwKG1pbWUgPT4gYWRkUGFyYW0obWltZSkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubWltZSBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVuZGVycyB0byBIVE1MIGZpbHRlcmluZ1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmVuZGVyc1RvSFRNTCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5yZW5kZXJzVG9IVE1MID0gJHthZGRQYXJhbShvcHRpb25zLnJlbmRlcnNUb0hUTUwgPyAxIDogMCl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSb290IHBhdGggZmlsdGVyaW5nXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yb290UGF0aCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggTElLRSAke2FkZFBhcmFtKG9wdGlvbnMucm9vdFBhdGggKyAnJScpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2xvYiBwYXR0ZXJuIG1hdGNoaW5nXG4gICAgICAgIGlmIChvcHRpb25zLmdsb2IgJiYgdHlwZW9mIG9wdGlvbnMuZ2xvYiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnN0IGVzY2FwZWRHbG9iID0gb3B0aW9ucy5nbG9iLmluZGV4T2YoXCInXCIpID49IDAgXG4gICAgICAgICAgICAgICAgPyBvcHRpb25zLmdsb2IucmVwbGFjZUFsbChcIidcIiwgXCInJ1wiKSBcbiAgICAgICAgICAgICAgICA6IG9wdGlvbnMuZ2xvYjtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnZwYXRoIEdMT0IgJHthZGRQYXJhbShlc2NhcGVkR2xvYil9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW5kZXIgZ2xvYiBwYXR0ZXJuIG1hdGNoaW5nXG4gICAgICAgIGlmIChvcHRpb25zLnJlbmRlcmdsb2IgJiYgdHlwZW9mIG9wdGlvbnMucmVuZGVyZ2xvYiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnN0IGVzY2FwZWRHbG9iID0gb3B0aW9ucy5yZW5kZXJnbG9iLmluZGV4T2YoXCInXCIpID49IDAgXG4gICAgICAgICAgICAgICAgPyBvcHRpb25zLnJlbmRlcmdsb2IucmVwbGFjZUFsbChcIidcIiwgXCInJ1wiKSBcbiAgICAgICAgICAgICAgICA6IG9wdGlvbnMucmVuZGVyZ2xvYjtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggR0xPQiAke2FkZFBhcmFtKGVzY2FwZWRHbG9iKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJsb2cgdGFnIGZpbHRlcmluZ1xuICAgICAgICAvLyBFbnN1cmUgdGhhdCB0aGUgYmxvZ3RhZ3MgYXJyYXkgaXMgdXNlZCxcbiAgICAgICAgLy8gaWYgcHJlc2VudCwgd2l0aCB0aGUgYmxvZ3RhZyB2YWx1ZSB1c2VkXG4gICAgICAgIC8vIG90aGVyd2lzZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIHB1cnBvc2UgZm9yIHRoZSBibG9ndGFncyB2YWx1ZSBpcyB0b1xuICAgICAgICAvLyBzdXBwb3J0IGEgcHNldWRvLWJsb2cgbWFkZSBvZiB0aGUgaXRlbXNcbiAgICAgICAgLy8gZnJvbSBtdWx0aXBsZSBhY3R1YWwgYmxvZ3MuXG4gICAgICAgIC8vIGlmICh0eXBlb2Ygb3B0aW9ucy5ibG9ndGFncyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgLy8gIHx8IHR5cGVvZiBvcHRpb25zLmJsb2d0YWcgIT09ICd1bmRlZmluZWQnXG4gICAgICAgIC8vICkge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYCBibG9ndGFncyAke3V0aWwuaW5zcGVjdChvcHRpb25zLmJsb2d0YWdzKX0gYmxvZ3RhZyAke3V0aWwuaW5zcGVjdChvcHRpb25zLmJsb2d0YWcpfWApO1xuICAgICAgICAvLyB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMuYmxvZ3RhZ3MpKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFjZWhvbGRlcnMgPSBvcHRpb25zLmJsb2d0YWdzLm1hcCh0YWcgPT4gYWRkUGFyYW0odGFnKSkuam9pbignLCAnKTtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmJsb2d0YWcgSU4gKCR7cGxhY2Vob2xkZXJzfSlgKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLmJsb2d0YWcgSU4gKCR7cGxhY2Vob2xkZXJzfSlgKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucy5ibG9ndGFnID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQuYmxvZ3RhZyA9ICR7YWRkUGFyYW0ob3B0aW9ucy5ibG9ndGFnKX1gKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkLmJsb2d0YWcgPSAke29wdGlvbnMuYmxvZ3RhZ31gKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucy5ibG9ndGFncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgYmxvZ3RhZ3MgYXJyYXkgJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5ibG9ndGFncyl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWcgZmlsdGVyaW5nIHVzaW5nIFRBR0dMVUUgdGFibGVcbiAgICAgICAgaWYgKG9wdGlvbnMudGFnICYmIHR5cGVvZiBvcHRpb25zLnRhZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGpvaW5zLnB1c2goYElOTkVSIEpPSU4gVEFHR0xVRSB0ZyBPTiBkLnZwYXRoID0gdGcuZG9jdnBhdGhgKTtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGB0Zy50YWdOYW1lID0gJHthZGRQYXJhbShvcHRpb25zLnRhZyl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBMYXlvdXQgZmlsdGVyaW5nXG4gICAgICAgIGlmIChvcHRpb25zLmxheW91dHMpIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMubGF5b3V0cykpIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5sYXlvdXRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5sYXlvdXQgPSAke2FkZFBhcmFtKG9wdGlvbnMubGF5b3V0c1swXSl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmxheW91dHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwbGFjZWhvbGRlcnMgPSBvcHRpb25zLmxheW91dHMubWFwKGxheW91dCA9PiBhZGRQYXJhbShsYXlvdXQpKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5sYXlvdXQgSU4gKCR7cGxhY2Vob2xkZXJzfSlgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5sYXlvdXRzKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBhdGggcmVnZXggbWF0Y2hpbmdcbiAgICAgICAgY29uc3QgcmVnZXhDbGF1c2VzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucGF0aG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQudnBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5wYXRobWF0Y2gpfWApO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMucGF0aG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnBhdGhtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5wYXRobWF0Y2gpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIG9wdGlvbnMucGF0aG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQudnBhdGggcmVnZXhwICR7YWRkUGFyYW0obWF0Y2gpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQudnBhdGggcmVnZXhwICR7YWRkUGFyYW0obWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHBhdGhtYXRjaCByZWdleHAgJHt1dGlsLmluc3BlY3QobWF0Y2gpfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgncGF0aG1hdGNoJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHBhdGhtYXRjaCAke3V0aWwuaW5zcGVjdChvcHRpb25zLnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW5kZXIgcGF0aCByZWdleCBtYXRjaGluZ1xuICAgICAgICAvLyBpZiAodHlwZW9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2codXRpbC5pbnNwZWN0KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoLCBmYWxzZSwgMykpO1xuICAgICAgICAvLyB9XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZC5yZW5kZXJQYXRoIHJlZ2V4cCBzdHJpbmcgJHtvcHRpb25zLnJlbmRlcnBhdGhtYXRjaH1gKTtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpfWApO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMucmVuZGVycGF0aG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZC5yZW5kZXJQYXRoIHJlZ2V4cCByZWdleHAgJHtvcHRpb25zLnJlbmRlcnBhdGhtYXRjaC5zb3VyY2V9YCk7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucmVuZGVycGF0aG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZC5yZW5kZXJQYXRoIHJlZ2V4cCBhcnJheSBzdHJpbmcgJHttYXRjaH1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZC5yZW5kZXJQYXRoIHJlZ2V4cCBhcnJheSByZWdleHAgJHttYXRjaC5zb3VyY2V9YCk7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0obWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHJlbmRlcnBhdGhtYXRjaCByZWdleHAgJHt1dGlsLmluc3BlY3QobWF0Y2gpfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgncmVuZGVycGF0aG1hdGNoJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHJlbmRlcnBhdGhtYXRjaCAke3V0aWwuaW5zcGVjdChvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVnZXhDbGF1c2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGAoJHtyZWdleENsYXVzZXMuam9pbignIE9SICcpfSlgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBKT0lOcyB0byBxdWVyeVxuICAgICAgICBpZiAoam9pbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3FsICs9ICcgJyArIGpvaW5zLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBXSEVSRSBjbGF1c2VcbiAgICAgICAgaWYgKHdoZXJlQ2xhdXNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzcWwgKz0gJyBXSEVSRSAnICsgd2hlcmVDbGF1c2VzLmpvaW4oJyBBTkQgJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgT1JERVIgQlkgY2xhdXNlXG4gICAgICAgIGxldCBvcmRlckJ5ID0gJyc7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zb3J0QnkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGUgc3BlY2lhbCBjYXNlcyB0aGF0IG5lZWQgSlNPTiBleHRyYWN0aW9uIG9yIGNvbXBsZXggbG9naWNcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNvcnRCeSA9PT0gJ3B1YmxpY2F0aW9uRGF0ZScgfHwgb3B0aW9ucy5zb3J0QnkgPT09ICdwdWJsaWNhdGlvblRpbWUnKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIENPQUxFU0NFIHRvIGhhbmRsZSBudWxsIHB1YmxpY2F0aW9uIGRhdGVzXG4gICAgICAgICAgICAgICAgb3JkZXJCeSA9IGBPUkRFUiBCWSBDT0FMRVNDRShcbiAgICAgICAgICAgICAgICAgICAganNvbl9leHRyYWN0KGQubWV0YWRhdGEsICckLnB1YmxpY2F0aW9uRGF0ZScpLCBcbiAgICAgICAgICAgICAgICAgICAgZC5tdGltZU1zXG4gICAgICAgICAgICAgICAgKWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgb3RoZXIgZmllbGRzLCBzb3J0IGJ5IHRoZSBjb2x1bW4gZGlyZWN0bHlcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGFsbG93cyBzb3J0aW5nIGJ5IGFueSB2YWxpZCBjb2x1bW4gaW4gdGhlIERPQ1VNRU5UUyB0YWJsZVxuICAgICAgICAgICAgICAgIG9yZGVyQnkgPSBgT1JERVIgQlkgZC4ke29wdGlvbnMuc29ydEJ5fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZXZlcnNlIHx8IG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZykge1xuICAgICAgICAgICAgLy8gSWYgcmV2ZXJzZS9zb3J0QnlEZXNjZW5kaW5nIGlzIHNwZWNpZmllZCB3aXRob3V0IHNvcnRCeSwgXG4gICAgICAgICAgICAvLyB1c2UgYSBkZWZhdWx0IG9yZGVyaW5nIChieSBtb2RpZmljYXRpb24gdGltZSlcbiAgICAgICAgICAgIG9yZGVyQnkgPSAnT1JERVIgQlkgZC5tdGltZU1zJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBzb3J0IGRpcmVjdGlvblxuICAgICAgICBpZiAob3JkZXJCeSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZyB8fCBvcHRpb25zLnJldmVyc2UpIHtcbiAgICAgICAgICAgICAgICBvcmRlckJ5ICs9ICcgREVTQyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9yZGVyQnkgKz0gJyBBU0MnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3FsICs9ICcgJyArIG9yZGVyQnk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgTElNSVQgYW5kIE9GRlNFVFxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubGltaXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBzcWwgKz0gYCBMSU1JVCAke2FkZFBhcmFtKG9wdGlvbnMubGltaXQpfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHNxbCArPSBgIE9GRlNFVCAke2FkZFBhcmFtKG9wdGlvbnMub2Zmc2V0KX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgc3FsLCBwYXJhbXMgfTtcbiAgICB9XG5cbiAgICAvLyBTa2lwIHRhZ3MgZm9yIG5vdy4gIFNob3VsZCBiZSBlYXN5LlxuXG4gICAgLy8gRm9yIHRhZ3Mgc3VwcG9ydCwgdGhpcyBjYW4gYmUgdXNlZnVsXG4gICAgLy8gIC0tIGh0dHBzOi8vYW50b256Lm9yZy9qc29uLXZpcnR1YWwtY29sdW1ucy9cbiAgICAvLyBJdCBzaG93cyBob3cgdG8gZG8gZ2VuZXJhdGVkIGNvbHVtbnNcbiAgICAvLyBmcm9tIGZpZWxkcyBpbiBKU09OXG5cbiAgICAvLyBCdXQsIGhvdyB0byBkbyBnZW5lcmF0ZWQgY29sdW1uc1xuICAgIC8vIHVzaW5nIFNRTElURTNPUk0/XG5cbiAgICAvLyBodHRwczovL2FudG9uei5vcmcvc3FsZWFuLXJlZ2V4cC8gLS0gUmVnRXhwXG4gICAgLy8gZXh0ZW5zaW9uIGZvciBTUUxJVEUzXG5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYXNnMDE3L3NxbGl0ZS1yZWdleCBpbmNsdWRlc1xuICAgIC8vIGEgbm9kZS5qcyBwYWNrYWdlXG4gICAgLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvc3FsaXRlLXJlZ2V4XG59XG5cbi8vIGV4cG9ydCB2YXIgYXNzZXRzQ2FjaGU6IEFzc2V0c0ZpbGVDYWNoZTwgQXNzZXQsIHR5cGVvZiBhc3NldHNEQU8+O1xuLy8gZXhwb3J0IHZhciBwYXJ0aWFsc0NhY2hlOiBUZW1wbGF0ZXNGaWxlQ2FjaGU8UGFydGlhbCwgdHlwZW9mIHBhcnRpYWxzREFPPjtcbi8vIGV4cG9ydCB2YXIgbGF5b3V0c0NhY2hlOiBUZW1wbGF0ZXNGaWxlQ2FjaGU8TGF5b3V0LCB0eXBlb2YgbGF5b3V0c0RBTz47XG4vLyBleHBvcnQgdmFyIGRvY3VtZW50c0NhY2hlOiBEb2N1bWVudHNGaWxlQ2FjaGU7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb25cbik6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgLy8gYXNzZXRzQ2FjaGUgPSBuZXcgQXNzZXRzRmlsZUNhY2hlPEFzc2V0LCBUYXNzZXRzREFPPihcbiAgICAvLyAgICAgY29uZmlnLFxuICAgIC8vICAgICAnYXNzZXRzJyxcbiAgICAvLyAgICAgY29uZmlnLmFzc2V0RGlycyxcbiAgICAvLyAgICAgYXNzZXRzREFPXG4gICAgLy8gKTtcbiAgICAvLyBhd2FpdCBhc3NldHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgLy8gYXNzZXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAvLyAgICAgY29uc29sZS5lcnJvcihgYXNzZXRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICAvLyB9KTtcblxuICAgIC8vIHBhcnRpYWxzQ2FjaGUgPSBuZXcgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgIC8vICAgICAgICAgUGFydGlhbCwgVHBhcnRpYWxzREFPXG4gICAgLy8gPihcbiAgICAvLyAgICAgY29uZmlnLFxuICAgIC8vICAgICAncGFydGlhbHMnLFxuICAgIC8vICAgICBjb25maWcucGFydGlhbHNEaXJzLFxuICAgIC8vICAgICBwYXJ0aWFsc0RBTyxcbiAgICAvLyAgICAgXCJwYXJ0aWFsXCJcbiAgICAvLyApO1xuICAgIC8vIGF3YWl0IHBhcnRpYWxzQ2FjaGUuc2V0dXAoKTtcblxuICAgIC8vIHBhcnRpYWxzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAvLyAgICAgY29uc29sZS5lcnJvcihgcGFydGlhbHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChhcmdzKX1gKVxuICAgIC8vIH0pO1xuXG4gICAgLy8gbGF5b3V0c0NhY2hlID0gbmV3IFRlbXBsYXRlc0ZpbGVDYWNoZTxcbiAgICAvLyAgICAgICAgIExheW91dCwgVGxheW91dHNEQU9cbiAgICAvLyA+KFxuICAgIC8vICAgICBjb25maWcsXG4gICAgLy8gICAgICdsYXlvdXRzJyxcbiAgICAvLyAgICAgY29uZmlnLmxheW91dERpcnMsXG4gICAgLy8gICAgIGxheW91dHNEQU8sXG4gICAgLy8gICAgIFwibGF5b3V0XCJcbiAgICAvLyApO1xuICAgIC8vIGF3YWl0IGxheW91dHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgLy8gbGF5b3V0c0NhY2hlLm9uKCdlcnJvcicsICguLi5hcmdzKSA9PiB7XG4gICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoYGxheW91dHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChhcmdzKX1gKVxuICAgIC8vIH0pO1xuXG4gICAgLy8gLy8gY29uc29sZS5sb2coYERvY3VtZW50c0ZpbGVDYWNoZSAnZG9jdW1lbnRzJyAke3V0aWwuaW5zcGVjdChjb25maWcuZG9jdW1lbnREaXJzKX1gKTtcblxuICAgIC8vIGRvY3VtZW50c0NhY2hlID0gbmV3IERvY3VtZW50c0ZpbGVDYWNoZShcbiAgICAvLyAgICAgY29uZmlnLFxuICAgIC8vICAgICAnZG9jdW1lbnRzJyxcbiAgICAvLyAgICAgY29uZmlnLmRvY3VtZW50RGlyc1xuICAgIC8vICk7XG4gICAgLy8gYXdhaXQgZG9jdW1lbnRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIC8vIGRvY3VtZW50c0NhY2hlLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAvLyAgICAgY29uc29sZS5lcnJvcihgZG9jdW1lbnRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoZXJyKX1gKTtcbiAgICAvLyB9KTtcblxuICAgIC8vIGF3YWl0IGNvbmZpZy5ob29rUGx1Z2luQ2FjaGVTZXR1cCgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VGaWxlQ2FjaGVzKCkge1xuICAgIC8vIGlmIChkb2N1bWVudHNDYWNoZSkge1xuICAgIC8vICAgICBhd2FpdCBkb2N1bWVudHNDYWNoZS5jbG9zZSgpO1xuICAgIC8vICAgICBkb2N1bWVudHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICAvLyB9XG4gICAgLy8gaWYgKGFzc2V0c0NhY2hlKSB7XG4gICAgLy8gICAgIGF3YWl0IGFzc2V0c0NhY2hlLmNsb3NlKCk7XG4gICAgLy8gICAgIGFzc2V0c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIC8vIH1cbiAgICAvLyBpZiAobGF5b3V0c0NhY2hlKSB7XG4gICAgLy8gICAgIGF3YWl0IGxheW91dHNDYWNoZS5jbG9zZSgpO1xuICAgIC8vICAgICBsYXlvdXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgLy8gfVxuICAgIC8vIGlmIChwYXJ0aWFsc0NhY2hlKSB7XG4gICAgLy8gICAgIGF3YWl0IHBhcnRpYWxzQ2FjaGUuY2xvc2UoKTtcbiAgICAvLyAgICAgcGFydGlhbHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICAvLyB9XG59XG4iXX0=