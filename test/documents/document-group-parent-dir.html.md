---
layout: default-once.html.ejs
title: document-group parent-dir test
publicationDate: 2026-07-23
---

Test: All documents whose parentDir is `hier/dir1`, sorted by renderPath.
Note: parentDir is the parent of a document's containing directory,
so this selects the documents inside `hier/dir1/dir2`.

<document-group id="test-parent-dir" parent-dir="hier/dir1"
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>
