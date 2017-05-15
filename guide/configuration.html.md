---
layout: plugin-documentation.html.ejs
title: Configuring an AkashaCMS/AkashaRender project
bookHomeURL: '/toc.html'
---

The `Configuration` object contains everything AkashaRender requires to render an AkashaCMS project.  The project creator uses the Configuration API to create this object.  It is intended this object is created in a Node.js module, and that the filename for that module is passed on the `akasharender` command-line.

For example, the `package.json` for the project can include these `script` tags:

```
"scripts": {
    "prebuild": "akasharender copy-assets config.js",
    "build": "akasharender render config.js",
    ...
}
```

Upon running `npm run build`, it first runs `copy-assets` to copy the asset files to the destination directory, and then uses `render` to render the documents to the destination directory.  The same configuration file, `config.js`, is passed in each case.

One can of course have multiple configuration files for the same project.  For example it's possible for a subsection of a website to also be used to create an EPUB eBook.  In that case, one configuration file describes building the website, and the second configuration describes using a portion of the website content to build the EPUB.

# Configuration file

We briefly touched on the Configuration object in [](2-setup.html), so let's go deeper.

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

config.setMahabhutaConfig({
    recognizeSelfClosing: true,
    recognizeCDATA: true
});

config.prepare();

module.exports = config;
```

This is just a normal every-day Node.js module.  At the top we create a `Configuration` object, in the middle we call methods on that object to make settings, at the bottom we call `config.prepare()` and then assign the Configuration object to `module.exports`.  That last step makes the Configuration object available to AkashaRender.

# Project rootURL

The `rootURL` method declares the base URL of the project.  This is necessary for website projects, so that AkashaRender can generate correct URL's in certain circumstances.

# Input directories and the Output directory

AkashaRender's model is to take files and data from various input sources, and to produce an output directory tree that is the rendered project.  Typically that's a website or EPUB or other HTML-oriented thing.  Maybe it could be used to render other sorts of things, but that hasn't been tested.

The output directory is declared as so:

```
config.setRenderDestination('out-range-confidence');
```

If not specified, `out` is used.  It is intended that this directory be directly useful as the webroot for a web server, or in the case of an EPUB that `epubtools` be able to use the directory to create EPUB3 metadata files and then bundle the EPUB.

## Assets directories

Asset directories contain files which are copied verbatim with no processing.  Any number of asset directories can be declared.  The files are copied in the order in which they're declared in the configuration.  The directory structure in the output directory is copied verbatim from the directory structure of the asset directories.

It is not necessary to declare any asset directories.  Any file in a Documents directory that isn't recognized for processing will be copied verbatim.  But it may be useful to separate the asset directories from documents directories.

The asset files are copied using this command:

```
$ akasharender copy-assets config.js
```

Specifying multiple asset directories is simple:

```
config
    .addAssetsDir('assets1')
    .addAssetsDir('assets2')
    .addAssetsDir('assets3')
```

In addition to declaring the assets directory with a String, you can use an Object to declare where the asset files should land in the output directory.

```
config.addAssetsDir({
        src: '/path/to/shared/fonts/archive',
        dest: 'vendor/fonts'
    });
```

Or

```
config
    .addAssetsDir({
        src: 'node_modules/bootstrap/dist',
        dest: 'vendor/bootstrap'
    })
   .addAssetsDir({
        src: 'node_modules/jquery/dist',
        dest: 'vendor/jquery'
    })
```

The first allows you to share a set of fonts between multiple projects.  Whatever is in the fonts archive directory is then copied into the `vendor/fonts` directory within the output directory.

The second case shows a simple way to include Bootstrap and jQuery files in the output directory.  First you list the `bootstrap` and `jquery` modules in `package.json`.  Those packages do not provide Node.js functionality, but simply bring down the browser-side code for the corresponding packages.  The `dist` directories in each case include the files you'd need to deploy to your website.  With these declarations, the files then land in `vendor/bootstrap` and `vendor/jquery` in the output directory.  The last step is to configure your rendered HTML to use those files.

## Documents directories

Documents directories contain files which might be processed and rendered into the output directory.  The processing that's performed depends on the Rendering objects.  We go over the rendering process elsewhere (TODO: need to document the Rendering process in more depth), so for this discussion simply consider that the contents of the Documents directories may be rendered, or may be copied verbatim.

A single documents directory is declared as so:

```
config.addDocumentsDir('documents');
```

As with assets directories, you call this method multiple times to specify multiple documents directories.

```
config.addDocumentsDir('documents1');
config.addDocumentsDir('documents2');
config.addDocumentsDir('documents3');
```

In addition to declaring a documents directory using a String, you can pass an Object declaring where the documents are rendered in the output directory.


```
config.addDocumentsDir('documents');
config.addDocumentsDir({
    src: 'archive',
    dest: 'archive',
    baseMetadata: {
        meaningOfLife: "42",
        me: "Ashildr Einarrsdottir"
    }
});
```

This says the `archive` directory is rendered into the `archive` subdirectory of the output directory.  Additionally the given metadata is used for files within that hierarchy.

Earlier we said it's possible to use a portion of your website either as website content, or too generate an EPUB.  

One method is to store the EPUB content in a separate directory and in in the website configuration file declare it as so:

```
config.addDocumentsDir({
    src: 'documents-epub',
    dest: 'path/to/epub'
});
```

The other method is to store the EPUB content within the website.  In the EPUB configuration file, declare it as so:

```
config.addDocumentsDir('documents/path/to/epub');
```

Everything under that path is rendered to the output directory.

## Layouts directories

The layouts directories contain page layouts.  

In AkashaCMS the content files we edit are simply the content, and not the whole page layout.  It's assumed you'll have a few standardized page layouts used on multiple pages.  Hence, page layouts should be reusable.

Remember that the page layout is specified in the metadata:

```
---
..
layout: page.html.ejs
..
---
content
```

We find templates by looking in directories specified in the configuration object:

```
config.addLayoutsDir('layouts');
```

We can use multiple `addLayoutsDir` declarations, and AkashaRender will consult each directory in order.  When searching for a specific layout file, it stops at the first matching file.   In this case, with a single directory to search, the matching file would be `layouts/page.html.ejs`.

It's quite easy to have multiple page layouts available.  Simply put as many layout templates as desired in these directories, and specify the appropriate template in the metadata for each file.

In this case there isn't an option for using an Object to specify a layouts directory.


## Partials directories

Partials are little snippets of template, which can be rendered into any location of any template using the `partial` function.  They are the first stage of implementing arbitrary page layouts.  Because the partials are available to all page layouts, this is an excellent way to implement common elements that are shared between different page layouts.

An example is

```
<%- partial('helloworld.html') %>
```

Because this is a simple `.html` file, its content is simply copied verbatim into the rendering.

You can pass data to a partial as so:

```
<%- partial('listrender.html.ejs',
    {
        items: {
            "item 1": "item text 1",
            "item 2": "item text 2",
            "item 3": "item text 3",
            "item 4": "item text 4"
        }
    })
%>
```

The named partial template is searched for in the directories named in the configuration object.

```
config.addPartialsDir('partials')
```

As for layout templates, you can have multiple `.addPartialsDir` directories.  The partials directories are searched in order, with the first matching file being the one that's used.  The filename selects a Renderer for rendering the partial.  Whether the partial renders the data it is given depends on the Renderer corresponding to the filename.

# Stylesheets and JavaScript

Websites and EPUB's usually have Stylesheets and JavaScript.  Well, JavaScript isn't that useful in an EPUB, but is certainly useful in a website.  

An example is:

```
config
    .addFooterJavaScript({ href: "/vendor/jquery/jquery.min.js" })
    .addFooterJavaScript({ href: "/vendor/bootstrap/js/bootstrap.min.js"  })
    .addStylesheet({       href: "/vendor/bootstrap/css/bootstrap.min.css" })
    .addStylesheet({       href: "/vendor/bootstrap/css/bootstrap-theme.min.css" })
    .addStylesheet({       href: "/style.css" });
```

The difference between FooterJavaScript and HeaderJavaScript is whether the code is placed in the `<head>` section, or just before the closing `</body>` tag.  Some recommend that JavaScript be placed at the bottom of the page, and this allows you to do so.

The declarations shown here correspond to the asset directory declarations shown earlier.  Together they are a method to initialize jQuery and Bootstrap on your site.  Then the last, `/style.css`, gives you the opportunity for your customizations.

# Mahabhuta functions

An AkashaCMS project might have its own Mahabhuta functions.  There are several ways to do this, the most straightforward being to declare this in the configuration file:

```
config.addMahabhuta(require('./mahafuncs'));
```

Then in that module you have code like:

```
`use strict`
...
const mahabhuta = require('mahabhuta');
...
module.exports = new mahabhuta.MahafuncArray("example.com website", {});
```

Then you add Mahabhuta custom element classes to that object.

# Plugins

Plugins extend the capabilities of AkashaRender.  We can loosely define AkashaCMS as the result of combining AkashaRender with the various plugins.  

A plugin is a Node.js module that hooks into the AkashaRender API's, providing partials or layouts or custom Mahabhuta elements or other custom processing.  We'll discuss writing plugins elsewhere.  (TODO Document this elsewhere)

To use a plugin requires two steps.  First, you declare the plugin in the `package.json` dependencies so that its module gets installed.

Second, in the configuration you declare the plugin as so:

```
config
    .use(require('akashacms-theme-bootstrap'))
    .use(require('akashacms-base'))
    .use(require('akashacms-breadcrumbs'))
    .use(require('akashacms-booknav'))
    .use(require('akashacms-embeddables'))
    .use(require('akashacms-footnotes'))
    .use(require('akashacms-blog-podcast'))
    .use(require('akashacms-tagged-content'));
```

Notice that we use the Node.js `require` function.  Simply ensure the module lands in the `node_modules` directory and this will work.

Built-in to AkashaRender is one additional plugin, called `built-in`, that provides some common universally useful functionality.  It is installed behind the scenes as the very last plugin.

## Plugins add Layouts, Partials, Mahabhuta, Stylesheets, JavaScript, etc

Plugins typically call the `addPartialsDir` and other similar methods we've just discussed.  This way a Plugin can provide partials and other functionality.


## Plugin Configuration

Some plugins offer methods to configure their behavior.  You access them using this pattern:

```
config.plugin("akashacms-base").generateSitemap(config, true);
```

The `config.plugin("plugin-name")` method returns the Plugin object, and then you can call its methods as shown.  You should consult the documentation of each plugin for further details.

## Plugin data

The Configuration object can be used to store data for a given plugin.  This data isn't stored in the Plugin object in case there are multiple Configuration objects being used.

The `config.pluginData("plugin-name")` method returns an Array that's maintained for each plugin.  The plugin will store whatever it needs in that array.

# The Overridability Principle

A key principle in AkashaCMS is that a project or Plugin can override functionality provided by a Plugin.  

All these lists, the Partials, Layouts, etc directories, are constructed such that content in a directory declared early override matching content in a later directory.  An example is that the `akashacms-theme-bootstrap` plugin provides Bootstrap-friendly implementations of Partial's implemented by other Plugins.

The `partials` directory in that plugin contains several partials with the same file name as provided by other plugins.  For example, the `akashacms-booknav` module provides a partial named `booknav-child-tree.html.ejs`, which is also provided by `akashacms-theme-bootstrap`.  The two are similar, but the latter uses Bootstrap classes for a nicer presentation.

So long as `use(require('akashacms-theme-bootstrap'))` appears before `use(require('akashacms-booknav'))`, the Partial in `akashacms-theme-bootstrap` will take precedence.  How does this work?

When AkashaRender is looking for a Document, Layout or Partial, it searches the directories in the corresponding list in order.  The first match it finds is what's used.  Because both `akashacms-theme-bootstrap` and `akashacms-booknav` calls `addPartialsDir('partials')` (as do the other Plugins), the list of Partials directories includes each participating Plugin.  

When `booknav-child-tree.html.ejs` is used, AkashaRender searches in order, and so long as the `use()` calls are as shown above, the version in `akashacms-theme-bootstrap` will be used.  A particular project can additionally override that template by including its own version in its own Partials directory.

## How to override stylesheets, JavaScript or Mahabhuta?

These things do not get overridden in the same way.  For Documents, Layouts or Partials, the fact that AkashaRender searches through directories gives an easy method to override the matching file.  For these other objects, overriding is not clear-cut.

**Stylesheets** Every CSS file ends up being listed in order in rendered HTML files.  You can override a given CSS declaration by putting a matching CSS declaration in a later file.  That's because of how CSS works.

**JavaScript** Every JavaScript file ends up being listed, in order, in the rendered HTML.  There's no method to override functions in one JavaScript by a function in another JavaScript file.

**Mahabhuta** Every Mahafunc ends up in the array of Mahafunc's that are executed.  There's no method to override anything, since all Mahafunc's are executed.

# Preparing the Configuration

We close off the configuration file this way:

```
config.prepare();
module.exports = config;
```

The `prepare` method is what fills in defaults for missing declarations and so forth.

The last line exports the configuration object so that AkashaRender can access it.
