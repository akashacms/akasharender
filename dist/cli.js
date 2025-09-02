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
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        await config.copyAssets();
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`copy-assets command ERRORED ${e.stack}`);
    }
});
program
    .command('document <configFN> <documentFN>')
    .description('Show information about a document')
    .action(async (configFN, documentFN) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
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
    }
    catch (e) {
        console.error(`document command ERRORED ${e.stack}`);
    }
});
program
    .command('render-document <configFN> <documentFN>')
    .description('Render a document into output directory')
    .action(async (configFN, documentFN) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        await data.removeAll();
        // console.log(`render-document before renderPath ${documentFN}`);
        let result = await akasha.renderPath(config, documentFN);
        console.log(result);
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`render-document command ERRORED ${e.stack}`);
    }
});
program
    .command('render <configFN>')
    .description('Render a site into output directory')
    .option('--quiet', 'Do not print the rendering report')
    .option('--copy-assets', 'First, copy the assets')
    .option('--results-to <resultFile>', 'Store the results into the named file')
    .option('--perfresults <perfResultsFile>', 'Store the time to render each document')
    .action(async (configFN, cmdObj) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        await data.removeAll();
        if (cmdObj.copyAssets) {
            await config.copyAssets();
        }
        let results = await akasha.render(config);
        if (!cmdObj.quiet) {
            for (let result of results) {
                // TODO --- if AKASHARENDER_TRACE_RENDER then output tracing data
                // TODO --- also set process.env.GLOBFS_TRACE=1
                if (result.error) {
                    console.error(result.error);
                }
                else {
                    console.log(result.result);
                    // console.log(util.inspect(result.result));
                }
            }
        }
        if (cmdObj.resultsTo) {
            const output = fs.createWriteStream(cmdObj.resultsTo);
            for (let result of results) {
                if (result.error) {
                    output.write('****ERROR ' + result.error + '\n');
                }
                else {
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
                }
                else if (result.result.startsWith('COPY')) {
                    // Ignore
                }
                else {
                    let results = result.result.split('\n');
                    let perf = results[0];
                    let matches = perf.match(/.* ==> (.*) \(([0-9\.]+) seconds\)$/);
                    if (!matches)
                        continue;
                    if (matches.length < 3)
                        continue;
                    let fn = matches[1];
                    let time = matches[2];
                    let report = `${time} ${fn}`;
                    for (let i = 1; i < results.length; i++) {
                        let stages = results[i].match(/(FRONTMATTER|FIRST RENDER|SECOND RENDER|MAHABHUTA|RENDERED) ([0-9\.]+) seconds$/);
                        if (!stages || stages.length < 3)
                            continue;
                        report += ` ${stages[1]} ${stages[2]}`;
                    }
                    output.write(`${report}\n`);
                }
            }
            output.close();
        }
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`render command ERRORED ${e.stack}`);
    }
});
program
    .command('watch <configFN>')
    .description('Track changes to files in a site, and rebuild anything that changes')
    .action(async (configFN, cmdObj) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        await data.removeAll();
        // console.log('CALLING config.hookBeforeSiteRendered');
        await config.hookBeforeSiteRendered();
        const watchman = (await _watchman).watchman;
        await watchman(config);
        // await akasha.closeCaches();
    }
    catch (e) {
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
        const config = (await import(path.join(process.cwd(), configFN))).default;
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
        ghpages.publish(config.renderDestination, options, function (err) {
            if (err)
                console.error(err);
            else
                console.log('OK');
        });
    }
    catch (e) {
        console.error(`gh-pages-publish command ERRORED ${e.stack}`);
    }
});
program
    .command('config <configFN>')
    .description('Print a site configuration')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        console.log(config);
    }
    catch (e) {
        console.error(`config command ERRORED ${e.stack}`);
    }
});
program
    .command('plugins <configFN>')
    .description('List the plugins')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        console.log(config.plugins);
    }
    catch (e) {
        console.error(`config command ERRORED ${e.stack}`);
    }
});
program
    .command('docdirs <configFN>')
    .description('List the documents directories in a site configuration')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(config.documentDirs);
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`docdirs command ERRORED ${e.stack}`);
    }
});
program
    .command('assetdirs <configFN>')
    .description('List the assets directories in a site configuration')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(config.assetDirs);
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`assetdirs command ERRORED ${e.stack}`);
    }
});
program
    .command('partialdirs <configFN>')
    .description('List the partials directories in a site configuration')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(config.partialsDirs);
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`partialdirs command ERRORED ${e.stack}`);
    }
});
program
    .command('layoutsdirs <configFN>')
    .description('List the layouts directories in a site configuration')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(config.layoutDirs);
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`layoutsdirs command ERRORED ${e.stack}`);
    }
});
program
    .command('documents <configFN> [rootPath]')
    .description('List the documents in a site configuration')
    .action(async (configFN, rootPath) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(await akasha.filecache.documentsCache.paths(rootPath));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`documents command ERRORED ${e.stack}`);
    }
});
program
    .command('docs-set-dates <configFN>')
    .description('Set the aTime and mTime for documents in a site configuration')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(akasha.filecache.documentsCache.setTimes());
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`docs-set-dates command ERRORED ${e.stack}`);
    }
});
program
    .command('docinfo <configFN> <docFN>')
    .description('Show information about a document in a site configuration')
    .action(async (configFN, docFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        const docinfo = await akasha.filecache.documentsCache.find(docFN);
        console.log(`docFN ${docFN} `, docinfo);
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`docinfo command ERRORED ${e.stack}`);
    }
});
program
    .command('index-files <configFN> [rootPath]')
    .description('List the index pages (index.html) under the given directory')
    .action(async (configFN, rootPath) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
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
            };
        }));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`index-files command ERRORED ${e.stack}`);
    }
});
program
    .command('index-chain <configFN> startPath')
    .description('List the index chain starting from the path')
    .action(async (configFN, startPath) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        const docinfo = await akasha.filecache.documentsCache.indexChain(startPath);
        console.log(`index chain ${startPath} `, docinfo.map(index => {
            return {
                vpath: index.vpath,
                renderPath: index.renderPath,
                mountPoint: index.mountPoint,
                pathInMounted: index.pathInMounted,
                dirname: index.dirname
            };
        }));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`index-chain command ERRORED ${e.stack}`);
    }
});
program
    .command('siblings <configFN> <vpath>')
    .description('List the sibling pages to the named document')
    .action(async (configFN, vpath) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
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
            };
        }));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`siblings command ERRORED ${e.stack}`);
    }
});
program
    .command('tags <configFN>')
    .description('List the tags')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(await akasha.filecache.documentsCache.tags());
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`docinfo command ERRORED ${e.stack}`);
    }
});
program
    .command('docs-with-tag <configFN> <tags...>')
    .description('List the document vpaths for given tags')
    .action(async (configFN, tags) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(await akasha.filecache
            .documentsCache.documentsWithTag(tags));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`docs-with-tags command ERRORED ${e.stack}`);
    }
});
program
    .command('child-item-tree <configFN> <rootPath>')
    .description('List the documents under a given location by tree')
    .action(async (configFN, rootPath) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(YAML.dump({
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
    }
    catch (e) {
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
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        // console.log(cmdObj);
        let options = {};
        if (cmdObj.root)
            options.rootPath = cmdObj.root;
        if (cmdObj.match)
            options.pathmatch = cmdObj.match;
        if (cmdObj.rendermatch)
            options.renderpathmatch = cmdObj.rendermatch;
        if (cmdObj.glob)
            options.glob = cmdObj.glob;
        if (cmdObj.renderglob)
            options.renderglob = cmdObj.renderglob;
        if (cmdObj.layout)
            options.layouts = [cmdObj.layout];
        if (cmdObj.mime)
            options.mime = cmdObj.mime;
        if (cmdObj.tag)
            options.tag = cmdObj.tag;
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
    }
    catch (e) {
        console.error(`search command ERRORED ${e.stack}`);
    }
});
program
    .command('assets <configFN>')
    .description('List the assets in a site configuration')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(await akasha.filecache.assetsCache.paths());
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`assets command ERRORED ${e.stack}`);
    }
});
program
    .command('assetinfo <configFN> <docFN>')
    .description('Show information about an asset in a site configuration')
    .action(async (configFN, assetFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        const assetinfo = await akasha.filecache.assetsCache.find(assetFN);
        console.log(assetinfo);
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`assetinfo command ERRORED ${e.stack}`);
    }
});
program
    .command('layouts <configFN>')
    .description('List the layouts in a site configuration')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(await akasha.filecache.layoutsCache.paths());
        await akasha.closeCaches();
    }
    catch (e) {
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
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        const layoutinfo = await akasha.filecache.layoutsCache.find(layoutFN);
        console.log(layoutinfo);
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`layoutinfo command ERRORED ${e.stack}`);
    }
});
program
    .command('partials <configFN>')
    .description('List the partials in a site configuration')
    .action(async (configFN) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(await akasha.filecache.partialsCache.paths());
        await akasha.closeCaches();
    }
    catch (e) {
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
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        const partialinfo = await akasha.filecache.partialsCache.find(partialFN);
        console.log(partialinfo);
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`partialinfo command ERRORED ${e.stack}`);
    }
});
program
    .command('index <configFN>')
    .description('Loads configuration, indexes content, then exits')
    .action(async (configFN) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`partialinfo command ERRORED ${e.stack}`);
    }
});
program.parse(process.argv);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUgsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLE9BQU8sTUFBTSxVQUFVLENBQUM7QUFDL0IsT0FBTyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBRXpCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxJQUFJLE1BQU0sU0FBUyxDQUFDO0FBRTNCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBRWhELE9BQU8sQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDO0FBQy9CLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFekIsT0FBTztLQUNGLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQztLQUNqQyxXQUFXLENBQUMsbUNBQW1DLENBQUM7S0FDaEQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUN2QixJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FDckMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNYLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDM0IsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzFCLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDNUQsQ0FBQztBQUVMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQztLQUMzQyxXQUFXLENBQUMsbUNBQW1DLENBQUM7S0FDaEQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUU7SUFFbkMsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztRQUNsRCxNQUFNLEdBQUcsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0Msb0JBQW9CO1FBQ3BCLG9CQUFvQjtRQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDO1dBQ2IsR0FBRyxDQUFDLEtBQUs7VUFDVixHQUFHLENBQUMsTUFBTTtZQUNSLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztjQUM5QyxHQUFHLENBQUMsVUFBVTtXQUNqQixHQUFHLENBQUMsT0FBTztjQUNSLEdBQUcsQ0FBQyxVQUFVOztZQUVoQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7O0NBRXJDLENBQUMsQ0FBQztRQUNTLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDekQsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyx5Q0FBeUMsQ0FBQztLQUNsRCxXQUFXLENBQUMseUNBQXlDLENBQUM7S0FDdEQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUU7SUFDbkMsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixNQUFNLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN2QixrRUFBa0U7UUFDbEUsSUFBSSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN6RCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDaEUsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztLQUM1QixXQUFXLENBQUMscUNBQXFDLENBQUM7S0FDbEQsTUFBTSxDQUFDLFNBQVMsRUFBRSxtQ0FBbUMsQ0FBQztLQUN0RCxNQUFNLENBQUMsZUFBZSxFQUFFLHdCQUF3QixDQUFDO0tBQ2pELE1BQU0sQ0FBQywyQkFBMkIsRUFBRSx1Q0FBdUMsQ0FBQztLQUM1RSxNQUFNLENBQUMsaUNBQWlDLEVBQUUsd0NBQXdDLENBQUM7S0FDbkYsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUU7SUFDL0IsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsTUFBTSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDdkIsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDcEIsTUFBTSxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDOUIsQ0FBQztRQUNELElBQUksT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2hCLEtBQUssSUFBSSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBRXpCLGlFQUFpRTtnQkFDakUsK0NBQStDO2dCQUUvQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDZixPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztxQkFBTSxDQUFDO29CQUNKLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUMzQiw0Q0FBNEM7Z0JBQ2hELENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztRQUNELElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ25CLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEQsS0FBSyxJQUFJLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2YsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDcEQsQ0FBQztxQkFBTSxDQUFDO29CQUNKLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQztvQkFDbkMsNENBQTRDO2dCQUNoRCxDQUFDO1lBQ0wsQ0FBQztZQUNELE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNuQixDQUFDO1FBQ0QsSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckIsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN4RCxLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUN6QixJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDZixTQUFTO2dCQUNiLENBQUM7cUJBQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUMxQyxTQUFTO2dCQUNiLENBQUM7cUJBQU0sQ0FBQztvQkFDSixJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDeEMsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN0QixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7b0JBQ2hFLElBQUksQ0FBQyxPQUFPO3dCQUFFLFNBQVM7b0JBQ3ZCLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDO3dCQUFFLFNBQVM7b0JBQ2pDLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDcEIsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN0QixJQUFJLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxFQUFFLEVBQUUsQ0FBQztvQkFDN0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDdEMsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxpRkFBaUYsQ0FBQyxDQUFDO3dCQUNqSCxJQUFJLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQzs0QkFBRSxTQUFTO3dCQUMzQyxNQUFNLElBQUksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzNDLENBQUM7b0JBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUM7Z0JBQ2hDLENBQUM7WUFDTCxDQUFDO1lBQ0QsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFDRCxNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLE9BQU87S0FDRixPQUFPLENBQUMsa0JBQWtCLENBQUM7S0FDM0IsV0FBVyxDQUFDLHFFQUFxRSxDQUFDO0tBQ2xGLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFO0lBQy9CLDBEQUEwRDtJQUMxRCxJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FDckMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNYLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDM0IsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3ZCLHdEQUF3RDtRQUN4RCxNQUFNLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQ3RDLE1BQU0sUUFBUSxHQUFHLENBQUMsTUFBTSxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDNUMsTUFBTSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkIsOEJBQThCO0lBQ2xDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDdEQsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQztLQUN0QyxXQUFXLENBQUMsdUhBQXVILENBQUM7S0FDcEksTUFBTSxDQUFDLDJCQUEyQixFQUFFLDRDQUE0QyxDQUFDO0tBQ2pGLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxpRkFBaUYsQ0FBQztLQUNqSCxNQUFNLENBQUMsdUJBQXVCLEVBQUUsNERBQTRELENBQUM7S0FDN0YsTUFBTSxDQUFDLGFBQWEsRUFBRSx1Q0FBdUMsQ0FBQztLQUM5RCxNQUFNLENBQUMscUJBQXFCLEVBQUUsd0JBQXdCLENBQUM7S0FDdkQsTUFBTSxDQUFDLHVCQUF1QixFQUFFLHlCQUF5QixDQUFDO0tBQzFELE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSwwQkFBMEIsQ0FBQztLQUNyRCxNQUFNLENBQUMsVUFBVSxFQUFFLG9DQUFvQyxDQUFDO0tBQ3hELE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSw2Q0FBNkMsQ0FBQztLQUN6RSxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRTtJQUMvQiwwREFBMEQ7SUFDMUQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBRTNCLElBQUksT0FBTyxHQUFRO1lBQ2YsUUFBUSxFQUFFLElBQUk7U0FDakIsQ0FBQztRQUNGLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNuQyxDQUFDO1FBQ0QsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsT0FBTyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQ2xDLENBQUM7UUFDRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoQixPQUFPLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDbkMsQ0FBQztRQUNELElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2pDLENBQUM7UUFDRCxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUM3QixDQUFDO1FBQ0QsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsT0FBTyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQ3JDLENBQUM7UUFDRCxJQUFJLE1BQU0sQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2xDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFDRCxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ3hDLENBQUM7UUFDRCxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDdEMsQ0FBQztRQUNELElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUN4QixPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUV4Qix1SUFBdUk7UUFFdkksT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLFVBQVMsR0FBRztZQUUzRCxJQUFJLEdBQUc7Z0JBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs7Z0JBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUdQLE9BQU87S0FDRixPQUFPLENBQUMsbUJBQW1CLENBQUM7S0FDNUIsV0FBVyxDQUFDLDRCQUE0QixDQUFDO0tBQ3pDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7SUFDdkIsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDdkQsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztLQUM3QixXQUFXLENBQUMsa0JBQWtCLENBQUM7S0FDL0IsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUN2QiwwREFBMEQ7SUFDMUQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWhDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDdkQsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztLQUM3QixXQUFXLENBQUMsd0RBQXdELENBQUM7S0FDckUsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUN2QiwwREFBMEQ7SUFDMUQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNqQyxNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3hELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLE9BQU87S0FDRixPQUFPLENBQUMsc0JBQXNCLENBQUM7S0FDL0IsV0FBVyxDQUFDLHFEQUFxRCxDQUFDO0tBQ2xFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7SUFDdkIsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUIsTUFBTSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUMxRCxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFUCxPQUFPO0tBQ0YsT0FBTyxDQUFDLHdCQUF3QixDQUFDO0tBQ2pDLFdBQVcsQ0FBQyx1REFBdUQsQ0FBQztLQUNwRSxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO0lBQ3ZCLDBEQUEwRDtJQUMxRCxJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FDckMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNYLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDM0IsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDNUQsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQztLQUNqQyxXQUFXLENBQUMsc0RBQXNELENBQUM7S0FDbkUsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUN2QiwwREFBMEQ7SUFDMUQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvQixNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUdQLE9BQU87S0FDRixPQUFPLENBQUMsaUNBQWlDLENBQUM7S0FDMUMsV0FBVyxDQUFDLDRDQUE0QyxDQUFDO0tBQ3pELE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFO0lBQ2pDLDBEQUEwRDtJQUMxRCxJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FDckMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNYLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDM0IsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNuRSxNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzFELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLE9BQU87S0FDRixPQUFPLENBQUMsMkJBQTJCLENBQUM7S0FDcEMsV0FBVyxDQUFDLCtEQUErRCxDQUFDO0tBQzVFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7SUFDdkIsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDL0QsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQztLQUNyQyxXQUFXLENBQUMsMkRBQTJELENBQUM7S0FDeEUsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDOUIsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEtBQUssR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDeEQsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyxtQ0FBbUMsQ0FBQztLQUM1QyxXQUFXLENBQUMsNkRBQTZELENBQUM7S0FDMUUsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEVBQUU7SUFDakMsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLFFBQVEsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDcEQsT0FBTztnQkFDSCxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUs7Z0JBQ2xCLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDNUIsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO2dCQUM1QixhQUFhLEVBQUUsS0FBSyxDQUFDLGFBQWE7Z0JBQ2xDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTzthQUN6QixDQUFBO1FBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDNUQsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQztLQUMzQyxXQUFXLENBQUMsNkNBQTZDLENBQUM7S0FDMUQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEVBQUU7SUFDbEMsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDNUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLFNBQVMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDekQsT0FBTztnQkFDSCxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUs7Z0JBQ2xCLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDNUIsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO2dCQUM1QixhQUFhLEVBQUUsS0FBSyxDQUFDLGFBQWE7Z0JBQ2xDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTzthQUN6QixDQUFBO1FBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDNUQsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQztLQUN0QyxXQUFXLENBQUMsOENBQThDLENBQUM7S0FDM0QsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDOUIsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEtBQUssR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDbEQsT0FBTztnQkFDSCxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUs7Z0JBQ2xCLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDNUIsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO2dCQUM1QixhQUFhLEVBQUUsS0FBSyxDQUFDLGFBQWE7Z0JBQ2xDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTzthQUN6QixDQUFBO1FBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDekQsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztLQUMxQixXQUFXLENBQUMsZUFBZSxDQUFDO0tBQzVCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7SUFDdkIsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDMUQsTUFBTSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUN4RCxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFUCxPQUFPO0tBQ0YsT0FBTyxDQUFDLG9DQUFvQyxDQUFDO0tBQzdDLFdBQVcsQ0FBQyx5Q0FBeUMsQ0FBQztLQUN0RCxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUM3QixJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FDckMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNYLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDM0IsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxNQUFNLENBQUMsU0FBUzthQUM3QixjQUFjLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM1QyxNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLE9BQU87S0FDRixPQUFPLENBQUMsdUNBQXVDLENBQUM7S0FDaEQsV0FBVyxDQUFDLG1EQUFtRCxDQUFDO0tBQ2hFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFO0lBRWpDLElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FDUCxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ04sSUFBSSxFQUFFLE1BQU0sTUFBTSxDQUFDLFNBQVM7aUJBQ3ZCLGNBQWMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDO1NBQzlDLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDakIsaUJBQWlCO1FBQ2pCLGVBQWU7UUFDZiw2QkFBNkI7UUFDN0Isc0NBQXNDO1FBQ3RDLFFBQVE7UUFDUixLQUFLO1NBQ1IsQ0FBQztRQUNGLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDL0QsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztLQUM1QixXQUFXLENBQUMsc0JBQXNCLENBQUM7S0FDbkMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLDhDQUE4QyxDQUFDO0tBQzNFLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxtREFBbUQsQ0FBQztLQUNsRixNQUFNLENBQUMsaUNBQWlDLEVBQUUsbURBQW1ELENBQUM7S0FDOUYsTUFBTSxDQUFDLG9CQUFvQixFQUFFLGdEQUFnRCxDQUFDO0tBQzlFLE1BQU0sQ0FBQywwQkFBMEIsRUFBRSxvREFBb0QsQ0FBQztLQUN4RixNQUFNLENBQUMsbUJBQW1CLEVBQUUsd0NBQXdDLENBQUM7S0FDckUsTUFBTSxDQUFDLGVBQWUsRUFBRSwwQ0FBMEMsQ0FBQztLQUNuRSxNQUFNLENBQUMsYUFBYSxFQUFFLGdDQUFnQyxDQUFDO0tBQ3ZELE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFO0lBQy9CLDBEQUEwRDtJQUMxRCxJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FDckMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNYLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDM0IsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLHVCQUF1QjtRQUN2QixJQUFJLE9BQU8sR0FBUSxFQUFHLENBQUM7UUFDdkIsSUFBSSxNQUFNLENBQUMsSUFBSTtZQUFFLE9BQU8sQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoRCxJQUFJLE1BQU0sQ0FBQyxLQUFLO1lBQUUsT0FBTyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ25ELElBQUksTUFBTSxDQUFDLFdBQVc7WUFBRSxPQUFPLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDckUsSUFBSSxNQUFNLENBQUMsSUFBSTtZQUFFLE9BQU8sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUM1QyxJQUFJLE1BQU0sQ0FBQyxVQUFVO1lBQUUsT0FBTyxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQzlELElBQUksTUFBTSxDQUFDLE1BQU07WUFBRSxPQUFPLENBQUMsT0FBTyxHQUFHLENBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBQ3ZELElBQUksTUFBTSxDQUFDLElBQUk7WUFBRSxPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDNUMsSUFBSSxNQUFNLENBQUMsR0FBRztZQUFFLE9BQU8sQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUN6Qyx3QkFBd0I7UUFDeEIsSUFBSSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDakUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJO1FBQ2hCLGdCQUFnQjtRQUNoQixlQUFlO1FBQ2YsNEJBQTRCO1FBQzVCLHNDQUFzQztRQUN0QywrQkFBK0I7UUFDL0IsUUFBUTtRQUNSLEtBQUs7UUFDTCw4QkFBOEI7UUFDOUIsMENBQTBDO1FBQzFDLDBDQUEwQztRQUMxQyxrQ0FBa0M7UUFDbEMsaUNBQWlDO1FBQ2pDLGdCQUFnQjtRQUNoQixLQUFLO1FBQ0wsYUFBYTtTQUNaLENBQUM7UUFDRixNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLE9BQU87S0FDRixPQUFPLENBQUMsbUJBQW1CLENBQUM7S0FDNUIsV0FBVyxDQUFDLHlDQUF5QyxDQUFDO0tBQ3RELE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7SUFDdkIsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDeEQsTUFBTSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUN2RCxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFUCxPQUFPO0tBQ0YsT0FBTyxDQUFDLDhCQUE4QixDQUFDO0tBQ3ZDLFdBQVcsQ0FBQyx5REFBeUQsQ0FBQztLQUN0RSxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNoQywwREFBMEQ7SUFDMUQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixNQUFNLFNBQVMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZCLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDMUQsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztLQUM3QixXQUFXLENBQUMsMENBQTBDLENBQUM7S0FDdkQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUN2QiwwREFBMEQ7SUFDMUQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUN6RCxNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3hELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLDhDQUE4QztBQUM5QyxzRUFBc0U7QUFDdEUsbURBQW1EO0FBQ25ELDBFQUEwRTtBQUUxRSxPQUFPO0tBQ0YsT0FBTyxDQUFDLCtCQUErQixDQUFDO0tBQ3hDLFdBQVcsQ0FBQyx5REFBeUQsQ0FBQztLQUN0RSxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUNqQywwREFBMEQ7SUFDMUQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixNQUFNLFVBQVUsR0FBRyxNQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3hCLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDM0QsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTztLQUNGLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztLQUM5QixXQUFXLENBQUMsMkNBQTJDLENBQUM7S0FDeEQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUN2QiwwREFBMEQ7SUFDMUQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMxRCxNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLDhDQUE4QztBQUM5QyxzRUFBc0U7QUFFdEUsT0FBTztLQUNGLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztLQUN6QyxXQUFXLENBQUMsMERBQTBELENBQUM7S0FDdkUsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEVBQUU7SUFDbEMsMERBQTBEO0lBQzFELElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsTUFBTSxXQUFXLEdBQUcsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN6QixNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLE9BQU87S0FDRixPQUFPLENBQUMsa0JBQWtCLENBQUM7S0FDM0IsV0FBVyxDQUFDLGtEQUFrRCxDQUFDO0tBQy9ELE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7SUFDdkIsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBwcm9ncmFtIH0gZnJvbSAnY29tbWFuZGVyJztcbmltcG9ydCBnaHBhZ2VzIGZyb20gJ2doLXBhZ2VzJztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgKiBhcyBkYXRhIGZyb20gJy4vZGF0YS5qcyc7XG5pbXBvcnQgWUFNTCBmcm9tICdqcy15YW1sJztcblxuY29uc3QgX3dhdGNobWFuID0gaW1wb3J0KCcuL2NhY2hlL3dhdGNobWFuLmpzJyk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYWthc2hhcmVuZGVyJztcbnByb2dyYW0udmVyc2lvbignMC43LjUnKTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdjb3B5LWFzc2V0cyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0NvcHkgYXNzZXRzIGludG8gb3V0cHV0IGRpcmVjdG9yeScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBhd2FpdCBjb25maWcuY29weUFzc2V0cygpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNvcHktYXNzZXRzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3VtZW50IDxjb25maWdGTj4gPGRvY3VtZW50Rk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBkb2N1bWVudCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGRvY3VtZW50Rk4pID0+IHtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgICAgICBjb25zdCBkb2MgPSBhd2FpdCBkb2N1bWVudHMuZmluZChkb2N1bWVudEZOKTtcbiAgICAgICAgICAgIC8vIGRhdGE6ICR7ZG9jLmRhdGF9XG4gICAgICAgICAgICAvLyB0ZXh0OiAke2RvYy50ZXh0fVxuICAgICAgICAgICAgY29uc29sZS5sb2coYFxuZG9jcGF0aDogJHtkb2MudnBhdGh9XG5mc3BhdGg6ICR7ZG9jLmZzcGF0aH1cbnJlbmRlcmVyOiAke3V0aWwuaW5zcGVjdChjb25maWcuZmluZFJlbmRlcmVyUGF0aChkb2MudnBhdGgpKX1cbnJlbmRlcnBhdGg6ICR7ZG9jLnJlbmRlclBhdGh9XG5tb3VudGVkOiAke2RvYy5tb3VudGVkfVxubW91bnRQb2ludDogJHtkb2MubW91bnRQb2ludH1cblxubWV0YWRhdGE6ICR7dXRpbC5pbnNwZWN0KGRvYy5tZXRhZGF0YSl9XG5cbmApO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3VtZW50IGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdyZW5kZXItZG9jdW1lbnQgPGNvbmZpZ0ZOPiA8ZG9jdW1lbnRGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUmVuZGVyIGEgZG9jdW1lbnQgaW50byBvdXRwdXQgZGlyZWN0b3J5JylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgZG9jdW1lbnRGTikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGF3YWl0IGRhdGEucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyLWRvY3VtZW50IGJlZm9yZSByZW5kZXJQYXRoICR7ZG9jdW1lbnRGTn1gKTtcbiAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBha2FzaGEucmVuZGVyUGF0aChjb25maWcsIGRvY3VtZW50Rk4pO1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByZW5kZXItZG9jdW1lbnQgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3JlbmRlciA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1JlbmRlciBhIHNpdGUgaW50byBvdXRwdXQgZGlyZWN0b3J5JylcbiAgICAub3B0aW9uKCctLXF1aWV0JywgJ0RvIG5vdCBwcmludCB0aGUgcmVuZGVyaW5nIHJlcG9ydCcpXG4gICAgLm9wdGlvbignLS1jb3B5LWFzc2V0cycsICdGaXJzdCwgY29weSB0aGUgYXNzZXRzJylcbiAgICAub3B0aW9uKCctLXJlc3VsdHMtdG8gPHJlc3VsdEZpbGU+JywgJ1N0b3JlIHRoZSByZXN1bHRzIGludG8gdGhlIG5hbWVkIGZpbGUnKVxuICAgIC5vcHRpb24oJy0tcGVyZnJlc3VsdHMgPHBlcmZSZXN1bHRzRmlsZT4nLCAnU3RvcmUgdGhlIHRpbWUgdG8gcmVuZGVyIGVhY2ggZG9jdW1lbnQnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGF3YWl0IGRhdGEucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmNvcHlBc3NldHMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb25maWcuY29weUFzc2V0cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHJlc3VsdHMgPSBhd2FpdCBha2FzaGEucmVuZGVyKGNvbmZpZyk7XG4gICAgICAgICAgICBpZiAoIWNtZE9iai5xdWlldCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyAtLS0gaWYgQUtBU0hBUkVOREVSX1RSQUNFX1JFTkRFUiB0aGVuIG91dHB1dCB0cmFjaW5nIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyAtLS0gYWxzbyBzZXQgcHJvY2Vzcy5lbnYuR0xPQkZTX1RSQUNFPTFcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHJlc3VsdC5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQucmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHV0aWwuaW5zcGVjdChyZXN1bHQucmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlc3VsdHNUbykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dHB1dCA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGNtZE9iai5yZXN1bHRzVG8pO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC53cml0ZSgnKioqKkVSUk9SICcrIHJlc3VsdC5lcnJvciArICdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC53cml0ZShyZXN1bHQucmVzdWx0ICsgJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2codXRpbC5pbnNwZWN0KHJlc3VsdC5yZXN1bHQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvdXRwdXQuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoucGVyZnJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvdXRwdXQgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShjbWRPYmoucGVyZnJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElnbm9yZVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5yZXN1bHQuc3RhcnRzV2l0aCgnQ09QWScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHRzID0gcmVzdWx0LnJlc3VsdC5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGVyZiA9IHJlc3VsdHNbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWF0Y2hlcyA9IHBlcmYubWF0Y2goLy4qID09PiAoLiopIFxcKChbMC05XFwuXSspIHNlY29uZHNcXCkkLyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoZXMpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMubGVuZ3RoIDwgMykgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZm4gPSBtYXRjaGVzWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRpbWUgPSBtYXRjaGVzWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcG9ydCA9IGAke3RpbWV9ICR7Zm59YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdGFnZXMgPSByZXN1bHRzW2ldLm1hdGNoKC8oRlJPTlRNQVRURVJ8RklSU1QgUkVOREVSfFNFQ09ORCBSRU5ERVJ8TUFIQUJIVVRBfFJFTkRFUkVEKSAoWzAtOVxcLl0rKSBzZWNvbmRzJC8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3RhZ2VzIHx8IHN0YWdlcy5sZW5ndGggPCAzKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBvcnQgKz0gYCAke3N0YWdlc1sxXX0gJHtzdGFnZXNbMl19YDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC53cml0ZShgJHtyZXBvcnR9XFxuYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcmVuZGVyIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCd3YXRjaCA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1RyYWNrIGNoYW5nZXMgdG8gZmlsZXMgaW4gYSBzaXRlLCBhbmQgcmVidWlsZCBhbnl0aGluZyB0aGF0IGNoYW5nZXMnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGF3YWl0IGRhdGEucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnQ0FMTElORyBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCcpO1xuICAgICAgICAgICAgYXdhaXQgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKTtcbiAgICAgICAgICAgIGNvbnN0IHdhdGNobWFuID0gKGF3YWl0IF93YXRjaG1hbikud2F0Y2htYW47XG4gICAgICAgICAgICBhd2FpdCB3YXRjaG1hbihjb25maWcpO1xuICAgICAgICAgICAgLy8gYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHdhdGNoIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdnaC1wYWdlcy1wdWJsaXNoIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUHVibGlzaCBhIHNpdGUgdXNpbmcgR2l0aHViIFBhZ2VzLiAgVGFrZXMgdGhlIHJlbmRlcmluZyBkZXN0aW5hdGlvbiwgYWRkcyBpdCBpbnRvIGEgYnJhbmNoLCBhbmQgcHVzaGVzIHRoYXQgdG8gR2l0aHViJylcbiAgICAub3B0aW9uKCctYiwgLS1icmFuY2ggPGJyYW5jaE5hbWU+JywgJ1RoZSBicmFuY2ggdG8gdXNlIGZvciBwdWJsaXNoaW5nIHRvIEdpdGh1YicpXG4gICAgLm9wdGlvbignLXIsIC0tcmVwbyA8cmVwb1VSTD4nLCAnVGhlIHJlcG9zaXRvcnkgVVJMIHRvIHVzZSBpZiBpdCBtdXN0IGRpZmZlciBmcm9tIHRoZSBVUkwgb2YgdGhlIGxvY2FsIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1yZW1vdGUgPHJlbW90ZU5hbWU+JywgJ1RoZSBHaXQgcmVtb3RlIG5hbWUgdG8gdXNlIGlmIGl0IG11c3QgZGlmZmVyIGZyb20gXCJvcmlnaW5cIicpXG4gICAgLm9wdGlvbignLS10YWcgPHRhZz4nLCAnQW55IHRhZyB0byBhZGQgd2hlbiBwdXNoaW5nIHRvIEdpdGh1YicpXG4gICAgLm9wdGlvbignLS1tZXNzYWdlIDxtZXNzYWdlPicsICdBbnkgR2l0IGNvbW1pdCBtZXNzYWdlJylcbiAgICAub3B0aW9uKCctLXVzZXJuYW1lIDx1c2VybmFtZT4nLCAnR2l0aHViIHVzZXIgbmFtZSB0byB1c2UnKVxuICAgIC5vcHRpb24oJy0tZW1haWwgPGVtYWlsPicsICdHaXRodWIgdXNlciBlbWFpbCB0byB1c2UnKVxuICAgIC5vcHRpb24oJy0tbm9wdXNoJywgJ0RvIG5vdCBwdXNoIHRvIEdpdGh1Yiwgb25seSBjb21taXQnKVxuICAgIC5vcHRpb24oJy0tY25hbWUgPGRvbWFpbj4nLCAnV3JpdGUgb3V0IGEgQ05BTUUgZmlsZSB3aXRoIHRoZSBkb21haW4gbmFtZScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcblxuICAgICAgICAgICAgbGV0IG9wdGlvbnM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICBkb3RmaWxlczogdHJ1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChjbWRPYmouYnJhbmNoKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5icmFuY2ggPSBjbWRPYmouYnJhbmNoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5yZXBvVVJMKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5yZXBvID0gY21kT2JqLnJlcG9VUkw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlbW90ZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVtb3RlID0gY21kT2JqLnJlbW90ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmouY25hbWUpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNuYW1lID0gY21kT2JqLmNuYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai50YWcpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRhZyA9IGNtZE9iai50YWc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLm1lc3NhZ2UgPSBjbWRPYmoubWVzc2FnZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoudXNlcm5hbWUgfHwgY21kT2JqLmVtYWlsKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51c2VyID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51c2VyLm5hbWUgPSBjbWRPYmoudXNlcm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLmVtYWlsKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51c2VyLmVtYWlsID0gY21kT2JqLmVtYWlsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5ub3B1c2gpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnB1c2ggPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0aW9ucy5ub2pla3lsbCA9IHRydWU7XG4gICAgICAgICAgICBvcHRpb25zLmRvdGZpbGVzID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGdoLXBhZ2VzLXB1Ymxpc2ggb3B0aW9ucyAke2NvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbn0gY21kT2JqICR7dXRpbC5pbnNwZWN0KGNtZE9iail9IG9wdGlvbnMgJHt1dGlsLmluc3BlY3Qob3B0aW9ucyl9YCk7XG5cbiAgICAgICAgICAgIGdocGFnZXMucHVibGlzaChjb25maWcucmVuZGVyRGVzdGluYXRpb24sIG9wdGlvbnMsIGZ1bmN0aW9uKGVycikge1xuXG4gICAgICAgICAgICAgICAgaWYgKGVycikgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIGVsc2UgY29uc29sZS5sb2coJ09LJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZ2gtcGFnZXMtcHVibGlzaCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdjb25maWcgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdQcmludCBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb25maWcgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BsdWdpbnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBwbHVnaW5zJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5wbHVnaW5zKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb25maWcgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY2RpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcuZG9jdW1lbnREaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdhc3NldGRpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBhc3NldHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcuYXNzZXREaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldGRpcnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BhcnRpYWxkaXJzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgcGFydGlhbHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcucGFydGlhbHNEaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsZGlycyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnbGF5b3V0c2RpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBsYXlvdXRzIGRpcmVjdG9yaWVzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLmxheW91dERpcnMpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGxheW91dHNkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3VtZW50cyA8Y29uZmlnRk4+IFtyb290UGF0aF0nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnRzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcm9vdFBhdGgpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUucGF0aHMocm9vdFBhdGgpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudHMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3Mtc2V0LWRhdGVzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2V0IHRoZSBhVGltZSBhbmQgbVRpbWUgZm9yIGRvY3VtZW50cyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2V0VGltZXMoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy1zZXQtZGF0ZXMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY2luZm8gPGNvbmZpZ0ZOPiA8ZG9jRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBkb2N1bWVudCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGRvY0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5maW5kKGRvY0ZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBkb2NGTiAke2RvY0ZOfSBgLCBkb2NpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdpbmRleC1maWxlcyA8Y29uZmlnRk4+IFtyb290UGF0aF0nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgaW5kZXggcGFnZXMgKGluZGV4Lmh0bWwpIHVuZGVyIHRoZSBnaXZlbiBkaXJlY3RvcnknKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCByb290UGF0aCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgZG9jaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuaW5kZXhGaWxlcyhyb290UGF0aCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgaW5kZXhlcyAke3Jvb3RQYXRofSBgLCBkb2NpbmZvLm1hcChpbmRleCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGluZGV4LnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBpbmRleC5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBpbmRleC5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmRleC5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBkaXJuYW1lOiBpbmRleC5kaXJuYW1lXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluZGV4LWZpbGVzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdpbmRleC1jaGFpbiA8Y29uZmlnRk4+IHN0YXJ0UGF0aCcpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBpbmRleCBjaGFpbiBzdGFydGluZyBmcm9tIHRoZSBwYXRoJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgc3RhcnRQYXRoKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5pbmRleENoYWluKHN0YXJ0UGF0aCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgaW5kZXggY2hhaW4gJHtzdGFydFBhdGh9IGAsIGRvY2luZm8ubWFwKGluZGV4ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogaW5kZXgudnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZGV4LnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZGV4Lm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZGV4LnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIGRpcm5hbWU6IGluZGV4LmRpcm5hbWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW5kZXgtY2hhaW4gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3NpYmxpbmdzIDxjb25maWdGTj4gPHZwYXRoPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBzaWJsaW5nIHBhZ2VzIHRvIHRoZSBuYW1lZCBkb2N1bWVudCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHZwYXRoKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5zaWJsaW5ncyh2cGF0aCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgc2libGluZ3MgJHt2cGF0aH0gYCwgZG9jaW5mby5tYXAoaW5kZXggPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBpbmRleC52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5kZXgucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogaW5kZXgubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5kZXgucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgZGlybmFtZTogaW5kZXguZGlybmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBzaWJsaW5ncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgndGFncyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHRhZ3MnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnRhZ3MoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jaW5mbyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZG9jcy13aXRoLXRhZyA8Y29uZmlnRk4+IDx0YWdzLi4uPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudCB2cGF0aHMgZm9yIGdpdmVuIHRhZ3MnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCB0YWdzKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZVxuICAgICAgICAgICAgICAgIC5kb2N1bWVudHNDYWNoZS5kb2N1bWVudHNXaXRoVGFnKHRhZ3MpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY2hpbGQtaXRlbS10cmVlIDxjb25maWdGTj4gPHJvb3RQYXRoPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudHMgdW5kZXIgYSBnaXZlbiBsb2NhdGlvbiBieSB0cmVlJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcm9vdFBhdGgpID0+IHtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgIFlBTUwuZHVtcCh7XG4gICAgICAgICAgICAgICAgICAgIHRyZWU6IGF3YWl0IGFrYXNoYS5maWxlY2FjaGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC5kb2N1bWVudHNDYWNoZS5jaGlsZEl0ZW1UcmVlKHJvb3RQYXRoKVxuICAgICAgICAgICAgICAgIH0sIHsgaW5kZW50OiA0IH0pXG4gICAgICAgICAgICAgICAgLy8gLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoXG4gICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnc2VhcmNoIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2VhcmNoIGZvciBkb2N1bWVudHMnKVxuICAgIC5vcHRpb24oJy0tcm9vdCA8cm9vdFBhdGg+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIHdpdGhpbiB0aGUgbmFtZWQgZGlyZWN0b3J5JylcbiAgICAub3B0aW9uKCctLW1hdGNoIDxwYXRobWF0Y2g+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSByZWd1bGFyIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tcmVuZGVybWF0Y2ggPHJlbmRlcnBhdGhtYXRjaD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbicpXG4gICAgLm9wdGlvbignLS1nbG9iIDxnbG9ibWF0Y2g+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSBnbG9iIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tcmVuZGVyZ2xvYiA8Z2xvYm1hdGNoPicsICdTZWxlY3Qgb25seSBmaWxlcyByZW5kZXJpbmcgdG8gdGhlIGdsb2IgZXhwcmVzc2lvbicpXG4gICAgLm9wdGlvbignLS1sYXlvdXQgPGxheW91dD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIGxheW91dHMnKVxuICAgIC5vcHRpb24oJy0tbWltZSA8bWltZT4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIE1JTUUgdHlwZScpXG4gICAgLm9wdGlvbignLS10YWcgPHRhZz4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgd2l0aCB0aGUgdGFnJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhjbWRPYmopO1xuICAgICAgICAgICAgbGV0IG9wdGlvbnM6IGFueSA9IHsgfTtcbiAgICAgICAgICAgIGlmIChjbWRPYmoucm9vdCkgb3B0aW9ucy5yb290UGF0aCA9IGNtZE9iai5yb290O1xuICAgICAgICAgICAgaWYgKGNtZE9iai5tYXRjaCkgb3B0aW9ucy5wYXRobWF0Y2ggPSBjbWRPYmoubWF0Y2g7XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlbmRlcm1hdGNoKSBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCA9IGNtZE9iai5yZW5kZXJtYXRjaDtcbiAgICAgICAgICAgIGlmIChjbWRPYmouZ2xvYikgb3B0aW9ucy5nbG9iID0gY21kT2JqLmdsb2I7XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlbmRlcmdsb2IpIG9wdGlvbnMucmVuZGVyZ2xvYiA9IGNtZE9iai5yZW5kZXJnbG9iO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5sYXlvdXQpIG9wdGlvbnMubGF5b3V0cyA9IFsgY21kT2JqLmxheW91dCBdO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5taW1lKSBvcHRpb25zLm1pbWUgPSBjbWRPYmoubWltZTtcbiAgICAgICAgICAgIGlmIChjbWRPYmoudGFnKSBvcHRpb25zLnRhZyA9IGNtZE9iai50YWc7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhvcHRpb25zKTtcbiAgICAgICAgICAgIGxldCBkb2NzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5zZWFyY2gob3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkb2NzXG4gICAgICAgICAgICAvLyAubWFwKGRvYyA9PiB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgdnBhdGg6IGRvYy52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogZG9jLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIGRpcm5hbWU6IGRvYy5kaXJuYW1lXG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgIC8vIC5zb3J0KChhOiBhbnksIGI6IGFueSkgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHZhciB0YWdBID0gYS5kaXJuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAvLyAgICAgdmFyIHRhZ0IgPSBiLmRpcm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIC8vICAgICBpZiAodGFnQSA8IHRhZ0IpIHJldHVybiAtMTtcbiAgICAgICAgICAgIC8vICAgICBpZiAodGFnQSA+IHRhZ0IpIHJldHVybiAxO1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiAwO1xuICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgIC8vIC5yZXZlcnNlKClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc2VhcmNoIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdhc3NldHMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBhc3NldHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlLnBhdGhzKCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnYXNzZXRpbmZvIDxjb25maWdGTj4gPGRvY0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGFuIGFzc2V0IGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgYXNzZXRGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgYXNzZXRpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5hc3NldHNDYWNoZS5maW5kKGFzc2V0Rk4pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXNzZXRpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldGluZm8gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2xheW91dHMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBsYXlvdXRzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUucGF0aHMoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbi8vIFRPRE8gYm90aCB0ZXN0Lmh0bWwgYW5kIHRlc3QuaHRtbC5uamsgbWF0Y2hcbi8vICAgICAgVGhpcyBpcyBwcm9iYWJseSBpbmNvcnJlY3QsIHNpbmNlIHdlIGRvIG5vdCByZW5kZXIgdGhlc2UgZmlsZXNcbi8vICAgICAgVGhlIHBhcnRpYWxzIGRpcmVjdG9yeSBoYXMgdGhlIHNhbWUgcHJvYmxlbVxuLy8gICAgICBTb21lIGtpbmQgb2YgZmxhZyBvbiBjcmVhdGluZyB0aGUgRmlsZUNhY2hlIHRvIGNoYW5nZSB0aGUgYmVoYXZpb3JcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdsYXlvdXRpbmZvIDxjb25maWdGTj4gPGRvY0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGEgbGF5b3V0IGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgbGF5b3V0Rk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dGluZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZS5maW5kKGxheW91dEZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGxheW91dGluZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGxheW91dGluZm8gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BhcnRpYWxzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgcGFydGlhbHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUucGF0aHMoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcGFydGlhbHMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4vLyBUT0RPIGJvdGggdGVzdC5odG1sIGFuZCB0ZXN0Lmh0bWwubmprIG1hdGNoXG4vLyAgICAgIFRoaXMgaXMgcHJvYmFibHkgaW5jb3JyZWN0LCBzaW5jZSB3ZSBkbyBub3QgcmVuZGVyIHRoZXNlIGZpbGVzXG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncGFydGlhbGluZm8gPGNvbmZpZ0ZOPiA8ZG9jRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBwYXJ0aWFsIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcGFydGlhbEZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBwYXJ0aWFsaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUucGFydGlhbHNDYWNoZS5maW5kKHBhcnRpYWxGTik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwYXJ0aWFsaW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcGFydGlhbGluZm8gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2luZGV4IDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTG9hZHMgY29uZmlndXJhdGlvbiwgaW5kZXhlcyBjb250ZW50LCB0aGVuIGV4aXRzJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsaW5mbyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW0ucGFyc2UocHJvY2Vzcy5hcmd2KTtcbiJdfQ==