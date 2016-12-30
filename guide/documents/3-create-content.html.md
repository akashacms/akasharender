---
layout: page.html.ejs
title: Creating content with AkashaRender
---

AkashaRender's purpose is easy generation of HTML and related files for use on websites or EPUB3 documents.  It's meant that the files you'll edit will be in an easy-to-use-or-edit format, like Markdown, which AkashaRender converts to correctly formatted HTML (or whatever) files for your website or eBook.

We touched on this briefly in the previous chapter, [](2-setup.html).  Now it's time to dive deeply down the rabbit hole.

# Rendering source(s) and destination

The key thing AkashaRender does is render files in one or more source directories, into the destination directory.

In the configuration we specify these using `.addDocumentsDir` and `.setRenderDestination` as so:

```
config.addDocumentsDir('documents');
config.setRenderDestination('rendered');
```

This says to render files stored in `documents` into the `out` directory, using the same directory hierarchy in both.  A file, `documents/romania/vlad-tepes/history.html.md`, is rendered to `out/romania/vlad-tepes/history.html`.  

If these are not specified, default values of `documents` and `out` are used respectively.

It's possible to have multiple document directories.

```
config.addDocumentsDir('documents');
config.addDocumentsDir('archive');
config.setRenderDestination('rendered');
```

The contents of both document directories will be rendered into the Render Destination.  The resulting hierarchy will be a merge of the two.  No attempt is made to prevent the same file path to be used in two document directories.  

A file, `archive/1989/ceaucescu/revolution.html.md` would be rendered as `out/1989/ceaucescu/revolution.html`.

That's easy enough.. files are copied/rendered from an input directory to a matching file in the output directory.  You, the author, create your files in the desired input format(s), organizing them as you wish, and the result derives exactly from the directory hierarchy you design.

What would it mean if two files existed `archive/romania/vlad-tepes/history.html.md`, and `documents/romania/vlad-tepes/history.html.md`?

In such a case, both files will be rendered, but since they render to the same file the last one processed by AkashaRender will be the result.  Since the document directories are processed in the order they appear in the file, you can easily predict which file will be the final result.

Document | Rendered To
---------|--------------
`documents/romania/vlad-tepes/history.html.md` | `out/romania/vlad-tepes/history.html`
`archive/romania/vlad-tepes/history.html.md` | `out/romania/vlad-tepes/history.html`

Both files are rendered to `out` but because the file in `archive` is processed second the final product will be derived from that file.


## Rendering documents to subdirectories, adding metadata

A `addDocumentsDir` specification can also be an object specifying additional data.  The purpose is so documents under a given directory land in a subdirectory, and perhaps carry custom metadata.   

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
config.setRenderDestination('rendered');
```

In this case `archive/romania/vlad-tepes/history.html.md` does not overwrite `documents/romania/vlad-tepes/history.html.md`.  Instead the files are rendered as follows

Document | Rendered To
---------|--------------
`archive/romania/vlad-tepes/history.html.md` | `out/archive/romania/vlad-tepes/history.html`
`documents/romania/vlad-tepes/history.html.md` | `out/romania/vlad-tepes/history.html`

We haven't discussed document metadata yet.  Metadata is used in the rendering, and can be used for a wide variety of purposes.  The option to provide custom metadata for each Documents Dir let's us customize the rendering in each subdirectory.

# Renderers, Rendering and File Extensions

AkashaRender's flexibility comes from the variety of Renderer classes we can use.  Each Renderer processes one or more file-types, as determined by the file extension.  For each file AkashaRender processes, it searches the registered Renderer's for one which will process that file.  File extension matching is used in determining the Renderer to use.

<table>
<tr><th>Type</th><th>Extension</th><th>Description</th></tr>
<tr><td>Markdown</td><td>`example.html.md` </td><td> A Markdown file, that produces HTML.</td></tr>
<tr><td>EJS</td><td>`example.html.ejs` or `example.php.ejs` </td><td> for HTML, or PHP, with EJS markup, that produces HTML or PHP.</td></tr>
<tr><td>LESS</td><td>`example.css.less` </td><td> A LESS file, that produces CSS.</td></tr>
<tr><td>Fallback</td><td>any unmatched file </td><td>copied with no processing.</td></tr>
</tr>
</table>

It's easy to add new Renderer's and extend the file-types AkashaRender can process in many directions.  You do so through the AkashaRender API, which we'll go over elsewhere (or you can study the source code).

Renderers can do more than a simple rendering of the input format to output format.  Some process the rendered content through layout templates, partials, special tags, and more.  AkashaRender simply asks the Renderer to process the file, and the details are up to the Renderer author.

Renderers are organized with a classification hierarchy.  That let's a Renderer author reuse common methods shared among similar Renderer's.  Well, that's the intention, at the moment there's only one such Renderer classification.

## HTMLRenderer capabilities

The HTMLRenderer builds on the Renderer class to add extensive capabilities in formatting content into page layouts, using partials (content snippets), and a custom tag processing engine called Mahabhuta.  With HTMLRenderer, complete control over page layout and structure is possible.  It is used by both Markdown and EJS renderers.

### YAML Frontmatter Metadata

Metadata is the extra/descriptive information attached to a content file.  The content of the content file is its main purpose of existence.  The metadata is carried along, and adds extra bits that are useful for a wide range of purposes.

For an HTMLRenderer file, the metadata is carried as so:

```
---
... metadata in YAML format
---
content
```

This is very simple and easy to create.  Just write the content as normal, and prepend it with this segment surrounded by `---`.

YAML is a full fledged text format to describe data objects in a simple-to-write way.  It's capable of describing complex data objects, containing nested arrays or nested lists.  The best documentation I know for YAML is the Wikipedia page: https://en.wikipedia.org/wiki/YAML

For AkashaRender content files it'll be rare to use anything more than the simplest of YAML.  Namely, something like this:

```
---
title: Gettysburg Address
layout: page.html.ejs
otherTag: otherValue
tag42: "The Meaning of Life"
---
content
```

That is, most of what we'll do in AkashaRender will be satisfied by simple `name:value` pairs.  But, because we support YAML, the flexibility is there to go over the top with data modeling if desired.

The metadata is made available during the rendering process, so that metadata values can be rendered into the content.  This can be combined with other parts of AkashaRender, such as Partials and Mahabhuta custom tags.  An example would be a Mahabhuta tag to look up YouTube videos based on YouTube URL's listed in the metadata.

For example:

```
---
layout: video-page.html.ejs
title: Race 4, Buenos Aires pre-race driver interviews (Formula E)
publicationDate: Jan 8, 2015
tags: Electric Racing, Formula E 2014
teaser: Going into the fourth race, drivers talk about their experiences and hopes.
videoUrls:
  - url: https://www.youtube.com/watch?v=O3lHuEmP9-g
  - url: https://www.youtube.com/watch?v=02nVQQeBFjg
  - url: https://www.youtube.com/watch?v=C7QiE9Iguxc
  - url: https://www.youtube.com/watch?v=Itr9N4QpecA
  - url: https://www.youtube.com/watch?v=H3BIYCgLeiw
videoThumbnail: https://www.youtube.com/watch?v=O3lHuEmP9-g
---
```

With a suitable page layout template (see below) this renders these YouTube videos along with associated information, and sets up the Thumbnail from one of those videos in the OpenGraph tags.  The page is tagged to reference the Formula E electric racing series, and was written in January 2015.

Support for metadata variables in renderer

* MarkdownRenderer: No
* EJSRenderer: Can substitute variables into rendered output

### Page Layouts

HTMLRenderer supports much more than just rendering content files.  That would be very boring and not useful to simply render from a document directory to the rendering directory.  Website designers need freedom to flow their content in all kinds of ways, to have sidebar widgets of all kinds, and on and on.  The marketing department needs to have microformat tags of all kinds to express semantic information to search engines, hopefully having a positive SEO benefit.  Your visitors need to be able to read/view the content, especially on their mobile device.  Finally, the content authors need to be relieved of the burden of supplying HTML for the entire page for every document, and instead need to reuse each layout on multiple pages.

The template is specified in the metadata:

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

The template filename uses the same sort of file extension we use for content files.  The same Renderer objects are used to render the template.  

The envisioned normal AkashaRender usage is:

* Content files are written in Markdown - `documents/path/to/content.html.md`
* Layout files are written in EJS - `layouts/layoutFile.html.ejs`

Markdown is easy to create and edit, making it suitable for the writer.  But it doesn't support variable substitution into the rendered output.  That capability is required for performing full page layout.

HTMLRenderer uses a two-stage process

1. Content is rendered, producing HTML output.  If the first stage Renderer supports variable substitution, variables are substituted, as are partials.
    1. This HTML is added to metadata as the variable `content`
1. (Optional) If a `layout` tag is present, the layout template is found.   The template is rendered using the Renderer specified by its file extension.
    1. Because the previous stage rendering is a metadata value, the layout template MUST support variable substitution.  That means using the EJS Renderer.

The final output (after partials and Mahabhuta tags are processed) is written to the rendering directory.

Here's a slightly more comprehensive page template:

```
<!doctype html>
<!-- paulirish.com/2008/conditional-stylesheets-vs-css-hacks-answer-neither/ -->
<!--[if lt IE 7]> <html class="no-js lt-ie9 lt-ie8 lt-ie7" lang="en"> <![endif]-->
<!--[if IE 7]>    <html class="no-js lt-ie9 lt-ie8" lang="en"> <![endif]-->
<!--[if IE 8]>    <html class="no-js lt-ie9" lang="en"> <![endif]-->
<!-- Consider adding a manifest.appcache: h5bp.com/d/Offline -->
<!--[if gt IE 8]><!--> <html class="no-js" lang="en"> <!--<![endif]-->
<head>
<meta charset="utf-8" />
<!-- Use the .htaccess and remove these lines to avoid edge case issues. More info: h5bp.com/i/378 -->
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
<%
// Our site title and description
if (typeof pagetitle !== "undefined") { %><title><%= pagetitle %></title><%
} else if (typeof title !== "undefined") { %><title><%= title %></title><%
} %>
<link rel="stylesheet" href="/style/main.css" type="text/css" media="screen"/>
</head>
<body>
<div class="container" role="main">
<div class="row">
<header class="col-md-12">
  <h1><%= title %></h1>
</header>
</row>
<div class="row">
<div class="col-md-12">
<%- content %>
</div>
</div>
</div>
</body>
</html>
```

This one uses Bootstrap tags to structure the page, and in the `<head>` section we've added a couple best practices recommended by that project.  It lets you use `pagetitle` in the metadata for the `<title>` tag if your thoughts are to use different text for the `<title>` than for the primary `<h1>`.

You see two kinds of substitutions here:

Substitution type | Description
------------------|--------------
`<%= value %>` | Substitutes the content of the named variable, encoding any HTML as HTML entities
`<%- value %>` | Substitutes the content of the named variable, with no encoding

These come from the EJS template engine.  The choice between the two depends on the variable you're substituting, and your purpose with that variable.  

In the case of `content`, we have HTML that we want to appear as it is with no encoding.  For other variables shown in this template, it's expected they'll be simple text values and that HTML were in the variable would be an accident.

The most important bit is where the `content` variable is substituted.  The idea is to surround the `content` with the desired page layout, navigational widgets, etc.

### Partials

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

Consider this implementation of `listrender.html.ejs`

```
<ul><%
    for (item in items) {
        %><li><%= item %>: <%= items[item] %></li><%
    }
%></ul>
```

The EJS engine allows you to mix JavaScript and HTML this way.  The variable `items` is iterated, producing a `<ul>` full of `<li>` tags containing the content.

One way to use partials is in the `<head>` section where you'll be referencing common JavaScript or CSS assets.  Rather than duplicate that coding across every page template, put them in a partial.

```
<head>
<meta charset="utf-8" />
<!-- Use the .htaccess and remove these lines to avoid edge case issues. More info: h5bp.com/i/378 -->
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<%
// Our site title and description
if (typeof pagetitle !== "undefined") { %><title><%= pagetitle %></title><%
} else if (typeof title !== "undefined") { %><title><%= title %></title><%
} %>
<%- partial('sitemap.html.ejs') %>
<%- partial('siteverification.html.ejs', locals) %>
<!-- http://en.wikipedia.org/wiki/Canonical_link_element -->
<% if (typeof rendered_url !== "undefined") {
    %><link rel="canonical" href="<%- rendered_url %>" /><%
} %>
<%- partial('stylesheets.html.ejs', locals) %>
<% if (headerScripts && headerScripts.javaScriptTop) {
    %><%- partial('javaScript.html.ejs', { javaScripts: headerScripts.javaScriptTop }) %><%
} %>
</head>
```

This way you can reuse header code across multiple page layouts.

### Custom HTML tags and DOM manipulation with Mahabhuta

The [Mahabhuta](https://github.com/akashacms/mahabhuta) engine allows website authors to perform jQuery DOM manipulations on the server side.  Reusing your jQuery knowledge may be a good thing, we hope.  Mahbhuta makes it possible to reuse jQuery knowledge to reorganize, rewrite, or otherwise manipulate pages on the server side.  Let the concept sink in for a moment, because this can be powerful.

The name?  "Mahabhuta" is the Sanskrit name for the five elements, with Akasha being one of those elements.  The Mahabhuta engine deals with HTML Elements, so it seems like a fitting name.

We won't go into developing Mahabhuta tags at this point, but let's go over how to use them.

A few tags and partials and Mahabhuta tags are provided by AkashaRender.  Judicious use of those tags can simplify the header code we just showed.

Mahabhuta can perform any DOM manipulation.  The most common usage is to define a custom tag, performing a custom DOM manipulation based on that tag.

```
<html>
<head>
..
<ak-stylesheets></ak-stylesheets>
<ak-headerJavaScript></ak-headerJavaScript>
..
</head>
<body>
..
<ak-footerJavaScript></ak-footerJavaScript>
..
</body>
</html>
```

This shows three of the baked-in Mahabhuta custom tags, `ak-stylesheets`, `ak-headerJavaScript`, and `ak-footerJavaScript`.  Each takes information from the site configuration, and outputs stylesheet or JavaScript tags.

It might be common to specify these stylesheets:

```
config
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap.min.css" })
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap-theme.min.css" })
    .addStylesheet({ href: "/style.css" });
```

The first two lines utilize a local Bootstrap instance, while the last is a place for custom CSS.

Then add this to complete the Bootstrap configuration:

```
config
    .addFooterJavaScript({ href: "/vendor/jquery/jquery.min.js" })
    .addFooterJavaScript({ href: "/vendor/bootstrap/js/bootstrap.min.js"  })
```

It's common for an article to have a _teaser_ that might be presented in a special way, and might appear in the page metadata.  The `<ak-teaser>` tag is available to present the `teaser` metadata variable using the `ak_teaser.html.ejs` template.

The `<partial>` tag lets us simplify the partial feature.

```
<partial file-name='disqus.html'/>
```

Mahabhuta tags can of course take attributes to customize their action.  In this case we specify the partial file name using the `file-name` attribute.  Any attributes whose name begins with `data-` are gathered and made available as metadata.  Additionally, the child content of the partial tag is made available in the metadata as the `partialBody` variable.

The final Mahabhuta processing that's baked into AkashaRender is not a custom tag, but a DOM manipulation.  For `<a>` tags with an empty body, that reference a local document, the document title is retrieved and used as the anchor text.

What this means is - if your content has this:

```
<a href="/romania/vlad-tepes/history.html"></a>
```

Normally this would render as an empty tag, and the user would not know about the link.  The search engines might even ding your site for attempting some subterfuge.  You could go ahead and add some anchor text, and you're free to do so.  However, as a convenience AkashaRender will do something for you.  It looks for the matching document file, and inserts the `title` metadata from that document as the anchor text.  This way as the title of documents change, the text displayed to readers automagically changes to match.

We have two pieces of required Mahabhuta configuration:

```
config.setMahabhutaConfig({
    recognizeSelfClosing: true,
    recognizeCDATA: true
});
```

This configures the _Cheerio_ engine that Mahabhuta relies on under the covers.  This particular configuration works great for websites.

```
config.addMahabhuta(require('./mahafuncs'));
```

This lets you declare a file containing Mahabhuta functions.  We won't go over how to write those functions at this time.

### Overriding layouts and partials

There's an important aspect of layouts and partials to discuss - that we can override the files provided by plugins or baked into AkashaRender.  This is because the layout or partial file that's actually used is the first one found while searching the respective directories.   

Built-in tag | partial
-------------|---------------
`ak-stylesheets` | `ak_stylesheets.html.ejs`
`ak-headerJavaScript` | `ak_javaScript.html.ejs`
`ak-footerJavaScript` | `ak_javaScript.html.ejs`
`ak-teaser` | `ak_teaser.html.ejs`

If you don't like the default layout implemented by a partial, your site can implement the same partial.

Because the directories are searched in the order specified in the configuration, a layout or partial appearing in an earlier directory will override a layout or partial appearing in a later directory.

For example, in AkashaRender is a file `built-in.js` providing the Mahabhuta tags mentioned above.  It also adds the `akasharender/partials` directory to the list of partials directories.  We try to make sure this directory is the last one added.

The `ak_teaser.html.ejs` in that directory contains this:

```
<p><strong><%= teaser %></strong></p>
```

But what if you want teasers to be rendered in italics rather than bold text?  Your site can have an `ak_teaser.html.ejs` in its partials directory, containing this instead:

```
<p><em><%= teaser %></em></p>
```

# Plugins

We already saw in [](2-setup.html) some plugins being used.  But, what is a plugin?

As the name implies plugins extend AkashaRender's behavior or capabilities.  There are several plugins provided by the AkashaRender project, and anybody is free to write their own plugin.  Primarily, plugins work by adding extra Partials directories or Mahabhuta functions.

Plugins are declared in the configuration as so:

```
config
    .use(require('akashacms-theme-bootstrap'))
    .use(require('akashacms-base'))
    .use(require('akashacms-breadcrumbs'))
    .use(require('akashacms-booknav'))
    .use(require('akashacms-embeddables'));
```

This list adds Bootstrap support, some commonly used Mahabhuta tags (the `base` plugin), generation of breadcrumb trails, "Book" style navigation of a group of pages, and embeddable content like YouTube videos.

When the `.use` method is called, it instantiates the plugin and calls its `configure` function.  That function will then do whatever it needs to extend AkashaRender in the desired way.  Typically it calls `.addPartialsDir` and `.addMahabhuta` to add functionality.

It's useful to maintain overridability.  That means the website configuration file should add its Partials directories before it defines the plugins:

```
config
    .addPartialsDir('partials');

config
    .use(require('akashacms-theme-bootstrap'))
    .use(require('akashacms-base'))
    .use(require('akashacms-breadcrumbs'))
    .use(require('akashacms-booknav'))
    .use(require('akashacms-embeddables'));
```

This declares the website Partials directory before the plugins are defined.  Even though each plugin probably declares its own Partials directory, the website Partial directory appears first.  Therefore it can override any of those Partials in its own directory.


# Completing the configuration file

The last step in a configuration file is these two lines:

```
config.prepare();
module.exports = config;
```

The `.prepare` method adds some default values for anything not declared in the configuration.  

The last line makes sure the configuration object is available to other code.  The `akasharender` command requires this.

# The akasharender command

When AkashaRender is installed, a new command is available:  `akasharender`

```
$ akasharender help
copy-assets [config_file]
	Copy assets into output directory

render [config_file]
	Render a site into output directory
```
