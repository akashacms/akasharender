
import util from 'util';
import EventEmitter from 'events';
import { DirsWatcher } from '../watcher/watcher.mjs';
import { getCache } from './cache-forerunner.mjs';
import { METHODS } from 'http';
import fastq from 'fastq';
import minimatch from 'minimatch';


/**
 * 
 * Have four sections: Documents, Assets, Layouts, Partials
 * 
 * TODO: Merge Assets and Documents?
 * 
 * For files that have metadata, parse that metadata and store in the cache.
 * 
 * Have a list of methods to search for files, handling the stacked directory setup.
 * 
 */

export var documents;
export var assets;
export var layouts;
export var partials;

const remapdirs = dirz => {
    return dirz.map(dir => {
        // console.log('document dir ', dir);
        if (typeof dir === 'string') {
            return {
                path: dir,
                mountPoint: '/',
                baseMetadata: {}
            };
        } else {
            return {
                path: dir.src,
                mountPoint: dir.dest,
                baseMetadata: dir.baseMetadata,
                ignore: dir.ignore,
                include: dir.include
            };
        }
    });
};

export async function setup(config) {
    try {

        // console.log(`filecache setup documents ${util.inspect(config.documentDirs)}`);
        const docsDirs = remapdirs(config.documentDirs);
        documents = new RenderedFileCache(config, docsDirs, 'documents');
        await documents.setup();

        // console.log(`filecache setup assets ${util.inspect(config.assetDirs)}`);
        const assetsDirs = remapdirs(config.assetDirs);
        assets = new FileCache(config, assetsDirs, 'assets');
        await assets.setup();

        // console.log(`filecache setup layouts ${util.inspect(config.layoutDirs)}`);
        const layoutDirs = remapdirs(config.layoutDirs);
        layouts = new FileCache(config, layoutDirs, 'layouts');
        await layouts.setup();

        // console.log(`filecache setup partials ${util.inspect(config.partialsDirs)}`);
        const partialsDirs = remapdirs(config.partialsDirs);
        partials = new FileCache(config, partialsDirs, 'partials');
        await partials.setup();

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
const _symb_queue = Symbol('fastq');

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
        let that = this;
        this[_symb_queue] = fastq.promise(that, this.process, 1);
    }

    get config()     { return this[_symb_config]; }
    get dirs()       { return this[_symb_dirs]; }
    get collection() { return this[_symb_collnm]; }

    /**
     * Allow a caller to wait until the <em>ready</em> event has
     * been sent from the DirsWatcher instance.  This event means the
     * initial indexing has happened.
     */
    async isReady() {
        while (!this[_symb_is_ready]) {
            // This does a 100ms pause
            // That lets us check is_ready every 100ms
            // at very little cost
            // console.log(`!isReady ${this.collection}`);
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, 100);
            })
        }        
        return true;
    }

    async close() {
        if (this[_symb_watcher]) {
            await this[_symb_watcher].close();
            this[_symb_watcher] = undefined;
        }
    }

    async process(item) {
        // let info = item.info;
        // console.log(`PROCESS ${this.collection} ${item.action} ${item && item.info ? item.info.path : 'UNDEFINED'} queue length ${this[_symb_queue].length()}`);

        if (item.action === 'change') {
            await this.doChanged(item.info);
        } else if (item.action === 'add') {
            await this.doAdded(item.info);
        } else if (item.action === 'unlink') {
            await this.doUnlinked(item.info);
        } else if (item.action === 'ready') {
            await this.doReady(item.info);
        } else {
            throw new Error(`Unknown action ${item.action} for `, item.info);
        }
    }

    async doChanged(info) {
        // console.log(`PROCESS ${this.collection} doChanged`, info.path);
        info.renderPath = info.path;

        let coll = getCache(this.collection, { create: true });
        coll.update({
            path: {
                $eq: info.path
            },
            sourcePath: {
                $eq: info.sourcePath
            }
        }, info);
    }

    async doAdded(info) {
        // console.log(`PROCESS ${this.collection} doAdded`, info.path);
        info.renderPath = info.path;

        let coll = getCache(this.collection, { create: true });
        coll.insert(info);
    }

    async doUnlinked(info) {
        // console.log(`PROCESS ${this.collection} doUnlinked`, info.path);
        let coll = getCache(collection, { create: true });
        coll.remove({
            path: {
                $eq: info.path
            },
            sourcePath: {
                $eq: info.sourcePath
            }
        });
    }

    async doReady() {
        // console.log(`PROCESS ${this.collection} doReady`);
        this[_symb_is_ready] = true;
        this.emit('ready', this.collection);
    }

    async setup() {
        if (this[_symb_watcher]) {
            await this[_symb_watcher].close();
        }
        // console.log(`file-cache ${this.collection} setup DirsWatcher ${util.inspect(this.dirs)}`);
        this[_symb_watcher] = new DirsWatcher(this.dirs, this.collection);
        
        this[_symb_watcher].on('change', async (collection, info) => {
            console.log(`${collection} changed ${info.path}`);
            this[_symb_queue].push({ action: 'change', info });
        })
        .on('add', async (collection, info) => {
            console.log(`new ${collection} ${info.path}`);
            this[_symb_queue].push({ action: 'add', info });
        })
        .on('unlink', (collection, info) => {
            console.log(`unlink ${collection} ${info.path}`);
            this[_symb_queue].push({ action: 'unlink', info });
        })
        .on('ready', (collection) => {
            console.log(`${collection} ready`);
            this[_symb_queue].push({ action: 'ready' });
        });

        this[_symb_watcher].start();
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
        let coll = getCache(this.collection, { create: true });

        let fpath = _fpath.startsWith("/")
                    ? _fpath.substring(1)
                    : _fpath;

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
        } */

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
                } */
                ret = results[0];
                break;
            } /* else {
                if (fpath.indexOf("file.txt") >= 0) {
                    console.log(`NOT found ${util.inspect(mount)} ${fpath} `);
                }
            } */
        }
        /* if (fpath.indexOf("file.txt") >= 0) {
            console.log(`find ${fpath} found ==> `, ret);
        } */
        return ret;
    }

    paths() {
        // console.log(`paths ${this.collection}`);
        let coll = getCache(this.collection, { create: true });
        let paths = coll.find({
            $distinct: { path: 1 }
        }, { path: 1 });
        // console.log(paths);
        const ret = [];
        for (let p of paths) {
            // console.log(p.path);
            let info = this.find(p.path);
            ret.push({
                fspath: info.fspath,
                path: info.path,
                renderPath: info.renderPath
            });
        }
        return ret;
    }

    // Search among the documents for ones matching the conditions named in
    // the options object
    //
    //    pathmatch - must be a regular expression with which to match
    //         the path
    //    glob - like pathmatch, but using a Glob expression rather 
    //         than a regular expression
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
            $distinct: { path: 1 }
        };
        if (options.pathmatch) {
            if (typeof options.pathmatch === 'string') {
                selector.path = new RegExp(options.pathmatch);
            } else if (options.pathmatch instanceof RegExp) {
                selector.path = options.pathmatch;
            } else {
                throw new Error(`Incorrect PATH check ${options.pathmatch}`);
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
        let coll = getCache(this.collection, { create: true });
        let paths = coll.find(selector, {
            path: 1,
            $orderBy: { renderPath: 1 }
        });
        for (let p of paths) {
            // console.log(p.path);
            let info = this.find(p.path);
            documents.push(info);
        }
        // let documents = this.paths();

        if (options.rootPath) {
            documents = documents.filter(doc => {
                return (doc.renderPath.startsWith(options.rootPath))
                    ? true : false;
            });
        }

        /* if (options.pathmatch) {
            documents = documents.filter(doc => {
                return doc.path.match(options.pathmatch) !== null;
            });
        } */

        if (options.glob) {
            documents = documents.filter(doc => {
                return minimatch(doc.path, options.glob);
            });
        }

        /* if (options.mime) {
            documents = documents.filter(doc => {
                return doc.mime === options.mime;
            });
        } */

        if (options.renderers) {
            documents = documents.filter(doc => {
                if (!options.renderers) return true;
                let renderer = config.findRendererPath(doc.path);
                for (let renderer of options.renderers) {
                    if (renderer instanceof renderer) {
                        return true;
                    }
                }
                return false;
            });
        }

        /* if (options.layouts) {
            documents = documents.filter(doc => {
                for (let layout of options.layouts) {
                    // console.log(`options.layouts ${doc.metadata.layout} === ${layout}?`);
                    try {
                        if (doc.metadata.layout === layout) {
                            return true;
                        }
                    } catch (err) {
                        console.error(`documentSearch WARN filter layouts ${doc.docpath} has no layout`);
                    }
                }
                return false;
            });
        } */

        if (options.filterfunc) {
            documents = documents.filter(doc => {
                return options.filterfunc(config, options, doc);
            });
        }

        /* documents = documents.sort((a, b) => {
            if (a.renderPath < b.renderPath) return -1;
            else if (a.renderPath === b.renderPath) return 0;
            else return 1;
        }); */

        return documents;
    }

}

export class RenderedFileCache extends FileCache {

    async readMetadata(info) {
        let renderer = this.config.findRendererPath(info.path);
        if (renderer) {
            info.renderPath = renderer.filePath(info.path);
            if (renderer 
             && renderer.readContent
             && renderer.parseFrontmatter) {
                let content = await renderer.readContent(
                    info.sourcePath,
                    info.pathInSource);
                let fm = renderer.parseFrontmatter(content);
                info.docMetadata = fm.data;
            }
        } else {
            info.renderPath = info.path;
        }
        return info;
    }

    async doChanged(info) {
        // console.log(`PROCESS RenderedFileCache ${this.collection} doChanged`, info.path);

        let coll = getCache(this.collection, { create: true });
        info = await this.readMetadata(info);
        coll.update({
            path: {
                $eq: info.path
            },
            sourcePath: {
                $eq: info.sourcePath
            }
        }, info);
    }

    async doAdded(info) {
        // console.log(`PROCESS RenderedFileCache ${this.collection} doAdded`, info.path);

        let coll = getCache(this.collection, { create: true });
        info = await this.readMetadata(info);
        // console.log(`add `, info);
        // console.log(`file-cache add ${collection} ${info.path}`, info);
        coll.insert(info);
        // console.log(`file-cache AFTER add ${collection} ${info.path}`);
        /* if (collection === "layouts") {
            let found = coll.find({
                path: { $eq: info.path }
            });
            console.log(`file-cache AFTER add  ${collection} ${info.path}`, found);
        } */
    }

}