---
title: "oEmbed Provider Implementation Guide for plugins-base"
type: implementation
Sources:
  - ../akashacms-base/index.mjs
  - lib/index.ts
  - lib/cache/cache-sqlite.ts
  - lib/cache/schema.ts
Categories:
  - oembed
  - plugins-base
  - head-metadata
  - static-site-generation
date-created: 2026-06-27T19:10:00+03:00
last-updated: 2026-06-27T19:10:00+03:00
confidence: high
---

# oEmbed Provider Implementation Guide for plugins-base

## Query

Turn the oEmbed provider architecture into a concrete coding plan: how should
a human or LLM coder implement, in `@akashacms/plugins-base`, an oEmbed
provider that emits precomputed JSON (and optionally XML) files referenced
from `<head>` `<link>` tags, gated by a config-file flag, following the
patterns already in the plugin?

## Architecture Pages

- [oEmbed Provider Architecture for AkashaCMS](../architecture/oembed-provider.md) — the design this guide implements.
- [Sitemap Validation Architecture](../architecture/sitemap-validation.md) — the sister feature that also scans the document cache in `onSiteRendered`.

## Architecture

All work is in `../akashacms-base/index.mjs` plus a small number of new
partials in `../akashacms-base/partials/`. No change to akasharender core is
required — the core post-render hook
(`Configuration.hookSiteRendered` in `lib/index.ts`, which calls
`plugin.onSiteRendered(config)`) already provides the needed entry point.

### Data available from the document cache

The generator reads documents from
`akasha.filecache.documentsCache.search({ renderpathmatch: '\\.html$' })`,
exactly as the existing sitemap code does. Each returned row carries the
fields the payload needs (`lib/cache/schema.ts`, populated in
`lib/cache/cache-sqlite.ts`):

- `renderPath` — output path of the HTML file (e.g. `blog/post.html`).
- `metadata` — the **computed** metadata object. It already contains:
  - `metadata.title` (and/or `metadata.pagetitle`),
  - `metadata.rendered_url` — the absolute URL of the page (built from
    `config.root_url` + render path),
  - `metadata.root_url`,
  - `metadata.publicationDate`,
  - `metadata.document.renderTo` (same as `renderPath`).
- `docMetadata` — the raw frontmatter (use for `author`, custom fields).

This means the payload can be built without re-rendering anything; everything
needed is in `metadata` / `docMetadata`.

### Step 1 — Add the config-flag API (mirror `generateSitemap`)

In `BasePlugin`, add an option setter that mirrors the existing
`generateSitemap(config, doit)` / `this.options.generateSitemapFlag`
pattern (`../akashacms-base/index.mjs`):

```js
generateOEmbed(config, opts) {
    // opts === true | false  OR  an options object.
    if (typeof opts === 'boolean') {
        this.options.oembed = { enabled: opts };
    } else {
        this.options.oembed = Object.assign(
            { enabled: true }, opts || {});
    }
    return this;
}
```

Sub-options stored on `this.options.oembed`:

| Option | Default | Purpose |
| --- | --- | --- |
| `enabled` | `false` | Master on/off flag. |
| `xml` | `false` | Also emit `.xml` and its `<link>`. |
| `providerName` | `config metadata site name` | oEmbed `provider_name`. |
| `cacheAge` | `86400` | oEmbed `cache_age` seconds. |
| `type` | `"link"` | oEmbed response `type` (`link` or `rich`). |
| `layout` | `"sibling"` | `"sibling"` or `"subtree"` file layout. |

Initialise `this.options.oembed = { enabled: false }` in `configure()` if the
caller never calls `generateOEmbed`, so later checks are safe.

### Step 2 — Shared URL/path mapping helper

Both the `<head>` injection and the file writer must agree on where the
oEmbed files live. Add one pure helper so the `<link href>` and the written
file path can never drift:

```js
// Returns { jsonRenderPath, xmlRenderPath, jsonURL, xmlURL }
function oembedTargets(config, htmlRenderPath, opts) {
    let base; // render path without trailing .html
    if (opts.layout === 'subtree') {
        base = 'oembed/' + htmlRenderPath.replace(/\.html$/, '');
    } else { // sibling
        base = htmlRenderPath.replace(/\.html$/, '.oembed');
    }
    const jsonRenderPath = base + '.json';
    const xmlRenderPath  = base + '.xml';
    const toURL = (p) => {
        const u = new URL(config.root_url);
        u.pathname = path.posix.join(u.pathname, p);
        return u.toString();
    };
    return {
        jsonRenderPath, xmlRenderPath,
        jsonURL: toURL(jsonRenderPath),
        xmlURL:  toURL(xmlRenderPath),
    };
}
```

This reuses the same `new URL(config.root_url)` + `pathname` technique the
sitemap generator uses to turn a render path into an absolute URL.

### Step 3 — Per-page `<head>` `<link>` injection (Mahabhuta)

The existing `doLinkRelTag()` / `ak_linkreltag.html.ejs` emit only
`rel` + `href` (no `type`/`title`), so oEmbed needs its own emitter. Add:

1. A new partial `partials/ak_oembed_links.html.njk`:

   ```njk
   <link rel="alternate" type="application/json+oembed"
     href="{{ jsonURL }}" title="{{ title }} oEmbed Profile" />
   {% if xmlURL %}<link rel="alternate" type="text/xml+oembed"
     href="{{ xmlURL }}" title="{{ title }} oEmbed Profile" />{% endif %}
   ```

   Nunjucks auto-escapes `{{ }}`, giving the correct HTML-attribute
   escaping (equivalent to the plugin's `escapeHtmlAttr`).

2. A custom element class registered in `mahabhutaArray()`, alongside
   `LinkRelTagsElement` / `CanonicalURLElement`:

   ```js
   class OEmbedLinksElement extends CustomElement {
       get elementName() { return "ak-oembed-links"; }
       async process($element, metadata, dirty) {
           const plugin = this.config.plugin(pluginName);
           const opts = plugin.options.oembed;
           if (!opts || !opts.enabled) return "";
           const t = oembedTargets(this.config,
               metadata.document.renderTo, opts);
           return this.akasha.partial(this.config,
               "ak_oembed_links.html.njk", {
                   jsonURL: t.jsonURL,
                   xmlURL: opts.xml ? t.xmlURL : null,
                   title: metadata.title
                       || metadata.pagetitle || ""
               });
       }
   }
   ```

   Register it: `ret.addMahafunc(new OEmbedLinksElement(config, akasha, plugin));`

3. Add `<ak-oembed-links></ak-oembed-links>` to the head partial/layout used
   by sites (document this; do not silently inject). A Nunjucks extension
   (`akoembedlinks`) parallel to the existing
   `linkRelTagsExtension` may be added for `.njk` layouts if desired.

When `enabled` is false the element renders to empty string, so leaving the
tag in a shared layout is harmless.

### Step 4 — Per-page file generation (extend `onSiteRendered`)

A plugin exposes a single `onSiteRendered`, and plugins-base already uses it
for the sitemap. **Extend the existing method** so it runs both jobs, each
guarded by its own flag — do not add a second hook. Refactor the current
body into `#generateSitemap(config)` and add `#generateOEmbed(config)`:

```js
async onSiteRendered(config) {
    if (this.options.generateSitemapFlag) {
        await this.#generateSitemap(config);
    }
    if (this.options.oembed && this.options.oembed.enabled) {
        await this.#generateOEmbed(config);
    }
    return "okay";
}
```

`#generateOEmbed`:

```js
async #generateOEmbed(config) {
    const opts = this.options.oembed;
    const documents = await this.akasha.filecache
        .documentsCache.search({ renderpathmatch: '\\.html$' });
    for (const doc of documents) {
        const md = doc.metadata || {};
        const t = oembedTargets(config, doc.renderPath, opts);
        const payload = buildOEmbedPayload(config, doc, opts);

        const jsonOut = path.join(
            config.renderDestination, t.jsonRenderPath);
        await fsp.mkdir(path.dirname(jsonOut), { recursive: true });
        await fsp.writeFile(jsonOut,
            JSON.stringify(payload, null, 2), 'utf8');

        if (opts.xml) {
            const xmlOut = path.join(
                config.renderDestination, t.xmlRenderPath);
            await fsp.mkdir(path.dirname(xmlOut), { recursive: true });
            await fsp.writeFile(xmlOut,
                oembedToXML(payload), 'utf8');
        }
    }
}
```

### Step 5 — Payload builders

```js
function buildOEmbedPayload(config, doc, opts) {
    const md = doc.metadata || {};
    const dm = doc.docMetadata || {};
    const payload = {
        version: "1.0",
        type: opts.type || "link",
        title: md.title || md.pagetitle || "",
        provider_name: opts.providerName
            || (config.metadata && config.metadata.siteName)
            || undefined,
        provider_url: config.root_url,
        cache_age: opts.cacheAge || 86400,
    };
    if (dm.author) payload.author_name = dm.author;
    if (dm.authorURL) payload.author_url = dm.authorURL;
    // Strip undefined keys so JSON stays clean.
    Object.keys(payload).forEach(k =>
        payload[k] === undefined && delete payload[k]);
    return payload;
}

function xmlEscape(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function oembedToXML(payload) {
    let body = "";
    for (const [k, v] of Object.entries(payload)) {
        body += `  <${k}>${xmlEscape(v)}</${k}>\n`;
    }
    return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n`
        + `<oembed>\n${body}</oembed>\n`;
}
```

JSON is produced by `JSON.stringify` (never string-built). XML text is
PCDATA-escaped, matching the spec's escaping requirement and the plugin's
existing `escapeHtmlAttr` philosophy.

### Step 6 — Tests

Add tests in the plugins-base test project (Mocha/Chai, `.mjs`):

1. **Flag off (default):** no `.oembed.json` files produced; no
   `application/json+oembed` `<link>` in rendered `<head>`.
2. **Flag on, JSON only:** for a known page, the sibling `.oembed.json`
   exists under the render destination, parses as JSON, and has
   `version: "1.0"`, correct `type`, and a `title` matching the page.
3. **`<head>` link present:** rendered HTML contains
   `<link rel="alternate" type="application/json+oembed" href="...">` whose
   `href` equals the absolute URL produced by `oembedTargets`, i.e. it
   resolves to the generated file.
4. **XML option:** with `xml: true`, the `.xml` file exists, is well-formed,
   has an `<oembed>` root, and the XML `<link>` is present.
5. **Escaping:** a page whose title contains `&`, `<`, `"` yields correctly
   escaped JSON (via `JSON.stringify`), XML (via `xmlEscape`), and the
   `<link title>` attribute (via Nunjucks auto-escape).
6. **Subtree layout:** with `layout: 'subtree'`, files land under
   `oembed/...` and the `href` matches.

### Implementation order / phasing

1. **Phase 1 — flag + helper:** `generateOEmbed`, `this.options.oembed`
   defaulting, and `oembedTargets`. No output yet.
2. **Phase 2 — file generation:** refactor `onSiteRendered` into
   `#generateSitemap` + `#generateOEmbed`; write JSON files. Test #1, #2.
3. **Phase 3 — head injection:** `ak_oembed_links.html.njk` partial,
   `OEmbedLinksElement`, register in `mahabhutaArray`. Test #3.
4. **Phase 4 — XML + escaping + layout:** `oembedToXML`, `xml`/`layout`
   options. Tests #4, #5, #6.
5. **Phase 5 — docs:** document the config flag, the required
   `<ak-oembed-links>` tag in the head layout, and the MIME-type/deployment
   note (hosts must serve `.json` as `application/json` and `.xml` as
   `text/xml`).

### Gotchas

- **Single `onSiteRendered`:** must not be duplicated; fold oEmbed into the
  existing method (Step 4).
- **MIME types are a deployment concern**, not solvable in the renderer; call
  it out in docs.
- **`metadata` vs `docMetadata`:** computed values (`title`,
  `rendered_url`) live on `metadata`; raw frontmatter (`author`) lives on
  `docMetadata`. Use the right one.
- **Path joining for URLs:** use `path.posix.join` on the URL pathname (not
  `path.join`) so output is correct on Windows.
- **`config.root_url` may or may not end in `/`:** the `new URL(...)` +
  `pathname` approach handles both, as the sitemap code already relies on.

## Sources

- [`../akashacms-base/index.mjs`](../../akashacms-base/index.mjs) — `BasePlugin.generateSitemap`/`generateSitemapFlag`, `onSiteRendered` (document-cache scan), `doLinkRelTag`/`doCanonicalURL`, `mahabhutaArray`, `escapeHtmlAttr`.
- [`../akashacms-base/partials/ak_linkreltag.html.ejs`](../../akashacms-base/partials/ak_linkreltag.html.ejs) — existing rel/href-only link partial that oEmbed must extend with `type`/`title`.
- [`lib/index.ts`](../../lib/index.ts) — `Configuration.hookSiteRendered`, `root_url`, `renderDestination`.
- [`lib/cache/cache-sqlite.ts`](../../lib/cache/cache-sqlite.ts) and [`lib/cache/schema.ts`](../../lib/cache/schema.ts) — document cache fields (`renderPath`, `metadata`, `docMetadata`, `rendered_url`).
- oEmbed specification, <https://oembed.com/> §2.3, §4.

## Related Pages

- [oEmbed Provider Architecture for AkashaCMS](../architecture/oembed-provider.md)
- [Sitemap Validation Implementation Guide](./sitemap-validation.md)
- [Implementation index](./README.md)

## Backlinks

- [oEmbed Provider Architecture for AkashaCMS](../architecture/oembed-provider.md)
- [Implementation index](./README.md)
