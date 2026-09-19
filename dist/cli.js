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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUgsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLE9BQU8sTUFBTSxVQUFVLENBQUM7QUFDL0IsT0FBTyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ3pCLE9BQU8sRUFBRSxRQUFRLElBQUksR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxLQUFLLElBQUksTUFBTSxTQUFTLENBQUM7QUFFaEMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDMUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUl6QyxPQUFPLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQztBQUUvQjs7Ozs7O0dBTUc7QUFDSCxTQUFTLGtCQUFrQjtJQUN2QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDMUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN6RCxPQUFPLEdB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T0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IHByb2dyYW0gfSBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IGdocGFnZXMgZnJvbSAnZ2gtcGFnZXMnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCAqIGFzIFlBTUwgZnJvbSAnanMteWFtbCc7XG5pbXBvcnQgeyBSZW5kZXJpbmdSZXN1bHRzIH0gZnJvbSAnLi9yZW5kZXIuanMnO1xuaW1wb3J0IHsgcmVmYWN0b3JUYWcgfSBmcm9tICcuL3JlZmFjdG9yLXRhZ3MuanMnO1xuaW1wb3J0IHsgU2l0ZW1hcFZhbGlkYXRvciB9IGZyb20gJy4vc2l0ZW1hcC12YWxpZGF0b3IuanMnO1xuaW1wb3J0IHsgbG9hZEVudkZpbGVzIH0gZnJvbSAnLi9pbmRleC5qcyc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnO1xuXG5cblxucHJvY2Vzcy50aXRsZSA9ICdha2FzaGFyZW5kZXInO1xuXG4vKipcbiAqIFJlYWQgdGhlIEFrYXNoYVJlbmRlciBwYWNrYWdlIHZlcnNpb24gZHluYW1pY2FsbHkgZnJvbVxuICogYHBhY2thZ2UuanNvbmAgYXQgdGhlIHJvb3Qgb2YgdGhpcyBwYWNrYWdlLiAgV2UgcmVzb2x2ZSB0aGUgcGF0aFxuICogcmVsYXRpdmUgdG8gdGhlIGNvbXBpbGVkIGBkaXN0L2NsaS5qc2AgZmlsZSAoc28gYC4uL3BhY2thZ2UuanNvbmApXG4gKiByYXRoZXIgdGhhbiBgcHJvY2Vzcy5jd2QoKWAsIHdoaWNoIHdvdWxkIGJlIHRoZSB1c2VyJ3Mgd29ya2luZ1xuICogZGlyZWN0b3J5IHdoZW4gaW52b2tpbmcgdGhlIENMSS5cbiAqL1xuZnVuY3Rpb24gcmVhZFBhY2thZ2VWZXJzaW9uKCk6IHN0cmluZyB7XG4gICAgY29uc3QgaGVyZSA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xuICAgIGNvbnN0IHBrZ1BhdGggPSBwYXRoLnJlc29sdmUoaGVyZSwgJy4uJywgJ3BhY2thZ2UuanNvbicpO1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBrZ1BhdGgsICd1dGY4JykpO1xuICAgIHJldHVybiBwa2cudmVyc2lvbjtcbn1cblxucHJvZ3JhbS52ZXJzaW9uKHJlYWRQYWNrYWdlVmVyc2lvbigpKTtcblxuLyoqXG4gKiBDb2xsZWN0b3IgZm9yIHRoZSBnbG9iYWwgYC0tZW52IDxwYXRoPmAgb3B0aW9uLiAgQ29tbWFuZGVyIGludm9rZXNcbiAqIHRoaXMgZWFjaCB0aW1lIHRoZSBvcHRpb24gYXBwZWFycyBvbiB0aGUgY29tbWFuZCBsaW5lLCBsZXR0aW5nXG4gKiB1c2VycyBkZWNsYXJlIG11bHRpcGxlIC5lbnYgZmlsZXMsIGUuZy5cbiAqICAgYGFrYXNoYXJlbmRlciAtLWVudiAuZW52IC0tZW52IC5lbnYubG9jYWwgcmVuZGVyIGNvbmZpZy5tanNgLlxuICovXG5mdW5jdGlvbiBjb2xsZWN0RW52RmlsZSh2YWx1ZTogc3RyaW5nLCBwcmV2aW91czogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHByZXZpb3VzLmNvbmNhdChbIHZhbHVlIF0pO1xufVxuXG5wcm9ncmFtXG4gICAgLm9wdGlvbihcbiAgICAgICAgJy0tZW52IDxwYXRoPicsXG4gICAgICAgICdQYXRoIHRvIGEgLmVudiBmaWxlIHRvIGxvYWQgaW50byBwcm9jZXNzLmVudiBiZWZvcmUgcnVubmluZyB0aGUgY29tbWFuZC4gIE1heSBiZSBnaXZlbiBtdWx0aXBsZSB0aW1lczsgZmlsZXMgYXJlIGxvYWRlZCBpbiB0aGUgb3JkZXIgc3VwcGxpZWQuJyxcbiAgICAgICAgY29sbGVjdEVudkZpbGUsXG4gICAgICAgIFtdXG4gICAgKTtcblxuLyoqXG4gKiBMb2FkIGFueSBgLmVudmAgZmlsZXMgZGVjbGFyZWQgd2l0aCB0aGUgZ2xvYmFsIGAtLWVudmAgb3B0aW9uIGludG9cbiAqIGBwcm9jZXNzLmVudmAuICBUaGlzIHNob3VsZCBiZSBjYWxsZWQgYXQgdGhlIHN0YXJ0IG9mIGV2ZXJ5IGNvbW1hbmQnc1xuICogYWN0aW9uLCBiZWZvcmUgdGhlIGNvbW1hbmQgcmVhZHMgYHByb2Nlc3MuZW52YCBvciBpbXBvcnRzIGFcbiAqIGNvbmZpZ3VyYXRpb24gbW9kdWxlICh3aG9zZSBldmFsdWF0aW9uIG1heSBpdHNlbGYgcmVhZCBgcHJvY2Vzcy5lbnZgKS5cbiAqL1xuZnVuY3Rpb24gYXBwbHlFbnZPcHRpb24oKTogdm9pZCB7XG4gICAgY29uc3Qgb3B0cyA9IHByb2dyYW0ub3B0cygpO1xuICAgIGNvbnN0IGVudkZpbGVzOiBzdHJpbmdbXSA9IEFycmF5LmlzQXJyYXkob3B0cy5lbnYpID8gb3B0cy5lbnYgOiBbXTtcbiAgICBsb2FkRW52RmlsZXMoZW52RmlsZXMpO1xufVxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2VudicpXG4gICAgLmRlc2NyaXB0aW9uKCdQcmludCB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZyb20gcHJvY2Vzcy5lbnYgYWZ0ZXIgbG9hZGluZyBhbnkgLS1lbnYgZmlsZXMuJylcbiAgICAuYWN0aW9uKCgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICAvLyBQcmludCBzb3J0ZWQgYnkga2V5IGZvciBhIHN0YWJsZSwgZWFzeS10by1zY2FuIHJlcG9ydC5cbiAgICAgICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9jZXNzLmVudikuc29ydCgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2tleX09JHtwcm9jZXNzLmVudltrZXldfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBlbnYgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2NvcHktYXNzZXRzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignQ29weSBhc3NldHMgaW50byBvdXRwdXQgZGlyZWN0b3J5JylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBhd2FpdCBjb25maWcuY29weUFzc2V0cygpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNvcHktYXNzZXRzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY3VtZW50IDxjb25maWdGTj4gPGRvY3VtZW50Rk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBkb2N1bWVudCcpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGRvY3VtZW50Rk4pID0+IHtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2N1bWVudHMgPSBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZG9jdW1lbnRGTik7XG4gICAgICAgICAgICAvLyBkYXRhOiAke2RvYy5kYXRhfVxuICAgICAgICAgICAgLy8gdGV4dDogJHtkb2MudGV4dH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcbmRvY3BhdGg6ICR7ZG9jLnZwYXRofVxuZnNwYXRoOiAke2RvYy5mc3BhdGh9XG5yZW5kZXJlcjogJHt1dGlsLmluc3BlY3QoY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZG9jLnZwYXRoKSl9XG5yZW5kZXJwYXRoOiAke2RvYy5yZW5kZXJQYXRofVxubW91bnRlZDogJHtkb2MubW91bnRlZH1cbm1vdW50UG9pbnQ6ICR7ZG9jLm1vdW50UG9pbnR9XG5cbm1ldGFkYXRhOiAke3V0aWwuaW5zcGVjdChkb2MubWV0YWRhdGEpfVxuXG5gKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2N1bWVudCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbmZ1bmN0aW9uIGZvcm1hdFJlc3VsdChyZXN1bHQ6IFJlbmRlcmluZ1Jlc3VsdHMpIHtcbiAgICBpZiAocmVzdWx0LnNraXBwZWQpIHtcbiAgICAgICAgcmV0dXJuIGBcblNLSVBQRUQgJHtyZXN1bHQucmVuZGVyRm9ybWF0fSAke3Jlc3VsdC52cGF0aH0gPT0+ICR7cmVzdWx0LnJlbmRlclBhdGh9IChvdXRwdXQgdXAtdG8tZGF0ZSlgO1xuICAgIH1cbiAgICByZXR1cm4gYFxuJHtyZXN1bHQucmVuZGVyRm9ybWF0fSAke3Jlc3VsdC52cGF0aH0gPT0+ICR7cmVzdWx0LnJlbmRlclBhdGh9XG5GSVJTVCAke3Jlc3VsdC5yZW5kZXJGaXJzdEVsYXBzZWR9IExBWU9VVCAke3Jlc3VsdC5yZW5kZXJMYXlvdXRFbGFwc2VkfSBNQUhBICR7cmVzdWx0LnJlbmRlck1haGFFbGFwc2VkfSBUT1RBTCAke3Jlc3VsdC5yZW5kZXJUb3RhbEVsYXBzZWR9YDtcbn1cblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdyZW5kZXItZG9jdW1lbnQgPGNvbmZpZ0ZOPiA8ZG9jdW1lbnRGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignUmVuZGVyIGEgZG9jdW1lbnQgaW50byBvdXRwdXQgZGlyZWN0b3J5JylcbiAgICAub3B0aW9uKCctLXBlcmYtZGF0YS1kaXIgPGRhdGFEaXI+JywgJ0RpcmVjdG9yeSBmb3Igb3V0cHV0IG9mIE1haGFiaHV0YSBwZXJmb3JtYW5jZSBtZWFzdXJlbWVudHMnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBkb2N1bWVudEZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNtZE9iaj8ucGVyZkRhdGFEaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnBlcmZEYXRhRGlyID0gY21kT2JqLnBlcmZEYXRhRGlyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXItZG9jdW1lbnQgYmVmb3JlIHJlbmRlclBhdGggJHtkb2N1bWVudEZOfWApO1xuICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IGFrYXNoYS5yZW5kZXJQYXRoKGNvbmZpZywgZG9jdW1lbnRGTik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZm9ybWF0UmVzdWx0KHJlc3VsdCkpO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0LmVycm9ycylcbiAgICAgICAgICAgICAgICAmJiByZXN1bHQuZXJyb3JzLmxlbmd0aCA+PSAxXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3Iuc3RhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByZW5kZXItZG9jdW1lbnQgY29tbWFuZCBFUlJPUkVEYCwgZSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdyZW5kZXIgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdSZW5kZXIgYSBzaXRlIGludG8gb3V0cHV0IGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1xdWlldCcsICdEbyBub3QgcHJpbnQgdGhlIHJlbmRlcmluZyByZXBvcnQnKVxuICAgIC5vcHRpb24oJy0tY29weS1hc3NldHMnLCAnRmlyc3QsIGNvcHkgdGhlIGFzc2V0cycpXG4gICAgLm9wdGlvbignLS1yZXN1bHRzLXRvIDxyZXN1bHRGaWxlPicsICdTdG9yZSB0aGUgcmVzdWx0cyBpbnRvIHRoZSBuYW1lZCBmaWxlJylcbiAgICAub3B0aW9uKCctLXBlcmZyZXN1bHRzIDxwZXJmUmVzdWx0c0ZpbGU+JywgJ1N0b3JlIHRoZSB0aW1lIHRvIHJlbmRlciBlYWNoIGRvY3VtZW50JylcbiAgICAub3B0aW9uKCctLWZvcmNlLXJlbmRlci1hbGwnLCAnUmUtcmVuZGVyIGV2ZXJ5IGRvY3VtZW50LCBpZ25vcmluZyBvdXRwdXQgZmlsZSB0aW1lc3RhbXBzJylcbiAgICAub3B0aW9uKCctLWNhY2hpbmctdGltZW91dCA8dGltZW91dD4nLCAnVGhlIHRpbWUsIGluIG1pbGlzZWNvbmRzLCB0byBob25vciBlbnRyaWVzIGluIHRoZSBzZWFyY2ggY2FjaGUnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmNvcHlBc3NldHMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb25maWcuY29weUFzc2V0cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjbWRPYmouY2FjaGluZ1RpbWVvdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLnNldENhY2hpbmdUaW1lb3V0KFxuICAgICAgICAgICAgICAgICAgICBOdW1iZXIucGFyc2VJbnQoY21kT2JqLmNhY2hpbmdUaW1lb3V0KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgcmVzdWx0cyA9IDxSZW5kZXJpbmdSZXN1bHRzW10+IGF3YWl0IGFrYXNoYS5yZW5kZXIoY29uZmlnLCB7XG4gICAgICAgICAgICAgICAgZm9yY2VSZW5kZXJBbGw6IGNtZE9iai5mb3JjZVJlbmRlckFsbCA9PT0gdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIWNtZE9iai5xdWlldCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyAtLS0gaWYgQUtBU0hBUkVOREVSX1RSQUNFX1JFTkRFUiB0aGVuIG91dHB1dCB0cmFjaW5nIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyAtLS0gYWxzbyBzZXQgcHJvY2Vzcy5lbnYuR0xPQkZTX1RSQUNFPTFcblxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXN1bHQpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGZvcm1hdFJlc3VsdChyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0LmVycm9ycylcbiAgICAgICAgICAgICAgICAgICAgICYmIHJlc3VsdC5lcnJvcnMubGVuZ3RoID49IDFcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlc3VsdHNUbykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dHB1dCA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGNtZE9iai5yZXN1bHRzVG8pO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC53cml0ZShmb3JtYXRSZXN1bHQocmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdC5lcnJvcnMpXG4gICAgICAgICAgICAgICAgICAgICAmJiByZXN1bHQuZXJyb3JzLmxlbmd0aCA+PSAxXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBlcnJvciBvZiByZXN1bHQuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LndyaXRlKGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvdXRwdXQuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoucGVyZnJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXBvcnRzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvcnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkUGF0aD86IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZT86IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0PzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kPzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFoYWJodXRhPzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWQ/OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIH0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlZFBhdGg6IHJlc3VsdC52cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogcmVzdWx0LnJlbmRlckZvcm1hdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IHJlc3VsdC5yZW5kZXJTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0OiByZXN1bHQucmVuZGVyRmlyc3RFbGFwc2VkLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kOiByZXN1bHQucmVuZGVyTGF5b3V0RWxhcHNlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haGFiaHV0YTogcmVzdWx0LnJlbmRlck1haGFFbGFwc2VkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWQ6IHJlc3VsdC5yZW5kZXJUb3RhbEVsYXBzZWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0cy5wdXNoKHJlcG9ydCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZzcC53cml0ZUZpbGUoY21kT2JqLnBlcmZyZXN1bHRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkocmVwb3J0cywgdW5kZWZpbmVkLCA0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICd1dGYtOCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJlbmRlciBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZ2gtcGFnZXMtcHVibGlzaCA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1B1Ymxpc2ggYSBzaXRlIHVzaW5nIEdpdGh1YiBQYWdlcy4gIFRha2VzIHRoZSByZW5kZXJpbmcgZGVzdGluYXRpb24sIGFkZHMgaXQgaW50byBhIGJyYW5jaCwgYW5kIHB1c2hlcyB0aGF0IHRvIEdpdGh1YicpXG4gICAgLm9wdGlvbignLWIsIC0tYnJhbmNoIDxicmFuY2hOYW1lPicsICdUaGUgYnJhbmNoIHRvIHVzZSBmb3IgcHVibGlzaGluZyB0byBHaXRodWInKVxuICAgIC5vcHRpb24oJy1yLCAtLXJlcG8gPHJlcG9VUkw+JywgJ1RoZSByZXBvc2l0b3J5IFVSTCB0byB1c2UgaWYgaXQgbXVzdCBkaWZmZXIgZnJvbSB0aGUgVVJMIG9mIHRoZSBsb2NhbCBkaXJlY3RvcnknKVxuICAgIC5vcHRpb24oJy0tcmVtb3RlIDxyZW1vdGVOYW1lPicsICdUaGUgR2l0IHJlbW90ZSBuYW1lIHRvIHVzZSBpZiBpdCBtdXN0IGRpZmZlciBmcm9tIFwib3JpZ2luXCInKVxuICAgIC5vcHRpb24oJy0tdGFnIDx0YWc+JywgJ0FueSB0YWcgdG8gYWRkIHdoZW4gcHVzaGluZyB0byBHaXRodWInKVxuICAgIC5vcHRpb24oJy0tbWVzc2FnZSA8bWVzc2FnZT4nLCAnQW55IEdpdCBjb21taXQgbWVzc2FnZScpXG4gICAgLm9wdGlvbignLS11c2VybmFtZSA8dXNlcm5hbWU+JywgJ0dpdGh1YiB1c2VyIG5hbWUgdG8gdXNlJylcbiAgICAub3B0aW9uKCctLWVtYWlsIDxlbWFpbD4nLCAnR2l0aHViIHVzZXIgZW1haWwgdG8gdXNlJylcbiAgICAub3B0aW9uKCctLW5vcHVzaCcsICdEbyBub3QgcHVzaCB0byBHaXRodWIsIG9ubHkgY29tbWl0JylcbiAgICAub3B0aW9uKCctLWNuYW1lIDxkb21haW4+JywgJ1dyaXRlIG91dCBhIENOQU1FIGZpbGUgd2l0aCB0aGUgZG9tYWluIG5hbWUnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuXG4gICAgICAgICAgICBsZXQgb3B0aW9uczogYW55ID0ge1xuICAgICAgICAgICAgICAgIGRvdGZpbGVzOiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGNtZE9iai5icmFuY2gpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmJyYW5jaCA9IGNtZE9iai5icmFuY2g7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlcG9VUkwpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnJlcG8gPSBjbWRPYmoucmVwb1VSTDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoucmVtb3RlKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5yZW1vdGUgPSBjbWRPYmoucmVtb3RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5jbmFtZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuY25hbWUgPSBjbWRPYmouY25hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLnRhZykge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMudGFnID0gY21kT2JqLnRhZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMubWVzc2FnZSA9IGNtZE9iai5tZXNzYWdlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai51c2VybmFtZSB8fCBjbWRPYmouZW1haWwpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnVzZXIgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmoudXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnVzZXIubmFtZSA9IGNtZE9iai51c2VybmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjbWRPYmouZW1haWwpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnVzZXIuZW1haWwgPSBjbWRPYmouZW1haWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY21kT2JqLm5vcHVzaCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMucHVzaCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvcHRpb25zLm5vamVreWxsID0gdHJ1ZTtcbiAgICAgICAgICAgIG9wdGlvbnMuZG90ZmlsZXMgPSB0cnVlO1xuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZ2gtcGFnZXMtcHVibGlzaCBvcHRpb25zICR7Y29uZmlnLnJlbmRlckRlc3RpbmF0aW9ufSBjbWRPYmogJHt1dGlsLmluc3BlY3QoY21kT2JqKX0gb3B0aW9ucyAke3V0aWwuaW5zcGVjdChvcHRpb25zKX1gKTtcblxuICAgICAgICAgICAgZ2hwYWdlcy5wdWJsaXNoKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgb3B0aW9ucywgZnVuY3Rpb24oZXJyKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgZWxzZSBjb25zb2xlLmxvZygnT0snKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBnaC1wYWdlcy1wdWJsaXNoIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2NvbmZpZyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1ByaW50IGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh7XG4gICAgICAgICAgICAgICAgcm9vdF91cmw6IGNvbmZpZy5yb290X3VybCxcbiAgICAgICAgICAgICAgICBjb25maWdEaXI6IGNvbmZpZy5jb25maWdEaXIsXG4gICAgICAgICAgICAgICAgcmVuZGVyRGVzdGluYXRpb246IGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbixcbiAgICAgICAgICAgICAgICBkZWNvbW1lbnQ6IGNvbmZpZy5kZWNvbW1lbnQsXG4gICAgICAgICAgICAgICAgY29uY3VycmVuY3k6IGNvbmZpZy5jb25jdXJyZW5jeSxcbiAgICAgICAgICAgICAgICBjYWNoaW5nVGltZW91dDogY29uZmlnLmNhY2hpbmdUaW1lb3V0LFxuICAgICAgICAgICAgICAgIGRvY3VtZW50RGlyczogY29uZmlnLmRvY3VtZW50RGlycyxcbiAgICAgICAgICAgICAgICBsYXlvdXREaXJzOiBjb25maWcubGF5b3V0RGlycyxcbiAgICAgICAgICAgICAgICBwYXJ0aWFsRGlyczogY29uZmlnLnBhcnRpYWxzRGlycyxcbiAgICAgICAgICAgICAgICBhc3NldERpcnM6IGNvbmZpZy5hc3NldERpcnMsXG4gICAgICAgICAgICAgICAgbWFoYWZ1bmNzOiBjb25maWcubWFoYWZ1bmNzLFxuICAgICAgICAgICAgICAgIG1haGFiaHV0YUNvbmZpZzogY29uZmlnLm1haGFiaHV0YUNvbmZpZyxcbiAgICAgICAgICAgICAgICBtZXRhZGF0YTogY29uZmlnLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIGhlYWRlckphdmFTY3JpcHQ6IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AsXG4gICAgICAgICAgICAgICAgZm9vdGVySmF2YVNjcmlwdDogY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdEJvdHRvbSxcbiAgICAgICAgICAgICAgICBzdHlsZXNoZWV0czogY29uZmlnLnNjcmlwdHMuc3R5bGVzaGVldHMsXG4gICAgICAgICAgICAgICAgcGx1Z2luczogY29uZmlnLnBsdWdpbnMsXG4gICAgICAgICAgICAgICAgcmVuZGVyZXJzOiBjb25maWcucmVuZGVyZXJzLnJlbmRlcmVyc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNvbmZpZyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncGx1Z2lucyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHBsdWdpbnMnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5wbHVnaW5zKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBjb25maWcgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY2RpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudHMgZGlyZWN0b3JpZXMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29uZmlnLmRvY3VtZW50RGlycyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jZGlycyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnYXNzZXRkaXJzIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgYXNzZXRzIGRpcmVjdG9yaWVzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5hc3NldERpcnMpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0ZGlycyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgncGFydGlhbGRpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBwYXJ0aWFscyBkaXJlY3RvcmllcyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb25maWcucGFydGlhbHNEaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFsZGlycyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnbGF5b3V0c2RpcnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBsYXlvdXRzIGRpcmVjdG9yaWVzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvbmZpZy5sYXlvdXREaXJzKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRzZGlycyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2N1bWVudHMgPGNvbmZpZ0ZOPiBbcm9vdFBhdGhdJylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGRvY3VtZW50cyBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHJvb3RQYXRoKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5wYXRocyhyb290UGF0aCkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGRvY3VtZW50cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnZG9jcy1zZXQtZGF0ZXMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTZXQgdGhlIGFUaW1lIGFuZCBtVGltZSBmb3IgZG9jdW1lbnRzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuc2V0VGltZXMoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy1zZXQtZGF0ZXMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2RvY2luZm8gPGNvbmZpZ0ZOPiA8ZG9jRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1Nob3cgaW5mb3JtYXRpb24gYWJvdXQgYSBkb2N1bWVudCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGRvY0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc3QgZG9jaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuZmluZChkb2NGTik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgZG9jRk4gJHtkb2NGTn0gYCwgZG9jaW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jaW5mbyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnaW5kZXgtZmlsZXMgPGNvbmZpZ0ZOPiBbcm9vdFBhdGhdJylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGluZGV4IHBhZ2VzIChpbmRleC5odG1sKSB1bmRlciB0aGUgZ2l2ZW4gZGlyZWN0b3J5JylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcm9vdFBhdGgpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5pbmRleEZpbGVzKHJvb3RQYXRoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBpbmRleGVzICR7cm9vdFBhdGh9IGAsIGRvY2luZm8ubWFwKGluZGV4ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB2cGF0aDogaW5kZXgudnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhdGg6IGluZGV4LnJlbmRlclBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGluZGV4Lm1vdW50UG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQ6IGluZGV4LnBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIGRpcm5hbWU6IGluZGV4LmRpcm5hbWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaW5kZXgtZmlsZXMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2luZGV4LWNoYWluIDxjb25maWdGTj4gc3RhcnRQYXRoJylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGluZGV4IGNoYWluIHN0YXJ0aW5nIGZyb20gdGhlIHBhdGgnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBzdGFydFBhdGgpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBkb2NpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5pbmRleENoYWluKHN0YXJ0UGF0aCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgaW5kZXggY2hhaW4gJHtzdGFydFBhdGh9IGAsIGRvY2luZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGluZGV4LWNoYWluIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdzaWJsaW5ncyA8Y29uZmlnRk4+IDx2cGF0aD4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgc2libGluZyBwYWdlcyB0byB0aGUgbmFtZWQgZG9jdW1lbnQnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCB2cGF0aCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY2luZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnNpYmxpbmdzKHZwYXRoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBzaWJsaW5ncyAke3ZwYXRofSBgLCBkb2NpbmZvLm1hcChpbmRleCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdnBhdGg6IGluZGV4LnZwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXRoOiBpbmRleC5yZW5kZXJQYXRoLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBpbmRleC5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkOiBpbmRleC5wYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBkaXJuYW1lOiBpbmRleC5kaXJuYW1lXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHNpYmxpbmdzIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2NzLXNlbWFudGljIDxjb25maWdGTj4gPHNlYXJjaEZvcj4nKVxuICAgIC5kZXNjcmlwdGlvbignTGlzdCB0aGUgZG9jdW1lbnQgdnBhdGhzIHNlbWFudGljYWxseSBtYXRjaGluZyB0aGUgc3RyaW5nJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgc2VhcmNoRm9yKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5zZW1hbnRpY1NlYXJjaERvY3Moc2VhcmNoRm9yKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy1zZW1hbnRpYyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgndGFncyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHRhZ3MnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnRhZ3MoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHRhZ3MgfSwgeyBpbmRlbnQ6IDQgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHRhZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3NpbWlsYXItdGFncyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0ZpbmQgZ3JvdXBzIG9mIHNpbWlsYXIgdGFncycpXG4gICAgLm9wdGlvbignLS10aHJlc2hvbGQgPG4+JywgJ0xldmVuc2h0ZWluIGRpc3RhbmNlIHRocmVzaG9sZCcsICcyJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHRocmVzaG9sZCA9IHBhcnNlSW50KGNtZE9iai50aHJlc2hvbGQsIDEwKTtcbiAgICAgICAgICAgIGNvbnN0IGdyb3VwcyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUuZmluZFNpbWlsYXJUYWdzKHRocmVzaG9sZCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhZQU1MLmR1bXAoeyBzaW1pbGFyVGFnR3JvdXBzOiBncm91cHMgfSwgeyBpbmRlbnQ6IDQgfSkpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHNpbWlsYXItdGFncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgndGFncy13aXRob3V0LWRlc2NyaXB0aW9ucyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGFncyB0aGF0IGhhdmUgbm8gZGVzY3JpcHRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnRhZ3NXaXRob3V0RGVzY3JpcHRpb25zKCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhZQU1MLmR1bXAoeyB0YWdzV2l0aG91dERlc2NyaXB0aW9uczogdGFncyB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdGFncy13aXRob3V0LWRlc2NyaXB0aW9ucyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgndW51c2VkLXRhZy1kZXNjcmlwdGlvbnMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRhZyBkZXNjcmlwdGlvbnMgdGhhdCBhcmUgbm90IHVzZWQgYnkgYW55IGRvY3VtZW50JylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCB0YWdzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS51bnVzZWRUYWdEZXNjcmlwdGlvbnMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFlBTUwuZHVtcCh7IHVudXNlZFRhZ0Rlc2NyaXB0aW9uczogdGFncyB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdW51c2VkLXRhZy1kZXNjcmlwdGlvbnMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3JlZmFjdG9yLXRhZyA8Y29uZmlnRk4+IDxvbGRUYWc+IDxuZXdUYWc+JylcbiAgICAuZGVzY3JpcHRpb24oJ1JlbmFtZSBhIHRhZyBhY3Jvc3MgYWxsIGRvY3VtZW50cycpXG4gICAgLm9wdGlvbignLS1kcnktcnVuJywgJ0xpc3QgY2hhbmdlcyB3aXRob3V0IG1vZGlmeWluZyBmaWxlcycsIGZhbHNlKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBvbGRUYWcsIG5ld1RhZywgY21kT2JqKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlZmFjdG9yVGFnKGNvbmZpZywgb2xkVGFnLCBuZXdUYWcsIHtcbiAgICAgICAgICAgICAgICBkcnlSdW46IGNtZE9iai5kcnlSdW5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coWUFNTC5kdW1wKHsgcmVmYWN0b3JSZXN1bHQ6IHJlc3VsdCB9LCB7IGluZGVudDogNCB9KSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcmVmYWN0b3ItdGFnIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdkb2NzLXdpdGgtdGFnIDxjb25maWdGTj4gPHRhZ3MuLi4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGRvY3VtZW50IHZwYXRocyBmb3IgZ2l2ZW4gdGFncycpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIHRhZ3MpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZVxuICAgICAgICAgICAgICAgIC5kb2N1bWVudHNDYWNoZS5kb2N1bWVudHNXaXRoVGFnKHRhZ3MpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBkb2NzLXdpdGgtdGFncyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY2hpbGQtaXRlbS10cmVlIDxjb25maWdGTj4gPHJvb3RQYXRoPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBkb2N1bWVudHMgdW5kZXIgYSBnaXZlbiBsb2NhdGlvbiBieSB0cmVlJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgcm9vdFBhdGgpID0+IHtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICBZQU1MLmR1bXAoe1xuICAgICAgICAgICAgICAgICAgICB0cmVlOiBhd2FpdCBha2FzaGEuZmlsZWNhY2hlXG4gICAgICAgICAgICAgICAgICAgICAgICAuZG9jdW1lbnRzQ2FjaGUuY2hpbGRJdGVtVHJlZShyb290UGF0aClcbiAgICAgICAgICAgICAgICB9LCB7IGluZGVudDogNCB9KVxuICAgICAgICAgICAgICAgIC8vIC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB2cGF0aDogaXRlbS52cGF0aCxcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHJlbmRlclBhdGg6IGl0ZW0ucmVuZGVyUGF0aFxuICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZG9jcy13aXRoLXRhZ3MgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ3NlYXJjaCA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ1NlYXJjaCBmb3IgZG9jdW1lbnRzJylcbiAgICAub3B0aW9uKCctLXJvb3QgPHJvb3RQYXRoPicsICdTZWxlY3Qgb25seSBmaWxlcyB3aXRoaW4gdGhlIG5hbWVkIGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1tYXRjaCA8cGF0aG1hdGNoPicsICdTZWxlY3Qgb25seSBmaWxlcyBtYXRjaGluZyB0aGUgcmVndWxhciBleHByZXNzaW9uJylcbiAgICAub3B0aW9uKCctLXJlbmRlcm1hdGNoIDxyZW5kZXJwYXRobWF0Y2g+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSByZWd1bGFyIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tZ2xvYiA8Z2xvYm1hdGNoPicsICdTZWxlY3Qgb25seSBmaWxlcyBtYXRjaGluZyB0aGUgZ2xvYiBleHByZXNzaW9uJylcbiAgICAub3B0aW9uKCctLXJlbmRlcmdsb2IgPGdsb2JtYXRjaD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgcmVuZGVyaW5nIHRvIHRoZSBnbG9iIGV4cHJlc3Npb24nKVxuICAgIC5vcHRpb24oJy0tcGFyZW50RGlyIDxwYXRoPicsICdTZWxlY3Qgb25seSBmaWxlcyB3aG9zZSBwYXJlbnQgZGlyZWN0b3J5IGlzIHRoZSBuYW1lZCBkaXJlY3RvcnknKVxuICAgIC5vcHRpb24oJy0tZGlybmFtZSA8cGF0aD4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgd2l0aGluIHRoZSBuYW1lZCBkaXJlY3RvcnknKVxuICAgIC5vcHRpb24oJy0tc2tpcGdsb2IgPGdsb2JtYXRjaD4nLCAnU2tpcCBmaWxlcyBtYXRjaGluZyB0aGUgZ2xvYiBleHByZXNzaW9uJylcbiAgICAub3B0aW9uKCctLWxheW91dHMgPGxheW91dHMuLi4+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSBsYXlvdXRzJylcbiAgICAub3B0aW9uKCctLW1pbWUgPG1pbWU+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIG1hdGNoaW5nIHRoZSBNSU1FIHR5cGUnKVxuICAgIC5vcHRpb24oJy0tdGFncyA8dGFncy4uLj4nLCAnU2VsZWN0IG9ubHkgZmlsZXMgd2l0aCB0aGUgdGFncycpXG4gICAgLm9wdGlvbignLS1ibG9ndGFncyA8YmxvZ3RhZ3MuLi4+JywgJ1NlbGVjdCBvbmx5IGZpbGVzIHdpdGggdGhlIGJsb2d0YWdzJylcbiAgICAub3B0aW9uKCctLWxpbWl0IDxsaW1pdD4nLCAnUmV0dXJuIG9ubHkgc28gbWFueSBpdGVtcycpXG4gICAgLm9wdGlvbignLS1vZmZzZXQgPG9mZnNldD4nLCAnUmV0dXJuIG9ubHkgaXRlbXMgc3RhcnRpbmcgZnJvbSB0aGUgb2Zmc2V0IHdpdGhpbiB0aGUgcmVzdWx0IHNldCcpXG4gICAgLm9wdGlvbignLS1zb3J0LWJ5IDxmaWVsZD4nLCAnU29ydCByZXN1bHRzIGJ5IGEgZG9jdW1lbnQgY29sdW1uIG9yIGZyb250bWF0dGVyIGZpZWxkJylcbiAgICAub3B0aW9uKCctLXNvcnQgPGRpcmVjdGlvbj4nLCAnU29ydCBkaXJlY3Rpb24sIGVpdGhlciBcImFzY1wiIG9yIFwiZGVzY1wiJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coY21kT2JqKTtcbiAgICAgICAgICAgIGxldCBvcHRpb25zOiBhbnkgPSB7IH07XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJvb3QpIG9wdGlvbnMucm9vdFBhdGggPSBjbWRPYmoucm9vdDtcbiAgICAgICAgICAgIGlmIChjbWRPYmoucGFyZW50RGlyKSBvcHRpb25zLnBhcmVudERpciA9IGNtZE9iai5wYXJlbnREaXI7XG4gICAgICAgICAgICBpZiAoY21kT2JqLmRpcm5hbWUpIG9wdGlvbnMuZGlybmFtZSA9IGNtZE9iai5kaXJuYW1lO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5tYXRjaCkgb3B0aW9ucy5wYXRobWF0Y2ggPSBjbWRPYmoubWF0Y2g7XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlbmRlcm1hdGNoKSBvcHRpb25zLnJlbmRlcnBhdGhtYXRjaCA9IGNtZE9iai5yZW5kZXJtYXRjaDtcbiAgICAgICAgICAgIGlmIChjbWRPYmouZ2xvYikgb3B0aW9ucy5nbG9iID0gY21kT2JqLmdsb2I7XG4gICAgICAgICAgICBpZiAoY21kT2JqLnJlbmRlcmdsb2IpIG9wdGlvbnMucmVuZGVyZ2xvYiA9IGNtZE9iai5yZW5kZXJnbG9iO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5za2lwZ2xvYikgb3B0aW9ucy5za2lwZ2xvYiA9IGNtZE9iai5za2lwZ2xvYjtcbiAgICAgICAgICAgIGlmIChjbWRPYmoubGF5b3V0cykgb3B0aW9ucy5sYXlvdXRzID0gY21kT2JqLmxheW91dHM7XG4gICAgICAgICAgICBpZiAoY21kT2JqLm1pbWUpIG9wdGlvbnMubWltZSA9IGNtZE9iai5taW1lO1xuICAgICAgICAgICAgaWYgKGNtZE9iai50YWdzKSBvcHRpb25zLnRhZyA9IGNtZE9iai50YWdzO1xuICAgICAgICAgICAgaWYgKGNtZE9iai5ibG9ndGFncykgb3B0aW9ucy5ibG9ndGFncyA9IGNtZE9iai5ibG9ndGFncztcbiAgICAgICAgICAgIGlmIChjbWRPYmoubGltaXQpIG9wdGlvbnMubGltaXQgPSBjbWRPYmoubGltaXQ7XG4gICAgICAgICAgICBpZiAoY21kT2JqLm9mZnNldCkgb3B0aW9ucy5vZmZzZXQgPSBjbWRPYmoub2Zmc2V0O1xuICAgICAgICAgICAgaWYgKGNtZE9iai5zb3J0QnkpIHtcbiAgICAgICAgICAgICAgICAvLyBzb3J0LWJ5IG1heSBuYW1lIGEgZG9jdW1lbnQgY29sdW1uIChzdWNoIGFzIHRpdGxlLFxuICAgICAgICAgICAgICAgIC8vIHJlbmRlclBhdGgsIHZwYXRoLCBwYXJlbnREaXIsIG9yIHB1YmxpY2F0aW9uVGltZSkgb3IgYW55XG4gICAgICAgICAgICAgICAgLy8gZnJvbnRtYXR0ZXIgZmllbGQgKHN1Y2ggYXMgYSBjdXN0b20gYHN0ZXBgIG9yZGVyaW5nXG4gICAgICAgICAgICAgICAgLy8gZmllbGQpLiAgVGhlIHNlYXJjaCBxdWVyeSBzb3J0cyBieSBhIGNvbHVtbiB3aGVuIHRoZSBuYW1lXG4gICAgICAgICAgICAgICAgLy8gbWF0Y2hlcyBvbmUsIGFuZCBvdGhlcndpc2UgZXh0cmFjdHMgdGhlIHZhbHVlIGZyb20gdGhlXG4gICAgICAgICAgICAgICAgLy8gSlNPTiBtZXRhZGF0YS4gIEd1YXJkIGFnYWluc3QgbmFtZXMgdGhhdCBjb3VsZCBub3QgYmUgYVxuICAgICAgICAgICAgICAgIC8vIHNhZmUgZnJvbnRtYXR0ZXIga2V5LCBtYXRjaGluZyBEb2N1bWVudEdyb3VwIGluIGJ1aWx0LWluLnRzLlxuICAgICAgICAgICAgICAgIGlmICghY21kT2JqLnNvcnRCeS5tYXRjaCgvXltBLVphLXpfXVtBLVphLXowLTlfLV0qJC8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgc2VhcmNoIHNvcnQtYnkgaW5jb3JyZWN0ICR7Y21kT2JqLnNvcnRCeX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zb3J0QnkgPSBjbWRPYmouc29ydEJ5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNtZE9iai5zb3J0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjbWRPYmouc29ydC5tYXRjaCgvXihhc2N8ZGVzYykkLykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWFyY2ggc29ydCBpbmNvcnJlY3QgJHtjbWRPYmouc29ydH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zb3J0QnlEZXNjZW5kaW5nID0gY21kT2JqLnNvcnQgPT09ICdkZXNjJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIG9wdGlvbnMucmV0dXJuX2ZpZWxkcyA9IFtcbiAgICAgICAgICAgIC8vICAgICAndnBhdGgnLCAncmVuZGVyUGF0aCcsICd0aXRsZSdcbiAgICAgICAgICAgIC8vIF07XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhvcHRpb25zKTtcbiAgICAgICAgICAgIGxldCBkb2NzID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5zZWFyY2gob3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkb2NzXG4gICAgICAgICAgICAvLyAubWFwKGRvYyA9PiB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgdnBhdGg6IGRvYy52cGF0aCxcbiAgICAgICAgICAgIC8vICAgICAgICAgcmVuZGVyUGF0aDogZG9jLnJlbmRlclBhdGgsXG4gICAgICAgICAgICAvLyAgICAgICAgIGRpcm5hbWU6IGRvYy5kaXJuYW1lXG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgIC8vIC5zb3J0KChhOiBhbnksIGI6IGFueSkgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHZhciB0YWdBID0gYS5kaXJuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAvLyAgICAgdmFyIHRhZ0IgPSBiLmRpcm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIC8vICAgICBpZiAodGFnQSA8IHRhZ0IpIHJldHVybiAtMTtcbiAgICAgICAgICAgIC8vICAgICBpZiAodGFnQSA+IHRhZ0IpIHJldHVybiAxO1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiAwO1xuICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgIC8vIC5yZXZlcnNlKClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc2VhcmNoIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdhc3NldHMgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdMaXN0IHRoZSBhc3NldHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5hc3NldHNDYWNoZS5wYXRocygpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBhc3NldHMgY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2Fzc2V0aW5mbyA8Y29uZmlnRk4+IDxkb2NGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2hvdyBpbmZvcm1hdGlvbiBhYm91dCBhbiBhc3NldCBpbiBhIHNpdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGFzc2V0Rk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBhc3NldGluZm8gPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlLmZpbmQoYXNzZXRGTik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhc3NldGluZm8pO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLmNsb3NlQ2FjaGVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGFzc2V0aW5mbyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnbGF5b3V0cyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIGxheW91dHMgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGByZW5kZXI6IGFrYXNoYTogJHt1dGlsLmluc3BlY3QoYWthc2hhKX1gKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5zZXR1cChjb25maWcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUucGF0aHMoKSk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgbGF5b3V0cyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbi8vIFRPRE8gYm90aCB0ZXN0Lmh0bWwgYW5kIHRlc3QuaHRtbC5uamsgbWF0Y2hcbi8vICAgICAgVGhpcyBpcyBwcm9iYWJseSBpbmNvcnJlY3QsIHNpbmNlIHdlIGRvIG5vdCByZW5kZXIgdGhlc2UgZmlsZXNcbi8vICAgICAgVGhlIHBhcnRpYWxzIGRpcmVjdG9yeSBoYXMgdGhlIHNhbWUgcHJvYmxlbVxuLy8gICAgICBTb21lIGtpbmQgb2YgZmxhZyBvbiBjcmVhdGluZyB0aGUgRmlsZUNhY2hlIHRvIGNoYW5nZSB0aGUgYmVoYXZpb3JcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdsYXlvdXRpbmZvIDxjb25maWdGTj4gPGRvY0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdTaG93IGluZm9ybWF0aW9uIGFib3V0IGEgbGF5b3V0IGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgbGF5b3V0Rk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXRpbmZvID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUuZmluZChsYXlvdXRGTik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhsYXlvdXRpbmZvKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBsYXlvdXRpbmZvIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdwYXJ0aWFscyA8Y29uZmlnRk4+JylcbiAgICAuZGVzY3JpcHRpb24oJ0xpc3QgdGhlIHBhcnRpYWxzIGluIGEgc2l0ZSBjb25maWd1cmF0aW9uJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTikgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVuZGVyOiBha2FzaGE6ICR7dXRpbC5pbnNwZWN0KGFrYXNoYSl9YCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF3YWl0IGFrYXNoYS5maWxlY2FjaGUucGFydGlhbHNDYWNoZS5wYXRocygpKTtcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBwYXJ0aWFscyBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbi8vIFRPRE8gYm90aCB0ZXN0Lmh0bWwgYW5kIHRlc3QuaHRtbC5uamsgbWF0Y2hcbi8vICAgICAgVGhpcyBpcyBwcm9iYWJseSBpbmNvcnJlY3QsIHNpbmNlIHdlIGRvIG5vdCByZW5kZXIgdGhlc2UgZmlsZXNcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCdwYXJ0aWFsaW5mbyA8Y29uZmlnRk4+IDxkb2NGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignU2hvdyBpbmZvcm1hdGlvbiBhYm91dCBhIHBhcnRpYWwgaW4gYSBzaXRlIGNvbmZpZ3VyYXRpb24nKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBwYXJ0aWFsRk4pID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHJlbmRlcjogYWthc2hhOiAke3V0aWwuaW5zcGVjdChha2FzaGEpfWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIGxldCBha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBwYXJ0aWFsaW5mbyA9IGF3YWl0IGFrYXNoYS5maWxlY2FjaGUucGFydGlhbHNDYWNoZS5maW5kKHBhcnRpYWxGTik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwYXJ0aWFsaW5mbyk7XG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcGFydGlhbGluZm8gY29tbWFuZCBFUlJPUkVEICR7ZS5zdGFja31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5wcm9ncmFtXG4gICAgLmNvbW1hbmQoJ2luZGV4IDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignTG9hZHMgY29uZmlndXJhdGlvbiwgaW5kZXhlcyBjb250ZW50LCB0aGVuIGV4aXRzJylcbiAgICAub3B0aW9uKCctLXZlcmJvc2UnLCAnU2hvdyBkZXRhaWxlZCBldmVudCB0cmFja2luZyAoYWRkZWQsIHJlYWR5LCBlcnJvciBldmVudHMpJylcbiAgICAuYWN0aW9uKGFzeW5jIChjb25maWdGTiwgY21kT2JqKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhcHBseUVudk9wdGlvbigpO1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gKGF3YWl0IGltcG9ydChcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnRk4pXG4gICAgICAgICAgICApKS5kZWZhdWx0O1xuICAgICAgICAgICAgbGV0IGFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChjbWRPYmoudmVyYm9zZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbmRleGluZyBmaWxlcyB3aXRoIHZlcmJvc2Ugb3V0cHV0Li4uXFxuJyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBFbmFibGUgdmVyYm9zZSBtb2RlIGluIGNvbmZpZ1xuICAgICAgICAgICAgICAgIGNvbmZpZy52ZXJib3NlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBhd2FpdCBha2FzaGEuc2V0dXAoY29uZmlnKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBzZXR1cFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsYXBzZWQgPSBzZXR1cFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gR2V0IGZpbGUgY291bnRzXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZWNhY2hlID0gYWthc2hhLmZpbGVjYWNoZTtcbiAgICAgICAgICAgICAgICBjb25zdCBkb2N1bWVudENvdW50ID0gKGF3YWl0IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5wYXRocygpKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRDb3VudCA9IChhd2FpdCBmaWxlY2FjaGUuYXNzZXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dENvdW50ID0gKGF3YWl0IGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxDb3VudCA9IChhd2FpdCBmaWxlY2FjaGUucGFydGlhbHNDYWNoZS5wYXRocygpKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOKckyBJbmRleGluZyBjb21wbGV0ZWQgaW4gJHtlbGFwc2VkfW1zXFxuYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz09PSBTdW1tYXJ5ID09PScpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBEb2N1bWVudHM6ICR7ZG9jdW1lbnRDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQXNzZXRzOiAke2Fzc2V0Q291bnR9IGZpbGVzYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYExheW91dHM6ICR7bGF5b3V0Q291bnR9IGZpbGVzYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFBhcnRpYWxzOiAke3BhcnRpYWxDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgVG90YWw6ICR7ZG9jdW1lbnRDb3VudCArIGFzc2V0Q291bnQgKyBsYXlvdXRDb3VudCArIHBhcnRpYWxDb3VudH0gZmlsZXNgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gTm9ybWFsIG1vZGUgLSBqdXN0IHNldHVwXG4gICAgICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGF3YWl0IGFrYXNoYS5jbG9zZUNhY2hlcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbmRleCBjb21tYW5kIEVSUk9SRUQgJHtlLnN0YWNrfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbnByb2dyYW1cbiAgICAuY29tbWFuZCgnY2hlY2stcmVhZHkgPGNvbmZpZ0ZOPicpXG4gICAgLmRlc2NyaXB0aW9uKCdWZXJpZnkgdGhhdCBhbGwgZmlsZXMgYXJlIGxvYWRlZCBiZWZvcmUgaXNSZWFkeSB0cmlnZ2VycyAoZGlhZ25vc3RpYyB0b29sKScpXG4gICAgLm9wdGlvbignLS12ZXJib3NlJywgJ1Nob3cgZGV0YWlsZWQgZmlsZS1ieS1maWxlIHRyYWNraW5nJylcbiAgICAub3B0aW9uKCctLWRlbGF5IDxtcz4nLCAnV2FpdCB0aW1lIGluIG1pbGxpc2Vjb25kcyB0byBjaGVjayBmb3IgbGF0ZSBhZGRpdGlvbnMgKGRlZmF1bHQ6IDIwMDApJywgJzIwMDAnKVxuICAgIC5hY3Rpb24oYXN5bmMgKGNvbmZpZ0ZOLCBjbWRPYmopID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFwcGx5RW52T3B0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjb25maWcgPSAoYXdhaXQgaW1wb3J0KFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBjb25maWdGTilcbiAgICAgICAgICAgICkpLmRlZmF1bHQ7XG4gICAgICAgICAgICBsZXQgYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1J1bm5pbmcgaXNSZWFkeSB0aW1pbmcgY2hlY2suLi5cXG4nKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ2FwdHVyZSBpbml0aWFsIHN0YXRlXG4gICAgICAgICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgYXdhaXQgYWthc2hhLnNldHVwKGNvbmZpZyk7XG4gICAgICAgICAgICBjb25zdCBzZXR1cFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBHZXQgY291bnRzIGltbWVkaWF0ZWx5IGFmdGVyIHNldHVwXG4gICAgICAgICAgICBjb25zdCBmaWxlY2FjaGUgPSBha2FzaGEuZmlsZWNhY2hlO1xuICAgICAgICAgICAgY29uc3QgY291bnRzQWZ0ZXJTZXR1cCA9IHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudHM6IChhd2FpdCBmaWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGFzc2V0czogKGF3YWl0IGZpbGVjYWNoZS5hc3NldHNDYWNoZS5wYXRocygpKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgbGF5b3V0czogKGF3YWl0IGZpbGVjYWNoZS5sYXlvdXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHBhcnRpYWxzOiAoYXdhaXQgZmlsZWNhY2hlLnBhcnRpYWxzQ2FjaGUucGF0aHMoKSkubGVuZ3RoXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg4pyTIFNldHVwIGNvbXBsZXRlZCBpbiAke3NldHVwVGltZSAtIHN0YXJ0VGltZX1tc2ApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgRG9jdW1lbnRzOiAke2NvdW50c0FmdGVyU2V0dXAuZG9jdW1lbnRzfWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgQXNzZXRzOiAke2NvdW50c0FmdGVyU2V0dXAuYXNzZXRzfWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgTGF5b3V0czogJHtjb3VudHNBZnRlclNldHVwLmxheW91dHN9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICBQYXJ0aWFsczogJHtjb3VudHNBZnRlclNldHVwLnBhcnRpYWxzfWApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBXYWl0IHNwZWNpZmllZCBkZWxheSB0byBzZWUgaWYgYW55IGFkZGl0aW9uYWwgZmlsZXMgYXBwZWFyXG4gICAgICAgICAgICBjb25zdCBkZWxheU1zID0gcGFyc2VJbnQoY21kT2JqLmRlbGF5KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBcXG5XYWl0aW5nICR7ZGVsYXlNc31tcyB0byBjaGVjayBmb3IgbGF0ZSBhZGRpdGlvbnMuLi5gKTtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBkZWxheU1zKSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IGNvdW50c0FmdGVyRGVsYXkgPSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnRzOiAoYXdhaXQgZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLnBhdGhzKCkpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBhc3NldHM6IChhd2FpdCBmaWxlY2FjaGUuYXNzZXRzQ2FjaGUucGF0aHMoKSkubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGxheW91dHM6IChhd2FpdCBmaWxlY2FjaGUubGF5b3V0c0NhY2hlLnBhdGhzKCkpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBwYXJ0aWFsczogKGF3YWl0IGZpbGVjYWNoZS5wYXJ0aWFsc0NhY2hlLnBhdGhzKCkpLmxlbmd0aFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ29tcGFyZSBjb3VudHNcbiAgICAgICAgICAgIGxldCBpc3N1ZURldGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBjaGVja0NhY2hlID0gKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJlZm9yZSA9IGNvdW50c0FmdGVyU2V0dXBbbmFtZV07XG4gICAgICAgICAgICAgICAgY29uc3QgYWZ0ZXIgPSBjb3VudHNBZnRlckRlbGF5W25hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChiZWZvcmUgIT09IGFmdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFxcbuKdjCBJU1NVRSBERVRFQ1RFRDogJHtuYW1lfSBjb3VudCBjaGFuZ2VkIGZyb20gJHtiZWZvcmV9IHRvICR7YWZ0ZXJ9YCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCAgIFRoaXMgaW5kaWNhdGVzIGZpbGVzIHdlcmUgYWRkZWQgYWZ0ZXIgaXNSZWFkeSFgKTtcbiAgICAgICAgICAgICAgICAgICAgaXNzdWVEZXRlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY21kT2JqLnZlcmJvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDinJMgJHtuYW1lfTogJHtiZWZvcmV9IGZpbGVzIChzdGFibGUpYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1xcblJlc3VsdHM6Jyk7XG4gICAgICAgICAgICBjb25zdCBkb2NzT2sgPSBjaGVja0NhY2hlKCdkb2N1bWVudHMnKTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0c09rID0gY2hlY2tDYWNoZSgnYXNzZXRzJyk7XG4gICAgICAgICAgICBjb25zdCBsYXlvdXRzT2sgPSBjaGVja0NhY2hlKCdsYXlvdXRzJyk7XG4gICAgICAgICAgICBjb25zdCBwYXJ0aWFsc09rID0gY2hlY2tDYWNoZSgncGFydGlhbHMnKTtcblxuICAgICAgICAgICAgLy8gVGFnLWluZGV4IHJlYWRpbmVzcy9jb25zaXN0ZW5jeSBjaGVjayAoR2l0SHViIGlzc3VlICMxOTkpLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRoZSAjMTk5IHN5bXB0b20gaXMgc3VidGxlciB0aGFuIGEgY2hhbmdpbmcgZmlsZSBjb3VudDpcbiAgICAgICAgICAgIC8vIGRvY3VtZW50c0NhY2hlLnRhZ3MoKSByZXR1cm5lZCBbXSByaWdodCBhZnRlciBzZXR1cCgpIGV2ZW5cbiAgICAgICAgICAgIC8vIHRob3VnaCBkb2N1bWVudHNXaXRoVGFnKCkgcmV0dXJuZWQgcm93cyBmb3IgdGhlIHNhbWUgdGFncyxcbiAgICAgICAgICAgIC8vIGJlY2F1c2UgdGhlIFRBR0dMVUUgdGFnIGluZGV4IHdhcyBub3QgY29tbWl0dGVkIGJlZm9yZVxuICAgICAgICAgICAgLy8gaXNSZWFkeSB0cmlnZ2VyZWQuICBWZXJpZnkgdGhhdCB0YWdzKCkgaXMgcG9wdWxhdGVkIGFuZCB0aGF0XG4gICAgICAgICAgICAvLyBldmVyeSByZXBvcnRlZCB0YWcgcmVzb2x2ZXMgdG8gYXQgbGVhc3Qgb25lIGRvY3VtZW50LlxuICAgICAgICAgICAgY29uc3QgdGFncyA9IGF3YWl0IGZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS50YWdzKCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgXFxuVGFnIGluZGV4IChpc3N1ZSAjMTk5IGNoZWNrKTpgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIFRhZ3MgcmVwb3J0ZWQgYnkgdGFncygpOiAke3RhZ3MubGVuZ3RofWApO1xuICAgICAgICAgICAgaWYgKHRhZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJyAgTm8gdGFncyBmb3VuZCBpbiB0aGlzIHNpdGUgKHRhZy1pbmRleCBjaGVjayBza2lwcGVkKScpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgdGFnSXNzdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHRhZyBvZiB0YWdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZwYXRocyA9IGF3YWl0IGZpbGVjYWNoZVxuICAgICAgICAgICAgICAgICAgICAgICAgLmRvY3VtZW50c0NhY2hlLmRvY3VtZW50c1dpdGhUYWcodGFnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZwYXRocykgfHwgdnBhdGhzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgICDinYwgSVNTVUUgREVURUNURUQ6IHRhZ3MoKSByZXBvcnRlZCBcIiR7dGFnfVwiIGJ1dCBkb2N1bWVudHNXaXRoVGFnKFwiJHt0YWd9XCIpIHJldHVybmVkIG5vIGRvY3VtZW50c2ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgICAgICBUaGUgdGFnIGluZGV4IHdhcyBub3QgZnVsbHkgY29tbWl0dGVkIGJlZm9yZSBpc1JlYWR5IChpc3N1ZSAjMTk5KWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNzdWVEZXRlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdJc3N1ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY21kT2JqLnZlcmJvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyB0YWcgXCIke3RhZ31cIiAtPiAke3ZwYXRocy5sZW5ndGh9IGRvY3VtZW50KHMpYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF0YWdJc3N1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMgYWxsICR7dGFncy5sZW5ndGh9IHRhZ3MgcmVzb2x2ZSB0byBkb2N1bWVudHMgKHRhZyBpbmRleCBjb25zaXN0ZW50KWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpc3N1ZURldGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1xcbuKchSBTVUNDRVNTOiBObyBmaWxlcyBhZGRlZCBhZnRlciBpc1JlYWR5LiBUaW1pbmcgaXMgY29ycmVjdC4nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnXFxuQWxsIGNhY2hlcyBhcmUgc3RhYmxlOicpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyBEb2N1bWVudHM6ICR7Y291bnRzQWZ0ZXJTZXR1cC5kb2N1bWVudHN9IGZpbGVzYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIEFzc2V0czogJHtjb3VudHNBZnRlclNldHVwLmFzc2V0c30gZmlsZXNgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMgTGF5b3V0czogJHtjb3VudHNBZnRlclNldHVwLmxheW91dHN9IGZpbGVzYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIFBhcnRpYWxzOiAke2NvdW50c0FmdGVyU2V0dXAucGFydGlhbHN9IGZpbGVzYCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1xcbuKaoO+4jyAgRkFJTFVSRTogRmlsZXMgd2VyZSBhZGRlZCBhZnRlciBpc1JlYWR5IHRyaWdnZXJlZCEnKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCcgICBUaGlzIGluZGljYXRlcyBhIHJhY2UgY29uZGl0aW9uIHRoYXQgbmVlZHMgdG8gYmUgZml4ZWQuJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignXFxuICAgUGxlYXNlIHJlcG9ydCB0aGlzIGlzc3VlIGF0OicpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyAgIGh0dHBzOi8vZ2l0aHViLmNvbS9ha2FzaGFjbXMvYWthc2hhcmVuZGVyL2lzc3VlcycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhd2FpdCBha2FzaGEuY2xvc2VDYWNoZXMoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGlzc3VlRGV0ZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGNoZWNrLXJlYWR5IGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbVxuICAgIC5jb21tYW5kKCd2YWxpZGF0ZS1zaXRlbWFwIDxjb25maWdGTj4nKVxuICAgIC5kZXNjcmlwdGlvbignVmFsaWRhdGUgc2l0ZW1hcCBYTUwgZmlsZSBhZ2FpbnN0IHJlbmRlcmVkIG91dHB1dCBkaXJlY3RvcnknKVxuICAgIC5vcHRpb24oJy0tc2l0ZW1hcCA8ZmlsZW5hbWU+JywgJ1NpdGVtYXAgZmlsZW5hbWUgcmVsYXRpdmUgdG8gb3V0cHV0IGRpcmVjdG9yeScsICdzaXRlbWFwLnhtbCcpXG4gICAgLm9wdGlvbignLS1zdHJpY3QnLCAnRXhpdCB3aXRoIGVycm9yIGNvZGUgaWYgdmFsaWRhdGlvbiBmYWlscycsIGZhbHNlKVxuICAgIC5vcHRpb24oJy0tanNvbicsICdPdXRwdXQgcmVzdWx0cyBhcyBKU09OJywgZmFsc2UpXG4gICAgLmFjdGlvbihhc3luYyAoY29uZmlnRk4sIGNtZE9iaikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXBwbHlFbnZPcHRpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IChhd2FpdCBpbXBvcnQoXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGNvbmZpZ0ZOKVxuICAgICAgICAgICAgKSkuZGVmYXVsdDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gbmV3IFNpdGVtYXBWYWxpZGF0b3IoY29uZmlnLCBjbWRPYmouc2l0ZW1hcCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB2YWxpZGF0b3IudmFsaWRhdGUoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNtZE9iai5qc29uKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0LCBudWxsLCAyKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFNpdGVtYXBWYWxpZGF0b3IuZm9ybWF0UmVwb3J0KHJlc3VsdCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY21kT2JqLnN0cmljdCAmJiAocmVzdWx0LmludmFsaWRFbnRyaWVzID4gMCB8fCByZXN1bHQuZXJyb3JzLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB2YWxpZGF0ZS1zaXRlbWFwIGNvbW1hbmQgRVJST1JFRCAke2Uuc3RhY2t9YCk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxucHJvZ3JhbS5wYXJzZShwcm9jZXNzLmFyZ3YpO1xuIl19