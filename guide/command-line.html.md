---
layout: ebook-page.html.ejs
title: The AkashaRender command line
publicationDate: August 11, 2020
---

When AkashaRender is installed, a new command is available:  `akasharender`

```
$ akasharender --help
Usage: akasharender [options] [command]

Options:
  -V, --version                            output the version number
  -h, --help                               output usage information

Commands:
  copy-assets <configFN>                   Copy assets into output directory
  document <configFN> <documentFN>         Show information about a document
  renderto <configFN> <documentFN>         Call renderTo for a document
  render-document <configFN> <documentFN>  Render a document into output directory
  render [options] <configFN>              Render a site into output directory
  gh-pages-publish [options] <configFN>    Publish a site using Github Pages.  Takes the rendering destination, adds it into a branch, and pushes that to Github
  config <configFN>                        Print a site configuration
```

For any of the commands you can get further help by running:

```
$ akasharender _commandName_ --help
```

