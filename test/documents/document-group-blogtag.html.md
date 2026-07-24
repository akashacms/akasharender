---
layout: default-once.html.ejs
title: document-group blogtag test
publicationDate: 2026-07-23
---

Test: All documents with `blogtag: sibling`, sorted by renderPath

<document-group id="test-blogtag" blogtag="sibling"
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>

Test: All documents with `blogtag` of `sibling` or `nestedAnchor`,
sorted by renderPath

<document-group id="test-blogtag-multi" blogtag='["sibling", "nestedAnchor"]'
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>
