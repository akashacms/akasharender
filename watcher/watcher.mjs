
import { default as chokidar } from 'chokidar';
import { default as ForerunnerDB } from 'forerunnerdb';
import { default as mime } from 'mime';
import * as util from 'util';
import * as path from 'path';
import EventEmitter from 'events';

// There doesn't seem to be an official registration
// per: https://asciidoctor.org/docs/faq/
// per: https://github.com/asciidoctor/asciidoctor/issues/2502
mime.define({'text/x-asciidoc': ['adoc', 'asciidoc']});

const fdb = new ForerunnerDB();

const _symb_dirs = Symbol('dirs');
const _symb_watcher = Symbol('watcher');
const _symb_db = Symbol('db');
const _symb_collection = Symbol('collection');
const _symb_persistPath = Symbol('persist');

// dirs -- must be an array of:
//
//      { path, mountPoint }


/**
 * TODO
 *
 *   method to extract metadata from files
 *
 *      this probably requires external implementation of metadata extractor?
 *
 *      like-- per file extension, or per mime type, register an extractor function
 *
 *   select function that uses any matcher to return a collection of all
 *   files matching the matcher .. e.g. metadata.layout: blog.html.ejs
 *
 *      needs to account for directory stack in case multiple instances
 *      of the same pathname match the matcher
 *
 *   sanitize function to remove database entrails
 */

export class DirsWatcher extends EventEmitter {
    /**
     * 
     * @param dirs array of directories and mount points to watch
     * @param collection string giving the name for this watcher collection
     * @param persistPath string giving the location to persist this collection
     */
    constructor(dirs, collection, persistPath) {
        super();
        // console.log('constructor dirs=', dirs);
        this[_symb_dirs] = dirs;
        this[_symb_collection] = collection;
        this[_symb_persistPath] = persistPath;
    }

    async dbinit() {
        this[_symb_db] = fdb.db(this[_symb_collection]);
        this[_symb_db].persist.dataDir(this[_symb_persistPath]);
        await new Promise((resolve, reject) => {
            this[_symb_db].collection('filez').load(function (err) {
                if (!err) resolve();
                else reject(`Failed to load ${this[_symb_collection]} because ${err}`);
            });
        });
    }

    fileInfo(fspath, stats) {
        let e;
        for (let entry of this[_symb_dirs]) {
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
            sourcePath: e.path,
            mountPoint: e.mountPoint,
            pathInSource: fnInSourceDir,
            path: docpath,
        };
    }

    async find(fpath) {
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
            let results = this[_symb_db].collection('filez').find({
                sourcePath: mount.path,
                path: fpath
            });
            if (results.length > 0) {
                ret = results[0];
                break;
            }
        }
        // console.log(`find ${fpath} found ==> `, ret);
        return ret;
    }

    start() {
        if (this[_symb_watcher]) {
            throw new Error(`Watcher already started for ${this[_symb_watcher]}`);
        }
        // console.log('start symb_dirs ', this[_symb_dirs]);
        let towatch = this[_symb_dirs].map(item => {
            return item.path;
        })
        this[_symb_watcher] = chokidar.watch(towatch, {
            persistent: true, ignoreInitial: false
        });

        this[_symb_watcher]
            .on('change', async (fpath, stats) => { 
                let info = this.fileInfo(fpath, stats);
                this.emit('change', info);
                // console.log(`DirsWatcher change ${fpath}`, info);
            })
            .on('add', async (fpath, stats) => {
                let info = this.fileInfo(fpath, stats);
                this[_symb_db].collection('filez').insert(info);
                this.emit('add', info);
                // console.log(`DirsWatcher add`, info);
            })
            .on('addDir', async (fpath, stats) => { 
                let info = this.fileInfo(fpath, stats);
                this[_symb_db].collection('filez').insert(info);
                // console.log(`DirsWatcher addDir`, info);
            })
            .on('unlink', async fpath => { 
                // console.log(`DirsWatcher unlink ${fpath}`);
            })
            .on('unlinkDir', async fpath => { 
                // console.log(`DirsWatcher unlinkDir ${fpath}`);
            })
            .on('ready', () => {
                // console.log('DirsWatcher: Initial scan complete. Ready for changes');
                this.emit('ready');
            });
    }

    async close() {
        if (this[_symb_watcher]) {
            await this[_symb_watcher].close();
            this[_symb_watcher] = undefined;
        }
    }

}