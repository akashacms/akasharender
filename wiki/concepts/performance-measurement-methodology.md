---
title: "Performance Measurement Methodology"
type: concept
Sources:
  - ARCHITECTURE-performance-review.md
  - lib/render.ts
  - lib/cli.ts
  - lib/cache/cache-sqlite.ts
  - lib/sqdb.ts
  - lib/index.ts
Categories:
  - performance
  - optimization
  - methodology
date-created: 2026-06-24T12:00:00+03:00
last-updated: 2026-06-24T12:00:00+03:00
confidence: high
---

# Performance Measurement Methodology

## Definition

Performance Measurement Methodology is the disciplined process for finding,
quantifying, and interpreting AkashaRender's performance bottlenecks before
changing any code. Where [Performance Profiling](./performance-profiling.md)
describes the *tooling* (the `--perfresults`, `--perf-data-dir`, and
`AK_PROFILE_INDEX` mechanisms), this page describes the *practice*: measure
first, attribute time to a specific bucket, interpret the numbers honestly
(including distinguishing a real change from machine noise), and only then
optimize. The methodology was developed and validated during a full
performance review of the techsparx.com site, recorded in
(source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)).

## How It Works

The methodology is a loop: **measure -> attribute -> interpret -> change ->
re-measure**. Each step has concrete techniques.

### 1. Separate the phases of a build

A build has two distinct cost phases that must never be conflated
(source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)):

- **Indexing / cache setup** -- scanning the stacked directories and
  populating the SQLite caches, performed by `setup()`
  (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)). This
  is a one-time cost per process. See [File Caching](./file-caching.md).
- **Rendering** -- transforming every document through the
  [Three-Stage Rendering](./three-stage-rendering.md) pipeline.

In a full `render`, indexing is paid once and amortized across all
documents; in `render-document` (single-page preview) the same full index
runs but only one page renders, so indexing dominates that command's wall
clock. The same elapsed time means different things depending on which
command produced it.

### 2. Measure render time per document and per stage

Run the site render with the `--perfresults` option, which writes a JSON
array of per-document timings
(source: [lib/cli.ts](../../lib/cli.ts), [lib/render.ts](../../lib/render.ts)):

```
npx akasharender render --perfresults perf.json config.mjs
```

Each entry records `format` (`HTML`/`COPY`/`CSS`), `time` (a render-start
timestamp from `performance.now()` -- **not** a duration), `first` (content
render ms), `second` (layout render ms), `mahabhuta` (DOM processing ms),
and `rendered` (total per-doc ms). Sum each stage bucket across all
documents to find which stage dominates. On techsparx.com this showed
Mahabhuta at ~62%, content render at ~35%, and layout at ~1.5%
(source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)).

### 3. Attribute Mahabhuta time to individual mahafuncs

When the [Mahabhuta System](./mahabhuta-system.md) stage dominates, drill
into it with a per-mahafunc breakdown. Render one representative document
with `--perf-data-dir`, which causes `renderDocument2` to record each
mahafunc's execution time via `FilesystemPerfDataStore`
(source: [lib/render.ts](../../lib/render.ts), [lib/cli.ts](../../lib/cli.ts)):

```
npx akasharender render-document --perf-data-dir ./d config.mjs path/to/page.html.md
```

The output JSON lists `mahafuncTimings`. **`MahafuncArray` entries are
containers whose duration includes their children** -- exclude them and sum
only the leaf mahafuncs to avoid double counting
(source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)).
Choose a representative page (a normal article using the standard layout,
not an index or feed page), since the per-page mahafunc mix varies.

### 4. Measure indexing with AK_PROFILE_INDEX

Indexing is profiled by setting the `AK_PROFILE_INDEX` environment variable,
which makes `setup()` print per-phase wall time for each cache -- `scan`,
`gatherInfoData`, `insertDocToDB`, and `hookFileAdded`
(source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)):

```
AK_PROFILE_INDEX=1 npx akasharender render-document config.mjs path/to/page.html.md
```

`render-document` is convenient here because it runs the full index then
renders only one page. The profiler has zero overhead when the variable is
unset.

### 5. Detect whether concurrency is actually happening

To learn whether [Concurrent Rendering](./concurrent-rendering.md) is
delivering parallelism, compare two numbers from `perf.json`: the span
between the first and last render-start `time`, and the sum of all
per-document `rendered` durations. Their ratio is the overlap factor
(source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)):

- ratio **~1.0** => fully serial (no overlap)
- ratio **> 1.0** => real overlap across documents

A complementary, machine-level check is the operating system's `time(1)`
output: when `user` time approximately equals `real` time, the process used
a single core; when `user` greatly exceeds `real`, work ran on multiple
cores in parallel.

## Key Parameters

- **`--perfresults <file>`** -- per-document stage timings as JSON
  (source: [lib/cli.ts](../../lib/cli.ts)).
- **`--perf-data-dir <dir>`** -- per-mahafunc timings via
  `FilesystemPerfDataStore`; available on `render-document`
  (source: [lib/cli.ts](../../lib/cli.ts), [lib/render.ts](../../lib/render.ts)).
- **`AK_PROFILE_INDEX`** -- environment variable enabling per-phase indexing
  timing in `setup()`
  (source: [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts)).
- **`time` field** -- a `performance.now()` render-start timestamp, used for
  overlap analysis, not a duration
  (source: [lib/render.ts](../../lib/render.ts)).
- **`config.concurrency`** -- the `fastq` worker count (default 3); relevant
  only when work is I/O-bound
  (source: [lib/index.ts](../../lib/index.ts)).
- **`user` vs `real` from `time(1)`** -- machine-level single-thread vs
  multi-core indicator.

## When To Use

- **Before any optimization.** The review repeatedly found that intuition
  pointed at the wrong target (partial templates, the template engine, the
  search query); only measurement identified the real costs
  (source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)).
- **When a build feels slow** -- start at step 2 (per-stage) and narrow down.
- **After a change, to confirm a causal effect** -- always re-measure, and
  guard against attributing machine noise to the change (step in Risks).
- **When deciding whether to parallelize** -- the overlap-ratio and
  `user`/`real` checks reveal whether the workload is CPU-bound (where async
  concurrency cannot help) or I/O-bound.

## Risks & Pitfalls

- **Optimizing the wrong bucket.** The single largest methodological risk.
  Examples surfaced by measurement: the template-engine rewrite would have
  targeted the 1.5% layout bucket; the per-page search query was already
  cached and was not the cost of `BlogNextPrevElement` -- a linear scan was
  (source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)).
- **Mistaking machine noise for a result.** On a contended laptop the same
  site rendered in 12 and 23 minutes; an affiliate-button removal showed a
  ~1192ms drop of which only ~205ms was causal and the rest was a faster,
  less-contended run. Benchmark on an idle machine and prefer relative
  shares within one run over absolute milliseconds across runs
  (source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)).
- **Double-counting container timings.** Summing `MahafuncArray` rows along
  with their leaf children inflates totals; exclude the containers
  (source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)).
- **Treating `time` as a duration.** The `perfresults` `time` field is a
  start timestamp; using it as elapsed time produces nonsense
  (source: [lib/render.ts](../../lib/render.ts)).
- **Assuming `config.concurrency` parallelizes CPU work.** Measured overlap
  was ~1.0 and `user` approximately equalled `real`, confirming the render
  is single-threaded CPU work that `async`/`fastq` cannot parallelize; only
  multiple OS processes/threads can
  (source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)).
- **"Best practice" optimizations that backfire.** An attempt to overlap
  file reads by pre-reading all files into memory caused severe GC pressure
  and made indexing roughly 40x slower; it was abandoned after measurement.
  Always re-measure after applying a textbook optimization
  (source: [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md)).
- **Single-document samples are not the corpus.** A per-mahafunc breakdown
  from one page is directional; mahafuncs specific to blogs or commerce
  pages will not appear on other page types.

## Sources

- [ARCHITECTURE-performance-review.md](../../ARCHITECTURE-performance-review.md) -- the full review that developed and validated this methodology
- [lib/render.ts](../../lib/render.ts) -- `renderDocument2`, stage timing, `FilesystemPerfDataStore` wiring
- [lib/cli.ts](../../lib/cli.ts) -- `--perfresults` and `--perf-data-dir` options
- [lib/cache/cache-sqlite.ts](../../lib/cache/cache-sqlite.ts) -- `setup()` and the `AK_PROFILE_INDEX` profiler
- [lib/sqdb.ts](../../lib/sqdb.ts) -- shared database and historical SQL profiling notes
- [lib/index.ts](../../lib/index.ts) -- `config.concurrency` and `perfDataDir`

## Related Pages

- [Performance Profiling](./performance-profiling.md) -- the tooling this methodology drives
- [Performance Tracing](./performance-tracing.md) -- the legacy SQLite-based per-stage trace recorder
- [Concurrent Rendering](./concurrent-rendering.md) -- the queue whose effectiveness the overlap-ratio check evaluates
- [Three-Stage Rendering](./three-stage-rendering.md) -- the stages measured by `--perfresults`
- [Mahabhuta System](./mahabhuta-system.md) -- the DOM stage attributed by `--perf-data-dir`
- [File Caching](./file-caching.md) -- the indexing phase measured by `AK_PROFILE_INDEX`
- [Database Indexing](./database-indexing.md) -- index maintenance cost considered during indexing analysis

## Backlinks

- [Performance Profiling](./performance-profiling.md)
- [Concurrent Rendering](./concurrent-rendering.md)
