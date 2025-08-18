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
        name: 'dirname', dbtype: 'TEXT'
    }),
    index('asset_dirname'),
    __metadata("design:type", String)
], Asset.prototype, "dirname", void 0);
__decorate([
    field({
        name: 'rendersToHTML', dbtype: 'INTEGER'
    }),
    index('assets_rendersToHTML'),
    __metadata("design:type", Boolean)
], Asset.prototype, "rendersToHTML", void 0);
__decorate([
    field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    }),
    index('asset_mtimeMs'),
    __metadata("design:type", String)
], Asset.prototype, "mtimeMs", void 0);
__decorate([
    field({
        name: 'docMetadata', dbtype: 'TEXT',
        isJson: true
    }),
    index('asset_docMetadata'),
    __metadata("design:type", Object)
], Asset.prototype, "docMetadata", void 0);
__decorate([
    field({
        name: 'metadata', dbtype: 'TEXT',
        isJson: true
    }),
    index('asset_metadata'),
    __metadata("design:type", Object)
], Asset.prototype, "metadata", void 0);
__decorate([
    field({
        name: 'info', dbtype: 'TEXT',
        isJson: true
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
await assetsDAO.createIndex('assets_rendersToHTML');
await assetsDAO.createIndex('asset_dirname');
await assetsDAO.createIndex('asset_mtimeMs');
await assetsDAO.createIndex('asset_docMetadata');
await assetsDAO.createIndex('asset_metadata');
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
        name: 'dirname', dbtype: 'TEXT'
    }),
    index('partial_dirname'),
    __metadata("design:type", String)
], Partial.prototype, "dirname", void 0);
__decorate([
    field({
        name: 'rendersToHTML', dbtype: 'INTEGER'
    }),
    index('partial_rendersToHTML'),
    __metadata("design:type", Boolean)
], Partial.prototype, "rendersToHTML", void 0);
__decorate([
    field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    }),
    index('partial_mtimeMs'),
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
        name: 'docContent', dbtype: 'TEXT'
    }),
    __metadata("design:type", Object)
], Partial.prototype, "docContent", void 0);
__decorate([
    field({
        name: 'docBody', dbtype: 'TEXT'
    }),
    __metadata("design:type", Object)
], Partial.prototype, "docBody", void 0);
__decorate([
    field({
        name: 'metadata', dbtype: 'TEXT',
        isJson: true
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
await partialsDAO.createIndex('partial_dirname');
await partialsDAO.createIndex('partial_rendersToHTML');
await partialsDAO.createIndex('partial_mtimeMs');
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
        name: 'dirname', dbtype: 'TEXT'
    }),
    index('layout_dirname'),
    __metadata("design:type", String)
], Layout.prototype, "dirname", void 0);
__decorate([
    field({
        name: 'rendersToHTML', dbtype: 'INTEGER'
    }),
    index('layout_rendersToHTML'),
    __metadata("design:type", Boolean)
], Layout.prototype, "rendersToHTML", void 0);
__decorate([
    field({
        name: 'mtimeMs',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    }),
    index('layout_mtimeMs'),
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
        name: 'docContent', dbtype: 'TEXT'
    }),
    __metadata("design:type", Object)
], Layout.prototype, "docContent", void 0);
__decorate([
    field({
        name: 'docBody', dbtype: 'TEXT'
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
await layoutsDAO.createIndex('layout_rendersToHTML');
await layoutsDAO.createIndex('layout_dirname');
await layoutsDAO.createIndex('layout_mtimeMs');
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
    index('docs_mtimeMs'),
    __metadata("design:type", String)
], Document.prototype, "mtimeMs", void 0);
__decorate([
    field({
        name: 'baseMetadata', dbtype: 'TEXT',
        isJson: true
    }),
    __metadata("design:type", Object)
], Document.prototype, "baseMetadata", void 0);
__decorate([
    field({
        name: 'docMetadata', dbtype: 'TEXT',
        isJson: true
    }),
    __metadata("design:type", Object)
], Document.prototype, "docMetadata", void 0);
__decorate([
    field({
        name: 'docContent', dbtype: 'TEXT'
    }),
    __metadata("design:type", String)
], Document.prototype, "docContent", void 0);
__decorate([
    field({
        name: 'docBody', dbtype: 'TEXT'
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
    index('docs_tags'),
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
        name: 'blogtag', dbtype: 'TEXT'
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
await documentsDAO.createIndex('docs_mtimeMs');
await documentsDAO.createIndex('docs_tags');
await documentsDAO.createIndex('docs_layout');
await documentsDAO.createIndex('docs_blogtag');
await documentsDAO.sqldb.run(`
    CREATE INDEX IF NOT EXISTS 
    idx_docs_metadata_json ON 
    DOCUMENTS(json_extract(metadata, '$.publicationDate'));
`);
await documentsDAO.sqldb.run(`
    CREATE INDEX IF NOT EXISTS 
    idx_docs_render_path_pattern ON DOCUMENTS(renderPath);
`);
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
            return { vpath: item.vpath, mounted: item.mounted };
        });
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
        // for (const item of mapped) {
        //     this.gatherInfoData(item);
        // }
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
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            dirname: path.dirname(info.renderPath),
            rendersToHTML: false,
            mtimeMs: new Date(info.statsMtime).toISOString(),
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
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            dirname: path.dirname(info.renderPath),
            rendersToHTML: false,
            mtimeMs: new Date(info.statsMtime).toISOString(),
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
        const results = await this.dao.sqldb.all((typeof rootP === 'string') ?
            `
            SELECT
                vpath, mime, mounted, mountPoint,
                pathInMounted, mtimeMs,
                info, fspath, renderPath
            FROM ${this.dao.table.quotedName}
            WHERE
            renderPath LIKE $rootP
            ORDER BY mtimeMs ASC
        `
            : `
            SELECT
                vpath, mime, mounted, mountPoint,
                pathInMounted, mtimeMs,
                info, fspath, renderPath
            FROM ${this.dao.table.quotedName}
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
        return result2;
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
        // if (typeof obj.docMetadata !== 'undefined'
        //  && obj.docMetadata !== null
        // ) {
        //     if (typeof obj.docMetadata !== 'string') {
        //         throw new Error(`TemplatesFileCache.cvtRowToObj must have a docMetadata, got ${util.inspect(obj)}`);
        //     } else {
        //         ret.docMetadata = obj.docMetadata;
        //     }
        // }
        if (typeof obj.docContent !== 'undefined'
            && obj.docContent !== null) {
            if (obj.docContent === null) {
                ret.docContent = undefined;
            }
            else if (typeof obj.docContent !== 'string') {
                throw new Error(`TemplatesFileCache.cvtRowToObj must have a docContent, got ${util.inspect(obj)}`);
            }
            else {
                ret.docContent = obj.docContent;
            }
        }
        if (typeof obj.docBody !== 'undefined'
            && obj.docBody !== null) {
            if (obj.docBody === null) {
                ret.docBody = undefined;
            }
            else if (typeof obj.docBody !== 'string') {
                throw new Error(`TemplatesFileCache.cvtRowToObj must have a docBody, got ${util.inspect(obj)}`);
            }
            else {
                ret.docBody = obj.docBody;
            }
        }
        // if (typeof obj.metadata !== 'undefined'
        //  && obj.metadata !== null
        // ) {
        //     if (typeof obj.metadata !== 'string') {
        //         throw new Error(`TemplatesFileCache.cvtRowToObj must have a metadata, got ${util.inspect(obj)}`);
        //     } else {
        //         ret.metadata = obj.metadata;
        //     }
        // }
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
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            dirname: path.dirname(info.renderPath),
            rendersToHTML: info.rendersToHTML,
            mtimeMs: new Date(info.statsMtime).toISOString(),
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
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            dirname: path.dirname(info.renderPath),
            rendersToHTML: info.rendersToHTML,
            mtimeMs: new Date(info.statsMtime).toISOString(),
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
        // if (typeof obj.docMetadata !== 'undefined'
        //  && obj.docMetadata !== null
        // ) {
        //     if (typeof obj.docMetadata !== 'string') {
        //         throw new Error(`DocumentsFileCache.cvtRowToObj must have a docMetadata, got ${util.inspect(obj)}`);
        //     } else {
        //         ret.docMetadata = obj.docMetadata;
        //     }
        // }
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
        if (typeof obj.blogtag !== 'undefined'
            && obj.blogtag !== null) {
            if (typeof obj.blogtag !== 'string') {
                throw new Error(`DocumentsFileCache.cvtRowToObj must have a blogtag, got ${util.inspect(obj)}`);
            }
            else {
                ret.blogtag = obj.blogtag;
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
            info.rendersToHTML =
                micromatch.isMatch(info.renderPath, '**/*.html')
                    || micromatch.isMatch(info.renderPath, '*.html')
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
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            rendersToHTML: typeof info.rendersToHTML === 'undefined'
                ? false
                : info.rendersToHTML,
            dirname: path.dirname(info.renderPath),
            parentDir: info.parentDir,
            mtimeMs: new Date(info.statsMtime).toISOString(),
            baseMetadata: info.baseMetadata,
            docMetadata: info.docMetadata,
            docContent: info.docContent,
            docBody: info.docBody,
            metadata: info.metadata,
            tags: Array.isArray(info.metadata?.tags)
                ? info.metadata.tags
                : [],
            layout: info.metadata?.layout,
            blogtag: info.blogtag,
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
            fspath: path.join(info.mounted, info.pathInMounted),
            renderPath: info.renderPath,
            rendersToHTML: typeof info.rendersToHTML === 'undefined'
                ? false
                : info.rendersToHTML,
            dirname: path.dirname(info.renderPath),
            parentDir: info.parentDir,
            mtimeMs: new Date(info.statsMtime).toISOString(),
            baseMetadata: info.baseMetadata,
            docMetadata: info.docMetadata,
            docContent: info.docContent,
            docBody: info.docBody,
            metadata: info.metadata,
            tags: Array.isArray(info.metadata?.tags)
                ? info.metadata.tags
                : [],
            layout: info.metadata?.layout,
            blogtag: info.blogtag,
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
        const ignored = siblings.filter(item => {
            return !this.ignoreFile(item);
        });
        const mapped = ignored.map(item => {
            return this.cvtRowToObj(item);
        });
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
        const found = await this.dao.sqldb.all(`
            SELECT *
            FROM ${this.dao.table.quotedName}
            WHERE 
            vpath = $vpath OR renderPath = $vpath
        `, {
            $vpath: vpath
        });
        if (Array.isArray(found)) {
            // const docInfo = await this.find(vpath);
            return {
                vpath,
                renderPath: found[0].renderPath,
                title: found[0].metadata.title,
                teaser: found[0].metadata.teaser,
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
        try {
            const { sql, params } = this.buildSearchQuery(options);
            // console.log(`search ${sql}`);
            const results = await this.dao.sqldb.all(sql, params);
            // Convert raw SQL results to Document objects
            const documents = results.map(row => this.cvtRowToObj(row));
            // Gather additional info data for each result FIRST
            // This is crucial because filters and sort functions may depend on this data
            // for (const item of documents) {
            //     this.gatherInfoData(item);
            // }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1jYWNoZS1zcWxpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvZmlsZS1jYWNoZS1zcWxpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxFQUFFLFdBQVcsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUM3RSxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRzdCLE9BQU8sRUFBRSxNQUFNLElBQUksQ0FBQztBQUNwQixPQUFPLFlBQVksTUFBTSxRQUFRLENBQUM7QUFDbEMsT0FBTyxVQUFVLE1BQU0sWUFBWSxDQUFDO0FBRXBDLE9BQU8sRUFDSCxLQUFLLEVBR0wsRUFBRSxFQUNGLEtBQUssRUFDTCxLQUFLLEVBR0wsTUFBTSxFQUNOLE9BQU8sRUFHVixNQUFNLFlBQVksQ0FBQztBQUVwQixPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRWxDLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUV6RCwwQkFBMEI7QUFNbkIsSUFBTSxLQUFLLEdBQVgsTUFBTSxLQUFLO0NBbUZqQixDQUFBO0FBNUVHO0lBSkMsRUFBRSxDQUFDO1FBQ0EsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTTtLQUNoQyxDQUFDO0lBQ0QsS0FBSyxDQUFDLGFBQWEsQ0FBQzs7b0NBQ1A7QUFLZDtJQUhDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU07S0FDL0IsQ0FBQzs7bUNBQ1c7QUFNYjtJQUpDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU07S0FDbEMsQ0FB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QUFFLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDL0IsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ3hDLENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLGVBQWU7SUFDakMsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUNqQixNQUFNLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM3QixjQUFjLEdBQUcsU0FBUyxDQUFDO0lBQy9CLENBQUM7SUFDRCxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2QsTUFBTSxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsV0FBVyxHQUFHLFNBQVMsQ0FBQztJQUM1QixDQUFDO0lBQ0QsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUNmLE1BQU0sWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzNCLFlBQVksR0FBRyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUNELElBQUksYUFBYSxFQUFFLENBQUM7UUFDaEIsTUFBTSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDNUIsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUM5QixDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBEaXJzV2F0Y2hlciwgZGlyVG9XYXRjaCwgVlBhdGhEYXRhIH0gZnJvbSAnQGFrYXNoYWNtcy9zdGFja2VkLWRpcnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgdXJsICBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gJ2ZzJztcbmltcG9ydCBGUyBmcm9tICdmcyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcblxuaW1wb3J0IHtcbiAgICBmaWVsZCxcbiAgICBGaWVsZE9wdHMsXG4gICAgZmssXG4gICAgaWQsXG4gICAgaW5kZXgsXG4gICAgdGFibGUsXG4gICAgVGFibGVPcHRzLFxuICAgIFNxbERhdGFiYXNlLFxuICAgIHNjaGVtYSxcbiAgICBCYXNlREFPLFxuICAgIEZpbHRlcixcbiAgICBXaGVyZVxufSBmcm9tICdzcWxpdGUzb3JtJztcblxuaW1wb3J0IHsgc3FkYiB9IGZyb20gJy4uL3NxZGIuanMnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgZGlyVG9Nb3VudCB9IGZyb20gJy4uL2luZGV4LmpzJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5pbXBvcnQgeyBUYWdHbHVlLCBUYWdEZXNjcmlwdGlvbnMgfSBmcm9tICcuL3RhZy1nbHVlLmpzJztcblxuLy8vLy8vLy8vLy8vLyBBc3NldHMgdGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnQVNTRVRTJyxcbiAgICB3aXRob3V0Um93SWQ6IHRydWUsXG59IGFzIFRhYmxlT3B0cylcbmV4cG9ydCBjbGFzcyBBc3NldCB7XG5cbiAgICAvLyBQcmltYXJ5IGtleVxuICAgIEBpZCh7XG4gICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X3ZwYXRoJylcbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21pbWUnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgbWltZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF9tb3VudGVkJylcbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X21vdW50UG9pbnQnKVxuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfcGF0aEluTW91bnRlZCcpXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X2ZzcGF0aCcpXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X3JlbmRlclBhdGgnKVxuICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkaXJuYW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfZGlybmFtZScpXG4gICAgZGlybmFtZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlcnNUb0hUTUwnLCBkYnR5cGU6ICdJTlRFR0VSJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldHNfcmVuZGVyc1RvSFRNTCcpXG4gICAgcmVuZGVyc1RvSFRNTDogYm9vbGVhbjtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtdGltZU1zJyxcbiAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X210aW1lTXMnKVxuICAgIG10aW1lTXM6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLFxuICAgICAgICBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfZG9jTWV0YWRhdGEnKVxuICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJyxcbiAgICAgICAgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X21ldGFkYXRhJylcbiAgICBtZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJyxcbiAgICAgICAgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvOiBhbnk7XG5cbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0FTU0VUUycpO1xudHlwZSBUYXNzZXRzREFPID0gQmFzZURBTzxBc3NldD47XG5leHBvcnQgY29uc3QgYXNzZXRzREFPOiBUYXNzZXRzREFPXG4gICAgPSBuZXcgQmFzZURBTzxBc3NldD4oQXNzZXQsIHNxZGIpO1xuXG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X3ZwYXRoJyk7XG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X21vdW50ZWQnKTtcbmF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfbW91bnRQb2ludCcpO1xuYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9wYXRoSW5Nb3VudGVkJyk7XG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X2ZzcGF0aCcpO1xuYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9yZW5kZXJQYXRoJyk7XG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0c19yZW5kZXJzVG9IVE1MJyk7XG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X2Rpcm5hbWUnKTtcbmF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfbXRpbWVNcycpO1xuYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9kb2NNZXRhZGF0YScpO1xuYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9tZXRhZGF0YScpO1xuXG4vLy8vLy8vLy8vLy8gUGFydGlhbHMgVGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnUEFSVElBTFMnLFxuICAgIHdpdGhvdXRSb3dJZDogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgUGFydGlhbCB7XG5cbiAgICAvLyBQcmltYXJ5IGtleVxuICAgIEBpZCh7XG4gICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfdnBhdGgnKVxuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBtaW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfbW91bnRlZCcpXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50UG9pbnQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX21vdW50UG9pbnQnKVxuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9wYXRoSW5Nb3VudGVkJylcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9mc3BhdGgnKVxuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlclBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX3JlbmRlclBhdGgnKVxuICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkaXJuYW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9kaXJuYW1lJylcbiAgICBkaXJuYW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyc1RvSFRNTCcsIGRidHlwZTogJ0lOVEVHRVInXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfcmVuZGVyc1RvSFRNTCcpXG4gICAgcmVuZGVyc1RvSFRNTDogYm9vbGVhbjtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtdGltZU1zJyxcbiAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfbXRpbWVNcycpXG4gICAgbXRpbWVNczogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY01ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jTWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NDb250ZW50JywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIGRvY0NvbnRlbnQ6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NCb2R5JywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIGRvY0JvZHk6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLFxuICAgICAgICBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIG1ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnaW5mbycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGluZm86IGFueTtcbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ1BBUlRJQUxTJyk7XG50eXBlIFRwYXJ0aWFsc0RBTyA9IEJhc2VEQU88UGFydGlhbD47XG5leHBvcnQgY29uc3QgcGFydGlhbHNEQU9cbiAgICA9IG5ldyBCYXNlREFPPFBhcnRpYWw+KFBhcnRpYWwsIHNxZGIpO1xuXG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF92cGF0aCcpO1xuYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfbW91bnRlZCcpO1xuYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfbW91bnRQb2ludCcpO1xuYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfcGF0aEluTW91bnRlZCcpO1xuYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfZnNwYXRoJyk7XG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9yZW5kZXJQYXRoJyk7XG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9kaXJuYW1lJyk7XG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9yZW5kZXJzVG9IVE1MJyk7XG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9tdGltZU1zJyk7XG5cbi8vLy8vLy8vLy8vLy8vLy8vIExheW91dHMgVGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnTEFZT1VUUycsXG4gICAgd2l0aG91dFJvd0lkOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBMYXlvdXQge1xuXG4gICAgLy8gUHJpbWFyeSBrZXlcbiAgICBAaWQoe1xuICAgICAgICBuYW1lOiAndnBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfdnBhdGgnKVxuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBtaW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9tb3VudGVkJylcbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9tb3VudFBvaW50JylcbiAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9wYXRoSW5Nb3VudGVkJylcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnbGF5b3V0X2ZzcGF0aCcpXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9yZW5kZXJQYXRoJylcbiAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZGlybmFtZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9kaXJuYW1lJylcbiAgICBkaXJuYW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyc1RvSFRNTCcsIGRidHlwZTogJ0lOVEVHRVInXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9yZW5kZXJzVG9IVE1MJylcbiAgICByZW5kZXJzVG9IVE1MOiBib29sZWFuO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbiAgICB9KVxuICAgIEBpbmRleCgnbGF5b3V0X210aW1lTXMnKVxuICAgIG10aW1lTXM6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQ29udGVudCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBkb2NDb250ZW50OiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQm9keScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBkb2NCb2R5OiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBtZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvOiBhbnk7XG5cbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0xBWU9VVFMnKTtcbnR5cGUgVGxheW91dHNEQU8gPSBCYXNlREFPPExheW91dD47XG5leHBvcnQgY29uc3QgbGF5b3V0c0RBT1xuICAgID0gbmV3IEJhc2VEQU88TGF5b3V0PihMYXlvdXQsIHNxZGIpO1xuXG5hd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfdnBhdGgnKTtcbmF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9tb3VudGVkJyk7XG5hd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfbW91bnRQb2ludCcpO1xuYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X3BhdGhJbk1vdW50ZWQnKTtcbmF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9mc3BhdGgnKTtcbmF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9yZW5kZXJQYXRoJyk7XG5hd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfcmVuZGVyc1RvSFRNTCcpO1xuYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X2Rpcm5hbWUnKTtcbmF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9tdGltZU1zJyk7XG5cbi8vLy8vLy8vLy8vLy8vLyBEb2N1bWVudHMgVGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnRE9DVU1FTlRTJyxcbiAgICB3aXRob3V0Um93SWQ6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIERvY3VtZW50IHtcblxuICAgIC8vIFByaW1hcnkga2V5XG4gICAgQGlkKHtcbiAgICAgICAgbmFtZTogJ3ZwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc192cGF0aCcpXG4gICAgdnBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtaW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIG1pbWU6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19tb3VudGVkJylcbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfbW91bnRQb2ludCcpXG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3BhdGhJbk1vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX3BhdGhJbk1vdW50ZWQnKVxuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdmc3BhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX2ZzcGF0aCcpXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfcmVuZGVyUGF0aCcpXG4gICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlcnNUb0hUTUwnLCBkYnR5cGU6ICdJTlRFR0VSJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX3JlbmRlcnNUb0hUTUwnKVxuICAgIHJlbmRlcnNUb0hUTUw6IGJvb2xlYW47XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZGlybmFtZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfZGlybmFtZScpXG4gICAgZGlybmFtZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3BhcmVudERpcicsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfcGFyZW50RGlyJylcbiAgICBwYXJlbnREaXI6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtdGltZU1zJyxcbiAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfbXRpbWVNcycpXG4gICAgbXRpbWVNczogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2Jhc2VNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLFxuICAgICAgICBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGJhc2VNZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY01ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsXG4gICAgICAgIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jTWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NDb250ZW50JywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIGRvY0NvbnRlbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NCb2R5JywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIGRvY0JvZHk6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIG1ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAndGFncycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc190YWdzJylcbiAgICB0YWdzOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbGF5b3V0JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogZmFsc2VcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19sYXlvdXQnKVxuICAgIGxheW91dDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2Jsb2d0YWcnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX2Jsb2d0YWcnKVxuICAgIGJsb2d0YWc6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdpbmZvJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgaW5mbzogYW55O1xuXG59XG5cbmF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdET0NVTUVOVFMnKTtcbnR5cGUgVGRvY3VtZW50c3NEQU8gPSBCYXNlREFPPERvY3VtZW50PjtcbmV4cG9ydCBjb25zdCBkb2N1bWVudHNEQU9cbiAgICA9IG5ldyBCYXNlREFPPERvY3VtZW50PihEb2N1bWVudCwgc3FkYik7XG5cbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc192cGF0aCcpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX21vdW50ZWQnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19tb3VudFBvaW50Jyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfcGF0aEluTW91bnRlZCcpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX2ZzcGF0aCcpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3JlbmRlclBhdGgnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19yZW5kZXJzVG9IVE1MJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfZGlybmFtZScpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3BhcmVudERpcicpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX210aW1lTXMnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc190YWdzJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfbGF5b3V0Jyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfYmxvZ3RhZycpO1xuXG5hd2FpdCBkb2N1bWVudHNEQU8uc3FsZGIucnVuKGBcbiAgICBDUkVBVEUgSU5ERVggSUYgTk9UIEVYSVNUUyBcbiAgICBpZHhfZG9jc19tZXRhZGF0YV9qc29uIE9OIFxuICAgIERPQ1VNRU5UUyhqc29uX2V4dHJhY3QobWV0YWRhdGEsICckLnB1YmxpY2F0aW9uRGF0ZScpKTtcbmApO1xuYXdhaXQgZG9jdW1lbnRzREFPLnNxbGRiLnJ1bihgXG4gICAgQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFMgXG4gICAgaWR4X2RvY3NfcmVuZGVyX3BhdGhfcGF0dGVybiBPTiBET0NVTUVOVFMocmVuZGVyUGF0aCk7XG5gKTtcblxuY29uc3QgdGdsdWUgPSBuZXcgVGFnR2x1ZSgpO1xudGdsdWUuaW5pdChzcWRiLl9kYik7XG5cbmNvbnN0IHRkZXNjID0gbmV3IFRhZ0Rlc2NyaXB0aW9ucygpO1xudGRlc2MuaW5pdChzcWRiLl9kYik7XG5cbi8vIENvbnZlcnQgQWthc2hhQ01TIG1vdW50IHBvaW50cyBpbnRvIHRoZSBtb3VudHBvaW50XG4vLyB1c2VkIGJ5IERpcnNXYXRjaGVyXG5jb25zdCByZW1hcGRpcnMgPSAoZGlyejogZGlyVG9Nb3VudFtdKTogZGlyVG9XYXRjaFtdID0+IHtcbiAgICByZXR1cm4gZGlyei5tYXAoZGlyID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2RvY3VtZW50IGRpciAnLCBkaXIpO1xuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6ICcvJyxcbiAgICAgICAgICAgICAgICBiYXNlTWV0YWRhdGE6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFkaXIuZGVzdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVtYXBkaXJzIGludmFsaWQgbW91bnQgc3BlY2lmaWNhdGlvbiAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIuc3JjLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5kZXN0LFxuICAgICAgICAgICAgICAgIGJhc2VNZXRhZGF0YTogZGlyLmJhc2VNZXRhZGF0YSxcbiAgICAgICAgICAgICAgICBpZ25vcmU6IGRpci5pZ25vcmVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogVHlwZSBmb3IgcmV0dXJuIGZyb20gcGF0aHMgbWV0aG9kLiAgVGhlIGZpZWxkcyBoZXJlXG4gKiBhcmUgd2hhdHMgaW4gdGhlIEFzc2V0L0xheW91dC9QYXJ0aWFsIGNsYXNzZXMgYWJvdmVcbiAqIHBsdXMgYSBjb3VwbGUgZmllbGRzIHRoYXQgb2xkZXIgY29kZSBleHBlY3RlZFxuICogZnJvbSB0aGUgcGF0aHMgbWV0aG9kLlxuICovXG5leHBvcnQgdHlwZSBQYXRoc1JldHVyblR5cGUgPSB7XG4gICAgdnBhdGg6IHN0cmluZyxcbiAgICBtaW1lOiBzdHJpbmcsXG4gICAgbW91bnRlZDogc3RyaW5nLFxuICAgIG1vdW50UG9pbnQ6IHN0cmluZyxcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmcsXG4gICAgbXRpbWVNczogc3RyaW5nLFxuICAgIGluZm86IGFueSxcbiAgICAvLyBUaGVzZSB3aWxsIGJlIGNvbXB1dGVkIGluIEJhc2VGaWxlQ2FjaGVcbiAgICAvLyBUaGV5IHdlcmUgcmV0dXJuZWQgaW4gcHJldmlvdXMgdmVyc2lvbnMuXG4gICAgZnNwYXRoOiBzdHJpbmcsXG4gICAgcmVuZGVyUGF0aDogc3RyaW5nXG59O1xuXG5leHBvcnQgY2xhc3MgQmFzZUZpbGVDYWNoZTxcbiAgICAgICAgVCBleHRlbmRzIEFzc2V0IHwgTGF5b3V0IHwgUGFydGlhbCB8IERvY3VtZW50LFxuICAgICAgICBUZGFvIGV4dGVuZHMgQmFzZURBTzxUPlxuPiBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cbiAgICAjY29uZmlnPzogQ29uZmlndXJhdGlvbjtcbiAgICAjbmFtZT86IHN0cmluZztcbiAgICAjZGlycz86IGRpclRvTW91bnRbXTtcbiAgICAjaXNfcmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAjY2FjaGVfY29udGVudDogYm9vbGVhbjtcbiAgICAjbWFwX3JlbmRlcnBhdGg6IGJvb2xlYW47XG4gICAgI2RhbzogVGRhbzsgLy8gQmFzZURBTzxUPjtcblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAgICAgKiBAcGFyYW0gZGlycyBhcnJheSBvZiBkaXJlY3RvcmllcyBhbmQgbW91bnQgcG9pbnRzIHRvIHdhdGNoXG4gICAgICogQHBhcmFtIG5hbWUgc3RyaW5nIGdpdmluZyB0aGUgbmFtZSBmb3IgdGhpcyB3YXRjaGVyIG5hbWVcbiAgICAgKiBAcGFyYW0gZGFvIFRoZSBTUUxJVEUzT1JNIERBTyBpbnN0YW5jZSB0byB1c2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRpcnM6IGRpclRvTW91bnRbXSxcbiAgICAgICAgZGFvOiBUZGFvIC8vIEJhc2VEQU88VD5cbiAgICApIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEJhc2VGaWxlQ2FjaGUgJHtuYW1lfSBjb25zdHJ1Y3RvciBkaXJzPSR7dXRpbC5pbnNwZWN0KGRpcnMpfWApO1xuICAgICAgICB0aGlzLiNjb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuI25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLiNkaXJzID0gZGlycztcbiAgICAgICAgdGhpcy4jaXNfcmVhZHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jY2FjaGVfY29udGVudCA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNtYXBfcmVuZGVycGF0aCA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNkYW8gPSBkYW87XG4gICAgfVxuXG4gICAgZ2V0IGNvbmZpZygpICAgICB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICBnZXQgbmFtZSgpICAgICAgIHsgcmV0dXJuIHRoaXMuI25hbWU7IH1cbiAgICBnZXQgZGlycygpICAgICAgIHsgcmV0dXJuIHRoaXMuI2RpcnM7IH1cbiAgICBzZXQgY2FjaGVDb250ZW50KGRvaXQpIHsgdGhpcy4jY2FjaGVfY29udGVudCA9IGRvaXQ7IH1cbiAgICBnZXQgZ2FjaGVDb250ZW50KCkgeyByZXR1cm4gdGhpcy4jY2FjaGVfY29udGVudDsgfVxuICAgIHNldCBtYXBSZW5kZXJQYXRoKGRvaXQpIHsgdGhpcy4jbWFwX3JlbmRlcnBhdGggPSBkb2l0OyB9XG4gICAgZ2V0IG1hcFJlbmRlclBhdGgoKSB7IHJldHVybiB0aGlzLiNtYXBfcmVuZGVycGF0aDsgfVxuICAgIGdldCBkYW8oKTogVGRhbyB7IHJldHVybiB0aGlzLiNkYW87IH1cblxuICAgIC8vIFNLSVA6IGdldER5bmFtaWNWaWV3XG5cblxuICAgICN3YXRjaGVyOiBEaXJzV2F0Y2hlcjtcbiAgICAjcXVldWU7XG5cbiAgICBhc3luYyBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuI3F1ZXVlKSB7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZS5raWxsQW5kRHJhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLiN3YXRjaGVyKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0xPU0lORyAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuI3dhdGNoZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2NoYW5nZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2FkZGVkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCd1bmxpbmtlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVhZHknKTtcblxuICAgICAgICBhd2FpdCBzcWRiLmNsb3NlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHVwIHJlY2VpdmluZyBldmVudHMgZnJvbSBEaXJzV2F0Y2hlciwgYW5kIGRpc3BhdGNoaW5nIHRvXG4gICAgICogdGhlIGhhbmRsZXIgbWV0aG9kcy5cbiAgICAgKi9cbiAgICBhc3luYyBzZXR1cCgpIHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBpZiAodGhpcy4jd2F0Y2hlcikge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy4jd2F0Y2hlci5jbG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jcXVldWUgPSBmYXN0cS5wcm9taXNlKGFzeW5jIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmNvZGUgPT09ICdjaGFuZ2VkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGFuZ2UgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVDaGFuZ2VkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnY2hhbmdlJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAnYWRkZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGFkZCAke2V2ZW50Lm5hbWV9ICR7ZXZlbnQuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZUFkZGVkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnYWRkJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAndW5saW5rZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHVubGluayAke2V2ZW50Lm5hbWV9ICR7ZXZlbnQuaW5mby52cGF0aH1gLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZVVubGlua2VkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgndW5saW5rJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZUVycm9yKGV2ZW50Lm5hbWUpICovXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdyZWFkeScpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlUmVhZHkoZXZlbnQubmFtZSk7XG4gICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ3JlYWR5JywgZXZlbnQubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwKTtcblxuICAgICAgICB0aGlzLiN3YXRjaGVyID0gbmV3IERpcnNXYXRjaGVyKHRoaXMubmFtZSk7XG5cbiAgICAgICAgdGhpcy4jd2F0Y2hlci5vbignY2hhbmdlJywgYXN5bmMgKG5hbWU6IHN0cmluZywgaW5mbzogVlBhdGhEYXRhKSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtuYW1lfSBjaGFuZ2VkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBQVVNIICR7bmFtZX0gY2hhbmdlZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ2NoYW5nZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAnY2hhbmdlJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgY2hhbmdlICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdhZGQnLCBhc3luYyAobmFtZTogc3RyaW5nLCBpbmZvOiBWUGF0aERhdGEpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gYWRkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFBVU0ggJHtuYW1lfSBhZGQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICdhZGRlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICdhZGQnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCBhZGQgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ3VubGluaycsIGFzeW5jIChuYW1lOiBzdHJpbmcsIGluZm86IFZQYXRoRGF0YSkgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHVubGluayAke25hbWV9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAndW5saW5rZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAndW5saW5rJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIHVubGluayAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigncmVhZHknLCBhc3luYyAobmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtuYW1lfSByZWFkeWApO1xuICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgY29kZTogJ3JlYWR5JyxcbiAgICAgICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gcmVtYXBkaXJzKHRoaXMuZGlycyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZXR1cCAke3RoaXMuI25hbWV9IHdhdGNoICR7dXRpbC5pbnNwZWN0KHRoaXMuI2RpcnMpfSA9PT4gJHt1dGlsLmluc3BlY3QobWFwcGVkKX1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy4jd2F0Y2hlci53YXRjaChtYXBwZWQpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBEQU8gJHt0aGlzLmRhby50YWJsZS5uYW1lfSAke3V0aWwuaW5zcGVjdCh0aGlzLmRhby50YWJsZS5maWVsZHMpfWApO1xuXG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbzogVCkge1xuICAgICAgICAvLyBQbGFjZWhvbGRlciB3aGljaCBzb21lIHN1YmNsYXNzZXNcbiAgICAgICAgLy8gYXJlIGV4cGVjdGVkIHRvIG92ZXJyaWRlXG5cbiAgICAgICAgaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoob2JqOiBhbnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgYmUgb3ZlcnJpZGRlbmApO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjdnRSb3dUb09iakJBU0Uob2JqOiBhbnksIGRlc3Q6IGFueSk6IHZvaWQge1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IHJlY2VpdmUgYW4gb2JqZWN0LCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai52cGF0aCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLnZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgdnBhdGgsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0LnZwYXRoID0gb2JqLnZwYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLm1pbWUgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmoubWltZSAhPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLm1pbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBtaW1lLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5taW1lID0gb2JqLm1pbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoubW91bnRlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLm1vdW50ZWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBtb3VudGVkLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5tb3VudGVkID0gb2JqLm1vdW50ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoubW91bnRQb2ludCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLm1vdW50UG9pbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBtb3VudFBvaW50LCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5tb3VudFBvaW50ID0gb2JqLm1vdW50UG9pbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoucGF0aEluTW91bnRlZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLnBhdGhJbk1vdW50ZWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBwYXRoSW5Nb3VudGVkLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5wYXRoSW5Nb3VudGVkID0gb2JqLnBhdGhJbk1vdW50ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouZnNwYXRoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouZnNwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgZnNwYXRoLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdC5mc3BhdGggPSBvYmouZnNwYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLnJlbmRlclBhdGggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5yZW5kZXJQYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgcmVuZGVyUGF0aCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QucmVuZGVyUGF0aCA9IG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmRpcm5hbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5kaXJuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgZGlybmFtZSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QuZGlybmFtZSA9IG9iai5kaXJuYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLnJlbmRlcnNUb0hUTUwgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICB8fCBvYmoucmVuZGVyc1RvSFRNTCA9PT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLnJlbmRlcnNUb0hUTUwgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai5yZW5kZXJzVG9IVE1MID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIChvYmoucmVuZGVyUGF0aC5tYXRjaCgvLipcXC5odG1sJC8pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhgJHtvYmoucmVuZGVyUGF0aH0gPT09IDAgPT09IEZBTFNFYCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgZGVzdC5yZW5kZXJzVG9IVE1MID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvYmoucmVuZGVyc1RvSFRNTCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiAob2JqLnJlbmRlclBhdGgubWF0Y2goLy4qXFwuaHRtbCQvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYCR7b2JqLnJlbmRlclBhdGh9ID09PSAxID09PSBUUlVFYCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgZGVzdC5yZW5kZXJzVG9IVE1MID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIHJlbmRlcnNUb0hUTUwgaW5jb3JyZWN0IHZhbHVlLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9iai5yZW5kZXJzVG9IVE1MID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVzdC5yZW5kZXJzVG9IVE1MID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgSU5URUdFUiByZW5kZXJzVG9IVE1MLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gaWYgKG9iai5yZW5kZXJQYXRoLm1hdGNoKC8uKlxcLmh0bWwkLykpIHtcbiAgICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhgJHtvYmoucmVuZGVyUGF0aH0gZGVmYXVsdCB0byBGQUxTRWApO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgZGVzdC5yZW5kZXJzVG9IVE1MID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgKG9iai5yZW5kZXJQYXRoLm1hdGNoKC8uKlxcLmh0bWwkLykpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGAke29iai5yZW5kZXJQYXRofSAke29iai5yZW5kZXJzVG9IVE1MfSAke2Rlc3QucmVuZGVyc1RvSFRNTH1gKTtcbiAgICAgICAgLy8gfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5tdGltZU1zICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoubXRpbWVNcyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhc2VGaWxlQ2FjaGUuY3Z0Um93VG9PYmpCQVNFIG11c3QgaGF2ZSBhIG10aW1lTXMsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0Lm10aW1lTXMgPSBvYmoubXRpbWVNcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5kb2NNZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChvYmouZG9jTWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZXN0LmRvY01ldGFkYXRhID0ge307XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmouZG9jTWV0YWRhdGEgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBCYXNlRmlsZUNhY2hlLmN2dFJvd1RvT2JqQkFTRSBtdXN0IGhhdmUgYSBkb2NNZXRhZGF0YSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QuZG9jTWV0YWRhdGEgPSBKU09OLnBhcnNlKG9iai5kb2NNZXRhZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXN0LmRvY01ldGFkYXRhID0ge307XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmoubWV0YWRhdGEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAob2JqLm1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVzdC5tZXRhZGF0YSA9IHt9O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLm1ldGFkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgbWV0YWRhdGEsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0Lm1ldGFkYXRhID0gSlNPTi5wYXJzZShvYmoubWV0YWRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVzdC5tZXRhZGF0YSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmluZm8gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAob2JqLmluZm8gPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZXN0LmluZm8gPSB7fTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9iai5pbmZvICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQmFzZUZpbGVDYWNoZS5jdnRSb3dUb09iakJBU0UgbXVzdCBoYXZlIGEgaW5mbywgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3QuaW5mbyA9IEpTT04ucGFyc2Uob2JqLmluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVzdC5pbmZvID0ge307XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYW4gaW5mbyBvYmplY3QgYmFzZWQgb24gdnBhdGggYW5kIG1vdW50ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHBhcmFtIG1vdW50ZWQgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIGZpbmRQYXRoTW91bnRlZCh2cGF0aDogc3RyaW5nLCBtb3VudGVkOiBzdHJpbmcpIHtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGZvdW5kID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgICAgIFNFTEVDVCB2cGF0aCwgbW91bnRlZFxuICAgICAgICAgICAgRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9XG4gICAgICAgICAgICBXSEVSRSBcbiAgICAgICAgICAgIHZwYXRoID0gJHZwYXRoIEFORCBtb3VudGVkID0gJG1vdW50ZWRcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJHZwYXRoOiB2cGF0aCxcbiAgICAgICAgICAgICRtb3VudGVkOiBtb3VudGVkXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBtYXBwZWQgPSA8YW55W10+Zm91bmQubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHsgdnBhdGg6IGl0ZW0udnBhdGgsIG1vdW50ZWQ6IGl0ZW0ubW91bnRlZCB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWFwcGVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYW4gaW5mbyBvYmplY3QgYnkgdGhlIHZwYXRoLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBmaW5kQnlQYXRoKHZwYXRoOiBzdHJpbmcpIHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZEJ5UGF0aCAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9ICR7dnBhdGh9YCk7XG5cbiAgICAgICAgY29uc3QgZm91bmQgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5hbGwoYFxuICAgICAgICAgICAgU0VMRUNUICpcbiAgICAgICAgICAgIEZST00gJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfVxuICAgICAgICAgICAgV0hFUkUgXG4gICAgICAgICAgICB2cGF0aCA9ICR2cGF0aCBPUiByZW5kZXJQYXRoID0gJHZwYXRoXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICR2cGF0aDogdnBhdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gPGFueVtdPmZvdW5kLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN2dFJvd1RvT2JqKGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gZm9yIChjb25zdCBpdGVtIG9mIG1hcHBlZCkge1xuICAgICAgICAvLyAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpdGVtKTtcbiAgICAgICAgLy8gfVxuICAgICAgICByZXR1cm4gbWFwcGVkO1xuICAgIH1cblxuICAgIGFzeW5jIGhhbmRsZUNoYW5nZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZUNoYW5nZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09PT09PR0EhISEgUmVjZWl2ZWQgYSBmaWxlIHRoYXQgc2hvdWxkIGJlIGluZ29yZWQgYCwgaW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVDaGFuZ2VkIGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhhbmRsZUNoYW5nZWQgJHtpbmZvLnZwYXRofSAke2luZm8ubWV0YWRhdGEgJiYgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPyBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA6ICc/Pz8nfWApO1xuXG4gICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5maW5kUGF0aE1vdW50ZWQoaW5mby52cGF0aCwgaW5mby5tb3VudGVkKTtcblxuICAgICAgICAvLyBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAvLyAgICAgdnBhdGg6IHsgZXE6IGluZm8udnBhdGggfSxcbiAgICAgICAgLy8gICAgIG1vdW50ZWQ6IHsgZXE6IGluZm8ubW91bnRlZCB9XG4gICAgICAgIC8vIH0gYXMgRmlsdGVyPFQ+KTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhQXJyYXkuaXNBcnJheShyZXN1bHQpXG4gICAgICAgICB8fCByZXN1bHQubGVuZ3RoIDw9IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBJdCB3YXNuJ3QgZm91bmQgaW4gdGhlIGRhdGFiYXNlLiAgSGVuY2VcbiAgICAgICAgICAgIC8vIHdlIHNob3VsZCBhZGQgaXQuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVBZGRlZChuYW1lLCBpbmZvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlRG9jSW5EQihpbmZvKTtcbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVDaGFuZ2VkKG5hbWUsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm8pIHtcbiAgICAgICAgYXdhaXQgdGhpcy4jZGFvLnVwZGF0ZSh7XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogZmFsc2UsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIC8vIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfSBhcyBUKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXZSByZWNlaXZlIHRoaXM6XG4gICAgICpcbiAgICAgKiB7XG4gICAgICogICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICogICAgdnBhdGg6IHZwYXRoLFxuICAgICAqICAgIG1pbWU6IG1pbWUuZ2V0VHlwZShmc3BhdGgpLFxuICAgICAqICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAqICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAqICAgIHBhdGhJbk1vdW50ZWQ6IGNvbXB1dGVkIHJlbGF0aXZlIHBhdGhcbiAgICAgKiAgICBzdGFjazogWyBhcnJheSBvZiB0aGVzZSBpbnN0YW5jZXMgXVxuICAgICAqIH1cbiAgICAgKlxuICAgICAqIE5lZWQgdG8gYWRkOlxuICAgICAqICAgIHJlbmRlclBhdGhcbiAgICAgKiAgICBBbmQgZm9yIEhUTUwgcmVuZGVyIGZpbGVzLCBhZGQgdGhlIGJhc2VNZXRhZGF0YSBhbmQgZG9jTWV0YWRhdGFcbiAgICAgKlxuICAgICAqIFNob3VsZCByZW1vdmUgdGhlIHN0YWNrLCBzaW5jZSBpdCdzIGxpa2VseSBub3QgdXNlZnVsIHRvIHVzLlxuICAgICAqL1xuXG4gICAgYXN5bmMgaGFuZGxlQWRkZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyAgY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVBZGRlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgT09PT09PT09HQSEhISBSZWNlaXZlZCBhIGZpbGUgdGhhdCBzaG91bGQgYmUgaW5nb3JlZCBgLCBpbmZvKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZUFkZGVkIGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGluZm8pO1xuICAgICAgICBpbmZvLnN0YWNrID0gdW5kZWZpbmVkO1xuICAgICAgICBhd2FpdCB0aGlzLmluc2VydERvY1RvREIoaW5mbyk7XG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmhvb2tGaWxlQWRkZWQobmFtZSwgaW5mbyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbykge1xuICAgICAgICBhd2FpdCB0aGlzLiNkYW8uaW5zZXJ0KHtcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBmYWxzZSxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgLy8gZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgLy8gZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICB9IGFzIFQpO1xuICAgIH1cblxuICAgIGFzeW5jIGhhbmRsZVVubGlua2VkKG5hbWUsIGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVVbmxpbmtlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZVVubGlua2VkIGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZVVubGlua2VkKG5hbWUsIGluZm8pO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuI2Rhby5zcWxkYi5ydW4oYFxuICAgICAgICAgICAgREVMRVRFIEZST00gJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfVxuICAgICAgICAgICAgV0hFUkVcbiAgICAgICAgICAgIHZwYXRoID0gJHZwYXRoIEFORCBtb3VudGVkID0gJG1vdW50ZWRcbiAgICAgICAgYCwge1xuICAgICAgICAgICAgJHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgJG1vdW50ZWQ6IGluZm8ubW91bnRlZFxuICAgICAgICB9KTtcbiAgICAgICAgLy8gYXdhaXQgdGhpcy4jZGFvLmRlbGV0ZUFsbCh7XG4gICAgICAgIC8vICAgICB2cGF0aDogeyBlcTogaW5mby52cGF0aCB9LFxuICAgICAgICAvLyAgICAgbW91bnRlZDogeyBlcTogaW5mby5tb3VudGVkIH1cbiAgICAgICAgLy8gfSBhcyBXaGVyZTxUPik7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFuZGxlUmVhZHkobmFtZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZVJlYWR5YCk7XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlUmVhZHkgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdCgncmVhZHknLCBuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBkaXJlY3RvcnkgbW91bnQgY29ycmVzcG9uZGluZyB0byB0aGUgZmlsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgZmlsZURpck1vdW50KGluZm8pIHtcbiAgICAgICAgY29uc3QgbWFwcGVkID0gcmVtYXBkaXJzKHRoaXMuZGlycyk7XG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIG1hcHBlZCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRpck1vdW50IGZvciAke2luZm8udnBhdGh9IC0tICR7dXRpbC5pbnNwZWN0KGluZm8pfSA9PT0gJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgICAgIGlmIChpbmZvLm1vdW50UG9pbnQgPT09IGRpci5tb3VudFBvaW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNob3VsZCB0aGlzIGZpbGUgYmUgaWdub3JlZCwgYmFzZWQgb24gdGhlIGBpZ25vcmVgIGZpZWxkXG4gICAgICogaW4gdGhlIG1hdGNoaW5nIGBkaXJgIG1vdW50IGVudHJ5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBpbmZvXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBpZ25vcmVGaWxlKGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICBjb25zdCBkaXJNb3VudCA9IHRoaXMuZmlsZURpck1vdW50KGluZm8pO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSAke2luZm8udnBhdGh9IGRpck1vdW50ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgbGV0IGlnbm9yZSA9IGZhbHNlO1xuICAgICAgICBpZiAoZGlyTW91bnQpIHtcblxuICAgICAgICAgICAgbGV0IGlnbm9yZXM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRpck1vdW50Lmlnbm9yZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gWyBkaXJNb3VudC5pZ25vcmUgXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkaXJNb3VudC5pZ25vcmUpKSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IGRpck1vdW50Lmlnbm9yZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBpIG9mIGlnbm9yZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAobWljcm9tYXRjaC5pc01hdGNoKGluZm8udnBhdGgsIGkpKSBpZ25vcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkaXJNb3VudC5pZ25vcmUgJHtmc3BhdGh9ICR7aX0gPT4gJHtpZ25vcmV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiAoaWdub3JlKSBjb25zb2xlLmxvZyhgTVVTVCBpZ25vcmUgRmlsZSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSBmb3IgJHtpbmZvLnZwYXRofSA9PT4gJHtpZ25vcmV9YCk7XG4gICAgICAgICAgICByZXR1cm4gaWdub3JlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gbm8gbW91bnQ/ICB0aGF0IG1lYW5zIHNvbWV0aGluZyBzdHJhbmdlXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBObyBkaXJNb3VudCBmb3VuZCBmb3IgJHtpbmZvLnZwYXRofSAvICR7aW5mby5kaXJNb3VudGVkT259YCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFsbG93IGEgY2FsbGVyIHRvIHdhaXQgdW50aWwgdGhlIDxlbT5yZWFkeTwvZW0+IGV2ZW50IGhhc1xuICAgICAqIGJlZW4gc2VudCBmcm9tIHRoZSBEaXJzV2F0Y2hlciBpbnN0YW5jZS4gIFRoaXMgZXZlbnQgbWVhbnMgdGhlXG4gICAgICogaW5pdGlhbCBpbmRleGluZyBoYXMgaGFwcGVuZWQuXG4gICAgICovXG4gICAgYXN5bmMgaXNSZWFkeSgpIHtcbiAgICAgICAgLy8gSWYgdGhlcmUncyBubyBkaXJlY3RvcmllcywgdGhlcmUgd29uJ3QgYmUgYW55IGZpbGVzIFxuICAgICAgICAvLyB0byBsb2FkLCBhbmQgbm8gbmVlZCB0byB3YWl0XG4gICAgICAgIHdoaWxlICh0aGlzLiNkaXJzLmxlbmd0aCA+IDAgJiYgIXRoaXMuI2lzX3JlYWR5KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGRvZXMgYSAxMDBtcyBwYXVzZVxuICAgICAgICAgICAgLy8gVGhhdCBsZXRzIHVzIGNoZWNrIGlzX3JlYWR5IGV2ZXJ5IDEwMG1zXG4gICAgICAgICAgICAvLyBhdCB2ZXJ5IGxpdHRsZSBjb3N0XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgIWlzUmVhZHkgJHt0aGlzLm5hbWV9ICR7dGhpc1tfc3ltYl9kaXJzXS5sZW5ndGh9ICR7dGhpc1tfc3ltYl9pc19yZWFkeV19YCk7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHNpbXBsZSBpbmZvcm1hdGlvbiBhYm91dCBlYWNoXG4gICAgICogcGF0aCBpbiB0aGUgY29sbGVjdGlvbi4gIFRoZSByZXR1cm5cbiAgICAgKiB0eXBlIGlzIGFuIGFycmF5IG9mIFBhdGhzUmV0dXJuVHlwZS5cbiAgICAgKiBcbiAgICAgKiBJIGZvdW5kIHR3byB1c2VzIGZvciB0aGlzIGZ1bmN0aW9uLlxuICAgICAqIEluIGNvcHlBc3NldHMsIHRoZSB2cGF0aCBhbmQgb3RoZXJcbiAgICAgKiBzaW1wbGUgZGF0YSBpcyB1c2VkIGZvciBjb3B5aW5nIGl0ZW1zXG4gICAgICogdG8gdGhlIG91dHB1dCBkaXJlY3RvcnkuXG4gICAgICogSW4gcmVuZGVyLnRzLCB0aGUgc2ltcGxlIGZpZWxkcyBhcmVcbiAgICAgKiB1c2VkIHRvIHRoZW4gY2FsbCBmaW5kIHRvIHJldHJpZXZlXG4gICAgICogdGhlIGZ1bGwgaW5mb3JtYXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm9vdFBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcGF0aHMocm9vdFBhdGg/OiBzdHJpbmcpXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxQYXRoc1JldHVyblR5cGU+PlxuICAgIHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuXG4gICAgICAgIGxldCByb290UCA9IHJvb3RQYXRoPy5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgID8gcm9vdFBhdGg/LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgOiByb290UGF0aDtcblxuICAgICAgICAvLyBUaGlzIGlzIGNvcGllZCBmcm9tIHRoZSBvbGRlciB2ZXJzaW9uXG4gICAgICAgIC8vIChMb2tpSlMgdmVyc2lvbikgb2YgdGhpcyBmdW5jdGlvbi4gIEl0XG4gICAgICAgIC8vIHNlZW1zIG1lYW50IHRvIGVsaW1pbmF0ZSBkdXBsaWNhdGVzLlxuICAgICAgICBjb25zdCB2cGF0aHNTZWVuID0gbmV3IFNldCgpO1xuXG4gICAgICAgIC8vIFNlbGVjdCB0aGUgZmllbGRzIGluIFBhdGhzUmV0dXJuVHlwZVxuICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKFxuICAgICAgICAodHlwZW9mIHJvb3RQID09PSAnc3RyaW5nJykgP1xuICAgICAgICBgXG4gICAgICAgICAgICBTRUxFQ1RcbiAgICAgICAgICAgICAgICB2cGF0aCwgbWltZSwgbW91bnRlZCwgbW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkLCBtdGltZU1zLFxuICAgICAgICAgICAgICAgIGluZm8sIGZzcGF0aCwgcmVuZGVyUGF0aFxuICAgICAgICAgICAgRlJPTSAke3RoaXMuZGFvLnRhYmxlLnF1b3RlZE5hbWV9XG4gICAgICAgICAgICBXSEVSRVxuICAgICAgICAgICAgcmVuZGVyUGF0aCBMSUtFICRyb290UFxuICAgICAgICAgICAgT1JERVIgQlkgbXRpbWVNcyBBU0NcbiAgICAgICAgYFxuICAgICAgICA6IGBcbiAgICAgICAgICAgIFNFTEVDVFxuICAgICAgICAgICAgICAgIHZwYXRoLCBtaW1lLCBtb3VudGVkLCBtb3VudFBvaW50LFxuICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQsIG10aW1lTXMsXG4gICAgICAgICAgICAgICAgaW5mbywgZnNwYXRoLCByZW5kZXJQYXRoXG4gICAgICAgICAgICBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgICAgIE9SREVSIEJZIG10aW1lTXMgQVNDXG4gICAgICAgIGAsXG4gICAgICAgICh0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnKVxuICAgICAgICA/IHsgJHJvb3RQOiBgJHtyb290UH0lYCB9XG4gICAgICAgIDoge30pXG5cbiAgICAgICAgLy8gY29uc3Qgc2VsZWN0b3IgPSB7XG4gICAgICAgIC8vICAgICBvcmRlcjogeyBtdGltZU1zOiB0cnVlIH1cbiAgICAgICAgLy8gfSBhcyBhbnk7XG4gICAgICAgIC8vIGlmICh0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnXG4gICAgICAgIC8vICYmIHJvb3RQLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgIC8vICAgICBzZWxlY3Rvci5yZW5kZXJQYXRoID0ge1xuICAgICAgICAvLyAgICAgICAgIGlzTGlrZTogYCR7cm9vdFB9JWBcbiAgICAgICAgLy8gICAgICAgICAvLyBzcWw6IGAgcmVuZGVyUGF0aCByZWdleHAgJ14ke3Jvb3RQfScgYFxuICAgICAgICAvLyAgICAgfTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyAvLyBjb25zb2xlLmxvZyhgcGF0aHMgJHt1dGlsLmluc3BlY3Qoc2VsZWN0b3IpfWApO1xuICAgICAgICAvLyBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoc2VsZWN0b3IpO1xuICAgICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0cy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGF0aHMgP2lnbm9yZT8gJHtpdGVtLnZwYXRofWApO1xuICAgICAgICAgICAgaWYgKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZwYXRoc1NlZW4uaGFzKChpdGVtIGFzIEFzc2V0KS52cGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZwYXRoc1NlZW4uYWRkKChpdGVtIGFzIEFzc2V0KS52cGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQyO1xuXG4gICAgICAgIC8vIFRoaXMgc3RhZ2UgY29udmVydHMgdGhlIGl0ZW1zIFxuICAgICAgICAvLyByZWNlaXZlZCBieSB0aGlzIGZ1bmN0aW9uIGludG9cbiAgICAgICAgLy8gd2hhdCBpcyByZXF1aXJlZCBmcm9tXG4gICAgICAgIC8vIHRoZSBwYXRocyBtZXRob2QuXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdDRcbiAgICAgICAgLy8gICAgICAgICA9IG5ldyBBcnJheTxQYXRoc1JldHVyblR5cGU+KCk7XG4gICAgICAgIC8vIGZvciAoY29uc3QgaXRlbSBvZiByZXN1bHQzKSB7XG4gICAgICAgIC8vICAgICByZXN1bHQ0LnB1c2goPFBhdGhzUmV0dXJuVHlwZT57XG4gICAgICAgIC8vICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgIC8vICAgICAgICAgbWltZTogaXRlbS5taW1lLFxuICAgICAgICAvLyAgICAgICAgIG1vdW50ZWQ6IGl0ZW0ubW91bnRlZCxcbiAgICAgICAgLy8gICAgICAgICBtb3VudFBvaW50OiBpdGVtLm1vdW50UG9pbnQsXG4gICAgICAgIC8vICAgICAgICAgcGF0aEluTW91bnRlZDogaXRlbS5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAvLyAgICAgICAgIG10aW1lTXM6IGl0ZW0ubXRpbWVNcyxcbiAgICAgICAgLy8gICAgICAgICBpbmZvOiBpdGVtLmluZm8sXG4gICAgICAgIC8vICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaXRlbS5tb3VudGVkLCBpdGVtLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0udnBhdGhcbiAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAvLyB9XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBmaWxlIHdpdGhpbiB0aGUgY2FjaGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFRoZSB2cGF0aCBvciByZW5kZXJQYXRoIHRvIGxvb2sgZm9yXG4gICAgICogQHJldHVybnMgYm9vbGVhbiB0cnVlIGlmIGZvdW5kLCBmYWxzZSBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBhc3luYyBmaW5kKF9mcGF0aCk6IFByb21pc2U8VD4ge1xuXG4gICAgICAgIGlmICh0eXBlb2YgX2ZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaW5kIHBhcmFtZXRlciBub3Qgc3RyaW5nICR7dHlwZW9mIF9mcGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBjb25zdCByZXN1bHQxID0gYXdhaXQgdGhpcy5maW5kQnlQYXRoKGZwYXRoKTtcblxuICAgICAgICAvLyBjb25zdCByZXN1bHQxID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgLy8gICAgIG9yOiBbXG4gICAgICAgIC8vICAgICAgICAgeyB2cGF0aDogeyBlcTogZnBhdGggfX0sXG4gICAgICAgIC8vICAgICAgICAgeyByZW5kZXJQYXRoOiB7IGVxOiBmcGF0aCB9fVxuICAgICAgICAvLyAgICAgXVxuICAgICAgICAvLyB9IGFzIEZpbHRlcjxUPik7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmQgJHtfZnBhdGh9ICR7ZnBhdGh9ID09PiByZXN1bHQxICR7dXRpbC5pbnNwZWN0KHJlc3VsdDEpfSBgKTtcblxuICAgICAgICBjb25zdCByZXN1bHQyID0gPGFueVtdPnJlc3VsdDEuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuICEoZmNhY2hlLmlnbm9yZUZpbGUoaXRlbSkpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHQyKSB7XG4gICAgICAgIC8vICAgICB0aGlzLmdhdGhlckluZm9EYXRhKHJlc3VsdCk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZCAke19mcGF0aH0gJHtmcGF0aH0gPT0+IHJlc3VsdDIgJHt1dGlsLmluc3BlY3QocmVzdWx0Mil9IGApO1xuXG4gICAgICAgIGxldCByZXQ7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdDIpICYmIHJlc3VsdDIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0ID0gcmVzdWx0MlswXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdDIpICYmIHJlc3VsdDIubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHJldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IHJlc3VsdDI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAjZkV4aXN0c0luRGlyKGZwYXRoLCBkaXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYCNmRXhpc3RzSW5EaXIgJHtmcGF0aH0gJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgaWYgKGRpci5tb3VudFBvaW50ID09PSAnLycpIHtcbiAgICAgICAgICAgIGNvbnN0IGZzcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBkaXIubW91bnRlZCwgZnBhdGhcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsZXQgZnNleGlzdHMgPSBGUy5leGlzdHNTeW5jKGZzcGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChmc2V4aXN0cykge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IEZTLnN0YXRTeW5jKGZzcGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxWUGF0aERhdGE+IHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLm1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogc3RhdHMubXRpbWVNc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbXAgPSBkaXIubW91bnRQb2ludC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gZGlyLm1vdW50UG9pbnQuc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IGRpci5tb3VudFBvaW50O1xuICAgICAgICBtcCA9IG1wLmVuZHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gbXBcbiAgICAgICAgICAgIDogKG1wKycvJyk7XG5cbiAgICAgICAgaWYgKGZwYXRoLnN0YXJ0c1dpdGgobXApKSB7XG4gICAgICAgICAgICBsZXQgcGF0aEluTW91bnRlZFxuICAgICAgICAgICAgICAgID0gZnBhdGgucmVwbGFjZShkaXIubW91bnRQb2ludCwgJycpO1xuICAgICAgICAgICAgbGV0IGZzcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBkaXIubW91bnRlZCwgcGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ2hlY2tpbmcgZXhpc3QgZm9yICR7ZGlyLm1vdW50UG9pbnR9ICR7ZGlyLm1vdW50ZWR9ICR7cGF0aEluTW91bnRlZH0gJHtmc3BhdGh9YCk7XG4gICAgICAgICAgICBsZXQgZnNleGlzdHMgPSBGUy5leGlzdHNTeW5jKGZzcGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChmc2V4aXN0cykge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IEZTLnN0YXRTeW5jKGZzcGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxWUGF0aERhdGE+IHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLm1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBzdGF0cy5tdGltZU1zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRnVsZmlsbHMgdGhlIFwiZmluZFwiIG9wZXJhdGlvbiBub3QgYnlcbiAgICAgKiBsb29raW5nIGluIHRoZSBkYXRhYmFzZSwgYnV0IGJ5IHNjYW5uaW5nXG4gICAgICogdGhlIGZpbGVzeXN0ZW0gdXNpbmcgc3luY2hyb25vdXMgY2FsbHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGZpbmRTeW5jKF9mcGF0aCk6IFZQYXRoRGF0YSB8IHVuZGVmaW5lZCB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfZnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmQgcGFyYW1ldGVyIG5vdCBzdHJpbmcgJHt0eXBlb2YgX2ZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZFN5bmMgbG9va2luZyBmb3IgJHtmcGF0aH0gaW4gJHt1dGlsLmluc3BlY3QobWFwcGVkKX1gKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiBtYXBwZWQpIHtcbiAgICAgICAgICAgIGlmICghKGRpcj8ubW91bnRQb2ludCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYGZpbmRTeW5jIGJhZCBkaXJzIGluICR7dXRpbC5pbnNwZWN0KHRoaXMuZGlycyl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmb3VuZCA9IHRoaXMuI2ZFeGlzdHNJbkRpcihmcGF0aCwgZGlyKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kU3luYyAke2ZwYXRofSBmb3VuZGAsIGZvdW5kKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBUT0RPIElzIHRoaXMgZnVuY3Rpb24gdXNlZCBhbnl3aGVyZT9cbiAgICAvLyBhc3luYyBmaW5kQWxsKCkge1xuXG4gICAgLy8gICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAvLyAgICAgLy8gY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgLy8gICAgIC8vIH0gYXMgRmlsdGVyPFQ+KTtcblxuICAgIC8vICAgICBjb25zdCByZXN1bHQxID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAvLyAgICAgICAgIFNFTEVDVCAqIEZST00gJHt0aGlzLmRhby50YWJsZS5xdW90ZWROYW1lfVxuICAgIC8vICAgICBgLCB7fSk7XG5cbiAgICAvLyAgICAgY29uc3QgcmVzdWx0MiA9IHJlc3VsdDEuZmlsdGVyKGl0ZW0gPT4ge1xuICAgIC8vICAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRBbGwgP2lnbm9yZT8gJHtpdGVtLnZwYXRofWApO1xuICAgIC8vICAgICAgICAgcmV0dXJuICEoZmNhY2hlLmlnbm9yZUZpbGUoaXRlbSkpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgICAgY29uc3QgcmVzdWx0MyA9IHJlc3VsdDIubWFwKGl0ZW0gPT4ge1xuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIHJldHVybiByZXN1bHQzO1xuICAgIC8vIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0c0ZpbGVDYWNoZTxcbiAgICBUIGV4dGVuZHMgQXNzZXQsXG4gICAgVGRhbyBleHRlbmRzIEJhc2VEQU88VD5cbj4gZXh0ZW5kcyBCYXNlRmlsZUNhY2hlPFQsIFRkYW8+IHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRpcnM6IGRpclRvTW91bnRbXSxcbiAgICAgICAgZGFvOiBUZGFvXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKGNvbmZpZywgbmFtZSwgZGlycywgZGFvKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoob2JqOiBhbnkpOiBBc3NldCB7XG4gICAgICAgIGNvbnN0IHJldDogQXNzZXQgPSBuZXcgQXNzZXQoKTtcbiAgICAgICAgdGhpcy5jdnRSb3dUb09iakJBU0Uob2JqLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgIFQgZXh0ZW5kcyBMYXlvdXQgfCBQYXJ0aWFsLFxuICAgIFRkYW8gZXh0ZW5kcyBCYXNlREFPPFQ+PlxuICAgIGV4dGVuZHMgQmFzZUZpbGVDYWNoZTxULCBUZGFvPiB7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRpcnM6IGRpclRvTW91bnRbXSxcbiAgICAgICAgZGFvOiBUZGFvLFxuICAgICAgICB0eXBlOiBcImxheW91dFwiIHwgXCJwYXJ0aWFsXCJcbiAgICApIHtcbiAgICAgICAgc3VwZXIoY29uZmlnLCBuYW1lLCBkaXJzLCBkYW8pO1xuICAgICAgICB0aGlzLiN0eXBlID0gdHlwZTtcbiAgICB9XG5cbiAgICAvLyBCZWNhdXNlIHRoaXMgY2xhc3Mgc2VydmVzIHR3byBwdXJwb3NlcywgTGF5b3V0XG4gICAgLy8gYW5kIFBhcnRpYWxzLCB0aGlzIGZsYWcgaGVscHMgdG8gZGlzdGluZ3Vpc2guXG4gICAgLy8gQW55IHBsYWNlLCBsaWtlIGN2dFJvd1RvT2JqLCB3aGljaCBuZWVkcyB0byBrbm93XG4gICAgLy8gd2hpY2ggaXMgd2hpY2ggY2FuIHVzZSB0aGVzZSBnZXR0ZXJzIHRvIGRvXG4gICAgLy8gdGhlIHJpZ2h0IHRoaW5nLlxuXG4gICAgI3R5cGU6IFwibGF5b3V0XCIgfCBcInBhcnRpYWxcIjtcbiAgICBnZXQgaXNMYXlvdXQoKSB7IHJldHVybiB0aGlzLiN0eXBlID09PSBcImxheW91dFwiOyB9XG4gICAgZ2V0IGlzUGFydGlhbCgpIHsgcmV0dXJuIHRoaXMuI3R5cGUgPT09IFwicGFydGlhbFwiOyB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoob2JqOiBhbnkpOiBMYXlvdXQgfCBQYXJ0aWFsIHtcbiAgICAgICAgY29uc3QgcmV0OiBMYXlvdXQgfCBQYXJ0aWFsID0gXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xheW91dCA/IG5ldyBMYXlvdXQoKSA6IG5ldyBQYXJ0aWFsKCk7XG4gICAgICAgIHRoaXMuY3Z0Um93VG9PYmpCQVNFKG9iaiwgcmV0KTtcblxuICAgICAgICAvLyBpZiAodHlwZW9mIG9iai5kb2NNZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgLy8gICYmIG9iai5kb2NNZXRhZGF0YSAhPT0gbnVsbFxuICAgICAgICAvLyApIHtcbiAgICAgICAgLy8gICAgIGlmICh0eXBlb2Ygb2JqLmRvY01ldGFkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGVtcGxhdGVzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIGRvY01ldGFkYXRhLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgICAgcmV0LmRvY01ldGFkYXRhID0gb2JqLmRvY01ldGFkYXRhO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmRvY0NvbnRlbnQgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmouZG9jQ29udGVudCAhPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChvYmouZG9jQ29udGVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldC5kb2NDb250ZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLmRvY0NvbnRlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUZW1wbGF0ZXNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgZG9jQ29udGVudCwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldC5kb2NDb250ZW50ID0gb2JqLmRvY0NvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jQm9keSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5kb2NCb2R5ICE9PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKG9iai5kb2NCb2R5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0LmRvY0JvZHkgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmouZG9jQm9keSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRlbXBsYXRlc0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBkb2NCb2R5LCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0LmRvY0JvZHkgPSBvYmouZG9jQm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBpZiAodHlwZW9mIG9iai5tZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgLy8gICYmIG9iai5tZXRhZGF0YSAhPT0gbnVsbFxuICAgICAgICAvLyApIHtcbiAgICAgICAgLy8gICAgIGlmICh0eXBlb2Ygb2JqLm1ldGFkYXRhICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGVtcGxhdGVzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIG1ldGFkYXRhLCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgICAgcmV0Lm1ldGFkYXRhID0gb2JqLm1ldGFkYXRhO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2F0aGVyIHRoZSBhZGRpdGlvbmFsIGRhdGEgc3VpdGFibGVcbiAgICAgKiBmb3IgUGFydGlhbCBhbmQgTGF5b3V0IHRlbXBsYXRlcy4gIFRoZVxuICAgICAqIGZ1bGwgZGF0YSBzZXQgcmVxdWlyZWQgZm9yIERvY3VtZW50cyBpc1xuICAgICAqIG5vdCBzdWl0YWJsZSBmb3IgdGhlIHRlbXBsYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmZvIFxuICAgICAqL1xuICAgIGdhdGhlckluZm9EYXRhKGluZm8pIHtcblxuICAgICAgICBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICBpbmZvLmRpcm5hbWUgPSBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLmRpcm5hbWUgPT09ICcuJykgaW5mby5kaXJuYW1lID0gJy8nO1xuXG4gICAgICAgIGxldCByZW5kZXJlciA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoaW5mby52cGF0aCk7XG4gICAgICAgIGluZm8ucmVuZGVyZXIgPSByZW5kZXJlcjtcblxuXG4gICAgICAgIGlmIChyZW5kZXJlcikge1xuXG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBVc2luZyA8YW55PiBoZXJlIGNvdmVycyBvdmVyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBwYXJzZU1ldGFkYXRhIHJlcXVpcmVzXG4gICAgICAgICAgICAgICAgLy8gYSBSZW5kZXJpbmdDb250ZXh0IHdoaWNoXG4gICAgICAgICAgICAgICAgLy8gaW4gdHVybiByZXF1aXJlcyBhIFxuICAgICAgICAgICAgICAgIC8vIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY01ldGFkYXRhIGlzIHRoZSB1bm1vZGlmaWVkIG1ldGFkYXRhL2Zyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YSA9IHJjLm1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQgaXMgdGhlIHVucGFyc2VkIG9yaWdpbmFsIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAvLyBpbmNsdWRpbmcgYW55IGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NDb250ZW50ID0gcmMuY29udGVudDtcbiAgICAgICAgICAgICAgICAvLyBkb2NCb2R5IGlzIHRoZSBwYXJzZWQgYm9keSAtLSBlLmcuIGZvbGxvd2luZyB0aGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSByYy5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY29tcHV0ZWQgbWV0YWRhdGEgdGhhdCBpbmNsdWRlcyBkYXRhIGZyb20gXG4gICAgICAgICAgICAgICAgLy8gc2V2ZXJhbCBzb3VyY2VzXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YSA9IHsgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8uZG9jTWV0YWRhdGEpIGluZm8uZG9jTWV0YWRhdGEgPSB7fTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbml0TWV0YWRhdGEgJHtiYXNlZGlyfSAke2ZwYXRofSBiYXNlTWV0YWRhdGEgJHtiYXNlTWV0YWRhdGFbeXByb3BdfWApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uYmFzZU1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgVGVtcGxhdGVzRmlsZUNhY2hlIGFmdGVyIGdhdGhlckluZm9EYXRhIGAsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm8pIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8udXBkYXRlKCh7XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH0gYXMgdW5rbm93bikgYXMgVCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbzogYW55KSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLmluc2VydCgoe1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICB9IGFzIHVua25vd24pIGFzIFQpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERvY3VtZW50c0ZpbGVDYWNoZVxuICAgIGV4dGVuZHMgQmFzZUZpbGVDYWNoZTxEb2N1bWVudCwgVGRvY3VtZW50c3NEQU8+IHtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZGlyczogZGlyVG9Nb3VudFtdXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKGNvbmZpZywgbmFtZSwgZGlycywgZG9jdW1lbnRzREFPKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgY3Z0Um93VG9PYmoob2JqOiBhbnkpOiBEb2N1bWVudCB7XG4gICAgICAgIGNvbnN0IHJldDogRG9jdW1lbnQgPSBuZXcgRG9jdW1lbnQoKTtcbiAgICAgICAgdGhpcy5jdnRSb3dUb09iakJBU0Uob2JqLCByZXQpO1xuXG4gICAgICAgIC8vIGlmICh0eXBlb2Ygb2JqLmRvY01ldGFkYXRhICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAvLyAgJiYgb2JqLmRvY01ldGFkYXRhICE9PSBudWxsXG4gICAgICAgIC8vICkge1xuICAgICAgICAvLyAgICAgaWYgKHR5cGVvZiBvYmouZG9jTWV0YWRhdGEgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgZG9jTWV0YWRhdGEsIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gICAgICAgICByZXQuZG9jTWV0YWRhdGEgPSBvYmouZG9jTWV0YWRhdGE7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jQ29udGVudCAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICYmIG9iai5kb2NDb250ZW50ICE9PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouZG9jQ29udGVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBkb2NDb250ZW50LCBnb3QgJHt1dGlsLmluc3BlY3Qob2JqKX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0LmRvY0NvbnRlbnQgPSBvYmouZG9jQ29udGVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9iai5kb2NCb2R5ICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgJiYgb2JqLmRvY0JvZHkgIT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5kb2NCb2R5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLmN2dFJvd1RvT2JqIG11c3QgaGF2ZSBhIGRvY0JvZHksIGdvdCAke3V0aWwuaW5zcGVjdChvYmopfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXQuZG9jQm9keSA9IG9iai5kb2NCb2R5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqLmJsb2d0YWcgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiBvYmouYmxvZ3RhZyAhPT0gbnVsbFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmJsb2d0YWcgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudHNGaWxlQ2FjaGUuY3Z0Um93VG9PYmogbXVzdCBoYXZlIGEgYmxvZ3RhZywgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldC5ibG9ndGFnID0gb2JqLmJsb2d0YWc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgKHR5cGVvZiBvYmoubWV0YWRhdGEgIT09ICd1bmRlZmluZWQnXG4gICAgICAgIC8vICAmJiBvYmoubWV0YWRhdGEgIT09IG51bGxcbiAgICAgICAgLy8gKSB7XG4gICAgICAgIC8vICAgICBpZiAodHlwZW9mIG9iai5tZXRhZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5jdnRSb3dUb09iaiBtdXN0IGhhdmUgYSBtZXRhZGF0YSwgZ290ICR7dXRpbC5pbnNwZWN0KG9iail9YCk7XG4gICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgICAgIHJldC5tZXRhZGF0YSA9IG9iai5tZXRhZGF0YTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm8pIHtcblxuICAgICAgICBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICBpbmZvLmRpcm5hbWUgPSBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLmRpcm5hbWUgPT09ICcuJykgaW5mby5kaXJuYW1lID0gJy8nO1xuICAgICAgICBpbmZvLnBhcmVudERpciA9IHBhdGguZGlybmFtZShpbmZvLmRpcm5hbWUpO1xuXG4gICAgICAgIC8vIGZpbmQgdGhlIG1vdW50ZWQgZGlyZWN0b3J5LFxuICAgICAgICAvLyBnZXQgdGhlIGJhc2VNZXRhZGF0YVxuICAgICAgICBmb3IgKGxldCBkaXIgb2YgcmVtYXBkaXJzKHRoaXMuZGlycykpIHtcbiAgICAgICAgICAgIGlmIChkaXIubW91bnRlZCA9PT0gaW5mby5tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpci5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5iYXNlTWV0YWRhdGEgPSBkaXIuYmFzZU1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldCBwdWJsaWNhdGlvbkRhdGUgc29tZWhvd1xuXG5cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaW5mby5yZW5kZXJlciA9IHJlbmRlcmVyO1xuXG4gICAgICAgIGlmIChyZW5kZXJlcikge1xuXG4gICAgICAgICAgICBpbmZvLnJlbmRlclBhdGhcbiAgICAgICAgICAgICAgICA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8udnBhdGgpO1xuXG4gICAgICAgICAgICAvLyBUaGlzIHdhcyBpbiB0aGUgTG9raUpTIGNvZGUsIGJ1dFxuICAgICAgICAgICAgLy8gd2FzIG5vdCBpbiB1c2UuXG4gICAgICAgICAgICAvLyBpbmZvLnJlbmRlcm5hbWUgPSBwYXRoLmJhc2VuYW1lKFxuICAgICAgICAgICAgLy8gICAgIGluZm8ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gKTtcblxuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID1cbiAgICAgICAgICAgICAgICBtaWNyb21hdGNoLmlzTWF0Y2goXG4gICAgICAgICAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgJyoqLyouaHRtbCcpXG4gICAgICAgICAgICAgfHwgbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgICAgICBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgICcqLmh0bWwnKVxuICAgICAgICAgICAgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBVc2luZyA8YW55PiBoZXJlIGNvdmVycyBvdmVyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBwYXJzZU1ldGFkYXRhIHJlcXVpcmVzXG4gICAgICAgICAgICAgICAgLy8gYSBSZW5kZXJpbmdDb250ZXh0IHdoaWNoXG4gICAgICAgICAgICAgICAgLy8gaW4gdHVybiByZXF1aXJlcyBhIFxuICAgICAgICAgICAgICAgIC8vIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY01ldGFkYXRhIGlzIHRoZSB1bm1vZGlmaWVkIG1ldGFkYXRhL2Zyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YSA9IHJjLm1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQgaXMgdGhlIHVucGFyc2VkIG9yaWdpbmFsIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAvLyBpbmNsdWRpbmcgYW55IGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NDb250ZW50ID0gcmMuY29udGVudDtcbiAgICAgICAgICAgICAgICAvLyBkb2NCb2R5IGlzIHRoZSBwYXJzZWQgYm9keSAtLSBlLmcuIGZvbGxvd2luZyB0aGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSByYy5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY29tcHV0ZWQgbWV0YWRhdGEgdGhhdCBpbmNsdWRlcyBkYXRhIGZyb20gXG4gICAgICAgICAgICAgICAgLy8gc2V2ZXJhbCBzb3VyY2VzXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YSA9IHsgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8uZG9jTWV0YWRhdGEpIGluZm8uZG9jTWV0YWRhdGEgPSB7fTtcblxuICAgICAgICAgICAgICAgIC8vIFRoZSByZXN0IG9mIHRoaXMgaXMgYWRhcHRlZCBmcm9tIHRoZSBvbGQgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAvLyBIVE1MUmVuZGVyZXIubmV3SW5pdE1ldGFkYXRhXG5cbiAgICAgICAgICAgICAgICAvLyBGb3Igc3RhcnRlcnMgdGhlIG1ldGFkYXRhIGlzIGNvbGxlY3RlZCBmcm9tIHNldmVyYWwgc291cmNlcy5cbiAgICAgICAgICAgICAgICAvLyAxKSB0aGUgbWV0YWRhdGEgc3BlY2lmaWVkIGluIHRoZSBkaXJlY3RvcnkgbW91bnQgd2hlcmVcbiAgICAgICAgICAgICAgICAvLyAgICB0aGlzIGRvY3VtZW50IHdhcyBmb3VuZFxuICAgICAgICAgICAgICAgIC8vIDIpIG1ldGFkYXRhIGluIHRoZSBwcm9qZWN0IGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgICAgICAvLyAzKSB0aGUgbWV0YWRhdGEgaW4gdGhlIGRvY3VtZW50LCBhcyBjYXB0dXJlZCBpbiBkb2NNZXRhZGF0YVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gaW5mby5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGluaXRNZXRhZGF0YSAke2Jhc2VkaXJ9ICR7ZnBhdGh9IGJhc2VNZXRhZGF0YSAke2Jhc2VNZXRhZGF0YVt5cHJvcF19YCk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5iYXNlTWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiB0aGlzLmNvbmZpZy5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IHRoaXMuY29uZmlnLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGZtbWNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmRvY01ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5kb2NNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgICAgIGZtbWNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhlIGNvbnRlbnQgbGFuZHMgaGVyZVxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGRvY3VtZW50IG9iamVjdCBoYXMgYmVlbiB1c2VmdWwgZm9yIFxuICAgICAgICAgICAgICAgIC8vIGNvbW11bmljYXRpbmcgdGhlIGZpbGUgcGF0aCBhbmQgb3RoZXIgZGF0YS5cbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50ID0ge307XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5iYXNlZGlyID0gaW5mby5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscGF0aCA9IGluZm8ucGF0aEluTW91bnRlZDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHJlbmRlciA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8ucGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5wYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvID0gaW5mby5yZW5kZXJQYXRoO1xuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIHRoZSA8ZW0+dGFnczwvZW0+IGZpZWxkIGlzIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgaWYgKCEoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoaW5mby5tZXRhZGF0YS50YWdzKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhZ2xpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmUgPSAvXFxzKixcXHMqLztcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzLnNwbGl0KHJlKS5mb3JFYWNoKHRhZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdsaXN0LnB1c2godGFnLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSB0YWdsaXN0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBgRk9STUFUIEVSUk9SIC0gJHtpbmZvLnZwYXRofSBoYXMgYmFkbHkgZm9ybWF0dGVkIHRhZ3MgYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEudGFncyA9IGluZm8ubWV0YWRhdGEudGFncztcblxuICAgICAgICAgICAgICAgIGlmIChpbmZvLm1ldGFkYXRhLmJsb2d0YWcpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5ibG9ndGFnID0gaW5mby5tZXRhZGF0YS5ibG9ndGFnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBUaGUgcm9vdCBVUkwgZm9yIHRoZSBwcm9qZWN0XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yb290X3VybCA9IHRoaXMuY29uZmlnLnJvb3RfdXJsO1xuXG4gICAgICAgICAgICAgICAgLy8gQ29tcHV0ZSB0aGUgVVJMIHRoaXMgZG9jdW1lbnQgd2lsbCByZW5kZXIgdG9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jb25maWcucm9vdF91cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHVSb290VXJsID0gbmV3IFVSTCh0aGlzLmNvbmZpZy5yb290X3VybCwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgICAgICAgICB1Um9vdFVybC5wYXRobmFtZSA9IHBhdGgubm9ybWFsaXplKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbih1Um9vdFVybC5wYXRobmFtZSwgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbylcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSB1Um9vdFVybC50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfdXJsID0gaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX2RhdGUgPSBpbmZvLnN0YXRzLm10aW1lO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VQdWJsRGF0ZSA9IChkYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IERhdGUucGFyc2UoZGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghIGlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRlU2V0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAmJiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgZGF0ZVNldCAmJiBpbmZvLm10aW1lTXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUoaW5mby5tdGltZU1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2luZm8udnBhdGh9IG1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSAke2luZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlfSBzZXQgZnJvbSBzdGF0cy5tdGltZWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2luZm8udnBhdGh9IG1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSAke2luZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlfSBzZXQgZnJvbSBjdXJyZW50IHRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGRlbGV0ZURvY1RhZ0dsdWUodnBhdGgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUodnBhdGgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIGlnbm9yZVxuICAgICAgICAgICAgLy8gVGhpcyBjYW4gdGhyb3cgYW4gZXJyb3IgbGlrZTpcbiAgICAgICAgICAgIC8vIGRvY3VtZW50c0NhY2hlIEVSUk9SIHtcbiAgICAgICAgICAgIC8vICAgICBjb2RlOiAnY2hhbmdlZCcsXG4gICAgICAgICAgICAvLyAgICAgbmFtZTogJ2RvY3VtZW50cycsXG4gICAgICAgICAgICAvLyAgICAgdnBhdGg6ICdfbWVybWFpZC9yZW5kZXIzMzU2NzM5MzgyLm1lcm1haWQnLFxuICAgICAgICAgICAgLy8gICAgIGVycm9yOiBFcnJvcjogZGVsZXRlIGZyb20gJ1RBR0dMVUUnIGZhaWxlZDogbm90aGluZyBjaGFuZ2VkXG4gICAgICAgICAgICAvLyAgICAgIC4uLiBzdGFjayB0cmFjZVxuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gSW4gc3VjaCBhIGNhc2UgdGhlcmUgaXMgbm8gdGFnR2x1ZSBmb3IgdGhlIGRvY3VtZW50LlxuICAgICAgICAgICAgLy8gVGhpcyBcImVycm9yXCIgaXMgc3B1cmlvdXMuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gVE9ETyBJcyB0aGVyZSBhbm90aGVyIHF1ZXJ5IHRvIHJ1biB0aGF0IHdpbGxcbiAgICAgICAgICAgIC8vIG5vdCB0aHJvdyBhbiBlcnJvciBpZiBub3RoaW5nIHdhcyBjaGFuZ2VkP1xuICAgICAgICAgICAgLy8gSW4gb3RoZXIgd29yZHMsIHRoaXMgY291bGQgaGlkZSBhIGxlZ2l0aW1hdGVcbiAgICAgICAgICAgIC8vIGVycm9yLlxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGFkZERvY1RhZ0dsdWUodnBhdGg6IHN0cmluZywgdGFnczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0YWdzICE9PSAnc3RyaW5nJ1xuICAgICAgICAgJiYgIUFycmF5LmlzQXJyYXkodGFncylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFkZERvY1RhZ0dsdWUgbXVzdCBiZSBnaXZlbiBhIHRhZ3MgYXJyYXksIHdhcyBnaXZlbjogJHt1dGlsLmluc3BlY3QodGFncyl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGdsdWUuYWRkVGFnR2x1ZSh2cGF0aCwgXG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KHRhZ3MpXG4gICAgICAgICAgICA/IHRhZ3NcbiAgICAgICAgICAgIDogWyB0YWdzIF0pO1xuICAgIH1cblxuICAgIGFzeW5jIGFkZFRhZ0Rlc2NyaXB0aW9uKHRhZzogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0ZGVzYy5hZGREZXNjKHRhZywgZGVzY3JpcHRpb24pO1xuICAgIH1cblxuICAgIGFzeW5jIGdldFRhZ0Rlc2NyaXB0aW9uKHRhZzogc3RyaW5nKVxuICAgICAgICA6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPlxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRkZXNjLmdldERlc2ModGFnKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvKSB7XG4gICAgICAgIGNvbnN0IGRvY0luZm8gPSA8RG9jdW1lbnQ+e1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOlxuICAgICAgICAgICAgICAgIHR5cGVvZiBpbmZvLnJlbmRlcnNUb0hUTUwgPT09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICAgPyBmYWxzZVxuICAgICAgICAgICAgICAgIDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBwYXJlbnREaXI6IGluZm8ucGFyZW50RGlyLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgYmFzZU1ldGFkYXRhOiBpbmZvLmJhc2VNZXRhZGF0YSxcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICB0YWdzOiBBcnJheS5pc0FycmF5KGluZm8ubWV0YWRhdGE/LnRhZ3MpXG4gICAgICAgICAgICAgICAgICAgID8gaW5mby5tZXRhZGF0YS50YWdzXG4gICAgICAgICAgICAgICAgICAgIDogW10sXG4gICAgICAgICAgICBsYXlvdXQ6IGluZm8ubWV0YWRhdGE/LmxheW91dCxcbiAgICAgICAgICAgIGJsb2d0YWc6IGluZm8uYmxvZ3RhZyxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH07XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYW8udXBkYXRlKGRvY0luZm8pO1xuXG4gICAgICAgIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUoZG9jSW5mby52cGF0aCk7XG4gICAgICAgIGF3YWl0IHRnbHVlLmFkZFRhZ0dsdWUoZG9jSW5mby52cGF0aCwgZG9jSW5mby50YWdzKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihpbmZvOiBhbnkpIHtcbiAgICAgICAgY29uc3QgZG9jSW5mbyA9IDxEb2N1bWVudD57XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6XG4gICAgICAgICAgICAgICAgdHlwZW9mIGluZm8ucmVuZGVyc1RvSFRNTCA9PT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICA/IGZhbHNlXG4gICAgICAgICAgICAgICAgOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIHBhcmVudERpcjogaW5mby5wYXJlbnREaXIsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBiYXNlTWV0YWRhdGE6IGluZm8uYmFzZU1ldGFkYXRhLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIHRhZ3M6IEFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YT8udGFncylcbiAgICAgICAgICAgICAgICAgICAgPyBpbmZvLm1ldGFkYXRhLnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgOiBbXSxcbiAgICAgICAgICAgIGxheW91dDogaW5mby5tZXRhZGF0YT8ubGF5b3V0LFxuICAgICAgICAgICAgYmxvZ3RhZzogaW5mby5ibG9ndGFnLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8uaW5zZXJ0KGRvY0luZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZERvY1RhZ0dsdWUoXG4gICAgICAgICAgICBkb2NJbmZvLnZwYXRoLCBkb2NJbmZvLnRhZ3NcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVVbmxpbmtlZChuYW1lOiBhbnksIGluZm86IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBzdXBlci5oYW5kbGVVbmxpbmtlZChuYW1lLCBpbmZvKTtcbiAgICAgICAgdGdsdWUuZGVsZXRlVGFnR2x1ZShpbmZvLnZwYXRoKTtcbiAgICB9XG5cbiAgICBhc3luYyBpbmRleENoYWluKF9mcGF0aCkge1xuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSkgXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXRoLnBhcnNlKGZwYXRoKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW5kZXhDaGFpbiAke19mcGF0aH0gJHtmcGF0aH1gLCBwYXJzZWQpO1xuXG4gICAgICAgIGNvbnN0IGZpbGV6OiBEb2N1bWVudFtdID0gW107XG4gICAgICAgIGNvbnN0IHNlbGYgPSBhd2FpdCB0aGlzLmZpbmRCeVBhdGgoZnBhdGgpO1xuICAgICAgICBsZXQgZmlsZU5hbWUgPSBmcGF0aDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZikgJiYgc2VsZi5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgZmlsZXoucHVzaChzZWxmWzBdKTtcbiAgICAgICAgICAgIGZpbGVOYW1lID0gc2VsZlswXS5yZW5kZXJQYXRoO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHBhcmVudERpcjtcbiAgICAgICAgbGV0IGRpck5hbWUgPSBwYXRoLmRpcm5hbWUoZnBhdGgpO1xuICAgICAgICBsZXQgZG9uZSA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAoIShkaXJOYW1lID09PSAnLicgfHwgZGlyTmFtZSA9PT0gcGFyc2VkLnJvb3QpKSB7XG4gICAgICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShmaWxlTmFtZSkgPT09ICdpbmRleC5odG1sJykge1xuICAgICAgICAgICAgICAgIHBhcmVudERpciA9IHBhdGguZGlybmFtZShwYXRoLmRpcm5hbWUoZmlsZU5hbWUpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGZpbGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBsb29rRm9yID0gcGF0aC5qb2luKHBhcmVudERpciwgXCJpbmRleC5odG1sXCIpO1xuXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGF3YWl0IHRoaXMuZmluZEJ5UGF0aChsb29rRm9yKTtcblxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW5kZXgpICYmIGluZGV4Lmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICAgICAgZmlsZXoucHVzaChpbmRleFswXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbGVOYW1lID0gbG9va0ZvcjtcbiAgICAgICAgICAgIGRpck5hbWUgPSBwYXRoLmRpcm5hbWUobG9va0Zvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsZXpcbiAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uKG9iajogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5mb3VuZERpciA9IG9iai5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgICAgICBvYmouZm91bmRQYXRoID0gb2JqLnJlbmRlclBhdGg7XG4gICAgICAgICAgICAgICAgICAgIG9iai5maWxlbmFtZSA9ICcvJyArIG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnJldmVyc2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyBhbGwgdGhlIGRvY3VtZW50cyBpbiB0aGUgc2FtZSBkaXJlY3RvcnlcbiAgICAgKiBhcyB0aGUgbmFtZWQgZmlsZS5cbiAgICAgKlxuICAgICAqIFRoaXMgZG9lc24ndCBhcHBlYXIgdG8gYmUgdXNlZCBhbnl3aGVyZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgc2libGluZ3MoX2ZwYXRoKSB7XG4gICAgICAgIGxldCByZXQ7XG4gICAgICAgIGxldCB2cGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG4gICAgICAgIGxldCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKHZwYXRoKTtcblxuICAgICAgICBjb25zdCBzaWJsaW5ncyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgICAgICBTRUxFQ1QgKiBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgICAgIFdIRVJFXG4gICAgICAgICAgICBkaXJuYW1lID0gJGRpcm5hbWUgQU5EXG4gICAgICAgICAgICB2cGF0aCA8PiAkdnBhdGggQU5EXG4gICAgICAgICAgICByZW5kZXJQYXRoIDw+ICR2cGF0aCBBTkRcbiAgICAgICAgICAgIHJlbmRlcnNUb0h0bWwgPSB0cnVlXG4gICAgICAgIGAsIHtcbiAgICAgICAgICAgICRkaXJuYW1lOiBkaXJuYW1lLFxuICAgICAgICAgICAgJHZwYXRoOiB2cGF0aFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBpZ25vcmVkID0gc2libGluZ3MuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLmlnbm9yZUZpbGUoaXRlbSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IGlnbm9yZWQubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3Z0Um93VG9PYmooaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWFwcGVkO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHRyZWUgb2YgaXRlbXMgc3RhcnRpbmcgZnJvbSB0aGUgZG9jdW1lbnRcbiAgICAgKiBuYW1lZCBpbiBfcm9vdEl0ZW0uICBUaGUgcGFyYW1ldGVyIHNob3VsZCBiZSBhblxuICAgICAqIGFjdHVhbCBkb2N1bWVudCBpbiB0aGUgdHJlZSwgc3VjaCBhcyBgcGF0aC90by9pbmRleC5odG1sYC5cbiAgICAgKiBUaGUgcmV0dXJuIGlzIGEgdHJlZS1zaGFwZWQgc2V0IG9mIG9iamVjdHMgbGlrZSB0aGUgZm9sbG93aW5nO1xuICAgICAqIFxuICB0cmVlOlxuICAgIHJvb3RJdGVtOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyXG4gICAgaXRlbXM6XG4gICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgIGNoaWxkRm9sZGVyczpcbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlclxuICAgICAgICAgIGNoaWxkcmVuOlxuICAgICAgICAgICAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlclxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTEuaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UyLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAgICAtIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgIGNoaWxkcmVuOlxuICAgICAgICAgICAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyXG4gICAgICAgICAgICAgIGl0ZW1zOlxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMS5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbFxuICAgICAgICAgICAgICBjaGlsZEZvbGRlcnM6IFtdXG4gICAgICpcbiAgICAgKiBUaGUgb2JqZWN0cyB1bmRlciBgaXRlbXNgIGFyZSBhY3R1bGx5IHRoZSBmdWxsIERvY3VtZW50IG9iamVjdFxuICAgICAqIGZyb20gdGhlIGNhY2hlLCBidXQgZm9yIHRoZSBpbnRlcmVzdCBvZiBjb21wYWN0bmVzcyBtb3N0IG9mXG4gICAgICogdGhlIGZpZWxkcyBoYXZlIGJlZW4gZGVsZXRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfcm9vdEl0ZW0gXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgY2hpbGRJdGVtVHJlZShfcm9vdEl0ZW06IHN0cmluZykge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGlsZEl0ZW1UcmVlICR7X3Jvb3RJdGVtfWApO1xuXG4gICAgICAgIGxldCByb290SXRlbSA9IGF3YWl0IHRoaXMuZmluZChcbiAgICAgICAgICAgICAgICBfcm9vdEl0ZW0uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX3Jvb3RJdGVtLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9yb290SXRlbSk7XG4gICAgICAgIGlmICghcm9vdEl0ZW0pIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybihgY2hpbGRJdGVtVHJlZSBubyByb290SXRlbSBmb3VuZCBmb3IgcGF0aCAke19yb290SXRlbX1gKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEodHlwZW9mIHJvb3RJdGVtID09PSAnb2JqZWN0JylcbiAgICAgICAgIHx8ICEoJ3ZwYXRoJyBpbiByb290SXRlbSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYGNoaWxkSXRlbVRyZWUgZm91bmQgaW52YWxpZCBvYmplY3QgZm9yICR7X3Jvb3RJdGVtfSAtICR7dXRpbC5pbnNwZWN0KHJvb3RJdGVtKX1gKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUocm9vdEl0ZW0udnBhdGgpO1xuICAgICAgICAvLyBQaWNrcyB1cCBldmVyeXRoaW5nIGZyb20gdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIC8vIERpZmZlcnMgZnJvbSBzaWJsaW5ncyBieSBnZXR0aW5nIGV2ZXJ5dGhpbmcuXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgIGRpcm5hbWU6IHsgZXE6IGRpcm5hbWUgfSxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHRydWVcbiAgICAgICAgfSkgYXMgdW5rbm93bltdIGFzIGFueVtdO1xuXG4gICAgICAgIGNvbnN0IGNoaWxkRm9sZGVycyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChcbiAgICAgICAgICAgIGBTRUxFQ1QgZGlzdGluY3QgZGlybmFtZSBGUk9NIERPQ1VNRU5UU1xuICAgICAgICAgICAgV0hFUkUgcGFyZW50RGlyID0gJyR7ZGlybmFtZX0nYFxuICAgICAgICApIGFzIHVua25vd25bXSBhcyBEb2N1bWVudFtdO1xuXG4gICAgICAgIGNvbnN0IGNmcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGNmIG9mIGNoaWxkRm9sZGVycykge1xuICAgICAgICAgICAgY2ZzLnB1c2goYXdhaXQgdGhpcy5jaGlsZEl0ZW1UcmVlKFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihjZi5kaXJuYW1lLCAnaW5kZXguaHRtbCcpXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByb290SXRlbSxcbiAgICAgICAgICAgIGRpcm5hbWUsXG4gICAgICAgICAgICBpdGVtczogaXRlbXMsXG4gICAgICAgICAgICAvLyBVbmNvbW1lbnQgdGhpcyB0byBnZW5lcmF0ZSBzaW1wbGlmaWVkIG91dHB1dFxuICAgICAgICAgICAgLy8gZm9yIGRlYnVnZ2luZy5cbiAgICAgICAgICAgIC8vIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0pLFxuICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBjZnNcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGluZGV4IGZpbGVzIChyZW5kZXJzIHRvIGluZGV4Lmh0bWwpXG4gICAgICogd2l0aGluIHRoZSBuYW1lZCBzdWJ0cmVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGluZGV4RmlsZXMocm9vdFBhdGg/OiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsbHkgYXBwZW5kYWJsZSBzdWItcXVlcnlcbiAgICAgICAgLy8gdG8gaGFuZGxlIHdoZW4gcm9vdFBhdGggaXMgc3BlY2lmaWVkXG4gICAgICAgIGxldCByb290USA9IChcbiAgICAgICAgICAgICAgICB0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgJiYgcm9vdFAubGVuZ3RoID49IDFcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgID8gYEFORCAoIHJlbmRlclBhdGggTElLRSAnJHtyb290UH0lJyApYFxuICAgICAgICAgICAgOiAnJztcblxuICAgICAgICByZXR1cm4gdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgU0VMRUNUICpcbiAgICAgICAgRlJPTSBET0NVTUVOVFNcbiAgICAgICAgV0hFUkVcbiAgICAgICAgICAgICggcmVuZGVyc1RvSFRNTCA9IHRydWUgKVxuICAgICAgICBBTkQgKFxuICAgICAgICAgICAgKCByZW5kZXJQYXRoIExJS0UgJyUvaW5kZXguaHRtbCcgKVxuICAgICAgICAgT1IgKCByZW5kZXJQYXRoID0gJ2luZGV4Lmh0bWwnIClcbiAgICAgICAgKVxuICAgICAgICAke3Jvb3RRfVxuICAgICAgICBgKTtcbiAgICAgICAgXG5cbiAgICAgICAgLy8gSXQncyBwcm92ZWQgZGlmZmljdWx0IHRvIGdldCB0aGUgcmVnZXhwXG4gICAgICAgIC8vIHRvIHdvcmsgaW4gdGhpcyBtb2RlOlxuICAgICAgICAvL1xuICAgICAgICAvLyByZXR1cm4gYXdhaXQgdGhpcy5zZWFyY2goe1xuICAgICAgICAvLyAgICAgcmVuZGVyc1RvSFRNTDogdHJ1ZSxcbiAgICAgICAgLy8gICAgIHJlbmRlcnBhdGhtYXRjaDogL1xcL2luZGV4Lmh0bWwkLyxcbiAgICAgICAgLy8gICAgIHJvb3RQYXRoOiByb290UGF0aFxuICAgICAgICAvLyB9KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogRm9yIGV2ZXJ5IGZpbGUgaW4gdGhlIGRvY3VtZW50cyBjYWNoZSxcbiAgICAgKiBzZXQgdGhlIGFjY2VzcyBhbmQgbW9kaWZpY2F0aW9ucy5cbiAgICAgKlxuICAgICAqID8/Pz8/IFdoeSB3b3VsZCB0aGlzIGJlIHVzZWZ1bD9cbiAgICAgKiBJIGNhbiBzZWUgZG9pbmcgdGhpcyBmb3IgdGhlIHJlbmRlcmVkXG4gICAgICogZmlsZXMgaW4gdGhlIG91dHB1dCBkaXJlY3RvcnkuICBCdXQgdGhpcyBpc1xuICAgICAqIGZvciB0aGUgZmlsZXMgaW4gdGhlIGRvY3VtZW50cyBkaXJlY3Rvcmllcy4gPz8/P1xuICAgICAqL1xuICAgIGFzeW5jIHNldFRpbWVzKCkge1xuICAgICAgICBhd2FpdCB0aGlzLmRhby5zZWxlY3RFYWNoKFxuICAgICAgICAgICAgKGVyciwgbW9kZWwpID0+IHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNldHRlciA9IGFzeW5jIChkYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IERhdGUucGFyc2UoZGF0ZSk7O1xuICAgICAgICAgICAgICAgICAgICBpZiAoISBpc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkcCA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBGUy51dGltZXNTeW5jKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG1vZGVsLmluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgbW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXR0ZXIobW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChtb2RlbC5pbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIG1vZGVsLmluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldHRlcihtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHt9IGFzIFdoZXJlPERvY3VtZW50PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlIHRoZSBkb2N1bWVudHMgd2hpY2ggaGF2ZSB0YWdzLlxuICAgICAqIFxuICAgICAqIFRPRE8gLSBJcyB0aGlzIGZ1bmN0aW9uIHVzZWQgYW55d2hlcmU/XG4gICAgICogICBJdCBpcyBub3QgcmVmZXJlbmNlZCBpbiBha2FzaGFyZW5kZXIsIG5vclxuICAgICAqICAgaW4gYW55IHBsdWdpbiB0aGF0IEkgY2FuIGZpbmQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICAvLyBhc3luYyBkb2N1bWVudHNXaXRoVGFncygpIHtcbiAgICAvLyAgICAgY29uc3QgZG9jcyA9IG5ldyBBcnJheTxEb2N1bWVudD4oKTtcbiAgICAvLyAgICAgYXdhaXQgdGhpcy5kYW8uc2VsZWN0RWFjaChcbiAgICAvLyAgICAgICAgIChlcnIsIGRvYykgPT4ge1xuICAgIC8vICAgICAgICAgICAgIGlmIChkb2NcbiAgICAvLyAgICAgICAgICAgICAgJiYgZG9jLmRvY01ldGFkYXRhXG4gICAgLy8gICAgICAgICAgICAgICYmIGRvYy5kb2NNZXRhZGF0YS50YWdzXG4gICAgLy8gICAgICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkoXG4gICAgLy8gICAgICAgICAgICAgICAgIGRvYy5kb2NNZXRhZGF0YS50YWdzXG4gICAgLy8gICAgICAgICAgICAgIClcbiAgICAvLyAgICAgICAgICAgICAgJiYgZG9jLmRvY01ldGFkYXRhLnRhZ3MubGVuZ3RoID49IDFcbiAgICAvLyAgICAgICAgICAgICApIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgZG9jcy5wdXNoKGRvYyk7XG4gICAgLy8gICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgfSxcbiAgICAvLyAgICAgICAgIHtcbiAgICAvLyAgICAgICAgICAgICByZW5kZXJzVG9IVE1MOiB7IGVxOiB0cnVlIH0sXG4gICAgLy8gICAgICAgICAgICAgaW5mbzogeyBpc05vdE51bGw6IHRydWUgfVxuICAgIC8vICAgICAgICAgfSBhcyBXaGVyZTxEb2N1bWVudD5cbiAgICAvLyAgICAgKTtcblxuICAgIC8vICAgICAvLyBjb25zb2xlLmxvZyhkb2NzKTtcbiAgICAvLyAgICAgcmV0dXJuIGRvY3M7XG4gICAgLy8gfVxuXG4gICAgYXN5bmMgZG9jdW1lbnRzV2l0aFRhZyh0YWdubTogc3RyaW5nIHwgc3RyaW5nW10pXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxzdHJpbmc+PlxuICAgIHtcbiAgICAgICAgbGV0IHRhZ3M6IHN0cmluZ1tdO1xuICAgICAgICBpZiAodHlwZW9mIHRhZ25tID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGFncyA9IFsgdGFnbm0gXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRhZ25tKSkge1xuICAgICAgICAgICAgdGFncyA9IHRhZ25tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudHNXaXRoVGFnIGdpdmVuIGJhZCB0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KHRhZ25tKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvcnJlY3RseSBoYW5kbGUgdGFnIHN0cmluZ3Mgd2l0aFxuICAgICAgICAvLyB2YXJ5aW5nIHF1b3Rlcy4gIEEgZG9jdW1lbnQgbWlnaHQgaGF2ZSB0aGVzZSB0YWdzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICB0YWdzOlxuICAgICAgICAvLyAgICAtIFRlYXNlcidzXG4gICAgICAgIC8vICAgIC0gVGVhc2Vyc1xuICAgICAgICAvLyAgICAtIFNvbWV0aGluZyBcInF1b3RlZFwiXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZXNlIFNRTCBxdWVyaWVzIHdvcms6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVpdGVkXCInLCBcIlRlYXNlcidzXCIgKTtcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxUZWFzZXInc1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFNvbWV0aGluZyBcInF1aXRlZFwiXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0ICogZnJvbSBUQUdHTFVFIHdoZXJlIHRhZ05hbWUgSU4gKCAnU29tZXRoaW5nIFwicXVpdGVkXCInLCAnVGVhc2VyJydzJyApO1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFRlYXNlcidzXG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8U29tZXRoaW5nIFwicXVpdGVkXCJcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQnV0LCB0aGlzIGRvZXMgbm90OlxuICAgICAgICAvL1xuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lID0gJ1RlYXNlcidzJztcbiAgICAgICAgLy8gJyAgLi4uPiBcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIG9yaWdpbmFsIGNvZGUgYmVoYXZpb3Igd2FzIHRoaXM6XG4gICAgICAgIC8vXG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInNcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuIGF0dGVtcHRlZCBmaXg6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIlxuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgXCJUZWFzZXInc1wiIF0gICggJ1RlYXNlclxcJ3MnICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwic1wiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5vdGhlciBhdHRlbXB0ZWQgZml4OlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiBdICAoIFwiVGVhc2VyJydzXCIgKSBcbiAgICAgICAgLy8gW11cbiAgICAgICAgLy8gW11cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQW5kOlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyAnU29tZXRoaW5nIFwicXVvdGVkXCInXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyAnU29tZXRoaW5nIFwicXVvdGVkXCInIF0gICggXCJTb21ldGhpbmcgXCJxdW90ZWRcIlwiICkgXG4gICAgICAgIC8vIGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCBFcnJvcjogU1FMSVRFX0VSUk9SOiBuZWFyIFwicXVvdGVkXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgY29kZSBiZWxvdyBwcm9kdWNlczpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiICdTb21ldGhpbmcgXCJxdWl0ZWRcIidcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiwgJ1NvbWV0aGluZyBcInF1aXRlZFwiJyBdICAoICdUZWFzZXInJ3MnLCdTb21ldGhpbmcgXCJxdWl0ZWRcIicgKSBcbiAgICAgICAgLy8gWyB7IHZwYXRoOiAndGVhc2VyLWNvbnRlbnQuaHRtbC5tZCcgfSBdXG4gICAgICAgIC8vIFsgJ3RlYXNlci1jb250ZW50Lmh0bWwubWQnIF1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZG9jdW1lbnRzV2l0aFRhZyAke3V0aWwuaW5zcGVjdCh0YWdzKX0gJHt0YWdzdHJpbmd9YCk7XG5cbiAgICAgICAgY29uc3QgdnBhdGhzID0gYXdhaXQgdGdsdWUucGF0aHNGb3JUYWcodGFncyk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb25zb2xlLmxvZyh2cGF0aHMpO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2cGF0aHMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50c1dpdGhUYWcgbm9uLUFycmF5IHJlc3VsdCAke3V0aWwuaW5zcGVjdCh2cGF0aHMpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZwYXRocztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gYXJyYXkgb2YgdGFncyB1c2VkIGJ5IGFsbCBkb2N1bWVudHMuXG4gICAgICogVGhpcyB1c2VzIHRoZSBKU09OIGV4dGVuc2lvbiB0byBleHRyYWN0XG4gICAgICogdGhlIHRhZ3MgZnJvbSB0aGUgbWV0YWRhdGEgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgdGFncygpIHtcbiAgICAgICAgY29uc3QgdGFncyA9IGF3YWl0IHRnbHVlLnRhZ3MoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHJldCA9IEFycmF5LmZyb20odGFncyk7XG4gICAgICAgIHJldHVybiByZXQuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHZhciB0YWdBID0gYS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIHRhZ0IgPSBiLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAodGFnQSA8IHRhZ0IpIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmICh0YWdBID4gdGFnQikgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIGRhdGEgZm9yIGFuIGludGVybmFsIGxpbmtcbiAgICAgKiB3aXRoaW4gdGhlIHNpdGUgZG9jdW1lbnRzLiAgRm9ybWluZyBhblxuICAgICAqIGludGVybmFsIGxpbmsgaXMgYXQgYSBtaW5pbXVtIHRoZSByZW5kZXJlZFxuICAgICAqIHBhdGggZm9yIHRoZSBkb2N1bWVudCBhbmQgaXRzIHRpdGxlLlxuICAgICAqIFRoZSB0ZWFzZXIsIGlmIGF2YWlsYWJsZSwgY2FuIGJlIHVzZWQgaW5cbiAgICAgKiBhIHRvb2x0aXAuIFRoZSB0aHVtYm5haWwgaXMgYW4gaW1hZ2UgdGhhdFxuICAgICAqIGNvdWxkIGJlIGRpc3BsYXllZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBkb2NMaW5rRGF0YSh2cGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG5cbiAgICAgICAgLy8gVGhlIHZwYXRoIHJlZmVyZW5jZVxuICAgICAgICB2cGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgcGF0aCBpdCByZW5kZXJzIHRvXG4gICAgICAgIHJlbmRlclBhdGg6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIHRpdGxlIHN0cmluZyBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0aXRsZTogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGVhc2VyIHRleHQgZnJvbSB0aGF0IHBhZ2VcbiAgICAgICAgdGVhc2VyPzogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgaGVybyBpbWFnZSAodGh1bWJuYWlsKVxuICAgICAgICB0aHVtYm5haWw/OiBzdHJpbmc7XG4gICAgfT4ge1xuXG4gICAgICAgIGNvbnN0IGZvdW5kID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgICAgIFNFTEVDVCAqXG4gICAgICAgICAgICBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX1cbiAgICAgICAgICAgIFdIRVJFIFxuICAgICAgICAgICAgdnBhdGggPSAkdnBhdGggT1IgcmVuZGVyUGF0aCA9ICR2cGF0aFxuICAgICAgICBgLCB7XG4gICAgICAgICAgICAkdnBhdGg6IHZwYXRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZvdW5kKSkge1xuXG4gICAgICAgICAgICAvLyBjb25zdCBkb2NJbmZvID0gYXdhaXQgdGhpcy5maW5kKHZwYXRoKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm91bmRbMF0ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICB0aXRsZTogZm91bmRbMF0ubWV0YWRhdGEudGl0bGUsXG4gICAgICAgICAgICAgICAgdGVhc2VyOiBmb3VuZFswXS5tZXRhZGF0YS50ZWFzZXIsXG4gICAgICAgICAgICAgICAgLy8gdGh1bWJuYWlsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgdGl0bGU6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybSBkZXNjcmlwdGl2ZSBzZWFyY2ggb3BlcmF0aW9ucyB1c2luZyBkaXJlY3QgU1FMIHF1ZXJpZXNcbiAgICAgKiBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlIGFuZCBzY2FsYWJpbGl0eS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIFNlYXJjaCBvcHRpb25zIG9iamVjdFxuICAgICAqIEByZXR1cm5zIFByb21pc2U8QXJyYXk8RG9jdW1lbnQ+PlxuICAgICAqL1xuICAgIGFzeW5jIHNlYXJjaChvcHRpb25zKTogUHJvbWlzZTxBcnJheTxEb2N1bWVudD4+IHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IHNxbCwgcGFyYW1zIH0gPSB0aGlzLmJ1aWxkU2VhcmNoUXVlcnkob3B0aW9ucyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoICR7c3FsfWApO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChzcWwsIHBhcmFtcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENvbnZlcnQgcmF3IFNRTCByZXN1bHRzIHRvIERvY3VtZW50IG9iamVjdHNcbiAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHJlc3VsdHMubWFwKHJvdyA9PiB0aGlzLmN2dFJvd1RvT2JqKHJvdykpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBHYXRoZXIgYWRkaXRpb25hbCBpbmZvIGRhdGEgZm9yIGVhY2ggcmVzdWx0IEZJUlNUXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGNydWNpYWwgYmVjYXVzZSBmaWx0ZXJzIGFuZCBzb3J0IGZ1bmN0aW9ucyBtYXkgZGVwZW5kIG9uIHRoaXMgZGF0YVxuICAgICAgICAgICAgLy8gZm9yIChjb25zdCBpdGVtIG9mIGRvY3VtZW50cykge1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaXRlbSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFwcGx5IHBvc3QtU1FMIGZpbHRlcnMgdGhhdCBjYW4ndCBiZSBkb25lIGluIFNRTFxuICAgICAgICAgICAgbGV0IGZpbHRlcmVkUmVzdWx0cyA9IGRvY3VtZW50cztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRmlsdGVyIGJ5IHJlbmRlcmVycyAocmVxdWlyZXMgY29uZmlnIGxvb2t1cClcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbmRlcmVycyAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVyZXJzKSkge1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkUmVzdWx0cyA9IGZpbHRlcmVkUmVzdWx0cy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZW5kZXJlciA9IGZjYWNoZS5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpdGVtLnZwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZW5kZXJlcikgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgciBvZiBvcHRpb25zLnJlbmRlcmVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByID09PSAnc3RyaW5nJyAmJiByID09PSByZW5kZXJlci5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgciA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdXQVJOSU5HOiBNYXRjaGluZyByZW5kZXJlciBieSBvYmplY3QgY2xhc3MgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCcsIHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQXBwbHkgY3VzdG9tIGZpbHRlciBmdW5jdGlvblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZmlsdGVyZnVuYykge1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkUmVzdWx0cyA9IGZpbHRlcmVkUmVzdWx0cy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmZpbHRlcmZ1bmMoZmNhY2hlLmNvbmZpZywgb3B0aW9ucywgaXRlbSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFwcGx5IGN1c3RvbSBzb3J0IGZ1bmN0aW9uIChpZiBTUUwgc29ydGluZyB3YXNuJ3QgdXNlZClcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zb3J0RnVuYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkUmVzdWx0cyA9IGZpbHRlcmVkUmVzdWx0cy5zb3J0KG9wdGlvbnMuc29ydEZ1bmMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyZWRSZXN1bHRzO1xuICAgICAgICAgICAgXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50c0ZpbGVDYWNoZS5zZWFyY2ggZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCBTUUwgcXVlcnkgYW5kIHBhcmFtZXRlcnMgZm9yIHNlYXJjaCBvcHRpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBidWlsZFNlYXJjaFF1ZXJ5KG9wdGlvbnMpOiB7IHNxbDogc3RyaW5nLCBwYXJhbXM6IGFueSB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICAgICAgY29uc3Qgd2hlcmVDbGF1c2VzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBqb2luczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgbGV0IHBhcmFtQ291bnRlciA9IDA7XG4gICAgICAgIFxuICAgICAgICAvLyBIZWxwZXIgdG8gY3JlYXRlIHVuaXF1ZSBwYXJhbWV0ZXIgbmFtZXNcbiAgICAgICAgY29uc3QgYWRkUGFyYW0gPSAodmFsdWU6IGFueSk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgJHBhcmFtJHsrK3BhcmFtQ291bnRlcn1gO1xuICAgICAgICAgICAgcGFyYW1zW3BhcmFtTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbU5hbWU7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyBCYXNlIHF1ZXJ5XG4gICAgICAgIGxldCBzcWwgPSBgU0VMRUNUIERJU1RJTkNUIGQuKiBGUk9NICR7dGhpcy5kYW8udGFibGUucXVvdGVkTmFtZX0gZGA7XG4gICAgICAgIFxuICAgICAgICAvLyBNSU1FIHR5cGUgZmlsdGVyaW5nXG4gICAgICAgIGlmIChvcHRpb25zLm1pbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLm1pbWUgPSAke2FkZFBhcmFtKG9wdGlvbnMubWltZSl9YCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5taW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubWltZS5tYXAobWltZSA9PiBhZGRQYXJhbShtaW1lKSkuam9pbignLCAnKTtcbiAgICAgICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5taW1lIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFJlbmRlcnMgdG8gSFRNTCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlbmRlcnNUb0hUTUwgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQucmVuZGVyc1RvSFRNTCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJzVG9IVE1MID8gMSA6IDApfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBSb290IHBhdGggZmlsdGVyaW5nXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yb290UGF0aCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggTElLRSAke2FkZFBhcmFtKG9wdGlvbnMucm9vdFBhdGggKyAnJScpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBHbG9iIHBhdHRlcm4gbWF0Y2hpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2xvYiAmJiB0eXBlb2Ygb3B0aW9ucy5nbG9iID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEdsb2IgPSBvcHRpb25zLmdsb2IuaW5kZXhPZihcIidcIikgPj0gMCBcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMuZ2xvYi5yZXBsYWNlQWxsKFwiJ1wiLCBcIicnXCIpIFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5nbG9iO1xuICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQudnBhdGggR0xPQiAke2FkZFBhcmFtKGVzY2FwZWRHbG9iKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gUmVuZGVyIGdsb2IgcGF0dGVybiBtYXRjaGluZ1xuICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJnbG9iICYmIHR5cGVvZiBvcHRpb25zLnJlbmRlcmdsb2IgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25zdCBlc2NhcGVkR2xvYiA9IG9wdGlvbnMucmVuZGVyZ2xvYi5pbmRleE9mKFwiJ1wiKSA+PSAwIFxuICAgICAgICAgICAgICAgID8gb3B0aW9ucy5yZW5kZXJnbG9iLnJlcGxhY2VBbGwoXCInXCIsIFwiJydcIikgXG4gICAgICAgICAgICAgICAgOiBvcHRpb25zLnJlbmRlcmdsb2I7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5yZW5kZXJQYXRoIEdMT0IgJHthZGRQYXJhbShlc2NhcGVkR2xvYil9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEJsb2cgdGFnIGZpbHRlcmluZ1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuYmxvZ3RhZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmJsb2d0YWcgPSAke2FkZFBhcmFtKG9wdGlvbnMuYmxvZ3RhZyl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmJsb2d0YWdzKSkge1xuICAgICAgICAgICAgY29uc3QgcGxhY2Vob2xkZXJzID0gb3B0aW9ucy5ibG9ndGFncy5tYXAodGFnID0+IGFkZFBhcmFtKHRhZykpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgZC5ibG9ndGFnIElOICgke3BsYWNlaG9sZGVyc30pYCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMuYmxvZ3RhZ3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIGJsb2d0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZ3MpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBUYWcgZmlsdGVyaW5nIHVzaW5nIFRBR0dMVUUgdGFibGVcbiAgICAgICAgaWYgKG9wdGlvbnMudGFnICYmIHR5cGVvZiBvcHRpb25zLnRhZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGpvaW5zLnB1c2goYElOTkVSIEpPSU4gVEFHR0xVRSB0ZyBPTiBkLnZwYXRoID0gdGcuZG9jdnBhdGhgKTtcbiAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGB0Zy50YWdOYW1lID0gJHthZGRQYXJhbShvcHRpb25zLnRhZyl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIExheW91dCBmaWx0ZXJpbmdcbiAgICAgICAgaWYgKG9wdGlvbnMubGF5b3V0cykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5sYXlvdXRzKSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxheW91dHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCA9ICR7YWRkUGFyYW0ob3B0aW9ucy5sYXlvdXRzWzBdKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubGF5b3V0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG9wdGlvbnMubGF5b3V0cy5tYXAobGF5b3V0ID0+IGFkZFBhcmFtKGxheW91dCkpLmpvaW4oJywgJyk7XG4gICAgICAgICAgICAgICAgICAgIHdoZXJlQ2xhdXNlcy5wdXNoKGBkLmxheW91dCBJTiAoJHtwbGFjZWhvbGRlcnN9KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2hlcmVDbGF1c2VzLnB1c2goYGQubGF5b3V0ID0gJHthZGRQYXJhbShvcHRpb25zLmxheW91dHMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBQYXRoIHJlZ2V4IG1hdGNoaW5nXG4gICAgICAgIGNvbnN0IHJlZ2V4Q2xhdXNlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnBhdGhtYXRjaCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnBhdGhtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQudnBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5wYXRobWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnZwYXRoIHJlZ2V4cCAke2FkZFBhcmFtKG1hdGNoLnNvdXJjZSl9YCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBwYXRobWF0Y2ggcmVnZXhwICR7dXRpbC5pbnNwZWN0KG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoJ3BhdGhtYXRjaCcgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBwYXRobWF0Y2ggJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5wYXRobWF0Y2gpfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBSZW5kZXIgcGF0aCByZWdleCBtYXRjaGluZ1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0ob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlKX1gKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Q2xhdXNlcy5wdXNoKGBkLnJlbmRlclBhdGggcmVnZXhwICR7YWRkUGFyYW0obWF0Y2gpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhDbGF1c2VzLnB1c2goYGQucmVuZGVyUGF0aCByZWdleHAgJHthZGRQYXJhbShtYXRjaC5zb3VyY2UpfWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdyZW5kZXJwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHJlZ2V4Q2xhdXNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB3aGVyZUNsYXVzZXMucHVzaChgKCR7cmVnZXhDbGF1c2VzLmpvaW4oJyBPUiAnKX0pYCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBKT0lOcyB0byBxdWVyeVxuICAgICAgICBpZiAoam9pbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3FsICs9ICcgJyArIGpvaW5zLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQWRkIFdIRVJFIGNsYXVzZVxuICAgICAgICBpZiAod2hlcmVDbGF1c2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNxbCArPSAnIFdIRVJFICcgKyB3aGVyZUNsYXVzZXMuam9pbignIEFORCAnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQWRkIE9SREVSIEJZIGNsYXVzZVxuICAgICAgICBsZXQgb3JkZXJCeSA9ICcnO1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc29ydEJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gSGFuZGxlIHNwZWNpYWwgY2FzZXMgdGhhdCBuZWVkIEpTT04gZXh0cmFjdGlvbiBvciBjb21wbGV4IGxvZ2ljXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zb3J0QnkgPT09ICdwdWJsaWNhdGlvbkRhdGUnIHx8IG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25UaW1lJykge1xuICAgICAgICAgICAgICAgIC8vIFVzZSBDT0FMRVNDRSB0byBoYW5kbGUgbnVsbCBwdWJsaWNhdGlvbiBkYXRlc1xuICAgICAgICAgICAgICAgIG9yZGVyQnkgPSBgT1JERVIgQlkgQ09BTEVTQ0UoXG4gICAgICAgICAgICAgICAgICAgIGpzb25fZXh0cmFjdChkLm1ldGFkYXRhLCAnJC5wdWJsaWNhdGlvbkRhdGUnKSwgXG4gICAgICAgICAgICAgICAgICAgIGQubXRpbWVNc1xuICAgICAgICAgICAgICAgIClgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIG90aGVyIGZpZWxkcywgc29ydCBieSB0aGUgY29sdW1uIGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBhbGxvd3Mgc29ydGluZyBieSBhbnkgdmFsaWQgY29sdW1uIGluIHRoZSBET0NVTUVOVFMgdGFibGVcbiAgICAgICAgICAgICAgICBvcmRlckJ5ID0gYE9SREVSIEJZIGQuJHtvcHRpb25zLnNvcnRCeX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMucmV2ZXJzZSB8fCBvcHRpb25zLnNvcnRCeURlc2NlbmRpbmcpIHtcbiAgICAgICAgICAgIC8vIElmIHJldmVyc2Uvc29ydEJ5RGVzY2VuZGluZyBpcyBzcGVjaWZpZWQgd2l0aG91dCBzb3J0QnksIFxuICAgICAgICAgICAgLy8gdXNlIGEgZGVmYXVsdCBvcmRlcmluZyAoYnkgbW9kaWZpY2F0aW9uIHRpbWUpXG4gICAgICAgICAgICBvcmRlckJ5ID0gJ09SREVSIEJZIGQubXRpbWVNcyc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEhhbmRsZSBzb3J0IGRpcmVjdGlvblxuICAgICAgICBpZiAob3JkZXJCeSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZyB8fCBvcHRpb25zLnJldmVyc2UpIHtcbiAgICAgICAgICAgICAgICBvcmRlckJ5ICs9ICcgREVTQyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9yZGVyQnkgKz0gJyBBU0MnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3FsICs9ICcgJyArIG9yZGVyQnk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBMSU1JVCBhbmQgT0ZGU0VUXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5saW1pdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHNxbCArPSBgIExJTUlUICR7YWRkUGFyYW0ob3B0aW9ucy5saW1pdCl9YDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub2Zmc2V0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgc3FsICs9IGAgT0ZGU0VUICR7YWRkUGFyYW0ob3B0aW9ucy5vZmZzZXQpfWA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7IHNxbCwgcGFyYW1zIH07XG4gICAgfVxuXG4gICAgLy8gU2tpcCB0YWdzIGZvciBub3cuICBTaG91bGQgYmUgZWFzeS5cblxuICAgIC8vIEZvciB0YWdzIHN1cHBvcnQsIHRoaXMgY2FuIGJlIHVzZWZ1bFxuICAgIC8vICAtLSBodHRwczovL2FudG9uei5vcmcvanNvbi12aXJ0dWFsLWNvbHVtbnMvXG4gICAgLy8gSXQgc2hvd3MgaG93IHRvIGRvIGdlbmVyYXRlZCBjb2x1bW5zXG4gICAgLy8gZnJvbSBmaWVsZHMgaW4gSlNPTlxuXG4gICAgLy8gQnV0LCBob3cgdG8gZG8gZ2VuZXJhdGVkIGNvbHVtbnNcbiAgICAvLyB1c2luZyBTUUxJVEUzT1JNP1xuXG4gICAgLy8gaHR0cHM6Ly9hbnRvbnoub3JnL3NxbGVhbi1yZWdleHAvIC0tIFJlZ0V4cFxuICAgIC8vIGV4dGVuc2lvbiBmb3IgU1FMSVRFM1xuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FzZzAxNy9zcWxpdGUtcmVnZXggaW5jbHVkZXNcbiAgICAvLyBhIG5vZGUuanMgcGFja2FnZVxuICAgIC8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL3NxbGl0ZS1yZWdleFxufVxuXG5leHBvcnQgdmFyIGFzc2V0c0NhY2hlOiBBc3NldHNGaWxlQ2FjaGU8IEFzc2V0LCB0eXBlb2YgYXNzZXRzREFPPjtcbmV4cG9ydCB2YXIgcGFydGlhbHNDYWNoZTogVGVtcGxhdGVzRmlsZUNhY2hlPFBhcnRpYWwsIHR5cGVvZiBwYXJ0aWFsc0RBTz47XG5leHBvcnQgdmFyIGxheW91dHNDYWNoZTogVGVtcGxhdGVzRmlsZUNhY2hlPExheW91dCwgdHlwZW9mIGxheW91dHNEQU8+O1xuZXhwb3J0IHZhciBkb2N1bWVudHNDYWNoZTogRG9jdW1lbnRzRmlsZUNhY2hlO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uXG4pOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgIGFzc2V0c0NhY2hlID0gbmV3IEFzc2V0c0ZpbGVDYWNoZTxBc3NldCwgVGFzc2V0c0RBTz4oXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2Fzc2V0cycsXG4gICAgICAgIGNvbmZpZy5hc3NldERpcnMsXG4gICAgICAgIGFzc2V0c0RBT1xuICAgICk7XG4gICAgYXdhaXQgYXNzZXRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIGFzc2V0c0NhY2hlLm9uKCdlcnJvcicsICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICBwYXJ0aWFsc0NhY2hlID0gbmV3IFRlbXBsYXRlc0ZpbGVDYWNoZTxcbiAgICAgICAgICAgIFBhcnRpYWwsIFRwYXJ0aWFsc0RBT1xuICAgID4oXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ3BhcnRpYWxzJyxcbiAgICAgICAgY29uZmlnLnBhcnRpYWxzRGlycyxcbiAgICAgICAgcGFydGlhbHNEQU8sXG4gICAgICAgIFwicGFydGlhbFwiXG4gICAgKTtcbiAgICBhd2FpdCBwYXJ0aWFsc0NhY2hlLnNldHVwKCk7XG5cbiAgICBwYXJ0aWFsc0NhY2hlLm9uKCdlcnJvcicsICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYHBhcnRpYWxzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIGxheW91dHNDYWNoZSA9IG5ldyBUZW1wbGF0ZXNGaWxlQ2FjaGU8XG4gICAgICAgICAgICBMYXlvdXQsIFRsYXlvdXRzREFPXG4gICAgPihcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAnbGF5b3V0cycsXG4gICAgICAgIGNvbmZpZy5sYXlvdXREaXJzLFxuICAgICAgICBsYXlvdXRzREFPLFxuICAgICAgICBcImxheW91dFwiXG4gICAgKTtcbiAgICBhd2FpdCBsYXlvdXRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIGxheW91dHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGBEb2N1bWVudHNGaWxlQ2FjaGUgJ2RvY3VtZW50cycgJHt1dGlsLmluc3BlY3QoY29uZmlnLmRvY3VtZW50RGlycyl9YCk7XG5cbiAgICBkb2N1bWVudHNDYWNoZSA9IG5ldyBEb2N1bWVudHNGaWxlQ2FjaGUoXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2RvY3VtZW50cycsXG4gICAgICAgIGNvbmZpZy5kb2N1bWVudERpcnNcbiAgICApO1xuICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLnNldHVwKCk7XG5cbiAgICBkb2N1bWVudHNDYWNoZS5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3VtZW50c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGVycil9YCk7XG4gICAgfSk7XG5cbiAgICBhd2FpdCBjb25maWcuaG9va1BsdWdpbkNhY2hlU2V0dXAoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsb3NlRmlsZUNhY2hlcygpIHtcbiAgICBpZiAoZG9jdW1lbnRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgZG9jdW1lbnRzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgZG9jdW1lbnRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChhc3NldHNDYWNoZSkge1xuICAgICAgICBhd2FpdCBhc3NldHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBhc3NldHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGxheW91dHNDYWNoZSkge1xuICAgICAgICBhd2FpdCBsYXlvdXRzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgbGF5b3V0c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAocGFydGlhbHNDYWNoZSkge1xuICAgICAgICBhd2FpdCBwYXJ0aWFsc0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIHBhcnRpYWxzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxufVxuIl19