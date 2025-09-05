#!/usr/bin/env node

/**
 *
 * Copyright 2014-2025 David Herron
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

import { program } from 'commander';
import ghpages from 'gh-pages';
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import * as data from './data.js';
import YAML from 'js-yaml';

const _watchman = import('./cache/watchman.js');

process.title = 'akasharender';
program.version('0.7.5');

program
    .command('copy-assets <configFN>')
    .description('Copy assets into output directory')
    .action(async (configFN) => {
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            const documents = akasha.filecache.documentsCache;
            const doc = await documents.find(documentFN);
            // data: ${doc.data}
            // text: ${doc.text}
            console.log(`
docpath: ${doc.vpath}
fspath: ${doc.fspath}
renderer: ${util.inspect(config.findRendererPath(doc.vpath))}
renderpath: ${doc.renderPath}
mounted: ${doc.mounted}
mountPoint: ${doc.mountPoint}

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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            await data.removeAll();
            // console.log(`render-document before renderPath ${documentFN}`);
            let result = await akasha.renderPath(config, documentFN);
            console.log(result);
            await akasha.closeCaches();
        } catch (e) {
            console.error(`render-document command ERRORED`, e);
        }
    });

program
    .command('render <configFN>')
    .description('Render a site into output directory')
    .option('--quiet', 'Do not print the rendering report')
    .option('--copy-assets', 'First, copy the assets')
    .option('--results-to <resultFile>', 'Store the results into the named file')
    .option('--perfresults <perfResultsFile>', 'Store the time to render each document')
    .option('--caching-timeout <timeout>', 'The time, in miliseconds, to honor entries in the search cache')
    .action(async (configFN, cmdObj) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            await data.removeAll();
            if (cmdObj.copyAssets) {
                await config.copyAssets();
            }
            if (typeof cmdObj.cachingTimeout === 'string') {
                config.setCachingTimeout(
                    Number.parseInt(cmdObj.cachingTimeout)
                );
            }
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
                const reports = [];
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
                        const report: {
                            renderedPath?: string;
                            time?: string;
                            fm?: string;
                            first?: string;
                            second?: string;
                            mahabhuta?: string;
                            rendered?: string;
                        } = {
                            renderedPath: matches[1],
                            time: matches[2]
                        };
                        for (let i = 1; i < results.length; i++) {
                            let stages = results[i].match(/(FRONTMATTER|FIRST RENDER|SECOND RENDER|MAHABHUTA|RENDERED) ([0-9\.]+) seconds$/);
                            if (!stages || stages.length < 3) continue;
                            if (stages[1] === 'FRONTMATTER') {
                                report.fm = stages[2];
                            } else if (stages[1] === 'FIRST RENDER') {
                                report.first = stages[2];
                            } else if (stages[1] === 'SECOND RENDER') {
                                report.second = stages[2];
                            } else if (stages[1] === 'MAHABHUTA') {
                                report.mahabhuta = stages[2];
                            } else if (stages[1] === 'RENDERED') {
                                report.rendered = stages[2];
                            }
                        }
                        reports.push(report);
                    }
                }
                fsp.writeFile(cmdObj.perfresults,
                        JSON.stringify(reports, undefined, 4),
                        'utf-8');
            }
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            await data.removeAll();
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
    .option('--cname <domain>', 'Write out a CNAME file with the domain name')
    .action(async (configFN, cmdObj) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;

            let options: any = {
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
            if (cmdObj.cname) {
                options.cname = cmdObj.cname;
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

            options.nojekyll = true;
            options.dotfiles = true;

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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            console.log(config);
        } catch (e) {
            console.error(`config command ERRORED ${e.stack}`);
        }
    });

program
    .command('plugins <configFN>')
    .description('List the plugins')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            console.log(config.plugins);
            
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(config.documentDirs);
            await akasha.closeCaches();
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(config.assetDirs);
            await akasha.closeCaches();
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(config.partialsDirs);
            await akasha.closeCaches();
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(config.layoutDirs);
            await akasha.closeCaches();
        } catch (e) {
            console.error(`layoutsdirs command ERRORED ${e.stack}`);
        }
    });


program
    .command('documents <configFN> [rootPath]')
    .description('List the documents in a site configuration')
    .action(async (configFN, rootPath) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(await akasha.filecache.documentsCache.paths(rootPath));
            await akasha.closeCaches();
        } catch (e) {
            console.error(`documents command ERRORED ${e.stack}`);
        }
    });

program
    .command('docs-set-dates <configFN>')
    .description('Set the aTime and mTime for documents in a site configuration')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(akasha.filecache.documentsCache.setTimes());
            await akasha.closeCaches();
        } catch (e) {
            console.error(`docs-set-dates command ERRORED ${e.stack}`);
        }
    });

program
    .command('docinfo <configFN> <docFN>')
    .description('Show information about a document in a site configuration')
    .action(async (configFN, docFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            const docinfo = await akasha.filecache.documentsCache.find(docFN);
            console.log(`docFN ${docFN} `, docinfo);
            await akasha.closeCaches();
        } catch (e) {
            console.error(`docinfo command ERRORED ${e.stack}`);
        }
    });

program
    .command('index-files <configFN> [rootPath]')
    .description('List the index pages (index.html) under the given directory')
    .action(async (configFN, rootPath) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            const docinfo = await akasha.filecache.documentsCache.indexFiles(rootPath);
            console.log(`indexes ${rootPath} `, docinfo.map(index => {
                return {
                    vpath: index.vpath,
                    renderPath: index.renderPath,
                    mountPoint: index.mountPoint,
                    pathInMounted: index.pathInMounted,
                    dirname: index.dirname
                }
            }));
            await akasha.closeCaches();
        } catch (e) {
            console.error(`index-files command ERRORED ${e.stack}`);
        }
    });

program
    .command('index-chain <configFN> startPath')
    .description('List the index chain starting from the path')
    .action(async (configFN, startPath) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            const docinfo = await akasha.filecache.documentsCache.indexChain(startPath);
            console.log(`index chain ${startPath} `, docinfo);
            await akasha.closeCaches();
        } catch (e) {
            console.error(`index-chain command ERRORED ${e.stack}`);
        }
    });

program
    .command('siblings <configFN> <vpath>')
    .description('List the sibling pages to the named document')
    .action(async (configFN, vpath) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            const docinfo = await akasha.filecache.documentsCache.siblings(vpath);
            console.log(`siblings ${vpath} `, docinfo.map(index => {
                return {
                    vpath: index.vpath,
                    renderPath: index.renderPath,
                    mountPoint: index.mountPoint,
                    pathInMounted: index.pathInMounted,
                    dirname: index.dirname
                }
            }));
            await akasha.closeCaches();
        } catch (e) {
            console.error(`siblings command ERRORED ${e.stack}`);
        }
    });

program
    .command('tags <configFN>')
    .description('List the tags')
    .action(async (configFN) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(await akasha.filecache.documentsCache.tags());
            await akasha.closeCaches();
        } catch (e) {
            console.error(`docinfo command ERRORED ${e.stack}`);
        }
    });

program
    .command('docs-with-tag <configFN> <tags...>')
    .description('List the document vpaths for given tags')
    .action(async (configFN, tags) => {
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(await akasha.filecache
                .documentsCache.documentsWithTag(tags));
            await akasha.closeCaches();
        } catch (e) {
            console.error(`docs-with-tags command ERRORED ${e.stack}`);
        }
    });

program
    .command('child-item-tree <configFN> <rootPath>')
    .description('List the documents under a given location by tree')
    .action(async (configFN, rootPath) => {

        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(
                YAML.dump({
                    tree: await akasha.filecache
                        .documentsCache.childItemTree(rootPath)
                }, { indent: 4 })
                // .map(item => {
                //     return {
                //         vpath: item.vpath,
                //         renderPath: item.renderPath
                //     }
                // })
            );
            await akasha.closeCaches();
        } catch (e) {
            console.error(`docs-with-tags command ERRORED ${e.stack}`);
        }
    });

program
    .command('search <configFN>')
    .description('Search for documents')
    .option('--root <rootPath>', 'Select only files within the named directory')
    .option('--match <pathmatch>', 'Select only files matching the regular expression')
    .option('--rendermatch <renderpathmatch>', 'Select only files matching the regular expression')
    .option('--glob <globmatch>', 'Select only files matching the glob expression')
    .option('--renderglob <globmatch>', 'Select only files rendering to the glob expression')
    .option('--layout <layout>', 'Select only files matching the layouts')
    .option('--mime <mime>', 'Select only files matching the MIME type')
    .option('--tag <tag>', 'Select only files with the tag')
    .action(async (configFN, cmdObj) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            // console.log(cmdObj);
            let options: any = { };
            if (cmdObj.root) options.rootPath = cmdObj.root;
            if (cmdObj.match) options.pathmatch = cmdObj.match;
            if (cmdObj.rendermatch) options.renderpathmatch = cmdObj.rendermatch;
            if (cmdObj.glob) options.glob = cmdObj.glob;
            if (cmdObj.renderglob) options.renderglob = cmdObj.renderglob;
            if (cmdObj.layout) options.layouts = [ cmdObj.layout ];
            if (cmdObj.mime) options.mime = cmdObj.mime;
            if (cmdObj.tag) options.tag = cmdObj.tag;
            // console.log(options);
            let docs = await akasha.filecache.documentsCache.search(options);
            console.log(docs
            // .map(doc => {
            //     return {
            //         vpath: doc.vpath,
            //         renderPath: doc.renderPath,
            //         dirname: doc.dirname
            //     }
            // })
            // .sort((a: any, b: any) => {
            //     var tagA = a.dirname.toLowerCase();
            //     var tagB = b.dirname.toLowerCase();
            //     if (tagA < tagB) return -1;
            //     if (tagA > tagB) return 1;
            //     return 0;
            // })
            // .reverse()
            );
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(await akasha.filecache.assetsCache.paths());
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            const assetinfo = await akasha.filecache.assetsCache.find(assetFN);
            console.log(assetinfo);
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(await akasha.filecache.layoutsCache.paths());
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            const layoutinfo = await akasha.filecache.layoutsCache.find(layoutFN);
            console.log(layoutinfo);
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            console.log(await akasha.filecache.partialsCache.paths());
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
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            const partialinfo = await akasha.filecache.partialsCache.find(partialFN);
            console.log(partialinfo);
            await akasha.closeCaches();
        } catch (e) {
            console.error(`partialinfo command ERRORED ${e.stack}`);
        }
    });

program
    .command('index <configFN>')
    .description('Loads configuration, indexes content, then exits')
    .action(async (configFN) => {
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            await akasha.setup(config);
            await akasha.closeCaches();
        } catch (e) {
            console.error(`partialinfo command ERRORED ${e.stack}`);
        }
    });

program.parse(process.argv);
