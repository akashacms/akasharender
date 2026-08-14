---
layout: ebook-page.html.ejs
title: Checking links with the built-in Link Checker
---

AkashaRender can check the links in your rendered site.  It reports links that
point at pages, assets, or external sites that do not exist.  The feature is
part of the _built-in_ plugin (`akashacms-builtin`), so there is nothing extra
to install for basic use, and it is configured from your `config.mjs` file.

Two kinds of links are checked:

* **Internal links** — links to pages or assets within your own project.
  These are validated by looking them up in AkashaRender's file cache, which
  knows every document and asset that was rendered.  No network access is
  required, so internal checking is fast and reliable.
* **External links** — links to other web sites (`http:` / `https:` URLs).
  These are validated by making an HTTP request and inspecting the response.
  Because the network is slow and other sites are unpredictable, external
  checking is **off by default** and is treated more leniently than internal
  checking.

Any link that is neither an internal path nor an `http:`/`https:` URL — for
example `mailto:`, `tel:`, `sms:`, or `ftp:` links — is a _non-HTTP link_.
These cannot be checked, so they are skipped, but they can optionally be logged
for review.

## When the check runs

Link checking runs automatically at the end of a render (`akasharender render
config.mjs`), after all pages have been written.  The built-in plugin walks
every rendered HTML file, collects the links from `<a href>`, `<link href>`,
`<script src>`, and `<img src>`, and checks each one.  Duplicate links are only
checked once.

If checking is disabled (see the `ignore` mode below), this step is skipped
entirely, so there is no cost when you are not using it.

## Configuration in `config.mjs`

Like the rest of the built-in plugin, the link checker is configured by
setting properties on the plugin object.  This is done the same way the example
project sets other built-in options — by retrieving the plugin with
`config.plugin('akashacms-builtin')` after `config.prepare()`:

```js
import akasha from 'akasharender';

const config = new akasha.Configuration();
config.rootURL("https://example.com");
config.configDir = import.meta.dirname;

config
    .addAssetsDir('assets')
    .addLayoutsDir('layouts')
    .addDocumentsDir('documents')
    .addPartialsDir('partials');

config.prepare();

// Configure the link checker:
config.plugin('akashacms-builtin').checkLinks = {
    internal: 'error',    // fail the build on a broken internal link
    external: 'warn',     // check external links, but only warn
    reportOtherSchemes: 'ignore',
    whitelist: [
        'linkedin.com',
        /^https:\/\/www\.amazon\./
    ]
};

export default config;
```

The `checkLinks` object accepts the following fields:

| Field | Values | Default | Meaning |
|-------|--------|---------|---------|
| `internal` | a mode (see below) | `warn` | How to treat a broken internal link. |
| `external` | a mode | `ignore` | How to treat a bad external link.  `ignore` (the default) turns external checking off. |
| `reportOtherSchemes` | a mode | `ignore` | How to treat non-HTTP links such as `mailto:`. |
| `whitelist` | array of strings / RegExp | `[]` | External domains or URLs that are assumed valid and never fetched. |
| `externalChecker` | `'fetch'` or `'link-check'` | `'fetch'` | Which external checker to use (see below). |
| `userAgent` | string | a browser-like UA | The `User-Agent` header sent when checking external links. |
| `timeoutMs` | number | `10000` | Per-request timeout in milliseconds. |
| `maxRedirects` | number | `8` | Maximum redirects to follow. |
| `concurrency` | number | `10` | Maximum simultaneous external requests. |
| `cacheTTLms` | number | `3600000` | How long an external result is reused within a run. |

### Chainable setter methods

If you prefer, the same options can be set with chainable methods on the
plugin:

```js
config.plugin('akashacms-builtin')
    .setInternalLinkMode(config, 'error')
    .setExternalLinkMode(config, 'warn')      // use 'ignore' to disable
    .setOtherSchemesMode(config, 'warn')      // log mailto:/tel:/... links
    .addLinkCheckWhitelist(config, 'linkedin.com')
    .setExternalChecker(config, 'fetch');
```

## The four modes

Each class of link — internal, external, and non-HTTP (`reportOtherSchemes`) —
is governed by a **mode**.  There are four modes:

* **`ignore`** — Do not check this class of link at all.  Nothing is looked up,
  no request is made, and nothing is reported.  This is how you turn checking
  off.  Setting both `internal` and `external` to `ignore` disables the whole
  feature.

* **`warn`** — Check the links, and print a warning for each bad one, but keep
  going.  The build still succeeds.  This is a good choice for external links,
  which are often flaky.

* **`error`** — Check the links, print an error for each bad one, and keep
  checking the rest of the site — but after all links have been checked, **fail
  the build**.  This gives you a complete list of every problem in one run,
  which is ideal for continuous-integration builds.

* **`fatal`** — Stop immediately at the first bad link and fail the build right
  away.  This gives the fastest feedback while you are editing, at the cost of
  only reporting one problem at a time.

The difference between `error` and `fatal` is _when_ the build stops: `error`
collects every problem and stops at the end; `fatal` stops at the first
problem.

There is no separate "enabled" switch — the `ignore` mode is how you disable a
class of checking.  For example, to turn link checking completely off:

```js
config.plugin('akashacms-builtin').checkLinks = {
    internal: 'ignore',
    external: 'ignore'
};
```

## The whitelist

External checking is inherently unreliable.  Many sites — those behind
Cloudflare or other bot-protection, sites requiring a login, or sites that rate-
limit automated requests — will return an error or refuse a request even though
the link works perfectly well in a browser.  Rather than reporting those as
broken, list the domains in the `whitelist`.  A whitelisted URL is assumed valid
and is never fetched.

Each whitelist entry may be:

* a **domain** name, such as `'linkedin.com'`, which matches that host and any
  subdomain (for example `https://www.linkedin.com/...`);
* an exact or prefix **URL** string, such as `'https://example.com/ok'`; or
* a **regular expression**, matched against the whole URL, such as
  `/^https:\/\/www\.amazon\./`.

```js
config.plugin('akashacms-builtin').checkLinks = {
    external: 'warn',
    whitelist: [
        'linkedin.com',            // domain and subdomains
        'twitter.com',
        /^https:\/\/www\.amazon\./ // regular expression
    ]
};
```

The whitelist is different from the `ignore` mode: `ignore` turns off checking
for an entire class of links, while the whitelist merely excuses specific
domains from an otherwise-enabled external check.

## Logging non-HTTP links

Links such as `mailto:`, `tel:`, `sms:`, and `ftp:` cannot be checked over the
web, so they are skipped.  There are many such URI schemes, and AkashaRender
does not try to validate any of them.  However, it can optionally **log** them
so you can review them — this is useful for catching a mistyped scheme
(`htp://…`), a stray `javascript:` link, or `mailto:` addresses worth checking
by hand.

Use `reportOtherSchemes` with any of the four modes.  It defaults to `ignore`
(skip silently).  Set it to `warn` to list them:

```js
config.plugin('akashacms-builtin').checkLinks = {
    reportOtherSchemes: 'warn'
};
```

## Using the `link-check` package

By default, external links are checked with a small checker built into
AkashaRender, which requires no extra packages.  If you prefer, you can instead
use the popular
[`link-check`](https://www.npmjs.com/package/link-check) package, which is a
well-established, widely-used link checker.  It adds a couple of extra
capabilities, such as verifying `mailto:` addresses and checking page anchors.

AkashaRender does **not** bundle `link-check`.  Instead, you install it in your
own project, and AkashaRender loads it on demand only when you ask for it.  This
keeps AkashaRender lightweight for everyone who does not need it.

To use it:

**1. Install `link-check` in your project** (the same project that contains
your `config.mjs`):

```shell
npm install --save-dev link-check
```

**2. Tell the built-in plugin to use it** by setting `externalChecker` to
`'link-check'`:

```js
config.plugin('akashacms-builtin').checkLinks = {
    external: 'warn',
    externalChecker: 'link-check'
};
```

or, using the setter method:

```js
config.plugin('akashacms-builtin')
    .setExternalLinkMode(config, 'warn')
    .setExternalChecker(config, 'link-check');
```

When `externalChecker` is `'link-check'`, AkashaRender loads the package the
first time an external link needs checking, resolving it from your project's
`node_modules`.  If the package is not installed, you will get a clear error
message telling you to install it (or to switch back to the `'fetch'` checker).
When `externalChecker` is left at its default of `'fetch'`, `link-check` is
never loaded, so its absence never matters.

Everything else — the four modes, the whitelist, non-HTTP-link logging, and
deduplication of repeated links — works exactly the same regardless of which
external checker you choose.

## Summary

* Link checking lives in the built-in plugin and is configured with the
  `checkLinks` object (or the chainable setters) in `config.mjs`.
* Internal links are checked against the file cache; external links are checked
  over HTTP; other schemes are skipped (and optionally logged).
* Each class of link has a **mode**: `ignore`, `warn`, `error`, or `fatal`.
* Use the `whitelist` to excuse specific external domains from checking.
* For external checking you can use the built-in `fetch` checker (the default,
  no install) or the `link-check` package, which you install in your own
  project and enable with `externalChecker: 'link-check'`.
