---
layout: plugin-documentation.html.ejs
title: AskashaCMS "built-in" plugin documentation - Foundational support for constructing any HTML
---

AkashaRender includes a "built-in" plugin with custom tags useful for any target use.  The AkashaCMS toolchain supports rendering both websites and EPUB's, and could support rendering for other target uses of HTML.  The EPUB format includes constraints where, while EPUB3 uses HTML5, a sizeable list of HTML5 features are not allowed.  Both the built-in plugin and the `akashacms-base` plugin both aspire to provide features useful to everyone, the latter includes those features useful only for websites, whereas the built-in plugin features are useful for everyone.

# Installation and Configuration

There's nothing to do, the built-in plugin is, well, built-in to AkashaRender.

# Simplification for `figure/img` tags

This construct is recommended in the HTML5 world for its microformat goodness

```
<figure>
<img src="an-image.jpg"/>
<figcaption>Image caption</figcaption>
</figure>
```

While you can surely write these tags yourself, the `<fig-img>` tag offers a simplification.

```html
<fig-img href="an-image.jpg" 
        class="class-name" 
        id="id-name" 
        style="...CSS..." 
        width="...width..." 
        template="template-partial.html.ejs">
Optional caption text
</fig-img>
```

Using the default template (`ak_figimg.html.ejs`) the tag converts into the structure shown above.  The attributes are interpreted as so:

* `class` is added as a `class` attribute to the `<figure>`
* `id` is added as a `id` attribute to the `<figure>`
* `style` is added as a `style` attribute to the `<figure>`
* `width` is added as a `width` attribute to the `<figure>`
* `template` overrides the default template

## Create figure/img constructs from images

We have a tag `<fig-img>` to aid constructing the combination of a `<figure>` containing an `<img>`.  But after some time of using that tag it seems better to use the `<img>` tag, and add attributes to control the construction of the figure/img construct.

To trigger this behavior include the `figure` property on the image.

```html
<img id="change1" figure src="img/Human-Skeleton.jpg">
```

With the `figure` property, we replace the `<img>` with a `<figure>` containing an `<img>`.

The recognized attributes are:

* `id` becomes the `id` of the `<figure>`
* `class` becomes the `class` of the `<figure>`
* `width` becomes the `width` of the `<figure>`
* `style` becomes the `style` of the `<figure>`
* `dest` becomes an `<a>` tag surrounding the `<img>` within the `<figure>`
* `caption` becomes a `<figcaption>` tag within the `<figure>`

This is processed through the `ak_figimg.html.ejs` template just as for `<fig-img>`.

# Resizing images

Sometimes you want to store a full-size image in the `documents` directory, but the deployed website will use a reasonable size image for web browsers.  For example a marketing department might provide highly detailed product images accompanying a press release, but of course it is useful to keep images to 100-300kb for delivery on a public website.  

For this purpose a filter exists to resize images.  This feature may be extended in the future to include general image manipulation.

It is triggered by adding a `resize-width` property to an `<img>`.  The value of this property declares the width of the resulting image in pixels.  The image height is automatically calculated to maintain the same width/height scale (e.g. a 600x400 image resized to 300 width would be 200 pixels high).


The usage is as follows:

```html
<img id="resizeto150" 
        src="img/Human-Skeleton.jpg"
        resize-width="150"
        resize-to="img/Human-Skeleton-150.jpg">
```

The recognized properties are:

* `src` The file within the documents or assets directories that is copied into the render output
* `resize-to` The file name used within the render output directory
* `resize-width` The resulting image width as discussed above.

Currently the `resize-to` option is required, meaning that we are required to copy from a given file to a different file as shown here.  In the rendered HTML the `src` attribute of the `<img>` will be rewritten to whatever is in the `resize-to` attribute.

The rendered version of this tag will be:

```html
<img id="resizeto150" src="img/Human-Skeleton-150.jpg">
```

The `resize-width` and `resize-to` attributes are removed in the final output.

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
