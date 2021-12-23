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
const ghpages   = require('gh-pages');
const fs        = require('fs');
const fsp       = require('fs/promises');
const path      = require('path');
const util      = require('util');
const filez     = require('./filez');
const data      = require('./data');

// Note this is an ES6 module and to use it we must 
// use an async function along with the await keyword
const _filecache = import('./cache/file-cache.mjs');

const _watchman = import('./cache/watchman.mjs');

process.title = 'akasharender';
program.version('0.7.5');

program
    .command('copy-assets <configFN>')
    .description('Copy assets into output directory')
    .action(async (configFN) => {
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupAssets(config);
            let filecache = await _filecache;
            await filecache.assets.isReady();
            await config.copyAssets();
            await akasha.closeCaches();
        } catch (e) {
            console.error(`copy-assets command ERRORED ${e.stack}`);
        }

    });

program
    .command('document <configFN> <documentFN>')
    .description('Show information about a document')
    .action(async (configFN, documentFN) => {

        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupDocuments(config);
            const filecache = await _filecache;
            const documents = filecache.documents;
            await documents.isReady();
            const doc = await documents.find(documentFN);
            // data: ${doc.data}
            // text: ${doc.text}
            console.log(`
basedir: ${doc.basedir}
docpath: ${doc.docpath}
fspath: ${doc.fspath}
renderer: ${util.inspect(doc.renderer)}
renderpath: ${doc.renderpath}

metadata: ${util.inspect(doc.metadata)}

`);
            await akasha.closeCaches();
        } catch (e) {
            console.error(`document command ERRORED ${e.stack}`);
        }
    });

program
    .command('render-document <configFN> <documentFN>')
    .description('Render a document into output directory')
    .action(async (configFN, documentFN) => {
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetupComplete(config);
            data.init();
            console.log(`render-document before renderPath ${documentFN}`);
            let result = await akasha.renderPath(config, documentFN);
            console.log(result);
            await akasha.closeCaches();
        } catch (e) {
            console.error(`render-document command ERRORED ${e.stack}`);
        }
    });

program
    .command('render <configFN>')
    .description('Render a site into output directory')
    .option('--quiet', 'Do not print the rendering report')
    .option('--results-to <resultFile>', 'Store the results into the named file')
    .option('--perfresults <perfResultsFile>', 'Store the time to render each document')
    .action(async (configFN, cmdObj) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetupComplete(config);
            data.init();
            let results = await akasha.render(config);
            if (!cmdObj.quiet) {
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
            }
            if (cmdObj.resultsTo) {
                const output = fs.createWriteStream(cmdObj.resultsTo);
                for (let result of results) {
                    if (result.error) {
                        output.write('****ERROR '+ result.error + '\n');
                    } else {
                        output.write(result.result + '\n');
                        // console.log(util.inspect(result.result));
                    }
                }
                output.close();
            }
            if (cmdObj.perfresults) {
                const output = fs.createWriteStream(cmdObj.perfresults);
                for (let result of results) {
                    if (result.error) {
                        // Ignore
                    } else if (result.result.startsWith('COPY')) {
                        // Ignore
                    } else {
                        let results = result.result.split('\n');
                        let perf = results[0];
                        let matches = perf.match(/.* ==> (.*) \(([0-9\.]+) seconds\)$/);
                        if (!matches) continue;
                        if (matches.length < 3) continue;
                        let fn = matches[1];
                        let time = matches[2];
                        let report = `${time} ${fn}`;
                        for (let i = 1; i < results.length; i++) {
                            let stages = results[i].match(/(FRONTMATTER|FIRST RENDER|SECOND RENDER|MAHABHUTA|RENDERED) ([0-9\.]+) seconds$/);
                            if (!stages || stages.length < 3) continue;
                            report += ` ${stages[1]} ${stages[2]}`;
                        }
                        output.write(`${report}\n`);
                    }
                }
                output.close();
            }
            await akasha.closeCaches();
        } catch (e) {
            console.error(`render command ERRORED ${e.stack}`);
        }
    });

program
    .command('explain <configFN>')
    .description('Explain a cache query')
    .action(async (configFN) => {
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupDocuments(config);
            let filecache = await _filecache;
            await filecache.documents.isReady();
            data.init();
            let explanation = filecache.documents
                .getCollection(filecache.documents.collection)
                .explain(
                    /* {
                    $or: [
                        { vpath: { $eeq: "archive/java.net/2005/08/findbugs.html.md" } },
                        { renderPath: { $eeq: "archive/java.net/2005/08/findbugs.html" } }
                    ]
                    } */
                    {
                        renderPath: /\.html$/,
                        vpath: /^blog\/2019\//,
                        docMetadata: {
                            layout: {
                                $in: [
                                    "blog.html.ejs",
                                    "blog.html.njk",
                                    "blog.html.handlebars"
                                ]
                            },
                            blogtag: { $eeq: "news" }
                        }
                    }
                );
            // console.log(JSON.stringify(explanation, undefined, ' '));
            console.log(`EXPLAINING ${explanation.operation} results: ${explanation.results}`);
            console.log('Analysis ', explanation.analysis);
            console.log('Analysis - query ', explanation.analysis.query);
            console.log('Steps ', explanation.steps);
            console.log('Time ', explanation.time);
            console.log('Index ', explanation.index);
            console.log('Log ', explanation.log);
            await akasha.closeCaches();
        } catch (e) {
            console.error(`render command ERRORED ${e.stack}`);
        }
    });

program
    .command('watch <configFN>')
    .description('Track changes to files in a site, and rebuild anything that changes')
    .action(async (configFN, cmdObj) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetupComplete(config);
            data.init();
            // console.log('CALLING config.hookBeforeSiteRendered');
            await config.hookBeforeSiteRendered();
            const watchman = (await _watchman).watchman;
            await watchman(config);
            // await akasha.closeCaches();
        } catch (e) {
            console.error(`watch command ERRORED ${e.stack}`);
        }
    });

program
    .command('gh-pages-publish <configFN>')
    .description('Publish a site using Github Pages.  Takes the rendering destination, adds it into a branch, and pushes that to Github')
    .option('-b, --branch <branchName>', 'The branch to use for publishing to Github')
    .option('-r, --repo <repoURL>', 'The repository URL to use if it must differ from the URL of the local directory')
    .option('--remote <remoteName>', 'The Git remote name to use if it must differ from "origin"')
    .option('--tag <tag>', 'Any tag to add when pushing to Github')
    .option('--message <message>', 'Any Git commit message')
    .option('--username <username>', 'Github user name to use')
    .option('--email <email>', 'Github user email to use')
    .option('--nopush', 'Do not push to Github, only commit')
    .action(async (configFN, cmdObj) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;

            let options = {
                dotfiles: true
            };
            if (cmdObj.branch) {
                options.branch = cmdObj.branch;
            }
            if (cmdObj.repoURL) {
                options.repo = cmdObj.repoURL;
            }
            if (cmdObj.remote) {
                options.remote = cmdObj.remote;
            }
            if (cmdObj.tag) {
                options.tag = cmdObj.tag;
            }
            if (cmdObj.message) {
                options.message = cmdObj.message;
            }
            if (cmdObj.username || cmdObj.email) {
                options.user = {};
            }
            if (cmdObj.username) {
                options.user.name = cmdObj.username;
            }
            if (cmdObj.email) {
                options.user.email = cmdObj.email;
            }
            if (cmdObj.nopush) {
                options.push = false;
            }

            // console.log(`gh-pages-publish options ${config.renderDestination} cmdObj ${util.inspect(cmdObj)} options ${util.inspect(options)}`);

            ghpages.publish(config.renderDestination, options, function(err) {

                if (err) console.error(err);
                else console.log('OK');
            });
        } catch (e) {
            console.error(`gh-pages-publish command ERRORED ${e.stack}`);
        }
    });


program
    .command('config <configFN>')
    .description('Print a site configuration')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            console.log(config);
        } catch (e) {
            console.error(`config command ERRORED ${e.stack}`);
        }
    });

program
    .command('docdirs <configFN>')
    .description('List the documents directories in a site configuration')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            console.log(config.documentDirs);
        } catch (e) {
            console.error(`docdirs command ERRORED ${e.stack}`);
        }
    });

program
    .command('assetdirs <configFN>')
    .description('List the assets directories in a site configuration')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            console.log(config.assetDirs);
        } catch (e) {
            console.error(`assetdirs command ERRORED ${e.stack}`);
        }
    });

program
    .command('partialdirs <configFN>')
    .description('List the partials directories in a site configuration')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            console.log(config.partialsDirs);
        } catch (e) {
            console.error(`partialdirs command ERRORED ${e.stack}`);
        }
    });

program
    .command('layoutsdirs <configFN>')
    .description('List the layouts directories in a site configuration')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            console.log(config.layoutDirs);
        } catch (e) {
            console.error(`layoutsdirs command ERRORED ${e.stack}`);
        }
    });


program
    .command('documents <configFN>')
    .description('List the documents in a site configuration')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupDocuments(config);
            let filecache = await _filecache;
            // console.log(filecache.documents);
            await filecache.documents.isReady();
            console.log(filecache.documents.paths());
            await akasha.closeCaches();
        } catch (e) {
            console.error(`documents command ERRORED ${e.stack}`);
        }
    });

program
    .command('docinfo <configFN> <docFN>')
    .description('Show information about a document in a site configuration')
    .action(async (configFN, docFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupDocuments(config);
            let filecache = await _filecache;
            // console.log(filecache.documents);
            await filecache.documents.isReady();
            console.log(`docFN ${docFN} `, filecache.documents.find(docFN));
            await akasha.closeCaches();
        } catch (e) {
            console.error(`docinfo command ERRORED ${e.stack}`);
        }
    });

program
    .command('tags <configFN>')
    .description('List the tags')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupDocuments(config);
            let filecache = await _filecache;
            // console.log(filecache.documents);
            await filecache.documents.isReady();
            console.log(filecache.documents.tags());
            await akasha.closeCaches();
        } catch (e) {
            console.error(`docinfo command ERRORED ${e.stack}`);
        }
    });

program
    .command('search <configFN>')
    .description('Search for documents')
    .option('--root <rootPath>', 'Select only files within the named directory')
    .option('--match <pathmatch>', 'Select only files matching the regular expression')
    .option('--glob <globmatch>', 'Select only files matching the glob expression')
    .option('--renderglob <globmatch>', 'Select only files rendering to the glob expression')
    .option('--layout <layout>', 'Select only files matching the layouts')
    .option('--mime <mime>', 'Select only files matching the MIME type')
    .option('--tag <tag>', 'Select only files with the tag')
    .action(async (configFN, cmdObj) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupDocuments(config);
            let filecache = await _filecache;
            // console.log(filecache.documents);
            await filecache.documents.isReady();
            // console.log(cmdObj);
            let options = { };
            if (cmdObj.root) options.rootPath = cmdObj.root;
            if (cmdObj.match) options.pathmatch = cmdObj.match;
            if (cmdObj.glob) options.glob = cmdObj.glob;
            if (cmdObj.renderglob) options.renderglob = cmdObj.renderglob;
            if (cmdObj.layout) options.layouts = cmdObj.layout;
            if (cmdObj.mime) options.mime = cmdObj.mime;
            if (cmdObj.tag) options.tag = cmdObj.tag;
            // console.log(options);
            let docs = filecache.documents.search(config, options);
            console.log(docs);
            await akasha.closeCaches();
        } catch (e) {
            console.error(`search command ERRORED ${e.stack}`);
        }
    });

program
    .command('assets <configFN>')
    .description('List the assets in a site configuration')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupAssets(config);
            let filecache = await _filecache;
            // console.log(filecache.documents);
            await filecache.assets.isReady();
            console.log(filecache.assets.paths());
            await akasha.closeCaches();
        } catch (e) {
            console.error(`assets command ERRORED ${e.stack}`);
        }
    });

program
    .command('assetinfo <configFN> <docFN>')
    .description('Show information about an asset in a site configuration')
    .action(async (configFN, assetFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupAssets(config);
            let filecache = await _filecache;
            // console.log(filecache.documents);
            await filecache.assets.isReady();
            console.log(filecache.assets.find(assetFN));
            await akasha.closeCaches();
        } catch (e) {
            console.error(`assetinfo command ERRORED ${e.stack}`);
        }
    });

program
    .command('layouts <configFN>')
    .description('List the layouts in a site configuration')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupLayouts(config);
            let filecache = await _filecache;
            // console.log(filecache.documents);
            await filecache.layouts.isReady();
            console.log(filecache.layouts.paths());
            await akasha.closeCaches();
        } catch (e) {
            console.error(`layouts command ERRORED ${e.stack}`);
        }
    });

// TODO both test.html and test.html.njk match
//      This is probably incorrect, since we do not render these files
//      The partials directory has the same problem
//      Some kind of flag on creating the FileCache to change the behavior

program
    .command('layoutinfo <configFN> <docFN>')
    .description('Show information about a layout in a site configuration')
    .action(async (configFN, layoutFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupLayouts(config);
            let filecache = await _filecache;
            // console.log(filecache.documents);
            await filecache.layouts.isReady();
            console.log(filecache.layouts.find(layoutFN));
            await akasha.closeCaches();
        } catch (e) {
            console.error(`layoutinfo command ERRORED ${e.stack}`);
        }
    });

program
    .command('partials <configFN>')
    .description('List the partials in a site configuration')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            await akasha.cacheSetup(config);
            await akasha.setupPartials(config);
            let filecache = await _filecache;
            // console.log(filecache.documents);
            await filecache.partials.isReady();
            await akasha.setupPluginCaches(config)
            console.log(filecache.partials.paths());
            await akasha.closeCaches();
        } catch (e) {
            console.error(`partials command ERRORED ${e.stack}`);
        }
    });

// TODO both test.html and test.html.njk match
//      This is probably incorrect, since we do not render these files

program
    .command('partialinfo <configFN> <docFN>')
    .description('Show information about a partial in a site configuration')
    .action(async (configFN, partialFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = require(path.join(process.cwd(), configFN));
            let akasha = config.akasha;
            // await akasha.cacheSetupComplete(config);
            await akasha.cacheSetup(config);
            await akasha.setupPartials(config);
            let filecache = await _filecache;
            // console.log(filecache.documents);
            await filecache.partials.isReady();
            console.log(filecache.partials.find(partialFN));
            await akasha.closeCaches();
        } catch (e) {
            console.error(`partialinfo command ERRORED ${e.stack}`);
        }
    });



program.parse(process.argv);
