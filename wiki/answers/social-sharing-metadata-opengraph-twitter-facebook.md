---
title: "Social-Sharing Metadata: Open Graph, Twitter Cards, and Facebook"
type: answer
Sources:
  - lib/built-in.ts
  - wiki/concepts/built-in-plugin.md
  - wiki/answers/activitypub-fediverse-html-elements.md
  - wiki/answers/bluesky-atproto-integration.md
  - wiki/answers/microformats-indieweb-for-static-blogs.md
External-Sources:
  - ../akashacms-base/layouts/ak_headermeta.html.njk
  - ../akashacms-base/partials/ak_headermeta.html.ejs
  - ../akashacms-base/index.mjs
Categories:
  - open-graph
  - twitter-cards
  - facebook
  - metadata
  - feature-design
date-created: 2026-06-19T16:30:00+03:00
last-updated: 2026-06-19T17:30:00+03:00
confidence: medium
---

# Social-Sharing Metadata: Open Graph, Twitter Cards, and Facebook

## Query

We need an answer document describing Open Graph, Twitter Cards, and the
equivalent for Facebook. This is partly implemented in existing plugins, but
the implementation is unsatisfying and could be improved — for example, a
simple way to add elements to the document frontmatter that end up in
Open Graph / Twitter metadata.

## Answer

### The three vocabularies (and how they relate)

All three are `<meta>` tags in `<head>` that tell a social platform how to
render a **link-preview card** when one of your pages is shared. They overlap
heavily, and a good implementation emits them from one shared data set.

1. **Open Graph (OGP)** — `<meta property="og:*">`. The base vocabulary,
   originally from Facebook but now consumed by almost everything (Facebook,
   LinkedIn, Slack, Discord, Mastodon, Bluesky, iMessage…). **This is the
   primary one.**
2. **Twitter Cards** — `<meta name="twitter:*">`. X/Twitter's own tags. X
   *falls back to Open Graph* for most fields, so in practice you only need a
   few `twitter:*` tags (notably `twitter:card` and `twitter:site`/
   `twitter:creator`); the rest can be inherited from `og:*`.
3. **"Facebook equivalent"** — there is **no separate Facebook card
   vocabulary**; Facebook *is* the Open Graph consumer. The only genuinely
   Facebook-specific tags are `fb:app_id` and `fb:admins` (for Facebook
   Insights/admin linkage), plus the `article:*` Open Graph extension
   (`article:author`, `article:published_time`, `article:tag`) that Facebook
   defined. So "Facebook support" = good Open Graph + optionally `fb:app_id`.

#### Critical distinction: `property` vs `name`

Open Graph and Facebook tags use the **`property`** attribute; Twitter Cards
use the **`name`** attribute:

```html
<meta property="og:title"    content="Page Title" />        <!-- OG / Facebook -->
<meta name="twitter:card"    content="summary_large_image" /><!-- Twitter -->
```

This matters because **the current AkashaCMS implementation gets it wrong**
(see below): it emits `og:*` tags with `name=` instead of `property=`. Strict
OGP parsers (Facebook's debugger, LinkedIn) may ignore `name="og:…"` tags.

### A recommended, complete tag set for a blog post

```html
<!-- Open Graph (primary; also what Facebook reads) -->
<meta property="og:type"                content="article" />
<meta property="og:title"               content="Page Title" />
<meta property="og:description"         content="Short summary." />
<meta property="og:url"                 content="https://example.com/post.html" />
<meta property="og:site_name"           content="My Site" />
<meta property="og:locale"              content="en_US" />
<meta property="og:image"               content="https://example.com/img/hero.jpg" />
<meta property="og:image:alt"           content="Description of the image." />
<meta property="og:image:width"         content="1200" />
<meta property="og:image:height"        content="630" />

<!-- Open Graph article extension (Facebook-defined) -->
<meta property="article:published_time" content="2026-06-19T12:00:00+03:00" />
<meta property="article:modified_time"  content="2026-06-19T13:00:00+03:00" />
<meta property="article:author"         content="https://example.com/about" />
<meta property="article:tag"            content="metadata" />

<!-- Facebook-specific (optional) -->
<meta property="fb:app_id"              content="0000000000" />

<!-- Twitter Cards (only what doesn't fall back to OG) -->
<meta name="twitter:card"               content="summary_large_image" />
<meta name="twitter:site"               content="@mysite" />
<meta name="twitter:creator"            content="@janeauthor" />
```

Notes:
- `og:image` should be an **absolute URL**, ideally ~1200×630. Provide
  `og:image:alt` for accessibility and `:width`/`:height` so crawlers can lay
  out the card without fetching the image first.
- For non-article pages use `og:type` of `website`.
- Twitter inherits `title`/`description`/`image` from Open Graph, so the
  `twitter:*` set is intentionally small.

This is the same metadata layer referenced by the companion answers — the
[Fediverse](./activitypub-fediverse-html-elements.md) and
[Bluesky](./bluesky-atproto-integration.md) link cards are built from these
exact `og:*` tags, and the body-level
[microformats](./microformats-indieweb-for-static-blogs.md) are the in-content
complement. A single good implementation feeds all of them.

---

### What AkashaCMS does today (and why it's unsatisfying)

The current support lives in **`@akashacms/plugins-base`**, not in AkashaRender
itself. The relevant pieces:

- A large, hand-maintained head-metadata partial,
  `layouts/ak_headermeta.html.njk` (and `.ejs`/`.handlebars` siblings), which
  is ~90 lines of repetitive
  `{% if metaOGfoo %}<meta … content="{{ metaOGfoo }}"/>{% endif %}` branches
  (source: `../akashacms-base/layouts/ak_headermeta.html.njk`).
- A `fixHeaderMeta(metadata)` function and `HeaderMetatagsElement` /
  `akheadermetatags` Nunjucks extension that copy document metadata and fill a
  few defaults before rendering that partial
  (source: `../akashacms-base/index.mjs`:216-260).
- An `OpenGraphPromoteImages` Mahafunc that scans the body for images and
  injects `og:image` tags — coordinated with the AkashaRender
  [Built-in Plugin](../concepts/built-in-plugin.md), whose comments note the
  partial must run before image promotion
  (source: [lib/built-in.ts](../../lib/built-in.ts):73-75).

Concrete problems with this design:

1. **Wrong attribute for Open Graph.** The partial emits
   `<meta name='og:title' …>` etc. — Open Graph requires `property=`. Some
   tags later in the file *do* use `property=` (`og:video`, `og:audio`,
   `fb:admins`), so the file is **internally inconsistent**. Worse, the base
   plugin's own tests assert the buggy form
   (`$('head meta[name="og:title"]')`), baking the bug into the test suite
   (source: `../akashacms-base/test/index.mjs`:118-119,275).
2. **No Twitter Card support at all.** There are no `twitter:*` tags anywhere
   in the partial.
3. **No `article:*` / limited Facebook support.** No `article:published_time`,
   `article:author`, etc.; only `fb:page_id`/`fb:admins` appear, inconsistently.
4. **Verbose, per-property frontmatter keys.** Every field needs a separately
   named `metaOG*` key (`metaOGtitle`, `metaOGsite_name`,
   `metaOGstreetaddress`, …) and a matching hand-written `if` branch. Adding a
   new property means editing three template files plus the docs.
5. **Latent bugs in `fixHeaderMeta`.** It references an undefined `arg`
   (`arg.pagetitle`) in two branches, so the `metaDCtitle`/`metapagename`
   defaults would throw or misbehave if reached
   (source: `../akashacms-base/index.mjs`:235,242).
6. **No escaping discipline / no validation.** Values are interpolated
   directly; there is no central place to HTML-escape or validate (e.g. ensure
   `og:image` is absolute).

The user's instinct is correct: this is worth improving, and the most valuable
improvement is exactly the one suggested — **a simple, generic way to declare
social metadata in frontmatter** rather than dozens of bespoke keys and `if`
branches.

---

### Proposed improvement: frontmatter-driven, table-emitted metadata

The goal: an author writes a small, structured block in a document's
frontmatter, and the plugin emits correct `og:*`, `twitter:*`, `article:*`, and
`fb:*` tags — with sensible fallbacks from existing fields (title, description,
date, author) — without anyone editing a template.

#### 1. Structured frontmatter shape

Support a single `social` (or `opengraph`) object plus a generic escape hatch:

```yaml
---
title: My Post
description: A short summary.
publicationDate: 2026-06-19T12:00:00+03:00
author: https://example.com/about
tags: [metadata, opengraph]
social:
  type: article            # -> og:type
  image: /img/hero.jpg      # -> og:image (auto-absolutized)
  imageAlt: A hero image.   # -> og:image:alt
  twitterCard: summary_large_image
  twitterSite: "@mysite"
  twitterCreator: "@janeauthor"
  fbAppId: "0000000000"
  # generic escape hatch for anything not modelled:
  extra:
    - property: og:locale
      content: en_US
    - name: twitter:label1
      content: Reading time
---
```

Key ideas:

- **Strong fallbacks.** If `social.image` is absent, fall back to the
  body-image promotion already done by `OpenGraphPromoteImages`; if
  `social.type` is absent, default `article` for blog posts and `website`
  otherwise; `og:title`/`og:description` fall back to `title`/`description`;
  `article:published_time` from `publicationDate`; `article:author` from
  `author`; `article:tag` from `tags`. Most posts then need **no** `social`
  block at all.
- **The `extra` array is the generic mechanism the user asked for**: an
  arbitrary list of `{property|name, content}` pairs that pass straight
  through. This means new platform tags never require a template change.

#### 2. Emit from a data table, not a giant `if` ladder

Replace the 90-line `if`-per-property partial with a single function that builds
an **array of `{ attr, key, value }`** records from the normalized metadata, and
a tiny template loop:

```js
// pseudo-code in the plugin
function buildSocialTags(meta) {
  const tags = [];
  const og  = (k, v) => v != null && tags.push({ attr: 'property', key: k, value: v });
  const tw  = (k, v) => v != null && tags.push({ attr: 'name',     key: k, value: v });

  og('og:type',        meta.social?.type ?? (meta.isPost ? 'article' : 'website'));
  og('og:title',       meta.social?.title ?? meta.pagetitle ?? meta.title);
  og('og:description', meta.social?.description ?? meta.description);
  og('og:url',         meta.rendered_url);
  og('og:image',       absolutize(meta.social?.image, meta));
  og('og:image:alt',   meta.social?.imageAlt);
  // article:* from publicationDate/author/tags …
  tw('twitter:card',   meta.social?.twitterCard ?? 'summary_large_image');
  tw('twitter:site',   meta.social?.twitterSite);
  // pass-through escape hatch:
  for (const e of meta.social?.extra ?? []) {
    tags.push({ attr: e.property ? 'property' : 'name',
                key:  e.property ?? e.name, value: e.content });
  }
  return tags.filter(t => t.value != null);
}
```

```njk
{# one loop replaces ~90 hand-written branches #}
{% for t in socialTags %}<meta {{ t.attr }}="{{ t.key }}" content="{{ t.value | escape }}" />
{% endfor %}
```

Benefits:
- **Correct `property` vs `name`** is decided once, centrally — fixing the
  current bug for every tag at once.
- **One escaping point** (`| escape`) for all values.
- Adding a platform/field is a one-line change in `buildSocialTags`, or zero
  changes via `social.extra`.
- The three duplicated template dialects (`.njk`/`.ejs`/`.handlebars`) collapse
  to one trivial loop each, all reading the same precomputed array.

#### 3. Keep image promotion, add validation

- Retain `OpenGraphPromoteImages` as the *fallback* image source, but let an
  explicit `social.image` win.
- Add a small validation/normalization step: absolutize relative image URLs
  against `rendered_url`, warn if `og:image` is missing on an `article`, and
  optionally fill `og:image:width/height` via the existing `sharp` image
  pipeline used by the [Built-in Plugin](../concepts/built-in-plugin.md).

#### 4. Migration and compatibility

- Keep the legacy `metaOG*` keys working (map them into the new pipeline) so
  existing sites don't break, but **fix the `property=` output** and add a
  deprecation note.
- **Fix the base-plugin tests** to assert `meta[property="og:title"]`; the
  current `name=`-based assertions are encoding the bug and must change as part
  of the fix.
- Fix the `arg.pagetitle` references in `fixHeaderMeta`.

### Where this should live

Two reasonable options:

- **Improve `@akashacms/plugins-base`** in place (lowest disruption; that is
  where the partial and `fixHeaderMeta` already are).
- **Or factor a focused `@akashacms/plugins-social` (or fold into the proposed
  `plugins-fediverse`)** so Open Graph / Twitter / Facebook / Fediverse /
  Bluesky card metadata share one normalized data model — since the
  [Fediverse](./activitypub-fediverse-html-elements.md) and
  [Bluesky](./bluesky-atproto-integration.md) answers all depend on the same
  `og:*` output. A single "social metadata" source of truth is the cleanest
  long-term architecture.

### Bottom line

- **Open Graph is the core**; Facebook consumes it (only `fb:app_id`/`fb:admins`
  and `article:*` are Facebook-specific); Twitter Cards mostly fall back to OG,
  so only a few `twitter:*` tags are needed. Use `property=` for OG/FB and
  `name=` for Twitter.
- The **current `@akashacms/plugins-base` implementation** is a verbose,
  per-property `if`-ladder partial that emits OG tags with the **wrong
  attribute (`name` instead of `property`)**, has **no Twitter Cards**, weak
  Facebook/`article:*` support, and latent `fixHeaderMeta` bugs — with tests
  that encode the bug.
- The recommended fix is a **frontmatter-driven `social:` block** (plus a
  generic `extra:` pass-through) normalized into a **data table emitted by one
  template loop**, with strong fallbacks so most pages need no extra
  frontmatter — exactly the "simple way to add elements that end up in
  Open Graph / Twitter metadata" requested.

## Sources

- `../akashacms-base/layouts/ak_headermeta.html.njk`,
  `../akashacms-base/partials/ak_headermeta.html.ejs` — the current
  hand-maintained head-metadata partials; emit `og:*` with `name=`, no
  `twitter:*`, inconsistent `property=` usage. *(external source, outside the
  wiki repo)*
- `../akashacms-base/index.mjs` (lines 216-260) — `fixHeaderMeta` defaults and
  the `akheadermetatags` extension; contains the `arg.pagetitle` bug.
  *(external source)*
- `../akashacms-base/test/index.mjs` (lines 118-119, 275) — tests asserting the
  buggy `meta[name="og:*"]` form. *(external source)*
- [lib/built-in.ts](../../lib/built-in.ts) (lines 73-75) — coordination between
  the partial and `OpenGraphPromoteImages`; `mahaMetadata` registration.
- [wiki/concepts/built-in-plugin.md](../concepts/built-in-plugin.md) — metadata
  pipeline overview.

*External web standards (Open Graph Protocol, Twitter Cards, Facebook
`fb:app_id`/`article:*`) are not derived from AkashaRender source — NEEDS
VERIFICATION against the live specifications before implementation. The base
plugin behavior above was read from sibling-repo source at
`../akashacms-base/` and reflects that working copy.*

## Related Pages

- [Elements Required for ActivityPub and Fediverse Integration](./activitypub-fediverse-html-elements.md) — Fediverse link cards built from the same `og:*` tags
- [Bluesky / AT Protocol Integration and Crossover with the Fediverse](./bluesky-atproto-integration.md) — Bluesky link cards built from the same `og:*` tags
- [Useful Microformats and IndieWeb Markup for a Static Blog](./microformats-indieweb-for-static-blogs.md) — Body-level semantic complement to head metadata
- [Webmention: Purpose, Markup, Protocol, and Server Software](./webmention-protocol-and-markup.md) — `rel="webmention"` joins the same head pipeline as these `<meta>` cards
- [Built-in Plugin](../concepts/built-in-plugin.md) — `mahaMetadata` injection and image-resize pipeline
- [Plugin System](../concepts/plugin-system.md) — Where a social-metadata plugin would live

## Backlinks

- [Answer index](./README.md)
- [Webmention: Purpose, Markup, Protocol, and Server Software](./webmention-protocol-and-markup.md)
