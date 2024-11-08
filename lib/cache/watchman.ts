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

import { promises as fs } from 'fs';
import path from 'path';
import fastq from 'fastq';
import * as data from '../data.js';
import {
    documents, assets, layouts, partials
} from './file-cache-lokijs.js';

async function renderVPath(config, info) {
    await data.remove(info.mountPoint, info.vpath);
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
    const docs = documents.search({
        layouts: [ info.vpath ]
    });

    const queue = fastq.promise(async function(item) {
        try {
            await data.remove(item.mountPoint, item.vpath);
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
    await data.removeAll();
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

async function unlinkVPath(config, info) {
    if (!config.renderDestination) {
        // console.log(`UNLINK ${collection} could not perform unlink (no renderDestination) for `, info);
        return;
    }
    const renderer = config.findRendererPath(info.vpath);
    let renderPath;
    if (renderer) {
        renderPath = renderer.filePath(info.vpath);
    } else {
        renderPath = info.vpath;
    }
    await fs.unlink(path.join(config.renderDestination, renderPath));
    console.log(`UNLINK ${renderPath}`);
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
            await unlinkVPath(config, info);
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
