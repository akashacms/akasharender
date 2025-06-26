---
layout: default-once.html.handlebars
title: Anchor cleanups
publicationDate: 2021-10-01
---

<a href="http://external.url" id="not-affected"></a>

<a href="http://external.url" id="not-affected-2">Not Affected</a>

<a href="shown-content.html" id="convert-to-absolute-path">Will be converted to absolute path, anchor text not affected</a>

<a href="/shown-content.html" id="insert-title-from-document"></a>

<a href="/shown-content.html" id="img-causes-no-modify"><img src="http://external.url/foo.jpg"></a>

These should compute relative paths

<a id="link-to-hier" href="/hier/index.html"></a>

<a id="link-to-hier-dir1" href="/hier/dir1/index.html"></a>

