---
title: "Link Checker Implementation Guide (Built-in Plugin)"
type: implementation
Sources:
  - lib/built-in.ts
  - lib/index.ts
  - lib/render.ts
  - lib/Plugin.ts
  - lib/cache/cache-sqlite.ts
  - ../akashacms-example/config.mjs
  - ../akashacms-external-links/index.mjs
Categories:
  - link-checking
  - validation
  - built-in-plugin
  - implementation
  - quality-assurance
date-created: 2026-08-14T00:18:46+03:00
last-updated: 2026-08-14T01:00:30+03:00
confidence: high
---

# Link Checker Implementation Guide (Built-in Plugin)

## Query

How can AkashaCMS check link validity for (a) local links within an AkashaCMS
project, and (b) external links to other sites? The feature should let a bad
link be handled in one of four configurable **severity modes**:

- **ignore** — do nothing
- **warn** — print a warning, keep going
- **error** — record an error, keep going, but fail the run at the end
- **fatal** — stop processing the project immediately

The feature should live in the **Built-in Plugin** (`lib/built-in.ts`,
plugin name `akashacms-builtin`), and the four modes must be declarable via
`config.mjs` in the same way the example project configures the built-in
plugin (see `config.plugin('akashacms-builtin').pathIndexes = '/tags/'` in
[../akashacms-example/config.mjs](../../../akashacms-example/config.mjs)).

For an **internal** link, validity can be checked by looking in the cache
database for a rendering path matching the link. For an **external** link,
what is the best-practice technique for validating the URL?

The feature must also support a configurable **whitelist of external URLs that
are not checked** — assumed valid and never fetched — so that bot-blocked,
auth-walled, or deliberately un-hammered hosts do not produce false failures.

Only `http:`/`https:` links (and local paths) can be validated; the many other
URI schemes (`mailto:`, `tel:`, `sms:`, `ftp:`, `javascript:`, ...) are skipped.
Rather than maintaining a denylist of such schemes, the checker validates only
`http(s)`/local links and skips everything else, with an **optional mode to log
non-HTTP links** so they can be reviewed.

Finally, this guide evaluates **build vs. buy** for the external per-URL check
(section 9): implement it directly in AkashaRender (the default), while also
letting a site author who prefers the popular
[`link-check`](https://www.npmjs.com/package/link-check) package install it in
*their own* project and have the plugin load it on demand via dynamic `import()`
— so `link-check` is never a dependency of AkashaRender itself.

## Architecture Pages

There is no dedicated architecture page for link checking yet. The closest
existing design is the sitemap validator, which also walks rendered output and
maps URLs to files:

- [Sitemap Validation Architecture](../architecture/sitemap-validation.md) —
  URL-to-filesystem mapping and a post-build validator design that this feature
  reuses conceptually.
- [Sitemap Validation Implementation](./sitemap-validation.md) — the
  `SitemapValidator` class and CLI pattern.

Relevant concept pages:

- [Built-in Plugin](../concepts/built-in-plugin.md) — where this feature lives.
- [Custom Elements](../concepts/custom-elements.md) — the Mahafunc mechanism
  the Built-in Plugin already uses to process `<a>` links.
- [Lifecycle Hooks](../concepts/lifecycle-hooks.md) — `onSiteRendered` is where
  the whole-site link scan runs.
- [Cache Schema](../concepts/cache-schema.md) and
  [Database Indexing](../concepts/database-indexing.md) — the `DOCUMENTS` /
  `ASSETS` tables that back internal-link resolution.

## Architecture

### 1. Summary of the approach

The Built-in Plugin already looks at every `<a>` element during rendering in
the `AnchorCleanup` Munger (source:
[lib/built-in.ts](../../lib/built-in.ts) lines 1116-1276), and already
resolves local hrefs against the documents cache and assets cache. That is
exactly the information a link checker needs. The recommended design has two
complementary parts:

1. **Internal-link checking during rendering** — extend the existing
   `AnchorCleanup` processing so that, when a local link cannot be resolved in
   the caches, the failure is reported through the configured severity mode
   instead of the current bare `console.log("WARNING: …")`
   ([lib/built-in.ts](../../lib/built-in.ts) line 1216).

2. **A whole-site link scan in `onSiteRendered`** — after the site is fully
   rendered, walk the rendered HTML files, collect every `href`/`src`, resolve
   internal links against the caches and (optionally) check external links over
   HTTP. This is where external checking belongs because it is slow and should
   run once, deduplicated, at the end. `onSiteRendered` already exists on the
   Built-in Plugin ([lib/built-in.ts](../../lib/built-in.ts) line 217) and
   is invoked by `config.hookSiteRendered()`
   ([lib/index.ts](../../lib/index.ts) lines 1348-1360).

Do both. Part 1 gives per-document context (the source file that contains the
bad link) for internal links cheaply, and Part 2 catches links introduced in
layouts/partials and does the external checks. If simplicity is preferred for a
first pass, Part 2 alone covers all links; Part 1 is an enhancement that
improves error messages.

### 2. How internal links are validated (cache lookup)

An internal (local) link resolves to a rendered file. The cache already answers
this question. The existing `AnchorCleanup` logic is the template
(source: [lib/built-in.ts](../../lib/built-in.ts) lines 1120-1218):

```js
const uHref = new URL(href, 'http://example.com');
// If the origin is still http://example.com the link is LOCAL.
if (uHref.origin !== 'http://example.com') return "ok"; // external
// Resolve the vpath-relative href to an absolute site path
let absolutePath = resolveVpath(metadata.document.path, href);
// Try the assets cache, then the documents cache
let foundAsset = await assets.find(absolutePath);
if (foundAsset) return "ok";
if (this.config.askPluginsLegitLocalHref(absolutePath)) return "ok";
if (absolutePath === '/') absolutePath = '/index.html';
let found = await documents.find(absolutePath);
if (!found) { /* THIS is a broken internal link */ }
```

Key facts about the cache lookup:

- `documentsCache.find(path)` and `assetsCache.find(path)` accept either a
  `vpath` **or** a `renderPath` and return the matching entry or `undefined`
  (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)
  lines 745-810). A leading `/` is stripped automatically.
- A link that ends in `/` or names a directory maps to `index.html`; the
  existing code already special-cases `/` → `/index.html` and directory
  entries → `path.join(absolutePath, "index.html")`
  ([lib/built-in.ts](../../lib/built-in.ts) lines 1210-1229).
- `config.askPluginsLegitLocalHref(absolutePath)` gives other plugins a chance
  to declare a local href legitimate even when no file exists yet
  (source: [lib/index.ts](../../lib/index.ts) lines 1498-1507). The link
  checker **must** honor this so plugin-generated paths are not falsely
  reported.
- **Fragments and query strings** (`#anchor`, `?x=1`) must be stripped before
  the cache lookup. Use `uHref.pathname`, not the raw href. Deep fragment
  checking (does `#anchor` exist in the target HTML?) is out of scope for the
  first version; note it as a future enhancement.

So the internal-link algorithm is: parse the href; if it is local, strip
fragment/query, resolve to an absolute site path, and confirm the path (or its
`index.html`) exists in the assets cache or documents cache, or is claimed by a
plugin. If none match, it is a broken internal link and is reported through the
configured `internal` severity mode.

### 3. How external links are validated (HTTP) — best practice

External links cannot be checked against the cache; the only way to know if
`https://other.example/page` exists is to make an HTTP request and inspect the
response. The best-practice recipe, distilled from the maintained
[`linkinator`](https://www.npmjs.com/package/linkinator) checker and the
canonical (now unmaintained) [`broken-link-checker`](https://www.npmjs.com/package/broken-link-checker),
is:

**Method: HEAD first, fall back to GET.** A `HEAD` request is cheapest (no
body), but many servers mishandle it (returning `405`/`501`/`400`, or a
different status than `GET`). So: issue `HEAD`; if it returns `405`/`501`/`400`
(or fails outright), retry with `GET` using a `Range: bytes=0-0` header and
abort the body once headers arrive. Node 24's global `fetch` does not download
the body until it is read, so you can inspect `res.status` and then
`controller.abort()`.

**Status-code interpretation:**

| Outcome | Codes | Meaning |
| --- | --- | --- |
| OK | `2xx`, and `3xx` when redirects are followed to a working target | link is good |
| Broken | `404`, `410`, and DNS/TLS/connection errors (`ENOTFOUND`, `ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`, cert errors) | dead link |
| Ambiguous → warn/skip by default | `401`, `403`, `405`, `429`, `999`, and `5xx` | the resource often exists but the checker is blocked or throttled |

Bot-blocking (Cloudflare `403` with a `cf-mitigated` header, LinkedIn `999`),
JS-only pages, and rate limits (`429`) make external checking inherently flaky.
Treat ambiguous codes as **warn** (or skip), never as hard failures, unless the
user opts into strict mode.

**Robustness details** (mirror `linkinator`/`blc`):

- Send a browser-like **User-Agent** (blank/programmatic UAs are frequently
  `403`-blocked); make it configurable.
- Set a **timeout** with `AbortSignal.timeout(ms)` (default ~10 s).
- **Follow redirects** with a max hop count (5–10) and detect loops via a
  visited-URL `Set`; optionally warn on redirects for link hygiene.
- **Retry with backoff + jitter** on `429`/`503` and transient network errors,
  honoring the `Retry-After` header. Never retry `404`/`410`.
- **Concurrency limits**, including a per-host cap, to be a polite crawler.
- **Deduplicate** URLs (normalize host case, strip default ports and fragments)
  and **cache results** (including negatives) for the run.

**Node.js implementation:** prefer the built-in global `fetch` (stable in Node
24) plus `AbortSignal.timeout()` / `AbortController`; no new dependency is
strictly required. `linkinator` is the recommended off-the-shelf library if a
dependency is acceptable — it is actively maintained and already implements
per-status-code actions, redirect policy, retry/jitter, and bot-protection
skipping. A minimal `checkUrl(url)` reference implementation using `fetch` is
included in section 8.

**Caching between runs (recommended, optional):** AkashaRender already keeps an
in-memory / on-disk SQLite database. Add a `LINK_CHECKS` table keyed by
normalized URL with `(status, state, checked_at)` and a TTL (e.g. 1 hour, as
`blc` defaults). Skip re-checking URLs verified within the TTL so repeated CI
builds do not re-hit the whole web.

Because external checking is slow and flaky, it should be **opt-in**: the
`external` mode defaults to `'ignore'` (off) and a user opts in by setting it to
`warn`/`error`/`fatal`. Internal checking is cheap and reliable enough to
default to `warn`.

**External whitelist (do-not-check specific domains).** Distinct from the
`ignore` mode that turns checking off entirely, the checker needs a configurable
**whitelist of external domains (or URLs) that are skipped while external
checking is otherwise on** — assumed valid and never fetched. This is essential
in practice:

- **Bot-blocked hosts.** Sites behind Cloudflare/WAFs, LinkedIn (`999`),
  Amazon, X/Twitter, and many others return `403`/`429`/`999` to any automated
  client even though the link is perfectly good for a human. A whitelist lets
  the user assert "these are fine, stop bothering them" instead of drowning in
  false `warn`s.
- **Auth-walled or paywalled resources** (`401`) that exist but the checker
  cannot reach.
- **Deliberately rate-limited or fragile endpoints** the site links to but does
  not want hammered on every build.
- **Politeness and speed.** Whitelisted URLs are skipped entirely — no HTTP
  request is made — which also speeds up the run.

The whitelist is primarily a **domain** list: an entry such as `'linkedin.com'`
matches any URL on that host (and its subdomains). For flexibility it also
accepts an exact URL string (matched as a URL prefix) or a `RegExp` matched
against the full URL. A whitelisted external URL is treated as `OK` without any
network access.

**`ignore` mode vs. `whitelist` — two different scopes.** These control link
checking at two different granularities and must not be confused:

- **`ignore`** is the **`ignore` severity mode** (one of `ignore | warn | error
  | fatal`, see section 4). Setting `internal: 'ignore'` or `external: 'ignore'`
  **completely turns off link checking** for that class of link — no cache
  lookup, no HTTP request, nothing is reported. This is the master on/off knob:
  the whole feature is off precisely when both `internal` and `external` are
  `'ignore'`.
- **`whitelist`** is *not* a mode. It is a per-**domain** exclusion applied only
  while external checking is otherwise **on** (`external` is `warn`/`error`/
  `fatal`). A URL whose host matches a whitelist entry is skipped — assumed
  valid and never fetched — while every other external URL is still checked.

In short: `ignore` mode disables checking wholesale; `whitelist` carves out
specific domains from an otherwise-enabled external check. This mirrors the
`whitelist`/`addWhitelistEntry` mechanism already provided by the external-links
plugin (source:
[../akashacms-external-links/index.mjs](../../../akashacms-external-links/index.mjs)
lines 66-69).

**Non-HTTP schemes — allowlist, do not denylist.** A link's scheme may be
`mailto:`, `tel:`, `sms:`, `data:`, `javascript:`, `ftp:`, `ftps:`, `file:`,
`geo:`, `bitcoin:`, `magnet:`, `irc:`, `ircs:`, `xmpp:`, `webcal:`, `news:`,
`nntp:`, `callto:`, `skype:`, `whatsapp:`, `maps:`, `market:`, `intent:`,
`view-source:`, `blob:`, `chrome:`, `about:`, or any of the many other
[registered URI schemes](https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml),
plus a bare `#` fragment. Trying to enumerate every skippable scheme is a losing
game. The robust rule is the **inverse**: the link checker only knows how to
validate `http:` and `https:` URLs (over the network) and same-site paths (via
the cache), so it should **check only those** and treat *every other scheme as
non-checkable and skip it*. That is scheme-agnostic and future-proof — a new or
exotic scheme is skipped automatically, with no config to maintain.

Determine the scheme with `new URL(href, base).protocol` (an anchor-relative or
root-relative path such as `/x`, `x.html`, or `#frag` resolves against the
document base and yields the base's `http:`/`https:` protocol, so real internal
links are *not* treated as non-HTTP). A `#`-only href (empty path, only a
fragment) is skipped as a same-page anchor.

**Optional logging of non-HTTP links (`reportOtherSchemes`).** Silently
dropping non-HTTP links is the safe default, but it is genuinely useful to *see*
them — to catch a typo'd scheme (`htp://…`, `mail:foo`), a stray
`javascript:void(0)`, or `mailto:` addresses worth reviewing. Add an optional
mode, `reportOtherSchemes`, using the **same four-mode enum** as the link
severities:

- `'ignore'` (default) — skip non-HTTP links silently, as today.
- `'warn'` — log each non-HTTP link (scheme, href, and source document) as a
  notice, then skip it. This gives an inventory without failing the build.
- `'error'` / `'fatal'` — available for strict projects that want to forbid
  certain link shapes, routed through the same reporter/`finish()` contract as
  the other modes.

When `reportOtherSchemes !== 'ignore'`, the scan collects every non-HTTP,
non-same-page-anchor link and reports it through the reporter at that mode
(deduplicated per unique href). This replaces the earlier fixed `skipSchemes`
list: there is no scheme denylist to maintain — anything that is not `http:`,
`https:`, or a resolvable local path is a "non-HTTP link," optionally logged.

A corresponding **blacklist** (external URLs/hosts that should *always* be
reported as broken regardless of HTTP result) is a reasonable but optional
extension; it is noted as a future enhancement rather than part of the first
version.

### 4. The four severity modes

Model the modes as a small enum used by a central reporter. Define separate
modes for internal and external links (their reliability differs), plus a
recommended default:

```ts
type LinkCheckMode = 'ignore' | 'warn' | 'error' | 'fatal';
```

The mode is consulted at two points: (1) up front, to decide whether to check a
class of link at all — when the mode is `'ignore'` that class of link checking
is **skipped entirely** (no cache lookup, no HTTP request); and (2) when a bad
link is found, to decide how loudly to report it.

Behavior of the reporter, `reportBadLink(mode, kind, href, sourceDoc, detail)`:

- **ignore** — link checking for this class is off; nothing is checked and
  nothing is reported. This is the way to turn the feature (or just internal or
  just external checking) completely off.
- **warn** — `console.warn` a structured message; continue.
- **error** — `console.error` and push the failure onto a
  `#linkErrors` array on the plugin; continue. At the very end of
  `onSiteRendered`, if `#linkErrors` is non-empty, throw a single `Error`
  summarizing all of them. Because `onSiteRendered` is awaited inside
  `config.hookSiteRendered()` and wrapped by `render.ts`
  (source: [lib/render.ts](../../lib/render.ts) lines 834-842, 1083-1090),
  throwing there makes `render` reject and the CLI exits non-zero — i.e. the
  *run* fails, but only after all links were checked and reported.
- **fatal** — `console.error` and immediately `throw` from the point of
  detection, aborting the rest of the scan (and the build).

The distinction between **error** and **fatal**: *error* is "collect all
problems, then fail the build at the end" (good for CI, gives a complete
report); *fatal* is "stop at the first bad link" (fast feedback while editing).

### 5. Configuration API (matching the built-in plugin pattern)

The example project configures the built-in plugin by property assignment after
`config.prepare()`
(source: [../akashacms-example/config.mjs](../../../akashacms-example/config.mjs)
line 218):

```js
config.plugin('akashacms-builtin').pathIndexes = '/tags/';
```

Follow the same style. Store options under `this.options` in `configure()` (the
Built-in Plugin already keeps `this.options` — see
[lib/built-in.ts](../../lib/built-in.ts) lines 51-65) and add both a plain
options block and chainable setter methods modeled on the external-links plugin
(`setShowFavicons`, `addBlacklistEntry` — source:
[../akashacms-external-links/index.mjs](../../../akashacms-external-links/index.mjs)
lines 56-89).

Default options set in `configure()`:

```js
this.options.checkLinks = Object.assign({
    // Each class of link has a mode.  'ignore' means "do not check at all",
    // so it is also the off switch: internal:'ignore' + external:'ignore'
    // disables the whole feature.  External defaults to 'ignore' because it
    // is slow and flaky (opt-in); internal is cheap so it defaults to 'warn'.
    internal: 'warn',        // ignore | warn | error | fatal
    external: 'ignore',      // ignore | warn | error | fatal
    whitelist: [],           // external domains/URLs skipped while external checking is on
    // Only http:/https: links (and local paths) are checked; anything else
    // (mailto:, tel:, sms:, ftp:, javascript:, ...) is a "non-HTTP link".
    // This controls what happens to those: ignore | warn | error | fatal.
    reportOtherSchemes: 'ignore',
    userAgent: 'Mozilla/5.0 (compatible; AkashaLinkCheck/1.0; +https://akashacms.com)',
    timeoutMs: 10000,
    maxRedirects: 8,
    concurrency: 10,
    cacheTTLms: 3600000,     // reuse external results within an hour
    // Which per-URL external checker to use (see section 9, build vs. buy):
    // 'fetch'      = built-in zero-dependency implementation (default);
    // 'link-check' = lazy import() of the link-check package, which the site
    //                author installs in THEIR project (not a dependency of
    //                AkashaRender).  Loaded on demand only when selected.
    externalChecker: 'fetch',
}, this.options.checkLinks || {});
```

Two equivalent ways for a user to configure it in `config.mjs`:

```js
// (a) Property assignment, as the example already does for pathIndexes:
config.plugin('akashacms-builtin').checkLinks = {
    internal: 'error',       // check internal links, fail the build on a bad one
    external: 'warn',         // check external links, only warn
    // Skip external checking for these domains/URLs (assumed valid, never fetched):
    whitelist: [ 'linkedin.com', 'twitter.com', /^https:\/\/www\.amazon\./ ],
    // Log non-http/https links (mailto:, tel:, ...) instead of silently skipping:
    reportOtherSchemes: 'warn',
};

// Turn link checking completely off with the 'ignore' mode:
config.plugin('akashacms-builtin').checkLinks = {
    internal: 'ignore',
    external: 'ignore',
};

// (b) Chainable setter methods (add these to BuiltInPlugin):
config.plugin('akashacms-builtin')
    .setInternalLinkMode(config, 'error')
    .setExternalLinkMode(config, 'warn')          // use 'ignore' to disable
    .setOtherSchemesMode(config, 'warn')          // log mailto:/tel:/... links
    .addLinkCheckWhitelist(config, 'linkedin.com');
```

Add these methods to `BuiltInPlugin` (each returns `this` for chaining):

```ts
setInternalLinkMode(config, mode)    { assertMode(mode); this.options.checkLinks.internal = mode; return this; }
setExternalLinkMode(config, mode)    { assertMode(mode); this.options.checkLinks.external = mode; return this; }
setOtherSchemesMode(config, mode)    { assertMode(mode); this.options.checkLinks.reportOtherSchemes = mode; return this; }
addLinkCheckWhitelist(config, entry) { this.options.checkLinks.whitelist.push(entry); return this; }
```

`assertMode()` throws if the string is not one of the four modes
(`ignore | warn | error | fatal`), giving a clear configuration error early.
There is no separate "enabled" flag: setting a mode to `'ignore'` is how
checking is turned off, so `internal: 'ignore'` + `external: 'ignore'` disables
the feature entirely.

Each `whitelist` entry is primarily a **domain** string — `'linkedin.com'`
matches `https://www.linkedin.com/in/...` and its subdomains — but also accepts
an exact/prefix URL string or a `RegExp` matched against the full URL. Provide a
small helper, `isWhitelisted(url, whitelist)`, used by the external checker.

### 6. Where the code goes

Keep the reusable logic in a new module and wire it into `built-in.ts`:

```
lib/
├── link-checker.ts        # NEW: LinkChecker class, modes, HTTP checkUrl, reporter
├── built-in.ts            # MODIFIED: default options + setters; call LinkChecker
│                          #           from onSiteRendered; report from AnchorCleanup
└── index.ts               # OPTIONAL: export LinkChecker / LinkCheckMode types
```

`lib/link-checker.ts` — a `LinkChecker` class:

```ts
export type LinkCheckMode = 'ignore' | 'warn' | 'error' | 'fatal';

export class LinkChecker {
    #config; #options; #akasha;
    #errors: Array<{ kind, href, source, detail }> = [];
    #externalCache = new Map<string, { state, status }>();

    constructor(config, akasha, options) { /* ... */ }

    // Resolve one link; called per href discovered.  Classifies by scheme:
    // same-page anchor -> skip; non-http(s) -> #reportOtherScheme;
    // otherwise internal/external check.
    async checkLink(href: string, sourceDoc: string): Promise<void>;

    // Non-http/https links: log via reportOtherSchemes mode, then skip.
    #reportOtherScheme(href, sourceDoc): void;

    // Internal: cache lookup (mirrors AnchorCleanup)
    async #checkInternal(href, absolutePath, sourceDoc): Promise<void>;

    // External: HEAD-then-GET over fetch, with dedupe + cache
    async #checkExternal(url, sourceDoc): Promise<void>;

    // Central severity handler
    #report(mode: LinkCheckMode, kind, href, sourceDoc, detail): void;

    // Called at end of onSiteRendered; throws if mode==='error' collected any
    finish(): void;
}
```

`built-in.ts` changes:

1. In `configure()`, add the `checkLinks` default options block (section 5) and
   the setter methods.
2. In `AnchorCleanup.process()`, replace the bare
   `console.log("WARNING: Did not find …")`
   ([lib/built-in.ts](../../lib/built-in.ts) line 1216) with a call into the
   plugin's reporter using the `internal` mode — but only when
   `internal !== 'ignore'`. When the mode is `'ignore'` this class of checking
   is off, preserving current behavior.
3. In `onSiteRendered()` (after the existing image-resize loop —
   [lib/built-in.ts](../../lib/built-in.ts) lines 217-274), when
   either `internal` or `external` is not `'ignore'`, run the whole-site scan:
   iterate the documents
   cache for rendered HTML (`documentsCache.search({ renderpathmatch: '\\.html$' })`,
   the same query the sitemap generator uses — source:
   [sitemap-validation architecture](../architecture/sitemap-validation.md)),
   read each rendered file from `config.renderDestination`, extract `href`/`src`
   attributes (parse with Mahabhuta/`cheerio`, which is already a dependency),
   and call `linkChecker.checkLink(href, doc.renderPath)` for each. Finally call
   `linkChecker.finish()`.

### 7. Whole-site scan details

- Read rendered HTML from `path.join(config.renderDestination, doc.renderPath)`
  (`renderDestination` getter: [lib/index.ts](../../lib/index.ts) line 1124).
- Parse with `mahabhuta.parse(html)` (already used throughout the plugin) and
  select `a[href]`, `link[href]`, `script[src]`, `img[src]`.
- **Classify each link by scheme first.** Resolve `new URL(href, base)` and
  read `.protocol`:
  - A bare `#`-only href (empty path, fragment only) is a same-page anchor —
    skip it silently.
  - If the protocol is **not** `http:`/`https:`, it is a **non-HTTP link**
    (`mailto:`, `tel:`, `sms:`, `ftp:`, `javascript:`, ...). Do not try to
    validate it; instead route it through `reportOtherSchemes` (report at that
    mode, or skip when `'ignore'`). Deduplicate per unique href.
  - Otherwise classify local vs. external using the
    `new URL(href, 'http://example.com')` origin trick already used in the
    plugin, and skip the whole class if its mode is `'ignore'` (internal links
    when `internal === 'ignore'`, external links when `external === 'ignore'`).
- **Whitelist first**: before queuing any external URL for an HTTP request,
  drop URLs that match a `whitelist` entry (`isWhitelisted(url, whitelist)`) —
  they are recorded as `OK` and never fetched. Do this at dedupe time so a
  whitelisted host costs nothing.
- **Deduplicate**: collect all unique local paths and all unique external URLs
  first, then check each once. This is important — the same external URL appears
  on many pages; checking it once per run is the difference between a fast and an
  unusably slow build.
- **Concurrency**: run external checks through a bounded pool (a small
  `p-limit`-style helper or a hand-rolled worker count = `options.concurrency`),
  with a per-host cap.

### 8. External check reference implementation

```ts
async function checkUrl(url, { userAgent, timeoutMs, maxRedirects, whitelist }): Promise<{ state, status }> {
    // Whitelisted external URLs are assumed valid and never fetched.
    if (isWhitelisted(url, whitelist)) return { state: 'OK', status: 0 };
    const headers = { 'user-agent': userAgent, accept: '*/*' };
    let res = await request(url, 'HEAD', headers, timeoutMs);
    if (!res || [400, 403, 405, 501].includes(res.status)) {
        res = await request(url, 'GET', { ...headers, range: 'bytes=0-0' }, timeoutMs);
    }
    return classify(res);
}

async function request(url, method, headers, timeoutMs) {
    const ac = new AbortController();
    const signal = AbortSignal.any([ac.signal, AbortSignal.timeout(timeoutMs)]);
    try {
        const res = await fetch(url, { method, headers, redirect: 'follow', signal });
        ac.abort();  // never download the body; we only need status + headers
        return { status: res.status };
    } catch (err) {
        return { status: 0, error: err.code ?? err.name };  // ENOTFOUND, TimeoutError, ...
    }
}

function classify(res) {
    const s = res.status;
    if (s >= 200 && s < 400)                         return { state: 'OK', status: s };
    if (s === 404 || s === 410)                      return { state: 'BROKEN', status: s };
    if ([401, 403, 405, 429, 999].includes(s))       return { state: 'WARN', status: s };
    if (s >= 500)                                    return { state: 'WARN', status: s };
    if (s === 0)                                     return { state: 'BROKEN', status: s };  // configurable
    return { state: 'WARN', status: s };
}
```

The `LinkChecker` maps the returned `state` to the configured `external`
severity mode: `BROKEN` → report at the mode; `WARN` → report at `warn` (never
escalate above `warn` unless the user set a stricter mode explicitly); `OK` →
nothing.

### 9. Build vs. buy — the `link-check` package

The reference implementation in section 8 is small, but a mature package,
[`link-check`](https://www.npmjs.com/package/link-check) by Thomas Cort, already
does the per-URL HTTP check. It is worth evaluating whether to depend on it
rather than hand-rolling `checkUrl`.

#### 9.1 What `link-check` provides

As of v5.6.0 (source: the
[link-check npm page](https://www.npmjs.com/package/link-check) and
[GitHub repo](https://github.com/tcort/link-check)):

- **Exactly the HEAD-then-GET liveness check** this design calls for: it does an
  HTTP HEAD and, on failure (e.g. `405 Method Not Allowed`), retries with GET;
  redirects are followed.
- **`aliveStatusCodes`** — an array of acceptable status codes that may include
  `RegExp` (e.g. `[ 200, /^[45][0-9]{2}$/ ]`), covering the "which codes count
  as OK" policy from section 3.
- **`retryOn429`** with `retryCount` and `fallbackRetryDelay`, honoring the
  `Retry-After` header per RFC 7231 — the retry/backoff behavior section 3
  recommends.
- **`timeout`**, custom **`user_agent`**, arbitrary **`headers`** (e.g. Basic
  auth), and a **`baseUrl`** for relative links.
- **`anchors`** support: given the set of anchors on the target page it can
  validate `#fragment` links — a feature this design deferred as future work.
- **`mailto:` verification** via `node-email-verifier` (validates the address
  syntax / optionally MX records).
- Result shape `{ link, status: 'alive' | 'dead', statusCode, err }`.

#### 9.2 What it does *not* provide

`link-check` deliberately checks **one URL at a time**. Everything that makes
this feature a *site* link checker is out of scope and would still have to be
built here:

- **No internal-link resolution.** The whole cache-lookup half of this feature
  (section 2 — resolving a local href against the documents/assets cache and
  `askPluginsLegitLocalHref`) is unrelated to `link-check` and is the part that
  is genuinely AkashaRender-specific. `link-check` only helps with external
  URLs.
- **No crawling / HTML extraction.** It does not read rendered files or pull
  `href`/`src` out of the HTML; the `onSiteRendered` whole-site scan (section 7)
  is still ours.
- **No concurrency, per-host rate limiting, dedupe, or result caching.** These
  (section 7 and the `LINK_CHECKS` TTL cache) must be layered on top. Running
  `link-check` in a bounded, deduplicated pool is our job.
- **No whitelist / `reportOtherSchemes` / four-mode severity model.** Those are
  our configuration surface; `link-check` returns a raw alive/dead result that
  we still map to a mode.
- **Callback-based API.** It uses a `(err, result)` callback, so it needs a
  `promisify` wrapper to fit the `async` code here. (A sibling package,
  [`link-check`-based `markdown-link-check`](https://www.npmjs.com/package/markdown-link-check),
  shows the same author's higher-level batching but is Markdown-specific and not
  a fit.)
- **Adds a dependency subtree.** 5 direct dependencies (including
  `node-email-verifier` and `ms`) versus zero for the `fetch`-based approach.

#### 9.3 Health signals

Positive: ISC-licensed (permissive, compatible with AkashaRender's Apache-2.0),
very widely used (~233k weekly downloads, 59 dependents), recently published
(within the last month), and its behavior maps almost one-to-one onto section 3.
Cautions: it is a small single-maintainer project (~47 GitHub stars) and the
callback API is dated relative to Node 24's `fetch`.

#### 9.4 Recommendation — implement directly, allow `link-check` as an opt-in

**Build the harness *and* a built-in external check, but let a site author
substitute `link-check` on demand — without AkashaRender depending on it.**

The genuinely valuable and AkashaRender-specific work — internal-link resolution
against the cache, the `onSiteRendered` crawl, dedupe/concurrency/caching, the
whitelist, `reportOtherSchemes`, and the four-mode severity/reporter contract —
is *not* provided by any off-the-shelf package and must be built regardless.
AkashaRender should also ship the default zero-dependency `fetch`-based external
check from section 8, so the feature works out of the box with no extra install.

However, some site authors will prefer the popular, battle-tested `link-check`
(for its `mailto:`/anchor verification and years of real-world hardening). Rather
than adding `link-check` to AkashaRender's own dependencies, make it a
**site-author-owned, optionally-loaded** checker:

1. **The site author installs it in their project.** `link-check` is *not* a
   dependency (nor even a `peerDependency`) of AkashaRender. The author runs
   `npm install --save-dev link-check` in their own project only if they want
   it.
2. **The author tells the plugin to use it** via config, e.g.
   `checkLinks.externalChecker: 'link-check'` (see 9.5).
3. **The plugin loads it lazily with dynamic `import()`.** Only when that config
   value is set does the plugin `await import('link-check')`, resolving the
   package from the *project's* `node_modules`. If it is not installed, the
   plugin fails with a clear, actionable message telling the author to install
   it. The default (`'fetch'`) never imports anything.

This is the same pattern AkashaRender already uses for loading the config file
and plugins at runtime rather than compile time (`await import(configFN)` in
`lib/cli.mjs`; `require(PluginObj)` in `Configuration.use` —
[lib/index.ts](../../lib/index.ts) line 1435). Dynamic `import()` returns a
Promise and works from the compiled CommonJS/ESM output, resolving the
specifier against the caller's module resolution — which, for a plugin running
inside the author's project, includes the author's installed packages.

The result: AkashaRender stays dependency-light and works by default, while an
author who wants `link-check` gets it by installing one package and flipping one
config flag — no fork, no change to the crawl/cache/severity harness.

#### 9.5 Integration mechanics (dynamic `import()` adapter)

Define the internal boundary as a single async function that the whole-site scan
calls once per unique external URL:

```ts
// checkExternalUrl(url, opts) => Promise<{ state: 'OK'|'BROKEN'|'WARN', status }>
```

Select the implementation from `options.checkLinks.externalChecker`:

- `'fetch'` (default) — the section 8 implementation. No import; zero deps.
- `'link-check'` — a thin adapter that lazy-loads and calls the package.

A sketch of the adapter, loaded on demand and cached after first use:

```ts
let _linkCheck; // memoized module reference

async function loadLinkCheck() {
    if (_linkCheck) return _linkCheck;
    try {
        // Resolves from the *project's* node_modules, not AkashaRender's.
        const mod = await import('link-check');
        _linkCheck = mod.default ?? mod;   // ESM default export
        return _linkCheck;
    } catch (err) {
        throw new Error(
            `checkLinks.externalChecker is 'link-check' but the 'link-check' `
          + `package is not installed in this project. Run `
          + `"npm install --save-dev link-check" or set externalChecker to `
          + `'fetch'. (${err.message})`
        );
    }
}

async function checkExternalUrlViaLinkCheck(url, opts) {
    const linkCheck = await loadLinkCheck();
    // link-check is callback-based: (link, opts, (err, result) => ...)
    const result = await new Promise((resolve, reject) => {
        linkCheck(url, {
            timeout: `${opts.timeoutMs}ms`,
            user_agent: opts.userAgent,
            headers: opts.headers,               // optional
            retryOn429: true,
            // Map our alive-code policy onto link-check's aliveStatusCodes:
            aliveStatusCodes: [ 200, 201, 202, 203, 204, /^3\d\d$/ ],
        }, (err, res) => err ? reject(err) : resolve(res));
    });
    // Map link-check's { status:'alive'|'dead', statusCode } to our result:
    if (result.status === 'alive')            return { state: 'OK',     status: result.statusCode };
    if ([401,403,429,999].includes(result.statusCode)
        || result.statusCode >= 500)          return { state: 'WARN',   status: result.statusCode };
    return { state: 'BROKEN', status: result.statusCode };
}
```

Notes:

- **Lazy, memoized import.** `import('link-check')` runs at most once, only when
  the author selected it, and its result is cached for the rest of the run.
- **Clear failure when missing.** A missing package produces the actionable
  message above rather than an opaque module-resolution error.
- **Same boundary, same harness.** Because both checkers return the same
  `{ state, status }` shape, the whole-site scan, whitelist filtering,
  dedupe/concurrency, the `LINK_CHECKS` cache, and the tests (section 10, via the
  injectable checker) are identical regardless of which implementation is
  active.
- **Author-facing setup**, to include in the docs:

  ```shell
  # In the AkashaCMS project (not AkashaRender):
  npm install --save-dev link-check
  ```

  ```js
  // config.mjs
  config.plugin('akashacms-builtin').checkLinks = {
      external: 'warn',
      externalChecker: 'link-check',   // use the installed package
  };
  ```

Do **not** try to replace the internal-link or crawl logic with an external
package — that part has no suitable off-the-shelf equivalent; only the external
per-URL check is delegated.

### 10. Testing strategy

Follow the project testing policy: Node.js built-in test runner (`node:test`)
with `.mjs` files and `test/test-assert.mjs`, run under Node 24 (see the root
`AGENTS.md`). Add `test/test-link-checker.mjs`:

- **Internal, unit-level** — build a small fixture site (a couple of documents
  and an asset), render it, then assert: a link to an existing document/asset
  passes; a link to a missing document is reported; `/` maps to `index.html`;
  a directory link maps to its `index.html`; fragments/queries are stripped
  before lookup; a plugin-claimed href (`askPluginsLegitLocalHref`) is not
  reported.
- **Modes** — drive `reportBadLink` directly: `ignore` checks nothing and
  produces nothing (assert no cache lookup / no fetch happens when a class is
  `'ignore'`); `warn` logs but does not throw and does not fail the run; `error`
  does not throw mid-scan but `finish()` throws; `fatal` throws at detection.
- **External** — do **not** hit the live network in tests. Inject a mockable
  fetch (pass a `fetchImpl` into `LinkChecker`, defaulting to global `fetch`)
  and assert: `200`→OK, `404`→BROKEN, `403`/`429`→WARN, HEAD `405`→GET fallback
  is attempted, timeout→BROKEN, dedupe means a repeated URL is fetched once,
  and the TTL cache is honored.
- **Whitelist** — assert `isWhitelisted()` matches exact URLs, host entries
  (`'linkedin.com'` matches `https://www.linkedin.com/...`), and `RegExp`
  entries; and assert that a whitelisted external URL is reported `OK` and the
  injected fetch mock is **never called** for it.
- **Non-HTTP schemes** — with `reportOtherSchemes: 'ignore'`, assert that
  `mailto:`, `tel:`, `ftp:`, `javascript:`, and a bare `#` produce nothing and
  are never fetched. With `reportOtherSchemes: 'warn'`, assert each non-HTTP
  link (including an exotic/unknown scheme like `spotify:`) is logged with its
  scheme and source and deduplicated, that `http:`/`https:` and local paths are
  *not* logged, and that a `#`-only anchor is still skipped. With `'error'`,
  assert `finish()` throws.
- **Config API** — assert the property-assignment form and the chainable
  setters (`addLinkCheckWhitelist`, `setOtherSchemesMode` included) both
  populate `options.checkLinks`, and that `assertMode` rejects an invalid mode
  string.
- **`link-check` adapter** — with `externalChecker: 'link-check'`, assert that
  the loader maps `{ status: 'alive', statusCode: 200 }` → `OK`, `{ status:
  'dead', statusCode: 404 }` → `BROKEN`, and `403`/`429`/`5xx` → `WARN`; that
  the module is imported at most once (memoized); and that when the package is
  absent the adapter throws the actionable "install link-check" error. Since the
  package should not be a test dependency, stub the dynamic import (e.g. inject a
  loader function, or point the specifier at a local fake) rather than relying on
  a real install.

### 11. Implementation phases

1. **Phase 1 — Internal only.** `LinkChecker` with cache-based internal
   resolution, the four modes, the reporter/`finish()` contract, config options
   + setters, and the `AnchorCleanup` hook. Default `internal: 'warn'`,
   `external: 'ignore'`. Tests for internal + modes.
2. **Phase 2 — Whole-site scan.** Scan rendered HTML in `onSiteRendered`,
   dedupe, and report internal links found in layouts/partials. Add scheme
   classification and the optional `reportOtherSchemes` logging of non-HTTP
   links.
3. **Phase 3 — External checking.** Define the
   `checkExternalUrl(url, opts) => Promise<{ state, status }>` boundary
   (section 9.4) and ship the default `fetch`-based implementation (HEAD→GET),
   classification, the `whitelist` do-not-check list (`isWhitelisted`),
   User-Agent/timeout/redirect/retry, concurrency + per-host cap, in-run dedupe
   cache. Tests with an injected checker/fetch mock.
4. **Phase 4 — Persistent external cache.** `LINK_CHECKS` SQLite table with TTL.
5. **Phase 5 (optional) — `link-check` adapter.** Add the alternative external
   checker that lazy-`import()`s the site-author-installed `link-check` package
   behind the Phase 3 boundary (section 9.5), selectable via
   `checkLinks.externalChecker: 'link-check'`, with a clear error when the
   package is not installed. `link-check` is **not** added to AkashaRender's
   dependencies. Document the author-side setup (`npm install --save-dev
   link-check` + config flag). No other code changes required. Test with the
   `import()` stubbed/mocked.
6. **Phase 6 (optional) — CLI command.** A `check-links` command in
   `lib/cli.ts` (mirroring the sitemap `validate-sitemap` pattern) so link
   checking can run independently of a full render, with `--strict` mapping to
   the `error` mode.

## Sources

- [lib/built-in.ts](../../lib/built-in.ts) — Built-in Plugin: `AnchorCleanup`
  local-link resolution (lines 1116-1276), `onSiteRendered` (lines 217-274),
  options handling in `configure` (lines 51-65).
- [lib/index.ts](../../lib/index.ts) — `hookSiteRendered` (lines 1348-1360),
  `askPluginsLegitLocalHref` (lines 1498-1507), `renderDestination` getter
  (line 1124), `use`/`plugin` lookup (lines 1427-1483).
- [lib/render.ts](../../lib/render.ts) — `hookSiteRendered` invocation and
  error propagation (lines 834-842, 1083-1090).
- [lib/Plugin.ts](../../lib/Plugin.ts) — Plugin base class and options.
- [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts) — `find()`
  by vpath/renderPath (lines 745-810) and `search()` with `renderpathmatch`.
- [../akashacms-example/config.mjs](../../../akashacms-example/config.mjs) —
  built-in plugin configuration style (line 218).
- [../akashacms-external-links/index.mjs](../../../akashacms-external-links/index.mjs) —
  chainable setter pattern and blacklist/whitelist options (lines 56-89).
- [link-check (npm)](https://www.npmjs.com/package/link-check) and
  [tcort/link-check (GitHub)](https://github.com/tcort/link-check) — the
  evaluated external per-URL checker (v5.6.0): HEAD-then-GET, `aliveStatusCodes`,
  429 retry with `Retry-After`, custom UA/headers, `mailto:`/anchor checking,
  ISC license.

## Related Pages

- [Sitemap Validation Architecture](../architecture/sitemap-validation.md)
- [Sitemap Validation Implementation](./sitemap-validation.md)
- [Built-in Plugin](../concepts/built-in-plugin.md)
- [Custom Elements](../concepts/custom-elements.md)
- [Lifecycle Hooks](../concepts/lifecycle-hooks.md)
- [Cache Schema](../concepts/cache-schema.md)
- [Database Indexing](../concepts/database-indexing.md)
- [Implementation index](./README.md)

## Backlinks

*No backlinks yet - this is a new implementation document*
