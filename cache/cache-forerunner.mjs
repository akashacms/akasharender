
import path from 'path';
import { default as ForerunnerDB } from 'forerunnerdb';

const fdb = new ForerunnerDB();
let db;

const caches = new Map();

/*
TODO - Write tests for this module 
TODO - Test this module with the usage in HTMLRenderer
TODO - rewrite watchmen to simply send events 
TODO - write tests
TODO - When adding directories - reconfigure watchmen instances and have them add data to cache instances 
TODO - write tests
TODO - Rewrite code in filez and documents to use the cache instances 
TODO - write tests
TODO - rewrite HTMLFormatter.frontmatter to use the file cache 
*/

export async function setup(config) {
    try {
        // console.log(`cache setup ${config.cacheDir}`);
        db = fdb.db('akasharender' /* path.basename(config.configDir) */);
        db.persist.dataDir(config.cacheDir);
        // console.log(`cache setup finished`);
    } catch (err) {
        console.error(`cache-forerunner setup FAIL TO INITIALIZE `, err);
        throw err;
    }
}

export function close() {
    db = undefined;
}

export async function save() {
    const promises = [];
    for (let cachenm of caches.keys()) {
        promises.push(new Promise((resolve, reject) => {
            caches.get(cachenm).save(function (err) {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        }));
    }
    await Promise.all(promises);
}

export function cacheExists(cachenm) {
    return caches.has(cachenm);
}

export function view(viewnm) {
    return db.view(viewnm);
}

export function addCache(cachenm) {
    if (caches.has(cachenm)) {
        return;
        // throw new Error(`Cache ${cachenm} already exists`);
    }
    let coll = db.collection(cachenm, { autoCreate: true });
    caches.set(cachenm, coll);

    // This function must be synchronous, because getCache must be synchronous.
    // Hence we cannot perform an asynchronous operation like using coll.load.
    //
    // We've added a new function, loadCache, that is untested for now,
    // which is to be used in such cases.

    /* await new Promise((resolve, reject) => {
        coll.load(function (err) {
            if (!err) resolve();
            else reject(`Failed to load ${cachenm} because ${err}`);
        });
    }); */
}

export function getCache(cachenm, options) {
    if (!caches.has(cachenm)) {
        if (!options || !options.create) {
            throw new Error(`Cache ${cachenm} does not exist`);
        } else {
            addCache(cachenm);
        }
    }
    return caches.get(cachenm);
}

export function deleteCache(cachenm) {
    if (!caches.has(cachenm)) {
        throw new Error(`Cache ${cachenm} does not exist`);
    }
    let coll = caches.get(cachenm);
    coll.drop();
    caches.delete(cachenm);
}

export async function loadCache(cachenm) {
    if (!cacheExists(cachenm)) {
        addCache(cachenm);
    }
    const coll = getCache(cachenm);
    await new Promise((resolve, reject) => {
        coll.load(function (err) {
            if (!err) resolve();
            else reject(`Failed to load ${cachenm} because ${err}`);
        });
    });
}

export function find(cachenm, where) {
    if (!cacheExists(cachenm)) {
        addCache(cachenm);
    }
    const cache = getCache(cachenm);
    return cache.find(where);
}

export function insert(cachenm, document) {
    if (!cacheExists(cachenm)) {
        addCache(cachenm);
    }
    const cache = getCache(cachenm);
    cache.insert(document);
}

export function upsert(cachenm, document) {
    if (!cacheExists(cachenm)) {
        addCache(cachenm);
    }
    const cache = getCache(cachenm);
    cache.upsert(document);
}
