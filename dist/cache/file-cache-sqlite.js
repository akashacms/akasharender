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
        const selector = {};
        if (options.mime) {
            if (typeof options.mime === 'string') {
                selector.mime = {
                    eq: options.mime
                };
            }
            else if (Array.isArray(options.mime)) {
                selector.mime = {
                    in: options.mime
                };
            } /* else {
                throw new Error(`Incorrect MIME check ${options.mime}`);
            } */
        }
        if (typeof options.rendersToHTML === 'boolean') {
            selector.rendersToHTML = {
                eq: options.rendersToHTML
            };
        }
        if (typeof options?.rootPath === 'string') {
            selector.renderPath = {
                isLike: `${options.rootPath}%`
                // sql: ` renderPath like '${options.rootPath}%' `
            };
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
            selector.or = regexSQL.or;
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
    documentsCache.on('error', (...args) => {
        console.error(`documentsCache ERROR ${util.inspect(args)}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1jYWNoZS1zcWxpdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvZmlsZS1jYWNoZS1zcWxpdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsT0FBTyxFQUFFLFdBQVcsRUFBeUIsTUFBTSx5QkFBeUIsQ0FBQztBQUM3RSxPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sR0FBRyxNQUFPLEtBQUssQ0FBQztBQUV2QixPQUFPLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDcEIsT0FBTyxZQUFZLE1BQU0sUUFBUSxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFFdEMsT0FBTyxFQUNILEtBQUssRUFFTCxFQUFFLEVBQ0YsRUFBRSxFQUNGLEtBQUssRUFDTCxLQUFLLEVBR0wsTUFBTSxFQUNOLE9BQU8sRUFHVixNQUFNLFlBQVksQ0FBQztBQUVwQixPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRWxDLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUUxQiwwQkFBMEI7QUFNbkIsSUFBTSxLQUFLLEdBQVgsTUFBTSxLQUFLO0NBdURqQixDQUFBO0FBaERHO0lBSkMsRUFBRSxDQUFDO1FBQ0EsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTTtLQUNoQyxDQUFDO0lBQ0QsS0FBSyxDQUFDLGFBQWEsQ0FBQzs7b0NBQ1A7QUFLZDtJQUhDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU07S0FDL0IsQ0FBQzs7bUNBQ1c7QUFNYjtJQUpDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU07S0FDbEMsQ0FBQztJQUNELEtBQUssQ0FBQyxlQUFlLENBQUM7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ZUFBZTtJQUNqQyxJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQ2pCLE1BQU0sY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzdCLGNBQWMsR0FBRyxTQUFTLENBQUM7SUFDL0IsQ0FBQztJQUNELElBQUksV0FBVyxFQUFFLENBQUM7UUFDZCxNQUFNLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMxQixXQUFXLEdBQUcsU0FBUyxDQUFDO0lBQzVCLENBQUM7SUFDRCxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ2YsTUFBTSxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDM0IsWUFBWSxHQUFHLFNBQVMsQ0FBQztJQUM3QixDQUFDO0lBQ0QsSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUNoQixNQUFNLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM1QixhQUFhLEdBQUcsU0FBUyxDQUFDO0lBQzlCLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgeyBEaXJzV2F0Y2hlciwgZGlyVG9XYXRjaCwgVlBhdGhEYXRhIH0gZnJvbSAnQGFrYXNoYWNtcy9zdGFja2VkLWRpcnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCB1cmwgIGZyb20gJ3VybCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gJ2ZzJztcbmltcG9ydCBGUyBmcm9tICdmcyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgeyBtaW5pbWF0Y2ggfSBmcm9tICdtaW5pbWF0Y2gnO1xuXG5pbXBvcnQge1xuICAgIGZpZWxkLFxuICAgIEZpZWxkT3B0cyxcbiAgICBmayxcbiAgICBpZCxcbiAgICBpbmRleCxcbiAgICB0YWJsZSxcbiAgICBUYWJsZU9wdHMsXG4gICAgU3FsRGF0YWJhc2UsXG4gICAgc2NoZW1hLFxuICAgIEJhc2VEQU8sXG4gICAgRmlsdGVyLFxuICAgIFdoZXJlXG59IGZyb20gJ3NxbGl0ZTNvcm0nO1xuXG5pbXBvcnQgeyBzcWRiIH0gZnJvbSAnLi4vc3FkYi5qcyc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uIH0gZnJvbSAnLi4vaW5kZXguanMnO1xuaW1wb3J0IGZhc3RxIGZyb20gJ2Zhc3RxJztcblxuLy8vLy8vLy8vLy8vLyBBc3NldHMgdGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnQVNTRVRTJyxcbiAgICB3aXRob3V0Um93SWQ6IHRydWUsXG59IGFzIFRhYmxlT3B0cylcbmV4cG9ydCBjbGFzcyBBc3NldCB7XG5cbiAgICAvLyBQcmltYXJ5IGtleVxuICAgIEBpZCh7XG4gICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X3ZwYXRoJylcbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21pbWUnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgbWltZTogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdhc3NldF9tb3VudGVkJylcbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X21vdW50UG9pbnQnKVxuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnYXNzZXRfcGF0aEluTW91bnRlZCcpXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2ZzcGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X2ZzcGF0aCcpXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X3JlbmRlclBhdGgnKVxuICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtdGltZU1zJyxcbiAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4gICAgfSlcbiAgICBtdGltZU1zOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnaW5mbycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGluZm86IGFueTtcblxufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnQVNTRVRTJyk7XG50eXBlIFRhc3NldHNEQU8gPSBCYXNlREFPPEFzc2V0PjtcbmV4cG9ydCBjb25zdCBhc3NldHNEQU86IFRhc3NldHNEQU9cbiAgICA9IG5ldyBCYXNlREFPPEFzc2V0PihBc3NldCwgc3FkYik7XG5cbi8vLy8vLy8vLy8vLyBQYXJ0aWFscyBUYWJsZVxuXG5AdGFibGUoe1xuICAgIG5hbWU6ICdQQVJUSUFMUycsXG4gICAgd2l0aG91dFJvd0lkOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBQYXJ0aWFsIHtcblxuICAgIC8vIFByaW1hcnkga2V5XG4gICAgQGlkKHtcbiAgICAgICAgbmFtZTogJ3ZwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF92cGF0aCcpXG4gICAgdnBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtaW1lJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIG1pbWU6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgncGFydGlhbF9tb3VudGVkJylcbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfbW91bnRQb2ludCcpXG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3BhdGhJbk1vdW50ZWQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX3BhdGhJbk1vdW50ZWQnKVxuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdmc3BhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdwYXJ0aWFsX2ZzcGF0aCcpXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3BhcnRpYWxfcmVuZGVyUGF0aCcpXG4gICAgcmVuZGVyUGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ210aW1lTXMnLFxuICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbiAgICB9KVxuICAgIG10aW1lTXM6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NNZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY01ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZG9jQ29udGVudCcsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGRvY0NvbnRlbnQ6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NCb2R5JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jQm9keTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgbWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdpbmZvJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgaW5mbzogYW55O1xufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnUEFSVElBTFMnKTtcbnR5cGUgVHBhcnRpYWxzREFPID0gQmFzZURBTzxQYXJ0aWFsPjtcbmV4cG9ydCBjb25zdCBwYXJ0aWFsc0RBT1xuICAgID0gbmV3IEJhc2VEQU88UGFydGlhbD4oUGFydGlhbCwgc3FkYik7XG5cbi8vLy8vLy8vLy8vLy8vLy8vIExheW91dHMgVGFibGVcblxuQHRhYmxlKHtcbiAgICBuYW1lOiAnTEFZT1VUUycsXG4gICAgd2l0aG91dFJvd0lkOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBMYXlvdXQge1xuXG4gICAgLy8gUHJpbWFyeSBrZXlcbiAgICBAaWQoe1xuICAgICAgICBuYW1lOiAndnBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdsYXlvdXRfdnBhdGgnKVxuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBtaW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9tb3VudGVkJylcbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRQb2ludCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9tb3VudFBvaW50JylcbiAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncGF0aEluTW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9wYXRoSW5Nb3VudGVkJylcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnbGF5b3V0X2ZzcGF0aCcpXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAncmVuZGVyUGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2xheW91dF9yZW5kZXJQYXRoJylcbiAgICByZW5kZXJQYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbXRpbWVNcycsXG4gICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuICAgIH0pXG4gICAgbXRpbWVNczogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY01ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jTWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NDb250ZW50JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jQ29udGVudDogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY0JvZHknLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBkb2NCb2R5OiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWV0YWRhdGEnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBtZXRhZGF0YTogYW55O1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvOiBhbnk7XG5cbn1cblxuYXdhaXQgc2NoZW1hKCkuY3JlYXRlVGFibGUoc3FkYiwgJ0xBWU9VVFMnKTtcbnR5cGUgVGxheW91dHNEQU8gPSBCYXNlREFPPExheW91dD47XG5leHBvcnQgY29uc3QgbGF5b3V0c0RBT1xuICAgID0gbmV3IEJhc2VEQU88TGF5b3V0PihMYXlvdXQsIHNxZGIpO1xuXG4vLy8vLy8vLy8vLy8vLy8gRG9jdW1lbnRzIFRhYmxlXG5cbkB0YWJsZSh7XG4gICAgbmFtZTogJ0RPQ1VNRU5UUycsXG4gICAgd2l0aG91dFJvd0lkOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBEb2N1bWVudCB7XG5cbiAgICAvLyBQcmltYXJ5IGtleVxuICAgIEBpZCh7XG4gICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfdnBhdGgnKVxuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbWltZScsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBtaW1lOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbW91bnRlZCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2RvY3NfbW91bnRlZCcpXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ21vdW50UG9pbnQnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX21vdW50UG9pbnQnKVxuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXRoSW5Nb3VudGVkJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19wYXRoSW5Nb3VudGVkJylcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZnNwYXRoJywgZGJ0eXBlOiAnVEVYVCdcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19mc3BhdGgnKVxuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ3JlbmRlclBhdGgnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX3JlbmRlclBhdGgnKVxuICAgIHJlbmRlclBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdyZW5kZXJzVG9IVE1MJywgZGJ0eXBlOiAnSU5URUdFUidcbiAgICB9KVxuICAgIEBpbmRleCgnZG9jc19yZW5kZXJzVG9IVE1MJylcbiAgICByZW5kZXJzVG9IVE1MOiBib29sZWFuO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2Rpcm5hbWUnLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX2Rpcm5hbWUnKVxuICAgIGRpcm5hbWU6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdwYXJlbnREaXInLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX3BhcmVudERpcicpXG4gICAgcGFyZW50RGlyOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbXRpbWVNcycsXG4gICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuICAgIH0pXG4gICAgbXRpbWVNczogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2RvY01ldGFkYXRhJywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogdHJ1ZVxuICAgIH0pXG4gICAgZG9jTWV0YWRhdGE6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NDb250ZW50JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogZmFsc2VcbiAgICB9KVxuICAgIGRvY0NvbnRlbnQ6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdkb2NCb2R5JywgZGJ0eXBlOiAnVEVYVCcsIGlzSnNvbjogZmFsc2VcbiAgICB9KVxuICAgIGRvY0JvZHk6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdtZXRhZGF0YScsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIG1ldGFkYXRhOiBhbnk7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAndGFncycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIHRhZ3M6IGFueTtcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdsYXlvdXQnLCBkYnR5cGU6ICdURVhUJywgaXNKc29uOiBmYWxzZVxuICAgIH0pXG4gICAgQGluZGV4KCdkb2NzX2xheW91dCcpXG4gICAgbGF5b3V0OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnaW5mbycsIGRidHlwZTogJ1RFWFQnLCBpc0pzb246IHRydWVcbiAgICB9KVxuICAgIGluZm86IGFueTtcblxufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnRE9DVU1FTlRTJyk7XG50eXBlIFRkb2N1bWVudHNzREFPID0gQmFzZURBTzxEb2N1bWVudD47XG5leHBvcnQgY29uc3QgZG9jdW1lbnRzREFPXG4gICAgPSBuZXcgQmFzZURBTzxEb2N1bWVudD4oRG9jdW1lbnQsIHNxZGIpO1xuXG5AdGFibGUoeyBuYW1lOiAnVEFHR0xVRScgfSlcbmNsYXNzIFRhZ0dsdWUge1xuXG4gICAgQGZpZWxkKHsgbmFtZTogJ2RvY3ZwYXRoJywgZGJ0eXBlOiAnc3RyaW5nJyB9KVxuICAgIEBmaygndGFnX2RvY3ZwYXRoJywgJ0RPQ1VNRU5UUycsICd2cGF0aCcpXG4gICAgQGluZGV4KCd0YWdnbHVlX3ZwYXRoJylcbiAgICBkb2N2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHsgbmFtZTogJ3NsdWcnLCBkYnR5cGU6ICdzdHJpbmcnIH0pXG4gICAgQGZrKCd0YWdfc2x1ZycsICdUQUdTJywgJ3NsdWcnKVxuICAgIEBpbmRleCgndGFnZ2x1ZV9zbHVnJylcbiAgICBzbHVnOiBzdHJpbmc7XG59XG5cbmF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdUQUdHTFVFJyk7XG5jb25zdCB0YWdHbHVlREFPID0gbmV3IEJhc2VEQU88VGFnR2x1ZT4oVGFnR2x1ZSwgc3FkYik7XG5cbkB0YWJsZSh7IG5hbWU6ICdUQUdTJyB9KVxuY2xhc3MgVGFnIHtcbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAndGFnbmFtZScsXG4gICAgICAgIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICB0YWduYW1lOiBzdHJpbmc7XG5cbiAgICBAaWQoe1xuICAgICAgICBuYW1lOiAnc2x1ZycsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ3RhZ19zbHVnJylcbiAgICBzbHVnOiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnZGVzY3JpcHRpb24nLCBkYnR5cGU6ICdURVhUJ1xuICAgIH0pXG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG59XG5cbmF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdUQUdTJyk7XG5jb25zdCB0YWdzREFPID0gbmV3IEJhc2VEQU88VGFnPihUYWcsIHNxZGIpO1xuXG5cbi8vIENvbnZlcnQgQWthc2hhQ01TIG1vdW50IHBvaW50cyBpbnRvIHRoZSBtb3VudHBvaW50XG4vLyB1c2VkIGJ5IERpcnNXYXRjaGVyXG5jb25zdCByZW1hcGRpcnMgPSBkaXJ6ID0+IHtcbiAgICByZXR1cm4gZGlyei5tYXAoZGlyID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2RvY3VtZW50IGRpciAnLCBkaXIpO1xuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6ICcvJyxcbiAgICAgICAgICAgICAgICBiYXNlTWV0YWRhdGE6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFkaXIuZGVzdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVtYXBkaXJzIGludmFsaWQgbW91bnQgc3BlY2lmaWNhdGlvbiAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIuc3JjLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5kZXN0LFxuICAgICAgICAgICAgICAgIGJhc2VNZXRhZGF0YTogZGlyLmJhc2VNZXRhZGF0YSxcbiAgICAgICAgICAgICAgICBpZ25vcmU6IGRpci5pZ25vcmVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogVHlwZSBmb3IgcmV0dXJuIGZyb20gcGF0aHMgbWV0aG9kLiAgVGhlIGZpZWxkcyBoZXJlXG4gKiBhcmUgd2hhdHMgaW4gdGhlIEFzc2V0L0xheW91dC9QYXJ0aWFsIGNsYXNzZXMgYWJvdmVcbiAqIHBsdXMgYSBjb3VwbGUgZmllbGRzIHRoYXQgb2xkZXIgY29kZSBleHBlY3RlZFxuICogZnJvbSB0aGUgcGF0aHMgbWV0aG9kLlxuICovXG5leHBvcnQgdHlwZSBQYXRoc1JldHVyblR5cGUgPSB7XG4gICAgdnBhdGg6IHN0cmluZyxcbiAgICBtaW1lOiBzdHJpbmcsXG4gICAgbW91bnRlZDogc3RyaW5nLFxuICAgIG1vdW50UG9pbnQ6IHN0cmluZyxcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmcsXG4gICAgbXRpbWVNczogc3RyaW5nLFxuICAgIGluZm86IGFueSxcbiAgICAvLyBUaGVzZSB3aWxsIGJlIGNvbXB1dGVkIGluIEJhc2VGaWxlQ2FjaGVcbiAgICAvLyBUaGV5IHdlcmUgcmV0dXJuZWQgaW4gcHJldmlvdXMgdmVyc2lvbnMuXG4gICAgZnNwYXRoOiBzdHJpbmcsXG4gICAgcmVuZGVyUGF0aDogc3RyaW5nXG59O1xuXG5leHBvcnQgY2xhc3MgQmFzZUZpbGVDYWNoZTxcbiAgICAgICAgVCBleHRlbmRzIEFzc2V0IHwgTGF5b3V0IHwgUGFydGlhbCB8IERvY3VtZW50LFxuICAgICAgICBUZGFvIGV4dGVuZHMgQmFzZURBTzxUPlxuPiBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cbiAgICAjY29uZmlnPzogQ29uZmlndXJhdGlvbjtcbiAgICAjbmFtZT86IHN0cmluZztcbiAgICAjZGlycz86IGRpclRvV2F0Y2hbXTtcbiAgICAjaXNfcmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAjY2FjaGVfY29udGVudDogYm9vbGVhbjtcbiAgICAjbWFwX3JlbmRlcnBhdGg6IGJvb2xlYW47XG4gICAgI2RhbzogVGRhbzsgLy8gQmFzZURBTzxUPjtcblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIGNvbmZpZyBBa2FzaGFSZW5kZXIgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAgICAgKiBAcGFyYW0gZGlycyBhcnJheSBvZiBkaXJlY3RvcmllcyBhbmQgbW91bnQgcG9pbnRzIHRvIHdhdGNoXG4gICAgICogQHBhcmFtIG5hbWUgc3RyaW5nIGdpdmluZyB0aGUgbmFtZSBmb3IgdGhpcyB3YXRjaGVyIG5hbWVcbiAgICAgKiBAcGFyYW0gZGFvIFRoZSBTUUxJVEUzT1JNIERBTyBpbnN0YW5jZSB0byB1c2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgY29uZmlnOiBDb25maWd1cmF0aW9uLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRpcnM6IGRpclRvV2F0Y2hbXSxcbiAgICAgICAgZGFvOiBUZGFvIC8vIEJhc2VEQU88VD5cbiAgICApIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEJhc2VGaWxlQ2FjaGUgJHtuYW1lfSBjb25zdHJ1Y3RvciBkaXJzPSR7dXRpbC5pbnNwZWN0KGRpcnMpfWApO1xuICAgICAgICB0aGlzLiNjb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuI25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLiNkaXJzID0gZGlycztcbiAgICAgICAgdGhpcy4jaXNfcmVhZHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4jY2FjaGVfY29udGVudCA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNtYXBfcmVuZGVycGF0aCA9IGZhbHNlO1xuICAgICAgICB0aGlzLiNkYW8gPSBkYW87XG4gICAgfVxuXG4gICAgZ2V0IGNvbmZpZygpICAgICB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICBnZXQgbmFtZSgpICAgICAgIHsgcmV0dXJuIHRoaXMuI25hbWU7IH1cbiAgICBnZXQgZGlycygpICAgICAgIHsgcmV0dXJuIHRoaXMuI2RpcnM7IH1cbiAgICBzZXQgY2FjaGVDb250ZW50KGRvaXQpIHsgdGhpcy4jY2FjaGVfY29udGVudCA9IGRvaXQ7IH1cbiAgICBnZXQgZ2FjaGVDb250ZW50KCkgeyByZXR1cm4gdGhpcy4jY2FjaGVfY29udGVudDsgfVxuICAgIHNldCBtYXBSZW5kZXJQYXRoKGRvaXQpIHsgdGhpcy4jbWFwX3JlbmRlcnBhdGggPSBkb2l0OyB9XG4gICAgZ2V0IG1hcFJlbmRlclBhdGgoKSB7IHJldHVybiB0aGlzLiNtYXBfcmVuZGVycGF0aDsgfVxuICAgIGdldCBkYW8oKTogVGRhbyB7IHJldHVybiB0aGlzLiNkYW87IH1cblxuICAgIC8vIFNLSVA6IGdldER5bmFtaWNWaWV3XG5cblxuICAgICN3YXRjaGVyOiBEaXJzV2F0Y2hlcjtcbiAgICAjcXVldWU7XG5cbiAgICBhc3luYyBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuI3F1ZXVlKSB7XG4gICAgICAgICAgICB0aGlzLiNxdWV1ZS5raWxsQW5kRHJhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLiN3YXRjaGVyKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ0xPU0lORyAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuI3dhdGNoZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2NoYW5nZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2FkZGVkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCd1bmxpbmtlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVhZHknKTtcblxuICAgICAgICBhd2FpdCBzcWRiLmNsb3NlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHVwIHJlY2VpdmluZyBldmVudHMgZnJvbSBEaXJzV2F0Y2hlciwgYW5kIGRpc3BhdGNoaW5nIHRvXG4gICAgICogdGhlIGhhbmRsZXIgbWV0aG9kcy5cbiAgICAgKi9cbiAgICBhc3luYyBzZXR1cCgpIHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBpZiAodGhpcy4jd2F0Y2hlcikge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy4jd2F0Y2hlci5jbG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jcXVldWUgPSBmYXN0cS5wcm9taXNlKGFzeW5jIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmNvZGUgPT09ICdjaGFuZ2VkJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGFuZ2UgJHtldmVudC5uYW1lfSAke2V2ZW50LmluZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZjYWNoZS5oYW5kbGVDaGFuZ2VkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnY2hhbmdlJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAnYWRkZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGFkZCAke2V2ZW50Lm5hbWV9ICR7ZXZlbnQuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZUFkZGVkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnYWRkJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAndW5saW5rZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHVubGluayAke2V2ZW50Lm5hbWV9ICR7ZXZlbnQuaW5mby52cGF0aH1gLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZVVubGlua2VkKGV2ZW50Lm5hbWUsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgndW5saW5rJywgZXZlbnQubmFtZSwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBmY2FjaGUuZW1pdCgnZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBldmVudC5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwYXRoOiBldmVudC5pbmZvLnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogfSBlbHNlIGlmIChldmVudC5jb2RlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZUVycm9yKGV2ZW50Lm5hbWUpICovXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdyZWFkeScpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlUmVhZHkoZXZlbnQubmFtZSk7XG4gICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ3JlYWR5JywgZXZlbnQubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwKTtcblxuICAgICAgICB0aGlzLiN3YXRjaGVyID0gbmV3IERpcnNXYXRjaGVyKHRoaXMubmFtZSk7XG5cbiAgICAgICAgdGhpcy4jd2F0Y2hlci5vbignY2hhbmdlJywgYXN5bmMgKG5hbWUsIGluZm8pID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IGNoYW5nZWQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFBVU0ggJHtuYW1lfSBjaGFuZ2VkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnY2hhbmdlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICdjaGFuZ2UnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCBjaGFuZ2UgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ2FkZCcsIGFzeW5jIChuYW1lLCBpbmZvKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke25hbWV9IGFkZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBQVVNIICR7bmFtZX0gYWRkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnYWRkZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAnYWRkJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgYWRkICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCd1bmxpbmsnLCBhc3luYyAobmFtZSwgaW5mbykgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHVubGluayAke25hbWV9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4jcXVldWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAndW5saW5rZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAndW5saW5rJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIHVubGluayAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigncmVhZHknLCBhc3luYyAobmFtZSkgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7bmFtZX0gcmVhZHlgKTtcbiAgICAgICAgICAgIHRoaXMuI3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvZGU6ICdyZWFkeScsXG4gICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hcHBlZCA9IHJlbWFwZGlycyh0aGlzLmRpcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2V0dXAgJHt0aGlzLiNuYW1lfSB3YXRjaCAke3V0aWwuaW5zcGVjdCh0aGlzLiNkaXJzKX0gPT0+ICR7dXRpbC5pbnNwZWN0KG1hcHBlZCl9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMuI3dhdGNoZXIud2F0Y2gobWFwcGVkKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgREFPICR7dGhpcy5kYW8udGFibGUubmFtZX0gJHt1dGlsLmluc3BlY3QodGhpcy5kYW8udGFibGUuZmllbGRzKX1gKTtcblxuICAgIH1cblxuICAgIGdhdGhlckluZm9EYXRhKGluZm86IFQpIHtcbiAgICAgICAgLy8gUGxhY2Vob2xkZXIgd2hpY2ggc29tZSBzdWJjbGFzc2VzXG4gICAgICAgIC8vIGFyZSBleHBlY3RlZCB0byBvdmVycmlkZVxuXG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFuZGxlQ2hhbmdlZChuYW1lLCBpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlQ2hhbmdlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAodGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgT09PT09PT09HQSEhISBSZWNlaXZlZCBhIGZpbGUgdGhhdCBzaG91bGQgYmUgaW5nb3JlZCBgLCBpbmZvKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZUNoYW5nZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGFuZGxlQ2hhbmdlZCAke2luZm8udnBhdGh9ICR7aW5mby5tZXRhZGF0YSAmJiBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA/IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlIDogJz8/Pyd9YCk7XG5cbiAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpbmZvKTtcbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAgICAgdnBhdGg6IHsgZXE6IGluZm8udnBhdGggfSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IHsgZXE6IGluZm8ubW91bnRlZCB9XG4gICAgICAgIH0gYXMgRmlsdGVyPFQ+KTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhQXJyYXkuaXNBcnJheShyZXN1bHQpXG4gICAgICAgICB8fCByZXN1bHQubGVuZ3RoIDw9IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBJdCB3YXNuJ3QgZm91bmQgaW4gdGhlIGRhdGFiYXNlLiAgSGVuY2VcbiAgICAgICAgICAgIC8vIHdlIHNob3VsZCBhZGQgaXQuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVBZGRlZChuYW1lLCBpbmZvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluZm8uc3RhY2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlRG9jSW5EQihpbmZvKTtcbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWcuaG9va0ZpbGVDaGFuZ2VkKG5hbWUsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm8pIHtcbiAgICAgICAgYXdhaXQgdGhpcy4jZGFvLnVwZGF0ZSh7XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICAvLyBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICAvLyBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH0gYXMgVCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2UgcmVjZWl2ZSB0aGlzOlxuICAgICAqXG4gICAgICoge1xuICAgICAqICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAqICAgIHZwYXRoOiB2cGF0aCxcbiAgICAgKiAgICBtaW1lOiBtaW1lLmdldFR5cGUoZnNwYXRoKSxcbiAgICAgKiAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgKiAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgKiAgICBwYXRoSW5Nb3VudGVkOiBjb21wdXRlZCByZWxhdGl2ZSBwYXRoXG4gICAgICogICAgc3RhY2s6IFsgYXJyYXkgb2YgdGhlc2UgaW5zdGFuY2VzIF1cbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBOZWVkIHRvIGFkZDpcbiAgICAgKiAgICByZW5kZXJQYXRoXG4gICAgICogICAgQW5kIGZvciBIVE1MIHJlbmRlciBmaWxlcywgYWRkIHRoZSBiYXNlTWV0YWRhdGEgYW5kIGRvY01ldGFkYXRhXG4gICAgICpcbiAgICAgKiBTaG91bGQgcmVtb3ZlIHRoZSBzdGFjaywgc2luY2UgaXQncyBsaWtlbHkgbm90IHVzZWZ1bCB0byB1cy5cbiAgICAgKi9cblxuICAgIGFzeW5jIGhhbmRsZUFkZGVkKG5hbWUsIGluZm8pIHtcbiAgICAgICAgLy8gIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7bmFtZX0gaGFuZGxlQWRkZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09PT09PR0EhISEgUmVjZWl2ZWQgYSBmaWxlIHRoYXQgc2hvdWxkIGJlIGluZ29yZWQgYCwgaW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgIT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVBZGRlZCBldmVudCBmb3Igd3JvbmcgbmFtZTsgZ290ICR7bmFtZX0sIGV4cGVjdGVkICR7dGhpcy5uYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nYXRoZXJJbmZvRGF0YShpbmZvKTtcbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnNlcnREb2NUb0RCKGluZm8pO1xuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUFkZGVkKG5hbWUsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyBpbnNlcnREb2NUb0RCKGluZm8pIHtcbiAgICAgICAgYXdhaXQgdGhpcy4jZGFvLmluc2VydCh7XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICAvLyBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICAvLyBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH0gYXMgVCk7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFuZGxlVW5saW5rZWQobmFtZSwgaW5mbykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZVVubGlua2VkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlVW5saW5rZWQgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmhvb2tGaWxlVW5saW5rZWQobmFtZSwgaW5mbyk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy4jZGFvLmRlbGV0ZUFsbCh7XG4gICAgICAgICAgICB2cGF0aDogeyBlcTogaW5mby52cGF0aCB9LFxuICAgICAgICAgICAgbW91bnRlZDogeyBlcTogaW5mby5tb3VudGVkIH1cbiAgICAgICAgfSBhcyBXaGVyZTxUPik7XG4gICAgfVxuXG4gICAgYXN5bmMgaGFuZGxlUmVhZHkobmFtZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgUFJPQ0VTUyAke25hbWV9IGhhbmRsZVJlYWR5YCk7XG4gICAgICAgIGlmIChuYW1lICE9PSB0aGlzLm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlUmVhZHkgZXZlbnQgZm9yIHdyb25nIG5hbWU7IGdvdCAke25hbWV9LCBleHBlY3RlZCAke3RoaXMubmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNpc19yZWFkeSA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdCgncmVhZHknLCBuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBkaXJlY3RvcnkgbW91bnQgY29ycmVzcG9uZGluZyB0byB0aGUgZmlsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gaW5mb1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgZmlsZURpck1vdW50KGluZm8pIHtcbiAgICAgICAgY29uc3QgbWFwcGVkID0gcmVtYXBkaXJzKHRoaXMuZGlycyk7XG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIG1hcHBlZCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRpck1vdW50IGZvciAke2luZm8udnBhdGh9IC0tICR7dXRpbC5pbnNwZWN0KGluZm8pfSA9PT0gJHt1dGlsLmluc3BlY3QoZGlyKX1gKTtcbiAgICAgICAgICAgIGlmIChpbmZvLm1vdW50UG9pbnQgPT09IGRpci5tb3VudFBvaW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNob3VsZCB0aGlzIGZpbGUgYmUgaWdub3JlZCwgYmFzZWQgb24gdGhlIGBpZ25vcmVgIGZpZWxkXG4gICAgICogaW4gdGhlIG1hdGNoaW5nIGBkaXJgIG1vdW50IGVudHJ5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBpbmZvXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBpZ25vcmVGaWxlKGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGlnbm9yZUZpbGUgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICBjb25zdCBkaXJNb3VudCA9IHRoaXMuZmlsZURpck1vdW50KGluZm8pO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSAke2luZm8udnBhdGh9IGRpck1vdW50ICR7dXRpbC5pbnNwZWN0KGRpck1vdW50KX1gKTtcbiAgICAgICAgbGV0IGlnbm9yZSA9IGZhbHNlO1xuICAgICAgICBpZiAoZGlyTW91bnQpIHtcblxuICAgICAgICAgICAgbGV0IGlnbm9yZXM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRpck1vdW50Lmlnbm9yZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gWyBkaXJNb3VudC5pZ25vcmUgXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkaXJNb3VudC5pZ25vcmUpKSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IGRpck1vdW50Lmlnbm9yZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBpIG9mIGlnbm9yZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAobWluaW1hdGNoKGluZm8udnBhdGgsIGkpKSBpZ25vcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkaXJNb3VudC5pZ25vcmUgJHtmc3BhdGh9ICR7aX0gPT4gJHtpZ25vcmV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiAoaWdub3JlKSBjb25zb2xlLmxvZyhgTVVTVCBpZ25vcmUgRmlsZSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSBmb3IgJHtpbmZvLnZwYXRofSA9PT4gJHtpZ25vcmV9YCk7XG4gICAgICAgICAgICByZXR1cm4gaWdub3JlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gbm8gbW91bnQ/ICB0aGF0IG1lYW5zIHNvbWV0aGluZyBzdHJhbmdlXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBObyBkaXJNb3VudCBmb3VuZCBmb3IgJHtpbmZvLnZwYXRofSAvICR7aW5mby5kaXJNb3VudGVkT259YCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFsbG93IGEgY2FsbGVyIHRvIHdhaXQgdW50aWwgdGhlIDxlbT5yZWFkeTwvZW0+IGV2ZW50IGhhc1xuICAgICAqIGJlZW4gc2VudCBmcm9tIHRoZSBEaXJzV2F0Y2hlciBpbnN0YW5jZS4gIFRoaXMgZXZlbnQgbWVhbnMgdGhlXG4gICAgICogaW5pdGlhbCBpbmRleGluZyBoYXMgaGFwcGVuZWQuXG4gICAgICovXG4gICAgYXN5bmMgaXNSZWFkeSgpIHtcbiAgICAgICAgLy8gSWYgdGhlcmUncyBubyBkaXJlY3RvcmllcywgdGhlcmUgd29uJ3QgYmUgYW55IGZpbGVzIFxuICAgICAgICAvLyB0byBsb2FkLCBhbmQgbm8gbmVlZCB0byB3YWl0XG4gICAgICAgIHdoaWxlICh0aGlzLiNkaXJzLmxlbmd0aCA+IDAgJiYgIXRoaXMuI2lzX3JlYWR5KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGRvZXMgYSAxMDBtcyBwYXVzZVxuICAgICAgICAgICAgLy8gVGhhdCBsZXRzIHVzIGNoZWNrIGlzX3JlYWR5IGV2ZXJ5IDEwMG1zXG4gICAgICAgICAgICAvLyBhdCB2ZXJ5IGxpdHRsZSBjb3N0XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgIWlzUmVhZHkgJHt0aGlzLm5hbWV9ICR7dGhpc1tfc3ltYl9kaXJzXS5sZW5ndGh9ICR7dGhpc1tfc3ltYl9pc19yZWFkeV19YCk7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYXN5bmMgcGF0aHMocm9vdFBhdGg/OiBzdHJpbmcpXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxQYXRoc1JldHVyblR5cGU+PlxuICAgIHtcbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuXG4gICAgICAgIGxldCByb290UCA9IHJvb3RQYXRoPy5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgID8gcm9vdFBhdGg/LnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgOiByb290UGF0aDtcblxuICAgICAgICAvLyBUaGlzIGlzIGNvcGllZCBmcm9tIHRoZSBvbGRlciB2ZXJzaW9uXG4gICAgICAgIC8vIChMb2tpSlMgdmVyc2lvbikgb2YgdGhpcyBmdW5jdGlvbi4gIEl0XG4gICAgICAgIC8vIHNlZW1zIG1lYW50IHRvIGVsaW1pbmF0ZSBkdXBsaWNhdGVzLlxuICAgICAgICBjb25zdCB2cGF0aHNTZWVuID0gbmV3IFNldCgpO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdG9yID0ge1xuICAgICAgICAgICAgb3JkZXI6IHsgbXRpbWVNczogdHJ1ZSB9XG4gICAgICAgIH0gYXMgYW55O1xuICAgICAgICBpZiAodHlwZW9mIHJvb3RQID09PSAnc3RyaW5nJ1xuICAgICAgICAmJiByb290UC5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgc2VsZWN0b3IucmVuZGVyUGF0aCA9IHtcbiAgICAgICAgICAgICAgICBpc0xpa2U6IGAke3Jvb3RQfSVgXG4gICAgICAgICAgICAgICAgLy8gc3FsOiBgIHJlbmRlclBhdGggcmVnZXhwICdeJHtyb290UH0nIGBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHBhdGhzICR7dXRpbC5pbnNwZWN0KHNlbGVjdG9yKX1gKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHNlbGVjdG9yKTtcbiAgICAgICAgY29uc3QgcmVzdWx0MiA9IHJlc3VsdC5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcGF0aHMgP2lnbm9yZT8gJHtpdGVtLnZwYXRofWApO1xuICAgICAgICAgICAgaWYgKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZwYXRoc1NlZW4uaGFzKChpdGVtIGFzIEFzc2V0KS52cGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZwYXRoc1NlZW4uYWRkKChpdGVtIGFzIEFzc2V0KS52cGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBjb25zdCByZXN1bHQzID0gcmVzdWx0Mi5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIC8vICAgICAvLyBXZSBuZWVkIHRoZXNlIHRvIGJlIG9uZSBvZiB0aGUgY29uY3JldGVcbiAgICAgICAgLy8gICAgIC8vIHR5cGVzIHNvIHRoYXQgdGhlIG10aW1lTXMgZmllbGQgaXNcbiAgICAgICAgLy8gICAgIC8vIHJlY29nbml6ZWQgYnkgVHlwZVNjcmlwdC4gIFRoZSBBc3NldFxuICAgICAgICAvLyAgICAgLy8gY2xhc3MgaXMgYSBnb29kIHN1YnN0aXR1dGUgZm9yIHRoZSBiYXNlXG4gICAgICAgIC8vICAgICAvLyBjbGFzcyBvZiBjYWNoZWQgZmlsZXMuXG4gICAgICAgIC8vICAgICBjb25zdCBhYSA9IDxBc3NldD5hO1xuICAgICAgICAvLyAgICAgY29uc3QgYmIgPSA8QXNzZXQ+YjtcbiAgICAgICAgLy8gICAgIGlmIChhYS5tdGltZU1zIDwgYmIubXRpbWVNcykgcmV0dXJuIDE7XG4gICAgICAgIC8vICAgICBpZiAoYWEubXRpbWVNcyA9PT0gYmIubXRpbWVNcykgcmV0dXJuIDA7XG4gICAgICAgIC8vICAgICBpZiAoYWEubXRpbWVNcyA+IGJiLm10aW1lTXMpIHJldHVybiAtMTtcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gVGhpcyBzdGFnZSBjb252ZXJ0cyB0aGUgaXRlbXMgXG4gICAgICAgIC8vIHJlY2VpdmVkIGJ5IHRoaXMgZnVuY3Rpb24gaW50b1xuICAgICAgICAvLyB3aGF0IGlzIHJlcXVpcmVkIGZyb21cbiAgICAgICAgLy8gdGhlIHBhdGhzIG1ldGhvZC5cbiAgICAgICAgLy8gY29uc3QgcmVzdWx0NFxuICAgICAgICAvLyAgICAgICAgID0gbmV3IEFycmF5PFBhdGhzUmV0dXJuVHlwZT4oKTtcbiAgICAgICAgLy8gZm9yIChjb25zdCBpdGVtIG9mIHJlc3VsdDMpIHtcbiAgICAgICAgLy8gICAgIHJlc3VsdDQucHVzaCg8UGF0aHNSZXR1cm5UeXBlPntcbiAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgLy8gICAgICAgICBtaW1lOiBpdGVtLm1pbWUsXG4gICAgICAgIC8vICAgICAgICAgbW91bnRlZDogaXRlbS5tb3VudGVkLFxuICAgICAgICAvLyAgICAgICAgIG1vdW50UG9pbnQ6IGl0ZW0ubW91bnRQb2ludCxcbiAgICAgICAgLy8gICAgICAgICBwYXRoSW5Nb3VudGVkOiBpdGVtLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgIC8vICAgICAgICAgbXRpbWVNczogaXRlbS5tdGltZU1zLFxuICAgICAgICAvLyAgICAgICAgIGluZm86IGl0ZW0uaW5mbyxcbiAgICAgICAgLy8gICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpdGVtLm1vdW50ZWQsIGl0ZW0ucGF0aEluTW91bnRlZCksXG4gICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS52cGF0aFxuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXN1bHQyLyoubWFwKGl0ZW0gPT4ge1xuICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgLy8gICAgICAgICBtdGltZU1zOiBpdGVtLm10aW1lTXNcbiAgICAgICAgLy8gICAgIH07XG4gICAgICAgIC8vIH0pICovKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0MjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIHRoZSBmaWxlIHdpdGhpbiB0aGUgY2FjaGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFRoZSB2cGF0aCBvciByZW5kZXJQYXRoIHRvIGxvb2sgZm9yXG4gICAgICogQHJldHVybnMgYm9vbGVhbiB0cnVlIGlmIGZvdW5kLCBmYWxzZSBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBhc3luYyBmaW5kKF9mcGF0aCk6IFByb21pc2U8VD4ge1xuXG4gICAgICAgIGlmICh0eXBlb2YgX2ZwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBmaW5kIHBhcmFtZXRlciBub3Qgc3RyaW5nICR7dHlwZW9mIF9mcGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBjb25zdCByZXN1bHQxID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgIG9yOiBbXG4gICAgICAgICAgICAgICAgeyB2cGF0aDogeyBlcTogZnBhdGggfX0sXG4gICAgICAgICAgICAgICAgeyByZW5kZXJQYXRoOiB7IGVxOiBmcGF0aCB9fVxuICAgICAgICAgICAgXVxuICAgICAgICB9IGFzIEZpbHRlcjxUPik7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmQgJHtfZnBhdGh9ICR7ZnBhdGh9ID09PiByZXN1bHQxICR7dXRpbC5pbnNwZWN0KHJlc3VsdDEpfSBgKTtcblxuICAgICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0MS5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gIShmY2FjaGUuaWdub3JlRmlsZShpdGVtKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kICR7X2ZwYXRofSAke2ZwYXRofSA9PT4gcmVzdWx0MiAke3V0aWwuaW5zcGVjdChyZXN1bHQyKX0gYCk7XG5cbiAgICAgICAgbGV0IHJldDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0MikgJiYgcmVzdWx0Mi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXQgPSByZXN1bHQyWzBdO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0MikgJiYgcmVzdWx0Mi5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgcmV0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0ID0gcmVzdWx0MjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgICNmRXhpc3RzSW5EaXIoZnBhdGgsIGRpcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgI2ZFeGlzdHNJbkRpciAke2ZwYXRofSAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICBpZiAoZGlyLm1vdW50UG9pbnQgPT09ICcvJykge1xuICAgICAgICAgICAgY29uc3QgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5tb3VudGVkLCBmcGF0aFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxldCBmc2V4aXN0cyA9IEZTLmV4aXN0c1N5bmMoZnNwYXRoKTtcblxuICAgICAgICAgICAgaWYgKGZzZXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0gRlMuc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFZQYXRoRGF0YT4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBzdGF0cy5tdGltZU1zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtcCA9IGRpci5tb3VudFBvaW50LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgPyBkaXIubW91bnRQb2ludC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgIDogZGlyLm1vdW50UG9pbnQ7XG4gICAgICAgIG1wID0gbXAuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgPyBtcFxuICAgICAgICAgICAgOiAobXArJy8nKTtcblxuICAgICAgICBpZiAoZnBhdGguc3RhcnRzV2l0aChtcCkpIHtcbiAgICAgICAgICAgIGxldCBwYXRoSW5Nb3VudGVkXG4gICAgICAgICAgICAgICAgPSBmcGF0aC5yZXBsYWNlKGRpci5tb3VudFBvaW50LCAnJyk7XG4gICAgICAgICAgICBsZXQgZnNwYXRoID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgIGRpci5tb3VudGVkLCBwYXRoSW5Nb3VudGVkKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBDaGVja2luZyBleGlzdCBmb3IgJHtkaXIubW91bnRQb2ludH0gJHtkaXIubW91bnRlZH0gJHtwYXRoSW5Nb3VudGVkfSAke2ZzcGF0aH1gKTtcbiAgICAgICAgICAgIGxldCBmc2V4aXN0cyA9IEZTLmV4aXN0c1N5bmMoZnNwYXRoKTtcblxuICAgICAgICAgICAgaWYgKGZzZXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0gRlMuc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFZQYXRoRGF0YT4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogZnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBmc3BhdGg6IGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzTXRpbWU6IHN0YXRzLm10aW1lTXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGdWxmaWxscyB0aGUgXCJmaW5kXCIgb3BlcmF0aW9uIG5vdCBieVxuICAgICAqIGxvb2tpbmcgaW4gdGhlIGRhdGFiYXNlLCBidXQgYnkgc2Nhbm5pbmdcbiAgICAgKiB0aGUgZmlsZXN5c3RlbSB1c2luZyBzeW5jaHJvbm91cyBjYWxscy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfZnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgZmluZFN5bmMoX2ZwYXRoKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcblxuICAgICAgICBpZiAodHlwZW9mIF9mcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZmluZCBwYXJhbWV0ZXIgbm90IHN0cmluZyAke3R5cGVvZiBfZnBhdGh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcGF0aCA9IF9mcGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgbWFwcGVkID0gcmVtYXBkaXJzKHRoaXMuZGlycyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kU3luYyBsb29raW5nIGZvciAke2ZwYXRofSBpbiAke3V0aWwuaW5zcGVjdChtYXBwZWQpfWApO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIG1hcHBlZCkge1xuICAgICAgICAgICAgaWYgKCEoZGlyPy5tb3VudFBvaW50KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgZmluZFN5bmMgYmFkIGRpcnMgaW4gJHt1dGlsLmluc3BlY3QodGhpcy5kaXJzKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy4jZkV4aXN0c0luRGlyKGZwYXRoLCBkaXIpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbmRTeW5jICR7ZnBhdGh9IGZvdW5kYCwgZm91bmQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGFzeW5jIGZpbmRBbGwoKSB7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcblxuICAgICAgICBjb25zdCByZXN1bHQxID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgfSBhcyBGaWx0ZXI8VD4pO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDIgPSByZXN1bHQxLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaW5kQWxsID9pZ25vcmU/ICR7aXRlbS52cGF0aH1gKTtcbiAgICAgICAgICAgIHJldHVybiAhKGZjYWNoZS5pZ25vcmVGaWxlKGl0ZW0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQyO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlc0ZpbGVDYWNoZTxcbiAgICBUIGV4dGVuZHMgTGF5b3V0IHwgUGFydGlhbCxcbiAgICBUZGFvIGV4dGVuZHMgQmFzZURBTzxUPj5cbiAgICBleHRlbmRzIEJhc2VGaWxlQ2FjaGU8VCwgVGRhbz4ge1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkaXJzOiBkaXJUb1dhdGNoW10sXG4gICAgICAgIGRhbzogVGRhb1xuICAgICkge1xuICAgICAgICBzdXBlcihjb25maWcsIG5hbWUsIGRpcnMsIGRhbyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2F0aGVyIHRoZSBhZGRpdGlvbmFsIGRhdGEgc3VpdGFibGVcbiAgICAgKiBmb3IgUGFydGlhbCBhbmQgTGF5b3V0IHRlbXBsYXRlcy4gIFRoZVxuICAgICAqIGZ1bGwgZGF0YSBzZXQgcmVxdWlyZWQgZm9yIERvY3VtZW50cyBpc1xuICAgICAqIG5vdCBzdWl0YWJsZSBmb3IgdGhlIHRlbXBsYXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmZvIFxuICAgICAqL1xuICAgIGdhdGhlckluZm9EYXRhKGluZm8pIHtcblxuICAgICAgICBpbmZvLnJlbmRlclBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICBpbmZvLmRpcm5hbWUgPSBwYXRoLmRpcm5hbWUoaW5mby52cGF0aCk7XG4gICAgICAgIGlmIChpbmZvLmRpcm5hbWUgPT09ICcuJykgaW5mby5kaXJuYW1lID0gJy8nO1xuXG4gICAgICAgIGxldCByZW5kZXJlciA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoaW5mby52cGF0aCk7XG4gICAgICAgIGluZm8ucmVuZGVyZXIgPSByZW5kZXJlcjtcblxuXG4gICAgICAgIGlmIChyZW5kZXJlcikge1xuXG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5wYXJzZU1ldGFkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBVc2luZyA8YW55PiBoZXJlIGNvdmVycyBvdmVyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBwYXJzZU1ldGFkYXRhIHJlcXVpcmVzXG4gICAgICAgICAgICAgICAgLy8gYSBSZW5kZXJpbmdDb250ZXh0IHdoaWNoXG4gICAgICAgICAgICAgICAgLy8gaW4gdHVybiByZXF1aXJlcyBhIFxuICAgICAgICAgICAgICAgIC8vIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgICAgICAgICAgICBjb25zdCByYyA9IHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEoPGFueT57XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogaW5mby5mc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZTLnJlYWRGaWxlU3luYyhpbmZvLmZzcGF0aCwgJ3V0Zi04JylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvY01ldGFkYXRhIGlzIHRoZSB1bm1vZGlmaWVkIG1ldGFkYXRhL2Zyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgLy8gaW4gdGhlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YSA9IHJjLm1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIC8vIGRvY0NvbnRlbnQgaXMgdGhlIHVucGFyc2VkIG9yaWdpbmFsIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAvLyBpbmNsdWRpbmcgYW55IGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NDb250ZW50ID0gcmMuY29udGVudDtcbiAgICAgICAgICAgICAgICAvLyBkb2NCb2R5IGlzIHRoZSBwYXJzZWQgYm9keSAtLSBlLmcuIGZvbGxvd2luZyB0aGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0JvZHkgPSByYy5ib2R5O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY29tcHV0ZWQgbWV0YWRhdGEgdGhhdCBpbmNsdWRlcyBkYXRhIGZyb20gXG4gICAgICAgICAgICAgICAgLy8gc2V2ZXJhbCBzb3VyY2VzXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YSA9IHsgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWluZm8uZG9jTWV0YWRhdGEpIGluZm8uZG9jTWV0YWRhdGEgPSB7fTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbml0TWV0YWRhdGEgJHtiYXNlZGlyfSAke2ZwYXRofSBiYXNlTWV0YWRhdGEgJHtiYXNlTWV0YWRhdGFbeXByb3BdfWApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhW3lwcm9wXSA9IGluZm8uYmFzZU1ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgVGVtcGxhdGVzRmlsZUNhY2hlIGFmdGVyIGdhdGhlckluZm9EYXRhIGAsIGluZm8pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhc3luYyB1cGRhdGVEb2NJbkRCKGluZm8pIHtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8udXBkYXRlKCh7XG4gICAgICAgICAgICB2cGF0aDogaW5mby52cGF0aCxcbiAgICAgICAgICAgIG1pbWU6IGluZm8ubWltZSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IGluZm8ubW91bnRlZCxcbiAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZm8ubW91bnRQb2ludCxcbiAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZm8ucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgIG10aW1lTXM6IG5ldyBEYXRlKGluZm8uc3RhdHNNdGltZSkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGZzcGF0aDogcGF0aC5qb2luKGluZm8ubW91bnRlZCwgaW5mby5wYXRoSW5Nb3VudGVkKSxcbiAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZm8ucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IGluZm8ucmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHBhdGguZGlybmFtZShpbmZvLnJlbmRlclBhdGgpLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIGluZm8sXG4gICAgICAgIH0gYXMgdW5rbm93bikgYXMgVCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbzogYW55KSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLmluc2VydCgoe1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIGRvY01ldGFkYXRhOiBpbmZvLmRvY01ldGFkYXRhLFxuICAgICAgICAgICAgZG9jQ29udGVudDogaW5mby5kb2NDb250ZW50LFxuICAgICAgICAgICAgZG9jQm9keTogaW5mby5kb2NCb2R5LFxuICAgICAgICAgICAgbWV0YWRhdGE6IGluZm8ubWV0YWRhdGEsXG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICB9IGFzIHVua25vd24pIGFzIFQpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERvY3VtZW50c0ZpbGVDYWNoZVxuICAgIGV4dGVuZHMgQmFzZUZpbGVDYWNoZTxEb2N1bWVudCwgVGRvY3VtZW50c3NEQU8+IHtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IENvbmZpZ3VyYXRpb24sXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZGlyczogZGlyVG9XYXRjaFtdXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKGNvbmZpZywgbmFtZSwgZGlycywgZG9jdW1lbnRzREFPKTtcbiAgICB9XG5cbiAgICBnYXRoZXJJbmZvRGF0YShpbmZvKSB7XG5cbiAgICAgICAgaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgaW5mby5kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGluZm8udnBhdGgpO1xuICAgICAgICBpZiAoaW5mby5kaXJuYW1lID09PSAnLicpIGluZm8uZGlybmFtZSA9ICcvJztcbiAgICAgICAgaW5mby5wYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoaW5mby5kaXJuYW1lKTtcblxuICAgICAgICAvLyBmaW5kIHRoZSBtb3VudGVkIGRpcmVjdG9yeSxcbiAgICAgICAgLy8gZ2V0IHRoZSBiYXNlTWV0YWRhdGFcbiAgICAgICAgZm9yIChsZXQgZGlyIG9mIHJlbWFwZGlycyh0aGlzLmRpcnMpKSB7XG4gICAgICAgICAgICBpZiAoZGlyLm1vdW50ZWQgPT09IGluZm8ubW91bnRlZCkge1xuICAgICAgICAgICAgICAgIGlmIChkaXIuYmFzZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8uYmFzZU1ldGFkYXRhID0gZGlyLmJhc2VNZXRhZGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXQgcHVibGljYXRpb25EYXRlIHNvbWVob3dcblxuXG4gICAgICAgIGxldCByZW5kZXJlciA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoaW5mby52cGF0aCk7XG4gICAgICAgIGluZm8ucmVuZGVyZXIgPSByZW5kZXJlcjtcblxuICAgICAgICBpZiAocmVuZGVyZXIpIHtcblxuICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoXG4gICAgICAgICAgICAgICAgPSByZW5kZXJlci5maWxlUGF0aChpbmZvLnZwYXRoKTtcblxuICAgICAgICAgICAgLy8gVGhpcyB3YXMgaW4gdGhlIExva2lKUyBjb2RlLCBidXRcbiAgICAgICAgICAgIC8vIHdhcyBub3QgaW4gdXNlLlxuICAgICAgICAgICAgLy8gaW5mby5yZW5kZXJuYW1lID0gcGF0aC5iYXNlbmFtZShcbiAgICAgICAgICAgIC8vICAgICBpbmZvLnJlbmRlclBhdGhcbiAgICAgICAgICAgIC8vICk7XG5cbiAgICAgICAgICAgIGluZm8ucmVuZGVyc1RvSFRNTCA9IG1pbmltYXRjaChcbiAgICAgICAgICAgICAgICBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgJyoqLyouaHRtbCcpXG4gICAgICAgICAgICA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEpIHtcblxuICAgICAgICAgICAgICAgIC8vIFVzaW5nIDxhbnk+IGhlcmUgY292ZXJzIG92ZXJcbiAgICAgICAgICAgICAgICAvLyB0aGF0IHBhcnNlTWV0YWRhdGEgcmVxdWlyZXNcbiAgICAgICAgICAgICAgICAvLyBhIFJlbmRlcmluZ0NvbnRleHQgd2hpY2hcbiAgICAgICAgICAgICAgICAvLyBpbiB0dXJuIHJlcXVpcmVzIGEgXG4gICAgICAgICAgICAgICAgLy8gbWV0YWRhdGEgb2JqZWN0LlxuICAgICAgICAgICAgICAgIGNvbnN0IHJjID0gcmVuZGVyZXIucGFyc2VNZXRhZGF0YSg8YW55PntcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBpbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogRlMucmVhZEZpbGVTeW5jKGluZm8uZnNwYXRoLCAndXRmLTgnKVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gZG9jTWV0YWRhdGEgaXMgdGhlIHVubW9kaWZpZWQgbWV0YWRhdGEvZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgZG9jdW1lbnRcbiAgICAgICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhID0gcmMubWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgLy8gZG9jQ29udGVudCBpcyB0aGUgdW5wYXJzZWQgb3JpZ2luYWwgY29udGVudFxuICAgICAgICAgICAgICAgIC8vIGluY2x1ZGluZyBhbnkgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgICAgICBpbmZvLmRvY0NvbnRlbnQgPSByYy5jb250ZW50O1xuICAgICAgICAgICAgICAgIC8vIGRvY0JvZHkgaXMgdGhlIHBhcnNlZCBib2R5IC0tIGUuZy4gZm9sbG93aW5nIHRoZSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQm9keSA9IHJjLmJvZHk7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBjb21wdXRlZCBtZXRhZGF0YSB0aGF0IGluY2x1ZGVzIGRhdGEgZnJvbSBcbiAgICAgICAgICAgICAgICAvLyBzZXZlcmFsIHNvdXJjZXNcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhID0geyB9O1xuICAgICAgICAgICAgICAgIGlmICghaW5mby5kb2NNZXRhZGF0YSkgaW5mby5kb2NNZXRhZGF0YSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlc3Qgb2YgdGhpcyBpcyBhZGFwdGVkIGZyb20gdGhlIG9sZCBmdW5jdGlvblxuICAgICAgICAgICAgICAgIC8vIEhUTUxSZW5kZXJlci5uZXdJbml0TWV0YWRhdGFcblxuICAgICAgICAgICAgICAgIC8vIEZvciBzdGFydGVycyB0aGUgbWV0YWRhdGEgaXMgY29sbGVjdGVkIGZyb20gc2V2ZXJhbCBzb3VyY2VzLlxuICAgICAgICAgICAgICAgIC8vIDEpIHRoZSBtZXRhZGF0YSBzcGVjaWZpZWQgaW4gdGhlIGRpcmVjdG9yeSBtb3VudCB3aGVyZVxuICAgICAgICAgICAgICAgIC8vICAgIHRoaXMgZG9jdW1lbnQgd2FzIGZvdW5kXG4gICAgICAgICAgICAgICAgLy8gMikgbWV0YWRhdGEgaW4gdGhlIHByb2plY3QgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgICAgIC8vIDMpIHRoZSBtZXRhZGF0YSBpbiB0aGUgZG9jdW1lbnQsIGFzIGNhcHR1cmVkIGluIGRvY01ldGFkYXRhXG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW5pdE1ldGFkYXRhICR7YmFzZWRpcn0gJHtmcGF0aH0gYmFzZU1ldGFkYXRhICR7YmFzZU1ldGFkYXRhW3lwcm9wXX1gKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSBpbmZvLmJhc2VNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIHRoaXMuY29uZmlnLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gdGhpcy5jb25maWcubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgZm1tY291bnQgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uZG9jTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSBpbmZvLmRvY01ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgZm1tY291bnQrKztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcmVuZGVyZWQgdmVyc2lvbiBvZiB0aGUgY29udGVudCBsYW5kcyBoZXJlXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5jb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAvLyBUaGUgZG9jdW1lbnQgb2JqZWN0IGhhcyBiZWVuIHVzZWZ1bCBmb3IgXG4gICAgICAgICAgICAgICAgLy8gY29tbXVuaWNhdGluZyB0aGUgZmlsZSBwYXRoIGFuZCBvdGhlciBkYXRhLlxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQgPSB7fTtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LmJhc2VkaXIgPSBpbmZvLm1vdW50UG9pbnQ7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZWxwYXRoID0gaW5mby5wYXRoSW5Nb3VudGVkO1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscmVuZGVyID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby5wYXRoSW5Nb3VudGVkKTtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8gPSBpbmZvLnJlbmRlclBhdGg7XG5cbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgdGhlIDxlbT50YWdzPC9lbT4gZmllbGQgaXMgYW4gYXJyYXlcbiAgICAgICAgICAgICAgICBpZiAoIShpbmZvLm1ldGFkYXRhLnRhZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyA9IFtdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIChpbmZvLm1ldGFkYXRhLnRhZ3MpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGFnbGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZSA9IC9cXHMqLFxccyovO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3Muc3BsaXQocmUpLmZvckVhY2godGFnID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ2xpc3QucHVzaCh0YWcudHJpbSgpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncyA9IHRhZ2xpc3Q7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghQXJyYXkuaXNBcnJheShpbmZvLm1ldGFkYXRhLnRhZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGBGT1JNQVQgRVJST1IgLSAke2luZm8udnBhdGh9IGhhcyBiYWRseSBmb3JtYXR0ZWQgdGFncyBgLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YS50YWdzID0gaW5mby5tZXRhZGF0YS50YWdzO1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJvb3QgVVJMIGZvciB0aGUgcHJvamVjdFxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucm9vdF91cmwgPSB0aGlzLmNvbmZpZy5yb290X3VybDtcblxuICAgICAgICAgICAgICAgIC8vIENvbXB1dGUgdGhlIFVSTCB0aGlzIGRvY3VtZW50IHdpbGwgcmVuZGVyIHRvXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLnJvb3RfdXJsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwUm9vdFVybCA9IHVybC5wYXJzZSh0aGlzLmNvbmZpZy5yb290X3VybCk7XG4gICAgICAgICAgICAgICAgICAgIHBSb290VXJsLnBhdGhuYW1lID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKHBSb290VXJsLnBhdGhuYW1lLCBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX3VybCA9IHVybC5mb3JtYXQocFJvb3RVcmwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucmVuZGVyZWRfdXJsID0gaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX2RhdGUgPSBpbmZvLnN0YXRzLm10aW1lO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VQdWJsRGF0ZSA9IChkYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IERhdGUucGFyc2UoZGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghIGlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRlU2V0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAmJiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgZGF0ZVNldCAmJiBpbmZvLm10aW1lTXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUoaW5mby5tdGltZU1zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2luZm8udnBhdGh9IG1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSAke2luZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlfSBzZXQgZnJvbSBzdGF0cy5tdGltZWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25EYXRlID0gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2luZm8udnBhdGh9IG1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSAke2luZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlfSBzZXQgZnJvbSBjdXJyZW50IHRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZURvY0luREIoaW5mbykge1xuICAgICAgICBhd2FpdCB0aGlzLmRhby51cGRhdGUoKHtcbiAgICAgICAgICAgIHZwYXRoOiBpbmZvLnZwYXRoLFxuICAgICAgICAgICAgbWltZTogaW5mby5taW1lLFxuICAgICAgICAgICAgbW91bnRlZDogaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgbW91bnRQb2ludDogaW5mby5tb3VudFBvaW50LFxuICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5mby5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgbXRpbWVNczogbmV3IERhdGUoaW5mby5zdGF0c010aW1lKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZnNwYXRoOiBwYXRoLmpvaW4oaW5mby5tb3VudGVkLCBpbmZvLnBhdGhJbk1vdW50ZWQpLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogaW5mby5yZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgZGlybmFtZTogcGF0aC5kaXJuYW1lKGluZm8ucmVuZGVyUGF0aCksXG4gICAgICAgICAgICBwYXJlbnREaXI6IGluZm8ucGFyZW50RGlyLFxuICAgICAgICAgICAgZG9jTWV0YWRhdGE6IGluZm8uZG9jTWV0YWRhdGEsXG4gICAgICAgICAgICBkb2NDb250ZW50OiBpbmZvLmRvY0NvbnRlbnQsXG4gICAgICAgICAgICBkb2NCb2R5OiBpbmZvLmRvY0JvZHksXG4gICAgICAgICAgICBtZXRhZGF0YTogaW5mby5tZXRhZGF0YSxcbiAgICAgICAgICAgIHRhZ3M6IEFycmF5LmlzQXJyYXkoaW5mby5tZXRhZGF0YT8udGFncylcbiAgICAgICAgICAgICAgICAgICAgPyBpbmZvLm1ldGFkYXRhLnRhZ3NcbiAgICAgICAgICAgICAgICAgICAgOiBbXSxcbiAgICAgICAgICAgIGxheW91dDogaW5mby5tZXRhZGF0YT8ubGF5b3V0LFxuICAgICAgICAgICAgaW5mbyxcbiAgICAgICAgfSBhcyB1bmtub3duKSBhcyBEb2N1bWVudCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIGluc2VydERvY1RvREIoaW5mbzogYW55KSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLmluc2VydCgoe1xuICAgICAgICAgICAgdnBhdGg6IGluZm8udnBhdGgsXG4gICAgICAgICAgICBtaW1lOiBpbmZvLm1pbWUsXG4gICAgICAgICAgICBtb3VudGVkOiBpbmZvLm1vdW50ZWQsXG4gICAgICAgICAgICBtb3VudFBvaW50OiBpbmZvLm1vdW50UG9pbnQsXG4gICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmZvLnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICBtdGltZU1zOiBuZXcgRGF0ZShpbmZvLnN0YXRzTXRpbWUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBmc3BhdGg6IHBhdGguam9pbihpbmZvLm1vdW50ZWQsIGluZm8ucGF0aEluTW91bnRlZCksXG4gICAgICAgICAgICByZW5kZXJQYXRoOiBpbmZvLnJlbmRlclBhdGgsXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiBpbmZvLnJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICBkaXJuYW1lOiBwYXRoLmRpcm5hbWUoaW5mby5yZW5kZXJQYXRoKSxcbiAgICAgICAgICAgIHBhcmVudERpcjogaW5mby5wYXJlbnREaXIsXG4gICAgICAgICAgICBkb2NNZXRhZGF0YTogaW5mby5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgIGRvY0NvbnRlbnQ6IGluZm8uZG9jQ29udGVudCxcbiAgICAgICAgICAgIGRvY0JvZHk6IGluZm8uZG9jQm9keSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiBpbmZvLm1ldGFkYXRhLFxuICAgICAgICAgICAgdGFnczogQXJyYXkuaXNBcnJheShpbmZvLm1ldGFkYXRhPy50YWdzKVxuICAgICAgICAgICAgICAgICAgICA/IGluZm8ubWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAgICA6IFtdLFxuICAgICAgICAgICAgbGF5b3V0OiBpbmZvLm1ldGFkYXRhPy5sYXlvdXQsXG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICB9IGFzIHVua25vd24pIGFzIERvY3VtZW50KTtcbiAgICB9XG5cbiAgICBhc3luYyBpbmRleENoYWluKF9mcGF0aCkge1xuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSkgXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXRoLnBhcnNlKGZwYXRoKTtcblxuICAgICAgICBjb25zdCBmaWxlejogRG9jdW1lbnRbXSA9IFtdO1xuICAgICAgICBjb25zdCBzZWxmID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgICdvcic6IFtcbiAgICAgICAgICAgICAgICB7IHZwYXRoOiB7IGVxOiBmcGF0aCB9IH0sXG4gICAgICAgICAgICAgICAgeyByZW5kZXJQYXRoOiB7IGVxOiBmcGF0aCB9IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGZwYXRoO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmKSAmJiBzZWxmLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICBmaWxlei5wdXNoKHNlbGZbMF0pO1xuICAgICAgICAgICAgZmlsZU5hbWUgPSBzZWxmWzBdLnJlbmRlclBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50RGlyO1xuICAgICAgICBsZXQgZGlyTmFtZSA9IHBhdGguZGlybmFtZShmcGF0aCk7XG4gICAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICAgIHdoaWxlICghKGRpck5hbWUgPT09ICcuJyB8fCBkaXJOYW1lID09PSBwYXJzZWQucm9vdCkpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGVOYW1lKSA9PT0gJ2luZGV4Lmh0bWwnKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShmaWxlTmFtZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnREaXIgPSBwYXRoLmRpcm5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxvb2tGb3IgPSBwYXRoLmpvaW4ocGFyZW50RGlyLCBcImluZGV4Lmh0bWxcIik7XG5cbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgICAgICAnb3InOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgdnBhdGg6IHsgZXE6IGxvb2tGb3IgfSB9LFxuICAgICAgICAgICAgICAgICAgICB7IHJlbmRlclBhdGg6IHsgZXE6IGxvb2tGb3IgfSB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGluZGV4KSAmJiBpbmRleC5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgICAgIGZpbGV6LnB1c2goaW5kZXhbMF0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaWxlTmFtZSA9IGxvb2tGb3I7XG4gICAgICAgICAgICBkaXJOYW1lID0gcGF0aC5kaXJuYW1lKGxvb2tGb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbGV6XG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbihvYmo6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZm91bmREaXIgPSBvYmoubW91bnRQb2ludDtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmZvdW5kUGF0aCA9IG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICBvYmouZmlsZW5hbWUgPSAnLycgKyBvYmoucmVuZGVyUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgYWxsIHRoZSBkb2N1bWVudHMgaW4gdGhlIHNhbWUgZGlyZWN0b3J5XG4gICAgICogYXMgdGhlIG5hbWVkIGZpbGUuXG4gICAgICpcbiAgICAgKiBUaGlzIGRvZXNuJ3QgYXBwZWFyIHRvIGJlIHVzZWQgYW55d2hlcmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2ZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHNpYmxpbmdzKF9mcGF0aCkge1xuICAgICAgICBsZXQgcmV0O1xuICAgICAgICBsZXQgdnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZSh2cGF0aCk7XG4gICAgICAgIC8vIGlmIChkaXJuYW1lID09PSAnLicpIGRpcm5hbWUgPSAnLyc7XG5cbiAgICAgICAgY29uc3Qgc2libGluZ3MgPSBhd2FpdCB0aGlzLmRhby5zZWxlY3RBbGwoe1xuICAgICAgICAgICAgZGlybmFtZTogeyBlcTogZGlybmFtZSB9LFxuICAgICAgICAgICAgLy8gVGhlIHNpYmxpbmdzIGNhbm5vdCBpbmNsdWRlIHRoZSBzZWxmLlxuICAgICAgICAgICAgdnBhdGg6IHsgbmVxOiB2cGF0aCB9LFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogeyBuZXE6IHZwYXRoIH0sXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc2libGluZ3MuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLmlnbm9yZUZpbGUoaXRlbSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB0cmVlIG9mIGl0ZW1zIHN0YXJ0aW5nIGZyb20gdGhlIGRvY3VtZW50XG4gICAgICogbmFtZWQgaW4gX3Jvb3RJdGVtLiAgVGhlIHBhcmFtZXRlciBzaG91bGQgYmUgYW5cbiAgICAgKiBhY3R1YWwgZG9jdW1lbnQgaW4gdGhlIHRyZWUsIHN1Y2ggYXMgYHBhdGgvdG8vaW5kZXguaHRtbGAuXG4gICAgICogVGhlIHJldHVybiBpcyBhIHRyZWUtc2hhcGVkIHNldCBvZiBvYmplY3RzIGxpa2UgdGhlIGZvbGxvd2luZztcbiAgICAgKiBcbiAgdHJlZTpcbiAgICByb290SXRlbTogZm9sZGVyL2ZvbGRlci9pbmRleC5odG1sXG4gICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlclxuICAgIGl0ZW1zOlxuICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWwubWRcbiAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICBjaGlsZEZvbGRlcnM6XG4gICAgICAgIC0gZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgZGlybmFtZTogZm9sZGVyL2ZvbGRlci9mb2xkZXJcbiAgICAgICAgICAgICAgaXRlbXM6XG4gICAgICAgICAgICAgICAgLSB2cGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIvaW5kZXguaHRtbFxuICAgICAgICAgICAgICAgIC0gdnBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWwubWRcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGZvbGRlci9mb2xkZXIvZm9sZGVyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sLm1kXG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlci9wYWdlMi5odG1sXG4gICAgICAgICAgICAgIGNoaWxkRm9sZGVyczogW11cbiAgICAgICAgLSBkaXJuYW1lOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjJcbiAgICAgICAgICBjaGlsZHJlbjpcbiAgICAgICAgICAgICAgcm9vdEl0ZW06IGZvbGRlci9mb2xkZXIvZm9sZGVyMi9pbmRleC5odG1sXG4gICAgICAgICAgICAgIGRpcm5hbWU6IGZvbGRlci9mb2xkZXIvZm9sZGVyMlxuICAgICAgICAgICAgICBpdGVtczpcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvaW5kZXguaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL2luZGV4Lmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTEuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UxLmh0bWxcbiAgICAgICAgICAgICAgICAtIHZwYXRoOiBmb2xkZXIvZm9sZGVyL2ZvbGRlcjIvcGFnZTIuaHRtbC5tZFxuICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogZm9sZGVyL2ZvbGRlci9mb2xkZXIyL3BhZ2UyLmh0bWxcbiAgICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBbXVxuICAgICAqXG4gICAgICogVGhlIG9iamVjdHMgdW5kZXIgYGl0ZW1zYCBhcmUgYWN0dWxseSB0aGUgZnVsbCBEb2N1bWVudCBvYmplY3RcbiAgICAgKiBmcm9tIHRoZSBjYWNoZSwgYnV0IGZvciB0aGUgaW50ZXJlc3Qgb2YgY29tcGFjdG5lc3MgbW9zdCBvZlxuICAgICAqIHRoZSBmaWVsZHMgaGF2ZSBiZWVuIGRlbGV0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX3Jvb3RJdGVtIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGNoaWxkSXRlbVRyZWUoX3Jvb3RJdGVtOiBzdHJpbmcpIHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgY2hpbGRJdGVtVHJlZSAke19yb290SXRlbX1gKTtcblxuICAgICAgICBsZXQgcm9vdEl0ZW0gPSBhd2FpdCB0aGlzLmZpbmQoX3Jvb3RJdGVtLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gX3Jvb3RJdGVtLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogX3Jvb3RJdGVtKTtcbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUocm9vdEl0ZW0udnBhdGgpO1xuICAgICAgICAvLyBQaWNrcyB1cCBldmVyeXRoaW5nIGZyb20gdGhlIGN1cnJlbnQgbGV2ZWwuXG4gICAgICAgIC8vIERpZmZlcnMgZnJvbSBzaWJsaW5ncyBieSBnZXR0aW5nIGV2ZXJ5dGhpbmcuXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgICAgIGRpcm5hbWU6IHsgZXE6IGRpcm5hbWUgfSxcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHRydWVcbiAgICAgICAgfSkgYXMgdW5rbm93bltdIGFzIGFueVtdO1xuXG4gICAgICAgIGNvbnN0IGNoaWxkRm9sZGVycyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChcbiAgICAgICAgICAgIGBTRUxFQ1QgZGlzdGluY3QgZGlybmFtZSBGUk9NIERPQ1VNRU5UU1xuICAgICAgICAgICAgV0hFUkUgcGFyZW50RGlyID0gJyR7ZGlybmFtZX0nYFxuICAgICAgICApIGFzIHVua25vd25bXSBhcyBEb2N1bWVudFtdO1xuXG4gICAgICAgIGNvbnN0IGNmcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGNmIG9mIGNoaWxkRm9sZGVycykge1xuICAgICAgICAgICAgY2ZzLnB1c2goYXdhaXQgdGhpcy5jaGlsZEl0ZW1UcmVlKFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihjZi5kaXJuYW1lLCAnaW5kZXguaHRtbCcpXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByb290SXRlbSxcbiAgICAgICAgICAgIGRpcm5hbWUsXG4gICAgICAgICAgICBpdGVtczogaXRlbXMsXG4gICAgICAgICAgICAvLyBVbmNvbW1lbnQgdGhpcyB0byBnZW5lcmF0ZSBzaW1wbGlmaWVkIG91dHB1dFxuICAgICAgICAgICAgLy8gZm9yIGRlYnVnZ2luZy5cbiAgICAgICAgICAgIC8vIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0pLFxuICAgICAgICAgICAgY2hpbGRGb2xkZXJzOiBjZnNcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGluZGV4IGZpbGVzIChyZW5kZXJzIHRvIGluZGV4Lmh0bWwpXG4gICAgICogd2l0aGluIHRoZSBuYW1lZCBzdWJ0cmVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvb3RQYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIGluZGV4RmlsZXMocm9vdFBhdGg/OiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHJvb3RQID0gcm9vdFBhdGg/LnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyByb290UGF0aD8uc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IHJvb3RQYXRoO1xuXG4gICAgICAgIC8vIE9wdGlvbmFsbHkgYXBwZW5kYWJsZSBzdWItcXVlcnlcbiAgICAgICAgLy8gdG8gaGFuZGxlIHdoZW4gcm9vdFBhdGggaXMgc3BlY2lmaWVkXG4gICAgICAgIGxldCByb290USA9IChcbiAgICAgICAgICAgICAgICB0eXBlb2Ygcm9vdFAgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgJiYgcm9vdFAubGVuZ3RoID49IDFcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgID8gYEFORCAoIHJlbmRlclBhdGggcmVnZXhwICdeJHtyb290UH0nIClgXG4gICAgICAgICAgICA6ICcnO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmRhby5zcWxkYi5hbGwoYFxuICAgICAgICBTRUxFQ1QgKlxuICAgICAgICBGUk9NIERPQ1VNRU5UU1xuICAgICAgICBXSEVSRVxuICAgICAgICAgICAgKCByZW5kZXJzVG9IVE1MID0gdHJ1ZSApXG4gICAgICAgIEFORCAoXG4gICAgICAgICAgICAoIHJlbmRlclBhdGggcmVnZXhwICcvaW5kZXguaHRtbCQnIClcbiAgICAgICAgIE9SICggcmVuZGVyUGF0aCByZWdleHAgJ15pbmRleC5odG1sJCcgKVxuICAgICAgICApXG4gICAgICAgICR7cm9vdFF9XG4gICAgICAgIGApO1xuICAgICAgICBcblxuICAgICAgICAvLyBJdCdzIHByb3ZlZCBkaWZmaWN1bHQgdG8gZ2V0IHRoZSByZWdleHBcbiAgICAgICAgLy8gdG8gd29yayBpbiB0aGlzIG1vZGU6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHJldHVybiBhd2FpdCB0aGlzLnNlYXJjaCh7XG4gICAgICAgIC8vICAgICByZW5kZXJzVG9IVE1MOiB0cnVlLFxuICAgICAgICAvLyAgICAgcmVuZGVycGF0aG1hdGNoOiAvXFwvaW5kZXguaHRtbCQvLFxuICAgICAgICAvLyAgICAgcm9vdFBhdGg6IHJvb3RQYXRoXG4gICAgICAgIC8vIH0pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBGb3IgZXZlcnkgZmlsZSBpbiB0aGUgZG9jdW1lbnRzIGNhY2hlLFxuICAgICAqIHNldCB0aGUgYWNjZXNzIGFuZCBtb2RpZmljYXRpb25zLlxuICAgICAqXG4gICAgICogPz8/Pz8gV2h5IHdvdWxkIHRoaXMgYmUgdXNlZnVsP1xuICAgICAqIEkgY2FuIHNlZSBkb2luZyB0aGlzIGZvciB0aGUgcmVuZGVyZWRcbiAgICAgKiBmaWxlcyBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeS4gIEJ1dCB0aGlzIGlzXG4gICAgICogZm9yIHRoZSBmaWxlcyBpbiB0aGUgZG9jdW1lbnRzIGRpcmVjdG9yaWVzLiA/Pz8/XG4gICAgICovXG4gICAgYXN5bmMgc2V0VGltZXMoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGFvLnNlbGVjdEVhY2goXG4gICAgICAgICAgICAoZXJyLCBtb2RlbCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc2V0dGVyID0gYXN5bmMgKGRhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gRGF0ZS5wYXJzZShkYXRlKTs7XG4gICAgICAgICAgICAgICAgICAgIGlmICghIGlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRwID0gbmV3IERhdGUocGFyc2VkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEZTLnV0aW1lc1N5bmMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwuZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRwXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobW9kZWwuaW5mby5kb2NNZXRhZGF0YVxuICAgICAgICAgICAgICAgICAmJiBtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldHRlcihtb2RlbC5pbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG1vZGVsLmluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgbW9kZWwuaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0dGVyKG1vZGVsLmluZm8uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge30gYXMgV2hlcmU8RG9jdW1lbnQ+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIGRvY3VtZW50cyB3aGljaCBoYXZlIHRhZ3MuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBkb2N1bWVudHNXaXRoVGFncygpIHtcbiAgICAgICAgY29uc3QgZG9jcyA9IG5ldyBBcnJheTxEb2N1bWVudD4oKTtcbiAgICAgICAgYXdhaXQgdGhpcy5kYW8uc2VsZWN0RWFjaChcbiAgICAgICAgICAgIChlcnIsIGRvYykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkb2NcbiAgICAgICAgICAgICAgICAgJiYgZG9jLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIGRvYy5kb2NNZXRhZGF0YS50YWdzXG4gICAgICAgICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgIGRvYy5kb2NNZXRhZGF0YS50YWdzXG4gICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgJiYgZG9jLmRvY01ldGFkYXRhLnRhZ3MubGVuZ3RoID49IDFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jcy5wdXNoKGRvYyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZW5kZXJzVG9IVE1MOiB7IGVxOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgaW5mbzogeyBpc05vdE51bGw6IHRydWUgfVxuICAgICAgICAgICAgfSBhcyBXaGVyZTxEb2N1bWVudD5cbiAgICAgICAgKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhkb2NzKTtcbiAgICAgICAgcmV0dXJuIGRvY3M7XG4gICAgfVxuXG4gICAgYXN5bmMgZG9jdW1lbnRzV2l0aFRhZyh0YWdubTogc3RyaW5nIHwgc3RyaW5nW10pXG4gICAgICAgIDogUHJvbWlzZTxBcnJheTxzdHJpbmc+PlxuICAgIHtcbiAgICAgICAgbGV0IHRhZ3M6IHN0cmluZ1tdO1xuICAgICAgICBpZiAodHlwZW9mIHRhZ25tID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGFncyA9IFsgdGFnbm0gXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHRhZ25tKSkge1xuICAgICAgICAgICAgdGFncyA9IHRhZ25tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudHNXaXRoVGFnIGdpdmVuIGJhZCB0YWdzIGFycmF5ICR7dXRpbC5pbnNwZWN0KHRhZ25tKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgICAgICBTRUxFQ1RcbiAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICBqc29uX2V4dHJhY3QoZG9jTWV0YWRhdGEsICckLnRhZ3MnKSBhcyB0YWdzXG4gICAgICAgICAgICBGUk9NIERPQ1VNRU5UU1xuICAgICAgICBgKSBhcyB1bmtub3duIGFzIEFycmF5PHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICB0YWdzOiBzdHJpbmdbXVxuICAgICAgICB9PjtcblxuICAgICAgICBjb25zdCB2cGF0aHMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJlcykge1xuICAgICAgICAgICAgaWYgKCEoJ3RhZ3MnIGluIGl0ZW0pKSBjb250aW51ZTtcbiAgICAgICAgICAgIGxldCB0YWdzUCA9IFtdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLnRhZ3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGFnc1AgPSBKU09OLnBhcnNlKGl0ZW0udGFncyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaXRlbS50YWdzKSkge1xuICAgICAgICAgICAgICAgIHRhZ3NQID0gaXRlbS50YWdzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRhZyBvZiB0YWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NQLmluY2x1ZGVzKHRhZykpIHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGhzLnB1c2goaXRlbS52cGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2cGF0aHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFuIGFycmF5IG9mIHRhZ3MgdXNlZCBieSBhbGwgZG9jdW1lbnRzLlxuICAgICAqIFRoaXMgdXNlcyB0aGUgSlNPTiBleHRlbnNpb24gdG8gZXh0cmFjdFxuICAgICAqIHRoZSB0YWdzIGZyb20gdGhlIG1ldGFkYXRhIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHRhZ3MoKSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuZGFvLnNxbGRiLmFsbChgXG4gICAgICAgICAgICBTRUxFQ1RcbiAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICBqc29uX2V4dHJhY3QoZG9jTWV0YWRhdGEsICckLnRhZ3MnKSBhcyB0YWdzXG4gICAgICAgICAgICBGUk9NIERPQ1VNRU5UU1xuICAgICAgICBgKSBhcyB1bmtub3duIGFzIEFycmF5PHtcbiAgICAgICAgICAgIHZwYXRoOiBzdHJpbmcsXG4gICAgICAgICAgICB0YWdzOiBzdHJpbmdbXVxuICAgICAgICB9PjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXMpO1xuXG4gICAgICAgIC8vIFRoZSBxdWVyeSBhYm92ZSBwcm9kdWNlcyB0aGlzIHJlc3VsdDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8ge1xuICAgICAgICAvLyAgICAgdnBhdGg6ICd0YWdzLWFycmF5Lmh0bWwubWQnLFxuICAgICAgICAvLyAgICAgdGFnczogJ1tcIlRhZzFcIixcIlRhZzJcIixcIlRhZzNcIl0nXG4gICAgICAgIC8vIH0sXG4gICAgICAgIC8vIHtcbiAgICAgICAgLy8gICAgIHZwYXRoOiAndGFncy1zdHJpbmcuaHRtbC5tZCcsXG4gICAgICAgIC8vICAgICB0YWdzOiAnW1wiVGFnLXN0cmluZy0xXCIsXCJUYWctc3RyaW5nLTJcIixcIlRhZy1zdHJpbmctM1wiXSdcbiAgICAgICAgLy8gfVxuICAgICAgICAvL1xuICAgICAgICAvLyBJbiBvdGhlciB3b3JkcywgdGhlIHRhZ3MgYXJyYXkgYXJyaXZlc1xuICAgICAgICAvLyBhcyBKU09OIHdoaWNoIHdlIG11c3QgcGFyc2UuXG5cbiAgICAgICAgY29uc3QgdGFncyA9IG5ldyBTZXQoKTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJlcykge1xuICAgICAgICAgICAgaWYgKCEoJ3RhZ3MnIGluIGl0ZW0pKSBjb250aW51ZTtcbiAgICAgICAgICAgIGxldCB0YWdzUCA9IFtdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLnRhZ3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGFnc1AgPSBKU09OLnBhcnNlKGl0ZW0udGFncyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaXRlbS50YWdzKSkge1xuICAgICAgICAgICAgICAgIHRhZ3NQID0gaXRlbS50YWdzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgdGFnc1ApIHtcbiAgICAgICAgICAgICAgICB0YWdzLmFkZCh0YWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIFNldCBjbGFzcyBtYWRlIHN1cmUgdG8gd2VlZCBvdXRcbiAgICAgICAgLy8gZHVwbGljYXRlIHRhZ3MuICBXaXRoIEFycmF5LmZyb21cbiAgICAgICAgLy8gd2UgY2FuIG1ha2UgdGhlIHNldCBpbnRvIGFuIGFycmF5XG4gICAgICAgIC8vIHdoaWNoIGNhbiBiZSBzb3J0ZWQuXG4gICAgICAgIGNvbnN0IHJldCA9IEFycmF5LmZyb20odGFncyk7XG4gICAgICAgIHJldHVybiByZXQuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHZhciB0YWdBID0gYS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIHRhZ0IgPSBiLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAodGFnQSA8IHRhZ0IpIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmICh0YWdBID4gdGFnQikgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIGRhdGEgZm9yIGFuIGludGVybmFsIGxpbmtcbiAgICAgKiB3aXRoaW4gdGhlIHNpdGUgZG9jdW1lbnRzLiAgRm9ybWluZyBhblxuICAgICAqIGludGVybmFsIGxpbmsgaXMgYXQgYSBtaW5pbXVtIHRoZSByZW5kZXJlZFxuICAgICAqIHBhdGggZm9yIHRoZSBkb2N1bWVudCBhbmQgaXRzIHRpdGxlLlxuICAgICAqIFRoZSB0ZWFzZXIsIGlmIGF2YWlsYWJsZSwgY2FuIGJlIHVzZWQgaW5cbiAgICAgKiBhIHRvb2x0aXAuIFRoZSB0aHVtYm5haWwgaXMgYW4gaW1hZ2UgdGhhdFxuICAgICAqIGNvdWxkIGJlIGRpc3BsYXllZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBhc3luYyBkb2NMaW5rRGF0YSh2cGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG5cbiAgICAgICAgLy8gVGhlIHZwYXRoIHJlZmVyZW5jZVxuICAgICAgICB2cGF0aDogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgcGF0aCBpdCByZW5kZXJzIHRvXG4gICAgICAgIHJlbmRlclBhdGg6IHN0cmluZztcbiAgICAgICAgLy8gVGhlIHRpdGxlIHN0cmluZyBmcm9tIHRoYXQgcGFnZVxuICAgICAgICB0aXRsZTogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgdGVhc2VyIHRleHQgZnJvbSB0aGF0IHBhZ2VcbiAgICAgICAgdGVhc2VyPzogc3RyaW5nO1xuICAgICAgICAvLyBUaGUgaGVybyBpbWFnZSAodGh1bWJuYWlsKVxuICAgICAgICB0aHVtYm5haWw/OiBzdHJpbmc7XG4gICAgfT4ge1xuICAgICAgICBjb25zdCBkb2NJbmZvID0gYXdhaXQgdGhpcy5maW5kKHZwYXRoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgcmVuZGVyUGF0aDogZG9jSW5mby5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgdGl0bGU6IGRvY0luZm8ubWV0YWRhdGEudGl0bGUsXG4gICAgICAgICAgICB0ZWFzZXI6IGRvY0luZm8ubWV0YWRhdGEudGVhc2VyLFxuICAgICAgICAgICAgLy8gdGh1bWJuYWlsXG4gICAgICAgIH07XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtIGRlc2NyaXB0aXZlIHNlYXJjaCBvcGVyYXRpb25zXG4gICAgICogd2l0aCBtYW55IG9wdGlvbnMuICBUaGV5IGFyZSBjb252ZXJ0ZWRcbiAgICAgKiBpbnRvIGEgc2VsZWN0QWxsIHN0YXRlbWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHNlYXJjaChvcHRpb25zKTogUHJvbWlzZTxBcnJheTxEb2N1bWVudD4+IHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoIGAsIG9wdGlvbnMpO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IHZwYXRoc1NlZW4gPSBuZXcgU2V0KCk7XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB7fSBhcyBhbnk7XG4gICAgICAgIGlmIChvcHRpb25zLm1pbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yLm1pbWUgPSB7XG4gICAgICAgICAgICAgICAgICAgIGVxOiBvcHRpb25zLm1pbWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMubWltZSkpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rvci5taW1lID0ge1xuICAgICAgICAgICAgICAgICAgICBpbjogb3B0aW9ucy5taW1lXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gLyogZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbmNvcnJlY3QgTUlNRSBjaGVjayAke29wdGlvbnMubWltZX1gKTtcbiAgICAgICAgICAgIH0gKi9cbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2Ygb3B0aW9ucy5yZW5kZXJzVG9IVE1MID09PSAnYm9vbGVhbidcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBzZWxlY3Rvci5yZW5kZXJzVG9IVE1MID0ge1xuICAgICAgICAgICAgICAgIGVxOiBvcHRpb25zLnJlbmRlcnNUb0hUTUxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnM/LnJvb3RQYXRoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc2VsZWN0b3IucmVuZGVyUGF0aCA9IHtcbiAgICAgICAgICAgICAgICBpc0xpa2U6IGAke29wdGlvbnMucm9vdFBhdGh9JWBcbiAgICAgICAgICAgICAgICAvLyBzcWw6IGAgcmVuZGVyUGF0aCBsaWtlICcke29wdGlvbnMucm9vdFBhdGh9JScgYFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVnZXhTUUwgPSB7XG4gICAgICAgICAgICBvcjogW11cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMucGF0aG1hdGNoID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgIHNxbDogYCB2cGF0aCByZWdleHAgJyR7b3B0aW9ucy5wYXRobWF0Y2h9JyBgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIG9wdGlvbnMucGF0aG1hdGNoIGluc3RhbmNlb2YgUmVnRXhwXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmVnZXhTUUwub3IucHVzaCh7XG4gICAgICAgICAgICAgICAgc3FsOiBgIHZwYXRoIHJlZ2V4cCAnJHtvcHRpb25zLnBhdGhtYXRjaC5zb3VyY2V9JyBgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBvcHRpb25zLnBhdGhtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3FsOiBgIHZwYXRoIHJlZ2V4cCAnJHttYXRjaH0nIGBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNxbDogYCB2cGF0aCByZWdleHAgJyR7bWF0Y2guc291cmNlfScgYFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHBhdGhtYXRjaCByZWdleHAgJHt1dGlsLmluc3BlY3QobWF0Y2gpfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgncGF0aG1hdGNoJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAvLyBUaGVyZSdzIGEgcGF0aG1hdGNoIGZpZWxkLCB0aGF0XG4gICAgICAgICAgICAvLyBpc24ndCBjb3JyZWN0XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBFUlJPUiBpbnZhbGlkIHBhdGhtYXRjaCAke3V0aWwuaW5zcGVjdChvcHRpb25zLnBhdGhtYXRjaCl9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5sYXlvdXRzKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmxheW91dHMpXG4gICAgICAgICAgICAgJiYgb3B0aW9ucy5sYXlvdXRzLmxlbmd0aCA+PSAyXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGxheW91dCBvZiBvcHRpb25zLmxheW91dHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXhTUUwub3IucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXlvdXQ6IHsgZXE6IGxheW91dCB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmxheW91dClcbiAgICAgICAgICAgICAmJiBvcHRpb25zLmxheW91dHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rvci5sYXlvdXQgPSB7IGVxOiBvcHRpb25zLmxheW91dHNbMF0gfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3IubGF5b3V0ID0geyBlcTogb3B0aW9ucy5sYXlvdXRzIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdHRlbXB0aW5nIHRvIGRvIHRoZSBmb2xsb3dpbmc6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIHNxbGl0ZT4gc2VsZWN0IHZwYXRoLCByZW5kZXJQYXRoIGZyb20gRE9DVU1FTlRTIHdoZXJlIHJlbmRlclBhdGggcmVnZXhwICcvaW5kZXguaHRtbCQnO1xuICAgICAgICAvLyBoaWVyLWJyb2tlL2RpcjEvZGlyMi9pbmRleC5odG1sLm1kfGhpZXItYnJva2UvZGlyMS9kaXIyL2luZGV4Lmh0bWxcbiAgICAgICAgLy8gaGllci9kaXIxL2RpcjIvaW5kZXguaHRtbC5tZHxoaWVyL2RpcjEvZGlyMi9pbmRleC5odG1sXG4gICAgICAgIC8vIGhpZXIvZGlyMS9pbmRleC5odG1sLm1kfGhpZXIvZGlyMS9pbmRleC5odG1sXG4gICAgICAgIC8vIGhpZXIvaW1nZGlyL2luZGV4Lmh0bWwubWR8aGllci9pbWdkaXIvaW5kZXguaHRtbFxuICAgICAgICAvLyBoaWVyL2luZGV4Lmh0bWwubWR8aGllci9pbmRleC5odG1sXG4gICAgICAgIC8vIHN1YmRpci9pbmRleC5odG1sLm1kfHN1YmRpci9pbmRleC5odG1sXG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoID09PSAnc3RyaW5nJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlZ2V4U1FMLm9yLnB1c2goe1xuICAgICAgICAgICAgICAgIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnJHtvcHRpb25zLnJlbmRlcnBhdGhtYXRjaH0nIGBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggaW5zdGFuY2VvZiBSZWdFeHBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICBzcWw6IGAgcmVuZGVyUGF0aCByZWdleHAgJyR7b3B0aW9ucy5yZW5kZXJwYXRobWF0Y2guc291cmNlfScgYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnJHttYXRjaH0nIGBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgICAgICByZWdleFNRTC5vci5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNxbDogYCByZW5kZXJQYXRoIHJlZ2V4cCAnJHttYXRjaC5zb3VyY2V9JyBgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoIHJlZ2V4cCAke3V0aWwuaW5zcGVjdChtYXRjaCl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCdyZW5kZXJwYXRobWF0Y2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIEVSUk9SIGludmFsaWQgcmVuZGVycGF0aG1hdGNoICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMucGF0aG1hdGNoKX1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVnZXhTUUwub3IubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLm9yID0gcmVnZXhTUUwub3I7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhzZWxlY3Rvcik7XG5cbiAgICAgICAgLy8gU2VsZWN0IGJhc2VkIG9uIHRoaW5ncyB3ZSBjYW4gcXVlcnlcbiAgICAgICAgLy8gZGlyZWN0bHkgZnJvbSAgdGhlIERvY3VtZW50IG9iamVjdC5cbiAgICAgICAgbGV0IHJlc3VsdDE7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQxID0gYXdhaXQgdGhpcy5kYW8uc2VsZWN0QWxsKHNlbGVjdG9yKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRzRmlsZUNhY2hlLnNlYXJjaCBjYXVnaHQgZXJyb3IgaW4gc2VsZWN0QWxsIHdpdGggc2VsZWN0b3IgJHt1dGlsLmluc3BlY3Qoc2VsZWN0b3IpfSAtICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgc2VhcmNoIG9wdGlvbnMgaW5jbHVkZSBsYXlvdXQocylcbiAgICAgICAgLy8gd2UgY2hlY2sgZG9jTWV0YWRhdGEubGF5b3V0XG4gICAgICAgIC8vIE5PVyBNT1ZFRCBBQk9WRVxuICAgICAgICBjb25zdCByZXN1bHQyID0gcmVzdWx0MTtcblxuICAgICAgICAvLyBDaGVjayBmb3IgbWF0Y2ggYWdhaW5zdCB0YWdzXG4gICAgICAgIGNvbnN0IHJlc3VsdDMgPSBcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRhZ1xuICAgICAgICAgICAgICAgICYmIHR5cGVvZiBvcHRpb25zLnRhZyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICkgPyByZXN1bHQyLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS52cGF0aFxuICAgICAgICAgICAgICAgICAmJiBpdGVtLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIGl0ZW0uZG9jTWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KGl0ZW0uZG9jTWV0YWRhdGEudGFncylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uZG9jTWV0YWRhdGEudGFncy5pbmNsdWRlcyhvcHRpb25zLnRhZykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICA6IHJlc3VsdDI7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0NCA9IHJlc3VsdDM7XG4gICAgICAgICAgICAvLyAoXG4gICAgICAgICAgICAvLyAgICAgb3B0aW9ucy5yb290UGF0aFxuICAgICAgICAgICAgLy8gICYmIHR5cGVvZiBvcHRpb25zLnJvb3RQYXRoID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgLy8gKSA/IHJlc3VsdDMuZmlsdGVyKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gICAgIGlmIChpdGVtLnZwYXRoXG4gICAgICAgICAgICAvLyAgICAgICYmIGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgLy8gICAgICkge1xuICAgICAgICAgICAgLy8gICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoICR7aXRlbS52cGF0aH0gJHtpdGVtLnJlbmRlclBhdGh9ICR7b3B0aW9ucy5yb290UGF0aH1gKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgaWYgKGl0ZW0ucmVuZGVyUGF0aC5zdGFydHNXaXRoKG9wdGlvbnMucm9vdFBhdGgpKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgLy8gOiByZXN1bHQzO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDUgPVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZ2xvYlxuICAgICAgICAgICAgICYmIHR5cGVvZiBvcHRpb25zLmdsb2IgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICApID8gcmVzdWx0NC5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0udnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1pbmltYXRjaChpdGVtLnZwYXRoLCBvcHRpb25zLmdsb2IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ0O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDYgPVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyZ2xvYlxuICAgICAgICAgICAgJiYgdHlwZW9mIG9wdGlvbnMucmVuZGVyZ2xvYiA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICkgPyByZXN1bHQ1LmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5yZW5kZXJQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtaW5pbWF0Y2goaXRlbS5yZW5kZXJQYXRoLCBvcHRpb25zLnJlbmRlcmdsb2IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ1O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDcgPVxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyZXJzXG4gICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zLnJlbmRlcmVycylcbiAgICAgICAgICAgICkgPyByZXN1bHQ2LmZpbHRlcihpdGVtID0+IHtcblxuICAgICAgICAgICAgICAgIGxldCByZW5kZXJlciA9IGZjYWNoZS5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpdGVtLnZwYXRoKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyZXIgZm9yICR7b2JqLnZwYXRofSBgLCByZW5kZXJlcik7XG4gICAgICAgICAgICAgICAgaWYgKCFyZW5kZXJlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCByIG9mIG9wdGlvbnMucmVuZGVyZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGVjayByZW5kZXJlciAke3R5cGVvZiByfSAke3JlbmRlcmVyLm5hbWV9ICR7cmVuZGVyZXIgaW5zdGFuY2VvZiByfWApO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAmJiByID09PSByZW5kZXJlci5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHIgPT09ICdvYmplY3QnXG4gICAgICAgICAgICAgICAgICAgICB8fCB0eXBlb2YgciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignV0FSTklORzogTWF0Y2hpbmcgcmVuZGVyZXIgYnkgb2JqZWN0IGNsYXNzIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnLCByKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ2O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdDggPVxuICAgICAgICAgICAgKG9wdGlvbnMuZmlsdGVyZnVuYylcbiAgICAgICAgICAgID8gcmVzdWx0Ny5maWx0ZXIoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZmlsdGVyZnVuYyhcbiAgICAgICAgICAgICAgICAgICAgZmNhY2hlLmNvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgOiByZXN1bHQ3O1xuXG4gICAgICAgIFxuICAgICAgICBsZXQgcmVzdWx0OSA9IHJlc3VsdDg7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBvcHRpb25zLnNvcnRCeSA9PT0gJ3N0cmluZydcbiAgICAgICAgICYmIChcbiAgICAgICAgICAgICBvcHRpb25zLnNvcnRCeSA9PT0gJ3B1YmxpY2F0aW9uRGF0ZSdcbiAgICAgICAgICB8fCBvcHRpb25zLnNvcnRCeSA9PT0gJ3B1YmxpY2F0aW9uVGltZSdcbiAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXN1bHQ5ID0gcmVzdWx0OC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGFEYXRlID0gYS5tZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICYmIGEubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgID8gbmV3IERhdGUoYS5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpXG4gICAgICAgICAgICAgICAgICAgIDogbmV3IERhdGUoYS5tdGltZU1zKTtcbiAgICAgICAgICAgICAgICBsZXQgYkRhdGUgPSBiLm1ldGFkYXRhIFxuICAgICAgICAgICAgICAgICAgICAgICAgICYmIGIubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgICAgID8gbmV3IERhdGUoYi5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpXG4gICAgICAgICAgICAgICAgICAgIDogbmV3IERhdGUoYi5tdGltZU1zKTtcbiAgICAgICAgICAgICAgICBpZiAoYURhdGUgPT09IGJEYXRlKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBpZiAoYURhdGUgPiBiRGF0ZSkgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIGlmIChhRGF0ZSA8IGJEYXRlKSByZXR1cm4gMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMuc29ydEJ5ID09PSAnc3RyaW5nJ1xuICAgICAgICAgJiYgb3B0aW9ucy5zb3J0QnkgPT09ICdkaXJuYW1lJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIHJlc3VsdDkgPSByZXN1bHQ4LnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYS5kaXJuYW1lID09PSBiLmRpcm5hbWUpIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGlmIChhLmRpcm5hbWUgPCBiLmRpcm5hbWUpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICBpZiAoYS5kaXJuYW1lID4gYi5kaXJuYW1lKSByZXR1cm4gMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdDlhID0gcmVzdWx0OTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNvcnRGdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXN1bHQ5YSA9IHJlc3VsdDkuc29ydChvcHRpb25zLnNvcnRGdW5jKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQxMCA9IHJlc3VsdDlhO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2Ygb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nID09PSAnYm9vbGVhbidcbiAgICAgICAgIHx8IHR5cGVvZiBvcHRpb25zLnJldmVyc2UgPT09ICdib29sZWFuJ1xuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nID09PSAnYm9vbGVhbidcbiAgICAgICAgICAgICAmJiBvcHRpb25zLnNvcnRCeURlc2NlbmRpbmdcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHJlc3VsdDEwID0gcmVzdWx0OWEucmV2ZXJzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJldmVyc2UgPT09ICdib29sZWFuJ1xuICAgICAgICAgICAgICYmIG9wdGlvbnMucmV2ZXJzZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0MTAgPSByZXN1bHQ5YS5yZXZlcnNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzdWx0MTEgPSByZXN1bHQxMDtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJlc3VsdDExID0gcmVzdWx0MTAuc2xpY2Uob3B0aW9ucy5vZmZzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdDEyID0gcmVzdWx0MTE7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5saW1pdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJlc3VsdDEyID0gcmVzdWx0MTEuc2xpY2UoXG4gICAgICAgICAgICAgICAgMCwgb3B0aW9ucy5saW1pdCAtIDFcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0MTI7XG4gICAgfVxuXG4gICAgLy8gU2tpcCB0YWdzIGZvciBub3cuICBTaG91bGQgYmUgZWFzeS5cblxuICAgIC8vIEZvciB0YWdzIHN1cHBvcnQsIHRoaXMgY2FuIGJlIHVzZWZ1bFxuICAgIC8vICAtLSBodHRwczovL2FudG9uei5vcmcvanNvbi12aXJ0dWFsLWNvbHVtbnMvXG4gICAgLy8gSXQgc2hvd3MgaG93IHRvIGRvIGdlbmVyYXRlZCBjb2x1bW5zXG4gICAgLy8gZnJvbSBmaWVsZHMgaW4gSlNPTlxuXG4gICAgLy8gQnV0LCBob3cgdG8gZG8gZ2VuZXJhdGVkIGNvbHVtbnNcbiAgICAvLyB1c2luZyBTUUxJVEUzT1JNP1xuXG4gICAgLy8gaHR0cHM6Ly9hbnRvbnoub3JnL3NxbGVhbi1yZWdleHAvIC0tIFJlZ0V4cFxuICAgIC8vIGV4dGVuc2lvbiBmb3IgU1FMSVRFM1xuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FzZzAxNy9zcWxpdGUtcmVnZXggaW5jbHVkZXNcbiAgICAvLyBhIG5vZGUuanMgcGFja2FnZVxuICAgIC8vIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL3NxbGl0ZS1yZWdleFxufVxuXG5leHBvcnQgdmFyIGFzc2V0c0NhY2hlOiBCYXNlRmlsZUNhY2hlPCBBc3NldCwgdHlwZW9mIGFzc2V0c0RBTz47XG5leHBvcnQgdmFyIHBhcnRpYWxzQ2FjaGU6IFRlbXBsYXRlc0ZpbGVDYWNoZTxQYXJ0aWFsLCB0eXBlb2YgcGFydGlhbHNEQU8+O1xuZXhwb3J0IHZhciBsYXlvdXRzQ2FjaGU6IFRlbXBsYXRlc0ZpbGVDYWNoZTxMYXlvdXQsIHR5cGVvZiBsYXlvdXRzREFPPjtcbmV4cG9ydCB2YXIgZG9jdW1lbnRzQ2FjaGU6IERvY3VtZW50c0ZpbGVDYWNoZTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvblxuKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICBhc3NldHNDYWNoZSA9IG5ldyBCYXNlRmlsZUNhY2hlPEFzc2V0LCBUYXNzZXRzREFPPihcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAnYXNzZXRzJyxcbiAgICAgICAgY29uZmlnLmFzc2V0RGlycyxcbiAgICAgICAgYXNzZXRzREFPXG4gICAgKTtcbiAgICBhd2FpdCBhc3NldHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgYXNzZXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIHBhcnRpYWxzQ2FjaGUgPSBuZXcgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgICAgICAgICAgUGFydGlhbCwgVHBhcnRpYWxzREFPXG4gICAgPihcbiAgICAgICAgY29uZmlnLFxuICAgICAgICAncGFydGlhbHMnLFxuICAgICAgICBjb25maWcucGFydGlhbHNEaXJzLFxuICAgICAgICBwYXJ0aWFsc0RBT1xuICAgICk7XG4gICAgYXdhaXQgcGFydGlhbHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgcGFydGlhbHNDYWNoZS5vbignZXJyb3InLCAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsc0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICBsYXlvdXRzQ2FjaGUgPSBuZXcgVGVtcGxhdGVzRmlsZUNhY2hlPFxuICAgICAgICAgICAgTGF5b3V0LCBUbGF5b3V0c0RBT1xuICAgID4oXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgJ2xheW91dHMnLFxuICAgICAgICBjb25maWcubGF5b3V0RGlycyxcbiAgICAgICAgbGF5b3V0c0RBT1xuICAgICk7XG4gICAgYXdhaXQgbGF5b3V0c0NhY2hlLnNldHVwKCk7XG5cbiAgICBsYXlvdXRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0c0NhY2hlIEVSUk9SICR7dXRpbC5pbnNwZWN0KGFyZ3MpfWApXG4gICAgfSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhgRG9jdW1lbnRzRmlsZUNhY2hlICdkb2N1bWVudHMnICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5kb2N1bWVudERpcnMpfWApO1xuXG4gICAgZG9jdW1lbnRzQ2FjaGUgPSBuZXcgRG9jdW1lbnRzRmlsZUNhY2hlKFxuICAgICAgICBjb25maWcsXG4gICAgICAgICdkb2N1bWVudHMnLFxuICAgICAgICBjb25maWcuZG9jdW1lbnREaXJzXG4gICAgKTtcbiAgICBhd2FpdCBkb2N1bWVudHNDYWNoZS5zZXR1cCgpO1xuXG4gICAgZG9jdW1lbnRzQ2FjaGUub24oJ2Vycm9yJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgZG9jdW1lbnRzQ2FjaGUgRVJST1IgJHt1dGlsLmluc3BlY3QoYXJncyl9YClcbiAgICB9KTtcblxuICAgIGF3YWl0IGNvbmZpZy5ob29rUGx1Z2luQ2FjaGVTZXR1cCgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VGaWxlQ2FjaGVzKCkge1xuICAgIGlmIChkb2N1bWVudHNDYWNoZSkge1xuICAgICAgICBhd2FpdCBkb2N1bWVudHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBkb2N1bWVudHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGFzc2V0c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGFzc2V0c0NhY2hlLmNsb3NlKCk7XG4gICAgICAgIGFzc2V0c0NhY2hlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAobGF5b3V0c0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IGxheW91dHNDYWNoZS5jbG9zZSgpO1xuICAgICAgICBsYXlvdXRzQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChwYXJ0aWFsc0NhY2hlKSB7XG4gICAgICAgIGF3YWl0IHBhcnRpYWxzQ2FjaGUuY2xvc2UoKTtcbiAgICAgICAgcGFydGlhbHNDYWNoZSA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG4iXX0=