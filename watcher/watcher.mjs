
import { default as chokidar } from 'chokidar';
import { default as mime } from 'mime';
import * as util from 'util';
import * as path from 'path';
import EventEmitter from 'events';

const _symb_dirs = Symbol('dirs');
const _symb_watcher = Symbol('watcher');
const _symb_collnm = Symbol('collection-name');

export class DirsWatcher extends EventEmitter {

    /**
     * @param dirs array of directories and mount points to watch
     * @param collection string giving the name for this watcher collection
     */
    constructor(dirs, collection) {
        super();
        // console.log(`DirsWatcher ${collection} constructor dirs=${util.inspect(dirs)}`);
        this[_symb_dirs] = dirs;
        this[_symb_collnm] = collection;
    }

    get dirs() { return this[_symb_dirs]; }
    get collection() { return this[_symb_collnm]; }

    /**
     * Convert data we gather about a file in the file system into a descriptor object.
     * @param fspath 
     * @param stats 
     */
    fileInfo(fspath, stats) {
        let e;
        for (let entry of this.dirs) {
            if (fspath.indexOf(entry.path) === 0) {
                e = entry;
                break;
            }
        }
        if (!e) {
            throw new Error(`No mountPoint found for ${fspath}`);
        }
        let fnInSourceDir = fspath.substring(e.path.length).substring(1);
        let docpath = path.join(e.mountPoint, fnInSourceDir);
        if (docpath.startsWith('/')) {
            docpath = docpath.substring(1);
        }
        return {
            fspath: fspath,
            mime: mime.getType(fspath),
            baseMetadata: e.baseMetadata,
            sourcePath: e.path,
            mountPoint: e.mountPoint,
            pathInSource: fnInSourceDir,
            path: docpath,
            stats
        };
    }

    // TODO Does it make sense to store any file data here?
    // Such as, maintain a Map indexed by e.path to contain the object above
    // A <em>find</em> function could search that Map to retrieve data
    // There might be some more useful functions

    start() {
        if (this[_symb_watcher]) {
            throw new Error(`Watcher already started for ${this[_symb_watcher]}`);
        }
        // console.log(`start ${this[_symb_collnm]} symb_dirs ${util.inspect(this[_symb_dirs])}`);
        let towatch = this[_symb_dirs].map(item => {
            return item.path;
        })
        // console.log(`DirsWatcher ${this.collection} watching ${util.inspect(towatch)}`);
        this[_symb_watcher] = chokidar.watch(towatch, {
            persistent: true, ignoreInitial: false, awaitWriteFinish: true, alwaysStat: true
        });

        this[_symb_watcher]
            .on('change', async (fpath, stats) => { 
                let info = this.fileInfo(fpath, stats);
                this.emit('change', this.collection, info);
                // console.log(`DirsWatcher change ${fpath}`, info);
            })
            .on('add', async (fpath, stats) => {
                let info = this.fileInfo(fpath, stats);
                this.emit('add', this.collection, info);
                // console.log(`DirsWatcher add`, info);
            })
            .on('addDir', async (fpath, stats) => { 
                // ?? let info = this.fileInfo(fpath, stats);
                // ?? console.log(`DirsWatcher addDir`, info);
                // ?? this.emit('addDir', info);
            })
            .on('unlink', async fpath => { 
                let info = this.fileInfo(fpath, stats);
                // console.log(`DirsWatcher unlink ${fpath}`);
                this.emit('unlink', this.collection, info);
            })
            .on('unlinkDir', async fpath => { 
                // ?? let info = this.fileInfo(fpath, stats);
                // ?? console.log(`DirsWatcher unlinkDir ${fpath}`);
                // ?? this.emit('unlinkDir', info);
            })
            .on('ready', () => {
                // console.log('DirsWatcher: Initial scan complete. Ready for changes');
                this.emit('ready', this.collection);
            });
    }

    async close() {
        if (this[_symb_watcher]) {
            await this[_symb_watcher].close();
            this[_symb_watcher] = undefined;
        }
    }
}
