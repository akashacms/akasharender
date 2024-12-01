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
import path from 'path';
import util from 'util';
import url from 'url';
import FS from 'fs';
import EventEmitter from 'events';
import { minimatch } from 'minimatch';
import { field, fk, id, index, table, schema, BaseDAO } from 'sqlite3orm';
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
let TagGlue = class TagGlue {
};
__decorate([
    field({ name: 'docvpath', dbtype: 'string' }),
    fk('tag_docvpath', 'DOCUMENTS', 'vpath'),
    index('tagglue_vpath'),
    __metadata("design:type", String)
], TagGlue.prototype, "docvpath", void 0);
__decorate([
    field({ name: 'slug', dbtype: 'string' }),
    fk('tag_slug', 'TAGS', 'slug'),
    index('tagglue_slug'),
    __metadata("design:type", String)
], TagGlue.prototype, "slug", void 0);
TagGlue = __decorate([
    table({ name: 'TAGGLUE' })
], TagGlue);
await schema().createTable(sqdb, 'TAGGLUE');
const tagGlueDAO = new BaseDAO(TagGlue, sqdb);
let Tag = class Tag {
};
__decorate([
    field({
        name: 'tagname',
        dbtype: 'TEXT'
    }),
    __metadata("design:type", String)
], Tag.prototype, "tagname", void 0);
__decorate([
    id({
        name: 'slug', dbtype: 'TEXT'
    }),
    index('tag_slug'),
    __metadata("design:type", String)
], Tag.prototype, "slug", void 0);
__decorate([
    field({
        name: 'description', dbtype: 'TEXT'
    }),
    __metadata("design:type", String)
], Tag.prototype, "description", void 0);
Tag = __decorate([
    table({ name: 'TAGS' })
], Tag);
await schema().createTable(sqdb, 'TAGS');
const tagsDAO = new BaseDAO(Tag, sqdb);
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
                if (minimatch(info.vpath, i))
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
            info.rendersToHTML = minimatch(info.renderPath, '**/*.html')
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
        });
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
        const res = await this.dao.sqldb.all(`
            SELECT
                vpath,
                json_extract(docMetadata, '$.tags') as tags
            FROM DOCUMENTS
        `);
        const vpaths = [];
        for (const item of res) {
            if (!('tags' in item))
                continue;
            let tagsP = [];
            if (typeof item.tags === 'string') {
                tagsP = JSON.parse(item.tags);
            }
            else if (Array.isArray(item.tags)) {
                tagsP = item.tags;
            }
            for (const tag of tags) {
                if (tagsP.includes(tag)) {
                    vpaths.push(item.vpath);
                    break;
                }
            }
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
            if (!('tags' in item))
                continue;
            let tagsP = [];
            if (typeof item.tags === 'string') {
                tagsP = JSON.parse(item.tags);
            }
            else if (Array.isArray(item.tags)) {
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
                selector.layout = { eq: options.layouts[0] };
            }
            else {
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
                return minimatch(item.vpath, options.glob);
            }
            else {
                return false;
            }
        })
            : result4;
        const result6 = (options.renderglob
            && typeof options.renderglob === 'string') ? result5.filter(item => {
            if (item.renderPath) {
                return minimatch(item.renderPath, options.renderglob);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1jYWNoZS1zcWxpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvZmlsZS1jYWNoZS1zcWxpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsT0FBTyxFQUFFLFdBQVcsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUM3RSxPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sR0FBRyxNQUFPLEtBQUssQ0FBQztBQUV2QixPQUFPLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDcEIsT0FBTyxZQUFZLE1BQU0sUUFBUSxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFFdEMsT0FBTyxFQUNILEtBQUssRUFFTCxFQUFFLEVBQ0YsRUFBRSxFQUNGLEtBQUssRUFDTCxLQUFLLEVBR0wsTUFBTSxFQUNOLE9BQU8sRUFHVixNQUFNLFlBQVksQ0FBQztBQUVwQixPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRWxDLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUUxQiwwQkFBMEI7QUFNbkIsSUFBTSxLQUFLLEdBQVgsTUFBTSxLQUFLO0NBdURqQixDQUFBO0FBaERHO0lBSkMsRUFBRSxDQUFDO1FBQ0EsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTTtLQUNoQyxDQUFDO0lBQ0QsS0FBSyxDQUFDLGFBQWEsQ0FBQzs7b0NBQ1A7QUFLZDtJQUhDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU07S0FDL0IsQ0FBQzs7bUNBQ1c7QUFNYjtJQUpDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU07S0FDbEMsQ0FBQztJQUNELEtBQUssQ0FBQyxlQUFlLENBQUM7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Q0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDN0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxzRkFBc0Y7SUFFdEYsY0FBYyxHQUFHLElBQUksa0JBQWtCLENBQ25DLE1BQU0sRUFDTixXQUFXLEVBQ1gsTUFBTSxDQUFDLFlBQVksQ0FDdEIsQ0FBQztJQUNGLE1BQU0sY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBRTdCLGNBQWMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDL0IsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ3hDLENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLGVBQWU7SUFDakMsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUNqQixNQUFNLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM3QixjQUFjLEdBQUcsU0FBUyxDQUFDO0lBQy9CLENBQUM7SUFDRCxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2QsTUFBTSxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsV0FBVyxHQUFHLFNBQVMsQ0FBQztJQUM1QixDQUFDO0lBQ0QsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUNmLE1BQU0sWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzNCLFlBQVksR0FBRyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUNELElBQUksYUFBYSxFQUFFLENBQUM7UUFDaEIsTUFBTSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDNUIsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUM5QixDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHsgRGlyc1dhdGNoZXIsIGRpclRvV2F0Y2gsIFZQYXRoRGF0YSB9IGZyb20gJ0Bha2FzaGFjbXMvc3RhY2tlZC1kaXJzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgdXJsICBmcm9tICd1cmwnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcyc7XG5pbXBvcnQgRlMgZnJvbSAnZnMnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaW1wb3J0IHsgbWluaW1hdGNoIH0gZnJvbSAnbWluaW1hdGNoJztcblxuaW1wb3J0IHtcbiAgICBmaWVsZCxcbiAgICBGaWVsZE9wdHMsXG4gICAgZmssXG4gICAgaWQsXG4gICAgaW5kZXgsXG4gICAgdGFibGUsXG4gICAgVGFibGVPcHRzLFxuICAgIFNxbERhdGFiYXNlLFxuICAgIHNjaGVtYSxcbiAgICBCYXNlREFPLFxuICAgIEZpbHRlcixcbiAgICBXaGVyZVxufSBmcm9tICdzcWxpdGUzb3JtJztcblxuaW1wb3J0IHsgc3FkYiB9IGZyb20gJy4uL3NxZGIuanMnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4uL2luZGV4LmpzJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5cbi8vLy8vLy8vLy8vLy8gQXNzZXRzIHRhYmxlXG5cbkB0YWJsZSh7XG4gICAgbmFtZTogJ0FTU0VUUycsXG4gICAgd2l0aG91dFJvd0lkOiB0cnVlLFxufSBhcyBUYWJsZU9wdHMpXG5leHBvcnQgY2xhc3MgQXNzZXQge1xuXG4gICAgLy8gUHJpbWFyeSBrZXlcbiAgICBAaWQoe1xuICAgICAgICBuYW1lOiAndnBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF92cGF0aCcpXG4gICAgdnBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtaW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIG1pbWU6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfbW91bnRlZCcpXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50UG9pbnQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF9tb3VudFBvaW50JylcbiAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X3BhdGhJbk1vdW50ZWQnKVxuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdmc3BhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF9mc3BhdGgnKVxuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlclBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF9yZW5kZXJQYXRoJylcbiAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbXRpbWVNcycsXG4gICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuICAgIH0pXG4gICAgbXRpbWVNczogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvOiBhbnk7XG5cbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0FTU0VUUycpO1xudHlwZSBUYXNzZXRzREFPID0gQmFzZURBTzxBc3NldD47XG5leHBvcnQgY29uc3QgYXNzZXRzREFPOiBUYXNzZXRzREFPXG4gICAgPSBuZXcgQmFzZURBTzxBc3NldD4oQXNzZXQsIHNxZGIpO1xuXG4vLy8vLy8vLy8vLy8gUGFydGlhbHMgVGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnUEFSVElBTFMnLFxuICAgIHdpdGhvdXRSb3dJZDogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgUGFydGlhbCB7XG5cbiAgICAvLyBQcmltYXJ5IGtleVxuICAgIEBpZCh7XG4gICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfdnBhdGgnKVxuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBtaW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfbW91bnRlZCcpXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50UG9pbnQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX21vdW50UG9pbnQnKVxuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9wYXRoSW5Nb3VudGVkJylcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9mc3BhdGgnKVxuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlclBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX3JlbmRlclBhdGgnKVxuICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtdGltZU1zJyxcbiAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4gICAgfSlcbiAgICBtdGltZU1zOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jTWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBkb2NNZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY0NvbnRlbnQnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBkb2NDb250ZW50OiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQm9keScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY0JvZHk6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIG1ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnaW5mbycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGluZm86IGFueTtcbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ1BBUlRJQUxTJyk7XG50eXBlIFRwYXJ0aWFsc0RBTyA9IEJhc2VEQU88UGFydGlhbD47XG5leHBvcnQgY29uc3QgcGFydGlhbHNEQU9cbiAgICA9IG5ldyBCYXNlREFPPFBhcnRpYWw+KFBhcnRpYWwsIHNxZGIpO1xuXG4vLy8vLy8vLy8vLy8vLy8vLyBMYXlvdXRzIFRhYmxlXG5cbkB0YWJsZSh7XG4gICAgbmFtZTogJ0xBWU9VVFMnLFxuICAgIHdpdGhvdXRSb3dJZDogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgTGF5b3V0IHtcblxuICAgIC8vIFByaW1hcnkga2V5XG4gICAgQGlkKHtcbiAgICAgICAgbmFtZTogJ3ZwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnbGF5b3V0X3ZwYXRoJylcbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21pbWUnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgbWltZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfbW91bnRlZCcpXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50UG9pbnQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfbW91bnRQb2ludCcpXG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3BhdGhJbk1vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfcGF0aEluTW91bnRlZCcpXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9mc3BhdGgnKVxuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlclBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfcmVuZGVyUGF0aCcpXG4gICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbiAgICB9KVxuICAgIG10aW1lTXM6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQ29udGVudCcsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY0NvbnRlbnQ6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NCb2R5JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jQm9keTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgbWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdpbmZvJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgaW5mbzogYW55O1xuXG59XG5cbmF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdMQVlPVVRTJyk7XG50eXBlIFRsYXlvdXRzREFPID0gQmFzZURBTzxMYXlvdXQ+O1xuZXhwb3J0IGNvbnN0IGxheW91dHNEQU9cbiAgICA9IG5ldyBCYXNlREFPPExheW91dD4oTGF5b3V0LCBzcWRiKTtcblxuLy8vLy8vLy8vLy8vLy8vIERvY3VtZW50cyBUYWJsZVxuXG5AdGFibGUoe1xuICAgIG5hbWU6ICdET0NVTUVOVFMnLFxuICAgIHdpdGhvdXRSb3dJZDogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgRG9jdW1lbnQge1xuXG4gICAgLy8gUHJpbWFyeSBrZXlcbiAgICBAaWQoe1xuICAgICAgICBuYW1lOiAndnBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX3ZwYXRoJylcbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21pbWUnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgbWltZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX21vdW50ZWQnKVxuICAgIG1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudFBvaW50JywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19tb3VudFBvaW50JylcbiAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfcGF0aEluTW91bnRlZCcpXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfZnNwYXRoJylcbiAgICBmc3BhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdyZW5kZXJQYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19yZW5kZXJQYXRoJylcbiAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyc1RvSFRNTCcsIGRidHlwZTogJ0lOVEVHRVInXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfcmVuZGVyc1RvSFRNTCcpXG4gICAgcmVuZGVyc1RvSFRNTDogYm9vbGVhbjtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkaXJuYW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19kaXJuYW1lJylcbiAgICBkaXJuYW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncGFyZW50RGlyJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19wYXJlbnREaXInKVxuICAgIHBhcmVudERpcjogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbiAgICB9KVxuICAgIG10aW1lTXM6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQ29udGVudCcsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IGZhbHNlXG4gICAgfSlcbiAgICBkb2NDb250ZW50OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQm9keScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IGZhbHNlXG4gICAgfSlcbiAgICBkb2NCb2R5OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBtZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3RhZ3MnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICB0YWdzOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbGF5b3V0JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogZmFsc2VcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19sYXlvdXQnKVxuICAgIGxheW91dDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvOiBhbnk7XG5cbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0RPQ1VNRU5UUycpO1xudHlwZSBUZG9jdW1lbnRzc0RBTyA9IEJhc2VEQU88RG9jdW1lbnQ+O1xuZXhwb3J0IGNvbnN0IGRvY3VtZW50c0RBT1xuICAgID0gbmV3IEJhc2VEQU88RG9jdW1lbnQ+KERvY3VtZW50LCBzcWRiKTtcblxuQHRhYmxlKHsgbmFtZTogJ1RBR0dMVUUnIH0pXG5jbGFzcyBUYWdHbHVlIHtcblxuICAgIEBmaWVsZCh7IG5hbWU6ICdkb2N2cGF0aCcsIGRidHlwZTogJ3N0cmluZycgfSlcbiAgICBAZmsoJ3RhZ19kb2N2cGF0aCcsICdET0NVTUVOVFMnLCAndnBhdGgnKVxuICAgIEBpbmRleCgndGFnZ2x1ZV92cGF0aCcpXG4gICAgZG9jdnBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7IG5hbWU6ICdzbHVnJywgZGJ0eXBlOiAnc3RyaW5nJyB9KVxuICAgIEBmaygndGFnX3NsdWcnLCAnVEFHUycsICdzbHVnJylcbiAgICBAaW5kZXgoJ3RhZ2dsdWVfc2x1ZycpXG4gICAgc2x1Zzogc3RyaW5nO1xufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnVEFHR0xVRScpO1xuY29uc3QgdGFnR2x1ZURBTyA9IG5ldyBCYXNlREFPPFRhZ0dsdWU+KFRhZ0dsdWUsIHNxZGIpO1xuXG5AdGFibGUoeyBuYW1lOiAnVEFHUycgfSlcbmNsYXNzIFRhZyB7XG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3RhZ25hbWUnLFxuICAgICAgICBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgdGFnbmFtZTogc3RyaW5nO1xuXG4gICAgQGlkKHtcbiAgICAgICAgbmFtZTogJ3NsdWcnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCd0YWdfc2x1ZycpXG4gICAgc2x1Zzogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2Rlc2NyaXB0aW9uJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnVEFHUycpO1xuY29uc3QgdGFnc0RBTyA9IG5ldyBCYXNlREFPPFRhZz4oVGFnLCBzcWRiKTtcblxuXG4vLyBDb252ZXJ0IEFrYXNoYUNNUyBtb3VudCBwb2ludHMgaW50byB0aGUgbW91bnRwb2ludFxuLy8gdXNlZCBieSBEaXJzV2F0Y2hlclxuY29uc3QgcmVtYXBkaXJzID0gZGlyeiA9PiB7XG4gICAgcmV0dXJuIGRpcnoubWFwKGRpciA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdkb2N1bWVudCBkaXIgJywgZGlyKTtcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpcixcbiAgICAgICAgICAgICAgICBtb3VudFBvaW50OiAnLycsXG4gICAgICAgICAgICAgICAgYmFzZU1ldGFkYXRhOiB7fVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghZGlyLmRlc3QpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlbWFwZGlycyBpbnZhbGlkIG1vdW50IHNwZWNpZmljYXRpb24gJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLnNyYyxcbiAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIuZGVzdCxcbiAgICAgICAgICAgICAgICBiYXNlTWV0YWRhdGE6IGRpci5iYXNlTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgaWdub3JlOiBkaXIuaWdub3JlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFR5cGUgZm9yIHJldHVybiBmcm9tIHBhdGhzIG1ldGhvZC4gIFRoZSBmaWVsZHMgaGVyZVxuICogYXJlIHdoYXRzIGluIHRoZSBBc3NldC9MYXlvdXQvUGFydGlhbCBjbGFzc2VzIGFib3ZlXG4gKiBwbHVzIGEgY291cGxlIGZpZWxkcyB0aGF0IG9sZGVyIGNvZGUgZXhwZWN0ZWRcbiAqIGZyb20gdGhlIHBhdGhzIG1ldGhvZC5cbiAqL1xuZXhwb3J0IHR5cGUgUGF0aHNSZXR1cm5UeXBlID0ge1xuICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgbWltZTogc3RyaW5nLFxuICAgIG1vdW50ZWQ6IHN0cmluZyxcbiAgICBtb3VudFBvaW50OiBzdHJpbmcsXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nLFxuICAgIG10aW1lTXM6IHN0cmluZyxcbiAgICBpbmZvOiBhbnksXG4gICAgLy8gVGhlc2Ugd2lsbCBiZSBjb21wdXRlZCBpbiBCYXNlRmlsZUNhY2hlXG4gICAgLy8gVGhleSB3ZXJlIHJldHVybmVkIGluIHByZXZpb3VzIHZlcnNpb25zLlxuICAgIGZzcGF0aDogc3RyaW5nLFxuICAgIHJlbmRlclBhdGg6IHN0cmluZ1xufTtcblxuZXhwb3J0IGNsYXNzIEJhc2VGaWxlQ2FjaGU8XG4gICAgICAgIFQgZXh0ZW5kcyBBc3NldCB8IExheW91dCB8IFBhcnRpYWwgfCBEb2N1bWVudCxcbiAgICAgICAgVGRhbyBleHRlbmRzIEJhc2VEQU88VD5cbj4gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gICAgI2NvbmZpZz86IENvbmZpZ3VyYXRpb247XG4gICAgI25hbWU/OiBzdHJpbmc7XG4gICAgI2RpcnM/OiBkaXJUb1dhdGNoW107XG4gICAgI2lzX3JlYWR5OiBib29sZWFuID0gZmFsc2U7XG4gICAgI2NhY2hlX2NvbnRlbnQ6IGJvb2xlYW47XG4gICAgI21hcF9yZW5kZXJwYXRoOiBib29sZWFuO1xuICAgICNkYW86IFRkYW87IC8vIEJhc2VEQU88VD47XG5cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAgICogQHBhcmFtIGRpcnMgYXJyYXkgb2YgZGlyZWN0b3JpZXMgYW5kIG1vdW50IHBvaW50cyB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBuYW1lIHN0cmluZyBnaXZpbmcgdGhlIG5hbWUgZm9yIHRoaXMgd2F0Y2hlciBuYW1lXG4gICAgICogQHBhcmFtIGRhbyBUaGUgU1FMSVRFM09STSBEQU8gaW5zdGFuY2UgdG8gdXNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb1dhdGNoW10sXG4gICAgICAgIGRhbzogVGRhbyAvLyBCYXNlREFPPFQ+XG4gICAgKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBCYXNlRmlsZUNhY2hlICR7bmFtZX0gY29uc3RydWN0b3IgZGlycz0ke3V0aWwuaW5zcGVjdChkaXJzKX1gKTtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLiNuYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy4jZGlycyA9IGRpcnM7XG4gICAgICAgIHRoaXMuI2lzX3JlYWR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuI2NhY2hlX2NvbnRlbnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jbWFwX3JlbmRlcnBhdGggPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jZGFvID0gZGFvO1xuICAgIH1cblxuICAgIGdldCBjb25maWcoKSAgICAgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgZ2V0IG5hbWUoKSAgICAgICB7IHJldHVybiB0aGlzLiNuYW1lOyB9XG4gICAgZ2V0IGRpcnMoKSAgICAgICB7IHJldHVybiB0aGlzLiNkaXJzOyB9XG4gICAgc2V0IGNhY2hlQ29udGVudChkb2l0KSB7IHRoaXMuI2NhY2hlX2NvbnRlbnQgPSBkb2l0OyB9XG4gICAgZ2V0IGdhY2hlQ29udGVudCgpIHsgcmV0dXJuIHRoaXMuI2NhY2hlX2NvbnRlbnQ7IH1cbiAgICBzZXQgbWFwUmVuZGVyUGF0aChkb2l0KSB7IHRoaXMuI21hcF9yZW5kZXJwYXRoID0gZG9pdDsgfVxuICAgIGdldCBtYXBSZW5kZXJQYXRoKCkgeyByZXR1cm4gdGhpcy4jbWFwX3JlbmRlcnBhdGg7IH1cbiAgICBnZXQgZGFvKCk6IFRkYW8geyByZXR1cm4gdGhpcy4jZGFvOyB9XG5cbiAgICAvLyBTS0lQOiBnZXREeW5hbWljVmlld1xuXG5cbiAgICAjd2F0Y2hlcjogRGlyc1dhdGNoZXI7XG4gICAgI3F1ZXVlO1xuXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLiNxdWV1ZSkge1xuICAgICAgICAgICAgdGhpcy4jcXVldWUua2lsbEFuZERyYWluKCk7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4jd2F0Y2hlcikge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENMT1NJTkcgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiN3YXRjaGVyLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLiN3YXRjaGVyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdjaGFuZ2VkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdhZGRlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygndW5saW5rZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlYWR5Jyk7XG5cbiAgICAgICAgYXdhaXQgc3FkYi5jbG9zZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB1cCByZWNlaXZpbmcgZXZlbnRzIGZyb20gRGlyc1dhdGNoZXIsIGFuZCBkaXNwYXRjaGluZyB0b1xuICAgICAqIHRoZSBoYW5kbGVyIG1ldGhvZHMuXG4gICAgICovXG4gICAgYXN5bmMgc2V0dXAoKSB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuI3dhdGNoZXIpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuI3F1ZXVlID0gZmFzdHEucHJvbWlzZShhc3luYyBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5jb2RlID09PSAnY2hhbmdlZCcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hhbmdlICR7ZXZlbnQubmFtZX0gJHtldmVudC5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlQ2hhbmdlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2NoYW5nZScsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ2FkZGVkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGQgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVBZGRlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2FkZCcsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ3VubGlua2VkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGB1bmxpbmsgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVVbmxpbmtlZChldmVudC5uYW1lLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ3VubGluaycsIGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ2Vycm9yJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogZXZlbnQuY29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGF0aDogZXZlbnQuaW5mby52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIH0gZWxzZSBpZiAoZXZlbnQuY29kZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVFcnJvcihldmVudC5uYW1lKSAqL1xuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAncmVhZHknKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZVJlYWR5KGV2ZW50Lm5hbWUpO1xuICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdyZWFkeScsIGV2ZW50Lm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMCk7XG5cbiAgICAgICAgdGhpcy4jd2F0Y2hlciA9IG5ldyBEaXJzV2F0Y2hlcih0aGlzLm5hbWUpO1xuXG4gICAgICAgIHRoaXMuI3dhdGNoZXIub24oJ2NoYW5nZScsIGFzeW5jIChuYW1lLCBpbmZvKSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtuYW1lfSBjaGFuZ2VkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBQVVNIICR7bmFtZX0gY2hhbmdlZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ2NoYW5nZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAnY2hhbmdlJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgY2hhbmdlICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdhZGQnLCBhc3luYyAobmFtZSwgaW5mbykgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtuYW1lfSBhZGQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFVTSCAke25hbWV9IGFkZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ2FkZGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ2FkZCcgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIGFkZCAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigndW5saW5rJywgYXN5bmMgKG5hbWUsIGluZm8pID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGB1bmxpbmsgJHtuYW1lfSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ3VubGlua2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGluZm9cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYElnbm9yZWQgJ3VubGluaycgZm9yICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCB1bmxpbmsgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ3JlYWR5JywgYXN5bmMgKG5hbWUpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IHJlYWR5YCk7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgICAgICBjb2RlOiAncmVhZHknLFxuICAgICAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtYXBwZWQgPSByZW1hcGRpcnModGhpcy5kaXJzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHNldHVwICR7dGhpcy4jbmFtZX0gd2F0Y2ggJHt1dGlsLmluc3BlY3QodGhpcy4jZGlycyl9ID09PiAke3V0aWwuaW5zcGVjdChtYXBwZWQpfWApO1xuICAgICAgICBhd2FpdCB0aGlzLiN3YXRjaGVyLndhdGNoKG1hcHBlZCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYERBTyAke3RoaXMuZGFvLnRhYmxlLm5hbWV9ICR7dXRpbC5pbnNwZWN0KHRoaXMuZGFvLnRhYmxlLmZpZWxkcyl9YCk7XG5cbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvOiBUKSB7XG4gICAgICAgIC8vIFBsYWNlaG9sZGVyIHdoaWNoIHNvbWUgc3ViY2xhc3Nlc1xuICAgICAgICAvLyBhcmUgZXhwZWN0ZWQgdG8gb3ZlcnJpZGVcblxuICAgICAgICBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoO1xuICAgIH1cblxuICAgIGFzeW5jIGhhbmRsZUNoYW5nZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZUNoYW5nZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09PT09PR0EhISEgUmVjZWl2ZWQgYSBmaWxlIHRoYXQgc2hvdWxkIGJlIGluZ29yZWQgYCwgaW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVDaGFuZ2VkIGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhhbmRsZUNoYW5nZWQgJHtpbmZvLnZwYXRofSAke2luZm8ubWV0YWRhdGEgJiYgaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPyBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA6ICc/Pz8nfWApO1xuXG4gICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgIHZwYXRoOiB7IGVxOiBpbmZvLnZwYXRoIH0sXG4gICAgICAgICAgICBtb3VudGVkOiB7IGVxOiBpbmZvLm1vdW50ZWQgfVxuICAgICAgICB9IGFzIEZpbHRlcjxUPik7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIUFycmF5LmlzQXJyYXkocmVzdWx0KVxuICAgICAgICAgfHwgcmVzdWx0Lmxlbmd0aCA8PSAwXG4gICAgICAgICkge1xuICAgICAgICAgICAgLy8gSXQgd2Fzbid0IGZvdW5kIGluIHRoZSBkYXRhYmFzZS4gIEhlbmNlXG4gICAgICAgICAgICAvLyB3ZSBzaG91bGQgYWRkIGl0LlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlQWRkZWQobmFtZSwgaW5mbyk7XG4gICAgICAgIH1cblxuICAgICAgICBpbmZvLnN0YWNrID0gdW5kZWZpbmVkO1xuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZURvY0luREIoaW5mbyk7XG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmhvb2tGaWxlQ2hhbmdlZChuYW1lLCBpbmZvKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuI2Rhby51cGRhdGUoe1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgLy8gZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgLy8gZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICB9IGFzIFQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdlIHJlY2VpdmUgdGhpczpcbiAgICAgKlxuICAgICAqIHtcbiAgICAgKiAgICBmc3BhdGg6IGZzcGF0aCxcbiAgICAgKiAgICB2cGF0aDogdnBhdGgsXG4gICAgICogICAgbWltZTogbWltZS5nZXRUeXBlKGZzcGF0aCksXG4gICAgICogICAgbW91bnRlZDogZGlyLm1vdW50ZWQsXG4gICAgICogICAgbW91bnRQb2ludDogZGlyLm1vdW50UG9pbnQsXG4gICAgICogICAgcGF0aEluTW91bnRlZDogY29tcHV0ZWQgcmVsYXRpdmUgcGF0aFxuICAgICAqICAgIHN0YWNrOiBbIGFycmF5IG9mIHRoZXNlIGluc3RhbmNlcyBdXG4gICAgICogfVxuICAgICAqXG4gICAgICogTmVlZCB0byBhZGQ6XG4gICAgICogICAgcmVuZGVyUGF0aFxuICAgICAqICAgIEFuZCBmb3IgSFRNTCByZW5kZXIgZmlsZXMsIGFkZCB0aGUgYmFzZU1ldGFkYXRhIGFuZCBkb2NNZXRhZGF0YVxuICAgICAqXG4gICAgICogU2hvdWxkIHJlbW92ZSB0aGUgc3RhY2ssIHNpbmNlIGl0J3MgbGlrZWx5IG5vdCB1c2VmdWwgdG8gdXMuXG4gICAgICovXG5cbiAgICBhc3luYyBoYW5kbGVBZGRlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vICBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZUFkZGVkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmICh0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBPT09PT09PT0dBISEhIFJlY2VpdmVkIGEgZmlsZSB0aGF0IHNob3VsZCBiZSBpbmdvcmVkIGAsIGluZm8pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlQWRkZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5zZXJ0RG9jVG9EQihpbmZvKTtcbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVBZGRlZChuYW1lLCBpbmZvKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgaW5zZXJ0RG9jVG9EQihpbmZvKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuI2Rhby5pbnNlcnQoe1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgLy8gZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgLy8gZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICB9IGFzIFQpO1xuICAgIH1cblxuICAgIGFzeW5jIGhhbmRsZVVubGlua2VkKG5hbWUsIGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVVbmxpbmtlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZVVubGlua2VkIGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZVVubGlua2VkKG5hbWUsIGluZm8pO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuI2Rhby5kZWxldGVBbGwoe1xuICAgICAgICAgICAgdnBhdGg6IHsgZXE6IGluZm8udnBhdGggfSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IHsgZXE6IGluZm8ubW91bnRlZCB9XG4gICAgICAgIH0gYXMgV2hlcmU8VD4pO1xuICAgIH1cblxuICAgIGFzeW5jIGhhbmRsZVJlYWR5KG5hbWUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtuYW1lfSBoYW5kbGVSZWFkeWApO1xuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZVJlYWR5IGV2ZW50IGZvciB3cm9uZyBuYW1lOyBnb3QgJHtuYW1lfSwgZXhwZWN0ZWQgJHt0aGlzLm5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jaXNfcmVhZHkgPSB0cnVlO1xuICAgICAgICB0aGlzLmVtaXQoJ3JlYWR5JywgbmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgZGlyZWN0b3J5IG1vdW50IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGZpbGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGluZm9cbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGZpbGVEaXJNb3VudChpbmZvKSB7XG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiBtYXBwZWQpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkaXJNb3VudCBmb3IgJHtpbmZvLnZwYXRofSAtLSAke3V0aWwuaW5zcGVjdChpbmZvKX0gPT09ICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgICAgICBpZiAoaW5mby5tb3VudFBvaW50ID09PSBkaXIubW91bnRQb2ludCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaG91bGQgdGhpcyBmaWxlIGJlIGlnbm9yZWQsIGJhc2VkIG9uIHRoZSBgaWdub3JlYCBmaWVsZFxuICAgICAqIGluIHRoZSBtYXRjaGluZyBgZGlyYCBtb3VudCBlbnRyeS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgaWdub3JlRmlsZShpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgY29uc3QgZGlyTW91bnQgPSB0aGlzLmZpbGVEaXJNb3VudChpbmZvKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgJHtpbmZvLnZwYXRofSBkaXJNb3VudCAke3V0aWwuaW5zcGVjdChkaXJNb3VudCl9YCk7XG4gICAgICAgIGxldCBpZ25vcmUgPSBmYWxzZTtcbiAgICAgICAgaWYgKGRpck1vdW50KSB7XG5cbiAgICAgICAgICAgIGxldCBpZ25vcmVzO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkaXJNb3VudC5pZ25vcmUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IFsgZGlyTW91bnQuaWdub3JlIF07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGlyTW91bnQuaWdub3JlKSkge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBkaXJNb3VudC5pZ25vcmU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlnbm9yZXMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpZ25vcmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1pbmltYXRjaChpbmZvLnZwYXRoLCBpKSkgaWdub3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZGlyTW91bnQuaWdub3JlICR7ZnNwYXRofSAke2l9ID0+ICR7aWdub3JlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgKGlnbm9yZSkgY29uc29sZS5sb2coYE1VU1QgaWdub3JlIEZpbGUgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgZm9yICR7aW5mby52cGF0aH0gPT0+ICR7aWdub3JlfWApO1xuICAgICAgICAgICAgcmV0dXJuIGlnbm9yZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vIG1vdW50PyAgdGhhdCBtZWFucyBzb21ldGhpbmcgc3RyYW5nZVxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgTm8gZGlyTW91bnQgZm91bmQgZm9yICR7aW5mby52cGF0aH0gLyAke2luZm8uZGlyTW91bnRlZE9ufWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGxvdyBhIGNhbGxlciB0byB3YWl0IHVudGlsIHRoZSA8ZW0+cmVhZHk8L2VtPiBldmVudCBoYXNcbiAgICAgKiBiZWVuIHNlbnQgZnJvbSB0aGUgRGlyc1dhdGNoZXIgaW5zdGFuY2UuICBUaGlzIGV2ZW50IG1lYW5zIHRoZVxuICAgICAqIGluaXRpYWwgaW5kZXhpbmcgaGFzIGhhcHBlbmVkLlxuICAgICAqL1xuICAgIGFzeW5jIGlzUmVhZHkoKSB7XG4gICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZGlyZWN0b3JpZXMsIHRoZXJlIHdvbid0IGJlIGFueSBmaWxlcyBcbiAgICAgICAgLy8gdG8gbG9hZCwgYW5kIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICB3aGlsZSAodGhpcy4jZGlycy5sZW5ndGggPiAwICYmICF0aGlzLiNpc19yZWFkeSkge1xuICAgICAgICAgICAgLy8gVGhpcyBkb2VzIGEgMTAwbXMgcGF1c2VcbiAgICAgICAgICAgIC8vIFRoYXQgbGV0cyB1cyBjaGVjayBpc19yZWFkeSBldmVyeSAxMDBtc1xuICAgICAgICAgICAgLy8gYXQgdmVyeSBsaXR0bGUgY29zdFxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCFpc1JlYWR5ICR7dGhpcy5uYW1lfSAke3RoaXNbX3N5bWJfZGlyc10ubGVuZ3RofSAke3RoaXNbX3N5bWJfaXNfcmVhZHldfWApO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGFzeW5jIHBhdGhzKHJvb3RQYXRoPzogc3RyaW5nKVxuICAgICAgICA6IFByb21pc2U8QXJyYXk8UGF0aHNSZXR1cm5UeXBlPj5cbiAgICB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cblxuICAgICAgICBsZXQgcm9vdFAgPSByb290UGF0aD8uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IHJvb3RQYXRoPy5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogcm9vdFBhdGg7XG5cbiAgICAgICAgLy8gVGhpcyBpcyBjb3BpZWQgZnJvbSB0aGUgb2xkZXIgdmVyc2lvblxuICAgICAgICAvLyAoTG9raUpTIHZlcnNpb24pIG9mIHRoaXMgZnVuY3Rpb24uICBJdFxuICAgICAgICAvLyBzZWVtcyBtZWFudCB0byBlbGltaW5hdGUgZHVwbGljYXRlcy5cbiAgICAgICAgY29uc3QgdnBhdGhzU2VlbiA9IG5ldyBTZXQoKTtcblxuICAgICAgICBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICAgICAgIG9yZGVyOiB7IG10aW1lTXM6IHRydWUgfVxuICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgaWYgKHR5cGVvZiByb290UCA9PT0gJ3N0cmluZydcbiAgICAgICAgJiYgcm9vdFAubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLnJlbmRlclBhdGggPSB7XG4gICAgICAgICAgICAgICAgaXNMaWtlOiBgJHtyb290UH0lYFxuICAgICAgICAgICAgICAgIC8vIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnXiR7cm9vdFB9JyBgXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBwYXRocyAke3V0aWwuaW5zcGVjdChzZWxlY3Rvcil9YCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbChzZWxlY3Rvcik7XG4gICAgICAgIGNvbnN0IHJlc3VsdDIgPSByZXN1bHQuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHBhdGhzID9pZ25vcmU/ICR7aXRlbS52cGF0aH1gKTtcbiAgICAgICAgICAgIGlmIChmY2FjaGUuaWdub3JlRmlsZShpdGVtKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2cGF0aHNTZWVuLmhhcygoaXRlbSBhcyBBc3NldCkudnBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2cGF0aHNTZWVuLmFkZCgoaXRlbSBhcyBBc3NldCkudnBhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gY29uc3QgcmVzdWx0MyA9IHJlc3VsdDIuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAvLyAgICAgLy8gV2UgbmVlZCB0aGVzZSB0byBiZSBvbmUgb2YgdGhlIGNvbmNyZXRlXG4gICAgICAgIC8vICAgICAvLyB0eXBlcyBzbyB0aGF0IHRoZSBtdGltZU1zIGZpZWxkIGlzXG4gICAgICAgIC8vICAgICAvLyByZWNvZ25pemVkIGJ5IFR5cGVTY3JpcHQuICBUaGUgQXNzZXRcbiAgICAgICAgLy8gICAgIC8vIGNsYXNzIGlzIGEgZ29vZCBzdWJzdGl0dXRlIGZvciB0aGUgYmFzZVxuICAgICAgICAvLyAgICAgLy8gY2xhc3Mgb2YgY2FjaGVkIGZpbGVzLlxuICAgICAgICAvLyAgICAgY29uc3QgYWEgPSA8QXNzZXQ+YTtcbiAgICAgICAgLy8gICAgIGNvbnN0IGJiID0gPEFzc2V0PmI7XG4gICAgICAgIC8vICAgICBpZiAoYWEubXRpbWVNcyA8IGJiLm10aW1lTXMpIHJldHVybiAxO1xuICAgICAgICAvLyAgICAgaWYgKGFhLm10aW1lTXMgPT09IGJiLm10aW1lTXMpIHJldHVybiAwO1xuICAgICAgICAvLyAgICAgaWYgKGFhLm10aW1lTXMgPiBiYi5tdGltZU1zKSByZXR1cm4gLTE7XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIC8vIFRoaXMgc3RhZ2UgY29udmVydHMgdGhlIGl0ZW1zIFxuICAgICAgICAvLyByZWNlaXZlZCBieSB0aGlzIGZ1bmN0aW9uIGludG9cbiAgICAgICAgLy8gd2hhdCBpcyByZXF1aXJlZCBmcm9tXG4gICAgICAgIC8vIHRoZSBwYXRocyBtZXRob2QuXG4gICAgICAgIC8vIGNvbnN0IHJlc3VsdDRcbiAgICAgICAgLy8gICAgICAgICA9IG5ldyBBcnJheTxQYXRoc1JldHVyblR5cGU+KCk7XG4gICAgICAgIC8vIGZvciAoY29uc3QgaXRlbSBvZiByZXN1bHQzKSB7XG4gICAgICAgIC8vICAgICByZXN1bHQ0LnB1c2goPFBhdGhzUmV0dXJuVHlwZT57XG4gICAgICAgIC8vICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgIC8vICAgICAgICAgbWltZTogaXRlbS5taW1lLFxuICAgICAgICAvLyAgICAgICAgIG1vdW50ZWQ6IGl0ZW0ubW91bnRlZCxcbiAgICAgICAgLy8gICAgICAgICBtb3VudFBvaW50OiBpdGVtLm1vdW50UG9pbnQsXG4gICAgICAgIC8vICAgICAgICAgcGF0aEluTW91bnRlZDogaXRlbS5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAvLyAgICAgICAgIG10aW1lTXM6IGl0ZW0ubXRpbWVNcyxcbiAgICAgICAgLy8gICAgICAgICBpbmZvOiBpdGVtLmluZm8sXG4gICAgICAgIC8vICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaXRlbS5tb3VudGVkLCBpdGVtLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0udnBhdGhcbiAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2cocmVzdWx0Mi8qLm1hcChpdGVtID0+IHtcbiAgICAgICAgLy8gICAgIHJldHVybiB7XG4gICAgICAgIC8vICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgIC8vICAgICAgICAgbXRpbWVNczogaXRlbS5tdGltZU1zXG4gICAgICAgIC8vICAgICB9O1xuICAgICAgICAvLyB9KSAqLyk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgZmlsZSB3aXRoaW4gdGhlIGNhY2hlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBUaGUgdnBhdGggb3IgcmVuZGVyUGF0aCB0byBsb29rIGZvclxuICAgICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgICovXG4gICAgYXN5bmMgZmluZChfZnBhdGgpOiBQcm9taXNlPFQ+IHtcblxuICAgICAgICBpZiAodHlwZW9mIF9mcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZCBwYXJhbWV0ZXIgbm90IHN0cmluZyAke3R5cGVvZiBfZnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgICAgICBvcjogW1xuICAgICAgICAgICAgICAgIHsgdnBhdGg6IHsgZXE6IGZwYXRoIH19LFxuICAgICAgICAgICAgICAgIHsgcmVuZGVyUGF0aDogeyBlcTogZnBhdGggfX1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kICR7X2ZwYXRofSAke2ZwYXRofSA9PT4gcmVzdWx0MSAke3V0aWwuaW5zcGVjdChyZXN1bHQxKX0gYCk7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MiA9IHJlc3VsdDEuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuICEoZmNhY2hlLmlnbm9yZUZpbGUoaXRlbSkpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZCAke19mcGF0aH0gJHtmcGF0aH0gPT0+IHJlc3VsdDIgJHt1dGlsLmluc3BlY3QocmVzdWx0Mil9IGApO1xuXG4gICAgICAgIGxldCByZXQ7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdDIpICYmIHJlc3VsdDIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0ID0gcmVzdWx0MlswXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdDIpICYmIHJlc3VsdDIubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHJldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IHJlc3VsdDI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAjZkV4aXN0c0luRGlyKGZwYXRoLCBkaXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYCNmRXhpc3RzSW5EaXIgJHtmcGF0aH0gJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgaWYgKGRpci5tb3VudFBvaW50ID09PSAnLycpIHtcbiAgICAgICAgICAgIGNvbnN0IGZzcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBkaXIubW91bnRlZCwgZnBhdGhcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsZXQgZnNleGlzdHMgPSBGUy5leGlzdHNTeW5jKGZzcGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChmc2V4aXN0cykge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IEZTLnN0YXRTeW5jKGZzcGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxWUGF0aERhdGE+IHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLm1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogc3RhdHMubXRpbWVNc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbXAgPSBkaXIubW91bnRQb2ludC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gZGlyLm1vdW50UG9pbnQuc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IGRpci5tb3VudFBvaW50O1xuICAgICAgICBtcCA9IG1wLmVuZHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gbXBcbiAgICAgICAgICAgIDogKG1wKycvJyk7XG5cbiAgICAgICAgaWYgKGZwYXRoLnN0YXJ0c1dpdGgobXApKSB7XG4gICAgICAgICAgICBsZXQgcGF0aEluTW91bnRlZFxuICAgICAgICAgICAgICAgID0gZnBhdGgucmVwbGFjZShkaXIubW91bnRQb2ludCwgJycpO1xuICAgICAgICAgICAgbGV0IGZzcGF0aCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICBkaXIubW91bnRlZCwgcGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ2hlY2tpbmcgZXhpc3QgZm9yICR7ZGlyLm1vdW50UG9pbnR9ICR7ZGlyLm1vdW50ZWR9ICR7cGF0aEluTW91bnRlZH0gJHtmc3BhdGh9YCk7XG4gICAgICAgICAgICBsZXQgZnNleGlzdHMgPSBGUy5leGlzdHNTeW5jKGZzcGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChmc2V4aXN0cykge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IEZTLnN0YXRTeW5jKGZzcGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxWUGF0aERhdGE+IHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBmc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLm1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBzdGF0cy5tdGltZU1zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRnVsZmlsbHMgdGhlIFwiZmluZFwiIG9wZXJhdGlvbiBub3QgYnlcbiAgICAgKiBsb29raW5nIGluIHRoZSBkYXRhYmFzZSwgYnV0IGJ5IHNjYW5uaW5nXG4gICAgICogdGhlIGZpbGVzeXN0ZW0gdXNpbmcgc3luY2hyb25vdXMgY2FsbHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGZpbmRTeW5jKF9mcGF0aCk6IFZQYXRoRGF0YSB8IHVuZGVmaW5lZCB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfZnBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZpbmQgcGFyYW1ldGVyIG5vdCBzdHJpbmcgJHt0eXBlb2YgX2ZwYXRofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZFN5bmMgbG9va2luZyBmb3IgJHtmcGF0aH0gaW4gJHt1dGlsLmluc3BlY3QobWFwcGVkKX1gKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiBtYXBwZWQpIHtcbiAgICAgICAgICAgIGlmICghKGRpcj8ubW91bnRQb2ludCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYGZpbmRTeW5jIGJhZCBkaXJzIGluICR7dXRpbC5pbnNwZWN0KHRoaXMuZGlycyl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmb3VuZCA9IHRoaXMuI2ZFeGlzdHNJbkRpcihmcGF0aCwgZGlyKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kU3luYyAke2ZwYXRofSBmb3VuZGAsIGZvdW5kKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBhc3luYyBmaW5kQWxsKCkge1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgIH0gYXMgRmlsdGVyPFQ+KTtcblxuICAgICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0MS5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmluZEFsbCA/aWdub3JlPyAke2l0ZW0udnBhdGh9YCk7XG4gICAgICAgICAgICByZXR1cm4gIShmY2FjaGUuaWdub3JlRmlsZShpdGVtKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0MjtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZXNGaWxlQ2FjaGU8XG4gICAgVCBleHRlbmRzIExheW91dCB8IFBhcnRpYWwsXG4gICAgVGRhbyBleHRlbmRzIEJhc2VEQU88VD4+XG4gICAgZXh0ZW5kcyBCYXNlRmlsZUNhY2hlPFQsIFRkYW8+IHtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZGlyczogZGlyVG9XYXRjaFtdLFxuICAgICAgICBkYW86IFRkYW9cbiAgICApIHtcbiAgICAgICAgc3VwZXIoY29uZmlnLCBuYW1lLCBkaXJzLCBkYW8pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdhdGhlciB0aGUgYWRkaXRpb25hbCBkYXRhIHN1aXRhYmxlXG4gICAgICogZm9yIFBhcnRpYWwgYW5kIExheW91dCB0ZW1wbGF0ZXMuICBUaGVcbiAgICAgKiBmdWxsIGRhdGEgc2V0IHJlcXVpcmVkIGZvciBEb2N1bWVudHMgaXNcbiAgICAgKiBub3Qgc3VpdGFibGUgZm9yIHRoZSB0ZW1wbGF0ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5mbyBcbiAgICAgKi9cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvKSB7XG5cbiAgICAgICAgaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgaW5mby5kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAoaW5mby5kaXJuYW1lID09PSAnLicpIGluZm8uZGlybmFtZSA9ICcvJztcblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpbmZvLnJlbmRlcmVyID0gcmVuZGVyZXI7XG5cblxuICAgICAgICBpZiAocmVuZGVyZXIpIHtcblxuXG4gICAgICAgICAgICBpZiAocmVuZGVyZXIucGFyc2VNZXRhZGF0YSkge1xuXG4gICAgICAgICAgICAgICAgLy8gVXNpbmcgPGFueT4gaGVyZSBjb3ZlcnMgb3ZlclxuICAgICAgICAgICAgICAgIC8vIHRoYXQgcGFyc2VNZXRhZGF0YSByZXF1aXJlc1xuICAgICAgICAgICAgICAgIC8vIGEgUmVuZGVyaW5nQ29udGV4dCB3aGljaFxuICAgICAgICAgICAgICAgIC8vIGluIHR1cm4gcmVxdWlyZXMgYSBcbiAgICAgICAgICAgICAgICAvLyBtZXRhZGF0YSBvYmplY3QuXG4gICAgICAgICAgICAgICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKDxhbnk+e1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGluZm8uZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBGUy5yZWFkRmlsZVN5bmMoaW5mby5mc3BhdGgsICd1dGYtOCcpXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkb2NNZXRhZGF0YSBpcyB0aGUgdW5tb2RpZmllZCBtZXRhZGF0YS9mcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBkb2N1bWVudFxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEgPSByYy5tZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvLyBkb2NDb250ZW50IGlzIHRoZSB1bnBhcnNlZCBvcmlnaW5hbCBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gaW5jbHVkaW5nIGFueSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9IHJjLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcblxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIGNvbXB1dGVkIG1ldGFkYXRhIHRoYXQgaW5jbHVkZXMgZGF0YSBmcm9tIFxuICAgICAgICAgICAgICAgIC8vIHNldmVyYWwgc291cmNlc1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEgPSB7IH07XG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLmRvY01ldGFkYXRhKSBpbmZvLmRvY01ldGFkYXRhID0ge307XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW5pdE1ldGFkYXRhICR7YmFzZWRpcn0gJHtmcGF0aH0gYmFzZU1ldGFkYXRhICR7YmFzZU1ldGFkYXRhW3lwcm9wXX1gKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSBpbmZvLmJhc2VNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFRlbXBsYXRlc0ZpbGVDYWNoZSBhZnRlciBnYXRoZXJJbmZvRGF0YSBgLCBpbmZvKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlRG9jSW5EQihpbmZvKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLnVwZGF0ZSgoe1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICB9IGFzIHVua25vd24pIGFzIFQpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKGluZm86IGFueSkge1xuICAgICAgICBhd2FpdCB0aGlzLmRhby5pbnNlcnQoKHtcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfSBhcyB1bmtub3duKSBhcyBUKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEb2N1bWVudHNGaWxlQ2FjaGVcbiAgICBleHRlbmRzIEJhc2VGaWxlQ2FjaGU8RG9jdW1lbnQsIFRkb2N1bWVudHNzREFPPiB7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRpcnM6IGRpclRvV2F0Y2hbXVxuICAgICkge1xuICAgICAgICBzdXBlcihjb25maWcsIG5hbWUsIGRpcnMsIGRvY3VtZW50c0RBTyk7XG4gICAgfVxuXG4gICAgZ2F0aGVySW5mb0RhdGEoaW5mbykge1xuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIGluZm8uZGlybmFtZSA9IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8uZGlybmFtZSA9PT0gJy4nKSBpbmZvLmRpcm5hbWUgPSAnLyc7XG4gICAgICAgIGluZm8ucGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGluZm8uZGlybmFtZSk7XG5cbiAgICAgICAgLy8gZmluZCB0aGUgbW91bnRlZCBkaXJlY3RvcnksXG4gICAgICAgIC8vIGdldCB0aGUgYmFzZU1ldGFkYXRhXG4gICAgICAgIGZvciAobGV0IGRpciBvZiByZW1hcGRpcnModGhpcy5kaXJzKSkge1xuICAgICAgICAgICAgaWYgKGRpci5tb3VudGVkID09PSBpbmZvLm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlyLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLmJhc2VNZXRhZGF0YSA9IGRpci5iYXNlTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2V0IHB1YmxpY2F0aW9uRGF0ZSBzb21laG93XG5cblxuICAgICAgICBsZXQgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGluZm8udnBhdGgpO1xuICAgICAgICBpbmZvLnJlbmRlcmVyID0gcmVuZGVyZXI7XG5cbiAgICAgICAgaWYgKHJlbmRlcmVyKSB7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby52cGF0aCk7XG5cbiAgICAgICAgICAgIC8vIFRoaXMgd2FzIGluIHRoZSBMb2tpSlMgY29kZSwgYnV0XG4gICAgICAgICAgICAvLyB3YXMgbm90IGluIHVzZS5cbiAgICAgICAgICAgIC8vIGluZm8ucmVuZGVybmFtZSA9IHBhdGguYmFzZW5hbWUoXG4gICAgICAgICAgICAvLyAgICAgaW5mby5yZW5kZXJQYXRoXG4gICAgICAgICAgICAvLyApO1xuXG4gICAgICAgICAgICBpbmZvLnJlbmRlcnNUb0hUTUwgPSBtaW5pbWF0Y2goXG4gICAgICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICcqKi8qLmh0bWwnKVxuICAgICAgICAgICAgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBVc2luZyA8YW55PiBoZXJlIGNvdmVycyBvdmVyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBwYXJzZU1ldGFkYXRhIHJlcXVpcmVzXG4gICAgICAgICAgICAgICAgLy8gYSBSZW5kZXJpbmdDb250ZXh0IHdoaWNoXG4gICAgICAgICAgICAgICAgLy8gaW4gdHVybiByZXF1aXJlcyBhIFxuICAgICAgICAgICAgICAgIC8vIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY01ldGFkYXRhIGlzIHRoZSB1bm1vZGlmaWVkIG1ldGFkYXRhL2Zyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YSA9IHJjLm1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQgaXMgdGhlIHVucGFyc2VkIG9yaWdpbmFsIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAvLyBpbmNsdWRpbmcgYW55IGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NDb250ZW50ID0gcmMuY29udGVudDtcbiAgICAgICAgICAgICAgICAvLyBkb2NCb2R5IGlzIHRoZSBwYXJzZWQgYm9keSAtLSBlLmcuIGZvbGxvd2luZyB0aGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSByYy5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY29tcHV0ZWQgbWV0YWRhdGEgdGhhdCBpbmNsdWRlcyBkYXRhIGZyb20gXG4gICAgICAgICAgICAgICAgLy8gc2V2ZXJhbCBzb3VyY2VzXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YSA9IHsgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8uZG9jTWV0YWRhdGEpIGluZm8uZG9jTWV0YWRhdGEgPSB7fTtcblxuICAgICAgICAgICAgICAgIC8vIFRoZSByZXN0IG9mIHRoaXMgaXMgYWRhcHRlZCBmcm9tIHRoZSBvbGQgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAvLyBIVE1MUmVuZGVyZXIubmV3SW5pdE1ldGFkYXRhXG5cbiAgICAgICAgICAgICAgICAvLyBGb3Igc3RhcnRlcnMgdGhlIG1ldGFkYXRhIGlzIGNvbGxlY3RlZCBmcm9tIHNldmVyYWwgc291cmNlcy5cbiAgICAgICAgICAgICAgICAvLyAxKSB0aGUgbWV0YWRhdGEgc3BlY2lmaWVkIGluIHRoZSBkaXJlY3RvcnkgbW91bnQgd2hlcmVcbiAgICAgICAgICAgICAgICAvLyAgICB0aGlzIGRvY3VtZW50IHdhcyBmb3VuZFxuICAgICAgICAgICAgICAgIC8vIDIpIG1ldGFkYXRhIGluIHRoZSBwcm9qZWN0IGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgICAgICAvLyAzKSB0aGUgbWV0YWRhdGEgaW4gdGhlIGRvY3VtZW50LCBhcyBjYXB0dXJlZCBpbiBkb2NNZXRhZGF0YVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeXByb3AgaW4gaW5mby5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGluaXRNZXRhZGF0YSAke2Jhc2VkaXJ9ICR7ZnBhdGh9IGJhc2VNZXRhZGF0YSAke2Jhc2VNZXRhZGF0YVt5cHJvcF19YCk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5iYXNlTWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiB0aGlzLmNvbmZpZy5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IHRoaXMuY29uZmlnLm1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGZtbWNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmRvY01ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gaW5mby5kb2NNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgICAgIGZtbWNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhlIGNvbnRlbnQgbGFuZHMgaGVyZVxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGRvY3VtZW50IG9iamVjdCBoYXMgYmVlbiB1c2VmdWwgZm9yIFxuICAgICAgICAgICAgICAgIC8vIGNvbW11bmljYXRpbmcgdGhlIGZpbGUgcGF0aCBhbmQgb3RoZXIgZGF0YS5cbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50ID0ge307XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5iYXNlZGlyID0gaW5mby5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscGF0aCA9IGluZm8ucGF0aEluTW91bnRlZDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbHJlbmRlciA9IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8ucGF0aEluTW91bnRlZCk7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5wYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvID0gaW5mby5yZW5kZXJQYXRoO1xuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIHRoZSA8ZW0+dGFnczwvZW0+IGZpZWxkIGlzIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgaWYgKCEoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoaW5mby5tZXRhZGF0YS50YWdzKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhZ2xpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmUgPSAvXFxzKixcXHMqLztcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzLnNwbGl0KHJlKS5mb3JFYWNoKHRhZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdsaXN0LnB1c2godGFnLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MgPSB0YWdsaXN0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YS50YWdzKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBgRk9STUFUIEVSUk9SIC0gJHtpbmZvLnZwYXRofSBoYXMgYmFkbHkgZm9ybWF0dGVkIHRhZ3MgYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEudGFncyA9IGluZm8ubWV0YWRhdGEudGFncztcblxuICAgICAgICAgICAgICAgIC8vIFRoZSByb290IFVSTCBmb3IgdGhlIHByb2plY3RcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJvb3RfdXJsID0gdGhpcy5jb25maWcucm9vdF91cmw7XG5cbiAgICAgICAgICAgICAgICAvLyBDb21wdXRlIHRoZSBVUkwgdGhpcyBkb2N1bWVudCB3aWxsIHJlbmRlciB0b1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcFJvb3RVcmwgPSB1cmwucGFyc2UodGhpcy5jb25maWcucm9vdF91cmwpO1xuICAgICAgICAgICAgICAgICAgICBwUm9vdFVybC5wYXRobmFtZSA9IHBhdGgubm9ybWFsaXplKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihwUm9vdFVybC5wYXRobmFtZSwgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbylcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSB1cmwuZm9ybWF0KHBSb290VXJsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX3VybCA9IGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG87XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gaW5mby5tZXRhZGF0YS5yZW5kZXJlZF9kYXRlID0gaW5mby5zdGF0cy5tdGltZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlUHVibERhdGUgPSAoZGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBEYXRlLnBhcnNlKGRhdGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoISBpc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0ZVNldCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICAgJiYgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghIGRhdGVTZXQgJiYgaW5mby5tdGltZU1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKGluZm8ubXRpbWVNcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gc3RhdHMubXRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gY3VycmVudCB0aW1lYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm8pIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8udXBkYXRlKCh7XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgcGFyZW50RGlyOiBpbmZvLnBhcmVudERpcixcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICB0YWdzOiBBcnJheS5pc0FycmF5KGluZm8ubWV0YWRhdGE/LnRhZ3MpXG4gICAgICAgICAgICAgICAgICAgID8gaW5mby5tZXRhZGF0YS50YWdzXG4gICAgICAgICAgICAgICAgICAgIDogW10sXG4gICAgICAgICAgICBsYXlvdXQ6IGluZm8ubWV0YWRhdGE/LmxheW91dCxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH0gYXMgdW5rbm93bikgYXMgRG9jdW1lbnQpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKGluZm86IGFueSkge1xuICAgICAgICBhd2FpdCB0aGlzLmRhby5pbnNlcnQoKHtcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBwYXJlbnREaXI6IGluZm8ucGFyZW50RGlyLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIHRhZ3M6IEFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YT8udGFncylcbiAgICAgICAgICAgICAgICAgICAgPyBpbmZvLm1ldGFkYXRhLnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgOiBbXSxcbiAgICAgICAgICAgIGxheW91dDogaW5mby5tZXRhZGF0YT8ubGF5b3V0LFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfSBhcyB1bmtub3duKSBhcyBEb2N1bWVudCk7XG4gICAgfVxuXG4gICAgYXN5bmMgaW5kZXhDaGFpbihfZnBhdGgpIHtcblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpIFxuICAgICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcbiAgICAgICAgY29uc3QgcGFyc2VkID0gcGF0aC5wYXJzZShmcGF0aCk7XG5cbiAgICAgICAgY29uc3QgZmlsZXo6IERvY3VtZW50W10gPSBbXTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgICAgICAnb3InOiBbXG4gICAgICAgICAgICAgICAgeyB2cGF0aDogeyBlcTogZnBhdGggfSB9LFxuICAgICAgICAgICAgICAgIHsgcmVuZGVyUGF0aDogeyBlcTogZnBhdGggfSB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgZmlsZU5hbWUgPSBmcGF0aDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZikgJiYgc2VsZi5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgZmlsZXoucHVzaChzZWxmWzBdKTtcbiAgICAgICAgICAgIGZpbGVOYW1lID0gc2VsZlswXS5yZW5kZXJQYXRoO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHBhcmVudERpcjtcbiAgICAgICAgbGV0IGRpck5hbWUgPSBwYXRoLmRpcm5hbWUoZnBhdGgpO1xuICAgICAgICBsZXQgZG9uZSA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAoIShkaXJOYW1lID09PSAnLicgfHwgZGlyTmFtZSA9PT0gcGFyc2VkLnJvb3QpKSB7XG4gICAgICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShmaWxlTmFtZSkgPT09ICdpbmRleC5odG1sJykge1xuICAgICAgICAgICAgICAgIHBhcmVudERpciA9IHBhdGguZGlybmFtZShwYXRoLmRpcm5hbWUoZmlsZU5hbWUpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGZpbGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBsb29rRm9yID0gcGF0aC5qb2luKHBhcmVudERpciwgXCJpbmRleC5odG1sXCIpO1xuXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgICAgICAgICAgJ29yJzogW1xuICAgICAgICAgICAgICAgICAgICB7IHZwYXRoOiB7IGVxOiBsb29rRm9yIH0gfSxcbiAgICAgICAgICAgICAgICAgICAgeyByZW5kZXJQYXRoOiB7IGVxOiBsb29rRm9yIH0gfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpbmRleCkgJiYgaW5kZXgubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgICAgICBmaWxlei5wdXNoKGluZGV4WzBdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsZU5hbWUgPSBsb29rRm9yO1xuICAgICAgICAgICAgZGlyTmFtZSA9IHBhdGguZGlybmFtZShsb29rRm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWxlelxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24ob2JqOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmZvdW5kRGlyID0gb2JqLm1vdW50UG9pbnQ7XG4gICAgICAgICAgICAgICAgICAgIG9iai5mb3VuZFBhdGggPSBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmZpbGVuYW1lID0gJy8nICsgb2JqLnJlbmRlclBhdGg7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAucmV2ZXJzZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmRzIGFsbCB0aGUgZG9jdW1lbnRzIGluIHRoZSBzYW1lIGRpcmVjdG9yeVxuICAgICAqIGFzIHRoZSBuYW1lZCBmaWxlLlxuICAgICAqXG4gICAgICogVGhpcyBkb2Vzbid0IGFwcGVhciB0byBiZSB1c2VkIGFueXdoZXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9mcGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBzaWJsaW5ncyhfZnBhdGgpIHtcbiAgICAgICAgbGV0IHJldDtcbiAgICAgICAgbGV0IHZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUodnBhdGgpO1xuICAgICAgICAvLyBpZiAoZGlybmFtZSA9PT0gJy4nKSBkaXJuYW1lID0gJy8nO1xuXG4gICAgICAgIGNvbnN0IHNpYmxpbmdzID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgIGRpcm5hbWU6IHsgZXE6IGRpcm5hbWUgfSxcbiAgICAgICAgICAgIC8vIFRoZSBzaWJsaW5ncyBjYW5ub3QgaW5jbHVkZSB0aGUgc2VsZi5cbiAgICAgICAgICAgIHZwYXRoOiB7IG5lcTogdnBhdGggfSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IHsgbmVxOiB2cGF0aCB9LFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHNpYmxpbmdzLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhdGhpcy5pZ25vcmVGaWxlKGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdHJlZSBvZiBpdGVtcyBzdGFydGluZyBmcm9tIHRoZSBkb2N1bWVudFxuICAgICAqIG5hbWVkIGluIF9yb290SXRlbS4gIFRoZSBwYXJhbWV0ZXIgc2hvdWxkIGJlIGFuXG4gICAgICogYWN0dWFsIGRvY3VtZW50IGluIHRoZSB0cmVlLCBzdWNoIGFzIGBwYXRoL3RvL2luZGV4Lmh0bWxgLlxuICAgICAqIFRoZSByZXR1cm4gaXMgYSB0cmVlLXNoYXBlZCBzZXQgb2Ygb2JqZWN0cyBsaWtlIHRoZSBmb2xsb3dpbmc7XG4gICAgICogXG4gIHRyZWU6XG4gICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXJcbiAgICBpdGVtczpcbiAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sLm1kXG4gICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgY2hpbGRGb2xkZXJzOlxuICAgICAgICAtIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyXG4gICAgICAgICAgY2hpbGRyZW46XG4gICAgICAgICAgICAgIHJvb3RJdGVtOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgICAgICAgICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyXG4gICAgICAgICAgICAgIGl0ZW1zOlxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMS5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMS5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTIuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvcGFnZTIuaHRtbFxuICAgICAgICAgICAgICBjaGlsZEZvbGRlcnM6IFtdXG4gICAgICAgIC0gZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXIyXG4gICAgICAgICAgY2hpbGRyZW46XG4gICAgICAgICAgICAgIHJvb3RJdGVtOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjJcbiAgICAgICAgICAgICAgaXRlbXM6XG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UxLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMS5odG1sXG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UyLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9wYWdlMi5odG1sXG4gICAgICAgICAgICAgIGNoaWxkRm9sZGVyczogW11cbiAgICAgKlxuICAgICAqIFRoZSBvYmplY3RzIHVuZGVyIGBpdGVtc2AgYXJlIGFjdHVsbHkgdGhlIGZ1bGwgRG9jdW1lbnQgb2JqZWN0XG4gICAgICogZnJvbSB0aGUgY2FjaGUsIGJ1dCBmb3IgdGhlIGludGVyZXN0IG9mIGNvbXBhY3RuZXNzIG1vc3Qgb2ZcbiAgICAgKiB0aGUgZmllbGRzIGhhdmUgYmVlbiBkZWxldGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9yb290SXRlbSBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBjaGlsZEl0ZW1UcmVlKF9yb290SXRlbTogc3RyaW5nKSB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGNoaWxkSXRlbVRyZWUgJHtfcm9vdEl0ZW19YCk7XG5cbiAgICAgICAgbGV0IHJvb3RJdGVtID0gYXdhaXQgdGhpcy5maW5kKFxuICAgICAgICAgICAgICAgIF9yb290SXRlbS5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfcm9vdEl0ZW0uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX3Jvb3RJdGVtKTtcbiAgICAgICAgaWYgKCFyb290SXRlbSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKGBjaGlsZEl0ZW1UcmVlIG5vIHJvb3RJdGVtIGZvdW5kIGZvciBwYXRoICR7X3Jvb3RJdGVtfWApO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISh0eXBlb2Ygcm9vdEl0ZW0gPT09ICdvYmplY3QnKVxuICAgICAgICAgfHwgISgndnBhdGgnIGluIHJvb3RJdGVtKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUud2FybihgY2hpbGRJdGVtVHJlZSBmb3VuZCBpbnZhbGlkIG9iamVjdCBmb3IgJHtfcm9vdEl0ZW19IC0gJHt1dGlsLmluc3BlY3Qocm9vdEl0ZW0pfWApO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZShyb290SXRlbS52cGF0aCk7XG4gICAgICAgIC8vIFBpY2tzIHVwIGV2ZXJ5dGhpbmcgZnJvbSB0aGUgY3VycmVudCBsZXZlbC5cbiAgICAgICAgLy8gRGlmZmVycyBmcm9tIHNpYmxpbmdzIGJ5IGdldHRpbmcgZXZlcnl0aGluZy5cbiAgICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAgICAgZGlybmFtZTogeyBlcTogZGlybmFtZSB9LFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogdHJ1ZVxuICAgICAgICB9KSBhcyB1bmtub3duW10gYXMgYW55W107XG5cbiAgICAgICAgY29uc3QgY2hpbGRGb2xkZXJzID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKFxuICAgICAgICAgICAgYFNFTEVDVCBkaXN0aW5jdCBkaXJuYW1lIEZST00gRE9DVU1FTlRTXG4gICAgICAgICAgICBXSEVSRSBwYXJlbnREaXIgPSAnJHtkaXJuYW1lfSdgXG4gICAgICAgICkgYXMgdW5rbm93bltdIGFzIERvY3VtZW50W107XG5cbiAgICAgICAgY29uc3QgY2ZzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgY2Ygb2YgY2hpbGRGb2xkZXJzKSB7XG4gICAgICAgICAgICBjZnMucHVzaChhd2FpdCB0aGlzLmNoaWxkSXRlbVRyZWUoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKGNmLmRpcm5hbWUsICdpbmRleC5odG1sJylcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvb3RJdGVtLFxuICAgICAgICAgICAgZGlybmFtZSxcbiAgICAgICAgICAgIGl0ZW1zOiBpdGVtcyxcbiAgICAgICAgICAgIC8vIFVuY29tbWVudCB0aGlzIHRvIGdlbmVyYXRlIHNpbXBsaWZpZWQgb3V0cHV0XG4gICAgICAgICAgICAvLyBmb3IgZGVidWdnaW5nLlxuICAgICAgICAgICAgLy8gLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoXG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSksXG4gICAgICAgICAgICBjaGlsZEZvbGRlcnM6IGNmc1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgaW5kZXggZmlsZXMgKHJlbmRlcnMgdG8gaW5kZXguaHRtbClcbiAgICAgKiB3aXRoaW4gdGhlIG5hbWVkIHN1YnRyZWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm9vdFBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgaW5kZXhGaWxlcyhyb290UGF0aD86IHN0cmluZykge1xuICAgICAgICBsZXQgcm9vdFAgPSByb290UGF0aD8uc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IHJvb3RQYXRoPy5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogcm9vdFBhdGg7XG5cbiAgICAgICAgLy8gT3B0aW9uYWxseSBhcHBlbmRhYmxlIHN1Yi1xdWVyeVxuICAgICAgICAvLyB0byBoYW5kbGUgd2hlbiByb290UGF0aCBpcyBzcGVjaWZpZWRcbiAgICAgICAgbGV0IHJvb3RRID0gKFxuICAgICAgICAgICAgICAgIHR5cGVvZiByb290UCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAmJiByb290UC5sZW5ndGggPj0gMVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgPyBgQU5EICggcmVuZGVyUGF0aCByZWdleHAgJ14ke3Jvb3RQfScgKWBcbiAgICAgICAgICAgIDogJyc7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgIFNFTEVDVCAqXG4gICAgICAgIEZST00gRE9DVU1FTlRTXG4gICAgICAgIFdIRVJFXG4gICAgICAgICAgICAoIHJlbmRlcnNUb0hUTUwgPSB0cnVlIClcbiAgICAgICAgQU5EIChcbiAgICAgICAgICAgICggcmVuZGVyUGF0aCByZWdleHAgJy9pbmRleC5odG1sJCcgKVxuICAgICAgICAgT1IgKCByZW5kZXJQYXRoIHJlZ2V4cCAnXmluZGV4Lmh0bWwkJyApXG4gICAgICAgIClcbiAgICAgICAgJHtyb290UX1cbiAgICAgICAgYCk7XG4gICAgICAgIFxuXG4gICAgICAgIC8vIEl0J3MgcHJvdmVkIGRpZmZpY3VsdCB0byBnZXQgdGhlIHJlZ2V4cFxuICAgICAgICAvLyB0byB3b3JrIGluIHRoaXMgbW9kZTpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gcmV0dXJuIGF3YWl0IHRoaXMuc2VhcmNoKHtcbiAgICAgICAgLy8gICAgIHJlbmRlcnNUb0hUTUw6IHRydWUsXG4gICAgICAgIC8vICAgICByZW5kZXJwYXRobWF0Y2g6IC9cXC9pbmRleC5odG1sJC8sXG4gICAgICAgIC8vICAgICByb290UGF0aDogcm9vdFBhdGhcbiAgICAgICAgLy8gfSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIEZvciBldmVyeSBmaWxlIGluIHRoZSBkb2N1bWVudHMgY2FjaGUsXG4gICAgICogc2V0IHRoZSBhY2Nlc3MgYW5kIG1vZGlmaWNhdGlvbnMuXG4gICAgICpcbiAgICAgKiA/Pz8/PyBXaHkgd291bGQgdGhpcyBiZSB1c2VmdWw/XG4gICAgICogSSBjYW4gc2VlIGRvaW5nIHRoaXMgZm9yIHRoZSByZW5kZXJlZFxuICAgICAqIGZpbGVzIGluIHRoZSBvdXRwdXQgZGlyZWN0b3J5LiAgQnV0IHRoaXMgaXNcbiAgICAgKiBmb3IgdGhlIGZpbGVzIGluIHRoZSBkb2N1bWVudHMgZGlyZWN0b3JpZXMuID8/Pz9cbiAgICAgKi9cbiAgICBhc3luYyBzZXRUaW1lcygpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8uc2VsZWN0RWFjaChcbiAgICAgICAgICAgIChlcnIsIG1vZGVsKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzZXR0ZXIgPSBhc3luYyAoZGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBEYXRlLnBhcnNlKGRhdGUpOztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZHAgPSBuZXcgRGF0ZShwYXJzZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgRlMudXRpbWVzU3luYyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHBcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChtb2RlbC5pbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIG1vZGVsLmluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0dGVyKG1vZGVsLmluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobW9kZWwuaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiBtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXR0ZXIobW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7fSBhcyBXaGVyZTxEb2N1bWVudD5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgZG9jdW1lbnRzIHdoaWNoIGhhdmUgdGFncy5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGRvY3VtZW50c1dpdGhUYWdzKCkge1xuICAgICAgICBjb25zdCBkb2NzID0gbmV3IEFycmF5PERvY3VtZW50PigpO1xuICAgICAgICBhd2FpdCB0aGlzLmRhby5zZWxlY3RFYWNoKFxuICAgICAgICAgICAgKGVyciwgZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY1xuICAgICAgICAgICAgICAgICAmJiBkb2MuZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgZG9jLmRvY01ldGFkYXRhLnRhZ3NcbiAgICAgICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShcbiAgICAgICAgICAgICAgICAgICAgZG9jLmRvY01ldGFkYXRhLnRhZ3NcbiAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAmJiBkb2MuZG9jTWV0YWRhdGEudGFncy5sZW5ndGggPj0gMVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBkb2NzLnB1c2goZG9jKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHsgZXE6IHRydWUgfSxcbiAgICAgICAgICAgICAgICBpbmZvOiB7IGlzTm90TnVsbDogdHJ1ZSB9XG4gICAgICAgICAgICB9IGFzIFdoZXJlPERvY3VtZW50PlxuICAgICAgICApO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGRvY3MpO1xuICAgICAgICByZXR1cm4gZG9jcztcbiAgICB9XG5cbiAgICBhc3luYyBkb2N1bWVudHNXaXRoVGFnKHRhZ25tOiBzdHJpbmcgfCBzdHJpbmdbXSlcbiAgICAgICAgOiBQcm9taXNlPEFycmF5PHN0cmluZz4+XG4gICAge1xuICAgICAgICBsZXQgdGFnczogc3RyaW5nW107XG4gICAgICAgIGlmICh0eXBlb2YgdGFnbm0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0YWdzID0gWyB0YWdubSBdO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodGFnbm0pKSB7XG4gICAgICAgICAgICB0YWdzID0gdGFnbm07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50c1dpdGhUYWcgZ2l2ZW4gYmFkIHRhZ3MgYXJyYXkgJHt1dGlsLmluc3BlY3QodGFnbm0pfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgICAgIFNFTEVDVFxuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgIGpzb25fZXh0cmFjdChkb2NNZXRhZGF0YSwgJyQudGFncycpIGFzIHRhZ3NcbiAgICAgICAgICAgIEZST00gRE9DVU1FTlRTXG4gICAgICAgIGApIGFzIHVua25vd24gYXMgQXJyYXk8e1xuICAgICAgICAgICAgdnBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgIHRhZ3M6IHN0cmluZ1tdXG4gICAgICAgIH0+O1xuXG4gICAgICAgIGNvbnN0IHZwYXRocyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcmVzKSB7XG4gICAgICAgICAgICBpZiAoISgndGFncycgaW4gaXRlbSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgbGV0IHRhZ3NQID0gW107XG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0udGFncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0YWdzUCA9IEpTT04ucGFyc2UoaXRlbS50YWdzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShpdGVtLnRhZ3MpKSB7XG4gICAgICAgICAgICAgICAgdGFnc1AgPSBpdGVtLnRhZ3M7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgdGFnIG9mIHRhZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFnc1AuaW5jbHVkZXModGFnKSkge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aHMucHVzaChpdGVtLnZwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZwYXRocztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gYXJyYXkgb2YgdGFncyB1c2VkIGJ5IGFsbCBkb2N1bWVudHMuXG4gICAgICogVGhpcyB1c2VzIHRoZSBKU09OIGV4dGVuc2lvbiB0byBleHRyYWN0XG4gICAgICogdGhlIHRhZ3MgZnJvbSB0aGUgbWV0YWRhdGEgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgdGFncygpIHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy5kYW8uc3FsZGIuYWxsKGBcbiAgICAgICAgICAgIFNFTEVDVFxuICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgIGpzb25fZXh0cmFjdChkb2NNZXRhZGF0YSwgJyQudGFncycpIGFzIHRhZ3NcbiAgICAgICAgICAgIEZST00gRE9DVU1FTlRTXG4gICAgICAgIGApIGFzIHVua25vd24gYXMgQXJyYXk8e1xuICAgICAgICAgICAgdnBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgIHRhZ3M6IHN0cmluZ1tdXG4gICAgICAgIH0+O1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHJlcyk7XG5cbiAgICAgICAgLy8gVGhlIHF1ZXJ5IGFib3ZlIHByb2R1Y2VzIHRoaXMgcmVzdWx0OlxuICAgICAgICAvL1xuICAgICAgICAvLyB7XG4gICAgICAgIC8vICAgICB2cGF0aDogJ3RhZ3MtYXJyYXkuaHRtbC5tZCcsXG4gICAgICAgIC8vICAgICB0YWdzOiAnW1wiVGFnMVwiLFwiVGFnMlwiLFwiVGFnM1wiXSdcbiAgICAgICAgLy8gfSxcbiAgICAgICAgLy8ge1xuICAgICAgICAvLyAgICAgdnBhdGg6ICd0YWdzLXN0cmluZy5odG1sLm1kJyxcbiAgICAgICAgLy8gICAgIHRhZ3M6ICdbXCJUYWctc3RyaW5nLTFcIixcIlRhZy1zdHJpbmctMlwiLFwiVGFnLXN0cmluZy0zXCJdJ1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vXG4gICAgICAgIC8vIEluIG90aGVyIHdvcmRzLCB0aGUgdGFncyBhcnJheSBhcnJpdmVzXG4gICAgICAgIC8vIGFzIEpTT04gd2hpY2ggd2UgbXVzdCBwYXJzZS5cblxuICAgICAgICBjb25zdCB0YWdzID0gbmV3IFNldCgpO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcmVzKSB7XG4gICAgICAgICAgICBpZiAoISgndGFncycgaW4gaXRlbSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgbGV0IHRhZ3NQID0gW107XG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0udGFncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0YWdzUCA9IEpTT04ucGFyc2UoaXRlbS50YWdzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShpdGVtLnRhZ3MpKSB7XG4gICAgICAgICAgICAgICAgdGFnc1AgPSBpdGVtLnRhZ3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRhZyBvZiB0YWdzUCkge1xuICAgICAgICAgICAgICAgIHRhZ3MuYWRkKHRhZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgU2V0IGNsYXNzIG1hZGUgc3VyZSB0byB3ZWVkIG91dFxuICAgICAgICAvLyBkdXBsaWNhdGUgdGFncy4gIFdpdGggQXJyYXkuZnJvbVxuICAgICAgICAvLyB3ZSBjYW4gbWFrZSB0aGUgc2V0IGludG8gYW4gYXJyYXlcbiAgICAgICAgLy8gd2hpY2ggY2FuIGJlIHNvcnRlZC5cbiAgICAgICAgY29uc3QgcmV0ID0gQXJyYXkuZnJvbSh0YWdzKTtcbiAgICAgICAgcmV0dXJuIHJldC5zb3J0KChhOiBzdHJpbmcsIGI6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdmFyIHRhZ0EgPSBhLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgdGFnQiA9IGIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmICh0YWdBIDwgdGFnQikgcmV0dXJuIC0xO1xuICAgICAgICAgICAgaWYgKHRhZ0EgPiB0YWdCKSByZXR1cm4gMTtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgZGF0YSBmb3IgYW4gaW50ZXJuYWwgbGlua1xuICAgICAqIHdpdGhpbiB0aGUgc2l0ZSBkb2N1bWVudHMuICBGb3JtaW5nIGFuXG4gICAgICogaW50ZXJuYWwgbGluayBpcyBhdCBhIG1pbmltdW0gdGhlIHJlbmRlcmVkXG4gICAgICogcGF0aCBmb3IgdGhlIGRvY3VtZW50IGFuZCBpdHMgdGl0bGUuXG4gICAgICogVGhlIHRlYXNlciwgaWYgYXZhaWxhYmxlLCBjYW4gYmUgdXNlZCBpblxuICAgICAqIGEgdG9vbHRpcC4gVGhlIHRodW1ibmFpbCBpcyBhbiBpbWFnZSB0aGF0XG4gICAgICogY291bGQgYmUgZGlzcGxheWVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGRvY0xpbmtEYXRhKHZwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcblxuICAgICAgICAvLyBUaGUgdnBhdGggcmVmZXJlbmNlXG4gICAgICAgIHZwYXRoOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBwYXRoIGl0IHJlbmRlcnMgdG9cbiAgICAgICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGl0bGUgc3RyaW5nIGZyb20gdGhhdCBwYWdlXG4gICAgICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSB0ZWFzZXIgdGV4dCBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0ZWFzZXI/OiBzdHJpbmc7XG4gICAgICAgIC8vIFRoZSBoZXJvIGltYWdlICh0aHVtYm5haWwpXG4gICAgICAgIHRodW1ibmFpbD86IHN0cmluZztcbiAgICB9PiB7XG4gICAgICAgIGNvbnN0IGRvY0luZm8gPSBhd2FpdCB0aGlzLmZpbmQodnBhdGgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBkb2NJbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICB0aXRsZTogZG9jSW5mby5tZXRhZGF0YS50aXRsZSxcbiAgICAgICAgICAgIHRlYXNlcjogZG9jSW5mby5tZXRhZGF0YS50ZWFzZXIsXG4gICAgICAgICAgICAvLyB0aHVtYm5haWxcbiAgICAgICAgfTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gZGVzY3JpcHRpdmUgc2VhcmNoIG9wZXJhdGlvbnNcbiAgICAgKiB3aXRoIG1hbnkgb3B0aW9ucy4gIFRoZXkgYXJlIGNvbnZlcnRlZFxuICAgICAqIGludG8gYSBzZWxlY3RBbGwgc3RhdGVtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgc2VhcmNoKG9wdGlvbnMpOiBQcm9taXNlPEFycmF5PERvY3VtZW50Pj4ge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggYCwgb3B0aW9ucyk7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcbiAgICAgICAgY29uc3QgdnBhdGhzU2VlbiA9IG5ldyBTZXQoKTtcblxuICAgICAgICBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICAgICAgIGFuZDogW11cbiAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIGlmIChvcHRpb25zLm1pbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbWltZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXE6IG9wdGlvbnMubWltZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5taW1lKSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbWltZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW46IG9wdGlvbnMubWltZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IC8qIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5jb3JyZWN0IE1JTUUgY2hlY2sgJHtvcHRpb25zLm1pbWV9YCk7XG4gICAgICAgICAgICB9ICovXG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMucmVuZGVyc1RvSFRNTCA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgICkge1xuICAgICAgICAgICAgc2VsZWN0b3IuYW5kLnB1c2goe1xuICAgICAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHtcbiAgICAgICAgICAgICAgICAgICAgZXE6IG9wdGlvbnMucmVuZGVyc1RvSFRNTFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zPy5yb290UGF0aCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHtcbiAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgIGlzTGlrZTogYCR7b3B0aW9ucy5yb290UGF0aH0lYFxuICAgICAgICAgICAgICAgICAgICAvLyBzcWw6IGAgcmVuZGVyUGF0aCBsaWtlICcke29wdGlvbnMucm9vdFBhdGh9JScgYFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVnZXhTUUwgPSB7XG4gICAgICAgICAgICBvcjogW11cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMucGF0aG1hdGNoID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgIHNxbDogYCB2cGF0aCByZWdleHAgJyR7b3B0aW9ucy5wYXRobWF0Y2h9JyBgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIG9wdGlvbnMucGF0aG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmVnZXhTUUwub3IucHVzaCh7XG4gICAgICAgICAgICAgICAgc3FsOiBgIHZwYXRoIHJlZ2V4cCAnJHtvcHRpb25zLnBhdGhtYXRjaC5zb3VyY2V9JyBgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3FsOiBgIHZwYXRoIHJlZ2V4cCAnJHttYXRjaH0nIGBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNxbDogYCB2cGF0aCByZWdleHAgJyR7bWF0Y2guc291cmNlfScgYFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHBhdGhtYXRjaCByZWdleHAgJHt1dGlsLmluc3BlY3QobWF0Y2gpfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgncGF0aG1hdGNoJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAvLyBUaGVyZSdzIGEgcGF0aG1hdGNoIGZpZWxkLCB0aGF0XG4gICAgICAgICAgICAvLyBpc24ndCBjb3JyZWN0XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHBhdGhtYXRjaCAke3V0aWwuaW5zcGVjdChvcHRpb25zLnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5sYXlvdXRzKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmxheW91dHMpXG4gICAgICAgICAgICAgJiYgb3B0aW9ucy5sYXlvdXRzLmxlbmd0aCA+PSAyXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGxheW91dCBvZiBvcHRpb25zLmxheW91dHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhTUUwub3IucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXQ6IHsgZXE6IGxheW91dCB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmxheW91dClcbiAgICAgICAgICAgICAmJiBvcHRpb25zLmxheW91dHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rvci5sYXlvdXQgPSB7IGVxOiBvcHRpb25zLmxheW91dHNbMF0gfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3IubGF5b3V0ID0geyBlcTogb3B0aW9ucy5sYXlvdXRzIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdHRlbXB0aW5nIHRvIGRvIHRoZSBmb2xsb3dpbmc6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0IHZwYXRoLCByZW5kZXJQYXRoIGZyb20gRE9DVU1FTlRTIHdoZXJlIHJlbmRlclBhdGggcmVnZXhwICcvaW5kZXguaHRtbCQnO1xuICAgICAgICAvLyBoaWVyLWJyb2tlL2RpcjEvZGlyMi9pbmRleC5odG1sLm1kfGhpZXItYnJva2UvZGlyMS9kaXIyL2luZGV4Lmh0bWxcbiAgICAgICAgLy8gaGllci9kaXIxL2RpcjIvaW5kZXguaHRtbC5tZHxoaWVyL2RpcjEvZGlyMi9pbmRleC5odG1sXG4gICAgICAgIC8vIGhpZXIvZGlyMS9pbmRleC5odG1sLm1kfGhpZXIvZGlyMS9pbmRleC5odG1sXG4gICAgICAgIC8vIGhpZXIvaW1nZGlyL2luZGV4Lmh0bWwubWR8aGllci9pbWdkaXIvaW5kZXguaHRtbFxuICAgICAgICAvLyBoaWVyL2luZGV4Lmh0bWwubWR8aGllci9pbmRleC5odG1sXG4gICAgICAgIC8vIHN1YmRpci9pbmRleC5odG1sLm1kfHN1YmRpci9pbmRleC5odG1sXG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnJHtvcHRpb25zLnJlbmRlcnBhdGhtYXRjaH0nIGBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICBzcWw6IGAgcmVuZGVyUGF0aCByZWdleHAgJyR7b3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlfScgYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnJHttYXRjaH0nIGBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnJHttYXRjaC5zb3VyY2V9JyBgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdyZW5kZXJwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVnZXhTUUwub3IubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLmFuZC5wdXNoKHsgb3I6IHJlZ2V4U1FMLm9yIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coc2VsZWN0b3IpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBiYXNlZCBvbiB0aGluZ3Mgd2UgY2FuIHF1ZXJ5XG4gICAgICAgIC8vIGRpcmVjdGx5IGZyb20gIHRoZSBEb2N1bWVudCBvYmplY3QuXG4gICAgICAgIGxldCByZXN1bHQxO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0MSA9IGF3YWl0IHRoaXMuZGFvLnNlbGVjdEFsbChcbiAgICAgICAgICAgICAgICBzZWxlY3RvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLnNlYXJjaCBjYXVnaHQgZXJyb3IgaW4gc2VsZWN0QWxsIHdpdGggc2VsZWN0b3IgJHt1dGlsLmluc3BlY3Qoc2VsZWN0b3IpfSAtICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgc2VhcmNoIG9wdGlvbnMgaW5jbHVkZSBsYXlvdXQocylcbiAgICAgICAgLy8gd2UgY2hlY2sgZG9jTWV0YWRhdGEubGF5b3V0XG4gICAgICAgIC8vIE5PVyBNT1ZFRCBBQk9WRVxuICAgICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0MTtcblxuICAgICAgICAvLyBDaGVjayBmb3IgbWF0Y2ggYWdhaW5zdCB0YWdzXG4gICAgICAgIGNvbnN0IHJlc3VsdDMgPSBcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRhZ1xuICAgICAgICAgICAgICAgICYmIHR5cGVvZiBvcHRpb25zLnRhZyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICkgPyByZXN1bHQyLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS52cGF0aFxuICAgICAgICAgICAgICAgICAmJiBpdGVtLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIGl0ZW0uZG9jTWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KGl0ZW0uZG9jTWV0YWRhdGEudGFncylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uZG9jTWV0YWRhdGEudGFncy5pbmNsdWRlcyhvcHRpb25zLnRhZykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICA6IHJlc3VsdDI7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0NCA9IHJlc3VsdDM7XG4gICAgICAgICAgICAvLyAoXG4gICAgICAgICAgICAvLyAgICAgb3B0aW9ucy5yb290UGF0aFxuICAgICAgICAgICAgLy8gICYmIHR5cGVvZiBvcHRpb25zLnJvb3RQYXRoID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgLy8gKSA/IHJlc3VsdDMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gICAgIGlmIChpdGVtLnZwYXRoXG4gICAgICAgICAgICAvLyAgICAgICYmIGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gICAgICkge1xuICAgICAgICAgICAgLy8gICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoICR7aXRlbS52cGF0aH0gJHtpdGVtLnJlbmRlclBhdGh9ICR7b3B0aW9ucy5yb290UGF0aH1gKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgaWYgKGl0ZW0ucmVuZGVyUGF0aC5zdGFydHNXaXRoKG9wdGlvbnMucm9vdFBhdGgpKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgLy8gOiByZXN1bHQzO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDUgPVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZ2xvYlxuICAgICAgICAgICAgICYmIHR5cGVvZiBvcHRpb25zLmdsb2IgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICApID8gcmVzdWx0NC5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0udnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1pbmltYXRjaChpdGVtLnZwYXRoLCBvcHRpb25zLmdsb2IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ0O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDYgPVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyZ2xvYlxuICAgICAgICAgICAgJiYgdHlwZW9mIG9wdGlvbnMucmVuZGVyZ2xvYiA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICkgPyByZXN1bHQ1LmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5yZW5kZXJQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtaW5pbWF0Y2goaXRlbS5yZW5kZXJQYXRoLCBvcHRpb25zLnJlbmRlcmdsb2IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ1O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDcgPVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyZXJzXG4gICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zLnJlbmRlcmVycylcbiAgICAgICAgICAgICkgPyByZXN1bHQ2LmZpbHRlcihpdGVtID0+IHtcblxuICAgICAgICAgICAgICAgIGxldCByZW5kZXJlciA9IGZjYWNoZS5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpdGVtLnZwYXRoKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyZXIgZm9yICR7b2JqLnZwYXRofSBgLCByZW5kZXJlcik7XG4gICAgICAgICAgICAgICAgaWYgKCFyZW5kZXJlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCByIG9mIG9wdGlvbnMucmVuZGVyZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGVjayByZW5kZXJlciAke3R5cGVvZiByfSAke3JlbmRlcmVyLm5hbWV9ICR7cmVuZGVyZXIgaW5zdGFuY2VvZiByfWApO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAmJiByID09PSByZW5kZXJlci5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHIgPT09ICdvYmplY3QnXG4gICAgICAgICAgICAgICAgICAgICB8fCB0eXBlb2YgciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignV0FSTklORzogTWF0Y2hpbmcgcmVuZGVyZXIgYnkgb2JqZWN0IGNsYXNzIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnLCByKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ2O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDggPVxuICAgICAgICAgICAgKG9wdGlvbnMuZmlsdGVyZnVuYylcbiAgICAgICAgICAgID8gcmVzdWx0Ny5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZmlsdGVyZnVuYyhcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmNvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ3O1xuXG4gICAgICAgIFxuICAgICAgICBsZXQgcmVzdWx0OSA9IHJlc3VsdDg7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBvcHRpb25zLnNvcnRCeSA9PT0gJ3N0cmluZydcbiAgICAgICAgICYmIChcbiAgICAgICAgICAgICBvcHRpb25zLnNvcnRCeSA9PT0gJ3B1YmxpY2F0aW9uRGF0ZSdcbiAgICAgICAgICB8fCBvcHRpb25zLnNvcnRCeSA9PT0gJ3B1YmxpY2F0aW9uVGltZSdcbiAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXN1bHQ5ID0gcmVzdWx0OC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGFEYXRlID0gYS5tZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICYmIGEubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgID8gbmV3IERhdGUoYS5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpXG4gICAgICAgICAgICAgICAgICAgIDogbmV3IERhdGUoYS5tdGltZU1zKTtcbiAgICAgICAgICAgICAgICBsZXQgYkRhdGUgPSBiLm1ldGFkYXRhIFxuICAgICAgICAgICAgICAgICAgICAgICAgICYmIGIubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgID8gbmV3IERhdGUoYi5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpXG4gICAgICAgICAgICAgICAgICAgIDogbmV3IERhdGUoYi5tdGltZU1zKTtcbiAgICAgICAgICAgICAgICBpZiAoYURhdGUgPT09IGJEYXRlKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBpZiAoYURhdGUgPiBiRGF0ZSkgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIGlmIChhRGF0ZSA8IGJEYXRlKSByZXR1cm4gMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMuc29ydEJ5ID09PSAnc3RyaW5nJ1xuICAgICAgICAgJiYgb3B0aW9ucy5zb3J0QnkgPT09ICdkaXJuYW1lJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlc3VsdDkgPSByZXN1bHQ4LnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYS5kaXJuYW1lID09PSBiLmRpcm5hbWUpIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGlmIChhLmRpcm5hbWUgPCBiLmRpcm5hbWUpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICBpZiAoYS5kaXJuYW1lID4gYi5kaXJuYW1lKSByZXR1cm4gMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdDlhID0gcmVzdWx0OTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRGdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXN1bHQ5YSA9IHJlc3VsdDkuc29ydChvcHRpb25zLnNvcnRGdW5jKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQxMCA9IHJlc3VsdDlhO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2Ygb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nID09PSAnYm9vbGVhbidcbiAgICAgICAgIHx8IHR5cGVvZiBvcHRpb25zLnJldmVyc2UgPT09ICdib29sZWFuJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nID09PSAnYm9vbGVhbidcbiAgICAgICAgICAgICAmJiBvcHRpb25zLnNvcnRCeURlc2NlbmRpbmdcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJlc3VsdDEwID0gcmVzdWx0OWEucmV2ZXJzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJldmVyc2UgPT09ICdib29sZWFuJ1xuICAgICAgICAgICAgICYmIG9wdGlvbnMucmV2ZXJzZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0MTAgPSByZXN1bHQ5YS5yZXZlcnNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzdWx0MTEgPSByZXN1bHQxMDtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJlc3VsdDExID0gcmVzdWx0MTAuc2xpY2Uob3B0aW9ucy5vZmZzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdDEyID0gcmVzdWx0MTE7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5saW1pdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJlc3VsdDEyID0gcmVzdWx0MTEuc2xpY2UoXG4gICAgICAgICAgICAgICAgMCwgb3B0aW9ucy5saW1pdCAtIDFcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0MTI7XG4gICAgfVxuXG4gICAgLy8gU2tpcCB0YWdzIGZvciBub3cuICBTaG91bGQgYmUgZWFzeS5cblxuICAgIC8vIEZvciB0YWdzIHN1cHBvcnQsIHRoaXMgY2FuIGJlIHVzZWZ1bFxuICAgIC8vICAtLSBodHRwczovL2FudG9uei5vcmcvanNvbi12aXJ0dWFsLWNvbHVtbnMvXG4gICAgLy8gSXQgc2hvd3MgaG93IHRvIGRvIGdlbmVyYXRlZCBjb2x1bW5zXG4gICAgLy8gZnJvbSBmaWVsZHMgaW4gSlNPTlxuXG4gICAgLy8gQnV0LCBob3cgdG8gZG8gZ2VuZXJhdGVkIGNvbHVtbnNcbiAgICAvLyB1c2luZyBTUUxJVEUzT1JNP1xuXG4gICAgLy8gaHR0cHM6Ly9hbnRvbnoub3JnL3NxbGVhbi1yZWdleHAvIC0tIFJlZ0V4cFxuICAgIC8vIGV4dGVuc2lvbiBmb3IgU1FMSVRFM1xuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FzZzAxNy9zcWxpdGUtcmVnZXggaW5jbHVkZXNcbiAgICAvLyBhIG5vZGUuanMgcGFja2FnZVxuICAgIC8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL3NxbGl0ZS1yZWdleFxufVxuXG5leHBvcnQgdmFyIGFzc2V0c0NhY2hlOiBCYXNlRmlsZUNhY2hlPCBBc3NldCwgdHlwZW9mIGFzc2V0c0RBTz47XG5leHBvcnQgdmFyIHBhcnRpYWxzQ2FjaGU6IFRlbXBsYXRlc0ZpbGVDYWNoZTxQYXJ0aWFsLCB0eXBlb2YgcGFydGlhbHNEQU8+O1xuZXhwb3J0IHZhciBsYXlvdXRzQ2FjaGU6IFRlbXBsYXRlc0ZpbGVDYWNoZTxMYXlvdXQsIHR5cGVvZiBsYXlvdXRzREFPPjtcbmV4cG9ydCB2YXIgZG9jdW1lbnRzQ2FjaGU6IERvY3VtZW50c0ZpbGVDYWNoZTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvblxuKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICBhc3NldHNDYWNoZSA9IG5ldyBCYXNlRmlsZUNhY2hlPEFzc2V0LCBUYXNzZXRzREFPPihcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAnYXNzZXRzJyxcbiAgICAgICAgY29uZmlnLmFzc2V0RGlycyxcbiAgICAgICAgYXNzZXRzREFPXG4gICAgKTtcbiAgICBhd2FpdCBhc3NldHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgYXNzZXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIHBhcnRpYWxzQ2FjaGUgPSBuZXcgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgICAgICAgICAgUGFydGlhbCwgVHBhcnRpYWxzREFPXG4gICAgPihcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAncGFydGlhbHMnLFxuICAgICAgICBjb25maWcucGFydGlhbHNEaXJzLFxuICAgICAgICBwYXJ0aWFsc0RBT1xuICAgICk7XG4gICAgYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgcGFydGlhbHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsc0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICBsYXlvdXRzQ2FjaGUgPSBuZXcgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgICAgICAgICAgTGF5b3V0LCBUbGF5b3V0c0RBT1xuICAgID4oXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2xheW91dHMnLFxuICAgICAgICBjb25maWcubGF5b3V0RGlycyxcbiAgICAgICAgbGF5b3V0c0RBT1xuICAgICk7XG4gICAgYXdhaXQgbGF5b3V0c0NhY2hlLnNldHVwKCk7XG5cbiAgICBsYXlvdXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgRG9jdW1lbnRzRmlsZUNhY2hlICdkb2N1bWVudHMnICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5kb2N1bWVudERpcnMpfWApO1xuXG4gICAgZG9jdW1lbnRzQ2FjaGUgPSBuZXcgRG9jdW1lbnRzRmlsZUNhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdkb2N1bWVudHMnLFxuICAgICAgICBjb25maWcuZG9jdW1lbnREaXJzXG4gICAgKTtcbiAgICBhd2FpdCBkb2N1bWVudHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgZG9jdW1lbnRzQ2FjaGUub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudHNDYWNoZSBFUlJPUiAke3V0aWwuaW5zcGVjdChlcnIpfWApO1xuICAgIH0pO1xuXG4gICAgYXdhaXQgY29uZmlnLmhvb2tQbHVnaW5DYWNoZVNldHVwKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZUZpbGVDYWNoZXMoKSB7XG4gICAgaWYgKGRvY3VtZW50c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGRvY3VtZW50c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGRvY3VtZW50c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoYXNzZXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgYXNzZXRzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgYXNzZXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChsYXlvdXRzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgbGF5b3V0c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGxheW91dHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHBhcnRpYWxzQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgcGFydGlhbHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBwYXJ0aWFsc0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbn1cbiJdfQ==