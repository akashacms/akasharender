---
title: "Vendor Library Plugins Architecture"
type: architecture
Sources:
  - ../bootstrap-icons/index.mjs
  - ../country-flag-icons/index.mjs
  - ../icons-tabler/index.mjs
  - ../akashacms-theme-bootstrap/index.mjs
  - lib/index.ts
  - lib/Plugin.ts
  - lib/cache/vfstack.ts
  - lib/built-in.ts
Categories:
  - plugins
  - assets
  - vendor-libraries
  - icons
  - architecture
date-created: 2026-08-13T23:55:05+0300
last-updated: 2026-08-13T23:55:05+0300
confidence: high
---

# Vendor Library Plugins Architecture

## Query

Describe the architecture for building simple AkashaCMS plugins that make 3rd-party JavaScript / CSS / image (SVG) libraries available to AkashaCMS projects. Four existing packages illustrate the pattern: `@akashacms/theme-bootstrap`, `@akashacms/bootstrap-icons`, `@akashacms/country-flag-icons`, and `@akashacms/tabler-icons`. The last three are simple SVG/font libraries; theme-bootstrap adds a JS/CSS library plus many custom tags and partial templates. In all four cases the core is a 3rd-party library that must be mounted onto the asset directory stack at a virtual path `/vendor/LIBRARY-NAME`, after which CSS and JavaScript tags are registered for inclusion on each page. The architecture must explain how this works and support implementing future libraries of this sort, because there are dozens of icon libraries and other libraries to consider supporting.

## Architecture

### 1. The Core Idea

Every one of these plugins is built around a single, small core mechanism:

> Take a 3rd-party npm package that ships static assets (SVG files, a web font, a CSS file, a JS bundle), **mount that package's asset directory onto the AkashaCMS asset directory stack at a stable virtual path** (`/vendor/LIBRARY-NAME`), and then **register the CSS `<link>` and/or JavaScript `<script>` tags** needed to activate the library on every page.

Once the assets exist under a predictable `/vendor/...` URL, the rest of the website can reference them like any other asset: with `<img src="...">`, `<link>`, `<script>`, CSS `url(...)`, web-font class names, or via optional custom Mahabhuta tags the plugin provides.

Everything else — custom tags, partial templates, helper methods — is an **optional layer** on top of this core. The simplest plugins (icon libraries) stop at the core (source: [../../../bootstrap-icons/index.mjs](../../../bootstrap-icons/index.mjs)). The richest plugin (theme-bootstrap) adds many custom tags and partial templates (source: [../../../akashacms-theme-bootstrap/index.mjs](../../../akashacms-theme-bootstrap/index.mjs)).

This gives a spectrum:

```
Core only ........................ Full theme
bootstrap-icons                    theme-bootstrap
country-flag-icons
tabler-icons (core + one tag + helpers)
```

### 2. Relevant AkashaRender APIs

A vendor-library plugin is an ordinary AkashaCMS plugin: a class extending `akasha.Plugin` (source: [../summaries/lib/Plugin.ts.md](../summaries/lib/Plugin.ts.md)) whose `configure(config, options)` method calls a handful of `Configuration` methods. The APIs that matter for this pattern are described below. See the [Plugin System](../concepts/plugin-system.md) and [Stacked Directories](../concepts/stacked-directories.md) concepts for background.

#### 2.1 `config.addAssetsDir(dir)` — mount the vendor assets

Defined in `lib/index.ts` (source: [../summaries/lib/index.ts.md](../summaries/lib/index.ts.md)):

```js
config.addAssetsDir({
    src: pathIconsPkg,           // absolute fspath to the 3rd-party package dir
    dest: '/vendor/LIBRARY-NAME' // virtual path in the asset stack
});
```

`addAssetsDir` accepts either a plain string (mounted at `/`) or a `dirToMount` object. For vendor libraries **always use the object form** so the assets land at a stable, namespaced `/vendor/...` location rather than polluting the site root.

The `dirToMount` type is defined in `lib/cache/vfstack.ts` (source: [../summaries/lib/cache/vfstack.ts.md](../summaries/lib/cache/vfstack.ts.md)):

```ts
type dirToMount = {
    src: string,          // filesystem path to mount
    dest: string,         // virtual filespace location
    ignore?: string[],    // optional GLOB patterns to exclude
    baseMetadata?: any    // optional metadata applied to every mounted file
};
```

`ignore` is useful for large libraries where you want to exclude, for example, source maps, `package.json`, or documentation subtrees. `baseMetadata` is rarely needed for vendor assets.

Because AkashaCMS asset directories are **stacked** (see the [Stacked Directories](../concepts/stacked-directories.md) concept and the `VFStack` class), mounting at `/vendor/LIBRARY-NAME` means a project can override any individual vendored file by mounting its own directory at the same virtual path and supplying a file of the same name.

#### 2.2 `config.addStylesheet(css)` — register a CSS file

```js
config.addStylesheet({
    href: '/vendor/LIBRARY-NAME/css/library.min.css',
    media: 'screen'          // optional
});
```

The `stylesheetItem` type is `{ href?: string, media?: string }` (source: [../../../lib/index.ts](../../../lib/index.ts)). Registered stylesheets are emitted into the `<head>` of every rendered page by the built-in `ak-stylesheets` processing (source: [../summaries/lib/built-in.ts.md](../summaries/lib/built-in.ts.md)).

#### 2.3 `config.addHeaderJavaScript(script)` / `config.addFooterJavaScript(script)`

```js
config.addFooterJavaScript({ href: '/vendor/LIBRARY-NAME/js/library.min.js' });
```

The `javaScriptItem` type is `{ href?: string, script?: string, lang?: string }` (source: [../../../lib/index.ts](../../../lib/index.ts)). Use `href` to reference a vendored file, or `script` for an inline snippet. Header vs. footer follows the usual rule: libraries whose behavior must be present before body content render go in the header; most front-end JS bundles (e.g. Bootstrap's JS, Popper) go in the footer.

#### 2.4 `config.addPartialsDir(dir)` / `config.addLayoutsDir(dir)` — optional templates

Only used by richer plugins that ship partial templates and/or page layouts:

```js
config.addPartialsDir(path.join(__dirname, 'partials'));
config.addLayoutsDir(path.join(__dirname, 'layout'));
```

These also participate in the stacked-directory system, so a project can override any partial or layout the plugin ships.

#### 2.5 `config.addMahabhuta(...)` — optional custom tags

Used when the plugin provides custom elements (a Mahabhuta `MahafuncArray`) that expand into HTML at DOM-processing time. See §5.

#### 2.6 How a plugin is registered by a project

`config.use(PluginClass, options)` instantiates the plugin and immediately calls `plugin.configure(config, options)` (source: [../summaries/lib/index.ts.md](../summaries/lib/index.ts.md)). So all of the above calls happen synchronously at configuration time, from inside `configure()`.

### 3. Locating the 3rd-party Package Directory

The one non-obvious mechanism in these plugins is finding the on-disk location of the wrapped npm package. The plugin cannot hard-code a path, because the package may be hoisted anywhere in the consuming project's `node_modules` tree. All four plugins use `import.meta.resolve` to resolve the package relative to the plugin's own module, then convert the resulting `file:` URL to a filesystem path (source: [../../../bootstrap-icons/index.mjs](../../../bootstrap-icons/index.mjs)):

```js
// Resolve a file guaranteed to exist in the package (its package.json, or a
// known subdirectory) so we can derive the package's root directory.
const resolvIconsPkg = import.meta.resolve('bootstrap-icons/package.json');
const pathIconsPkg   = path.dirname(new URL(resolvIconsPkg).pathname);
const dirIconsBase   = '/vendor/bootstrap-icons';
```

Two resolution styles appear in the existing code:

- **Resolve `package.json`, then take its `dirname`** — used by `bootstrap-icons`, `country-flag-icons`, `tabler-icons`. This yields the package root, from which subdirectories (`font/`, `3x2/`, `icons/`) are joined as needed.
- **Resolve a `dist` subdirectory directly** — used by theme-bootstrap (source: [../../../akashacms-theme-bootstrap/index.mjs](../../../akashacms-theme-bootstrap/index.mjs)):

  ```js
  const resolvBootstrapPkg = import.meta.resolve('bootstrap/dist');
  const pathBootstrapPkg   = new URL(resolvBootstrapPkg).pathname;
  ```

Both are valid. Resolving `package.json` is the more robust default because `package.json` always exists, whereas resolving a subdirectory depends on that subdirectory being exported/resolvable.

**Recommendation for new plugins:** resolve `LIBRARY/package.json`, take its `dirname`, and `path.join` from there to whichever subdirectory actually holds the assets you want to expose.

### 4. The Four Existing Plugins

#### 4.1 `@akashacms/bootstrap-icons` — pure core

Source: [../../../bootstrap-icons/index.mjs](../../../bootstrap-icons/index.mjs)

- Wrapped package: `bootstrap-icons` (a web font + a directory of SVG files).
- Mounts the whole package at `/vendor/bootstrap-icons`.
- Registers the icon web-font CSS (`/vendor/bootstrap-icons/font/bootstrap-icons.min.css`).
- Provides **no** custom tags or partials.

Usage in a project is entirely by convention: font-class usage (`<i class="bi bi-...">`) works because the CSS is loaded; SVG usage (`<img src="/vendor/bootstrap-icons/icons/....svg">`) works because the assets are mounted. This is the minimal template every new icon library should follow.

Essence:

```js
config.addAssetsDir({ src: pathIconsPkg, dest: '/vendor/bootstrap-icons' });
config.addStylesheet({ href: '/vendor/bootstrap-icons/font/bootstrap-icons.min.css' });
```

#### 4.2 `@akashacms/country-flag-icons` — core + helper methods

Source: [../../../country-flag-icons/index.mjs](../../../country-flag-icons/index.mjs)

- Wrapped package: `country-flag-icons`.
- Mounts **a subdirectory** (`3x2/`) at `/vendor/country-flag-icons`, because only that subtree holds the flag SVGs to expose.
- Registers `flags.css`.
- Adds thin **helper methods** (`hasFlag()`, `countries()`) that re-export the wrapped package's JS API for programmatic use in config files or other plugins.

This shows two refinements over the minimal case: (a) mounting only the relevant subdirectory, and (b) exposing library JS functions as plugin methods.

#### 4.3 `@akashacms/tabler-icons` — core + one custom tag + helpers

Source: [../../../icons-tabler/index.mjs](../../../icons-tabler/index.mjs)

- Wrapped package: `@tabler/icons`, which ships `filled/` and `outline/` SVG trees (and a `categories/` tree).
- Mounts the icons directory at `/vendor/tabler-icons/icons`.
- Adds a **Mahabhuta custom element** `<tabler-icons>` (§5) that expands into either an `<img>` referencing the vendored SVG, or an inline `<svg>` read from disk.
- Adds helper methods for locating icons: `findIcon()`, `findFilledIcon()`, `iconNames()`, `iconCategoryNames()`, etc. These use the AkashaCMS assets cache (`this.akasha.filecache.assetsCache`) to resolve a virtual path to an asset record, and read SVG contents directly from `fspath` for inline embedding.

This plugin is the reference for **icon libraries that want a convenience tag** rather than requiring hand-written `<img>` tags.

#### 4.4 `@akashacms/theme-bootstrap` — full theme

Source: [../../../akashacms-theme-bootstrap/index.mjs](../../../akashacms-theme-bootstrap/index.mjs)

This is the "everything" example. In its `configure()` it:

- Mounts **two** vendor packages:
  - `bootstrap/dist` -> `/vendor/bootstrap`
  - `@popperjs/core/dist` -> `/vendor/popper.js`
- Registers footer JS for Popper and Bootstrap, and the Bootstrap CSS:

  ```js
  config
    .addFooterJavaScript({ href: '/vendor/popper.js/umd/popper.min.js' })
    .addFooterJavaScript({ href: '/vendor/bootstrap/js/bootstrap.min.js' })
    .addStylesheet({ href: '/vendor/bootstrap/css/bootstrap.min.css' });
  ```

- Adds a **partials directory** and a **layouts directory**.
- Registers a large **Mahabhuta array** of custom elements (`<dropdown-menu>`, `<collapse-container>`, `<carousel-container>`, `<card-block>`, `<button-launched-modal>`, and more) plus two `Munger` functions that adjust existing markup (`blockquote`, responsive iframes).

Each custom element mostly gathers attributes and delegates to a partial template via `this.akasha.partial(this.config, template, data)`, with every template overridable by the project (because it is chosen by name and resolved through the stacked partials directories). This is the model for wrapping a **full front-end framework** with rich authoring tags.

### 5. The Optional Custom-Tag Layer (Mahabhuta)

When a plugin provides custom tags, the shape is always:

```js
config.addMahabhuta(mahabhutaArray(options, config, this.akasha, this));

export function mahabhutaArray(options, config, akasha, plugin) {
    const ret = new mahabhuta.MahafuncArray(pluginName, options);
    ret.addMahafunc(new SomeElement(config, akasha, plugin));
    return ret;
}
```

Two base classes are used (both from `akasharender`, re-exported from `mahabhuta`):

- **`CustomElement`** — implements a new element. `get elementName()` names the tag; `async process($element, metadata, dirty)` reads attributes and returns replacement HTML. Two common return strategies:
  - Build the HTML string directly using `doHTMLAttribute(name, value)` to safely emit attributes (see `<tabler-icons>` in [../../../icons-tabler/index.mjs](../../../icons-tabler/index.mjs)).
  - Render a **partial template** with `this.akasha.partial(config, template, data)` (the theme-bootstrap pattern), which keeps markup out of code and lets projects override the template.
- **`Munger`** — matches existing elements via a CSS `selector` and mutates them in place (e.g. `FixBlockquote` adds the `blockquote` class).

For a vendor **icon** library, a single `CustomElement` that resolves a name to a vendored SVG path (and optionally inlines the SVG) is usually all that is wanted. `<tabler-icons>` is the canonical example, supporting `img` vs. `inline` mode and passing through `id/class/width/height/alt/title/style`.

Resolving a vendored asset from within a tag uses the assets cache:

```js
const assets = this.akasha.filecache.assetsCache;
const asset  = await assets.findByPath('/vendor/LIBRARY/.../name.svg');
// asset.vpath  -> URL to use in <img src>
// asset.fspath -> filesystem path to read for inline <svg> embedding
```

### 6. Reference Recipe for a New Vendor-Library Plugin

Use this checklist to wrap any new library. Steps 1–4 are the mandatory core; 5–7 are optional enrichment.

#### Step 0 — Package skeleton

`package.json` (model on the existing icon plugins):

- `"name": "@akashacms/LIBRARY-NAME"`, `"type": "module"`, `"main": "index.mjs"`, `"engines": { "node": ">=24.x" }`.
- `dependencies`: the wrapped 3rd-party library.
- `peerDependencies`: `akasharender`.
- Include the `cheerio` `encoding-sniffer` override block the existing plugins carry, to keep the toolchain consistent.

#### Step 1 — Resolve the package directory

```js
import * as path from 'node:path';
import akasha, { CustomElement, doHTMLAttribute } from 'akasharender';
const mahabhuta = akasha.mahabhuta;

const resolv     = import.meta.resolve('LIBRARY-NAME/package.json');
const pkgPath    = path.dirname(new URL(resolv).pathname);
const vendorBase = '/vendor/LIBRARY-NAME';
```

#### Step 2 — Plugin class + `configure()`

```js
export const pluginName = '@akashacms/LIBRARY-NAME';

export class LibraryPlugin extends akasha.Plugin {
    #config;
    constructor() { super(pluginName); }

    configure(config, options) {
        this.#config = config;
        this.akasha  = config.akasha;
        this.options = options ?? {};
        this.options.config = config;

        // Step 3: mount assets
        config.addAssetsDir({
            src: pkgPath,           // or path.join(pkgPath, 'subdir')
            dest: vendorBase
        });

        // Step 4: register CSS / JS as applicable
        config.addStylesheet({ href: `${vendorBase}/path/to/library.css` });
        // config.addFooterJavaScript({ href: `${vendorBase}/path/to/library.js` });

        // Step 5 (optional): custom tags
        // config.addMahabhuta(mahabhutaArray(this.options, config, this.akasha, this));
    }
}
```

#### Step 3 — Mount the assets

Choose `src` as either the package root or the specific subdirectory holding the assets to expose. Prefer mounting only what is needed; use `ignore` to trim large or irrelevant subtrees.

#### Step 4 — Register CSS / JS

- Web-font icon libraries: `addStylesheet` for the font CSS. That is often all.
- CSS-only libraries: `addStylesheet`.
- JS libraries: `addFooterJavaScript` (or header if load order requires it), plus any companion CSS.
- Pure SVG libraries with no CSS/JS: skip this step; mounting the assets is enough for `<img src="/vendor/...">` usage.

#### Step 5 (optional) — Convenience custom tag

Add a `CustomElement` if authors should write `<library-icon name="...">` instead of hand-written `<img>` tags. Resolve the name to a vendored path via the assets cache; support both `img` and inline `svg` modes; pass through the standard attribute set with `doHTMLAttribute`.

#### Step 6 (optional) — Partials / layouts

For libraries with structured components, ship partial templates and register them with `addPartialsDir` (and `addLayoutsDir` for full themes). Keep markup in overridable templates; keep the code limited to gathering attributes and calling `this.akasha.partial(...)`.

#### Step 7 (optional) — Helper methods & README

- Re-export useful library JS functions as plugin methods (like `country-flag-icons`' `hasFlag()`), and/or add discovery helpers (`iconNames()`).
- Write a README documenting the `/vendor/LIBRARY-NAME/...` URL scheme, the registered CSS/JS, and any custom tags — mirroring the existing plugin READMEs.

### 7. Conventions and Guidance

- **Virtual path namespace.** Always mount under `/vendor/LIBRARY-NAME`. This keeps vendor assets isolated, predictable, documentable, and overridable via the stacked-directory system. When a package has meaningfully distinct asset trees, add a second level (e.g. `/vendor/tabler-icons/icons`, `/vendor/tabler-icons/categories`).
- **Do not copy files at build-authoring time.** Mounting via `addAssetsDir` lets the normal `copyAssets` / render pipeline handle copying into the output directory. Never pre-copy the 3rd-party files into the plugin.
- **Resolve, never hard-code paths.** Use `import.meta.resolve` so the plugin works regardless of `node_modules` hoisting.
- **Keep the core minimal; layer the rest.** The mandatory contribution of a vendor plugin is "mount assets + register CSS/JS." Tags, partials, layouts, and helpers are additive and should not be required for basic usage.
- **Everything is overridable.** Because assets, partials, and layouts all go through stacked directories, projects can shadow any vendored file or template by mounting at the same virtual path — do not defeat this by, e.g., inlining asset contents where a URL reference would do.
- **Node 24 / TypeScript 6.** Per the project guidelines, build, run, and test all of these plugins with Node.js 24 and TypeScript 6.

### 8. Decision Table

| Wrapped library provides | Mount assets | `addStylesheet` | `addFooterJavaScript` | Custom tag(s) | Partials/Layouts |
|---|---|---|---|---|---|
| SVG files only | yes | no | no | optional | no |
| Web font (+ SVG) | yes | yes (font CSS) | no | optional | no |
| CSS framework only | yes | yes | no | optional | optional |
| JS + CSS framework | yes | yes | yes | usually | usually (full theme) |

Reading the table top-to-bottom is exactly the progression from `bootstrap-icons` -> `country-flag-icons`/`tabler-icons` -> `theme-bootstrap`.

## Sources

- [../../../bootstrap-icons/index.mjs](../../../bootstrap-icons/index.mjs) — pure-core icon plugin
- [../../../country-flag-icons/index.mjs](../../../country-flag-icons/index.mjs) — core plus helper methods, subdirectory mount
- [../../../icons-tabler/index.mjs](../../../icons-tabler/index.mjs) — core plus a custom element and asset-cache resolution
- [../../../akashacms-theme-bootstrap/index.mjs](../../../akashacms-theme-bootstrap/index.mjs) — full theme with custom tags, partials, and layouts
- [../../../lib/index.ts](../../../lib/index.ts) — `Configuration` methods: `addAssetsDir`, `addStylesheet`, `addHeaderJavaScript`, `addFooterJavaScript`, `addPartialsDir`, `addLayoutsDir`, `addMahabhuta`, `use`; the `javaScriptItem` / `stylesheetItem` types
- [../../../lib/Plugin.ts](../../../lib/Plugin.ts) — the `Plugin` base class
- [../../../lib/cache/vfstack.ts](../../../lib/cache/vfstack.ts) — the `dirToMount` type and stacked-directory mounting
- [../../../lib/built-in.ts](../../../lib/built-in.ts) — where registered stylesheets and scripts are emitted into the page

## Related Pages

- [Plugin System](../concepts/plugin-system.md)
- [Stacked Directories](../concepts/stacked-directories.md)
- [Configuration summary](../summaries/lib/index.ts.md)
- [Plugin base class summary](../summaries/lib/Plugin.ts.md)
- [VFStack summary](../summaries/lib/cache/vfstack.ts.md)
- [Architecture index](./README.md)

## Backlinks

- [Architecture index](./README.md)
