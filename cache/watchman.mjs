
import { promises as fs } from 'fs';
import path from 'path';
import fastq from 'fastq';
import data from '../data.js';
import {
    documents, assets, layouts, partials
} from './file-cache.mjs';

async function renderVPath(config, info) {
    data.remove(info.mountPoint, info.vpath);
    let result = await config.akasha.renderPath(config, info.vpath);
    console.log(result);
}

/**
 * Search for all documents that use the layout which changed, and
 * rerender them.  Obviously this function must only be called in
 * the handlers for 'change' and 'add' in layouts.
 * 
 * @param config 
 * @param info 
 */
async function renderForLayout(config, info) {
    const docs = documents.search(config, {
        layouts: [ info.vpath ]
    });

    const queue = fastq.promise(async function(item) {
        try {
            data.remove(item.mountPoint, item.vpath);
            let result = await config.akasha.renderPath(config, item.vpath);
            console.log(result);
            return "ok";
        } catch (err) {
            throw new Error(`renderForLayout FAIL to render ${item.vpath} because ${err.stack}`);
        }
    }, 10);


    const waitFor = [];
    for (let doc of docs) {
        waitFor.push(queue.push(doc));
    }

    if (waitFor.length > 0) await Promise.all(waitFor);
    console.log(`FINISH rendering ${waitFor.length} documents from changing template ${info.vpath}`);
}

async function rebuild(config) {
    data.removeAll();
    let results = await config.akasha.render(config);
    for (let result of results) {
        if (result.error) {
            console.error(result.error);
        } else {
            console.log(result.result);
        }
    }
    return results;
}

export async function watchman(config) {
    documents
    .on('change', async (collection, info) => {
        try {
            await renderVPath(config, info);
        } catch (e) {
            documents.emit('error', {
                code: 'change',
                collection: collection,
                vpath: info.vpath,
                error: e
            });
        }
    })
    .on('add', async (collection, info) => {
        try {
            await renderVPath(config, info);
        } catch (e) {
            documents.emit('error', {
                code: 'add',
                collection: collection,
                vpath: info.vpath,
                error: e
            });
        }
    })
    .on('unlink', async (collection, info) => {
        try {
            // console.log(`UNLINK ${config.renderDestination} ${info.renderPath}`);
            if (!config.renderDestination || !info.renderPath) {
                console.log(`UNLINK ${collection} could not perform unlink for `, info);
                return;
            }
            await fs.unlink(path.join(config.renderDestination, info.renderPath));
            console.log(`UNLINK ${info.renderPath}`);
        } catch (e) {
            documents.emit('error', {
                code: 'unlink',
                collection: collection,
                vpath: info.vpath,
                error: e
            });
        }
    });
    console.log('... watching documents');

    assets
    .on('change', async (collection, info) => {
        try {
            const destFN = path.join(config.renderDestination, info.renderPath);
            await fs.copyFile(info.fspath, destFN);
            console.log(`CHANGE ${info.vpath} COPY==> ${info.renderPath}`);
        } catch (e) {
            assets.emit('error', {
                code: 'change',
                collection: collection,
                vpath: info.vpath,
                error: e
            });
        }
    })
    .on('add', async (collection, info) => {
        try {
            const destFN = path.join(config.renderDestination, info.renderPath);
            await fs.copyFile(info.fspath, destFN);
            console.log(`ADD ${info.vpath} COPY==> ${info.renderPath}`);
        } catch (e) {
            assets.emit('error', {
                code: 'add',
                collection: collection,
                vpath: info.vpath,
                error: e
            });
        }
    })
    .on('unlink', async (collection, info) => {
        try {
            await fs.unlink(path.join(config.renderDestination, info.renderPath));
            console.log(`UNLINK ${info.renderPath}`);
        } catch (e) {
            assets.emit('error', {
                code: 'unlink',
                collection: collection,
                vpath: info.vpath,
                error: e
            });
        }
    });
    console.log('... watching assets');

    layouts
    .on('change', async (collection, info) => {
        try {
            await renderForLayout(config, info);
        } catch (e) {
            layouts.emit('error', {
                code: 'change',
                collection: collection,
                vpath: info.vpath,
                error: e
            });
        }
    })
    .on('add', async (collection, info) => {
        try {
            await renderForLayout(config, info);
        } catch (e) {
            layouts.emit('error', {
                code: 'add',
                collection: collection,
                vpath: info.vpath,
                error: e
            });
        }
    })
    .on('unlink', (collection, info) => {
        // Nothing to do
    });
    console.log('... watching layouts');

    partials
    .on('change', async (collection, info) => {
        try {
            await rebuild(config);
        } catch (e) {
            partials.emit('error', {
                code: 'change',
                collection: collection,
                vpath: info.vpath,
                error: e
            });
        }
    })
    .on('add', async (collection, info) => {
        try {
            await rebuild(config);
        } catch (e) {
            partials.emit('error', {
                code: 'add',
                collection: collection,
                vpath: info.vpath,
                error: e
            });
        }
    })
    .on('unlink', (collection, info) => {
        // Nothing to do
    });
    console.log('... watching partials');
}
