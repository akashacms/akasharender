---
layout: default-once.html.ejs
title: document-group limit/offset test
publicationDate: 2026-07-23
---

Test: First 2 `index.html` documents under `hier/`, sorted by renderPath

<document-group id="test-limit" root-path="hier/"
    renders-to-html="true"
    render-glob="**/index.html"
    sort-by="renderPath"
    limit="2"
    template="document-group-summary.html.ejs"></document-group>

Test: `index.html` documents under `hier/` starting at offset 2, sorted by renderPath

<document-group id="test-offset" root-path="hier/"
    renders-to-html="true"
    render-glob="**/index.html"
    sort-by="renderPath"
    offset="2"
    template="document-group-summary.html.ejs"></document-group>
