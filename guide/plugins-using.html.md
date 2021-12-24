---
layout: ebook-page.html.ejs
title: Using AkashaCMS plugins in AkashaRender projects
# bookHomeURL: '/toc.html'
---

AkashaRender is the name for the rendering system at the heart of AkashaCMS.   AkashaCMS is the name for the whole system, comprised of the Mahabhuta custom element processing engine, and the plugins.  An AkashaCMS plugin hooks into the AkashaRender rendering process, and the plugin usually provides custom HTML processing with Mahabhuta, resulting in extending the system with new capabilities.

AkashaCMS is the generalized name for the synergistic combination of AkashaRender, Mahabhuta, and the plugins.

See [list of known plugins](https://akashacms.com/new/plugins/index.html)

We've already seen quite a bit about using plugins in [](configuration.html)

# The two-step process to adding an AkashaCMS plugin to an AkashaRender project

Adding the plugin to the `package.json` file enables `npm` to install and update the plugin.  Simply add the package to the `dependencies` as noted in [AkashaRender Projects, and using package.json to describe the build process](https://akashacms.com/quick-start/projects.html)

With the plugin installed in the Node.js `node_modules` directory, you inform AkashaRender with `config.use(require("plugin-reference"))` in the Configuration.  See [](configuration.html)

## Plugin Configuration

Some plugins offer methods to configure their behavior.  You access them using this pattern:

```js
config.plugin("plugin-name").generateSitemap(config, true);
```

TODO command to query configuration -- such as list of plugins -- directories

# Using and overriding typical plugin-provided functionality

We learn the capabilities of a plugin primarily in the documentation.  But it's also useful to inspect certain directories.

Remember that AkashaRender was designed to allow projects to override behavior of plugins.  We'll discuss how this is done in each section.

## Partials directory

The default look-and-feel of plugin features is determined by the partials it uses.  They'll be stored in the _partials_ directory, of course.

You can easily override a given partial by implementing one with the same file name in the project _partials_ directory.

## Assets directory

Any static files will be stored in the _assets_ directory.

To override such a file, simply put a file with the same path-name in the project _assets_ directory.

## Layouts directory

Theoretically a plugin could provide layouts.

If a plugin were to provide a layout, it could be overridden with a file of the same name in the project _layouts_ directory.

## Mahabhuta functions

Typically a plugin supplies Mahabhuta functions.  Those functions will either be in the `index.js` or a separate module, such as `mahafuncs.js`.

Because of the nature of Mahabhuta processing, it's tricky to override Mahabhuta-provided capabilities.  In Mahabhuta's case we do not have a simple algorithm for searching for Mahabhuta function objects.  Instead they're stored in arrays of arrays and every Mahabhuta function is executed on every run through the arrays.

It is possible to override a CustomElement so long as you're careful to add project Mahabhuta functions before adding any plugins.  A CustomElement removes itself from the HTML once it is processed, so the first CustomElement function object to process it will supplant any other CustomElement targeting the same tag name.  Therefore, if you see a CustomElement in a plugin to override, simply implement the same CustomElement in your project.
