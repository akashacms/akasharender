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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
import { field, id, index, table, schema, BaseDAO } from 'sqlite3orm';
import { sqdb } from '../sqdb.js';
import fastq from 'fastq';
import { TagGlue, TagDescriptions } from './tag-glue.js';
///////////// Assets table
let Asset = class Asset {
};
__decorate([
    id({
        name: 'vpath', dbtype: 'TEXT'
    }),
    index('asset_vpath'),
    __metadata("design:type", String)
], Asset.prototype, "vpath", void 0);
__decorate([
    field({
        name: 'mime', dbtype: 'TEXT'
    }),
    __metadata("design:type", String)
], Asset.prototype, "mime", void 0);
__decorate([
    field({
        name: 'mounted', dbtype: 'TEXT'
    }),
    index('asset_mounted'),
    __metadata("design:type", String)
], Asset.prototype, "mounted", void 0);
__decorate([
    field({
        name: 'mountPoint', dbtype: 'TEXT'
    }),
    index('asset_mountPoint'),
    __metadata("design:type", String)
], Asset.prototype, "mountPoint", void 0);
__decorate([
    field({
        name: 'pathInMounted', dbtype: 'TEXT'
    }),
    index('asset_pathInMounted'),
    __metadata("design:type", String)
], Asset.prototype, "pathInMounted", void 0);
__decorate([
    field({
        name: 'fspath', dbtype: 'TEXT'
    }),
    index('asset_fspath'),
    __metadata("design:type", String)
], Asset.prototype, "fspath", void 0);
__decorate([
    field({
        name: 'renderPath', dbtype: 'TEXT'
    }),
    index('asset_renderPath'),
    __metadata("design:type", String)
], Asset.prototype, "renderPath", void 0);
__decorate([
    field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    }),
    __metadata("design:type", String)
], Asset.prototype, "mtimeMs", void 0);
__decorate([
    field({
        name: 'info', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Asset.prototype, "info", void 0);
Asset = __decorate([
    table({
        name: 'ASSETS',
        withoutRowId: true,
    })
], Asset);
export { Asset };
await schema().createTable(sqdb, 'ASSETS');
export const assetsDAO = new BaseDAO(Asset, sqdb);
await assetsDAO.createIndex('asset_vpath');
await assetsDAO.createIndex('asset_mounted');
await assetsDAO.createIndex('asset_mountPoint');
await assetsDAO.createIndex('asset_pathInMounted');
await assetsDAO.createIndex('asset_fspath');
await assetsDAO.createIndex('asset_renderPath');
//////////// Partials Table
let Partial = class Partial {
};
__decorate([
    id({
        name: 'vpath', dbtype: 'TEXT'
    }),
    index('partial_vpath'),
    __metadata("design:type", String)
], Partial.prototype, "vpath", void 0);
__decorate([
    field({
        name: 'mime', dbtype: 'TEXT'
    }),
    __metadata("design:type", String)
], Partial.prototype, "mime", void 0);
__decorate([
    field({
        name: 'mounted', dbtype: 'TEXT'
    }),
    index('partial_mounted'),
    __metadata("design:type", String)
], Partial.prototype, "mounted", void 0);
__decorate([
    field({
        name: 'mountPoint', dbtype: 'TEXT'
    }),
    index('partial_mountPoint'),
    __metadata("design:type", String)
], Partial.prototype, "mountPoint", void 0);
__decorate([
    field({
        name: 'pathInMounted', dbtype: 'TEXT'
    }),
    index('partial_pathInMounted'),
    __metadata("design:type", String)
], Partial.prototype, "pathInMounted", void 0);
__decorate([
    field({
        name: 'fspath', dbtype: 'TEXT'
    }),
    index('partial_fspath'),
    __metadata("design:type", String)
], Partial.prototype, "fspath", void 0);
__decorate([
    field({
        name: 'renderPath', dbtype: 'TEXT'
    }),
    index('partial_renderPath'),
    __metadata("design:type", String)
], Partial.prototype, "renderPath", void 0);
__decorate([
    field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    }),
    __metadata("design:type", String)
], Partial.prototype, "mtimeMs", void 0);
__decorate([
    field({
        name: 'docMetadata', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Partial.prototype, "docMetadata", void 0);
__decorate([
    field({
        name: 'docContent', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Partial.prototype, "docContent", void 0);
__decorate([
    field({
        name: 'docBody', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Partial.prototype, "docBody", void 0);
__decorate([
    field({
        name: 'metadata', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Partial.prototype, "metadata", void 0);
__decorate([
    field({
        name: 'info', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Partial.prototype, "info", void 0);
Partial = __decorate([
    table({
        name: 'PARTIALS',
        withoutRowId: true,
    })
], Partial);
export { Partial };
await schema().createTable(sqdb, 'PARTIALS');
export const partialsDAO = new BaseDAO(Partial, sqdb);
await partialsDAO.createIndex('partial_vpath');
await partialsDAO.createIndex('partial_mounted');
await partialsDAO.createIndex('partial_mountPoint');
await partialsDAO.createIndex('partial_pathInMounted');
await partialsDAO.createIndex('partial_fspath');
await partialsDAO.createIndex('partial_renderPath');
///////////////// Layouts Table
let Layout = class Layout {
};
__decorate([
    id({
        name: 'vpath', dbtype: 'TEXT'
    }),
    index('layout_vpath'),
    __metadata("design:type", String)
], Layout.prototype, "vpath", void 0);
__decorate([
    field({
        name: 'mime', dbtype: 'TEXT'
    }),
    __metadata("design:type", String)
], Layout.prototype, "mime", void 0);
__decorate([
    field({
        name: 'mounted', dbtype: 'TEXT'
    }),
    index('layout_mounted'),
    __metadata("design:type", String)
], Layout.prototype, "mounted", void 0);
__decorate([
    field({
        name: 'mountPoint', dbtype: 'TEXT'
    }),
    index('layout_mountPoint'),
    __metadata("design:type", String)
], Layout.prototype, "mountPoint", void 0);
__decorate([
    field({
        name: 'pathInMounted', dbtype: 'TEXT'
    }),
    index('layout_pathInMounted'),
    __metadata("design:type", String)
], Layout.prototype, "pathInMounted", void 0);
__decorate([
    field({
        name: 'fspath', dbtype: 'TEXT'
    }),
    index('layout_fspath'),
    __metadata("design:type", String)
], Layout.prototype, "fspath", void 0);
__decorate([
    field({
        name: 'renderPath', dbtype: 'TEXT'
    }),
    index('layout_renderPath'),
    __metadata("design:type", String)
], Layout.prototype, "renderPath", void 0);
__decorate([
    field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    }),
    __metadata("design:type", String)
], Layout.prototype, "mtimeMs", void 0);
__decorate([
    field({
        name: 'docMetadata', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Layout.prototype, "docMetadata", void 0);
__decorate([
    field({
        name: 'docContent', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Layout.prototype, "docContent", void 0);
__decorate([
    field({
        name: 'docBody', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Layout.prototype, "docBody", void 0);
__decorate([
    field({
        name: 'metadata', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Layout.prototype, "metadata", void 0);
__decorate([
    field({
        name: 'info', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Layout.prototype, "info", void 0);
Layout = __decorate([
    table({
        name: 'LAYOUTS',
        withoutRowId: true,
    })
], Layout);
export { Layout };
await schema().createTable(sqdb, 'LAYOUTS');
export const layoutsDAO = new BaseDAO(Layout, sqdb);
await layoutsDAO.createIndex('layout_vpath');
await layoutsDAO.createIndex('layout_mounted');
await layoutsDAO.createIndex('layout_mountPoint');
await layoutsDAO.createIndex('layout_pathInMounted');
await layoutsDAO.createIndex('layout_fspath');
await layoutsDAO.createIndex('layout_renderPath');
/////////////// Documents Table
let Document = class Document {
};
__decorate([
    id({
        name: 'vpath', dbtype: 'TEXT'
    }),
    index('docs_vpath'),
    __metadata("design:type", String)
], Document.prototype, "vpath", void 0);
__decorate([
    field({
        name: 'mime', dbtype: 'TEXT'
    }),
    __metadata("design:type", String)
], Document.prototype, "mime", void 0);
__decorate([
    field({
        name: 'mounted', dbtype: 'TEXT'
    }),
    index('docs_mounted'),
    __metadata("design:type", String)
], Document.prototype, "mounted", void 0);
__decorate([
    field({
        name: 'mountPoint', dbtype: 'TEXT'
    }),
    index('docs_mountPoint'),
    __metadata("design:type", String)
], Document.prototype, "mountPoint", void 0);
__decorate([
    field({
        name: 'pathInMounted', dbtype: 'TEXT'
    }),
    index('docs_pathInMounted'),
    __metadata("design:type", String)
], Document.prototype, "pathInMounted", void 0);
__decorate([
    field({
        name: 'fspath', dbtype: 'TEXT'
    }),
    index('docs_fspath'),
    __metadata("design:type", String)
], Document.prototype, "fspath", void 0);
__decorate([
    field({
        name: 'renderPath', dbtype: 'TEXT'
    }),
    index('docs_renderPath'),
    __metadata("design:type", String)
], Document.prototype, "renderPath", void 0);
__decorate([
    field({
        name: 'rendersToHTML', dbtype: 'INTEGER'
    }),
    index('docs_rendersToHTML'),
    __metadata("design:type", Boolean)
], Document.prototype, "rendersToHTML", void 0);
__decorate([
    field({
        name: 'dirname', dbtype: 'TEXT'
    }),
    index('docs_dirname'),
    __metadata("design:type", String)
], Document.prototype, "dirname", void 0);
__decorate([
    field({
        name: 'parentDir', dbtype: 'TEXT'
    }),
    index('docs_parentDir'),
    __metadata("design:type", String)
], Document.prototype, "parentDir", void 0);
__decorate([
    field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    }),
    __metadata("design:type", String)
], Document.prototype, "mtimeMs", void 0);
__decorate([
    field({
        name: 'docMetadata', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Document.prototype, "docMetadata", void 0);
__decorate([
    field({
        name: 'docContent', dbtype: 'TEXT', isJson: false
    }),
    __metadata("design:type", String)
], Document.prototype, "docContent", void 0);
__decorate([
    field({
        name: 'docBody', dbtype: 'TEXT', isJson: false
    }),
    __metadata("design:type", String)
], Document.prototype, "docBody", void 0);
__decorate([
    field({
        name: 'metadata', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Document.prototype, "metadata", void 0);
__decorate([
    field({
        name: 'tags', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Document.prototype, "tags", void 0);
__decorate([
    field({
        name: 'layout', dbtype: 'TEXT', isJson: false
    }),
    index('docs_layout'),
    __metadata("design:type", String)
], Document.prototype, "layout", void 0);
__decorate([
    field({
        name: 'blogtag', dbtype: 'TEXT', isJson: false
    }),
    index('docs_blogtag'),
    __metadata("design:type", String)
], Document.prototype, "blogtag", void 0);
__decorate([
    field({
        name: 'info', dbtype: 'TEXT', isJson: true
    }),
    __metadata("design:type", Object)
], Document.prototype, "info", void 0);
Document = __decorate([
    table({
        name: 'DOCUMENTS',
        withoutRowId: true,
    })
], Document);
export { Document };
await schema().createTable(sqdb, 'DOCUMENTS');
export const documentsDAO = new BaseDAO(Document, sqdb);
await documentsDAO.createIndex('docs_vpath');
await documentsDAO.createIndex('docs_mounted');
await documentsDAO.createIndex('docs_mountPoint');
await documentsDAO.createIndex('docs_pathInMounted');
await documentsDAO.createIndex('docs_fspath');
await documentsDAO.createIndex('docs_renderPath');
await documentsDAO.createIndex('docs_rendersToHTML');
await documentsDAO.createIndex('docs_dirname');
await documentsDAO.createIndex('docs_parentDir');
await documentsDAO.createIndex('docs_blogtag');
const tglue = new TagGlue();
tglue.init(sqdb._db);
const tdesc = new TagDescriptions();
tdesc.init(sqdb._db);
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
        info.renderPath = info.vpath;
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
        if (typeof obj.mtimeMs !== 'undefined') {
            if (typeof obj.mtimeMs !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a mtimeMs, got ${util.inspect(obj)}`);
            }
            else {
                dest.mtimeMs = obj.mtimeMs;
            }
        }
        if (typeof obj.info !== 'undefined') {
            if (typeof obj.info !== 'string') {
                throw new Error(`BaseFileCache.cvtRowToObjBASE must have a info, got ${util.inspect(obj)}`);
            }
            else {
                dest.info = JSON.parse(obj.info);
            }
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
        const found = await this.dao.sqldb.all(`
            SELECT vpath, mounted
            FROM ${this.dao.table.quotedName}
            WHERE 
            vpath = $vpath AND mounted = $mounted
        `, {
            $vpath: vpath,
            $mounted: mounted
        });
        const mapped = found.map(item => {
            return this.cvtRowToObj(item);
        });
        for (const item of mapped) {
            this.gatherInfoData(item);
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
        // console.log(`findByPath ${this.dao.table.quotedName} ${vpath}`);
        const found = await this.dao.sqldb.all(`
            SELECT *
            FROM ${this.dao.table.quotedName}
            WHERE 
            vpath = $vpath OR renderPath = $vpath
        `, {
            $vpath: vpath
        });
        const mapped = found.map(item => {
            return this.cvtRowToObj(item);
        });
        for (const item of mapped) {
            this.gatherInfoData(item);
        }
        return mapped;
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
        await __classPrivateFieldGet(this, _BaseFileCache_dao, "f").update({
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
        });
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
        await __classPrivateFieldGet(this, _BaseFileCache_dao, "f").insert({
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
        });
    }
    async handleUnlinked(name, info) {
        // console.log(`PROCESS ${name} handleUnlinked`, info.vpath);
        if (name !== this.name) {
            throw new Error(`handleUnlinked event for wrong name; got ${name}, expected ${this.name}`);
        }
        await this.config.hookFileUnlinked(name, info);
        await __classPrivateFieldGet(this, _BaseFileCache_dao, "f").sqldb.run(`
            DELETE FROM ${this.dao.table.quotedName}
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
        __classPrivateFieldSet(this, _BaseFileCache_is_ready, true, "f");
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
    async paths(rootPath) {
        const fcache = this;
        let rootP = rootPath?.startsWith('/')
            ? rootPath?.substring(1)
            : rootPath;
        // This is copied from the older version
        // (LokiJS version) of this function.  It
        // seems meant to eliminate duplicates.
        const vpathsSeen = new Set();
        const results = await this.dao.sqldb.all((typeof rootP === 'string') ?
            `
            SELECT * FROM ${this.dao.table.quotedName}
            WHERE
            renderPath LIKE $rootP
            ORDER BY mtimeMs ASC
        `
            : `
            SELECT * FROM ${this.dao.table.quotedName}
            ORDER BY mtimeMs ASC
        `, (typeof rootP === 'string')
            ? { $rootP: `${rootP}%` }
            : {});
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
        const result2 = results.filter(item => {
            // console.log(`paths ?ignore? ${item.vpath}`);
            if (fcache.ignoreFile(item)) {
                return false;
            }
            if (vpathsSeen.has(item.vpath)) {
                return false;
            }
            else {
                vpathsSeen.add(item.vpath);
                return true;
            }
        });
        const mapped = result2.map(item => {
            return this.cvtRowToObj(item);
        });
        for (const item of mapped) {
            this.gatherInfoData(item);
        }
        return mapped;
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
        return ret;
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
    // TODO Is this function used anywhere?
    async findAll() {
        const fcache = this;
        // const result1 = await this.dao.selectAll({
        // } as Filter<T>);
        const result1 = await this.dao.sqldb.all(`
            SELECT * FROM ${this.dao.table.quotedName}
        `, {});
        const result2 = result1.filter(item => {
            // console.log(`findAll ?ignore? ${item.vpath}`);
            return !(fcache.ignoreFile(item));
        });
        const result3 = result2.map(item => {
            return this.cvtRowToObj(item);
        });
        return result3;
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
    cvtRowToObj(obj) {
        const ret = new Asset();
        this.cvtRowToObjBASE(obj, ret);
        return ret;
    }
}
export class TemplatesFileCache extends BaseFileCache {
    constructor(config, name, dirs, dao, type) {
        super(config, name, dirs, dao);
        // Because this class serves two purposes, Layout
        // and Partials, this flag helps to distinguish.
        // Any place, like cvtRowToObj, which needs to know
        // which is which can use these getters to do
        // the right thing.
        _TemplatesFileCache_type.set(this, void 0);
        __classPrivateFieldSet(this, _TemplatesFileCache_type, type, "f");
    }
    get isLayout() { return __classPrivateFieldGet(this, _TemplatesFileCache_type, "f") === "layout"; }
    get isPartial() { return __classPrivateFieldGet(this, _TemplatesFileCache_type, "f") === "partial"; }
    cvtRowToObj(obj) {
        const ret = this.isLayout ? new Layout() : new Partial();
        this.cvtRowToObjBASE(obj, ret);
        if (typeof obj.docMetadata !== 'undefined'
            && obj.docMetadata !== null) {
            if (typeof obj.docMetadata !== 'string') {
                throw new Error(`TemplatesFileCache.cvtRowToObj must have a docMetadata, got ${util.inspect(obj)}`);
            }
            else {
                ret.docMetadata = obj.docMetadata;
            }
        }
        if (typeof obj.docContent !== 'undefined'
            && obj.docContent !== null) {
            if (typeof obj.docContent !== 'string') {
                throw new Error(`TemplatesFileCache.cvtRowToObj must have a docContent, got ${util.inspect(obj)}`);
            }
            else {
                ret.docContent = obj.docContent;
            }
        }
        if (typeof obj.docBody !== 'undefined'
            && obj.docBody !== null) {
            if (typeof obj.docBody !== 'string') {
                throw new Error(`TemplatesFileCache.cvtRowToObj must have a docBody, got ${util.inspect(obj)}`);
            }
            else {
                ret.docBody = obj.docBody;
            }
        }
        if (typeof obj.metadata !== 'undefined'
            && obj.metadata !== null) {
            if (typeof obj.metadata !== 'string') {
                throw new Error(`TemplatesFileCache.cvtRowToObj must have a metadata, got ${util.inspect(obj)}`);
            }
            else {
                ret.metadata = obj.metadata;
            }
        }
        return ret;
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
        if (info.dirname === '.')
            info.dirname = '/';
        let renderer = this.config.findRendererPath(info.vpath);
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
        await this.dao.update({
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
        });
    }
    async insertDocToDB(info) {
        await this.dao.insert({
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
        });
    }
}
_TemplatesFileCache_type = new WeakMap();
export class DocumentsFileCache extends BaseFileCache {
    constructor(config, name, dirs) {
        super(config, name, dirs, documentsDAO);
    }
    cvtRowToObj(obj) {
        const ret = new Document();
        this.cvtRowToObjBASE(obj, ret);
        if (typeof obj.docMetadata !== 'undefined'
            && obj.docMetadata !== null) {
            if (typeof obj.docMetadata !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a docMetadata, got ${util.inspect(obj)}`);
            }
            else {
                ret.docMetadata = obj.docMetadata;
            }
        }
        if (typeof obj.docContent !== 'undefined'
            && obj.docContent !== null) {
            if (typeof obj.docContent !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a docContent, got ${util.inspect(obj)}`);
            }
            else {
                ret.docContent = obj.docContent;
            }
        }
        if (typeof obj.docBody !== 'undefined'
            && obj.docBody !== null) {
            if (typeof obj.docBody !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a docBody, got ${util.inspect(obj)}`);
            }
            else {
                ret.docBody = obj.docBody;
            }
        }
        if (typeof obj.metadata !== 'undefined'
            && obj.metadata !== null) {
            if (typeof obj.metadata !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a metadata, got ${util.inspect(obj)}`);
            }
            else {
                ret.metadata = obj.metadata;
            }
        }
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
            info.rendersToHTML = micromatch.isMatch(info.renderPath, '**/*.html')
                ? true : false;
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
                if (info.metadata.blogtag) {
                    info.blogtag = info.metadata.blogtag;
                }
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
                    if (!dateSet && info.mtimeMs) {
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
        const docInfo = {
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
            parentDir: info.parentDir,
            docMetadata: info.docMetadata,
            docContent: info.docContent,
            docBody: info.docBody,
            metadata: info.metadata,
            tags: Array.isArray(info.metadata?.tags)
                ? info.metadata.tags
                : [],
            layout: info.metadata?.layout,
            blogtag: typeof info.metadata?.blogtag === 'string'
                ? info.metadata?.blogtag
                : undefined,
            info,
        };
        await this.dao.update(docInfo);
        await tglue.deleteTagGlue(docInfo.vpath);
        await tglue.addTagGlue(docInfo.vpath, docInfo.tags);
    }
    async insertDocToDB(info) {
        const docInfo = {
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
            parentDir: info.parentDir,
            docMetadata: info.docMetadata,
            docContent: info.docContent,
            docBody: info.docBody,
            metadata: info.metadata,
            tags: Array.isArray(info.metadata?.tags)
                ? info.metadata.tags
                : [],
            layout: info.metadata?.layout,
            blogtag: typeof info.metadata?.blogtag === 'string'
                ? info.metadata?.blogtag
                : undefined,
            info,
        };
        await this.dao.insert(docInfo);
        await this.addDocTagGlue(docInfo.vpath, docInfo.tags);
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
        const filez = [];
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
            }
            else {
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
        // if (dirname === '.') dirname = '/';
        const siblings = await this.dao.sqldb.all(`
            SELECT * FROM ${this.dao.table.quotedName}
            WHERE
            dirname = $dirname AND
            vpath <> $vpath AND
            renderPath <> $vpath AND
            rendersToHtml = true
        `, {
            $dirname: dirname,
            $vpath: vpath
        });
        // const siblings = await this.dao.selectAll({
        //     dirname: { eq: dirname },
        //     // The siblings cannot include the self.
        //     vpath: { neq: vpath },
        //     renderPath: { neq: vpath },
        //     rendersToHTML: true
        // });
        const ignored = siblings.filter(item => {
            return !this.ignoreFile(item);
        });
        const mapped = ignored.map(item => {
            return this.cvtRowToObj(item);
        });
        for (const item of mapped) {
            this.gatherInfoData(item);
        }
        return mapped;
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
        const items = await this.dao.selectAll({
            dirname: { eq: dirname },
            rendersToHTML: true
        });
        const childFolders = await this.dao.sqldb.all(`SELECT distinct dirname FROM DOCUMENTS
            WHERE parentDir = '${dirname}'`);
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
        return this.dao.sqldb.all(`
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
        await this.dao.selectEach((err, model) => {
            const setter = async (date) => {
                const parsed = Date.parse(date);
                ;
                if (!isNaN(parsed)) {
                    const dp = new Date(parsed);
                    FS.utimesSync(model.fspath, dp, dp);
                }
            };
            if (model.info.docMetadata
                && model.info.docMetadata.publDate) {
                setter(model.info.docMetadata.publDate);
            }
            if (model.info.docMetadata
                && model.info.docMetadata.publicationDate) {
                setter(model.info.docMetadata.publicationDate);
            }
        }, {});
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
        // sqlite> select * from TAGGLUE where tagName IN ( 'Something "quited"', "Teaser's" );
        // teaser-content.html.md|Teaser's
        // teaser-content.html.md|Something "quited"
        // sqlite> select * from TAGGLUE where tagName IN ( 'Something "quited"', 'Teaser''s' );
        // teaser-content.html.md|Teaser's
        // teaser-content.html.md|Something "quited"
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
        // $ node ../dist/cli.js docs-with-tag config-normal.mjs "Teaser's" 'Something "quited"'
        // documentsWithTag [ "Teaser's", 'Something "quited"' ]  ( 'Teaser''s','Something "quited"' ) 
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
        const docInfo = await this.find(vpath);
        return {
            vpath,
            renderPath: docInfo.renderPath,
            title: docInfo.metadata.title,
            teaser: docInfo.metadata.teaser,
            // thumbnail
        };
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
        try {
            const { sql, params } = this.buildSearchQuery(options);
            // console.log(`search ${sql}`);
            const results = await this.dao.sqldb.all(sql, params);
            // Convert raw SQL results to Document objects
            const documents = results.map(row => this.cvtRowToObj(row));
            // Gather additional info data for each result FIRST
            // This is crucial because filters and sort functions may depend on this data
            for (const item of documents) {
                this.gatherInfoData(item);
            }
            // Apply post-SQL filters that can't be done in SQL
            let filteredResults = documents;
            // Filter by renderers (requires config lookup)
            if (options.renderers && Array.isArray(options.renderers)) {
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
        // Helper to create unique parameter names
        const addParam = (value) => {
            const paramName = `$param${++paramCounter}`;
            params[paramName] = value;
            return paramName;
        };
        // Base query
        let sql = `SELECT DISTINCT d.* FROM ${this.dao.table.quotedName} d`;
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
        if (typeof options.blogtag === 'string') {
            whereClauses.push(`d.blogtag = ${addParam(options.blogtag)}`);
        }
        else if (Array.isArray(options.blogtags)) {
            const placeholders = options.blogtags.map(tag => addParam(tag)).join(', ');
            whereClauses.push(`d.blogtag IN (${placeholders})`);
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
        if (typeof options.renderpathmatch === 'string') {
            regexClauses.push(`d.renderPath regexp ${addParam(options.renderpathmatch)}`);
        }
        else if (options.renderpathmatch instanceof RegExp) {
            regexClauses.push(`d.renderPath regexp ${addParam(options.renderpathmatch.source)}`);
        }
        else if (Array.isArray(options.renderpathmatch)) {
            for (const match of options.renderpathmatch) {
                if (typeof match === 'string') {
                    regexClauses.push(`d.renderPath regexp ${addParam(match)}`);
                }
                else if (match instanceof RegExp) {
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
export var assetsCache;
export var partialsCache;
export var layoutsCache;
export var documentsCache;
export async function setup(config) {
    assetsCache = new AssetsFileCache(config, 'assets', config.assetDirs, assetsDAO);
    await assetsCache.setup();
    assetsCache.on('error', (...args) => {
        console.error(`assetsCache ERROR ${util.inspect(args)}`);
    });
    partialsCache = new TemplatesFileCache(config, 'partials', config.partialsDirs, partialsDAO, "partial");
    await partialsCache.setup();
    partialsCache.on('error', (...args) => {
        console.error(`partialsCache ERROR ${util.inspect(args)}`);
    });
    layoutsCache = new TemplatesFileCache(config, 'layouts', config.layoutDirs, layoutsDAO, "layout");
    await layoutsCache.setup();
    layoutsCache.on('error', (...args) => {
        console.error(`layoutsCache ERROR ${util.inspect(args)}`);
    });
    // console.log(`DocumentsFileCache 'documents' ${util.inspect(config.documentDirs)}`);
    documentsCache = new DocumentsFileCache(config, 'documents', config.documentDirs);
    await documentsCache.setup();
    documentsCache.on('error', (err) => {
        console.error(`documentsCache ERROR ${util.inspect(err)}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1jYWNoZS1zcWxpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvZmlsZS1jYWNoZS1zcWxpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxFQUFFLFdBQVcsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUM3RSxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRzdCLE9BQU8sRUFBRSxNQUFNLElBQUksQ0FBQztBQUNwQixPQUFPLFlBQVksTUFBTSxRQUFRLENBQUM7QUFDbEMsT0FBTyxVQUFVLE1BQU0sWUFBWSxDQUFDO0FBRXBDLE9BQU8sRUFDSCxLQUFLLEVBR0wsRUFBRSxFQUNGLEtBQUssRUFDTCxLQUFLLEVBR0wsTUFBTSxFQUNOLE9BQU8sRUFHVixNQUFNLFlBQVksQ0FBQztBQUVwQixPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRWxDLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUV6RCwwQkFBMEI7QUFNbkIsSUFBTSxLQUFLLEdBQVgsTUFBTSxLQUFLO0NBdURqQixDQUFBO0FBaERHO0lBSkMsRUFBRSxDQUFDO1FBQ0EsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTTtLQUNoQyxDQUFDO0lBQ0QsS0FBSyxDQUFDLGFBQWEsQ0FBQzs7b0NBQ1A7QUFLZDtJQUhDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU07S0FDL0IsQ0FBQzs7bUNBQ1c7QUFNYjtJQUpDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU07S0FDbEMsQ0FB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QUssRUFBRSxDQUFDO0lBRTdCLGNBQWMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDL0IsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ3hDLENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLGVBQWU7SUFDakMsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUNqQixNQUFNLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM3QixjQUFjLEdBQUcsU0FBUyxDQUFDO0lBQy9CLENBQUM7SUFDRCxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2QsTUFBTSxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsV0FBVyxHQUFHLFNBQVMsQ0FBQztJQUM1QixDQUFDO0lBQ0QsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUNmLE1BQU0sWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzNCLFlBQVksR0FBRyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUNELElBQUksYUFBYSxFQUFFLENBQUM7UUFDaEIsTUFBTSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDNUIsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUM5QixDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBEaXJzV2F0Y2hlciwgZGlyVG9XYXRjaCwgVlBhdGhEYXRhIH0gZnJvbSAnQGFrYXNoYWNtcy9zdGFja2VkLWRpcnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgdXJsICBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gJ2ZzJztcbmltcG9ydCBGUyBmcm9tICdmcyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcblxuaW1wb3J0IHtcbiAgICBmaWVsZCxcbiAgICBGaWVsZE9wdHMsXG4gICAgZmssXG4gICAgaWQsXG4gICAgaW5kZXgsXG4gICAgdGFibGUsXG4gICAgVGFibGVPcHRzLFxuICAgIFNxbERhdGFiYXNlLFxuICAgIHNjaGVtYSxcbiAgICBCYXNlREFPLFxuICAgIEZpbHRlcixcbiAgICBXaGVyZVxufSBmcm9tICdzcWxpdGUzb3JtJztcblxuaW1wb3J0IHsgc3FkYiB9IGZyb20gJy4uL3NxZGIuanMnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgZGlyVG9Nb3VudCB9IGZyb20gJy4uL2luZGV4LmpzJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgeyBUYWdHbHVlLCBUYWdEZXNjcmlwdGlvbnMgfSBmcm9tICcuL3RhZy1nbHVlLmpzJztcblxuLy8vLy8vLy8vLy8vLyBBc3NldHMgdGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnQVNTRVRTJyxcbiAgICB3aXRob3V0Um93SWQ6IHRydWUsXG59IGFzIFRhYmxlT3B0cylcbmV4cG9ydCBjbGFzcyBBc3NldCB7XG5cbiAgICAvLyBQcmltYXJ5IGtleVxuICAgIEBpZCh7XG4gICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X3ZwYXRoJylcbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21pbWUnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgbWltZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF9tb3VudGVkJylcbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X21vdW50UG9pbnQnKVxuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfcGF0aEluTW91bnRlZCcpXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X2ZzcGF0aCcpXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X3JlbmRlclBhdGgnKVxuICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtdGltZU1zJyxcbiAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4gICAgfSlcbiAgICBtdGltZU1zOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnaW5mbycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGluZm86IGFueTtcblxufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnQVNTRVRTJyk7XG50eXBlIFRhc3NldHNEQU8gPSBCYXNlREFPPEFzc2V0PjtcbmV4cG9ydCBjb25zdCBhc3NldHNEQU86IFRhc3NldHNEQU9cbiAgICA9IG5ldyBCYXNlREFPPEFzc2V0PihBc3NldCwgc3FkYik7XG5cbmF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfdnBhdGgnKTtcbmF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfbW91bnRlZCcpO1xuYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9tb3VudFBvaW50Jyk7XG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X3BhdGhJbk1vdW50ZWQnKTtcbmF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfZnNwYXRoJyk7XG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X3JlbmRlclBhdGgnKTtcblxuLy8vLy8vLy8vLy8vIFBhcnRpYWxzIFRhYmxlXG5cbkB0YWJsZSh7XG4gICAgbmFtZTogJ1BBUlRJQUxTJyxcbiAgICB3aXRob3V0Um93SWQ6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIFBhcnRpYWwge1xuXG4gICAgLy8gUHJpbWFyeSBrZXlcbiAgICBAaWQoe1xuICAgICAgICBuYW1lOiAndnBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX3ZwYXRoJylcbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21pbWUnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgbWltZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX21vdW50ZWQnKVxuICAgIG1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudFBvaW50JywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9tb3VudFBvaW50JylcbiAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfcGF0aEluTW91bnRlZCcpXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfZnNwYXRoJylcbiAgICBmc3BhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdyZW5kZXJQYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9yZW5kZXJQYXRoJylcbiAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbXRpbWVNcycsXG4gICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuICAgIH0pXG4gICAgbXRpbWVNczogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY01ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jTWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NDb250ZW50JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jQ29udGVudDogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY0JvZHknLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBkb2NCb2R5OiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBtZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvOiBhbnk7XG59XG5cbmF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdQQVJUSUFMUycpO1xudHlwZSBUcGFydGlhbHNEQU8gPSBCYXNlREFPPFBhcnRpYWw+O1xuZXhwb3J0IGNvbnN0IHBhcnRpYWxzREFPXG4gICAgPSBuZXcgQmFzZURBTzxQYXJ0aWFsPihQYXJ0aWFsLCBzcWRiKTtcblxuYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfdnBhdGgnKTtcbmF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX21vdW50ZWQnKTtcbmF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX21vdW50UG9pbnQnKTtcbmF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX3BhdGhJbk1vdW50ZWQnKTtcbmF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX2ZzcGF0aCcpO1xuYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfcmVuZGVyUGF0aCcpO1xuXG4vLy8vLy8vLy8vLy8vLy8vLyBMYXlvdXRzIFRhYmxlXG5cbkB0YWJsZSh7XG4gICAgbmFtZTogJ0xBWU9VVFMnLFxuICAgIHdpdGhvdXRSb3dJZDogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgTGF5b3V0IHtcblxuICAgIC8vIFByaW1hcnkga2V5XG4gICAgQGlkKHtcbiAgICAgICAgbmFtZTogJ3ZwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnbGF5b3V0X3ZwYXRoJylcbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21pbWUnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgbWltZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfbW91bnRlZCcpXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50UG9pbnQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfbW91bnRQb2ludCcpXG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3BhdGhJbk1vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfcGF0aEluTW91bnRlZCcpXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9mc3BhdGgnKVxuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlclBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfcmVuZGVyUGF0aCcpXG4gICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbiAgICB9KVxuICAgIG10aW1lTXM6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQ29udGVudCcsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY0NvbnRlbnQ6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NCb2R5JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jQm9keTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgbWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdpbmZvJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgaW5mbzogYW55O1xuXG59XG5cbmF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdMQVlPVVRTJyk7XG50eXBlIFRsYXlvdXRzREFPID0gQmFzZURBTzxMYXlvdXQ+O1xuZXhwb3J0IGNvbnN0IGxheW91dHNEQU9cbiAgICA9IG5ldyBCYXNlREFPPExheW91dD4oTGF5b3V0LCBzcWRiKTtcblxuYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X3ZwYXRoJyk7XG5hd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfbW91bnRlZCcpO1xuYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X21vdW50UG9pbnQnKTtcbmF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9wYXRoSW5Nb3VudGVkJyk7XG5hd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfZnNwYXRoJyk7XG5hd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfcmVuZGVyUGF0aCcpO1xuXG4vLy8vLy8vLy8vLy8vLy8gRG9jdW1lbnRzIFRhYmxlXG5cbkB0YWJsZSh7XG4gICAgbmFtZTogJ0RPQ1VNRU5UUycsXG4gICAgd2l0aG91dFJvd0lkOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBEb2N1bWVudCB7XG5cbiAgICAvLyBQcmltYXJ5IGtleVxuICAgIEBpZCh7XG4gICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfdnBhdGgnKVxuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBtaW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfbW91bnRlZCcpXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50UG9pbnQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX21vdW50UG9pbnQnKVxuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19wYXRoSW5Nb3VudGVkJylcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19mc3BhdGgnKVxuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlclBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX3JlbmRlclBhdGgnKVxuICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdyZW5kZXJzVG9IVE1MJywgZGJ0eXBlOiAnSU5URUdFUidcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19yZW5kZXJzVG9IVE1MJylcbiAgICByZW5kZXJzVG9IVE1MOiBib29sZWFuO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2Rpcm5hbWUnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX2Rpcm5hbWUnKVxuICAgIGRpcm5hbWU6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXJlbnREaXInLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX3BhcmVudERpcicpXG4gICAgcGFyZW50RGlyOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbXRpbWVNcycsXG4gICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuICAgIH0pXG4gICAgbXRpbWVNczogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY01ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jTWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NDb250ZW50JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogZmFsc2VcbiAgICB9KVxuICAgIGRvY0NvbnRlbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NCb2R5JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogZmFsc2VcbiAgICB9KVxuICAgIGRvY0JvZHk6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIG1ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAndGFncycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIHRhZ3M6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdsYXlvdXQnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiBmYWxzZVxuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX2xheW91dCcpXG4gICAgbGF5b3V0OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnYmxvZ3RhZycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IGZhbHNlXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfYmxvZ3RhZycpXG4gICAgYmxvZ3RhZzogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvOiBhbnk7XG5cbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0RPQ1VNRU5UUycpO1xudHlwZSBUZG9jdW1lbnRzc0RBTyA9IEJhc2VEQU88RG9jdW1lbnQ+O1xuZXhwb3J0IGNvbnN0IGRvY3VtZW50c0RBT1xuICAgID0gbmV3IEJhc2VEQU88RG9jdW1lbnQ+KERvY3VtZW50LCBzcWRiKTtcblxuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3ZwYXRoJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfbW91bnRlZCcpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX21vdW50UG9pbnQnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19wYXRoSW5Nb3VudGVkJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfZnNwYXRoJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfcmVuZGVyUGF0aCcpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3JlbmRlcnNUb0hUTUwnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19kaXJuYW1lJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfcGFyZW50RGlyJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfYmxvZ3RhZycpO1xuXG5jb25zdCB0Z2x1ZSA9IG5ldyBUYWdHbHVlKCk7XG50Z2x1ZS5pbml0KHNxZGIuX2RiKTtcblxuY29uc3QgdGRlc2MgPSBuZXcgVGFnRGVzY3JpcHRpb25zKCk7XG50ZGVzYy5pbml0KHNxZGIuX2RiKTtcblxuLy8gQ29udmVydCBBa2FzaGFDTVMgbW91bnQgcG9pbnRzIGludG8gdGhlIG1vdW50cG9pbnRcbi8vIHVzZWQgYnkgRGlyc1dhdGNoZXJcbmNvbnN0IHJlbWFwZGlycyA9IChkaXJ6OiBkaXJUb01vdW50W10pOiBkaXJUb1dhdGNoW10gPT4ge1xuICAgIHJldHVybiBkaXJ6Lm1hcChkaXIgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZG9jdW1lbnQgZGlyICcsIGRpcik7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogJy8nLFxuICAgICAgICAgICAgICAgIGJhc2VNZXRhZGF0YToge31cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWRpci5kZXN0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW1hcGRpcnMgaW52YWxpZCBtb3VudCBzcGVjaWZpY2F0aW9uICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5zcmMsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLmRlc3QsXG4gICAgICAgICAgICAgICAgYmFzZU1ldGFkYXRhOiBkaXIuYmFzZU1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGlnbm9yZTogZGlyLmlnbm9yZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUeXBlIGZvciByZXR1cm4gZnJvbSBwYXRocyBtZXRob2QuICBUaGUgZmllbGRzIGhlcmVcbiAqIGFyZSB3aGF0cyBpbiB0aGUgQXNzZXQvTGF5b3V0L1BhcnRpYWwgY2xhc3NlcyBhYm92ZVxuICogcGx1cyBhIGNvdXBsZSBmaWVsZHMgdGhhdCBvbGRlciBjb2RlIGV4cGVjdGVkXG4gKiBmcm9tIHRoZSBwYXRocyBtZXRob2QuXG4gKi9cbmV4cG9ydCB0eXBlIFBhdGhzUmV0dXJuVHlwZSA9IHtcbiAgICB2cGF0aDogc3RyaW5nLFxuICAgIG1pbWU6IHN0cmluZyxcbiAgICBtb3VudGVkOiBzdHJpbmcsXG4gICAgbW91bnRQb2ludDogc3RyaW5nLFxuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZyxcbiAgICBtdGltZU1zOiBzdHJpbmcsXG4gICAgaW5mbzogYW55LFxuICAgIC8vIFRoZXNlIHdpbGwgYmUgY29tcHV0ZWQgaW4gQmFzZUZpbGVDYWNoZVxuICAgIC8vIFRoZXkgd2VyZSByZXR1cm5lZCBpbiBwcmV2aW91cyB2ZXJzaW9ucy5cbiAgICBmc3BhdGg6IHN0cmluZyxcbiAgICByZW5kZXJQYXRoOiBzdHJpbmdcbn07XG5cbmV4cG9ydCBjbGFzcyBCYXNlRmlsZUNhY2hlPFxuICAgICAgICBUIGV4dGVuZHMgQXNzZXQgfCBMYXlvdXQgfCBQYXJ0aWFsIHwgRG9jdW1lbnQsXG4gICAgICAgIFRkYW8gZXh0ZW5kcyBCYXNlREFPPFQ+XG4+IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICAgICNjb25maWc/OiBDb25maWd1cmF0aW9uO1xuICAgICNuYW1lPzogc3RyaW5nO1xuICAgICNkaXJzPzogZGlyVG9Nb3VudFtdO1xuICAgICNpc19yZWFkeTogYm9vbGVhbiA9IGZhbHNlO1xuICAgICNjYWNoZV9jb250ZW50OiBib29sZWFuO1xuICAgICNtYXBfcmVuZGVycGF0aDogYm9vbGVhbjtcbiAgICAjZGFvOiBUZGFvOyAvLyBCYXNlREFPPFQ+O1xuXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICAgICAqIEBwYXJhbSBkaXJzIGFycmF5IG9mIGRpcmVjdG9yaWVzIGFuZCBtb3VudCBwb2ludHMgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gbmFtZSBzdHJpbmcgZ2l2aW5nIHRoZSBuYW1lIGZvciB0aGlzIHdhdGNoZXIgbmFtZVxuICAgICAqIEBwYXJhbSBkYW8gVGhlIFNRTElURTNPUk0gREFPIGluc3RhbmNlIHRvIHVzZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZGlyczogZGlyVG9Nb3VudFtdLFxuICAgICAgICBkYW86IFRkYW8gLy8gQmFzZURBTzxUPlxuICAgICkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQmFzZUZpbGVDYWNoZSAke25hbWV9IGNvbnN0cnVjdG9yIGRpcnM9JHt1dGlsLmluc3BlY3QoZGlycyl9YCk7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy4jbmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuI2RpcnMgPSBkaXJzO1xuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNjYWNoZV9jb250ZW50ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuI21hcF9yZW5kZXJwYXRoID0gZmFsc2U7XG4gICAgICAgIHRoaXMuI2RhbyA9IGRhbztcbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCkgICAgIHsgcmV0dXJuIHRoaXMuI2NvbmZpZzsgfVxuICAgIGdldCBuYW1lKCkgICAgICAgeyByZXR1cm4gdGhpcy4jbmFtZTsgfVxuICAgIGdldCBkaXJzKCkgICAgICAgeyByZXR1cm4gdGhpcy4jZGlyczsgfVxuICAgIHNldCBjYWNoZUNvbnRlbnQoZG9pdCkgeyB0aGlzLiNjYWNoZV9jb250ZW50ID0gZG9pdDsgfVxuICAgIGdldCBnYWNoZUNvbnRlbnQoKSB7IHJldHVybiB0aGlzLiNjYWNoZV9jb250ZW50OyB9XG4gICAgc2V0IG1hcFJlbmRlclBhdGgoZG9pdCkgeyB0aGlzLiNtYXBfcmVuZGVycGF0aCA9IGRvaXQ7IH1cbiAgICBnZXQgbWFwUmVuZGVyUGF0aCgpIHsgcmV0dXJuIHRoaXMuI21hcF9yZW5kZXJwYXRoOyB9XG4gICAgZ2V0IGRhbygpOiBUZGFvIHsgcmV0dXJuIHRoaXMuI2RhbzsgfVxuXG4gICAgLy8gU0tJUDogZ2V0RHluYW1pY1ZpZXdcblxuXG4gICAgI3dhdGNoZXI6IERpcnNXYXRjaGVyO1xuICAgICNxdWV1ZTtcblxuICAgIGFzeW5jIGNsb3NlKCkge1xuICAgICAgICBpZiAodGhpcy4jcXVldWUpIHtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlLmtpbGxBbmREcmFpbigpO1xuICAgICAgICAgICAgdGhpcy4jcXVldWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuI3dhdGNoZXIpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDTE9TSU5HICR7dGhpcy5uYW1lfWApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy4jd2F0Y2hlci5jbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy4jd2F0Y2hlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygnY2hhbmdlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygnYWRkZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3VubGlua2VkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZWFkeScpO1xuXG4gICAgICAgIGF3YWl0IHNxZGIuY2xvc2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdXAgcmVjZWl2aW5nIGV2ZW50cyBmcm9tIERpcnNXYXRjaGVyLCBhbmQgZGlzcGF0Y2hpbmcgdG9cbiAgICAgKiB0aGUgaGFuZGxlciBtZXRob2RzLlxuICAgICAqL1xuICAgIGFzeW5jIHNldHVwKCkge1xuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGlmICh0aGlzLiN3YXRjaGVyKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiN3YXRjaGVyLmNsb3NlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNxdWV1ZSA9IGZhc3RxLnByb21pc2UoYXN5bmMgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuY29kZSA9PT0gJ2NoYW5nZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNoYW5nZSAke2V2ZW50Lm5hbWV9ICR7ZXZlbnQuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZUNoYW5nZWQoZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdjaGFuZ2UnLCBldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdhZGRlZCcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgYWRkICR7ZXZlbnQubmFtZX0gJHtldmVudC5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlQWRkZWQoZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdhZGQnLCBldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICd1bmxpbmtlZCcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgdW5saW5rICR7ZXZlbnQubmFtZX0gJHtldmVudC5pbmZvLnZwYXRofWAsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlVW5saW5rZWQoZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCd1bmxpbmsnLCBldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlRXJyb3IoZXZlbnQubmFtZSkgKi9cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ3JlYWR5Jykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVSZWFkeShldmVudC5uYW1lKTtcbiAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgncmVhZHknLCBldmVudC5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTApO1xuXG4gICAgICAgIHRoaXMuI3dhdGNoZXIgPSBuZXcgRGlyc1dhdGNoZXIodGhpcy5uYW1lKTtcblxuICAgICAgICB0aGlzLiN3YXRjaGVyLm9uKCdjaGFuZ2UnLCBhc3luYyAobmFtZTogc3RyaW5nLCBpbmZvOiBWUGF0aERhdGEpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IGNoYW5nZWQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFBVU0ggJHtuYW1lfSBjaGFuZ2VkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnY2hhbmdlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICdjaGFuZ2UnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCBjaGFuZ2UgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ2FkZCcsIGFzeW5jIChuYW1lOiBzdHJpbmcsIGluZm86IFZQYXRoRGF0YSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtuYW1lfSBhZGQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFVTSCAke25hbWV9IGFkZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ2FkZGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ2FkZCcgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIGFkZCAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigndW5saW5rJywgYXN5bmMgKG5hbWU6IHN0cmluZywgaW5mbzogVlBhdGhEYXRhKSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgdW5saW5rICR7bmFtZX0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICd1bmxpbmtlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICd1bmxpbmsnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgdW5saW5rICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdyZWFkeScsIGFzeW5jIChuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IHJlYWR5YCk7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb2RlOiAncmVhZHknLFxuICAgICAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHNldHVwICR7dGhpcy4jbmFtZX0gd2F0Y2ggJHt1dGlsLmluc3BlY3QodGhpcy4jZGlycyl9ID09PiAke3V0aWwuaW5zcGVjdChtYXBwZWQpfWApO1xuICAgICAgICBhd2FpdCB0aGlzLiN3YXRjaGVyLndhdGNoKG1hcHBlZCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYERBTyAke3RoaXMuZGFvLnRhYmxlLm5hbWV9ICR7dXRpbC5pbnNwZWN0KHRoaXMuZGFvLnRhYmxlLmZpZWxkcyl9YCk7XG5cbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBUKSB7XG4gICAgICAgIC8vIFBsYWNlaG9sZGVyIHdoaWNoIHNvbWUgc3ViY2xhc3Nlc1xuICAgICAgICAvLyBhcmUgZXhwZWN0ZWQgdG8gb3ZlcnJpZGVcblxuICAgICAgICBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iaihvYmo6IGFueSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBiZSBvdmVycmlkZGVuYCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqQkFTRShvYmo6IGFueSwgZGVzdDogYW55KTogdm9pZCB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgcmVjZWl2ZSBhbiBvYmplY3QsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLnZwYXRoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoudnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSB2cGF0aCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QudnBhdGggPSBvYmoudnBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoubWltZSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5taW1lICE9PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoubWltZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIG1pbWUsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0Lm1pbWUgPSBvYmoubWltZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5tb3VudGVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoubW91bnRlZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIG1vdW50ZWQsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0Lm1vdW50ZWQgPSBvYmoubW91bnRlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5tb3VudFBvaW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoubW91bnRQb2ludCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIG1vdW50UG9pbnQsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0Lm1vdW50UG9pbnQgPSBvYmoubW91bnRQb2ludDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5wYXRoSW5Nb3VudGVkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoucGF0aEluTW91bnRlZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIHBhdGhJbk1vdW50ZWQsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0LnBhdGhJbk1vdW50ZWQgPSBvYmoucGF0aEluTW91bnRlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5mc3BhdGggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5mc3BhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBmc3BhdGgsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0LmZzcGF0aCA9IG9iai5mc3BhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoucmVuZGVyUGF0aCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLnJlbmRlclBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSByZW5kZXJQYXRoLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5yZW5kZXJQYXRoID0gb2JqLnJlbmRlclBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoubXRpbWVNcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLm10aW1lTXMgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBtdGltZU1zLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5tdGltZU1zID0gb2JqLm10aW1lTXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouaW5mbyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmluZm8gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBpbmZvLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5pbmZvID0gSlNPTi5wYXJzZShvYmouaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYW4gaW5mbyBvYmplY3QgYmFzZWQgb24gdnBhdGggYW5kIG1vdW50ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHBhcmFtIG1vdW50ZWQgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIGZpbmRQYXRoTW91bnRlZCh2cGF0aDogc3RyaW5nLCBtb3VudGVkOiBzdHJpbmcpIHtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGZvdW5kID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgICAgIFNFTEVDVCB2cGF0aCwgbW91bnRlZFxuICAgICAgICAgICAgRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9XG4gICAgICAgICAgICBXSEVSRSBcbiAgICAgICAgICAgIHZwYXRoID0gJHZwYXRoIEFORCBtb3VudGVkID0gJG1vdW50ZWRcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJHZwYXRoOiB2cGF0aCxcbiAgICAgICAgICAgICRtb3VudGVkOiBtb3VudGVkXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBtYXBwZWQgPSA8YW55W10+Zm91bmQubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgbWFwcGVkKSB7XG4gICAgICAgICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXBwZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBhbiBpbmZvIG9iamVjdCBieSB0aGUgdnBhdGguXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIGZpbmRCeVBhdGgodnBhdGg6IHN0cmluZykge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kQnlQYXRoICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX0gJHt2cGF0aH1gKTtcblxuICAgICAgICBjb25zdCBmb3VuZCA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgICAgICBTRUxFQ1QgKlxuICAgICAgICAgICAgRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9XG4gICAgICAgICAgICBXSEVSRSBcbiAgICAgICAgICAgIHZwYXRoID0gJHZwYXRoIE9SIHJlbmRlclBhdGggPSAkdnBhdGhcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJHZwYXRoOiB2cGF0aFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSA8YW55W10+Zm91bmQubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgbWFwcGVkKSB7XG4gICAgICAgICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXBwZWQ7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFuZGxlQ2hhbmdlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlQ2hhbmdlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgT09PT09PT09HQSEhISBSZWNlaXZlZCBhIGZpbGUgdGhhdCBzaG91bGQgYmUgaW5nb3JlZCBgLCBpbmZvKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZUNoYW5nZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGFuZGxlQ2hhbmdlZCAke2luZm8udnBhdGh9ICR7aW5mby5tZXRhZGF0YSAmJiBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA/IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlIDogJz8/Pyd9YCk7XG5cbiAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpbmZvKTtcbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmZpbmRQYXRoTW91bnRlZChpbmZvLnZwYXRoLCBpbmZvLm1vdW50ZWQpO1xuXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgIC8vICAgICB2cGF0aDogeyBlcTogaW5mby52cGF0aCB9LFxuICAgICAgICAvLyAgICAgbW91bnRlZDogeyBlcTogaW5mby5tb3VudGVkIH1cbiAgICAgICAgLy8gfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICFBcnJheS5pc0FycmF5KHJlc3VsdClcbiAgICAgICAgIHx8IHJlc3VsdC5sZW5ndGggPD0gMFxuICAgICAgICApIHtcbiAgICAgICAgICAgIC8vIEl0IHdhc24ndCBmb3VuZCBpbiB0aGUgZGF0YWJhc2UuICBIZW5jZVxuICAgICAgICAgICAgLy8gd2Ugc2hvdWxkIGFkZCBpdC5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUFkZGVkKG5hbWUsIGluZm8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVEb2NJbkRCKGluZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUNoYW5nZWQobmFtZSwgaW5mbyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoaW5mbykge1xuICAgICAgICBhd2FpdCB0aGlzLiNkYW8udXBkYXRlKHtcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIC8vIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfSBhcyBUKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXZSByZWNlaXZlIHRoaXM6XG4gICAgICpcbiAgICAgKiB7XG4gICAgICogICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICogICAgdnBhdGg6IHZwYXRoLFxuICAgICAqICAgIG1pbWU6IG1pbWUuZ2V0VHlwZShmc3BhdGgpLFxuICAgICAqICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAqICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAqICAgIHBhdGhJbk1vdW50ZWQ6IGNvbXB1dGVkIHJlbGF0aXZlIHBhdGhcbiAgICAgKiAgICBzdGFjazogWyBhcnJheSBvZiB0aGVzZSBpbnN0YW5jZXMgXVxuICAgICAqIH1cbiAgICAgKlxuICAgICAqIE5lZWQgdG8gYWRkOlxuICAgICAqICAgIHJlbmRlclBhdGhcbiAgICAgKiAgICBBbmQgZm9yIEhUTUwgcmVuZGVyIGZpbGVzLCBhZGQgdGhlIGJhc2VNZXRhZGF0YSBhbmQgZG9jTWV0YWRhdGFcbiAgICAgKlxuICAgICAqIFNob3VsZCByZW1vdmUgdGhlIHN0YWNrLCBzaW5jZSBpdCdzIGxpa2VseSBub3QgdXNlZnVsIHRvIHVzLlxuICAgICAqL1xuXG4gICAgYXN5bmMgaGFuZGxlQWRkZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyAgY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVBZGRlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgT09PT09PT09HQSEhISBSZWNlaXZlZCBhIGZpbGUgdGhhdCBzaG91bGQgYmUgaW5nb3JlZCBgLCBpbmZvKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZUFkZGVkIGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGluZm8pO1xuICAgICAgICBpbmZvLnN0YWNrID0gdW5kZWZpbmVkO1xuICAgICAgICBhd2FpdCB0aGlzLmluc2VydERvY1RvREIoaW5mbyk7XG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmhvb2tGaWxlQWRkZWQobmFtZSwgaW5mbyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbykge1xuICAgICAgICBhd2FpdCB0aGlzLiNkYW8uaW5zZXJ0KHtcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIC8vIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfSBhcyBUKTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVVbmxpbmtlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlVW5saW5rZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVVbmxpbmtlZCBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVVbmxpbmtlZChuYW1lLCBpbmZvKTtcblxuICAgICAgICBhd2FpdCB0aGlzLiNkYW8uc3FsZGIucnVuKGBcbiAgICAgICAgICAgIERFTEVURSBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgICAgIFdIRVJFXG4gICAgICAgICAgICB2cGF0aCA9ICR2cGF0aCBBTkQgbW91bnRlZCA9ICRtb3VudGVkXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICR2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgICRtb3VudGVkOiBpbmZvLm1vdW50ZWRcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGF3YWl0IHRoaXMuI2Rhby5kZWxldGVBbGwoe1xuICAgICAgICAvLyAgICAgdnBhdGg6IHsgZXE6IGluZm8udnBhdGggfSxcbiAgICAgICAgLy8gICAgIG1vdW50ZWQ6IHsgZXE6IGluZm8ubW91bnRlZCB9XG4gICAgICAgIC8vIH0gYXMgV2hlcmU8VD4pO1xuICAgIH1cblxuICAgIGFzeW5jIGhhbmRsZVJlYWR5KG5hbWUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVSZWFkeWApO1xuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZVJlYWR5IGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jaXNfcmVhZHkgPSB0cnVlO1xuICAgICAgICB0aGlzLmVtaXQoJ3JlYWR5JywgbmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgZGlyZWN0b3J5IG1vdW50IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGZpbGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGluZm9cbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGZpbGVEaXJNb3VudChpbmZvKSB7XG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiBtYXBwZWQpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkaXJNb3VudCBmb3IgJHtpbmZvLnZwYXRofSAtLSAke3V0aWwuaW5zcGVjdChpbmZvKX0gPT09ICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgICAgICBpZiAoaW5mby5tb3VudFBvaW50ID09PSBkaXIubW91bnRQb2ludCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaG91bGQgdGhpcyBmaWxlIGJlIGlnbm9yZWQsIGJhc2VkIG9uIHRoZSBgaWdub3JlYCBmaWVsZFxuICAgICAqIGluIHRoZSBtYXRjaGluZyBgZGlyYCBtb3VudCBlbnRyeS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgaWdub3JlRmlsZShpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgY29uc3QgZGlyTW91bnQgPSB0aGlzLmZpbGVEaXJNb3VudChpbmZvKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgJHtpbmZvLnZwYXRofSBkaXJNb3VudCAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIGxldCBpZ25vcmUgPSBmYWxzZTtcbiAgICAgICAgaWYgKGRpck1vdW50KSB7XG5cbiAgICAgICAgICAgIGxldCBpZ25vcmVzO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXJNb3VudC5pZ25vcmUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IFsgZGlyTW91bnQuaWdub3JlIF07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGlyTW91bnQuaWdub3JlKSkge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBkaXJNb3VudC5pZ25vcmU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpZ25vcmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1pY3JvbWF0Y2guaXNNYXRjaChpbmZvLnZwYXRoLCBpKSkgaWdub3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZGlyTW91bnQuaWdub3JlICR7ZnNwYXRofSAke2l9ID0+ICR7aWdub3JlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgKGlnbm9yZSkgY29uc29sZS5sb2coYE1VU1QgaWdub3JlIEZpbGUgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgZm9yICR7aW5mby52cGF0aH0gPT0+ICR7aWdub3JlfWApO1xuICAgICAgICAgICAgcmV0dXJuIGlnbm9yZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vIG1vdW50PyAgdGhhdCBtZWFucyBzb21ldGhpbmcgc3RyYW5nZVxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgTm8gZGlyTW91bnQgZm91bmQgZm9yICR7aW5mby52cGF0aH0gLyAke2luZm8uZGlyTW91bnRlZE9ufWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGxvdyBhIGNhbGxlciB0byB3YWl0IHVudGlsIHRoZSA8ZW0+cmVhZHk8L2VtPiBldmVudCBoYXNcbiAgICAgKiBiZWVuIHNlbnQgZnJvbSB0aGUgRGlyc1dhdGNoZXIgaW5zdGFuY2UuICBUaGlzIGV2ZW50IG1lYW5zIHRoZVxuICAgICAqIGluaXRpYWwgaW5kZXhpbmcgaGFzIGhhcHBlbmVkLlxuICAgICAqL1xuICAgIGFzeW5jIGlzUmVhZHkoKSB7XG4gICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZGlyZWN0b3JpZXMsIHRoZXJlIHdvbid0IGJlIGFueSBmaWxlcyBcbiAgICAgICAgLy8gdG8gbG9hZCwgYW5kIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICB3aGlsZSAodGhpcy4jZGlycy5sZW5ndGggPiAwICYmICF0aGlzLiNpc19yZWFkeSkge1xuICAgICAgICAgICAgLy8gVGhpcyBkb2VzIGEgMTAwbXMgcGF1c2VcbiAgICAgICAgICAgIC8vIFRoYXQgbGV0cyB1cyBjaGVjayBpc19yZWFkeSBldmVyeSAxMDBtc1xuICAgICAgICAgICAgLy8gYXQgdmVyeSBsaXR0bGUgY29zdFxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCFpc1JlYWR5ICR7dGhpcy5uYW1lfSAke3RoaXNbX3N5bWJfZGlyc10ubGVuZ3RofSAke3RoaXNbX3N5bWJfaXNfcmVhZHldfWApO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGFzeW5jIHBhdGhzKHJvb3RQYXRoPzogc3RyaW5nKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8UGF0aHNSZXR1cm5UeXBlPj5cbiAgICB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cblxuICAgICAgICBsZXQgcm9vdFAgPSByb290UGF0aD8uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IHJvb3RQYXRoPy5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogcm9vdFBhdGg7XG5cbiAgICAgICAgLy8gVGhpcyBpcyBjb3BpZWQgZnJvbSB0aGUgb2xkZXIgdmVyc2lvblxuICAgICAgICAvLyAoTG9raUpTIHZlcnNpb24pIG9mIHRoaXMgZnVuY3Rpb24uICBJdFxuICAgICAgICAvLyBzZWVtcyBtZWFudCB0byBlbGltaW5hdGUgZHVwbGljYXRlcy5cbiAgICAgICAgY29uc3QgdnBhdGhzU2VlbiA9IG5ldyBTZXQoKTtcblxuICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKFxuICAgICAgICAodHlwZW9mIHJvb3RQID09PSAnc3RyaW5nJykgP1xuICAgICAgICBgXG4gICAgICAgICAgICBTRUxFQ1QgKiBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgICAgIFdIRVJFXG4gICAgICAgICAgICByZW5kZXJQYXRoIExJS0UgJHJvb3RQXG4gICAgICAgICAgICBPUkRFUiBCWSBtdGltZU1zIEFTQ1xuICAgICAgICBgXG4gICAgICAgIDogYFxuICAgICAgICAgICAgU0VMRUNUICogRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9XG4gICAgICAgICAgICBPUkRFUiBCWSBtdGltZU1zIEFTQ1xuICAgICAgICBgLFxuICAgICAgICAodHlwZW9mIHJvb3RQID09PSAnc3RyaW5nJylcbiAgICAgICAgPyB7ICRyb290UDogYCR7cm9vdFB9JWAgfVxuICAgICAgICA6IHt9KVxuXG4gICAgICAgIC8vIGNvbnN0IHNlbGVjdG9yID0ge1xuICAgICAgICAvLyAgICAgb3JkZXI6IHsgbXRpbWVNczogdHJ1ZSB9XG4gICAgICAgIC8vIH0gYXMgYW55O1xuICAgICAgICAvLyBpZiAodHlwZW9mIHJvb3RQID09PSAnc3RyaW5nJ1xuICAgICAgICAvLyAmJiByb290UC5sZW5ndGggPj0gMSkge1xuICAgICAgICAvLyAgICAgc2VsZWN0b3IucmVuZGVyUGF0aCA9IHtcbiAgICAgICAgLy8gICAgICAgICBpc0xpa2U6IGAke3Jvb3RQfSVgXG4gICAgICAgIC8vICAgICAgICAgLy8gc3FsOiBgIHJlbmRlclBhdGggcmVnZXhwICdeJHtyb290UH0nIGBcbiAgICAgICAgLy8gICAgIH07XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gLy8gY29uc29sZS5sb2coYHBhdGhzICR7dXRpbC5pbnNwZWN0KHNlbGVjdG9yKX1gKTtcbiAgICAgICAgLy8gY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHNlbGVjdG9yKTtcbiAgICAgICAgY29uc3QgcmVzdWx0MiA9IHJlc3VsdHMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHBhdGhzID9pZ25vcmU/ICR7aXRlbS52cGF0aH1gKTtcbiAgICAgICAgICAgIGlmIChmY2FjaGUuaWdub3JlRmlsZShpdGVtKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2cGF0aHNTZWVuLmhhcygoaXRlbSBhcyBBc3NldCkudnBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2cGF0aHNTZWVuLmFkZCgoaXRlbSBhcyBBc3NldCkudnBhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSA8YW55W10+cmVzdWx0Mi5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdnRSb3dUb09iaihpdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBtYXBwZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hcHBlZDtcblxuICAgICAgICAvLyBUaGlzIHN0YWdlIGNvbnZlcnRzIHRoZSBpdGVtcyBcbiAgICAgICAgLy8gcmVjZWl2ZWQgYnkgdGhpcyBmdW5jdGlvbiBpbnRvXG4gICAgICAgIC8vIHdoYXQgaXMgcmVxdWlyZWQgZnJvbVxuICAgICAgICAvLyB0aGUgcGF0aHMgbWV0aG9kLlxuICAgICAgICAvLyBjb25zdCByZXN1bHQ0XG4gICAgICAgIC8vICAgICAgICAgPSBuZXcgQXJyYXk8UGF0aHNSZXR1cm5UeXBlPigpO1xuICAgICAgICAvLyBmb3IgKGNvbnN0IGl0ZW0gb2YgcmVzdWx0Mykge1xuICAgICAgICAvLyAgICAgcmVzdWx0NC5wdXNoKDxQYXRoc1JldHVyblR5cGU+e1xuICAgICAgICAvLyAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAvLyAgICAgICAgIG1pbWU6IGl0ZW0ubWltZSxcbiAgICAgICAgLy8gICAgICAgICBtb3VudGVkOiBpdGVtLm1vdW50ZWQsXG4gICAgICAgIC8vICAgICAgICAgbW91bnRQb2ludDogaXRlbS5tb3VudFBvaW50LFxuICAgICAgICAvLyAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGl0ZW0ucGF0aEluTW91bnRlZCxcbiAgICAgICAgLy8gICAgICAgICBtdGltZU1zOiBpdGVtLm10aW1lTXMsXG4gICAgICAgIC8vICAgICAgICAgaW5mbzogaXRlbS5pbmZvLFxuICAgICAgICAvLyAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGl0ZW0ubW91bnRlZCwgaXRlbS5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgLy8gICAgICAgICByZW5kZXJQYXRoOiBpdGVtLnZwYXRoXG4gICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgLy8gfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgZmlsZSB3aXRoaW4gdGhlIGNhY2hlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBUaGUgdnBhdGggb3IgcmVuZGVyUGF0aCB0byBsb29rIGZvclxuICAgICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgICovXG4gICAgYXN5bmMgZmluZChfZnBhdGgpOiBQcm9taXNlPFQ+IHtcblxuICAgICAgICBpZiAodHlwZW9mIF9mcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZCBwYXJhbWV0ZXIgbm90IHN0cmluZyAke3R5cGVvZiBfZnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChmcGF0aCk7XG5cbiAgICAgICAgLy8gY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgIC8vICAgICBvcjogW1xuICAgICAgICAvLyAgICAgICAgIHsgdnBhdGg6IHsgZXE6IGZwYXRoIH19LFxuICAgICAgICAvLyAgICAgICAgIHsgcmVuZGVyUGF0aDogeyBlcTogZnBhdGggfX1cbiAgICAgICAgLy8gICAgIF1cbiAgICAgICAgLy8gfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kICR7X2ZwYXRofSAke2ZwYXRofSA9PT4gcmVzdWx0MSAke3V0aWwuaW5zcGVjdChyZXN1bHQxKX0gYCk7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MiA9IDxhbnlbXT5yZXN1bHQxLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0Mikge1xuICAgICAgICAvLyAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShyZXN1bHQpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmQgJHtfZnBhdGh9ICR7ZnBhdGh9ID09PiByZXN1bHQyICR7dXRpbC5pbnNwZWN0KHJlc3VsdDIpfSBgKTtcblxuICAgICAgICBsZXQgcmV0O1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldCA9IHJlc3VsdDJbMF07XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICByZXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXQgPSByZXN1bHQyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgI2ZFeGlzdHNJbkRpcihmcGF0aCwgZGlyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGAjZkV4aXN0c0luRGlyICR7ZnBhdGh9ICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgIGlmIChkaXIubW91bnRQb2ludCA9PT0gJy8nKSB7XG4gICAgICAgICAgICBjb25zdCBmc3BhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgZGlyLm1vdW50ZWQsIGZwYXRoXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzTXRpbWU6IHN0YXRzLm10aW1lTXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1wID0gZGlyLm1vdW50UG9pbnQuc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IGRpci5tb3VudFBvaW50LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgOiBkaXIubW91bnRQb2ludDtcbiAgICAgICAgbXAgPSBtcC5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IG1wXG4gICAgICAgICAgICA6IChtcCsnLycpO1xuXG4gICAgICAgIGlmIChmcGF0aC5zdGFydHNXaXRoKG1wKSkge1xuICAgICAgICAgICAgbGV0IHBhdGhJbk1vdW50ZWRcbiAgICAgICAgICAgICAgICA9IGZwYXRoLnJlcGxhY2UoZGlyLm1vdW50UG9pbnQsICcnKTtcbiAgICAgICAgICAgIGxldCBmc3BhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgZGlyLm1vdW50ZWQsIHBhdGhJbk1vdW50ZWQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENoZWNraW5nIGV4aXN0IGZvciAke2Rpci5tb3VudFBvaW50fSAke2Rpci5tb3VudGVkfSAke3BhdGhJbk1vdW50ZWR9ICR7ZnNwYXRofWApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogc3RhdHMubXRpbWVNc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZ1bGZpbGxzIHRoZSBcImZpbmRcIiBvcGVyYXRpb24gbm90IGJ5XG4gICAgICogbG9va2luZyBpbiB0aGUgZGF0YWJhc2UsIGJ1dCBieSBzY2FubmluZ1xuICAgICAqIHRoZSBmaWxlc3lzdGVtIHVzaW5nIHN5bmNocm9ub3VzIGNhbGxzLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBmaW5kU3luYyhfZnBhdGgpOiBWUGF0aERhdGEgfCB1bmRlZmluZWQge1xuXG4gICAgICAgIGlmICh0eXBlb2YgX2ZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaW5kIHBhcmFtZXRlciBub3Qgc3RyaW5nICR7dHlwZW9mIF9mcGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRTeW5jIGxvb2tpbmcgZm9yICR7ZnBhdGh9IGluICR7dXRpbC5pbnNwZWN0KG1hcHBlZCl9YCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgbWFwcGVkKSB7XG4gICAgICAgICAgICBpZiAoIShkaXI/Lm1vdW50UG9pbnQpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBmaW5kU3luYyBiYWQgZGlycyBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmRpcnMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZm91bmQgPSB0aGlzLiNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcik7XG4gICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZFN5bmMgJHtmcGF0aH0gZm91bmRgLCBmb3VuZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gVE9ETyBJcyB0aGlzIGZ1bmN0aW9uIHVzZWQgYW55d2hlcmU/XG4gICAgYXN5bmMgZmluZEFsbCgpIHtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAvLyB9IGFzIEZpbHRlcjxUPik7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgICAgICBTRUxFQ1QgKiBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgYCwge30pO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDIgPSByZXN1bHQxLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kQWxsID9pZ25vcmU/ICR7aXRlbS52cGF0aH1gKTtcbiAgICAgICAgICAgIHJldHVybiAhKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdDMgPSByZXN1bHQyLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN2dFJvd1RvT2JqKGl0ZW0pO1xuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gcmVzdWx0MztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldHNGaWxlQ2FjaGU8XG4gICAgVCBleHRlbmRzIEFzc2V0LFxuICAgIFRkYW8gZXh0ZW5kcyBCYXNlREFPPFQ+XG4+IGV4dGVuZHMgQmFzZUZpbGVDYWNoZTxULCBUZGFvPiB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb01vdW50W10sXG4gICAgICAgIGRhbzogVGRhb1xuICAgICkge1xuICAgICAgICBzdXBlcihjb25maWcsIG5hbWUsIGRpcnMsIGRhbyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKG9iajogYW55KTogQXNzZXQge1xuICAgICAgICBjb25zdCByZXQ6IEFzc2V0ID0gbmV3IEFzc2V0KCk7XG4gICAgICAgIHRoaXMuY3Z0Um93VG9PYmpCQVNFKG9iaiwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlc0ZpbGVDYWNoZTxcbiAgICBUIGV4dGVuZHMgTGF5b3V0IHwgUGFydGlhbCxcbiAgICBUZGFvIGV4dGVuZHMgQmFzZURBTzxUPj5cbiAgICBleHRlbmRzIEJhc2VGaWxlQ2FjaGU8VCwgVGRhbz4ge1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb01vdW50W10sXG4gICAgICAgIGRhbzogVGRhbyxcbiAgICAgICAgdHlwZTogXCJsYXlvdXRcIiB8IFwicGFydGlhbFwiXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKGNvbmZpZywgbmFtZSwgZGlycywgZGFvKTtcbiAgICAgICAgdGhpcy4jdHlwZSA9IHR5cGU7XG4gICAgfVxuXG4gICAgLy8gQmVjYXVzZSB0aGlzIGNsYXNzIHNlcnZlcyB0d28gcHVycG9zZXMsIExheW91dFxuICAgIC8vIGFuZCBQYXJ0aWFscywgdGhpcyBmbGFnIGhlbHBzIHRvIGRpc3Rpbmd1aXNoLlxuICAgIC8vIEFueSBwbGFjZSwgbGlrZSBjdnRSb3dUb09iaiwgd2hpY2ggbmVlZHMgdG8ga25vd1xuICAgIC8vIHdoaWNoIGlzIHdoaWNoIGNhbiB1c2UgdGhlc2UgZ2V0dGVycyB0byBkb1xuICAgIC8vIHRoZSByaWdodCB0aGluZy5cblxuICAgICN0eXBlOiBcImxheW91dFwiIHwgXCJwYXJ0aWFsXCI7XG4gICAgZ2V0IGlzTGF5b3V0KCkgeyByZXR1cm4gdGhpcy4jdHlwZSA9PT0gXCJsYXlvdXRcIjsgfVxuICAgIGdldCBpc1BhcnRpYWwoKSB7IHJldHVybiB0aGlzLiN0eXBlID09PSBcInBhcnRpYWxcIjsgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKG9iajogYW55KTogTGF5b3V0IHwgUGFydGlhbCB7XG4gICAgICAgIGNvbnN0IHJldDogTGF5b3V0IHwgUGFydGlhbCA9IFxuICAgICAgICAgICAgICAgIHRoaXMuaXNMYXlvdXQgPyBuZXcgTGF5b3V0KCkgOiBuZXcgUGFydGlhbCgpO1xuICAgICAgICB0aGlzLmN2dFJvd1RvT2JqQkFTRShvYmosIHJldCk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jTWV0YWRhdGEgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmouZG9jTWV0YWRhdGEgIT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5kb2NNZXRhZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRlbXBsYXRlc0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBkb2NNZXRhZGF0YSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldC5kb2NNZXRhZGF0YSA9IG9iai5kb2NNZXRhZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5kb2NDb250ZW50ICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgJiYgb2JqLmRvY0NvbnRlbnQgIT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5kb2NDb250ZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGVtcGxhdGVzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIGRvY0NvbnRlbnQsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXQuZG9jQ29udGVudCA9IG9iai5kb2NDb250ZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmRvY0JvZHkgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmouZG9jQm9keSAhPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmRvY0JvZHkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUZW1wbGF0ZXNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgZG9jQm9keSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldC5kb2NCb2R5ID0gb2JqLmRvY0JvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoubWV0YWRhdGEgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmoubWV0YWRhdGEgIT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5tZXRhZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRlbXBsYXRlc0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBtZXRhZGF0YSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldC5tZXRhZGF0YSA9IG9iai5tZXRhZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdhdGhlciB0aGUgYWRkaXRpb25hbCBkYXRhIHN1aXRhYmxlXG4gICAgICogZm9yIFBhcnRpYWwgYW5kIExheW91dCB0ZW1wbGF0ZXMuICBUaGVcbiAgICAgKiBmdWxsIGRhdGEgc2V0IHJlcXVpcmVkIGZvciBEb2N1bWVudHMgaXNcbiAgICAgKiBub3Qgc3VpdGFibGUgZm9yIHRoZSB0ZW1wbGF0ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5mbyBcbiAgICAgKi9cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvKSB7XG5cbiAgICAgICAgaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgaW5mby5kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAoaW5mby5kaXJuYW1lID09PSAnLicpIGluZm8uZGlybmFtZSA9ICcvJztcblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpbmZvLnJlbmRlcmVyID0gcmVuZGVyZXI7XG5cblxuICAgICAgICBpZiAocmVuZGVyZXIpIHtcblxuXG4gICAgICAgICAgICBpZiAocmVuZGVyZXIucGFyc2VNZXRhZGF0YSkge1xuXG4gICAgICAgICAgICAgICAgLy8gVXNpbmcgPGFueT4gaGVyZSBjb3ZlcnMgb3ZlclxuICAgICAgICAgICAgICAgIC8vIHRoYXQgcGFyc2VNZXRhZGF0YSByZXF1aXJlc1xuICAgICAgICAgICAgICAgIC8vIGEgUmVuZGVyaW5nQ29udGV4dCB3aGljaFxuICAgICAgICAgICAgICAgIC8vIGluIHR1cm4gcmVxdWlyZXMgYSBcbiAgICAgICAgICAgICAgICAvLyBtZXRhZGF0YSBvYmplY3QuXG4gICAgICAgICAgICAgICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKDxhbnk+e1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGluZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBGUy5yZWFkRmlsZVN5bmMoaW5mby5mc3BhdGgsICd1dGYtOCcpXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkb2NNZXRhZGF0YSBpcyB0aGUgdW5tb2RpZmllZCBtZXRhZGF0YS9mcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBkb2N1bWVudFxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEgPSByYy5tZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvLyBkb2NDb250ZW50IGlzIHRoZSB1bnBhcnNlZCBvcmlnaW5hbCBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gaW5jbHVkaW5nIGFueSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9IHJjLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIGNvbXB1dGVkIG1ldGFkYXRhIHRoYXQgaW5jbHVkZXMgZGF0YSBmcm9tIFxuICAgICAgICAgICAgICAgIC8vIHNldmVyYWwgc291cmNlc1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEgPSB7IH07XG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLmRvY01ldGFkYXRhKSBpbmZvLmRvY01ldGFkYXRhID0ge307XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW5pdE1ldGFkYXRhICR7YmFzZWRpcn0gJHtmcGF0aH0gYmFzZU1ldGFkYXRhICR7YmFzZU1ldGFkYXRhW3lwcm9wXX1gKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSBpbmZvLmJhc2VNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFRlbXBsYXRlc0ZpbGVDYWNoZSBhZnRlciBnYXRoZXJJbmZvRGF0YSBgLCBpbmZvKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLnVwZGF0ZSgoe1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICB9IGFzIHVua25vd24pIGFzIFQpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKGluZm86IGFueSkge1xuICAgICAgICBhd2FpdCB0aGlzLmRhby5pbnNlcnQoKHtcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfSBhcyB1bmtub3duKSBhcyBUKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEb2N1bWVudHNGaWxlQ2FjaGVcbiAgICBleHRlbmRzIEJhc2VGaWxlQ2FjaGU8RG9jdW1lbnQsIFRkb2N1bWVudHNzREFPPiB7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRpcnM6IGRpclRvTW91bnRbXVxuICAgICkge1xuICAgICAgICBzdXBlcihjb25maWcsIG5hbWUsIGRpcnMsIGRvY3VtZW50c0RBTyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGN2dFJvd1RvT2JqKG9iajogYW55KTogRG9jdW1lbnQge1xuICAgICAgICBjb25zdCByZXQ6IERvY3VtZW50ID0gbmV3IERvY3VtZW50KCk7XG4gICAgICAgIHRoaXMuY3Z0Um93VG9PYmpCQVNFKG9iaiwgcmV0KTtcblxuICAgICAgICBpZiAodHlwZW9mIG9iai5kb2NNZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5kb2NNZXRhZGF0YSAhPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmRvY01ldGFkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIGRvY01ldGFkYXRhLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0LmRvY01ldGFkYXRhID0gb2JqLmRvY01ldGFkYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmRvY0NvbnRlbnQgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmouZG9jQ29udGVudCAhPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmRvY0NvbnRlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgZG9jQ29udGVudCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldC5kb2NDb250ZW50ID0gb2JqLmRvY0NvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jQm9keSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5kb2NCb2R5ICE9PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jQm9keSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBkb2NCb2R5LCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0LmRvY0JvZHkgPSBvYmouZG9jQm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5tZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5tZXRhZGF0YSAhPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLm1ldGFkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIG1ldGFkYXRhLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0Lm1ldGFkYXRhID0gb2JqLm1ldGFkYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbykge1xuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIGluZm8uZGlybmFtZSA9IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8uZGlybmFtZSA9PT0gJy4nKSBpbmZvLmRpcm5hbWUgPSAnLyc7XG4gICAgICAgIGluZm8ucGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGluZm8uZGlybmFtZSk7XG5cbiAgICAgICAgLy8gZmluZCB0aGUgbW91bnRlZCBkaXJlY3RvcnksXG4gICAgICAgIC8vIGdldCB0aGUgYmFzZU1ldGFkYXRhXG4gICAgICAgIGZvciAobGV0IGRpciBvZiByZW1hcGRpcnModGhpcy5kaXJzKSkge1xuICAgICAgICAgICAgaWYgKGRpci5tb3VudGVkID09PSBpbmZvLm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlyLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLmJhc2VNZXRhZGF0YSA9IGRpci5iYXNlTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2V0IHB1YmxpY2F0aW9uRGF0ZSBzb21laG93XG5cblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpbmZvLnJlbmRlcmVyID0gcmVuZGVyZXI7XG5cbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby52cGF0aCk7XG5cbiAgICAgICAgICAgIC8vIFRoaXMgd2FzIGluIHRoZSBMb2tpSlMgY29kZSwgYnV0XG4gICAgICAgICAgICAvLyB3YXMgbm90IGluIHVzZS5cbiAgICAgICAgICAgIC8vIGluZm8ucmVuZGVybmFtZSA9IHBhdGguYmFzZW5hbWUoXG4gICAgICAgICAgICAvLyAgICAgaW5mby5yZW5kZXJQYXRoXG4gICAgICAgICAgICAvLyApO1xuXG4gICAgICAgICAgICBpbmZvLnJlbmRlcnNUb0hUTUwgPSBtaWNyb21hdGNoLmlzTWF0Y2goXG4gICAgICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICcqKi8qLmh0bWwnKVxuICAgICAgICAgICAgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBVc2luZyA8YW55PiBoZXJlIGNvdmVycyBvdmVyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBwYXJzZU1ldGFkYXRhIHJlcXVpcmVzXG4gICAgICAgICAgICAgICAgLy8gYSBSZW5kZXJpbmdDb250ZXh0IHdoaWNoXG4gICAgICAgICAgICAgICAgLy8gaW4gdHVybiByZXF1aXJlcyBhIFxuICAgICAgICAgICAgICAgIC8vIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY01ldGFkYXRhIGlzIHRoZSB1bm1vZGlmaWVkIG1ldGFkYXRhL2Zyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YSA9IHJjLm1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQgaXMgdGhlIHVucGFyc2VkIG9yaWdpbmFsIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAvLyBpbmNsdWRpbmcgYW55IGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NDb250ZW50ID0gcmMuY29udGVudDtcbiAgICAgICAgICAgICAgICAvLyBkb2NCb2R5IGlzIHRoZSBwYXJzZWQgYm9keSAtLSBlLmcuIGZvbGxvd2luZyB0aGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSByYy5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY29tcHV0ZWQgbWV0YWRhdGEgdGhhdCBpbmNsdWRlcyBkYXRhIGZyb20gXG4gICAgICAgICAgICAgICAgLy8gc2V2ZXJhbCBzb3VyY2VzXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YSA9IHsgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8uZG9jTWV0YWRhdGEpIGluZm8uZG9jTWV0YWRhdGEgPSB7fTtcblxuICAgICAgICAgICAgICAgIC8vIFRoZSByZXN0IG9mIHRoaXMgaXMgYWRhcHRlZCBmcm9tIHRoZSBvbGQgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAvLyBIVE1MUmVuZGVyZXIubmV3SW5pdE1ldGFkYXRhXG5cbiAgICAgICAgICAgICAgICAvLyBGb3Igc3RhcnRlcnMgdGhlIG1ldGFkYXRhIGlzIGNvbGxlY3RlZCBmcm9tIHNldmVyYWwgc291cmNlcy5cbiAgICAgICAgICAgICAgICAvLyAxKSB0aGUgbWV0YWRhdGEgc3BlY2lmaWVkIGluIHRoZSBkaXJlY3RvcnkgbW91bnQgd2hlcmVcbiAgICAgICAgICAgICAgICAvLyAgICB0aGlzIGRvY3VtZW50IHdhcyBmb3VuZFxuICAgICAgICAgICAgICAgIC8vIDIpIG1ldGFkYXRhIGluIHRoZSBwcm9qZWN0IGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgICAgICAvLyAzKSB0aGUgbWV0YWRhdGEgaW4gdGhlIGRvY3VtZW50LCBhcyBjYXB0dXJlZCBpbiBkb2NNZXRhZGF0YVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gaW5mby5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGluaXRNZXRhZGF0YSAke2Jhc2VkaXJ9ICR7ZnBhdGh9IGJhc2VNZXRhZGF0YSAke2Jhc2VNZXRhZGF0YVt5cHJvcF19YCk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5iYXNlTWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiB0aGlzLmNvbmZpZy5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IHRoaXMuY29uZmlnLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGZtbWNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmRvY01ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5kb2NNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgICAgIGZtbWNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhlIGNvbnRlbnQgbGFuZHMgaGVyZVxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGRvY3VtZW50IG9iamVjdCBoYXMgYmVlbiB1c2VmdWwgZm9yIFxuICAgICAgICAgICAgICAgIC8vIGNvbW11bmljYXRpbmcgdGhlIGZpbGUgcGF0aCBhbmQgb3RoZXIgZGF0YS5cbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50ID0ge307XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5iYXNlZGlyID0gaW5mby5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscGF0aCA9IGluZm8ucGF0aEluTW91bnRlZDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHJlbmRlciA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8ucGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5wYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvID0gaW5mby5yZW5kZXJQYXRoO1xuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIHRoZSA8ZW0+dGFnczwvZW0+IGZpZWxkIGlzIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgaWYgKCEoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoaW5mby5tZXRhZGF0YS50YWdzKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhZ2xpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmUgPSAvXFxzKixcXHMqLztcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzLnNwbGl0KHJlKS5mb3JFYWNoKHRhZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdsaXN0LnB1c2godGFnLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSB0YWdsaXN0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBgRk9STUFUIEVSUk9SIC0gJHtpbmZvLnZwYXRofSBoYXMgYmFkbHkgZm9ybWF0dGVkIHRhZ3MgYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEudGFncyA9IGluZm8ubWV0YWRhdGEudGFncztcblxuICAgICAgICAgICAgICAgIGlmIChpbmZvLm1ldGFkYXRhLmJsb2d0YWcpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5ibG9ndGFnID0gaW5mby5tZXRhZGF0YS5ibG9ndGFnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBUaGUgcm9vdCBVUkwgZm9yIHRoZSBwcm9qZWN0XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yb290X3VybCA9IHRoaXMuY29uZmlnLnJvb3RfdXJsO1xuXG4gICAgICAgICAgICAgICAgLy8gQ29tcHV0ZSB0aGUgVVJMIHRoaXMgZG9jdW1lbnQgd2lsbCByZW5kZXIgdG9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jb25maWcucm9vdF91cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHVSb290VXJsID0gbmV3IFVSTCh0aGlzLmNvbmZpZy5yb290X3VybCwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgICAgICAgICB1Um9vdFVybC5wYXRobmFtZSA9IHBhdGgubm9ybWFsaXplKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbih1Um9vdFVybC5wYXRobmFtZSwgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbylcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSB1Um9vdFVybC50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfdXJsID0gaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX2RhdGUgPSBpbmZvLnN0YXRzLm10aW1lO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VQdWJsRGF0ZSA9IChkYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IERhdGUucGFyc2UoZGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghIGlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRlU2V0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAmJiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgZGF0ZVNldCAmJiBpbmZvLm10aW1lTXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUoaW5mby5tdGltZU1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2luZm8udnBhdGh9IG1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSAke2luZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlfSBzZXQgZnJvbSBzdGF0cy5tdGltZWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2luZm8udnBhdGh9IG1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSAke2luZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlfSBzZXQgZnJvbSBjdXJyZW50IHRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGRlbGV0ZURvY1RhZ0dsdWUodnBhdGgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUodnBhdGgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIGlnbm9yZVxuICAgICAgICAgICAgLy8gVGhpcyBjYW4gdGhyb3cgYW4gZXJyb3IgbGlrZTpcbiAgICAgICAgICAgIC8vIGRvY3VtZW50c0NhY2hlIEVSUk9SIHtcbiAgICAgICAgICAgIC8vICAgICBjb2RlOiAnY2hhbmdlZCcsXG4gICAgICAgICAgICAvLyAgICAgbmFtZTogJ2RvY3VtZW50cycsXG4gICAgICAgICAgICAvLyAgICAgdnBhdGg6ICdfbWVybWFpZC9yZW5kZXIzMzU2NzM5MzgyLm1lcm1haWQnLFxuICAgICAgICAgICAgLy8gICAgIGVycm9yOiBFcnJvcjogZGVsZXRlIGZyb20gJ1RBR0dMVUUnIGZhaWxlZDogbm90aGluZyBjaGFuZ2VkXG4gICAgICAgICAgICAvLyAgICAgIC4uLiBzdGFjayB0cmFjZVxuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gSW4gc3VjaCBhIGNhc2UgdGhlcmUgaXMgbm8gdGFnR2x1ZSBmb3IgdGhlIGRvY3VtZW50LlxuICAgICAgICAgICAgLy8gVGhpcyBcImVycm9yXCIgaXMgc3B1cmlvdXMuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gVE9ETyBJcyB0aGVyZSBhbm90aGVyIHF1ZXJ5IHRvIHJ1biB0aGF0IHdpbGxcbiAgICAgICAgICAgIC8vIG5vdCB0aHJvdyBhbiBlcnJvciBpZiBub3RoaW5nIHdhcyBjaGFuZ2VkP1xuICAgICAgICAgICAgLy8gSW4gb3RoZXIgd29yZHMsIHRoaXMgY291bGQgaGlkZSBhIGxlZ2l0aW1hdGVcbiAgICAgICAgICAgIC8vIGVycm9yLlxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGFkZERvY1RhZ0dsdWUodnBhdGg6IHN0cmluZywgdGFnczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0YWdzICE9PSAnc3RyaW5nJ1xuICAgICAgICAgJiYgIUFycmF5LmlzQXJyYXkodGFncylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZERvY1RhZ0dsdWUgbXVzdCBiZSBnaXZlbiBhIHRhZ3MgYXJyYXksIHdhcyBnaXZlbjogJHt1dGlsLmluc3BlY3QodGFncyl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGdsdWUuYWRkVGFnR2x1ZSh2cGF0aCwgXG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KHRhZ3MpXG4gICAgICAgICAgICA/IHRhZ3NcbiAgICAgICAgICAgIDogWyB0YWdzIF0pO1xuICAgIH1cblxuICAgIGFzeW5jIGFkZFRhZ0Rlc2NyaXB0aW9uKHRhZzogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0ZGVzYy5hZGREZXNjKHRhZywgZGVzY3JpcHRpb24pO1xuICAgIH1cblxuICAgIGFzeW5jIGdldFRhZ0Rlc2NyaXB0aW9uKHRhZzogc3RyaW5nKVxuICAgICAgICA6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRkZXNjLmdldERlc2ModGFnKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvKSB7XG4gICAgICAgIGNvbnN0IGRvY0luZm8gPSA8RG9jdW1lbnQ+e1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIHBhcmVudERpcjogaW5mby5wYXJlbnREaXIsXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgdGFnczogQXJyYXkuaXNBcnJheShpbmZvLm1ldGFkYXRhPy50YWdzKVxuICAgICAgICAgICAgICAgICAgICA/IGluZm8ubWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAgICA6IFtdLFxuICAgICAgICAgICAgbGF5b3V0OiBpbmZvLm1ldGFkYXRhPy5sYXlvdXQsXG4gICAgICAgICAgICBibG9ndGFnOiB0eXBlb2YgaW5mby5tZXRhZGF0YT8uYmxvZ3RhZyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICA/IGluZm8ubWV0YWRhdGE/LmJsb2d0YWdcbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH07XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYW8udXBkYXRlKGRvY0luZm8pO1xuXG4gICAgICAgIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUoZG9jSW5mby52cGF0aCk7XG4gICAgICAgIGF3YWl0IHRnbHVlLmFkZFRhZ0dsdWUoZG9jSW5mby52cGF0aCwgZG9jSW5mby50YWdzKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihpbmZvOiBhbnkpIHtcbiAgICAgICAgY29uc3QgZG9jSW5mbyA9IDxEb2N1bWVudD57XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgcGFyZW50RGlyOiBpbmZvLnBhcmVudERpcixcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICB0YWdzOiBBcnJheS5pc0FycmF5KGluZm8ubWV0YWRhdGE/LnRhZ3MpXG4gICAgICAgICAgICAgICAgICAgID8gaW5mby5tZXRhZGF0YS50YWdzXG4gICAgICAgICAgICAgICAgICAgIDogW10sXG4gICAgICAgICAgICBsYXlvdXQ6IGluZm8ubWV0YWRhdGE/LmxheW91dCxcbiAgICAgICAgICAgIGJsb2d0YWc6IHR5cGVvZiBpbmZvLm1ldGFkYXRhPy5ibG9ndGFnID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgID8gaW5mby5tZXRhZGF0YT8uYmxvZ3RhZ1xuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8uaW5zZXJ0KGRvY0luZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZERvY1RhZ0dsdWUoXG4gICAgICAgICAgICBkb2NJbmZvLnZwYXRoLCBkb2NJbmZvLnRhZ3NcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVVbmxpbmtlZChuYW1lOiBhbnksIGluZm86IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBzdXBlci5oYW5kbGVVbmxpbmtlZChuYW1lLCBpbmZvKTtcbiAgICAgICAgdGdsdWUuZGVsZXRlVGFnR2x1ZShpbmZvLnZwYXRoKTtcbiAgICB9XG5cbiAgICBhc3luYyBpbmRleENoYWluKF9mcGF0aCkge1xuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSkgXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXRoLnBhcnNlKGZwYXRoKTtcblxuICAgICAgICBjb25zdCBmaWxlejogRG9jdW1lbnRbXSA9IFtdO1xuICAgICAgICBjb25zdCBzZWxmID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgICdvcic6IFtcbiAgICAgICAgICAgICAgICB7IHZwYXRoOiB7IGVxOiBmcGF0aCB9IH0sXG4gICAgICAgICAgICAgICAgeyByZW5kZXJQYXRoOiB7IGVxOiBmcGF0aCB9IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGZwYXRoO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmKSAmJiBzZWxmLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICBmaWxlei5wdXNoKHNlbGZbMF0pO1xuICAgICAgICAgICAgZmlsZU5hbWUgPSBzZWxmWzBdLnJlbmRlclBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50RGlyO1xuICAgICAgICBsZXQgZGlyTmFtZSA9IHBhdGguZGlybmFtZShmcGF0aCk7XG4gICAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICghKGRpck5hbWUgPT09ICcuJyB8fCBkaXJOYW1lID09PSBwYXJzZWQucm9vdCkpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGVOYW1lKSA9PT0gJ2luZGV4Lmh0bWwnKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShmaWxlTmFtZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxvb2tGb3IgPSBwYXRoLmpvaW4ocGFyZW50RGlyLCBcImluZGV4Lmh0bWxcIik7XG5cbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgICAgICAnb3InOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgdnBhdGg6IHsgZXE6IGxvb2tGb3IgfSB9LFxuICAgICAgICAgICAgICAgICAgICB7IHJlbmRlclBhdGg6IHsgZXE6IGxvb2tGb3IgfSB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGluZGV4KSAmJiBpbmRleC5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgICAgIGZpbGV6LnB1c2goaW5kZXhbMF0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaWxlTmFtZSA9IGxvb2tGb3I7XG4gICAgICAgICAgICBkaXJOYW1lID0gcGF0aC5kaXJuYW1lKGxvb2tGb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbGV6XG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbihvYmo6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZm91bmREaXIgPSBvYmoubW91bnRQb2ludDtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmZvdW5kUGF0aCA9IG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICBvYmouZmlsZW5hbWUgPSAnLycgKyBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgYWxsIHRoZSBkb2N1bWVudHMgaW4gdGhlIHNhbWUgZGlyZWN0b3J5XG4gICAgICogYXMgdGhlIG5hbWVkIGZpbGUuXG4gICAgICpcbiAgICAgKiBUaGlzIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIHVzZWQgYW55d2hlcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHNpYmxpbmdzKF9mcGF0aCkge1xuICAgICAgICBsZXQgcmV0O1xuICAgICAgICBsZXQgdnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZSh2cGF0aCk7XG4gICAgICAgIC8vIGlmIChkaXJuYW1lID09PSAnLicpIGRpcm5hbWUgPSAnLyc7XG5cbiAgICAgICAgY29uc3Qgc2libGluZ3MgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUICogRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9XG4gICAgICAgICAgICBXSEVSRVxuICAgICAgICAgICAgZGlybmFtZSA9ICRkaXJuYW1lIEFORFxuICAgICAgICAgICAgdnBhdGggPD4gJHZwYXRoIEFORFxuICAgICAgICAgICAgcmVuZGVyUGF0aCA8PiAkdnBhdGggQU5EXG4gICAgICAgICAgICByZW5kZXJzVG9IdG1sID0gdHJ1ZVxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkZGlybmFtZTogZGlybmFtZSxcbiAgICAgICAgICAgICR2cGF0aDogdnBhdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gY29uc3Qgc2libGluZ3MgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAvLyAgICAgZGlybmFtZTogeyBlcTogZGlybmFtZSB9LFxuICAgICAgICAvLyAgICAgLy8gVGhlIHNpYmxpbmdzIGNhbm5vdCBpbmNsdWRlIHRoZSBzZWxmLlxuICAgICAgICAvLyAgICAgdnBhdGg6IHsgbmVxOiB2cGF0aCB9LFxuICAgICAgICAvLyAgICAgcmVuZGVyUGF0aDogeyBuZXE6IHZwYXRoIH0sXG4gICAgICAgIC8vICAgICByZW5kZXJzVG9IVE1MOiB0cnVlXG4gICAgICAgIC8vIH0pO1xuICAgICAgICBjb25zdCBpZ25vcmVkID0gc2libGluZ3MuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLmlnbm9yZUZpbGUoaXRlbSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IGlnbm9yZWQubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgbWFwcGVkKSB7XG4gICAgICAgICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXBwZWQ7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdHJlZSBvZiBpdGVtcyBzdGFydGluZyBmcm9tIHRoZSBkb2N1bWVudFxuICAgICAqIG5hbWVkIGluIF9yb290SXRlbS4gIFRoZSBwYXJhbWV0ZXIgc2hvdWxkIGJlIGFuXG4gICAgICogYWN0dWFsIGRvY3VtZW50IGluIHRoZSB0cmVlLCBzdWNoIGFzIGBwYXRoL3RvL2luZGV4Lmh0bWxgLlxuICAgICAqIFRoZSByZXR1cm4gaXMgYSB0cmVlLXNoYXBlZCBzZXQgb2Ygb2JqZWN0cyBsaWtlIHRoZSBmb2xsb3dpbmc7XG4gICAgICogXG4gIHRyZWU6XG4gICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXJcbiAgICBpdGVtczpcbiAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sLm1kXG4gICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgY2hpbGRGb2xkZXJzOlxuICAgICAgICAtIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyXG4gICAgICAgICAgY2hpbGRyZW46XG4gICAgICAgICAgICAgIHJvb3RJdGVtOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgICAgICAgICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyXG4gICAgICAgICAgICAgIGl0ZW1zOlxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMS5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMS5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTIuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTIuaHRtbFxuICAgICAgICAgICAgICBjaGlsZEZvbGRlcnM6IFtdXG4gICAgICAgIC0gZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyXG4gICAgICAgICAgY2hpbGRyZW46XG4gICAgICAgICAgICAgIHJvb3RJdGVtOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjJcbiAgICAgICAgICAgICAgaXRlbXM6XG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UxLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMS5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UyLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMi5odG1sXG4gICAgICAgICAgICAgIGNoaWxkRm9sZGVyczogW11cbiAgICAgKlxuICAgICAqIFRoZSBvYmplY3RzIHVuZGVyIGBpdGVtc2AgYXJlIGFjdHVsbHkgdGhlIGZ1bGwgRG9jdW1lbnQgb2JqZWN0XG4gICAgICogZnJvbSB0aGUgY2FjaGUsIGJ1dCBmb3IgdGhlIGludGVyZXN0IG9mIGNvbXBhY3RuZXNzIG1vc3Qgb2ZcbiAgICAgKiB0aGUgZmllbGRzIGhhdmUgYmVlbiBkZWxldGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9yb290SXRlbSBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBjaGlsZEl0ZW1UcmVlKF9yb290SXRlbTogc3RyaW5nKSB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNoaWxkSXRlbVRyZWUgJHtfcm9vdEl0ZW19YCk7XG5cbiAgICAgICAgbGV0IHJvb3RJdGVtID0gYXdhaXQgdGhpcy5maW5kKFxuICAgICAgICAgICAgICAgIF9yb290SXRlbS5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfcm9vdEl0ZW0uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX3Jvb3RJdGVtKTtcbiAgICAgICAgaWYgKCFyb290SXRlbSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGBjaGlsZEl0ZW1UcmVlIG5vIHJvb3RJdGVtIGZvdW5kIGZvciBwYXRoICR7X3Jvb3RJdGVtfWApO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISh0eXBlb2Ygcm9vdEl0ZW0gPT09ICdvYmplY3QnKVxuICAgICAgICAgfHwgISgndnBhdGgnIGluIHJvb3RJdGVtKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybihgY2hpbGRJdGVtVHJlZSBmb3VuZCBpbnZhbGlkIG9iamVjdCBmb3IgJHtfcm9vdEl0ZW19IC0gJHt1dGlsLmluc3BlY3Qocm9vdEl0ZW0pfWApO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZShyb290SXRlbS52cGF0aCk7XG4gICAgICAgIC8vIFBpY2tzIHVwIGV2ZXJ5dGhpbmcgZnJvbSB0aGUgY3VycmVudCBsZXZlbC5cbiAgICAgICAgLy8gRGlmZmVycyBmcm9tIHNpYmxpbmdzIGJ5IGdldHRpbmcgZXZlcnl0aGluZy5cbiAgICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAgICAgZGlybmFtZTogeyBlcTogZGlybmFtZSB9LFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogdHJ1ZVxuICAgICAgICB9KSBhcyB1bmtub3duW10gYXMgYW55W107XG5cbiAgICAgICAgY29uc3QgY2hpbGRGb2xkZXJzID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKFxuICAgICAgICAgICAgYFNFTEVDVCBkaXN0aW5jdCBkaXJuYW1lIEZST00gRE9DVU1FTlRTXG4gICAgICAgICAgICBXSEVSRSBwYXJlbnREaXIgPSAnJHtkaXJuYW1lfSdgXG4gICAgICAgICkgYXMgdW5rbm93bltdIGFzIERvY3VtZW50W107XG5cbiAgICAgICAgY29uc3QgY2ZzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgY2Ygb2YgY2hpbGRGb2xkZXJzKSB7XG4gICAgICAgICAgICBjZnMucHVzaChhd2FpdCB0aGlzLmNoaWxkSXRlbVRyZWUoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKGNmLmRpcm5hbWUsICdpbmRleC5odG1sJylcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvb3RJdGVtLFxuICAgICAgICAgICAgZGlybmFtZSxcbiAgICAgICAgICAgIGl0ZW1zOiBpdGVtcyxcbiAgICAgICAgICAgIC8vIFVuY29tbWVudCB0aGlzIHRvIGdlbmVyYXRlIHNpbXBsaWZpZWQgb3V0cHV0XG4gICAgICAgICAgICAvLyBmb3IgZGVidWdnaW5nLlxuICAgICAgICAgICAgLy8gLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoXG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSksXG4gICAgICAgICAgICBjaGlsZEZvbGRlcnM6IGNmc1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgaW5kZXggZmlsZXMgKHJlbmRlcnMgdG8gaW5kZXguaHRtbClcbiAgICAgKiB3aXRoaW4gdGhlIG5hbWVkIHN1YnRyZWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm9vdFBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgaW5kZXhGaWxlcyhyb290UGF0aD86IHN0cmluZykge1xuICAgICAgICBsZXQgcm9vdFAgPSByb290UGF0aD8uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IHJvb3RQYXRoPy5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogcm9vdFBhdGg7XG5cbiAgICAgICAgLy8gT3B0aW9uYWxseSBhcHBlbmRhYmxlIHN1Yi1xdWVyeVxuICAgICAgICAvLyB0byBoYW5kbGUgd2hlbiByb290UGF0aCBpcyBzcGVjaWZpZWRcbiAgICAgICAgbGV0IHJvb3RRID0gKFxuICAgICAgICAgICAgICAgIHR5cGVvZiByb290UCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAmJiByb290UC5sZW5ndGggPj0gMVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgPyBgQU5EICggcmVuZGVyUGF0aCBMSUtFICcke3Jvb3RQfSUnIClgXG4gICAgICAgICAgICA6ICcnO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmRhby5zcWxkYi5hbGwoYFxuICAgICAgICBTRUxFQ1QgKlxuICAgICAgICBGUk9NIERPQ1VNRU5UU1xuICAgICAgICBXSEVSRVxuICAgICAgICAgICAgKCByZW5kZXJzVG9IVE1MID0gdHJ1ZSApXG4gICAgICAgIEFORCAoXG4gICAgICAgICAgICAoIHJlbmRlclBhdGggTElLRSAnJS9pbmRleC5odG1sJyApXG4gICAgICAgICBPUiAoIHJlbmRlclBhdGggPSAnaW5kZXguaHRtbCcgKVxuICAgICAgICApXG4gICAgICAgICR7cm9vdFF9XG4gICAgICAgIGApO1xuICAgICAgICBcblxuICAgICAgICAvLyBJdCdzIHByb3ZlZCBkaWZmaWN1bHQgdG8gZ2V0IHRoZSByZWdleHBcbiAgICAgICAgLy8gdG8gd29yayBpbiB0aGlzIG1vZGU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHJldHVybiBhd2FpdCB0aGlzLnNlYXJjaCh7XG4gICAgICAgIC8vICAgICByZW5kZXJzVG9IVE1MOiB0cnVlLFxuICAgICAgICAvLyAgICAgcmVuZGVycGF0aG1hdGNoOiAvXFwvaW5kZXguaHRtbCQvLFxuICAgICAgICAvLyAgICAgcm9vdFBhdGg6IHJvb3RQYXRoXG4gICAgICAgIC8vIH0pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBGb3IgZXZlcnkgZmlsZSBpbiB0aGUgZG9jdW1lbnRzIGNhY2hlLFxuICAgICAqIHNldCB0aGUgYWNjZXNzIGFuZCBtb2RpZmljYXRpb25zLlxuICAgICAqXG4gICAgICogPz8/Pz8gV2h5IHdvdWxkIHRoaXMgYmUgdXNlZnVsP1xuICAgICAqIEkgY2FuIHNlZSBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWRcbiAgICAgKiBmaWxlcyBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeS4gIEJ1dCB0aGlzIGlzXG4gICAgICogZm9yIHRoZSBmaWxlcyBpbiB0aGUgZG9jdW1lbnRzIGRpcmVjdG9yaWVzLiA/Pz8/XG4gICAgICovXG4gICAgYXN5bmMgc2V0VGltZXMoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLnNlbGVjdEVhY2goXG4gICAgICAgICAgICAoZXJyLCBtb2RlbCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc2V0dGVyID0gYXN5bmMgKGRhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gRGF0ZS5wYXJzZShkYXRlKTs7XG4gICAgICAgICAgICAgICAgICAgIGlmICghIGlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRwID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEZTLnV0aW1lc1N5bmMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwuZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRwXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobW9kZWwuaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiBtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldHRlcihtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG1vZGVsLmluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgbW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0dGVyKG1vZGVsLmluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge30gYXMgV2hlcmU8RG9jdW1lbnQ+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIGRvY3VtZW50cyB3aGljaCBoYXZlIHRhZ3MuXG4gICAgICogXG4gICAgICogVE9ETyAtIElzIHRoaXMgZnVuY3Rpb24gdXNlZCBhbnl3aGVyZT9cbiAgICAgKiAgIEl0IGlzIG5vdCByZWZlcmVuY2VkIGluIGFrYXNoYXJlbmRlciwgbm9yXG4gICAgICogICBpbiBhbnkgcGx1Z2luIHRoYXQgSSBjYW4gZmluZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIC8vIGFzeW5jIGRvY3VtZW50c1dpdGhUYWdzKCkge1xuICAgIC8vICAgICBjb25zdCBkb2NzID0gbmV3IEFycmF5PERvY3VtZW50PigpO1xuICAgIC8vICAgICBhd2FpdCB0aGlzLmRhby5zZWxlY3RFYWNoKFxuICAgIC8vICAgICAgICAgKGVyciwgZG9jKSA9PiB7XG4gICAgLy8gICAgICAgICAgICAgaWYgKGRvY1xuICAgIC8vICAgICAgICAgICAgICAmJiBkb2MuZG9jTWV0YWRhdGFcbiAgICAvLyAgICAgICAgICAgICAgJiYgZG9jLmRvY01ldGFkYXRhLnRhZ3NcbiAgICAvLyAgICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShcbiAgICAvLyAgICAgICAgICAgICAgICAgZG9jLmRvY01ldGFkYXRhLnRhZ3NcbiAgICAvLyAgICAgICAgICAgICAgKVxuICAgIC8vICAgICAgICAgICAgICAmJiBkb2MuZG9jTWV0YWRhdGEudGFncy5sZW5ndGggPj0gMVxuICAgIC8vICAgICAgICAgICAgICkge1xuICAgIC8vICAgICAgICAgICAgICAgICBkb2NzLnB1c2goZG9jKTtcbiAgICAvLyAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAge1xuICAgIC8vICAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHsgZXE6IHRydWUgfSxcbiAgICAvLyAgICAgICAgICAgICBpbmZvOiB7IGlzTm90TnVsbDogdHJ1ZSB9XG4gICAgLy8gICAgICAgICB9IGFzIFdoZXJlPERvY3VtZW50PlxuICAgIC8vICAgICApO1xuXG4gICAgLy8gICAgIC8vIGNvbnNvbGUubG9nKGRvY3MpO1xuICAgIC8vICAgICByZXR1cm4gZG9jcztcbiAgICAvLyB9XG5cbiAgICBhc3luYyBkb2N1bWVudHNXaXRoVGFnKHRhZ25tOiBzdHJpbmcgfCBzdHJpbmdbXSlcbiAgICAgICAgOiBQcm9taXNlPEFycmF5PHN0cmluZz4+XG4gICAge1xuICAgICAgICBsZXQgdGFnczogc3RyaW5nW107XG4gICAgICAgIGlmICh0eXBlb2YgdGFnbm0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0YWdzID0gWyB0YWdubSBdO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodGFnbm0pKSB7XG4gICAgICAgICAgICB0YWdzID0gdGFnbm07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50c1dpdGhUYWcgZ2l2ZW4gYmFkIHRhZ3MgYXJyYXkgJHt1dGlsLmluc3BlY3QodGFnbm0pfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29ycmVjdGx5IGhhbmRsZSB0YWcgc3RyaW5ncyB3aXRoXG4gICAgICAgIC8vIHZhcnlpbmcgcXVvdGVzLiAgQSBkb2N1bWVudCBtaWdodCBoYXZlIHRoZXNlIHRhZ3M6XG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgIHRhZ3M6XG4gICAgICAgIC8vICAgIC0gVGVhc2VyJ3NcbiAgICAgICAgLy8gICAgLSBUZWFzZXJzXG4gICAgICAgIC8vICAgIC0gU29tZXRoaW5nIFwicXVvdGVkXCJcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlc2UgU1FMIHF1ZXJpZXMgd29yazpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gc3FsaXRlPiBzZWxlY3QgKiBmcm9tIFRBR0dMVUUgd2hlcmUgdGFnTmFtZSBJTiAoICdTb21ldGhpbmcgXCJxdWl0ZWRcIicsIFwiVGVhc2VyJ3NcIiApO1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFRlYXNlcidzXG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8U29tZXRoaW5nIFwicXVpdGVkXCJcbiAgICAgICAgLy8gc3FsaXRlPiBzZWxlY3QgKiBmcm9tIFRBR0dMVUUgd2hlcmUgdGFnTmFtZSBJTiAoICdTb21ldGhpbmcgXCJxdWl0ZWRcIicsICdUZWFzZXInJ3MnICk7XG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8VGVhc2VyJ3NcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxTb21ldGhpbmcgXCJxdWl0ZWRcIlxuICAgICAgICAvL1xuICAgICAgICAvLyBCdXQsIHRoaXMgZG9lcyBub3Q6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgPSAnVGVhc2VyJ3MnO1xuICAgICAgICAvLyAnICAuLi4+IFxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgb3JpZ2luYWwgY29kZSBiZWhhdmlvciB3YXMgdGhpczpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwic1wiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW4gYXR0ZW1wdGVkIGZpeDpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyBcIlRlYXNlcidzXCIgXSAgKCAnVGVhc2VyXFwncycgKSBcbiAgICAgICAgLy8gZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEIEVycm9yOiBTUUxJVEVfRVJST1I6IG5lYXIgXCJzXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBBbm90aGVyIGF0dGVtcHRlZCBmaXg6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgXCJUZWFzZXInc1wiIF0gICggXCJUZWFzZXInJ3NcIiApIFxuICAgICAgICAvLyBbXVxuICAgICAgICAvLyBbXVxuICAgICAgICAvL1xuICAgICAgICAvLyBBbmQ6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzICdTb21ldGhpbmcgXCJxdW90ZWRcIidcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbICdTb21ldGhpbmcgXCJxdW90ZWRcIicgXSAgKCBcIlNvbWV0aGluZyBcInF1b3RlZFwiXCIgKSBcbiAgICAgICAgLy8gZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEIEVycm9yOiBTUUxJVEVfRVJST1I6IG5lYXIgXCJxdW90ZWRcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBjb2RlIGJlbG93IHByb2R1Y2VzOlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCIgJ1NvbWV0aGluZyBcInF1aXRlZFwiJ1xuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgXCJUZWFzZXInc1wiLCAnU29tZXRoaW5nIFwicXVpdGVkXCInIF0gICggJ1RlYXNlcicncycsJ1NvbWV0aGluZyBcInF1aXRlZFwiJyApIFxuICAgICAgICAvLyBbIHsgdnBhdGg6ICd0ZWFzZXItY29udGVudC5odG1sLm1kJyB9IF1cbiAgICAgICAgLy8gWyAndGVhc2VyLWNvbnRlbnQuaHRtbC5tZCcgXVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBkb2N1bWVudHNXaXRoVGFnICR7dXRpbC5pbnNwZWN0KHRhZ3MpfSAke3RhZ3N0cmluZ31gKTtcblxuICAgICAgICBjb25zdCB2cGF0aHMgPSBhd2FpdCB0Z2x1ZS5wYXRoc0ZvclRhZyh0YWdzKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHZwYXRocyk7XG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZwYXRocykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnRzV2l0aFRhZyBub24tQXJyYXkgcmVzdWx0ICR7dXRpbC5pbnNwZWN0KHZwYXRocyl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdnBhdGhzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhbiBhcnJheSBvZiB0YWdzIHVzZWQgYnkgYWxsIGRvY3VtZW50cy5cbiAgICAgKiBUaGlzIHVzZXMgdGhlIEpTT04gZXh0ZW5zaW9uIHRvIGV4dHJhY3RcbiAgICAgKiB0aGUgdGFncyBmcm9tIHRoZSBtZXRhZGF0YSBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyB0YWdzKCkge1xuICAgICAgICBjb25zdCB0YWdzID0gYXdhaXQgdGdsdWUudGFncygpO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgcmV0ID0gQXJyYXkuZnJvbSh0YWdzKTtcbiAgICAgICAgcmV0dXJuIHJldC5zb3J0KChhOiBzdHJpbmcsIGI6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdmFyIHRhZ0EgPSBhLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgdGFnQiA9IGIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmICh0YWdBIDwgdGFnQikgcmV0dXJuIC0xO1xuICAgICAgICAgICAgaWYgKHRhZ0EgPiB0YWdCKSByZXR1cm4gMTtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgZGF0YSBmb3IgYW4gaW50ZXJuYWwgbGlua1xuICAgICAqIHdpdGhpbiB0aGUgc2l0ZSBkb2N1bWVudHMuICBGb3JtaW5nIGFuXG4gICAgICogaW50ZXJuYWwgbGluayBpcyBhdCBhIG1pbmltdW0gdGhlIHJlbmRlcmVkXG4gICAgICogcGF0aCBmb3IgdGhlIGRvY3VtZW50IGFuZCBpdHMgdGl0bGUuXG4gICAgICogVGhlIHRlYXNlciwgaWYgYXZhaWxhYmxlLCBjYW4gYmUgdXNlZCBpblxuICAgICAqIGEgdG9vbHRpcC4gVGhlIHRodW1ibmFpbCBpcyBhbiBpbWFnZSB0aGF0XG4gICAgICogY291bGQgYmUgZGlzcGxheWVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGRvY0xpbmtEYXRhKHZwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcblxuICAgICAgICAvLyBUaGUgdnBhdGggcmVmZXJlbmNlXG4gICAgICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBwYXRoIGl0IHJlbmRlcnMgdG9cbiAgICAgICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGl0bGUgc3RyaW5nIGZyb20gdGhhdCBwYWdlXG4gICAgICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSB0ZWFzZXIgdGV4dCBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0ZWFzZXI/OiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBoZXJvIGltYWdlICh0aHVtYm5haWwpXG4gICAgICAgIHRodW1ibmFpbD86IHN0cmluZztcbiAgICB9PiB7XG4gICAgICAgIGNvbnN0IGRvY0luZm8gPSBhd2FpdCB0aGlzLmZpbmQodnBhdGgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBkb2NJbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICB0aXRsZTogZG9jSW5mby5tZXRhZGF0YS50aXRsZSxcbiAgICAgICAgICAgIHRlYXNlcjogZG9jSW5mby5tZXRhZGF0YS50ZWFzZXIsXG4gICAgICAgICAgICAvLyB0aHVtYm5haWxcbiAgICAgICAgfTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gZGVzY3JpcHRpdmUgc2VhcmNoIG9wZXJhdGlvbnMgdXNpbmcgZGlyZWN0IFNRTCBxdWVyaWVzXG4gICAgICogZm9yIGJldHRlciBwZXJmb3JtYW5jZSBhbmQgc2NhbGFiaWxpdHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBTZWFyY2ggb3B0aW9ucyBvYmplY3RcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlPEFycmF5PERvY3VtZW50Pj5cbiAgICAgKi9cbiAgICBhc3luYyBzZWFyY2gob3B0aW9ucyk6IFByb21pc2U8QXJyYXk8RG9jdW1lbnQ+PiB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBzcWwsIHBhcmFtcyB9ID0gdGhpcy5idWlsZFNlYXJjaFF1ZXJ5KG9wdGlvbnMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHNlYXJjaCAke3NxbH1gKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5hbGwoc3FsLCBwYXJhbXMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHJhdyBTUUwgcmVzdWx0cyB0byBEb2N1bWVudCBvYmplY3RzXG4gICAgICAgICAgICBjb25zdCBkb2N1bWVudHMgPSByZXN1bHRzLm1hcChyb3cgPT4gdGhpcy5jdnRSb3dUb09iaihyb3cpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gR2F0aGVyIGFkZGl0aW9uYWwgaW5mbyBkYXRhIGZvciBlYWNoIHJlc3VsdCBGSVJTVFxuICAgICAgICAgICAgLy8gVGhpcyBpcyBjcnVjaWFsIGJlY2F1c2UgZmlsdGVycyBhbmQgc29ydCBmdW5jdGlvbnMgbWF5IGRlcGVuZCBvbiB0aGlzIGRhdGFcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkb2N1bWVudHMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBcHBseSBwb3N0LVNRTCBmaWx0ZXJzIHRoYXQgY2FuJ3QgYmUgZG9uZSBpbiBTUUxcbiAgICAgICAgICAgIGxldCBmaWx0ZXJlZFJlc3VsdHMgPSBkb2N1bWVudHM7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEZpbHRlciBieSByZW5kZXJlcnMgKHJlcXVpcmVzIGNvbmZpZyBsb29rdXApXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJlcnMgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zLnJlbmRlcmVycykpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFJlc3VsdHMgPSBmaWx0ZXJlZFJlc3VsdHMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVuZGVyZXIgPSBmY2FjaGUuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoaXRlbS52cGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVuZGVyZXIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHIgb2Ygb3B0aW9ucy5yZW5kZXJlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gJ3N0cmluZycgJiYgciA9PT0gcmVuZGVyZXIubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHIgPT09ICdvYmplY3QnIHx8IHR5cGVvZiByID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignV0FSTklORzogTWF0Y2hpbmcgcmVuZGVyZXIgYnkgb2JqZWN0IGNsYXNzIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnLCByKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFwcGx5IGN1c3RvbSBmaWx0ZXIgZnVuY3Rpb25cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmZpbHRlcmZ1bmMpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFJlc3VsdHMgPSBmaWx0ZXJlZFJlc3VsdHMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5maWx0ZXJmdW5jKGZjYWNoZS5jb25maWcsIG9wdGlvbnMsIGl0ZW0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBcHBseSBjdXN0b20gc29ydCBmdW5jdGlvbiAoaWYgU1FMIHNvcnRpbmcgd2Fzbid0IHVzZWQpXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc29ydEZ1bmMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFJlc3VsdHMgPSBmaWx0ZXJlZFJlc3VsdHMuc29ydChvcHRpb25zLnNvcnRGdW5jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlcmVkUmVzdWx0cztcbiAgICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNGaWxlQ2FjaGUuc2VhcmNoIGVycm9yOiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQnVpbGQgU1FMIHF1ZXJ5IGFuZCBwYXJhbWV0ZXJzIGZvciBzZWFyY2ggb3B0aW9uc1xuICAgICAqL1xuICAgIHByaXZhdGUgYnVpbGRTZWFyY2hRdWVyeShvcHRpb25zKTogeyBzcWw6IHN0cmluZywgcGFyYW1zOiBhbnkgfSB7XG4gICAgICAgIGNvbnN0IHBhcmFtczogYW55ID0ge307XG4gICAgICAgIGNvbnN0IHdoZXJlQ2xhdXNlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3Qgam9pbnM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGxldCBwYXJhbUNvdW50ZXIgPSAwO1xuICAgICAgICBcbiAgICAgICAgLy8gSGVscGVyIHRvIGNyZWF0ZSB1bmlxdWUgcGFyYW1ldGVyIG5hbWVzXG4gICAgICAgIGNvbnN0IGFkZFBhcmFtID0gKHZhbHVlOiBhbnkpOiBzdHJpbmcgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyYW1OYW1lID0gYCRwYXJhbSR7KytwYXJhbUNvdW50ZXJ9YDtcbiAgICAgICAgICAgIHBhcmFtc1twYXJhbU5hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1OYW1lO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8gQmFzZSBxdWVyeVxuICAgICAgICBsZXQgc3FsID0gYFNFTEVDVCBESVNUSU5DVCBkLiogRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9IGRgO1xuICAgICAgICBcbiAgICAgICAgLy8gTUlNRSB0eXBlIGZpbHRlcmluZ1xuICAgICAgICBpZiAob3B0aW9ucy5taW1lKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubWltZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5taW1lID0gJHthZGRQYXJhbShvcHRpb25zLm1pbWUpfWApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMubWltZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGFjZWhvbGRlcnMgPSBvcHRpb25zLm1pbWUubWFwKG1pbWUgPT4gYWRkUGFyYW0obWltZSkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubWltZSBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBSZW5kZXJzIHRvIEhUTUwgZmlsdGVyaW5nXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJzVG9IVE1MID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnJlbmRlcnNUb0hUTUwgPSAke2FkZFBhcmFtKG9wdGlvbnMucmVuZGVyc1RvSFRNTCA/IDEgOiAwKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gUm9vdCBwYXRoIGZpbHRlcmluZ1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucm9vdFBhdGggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIExJS0UgJHthZGRQYXJhbShvcHRpb25zLnJvb3RQYXRoICsgJyUnKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gR2xvYiBwYXR0ZXJuIG1hdGNoaW5nXG4gICAgICAgIGlmIChvcHRpb25zLmdsb2IgJiYgdHlwZW9mIG9wdGlvbnMuZ2xvYiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnN0IGVzY2FwZWRHbG9iID0gb3B0aW9ucy5nbG9iLmluZGV4T2YoXCInXCIpID49IDAgXG4gICAgICAgICAgICAgICAgPyBvcHRpb25zLmdsb2IucmVwbGFjZUFsbChcIidcIiwgXCInJ1wiKSBcbiAgICAgICAgICAgICAgICA6IG9wdGlvbnMuZ2xvYjtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnZwYXRoIEdMT0IgJHthZGRQYXJhbShlc2NhcGVkR2xvYil9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFJlbmRlciBnbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMucmVuZGVyZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5yZW5kZXJnbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLnJlbmRlcmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMucmVuZGVyZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5yZW5kZXJnbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCBHTE9CICR7YWRkUGFyYW0oZXNjYXBlZEdsb2IpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBCbG9nIHRhZyBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5ibG9ndGFnID0gJHthZGRQYXJhbShvcHRpb25zLmJsb2d0YWcpfWApO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5ibG9ndGFncykpIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMuYmxvZ3RhZ3MubWFwKHRhZyA9PiBhZGRQYXJhbSh0YWcpKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQuYmxvZ3RhZyBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBibG9ndGFncyBhcnJheSAke3V0aWwuaW5zcGVjdChvcHRpb25zLmJsb2d0YWdzKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gVGFnIGZpbHRlcmluZyB1c2luZyBUQUdHTFVFIHRhYmxlXG4gICAgICAgIGlmIChvcHRpb25zLnRhZyAmJiB0eXBlb2Ygb3B0aW9ucy50YWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBqb2lucy5wdXNoKGBJTk5FUiBKT0lOIFRBR0dMVUUgdGcgT04gZC52cGF0aCA9IHRnLmRvY3ZwYXRoYCk7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgdGcudGFnTmFtZSA9ICR7YWRkUGFyYW0ob3B0aW9ucy50YWcpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBMYXlvdXQgZmlsdGVyaW5nXG4gICAgICAgIGlmIChvcHRpb25zLmxheW91dHMpIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMubGF5b3V0cykpIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5sYXlvdXRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5sYXlvdXQgPSAke2FkZFBhcmFtKG9wdGlvbnMubGF5b3V0c1swXSl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmxheW91dHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwbGFjZWhvbGRlcnMgPSBvcHRpb25zLmxheW91dHMubWFwKGxheW91dCA9PiBhZGRQYXJhbShsYXlvdXQpKS5qb2luKCcsICcpO1xuICAgICAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5sYXlvdXQgSU4gKCR7cGxhY2Vob2xkZXJzfSlgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5sYXlvdXRzKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gUGF0aCByZWdleCBtYXRjaGluZ1xuICAgICAgICBjb25zdCByZWdleENsYXVzZXM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5wYXRobWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucGF0aG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5wYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC52cGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gUmVuZGVyIHBhdGggcmVnZXggbWF0Y2hpbmdcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpfWApO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMucmVuZGVycGF0aG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucmVuZGVycGF0aG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleENsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0obWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHJlbmRlcnBhdGhtYXRjaCByZWdleHAgJHt1dGlsLmluc3BlY3QobWF0Y2gpfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgncmVuZGVycGF0aG1hdGNoJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHJlbmRlcnBhdGhtYXRjaCAke3V0aWwuaW5zcGVjdChvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChyZWdleENsYXVzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYCgke3JlZ2V4Q2xhdXNlcy5qb2luKCcgT1IgJyl9KWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgSk9JTnMgdG8gcXVlcnlcbiAgICAgICAgaWYgKGpvaW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNxbCArPSAnICcgKyBqb2lucy5qb2luKCcgJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBXSEVSRSBjbGF1c2VcbiAgICAgICAgaWYgKHdoZXJlQ2xhdXNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzcWwgKz0gJyBXSEVSRSAnICsgd2hlcmVDbGF1c2VzLmpvaW4oJyBBTkQgJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBPUkRFUiBCWSBjbGF1c2VcbiAgICAgICAgbGV0IG9yZGVyQnkgPSAnJztcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRCeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIEhhbmRsZSBzcGVjaWFsIGNhc2VzIHRoYXQgbmVlZCBKU09OIGV4dHJhY3Rpb24gb3IgY29tcGxleCBsb2dpY1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25EYXRlJyB8fCBvcHRpb25zLnNvcnRCeSA9PT0gJ3B1YmxpY2F0aW9uVGltZScpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgQ09BTEVTQ0UgdG8gaGFuZGxlIG51bGwgcHVibGljYXRpb24gZGF0ZXNcbiAgICAgICAgICAgICAgICBvcmRlckJ5ID0gYE9SREVSIEJZIENPQUxFU0NFKFxuICAgICAgICAgICAgICAgICAgICBqc29uX2V4dHJhY3QoZC5tZXRhZGF0YSwgJyQucHVibGljYXRpb25EYXRlJyksIFxuICAgICAgICAgICAgICAgICAgICBkLm10aW1lTXNcbiAgICAgICAgICAgICAgICApYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCBvdGhlciBmaWVsZHMsIHNvcnQgYnkgdGhlIGNvbHVtbiBkaXJlY3RseVxuICAgICAgICAgICAgICAgIC8vIFRoaXMgYWxsb3dzIHNvcnRpbmcgYnkgYW55IHZhbGlkIGNvbHVtbiBpbiB0aGUgRE9DVU1FTlRTIHRhYmxlXG4gICAgICAgICAgICAgICAgb3JkZXJCeSA9IGBPUkRFUiBCWSBkLiR7b3B0aW9ucy5zb3J0Qnl9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnJldmVyc2UgfHwgb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nKSB7XG4gICAgICAgICAgICAvLyBJZiByZXZlcnNlL3NvcnRCeURlc2NlbmRpbmcgaXMgc3BlY2lmaWVkIHdpdGhvdXQgc29ydEJ5LCBcbiAgICAgICAgICAgIC8vIHVzZSBhIGRlZmF1bHQgb3JkZXJpbmcgKGJ5IG1vZGlmaWNhdGlvbiB0aW1lKVxuICAgICAgICAgICAgb3JkZXJCeSA9ICdPUkRFUiBCWSBkLm10aW1lTXMnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBIYW5kbGUgc29ydCBkaXJlY3Rpb25cbiAgICAgICAgaWYgKG9yZGVyQnkpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNvcnRCeURlc2NlbmRpbmcgfHwgb3B0aW9ucy5yZXZlcnNlKSB7XG4gICAgICAgICAgICAgICAgb3JkZXJCeSArPSAnIERFU0MnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcmRlckJ5ICs9ICcgQVNDJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNxbCArPSAnICcgKyBvcmRlckJ5O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgTElNSVQgYW5kIE9GRlNFVFxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubGltaXQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBzcWwgKz0gYCBMSU1JVCAke2FkZFBhcmFtKG9wdGlvbnMubGltaXQpfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHNxbCArPSBgIE9GRlNFVCAke2FkZFBhcmFtKG9wdGlvbnMub2Zmc2V0KX1gO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBzcWwsIHBhcmFtcyB9O1xuICAgIH1cblxuICAgIC8vIFNraXAgdGFncyBmb3Igbm93LiAgU2hvdWxkIGJlIGVhc3kuXG5cbiAgICAvLyBGb3IgdGFncyBzdXBwb3J0LCB0aGlzIGNhbiBiZSB1c2VmdWxcbiAgICAvLyAgLS0gaHR0cHM6Ly9hbnRvbnoub3JnL2pzb24tdmlydHVhbC1jb2x1bW5zL1xuICAgIC8vIEl0IHNob3dzIGhvdyB0byBkbyBnZW5lcmF0ZWQgY29sdW1uc1xuICAgIC8vIGZyb20gZmllbGRzIGluIEpTT05cblxuICAgIC8vIEJ1dCwgaG93IHRvIGRvIGdlbmVyYXRlZCBjb2x1bW5zXG4gICAgLy8gdXNpbmcgU1FMSVRFM09STT9cblxuICAgIC8vIGh0dHBzOi8vYW50b256Lm9yZy9zcWxlYW4tcmVnZXhwLyAtLSBSZWdFeHBcbiAgICAvLyBleHRlbnNpb24gZm9yIFNRTElURTNcblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hc2cwMTcvc3FsaXRlLXJlZ2V4IGluY2x1ZGVzXG4gICAgLy8gYSBub2RlLmpzIHBhY2thZ2VcbiAgICAvLyBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9zcWxpdGUtcmVnZXhcbn1cblxuZXhwb3J0IHZhciBhc3NldHNDYWNoZTogQXNzZXRzRmlsZUNhY2hlPCBBc3NldCwgdHlwZW9mIGFzc2V0c0RBTz47XG5leHBvcnQgdmFyIHBhcnRpYWxzQ2FjaGU6IFRlbXBsYXRlc0ZpbGVDYWNoZTxQYXJ0aWFsLCB0eXBlb2YgcGFydGlhbHNEQU8+O1xuZXhwb3J0IHZhciBsYXlvdXRzQ2FjaGU6IFRlbXBsYXRlc0ZpbGVDYWNoZTxMYXlvdXQsIHR5cGVvZiBsYXlvdXRzREFPPjtcbmV4cG9ydCB2YXIgZG9jdW1lbnRzQ2FjaGU6IERvY3VtZW50c0ZpbGVDYWNoZTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvblxuKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICBhc3NldHNDYWNoZSA9IG5ldyBBc3NldHNGaWxlQ2FjaGU8QXNzZXQsIFRhc3NldHNEQU8+KFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdhc3NldHMnLFxuICAgICAgICBjb25maWcuYXNzZXREaXJzLFxuICAgICAgICBhc3NldHNEQU9cbiAgICApO1xuICAgIGF3YWl0IGFzc2V0c0NhY2hlLnNldHVwKCk7XG5cbiAgICBhc3NldHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChhcmdzKX1gKVxuICAgIH0pO1xuXG4gICAgcGFydGlhbHNDYWNoZSA9IG5ldyBUZW1wbGF0ZXNGaWxlQ2FjaGU8XG4gICAgICAgICAgICBQYXJ0aWFsLCBUcGFydGlhbHNEQU9cbiAgICA+KFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdwYXJ0aWFscycsXG4gICAgICAgIGNvbmZpZy5wYXJ0aWFsc0RpcnMsXG4gICAgICAgIHBhcnRpYWxzREFPLFxuICAgICAgICBcInBhcnRpYWxcIlxuICAgICk7XG4gICAgYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgcGFydGlhbHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsc0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICBsYXlvdXRzQ2FjaGUgPSBuZXcgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgICAgICAgICAgTGF5b3V0LCBUbGF5b3V0c0RBT1xuICAgID4oXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2xheW91dHMnLFxuICAgICAgICBjb25maWcubGF5b3V0RGlycyxcbiAgICAgICAgbGF5b3V0c0RBTyxcbiAgICAgICAgXCJsYXlvdXRcIlxuICAgICk7XG4gICAgYXdhaXQgbGF5b3V0c0NhY2hlLnNldHVwKCk7XG5cbiAgICBsYXlvdXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgRG9jdW1lbnRzRmlsZUNhY2hlICdkb2N1bWVudHMnICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5kb2N1bWVudERpcnMpfWApO1xuXG4gICAgZG9jdW1lbnRzQ2FjaGUgPSBuZXcgRG9jdW1lbnRzRmlsZUNhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdkb2N1bWVudHMnLFxuICAgICAgICBjb25maWcuZG9jdW1lbnREaXJzXG4gICAgKTtcbiAgICBhd2FpdCBkb2N1bWVudHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgZG9jdW1lbnRzQ2FjaGUub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChlcnIpfWApO1xuICAgIH0pO1xuXG4gICAgYXdhaXQgY29uZmlnLmhvb2tQbHVnaW5DYWNoZVNldHVwKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZUZpbGVDYWNoZXMoKSB7XG4gICAgaWYgKGRvY3VtZW50c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGRvY3VtZW50c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoYXNzZXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgYXNzZXRzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgYXNzZXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChsYXlvdXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgbGF5b3V0c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGxheW91dHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHBhcnRpYWxzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgcGFydGlhbHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBwYXJ0aWFsc0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbn1cbiJdfQ==