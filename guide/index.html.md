---
title: AkashaRender
layout: ebook-page.html.ejs
# bookHomeURL: '/toc.html'
---

_Akasha means the basis and essence of all things in the material world; the first material element created from the astral world. AkashaCMS is a Node.js based tool with which you can convert ideas into websites while maintaining separation between content, layout and design._

AkashaRender is a rendering engine primarily meant for creating HTML files for use on websites or in electronic books (EPUB3).  It can take input from (nearly) any text file format, and produce rendered output in (nearly) any rendering format.  The system is extremely flexible and is being built from the experience gathered while developing AkashaCMS.  Loosely speaking, AkashaRender is the first step in reinventing AkashaCMS.

The primary intended usage of AkashaRender is in building websites (or electronic books).  Out of the box it supports writing your content using Markdown, with a YAML frontmatter section to hold metadata.  AkashaRender will process the content file through a template named in in the frontmatter, enabling you to frame the content for presentation on a website or in an eBook.  Along the way we use modern CSS3 and JavaScript techniques so the result works well on the modern mobile-first web.

Content files don't have to be written with Markdown, it's simply a nice format for writing text.  The output doesn't have to be HTML, either.  

One key feature is that AkashaRender integrates Mahabhuta, an engine for performing DOM manipulation of HTML files using a jQuery-like API.  It means you can reuse your jQuery knowledge for server-side DOM manipulation and generate custom output from custom tags.  One very powerful example is to use a very simple tag, like `<framed-embed href="https://www.youtube.com/watch?v=m7V0KX_TNMc"/>`, which then generates a nice video player framed with title and a video description fetched from the YouTube website.

AkashaRender supports a powerful plugin system enabling one to flexibly extend the system.  For example, the _akashacms-blog-podcast_ plugin assists with building a blog-oriented presentation of content and generate RSS feeds.
