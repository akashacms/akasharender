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
var _BaseFileCache_instances, _BaseFileCache_config, _BaseFileCache_name, _BaseFileCache_dirs, _BaseFileCache_is_ready, _BaseFileCache_cache_content, _BaseFileCache_map_renderpath, _BaseFileCache_dao, _BaseFileCache_watcher, _BaseFileCache_queue, _BaseFileCache_fExistsInDir;
import { DirsWatcher } from '@akashacms/stacked-dirs';
import path from 'node:path';
import util from 'node:util';
import FS from 'fs';
import EventEmitter from 'events';
import micromatch from 'micromatch';
import { field, id, index, table, schema, BaseDAO } from 'sqlite3orm';
import { sqdb } from '../sqdb.js';
import fastq from 'fastq';
import { TagGlue } from './tag-glue.js';
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
        });
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
        await __classPrivateFieldGet(this, _BaseFileCache_dao, "f").deleteAll({
            vpath: { eq: info.vpath },
            mounted: { eq: info.mounted }
        });
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
        const selector = {
            order: { mtimeMs: true }
        };
        if (typeof rootP === 'string'
            && rootP.length >= 1) {
            selector.renderPath = {
                isLike: `${rootP}%`
                // sql: ` renderPath regexp '^${rootP}' `
            };
        }
        // console.log(`paths ${util.inspect(selector)}`);
        const result = await this.dao.selectAll(selector);
        const result2 = result.filter(item => {
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
                { vpath: { eq: fpath } },
                { renderPath: { eq: fpath } }
            ]
        });
        // console.log(`find ${_fpath} ${fpath} ==> result1 ${util.inspect(result1)} `);
        const result2 = result1.filter(item => {
            return !(fcache.ignoreFile(item));
        });
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
    async findAll() {
        const fcache = this;
        const result1 = await this.dao.selectAll({});
        const result2 = result1.filter(item => {
            // console.log(`findAll ?ignore? ${item.vpath}`);
            return !(fcache.ignoreFile(item));
        });
        return result2;
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
export class TemplatesFileCache extends BaseFileCache {
    constructor(config, name, dirs, dao) {
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
export class DocumentsFileCache extends BaseFileCache {
    constructor(config, name, dirs) {
        super(config, name, dirs, documentsDAO);
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
    async documentsWithTags() {
        const docs = new Array();
        await this.dao.selectEach((err, doc) => {
            if (doc
                && doc.docMetadata
                && doc.docMetadata.tags
                && Array.isArray(doc.docMetadata.tags)
                && doc.docMetadata.tags.length >= 1) {
                docs.push(doc);
            }
        }, {
            rendersToHTML: { eq: true },
            info: { isNotNull: true }
        });
        // console.log(docs);
        return docs;
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
     * Perform descriptive search operations
     * with many options.  They are converted
     * into a selectAll statement.
     *
     * @param options
     * @returns
     */
    async search(options) {
        // console.log(`search `, options);
        const fcache = this;
        const vpathsSeen = new Set();
        const selector = {
            and: []
        };
        if (options.mime) {
            if (typeof options.mime === 'string') {
                selector.and.push({
                    mime: {
                        eq: options.mime
                    }
                });
            }
            else if (Array.isArray(options.mime)) {
                selector.and.push({
                    mime: {
                        isIn: options.mime
                    }
                });
            } /* else {
                throw new Error(`Incorrect MIME check ${options.mime}`);
            } */
        }
        if (typeof options.rendersToHTML === 'boolean') {
            selector.and.push({
                rendersToHTML: {
                    eq: options.rendersToHTML
                }
            });
        }
        if (typeof options?.rootPath === 'string') {
            selector.and.push({
                renderPath: {
                    isLike: `${options.rootPath}%`
                    // sql: ` renderPath like '${options.rootPath}%' `
                }
            });
        }
        // For glob and renderglob handle
        // strings with single-quote characters
        // as per discussion in documentsWithTag
        if (options.glob
            && typeof options.glob === 'string') {
            selector.and.push({
                sql: `T.vpath GLOB '${options.glob.indexOf("'") >= 0
                    ? options.glob.replaceAll("'", "''")
                    : options.glob}'`
            });
        }
        if (options.renderglob
            && typeof options.renderglob === 'string') {
            selector.and.push({
                sql: `T.renderPath GLOB '${options.renderglob.indexOf("'") >= 0
                    ? options.renderglob.replaceAll("'", "''")
                    : options.renderglob}'`
            });
        }
        const regexSQL = {
            or: []
        };
        // This is as a special favor to
        // @akashacms/plugins-blog-podcast.  The
        // blogtag metadata value is expensive to
        // search for as a field in the JSON
        // metadata.  By promoting this to a
        // regular field it becomes a regular
        // SQL query on a field where there
        // can be an index.
        if (typeof options.blogtags !== 'undefined'
            && typeof options.blogtags === 'string') {
            throw new Error(`search ERROR invalid blogtags array ${util.inspect(options.blogtags)}`);
        }
        if (typeof options.blogtags !== 'undefined'
            && Array.isArray(options.blogtags)) {
            selector.and.push({
                blogtag: {
                    isIn: options.blogtags
                }
            });
        }
        else if (typeof options.blogtag === 'string') {
            selector.and.push({
                blogtag: {
                    eq: options.blogtag
                }
            });
        }
        // This is possibly a way to implement options.tag.
        // The code is derived from the sqlite3orm documentation.
        // if (
        //     options.tag
        //     && typeof options.tag === 'string'
        // ) {
        //     selector.and.push({
        //         sql: `
        //     EXISTS (
        //         SELECT 1
        //         FROM TAGGLUE tg
        //         WHERE tg.tagName = ${options.tag}
        //     )
        //     `});
        // }
        if (typeof options.pathmatch === 'string') {
            regexSQL.or.push({
                sql: ` vpath regexp '${options.pathmatch}' `
            });
        }
        else if (options.pathmatch instanceof RegExp) {
            regexSQL.or.push({
                sql: ` vpath regexp '${options.pathmatch.source}' `
            });
        }
        else if (Array.isArray(options.pathmatch)) {
            for (const match of options.pathmatch) {
                if (typeof match === 'string') {
                    regexSQL.or.push({
                        sql: ` vpath regexp '${match}' `
                    });
                }
                else if (match instanceof RegExp) {
                    regexSQL.or.push({
                        sql: ` vpath regexp '${match.source}' `
                    });
                }
                else {
                    throw new Error(`search ERROR invalid pathmatch regexp ${util.inspect(match)}`);
                }
            }
        }
        else if ('pathmatch' in options) {
            // There's a pathmatch field, that
            // isn't correct
            throw new Error(`search ERROR invalid pathmatch ${util.inspect(options.pathmatch)}`);
        }
        if (options.layouts) {
            if (Array.isArray(options.layouts)
                && options.layouts.length >= 2) {
                for (const layout of options.layouts) {
                    regexSQL.or.push({
                        layout: { eq: layout }
                    });
                }
            }
            else if (Array.isArray(options.layout)
                && options.layouts.length === 1) {
                selector.and.push({
                    layout: {
                        eq: options.layouts[0]
                    }
                });
            }
            else {
                selector.and.push({
                    layout: {
                        eq: options.layouts
                    }
                });
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
        if (typeof options.renderpathmatch === 'string') {
            regexSQL.or.push({
                sql: ` renderPath regexp '${options.renderpathmatch}' `
            });
        }
        else if (options.renderpathmatch instanceof RegExp) {
            regexSQL.or.push({
                sql: ` renderPath regexp '${options.renderpathmatch.source}' `
            });
        }
        else if (Array.isArray(options.renderpathmatch)) {
            for (const match of options.renderpathmatch) {
                if (typeof match === 'string') {
                    regexSQL.or.push({
                        sql: ` renderPath regexp '${match}' `
                    });
                }
                else if (match instanceof RegExp) {
                    regexSQL.or.push({
                        sql: ` renderPath regexp '${match.source}' `
                    });
                }
                else {
                    throw new Error(`search ERROR invalid renderpathmatch regexp ${util.inspect(match)}`);
                }
            }
        }
        else if ('renderpathmatch' in options) {
            throw new Error(`search ERROR invalid renderpathmatch ${util.inspect(options.pathmatch)}`);
        }
        if (regexSQL.or.length >= 1) {
            selector.and.push({ or: regexSQL.or });
        }
        if (Array.isArray(selector.and)
            && selector.and.length <= 0) {
            delete selector.and;
        }
        console.log(util.inspect(selector.and, false, 10));
        // Select based on things we can query
        // directly from  the Document object.
        let result1;
        try {
            result1 = await this.dao.selectAll(selector);
        }
        catch (err) {
            throw new Error(`DocumentsFileCache.search caught error in selectAll with selector ${util.inspect(selector, false, 10)} - ${err.message}`);
        }
        console.log(result1.length);
        // If the search options include layout(s)
        // we check docMetadata.layout
        // NOW MOVED ABOVE
        const result2 = result1;
        // TODO - rewrite against tags column
        //   and the tagglue table
        //   HENCE this should be movable to SQL
        // Check for match against tags
        const result3 = 
        // First - No existing code uses this feature.
        // Second - Tags have been redesigned.  Until now,
        //    "item.tags" and "item.docMetadata.tags" are
        //    arrays.  SQLITE doesn't have a field type for
        //    arrays, and therefore it's stored as JSON, which
        //    is slow for comparisons.
        // Third - the new design, TAGGLUE, will have one row
        //    for each tag in each document.  Hence it's
        //    trivial to find all documents with a given tag
        //    using SQL.
        // Fourth - The test suite includes tests for
        //    this feature.
        // Fifth - there is a possible SQL implementation
        //    earlier in the code.
        (options.tag
            && typeof options.tag === 'string') ? result2.filter(item => {
            if (item.vpath
                && item.docMetadata
                && item.docMetadata.tags
                && Array.isArray(item.docMetadata.tags)) {
                if (item.docMetadata.tags.includes(options.tag)) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        })
            : result2;
        const result4 = result3;
        // (
        //     options.rootPath
        //  && typeof options.rootPath === 'string'
        // ) ? result3.filter(item => {
        //     if (item.vpath
        //      && item.renderPath
        //     ) {
        //         // console.log(`search ${item.vpath} ${item.renderPath} ${options.rootPath}`);
        //         if (item.renderPath.startsWith(options.rootPath)) {
        //             return true;
        //         } else {
        //             return false;
        //         }
        //     } else {
        //         return false;
        //     }
        // })
        // : result3;
        const result5 = result4;
        // This is now SQL
        // (
        //     options.glob
        //  && typeof options.glob === 'string'
        // ) ? result4.filter(item => {
        //     if (item.vpath) {
        //         return micromatch.isMatch(item.vpath, options.glob);
        //     } else {
        //         return false;
        //     }
        // })
        // : result4;
        const result6 = result5;
        // This is now SQL
        // (
        //     options.renderglob
        // && typeof options.renderglob === 'string'
        // ) ? result5.filter(item => {
        //     if (item.renderPath) {
        //         return micromatch.isMatch(item.renderPath, options.renderglob);
        //     } else {
        //         return false;
        //     }
        // })
        // : result5;
        const result7 = (options.renderers
            && Array.isArray(options.renderers)) ? result6.filter(item => {
            let renderer = fcache.config.findRendererPath(item.vpath);
            // console.log(`renderer for ${obj.vpath} `, renderer);
            if (!renderer)
                return false;
            let found = false;
            for (const r of options.renderers) {
                // console.log(`check renderer ${typeof r} ${renderer.name} ${renderer instanceof r}`);
                if (typeof r === 'string'
                    && r === renderer.name) {
                    found = true;
                }
                else if (typeof r === 'object'
                    || typeof r === 'function') {
                    console.error('WARNING: Matching renderer by object class is no longer supported', r);
                }
            }
            return found;
        })
            : result6;
        const result8 = (options.filterfunc)
            ? result7.filter(item => {
                return options.filterfunc(fcache.config, options, item);
            })
            : result7;
        let result9 = result8;
        if (typeof options.sortBy === 'string'
            && (options.sortBy === 'publicationDate'
                || options.sortBy === 'publicationTime')) {
            result9 = result8.sort((a, b) => {
                let aDate = a.metadata
                    && a.metadata.publicationDate
                    ? new Date(a.metadata.publicationDate)
                    : new Date(a.mtimeMs);
                let bDate = b.metadata
                    && b.metadata.publicationDate
                    ? new Date(b.metadata.publicationDate)
                    : new Date(b.mtimeMs);
                if (aDate === bDate)
                    return 0;
                if (aDate > bDate)
                    return -1;
                if (aDate < bDate)
                    return 1;
            });
        }
        else if (typeof options.sortBy === 'string'
            && options.sortBy === 'dirname') {
            result9 = result8.sort((a, b) => {
                if (a.dirname === b.dirname)
                    return 0;
                if (a.dirname < b.dirname)
                    return -1;
                if (a.dirname > b.dirname)
                    return 1;
            });
        }
        let result9a = result9;
        if (typeof options.sortFunc === 'function') {
            result9a = result9.sort(options.sortFunc);
        }
        let result10 = result9a;
        if (typeof options.sortByDescending === 'boolean'
            || typeof options.reverse === 'boolean') {
            if (typeof options.sortByDescending === 'boolean'
                && options.sortByDescending) {
                result10 = result9a.reverse();
            }
            if (typeof options.reverse === 'boolean'
                && options.reverse) {
                result10 = result9a.reverse();
            }
        }
        let result11 = result10;
        if (typeof options.offset === 'number') {
            result11 = result10.slice(options.offset);
        }
        let result12 = result11;
        if (typeof options.limit === 'number') {
            result12 = result11.slice(0, options.limit - 1);
        }
        return result12;
    }
}
export var assetsCache;
export var partialsCache;
export var layoutsCache;
export var documentsCache;
export async function setup(config) {
    assetsCache = new BaseFileCache(config, 'assets', config.assetDirs, assetsDAO);
    await assetsCache.setup();
    assetsCache.on('error', (...args) => {
        console.error(`assetsCache ERROR ${util.inspect(args)}`);
    });
    partialsCache = new TemplatesFileCache(config, 'partials', config.partialsDirs, partialsDAO);
    await partialsCache.setup();
    partialsCache.on('error', (...args) => {
        console.error(`partialsCache ERROR ${util.inspect(args)}`);
    });
    layoutsCache = new TemplatesFileCache(config, 'layouts', config.layoutDirs, layoutsDAO);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1jYWNoZS1zcWxpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvZmlsZS1jYWNoZS1zcWxpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxFQUFFLFdBQVcsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUM3RSxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBRzdCLE9BQU8sRUFBRSxNQUFNLElBQUksQ0FBQztBQUNwQixPQUFPLFlBQVksTUFBTSxRQUFRLENBQUM7QUFDbEMsT0FBTyxVQUFVLE1BQU0sWUFBWSxDQUFDO0FBRXBDLE9BQU8sRUFDSCxLQUFLLEVBR0wsRUFBRSxFQUNGLEtBQUssRUFDTCxLQUFLLEVBR0wsTUFBTSxFQUNOLE9BQU8sRUFHVixNQUFNLFlBQVksQ0FBQztBQUVwQixPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRWxDLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXhDLDBCQUEwQjtBQU1uQixJQUFNLEtBQUssR0FBWCxNQUFNLEtBQUs7Q0F1RGpCLENBQUE7QUFoREc7SUFKQyxFQUFFLENBQUM7UUFDQSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNO0tBQ2hDLENBQUM7SUFDRCxLQUFLLENBQUMsYUFBYSxDQUFDOztvQ0FDUDtBQUtkO0lBSEMsS0FBSyxDQUFDO1FBQ0gsSUFBSSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTTtLQUMvQixDQUFDOzttQ0FDVztBQU1iO0lBSkMsS0FBSyxDQUFDO1FBQ0gsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTTtLQUNsQyxDQUFDO0lBQ0QsS0FB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QixDQUFDO0lBQ0QsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNkLE1BQU0sV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFCLFdBQVcsR0FBRyxTQUFTLENBQUM7SUFDNUIsQ0FBQztJQUNELElBQUksWUFBWSxFQUFFLENBQUM7UUFDZixNQUFNLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMzQixZQUFZLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUM7SUFDRCxJQUFJLGFBQWEsRUFBRSxDQUFDO1FBQ2hCLE1BQU0sYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVCLGFBQWEsR0FBRyxTQUFTLENBQUM7SUFDOUIsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgRGlyc1dhdGNoZXIsIGRpclRvV2F0Y2gsIFZQYXRoRGF0YSB9IGZyb20gJ0Bha2FzaGFjbXMvc3RhY2tlZC1kaXJzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHVybCAgZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcyc7XG5pbXBvcnQgRlMgZnJvbSAnZnMnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaW1wb3J0IG1pY3JvbWF0Y2ggZnJvbSAnbWljcm9tYXRjaCc7XG5cbmltcG9ydCB7XG4gICAgZmllbGQsXG4gICAgRmllbGRPcHRzLFxuICAgIGZrLFxuICAgIGlkLFxuICAgIGluZGV4LFxuICAgIHRhYmxlLFxuICAgIFRhYmxlT3B0cyxcbiAgICBTcWxEYXRhYmFzZSxcbiAgICBzY2hlbWEsXG4gICAgQmFzZURBTyxcbiAgICBGaWx0ZXIsXG4gICAgV2hlcmVcbn0gZnJvbSAnc3FsaXRlM29ybSc7XG5cbmltcG9ydCB7IHNxZGIgfSBmcm9tICcuLi9zcWRiLmpzJztcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24sIGRpclRvTW91bnQgfSBmcm9tICcuLi9pbmRleC5qcyc7XG5pbXBvcnQgZmFzdHEgZnJvbSAnZmFzdHEnO1xuaW1wb3J0IHsgVGFnR2x1ZSB9IGZyb20gJy4vdGFnLWdsdWUuanMnO1xuXG4vLy8vLy8vLy8vLy8vIEFzc2V0cyB0YWJsZVxuXG5AdGFibGUoe1xuICAgIG5hbWU6ICdBU1NFVFMnLFxuICAgIHdpdGhvdXRSb3dJZDogdHJ1ZSxcbn0gYXMgVGFibGVPcHRzKVxuZXhwb3J0IGNsYXNzIEFzc2V0IHtcblxuICAgIC8vIFByaW1hcnkga2V5XG4gICAgQGlkKHtcbiAgICAgICAgbmFtZTogJ3ZwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfdnBhdGgnKVxuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBtaW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X21vdW50ZWQnKVxuICAgIG1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudFBvaW50JywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfbW91bnRQb2ludCcpXG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3BhdGhJbk1vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF9wYXRoSW5Nb3VudGVkJylcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfZnNwYXRoJylcbiAgICBmc3BhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdyZW5kZXJQYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfcmVuZGVyUGF0aCcpXG4gICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbiAgICB9KVxuICAgIG10aW1lTXM6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdpbmZvJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgaW5mbzogYW55O1xuXG59XG5cbmF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdBU1NFVFMnKTtcbnR5cGUgVGFzc2V0c0RBTyA9IEJhc2VEQU88QXNzZXQ+O1xuZXhwb3J0IGNvbnN0IGFzc2V0c0RBTzogVGFzc2V0c0RBT1xuICAgID0gbmV3IEJhc2VEQU88QXNzZXQ+KEFzc2V0LCBzcWRiKTtcblxuYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF92cGF0aCcpO1xuYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9tb3VudGVkJyk7XG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X21vdW50UG9pbnQnKTtcbmF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfcGF0aEluTW91bnRlZCcpO1xuYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9mc3BhdGgnKTtcbmF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfcmVuZGVyUGF0aCcpO1xuXG4vLy8vLy8vLy8vLy8gUGFydGlhbHMgVGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnUEFSVElBTFMnLFxuICAgIHdpdGhvdXRSb3dJZDogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgUGFydGlhbCB7XG5cbiAgICAvLyBQcmltYXJ5IGtleVxuICAgIEBpZCh7XG4gICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfdnBhdGgnKVxuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBtaW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfbW91bnRlZCcpXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50UG9pbnQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX21vdW50UG9pbnQnKVxuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9wYXRoSW5Nb3VudGVkJylcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9mc3BhdGgnKVxuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlclBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX3JlbmRlclBhdGgnKVxuICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtdGltZU1zJyxcbiAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4gICAgfSlcbiAgICBtdGltZU1zOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jTWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBkb2NNZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY0NvbnRlbnQnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBkb2NDb250ZW50OiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQm9keScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY0JvZHk6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIG1ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnaW5mbycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGluZm86IGFueTtcbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ1BBUlRJQUxTJyk7XG50eXBlIFRwYXJ0aWFsc0RBTyA9IEJhc2VEQU88UGFydGlhbD47XG5leHBvcnQgY29uc3QgcGFydGlhbHNEQU9cbiAgICA9IG5ldyBCYXNlREFPPFBhcnRpYWw+KFBhcnRpYWwsIHNxZGIpO1xuXG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF92cGF0aCcpO1xuYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfbW91bnRlZCcpO1xuYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfbW91bnRQb2ludCcpO1xuYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfcGF0aEluTW91bnRlZCcpO1xuYXdhaXQgcGFydGlhbHNEQU8uY3JlYXRlSW5kZXgoJ3BhcnRpYWxfZnNwYXRoJyk7XG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9yZW5kZXJQYXRoJyk7XG5cbi8vLy8vLy8vLy8vLy8vLy8vIExheW91dHMgVGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnTEFZT1VUUycsXG4gICAgd2l0aG91dFJvd0lkOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBMYXlvdXQge1xuXG4gICAgLy8gUHJpbWFyeSBrZXlcbiAgICBAaWQoe1xuICAgICAgICBuYW1lOiAndnBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfdnBhdGgnKVxuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBtaW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9tb3VudGVkJylcbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9tb3VudFBvaW50JylcbiAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9wYXRoSW5Nb3VudGVkJylcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnbGF5b3V0X2ZzcGF0aCcpXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9yZW5kZXJQYXRoJylcbiAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbXRpbWVNcycsXG4gICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuICAgIH0pXG4gICAgbXRpbWVNczogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY01ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jTWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NDb250ZW50JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jQ29udGVudDogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY0JvZHknLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBkb2NCb2R5OiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBtZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvOiBhbnk7XG5cbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0xBWU9VVFMnKTtcbnR5cGUgVGxheW91dHNEQU8gPSBCYXNlREFPPExheW91dD47XG5leHBvcnQgY29uc3QgbGF5b3V0c0RBT1xuICAgID0gbmV3IEJhc2VEQU88TGF5b3V0PihMYXlvdXQsIHNxZGIpO1xuXG5hd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfdnBhdGgnKTtcbmF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9tb3VudGVkJyk7XG5hd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfbW91bnRQb2ludCcpO1xuYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X3BhdGhJbk1vdW50ZWQnKTtcbmF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9mc3BhdGgnKTtcbmF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9yZW5kZXJQYXRoJyk7XG5cbi8vLy8vLy8vLy8vLy8vLyBEb2N1bWVudHMgVGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnRE9DVU1FTlRTJyxcbiAgICB3aXRob3V0Um93SWQ6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIERvY3VtZW50IHtcblxuICAgIC8vIFByaW1hcnkga2V5XG4gICAgQGlkKHtcbiAgICAgICAgbmFtZTogJ3ZwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc192cGF0aCcpXG4gICAgdnBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtaW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIG1pbWU6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19tb3VudGVkJylcbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfbW91bnRQb2ludCcpXG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3BhdGhJbk1vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX3BhdGhJbk1vdW50ZWQnKVxuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdmc3BhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX2ZzcGF0aCcpXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfcmVuZGVyUGF0aCcpXG4gICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlcnNUb0hUTUwnLCBkYnR5cGU6ICdJTlRFR0VSJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX3JlbmRlcnNUb0hUTUwnKVxuICAgIHJlbmRlcnNUb0hUTUw6IGJvb2xlYW47XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZGlybmFtZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfZGlybmFtZScpXG4gICAgZGlybmFtZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3BhcmVudERpcicsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfcGFyZW50RGlyJylcbiAgICBwYXJlbnREaXI6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtdGltZU1zJyxcbiAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4gICAgfSlcbiAgICBtdGltZU1zOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jTWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBkb2NNZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY0NvbnRlbnQnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiBmYWxzZVxuICAgIH0pXG4gICAgZG9jQ29udGVudDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY0JvZHknLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiBmYWxzZVxuICAgIH0pXG4gICAgZG9jQm9keTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgbWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICd0YWdzJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgdGFnczogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2xheW91dCcsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IGZhbHNlXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfbGF5b3V0JylcbiAgICBsYXlvdXQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdibG9ndGFnJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogZmFsc2VcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19ibG9ndGFnJylcbiAgICBibG9ndGFnOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnaW5mbycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGluZm86IGFueTtcblxufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnRE9DVU1FTlRTJyk7XG50eXBlIFRkb2N1bWVudHNzREFPID0gQmFzZURBTzxEb2N1bWVudD47XG5leHBvcnQgY29uc3QgZG9jdW1lbnRzREFPXG4gICAgPSBuZXcgQmFzZURBTzxEb2N1bWVudD4oRG9jdW1lbnQsIHNxZGIpO1xuXG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfdnBhdGgnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19tb3VudGVkJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfbW91bnRQb2ludCcpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3BhdGhJbk1vdW50ZWQnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19mc3BhdGgnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19yZW5kZXJQYXRoJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfcmVuZGVyc1RvSFRNTCcpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX2Rpcm5hbWUnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19wYXJlbnREaXInKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19ibG9ndGFnJyk7XG5cbmNvbnN0IHRnbHVlID0gbmV3IFRhZ0dsdWUoKTtcbnRnbHVlLmluaXQoc3FkYi5fZGIpO1xuXG4vLyBDb252ZXJ0IEFrYXNoYUNNUyBtb3VudCBwb2ludHMgaW50byB0aGUgbW91bnRwb2ludFxuLy8gdXNlZCBieSBEaXJzV2F0Y2hlclxuY29uc3QgcmVtYXBkaXJzID0gKGRpcno6IGRpclRvTW91bnRbXSk6IGRpclRvV2F0Y2hbXSA9PiB7XG4gICAgcmV0dXJuIGRpcnoubWFwKGRpciA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdkb2N1bWVudCBkaXIgJywgZGlyKTtcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpcixcbiAgICAgICAgICAgICAgICBtb3VudFBvaW50OiAnLycsXG4gICAgICAgICAgICAgICAgYmFzZU1ldGFkYXRhOiB7fVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghZGlyLmRlc3QpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlbWFwZGlycyBpbnZhbGlkIG1vdW50IHNwZWNpZmljYXRpb24gJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLnNyYyxcbiAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIuZGVzdCxcbiAgICAgICAgICAgICAgICBiYXNlTWV0YWRhdGE6IGRpci5iYXNlTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgaWdub3JlOiBkaXIuaWdub3JlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFR5cGUgZm9yIHJldHVybiBmcm9tIHBhdGhzIG1ldGhvZC4gIFRoZSBmaWVsZHMgaGVyZVxuICogYXJlIHdoYXRzIGluIHRoZSBBc3NldC9MYXlvdXQvUGFydGlhbCBjbGFzc2VzIGFib3ZlXG4gKiBwbHVzIGEgY291cGxlIGZpZWxkcyB0aGF0IG9sZGVyIGNvZGUgZXhwZWN0ZWRcbiAqIGZyb20gdGhlIHBhdGhzIG1ldGhvZC5cbiAqL1xuZXhwb3J0IHR5cGUgUGF0aHNSZXR1cm5UeXBlID0ge1xuICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgbWltZTogc3RyaW5nLFxuICAgIG1vdW50ZWQ6IHN0cmluZyxcbiAgICBtb3VudFBvaW50OiBzdHJpbmcsXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nLFxuICAgIG10aW1lTXM6IHN0cmluZyxcbiAgICBpbmZvOiBhbnksXG4gICAgLy8gVGhlc2Ugd2lsbCBiZSBjb21wdXRlZCBpbiBCYXNlRmlsZUNhY2hlXG4gICAgLy8gVGhleSB3ZXJlIHJldHVybmVkIGluIHByZXZpb3VzIHZlcnNpb25zLlxuICAgIGZzcGF0aDogc3RyaW5nLFxuICAgIHJlbmRlclBhdGg6IHN0cmluZ1xufTtcblxuZXhwb3J0IGNsYXNzIEJhc2VGaWxlQ2FjaGU8XG4gICAgICAgIFQgZXh0ZW5kcyBBc3NldCB8IExheW91dCB8IFBhcnRpYWwgfCBEb2N1bWVudCxcbiAgICAgICAgVGRhbyBleHRlbmRzIEJhc2VEQU88VD5cbj4gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgI2NvbmZpZz86IENvbmZpZ3VyYXRpb247XG4gICAgI25hbWU/OiBzdHJpbmc7XG4gICAgI2RpcnM/OiBkaXJUb01vdW50W107XG4gICAgI2lzX3JlYWR5OiBib29sZWFuID0gZmFsc2U7XG4gICAgI2NhY2hlX2NvbnRlbnQ6IGJvb2xlYW47XG4gICAgI21hcF9yZW5kZXJwYXRoOiBib29sZWFuO1xuICAgICNkYW86IFRkYW87IC8vIEJhc2VEQU88VD47XG5cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAgICogQHBhcmFtIGRpcnMgYXJyYXkgb2YgZGlyZWN0b3JpZXMgYW5kIG1vdW50IHBvaW50cyB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBuYW1lIHN0cmluZyBnaXZpbmcgdGhlIG5hbWUgZm9yIHRoaXMgd2F0Y2hlciBuYW1lXG4gICAgICogQHBhcmFtIGRhbyBUaGUgU1FMSVRFM09STSBEQU8gaW5zdGFuY2UgdG8gdXNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb01vdW50W10sXG4gICAgICAgIGRhbzogVGRhbyAvLyBCYXNlREFPPFQ+XG4gICAgKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBCYXNlRmlsZUNhY2hlICR7bmFtZX0gY29uc3RydWN0b3IgZGlycz0ke3V0aWwuaW5zcGVjdChkaXJzKX1gKTtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLiNuYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy4jZGlycyA9IGRpcnM7XG4gICAgICAgIHRoaXMuI2lzX3JlYWR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuI2NhY2hlX2NvbnRlbnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jbWFwX3JlbmRlcnBhdGggPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jZGFvID0gZGFvO1xuICAgIH1cblxuICAgIGdldCBjb25maWcoKSAgICAgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgZ2V0IG5hbWUoKSAgICAgICB7IHJldHVybiB0aGlzLiNuYW1lOyB9XG4gICAgZ2V0IGRpcnMoKSAgICAgICB7IHJldHVybiB0aGlzLiNkaXJzOyB9XG4gICAgc2V0IGNhY2hlQ29udGVudChkb2l0KSB7IHRoaXMuI2NhY2hlX2NvbnRlbnQgPSBkb2l0OyB9XG4gICAgZ2V0IGdhY2hlQ29udGVudCgpIHsgcmV0dXJuIHRoaXMuI2NhY2hlX2NvbnRlbnQ7IH1cbiAgICBzZXQgbWFwUmVuZGVyUGF0aChkb2l0KSB7IHRoaXMuI21hcF9yZW5kZXJwYXRoID0gZG9pdDsgfVxuICAgIGdldCBtYXBSZW5kZXJQYXRoKCkgeyByZXR1cm4gdGhpcy4jbWFwX3JlbmRlcnBhdGg7IH1cbiAgICBnZXQgZGFvKCk6IFRkYW8geyByZXR1cm4gdGhpcy4jZGFvOyB9XG5cbiAgICAvLyBTS0lQOiBnZXREeW5hbWljVmlld1xuXG5cbiAgICAjd2F0Y2hlcjogRGlyc1dhdGNoZXI7XG4gICAgI3F1ZXVlO1xuXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLiNxdWV1ZSkge1xuICAgICAgICAgICAgdGhpcy4jcXVldWUua2lsbEFuZERyYWluKCk7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4jd2F0Y2hlcikge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENMT1NJTkcgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiN3YXRjaGVyLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLiN3YXRjaGVyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdjaGFuZ2VkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdhZGRlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygndW5saW5rZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlYWR5Jyk7XG5cbiAgICAgICAgYXdhaXQgc3FkYi5jbG9zZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB1cCByZWNlaXZpbmcgZXZlbnRzIGZyb20gRGlyc1dhdGNoZXIsIGFuZCBkaXNwYXRjaGluZyB0b1xuICAgICAqIHRoZSBoYW5kbGVyIG1ldGhvZHMuXG4gICAgICovXG4gICAgYXN5bmMgc2V0dXAoKSB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuI3dhdGNoZXIpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI3F1ZXVlID0gZmFzdHEucHJvbWlzZShhc3luYyBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5jb2RlID09PSAnY2hhbmdlZCcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hhbmdlICR7ZXZlbnQubmFtZX0gJHtldmVudC5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlQ2hhbmdlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2NoYW5nZScsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ2FkZGVkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGQgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVBZGRlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2FkZCcsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ3VubGlua2VkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGB1bmxpbmsgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVVbmxpbmtlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ3VubGluaycsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVFcnJvcihldmVudC5uYW1lKSAqL1xuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAncmVhZHknKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZVJlYWR5KGV2ZW50Lm5hbWUpO1xuICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdyZWFkeScsIGV2ZW50Lm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMCk7XG5cbiAgICAgICAgdGhpcy4jd2F0Y2hlciA9IG5ldyBEaXJzV2F0Y2hlcih0aGlzLm5hbWUpO1xuXG4gICAgICAgIHRoaXMuI3dhdGNoZXIub24oJ2NoYW5nZScsIGFzeW5jIChuYW1lOiBzdHJpbmcsIGluZm86IFZQYXRoRGF0YSkgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gY2hhbmdlZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFVTSCAke25hbWV9IGNoYW5nZWQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICdjaGFuZ2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ2NoYW5nZScgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIGNoYW5nZSAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignYWRkJywgYXN5bmMgKG5hbWU6IHN0cmluZywgaW5mbzogVlBhdGhEYXRhKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IGFkZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBQVVNIICR7bmFtZX0gYWRkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnYWRkZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAnYWRkJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgYWRkICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCd1bmxpbmsnLCBhc3luYyAobmFtZTogc3RyaW5nLCBpbmZvOiBWUGF0aERhdGEpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGB1bmxpbmsgJHtuYW1lfSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ3VubGlua2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ3VubGluaycgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCB1bmxpbmsgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ3JlYWR5JywgYXN5bmMgKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gcmVhZHlgKTtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvZGU6ICdyZWFkeScsXG4gICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2V0dXAgJHt0aGlzLiNuYW1lfSB3YXRjaCAke3V0aWwuaW5zcGVjdCh0aGlzLiNkaXJzKX0gPT0+ICR7dXRpbC5pbnNwZWN0KG1hcHBlZCl9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIud2F0Y2gobWFwcGVkKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgREFPICR7dGhpcy5kYW8udGFibGUubmFtZX0gJHt1dGlsLmluc3BlY3QodGhpcy5kYW8udGFibGUuZmllbGRzKX1gKTtcblxuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm86IFQpIHtcbiAgICAgICAgLy8gUGxhY2Vob2xkZXIgd2hpY2ggc29tZSBzdWJjbGFzc2VzXG4gICAgICAgIC8vIGFyZSBleHBlY3RlZCB0byBvdmVycmlkZVxuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFuZGxlQ2hhbmdlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlQ2hhbmdlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgT09PT09PT09HQSEhISBSZWNlaXZlZCBhIGZpbGUgdGhhdCBzaG91bGQgYmUgaW5nb3JlZCBgLCBpbmZvKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZUNoYW5nZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGFuZGxlQ2hhbmdlZCAke2luZm8udnBhdGh9ICR7aW5mby5tZXRhZGF0YSAmJiBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA/IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlIDogJz8/Pyd9YCk7XG5cbiAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpbmZvKTtcbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAgICAgdnBhdGg6IHsgZXE6IGluZm8udnBhdGggfSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IHsgZXE6IGluZm8ubW91bnRlZCB9XG4gICAgICAgIH0gYXMgRmlsdGVyPFQ+KTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhQXJyYXkuaXNBcnJheShyZXN1bHQpXG4gICAgICAgICB8fCByZXN1bHQubGVuZ3RoIDw9IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBJdCB3YXNuJ3QgZm91bmQgaW4gdGhlIGRhdGFiYXNlLiAgSGVuY2VcbiAgICAgICAgICAgIC8vIHdlIHNob3VsZCBhZGQgaXQuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVBZGRlZChuYW1lLCBpbmZvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlRG9jSW5EQihpbmZvKTtcbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVDaGFuZ2VkKG5hbWUsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm8pIHtcbiAgICAgICAgYXdhaXQgdGhpcy4jZGFvLnVwZGF0ZSh7XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICAvLyBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICAvLyBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH0gYXMgVCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2UgcmVjZWl2ZSB0aGlzOlxuICAgICAqXG4gICAgICoge1xuICAgICAqICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAqICAgIHZwYXRoOiB2cGF0aCxcbiAgICAgKiAgICBtaW1lOiBtaW1lLmdldFR5cGUoZnNwYXRoKSxcbiAgICAgKiAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgKiAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgKiAgICBwYXRoSW5Nb3VudGVkOiBjb21wdXRlZCByZWxhdGl2ZSBwYXRoXG4gICAgICogICAgc3RhY2s6IFsgYXJyYXkgb2YgdGhlc2UgaW5zdGFuY2VzIF1cbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBOZWVkIHRvIGFkZDpcbiAgICAgKiAgICByZW5kZXJQYXRoXG4gICAgICogICAgQW5kIGZvciBIVE1MIHJlbmRlciBmaWxlcywgYWRkIHRoZSBiYXNlTWV0YWRhdGEgYW5kIGRvY01ldGFkYXRhXG4gICAgICpcbiAgICAgKiBTaG91bGQgcmVtb3ZlIHRoZSBzdGFjaywgc2luY2UgaXQncyBsaWtlbHkgbm90IHVzZWZ1bCB0byB1cy5cbiAgICAgKi9cblxuICAgIGFzeW5jIGhhbmRsZUFkZGVkKG5hbWUsIGluZm8pIHtcbiAgICAgICAgLy8gIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlQWRkZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09PT09PR0EhISEgUmVjZWl2ZWQgYSBmaWxlIHRoYXQgc2hvdWxkIGJlIGluZ29yZWQgYCwgaW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVBZGRlZCBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpbmZvKTtcbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnNlcnREb2NUb0RCKGluZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUFkZGVkKG5hbWUsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKGluZm8pIHtcbiAgICAgICAgYXdhaXQgdGhpcy4jZGFvLmluc2VydCh7XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICAvLyBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICAvLyBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH0gYXMgVCk7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFuZGxlVW5saW5rZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZVVubGlua2VkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlVW5saW5rZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmhvb2tGaWxlVW5saW5rZWQobmFtZSwgaW5mbyk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy4jZGFvLmRlbGV0ZUFsbCh7XG4gICAgICAgICAgICB2cGF0aDogeyBlcTogaW5mby52cGF0aCB9LFxuICAgICAgICAgICAgbW91bnRlZDogeyBlcTogaW5mby5tb3VudGVkIH1cbiAgICAgICAgfSBhcyBXaGVyZTxUPik7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFuZGxlUmVhZHkobmFtZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZVJlYWR5YCk7XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlUmVhZHkgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdCgncmVhZHknLCBuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBkaXJlY3RvcnkgbW91bnQgY29ycmVzcG9uZGluZyB0byB0aGUgZmlsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgZmlsZURpck1vdW50KGluZm8pIHtcbiAgICAgICAgY29uc3QgbWFwcGVkID0gcmVtYXBkaXJzKHRoaXMuZGlycyk7XG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIG1hcHBlZCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRpck1vdW50IGZvciAke2luZm8udnBhdGh9IC0tICR7dXRpbC5pbnNwZWN0KGluZm8pfSA9PT0gJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgICAgIGlmIChpbmZvLm1vdW50UG9pbnQgPT09IGRpci5tb3VudFBvaW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNob3VsZCB0aGlzIGZpbGUgYmUgaWdub3JlZCwgYmFzZWQgb24gdGhlIGBpZ25vcmVgIGZpZWxkXG4gICAgICogaW4gdGhlIG1hdGNoaW5nIGBkaXJgIG1vdW50IGVudHJ5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBpbmZvXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBpZ25vcmVGaWxlKGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICBjb25zdCBkaXJNb3VudCA9IHRoaXMuZmlsZURpck1vdW50KGluZm8pO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSAke2luZm8udnBhdGh9IGRpck1vdW50ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgbGV0IGlnbm9yZSA9IGZhbHNlO1xuICAgICAgICBpZiAoZGlyTW91bnQpIHtcblxuICAgICAgICAgICAgbGV0IGlnbm9yZXM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRpck1vdW50Lmlnbm9yZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gWyBkaXJNb3VudC5pZ25vcmUgXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkaXJNb3VudC5pZ25vcmUpKSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IGRpck1vdW50Lmlnbm9yZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBpIG9mIGlnbm9yZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAobWljcm9tYXRjaC5pc01hdGNoKGluZm8udnBhdGgsIGkpKSBpZ25vcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkaXJNb3VudC5pZ25vcmUgJHtmc3BhdGh9ICR7aX0gPT4gJHtpZ25vcmV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiAoaWdub3JlKSBjb25zb2xlLmxvZyhgTVVTVCBpZ25vcmUgRmlsZSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSBmb3IgJHtpbmZvLnZwYXRofSA9PT4gJHtpZ25vcmV9YCk7XG4gICAgICAgICAgICByZXR1cm4gaWdub3JlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gbm8gbW91bnQ/ICB0aGF0IG1lYW5zIHNvbWV0aGluZyBzdHJhbmdlXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBObyBkaXJNb3VudCBmb3VuZCBmb3IgJHtpbmZvLnZwYXRofSAvICR7aW5mby5kaXJNb3VudGVkT259YCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFsbG93IGEgY2FsbGVyIHRvIHdhaXQgdW50aWwgdGhlIDxlbT5yZWFkeTwvZW0+IGV2ZW50IGhhc1xuICAgICAqIGJlZW4gc2VudCBmcm9tIHRoZSBEaXJzV2F0Y2hlciBpbnN0YW5jZS4gIFRoaXMgZXZlbnQgbWVhbnMgdGhlXG4gICAgICogaW5pdGlhbCBpbmRleGluZyBoYXMgaGFwcGVuZWQuXG4gICAgICovXG4gICAgYXN5bmMgaXNSZWFkeSgpIHtcbiAgICAgICAgLy8gSWYgdGhlcmUncyBubyBkaXJlY3RvcmllcywgdGhlcmUgd29uJ3QgYmUgYW55IGZpbGVzIFxuICAgICAgICAvLyB0byBsb2FkLCBhbmQgbm8gbmVlZCB0byB3YWl0XG4gICAgICAgIHdoaWxlICh0aGlzLiNkaXJzLmxlbmd0aCA+IDAgJiYgIXRoaXMuI2lzX3JlYWR5KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGRvZXMgYSAxMDBtcyBwYXVzZVxuICAgICAgICAgICAgLy8gVGhhdCBsZXRzIHVzIGNoZWNrIGlzX3JlYWR5IGV2ZXJ5IDEwMG1zXG4gICAgICAgICAgICAvLyBhdCB2ZXJ5IGxpdHRsZSBjb3N0XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgIWlzUmVhZHkgJHt0aGlzLm5hbWV9ICR7dGhpc1tfc3ltYl9kaXJzXS5sZW5ndGh9ICR7dGhpc1tfc3ltYl9pc19yZWFkeV19YCk7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYXN5bmMgcGF0aHMocm9vdFBhdGg/OiBzdHJpbmcpXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxQYXRoc1JldHVyblR5cGU+PlxuICAgIHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuXG4gICAgICAgIGxldCByb290UCA9IHJvb3RQYXRoPy5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgID8gcm9vdFBhdGg/LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgOiByb290UGF0aDtcblxuICAgICAgICAvLyBUaGlzIGlzIGNvcGllZCBmcm9tIHRoZSBvbGRlciB2ZXJzaW9uXG4gICAgICAgIC8vIChMb2tpSlMgdmVyc2lvbikgb2YgdGhpcyBmdW5jdGlvbi4gIEl0XG4gICAgICAgIC8vIHNlZW1zIG1lYW50IHRvIGVsaW1pbmF0ZSBkdXBsaWNhdGVzLlxuICAgICAgICBjb25zdCB2cGF0aHNTZWVuID0gbmV3IFNldCgpO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdG9yID0ge1xuICAgICAgICAgICAgb3JkZXI6IHsgbXRpbWVNczogdHJ1ZSB9XG4gICAgICAgIH0gYXMgYW55O1xuICAgICAgICBpZiAodHlwZW9mIHJvb3RQID09PSAnc3RyaW5nJ1xuICAgICAgICAmJiByb290UC5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgc2VsZWN0b3IucmVuZGVyUGF0aCA9IHtcbiAgICAgICAgICAgICAgICBpc0xpa2U6IGAke3Jvb3RQfSVgXG4gICAgICAgICAgICAgICAgLy8gc3FsOiBgIHJlbmRlclBhdGggcmVnZXhwICdeJHtyb290UH0nIGBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhdGhzICR7dXRpbC5pbnNwZWN0KHNlbGVjdG9yKX1gKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHNlbGVjdG9yKTtcbiAgICAgICAgY29uc3QgcmVzdWx0MiA9IHJlc3VsdC5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGF0aHMgP2lnbm9yZT8gJHtpdGVtLnZwYXRofWApO1xuICAgICAgICAgICAgaWYgKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZwYXRoc1NlZW4uaGFzKChpdGVtIGFzIEFzc2V0KS52cGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZwYXRoc1NlZW4uYWRkKChpdGVtIGFzIEFzc2V0KS52cGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBjb25zdCByZXN1bHQzID0gcmVzdWx0Mi5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIC8vICAgICAvLyBXZSBuZWVkIHRoZXNlIHRvIGJlIG9uZSBvZiB0aGUgY29uY3JldGVcbiAgICAgICAgLy8gICAgIC8vIHR5cGVzIHNvIHRoYXQgdGhlIG10aW1lTXMgZmllbGQgaXNcbiAgICAgICAgLy8gICAgIC8vIHJlY29nbml6ZWQgYnkgVHlwZVNjcmlwdC4gIFRoZSBBc3NldFxuICAgICAgICAvLyAgICAgLy8gY2xhc3MgaXMgYSBnb29kIHN1YnN0aXR1dGUgZm9yIHRoZSBiYXNlXG4gICAgICAgIC8vICAgICAvLyBjbGFzcyBvZiBjYWNoZWQgZmlsZXMuXG4gICAgICAgIC8vICAgICBjb25zdCBhYSA9IDxBc3NldD5hO1xuICAgICAgICAvLyAgICAgY29uc3QgYmIgPSA8QXNzZXQ+YjtcbiAgICAgICAgLy8gICAgIGlmIChhYS5tdGltZU1zIDwgYmIubXRpbWVNcykgcmV0dXJuIDE7XG4gICAgICAgIC8vICAgICBpZiAoYWEubXRpbWVNcyA9PT0gYmIubXRpbWVNcykgcmV0dXJuIDA7XG4gICAgICAgIC8vICAgICBpZiAoYWEubXRpbWVNcyA+IGJiLm10aW1lTXMpIHJldHVybiAtMTtcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gVGhpcyBzdGFnZSBjb252ZXJ0cyB0aGUgaXRlbXMgXG4gICAgICAgIC8vIHJlY2VpdmVkIGJ5IHRoaXMgZnVuY3Rpb24gaW50b1xuICAgICAgICAvLyB3aGF0IGlzIHJlcXVpcmVkIGZyb21cbiAgICAgICAgLy8gdGhlIHBhdGhzIG1ldGhvZC5cbiAgICAgICAgLy8gY29uc3QgcmVzdWx0NFxuICAgICAgICAvLyAgICAgICAgID0gbmV3IEFycmF5PFBhdGhzUmV0dXJuVHlwZT4oKTtcbiAgICAgICAgLy8gZm9yIChjb25zdCBpdGVtIG9mIHJlc3VsdDMpIHtcbiAgICAgICAgLy8gICAgIHJlc3VsdDQucHVzaCg8UGF0aHNSZXR1cm5UeXBlPntcbiAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgLy8gICAgICAgICBtaW1lOiBpdGVtLm1pbWUsXG4gICAgICAgIC8vICAgICAgICAgbW91bnRlZDogaXRlbS5tb3VudGVkLFxuICAgICAgICAvLyAgICAgICAgIG1vdW50UG9pbnQ6IGl0ZW0ubW91bnRQb2ludCxcbiAgICAgICAgLy8gICAgICAgICBwYXRoSW5Nb3VudGVkOiBpdGVtLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgIC8vICAgICAgICAgbXRpbWVNczogaXRlbS5tdGltZU1zLFxuICAgICAgICAvLyAgICAgICAgIGluZm86IGl0ZW0uaW5mbyxcbiAgICAgICAgLy8gICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpdGVtLm1vdW50ZWQsIGl0ZW0ucGF0aEluTW91bnRlZCksXG4gICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS52cGF0aFxuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXN1bHQyLyoubWFwKGl0ZW0gPT4ge1xuICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgLy8gICAgICAgICBtdGltZU1zOiBpdGVtLm10aW1lTXNcbiAgICAgICAgLy8gICAgIH07XG4gICAgICAgIC8vIH0pICovKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0MjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBmaWxlIHdpdGhpbiB0aGUgY2FjaGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFRoZSB2cGF0aCBvciByZW5kZXJQYXRoIHRvIGxvb2sgZm9yXG4gICAgICogQHJldHVybnMgYm9vbGVhbiB0cnVlIGlmIGZvdW5kLCBmYWxzZSBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBhc3luYyBmaW5kKF9mcGF0aCk6IFByb21pc2U8VD4ge1xuXG4gICAgICAgIGlmICh0eXBlb2YgX2ZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaW5kIHBhcmFtZXRlciBub3Qgc3RyaW5nICR7dHlwZW9mIF9mcGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBjb25zdCByZXN1bHQxID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgIG9yOiBbXG4gICAgICAgICAgICAgICAgeyB2cGF0aDogeyBlcTogZnBhdGggfX0sXG4gICAgICAgICAgICAgICAgeyByZW5kZXJQYXRoOiB7IGVxOiBmcGF0aCB9fVxuICAgICAgICAgICAgXVxuICAgICAgICB9IGFzIEZpbHRlcjxUPik7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmQgJHtfZnBhdGh9ICR7ZnBhdGh9ID09PiByZXN1bHQxICR7dXRpbC5pbnNwZWN0KHJlc3VsdDEpfSBgKTtcblxuICAgICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0MS5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gIShmY2FjaGUuaWdub3JlRmlsZShpdGVtKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kICR7X2ZwYXRofSAke2ZwYXRofSA9PT4gcmVzdWx0MiAke3V0aWwuaW5zcGVjdChyZXN1bHQyKX0gYCk7XG5cbiAgICAgICAgbGV0IHJldDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0MikgJiYgcmVzdWx0Mi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXQgPSByZXN1bHQyWzBdO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0MikgJiYgcmVzdWx0Mi5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgcmV0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0ID0gcmVzdWx0MjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgICNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgI2ZFeGlzdHNJbkRpciAke2ZwYXRofSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICBpZiAoZGlyLm1vdW50UG9pbnQgPT09ICcvJykge1xuICAgICAgICAgICAgY29uc3QgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5tb3VudGVkLCBmcGF0aFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxldCBmc2V4aXN0cyA9IEZTLmV4aXN0c1N5bmMoZnNwYXRoKTtcblxuICAgICAgICAgICAgaWYgKGZzZXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0gRlMuc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFZQYXRoRGF0YT4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBzdGF0cy5tdGltZU1zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtcCA9IGRpci5tb3VudFBvaW50LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgPyBkaXIubW91bnRQb2ludC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgIDogZGlyLm1vdW50UG9pbnQ7XG4gICAgICAgIG1wID0gbXAuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgPyBtcFxuICAgICAgICAgICAgOiAobXArJy8nKTtcblxuICAgICAgICBpZiAoZnBhdGguc3RhcnRzV2l0aChtcCkpIHtcbiAgICAgICAgICAgIGxldCBwYXRoSW5Nb3VudGVkXG4gICAgICAgICAgICAgICAgPSBmcGF0aC5yZXBsYWNlKGRpci5tb3VudFBvaW50LCAnJyk7XG4gICAgICAgICAgICBsZXQgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5tb3VudGVkLCBwYXRoSW5Nb3VudGVkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDaGVja2luZyBleGlzdCBmb3IgJHtkaXIubW91bnRQb2ludH0gJHtkaXIubW91bnRlZH0gJHtwYXRoSW5Nb3VudGVkfSAke2ZzcGF0aH1gKTtcbiAgICAgICAgICAgIGxldCBmc2V4aXN0cyA9IEZTLmV4aXN0c1N5bmMoZnNwYXRoKTtcblxuICAgICAgICAgICAgaWYgKGZzZXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0gRlMuc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFZQYXRoRGF0YT4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzTXRpbWU6IHN0YXRzLm10aW1lTXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGdWxmaWxscyB0aGUgXCJmaW5kXCIgb3BlcmF0aW9uIG5vdCBieVxuICAgICAqIGxvb2tpbmcgaW4gdGhlIGRhdGFiYXNlLCBidXQgYnkgc2Nhbm5pbmdcbiAgICAgKiB0aGUgZmlsZXN5c3RlbSB1c2luZyBzeW5jaHJvbm91cyBjYWxscy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgZmluZFN5bmMoX2ZwYXRoKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcblxuICAgICAgICBpZiAodHlwZW9mIF9mcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZCBwYXJhbWV0ZXIgbm90IHN0cmluZyAke3R5cGVvZiBfZnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gcmVtYXBkaXJzKHRoaXMuZGlycyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kU3luYyBsb29raW5nIGZvciAke2ZwYXRofSBpbiAke3V0aWwuaW5zcGVjdChtYXBwZWQpfWApO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIG1hcHBlZCkge1xuICAgICAgICAgICAgaWYgKCEoZGlyPy5tb3VudFBvaW50KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgZmluZFN5bmMgYmFkIGRpcnMgaW4gJHt1dGlsLmluc3BlY3QodGhpcy5kaXJzKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy4jZkV4aXN0c0luRGlyKGZwYXRoLCBkaXIpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRTeW5jICR7ZnBhdGh9IGZvdW5kYCwgZm91bmQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGFzeW5jIGZpbmRBbGwoKSB7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBjb25zdCByZXN1bHQxID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDIgPSByZXN1bHQxLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kQWxsID9pZ25vcmU/ICR7aXRlbS52cGF0aH1gKTtcbiAgICAgICAgICAgIHJldHVybiAhKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQyO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlc0ZpbGVDYWNoZTxcbiAgICBUIGV4dGVuZHMgTGF5b3V0IHwgUGFydGlhbCxcbiAgICBUZGFvIGV4dGVuZHMgQmFzZURBTzxUPj5cbiAgICBleHRlbmRzIEJhc2VGaWxlQ2FjaGU8VCwgVGRhbz4ge1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb01vdW50W10sXG4gICAgICAgIGRhbzogVGRhb1xuICAgICkge1xuICAgICAgICBzdXBlcihjb25maWcsIG5hbWUsIGRpcnMsIGRhbyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2F0aGVyIHRoZSBhZGRpdGlvbmFsIGRhdGEgc3VpdGFibGVcbiAgICAgKiBmb3IgUGFydGlhbCBhbmQgTGF5b3V0IHRlbXBsYXRlcy4gIFRoZVxuICAgICAqIGZ1bGwgZGF0YSBzZXQgcmVxdWlyZWQgZm9yIERvY3VtZW50cyBpc1xuICAgICAqIG5vdCBzdWl0YWJsZSBmb3IgdGhlIHRlbXBsYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmZvIFxuICAgICAqL1xuICAgIGdhdGhlckluZm9EYXRhKGluZm8pIHtcblxuICAgICAgICBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICBpbmZvLmRpcm5hbWUgPSBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLmRpcm5hbWUgPT09ICcuJykgaW5mby5kaXJuYW1lID0gJy8nO1xuXG4gICAgICAgIGxldCByZW5kZXJlciA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoaW5mby52cGF0aCk7XG4gICAgICAgIGluZm8ucmVuZGVyZXIgPSByZW5kZXJlcjtcblxuXG4gICAgICAgIGlmIChyZW5kZXJlcikge1xuXG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBVc2luZyA8YW55PiBoZXJlIGNvdmVycyBvdmVyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBwYXJzZU1ldGFkYXRhIHJlcXVpcmVzXG4gICAgICAgICAgICAgICAgLy8gYSBSZW5kZXJpbmdDb250ZXh0IHdoaWNoXG4gICAgICAgICAgICAgICAgLy8gaW4gdHVybiByZXF1aXJlcyBhIFxuICAgICAgICAgICAgICAgIC8vIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY01ldGFkYXRhIGlzIHRoZSB1bm1vZGlmaWVkIG1ldGFkYXRhL2Zyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YSA9IHJjLm1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQgaXMgdGhlIHVucGFyc2VkIG9yaWdpbmFsIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAvLyBpbmNsdWRpbmcgYW55IGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NDb250ZW50ID0gcmMuY29udGVudDtcbiAgICAgICAgICAgICAgICAvLyBkb2NCb2R5IGlzIHRoZSBwYXJzZWQgYm9keSAtLSBlLmcuIGZvbGxvd2luZyB0aGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSByYy5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY29tcHV0ZWQgbWV0YWRhdGEgdGhhdCBpbmNsdWRlcyBkYXRhIGZyb20gXG4gICAgICAgICAgICAgICAgLy8gc2V2ZXJhbCBzb3VyY2VzXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YSA9IHsgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8uZG9jTWV0YWRhdGEpIGluZm8uZG9jTWV0YWRhdGEgPSB7fTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbml0TWV0YWRhdGEgJHtiYXNlZGlyfSAke2ZwYXRofSBiYXNlTWV0YWRhdGEgJHtiYXNlTWV0YWRhdGFbeXByb3BdfWApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uYmFzZU1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgVGVtcGxhdGVzRmlsZUNhY2hlIGFmdGVyIGdhdGhlckluZm9EYXRhIGAsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm8pIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8udXBkYXRlKCh7XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH0gYXMgdW5rbm93bikgYXMgVCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbzogYW55KSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLmluc2VydCgoe1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICB9IGFzIHVua25vd24pIGFzIFQpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERvY3VtZW50c0ZpbGVDYWNoZVxuICAgIGV4dGVuZHMgQmFzZUZpbGVDYWNoZTxEb2N1bWVudCwgVGRvY3VtZW50c3NEQU8+IHtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZGlyczogZGlyVG9Nb3VudFtdXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKGNvbmZpZywgbmFtZSwgZGlycywgZG9jdW1lbnRzREFPKTtcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvKSB7XG5cbiAgICAgICAgaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgaW5mby5kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAoaW5mby5kaXJuYW1lID09PSAnLicpIGluZm8uZGlybmFtZSA9ICcvJztcbiAgICAgICAgaW5mby5wYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoaW5mby5kaXJuYW1lKTtcblxuICAgICAgICAvLyBmaW5kIHRoZSBtb3VudGVkIGRpcmVjdG9yeSxcbiAgICAgICAgLy8gZ2V0IHRoZSBiYXNlTWV0YWRhdGFcbiAgICAgICAgZm9yIChsZXQgZGlyIG9mIHJlbWFwZGlycyh0aGlzLmRpcnMpKSB7XG4gICAgICAgICAgICBpZiAoZGlyLm1vdW50ZWQgPT09IGluZm8ubW91bnRlZCkge1xuICAgICAgICAgICAgICAgIGlmIChkaXIuYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8uYmFzZU1ldGFkYXRhID0gZGlyLmJhc2VNZXRhZGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXQgcHVibGljYXRpb25EYXRlIHNvbWVob3dcblxuXG4gICAgICAgIGxldCByZW5kZXJlciA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoaW5mby52cGF0aCk7XG4gICAgICAgIGluZm8ucmVuZGVyZXIgPSByZW5kZXJlcjtcblxuICAgICAgICBpZiAocmVuZGVyZXIpIHtcblxuICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoXG4gICAgICAgICAgICAgICAgPSByZW5kZXJlci5maWxlUGF0aChpbmZvLnZwYXRoKTtcblxuICAgICAgICAgICAgLy8gVGhpcyB3YXMgaW4gdGhlIExva2lKUyBjb2RlLCBidXRcbiAgICAgICAgICAgIC8vIHdhcyBub3QgaW4gdXNlLlxuICAgICAgICAgICAgLy8gaW5mby5yZW5kZXJuYW1lID0gcGF0aC5iYXNlbmFtZShcbiAgICAgICAgICAgIC8vICAgICBpbmZvLnJlbmRlclBhdGhcbiAgICAgICAgICAgIC8vICk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9IG1pY3JvbWF0Y2guaXNNYXRjaChcbiAgICAgICAgICAgICAgICBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgJyoqLyouaHRtbCcpXG4gICAgICAgICAgICA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEpIHtcblxuICAgICAgICAgICAgICAgIC8vIFVzaW5nIDxhbnk+IGhlcmUgY292ZXJzIG92ZXJcbiAgICAgICAgICAgICAgICAvLyB0aGF0IHBhcnNlTWV0YWRhdGEgcmVxdWlyZXNcbiAgICAgICAgICAgICAgICAvLyBhIFJlbmRlcmluZ0NvbnRleHQgd2hpY2hcbiAgICAgICAgICAgICAgICAvLyBpbiB0dXJuIHJlcXVpcmVzIGEgXG4gICAgICAgICAgICAgICAgLy8gbWV0YWRhdGEgb2JqZWN0LlxuICAgICAgICAgICAgICAgIGNvbnN0IHJjID0gcmVuZGVyZXIucGFyc2VNZXRhZGF0YSg8YW55PntcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBpbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogRlMucmVhZEZpbGVTeW5jKGluZm8uZnNwYXRoLCAndXRmLTgnKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gZG9jTWV0YWRhdGEgaXMgdGhlIHVubW9kaWZpZWQgbWV0YWRhdGEvZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgZG9jdW1lbnRcbiAgICAgICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhID0gcmMubWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgLy8gZG9jQ29udGVudCBpcyB0aGUgdW5wYXJzZWQgb3JpZ2luYWwgY29udGVudFxuICAgICAgICAgICAgICAgIC8vIGluY2x1ZGluZyBhbnkgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0NvbnRlbnQgPSByYy5jb250ZW50O1xuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBjb21wdXRlZCBtZXRhZGF0YSB0aGF0IGluY2x1ZGVzIGRhdGEgZnJvbSBcbiAgICAgICAgICAgICAgICAvLyBzZXZlcmFsIHNvdXJjZXNcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhID0geyB9O1xuICAgICAgICAgICAgICAgIGlmICghaW5mby5kb2NNZXRhZGF0YSkgaW5mby5kb2NNZXRhZGF0YSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlc3Qgb2YgdGhpcyBpcyBhZGFwdGVkIGZyb20gdGhlIG9sZCBmdW5jdGlvblxuICAgICAgICAgICAgICAgIC8vIEhUTUxSZW5kZXJlci5uZXdJbml0TWV0YWRhdGFcblxuICAgICAgICAgICAgICAgIC8vIEZvciBzdGFydGVycyB0aGUgbWV0YWRhdGEgaXMgY29sbGVjdGVkIGZyb20gc2V2ZXJhbCBzb3VyY2VzLlxuICAgICAgICAgICAgICAgIC8vIDEpIHRoZSBtZXRhZGF0YSBzcGVjaWZpZWQgaW4gdGhlIGRpcmVjdG9yeSBtb3VudCB3aGVyZVxuICAgICAgICAgICAgICAgIC8vICAgIHRoaXMgZG9jdW1lbnQgd2FzIGZvdW5kXG4gICAgICAgICAgICAgICAgLy8gMikgbWV0YWRhdGEgaW4gdGhlIHByb2plY3QgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgICAgIC8vIDMpIHRoZSBtZXRhZGF0YSBpbiB0aGUgZG9jdW1lbnQsIGFzIGNhcHR1cmVkIGluIGRvY01ldGFkYXRhXG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW5pdE1ldGFkYXRhICR7YmFzZWRpcn0gJHtmcGF0aH0gYmFzZU1ldGFkYXRhICR7YmFzZU1ldGFkYXRhW3lwcm9wXX1gKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSBpbmZvLmJhc2VNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIHRoaXMuY29uZmlnLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gdGhpcy5jb25maWcubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgZm1tY291bnQgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uZG9jTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSBpbmZvLmRvY01ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgZm1tY291bnQrKztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcmVuZGVyZWQgdmVyc2lvbiBvZiB0aGUgY29udGVudCBsYW5kcyBoZXJlXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5jb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAvLyBUaGUgZG9jdW1lbnQgb2JqZWN0IGhhcyBiZWVuIHVzZWZ1bCBmb3IgXG4gICAgICAgICAgICAgICAgLy8gY29tbXVuaWNhdGluZyB0aGUgZmlsZSBwYXRoIGFuZCBvdGhlciBkYXRhLlxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQgPSB7fTtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LmJhc2VkaXIgPSBpbmZvLm1vdW50UG9pbnQ7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZWxwYXRoID0gaW5mby5wYXRoSW5Nb3VudGVkO1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscmVuZGVyID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby5wYXRoSW5Nb3VudGVkKTtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8gPSBpbmZvLnJlbmRlclBhdGg7XG5cbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgdGhlIDxlbT50YWdzPC9lbT4gZmllbGQgaXMgYW4gYXJyYXlcbiAgICAgICAgICAgICAgICBpZiAoIShpbmZvLm1ldGFkYXRhLnRhZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyA9IFtdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIChpbmZvLm1ldGFkYXRhLnRhZ3MpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGFnbGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZSA9IC9cXHMqLFxccyovO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3Muc3BsaXQocmUpLmZvckVhY2godGFnID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ2xpc3QucHVzaCh0YWcudHJpbSgpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyA9IHRhZ2xpc3Q7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghQXJyYXkuaXNBcnJheShpbmZvLm1ldGFkYXRhLnRhZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGBGT1JNQVQgRVJST1IgLSAke2luZm8udnBhdGh9IGhhcyBiYWRseSBmb3JtYXR0ZWQgdGFncyBgLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YS50YWdzID0gaW5mby5tZXRhZGF0YS50YWdzO1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJvb3QgVVJMIGZvciB0aGUgcHJvamVjdFxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucm9vdF91cmwgPSB0aGlzLmNvbmZpZy5yb290X3VybDtcblxuICAgICAgICAgICAgICAgIC8vIENvbXB1dGUgdGhlIFVSTCB0aGlzIGRvY3VtZW50IHdpbGwgcmVuZGVyIHRvXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLnJvb3RfdXJsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB1Um9vdFVybCA9IG5ldyBVUkwodGhpcy5jb25maWcucm9vdF91cmwsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgICAgICAgICAgdVJvb3RVcmwucGF0aG5hbWUgPSBwYXRoLm5vcm1hbGl6ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4odVJvb3RVcmwucGF0aG5hbWUsIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfdXJsID0gdVJvb3RVcmwudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX3VybCA9IGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG87XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gaW5mby5tZXRhZGF0YS5yZW5kZXJlZF9kYXRlID0gaW5mby5zdGF0cy5tdGltZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlUHVibERhdGUgPSAoZGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBEYXRlLnBhcnNlKGRhdGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoISBpc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0ZVNldCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICAgJiYgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghIGRhdGVTZXQgJiYgaW5mby5tdGltZU1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKGluZm8ubXRpbWVNcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gc3RhdHMubXRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gY3VycmVudCB0aW1lYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBkZWxldGVEb2NUYWdHbHVlKHZwYXRoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0Z2x1ZS5kZWxldGVUYWdHbHVlKHZwYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAvLyBpZ25vcmVcbiAgICAgICAgICAgIC8vIFRoaXMgY2FuIHRocm93IGFuIGVycm9yIGxpa2U6XG4gICAgICAgICAgICAvLyBkb2N1bWVudHNDYWNoZSBFUlJPUiB7XG4gICAgICAgICAgICAvLyAgICAgY29kZTogJ2NoYW5nZWQnLFxuICAgICAgICAgICAgLy8gICAgIG5hbWU6ICdkb2N1bWVudHMnLFxuICAgICAgICAgICAgLy8gICAgIHZwYXRoOiAnX21lcm1haWQvcmVuZGVyMzM1NjczOTM4Mi5tZXJtYWlkJyxcbiAgICAgICAgICAgIC8vICAgICBlcnJvcjogRXJyb3I6IGRlbGV0ZSBmcm9tICdUQUdHTFVFJyBmYWlsZWQ6IG5vdGhpbmcgY2hhbmdlZFxuICAgICAgICAgICAgLy8gICAgICAuLi4gc3RhY2sgdHJhY2VcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIEluIHN1Y2ggYSBjYXNlIHRoZXJlIGlzIG5vIHRhZ0dsdWUgZm9yIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICAgIC8vIFRoaXMgXCJlcnJvclwiIGlzIHNwdXJpb3VzLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRPRE8gSXMgdGhlcmUgYW5vdGhlciBxdWVyeSB0byBydW4gdGhhdCB3aWxsXG4gICAgICAgICAgICAvLyBub3QgdGhyb3cgYW4gZXJyb3IgaWYgbm90aGluZyB3YXMgY2hhbmdlZD9cbiAgICAgICAgICAgIC8vIEluIG90aGVyIHdvcmRzLCB0aGlzIGNvdWxkIGhpZGUgYSBsZWdpdGltYXRlXG4gICAgICAgICAgICAvLyBlcnJvci5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBhZGREb2NUYWdHbHVlKHZwYXRoOiBzdHJpbmcsIHRhZ3M6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGFncyAhPT0gJ3N0cmluZydcbiAgICAgICAgICYmICFBcnJheS5pc0FycmF5KHRhZ3MpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhZGREb2NUYWdHbHVlIG11c3QgYmUgZ2l2ZW4gYSB0YWdzIGFycmF5LCB3YXMgZ2l2ZW46ICR7dXRpbC5pbnNwZWN0KHRhZ3MpfWApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRnbHVlLmFkZFRhZ0dsdWUodnBhdGgsIFxuICAgICAgICAgICAgQXJyYXkuaXNBcnJheSh0YWdzKVxuICAgICAgICAgICAgPyB0YWdzXG4gICAgICAgICAgICA6IFsgdGFncyBdKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvKSB7XG4gICAgICAgIGNvbnN0IGRvY0luZm8gPSA8RG9jdW1lbnQ+e1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIHBhcmVudERpcjogaW5mby5wYXJlbnREaXIsXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgdGFnczogQXJyYXkuaXNBcnJheShpbmZvLm1ldGFkYXRhPy50YWdzKVxuICAgICAgICAgICAgICAgICAgICA/IGluZm8ubWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAgICA6IFtdLFxuICAgICAgICAgICAgbGF5b3V0OiBpbmZvLm1ldGFkYXRhPy5sYXlvdXQsXG4gICAgICAgICAgICBibG9ndGFnOiB0eXBlb2YgaW5mby5tZXRhZGF0YT8uYmxvZ3RhZyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICA/IGluZm8ubWV0YWRhdGE/LmJsb2d0YWdcbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH07XG5cbiAgICAgICAgYXdhaXQgdGhpcy5kYW8udXBkYXRlKGRvY0luZm8pO1xuXG4gICAgICAgIGF3YWl0IHRnbHVlLmRlbGV0ZVRhZ0dsdWUoZG9jSW5mby52cGF0aCk7XG4gICAgICAgIGF3YWl0IHRnbHVlLmFkZFRhZ0dsdWUoZG9jSW5mby52cGF0aCwgZG9jSW5mby50YWdzKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihpbmZvOiBhbnkpIHtcbiAgICAgICAgY29uc3QgZG9jSW5mbyA9IDxEb2N1bWVudD57XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgcGFyZW50RGlyOiBpbmZvLnBhcmVudERpcixcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICB0YWdzOiBBcnJheS5pc0FycmF5KGluZm8ubWV0YWRhdGE/LnRhZ3MpXG4gICAgICAgICAgICAgICAgICAgID8gaW5mby5tZXRhZGF0YS50YWdzXG4gICAgICAgICAgICAgICAgICAgIDogW10sXG4gICAgICAgICAgICBsYXlvdXQ6IGluZm8ubWV0YWRhdGE/LmxheW91dCxcbiAgICAgICAgICAgIGJsb2d0YWc6IHR5cGVvZiBpbmZvLm1ldGFkYXRhPy5ibG9ndGFnID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgID8gaW5mby5tZXRhZGF0YT8uYmxvZ3RhZ1xuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8uaW5zZXJ0KGRvY0luZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZERvY1RhZ0dsdWUoXG4gICAgICAgICAgICBkb2NJbmZvLnZwYXRoLCBkb2NJbmZvLnRhZ3NcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVVbmxpbmtlZChuYW1lOiBhbnksIGluZm86IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBzdXBlci5oYW5kbGVVbmxpbmtlZChuYW1lLCBpbmZvKTtcbiAgICAgICAgdGdsdWUuZGVsZXRlVGFnR2x1ZShpbmZvLnZwYXRoKTtcbiAgICB9XG5cbiAgICBhc3luYyBpbmRleENoYWluKF9mcGF0aCkge1xuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSkgXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXRoLnBhcnNlKGZwYXRoKTtcblxuICAgICAgICBjb25zdCBmaWxlejogRG9jdW1lbnRbXSA9IFtdO1xuICAgICAgICBjb25zdCBzZWxmID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgICdvcic6IFtcbiAgICAgICAgICAgICAgICB7IHZwYXRoOiB7IGVxOiBmcGF0aCB9IH0sXG4gICAgICAgICAgICAgICAgeyByZW5kZXJQYXRoOiB7IGVxOiBmcGF0aCB9IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGZwYXRoO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmKSAmJiBzZWxmLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICBmaWxlei5wdXNoKHNlbGZbMF0pO1xuICAgICAgICAgICAgZmlsZU5hbWUgPSBzZWxmWzBdLnJlbmRlclBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50RGlyO1xuICAgICAgICBsZXQgZGlyTmFtZSA9IHBhdGguZGlybmFtZShmcGF0aCk7XG4gICAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICghKGRpck5hbWUgPT09ICcuJyB8fCBkaXJOYW1lID09PSBwYXJzZWQucm9vdCkpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGVOYW1lKSA9PT0gJ2luZGV4Lmh0bWwnKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShmaWxlTmFtZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxvb2tGb3IgPSBwYXRoLmpvaW4ocGFyZW50RGlyLCBcImluZGV4Lmh0bWxcIik7XG5cbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgICAgICAnb3InOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgdnBhdGg6IHsgZXE6IGxvb2tGb3IgfSB9LFxuICAgICAgICAgICAgICAgICAgICB7IHJlbmRlclBhdGg6IHsgZXE6IGxvb2tGb3IgfSB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGluZGV4KSAmJiBpbmRleC5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgICAgIGZpbGV6LnB1c2goaW5kZXhbMF0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaWxlTmFtZSA9IGxvb2tGb3I7XG4gICAgICAgICAgICBkaXJOYW1lID0gcGF0aC5kaXJuYW1lKGxvb2tGb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbGV6XG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbihvYmo6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZm91bmREaXIgPSBvYmoubW91bnRQb2ludDtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmZvdW5kUGF0aCA9IG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICBvYmouZmlsZW5hbWUgPSAnLycgKyBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgYWxsIHRoZSBkb2N1bWVudHMgaW4gdGhlIHNhbWUgZGlyZWN0b3J5XG4gICAgICogYXMgdGhlIG5hbWVkIGZpbGUuXG4gICAgICpcbiAgICAgKiBUaGlzIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIHVzZWQgYW55d2hlcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHNpYmxpbmdzKF9mcGF0aCkge1xuICAgICAgICBsZXQgcmV0O1xuICAgICAgICBsZXQgdnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZSh2cGF0aCk7XG4gICAgICAgIC8vIGlmIChkaXJuYW1lID09PSAnLicpIGRpcm5hbWUgPSAnLyc7XG5cbiAgICAgICAgY29uc3Qgc2libGluZ3MgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAgICAgZGlybmFtZTogeyBlcTogZGlybmFtZSB9LFxuICAgICAgICAgICAgLy8gVGhlIHNpYmxpbmdzIGNhbm5vdCBpbmNsdWRlIHRoZSBzZWxmLlxuICAgICAgICAgICAgdnBhdGg6IHsgbmVxOiB2cGF0aCB9LFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogeyBuZXE6IHZwYXRoIH0sXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc2libGluZ3MuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLmlnbm9yZUZpbGUoaXRlbSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB0cmVlIG9mIGl0ZW1zIHN0YXJ0aW5nIGZyb20gdGhlIGRvY3VtZW50XG4gICAgICogbmFtZWQgaW4gX3Jvb3RJdGVtLiAgVGhlIHBhcmFtZXRlciBzaG91bGQgYmUgYW5cbiAgICAgKiBhY3R1YWwgZG9jdW1lbnQgaW4gdGhlIHRyZWUsIHN1Y2ggYXMgYHBhdGgvdG8vaW5kZXguaHRtbGAuXG4gICAgICogVGhlIHJldHVybiBpcyBhIHRyZWUtc2hhcGVkIHNldCBvZiBvYmplY3RzIGxpa2UgdGhlIGZvbGxvd2luZztcbiAgICAgKiBcbiAgdHJlZTpcbiAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlclxuICAgIGl0ZW1zOlxuICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBjaGlsZEZvbGRlcnM6XG4gICAgICAgIC0gZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICAgICAgaXRlbXM6XG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sXG4gICAgICAgICAgICAgIGNoaWxkRm9sZGVyczogW11cbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sXG4gICAgICAgICAgICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAqXG4gICAgICogVGhlIG9iamVjdHMgdW5kZXIgYGl0ZW1zYCBhcmUgYWN0dWxseSB0aGUgZnVsbCBEb2N1bWVudCBvYmplY3RcbiAgICAgKiBmcm9tIHRoZSBjYWNoZSwgYnV0IGZvciB0aGUgaW50ZXJlc3Qgb2YgY29tcGFjdG5lc3MgbW9zdCBvZlxuICAgICAqIHRoZSBmaWVsZHMgaGF2ZSBiZWVuIGRlbGV0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX3Jvb3RJdGVtIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGNoaWxkSXRlbVRyZWUoX3Jvb3RJdGVtOiBzdHJpbmcpIHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hpbGRJdGVtVHJlZSAke19yb290SXRlbX1gKTtcblxuICAgICAgICBsZXQgcm9vdEl0ZW0gPSBhd2FpdCB0aGlzLmZpbmQoXG4gICAgICAgICAgICAgICAgX3Jvb3RJdGVtLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9yb290SXRlbS5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfcm9vdEl0ZW0pO1xuICAgICAgICBpZiAoIXJvb3RJdGVtKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYGNoaWxkSXRlbVRyZWUgbm8gcm9vdEl0ZW0gZm91bmQgZm9yIHBhdGggJHtfcm9vdEl0ZW19YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKHR5cGVvZiByb290SXRlbSA9PT0gJ29iamVjdCcpXG4gICAgICAgICB8fCAhKCd2cGF0aCcgaW4gcm9vdEl0ZW0pXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGBjaGlsZEl0ZW1UcmVlIGZvdW5kIGludmFsaWQgb2JqZWN0IGZvciAke19yb290SXRlbX0gLSAke3V0aWwuaW5zcGVjdChyb290SXRlbSl9YCk7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKHJvb3RJdGVtLnZwYXRoKTtcbiAgICAgICAgLy8gUGlja3MgdXAgZXZlcnl0aGluZyBmcm9tIHRoZSBjdXJyZW50IGxldmVsLlxuICAgICAgICAvLyBEaWZmZXJzIGZyb20gc2libGluZ3MgYnkgZ2V0dGluZyBldmVyeXRoaW5nLlxuICAgICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgICAgICBkaXJuYW1lOiB7IGVxOiBkaXJuYW1lIH0sXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiB0cnVlXG4gICAgICAgIH0pIGFzIHVua25vd25bXSBhcyBhbnlbXTtcblxuICAgICAgICBjb25zdCBjaGlsZEZvbGRlcnMgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5hbGwoXG4gICAgICAgICAgICBgU0VMRUNUIGRpc3RpbmN0IGRpcm5hbWUgRlJPTSBET0NVTUVOVFNcbiAgICAgICAgICAgIFdIRVJFIHBhcmVudERpciA9ICcke2Rpcm5hbWV9J2BcbiAgICAgICAgKSBhcyB1bmtub3duW10gYXMgRG9jdW1lbnRbXTtcblxuICAgICAgICBjb25zdCBjZnMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBjZiBvZiBjaGlsZEZvbGRlcnMpIHtcbiAgICAgICAgICAgIGNmcy5wdXNoKGF3YWl0IHRoaXMuY2hpbGRJdGVtVHJlZShcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4oY2YuZGlybmFtZSwgJ2luZGV4Lmh0bWwnKVxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcm9vdEl0ZW0sXG4gICAgICAgICAgICBkaXJuYW1lLFxuICAgICAgICAgICAgaXRlbXM6IGl0ZW1zLFxuICAgICAgICAgICAgLy8gVW5jb21tZW50IHRoaXMgdG8gZ2VuZXJhdGUgc2ltcGxpZmllZCBvdXRwdXRcbiAgICAgICAgICAgIC8vIGZvciBkZWJ1Z2dpbmcuXG4gICAgICAgICAgICAvLyAubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAgICAgLy8gICAgICAgICByZW5kZXJQYXRoOiBpdGVtLnJlbmRlclBhdGhcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9KSxcbiAgICAgICAgICAgIGNoaWxkRm9sZGVyczogY2ZzXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBpbmRleCBmaWxlcyAocmVuZGVycyB0byBpbmRleC5odG1sKVxuICAgICAqIHdpdGhpbiB0aGUgbmFtZWQgc3VidHJlZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByb290UGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBpbmRleEZpbGVzKHJvb3RQYXRoPzogc3RyaW5nKSB7XG4gICAgICAgIGxldCByb290UCA9IHJvb3RQYXRoPy5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgID8gcm9vdFBhdGg/LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgOiByb290UGF0aDtcblxuICAgICAgICAvLyBPcHRpb25hbGx5IGFwcGVuZGFibGUgc3ViLXF1ZXJ5XG4gICAgICAgIC8vIHRvIGhhbmRsZSB3aGVuIHJvb3RQYXRoIGlzIHNwZWNpZmllZFxuICAgICAgICBsZXQgcm9vdFEgPSAoXG4gICAgICAgICAgICAgICAgdHlwZW9mIHJvb3RQID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICYmIHJvb3RQLmxlbmd0aCA+PSAxXG4gICAgICAgICAgICApXG4gICAgICAgICAgICA/IGBBTkQgKCByZW5kZXJQYXRoIExJS0UgJyR7cm9vdFB9JScgKWBcbiAgICAgICAgICAgIDogJyc7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgIFNFTEVDVCAqXG4gICAgICAgIEZST00gRE9DVU1FTlRTXG4gICAgICAgIFdIRVJFXG4gICAgICAgICAgICAoIHJlbmRlcnNUb0hUTUwgPSB0cnVlIClcbiAgICAgICAgQU5EIChcbiAgICAgICAgICAgICggcmVuZGVyUGF0aCBMSUtFICclL2luZGV4Lmh0bWwnIClcbiAgICAgICAgIE9SICggcmVuZGVyUGF0aCA9ICdpbmRleC5odG1sJyApXG4gICAgICAgIClcbiAgICAgICAgJHtyb290UX1cbiAgICAgICAgYCk7XG4gICAgICAgIFxuXG4gICAgICAgIC8vIEl0J3MgcHJvdmVkIGRpZmZpY3VsdCB0byBnZXQgdGhlIHJlZ2V4cFxuICAgICAgICAvLyB0byB3b3JrIGluIHRoaXMgbW9kZTpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gcmV0dXJuIGF3YWl0IHRoaXMuc2VhcmNoKHtcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0hUTUw6IHRydWUsXG4gICAgICAgIC8vICAgICByZW5kZXJwYXRobWF0Y2g6IC9cXC9pbmRleC5odG1sJC8sXG4gICAgICAgIC8vICAgICByb290UGF0aDogcm9vdFBhdGhcbiAgICAgICAgLy8gfSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIEZvciBldmVyeSBmaWxlIGluIHRoZSBkb2N1bWVudHMgY2FjaGUsXG4gICAgICogc2V0IHRoZSBhY2Nlc3MgYW5kIG1vZGlmaWNhdGlvbnMuXG4gICAgICpcbiAgICAgKiA/Pz8/PyBXaHkgd291bGQgdGhpcyBiZSB1c2VmdWw/XG4gICAgICogSSBjYW4gc2VlIGRvaW5nIHRoaXMgZm9yIHRoZSByZW5kZXJlZFxuICAgICAqIGZpbGVzIGluIHRoZSBvdXRwdXQgZGlyZWN0b3J5LiAgQnV0IHRoaXMgaXNcbiAgICAgKiBmb3IgdGhlIGZpbGVzIGluIHRoZSBkb2N1bWVudHMgZGlyZWN0b3JpZXMuID8/Pz9cbiAgICAgKi9cbiAgICBhc3luYyBzZXRUaW1lcygpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8uc2VsZWN0RWFjaChcbiAgICAgICAgICAgIChlcnIsIG1vZGVsKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzZXR0ZXIgPSBhc3luYyAoZGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBEYXRlLnBhcnNlKGRhdGUpOztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZHAgPSBuZXcgRGF0ZShwYXJzZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgRlMudXRpbWVzU3luYyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHBcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChtb2RlbC5pbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIG1vZGVsLmluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0dGVyKG1vZGVsLmluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobW9kZWwuaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiBtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXR0ZXIobW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7fSBhcyBXaGVyZTxEb2N1bWVudD5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgZG9jdW1lbnRzIHdoaWNoIGhhdmUgdGFncy5cbiAgICAgKiBcbiAgICAgKiBUT0RPIC0gSXMgdGhpcyBmdW5jdGlvbiB1c2VkIGFueXdoZXJlP1xuICAgICAqICAgSXQgaXMgbm90IHJlZmVyZW5jZWQgaW4gYWthc2hhcmVuZGVyLCBub3JcbiAgICAgKiAgIGluIGFueSBwbHVnaW4gdGhhdCBJIGNhbiBmaW5kLlxuICAgICAqXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgZG9jdW1lbnRzV2l0aFRhZ3MoKSB7XG4gICAgICAgIGNvbnN0IGRvY3MgPSBuZXcgQXJyYXk8RG9jdW1lbnQ+KCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLnNlbGVjdEVhY2goXG4gICAgICAgICAgICAoZXJyLCBkb2MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jXG4gICAgICAgICAgICAgICAgICYmIGRvYy5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiBkb2MuZG9jTWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KFxuICAgICAgICAgICAgICAgICAgICBkb2MuZG9jTWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICYmIGRvYy5kb2NNZXRhZGF0YS50YWdzLmxlbmd0aCA+PSAxXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3MucHVzaChkb2MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogeyBlcTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIGluZm86IHsgaXNOb3ROdWxsOiB0cnVlIH1cbiAgICAgICAgICAgIH0gYXMgV2hlcmU8RG9jdW1lbnQ+XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coZG9jcyk7XG4gICAgICAgIHJldHVybiBkb2NzO1xuICAgIH1cblxuICAgIGFzeW5jIGRvY3VtZW50c1dpdGhUYWcodGFnbm06IHN0cmluZyB8IHN0cmluZ1tdKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8c3RyaW5nPj5cbiAgICB7XG4gICAgICAgIGxldCB0YWdzOiBzdHJpbmdbXTtcbiAgICAgICAgaWYgKHR5cGVvZiB0YWdubSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRhZ3MgPSBbIHRhZ25tIF07XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0YWdubSkpIHtcbiAgICAgICAgICAgIHRhZ3MgPSB0YWdubTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnRzV2l0aFRhZyBnaXZlbiBiYWQgdGFncyBhcnJheSAke3V0aWwuaW5zcGVjdCh0YWdubSl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb3JyZWN0bHkgaGFuZGxlIHRhZyBzdHJpbmdzIHdpdGhcbiAgICAgICAgLy8gdmFyeWluZyBxdW90ZXMuICBBIGRvY3VtZW50IG1pZ2h0IGhhdmUgdGhlc2UgdGFnczpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgdGFnczpcbiAgICAgICAgLy8gICAgLSBUZWFzZXInc1xuICAgICAgICAvLyAgICAtIFRlYXNlcnNcbiAgICAgICAgLy8gICAgLSBTb21ldGhpbmcgXCJxdW90ZWRcIlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGVzZSBTUUwgcXVlcmllcyB3b3JrOlxuICAgICAgICAvL1xuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lIElOICggJ1NvbWV0aGluZyBcInF1aXRlZFwiJywgXCJUZWFzZXInc1wiICk7XG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8VGVhc2VyJ3NcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxTb21ldGhpbmcgXCJxdWl0ZWRcIlxuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lIElOICggJ1NvbWV0aGluZyBcInF1aXRlZFwiJywgJ1RlYXNlcicncycgKTtcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxUZWFzZXInc1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFNvbWV0aGluZyBcInF1aXRlZFwiXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEJ1dCwgdGhpcyBkb2VzIG5vdDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gc3FsaXRlPiBzZWxlY3QgKiBmcm9tIFRBR0dMVUUgd2hlcmUgdGFnTmFtZSA9ICdUZWFzZXIncyc7XG4gICAgICAgIC8vICcgIC4uLj4gXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBvcmlnaW5hbCBjb2RlIGJlaGF2aW9yIHdhcyB0aGlzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEIEVycm9yOiBTUUxJVEVfRVJST1I6IG5lYXIgXCJzXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBBbiBhdHRlbXB0ZWQgZml4OlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiBdICAoICdUZWFzZXJcXCdzJyApIFxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInNcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFub3RoZXIgYXR0ZW1wdGVkIGZpeDpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyBcIlRlYXNlcidzXCIgXSAgKCBcIlRlYXNlcicnc1wiICkgXG4gICAgICAgIC8vIFtdXG4gICAgICAgIC8vIFtdXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuZDpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgJ1NvbWV0aGluZyBcInF1b3RlZFwiJ1xuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgJ1NvbWV0aGluZyBcInF1b3RlZFwiJyBdICAoIFwiU29tZXRoaW5nIFwicXVvdGVkXCJcIiApIFxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInF1b3RlZFwiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIGNvZGUgYmVsb3cgcHJvZHVjZXM6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIiAnU29tZXRoaW5nIFwicXVpdGVkXCInXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyBcIlRlYXNlcidzXCIsICdTb21ldGhpbmcgXCJxdWl0ZWRcIicgXSAgKCAnVGVhc2VyJydzJywnU29tZXRoaW5nIFwicXVpdGVkXCInICkgXG4gICAgICAgIC8vIFsgeyB2cGF0aDogJ3RlYXNlci1jb250ZW50Lmh0bWwubWQnIH0gXVxuICAgICAgICAvLyBbICd0ZWFzZXItY29udGVudC5odG1sLm1kJyBdXG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGRvY3VtZW50c1dpdGhUYWcgJHt1dGlsLmluc3BlY3QodGFncyl9ICR7dGFnc3RyaW5nfWApO1xuXG4gICAgICAgIGNvbnN0IHZwYXRocyA9IGF3YWl0IHRnbHVlLnBhdGhzRm9yVGFnKHRhZ3MpO1xuICAgICAgICBcbiAgICAgICAgLy8gY29uc29sZS5sb2codnBhdGhzKTtcblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodnBhdGhzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudHNXaXRoVGFnIG5vbi1BcnJheSByZXN1bHQgJHt1dGlsLmluc3BlY3QodnBhdGhzKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2cGF0aHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFuIGFycmF5IG9mIHRhZ3MgdXNlZCBieSBhbGwgZG9jdW1lbnRzLlxuICAgICAqIFRoaXMgdXNlcyB0aGUgSlNPTiBleHRlbnNpb24gdG8gZXh0cmFjdFxuICAgICAqIHRoZSB0YWdzIGZyb20gdGhlIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHRhZ3MoKSB7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCB0Z2x1ZS50YWdzKCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXQgPSBBcnJheS5mcm9tKHRhZ3MpO1xuICAgICAgICByZXR1cm4gcmV0LnNvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB2YXIgdGFnQSA9IGEudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHZhciB0YWdCID0gYi50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKHRhZ0EgPCB0YWdCKSByZXR1cm4gLTE7XG4gICAgICAgICAgICBpZiAodGFnQSA+IHRhZ0IpIHJldHVybiAxO1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlIHRoZSBkYXRhIGZvciBhbiBpbnRlcm5hbCBsaW5rXG4gICAgICogd2l0aGluIHRoZSBzaXRlIGRvY3VtZW50cy4gIEZvcm1pbmcgYW5cbiAgICAgKiBpbnRlcm5hbCBsaW5rIGlzIGF0IGEgbWluaW11bSB0aGUgcmVuZGVyZWRcbiAgICAgKiBwYXRoIGZvciB0aGUgZG9jdW1lbnQgYW5kIGl0cyB0aXRsZS5cbiAgICAgKiBUaGUgdGVhc2VyLCBpZiBhdmFpbGFibGUsIGNhbiBiZSB1c2VkIGluXG4gICAgICogYSB0b29sdGlwLiBUaGUgdGh1bWJuYWlsIGlzIGFuIGltYWdlIHRoYXRcbiAgICAgKiBjb3VsZCBiZSBkaXNwbGF5ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgZG9jTGlua0RhdGEodnBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuXG4gICAgICAgIC8vIFRoZSB2cGF0aCByZWZlcmVuY2VcbiAgICAgICAgdnBhdGg6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIHBhdGggaXQgcmVuZGVycyB0b1xuICAgICAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSB0aXRsZSBzdHJpbmcgZnJvbSB0aGF0IHBhZ2VcbiAgICAgICAgdGl0bGU6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIHRlYXNlciB0ZXh0IGZyb20gdGhhdCBwYWdlXG4gICAgICAgIHRlYXNlcj86IHN0cmluZztcbiAgICAgICAgLy8gVGhlIGhlcm8gaW1hZ2UgKHRodW1ibmFpbClcbiAgICAgICAgdGh1bWJuYWlsPzogc3RyaW5nO1xuICAgIH0+IHtcbiAgICAgICAgY29uc3QgZG9jSW5mbyA9IGF3YWl0IHRoaXMuZmluZCh2cGF0aCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGRvY0luZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHRpdGxlOiBkb2NJbmZvLm1ldGFkYXRhLnRpdGxlLFxuICAgICAgICAgICAgdGVhc2VyOiBkb2NJbmZvLm1ldGFkYXRhLnRlYXNlcixcbiAgICAgICAgICAgIC8vIHRodW1ibmFpbFxuICAgICAgICB9O1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybSBkZXNjcmlwdGl2ZSBzZWFyY2ggb3BlcmF0aW9uc1xuICAgICAqIHdpdGggbWFueSBvcHRpb25zLiAgVGhleSBhcmUgY29udmVydGVkXG4gICAgICogaW50byBhIHNlbGVjdEFsbCBzdGF0ZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBzZWFyY2gob3B0aW9ucyk6IFByb21pc2U8QXJyYXk8RG9jdW1lbnQ+PiB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHNlYXJjaCBgLCBvcHRpb25zKTtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuICAgICAgICBjb25zdCB2cGF0aHNTZWVuID0gbmV3IFNldCgpO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdG9yID0ge1xuICAgICAgICAgICAgYW5kOiBbXVxuICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgaWYgKG9wdGlvbnMubWltZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm1pbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3IuYW5kLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBtaW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcTogb3B0aW9ucy5taW1lXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLm1pbWUpKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3IuYW5kLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBtaW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0luOiBvcHRpb25zLm1pbWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSAvKiBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEluY29ycmVjdCBNSU1FIGNoZWNrICR7b3B0aW9ucy5taW1lfWApO1xuICAgICAgICAgICAgfSAqL1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBvcHRpb25zLnJlbmRlcnNUb0hUTUwgPT09ICdib29sZWFuJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgICAgICAgICByZW5kZXJzVG9IVE1MOiB7XG4gICAgICAgICAgICAgICAgICAgIGVxOiBvcHRpb25zLnJlbmRlcnNUb0hUTUxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucz8ucm9vdFBhdGggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBzZWxlY3Rvci5hbmQucHVzaCh7XG4gICAgICAgICAgICAgICAgcmVuZGVyUGF0aDoge1xuICAgICAgICAgICAgICAgICAgICBpc0xpa2U6IGAke29wdGlvbnMucm9vdFBhdGh9JWBcbiAgICAgICAgICAgICAgICAgICAgLy8gc3FsOiBgIHJlbmRlclBhdGggbGlrZSAnJHtvcHRpb25zLnJvb3RQYXRofSUnIGBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZvciBnbG9iIGFuZCByZW5kZXJnbG9iIGhhbmRsZVxuICAgICAgICAvLyBzdHJpbmdzIHdpdGggc2luZ2xlLXF1b3RlIGNoYXJhY3RlcnNcbiAgICAgICAgLy8gYXMgcGVyIGRpc2N1c3Npb24gaW4gZG9jdW1lbnRzV2l0aFRhZ1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIG9wdGlvbnMuZ2xvYlxuICAgICAgICAgJiYgdHlwZW9mIG9wdGlvbnMuZ2xvYiA9PT0gJ3N0cmluZydcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBzZWxlY3Rvci5hbmQucHVzaCh7XG4gICAgICAgICAgICAgICAgc3FsOiBgVC52cGF0aCBHTE9CICcke29wdGlvbnMuZ2xvYi5pbmRleE9mKFwiJ1wiKSA+PSAwXG4gICAgICAgICAgICAgICAgICAgID8gb3B0aW9ucy5nbG9iLnJlcGxhY2VBbGwoXCInXCIsIFwiJydcIilcbiAgICAgICAgICAgICAgICAgICAgOiBvcHRpb25zLmdsb2J9J2BcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgb3B0aW9ucy5yZW5kZXJnbG9iXG4gICAgICAgICAmJiB0eXBlb2Ygb3B0aW9ucy5yZW5kZXJnbG9iID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgICAgICAgICBzcWw6IGBULnJlbmRlclBhdGggR0xPQiAnJHtvcHRpb25zLnJlbmRlcmdsb2IuaW5kZXhPZihcIidcIikgPj0gMFxuICAgICAgICAgICAgICAgID8gb3B0aW9ucy5yZW5kZXJnbG9iLnJlcGxhY2VBbGwoXCInXCIsIFwiJydcIilcbiAgICAgICAgICAgICAgICA6IG9wdGlvbnMucmVuZGVyZ2xvYn0nYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZWdleFNRTCA9IHtcbiAgICAgICAgICAgIG9yOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFRoaXMgaXMgYXMgYSBzcGVjaWFsIGZhdm9yIHRvXG4gICAgICAgIC8vIEBha2FzaGFjbXMvcGx1Z2lucy1ibG9nLXBvZGNhc3QuICBUaGVcbiAgICAgICAgLy8gYmxvZ3RhZyBtZXRhZGF0YSB2YWx1ZSBpcyBleHBlbnNpdmUgdG9cbiAgICAgICAgLy8gc2VhcmNoIGZvciBhcyBhIGZpZWxkIGluIHRoZSBKU09OXG4gICAgICAgIC8vIG1ldGFkYXRhLiAgQnkgcHJvbW90aW5nIHRoaXMgdG8gYVxuICAgICAgICAvLyByZWd1bGFyIGZpZWxkIGl0IGJlY29tZXMgYSByZWd1bGFyXG4gICAgICAgIC8vIFNRTCBxdWVyeSBvbiBhIGZpZWxkIHdoZXJlIHRoZXJlXG4gICAgICAgIC8vIGNhbiBiZSBhbiBpbmRleC5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMuYmxvZ3RhZ3MgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAmJiB0eXBlb2Ygb3B0aW9ucy5ibG9ndGFncyA9PT0gJ3N0cmluZydcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIGJsb2d0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuYmxvZ3RhZ3MpfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBvcHRpb25zLmJsb2d0YWdzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zLmJsb2d0YWdzKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgICAgICAgICBibG9ndGFnOiB7XG4gICAgICAgICAgICAgICAgICAgIGlzSW46IG9wdGlvbnMuYmxvZ3RhZ3NcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBvcHRpb25zLmJsb2d0YWcgPT09ICdzdHJpbmcnXG4gICAgICAgICkge1xuICAgICAgICAgICAgc2VsZWN0b3IuYW5kLnB1c2goe1xuICAgICAgICAgICAgICAgIGJsb2d0YWc6IHtcbiAgICAgICAgICAgICAgICAgICAgZXE6IG9wdGlvbnMuYmxvZ3RhZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBpcyBwb3NzaWJseSBhIHdheSB0byBpbXBsZW1lbnQgb3B0aW9ucy50YWcuXG4gICAgICAgIC8vIFRoZSBjb2RlIGlzIGRlcml2ZWQgZnJvbSB0aGUgc3FsaXRlM29ybSBkb2N1bWVudGF0aW9uLlxuICAgICAgICAvLyBpZiAoXG4gICAgICAgIC8vICAgICBvcHRpb25zLnRhZ1xuICAgICAgICAvLyAgICAgJiYgdHlwZW9mIG9wdGlvbnMudGFnID09PSAnc3RyaW5nJ1xuICAgICAgICAvLyApIHtcbiAgICAgICAgLy8gICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgLy8gICAgICAgICBzcWw6IGBcbiAgICAgICAgLy8gICAgIEVYSVNUUyAoXG4gICAgICAgIC8vICAgICAgICAgU0VMRUNUIDFcbiAgICAgICAgLy8gICAgICAgICBGUk9NIFRBR0dMVUUgdGdcbiAgICAgICAgLy8gICAgICAgICBXSEVSRSB0Zy50YWdOYW1lID0gJHtvcHRpb25zLnRhZ31cbiAgICAgICAgLy8gICAgIClcbiAgICAgICAgLy8gICAgIGB9KTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBvcHRpb25zLnBhdGhtYXRjaCA9PT0gJ3N0cmluZydcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICBzcWw6IGAgdnBhdGggcmVnZXhwICcke29wdGlvbnMucGF0aG1hdGNofScgYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBvcHRpb25zLnBhdGhtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgIHNxbDogYCB2cGF0aCByZWdleHAgJyR7b3B0aW9ucy5wYXRobWF0Y2guc291cmNlfScgYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5wYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNxbDogYCB2cGF0aCByZWdleHAgJyR7bWF0Y2h9JyBgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhTUUwub3IucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcWw6IGAgdnBhdGggcmVnZXhwICcke21hdGNoLnNvdXJjZX0nIGBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBwYXRobWF0Y2ggcmVnZXhwICR7dXRpbC5pbnNwZWN0KG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoJ3BhdGhtYXRjaCcgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgLy8gVGhlcmUncyBhIHBhdGhtYXRjaCBmaWVsZCwgdGhhdFxuICAgICAgICAgICAgLy8gaXNuJ3QgY29ycmVjdFxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCBwYXRobWF0Y2ggJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5wYXRobWF0Y2gpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMubGF5b3V0cykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5sYXlvdXRzKVxuICAgICAgICAgICAgICYmIG9wdGlvbnMubGF5b3V0cy5sZW5ndGggPj0gMlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBsYXlvdXQgb2Ygb3B0aW9ucy5sYXlvdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5b3V0OiB7IGVxOiBsYXlvdXQgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5sYXlvdXQpXG4gICAgICAgICAgICAgJiYgb3B0aW9ucy5sYXlvdXRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3IuYW5kLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBsYXlvdXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVxOiBvcHRpb25zLmxheW91dHNbMF1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rvci5hbmQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxheW91dDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXE6IG9wdGlvbnMubGF5b3V0c1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdHRlbXB0aW5nIHRvIGRvIHRoZSBmb2xsb3dpbmc6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0IHZwYXRoLCByZW5kZXJQYXRoIGZyb20gRE9DVU1FTlRTIHdoZXJlIHJlbmRlclBhdGggcmVnZXhwICcvaW5kZXguaHRtbCQnO1xuICAgICAgICAvLyBoaWVyLWJyb2tlL2RpcjEvZGlyMi9pbmRleC5odG1sLm1kfGhpZXItYnJva2UvZGlyMS9kaXIyL2luZGV4Lmh0bWxcbiAgICAgICAgLy8gaGllci9kaXIxL2RpcjIvaW5kZXguaHRtbC5tZHxoaWVyL2RpcjEvZGlyMi9pbmRleC5odG1sXG4gICAgICAgIC8vIGhpZXIvZGlyMS9pbmRleC5odG1sLm1kfGhpZXIvZGlyMS9pbmRleC5odG1sXG4gICAgICAgIC8vIGhpZXIvaW1nZGlyL2luZGV4Lmh0bWwubWR8aGllci9pbWdkaXIvaW5kZXguaHRtbFxuICAgICAgICAvLyBoaWVyL2luZGV4Lmh0bWwubWR8aGllci9pbmRleC5odG1sXG4gICAgICAgIC8vIHN1YmRpci9pbmRleC5odG1sLm1kfHN1YmRpci9pbmRleC5odG1sXG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnJHtvcHRpb25zLnJlbmRlcnBhdGhtYXRjaH0nIGBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICBzcWw6IGAgcmVuZGVyUGF0aCByZWdleHAgJyR7b3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlfScgYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnJHttYXRjaH0nIGBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnJHttYXRjaC5zb3VyY2V9JyBgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdyZW5kZXJwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVnZXhTUUwub3IubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHsgb3I6IHJlZ2V4U1FMLm9yIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZWN0b3IuYW5kKVxuICAgICAgICAgJiYgc2VsZWN0b3IuYW5kLmxlbmd0aCA8PSAwXG4gICAgICAgICkge1xuICAgICAgICAgICAgZGVsZXRlIHNlbGVjdG9yLmFuZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKHV0aWwuaW5zcGVjdChzZWxlY3Rvci5hbmQsIGZhbHNlLCAxMCkpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBiYXNlZCBvbiB0aGluZ3Mgd2UgY2FuIHF1ZXJ5XG4gICAgICAgIC8vIGRpcmVjdGx5IGZyb20gIHRoZSBEb2N1bWVudCBvYmplY3QuXG4gICAgICAgIGxldCByZXN1bHQxO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbChcbiAgICAgICAgICAgICAgICBzZWxlY3RvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLnNlYXJjaCBjYXVnaHQgZXJyb3IgaW4gc2VsZWN0QWxsIHdpdGggc2VsZWN0b3IgJHt1dGlsLmluc3BlY3Qoc2VsZWN0b3IsIGZhbHNlLCAxMCl9IC0gJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdDEubGVuZ3RoKTtcblxuICAgICAgICAvLyBJZiB0aGUgc2VhcmNoIG9wdGlvbnMgaW5jbHVkZSBsYXlvdXQocylcbiAgICAgICAgLy8gd2UgY2hlY2sgZG9jTWV0YWRhdGEubGF5b3V0XG4gICAgICAgIC8vIE5PVyBNT1ZFRCBBQk9WRVxuICAgICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0MTtcblxuICAgICAgICAvLyBUT0RPIC0gcmV3cml0ZSBhZ2FpbnN0IHRhZ3MgY29sdW1uXG4gICAgICAgIC8vICAgYW5kIHRoZSB0YWdnbHVlIHRhYmxlXG4gICAgICAgIC8vICAgSEVOQ0UgdGhpcyBzaG91bGQgYmUgbW92YWJsZSB0byBTUUxcblxuICAgICAgICAvLyBDaGVjayBmb3IgbWF0Y2ggYWdhaW5zdCB0YWdzXG4gICAgICAgIGNvbnN0IHJlc3VsdDMgPVxuXG4gICAgICAgIC8vIEZpcnN0IC0gTm8gZXhpc3RpbmcgY29kZSB1c2VzIHRoaXMgZmVhdHVyZS5cbiAgICAgICAgLy8gU2Vjb25kIC0gVGFncyBoYXZlIGJlZW4gcmVkZXNpZ25lZC4gIFVudGlsIG5vdyxcbiAgICAgICAgLy8gICAgXCJpdGVtLnRhZ3NcIiBhbmQgXCJpdGVtLmRvY01ldGFkYXRhLnRhZ3NcIiBhcmVcbiAgICAgICAgLy8gICAgYXJyYXlzLiAgU1FMSVRFIGRvZXNuJ3QgaGF2ZSBhIGZpZWxkIHR5cGUgZm9yXG4gICAgICAgIC8vICAgIGFycmF5cywgYW5kIHRoZXJlZm9yZSBpdCdzIHN0b3JlZCBhcyBKU09OLCB3aGljaFxuICAgICAgICAvLyAgICBpcyBzbG93IGZvciBjb21wYXJpc29ucy5cbiAgICAgICAgLy8gVGhpcmQgLSB0aGUgbmV3IGRlc2lnbiwgVEFHR0xVRSwgd2lsbCBoYXZlIG9uZSByb3dcbiAgICAgICAgLy8gICAgZm9yIGVhY2ggdGFnIGluIGVhY2ggZG9jdW1lbnQuICBIZW5jZSBpdCdzXG4gICAgICAgIC8vICAgIHRyaXZpYWwgdG8gZmluZCBhbGwgZG9jdW1lbnRzIHdpdGggYSBnaXZlbiB0YWdcbiAgICAgICAgLy8gICAgdXNpbmcgU1FMLlxuICAgICAgICAvLyBGb3VydGggLSBUaGUgdGVzdCBzdWl0ZSBpbmNsdWRlcyB0ZXN0cyBmb3JcbiAgICAgICAgLy8gICAgdGhpcyBmZWF0dXJlLlxuICAgICAgICAvLyBGaWZ0aCAtIHRoZXJlIGlzIGEgcG9zc2libGUgU1FMIGltcGxlbWVudGF0aW9uXG4gICAgICAgIC8vICAgIGVhcmxpZXIgaW4gdGhlIGNvZGUuXG5cbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRhZ1xuICAgICAgICAgICAgICAgICYmIHR5cGVvZiBvcHRpb25zLnRhZyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICkgPyByZXN1bHQyLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS52cGF0aFxuICAgICAgICAgICAgICAgICAmJiBpdGVtLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIGl0ZW0uZG9jTWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KGl0ZW0uZG9jTWV0YWRhdGEudGFncylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uZG9jTWV0YWRhdGEudGFncy5pbmNsdWRlcyhvcHRpb25zLnRhZykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICA6IHJlc3VsdDI7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0NCA9IHJlc3VsdDM7XG4gICAgICAgICAgICAvLyAoXG4gICAgICAgICAgICAvLyAgICAgb3B0aW9ucy5yb290UGF0aFxuICAgICAgICAgICAgLy8gICYmIHR5cGVvZiBvcHRpb25zLnJvb3RQYXRoID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgLy8gKSA/IHJlc3VsdDMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gICAgIGlmIChpdGVtLnZwYXRoXG4gICAgICAgICAgICAvLyAgICAgICYmIGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gICAgICkge1xuICAgICAgICAgICAgLy8gICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoICR7aXRlbS52cGF0aH0gJHtpdGVtLnJlbmRlclBhdGh9ICR7b3B0aW9ucy5yb290UGF0aH1gKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgaWYgKGl0ZW0ucmVuZGVyUGF0aC5zdGFydHNXaXRoKG9wdGlvbnMucm9vdFBhdGgpKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgLy8gOiByZXN1bHQzO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDUgPSByZXN1bHQ0O1xuICAgICAgICAvLyBUaGlzIGlzIG5vdyBTUUxcbiAgICAgICAgICAgIC8vIChcbiAgICAgICAgICAgIC8vICAgICBvcHRpb25zLmdsb2JcbiAgICAgICAgICAgIC8vICAmJiB0eXBlb2Ygb3B0aW9ucy5nbG9iID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgLy8gKSA/IHJlc3VsdDQuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gICAgIGlmIChpdGVtLnZwYXRoKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHJldHVybiBtaWNyb21hdGNoLmlzTWF0Y2goaXRlbS52cGF0aCwgb3B0aW9ucy5nbG9iKTtcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgIC8vIDogcmVzdWx0NDtcblxuICAgICAgICBjb25zdCByZXN1bHQ2ID0gcmVzdWx0NTtcbiAgICAgICAgLy8gVGhpcyBpcyBub3cgU1FMXG4gICAgICAgICAgICAvLyAoXG4gICAgICAgICAgICAvLyAgICAgb3B0aW9ucy5yZW5kZXJnbG9iXG4gICAgICAgICAgICAvLyAmJiB0eXBlb2Ygb3B0aW9ucy5yZW5kZXJnbG9iID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgLy8gKSA/IHJlc3VsdDUuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gICAgIGlmIChpdGVtLnJlbmRlclBhdGgpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgcmV0dXJuIG1pY3JvbWF0Y2guaXNNYXRjaChpdGVtLnJlbmRlclBhdGgsIG9wdGlvbnMucmVuZGVyZ2xvYik7XG4gICAgICAgICAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgICAvLyA6IHJlc3VsdDU7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0NyA9XG4gICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5yZW5kZXJlcnNcbiAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVyZXJzKVxuICAgICAgICAgICAgKSA/IHJlc3VsdDYuZmlsdGVyKGl0ZW0gPT4ge1xuXG4gICAgICAgICAgICAgICAgbGV0IHJlbmRlcmVyID0gZmNhY2hlLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGl0ZW0udnBhdGgpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJlciBmb3IgJHtvYmoudnBhdGh9IGAsIHJlbmRlcmVyKTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlbmRlcmVyKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHIgb2Ygb3B0aW9ucy5yZW5kZXJlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNoZWNrIHJlbmRlcmVyICR7dHlwZW9mIHJ9ICR7cmVuZGVyZXIubmFtZX0gJHtyZW5kZXJlciBpbnN0YW5jZW9mIHJ9YCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICYmIHIgPT09IHJlbmRlcmVyLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgciA9PT0gJ29iamVjdCdcbiAgICAgICAgICAgICAgICAgICAgIHx8IHR5cGVvZiByID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdXQVJOSU5HOiBNYXRjaGluZyByZW5kZXJlciBieSBvYmplY3QgY2xhc3MgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCcsIHIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICA6IHJlc3VsdDY7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0OCA9XG4gICAgICAgICAgICAob3B0aW9ucy5maWx0ZXJmdW5jKVxuICAgICAgICAgICAgPyByZXN1bHQ3LmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5maWx0ZXJmdW5jKFxuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgICAgICBpdGVtXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICA6IHJlc3VsdDc7XG5cbiAgICAgICAgXG4gICAgICAgIGxldCByZXN1bHQ5ID0gcmVzdWx0ODtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMuc29ydEJ5ID09PSAnc3RyaW5nJ1xuICAgICAgICAgJiYgKFxuICAgICAgICAgICAgIG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25EYXRlJ1xuICAgICAgICAgIHx8IG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25UaW1lJ1xuICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlc3VsdDkgPSByZXN1bHQ4LnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgYURhdGUgPSBhLm1ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgJiYgYS5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICAgICAgPyBuZXcgRGF0ZShhLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgOiBuZXcgRGF0ZShhLm10aW1lTXMpO1xuICAgICAgICAgICAgICAgIGxldCBiRGF0ZSA9IGIubWV0YWRhdGEgXG4gICAgICAgICAgICAgICAgICAgICAgICAgJiYgYi5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICAgICAgPyBuZXcgRGF0ZShiLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgOiBuZXcgRGF0ZShiLm10aW1lTXMpO1xuICAgICAgICAgICAgICAgIGlmIChhRGF0ZSA9PT0gYkRhdGUpIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGlmIChhRGF0ZSA+IGJEYXRlKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgaWYgKGFEYXRlIDwgYkRhdGUpIHJldHVybiAxO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICB0eXBlb2Ygb3B0aW9ucy5zb3J0QnkgPT09ICdzdHJpbmcnXG4gICAgICAgICAmJiBvcHRpb25zLnNvcnRCeSA9PT0gJ2Rpcm5hbWUnXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmVzdWx0OSA9IHJlc3VsdDguc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhLmRpcm5hbWUgPT09IGIuZGlybmFtZSkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgaWYgKGEuZGlybmFtZSA8IGIuZGlybmFtZSkgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIGlmIChhLmRpcm5hbWUgPiBiLmRpcm5hbWUpIHJldHVybiAxO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzdWx0OWEgPSByZXN1bHQ5O1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc29ydEZ1bmMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJlc3VsdDlhID0gcmVzdWx0OS5zb3J0KG9wdGlvbnMuc29ydEZ1bmMpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdDEwID0gcmVzdWx0OWE7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBvcHRpb25zLnNvcnRCeURlc2NlbmRpbmcgPT09ICdib29sZWFuJ1xuICAgICAgICAgfHwgdHlwZW9mIG9wdGlvbnMucmV2ZXJzZSA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRCeURlc2NlbmRpbmcgPT09ICdib29sZWFuJ1xuICAgICAgICAgICAgICYmIG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0MTAgPSByZXN1bHQ5YS5yZXZlcnNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmV2ZXJzZSA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgICAgICAgJiYgb3B0aW9ucy5yZXZlcnNlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQxMCA9IHJlc3VsdDlhLnJldmVyc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQxMSA9IHJlc3VsdDEwO1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub2Zmc2V0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgcmVzdWx0MTEgPSByZXN1bHQxMC5zbGljZShvcHRpb25zLm9mZnNldCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzdWx0MTIgPSByZXN1bHQxMTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxpbWl0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgcmVzdWx0MTIgPSByZXN1bHQxMS5zbGljZShcbiAgICAgICAgICAgICAgICAwLCBvcHRpb25zLmxpbWl0IC0gMVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQxMjtcbiAgICB9XG5cbiAgICAvLyBTa2lwIHRhZ3MgZm9yIG5vdy4gIFNob3VsZCBiZSBlYXN5LlxuXG4gICAgLy8gRm9yIHRhZ3Mgc3VwcG9ydCwgdGhpcyBjYW4gYmUgdXNlZnVsXG4gICAgLy8gIC0tIGh0dHBzOi8vYW50b256Lm9yZy9qc29uLXZpcnR1YWwtY29sdW1ucy9cbiAgICAvLyBJdCBzaG93cyBob3cgdG8gZG8gZ2VuZXJhdGVkIGNvbHVtbnNcbiAgICAvLyBmcm9tIGZpZWxkcyBpbiBKU09OXG5cbiAgICAvLyBCdXQsIGhvdyB0byBkbyBnZW5lcmF0ZWQgY29sdW1uc1xuICAgIC8vIHVzaW5nIFNRTElURTNPUk0/XG5cbiAgICAvLyBodHRwczovL2FudG9uei5vcmcvc3FsZWFuLXJlZ2V4cC8gLS0gUmVnRXhwXG4gICAgLy8gZXh0ZW5zaW9uIGZvciBTUUxJVEUzXG5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYXNnMDE3L3NxbGl0ZS1yZWdleCBpbmNsdWRlc1xuICAgIC8vIGEgbm9kZS5qcyBwYWNrYWdlXG4gICAgLy8gaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvc3FsaXRlLXJlZ2V4XG59XG5cbmV4cG9ydCB2YXIgYXNzZXRzQ2FjaGU6IEJhc2VGaWxlQ2FjaGU8IEFzc2V0LCB0eXBlb2YgYXNzZXRzREFPPjtcbmV4cG9ydCB2YXIgcGFydGlhbHNDYWNoZTogVGVtcGxhdGVzRmlsZUNhY2hlPFBhcnRpYWwsIHR5cGVvZiBwYXJ0aWFsc0RBTz47XG5leHBvcnQgdmFyIGxheW91dHNDYWNoZTogVGVtcGxhdGVzRmlsZUNhY2hlPExheW91dCwgdHlwZW9mIGxheW91dHNEQU8+O1xuZXhwb3J0IHZhciBkb2N1bWVudHNDYWNoZTogRG9jdW1lbnRzRmlsZUNhY2hlO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAoXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uXG4pOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgIGFzc2V0c0NhY2hlID0gbmV3IEJhc2VGaWxlQ2FjaGU8QXNzZXQsIFRhc3NldHNEQU8+KFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdhc3NldHMnLFxuICAgICAgICBjb25maWcuYXNzZXREaXJzLFxuICAgICAgICBhc3NldHNEQU9cbiAgICApO1xuICAgIGF3YWl0IGFzc2V0c0NhY2hlLnNldHVwKCk7XG5cbiAgICBhc3NldHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChhcmdzKX1gKVxuICAgIH0pO1xuXG4gICAgcGFydGlhbHNDYWNoZSA9IG5ldyBUZW1wbGF0ZXNGaWxlQ2FjaGU8XG4gICAgICAgICAgICBQYXJ0aWFsLCBUcGFydGlhbHNEQU9cbiAgICA+KFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdwYXJ0aWFscycsXG4gICAgICAgIGNvbmZpZy5wYXJ0aWFsc0RpcnMsXG4gICAgICAgIHBhcnRpYWxzREFPXG4gICAgKTtcbiAgICBhd2FpdCBwYXJ0aWFsc0NhY2hlLnNldHVwKCk7XG5cbiAgICBwYXJ0aWFsc0NhY2hlLm9uKCdlcnJvcicsICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYHBhcnRpYWxzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIGxheW91dHNDYWNoZSA9IG5ldyBUZW1wbGF0ZXNGaWxlQ2FjaGU8XG4gICAgICAgICAgICBMYXlvdXQsIFRsYXlvdXRzREFPXG4gICAgPihcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAnbGF5b3V0cycsXG4gICAgICAgIGNvbmZpZy5sYXlvdXREaXJzLFxuICAgICAgICBsYXlvdXRzREFPXG4gICAgKTtcbiAgICBhd2FpdCBsYXlvdXRzQ2FjaGUuc2V0dXAoKTtcblxuICAgIGxheW91dHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGBEb2N1bWVudHNGaWxlQ2FjaGUgJ2RvY3VtZW50cycgJHt1dGlsLmluc3BlY3QoY29uZmlnLmRvY3VtZW50RGlycyl9YCk7XG5cbiAgICBkb2N1bWVudHNDYWNoZSA9IG5ldyBEb2N1bWVudHNGaWxlQ2FjaGUoXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2RvY3VtZW50cycsXG4gICAgICAgIGNvbmZpZy5kb2N1bWVudERpcnNcbiAgICApO1xuICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLnNldHVwKCk7XG5cbiAgICBkb2N1bWVudHNDYWNoZS5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3VtZW50c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGVycil9YCk7XG4gICAgfSk7XG5cbiAgICBhd2FpdCBjb25maWcuaG9va1BsdWdpbkNhY2hlU2V0dXAoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsb3NlRmlsZUNhY2hlcygpIHtcbiAgICBpZiAoZG9jdW1lbnRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgZG9jdW1lbnRzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgZG9jdW1lbnRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChhc3NldHNDYWNoZSkge1xuICAgICAgICBhd2FpdCBhc3NldHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBhc3NldHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGxheW91dHNDYWNoZSkge1xuICAgICAgICBhd2FpdCBsYXlvdXRzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgbGF5b3V0c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAocGFydGlhbHNDYWNoZSkge1xuICAgICAgICBhd2FpdCBwYXJ0aWFsc0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIHBhcnRpYWxzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxufVxuIl19