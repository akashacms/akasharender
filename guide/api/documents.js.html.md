---
layout: ebook-page.html.ejs
title: Documents
---
  - [exports.Document](#exportsdocument)
  - [basedir](#basedir)
  - [docpath](#docpath)
  - [componentizeFileName](#componentizefilename)
  - [exports.documentTree()](#exportsdocumenttree)
  - [undefined.for()](#undefinedfor)

## exports.Document

  Standardized object to describe document files which render using an HTMLRenderer.

## basedir

  The directory structure within which this document was found.

## docpath

  The path for this document within basedir.

## componentizeFileName

  Used by documentTree to convert a pathname to an array like this:

  [ { type: 'dir', component: 'foo', entries: [] },
```js
{ type: 'dir', component: 'bar', entries: [] },
{ type: 'dir', component: 'bas', entries: [] },
{ type: 'dir', component: 'baz', entries: [] },
{ type: 'file', component: 'xyzzy.html' } ]
```

## exports.documentTree()

  {
```js
      type: "root",
      title: "copied from index.html",
      teaser: "copied from index.html",
      name: undefined,
      entries: [
          // Made up of entries of one of these two types
          {
              type: "file",
              title: "copied from metadata",
              teaser: "copied from metadata",
              name: "file name .ext",
              document: see object created in findBookDocs,
          },
          {
              type: "dir",
              title: "copied from metadata of index.html",
              teaser: "copied from metadata of index.html",
              name: "directory name",
              entries: [
                  // repeat
              ]
          }
      ]
  }
```

## undefined.for()

  [ { type: 'dir', component: 'foo', entries: [] },
```js
{ type: 'dir', component: 'bar', entries: [] },
{ type: 'dir', component: 'bas', entries: [] },
{ type: 'dir', component: 'baz', entries: [] },
{ type: 'file', component: 'xyzzy.html' } ]
```
