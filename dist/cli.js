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
import { refactorTag } from './refactor-tags.js';
const _watchman = import('./cache/watchman.js');
process.title = 'akasharender';
program.version('0.9.5');
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
function formatResult(result) {
    return `
${result.renderFormat} ${result.vpath} ==> ${result.renderPath}
FIRST ${result.renderFirstElapsed} LAYOUT ${result.renderLayoutElapsed} MAHA ${result.renderMahaElapsed} TOTAL ${result.renderTotalElapsed}`;
}
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
        let result = await akasha.renderPath2(config, documentFN);
        // console.log(result);
        console.log(formatResult(result));
        if (Array.isArray(result.errors)
            && result.errors.length >= 1) {
            for (const error of result.errors) {
                console.log(error.stack);
            }
        }
        await akasha.closeCaches();
    }
    catch (e) {
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
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        await data.removeAll();
        if (cmdObj.copyAssets) {
            await config.copyAssets();
        }
        if (typeof cmdObj.cachingTimeout === 'string') {
            config.setCachingTimeout(Number.parseInt(cmdObj.cachingTimeout));
        }
        let results = await akasha.render2(config);
        if (!cmdObj.quiet) {
            for (let result of results) {
                // TODO --- if AKASHARENDER_TRACE_RENDER then output tracing data
                // TODO --- also set process.env.GLOBFS_TRACE=1
                // console.log(result)
                console.log(formatResult(result));
                if (Array.isArray(result.errors)
                    && result.errors.length >= 1) {
                    for (const error of result.errors) {
                        console.log(error.stack);
                    }
                }
            }
        }
        if (cmdObj.resultsTo) {
            const output = fs.createWriteStream(cmdObj.resultsTo);
            for (let result of results) {
                output.write(formatResult(result));
                if (Array.isArray(result.errors)
                    && result.errors.length >= 1) {
                    for (const error of result.errors) {
                        output.write(error.stack);
                    }
                }
            }
            output.close();
        }
        if (cmdObj.perfresults) {
            const reports = [];
            for (let result of results) {
                const report = {
                    renderedPath: result.vpath,
                    format: result.renderFormat,
                    time: result.renderStart,
                    first: result.renderFirstElapsed,
                    second: result.renderLayoutElapsed,
                    mahabhuta: result.renderMahaElapsed,
                    rendered: result.renderTotalElapsed
                };
                reports.push(report);
            }
            fsp.writeFile(cmdObj.perfresults, JSON.stringify(reports, undefined, 4), 'utf-8');
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
        console.log(`index chain ${startPath} `, docinfo);
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
    .command('docs-semantic <configFN> <searchFor>')
    .description('List the document vpaths semantically matching the string')
    .action(async (configFN, searchFor) => {
    // console.log(`render: akasha: ${util.inspect(akasha)}`);
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        console.log(await akasha.filecache.documentsCache.semanticSearchDocs(searchFor));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`docs-semantic command ERRORED ${e.stack}`);
    }
});
program
    .command('tags <configFN>')
    .description('List the tags')
    .action(async (configFN) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        const tags = await akasha.filecache.documentsCache.tags();
        console.log(YAML.dump({ tags }, { indent: 4 }));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`tags command ERRORED ${e.stack}`);
    }
});
program
    .command('similar-tags <configFN>')
    .description('Find groups of similar tags')
    .option('--threshold <n>', 'Levenshtein distance threshold', '2')
    .action(async (configFN, cmdObj) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        const threshold = parseInt(cmdObj.threshold, 10);
        const groups = await akasha.filecache.documentsCache.findSimilarTags(threshold);
        console.log(YAML.dump({ similarTagGroups: groups }, { indent: 4 }));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`similar-tags command ERRORED ${e.stack}`);
    }
});
program
    .command('tags-without-descriptions <configFN>')
    .description('List tags that have no description')
    .action(async (configFN) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        const tags = await akasha.filecache.documentsCache.tagsWithoutDescriptions();
        console.log(YAML.dump({ tagsWithoutDescriptions: tags }, { indent: 4 }));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`tags-without-descriptions command ERRORED ${e.stack}`);
    }
});
program
    .command('unused-tag-descriptions <configFN>')
    .description('List tag descriptions that are not used by any document')
    .action(async (configFN) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        const tags = await akasha.filecache.documentsCache.unusedTagDescriptions();
        console.log(YAML.dump({ unusedTagDescriptions: tags }, { indent: 4 }));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`unused-tag-descriptions command ERRORED ${e.stack}`);
    }
});
program
    .command('refactor-tag <configFN> <oldTag> <newTag>')
    .description('Rename a tag across all documents')
    .option('--dry-run', 'List changes without modifying files', false)
    .action(async (configFN, oldTag, newTag, cmdObj) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        await akasha.setup(config);
        const result = await refactorTag(config, oldTag, newTag, {
            dryRun: cmdObj.dryRun
        });
        console.log(YAML.dump({ refactorResult: result }, { indent: 4 }));
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`refactor-tag command ERRORED ${e.stack}`);
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
    .option('--verbose', 'Show detailed event tracking (added, ready, error events)')
    .action(async (configFN, cmdObj) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        if (cmdObj.verbose) {
            console.log('Indexing files with verbose output...\n');
            const startTime = Date.now();
            // Enable verbose mode in config
            config.verbose = true;
            await akasha.setup(config);
            const setupTime = Date.now();
            const elapsed = setupTime - startTime;
            // Get file counts
            const filecache = akasha.filecache;
            const documentCount = (await filecache.documentsCache.paths()).length;
            const assetCount = (await filecache.assetsCache.paths()).length;
            const layoutCount = (await filecache.layoutsCache.paths()).length;
            const partialCount = (await filecache.partialsCache.paths()).length;
            console.log(`✓ Indexing completed in ${elapsed}ms\n`);
            console.log('=== Summary ===');
            console.log(`Documents: ${documentCount} files`);
            console.log(`Assets: ${assetCount} files`);
            console.log(`Layouts: ${layoutCount} files`);
            console.log(`Partials: ${partialCount} files`);
            console.log(`Total: ${documentCount + assetCount + layoutCount + partialCount} files`);
        }
        else {
            // Normal mode - just setup
            await akasha.setup(config);
        }
        await akasha.closeCaches();
    }
    catch (e) {
        console.error(`index command ERRORED ${e.stack}`);
    }
});
program
    .command('check-ready <configFN>')
    .description('Verify that all files are loaded before isReady triggers (diagnostic tool)')
    .option('--verbose', 'Show detailed file-by-file tracking')
    .option('--delay <ms>', 'Wait time in milliseconds to check for late additions (default: 2000)', '2000')
    .action(async (configFN, cmdObj) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        console.log('Running isReady timing check...\n');
        // Capture initial state
        const startTime = Date.now();
        await akasha.setup(config);
        const setupTime = Date.now();
        // Get counts immediately after setup
        const filecache = akasha.filecache;
        const countsAfterSetup = {
            documents: (await filecache.documentsCache.paths()).length,
            assets: (await filecache.assetsCache.paths()).length,
            layouts: (await filecache.layoutsCache.paths()).length,
            partials: (await filecache.partialsCache.paths()).length
        };
        console.log(`✓ Setup completed in ${setupTime - startTime}ms`);
        console.log(`  Documents: ${countsAfterSetup.documents}`);
        console.log(`  Assets: ${countsAfterSetup.assets}`);
        console.log(`  Layouts: ${countsAfterSetup.layouts}`);
        console.log(`  Partials: ${countsAfterSetup.partials}`);
        // Wait specified delay to see if any additional files appear
        const delayMs = parseInt(cmdObj.delay);
        console.log(`\nWaiting ${delayMs}ms to check for late additions...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        const countsAfterDelay = {
            documents: (await filecache.documentsCache.paths()).length,
            assets: (await filecache.assetsCache.paths()).length,
            layouts: (await filecache.layoutsCache.paths()).length,
            partials: (await filecache.partialsCache.paths()).length
        };
        // Compare counts
        let issueDetected = false;
        const checkCache = (name) => {
            const before = countsAfterSetup[name];
            const after = countsAfterDelay[name];
            if (before !== after) {
                console.error(`\n❌ ISSUE DETECTED: ${name} count changed from ${before} to ${after}`);
                console.error(`   This indicates files were added after isReady!`);
                issueDetected = true;
                return false;
            }
            else {
                if (cmdObj.verbose) {
                    console.log(`✓ ${name}: ${before} files (stable)`);
                }
                return true;
            }
        };
        console.log('\nResults:');
        const docsOk = checkCache('documents');
        const assetsOk = checkCache('assets');
        const layoutsOk = checkCache('layouts');
        const partialsOk = checkCache('partials');
        if (!issueDetected) {
            console.log('\n✅ SUCCESS: No files added after isReady. Timing is correct.');
            console.log('\nAll caches are stable:');
            console.log(`  ✓ Documents: ${countsAfterSetup.documents} files`);
            console.log(`  ✓ Assets: ${countsAfterSetup.assets} files`);
            console.log(`  ✓ Layouts: ${countsAfterSetup.layouts} files`);
            console.log(`  ✓ Partials: ${countsAfterSetup.partials} files`);
        }
        else {
            console.error('\n⚠️  FAILURE: Files were added after isReady triggered!');
            console.error('   This indicates a race condition that needs to be fixed.');
            console.error('\n   Please report this issue at:');
            console.error('   https://github.com/akashacms/akasharender/issues');
        }
        await akasha.closeCaches();
        if (issueDetected) {
            process.exit(1);
        }
    }
    catch (e) {
        console.error(`check-ready command ERRORED ${e.stack}`);
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUgsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLE9BQU8sTUFBTSxVQUFVLENBQUM7QUFDL0IsT0FBTyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ3pCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxJQUFJLE1BQU0sU0FBUyxDQUFDO0FBRTNCLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUVqRCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUVoRCxPQUFPLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQztBQUMvQixPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRXpCLE9BQU87S0FDRixPQUFPLENBQUMsd0JBQXdCLENBQUM7S0FDakMsV0FBVyxDQUFDLG1DQUFtQyxDQUFDO0tBQ2hELE1BQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7SUFDdkIsSUFBSSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLE1BQU0sQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQ3JDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDWCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLE1BQU0sTUFBTSxDQUFDLEtBQUss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Q0FBQyxPQUFPLFFBQVEsQ0FBQyxDQUFDO1lBQzlELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLGdCQUFnQixDQUFDLFFBQVEsUUFBUSxDQUFDLENBQUM7UUFDcEUsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLENBQUMsS0FBSyxDQUFDLDBEQUEwRCxDQUFDLENBQUM7WUFDMUUsT0FBTyxDQUFDLEtBQUssQ0FBQyw0REFBNEQsQ0FBQyxDQUFDO1lBQzVFLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQztZQUNuRCxPQUFPLENBQUMsS0FBSyxDQUFDLHFEQUFxRCxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVELE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRTNCLElBQUksYUFBYSxFQUFFLENBQUM7WUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUN4RCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBwcm9ncmFtIH0gZnJvbSAnY29tbWFuZGVyJztcbmltcG9ydCBnaHBhZ2VzIGZyb20gJ2doLXBhZ2VzJztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgKiBhcyBkYXRhIGZyb20gJy4vZGF0YS5qcyc7XG5pbXBvcnQgWUFNTCBmcm9tICdqcy15YW1sJztcbmltcG9ydCB7IFJlbmRlcmluZ1Jlc3VsdHMgfSBmcm9tICcuL3JlbmRlci5qcyc7XG5pbXBvcnQgeyByZWZhY3RvclRhZyB9IGZyb20gJy4vcmVmYWN0b3ItdGFncy5qcyc7XG5cbmNvbnN0IF93YXRjaG1hbiA9IGltcG9ydCgnLi9jYWNoZS93YXRjaG1hbi5qcycpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2FrYXNoYXJlbmRlcic7XG5wcm9ncmFtLnZlcnNpb24oJzAuOS41Jyk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY29weS1hc3NldHMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdDb3B5IGFzc2V0cyBpbnRvIG91dHB1dCBkaXJlY3RvcnknKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgYXdhaXQgY29uZmlnLmNvcHlBc3NldHMoKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb3B5LWFzc2V0cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2N1bWVudCA8Y29uZmlnRk4+IDxkb2N1bWVudEZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGEgZG9jdW1lbnQnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBkb2N1bWVudEZOKSA9PiB7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2N1bWVudHMgPSBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZG9jdW1lbnRGTik7XG4gICAgICAgICAgICAvLyBkYXRhOiAke2RvYy5kYXRhfVxuICAgICAgICAgICAgLy8gdGV4dDogJHtkb2MudGV4dH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcbmRvY3BhdGg6ICR7ZG9jLnZwYXRofVxuZnNwYXRoOiAke2RvYy5mc3BhdGh9XG5yZW5kZXJlcjogJHt1dGlsLmluc3BlY3QoY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZG9jLnZwYXRoKSl9XG5yZW5kZXJwYXRoOiAke2RvYy5yZW5kZXJQYXRofVxubW91bnRlZDogJHtkb2MubW91bnRlZH1cbm1vdW50UG9pbnQ6ICR7ZG9jLm1vdW50UG9pbnR9XG5cbm1ldGFkYXRhOiAke3V0aWwuaW5zcGVjdChkb2MubWV0YWRhdGEpfVxuXG5gKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbmZ1bmN0aW9uIGZvcm1hdFJlc3VsdChyZXN1bHQ6IFJlbmRlcmluZ1Jlc3VsdHMpIHtcbiAgICByZXR1cm4gYFxuJHtyZXN1bHQucmVuZGVyRm9ybWF0fSAke3Jlc3VsdC52cGF0aH0gPT0+ICR7cmVzdWx0LnJlbmRlclBhdGh9XG5GSVJTVCAke3Jlc3VsdC5yZW5kZXJGaXJzdEVsYXBzZWR9IExBWU9VVCAke3Jlc3VsdC5yZW5kZXJMYXlvdXRFbGFwc2VkfSBNQUhBICR7cmVzdWx0LnJlbmRlck1haGFFbGFwc2VkfSBUT1RBTCAke3Jlc3VsdC5yZW5kZXJUb3RhbEVsYXBzZWR9YDtcbn1cblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdyZW5kZXItZG9jdW1lbnQgPGNvbmZpZ0ZOPiA8ZG9jdW1lbnRGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUmVuZGVyIGEgZG9jdW1lbnQgaW50byBvdXRwdXQgZGlyZWN0b3J5JylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgZG9jdW1lbnRGTikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGF3YWl0IGRhdGEucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyLWRvY3VtZW50IGJlZm9yZSByZW5kZXJQYXRoICR7ZG9jdW1lbnRGTn1gKTtcbiAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBha2FzaGEucmVuZGVyUGF0aDIoY29uZmlnLCBkb2N1bWVudEZOKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhmb3JtYXRSZXN1bHQocmVzdWx0KSk7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQuZXJyb3JzKVxuICAgICAgICAgICAgICAgICYmIHJlc3VsdC5lcnJvcnMubGVuZ3RoID49IDFcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZXJyb3Igb2YgcmVzdWx0LmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJlbmRlci1kb2N1bWVudCBjb21tYW5kIEVSUk9SRURgLCBlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3JlbmRlciA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1JlbmRlciBhIHNpdGUgaW50byBvdXRwdXQgZGlyZWN0b3J5JylcbiAgICAub3B0aW9uKCctLXF1aWV0JywgJ0RvIG5vdCBwcmludCB0aGUgcmVuZGVyaW5nIHJlcG9ydCcpXG4gICAgLm9wdGlvbignLS1jb3B5LWFzc2V0cycsICdGaXJzdCwgY29weSB0aGUgYXNzZXRzJylcbiAgICAub3B0aW9uKCctLXJlc3VsdHMtdG8gPHJlc3VsdEZpbGU+JywgJ1N0b3JlIHRoZSByZXN1bHRzIGludG8gdGhlIG5hbWVkIGZpbGUnKVxuICAgIC5vcHRpb24oJy0tcGVyZnJlc3VsdHMgPHBlcmZSZXN1bHRzRmlsZT4nLCAnU3RvcmUgdGhlIHRpbWUgdG8gcmVuZGVyIGVhY2ggZG9jdW1lbnQnKVxuICAgIC5vcHRpb24oJy0tY2FjaGluZy10aW1lb3V0IDx0aW1lb3V0PicsICdUaGUgdGltZSwgaW4gbWlsaXNlY29uZHMsIHRvIGhvbm9yIGVudHJpZXMgaW4gdGhlIHNlYXJjaCBjYWNoZScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgYXdhaXQgZGF0YS5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgIGlmIChjbWRPYmouY29weUFzc2V0cykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNvbmZpZy5jb3B5QXNzZXRzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNtZE9iai5jYWNoaW5nVGltZW91dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuc2V0Q2FjaGluZ1RpbWVvdXQoXG4gICAgICAgICAgICAgICAgICAgIE51bWJlci5wYXJzZUludChjbWRPYmouY2FjaGluZ1RpbWVvdXQpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCByZXN1bHRzID0gPFJlbmRlcmluZ1Jlc3VsdHNbXT4gYXdhaXQgYWthc2hhLnJlbmRlcjIoY29uZmlnKTtcbiAgICAgICAgICAgIGlmICghY21kT2JqLnF1aWV0KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcmVzdWx0IG9mIHJlc3VsdHMpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIC0tLSBpZiBBS0FTSEFSRU5ERVJfVFJBQ0VfUkVOREVSIHRoZW4gb3V0cHV0IHRyYWNpbmcgZGF0YVxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIC0tLSBhbHNvIHNldCBwcm9jZXNzLmVudi5HTE9CRlNfVFJBQ0U9MVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZm9ybWF0UmVzdWx0KHJlc3VsdCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQuZXJyb3JzKVxuICAgICAgICAgICAgICAgICAgICAgJiYgcmVzdWx0LmVycm9ycy5sZW5ndGggPj0gMVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZXJyb3Igb2YgcmVzdWx0LmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVzdWx0c1RvKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0cHV0ID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oY21kT2JqLnJlc3VsdHNUbyk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LndyaXRlKGZvcm1hdFJlc3VsdChyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0LmVycm9ycylcbiAgICAgICAgICAgICAgICAgICAgICYmIHJlc3VsdC5lcnJvcnMubGVuZ3RoID49IDFcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQud3JpdGUoZXJyb3Iuc3RhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG91dHB1dC5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5wZXJmcmVzdWx0cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcG9ydHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcG9ydDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWRQYXRoPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lPzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3Q/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmQ/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWhhYmh1dGE/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlZD86IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgfSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkUGF0aDogcmVzdWx0LnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiByZXN1bHQucmVuZGVyRm9ybWF0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogcmVzdWx0LnJlbmRlclN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3Q6IHJlc3VsdC5yZW5kZXJGaXJzdEVsYXBzZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmQ6IHJlc3VsdC5yZW5kZXJMYXlvdXRFbGFwc2VkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFoYWJodXRhOiByZXN1bHQucmVuZGVyTWFoYUVsYXBzZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlZDogcmVzdWx0LnJlbmRlclRvdGFsRWxhcHNlZFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRzLnB1c2gocmVwb3J0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnNwLndyaXRlRmlsZShjbWRPYmoucGVyZnJlc3VsdHMsXG4gICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShyZXBvcnRzLCB1bmRlZmluZWQsIDQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3V0Zi04Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcmVuZGVyIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCd3YXRjaCA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1RyYWNrIGNoYW5nZXMgdG8gZmlsZXMgaW4gYSBzaXRlLCBhbmQgcmVidWlsZCBhbnl0aGluZyB0aGF0IGNoYW5nZXMnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGF3YWl0IGRhdGEucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnQ0FMTElORyBjb25maWcuaG9va0JlZm9yZVNpdGVSZW5kZXJlZCcpO1xuICAgICAgICAgICAgYXdhaXQgY29uZmlnLmhvb2tCZWZvcmVTaXRlUmVuZGVyZWQoKTtcbiAgICAgICAgICAgIGNvbnN0IHdhdGNobWFuID0gKGF3YWl0IF93YXRjaG1hbikud2F0Y2htYW47XG4gICAgICAgICAgICBhd2FpdCB3YXRjaG1hbihjb25maWcpO1xuICAgICAgICAgICAgLy8gYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHdhdGNoIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdnaC1wYWdlcy1wdWJsaXNoIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUHVibGlzaCBhIHNpdGUgdXNpbmcgR2l0aHViIFBhZ2VzLiAgVGFrZXMgdGhlIHJlbmRlcmluZyBkZXN0aW5hdGlvbiwgYWRkcyBpdCBpbnRvIGEgYnJhbmNoLCBhbmQgcHVzaGVzIHRoYXQgdG8gR2l0aHViJylcbiAgICAub3B0aW9uKCctYiwgLS1icmFuY2ggPGJyYW5jaE5hbWU+JywgJ1RoZSBicmFuY2ggdG8gdXNlIGZvciBwdWJsaXNoaW5nIHRvIEdpdGh1YicpXG4gICAgLm9wdGlvbignLXIsIC0tcmVwbyA8cmVwb1VSTD4nLCAnVGhlIHJlcG9zaXRvcnkgVVJMIHRvIHVzZSBpZiBpdCBtdXN0IGRpZmZlciBmcm9tIHRoZSBVUkwgb2YgdGhlIGxvY2FsIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1yZW1vdGUgPHJlbW90ZU5hbWU+JywgJ1RoZSBHaXQgcmVtb3RlIG5hbWUgdG8gdXNlIGlmIGl0IG11c3QgZGlmZmVyIGZyb20gXCJvcmlnaW5cIicpXG4gICAgLm9wdGlvbignLS10YWcgPHRhZz4nLCAnQW55IHRhZyB0byBhZGQgd2hlbiBwdXNoaW5nIHRvIEdpdGh1YicpXG4gICAgLm9wdGlvbignLS1tZXNzYWdlIDxtZXNzYWdlPicsICdBbnkgR2l0IGNvbW1pdCBtZXNzYWdlJylcbiAgICAub3B0aW9uKCctLXVzZXJuYW1lIDx1c2VybmFtZT4nLCAnR2l0aHViIHVzZXIgbmFtZSB0byB1c2UnKVxuICAgIC5vcHRpb24oJy0tZW1haWwgPGVtYWlsPicsICdHaXRodWIgdXNlciBlbWFpbCB0byB1c2UnKVxuICAgIC5vcHRpb24oJy0tbm9wdXNoJywgJ0RvIG5vdCBwdXNoIHRvIEdpdGh1Yiwgb25seSBjb21taXQnKVxuICAgIC5vcHRpb24oJy0tY25hbWUgPGRvbWFpbj4nLCAnV3JpdGUgb3V0IGEgQ05BTUUgZmlsZSB3aXRoIHRoZSBkb21haW4gbmFtZScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcblxuICAgICAgICAgICAgbGV0IG9wdGlvbnM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICBkb3RmaWxlczogdHJ1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChjbWRPYmouYnJhbmNoKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5icmFuY2ggPSBjbWRPYmouYnJhbmNoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5yZXBvVVJMKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5yZXBvID0gY21kT2JqLnJlcG9VUkw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlbW90ZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVtb3RlID0gY21kT2JqLnJlbW90ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmouY25hbWUpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNuYW1lID0gY21kT2JqLmNuYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai50YWcpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRhZyA9IGNtZE9iai50YWc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLm1lc3NhZ2UgPSBjbWRPYmoubWVzc2FnZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoudXNlcm5hbWUgfHwgY21kT2JqLmVtYWlsKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51c2VyID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51c2VyLm5hbWUgPSBjbWRPYmoudXNlcm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLmVtYWlsKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51c2VyLmVtYWlsID0gY21kT2JqLmVtYWlsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5ub3B1c2gpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnB1c2ggPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0aW9ucy5ub2pla3lsbCA9IHRydWU7XG4gICAgICAgICAgICBvcHRpb25zLmRvdGZpbGVzID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGdoLXBhZ2VzLXB1Ymxpc2ggb3B0aW9ucyAke2NvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbn0gY21kT2JqICR7dXRpbC5pbnNwZWN0KGNtZE9iail9IG9wdGlvbnMgJHt1dGlsLmluc3BlY3Qob3B0aW9ucyl9YCk7XG5cbiAgICAgICAgICAgIGdocGFnZXMucHVibGlzaChjb25maWcucmVuZGVyRGVzdGluYXRpb24sIG9wdGlvbnMsIGZ1bmN0aW9uKGVycikge1xuXG4gICAgICAgICAgICAgICAgaWYgKGVycikgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIGVsc2UgY29uc29sZS5sb2coJ09LJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZ2gtcGFnZXMtcHVibGlzaCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdjb25maWcgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdQcmludCBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb25maWcgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BsdWdpbnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBwbHVnaW5zJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5wbHVnaW5zKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb25maWcgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY2RpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcuZG9jdW1lbnREaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdhc3NldGRpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBhc3NldHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcuYXNzZXREaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldGRpcnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BhcnRpYWxkaXJzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgcGFydGlhbHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcucGFydGlhbHNEaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsZGlycyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnbGF5b3V0c2RpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBsYXlvdXRzIGRpcmVjdG9yaWVzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLmxheW91dERpcnMpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGxheW91dHNkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3VtZW50cyA8Y29uZmlnRk4+IFtyb290UGF0aF0nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnRzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcm9vdFBhdGgpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUucGF0aHMocm9vdFBhdGgpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudHMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3Mtc2V0LWRhdGVzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2V0IHRoZSBhVGltZSBhbmQgbVRpbWUgZm9yIGRvY3VtZW50cyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2V0VGltZXMoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy1zZXQtZGF0ZXMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY2luZm8gPGNvbmZpZ0ZOPiA8ZG9jRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBkb2N1bWVudCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGRvY0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5maW5kKGRvY0ZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBkb2NGTiAke2RvY0ZOfSBgLCBkb2NpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdpbmRleC1maWxlcyA8Y29uZmlnRk4+IFtyb290UGF0aF0nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgaW5kZXggcGFnZXMgKGluZGV4Lmh0bWwpIHVuZGVyIHRoZSBnaXZlbiBkaXJlY3RvcnknKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCByb290UGF0aCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgZG9jaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuaW5kZXhGaWxlcyhyb290UGF0aCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgaW5kZXhlcyAke3Jvb3RQYXRofSBgLCBkb2NpbmZvLm1hcChpbmRleCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGluZGV4LnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBpbmRleC5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBpbmRleC5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmRleC5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBkaXJuYW1lOiBpbmRleC5kaXJuYW1lXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluZGV4LWZpbGVzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdpbmRleC1jaGFpbiA8Y29uZmlnRk4+IHN0YXJ0UGF0aCcpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBpbmRleCBjaGFpbiBzdGFydGluZyBmcm9tIHRoZSBwYXRoJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgc3RhcnRQYXRoKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5pbmRleENoYWluKHN0YXJ0UGF0aCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgaW5kZXggY2hhaW4gJHtzdGFydFBhdGh9IGAsIGRvY2luZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluZGV4LWNoYWluIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdzaWJsaW5ncyA8Y29uZmlnRk4+IDx2cGF0aD4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgc2libGluZyBwYWdlcyB0byB0aGUgbmFtZWQgZG9jdW1lbnQnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCB2cGF0aCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgZG9jaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2libGluZ3ModnBhdGgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYHNpYmxpbmdzICR7dnBhdGh9IGAsIGRvY2luZm8ubWFwKGluZGV4ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogaW5kZXgudnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZGV4LnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZGV4Lm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZGV4LnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIGRpcm5hbWU6IGluZGV4LmRpcm5hbWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc2libGluZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3Mtc2VtYW50aWMgPGNvbmZpZ0ZOPiA8c2VhcmNoRm9yPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudCB2cGF0aHMgc2VtYW50aWNhbGx5IG1hdGNoaW5nIHRoZSBzdHJpbmcnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBzZWFyY2hGb3IpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2VtYW50aWNTZWFyY2hEb2NzKHNlYXJjaEZvcikpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3Mtc2VtYW50aWMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3RhZ3MgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSB0YWdzJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnRhZ3MoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHRhZ3MgfSwgeyBpbmRlbnQ6IDQgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHRhZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3NpbWlsYXItdGFncyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0ZpbmQgZ3JvdXBzIG9mIHNpbWlsYXIgdGFncycpXG4gICAgLm9wdGlvbignLS10aHJlc2hvbGQgPG4+JywgJ0xldmVuc2h0ZWluIGRpc3RhbmNlIHRocmVzaG9sZCcsICcyJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgdGhyZXNob2xkID0gcGFyc2VJbnQoY21kT2JqLnRocmVzaG9sZCwgMTApO1xuICAgICAgICAgICAgY29uc3QgZ3JvdXBzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5maW5kU2ltaWxhclRhZ3ModGhyZXNob2xkKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHNpbWlsYXJUYWdHcm91cHM6IGdyb3VwcyB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc2ltaWxhci10YWdzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCd0YWdzLXdpdGhvdXQtZGVzY3JpcHRpb25zIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0YWdzIHRoYXQgaGF2ZSBubyBkZXNjcmlwdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCB0YWdzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS50YWdzV2l0aG91dERlc2NyaXB0aW9ucygpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coWUFNTC5kdW1wKHsgdGFnc1dpdGhvdXREZXNjcmlwdGlvbnM6IHRhZ3MgfSwgeyBpbmRlbnQ6IDQgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHRhZ3Mtd2l0aG91dC1kZXNjcmlwdGlvbnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3VudXNlZC10YWctZGVzY3JpcHRpb25zIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0YWcgZGVzY3JpcHRpb25zIHRoYXQgYXJlIG5vdCB1c2VkIGJ5IGFueSBkb2N1bWVudCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCB0YWdzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS51bnVzZWRUYWdEZXNjcmlwdGlvbnMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHVudXNlZFRhZ0Rlc2NyaXB0aW9uczogdGFncyB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdW51c2VkLXRhZy1kZXNjcmlwdGlvbnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3JlZmFjdG9yLXRhZyA8Y29uZmlnRk4+IDxvbGRUYWc+IDxuZXdUYWc+JylcbiAgICAuZGVzY3JpcHRpb24oJ1JlbmFtZSBhIHRhZyBhY3Jvc3MgYWxsIGRvY3VtZW50cycpXG4gICAgLm9wdGlvbignLS1kcnktcnVuJywgJ0xpc3QgY2hhbmdlcyB3aXRob3V0IG1vZGlmeWluZyBmaWxlcycsIGZhbHNlKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBvbGRUYWcsIG5ld1RhZywgY21kT2JqKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVmYWN0b3JUYWcoY29uZmlnLCBvbGRUYWcsIG5ld1RhZywge1xuICAgICAgICAgICAgICAgIGRyeVJ1bjogY21kT2JqLmRyeVJ1blxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhZQU1MLmR1bXAoeyByZWZhY3RvclJlc3VsdDogcmVzdWx0IH0sIHsgaW5kZW50OiA0IH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByZWZhY3Rvci10YWcgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3Mtd2l0aC10YWcgPGNvbmZpZ0ZOPiA8dGFncy4uLj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnQgdnBhdGhzIGZvciBnaXZlbiB0YWdzJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgdGFncykgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGVcbiAgICAgICAgICAgICAgICAuZG9jdW1lbnRzQ2FjaGUuZG9jdW1lbnRzV2l0aFRhZyh0YWdzKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2NoaWxkLWl0ZW0tdHJlZSA8Y29uZmlnRk4+IDxyb290UGF0aD4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnRzIHVuZGVyIGEgZ2l2ZW4gbG9jYXRpb24gYnkgdHJlZScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHJvb3RQYXRoKSA9PiB7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICBZQU1MLmR1bXAoe1xuICAgICAgICAgICAgICAgICAgICB0cmVlOiBhd2FpdCBha2FzaGEuZmlsZWNhY2hlXG4gICAgICAgICAgICAgICAgICAgICAgICAuZG9jdW1lbnRzQ2FjaGUuY2hpbGRJdGVtVHJlZShyb290UGF0aClcbiAgICAgICAgICAgICAgICB9LCB7IGluZGVudDogNCB9KVxuICAgICAgICAgICAgICAgIC8vIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3NlYXJjaCA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1NlYXJjaCBmb3IgZG9jdW1lbnRzJylcbiAgICAub3B0aW9uKCctLXJvb3QgPHJvb3RQYXRoPicsICdTZWxlY3Qgb25seSBmaWxlcyB3aXRoaW4gdGhlIG5hbWVkIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1tYXRjaCA8cGF0aG1hdGNoPicsICdTZWxlY3Qgb25seSBmaWxlcyBtYXRjaGluZyB0aGUgcmVndWxhciBleHByZXNzaW9uJylcbiAgICAub3B0aW9uKCctLXJlbmRlcm1hdGNoIDxyZW5kZXJwYXRobWF0Y2g+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSByZWd1bGFyIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tZ2xvYiA8Z2xvYm1hdGNoPicsICdTZWxlY3Qgb25seSBmaWxlcyBtYXRjaGluZyB0aGUgZ2xvYiBleHByZXNzaW9uJylcbiAgICAub3B0aW9uKCctLXJlbmRlcmdsb2IgPGdsb2JtYXRjaD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgcmVuZGVyaW5nIHRvIHRoZSBnbG9iIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tbGF5b3V0IDxsYXlvdXQ+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSBsYXlvdXRzJylcbiAgICAub3B0aW9uKCctLW1pbWUgPG1pbWU+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSBNSU1FIHR5cGUnKVxuICAgIC5vcHRpb24oJy0tdGFnIDx0YWc+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIHdpdGggdGhlIHRhZycpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coY21kT2JqKTtcbiAgICAgICAgICAgIGxldCBvcHRpb25zOiBhbnkgPSB7IH07XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJvb3QpIG9wdGlvbnMucm9vdFBhdGggPSBjbWRPYmoucm9vdDtcbiAgICAgICAgICAgIGlmIChjbWRPYmoubWF0Y2gpIG9wdGlvbnMucGF0aG1hdGNoID0gY21kT2JqLm1hdGNoO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5yZW5kZXJtYXRjaCkgb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggPSBjbWRPYmoucmVuZGVybWF0Y2g7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmdsb2IpIG9wdGlvbnMuZ2xvYiA9IGNtZE9iai5nbG9iO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5yZW5kZXJnbG9iKSBvcHRpb25zLnJlbmRlcmdsb2IgPSBjbWRPYmoucmVuZGVyZ2xvYjtcbiAgICAgICAgICAgIGlmIChjbWRPYmoubGF5b3V0KSBvcHRpb25zLmxheW91dHMgPSBbIGNtZE9iai5sYXlvdXQgXTtcbiAgICAgICAgICAgIGlmIChjbWRPYmoubWltZSkgb3B0aW9ucy5taW1lID0gY21kT2JqLm1pbWU7XG4gICAgICAgICAgICBpZiAoY21kT2JqLnRhZykgb3B0aW9ucy50YWcgPSBjbWRPYmoudGFnO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cob3B0aW9ucyk7XG4gICAgICAgICAgICBsZXQgZG9jcyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2VhcmNoKG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZG9jc1xuICAgICAgICAgICAgLy8gLm1hcChkb2MgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHZwYXRoOiBkb2MudnBhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGRvYy5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgLy8gICAgICAgICBkaXJuYW1lOiBkb2MuZGlybmFtZVxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgICAvLyAuc29ydCgoYTogYW55LCBiOiBhbnkpID0+IHtcbiAgICAgICAgICAgIC8vICAgICB2YXIgdGFnQSA9IGEuZGlybmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgLy8gICAgIHZhciB0YWdCID0gYi5kaXJuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAvLyAgICAgaWYgKHRhZ0EgPCB0YWdCKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAvLyAgICAgaWYgKHRhZ0EgPiB0YWdCKSByZXR1cm4gMTtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgICAvLyAucmV2ZXJzZSgpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHNlYXJjaCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnYXNzZXRzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgYXNzZXRzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5hc3NldHNDYWNoZS5wYXRocygpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldHMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2Fzc2V0aW5mbyA8Y29uZmlnRk4+IDxkb2NGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2hvdyBpbmZvcm1hdGlvbiBhYm91dCBhbiBhc3NldCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGFzc2V0Rk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0aW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGUuZmluZChhc3NldEZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGFzc2V0aW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdsYXlvdXRzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgbGF5b3V0cyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUubGF5b3V0c0NhY2hlLnBhdGhzKCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGxheW91dHMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4vLyBUT0RPIGJvdGggdGVzdC5odG1sIGFuZCB0ZXN0Lmh0bWwubmprIG1hdGNoXG4vLyAgICAgIFRoaXMgaXMgcHJvYmFibHkgaW5jb3JyZWN0LCBzaW5jZSB3ZSBkbyBub3QgcmVuZGVyIHRoZXNlIGZpbGVzXG4vLyAgICAgIFRoZSBwYXJ0aWFscyBkaXJlY3RvcnkgaGFzIHRoZSBzYW1lIHByb2JsZW1cbi8vICAgICAgU29tZSBraW5kIG9mIGZsYWcgb24gY3JlYXRpbmcgdGhlIEZpbGVDYWNoZSB0byBjaGFuZ2UgdGhlIGJlaGF2aW9yXG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnbGF5b3V0aW5mbyA8Y29uZmlnRk4+IDxkb2NGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2hvdyBpbmZvcm1hdGlvbiBhYm91dCBhIGxheW91dCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGxheW91dEZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXRpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUuZmluZChsYXlvdXRGTik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhsYXlvdXRpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdwYXJ0aWFscyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHBhcnRpYWxzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLnBhdGhzKCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHBhcnRpYWxzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuLy8gVE9ETyBib3RoIHRlc3QuaHRtbCBhbmQgdGVzdC5odG1sLm5qayBtYXRjaFxuLy8gICAgICBUaGlzIGlzIHByb2JhYmx5IGluY29ycmVjdCwgc2luY2Ugd2UgZG8gbm90IHJlbmRlciB0aGVzZSBmaWxlc1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BhcnRpYWxpbmZvIDxjb25maWdGTj4gPGRvY0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGEgcGFydGlhbCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHBhcnRpYWxGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgcGFydGlhbGluZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuZmluZChwYXJ0aWFsRk4pO1xuICAgICAgICAgICAgY29uc29sZS5sb2cocGFydGlhbGluZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHBhcnRpYWxpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdpbmRleCA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xvYWRzIGNvbmZpZ3VyYXRpb24sIGluZGV4ZXMgY29udGVudCwgdGhlbiBleGl0cycpXG4gICAgLm9wdGlvbignLS12ZXJib3NlJywgJ1Nob3cgZGV0YWlsZWQgZXZlbnQgdHJhY2tpbmcgKGFkZGVkLCByZWFkeSwgZXJyb3IgZXZlbnRzKScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChjbWRPYmoudmVyYm9zZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbmRleGluZyBmaWxlcyB3aXRoIHZlcmJvc2Ugb3V0cHV0Li4uXFxuJyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBFbmFibGUgdmVyYm9zZSBtb2RlIGluIGNvbmZpZ1xuICAgICAgICAgICAgICAgIGNvbmZpZy52ZXJib3NlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBzZXR1cFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsYXBzZWQgPSBzZXR1cFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gR2V0IGZpbGUgY291bnRzXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZWNhY2hlID0gYWthc2hhLmZpbGVjYWNoZTtcbiAgICAgICAgICAgICAgICBjb25zdCBkb2N1bWVudENvdW50ID0gKGF3YWl0IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5wYXRocygpKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRDb3VudCA9IChhd2FpdCBmaWxlY2FjaGUuYXNzZXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dENvdW50ID0gKGF3YWl0IGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxDb3VudCA9IChhd2FpdCBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5wYXRocygpKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOKckyBJbmRleGluZyBjb21wbGV0ZWQgaW4gJHtlbGFwc2VkfW1zXFxuYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz09PSBTdW1tYXJ5ID09PScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBEb2N1bWVudHM6ICR7ZG9jdW1lbnRDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQXNzZXRzOiAke2Fzc2V0Q291bnR9IGZpbGVzYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYExheW91dHM6ICR7bGF5b3V0Q291bnR9IGZpbGVzYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFBhcnRpYWxzOiAke3BhcnRpYWxDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgVG90YWw6ICR7ZG9jdW1lbnRDb3VudCArIGFzc2V0Q291bnQgKyBsYXlvdXRDb3VudCArIHBhcnRpYWxDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gTm9ybWFsIG1vZGUgLSBqdXN0IHNldHVwXG4gICAgICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbmRleCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY2hlY2stcmVhZHkgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdWZXJpZnkgdGhhdCBhbGwgZmlsZXMgYXJlIGxvYWRlZCBiZWZvcmUgaXNSZWFkeSB0cmlnZ2VycyAoZGlhZ25vc3RpYyB0b29sKScpXG4gICAgLm9wdGlvbignLS12ZXJib3NlJywgJ1Nob3cgZGV0YWlsZWQgZmlsZS1ieS1maWxlIHRyYWNraW5nJylcbiAgICAub3B0aW9uKCctLWRlbGF5IDxtcz4nLCAnV2FpdCB0aW1lIGluIG1pbGxpc2Vjb25kcyB0byBjaGVjayBmb3IgbGF0ZSBhZGRpdGlvbnMgKGRlZmF1bHQ6IDIwMDApJywgJzIwMDAnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUnVubmluZyBpc1JlYWR5IHRpbWluZyBjaGVjay4uLlxcbicpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDYXB0dXJlIGluaXRpYWwgc3RhdGVcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHNldHVwVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEdldCBjb3VudHMgaW1tZWRpYXRlbHkgYWZ0ZXIgc2V0dXBcbiAgICAgICAgICAgIGNvbnN0IGZpbGVjYWNoZSA9IGFrYXNoYS5maWxlY2FjaGU7XG4gICAgICAgICAgICBjb25zdCBjb3VudHNBZnRlclNldHVwID0ge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50czogKGF3YWl0IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYXNzZXRzOiAoYXdhaXQgZmlsZWNhY2hlLmFzc2V0c0NhY2hlLnBhdGhzKCkpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBsYXlvdXRzOiAoYXdhaXQgZmlsZWNhY2hlLmxheW91dHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgcGFydGlhbHM6IChhd2FpdCBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5wYXRocygpKS5sZW5ndGhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinJMgU2V0dXAgY29tcGxldGVkIGluICR7c2V0dXBUaW1lIC0gc3RhcnRUaW1lfW1zYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBEb2N1bWVudHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5kb2N1bWVudHN9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBBc3NldHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5hc3NldHN9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBMYXlvdXRzOiAke2NvdW50c0FmdGVyU2V0dXAubGF5b3V0c31gKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIFBhcnRpYWxzOiAke2NvdW50c0FmdGVyU2V0dXAucGFydGlhbHN9YCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFdhaXQgc3BlY2lmaWVkIGRlbGF5IHRvIHNlZSBpZiBhbnkgYWRkaXRpb25hbCBmaWxlcyBhcHBlYXJcbiAgICAgICAgICAgIGNvbnN0IGRlbGF5TXMgPSBwYXJzZUludChjbWRPYmouZGVsYXkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFxcbldhaXRpbmcgJHtkZWxheU1zfW1zIHRvIGNoZWNrIGZvciBsYXRlIGFkZGl0aW9ucy4uLmApO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGRlbGF5TXMpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgY291bnRzQWZ0ZXJEZWxheSA9IHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudHM6IChhd2FpdCBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGFzc2V0czogKGF3YWl0IGZpbGVjYWNoZS5hc3NldHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgbGF5b3V0czogKGF3YWl0IGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHBhcnRpYWxzOiAoYXdhaXQgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUucGF0aHMoKSkubGVuZ3RoXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDb21wYXJlIGNvdW50c1xuICAgICAgICAgICAgbGV0IGlzc3VlRGV0ZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrQ2FjaGUgPSAobmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmVmb3JlID0gY291bnRzQWZ0ZXJTZXR1cFtuYW1lXTtcbiAgICAgICAgICAgICAgICBjb25zdCBhZnRlciA9IGNvdW50c0FmdGVyRGVsYXlbbmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKGJlZm9yZSAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgXFxu4p2MIElTU1VFIERFVEVDVEVEOiAke25hbWV9IGNvdW50IGNoYW5nZWQgZnJvbSAke2JlZm9yZX0gdG8gJHthZnRlcn1gKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgICAgVGhpcyBpbmRpY2F0ZXMgZmlsZXMgd2VyZSBhZGRlZCBhZnRlciBpc1JlYWR5IWApO1xuICAgICAgICAgICAgICAgICAgICBpc3N1ZURldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbWRPYmoudmVyYm9zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOKckyAke25hbWV9OiAke2JlZm9yZX0gZmlsZXMgKHN0YWJsZSlgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXFxuUmVzdWx0czonKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY3NPayA9IGNoZWNrQ2FjaGUoJ2RvY3VtZW50cycpO1xuICAgICAgICAgICAgY29uc3QgYXNzZXRzT2sgPSBjaGVja0NhY2hlKCdhc3NldHMnKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dHNPayA9IGNoZWNrQ2FjaGUoJ2xheW91dHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxzT2sgPSBjaGVja0NhY2hlKCdwYXJ0aWFscycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIWlzc3VlRGV0ZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnXFxu4pyFIFNVQ0NFU1M6IE5vIGZpbGVzIGFkZGVkIGFmdGVyIGlzUmVhZHkuIFRpbWluZyBpcyBjb3JyZWN0LicpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcXG5BbGwgY2FjaGVzIGFyZSBzdGFibGU6Jyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIERvY3VtZW50czogJHtjb3VudHNBZnRlclNldHVwLmRvY3VtZW50c30gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMgQXNzZXRzOiAke2NvdW50c0FmdGVyU2V0dXAuYXNzZXRzfSBmaWxlc2ApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyBMYXlvdXRzOiAke2NvdW50c0FmdGVyU2V0dXAubGF5b3V0c30gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMgUGFydGlhbHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5wYXJ0aWFsc30gZmlsZXNgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignXFxu4pqg77iPICBGQUlMVVJFOiBGaWxlcyB3ZXJlIGFkZGVkIGFmdGVyIGlzUmVhZHkgdHJpZ2dlcmVkIScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyAgIFRoaXMgaW5kaWNhdGVzIGEgcmFjZSBjb25kaXRpb24gdGhhdCBuZWVkcyB0byBiZSBmaXhlZC4nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdcXG4gICBQbGVhc2UgcmVwb3J0IHRoaXMgaXNzdWUgYXQ6Jyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignICAgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaXNzdWVEZXRlY3RlZCkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgY2hlY2stcmVhZHkgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtLnBhcnNlKHByb2Nlc3MuYXJndik7XG4iXX0=