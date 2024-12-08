#!/usr/bin/env node
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
basedir: ${doc.basedir}
docpath: ${doc.docpath}
fspath: ${doc.fspath}
renderer: ${util.inspect(doc.renderer)}
renderpath: ${doc.renderpath}

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
        console.log(`render-document before renderPath ${documentFN}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUgsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLE9BQU8sTUFBTSxVQUFVLENBQUM7QUFDL0IsT0FBTyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBRXpCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxJQUFJLE1BQU0sU0FBUyxDQUFDO0FBRTNCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBRWhELE9BQU8sQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDO0FBQy9CLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFekIsT0FBTztLQUNGLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQztLQUNqQyxXQUFXLENBQUMsbUNBQW1DLENBQUM7S0FDaEQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUN2QixJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FDckMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNYLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDM0IsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQzFCLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lB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LFFBQVEsQ0FBQyxDQUNyQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ1gsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsTUFBTSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUM1RCxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFUCxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyMiBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgcHJvZ3JhbSB9IGZyb20gJ2NvbW1hbmRlcic7XG5pbXBvcnQgZ2hwYWdlcyBmcm9tICdnaC1wYWdlcyc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0ICogYXMgZGF0YSBmcm9tICcuL2RhdGEuanMnO1xuaW1wb3J0IFlBTUwgZnJvbSAnanMteWFtbCc7XG5cbmNvbnN0IF93YXRjaG1hbiA9IGltcG9ydCgnLi9jYWNoZS93YXRjaG1hbi5qcycpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2FrYXNoYXJlbmRlcic7XG5wcm9ncmFtLnZlcnNpb24oJzAuNy41Jyk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY29weS1hc3NldHMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdDb3B5IGFzc2V0cyBpbnRvIG91dHB1dCBkaXJlY3RvcnknKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgYXdhaXQgY29uZmlnLmNvcHlBc3NldHMoKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb3B5LWFzc2V0cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2N1bWVudCA8Y29uZmlnRk4+IDxkb2N1bWVudEZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGEgZG9jdW1lbnQnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBkb2N1bWVudEZOKSA9PiB7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2N1bWVudHMgPSBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZG9jdW1lbnRGTik7XG4gICAgICAgICAgICAvLyBkYXRhOiAke2RvYy5kYXRhfVxuICAgICAgICAgICAgLy8gdGV4dDogJHtkb2MudGV4dH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcbmJhc2VkaXI6ICR7ZG9jLmJhc2VkaXJ9XG5kb2NwYXRoOiAke2RvYy5kb2NwYXRofVxuZnNwYXRoOiAke2RvYy5mc3BhdGh9XG5yZW5kZXJlcjogJHt1dGlsLmluc3BlY3QoZG9jLnJlbmRlcmVyKX1cbnJlbmRlcnBhdGg6ICR7ZG9jLnJlbmRlcnBhdGh9XG5cbm1ldGFkYXRhOiAke3V0aWwuaW5zcGVjdChkb2MubWV0YWRhdGEpfVxuXG5gKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncmVuZGVyLWRvY3VtZW50IDxjb25maWdGTj4gPGRvY3VtZW50Rk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1JlbmRlciBhIGRvY3VtZW50IGludG8gb3V0cHV0IGRpcmVjdG9yeScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGRvY3VtZW50Rk4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBhd2FpdCBkYXRhLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYHJlbmRlci1kb2N1bWVudCBiZWZvcmUgcmVuZGVyUGF0aCAke2RvY3VtZW50Rk59YCk7XG4gICAgICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgYWthc2hhLnJlbmRlclBhdGgoY29uZmlnLCBkb2N1bWVudEZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcmVuZGVyLWRvY3VtZW50IGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdyZW5kZXIgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdSZW5kZXIgYSBzaXRlIGludG8gb3V0cHV0IGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1xdWlldCcsICdEbyBub3QgcHJpbnQgdGhlIHJlbmRlcmluZyByZXBvcnQnKVxuICAgIC5vcHRpb24oJy0tY29weS1hc3NldHMnLCAnRmlyc3QsIGNvcHkgdGhlIGFzc2V0cycpXG4gICAgLm9wdGlvbignLS1yZXN1bHRzLXRvIDxyZXN1bHRGaWxlPicsICdTdG9yZSB0aGUgcmVzdWx0cyBpbnRvIHRoZSBuYW1lZCBmaWxlJylcbiAgICAub3B0aW9uKCctLXBlcmZyZXN1bHRzIDxwZXJmUmVzdWx0c0ZpbGU+JywgJ1N0b3JlIHRoZSB0aW1lIHRvIHJlbmRlciBlYWNoIGRvY3VtZW50JylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBhd2FpdCBkYXRhLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5jb3B5QXNzZXRzKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY29uZmlnLmNvcHlBc3NldHMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCByZXN1bHRzID0gYXdhaXQgYWthc2hhLnJlbmRlcihjb25maWcpO1xuICAgICAgICAgICAgaWYgKCFjbWRPYmoucXVpZXQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCByZXN1bHQgb2YgcmVzdWx0cykge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gLS0tIGlmIEFLQVNIQVJFTkRFUl9UUkFDRV9SRU5ERVIgdGhlbiBvdXRwdXQgdHJhY2luZyBkYXRhXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gLS0tIGFsc28gc2V0IHByb2Nlc3MuZW52LkdMT0JGU19UUkFDRT0xXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZXN1bHQuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0LnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3QocmVzdWx0LnJlc3VsdCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5yZXN1bHRzVG8pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvdXRwdXQgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShjbWRPYmoucmVzdWx0c1RvKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQud3JpdGUoJyoqKipFUlJPUiAnKyByZXN1bHQuZXJyb3IgKyAnXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQud3JpdGUocmVzdWx0LnJlc3VsdCArICdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHV0aWwuaW5zcGVjdChyZXN1bHQucmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnBlcmZyZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0cHV0ID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oY21kT2JqLnBlcmZyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQucmVzdWx0LnN0YXJ0c1dpdGgoJ0NPUFknKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWdub3JlXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0cyA9IHJlc3VsdC5yZXN1bHQuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBlcmYgPSByZXN1bHRzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1hdGNoZXMgPSBwZXJmLm1hdGNoKC8uKiA9PT4gKC4qKSBcXCgoWzAtOVxcLl0rKSBzZWNvbmRzXFwpJC8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaGVzKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA8IDMpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZuID0gbWF0Y2hlc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0aW1lID0gbWF0Y2hlc1syXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXBvcnQgPSBgJHt0aW1lfSAke2ZufWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgc3RhZ2VzID0gcmVzdWx0c1tpXS5tYXRjaCgvKEZST05UTUFUVEVSfEZJUlNUIFJFTkRFUnxTRUNPTkQgUkVOREVSfE1BSEFCSFVUQXxSRU5ERVJFRCkgKFswLTlcXC5dKykgc2Vjb25kcyQvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXN0YWdlcyB8fCBzdGFnZXMubGVuZ3RoIDwgMykgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwb3J0ICs9IGAgJHtzdGFnZXNbMV19ICR7c3RhZ2VzWzJdfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQud3JpdGUoYCR7cmVwb3J0fVxcbmApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG91dHB1dC5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJlbmRlciBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnd2F0Y2ggPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdUcmFjayBjaGFuZ2VzIHRvIGZpbGVzIGluIGEgc2l0ZSwgYW5kIHJlYnVpbGQgYW55dGhpbmcgdGhhdCBjaGFuZ2VzJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBhd2FpdCBkYXRhLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ0NBTExJTkcgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IGNvbmZpZy5ob29rQmVmb3JlU2l0ZVJlbmRlcmVkKCk7XG4gICAgICAgICAgICBjb25zdCB3YXRjaG1hbiA9IChhd2FpdCBfd2F0Y2htYW4pLndhdGNobWFuO1xuICAgICAgICAgICAgYXdhaXQgd2F0Y2htYW4oY29uZmlnKTtcbiAgICAgICAgICAgIC8vIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB3YXRjaCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZ2gtcGFnZXMtcHVibGlzaCA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1B1Ymxpc2ggYSBzaXRlIHVzaW5nIEdpdGh1YiBQYWdlcy4gIFRha2VzIHRoZSByZW5kZXJpbmcgZGVzdGluYXRpb24sIGFkZHMgaXQgaW50byBhIGJyYW5jaCwgYW5kIHB1c2hlcyB0aGF0IHRvIEdpdGh1YicpXG4gICAgLm9wdGlvbignLWIsIC0tYnJhbmNoIDxicmFuY2hOYW1lPicsICdUaGUgYnJhbmNoIHRvIHVzZSBmb3IgcHVibGlzaGluZyB0byBHaXRodWInKVxuICAgIC5vcHRpb24oJy1yLCAtLXJlcG8gPHJlcG9VUkw+JywgJ1RoZSByZXBvc2l0b3J5IFVSTCB0byB1c2UgaWYgaXQgbXVzdCBkaWZmZXIgZnJvbSB0aGUgVVJMIG9mIHRoZSBsb2NhbCBkaXJlY3RvcnknKVxuICAgIC5vcHRpb24oJy0tcmVtb3RlIDxyZW1vdGVOYW1lPicsICdUaGUgR2l0IHJlbW90ZSBuYW1lIHRvIHVzZSBpZiBpdCBtdXN0IGRpZmZlciBmcm9tIFwib3JpZ2luXCInKVxuICAgIC5vcHRpb24oJy0tdGFnIDx0YWc+JywgJ0FueSB0YWcgdG8gYWRkIHdoZW4gcHVzaGluZyB0byBHaXRodWInKVxuICAgIC5vcHRpb24oJy0tbWVzc2FnZSA8bWVzc2FnZT4nLCAnQW55IEdpdCBjb21taXQgbWVzc2FnZScpXG4gICAgLm9wdGlvbignLS11c2VybmFtZSA8dXNlcm5hbWU+JywgJ0dpdGh1YiB1c2VyIG5hbWUgdG8gdXNlJylcbiAgICAub3B0aW9uKCctLWVtYWlsIDxlbWFpbD4nLCAnR2l0aHViIHVzZXIgZW1haWwgdG8gdXNlJylcbiAgICAub3B0aW9uKCctLW5vcHVzaCcsICdEbyBub3QgcHVzaCB0byBHaXRodWIsIG9ubHkgY29tbWl0JylcbiAgICAub3B0aW9uKCctLWNuYW1lIDxkb21haW4+JywgJ1dyaXRlIG91dCBhIENOQU1FIGZpbGUgd2l0aCB0aGUgZG9tYWluIG5hbWUnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG5cbiAgICAgICAgICAgIGxldCBvcHRpb25zOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgZG90ZmlsZXM6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoY21kT2JqLmJyYW5jaCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuYnJhbmNoID0gY21kT2JqLmJyYW5jaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVwb1VSTCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVwbyA9IGNtZE9iai5yZXBvVVJMO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5yZW1vdGUpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnJlbW90ZSA9IGNtZE9iai5yZW1vdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLmNuYW1lKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jbmFtZSA9IGNtZE9iai5jbmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoudGFnKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy50YWcgPSBjbWRPYmoudGFnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5tZXNzYWdlID0gY21kT2JqLm1lc3NhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnVzZXJuYW1lIHx8IGNtZE9iai5lbWFpbCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudXNlciA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai51c2VybmFtZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudXNlci5uYW1lID0gY21kT2JqLnVzZXJuYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5lbWFpbCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudXNlci5lbWFpbCA9IGNtZE9iai5lbWFpbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoubm9wdXNoKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5wdXNoID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdGlvbnMubm9qZWt5bGwgPSB0cnVlO1xuICAgICAgICAgICAgb3B0aW9ucy5kb3RmaWxlcyA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBnaC1wYWdlcy1wdWJsaXNoIG9wdGlvbnMgJHtjb25maWcucmVuZGVyRGVzdGluYXRpb259IGNtZE9iaiAke3V0aWwuaW5zcGVjdChjbWRPYmopfSBvcHRpb25zICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfWApO1xuXG4gICAgICAgICAgICBnaHBhZ2VzLnB1Ymxpc2goY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCBvcHRpb25zLCBmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICBlbHNlIGNvbnNvbGUubG9nKCdPSycpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGdoLXBhZ2VzLXB1Ymxpc2ggY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY29uZmlnIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUHJpbnQgYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgY29uZmlnIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdwbHVnaW5zIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgcGx1Z2lucycpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcucGx1Z2lucyk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgY29uZmlnIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2NkaXJzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnRzIGRpcmVjdG9yaWVzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLmRvY3VtZW50RGlycyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jZGlycyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnYXNzZXRkaXJzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgYXNzZXRzIGRpcmVjdG9yaWVzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLmFzc2V0RGlycyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdwYXJ0aWFsZGlycyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHBhcnRpYWxzIGRpcmVjdG9yaWVzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLnBhcnRpYWxzRGlycyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcGFydGlhbGRpcnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2xheW91dHNkaXJzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgbGF5b3V0cyBkaXJlY3RvcmllcyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5sYXlvdXREaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRzZGlycyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2N1bWVudHMgPGNvbmZpZ0ZOPiBbcm9vdFBhdGhdJylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGRvY3VtZW50cyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHJvb3RQYXRoKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnBhdGhzKHJvb3RQYXRoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jdW1lbnRzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2NzLXNldC1kYXRlcyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1NldCB0aGUgYVRpbWUgYW5kIG1UaW1lIGZvciBkb2N1bWVudHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnNldFRpbWVzKCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3Mtc2V0LWRhdGVzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2NpbmZvIDxjb25maWdGTj4gPGRvY0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGEgZG9jdW1lbnQgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBkb2NGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgZG9jaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuZmluZChkb2NGTik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgZG9jRk4gJHtkb2NGTn0gYCwgZG9jaW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jaW5mbyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnaW5kZXgtZmlsZXMgPGNvbmZpZ0ZOPiBbcm9vdFBhdGhdJylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGluZGV4IHBhZ2VzIChpbmRleC5odG1sKSB1bmRlciB0aGUgZ2l2ZW4gZGlyZWN0b3J5JylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcm9vdFBhdGgpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY2luZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLmluZGV4RmlsZXMocm9vdFBhdGgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGluZGV4ZXMgJHtyb290UGF0aH0gYCwgZG9jaW5mby5tYXAoaW5kZXggPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBpbmRleC52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5kZXgucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogaW5kZXgubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5kZXgucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgZGlybmFtZTogaW5kZXguZGlybmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbmRleC1maWxlcyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnc2libGluZ3MgPGNvbmZpZ0ZOPiA8dnBhdGg+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHNpYmxpbmcgcGFnZXMgdG8gdGhlIG5hbWVkIGRvY3VtZW50JylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgdnBhdGgpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY2luZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnNpYmxpbmdzKHZwYXRoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBzaWJsaW5ncyAke3ZwYXRofSBgLCBkb2NpbmZvLm1hcChpbmRleCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGluZGV4LnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBpbmRleC5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBpbmRleC5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmRleC5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBkaXJuYW1lOiBpbmRleC5kaXJuYW1lXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHNpYmxpbmdzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCd0YWdzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgdGFncycpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUudGFncygpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2NzLXdpdGgtdGFnIDxjb25maWdGTj4gPHRhZ3MuLi4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGRvY3VtZW50IHZwYXRocyBmb3IgZ2l2ZW4gdGFncycpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHRhZ3MpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlXG4gICAgICAgICAgICAgICAgLmRvY3VtZW50c0NhY2hlLmRvY3VtZW50c1dpdGhUYWcodGFncykpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdjaGlsZC1pdGVtLXRyZWUgPGNvbmZpZ0ZOPiA8cm9vdFBhdGg+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGRvY3VtZW50cyB1bmRlciBhIGdpdmVuIGxvY2F0aW9uIGJ5IHRyZWUnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCByb290UGF0aCkgPT4ge1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgWUFNTC5kdW1wKHtcbiAgICAgICAgICAgICAgICAgICAgdHJlZTogYXdhaXQgYWthc2hhLmZpbGVjYWNoZVxuICAgICAgICAgICAgICAgICAgICAgICAgLmRvY3VtZW50c0NhY2hlLmNoaWxkSXRlbVRyZWUocm9vdFBhdGgpXG4gICAgICAgICAgICAgICAgfSwgeyBpbmRlbnQ6IDQgfSlcbiAgICAgICAgICAgICAgICAvLyAubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgdnBhdGg6IGl0ZW0udnBhdGgsXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICByZW5kZXJQYXRoOiBpdGVtLnJlbmRlclBhdGhcbiAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdzZWFyY2ggPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTZWFyY2ggZm9yIGRvY3VtZW50cycpXG4gICAgLm9wdGlvbignLS1yb290IDxyb290UGF0aD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgd2l0aGluIHRoZSBuYW1lZCBkaXJlY3RvcnknKVxuICAgIC5vcHRpb24oJy0tbWF0Y2ggPHBhdGhtYXRjaD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbicpXG4gICAgLm9wdGlvbignLS1yZW5kZXJtYXRjaCA8cmVuZGVycGF0aG1hdGNoPicsICdTZWxlY3Qgb25seSBmaWxlcyBtYXRjaGluZyB0aGUgcmVndWxhciBleHByZXNzaW9uJylcbiAgICAub3B0aW9uKCctLWdsb2IgPGdsb2JtYXRjaD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIGdsb2IgZXhwcmVzc2lvbicpXG4gICAgLm9wdGlvbignLS1yZW5kZXJnbG9iIDxnbG9ibWF0Y2g+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIHJlbmRlcmluZyB0byB0aGUgZ2xvYiBleHByZXNzaW9uJylcbiAgICAub3B0aW9uKCctLWxheW91dCA8bGF5b3V0PicsICdTZWxlY3Qgb25seSBmaWxlcyBtYXRjaGluZyB0aGUgbGF5b3V0cycpXG4gICAgLm9wdGlvbignLS1taW1lIDxtaW1lPicsICdTZWxlY3Qgb25seSBmaWxlcyBtYXRjaGluZyB0aGUgTUlNRSB0eXBlJylcbiAgICAub3B0aW9uKCctLXRhZyA8dGFnPicsICdTZWxlY3Qgb25seSBmaWxlcyB3aXRoIHRoZSB0YWcnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGNtZE9iaik7XG4gICAgICAgICAgICBsZXQgb3B0aW9uczogYW55ID0geyB9O1xuICAgICAgICAgICAgaWYgKGNtZE9iai5yb290KSBvcHRpb25zLnJvb3RQYXRoID0gY21kT2JqLnJvb3Q7XG4gICAgICAgICAgICBpZiAoY21kT2JqLm1hdGNoKSBvcHRpb25zLnBhdGhtYXRjaCA9IGNtZE9iai5tYXRjaDtcbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVuZGVybWF0Y2gpIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoID0gY21kT2JqLnJlbmRlcm1hdGNoO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5nbG9iKSBvcHRpb25zLmdsb2IgPSBjbWRPYmouZ2xvYjtcbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVuZGVyZ2xvYikgb3B0aW9ucy5yZW5kZXJnbG9iID0gY21kT2JqLnJlbmRlcmdsb2I7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmxheW91dCkgb3B0aW9ucy5sYXlvdXRzID0gWyBjbWRPYmoubGF5b3V0IF07XG4gICAgICAgICAgICBpZiAoY21kT2JqLm1pbWUpIG9wdGlvbnMubWltZSA9IGNtZE9iai5taW1lO1xuICAgICAgICAgICAgaWYgKGNtZE9iai50YWcpIG9wdGlvbnMudGFnID0gY21kT2JqLnRhZztcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKG9wdGlvbnMpO1xuICAgICAgICAgICAgbGV0IGRvY3MgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnNlYXJjaChvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRvY3NcbiAgICAgICAgICAgIC8vIC5tYXAoZG9jID0+IHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogZG9jLnZwYXRoLFxuICAgICAgICAgICAgLy8gICAgICAgICByZW5kZXJQYXRoOiBkb2MucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgZGlybmFtZTogZG9jLmRpcm5hbWVcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgLy8gLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiB7XG4gICAgICAgICAgICAvLyAgICAgdmFyIHRhZ0EgPSBhLmRpcm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIC8vICAgICB2YXIgdGFnQiA9IGIuZGlybmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgLy8gICAgIGlmICh0YWdBIDwgdGFnQikgcmV0dXJuIC0xO1xuICAgICAgICAgICAgLy8gICAgIGlmICh0YWdBID4gdGFnQikgcmV0dXJuIDE7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgLy8gLnJldmVyc2UoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBzZWFyY2ggY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2Fzc2V0cyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGFzc2V0cyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGUucGF0aHMoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdhc3NldGluZm8gPGNvbmZpZ0ZOPiA8ZG9jRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYW4gYXNzZXQgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBhc3NldEZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBhc3NldGluZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlLmZpbmQoYXNzZXRGTik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhc3NldGluZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0aW5mbyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnbGF5b3V0cyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGxheW91dHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZS5wYXRocygpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuLy8gVE9ETyBib3RoIHRlc3QuaHRtbCBhbmQgdGVzdC5odG1sLm5qayBtYXRjaFxuLy8gICAgICBUaGlzIGlzIHByb2JhYmx5IGluY29ycmVjdCwgc2luY2Ugd2UgZG8gbm90IHJlbmRlciB0aGVzZSBmaWxlc1xuLy8gICAgICBUaGUgcGFydGlhbHMgZGlyZWN0b3J5IGhhcyB0aGUgc2FtZSBwcm9ibGVtXG4vLyAgICAgIFNvbWUga2luZCBvZiBmbGFnIG9uIGNyZWF0aW5nIHRoZSBGaWxlQ2FjaGUgdG8gY2hhbmdlIHRoZSBiZWhhdmlvclxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2xheW91dGluZm8gPGNvbmZpZ0ZOPiA8ZG9jRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBsYXlvdXQgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBsYXlvdXRGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0aW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUubGF5b3V0c0NhY2hlLmZpbmQobGF5b3V0Rk4pO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobGF5b3V0aW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0aW5mbyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncGFydGlhbHMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBwYXJ0aWFscyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUucGFydGlhbHNDYWNoZS5wYXRocygpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFscyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbi8vIFRPRE8gYm90aCB0ZXN0Lmh0bWwgYW5kIHRlc3QuaHRtbC5uamsgbWF0Y2hcbi8vICAgICAgVGhpcyBpcyBwcm9iYWJseSBpbmNvcnJlY3QsIHNpbmNlIHdlIGRvIG5vdCByZW5kZXIgdGhlc2UgZmlsZXNcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdwYXJ0aWFsaW5mbyA8Y29uZmlnRk4+IDxkb2NGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2hvdyBpbmZvcm1hdGlvbiBhYm91dCBhIHBhcnRpYWwgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBwYXJ0aWFsRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLmZpbmQocGFydGlhbEZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBhcnRpYWxpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsaW5mbyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnaW5kZXggPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMb2FkcyBjb25maWd1cmF0aW9uLCBpbmRleGVzIGNvbnRlbnQsIHRoZW4gZXhpdHMnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHBhcnRpYWxpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbS5wYXJzZShwcm9jZXNzLmFyZ3YpO1xuIl19