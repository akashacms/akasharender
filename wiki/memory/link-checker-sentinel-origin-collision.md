---
title: "Link Checker Sentinel-Origin Collision (http://example.com Misclassified as Internal)"
type: memory
Sources:
  - lib/link-checker.ts
  - lib/built-in.ts
  - test/test-link-checker.mjs
Categories:
  - link-checking
  - debugging
  - url-handling
Symptoms:
  - "WARNING: Link check (internal): internal link not found (/http:/example.com/) — http://example.com/ in ..."
  - an outbound http:// link reported as a broken internal link with a mangled path like /http:/example.com/
  - only http://example.com links misclassified; https://example.com links are fine
Keywords:
  - link-checker
  - classify
  - LOCAL_BASE
  - hasUrlScheme
  - AnchorCleanup
  - example.com
  - origin
  - URL
  - resolveVpath
date-created: 2026-09-26T22:40:51+0300
last-updated: 2026-09-26T22:40:51+0300
confidence: high
---

# Link Checker Sentinel-Origin Collision (http://example.com Misclassified as Internal)

## Context

While building `../akashacms-example`, the link checker printed:

```
WARNING: Link check (internal): internal link not found (/http:/example.com/) — http://example.com/ in markdown.html
```

The document `documents/markdown.html.md` contains outbound links to
`http://example.com/` (rendered correctly as
`<a href="http://example.com/" target="_blank" rel="noreferrer noopener">`), yet
the checker treated them as internal.

## Technique

The local-link test used throughout the code base is the *sentinel-origin
trick*:

```ts
const u = new URL(href, 'http://example.com');
if (u.origin === 'http://example.com') { /* local */ }
```

The sentinel `http://example.com` is a **real URL**.  An outbound link to
exactly that origin (`http://example.com/`) parses to that origin, so it is
misclassified as internal; `resolveVpath()` then runs `path.join` over it,
collapsing `//` to `/` and producing the tell-tale nonsense path
`/http:/example.com/`.  Only the plain-`http` variant collides —
`https://example.com` has a different origin and classifies external
correctly, which makes the bug look like an http-vs-https issue.

The fix (in `lib/link-checker.ts` `classify()` and `AnchorCleanup` in
`lib/built-in.ts`): test for a **leading URI scheme first** with the exported
`hasUrlScheme()` helper (`/^[a-zA-Z][a-zA-Z0-9+.-]*:/`, RFC 3986).  Any
scheme-absolute href is an absolute URL — external for `http:`/`https:`,
other-scheme for the rest — before the sentinel-origin comparison is reached.
A protocol-relative `//host/path` href is likewise external.  Regression tests
live in `test/test-link-checker.mjs` ("outbound sentinel-origin links",
"protocol-relative URL as external").

When touching any of the several other sentinel-origin uses in
`lib/built-in.ts` (stylesheet/script/image href treaters), apply the same
scheme-first check.

## Pitfalls

- The sentinel-origin trick is safe **only** for hrefs known to carry no
  scheme; it cannot alone distinguish "relative reference" from "absolute URL
  that happens to equal the sentinel".
- `path.join`/`path.normalize` silently collapse `//`, so a misclassified URL
  shows up as `http:/` (single slash) — a strong hint of this bug.
- A colon in a **non-first** path segment (`foo/bar:baz.html`) is not a
  scheme; anchor the scheme regex so such relative links stay internal.
- When verifying against `../akashacms-example`, remember its
  `node_modules/akasharender` is a **copy** — rebuild (`npm run build`) and
  copy `dist/*` over `node_modules/akasharender/dist/` before re-rendering.

## Sources

- [lib/link-checker.ts](../../../lib/link-checker.ts) — `hasUrlScheme()` and the scheme-first `classify()`
- [lib/built-in.ts](../../../lib/built-in.ts) — `AnchorCleanup` scheme/`//` guard
- [Link Checker Implementation Guide](../implementation/link-checker.md)

## Related Pages

- [./README.md](./README.md)
- [Link Checker Implementation Guide](../implementation/link-checker.md)
- [Built-in Plugin](../concepts/built-in-plugin.md)

## Backlinks

- [Memory index](./README.md)
