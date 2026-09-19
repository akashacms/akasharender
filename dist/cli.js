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
import { loadEnvFiles } from './index.js';
import { fileURLToPath } from 'node:url';
process.title = 'akasharender';
/**
 * Read the AkashaRender package version dynamically from
 * `package.json` at the root of this package.  We resolve the path
 * relative to the compiled `dist/cli.js` file (so `../package.json`)
 * rather than `process.cwd()`, which would be the user's working
 * directory when invoking the CLI.
 */
function readPackageVersion() {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath = path.resolve(here, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version;
}
program.version(readPackageVersion());
/**
 * Collector for the global `--env <path>` option.  Commander invokes
 * this each time the option appears on the command line, letting
 * users declare multiple .env files, e.g.
 *   `akasharender --env .env --env .env.local render config.mjs`.
 */
function collectEnvFile(value, previous) {
    return previous.concat([value]);
}
program
    .option('--env <path>', 'Path to a .env file to load into process.env before running the command.  May be given multiple times; files are loaded in the order supplied.', collectEnvFile, []);
/**
 * Load any `.env` files declared with the global `--env` option into
 * `process.env`.  This should be called at the start of every command's
 * action, before the command reads `process.env` or imports a
 * configuration module (whose evaluation may itself read `process.env`).
 */
function applyEnvOption() {
    const opts = program.opts();
    const envFiles = Array.isArray(opts.env) ? opts.env : [];
    loadEnvFiles(envFiles);
}
program
    .command('env')
    .description('Print the environment variables from process.env after loading any --env files.')
    .action(() => {
    try {
        applyEnvOption();
        // Print sorted by key for a stable, easy-to-scan report.
        const keys = Object.keys(process.env).sort();
        for (const key of keys) {
            console.log(`${key}=${process.env[key]}`);
        }
    }
    catch (e) {
        console.error(`env command ERRORED ${e.stack}`);
    }
});
program
    .command('copy-assets <configFN>')
    .description('Copy assets into output directory')
    .action(async (configFN) => {
    try {
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
        const config = (await import(path.join(process.cwd(), configFN))).default;
        if (typeof cmdObj?.perfDataDir === 'string') {
            config.perfDataDir = cmdObj.perfDataDir;
        }
        let akasha = config.akasha;
        await akasha.setup(config);
        await data.removeAll();
        // console.log(`render-document before renderPath ${documentFN}`);
        let result = await akasha.renderPath(config, documentFN);
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
        applyEnvOption();
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
        let results = await akasha.render(config, {
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
        applyEnvOption();
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
        applyEnvOption();
        const config = (await import(path.join(process.cwd(), configFN))).default;
        let akasha = config.akasha;
        console.log({
            root_url: config.root_url,
            configDir: config.configDir,
            renderDestination: config.renderDestination,
            decomment: config.decomment,
            concurrency: config.concurrency,
            cachingTimeout: config.cachingTimeout,
            documentDirs: config.documentDirs,
            layoutDirs: config.layoutDirs,
            partialDirs: config.partialsDirs,
            assetDirs: config.assetDirs,
            mahafuncs: config.mahafuncs,
            mahabhutaConfig: config.mahabhutaConfig,
            metadata: config.metadata,
            headerJavaScript: config.scripts.javaScriptTop,
            footerJavaScript: config.scripts.javaScriptBottom,
            stylesheets: config.scripts.stylesheets,
            plugins: config.plugins,
            renderers: config.renderers.renderers
        });
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        // options.return_fields = [
        //     'vpath', 'renderPath', 'title'
        // ];
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
        applyEnvOption();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUgsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLE9BQU8sTUFBTSxVQUFVLENBQUM7QUFDL0IsT0FBTyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ3pCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxLQUFLLElBQUksTUFBTSxTQUFTLENBQUM7QUFFaEMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDMUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUl6QyxPQUFPLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQztBQUUvQjs7Ozs7O0dBTUc7QUFDSCxTQUFTLGtCQUFrQjtJQUN2QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDMUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVB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LENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzdELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRVAsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IHByb2dyYW0gfSBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IGdocGFnZXMgZnJvbSAnZ2gtcGFnZXMnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCAqIGFzIGRhdGEgZnJvbSAnLi9kYXRhLmpzJztcbmltcG9ydCAqIGFzIFlBTUwgZnJvbSAnanMteWFtbCc7XG5pbXBvcnQgeyBSZW5kZXJpbmdSZXN1bHRzIH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuaW1wb3J0IHsgcmVmYWN0b3JUYWcgfSBmcm9tICcuL3JlZmFjdG9yLXRhZ3MuanMnO1xuaW1wb3J0IHsgU2l0ZW1hcFZhbGlkYXRvciB9IGZyb20gJy4vc2l0ZW1hcC12YWxpZGF0b3IuanMnO1xuaW1wb3J0IHsgbG9hZEVudkZpbGVzIH0gZnJvbSAnLi9pbmRleC5qcyc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnO1xuXG5cblxucHJvY2Vzcy50aXRsZSA9ICdha2FzaGFyZW5kZXInO1xuXG4vKipcbiAqIFJlYWQgdGhlIEFrYXNoYVJlbmRlciBwYWNrYWdlIHZlcnNpb24gZHluYW1pY2FsbHkgZnJvbVxuICogYHBhY2thZ2UuanNvbmAgYXQgdGhlIHJvb3Qgb2YgdGhpcyBwYWNrYWdlLiAgV2UgcmVzb2x2ZSB0aGUgcGF0aFxuICogcmVsYXRpdmUgdG8gdGhlIGNvbXBpbGVkIGBkaXN0L2NsaS5qc2AgZmlsZSAoc28gYC4uL3BhY2thZ2UuanNvbmApXG4gKiByYXRoZXIgdGhhbiBgcHJvY2Vzcy5jd2QoKWAsIHdoaWNoIHdvdWxkIGJlIHRoZSB1c2VyJ3Mgd29ya2luZ1xuICogZGlyZWN0b3J5IHdoZW4gaW52b2tpbmcgdGhlIENMSS5cbiAqL1xuZnVuY3Rpb24gcmVhZFBhY2thZ2VWZXJzaW9uKCk6IHN0cmluZyB7XG4gICAgY29uc3QgaGVyZSA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xuICAgIGNvbnN0IHBrZ1BhdGggPSBwYXRoLnJlc29sdmUoaGVyZSwgJy4uJywgJ3BhY2thZ2UuanNvbicpO1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBrZ1BhdGgsICd1dGY4JykpO1xuICAgIHJldHVybiBwa2cudmVyc2lvbjtcbn1cblxucHJvZ3JhbS52ZXJzaW9uKHJlYWRQYWNrYWdlVmVyc2lvbigpKTtcblxuLyoqXG4gKiBDb2xsZWN0b3IgZm9yIHRoZSBnbG9iYWwgYC0tZW52IDxwYXRoPmAgb3B0aW9uLiAgQ29tbWFuZGVyIGludm9rZXNcbiAqIHRoaXMgZWFjaCB0aW1lIHRoZSBvcHRpb24gYXBwZWFycyBvbiB0aGUgY29tbWFuZCBsaW5lLCBsZXR0aW5nXG4gKiB1c2VycyBkZWNsYXJlIG11bHRpcGxlIC5lbnYgZmlsZXMsIGUuZy5cbiAqICAgYGFrYXNoYXJlbmRlciAtLWVudiAuZW52IC0tZW52IC5lbnYubG9jYWwgcmVuZGVyIGNvbmZpZy5tanNgLlxuICovXG5mdW5jdGlvbiBjb2xsZWN0RW52RmlsZSh2YWx1ZTogc3RyaW5nLCBwcmV2aW91czogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHByZXZpb3VzLmNvbmNhdChbIHZhbHVlIF0pO1xufVxuXG5wcm9ncmFtXG4gICAgLm9wdGlvbihcbiAgICAgICAgJy0tZW52IDxwYXRoPicsXG4gICAgICAgICdQYXRoIHRvIGEgLmVudiBmaWxlIHRvIGxvYWQgaW50byBwcm9jZXNzLmVudiBiZWZvcmUgcnVubmluZyB0aGUgY29tbWFuZC4gIE1heSBiZSBnaXZlbiBtdWx0aXBsZSB0aW1lczsgZmlsZXMgYXJlIGxvYWRlZCBpbiB0aGUgb3JkZXIgc3VwcGxpZWQuJyxcbiAgICAgICAgY29sbGVjdEVudkZpbGUsXG4gICAgICAgIFtdXG4gICAgKTtcblxuLyoqXG4gKiBMb2FkIGFueSBgLmVudmAgZmlsZXMgZGVjbGFyZWQgd2l0aCB0aGUgZ2xvYmFsIGAtLWVudmAgb3B0aW9uIGludG9cbiAqIGBwcm9jZXNzLmVudmAuICBUaGlzIHNob3VsZCBiZSBjYWxsZWQgYXQgdGhlIHN0YXJ0IG9mIGV2ZXJ5IGNvbW1hbmQnc1xuICogYWN0aW9uLCBiZWZvcmUgdGhlIGNvbW1hbmQgcmVhZHMgYHByb2Nlc3MuZW52YCBvciBpbXBvcnRzIGFcbiAqIGNvbmZpZ3VyYXRpb24gbW9kdWxlICh3aG9zZSBldmFsdWF0aW9uIG1heSBpdHNlbGYgcmVhZCBgcHJvY2Vzcy5lbnZgKS5cbiAqL1xuZnVuY3Rpb24gYXBwbHlFbnZPcHRpb24oKTogdm9pZCB7XG4gICAgY29uc3Qgb3B0cyA9IHByb2dyYW0ub3B0cygpO1xuICAgIGNvbnN0IGVudkZpbGVzOiBzdHJpbmdbXSA9IEFycmF5LmlzQXJyYXkob3B0cy5lbnYpID8gb3B0cy5lbnYgOiBbXTtcbiAgICBsb2FkRW52RmlsZXMoZW52RmlsZXMpO1xufVxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2VudicpXG4gICAgLmRlc2NyaXB0aW9uKCdQcmludCB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZyb20gcHJvY2Vzcy5lbnYgYWZ0ZXIgbG9hZGluZyBhbnkgLS1lbnYgZmlsZXMuJylcbiAgICAuYWN0aW9uKCgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICAvLyBQcmludCBzb3J0ZWQgYnkga2V5IGZvciBhIHN0YWJsZSwgZWFzeS10by1zY2FuIHJlcG9ydC5cbiAgICAgICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9jZXNzLmVudikuc29ydCgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2tleX09JHtwcm9jZXNzLmVudltrZXldfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBlbnYgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2NvcHktYXNzZXRzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignQ29weSBhc3NldHMgaW50byBvdXRwdXQgZGlyZWN0b3J5JylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBhd2FpdCBjb25maWcuY29weUFzc2V0cygpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNvcHktYXNzZXRzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3VtZW50IDxjb25maWdGTj4gPGRvY3VtZW50Rk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBkb2N1bWVudCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGRvY3VtZW50Rk4pID0+IHtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2N1bWVudHMgPSBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZG9jdW1lbnRGTik7XG4gICAgICAgICAgICAvLyBkYXRhOiAke2RvYy5kYXRhfVxuICAgICAgICAgICAgLy8gdGV4dDogJHtkb2MudGV4dH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcbmRvY3BhdGg6ICR7ZG9jLnZwYXRofVxuZnNwYXRoOiAke2RvYy5mc3BhdGh9XG5yZW5kZXJlcjogJHt1dGlsLmluc3BlY3QoY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZG9jLnZwYXRoKSl9XG5yZW5kZXJwYXRoOiAke2RvYy5yZW5kZXJQYXRofVxubW91bnRlZDogJHtkb2MubW91bnRlZH1cbm1vdW50UG9pbnQ6ICR7ZG9jLm1vdW50UG9pbnR9XG5cbm1ldGFkYXRhOiAke3V0aWwuaW5zcGVjdChkb2MubWV0YWRhdGEpfVxuXG5gKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbmZ1bmN0aW9uIGZvcm1hdFJlc3VsdChyZXN1bHQ6IFJlbmRlcmluZ1Jlc3VsdHMpIHtcbiAgICBpZiAocmVzdWx0LnNraXBwZWQpIHtcbiAgICAgICAgcmV0dXJuIGBcblNLSVBQRUQgJHtyZXN1bHQucmVuZGVyRm9ybWF0fSAke3Jlc3VsdC52cGF0aH0gPT0+ICR7cmVzdWx0LnJlbmRlclBhdGh9IChvdXRwdXQgdXAtdG8tZGF0ZSlgO1xuICAgIH1cbiAgICByZXR1cm4gYFxuJHtyZXN1bHQucmVuZGVyRm9ybWF0fSAke3Jlc3VsdC52cGF0aH0gPT0+ICR7cmVzdWx0LnJlbmRlclBhdGh9XG5GSVJTVCAke3Jlc3VsdC5yZW5kZXJGaXJzdEVsYXBzZWR9IExBWU9VVCAke3Jlc3VsdC5yZW5kZXJMYXlvdXRFbGFwc2VkfSBNQUhBICR7cmVzdWx0LnJlbmRlck1haGFFbGFwc2VkfSBUT1RBTCAke3Jlc3VsdC5yZW5kZXJUb3RhbEVsYXBzZWR9YDtcbn1cblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdyZW5kZXItZG9jdW1lbnQgPGNvbmZpZ0ZOPiA8ZG9jdW1lbnRGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUmVuZGVyIGEgZG9jdW1lbnQgaW50byBvdXRwdXQgZGlyZWN0b3J5JylcbiAgICAub3B0aW9uKCctLXBlcmYtZGF0YS1kaXIgPGRhdGFEaXI+JywgJ0RpcmVjdG9yeSBmb3Igb3V0cHV0IG9mIE1haGFiaHV0YSBwZXJmb3JtYW5jZSBtZWFzdXJlbWVudHMnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBkb2N1bWVudEZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNtZE9iaj8ucGVyZkRhdGFEaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnBlcmZEYXRhRGlyID0gY21kT2JqLnBlcmZEYXRhRGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGF3YWl0IGRhdGEucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyLWRvY3VtZW50IGJlZm9yZSByZW5kZXJQYXRoICR7ZG9jdW1lbnRGTn1gKTtcbiAgICAgICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBha2FzaGEucmVuZGVyUGF0aChjb25maWcsIGRvY3VtZW50Rk4pO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGZvcm1hdFJlc3VsdChyZXN1bHQpKTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdC5lcnJvcnMpXG4gICAgICAgICAgICAgICAgJiYgcmVzdWx0LmVycm9ycy5sZW5ndGggPj0gMVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBlcnJvciBvZiByZXN1bHQuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcmVuZGVyLWRvY3VtZW50IGNvbW1hbmQgRVJST1JFRGAsIGUpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncmVuZGVyIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUmVuZGVyIGEgc2l0ZSBpbnRvIG91dHB1dCBkaXJlY3RvcnknKVxuICAgIC5vcHRpb24oJy0tcXVpZXQnLCAnRG8gbm90IHByaW50IHRoZSByZW5kZXJpbmcgcmVwb3J0JylcbiAgICAub3B0aW9uKCctLWNvcHktYXNzZXRzJywgJ0ZpcnN0LCBjb3B5IHRoZSBhc3NldHMnKVxuICAgIC5vcHRpb24oJy0tcmVzdWx0cy10byA8cmVzdWx0RmlsZT4nLCAnU3RvcmUgdGhlIHJlc3VsdHMgaW50byB0aGUgbmFtZWQgZmlsZScpXG4gICAgLm9wdGlvbignLS1wZXJmcmVzdWx0cyA8cGVyZlJlc3VsdHNGaWxlPicsICdTdG9yZSB0aGUgdGltZSB0byByZW5kZXIgZWFjaCBkb2N1bWVudCcpXG4gICAgLm9wdGlvbignLS1mb3JjZS1yZW5kZXItYWxsJywgJ1JlLXJlbmRlciBldmVyeSBkb2N1bWVudCwgaWdub3Jpbmcgb3V0cHV0IGZpbGUgdGltZXN0YW1wcycpXG4gICAgLm9wdGlvbignLS1jYWNoaW5nLXRpbWVvdXQgPHRpbWVvdXQ+JywgJ1RoZSB0aW1lLCBpbiBtaWxpc2Vjb25kcywgdG8gaG9ub3IgZW50cmllcyBpbiB0aGUgc2VhcmNoIGNhY2hlJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgYXdhaXQgZGF0YS5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgIGlmIChjbWRPYmouY29weUFzc2V0cykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNvbmZpZy5jb3B5QXNzZXRzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNtZE9iai5jYWNoaW5nVGltZW91dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuc2V0Q2FjaGluZ1RpbWVvdXQoXG4gICAgICAgICAgICAgICAgICAgIE51bWJlci5wYXJzZUludChjbWRPYmouY2FjaGluZ1RpbWVvdXQpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCByZXN1bHRzID0gPFJlbmRlcmluZ1Jlc3VsdHNbXT4gYXdhaXQgYWthc2hhLnJlbmRlcihjb25maWcsIHtcbiAgICAgICAgICAgICAgICBmb3JjZVJlbmRlckFsbDogY21kT2JqLmZvcmNlUmVuZGVyQWxsID09PSB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghY21kT2JqLnF1aWV0KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcmVzdWx0IG9mIHJlc3VsdHMpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIC0tLSBpZiBBS0FTSEFSRU5ERVJfVFJBQ0VfUkVOREVSIHRoZW4gb3V0cHV0IHRyYWNpbmcgZGF0YVxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIC0tLSBhbHNvIHNldCBwcm9jZXNzLmVudi5HTE9CRlNfVFJBQ0U9MVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZm9ybWF0UmVzdWx0KHJlc3VsdCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQuZXJyb3JzKVxuICAgICAgICAgICAgICAgICAgICAgJiYgcmVzdWx0LmVycm9ycy5sZW5ndGggPj0gMVxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZXJyb3Igb2YgcmVzdWx0LmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVzdWx0c1RvKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3V0cHV0ID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oY21kT2JqLnJlc3VsdHNUbyk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LndyaXRlKGZvcm1hdFJlc3VsdChyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0LmVycm9ycylcbiAgICAgICAgICAgICAgICAgICAgICYmIHJlc3VsdC5lcnJvcnMubGVuZ3RoID49IDFcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQud3JpdGUoZXJyb3Iuc3RhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG91dHB1dC5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5wZXJmcmVzdWx0cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcG9ydHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcG9ydDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWRQYXRoPzogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lPzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3Q/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmQ/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWhhYmh1dGE/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlZD86IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgfSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkUGF0aDogcmVzdWx0LnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiByZXN1bHQucmVuZGVyRm9ybWF0LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogcmVzdWx0LnJlbmRlclN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3Q6IHJlc3VsdC5yZW5kZXJGaXJzdEVsYXBzZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmQ6IHJlc3VsdC5yZW5kZXJMYXlvdXRFbGFwc2VkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFoYWJodXRhOiByZXN1bHQucmVuZGVyTWFoYUVsYXBzZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlZDogcmVzdWx0LnJlbmRlclRvdGFsRWxhcHNlZFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRzLnB1c2gocmVwb3J0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZnNwLndyaXRlRmlsZShjbWRPYmoucGVyZnJlc3VsdHMsXG4gICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShyZXBvcnRzLCB1bmRlZmluZWQsIDQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3V0Zi04Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcmVuZGVyIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdnaC1wYWdlcy1wdWJsaXNoIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUHVibGlzaCBhIHNpdGUgdXNpbmcgR2l0aHViIFBhZ2VzLiAgVGFrZXMgdGhlIHJlbmRlcmluZyBkZXN0aW5hdGlvbiwgYWRkcyBpdCBpbnRvIGEgYnJhbmNoLCBhbmQgcHVzaGVzIHRoYXQgdG8gR2l0aHViJylcbiAgICAub3B0aW9uKCctYiwgLS1icmFuY2ggPGJyYW5jaE5hbWU+JywgJ1RoZSBicmFuY2ggdG8gdXNlIGZvciBwdWJsaXNoaW5nIHRvIEdpdGh1YicpXG4gICAgLm9wdGlvbignLXIsIC0tcmVwbyA8cmVwb1VSTD4nLCAnVGhlIHJlcG9zaXRvcnkgVVJMIHRvIHVzZSBpZiBpdCBtdXN0IGRpZmZlciBmcm9tIHRoZSBVUkwgb2YgdGhlIGxvY2FsIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1yZW1vdGUgPHJlbW90ZU5hbWU+JywgJ1RoZSBHaXQgcmVtb3RlIG5hbWUgdG8gdXNlIGlmIGl0IG11c3QgZGlmZmVyIGZyb20gXCJvcmlnaW5cIicpXG4gICAgLm9wdGlvbignLS10YWcgPHRhZz4nLCAnQW55IHRhZyB0byBhZGQgd2hlbiBwdXNoaW5nIHRvIEdpdGh1YicpXG4gICAgLm9wdGlvbignLS1tZXNzYWdlIDxtZXNzYWdlPicsICdBbnkgR2l0IGNvbW1pdCBtZXNzYWdlJylcbiAgICAub3B0aW9uKCctLXVzZXJuYW1lIDx1c2VybmFtZT4nLCAnR2l0aHViIHVzZXIgbmFtZSB0byB1c2UnKVxuICAgIC5vcHRpb24oJy0tZW1haWwgPGVtYWlsPicsICdHaXRodWIgdXNlciBlbWFpbCB0byB1c2UnKVxuICAgIC5vcHRpb24oJy0tbm9wdXNoJywgJ0RvIG5vdCBwdXNoIHRvIEdpdGh1Yiwgb25seSBjb21taXQnKVxuICAgIC5vcHRpb24oJy0tY25hbWUgPGRvbWFpbj4nLCAnV3JpdGUgb3V0IGEgQ05BTUUgZmlsZSB3aXRoIHRoZSBkb21haW4gbmFtZScpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG5cbiAgICAgICAgICAgIGxldCBvcHRpb25zOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgZG90ZmlsZXM6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoY21kT2JqLmJyYW5jaCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuYnJhbmNoID0gY21kT2JqLmJyYW5jaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVwb1VSTCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMucmVwbyA9IGNtZE9iai5yZXBvVVJMO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5yZW1vdGUpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnJlbW90ZSA9IGNtZE9iai5yZW1vdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLmNuYW1lKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jbmFtZSA9IGNtZE9iai5jbmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoudGFnKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy50YWcgPSBjbWRPYmoudGFnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5tZXNzYWdlID0gY21kT2JqLm1lc3NhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnVzZXJuYW1lIHx8IGNtZE9iai5lbWFpbCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudXNlciA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai51c2VybmFtZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudXNlci5uYW1lID0gY21kT2JqLnVzZXJuYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5lbWFpbCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudXNlci5lbWFpbCA9IGNtZE9iai5lbWFpbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoubm9wdXNoKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5wdXNoID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdGlvbnMubm9qZWt5bGwgPSB0cnVlO1xuICAgICAgICAgICAgb3B0aW9ucy5kb3RmaWxlcyA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBnaC1wYWdlcy1wdWJsaXNoIG9wdGlvbnMgJHtjb25maWcucmVuZGVyRGVzdGluYXRpb259IGNtZE9iaiAke3V0aWwuaW5zcGVjdChjbWRPYmopfSBvcHRpb25zICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMpfWApO1xuXG4gICAgICAgICAgICBnaHBhZ2VzLnB1Ymxpc2goY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCBvcHRpb25zLCBmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICBlbHNlIGNvbnNvbGUubG9nKCdPSycpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGdoLXBhZ2VzLXB1Ymxpc2ggY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY29uZmlnIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUHJpbnQgYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHtcbiAgICAgICAgICAgICAgICByb290X3VybDogY29uZmlnLnJvb3RfdXJsLFxuICAgICAgICAgICAgICAgIGNvbmZpZ0RpcjogY29uZmlnLmNvbmZpZ0RpcixcbiAgICAgICAgICAgICAgICByZW5kZXJEZXN0aW5hdGlvbjogY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLFxuICAgICAgICAgICAgICAgIGRlY29tbWVudDogY29uZmlnLmRlY29tbWVudCxcbiAgICAgICAgICAgICAgICBjb25jdXJyZW5jeTogY29uZmlnLmNvbmN1cnJlbmN5LFxuICAgICAgICAgICAgICAgIGNhY2hpbmdUaW1lb3V0OiBjb25maWcuY2FjaGluZ1RpbWVvdXQsXG4gICAgICAgICAgICAgICAgZG9jdW1lbnREaXJzOiBjb25maWcuZG9jdW1lbnREaXJzLFxuICAgICAgICAgICAgICAgIGxheW91dERpcnM6IGNvbmZpZy5sYXlvdXREaXJzLFxuICAgICAgICAgICAgICAgIHBhcnRpYWxEaXJzOiBjb25maWcucGFydGlhbHNEaXJzLFxuICAgICAgICAgICAgICAgIGFzc2V0RGlyczogY29uZmlnLmFzc2V0RGlycyxcbiAgICAgICAgICAgICAgICBtYWhhZnVuY3M6IGNvbmZpZy5tYWhhZnVuY3MsXG4gICAgICAgICAgICAgICAgbWFoYWJodXRhQ29uZmlnOiBjb25maWcubWFoYWJodXRhQ29uZmlnLFxuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiBjb25maWcubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgaGVhZGVySmF2YVNjcmlwdDogY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdFRvcCxcbiAgICAgICAgICAgICAgICBmb290ZXJKYXZhU2NyaXB0OiBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tLFxuICAgICAgICAgICAgICAgIHN0eWxlc2hlZXRzOiBjb25maWcuc2NyaXB0cy5zdHlsZXNoZWV0cyxcbiAgICAgICAgICAgICAgICBwbHVnaW5zOiBjb25maWcucGx1Z2lucyxcbiAgICAgICAgICAgICAgICByZW5kZXJlcnM6IGNvbmZpZy5yZW5kZXJlcnMucmVuZGVyZXJzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgY29uZmlnIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdwbHVnaW5zIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgcGx1Z2lucycpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLnBsdWdpbnMpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNvbmZpZyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZG9jZGlycyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGRvY3VtZW50cyBkaXJlY3RvcmllcyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcuZG9jdW1lbnREaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdhc3NldGRpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBhc3NldHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLmFzc2V0RGlycyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdwYXJ0aWFsZGlycyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHBhcnRpYWxzIGRpcmVjdG9yaWVzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5wYXJ0aWFsc0RpcnMpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHBhcnRpYWxkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdsYXlvdXRzZGlycyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGxheW91dHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLmxheW91dERpcnMpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGxheW91dHNkaXJzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3VtZW50cyA8Y29uZmlnRk4+IFtyb290UGF0aF0nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnRzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcm9vdFBhdGgpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnBhdGhzKHJvb3RQYXRoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jdW1lbnRzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2NzLXNldC1kYXRlcyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1NldCB0aGUgYVRpbWUgYW5kIG1UaW1lIGZvciBkb2N1bWVudHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5zZXRUaW1lcygpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NzLXNldC1kYXRlcyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZG9jaW5mbyA8Y29uZmlnRk4+IDxkb2NGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2hvdyBpbmZvcm1hdGlvbiBhYm91dCBhIGRvY3VtZW50IGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgZG9jRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5maW5kKGRvY0ZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBkb2NGTiAke2RvY0ZOfSBgLCBkb2NpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdpbmRleC1maWxlcyA8Y29uZmlnRk4+IFtyb290UGF0aF0nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgaW5kZXggcGFnZXMgKGluZGV4Lmh0bWwpIHVuZGVyIHRoZSBnaXZlbiBkaXJlY3RvcnknKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCByb290UGF0aCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY2luZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLmluZGV4RmlsZXMocm9vdFBhdGgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGluZGV4ZXMgJHtyb290UGF0aH0gYCwgZG9jaW5mby5tYXAoaW5kZXggPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHZwYXRoOiBpbmRleC52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGF0aDogaW5kZXgucmVuZGVyUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogaW5kZXgubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZDogaW5kZXgucGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgZGlybmFtZTogaW5kZXguZGlybmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbmRleC1maWxlcyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnaW5kZXgtY2hhaW4gPGNvbmZpZ0ZOPiBzdGFydFBhdGgnKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgaW5kZXggY2hhaW4gc3RhcnRpbmcgZnJvbSB0aGUgcGF0aCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHN0YXJ0UGF0aCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY2luZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLmluZGV4Q2hhaW4oc3RhcnRQYXRoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBpbmRleCBjaGFpbiAke3N0YXJ0UGF0aH0gYCwgZG9jaW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW5kZXgtY2hhaW4gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3NpYmxpbmdzIDxjb25maWdGTj4gPHZwYXRoPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBzaWJsaW5nIHBhZ2VzIHRvIHRoZSBuYW1lZCBkb2N1bWVudCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHZwYXRoKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgZG9jaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2libGluZ3ModnBhdGgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYHNpYmxpbmdzICR7dnBhdGh9IGAsIGRvY2luZm8ubWFwKGluZGV4ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogaW5kZXgudnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZGV4LnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZGV4Lm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZGV4LnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIGRpcm5hbWU6IGluZGV4LmRpcm5hbWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc2libGluZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3Mtc2VtYW50aWMgPGNvbmZpZ0ZOPiA8c2VhcmNoRm9yPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudCB2cGF0aHMgc2VtYW50aWNhbGx5IG1hdGNoaW5nIHRoZSBzdHJpbmcnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBzZWFyY2hGb3IpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnNlbWFudGljU2VhcmNoRG9jcyhzZWFyY2hGb3IpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NzLXNlbWFudGljIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCd0YWdzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgdGFncycpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgdGFncyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUudGFncygpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coWUFNTC5kdW1wKHsgdGFncyB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdGFncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnc2ltaWxhci10YWdzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignRmluZCBncm91cHMgb2Ygc2ltaWxhciB0YWdzJylcbiAgICAub3B0aW9uKCctLXRocmVzaG9sZCA8bj4nLCAnTGV2ZW5zaHRlaW4gZGlzdGFuY2UgdGhyZXNob2xkJywgJzInKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgdGhyZXNob2xkID0gcGFyc2VJbnQoY21kT2JqLnRocmVzaG9sZCwgMTApO1xuICAgICAgICAgICAgY29uc3QgZ3JvdXBzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5maW5kU2ltaWxhclRhZ3ModGhyZXNob2xkKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHNpbWlsYXJUYWdHcm91cHM6IGdyb3VwcyB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc2ltaWxhci10YWdzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCd0YWdzLXdpdGhvdXQtZGVzY3JpcHRpb25zIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0YWdzIHRoYXQgaGF2ZSBubyBkZXNjcmlwdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgdGFncyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUudGFnc1dpdGhvdXREZXNjcmlwdGlvbnMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHRhZ3NXaXRob3V0RGVzY3JpcHRpb25zOiB0YWdzIH0sIHsgaW5kZW50OiA0IH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB0YWdzLXdpdGhvdXQtZGVzY3JpcHRpb25zIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCd1bnVzZWQtdGFnLWRlc2NyaXB0aW9ucyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGFnIGRlc2NyaXB0aW9ucyB0aGF0IGFyZSBub3QgdXNlZCBieSBhbnkgZG9jdW1lbnQnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnVudXNlZFRhZ0Rlc2NyaXB0aW9ucygpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coWUFNTC5kdW1wKHsgdW51c2VkVGFnRGVzY3JpcHRpb25zOiB0YWdzIH0sIHsgaW5kZW50OiA0IH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB1bnVzZWQtdGFnLWRlc2NyaXB0aW9ucyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncmVmYWN0b3ItdGFnIDxjb25maWdGTj4gPG9sZFRhZz4gPG5ld1RhZz4nKVxuICAgIC5kZXNjcmlwdGlvbignUmVuYW1lIGEgdGFnIGFjcm9zcyBhbGwgZG9jdW1lbnRzJylcbiAgICAub3B0aW9uKCctLWRyeS1ydW4nLCAnTGlzdCBjaGFuZ2VzIHdpdGhvdXQgbW9kaWZ5aW5nIGZpbGVzJywgZmFsc2UpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIG9sZFRhZywgbmV3VGFnLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVmYWN0b3JUYWcoY29uZmlnLCBvbGRUYWcsIG5ld1RhZywge1xuICAgICAgICAgICAgICAgIGRyeVJ1bjogY21kT2JqLmRyeVJ1blxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhZQU1MLmR1bXAoeyByZWZhY3RvclJlc3VsdDogcmVzdWx0IH0sIHsgaW5kZW50OiA0IH0pKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByZWZhY3Rvci10YWcgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3Mtd2l0aC10YWcgPGNvbmZpZ0ZOPiA8dGFncy4uLj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnQgdnBhdGhzIGZvciBnaXZlbiB0YWdzJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgdGFncykgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlXG4gICAgICAgICAgICAgICAgLmRvY3VtZW50c0NhY2hlLmRvY3VtZW50c1dpdGhUYWcodGFncykpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3Mtd2l0aC10YWdzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdjaGlsZC1pdGVtLXRyZWUgPGNvbmZpZ0ZOPiA8cm9vdFBhdGg+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGRvY3VtZW50cyB1bmRlciBhIGdpdmVuIGxvY2F0aW9uIGJ5IHRyZWUnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCByb290UGF0aCkgPT4ge1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgIFlBTUwuZHVtcCh7XG4gICAgICAgICAgICAgICAgICAgIHRyZWU6IGF3YWl0IGFrYXNoYS5maWxlY2FjaGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC5kb2N1bWVudHNDYWNoZS5jaGlsZEl0ZW1UcmVlKHJvb3RQYXRoKVxuICAgICAgICAgICAgICAgIH0sIHsgaW5kZW50OiA0IH0pXG4gICAgICAgICAgICAgICAgLy8gLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHZwYXRoOiBpdGVtLnZwYXRoLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogaXRlbS5yZW5kZXJQYXRoXG4gICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnc2VhcmNoIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2VhcmNoIGZvciBkb2N1bWVudHMnKVxuICAgIC5vcHRpb24oJy0tcm9vdCA8cm9vdFBhdGg+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIHdpdGhpbiB0aGUgbmFtZWQgZGlyZWN0b3J5JylcbiAgICAub3B0aW9uKCctLW1hdGNoIDxwYXRobWF0Y2g+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSByZWd1bGFyIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tcmVuZGVybWF0Y2ggPHJlbmRlcnBhdGhtYXRjaD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbicpXG4gICAgLm9wdGlvbignLS1nbG9iIDxnbG9ibWF0Y2g+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSBnbG9iIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tcmVuZGVyZ2xvYiA8Z2xvYm1hdGNoPicsICdTZWxlY3Qgb25seSBmaWxlcyByZW5kZXJpbmcgdG8gdGhlIGdsb2IgZXhwcmVzc2lvbicpXG4gICAgLm9wdGlvbignLS1wYXJlbnREaXIgPHBhdGg+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIHdob3NlIHBhcmVudCBkaXJlY3RvcnkgaXMgdGhlIG5hbWVkIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1kaXJuYW1lIDxwYXRoPicsICdTZWxlY3Qgb25seSBmaWxlcyB3aXRoaW4gdGhlIG5hbWVkIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1za2lwZ2xvYiA8Z2xvYm1hdGNoPicsICdTa2lwIGZpbGVzIG1hdGNoaW5nIHRoZSBnbG9iIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tbGF5b3V0cyA8bGF5b3V0cy4uLj4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIGxheW91dHMnKVxuICAgIC5vcHRpb24oJy0tbWltZSA8bWltZT4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgbWF0Y2hpbmcgdGhlIE1JTUUgdHlwZScpXG4gICAgLm9wdGlvbignLS10YWdzIDx0YWdzLi4uPicsICdTZWxlY3Qgb25seSBmaWxlcyB3aXRoIHRoZSB0YWdzJylcbiAgICAub3B0aW9uKCctLWJsb2d0YWdzIDxibG9ndGFncy4uLj4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgd2l0aCB0aGUgYmxvZ3RhZ3MnKVxuICAgIC5vcHRpb24oJy0tbGltaXQgPGxpbWl0PicsICdSZXR1cm4gb25seSBzbyBtYW55IGl0ZW1zJylcbiAgICAub3B0aW9uKCctLW9mZnNldCA8b2Zmc2V0PicsICdSZXR1cm4gb25seSBpdGVtcyBzdGFydGluZyBmcm9tIHRoZSBvZmZzZXQgd2l0aGluIHRoZSByZXN1bHQgc2V0JylcbiAgICAub3B0aW9uKCctLXNvcnQtYnkgPGZpZWxkPicsICdTb3J0IHJlc3VsdHMgYnkgYSBkb2N1bWVudCBjb2x1bW4gb3IgZnJvbnRtYXR0ZXIgZmllbGQnKVxuICAgIC5vcHRpb24oJy0tc29ydCA8ZGlyZWN0aW9uPicsICdTb3J0IGRpcmVjdGlvbiwgZWl0aGVyIFwiYXNjXCIgb3IgXCJkZXNjXCInKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhjbWRPYmopO1xuICAgICAgICAgICAgbGV0IG9wdGlvbnM6IGFueSA9IHsgfTtcbiAgICAgICAgICAgIGlmIChjbWRPYmoucm9vdCkgb3B0aW9ucy5yb290UGF0aCA9IGNtZE9iai5yb290O1xuICAgICAgICAgICAgaWYgKGNtZE9iai5wYXJlbnREaXIpIG9wdGlvbnMucGFyZW50RGlyID0gY21kT2JqLnBhcmVudERpcjtcbiAgICAgICAgICAgIGlmIChjbWRPYmouZGlybmFtZSkgb3B0aW9ucy5kaXJuYW1lID0gY21kT2JqLmRpcm5hbWU7XG4gICAgICAgICAgICBpZiAoY21kT2JqLm1hdGNoKSBvcHRpb25zLnBhdGhtYXRjaCA9IGNtZE9iai5tYXRjaDtcbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVuZGVybWF0Y2gpIG9wdGlvbnMucmVuZGVycGF0aG1hdGNoID0gY21kT2JqLnJlbmRlcm1hdGNoO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5nbG9iKSBvcHRpb25zLmdsb2IgPSBjbWRPYmouZ2xvYjtcbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVuZGVyZ2xvYikgb3B0aW9ucy5yZW5kZXJnbG9iID0gY21kT2JqLnJlbmRlcmdsb2I7XG4gICAgICAgICAgICBpZiAoY21kT2JqLnNraXBnbG9iKSBvcHRpb25zLnNraXBnbG9iID0gY21kT2JqLnNraXBnbG9iO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5sYXlvdXRzKSBvcHRpb25zLmxheW91dHMgPSBjbWRPYmoubGF5b3V0cztcbiAgICAgICAgICAgIGlmIChjbWRPYmoubWltZSkgb3B0aW9ucy5taW1lID0gY21kT2JqLm1pbWU7XG4gICAgICAgICAgICBpZiAoY21kT2JqLnRhZ3MpIG9wdGlvbnMudGFnID0gY21kT2JqLnRhZ3M7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmJsb2d0YWdzKSBvcHRpb25zLmJsb2d0YWdzID0gY21kT2JqLmJsb2d0YWdzO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5saW1pdCkgb3B0aW9ucy5saW1pdCA9IGNtZE9iai5saW1pdDtcbiAgICAgICAgICAgIGlmIChjbWRPYmoub2Zmc2V0KSBvcHRpb25zLm9mZnNldCA9IGNtZE9iai5vZmZzZXQ7XG4gICAgICAgICAgICBpZiAoY21kT2JqLnNvcnRCeSkge1xuICAgICAgICAgICAgICAgIC8vIHNvcnQtYnkgbWF5IG5hbWUgYSBkb2N1bWVudCBjb2x1bW4gKHN1Y2ggYXMgdGl0bGUsXG4gICAgICAgICAgICAgICAgLy8gcmVuZGVyUGF0aCwgdnBhdGgsIHBhcmVudERpciwgb3IgcHVibGljYXRpb25UaW1lKSBvciBhbnlcbiAgICAgICAgICAgICAgICAvLyBmcm9udG1hdHRlciBmaWVsZCAoc3VjaCBhcyBhIGN1c3RvbSBgc3RlcGAgb3JkZXJpbmdcbiAgICAgICAgICAgICAgICAvLyBmaWVsZCkuICBUaGUgc2VhcmNoIHF1ZXJ5IHNvcnRzIGJ5IGEgY29sdW1uIHdoZW4gdGhlIG5hbWVcbiAgICAgICAgICAgICAgICAvLyBtYXRjaGVzIG9uZSwgYW5kIG90aGVyd2lzZSBleHRyYWN0cyB0aGUgdmFsdWUgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAvLyBKU09OIG1ldGFkYXRhLiAgR3VhcmQgYWdhaW5zdCBuYW1lcyB0aGF0IGNvdWxkIG5vdCBiZSBhXG4gICAgICAgICAgICAgICAgLy8gc2FmZSBmcm9udG1hdHRlciBrZXksIG1hdGNoaW5nIERvY3VtZW50R3JvdXAgaW4gYnVpbHQtaW4udHMuXG4gICAgICAgICAgICAgICAgaWYgKCFjbWRPYmouc29ydEJ5Lm1hdGNoKC9eW0EtWmEtel9dW0EtWmEtejAtOV8tXSokLykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggc29ydC1ieSBpbmNvcnJlY3QgJHtjbWRPYmouc29ydEJ5fWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvcHRpb25zLnNvcnRCeSA9IGNtZE9iai5zb3J0Qnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnNvcnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNtZE9iai5zb3J0Lm1hdGNoKC9eKGFzY3xkZXNjKSQvKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlYXJjaCBzb3J0IGluY29ycmVjdCAke2NtZE9iai5zb3J0fWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvcHRpb25zLnNvcnRCeURlc2NlbmRpbmcgPSBjbWRPYmouc29ydCA9PT0gJ2Rlc2MnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gb3B0aW9ucy5yZXR1cm5fZmllbGRzID0gW1xuICAgICAgICAgICAgLy8gICAgICd2cGF0aCcsICdyZW5kZXJQYXRoJywgJ3RpdGxlJ1xuICAgICAgICAgICAgLy8gXTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKG9wdGlvbnMpO1xuICAgICAgICAgICAgbGV0IGRvY3MgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnNlYXJjaChvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRvY3NcbiAgICAgICAgICAgIC8vIC5tYXAoZG9jID0+IHtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogZG9jLnZwYXRoLFxuICAgICAgICAgICAgLy8gICAgICAgICByZW5kZXJQYXRoOiBkb2MucmVuZGVyUGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgZGlybmFtZTogZG9jLmRpcm5hbWVcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgLy8gLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiB7XG4gICAgICAgICAgICAvLyAgICAgdmFyIHRhZ0EgPSBhLmRpcm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIC8vICAgICB2YXIgdGFnQiA9IGIuZGlybmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgLy8gICAgIGlmICh0YWdBIDwgdGFnQikgcmV0dXJuIC0xO1xuICAgICAgICAgICAgLy8gICAgIGlmICh0YWdBID4gdGFnQikgcmV0dXJuIDE7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgLy8gLnJldmVyc2UoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBzZWFyY2ggY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2Fzc2V0cyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGFzc2V0cyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlLnBhdGhzKCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnYXNzZXRpbmZvIDxjb25maWdGTj4gPGRvY0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGFuIGFzc2V0IGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgYXNzZXRGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0aW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGUuZmluZChhc3NldEZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGFzc2V0aW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgYXNzZXRpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdsYXlvdXRzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgbGF5b3V0cyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZS5wYXRocygpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuLy8gVE9ETyBib3RoIHRlc3QuaHRtbCBhbmQgdGVzdC5odG1sLm5qayBtYXRjaFxuLy8gICAgICBUaGlzIGlzIHByb2JhYmx5IGluY29ycmVjdCwgc2luY2Ugd2UgZG8gbm90IHJlbmRlciB0aGVzZSBmaWxlc1xuLy8gICAgICBUaGUgcGFydGlhbHMgZGlyZWN0b3J5IGhhcyB0aGUgc2FtZSBwcm9ibGVtXG4vLyAgICAgIFNvbWUga2luZCBvZiBmbGFnIG9uIGNyZWF0aW5nIHRoZSBGaWxlQ2FjaGUgdG8gY2hhbmdlIHRoZSBiZWhhdmlvclxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2xheW91dGluZm8gPGNvbmZpZ0ZOPiA8ZG9jRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBsYXlvdXQgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBsYXlvdXRGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dGluZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmxheW91dHNDYWNoZS5maW5kKGxheW91dEZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGxheW91dGluZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGxheW91dGluZm8gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BhcnRpYWxzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgcGFydGlhbHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLnBhdGhzKCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHBhcnRpYWxzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuLy8gVE9ETyBib3RoIHRlc3QuaHRtbCBhbmQgdGVzdC5odG1sLm5qayBtYXRjaFxuLy8gICAgICBUaGlzIGlzIHByb2JhYmx5IGluY29ycmVjdCwgc2luY2Ugd2UgZG8gbm90IHJlbmRlciB0aGVzZSBmaWxlc1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3BhcnRpYWxpbmZvIDxjb25maWdGTj4gPGRvY0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGEgcGFydGlhbCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHBhcnRpYWxGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLmZpbmQocGFydGlhbEZOKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBhcnRpYWxpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsaW5mbyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnaW5kZXggPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMb2FkcyBjb25maWd1cmF0aW9uLCBpbmRleGVzIGNvbnRlbnQsIHRoZW4gZXhpdHMnKVxuICAgIC5vcHRpb24oJy0tdmVyYm9zZScsICdTaG93IGRldGFpbGVkIGV2ZW50IHRyYWNraW5nIChhZGRlZCwgcmVhZHksIGVycm9yIGV2ZW50cyknKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNtZE9iai52ZXJib3NlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0luZGV4aW5nIGZpbGVzIHdpdGggdmVyYm9zZSBvdXRwdXQuLi5cXG4nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIEVuYWJsZSB2ZXJib3NlIG1vZGUgaW4gY29uZmlnXG4gICAgICAgICAgICAgICAgY29uZmlnLnZlcmJvc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IHNldHVwVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxhcHNlZCA9IHNldHVwVGltZSAtIHN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBHZXQgZmlsZSBjb3VudHNcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlY2FjaGUgPSBha2FzaGEuZmlsZWNhY2hlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50Q291bnQgPSAoYXdhaXQgZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnBhdGhzKCkpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldENvdW50ID0gKGF3YWl0IGZpbGVjYWNoZS5hc3NldHNDYWNoZS5wYXRocygpKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgbGF5b3V0Q291bnQgPSAoYXdhaXQgZmlsZWNhY2hlLmxheW91dHNDYWNoZS5wYXRocygpKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFydGlhbENvdW50ID0gKGF3YWl0IGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLnBhdGhzKCkpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg4pyTIEluZGV4aW5nIGNvbXBsZXRlZCBpbiAke2VsYXBzZWR9bXNcXG5gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPT09IFN1bW1hcnkgPT09Jyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYERvY3VtZW50czogJHtkb2N1bWVudENvdW50fSBmaWxlc2ApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBc3NldHM6ICR7YXNzZXRDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgTGF5b3V0czogJHtsYXlvdXRDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUGFydGlhbHM6ICR7cGFydGlhbENvdW50fSBmaWxlc2ApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBUb3RhbDogJHtkb2N1bWVudENvdW50ICsgYXNzZXRDb3VudCArIGxheW91dENvdW50ICsgcGFydGlhbENvdW50fSBmaWxlc2ApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBOb3JtYWwgbW9kZSAtIGp1c3Qgc2V0dXBcbiAgICAgICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluZGV4IGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdjaGVjay1yZWFkeSA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1ZlcmlmeSB0aGF0IGFsbCBmaWxlcyBhcmUgbG9hZGVkIGJlZm9yZSBpc1JlYWR5IHRyaWdnZXJzIChkaWFnbm9zdGljIHRvb2wpJylcbiAgICAub3B0aW9uKCctLXZlcmJvc2UnLCAnU2hvdyBkZXRhaWxlZCBmaWxlLWJ5LWZpbGUgdHJhY2tpbmcnKVxuICAgIC5vcHRpb24oJy0tZGVsYXkgPG1zPicsICdXYWl0IHRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIGNoZWNrIGZvciBsYXRlIGFkZGl0aW9ucyAoZGVmYXVsdDogMjAwMCknLCAnMjAwMCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUnVubmluZyBpc1JlYWR5IHRpbWluZyBjaGVjay4uLlxcbicpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDYXB0dXJlIGluaXRpYWwgc3RhdGVcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHNldHVwVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEdldCBjb3VudHMgaW1tZWRpYXRlbHkgYWZ0ZXIgc2V0dXBcbiAgICAgICAgICAgIGNvbnN0IGZpbGVjYWNoZSA9IGFrYXNoYS5maWxlY2FjaGU7XG4gICAgICAgICAgICBjb25zdCBjb3VudHNBZnRlclNldHVwID0ge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50czogKGF3YWl0IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYXNzZXRzOiAoYXdhaXQgZmlsZWNhY2hlLmFzc2V0c0NhY2hlLnBhdGhzKCkpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBsYXlvdXRzOiAoYXdhaXQgZmlsZWNhY2hlLmxheW91dHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgcGFydGlhbHM6IChhd2FpdCBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5wYXRocygpKS5sZW5ndGhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinJMgU2V0dXAgY29tcGxldGVkIGluICR7c2V0dXBUaW1lIC0gc3RhcnRUaW1lfW1zYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBEb2N1bWVudHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5kb2N1bWVudHN9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBBc3NldHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5hc3NldHN9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBMYXlvdXRzOiAke2NvdW50c0FmdGVyU2V0dXAubGF5b3V0c31gKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIFBhcnRpYWxzOiAke2NvdW50c0FmdGVyU2V0dXAucGFydGlhbHN9YCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFdhaXQgc3BlY2lmaWVkIGRlbGF5IHRvIHNlZSBpZiBhbnkgYWRkaXRpb25hbCBmaWxlcyBhcHBlYXJcbiAgICAgICAgICAgIGNvbnN0IGRlbGF5TXMgPSBwYXJzZUludChjbWRPYmouZGVsYXkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFxcbldhaXRpbmcgJHtkZWxheU1zfW1zIHRvIGNoZWNrIGZvciBsYXRlIGFkZGl0aW9ucy4uLmApO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGRlbGF5TXMpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgY291bnRzQWZ0ZXJEZWxheSA9IHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudHM6IChhd2FpdCBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGFzc2V0czogKGF3YWl0IGZpbGVjYWNoZS5hc3NldHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgbGF5b3V0czogKGF3YWl0IGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHBhcnRpYWxzOiAoYXdhaXQgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUucGF0aHMoKSkubGVuZ3RoXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDb21wYXJlIGNvdW50c1xuICAgICAgICAgICAgbGV0IGlzc3VlRGV0ZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrQ2FjaGUgPSAobmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmVmb3JlID0gY291bnRzQWZ0ZXJTZXR1cFtuYW1lXTtcbiAgICAgICAgICAgICAgICBjb25zdCBhZnRlciA9IGNvdW50c0FmdGVyRGVsYXlbbmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKGJlZm9yZSAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgXFxu4p2MIElTU1VFIERFVEVDVEVEOiAke25hbWV9IGNvdW50IGNoYW5nZWQgZnJvbSAke2JlZm9yZX0gdG8gJHthZnRlcn1gKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgICAgVGhpcyBpbmRpY2F0ZXMgZmlsZXMgd2VyZSBhZGRlZCBhZnRlciBpc1JlYWR5IWApO1xuICAgICAgICAgICAgICAgICAgICBpc3N1ZURldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbWRPYmoudmVyYm9zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOKckyAke25hbWV9OiAke2JlZm9yZX0gZmlsZXMgKHN0YWJsZSlgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXFxuUmVzdWx0czonKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY3NPayA9IGNoZWNrQ2FjaGUoJ2RvY3VtZW50cycpO1xuICAgICAgICAgICAgY29uc3QgYXNzZXRzT2sgPSBjaGVja0NhY2hlKCdhc3NldHMnKTtcbiAgICAgICAgICAgIGNvbnN0IGxheW91dHNPayA9IGNoZWNrQ2FjaGUoJ2xheW91dHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxzT2sgPSBjaGVja0NhY2hlKCdwYXJ0aWFscycpO1xuXG4gICAgICAgICAgICAvLyBUYWctaW5kZXggcmVhZGluZXNzL2NvbnNpc3RlbmN5IGNoZWNrIChHaXRIdWIgaXNzdWUgIzE5OSkuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gVGhlICMxOTkgc3ltcHRvbSBpcyBzdWJ0bGVyIHRoYW4gYSBjaGFuZ2luZyBmaWxlIGNvdW50OlxuICAgICAgICAgICAgLy8gZG9jdW1lbnRzQ2FjaGUudGFncygpIHJldHVybmVkIFtdIHJpZ2h0IGFmdGVyIHNldHVwKCkgZXZlblxuICAgICAgICAgICAgLy8gdGhvdWdoIGRvY3VtZW50c1dpdGhUYWcoKSByZXR1cm5lZCByb3dzIGZvciB0aGUgc2FtZSB0YWdzLFxuICAgICAgICAgICAgLy8gYmVjYXVzZSB0aGUgVEFHR0xVRSB0YWcgaW5kZXggd2FzIG5vdCBjb21taXR0ZWQgYmVmb3JlXG4gICAgICAgICAgICAvLyBpc1JlYWR5IHRyaWdnZXJlZC4gIFZlcmlmeSB0aGF0IHRhZ3MoKSBpcyBwb3B1bGF0ZWQgYW5kIHRoYXRcbiAgICAgICAgICAgIC8vIGV2ZXJ5IHJlcG9ydGVkIHRhZyByZXNvbHZlcyB0byBhdCBsZWFzdCBvbmUgZG9jdW1lbnQuXG4gICAgICAgICAgICBjb25zdCB0YWdzID0gYXdhaXQgZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnRhZ3MoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcXG5UYWcgaW5kZXggKGlzc3VlICMxOTkgY2hlY2spOmApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgVGFncyByZXBvcnRlZCBieSB0YWdzKCk6ICR7dGFncy5sZW5ndGh9YCk7XG4gICAgICAgICAgICBpZiAodGFncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnICBObyB0YWdzIGZvdW5kIGluIHRoaXMgc2l0ZSAodGFnLWluZGV4IGNoZWNrIHNraXBwZWQpJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCB0YWdJc3N1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdGFnIG9mIHRhZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdnBhdGhzID0gYXdhaXQgZmlsZWNhY2hlXG4gICAgICAgICAgICAgICAgICAgICAgICAuZG9jdW1lbnRzQ2FjaGUuZG9jdW1lbnRzV2l0aFRhZyh0YWcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodnBhdGhzKSB8fCB2cGF0aHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAgIOKdjCBJU1NVRSBERVRFQ1RFRDogdGFncygpIHJlcG9ydGVkIFwiJHt0YWd9XCIgYnV0IGRvY3VtZW50c1dpdGhUYWcoXCIke3RhZ31cIikgcmV0dXJuZWQgbm8gZG9jdW1lbnRzYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAgICAgIFRoZSB0YWcgaW5kZXggd2FzIG5vdCBmdWxseSBjb21taXR0ZWQgYmVmb3JlIGlzUmVhZHkgKGlzc3VlICMxOTkpYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc3N1ZURldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ0lzc3VlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjbWRPYmoudmVyYm9zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIHRhZyBcIiR7dGFnfVwiIC0+ICR7dnBhdGhzLmxlbmd0aH0gZG9jdW1lbnQocylgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRhZ0lzc3VlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyBhbGwgJHt0YWdzLmxlbmd0aH0gdGFncyByZXNvbHZlIHRvIGRvY3VtZW50cyAodGFnIGluZGV4IGNvbnNpc3RlbnQpYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWlzc3VlRGV0ZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnXFxu4pyFIFNVQ0NFU1M6IE5vIGZpbGVzIGFkZGVkIGFmdGVyIGlzUmVhZHkuIFRpbWluZyBpcyBjb3JyZWN0LicpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcXG5BbGwgY2FjaGVzIGFyZSBzdGFibGU6Jyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIERvY3VtZW50czogJHtjb3VudHNBZnRlclNldHVwLmRvY3VtZW50c30gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMgQXNzZXRzOiAke2NvdW50c0FmdGVyU2V0dXAuYXNzZXRzfSBmaWxlc2ApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyBMYXlvdXRzOiAke2NvdW50c0FmdGVyU2V0dXAubGF5b3V0c30gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMgUGFydGlhbHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5wYXJ0aWFsc30gZmlsZXNgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignXFxu4pqg77iPICBGQUlMVVJFOiBGaWxlcyB3ZXJlIGFkZGVkIGFmdGVyIGlzUmVhZHkgdHJpZ2dlcmVkIScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyAgIFRoaXMgaW5kaWNhdGVzIGEgcmFjZSBjb25kaXRpb24gdGhhdCBuZWVkcyB0byBiZSBmaXhlZC4nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdcXG4gICBQbGVhc2UgcmVwb3J0IHRoaXMgaXNzdWUgYXQ6Jyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignICAgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaXNzdWVEZXRlY3RlZCkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgY2hlY2stcmVhZHkgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3ZhbGlkYXRlLXNpdGVtYXAgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdWYWxpZGF0ZSBzaXRlbWFwIFhNTCBmaWxlIGFnYWluc3QgcmVuZGVyZWQgb3V0cHV0IGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1zaXRlbWFwIDxmaWxlbmFtZT4nLCAnU2l0ZW1hcCBmaWxlbmFtZSByZWxhdGl2ZSB0byBvdXRwdXQgZGlyZWN0b3J5JywgJ3NpdGVtYXAueG1sJylcbiAgICAub3B0aW9uKCctLXN0cmljdCcsICdFeGl0IHdpdGggZXJyb3IgY29kZSBpZiB2YWxpZGF0aW9uIGZhaWxzJywgZmFsc2UpXG4gICAgLm9wdGlvbignLS1qc29uJywgJ091dHB1dCByZXN1bHRzIGFzIEpTT04nLCBmYWxzZSlcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCB2YWxpZGF0b3IgPSBuZXcgU2l0ZW1hcFZhbGlkYXRvcihjb25maWcsIGNtZE9iai5zaXRlbWFwKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHZhbGlkYXRvci52YWxpZGF0ZSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY21kT2JqLmpzb24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHQsIG51bGwsIDIpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coU2l0ZW1hcFZhbGlkYXRvci5mb3JtYXRSZXBvcnQocmVzdWx0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChjbWRPYmouc3RyaWN0ICYmIChyZXN1bHQuaW52YWxpZEVudHJpZXMgPiAwIHx8IHJlc3VsdC5lcnJvcnMubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHZhbGlkYXRlLXNpdGVtYXAgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtLnBhcnNlKHByb2Nlc3MuYXJndik7XG4iXX0=