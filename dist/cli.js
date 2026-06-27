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
import * as YAML from 'js-yaml';
import { refactorTag } from './refactor-tags.js';
import { SitemapValidator } from './sitemap-validator.js';
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
    if (result.skipped) {
        return `
SKIPPED ${result.renderFormat} ${result.vpath} ==> ${result.renderPath} (output up-to-date)`;
    }
    return `
${result.renderFormat} ${result.vpath} ==> ${result.renderPath}
FIRST ${result.renderFirstElapsed} LAYOUT ${result.renderLayoutElapsed} MAHA ${result.renderMahaElapsed} TOTAL ${result.renderTotalElapsed}`;
}
program
    .command('render-document <configFN> <documentFN>')
    .description('Render a document into output directory')
    .option('--perf-data-dir <dataDir>', 'Directory for output of Mahabhuta performance measurements')
    .action(async (configFN, documentFN, cmdObj) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        if (typeof cmdObj?.perfDataDir === 'string') {
            config.perfDataDir = cmdObj.perfDataDir;
        }
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
    .option('--force-render-all', 'Re-render every document, ignoring output file timestamps')
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
        let results = await akasha.render2(config, {
            forceRenderAll: cmdObj.forceRenderAll === true
        });
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
program
    .command('validate-sitemap <configFN>')
    .description('Validate sitemap XML file against rendered output directory')
    .option('--sitemap <filename>', 'Sitemap filename relative to output directory', 'sitemap.xml')
    .option('--strict', 'Exit with error code if validation fails', false)
    .option('--json', 'Output results as JSON', false)
    .action(async (configFN, cmdObj) => {
    try {
        const config = (await import(path.join(process.cwd(), configFN))).default;
        const validator = new SitemapValidator(config, cmdObj.sitemap);
        const result = await validator.validate();
        if (cmdObj.json) {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            console.log(SitemapValidator.formatReport(result));
        }
        if (cmdObj.strict && (result.invalidEntries > 0 || result.errors.length > 0)) {
            process.exit(1);
        }
    }
    catch (e) {
        console.error(`validate-sitemap command ERRORED ${e.stack}`);
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUgsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLE9BQU8sTUFBTSxVQUFVLENBQUM7QUFDL0IsT0FBTyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ3pCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxLQUFLLElBQUksTUFBTSxTQUFTLENBQUM7QUFFaEMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBSTFELE9BQU8sQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDO0FBQy9CLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFekIsT0FBTztLQUNGLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQztLQUNqQyxXQUFXLENBQUMsbUNBQW1DLENBQUM7S0FDaEQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUN2QixJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FDckMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNYLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDM0IsTUFBTSxNQUFNLENBQUMsS0FB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QUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakQsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxHQUFHLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQzNFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEIsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDN0QsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFUCxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgcHJvZ3JhbSB9IGZyb20gJ2NvbW1hbmRlcic7XG5pbXBvcnQgZ2hwYWdlcyBmcm9tICdnaC1wYWdlcyc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0ICogYXMgZGF0YSBmcm9tICcuL2RhdGEuanMnO1xuaW1wb3J0ICogYXMgWUFNTCBmcm9tICdqcy15YW1sJztcbmltcG9ydCB7IFJlbmRlcmluZ1Jlc3VsdHMgfSBmcm9tICcuL3JlbmRlci5qcyc7XG5pbXBvcnQgeyByZWZhY3RvclRhZyB9IGZyb20gJy4vcmVmYWN0b3ItdGFncy5qcyc7XG5pbXBvcnQgeyBTaXRlbWFwVmFsaWRhdG9yIH0gZnJvbSAnLi9zaXRlbWFwLXZhbGlkYXRvci5qcyc7XG5cblxuXG5wcm9jZXNzLnRpdGxlID0gJ2FrYXNoYXJlbmRlcic7XG5wcm9ncmFtLnZlcnNpb24oJzAuOS41Jyk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY29weS1hc3NldHMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdDb3B5IGFzc2V0cyBpbnRvIG91dHB1dCBkaXJlY3RvcnknKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgYXdhaXQgY29uZmlnLmNvcHlBc3NldHMoKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb3B5LWFzc2V0cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2N1bWVudCA8Y29uZmlnRk4+IDxkb2N1bWVudEZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGEgZG9jdW1lbnQnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBkb2N1bWVudEZOKSA9PiB7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2N1bWVudHMgPSBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZG9jdW1lbnRGTik7XG4gICAgICAgICAgICAvLyBkYXRhOiAke2RvYy5kYXRhfVxuICAgICAgICAgICAgLy8gdGV4dDogJHtkb2MudGV4dH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcbmRvY3BhdGg6ICR7ZG9jLnZwYXRofVxuZnNwYXRoOiAke2RvYy5mc3BhdGh9XG5yZW5kZXJlcjogJHt1dGlsLmluc3BlY3QoY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZG9jLnZwYXRoKSl9XG5yZW5kZXJwYXRoOiAke2RvYy5yZW5kZXJQYXRofVxubW91bnRlZDogJHtkb2MubW91bnRlZH1cbm1vdW50UG9pbnQ6ICR7ZG9jLm1vdW50UG9pbnR9XG5cbm1ldGFkYXRhOiAke3V0aWwuaW5zcGVjdChkb2MubWV0YWRhdGEpfVxuXG5gKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbmZ1bmN0aW9uIGZvcm1hdFJlc3VsdChyZXN1bHQ6IFJlbmRlcmluZ1Jlc3VsdHMpIHtcbiAgICBpZiAocmVzdWx0LnNraXBwZWQpIHtcbiAgICAgICAgcmV0dXJuIGBcblNLSVBQRUQgJHtyZXN1bHQucmVuZGVyRm9ybWF0fSAke3Jlc3VsdC52cGF0aH0gPT0+ICR7cmVzdWx0LnJlbmRlclBhdGh9IChvdXRwdXQgdXAtdG8tZGF0ZSlgO1xuICAgIH1cbiAgICByZXR1cm4gYFxuJHtyZXN1bHQucmVuZGVyRm9ybWF0fSAke3Jlc3VsdC52cGF0aH0gPT0+ICR7cmVzdWx0LnJlbmRlclBhdGh9XG5GSVJTVCAke3Jlc3VsdC5yZW5kZXJGaXJzdEVsYXBzZWR9IExBWU9VVCAke3Jlc3VsdC5yZW5kZXJMYXlvdXRFbGFwc2VkfSBNQUhBICR7cmVzdWx0LnJlbmRlck1haGFFbGFwc2VkfSBUT1RBTCAke3Jlc3VsdC5yZW5kZXJUb3RhbEVsYXBzZWR9YDtcbn1cblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdyZW5kZXItZG9jdW1lbnQgPGNvbmZpZ0ZOPiA8ZG9jdW1lbnRGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUmVuZGVyIGEgZG9jdW1lbnQgaW50byBvdXRwdXQgZGlyZWN0b3J5JylcbiAgICAub3B0aW9uKCctLXBlcmYtZGF0YS1kaXIgPGRhdGFEaXI+JywgJ0RpcmVjdG9yeSBmb3Igb3V0cHV0IG9mIE1haGFiaHV0YSBwZXJmb3JtYW5jZSBtZWFzdXJlbWVudHMnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBkb2N1bWVudEZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY21kT2JqPy5wZXJmRGF0YURpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjb25maWcucGVyZkRhdGFEaXIgPSBjbWRPYmoucGVyZkRhdGFEaXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgYXdhaXQgZGF0YS5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXItZG9jdW1lbnQgYmVmb3JlIHJlbmRlclBhdGggJHtkb2N1bWVudEZOfWApO1xuICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IGFrYXNoYS5yZW5kZXJQYXRoMihjb25maWcsIGRvY3VtZW50Rk4pO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGZvcm1hdFJlc3VsdChyZXN1bHQpKTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdC5lcnJvcnMpXG4gICAgICAgICAgICAgICAgJiYgcmVzdWx0LmVycm9ycy5sZW5ndGggPj0gMVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBlcnJvciBvZiByZXN1bHQuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcmVuZGVyLWRvY3VtZW50IGNvbW1hbmQgRVJST1JFRGAsIGUpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncmVuZGVyIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUmVuZGVyIGEgc2l0ZSBpbnRvIG91dHB1dCBkaXJlY3RvcnknKVxuICAgIC5vcHRpb24oJy0tcXVpZXQnLCAnRG8gbm90IHByaW50IHRoZSByZW5kZXJpbmcgcmVwb3J0JylcbiAgICAub3B0aW9uKCctLWNvcHktYXNzZXRzJywgJ0ZpcnN0LCBjb3B5IHRoZSBhc3NldHMnKVxuICAgIC5vcHRpb24oJy0tcmVzdWx0cy10byA8cmVzdWx0RmlsZT4nLCAnU3RvcmUgdGhlIHJlc3VsdHMgaW50byB0aGUgbmFtZWQgZmlsZScpXG4gICAgLm9wdGlvbignLS1wZXJmcmVzdWx0cyA8cGVyZlJlc3VsdHNGaWxlPicsICdTdG9yZSB0aGUgdGltZSB0byByZW5kZXIgZWFjaCBkb2N1bWVudCcpXG4gICAgLm9wdGlvbignLS1mb3JjZS1yZW5kZXItYWxsJywgJ1JlLXJlbmRlciBldmVyeSBkb2N1bWVudCwgaWdub3Jpbmcgb3V0cHV0IGZpbGUgdGltZXN0YW1wcycpXG4gICAgLm9wdGlvbignLS1jYWNoaW5nLXRpbWVvdXQgPHRpbWVvdXQ+JywgJ1RoZSB0aW1lLCBpbiBtaWxpc2Vjb25kcywgdG8gaG9ub3IgZW50cmllcyBpbiB0aGUgc2VhcmNoIGNhY2hlJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBhd2FpdCBkYXRhLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5jb3B5QXNzZXRzKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY29uZmlnLmNvcHlBc3NldHMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgY21kT2JqLmNhY2hpbmdUaW1lb3V0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5zZXRDYWNoaW5nVGltZW91dChcbiAgICAgICAgICAgICAgICAgICAgTnVtYmVyLnBhcnNlSW50KGNtZE9iai5jYWNoaW5nVGltZW91dClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHJlc3VsdHMgPSA8UmVuZGVyaW5nUmVzdWx0c1tdPiBhd2FpdCBha2FzaGEucmVuZGVyMihjb25maWcsIHtcbiAgICAgICAgICAgICAgICBmb3JjZVJlbmRlckFsbDogY21kT2JqLmZvcmNlUmVuZGVyQWxsID09PSB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghY21kT2JqLnF1aWV0KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcmVzdWx0IG9mIHJlc3VsdHMpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIC0tLSBpZiBBS0FTSEFSRU5ERVJfVFJBQ0VfUkVOREVSIHRoZW4gb3V0cHV0IHRyYWNpbmcgZGF0YVxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIC0tLSBhbHNvIHNldCBwcm9jZXNzLmVudi5HTE9CRlNfVFJBQ0U9MVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZm9ybWF0UmVzdWx0KHJlc3VsdCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQuZXJyb3JzKVxuICAgICAgICAgICAgICAgICAgICAgJiYgcmVzdWx0LmVycm9ycy5sZW5ndGggPj0gMVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZXJyb3Igb2YgcmVzdWx0LmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVzdWx0c1RvKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0cHV0ID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oY21kT2JqLnJlc3VsdHNUbyk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LndyaXRlKGZvcm1hdFJlc3VsdChyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0LmVycm9ycylcbiAgICAgICAgICAgICAgICAgICAgICYmIHJlc3VsdC5lcnJvcnMubGVuZ3RoID49IDFcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQud3JpdGUoZXJyb3Iuc3RhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG91dHB1dC5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5wZXJmcmVzdWx0cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcG9ydHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcG9ydDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWRQYXRoPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lPzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3Q/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmQ/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWhhYmh1dGE/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlZD86IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgfSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkUGF0aDogcmVzdWx0LnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiByZXN1bHQucmVuZGVyRm9ybWF0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogcmVzdWx0LnJlbmRlclN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3Q6IHJlc3VsdC5yZW5kZXJGaXJzdEVsYXBzZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmQ6IHJlc3VsdC5yZW5kZXJMYXlvdXRFbGFwc2VkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFoYWJodXRhOiByZXN1bHQucmVuZGVyTWFoYUVsYXBzZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlZDogcmVzdWx0LnJlbmRlclRvdGFsRWxhcHNlZFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRzLnB1c2gocmVwb3J0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnNwLndyaXRlRmlsZShjbWRPYmoucGVyZnJlc3VsdHMsXG4gICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShyZXBvcnRzLCB1bmRlZmluZWQsIDQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3V0Zi04Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcmVuZGVyIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdnaC1wYWdlcy1wdWJsaXNoIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUHVibGlzaCBhIHNpdGUgdXNpbmcgR2l0aHViIFBhZ2VzLiAgVGFrZXMgdGhlIHJlbmRlcmluZyBkZXN0aW5hdGlvbiwgYWRkcyBpdCBpbnRvIGEgYnJhbmNoLCBhbmQgcHVzaGVzIHRoYXQgdG8gR2l0aHViJylcbiAgICAub3B0aW9uKCctYiwgLS1icmFuY2ggPGJyYW5jaE5hbWU+JywgJ1RoZSBicmFuY2ggdG8gdXNlIGZvciBwdWJsaXNoaW5nIHRvIEdpdGh1YicpXG4gICAgLm9wdGlvbignLXIsIC0tcmVwbyA8cmVwb1VSTD4nLCAnVGhlIHJlcG9zaXRvcnkgVVJMIHRvIHVzZSBpZiBpdCBtdXN0IGRpZmZlciBmcm9tIHRoZSBVUkwgb2YgdGhlIGxvY2FsIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1yZW1vdGUgPHJlbW90ZU5hbWU+JywgJ1RoZSBHaXQgcmVtb3RlIG5hbWUgdG8gdXNlIGlmIGl0IG11c3QgZGlmZmVyIGZyb20gXCJvcmlnaW5cIicpXG4gICAgLm9wdGlvbignLS10YWcgPHRhZz4nLCAnQW55IHRhZyB0byBhZGQgd2hlbiBwdXNoaW5nIHRvIEdpdGh1YicpXG4gICAgLm9wdGlvbignLS1tZXNzYWdlIDxtZXNzYWdlPicsICdBbnkgR2l0IGNvbW1pdCBtZXNzYWdlJylcbiAgICAub3B0aW9uKCctLXVzZXJuYW1lIDx1c2VybmFtZT4nLCAnR2l0aHViIHVzZXIgbmFtZSB0byB1c2UnKVxuICAgIC5vcHRpb24oJy0tZW1haWwgPGVtYWlsPicsICdHaXRodWIgdXNlciBlbWFpbCB0byB1c2UnKVxuICAgIC5vcHRpb24oJy0tbm9wdXNoJywgJ0RvIG5vdCBwdXNoIHRvIEdpdGh1Yiwgb25seSBjb21taXQnKVxuICAgIC5vcHRpb24oJy0tY25hbWUgPGRvbWFpbj4nLCAnV3JpdGUgb3V0IGEgQ05BTUUgZmlsZSB3aXRoIHRoZSBkb21haW4gbmFtZScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcblxuICAgICAgICAgICAgbGV0IG9wdGlvbnM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICBkb3RmaWxlczogdHJ1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChjbWRPYmouYnJhbmNoKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5icmFuY2ggPSBjbWRPYmouYnJhbmNoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5yZXBvVVJMKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5yZXBvID0gY21kT2JqLnJlcG9VUkw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlbW90ZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVtb3RlID0gY21kT2JqLnJlbW90ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmouY25hbWUpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNuYW1lID0gY21kT2JqLmNuYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai50YWcpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRhZyA9IGNtZE9iai50YWc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLm1lc3NhZ2UgPSBjbWRPYmoubWVzc2FnZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoudXNlcm5hbWUgfHwgY21kT2JqLmVtYWlsKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51c2VyID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51c2VyLm5hbWUgPSBjbWRPYmoudXNlcm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLmVtYWlsKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51c2VyLmVtYWlsID0gY21kT2JqLmVtYWlsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5ub3B1c2gpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnB1c2ggPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0aW9ucy5ub2pla3lsbCA9IHRydWU7XG4gICAgICAgICAgICBvcHRpb25zLmRvdGZpbGVzID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGdoLXBhZ2VzLXB1Ymxpc2ggb3B0aW9ucyAke2NvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbn0gY21kT2JqICR7dXRpbC5pbnNwZWN0KGNtZE9iail9IG9wdGlvbnMgJHt1dGlsLmluc3BlY3Qob3B0aW9ucyl9YCk7XG5cbiAgICAgICAgICAgIGdocGFnZXMucHVibGlzaChjb25maWcucmVuZGVyRGVzdGluYXRpb24sIG9wdGlvbnMsIGZ1bmN0aW9uKGVycikge1xuXG4gICAgICAgICAgICAgICAgaWYgKGVycikgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIGVsc2UgY29uc29sZS5sb2coJ09LJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZ2gtcGFnZXMtcHVibGlzaCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdjb25maWcgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdQcmludCBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb25maWcgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BsdWdpbnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBwbHVnaW5zJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5wbHVnaW5zKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb25maWcgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY2RpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcuZG9jdW1lbnREaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdhc3NldGRpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBhc3NldHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcuYXNzZXREaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldGRpcnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BhcnRpYWxkaXJzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgcGFydGlhbHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcucGFydGlhbHNEaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsZGlycyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnbGF5b3V0c2RpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBsYXlvdXRzIGRpcmVjdG9yaWVzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLmxheW91dERpcnMpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGxheW91dHNkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3VtZW50cyA8Y29uZmlnRk4+IFtyb290UGF0aF0nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnRzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcm9vdFBhdGgpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUucGF0aHMocm9vdFBhdGgpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudHMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3Mtc2V0LWRhdGVzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2V0IHRoZSBhVGltZSBhbmQgbVRpbWUgZm9yIGRvY3VtZW50cyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2V0VGltZXMoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy1zZXQtZGF0ZXMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY2luZm8gPGNvbmZpZ0ZOPiA8ZG9jRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBkb2N1bWVudCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGRvY0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5maW5kKGRvY0ZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBkb2NGTiAke2RvY0ZOfSBgLCBkb2NpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdpbmRleC1maWxlcyA8Y29uZmlnRk4+IFtyb290UGF0aF0nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgaW5kZXggcGFnZXMgKGluZGV4Lmh0bWwpIHVuZGVyIHRoZSBnaXZlbiBkaXJlY3RvcnknKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCByb290UGF0aCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgZG9jaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuaW5kZXhGaWxlcyhyb290UGF0aCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgaW5kZXhlcyAke3Jvb3RQYXRofSBgLCBkb2NpbmZvLm1hcChpbmRleCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGluZGV4LnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBpbmRleC5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBpbmRleC5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmRleC5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBkaXJuYW1lOiBpbmRleC5kaXJuYW1lXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluZGV4LWZpbGVzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdpbmRleC1jaGFpbiA8Y29uZmlnRk4+IHN0YXJ0UGF0aCcpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBpbmRleCBjaGFpbiBzdGFydGluZyBmcm9tIHRoZSBwYXRoJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgc3RhcnRQYXRoKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5pbmRleENoYWluKHN0YXJ0UGF0aCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgaW5kZXggY2hhaW4gJHtzdGFydFBhdGh9IGAsIGRvY2luZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluZGV4LWNoYWluIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdzaWJsaW5ncyA8Y29uZmlnRk4+IDx2cGF0aD4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgc2libGluZyBwYWdlcyB0byB0aGUgbmFtZWQgZG9jdW1lbnQnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCB2cGF0aCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgZG9jaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2libGluZ3ModnBhdGgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYHNpYmxpbmdzICR7dnBhdGh9IGAsIGRvY2luZm8ubWFwKGluZGV4ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogaW5kZXgudnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZGV4LnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZGV4Lm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZGV4LnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIGRpcm5hbWU6IGluZGV4LmRpcm5hbWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc2libGluZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3Mtc2VtYW50aWMgPGNvbmZpZ0ZOPiA8c2VhcmNoRm9yPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudCB2cGF0aHMgc2VtYW50aWNhbGx5IG1hdGNoaW5nIHRoZSBzdHJpbmcnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBzZWFyY2hGb3IpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2VtYW50aWNTZWFyY2hEb2NzKHNlYXJjaEZvcikpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3Mtc2VtYW50aWMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3RhZ3MgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSB0YWdzJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnRhZ3MoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHRhZ3MgfSwgeyBpbmRlbnQ6IDQgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHRhZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3NpbWlsYXItdGFncyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0ZpbmQgZ3JvdXBzIG9mIHNpbWlsYXIgdGFncycpXG4gICAgLm9wdGlvbignLS10aHJlc2hvbGQgPG4+JywgJ0xldmVuc2h0ZWluIGRpc3RhbmNlIHRocmVzaG9sZCcsICcyJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgdGhyZXNob2xkID0gcGFyc2VJbnQoY21kT2JqLnRocmVzaG9sZCwgMTApO1xuICAgICAgICAgICAgY29uc3QgZ3JvdXBzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5maW5kU2ltaWxhclRhZ3ModGhyZXNob2xkKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHNpbWlsYXJUYWdHcm91cHM6IGdyb3VwcyB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc2ltaWxhci10YWdzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCd0YWdzLXdpdGhvdXQtZGVzY3JpcHRpb25zIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0YWdzIHRoYXQgaGF2ZSBubyBkZXNjcmlwdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCB0YWdzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS50YWdzV2l0aG91dERlc2NyaXB0aW9ucygpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coWUFNTC5kdW1wKHsgdGFnc1dpdGhvdXREZXNjcmlwdGlvbnM6IHRhZ3MgfSwgeyBpbmRlbnQ6IDQgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHRhZ3Mtd2l0aG91dC1kZXNjcmlwdGlvbnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3VudXNlZC10YWctZGVzY3JpcHRpb25zIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0YWcgZGVzY3JpcHRpb25zIHRoYXQgYXJlIG5vdCB1c2VkIGJ5IGFueSBkb2N1bWVudCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCB0YWdzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS51bnVzZWRUYWdEZXNjcmlwdGlvbnMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHVudXNlZFRhZ0Rlc2NyaXB0aW9uczogdGFncyB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdW51c2VkLXRhZy1kZXNjcmlwdGlvbnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3JlZmFjdG9yLXRhZyA8Y29uZmlnRk4+IDxvbGRUYWc+IDxuZXdUYWc+JylcbiAgICAuZGVzY3JpcHRpb24oJ1JlbmFtZSBhIHRhZyBhY3Jvc3MgYWxsIGRvY3VtZW50cycpXG4gICAgLm9wdGlvbignLS1kcnktcnVuJywgJ0xpc3QgY2hhbmdlcyB3aXRob3V0IG1vZGlmeWluZyBmaWxlcycsIGZhbHNlKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBvbGRUYWcsIG5ld1RhZywgY21kT2JqKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVmYWN0b3JUYWcoY29uZmlnLCBvbGRUYWcsIG5ld1RhZywge1xuICAgICAgICAgICAgICAgIGRyeVJ1bjogY21kT2JqLmRyeVJ1blxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhZQU1MLmR1bXAoeyByZWZhY3RvclJlc3VsdDogcmVzdWx0IH0sIHsgaW5kZW50OiA0IH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByZWZhY3Rvci10YWcgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3Mtd2l0aC10YWcgPGNvbmZpZ0ZOPiA8dGFncy4uLj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnQgdnBhdGhzIGZvciBnaXZlbiB0YWdzJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgdGFncykgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGVcbiAgICAgICAgICAgICAgICAuZG9jdW1lbnRzQ2FjaGUuZG9jdW1lbnRzV2l0aFRhZyh0YWdzKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2NoaWxkLWl0ZW0tdHJlZSA8Y29uZmlnRk4+IDxyb290UGF0aD4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnRzIHVuZGVyIGEgZ2l2ZW4gbG9jYXRpb24gYnkgdHJlZScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHJvb3RQYXRoKSA9PiB7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICBZQU1MLmR1bXAoe1xuICAgICAgICAgICAgICAgICAgICB0cmVlOiBhd2FpdCBha2FzaGEuZmlsZWNhY2hlXG4gICAgICAgICAgICAgICAgICAgICAgICAuZG9jdW1lbnRzQ2FjaGUuY2hpbGRJdGVtVHJlZShyb290UGF0aClcbiAgICAgICAgICAgICAgICB9LCB7IGluZGVudDogNCB9KVxuICAgICAgICAgICAgICAgIC8vIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3NlYXJjaCA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1NlYXJjaCBmb3IgZG9jdW1lbnRzJylcbiAgICAub3B0aW9uKCctLXJvb3QgPHJvb3RQYXRoPicsICdTZWxlY3Qgb25seSBmaWxlcyB3aXRoaW4gdGhlIG5hbWVkIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1tYXRjaCA8cGF0aG1hdGNoPicsICdTZWxlY3Qgb25seSBmaWxlcyBtYXRjaGluZyB0aGUgcmVndWxhciBleHByZXNzaW9uJylcbiAgICAub3B0aW9uKCctLXJlbmRlcm1hdGNoIDxyZW5kZXJwYXRobWF0Y2g+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSByZWd1bGFyIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tZ2xvYiA8Z2xvYm1hdGNoPicsICdTZWxlY3Qgb25seSBmaWxlcyBtYXRjaGluZyB0aGUgZ2xvYiBleHByZXNzaW9uJylcbiAgICAub3B0aW9uKCctLXJlbmRlcmdsb2IgPGdsb2JtYXRjaD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgcmVuZGVyaW5nIHRvIHRoZSBnbG9iIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tbGF5b3V0IDxsYXlvdXQ+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSBsYXlvdXRzJylcbiAgICAub3B0aW9uKCctLW1pbWUgPG1pbWU+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSBNSU1FIHR5cGUnKVxuICAgIC5vcHRpb24oJy0tdGFnIDx0YWc+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIHdpdGggdGhlIHRhZycpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coY21kT2JqKTtcbiAgICAgICAgICAgIGxldCBvcHRpb25zOiBhbnkgPSB7IH07XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJvb3QpIG9wdGlvbnMucm9vdFBhdGggPSBjbWRPYmoucm9vdDtcbiAgICAgICAgICAgIGlmIChjbWRPYmoubWF0Y2gpIG9wdGlvbnMucGF0aG1hdGNoID0gY21kT2JqLm1hdGNoO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5yZW5kZXJtYXRjaCkgb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggPSBjbWRPYmoucmVuZGVybWF0Y2g7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmdsb2IpIG9wdGlvbnMuZ2xvYiA9IGNtZE9iai5nbG9iO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5yZW5kZXJnbG9iKSBvcHRpb25zLnJlbmRlcmdsb2IgPSBjbWRPYmoucmVuZGVyZ2xvYjtcbiAgICAgICAgICAgIGlmIChjbWRPYmoubGF5b3V0KSBvcHRpb25zLmxheW91dHMgPSBbIGNtZE9iai5sYXlvdXQgXTtcbiAgICAgICAgICAgIGlmIChjbWRPYmoubWltZSkgb3B0aW9ucy5taW1lID0gY21kT2JqLm1pbWU7XG4gICAgICAgICAgICBpZiAoY21kT2JqLnRhZykgb3B0aW9ucy50YWcgPSBjbWRPYmoudGFnO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cob3B0aW9ucyk7XG4gICAgICAgICAgICBsZXQgZG9jcyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2VhcmNoKG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZG9jc1xuICAgICAgICAgICAgLy8gLm1hcChkb2MgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHZwYXRoOiBkb2MudnBhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGRvYy5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgLy8gICAgICAgICBkaXJuYW1lOiBkb2MuZGlybmFtZVxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgICAvLyAuc29ydCgoYTogYW55LCBiOiBhbnkpID0+IHtcbiAgICAgICAgICAgIC8vICAgICB2YXIgdGFnQSA9IGEuZGlybmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgLy8gICAgIHZhciB0YWdCID0gYi5kaXJuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAvLyAgICAgaWYgKHRhZ0EgPCB0YWdCKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAvLyAgICAgaWYgKHRhZ0EgPiB0YWdCKSByZXR1cm4gMTtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgICAvLyAucmV2ZXJzZSgpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHNlYXJjaCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnYXNzZXRzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgYXNzZXRzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5hc3NldHNDYWNoZS5wYXRocygpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldHMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2Fzc2V0aW5mbyA8Y29uZmlnRk4+IDxkb2NGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2hvdyBpbmZvcm1hdGlvbiBhYm91dCBhbiBhc3NldCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGFzc2V0Rk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0aW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGUuZmluZChhc3NldEZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGFzc2V0aW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdsYXlvdXRzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgbGF5b3V0cyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUubGF5b3V0c0NhY2hlLnBhdGhzKCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGxheW91dHMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4vLyBUT0RPIGJvdGggdGVzdC5odG1sIGFuZCB0ZXN0Lmh0bWwubmprIG1hdGNoXG4vLyAgICAgIFRoaXMgaXMgcHJvYmFibHkgaW5jb3JyZWN0LCBzaW5jZSB3ZSBkbyBub3QgcmVuZGVyIHRoZXNlIGZpbGVzXG4vLyAgICAgIFRoZSBwYXJ0aWFscyBkaXJlY3RvcnkgaGFzIHRoZSBzYW1lIHByb2JsZW1cbi8vICAgICAgU29tZSBraW5kIG9mIGZsYWcgb24gY3JlYXRpbmcgdGhlIEZpbGVDYWNoZSB0byBjaGFuZ2UgdGhlIGJlaGF2aW9yXG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnbGF5b3V0aW5mbyA8Y29uZmlnRk4+IDxkb2NGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2hvdyBpbmZvcm1hdGlvbiBhYm91dCBhIGxheW91dCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGxheW91dEZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXRpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUuZmluZChsYXlvdXRGTik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhsYXlvdXRpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdwYXJ0aWFscyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHBhcnRpYWxzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLnBhdGhzKCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHBhcnRpYWxzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuLy8gVE9ETyBib3RoIHRlc3QuaHRtbCBhbmQgdGVzdC5odG1sLm5qayBtYXRjaFxuLy8gICAgICBUaGlzIGlzIHByb2JhYmx5IGluY29ycmVjdCwgc2luY2Ugd2UgZG8gbm90IHJlbmRlciB0aGVzZSBmaWxlc1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BhcnRpYWxpbmZvIDxjb25maWdGTj4gPGRvY0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGEgcGFydGlhbCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHBhcnRpYWxGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgcGFydGlhbGluZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUuZmluZChwYXJ0aWFsRk4pO1xuICAgICAgICAgICAgY29uc29sZS5sb2cocGFydGlhbGluZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHBhcnRpYWxpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdpbmRleCA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xvYWRzIGNvbmZpZ3VyYXRpb24sIGluZGV4ZXMgY29udGVudCwgdGhlbiBleGl0cycpXG4gICAgLm9wdGlvbignLS12ZXJib3NlJywgJ1Nob3cgZGV0YWlsZWQgZXZlbnQgdHJhY2tpbmcgKGFkZGVkLCByZWFkeSwgZXJyb3IgZXZlbnRzKScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChjbWRPYmoudmVyYm9zZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbmRleGluZyBmaWxlcyB3aXRoIHZlcmJvc2Ugb3V0cHV0Li4uXFxuJyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBFbmFibGUgdmVyYm9zZSBtb2RlIGluIGNvbmZpZ1xuICAgICAgICAgICAgICAgIGNvbmZpZy52ZXJib3NlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBzZXR1cFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsYXBzZWQgPSBzZXR1cFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gR2V0IGZpbGUgY291bnRzXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZWNhY2hlID0gYWthc2hhLmZpbGVjYWNoZTtcbiAgICAgICAgICAgICAgICBjb25zdCBkb2N1bWVudENvdW50ID0gKGF3YWl0IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5wYXRocygpKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRDb3VudCA9IChhd2FpdCBmaWxlY2FjaGUuYXNzZXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dENvdW50ID0gKGF3YWl0IGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxDb3VudCA9IChhd2FpdCBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5wYXRocygpKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOKckyBJbmRleGluZyBjb21wbGV0ZWQgaW4gJHtlbGFwc2VkfW1zXFxuYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz09PSBTdW1tYXJ5ID09PScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBEb2N1bWVudHM6ICR7ZG9jdW1lbnRDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQXNzZXRzOiAke2Fzc2V0Q291bnR9IGZpbGVzYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYExheW91dHM6ICR7bGF5b3V0Q291bnR9IGZpbGVzYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFBhcnRpYWxzOiAke3BhcnRpYWxDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgVG90YWw6ICR7ZG9jdW1lbnRDb3VudCArIGFzc2V0Q291bnQgKyBsYXlvdXRDb3VudCArIHBhcnRpYWxDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gTm9ybWFsIG1vZGUgLSBqdXN0IHNldHVwXG4gICAgICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbmRleCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY2hlY2stcmVhZHkgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdWZXJpZnkgdGhhdCBhbGwgZmlsZXMgYXJlIGxvYWRlZCBiZWZvcmUgaXNSZWFkeSB0cmlnZ2VycyAoZGlhZ25vc3RpYyB0b29sKScpXG4gICAgLm9wdGlvbignLS12ZXJib3NlJywgJ1Nob3cgZGV0YWlsZWQgZmlsZS1ieS1maWxlIHRyYWNraW5nJylcbiAgICAub3B0aW9uKCctLWRlbGF5IDxtcz4nLCAnV2FpdCB0aW1lIGluIG1pbGxpc2Vjb25kcyB0byBjaGVjayBmb3IgbGF0ZSBhZGRpdGlvbnMgKGRlZmF1bHQ6IDIwMDApJywgJzIwMDAnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUnVubmluZyBpc1JlYWR5IHRpbWluZyBjaGVjay4uLlxcbicpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDYXB0dXJlIGluaXRpYWwgc3RhdGVcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHNldHVwVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEdldCBjb3VudHMgaW1tZWRpYXRlbHkgYWZ0ZXIgc2V0dXBcbiAgICAgICAgICAgIGNvbnN0IGZpbGVjYWNoZSA9IGFrYXNoYS5maWxlY2FjaGU7XG4gICAgICAgICAgICBjb25zdCBjb3VudHNBZnRlclNldHVwID0ge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50czogKGF3YWl0IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYXNzZXRzOiAoYXdhaXQgZmlsZWNhY2hlLmFzc2V0c0NhY2hlLnBhdGhzKCkpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBsYXlvdXRzOiAoYXdhaXQgZmlsZWNhY2hlLmxheW91dHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgcGFydGlhbHM6IChhd2FpdCBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5wYXRocygpKS5sZW5ndGhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinJMgU2V0dXAgY29tcGxldGVkIGluICR7c2V0dXBUaW1lIC0gc3RhcnRUaW1lfW1zYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBEb2N1bWVudHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5kb2N1bWVudHN9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBBc3NldHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5hc3NldHN9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBMYXlvdXRzOiAke2NvdW50c0FmdGVyU2V0dXAubGF5b3V0c31gKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIFBhcnRpYWxzOiAke2NvdW50c0FmdGVyU2V0dXAucGFydGlhbHN9YCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFdhaXQgc3BlY2lmaWVkIGRlbGF5IHRvIHNlZSBpZiBhbnkgYWRkaXRpb25hbCBmaWxlcyBhcHBlYXJcbiAgICAgICAgICAgIGNvbnN0IGRlbGF5TXMgPSBwYXJzZUludChjbWRPYmouZGVsYXkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFxcbldhaXRpbmcgJHtkZWxheU1zfW1zIHRvIGNoZWNrIGZvciBsYXRlIGFkZGl0aW9ucy4uLmApO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGRlbGF5TXMpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgY291bnRzQWZ0ZXJEZWxheSA9IHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudHM6IChhd2FpdCBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGFzc2V0czogKGF3YWl0IGZpbGVjYWNoZS5hc3NldHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgbGF5b3V0czogKGF3YWl0IGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHBhcnRpYWxzOiAoYXdhaXQgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUucGF0aHMoKSkubGVuZ3RoXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDb21wYXJlIGNvdW50c1xuICAgICAgICAgICAgbGV0IGlzc3VlRGV0ZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrQ2FjaGUgPSAobmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmVmb3JlID0gY291bnRzQWZ0ZXJTZXR1cFtuYW1lXTtcbiAgICAgICAgICAgICAgICBjb25zdCBhZnRlciA9IGNvdW50c0FmdGVyRGVsYXlbbmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKGJlZm9yZSAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgXFxu4p2MIElTU1VFIERFVEVDVEVEOiAke25hbWV9IGNvdW50IGNoYW5nZWQgZnJvbSAke2JlZm9yZX0gdG8gJHthZnRlcn1gKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgICAgVGhpcyBpbmRpY2F0ZXMgZmlsZXMgd2VyZSBhZGRlZCBhZnRlciBpc1JlYWR5IWApO1xuICAgICAgICAgICAgICAgICAgICBpc3N1ZURldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbWRPYmoudmVyYm9zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOKckyAke25hbWV9OiAke2JlZm9yZX0gZmlsZXMgKHN0YWJsZSlgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXFxuUmVzdWx0czonKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY3NPayA9IGNoZWNrQ2FjaGUoJ2RvY3VtZW50cycpO1xuICAgICAgICAgICAgY29uc3QgYXNzZXRzT2sgPSBjaGVja0NhY2hlKCdhc3NldHMnKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dHNPayA9IGNoZWNrQ2FjaGUoJ2xheW91dHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxzT2sgPSBjaGVja0NhY2hlKCdwYXJ0aWFscycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIWlzc3VlRGV0ZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnXFxu4pyFIFNVQ0NFU1M6IE5vIGZpbGVzIGFkZGVkIGFmdGVyIGlzUmVhZHkuIFRpbWluZyBpcyBjb3JyZWN0LicpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcXG5BbGwgY2FjaGVzIGFyZSBzdGFibGU6Jyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIERvY3VtZW50czogJHtjb3VudHNBZnRlclNldHVwLmRvY3VtZW50c30gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMgQXNzZXRzOiAke2NvdW50c0FmdGVyU2V0dXAuYXNzZXRzfSBmaWxlc2ApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyBMYXlvdXRzOiAke2NvdW50c0FmdGVyU2V0dXAubGF5b3V0c30gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMgUGFydGlhbHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5wYXJ0aWFsc30gZmlsZXNgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignXFxu4pqg77iPICBGQUlMVVJFOiBGaWxlcyB3ZXJlIGFkZGVkIGFmdGVyIGlzUmVhZHkgdHJpZ2dlcmVkIScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyAgIFRoaXMgaW5kaWNhdGVzIGEgcmFjZSBjb25kaXRpb24gdGhhdCBuZWVkcyB0byBiZSBmaXhlZC4nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdcXG4gICBQbGVhc2UgcmVwb3J0IHRoaXMgaXNzdWUgYXQ6Jyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignICAgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaXNzdWVEZXRlY3RlZCkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgY2hlY2stcmVhZHkgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3ZhbGlkYXRlLXNpdGVtYXAgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdWYWxpZGF0ZSBzaXRlbWFwIFhNTCBmaWxlIGFnYWluc3QgcmVuZGVyZWQgb3V0cHV0IGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1zaXRlbWFwIDxmaWxlbmFtZT4nLCAnU2l0ZW1hcCBmaWxlbmFtZSByZWxhdGl2ZSB0byBvdXRwdXQgZGlyZWN0b3J5JywgJ3NpdGVtYXAueG1sJylcbiAgICAub3B0aW9uKCctLXN0cmljdCcsICdFeGl0IHdpdGggZXJyb3IgY29kZSBpZiB2YWxpZGF0aW9uIGZhaWxzJywgZmFsc2UpXG4gICAgLm9wdGlvbignLS1qc29uJywgJ091dHB1dCByZXN1bHRzIGFzIEpTT04nLCBmYWxzZSlcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkYXRvciA9IG5ldyBTaXRlbWFwVmFsaWRhdG9yKGNvbmZpZywgY21kT2JqLnNpdGVtYXApO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdmFsaWRhdG9yLnZhbGlkYXRlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChjbWRPYmouanNvbikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3VsdCwgbnVsbCwgMikpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhTaXRlbWFwVmFsaWRhdG9yLmZvcm1hdFJlcG9ydChyZXN1bHQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNtZE9iai5zdHJpY3QgJiYgKHJlc3VsdC5pbnZhbGlkRW50cmllcyA+IDAgfHwgcmVzdWx0LmVycm9ycy5sZW5ndGggPiAwKSkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdmFsaWRhdGUtc2l0ZW1hcCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW0ucGFyc2UocHJvY2Vzcy5hcmd2KTtcbiJdfQ==