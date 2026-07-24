---
layout: default-once.html.ejs
title: document-group render-glob test
publicationDate: 2026-07-23
---

Test: All `index.html` under `hier/`, sorted by renderPath

<document-group id="test-render-glob" root-path="hier/"
    renders-to-html="true"
    render-glob="**/index.html"
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>
