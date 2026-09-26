---
title: "URL Fragments and Queries Are Opaque to Path Relativization in AnchorCleanup"
type: memory
Sources:
  - lib/built-in.ts
  - ../akashacms-document-viewers/index.mjs
  - ../akashacms-footnotes/partials/ak_footnoteRef.html.ejs
  - test/index.mjs
  - test/documents/anchor-cleanups.html.md
Categories:
  - url-handling
  - debugging
  - built-in-plugin
Symptoms:
  - 'href rendered as ../vendor/img/foo.pdf when the source said /img/foo.pdf ("vendor" prepended)'
  - "WARNING: Link check (internal): internal link not found (/vendor/img/adobe-Test.pdf)"
  - "resolveVpath: relativePath must be a non-empty string, got string (in Munger html body a[munged!='yes'])"
  - viewer/document links mangled so that the link checker reports the wrong path
Keywords:
  - AnchorCleanup
  - relativizeBodyLinks
  - fragment
  - query
  - resolveVpath
  - relative
  - document-viewers
  - docviewer-link
  - Viewer.js
  - footnotes
date-created: 2026-09-26T23:10:00+0300
last-updated: 2026-09-26T23:10:00+0300
confidence: high
---

# URL Fragments and Queries Are Opaque to Path Relativization in AnchorCleanup

## Context

In `../akashacms-example`, `documents/viewer-js-viewer/pdf-spec-link.html.md`
referenced `/img/adobe-Test.pdf` (present at `documents/img/adobe-Test.pdf`
and rendered to `out/img/adobe-Test.pdf`), yet the rendered HTML contained
`<a href="../vendor/img/adobe-Test.pdf">` and the link checker warned about
`/vendor/img/adobe-Test.pdf`.  The document-viewers plugin was suspected, but
the plugin was innocent: `docviewer-link` deliberately emits
`/vendor/Viewer.js/index.html#../../../img/adobe-Test.pdf` — a link to the
Viewer.js app whose **fragment** carries a relative path to the document.

## Technique

`AnchorCleanup` (lib/built-in.ts) relativizes body-anchor hrefs with the
`relative` npm package and resolves them with `resolveVpath`/`path.normalize`.
Both treat the href string as a plain filesystem path, so a fragment like
`#../../../img/adobe-Test.pdf` participates in path arithmetic:
`../vendor/Viewer.js/index.html#../../../img/adobe-Test.pdf` normalizes to
`../vendor/img/adobe-Test.pdf` — exactly the mangled output.  Reproduce any
suspected mangling directly:

```sh
node -e "console.log(require('path').posix.relative('/viewer-js-viewer',
  '/vendor/Viewer.js/index.html#../../../img/adobe-Test.pdf'))"
```

The fix: split the href into path / query / fragment **before** any path
arithmetic, operate on the path alone, then re-append query and fragment
verbatim.  A path that strips to the empty string (`#name`, `?x`) is a
same-page anchor and must return early — otherwise `resolveVpath` throws
"relativePath must be a non-empty string" (the footnotes plugin's
`ak_footnoteRef.html.ejs` partial generates exactly such `#name` hrefs).

Regression fixtures: `a#fragment-preserved` and `a#same-page-anchor` in
`test/documents/anchor-cleanups*.html.md`, asserted by
`checkAnchorCleanups` in `test/index.mjs`.

When diagnosing "wrong path in rendered href" reports, first ask which
Mahafunc rewrote the href (grep the rendered artifact), and check whether a
fragment/query was consumed by a `path.*`/`relative()` call.

## Pitfalls

- `path.join`/`path.normalize`/`relative()` silently fold `..` segments
  inside what is actually a fragment; the fragment must never reach them.
- Fragment-only hrefs (`#name`) previously survived by accident (the full
  string went through `resolveVpath`); after splitting, they need an explicit
  early return.
- Incremental renders **skip** up-to-date documents, so Mahabhuta regressions
  can hide until `--force-render-all` (or `{ forceRenderAll: true }`) is used
  — re-render with it before concluding a fix works.
- `../akashacms-example`'s `node_modules/akasharender` is a **copy**: rebuild
  and copy `dist/*` into it before re-rendering to test local changes.

## Sources

- [lib/built-in.ts](../../../lib/built-in.ts) — AnchorCleanup path/query/fragment splitting
- [../akashacms-document-viewers/index.mjs](../../../akashacms-document-viewers/index.mjs) — `generateViewerJSURL` and the `viewerjs-link.html.ejs` partial (the fragment-carrying href design)
- [test/index.mjs](../../../test/index.mjs) — `checkAnchorCleanups` assertions

## Related Pages

- [./README.md](./README.md)
- [Link Checker Sentinel-Origin Collision (http://example.com Misclassified as Internal)](./link-checker-sentinel-origin-collision.md)
- [Built-in Plugin](../concepts/built-in-plugin.md)
- [Link Relativization](../concepts/link-relativization.md)

## Backlinks

- [Memory index](./README.md)
