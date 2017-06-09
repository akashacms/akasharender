---
layout: ebook-page.html.ejs
title: Using CSS and LESS files
# bookHomeURL: '/toc.html'
---

Obviously CSS files are widely used to customize the look and structure of web pages, EPUB book pages, and more.  

# Site-wide CSS declarations

AkashaRender has a simple method to declare the same set of CSS files across the entire website.  In your Configuration file simply make declarations like this:

```
config
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap.min.css" })
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap-theme.min.css" })
    .addStylesheet({ href: "/vendor/mythemedirectory/bootstrap.min.css" })
    .addStylesheet({ href: "/style.css" });
```

The `config.scripts` getter returns an object listing not just the CSS stylesheets, but JavaScript for page header and footer areas.

If you want to use the mechanism provided by AkashaRender's _built-in_ plugin, put the tag `<ak-stylesheets>` in your page layout templates.  That tag automatically expands `config.scripts.stylesheets` into a set of `<link>` tags so that the page references the stylesheets.

# Per-page CSS declarations

That's well and dandy to give every page the same CSS declarations.  What if you want a given page to have additional CSS?  The page metadata can include an entry `headerStylesheetsAdd` listing any additional CSS files:

```
---
...
headerStylesheetsAdd:
   - href: /vendor/foo/baz.css
   - href: /vendor/funky/walk.css
...
---
```

# Per page-group CSS declarations

Remember that AkashaRender supports multiple document directories, and that a given document directory can be mounted into a subdirectory of the website, and that this mechanism supports metadata values on each document directory.  That is, if you want a subsection of your website to have additional CSS files, that subsection should be mounted as a separate document directory, with have metadata including the `headerStylesheetsAdd` object:

Let's revisit an earlier example, adding more stylesheets to it:

```
config.addDocumentsDir('documents');
config.addDocumentsDir({
    src: 'archive',
    dest: 'archive',
    baseMetadata: {
        meaningOfLife: "42",
        me: "Ashildr Einarrsdottir",
        headerStylesheetsAdd: [
            { href: "/vendor/groovy/beat.css" },
            { href: "/vendor/smooth/jazz.css" }
        ]
    }
});
```

# The structure of the config.scripts.stylesheets object

We've seen that `config.scripts.stylesheets` is an array of objects, each of which is to have an `href` attribute.  It's the same object whether declared with the `addStylesheet` function, or the two versions of the `headerStylesheetsAdd` metadata object.

These objects supports a `media` attribute that can also show up in `<link rel="stylesheet">` tags.

Suppose you have a stylesheet for printed output:

```
config
    .addStylesheet({
        href: "/vendor/mythemedirectory/print.css",
        media: "print"
    })
```

The _media_ attribute can express a variety of conditions.  Whatever string you specify is passed through unmodified.

# Inline style tags?

HTML also supports a `<style>` tag containing in-line CSS declarations.  This tag isn't directly supported by AkashaRender.  However you have two routes for using this tag.

1. Simply use the `<style>` tag directly in your page layout template.
2. Use a _partial_ in several page layout templates containing the in-line CSS

The second of those two would be used when you have multiple page layouts utilizing the same in-line CSS.

# Using the LESS processor to simplify your CSS files

LESS is a popular mechanism to simplify writing CSS files.  It is a processor giving you a nicer CSS-like syntax, that produces CSS.

AkashaRender has a built-in Renderer for compiling LESS files to CSS files.

One can put their CSS files into _assets_ or _documents_ directories as files ending in `.css`.  From either directory structure, AkashaRender will copy those files into the destination directory unmodified.

To use LESS, add one or more files into the _documents_ directory with filename ending in `.css.less`.  This file extension triggers the `CSSLESSRenderer` object, which does the LESS-to-CSS compiling producing a matching `.css` file.

## Supporting other CSS processors

What if LESS isn't your cup-of-tea?  It's fairly easy to write a different Renderer supporting some other CSS processor.  
