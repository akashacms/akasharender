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
import url  from 'url';
import { promises as fs } from 'fs';
import EventEmitter from 'events';
import minimatch from 'minimatch';
import fastq from 'fastq';


var db;  // Use to hold the LokiJS database object
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
    } catch (err) {
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
        } else {
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
        await documents.setup();
        await config.hookFileCacheSetup('documents', documents);
        // console.log(`filecache FINISH documents setup`);
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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

    get config()     { return this[_symb_config]; }
    get dirs()       { return this[_symb_dirs]; }
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
        if (vw) return vw;
        else return this.collection.addDynamicView(vname, options);
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

        this[_symb_queue] = fastq.promise(async function(event) {
            if (event.collection !== fcache.collection) {
                throw new Error(`handleChanged event for wrong collection; got ${event.collection}, expected ${that.collection}`);
            }
            if (event.code === 'changed') {
                try {
                    // console.log(`change ${event.collection} ${event.info.vpath}`);
                    await fcache.handleChanged(event.collection, event.info);
                    fcache.emit('change', event.collection, event.info);
                } catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        collection: event.collection,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            } else if (event.code === 'added') {
                try {
                    // console.log(`add ${event.collection} ${event.info.vpath}`);
                    await fcache.handleAdded(event.collection, event.info);
                    fcache.emit('add', event.collection, event.info);
                } catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        collection: event.collection,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            } else if (event.code === 'unlinked') {
                try {
                    // console.log(`unlink ${event.collection} ${event.info.vpath}`, event.info);
                    await fcache.handleUnlinked(event.collection, event.info);
                    fcache.emit('unlink', event.collection, event.info);
                } catch (e) {
                    fcache.emit('error', {
                        code: event.code,
                        collection: event.collection,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            } else if (event.code === 'ready') {
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
                } else {
                    console.log(`Ignored 'change' for ${info.vpath}`);
                }
            } catch (err) {
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
                } else {
                    console.log(`Ignored 'add' for ${info.vpath}`);
                }
            } catch (err) {
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
                } else {
                    console.log(`Ignored 'unlink' for ${info.vpath}`);
                }
             } catch (err) {
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
            // if (ignore) console.log(`ignoreFile ${info.vpath}`);
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
        while (this[_symb_dirs].length > 0 && !this[_symb_is_ready]) {
            // This does a 100ms pause
            // That lets us check is_ready every 100ms
            // at very little cost
            // console.log(`!isReady ${this.collection} ${this[_symb_dirs].length} ${this[_symb_is_ready]}`);
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve();
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
        if (typeof collection !== 'undefined') {
            throw new Error(`Do not pass collection name ${collection}`);
        }
        return db.getCollection(this.collection);
    }

    async gatherInfoData(info) {

        try {
            info.stats = await fs.stat(info.fspath);
        } catch (err) {
            console.error(`stat for ${info.fspath} failed because ${err.stack}`);
            info.stats = undefined;
        }
        info.renderPath = info.vpath;
        info.dirname = path.dirname(info.vpath);
        if (info.dirname === '.') info.dirname = '/';
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
                info.metadata = { };
                if (!info.docMetadata) info.docMetadata = {};

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
                } else if (typeof (info.metadata.tags) === 'string') {
                    let taglist = [];
                    const re = /\s*,\s*/;
                    info.metadata.tags.split(re).forEach(tag => {
                        taglist.push(tag.trim());
                    });
                    info.metadata.tags = taglist;
                } else if (!Array.isArray(info.metadata.tags)) {
                    throw new Error(
                        `FORMAT ERROR - ${info.vpath} has badly formatted tags `,
                        info.metadata.tags);
                }
                info.docMetadata.tags = info.metadata.tags;
        
                // The root URL for the project
                info.metadata.root_url = this.config.root_url;

                // Compute the URL this document will render to
                if (this.config.root_url) {
                    let pRootUrl = url.parse(this.config.root_url);
                    pRootUrl.pathname = path.normalize(
                            path.join(pRootUrl.pathname, info.metadata.document.renderTo)
                    );
                    info.metadata.rendered_url = url.format(pRootUrl);
                } else {
                    info.metadata.rendered_url = info.metadata.document.renderTo;
                }

                info.metadata.rendered_date = info.stats.mtime;

                if (!info.metadata.publicationDate) {
                    var dateSet = false;
                    if (info.docMetadata && info.docMetadata.publDate) {
                        const parsed = Date.parse(info.docMetadata.publDate);
                        if (! isNaN(parsed)) {
                            info.metadata.publicationDate = new Date(parsed);
                        }
                        dateSet = true;
                    }
                    if (! dateSet && info.stats && info.stats.mtime) {
                        info.metadata.publicationDate = new Date(info.stats.mtime);
                    }
                    if (!info.metadata.publicationDate) {
                        info.metadata.publicationDate = new Date();
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
        } else {
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
                { vpath: { '$eq': fpath }},
                { renderPath: { '$eq': fpath }}
            ]
        })
        .where(function(obj) {
            return ! fcache.ignoreFile(obj);
            // return obj.vpath === fpath || obj.renderPath === fpath;
        })
        .data({
            removeMeta: true
        });
        let ret;
        if (Array.isArray(results) && results.length > 0) {
            ret = results[0];
        } else if (Array.isArray(results) && results.length <= 0) {
            ret = undefined;
        } else {
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
        } else {
            fileName = fpath;
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
                .map(function(obj) {
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
        if (dirname === '.') dirname = '/';

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
            dvSiblings.applyWhere(function(obj) {
                return ! fcache.ignoreFile(obj);
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
                    { renderPath: { '$eq': 'index.html' }}
                ]
            });
            dvIndexFiles.applySimpleSort('dirname');
        }
        if (!dvIndexFiles) throw new Error(`Did not find view index-files`);
        // console.log(dvIndexFiles);
        // console.log(dvIndexFiles.branchResultset);

        const ret = dvIndexFiles.branchResultset()
        .where(function(obj) {
            /* const renderP = obj.renderPath === 'index.html' || obj.renderPath.endsWith('/index.html');
            if (!renderP) return false; */
            if (dirname !== '/') {
                if (obj.vpath.startsWith(dirname)) return true;
                else return false;
            } else {
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

    paths() {
        const fcache = this;
        const vpathsSeen = new Set();
        const coll = this.getCollection();
        const ret = coll.chain()
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
        })
        .map(obj => {
            return  {
                fspath: obj.fspath,
                vpath: obj.vpath,
                renderPath: obj.renderPath,
                mountPoint: obj.mountPoint,
                dirMountedOn: obj.dirMountedOn
            };
        });

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
                if (fcache.ignoreFile(obj)) return false;
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
                if (! ret.includes(tag)) ret.push(tag);
            }
        }
        return ret.sort((a, b) => {
            var tagA = a.toLowerCase();
            var tagB = b.toLowerCase();
            if (tagA < tagB) return -1;
            if (tagA > tagB) return 1;
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
                }
            } else if (Array.isArray(options.pathmatch)) {
                selector['$or'] = [];
                for (const match of options.pathmatch) {
                    selector['$or'].push({ vpath: { '$regex': match } });
                }
            } else {
                throw new Error(`FileCache search invalid pathmatch ${typeof options.pathmatch} ${util.inspect(options.pathmatch)}`);
            }
        }

        if (options.renderpathmatch) {

            if (typeof options.renderpathmatch === 'string'
            || (typeof options.renderpathmatch === 'object'
              && options.renderpathmatch instanceof RegExp)) {
                selector.renderPath = {
                    '$regex': options.renderpathmatch
                }
            } else if (Array.isArray(options.renderpathmatch)) {
                if (typeof selector['$or'] === 'undefined') {
                    selector['$or'] = [];
                }
                for (const match of options.renderpathmatch) {
                    selector['$or'].push({ renderPath: { '$regex': match } });
                }
            } else {
                throw new Error(`FileCache search invalid renderpathmatch ${util.inspect(options.renderpathmatch)}`);
            }
        }

        if (options.mime) {
            if (typeof options.mime === 'string') {
                selector.mime = {
                    '$eq': options.mime
                };
            } else if (Array.isArray(options.mime)) {
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

        let coll = this.getCollection();
        const ret = coll.chain().find(selector)
        .where(function(obj) {
            if (vpathsSeen.has(obj.vpath)) {
                return false;
            } else {
                vpathsSeen.add(obj.vpath);
                return true;
            }
        })
        .where(function(obj) {

            if (fcache.ignoreFile(obj)) return false;

            // console.log(`search where ${obj.vpath}`);

            // console.log(`search where layouts ${obj.vpath} ${obj?.docMetadata?.layout} ${util.inspect(options.layouts)}`);
            if (options.layouts) {
                let layouts;
                if (Array.isArray(options.layouts)) {
                    layouts = options.layouts;
                } else {
                    layouts = [ options.layouts ];
                }
                if (obj.vpath
                 && obj.docMetadata
                 && obj.docMetadata.layout) {
                    if (!layouts.includes(obj.docMetadata.layout)) {
                        // console.log(`REJECT ${obj.vpath} ${util.inspect(options.layouts)} did not include ${obj.docMetadata.layout}`);
                        return false;
                    } else {
                        // console.log(`INCLUDE ${obj.vpath}  ${util.inspect(options.layouts)} did include ${obj.docMetadata.layout}`);
                    }
                } else {
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
                } else {
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
                if (!renderer) return false;
                let found = false;
                for (const r of options.renderers) {
                    // console.log(`check renderer ${typeof r} ${renderer.name} ${renderer instanceof r}`);
                    if (typeof r === 'string' && r === renderer.name) {
                        found = true;
                    } else if (typeof r === 'object' || typeof r === 'function') {
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
        })

        let ret2;
        if (typeof options.sortBy === 'string') {
            const sortDesc = options.sortByDescending === true
                        ? [ [ options.sortBy, true ] ]
                        : [ options.sortBy ];
            // console.log(`search sortBy ${options.sortBy} desc ${options.sortByDescending}`, sortDesc);
            ret2 = ret.compoundsort(sortDesc);
        } else if (typeof options.sortFunc === 'function') {
            ret2 = ret.sort(options.sortFunc);
        } else {
            ret2 = ret;
        }

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
        } catch (err) {
            console.error(`search ${options} gave error ${err.stack}`);
        }
    }

    async readDocument(info) { throw new Error('Do not use readDocument'); }

}

