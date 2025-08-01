---
layout: ebook-page.html.ejs
title: AkashaRender Rendering Engines - usage and implementation
publicationDate: June 27, 2017
---

The `file-name.foo.bar` filename convention is used to identify the rendering engine for a given file.  The rendering engine in turn determines the processing to convert a `.bar` file into a `.foo` file.  That is, the filename convention not only identifies the rendering engine to use, but is meant to imply the _input format_ and _output format_, for example the `.html.md` rendering engine takes Markdown as _input_ and produces HTML as _output_.

On this page we will look at what that means, and how to use or implement a rendering engine.

# Using the default rendering engines

AkashaRender has several built-in rendering engines.  You don't need to do anything, just use them.

Class | Type | Produces | Extension 
------|------|----------|-----------
MarkdownRenderer | Markdown | HTML | `example.html.md`
MarkdocRenderer | Markdoc | HTML | `example.html.markdoc`
AsciidocRenderer | AsciiDoc | HTML | `example.html.adoc`
EJSRenderer | EJS | HTML or PHP | `example.html.ejs` or `example.php.ejs`
LiquidRenderer | Liquid | HTML | `example.html.liquid`
NunjucksRenderer | Nunjucks | HTML | `example.html.njk`
HandlebarsRenderer | Handlebars | HTML | `example.html.handlemars`
CSSLESSRenderer | LESS | CSS | `example.css.less`
JSONRenderer | JSON | HTML | `example.html.json` 

Using one of these is very simple.  Just add a file into a _documents_ directory with a matching filename extension, and follow the format outlined in [](3-create-content.html).

Several engines like MarkdownRenderer and EJSRenderer share HTML rendering code via the HTMLRenderer class.  The layout template processing algorithm, and the use of Mahabhuta for custom DOM processing, are both implemented in HTMLRenderer.

# Creating and adding a new rendering engine

A _rendering engine_ in AkashaRender must implement the Renderer class.  For code outside the `akasharender` project that means:

```
const akasha = require('akasha');

class FooBarRenderer extends akasha.Renderer {
    ... implement the methods
}

// or for HTMLRenderer
class FooBarHTMLRenderer extends akasha.HTMLRenderer {
    ... implement the methods
}
```

And then you register the Renderer with AkashaRender as so:

```
akasha.registerRenderer(new FooBarHTMLRenderer());
```

## Renderer class methods

The rendering engines, and the _Renderer_ class, are defined in the `@akashacms/renderers` package.  This package is designed so it could possibly be used by other content management systems, but was created by extracting code that was originally developed for AkashaCMS.

The source code is at:  https://github.com/akashacms/rendering-engines

The documentation website is at: https://akashacms.github.io/rendering-engines/index.html

Each Renderer is defined by a subclass of the Renderer class.  There are plenty of rendering engines defined in the package, and it is easy to create your own if desired.

The Renderer constructor identifies the _name_ of the Renderer, and the regular expression used to match filenames:

```
constructor() {
    super(".html.ejs", /^(.*\.html|.*\.php)\.(ejs)$/);
}
```

If your Renderer needs to handle multiple filename extensions, you have two choices.  In the example here the regular expression will match either `.html.ejs` or `.php.ejs`, so that's the first choice is to deploy regular expression magic.  As they say, someone who solves a problem with a regular expression now has two problems.  The other choice is to pass in an array of regular expressions, meaning that example could have used two simpler regular expressions than this one slightly complex expression.

The two key methods are `render` and `renderSync`.  The first is to return a Promise so that rendering can be asynchronous.  The second is to do synchronous rendering.  If that is not be possible for a given rendering engine, the `renderSync` method should be left unimplemented, and an Exception will automatically be thrown.

```
renderSync(text, metadata) {
    return ejs.render(text, metadata);
}

render(text, metadata) {
    return new Promise((resolve, reject) => {
        try {
            resolve(ejs.render(text, metadata));
        } catch(e) {
            var docpath = metadata.document ? metadata.document.path : "unknown";
            var errstack = e.stack ? e.stack : e;
            reject("Error with EJS in file "+ docpath +" "+ errstack);
        }
    });
}
```

Both of these take the `text` and `metadata`, run it through a 3rd party rendering module, and supply the result back to the caller.  Most other rendering modules operate in a similar fashion.  A quick look at DustJS says it also has a similar API and should be relatively simple to integrate.

This is enough for most Renderer's.  There are additional methods available, most of which is meant to keep the typical Renderer as simple as what we just outlined.
