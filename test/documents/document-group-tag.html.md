---
layout: default-once.html.ejs
title: document-group tag test
publicationDate: 2026-07-23
---

Test: All documents with tag `Tag1`

<document-group id="test-tag" tag="Tag1"
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>

Test: All documents with tag `Tag1` or `Tag-string-2`, sorted by renderPath

<document-group id="test-tag-multi" tag='["Tag1", "Tag-string-2"]'
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>

Test: A tag whose value contains spaces and double-quote characters,
which can only be expressed via the JSON array form

<document-group id="test-tag-quoted" tag='["Something \"quoted\""]'
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>
