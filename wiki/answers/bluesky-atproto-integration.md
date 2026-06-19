---
title: "Bluesky / AT Protocol Integration and Crossover with the Fediverse"
type: answer
Sources:
  - lib/built-in.ts
  - wiki/concepts/built-in-plugin.md
  - wiki/answers/activitypub-fediverse-html-elements.md
Categories:
  - bluesky
  - atproto
  - fediverse
  - metadata
  - open-graph
  - feature-design
date-created: 2026-06-19T14:30:00+03:00
last-updated: 2026-06-19T17:30:00+03:00
confidence: medium
---

# Bluesky / AT Protocol Integration and Crossover with the Fediverse

## Query

"Is there any crossover between Fediverse and Bluesky? Can Bluesky query
something from an AkashaCMS site for some useful integration? Rather, how
should an AkashaCMS website present itself to Bluesky?"

## Answer

### Short version

- **Bluesky and the Fediverse are different networks on different protocols.**
  The Fediverse (Mastodon, etc.) speaks **ActivityPub**; Bluesky speaks the
  **AT Protocol (atproto)**. They do **not** federate with each other natively.
- **Crossover exists only through bridges**, most notably **Bridgy Fed**, which
  relays posts/follows between an ActivityPub identity and a Bluesky identity.
  There is no built-in protocol interoperability.
- **Bluesky does not "query" a website for content** the way an RSS reader or
  an ActivityPub server pulls an outbox. Bluesky's content lives inside
  atproto repositories on PDS servers, not on your website. The two genuine,
  static-site-friendly integration points are:
  1. **Link-preview cards** — when someone posts your URL into Bluesky, its
     crawler reads your **Open Graph** tags to build the embed card. This is
     the same metadata layer described for the Fediverse.
  2. **Domain-as-handle verification** — Bluesky lets a user adopt their own
     domain (e.g. `@example.com`) as their Bluesky handle, proven by a file or
     DNS record the site controls. This is the one place a static AkashaCMS
     site can serve something Bluesky actively fetches.

So: AkashaCMS cannot make a site "be on Bluesky," but it can (a) make shared
links look good on Bluesky via Open Graph, and (b) host the verification
artifact that lets the site's owner use the domain as their Bluesky handle.

---

### Is there crossover between the Fediverse and Bluesky?

Not at the protocol level. The two networks were designed independently:

| | Fediverse | Bluesky |
|---|---|---|
| Protocol | ActivityPub (W3C) | AT Protocol / atproto |
| Identity | `@user@server` (WebFinger) | `did:plc:…` with a domain handle |
| Data model | ActivityStreams JSON-LD | Lexicon records in a repo (CBOR/JSON) |
| Content location | Each server's actor/outbox | A Personal Data Server (PDS) repo |
| Discovery | WebFinger, NodeInfo | DNS `_atproto` TXT / `/.well-known/atproto-did`, PLC directory |

A Mastodon server cannot follow a Bluesky account directly, and vice versa.
The practical crossover is achieved by **bridges**:

- **Bridgy Fed** — the dominant bridge. It can give an ActivityPub account a
  Bluesky-side presence (and the reverse), so a follow/post on one side is
  mirrored to the other. It works at the **account** level, not the website
  level, and it is an external hosted service the user opts into. (This is the
  same project mentioned as the zero-server federation option in the
  [Fediverse answer](./activitypub-fediverse-html-elements.md).)

For an AkashaCMS site the takeaway is: if the owner wants their content visible
on *both* networks, the cleanest path is to publish to one network identity and
let a bridge mirror it — not to implement two protocols in the site itself.

---

### Can Bluesky query something from an AkashaCMS site?

Mostly no, with one important exception.

Bluesky's architecture keeps user content in **atproto repositories** hosted on
**PDS** (Personal Data Server) instances, indexed by **App Views** (the
relay/AppView that powers the `bsky.app` timeline). The network does **not**
crawl arbitrary websites for posts, and there is no equivalent of an
ActivityPub `outbox` that Bluesky will pull from your site. A static website is
simply not a participant in the atproto data flow.

The two things Bluesky *does* fetch from an arbitrary domain:

1. **Open Graph metadata** for a URL that a user pastes into a post (to render
   the embed card). This is a one-off fetch of your HTML `<head>`.
2. **A handle-verification artifact** — *only if* the domain owner has chosen
   to use that domain as their Bluesky handle (details below).

Both are static-friendly and are the right targets for an AkashaCMS plugin.

---

### How should an AkashaCMS website present itself to Bluesky?

Two mechanisms, in priority order.

#### 1. Link-preview cards via Open Graph (highest value, pure static)

When a Bluesky user posts a link to your page, Bluesky's link-card service
fetches the page and reads **Open Graph** tags to build the embed (title,
description, thumbnail). Bluesky primarily honours the standard `og:*`
properties — the *same tags* already covered for the Fediverse, so a single
metadata implementation serves both networks:

```html
<meta property="og:title"       content="Page Title" />
<meta property="og:description" content="Short summary of the page." />
<meta property="og:image"       content="https://example.com/img/hero.jpg" />
<meta property="og:url"         content="https://example.com/page.html" />
<meta property="og:type"        content="article" />
```

Notes specific to Bluesky:

- Bluesky reads **Open Graph**; it does **not** use a `fediverse:creator`-style
  attribution tag, and there is no Bluesky-specific `<meta>` card tag analogous
  to `twitter:card`. Providing good `og:image`, `og:title`, and
  `og:description` is the whole job.
- The thumbnail comes from `og:image`; ensure it is an **absolute URL** and a
  reasonable size, because the card service fetches it directly.
- This is exactly the Tier 1 work in the
  [Fediverse answer](./activitypub-fediverse-html-elements.md), already aligned
  with how the [Built-in Plugin](../concepts/built-in-plugin.md) injects
  `<head>` metadata via `mahaMetadata`
  (source: [lib/built-in.ts](../../lib/built-in.ts):80). **No extra work beyond
  good Open Graph is required for nice Bluesky cards.**

#### 2. Domain handle verification (the one artifact Bluesky fetches)

Bluesky lets a person replace the default `user.bsky.social` handle with a
domain they control, e.g. `@example.com` or `@me.example.com`. This is verified
by serving something at the domain, which a static AkashaCMS site is perfectly
positioned to do. There are **two** supported methods; the site owner picks
one:

- **`/.well-known/atproto-did` file (HTTP method).** Serve a file at
  `https://example.com/.well-known/atproto-did` whose body is exactly the
  account's DID (e.g. `did:plc:abcd1234…`), with `Content-Type: text/plain`
  and no surrounding whitespace/markup. An AkashaCMS build can emit this file
  directly into the output tree (it is a plain text asset), making this method
  ideal for a generator.

  ```text
  did:plc: exampleexampleexampleexample
  ```

- **`_atproto` DNS TXT record (DNS method).** Add a TXT record at
  `_atproto.example.com` with the value `did=did:plc:abcd1234…`. This lives in
  DNS, not in the site output, so AkashaCMS cannot generate it — but the plugin
  should *document* it as the alternative for subdomain or host-restricted
  cases.

Once verified, the domain becomes the user's Bluesky handle and the profile
shows the domain as a (soft) proof of identity. This is genuinely useful
"presenting to Bluesky": the website and the Bluesky account share an identity.

**Important nuance:** the `/.well-known/atproto-did` method publishes the
account's DID on the domain. That is intended and safe (the DID is public), but
it does tie the public site to that Bluesky account. Only generate it when the
owner has supplied their DID in configuration.

#### 3. (Optional, advanced) Verified backlinks / verification records

Bluesky has been evolving "verification" features where organizations vouch for
accounts, and where a website link on a profile can be cross-checked. The
durable, static-site-friendly piece an AkashaCMS site can offer is simply a
**clear, stable profile/about page** that links to the Bluesky profile, plus the
domain-handle verification above. Anything deeper (issuing verification
records) requires atproto repo writes and is **out of scope for a static site**
— it belongs to a PDS/account, not a website. *NEEDS VERIFICATION* — Bluesky's
verification surface is changing and should be checked against current docs
before building on it.

---

### Recommended approach for an AkashaCMS plugin

A pragmatic, low-surface design — ideally folded into the same plugin discussed
in the [Fediverse answer](./activitypub-fediverse-html-elements.md), since the
metadata layer is shared:

1. **Reuse Open Graph (no new code path).** The good `og:*` tags emitted for
   the Fediverse already produce correct Bluesky cards. Just confirm `og:image`
   is an absolute URL.
2. **Add a configuration option for the Bluesky handle/DID**, e.g.
   `blueskyHandle: 'example.com'` and `blueskyDID: 'did:plc:…'`.
3. **Generate `/.well-known/atproto-did`** into the output during
   render/`copyAssets` when a DID is configured (a one-line text asset).
4. **Document the `_atproto` DNS TXT alternative** for hosts/subdomains where
   the file method is awkward.
5. **Optionally add a profile/about partial** that links to the Bluesky account
   (and the Fediverse account), giving readers a human-visible cross-link.
6. **Do not attempt protocol-level Bluesky federation.** If the owner wants
   genuine cross-network presence, recommend a **bridge (Bridgy Fed)** at the
   account level rather than implementing atproto in the site.

### Bottom line

- Fediverse and Bluesky are **separate protocols** (ActivityPub vs atproto)
  that only cross over through **bridges** like Bridgy Fed.
- Bluesky does **not** crawl a site for content; it fetches **Open Graph** for
  link cards and, *if the owner opts in*, a **domain-handle verification**
  artifact.
- An AkashaCMS site presents itself well to Bluesky by (1) emitting good Open
  Graph (already shared with the Fediverse work) and (2) optionally generating
  `/.well-known/atproto-did` so the domain can serve as the owner's Bluesky
  handle. Everything beyond that belongs to a Bluesky account/PDS or a bridge,
  not to the static site.

*AT Protocol details (atproto, PDS, DID/PLC, `/.well-known/atproto-did`,
`_atproto` DNS TXT, Open Graph card behavior, Bridgy Fed, and Bluesky's
evolving verification features) are external standards/services and are not
derived from AkashaRender source — NEEDS VERIFICATION against the live
specifications before implementation.*

## Sources

- [lib/built-in.ts](../../lib/built-in.ts) — Built-in plugin registers
  `mahaMetadata` for `<head>` metadata and Open Graph injection (lines 32, 80),
  the shared metadata layer that also drives Bluesky link cards.
- [wiki/concepts/built-in-plugin.md](../concepts/built-in-plugin.md) — Metadata
  handling responsibilities of the Built-in Plugin.
- [wiki/answers/activitypub-fediverse-html-elements.md](./activitypub-fediverse-html-elements.md)
  — Companion answer on Fediverse/ActivityPub; the Open Graph metadata and the
  `/.well-known/` artifact-generation patterns are shared.

## Related Pages

- [Elements Required for ActivityPub and Fediverse Integration](./activitypub-fediverse-html-elements.md) — Companion Fediverse answer; shared Open Graph and discovery-artifact design
- [Useful Microformats and IndieWeb Markup for a Static Blog](./microformats-indieweb-for-static-blogs.md) — Companion answer; body-level semantic markup and `rel="me"` identity that complements domain-handle verification
- [Social-Sharing Metadata: Open Graph, Twitter Cards, and Facebook](./social-sharing-metadata-opengraph-twitter-facebook.md) — The shared `og:*` head metadata that drives Bluesky link cards
- [Webmention: Purpose, Markup, Protocol, and Server Software](./webmention-protocol-and-markup.md) — IndieWeb interaction protocol; Bridgy can feed silo/Fediverse interactions into Webmentions
- [Built-in Plugin](../concepts/built-in-plugin.md) — Metadata and Open Graph injection pipeline
- [Plugin System](../concepts/plugin-system.md) — How a Bluesky/Fediverse plugin would extend AkashaRender
- [Site Rendering](../concepts/site-rendering.md) — Where the `/.well-known/atproto-did` artifact would be emitted during a build

## Backlinks

- [Answer index](./README.md)
- [Useful Microformats and IndieWeb Markup for a Static Blog](./microformats-indieweb-for-static-blogs.md)
- [Social-Sharing Metadata: Open Graph, Twitter Cards, and Facebook](./social-sharing-metadata-opengraph-twitter-facebook.md)
- [Webmention: Purpose, Markup, Protocol, and Server Software](./webmention-protocol-and-markup.md)
