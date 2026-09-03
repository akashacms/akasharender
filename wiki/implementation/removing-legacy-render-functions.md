---
title: "Removing the Legacy Non-2 Render Functions and Renaming the 2 Functions"
type: implementation
Sources:
  - lib/render.ts
  - lib/index.ts
  - lib/cli.ts
  - lib/data.ts
  - test/index.mjs
  - test/rebased.mjs
  - test/test-relative.mjs
  - ../akasharender-epub/rendercli.js
Categories:
  - rendering
  - refactoring
  - api-cleanup
  - testing
date-created: 2026-09-03T16:54:47+03:00
last-updated: 2026-09-03T18:17:02+03:00
confidence: high
---

# Removing the Legacy Non-2 Render Functions and Renaming the 2 Functions

## Query

We need a plan for removing the non-"2" versions of the render functions
(`render`, `renderDocument`, `renderPath`), transitioning all callers to the
"2" versions, then renaming the "2" functions to drop the suffix. Also, all
stale references to `lib/watchman.ts` (a file that no longer exists) must be
removed.

## Architecture Pages

No dedicated architecture page exists for this refactor. Background:

- [How the AkashaCMS Page Rendering Process Works](../answers/how-page-rendering-works.md) — documents the two parallel implementations
- [lib/render.ts summary](../summaries/lib/render.ts.md)
- [lib/index.ts summary](./../summaries/lib/index.ts.md)

## Architecture

### Inventory (verified 2026-09-03)

**Legacy functions to remove** (production code no longer calls any of them;
the CLI uses only the "2" versions):

| Legacy | Location | Replacement |
|---|---|---|
| `renderDocument` | [lib/render.ts](../../../lib/render.ts):560 | `renderDocument2` (:352) |
| `render` | [lib/render.ts](../../../lib/render.ts):744 | `render2` (:962) |
| `renderPath` | [lib/index.ts](../../../lib/index.ts):222 | `renderPath2` (:264) |

**Code orphaned by the removal** (only called by the legacy functions):

- `renderContent` — [lib/render.ts](../../../lib/render.ts):153 (called at :587, :661 only)
- `writeCSStoOutput` — [lib/render.ts](../../../lib/render.ts):202
- `copyAssetToOutput` — [lib/render.ts](../../../lib/render.ts):225
- `data.report` — [lib/data.ts](../../../lib/data.ts):82 and `data.data4file` — [lib/data.ts](../../../lib/data.ts):136. After removal no callers remain anywhere: `lib/cli.ts` uses only `data.removeAll`; the epub plugin uses only `data.init`.

**Callers that must transition:**

1. Tests (only in-repo callers of the legacy API):
   - `test/index.mjs:106`, `test/rebased.mjs:103`, `test/test-relative.mjs:106` — call `akasha.render(config)` and check `result.error` (singular). The "2" API returns `RenderingResults` objects: errors live in `result.errors` (array), and up-to-date documents come back with `skipped: true`.
2. External: `../akasharender-epub/rendercli.js:51` — `await akasha.render(akConfig)`; the result is unused, so switching is behavior-safe. **Caveat:** the epub plugin is a separate repository pinned by git ref (`akashacms/akasharender-epub#0.10`); its checked-out copy also calls `akasha.cacheSetupComplete`, which does not exist in current `module_exports`, so it is already out of sync with HEAD. The epub plugin needs its own coordinated update.

**Export surface to update** — [lib/index.ts](../../../lib/index.ts):68-69 (named re-exports) and the `module_exports` default object (file end), which today exports the legacy `render`, `renderDocument`, `renderPath`, `renderPath2` but **omits `renderDocument2`** — fix while renaming.

**Duplication to eliminate** — `renderPath`/`renderPath2` are copy-pasted (identical 20×100 ms document-lookup polling loops); keep one shared private lookup helper in the surviving function.

**Watchman references** — none exist in `lib/` or `package.json` (verified). Remaining references are documentation only:
- Repo-root docs (outside `wiki/`, edit with the project leader's approval): `COMPLEXITY.md`, `site-validator-plan.md`, `add-LLM-CODE-WIKI.md`
- Wiki pages to edit: `wiki/index.md` (Caching System list), `wiki/summaries/README.md`, `wiki/summaries/lib/cli.ts.md`, `wiki/architecture/README.md`, `wiki/concepts/layout-templates.md`, `wiki/concepts/concurrent-rendering.md`, `wiki/concepts/three-stage-rendering.md`, `wiki/concepts/event-driven-architecture.md`
- **Do not edit**: `wiki/log/*` (write-once audit trail per [wiki/AGENTS.md](../AGENTS.md)) and `ai-assistance/*` (historical session transcripts; recommend leaving as-is — confirm with project leader)
- No `wiki/summaries/lib/cache/watchman.ts.md` summary file exists (verified).

### Phase 1 — Transition remaining callers to the "2" API (non-breaking) — **DONE 2026-09-03**

1. In the three test files, change `akasha.render(config)` to `akasha.render2(config)` and update the failure check from `result.error` to:
   ```js
   for (let result of results) {
       if (result.errors?.length) { failed = true; console.error(result.errors); }
   }
   ```
   **Additionally pass `{ forceRenderAll: true }`** (this proved necessary, not just precautionary): these suites run `config.copyAssets()` before rendering, which copies the original full-size images over previously resized output files; the per-document resize happens during Mahabhuta processing, and a document skipped by `isDocumentUpToDate` never runs Mahabhuta — so without `forceRenderAll` the in-place resize tests fail (e.g. `out-rebased/img/Human-Skeleton.jpg` stays 900px instead of 50px). Recorded in memory: [render2 Skips Up-To-Date Documents](../memory/render2-force-render-all-in-tests.md).
2. akasharender-epub: **DEFERRED** — tracked in GitHub issue akashacms/akasharender#212; not a priority as of 2026-09-03. This package's Phase 1 was scoped to in-repo code only.
3. Verify: `npm run build` then `cd test && npm test` (Node.js 24, TypeScript 6). **Result:** all suites green; the only failure observed was `test-incremental.mjs` Scenario 4, a wall-clock timing assertion (`rebuild should be faster than forced build`) that is flaky under full-suite machine load and passes reliably in isolation — unrelated to this change.

### Phase 2 — Delete legacy implementations and rename "2" → base names (breaking; one release) — **DONE 2026-09-03**

1. `lib/render.ts`: delete `renderDocument`, `render`, `renderContent`, `writeCSStoOutput`, `copyAssetToOutput`. **Done** — file went from 1095 to 695 lines.
2. Rename `renderDocument2` → `renderDocument`, `render2` → `render` (including the queue closure, now `renderDocumentInQueue`, and all comments). **Done.** The `Render2Options` type was also renamed to `RenderOptions`.
3. `lib/index.ts`: delete legacy `renderPath`; rename `renderPath2` → `renderPath`; extract the duplicated lookup-polling loop into one private helper (`findDocumentWithRetry`); update the import/export lists and `module_exports` (now exports exactly `render`, `renderDocument`, `renderPath`; the `renderDocument2` omission is moot). **Done.**
4. `lib/cli.ts`: update `renderPath2` → `renderPath` and `render2` → `render`. **Done.**
5. `lib/data.ts`: remove `report()` and `data4file()`, plus their SQL files (`lib/sql/data-add-report.sql`, `lib/sql/data-for-file.sql`). **Done.** NOTE: with `report()` gone, **nothing writes to the TRACES table anymore** — `init`/`remove`/`removeAll`/`print` remain because the CLI calls `removeAll()` and akasharender-epub calls `init()`; removing the TRACES apparatus is tracked in GitHub issue akashacms/akasharender#267.
6. Update the three test files to the renamed `akasha.render`. **Done.**
7. Versioning: **no bump needed** — per the project leader, 0.10 is an unreleased version, so the breaking change ships within 0.10.
8. Verify: build clean (Node.js v24.18.1, TypeScript 6); full test suite green (388 tests, 0 failures, including `test-incremental`); CLI smoke tests passed — `akasharender render config-normal.mjs --copy-assets --force-render-all` rendered 87 files (EXIT=0) and `render-document` exercised `renderPath` → `renderDocument` (EXIT=0). Sibling-site smoke tests were not possible: `../akashacms-skeleton` has no node_modules and `../akashacms-website` has the published 0.10.0 installed (not linked to this checkout).

### Phase 3 — Remove watchman.ts references — **DONE 2026-09-03**

Edited (living documents):
- `COMPLEXITY.md` — removed the `lib/cache/watchman.ts` section, its table row, and mentions; adjusted the summary statistics accordingly (15→14 files, 9,227→8,986 lines, cache-system totals). The document is otherwise stale versus the current tree (missing `lib/link-checker.ts`, `lib/sitemap-validator.ts`, `lib/csv-table.ts`; drifted line counts) and needs a regeneration — flagged as follow-up.
- `wiki/index.md` — removed `watchman.ts` from the Caching System list and the dangling File Watching concept entry
- `wiki/summaries/README.md` — removed the watchman summary entry
- `wiki/summaries/lib/cli.ts.md` — removed the watchman related-page link, the dangling File Watching concept link, and "watching" from the command description (the CLI has no watch command)
- `wiki/architecture/README.md` — removed the "File Watching Architecture" suggested topic
- `wiki/concepts/layout-templates.md` — replaced the watchman-based layout-change section with the current incremental-rendering mechanism (`isDocumentUpToDate` checks layout mtime; issue #61)
- `wiki/concepts/three-stage-rendering.md` — removed the "watch mode re-rendering via watchman" bullet
- `wiki/concepts/event-driven-architecture.md` — removed watchman sources/citations; replaced the File Watching Events item with a historical note that the module was removed; removed the dangling File Watching related-page link
- `wiki/concepts/concurrent-rendering.md` — removed the watchman concurrency bullet and sources
- `wiki/concepts/README.md` — removed the dangling File Watching entry

**Left untouched (frozen historical session transcripts, same category as `wiki/log/`):** `add-LLM-CODE-WIKI.md`, `site-validator-plan.md`, `ai-assistance/*`, and `wiki/log/*`. These contain watchman references only inside records of past sessions, where the file still existed. Deleting or editing them would falsify the audit trail; purging them is the project leader's call.

### Phase 4 — Post-implementation wiki update — **DONE 2026-09-03**

Most page rewrites were bundled into Phase 2 (render.ts/data.ts summaries, both rendering answers, four concept pages). This phase mopped up the remainder:

- `wiki/concepts/site-rendering.md` — all 21 line citations remapped from the pre-cleanup file layout (legacy `render` at old :730-840) to the current one (`render` at :548-680); the five-stage description now includes the up-to-date skip step; the queue code block and the `{result, error}` result-shape claims were corrected to the `RenderingResults`/`errors[]` reality
- `wiki/answers/rendering-flow-from-vpath.md` — all line citations remapped (e.g. `renderDocument` now cited at :236, stage ranges recomputed); the RenderingContext citation now points at its construction in `createRenderingData` (:111-118); the three per-stage error-handling citations now point at the actual catch blocks (:282-287, :343-349, :390-397)
- Verified `wiki/summaries/lib/index.ts.md` and `wiki/summaries/lib/cli.ts.md` already describe the current API accurately (no "2" references; `renderPath(config, path)` entry is correct post-rename)
- Final sweep: no citation in any page references a line number beyond the current 681-line `lib/render.ts`; the only remaining mentions of the old names are intentional history notes, this plan, immutable logs, and the frozen sitemap-validation transcript

Known remaining follow-ups (outside this wiki): akasharender-epub transition (#212), TRACES table removal (#267), COMPLEXITY.md regeneration.

### Risks & Pitfalls

- **Behavior difference**: the "2" path skips up-to-date documents by default; callers who expect unconditional re-rendering must pass `forceRenderAll` or clean the output directory first.
- **External consumers**: any downstream code importing the string-returning `render`/`renderDocument` from `akasharender` breaks; only the epub plugin is known to exist and is handled in Phase 1.
- **epub plugin drift**: it already references non-existent APIs, so its update must be verified against the akasharender version it actually pins.

## Sources

- [lib/render.ts](../../../lib/render.ts)
- [lib/index.ts](../../../lib/index.ts)
- [lib/cli.ts](../../../lib/cli.ts)
- [lib/data.ts](../../../lib/data.ts)
- [test/index.mjs](../../../test/index.mjs)
- [test/rebased.mjs](../../../test/rebased.mjs)
- [test/test-relative.mjs](../../../test/test-relative.mjs)
- [../akasharender-epub/rendercli.js](../../../akasharender-epub/rendercli.js)

## Related Pages

- [How the AkashaCMS Page Rendering Process Works](../answers/how-page-rendering-works.md)
- [Detailed Flow for Rendering a Single Page from vpath](../answers/rendering-flow-from-vpath.md)
- [lib/render.ts summary](../summaries/lib/render.ts.md)
- [Rendering Pipeline concept](../concepts/rendering-pipeline.md)
- [Implementation index](./README.md)

## Backlinks

- [Implementation index](./README.md)
