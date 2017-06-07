---
layout: ebook-page.html.ejs
title: Page layout, and shared snippets using partials
# bookHomeURL: '/toc.html'
---

Content specifies its page layout template with `layout` metadata

Writing a page layout template with EJS
    1. Why do we only use EJS?
    2. We're open to other template processors
    3. Two ways to add value --- Partials, and Mahabhuta tags

A _partial_ enables
1. website creator to have a library of shared things (snippets)
2. plugin authors to provide useful shared things (snippets)
3. Can be either static content, or a dynamically constructed template (EJS)

The _partial_ feature is implemented with Mahabhuta

Quick overview of Mahabhuta - point to the Using Plugins section on Mahabhuta
