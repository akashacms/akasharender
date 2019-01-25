#!/usr/bin/env node

'use strict';

const program   = require('commander');
const path      = require('path');
const util      = require('util');
const cache     = require('../caching');
const filez     = require('../filez');
const akasha    = require('../index');

process.title = 'akasharender';
program.version('0.4.0');

program
    .command('copy-assets <configFN>')
    .description('Copy assets into output directory')
    .action(async (configFN) => {

        try {
            const config = require(path.join(__dirname, configFN));
            await config.copyAssets();
        } catch (e) {
            console.error(`copy-assets command ERRORED ${e.stack}`);
        }

    });

program
    .command('document <configFN> <documentFN>')
    .description('Show information about a document')
    .action(async (configFN, documentFN) => {

        try {
            const config = require(path.join(__dirname, configFN));
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
        try {
            const config = require(path.join(__dirname, configFN));
            let found = await filez.findRendersTo(config.documentDirs, documentFN);
            let result = await akasha.renderDocument(
                        config,
                        found.foundDir,
                        found.foundPathWithinDir,
                        config.renderTo,
                        found.foundMountedOn,
                        {});
            console.log(result);
        } catch (e) {
            console.error(`copy-assets command ERRORED ${e.stack}`);
        }
    });

program
    .command('render <configFN>')
    .description('Render a site into output directory')
    .action(async (configFN) => {
        try {
            const config = require(path.join(__dirname, configFN));
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

/* const CommandLineInterface = require('cmnd').CommandLineInterface;
const CLI = new CommandLineInterface();

CLI.load(__dirname, '../commands');
CLI.run(process.argv.slice(2)); */
