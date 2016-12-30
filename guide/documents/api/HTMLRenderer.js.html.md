---
layout: docpage.html.ejs
title: HTML Renderer
---
  - [undefined.maharun()](#undefinedmaharun)
  - [undefined.renderForLayout()](#undefinedrenderforlayout)
  - [undefined.if()](#undefinedif)
  - [undefined.renderToFile()](#undefinedrendertofile)
  - [undefined.doMahabhuta()](#undefineddomahabhuta)
  - [undefined.frontmatter()](#undefinedfrontmatter)
  - [undefined.metadata()](#undefinedmetadata)
  - [undefined.initMetadata()](#undefinedinitmetadata)

## undefined.maharun()

  Support for Mahabhuta -- jQuery-like processing of HTML DOM before Rendering
  down to HTML text.

## undefined.renderForLayout()

  If the document metadata says to render into a template, do so.

## undefined.if()

  if (!renderer && metadata.layout.match(/\.html$/) != null) {
```js
                  return filez.readFile(partialDir, partial);
              }
```

## undefined.renderToFile()

  Render the document file, through a template if necessary, producing
  an output file.

## undefined.doMahabhuta()

  Determine whether it's allowed to run Mahabhuta.  Some rendering types
  cannot allow Mahabhuta to run.  Renderers should override this
  function if necessary.

## undefined.frontmatter()

  Extract the frontmatter for the given file.

## undefined.metadata()

  Extract the metadata from the given file.  Where the `frontmatter` function
  returns an object that contains the metadata, this function returns only
  the metadata object.
  
  This metadata is solely the data stored in the file.

## undefined.initMetadata()

  Initialize the metadata object which is passed around with the Document object.
  This metadata is formed by adding together the document metadata, potential metadata
  associated with the document directory, some data about the source file and where it's
  supposed to be rendered, as well as some useful functions.
