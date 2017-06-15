---
layout: ebook-page.html.ejs
title: Writing AkashaCMS plugins for use by AkashaRender projects
---

Remember that AkashaCMS is a generalized name for the synergistic combination of AkashaRender with the plugins.  In this section we'll look into coding a Plugin.  Plugins provide useful extensions to AkashaRender, and what makes AkashaCMS is the combination of AkashaRender, Mahabhuta, and the plugins.

It is not required to register a plugin with anyone.  As we saw [in the documentation on using plugins](plugins-using.html), a project uses a plugin by declaring it in the `package.json` and Configuration.  No centralized registry is required.  

Anyone who has developed a generally useful Plugin may register it on the [list of known plugins](https://akashacms.com/new/plugins/index.html).  We can even arrange for the plugin documentation to appear on the AkashaCMS website.

# The Plugin object

Inside AkashaRender the Plugin object is used to encapsulate information about each Plugin.  It is a simple object with two methods:

* `configure` is called when the Plugin is added to the Configuration by calling `config.use()`
* `name` returns the name of the Plugin, and is used when searching for the Plugin instance

A given Plugin is free to implement other functions as well.  Those functions can be called by any code as so:

```
  config.plugin("plugin-name").functionName(parameter, list);
```

# The Plugin module

The typical implementation of a Plugin is to create a Node.js package that returns the Plugin object.  To see what that means let's walk through the `akashacms-base` plugin (https://github.com/akashacms/akashacms-base).

The package contains a `package.json` and an `index.js` as is typical of a Node.js package.  

The `package.json` declares information required for _npm_ such as the package name, its repository, any scripts, and most importantly the dependencies.  Often a Plugin will other Node.js packages to do the heavy lifting.  For example the `akashacms-embeddables` Plugin uses other packages providing OEmbed-based query for metadata and embed codes of content on other websites.

The `index.js` contains at the minimum the Plugin object, which it exports using the `module.exports` object.  A minimal `index.js` might be:

```
const path  = require('path');
const util  = require('util');
const url   = require('url');
const co    = require('co');
const akasha = require('akasharender');
const mahabhuta = require('mahabhuta');

const pluginName = "akashacms-base";

module.exports = class BasePlugin extends akasha.Plugin {
    constructor() {
        super(pluginName);
    }

    configure(config) {
        config.addPartialsDir(path.join(__dirname, 'partials'));
        config.addLayoutsDir(path.join(__dirname, 'layout'));
        config.addAssetsDir(path.join(__dirname, 'assets'));
        config.addMahabhuta(module.exports.mahabhuta);
        // OR
        // config.addMahabhuta(require('./mahafuncs'));
    }
}
```

When `config.use(require("plugin-name"))` is called this sequence occurs:
1. the `use` function receives this object
1. an instance of that object is instantiated (`new PluginObj()`)
1. that instance is added to an internal array
1. the `configure` function is called

The `configure` function shown here is fairly typical.  It uses functions we've already seen to add Plugin-provided directories of assets or partials and an array of Mahabhuta functions.  It could call other functions to add JavaScript, CSS and other things.

### Partials

For `akashacms-base` partials, see https://github.com/akashacms/akashacms-base/partials

The purpose of this plugin is functionality useful for all websites, and the Partials it provides match that purpose.  

Partials should endeavor to use CSS classes so website authors can easily customize the look of the partial

### Assets directory

See https://github.com/akashacms/akashacms-base/assets/img

A useful naming convention is to store assets in: `/vendor/plugin-name/asset.file`

### Mahafuncs

See the Mahabhuta documentation to see how to write Mahafuncs: https://akashacms.com/new/mahabhuta/index.html

### Stashing data in the Configuration

The Configuration object can store per-config-per-plugin data.

For example, in `akashacms-base` we have this in the `configure` function:

```
config.pluginData(pluginName).linkRelTags = [];
```

This data object corresponds to the `addLinkRelTag` function which provides data that ends up being `<link rel="...">` tags in the header.
