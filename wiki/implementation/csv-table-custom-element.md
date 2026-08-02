---
title: "csv-table Custom Element Implementation Guide"
type: implementation
Sources:
  - lib/built-in.ts
  - lib/mahafuncs.ts
  - lib/index.ts
  - lib/cache/cache-sqlite.ts
  - package.json
Categories:
  - custom-elements
  - data-tables
  - mahabhuta
  - built-in-plugin
date-created: 2026-08-02T18:44:04+03:00
last-updated: 2026-08-02T19:20:00+03:00
confidence: high
---

# csv-table Custom Element Implementation Guide

## Query

GitHub issue [#85](https://github.com/akashacms/akasharender/issues/85) asks for a
custom tag `<csv-table template="..." file-name="..."/>` that reads a data file
containing a series of rows of identical structure (CSV, and also TSV and certain
YAML structures), and renders that data as an HTML table by formatting each row
with a template. There should additionally be a template for the HTML that
*precedes* the rendered rows (for example `<table>`) and a template for the HTML
that *follows* them (for example `</table>`).

This page turns that request into a concrete coding plan grounded in the existing
custom-element machinery of the Built-in Plugin.

## Architecture Pages

There is no dedicated architecture page for this feature yet. The design is built
directly on existing concept pages:

- [Custom Elements](../concepts/custom-elements.md) — the `CustomElement` base
  class and `process()` contract this feature extends.
- [Built-in Plugin](../concepts/built-in-plugin.md) — where the new element is
  registered.
- [Three-Stage Rendering](../concepts/three-stage-rendering.md) — the DOM
  manipulation stage in which `<csv-table>` is expanded.

## Architecture

### Where this fits

`<csv-table>` is a **custom element**: a Mahabhuta function that matches a custom
tag during the DOM-manipulation stage and replaces it with generated HTML. It is
implemented by extending the `CustomElement` base class
(`lib/mahafuncs.ts`:57-72) and registered in the Built-in Plugin's
`mahabhutaArray` (`lib/built-in.ts`:277-299), exactly like the existing elements
(`StylesheetsElement`, `InsertTeaser`, `FigureImage`, and especially `CodeEmbed`).

The single closest analog is **`CodeEmbed`** (`lib/built-in.ts`:577-649). It
already does most of what `<csv-table>` needs:

1. Reads a `file-name` attribute off `$element`.
2. Resolves it — absolute, or relative to the current document's `renderTo` —
   into a vpath.
3. Looks the vpath up in `this.akasha.filecache.documentsCache` via `find()`.
4. Reads the resolved `found.fspath` with `fsp.readFile(..., 'utf8')`.
5. Returns a string of HTML that replaces the element.

`<csv-table>` follows the same overall shape, but with **two deliberate
differences** driven by the data-file use case:

- **Broader file resolution.** A data file is not necessarily site content: it may
  live in an assets directory, a documents directory, *or* an arbitrary
  filesystem path outside the project entirely (so the raw data is not part of the
  deployed site — see "File resolution" below). `CodeEmbed` only consults the
  documents cache; `<csv-table>` must try assets **and** documents **and** accept
  an external absolute path.
- **Templated output.** After reading the file it (a) parses the text into an
  array of rows, then (b) renders three templates — a *before* template, a *row*
  template per row, and an *after* template — concatenating the results.

### Tag design

```html
<csv-table
    file-name="data/people.csv"
    template="people_row.html.njk"
    before-template="people_before.html.njk"
    after-template="people_after.html.njk"
    format="csv"
    delimiter=","
    header="true" />
```

Attribute semantics:

| Attribute | Required | Default | Purpose |
| --- | --- | --- | --- |
| `file-name` | yes | — | Path to the data file. Resolved against the assets cache, then the documents cache, then (if absolute and existing on disk) directly from the filesystem. See "File resolution". |
| `template` | yes | — | Partial rendered **once per data row**. Receives the row's fields. |
| `before-template` | no | built-in `<table>...<thead>` partial | Rendered once, before the rows. Receives column names. |
| `after-template` | no | built-in `</table>` partial | Rendered once, after the rows. |
| `format` | no | inferred from extension | `csv`, `tsv`, or `yaml`. Falls back to the file extension (`.csv`→csv, `.tsv`/`.tab`→tsv, `.yaml`/`.yml`→yaml). |
| `delimiter` | no | `,` for csv, `\t` for tsv | Overrides the field delimiter for delimited formats. |
| `header` | no | `"true"` | Whether the first row of a delimited file is a header row supplying column names. |

Keeping `file-name` and `template` identical in spelling to `CodeEmbed`/`FigureImage`
keeps the author-facing vocabulary consistent with the rest of the Built-in Plugin.

### File resolution

A data file may live in three kinds of location, and all three must work:

1. **An assets directory** — a file the author is comfortable shipping with the
   site.
2. **A documents directory** — same, and the `CodeEmbed` precedent.
3. **Outside the project directories entirely** — often *preferable*, because a
   raw CSV/TSV/YAML data source should typically **not** be copied into the
   deployed site. Keeping the data file outside `assetsDirs`/`documentsDirs` means
   it is read at build time to generate the table but is never emitted as a
   standalone `.csv`/`.yaml` on the public site.

Resolution order (mirroring the existing assets-then-documents fallback at
`lib/built-in.ts`:239-245, extended with a filesystem fallback):

```ts
// 1. Resolve a relative path against the current document's directory,
//    exactly like CodeEmbed.
let candidate = path.isAbsolute(fn)
    ? fn
    : path.join(path.dirname(metadata.document.renderTo), fn);

// 2. Try the assets cache, then the documents cache (both return {fspath}).
let fspath;
let found = await this.akasha.filecache.assetsCache.find(candidate);
if (found) {
    fspath = found.fspath;
} else {
    found = await this.akasha.filecache.documentsCache.find(candidate);
    if (found) fspath = found.fspath;
}

// 3. External file: if not in either cache, accept a real filesystem path.
//    Absolute paths are used as-is. Relative external paths resolve against
//    config.configDir — the directory of the project's configuration file,
//    the same anchor AkashaRender already uses for relative assetsDirs /
//    documentsDirs (lib/index.ts:735, 908-910).
if (!fspath) {
    const external = path.isAbsolute(fn)
        ? fn
        : path.resolve(config.configDir, fn);
    try {
        await fsp.access(external);        // throws if missing
        fspath = external;
    } catch { /* fall through to the error below */ }
}

if (!fspath) {
    throw new Error(`csv-table file-name ${fn} not found in assets, documents, or on disk`);
}
const text = await fsp.readFile(fspath, 'utf8');
```

**Resolution rules (settled):**

- **Relative external paths resolve against `config.configDir`** — the directory
  containing the project's configuration file (`lib/index.ts`:735). This is the
  same anchor AkashaRender already uses to resolve relative `assetsDirs`,
  `documentsDirs`, `layoutsDirs`, and `partialsDirs` (`lib/index.ts`:908-910), so
  authors get consistent, predictable behavior: a `file-name` like
  `../data/people.csv` is relative to the config file's directory, letting the
  data live one level up (outside the project) without hard-coding an absolute
  path. `config.configDir` is a public accessor (`lib/index.ts`:878-879).
- **Absolute paths are used as-is**, covering data anywhere on disk.

**Additional considerations:**

- **Security / traversal.** Because `file-name` can now escape the project
  directories, treat it as trusted authoring input (it already is — authors write
  the tag), but still document that arbitrary `../` paths are allowed by design so
  it is a conscious choice rather than a surprise. Do **not** expose this via
  untrusted user input.
- **Deployment note.** When a data file *is* placed inside an assets/documents
  directory, it will also be copied to the output; if the intent is to keep the
  raw data private, place it **outside** the project directories and reference it
  by absolute path or via the configured data root.

### The row data model

Every format is normalized to the same shape before templating: an **array of
row objects** plus an ordered **list of column names**.

- **CSV / TSV with a header row** (`header="true"`): the first record supplies the
  column names; each subsequent record becomes an object keyed by those names —
  `{ name: "Alice", city: "Oslo" }`.
- **CSV / TSV without a header** (`header="false"`): column names are positional
  strings `"0"`, `"1"`, … and each row is `{ "0": "Alice", "1": "Oslo" }`; the
  row is also passed as an array under `fields` so positional templates work.
- **YAML**: the file must parse to an **array**. Two sub-cases:
  - array of objects — used directly as the rows; column names are the union of
    keys, preserving first-seen order.
  - array of arrays — treated like a headerless delimited file.
  A YAML file that parses to a non-array is an error (the "series of rows of the
  same structure" contract does not hold).

Each row object handed to the `template` partial is augmented with a few helper
fields so templates can do positional work and index-based styling:

```js
{
    ...rowFields,          // named columns, e.g. { name, city }
    fields: [...],         // positional array of the same values
    columns: [...],        // ordered column-name list (same every row)
    index: 0,              // 0-based row number
    rowNumber: 1           // 1-based row number
}
```

The `before-template` receives `{ columns, rowCount }`, and the `after-template`
receives `{ columns, rowCount }` as well, so a caller can, for example, emit a
`<thead>` from `columns` in the before-template.

### Parsing the formats

`js-yaml` is **already a dependency** (`package.json`:70), so YAML needs no new
package.

For delimited formats, **use a mature, well-tested package — do not hand-roll a
parser**. Correct CSV must handle quoted fields, delimiters embedded in quotes,
newlines embedded in quotes, and escaped quotes (`""`); reimplementing this is a
known source of subtle bugs and is unnecessary when battle-tested parsers exist.

The recommended package is **`csv-parse`** (the `csv` project,
<https://csv.js.org/parse/>). Its synchronous entry point `csv-parse/sync`
provides `parse(text, { columns, delimiter, ... })` returning exactly the
array-of-objects (with `columns: true`) or array-of-arrays (with
`columns: false`) shape described above. It is widely used, actively maintained,
and has no heavy transitive dependencies. Add it to `package.json` `dependencies`.
(`papaparse` is a viable alternative but is browser-oriented; `csv-parse` fits a
Node build better.)

TSV is simply `csv-parse` with `delimiter: '\t'`, so a single code path serves
both CSV and TSV.

Put all parsing in a **pure, exported helper** so it can be unit-tested without
the rendering pipeline:

```ts
// lib/csv-table.ts
export type CsvTableFormat = 'csv' | 'tsv' | 'yaml';

export interface CsvTableData {
    columns: string[];
    rows: Array<Record<string, any>>;   // each already includes fields/columns/index/rowNumber
}

export function inferFormat(fileName: string, explicit?: string): CsvTableFormat { ... }
export function parseTableData(
    text: string,
    format: CsvTableFormat,
    opts: { delimiter?: string; header?: boolean }
): CsvTableData { ... }
```

### Sync vs async: why parsing is synchronous

There are two distinct operations, and only one of them is I/O:

1. **Reading the file** — genuine disk I/O. This is **async** and lives in the
   custom element, not in `parseTableData`:

   ```ts
   const text = await fsp.readFile(fspath, 'utf8');   // node:fs/promises
   ```

   This is the part that can block on the OS, so it correctly uses the
   non-blocking promise API.

2. **Parsing the in-memory string** — pure CPU. `csv-parse/sync`,
   `jsyaml.load()`, and `parseTableData` take a string that is *already in
   memory* and transform it into rows. No I/O happens here.

Using the **synchronous** `csv-parse/sync` for step 2 is deliberate and correct:

- The `csv-parse` package's *async* entry point is a Node **stream Transform**.
  Its asynchrony is about back-pressure while *piping a file stream* through the
  parser — reading and parsing incrementally so the whole file need not be held
  in memory. Since we have **already** read the entire file into `text`,
  streaming buys nothing; the data is fully in memory regardless.
- `async` does **not** make CPU-bound work non-blocking. A function that parses
  an in-memory string occupies the event loop while it runs whether or not it is
  declared `async` or returns a promise. Wrapping synchronous parsing in a
  promise would add no real concurrency — only overhead and API friction. The
  only way to *truly* offload CPU work is a worker thread, which is vastly
  disproportionate for a build-time, author-supplied data table.
- `js-yaml`'s `load()` is synchronous for the same reason: there is no async
  YAML-parse API, because parsing an in-memory string is inherently CPU work.
- Keeping `parseTableData` synchronous makes it a **pure function** — trivial to
  unit-test with a string in and a value out, no `await` or fixtures needed.

Net: **I/O is async (`await fsp.readFile`); parsing is sync** because it is pure
computation on an already-loaded string.

#### Future work: streaming large files

The current design reads the whole file into memory and parses it in one pass.
This is ideal for the expected use case (small, build-time data tables) and is
in fact *required* by the templating model as designed: the `before-template`
receives `rowCount` and the full `columns` union up front, which cannot be known
without seeing the entire dataset.

If AkashaCMS later needs to support **very large** data files, the parse step
should move to a **streaming** pipeline: `fs.createReadStream(fspath)` piped
through the async, stream-based `csv-parse` Transform (and a streaming YAML
parser), emitting rows incrementally. That change is non-trivial because it
interacts with the templating contract:

- `before-template`'s `rowCount`/`columns` could not be computed before the
  first row is emitted. Either compute them in a first streaming pass (two
  passes over the file), or relax the before-template contract (e.g. omit
  `rowCount`, or infer `columns` from the header record only).
- The row loop would render as rows arrive rather than from a materialized
  array, and output would be streamed/concatenated incrementally.

This is explicitly **out of scope** for the initial implementation; it is
recorded here so the streaming option and its templating implications are not
forgotten. Isolating all parsing behind `parseTableData` keeps this future
migration contained to `lib/csv-table.ts` and the element's parse call.

### The custom element

Add to `lib/built-in.ts`. It borrows `CodeEmbed`'s structure but uses the
broader assets → documents → filesystem resolution from the "File resolution"
section:

```ts
class CsvTable extends CustomElement {
    get elementName() { return "csv-table"; }
    async process($element, metadata, dirty) {
        const fn = $element.attr('file-name');
        if (!fn || fn === '') {
            throw new Error(`csv-table must have file-name attribute, got ${fn}`);
        }
        const rowTemplate = $element.attr('template');
        if (!rowTemplate || rowTemplate === '') {
            throw new Error(`csv-table must have template attribute, got ${rowTemplate}`);
        }
        const beforeTemplate = $element.attr('before-template') || 'ak_csvtable_before.html.njk';
        const afterTemplate  = $element.attr('after-template')  || 'ak_csvtable_after.html.njk';
        const explicitFormat = $element.attr('format');
        const delimiter      = $element.attr('delimiter');
        const header         = $element.attr('header');

        // Resolve the data file: assets, then documents, then a filesystem
        // path outside the project directories (see "File resolution").
        const fspath = await resolveDataFile(this.config, this.akasha, metadata, fn);
        if (!fspath) {
            throw new Error(`csv-table file-name ${fn} not found in assets, documents, or on disk`);
        }
        const text = await fsp.readFile(fspath, 'utf8');

        // Parse (pure helper).
        const format = inferFormat(fn, explicitFormat);
        const { columns, rows } = parseTableData(text, format, {
            delimiter,
            header: header ? header !== 'false' : true,
        });

        // Render before + each row + after.
        let out = await this.akasha.partial(this.config, beforeTemplate,
            { columns, rowCount: rows.length });
        for (const row of rows) {
            out += await this.akasha.partial(this.config, rowTemplate, row);
        }
        out += await this.akasha.partial(this.config, afterTemplate,
            { columns, rowCount: rows.length });
        return out;
    }
}
```

The `resolveDataFile` helper implements the three-tier lookup from the "File
resolution" section (assets cache → documents cache → filesystem), mirroring the
existing assets-then-documents fallback at `lib/built-in.ts`:239-245:

```ts
async function resolveDataFile(config, akasha, metadata, fn) {
    const candidate = path.isAbsolute(fn)
        ? fn
        : path.join(path.dirname(metadata.document.renderTo), fn);
    let found = await akasha.filecache.assetsCache.find(candidate);
    if (found) return found.fspath;
    found = await akasha.filecache.documentsCache.find(candidate);
    if (found) return found.fspath;
    // External file outside the project directories. Relative paths resolve
    // against config.configDir (the config file's directory), as with the
    // stacked directories; absolute paths are used as-is.
    const external = path.isAbsolute(fn) ? fn : path.resolve(config.configDir, fn);
    try { await fsp.access(external); return external; } catch { return undefined; }
}
```

Register the element in `mahabhutaArray` next to `CodeEmbed`
(`lib/built-in.ts`:289):

```ts
ret.addMahafunc(new CsvTable(config, akasha, plugin));
```

`inferFormat` and `parseTableData` are imported from the new
`./csv-table.js` module at the top of `built-in.ts`, mirroring how `hljs` and
`encode` are already imported for `CodeEmbed`. `csv-parse/sync` is imported
inside `lib/csv-table.ts`, not `built-in.ts`.

### Default partials

Ship three partial templates in the Built-in Plugin's `partials/` directory so
the feature works with only `file-name` and `template` supplied. The **before**
and **after** defaults implement exactly the issue's example (`<table>` /
`</table>`), while also emitting a header row from `columns`:

`partials/ak_csvtable_before.html.njk`:

```njk
<table>
{% if columns and columns.length %}<thead><tr>
{% for col in columns %}<th>{{ col }}</th>{% endfor %}
</tr></thead>{% endif %}
<tbody>
```

`partials/ak_csvtable_after.html.njk`:

```njk
</tbody>
</table>
```

There is **no** default `template` (row) partial: the whole point of the feature
is that the author supplies the per-row formatting. A sample partial belongs in
the documentation and the test fixtures, e.g.:

```njk
<tr>{% for f in fields %}<td>{{ f }}</td>{% endfor %}</tr>
```

Because `this.akasha.partial` uses the partials cache and the renderer chosen by
extension, authors may write their row templates in any supported engine
(`.njk`, `.ejs`, `.html.hbs`), and may override the default before/after partials
by placing files of the same name earlier in the partials directory stack (the
[Stacked Directories](../concepts/stacked-directories.md) override mechanism).

### Rendering-order and escaping notes

- **DOM stage, not template stage.** `<csv-table>` is expanded during Mahabhuta
  DOM processing, after the document body and layout have already rendered. This
  means the tag can appear in Markdown/HTML document bodies and in layouts, and
  the data file is read at that point. This matches `CodeEmbed`/`FigureImage`.
- **Escaping is the template's job.** Field values are inserted through partials.
  Nunjucks auto-escapes `{{ }}`; EJS authors must use `<%= %>` (escaped) not
  `<%- %>` unless they intend raw HTML. Document this, because CSV data is often
  untrusted and could contain `<`, `&`, `"`.
- **Well-formed output.** As with all custom elements, the concatenated
  before+rows+after string must be valid HTML or it can break later Mahabhuta
  passes (see [Custom Elements](../concepts/custom-elements.md) "Invalid HTML
  Generation").
- **`setDirty`.** The generated table is plain HTML with no further custom tags,
  so calling `dirty()` is unnecessary unless a row template itself emits custom
  elements that must be re-processed. If nested custom tags are a supported use
  case, call `dirty()` after replacement.

### Error handling

Throw descriptive `Error`s (matching the Built-in Plugin's style) for: missing
`file-name`; missing `template`; `file-name` not found in assets, documents, or
on disk; a data file that fails to parse; and a YAML file that does not parse to
an array. Wrap the per-row rendering loop so a template error names the offending
row index, which greatly eases debugging large data files.

### Testing plan

Add tests to the AkashaRender test suite (`node:test`, `.mjs`, per
`AGENTS.md` Testing Framework Policy). Unit-test the **pure helper** first, then
integration-test the element through a rendered fixture site.

Pure `parseTableData` tests:

1. CSV with header → array of objects with correct keys/values; `columns` correct.
2. CSV without header → positional `fields`; `columns` are `"0"`,`"1"`,…
3. CSV with quoted fields containing the delimiter, embedded newlines, and
   escaped quotes (`""`) → parsed correctly.
4. TSV (tab delimiter, and via `format="tsv"`) → same shape as CSV.
5. `delimiter=";"` override on a CSV → respected.
6. YAML array-of-objects → rows/columns correct.
7. YAML array-of-arrays → treated as headerless.
8. YAML that parses to a non-array (map or scalar) → throws.
9. `inferFormat` picks csv/tsv/yaml from extension and honors an explicit
   `format` override.

Integration tests (render a fixture document containing `<csv-table>`):

10. Default before/after partials produce a `<table>…</table>` with a `<thead>`
    built from the header row, and one `<tr>` per data row.
11. Custom `before-template`/`after-template` are used when supplied.
12. **File resolution across all three sources:** (a) a data file in an assets
    directory is found; (b) a data file in a documents directory is found;
    (c) a data file **outside the project directories** is found — both via an
    absolute path and via a relative path resolved against `config.configDir`
    (e.g. `../data/people.csv`). Also assert that a data file kept outside the
    project directories is **not** emitted into the render output (proves the
    "raw data not deployed" benefit).
13. A field value containing `<`, `&`, `"` is HTML-escaped in the output (proves
    the auto-escaping guidance).
14. Missing `file-name`, missing `template`, and a data file absent from all
    three sources each throw a clear error.
15. A `.tsv` fixture and a `.yaml` fixture render identically to an equivalent
    `.csv` fixture (proves format-independence of the row model).

### Implementation order / phasing

1. **Phase 0 — dependency.** Add `csv-parse` to `package.json` `dependencies`
   (`js-yaml` is already present). No code yet.
2. **Phase 1 — pure parser.** Create `lib/csv-table.ts` with `inferFormat` and
   `parseTableData` (delimited via `csv-parse/sync`, YAML via `js-yaml`). Add and
   pass helper unit tests (tests 1–9). No rendering yet.
3. **Phase 2 — element + resolution + default partials.** Add the `CsvTable`
   class and the `resolveDataFile` helper (assets → documents → filesystem),
   register in `mahabhutaArray`, and ship `ak_csvtable_before/after.html.njk`.
   Add integration tests (10–12, 14), including the external-file cases.
4. **Phase 3 — formats + escaping + overrides.** Verify TSV/YAML fixtures and
   escaping; test partial overrides via the partials stack (13, 15).
5. **Phase 4 — docs.** Document the tag, its attributes, the three file-resolution
   sources (with the recommendation to keep raw data outside the project for
   non-deployment), the row data model (`fields`/`columns`/`index`/`rowNumber`),
   the default partials, and the escaping guidance in the Built-in Plugin guide.

### Gotchas

- **Use `csv-parse`, do not hand-roll.** Quoted fields, embedded delimiters,
  embedded newlines, and escaped quotes (`""`) are exactly the cases a naive
  `split(',')` gets wrong; the mature package handles them.
- **Sync parse, async read.** Use `csv-parse/sync` (and `jsyaml.load`) for the
  in-memory string, and `await fsp.readFile` for the I/O — see "Sync vs async".
  Do not reach for the async/stream `csv-parse` unless implementing the future
  large-file streaming path; on an already-loaded string it adds no concurrency.
- **`metadata.document.renderTo`** is the anchor for relative `file-name`
  resolution, exactly as in `CodeEmbed`; use `path.dirname` of it.
- **Three resolution sources, in order.** Assets cache → documents cache →
  filesystem. A file placed only outside the project directories will not appear
  in either cache, which is *intended* — that is how authors keep raw data out of
  the deployed site. The filesystem fallback (absolute path, or relative to
  `config.configDir`) is what makes that work; without it, external data files
  fail to load.
- **`config.configDir` is the anchor for relative external paths**, not the
  document directory — this matches how `assetsDirs`/`documentsDirs` are resolved
  (`lib/index.ts`:908-910), so `../data/x.csv` reaches a sibling of the project.
  Note this differs from a *cached* relative `file-name`, which (per step 1 of
  resolution) is first tried relative to the current document before the caches.
- **External paths escape the project by design.** `file-name` can point outside
  the project via absolute path or `../`. This is a deliberate feature, not a
  vulnerability, because the tag is authored content — but never wire it to
  untrusted input, and say so in the docs.
- **`header` is a string attribute.** HTML attributes are strings, so treat any
  value other than the literal `"false"` as true (as shown), and document it.
- **YAML "certain structures".** Only an array (of objects, or of arrays) maps to
  a table; reject anything else rather than guessing.
- **Renderer availability.** Row templates render through `akasha.partial`, so the
  chosen template extension must have a registered renderer in the project config.

## Sources

- [`lib/built-in.ts`](../../lib/built-in.ts) — `CodeEmbed` (file-reading element,
  `file-name` resolution, `documentsCache.find`, `fsp.readFile`); the
  assets-then-documents fallback at lines 239-245 (`assets.find` then
  `documents.find`, using `found.fspath`) that the `resolveDataFile` helper
  extends; `FigureImage`/`InsertTeaser` (`akasha.partial` usage);
  `mahabhutaArray` registration.
- [`lib/mahafuncs.ts`](../../lib/mahafuncs.ts) — `CustomElement` base class and
  its `config`/`akasha`/`plugin` accessors.
- [`lib/cache/cache-sqlite.ts`](../../lib/cache/cache-sqlite.ts) — `assetsCache`
  and `documentsCache`, and the `find(fpath)` method returning `{ fspath }`.
- [`lib/index.ts`](../../lib/index.ts) — `partial(config, fname, metadata)` and
  how partials are resolved through the partials cache and per-extension
  renderers; `config.configDir` (lines 735, 878-879) and its use as the anchor
  for relative stacked-directory paths (lines 908-910), reused here for relative
  external data-file paths.
- [`package.json`](../../package.json) — confirms `js-yaml` is already a
  dependency and that no CSV/TSV parser is present yet (so `csv-parse` must be
  added).
- GitHub issue #85, <https://github.com/akashacms/akasharender/issues/85> — the
  requested `<csv-table template="..." file-name="..."/>` tag.

## Related Pages

- [Custom Elements](../concepts/custom-elements.md)
- [Built-in Plugin](../concepts/built-in-plugin.md)
- [Nunjucks Extensions](../concepts/nunjucks-extensions.md)
- [Three-Stage Rendering](../concepts/three-stage-rendering.md)
- [Stacked Directories](../concepts/stacked-directories.md)
- [oEmbed Provider Implementation Guide for plugins-base](./oembed-provider.md)
- [Implementation index](./README.md)

## Backlinks

- [Implementation index](./README.md)
</content>
</invoke>
