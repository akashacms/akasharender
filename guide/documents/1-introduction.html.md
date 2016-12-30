---
title: AkashaRender
layout: page.html.ejs
---

_Akasha means the basis and essence of all things in the material world; the first material element created from the astral world. AkashaCMS ([github organization](https://github.com/akashacms)) is a Node.js based tool with which you can convert ideas into websites while maintaining separation between content, layout and design._

AkashaRender is a rendering engine primarily meant for creating HTML files for use on websites or in electronic books (EPUB3).  It can be configured to take input from any text file format, and produce rendered output.  The system is extremely flexible and is being built from the experience gathered while developing AkashaCMS.  Loosely speaking, AkashaRender is the first step in reinventing AkashaCMS.

The primary intended usage model is to write content using Markdown with YAML frontmatter holding metadata.  This serves as the principle content of the page that will be generated.  AkashaRender will process the content file, using a template named in in the frontmatter to frame the content for presentation on a website or in an eBook.  Along the way we use modern CSS3 and JavaScript techniques so the result works well on the modern mobile-first web.

Content files don't have to be written with Markdown, it's simply a nice format for writing text.  The output doesn't have to be HTML, either.  We can configure AkashaRender to have any number of renderable input formats, and rendering plugins can produce any desired output format.

One key feature is that AkashaRender integrates Mahabhuta, an engine for performing DOM manipulation of HTML files using a jQuery-like API.  It means you can reuse your jQuery knowledge for server-side DOM manipulation and generate custom output from custom tags.  One very powerful example is to use a very simple tag referencing a YouTube video, which then generates a nice video player framed with title and a video description fetched from the YouTube website.
