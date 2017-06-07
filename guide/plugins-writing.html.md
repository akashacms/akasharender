---
layout: ebook-page.html.ejs
title: Writing AkashaCMS plugins for use by AkashaRender projects
# bookHomeURL: '/toc.html'
---

Remember that AkashaCMS is a generalized name for the synergistic combination of AkashaRender with the plugins.

Plugin provides useful extensions to AkashaRender's functionality

See [list of known plugins](https://akashacms.com/new/plugins/index.html)

Plugin exports a `Plugin` object with a minimum of ?two? methods

When `.use(require("plugin-name"))` ... calls plugin's configure method
1. Add any directories for assets or partials
2. Add any configuration parameters, like JavaScript or CSS
3. Enable any required hooks
4. Add mahabhuta array

Setup of assets and partials directory
1. Useful naming convention like `/vendor/plugin-name/asset.file`

Partials should endeavor to use CSS classes so website authors can easily customize the look of the partial

Implementing Mahabhuta elements ...
1. Element names should have `-` to avoid conflicting with HTML element names
2. Using familiar attributes like `href=` or `class=` in familiar ways helps users
