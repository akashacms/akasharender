---
layout: default-once.html.ejs
title: document-group skip-glob test
publicationDate: 2026-07-23
---

Test: All `index.html` under `hier/`, skipping anything under `dir2`

<document-group id="test-skip-glob" root-path="hier/"
    renders-to-html="true"
    render-glob="**/index.html"
    skip-glob="**/dir2/**"
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>
