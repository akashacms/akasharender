---
layout: default-once.html.ejs
title: document-group vpath-glob test
publicationDate: 2026-07-23
---

Test: All `sibling*.html.md` sources under `hier/dir1`, sorted by vpath

<document-group id="test-vpath-glob"
    renders-to-html="true"
    vpath-glob="hier/dir1/sibling*.html.md"
    sort-by="vpath"
    template="document-group-summary.html.ejs"></document-group>
