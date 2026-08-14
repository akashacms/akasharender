---
title: "How Favicons Work, Their Formats, and Discovering Them Without the Google Favicon Service"
type: answer
Sources:
  - ../../../akashacms-external-links/mahafuncs.mjs
  - ../../../akashacms-external-links/index.mjs
  - ../../../akashacms-external-links/TODO.md
  - ../../../akashacms-external-links/guide/index.html.md
  - ../../../akashacms-external-links/guide-mahabhuta/index.html.md
Categories:
  - external-links
  - favicons
  - privacy
  - plugins
date-created: 2026-08-14T13:08:52+03:00
last-updated: 2026-08-14T13:30:00+03:00
confidence: high
---

# How Favicons Work, Their Formats, and Discovering Them Without the Google Favicon Service

## Query

Document how favicons work. What are the supported image formats for favicons? How can we discover the available favicons for a site? The goal is to change the feature in `@akashacms/plugins-external-links` to stop using the Google Favicon service and instead discover favicons directly, because relying on a Google service risks having our site's visitors tracked by Google.

## Answer

### What a favicon is

A *favicon* ("favorite icon") is the small icon a browser shows next to a page — in the tab, the address/location bar, the bookmark list, the history list, and (on mobile) the home-screen shortcut. In `@akashacms/plugins-external-links` the favicon of a link's *target* site is placed next to an outbound link as a visual cue that the link is external and which site it points at (source: [guide/index.html.md](../../../akashacms-external-links/guide/index.html.md)).

### How favicons are declared and discovered by browsers

There are two mechanisms a browser uses to find a site's icon, and both matter for direct discovery:

1. **Explicit declaration in the HTML `<head>` via `<link rel="icon">`.** The modern, standard way for a site to declare its icon is a `<link>` element whose `rel` attribute contains the `icon` keyword. The most common form is simply:

   ```html
   <link rel="icon" href="favicon.ico" />
   ```

   A page may declare **multiple** icons. When several `<link rel="icon">` elements are present, the browser chooses among them using the `type`, `sizes`, and `media` attributes; if several are equally appropriate the **last one wins**; and if the chosen one turns out to be unusable (e.g. an unsupported format) the browser falls back to the next-most-appropriate one. Example of a multi-icon declaration:

   ```html
   <link rel="icon" href="/favicon.ico" sizes="any">
   <link rel="icon" type="image/png" href="/icon-32.png" sizes="32x32">
   <link rel="icon" type="image/svg+xml" href="/icon.svg">
   <link rel="apple-touch-icon" href="/apple-touch-icon.png">
   ```

   Related, non-`rel="icon"` declarations that also point at site icons and should be recognized when scraping:

   - **`rel="apple-touch-icon"`** (and `apple-touch-icon-precomposed`) — Apple's non-standard iOS home-screen icon. iOS ignores `rel="icon"` and `sizes`, so this is where a large, high-quality PNG is usually found.
   - **`rel="mask-icon"`** — Safari pinned-tab monochrome SVG.
   - **`rel="manifest"`** — a Web App Manifest (`manifest.json`); its `icons` array lists PWA icons (with `src`, `sizes`, `type`, `purpose`), another good source of higher-resolution icons.
   - Legacy `rel="shortcut icon"` — the `shortcut` keyword is non-conforming and should be treated as equivalent to `icon` when parsing old pages, but not emitted.

2. **The `/favicon.ico` root convention (implicit fallback).** If a page declares no icon, browsers request `/favicon.ico` from the site root. This convention predates the `<link>` element and is still honored, so it is the reliable last-resort discovery step: try `https://HOST/favicon.ico`.

**Therefore, direct discovery for a hostname is a two-step process:** (a) fetch the target page's HTML and parse `<head>` for `rel="icon"` / `apple-touch-icon` / `mask-icon` / `manifest` links (resolving relative URLs against the page URL, and reading the manifest's `icons` if present); (b) if nothing is declared, fall back to `https://HOST/favicon.ico`. Pick the best candidate by declared `sizes`/`type` (prefer a reasonably-sized PNG/SVG; `.ico` as a floor), then fetch that image.

### Supported image formats for favicons

Historically the only format was Windows **ICO** (`image/x-icon` / `image/vnd.microsoft.icon`), served as `/favicon.ico`. An `.ico` file is a *container* that can hold several bitmaps at different sizes (e.g. 16×16, 32×32, 48×48), which is why one `.ico` can serve multiple UI contexts.

Modern browsers accept the same raster/vector formats they can otherwise display, when pointed at them by `<link rel="icon" type="...">`:

- **ICO** — `image/x-icon` (universal, multi-size container; the `/favicon.ico` fallback).
- **PNG** — `image/png` (the most common modern choice; supports transparency; commonly provided at 16/32/48/180/192/512 px). `apple-touch-icon` and PWA-manifest icons are almost always PNG.
- **SVG** — `image/svg+xml` (scalable, small, and can adapt to light/dark via CSS/media queries inside the SVG). Widely supported by current desktop browsers.
- **GIF** — `image/gif` (accepted, including animated in some older browsers; rarely used today).
- **JPEG** — `image/jpeg` (accepted by browsers but a poor fit — no transparency; rarely used for favicons).
- **WebP / AVIF** — modern formats increasingly accepted where the browser supports the codec; still uncommon as declared favicons.

For a direct-discovery implementation the practical set to *handle* is **ICO, PNG, and SVG** (with GIF/JPEG/WebP tolerated as pass-through), since those cover essentially all real-world declared favicons and the `/favicon.ico` fallback.

### The current (Google-based) implementation and why it must change

The plugin currently does **not** discover favicons at all. In `ExternalLinkMunger.showFavicons` it hard-codes an `<img>` pointing at Google's favicon endpoint, keyed only on the link's hostname:

```html
<img class="akashacms-external-links-favicon opengraph-no-promote"
     src="https://www.google.com/s2/favicons?domain=${urlP.hostname}"
     .../>
```

(source: [mahafuncs.mjs](../../../akashacms-external-links/mahafuncs.mjs), lines 160–165). The `showFavicons` option (`before` / `after` / `never`) is wired through `index.mjs` (`setShowFavicons`) and the `ExternalLinkMunger` selector `html body a` (source: [index.mjs](../../../akashacms-external-links/index.mjs); [mahafuncs.mjs](../../../akashacms-external-links/mahafuncs.mjs)).

The privacy problem is that this `<img>` src is emitted into the **rendered HTML**, so it is fetched by **each site visitor's browser at page-view time** from `www.google.com`. Every visitor to any page containing an external link therefore makes a request to Google carrying their IP address, `User-Agent`, and a `Referer` revealing the page they are on — i.e. Google can track your visitors. The plugin's own guide even notes "a little-known Google service is used to retrieve the favicon" (source: [guide-mahabhuta/index.html.md](../../../akashacms-external-links/guide-mahabhuta/index.html.md), line 126). The project's `TODO.md` records the intent to replace it precisely to "avoid feeding data to Google" and to avoid extra images that confuse importers like Medium (source: [TODO.md](../../../akashacms-external-links/TODO.md)).

### Recommended direct-discovery design (build-time)

The fix is to move favicon acquisition from *the visitor's browser at view-time* to *the build at render-time*, so no request is ever made to Google. The `TODO.md` sketches this shape (source: [TODO.md](../../../akashacms-external-links/TODO.md)):

1. **Given a target URL, discover its icon** using the two-step process above: fetch the page HTML, parse `<head>` for `rel="icon"`/`apple-touch-icon`/`mask-icon`/`manifest` (read the manifest's `icons`), resolve relative hrefs, choose the best candidate by `sizes`/`type`, and fall back to `/favicon.ico`. Several npm packages already do the HTML scraping and candidate ranking (the `TODO.md` lists `favrat`, `@meltwater/fetch-favicon`, `favicon`, `website-favicon`, `faviconize`, `@tradle/fetch-favicon`, `node-favicon`, `@getstation/fetch-favicon`, `@namchee/favify`, `@yunyu/fetch-favicon`), though any can be replaced by a small custom fetch+parse using the DOM tooling AkashaCMS already has.
2. **Cache the discovery result** keyed by hostname so each external host is looked up only once per build (and, ideally, across builds). AkashaRender already provides a plugin-friendly persistent store — see the [Key-Value Store](../concepts/key-value-store.md) concept and the SQLite-backed [Cache Schema](../concepts/cache-schema.md) — which is a natural place to memoize `hostname → chosen icon URL` and avoid repeated network calls and repeated failures.
3. **Choose what to emit** — see the two strategies below. Either way the emitted markup should keep the existing `akashacms-external-links-favicon` and `opengraph-no-promote` classes and the `akashacms-external-links-suppress-icons` opt-out so existing behavior and the guide stay accurate.

The discovery step (1) and the hostname cache (2) are valuable regardless of which emit strategy is chosen; the two strategies differ only in whether the icon bytes are downloaded to your site or referenced remotely.

This design is a good match for AkashaRender because rendering is a batch, build-time process using server-side [DOM Manipulation](../concepts/dom-manipulation.md) via the [Mahabhuta System](../concepts/mahabhuta-system.md) (the `ExternalLinkMunger` is a Mahabhuta `Munger`), so the discovery fetches happen once during the build rather than on every visitor's browser.

### Two emit strategies: record the URL vs. self-host

Both strategies remove the request to Google. They differ in whether the visitor's browser still contacts a third party, and in stability. The best approach is to make this a **config choice** (e.g. a `faviconMode` option) so site authors pick their tradeoff.

**Strategy A — Self-host (download the icon).** Download the discovered icon into the rendered output directory as a local asset (e.g. `favicons/HOST.ext`), and emit a reference to *your* copy.

- **Most private:** no third party sees the visitor at all — neither Google nor the linked site. The only fetch is same-origin, to your own server.
- **Most stable:** the icon is captured at build time, so it keeps working even if the target site later removes, moves, or blocks its favicon, or goes down.
- **Cost:** extra build-time work (download, store), extra bytes in the output tree, and format/normalization handling (see caveats).

**Strategy B — Record the discovered URL (do not download).** Resolve the icon URL at build time (the *build machine* fetches the page HTML / `/favicon.ico`, not the visitor), then emit that remote URL as the icon `src`. This is the simpler mechanism: no download, no storage, no asset-path management.

- **Fixes the Google problem:** no request is made to `www.google.com`, so Google can no longer collect data on your visitors — the stated goal is met.
- **But only a partial privacy improvement:** the visitor's browser still makes a **cross-origin request to the target site** (e.g. `https://cnn.com/favicon.ico`) at page-view time. This *shifts* the tracking opportunity from Google to *each linked site*, which can then log the visitor's IP, `User-Agent`, and a `Referer` header revealing which of your pages they are on. On a page with many external links, that can be a wider (though less centralized) tracking surface than the single Google endpoint.
- **Less stable:** hotlinked favicon URLs can break over time (the site reorganizes, drops `/favicon.ico`, changes the icon path, blocks hotlinking, or goes offline), so a URL resolved at build time may already be stale when a visitor loads the page.
- **Other footguns:** an `http://` icon URL on an `https://` page is blocked as mixed content, and some hosts set headers that interfere with cross-origin image loads.

**Recommendation:** default to **Strategy A (self-host)** for maximum privacy and stability, and offer **Strategy B (record URL)** as a lighter-weight opt-in for authors who prefer simplicity and accept that visitors will contact the linked sites.

### Deferring the `<img>` (orthogonal to privacy)

Separately, the `TODO.md` proposes emitting `<i class='ak-favicon-ref' src='URL'>` and using a small client-side script to rewrite it into an `<img>` in the browser (source: [TODO.md](../../../akashacms-external-links/TODO.md)). Note this is **orthogonal to the privacy question**: whether the URL is written server-side or injected by client-side JS, the browser still fetches the icon from whatever origin the `src` names. The real benefit of the deferred form is avoiding stray `<img>` tags that confuse content importers such as Medium — not privacy. It can be combined with either emit strategy above.

### No conversion needed — serve ICO/PNG/SVG as-is

Browsers decode **ICO natively** (both the `/favicon.ico` fallback and an `.ico` referenced via `<link rel="icon">` or an `<img src="...ico">`), so a downloaded `.ico` can be served directly with a plain `<img>` — there is **no reason to convert it to JPG**. Converting to JPG would in fact be harmful: JPG has no transparency (favicons are typically transparent), it is lossy (visible artifacts at 16×16), and it discards the multiple sizes an `.ico` container holds. The same applies to PNG and SVG — serve them as-is. Any re-encoding should only be for **resizing/normalization** (see caveats), and even then the output should stay in a transparency-preserving format (PNG, or SVG passthrough), never JPG.

### Practical caveats

- **Network at build time:** direct discovery requires the build machine to reach external hosts; failures (timeouts, 404, TLS) must degrade gracefully (skip the favicon, cache the negative result). This is the main behavioral change from the Google approach, which never failed visibly because Google always returned *something* (often a generic globe).
- **Icon quality/size varies wildly** between sites; picking `apple-touch-icon` or a manifest PNG usually yields a crisper icon than a 16×16 `.ico`, but costs bytes. If self-hosting (Strategy A), consider resizing the fetched icon to a small standard size (AkashaRender already has an [Image Resizing](../concepts/image-resizing.md) capability).
- **Format handling (self-host only):** browsers display ICO/PNG/SVG directly, so no conversion is required to *display* an icon — serve it as-is. If you choose to normalize or resize when self-hosting, keep a transparency-preserving format (PNG or SVG passthrough) and never target JPG; `.ico` in particular is a multi-size container that would need decoding to a single bitmap before re-encoding.
- **Respect the opt-out and multiple-link de-duplication** already implemented in `showFavicons` (it skips adding an icon when an adjacent sibling already carries the `akashacms-external-links-favicon` class).

## Sources

- [mahafuncs.mjs](../../../akashacms-external-links/mahafuncs.mjs) — current `ExternalLinkMunger.showFavicons` hard-codes the Google `s2/favicons` `<img>`.
- [index.mjs](../../../akashacms-external-links/index.mjs) — `ExternalLinksPlugin` configuration, `setShowFavicons`, defaults.
- [TODO.md](../../../akashacms-external-links/TODO.md) — the stated plan to replace the Google service with direct discovery, caching, local storage, and the `ak-favicon-ref` approach; candidate npm packages.
- [guide/index.html.md](../../../akashacms-external-links/guide/index.html.md) — end-user documentation of the favicon feature and the suppress-icons class.
- [guide-mahabhuta/index.html.md](../../../akashacms-external-links/guide-mahabhuta/index.html.md) — notes that a Google service is currently used.
- MDN, `rel` HTML attribute (the `icon` value): `<link rel="icon">` semantics, multiple-icon selection by `type`/`sizes`/`media`, last-one-wins, fallback on unusable format, `apple-touch-icon` non-standard value, and the non-conforming `shortcut` keyword.

## Related Pages

- [Key-Value Store](../concepts/key-value-store.md) — persistent per-plugin storage suitable for caching discovered favicon URLs.
- [Cache Schema](../concepts/cache-schema.md) — the SQLite cache data model underlying build-time caching.
- [DOM Manipulation](../concepts/dom-manipulation.md) — how the plugin rewrites links during rendering.
- [Mahabhuta System](../concepts/mahabhuta-system.md) — the server-side DOM engine the `ExternalLinkMunger` plugs into.
- [Image Resizing](../concepts/image-resizing.md) — resizing/normalizing fetched icons.
- [Social-Sharing Metadata: Open Graph, Twitter Cards, and Facebook](./social-sharing-metadata-opengraph-twitter-facebook.md) — related build-time `<head>` metadata scraping/emitting work.

## Backlinks

- (none yet)
