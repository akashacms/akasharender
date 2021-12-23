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


