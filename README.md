# AkashaRender - Rendering engine for AkashaCMS

AkashaCMS is a collection of static website generation tools.  The primary purpose is publishing websites, but a related set of tools called AkashaEPUB allows one to generate EPUB documents.

AkashaRender is the core tool for AkashaCMS/AkashaEPUB.

The available commands are:

```
Usage: akasharender [options] [command]

Options:
  -V, --version                            output the version number
  -h, --help                               display help for command

Commands:
  copy-assets <configFN>                   Copy assets into output directory
  document <configFN> <documentFN>         Show information about a document
  render-document <configFN> <documentFN>  Render a document into output directory
  render [options] <configFN>              Render a site into output directory
  check-ready [options] <configFN>         Verify that all files are loaded before 
                                           isReady triggers (diagnostic tool)
  explain <configFN>                       Explain a cache query
  watch <configFN>                         Track changes to files in a site, and rebuild
                                           anything that changes
  gh-pages-publish [options] <configFN>    Publish a site using Github Pages.  Takes the
                                           rendering destination, adds it into a branch,
                                           and pushes that to Github
  config <configFN>                        Print a site configuration
  docdirs <configFN>                       List the documents directories in a site
                                           configuration
  assetdirs <configFN>                     List the assets directories in a site
                                           configuration
  partialdirs <configFN>                   List the partials directories in a site
                                           configuration
  layoutsdirs <configFN>                   List the layouts directories in a site
                                           configuration
  documents <configFN>                     List the documents in a site configuration
  docinfo <configFN> <docFN>               Show information about a document in a site
                                           configuration
  tags <configFN>                          List the tags
  search [options] <configFN>              Search for documents
  assets <configFN>                        List the assets in a site configuration
  assetinfo <configFN> <docFN>             Show information about an asset in a site
                                           configuration
  layouts <configFN>                       List the layouts in a site configuration
  layoutinfo <configFN> <docFN>            Show information about a layout in a site
                                           configuration
  partials <configFN>                      List the partials in a site configuration
  partialinfo <configFN> <docFN>           Show information about a partial in a site
                                           configuration
  index [options] <configFN>               Loads configuration, indexes content, then 
                                           exits (use --verbose for summary)
  help [command]                           display help for command
```

The configuration file parameter, _configFN_, is the filename for a JavaScript file that sets up an AkashaRender configuration object.

The typical usage for the commands is with these `package.json` scripts:

```
 "scripts": {
    "prebuild": "akasharender copy-assets config.js",
    "build": "akasharender render config.js",
    "deploy": "cd out && rsync --archive --delete --verbose ./ user-name@example.com:example.com/ "
}
```

The model is to have several input directories, containing content and assets for the resulting website, and one output directory for the rendered website (or EPUB).  The possible input directories are:

* `assets` -- Files that are simply copied and require no rendering
* `documents` -- Files that may require rendering, such as converting LESS to CSS, or Markdown/AsciiDoc to HTML
* `partials` -- Template snippets that can be used anywhere in a document
* `layouts` -- Page layout templates

The `prebuild` step uses `copy-assets` to copy files from the assets directory to the rendering directory.  The `build` step then renders content from the documents directory to the rendering directory.

In this case the rendering directory is `out`, and the `deploy` step uses `rsync` to upload that directory to a webserver.

## Diagnostic Commands

### check-ready - Verify Cache Timing

The `check-ready` command is a diagnostic tool that verifies all files are loaded into the cache before the `isReady` event triggers. This helps ensure that rendering operations have access to the complete file list.

```bash
npx akasharender check-ready config.js [options]
```

Options:
- `--verbose` - Show detailed per-cache results
- `--delay <ms>` - Wait time in milliseconds to check for late additions (default: 2000)

The command:
1. Loads your site configuration
2. Records the number of files in each cache (documents, assets, layouts, partials)
3. Waits for the specified delay
4. Checks if any additional files appeared after the initial load
5. Reports success (exit code 0) or failure (exit code 1)

**Example output:**
```
Running isReady timing check...

✓ Setup completed in 113ms
  Documents: 80
  Assets: 3
  Layouts: 11
  Partials: 20

Waiting 2000ms to check for late additions...

Results:

✅ SUCCESS: No files added after isReady. Timing is correct.

All caches are stable:
  ✓ Documents: 80 files
  ✓ Assets: 3 files
  ✓ Layouts: 11 files
  ✓ Partials: 20 files
```

Use this command if you suspect files are being rendered before all content is loaded, or to verify cache timing in your CI/CD pipeline.

### index - Load and Index Files

The `index` command loads your site configuration, indexes all content files, and exits. This is useful for verifying that your configuration is correct and all files are being found.

```bash
npx akasharender index config.js [--verbose]
```

Options:
- `--verbose` - Show detailed event tracking as files are added, plus summary

**Example output with --verbose:**
```
Indexing files with verbose output...

[ADDED] assets: file.txt
[ADDED] assets: file-virgin.txt
[ADDED] assets: rss_button.png
[READY] assets

[ADDED] partials: helloworld.html
[ADDED] partials: helloworld2.html
...
[READY] partials

[ADDED] layouts: default.html.ejs
...
[READY] layouts

[ADDED] documents: index.html.md
[ADDED] documents: page1.html.md
...
[READY] documents

✓ Indexing completed in 105ms

=== Summary ===
Documents: 80 files
Assets: 3 files
Layouts: 11 files
Partials: 20 files
Total: 114 files
```

The verbose mode shows:
- **[ADDED]** events as each file is found and indexed
- **[READY]** events when each cache type completes indexing
- **[ERROR]** events if any files fail to process
- Final summary with counts and timing

Without `--verbose`, the command runs silently, which is useful in scripts where you only want to verify the configuration loads correctly.

Use this command to:
- Verify your configuration is valid
- See exactly which files are being indexed
- Watch the indexing process in real-time
- Debug missing or unexpected files
- Measure how long indexing takes
- Test configuration changes before rendering

AkashaCMS plugins extend the capabilities of the system.

For more information see:

* Project website:  https://akashacms.com
* Source for project website: https://github.com/akashacms/akashacms-website
* Example repository: https://github.com/akashacms/akashacms-example
* Website matching the example: https://example.akashacms.com/


