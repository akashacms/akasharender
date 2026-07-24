---
layout: ebook-page.html.ejs
title: Document groups, flexible document selection
---

A document group is, well, a group of documents, selected by a flexible mechanism giving several angles of selecting documents.

It allows a plugin author, or site author, to select documents by various attributes, using them for a desired purpose.

For example, `@akashacms/plugins-blog-podcast` plugin declares that a subset of the documents on a site are a "_blog_".  It supports there being multiple blogs with the "_blogtag_" frontmatter item.  The site administrator uses a selector to declare which documents are part of a given blog, how to sort the documents, and more.

To select documents in a document group, one specifies a selector.  This is a list of attributes with which AkashaRender selects the documents that are part of the group.

There are four ways to select a document group.

## Document groups selected by `akasharender search`

The `akasharender search` command uses command-line options to describe the selector:

```shell
$ npx akasharender search config-normal.mjs  --help
Usage: akasharender search [options] <configFN>

Search for documents

Options:
  --root <rootPath>                Select only files within the named directory
  --match <pathmatch>              Select only files matching the regular expression
  --rendermatch <renderpathmatch>  Select only files matching the regular expression
  --glob <globmatch>               Select only files matching the glob expression
  --renderglob <globmatch>         Select only files rendering to the glob expression
  --parentDir <path>               Select only files whose parent directory is the named directory
  --dirname <path>                 Select only files within the named directory
  --skipglob <globmatch>           Skip files matching the glob expression
  --layouts <layouts...>           Select only files matching the layouts
  --mime <mime>                    Select only files matching the MIME type
  --tags <tags...>                 Select only files with the tags
  --blogtags <blogtags...>         Select only files with the blogtags
  --limit <limit>                  Return only so many items
  --offset <offset>                Return only items starting from the offset within the result set
  -h, --help                       display help for command
```

The documents are listed in YAML format on stdout.

This is primarily meant for exploration, so that you can verify how the parameters affect which documents are in a group.

## Document groups selected with the `<document-group>` tag

The `<document-group>` tag is part of the _built-in_ plugin, meaning it is always available and there is no configuration required.

Its complete documentation is in the documentation at: https://akashacms.com/plugins/built-in/index.html

The shape for the tag is:

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

Most of these attributes correspond to the `akasharender search` command and are what describes the selector.

This tag is placed either in a template, or in a document.

The `template=` attribute names a partial template that is used to format documents in the group.

In other words, this is useful for creating a list of documents, with consistent formatting of each entry in the group.

## The `DocumentsCache.search(selector)` API

Both of those methods simply create a _selector_ object to pass to the `search(selector)` method.

This method converts the selector into an SQL statement, searches the documnet table for matching documents, applies sorting, limit, and offset parameters, and returns the resulting documents.

## The `@akashacms/plugins-blog-podcast` blog selector

In the `@akashacms/plugins-blog-podcast`, the function `findBlogDocs` takes a selector similar to the `search(selector)`, converting it into a `search(selector)`, in order to determine the documents which are part of a given blog.

The two have a similar purpose, which is to select a group of documents using a "_selector_" object.  But, there are enough differences in details to rationalize the differences in the selector parameters.

Further, the two were created at very different times in AkashaCMS history.  `@akashacms/plugins-blog-podcast` predates `search(selector)` by several years.

For example, the _News_ blog on https://akashacms.com has this blog selector:

```js
news: {
    rss: {
        title: "AkashaCMS News",
        description: "Announcements and news about the AkashaCMS content management system",
        site_url: "http://akashacms.com/news/index.html",
        image_url: "http://akashacms.com/logo.gif",
        managingEditor: 'David Herron',
        webMaster: 'David Herron',
        copyright: '2015 David Herron',
        language: 'en',
        categories: [ "Node.js", "Content Management System", "HTML5", "Static website generator" ]
    },
    rssurl: "/news/rss.xml",
    matchers: {
        layouts: [ "blog.html.ejs", "blog.html.liquid", "blog.html.njk" ],
        rootPath: 'news/'
    }
},
```

The `rss` and `rssurl` fields determine the characteristics of the RSS feed for the blog.

The `matchers` field is essentially the `search(selector)` with some additional values being added by the plugin.  An [open task in the issue queue](https://github.com/akashacms/akasharender/issues/227) requests harmonization between the two.

The _blogtag_ in this case is `news`, making it the News blog.

As an example, consider this function:

```js
async findBlogIndexes(config, blogcfg) {
    if (!blogcfg.indexmatchers) return [];

    const documents = this.akasha.filecache.documentsCache;
    return documents.search({
        rendersToHTML: true,
        sortBy: 'publicationTime',
        sortByDescending: true,
        limit: blogcfg.maxEntries ? blogcfg.maxEntries : undefined,
        // reverse: true,
        pathmatch: blogcfg.indexmatchers.path ? blogcfg.indexmatchers.path : undefined,

        // glob: '**/*.html',
        layouts: blogcfg.indexmatchers.layouts ? blogcfg.indexmatchers.layouts : undefined,
        rootPath: blogcfg.rootPath ? blogcfg.rootPath : undefined,
    });
}
```

The _blog indexes_ are the `index.html` pages in a blog.  This takes the _matchers_ and converts it into a `search(selector)` that finds `index.html` pages in the blog.

