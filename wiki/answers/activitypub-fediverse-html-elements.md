---
title: "Elements Required for ActivityPub and Fediverse Integration"
type: answer
Sources:
  - lib/built-in.ts
  - wiki/concepts/built-in-plugin.md
Categories:
  - activitypub
  - fediverse
  - metadata
  - open-graph
  - feature-design
  - webfinger
  - php-hosting
date-created: 2026-06-19T12:00:00+03:00
last-updated: 2026-06-19T14:30:00+03:00
confidence: medium
---

# Elements Required for ActivityPub and Fediverse Integration

## Query

"Do you understand the HTML schema tags required for ActivityPub and the
Fediverse? I want to provide an implementation within the AkashaCMS ecosphere.
At the moment, I need an outline of elements required for ActivityPub and
Fediverse integration."

## Answer

### Important framing: there is no "HTML schema" for ActivityPub

The single most important thing to get right before designing a feature is
this: **ActivityPub is not an HTML-tag standard.** It is a
[W3C](https://www.w3.org/TR/activitypub/) protocol built on **JSON-LD**
documents exchanged over **HTTP**, using the
[ActivityStreams 2.0](https://www.w3.org/TR/activitystreams-core/) vocabulary.
The Fediverse (Mastodon, Pleroma, Misskey, PeerTube, Lemmy, etc.) is the
network of servers that speak this protocol plus the discovery protocols
around it.

The implication for a **static site generator** such as AkashaRender is
crucial:

- Static **files alone** cannot be a fully-fledged ActivityPub actor.
  True ActivityPub requires something that accepts HTTP `POST` requests to an
  actor's `inbox`, signs outgoing activities with HTTP Signatures, and serves
  `Content-Type: application/activity+json` negotiated responses. A pile of
  static files on GitHub Pages cannot do that by itself.
- **However, the typical hosting target matters.** Static AkashaCMS sites are
  commonly deployed to **shared hosting where PHP is available**. A few small
  PHP scripts can supply exactly the dynamic shim that static files lack
  (WebFinger query handling, content negotiation, an inbox), so a "static-first
  + thin PHP" site *can* federate. The pure "cannot" only applies to hosts with
  no server-side scripting at all (e.g. GitHub Pages). See the PHP discussions
  in Tiers 2–4.
- What the generator **can** do regardless is produce the **static discovery
  artifacts and HTML metadata** that make its content *Fediverse-friendly*:
  correctly attributed, richly previewed when shared, discoverable via
  WebFinger, and wired either to PHP shim scripts or to an external service.

So the realistic feature target inside the AkashaCMS ecosphere is "**Fediverse
integration / publishing**," delivered in tiers. The sections below give the
outline of elements required, separated by what is genuine HTML and what is
the surrounding protocol plumbing.

This work is a strong fit for a plugin (e.g. a hypothetical
`@akashacms/plugins-fediverse`) layered on the metadata pipeline that the
[Built-in Plugin](../concepts/built-in-plugin.md) already provides, where
`mahaMetadata` already injects `<head>` metadata and Open Graph tags
(source: [lib/built-in.ts](../../lib/built-in.ts):32,80).

---

### Tier 1 — HTML `<head>` metadata (the "HTML schema tags" part)

These are the actual HTML elements that influence how Fediverse servers render
a **link preview / unfurled card** when one of your pages is posted into a
toot or note. Mastodon and most Fediverse software read **Open Graph** and
**Twitter Card** meta tags (it uses the `oEmbed`/OpenGraph crawler), not a
bespoke ActivityPub HTML vocabulary.

**Open Graph (primary — what Mastodon's card generator reads):**

```html
<meta property="og:type"        content="article" />
<meta property="og:title"       content="Page Title" />
<meta property="og:description" content="Short summary of the page." />
<meta property="og:url"         content="https://example.com/page.html" />
<meta property="og:image"       content="https://example.com/img/hero.jpg" />
<meta property="og:image:alt"   content="Description of the image." />
<meta property="og:site_name"   content="My Site" />
<meta property="og:locale"      content="en_US" />
```

**Article-specific Open Graph (for blog posts):**

```html
<meta property="article:published_time" content="2026-06-19T12:00:00+03:00" />
<meta property="article:modified_time"  content="2026-06-19T12:30:00+03:00" />
<meta property="article:author"         content="https://example.com/about" />
<meta property="article:tag"            content="fediverse" />
```

**Twitter Card (fallback consumed by some clients):**

```html
<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:title"       content="Page Title" />
<meta name="twitter:description" content="Short summary of the page." />
<meta name="twitter:image"       content="https://example.com/img/hero.jpg" />
```

**The Mastodon author-attribution tag (Fediverse-specific HTML):** Mastodon
(v4.3+) reads a `fediverse:creator` meta tag and turns the link card into a
byline that links to the author's Fediverse account:

```html
<meta name="fediverse:creator" content="@username@mastodon.social" />
```

This is the closest thing to an "ActivityPub HTML tag" that exists, and it is a
de-facto convention rather than a W3C standard.

**Standard `<head>` hygiene that helps:**

```html
<link rel="canonical" href="https://example.com/page.html" />
<title>Page Title</title>
<meta name="description" content="Short summary of the page." />
```

AkashaRender already owns this layer: the
[Built-in Plugin](../concepts/built-in-plugin.md) wires up `mahaMetadata` for
title/description/Open Graph handling
(source: [lib/built-in.ts](../../lib/built-in.ts):80), and the
`@akashacms/plugins-base` plugin is where most Open Graph emission lives in
practice. A Fediverse plugin should *extend* this rather than re-implement it.

---

### Tier 2 — Discovery endpoints (static files, not HTML)

To be **discoverable** by Fediverse software, the site must answer a few
well-known HTTP lookups. With a static generator these become generated files
placed at fixed paths (and may require host config for content-types):

- **WebFinger** — `/.well-known/webfinger?resource=acct:user@domain`
  Returns JSON-LD mapping an `acct:` address to the actor's profile URL. This
  is what lets someone type `@you@yourdomain` into a Mastodon search box and
  find you. A static site can serve a precomputed JSON file, though most hosts
  need rewrite rules to honour the `?resource=` query.

- **NodeInfo** — `/.well-known/nodeinfo` plus the linked
  `/nodeinfo/2.1` document, describing the "node" (software name, version,
  open-registration flag). Optional but commonly probed.

- **host-meta** — `/.well-known/host-meta` (XRD/XML), an older discovery
  fallback pointing at the WebFinger template.

These are emitted as **build artifacts**, ideally by a plugin that writes them
into the output tree during `copyAssets` / render.

#### Shared hosting reality: PHP is almost always available

A typical deployment target for a static AkashaCMS site is **shared hosting**
(cPanel / Apache, or equivalent), where **PHP is essentially always present**.
This materially changes what Tier 2 can do, and it softens the "pure static"
limitation that runs through this document. The two hard problems for static
discovery are both solvable with a few lines of PHP:

1. **The WebFinger query string.** WebFinger is requested as
   `GET /.well-known/webfinger?resource=acct:user@domain`. A plain static file
   cannot vary its response based on the `?resource=` query parameter, and many
   static hosts will not even serve a file literally named `webfinger` with the
   right `Content-Type`. A tiny PHP script handles both: it reads
   `$_GET['resource']`, validates it against the configured account(s), sets
   `Content-Type: application/jrd+json`, and echoes the JRD JSON.

2. **Content negotiation.** Tier 3 (below) needs the *same URL* to return HTML
   to browsers and `application/activity+json` to Fediverse servers. That is a
   `Accept`-header decision a static file cannot make, but PHP can.

A minimal WebFinger script is short enough to ship as a plugin template:

```php
<?php // .well-known/webfinger/index.php  (or routed via .htaccess)
header('Access-Control-Allow-Origin: *');
$resource = $_GET['resource'] ?? '';
$accounts = require __DIR__ . '/accounts.php'; // generated by the build
if (!isset($accounts[$resource])) {
    http_response_code(404);
    exit;
}
header('Content-Type: application/jrd+json');
echo json_encode($accounts[$resource]);
```

Apache routing for the query-string path is typically a one-line rewrite:

```apache
# .htaccess
RewriteEngine On
RewriteRule ^\.well-known/webfinger$ /.well-known/webfinger/index.php [L,QSA]
```

**Does a suitable PHP script already exist?** Yes — this is a well-trodden
path and several small, copyable implementations circulate:

- The single-file **WebFinger PHP** gist/snippet pattern (read `resource`,
  emit JRD) is the most common; many Mastodon "move my handle to my own domain"
  tutorials publish one.
- **`webfinger.php`-style** redirector scripts that point an `acct:` at a
  Mastodon profile (the "host your handle on your own domain" recipe).
- Fuller libraries such as PHP ActivityPub toolkits
  (e.g. `landrok/activitypub` for building/validating ActivityStreams objects)
  can back a hand-written endpoint.

These are external projects and exact suitability/licensing must be checked —
*NEEDS VERIFICATION* — but the design takeaway is firm: **the AkashaCMS
Fediverse plugin should ship a small, configuration-driven PHP WebFinger
template and the matching `.htaccess`, generating the per-account JRD data at
build time.** The site stays "static-first," with PHP supplying only the thin
dynamic shim that shared hosting already supports.

---

### Tier 3 — The ActivityPub actor and objects (JSON-LD)

This is the protocol core. These three entity kinds — **Actor**,
**Collections**, and **Objects/Activities** — are the JSON-LD documents that
Fediverse software fetches and exchanges. Here is what each one actually *is*.

#### Actor — "the account / profile"

An **Actor** is the JSON-LD object that represents an account on the network:
the thing other people follow. When a Mastodon user looks you up, their server
fetches your Actor document. It is the federated equivalent of a profile page,
but machine-readable. Common `type` values are `Person` (a human account),
`Service` (an automated/bot account), and `Application` (software). It is
served at a stable actor URL with
`Content-Type: application/activity+json`. Minimum useful fields:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "id": "https://example.com/users/me",
  "type": "Person",
  "preferredUsername": "me",
  "name": "My Display Name",
  "summary": "Bio shown on the profile.",
  "inbox": "https://example.com/users/me/inbox",
  "outbox": "https://example.com/users/me/outbox",
  "followers": "https://example.com/users/me/followers",
  "following": "https://example.com/users/me/following",
  "publicKey": {
    "id": "https://example.com/users/me#main-key",
    "owner": "https://example.com/users/me",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

The `publicKey` (a PEM-encoded RSA public key) is how *other* servers verify
that activities claiming to come from you are genuine, using **HTTP
Signatures**. The matching private key must be kept on the server side and
never published in the static output. WebFinger (Tier 2) is what maps the
human-friendly `@me@example.com` handle to this `id` URL.

**Static vs PHP:** the Actor document is *mostly* static — its content rarely
changes — so the build can pre-render it as a JSON file. The only reason to
make it PHP is content negotiation (serving HTML profile vs JSON to the same
URL) and to keep the key plumbing alongside the inbox script.

#### Collections — "the lists hanging off the actor"

**Collections** are ActivityStreams list objects (`OrderedCollection` /
`OrderedCollectionPage`) referenced by the Actor:

- **`outbox`** — the public stream of things you have published (your `Create`
  activities). This is what a server reads to backfill your recent posts when
  someone first follows you. **This part is genuinely static-friendly**: the
  AkashaCMS build already knows every post, so it can emit the outbox as
  pre-rendered, paginated JSON files.
- **`followers`** / **`following`** — who follows you and who you follow. These
  are **inherently dynamic**: they change every time someone clicks "follow".
  They cannot be fully static; they need a script with a small data store
  (a JSON/SQLite file the inbox script appends to), or they can be hidden/
  summarized (Mastodon tolerates a collection that only reports a `totalItems`
  count without listing members).
- **`inbox`** — *not* really a list you serve for reading; it is the endpoint
  other servers `POST` to in order to deliver follows, replies, likes, and
  boosts to you. **The inbox is the single most server-dependent piece** and is
  the natural home for PHP on shared hosting (see Tier 4).

#### Objects / Activities — "the posts and the verbs about them"

ActivityPub separates the **noun** (an Object) from the **verb** (an Activity):

- An **Object** is a piece of content. A microblog post is a `Note`; a longer
  article (a good match for an AkashaCMS blog page) is an `Article`. It carries
  `id`, `attributedTo` (the Actor URL), `content` (HTML), `published`, and
  addressing.
- An **Activity** wraps an Object in an action. Publishing a post is a
  `Create` activity whose `object` is the `Note`/`Article`. Other verbs
  include `Update`, `Delete`, `Announce` (boost), `Like`, and `Follow`.
- **Addressing** uses `to`/`cc`. A public post addresses the special
  collection `https://www.w3.org/ns/activitystreams#Public` (and usually `cc`s
  your followers collection).

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/users/me/posts/123/activity",
  "type": "Create",
  "actor": "https://example.com/users/me",
  "published": "2026-06-19T12:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/me/followers"],
  "object": {
    "id": "https://example.com/users/me/posts/123",
    "type": "Article",
    "attributedTo": "https://example.com/users/me",
    "name": "Page Title",
    "content": "<p>Rendered HTML body…</p>",
    "url": "https://example.com/page.html",
    "published": "2026-06-19T12:00:00Z"
  }
}
```

Because the AkashaCMS build already produces every post's HTML and metadata, it
can pre-render each post's `Note`/`Article`/`Create` JSON as static files at
the same time. That makes the *read* side of Objects/Activities a pure build
artifact.

#### HTML `rel="alternate"` linkage

Pages may advertise their JSON-LD representation so crawlers/servers can
content-negotiate to the machine-readable form:

```html
<link rel="alternate" type="application/activity+json"
      href="https://example.com/users/me/posts/123" />
```

#### What can and cannot be static — and where PHP fits

A static generator can pre-render the **Actor JSON**, the **outbox**, and the
**per-post Note/Create JSON** as files. What it **cannot** do with files alone
is the **live, mutable, signed** surface:

- receiving follows and replies in the **inbox** (`POST` handling),
- maintaining the **followers** list,
- **delivering** your new activities to each follower's inbox, and
- **signing** those outgoing requests with HTTP Signatures.

On shared hosting these dynamic parts map cleanly onto **PHP scripts**:

- `inbox.php` — accepts `POST`, verifies the sender's HTTP Signature, and
  records follows/replies into a small JSON or SQLite store.
- `actor.php` / a content-negotiating router — returns HTML or
  `application/activity+json` based on the `Accept` header for the actor and
  post URLs.
- a delivery script (cron-driven or triggered) — signs and pushes new
  `Create` activities (which the AkashaCMS build emitted) to followers'
  inboxes.

Existing PHP building blocks reduce the work: libraries such as
**`landrok/activitypub`** (ActivityStreams object modeling/validation) and
small reference inbox implementations exist and can back these scripts —
*NEEDS VERIFICATION* of fit, maintenance status, and licensing. The
alternative to writing/operating these scripts is delegating federation to a
**hosted bridge** such as **Bridgy Fed**, which lets a static site participate
in the Fediverse without running an inbox at all.

The clean division of labor for an AkashaCMS plugin is therefore: **the build
generates everything that is static (Actor, outbox, post Objects/Activities,
WebFinger data, `rel="alternate"` links); a thin set of PHP scripts shipped as
plugin templates supplies the dynamic shim (WebFinger query handling, content
negotiation, inbox, delivery) that shared hosting can run.**

---

### Recommended implementation outline for AkashaCMS

A pragmatic, phased plugin design:

**Phase 1 — Metadata (pure HTML, fully static, highest value/effort ratio):**
1. Add per-document frontmatter: `fediverseCreator`, `ogType`, `ogImage`,
   `publishedDate`, `modifiedDate`, `tags`.
2. A Mahabhuta function (mirroring how `mahaMetadata` works in
   [lib/built-in.ts](../../lib/built-in.ts):80) injects the Tier 1 meta tags
   into `<head>`, falling back to existing `@akashacms/plugins-base` Open Graph
   output instead of duplicating it.
3. Emit `fediverse:creator` and `article:*` tags.

**Phase 2 — Discovery (static data + a small PHP shim):**
4. Configuration block declaring the site's Fediverse identity
   (`acct:user@domain`, actor URL).
5. Generate `/.well-known/nodeinfo` (+ `2.1`) and `host-meta` as static files,
   and generate the **per-account WebFinger JRD data** at build time.
6. Ship a configuration-driven **`webfinger` PHP template** plus the matching
   `.htaccess` rewrite to handle the `?resource=` query and content-type,
   since shared hosting reliably provides PHP. (A pure-static fallback file can
   be offered for hosts that genuinely forbid PHP.)

**Phase 3 — Static ActivityPub objects:**
7. Pre-render the **Actor** JSON-LD document, the **outbox** collection, and
   per-post **`Note`/`Article` + `Create`** JSON.
8. Add `rel="alternate" type="application/activity+json"` links to HTML pages.
9. Optionally ship a content-negotiating PHP router so the actor/post URLs
   return HTML or `application/activity+json` based on the `Accept` header.

**Phase 4 — Live federation (the dynamic shim):**
10. For full interactivity, ship optional PHP templates — `inbox.php`
    (signature-verified `POST` handling + a small JSON/SQLite store for
    followers), and a signed-delivery script — or document delegating to a
    hosted bridge such as Bridgy Fed. Be explicit that this tier needs PHP (or
    another runtime) plus a writable data store, not just static files.

### Bottom line

- "HTML schema tags for ActivityPub" effectively means **Open Graph +
  Twitter Card + the `fediverse:creator` convention** for link-preview cards;
  there is no W3C HTML tag set for ActivityPub itself.
- The genuine ActivityPub surface is **JSON-LD + HTTP discovery endpoints +
  a live inbox/outbox**, only partly expressible as static files.
- **Shared hosting changes the calculus.** Because the typical deployment
  target ships **PHP**, the dynamic gaps (WebFinger query handling, content
  negotiation, inbox, signed delivery) can be filled with a few small PHP
  scripts shipped as plugin templates — and reusable PHP WebFinger snippets and
  ActivityPub libraries (e.g. `landrok/activitypub`) already exist. The site
  stays "static-first" with a thin PHP shim rather than needing a full
  application server.
- The right AkashaCMS architecture is a **plugin** that extends the existing
  metadata pipeline ([Built-in Plugin](../concepts/built-in-plugin.md)) for
  Tier 1, generates static discovery/actor/post artifacts for Tiers 2–3, and
  ships optional PHP templates (WebFinger, content-negotiating router, inbox,
  delivery) for the dynamic surface — with a hosted bridge as the zero-server
  alternative.

*Protocol details (ActivityPub, ActivityStreams, WebFinger, NodeInfo, Open
Graph, Mastodon's `fediverse:creator`/card behavior), the cited PHP scripts and
libraries, and Bridgy Fed are external web standards/projects and are not
derived from AkashaRender source — NEEDS VERIFICATION against the live
specifications and project sources before implementation.*

## Sources

- [lib/built-in.ts](../../lib/built-in.ts) — Built-in plugin registers
  `mahaMetadata` for `<head>` metadata and Open Graph tag injection
  (lines 32, 80), the natural extension point for a Fediverse plugin.
- [wiki/concepts/built-in-plugin.md](../concepts/built-in-plugin.md) — Describes
  the metadata-handling responsibilities of the Built-in Plugin.

## Related Pages

- [Bluesky / AT Protocol Integration and Crossover with the Fediverse](./bluesky-atproto-integration.md) — Companion answer; shared Open Graph metadata and `/.well-known/` artifact generation, and why Fediverse and Bluesky only cross over via bridges
- [Built-in Plugin](../concepts/built-in-plugin.md) — Metadata and Open Graph injection pipeline
- [Custom Elements](../concepts/custom-elements.md) — Custom HTML tags via Mahabhuta, a model for injecting metadata
- [Plugin System](../concepts/plugin-system.md) — How a Fediverse plugin would extend AkashaRender
- [Site Rendering](../concepts/site-rendering.md) — Where discovery/artifact files would be emitted during a build

## Backlinks

- [Answer index](./README.md)
- [Bluesky / AT Protocol Integration and Crossover with the Fediverse](./bluesky-atproto-integration.md)
