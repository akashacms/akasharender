---
title: "oEmbed Provider Architecture for AkashaCMS"
type: architecture
Sources:
  - ../akashacms-base/index.mjs
  - lib/index.ts
  - lib/built-in.ts
Categories:
  - oembed
  - plugins-base
  - head-metadata
  - static-site-generation
date-created: 2026-06-27T19:01:07+03:00
last-updated: 2026-06-27T19:01:07+03:00
confidence: high
---

# oEmbed Provider Architecture for AkashaCMS

## Query

GitHub issue [akashacms/akasharender#36](https://github.com/akashacms/akasharender/issues/36)
asks for AkashaCMS to act as an oEmbed *provider* so that other sites can
embed a nice link to content on an AkashaCMS-built website. The research in
the issue claims it is enough to include an HTML `<link>` snippet in the
`<head>` that references a prebuilt blob of JSON or XML. The questions to
answer are: (1) is that reasoning accurate, and (2) what is the architecture
for implementing this in `@akashacms/plugins-base`, gated behind a config
flag?

## Architecture

### Is the issue's reasoning accurate?

Yes, with one important qualification.

The oEmbed specification defines **two** discovery mechanisms, and only one
of them works for a purely static site:

1. **`<link>`-based discovery** — The provider's HTML page carries
   `<link rel="alternate" type="application/json+oembed" href="...">` (and
   optionally `text/xml+oembed`) tags in its `<head>`. A consumer fetches
   the page, parses the head, finds the `<link>`, and does an HTTP `GET` on
   the `href`. The spec only requires that this GET return a well-formed
   oEmbed document with the correct `Content-Type`. **Nothing requires the
   `href` to be a dynamic script or to accept query parameters**, so a
   precomputed static file served with the right MIME type satisfies it.
   This is the mechanism the issue describes, and it is correct.

2. **Registry / endpoint-based discovery** — Some consumers do not parse the
   page HTML. Instead they match the page URL against a registered URL
   scheme and call a single endpoint such as
   `https://site/oembed?url=<page-url>&format=json`. This requires a live
   server that maps an arbitrary `?url=` parameter to the right response,
   which a static site cannot provide.

Therefore the issue's plan (precomputed JSON/XML referenced from `<head>`
`<link>` tags) is a valid, spec-compliant oEmbed provider for the
`<link>`-discovery path. The tradeoff is reduced consumer coverage: only
consumers that perform `<link>` discovery (e.g. many modern consumers) will
pick it up; registry-only consumers will not. This tradeoff is acceptable
for a static generator and should be documented.

Two further consequences of the spec:

- **JSON is required in practice; XML is optional.** The spec permits either
  format. A provider may simply not advertise the XML `<link>` and skip the
  `.xml` file. JSON should be considered the default.
- **MIME types matter.** The static files must be served as
  `application/json` and `text/xml`. This is a *deployment* concern, not a
  renderer concern — most static hosts already serve `.json` and `.xml`
  correctly, but it must be called out in documentation.
- **`type` field.** For a typical article/blog page, the oEmbed response
  `type` should be `link` (least required data) or `rich` (if embeddable
  HTML is desired). `link` is the natural default for AkashaCMS pages.

### Placement: plugins-base, not akasharender core

This feature does not belong in akasharender core. It is content/SEO-adjacent
`<head>` metadata generation, in the same family as Open Graph and Twitter
Cards, which `@akashacms/plugins-base` already handles. The plugin
(`../akashacms-base/index.mjs`) already owns:

- `<head>` metadata injection via the `ak-header-metatags` custom element
  and the `ak_headermeta.html.njk` partial (`BasePlugin.doHeaderMeta`,
  `HeaderMetatagsElement`).
- A `link rel` mechanism: `BasePlugin.addLinkRelTag` /
  `BasePlugin.doLinkRelTags`, plus the `ak-header-linkreltags` element and
  the `doLinkRelTag()` helper that emits `<link rel="..." href="..." />`.
- A canonical-URL emitter (`doCanonicalURL`) that demonstrates emitting a
  `<link>` keyed off `metadata.rendered_url`.
- A whole-site post-render pass via `onSiteRendered(config)` that already
  iterates the document cache to generate the sitemap — the exact pattern an
  oEmbed file generator would reuse.

So plugins-base provides both halves of what oEmbed needs: per-page `<head>`
injection and a post-render file-emission hook.

### Two cooperating pieces

The implementation decomposes into two responsibilities that mirror existing
plugins-base structure.

**(A) Per-page `<head>` `<link>` injection (Mahabhuta, render time).**
For each rendered HTML page, inject:

```html
<link rel="alternate" type="application/json+oembed"
  href="<oembed-json-url>" title="<page-title> oEmbed Profile" />
<link rel="alternate" type="text/xml+oembed"
  href="<oembed-xml-url>" title="<page-title> oEmbed Profile" />
```

The `type` attribute strings must be exactly `application/json+oembed` and
`text/xml+oembed`. Because the existing `doLinkRelTag()` helper only emits
`rel` and `href` (no `type`/`title`), this needs either an extended helper
or a small dedicated partial/Mahafunc. The `href` is computed from the
page's `rendered_url` / `renderPath` (the same data
`doCanonicalURL`/`generateSitemap` already use), pointing at the sibling
`.json`/`.xml` file path chosen in piece (B). The XML `<link>` is emitted
only when XML output is enabled.

**(B) Per-page oEmbed file generation (`onSiteRendered`, post-render).**
After the whole site is rendered, generate one `.json` (and optionally
`.xml`) file per HTML document. Reuse the `onSiteRendered` pattern already
present for the sitemap: iterate
`akasha.filecache.documentsCache.search({ renderpathmatch: '\\.html$' })`,
and for each document build the oEmbed payload and write it to the chosen
location under `config.renderDestination`. The post-render hook is invoked
by `Configuration.hookSiteRendered()` in core (`lib/index.ts`), which calls
`plugin.onSiteRendered(config)` on every plugin that defines it. Note that
plugins-base currently has only one `onSiteRendered` (the sitemap); adding
oEmbed means that single method must perform both jobs (guarded by their
respective flags) since a plugin exposes one `onSiteRendered`.

The oEmbed JSON payload for a `link`-type page is minimal and built from
page metadata already available in the document cache:

```json
{
  "version": "1.0",
  "type": "link",
  "title": "<page title>",
  "author_name": "<author, optional>",
  "author_url": "<author url, optional>",
  "provider_name": "<site name from config>",
  "provider_url": "<config.root_url>",
  "cache_age": 86400
}
```

The XML form is the same key/value set wrapped in an `<oembed>` root element
with PCDATA-escaped values.

### File layout and URL mapping

Two viable conventions; the implementation should pick one and document it:

- **Sibling files** — `path/to/page.html` →
  `path/to/page.oembed.json` / `path/to/page.oembed.xml`. Simplest;
  the `href` is the page URL with the extension swapped.
- **Mirror subtree** — `/oembed/path/to/page.json` (as in the referenced
  static-site article and iamcal/oembed#144). Keeps oEmbed artifacts in one
  place; the `href` prefixes the page path with `/oembed/`.

Either way the URL written into the `<link href>` and the filesystem path
written under `config.renderDestination` must be derived from the **same**
mapping function to stay consistent. The existing sitemap code shows the
canonical way to turn a `doc.renderPath` into an absolute URL via
`new URL(config.root_url)` with `pathname = doc.renderPath`.

### Configuration flag

The feature must be switchable via a config-file flag, following the
existing `generateSitemap(config, doit)` pattern in plugins-base, which sets
`this.options.generateSitemapFlag` and is checked at the top of
`onSiteRendered`. The proposed surface mirrors this:

- A `generateOEmbed(config, doit)` (or option) method/flag stored on
  `this.options`, checked both in `onSiteRendered` (skip file generation
  when off) and in the per-page `<head>` injection Mahafunc (skip `<link>`
  emission when off).
- Sub-options for: whether to emit XML in addition to JSON, the
  `provider_name`, default `cache_age`, the file-layout convention, and the
  oEmbed `type` (`link` vs `rich`).

When the flag is off, neither the `<link>` tags nor the files are produced,
matching the issue's requirement that the feature be turned on or off with a
config-file flag.

### Escaping and correctness notes

- JSON output must be UTF-8 and produced via `JSON.stringify` (no manual
  string building).
- XML values must be PCDATA-escaped. plugins-base already contains an
  `escapeHtmlAttr()` helper and uses `mahabhuta.parse(...).html()` for safe
  serialization; an analogous escape must be applied to XML text content
  (`&`, `<`, `>` at minimum).
- The `<link>` `href` and `title` attribute values must be HTML-attribute
  escaped exactly as the existing `escapeHtmlAttr()` does, to stay
  equivalent to parser-built markup.

### Summary of the design

| Concern | Mechanism | Existing analog in plugins-base |
| --- | --- | --- |
| `<head>` `<link>` injection | Mahabhuta custom element + partial | `LinkRelTagsElement` / `doCanonicalURL` |
| Per-page file generation | `onSiteRendered` document-cache scan + file write | sitemap generation in `onSiteRendered` |
| On/off control | `this.options` flag checked in both places | `generateSitemapFlag` |
| Payload source data | `documentsCache` document metadata | sitemap `renderPath`/`stat` usage |

The conclusion: the issue's reasoning is accurate for `<link>`-based
discovery, this belongs in `@akashacms/plugins-base`, it cleanly reuses the
plugin's existing head-injection and `onSiteRendered` patterns, and it is
gated by a config flag in the same style as the sitemap generator.

## Sources

- [`../akashacms-base/index.mjs`](../../akashacms-base/index.mjs) — `BasePlugin`: `doHeaderMeta`, `addLinkRelTag`/`doLinkRelTags`, `doLinkRelTag()`, `doCanonicalURL`, `generateSitemap`, `onSiteRendered`, `escapeHtmlAttr`, and the `ak_headermeta.html.njk` partial.
- [`lib/index.ts`](../../lib/index.ts) — `Configuration.hookSiteRendered()` invoking `plugin.onSiteRendered(config)` (post-render hook dispatch).
- [`lib/built-in.ts`](../../lib/built-in.ts) — example of a core `onSiteRendered` implementation.
- oEmbed specification, <https://oembed.com/> §2.3 (response formats), §4 (Discovery).
- GitHub issue [akashacms/akasharender#36](https://github.com/akashacms/akasharender/issues/36) and referenced [iamcal/oembed#144](https://github.com/iamcal/oembed/issues/144).

## Related Pages

- [oEmbed Provider Implementation Guide for plugins-base](../implementation/oembed-provider.md) — the concrete coding plan that implements this architecture.
- [Sitemap Validation Architecture](./sitemap-validation.md) — also built on `onSiteRendered` document-cache scanning in plugins-base.
- [Webmention: Purpose, Markup, Protocol, and Server Software](../answers/webmention-protocol-and-markup.md) — another build-time `<head>`-discovery + static-artifact protocol for AkashaCMS.
- [Architecture index](./README.md)

## Backlinks

- [oEmbed Provider Implementation Guide for plugins-base](../implementation/oembed-provider.md)
- [Architecture index](./README.md)
