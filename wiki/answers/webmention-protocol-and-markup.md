---
title: "Webmention: Purpose, Markup, Protocol, and Server Software"
type: answer
Sources:
  - wiki/answers/microformats-indieweb-for-static-blogs.md
  - wiki/answers/activitypub-fediverse-html-elements.md
  - wiki/concepts/built-in-plugin.md
Categories:
  - webmention
  - indieweb
  - microformats
  - protocols
  - feature-design
date-created: 2026-06-19T17:30:00+03:00
last-updated: 2026-06-19T17:30:00+03:00
confidence: medium
---

# Webmention: Purpose, Markup, Protocol, and Server Software

## Query

The microformats writeup mentioned Webmention. We need an answer document
describing Webmention and its purpose, the markup for it, and the server-side
software and protocols that go with Webmention.

## Answer

### What Webmention is and why it exists

**Webmention** is a [W3C Recommendation](https://www.w3.org/TR/webmention/)
(2017) that lets one website notify another that it has linked to it — a
**decentralized, cross-site `@mention`/comment/like notification**. It is the
IndieWeb's open replacement for the old, proprietary **Pingback** protocol
(and conceptually for the comment/like notifications you'd get inside a closed
social network).

The purpose: if Alice writes a post on her site that links to Bob's post, Alice's
site sends a Webmention to Bob's site saying "this URL of mine links to this URL
of yours." Bob's site can then **display Alice's post as a comment, reply, like,
repost, or bookmark** under his original. This rebuilds social interaction —
replies, likes, reposts — **on top of plain web pages the authors own**, with no
central platform. Combined with **POSSE** (Publish on your Own Site, Syndicate
Elsewhere) and **microformats**, it is the backbone of the
[IndieWeb](./microformats-indieweb-for-static-blogs.md) model.

Two ideas distinguish it from Fediverse/ActivityPub:
- Webmention is **link-driven and page-centric**: the unit is "URL X mentions
  URL Y," verified by actually fetching X and confirming the link. There is no
  account/follow graph and no signing.
- It is **complementary** to ActivityPub rather than competing — many IndieWeb
  sites do both. (See the [Fediverse answer](./activitypub-fediverse-html-elements.md).)

It is a strict two-role protocol:
- The **source** is the page that contains the link (Alice's post).
- The **target** is the page being linked to (Bob's post).
- A Webmention is an HTTP `POST` from a sender (acting for the source) to the
  target's **Webmention endpoint**.

---

### The markup (how a page advertises and participates)

Webmention itself needs only **one** piece of markup to *receive* mentions, and
relies on **microformats2** to make the received mentions meaningful.

#### 1. Declaring a receiving endpoint (required to receive)

A page (or its server) advertises where Webmentions should be sent. Either an
HTTP `Link` header **or** an HTML element is acceptable; the spec says discovery
checks the HTTP header first, then `<link>`, then `<a>`:

```html
<!-- in <head> (or anywhere in the body) -->
<link rel="webmention" href="https://example.com/webmention" />
```

```http
# equivalent HTTP header
Link: <https://example.com/webmention>; rel="webmention"
```

`href` may be a relative or absolute URL, and may even be empty (meaning "this
same URL is the endpoint"). For a static site the endpoint usually points at a
**third-party service or a small script** (see server software below). This is
the single tag a static AkashaCMS site must emit to start receiving.

#### 2. Marking up *sent* mentions (so the receiver can classify them)

When your page is the **source**, the kind of response it represents is encoded
with **microformats2** properties inside an `h-entry` — the same vocabulary from
the [microformats answer](./microformats-indieweb-for-static-blogs.md):

```html
<article class="h-entry">
  <a class="u-in-reply-to" href="https://bob.example/post/123">replying to Bob</a>
  <a class="u-like-of"     href="https://bob.example/post/123">liked</a>
  <a class="u-repost-of"   href="https://bob.example/post/123">reposted</a>
  <a class="u-bookmark-of" href="https://bob.example/post/123">bookmarked</a>
  <div class="e-content">My actual reply text…</div>
  <a class="u-author h-card" href="https://alice.example/">Alice</a>
</article>
```

The receiver fetches your source page, finds the link to its target, and reads
these `u-*` properties to decide whether to show your mention as a **reply**,
**like**, **repost**, or **bookmark**, and uses `h-card`/`e-content` to render
the author and text. **No special markup is needed to merely send** a plain
mention — any `<a href>` to the target counts; the microformats only add
*meaning*.

#### 3. Displaying received mentions

To show received mentions under a post, the page needs server-side or
build-time data (the stored mentions) rendered into HTML — typically a
"Responses" / "Likes" / "Reposts" section. There is no required markup for this;
it is just whatever your template produces from the stored Webmention data.

---

### The protocol (step by step)

The full flow has a **sending** half and a **receiving** half.

**Sending (source → target):**

1. **Author publishes** a post containing a link to the target URL.
2. **Endpoint discovery**: the sender fetches the target URL and looks, in
   order, for a `rel="webmention"` in the HTTP `Link` header, then a
   `<link rel="webmention">`, then an `<a rel="webmention">`. The first match
   is the target's Webmention endpoint.
3. **Notification**: the sender makes an HTTP `POST` to that endpoint with
   `Content-Type: application/x-www-form-urlencoded` and two parameters:

   ```http
   POST /webmention HTTP/1.1
   Host: bob.example
   Content-Type: application/x-www-form-urlencoded

   source=https://alice.example/my-post&target=https://bob.example/post/123
   ```

4. The endpoint responds `201 Created` / `202 Accepted` (often with a
   `Location` header to a status URL) if it will process the mention
   asynchronously, or `400`/`4xx` on error.

**Receiving / verification (target side):**

5. The receiver **validates the request** parameters (`source` and `target`
   present, `target` is a real page it owns, `source != target`).
6. **Verification**: the receiver **fetches the `source` URL** and confirms it
   **actually contains a link to `target`**. This fetch is the heart of the
   protocol's anti-spam design — a sender cannot fabricate a mention without a
   real, publicly fetchable page that links to you.
7. The receiver typically **parses the source with microformats2** to extract
   the author (`h-card`), content (`e-content`), and response type
   (`u-in-reply-to`/`u-like-of`/…), then **stores** the mention.
8. **Updates and deletes**: if the source later changes, a new Webmention for
   the same `source`/`target` re-verifies and updates the stored entry; if the
   source removes the link or returns 410, the receiver removes the mention.
9. The stored mentions are then **displayed** under the target post (often via a
   read API like a JSON feed of mentions).

Security/spam notes the receiver must handle: only fetch over HTTP(S), guard
against SSRF (don't let `target` point at internal addresses), rate-limit, and
treat source content as untrusted HTML (sanitize before display).

---

### Server-side software and services

Because verification requires **receiving an HTTP `POST` and fetching the
source page**, a purely static site **cannot receive Webmentions by itself** —
exactly the same dynamic-surface limitation discussed for the Fediverse inbox in
the [Fediverse answer](./activitypub-fediverse-html-elements.md). There are
three practical patterns:

**A. Hosted/SaaS Webmention service (lowest effort, recommended for static):**

- **[Webmention.io](https://webmention.io)** — the dominant hosted receiver
  (by Aaron Parecki). You authenticate your domain (via `rel="me"`/IndieAuth),
  point `rel="webmention"` at its endpoint, and read your mentions back through
  its JSON API. The static site's only job is to emit the `rel="webmention"`
  link and, at build time or in the browser, pull mentions from the API.
- **[webmention.app](https://webmention.app)** and **Telegraph** — hosted
  *sending* services that scan your post for outbound links and send the
  Webmentions for you (solving the sending half without your own sender).
- **[Bridgy](https://brid.gy)** — bridges silo interactions (and, via Bridgy
  Fed, the Fediverse) into Webmentions, so likes/replies from those networks
  show up as mentions on your site.

**B. Self-hosted receiver (own the data, needs a runtime):**

- **[webmention-tools / "webmention" CLI and libraries]** and small endpoint
  implementations exist in most languages. On the **shared-hosting + PHP**
  target common for AkashaCMS sites, a **PHP receiver** is the natural fit —
  the same "PHP shim on shared hosting" approach described in the
  [Fediverse answer](./activitypub-fediverse-html-elements.md). A PHP endpoint
  would: accept the `POST`, validate, fetch+verify the source, parse it with a
  microformats2 parser (e.g. `php-mf2`), and append the mention to a JSON/SQLite
  store the build can read.
- Node options include the `webmention` family of packages and
  `@remy/webmention` (a popular **sender**), plus `microformats-parser` for the
  verification/parsing step if you build a receiver.

**C. Build-time integration (the static-site sweet spot):**

- A common static-site pattern: **receive** via Webmention.io (hosted), then at
  **build time fetch the mentions JSON** for each page and render a "Responses"
  section into the HTML. Tools like **`webmention.io` + a fetch step** (e.g.
  the approach popularized by `eleventy` plugins such as
  `eleventy-plugin-webmentions`) show the model; AkashaRender could do the
  same during render. **Send** via webmention.app or a Node sender invoked
  after deploy.

---

### How this maps onto AkashaCMS

A pragmatic, tiered design that mirrors the Fediverse/Bluesky answers (shared
identity and the same "static-first + optional dynamic shim" philosophy):

1. **Emit `rel="webmention"`** in the document `<head>` (a one-line addition to
   the head-metadata templates, alongside the Open Graph work in the
   [Built-in Plugin](../concepts/built-in-plugin.md) metadata pipeline). Point
   it at Webmention.io initially.
2. **Emit response microformats** (`u-in-reply-to`, `u-like-of`, etc.) from
   frontmatter when a post is itself a reply/like — a small extension of the
   `h-entry` work in the [microformats answer](./microformats-indieweb-for-static-blogs.md).
3. **Build-time mention fetch + render**: during render, fetch each page's
   mentions from the Webmention.io API and render a "Responses" partial.
   Cache results so builds stay fast (a natural fit for AkashaRender's
   SQLite cache).
4. **Sending**: integrate a Node sender (e.g. `@remy/webmention`) as a
   post-deploy step, or delegate to webmention.app.
5. **(Optional) self-hosted PHP receiver** for owners who want to own the data,
   reusing the shared-hosting PHP approach; store mentions where the build can
   read them.

This keeps the site static-first: the only hard dynamic requirement (receiving
POSTs) is satisfied by a hosted service or an optional PHP script, while the
markup, fetching, and display are build artifacts.

### Bottom line

- **Webmention** is a W3C protocol for **cross-site reply/like/repost
  notifications** — the open, decentralized successor to Pingback and the social
  layer of the IndieWeb.
- **Markup**: one `rel="webmention"` link to *receive*; **microformats2**
  `u-in-reply-to`/`u-like-of`/`u-repost-of`/`h-card`/`e-content` to give *sent*
  mentions meaning; no required markup to send a plain mention.
- **Protocol**: sender discovers the endpoint, `POST`s `source`+`target`; the
  receiver **fetches the source and verifies it really links to the target**,
  then parses, stores, and displays it.
- **Server software**: a static site can't receive on its own. Use **hosted
  services** (Webmention.io to receive, webmention.app/Telegraph to send,
  Bridgy to bridge silos/Fediverse), or a **self-hosted receiver** (a PHP
  endpoint on shared hosting fits AkashaCMS deployments). The static-site sweet
  spot is **receive via a hosted endpoint + fetch and render mentions at build
  time**.

## Sources

- [wiki/answers/microformats-indieweb-for-static-blogs.md](./microformats-indieweb-for-static-blogs.md)
  — The microformats2 vocabulary (`h-entry`, `u-in-reply-to`, `u-like-of`,
  `h-card`, `e-content`) Webmention relies on for classifying mentions.
- [wiki/answers/activitypub-fediverse-html-elements.md](./activitypub-fediverse-html-elements.md)
  — The shared-hosting PHP-shim pattern reused for a self-hosted receiver, and
  the complementary relationship with ActivityPub.
- [wiki/concepts/built-in-plugin.md](../concepts/built-in-plugin.md) — The
  metadata/head-injection and caching pipeline a Webmention plugin would extend.

*The Webmention specification, microformats2, and the named external services
(Webmention.io, webmention.app, Telegraph, Bridgy) and libraries
(`@remy/webmention`, `php-mf2`, `microformats-parser`) are external
standards/projects and are not derived from AkashaRender source — NEEDS
VERIFICATION against the live specifications and project sources before
implementation.*

## Related Pages

- [Useful Microformats and IndieWeb Markup for a Static Blog](./microformats-indieweb-for-static-blogs.md) — The microformats2 markup Webmention classifies; companion IndieWeb answer
- [Elements Required for ActivityPub and Fediverse Integration](./activitypub-fediverse-html-elements.md) — Complementary federation model; shared shared-hosting PHP-shim approach for the receiver
- [Bluesky / AT Protocol Integration and Crossover with the Fediverse](./bluesky-atproto-integration.md) — Another social-presence answer; Bridgy can feed silo/Fediverse interactions into Webmentions
- [Social-Sharing Metadata: Open Graph, Twitter Cards, and Facebook](./social-sharing-metadata-opengraph-twitter-facebook.md) — Head `<meta>` cards; Webmention `rel="webmention"` joins the same head pipeline
- [Built-in Plugin](../concepts/built-in-plugin.md) — Metadata injection and caching pipeline a Webmention plugin would extend
- [Plugin System](../concepts/plugin-system.md) — How a Webmention plugin would extend AkashaRender

## Backlinks

- [Answer index](./README.md)
