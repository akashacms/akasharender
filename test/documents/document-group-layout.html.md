---
layout: default-once.html.ejs
title: document-group layout test
publicationDate: 2026-07-23
---

Test: All documents using the `default-once-teaser.html.njk` layout

<document-group id="test-layout" layout="default-once-teaser.html.njk"
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>

Test: All documents using the `default-once-teaser.html.njk` or
`njkincl.html.njk` layout, sorted by renderPath

<document-group id="test-layout-multi"
    layout='["default-once-teaser.html.njk", "njkincl.html.njk"]'
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>
