
import util from 'util';
import EventEmitter from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { DirsWatcher } from '@akashacms/stacked-dirs';
import { getCache } from './cache-forerunner.mjs';
import minimatch from 'minimatch';
import fastq from 'fastq';

export var documents;
export var assets;
export var layouts;
export var partials;

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

export async function setupDocuments(config) {
    try {
        // console.log(`filecache setup documents ${util.inspect(config.documentDirs)}`);
        const docsDirs = remapdirs(config.documentDirs);
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

export async function setup(config) {
    try {
        // console.log(`filecache setup documents ${util.inspect(config.documentDirs)}`);
        await setupDocuments(config);

        // console.log(`filecache setup assets ${util.inspect(config.assetDirs)}`);
        await setupAssets(config);

        // console.log(`filecache setup layouts ${util.inspect(config.layoutDirs)}`);
        await setupLayouts(config);

        // console.log(`filecache setup partials ${util.inspect(config.partialsDirs)}`);
        await setupPartials(config);

        // console.log(`filecache setup finished`);
    } catch (err) {
        console.error(`file-cache setup FAIL TO INITIALIZE `, err);
        throw err;
    }
}

export async function close() {
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

/**
 * FileCache listens to events from DirsWatcher, maintaining file data in
 * a corresponding cache.  There is meant to be four FileCache instances to
 * hold <em>Documents</em>, <em>Assets</em>, <em>Layouts</em>, and 
 * <em>Partials</em>.
 * 
 * In the constructor we are given an array of directory descriptors, and
 * the collection name to use in the cache.  We use this to setup a DirsWatcher
 * instance.  The setup method adds listeners to the DirsWatcher instance,
 * and in those listeners we maintain data in the cache instance. 
 * 
 * TODO: Document the dirs descriptors.  These are objects that are currently
 * added to Configuration object.
 */
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
        let that = this;
        this[_symb_queue] = fastq.promise(async function(event) {
            if (event.collection !== that.collection) {
                throw new Error(`handleChanged event for wrong collection; got ${event.collection}, expected ${that.collection}`);
            }
            if (event.code === 'changed') {
                try {
                    // console.log(`change ${event.collection} ${event.info.vpath}`);
                    await that.handleChanged(event.collection, event.info);
                    that.emit('change', event.collection, event.info);
                } catch (e) {
                    that.emit('error', {
                        code: event.code,
                        collection: event.collection,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            } else if (event.code === 'added') {
                try {
                    // console.log(`add ${event.collection} ${event.info.vpath}`);
                    await that.handleAdded(event.collection, event.info);
                    that.emit('add', event.collection, event.info);
                } catch (e) {
                    that.emit('error', {
                        code: event.code,
                        collection: event.collection,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            } else if (event.code === 'unlinked') {
                try {
                    // console.log(`unlink ${event.collection} ${event.info.vpath}`, event.info);
                    await that.handleUnlinked(event.collection, event.info);
                    that.emit('unlink', event.collection, event.info);
                } catch (e) {
                    that.emit('error', {
                        code: event.code,
                        collection: event.collection,
                        vpath: event.info.vpath,
                        error: e
                    });
                }
            } else if (event.code === 'ready') {
                await that.handleReady(event.collection);
                that.emit('ready', event.collection);
            }
        }, 1);
    }

    get config()     { return this[_symb_config]; }
    get dirs()       { return this[_symb_dirs]; }
    get collection() { return this[_symb_collnm]; }
    set cacheContent(doit) { this[_symb_cache_content] = doit; }
    get gacheContent() { return this[_symb_cache_content]; }
    set mapRenderPath(doit) { this[_symb_map_renderpath] = doit; }
    get mapRenderPath() { return this[_symb_map_renderpath]; }

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
        if (this[_symb_watcher]) {
            await this[_symb_watcher].close();
            this[_symb_watcher] = undefined;
        }
    }

    getCollection(collection) {
        if (!collection) {
            collection = this[_symb_collnm];
        }
        return getCache(collection, { create: true });
    }

    async gatherInfoData(info) {

        try {
            info.stats = await fs.stat(info.fspath);
        } catch (err) {
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
            }
        } else {
            info.renderPath = info.vpath;
            info.renderpath = info.vpath;
        }
    }

    async handleChanged(collection, info) {
        // console.log(`PROCESS ${collection} handleChanged`, info.vpath);
        if (collection !== this.collection) {
            throw new Error(`handleChanged event for wrong collection; got ${collection}, expected ${this.collection}`);
        }
        await this.gatherInfoData(info);
        info.stack = undefined;

        let coll = this.getCollection(collection);
        coll.update({
            vpath: {
                $eq: info.vpath
            },
            mounted: {
                $eq: info.mounted
            }
        }, info);

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
        // console.log(`PROCESS ${collection} handleAdded`, info.vpath);
        if (collection !== this.collection) {
            throw new Error(`handleAdded event for wrong collection; got ${collection}, expected ${this.collection}`);
        }
        await this.gatherInfoData(info);
        info.stack = undefined;

        let coll = this.getCollection(collection);
        coll.insert(info);

        await this.config.hookFileAdded(collection, info);
    }

    async handleUnlinked(collection, info) {
        // console.log(`PROCESS ${collection} handleUnlinked`, info.vpath);
        if (collection !== this.collection) {
            throw new Error(`handleUnlinked event for wrong collection; got ${collection}, expected ${this.collection}`);
        }

        await this.config.hookFileUnlinked(collection, info);

        let coll = this.getCollection(collection);
        coll.remove({
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

    async setup() {
        // Set up indexes.  We developed these based on the
        // frequent queries that are made.
        const coll = this.getCollection(this.collection);
        const indexing = {
            vpath: 1, fspath: 1, renderPath: 1, mountPoint: 1,
            rendersToHTML: true,
            docMetadata: { layout: 1 }
        };
        coll.ensureIndex(indexing);

        // console.log(`${this.collection} setup indexes`, indexing);

        for (let plugin of this.config.plugins) {
            let ind = plugin.cacheIndexes[this.collection];
            if (ind) {
                // console.log(`${this.collection} setup ${plugin.name} index`, ind);
                coll.ensureIndex(ind);
            }
        }

        // Set up the Chokidar instance.
        if (this[_symb_watcher]) {
            await this[_symb_watcher].close();
        }
        // console.log(`file-cache ${this.collection} setup DirsWatcher ${util.inspect(this.dirs)}`);
        this[_symb_watcher] = new DirsWatcher(this.collection);
        
        this[_symb_watcher].on('change', async (collection, info) => {
            // console.log(`${collection} changed ${info.vpath}`);
            this[_symb_queue].push({
                code: 'changed',
                collection, info
            });
        })
        .on('add', async (collection, info) => {
            // console.log(`new ${collection} ${info.vpath}`);
            this[_symb_queue].push({
                code: 'added',
                collection, info
            });
        })
        .on('unlink', async (collection, info) => {
            // console.log(`unlink ${collection} ${info.vpath}`);
            this[_symb_queue].push({
                code: 'unlinked',
                collection, info
            });
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

    // TODO Spin off a function dirForFSPath to look for the dirz entry
    // that best matches a path in the filesystem
    //
    // TODO Create function dirForFile to look for the dirz entry
    // that best matches a path in the project structure
    /*
    find needs to search based on rendered file name 
    hence, the item in the cache needs to include rendered path
    but, how to add the rendered path to each document?
    idea - in the add or update METHODS, retrieve the Object, compute 
    the rendered path, then update the object with that path
    */

    find(_fpath) {
        // console.log(`find ${_fpath}`);
        let ret;
        let coll = this.getCollection(this.collection);

        let fpath = _fpath.startsWith('/')
                    ? _fpath.substring(1)
                    : _fpath;

        let results = coll.find({
            // As just described all three of these conditions
            // must be true for a match
            $or: [
                { vpath: { $eeq: fpath } },
                { renderPath: { $eeq: fpath } }
            ]
        });
        if (results.length > 0) {
            /* if (fpath.indexOf("file.txt") >= 0) {
                console.log(`found ${fpath} `, results);
            } */
            // console.log(`FileCache find found ${fpath} `, results);
            ret = results[0];
        }
        // console.log(`find ${fpath} ${ret ? 'SUCCESS' : 'FAIL'}`);
        return ret;

        /*
        // Select the mount points which might have this file
        let mounts = [];
        for (let entry of this[_symb_dirs]) {
            if (entry.mountPoint === '/') mounts.push(entry);
            else if (fpath.indexOf(entry.mountPoint) === 0) mounts.push(entry);
        }
        // console.log(`find ${fpath} mounts ==> `, mounts);
        if (mounts.length === 0) {
            throw new Error(`No mountPoint found for ${fpath}`);
        }
        /* if (fpath.indexOf("file.txt") >= 0) {
            console.log(mounts);
        } *--/

        // Query for files, taking the mount points in order
        // Matching a mount point requires that it match the
        // mount path against the sourcePath in the file info
        // document, as well as either matching the path
        // or the renderPath
        //
        // Remember what we need is the first file which matches
        // the path or the renderPath.  In this case "first" means
        // the first mount point that contains that file.
        let ret;
        for (let mount of mounts) {
            let results = coll.find({
                // As just described all three of these conditions
                // must be true for a match
                $and: [
                    { mountPoint: { $eeq: mount.mountPoint } },
                    { sourcePath: { $eeq: mount.path       } },
                    {
                        $or: [
                            { path: { $eeq: fpath } },
                            { renderPath: { $eeq: fpath } }
                        ]
                    }
                ]
            });
            // console.log(`${this.collection} find mountPoint ${mount.path} AND path $eq ${fpath} || renderPath $eq ${fpath}  length=${results.length}`);
            if (results.length > 0) {
                /* if (fpath.indexOf("file.txt") >= 0) {
                    console.log(`found ${util.inspect(mount)} ${fpath} `, results);
                } *--/
                ret = results[0];
                break;
            } /* else {
                if (fpath.indexOf("file.txt") >= 0) {
                    console.log(`NOT found ${util.inspect(mount)} ${fpath} `);
                }
            } *--/
        }
        /* if (fpath.indexOf("file.txt") >= 0) {
            console.log(`find ${fpath} found ==> `, ret);
        } *--/
        return ret; */
    }

    siblings(_fpath) {
        let coll = this.getCollection(this.collection);
        let vpath = _fpath.startsWith('/')
                    ? _fpath.substring(1)
                    : _fpath;
        let dirname = path.dirname(vpath);
        if (dirname === '.') dirname = '/';
        let ret = coll.find({
            dirname: { $eeq: dirname },
            vpath: { $nee: vpath },
            renderPath: /\.html$/
        }, {
            $orderBy: { vpath: 1 }
        });
        return ret;
    }

    /**
     * Returns the files that render to <code>index.html</code> under
     * the given directory.
     */
    indexFiles(_dirname) {
        let coll = this.getCollection(this.collection);
        let dirname = _dirname && _dirname.startsWith('/')
                    ? _dirname.substring(1)
                    : _dirname;
        if (dirname === '.'
         || dirname === ''
         || typeof dirname === 'undefined') {
            dirname = '/';
        }
        const selector = {
            $or: [
                { renderPath: /\/index\.html$/ },
                { renderPath: /^index\.html$/ }
            ]
        };
        if (dirname !== '/') {
            selector.vpath = new RegExp(`^${dirname}`);
        }
        // console.log(selector);
        let ret = coll.find(selector, {
            $orderBy: { dirname: 1 }
        });
        return ret;
    }

    paths() {
        // console.log(`paths ${this.collection}`);
        let coll = this.getCollection(this.collection);
        let paths = coll.find({
            $distinct: { vpath: 1 }
        }, { fspath: 1, vpath: 1, renderPath: 1 });
        // console.log(paths);
        const ret = [];
        for (let p of paths) {
            // console.log(p.path);
            // let info = this.find(p.vpath);
            ret.push({
                fspath: p.fspath,
                vpath: p.vpath,
                renderPath: p.renderPath
            });
        }
        return ret;
    }

    documentsWithTags() {
        let coll = this.getCollection(this.collection);
        let docs = coll.find({
            $and: [
                { renderPath: /\.html$/ },
                { $exists: { metadata: 1 }},
                { metadata: { $count: { tags: { $gte: 1 }}}}
            ]
        });
        return docs;
    }

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

    // Search among the documents for ones matching the conditions named in
    // the options object
    //
    //    pathmatch - must be a regular expression with which to match
    //         the path
    //    renderpathmatch - like pathmatch, but matching against renderPath
    //    glob - like pathmatch, but using a Glob expression rather 
    //         than a regular expression
    //    renderglob - like glob, but matching against renderPath
    //    mime - strict equality against the MIME type
    //    rootPath - Select only files within the path specified
    //    layouts - Select only files using one of the named layout files
    //    renderers - Selects files that would be rendered by
    //         a specific Renderer subclass
    //    filterfunc - Supply a function that is called for each file, to
    //         implement a custom selection

    search(config, options) {
        let documents = [];
        const selector = {
            $distinct: { vpath: 1 }
        };
        if (options.pathmatch) {
            if (typeof options.pathmatch === 'string') {
                selector.vpath = new RegExp(options.pathmatch);
            } else if (options.pathmatch instanceof RegExp) {
                selector.vpath = options.pathmatch;
            } else {
                throw new Error(`Incorrect PATH check ${options.pathmatch}`);
            }
        }
        if (options.renderpathmatch) {
            if (typeof options.renderpathmatch === 'string') {
                selector.renderPath = new RegExp(options.renderpathmatch);
            } else if (options.renderpathmatch instanceof RegExp) {
                selector.renderPath = options.renderpathmatch;
            } else {
                throw new Error(`Incorrect PATH check ${options.renderpathmatch}`);
            }
        }
        if (options.mime) {
            if (typeof options.mime === 'string') {
                selector.mime = { $eeq: options.mime };
            } else if (Array.isArray(options.mime)) {
                selector.mime = { $in: options.mime };
            } else {
                throw new Error(`Incorrect MIME check ${options.mime}`);
            }
        }
        if (options.layouts) {
            if (typeof options.layouts === 'string') {
                selector.docMetadata = {
                    layout: { $eeq: options.layouts }
                }
            } else if (Array.isArray(options.layouts)) {
                selector.docMetadata = {
                    layout: { $in: options.layouts }
                }
            } else {
                throw new Error(`Incorrect LAYOUT check ${options.layouts}`);
            }
        }
        let coll = this.getCollection(this.collection);
        let paths = coll.find(selector, {
            vpath: 1,
            $orderBy: { renderPath: 1 }
        });
        for (let p of paths) {
            let info = this.find(p.vpath);
            documents.push(info);
        }

        if (options.tag) {
            documents = documents.filter(doc => {
                if (!doc.metadata) return false;
                return (doc.metadata.tags.includes(options.tag))
                    ? true : false;
            });
        }

        if (options.rootPath) {
            documents = documents.filter(doc => {
                return (doc.renderPath.startsWith(options.rootPath))
                    ? true : false;
            });
        }

        if (options.glob) {
            documents = documents.filter(doc => {
                return minimatch(doc.vpath, options.glob);
            });
        }

        if (options.renderglob) {
            documents = documents.filter(doc => {
                return minimatch(doc.renderPath, options.renderglob);
            });
        }

        if (options.renderers) {
            documents = documents.filter(doc => {
                if (!options.renderers) return true;
                let renderer = config.findRendererPath(doc.vpath);
                for (let renderer of options.renderers) {
                    if (renderer instanceof renderer) {
                        return true;
                    }
                }
                return false;
            });
        }

        if (options.filterfunc) {
            documents = documents.filter(doc => {
                return options.filterfunc(config, options, doc);
            });
        }

        return documents;
    }

    // We've rewritten to support pulling in the data
    // all the time rather than forcing code to
    // call this function.  We put this dummy function
    // in place to avoid making changes right now.
    async readDocument(info) { return info; }
}
