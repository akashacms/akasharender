---
layout: default-once.html.ejs
title: document-group wrapper attributes test
publicationDate: 2026-07-23
---

Test: Wrapper `<div>` receives id, class, and style attributes

<document-group id="test-attributes"
    class="doc-group-class"
    style="color: red;"
    parent-dir="hier/dir1"
    sort-by="renderPath"
    template="document-group-summary.html.ejs"></document-group>


Test: Wrapper `<span>` receives id, class, and style attributes

<document-group id="test-attributes-ce-span"
    class="doc-group-class-span"
    style="color: green;"
    parent-dir="hier/dir1"
    sort-by="renderPath"
    container-element="span"
    template="document-group-summary.html.ejs"></document-group>

Test: Wrapper `<ul>` receives id, class, and style attributes

<document-group id="test-attributes-ce-ul"
    class="doc-group-class-ul"
    style="color: orange;"
    parent-dir="hier/dir1"
    sort-by="renderPath"
    container-element="ul"
    template="document-group-summary-list-item.html.ejs"></document-group>



Test: Wrapper `<table>` receives id, class, and style attributes

<document-group id="test-attributes-table"
    class="doc-group-class-table"
    style="color: blue;"
    parent-dir="hier/dir1"
    sort-by="renderPath"
    head-template="document-group-summary-head.html.njk"
    footer-template="document-group-summary-foot.html.ejs"
    template="document-group-summary-table-item.html.ejs"></document-group>

