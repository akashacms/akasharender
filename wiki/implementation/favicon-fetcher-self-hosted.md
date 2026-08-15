---
title: "Implementing Self-Hosted Favicon Discovery in plugins-external-links (favicon-fetcher.mjs)"
type: implementation
Sources:
  - ../../../akashacms-external-links/mahafuncs.mjs
  - ../../../akashacms-external-links/index.mjs
  - ../../../akashacms-external-links/package.json
  - ../../../akashacms-external-links/TODO.md
  - lib/built-in.ts
  - lib/index.ts
  - lib/cache/vfstack.ts
Categories:
  - plugins
  - external-links
  - favicons
  - privacy
  - assets
  - vendor-libraries
date-created: 2026-08-14T13:58:32+03:00
last-updated: 2026-08-14T13:58:32+03:00
confidence: high
---

# Implementing Self-Hosted Favicon Discovery in plugins-external-links (favicon-fetcher.mjs)

## Query

Implement self-hosted favicon discovery in `@akashacms/plugins-external-links` to replace the Google Favicon service. The design:

- Store cached favicon data under a directory whose immediate children are directories named for the **canonical domain name**, each containing whatever data was retrieved about that domain's favicons.
- Plugin code uses `fetch()` to retrieve a target web page — **following redirects** and sending a **faux `User-Agent` header** — and from the returned HTML deduces the favicon(s).
- Provide **configuration settings for the desired favicon size**.
- Optionally include a **snippet of image-conversion code** to resize/convert a favicon to PNG. AkashaRender already forces the install of **Sharp**, which can be used. **Conversion from ICO to PNG should be avoided** — if only an ICO is available, simply store the ICO and skip conversion.
- A configuration setting declares the **directory name** in which to store favicons, defaulting to `"favicon-cache"`, and the plugin **automounts** that directory at `/vendor/favicon-cache`.
- The implementation code lives in **`favicon-fetcher.mjs`** and is imported by the plugin.

Create an implementation document describing the above.

## Architecture Pages

- [How Favicons Work, Their Formats, and Discovering Them Without the Google Favicon Service](../answers/favicon-discovery-without-google.md) — the design rationale, favicon formats, discovery algorithm, and the "self-host vs. record-URL" tradeoff this implementation realizes (the self-host strategy).
- [Vendor Library Plugins Architecture](../architecture/vendor-library-plugins.md) — the `/vendor/LIBRARY-NAME` mounting pattern (`addAssetsDir`) this plugin reuses to expose `/vendor/favicon-cache`.

## Architecture

This section is a concrete coding plan. It has three moving parts:

1. **`favicon-fetcher.mjs`** — a standalone module that, given a URL, discovers, downloads, optionally converts, and caches the favicon on disk, and returns the local vendor-path to reference.
2. **`index.mjs`** — new configuration setters, a resolved cache directory, and an `addAssetsDir` automount of the cache at `/vendor/favicon-cache`.
3. **`mahafuncs.mjs`** — `ExternalLinkMunger.showFavicons` reworked to call the fetcher (at build time) and emit a local `<img>` instead of the Google `<img>`.

Because AkashaRender rendering is a build-time batch process using server-side [DOM Manipulation](../concepts/dom-manipulation.md) via the [Mahabhuta System](../concepts/mahabhuta-system.md), all network access and image processing happen **once during the build**, never in the visitor's browser.

### 1. On-disk cache layout

The cache is a directory (default name `favicon-cache`, located under the plugin-consuming project — see §4 for where it is rooted). Its immediate children are one directory per **canonical domain**, each holding the retrieved artifacts for that domain:

```
favicon-cache/
  cnn.com/
    meta.json          # what we discovered/decided (see below)
    favicon.ico        # the original downloaded icon (as-is), and/or
    favicon.png        # a resized/converted PNG (only when source was not ICO)
  www.wikipedia.org/
    meta.json
    favicon.png
  example.org/
    meta.json          # negative result: no icon found (still cached)
```

The directory name is the **canonical domain** — the effective hostname after following redirects and lower-cased. Do **not** include the port or scheme in the directory name; strip a leading `www.`? — **No**: keep the host exactly as it resolves (some sites differ between apex and `www`), but always lower-case it and, because a raw hostname is already filesystem-safe (letters, digits, dots, hyphens), no further escaping is normally required. Punycode/IDN hosts (`xn--…`) are already ASCII-safe. As a defensive measure, reject/segment any host containing a path separator or `..`.

`meta.json` records the discovery outcome so subsequent builds skip the network:

```json
{
  "domain": "cnn.com",
  "resolvedFrom": "https://cnn.com/",
  "iconSourceURL": "https://www.cnn.com/media/sites/cnn/favicon.ico",
  "storedFiles": ["favicon.ico"],
  "servedFile": "favicon.ico",
  "sourceFormat": "ico",
  "converted": false,
  "width": null,
  "fetchedAt": "2026-08-14T10:00:00.000Z",
  "status": "ok"
}
```

`status` is `"ok"` or `"none"` (no icon discoverable — a **negative result that is still cached** so we do not re-hit the network on every build). Because the files live under the mounted vendor directory, the vendor URL to reference is deterministic: `/vendor/<cacheDirName>/<domain>/<servedFile>`.

> Two-layer caching. The on-disk `meta.json` is the primary, cross-build cache. Optionally add an in-memory `Map<domain, result>` for the current build to avoid re-reading `meta.json` for repeated links to the same domain. The [Key-Value Store](../concepts/key-value-store.md) is a possible alternative to `meta.json`, but the file-per-domain layout is required by the query, is human-inspectable, and lives right next to the icon bytes, so prefer files.

### 2. `favicon-fetcher.mjs` — the module

Keep it dependency-light and framework-free so it is unit-testable in isolation. It should export an async function plus a couple of helpers.

```js
// favicon-fetcher.mjs
import path from 'node:path';
import fsp from 'node:fs/promises';
import { URL } from 'node:url';
import * as cheerio from 'cheerio';   // akasha bundles cheerio via mahabhuta; declare it as a dep
// sharp is imported lazily (see §3) so the module loads even if conversion is disabled.

// A faux User-Agent so sites that vary output by client return normal HTML.
const FAUX_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/**
 * Discover, download, (optionally) convert, and cache the favicon for `pageURL`.
 *
 * @param {string} pageURL         The external link's URL.
 * @param {object} opts
 * @param {string} opts.cacheDir   Absolute path to the favicon cache root.
 * @param {string} opts.cacheName  The cache dir name (e.g. "favicon-cache") for building vendor URLs.
 * @param {number} [opts.size]     Desired width in px (triggers resize/convert of non-ICO icons).
 * @param {boolean}[opts.convertToPNG] Whether to convert non-ICO icons to PNG (default false).
 * @param {number} [opts.timeoutMS]  Per-request timeout.
 * @returns {Promise<{ status:'ok'|'none', vendorURL?:string, servedFile?:string, domain:string }>}
 */
export async function fetchFavicon(pageURL, opts) { /* … see steps below … */ }
```

Processing steps inside `fetchFavicon`:

**Step A — canonicalize + cache check.** Parse `pageURL`; if it lacks a protocol, skip (the Munger already restricts to external links). Compute a *provisional* domain from the URL. Look for `<cacheDir>/<domain>/meta.json`; if present and `status` is `ok`/`none`, return immediately (no network). (When following redirects below yields a different canonical host, the authoritative cache key is the resolved host — so check again after Step B if needed.)

**Step B — fetch the page HTML, following redirects, with a faux UA.**

```js
const res = await fetch(pageURL, {
    redirect: 'follow',
    headers: { 'User-Agent': FAUX_UA, 'Accept': 'text/html,*/*' },
    signal: AbortSignal.timeout(opts.timeoutMS ?? 10000)
});
const finalURL = new URL(res.url);            // after redirects
const domain   = finalURL.hostname.toLowerCase();
const html     = res.ok ? await res.text() : '';
```

Handle failures (`!res.ok`, network errors, timeouts) by recording a `status: "none"` meta and returning `{ status: 'none', domain }`.

**Step C — deduce candidate icon URLs from the HTML.** Parse with cheerio and collect, in priority order, resolving every `href` against `finalURL`:

1. `link[rel~="icon"]` (covers `icon` and the legacy `shortcut icon`), reading `type` and `sizes`.
2. `link[rel="apple-touch-icon"]` / `link[rel="apple-touch-icon-precomposed"]` (usually a large PNG).
3. `link[rel="mask-icon"]` (monochrome SVG).
4. `link[rel="manifest"]` → fetch the manifest JSON (same faux-UA `fetch`) and read its `icons[]` (`src`, `sizes`, `type`).

Rank candidates: prefer a declared `sizes` closest to (but not smaller than) `opts.size` when set; otherwise prefer larger PNG/SVG over a tiny `.ico`. Always append the implicit fallback `new URL('/favicon.ico', finalURL)` as the lowest-priority candidate so a site with no declared icon still resolves (per the [answer page](../answers/favicon-discovery-without-google.md)).

**Step D — download the chosen icon.** `fetch` each candidate in rank order (faux UA, redirects followed) until one returns `res.ok` with an image content-type or non-empty body. Determine the source format from the `Content-Type` and/or the URL extension (`ico`, `png`, `svg`, `gif`, `jpeg`, `webp`). Sniff the magic bytes as a tiebreaker (ICO starts with `00 00 01 00`; PNG with `89 50 4E 47`; `<?xml`/`<svg` for SVG).

**Step E — store (and optionally convert).** Create `<cacheDir>/<domain>/`. Then:

- If the source is **ICO**: **store the `.ico` as-is and do not convert** (per the requirement). `servedFile = "favicon.ico"`, `sourceFormat = "ico"`, `converted = false`.
- If the source is **SVG**: store as-is (`favicon.svg`); do not rasterize. (Optionally still allowed to serve directly.)
- If the source is **PNG/GIF/JPEG/WebP** and (`opts.convertToPNG` and/or `opts.size`) is set: run the conversion snippet (§3) to produce `favicon.png` at the desired width; `servedFile = "favicon.png"`, `converted = true`, `width = opts.size`. If conversion is disabled, store the original bytes under `favicon.<ext>` and serve that.

Write `meta.json` with the outcome. Return `{ status:'ok', domain, servedFile, vendorURL: '/vendor/'+opts.cacheName+'/'+domain+'/'+servedFile }`.

**Idempotency / negative caching.** Every path (success or failure) writes a `meta.json`, so a rebuild reads the cache and performs **no** network I/O. This is the key behavioral difference from the Google approach and prevents slow or flaky builds.

### 3. The optional image-conversion snippet (Sharp)

AkashaRender already forces Sharp to be installed (it is a direct import in `lib/built-in.ts:24`, used at `lib/built-in.ts:317` as `sharp(srcfile).resize(width)`). The plugin should **declare its own `sharp` dependency** (do not rely on reaching into akasharender's copy) and import it **lazily** so the module still loads when conversion is disabled:

```js
async function convertToPNG(inputBuf, width) {
    const { default: sharp } = await import('sharp');   // lazy
    let img = sharp(inputBuf);
    if (typeof width === 'number' && width > 0) {
        img = img.resize(width);          // width only → aspect ratio preserved (mirrors built-in.ts)
    }
    return await img.png().toBuffer();
}
```

Rules:

- **Never convert ICO → PNG.** Sharp's ICO support is unreliable and the requirement is explicit: if only an ICO is available, store the ICO and skip conversion. Guard with `if (sourceFormat === 'ico') { /* store as-is, return */ }` *before* any Sharp call.
- **Do not target JPG** (favicons are typically transparent; PNG preserves alpha) — see the [answer page](../answers/favicon-discovery-without-google.md) "No conversion needed" section.
- SVG passthrough: don't rasterize SVG unless a raster size is explicitly required; if it is, `sharp(svgBuf).resize(width).png()` works, but default to storing the SVG as-is.
- Conversion is **optional**: gate the whole snippet behind `opts.convertToPNG === true` (and/or `opts.size` being set). When disabled, the fetcher stores raw bytes and never imports Sharp.

### 4. `index.mjs` — configuration and automount

Add the cache-directory config and the vendor automount to the plugin's `configure()`. Model the mount on the [Vendor Library Plugins](../architecture/vendor-library-plugins.md) pattern (`addAssetsDir({ src, dest })`), but note the source directory here is a **project-local, generated** directory (not an npm package), so resolve it relative to the project rather than via `import.meta.resolve`.

New options and defaults (added alongside the existing `showFavicons`, `blacklist`, etc. in `configure`, `index.mjs`):

```js
// defaults, set in configure()
if (!this.options.faviconCacheDir)  this.options.faviconCacheDir  = 'favicon-cache';
if (typeof this.options.faviconSize === 'undefined')       this.options.faviconSize = undefined; // px, optional
if (typeof this.options.faviconConvertToPNG === 'undefined')this.options.faviconConvertToPNG = false;
if (typeof this.options.faviconTimeoutMS === 'undefined')  this.options.faviconTimeoutMS = 10000;

// Resolve the cache directory to an absolute path. Root it at the project dir.
// (config exposes the project directory; if not, fall back to process.cwd().)
const projectDir = config.projectDir ?? process.cwd();
this.options.faviconCacheAbsDir = path.isAbsolute(this.options.faviconCacheDir)
    ? this.options.faviconCacheDir
    : path.join(projectDir, this.options.faviconCacheDir);

// Ensure it exists so addAssetsDir has something to scan.
fs.mkdirSync(this.options.faviconCacheAbsDir, { recursive: true });

// Automount at /vendor/favicon-cache (dest uses the *name*, not the abs path).
config.addAssetsDir({
    src: this.options.faviconCacheAbsDir,
    dest: `/vendor/${this.options.faviconCacheDir}`
});
```

Fluent setters (matching the existing `setShowFavicons`, etc.):

```js
setFaviconCacheDir(config, name)  { this.options.faviconCacheDir = name;  return this; }
setFaviconSize(config, px)        { this.options.faviconSize = px;        return this; }
setFaviconConvertToPNG(config, b) { this.options.faviconConvertToPNG = b; return this; }
```

Notes:

- The `dest` for the mount is `/vendor/<name>` where `<name>` is the configured cache dir name; if the author overrides `faviconCacheDir` (e.g. `"my-favicons"`) the mount becomes `/vendor/my-favicons` and the emitted `<img>` URLs follow suit. The **default** is `/vendor/favicon-cache` exactly as specified.
- Because assets are **stacked** ([Stacked Directories](../concepts/stacked-directories.md)), a project can shadow any cached favicon by mounting its own file at the same `/vendor/favicon-cache/<domain>/…` path.
- **Ordering caveat:** `addAssetsDir` records the mount during `configure()`, and the asset scan/copy runs later. The fetcher, however, *writes files into that directory during rendering* (in the Munger). Ensure the copy of assets-to-output happens (or is re-run) after favicons are fetched — see §6 (Phasing) for the two viable strategies (fetch during a pre-render hook, or fetch in the Munger and copy the icon straight into `renderDestination`).

### 5. `mahafuncs.mjs` — emit a local `<img>`

Replace the Google `<img>` in `ExternalLinkMunger.showFavicons` (currently `mahafuncs.mjs` lines 160–165) with a call to the fetcher and a **local** vendor URL. The Munger's `process()` is already `async`, so it can `await`.

```js
import { fetchFavicon } from './favicon-fetcher.mjs';

// inside showFavicons(...), replacing the hard-coded Google <img> block:
const result = await fetchFavicon($link.attr('href'), {
    cacheDir:      this.options.faviconCacheAbsDir,
    cacheName:     this.options.faviconCacheDir,
    size:          this.options.faviconSize,
    convertToPNG:  this.options.faviconConvertToPNG,
    timeoutMS:     this.options.faviconTimeoutMS
});

if (result.status !== 'ok') return;   // graceful: no icon, emit nothing

const imghtml = `
  <img class="akashacms-external-links-favicon opengraph-no-promote"
       src="${result.vendorURL}"
       style="display: inline-block; padding-right: 2px;"
       alt="(${urlP.hostname})"/>
`;
if (this.options.showFavicons === "before") $link.before(imghtml);
else                                        $link.after(imghtml);
```

Preserve the existing behavior around this block:

- The **de-duplication** guard (skip if an adjacent sibling already has class `akashacms-external-links-favicon`).
- The **suppress opt-out** class `akashacms-external-links-suppress-icons` (handled in `process()` before `showFavicons` is called).
- The `opengraph-no-promote` class (so the icon is not treated as the page's social image).

This keeps the plugin's guide accurate and the DOM shape unchanged apart from the icon URL now being local.

### 6. Phasing

1. **Phase 1 — module.** Write `favicon-fetcher.mjs` with discovery + download + on-disk cache (`meta.json`, per-domain dirs), **no** conversion (store raw bytes / ICO as-is). Unit-test it against a local fixture HTTP server (Node `node:test`) with pages exercising: declared `<link rel=icon>`, `apple-touch-icon`, manifest icons, redirects, `/favicon.ico` fallback, and the no-icon negative-cache case.
2. **Phase 2 — plugin wiring.** Add the options, `faviconCacheAbsDir` resolution, `mkdir`, and the `/vendor/<name>` automount in `index.mjs`; add the fluent setters. Verify the mount appears in the assets cache and copies to the output.
3. **Phase 3 — Munger.** Swap the Google `<img>` for the fetcher call in `mahafuncs.mjs`; keep de-dup/suppress/classes. Decide the write-vs-copy strategy: either (a) fetch icons in a pre-render plugin hook (e.g. `onSiteRendered` is too late for `<img src>` in pages; use a `beforeSiteRendered`/first-render hook or a config-time prefetch pass over known links) so the mounted assets are copied normally; or (b) have the fetcher write the icon **directly into `config.renderDestination/vendor/<name>/<domain>/…`** in addition to the cache (mirroring how `built-in.ts` writes resized images straight to `renderDestination`), which sidesteps asset-copy ordering. Prefer (b) for simplicity and to match the resize precedent.
4. **Phase 4 — optional conversion.** Add the lazy-Sharp `convertToPNG` snippet gated on `faviconConvertToPNG`/`faviconSize`, with the hard ICO-skip guard. Declare `sharp` (and `cheerio`) in the plugin's `package.json` `dependencies` (currently empty). Test that ICO stays ICO and PNG/JPEG/WebP become resized PNG.
5. **Phase 5 — docs.** Update the plugin guide (`guide/index.html.md`, `guide-mahabhuta/index.html.md`) to remove the "a little-known Google service is used" note and document the new options, the `/vendor/favicon-cache` location, and the privacy improvement; then remove/annotate `TODO.md`.

### 7. Testing checklist

- Discovery: each candidate source (`icon`, `shortcut icon`, `apple-touch-icon`, `mask-icon`, manifest `icons`) is found and ranked; relative hrefs resolve against the redirected final URL.
- Redirects: `http → https`, apex → `www`, and cross-host redirects update the canonical domain used as the cache key.
- Faux UA: request carries the `User-Agent` header (assert via the fixture server).
- Fallback: a page with no declared icon resolves `/favicon.ico`.
- Negative cache: a domain with no icon writes `status:"none"` and performs no network on rebuild.
- Storage layout: `<cacheDir>/<domain>/meta.json` + icon file; vendor URL is `/vendor/favicon-cache/<domain>/<file>`.
- ICO handling: ICO stored as-is, **never** converted; `converted:false`.
- Conversion: with `faviconConvertToPNG` + `faviconSize`, a PNG/JPEG/WebP source yields a resized `favicon.png`; SVG left as-is by default.
- Munger: emitted `<img src>` is the local vendor URL (no `google.com`); de-dup and suppress-icons still honored; classes preserved.
- Mount: `/vendor/favicon-cache/...` is served/copied to the output directory.

### 8. Security / robustness notes

- **Domain as a path segment:** validate the resolved hostname before using it as a directory name (reject empty, `.`/`..`, or anything containing `/` or `\`); hostnames are otherwise filesystem-safe.
- **SSRF surface:** `fetch` targets are external link URLs authored into the site, so this is build-time and author-controlled, but still set timeouts, cap redirect chains (the platform default is fine), and cap the downloaded icon size (e.g. refuse bodies over a few hundred KB).
- **Content-type spoofing:** verify magic bytes before handing data to Sharp; on any Sharp error, fall back to storing the raw bytes and serving them, rather than failing the build.
- **Offline / CI builds:** if the network is unavailable, discovery fails gracefully (`status:"none"`, no icon emitted) and the build still succeeds; a previously-populated `favicon-cache/` committed to the repo makes builds fully offline-reproducible.

## Sources

- [mahafuncs.mjs](../../../akashacms-external-links/mahafuncs.mjs) — `ExternalLinkMunger.showFavicons` (Google `<img>` at lines 160–165) to be replaced; the async `process()` and de-dup/suppress logic to preserve.
- [index.mjs](../../../akashacms-external-links/index.mjs) — `configure()` options defaults and the fluent `setShowFavicons`/`setShowIcon` setter pattern to mirror; where to add the automount.
- [package.json](../../../akashacms-external-links/package.json) — currently empty `dependencies`; add `sharp` and `cheerio`.
- [TODO.md](../../../akashacms-external-links/TODO.md) — the originating requirement (discover directly, cache, store in output, avoid Google).
- [lib/built-in.ts](../../lib/built-in.ts) — Sharp usage precedent (`import sharp` line 24; `sharp(srcfile).resize(width)` line 317) and the "write resized image straight into `renderDestination`" pattern to mirror.
- [lib/index.ts](../../lib/index.ts) — `addAssetsDir({ src, dest })` used for the `/vendor/favicon-cache` automount.
- [lib/cache/vfstack.ts](../../lib/cache/vfstack.ts) — the `dirToMount` type and stacked-directory override semantics.

## Related Pages

- [How Favicons Work, Their Formats, and Discovering Them Without the Google Favicon Service](../answers/favicon-discovery-without-google.md) — the answer this implements (self-host strategy).
- [Vendor Library Plugins Architecture](../architecture/vendor-library-plugins.md) — the `/vendor/...` mounting pattern.
- [Stacked Directories](../concepts/stacked-directories.md) — why the cache is overridable once mounted.
- [Image Resizing](../concepts/image-resizing.md) — the Sharp resize precedent in the built-in plugin.
- [Key-Value Store](../concepts/key-value-store.md) — alternative cache backend (files preferred here).
- [DOM Manipulation](../concepts/dom-manipulation.md) / [Mahabhuta System](../concepts/mahabhuta-system.md) — where the Munger runs.
- [Implementation index](./README.md)

## Backlinks

- [Implementation index](./README.md)
