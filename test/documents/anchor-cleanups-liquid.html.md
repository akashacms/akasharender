---
layout: default-once.html.liquid
title: Anchor cleanups
publicationDate: 2021-10-02
---

<a href="http://external.url" id="not-affected"></a>

<a href="http://external.url" id="not-affected-2">Not Affected</a>

<a href="shown-content.html" id="convert-to-absolute-path">Will be converted to absolute path, anchor text not affected</a>

<a href="/shown-content.html" id="insert-title-from-document"></a>

<a href="/shown-content.html" id="img-causes-no-modify"><img src="http://external.url/foo.jpg"></a>

These should compute relative paths

<a id="link-to-hier" href="/hier/index.html"></a>

<a id="link-to-hier-dir1" href="/hier/dir1/index.html"></a>


A fragment carrying a relative path (document-viewers style) must survive untouched

<a id="fragment-preserved" href="/hier/index.html#../../../img/test.pdf">Fragment preserved</a>

A same-page anchor (fragment only) must be left untouched

<a id="same-page-anchor" href="#section-name">Same page anchor</a>
