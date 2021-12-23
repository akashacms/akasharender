---
title: Project Setup
layout: ebook-page.html.ejs
publicationDate: December 22, 2021
---

An AkashaRender project directory has these attributes:

* `package.json` This file lists dependencies on Node.js packages used to build the project, and a _scripts_ section containing commands to drive the rendering and deployment process.
* Several input directories to hold project assets, content files, layout templates, and partials (smaller templates).
* One or more AkashaRender configuration files, _e.g._ `config.js`, describing the rendering process.  Typically there will be one configuration file, but sometimes you'll need more than one to reuse the same content for multiple destinations.
* (Optionally) Another Node.js script containing DOM processing functions for use with the Mahabhuta engine.


AkashaCMS is written for the Node.js platform, and therefore requires that you install Node.js first.  If you don't have Node.js installed the `npm` commands above will have failed.

The first stop is the [Node.js download page](https://nodejs.org/en/download/) where you'll see all the download options.  You may prefer to install via a package manager for your system, [which is also documented on nodejs.org](https://nodejs.org/en/download/package-manager/).

A quick test is to run these commands

```
$ node --help
$ npm help
```

Once you've verified Node.js is available, you can initialize a directory for an AkashaCMS project.  The [AkashaCMS _Getting Started_ guide on project initialization](https://akashacms.com/quick-start/initialization.html) explains what to do.
