---
layout: ebook-page.html.ejs
title: AkashaRender Rendering Engines - usage and implementation
# bookHomeURL: '/toc.html'
---

The `file-name.foo.bar` filename convention is used to identify the rendering engine for a given file.

Using one rendering engine or another happens behind the scenes.  The content author creates a file of a given file-name format, and they need to know the rules to follow for that type of file.  Hence writing an `.html.md` file means you add metadata in the YAML frontmatter, and are otherwise writing in Markdown, except you can use both HTML and Mahabhuta tags.

The rendering engine author needs to keep in mind - the user needs to know the rules of the type of file supported by their rendering engine.

A rendering engine is implemented as a Renderer object.  Discuss the methods of this.

HTMLRenderer subclasses -- additional functionality
