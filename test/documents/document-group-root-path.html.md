---
layout: default-once.html.ejs
title: document-group root-path test
publicationDate: 2026-07-23
---

Test: All HTML rendering under `hier/`

<document-group id="test-root-path" root-path="hier/"
    renders-to-html="true"
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>
