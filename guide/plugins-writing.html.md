---
layout: ebook-page.html.ejs
title: Writing AkashaCMS plugins for use by AkashaRender projects
publicationDate: June 25, 2017
---

Remember that AkashaCMS is a generalized name for the synergistic combination of AkashaRender with the plugins.  In this section we'll look into coding a Plugin.  Plugins provide useful extensions to AkashaRender, and what makes AkashaCMS is the combination of AkashaRender, Mahabhuta, and the plugins.

It is not required to register a plugin with anyone.  As we saw [in the documentation on using plugins](plugins-using.html), a project uses a plugin by declaring it in the `package.json` and Configuration.  No centralized registry is required.  

Anyone who has developed a generally useful Plugin may register it on the [list of known plugins](https://akashacms.com/plugins/index.html).  We can even arrange for the plugin documentation to appear on the AkashaCMS website.

# The Plugin object

Inside AkashaRender the Plugin object is used to encapsulate information about each Plugin.  It is a simple object with two methods:

* `configure` is called when the Plugin is added to the Configuration by calling `config.use()`
* `name` returns the name of the Plugin, and is used when searching for the Plugin instance
* `options` returns the _options_ object passed when configuring the Plugin

A given Plugin is free to implement other functions as well.  Those functions can be called by any code as so:

```js
  config.plugin("plugin-name").functionName(parameter, list);
```

# The Plugin module

The typical implementation of a Plugin is to create a Node.js package that returns the Plugin object.  To see what that means let's walk through the `akashacms-base` plugin (https://github.com/akashacms/akashacms-base).

The package contains a `package.json` and an `index.js` as is typical of a Node.js package.  

The `package.json` declares information required for _npm_ such as the package name, its repository, any scripts, and most importantly the dependencies.  Often a Plugin will other Node.js packages to do the heavy lifting.  For example the `akashacms-embeddables` Plugin uses other packages providing OEmbed-based query for metadata and embed codes of content on other websites.

The `index.js` contains at the minimum the Plugin object, which it exports using the `module.exports` object.  A minimal `index.js` might be:

```js
const path  = require('path');
const util  = require('util');
const url   = require('url');
const akasha = require('akasharender');
const mahabhuta = akasha.mahabhuta;

const pluginName = "akashacms-base";

const _plugin_config = Symbol('config');
const _plugin_options = Symbol('options');

module.exports = class BasePlugin extends akasha.Plugin {
    constructor() {
        super(pluginName);
    }

    configure(config, options) {
        this[_plugin_config] = config;
        this[_plugin_options] = options;
        options.config = config;
        config.addPartialsDir(path.join(__dirname, 'partials'));
        config.addLayoutsDir(path.join(__dirname, 'layout'));
        config.addAssetsDir(path.join(__dirname, 'assets'));
        config.addMahabhuta(module.exports.mahabhutaArray(options));
    }

    get config() { return this[_plugin_config]; }
    get options() { return this[_plugin_options]; }

}
```

When `config.use(require("plugin-name"), { options })` is called this sequence occurs:
1. the `use` function receives this object
1. an instance of that object is instantiated (`new PluginObj()`)
1. that instance is added to an internal array
1. the `configure` function is called

The `configure` function shown here is fairly typical.  It uses functions we've already seen to add Plugin-provided directories of assets or partials and an array of Mahabhuta functions.  It could call other functions to add JavaScript, CSS and other things.

As shown here the `options` object is available from the Plugin, and is passed while constructing the MahafuncArray so that it is available to Mahafuncs.

### Partials

For `akashacms-base` partials, see https://github.com/akashacms/akashacms-base/partials

The purpose of this plugin is functionality useful for all websites, and the Partials it provides match that purpose.  

Partials should endeavor to use CSS classes so website authors can easily customize the look of the partial

### Assets directory

See https://github.com/akashacms/akashacms-base/assets/img

A useful naming convention is to store assets in: `/vendor/plugin-name/asset.file`

### Mahafuncs

See the Mahabhuta documentation to see how to write Mahafuncs: https://akashacms.com/mahabhuta/toc.html

To see how Mahabhuta is used in AkashaCMS projects, it's useful to study some source code:

* [akashacms/akashacms-affiliates](https://github.com/akashacms/akashacms-affiliates/blob/master/index.js)
* [akashacms/akasharender](https://github.com/akashacms/akasharender/blob/master/built-in.js)
* [akashacms/akashacms-base](https://github.com/akashacms/akashacms-base/blob/master/index.js)
* [akashacms/akashacms-blog-podcast](https://github.com/akashacms/akashacms-blog-podcast/blob/master/index.js)
* [akashacms/akashacms-booknav](https://github.com/akashacms/akashacms-booknav/blob/master/index.js)
* [akashacms/akashacms-breadcrumbs](https://github.com/akashacms/akashacms-breadcrumbs/blob/master/index.js)
* [akashacms/akashacms-document-viewers](https://github.com/akashacms/akashacms-document-viewers/blob/master/index.js)
* [akashacms/akashacms-embeddables](https://github.com/akashacms/akashacms-embeddables/blob/master/index.js)
* [akashacms/akashacms-footnotes](https://github.com/akashacms/akashacms-footnotes/blob/master/index.js)
* [akashacms/akashacms-tagged-content](https://github.com/akashacms/akashacms-tagged-content/blob/master/index.js)

In each case, the Plugin `configure` method contains a line of code similar to:

```js
config.addMahabhuta(... MahafuncArray ...);
```

As we showed earlier this MahafuncArray is initialized by calling a function, passing along the options object.  That function should look like so:

```js

module.exports.mahabhutaArray = function(options) {
    let ret = new mahabhuta.MahafuncArray(pluginName, options);
    ...
    ret.addMahafunc(new MahafuncElementClass());
    ...
    return ret;
};
```

And from there start adding Mahafunc instance's to the MahafuncArray.

In a website `config.js` the steps are similar.  For example:

```js
config.addMahabhuta(require('./mahafuncs'));
```

Then in `mahafuncs.js` you create a MahafuncArray

```js
module.exports = new mahabhuta.MahafuncArray("techsparx website", {});
```

And start filling it with Mahafunc's.

### Stashing data in the Configuration

Store any data in the options object.
