---
title: "Useful Microformats and IndieWeb Markup for a Static Blog"
type: answer
Sources:
  - lib/built-in.ts
  - partials/ak_show-content.html.njk
  - partials/ak_teaser.html.njk
  - wiki/concepts/built-in-plugin.md
  - wiki/answers/activitypub-fediverse-html-elements.md
  - wiki/answers/bluesky-atproto-integration.md
Categories:
  - microformats
  - indieweb
  - semantic-html
  - metadata
  - feature-design
date-created: 2026-06-19T15:30:00+03:00
last-updated: 2026-06-19T17:30:00+03:00
confidence: medium
---

# Useful Microformats and IndieWeb Markup for a Static Blog

## Query

GitHub issue [akashacms/akasharender#33](https://github.com/akashacms/akasharender/issues/33)
is a long-standing catch-all for microformats, IndieWeb, ActivityPub, and the
Fediverse. The ActivityPub/Fediverse/Bluesky pieces are covered separately.
This answer asks: the microformats / IndieWeb world is about adding semantic
information to certain elements — for example an author listing carrying
machine-readable data about the author, not just text. Summarize the
microformats that would be useful for a static HTML website/blog such as one
created by AkashaCMS.

## Answer

### What microformats are (and which version to use)

**Microformats** are a way to add machine-readable semantics to ordinary HTML
by attaching agreed-upon **class names** to existing elements. Unlike Open
Graph (`<meta>` tags in `<head>`) or JSON-LD (a separate script block),
microformats annotate the **visible content itself** — the same `<article>`,
`<a>`, and `<time>` a human reads becomes parseable by machines. Nothing extra
is rendered; you are just labelling what is already there.

There are two generations:

- **microformats v1 (classic)** — `hCard`, `hentry`, `hatom`, `rel-tag`,
  `XFN`, etc. Uses many ad-hoc class names (`vcard`, `fn`, `url`, `hentry`,
  `entry-title`). Still widely seen, but superseded.
- **microformats2 (mf2)** — the current, simpler, prefix-based vocabulary:
  `h-*` for root types (e.g. `h-card`, `h-entry`), `p-*` for plain-text
  properties, `u-*` for URL properties, `dt-*` for date/time properties, and
  `e-*` for embedded HTML. **Use microformats2.** It is what IndieWeb tooling
  (parsers, Webmention endpoints, readers) expects today.

The IndieWeb community keeps microformats alive precisely for the static/
self-hosted-blog use case in this issue: they are the substrate that
**Webmention**, **POSSE**, and IndieWeb readers rely on
(source: [issue #33](https://github.com/akashacms/akasharender/issues/33) links
to microformats.org and indieweb.org).

### Why they are worth it for a static blog

- **Author/article semantics**: a parser can extract "who wrote this, when,
  what's the title, what's the permalink" reliably — exactly the
  author-listing example in the question.
- **IndieWeb interop**: Webmention senders/receivers and IndieWeb readers parse
  `h-entry`/`h-card` to know how to display and attribute a post.
- **Search/SEO**: some engines read microformats as a secondary signal; the
  semantics also overlap conceptually with schema.org structured data.
- **Cheap and non-visual**: they are just `class` attributes added to markup
  AkashaCMS already generates — a natural fit for partial templates.

---

### The microformats worth implementing

For a website/blog, a small subset covers almost everything. Listed roughly in
priority order.

#### 1. `h-entry` — the blog post / article (highest value)

`h-entry` marks a single post. It is the backbone of IndieWeb syndication and
Webmention. Apply it to the article wrapper, then label the parts:

```html
<article class="h-entry">
  <h1 class="p-name">Post Title</h1>

  <p class="p-summary">A short teaser/summary of the post.</p>

  <a class="u-url" href="https://example.com/2026/my-post.html">permalink</a>

  <time class="dt-published" datetime="2026-06-19T12:00:00+03:00">
    June 19, 2026
  </time>
  <time class="dt-updated"  datetime="2026-06-19T13:00:00+03:00"></time>

  <div class="e-content">
    <p>The full rendered HTML body of the post…</p>
  </div>

  <!-- author block: see h-card below, nested with p-author -->
  <a class="p-author h-card" href="https://example.com/about">Jane Doe</a>

  <!-- tags: see rel-tag / p-category below -->
  <a class="p-category" href="/tags/indieweb/">indieweb</a>
</article>
```

Key `h-entry` properties:

| Property | Prefix | Meaning |
|---|---|---|
| `p-name` | `p-` | Title / name of the post |
| `p-summary` | `p-` | Teaser / excerpt |
| `e-content` | `e-` | The full HTML body |
| `dt-published` | `dt-` | Publication date (use `<time datetime>`) |
| `dt-updated` | `dt-` | Last-modified date |
| `u-url` | `u-` | The post's canonical permalink |
| `p-author` | `p-` | The author (usually a nested `h-card`) |
| `p-category` | `p-` | A tag/category |

#### 2. `h-card` — the author / person (the "author listing" case)

`h-card` is the direct answer to the question's example: it turns an author
byline into machine-readable identity data instead of plain text. It is used
both **standalone** (an About page, a sidebar bio) and **nested inside an
`h-entry`** as `p-author h-card`:

```html
<a class="h-card" href="https://example.com/about">
  <img class="u-photo" src="/img/jane.jpg" alt="" />
  <span class="p-name">Jane Doe</span>
  <span class="p-job-title">Writer</span>
  <a class="u-url u-uid" href="https://example.com/">example.com</a>
  <a class="u-email" href="mailto:jane@example.com">jane@example.com</a>
  <span class="p-note">Short bio sentence.</span>
</a>
```

Common `h-card` properties: `p-name`, `u-url`, `u-photo`, `u-email`,
`p-job-title`, `p-org`, `p-note`, `u-uid`. For IndieWeb identity, a
**representative `h-card`** on the site's home page — with `u-url u-uid`
pointing at the site root — establishes "who owns this domain," which pairs
naturally with the Fediverse/Bluesky identity work in the companion answers.

This is exactly the upgrade the question describes: the current AkashaCMS author
rendering is plain text, and an `h-card` adds the semantic layer over it.

#### 3. `rel="me"` — identity verification / RelMeAuth (very high value, tiny)

`rel="me"` links connect your site to your other profiles, establishing a
bidirectional identity claim. It is the cornerstone of IndieWeb identity and is
trivial to emit:

```html
<a rel="me" href="https://mastodon.social/@jane">Mastodon</a>
<a rel="me" href="https://github.com/jane">GitHub</a>
<a rel="me" href="https://example.com">Home</a>
```

If the linked profile links back with `rel="me"`, the claim is verified. This
is also what some Fediverse servers (and the Mastodon profile-link checkmark)
use — so it connects directly to the
[Fediverse answer](./activitypub-fediverse-html-elements.md). Place these in the
representative `h-card` and/or the footer.

#### 4. `rel="tag"` / `p-category` — tags

Two complementary mechanisms label a post's tags:

```html
<a rel="tag" class="p-category" href="/tags/microformats/">microformats</a>
```

`rel="tag"` is the classic tag rel; `p-category` is the mf2 property inside an
`h-entry`. AkashaCMS already has a tag system, so a tag-listing partial is the
natural place to add both. (See the [Tag System](../concepts/tag-system.md).)

#### 5. `h-feed` — the post list / index page

Wrap a list/index of posts in `h-feed`, with each item an `h-entry`. This lets
IndieWeb readers consume your home page or archive like a feed:

```html
<div class="h-feed">
  <h1 class="p-name">Jane's Blog</h1>
  <article class="h-entry"> … </article>
  <article class="h-entry"> … </article>
</div>
```

#### 6. Reply/like/repost context: `u-in-reply-to`, `u-like-of`, `u-repost-of`

For an IndieWeb blog that participates in Webmention conversations, an
`h-entry` can declare what it responds to:

```html
<a class="u-in-reply-to" href="https://other.example/post/123">in reply to</a>
<a class="u-like-of"     href="https://other.example/post/456">liked</a>
<a class="u-repost-of"   href="https://other.example/post/789">reposted</a>
```

These are optional and only relevant if the blog adopts Webmention-style
interactions (which require a receiving endpoint — a dynamic component, like the
PHP shim discussed in the Fediverse answer).

#### 7. `XFN` (`rel` values on links) — relationships

Classic XFN (`rel="friend"`, `rel="colleague"`, `rel="me"`) annotates the human
relationship of a link. In practice only `rel="me"` (above) still carries
significant weight; the rest are low priority.

---

### How this maps onto AkashaCMS

AkashaCMS is well-suited to emit microformats because they are just `class` and
`rel` attributes on markup the templates already produce. Concretely:

- **Partial templates are the injection point.** The blog-rendering partials
  (e.g. the content/teaser partials such as
  [partials/ak_show-content.html.njk](../../partials/ak_show-content.html.njk)
  and [partials/ak_teaser.html.njk](../../partials/ak_teaser.html.njk)) are
  where `h-entry`/`h-card` classes would be added. These currently render
  plain `<span>`/`<strong>` markup with no semantics — exactly the gap the
  question identifies.
- **The blog plugin owns post structure.** The richest `h-entry`/`h-feed`
  output belongs in `@akashacms/plugins-blog-podcast`, which already knows the
  post title, summary, date, and permalink — the precise fields `h-entry`
  needs.
- **An author/`h-card` partial.** `@akashacms/plugins-authors` already renders
  author blocks; adding `h-card` classes (and `rel="me"` links) there delivers
  the author-listing semantics with minimal change.
- **Frontmatter drives the data.** Post date, title, tags, and author are
  already available as document metadata, so the templates can fill
  `dt-published`, `p-name`, `p-category`, and `p-author` directly — no new data
  model required.
- **Shared metadata pipeline.** This complements (does not replace) the Open
  Graph work done via `mahaMetadata` in the
  [Built-in Plugin](../concepts/built-in-plugin.md)
  (source: [lib/built-in.ts](../../lib/built-in.ts):80): Open Graph lives in
  `<head>` for link previews, microformats live in the body for parsers; a
  complete implementation does both.

### A pragmatic implementation outline

1. **`h-entry` on the post body** — wrap the rendered article and label
   `p-name`, `e-content`, `dt-published`, `dt-updated`, `u-url`. Highest value,
   smallest change (blog partials).
2. **`h-card` for the author**, nested as `p-author h-card` inside `h-entry`
   and standalone on About/sidebar; add `u-photo`, `u-url`, `p-name`.
3. **A representative `h-card` + `rel="me"` links** on the home page/footer for
   IndieWeb identity (and Fediverse/Bluesky profile verification).
4. **`p-category` + `rel="tag"`** in the tag-listing partial, reusing the
   existing tag system.
5. **`h-feed`** around index/archive listings.
6. **(Optional) Webmention `u-in-reply-to`/`u-like-of`** plus a receiving
   endpoint — only if the blog adopts IndieWeb conversations (needs a dynamic
   receiver, like the PHP approach in the Fediverse answer).

### Tools for verification

Per the issue's "QUESTION — Tools for checking microformats" note, validate
output with the microformats2 parsers and the IndieWebify.me / microformats.io
checkers (external services) — *NEEDS VERIFICATION* of current URLs, but the
canonical parser libraries (e.g. `microformats-parser` for Node, `mf2py` for
Python) can be wired into the AkashaCMS test suite to assert that generated
pages parse into the expected `h-entry`/`h-card` JSON.

### Bottom line

- Use **microformats2** (`h-entry`, `h-card`, `h-feed`, with `p-`/`u-`/`dt-`/
  `e-` properties), not the classic v1 vocabulary.
- The **author-listing** example maps to a nested **`p-author h-card`**, plus a
  **representative `h-card`** and **`rel="me"`** links for IndieWeb identity.
- These are pure `class`/`rel` annotations on markup AkashaCMS already emits, so
  the work lives in **partial templates and the blog/authors plugins**, and
  complements (not replaces) the Open Graph metadata used for link previews.

## Sources

- [issue #33](https://github.com/akashacms/akasharender/issues/33) — The
  catch-all feature request for microformats/IndieWeb/Fediverse, with reference
  links to microformats.org, MDN, and indieweb.org (milestone 0.10).
- [partials/ak_show-content.html.njk](../../partials/ak_show-content.html.njk),
  [partials/ak_teaser.html.njk](../../partials/ak_teaser.html.njk) — Current
  content/teaser partials render plain markup with no microformats semantics.
- [lib/built-in.ts](../../lib/built-in.ts) — `mahaMetadata` registration (line
  80); the head-metadata layer that microformats complement.
- [wiki/concepts/built-in-plugin.md](../concepts/built-in-plugin.md) — Metadata
  handling responsibilities.

## Related Pages

- [Elements Required for ActivityPub and Fediverse Integration](./activitypub-fediverse-html-elements.md) — Companion answer; `rel="me"` and identity overlap, and the Webmention-endpoint (PHP) discussion
- [Bluesky / AT Protocol Integration and Crossover with the Fediverse](./bluesky-atproto-integration.md) — Companion answer; shared identity/metadata concerns
- [Social-Sharing Metadata: Open Graph, Twitter Cards, and Facebook](./social-sharing-metadata-opengraph-twitter-facebook.md) — The head-metadata counterpart; microformats are the in-body complement to these `<meta>` cards
- [Webmention: Purpose, Markup, Protocol, and Server Software](./webmention-protocol-and-markup.md) — Webmention relies on these `h-entry`/`u-in-reply-to`/`h-card` microformats to classify cross-site mentions
- [Built-in Plugin](../concepts/built-in-plugin.md) — Where `<head>` metadata is injected; microformats are the body-level complement
- [Tag System](../concepts/tag-system.md) — Existing tag data that feeds `p-category`/`rel="tag"`
- [Custom Elements](../concepts/custom-elements.md) — Custom HTML tags via Mahabhuta, a model for injecting semantic markup
- [Plugin System](../concepts/plugin-system.md) — How a microformats/IndieWeb plugin would extend AkashaRender

## Backlinks

- [Answer index](./README.md)
- [Social-Sharing Metadata: Open Graph, Twitter Cards, and Facebook](./social-sharing-metadata-opengraph-twitter-facebook.md)
- [Webmention: Purpose, Markup, Protocol, and Server Software](./webmention-protocol-and-markup.md)
