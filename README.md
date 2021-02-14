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
