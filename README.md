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
  renderto <configFN> <documentFN>         Call renderTo for a document
  render-document <configFN> <documentFN>  Render a document into output directory
  render [options] <configFN>              Render a site into output directory
  gh-pages-publish [options] <configFN>    Publish a site using Github Pages.  Takes the rendering destination, adds it into a branch, and pushes that to Github
  config <configFN>                        Print a site configuration
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

AkashaCMS plugins extend the capabilities of the system.

For more information see:

* Project website:  https://akashacms.com
* Source for project website: https://github.com/akashacms/akashacms-website
* Example repository: https://github.com/akashacms/akashacms-example
* Website matching the example: https://example.akashacms.com/




* caching.js:    return cache.getKey(`${module}-${key}`);
* documents.js:        let fileData = cache.get("documents-search", fullFilePath);
    * Wants the data for a pathname
* documents.js:    var doc = cache.get("documents-readDocument", documentPath);
    * Wants the data for a pathname
* filez.js:    var cached = cache.get("filez-findAsset", filename);
* filez.js:    var cached = cache.get("filez-findRendersTo", rendersTo);
    * Wants the data for a pathname

TODO:

* DONE Rewrite watcher/watcher to only send out events
    * TODO - move find function to an appropriate place
    * TODO - add methods to add a directory to watch, or remove a directory from being watched.
* In the Configuration object:
    * set up the watcher instances
    * As addDocumentsDir/etc are called, add to the corresponding watcher
    * Add corresponding removeDocumentsDir/etc functions, and also remove from corresponding watcher
* Create cache-filez - listens to those events - using cache-forerunner, set up data storage for file data
* Rewrite the code in documents.js to match
* Rewrite the code which uses functions in filez.js to match
