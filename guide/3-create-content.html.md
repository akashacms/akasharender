---
layout: ebook-page.html.ejs
title: Creating content with AkashaRender
publicationDate: June 25, 2017
---

AkashaRender's purpose is easy generation of HTML and related files for use on websites or EPUB3 documents.  It's meant that the files you'll edit will be in an easy-to-use-or-edit format, like Markdown, which AkashaRender converts to correctly formatted HTML (or whatever) files for your website or eBook.

In the _Getting Started_ guide, see the following:

* [Project configuration](https://akashacms.com/quick-start/configuration.html)
* [AkashaCMS project directories](https://akashacms.com/quick-start/directories.html)
* [Content files](https://akashacms.com/quick-start/content.html)

Given a configuration like so:

```js
config
    .addDocumentsDir('documents')
    .addDocumentsDir('archive');

config.setRenderDestination('out');
```

This says to render files stored in `documents` and in `archive` into the rendering destination (`out`) directory, using the same directory hierarchy in both.  That means the following are true:

* A file, `documents/romania/vlad-tepes/history.html.md`, is rendered to `out/romania/vlad-tepes/history.html`.  
* A file, `archive/1989/ceaucescu/revolution.html.md` would be rendered as `out/1989/ceaucescu/revolution.html`.
* If two files existed `archive/romania/vlad-tepes/history.html.md`, and `documents/romania/vlad-tepes/history.html.md`, the result at `out/romania/vlad-tepes/history.html` will come from the copy inside the `archive` directory.

In this last case, we have two files at the same virtual path, `romania/vlad-tepes/history.html`.  What AkashaRender does is it structures all _Documents_ directories as a stack.  When looking for a file matching a virtual path, the first one found is the one which is used.

You could reverse this behavior by reversing the order of the `addDocumentsDir` calls, reversing the processing order.  The copy under `documents` would then be the version to appear on the rendered website.

# Renderers, Rendering and File Extensions

The file extension, `.html.md`, is part of a convention followed in AkashaRender.  It's meant to indicate that the native format is Markdown (`.md`), and that it produces HTML (`.html`).  The implementation is in the _Renderer_ classes, and is based on settings stored in each Renderer instance.

Each Renderer processes one or more file-types, as determined by the file extension.  For each file AkashaRender processes, it searches the registered Renderer's for one which will process that file.  File extension matching is used in determining the Renderer to use.

Type | Extension | Description
-----|-----------|------------
Markdown | `example.html.md` | A Markdown file, that produces HTML.
AsciiDoc | `example.html.adoc` | An AsciiDoc file, that produces HTML.
EJS | `example.html.ejs` or `example.php.ejs` | for HTML, or PHP, with EJS markup, that produces HTML or PHP.
Liquid | `example.html.liquid` | For HTML, with Liquid markup, produces HTML
Nunjucks | `example.html.njk` | For HTML, with Nunjucks markup, produces HTML
Handlebars | `example.html.handlebars` | For HTML, with Handlebars markup, produces HTML
LESS | `example.css.less` | A LESS file, that produces CSS.
JSON | `example.html.json` | A JSON file, with metadata header, producing HTML
Fallback | any unmatched file | copied with no processing.

It's easy to add new Renderer's and extend the file-types AkashaRender can process in many directions.  You do so through the AkashaRender API, which we'll go over elsewhere (or you can study the source code).

Renderers can do more than a simple rendering of the input format to output format.  Some process the rendered content through layout templates, partials, special tags, and more.  AkashaRender simply asks the Renderer to process the file, and the details are up to the Renderer author.

Renderers are organized with a classification hierarchy.  That let's a Renderer author reuse common methods shared among similar Renderer's.  Well, that's the intention, at the moment there's only one such Renderer classification.

## HTMLRenderer capabilities

The HTMLRenderer handles rendering to HTML, as the name implies, and is used for `example.html.md` and `example.html.adoc` and `example.html.ejs` and `example.php.ejs` and `example.html.liquid` and `example.html.njk`.  This Renderer class adds extensive capabilities in formatting content with page layouts, using partials (content snippets), and a custom tag processing engine called Mahabhuta.  With HTMLRenderer, complete control over page layout and structure is possible.

### Special considerations for PHP

It's been determined that if PHP code is processed by Mahabhuta, the tags get screwed up.  As a result in `EJSRenderer` the `doMahabhuta` method returns `false` for PHP files.  As a result Mahabhuta processing is automatically skipped, meaning that Mahabhuta tags will not be expanded in PHP files.

That limits how much you can do inside a PHP file.  A workaround is code like this:

```
<%- config.plugin('akashacms-base').doHeaderMetaSync(config, locals) %>
<%- config.plugin('akashacms-base').doGoogleSitemap(locals) %>
<%- partialSync('google-site-verification.html') %>
<%- config.plugin('akashacms-builtin').doStylesheets(locals) %>
<%- config.plugin('akashacms-builtin').doHeaderJavaScript(locals) %>
<%- partialSync("php-recaptcha-check.html") %>
```

And

```
<%- partialSync('topnavbar.html') %>
<%- partialSync('siteheader.html.ejs') %>
```

In other words, you can make function calls to AkashaRender functions and thereby get access to certain capabilities.

The `partialSync` function can take a data object like so:

```
<%= partial('some-partial.html.ejs', locals) %>
<%= partial('some-partial.html.ejs', {
    data: "value", data2: "value2"
}) %>
```

The values passed are of course available as template variables.  The special variable `locals` passes along the template variables used in this template.

### Markdown

AkashaRender uses the [Markdown-it](https://www.npmjs.com/package/markdown-it) markdown processor.  This gives us quite a lot of capabilities, as well as a focus on the [CommonMark](http://commonmark.org/) spec.  As nice as Markdown is, the original "specification" was not terribly precise leading to some fragmentation among the various Markdown processors.  The CommonMark spec aims to fix that, opening a route to a day of compatibility between Markdown processors.

Perhaps the most useful thing is that Markdown-it adopts the [Tables](https://help.github.com/articles/github-flavored-markdown/#tables) markup from Github Flavored Markdown.

That means:

```
First Header  | Second Header
------------- | -------------
Content Cell  | Content Cell
Content Cell  | Content Cell
```

Renders to

First Header  | Second Header
------------- | -------------
Content Cell  | Content Cell
Content Cell  | Content Cell

It also supports "strikethrough text" where `~~deleted text~~` renders as ~~deleted text~~.

### AsciiDoc

AkashaRender uses the [AsciiDoctor.js](https://github.com/asciidoctor/asciidoctor.js) package to process AsciiDoc.  It is a direct transliteration of the official AsciiDoctor renderer from its Ruby source code.

The integration of AsciiDoc is minimal as of this writing.  It renders content using the _article_ doctype, and doesn't allow you to override that choice.

A subset of AkashaRender metadata is made available to AsciiDoc for use as what they call an _attribute_.  This means your metadata values can be rendered as `{attributeName}`.  

Because of limitations in AsciiDoc, AkashaRender only supplies String and Number metadata values.  Any functions or objects are dropped out of the metadata supplied to AsciiDoc.

AsciiDoc user manual: http://asciidoctor.org/docs/user-manual/


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

```yaml
---
title: Gettysburg Address
layout: page.html.ejs
otherTag: otherValue
tag42: "The Meaning of Life"
---
This is the content area.
```

That is, most of what we'll do in AkashaRender will be satisfied by simple `name:value` pairs.  But, because we support YAML, the flexibility is there to go over the top with data modeling if desired.

The metadata is made available during the rendering process, so that metadata values can be rendered into the content.  This can be combined with other parts of AkashaRender, such as Partials and Mahabhuta custom tags.  An example would be a Mahabhuta tag to look up YouTube videos based on YouTube URL's listed in the metadata.

For example:

```yaml
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
* LiquidRenderer: Can substitute variables into rendered output
* NunjucksRenderer: Can substitute variables into rendered output
* HandlebarsRenderer: Can substitute variables into rendered output

### Page Layouts

HTMLRenderer supports much more than just rendering content files.  That would be very boring and not useful to simply render from a document directory to the rendering destination directory.  

For more details beyond this brief overview see: [](layouts-partials.html)

The template is specified in the metadata:

```
---
..
layout: page.html.ejs
..
---
content
```

The template filename uses the same sort of file extension we use for content files.  The same Renderer objects are used to render the template.  As it currently stands it's expected content authors will write files in Markdown, while the website designer will design page layouts in HTML using EJS layout templates.

If you want to use other template engines:

```
---
..
layout: page.html.liquid .. or page.html.njk .. etc
..
---
content
```

This lets you use both any supported template engine.  

Markdown is easy to create and edit, making it suitable for the writer.  But it doesn't support the HTML details required by the website designer.  Hence the designer needs precise control over the HTML, while the writer simply needs support for their writing.

HTMLRenderer uses a two-stage process

1. Content is rendered, producing HTML output.  If the first stage Renderer supports variable substitution, variables are substituted, as are partials.
    1. This HTML is added to metadata as the variable `content`
1. (Optional) If a `layout` tag is present, the layout template is found.   The template is rendered using the Renderer specified by its file extension.
    1. Because the previous stage rendering is a metadata value, the layout template MUST support variable substitution.  That means using the EJS Renderer.

The final output (after partials and Mahabhuta tags are processed) is written to the rendering directory.

### Partials

Partials are little snippets of template, which can be rendered into any location of any template using the `partial` function.  They are the first stage of implementing arbitrary page layouts.  Because the partials are available to all page layouts, this is an excellent way to implement common elements that are shared between different page layouts.

An example is

```html
<%- partial('helloworld.html') %>
```

Because this is a simple `.html` file, its content is simply copied verbatim into the rendering.

You can pass data to a partial as so:

```html
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

```js
config.addPartialsDir('partials')
```

As for layout templates, you can have multiple `.addPartialsDir` directories.  The partials directories are searched in order, with the first matching file being the one that's used.  The filename selects a Renderer for rendering the partial.  Whether the partial renders the data it is given depends on the Renderer corresponding to the filename.

Consider this implementation of `listrender.html.ejs`

```html
<ul><%
    for (item in items) {
        %><li><%= item %>: <%= items[item] %></li><%
    }
%></ul>
```

The EJS engine allows you to mix JavaScript and HTML this way.  The variable `items` is iterated, producing a `<ul>` full of `<li>` tags containing the content.

### Custom HTML tags and DOM manipulation with Mahabhuta

The [Mahabhuta](https://github.com/akashacms/mahabhuta) engine allows website authors to perform jQuery DOM manipulations on the server side.  Reusing your jQuery knowledge may be a good thing, we hope.  Mahbhuta makes it possible to reuse jQuery knowledge to reorganize, rewrite, or otherwise manipulate pages on the server side.  Let the concept sink in for a moment, because this can be powerful.

The name?  "Mahabhuta" is the Sanskrit name for the five elements, with Akasha being one of those elements.  The Mahabhuta engine deals with HTML Elements, so it seems like a fitting name.

We won't go into developing Mahabhuta tags at this point, but let's go over how to use them.  For full documentation see: https://akashacms.com/mahabhuta/toc.html

A few tags and partials and Mahabhuta tags are provided by AkashaRender.  Judicious use of those tags can simplify the header code we just showed.

Mahabhuta can perform any DOM manipulation.  The most common usage is to define a custom tag, performing a custom DOM manipulation based on that tag.

```html
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

```js
config
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap.min.css" })
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap-theme.min.css" })
    .addStylesheet({ href: "/style.css" });
```

The first two lines utilize a local Bootstrap instance, while the last is a place for custom CSS.

Then add this to complete the Bootstrap configuration:

```js
config
    .addFooterJavaScript({ href: "/vendor/jquery/jquery.min.js" })
    .addFooterJavaScript({ href: "/vendor/bootstrap/js/bootstrap.min.js"  })
```

It's common for an article to have a _teaser_ that might be presented in a special way, and might appear in the page metadata.  The `<ak-teaser>` tag is available to present the `teaser` metadata variable using the `ak_teaser.html.ejs` template.

The `<partial>` tag lets us simplify the partial feature.

```html
<partial file-name='disqus.html'/>
```

Mahabhuta tags can of course take attributes to customize their action.  In this case we specify the partial file name using the `file-name` attribute.  Any attributes whose name begins with `data-` are gathered and made available as metadata.  Additionally, the child content of the partial tag is made available in the metadata as the `partialBody` variable.

The final Mahabhuta processing that's baked into AkashaRender is not a custom tag, but a DOM manipulation.  For `<a>` tags with an empty body, that reference a local document, the document title is retrieved and used as the anchor text.

What this means is - if your content has this:

```html
<a href="/romania/vlad-tepes/history.html"></a>
```

Normally this would render as an empty tag, and the user would not know about the link.  The search engines might even ding your site for attempting some subterfuge.  You could go ahead and add some anchor text, and you're free to do so.  However, as a convenience AkashaRender will do something for you.  It looks for the matching document file, and inserts the `title` metadata from that document as the anchor text.  This way as the title of documents change, the text displayed to readers automagically changes to match.

We have two pieces of required Mahabhuta configuration:

```js
config.setMahabhutaConfig({
    recognizeSelfClosing: true,
    recognizeCDATA: true
});
```

This configures the _Cheerio_ engine that Mahabhuta relies on under the covers.  This particular configuration works great for websites.

```js
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

```html
<p><strong><%= teaser %></strong></p>
```

But what if you want teasers to be rendered in italics rather than bold text?  Your site can have an `ak_teaser.html.ejs` in its partials directory, containing this instead:

```html
<p><em><%= teaser %></em></p>
```

### JSON Document Files in AkashaCMS


It may be useful for some documents, rather than use a recognized text format (like HTML or Markdown) to use a data format.  That is, take some data, formatting it through a template, to make a web page.  To that end, AkashaCMS supports JSON documents that can be processed through the AkashaCMS rendering system and producing HTML.

For example, this file named `json-data.html.json` ([from akashacms-example](https://github.com/akashacms/akashacms-example/blob/master/documents/json-data.html.json))

```
---
layout: default.html.ejs
title: JSON example
JSONFormatter: json-format.html.ejs
---
{
    "Row1": "value 1",
    "Row2": "value 2",
    "Row3": "value 3"
}
```

This is a fairly normal AkashaCMS document, but the body is JSON.

The JSON Renderer triggers on file names ending in `.html.json`.  It parses the content body as JSON, passing it as a variable named `data` to the partial named in `JSONFormatter`.

The named partial used here is [json-format.html.ejs](https://github.com/akashacms/akashacms-example/blob/master/partials/json-format.html.ejs), or

```html
<%
var keys = Object.keys(data);
for (var i = 0; i < keys.length; i++) {
    var datum = data[keys[i]];
    %>
    <p>
    <%= keys[i] %> :- <%= datum %>
    </p>
    <%
} %>
```

With this data it produces, live copy: https://example.akashacms.com/json-data.html

```html
<p>
Row1 :- value 1
</p>

<p>
Row2 :- value 2
</p>

<p>
Row3 :- value 3
</p>
```

This example shows the steps.

* JSON data
* Format that data using a partial into HTML
* That HTML used as input to the AkashaCMS rendering to produce the final page
