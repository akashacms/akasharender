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
    .option('--parentDir <path>', 'Select only files whose parent directory is the named directory')
    .option('--dirname <path>', 'Select only files within the named directory')
    .option('--skipglob <globmatch>', 'Skip files matching the glob expression')
    .option('--layouts <layouts...>', 'Select only files matching the layouts')
    .option('--mime <mime>', 'Select only files matching the MIME type')
    .option('--tags <tags...>', 'Select only files with the tags')
    .option('--blogtags <blogtags...>', 'Select only files with the blogtags')
    .option('--limit <limit>', 'Return only so many items')
    .option('--offset <offset>', 'Return only items starting from the offset within the result set')
    .option('--sort-by <field>', 'Sort results by a document column or frontmatter field')
    .option('--sort <direction>', 'Sort direction, either "asc" or "desc"')
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
        if (cmdObj.parentDir)
            options.parentDir = cmdObj.parentDir;
        if (cmdObj.dirname)
            options.dirname = cmdObj.dirname;
        if (cmdObj.match)
            options.pathmatch = cmdObj.match;
        if (cmdObj.rendermatch)
            options.renderpathmatch = cmdObj.rendermatch;
        if (cmdObj.glob)
            options.glob = cmdObj.glob;
        if (cmdObj.renderglob)
            options.renderglob = cmdObj.renderglob;
        if (cmdObj.skipglob)
            options.skipglob = cmdObj.skipglob;
        if (cmdObj.layouts)
            options.layouts = cmdObj.layouts;
        if (cmdObj.mime)
            options.mime = cmdObj.mime;
        if (cmdObj.tags)
            options.tag = cmdObj.tags;
        if (cmdObj.blogtags)
            options.blogtags = cmdObj.blogtags;
        if (cmdObj.limit)
            options.limit = cmdObj.limit;
        if (cmdObj.offset)
            options.offset = cmdObj.offset;
        if (cmdObj.sortBy) {
            // sort-by may name a document column (such as title,
            // renderPath, vpath, parentDir, or publicationTime) or any
            // frontmatter field (such as a custom `step` ordering
            // field).  The search query sorts by a column when the name
            // matches one, and otherwise extracts the value from the
            // JSON metadata.  Guard against names that could not be a
            // safe frontmatter key, matching DocumentGroup in built-in.ts.
            if (!cmdObj.sortBy.match(/^[A-Za-z_][A-Za-z0-9_-]*$/)) {
                throw new Error(`search sort-by incorrect ${cmdObj.sortBy}`);
            }
            options.sortBy = cmdObj.sortBy;
        }
        if (cmdObj.sort) {
            if (!cmdObj.sort.match(/^(asc|desc)$/)) {
                throw new Error(`search sort incorrect ${cmdObj.sort}`);
            }
            options.sortByDescending = cmdObj.sort === 'desc';
        }
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
        // Tag-index readiness/consistency check (GitHub issue #199).
        //
        // The #199 symptom is subtler than a changing file count:
        // documentsCache.tags() returned [] right after setup() even
        // though documentsWithTag() returned rows for the same tags,
        // because the TAGGLUE tag index was not committed before
        // isReady triggered.  Verify that tags() is populated and that
        // every reported tag resolves to at least one document.
        const tags = await filecache.documentsCache.tags();
        console.log(`\nTag index (issue #199 check):`);
        console.log(`  Tags reported by tags(): ${tags.length}`);
        if (tags.length === 0) {
            console.log('  No tags found in this site (tag-index check skipped)');
        }
        else {
            let tagIssue = false;
            for (const tag of tags) {
                const vpaths = await filecache
                    .documentsCache.documentsWithTag(tag);
                if (!Array.isArray(vpaths) || vpaths.length === 0) {
                    console.error(`  ❌ ISSUE DETECTED: tags() reported "${tag}" but documentsWithTag("${tag}") returned no documents`);
                    console.error(`     The tag index was not fully committed before isReady (issue #199)`);
                    issueDetected = true;
                    tagIssue = true;
                }
                else if (cmdObj.verbose) {
                    console.log(`  ✓ tag "${tag}" -> ${vpaths.length} document(s)`);
                }
            }
            if (!tagIssue) {
                console.log(`  ✓ all ${tags.length} tags resolve to documents (tag index consistent)`);
            }
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUgsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLE9BQU8sTUFBTSxVQUFVLENBQUM7QUFDL0IsT0FBTyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ3pCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxLQUFLLElBQUksTUFBTSxTQUFTLENBQUM7QUFFaEMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBSTFELE9BQU8sQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDO0FBQy9CLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFekIsT0FBTztLQUNGLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQztLQUNqQyxXQUFXLENBQUMsbUNBQW1DLENBQUM7S0FDaEQsTUFBTSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtJQUN2QixJQUFJLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FDckMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNYLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDM0IsTUFBTSxNQUFNLENBQUMsS0FB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LENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM3RCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVQLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBwcm9ncmFtIH0gZnJvbSAnY29tbWFuZGVyJztcbmltcG9ydCBnaHBhZ2VzIGZyb20gJ2doLXBhZ2VzJztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgKiBhcyBkYXRhIGZyb20gJy4vZGF0YS5qcyc7XG5pbXBvcnQgKiBhcyBZQU1MIGZyb20gJ2pzLXlhbWwnO1xuaW1wb3J0IHsgUmVuZGVyaW5nUmVzdWx0cyB9IGZyb20gJy4vcmVuZGVyLmpzJztcbmltcG9ydCB7IHJlZmFjdG9yVGFnIH0gZnJvbSAnLi9yZWZhY3Rvci10YWdzLmpzJztcbmltcG9ydCB7IFNpdGVtYXBWYWxpZGF0b3IgfSBmcm9tICcuL3NpdGVtYXAtdmFsaWRhdG9yLmpzJztcblxuXG5cbnByb2Nlc3MudGl0bGUgPSAnYWthc2hhcmVuZGVyJztcbnByb2dyYW0udmVyc2lvbignMC45LjUnKTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdjb3B5LWFzc2V0cyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0NvcHkgYXNzZXRzIGludG8gb3V0cHV0IGRpcmVjdG9yeScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBhd2FpdCBjb25maWcuY29weUFzc2V0cygpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNvcHktYXNzZXRzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3VtZW50IDxjb25maWdGTj4gPGRvY3VtZW50Rk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBkb2N1bWVudCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGRvY3VtZW50Rk4pID0+IHtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgICAgICBjb25zdCBkb2MgPSBhd2FpdCBkb2N1bWVudHMuZmluZChkb2N1bWVudEZOKTtcbiAgICAgICAgICAgIC8vIGRhdGE6ICR7ZG9jLmRhdGF9XG4gICAgICAgICAgICAvLyB0ZXh0OiAke2RvYy50ZXh0fVxuICAgICAgICAgICAgY29uc29sZS5sb2coYFxuZG9jcGF0aDogJHtkb2MudnBhdGh9XG5mc3BhdGg6ICR7ZG9jLmZzcGF0aH1cbnJlbmRlcmVyOiAke3V0aWwuaW5zcGVjdChjb25maWcuZmluZFJlbmRlcmVyUGF0aChkb2MudnBhdGgpKX1cbnJlbmRlcnBhdGg6ICR7ZG9jLnJlbmRlclBhdGh9XG5tb3VudGVkOiAke2RvYy5tb3VudGVkfVxubW91bnRQb2ludDogJHtkb2MubW91bnRQb2ludH1cblxubWV0YWRhdGE6ICR7dXRpbC5pbnNwZWN0KGRvYy5tZXRhZGF0YSl9XG5cbmApO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3VtZW50IGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuZnVuY3Rpb24gZm9ybWF0UmVzdWx0KHJlc3VsdDogUmVuZGVyaW5nUmVzdWx0cykge1xuICAgIGlmIChyZXN1bHQuc2tpcHBlZCkge1xuICAgICAgICByZXR1cm4gYFxuU0tJUFBFRCAke3Jlc3VsdC5yZW5kZXJGb3JtYXR9ICR7cmVzdWx0LnZwYXRofSA9PT4gJHtyZXN1bHQucmVuZGVyUGF0aH0gKG91dHB1dCB1cC10by1kYXRlKWA7XG4gICAgfVxuICAgIHJldHVybiBgXG4ke3Jlc3VsdC5yZW5kZXJGb3JtYXR9ICR7cmVzdWx0LnZwYXRofSA9PT4gJHtyZXN1bHQucmVuZGVyUGF0aH1cbkZJUlNUICR7cmVzdWx0LnJlbmRlckZpcnN0RWxhcHNlZH0gTEFZT1VUICR7cmVzdWx0LnJlbmRlckxheW91dEVsYXBzZWR9IE1BSEEgJHtyZXN1bHQucmVuZGVyTWFoYUVsYXBzZWR9IFRPVEFMICR7cmVzdWx0LnJlbmRlclRvdGFsRWxhcHNlZH1gO1xufVxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3JlbmRlci1kb2N1bWVudCA8Y29uZmlnRk4+IDxkb2N1bWVudEZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdSZW5kZXIgYSBkb2N1bWVudCBpbnRvIG91dHB1dCBkaXJlY3RvcnknKVxuICAgIC5vcHRpb24oJy0tcGVyZi1kYXRhLWRpciA8ZGF0YURpcj4nLCAnRGlyZWN0b3J5IGZvciBvdXRwdXQgb2YgTWFoYWJodXRhIHBlcmZvcm1hbmNlIG1lYXN1cmVtZW50cycpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGRvY3VtZW50Rk4sIGNtZE9iaikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjbWRPYmo/LnBlcmZEYXRhRGlyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5wZXJmRGF0YURpciA9IGNtZE9iai5wZXJmRGF0YURpcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBhd2FpdCBkYXRhLnJlbW92ZUFsbCgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlci1kb2N1bWVudCBiZWZvcmUgcmVuZGVyUGF0aCAke2RvY3VtZW50Rk59YCk7XG4gICAgICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgYWthc2hhLnJlbmRlclBhdGgyKGNvbmZpZywgZG9jdW1lbnRGTik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZm9ybWF0UmVzdWx0KHJlc3VsdCkpO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0LmVycm9ycylcbiAgICAgICAgICAgICAgICAmJiByZXN1bHQuZXJyb3JzLmxlbmd0aCA+PSAxXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3Iuc3RhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByZW5kZXItZG9jdW1lbnQgY29tbWFuZCBFUlJPUkVEYCwgZSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdyZW5kZXIgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdSZW5kZXIgYSBzaXRlIGludG8gb3V0cHV0IGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1xdWlldCcsICdEbyBub3QgcHJpbnQgdGhlIHJlbmRlcmluZyByZXBvcnQnKVxuICAgIC5vcHRpb24oJy0tY29weS1hc3NldHMnLCAnRmlyc3QsIGNvcHkgdGhlIGFzc2V0cycpXG4gICAgLm9wdGlvbignLS1yZXN1bHRzLXRvIDxyZXN1bHRGaWxlPicsICdTdG9yZSB0aGUgcmVzdWx0cyBpbnRvIHRoZSBuYW1lZCBmaWxlJylcbiAgICAub3B0aW9uKCctLXBlcmZyZXN1bHRzIDxwZXJmUmVzdWx0c0ZpbGU+JywgJ1N0b3JlIHRoZSB0aW1lIHRvIHJlbmRlciBlYWNoIGRvY3VtZW50JylcbiAgICAub3B0aW9uKCctLWZvcmNlLXJlbmRlci1hbGwnLCAnUmUtcmVuZGVyIGV2ZXJ5IGRvY3VtZW50LCBpZ25vcmluZyBvdXRwdXQgZmlsZSB0aW1lc3RhbXBzJylcbiAgICAub3B0aW9uKCctLWNhY2hpbmctdGltZW91dCA8dGltZW91dD4nLCAnVGhlIHRpbWUsIGluIG1pbGlzZWNvbmRzLCB0byBob25vciBlbnRyaWVzIGluIHRoZSBzZWFyY2ggY2FjaGUnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGF3YWl0IGRhdGEucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmNvcHlBc3NldHMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb25maWcuY29weUFzc2V0cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjbWRPYmouY2FjaGluZ1RpbWVvdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnNldENhY2hpbmdUaW1lb3V0KFxuICAgICAgICAgICAgICAgICAgICBOdW1iZXIucGFyc2VJbnQoY21kT2JqLmNhY2hpbmdUaW1lb3V0KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgcmVzdWx0cyA9IDxSZW5kZXJpbmdSZXN1bHRzW10+IGF3YWl0IGFrYXNoYS5yZW5kZXIyKGNvbmZpZywge1xuICAgICAgICAgICAgICAgIGZvcmNlUmVuZGVyQWxsOiBjbWRPYmouZm9yY2VSZW5kZXJBbGwgPT09IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCFjbWRPYmoucXVpZXQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCByZXN1bHQgb2YgcmVzdWx0cykge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gLS0tIGlmIEFLQVNIQVJFTkRFUl9UUkFDRV9SRU5ERVIgdGhlbiBvdXRwdXQgdHJhY2luZyBkYXRhXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gLS0tIGFsc28gc2V0IHByb2Nlc3MuZW52LkdMT0JGU19UUkFDRT0xXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhmb3JtYXRSZXN1bHQocmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdC5lcnJvcnMpXG4gICAgICAgICAgICAgICAgICAgICAmJiByZXN1bHQuZXJyb3JzLmxlbmd0aCA+PSAxXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBlcnJvciBvZiByZXN1bHQuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3Iuc3RhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5yZXN1bHRzVG8pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvdXRwdXQgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShjbWRPYmoucmVzdWx0c1RvKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQud3JpdGUoZm9ybWF0UmVzdWx0KHJlc3VsdCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQuZXJyb3JzKVxuICAgICAgICAgICAgICAgICAgICAgJiYgcmVzdWx0LmVycm9ycy5sZW5ndGggPj0gMVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZXJyb3Igb2YgcmVzdWx0LmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC53cml0ZShlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnBlcmZyZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVwb3J0cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwb3J0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlZFBhdGg/OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdD86IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlY29uZD86IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haGFiaHV0YT86IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkPzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICB9ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWRQYXRoOiByZXN1bHQudnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHJlc3VsdC5yZW5kZXJGb3JtYXQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiByZXN1bHQucmVuZGVyU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdDogcmVzdWx0LnJlbmRlckZpcnN0RWxhcHNlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlY29uZDogcmVzdWx0LnJlbmRlckxheW91dEVsYXBzZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWhhYmh1dGE6IHJlc3VsdC5yZW5kZXJNYWhhRWxhcHNlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkOiByZXN1bHQucmVuZGVyVG90YWxFbGFwc2VkXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydHMucHVzaChyZXBvcnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmc3Aud3JpdGVGaWxlKGNtZE9iai5wZXJmcmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHJlcG9ydHMsIHVuZGVmaW5lZCwgNCksXG4gICAgICAgICAgICAgICAgICAgICAgICAndXRmLTgnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByZW5kZXIgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2doLXBhZ2VzLXB1Ymxpc2ggPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdQdWJsaXNoIGEgc2l0ZSB1c2luZyBHaXRodWIgUGFnZXMuICBUYWtlcyB0aGUgcmVuZGVyaW5nIGRlc3RpbmF0aW9uLCBhZGRzIGl0IGludG8gYSBicmFuY2gsIGFuZCBwdXNoZXMgdGhhdCB0byBHaXRodWInKVxuICAgIC5vcHRpb24oJy1iLCAtLWJyYW5jaCA8YnJhbmNoTmFtZT4nLCAnVGhlIGJyYW5jaCB0byB1c2UgZm9yIHB1Ymxpc2hpbmcgdG8gR2l0aHViJylcbiAgICAub3B0aW9uKCctciwgLS1yZXBvIDxyZXBvVVJMPicsICdUaGUgcmVwb3NpdG9yeSBVUkwgdG8gdXNlIGlmIGl0IG11c3QgZGlmZmVyIGZyb20gdGhlIFVSTCBvZiB0aGUgbG9jYWwgZGlyZWN0b3J5JylcbiAgICAub3B0aW9uKCctLXJlbW90ZSA8cmVtb3RlTmFtZT4nLCAnVGhlIEdpdCByZW1vdGUgbmFtZSB0byB1c2UgaWYgaXQgbXVzdCBkaWZmZXIgZnJvbSBcIm9yaWdpblwiJylcbiAgICAub3B0aW9uKCctLXRhZyA8dGFnPicsICdBbnkgdGFnIHRvIGFkZCB3aGVuIHB1c2hpbmcgdG8gR2l0aHViJylcbiAgICAub3B0aW9uKCctLW1lc3NhZ2UgPG1lc3NhZ2U+JywgJ0FueSBHaXQgY29tbWl0IG1lc3NhZ2UnKVxuICAgIC5vcHRpb24oJy0tdXNlcm5hbWUgPHVzZXJuYW1lPicsICdHaXRodWIgdXNlciBuYW1lIHRvIHVzZScpXG4gICAgLm9wdGlvbignLS1lbWFpbCA8ZW1haWw+JywgJ0dpdGh1YiB1c2VyIGVtYWlsIHRvIHVzZScpXG4gICAgLm9wdGlvbignLS1ub3B1c2gnLCAnRG8gbm90IHB1c2ggdG8gR2l0aHViLCBvbmx5IGNvbW1pdCcpXG4gICAgLm9wdGlvbignLS1jbmFtZSA8ZG9tYWluPicsICdXcml0ZSBvdXQgYSBDTkFNRSBmaWxlIHdpdGggdGhlIGRvbWFpbiBuYW1lJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuXG4gICAgICAgICAgICBsZXQgb3B0aW9uczogYW55ID0ge1xuICAgICAgICAgICAgICAgIGRvdGZpbGVzOiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGNtZE9iai5icmFuY2gpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmJyYW5jaCA9IGNtZE9iai5icmFuY2g7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlcG9VUkwpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnJlcG8gPSBjbWRPYmoucmVwb1VSTDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVtb3RlKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5yZW1vdGUgPSBjbWRPYmoucmVtb3RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5jbmFtZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuY25hbWUgPSBjbWRPYmouY25hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnRhZykge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudGFnID0gY21kT2JqLnRhZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMubWVzc2FnZSA9IGNtZE9iai5tZXNzYWdlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai51c2VybmFtZSB8fCBjbWRPYmouZW1haWwpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnVzZXIgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoudXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnVzZXIubmFtZSA9IGNtZE9iai51c2VybmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmouZW1haWwpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnVzZXIuZW1haWwgPSBjbWRPYmouZW1haWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLm5vcHVzaCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMucHVzaCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvcHRpb25zLm5vamVreWxsID0gdHJ1ZTtcbiAgICAgICAgICAgIG9wdGlvbnMuZG90ZmlsZXMgPSB0cnVlO1xuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZ2gtcGFnZXMtcHVibGlzaCBvcHRpb25zICR7Y29uZmlnLnJlbmRlckRlc3RpbmF0aW9ufSBjbWRPYmogJHt1dGlsLmluc3BlY3QoY21kT2JqKX0gb3B0aW9ucyAke3V0aWwuaW5zcGVjdChvcHRpb25zKX1gKTtcblxuICAgICAgICAgICAgZ2hwYWdlcy5wdWJsaXNoKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgb3B0aW9ucywgZnVuY3Rpb24oZXJyKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgZWxzZSBjb25zb2xlLmxvZygnT0snKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBnaC1wYWdlcy1wdWJsaXNoIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2NvbmZpZyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1ByaW50IGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNvbmZpZyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncGx1Z2lucyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHBsdWdpbnMnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLnBsdWdpbnMpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNvbmZpZyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZG9jZGlycyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGRvY3VtZW50cyBkaXJlY3RvcmllcyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5kb2N1bWVudERpcnMpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY2RpcnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2Fzc2V0ZGlycyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGFzc2V0cyBkaXJlY3RvcmllcyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5hc3NldERpcnMpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0ZGlycyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncGFydGlhbGRpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBwYXJ0aWFscyBkaXJlY3RvcmllcyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5wYXJ0aWFsc0RpcnMpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHBhcnRpYWxkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdsYXlvdXRzZGlycyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGxheW91dHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcubGF5b3V0RGlycyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0c2RpcnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZG9jdW1lbnRzIDxjb25maWdGTj4gW3Jvb3RQYXRoXScpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCByb290UGF0aCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5wYXRocyhyb290UGF0aCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3VtZW50cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZG9jcy1zZXQtZGF0ZXMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTZXQgdGhlIGFUaW1lIGFuZCBtVGltZSBmb3IgZG9jdW1lbnRzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5zZXRUaW1lcygpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NzLXNldC1kYXRlcyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZG9jaW5mbyA8Y29uZmlnRk4+IDxkb2NGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2hvdyBpbmZvcm1hdGlvbiBhYm91dCBhIGRvY3VtZW50IGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgZG9jRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY2luZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLmZpbmQoZG9jRk4pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGRvY0ZOICR7ZG9jRk59IGAsIGRvY2luZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY2luZm8gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2luZGV4LWZpbGVzIDxjb25maWdGTj4gW3Jvb3RQYXRoXScpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBpbmRleCBwYWdlcyAoaW5kZXguaHRtbCkgdW5kZXIgdGhlIGdpdmVuIGRpcmVjdG9yeScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHJvb3RQYXRoKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5pbmRleEZpbGVzKHJvb3RQYXRoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBpbmRleGVzICR7cm9vdFBhdGh9IGAsIGRvY2luZm8ubWFwKGluZGV4ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogaW5kZXgudnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZGV4LnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZGV4Lm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZGV4LnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIGRpcm5hbWU6IGluZGV4LmRpcm5hbWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW5kZXgtZmlsZXMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2luZGV4LWNoYWluIDxjb25maWdGTj4gc3RhcnRQYXRoJylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGluZGV4IGNoYWluIHN0YXJ0aW5nIGZyb20gdGhlIHBhdGgnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBzdGFydFBhdGgpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY2luZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLmluZGV4Q2hhaW4oc3RhcnRQYXRoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBpbmRleCBjaGFpbiAke3N0YXJ0UGF0aH0gYCwgZG9jaW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW5kZXgtY2hhaW4gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3NpYmxpbmdzIDxjb25maWdGTj4gPHZwYXRoPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBzaWJsaW5nIHBhZ2VzIHRvIHRoZSBuYW1lZCBkb2N1bWVudCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHZwYXRoKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5zaWJsaW5ncyh2cGF0aCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgc2libGluZ3MgJHt2cGF0aH0gYCwgZG9jaW5mby5tYXAoaW5kZXggPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBpbmRleC52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5kZXgucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogaW5kZXgubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5kZXgucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgZGlybmFtZTogaW5kZXguZGlybmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBzaWJsaW5ncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZG9jcy1zZW1hbnRpYyA8Y29uZmlnRk4+IDxzZWFyY2hGb3I+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGRvY3VtZW50IHZwYXRocyBzZW1hbnRpY2FsbHkgbWF0Y2hpbmcgdGhlIHN0cmluZycpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHNlYXJjaEZvcikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5zZW1hbnRpY1NlYXJjaERvY3Moc2VhcmNoRm9yKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy1zZW1hbnRpYyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgndGFncyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHRhZ3MnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgdGFncyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUudGFncygpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coWUFNTC5kdW1wKHsgdGFncyB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdGFncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnc2ltaWxhci10YWdzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignRmluZCBncm91cHMgb2Ygc2ltaWxhciB0YWdzJylcbiAgICAub3B0aW9uKCctLXRocmVzaG9sZCA8bj4nLCAnTGV2ZW5zaHRlaW4gZGlzdGFuY2UgdGhyZXNob2xkJywgJzInKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCB0aHJlc2hvbGQgPSBwYXJzZUludChjbWRPYmoudGhyZXNob2xkLCAxMCk7XG4gICAgICAgICAgICBjb25zdCBncm91cHMgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLmZpbmRTaW1pbGFyVGFncyh0aHJlc2hvbGQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coWUFNTC5kdW1wKHsgc2ltaWxhclRhZ0dyb3VwczogZ3JvdXBzIH0sIHsgaW5kZW50OiA0IH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBzaW1pbGFyLXRhZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3RhZ3Mtd2l0aG91dC1kZXNjcmlwdGlvbnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRhZ3MgdGhhdCBoYXZlIG5vIGRlc2NyaXB0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnRhZ3NXaXRob3V0RGVzY3JpcHRpb25zKCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhZQU1MLmR1bXAoeyB0YWdzV2l0aG91dERlc2NyaXB0aW9uczogdGFncyB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdGFncy13aXRob3V0LWRlc2NyaXB0aW9ucyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgndW51c2VkLXRhZy1kZXNjcmlwdGlvbnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRhZyBkZXNjcmlwdGlvbnMgdGhhdCBhcmUgbm90IHVzZWQgYnkgYW55IGRvY3VtZW50JylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnVudXNlZFRhZ0Rlc2NyaXB0aW9ucygpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coWUFNTC5kdW1wKHsgdW51c2VkVGFnRGVzY3JpcHRpb25zOiB0YWdzIH0sIHsgaW5kZW50OiA0IH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB1bnVzZWQtdGFnLWRlc2NyaXB0aW9ucyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncmVmYWN0b3ItdGFnIDxjb25maWdGTj4gPG9sZFRhZz4gPG5ld1RhZz4nKVxuICAgIC5kZXNjcmlwdGlvbignUmVuYW1lIGEgdGFnIGFjcm9zcyBhbGwgZG9jdW1lbnRzJylcbiAgICAub3B0aW9uKCctLWRyeS1ydW4nLCAnTGlzdCBjaGFuZ2VzIHdpdGhvdXQgbW9kaWZ5aW5nIGZpbGVzJywgZmFsc2UpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIG9sZFRhZywgbmV3VGFnLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZWZhY3RvclRhZyhjb25maWcsIG9sZFRhZywgbmV3VGFnLCB7XG4gICAgICAgICAgICAgICAgZHJ5UnVuOiBjbWRPYmouZHJ5UnVuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHJlZmFjdG9yUmVzdWx0OiByZXN1bHQgfSwgeyBpbmRlbnQ6IDQgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJlZmFjdG9yLXRhZyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZG9jcy13aXRoLXRhZyA8Y29uZmlnRk4+IDx0YWdzLi4uPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudCB2cGF0aHMgZm9yIGdpdmVuIHRhZ3MnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCB0YWdzKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZVxuICAgICAgICAgICAgICAgIC5kb2N1bWVudHNDYWNoZS5kb2N1bWVudHNXaXRoVGFnKHRhZ3MpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY2hpbGQtaXRlbS10cmVlIDxjb25maWdGTj4gPHJvb3RQYXRoPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudHMgdW5kZXIgYSBnaXZlbiBsb2NhdGlvbiBieSB0cmVlJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcm9vdFBhdGgpID0+IHtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgIFlBTUwuZHVtcCh7XG4gICAgICAgICAgICAgICAgICAgIHRyZWU6IGF3YWl0IGFrYXNoYS5maWxlY2FjaGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC5kb2N1bWVudHNDYWNoZS5jaGlsZEl0ZW1UcmVlKHJvb3RQYXRoKVxuICAgICAgICAgICAgICAgIH0sIHsgaW5kZW50OiA0IH0pXG4gICAgICAgICAgICAgICAgLy8gLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoXG4gICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnc2VhcmNoIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2VhcmNoIGZvciBkb2N1bWVudHMnKVxuICAgIC5vcHRpb24oJy0tcm9vdCA8cm9vdFBhdGg+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIHdpdGhpbiB0aGUgbmFtZWQgZGlyZWN0b3J5JylcbiAgICAub3B0aW9uKCctLW1hdGNoIDxwYXRobWF0Y2g+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSByZWd1bGFyIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tcmVuZGVybWF0Y2ggPHJlbmRlcnBhdGhtYXRjaD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbicpXG4gICAgLm9wdGlvbignLS1nbG9iIDxnbG9ibWF0Y2g+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSBnbG9iIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tcmVuZGVyZ2xvYiA8Z2xvYm1hdGNoPicsICdTZWxlY3Qgb25seSBmaWxlcyByZW5kZXJpbmcgdG8gdGhlIGdsb2IgZXhwcmVzc2lvbicpXG4gICAgLm9wdGlvbignLS1wYXJlbnREaXIgPHBhdGg+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIHdob3NlIHBhcmVudCBkaXJlY3RvcnkgaXMgdGhlIG5hbWVkIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1kaXJuYW1lIDxwYXRoPicsICdTZWxlY3Qgb25seSBmaWxlcyB3aXRoaW4gdGhlIG5hbWVkIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1za2lwZ2xvYiA8Z2xvYm1hdGNoPicsICdTa2lwIGZpbGVzIG1hdGNoaW5nIHRoZSBnbG9iIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tbGF5b3V0cyA8bGF5b3V0cy4uLj4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIGxheW91dHMnKVxuICAgIC5vcHRpb24oJy0tbWltZSA8bWltZT4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIE1JTUUgdHlwZScpXG4gICAgLm9wdGlvbignLS10YWdzIDx0YWdzLi4uPicsICdTZWxlY3Qgb25seSBmaWxlcyB3aXRoIHRoZSB0YWdzJylcbiAgICAub3B0aW9uKCctLWJsb2d0YWdzIDxibG9ndGFncy4uLj4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgd2l0aCB0aGUgYmxvZ3RhZ3MnKVxuICAgIC5vcHRpb24oJy0tbGltaXQgPGxpbWl0PicsICdSZXR1cm4gb25seSBzbyBtYW55IGl0ZW1zJylcbiAgICAub3B0aW9uKCctLW9mZnNldCA8b2Zmc2V0PicsICdSZXR1cm4gb25seSBpdGVtcyBzdGFydGluZyBmcm9tIHRoZSBvZmZzZXQgd2l0aGluIHRoZSByZXN1bHQgc2V0JylcbiAgICAub3B0aW9uKCctLXNvcnQtYnkgPGZpZWxkPicsICdTb3J0IHJlc3VsdHMgYnkgYSBkb2N1bWVudCBjb2x1bW4gb3IgZnJvbnRtYXR0ZXIgZmllbGQnKVxuICAgIC5vcHRpb24oJy0tc29ydCA8ZGlyZWN0aW9uPicsICdTb3J0IGRpcmVjdGlvbiwgZWl0aGVyIFwiYXNjXCIgb3IgXCJkZXNjXCInKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGNtZE9iaik7XG4gICAgICAgICAgICBsZXQgb3B0aW9uczogYW55ID0geyB9O1xuICAgICAgICAgICAgaWYgKGNtZE9iai5yb290KSBvcHRpb25zLnJvb3RQYXRoID0gY21kT2JqLnJvb3Q7XG4gICAgICAgICAgICBpZiAoY21kT2JqLnBhcmVudERpcikgb3B0aW9ucy5wYXJlbnREaXIgPSBjbWRPYmoucGFyZW50RGlyO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5kaXJuYW1lKSBvcHRpb25zLmRpcm5hbWUgPSBjbWRPYmouZGlybmFtZTtcbiAgICAgICAgICAgIGlmIChjbWRPYmoubWF0Y2gpIG9wdGlvbnMucGF0aG1hdGNoID0gY21kT2JqLm1hdGNoO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5yZW5kZXJtYXRjaCkgb3B0aW9ucy5yZW5kZXJwYXRobWF0Y2ggPSBjbWRPYmoucmVuZGVybWF0Y2g7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmdsb2IpIG9wdGlvbnMuZ2xvYiA9IGNtZE9iai5nbG9iO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5yZW5kZXJnbG9iKSBvcHRpb25zLnJlbmRlcmdsb2IgPSBjbWRPYmoucmVuZGVyZ2xvYjtcbiAgICAgICAgICAgIGlmIChjbWRPYmouc2tpcGdsb2IpIG9wdGlvbnMuc2tpcGdsb2IgPSBjbWRPYmouc2tpcGdsb2I7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmxheW91dHMpIG9wdGlvbnMubGF5b3V0cyA9IGNtZE9iai5sYXlvdXRzO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5taW1lKSBvcHRpb25zLm1pbWUgPSBjbWRPYmoubWltZTtcbiAgICAgICAgICAgIGlmIChjbWRPYmoudGFncykgb3B0aW9ucy50YWcgPSBjbWRPYmoudGFncztcbiAgICAgICAgICAgIGlmIChjbWRPYmouYmxvZ3RhZ3MpIG9wdGlvbnMuYmxvZ3RhZ3MgPSBjbWRPYmouYmxvZ3RhZ3M7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmxpbWl0KSBvcHRpb25zLmxpbWl0ID0gY21kT2JqLmxpbWl0O1xuICAgICAgICAgICAgaWYgKGNtZE9iai5vZmZzZXQpIG9wdGlvbnMub2Zmc2V0ID0gY21kT2JqLm9mZnNldDtcbiAgICAgICAgICAgIGlmIChjbWRPYmouc29ydEJ5KSB7XG4gICAgICAgICAgICAgICAgLy8gc29ydC1ieSBtYXkgbmFtZSBhIGRvY3VtZW50IGNvbHVtbiAoc3VjaCBhcyB0aXRsZSxcbiAgICAgICAgICAgICAgICAvLyByZW5kZXJQYXRoLCB2cGF0aCwgcGFyZW50RGlyLCBvciBwdWJsaWNhdGlvblRpbWUpIG9yIGFueVxuICAgICAgICAgICAgICAgIC8vIGZyb250bWF0dGVyIGZpZWxkIChzdWNoIGFzIGEgY3VzdG9tIGBzdGVwYCBvcmRlcmluZ1xuICAgICAgICAgICAgICAgIC8vIGZpZWxkKS4gIFRoZSBzZWFyY2ggcXVlcnkgc29ydHMgYnkgYSBjb2x1bW4gd2hlbiB0aGUgbmFtZVxuICAgICAgICAgICAgICAgIC8vIG1hdGNoZXMgb25lLCBhbmQgb3RoZXJ3aXNlIGV4dHJhY3RzIHRoZSB2YWx1ZSBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIEpTT04gbWV0YWRhdGEuICBHdWFyZCBhZ2FpbnN0IG5hbWVzIHRoYXQgY291bGQgbm90IGJlIGFcbiAgICAgICAgICAgICAgICAvLyBzYWZlIGZyb250bWF0dGVyIGtleSwgbWF0Y2hpbmcgRG9jdW1lbnRHcm91cCBpbiBidWlsdC1pbi50cy5cbiAgICAgICAgICAgICAgICBpZiAoIWNtZE9iai5zb3J0QnkubWF0Y2goL15bQS1aYS16X11bQS1aYS16MC05Xy1dKiQvKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBzb3J0LWJ5IGluY29ycmVjdCAke2NtZE9iai5zb3J0Qnl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9wdGlvbnMuc29ydEJ5ID0gY21kT2JqLnNvcnRCeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmouc29ydCkge1xuICAgICAgICAgICAgICAgIGlmICghY21kT2JqLnNvcnQubWF0Y2goL14oYXNjfGRlc2MpJC8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIHNvcnQgaW5jb3JyZWN0ICR7Y21kT2JqLnNvcnR9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9wdGlvbnMuc29ydEJ5RGVzY2VuZGluZyA9IGNtZE9iai5zb3J0ID09PSAnZGVzYyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhvcHRpb25zKTtcbiAgICAgICAgICAgIGxldCBkb2NzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5zZWFyY2gob3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkb2NzXG4gICAgICAgICAgICAvLyAubWFwKGRvYyA9PiB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgdnBhdGg6IGRvYy52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogZG9jLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIGRpcm5hbWU6IGRvYy5kaXJuYW1lXG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgIC8vIC5zb3J0KChhOiBhbnksIGI6IGFueSkgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHZhciB0YWdBID0gYS5kaXJuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAvLyAgICAgdmFyIHRhZ0IgPSBiLmRpcm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIC8vICAgICBpZiAodGFnQSA8IHRhZ0IpIHJldHVybiAtMTtcbiAgICAgICAgICAgIC8vICAgICBpZiAodGFnQSA+IHRhZ0IpIHJldHVybiAxO1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiAwO1xuICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgIC8vIC5yZXZlcnNlKClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc2VhcmNoIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdhc3NldHMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBhc3NldHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlLnBhdGhzKCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnYXNzZXRpbmZvIDxjb25maWdGTj4gPGRvY0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGFuIGFzc2V0IGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgYXNzZXRGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgYXNzZXRpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5hc3NldHNDYWNoZS5maW5kKGFzc2V0Rk4pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXNzZXRpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldGluZm8gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2xheW91dHMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBsYXlvdXRzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUucGF0aHMoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbi8vIFRPRE8gYm90aCB0ZXN0Lmh0bWwgYW5kIHRlc3QuaHRtbC5uamsgbWF0Y2hcbi8vICAgICAgVGhpcyBpcyBwcm9iYWJseSBpbmNvcnJlY3QsIHNpbmNlIHdlIGRvIG5vdCByZW5kZXIgdGhlc2UgZmlsZXNcbi8vICAgICAgVGhlIHBhcnRpYWxzIGRpcmVjdG9yeSBoYXMgdGhlIHNhbWUgcHJvYmxlbVxuLy8gICAgICBTb21lIGtpbmQgb2YgZmxhZyBvbiBjcmVhdGluZyB0aGUgRmlsZUNhY2hlIHRvIGNoYW5nZSB0aGUgYmVoYXZpb3JcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdsYXlvdXRpbmZvIDxjb25maWdGTj4gPGRvY0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGEgbGF5b3V0IGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgbGF5b3V0Rk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dGluZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZS5maW5kKGxheW91dEZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGxheW91dGluZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGxheW91dGluZm8gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BhcnRpYWxzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgcGFydGlhbHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUucGF0aHMoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcGFydGlhbHMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4vLyBUT0RPIGJvdGggdGVzdC5odG1sIGFuZCB0ZXN0Lmh0bWwubmprIG1hdGNoXG4vLyAgICAgIFRoaXMgaXMgcHJvYmFibHkgaW5jb3JyZWN0LCBzaW5jZSB3ZSBkbyBub3QgcmVuZGVyIHRoZXNlIGZpbGVzXG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncGFydGlhbGluZm8gPGNvbmZpZ0ZOPiA8ZG9jRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBwYXJ0aWFsIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcGFydGlhbEZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBwYXJ0aWFsaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUucGFydGlhbHNDYWNoZS5maW5kKHBhcnRpYWxGTik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwYXJ0aWFsaW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcGFydGlhbGluZm8gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2luZGV4IDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTG9hZHMgY29uZmlndXJhdGlvbiwgaW5kZXhlcyBjb250ZW50LCB0aGVuIGV4aXRzJylcbiAgICAub3B0aW9uKCctLXZlcmJvc2UnLCAnU2hvdyBkZXRhaWxlZCBldmVudCB0cmFja2luZyAoYWRkZWQsIHJlYWR5LCBlcnJvciBldmVudHMpJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNtZE9iai52ZXJib3NlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0luZGV4aW5nIGZpbGVzIHdpdGggdmVyYm9zZSBvdXRwdXQuLi5cXG4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIEVuYWJsZSB2ZXJib3NlIG1vZGUgaW4gY29uZmlnXG4gICAgICAgICAgICAgICAgY29uZmlnLnZlcmJvc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IHNldHVwVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxhcHNlZCA9IHNldHVwVGltZSAtIHN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBHZXQgZmlsZSBjb3VudHNcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlY2FjaGUgPSBha2FzaGEuZmlsZWNhY2hlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50Q291bnQgPSAoYXdhaXQgZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnBhdGhzKCkpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldENvdW50ID0gKGF3YWl0IGZpbGVjYWNoZS5hc3NldHNDYWNoZS5wYXRocygpKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF5b3V0Q291bnQgPSAoYXdhaXQgZmlsZWNhY2hlLmxheW91dHNDYWNoZS5wYXRocygpKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFydGlhbENvdW50ID0gKGF3YWl0IGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLnBhdGhzKCkpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg4pyTIEluZGV4aW5nIGNvbXBsZXRlZCBpbiAke2VsYXBzZWR9bXNcXG5gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPT09IFN1bW1hcnkgPT09Jyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYERvY3VtZW50czogJHtkb2N1bWVudENvdW50fSBmaWxlc2ApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBc3NldHM6ICR7YXNzZXRDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgTGF5b3V0czogJHtsYXlvdXRDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUGFydGlhbHM6ICR7cGFydGlhbENvdW50fSBmaWxlc2ApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBUb3RhbDogJHtkb2N1bWVudENvdW50ICsgYXNzZXRDb3VudCArIGxheW91dENvdW50ICsgcGFydGlhbENvdW50fSBmaWxlc2ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBOb3JtYWwgbW9kZSAtIGp1c3Qgc2V0dXBcbiAgICAgICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluZGV4IGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdjaGVjay1yZWFkeSA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1ZlcmlmeSB0aGF0IGFsbCBmaWxlcyBhcmUgbG9hZGVkIGJlZm9yZSBpc1JlYWR5IHRyaWdnZXJzIChkaWFnbm9zdGljIHRvb2wpJylcbiAgICAub3B0aW9uKCctLXZlcmJvc2UnLCAnU2hvdyBkZXRhaWxlZCBmaWxlLWJ5LWZpbGUgdHJhY2tpbmcnKVxuICAgIC5vcHRpb24oJy0tZGVsYXkgPG1zPicsICdXYWl0IHRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIGNoZWNrIGZvciBsYXRlIGFkZGl0aW9ucyAoZGVmYXVsdDogMjAwMCknLCAnMjAwMCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSdW5uaW5nIGlzUmVhZHkgdGltaW5nIGNoZWNrLi4uXFxuJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENhcHR1cmUgaW5pdGlhbCBzdGF0ZVxuICAgICAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3Qgc2V0dXBUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gR2V0IGNvdW50cyBpbW1lZGlhdGVseSBhZnRlciBzZXR1cFxuICAgICAgICAgICAgY29uc3QgZmlsZWNhY2hlID0gYWthc2hhLmZpbGVjYWNoZTtcbiAgICAgICAgICAgIGNvbnN0IGNvdW50c0FmdGVyU2V0dXAgPSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnRzOiAoYXdhaXQgZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnBhdGhzKCkpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBhc3NldHM6IChhd2FpdCBmaWxlY2FjaGUuYXNzZXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGxheW91dHM6IChhd2FpdCBmaWxlY2FjaGUubGF5b3V0c0NhY2hlLnBhdGhzKCkpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBwYXJ0aWFsczogKGF3YWl0IGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLnBhdGhzKCkpLmxlbmd0aFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coYOKckyBTZXR1cCBjb21wbGV0ZWQgaW4gJHtzZXR1cFRpbWUgLSBzdGFydFRpbWV9bXNgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIERvY3VtZW50czogJHtjb3VudHNBZnRlclNldHVwLmRvY3VtZW50c31gKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIEFzc2V0czogJHtjb3VudHNBZnRlclNldHVwLmFzc2V0c31gKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIExheW91dHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5sYXlvdXRzfWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgUGFydGlhbHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5wYXJ0aWFsc31gKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gV2FpdCBzcGVjaWZpZWQgZGVsYXkgdG8gc2VlIGlmIGFueSBhZGRpdGlvbmFsIGZpbGVzIGFwcGVhclxuICAgICAgICAgICAgY29uc3QgZGVsYXlNcyA9IHBhcnNlSW50KGNtZE9iai5kZWxheSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgXFxuV2FpdGluZyAke2RlbGF5TXN9bXMgdG8gY2hlY2sgZm9yIGxhdGUgYWRkaXRpb25zLi4uYCk7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgZGVsYXlNcykpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBjb3VudHNBZnRlckRlbGF5ID0ge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50czogKGF3YWl0IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYXNzZXRzOiAoYXdhaXQgZmlsZWNhY2hlLmFzc2V0c0NhY2hlLnBhdGhzKCkpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBsYXlvdXRzOiAoYXdhaXQgZmlsZWNhY2hlLmxheW91dHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgcGFydGlhbHM6IChhd2FpdCBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5wYXRocygpKS5sZW5ndGhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENvbXBhcmUgY291bnRzXG4gICAgICAgICAgICBsZXQgaXNzdWVEZXRlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3QgY2hlY2tDYWNoZSA9IChuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBiZWZvcmUgPSBjb3VudHNBZnRlclNldHVwW25hbWVdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFmdGVyID0gY291bnRzQWZ0ZXJEZWxheVtuYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoYmVmb3JlICE9PSBhZnRlcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBcXG7inYwgSVNTVUUgREVURUNURUQ6ICR7bmFtZX0gY291bnQgY2hhbmdlZCBmcm9tICR7YmVmb3JlfSB0byAke2FmdGVyfWApO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAgICBUaGlzIGluZGljYXRlcyBmaWxlcyB3ZXJlIGFkZGVkIGFmdGVyIGlzUmVhZHkhYCk7XG4gICAgICAgICAgICAgICAgICAgIGlzc3VlRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNtZE9iai52ZXJib3NlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg4pyTICR7bmFtZX06ICR7YmVmb3JlfSBmaWxlcyAoc3RhYmxlKWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcXG5SZXN1bHRzOicpO1xuICAgICAgICAgICAgY29uc3QgZG9jc09rID0gY2hlY2tDYWNoZSgnZG9jdW1lbnRzJyk7XG4gICAgICAgICAgICBjb25zdCBhc3NldHNPayA9IGNoZWNrQ2FjaGUoJ2Fzc2V0cycpO1xuICAgICAgICAgICAgY29uc3QgbGF5b3V0c09rID0gY2hlY2tDYWNoZSgnbGF5b3V0cycpO1xuICAgICAgICAgICAgY29uc3QgcGFydGlhbHNPayA9IGNoZWNrQ2FjaGUoJ3BhcnRpYWxzJyk7XG5cbiAgICAgICAgICAgIC8vIFRhZy1pbmRleCByZWFkaW5lc3MvY29uc2lzdGVuY3kgY2hlY2sgKEdpdEh1YiBpc3N1ZSAjMTk5KS5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUaGUgIzE5OSBzeW1wdG9tIGlzIHN1YnRsZXIgdGhhbiBhIGNoYW5naW5nIGZpbGUgY291bnQ6XG4gICAgICAgICAgICAvLyBkb2N1bWVudHNDYWNoZS50YWdzKCkgcmV0dXJuZWQgW10gcmlnaHQgYWZ0ZXIgc2V0dXAoKSBldmVuXG4gICAgICAgICAgICAvLyB0aG91Z2ggZG9jdW1lbnRzV2l0aFRhZygpIHJldHVybmVkIHJvd3MgZm9yIHRoZSBzYW1lIHRhZ3MsXG4gICAgICAgICAgICAvLyBiZWNhdXNlIHRoZSBUQUdHTFVFIHRhZyBpbmRleCB3YXMgbm90IGNvbW1pdHRlZCBiZWZvcmVcbiAgICAgICAgICAgIC8vIGlzUmVhZHkgdHJpZ2dlcmVkLiAgVmVyaWZ5IHRoYXQgdGFncygpIGlzIHBvcHVsYXRlZCBhbmQgdGhhdFxuICAgICAgICAgICAgLy8gZXZlcnkgcmVwb3J0ZWQgdGFnIHJlc29sdmVzIHRvIGF0IGxlYXN0IG9uZSBkb2N1bWVudC5cbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUudGFncygpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFxcblRhZyBpbmRleCAoaXNzdWUgIzE5OSBjaGVjayk6YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBUYWdzIHJlcG9ydGVkIGJ5IHRhZ3MoKTogJHt0YWdzLmxlbmd0aH1gKTtcbiAgICAgICAgICAgIGlmICh0YWdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCcgIE5vIHRhZ3MgZm91bmQgaW4gdGhpcyBzaXRlICh0YWctaW5kZXggY2hlY2sgc2tpcHBlZCknKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHRhZ0lzc3VlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgdGFncykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2cGF0aHMgPSBhd2FpdCBmaWxlY2FjaGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC5kb2N1bWVudHNDYWNoZS5kb2N1bWVudHNXaXRoVGFnKHRhZyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2cGF0aHMpIHx8IHZwYXRocy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCAg4p2MIElTU1VFIERFVEVDVEVEOiB0YWdzKCkgcmVwb3J0ZWQgXCIke3RhZ31cIiBidXQgZG9jdW1lbnRzV2l0aFRhZyhcIiR7dGFnfVwiKSByZXR1cm5lZCBubyBkb2N1bWVudHNgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCAgICAgVGhlIHRhZyBpbmRleCB3YXMgbm90IGZ1bGx5IGNvbW1pdHRlZCBiZWZvcmUgaXNSZWFkeSAoaXNzdWUgIzE5OSlgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzc3VlRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFnSXNzdWUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNtZE9iai52ZXJib3NlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMgdGFnIFwiJHt0YWd9XCIgLT4gJHt2cGF0aHMubGVuZ3RofSBkb2N1bWVudChzKWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGFnSXNzdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIGFsbCAke3RhZ3MubGVuZ3RofSB0YWdzIHJlc29sdmUgdG8gZG9jdW1lbnRzICh0YWcgaW5kZXggY29uc2lzdGVudClgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNzdWVEZXRlY3RlZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcXG7inIUgU1VDQ0VTUzogTm8gZmlsZXMgYWRkZWQgYWZ0ZXIgaXNSZWFkeS4gVGltaW5nIGlzIGNvcnJlY3QuJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1xcbkFsbCBjYWNoZXMgYXJlIHN0YWJsZTonKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMgRG9jdW1lbnRzOiAke2NvdW50c0FmdGVyU2V0dXAuZG9jdW1lbnRzfSBmaWxlc2ApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyBBc3NldHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5hc3NldHN9IGZpbGVzYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIExheW91dHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5sYXlvdXRzfSBmaWxlc2ApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyBQYXJ0aWFsczogJHtjb3VudHNBZnRlclNldHVwLnBhcnRpYWxzfSBmaWxlc2ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdcXG7imqDvuI8gIEZBSUxVUkU6IEZpbGVzIHdlcmUgYWRkZWQgYWZ0ZXIgaXNSZWFkeSB0cmlnZ2VyZWQhJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignICAgVGhpcyBpbmRpY2F0ZXMgYSByYWNlIGNvbmRpdGlvbiB0aGF0IG5lZWRzIHRvIGJlIGZpeGVkLicpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1xcbiAgIFBsZWFzZSByZXBvcnQgdGhpcyBpc3N1ZSBhdDonKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCcgICBodHRwczovL2dpdGh1Yi5jb20vYWthc2hhY21zL2FrYXNoYXJlbmRlci9pc3N1ZXMnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpc3N1ZURldGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjaGVjay1yZWFkeSBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgndmFsaWRhdGUtc2l0ZW1hcCA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1ZhbGlkYXRlIHNpdGVtYXAgWE1MIGZpbGUgYWdhaW5zdCByZW5kZXJlZCBvdXRwdXQgZGlyZWN0b3J5JylcbiAgICAub3B0aW9uKCctLXNpdGVtYXAgPGZpbGVuYW1lPicsICdTaXRlbWFwIGZpbGVuYW1lIHJlbGF0aXZlIHRvIG91dHB1dCBkaXJlY3RvcnknLCAnc2l0ZW1hcC54bWwnKVxuICAgIC5vcHRpb24oJy0tc3RyaWN0JywgJ0V4aXQgd2l0aCBlcnJvciBjb2RlIGlmIHZhbGlkYXRpb24gZmFpbHMnLCBmYWxzZSlcbiAgICAub3B0aW9uKCctLWpzb24nLCAnT3V0cHV0IHJlc3VsdHMgYXMgSlNPTicsIGZhbHNlKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gbmV3IFNpdGVtYXBWYWxpZGF0b3IoY29uZmlnLCBjbWRPYmouc2l0ZW1hcCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB2YWxpZGF0b3IudmFsaWRhdGUoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNtZE9iai5qc29uKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0LCBudWxsLCAyKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFNpdGVtYXBWYWxpZGF0b3IuZm9ybWF0UmVwb3J0KHJlc3VsdCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY21kT2JqLnN0cmljdCAmJiAocmVzdWx0LmludmFsaWRFbnRyaWVzID4gMCB8fCByZXN1bHQuZXJyb3JzLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB2YWxpZGF0ZS1zaXRlbWFwIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbS5wYXJzZShwcm9jZXNzLmFyZ3YpO1xuIl19