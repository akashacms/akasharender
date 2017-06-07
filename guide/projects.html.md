---
layout: ebook-page.html.ejs
title: AkashaRender Projects, package.json, build process
# bookHomeURL: '/toc.html'
---

Two kinds of projects:  Websites, EPUB .... could serve more purposes if anyone wants.

What defines a project:
1. Configuration file
2. Assets, Documents, Layouts, Partials directories
3. package.json to define dependencies and build processes

We use `package.json` to bring in plugin's and other tools.  AkashaRender is written in Node.js, and therefore the best tool to describe dependencies is the `package.json`

That file also provides a simple mechanism for describing build procedures -- the `script` section.  Theoretically one could use other build tools like `grunt` to drive an AkashaRender build.  The NPM `script` feature has proven to be powerful enough for projects up to the middle-level of complexity.

Useful script targets are:
1. `clean` - remove everything
2. `build` - run the build process
3. `preview` - run a local webserver so you can view the result locally
4. `deploy` - copy the rendered website to a webserver - if your processes use a testing server, production server, etc, then use multiple `deploy-testing`, `deploy-production` scripts

It's easy to add a step like minification in a `postbuild` script

Also:  `  "build": "npm run render-site && npm run minify-site && npm run html-validation && npm run css-linter "`

That's a way to cleanly specify multiple steps beyond the `preXYZZY` and `postXYZZY` policy in npm.
