---
layout: ebook-page.html.ejs
title: Page layout, and shared snippets using partials
publicationDate: June 25, 2017
---



A _partial_ enables
1. website creator to have a library of shared things (snippets)
2. plugin authors to provide useful shared things (snippets)
3. Can be either static content, or a dynamically constructed template (EJS)

The _partial_ feature is implemented with Mahabhuta

Quick overview of Mahabhuta - point to the Using Plugins section on Mahabhuta




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

Rendered content is available in its' layout template in the `content` variable.  Therefore, somewhere in the template that variable must be accessed to render the content into the template.  The content is to be referenced like so:-

```
<%- content %>
```

This gives us a separation between the content and the page layout.  Page layout is handled by the files in the _layouts_ directories, while the content is provided by files in the _documents_ directories.  The project configuration declares where those directories are, see [](configuration.html)

# Partials in AkashaCMS

Partials are little snippets of template, which can be rendered into any location of any template using the `partial` tag.  An example is

```
<partial file-name='helloworld.html'></partial>
```

This looks in the _partials_ directories (also specified in the Configuration), and the first file found is what will be used.  In this case the partial is a simple HTML file, because its file name ends in `.html`.  A partial can also use any of the template formats such as `.html.ejs` to use EJS templates.

Partials can receive data that is expanded in the template.  You can supply data in the `<partial>` tag as so:

```
<partial file-name="render-data.html.ejs"
        data-title="Some title text"
        data-some-long-attribute-name="attribute value"></partial>
```

All the attributes whose name starts with `data-` are collected and made available as variables in the template.  A long attribute name like shown above is translated into a camelCase variable name like `someLongAttributeName`.  The body text appears as the template variable named `partialBody`.  

# Base themes and the page template

The [AkashaCMS-base plugin](/plugins/base/index.html), the [Bootstrap base theme](/plugins/theme-bootstrap/index.html)<!-- and the [Boilerplate base theme](/plugins/theme-boilerplate.html) --> all provide .....
