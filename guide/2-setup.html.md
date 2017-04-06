---
title: Project Setup
layout: ebook-page.html.ejs
bookHomeURL: '/toc.html'
---

An AkashaRender project directory has these attributes:

* _package.json_ This file lists dependencies on Node.js packages used to build the project, and a _scripts_ section containing commands to drive the rendering and deployment process.
* Several input directories to hold project assets, content files, layout templates, and partials (smaller templates).
* One or more AkashaRender configuration files, _e.g._ `config.js`, describing the rendering process.  Typically there will be one configuration file, but sometimes you'll need more than one to reuse the same content for multiple destinations.
* (Optionally) Another Node.js script containing DOM processing functions for use with the Mahabhuta engine.

## Simple project initialization

Start by making a project directory:

```
$ mkdir myproject
$ cd myproject
$ npm init
... answer all the questions asked by npm init

Is this ok? (yes) yes
```

Then install AkashaRender and globfs.

```
$ npm install globfs akasharender --save
```

If this project is to generate an EPUB3, then you must also install epubtools:

```
$ npm install epubtools --save
```

Next, make some directories:

```
$ mkdir assets documents layouts partials
```

Make an empty CSS file (or fill it with CSS of your desire)

```
$ mkdir assets/style
$ touch assets/style/main.css
```

It's also easy to use LESS that is autocompiled to CSS.  Do this instead:


```
$ mkdir documents/style
$ touch documents/style/main.css.less
```

We'll go over this later, but AkashaRender automatically compiles LESS code to CSS when the file is named with this double extension.

## A simple template file

Create a simple layout template as `layouts/page.html.ejs` containing

```
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title><%= title %></title>
<link rel="stylesheet" href="/style/main.css"
      type="text/css" media="screen"/>
</head>
<body>
<%- content %>
</body>
</html>
```

The double file extension is a convention in AkashaRender meant to indicate

* _filename.css.less_: The file is first compiled from LESS, and is output as CSS to: _filename.css_
* _filename.html.ejs_: The file is rendered with EJS, and is output as HTML to: _filename.html_
* _filename.html.md_: The file is rendered with Markdown, and is output as HTML to: _filename.html_

The template file demonstrates two types of content inclusion, using EJS.  With `<%= title %>` we are inserting a metadata value with interpolation such that any HTML tags get encoded.  However with `<%- content %>` the metadata value is not encoded, so that any HTML tags are copied verbatim.

The `content` variable is special in that it's the result of the previous rendering.  All other values we might include come from the frontmatter.

## A simple content file

Now let's create a simple content document, as `documents/index.html.md`.

```
---
layout: page.html.ejs
title: Four Score and Seven Years Ago
---

Four score and seven years ago our fathers brought forth on this continent a new nation conceived in liberty and dedicated to the proposition that all men are created equal.
```

The frontmatter appears between the --- lines.  It is formatted with YAML, a fairly simple markup system to represent data objects as simple text.  The best documentation I know of for YAML is on the Wikipedia: https://en.wikipedia.org/wiki/YAML

The way to interpret the file name is to think of multiple extensions that describe the conversion process and the final output format.  In this case the file is written in Markdown, and produces HTML.

## A simple configuration file

An AkashaRender configuration file is actually a Node.js script.  It contains Configuration commands describing how to render this content for a specific destination.

A typical name for this file is `config.js`.

```
'use strict';

const akasha  = require('akasharender');

const config = new akasha.Configuration();

config.rootURL("http://example.com");

config
    .addAssetsDir('assets')
    .addLayoutsDir('layouts')
    .addDocumentsDir('documents')
    .addPartialsDir('partials');

config
    .use(require('akashacms-theme-bootstrap'))
    .use(require('akashacms-base'))
    .use(require('akashacms-breadcrumbs'))
    .use(require('akashacms-booknav'))
    .use(require('akashacms-embeddables'));

config.setMahabhutaConfig({
    recognizeSelfClosing: true,
    recognizeCDATA: true
});

config.prepare();

module.exports = config;
```

The `akasha.Configuration` object contains all the data describing the rendering of input files to produce an output - such as an eBook or website.

The first section we show tells AkashaRender the input directories to use, and their purpose.  These commands aren't entirely necessary, because of the baked-in default directory names.  But, if you need to change the names you can use these functions.

The `.use` method declares a plugin to use in the rendering.  Plugins extend AkashaRender's capabilities adding useful functionality, such as breadcrumb trail generation, or supporting embedding content from 3rd party services like Youtube.

The `.setMahabhutaConfig` method is necessary for the Mahabhuta DOM processing engine.  Mahabhuta supports a jQuery-like API for processing HTML during the rendering process.  Because it uses Cheerio under-the-covers, the values specified in this object actually from the Cheerio project.

The `.prepare` method adds the baked-in default configuration values so that AkashaRender will be able to function even if you forgot to declare something.

The last line is required for AkashaRender to access the configuration data.

## A build simple process

The last thing is to set up the scripts section of the `package.json` with tasks used in building the project:

```
"scripts": {
  "clean": "rm -rf out",
  "prebuild": "akasharender copy-assets config.js",
  "build": "akasharender render config.js"
},
```

This defines two commands, which you can run as so:

```
$ npm run clean
$ npm run build
```

And the project is built for you.

The `akasharender` command takes several commands, two of which we see here.  With `copy-assets` it copies files from the _assets_ directory to the _renderDestination_ directory.  The assets files are ones which AkashaRender does not manipulate, instead they're copied verbatim.  The second command, `render`, is where AkashaRender does manipulate files.  These files are located in the _documents_ directory, and are rendered into the _renderDestination_ directory.

The configuration file is named on the command line so that you can use different configuration files for different purposes.  For example it's possible to take the content of an eBook and render it into an EPUB file or as a website, simply with different configuration files.