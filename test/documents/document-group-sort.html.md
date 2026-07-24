---
layout: default-once.html.ejs
title: document-group sort test
publicationDate: 2026-07-23
---

Test: `index.html` under `hier/` sorted ascending by renderPath

<document-group id="test-sort-asc" root-path="hier/"
    renders-to-html="true"
    render-glob="**/index.html"
    sort-by="renderPath"
    sort="asc"
    template="document-group-summary.html.ejs"></document-group>

Test: `index.html` under `hier/` sorted descending by renderPath

<document-group id="test-sort-desc" root-path="hier/"
    renders-to-html="true"
    render-glob="**/index.html"
    sort-by="renderPath"
    sort="desc"
    template="document-group-summary.html.ejs"></document-group>
