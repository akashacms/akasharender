#!/usr/bin/env node

/**
 *
 * Copyright 2014-2019 David Herron
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

'use strict';

const program   = require('commander');
const path      = require('path');
const util      = require('util');
const filez     = require('./filez');
const data      = require('./data');

process.title = 'akasharender';
program.version('0.7.0');

program
    .command('copy-assets <configFN>')
    .description('Copy assets into output directory')
    .action(async (configFN) => {
        try {
            const config = require(path.join(process.cwd(), configFN));
            await config.copyAssets();
        } catch (e) {
            console.error(`copy-assets command ERRORED ${e.stack}`);
        }

    });

program
    .command('document <configFN> <documentFN>')
    .description('Show information about a document')
    .action(async (configFN, documentFN) => {
        const akasha    = require('./index');

        try {
            const config = require(path.join(process.cwd(), configFN));
            let doc = await akasha.readDocument(config, documentFN);
            console.log(`
basedir: ${doc.basedir}
docpath: ${doc.docpath}
fullpath: ${doc.fullpath}
renderer: ${util.inspect(doc.renderer)}
renderpath: ${doc.renderpath}

data: ${doc.data}

metadata: ${util.inspect(doc.metadata)}

text: ${doc.text}


`);
        } catch (e) {
            console.error(`document command ERRORED ${e.stack}`);
        }
    });

program
    .command('render-document <configFN> <documentFN>')
    .description('Render a document into output directory')
    .action(async (configFN, documentFN) => {
        const akasha    = require('./index');
        try {
            const config = require(path.join(process.cwd(), configFN));
            data.init();
            let found = await filez.findRendersTo(config, documentFN);
            let result = await akasha.renderDocument(
                        config,
                        found.foundDir,
                        found.foundPathWithinDir,
                        config.renderTo,
                        found.foundMountedOn,
                        found.foundBaseMetadata);
            console.log(result);
        } catch (e) {
            console.error(`copy-assets command ERRORED ${e.stack}`);
        }
    });

program
    .command('render <configFN>')
    .description('Render a site into output directory')
    .action(async (configFN) => {
        const akasha    = require('./index');
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let results = await akasha.render(config);
            for (let result of results) {

                // TODO --- if AKASHARENDER_TRACE_RENDER then output tracing data
                // TODO --- also set process.env.GLOBFS_TRACE=1

                if (result.error) {
                    console.error(result.error);
                } else {
                    console.log(result.result);
                    // console.log(util.inspect(result.result));
                }
            }
        } catch (e) {
            console.error(`render command ERRORED ${e.stack}`);
        }
    });


program.parse(process.argv);
