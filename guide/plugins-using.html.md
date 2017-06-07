---
layout: ebook-page.html.ejs
title: Using AkashaCMS plugins in AkashaRender projects
# bookHomeURL: '/toc.html'
---

Remember that AkashaCMS is a generalized name for the synergistic combination of AkashaRender with the plugins.

Plugin provides useful extensions to AkashaRender's functionality

See [list of known plugins](plugins/index.html)

Declaring a plugin in configuration file ... `.use(require("plugin-reference"))`

Configuring a plugin in configuration file

Plugins usually provide:
1. Assets or Partials
2. Mahabhuta custom elements

Overriding the provided asset or partial

Using provided Mahabhuta tags
1. Using a tag, passing attributes
2. Element body as data or text
3. Mahabhuta that makes broader changes 
