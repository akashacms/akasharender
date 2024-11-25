/**
 *
 * Copyright 2014-2022 David Herron
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
import loki from 'lokijs';
import { DirsWatcher } from '@akashacms/stacked-dirs';
import path from 'path';
import util from 'util';
import url from 'url';
import { promises as fs } from 'fs';
import FS from 'fs';
import EventEmitter from 'events';
import { minimatch } from 'minimatch';
import fastq from 'fastq';
var db; // Use to hold the LokiJS database object
var coll_documents;
var coll_assets;
var coll_layouts;
var coll_partials;
export async function setup(config) {
    try {
        // console.log(`cache setup ${config.cacheDir}`);
        db = new loki('akasharender', {
            autosave: config.cacheAutosave,
            autoload: config.cacheAutoload,
            // verbose: true
        });
        coll_documents = getCollection('documents');
        // if (!coll_documents) coll_documents = db.addCollection('documents');
        coll_assets = getCollection('assets');
        // if (!coll_assets) coll_assets = db.addCollection('assets');
        coll_layouts = getCollection('layouts');
        // if (!coll_layouts) coll_layouts = db.addCollection('layouts');
        coll_partials = getCollection('partials');
        // if (!coll_partials) coll_partials = db.addCollection('partials');
        // console.log(`filecache setup documents ${util.inspect(config.documentDirs)}`);
        await setupDocuments(config);
        await config.hookPluginCacheSetup();
        // console.log(`filecache setup assets ${util.inspect(config.assetDirs)}`);
        await setupAssets(config);
        // console.log(`filecache setup layouts ${util.inspect(config.layoutDirs)}`);
        await setupLayouts(config);
        // console.log(`filecache setup partials ${util.inspect(config.partialsDirs)}`);
        await setupPartials(config);
        // console.log(`filecache setup finished`);
    }
    catch (err) {
        console.error(`cache-lokijs setup FAIL TO INITIALIZE `, err);
        throw err;
    }
}
export async function close() {
    await closeFileCaches();
    db.close();
    db = undefined;
}
export function getCollection(coll_name) {
    let coll = db.getCollection(coll_name);
    if (!coll) {
        coll = db.addCollection(coll_name, {
            disableMeta: true,
            indices: [
                'vpath', 'renderPath', 'basedir', 'mountPoint', 'mounted',
                'dirname'
            ]
        });
    }
    return coll;
}
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
/*
 * NOTICE there are handlers for `error` events here.
 * I was not able to come up with a method to automatically detect
 * if an error event is thrown from a FileCache instance.
 *
 * The test suite for this is in `bad-formatting.js` and the goal is to
 * run those tests, automatically determining that the error is found.
 * But these setup functions are not directly called in that test case.
 * Do we rewrite the test case to call the functions in `cacheSetupComplete`
 * and set up error handlers to ensure the error is emitted?
 *
 * Unless we do something like that, testing this feature will require a
 * manual run of the bad-formatting tests.
 */
export var documents;
export var assets;
export var layouts;
export var partials;
export async function setupDocuments(config) {
    try {
        // console.log(`filecache setup documents ${util.inspect(config)}`);
        // console.log(`filecache setup documents ${util.inspect(config.documentDirs)}`);
        // console.log(typeof config.documentDirs);
        const docsDirs = remapdirs(config.documentDirs);
        // console.log(`setupDocuments `, docsDirs);
        documents = new FileCache(config, docsDirs, 'documents');
        documents.mapRenderPath = true;
        documents.on('error', err => {
            console.error(`ERROR in documents `, err);
        });
        // console.log(`FILECACHE setupDocuments ${util.inspect(config.documentDirs)} ${util.inspect(docsDirs)}`)
        await documents.setup();
        await config.hookFileCacheSetup('documents', documents);
        // console.log(`filecache FINISH documents setup`);
    }
    catch (err) {
        console.error(`file-cache setupDocuments FAIL TO INITIALIZE `, err);
        throw err;
    }
}
export async function setupAssets(config) {
    try {
        // console.log(`filecache setup assets ${util.inspect(config.assetDirs)}`);
        const assetsDirs = remapdirs(config.assetDirs);
        // console.log(`filecache setup assets ${util.inspect(assetsDirs)}`);
        assets = new FileCache(config, assetsDirs, 'assets');
        assets.on('error', err => {
            console.error(`ERROR in assets `, err);
        });
        await assets.setup();
        await config.hookFileCacheSetup('assets', assets);
        // console.log(`filecache FINISH assets setup`);
    }
    catch (err) {
        console.error(`file-cache setupAssets FAIL TO INITIALIZE `, err);
        throw err;
    }
}
export async function setupLayouts(config) {
    try {
        // console.log(`filecache setup layouts ${util.inspect(config.documentDirs)}`);
        const layoutDirs = remapdirs(config.layoutDirs);
        layouts = new FileCache(config, layoutDirs, 'layouts');
        layouts.on('error', err => {
            console.error(`ERROR in layouts `, err);
        });
        layouts.cacheContent = true;
        await layouts.setup();
        await config.hookFileCacheSetup('layouts', layouts);
        // console.log(`filecache FINISH layouts setup`);
    }
    catch (err) {
        console.error(`file-cache setupLayouts FAIL TO INITIALIZE `, err);
        throw err;
    }
}
export async function setupPartials(config) {
    try {
        // console.log(`filecache setup partials ${util.inspect(config.partialsDirs)}`);
        const partialsDirs = remapdirs(config.partialsDirs);
        partials = new FileCache(config, partialsDirs, 'partials');
        partials.on('error', err => {
            console.error(`ERROR in partials `, err);
        });
        partials.cacheContent = true;
        await partials.setup();
        await config.hookFileCacheSetup('partials', partials);
        // console.log(`filecache FINISH partials setup`);
    }
    catch (err) {
        console.error(`file-cache setupPartials FAIL TO INITIALIZE `, err);
        throw err;
    }
}
export async function closeFileCaches() {
    if (documents) {
        await documents.close();
        documents = undefined;
    }
    if (assets) {
        await assets.close();
        assets = undefined;
    }
    if (layouts) {
        await layouts.close();
        layouts = undefined;
    }
    if (partials) {
        await partials.close();
        partials = undefined;
    }
}
const _symb_config = Symbol('config');
const _symb_dirs = Symbol('dirs');
const _symb_collnm = Symbol('collection-name');
const _symb_watcher = Symbol('watcher');
const _symb_is_ready = Symbol('isReady');
const _symb_cache_content = Symbol('cacheContent');
const _symb_map_renderpath = Symbol('mapRenderPath');
const _symb_queue = Symbol('queue');
export class FileCache extends EventEmitter {
    /**
     * @param config AkashaRender Configuration object
     * @param dirs array of directories and mount points to watch
     * @param collection string giving the name for this watcher collection
     * @param persistPath string giving the location to persist this collection
     */
    constructor(config, dirs, collection) {
        super();
        // console.log(`FileCache ${collection} constructor dirs=${util.inspect(dirs)}`);
        this[_symb_config] = config;
        this[_symb_dirs] = dirs;
        this[_symb_collnm] = collection;
        this[_symb_is_ready] = false;
        this[_symb_cache_content] = false;
        this[_symb_map_renderpath] = false;
    }
    get config() { return this[_symb_config]; }
    get dirs() { return this[_symb_dirs]; }
    get collection() { return this[_symb_collnm]; }
    set cacheContent(doit) { this[_symb_cache_content] = doit; }
    get gacheContent() { return this[_symb_cache_content]; }
    set mapRenderPath(doit) { this[_symb_map_renderpath] = doit; }
    get mapRenderPath() { return this[_symb_map_renderpath]; }
    /**
     * Add a LokiJS dynamic view to the collection for this FileCache.
     * It is up to the caller of this function to configure the
     * dynamic view.  This function first calls <code>getDynamicView</code>
     * to see if there is an existing view, and if not it calls
     * <code>addDynmicView</code> to add it.  If adding a view, the
     * <code>options</code> parameter is passed in to configure the
     * behavior of the view.
     *
     * See: http://techfort.github.io/LokiJS/DynamicView.html
     *
     * @param {*} vname
     * @param {*} options
     * @returns
     */
    getDynamicView(vname, options) {
        if (typeof vname !== 'string') {
            throw new Error(`getDynamicView invalid view name ${util.inspect(vname)}`);
        }
        const vw = this.collection.getDynamicView(vname);
        if (vw)
            return vw;
        else
            return this.collection.addDynamicView(vname, options);
    }
    /**
     * Set up receiving events from DirsWatcher, and dispatching to
     * the handler methods.
     */
    async setup() {
        const fcache = this;
        if (this[_symb_watcher]) {
            await this[_symb_watcher].close();
        }
        this[_symb_queue] = fastq.promise(async function (event) {
            if (event.collection !== fcache.collection) {
                throw new Error(`handleChanged event for wrong collection; got ${event.collection}, expected ${fcache.collection}`);
            }
            if (event.code === 'changed') {
                try {
                    // console.log(`change ${event.collection} ${event.info.vpath}`);
                    await fcache.handleChanged(event.collection, event.info);
                    fcache.emit('change', event.collection, event.info);
                }
                catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        collection: event.collection,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            }
            else if (event.code === 'added') {
                try {
                    // console.log(`add ${event.collection} ${event.info.vpath}`);
                    await fcache.handleAdded(event.collection, event.info);
                    fcache.emit('add', event.collection, event.info);
                }
                catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        collection: event.collection,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            }
            else if (event.code === 'unlinked') {
                try {
                    // console.log(`unlink ${event.collection} ${event.info.vpath}`, event.info);
                    await fcache.handleUnlinked(event.collection, event.info);
                    fcache.emit('unlink', event.collection, event.info);
                }
                catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        collection: event.collection,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            }
            else if (event.code === 'ready') {
                await fcache.handleReady(event.collection);
                fcache.emit('ready', event.collection);
            }
        }, 1);
        // console.log(`file-cache ${this.collection} setup DirsWatcher ${util.inspect(this.dirs)}`);
        this[_symb_watcher] = new DirsWatcher(this.collection);
        this[_symb_watcher].on('change', async (collection, info) => {
            // console.log(`${collection} changed ${info.mountPoint} ${info.vpath}`);
            try {
                if (!this.ignoreFile(info)) {
                    // console.log(`PUSH ${collection} changed ${info.mountPoint} ${info.vpath}`);
                    this[_symb_queue].push({
                        code: 'changed',
                        collection, info
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
            .on('add', async (collection, info) => {
            try {
                // console.log(`${collection} add ${info.mountPoint} ${info.vpath}`);
                if (!this.ignoreFile(info)) {
                    // console.log(`PUSH ${collection} add ${info.mountPoint} ${info.vpath}`);
                    this[_symb_queue].push({
                        code: 'added',
                        collection, info
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
            .on('unlink', async (collection, info) => {
            // console.log(`unlink ${collection} ${info.vpath}`);
            try {
                if (!this.ignoreFile(info)) {
                    this[_symb_queue].push({
                        code: 'unlinked',
                        collection, info
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
            .on('ready', async (collection) => {
            // console.log(`${collection} ready`);
            this[_symb_queue].push({
                code: 'ready',
                collection
            });
        });
        // console.log(this[_symb_watcher]);
        // console.log(`FileCache setup dirs ${util.inspect(this.dirs)}`);
        await this[_symb_watcher].watch(this.dirs);
    }
    /**
     * Find the directory mount corresponding to the file.
     *
     * @param {*} info
     * @returns
     */
    fileDirMount(info) {
        for (const dir of this.dirs) {
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
            // if (ignore) console.log(`ignoreFile ${info.vpath}`);
            return ignore;
        }
        else {
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
        while (this[_symb_dirs].length > 0 && !this[_symb_is_ready]) {
            // This does a 100ms pause
            // That lets us check is_ready every 100ms
            // at very little cost
            // console.log(`!isReady ${this.collection} ${this[_symb_dirs].length} ${this[_symb_is_ready]}`);
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(undefined);
                }, 100);
            });
        }
        return true;
    }
    async close() {
        if (this[_symb_queue]) {
            this[_symb_queue].killAndDrain();
            this[_symb_queue] = undefined;
        }
        if (this[_symb_watcher]) {
            // console.log(`CLOSING ${this.collection}`);
            await this[_symb_watcher].close();
            this[_symb_watcher] = undefined;
        }
        this.removeAllListeners('changed');
        this.removeAllListeners('added');
        this.removeAllListeners('unlinked');
        this.removeAllListeners('ready');
    }
    getCollection(collection) {
        return db.getCollection(typeof collection === 'string'
            ? collection
            : this.collection);
    }
    async gatherInfoData(info) {
        try {
            info.stats = await fs.stat(info.fspath);
        }
        catch (err) {
            console.error(`stat for ${info.fspath} failed because ${err.stack}`);
            info.stats = undefined;
        }
        info.renderPath = info.vpath;
        info.dirname = path.dirname(info.vpath);
        if (info.dirname === '.')
            info.dirname = '/';
        for (let dir of this.dirs) {
            if (dir.mounted === info.mounted) {
                if (dir.baseMetadata) {
                    info.baseMetadata = dir.baseMetadata;
                }
                break;
            }
        }
        // These fields were supported in the old
        // readDocument function
        info.basedir = info.mounted;
        info.dirMountedOn = info.mountPoint;
        info.mountedDirMetadata = info.baseMetadata;
        info.docpath = info.pathInMounted;
        info.docdestpath = info.vpath;
        // info.publicationDate is a unix/JavaScript timestamp
        // we can use to sort documents on date
        if (info.stats && info.stats.mtime) {
            info.publicationDate = new Date(info.stats.mtime);
            info.publicationTime = info.publicationDate.getTime();
            info.mtime = info.publicationDate;
        }
        let renderer = this.config.findRendererPath(info.vpath);
        info.renderer = renderer;
        if (renderer) {
            // These fields were supported in the old
            // readDocument function
            // Note that some FileCache's do not want to modify
            // this from vpath -- such as partials and layouts.
            info.renderPath = this.mapRenderPath
                ? renderer.filePath(info.vpath)
                : info.vpath;
            info.renderpath = info.renderPath;
            info.rendername = path.basename(info.renderPath);
            info.rendersToHTML = minimatch(info.renderPath, '**/*.html')
                ? true : false;
            // console.log(`RenderedFileCache ${info.vpath} ==> renderPath ${info.renderPath}`);
            if (renderer && renderer.parseMetadata) {
                // Renderer.parseMetadata defaults to doing nothing.
                // For a renderer that can read data, such as the
                // frontmatter used with most HTML rendering files,
                // the parseMetadata function will do something else.
                // In such cases the rc (RenderingContext) will
                // contain some data.
                const rc = renderer.parseMetadata({
                    fspath: info.fspath,
                    content: await fs.readFile(info.fspath, 'utf-8')
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
                info.metadata.rendered_date = info.stats.mtime;
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
                    if (info.docMetadata && info.docMetadata.publDate) {
                        parsePublDate(info.docMetadata.publDate);
                        dateSet = true;
                    }
                    if (info.docMetadata
                        && typeof info.docMetadata.publicationDate === 'string') {
                        parsePublDate(info.docMetadata.publicationDate);
                        dateSet = true;
                    }
                    if (!dateSet && info.stats && info.stats.mtime) {
                        info.metadata.publicationDate = new Date(info.stats.mtime);
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
            /* -- For reference, the old code
            if (renderer
             && renderer.readContent
             && renderer.parseFrontmatter) {
                // console.log(`RenderedFileCache before readContent ${info.vpath} ${info.mounted} ${info.mountPoint} ${info.pathInMounted}`);
                let content = await renderer.readContent(
                    info.mounted,
                    info.pathInMounted);
                let fm = renderer.parseFrontmatter(content);
                // console.log(`RenderedFileCache got document metadata ${info.vpath}`, fm.data);
                info.docMetadata = fm.data;
                info.docContent = fm.content;
                info.metadata = await renderer.newInitMetadata(this.config, info);
                // There may be doc.docMetadata.tags derived from
                // the front-matter.  In newInitMetadata we ensure that
                // doc.metadata.tags holds an array.  This line makes
                // sure that doc.docMetadata.tags is in agreement.
                info.docMetadata.tags = info.metadata.tags;
                info.publicationDate = info.metadata.publicationDate;
                info.publicationTime = new Date(info.metadata.publicationDate).getTime();
            }
            */
        }
        else {
            info.renderPath = info.vpath;
            info.renderpath = info.vpath;
        }
    }
    async handleChanged(collection, info) {
        // console.log(`PROCESS ${collection} handleChanged`, info.vpath);
        if (this.ignoreFile(info)) {
            // console.log(`OOOOOOOOGA!!! Received a file that should be ingored `, info);
            return;
        }
        if (collection !== this.collection) {
            throw new Error(`handleChanged event for wrong collection; got ${collection}, expected ${this.collection}`);
        }
        await this.gatherInfoData(info);
        // console.log(`handleChanged ${info.vpath} ${info.metadata && info.metadata.publicationDate ? info.metadata.publicationDate : '???'}`);
        info.stack = undefined;
        let coll = this.getCollection();
        // Going by the LokiJS examples, the
        // update workflow is to:
        // 1. retrieve a document -- which contains a $loki member
        // 2. making changes to that document
        // 3. call update
        //
        // This method is receiving a new document that is
        // supposed to be an update to one already in the database.
        // Because of how FileCache works, the documents will
        // be have the same structure, and any changes are
        // what needs to be updated.
        //
        // Hence, we use "findOne" to retrieve the document.
        // We copy its $loki value into the document we're given.
        // The update function then identifies what to update
        // based on the $loki value we supplied.
        let orig = coll.findOne({
            vpath: {
                $eq: info.vpath
            },
            mounted: {
                $eq: info.mounted
            }
        });
        info.$loki = orig.$loki;
        coll.update(info);
        await this.config.hookFileChanged(collection, info);
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
    async handleAdded(collection, info) {
        //  console.log(`PROCESS ${collection} handleAdded`, info.vpath);
        if (this.ignoreFile(info)) {
            // console.log(`OOOOOOOOGA!!! Received a file that should be ingored `, info);
            return;
        }
        if (collection !== this.collection) {
            throw new Error(`handleAdded event for wrong collection; got ${collection}, expected ${this.collection}`);
        }
        await this.gatherInfoData(info);
        // console.log(`handleAdded ${info.vpath} ${info.metadata && info.metadata.publicationDate ? info.metadata.publicationDate : '???'}`);
        info.stack = undefined;
        let coll = this.getCollection();
        coll.insert(info);
        await this.config.hookFileAdded(collection, info);
    }
    async handleUnlinked(collection, info) {
        // console.log(`PROCESS ${collection} handleUnlinked`, info.vpath);
        if (collection !== this.collection) {
            throw new Error(`handleUnlinked event for wrong collection; got ${collection}, expected ${this.collection}`);
        }
        await this.config.hookFileUnlinked(collection, info);
        let coll = this.getCollection();
        coll.findAndRemove({
            vpath: {
                $eq: info.vpath
            },
            mounted: {
                $eq: info.mounted
            }
        });
    }
    async handleReady(collection) {
        // console.log(`PROCESS ${collection} handleReady`);
        if (collection !== this.collection) {
            throw new Error(`handleReady event for wrong collection; got ${collection}, expected ${this.collection}`);
        }
        this[_symb_is_ready] = true;
        this.emit('ready', collection);
    }
    find(_fpath) {
        const fpath = _fpath.startsWith('/')
            ? _fpath.substring(1)
            : _fpath;
        const fcache = this;
        const coll = this.getCollection();
        const results = coll.chain().find({
            '$or': [
                { vpath: { '$eq': fpath } },
                { renderPath: { '$eq': fpath } }
            ]
        })
            .where(function (obj) {
            return !fcache.ignoreFile(obj);
            // return obj.vpath === fpath || obj.renderPath === fpath;
        })
            .data({
            removeMeta: true
        });
        let ret;
        if (Array.isArray(results) && results.length > 0) {
            ret = results[0];
        }
        else if (Array.isArray(results) && results.length <= 0) {
            ret = undefined;
        }
        else {
            ret = results;
        }
        return ret;
    }
    async indexChain(_fpath) {
        const fpath = _fpath.startsWith('/')
            ? _fpath.substring(1)
            : _fpath;
        const parsed = path.parse(fpath);
        // The selector is a long list of '$or' entries each of
        // which is a '$or' on both vpath and renderPath.
        // Some of the entries are added below
        const selector = {
            '$or': [
                {
                    '$or': [
                        { vpath: fpath },
                        { renderPath: fpath }
                    ]
                }
            ]
        };
        let fileName;
        let found = await documents.find(fpath);
        if (found) {
            fileName = found.renderPath;
        }
        else {
            fileName = fpath;
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
            // These selector entries are added to the selector
            // which was started above here.
            selector['$or'].push({
                '$or': [
                    { vpath: lookFor },
                    { renderPath: lookFor }
                ]
            });
            fileName = lookFor;
            dirName = path.dirname(lookFor);
        }
        // console.log(`indexChain ${fpath} selector ${JSON.stringify(selector)}`);
        return documents.getCollection().find(selector)
            .map(function (obj) {
            obj.foundDir = obj.mountPoint;
            obj.foundPath = obj.renderPath;
            obj.filename = '/' + obj.renderPath;
            return obj;
        })
            .reverse();
    }
    siblings(_fpath) {
        let ret;
        let vpath = _fpath.startsWith('/')
            ? _fpath.substring(1)
            : _fpath;
        let dirname = path.dirname(vpath);
        if (dirname === '.')
            dirname = '/';
        // console.log(`siblings ${_fpath} ${vpath} ${dirname}`);
        const fcache = this;
        const coll = this.getCollection();
        let dvSiblings = coll.getDynamicView('siblings');
        if (!dvSiblings) {
            dvSiblings = coll.addDynamicView('siblings');
            dvSiblings.applyFind({
                /* dirname: dirname,
                '$and': [
                    { vpath: { '$ne': vpath } },
                    { renderPath: { '$ne': vpath } },
                ], */
                rendersToHTML: true
            });
            dvSiblings.applyWhere(function (obj) {
                return !fcache.ignoreFile(obj);
            });
            dvSiblings.applySimpleSort('vpath');
        }
        ret = dvSiblings.branchResultset()
            .find({
            dirname: dirname,
            '$and': [
                { vpath: { '$ne': vpath } },
                { renderPath: { '$ne': vpath } },
            ],
            rendersToHTML: true
        })
            .data({
            removeMeta: true
        });
        return ret;
    }
    // Original implementation.  The above implementation
    // uses DynamicView and is significantly faster
    //   random siblings       125.85 µs/iter   (8.29 µs … 743.01 µs)
    //   random siblings-view  102.23 µs/iter  (88.25 µs … 623.99 µs)
    /* siblings(_fpath) {
        let ret;
        let vpath = _fpath.startsWith('/')
                  ? _fpath.substring(1)
                  : _fpath;
        let dirname = path.dirname(vpath);
        if (dirname === '.') dirname = '/';

        // console.log(`siblings ${_fpath} ${vpath} ${dirname}`);

        const fcache = this;
        const coll = this.getCollection();
        // Looks for files in the directory containing _fpath
        // that are not _fpath
        ret = coll.chain().find({
            dirname: dirname,
            '$and': [
                { vpath: { '$ne': vpath } },
                { renderPath: { '$ne': vpath } },
            ],
            rendersToHTML: true
        })
        .where(function(obj) {
            return ! fcache.ignoreFile(obj);
        })
        .simplesort('vpath')
        .data({
            removeMeta: true
        });

        return ret;
    } */
    indexFiles(_dirname) {
        let dirname = _dirname && _dirname.startsWith('/')
            ? _dirname.substring(1)
            : _dirname;
        if (dirname === '.'
            || dirname === ''
            || typeof dirname === 'undefined') {
            dirname = '/';
        }
        const coll = this.getCollection();
        let dvIndexFiles = coll.getDynamicView('index-files');
        if (!dvIndexFiles) {
            dvIndexFiles = coll.addDynamicView('index-files');
            dvIndexFiles.applyFind({
                '$or': [
                    { renderPath: { '$regex': '/index\.html$' } },
                    { renderPath: { '$eq': 'index.html' } }
                ]
            });
            dvIndexFiles.applySimpleSort('dirname');
        }
        if (!dvIndexFiles)
            throw new Error(`Did not find view index-files`);
        // console.log(dvIndexFiles);
        // console.log(dvIndexFiles.branchResultset);
        const ret = dvIndexFiles.branchResultset()
            .where(function (obj) {
            /* const renderP = obj.renderPath === 'index.html' || obj.renderPath.endsWith('/index.html');
            if (!renderP) return false; */
            if (dirname !== '/') {
                if (obj.vpath.startsWith(dirname))
                    return true;
                else
                    return false;
            }
            else {
                return true;
            }
        })
            .data({
            removeMeta: true
        });
        return ret;
    }
    // Original implementation.  The version above uses a
    // DynamicView and is significantly faster
    // 
    //  random indexes           1.3 ms/iter     (1.15 ms … 2.77 ms)
    //  random indexes-view     1.02 ms/iter   (909.46 µs … 2.39 ms)
    /* indexFiles(_dirname) {
        let dirname = _dirname && _dirname.startsWith('/')
                    ? _dirname.substring(1)
                    : _dirname;
        if (dirname === '.'
         || dirname === ''
         || typeof dirname === 'undefined') {
            dirname = '/';
        }

        const coll = this.getCollection();
        const ret = coll.chain()
        .find({
            '$or': [
                { renderPath: { '$regex': '/index\.html$' } },
                { renderPath: { '$eq': 'index.html' }}
            ]
        })
        .where(function(obj) {
            /* const renderP = obj.renderPath === 'index.html' || obj.renderPath.endsWith('/index.html');
            if (!renderP) return false; *--/
            if (dirname !== '/') {
                if (obj.vpath.startsWith(dirname)) return true;
                else return false;
            } else {
                return true;
            }
        })
        .simplesort('dirname')
        .data({
            removeMeta: true
        });
        // console.log(`indexFiles ${ret.length}`);
        return ret;
    } */
    // TODO reusable function for distinct vpaths
    // This was no faster in benchmark testing.  Testing showed
    // that ret was an empty array, which seems to have required
    // using the fallback code that is a duplicate of the 
    // non-View implementation.
    /* pathsView() {
        const fcache = this;
        const coll = this.getCollection();
        let dvPaths = coll.getDynamicView('paths');
        if (!dvPaths) {
            dvPaths = coll.addDynamicView('paths');
            dvPaths.applyFind();
            dvPaths.applyWhere(function (obj) {
                if (fcache.ignoreFile(obj)) return false;
            });
            dvPaths.applySimpleSort('vpath');
        }
        let ret = dvPaths.branchResultset().data({ removeMeta: true, forceClones: true });
        if (!ret || ret.length === 0) {
            const vpathsSeen = new Set();
            ret = coll.chain()
            .where(function(obj) {
                if (fcache.ignoreFile(obj)) {
                    // console.log(`OOOOGA!  In paths  MUST IGNORE ${obj.vpath}`);
                    return false;
                }
                if (vpathsSeen.has(obj.vpath)) {
                    return false;
                } else {
                    vpathsSeen.add(obj.vpath);
                    return true;
                }
            })
            .data({
                removeMeta: true
            });
        }
        const mapped = ret.map(obj => {
                return  {
                    fspath: obj.fspath,
                    vpath: obj.vpath,
                    renderPath: obj.renderPath,
                    mountPoint: obj.mountPoint,
                    dirMountedOn: obj.dirMountedOn
                };
            });
        return mapped;
    } */
    setTimes() {
        const fcache = this;
        const vpathsSeen = new Set();
        const coll = this.getCollection();
        const ret = coll.chain()
            .where(function (obj) {
            if (fcache.ignoreFile(obj)) {
                // console.log(`OOOOGA!  In paths  MUST IGNORE ${obj.vpath}`);
                return false;
            }
            if (vpathsSeen.has(obj.vpath)) {
                return false;
            }
            else {
                vpathsSeen.add(obj.vpath);
                return true;
            }
        })
            .data({
            removeMeta: true
        });
        for (const obj of ret) {
            const setter = async (date) => {
                const parsed = Date.parse(date);
                ;
                if (!isNaN(parsed)) {
                    const dp = new Date(parsed);
                    FS.utimesSync(obj.fspath, dp, dp);
                }
            };
            if (obj.docMetadata && obj.docMetadata.publDate) {
                setter(obj.docMetadata.publDate);
            }
            if (obj.docMetadata && obj.docMetadata.publicationDate) {
                setter(obj.docMetadata.publicationDate);
            }
        }
    }
    paths() {
        const fcache = this;
        const vpathsSeen = new Set();
        const coll = this.getCollection();
        const ret = coll.chain()
            // .find({
            //     'renderPath': { '$regex': /\.html$/ }
            // })
            // // .simplesort('publicationTime' /* , { desc: false } */)
            // .where(function(obj) {
            //     return obj.renderPath.endsWith('index.html')
            //         ? false : true;
            // })
            .where(function (obj) {
            if (fcache.ignoreFile(obj)) {
                // console.log(`OOOOGA!  In paths  MUST IGNORE ${obj.vpath}`);
                return false;
            }
            if (vpathsSeen.has(obj.vpath)) {
                return false;
            }
            else {
                vpathsSeen.add(obj.vpath);
                return true;
            }
        })
            .data({
            removeMeta: true
        })
            .sort((a, b) => {
            let aDate = a.metadata && a.metadata.publicationDate
                ? a.metadata.publicationDate
                : a.publicationDate;
            let bDate = b.metadata && b.metadata.publicationDate
                ? b.metadata.publicationDate
                : b.publicationDate;
            if (aDate === bDate)
                return 0;
            if (aDate > bDate)
                return -1;
            if (aDate < bDate)
                return 1;
            // if (a.metadata.publicationDate === b.metadata.publicationDate) return 0;
            // if (a.metadata.publicationDate > b.metadata.publicationDate) return -1;
            // if (a.metadata.publicationDate < b.metadata.publicationDate) return 1;
        })
            .map(obj => {
            return {
                fspath: obj.fspath,
                vpath: obj.vpath,
                renderPath: obj.renderPath,
                mountPoint: obj.mountPoint,
                dirMountedOn: obj.dirMountedOn,
                // title: obj.metadata.title,
                docMetadata: obj.docMetadata,
                metadata: obj.metadata,
                // docMetadataDate: obj.docMetadata && obj.docMetadata.publicationDate 
                //         ? obj.docMetadata.publicationDate.toISOString()
                //         : '?????',
                // metadataDate: obj.metadata.publicationDate.toISOString(),
                publicationDate: obj.publicationDate.toISOString(),
                publicationTime: obj.publicationTime
            };
        });
        // .reverse();
        // console.log(`dbpaths ${ret.length}`);
        // console.log(`dbpaths ${util.inspect(ret)}`);
        return ret;
    }
    documentsWithTags() {
        const fcache = this;
        let coll = this.getCollection();
        let dvTags = coll.getDynamicView('docs-with-tags');
        if (!dvTags) {
            dvTags = coll.addDynamicView('docs-with-tags');
            dvTags.applyFind({
                rendersToHTML: true
            });
            dvTags.applyWhere(function (obj) {
                if (fcache.ignoreFile(obj))
                    return false;
                return obj.metadata
                    && obj.metadata.tags
                    && Array.isArray(obj.metadata.tags)
                    && obj.metadata.tags.length >= 1;
            });
        }
        return dvTags.data({
            removeMeta: true
        });
    }
    // Original implementation.  The above implementation uses
    // a DynamicView and is significantly faster
    //
    //    tags             618.77 µs/iter   (530.68 µs … 1.79 ms)
    //    tags-view         54.94 µs/iter  (48.18 µs … 777.88 µs)
    /* documentsWithTags() {
        let coll = this.getCollection();
        const fcache = this;
        const vpathsSeen = new Set();
        const ret = coll.chain()
        .find({
            rendersToHTML: true
        })
        .where(function(obj) {
            if (vpathsSeen.has(obj.vpath)) {
                return false;
            } else {
                vpathsSeen.add(obj.vpath);
                return true;
            }
        })
        .where(function (obj) {
            if (fcache.ignoreFile(obj)) return false;
            return obj.metadata
                && obj.metadata.tags
                && Array.isArray(obj.metadata.tags)
                && obj.metadata.tags.length >= 1;
        })
        .data({
            removeMeta: true
        });
        return ret;
    } */
    tags() {
        /* let coll = this.getCollection(this.collection);
        let tags = coll.find({
            $and: [
                { renderPath: /\.html$/ },
                { $exists: { metadata: 1 }},
                { metadata: { $count: { tags: { $gte: 1 }}}}
            ]
        }); */
        let docs = this.documentsWithTags();
        // console.log(tags);
        const ret = [];
        for (let doc of docs) {
            for (let tag of doc.metadata.tags) {
                if (!ret.includes(tag))
                    ret.push(tag);
            }
        }
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
    search(options) {
        // let documents = [];
        // const selector = {};
        const fcache = this;
        const vpathsSeen = new Set();
        // console.log(`FileCacheLoki search `, options);
        try {
            // For the search options that can be expressed using
            // the find(selector), we construct a suitable selector.
            // For others, there is a where clause below.
            const selector = {};
            if (options.pathmatch) {
                if (typeof options.pathmatch === 'string'
                    || (typeof options.pathmatch === 'object'
                        && options.pathmatch instanceof RegExp)) {
                    selector.vpath = {
                        '$regex': options.pathmatch
                    };
                }
                else if (Array.isArray(options.pathmatch)) {
                    selector['$or'] = [];
                    for (const match of options.pathmatch) {
                        selector['$or'].push({ vpath: { '$regex': match } });
                    }
                }
                else {
                    throw new Error(`FileCache search invalid pathmatch ${typeof options.pathmatch} ${util.inspect(options.pathmatch)}`);
                }
            }
            if (options.renderpathmatch) {
                if (typeof options.renderpathmatch === 'string'
                    || (typeof options.renderpathmatch === 'object'
                        && options.renderpathmatch instanceof RegExp)) {
                    selector.renderPath = {
                        '$regex': options.renderpathmatch
                    };
                }
                else if (Array.isArray(options.renderpathmatch)) {
                    if (typeof selector['$or'] === 'undefined') {
                        selector['$or'] = [];
                    }
                    for (const match of options.renderpathmatch) {
                        selector['$or'].push({ renderPath: { '$regex': match } });
                    }
                }
                else {
                    throw new Error(`FileCache search invalid renderpathmatch ${util.inspect(options.renderpathmatch)}`);
                }
            }
            if (options.mime) {
                if (typeof options.mime === 'string') {
                    selector.mime = {
                        '$eq': options.mime
                    };
                }
                else if (Array.isArray(options.mime)) {
                    selector.mime = {
                        '$in': options.mime
                    };
                } /* else {
                    throw new Error(`Incorrect MIME check ${options.mime}`);
                } */
            }
            if (typeof options.rendersToHTML !== 'undefined') {
                selector.rendersToHTML = { '$eq': options.rendersToHTML };
            }
            // console.log(`search `, selector);
            let counter1 = 0;
            let coll = this.getCollection();
            const ret = coll.chain().find(selector)
                .where(function (obj) {
                if (vpathsSeen.has(obj.vpath)) {
                    return false;
                }
                else {
                    vpathsSeen.add(obj.vpath);
                    return true;
                }
            })
                .where(function (obj) {
                if (fcache.ignoreFile(obj))
                    return false;
                // console.log(`search where ${obj.vpath}`);
                // console.log(`search where layouts ${obj.vpath} ${obj?.docMetadata?.layout} ${util.inspect(options.layouts)}`);
                if (options.layouts) {
                    let layouts;
                    if (Array.isArray(options.layouts)) {
                        layouts = options.layouts;
                    }
                    else {
                        layouts = [options.layouts];
                    }
                    if (obj.vpath
                        && obj.docMetadata
                        && obj.docMetadata.layout) {
                        if (!layouts.includes(obj.docMetadata.layout)) {
                            // console.log(`REJECT ${obj.vpath} ${util.inspect(options.layouts)} did not include ${obj.docMetadata.layout}`);
                            return false;
                        }
                        else {
                            // console.log(`INCLUDE ${obj.vpath}  ${util.inspect(options.layouts)} did include ${obj.docMetadata.layout}`);
                        }
                    }
                    else {
                        // console.log(`REJECT ${obj.vpath} specified layouts ${util.inspect(options.layouts)} but no layout in document`);
                        return false;
                    }
                }
                if (options.tag) {
                    if (obj.vpath
                        && obj.docMetadata
                        && obj.docMetadata.tags
                        && Array.isArray(obj.docMetadata.tags)) {
                        if (!obj.docMetadata.tags.includes(options.tag)) {
                            return false;
                        }
                        // console.log(`obj ${obj.vpath} found=${found} tag ${options.tag} in `, obj.docMetadata.tags);
                        // if (found) return true;
                    }
                    else {
                        // Cannot possibly have the tag
                        return false;
                    }
                }
                if (options.rootPath) {
                    if (obj.vpath && obj.renderPath) {
                        // console.log(`rootPath ${options.rootPath} matches ${obj.renderPath}`);
                        if (!obj.renderPath.startsWith(options.rootPath)) {
                            // console.log(`NO MATCH AT ALL rootPath ${options.rootPath} matches ${obj.renderPath}`);
                            return false;
                        }
                    }
                }
                if (options.glob) {
                    if (obj.vpath) {
                        if (!minimatch(obj.vpath, options.glob)) {
                            return false;
                        }
                    }
                }
                if (options.renderglob) {
                    if (obj.renderPath) {
                        if (!minimatch(obj.renderPath, options.renderglob)) {
                            return false;
                        }
                    }
                }
                if (options.renderers && Array.isArray(options.renderers)) {
                    let renderer = fcache.config.findRendererPath(obj.vpath);
                    // console.log(`renderer for ${obj.vpath} `, renderer);
                    if (!renderer)
                        return false;
                    let found = false;
                    for (const r of options.renderers) {
                        // console.log(`check renderer ${typeof r} ${renderer.name} ${renderer instanceof r}`);
                        if (typeof r === 'string' && r === renderer.name) {
                            found = true;
                        }
                        else if (typeof r === 'object' || typeof r === 'function') {
                            console.error('WARNING: Matching renderer by object class is no longer supported', r);
                        }
                        // No longer support matching by object class.
                        // Matching by renderer.name should be enough.
                        /* else if ((typeof r === 'object' || typeof r === 'function')
                                 && renderer instanceof r) {
                            found = true;
                        } */
                    }
                    if (!found) {
                        // console.log(`search ${renderer.name} not in ${util.inspect(options.renderers)} ${obj.vpath}`);
                        return false;
                    }
                }
                if (options.filterfunc) {
                    if (!options.filterfunc(fcache.config, options, obj)) {
                        // console.log(`filterfunc rejected ${obj.vpath}`);
                        return false;
                    }
                }
                return true;
            });
            // .where(function(obj) {
            //     if (counter1 > 150) return true;
            //     counter1++
            //     console.log(`BEFORE SORT ${obj.vpath} ${obj.publicationDate}`);
            //     return true;
            // });
            let ret2;
            if (typeof options.sortBy === 'string') {
                // ret2 = ret.simplesort(options.sortBy, {
                //     desc: options.sortByDescending === true ? true : false
                // });
                // ret2 = ret.sort(function(a, b) {
                //     if (a[options.sortBy] === b[options.sortBy]) return 0;
                //     if (a[options.sortBy] > b[options.sortBy]) {
                //         return options.sortByDescending === true ? 1 : -1;
                //     }
                //     if (a[options.sortBy] < b[options.sortBy]) {
                //         return options.sortByDescending === false ? -1 : 1;
                //     }
                // });
                const sortDesc = options.sortByDescending === true
                    ? [[options.sortBy, true]]
                    : [options.sortBy];
                // console.log(`search sortBy ${options.sortBy} desc ${options.sortByDescending}`, sortDesc);
                ret2 = ret.compoundsort(sortDesc);
            }
            else if (typeof options.sortFunc === 'function') {
                ret2 = ret.sort(options.sortFunc);
            }
            else {
                ret2 = ret;
            }
            // counter1 = 0;
            // ret2.where(function(obj) {
            //     if (counter1 > 150) return true;
            //     counter1++
            //     console.log(`AFTER SORT ${obj.vpath} ${obj.publicationDate}`);
            //     return true;
            // });
            if (typeof options.offset === 'number') {
                // console.log(`search offset ${options.offset}`);
                ret2 = ret2.offset(options.offset);
            }
            if (typeof options.limit === 'number') {
                // console.log(`search limit ${options.limit}`);
                ret2 = ret2.limit(options.limit);
            }
            let ret3 = ret2.data({
                removeMeta: true
            });
            if (typeof options.sortBy === 'string'
                && (options.sortBy === 'publicationDate'
                    || options.sortBy === 'publicationTime')) {
                ret3 = ret3.sort((a, b) => {
                    let aDate = a.metadata && a.metadata.publicationDate
                        ? a.metadata.publicationDate
                        : a.publicationDate;
                    let bDate = b.metadata && b.metadata.publicationDate
                        ? b.metadata.publicationDate
                        : b.publicationDate;
                    if (aDate === bDate)
                        return 0;
                    if (aDate > bDate)
                        return -1;
                    if (aDate < bDate)
                        return 1;
                    // if (a.metadata.publicationDate === b.metadata.publicationDate) return 0;
                    // if (a.metadata.publicationDate > b.metadata.publicationDate) return -1;
                    // if (a.metadata.publicationDate < b.metadata.publicationDate) return 1;
                });
            }
            /* console.log(`select after data() ${ret3.length} is array ${Array.isArray(ret3)}`, ret3.map(item => {
                return {
                    vpath: item.vpath,
                    date: new Date(item.publicationDate).toISOString(),
                    time: new Date(item.publicationDate).getTime()
                };
            })); */
            if (options.reverse === true) {
                // console.log(`select return reverse`);
                ret3.reverse();
                /* console.log(`select after reverse ${ret3.length}  is array ${Array.isArray(ret3)}`, ret3.map(item => {
                    return { vpath: item.vpath, date: item.docMetadata.publicationDate }
                })); */
            }
            return ret3;
        }
        catch (err) {
            console.error(`search ${options} gave error ${err.stack}`);
        }
    }
    async readDocument(info) { throw new Error('Do not use readDocument'); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1jYWNoZS1sb2tpanMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvZmlsZS1jYWNoZS1sb2tpanMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUgsT0FBTyxJQUFJLE1BQU0sUUFBUSxDQUFDO0FBQzFCLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN0RCxPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sR0FBRyxNQUFPLEtBQUssQ0FBQztBQUN2QixPQUFPLEVBQUUsUUFBUSxJQUFJLEVBQUUsRUFBRSxNQUFNLElBQUksQ0FBQztBQUNwQyxPQUFPLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDcEIsT0FBTyxZQUFZLE1BQU0sUUFBUSxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDdEMsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBRzFCLElBQUksRUFBRSxDQUFDLENBQUUseUNBQXlDO0FBQ2xELElBQUksY0FBYyxDQUFDO0FBQ25CLElBQUksV0FBVyxDQUFDO0FBQ2hCLElBQUksWUFBWSxDQUFDO0FBQ2pCLElBQUksYUFBYSxDQUFDO0FBRWxCLE1BQU0sQ0FBQyxLQUFLLFVBQVUsS0FBSyxDQUFDLE1BQU07SUFDOUIsSUFBSSxDQUFDO1FBQ0QsaURBQWlEO1FBQ2pELEVBQUUsR0FBRyxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDMUIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxhQUFhO1lBQzlCLFFBQVEsRUFBRSxNQUFNLENBQUMsYUFBYTtZQUM5QixnQkFBZ0I7U0FDbkIsQ0FBQyxDQUFDO1FBRUgsY0FBYyxHQUFHLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM1Qyx1RUFBdUU7UUFFdkUsV0FBVyxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0Qyw4REFBOEQ7UUFFOUQsWUFBWSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4QyxpRUFBaUU7UUFFakUsYUFBYSxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxQyxvRUFBb0U7UUFHcEUsaUZBQWlGO1FBQ2pGLE1BQU0sY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLE1BQU0sTUFBTSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFcEMsMkVBQTJFO1FBQzNFLE1BQU0sV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTFCLDZFQUE2RTtRQUM3RSxNQUFNLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUzQixnRkFBZ0Y7UUFDaEYsTUFBTSxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFNUIsMkNBQTJDO0lBQy9DLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM3RCxNQUFNLEdBQUcsQ0FBQztJQUNkLENBQUM7QUFDTCxDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxLQUFLO0lBRXZCLE1BQU0sZUFBZSxFQUFFLENBQUM7SUFFeEIsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ1gsRUFBRSxHQUFHLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxTQUFTO0lBQ25DLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1IsSUFBSSxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFO1lBQy9CLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLE9BQU8sRUFBRTtnQkFDTCxPQUFPLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsU0FBUztnQkFDekQsU0FBUzthQUNaO1NBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxxREFBcUQ7QUFDckQsc0JBQXNCO0FBQ3RCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFO0lBQ3JCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNsQixxQ0FBcUM7UUFDckMsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUMxQixPQUFPO2dCQUNILE9BQU8sRUFBRSxHQUFHO2dCQUNaLFVBQVUsRUFBRSxHQUFHO2dCQUNmLFlBQVksRUFBRSxFQUFFO2FBQ25CLENBQUM7UUFDTixDQUFDO2FBQU0sQ0FBQztZQUNKLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEYsQ0FBQztZQUNELE9BQU87Z0JBQ0gsT0FBTyxFQUFFLEdBQUcsQ0FBQyxHQUFHO2dCQUNoQixVQUFVLEVBQUUsR0FBRyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxHQUFHLENBQUMsWUFBWTtnQkFDOUIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNO2FBQ3JCLENBQUM7UUFDTixDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUM7QUFFRjs7Ozs7Ozs7Ozs7OztHQWFHO0FBR0gsTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3JCLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQztBQUNsQixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUM7QUFDbkIsTUFBTSxDQUFDLElBQUksUUFBUSxDQUFDO0FBRXBCLE1BQU0sQ0FBQyxLQUFLLFVBQVUsY0FBYyxDQUFDLE1BQU07SUFDdkMsSUFBSSxDQUFDO1FBQ0Qsb0VBQW9FO1FBQ3BFLGlGQUFpRjtRQUNqRiwyQ0FBMkM7UUFDM0MsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNoRCw0Q0FBNEM7UUFDNUMsU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDekQsU0FBUyxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDL0IsU0FBUyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQztRQUNILHlHQUF5RztRQUN6RyxNQUFNLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN4QixNQUFNLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDeEQsbURBQW1EO0lBQ3ZELENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNwRSxNQUFNLEdBQUcsQ0FBQztJQUNkLENBQUM7QUFDTCxDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxXQUFXLENBQUMsTUFBTTtJQUNwQyxJQUFJLENBQUM7UUFDRCwyRUFBMkU7UUFDM0UsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvQyxxRUFBcUU7UUFDckUsTUFBTSxHQUFHLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDckQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUU7WUFDckIsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLE1BQU0sTUFBTSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNsRCxnREFBZ0Q7SUFDcEQsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLDRDQUE0QyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sR0FBRyxDQUFDO0lBQ2QsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLFlBQVksQ0FBQyxNQUFNO0lBQ3JDLElBQUksQ0FBQztRQUNELCtFQUErRTtRQUMvRSxNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2hELE9BQU8sR0FBRyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ3RCLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUM1QixNQUFNLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN0QixNQUFNLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEQsaURBQWlEO0lBQ3JELENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyw2Q0FBNkMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNsRSxNQUFNLEdBQUcsQ0FBQztJQUNkLENBQUM7QUFDTCxDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxhQUFhLENBQUMsTUFBTTtJQUN0QyxJQUFJLENBQUM7UUFDRCxnRkFBZ0Y7UUFDaEYsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNwRCxRQUFRLEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMzRCxRQUFRLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRTtZQUN2QixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsUUFBUSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDN0IsTUFBTSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsTUFBTSxNQUFNLENBQUMsa0JBQWtCLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELGtEQUFrRDtJQUN0RCxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsOENBQThDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDbkUsTUFBTSxHQUFHLENBQUM7SUFDZCxDQUFDO0FBQ0wsQ0FBQztBQUVELE1BQU0sQ0FBQyxLQUFLLFVBQVUsZUFBZTtJQUNqQyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ1osTUFBTSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEIsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUMxQixDQUFDO0lBQ0QsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNULE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLE1BQU0sR0FBRyxTQUFTLENBQUM7SUFDdkIsQ0FBQztJQUNELElBQUksT0FBTyxFQUFFLENBQUM7UUFDVixNQUFNLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN0QixPQUFPLEdBQUcsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUFDRCxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ1gsTUFBTSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsUUFBUSxHQUFHLFNBQVMsQ0FBQztJQUN6QixDQUFDO0FBQ0wsQ0FBQztBQUVELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN0QyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbEMsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDL0MsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3hDLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN6QyxNQUFNLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNuRCxNQUFNLG9CQUFvQixHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNyRCxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFcEMsTUFBTSxPQUFPLFNBQVUsU0FBUSxZQUFZO0lBRXZDOzs7OztPQUtHO0lBQ0gsWUFBWSxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVU7UUFDaEMsS0FBSyxFQUFFLENBQUM7UUFDUixpRkFBaUY7UUFDakYsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLE1BQU0sQ0FBQztRQUM1QixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxVQUFVLENBQUM7UUFDaEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUM3QixJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDbEMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxJQUFJLE1BQU0sS0FBUyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0MsSUFBSSxJQUFJLEtBQVcsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdDLElBQUksVUFBVSxLQUFLLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQyxJQUFJLFlBQVksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM1RCxJQUFJLFlBQVksS0FBSyxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RCxJQUFJLGFBQWEsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM5RCxJQUFJLGFBQWEsS0FBSyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUUxRDs7Ozs7Ozs7Ozs7Ozs7T0FjRztJQUNILGNBQWMsQ0FBQyxLQUFLLEVBQUUsT0FBTztRQUN6QixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0NBQW9DLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFDRCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRCxJQUFJLEVBQUU7WUFBRSxPQUFPLEVBQUUsQ0FBQzs7WUFDYixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDUCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFFcEIsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztZQUN0QixNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN0QyxDQUFDO1FBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxXQUFVLEtBQUs7WUFDbEQsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsS0FBSyxDQUFDLFVBQVUsY0FBYyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUN4SCxDQUFDO1lBQ0QsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUM7b0JBQ0QsaUVBQWlFO29CQUNqRSxNQUFNLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3pELE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4RCxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1QsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7d0JBQ2pCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTt3QkFDaEIsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO3dCQUM1QixLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLO3dCQUN2QixLQUFLLEVBQUUsQ0FBQztxQkFDWCxDQUFDLENBQUM7Z0JBQ1AsQ0FBQztZQUNMLENBQUM7aUJBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUM7b0JBQ0QsOERBQThEO29CQUM5RCxNQUFNLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3ZELE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNyRCxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1QsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7d0JBQ2pCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTt3QkFDaEIsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO3dCQUM1QixLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLO3dCQUN2QixLQUFLLEVBQUUsQ0FBQztxQkFDWCxDQUFDLENBQUM7Z0JBQ1AsQ0FBQztZQUNMLENBQUM7aUJBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUM7b0JBQ0QsNkVBQTZFO29CQUM3RSxNQUFNLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzFELE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4RCxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1QsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7d0JBQ2pCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTt3QkFDaEIsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO3dCQUM1QixLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLO3dCQUN2QixLQUFLLEVBQUUsQ0FBQztxQkFDWCxDQUFDLENBQUM7Z0JBQ1AsQ0FBQztZQUNMLENBQUM7aUJBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUNoQyxNQUFNLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0MsQ0FBQztRQUNMLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVOLDZGQUE2RjtRQUM3RixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXZELElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDeEQseUVBQXlFO1lBQ3pFLElBQUksQ0FBQztnQkFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN6Qiw4RUFBOEU7b0JBRTlFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUM7d0JBQ25CLElBQUksRUFBRSxTQUFTO3dCQUNmLFVBQVUsRUFBRSxJQUFJO3FCQUNuQixDQUFDLENBQUM7Z0JBQ1AsQ0FBQztxQkFBTSxDQUFDO29CQUNKLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RCxDQUFDO1lBQ0wsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFlLElBQUksQ0FBQyxLQUFLLFlBQVksR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDcEUsQ0FBQztRQUNMLENBQUMsQ0FBQzthQUNELEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNsQyxJQUFJLENBQUM7Z0JBQ0QscUVBQXFFO2dCQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN6QiwwRUFBMEU7b0JBRTFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUM7d0JBQ25CLElBQUksRUFBRSxPQUFPO3dCQUNiLFVBQVUsRUFBRSxJQUFJO3FCQUNuQixDQUFDLENBQUM7Z0JBQ1AsQ0FBQztxQkFBTSxDQUFDO29CQUNKLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRCxDQUFDO1lBQ0wsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLElBQUksQ0FBQyxLQUFLLFlBQVksR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDakUsQ0FBQztRQUNMLENBQUMsQ0FBQzthQUNELEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNyQyxxREFBcUQ7WUFDckQsSUFBSSxDQUFDO2dCQUNELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUM7d0JBQ25CLElBQUksRUFBRSxVQUFVO3dCQUNoQixVQUFVLEVBQUUsSUFBSTtxQkFDbkIsQ0FBQyxDQUFDO2dCQUNQLENBQUM7cUJBQU0sQ0FBQztvQkFDSixPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDdEQsQ0FBQztZQUNKLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxJQUFJLENBQUMsS0FBSyxZQUFZLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ3BFLENBQUM7UUFDTCxDQUFDLENBQUM7YUFDRCxFQUFFLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsRUFBRTtZQUM5QixzQ0FBc0M7WUFDdEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDbkIsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsVUFBVTthQUNiLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO1FBRUgsb0NBQW9DO1FBRXBDLGtFQUFrRTtRQUVsRSxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRS9DLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksQ0FBQyxJQUFJO1FBQ2IsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDMUIsK0ZBQStGO1lBQy9GLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sR0FBRyxDQUFDO1lBQ2YsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLFNBQVMsQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsVUFBVSxDQUFDLElBQUk7UUFDWCwyQ0FBMkM7UUFDM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUVYLElBQUksT0FBTyxDQUFDO1lBQ1osSUFBSSxPQUFPLFFBQVEsQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sR0FBRyxDQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBQztZQUNsQyxDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDOUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDakIsQ0FBQztZQUNELEtBQUssTUFBTSxDQUFDLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO29CQUFFLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQzVDLDhEQUE4RDtZQUNsRSxDQUFDO1lBQ0QsdURBQXVEO1lBQ3ZELE9BQU8sTUFBTSxDQUFDO1FBQ2xCLENBQUM7YUFBTSxDQUFDO1lBQ0osMENBQTBDO1lBQzFDLCtFQUErRTtZQUMvRSxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDRixLQUFLLENBQUMsT0FBTztRQUNWLHVEQUF1RDtRQUN2RCwrQkFBK0I7UUFDL0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO1lBQzFELDBCQUEwQjtZQUMxQiwwQ0FBMEM7WUFDMUMsc0JBQXNCO1lBQ3RCLGlHQUFpRztZQUNqRyxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNsQyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUNaLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdkIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ1osQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLO1FBQ1AsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztZQUN0Qiw2Q0FBNkM7WUFDN0MsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNwQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxhQUFhLENBQUMsVUFBbUI7UUFDN0IsT0FBTyxFQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sVUFBVSxLQUFLLFFBQVE7WUFDbEQsQ0FBQyxDQUFDLFVBQVU7WUFDWixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUk7UUFFckIsSUFBSSxDQUFDO1lBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLElBQUksQ0FBQyxNQUFNLG1CQUFtQixHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNyRSxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztRQUMzQixDQUFDO1FBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzdCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLEdBQUc7WUFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztRQUM3QyxLQUFLLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN4QixJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMvQixJQUFJLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDO2dCQUN6QyxDQUFDO2dCQUNELE1BQU07WUFDVixDQUFDO1FBQ0wsQ0FBQztRQUNELHlDQUF5QztRQUN6Qyx3QkFBd0I7UUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzVCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUNwQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUM1QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDbEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBRTlCLHNEQUFzRDtRQUN0RCx1Q0FBdUM7UUFFdkMsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0RCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDdEMsQ0FBQztRQUVELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksUUFBUSxFQUFFLENBQUM7WUFDWCx5Q0FBeUM7WUFDekMsd0JBQXdCO1lBQ3hCLG1EQUFtRDtZQUNuRCxtREFBbUQ7WUFDbkQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYTtnQkFDcEIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDL0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLGFBQWEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUM7Z0JBQ2hELENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUMzQixvRkFBb0Y7WUFDcEYsSUFBSSxRQUFRLElBQUksUUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUVyQyxvREFBb0Q7Z0JBQ3BELGlEQUFpRDtnQkFDakQsbURBQW1EO2dCQUNuRCxxREFBcUQ7Z0JBQ3JELCtDQUErQztnQkFDL0MscUJBQXFCO2dCQUVyQixNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDO29CQUM5QixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07b0JBQ25CLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUM7aUJBQ25ELENBQUMsQ0FBQztnQkFFSCxxREFBcUQ7Z0JBQ3JELGtCQUFrQjtnQkFDbEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQUMvQiw4Q0FBOEM7Z0JBQzlDLDRCQUE0QjtnQkFDNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO2dCQUM3QiwrREFBK0Q7Z0JBQy9ELElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDdkIseURBQXlEO2dCQUN6RCxrQkFBa0I7Z0JBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRyxDQUFDO2dCQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVc7b0JBQUUsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7Z0JBRTdDLG9EQUFvRDtnQkFDcEQsK0JBQStCO2dCQUUvQiwrREFBK0Q7Z0JBQy9ELHlEQUF5RDtnQkFDekQsNkJBQTZCO2dCQUM3QiwyQ0FBMkM7Z0JBQzNDLDhEQUE4RDtnQkFFOUQsS0FBSyxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ2xDLHVGQUF1RjtvQkFDdkYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO2dCQUNELEtBQUssSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDckMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztnQkFDRCxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7Z0JBQ2pCLEtBQUssSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNqQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQy9DLFFBQVEsRUFBRSxDQUFDO2dCQUNmLENBQUM7Z0JBRUQsaURBQWlEO2dCQUNqRCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQzNCLDJDQUEyQztnQkFDM0MsOENBQThDO2dCQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUN6RSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDekMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBR2xELDZDQUE2QztnQkFDN0MsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQzVCLENBQUM7cUJBQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDbEQsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNqQixNQUFNLEVBQUUsR0FBRyxTQUFTLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQ3ZDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7b0JBQzdCLENBQUMsQ0FBQyxDQUFDO29CQUNILElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztnQkFDakMsQ0FBQztxQkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQzVDLE1BQU0sSUFBSSxLQUFLLENBQ1gsa0JBQWtCLElBQUksQ0FBQyxLQUFLLDRCQUE0QixFQUN4RCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QixDQUFDO2dCQUNELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUUzQywrQkFBK0I7Z0JBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO2dCQUU5QywrQ0FBK0M7Z0JBQy9DLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUMvQyxRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FDcEUsQ0FBQztvQkFDRixJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0RCxDQUFDO3FCQUFNLENBQUM7b0JBQ0osSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO2dCQUNqRSxDQUFDO2dCQUVELElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO2dCQUUvQyxNQUFNLGFBQWEsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO29CQUMzQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNoQyxJQUFJLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7d0JBQ2xCLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNqRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDO3dCQUNyRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzFELENBQUM7Z0JBQ0wsQ0FBQyxDQUFDO2dCQUVGLElBQUksSUFBSSxDQUFDLFdBQVc7dUJBQ2hCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ2hELGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO2dCQUNELElBQUksSUFBSSxDQUFDLFdBQVc7dUJBQ2hCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ3ZELGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO2dCQUVELElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUNqQyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7b0JBQ3BCLElBQUksSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNoRCxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDekMsT0FBTyxHQUFHLElBQUksQ0FBQztvQkFDbkIsQ0FBQztvQkFDRCxJQUFJLElBQUksQ0FBQyxXQUFXOzJCQUNoQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUN2RCxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQzt3QkFDaEQsT0FBTyxHQUFHLElBQUksQ0FBQztvQkFDbkIsQ0FBQztvQkFDRCxJQUFJLENBQUUsT0FBTyxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDOUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDM0QsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQzt3QkFDckQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUN0RCwrR0FBK0c7b0JBQ25ILENBQUM7b0JBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUM7d0JBQ2pDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7d0JBQzNDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUM7d0JBQ3JELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDdEQsZ0hBQWdIO29CQUNwSCxDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztjQXFCRTtRQUNOLENBQUM7YUFBTSxDQUFDO1lBQ0osSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzdCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNqQyxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLElBQUk7UUFDaEMsa0VBQWtFO1FBQ2xFLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3hCLDhFQUE4RTtZQUM5RSxPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksVUFBVSxLQUFLLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxVQUFVLGNBQWMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDaEgsQ0FBQztRQUNELE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyx3SUFBd0k7UUFFeEksSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7UUFFdkIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRWhDLG9DQUFvQztRQUNwQyx5QkFBeUI7UUFDekIsMERBQTBEO1FBQzFELHFDQUFxQztRQUNyQyxpQkFBaUI7UUFDakIsRUFBRTtRQUNGLGtEQUFrRDtRQUNsRCwyREFBMkQ7UUFDM0QscURBQXFEO1FBQ3JELGtEQUFrRDtRQUNsRCw0QkFBNEI7UUFDNUIsRUFBRTtRQUNGLG9EQUFvRDtRQUNwRCx5REFBeUQ7UUFDekQscURBQXFEO1FBQ3JELHdDQUF3QztRQUV4QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ3BCLEtBQUssRUFBRTtnQkFDSCxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUs7YUFDbEI7WUFDRCxPQUFPLEVBQUU7Z0JBQ0wsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPO2FBQ3BCO1NBQ0osQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbEIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FrQkc7SUFFRixLQUFLLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxJQUFJO1FBQ2hDLGlFQUFpRTtRQUNoRSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN4Qiw4RUFBOEU7WUFDOUUsT0FBTztRQUNYLENBQUM7UUFDRCxJQUFJLFVBQVUsS0FBSyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsVUFBVSxjQUFjLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQzlHLENBQUM7UUFDRCxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsc0lBQXNJO1FBRXRJLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1FBRXZCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWxCLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJO1FBQ2pDLG1FQUFtRTtRQUNuRSxJQUFJLFVBQVUsS0FBSyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsVUFBVSxjQUFjLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ2pILENBQUM7UUFFRCxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXJELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsYUFBYSxDQUFDO1lBQ2YsS0FBSyxFQUFFO2dCQUNILEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSzthQUNsQjtZQUNELE9BQU8sRUFBRTtnQkFDTCxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU87YUFDcEI7U0FDSixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxVQUFVO1FBQ3hCLG9EQUFvRDtRQUNwRCxJQUFJLFVBQVUsS0FBSyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsVUFBVSxjQUFjLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQzlHLENBQUM7UUFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxJQUFJLENBQUMsTUFBTTtRQUVQLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNyQixDQUFDLENBQUMsTUFBTSxDQUFDO1FBRXJCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQztRQUNwQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDbEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQztZQUM5QixLQUFLLEVBQUU7Z0JBQ0gsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUM7Z0JBQzFCLEVBQUUsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFDO2FBQ2xDO1NBQ0osQ0FBQzthQUNELEtBQUssQ0FBQyxVQUFTLEdBQUc7WUFDZixPQUFPLENBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoQywwREFBMEQ7UUFDOUQsQ0FBQyxDQUFDO2FBQ0QsSUFBSSxDQUFDO1lBQ0YsVUFBVSxFQUFFLElBQUk7U0FDbkIsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxHQUFHLENBQUM7UUFDUixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMvQyxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLENBQUM7YUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN2RCxHQUFHLEdBQUcsU0FBUyxDQUFDO1FBQ3BCLENBQUM7YUFBTSxDQUFDO1lBQ0osR0FBRyxHQUFHLE9BQU8sQ0FBQztRQUNsQixDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0lBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNO1FBRW5CLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNyQixDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3JCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFakMsdURBQXVEO1FBQ3ZELGlEQUFpRDtRQUNqRCxzQ0FBc0M7UUFFdEMsTUFBTSxRQUFRLEdBQUc7WUFDYixLQUFLLEVBQUU7Z0JBQ0g7b0JBQ0ksS0FBSyxFQUFFO3dCQUNILEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTt3QkFDaEIsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO3FCQUN4QjtpQkFDSjthQUNKO1NBQ0osQ0FBQztRQUVGLElBQUksUUFBUSxDQUFDO1FBQ2IsSUFBSSxLQUFLLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLElBQUksS0FBSyxFQUFFLENBQUM7WUFDUixRQUFRLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUNoQyxDQUFDO2FBQU0sQ0FBQztZQUNKLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDckIsQ0FBQztRQUNELElBQUksU0FBUyxDQUFDO1FBQ2QsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7UUFDakIsT0FBTyxDQUFDLENBQUMsT0FBTyxLQUFLLEdBQUcsSUFBSSxPQUFPLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDbkQsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUMzQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDckQsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7WUFDRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUVqRCxtREFBbUQ7WUFDbkQsZ0NBQWdDO1lBRWhDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pCLEtBQUssRUFBRTtvQkFDSCxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7b0JBQ2xCLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRTtpQkFDMUI7YUFDSixDQUFDLENBQUM7WUFFSCxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ25CLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCwyRUFBMkU7UUFFM0UsT0FBTyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQzthQUN0QyxHQUFHLENBQUMsVUFBUyxHQUFHO1lBQ2IsR0FBRyxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDO1lBQzlCLEdBQUcsQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQztZQUMvQixHQUFHLENBQUMsUUFBUSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDO1lBQ3BDLE9BQU8sR0FBRyxDQUFDO1FBQ2YsQ0FBQyxDQUFDO2FBQ0QsT0FBTyxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVELFFBQVEsQ0FBQyxNQUFNO1FBQ1gsSUFBSSxHQUFHLENBQUM7UUFDUixJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUN4QixDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckIsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNuQixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLElBQUksT0FBTyxLQUFLLEdBQUc7WUFBRSxPQUFPLEdBQUcsR0FBRyxDQUFDO1FBRW5DLHlEQUF5RDtRQUV6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDcEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRWxDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2QsVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0MsVUFBVSxDQUFDLFNBQVMsQ0FBQztnQkFDakI7Ozs7cUJBSUs7Z0JBQ0wsYUFBYSxFQUFFLElBQUk7YUFDdEIsQ0FBQyxDQUFDO1lBQ0gsVUFBVSxDQUFDLFVBQVUsQ0FBQyxVQUFTLEdBQUc7Z0JBQzlCLE9BQU8sQ0FBRSxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsVUFBVSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQ0QsR0FBRyxHQUFHLFVBQVUsQ0FBQyxlQUFlLEVBQUU7YUFDakMsSUFBSSxDQUFDO1lBQ0YsT0FBTyxFQUFFLE9BQU87WUFDaEIsTUFBTSxFQUFFO2dCQUNKLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUMzQixFQUFFLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTthQUNuQztZQUNELGFBQWEsRUFBRSxJQUFJO1NBQ3RCLENBQUM7YUFDRCxJQUFJLENBQUM7WUFDRixVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDLENBQUM7UUFFSCxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFFRCxxREFBcUQ7SUFDckQsK0NBQStDO0lBRS9DLGlFQUFpRTtJQUNqRSxpRUFBaUU7SUFFakU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUErQkk7SUFFSixVQUFVLENBQUMsUUFBUTtRQUNmLElBQUksT0FBTyxHQUFHLFFBQVEsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUN0QyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdkIsQ0FBQyxDQUFDLFFBQVEsQ0FBQztRQUN2QixJQUFJLE9BQU8sS0FBSyxHQUFHO2VBQ2YsT0FBTyxLQUFLLEVBQUU7ZUFDZCxPQUFPLE9BQU8sS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUNqQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDbEMsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDaEIsWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbEQsWUFBWSxDQUFDLFNBQVMsQ0FBQztnQkFDbkIsS0FBSyxFQUFFO29CQUNILEVBQUUsVUFBVSxFQUFFLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxFQUFFO29CQUM3QyxFQUFFLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsRUFBQztpQkFDekM7YUFDSixDQUFDLENBQUM7WUFDSCxZQUFZLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxJQUFJLENBQUMsWUFBWTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUNwRSw2QkFBNkI7UUFDN0IsNkNBQTZDO1FBRTdDLE1BQU0sR0FBRyxHQUFHLFlBQVksQ0FBQyxlQUFlLEVBQUU7YUFDekMsS0FBSyxDQUFDLFVBQVMsR0FBRztZQUNmOzBDQUM4QjtZQUM5QixJQUFJLE9BQU8sS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUM7b0JBQUUsT0FBTyxJQUFJLENBQUM7O29CQUMxQyxPQUFPLEtBQUssQ0FBQztZQUN0QixDQUFDO2lCQUFNLENBQUM7Z0JBQ0osT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztRQUNMLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQztZQUNGLFVBQVUsRUFBRSxJQUFJO1NBQ25CLENBQUMsQ0FBQztRQUNILE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUVELHFEQUFxRDtJQUNyRCwwQ0FBMEM7SUFDMUMsR0FBRztJQUNILGdFQUFnRTtJQUNoRSxnRUFBZ0U7SUFHaEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFrQ0k7SUFFSiw2Q0FBNkM7SUFFN0MsMkRBQTJEO0lBQzNELDREQUE0RDtJQUM1RCxzREFBc0Q7SUFDdEQsMkJBQTJCO0lBRTNCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUEwQ0k7SUFFSixRQUFRO1FBQ0osTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDN0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ2xDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUU7YUFDdkIsS0FBSyxDQUFDLFVBQVMsR0FBRztZQUNmLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN6Qiw4REFBOEQ7Z0JBQzlELE9BQU8sS0FBSyxDQUFDO1lBQ2pCLENBQUM7WUFDRCxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sS0FBSyxDQUFDO1lBQ2pCLENBQUM7aUJBQU0sQ0FBQztnQkFDSixVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDMUIsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztRQUNMLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQztZQUNGLFVBQVUsRUFBRSxJQUFJO1NBQ25CLENBQUMsQ0FBQztRQUNILEtBQUssTUFBTSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7WUFFcEIsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO2dCQUMxQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUFBLENBQUM7Z0JBQ2pDLElBQUksQ0FBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDbEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzVCLEVBQUUsQ0FBQyxVQUFVLENBQ1QsR0FBRyxDQUFDLE1BQU0sRUFDVixFQUFFLEVBQ0YsRUFBRSxDQUNMLENBQUM7Z0JBQ04sQ0FBQztZQUNMLENBQUMsQ0FBQTtZQUNELElBQUksR0FBRyxDQUFDLFdBQVcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyQyxDQUFDO1lBQ0QsSUFBSSxHQUFHLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzVDLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUs7UUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDcEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUM3QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDbEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUN4QixVQUFVO1lBQ1YsNENBQTRDO1lBQzVDLEtBQUs7WUFDTCw0REFBNEQ7WUFDNUQseUJBQXlCO1lBQ3pCLG1EQUFtRDtZQUNuRCwwQkFBMEI7WUFDMUIsS0FBSzthQUNKLEtBQUssQ0FBQyxVQUFTLEdBQUc7WUFDZixJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsOERBQThEO2dCQUM5RCxPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1lBQ0QsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM1QixPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO2lCQUFNLENBQUM7Z0JBQ0osVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFCLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUM7UUFDTCxDQUFDLENBQUM7YUFDRCxJQUFJLENBQUM7WUFDRixVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ1gsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWU7Z0JBQ2hELENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWU7Z0JBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO1lBQ3hCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlO2dCQUNoRCxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlO2dCQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztZQUN4QixJQUFJLEtBQUssS0FBSyxLQUFLO2dCQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzlCLElBQUksS0FBSyxHQUFHLEtBQUs7Z0JBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFJLEtBQUssR0FBRyxLQUFLO2dCQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzVCLDJFQUEyRTtZQUMzRSwwRUFBMEU7WUFDMUUseUVBQXlFO1FBQzdFLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNQLE9BQVE7Z0JBQ0osTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNO2dCQUNsQixLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUs7Z0JBQ2hCLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVTtnQkFDMUIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVO2dCQUMxQixZQUFZLEVBQUUsR0FBRyxDQUFDLFlBQVk7Z0JBQzlCLDZCQUE2QjtnQkFDN0IsV0FBVyxFQUFFLEdBQUcsQ0FBQyxXQUFXO2dCQUM1QixRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVE7Z0JBQ3RCLHVFQUF1RTtnQkFDdkUsMERBQTBEO2dCQUMxRCxxQkFBcUI7Z0JBQ3JCLDREQUE0RDtnQkFDNUQsZUFBZSxFQUFFLEdBQUcsQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFO2dCQUNsRCxlQUFlLEVBQUUsR0FBRyxDQUFDLGVBQWU7YUFDdkMsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO1FBQ0gsY0FBYztRQUVkLHdDQUF3QztRQUN4QywrQ0FBK0M7UUFFL0MsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0lBRUQsaUJBQWlCO1FBQ2IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNoQyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1YsTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUNiLGFBQWEsRUFBRSxJQUFJO2FBQ3RCLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxHQUFHO2dCQUMzQixJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO29CQUFFLE9BQU8sS0FBSyxDQUFDO2dCQUN6QyxPQUFPLEdBQUcsQ0FBQyxRQUFRO3VCQUNaLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSTt1QkFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQzt1QkFDaEMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztZQUN6QyxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDZixVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsMERBQTBEO0lBQzFELDRDQUE0QztJQUM1QyxFQUFFO0lBQ0YsNkRBQTZEO0lBQzdELDZEQUE2RDtJQUc3RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBMkJJO0lBRUosSUFBSTtRQUNBOzs7Ozs7O2NBT007UUFDTixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNwQyxxQkFBcUI7UUFDckIsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2YsS0FBSyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNuQixLQUFLLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztvQkFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLENBQUM7UUFDTCxDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JCLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMzQixJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDM0IsSUFBSSxJQUFJLEdBQUcsSUFBSTtnQkFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksSUFBSSxHQUFHLElBQUk7Z0JBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUIsT0FBTyxDQUFDLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFHRCxNQUFNLENBQUMsT0FBTztRQUNWLHNCQUFzQjtRQUN0Qix1QkFBdUI7UUFFdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFFN0IsaURBQWlEO1FBRWpELElBQUksQ0FBQztZQUVMLHFEQUFxRDtZQUNyRCx3REFBd0Q7WUFDeEQsNkNBQTZDO1lBRTdDLE1BQU0sUUFBUSxHQUFRLEVBQUUsQ0FBQztZQUV6QixJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxPQUFPLE9BQU8sQ0FBQyxTQUFTLEtBQUssUUFBUTt1QkFDakMsQ0FBQyxPQUFPLE9BQU8sQ0FBQyxTQUFTLEtBQUssUUFBUTsyQkFDckMsT0FBTyxDQUFDLFNBQVMsWUFBWSxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUM1QyxRQUFRLENBQUMsS0FBSyxHQUFHO3dCQUNiLFFBQVEsRUFBRSxPQUFPLENBQUMsU0FBUztxQkFDOUIsQ0FBQTtnQkFDTCxDQUFDO3FCQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDMUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDckIsS0FBSyxNQUFNLEtBQUssSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ3BDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUN6RCxDQUFDO2dCQUNMLENBQUM7cUJBQU0sQ0FBQztvQkFDSixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxPQUFPLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN6SCxDQUFDO1lBQ0wsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUUxQixJQUFJLE9BQU8sT0FBTyxDQUFDLGVBQWUsS0FBSyxRQUFRO3VCQUM1QyxDQUFDLE9BQU8sT0FBTyxDQUFDLGVBQWUsS0FBSyxRQUFROzJCQUMxQyxPQUFPLENBQUMsZUFBZSxZQUFZLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQzlDLFFBQVEsQ0FBQyxVQUFVLEdBQUc7d0JBQ2xCLFFBQVEsRUFBRSxPQUFPLENBQUMsZUFBZTtxQkFDcEMsQ0FBQTtnQkFDTCxDQUFDO3FCQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztvQkFDaEQsSUFBSSxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxXQUFXLEVBQUUsQ0FBQzt3QkFDekMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDekIsQ0FBQztvQkFDRCxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQzt3QkFDMUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzlELENBQUM7Z0JBQ0wsQ0FBQztxQkFBTSxDQUFDO29CQUNKLE1BQU0sSUFBSSxLQUFLLENBQUMsNENBQTRDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekcsQ0FBQztZQUNMLENBQUM7WUFFRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixJQUFJLE9BQU8sT0FBTyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDbkMsUUFBUSxDQUFDLElBQUksR0FBRzt3QkFDWixLQUFLLEVBQUUsT0FBTyxDQUFDLElBQUk7cUJBQ3RCLENBQUM7Z0JBQ04sQ0FBQztxQkFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3JDLFFBQVEsQ0FBQyxJQUFJLEdBQUc7d0JBQ1osS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJO3FCQUN0QixDQUFDO2dCQUNOLENBQUMsQ0FBQzs7b0JBRUU7WUFDUixDQUFDO1lBRUQsSUFBSSxPQUFPLE9BQU8sQ0FBQyxhQUFhLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQy9DLFFBQVEsQ0FBQyxhQUFhLEdBQUcsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzlELENBQUM7WUFFRCxvQ0FBb0M7WUFDcEMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBRWpCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNoQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztpQkFDdEMsS0FBSyxDQUFDLFVBQVMsR0FBRztnQkFDZixJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQzVCLE9BQU8sS0FBSyxDQUFDO2dCQUNqQixDQUFDO3FCQUFNLENBQUM7b0JBQ0osVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzFCLE9BQU8sSUFBSSxDQUFDO2dCQUNoQixDQUFDO1lBQ0wsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxVQUFTLEdBQUc7Z0JBRWYsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztvQkFBRSxPQUFPLEtBQUssQ0FBQztnQkFFekMsNENBQTRDO2dCQUU1QyxpSEFBaUg7Z0JBQ2pILElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNsQixJQUFJLE9BQU8sQ0FBQztvQkFDWixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQ2pDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO29CQUM5QixDQUFDO3lCQUFNLENBQUM7d0JBQ0osT0FBTyxHQUFHLENBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBRSxDQUFDO29CQUNsQyxDQUFDO29CQUNELElBQUksR0FBRyxDQUFDLEtBQUs7MkJBQ1QsR0FBRyxDQUFDLFdBQVc7MkJBQ2YsR0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDOzRCQUM1QyxpSEFBaUg7NEJBQ2pILE9BQU8sS0FBSyxDQUFDO3dCQUNqQixDQUFDOzZCQUFNLENBQUM7NEJBQ0osK0dBQStHO3dCQUNuSCxDQUFDO29CQUNMLENBQUM7eUJBQU0sQ0FBQzt3QkFDSixtSEFBbUg7d0JBQ25ILE9BQU8sS0FBSyxDQUFDO29CQUNqQixDQUFDO2dCQUNMLENBQUM7Z0JBRUQsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ2QsSUFBSSxHQUFHLENBQUMsS0FBSzsyQkFDVCxHQUFHLENBQUMsV0FBVzsyQkFDZixHQUFHLENBQUMsV0FBVyxDQUFDLElBQUk7MkJBQ3BCLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO3dCQUN0QyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDOzRCQUM5QyxPQUFPLEtBQUssQ0FBQzt3QkFDakIsQ0FBQzt3QkFDRCwrRkFBK0Y7d0JBQy9GLDBCQUEwQjtvQkFDOUIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNKLCtCQUErQjt3QkFDL0IsT0FBTyxLQUFLLENBQUM7b0JBQ2pCLENBQUM7Z0JBQ0wsQ0FBQztnQkFFRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDbkIsSUFBSSxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDOUIseUVBQXlFO3dCQUN6RSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7NEJBQy9DLHlGQUF5Rjs0QkFFekYsT0FBTyxLQUFLLENBQUM7d0JBQ2pCLENBQUM7b0JBQ0wsQ0FBQztnQkFDTCxDQUFDO2dCQUVELElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNmLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNaLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzs0QkFDdEMsT0FBTyxLQUFLLENBQUM7d0JBQ2pCLENBQUM7b0JBQ0wsQ0FBQztnQkFDTCxDQUFDO2dCQUVELElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNyQixJQUFJLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDakIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDOzRCQUNqRCxPQUFPLEtBQUssQ0FBQzt3QkFDakIsQ0FBQztvQkFDTCxDQUFDO2dCQUNMLENBQUM7Z0JBRUQsSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7b0JBQ3hELElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN6RCx1REFBdUQ7b0JBQ3ZELElBQUksQ0FBQyxRQUFRO3dCQUFFLE9BQU8sS0FBSyxDQUFDO29CQUM1QixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7b0JBQ2xCLEtBQUssTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUNoQyx1RkFBdUY7d0JBQ3ZGLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7NEJBQy9DLEtBQUssR0FBRyxJQUFJLENBQUM7d0JBQ2pCLENBQUM7NkJBQU0sSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLEtBQUssVUFBVSxFQUFFLENBQUM7NEJBQzFELE9BQU8sQ0FBQyxLQUFLLENBQUMsbUVBQW1FLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQzFGLENBQUM7d0JBRUQsOENBQThDO3dCQUM5Qyw4Q0FBOEM7d0JBRTlDOzs7NEJBR0k7b0JBQ1IsQ0FBQztvQkFDRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ1QsaUdBQWlHO3dCQUNqRyxPQUFPLEtBQUssQ0FBQztvQkFDakIsQ0FBQztnQkFDTCxDQUFDO2dCQUVELElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNyQixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUNuRCxtREFBbUQ7d0JBQ25ELE9BQU8sS0FBSyxDQUFDO29CQUNqQixDQUFDO2dCQUNMLENBQUM7Z0JBRUQsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQyxDQUFDLENBQUE7WUFDRix5QkFBeUI7WUFDekIsdUNBQXVDO1lBQ3ZDLGlCQUFpQjtZQUNqQixzRUFBc0U7WUFDdEUsbUJBQW1CO1lBQ25CLE1BQU07WUFJTixJQUFJLElBQUksQ0FBQztZQUNULElBQUksT0FBTyxPQUFPLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNyQywwQ0FBMEM7Z0JBQzFDLDZEQUE2RDtnQkFDN0QsTUFBTTtnQkFDTixtQ0FBbUM7Z0JBQ25DLDZEQUE2RDtnQkFDN0QsbURBQW1EO2dCQUNuRCw2REFBNkQ7Z0JBQzdELFFBQVE7Z0JBQ1IsbURBQW1EO2dCQUNuRCw4REFBOEQ7Z0JBQzlELFFBQVE7Z0JBQ1IsTUFBTTtnQkFDTixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLEtBQUssSUFBSTtvQkFDdEMsQ0FBQyxDQUFDLENBQUUsQ0FBRSxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFFO29CQUM5QixDQUFDLENBQUMsQ0FBRSxPQUFPLENBQUMsTUFBTSxDQUFFLENBQUM7Z0JBQ2pDLDZGQUE2RjtnQkFDN0YsSUFBSSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEMsQ0FBQztpQkFBTSxJQUFJLE9BQU8sT0FBTyxDQUFDLFFBQVEsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7aUJBQU0sQ0FBQztnQkFDSixJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ2YsQ0FBQztZQUVELGdCQUFnQjtZQUNoQiw2QkFBNkI7WUFDN0IsdUNBQXVDO1lBQ3ZDLGlCQUFpQjtZQUNqQixxRUFBcUU7WUFDckUsbUJBQW1CO1lBQ25CLE1BQU07WUFFTixJQUFJLE9BQU8sT0FBTyxDQUFDLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDckMsa0RBQWtEO2dCQUNsRCxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUNELElBQUksT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNwQyxnREFBZ0Q7Z0JBQ2hELElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyQyxDQUFDO1lBQ0QsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDakIsVUFBVSxFQUFFLElBQUk7YUFDbkIsQ0FBQyxDQUFDO1lBRUgsSUFBSSxPQUFPLE9BQU8sQ0FBQyxNQUFNLEtBQUssUUFBUTttQkFDbEMsQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLGlCQUFpQjt1QkFDbkMsT0FBTyxDQUFDLE1BQU0sS0FBSyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7Z0JBRTFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUN0QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZTt3QkFDaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZTt3QkFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUM7b0JBQ3hCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlO3dCQUNoRCxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlO3dCQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztvQkFDeEIsSUFBSSxLQUFLLEtBQUssS0FBSzt3QkFBRSxPQUFPLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxLQUFLLEdBQUcsS0FBSzt3QkFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLEtBQUssR0FBRyxLQUFLO3dCQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUM1QiwyRUFBMkU7b0JBQzNFLDBFQUEwRTtvQkFDMUUseUVBQXlFO2dCQUM3RSxDQUFDLENBQUMsQ0FBQTtZQUNOLENBQUM7WUFFRDs7Ozs7O21CQU1PO1lBQ1AsSUFBSSxPQUFPLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUMzQix3Q0FBd0M7Z0JBQ3hDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFZjs7dUJBRU87WUFDWCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDWixDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxPQUFPLGVBQWUsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDL0QsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO0NBRTNFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyMiBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBsb2tpIGZyb20gJ2xva2lqcyc7XG5pbXBvcnQgeyBEaXJzV2F0Y2hlciB9IGZyb20gJ0Bha2FzaGFjbXMvc3RhY2tlZC1kaXJzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgdXJsICBmcm9tICd1cmwnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcyc7XG5pbXBvcnQgRlMgZnJvbSAnZnMnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaW1wb3J0IHsgbWluaW1hdGNoIH0gZnJvbSAnbWluaW1hdGNoJztcbmltcG9ydCBmYXN0cSBmcm9tICdmYXN0cSc7XG5cblxudmFyIGRiOyAgLy8gVXNlIHRvIGhvbGQgdGhlIExva2lKUyBkYXRhYmFzZSBvYmplY3RcbnZhciBjb2xsX2RvY3VtZW50cztcbnZhciBjb2xsX2Fzc2V0cztcbnZhciBjb2xsX2xheW91dHM7XG52YXIgY29sbF9wYXJ0aWFscztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwKGNvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBjYWNoZSBzZXR1cCAke2NvbmZpZy5jYWNoZURpcn1gKTtcbiAgICAgICAgZGIgPSBuZXcgbG9raSgnYWthc2hhcmVuZGVyJywge1xuICAgICAgICAgICAgYXV0b3NhdmU6IGNvbmZpZy5jYWNoZUF1dG9zYXZlLFxuICAgICAgICAgICAgYXV0b2xvYWQ6IGNvbmZpZy5jYWNoZUF1dG9sb2FkLFxuICAgICAgICAgICAgLy8gdmVyYm9zZTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICBjb2xsX2RvY3VtZW50cyA9IGdldENvbGxlY3Rpb24oJ2RvY3VtZW50cycpO1xuICAgICAgICAvLyBpZiAoIWNvbGxfZG9jdW1lbnRzKSBjb2xsX2RvY3VtZW50cyA9IGRiLmFkZENvbGxlY3Rpb24oJ2RvY3VtZW50cycpO1xuXG4gICAgICAgIGNvbGxfYXNzZXRzID0gZ2V0Q29sbGVjdGlvbignYXNzZXRzJyk7XG4gICAgICAgIC8vIGlmICghY29sbF9hc3NldHMpIGNvbGxfYXNzZXRzID0gZGIuYWRkQ29sbGVjdGlvbignYXNzZXRzJyk7XG5cbiAgICAgICAgY29sbF9sYXlvdXRzID0gZ2V0Q29sbGVjdGlvbignbGF5b3V0cycpO1xuICAgICAgICAvLyBpZiAoIWNvbGxfbGF5b3V0cykgY29sbF9sYXlvdXRzID0gZGIuYWRkQ29sbGVjdGlvbignbGF5b3V0cycpO1xuXG4gICAgICAgIGNvbGxfcGFydGlhbHMgPSBnZXRDb2xsZWN0aW9uKCdwYXJ0aWFscycpO1xuICAgICAgICAvLyBpZiAoIWNvbGxfcGFydGlhbHMpIGNvbGxfcGFydGlhbHMgPSBkYi5hZGRDb2xsZWN0aW9uKCdwYXJ0aWFscycpO1xuXG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbGVjYWNoZSBzZXR1cCBkb2N1bWVudHMgJHt1dGlsLmluc3BlY3QoY29uZmlnLmRvY3VtZW50RGlycyl9YCk7XG4gICAgICAgIGF3YWl0IHNldHVwRG9jdW1lbnRzKGNvbmZpZyk7XG4gICAgICAgIGF3YWl0IGNvbmZpZy5ob29rUGx1Z2luQ2FjaGVTZXR1cCgpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaWxlY2FjaGUgc2V0dXAgYXNzZXRzICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5hc3NldERpcnMpfWApO1xuICAgICAgICBhd2FpdCBzZXR1cEFzc2V0cyhjb25maWcpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaWxlY2FjaGUgc2V0dXAgbGF5b3V0cyAke3V0aWwuaW5zcGVjdChjb25maWcubGF5b3V0RGlycyl9YCk7XG4gICAgICAgIGF3YWl0IHNldHVwTGF5b3V0cyhjb25maWcpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaWxlY2FjaGUgc2V0dXAgcGFydGlhbHMgJHt1dGlsLmluc3BlY3QoY29uZmlnLnBhcnRpYWxzRGlycyl9YCk7XG4gICAgICAgIGF3YWl0IHNldHVwUGFydGlhbHMoY29uZmlnKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmlsZWNhY2hlIHNldHVwIGZpbmlzaGVkYCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYGNhY2hlLWxva2lqcyBzZXR1cCBGQUlMIFRPIElOSVRJQUxJWkUgYCwgZXJyKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsb3NlKCkge1xuXG4gICAgYXdhaXQgY2xvc2VGaWxlQ2FjaGVzKCk7XG5cbiAgICBkYi5jbG9zZSgpO1xuICAgIGRiID0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29sbGVjdGlvbihjb2xsX25hbWUpIHtcbiAgICBsZXQgY29sbCA9IGRiLmdldENvbGxlY3Rpb24oY29sbF9uYW1lKTtcbiAgICBpZiAoIWNvbGwpIHtcbiAgICAgICAgY29sbCA9IGRiLmFkZENvbGxlY3Rpb24oY29sbF9uYW1lLCB7XG4gICAgICAgICAgICBkaXNhYmxlTWV0YTogdHJ1ZSxcbiAgICAgICAgICAgIGluZGljZXM6IFsgXG4gICAgICAgICAgICAgICAgJ3ZwYXRoJywgJ3JlbmRlclBhdGgnLCAnYmFzZWRpcicsICdtb3VudFBvaW50JywgJ21vdW50ZWQnLFxuICAgICAgICAgICAgICAgICdkaXJuYW1lJ1xuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbGw7XG59XG5cbi8vIENvbnZlcnQgQWthc2hhQ01TIG1vdW50IHBvaW50cyBpbnRvIHRoZSBtb3VudHBvaW50XG4vLyB1c2VkIGJ5IERpcnNXYXRjaGVyXG5jb25zdCByZW1hcGRpcnMgPSBkaXJ6ID0+IHtcbiAgICByZXR1cm4gZGlyei5tYXAoZGlyID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2RvY3VtZW50IGRpciAnLCBkaXIpO1xuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6ICcvJyxcbiAgICAgICAgICAgICAgICBiYXNlTWV0YWRhdGE6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFkaXIuZGVzdCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVtYXBkaXJzIGludmFsaWQgbW91bnQgc3BlY2lmaWNhdGlvbiAke3V0aWwuaW5zcGVjdChkaXIpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIuc3JjLFxuICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5kZXN0LFxuICAgICAgICAgICAgICAgIGJhc2VNZXRhZGF0YTogZGlyLmJhc2VNZXRhZGF0YSxcbiAgICAgICAgICAgICAgICBpZ25vcmU6IGRpci5pZ25vcmVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qXG4gKiBOT1RJQ0UgdGhlcmUgYXJlIGhhbmRsZXJzIGZvciBgZXJyb3JgIGV2ZW50cyBoZXJlLlxuICogSSB3YXMgbm90IGFibGUgdG8gY29tZSB1cCB3aXRoIGEgbWV0aG9kIHRvIGF1dG9tYXRpY2FsbHkgZGV0ZWN0XG4gKiBpZiBhbiBlcnJvciBldmVudCBpcyB0aHJvd24gZnJvbSBhIEZpbGVDYWNoZSBpbnN0YW5jZS5cbiAqXG4gKiBUaGUgdGVzdCBzdWl0ZSBmb3IgdGhpcyBpcyBpbiBgYmFkLWZvcm1hdHRpbmcuanNgIGFuZCB0aGUgZ29hbCBpcyB0b1xuICogcnVuIHRob3NlIHRlc3RzLCBhdXRvbWF0aWNhbGx5IGRldGVybWluaW5nIHRoYXQgdGhlIGVycm9yIGlzIGZvdW5kLlxuICogQnV0IHRoZXNlIHNldHVwIGZ1bmN0aW9ucyBhcmUgbm90IGRpcmVjdGx5IGNhbGxlZCBpbiB0aGF0IHRlc3QgY2FzZS5cbiAqIERvIHdlIHJld3JpdGUgdGhlIHRlc3QgY2FzZSB0byBjYWxsIHRoZSBmdW5jdGlvbnMgaW4gYGNhY2hlU2V0dXBDb21wbGV0ZWBcbiAqIGFuZCBzZXQgdXAgZXJyb3IgaGFuZGxlcnMgdG8gZW5zdXJlIHRoZSBlcnJvciBpcyBlbWl0dGVkP1xuICpcbiAqIFVubGVzcyB3ZSBkbyBzb21ldGhpbmcgbGlrZSB0aGF0LCB0ZXN0aW5nIHRoaXMgZmVhdHVyZSB3aWxsIHJlcXVpcmUgYVxuICogbWFudWFsIHJ1biBvZiB0aGUgYmFkLWZvcm1hdHRpbmcgdGVzdHMuXG4gKi9cblxuXG5leHBvcnQgdmFyIGRvY3VtZW50cztcbmV4cG9ydCB2YXIgYXNzZXRzO1xuZXhwb3J0IHZhciBsYXlvdXRzO1xuZXhwb3J0IHZhciBwYXJ0aWFscztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwRG9jdW1lbnRzKGNvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaWxlY2FjaGUgc2V0dXAgZG9jdW1lbnRzICR7dXRpbC5pbnNwZWN0KGNvbmZpZyl9YCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaWxlY2FjaGUgc2V0dXAgZG9jdW1lbnRzICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5kb2N1bWVudERpcnMpfWApO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyh0eXBlb2YgY29uZmlnLmRvY3VtZW50RGlycyk7XG4gICAgICAgIGNvbnN0IGRvY3NEaXJzID0gcmVtYXBkaXJzKGNvbmZpZy5kb2N1bWVudERpcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2V0dXBEb2N1bWVudHMgYCwgZG9jc0RpcnMpO1xuICAgICAgICBkb2N1bWVudHMgPSBuZXcgRmlsZUNhY2hlKGNvbmZpZywgZG9jc0RpcnMsICdkb2N1bWVudHMnKTtcbiAgICAgICAgZG9jdW1lbnRzLm1hcFJlbmRlclBhdGggPSB0cnVlO1xuICAgICAgICBkb2N1bWVudHMub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVSUk9SIGluIGRvY3VtZW50cyBgLCBlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEZJTEVDQUNIRSBzZXR1cERvY3VtZW50cyAke3V0aWwuaW5zcGVjdChjb25maWcuZG9jdW1lbnREaXJzKX0gJHt1dGlsLmluc3BlY3QoZG9jc0RpcnMpfWApXG4gICAgICAgIGF3YWl0IGRvY3VtZW50cy5zZXR1cCgpO1xuICAgICAgICBhd2FpdCBjb25maWcuaG9va0ZpbGVDYWNoZVNldHVwKCdkb2N1bWVudHMnLCBkb2N1bWVudHMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmlsZWNhY2hlIEZJTklTSCBkb2N1bWVudHMgc2V0dXBgKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgZmlsZS1jYWNoZSBzZXR1cERvY3VtZW50cyBGQUlMIFRPIElOSVRJQUxJWkUgYCwgZXJyKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwQXNzZXRzKGNvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaWxlY2FjaGUgc2V0dXAgYXNzZXRzICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5hc3NldERpcnMpfWApO1xuICAgICAgICBjb25zdCBhc3NldHNEaXJzID0gcmVtYXBkaXJzKGNvbmZpZy5hc3NldERpcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmlsZWNhY2hlIHNldHVwIGFzc2V0cyAke3V0aWwuaW5zcGVjdChhc3NldHNEaXJzKX1gKTtcbiAgICAgICAgYXNzZXRzID0gbmV3IEZpbGVDYWNoZShjb25maWcsIGFzc2V0c0RpcnMsICdhc3NldHMnKTtcbiAgICAgICAgYXNzZXRzLm9uKCdlcnJvcicsIGVyciA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFUlJPUiBpbiBhc3NldHMgYCwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IGFzc2V0cy5zZXR1cCgpO1xuICAgICAgICBhd2FpdCBjb25maWcuaG9va0ZpbGVDYWNoZVNldHVwKCdhc3NldHMnLCBhc3NldHMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmlsZWNhY2hlIEZJTklTSCBhc3NldHMgc2V0dXBgKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgZmlsZS1jYWNoZSBzZXR1cEFzc2V0cyBGQUlMIFRPIElOSVRJQUxJWkUgYCwgZXJyKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwTGF5b3V0cyhjb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZmlsZWNhY2hlIHNldHVwIGxheW91dHMgJHt1dGlsLmluc3BlY3QoY29uZmlnLmRvY3VtZW50RGlycyl9YCk7XG4gICAgICAgIGNvbnN0IGxheW91dERpcnMgPSByZW1hcGRpcnMoY29uZmlnLmxheW91dERpcnMpO1xuICAgICAgICBsYXlvdXRzID0gbmV3IEZpbGVDYWNoZShjb25maWcsIGxheW91dERpcnMsICdsYXlvdXRzJyk7XG4gICAgICAgIGxheW91dHMub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVSUk9SIGluIGxheW91dHMgYCwgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGxheW91dHMuY2FjaGVDb250ZW50ID0gdHJ1ZTtcbiAgICAgICAgYXdhaXQgbGF5b3V0cy5zZXR1cCgpO1xuICAgICAgICBhd2FpdCBjb25maWcuaG9va0ZpbGVDYWNoZVNldHVwKCdsYXlvdXRzJywgbGF5b3V0cyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaWxlY2FjaGUgRklOSVNIIGxheW91dHMgc2V0dXBgKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgZmlsZS1jYWNoZSBzZXR1cExheW91dHMgRkFJTCBUTyBJTklUSUFMSVpFIGAsIGVycik7XG4gICAgICAgIHRocm93IGVycjtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cFBhcnRpYWxzKGNvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaWxlY2FjaGUgc2V0dXAgcGFydGlhbHMgJHt1dGlsLmluc3BlY3QoY29uZmlnLnBhcnRpYWxzRGlycyl9YCk7XG4gICAgICAgIGNvbnN0IHBhcnRpYWxzRGlycyA9IHJlbWFwZGlycyhjb25maWcucGFydGlhbHNEaXJzKTtcbiAgICAgICAgcGFydGlhbHMgPSBuZXcgRmlsZUNhY2hlKGNvbmZpZywgcGFydGlhbHNEaXJzLCAncGFydGlhbHMnKTtcbiAgICAgICAgcGFydGlhbHMub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVSUk9SIGluIHBhcnRpYWxzIGAsIGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICBwYXJ0aWFscy5jYWNoZUNvbnRlbnQgPSB0cnVlO1xuICAgICAgICBhd2FpdCBwYXJ0aWFscy5zZXR1cCgpO1xuICAgICAgICBhd2FpdCBjb25maWcuaG9va0ZpbGVDYWNoZVNldHVwKCdwYXJ0aWFscycsIHBhcnRpYWxzKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbGVjYWNoZSBGSU5JU0ggcGFydGlhbHMgc2V0dXBgKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgZmlsZS1jYWNoZSBzZXR1cFBhcnRpYWxzIEZBSUwgVE8gSU5JVElBTElaRSBgLCBlcnIpO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xvc2VGaWxlQ2FjaGVzKCkge1xuICAgIGlmIChkb2N1bWVudHMpIHtcbiAgICAgICAgYXdhaXQgZG9jdW1lbnRzLmNsb3NlKCk7XG4gICAgICAgIGRvY3VtZW50cyA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGFzc2V0cykge1xuICAgICAgICBhd2FpdCBhc3NldHMuY2xvc2UoKTtcbiAgICAgICAgYXNzZXRzID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAobGF5b3V0cykge1xuICAgICAgICBhd2FpdCBsYXlvdXRzLmNsb3NlKCk7XG4gICAgICAgIGxheW91dHMgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChwYXJ0aWFscykge1xuICAgICAgICBhd2FpdCBwYXJ0aWFscy5jbG9zZSgpO1xuICAgICAgICBwYXJ0aWFscyA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG5cbmNvbnN0IF9zeW1iX2NvbmZpZyA9IFN5bWJvbCgnY29uZmlnJyk7XG5jb25zdCBfc3ltYl9kaXJzID0gU3ltYm9sKCdkaXJzJyk7XG5jb25zdCBfc3ltYl9jb2xsbm0gPSBTeW1ib2woJ2NvbGxlY3Rpb24tbmFtZScpO1xuY29uc3QgX3N5bWJfd2F0Y2hlciA9IFN5bWJvbCgnd2F0Y2hlcicpO1xuY29uc3QgX3N5bWJfaXNfcmVhZHkgPSBTeW1ib2woJ2lzUmVhZHknKTtcbmNvbnN0IF9zeW1iX2NhY2hlX2NvbnRlbnQgPSBTeW1ib2woJ2NhY2hlQ29udGVudCcpO1xuY29uc3QgX3N5bWJfbWFwX3JlbmRlcnBhdGggPSBTeW1ib2woJ21hcFJlbmRlclBhdGgnKTtcbmNvbnN0IF9zeW1iX3F1ZXVlID0gU3ltYm9sKCdxdWV1ZScpO1xuXG5leHBvcnQgY2xhc3MgRmlsZUNhY2hlIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBjb25maWcgQWthc2hhUmVuZGVyIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAgICogQHBhcmFtIGRpcnMgYXJyYXkgb2YgZGlyZWN0b3JpZXMgYW5kIG1vdW50IHBvaW50cyB0byB3YXRjaFxuICAgICAqIEBwYXJhbSBjb2xsZWN0aW9uIHN0cmluZyBnaXZpbmcgdGhlIG5hbWUgZm9yIHRoaXMgd2F0Y2hlciBjb2xsZWN0aW9uXG4gICAgICogQHBhcmFtIHBlcnNpc3RQYXRoIHN0cmluZyBnaXZpbmcgdGhlIGxvY2F0aW9uIHRvIHBlcnNpc3QgdGhpcyBjb2xsZWN0aW9uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBkaXJzLCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBGaWxlQ2FjaGUgJHtjb2xsZWN0aW9ufSBjb25zdHJ1Y3RvciBkaXJzPSR7dXRpbC5pbnNwZWN0KGRpcnMpfWApO1xuICAgICAgICB0aGlzW19zeW1iX2NvbmZpZ10gPSBjb25maWc7XG4gICAgICAgIHRoaXNbX3N5bWJfZGlyc10gPSBkaXJzO1xuICAgICAgICB0aGlzW19zeW1iX2NvbGxubV0gPSBjb2xsZWN0aW9uO1xuICAgICAgICB0aGlzW19zeW1iX2lzX3JlYWR5XSA9IGZhbHNlO1xuICAgICAgICB0aGlzW19zeW1iX2NhY2hlX2NvbnRlbnRdID0gZmFsc2U7XG4gICAgICAgIHRoaXNbX3N5bWJfbWFwX3JlbmRlcnBhdGhdID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZ2V0IGNvbmZpZygpICAgICB7IHJldHVybiB0aGlzW19zeW1iX2NvbmZpZ107IH1cbiAgICBnZXQgZGlycygpICAgICAgIHsgcmV0dXJuIHRoaXNbX3N5bWJfZGlyc107IH1cbiAgICBnZXQgY29sbGVjdGlvbigpIHsgcmV0dXJuIHRoaXNbX3N5bWJfY29sbG5tXTsgfVxuICAgIHNldCBjYWNoZUNvbnRlbnQoZG9pdCkgeyB0aGlzW19zeW1iX2NhY2hlX2NvbnRlbnRdID0gZG9pdDsgfVxuICAgIGdldCBnYWNoZUNvbnRlbnQoKSB7IHJldHVybiB0aGlzW19zeW1iX2NhY2hlX2NvbnRlbnRdOyB9XG4gICAgc2V0IG1hcFJlbmRlclBhdGgoZG9pdCkgeyB0aGlzW19zeW1iX21hcF9yZW5kZXJwYXRoXSA9IGRvaXQ7IH1cbiAgICBnZXQgbWFwUmVuZGVyUGF0aCgpIHsgcmV0dXJuIHRoaXNbX3N5bWJfbWFwX3JlbmRlcnBhdGhdOyB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBMb2tpSlMgZHluYW1pYyB2aWV3IHRvIHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIEZpbGVDYWNoZS5cbiAgICAgKiBJdCBpcyB1cCB0byB0aGUgY2FsbGVyIG9mIHRoaXMgZnVuY3Rpb24gdG8gY29uZmlndXJlIHRoZVxuICAgICAqIGR5bmFtaWMgdmlldy4gIFRoaXMgZnVuY3Rpb24gZmlyc3QgY2FsbHMgPGNvZGU+Z2V0RHluYW1pY1ZpZXc8L2NvZGU+XG4gICAgICogdG8gc2VlIGlmIHRoZXJlIGlzIGFuIGV4aXN0aW5nIHZpZXcsIGFuZCBpZiBub3QgaXQgY2FsbHNcbiAgICAgKiA8Y29kZT5hZGREeW5taWNWaWV3PC9jb2RlPiB0byBhZGQgaXQuICBJZiBhZGRpbmcgYSB2aWV3LCB0aGVcbiAgICAgKiA8Y29kZT5vcHRpb25zPC9jb2RlPiBwYXJhbWV0ZXIgaXMgcGFzc2VkIGluIHRvIGNvbmZpZ3VyZSB0aGVcbiAgICAgKiBiZWhhdmlvciBvZiB0aGUgdmlldy5cbiAgICAgKiBcbiAgICAgKiBTZWU6IGh0dHA6Ly90ZWNoZm9ydC5naXRodWIuaW8vTG9raUpTL0R5bmFtaWNWaWV3Lmh0bWxcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0geyp9IHZuYW1lIFxuICAgICAqIEBwYXJhbSB7Kn0gb3B0aW9ucyBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBnZXREeW5hbWljVmlldyh2bmFtZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAodHlwZW9mIHZuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBnZXREeW5hbWljVmlldyBpbnZhbGlkIHZpZXcgbmFtZSAke3V0aWwuaW5zcGVjdCh2bmFtZSl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdncgPSB0aGlzLmNvbGxlY3Rpb24uZ2V0RHluYW1pY1ZpZXcodm5hbWUpO1xuICAgICAgICBpZiAodncpIHJldHVybiB2dztcbiAgICAgICAgZWxzZSByZXR1cm4gdGhpcy5jb2xsZWN0aW9uLmFkZER5bmFtaWNWaWV3KHZuYW1lLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdXAgcmVjZWl2aW5nIGV2ZW50cyBmcm9tIERpcnNXYXRjaGVyLCBhbmQgZGlzcGF0Y2hpbmcgdG9cbiAgICAgKiB0aGUgaGFuZGxlciBtZXRob2RzLlxuICAgICAqL1xuICAgIGFzeW5jIHNldHVwKCkge1xuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuXG4gICAgICAgIGlmICh0aGlzW19zeW1iX3dhdGNoZXJdKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzW19zeW1iX3dhdGNoZXJdLmNsb3NlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzW19zeW1iX3F1ZXVlXSA9IGZhc3RxLnByb21pc2UoYXN5bmMgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5jb2xsZWN0aW9uICE9PSBmY2FjaGUuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlQ2hhbmdlZCBldmVudCBmb3Igd3JvbmcgY29sbGVjdGlvbjsgZ290ICR7ZXZlbnQuY29sbGVjdGlvbn0sIGV4cGVjdGVkICR7ZmNhY2hlLmNvbGxlY3Rpb259YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXZlbnQuY29kZSA9PT0gJ2NoYW5nZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGNoYW5nZSAke2V2ZW50LmNvbGxlY3Rpb259ICR7ZXZlbnQuaW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmNhY2hlLmhhbmRsZUNoYW5nZWQoZXZlbnQuY29sbGVjdGlvbiwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdjaGFuZ2UnLCBldmVudC5jb2xsZWN0aW9uLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBldmVudC5jb2xsZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdhZGRlZCcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgYWRkICR7ZXZlbnQuY29sbGVjdGlvbn0gJHtldmVudC5pbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlQWRkZWQoZXZlbnQuY29sbGVjdGlvbiwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdhZGQnLCBldmVudC5jb2xsZWN0aW9uLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBldmVudC5jb2xsZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICd1bmxpbmtlZCcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgdW5saW5rICR7ZXZlbnQuY29sbGVjdGlvbn0gJHtldmVudC5pbmZvLnZwYXRofWAsIGV2ZW50LmluZm8pO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlVW5saW5rZWQoZXZlbnQuY29sbGVjdGlvbiwgZXZlbnQuaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCd1bmxpbmsnLCBldmVudC5jb2xsZWN0aW9uLCBldmVudC5pbmZvKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZjYWNoZS5lbWl0KCdlcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBldmVudC5jb2xsZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGV2ZW50LmluZm8udnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmNvZGUgPT09ICdyZWFkeScpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmY2FjaGUuaGFuZGxlUmVhZHkoZXZlbnQuY29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgZmNhY2hlLmVtaXQoJ3JlYWR5JywgZXZlbnQuY29sbGVjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmaWxlLWNhY2hlICR7dGhpcy5jb2xsZWN0aW9ufSBzZXR1cCBEaXJzV2F0Y2hlciAke3V0aWwuaW5zcGVjdCh0aGlzLmRpcnMpfWApO1xuICAgICAgICB0aGlzW19zeW1iX3dhdGNoZXJdID0gbmV3IERpcnNXYXRjaGVyKHRoaXMuY29sbGVjdGlvbik7XG5cbiAgICAgICAgdGhpc1tfc3ltYl93YXRjaGVyXS5vbignY2hhbmdlJywgYXN5bmMgKGNvbGxlY3Rpb24sIGluZm8pID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2NvbGxlY3Rpb259IGNoYW5nZWQgJHtpbmZvLm1vdW50UG9pbnR9ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFBVU0ggJHtjb2xsZWN0aW9ufSBjaGFuZ2VkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpc1tfc3ltYl9xdWV1ZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnY2hhbmdlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLCBpbmZvXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJZ25vcmVkICdjaGFuZ2UnIGZvciAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRkFJTCBjaGFuZ2UgJHtpbmZvLnZwYXRofSBiZWNhdXNlICR7ZXJyLnN0YWNrfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ2FkZCcsIGFzeW5jIChjb2xsZWN0aW9uLCBpbmZvKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke2NvbGxlY3Rpb259IGFkZCAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pZ25vcmVGaWxlKGluZm8pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBQVVNIICR7Y29sbGVjdGlvbn0gYWRkICR7aW5mby5tb3VudFBvaW50fSAke2luZm8udnBhdGh9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpc1tfc3ltYl9xdWV1ZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAnYWRkZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbiwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAnYWRkJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZBSUwgYWRkICR7aW5mby52cGF0aH0gYmVjYXVzZSAke2Vyci5zdGFja31gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCd1bmxpbmsnLCBhc3luYyAoY29sbGVjdGlvbiwgaW5mbykgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHVubGluayAke2NvbGxlY3Rpb259ICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tfc3ltYl9xdWV1ZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAndW5saW5rZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbiwgaW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgSWdub3JlZCAndW5saW5rJyBmb3IgJHtpbmZvLnZwYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGQUlMIHVubGluayAke2luZm8udnBhdGh9IGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigncmVhZHknLCBhc3luYyAoY29sbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCR7Y29sbGVjdGlvbn0gcmVhZHlgKTtcbiAgICAgICAgICAgIHRoaXNbX3N5bWJfcXVldWVdLnB1c2goe1xuICAgICAgICAgICAgICAgIGNvZGU6ICdyZWFkeScsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXNbX3N5bWJfd2F0Y2hlcl0pO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBGaWxlQ2FjaGUgc2V0dXAgZGlycyAke3V0aWwuaW5zcGVjdCh0aGlzLmRpcnMpfWApO1xuXG4gICAgICAgIGF3YWl0IHRoaXNbX3N5bWJfd2F0Y2hlcl0ud2F0Y2godGhpcy5kaXJzKTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGRpcmVjdG9yeSBtb3VudCBjb3JyZXNwb25kaW5nIHRvIHRoZSBmaWxlLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7Kn0gaW5mbyBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBmaWxlRGlyTW91bnQoaW5mbykge1xuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLmRpcnMpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkaXJNb3VudCBmb3IgJHtpbmZvLnZwYXRofSAtLSAke3V0aWwuaW5zcGVjdChpbmZvKX0gPT09ICR7dXRpbC5pbnNwZWN0KGRpcil9YCk7XG4gICAgICAgICAgICBpZiAoaW5mby5tb3VudFBvaW50ID09PSBkaXIubW91bnRQb2ludCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaG91bGQgdGhpcyBmaWxlIGJlIGlnbm9yZWQsIGJhc2VkIG9uIHRoZSBgaWdub3JlYCBmaWVsZFxuICAgICAqIGluIHRoZSBtYXRjaGluZyBgZGlyYCBtb3VudCBlbnRyeS5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0geyp9IGluZm8gXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgaWdub3JlRmlsZShpbmZvKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpZ25vcmVGaWxlICR7aW5mby52cGF0aH1gKTtcbiAgICAgICAgY29uc3QgZGlyTW91bnQgPSB0aGlzLmZpbGVEaXJNb3VudChpbmZvKTtcbiAgICAgICAgbGV0IGlnbm9yZSA9IGZhbHNlO1xuICAgICAgICBpZiAoZGlyTW91bnQpIHtcblxuICAgICAgICAgICAgbGV0IGlnbm9yZXM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRpck1vdW50Lmlnbm9yZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVzID0gWyBkaXJNb3VudC5pZ25vcmUgXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkaXJNb3VudC5pZ25vcmUpKSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IGRpck1vdW50Lmlnbm9yZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWdub3JlcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBpIG9mIGlnbm9yZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAobWluaW1hdGNoKGluZm8udnBhdGgsIGkpKSBpZ25vcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkaXJNb3VudC5pZ25vcmUgJHtmc3BhdGh9ICR7aX0gPT4gJHtpZ25vcmV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiAoaWdub3JlKSBjb25zb2xlLmxvZyhgaWdub3JlRmlsZSAke2luZm8udnBhdGh9YCk7XG4gICAgICAgICAgICByZXR1cm4gaWdub3JlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gbm8gbW91bnQ/ICB0aGF0IG1lYW5zIHNvbWV0aGluZyBzdHJhbmdlXG4gICAgICAgICAgICAvLyBjb25zb2xlLmVycm9yKGBObyBkaXJNb3VudCBmb3VuZCBmb3IgJHtpbmZvLnZwYXRofSAvICR7aW5mby5kaXJNb3VudGVkT259YCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFsbG93IGEgY2FsbGVyIHRvIHdhaXQgdW50aWwgdGhlIDxlbT5yZWFkeTwvZW0+IGV2ZW50IGhhc1xuICAgICAqIGJlZW4gc2VudCBmcm9tIHRoZSBEaXJzV2F0Y2hlciBpbnN0YW5jZS4gIFRoaXMgZXZlbnQgbWVhbnMgdGhlXG4gICAgICogaW5pdGlhbCBpbmRleGluZyBoYXMgaGFwcGVuZWQuXG4gICAgICovXG4gICAgIGFzeW5jIGlzUmVhZHkoKSB7XG4gICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZGlyZWN0b3JpZXMsIHRoZXJlIHdvbid0IGJlIGFueSBmaWxlcyBcbiAgICAgICAgLy8gdG8gbG9hZCwgYW5kIG5vIG5lZWQgdG8gd2FpdFxuICAgICAgICB3aGlsZSAodGhpc1tfc3ltYl9kaXJzXS5sZW5ndGggPiAwICYmICF0aGlzW19zeW1iX2lzX3JlYWR5XSkge1xuICAgICAgICAgICAgLy8gVGhpcyBkb2VzIGEgMTAwbXMgcGF1c2VcbiAgICAgICAgICAgIC8vIFRoYXQgbGV0cyB1cyBjaGVjayBpc19yZWFkeSBldmVyeSAxMDBtc1xuICAgICAgICAgICAgLy8gYXQgdmVyeSBsaXR0bGUgY29zdFxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCFpc1JlYWR5ICR7dGhpcy5jb2xsZWN0aW9ufSAke3RoaXNbX3N5bWJfZGlyc10ubGVuZ3RofSAke3RoaXNbX3N5bWJfaXNfcmVhZHldfWApO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9ICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzW19zeW1iX3F1ZXVlXSkge1xuICAgICAgICAgICAgdGhpc1tfc3ltYl9xdWV1ZV0ua2lsbEFuZERyYWluKCk7XG4gICAgICAgICAgICB0aGlzW19zeW1iX3F1ZXVlXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpc1tfc3ltYl93YXRjaGVyXSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYENMT1NJTkcgJHt0aGlzLmNvbGxlY3Rpb259YCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzW19zeW1iX3dhdGNoZXJdLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzW19zeW1iX3dhdGNoZXJdID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdjaGFuZ2VkJyk7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdhZGRlZCcpO1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygndW5saW5rZWQnKTtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlYWR5Jyk7XG4gICAgfVxuXG4gICAgZ2V0Q29sbGVjdGlvbihjb2xsZWN0aW9uPzogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBkYi5nZXRDb2xsZWN0aW9uKHR5cGVvZiBjb2xsZWN0aW9uID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgPyBjb2xsZWN0aW9uXG4gICAgICAgICAgICA6IHRoaXMuY29sbGVjdGlvbik7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2F0aGVySW5mb0RhdGEoaW5mbykge1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpbmZvLnN0YXRzID0gYXdhaXQgZnMuc3RhdChpbmZvLmZzcGF0aCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc3RhdCBmb3IgJHtpbmZvLmZzcGF0aH0gZmFpbGVkIGJlY2F1c2UgJHtlcnIuc3RhY2t9YCk7XG4gICAgICAgICAgICBpbmZvLnN0YXRzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucmVuZGVyUGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIGluZm8uZGlybmFtZSA9IHBhdGguZGlybmFtZShpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKGluZm8uZGlybmFtZSA9PT0gJy4nKSBpbmZvLmRpcm5hbWUgPSAnLyc7XG4gICAgICAgIGZvciAobGV0IGRpciBvZiB0aGlzLmRpcnMpIHtcbiAgICAgICAgICAgIGlmIChkaXIubW91bnRlZCA9PT0gaW5mby5tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpci5iYXNlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5iYXNlTWV0YWRhdGEgPSBkaXIuYmFzZU1ldGFkYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVzZSBmaWVsZHMgd2VyZSBzdXBwb3J0ZWQgaW4gdGhlIG9sZFxuICAgICAgICAvLyByZWFkRG9jdW1lbnQgZnVuY3Rpb25cbiAgICAgICAgaW5mby5iYXNlZGlyID0gaW5mby5tb3VudGVkO1xuICAgICAgICBpbmZvLmRpck1vdW50ZWRPbiA9IGluZm8ubW91bnRQb2ludDtcbiAgICAgICAgaW5mby5tb3VudGVkRGlyTWV0YWRhdGEgPSBpbmZvLmJhc2VNZXRhZGF0YTtcbiAgICAgICAgaW5mby5kb2NwYXRoID0gaW5mby5wYXRoSW5Nb3VudGVkO1xuICAgICAgICBpbmZvLmRvY2Rlc3RwYXRoID0gaW5mby52cGF0aDtcblxuICAgICAgICAvLyBpbmZvLnB1YmxpY2F0aW9uRGF0ZSBpcyBhIHVuaXgvSmF2YVNjcmlwdCB0aW1lc3RhbXBcbiAgICAgICAgLy8gd2UgY2FuIHVzZSB0byBzb3J0IGRvY3VtZW50cyBvbiBkYXRlXG5cbiAgICAgICAgaWYgKGluZm8uc3RhdHMgJiYgaW5mby5zdGF0cy5tdGltZSkge1xuICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBuZXcgRGF0ZShpbmZvLnN0YXRzLm10aW1lKTtcbiAgICAgICAgICAgIGluZm8ucHVibGljYXRpb25UaW1lID0gaW5mby5wdWJsaWNhdGlvbkRhdGUuZ2V0VGltZSgpO1xuICAgICAgICAgICAgaW5mby5tdGltZSA9IGluZm8ucHVibGljYXRpb25EYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChpbmZvLnZwYXRoKTtcbiAgICAgICAgaW5mby5yZW5kZXJlciA9IHJlbmRlcmVyO1xuICAgICAgICBpZiAocmVuZGVyZXIpIHtcbiAgICAgICAgICAgIC8vIFRoZXNlIGZpZWxkcyB3ZXJlIHN1cHBvcnRlZCBpbiB0aGUgb2xkXG4gICAgICAgICAgICAvLyByZWFkRG9jdW1lbnQgZnVuY3Rpb25cbiAgICAgICAgICAgIC8vIE5vdGUgdGhhdCBzb21lIEZpbGVDYWNoZSdzIGRvIG5vdCB3YW50IHRvIG1vZGlmeVxuICAgICAgICAgICAgLy8gdGhpcyBmcm9tIHZwYXRoIC0tIHN1Y2ggYXMgcGFydGlhbHMgYW5kIGxheW91dHMuXG4gICAgICAgICAgICBpbmZvLnJlbmRlclBhdGggPSB0aGlzLm1hcFJlbmRlclBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHJlbmRlcmVyLmZpbGVQYXRoKGluZm8udnBhdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBpbmZvLnZwYXRoO1xuICAgICAgICAgICAgaW5mby5yZW5kZXJwYXRoID0gaW5mby5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgaW5mby5yZW5kZXJuYW1lID0gcGF0aC5iYXNlbmFtZShpbmZvLnJlbmRlclBhdGgpO1xuICAgICAgICAgICAgaW5mby5yZW5kZXJzVG9IVE1MID0gbWluaW1hdGNoKGluZm8ucmVuZGVyUGF0aCwgJyoqLyouaHRtbCcpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBSZW5kZXJlZEZpbGVDYWNoZSAke2luZm8udnBhdGh9ID09PiByZW5kZXJQYXRoICR7aW5mby5yZW5kZXJQYXRofWApO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVyICYmIHJlbmRlcmVyLnBhcnNlTWV0YWRhdGEpIHtcblxuICAgICAgICAgICAgICAgIC8vIFJlbmRlcmVyLnBhcnNlTWV0YWRhdGEgZGVmYXVsdHMgdG8gZG9pbmcgbm90aGluZy5cbiAgICAgICAgICAgICAgICAvLyBGb3IgYSByZW5kZXJlciB0aGF0IGNhbiByZWFkIGRhdGEsIHN1Y2ggYXMgdGhlXG4gICAgICAgICAgICAgICAgLy8gZnJvbnRtYXR0ZXIgdXNlZCB3aXRoIG1vc3QgSFRNTCByZW5kZXJpbmcgZmlsZXMsXG4gICAgICAgICAgICAgICAgLy8gdGhlIHBhcnNlTWV0YWRhdGEgZnVuY3Rpb24gd2lsbCBkbyBzb21ldGhpbmcgZWxzZS5cbiAgICAgICAgICAgICAgICAvLyBJbiBzdWNoIGNhc2VzIHRoZSByYyAoUmVuZGVyaW5nQ29udGV4dCkgd2lsbFxuICAgICAgICAgICAgICAgIC8vIGNvbnRhaW4gc29tZSBkYXRhLlxuXG4gICAgICAgICAgICAgICAgY29uc3QgcmMgPSByZW5kZXJlci5wYXJzZU1ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoOiBpbmZvLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogYXdhaXQgZnMucmVhZEZpbGUoaW5mby5mc3BhdGgsICd1dGYtOCcpXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkb2NNZXRhZGF0YSBpcyB0aGUgdW5tb2RpZmllZCBtZXRhZGF0YS9mcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBkb2N1bWVudFxuICAgICAgICAgICAgICAgIGluZm8uZG9jTWV0YWRhdGEgPSByYy5tZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvLyBkb2NDb250ZW50IGlzIHRoZSB1bnBhcnNlZCBvcmlnaW5hbCBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gaW5jbHVkaW5nIGFueSBmcm9udG1hdHRlclxuICAgICAgICAgICAgICAgIGluZm8uZG9jQ29udGVudCA9IHJjLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgLy8gZG9jQm9keSBpcyB0aGUgcGFyc2VkIGJvZHkgLS0gZS5nLiBmb2xsb3dpbmcgdGhlIGZyb250bWF0dGVyXG4gICAgICAgICAgICAgICAgaW5mby5kb2NCb2R5ID0gcmMuYm9keTtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBjb21wdXRlZCBtZXRhZGF0YSB0aGF0IGluY2x1ZGVzIGRhdGEgZnJvbSBcbiAgICAgICAgICAgICAgICAvLyBzZXZlcmFsIHNvdXJjZXNcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhID0geyB9O1xuICAgICAgICAgICAgICAgIGlmICghaW5mby5kb2NNZXRhZGF0YSkgaW5mby5kb2NNZXRhZGF0YSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlc3Qgb2YgdGhpcyBpcyBhZGFwdGVkIGZyb20gdGhlIG9sZCBmdW5jdGlvblxuICAgICAgICAgICAgICAgIC8vIEhUTUxSZW5kZXJlci5uZXdJbml0TWV0YWRhdGFcblxuICAgICAgICAgICAgICAgIC8vIEZvciBzdGFydGVycyB0aGUgbWV0YWRhdGEgaXMgY29sbGVjdGVkIGZyb20gc2V2ZXJhbCBzb3VyY2VzLlxuICAgICAgICAgICAgICAgIC8vIDEpIHRoZSBtZXRhZGF0YSBzcGVjaWZpZWQgaW4gdGhlIGRpcmVjdG9yeSBtb3VudCB3aGVyZVxuICAgICAgICAgICAgICAgIC8vICAgIHRoaXMgZG9jdW1lbnQgd2FzIGZvdW5kXG4gICAgICAgICAgICAgICAgLy8gMikgbWV0YWRhdGEgaW4gdGhlIHByb2plY3QgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgICAgIC8vIDMpIHRoZSBtZXRhZGF0YSBpbiB0aGUgZG9jdW1lbnQsIGFzIGNhcHR1cmVkIGluIGRvY01ldGFkYXRhXG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5cHJvcCBpbiBpbmZvLmJhc2VNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW5pdE1ldGFkYXRhICR7YmFzZWRpcn0gJHtmcGF0aH0gYmFzZU1ldGFkYXRhICR7YmFzZU1ldGFkYXRhW3lwcm9wXX1gKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSBpbmZvLmJhc2VNZXRhZGF0YVt5cHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIHRoaXMuY29uZmlnLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGFbeXByb3BdID0gdGhpcy5jb25maWcubWV0YWRhdGFbeXByb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgZm1tY291bnQgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHlwcm9wIGluIGluZm8uZG9jTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YVt5cHJvcF0gPSBpbmZvLmRvY01ldGFkYXRhW3lwcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgZm1tY291bnQrKztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgcmVuZGVyZWQgdmVyc2lvbiBvZiB0aGUgY29udGVudCBsYW5kcyBoZXJlXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5jb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAvLyBUaGUgZG9jdW1lbnQgb2JqZWN0IGhhcyBiZWVuIHVzZWZ1bCBmb3IgXG4gICAgICAgICAgICAgICAgLy8gY29tbXVuaWNhdGluZyB0aGUgZmlsZSBwYXRoIGFuZCBvdGhlciBkYXRhLlxuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQgPSB7fTtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LmJhc2VkaXIgPSBpbmZvLm1vdW50UG9pbnQ7XG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZWxwYXRoID0gaW5mby5wYXRoSW5Nb3VudGVkO1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVscmVuZGVyID0gcmVuZGVyZXIuZmlsZVBhdGgoaW5mby5wYXRoSW5Nb3VudGVkKTtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLmRvY3VtZW50LnBhdGggPSBpbmZvLnZwYXRoO1xuICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8gPSBpbmZvLnJlbmRlclBhdGg7XG5cblxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSB0aGUgPGVtPnRhZ3M8L2VtPiBmaWVsZCBpcyBhbiBhcnJheVxuICAgICAgICAgICAgICAgIGlmICghKGluZm8ubWV0YWRhdGEudGFncykpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzID0gW107XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKGluZm8ubWV0YWRhdGEudGFncykgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0YWdsaXN0ID0gW107XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlID0gL1xccyosXFxzKi87XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEudGFncy5zcGxpdChyZSkuZm9yRWFjaCh0YWcgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFnbGlzdC5wdXNoKHRhZy50cmltKCkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS50YWdzID0gdGFnbGlzdDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KGluZm8ubWV0YWRhdGEudGFncykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgYEZPUk1BVCBFUlJPUiAtICR7aW5mby52cGF0aH0gaGFzIGJhZGx5IGZvcm1hdHRlZCB0YWdzIGAsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnRhZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhLnRhZ3MgPSBpbmZvLm1ldGFkYXRhLnRhZ3M7XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFRoZSByb290IFVSTCBmb3IgdGhlIHByb2plY3RcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJvb3RfdXJsID0gdGhpcy5jb25maWcucm9vdF91cmw7XG5cbiAgICAgICAgICAgICAgICAvLyBDb21wdXRlIHRoZSBVUkwgdGhpcyBkb2N1bWVudCB3aWxsIHJlbmRlciB0b1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcFJvb3RVcmwgPSB1cmwucGFyc2UodGhpcy5jb25maWcucm9vdF91cmwpO1xuICAgICAgICAgICAgICAgICAgICBwUm9vdFVybC5wYXRobmFtZSA9IHBhdGgubm9ybWFsaXplKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihwUm9vdFVybC5wYXRobmFtZSwgaW5mby5tZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbylcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF91cmwgPSB1cmwuZm9ybWF0KHBSb290VXJsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnJlbmRlcmVkX3VybCA9IGluZm8ubWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG87XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaW5mby5tZXRhZGF0YS5yZW5kZXJlZF9kYXRlID0gaW5mby5zdGF0cy5tdGltZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlUHVibERhdGUgPSAoZGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBEYXRlLnBhcnNlKGRhdGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoISBpc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbmZvLmRvY01ldGFkYXRhXG4gICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VQdWJsRGF0ZShpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0ZVNldCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5kb2NNZXRhZGF0YSAmJiBpbmZvLmRvY01ldGFkYXRhLnB1YmxEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVB1YmxEYXRlKGluZm8uZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBpbmZvLmRvY01ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUHVibERhdGUoaW5mby5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEgZGF0ZVNldCAmJiBpbmZvLnN0YXRzICYmIGluZm8uc3RhdHMubXRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID0gbmV3IERhdGUoaW5mby5zdGF0cy5tdGltZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gc3RhdHMubXRpbWVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uRGF0ZSA9IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvblRpbWUgPSBpbmZvLnB1YmxpY2F0aW9uRGF0ZS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtpbmZvLnZwYXRofSBtZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgJHtpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZX0gc2V0IGZyb20gY3VycmVudCB0aW1lYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8qIC0tIEZvciByZWZlcmVuY2UsIHRoZSBvbGQgY29kZVxuICAgICAgICAgICAgaWYgKHJlbmRlcmVyXG4gICAgICAgICAgICAgJiYgcmVuZGVyZXIucmVhZENvbnRlbnRcbiAgICAgICAgICAgICAmJiByZW5kZXJlci5wYXJzZUZyb250bWF0dGVyKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFJlbmRlcmVkRmlsZUNhY2hlIGJlZm9yZSByZWFkQ29udGVudCAke2luZm8udnBhdGh9ICR7aW5mby5tb3VudGVkfSAke2luZm8ubW91bnRQb2ludH0gJHtpbmZvLnBhdGhJbk1vdW50ZWR9YCk7XG4gICAgICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSBhd2FpdCByZW5kZXJlci5yZWFkQ29udGVudChcbiAgICAgICAgICAgICAgICAgICAgaW5mby5tb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBpbmZvLnBhdGhJbk1vdW50ZWQpO1xuICAgICAgICAgICAgICAgIGxldCBmbSA9IHJlbmRlcmVyLnBhcnNlRnJvbnRtYXR0ZXIoY29udGVudCk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFJlbmRlcmVkRmlsZUNhY2hlIGdvdCBkb2N1bWVudCBtZXRhZGF0YSAke2luZm8udnBhdGh9YCwgZm0uZGF0YSk7XG4gICAgICAgICAgICAgICAgaW5mby5kb2NNZXRhZGF0YSA9IGZtLmRhdGE7XG4gICAgICAgICAgICAgICAgaW5mby5kb2NDb250ZW50ID0gZm0uY29udGVudDtcbiAgICAgICAgICAgICAgICBpbmZvLm1ldGFkYXRhID0gYXdhaXQgcmVuZGVyZXIubmV3SW5pdE1ldGFkYXRhKHRoaXMuY29uZmlnLCBpbmZvKTtcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSBtYXkgYmUgZG9jLmRvY01ldGFkYXRhLnRhZ3MgZGVyaXZlZCBmcm9tXG4gICAgICAgICAgICAgICAgLy8gdGhlIGZyb250LW1hdHRlci4gIEluIG5ld0luaXRNZXRhZGF0YSB3ZSBlbnN1cmUgdGhhdFxuICAgICAgICAgICAgICAgIC8vIGRvYy5tZXRhZGF0YS50YWdzIGhvbGRzIGFuIGFycmF5LiAgVGhpcyBsaW5lIG1ha2VzXG4gICAgICAgICAgICAgICAgLy8gc3VyZSB0aGF0IGRvYy5kb2NNZXRhZGF0YS50YWdzIGlzIGluIGFncmVlbWVudC5cbiAgICAgICAgICAgICAgICBpbmZvLmRvY01ldGFkYXRhLnRhZ3MgPSBpbmZvLm1ldGFkYXRhLnRhZ3M7XG4gICAgICAgICAgICAgICAgaW5mby5wdWJsaWNhdGlvbkRhdGUgPSBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgICAgICBpbmZvLnB1YmxpY2F0aW9uVGltZSA9IG5ldyBEYXRlKGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAqL1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5mby5yZW5kZXJQYXRoID0gaW5mby52cGF0aDtcbiAgICAgICAgICAgIGluZm8ucmVuZGVycGF0aCA9IGluZm8udnBhdGg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVDaGFuZ2VkKGNvbGxlY3Rpb24sIGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtjb2xsZWN0aW9ufSBoYW5kbGVDaGFuZ2VkYCwgaW5mby52cGF0aCk7XG4gICAgICAgIGlmICh0aGlzLmlnbm9yZUZpbGUoaW5mbykpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBPT09PT09PT0dBISEhIFJlY2VpdmVkIGEgZmlsZSB0aGF0IHNob3VsZCBiZSBpbmdvcmVkIGAsIGluZm8pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2xsZWN0aW9uICE9PSB0aGlzLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaGFuZGxlQ2hhbmdlZCBldmVudCBmb3Igd3JvbmcgY29sbGVjdGlvbjsgZ290ICR7Y29sbGVjdGlvbn0sIGV4cGVjdGVkICR7dGhpcy5jb2xsZWN0aW9ufWApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBoYW5kbGVDaGFuZ2VkICR7aW5mby52cGF0aH0gJHtpbmZvLm1ldGFkYXRhICYmIGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlID8gaW5mby5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgOiAnPz8/J31gKTtcblxuICAgICAgICBpbmZvLnN0YWNrID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGxldCBjb2xsID0gdGhpcy5nZXRDb2xsZWN0aW9uKCk7XG5cbiAgICAgICAgLy8gR29pbmcgYnkgdGhlIExva2lKUyBleGFtcGxlcywgdGhlXG4gICAgICAgIC8vIHVwZGF0ZSB3b3JrZmxvdyBpcyB0bzpcbiAgICAgICAgLy8gMS4gcmV0cmlldmUgYSBkb2N1bWVudCAtLSB3aGljaCBjb250YWlucyBhICRsb2tpIG1lbWJlclxuICAgICAgICAvLyAyLiBtYWtpbmcgY2hhbmdlcyB0byB0aGF0IGRvY3VtZW50XG4gICAgICAgIC8vIDMuIGNhbGwgdXBkYXRlXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoaXMgbWV0aG9kIGlzIHJlY2VpdmluZyBhIG5ldyBkb2N1bWVudCB0aGF0IGlzXG4gICAgICAgIC8vIHN1cHBvc2VkIHRvIGJlIGFuIHVwZGF0ZSB0byBvbmUgYWxyZWFkeSBpbiB0aGUgZGF0YWJhc2UuXG4gICAgICAgIC8vIEJlY2F1c2Ugb2YgaG93IEZpbGVDYWNoZSB3b3JrcywgdGhlIGRvY3VtZW50cyB3aWxsXG4gICAgICAgIC8vIGJlIGhhdmUgdGhlIHNhbWUgc3RydWN0dXJlLCBhbmQgYW55IGNoYW5nZXMgYXJlXG4gICAgICAgIC8vIHdoYXQgbmVlZHMgdG8gYmUgdXBkYXRlZC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSGVuY2UsIHdlIHVzZSBcImZpbmRPbmVcIiB0byByZXRyaWV2ZSB0aGUgZG9jdW1lbnQuXG4gICAgICAgIC8vIFdlIGNvcHkgaXRzICRsb2tpIHZhbHVlIGludG8gdGhlIGRvY3VtZW50IHdlJ3JlIGdpdmVuLlxuICAgICAgICAvLyBUaGUgdXBkYXRlIGZ1bmN0aW9uIHRoZW4gaWRlbnRpZmllcyB3aGF0IHRvIHVwZGF0ZVxuICAgICAgICAvLyBiYXNlZCBvbiB0aGUgJGxva2kgdmFsdWUgd2Ugc3VwcGxpZWQuXG5cbiAgICAgICAgbGV0IG9yaWcgPSBjb2xsLmZpbmRPbmUoe1xuICAgICAgICAgICAgdnBhdGg6IHtcbiAgICAgICAgICAgICAgICAkZXE6IGluZm8udnBhdGhcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtb3VudGVkOiB7XG4gICAgICAgICAgICAgICAgJGVxOiBpbmZvLm1vdW50ZWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGluZm8uJGxva2kgPSBvcmlnLiRsb2tpO1xuICAgICAgICBjb2xsLnVwZGF0ZShpbmZvKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUNoYW5nZWQoY29sbGVjdGlvbiwgaW5mbyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2UgcmVjZWl2ZSB0aGlzOlxuICAgICAqXG4gICAgICoge1xuICAgICAqICAgIGZzcGF0aDogZnNwYXRoLFxuICAgICAqICAgIHZwYXRoOiB2cGF0aCxcbiAgICAgKiAgICBtaW1lOiBtaW1lLmdldFR5cGUoZnNwYXRoKSxcbiAgICAgKiAgICBtb3VudGVkOiBkaXIubW91bnRlZCxcbiAgICAgKiAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgKiAgICBwYXRoSW5Nb3VudGVkOiBjb21wdXRlZCByZWxhdGl2ZSBwYXRoXG4gICAgICogICAgc3RhY2s6IFsgYXJyYXkgb2YgdGhlc2UgaW5zdGFuY2VzIF1cbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBOZWVkIHRvIGFkZDpcbiAgICAgKiAgICByZW5kZXJQYXRoXG4gICAgICogICAgQW5kIGZvciBIVE1MIHJlbmRlciBmaWxlcywgYWRkIHRoZSBiYXNlTWV0YWRhdGEgYW5kIGRvY01ldGFkYXRhXG4gICAgICpcbiAgICAgKiBTaG91bGQgcmVtb3ZlIHRoZSBzdGFjaywgc2luY2UgaXQncyBsaWtlbHkgbm90IHVzZWZ1bCB0byB1cy5cbiAgICAgKi9cblxuICAgICBhc3luYyBoYW5kbGVBZGRlZChjb2xsZWN0aW9uLCBpbmZvKSB7XG4gICAgICAgLy8gIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7Y29sbGVjdGlvbn0gaGFuZGxlQWRkZWRgLCBpbmZvLnZwYXRoKTtcbiAgICAgICAgaWYgKHRoaXMuaWdub3JlRmlsZShpbmZvKSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09PT09PR0EhISEgUmVjZWl2ZWQgYSBmaWxlIHRoYXQgc2hvdWxkIGJlIGluZ29yZWQgYCwgaW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbGxlY3Rpb24gIT09IHRoaXMuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVBZGRlZCBldmVudCBmb3Igd3JvbmcgY29sbGVjdGlvbjsgZ290ICR7Y29sbGVjdGlvbn0sIGV4cGVjdGVkICR7dGhpcy5jb2xsZWN0aW9ufWApO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZ2F0aGVySW5mb0RhdGEoaW5mbyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBoYW5kbGVBZGRlZCAke2luZm8udnBhdGh9ICR7aW5mby5tZXRhZGF0YSAmJiBpbmZvLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA/IGluZm8ubWV0YWRhdGEucHVibGljYXRpb25EYXRlIDogJz8/Pyd9YCk7XG5cbiAgICAgICAgaW5mby5zdGFjayA9IHVuZGVmaW5lZDtcblxuICAgICAgICBsZXQgY29sbCA9IHRoaXMuZ2V0Q29sbGVjdGlvbigpO1xuICAgICAgICBjb2xsLmluc2VydChpbmZvKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZUFkZGVkKGNvbGxlY3Rpb24sIGluZm8pO1xuICAgIH1cblxuICAgIGFzeW5jIGhhbmRsZVVubGlua2VkKGNvbGxlY3Rpb24sIGluZm8pIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFBST0NFU1MgJHtjb2xsZWN0aW9ufSBoYW5kbGVVbmxpbmtlZGAsIGluZm8udnBhdGgpO1xuICAgICAgICBpZiAoY29sbGVjdGlvbiAhPT0gdGhpcy5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGhhbmRsZVVubGlua2VkIGV2ZW50IGZvciB3cm9uZyBjb2xsZWN0aW9uOyBnb3QgJHtjb2xsZWN0aW9ufSwgZXhwZWN0ZWQgJHt0aGlzLmNvbGxlY3Rpb259YCk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5ob29rRmlsZVVubGlua2VkKGNvbGxlY3Rpb24sIGluZm8pO1xuXG4gICAgICAgIGxldCBjb2xsID0gdGhpcy5nZXRDb2xsZWN0aW9uKCk7XG4gICAgICAgIGNvbGwuZmluZEFuZFJlbW92ZSh7XG4gICAgICAgICAgICB2cGF0aDoge1xuICAgICAgICAgICAgICAgICRlcTogaW5mby52cGF0aFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1vdW50ZWQ6IHtcbiAgICAgICAgICAgICAgICAkZXE6IGluZm8ubW91bnRlZFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBoYW5kbGVSZWFkeShjb2xsZWN0aW9uKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBQUk9DRVNTICR7Y29sbGVjdGlvbn0gaGFuZGxlUmVhZHlgKTtcbiAgICAgICAgaWYgKGNvbGxlY3Rpb24gIT09IHRoaXMuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBoYW5kbGVSZWFkeSBldmVudCBmb3Igd3JvbmcgY29sbGVjdGlvbjsgZ290ICR7Y29sbGVjdGlvbn0sIGV4cGVjdGVkICR7dGhpcy5jb2xsZWN0aW9ufWApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXNbX3N5bWJfaXNfcmVhZHldID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0KCdyZWFkeScsIGNvbGxlY3Rpb24pO1xuICAgIH1cblxuICAgIGZpbmQoX2ZwYXRoKSB7XG5cbiAgICAgICAgY29uc3QgZnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2ZwYXRoLnN1YnN0cmluZygxKSBcbiAgICAgICAgICAgICAgICAgICAgOiBfZnBhdGg7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcbiAgICAgICAgY29uc3QgY29sbCA9IHRoaXMuZ2V0Q29sbGVjdGlvbigpO1xuICAgICAgICBjb25zdCByZXN1bHRzID0gY29sbC5jaGFpbigpLmZpbmQoe1xuICAgICAgICAgICAgJyRvcic6IFtcbiAgICAgICAgICAgICAgICB7IHZwYXRoOiB7ICckZXEnOiBmcGF0aCB9fSxcbiAgICAgICAgICAgICAgICB7IHJlbmRlclBhdGg6IHsgJyRlcSc6IGZwYXRoIH19XG4gICAgICAgICAgICBdXG4gICAgICAgIH0pXG4gICAgICAgIC53aGVyZShmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAhIGZjYWNoZS5pZ25vcmVGaWxlKG9iaik7XG4gICAgICAgICAgICAvLyByZXR1cm4gb2JqLnZwYXRoID09PSBmcGF0aCB8fCBvYmoucmVuZGVyUGF0aCA9PT0gZnBhdGg7XG4gICAgICAgIH0pXG4gICAgICAgIC5kYXRhKHtcbiAgICAgICAgICAgIHJlbW92ZU1ldGE6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCByZXQ7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdHMpICYmIHJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0ID0gcmVzdWx0c1swXTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdHMpICYmIHJlc3VsdHMubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHJldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldCA9IHJlc3VsdHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBhc3luYyBpbmRleENoYWluKF9mcGF0aCkge1xuXG4gICAgICAgIGNvbnN0IGZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSkgXG4gICAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXRoLnBhcnNlKGZwYXRoKTtcblxuICAgICAgICAvLyBUaGUgc2VsZWN0b3IgaXMgYSBsb25nIGxpc3Qgb2YgJyRvcicgZW50cmllcyBlYWNoIG9mXG4gICAgICAgIC8vIHdoaWNoIGlzIGEgJyRvcicgb24gYm90aCB2cGF0aCBhbmQgcmVuZGVyUGF0aC5cbiAgICAgICAgLy8gU29tZSBvZiB0aGUgZW50cmllcyBhcmUgYWRkZWQgYmVsb3dcblxuICAgICAgICBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICAgICAgICckb3InOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAnJG9yJzogW1xuICAgICAgICAgICAgICAgICAgICAgICAgeyB2cGF0aDogZnBhdGggfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgcmVuZGVyUGF0aDogZnBhdGggfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBmaWxlTmFtZTtcbiAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZnBhdGgpO1xuICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgIGZpbGVOYW1lID0gZm91bmQucmVuZGVyUGF0aDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbGVOYW1lID0gZnBhdGg7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHBhcmVudERpcjtcbiAgICAgICAgbGV0IGRpck5hbWUgPSBwYXRoLmRpcm5hbWUoZnBhdGgpO1xuICAgICAgICBsZXQgZG9uZSA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAoIShkaXJOYW1lID09PSAnLicgfHwgZGlyTmFtZSA9PT0gcGFyc2VkLnJvb3QpKSB7XG4gICAgICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShmaWxlTmFtZSkgPT09ICdpbmRleC5odG1sJykge1xuICAgICAgICAgICAgICAgIHBhcmVudERpciA9IHBhdGguZGlybmFtZShwYXRoLmRpcm5hbWUoZmlsZU5hbWUpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyZW50RGlyID0gcGF0aC5kaXJuYW1lKGZpbGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBsb29rRm9yID0gcGF0aC5qb2luKHBhcmVudERpciwgXCJpbmRleC5odG1sXCIpO1xuXG4gICAgICAgICAgICAvLyBUaGVzZSBzZWxlY3RvciBlbnRyaWVzIGFyZSBhZGRlZCB0byB0aGUgc2VsZWN0b3JcbiAgICAgICAgICAgIC8vIHdoaWNoIHdhcyBzdGFydGVkIGFib3ZlIGhlcmUuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNlbGVjdG9yWyckb3InXS5wdXNoKHtcbiAgICAgICAgICAgICAgICAnJG9yJzogW1xuICAgICAgICAgICAgICAgICAgICB7IHZwYXRoOiBsb29rRm9yIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgcmVuZGVyUGF0aDogbG9va0ZvciB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGZpbGVOYW1lID0gbG9va0ZvcjtcbiAgICAgICAgICAgIGRpck5hbWUgPSBwYXRoLmRpcm5hbWUobG9va0Zvcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW5kZXhDaGFpbiAke2ZwYXRofSBzZWxlY3RvciAke0pTT04uc3RyaW5naWZ5KHNlbGVjdG9yKX1gKTtcblxuICAgICAgICByZXR1cm4gZG9jdW1lbnRzLmdldENvbGxlY3Rpb24oKS5maW5kKHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5mb3VuZERpciA9IG9iai5tb3VudFBvaW50O1xuICAgICAgICAgICAgICAgICAgICBvYmouZm91bmRQYXRoID0gb2JqLnJlbmRlclBhdGg7XG4gICAgICAgICAgICAgICAgICAgIG9iai5maWxlbmFtZSA9ICcvJyArIG9iai5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnJldmVyc2UoKTtcbiAgICB9XG5cbiAgICBzaWJsaW5ncyhfZnBhdGgpIHtcbiAgICAgICAgbGV0IHJldDtcbiAgICAgICAgbGV0IHZwYXRoID0gX2ZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgPyBfZnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICA6IF9mcGF0aDtcbiAgICAgICAgbGV0IGRpcm5hbWUgPSBwYXRoLmRpcm5hbWUodnBhdGgpO1xuICAgICAgICBpZiAoZGlybmFtZSA9PT0gJy4nKSBkaXJuYW1lID0gJy8nO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzaWJsaW5ncyAke19mcGF0aH0gJHt2cGF0aH0gJHtkaXJuYW1lfWApO1xuXG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IGNvbGwgPSB0aGlzLmdldENvbGxlY3Rpb24oKTtcblxuICAgICAgICBsZXQgZHZTaWJsaW5ncyA9IGNvbGwuZ2V0RHluYW1pY1ZpZXcoJ3NpYmxpbmdzJyk7XG4gICAgICAgIGlmICghZHZTaWJsaW5ncykge1xuICAgICAgICAgICAgZHZTaWJsaW5ncyA9IGNvbGwuYWRkRHluYW1pY1ZpZXcoJ3NpYmxpbmdzJyk7XG4gICAgICAgICAgICBkdlNpYmxpbmdzLmFwcGx5RmluZCh7XG4gICAgICAgICAgICAgICAgLyogZGlybmFtZTogZGlybmFtZSxcbiAgICAgICAgICAgICAgICAnJGFuZCc6IFtcbiAgICAgICAgICAgICAgICAgICAgeyB2cGF0aDogeyAnJG5lJzogdnBhdGggfSB9LFxuICAgICAgICAgICAgICAgICAgICB7IHJlbmRlclBhdGg6IHsgJyRuZSc6IHZwYXRoIH0gfSxcbiAgICAgICAgICAgICAgICBdLCAqL1xuICAgICAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZHZTaWJsaW5ncy5hcHBseVdoZXJlKGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIGZjYWNoZS5pZ25vcmVGaWxlKG9iaik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGR2U2libGluZ3MuYXBwbHlTaW1wbGVTb3J0KCd2cGF0aCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldCA9IGR2U2libGluZ3MuYnJhbmNoUmVzdWx0c2V0KClcbiAgICAgICAgLmZpbmQoe1xuICAgICAgICAgICAgZGlybmFtZTogZGlybmFtZSxcbiAgICAgICAgICAgICckYW5kJzogW1xuICAgICAgICAgICAgICAgIHsgdnBhdGg6IHsgJyRuZSc6IHZwYXRoIH0gfSxcbiAgICAgICAgICAgICAgICB7IHJlbmRlclBhdGg6IHsgJyRuZSc6IHZwYXRoIH0gfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIC5kYXRhKHtcbiAgICAgICAgICAgIHJlbW92ZU1ldGE6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvLyBPcmlnaW5hbCBpbXBsZW1lbnRhdGlvbi4gIFRoZSBhYm92ZSBpbXBsZW1lbnRhdGlvblxuICAgIC8vIHVzZXMgRHluYW1pY1ZpZXcgYW5kIGlzIHNpZ25pZmljYW50bHkgZmFzdGVyXG4gICAgXG4gICAgLy8gICByYW5kb20gc2libGluZ3MgICAgICAgMTI1Ljg1IMK1cy9pdGVyICAgKDguMjkgwrVzIOKApiA3NDMuMDEgwrVzKVxuICAgIC8vICAgcmFuZG9tIHNpYmxpbmdzLXZpZXcgIDEwMi4yMyDCtXMvaXRlciAgKDg4LjI1IMK1cyDigKYgNjIzLjk5IMK1cylcblxuICAgIC8qIHNpYmxpbmdzKF9mcGF0aCkge1xuICAgICAgICBsZXQgcmV0O1xuICAgICAgICBsZXQgdnBhdGggPSBfZnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICA/IF9mcGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgIDogX2ZwYXRoO1xuICAgICAgICBsZXQgZGlybmFtZSA9IHBhdGguZGlybmFtZSh2cGF0aCk7XG4gICAgICAgIGlmIChkaXJuYW1lID09PSAnLicpIGRpcm5hbWUgPSAnLyc7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHNpYmxpbmdzICR7X2ZwYXRofSAke3ZwYXRofSAke2Rpcm5hbWV9YCk7XG5cbiAgICAgICAgY29uc3QgZmNhY2hlID0gdGhpcztcbiAgICAgICAgY29uc3QgY29sbCA9IHRoaXMuZ2V0Q29sbGVjdGlvbigpO1xuICAgICAgICAvLyBMb29rcyBmb3IgZmlsZXMgaW4gdGhlIGRpcmVjdG9yeSBjb250YWluaW5nIF9mcGF0aFxuICAgICAgICAvLyB0aGF0IGFyZSBub3QgX2ZwYXRoXG4gICAgICAgIHJldCA9IGNvbGwuY2hhaW4oKS5maW5kKHtcbiAgICAgICAgICAgIGRpcm5hbWU6IGRpcm5hbWUsXG4gICAgICAgICAgICAnJGFuZCc6IFtcbiAgICAgICAgICAgICAgICB7IHZwYXRoOiB7ICckbmUnOiB2cGF0aCB9IH0sXG4gICAgICAgICAgICAgICAgeyByZW5kZXJQYXRoOiB7ICckbmUnOiB2cGF0aCB9IH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTDogdHJ1ZVxuICAgICAgICB9KVxuICAgICAgICAud2hlcmUoZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gISBmY2FjaGUuaWdub3JlRmlsZShvYmopO1xuICAgICAgICB9KVxuICAgICAgICAuc2ltcGxlc29ydCgndnBhdGgnKVxuICAgICAgICAuZGF0YSh7XG4gICAgICAgICAgICByZW1vdmVNZXRhOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfSAqL1xuXG4gICAgaW5kZXhGaWxlcyhfZGlybmFtZSkge1xuICAgICAgICBsZXQgZGlybmFtZSA9IF9kaXJuYW1lICYmIF9kaXJuYW1lLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICA/IF9kaXJuYW1lLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICA6IF9kaXJuYW1lO1xuICAgICAgICBpZiAoZGlybmFtZSA9PT0gJy4nXG4gICAgICAgICB8fCBkaXJuYW1lID09PSAnJ1xuICAgICAgICAgfHwgdHlwZW9mIGRpcm5hbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBkaXJuYW1lID0gJy8nO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29sbCA9IHRoaXMuZ2V0Q29sbGVjdGlvbigpO1xuICAgICAgICBsZXQgZHZJbmRleEZpbGVzID0gY29sbC5nZXREeW5hbWljVmlldygnaW5kZXgtZmlsZXMnKTtcbiAgICAgICAgaWYgKCFkdkluZGV4RmlsZXMpIHtcbiAgICAgICAgICAgIGR2SW5kZXhGaWxlcyA9IGNvbGwuYWRkRHluYW1pY1ZpZXcoJ2luZGV4LWZpbGVzJyk7XG4gICAgICAgICAgICBkdkluZGV4RmlsZXMuYXBwbHlGaW5kKHtcbiAgICAgICAgICAgICAgICAnJG9yJzogW1xuICAgICAgICAgICAgICAgICAgICB7IHJlbmRlclBhdGg6IHsgJyRyZWdleCc6ICcvaW5kZXhcXC5odG1sJCcgfSB9LFxuICAgICAgICAgICAgICAgICAgICB7IHJlbmRlclBhdGg6IHsgJyRlcSc6ICdpbmRleC5odG1sJyB9fVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZHZJbmRleEZpbGVzLmFwcGx5U2ltcGxlU29ydCgnZGlybmFtZScpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZHZJbmRleEZpbGVzKSB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgZmluZCB2aWV3IGluZGV4LWZpbGVzYCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGR2SW5kZXhGaWxlcyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGR2SW5kZXhGaWxlcy5icmFuY2hSZXN1bHRzZXQpO1xuXG4gICAgICAgIGNvbnN0IHJldCA9IGR2SW5kZXhGaWxlcy5icmFuY2hSZXN1bHRzZXQoKVxuICAgICAgICAud2hlcmUoZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICAvKiBjb25zdCByZW5kZXJQID0gb2JqLnJlbmRlclBhdGggPT09ICdpbmRleC5odG1sJyB8fCBvYmoucmVuZGVyUGF0aC5lbmRzV2l0aCgnL2luZGV4Lmh0bWwnKTtcbiAgICAgICAgICAgIGlmICghcmVuZGVyUCkgcmV0dXJuIGZhbHNlOyAqL1xuICAgICAgICAgICAgaWYgKGRpcm5hbWUgIT09ICcvJykge1xuICAgICAgICAgICAgICAgIGlmIChvYmoudnBhdGguc3RhcnRzV2l0aChkaXJuYW1lKSkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuZGF0YSh7XG4gICAgICAgICAgICByZW1vdmVNZXRhOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8vIE9yaWdpbmFsIGltcGxlbWVudGF0aW9uLiAgVGhlIHZlcnNpb24gYWJvdmUgdXNlcyBhXG4gICAgLy8gRHluYW1pY1ZpZXcgYW5kIGlzIHNpZ25pZmljYW50bHkgZmFzdGVyXG4gICAgLy8gXG4gICAgLy8gIHJhbmRvbSBpbmRleGVzICAgICAgICAgICAxLjMgbXMvaXRlciAgICAgKDEuMTUgbXMg4oCmIDIuNzcgbXMpXG4gICAgLy8gIHJhbmRvbSBpbmRleGVzLXZpZXcgICAgIDEuMDIgbXMvaXRlciAgICg5MDkuNDYgwrVzIOKApiAyLjM5IG1zKVxuXG5cbiAgICAvKiBpbmRleEZpbGVzKF9kaXJuYW1lKSB7XG4gICAgICAgIGxldCBkaXJuYW1lID0gX2Rpcm5hbWUgJiYgX2Rpcm5hbWUuc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgID8gX2Rpcm5hbWUuc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIDogX2Rpcm5hbWU7XG4gICAgICAgIGlmIChkaXJuYW1lID09PSAnLidcbiAgICAgICAgIHx8IGRpcm5hbWUgPT09ICcnXG4gICAgICAgICB8fCB0eXBlb2YgZGlybmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGRpcm5hbWUgPSAnLyc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb2xsID0gdGhpcy5nZXRDb2xsZWN0aW9uKCk7XG4gICAgICAgIGNvbnN0IHJldCA9IGNvbGwuY2hhaW4oKVxuICAgICAgICAuZmluZCh7XG4gICAgICAgICAgICAnJG9yJzogW1xuICAgICAgICAgICAgICAgIHsgcmVuZGVyUGF0aDogeyAnJHJlZ2V4JzogJy9pbmRleFxcLmh0bWwkJyB9IH0sXG4gICAgICAgICAgICAgICAgeyByZW5kZXJQYXRoOiB7ICckZXEnOiAnaW5kZXguaHRtbCcgfX1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSlcbiAgICAgICAgLndoZXJlKGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgLyogY29uc3QgcmVuZGVyUCA9IG9iai5yZW5kZXJQYXRoID09PSAnaW5kZXguaHRtbCcgfHwgb2JqLnJlbmRlclBhdGguZW5kc1dpdGgoJy9pbmRleC5odG1sJyk7XG4gICAgICAgICAgICBpZiAoIXJlbmRlclApIHJldHVybiBmYWxzZTsgKi0tL1xuICAgICAgICAgICAgaWYgKGRpcm5hbWUgIT09ICcvJykge1xuICAgICAgICAgICAgICAgIGlmIChvYmoudnBhdGguc3RhcnRzV2l0aChkaXJuYW1lKSkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuc2ltcGxlc29ydCgnZGlybmFtZScpXG4gICAgICAgIC5kYXRhKHtcbiAgICAgICAgICAgIHJlbW92ZU1ldGE6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbmRleEZpbGVzICR7cmV0Lmxlbmd0aH1gKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9ICovXG5cbiAgICAvLyBUT0RPIHJldXNhYmxlIGZ1bmN0aW9uIGZvciBkaXN0aW5jdCB2cGF0aHNcblxuICAgIC8vIFRoaXMgd2FzIG5vIGZhc3RlciBpbiBiZW5jaG1hcmsgdGVzdGluZy4gIFRlc3Rpbmcgc2hvd2VkXG4gICAgLy8gdGhhdCByZXQgd2FzIGFuIGVtcHR5IGFycmF5LCB3aGljaCBzZWVtcyB0byBoYXZlIHJlcXVpcmVkXG4gICAgLy8gdXNpbmcgdGhlIGZhbGxiYWNrIGNvZGUgdGhhdCBpcyBhIGR1cGxpY2F0ZSBvZiB0aGUgXG4gICAgLy8gbm9uLVZpZXcgaW1wbGVtZW50YXRpb24uXG5cbiAgICAvKiBwYXRoc1ZpZXcoKSB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IGNvbGwgPSB0aGlzLmdldENvbGxlY3Rpb24oKTtcbiAgICAgICAgbGV0IGR2UGF0aHMgPSBjb2xsLmdldER5bmFtaWNWaWV3KCdwYXRocycpO1xuICAgICAgICBpZiAoIWR2UGF0aHMpIHtcbiAgICAgICAgICAgIGR2UGF0aHMgPSBjb2xsLmFkZER5bmFtaWNWaWV3KCdwYXRocycpO1xuICAgICAgICAgICAgZHZQYXRocy5hcHBseUZpbmQoKTtcbiAgICAgICAgICAgIGR2UGF0aHMuYXBwbHlXaGVyZShmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZjYWNoZS5pZ25vcmVGaWxlKG9iaikpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZHZQYXRocy5hcHBseVNpbXBsZVNvcnQoJ3ZwYXRoJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJldCA9IGR2UGF0aHMuYnJhbmNoUmVzdWx0c2V0KCkuZGF0YSh7IHJlbW92ZU1ldGE6IHRydWUsIGZvcmNlQ2xvbmVzOiB0cnVlIH0pO1xuICAgICAgICBpZiAoIXJldCB8fCByZXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCB2cGF0aHNTZWVuID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgcmV0ID0gY29sbC5jaGFpbigpXG4gICAgICAgICAgICAud2hlcmUoZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZjYWNoZS5pZ25vcmVGaWxlKG9iaikpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09HQSEgIEluIHBhdGhzICBNVVNUIElHTk9SRSAke29iai52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodnBhdGhzU2Vlbi5oYXMob2JqLnZwYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGhzU2Vlbi5hZGQob2JqLnZwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5kYXRhKHtcbiAgICAgICAgICAgICAgICByZW1vdmVNZXRhOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXBwZWQgPSByZXQubWFwKG9iaiA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICB7XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aDogb2JqLmZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IG9iai52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogb2JqLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IG9iai5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBkaXJNb3VudGVkT246IG9iai5kaXJNb3VudGVkT25cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtYXBwZWQ7XG4gICAgfSAqL1xuXG4gICAgc2V0VGltZXMoKSB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IHZwYXRoc1NlZW4gPSBuZXcgU2V0KCk7XG4gICAgICAgIGNvbnN0IGNvbGwgPSB0aGlzLmdldENvbGxlY3Rpb24oKTtcbiAgICAgICAgY29uc3QgcmV0ID0gY29sbC5jaGFpbigpXG4gICAgICAgIC53aGVyZShmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgIGlmIChmY2FjaGUuaWdub3JlRmlsZShvYmopKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYE9PT09HQSEgIEluIHBhdGhzICBNVVNUIElHTk9SRSAke29iai52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodnBhdGhzU2Vlbi5oYXMob2JqLnZwYXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdnBhdGhzU2Vlbi5hZGQob2JqLnZwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmRhdGEoe1xuICAgICAgICAgICAgcmVtb3ZlTWV0YTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgZm9yIChjb25zdCBvYmogb2YgcmV0KSB7XG5cbiAgICAgICAgICAgIGNvbnN0IHNldHRlciA9IGFzeW5jIChkYXRlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gRGF0ZS5wYXJzZShkYXRlKTs7XG4gICAgICAgICAgICAgICAgaWYgKCEgaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkcCA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gICAgICAgICAgICAgICAgICAgIEZTLnV0aW1lc1N5bmMoXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmouZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZHAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkcFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob2JqLmRvY01ldGFkYXRhICYmIG9iai5kb2NNZXRhZGF0YS5wdWJsRGF0ZSkge1xuICAgICAgICAgICAgICAgIHNldHRlcihvYmouZG9jTWV0YWRhdGEucHVibERhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9iai5kb2NNZXRhZGF0YSAmJiBvYmouZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlKSB7XG4gICAgICAgICAgICAgICAgc2V0dGVyKG9iai5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGF0aHMoKSB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IHZwYXRoc1NlZW4gPSBuZXcgU2V0KCk7XG4gICAgICAgIGNvbnN0IGNvbGwgPSB0aGlzLmdldENvbGxlY3Rpb24oKTtcbiAgICAgICAgY29uc3QgcmV0ID0gY29sbC5jaGFpbigpXG4gICAgICAgIC8vIC5maW5kKHtcbiAgICAgICAgLy8gICAgICdyZW5kZXJQYXRoJzogeyAnJHJlZ2V4JzogL1xcLmh0bWwkLyB9XG4gICAgICAgIC8vIH0pXG4gICAgICAgIC8vIC8vIC5zaW1wbGVzb3J0KCdwdWJsaWNhdGlvblRpbWUnIC8qICwgeyBkZXNjOiBmYWxzZSB9ICovKVxuICAgICAgICAvLyAud2hlcmUoZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIC8vICAgICByZXR1cm4gb2JqLnJlbmRlclBhdGguZW5kc1dpdGgoJ2luZGV4Lmh0bWwnKVxuICAgICAgICAvLyAgICAgICAgID8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAvLyB9KVxuICAgICAgICAud2hlcmUoZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICBpZiAoZmNhY2hlLmlnbm9yZUZpbGUob2JqKSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBPT09PR0EhICBJbiBwYXRocyAgTVVTVCBJR05PUkUgJHtvYmoudnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZwYXRoc1NlZW4uaGFzKG9iai52cGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZwYXRoc1NlZW4uYWRkKG9iai52cGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5kYXRhKHtcbiAgICAgICAgICAgIHJlbW92ZU1ldGE6IHRydWVcbiAgICAgICAgfSlcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIGxldCBhRGF0ZSA9IGEubWV0YWRhdGEgJiYgYS5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICA/IGEubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgOiBhLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgIGxldCBiRGF0ZSA9IGIubWV0YWRhdGEgJiYgYi5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICA/IGIubWV0YWRhdGEucHVibGljYXRpb25EYXRlXG4gICAgICAgICAgICAgICAgOiBiLnB1YmxpY2F0aW9uRGF0ZTtcbiAgICAgICAgICAgIGlmIChhRGF0ZSA9PT0gYkRhdGUpIHJldHVybiAwO1xuICAgICAgICAgICAgaWYgKGFEYXRlID4gYkRhdGUpIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmIChhRGF0ZSA8IGJEYXRlKSByZXR1cm4gMTtcbiAgICAgICAgICAgIC8vIGlmIChhLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gYi5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHJldHVybiAwO1xuICAgICAgICAgICAgLy8gaWYgKGEubWV0YWRhdGEucHVibGljYXRpb25EYXRlID4gYi5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHJldHVybiAtMTtcbiAgICAgICAgICAgIC8vIGlmIChhLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA8IGIubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSByZXR1cm4gMTtcbiAgICAgICAgfSlcbiAgICAgICAgLm1hcChvYmogPT4ge1xuICAgICAgICAgICAgcmV0dXJuICB7XG4gICAgICAgICAgICAgICAgZnNwYXRoOiBvYmouZnNwYXRoLFxuICAgICAgICAgICAgICAgIHZwYXRoOiBvYmoudnBhdGgsXG4gICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogb2JqLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgbW91bnRQb2ludDogb2JqLm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgZGlyTW91bnRlZE9uOiBvYmouZGlyTW91bnRlZE9uLFxuICAgICAgICAgICAgICAgIC8vIHRpdGxlOiBvYmoubWV0YWRhdGEudGl0bGUsXG4gICAgICAgICAgICAgICAgZG9jTWV0YWRhdGE6IG9iai5kb2NNZXRhZGF0YSxcbiAgICAgICAgICAgICAgICBtZXRhZGF0YTogb2JqLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIC8vIGRvY01ldGFkYXRhRGF0ZTogb2JqLmRvY01ldGFkYXRhICYmIG9iai5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUgXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICA/IG9iai5kb2NNZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgOiAnPz8/Pz8nLFxuICAgICAgICAgICAgICAgIC8vIG1ldGFkYXRhRGF0ZTogb2JqLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHB1YmxpY2F0aW9uRGF0ZTogb2JqLnB1YmxpY2F0aW9uRGF0ZS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHB1YmxpY2F0aW9uVGltZTogb2JqLnB1YmxpY2F0aW9uVGltZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIC5yZXZlcnNlKCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGRicGF0aHMgJHtyZXQubGVuZ3RofWApO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZGJwYXRocyAke3V0aWwuaW5zcGVjdChyZXQpfWApO1xuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZG9jdW1lbnRzV2l0aFRhZ3MoKSB7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG4gICAgICAgIGxldCBjb2xsID0gdGhpcy5nZXRDb2xsZWN0aW9uKCk7XG4gICAgICAgIGxldCBkdlRhZ3MgPSBjb2xsLmdldER5bmFtaWNWaWV3KCdkb2NzLXdpdGgtdGFncycpO1xuICAgICAgICBpZiAoIWR2VGFncykge1xuICAgICAgICAgICAgZHZUYWdzID0gY29sbC5hZGREeW5hbWljVmlldygnZG9jcy13aXRoLXRhZ3MnKTtcbiAgICAgICAgICAgIGR2VGFncy5hcHBseUZpbmQoe1xuICAgICAgICAgICAgICAgIHJlbmRlcnNUb0hUTUw6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZHZUYWdzLmFwcGx5V2hlcmUoZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIGlmIChmY2FjaGUuaWdub3JlRmlsZShvYmopKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iai5tZXRhZGF0YVxuICAgICAgICAgICAgICAgICAgICAmJiBvYmoubWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KG9iai5tZXRhZGF0YS50YWdzKVxuICAgICAgICAgICAgICAgICAgICAmJiBvYmoubWV0YWRhdGEudGFncy5sZW5ndGggPj0gMTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkdlRhZ3MuZGF0YSh7XG4gICAgICAgICAgICByZW1vdmVNZXRhOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE9yaWdpbmFsIGltcGxlbWVudGF0aW9uLiAgVGhlIGFib3ZlIGltcGxlbWVudGF0aW9uIHVzZXNcbiAgICAvLyBhIER5bmFtaWNWaWV3IGFuZCBpcyBzaWduaWZpY2FudGx5IGZhc3RlclxuICAgIC8vXG4gICAgLy8gICAgdGFncyAgICAgICAgICAgICA2MTguNzcgwrVzL2l0ZXIgICAoNTMwLjY4IMK1cyDigKYgMS43OSBtcylcbiAgICAvLyAgICB0YWdzLXZpZXcgICAgICAgICA1NC45NCDCtXMvaXRlciAgKDQ4LjE4IMK1cyDigKYgNzc3Ljg4IMK1cylcblxuXG4gICAgLyogZG9jdW1lbnRzV2l0aFRhZ3MoKSB7XG4gICAgICAgIGxldCBjb2xsID0gdGhpcy5nZXRDb2xsZWN0aW9uKCk7XG4gICAgICAgIGNvbnN0IGZjYWNoZSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IHZwYXRoc1NlZW4gPSBuZXcgU2V0KCk7XG4gICAgICAgIGNvbnN0IHJldCA9IGNvbGwuY2hhaW4oKVxuICAgICAgICAuZmluZCh7XG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIC53aGVyZShmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgIGlmICh2cGF0aHNTZWVuLmhhcyhvYmoudnBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2cGF0aHNTZWVuLmFkZChvYmoudnBhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAud2hlcmUoZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgaWYgKGZjYWNoZS5pZ25vcmVGaWxlKG9iaikpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBvYmoubWV0YWRhdGFcbiAgICAgICAgICAgICAgICAmJiBvYmoubWV0YWRhdGEudGFnc1xuICAgICAgICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkob2JqLm1ldGFkYXRhLnRhZ3MpXG4gICAgICAgICAgICAgICAgJiYgb2JqLm1ldGFkYXRhLnRhZ3MubGVuZ3RoID49IDE7XG4gICAgICAgIH0pXG4gICAgICAgIC5kYXRhKHtcbiAgICAgICAgICAgIHJlbW92ZU1ldGE6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfSAqL1xuXG4gICAgdGFncygpIHtcbiAgICAgICAgLyogbGV0IGNvbGwgPSB0aGlzLmdldENvbGxlY3Rpb24odGhpcy5jb2xsZWN0aW9uKTtcbiAgICAgICAgbGV0IHRhZ3MgPSBjb2xsLmZpbmQoe1xuICAgICAgICAgICAgJGFuZDogW1xuICAgICAgICAgICAgICAgIHsgcmVuZGVyUGF0aDogL1xcLmh0bWwkLyB9LFxuICAgICAgICAgICAgICAgIHsgJGV4aXN0czogeyBtZXRhZGF0YTogMSB9fSxcbiAgICAgICAgICAgICAgICB7IG1ldGFkYXRhOiB7ICRjb3VudDogeyB0YWdzOiB7ICRndGU6IDEgfX19fVxuICAgICAgICAgICAgXVxuICAgICAgICB9KTsgKi9cbiAgICAgICAgbGV0IGRvY3MgPSB0aGlzLmRvY3VtZW50c1dpdGhUYWdzKCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRhZ3MpO1xuICAgICAgICBjb25zdCByZXQgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgZG9jIG9mIGRvY3MpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHRhZyBvZiBkb2MubWV0YWRhdGEudGFncykge1xuICAgICAgICAgICAgICAgIGlmICghIHJldC5pbmNsdWRlcyh0YWcpKSByZXQucHVzaCh0YWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgdmFyIHRhZ0EgPSBhLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgdGFnQiA9IGIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmICh0YWdBIDwgdGFnQikgcmV0dXJuIC0xO1xuICAgICAgICAgICAgaWYgKHRhZ0EgPiB0YWdCKSByZXR1cm4gMTtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHNlYXJjaChvcHRpb25zKSB7XG4gICAgICAgIC8vIGxldCBkb2N1bWVudHMgPSBbXTtcbiAgICAgICAgLy8gY29uc3Qgc2VsZWN0b3IgPSB7fTtcblxuICAgICAgICBjb25zdCBmY2FjaGUgPSB0aGlzO1xuICAgICAgICBjb25zdCB2cGF0aHNTZWVuID0gbmV3IFNldCgpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBGaWxlQ2FjaGVMb2tpIHNlYXJjaCBgLCBvcHRpb25zKTtcblxuICAgICAgICB0cnkge1xuXG4gICAgICAgIC8vIEZvciB0aGUgc2VhcmNoIG9wdGlvbnMgdGhhdCBjYW4gYmUgZXhwcmVzc2VkIHVzaW5nXG4gICAgICAgIC8vIHRoZSBmaW5kKHNlbGVjdG9yKSwgd2UgY29uc3RydWN0IGEgc3VpdGFibGUgc2VsZWN0b3IuXG4gICAgICAgIC8vIEZvciBvdGhlcnMsIHRoZXJlIGlzIGEgd2hlcmUgY2xhdXNlIGJlbG93LlxuXG4gICAgICAgIGNvbnN0IHNlbGVjdG9yOiBhbnkgPSB7fTtcblxuICAgICAgICBpZiAob3B0aW9ucy5wYXRobWF0Y2gpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5wYXRobWF0Y2ggPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgIHx8ICh0eXBlb2Ygb3B0aW9ucy5wYXRobWF0Y2ggPT09ICdvYmplY3QnXG4gICAgICAgICAgICAgICAgICAmJiBvcHRpb25zLnBhdGhtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rvci52cGF0aCA9IHtcbiAgICAgICAgICAgICAgICAgICAgJyRyZWdleCc6IG9wdGlvbnMucGF0aG1hdGNoXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucGF0aG1hdGNoKSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yWyckb3InXSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2Ygb3B0aW9ucy5wYXRobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3JbJyRvciddLnB1c2goeyB2cGF0aDogeyAnJHJlZ2V4JzogbWF0Y2ggfSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmlsZUNhY2hlIHNlYXJjaCBpbnZhbGlkIHBhdGhtYXRjaCAke3R5cGVvZiBvcHRpb25zLnBhdGhtYXRjaH0gJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5wYXRobWF0Y2gpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSB7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggPT09ICdzdHJpbmcnXG4gICAgICAgICAgICB8fCAodHlwZW9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoID09PSAnb2JqZWN0J1xuICAgICAgICAgICAgICAmJiBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rvci5yZW5kZXJQYXRoID0ge1xuICAgICAgICAgICAgICAgICAgICAnJHJlZ2V4Jzogb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2hcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5yZW5kZXJwYXRobWF0Y2gpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzZWxlY3RvclsnJG9yJ10gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdG9yWyckb3InXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdG9yWyckb3InXS5wdXNoKHsgcmVuZGVyUGF0aDogeyAnJHJlZ2V4JzogbWF0Y2ggfSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmlsZUNhY2hlIHNlYXJjaCBpbnZhbGlkIHJlbmRlcnBhdGhtYXRjaCAke3V0aWwuaW5zcGVjdChvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5taW1lKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubWltZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3Rvci5taW1lID0ge1xuICAgICAgICAgICAgICAgICAgICAnJGVxJzogb3B0aW9ucy5taW1lXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLm1pbWUpKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3IubWltZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgJyRpbic6IG9wdGlvbnMubWltZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IC8qIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5jb3JyZWN0IE1JTUUgY2hlY2sgJHtvcHRpb25zLm1pbWV9YCk7XG4gICAgICAgICAgICB9ICovXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmVuZGVyc1RvSFRNTCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLnJlbmRlcnNUb0hUTUwgPSB7ICckZXEnOiBvcHRpb25zLnJlbmRlcnNUb0hUTUwgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggYCwgc2VsZWN0b3IpO1xuICAgICAgICBsZXQgY291bnRlcjEgPSAwO1xuXG4gICAgICAgIGxldCBjb2xsID0gdGhpcy5nZXRDb2xsZWN0aW9uKCk7XG4gICAgICAgIGNvbnN0IHJldCA9IGNvbGwuY2hhaW4oKS5maW5kKHNlbGVjdG9yKVxuICAgICAgICAud2hlcmUoZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICBpZiAodnBhdGhzU2Vlbi5oYXMob2JqLnZwYXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdnBhdGhzU2Vlbi5hZGQob2JqLnZwYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLndoZXJlKGZ1bmN0aW9uKG9iaikge1xuXG4gICAgICAgICAgICBpZiAoZmNhY2hlLmlnbm9yZUZpbGUob2JqKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoIHdoZXJlICR7b2JqLnZwYXRofWApO1xuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VhcmNoIHdoZXJlIGxheW91dHMgJHtvYmoudnBhdGh9ICR7b2JqPy5kb2NNZXRhZGF0YT8ubGF5b3V0fSAke3V0aWwuaW5zcGVjdChvcHRpb25zLmxheW91dHMpfWApO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMubGF5b3V0cykge1xuICAgICAgICAgICAgICAgIGxldCBsYXlvdXRzO1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMubGF5b3V0cykpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0cyA9IG9wdGlvbnMubGF5b3V0cztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsYXlvdXRzID0gWyBvcHRpb25zLmxheW91dHMgXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9iai52cGF0aFxuICAgICAgICAgICAgICAgICAmJiBvYmouZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgb2JqLmRvY01ldGFkYXRhLmxheW91dCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWxheW91dHMuaW5jbHVkZXMob2JqLmRvY01ldGFkYXRhLmxheW91dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBSRUpFQ1QgJHtvYmoudnBhdGh9ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMubGF5b3V0cyl9IGRpZCBub3QgaW5jbHVkZSAke29iai5kb2NNZXRhZGF0YS5sYXlvdXR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgSU5DTFVERSAke29iai52cGF0aH0gICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMubGF5b3V0cyl9IGRpZCBpbmNsdWRlICR7b2JqLmRvY01ldGFkYXRhLmxheW91dH1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBSRUpFQ1QgJHtvYmoudnBhdGh9IHNwZWNpZmllZCBsYXlvdXRzICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMubGF5b3V0cyl9IGJ1dCBubyBsYXlvdXQgaW4gZG9jdW1lbnRgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMudGFnKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai52cGF0aFxuICAgICAgICAgICAgICAgICAmJiBvYmouZG9jTWV0YWRhdGFcbiAgICAgICAgICAgICAgICAgJiYgb2JqLmRvY01ldGFkYXRhLnRhZ3NcbiAgICAgICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShvYmouZG9jTWV0YWRhdGEudGFncykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmouZG9jTWV0YWRhdGEudGFncy5pbmNsdWRlcyhvcHRpb25zLnRhZykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgb2JqICR7b2JqLnZwYXRofSBmb3VuZD0ke2ZvdW5kfSB0YWcgJHtvcHRpb25zLnRhZ30gaW4gYCwgb2JqLmRvY01ldGFkYXRhLnRhZ3MpO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoZm91bmQpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENhbm5vdCBwb3NzaWJseSBoYXZlIHRoZSB0YWdcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMucm9vdFBhdGgpIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqLnZwYXRoICYmIG9iai5yZW5kZXJQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByb290UGF0aCAke29wdGlvbnMucm9vdFBhdGh9IG1hdGNoZXMgJHtvYmoucmVuZGVyUGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmoucmVuZGVyUGF0aC5zdGFydHNXaXRoKG9wdGlvbnMucm9vdFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgTk8gTUFUQ0ggQVQgQUxMIHJvb3RQYXRoICR7b3B0aW9ucy5yb290UGF0aH0gbWF0Y2hlcyAke29iai5yZW5kZXJQYXRofWApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmdsb2IpIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqLnZwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbWluaW1hdGNoKG9iai52cGF0aCwgb3B0aW9ucy5nbG9iKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJnbG9iKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai5yZW5kZXJQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbWluaW1hdGNoKG9iai5yZW5kZXJQYXRoLCBvcHRpb25zLnJlbmRlcmdsb2IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbmRlcmVycyAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnMucmVuZGVyZXJzKSkge1xuICAgICAgICAgICAgICAgIGxldCByZW5kZXJlciA9IGZjYWNoZS5jb25maWcuZmluZFJlbmRlcmVyUGF0aChvYmoudnBhdGgpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXJlciBmb3IgJHtvYmoudnBhdGh9IGAsIHJlbmRlcmVyKTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlbmRlcmVyKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCByIG9mIG9wdGlvbnMucmVuZGVyZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBjaGVjayByZW5kZXJlciAke3R5cGVvZiByfSAke3JlbmRlcmVyLm5hbWV9ICR7cmVuZGVyZXIgaW5zdGFuY2VvZiByfWApO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09ICdzdHJpbmcnICYmIHIgPT09IHJlbmRlcmVyLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgciA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1dBUk5JTkc6IE1hdGNoaW5nIHJlbmRlcmVyIGJ5IG9iamVjdCBjbGFzcyBpcyBubyBsb25nZXIgc3VwcG9ydGVkJywgcik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBObyBsb25nZXIgc3VwcG9ydCBtYXRjaGluZyBieSBvYmplY3QgY2xhc3MuXG4gICAgICAgICAgICAgICAgICAgIC8vIE1hdGNoaW5nIGJ5IHJlbmRlcmVyLm5hbWUgc2hvdWxkIGJlIGVub3VnaC5cblxuICAgICAgICAgICAgICAgICAgICAvKiBlbHNlIGlmICgodHlwZW9mIHIgPT09ICdvYmplY3QnIHx8IHR5cGVvZiByID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiByZW5kZXJlciBpbnN0YW5jZW9mIHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSAqL1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBzZWFyY2ggJHtyZW5kZXJlci5uYW1lfSBub3QgaW4gJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5yZW5kZXJlcnMpfSAke29iai52cGF0aH1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZmlsdGVyZnVuYykge1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5maWx0ZXJmdW5jKGZjYWNoZS5jb25maWcsIG9wdGlvbnMsIG9iaikpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGZpbHRlcmZ1bmMgcmVqZWN0ZWQgJHtvYmoudnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KVxuICAgICAgICAvLyAud2hlcmUoZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIC8vICAgICBpZiAoY291bnRlcjEgPiAxNTApIHJldHVybiB0cnVlO1xuICAgICAgICAvLyAgICAgY291bnRlcjErK1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYEJFRk9SRSBTT1JUICR7b2JqLnZwYXRofSAke29iai5wdWJsaWNhdGlvbkRhdGV9YCk7XG4gICAgICAgIC8vICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgXG5cbiAgICAgICAgbGV0IHJldDI7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zb3J0QnkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyByZXQyID0gcmV0LnNpbXBsZXNvcnQob3B0aW9ucy5zb3J0QnksIHtcbiAgICAgICAgICAgIC8vICAgICBkZXNjOiBvcHRpb25zLnNvcnRCeURlc2NlbmRpbmcgPT09IHRydWUgPyB0cnVlIDogZmFsc2VcbiAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgLy8gcmV0MiA9IHJldC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIC8vICAgICBpZiAoYVtvcHRpb25zLnNvcnRCeV0gPT09IGJbb3B0aW9ucy5zb3J0QnldKSByZXR1cm4gMDtcbiAgICAgICAgICAgIC8vICAgICBpZiAoYVtvcHRpb25zLnNvcnRCeV0gPiBiW29wdGlvbnMuc29ydEJ5XSkge1xuICAgICAgICAgICAgLy8gICAgICAgICByZXR1cm4gb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nID09PSB0cnVlID8gMSA6IC0xO1xuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vICAgICBpZiAoYVtvcHRpb25zLnNvcnRCeV0gPCBiW29wdGlvbnMuc29ydEJ5XSkge1xuICAgICAgICAgICAgLy8gICAgICAgICByZXR1cm4gb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nID09PSBmYWxzZSA/IC0xIDogMTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHNvcnREZXNjID0gb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nID09PSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICA/IFsgWyBvcHRpb25zLnNvcnRCeSwgdHJ1ZSBdIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIDogWyBvcHRpb25zLnNvcnRCeSBdO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHNlYXJjaCBzb3J0QnkgJHtvcHRpb25zLnNvcnRCeX0gZGVzYyAke29wdGlvbnMuc29ydEJ5RGVzY2VuZGluZ31gLCBzb3J0RGVzYyk7XG4gICAgICAgICAgICByZXQyID0gcmV0LmNvbXBvdW5kc29ydChzb3J0RGVzYyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMuc29ydEZ1bmMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldDIgPSByZXQuc29ydChvcHRpb25zLnNvcnRGdW5jKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldDIgPSByZXQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb3VudGVyMSA9IDA7XG4gICAgICAgIC8vIHJldDIud2hlcmUoZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIC8vICAgICBpZiAoY291bnRlcjEgPiAxNTApIHJldHVybiB0cnVlO1xuICAgICAgICAvLyAgICAgY291bnRlcjErK1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYEFGVEVSIFNPUlQgJHtvYmoudnBhdGh9ICR7b2JqLnB1YmxpY2F0aW9uRGF0ZX1gKTtcbiAgICAgICAgLy8gICAgIHJldHVybiB0cnVlO1xuICAgICAgICAvLyB9KTtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub2Zmc2V0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHNlYXJjaCBvZmZzZXQgJHtvcHRpb25zLm9mZnNldH1gKTtcbiAgICAgICAgICAgIHJldDIgPSByZXQyLm9mZnNldChvcHRpb25zLm9mZnNldCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxpbWl0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHNlYXJjaCBsaW1pdCAke29wdGlvbnMubGltaXR9YCk7XG4gICAgICAgICAgICByZXQyID0gcmV0Mi5saW1pdChvcHRpb25zLmxpbWl0KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmV0MyA9IHJldDIuZGF0YSh7XG4gICAgICAgICAgICByZW1vdmVNZXRhOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zb3J0QnkgPT09ICdzdHJpbmcnXG4gICAgICAgICAmJiAob3B0aW9ucy5zb3J0QnkgPT09ICdwdWJsaWNhdGlvbkRhdGUnXG4gICAgICAgICAgIHx8IG9wdGlvbnMuc29ydEJ5ID09PSAncHVibGljYXRpb25UaW1lJykpIHtcblxuICAgICAgICAgICAgcmV0MyA9IHJldDMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBhRGF0ZSA9IGEubWV0YWRhdGEgJiYgYS5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICAgICAgPyBhLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZVxuICAgICAgICAgICAgICAgICAgICA6IGEucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgIGxldCBiRGF0ZSA9IGIubWV0YWRhdGEgJiYgYi5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGVcbiAgICAgICAgICAgICAgICAgICAgPyBiLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZVxuICAgICAgICAgICAgICAgICAgICA6IGIucHVibGljYXRpb25EYXRlO1xuICAgICAgICAgICAgICAgIGlmIChhRGF0ZSA9PT0gYkRhdGUpIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGlmIChhRGF0ZSA+IGJEYXRlKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgaWYgKGFEYXRlIDwgYkRhdGUpIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIC8vIGlmIChhLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA9PT0gYi5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIC8vIGlmIChhLm1ldGFkYXRhLnB1YmxpY2F0aW9uRGF0ZSA+IGIubWV0YWRhdGEucHVibGljYXRpb25EYXRlKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgLy8gaWYgKGEubWV0YWRhdGEucHVibGljYXRpb25EYXRlIDwgYi5tZXRhZGF0YS5wdWJsaWNhdGlvbkRhdGUpIHJldHVybiAxO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIGNvbnNvbGUubG9nKGBzZWxlY3QgYWZ0ZXIgZGF0YSgpICR7cmV0My5sZW5ndGh9IGlzIGFycmF5ICR7QXJyYXkuaXNBcnJheShyZXQzKX1gLCByZXQzLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoaXRlbS5wdWJsaWNhdGlvbkRhdGUpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdGltZTogbmV3IERhdGUoaXRlbS5wdWJsaWNhdGlvbkRhdGUpLmdldFRpbWUoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkpOyAqL1xuICAgICAgICBpZiAob3B0aW9ucy5yZXZlcnNlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgc2VsZWN0IHJldHVybiByZXZlcnNlYCk7XG4gICAgICAgICAgICByZXQzLnJldmVyc2UoKTtcblxuICAgICAgICAgICAgLyogY29uc29sZS5sb2coYHNlbGVjdCBhZnRlciByZXZlcnNlICR7cmV0My5sZW5ndGh9ICBpcyBhcnJheSAke0FycmF5LmlzQXJyYXkocmV0Myl9YCwgcmV0My5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdnBhdGg6IGl0ZW0udnBhdGgsIGRhdGU6IGl0ZW0uZG9jTWV0YWRhdGEucHVibGljYXRpb25EYXRlIH0gXG4gICAgICAgICAgICB9KSk7ICovXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDM7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc2VhcmNoICR7b3B0aW9uc30gZ2F2ZSBlcnJvciAke2Vyci5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHJlYWREb2N1bWVudChpbmZvKSB7IHRocm93IG5ldyBFcnJvcignRG8gbm90IHVzZSByZWFkRG9jdW1lbnQnKTsgfVxuXG59XG5cbiJdfQ==