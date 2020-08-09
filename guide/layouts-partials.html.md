---
layout: ebook-page.html.ejs
title: Page layout, and shared code snippets using partials or Mahabhuta custom tags
publicationDate: June 25, 2017
---


Website designers need freedom to flow their content in all kinds of ways, to have sidebar widgets of all kinds, and on and on.  The marketing department needs to have microformat tags of all kinds to express semantic information to search engines, hopefully having a positive SEO benefit.  Your visitors need to be able to read/view the content, especially on their mobile device.  Finally, the content authors need to be relieved of the burden of supplying HTML for the entire page for every document, and instead need to reuse each layout on multiple pages.

# Specifying the layout used on a given page

As we noted when discussing the [overall format for AkashaCMS files](/akasharender/3-create-content.html), documents are split into frontmatter and content.  Among the frontmatter tags is the `layout` tag which specifies the layout template for the content.

The template is simply declared using the `layout` tag in the frontmatter like so:

```
---
layout: article.html.ejs
other: frontmatter
---
<p>Content</p>
```

The layout template is interpreted by the template engine implied by the [file extension](/akasharender/3-create-content.html), just as for partials and documents.

We find templates by looking in directories specified in the configuration object:

```js
config.addLayoutsDir('layouts');
```

We can use multiple `addLayoutsDir` declarations, and AkashaRender will consult each directory in order.  When searching for a specific layout file, it stops at the first matching file.   In this case, with a single directory to search, the matching file would be `layouts/article.html.ejs`.

It's quite easy to have multiple page layouts available.  Simply put as many layout templates as desired in these directories, and specify the appropriate template in the metadata for each file.

## Page structure and content

The separation of page content from page structure/layout is the result of what we just discussed.  The content author focuses on their content in the document file, while specifying the page layout in the metadata.  The website designer focuses on the page layout, in the layout template, and the same layout can be used for multiple pages.

Building the page structure/layout will depend on the framework used.  For example in Bootstrap one defines `<div class="row">..</div>` for each row of the layout, then the columns are defined within the row using `<div class="col-md-5">..</div>` to specify the width of the column (`col-md-5` means 5 units of column width).

We went over some ideas on creating a page layout in [](theming.html)

The rendered content from the content document is available to the layout template in the `content` variable.  Therefore, somewhere in the template that variable must be accessed to render the content into the template.  The content is to be referenced like so:-

```
<%- content %>
```

That of course assumes the layout template is implemented with EJS.  The `<%- .. %>` tag makes a literal (no encoding) embeddment of the HTML in the variable into the rendered output.

For some working examples see the layout templates used for `akashacms.com`: https://github.com/akashacms/akashacms-website/tree/master/layouts

## Variable substitution in a template

Any time AkashaRender processes a template, it provides some variables.  Most template engines, like EJS, have a way for values to be substituted into the rendered output.  We already saw that with `<%- content %>` so let's take a closer look

EJS provides two kinds of substitutions:

Substitution type | Description
------------------|--------------
`<%= value %>` | Substitutes the content of the named variable, encoding any HTML as HTML entities
`<%- value %>` | Substitutes the content of the named variable, with no encoding

The choice between the two depends on the variable you're substituting, and your purpose with that variable.  In the case of `content`, we have HTML that we want to appear as it is with no encoding.  For other variables shown in this template, it's expected they'll be simple text values and that HTML were in the variable would be an accident.

With Liquid and Nunjucks there is one kind of substitution, and you get the difference between encoded and unencoded like so:

Substitution type | Description
------------------|------------------
`{{ value | escape }}` | Substitutes the content of the named variable, encoding any HTML as HTML entities
`{{ value }}` | Substitutes the content of the named variable, with no encoding

The difference is in using the `escape` filter.  Liquid and Nunjucks both have a large number of available filters for various purposes.

In Handlebars templates this happens a little differently:

Substitution type | Description
------------------|------------------
`{{ value }}` | Substitutes the content of the named variable, encoding any HTML as HTML entities
`{{{ value }}}` | Substitutes the content of the named variable, with no encoding

To get raw output use three curly braces, otherwise you're encouraged to use two for the safety of encoded output.

The most important bit is where the `content` variable is substituted.  The idea is to surround the `content` with the desired page layout, navigational widgets, etc.

# Partials in AkashaCMS

Partials are little snippets of template, which can be rendered into any location of any template using the `partial` tag.  An example is

```html
<partial file-name='helloworld.html'></partial>
```

If you cannot use the `<partial>` tag, for example if you're creating a PHP file, and the file is processed by EJS, you can do this instead:

```
<%- partial('helloworld.html') %>
```

This looks in the _partials_ directories (also specified in the Configuration), and the first file found is what will be used.  In this case the partial is a simple HTML file, because its file name ends in `.html`.  A partial can also use any of the template formats such as `.html.ejs` to use EJS templates.

Partials can receive data that is expanded in the template.  You can supply data in the `<partial>` tag as so:

```html
<partial file-name="render-data.html.ejs"
        data-title="Some title text"
        data-some-long-attribute-name="attribute value"></partial>
```

All the attributes whose name starts with `data-` are collected and made available as variables in the template.  A long attribute name like shown above is translated into a camelCase variable name like `someLongAttributeName`.  The body text appears as the template variable named `partialBody`.  

A common use for partials in page layouts is for major page structures.  You might have a sitewide navigation bar at the top of every page, or an administrative-oriented set of links in the footer.  Since those need to be the same on every page, the simplest approach is to keep them in a partial pulling that into every page layout using the `<partial>` tag.
