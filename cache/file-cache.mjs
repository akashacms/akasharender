
import util from 'util';
import EventEmitter from 'events';
import { DirsWatcher } from '../watcher/watcher.mjs';
import { getCache } from './cache-forerunner.mjs';
import { METHODS } from 'http';

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

let config; // Record the AkashaRender Configuration object

export var documents;
export var assets;
export var layouts;
export var partials;

const remapdirs = dirz => {
    return dirz.map(dir => {
        // console.log('document dir ', dir);
        if (typeof dir === 'string') return { path: dir, mountPoint: '/' };
        else return { path: dir.src, mountPoint: dir.dest };
    });
};

export async function setup(_config) {
    config = _config;

    // console.log(`filecache setup documents ${util.inspect(config.documentDirs)}`);
    const docsDirs = remapdirs(config.documentDirs);
    documents = new FileCache(docsDirs, 'documents');
    await documents.setup();

    // console.log(`filecache setup assets ${util.inspect(config.assetDirs)}`);
    const assetsDirs = remapdirs(config.assetDirs);
    assets = new FileCache(assetsDirs, 'assets');
    await assets.setup();

    // console.log(`filecache setup layouts ${util.inspect(config.layoutDirs)}`);
    const layoutDirs = remapdirs(config.layoutDirs);
    layouts = new FileCache(layoutDirs, 'layouts');
    await layouts.setup();

    // console.log(`filecache setup partials ${util.inspect(config.partialsDirs)}`);
    const partialsDirs = remapdirs(config.partialsDirs);
    partials = new FileCache(partialsDirs, 'partials');
    await partials.setup();

    // console.log(`filecache setup finished`);
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



const _symb_dirs = Symbol('dirs');
const _symb_collnm = Symbol('collection-name');
const _symb_watcher = Symbol('watcher');
const _symb_is_ready = Symbol('isReady');

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
     * @param dirs array of directories and mount points to watch
     * @param collection string giving the name for this watcher collection
     * @param persistPath string giving the location to persist this collection
     */
    constructor(dirs, collection) {
        super();
        // console.log(`FileCache ${collection} constructor dirs=${util.inspect(dirs)}`);
        this[_symb_dirs] = dirs;
        this[_symb_collnm] = collection;
        this[_symb_is_ready] = false;
    }

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

    async setup() {
        if (this[_symb_watcher]) {
            await this[_symb_watcher].close();
        }
        // console.log(`file-cache ${this.collection} setup DirsWatcher ${util.inspect(this.dirs)}`);
        this[_symb_watcher] = new DirsWatcher(this.dirs, this.collection);
        
        this[_symb_watcher].on('change', (collection, info) => {
            console.log(`${collection} changed ${info.path}`);
            let coll = getCache(collection, { create: true });
            let renderer = config.findRendererPath(info.path);
            if (renderer) {
                info.renderPath = renderer.filePath(info.path);
            } else {
                info.renderPath = info.path;
            }
            coll.update({
                path: {
                    $eq: info.path
                },
                sourcePath: {
                    $eq: info.sourcePath
                }
            }, info);
            // updateFileInCache(collection, info);
            // TODO - emit a message?
        })
        .on('add', (collection, info) => {
            console.log(`new ${collection} ${info.path}`);
            let coll = getCache(collection, { create: true });
            let renderer = config.findRendererPath(info.path);
            if (renderer) {
                info.renderPath = renderer.filePath(info.path);
            } else {
                info.renderPath = info.path;
            }
            coll.upsert(info);
            // addFileToCache(collection, info);
            // TODO - emit a message?
        })
        .on('unlink', (collection, info) => {
            console.log(`unlink ${collection} ${info.path}`);
            let coll = getCache(collection, { create: true });
            coll.remove({
                path: {
                    $eq: info.path
                },
                sourcePath: {
                    $eq: info.sourcePath
                }
            });
            // removeFileFromCache(collection, info);
            // TODO - emit a message?
        })
        .on('ready', (collection) => {
            console.log(`${collection} ready`);
            this[_symb_is_ready] = true;
            this.emit('ready', collection);
            // let coll = getCache(collection, { create: true });
            // console.log(coll.find());
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

        let mounts = [];
        for (let entry of this[_symb_dirs]) {
            if (entry.mountPoint === '/') mounts.push(entry);
            else if (fpath.indexOf(entry.mountPoint) === 0) mounts.push(entry);
        }
        // console.log(`find ${fpath} mounts ==> `, mounts);
        if (mounts.length === 0) {
            throw new Error(`No mountPoint found for ${fpath}`);
        }
        let ret;
        for (let mount of mounts) {
            let results = coll.find({
                $and: [
                    {
                        sourcePath: { $eq: mount.path }
                    },
                    {
                        $or: [
                            { path: { $eq: fpath } },
                            { renderPath: { $eq: fpath } }
                        ]
                    }
                ]
            });
            if (results.length > 0) {
                ret = results[0];
                break;
            }
        }
        // console.log(`find ${fpath} found ==> `, ret);
        return ret;
    }

    paths() {
        console.log(`paths ${this.collection}`);
        let coll = getCache(this.collection, { create: true });
        let ret = coll.find({}, { renderPath: 1, path: 1 });
        return ret.map(item => {
            return { renderPath: item.renderPath, path: item.path };
        });
    }

    // TODO Add function for storing metadata on a file

}
