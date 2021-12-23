---
title: AkashaRender
layout: ebook-page.html.ejs
publicationDate: December 22, 2021
---

_Akasha means the basis and essence of all things in the material world; the first material element created from the astral world. AkashaCMS is a Node.js based tool with which you can convert ideas into websites while maintaining separation between content, layout and design._

AkashaRender is a rendering engine primarily meant for creating HTML files for use on websites or in electronic books (EPUB3).  It can take input from (nearly) any text file format, and produce rendered output in (nearly) any rendering format.  The system is extremely flexible and is the result of nearly 10 years of usage, experimentation, and development.

The primary usage of AkashaRender is for building static HTML websites (or electronic books).  Out of the box it supports writing your content using Markdown or AsciiDoc, with a YAML frontmatter section to hold metadata.  AkashaRender will process the content file through a template named in in the frontmatter, enabling you to frame the content in the desired page layout.  Along the way we use modern CSS3 and JavaScript techniques so the result works well on the modern mobile-first web.

For advanced CSS support, AkashaRender includes the ability to compile LESS files to standard CSS.  Since the build workflow is described using the `scripts` section of `package.json`, your project can easily use any external build tool.

AkashaCMS is a loose name referring to AkashaRender and the rest of the AkashaCMS ecosystem.  That encompasses several [_plugins_](https://akashacms.com/plugins/index.html), each of which cover certain areas of functionality, and the _Mahabhuta_ engine for performing server-side DOM manipulation.

Mahabhuta, uses a jQuery-like API (provided by Cheerio), allowing plugins to easily implement transformations using the familiar jQuery API.  AkashaCMS plugins use Mahabhuta in two main areas:

1. Cleaning up HTML constructs or other HTML tweaks
1. Implementing custom tags that encapsulate complex structures

One very powerful example is a very simple tag, like this:

```html
<embed-resource href="https://www.youtube.com/watch?v=m7V0KX_TNMc"/>
```

This, when the `@akashacms/plugins-embeddables` plugin is present, generates a nice video player framed with title and a video description fetched from the YouTube website.
