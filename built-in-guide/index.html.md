---
layout: plugin-documentation.html.ejs
title: AskashaCMS "built-in" plugin documentation - Foundational support for constructing any HTML
---

AkashaRender includes a "built-in" plugin with custom tags useful for any target use.  The AkashaCMS toolchain supports rendering both websites and EPUB's, and could support rendering for other target uses of HTML.  The EPUB format includes constraints where, while EPUB3 uses HTML5, a sizeable list of HTML5 features are not allowed.  Both the built-in plugin and the `akashacms-base` plugin both aspire to provide features useful to everyone, the latter includes those features useful only for websites, whereas the built-in plugin features are useful for everyone.

# Installation and Configuration

There's nothing to do, the built-in plugin is, well, built-in to AkashaRender.

# Stylesheets

The `<ak-stylesheets>` tag generates links to CSS stylesheets, as declared in `config.js` or in the document metadata.

In `config.js` add something like this:

```
config
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap.min.css" })
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap-theme.min.css" })
    .addStylesheet({ href: "/vendor/bootswatch-readable/bootstrap.min.css" })
    .addStylesheet({ href: "/style.css" });
```

The options include the `href` option shown here, and `media` to declare the media type.  These correspond to these attributes

```
<link rel="stylesheet" type="text/css" href="${style.href}" media="${style.media}"/>
```

In document metadata include this for per-page stylesheets:

```
---
...
headerStylesheetsAdd:
  - href: "/vendor/bootstrap/css/bootstrap.min.css"
  - href: "/style-for-this-page.css"
...
---
```

# JavaScript

JavaScript tags can be added either at the top of the page, in the `<head>` section, or at the bottom of the page, depending on your preferences.  AkashaRender supports declaring the JavaScript files to be put in which section.

Place the `<ak-headerJavaScript>` tag where you want header JavaScript to appear, and the `<ak-footerJavaScript>` tag where you want the footer JavaScript to appear.

In `config.js` add something like this:

```
config
    .addFooterJavaScript({ href: "/vendor/jquery/jquery.min.js" })
    .addFooterJavaScript({ href: "/vendor/bootstrap/js/bootstrap.min.js"  })
```

Substitute `Header` for `Footer` and the JavaScript will appear in the `<head>` section.

The object can contain these fields:

* `lang` (optional) specifies the language of the script, corresponding to the `type=` attribute
* `href` corresponds to the `src=` attribute
* `script` becomes an in-line JavaScript placed within the `<script>..</script>` tag

It is not allowed to have both `href` and `script` fields.

To specify these on a per-document basis in the metadata:

```
---
...
headerJavaScriptAddTop:
  - href: "/vendor/jquery/jquery.min.js"
  - href: "/vendor/bootstrap/js/bootstrap.min.js"
...
---
```

This specifies JavaScript at the top of the page, use `headerJavaScriptAddBottom` for JavaScript at the bottom of the page.

# Teaser content

Some writers swear by creating a _teaser_ for every document.  The idea is a small bit of text _teasing_ the reader to go ahead and read the whole document.

The `<ak-teaser>` tag supports inserting the content of a `teaser` metadata object.  It uses the `ak_teaser.html.ejs` partial to do so.

# Anchor tag cleanups

This feature automagically fixes `<a>` tags, referencing a local document, and which lack text or an image.  Normally an empty tag would show up as nothing in the web browser.  AkashaRender makes it into something useful.

It reads the metadata of the referenced document, and inserts that documents title as the anchor text.

For example the code `<a href="/hello-world.html"></a>` might be rewritten to: `<a href="/hello-world.html">Hello, world!</a>`.  If you're using Markdown the equivalent works: `[](/hello-world.html)` because Markdown converts that to a normal `<a>` tag.

The URL passed in the `href` attribute should of course be the URL of the rendered file.  You might have created a file `hello-world.html.md` which is then rendered to `hello-world.html`.  The link of course needs to reference the rendered file even though the metadata is in the source file.  AkashaRender figures out which is which under the covers.
