---
layout: default-once.html.ejs
title: document-group dirname test
publicationDate: 2026-07-23
---

Test: All documents whose containing directory is `hier/dir1`,
sorted by renderPath.  Unlike parent-dir, dirname matches the
immediate containing directory.

<document-group id="test-dirname" dirname="hier/dir1"
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>
