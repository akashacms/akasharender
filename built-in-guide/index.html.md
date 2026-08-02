---
layout: plugin-documentation.html.ejs
title: AskashaCMS "built-in" plugin documentation - Foundational support for constructing any HTML
---

AkashaRender includes a "built-in" plugin with custom tags useful for any target use.  The AkashaCMS toolchain supports rendering both websites and EPUB's, and could support rendering for other target uses of HTML.  The EPUB format includes constraints where, while EPUB3 uses HTML5, a sizeable list of HTML5 features are not allowed.  Both the built-in plugin and the `akashacms-base` plugin both aspire to provide features useful to everyone, the latter includes those features useful only for websites, whereas the built-in plugin features are useful for everyone.

# Installation and Configuration

There's nothing to do, the built-in plugin is, well, built-in to AkashaRender.

# Nunjucks macros

This plugin makes macros available for Nunjucks templates.  To use these add this to your page template(s):

```html
{% import "ak_core_macros.njk" as ak_core with context %}
```

With that, macros can be invoked this way:

```html
{{ ak_core.rssHeaderMeta("/rss-for-header.xml") }}
```

# Document groups using `<document-group>` tag

The `<document-group>` tag supports selecting a group of documents using a single element, and executing a partial template for each selected document.

The selection parameters are similar to the options available on the `akasharender search` command.  Both end up using the same internal API.

```html
<document-group id="..." class="..." style="..."
    root-path="..."
    renders-to-html="..."
    vpath-glob="..."
    render-glob="..."
    layout="..."
    blogtag="..."
    tag="..."
    parent-dir="..."
    dirname="..."
    skip-glob="..."
    limit="..."
    offset="..."
    sort-by="..."
    sort="..."
    template="..."></document-group>
```

The `id=`, `class=`, and `style=` attributes set these values on the wrapper `<div>` that is inserted into the HTML.  That is, this tag converts into:

```html
<div id="..." class="..." style="...">
   ... HTML for selected document 1
   ... HTML for selected document 2
   ... HTML for selected document 3
</div>
```

Other than `template=` the other attributes determine which documents are selected for the document group.

The `template=` attribute names a template, from the _partials_ directory stack, that processes the document data, producing an HTML snippet for that document.

The `root-path=` attribute limits the selectable documents to a given directory hierarchy.

The `renders-to-html=` limits the selectable documents to ones which render to HTML output.  Remember that the documents directory stack can contain LESS files that render to CSS, and can contain other documents like images that are simply copied.

The `vpath-glob=` attribute selects documents using a GLOB pattern on the input file name (the vpath).

The `render-glob=` attribute selects documents using a GLOB pattern on the rendered file name (the file name in the rendered output directory).

The `layout=` attribute selects documents which are rendered by one of possibly multiple layout template names.

The `blogtag=` attribute selects documents based on the `blogtag` frontmatter.  Multiple blogtag names can be given.

The `tag=` attribute selects documents based on the `tag` frontmatter.  Multiple tag names can be given.

The `parent-dir=` attribute selects documents where their `parentDir` attribute is equal to the named directory.  The _parentDir_ is the parent directory of the directory containing the document.

The `dirname=` attribute selects documents where their `dirname` attribute is equal to the named directory.  The _dirname_ is the directory containing the document.

The `skip-glob=` attribute skips files which match the GLOB pattern.

The `limit=` attribute limits the number of items selected.

The `offset=` attribute selects documents starting from the _N_th item.

The `sort-by=` attribute sorts the results on one of these fields:

* title
* renderPath
* vpath
* parentDir
* publicationTime

The `sort="asc or desc"` attribute determines the _direction_ of the sort, either ascending or descending.

# Simplification for `figure/img` tags

This construct is recommended in the HTML5 world for its microformat goodness

```html
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

In the rendered HTML, if `resize-to` is given, the `src` attribute of the `<img>` will be rewritten to the value of the `resize-to` attribute.

The rendered version of this tag will be:

```html
<img id="resizeto150" src="img/Human-Skeleton-150.jpg">
```

The `resize-width` and `resize-to` attributes are removed in the final output.

```html
<img id="png2jpg"  src="rss_button.png" resize-width="50" resize-to="rss_button.jpg">
```

In this case the image type in `src` differs from `resize-to`.  In this case an image format conversion is performed.

# Stylesheets

The `<ak-stylesheets>` tag generates links to CSS stylesheets, as declared in `config.js` or in the document metadata.

In `config.js` add something like this:

```js
config
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap.min.css" })
    .addStylesheet({ href: "/vendor/bootstrap/css/bootstrap-theme.min.css" })
    .addStylesheet({ href: "/vendor/bootswatch-readable/bootstrap.min.css" })
    .addStylesheet({ href: "/style.css" });
```

The options include the `href` option shown here, and `media` to declare the media type.  These correspond to these attributes

```html
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

For Nunjucks templates, this custom tag can be used:

```html
{% akstylesheets %}
{% endakstylesheets %}
```

Also available is this macro:

```html
{{ ak_core.stylesheets() }}
```

# JavaScript

JavaScript tags can be added either at the top of the page, in the `<head>` section, or at the bottom of the page, depending on your preferences.  AkashaRender supports declaring the JavaScript files to be put in which section.

Place the `<ak-headerJavaScript>` tag where you want header JavaScript to appear, and the `<ak-footerJavaScript>` tag where you want the footer JavaScript to appear.

In `config.js` add something like this:

```js
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


For Nunjucks templates, this custom tag can be used:

```html

{# header JS #}

{% akheaderjs %}
{% endakheaderjs %}

{# footer JS #}

{% akfooterjs %}
{% endakfooterjs %}
```

# Teaser content

Some writers swear by creating a _teaser_ for every document.  The idea is a small bit of text _teasing_ the reader to go ahead and read the whole document.

The `<ak-teaser>` tag supports inserting the content of a `teaser` metadata object.  It uses the `ak_teaser.html.ejs` partial to do so.

# Embedding code snippets from files in the document directory

Sometimes we want to embed code snippets.  While Markdown makes this easy, we could also have code in files and then embed the files.  To do that:

```html
<code-embed file-name='path/to/file.ext' lang='lang-code'></code-embed>
```

The `file-name` argument must be either a relative path, or absolute path, within a documents directory.  Relative path's are computed relative to the file this is within.

The `lang` argument is refers to what language code is to be used with this file.  For example `css` for a CSS file.

Not shown is the `id` argument that creates an `id` in the output code.

This element is integrates with the [Highlight.js library](https://www.npmjs.com/package/highlight.js) and therefore the `lang` codes must be from their list of supported programming languages.

The contents of the file must be textual for this to work.  That's because the file contents will be inserted into the output wrapped within this structure:

```html
<pre id='id'>
<code class='lang'>
... CONTENTS OF FILE
</code>
</pre>
```

Clearly for this to work correctly the file must have textual content.


# Rendering data files as tables with `<csv-table>`

Data is often stored in a tabular data file — CSV exported from a spreadsheet or database, a tab-separated (TSV) file, or a YAML list of records.  The `<csv-table>` tag reads such a file and renders it as an HTML table (or any other repeating structure), formatting each row with a template.

```html
<csv-table
    file-name="data/people.csv"
    template="people-row.html.njk"
    before-template="people-before.html.njk"
    after-template="people-after.html.njk"
    format="csv"
    delimiter=","
    header="true"></csv-table>
```

Only `file-name` and `template` are required.  The recognized attributes are:

* `file-name` — the data file to read.  See _Locating the data file_ below.
* `template` — a partial, from the _partials_ directory stack, rendered **once per data row**.  It receives that row's data (see _The row data_ below).
* `before-template` — a partial rendered **once, before** the rows.  Defaults to a built-in partial that emits `<table>` plus a `<thead>` built from the column names.
* `after-template` — a partial rendered **once, after** the rows.  Defaults to a built-in partial that emits `</table>`.
* `format` — `csv`, `tsv`, or `yaml`.  If omitted, the format is inferred from the file extension (`.csv` → csv; `.tsv` or `.tab` → tsv; `.yaml` or `.yml` → yaml; anything else defaults to csv).
* `delimiter` — the field delimiter for delimited formats.  Defaults to `,` for CSV and a tab for TSV.  Use this to read, for example, semicolon-separated files.
* `header` — whether the first row of a delimited file is a header row supplying the column names.  Defaults to `true`; set to `false` for a file with no header.

The rendered output is the concatenation of the before-template, one copy of the row template per data row, and the after-template.  Using only the defaults, `<csv-table file-name="data/people.csv" template="people-row.html.njk"></csv-table>` produces:

```html
<table>
<thead><tr><th>name</th><th>city</th></tr></thead>
<tbody>
... people-row.html.njk rendered for row 1
... people-row.html.njk rendered for row 2
</tbody>
</table>
```

## Data file formats

The three supported formats are all normalized to the same _rows_ model, so the same row template works regardless of source format:

* **CSV / TSV with a header row** (the default) — the first record supplies the column names; each following record becomes a row keyed by those names.
* **CSV / TSV without a header** (`header="false"`) — columns are the positional names `0`, `1`, `2`, …
* **YAML** — the file must contain a YAML **array**.  An array of objects (mappings) is used directly, with the column names taken from the objects' keys; an array of arrays is treated like a headerless delimited file.  A YAML file that is not an array is an error.

CSV and TSV are parsed with a full CSV parser, so quoted fields, delimiters and newlines embedded inside quotes, and escaped quotes (`""`) are all handled correctly.

## The row data

Each row template invocation receives the row's named columns at the top level, plus these helper fields:

* the **named columns** — e.g. `name` and `city` for a `name,city` header, so a Nunjucks template can write `{{ name }}`
* `fields` — the row's values as a positional array, in column order, for `{% for f in fields %}...{% endfor %}` style templates (useful for headerless data)
* `columns` — the ordered list of column names (the same for every row)
* `index` — the 0-based row number
* `rowNumber` — the 1-based row number

The before-template and after-template each receive `columns` (the ordered column-name list) and `rowCount` (the number of data rows).

A simple Nunjucks row template that emits a table row is:

```html
<tr><td>{{ name }}</td><td>{{ city }}</td></tr>
```

Or, positionally:

```html
<tr>{% for f in fields %}<td>{{ f }}</td>{% endfor %}</tr>
```

Because the templates are ordinary partials rendered through the partials directory stack, you may write them in any supported template engine, and you may override the default before/after partials by placing files named `ak_csvtable_before.html.njk` and `ak_csvtable_after.html.njk` earlier in your partials stack.  Data values are inserted through these templates, so use the template engine's escaping (Nunjucks auto-escapes `{{ }}`; in EJS use `<%= %>`) — data files often contain characters such as `<`, `&`, and `"` that must be escaped.

## Locating the data file

The `file-name` is resolved in this order:

1. In an **assets** directory.
2. In a **documents** directory (relative paths are computed relative to the document containing the tag, as with `<code-embed>`).
3. As a file on the **filesystem outside the project directories**.  An absolute path is used as-is; a relative path is resolved against the directory containing your configuration file (`config.configDir`), the same base used for relative `assets`/`documents` directories.

The third case is often the most useful for data: keeping the raw data file **outside** the assets and documents directories means it is read at build time to generate the table, but the raw `.csv`/`.tsv`/`.yaml` file is **not** copied into the deployed site.  For example, with the data one level up from the project, `file-name="../data/people.csv"` reads it without publishing it.

# Select N elements from a group

Sometimes you want to randomly select one or more elements from a group of items.  Consider:

```html
<select-elements id='advert-group'>
    <div><div id='advert1'>... HTML for advert 1</div></div>
    <div><div id='advert2'>... HTML for advert 2</div></div>
    <div><div id='advert3'>... HTML for advert 3</div></div>
    <div><div id='advert4'>... HTML for advert 4</div></div>
</select-elements>
```

The idea is to support displaying only one of them, selecting at random the child to display.

It selects among the direct children which element or elements to display.  The outer element for the child is discarded, and only its contents are displayed in the output HTML.  For example the result of the above example might be:

```html
<div id='advert-group'><div id='advert3'>... HTML for advert 3</div></div>
```

The attributes accepted by `select-elements` are:

* `id` - The ID value to use on the outputted HTML element
* `class` - The class value to use on the outputted HTML element
* `count` - The number of child elements to display - defaults to 1

# Anchor tag cleanups

This feature automagically fixes `<a>` tags, referencing a local document, and which lack text or an image.  Normally an empty tag would show up as nothing in the web browser.  AkashaRender makes it into something useful.

It reads the metadata of the referenced document, and inserts that documents title as the anchor text.

For example the code `<a href="/hello-world.html"></a>` might be rewritten to: `<a href="/hello-world.html">Hello, world!</a>`.  If you're using Markdown the equivalent works: `[](/hello-world.html)` because Markdown converts that to a normal `<a>` tag.

The URL passed in the `href` attribute should of course be the URL of the rendered file.  You might have created a file `hello-world.html.md` which is then rendered to `hello-world.html`.  The link of course needs to reference the rendered file even though the metadata is in the source file.  AkashaRender figures out which is which under the covers.

# Relative local URL's versus absolute local URL's

It is encouraged to write your content using absolute local URL's like:

```html
<a href="/index.html"></a>
<img src="/images/logo.jpg">
<link rel="stylesheet" type="text/css" href="/vendor/bootstrap/css/bootstrap.min.css">
<script src="/vendor/jquery/jquery.min.js">
```

But for deployment this has a couple issues:

* If the content is to be rendered as an EPUB all URL's must be relative, and therefore we must rewrite the URL's 
* If the content is deployed to a subdirectory .. that is, if `config.root_url` is something like `http://example.com/path/to/subdir/` .. the URL's must be rewritten either to include the subdirectory, or to be relative

For the purpose of deployment to a subdirectory, rewriting the URL's to include the subdirectory made it difficult to preview the site using a local web server.  That is, if the above is rewritten to:

```html
<a href="/path/to/subdir/index.html"></a>
<img src="/path/to/subdir/images/logo.jpg">
<link rel="stylesheet" type="text/css" href="/path/to/subdir/vendor/bootstrap/css/bootstrap.min.css">
<script src="/path/to/subdir/vendor/jquery/jquery.min.js">
```

And then we run a local webserver to preview the rendered site, none of these links will work.  The biggest problem is CSS and JavaScript for theming will not load.

Therefore, for most cases, it is desired to use relative links rather than absolute.

```html
<a href="./index.html"></a>
<img src="./images/logo.jpg">
<link rel="stylesheet" type="text/css" href="../vendor/bootstrap/css/bootstrap.min.css">
<script src="../vendor/jquery/jquery.min.js">
```

For that purpose, by default, the built-in plugin automatically computes a relative path from the source page to the destination local URL.

But this is not desired in all cases.  In some cases it is desired to use absolute paths for local URLs.  To enable this behavior, use the following in the configuration:

```js
config.prepare();

config.plugin('akashacms-builtin').relativizeHeadLinks = false;
config.plugin('akashacms-builtin').relativizeScriptLinks = false;
config.plugin('akashacms-builtin').relativizeBodyLinks = false;
```

Because the `akashacms-builtin` plugin is installed in `config.prepare`, you cannot reference the plugin until after that function is executed.  These three options control whether to relativize those types of local URLs.
