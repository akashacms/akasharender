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
import url from 'node:url';
import FS from 'fs';
import EventEmitter from 'events';
import micromatch from 'micromatch';
import { field, id, index, table, schema, BaseDAO } from 'sqlite3orm';
import { sqdb } from '../sqdb.js';
import fastq from 'fastq';
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
let TagGlue = class TagGlue {
};
__decorate([
    field({ name: 'docvpath', dbtype: 'TEXT' })
    // @fk('tag_docvpath', 'DOCUMENTS', 'vpath')
    ,
    index('tagglue_vpath'),
    __metadata("design:type", String)
], TagGlue.prototype, "docvpath", void 0);
__decorate([
    field({ name: 'tagName', dbtype: 'TEXT' })
    // @fk('tag_slug', 'TAGS', 'slug')
    ,
    index('tagglue_name'),
    __metadata("design:type", String)
], TagGlue.prototype, "tagName", void 0);
TagGlue = __decorate([
    table({ name: 'TAGGLUE' })
], TagGlue);
await schema().createTable(sqdb, 'TAGGLUE');
export const tagGlueDAO = new BaseDAO(TagGlue, sqdb);
// @table({ name: 'TAGS' })
// class Tag {
//     @field({
//         name: 'tagname',
//         dbtype: 'TEXT'
//     })
//     tagname: string;
//     @id({
//         name: 'slug', dbtype: 'TEXT'
//     })
//     @index('tag_slug')
//     slug: string;
//     @field({
//         name: 'description', dbtype: 'TEXT'
//     })
//     description?: string;
// }
// await schema().createTable(sqdb, 'TAGS');
// const tagsDAO = new BaseDAO<Tag>(Tag, sqdb);
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
                    let pRootUrl = url.parse(this.config.root_url);
                    pRootUrl.pathname = path.normalize(path.join(pRootUrl.pathname, info.metadata.document.renderTo));
                    info.metadata.rendered_url = url.format(pRootUrl);
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
        await tagGlueDAO.deleteAll({
            docvpath: vpath
        });
    }
    async addDocTagGlue(vpath, tags) {
        for (const tag of tags) {
            const glue = await tagGlueDAO.insert({
                docvpath: vpath,
                tagName: tag
            });
            // console.log('addDocTagGlue', glue);
        }
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
            info,
        };
        await this.dao.update(docInfo);
        await this.deleteDocTagGlue(docInfo.vpath);
        await this.addDocTagGlue(docInfo.vpath, docInfo.tags);
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
            info,
        };
        await this.dao.insert(docInfo);
        await this.addDocTagGlue(docInfo.vpath, docInfo.tags);
    }
    async handleUnlinked(name, info) {
        await super.handleUnlinked(name, info);
        await this.deleteDocTagGlue(info.vpath);
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
        let tagstring = ` ( ${tags.map(t => {
            return `'${t.indexOf("'") >= 0
                ? t.replaceAll("'", "''")
                : t}'`;
        }).join(',')} ) `;
        // console.log(`documentsWithTag ${util.inspect(tags)} ${tagstring}`);
        // ${tagstring} is an encoding of the tags passed as
        // parameters as something SQLITE can use with an IN operator.
        //
        //  WHERE tagName IN ( 'Tag1', 'Tag2' )
        //
        // When the tag names have single or double quotes some special
        // care is required as discussed above. 
        const res = await this.dao.sqldb.all(`
            SELECT DISTINCT docvpath AS vpath
            FROM TAGGLUE
            WHERE tagName IN ${tagstring}
        `);
        // console.log(res);
        if (!Array.isArray(res)) {
            throw new Error(`documentsWithTag non-Array result ${util.inspect(res)}`);
        }
        const vpaths = res.map(r => {
            return r.vpath;
        });
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
        // const res = await this.dao.sqldb.all(`
        //     SELECT
        //         DISTINCT json_extract(docMetadata, '$.tags') AS tags
        //     FROM DOCUMENTS, json_each(tags)
        // `) as unknown as Array<{
        //     tags: string[]
        // }>;
        const res = await this.dao.sqldb.all(`
            SELECT DISTINCT tagName FROM TAGGLUE
        `);
        const tags = res.map(tag => {
            return tag.tagName;
        });
        // console.log(res);
        // The query above produces this result:
        //
        // {
        //     tags: '["Tag1","Tag2","Tag3"]'
        // },
        // {
        //     tags: '["Tag-string-1","Tag-string-2","Tag-string-3"]'
        // }
        //
        // In other words, the tags array arrives
        // as JSON which we must parse.
        // const tags = new Set();
        // for (const item of res) {
        //     if (!('tags' in item)) continue;
        //     let tagsP = [];
        //     if (typeof item.tags === 'string') {
        //         tagsP = JSON.parse(item.tags);
        //     } else if (Array.isArray(item.tags)) {
        //         tagsP = item.tags;
        //     }
        //     for (const tag of tagsP) {
        //         tags.add(tag);
        //     }
        // }
        // The Set class made sure to weed out
        // duplicate tags.  With Array.from
        // we can make the set into an array
        // which can be sorted.
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
                        in: options.mime
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
        const regexSQL = {
            or: []
        };
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
        // console.log(selector);
        // Select based on things we can query
        // directly from  the Document object.
        let result1;
        try {
            result1 = await this.dao.selectAll(selector);
        }
        catch (err) {
            throw new Error(`DocumentsFileCache.search caught error in selectAll with selector ${util.inspect(selector)} - ${err.message}`);
        }
        // If the search options include layout(s)
        // we check docMetadata.layout
        // NOW MOVED ABOVE
        const result2 = result1;
        // Check for match against tags
        const result3 = (options.tag
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
        const result5 = (options.glob
            && typeof options.glob === 'string') ? result4.filter(item => {
            if (item.vpath) {
                return micromatch.isMatch(item.vpath, options.glob);
            }
            else {
                return false;
            }
        })
            : result4;
        const result6 = (options.renderglob
            && typeof options.renderglob === 'string') ? result5.filter(item => {
            if (item.renderPath) {
                return micromatch.isMatch(item.renderPath, options.renderglob);
            }
            else {
                return false;
            }
        })
            : result5;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1jYWNoZS1zcWxpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvZmlsZS1jYWNoZS1zcWxpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsT0FBTyxFQUFFLFdBQVcsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUM3RSxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sR0FBRyxNQUFPLFVBQVUsQ0FBQztBQUU1QixPQUFPLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDcEIsT0FBTyxZQUFZLE1BQU0sUUFBUSxDQUFDO0FBQ2xDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUdwQyxPQUFPLEVBQ0gsS0FBSyxFQUdMLEVBQUUsRUFDRixLQUFLLEVBQ0wsS0FBSyxFQUdMLE1BQU0sRUFDTixPQUFPLEVBR1YsTUFBTSxZQUFZLENBQUM7QUFFcEIsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFlBQVksQ0FBQztBQUVsQyxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFFMUIsMEJBQTBCO0FBTW5CLElBQU0sS0FBSyxHQUFYLE1BQU0sS0FBSztDQXVEakIsQ0FBQTtBQWhERztJQUpDLEVBQUUsQ0FBQztRQUNBLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU07S0FDaEMsQ0FBQztJQUNELEtBQUssQ0FBQyxhQUFhLENBQUM7O29DQUNQO0FBS2Q7SUFIQyxLQUFLLENBQUM7UUFDSCxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNO0tBQy9CLENBQUM7O21DQUNXO0FBTWI7SUFKQyxLQUFLLENBQUM7UUFDSCxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNO0tBQ2xDLENBQUM7SUFDRCxLQUFLLENBQUMsZUFBZSxDQUFDOztzQ0FDUDtBQU1oQjtJQUpDLEtB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QUFFLENBQUMsQ0FBQztJQUMvRCxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sTUFBTSxDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDeEMsQ0FBQztBQUVELE1BQU0sQ0FBQyxLQUFLLFVBQVUsZUFBZTtJQUNqQyxJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQ2pCLE1BQU0sY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzdCLGNBQWMsR0FBRyxTQUFTLENBQUM7SUFDL0IsQ0FBQztJQUNELElBQUksV0FBVyxFQUFFLENBQUM7UUFDZCxNQUFNLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMxQixXQUFXLEdBQUcsU0FBUyxDQUFDO0lBQzVCLENBQUM7SUFDRCxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ2YsTUFBTSxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDM0IsWUFBWSxHQUFHLFNBQVMsQ0FBQztJQUM3QixDQUFDO0lBQ0QsSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUNoQixNQUFNLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM1QixhQUFhLEdBQUcsU0FBUyxDQUFDO0lBQzlCLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgeyBEaXJzV2F0Y2hlciwgZGlyVG9XYXRjaCwgVlBhdGhEYXRhIH0gZnJvbSAnQGFrYXNoYWNtcy9zdGFja2VkLWRpcnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgdXJsICBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gJ2ZzJztcbmltcG9ydCBGUyBmcm9tICdmcyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcbmltcG9ydCBTcWxTdHJpbmcgZnJvbSAnc3Fsc3RyaW5nJztcblxuaW1wb3J0IHtcbiAgICBmaWVsZCxcbiAgICBGaWVsZE9wdHMsXG4gICAgZmssXG4gICAgaWQsXG4gICAgaW5kZXgsXG4gICAgdGFibGUsXG4gICAgVGFibGVPcHRzLFxuICAgIFNxbERhdGFiYXNlLFxuICAgIHNjaGVtYSxcbiAgICBCYXNlREFPLFxuICAgIEZpbHRlcixcbiAgICBXaGVyZVxufSBmcm9tICdzcWxpdGUzb3JtJztcblxuaW1wb3J0IHsgc3FkYiB9IGZyb20gJy4uL3NxZGIuanMnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4uL2luZGV4LmpzJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5cbi8vLy8vLy8vLy8vLy8gQXNzZXRzIHRhYmxlXG5cbkB0YWJsZSh7XG4gICAgbmFtZTogJ0FTU0VUUycsXG4gICAgd2l0aG91dFJvd0lkOiB0cnVlLFxufSBhcyBUYWJsZU9wdHMpXG5leHBvcnQgY2xhc3MgQXNzZXQge1xuXG4gICAgLy8gUHJpbWFyeSBrZXlcbiAgICBAaWQoe1xuICAgICAgICBuYW1lOiAndnBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF92cGF0aCcpXG4gICAgdnBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtaW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIG1pbWU6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfbW91bnRlZCcpXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50UG9pbnQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF9tb3VudFBvaW50JylcbiAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X3BhdGhJbk1vdW50ZWQnKVxuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdmc3BhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF9mc3BhdGgnKVxuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlclBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF9yZW5kZXJQYXRoJylcbiAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbXRpbWVNcycsXG4gICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuICAgIH0pXG4gICAgbXRpbWVNczogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvOiBhbnk7XG5cbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0FTU0VUUycpO1xudHlwZSBUYXNzZXRzREFPID0gQmFzZURBTzxBc3NldD47XG5leHBvcnQgY29uc3QgYXNzZXRzREFPOiBUYXNzZXRzREFPXG4gICAgPSBuZXcgQmFzZURBTzxBc3NldD4oQXNzZXQsIHNxZGIpO1xuXG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X3ZwYXRoJyk7XG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X21vdW50ZWQnKTtcbmF3YWl0IGFzc2V0c0RBTy5jcmVhdGVJbmRleCgnYXNzZXRfbW91bnRQb2ludCcpO1xuYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9wYXRoSW5Nb3VudGVkJyk7XG5hd2FpdCBhc3NldHNEQU8uY3JlYXRlSW5kZXgoJ2Fzc2V0X2ZzcGF0aCcpO1xuYXdhaXQgYXNzZXRzREFPLmNyZWF0ZUluZGV4KCdhc3NldF9yZW5kZXJQYXRoJyk7XG5cbi8vLy8vLy8vLy8vLyBQYXJ0aWFscyBUYWJsZVxuXG5AdGFibGUoe1xuICAgIG5hbWU6ICdQQVJUSUFMUycsXG4gICAgd2l0aG91dFJvd0lkOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBQYXJ0aWFsIHtcblxuICAgIC8vIFByaW1hcnkga2V5XG4gICAgQGlkKHtcbiAgICAgICAgbmFtZTogJ3ZwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF92cGF0aCcpXG4gICAgdnBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtaW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIG1pbWU6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9tb3VudGVkJylcbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfbW91bnRQb2ludCcpXG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3BhdGhJbk1vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX3BhdGhJbk1vdW50ZWQnKVxuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdmc3BhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX2ZzcGF0aCcpXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfcmVuZGVyUGF0aCcpXG4gICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbiAgICB9KVxuICAgIG10aW1lTXM6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQ29udGVudCcsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY0NvbnRlbnQ6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NCb2R5JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jQm9keTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgbWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdpbmZvJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgaW5mbzogYW55O1xufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnUEFSVElBTFMnKTtcbnR5cGUgVHBhcnRpYWxzREFPID0gQmFzZURBTzxQYXJ0aWFsPjtcbmV4cG9ydCBjb25zdCBwYXJ0aWFsc0RBT1xuICAgID0gbmV3IEJhc2VEQU88UGFydGlhbD4oUGFydGlhbCwgc3FkYik7XG5cbmF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX3ZwYXRoJyk7XG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9tb3VudGVkJyk7XG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9tb3VudFBvaW50Jyk7XG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9wYXRoSW5Nb3VudGVkJyk7XG5hd2FpdCBwYXJ0aWFsc0RBTy5jcmVhdGVJbmRleCgncGFydGlhbF9mc3BhdGgnKTtcbmF3YWl0IHBhcnRpYWxzREFPLmNyZWF0ZUluZGV4KCdwYXJ0aWFsX3JlbmRlclBhdGgnKTtcblxuLy8vLy8vLy8vLy8vLy8vLy8gTGF5b3V0cyBUYWJsZVxuXG5AdGFibGUoe1xuICAgIG5hbWU6ICdMQVlPVVRTJyxcbiAgICB3aXRob3V0Um93SWQ6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIExheW91dCB7XG5cbiAgICAvLyBQcmltYXJ5IGtleVxuICAgIEBpZCh7XG4gICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF92cGF0aCcpXG4gICAgdnBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtaW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIG1pbWU6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnbGF5b3V0X21vdW50ZWQnKVxuICAgIG1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudFBvaW50JywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnbGF5b3V0X21vdW50UG9pbnQnKVxuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnbGF5b3V0X3BhdGhJbk1vdW50ZWQnKVxuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdmc3BhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfZnNwYXRoJylcbiAgICBmc3BhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdyZW5kZXJQYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnbGF5b3V0X3JlbmRlclBhdGgnKVxuICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtdGltZU1zJyxcbiAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4gICAgfSlcbiAgICBtdGltZU1zOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jTWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBkb2NNZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY0NvbnRlbnQnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBkb2NDb250ZW50OiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQm9keScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY0JvZHk6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIG1ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnaW5mbycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGluZm86IGFueTtcblxufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnTEFZT1VUUycpO1xudHlwZSBUbGF5b3V0c0RBTyA9IEJhc2VEQU88TGF5b3V0PjtcbmV4cG9ydCBjb25zdCBsYXlvdXRzREFPXG4gICAgPSBuZXcgQmFzZURBTzxMYXlvdXQ+KExheW91dCwgc3FkYik7XG5cbmF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF92cGF0aCcpO1xuYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X21vdW50ZWQnKTtcbmF3YWl0IGxheW91dHNEQU8uY3JlYXRlSW5kZXgoJ2xheW91dF9tb3VudFBvaW50Jyk7XG5hd2FpdCBsYXlvdXRzREFPLmNyZWF0ZUluZGV4KCdsYXlvdXRfcGF0aEluTW91bnRlZCcpO1xuYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X2ZzcGF0aCcpO1xuYXdhaXQgbGF5b3V0c0RBTy5jcmVhdGVJbmRleCgnbGF5b3V0X3JlbmRlclBhdGgnKTtcblxuLy8vLy8vLy8vLy8vLy8vIERvY3VtZW50cyBUYWJsZVxuXG5AdGFibGUoe1xuICAgIG5hbWU6ICdET0NVTUVOVFMnLFxuICAgIHdpdGhvdXRSb3dJZDogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgRG9jdW1lbnQge1xuXG4gICAgLy8gUHJpbWFyeSBrZXlcbiAgICBAaWQoe1xuICAgICAgICBuYW1lOiAndnBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX3ZwYXRoJylcbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21pbWUnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgbWltZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX21vdW50ZWQnKVxuICAgIG1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudFBvaW50JywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19tb3VudFBvaW50JylcbiAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfcGF0aEluTW91bnRlZCcpXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfZnNwYXRoJylcbiAgICBmc3BhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdyZW5kZXJQYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19yZW5kZXJQYXRoJylcbiAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyc1RvSFRNTCcsIGRidHlwZTogJ0lOVEVHRVInXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfcmVuZGVyc1RvSFRNTCcpXG4gICAgcmVuZGVyc1RvSFRNTDogYm9vbGVhbjtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkaXJuYW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19kaXJuYW1lJylcbiAgICBkaXJuYW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncGFyZW50RGlyJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19wYXJlbnREaXInKVxuICAgIHBhcmVudERpcjogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbiAgICB9KVxuICAgIG10aW1lTXM6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQ29udGVudCcsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IGZhbHNlXG4gICAgfSlcbiAgICBkb2NDb250ZW50OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQm9keScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IGZhbHNlXG4gICAgfSlcbiAgICBkb2NCb2R5OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBtZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3RhZ3MnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICB0YWdzOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbGF5b3V0JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogZmFsc2VcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19sYXlvdXQnKVxuICAgIGxheW91dDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvOiBhbnk7XG5cbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0RPQ1VNRU5UUycpO1xudHlwZSBUZG9jdW1lbnRzc0RBTyA9IEJhc2VEQU88RG9jdW1lbnQ+O1xuZXhwb3J0IGNvbnN0IGRvY3VtZW50c0RBT1xuICAgID0gbmV3IEJhc2VEQU88RG9jdW1lbnQ+KERvY3VtZW50LCBzcWRiKTtcblxuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3ZwYXRoJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfbW91bnRlZCcpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX21vdW50UG9pbnQnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19wYXRoSW5Nb3VudGVkJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfZnNwYXRoJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfcmVuZGVyUGF0aCcpO1xuYXdhaXQgZG9jdW1lbnRzREFPLmNyZWF0ZUluZGV4KCdkb2NzX3JlbmRlcnNUb0hUTUwnKTtcbmF3YWl0IGRvY3VtZW50c0RBTy5jcmVhdGVJbmRleCgnZG9jc19kaXJuYW1lJyk7XG5hd2FpdCBkb2N1bWVudHNEQU8uY3JlYXRlSW5kZXgoJ2RvY3NfcGFyZW50RGlyJyk7XG5cbkB0YWJsZSh7IG5hbWU6ICdUQUdHTFVFJyB9KVxuY2xhc3MgVGFnR2x1ZSB7XG5cbiAgICBAZmllbGQoeyBuYW1lOiAnZG9jdnBhdGgnLCBkYnR5cGU6ICdURVhUJyB9KVxuICAgIC8vIEBmaygndGFnX2RvY3ZwYXRoJywgJ0RPQ1VNRU5UUycsICd2cGF0aCcpXG4gICAgQGluZGV4KCd0YWdnbHVlX3ZwYXRoJylcbiAgICBkb2N2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHsgbmFtZTogJ3RhZ05hbWUnLCBkYnR5cGU6ICdURVhUJyB9KVxuICAgIC8vIEBmaygndGFnX3NsdWcnLCAnVEFHUycsICdzbHVnJylcbiAgICBAaW5kZXgoJ3RhZ2dsdWVfbmFtZScpXG4gICAgdGFnTmFtZTogc3RyaW5nO1xufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnVEFHR0xVRScpO1xuZXhwb3J0IGNvbnN0IHRhZ0dsdWVEQU8gPSBuZXcgQmFzZURBTzxUYWdHbHVlPihUYWdHbHVlLCBzcWRiKTtcblxuLy8gQHRhYmxlKHsgbmFtZTogJ1RBR1MnIH0pXG4vLyBjbGFzcyBUYWcge1xuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICd0YWduYW1lJyxcbi8vICAgICAgICAgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIHRhZ25hbWU6IHN0cmluZztcblxuLy8gICAgIEBpZCh7XG4vLyAgICAgICAgIG5hbWU6ICdzbHVnJywgZGJ0eXBlOiAnVEVYVCdcbi8vICAgICB9KVxuLy8gICAgIEBpbmRleCgndGFnX3NsdWcnKVxuLy8gICAgIHNsdWc6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdkZXNjcmlwdGlvbicsIGRidHlwZTogJ1RFWFQnXG4vLyAgICAgfSlcbi8vICAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbi8vIH1cblxuLy8gYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ1RBR1MnKTtcbi8vIGNvbnN0IHRhZ3NEQU8gPSBuZXcgQmFzZURBTzxUYWc+KFRhZywgc3FkYik7XG5cblxuLy8gQ29udmVydCBBa2FzaGFDTVMgbW91bnQgcG9pbnRzIGludG8gdGhlIG1vdW50cG9pbnRcbi8vIHVzZWQgYnkgRGlyc1dhdGNoZXJcbmNvbnN0IHJlbWFwZGlycyA9IGRpcnogPT4ge1xuICAgIHJldHVybiBkaXJ6Lm1hcChkaXIgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZG9jdW1lbnQgZGlyICcsIGRpcik7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogJy8nLFxuICAgICAgICAgICAgICAgIGJhc2VNZXRhZGF0YToge31cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWRpci5kZXN0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZW1hcGRpcnMgaW52YWxpZCBtb3VudCBzcGVjaWZpY2F0aW9uICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5zcmMsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLmRlc3QsXG4gICAgICAgICAgICAgICAgYmFzZU1ldGFkYXRhOiBkaXIuYmFzZU1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGlnbm9yZTogZGlyLmlnbm9yZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUeXBlIGZvciByZXR1cm4gZnJvbSBwYXRocyBtZXRob2QuICBUaGUgZmllbGRzIGhlcmVcbiAqIGFyZSB3aGF0cyBpbiB0aGUgQXNzZXQvTGF5b3V0L1BhcnRpYWwgY2xhc3NlcyBhYm92ZVxuICogcGx1cyBhIGNvdXBsZSBmaWVsZHMgdGhhdCBvbGRlciBjb2RlIGV4cGVjdGVkXG4gKiBmcm9tIHRoZSBwYXRocyBtZXRob2QuXG4gKi9cbmV4cG9ydCB0eXBlIFBhdGhzUmV0dXJuVHlwZSA9IHtcbiAgICB2cGF0aDogc3RyaW5nLFxuICAgIG1pbWU6IHN0cmluZyxcbiAgICBtb3VudGVkOiBzdHJpbmcsXG4gICAgbW91bnRQb2ludDogc3RyaW5nLFxuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZyxcbiAgICBtdGltZU1zOiBzdHJpbmcsXG4gICAgaW5mbzogYW55LFxuICAgIC8vIFRoZXNlIHdpbGwgYmUgY29tcHV0ZWQgaW4gQmFzZUZpbGVDYWNoZVxuICAgIC8vIFRoZXkgd2VyZSByZXR1cm5lZCBpbiBwcmV2aW91cyB2ZXJzaW9ucy5cbiAgICBmc3BhdGg6IHN0cmluZyxcbiAgICByZW5kZXJQYXRoOiBzdHJpbmdcbn07XG5cbmV4cG9ydCBjbGFzcyBCYXNlRmlsZUNhY2hlPFxuICAgICAgICBUIGV4dGVuZHMgQXNzZXQgfCBMYXlvdXQgfCBQYXJ0aWFsIHwgRG9jdW1lbnQsXG4gICAgICAgIFRkYW8gZXh0ZW5kcyBCYXNlREFPPFQ+XG4+IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICAgICNjb25maWc/OiBDb25maWd1cmF0aW9uO1xuICAgICNuYW1lPzogc3RyaW5nO1xuICAgICNkaXJzPzogZGlyVG9XYXRjaFtdO1xuICAgICNpc19yZWFkeTogYm9vbGVhbiA9IGZhbHNlO1xuICAgICNjYWNoZV9jb250ZW50OiBib29sZWFuO1xuICAgICNtYXBfcmVuZGVycGF0aDogYm9vbGVhbjtcbiAgICAjZGFvOiBUZGFvOyAvLyBCYXNlREFPPFQ+O1xuXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gY29uZmlnIEFrYXNoYVJlbmRlciBDb25maWd1cmF0aW9uIG9iamVjdFxuICAgICAqIEBwYXJhbSBkaXJzIGFycmF5IG9mIGRpcmVjdG9yaWVzIGFuZCBtb3VudCBwb2ludHMgdG8gd2F0Y2hcbiAgICAgKiBAcGFyYW0gbmFtZSBzdHJpbmcgZ2l2aW5nIHRoZSBuYW1lIGZvciB0aGlzIHdhdGNoZXIgbmFtZVxuICAgICAqIEBwYXJhbSBkYW8gVGhlIFNRTElURTNPUk0gREFPIGluc3RhbmNlIHRvIHVzZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZGlyczogZGlyVG9XYXRjaFtdLFxuICAgICAgICBkYW86IFRkYW8gLy8gQmFzZURBTzxUPlxuICAgICkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQmFzZUZpbGVDYWNoZSAke25hbWV9IGNvbnN0cnVjdG9yIGRpcnM9JHt1dGlsLmluc3BlY3QoZGlycyl9YCk7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy4jbmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuI2RpcnMgPSBkaXJzO1xuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNjYWNoZV9jb250ZW50ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuI21hcF9yZW5kZXJwYXRoID0gZmFsc2U7XG4gICAgICAgIHRoaXMuI2RhbyA9IGRhbztcbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCkgICAgIHsgcmV0dXJuIHRoaXMuI2NvbmZpZzsgfVxuICAgIGdldCBuYW1lKCkgICAgICAgeyByZXR1cm4gdGhpcy4jbmFtZTsgfVxuICAgIGdldCBkaXJzKCkgICAgICAgeyByZXR1cm4gdGhpcy4jZGlyczsgfVxuICAgIHNldCBjYWNoZUNvbnRlbnQoZG9pdCkgeyB0aGlzLiNjYWNoZV9jb250ZW50ID0gZG9pdDsgfVxuICAgIGdldCBnYWNoZUNvbnRlbnQoKSB7IHJldHVybiB0aGlzLiNjYWNoZV9jb250ZW50OyB9XG4gICAgc2V0IG1hcFJlbmRlclBhdGgoZG9pdCkgeyB0aGlzLiNtYXBfcmVuZGVycGF0aCA9IGRvaXQ7IH1cbiAgICBnZXQgbWFwUmVuZGVyUGF0aCgpIHsgcmV0dXJuIHRoaXMuI21hcF9yZW5kZXJwYXRoOyB9XG4gICAgZ2V0IGRhbygpOiBUZGFvIHsgcmV0dXJuIHRoaXMuI2RhbzsgfVxuXG4gICAgLy8gU0tJUDogZ2V0RHluYW1pY1ZpZXdcblxuXG4gICAgI3dhdGNoZXI6IERpcnNXYXRjaGVyO1xuICAgICNxdWV1ZTtcblxuICAgIGFzeW5jIGNsb3NlKCkge1xuICAgICAgICBpZiAodGhpcy4jcXVldWUpIHtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlLmtpbGxBbmREcmFpbigpO1xuICAgICAgICAgICAgdGhpcy4jcXVldWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuI3dhdGNoZXIpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDTE9TSU5HICR7dGhpcy5uYW1lfWApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy4jd2F0Y2hlci5jbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy4jd2F0Y2hlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygnY2hhbmdlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygnYWRkZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3VubGlua2VkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZWFkeScpO1xuXG4gICAgICAgIGF3YWl0IHNxZGIuY2xvc2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdXAgcmVjZWl2aW5nIGV2ZW50cyBmcm9tIERpcnNXYXRjaGVyLCBhbmQgZGlzcGF0Y2hpbmcgdG9cbiAgICAgKiB0aGUgaGFuZGxlciBtZXRob2RzLlxuICAgICAqL1xuICAgIGFzeW5jIHNldHVwKCkge1xuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGlmICh0aGlzLiN3YXRjaGVyKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiN3YXRjaGVyLmNsb3NlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNxdWV1ZSA9IGZhc3RxLnByb21pc2UoYXN5bmMgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuY29kZSA9PT0gJ2NoYW5nZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNoYW5nZSAke2V2ZW50Lm5hbWV9ICR7ZXZlbnQuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZUNoYW5nZWQoZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdjaGFuZ2UnLCBldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdhZGRlZCcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgYWRkICR7ZXZlbnQubmFtZX0gJHtldmVudC5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlQWRkZWQoZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdhZGQnLCBldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICd1bmxpbmtlZCcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgdW5saW5rICR7ZXZlbnQubmFtZX0gJHtldmVudC5pbmZvLnZwYXRofWAsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlVW5saW5rZWQoZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCd1bmxpbmsnLCBldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBldmVudC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlRXJyb3IoZXZlbnQubmFtZSkgKi9cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ3JlYWR5Jykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVSZWFkeShldmVudC5uYW1lKTtcbiAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgncmVhZHknLCBldmVudC5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTApO1xuXG4gICAgICAgIHRoaXMuI3dhdGNoZXIgPSBuZXcgRGlyc1dhdGNoZXIodGhpcy5uYW1lKTtcblxuICAgICAgICB0aGlzLiN3YXRjaGVyLm9uKCdjaGFuZ2UnLCBhc3luYyAobmFtZSwgaW5mbykgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gY2hhbmdlZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFVTSCAke25hbWV9IGNoYW5nZWQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICdjaGFuZ2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ2NoYW5nZScgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIGNoYW5nZSAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignYWRkJywgYXN5bmMgKG5hbWUsIGluZm8pID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gYWRkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFBVU0ggJHtuYW1lfSBhZGQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICdhZGRlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICdhZGQnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCBhZGQgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ3VubGluaycsIGFzeW5jIChuYW1lLCBpbmZvKSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgdW5saW5rICR7bmFtZX0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICd1bmxpbmtlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICd1bmxpbmsnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgdW5saW5rICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdyZWFkeScsIGFzeW5jIChuYW1lKSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtuYW1lfSByZWFkeWApO1xuICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgY29kZTogJ3JlYWR5JyxcbiAgICAgICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gcmVtYXBkaXJzKHRoaXMuZGlycyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZXR1cCAke3RoaXMuI25hbWV9IHdhdGNoICR7dXRpbC5pbnNwZWN0KHRoaXMuI2RpcnMpfSA9PT4gJHt1dGlsLmluc3BlY3QobWFwcGVkKX1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy4jd2F0Y2hlci53YXRjaChtYXBwZWQpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBEQU8gJHt0aGlzLmRhby50YWJsZS5uYW1lfSAke3V0aWwuaW5zcGVjdCh0aGlzLmRhby50YWJsZS5maWVsZHMpfWApO1xuXG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbzogVCkge1xuICAgICAgICAvLyBQbGFjZWhvbGRlciB3aGljaCBzb21lIHN1YmNsYXNzZXNcbiAgICAgICAgLy8gYXJlIGV4cGVjdGVkIHRvIG92ZXJyaWRlXG5cbiAgICAgICAgaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVDaGFuZ2VkKG5hbWUsIGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVDaGFuZ2VkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmICh0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBPT09PT09PT0dBISEhIFJlY2VpdmVkIGEgZmlsZSB0aGF0IHNob3VsZCBiZSBpbmdvcmVkIGAsIGluZm8pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlQ2hhbmdlZCBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBoYW5kbGVDaGFuZ2VkICR7aW5mby52cGF0aH0gJHtpbmZvLm1ldGFkYXRhICYmIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID8gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgOiAnPz8/J31gKTtcblxuICAgICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGluZm8pO1xuICAgICAgICBpbmZvLnN0YWNrID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgICAgICB2cGF0aDogeyBlcTogaW5mby52cGF0aCB9LFxuICAgICAgICAgICAgbW91bnRlZDogeyBlcTogaW5mby5tb3VudGVkIH1cbiAgICAgICAgfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICFBcnJheS5pc0FycmF5KHJlc3VsdClcbiAgICAgICAgIHx8IHJlc3VsdC5sZW5ndGggPD0gMFxuICAgICAgICApIHtcbiAgICAgICAgICAgIC8vIEl0IHdhc24ndCBmb3VuZCBpbiB0aGUgZGF0YWJhc2UuICBIZW5jZVxuICAgICAgICAgICAgLy8gd2Ugc2hvdWxkIGFkZCBpdC5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUFkZGVkKG5hbWUsIGluZm8pO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVEb2NJbkRCKGluZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUNoYW5nZWQobmFtZSwgaW5mbyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoaW5mbykge1xuICAgICAgICBhd2FpdCB0aGlzLiNkYW8udXBkYXRlKHtcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIC8vIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfSBhcyBUKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXZSByZWNlaXZlIHRoaXM6XG4gICAgICpcbiAgICAgKiB7XG4gICAgICogICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICogICAgdnBhdGg6IHZwYXRoLFxuICAgICAqICAgIG1pbWU6IG1pbWUuZ2V0VHlwZShmc3BhdGgpLFxuICAgICAqICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAqICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAqICAgIHBhdGhJbk1vdW50ZWQ6IGNvbXB1dGVkIHJlbGF0aXZlIHBhdGhcbiAgICAgKiAgICBzdGFjazogWyBhcnJheSBvZiB0aGVzZSBpbnN0YW5jZXMgXVxuICAgICAqIH1cbiAgICAgKlxuICAgICAqIE5lZWQgdG8gYWRkOlxuICAgICAqICAgIHJlbmRlclBhdGhcbiAgICAgKiAgICBBbmQgZm9yIEhUTUwgcmVuZGVyIGZpbGVzLCBhZGQgdGhlIGJhc2VNZXRhZGF0YSBhbmQgZG9jTWV0YWRhdGFcbiAgICAgKlxuICAgICAqIFNob3VsZCByZW1vdmUgdGhlIHN0YWNrLCBzaW5jZSBpdCdzIGxpa2VseSBub3QgdXNlZnVsIHRvIHVzLlxuICAgICAqL1xuXG4gICAgYXN5bmMgaGFuZGxlQWRkZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyAgY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVBZGRlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgT09PT09PT09HQSEhISBSZWNlaXZlZCBhIGZpbGUgdGhhdCBzaG91bGQgYmUgaW5nb3JlZCBgLCBpbmZvKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZUFkZGVkIGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdhdGhlckluZm9EYXRhKGluZm8pO1xuICAgICAgICBpbmZvLnN0YWNrID0gdW5kZWZpbmVkO1xuICAgICAgICBhd2FpdCB0aGlzLmluc2VydERvY1RvREIoaW5mbyk7XG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmhvb2tGaWxlQWRkZWQobmFtZSwgaW5mbyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbykge1xuICAgICAgICBhd2FpdCB0aGlzLiNkYW8uaW5zZXJ0KHtcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIC8vIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfSBhcyBUKTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVVbmxpbmtlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlVW5saW5rZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVVbmxpbmtlZCBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVVbmxpbmtlZChuYW1lLCBpbmZvKTtcblxuICAgICAgICBhd2FpdCB0aGlzLiNkYW8uZGVsZXRlQWxsKHtcbiAgICAgICAgICAgIHZwYXRoOiB7IGVxOiBpbmZvLnZwYXRoIH0sXG4gICAgICAgICAgICBtb3VudGVkOiB7IGVxOiBpbmZvLm1vdW50ZWQgfVxuICAgICAgICB9IGFzIFdoZXJlPFQ+KTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVSZWFkeShuYW1lKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlUmVhZHlgKTtcbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVSZWFkeSBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuI2lzX3JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0KCdyZWFkeScsIG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGRpcmVjdG9yeSBtb3VudCBjb3JyZXNwb25kaW5nIHRvIHRoZSBmaWxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBpbmZvXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBmaWxlRGlyTW91bnQoaW5mbykge1xuICAgICAgICBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgbWFwcGVkKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZGlyTW91bnQgZm9yICR7aW5mby52cGF0aH0gLS0gJHt1dGlsLmluc3BlY3QoaW5mbyl9ID09PSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICAgICAgaWYgKGluZm8ubW91bnRQb2ludCA9PT0gZGlyLm1vdW50UG9pbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2hvdWxkIHRoaXMgZmlsZSBiZSBpZ25vcmVkLCBiYXNlZCBvbiB0aGUgYGlnbm9yZWAgZmllbGRcbiAgICAgKiBpbiB0aGUgbWF0Y2hpbmcgYGRpcmAgbW91bnQgZW50cnkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGluZm9cbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGlnbm9yZUZpbGUoaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgIGNvbnN0IGRpck1vdW50ID0gdGhpcy5maWxlRGlyTW91bnQoaW5mbyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH0gZGlyTW91bnQgJHt1dGlsLmluc3BlY3QoZGlyTW91bnQpfWApO1xuICAgICAgICBsZXQgaWdub3JlID0gZmFsc2U7XG4gICAgICAgIGlmIChkaXJNb3VudCkge1xuXG4gICAgICAgICAgICBsZXQgaWdub3JlcztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGlyTW91bnQuaWdub3JlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBbIGRpck1vdW50Lmlnbm9yZSBdO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRpck1vdW50Lmlnbm9yZSkpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gZGlyTW91bnQuaWdub3JlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaWdub3Jlcykge1xuICAgICAgICAgICAgICAgIGlmIChtaWNyb21hdGNoLmlzTWF0Y2goaW5mby52cGF0aCwgaSkpIGlnbm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRpck1vdW50Lmlnbm9yZSAke2ZzcGF0aH0gJHtpfSA9PiAke2lnbm9yZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIChpZ25vcmUpIGNvbnNvbGUubG9nKGBNVVNUIGlnbm9yZSBGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlIGZvciAke2luZm8udnBhdGh9ID09PiAke2lnbm9yZX1gKTtcbiAgICAgICAgICAgIHJldHVybiBpZ25vcmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBubyBtb3VudD8gIHRoYXQgbWVhbnMgc29tZXRoaW5nIHN0cmFuZ2VcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYE5vIGRpck1vdW50IGZvdW5kIGZvciAke2luZm8udnBhdGh9IC8gJHtpbmZvLmRpck1vdW50ZWRPbn1gKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxsb3cgYSBjYWxsZXIgdG8gd2FpdCB1bnRpbCB0aGUgPGVtPnJlYWR5PC9lbT4gZXZlbnQgaGFzXG4gICAgICogYmVlbiBzZW50IGZyb20gdGhlIERpcnNXYXRjaGVyIGluc3RhbmNlLiAgVGhpcyBldmVudCBtZWFucyB0aGVcbiAgICAgKiBpbml0aWFsIGluZGV4aW5nIGhhcyBoYXBwZW5lZC5cbiAgICAgKi9cbiAgICBhc3luYyBpc1JlYWR5KCkge1xuICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIGRpcmVjdG9yaWVzLCB0aGVyZSB3b24ndCBiZSBhbnkgZmlsZXMgXG4gICAgICAgIC8vIHRvIGxvYWQsIGFuZCBubyBuZWVkIHRvIHdhaXRcbiAgICAgICAgd2hpbGUgKHRoaXMuI2RpcnMubGVuZ3RoID4gMCAmJiAhdGhpcy4jaXNfcmVhZHkpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZG9lcyBhIDEwMG1zIHBhdXNlXG4gICAgICAgICAgICAvLyBUaGF0IGxldHMgdXMgY2hlY2sgaXNfcmVhZHkgZXZlcnkgMTAwbXNcbiAgICAgICAgICAgIC8vIGF0IHZlcnkgbGl0dGxlIGNvc3RcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAhaXNSZWFkeSAke3RoaXMubmFtZX0gJHt0aGlzW19zeW1iX2RpcnNdLmxlbmd0aH0gJHt0aGlzW19zeW1iX2lzX3JlYWR5XX1gKTtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBhc3luYyBwYXRocyhyb290UGF0aD86IHN0cmluZylcbiAgICAgICAgOiBQcm9taXNlPEFycmF5PFBhdGhzUmV0dXJuVHlwZT4+XG4gICAge1xuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG5cbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIC8vIFRoaXMgaXMgY29waWVkIGZyb20gdGhlIG9sZGVyIHZlcnNpb25cbiAgICAgICAgLy8gKExva2lKUyB2ZXJzaW9uKSBvZiB0aGlzIGZ1bmN0aW9uLiAgSXRcbiAgICAgICAgLy8gc2VlbXMgbWVhbnQgdG8gZWxpbWluYXRlIGR1cGxpY2F0ZXMuXG4gICAgICAgIGNvbnN0IHZwYXRoc1NlZW4gPSBuZXcgU2V0KCk7XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB7XG4gICAgICAgICAgICBvcmRlcjogeyBtdGltZU1zOiB0cnVlIH1cbiAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIGlmICh0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnXG4gICAgICAgICYmIHJvb3RQLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICBzZWxlY3Rvci5yZW5kZXJQYXRoID0ge1xuICAgICAgICAgICAgICAgIGlzTGlrZTogYCR7cm9vdFB9JWBcbiAgICAgICAgICAgICAgICAvLyBzcWw6IGAgcmVuZGVyUGF0aCByZWdleHAgJ14ke3Jvb3RQfScgYFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGF0aHMgJHt1dGlsLmluc3BlY3Qoc2VsZWN0b3IpfWApO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoc2VsZWN0b3IpO1xuICAgICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0LmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXRocyA/aWdub3JlPyAke2l0ZW0udnBhdGh9YCk7XG4gICAgICAgICAgICBpZiAoZmNhY2hlLmlnbm9yZUZpbGUoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodnBhdGhzU2Vlbi5oYXMoKGl0ZW0gYXMgQXNzZXQpLnZwYXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdnBhdGhzU2Vlbi5hZGQoKGl0ZW0gYXMgQXNzZXQpLnZwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdDMgPSByZXN1bHQyLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgLy8gICAgIC8vIFdlIG5lZWQgdGhlc2UgdG8gYmUgb25lIG9mIHRoZSBjb25jcmV0ZVxuICAgICAgICAvLyAgICAgLy8gdHlwZXMgc28gdGhhdCB0aGUgbXRpbWVNcyBmaWVsZCBpc1xuICAgICAgICAvLyAgICAgLy8gcmVjb2duaXplZCBieSBUeXBlU2NyaXB0LiAgVGhlIEFzc2V0XG4gICAgICAgIC8vICAgICAvLyBjbGFzcyBpcyBhIGdvb2Qgc3Vic3RpdHV0ZSBmb3IgdGhlIGJhc2VcbiAgICAgICAgLy8gICAgIC8vIGNsYXNzIG9mIGNhY2hlZCBmaWxlcy5cbiAgICAgICAgLy8gICAgIGNvbnN0IGFhID0gPEFzc2V0PmE7XG4gICAgICAgIC8vICAgICBjb25zdCBiYiA9IDxBc3NldD5iO1xuICAgICAgICAvLyAgICAgaWYgKGFhLm10aW1lTXMgPCBiYi5tdGltZU1zKSByZXR1cm4gMTtcbiAgICAgICAgLy8gICAgIGlmIChhYS5tdGltZU1zID09PSBiYi5tdGltZU1zKSByZXR1cm4gMDtcbiAgICAgICAgLy8gICAgIGlmIChhYS5tdGltZU1zID4gYmIubXRpbWVNcykgcmV0dXJuIC0xO1xuICAgICAgICAvLyB9KTtcblxuICAgICAgICAvLyBUaGlzIHN0YWdlIGNvbnZlcnRzIHRoZSBpdGVtcyBcbiAgICAgICAgLy8gcmVjZWl2ZWQgYnkgdGhpcyBmdW5jdGlvbiBpbnRvXG4gICAgICAgIC8vIHdoYXQgaXMgcmVxdWlyZWQgZnJvbVxuICAgICAgICAvLyB0aGUgcGF0aHMgbWV0aG9kLlxuICAgICAgICAvLyBjb25zdCByZXN1bHQ0XG4gICAgICAgIC8vICAgICAgICAgPSBuZXcgQXJyYXk8UGF0aHNSZXR1cm5UeXBlPigpO1xuICAgICAgICAvLyBmb3IgKGNvbnN0IGl0ZW0gb2YgcmVzdWx0Mykge1xuICAgICAgICAvLyAgICAgcmVzdWx0NC5wdXNoKDxQYXRoc1JldHVyblR5cGU+e1xuICAgICAgICAvLyAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAvLyAgICAgICAgIG1pbWU6IGl0ZW0ubWltZSxcbiAgICAgICAgLy8gICAgICAgICBtb3VudGVkOiBpdGVtLm1vdW50ZWQsXG4gICAgICAgIC8vICAgICAgICAgbW91bnRQb2ludDogaXRlbS5tb3VudFBvaW50LFxuICAgICAgICAvLyAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGl0ZW0ucGF0aEluTW91bnRlZCxcbiAgICAgICAgLy8gICAgICAgICBtdGltZU1zOiBpdGVtLm10aW1lTXMsXG4gICAgICAgIC8vICAgICAgICAgaW5mbzogaXRlbS5pbmZvLFxuICAgICAgICAvLyAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGl0ZW0ubW91bnRlZCwgaXRlbS5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgLy8gICAgICAgICByZW5kZXJQYXRoOiBpdGVtLnZwYXRoXG4gICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHJlc3VsdDIvKi5tYXAoaXRlbSA9PiB7XG4gICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAvLyAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAvLyAgICAgICAgIG10aW1lTXM6IGl0ZW0ubXRpbWVNc1xuICAgICAgICAvLyAgICAgfTtcbiAgICAgICAgLy8gfSkgKi8pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGZpbGUgd2l0aGluIHRoZSBjYWNoZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggVGhlIHZwYXRoIG9yIHJlbmRlclBhdGggdG8gbG9vayBmb3JcbiAgICAgKiBAcmV0dXJucyBib29sZWFuIHRydWUgaWYgZm91bmQsIGZhbHNlIG90aGVyd2lzZVxuICAgICAqL1xuICAgIGFzeW5jIGZpbmQoX2ZwYXRoKTogUHJvbWlzZTxUPiB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfZnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmQgcGFyYW1ldGVyIG5vdCBzdHJpbmcgJHt0eXBlb2YgX2ZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAgICAgb3I6IFtcbiAgICAgICAgICAgICAgICB7IHZwYXRoOiB7IGVxOiBmcGF0aCB9fSxcbiAgICAgICAgICAgICAgICB7IHJlbmRlclBhdGg6IHsgZXE6IGZwYXRoIH19XG4gICAgICAgICAgICBdXG4gICAgICAgIH0gYXMgRmlsdGVyPFQ+KTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZCAke19mcGF0aH0gJHtmcGF0aH0gPT0+IHJlc3VsdDEgJHt1dGlsLmluc3BlY3QocmVzdWx0MSl9IGApO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDIgPSByZXN1bHQxLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmQgJHtfZnBhdGh9ICR7ZnBhdGh9ID09PiByZXN1bHQyICR7dXRpbC5pbnNwZWN0KHJlc3VsdDIpfSBgKTtcblxuICAgICAgICBsZXQgcmV0O1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldCA9IHJlc3VsdDJbMF07XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQyKSAmJiByZXN1bHQyLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICByZXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXQgPSByZXN1bHQyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgI2ZFeGlzdHNJbkRpcihmcGF0aCwgZGlyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGAjZkV4aXN0c0luRGlyICR7ZnBhdGh9ICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgIGlmIChkaXIubW91bnRQb2ludCA9PT0gJy8nKSB7XG4gICAgICAgICAgICBjb25zdCBmc3BhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgZGlyLm1vdW50ZWQsIGZwYXRoXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzTXRpbWU6IHN0YXRzLm10aW1lTXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1wID0gZGlyLm1vdW50UG9pbnQuc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IGRpci5tb3VudFBvaW50LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgOiBkaXIubW91bnRQb2ludDtcbiAgICAgICAgbXAgPSBtcC5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IG1wXG4gICAgICAgICAgICA6IChtcCsnLycpO1xuXG4gICAgICAgIGlmIChmcGF0aC5zdGFydHNXaXRoKG1wKSkge1xuICAgICAgICAgICAgbGV0IHBhdGhJbk1vdW50ZWRcbiAgICAgICAgICAgICAgICA9IGZwYXRoLnJlcGxhY2UoZGlyLm1vdW50UG9pbnQsICcnKTtcbiAgICAgICAgICAgIGxldCBmc3BhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgZGlyLm1vdW50ZWQsIHBhdGhJbk1vdW50ZWQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENoZWNraW5nIGV4aXN0IGZvciAke2Rpci5tb3VudFBvaW50fSAke2Rpci5tb3VudGVkfSAke3BhdGhJbk1vdW50ZWR9ICR7ZnNwYXRofWApO1xuICAgICAgICAgICAgbGV0IGZzZXhpc3RzID0gRlMuZXhpc3RzU3luYyhmc3BhdGgpO1xuXG4gICAgICAgICAgICBpZiAoZnNleGlzdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSBGUy5zdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8VlBhdGhEYXRhPiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogc3RhdHMubXRpbWVNc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZ1bGZpbGxzIHRoZSBcImZpbmRcIiBvcGVyYXRpb24gbm90IGJ5XG4gICAgICogbG9va2luZyBpbiB0aGUgZGF0YWJhc2UsIGJ1dCBieSBzY2FubmluZ1xuICAgICAqIHRoZSBmaWxlc3lzdGVtIHVzaW5nIHN5bmNocm9ub3VzIGNhbGxzLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBmaW5kU3luYyhfZnBhdGgpOiBWUGF0aERhdGEgfCB1bmRlZmluZWQge1xuXG4gICAgICAgIGlmICh0eXBlb2YgX2ZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaW5kIHBhcmFtZXRlciBub3Qgc3RyaW5nICR7dHlwZW9mIF9mcGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRTeW5jIGxvb2tpbmcgZm9yICR7ZnBhdGh9IGluICR7dXRpbC5pbnNwZWN0KG1hcHBlZCl9YCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgbWFwcGVkKSB7XG4gICAgICAgICAgICBpZiAoIShkaXI/Lm1vdW50UG9pbnQpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBmaW5kU3luYyBiYWQgZGlycyBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmRpcnMpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZm91bmQgPSB0aGlzLiNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcik7XG4gICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZFN5bmMgJHtmcGF0aH0gZm91bmRgLCBmb3VuZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgYXN5bmMgZmluZEFsbCgpIHtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICB9IGFzIEZpbHRlcjxUPik7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MiA9IHJlc3VsdDEuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRBbGwgP2lnbm9yZT8gJHtpdGVtLnZwYXRofWApO1xuICAgICAgICAgICAgcmV0dXJuICEoZmNhY2hlLmlnbm9yZUZpbGUoaXRlbSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDI7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgIFQgZXh0ZW5kcyBMYXlvdXQgfCBQYXJ0aWFsLFxuICAgIFRkYW8gZXh0ZW5kcyBCYXNlREFPPFQ+PlxuICAgIGV4dGVuZHMgQmFzZUZpbGVDYWNoZTxULCBUZGFvPiB7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRpcnM6IGRpclRvV2F0Y2hbXSxcbiAgICAgICAgZGFvOiBUZGFvXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKGNvbmZpZywgbmFtZSwgZGlycywgZGFvKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHYXRoZXIgdGhlIGFkZGl0aW9uYWwgZGF0YSBzdWl0YWJsZVxuICAgICAqIGZvciBQYXJ0aWFsIGFuZCBMYXlvdXQgdGVtcGxhdGVzLiAgVGhlXG4gICAgICogZnVsbCBkYXRhIHNldCByZXF1aXJlZCBmb3IgRG9jdW1lbnRzIGlzXG4gICAgICogbm90IHN1aXRhYmxlIGZvciB0aGUgdGVtcGxhdGVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGluZm8gXG4gICAgICovXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbykge1xuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIGluZm8uZGlybmFtZSA9IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8uZGlybmFtZSA9PT0gJy4nKSBpbmZvLmRpcm5hbWUgPSAnLyc7XG5cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaW5mby5yZW5kZXJlciA9IHJlbmRlcmVyO1xuXG5cbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG5cblxuICAgICAgICAgICAgaWYgKHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEpIHtcblxuICAgICAgICAgICAgICAgIC8vIFVzaW5nIDxhbnk+IGhlcmUgY292ZXJzIG92ZXJcbiAgICAgICAgICAgICAgICAvLyB0aGF0IHBhcnNlTWV0YWRhdGEgcmVxdWlyZXNcbiAgICAgICAgICAgICAgICAvLyBhIFJlbmRlcmluZ0NvbnRleHQgd2hpY2hcbiAgICAgICAgICAgICAgICAvLyBpbiB0dXJuIHJlcXVpcmVzIGEgXG4gICAgICAgICAgICAgICAgLy8gbWV0YWRhdGEgb2JqZWN0LlxuICAgICAgICAgICAgICAgIGNvbnN0IHJjID0gcmVuZGVyZXIucGFyc2VNZXRhZGF0YSg8YW55PntcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBpbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogRlMucmVhZEZpbGVTeW5jKGluZm8uZnNwYXRoLCAndXRmLTgnKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gZG9jTWV0YWRhdGEgaXMgdGhlIHVubW9kaWZpZWQgbWV0YWRhdGEvZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgZG9jdW1lbnRcbiAgICAgICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhID0gcmMubWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgLy8gZG9jQ29udGVudCBpcyB0aGUgdW5wYXJzZWQgb3JpZ2luYWwgY29udGVudFxuICAgICAgICAgICAgICAgIC8vIGluY2x1ZGluZyBhbnkgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0NvbnRlbnQgPSByYy5jb250ZW50O1xuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBjb21wdXRlZCBtZXRhZGF0YSB0aGF0IGluY2x1ZGVzIGRhdGEgZnJvbSBcbiAgICAgICAgICAgICAgICAvLyBzZXZlcmFsIHNvdXJjZXNcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhID0geyB9O1xuICAgICAgICAgICAgICAgIGlmICghaW5mby5kb2NNZXRhZGF0YSkgaW5mby5kb2NNZXRhZGF0YSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gaW5mby5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGluaXRNZXRhZGF0YSAke2Jhc2VkaXJ9ICR7ZnBhdGh9IGJhc2VNZXRhZGF0YSAke2Jhc2VNZXRhZGF0YVt5cHJvcF19YCk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5iYXNlTWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBUZW1wbGF0ZXNGaWxlQ2FjaGUgYWZ0ZXIgZ2F0aGVySW5mb0RhdGEgYCwgaW5mbyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoaW5mbykge1xuICAgICAgICBhd2FpdCB0aGlzLmRhby51cGRhdGUoKHtcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfSBhcyB1bmtub3duKSBhcyBUKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihpbmZvOiBhbnkpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8uaW5zZXJ0KCh7XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH0gYXMgdW5rbm93bikgYXMgVCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRzRmlsZUNhY2hlXG4gICAgZXh0ZW5kcyBCYXNlRmlsZUNhY2hlPERvY3VtZW50LCBUZG9jdW1lbnRzc0RBTz4ge1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb1dhdGNoW11cbiAgICApIHtcbiAgICAgICAgc3VwZXIoY29uZmlnLCBuYW1lLCBkaXJzLCBkb2N1bWVudHNEQU8pO1xuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm8pIHtcblxuICAgICAgICBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICBpbmZvLmRpcm5hbWUgPSBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLmRpcm5hbWUgPT09ICcuJykgaW5mby5kaXJuYW1lID0gJy8nO1xuICAgICAgICBpbmZvLnBhcmVudERpciA9IHBhdGguZGlybmFtZShpbmZvLmRpcm5hbWUpO1xuXG4gICAgICAgIC8vIGZpbmQgdGhlIG1vdW50ZWQgZGlyZWN0b3J5LFxuICAgICAgICAvLyBnZXQgdGhlIGJhc2VNZXRhZGF0YVxuICAgICAgICBmb3IgKGxldCBkaXIgb2YgcmVtYXBkaXJzKHRoaXMuZGlycykpIHtcbiAgICAgICAgICAgIGlmIChkaXIubW91bnRlZCA9PT0gaW5mby5tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpci5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5iYXNlTWV0YWRhdGEgPSBkaXIuYmFzZU1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldCBwdWJsaWNhdGlvbkRhdGUgc29tZWhvd1xuXG5cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaW5mby5yZW5kZXJlciA9IHJlbmRlcmVyO1xuXG4gICAgICAgIGlmIChyZW5kZXJlcikge1xuXG4gICAgICAgICAgICBpbmZvLnJlbmRlclBhdGhcbiAgICAgICAgICAgICAgICA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8udnBhdGgpO1xuXG4gICAgICAgICAgICAvLyBUaGlzIHdhcyBpbiB0aGUgTG9raUpTIGNvZGUsIGJ1dFxuICAgICAgICAgICAgLy8gd2FzIG5vdCBpbiB1c2UuXG4gICAgICAgICAgICAvLyBpbmZvLnJlbmRlcm5hbWUgPSBwYXRoLmJhc2VuYW1lKFxuICAgICAgICAgICAgLy8gICAgIGluZm8ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gKTtcblxuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID0gbWljcm9tYXRjaC5pc01hdGNoKFxuICAgICAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAnKiovKi5odG1sJylcbiAgICAgICAgICAgID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAocmVuZGVyZXIucGFyc2VNZXRhZGF0YSkge1xuXG4gICAgICAgICAgICAgICAgLy8gVXNpbmcgPGFueT4gaGVyZSBjb3ZlcnMgb3ZlclxuICAgICAgICAgICAgICAgIC8vIHRoYXQgcGFyc2VNZXRhZGF0YSByZXF1aXJlc1xuICAgICAgICAgICAgICAgIC8vIGEgUmVuZGVyaW5nQ29udGV4dCB3aGljaFxuICAgICAgICAgICAgICAgIC8vIGluIHR1cm4gcmVxdWlyZXMgYSBcbiAgICAgICAgICAgICAgICAvLyBtZXRhZGF0YSBvYmplY3QuXG4gICAgICAgICAgICAgICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKDxhbnk+e1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGluZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBGUy5yZWFkRmlsZVN5bmMoaW5mby5mc3BhdGgsICd1dGYtOCcpXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkb2NNZXRhZGF0YSBpcyB0aGUgdW5tb2RpZmllZCBtZXRhZGF0YS9mcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBkb2N1bWVudFxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEgPSByYy5tZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvLyBkb2NDb250ZW50IGlzIHRoZSB1bnBhcnNlZCBvcmlnaW5hbCBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gaW5jbHVkaW5nIGFueSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9IHJjLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIGNvbXB1dGVkIG1ldGFkYXRhIHRoYXQgaW5jbHVkZXMgZGF0YSBmcm9tIFxuICAgICAgICAgICAgICAgIC8vIHNldmVyYWwgc291cmNlc1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEgPSB7IH07XG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLmRvY01ldGFkYXRhKSBpbmZvLmRvY01ldGFkYXRhID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcmVzdCBvZiB0aGlzIGlzIGFkYXB0ZWQgZnJvbSB0aGUgb2xkIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgLy8gSFRNTFJlbmRlcmVyLm5ld0luaXRNZXRhZGF0YVxuXG4gICAgICAgICAgICAgICAgLy8gRm9yIHN0YXJ0ZXJzIHRoZSBtZXRhZGF0YSBpcyBjb2xsZWN0ZWQgZnJvbSBzZXZlcmFsIHNvdXJjZXMuXG4gICAgICAgICAgICAgICAgLy8gMSkgdGhlIG1ldGFkYXRhIHNwZWNpZmllZCBpbiB0aGUgZGlyZWN0b3J5IG1vdW50IHdoZXJlXG4gICAgICAgICAgICAgICAgLy8gICAgdGhpcyBkb2N1bWVudCB3YXMgZm91bmRcbiAgICAgICAgICAgICAgICAvLyAyKSBtZXRhZGF0YSBpbiB0aGUgcHJvamVjdCBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICAgICAgLy8gMykgdGhlIG1ldGFkYXRhIGluIHRoZSBkb2N1bWVudCwgYXMgY2FwdHVyZWQgaW4gZG9jTWV0YWRhdGFcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbml0TWV0YWRhdGEgJHtiYXNlZGlyfSAke2ZwYXRofSBiYXNlTWV0YWRhdGEgJHtiYXNlTWV0YWRhdGFbeXByb3BdfWApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uYmFzZU1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gdGhpcy5jb25maWcubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSB0aGlzLmNvbmZpZy5tZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBmbW1jb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gaW5mby5kb2NNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uZG9jTWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgICAgICBmbW1jb3VudCsrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFRoZSByZW5kZXJlZCB2ZXJzaW9uIG9mIHRoZSBjb250ZW50IGxhbmRzIGhlcmVcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmNvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIC8vIFRoZSBkb2N1bWVudCBvYmplY3QgaGFzIGJlZW4gdXNlZnVsIGZvciBcbiAgICAgICAgICAgICAgICAvLyBjb21tdW5pY2F0aW5nIHRoZSBmaWxlIHBhdGggYW5kIG90aGVyIGRhdGEuXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudCA9IHt9O1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQuYmFzZWRpciA9IGluZm8ubW91bnRQb2ludDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHBhdGggPSBpbmZvLnBhdGhJbk1vdW50ZWQ7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZWxyZW5kZXIgPSByZW5kZXJlci5maWxlUGF0aChpbmZvLnBhdGhJbk1vdW50ZWQpO1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbyA9IGluZm8ucmVuZGVyUGF0aDtcblxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSB0aGUgPGVtPnRhZ3M8L2VtPiBmaWVsZCBpcyBhbiBhcnJheVxuICAgICAgICAgICAgICAgIGlmICghKGluZm8ubWV0YWRhdGEudGFncykpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzID0gW107XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKGluZm8ubWV0YWRhdGEudGFncykgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0YWdsaXN0ID0gW107XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlID0gL1xccyosXFxzKi87XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncy5zcGxpdChyZSkuZm9yRWFjaCh0YWcgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFnbGlzdC5wdXNoKHRhZy50cmltKCkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzID0gdGFnbGlzdDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KGluZm8ubWV0YWRhdGEudGFncykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgYEZPUk1BVCBFUlJPUiAtICR7aW5mby52cGF0aH0gaGFzIGJhZGx5IGZvcm1hdHRlZCB0YWdzIGAsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhLnRhZ3MgPSBpbmZvLm1ldGFkYXRhLnRhZ3M7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcm9vdCBVUkwgZm9yIHRoZSBwcm9qZWN0XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yb290X3VybCA9IHRoaXMuY29uZmlnLnJvb3RfdXJsO1xuXG4gICAgICAgICAgICAgICAgLy8gQ29tcHV0ZSB0aGUgVVJMIHRoaXMgZG9jdW1lbnQgd2lsbCByZW5kZXIgdG9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jb25maWcucm9vdF91cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBSb290VXJsID0gdXJsLnBhcnNlKHRoaXMuY29uZmlnLnJvb3RfdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgcFJvb3RVcmwucGF0aG5hbWUgPSBwYXRoLm5vcm1hbGl6ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocFJvb3RVcmwucGF0aG5hbWUsIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfdXJsID0gdXJsLmZvcm1hdChwUm9vdFVybCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfZGF0ZSA9IGluZm8uc3RhdHMubXRpbWU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwYXJzZVB1YmxEYXRlID0gKGRhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gRGF0ZS5wYXJzZShkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPSBuZXcgRGF0ZShwYXJzZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lID0gaW5mby5wdWJsaWNhdGlvbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGVTZXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICYmIGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoISBkYXRlU2V0ICYmIGluZm8ubXRpbWVNcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPSBuZXcgRGF0ZShpbmZvLm10aW1lTXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lID0gaW5mby5wdWJsaWNhdGlvbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7aW5mby52cGF0aH0gbWV0YWRhdGEucHVibGljYXRpb25EYXRlICR7aW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGV9IHNldCBmcm9tIHN0YXRzLm10aW1lYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lID0gaW5mby5wdWJsaWNhdGlvbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7aW5mby52cGF0aH0gbWV0YWRhdGEucHVibGljYXRpb25EYXRlICR7aW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGV9IHNldCBmcm9tIGN1cnJlbnQgdGltZWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZGVsZXRlRG9jVGFnR2x1ZSh2cGF0aCkge1xuICAgICAgICBhd2FpdCB0YWdHbHVlREFPLmRlbGV0ZUFsbCh7XG4gICAgICAgICAgICBkb2N2cGF0aDogdnBhdGhcbiAgICAgICAgfSBhcyBXaGVyZTxUYWdHbHVlPik7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGFkZERvY1RhZ0dsdWUodnBhdGgsIHRhZ3MpIHtcbiAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgdGFncykge1xuICAgICAgICAgICAgY29uc3QgZ2x1ZSA9IGF3YWl0IHRhZ0dsdWVEQU8uaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICBkb2N2cGF0aDogdnBhdGgsXG4gICAgICAgICAgICAgICAgdGFnTmFtZTogdGFnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdhZGREb2NUYWdHbHVlJywgZ2x1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvKSB7XG4gICAgICAgIGNvbnN0IGRvY0luZm8gPSA8RG9jdW1lbnQ+e1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIHBhcmVudERpcjogaW5mby5wYXJlbnREaXIsXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgdGFnczogQXJyYXkuaXNBcnJheShpbmZvLm1ldGFkYXRhPy50YWdzKVxuICAgICAgICAgICAgICAgICAgICA/IGluZm8ubWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAgICA6IFtdLFxuICAgICAgICAgICAgbGF5b3V0OiBpbmZvLm1ldGFkYXRhPy5sYXlvdXQsXG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICB9O1xuXG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLnVwZGF0ZShkb2NJbmZvKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmRlbGV0ZURvY1RhZ0dsdWUoZG9jSW5mby52cGF0aCk7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRkRG9jVGFnR2x1ZShcbiAgICAgICAgICAgIGRvY0luZm8udnBhdGgsIGRvY0luZm8udGFnc1xuICAgICAgICApO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKGluZm86IGFueSkge1xuICAgICAgICBjb25zdCBkb2NJbmZvID0gPERvY3VtZW50PntcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBwYXJlbnREaXI6IGluZm8ucGFyZW50RGlyLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIHRhZ3M6IEFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YT8udGFncylcbiAgICAgICAgICAgICAgICAgICAgPyBpbmZvLm1ldGFkYXRhLnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgOiBbXSxcbiAgICAgICAgICAgIGxheW91dDogaW5mby5tZXRhZGF0YT8ubGF5b3V0LFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8uaW5zZXJ0KGRvY0luZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmFkZERvY1RhZ0dsdWUoXG4gICAgICAgICAgICBkb2NJbmZvLnZwYXRoLCBkb2NJbmZvLnRhZ3NcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVVbmxpbmtlZChuYW1lOiBhbnksIGluZm86IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBzdXBlci5oYW5kbGVVbmxpbmtlZChuYW1lLCBpbmZvKTtcbiAgICAgICAgYXdhaXQgdGhpcy5kZWxldGVEb2NUYWdHbHVlKGluZm8udnBhdGgpO1xuICAgIH1cblxuICAgIGFzeW5jIGluZGV4Q2hhaW4oX2ZwYXRoKSB7XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKSBcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IHBhdGgucGFyc2UoZnBhdGgpO1xuXG4gICAgICAgIGNvbnN0IGZpbGV6OiBEb2N1bWVudFtdID0gW107XG4gICAgICAgIGNvbnN0IHNlbGYgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAgICAgJ29yJzogW1xuICAgICAgICAgICAgICAgIHsgdnBhdGg6IHsgZXE6IGZwYXRoIH0gfSxcbiAgICAgICAgICAgICAgICB7IHJlbmRlclBhdGg6IHsgZXE6IGZwYXRoIH0gfVxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICAgICAgbGV0IGZpbGVOYW1lID0gZnBhdGg7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNlbGYpICYmIHNlbGYubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIGZpbGV6LnB1c2goc2VsZlswXSk7XG4gICAgICAgICAgICBmaWxlTmFtZSA9IHNlbGZbMF0ucmVuZGVyUGF0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnREaXI7XG4gICAgICAgIGxldCBkaXJOYW1lID0gcGF0aC5kaXJuYW1lKGZwYXRoKTtcbiAgICAgICAgbGV0IGRvbmUgPSBmYWxzZTtcbiAgICAgICAgd2hpbGUgKCEoZGlyTmFtZSA9PT0gJy4nIHx8IGRpck5hbWUgPT09IHBhcnNlZC5yb290KSkge1xuICAgICAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZmlsZU5hbWUpID09PSAnaW5kZXguaHRtbCcpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUocGF0aC5kaXJuYW1lKGZpbGVOYW1lKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmVudERpciA9IHBhdGguZGlybmFtZShmaWxlTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgbG9va0ZvciA9IHBhdGguam9pbihwYXJlbnREaXIsIFwiaW5kZXguaHRtbFwiKTtcblxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAgICAgICAgICdvcic6IFtcbiAgICAgICAgICAgICAgICAgICAgeyB2cGF0aDogeyBlcTogbG9va0ZvciB9IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgcmVuZGVyUGF0aDogeyBlcTogbG9va0ZvciB9IH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW5kZXgpICYmIGluZGV4Lmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICAgICAgZmlsZXoucHVzaChpbmRleFswXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbGVOYW1lID0gbG9va0ZvcjtcbiAgICAgICAgICAgIGRpck5hbWUgPSBwYXRoLmRpcm5hbWUobG9va0Zvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsZXpcbiAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uKG9iajogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5mb3VuZERpciA9IG9iai5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgICAgICBvYmouZm91bmRQYXRoID0gb2JqLnJlbmRlclBhdGg7XG4gICAgICAgICAgICAgICAgICAgIG9iai5maWxlbmFtZSA9ICcvJyArIG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnJldmVyc2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyBhbGwgdGhlIGRvY3VtZW50cyBpbiB0aGUgc2FtZSBkaXJlY3RvcnlcbiAgICAgKiBhcyB0aGUgbmFtZWQgZmlsZS5cbiAgICAgKlxuICAgICAqIFRoaXMgZG9lc24ndCBhcHBlYXIgdG8gYmUgdXNlZCBhbnl3aGVyZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgc2libGluZ3MoX2ZwYXRoKSB7XG4gICAgICAgIGxldCByZXQ7XG4gICAgICAgIGxldCB2cGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG4gICAgICAgIGxldCBkaXJuYW1lID0gcGF0aC5kaXJuYW1lKHZwYXRoKTtcbiAgICAgICAgLy8gaWYgKGRpcm5hbWUgPT09ICcuJykgZGlybmFtZSA9ICcvJztcblxuICAgICAgICBjb25zdCBzaWJsaW5ncyA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgICAgICBkaXJuYW1lOiB7IGVxOiBkaXJuYW1lIH0sXG4gICAgICAgICAgICAvLyBUaGUgc2libGluZ3MgY2Fubm90IGluY2x1ZGUgdGhlIHNlbGYuXG4gICAgICAgICAgICB2cGF0aDogeyBuZXE6IHZwYXRoIH0sXG4gICAgICAgICAgICByZW5kZXJQYXRoOiB7IG5lcTogdnBhdGggfSxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzaWJsaW5ncy5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuaWdub3JlRmlsZShpdGVtKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHRyZWUgb2YgaXRlbXMgc3RhcnRpbmcgZnJvbSB0aGUgZG9jdW1lbnRcbiAgICAgKiBuYW1lZCBpbiBfcm9vdEl0ZW0uICBUaGUgcGFyYW1ldGVyIHNob3VsZCBiZSBhblxuICAgICAqIGFjdHVhbCBkb2N1bWVudCBpbiB0aGUgdHJlZSwgc3VjaCBhcyBgcGF0aC90by9pbmRleC5odG1sYC5cbiAgICAgKiBUaGUgcmV0dXJuIGlzIGEgdHJlZS1zaGFwZWQgc2V0IG9mIG9iamVjdHMgbGlrZSB0aGUgZm9sbG93aW5nO1xuICAgICAqIFxuICB0cmVlOlxuICAgIHJvb3RJdGVtOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyXG4gICAgaXRlbXM6XG4gICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgIGNoaWxkRm9sZGVyczpcbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlclxuICAgICAgICAgIGNoaWxkcmVuOlxuICAgICAgICAgICAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlclxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTEuaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UyLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAgICAtIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgIGNoaWxkcmVuOlxuICAgICAgICAgICAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyXG4gICAgICAgICAgICAgIGl0ZW1zOlxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMS5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbFxuICAgICAgICAgICAgICBjaGlsZEZvbGRlcnM6IFtdXG4gICAgICpcbiAgICAgKiBUaGUgb2JqZWN0cyB1bmRlciBgaXRlbXNgIGFyZSBhY3R1bGx5IHRoZSBmdWxsIERvY3VtZW50IG9iamVjdFxuICAgICAqIGZyb20gdGhlIGNhY2hlLCBidXQgZm9yIHRoZSBpbnRlcmVzdCBvZiBjb21wYWN0bmVzcyBtb3N0IG9mXG4gICAgICogdGhlIGZpZWxkcyBoYXZlIGJlZW4gZGVsZXRlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfcm9vdEl0ZW0gXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgY2hpbGRJdGVtVHJlZShfcm9vdEl0ZW06IHN0cmluZykge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGlsZEl0ZW1UcmVlICR7X3Jvb3RJdGVtfWApO1xuXG4gICAgICAgIGxldCByb290SXRlbSA9IGF3YWl0IHRoaXMuZmluZChcbiAgICAgICAgICAgICAgICBfcm9vdEl0ZW0uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX3Jvb3RJdGVtLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9yb290SXRlbSk7XG4gICAgICAgIGlmICghcm9vdEl0ZW0pIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybihgY2hpbGRJdGVtVHJlZSBubyByb290SXRlbSBmb3VuZCBmb3IgcGF0aCAke19yb290SXRlbX1gKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEodHlwZW9mIHJvb3RJdGVtID09PSAnb2JqZWN0JylcbiAgICAgICAgIHx8ICEoJ3ZwYXRoJyBpbiByb290SXRlbSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oYGNoaWxkSXRlbVRyZWUgZm91bmQgaW52YWxpZCBvYmplY3QgZm9yICR7X3Jvb3RJdGVtfSAtICR7dXRpbC5pbnNwZWN0KHJvb3RJdGVtKX1gKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUocm9vdEl0ZW0udnBhdGgpO1xuICAgICAgICAvLyBQaWNrcyB1cCBldmVyeXRoaW5nIGZyb20gdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIC8vIERpZmZlcnMgZnJvbSBzaWJsaW5ncyBieSBnZXR0aW5nIGV2ZXJ5dGhpbmcuXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgIGRpcm5hbWU6IHsgZXE6IGRpcm5hbWUgfSxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHRydWVcbiAgICAgICAgfSkgYXMgdW5rbm93bltdIGFzIGFueVtdO1xuXG4gICAgICAgIGNvbnN0IGNoaWxkRm9sZGVycyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChcbiAgICAgICAgICAgIGBTRUxFQ1QgZGlzdGluY3QgZGlybmFtZSBGUk9NIERPQ1VNRU5UU1xuICAgICAgICAgICAgV0hFUkUgcGFyZW50RGlyID0gJyR7ZGlybmFtZX0nYFxuICAgICAgICApIGFzIHVua25vd25bXSBhcyBEb2N1bWVudFtdO1xuXG4gICAgICAgIGNvbnN0IGNmcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGNmIG9mIGNoaWxkRm9sZGVycykge1xuICAgICAgICAgICAgY2ZzLnB1c2goYXdhaXQgdGhpcy5jaGlsZEl0ZW1UcmVlKFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihjZi5kaXJuYW1lLCAnaW5kZXguaHRtbCcpXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByb290SXRlbSxcbiAgICAgICAgICAgIGRpcm5hbWUsXG4gICAgICAgICAgICBpdGVtczogaXRlbXMsXG4gICAgICAgICAgICAvLyBVbmNvbW1lbnQgdGhpcyB0byBnZW5lcmF0ZSBzaW1wbGlmaWVkIG91dHB1dFxuICAgICAgICAgICAgLy8gZm9yIGRlYnVnZ2luZy5cbiAgICAgICAgICAgIC8vIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0pLFxuICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBjZnNcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGluZGV4IGZpbGVzIChyZW5kZXJzIHRvIGluZGV4Lmh0bWwpXG4gICAgICogd2l0aGluIHRoZSBuYW1lZCBzdWJ0cmVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGluZGV4RmlsZXMocm9vdFBhdGg/OiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsbHkgYXBwZW5kYWJsZSBzdWItcXVlcnlcbiAgICAgICAgLy8gdG8gaGFuZGxlIHdoZW4gcm9vdFBhdGggaXMgc3BlY2lmaWVkXG4gICAgICAgIGxldCByb290USA9IChcbiAgICAgICAgICAgICAgICB0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgJiYgcm9vdFAubGVuZ3RoID49IDFcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgID8gYEFORCAoIHJlbmRlclBhdGggTElLRSAnJHtyb290UH0lJyApYFxuICAgICAgICAgICAgOiAnJztcblxuICAgICAgICByZXR1cm4gdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgU0VMRUNUICpcbiAgICAgICAgRlJPTSBET0NVTUVOVFNcbiAgICAgICAgV0hFUkVcbiAgICAgICAgICAgICggcmVuZGVyc1RvSFRNTCA9IHRydWUgKVxuICAgICAgICBBTkQgKFxuICAgICAgICAgICAgKCByZW5kZXJQYXRoIExJS0UgJyUvaW5kZXguaHRtbCcgKVxuICAgICAgICAgT1IgKCByZW5kZXJQYXRoID0gJ2luZGV4Lmh0bWwnIClcbiAgICAgICAgKVxuICAgICAgICAke3Jvb3RRfVxuICAgICAgICBgKTtcbiAgICAgICAgXG5cbiAgICAgICAgLy8gSXQncyBwcm92ZWQgZGlmZmljdWx0IHRvIGdldCB0aGUgcmVnZXhwXG4gICAgICAgIC8vIHRvIHdvcmsgaW4gdGhpcyBtb2RlOlxuICAgICAgICAvL1xuICAgICAgICAvLyByZXR1cm4gYXdhaXQgdGhpcy5zZWFyY2goe1xuICAgICAgICAvLyAgICAgcmVuZGVyc1RvSFRNTDogdHJ1ZSxcbiAgICAgICAgLy8gICAgIHJlbmRlcnBhdGhtYXRjaDogL1xcL2luZGV4Lmh0bWwkLyxcbiAgICAgICAgLy8gICAgIHJvb3RQYXRoOiByb290UGF0aFxuICAgICAgICAvLyB9KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogRm9yIGV2ZXJ5IGZpbGUgaW4gdGhlIGRvY3VtZW50cyBjYWNoZSxcbiAgICAgKiBzZXQgdGhlIGFjY2VzcyBhbmQgbW9kaWZpY2F0aW9ucy5cbiAgICAgKlxuICAgICAqID8/Pz8/IFdoeSB3b3VsZCB0aGlzIGJlIHVzZWZ1bD9cbiAgICAgKiBJIGNhbiBzZWUgZG9pbmcgdGhpcyBmb3IgdGhlIHJlbmRlcmVkXG4gICAgICogZmlsZXMgaW4gdGhlIG91dHB1dCBkaXJlY3RvcnkuICBCdXQgdGhpcyBpc1xuICAgICAqIGZvciB0aGUgZmlsZXMgaW4gdGhlIGRvY3VtZW50cyBkaXJlY3Rvcmllcy4gPz8/P1xuICAgICAqL1xuICAgIGFzeW5jIHNldFRpbWVzKCkge1xuICAgICAgICBhd2FpdCB0aGlzLmRhby5zZWxlY3RFYWNoKFxuICAgICAgICAgICAgKGVyciwgbW9kZWwpID0+IHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNldHRlciA9IGFzeW5jIChkYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IERhdGUucGFyc2UoZGF0ZSk7O1xuICAgICAgICAgICAgICAgICAgICBpZiAoISBpc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkcCA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBGUy51dGltZXNTeW5jKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG1vZGVsLmluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgbW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXR0ZXIobW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChtb2RlbC5pbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIG1vZGVsLmluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldHRlcihtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHt9IGFzIFdoZXJlPERvY3VtZW50PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlIHRoZSBkb2N1bWVudHMgd2hpY2ggaGF2ZSB0YWdzLlxuICAgICAqXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgZG9jdW1lbnRzV2l0aFRhZ3MoKSB7XG4gICAgICAgIGNvbnN0IGRvY3MgPSBuZXcgQXJyYXk8RG9jdW1lbnQ+KCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLnNlbGVjdEVhY2goXG4gICAgICAgICAgICAoZXJyLCBkb2MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jXG4gICAgICAgICAgICAgICAgICYmIGRvYy5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiBkb2MuZG9jTWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KFxuICAgICAgICAgICAgICAgICAgICBkb2MuZG9jTWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICYmIGRvYy5kb2NNZXRhZGF0YS50YWdzLmxlbmd0aCA+PSAxXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3MucHVzaChkb2MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogeyBlcTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIGluZm86IHsgaXNOb3ROdWxsOiB0cnVlIH1cbiAgICAgICAgICAgIH0gYXMgV2hlcmU8RG9jdW1lbnQ+XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coZG9jcyk7XG4gICAgICAgIHJldHVybiBkb2NzO1xuICAgIH1cblxuICAgIGFzeW5jIGRvY3VtZW50c1dpdGhUYWcodGFnbm06IHN0cmluZyB8IHN0cmluZ1tdKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8c3RyaW5nPj5cbiAgICB7XG4gICAgICAgIGxldCB0YWdzOiBzdHJpbmdbXTtcbiAgICAgICAgaWYgKHR5cGVvZiB0YWdubSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRhZ3MgPSBbIHRhZ25tIF07XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0YWdubSkpIHtcbiAgICAgICAgICAgIHRhZ3MgPSB0YWdubTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnRzV2l0aFRhZyBnaXZlbiBiYWQgdGFncyBhcnJheSAke3V0aWwuaW5zcGVjdCh0YWdubSl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb3JyZWN0bHkgaGFuZGxlIHRhZyBzdHJpbmdzIHdpdGhcbiAgICAgICAgLy8gdmFyeWluZyBxdW90ZXMuICBBIGRvY3VtZW50IG1pZ2h0IGhhdmUgdGhlc2UgdGFnczpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgdGFnczpcbiAgICAgICAgLy8gICAgLSBUZWFzZXInc1xuICAgICAgICAvLyAgICAtIFRlYXNlcnNcbiAgICAgICAgLy8gICAgLSBTb21ldGhpbmcgXCJxdW90ZWRcIlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGVzZSBTUUwgcXVlcmllcyB3b3JrOlxuICAgICAgICAvL1xuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lIElOICggJ1NvbWV0aGluZyBcInF1aXRlZFwiJywgXCJUZWFzZXInc1wiICk7XG4gICAgICAgIC8vIHRlYXNlci1jb250ZW50Lmh0bWwubWR8VGVhc2VyJ3NcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxTb21ldGhpbmcgXCJxdWl0ZWRcIlxuICAgICAgICAvLyBzcWxpdGU+IHNlbGVjdCAqIGZyb20gVEFHR0xVRSB3aGVyZSB0YWdOYW1lIElOICggJ1NvbWV0aGluZyBcInF1aXRlZFwiJywgJ1RlYXNlcicncycgKTtcbiAgICAgICAgLy8gdGVhc2VyLWNvbnRlbnQuaHRtbC5tZHxUZWFzZXInc1xuICAgICAgICAvLyB0ZWFzZXItY29udGVudC5odG1sLm1kfFNvbWV0aGluZyBcInF1aXRlZFwiXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEJ1dCwgdGhpcyBkb2VzIG5vdDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gc3FsaXRlPiBzZWxlY3QgKiBmcm9tIFRBR0dMVUUgd2hlcmUgdGFnTmFtZSA9ICdUZWFzZXIncyc7XG4gICAgICAgIC8vICcgIC4uLj4gXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBvcmlnaW5hbCBjb2RlIGJlaGF2aW9yIHdhcyB0aGlzOlxuICAgICAgICAvL1xuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEIEVycm9yOiBTUUxJVEVfRVJST1I6IG5lYXIgXCJzXCI6IHN5bnRheCBlcnJvclxuICAgICAgICAvL1xuICAgICAgICAvLyBBbiBhdHRlbXB0ZWQgZml4OlxuICAgICAgICAvLyAkIG5vZGUgLi4vZGlzdC9jbGkuanMgZG9jcy13aXRoLXRhZyBjb25maWctbm9ybWFsLm1qcyBcIlRlYXNlcidzXCJcbiAgICAgICAgLy8gZG9jdW1lbnRzV2l0aFRhZyBbIFwiVGVhc2VyJ3NcIiBdICAoICdUZWFzZXJcXCdzJyApIFxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInNcIjogc3ludGF4IGVycm9yXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFub3RoZXIgYXR0ZW1wdGVkIGZpeDpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgXCJUZWFzZXInc1wiXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyBcIlRlYXNlcidzXCIgXSAgKCBcIlRlYXNlcicnc1wiICkgXG4gICAgICAgIC8vIFtdXG4gICAgICAgIC8vIFtdXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFuZDpcbiAgICAgICAgLy8gJCBub2RlIC4uL2Rpc3QvY2xpLmpzIGRvY3Mtd2l0aC10YWcgY29uZmlnLW5vcm1hbC5tanMgJ1NvbWV0aGluZyBcInF1b3RlZFwiJ1xuICAgICAgICAvLyBkb2N1bWVudHNXaXRoVGFnIFsgJ1NvbWV0aGluZyBcInF1b3RlZFwiJyBdICAoIFwiU29tZXRoaW5nIFwicXVvdGVkXCJcIiApIFxuICAgICAgICAvLyBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgRXJyb3I6IFNRTElURV9FUlJPUjogbmVhciBcInF1b3RlZFwiOiBzeW50YXggZXJyb3JcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIGNvZGUgYmVsb3cgcHJvZHVjZXM6XG4gICAgICAgIC8vICQgbm9kZSAuLi9kaXN0L2NsaS5qcyBkb2NzLXdpdGgtdGFnIGNvbmZpZy1ub3JtYWwubWpzIFwiVGVhc2VyJ3NcIiAnU29tZXRoaW5nIFwicXVpdGVkXCInXG4gICAgICAgIC8vIGRvY3VtZW50c1dpdGhUYWcgWyBcIlRlYXNlcidzXCIsICdTb21ldGhpbmcgXCJxdWl0ZWRcIicgXSAgKCAnVGVhc2VyJydzJywnU29tZXRoaW5nIFwicXVpdGVkXCInICkgXG4gICAgICAgIC8vIFsgeyB2cGF0aDogJ3RlYXNlci1jb250ZW50Lmh0bWwubWQnIH0gXVxuICAgICAgICAvLyBbICd0ZWFzZXItY29udGVudC5odG1sLm1kJyBdXG5cbiAgICAgICAgbGV0IHRhZ3N0cmluZyA9IGAgKCAke3RhZ3MubWFwKHQgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGAnJHt0LmluZGV4T2YoXCInXCIpID49IDBcbiAgICAgICAgICAgICAgICA/IHQucmVwbGFjZUFsbChcIidcIiwgXCInJ1wiKVxuICAgICAgICAgICAgICAgIDogdH0nYDtcbiAgICAgICAgfSkuam9pbignLCcpfSApIGA7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGRvY3VtZW50c1dpdGhUYWcgJHt1dGlsLmluc3BlY3QodGFncyl9ICR7dGFnc3RyaW5nfWApO1xuXG4gICAgICAgIC8vICR7dGFnc3RyaW5nfSBpcyBhbiBlbmNvZGluZyBvZiB0aGUgdGFncyBwYXNzZWQgYXNcbiAgICAgICAgLy8gcGFyYW1ldGVycyBhcyBzb21ldGhpbmcgU1FMSVRFIGNhbiB1c2Ugd2l0aCBhbiBJTiBvcGVyYXRvci5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gIFdIRVJFIHRhZ05hbWUgSU4gKCAnVGFnMScsICdUYWcyJyApXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFdoZW4gdGhlIHRhZyBuYW1lcyBoYXZlIHNpbmdsZSBvciBkb3VibGUgcXVvdGVzIHNvbWUgc3BlY2lhbFxuICAgICAgICAvLyBjYXJlIGlzIHJlcXVpcmVkIGFzIGRpc2N1c3NlZCBhYm92ZS4gXG5cbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgICAgIFNFTEVDVCBESVNUSU5DVCBkb2N2cGF0aCBBUyB2cGF0aFxuICAgICAgICAgICAgRlJPTSBUQUdHTFVFXG4gICAgICAgICAgICBXSEVSRSB0YWdOYW1lIElOICR7dGFnc3RyaW5nfVxuICAgICAgICBgKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXMpO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyZXMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50c1dpdGhUYWcgbm9uLUFycmF5IHJlc3VsdCAke3V0aWwuaW5zcGVjdChyZXMpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdnBhdGhzID0gcmVzLm1hcChyID0+IHtcbiAgICAgICAgICAgIHJldHVybiByLnZwYXRoO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdnBhdGhzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhbiBhcnJheSBvZiB0YWdzIHVzZWQgYnkgYWxsIGRvY3VtZW50cy5cbiAgICAgKiBUaGlzIHVzZXMgdGhlIEpTT04gZXh0ZW5zaW9uIHRvIGV4dHJhY3RcbiAgICAgKiB0aGUgdGFncyBmcm9tIHRoZSBtZXRhZGF0YSBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyB0YWdzKCkge1xuICAgICAgICAvLyBjb25zdCByZXMgPSBhd2FpdCB0aGlzLmRhby5zcWxkYi5hbGwoYFxuICAgICAgICAvLyAgICAgU0VMRUNUXG4gICAgICAgIC8vICAgICAgICAgRElTVElOQ1QganNvbl9leHRyYWN0KGRvY01ldGFkYXRhLCAnJC50YWdzJykgQVMgdGFnc1xuICAgICAgICAvLyAgICAgRlJPTSBET0NVTUVOVFMsIGpzb25fZWFjaCh0YWdzKVxuICAgICAgICAvLyBgKSBhcyB1bmtub3duIGFzIEFycmF5PHtcbiAgICAgICAgLy8gICAgIHRhZ3M6IHN0cmluZ1tdXG4gICAgICAgIC8vIH0+O1xuXG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgICAgICBTRUxFQ1QgRElTVElOQ1QgdGFnTmFtZSBGUk9NIFRBR0dMVUVcbiAgICAgICAgYCkgYXMgdW5rbm93biBhcyBBcnJheTx7XG4gICAgICAgICAgICB0YWdOYW1lOiBzdHJpbmdcbiAgICAgICAgfT47XG5cbiAgICAgICAgY29uc3QgdGFncyA9IHJlcy5tYXAodGFnID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0YWcudGFnTmFtZVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXMpO1xuXG4gICAgICAgIC8vIFRoZSBxdWVyeSBhYm92ZSBwcm9kdWNlcyB0aGlzIHJlc3VsdDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8ge1xuICAgICAgICAvLyAgICAgdGFnczogJ1tcIlRhZzFcIixcIlRhZzJcIixcIlRhZzNcIl0nXG4gICAgICAgIC8vIH0sXG4gICAgICAgIC8vIHtcbiAgICAgICAgLy8gICAgIHRhZ3M6ICdbXCJUYWctc3RyaW5nLTFcIixcIlRhZy1zdHJpbmctMlwiLFwiVGFnLXN0cmluZy0zXCJdJ1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vXG4gICAgICAgIC8vIEluIG90aGVyIHdvcmRzLCB0aGUgdGFncyBhcnJheSBhcnJpdmVzXG4gICAgICAgIC8vIGFzIEpTT04gd2hpY2ggd2UgbXVzdCBwYXJzZS5cblxuICAgICAgICAvLyBjb25zdCB0YWdzID0gbmV3IFNldCgpO1xuICAgICAgICAvLyBmb3IgKGNvbnN0IGl0ZW0gb2YgcmVzKSB7XG4gICAgICAgIC8vICAgICBpZiAoISgndGFncycgaW4gaXRlbSkpIGNvbnRpbnVlO1xuICAgICAgICAvLyAgICAgbGV0IHRhZ3NQID0gW107XG4gICAgICAgIC8vICAgICBpZiAodHlwZW9mIGl0ZW0udGFncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gICAgICAgICB0YWdzUCA9IEpTT04ucGFyc2UoaXRlbS50YWdzKTtcbiAgICAgICAgLy8gICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShpdGVtLnRhZ3MpKSB7XG4gICAgICAgIC8vICAgICAgICAgdGFnc1AgPSBpdGVtLnRhZ3M7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICBmb3IgKGNvbnN0IHRhZyBvZiB0YWdzUCkge1xuICAgICAgICAvLyAgICAgICAgIHRhZ3MuYWRkKHRhZyk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyBUaGUgU2V0IGNsYXNzIG1hZGUgc3VyZSB0byB3ZWVkIG91dFxuICAgICAgICAvLyBkdXBsaWNhdGUgdGFncy4gIFdpdGggQXJyYXkuZnJvbVxuICAgICAgICAvLyB3ZSBjYW4gbWFrZSB0aGUgc2V0IGludG8gYW4gYXJyYXlcbiAgICAgICAgLy8gd2hpY2ggY2FuIGJlIHNvcnRlZC5cbiAgICAgICAgY29uc3QgcmV0ID0gQXJyYXkuZnJvbSh0YWdzKTtcbiAgICAgICAgcmV0dXJuIHJldC5zb3J0KChhOiBzdHJpbmcsIGI6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdmFyIHRhZ0EgPSBhLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgdGFnQiA9IGIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmICh0YWdBIDwgdGFnQikgcmV0dXJuIC0xO1xuICAgICAgICAgICAgaWYgKHRhZ0EgPiB0YWdCKSByZXR1cm4gMTtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgZGF0YSBmb3IgYW4gaW50ZXJuYWwgbGlua1xuICAgICAqIHdpdGhpbiB0aGUgc2l0ZSBkb2N1bWVudHMuICBGb3JtaW5nIGFuXG4gICAgICogaW50ZXJuYWwgbGluayBpcyBhdCBhIG1pbmltdW0gdGhlIHJlbmRlcmVkXG4gICAgICogcGF0aCBmb3IgdGhlIGRvY3VtZW50IGFuZCBpdHMgdGl0bGUuXG4gICAgICogVGhlIHRlYXNlciwgaWYgYXZhaWxhYmxlLCBjYW4gYmUgdXNlZCBpblxuICAgICAqIGEgdG9vbHRpcC4gVGhlIHRodW1ibmFpbCBpcyBhbiBpbWFnZSB0aGF0XG4gICAgICogY291bGQgYmUgZGlzcGxheWVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGRvY0xpbmtEYXRhKHZwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcblxuICAgICAgICAvLyBUaGUgdnBhdGggcmVmZXJlbmNlXG4gICAgICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBwYXRoIGl0IHJlbmRlcnMgdG9cbiAgICAgICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGl0bGUgc3RyaW5nIGZyb20gdGhhdCBwYWdlXG4gICAgICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSB0ZWFzZXIgdGV4dCBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0ZWFzZXI/OiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBoZXJvIGltYWdlICh0aHVtYm5haWwpXG4gICAgICAgIHRodW1ibmFpbD86IHN0cmluZztcbiAgICB9PiB7XG4gICAgICAgIGNvbnN0IGRvY0luZm8gPSBhd2FpdCB0aGlzLmZpbmQodnBhdGgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBkb2NJbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICB0aXRsZTogZG9jSW5mby5tZXRhZGF0YS50aXRsZSxcbiAgICAgICAgICAgIHRlYXNlcjogZG9jSW5mby5tZXRhZGF0YS50ZWFzZXIsXG4gICAgICAgICAgICAvLyB0aHVtYm5haWxcbiAgICAgICAgfTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gZGVzY3JpcHRpdmUgc2VhcmNoIG9wZXJhdGlvbnNcbiAgICAgKiB3aXRoIG1hbnkgb3B0aW9ucy4gIFRoZXkgYXJlIGNvbnZlcnRlZFxuICAgICAqIGludG8gYSBzZWxlY3RBbGwgc3RhdGVtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgc2VhcmNoKG9wdGlvbnMpOiBQcm9taXNlPEFycmF5PERvY3VtZW50Pj4ge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggYCwgb3B0aW9ucyk7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcbiAgICAgICAgY29uc3QgdnBhdGhzU2VlbiA9IG5ldyBTZXQoKTtcblxuICAgICAgICBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICAgICAgIGFuZDogW11cbiAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIGlmIChvcHRpb25zLm1pbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbWltZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXE6IG9wdGlvbnMubWltZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5taW1lKSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbWltZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW46IG9wdGlvbnMubWltZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IC8qIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5jb3JyZWN0IE1JTUUgY2hlY2sgJHtvcHRpb25zLm1pbWV9YCk7XG4gICAgICAgICAgICB9ICovXG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMucmVuZGVyc1RvSFRNTCA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgICkge1xuICAgICAgICAgICAgc2VsZWN0b3IuYW5kLnB1c2goe1xuICAgICAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHtcbiAgICAgICAgICAgICAgICAgICAgZXE6IG9wdGlvbnMucmVuZGVyc1RvSFRNTFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zPy5yb290UGF0aCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgIGlzTGlrZTogYCR7b3B0aW9ucy5yb290UGF0aH0lYFxuICAgICAgICAgICAgICAgICAgICAvLyBzcWw6IGAgcmVuZGVyUGF0aCBsaWtlICcke29wdGlvbnMucm9vdFBhdGh9JScgYFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVnZXhTUUwgPSB7XG4gICAgICAgICAgICBvcjogW11cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMucGF0aG1hdGNoID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgIHNxbDogYCB2cGF0aCByZWdleHAgJyR7b3B0aW9ucy5wYXRobWF0Y2h9JyBgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIG9wdGlvbnMucGF0aG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmVnZXhTUUwub3IucHVzaCh7XG4gICAgICAgICAgICAgICAgc3FsOiBgIHZwYXRoIHJlZ2V4cCAnJHtvcHRpb25zLnBhdGhtYXRjaC5zb3VyY2V9JyBgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3FsOiBgIHZwYXRoIHJlZ2V4cCAnJHttYXRjaH0nIGBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNxbDogYCB2cGF0aCByZWdleHAgJyR7bWF0Y2guc291cmNlfScgYFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHBhdGhtYXRjaCByZWdleHAgJHt1dGlsLmluc3BlY3QobWF0Y2gpfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgncGF0aG1hdGNoJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAvLyBUaGVyZSdzIGEgcGF0aG1hdGNoIGZpZWxkLCB0aGF0XG4gICAgICAgICAgICAvLyBpc24ndCBjb3JyZWN0XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHBhdGhtYXRjaCAke3V0aWwuaW5zcGVjdChvcHRpb25zLnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5sYXlvdXRzKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmxheW91dHMpXG4gICAgICAgICAgICAgJiYgb3B0aW9ucy5sYXlvdXRzLmxlbmd0aCA+PSAyXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGxheW91dCBvZiBvcHRpb25zLmxheW91dHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhTUUwub3IucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXQ6IHsgZXE6IGxheW91dCB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmxheW91dClcbiAgICAgICAgICAgICAmJiBvcHRpb25zLmxheW91dHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rvci5hbmQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxheW91dDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXE6IG9wdGlvbnMubGF5b3V0c1swXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcTogb3B0aW9ucy5sYXlvdXRzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF0dGVtcHRpbmcgdG8gZG8gdGhlIGZvbGxvd2luZzpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gc3FsaXRlPiBzZWxlY3QgdnBhdGgsIHJlbmRlclBhdGggZnJvbSBET0NVTUVOVFMgd2hlcmUgcmVuZGVyUGF0aCByZWdleHAgJy9pbmRleC5odG1sJCc7XG4gICAgICAgIC8vIGhpZXItYnJva2UvZGlyMS9kaXIyL2luZGV4Lmh0bWwubWR8aGllci1icm9rZS9kaXIxL2RpcjIvaW5kZXguaHRtbFxuICAgICAgICAvLyBoaWVyL2RpcjEvZGlyMi9pbmRleC5odG1sLm1kfGhpZXIvZGlyMS9kaXIyL2luZGV4Lmh0bWxcbiAgICAgICAgLy8gaGllci9kaXIxL2luZGV4Lmh0bWwubWR8aGllci9kaXIxL2luZGV4Lmh0bWxcbiAgICAgICAgLy8gaGllci9pbWdkaXIvaW5kZXguaHRtbC5tZHxoaWVyL2ltZ2Rpci9pbmRleC5odG1sXG4gICAgICAgIC8vIGhpZXIvaW5kZXguaHRtbC5tZHxoaWVyL2luZGV4Lmh0bWxcbiAgICAgICAgLy8gc3ViZGlyL2luZGV4Lmh0bWwubWR8c3ViZGlyL2luZGV4Lmh0bWxcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggPT09ICdzdHJpbmcnXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmVnZXhTUUwub3IucHVzaCh7XG4gICAgICAgICAgICAgICAgc3FsOiBgIHJlbmRlclBhdGggcmVnZXhwICcke29wdGlvbnMucmVuZGVycGF0aG1hdGNofScgYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cFxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnJHtvcHRpb25zLnJlbmRlcnBhdGhtYXRjaC5zb3VyY2V9JyBgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3FsOiBgIHJlbmRlclBhdGggcmVnZXhwICcke21hdGNofScgYFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3FsOiBgIHJlbmRlclBhdGggcmVnZXhwICcke21hdGNoLnNvdXJjZX0nIGBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCByZW5kZXJwYXRobWF0Y2ggcmVnZXhwICR7dXRpbC5pbnNwZWN0KG1hdGNoKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoJ3JlbmRlcnBhdGhtYXRjaCcgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggRVJST1IgaW52YWxpZCByZW5kZXJwYXRobWF0Y2ggJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5wYXRobWF0Y2gpfWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWdleFNRTC5vci5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgc2VsZWN0b3IuYW5kLnB1c2goeyBvcjogcmVnZXhTUUwub3IgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxlY3Rvci5hbmQpXG4gICAgICAgICAmJiBzZWxlY3Rvci5hbmQubGVuZ3RoIDw9IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBkZWxldGUgc2VsZWN0b3IuYW5kO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coc2VsZWN0b3IpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBiYXNlZCBvbiB0aGluZ3Mgd2UgY2FuIHF1ZXJ5XG4gICAgICAgIC8vIGRpcmVjdGx5IGZyb20gIHRoZSBEb2N1bWVudCBvYmplY3QuXG4gICAgICAgIGxldCByZXN1bHQxO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbChcbiAgICAgICAgICAgICAgICBzZWxlY3RvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLnNlYXJjaCBjYXVnaHQgZXJyb3IgaW4gc2VsZWN0QWxsIHdpdGggc2VsZWN0b3IgJHt1dGlsLmluc3BlY3Qoc2VsZWN0b3IpfSAtICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgc2VhcmNoIG9wdGlvbnMgaW5jbHVkZSBsYXlvdXQocylcbiAgICAgICAgLy8gd2UgY2hlY2sgZG9jTWV0YWRhdGEubGF5b3V0XG4gICAgICAgIC8vIE5PVyBNT1ZFRCBBQk9WRVxuICAgICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0MTtcblxuICAgICAgICAvLyBDaGVjayBmb3IgbWF0Y2ggYWdhaW5zdCB0YWdzXG4gICAgICAgIGNvbnN0IHJlc3VsdDMgPSBcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRhZ1xuICAgICAgICAgICAgICAgICYmIHR5cGVvZiBvcHRpb25zLnRhZyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICkgPyByZXN1bHQyLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS52cGF0aFxuICAgICAgICAgICAgICAgICAmJiBpdGVtLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIGl0ZW0uZG9jTWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KGl0ZW0uZG9jTWV0YWRhdGEudGFncylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uZG9jTWV0YWRhdGEudGFncy5pbmNsdWRlcyhvcHRpb25zLnRhZykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICA6IHJlc3VsdDI7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0NCA9IHJlc3VsdDM7XG4gICAgICAgICAgICAvLyAoXG4gICAgICAgICAgICAvLyAgICAgb3B0aW9ucy5yb290UGF0aFxuICAgICAgICAgICAgLy8gICYmIHR5cGVvZiBvcHRpb25zLnJvb3RQYXRoID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgLy8gKSA/IHJlc3VsdDMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gICAgIGlmIChpdGVtLnZwYXRoXG4gICAgICAgICAgICAvLyAgICAgICYmIGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gICAgICkge1xuICAgICAgICAgICAgLy8gICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoICR7aXRlbS52cGF0aH0gJHtpdGVtLnJlbmRlclBhdGh9ICR7b3B0aW9ucy5yb290UGF0aH1gKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgaWYgKGl0ZW0ucmVuZGVyUGF0aC5zdGFydHNXaXRoKG9wdGlvbnMucm9vdFBhdGgpKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgLy8gOiByZXN1bHQzO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDUgPVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZ2xvYlxuICAgICAgICAgICAgICYmIHR5cGVvZiBvcHRpb25zLmdsb2IgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICApID8gcmVzdWx0NC5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0udnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1pY3JvbWF0Y2guaXNNYXRjaChpdGVtLnZwYXRoLCBvcHRpb25zLmdsb2IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ0O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDYgPVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyZ2xvYlxuICAgICAgICAgICAgJiYgdHlwZW9mIG9wdGlvbnMucmVuZGVyZ2xvYiA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICkgPyByZXN1bHQ1LmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5yZW5kZXJQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtaWNyb21hdGNoLmlzTWF0Y2goaXRlbS5yZW5kZXJQYXRoLCBvcHRpb25zLnJlbmRlcmdsb2IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ1O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDcgPVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyZXJzXG4gICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zLnJlbmRlcmVycylcbiAgICAgICAgICAgICkgPyByZXN1bHQ2LmZpbHRlcihpdGVtID0+IHtcblxuICAgICAgICAgICAgICAgIGxldCByZW5kZXJlciA9IGZjYWNoZS5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpdGVtLnZwYXRoKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyZXIgZm9yICR7b2JqLnZwYXRofSBgLCByZW5kZXJlcik7XG4gICAgICAgICAgICAgICAgaWYgKCFyZW5kZXJlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCByIG9mIG9wdGlvbnMucmVuZGVyZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGVjayByZW5kZXJlciAke3R5cGVvZiByfSAke3JlbmRlcmVyLm5hbWV9ICR7cmVuZGVyZXIgaW5zdGFuY2VvZiByfWApO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAmJiByID09PSByZW5kZXJlci5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHIgPT09ICdvYmplY3QnXG4gICAgICAgICAgICAgICAgICAgICB8fCB0eXBlb2YgciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignV0FSTklORzogTWF0Y2hpbmcgcmVuZGVyZXIgYnkgb2JqZWN0IGNsYXNzIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnLCByKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ2O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDggPVxuICAgICAgICAgICAgKG9wdGlvbnMuZmlsdGVyZnVuYylcbiAgICAgICAgICAgID8gcmVzdWx0Ny5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZmlsdGVyZnVuYyhcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmNvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ3O1xuXG4gICAgICAgIFxuICAgICAgICBsZXQgcmVzdWx0OSA9IHJlc3VsdDg7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBvcHRpb25zLnNvcnRCeSA9PT0gJ3N0cmluZydcbiAgICAgICAgICYmIChcbiAgICAgICAgICAgICBvcHRpb25zLnNvcnRCeSA9PT0gJ3B1YmxpY2F0aW9uRGF0ZSdcbiAgICAgICAgICB8fCBvcHRpb25zLnNvcnRCeSA9PT0gJ3B1YmxpY2F0aW9uVGltZSdcbiAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXN1bHQ5ID0gcmVzdWx0OC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGFEYXRlID0gYS5tZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICYmIGEubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgID8gbmV3IERhdGUoYS5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpXG4gICAgICAgICAgICAgICAgICAgIDogbmV3IERhdGUoYS5tdGltZU1zKTtcbiAgICAgICAgICAgICAgICBsZXQgYkRhdGUgPSBiLm1ldGFkYXRhIFxuICAgICAgICAgICAgICAgICAgICAgICAgICYmIGIubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgID8gbmV3IERhdGUoYi5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpXG4gICAgICAgICAgICAgICAgICAgIDogbmV3IERhdGUoYi5tdGltZU1zKTtcbiAgICAgICAgICAgICAgICBpZiAoYURhdGUgPT09IGJEYXRlKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBpZiAoYURhdGUgPiBiRGF0ZSkgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIGlmIChhRGF0ZSA8IGJEYXRlKSByZXR1cm4gMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMuc29ydEJ5ID09PSAnc3RyaW5nJ1xuICAgICAgICAgJiYgb3B0aW9ucy5zb3J0QnkgPT09ICdkaXJuYW1lJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlc3VsdDkgPSByZXN1bHQ4LnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYS5kaXJuYW1lID09PSBiLmRpcm5hbWUpIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGlmIChhLmRpcm5hbWUgPCBiLmRpcm5hbWUpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICBpZiAoYS5kaXJuYW1lID4gYi5kaXJuYW1lKSByZXR1cm4gMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdDlhID0gcmVzdWx0OTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRGdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXN1bHQ5YSA9IHJlc3VsdDkuc29ydChvcHRpb25zLnNvcnRGdW5jKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQxMCA9IHJlc3VsdDlhO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2Ygb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nID09PSAnYm9vbGVhbidcbiAgICAgICAgIHx8IHR5cGVvZiBvcHRpb25zLnJldmVyc2UgPT09ICdib29sZWFuJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nID09PSAnYm9vbGVhbidcbiAgICAgICAgICAgICAmJiBvcHRpb25zLnNvcnRCeURlc2NlbmRpbmdcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJlc3VsdDEwID0gcmVzdWx0OWEucmV2ZXJzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJldmVyc2UgPT09ICdib29sZWFuJ1xuICAgICAgICAgICAgICYmIG9wdGlvbnMucmV2ZXJzZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0MTAgPSByZXN1bHQ5YS5yZXZlcnNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzdWx0MTEgPSByZXN1bHQxMDtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJlc3VsdDExID0gcmVzdWx0MTAuc2xpY2Uob3B0aW9ucy5vZmZzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdDEyID0gcmVzdWx0MTE7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5saW1pdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJlc3VsdDEyID0gcmVzdWx0MTEuc2xpY2UoXG4gICAgICAgICAgICAgICAgMCwgb3B0aW9ucy5saW1pdCAtIDFcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0MTI7XG4gICAgfVxuXG4gICAgLy8gU2tpcCB0YWdzIGZvciBub3cuICBTaG91bGQgYmUgZWFzeS5cblxuICAgIC8vIEZvciB0YWdzIHN1cHBvcnQsIHRoaXMgY2FuIGJlIHVzZWZ1bFxuICAgIC8vICAtLSBodHRwczovL2FudG9uei5vcmcvanNvbi12aXJ0dWFsLWNvbHVtbnMvXG4gICAgLy8gSXQgc2hvd3MgaG93IHRvIGRvIGdlbmVyYXRlZCBjb2x1bW5zXG4gICAgLy8gZnJvbSBmaWVsZHMgaW4gSlNPTlxuXG4gICAgLy8gQnV0LCBob3cgdG8gZG8gZ2VuZXJhdGVkIGNvbHVtbnNcbiAgICAvLyB1c2luZyBTUUxJVEUzT1JNP1xuXG4gICAgLy8gaHR0cHM6Ly9hbnRvbnoub3JnL3NxbGVhbi1yZWdleHAvIC0tIFJlZ0V4cFxuICAgIC8vIGV4dGVuc2lvbiBmb3IgU1FMSVRFM1xuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FzZzAxNy9zcWxpdGUtcmVnZXggaW5jbHVkZXNcbiAgICAvLyBhIG5vZGUuanMgcGFja2FnZVxuICAgIC8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL3NxbGl0ZS1yZWdleFxufVxuXG5leHBvcnQgdmFyIGFzc2V0c0NhY2hlOiBCYXNlRmlsZUNhY2hlPCBBc3NldCwgdHlwZW9mIGFzc2V0c0RBTz47XG5leHBvcnQgdmFyIHBhcnRpYWxzQ2FjaGU6IFRlbXBsYXRlc0ZpbGVDYWNoZTxQYXJ0aWFsLCB0eXBlb2YgcGFydGlhbHNEQU8+O1xuZXhwb3J0IHZhciBsYXlvdXRzQ2FjaGU6IFRlbXBsYXRlc0ZpbGVDYWNoZTxMYXlvdXQsIHR5cGVvZiBsYXlvdXRzREFPPjtcbmV4cG9ydCB2YXIgZG9jdW1lbnRzQ2FjaGU6IERvY3VtZW50c0ZpbGVDYWNoZTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvblxuKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICBhc3NldHNDYWNoZSA9IG5ldyBCYXNlRmlsZUNhY2hlPEFzc2V0LCBUYXNzZXRzREFPPihcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAnYXNzZXRzJyxcbiAgICAgICAgY29uZmlnLmFzc2V0RGlycyxcbiAgICAgICAgYXNzZXRzREFPXG4gICAgKTtcbiAgICBhd2FpdCBhc3NldHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgYXNzZXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIHBhcnRpYWxzQ2FjaGUgPSBuZXcgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgICAgICAgICAgUGFydGlhbCwgVHBhcnRpYWxzREFPXG4gICAgPihcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAncGFydGlhbHMnLFxuICAgICAgICBjb25maWcucGFydGlhbHNEaXJzLFxuICAgICAgICBwYXJ0aWFsc0RBT1xuICAgICk7XG4gICAgYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgcGFydGlhbHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsc0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICBsYXlvdXRzQ2FjaGUgPSBuZXcgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgICAgICAgICAgTGF5b3V0LCBUbGF5b3V0c0RBT1xuICAgID4oXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2xheW91dHMnLFxuICAgICAgICBjb25maWcubGF5b3V0RGlycyxcbiAgICAgICAgbGF5b3V0c0RBT1xuICAgICk7XG4gICAgYXdhaXQgbGF5b3V0c0NhY2hlLnNldHVwKCk7XG5cbiAgICBsYXlvdXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgRG9jdW1lbnRzRmlsZUNhY2hlICdkb2N1bWVudHMnICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5kb2N1bWVudERpcnMpfWApO1xuXG4gICAgZG9jdW1lbnRzQ2FjaGUgPSBuZXcgRG9jdW1lbnRzRmlsZUNhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdkb2N1bWVudHMnLFxuICAgICAgICBjb25maWcuZG9jdW1lbnREaXJzXG4gICAgKTtcbiAgICBhd2FpdCBkb2N1bWVudHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgZG9jdW1lbnRzQ2FjaGUub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChlcnIpfWApO1xuICAgIH0pO1xuXG4gICAgYXdhaXQgY29uZmlnLmhvb2tQbHVnaW5DYWNoZVNldHVwKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZUZpbGVDYWNoZXMoKSB7XG4gICAgaWYgKGRvY3VtZW50c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGRvY3VtZW50c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoYXNzZXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgYXNzZXRzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgYXNzZXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChsYXlvdXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgbGF5b3V0c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGxheW91dHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHBhcnRpYWxzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgcGFydGlhbHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBwYXJ0aWFsc0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbn1cbiJdfQ==