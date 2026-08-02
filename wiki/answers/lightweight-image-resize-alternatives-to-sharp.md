---
title: "Lightweight Image-Resize Packages to Replace sharp"
type: answer
Sources:
  - lib/built-in.ts
  - built-in-guide/index.html.md
  - package.json
Categories:
  - images
  - dependencies
  - optimization
  - build-size
date-created: 2026-07-31T23:05:46+03:00
last-updated: 2026-07-31T23:12:41+03:00
confidence: medium
---

# Lightweight Image-Resize Packages to Replace sharp

## Query

The `sharp` package in npm is used by AkashaRender for light-weight image
manipulation. It's limited to image resizing, but `sharp` has many
capabilities and is also very large. Is there a small Node.js package that
does good-quality image resizing, to reduce the installed size of the
`akasharender` package? Currently the resize path handles raster images
(JPEG/PNG), and **WebP output should also be supported** — many people want
smaller images to send to viewers.

**SVG is explicitly out of scope for this task.** SVG is a different kind of
image: it is scaled in the browser with `width=`/`height=` attributes rather
than by recreating the file, so it does not flow through the raster
resize/re-encode pipeline. The replacement library therefore only needs to
handle raster formats (JPEG, PNG, and WebP output).

## Answer

### Why sharp is large

`sharp` is declared as a dependency (`"sharp": "^0.35.x"`) with a pinned
resolution of `sharp@0.34.5` (source: [package.json](../../package.json):64,95).
Its install size is dominated by **native, precompiled libvips binaries** that
are downloaded per platform/architecture. The installed footprint is typically
tens of megabytes (and much more if multiple platform binaries are fetched).
The library's own JavaScript is small; the size comes from the bundled native
image codecs.

The key consequence: **any candidate that ships or downloads native binaries
(or compiles a native addon) reproduces the same size problem.** A meaningful
size reduction only comes from a **pure-JavaScript** or **WebAssembly (WASM)**
library.

### What AkashaRender actually needs from an image library

The usage surface in AkashaRender is very small. The
[Image Resizing](../concepts/image-resizing.md) feature only uses three
operations (source: [lib/built-in.ts](../../lib/built-in.ts):249-268):

1. **Load** an image from a file path — `sharp(srcfile)`
   (source: [lib/built-in.ts](../../lib/built-in.ts):249).
2. **Resize** to a target width, with height derived automatically to preserve
   aspect ratio — `img.resize(Number.parseInt(toresize.resizewidth))`
   (source: [lib/built-in.ts](../../lib/built-in.ts):250).
3. **Write** to a destination file, with the output format inferred from the
   destination file extension — `resized.toFile(resizedest)`
   (source: [lib/built-in.ts](../../lib/built-in.ts):268).

None of sharp's advanced features (cropping, rotation, compositing, colour
management, quality tuning, metadata, etc.) are used. That is why a much
smaller library can plausibly cover the requirement.

**Format conversion is a required feature, not optional.** The built-in guide
documents that when the `src` extension differs from the `resize-to` extension,
a format conversion is performed — e.g.
`<img id="png2jpg" src="rss_button.png" resize-width="50" resize-to="rss_button.jpg">`
converts PNG to JPG (source:
[built-in-guide/index.html.md](../../built-in-guide/index.html.md):189-192).
This works today because sharp's `.toFile()` chooses the encoder from the
destination extension. Any replacement **must** support choosing the output
encoder by destination extension, covering at least JPEG, PNG, and WebP.

> Note — wiki contradiction: The
> [Image Resizing](../concepts/image-resizing.md) concept page currently states
> under "Risks & Pitfalls" that there is "No Format Conversion." That claim
> contradicts the built-in guide (source:
> [built-in-guide/index.html.md](../../built-in-guide/index.html.md):189-192),
> which explicitly documents PNG→JPG conversion via `resize-to`. The concept
> page should be corrected. *NEEDS VERIFICATION* against a live render.

SVG is out of scope (see the Query): it is scaled via `width=`/`height=`
attributes in the browser, not by re-encoding a file, so the library only
needs raster JPEG/PNG/WebP support.

### Candidate libraries

| Package | Native binaries? | Approx. install size | Resize quality | Decodes | Encodes | Notes |
|---|---|---|---|---|---|---|
| **sharp** (current) | Yes (libvips) | tens of MB+ | Excellent | JPEG, PNG, WebP, AVIF, GIF, TIFF, SVG | JPEG, PNG, WebP, AVIF, GIF, TIFF | The large dependency being replaced |
| **Jimp** (`jimp`) | **No** (pure JS) | a few MB | Good (bilinear/bicubic) | JPEG, PNG, BMP, TIFF, GIF | JPEG, PNG, BMP, TIFF, GIF | Most drop-in (load file → resize → write by extension); **WebP support is weak/limited** |
| **@jimp/core + codec plugins** | No (pure JS) | smaller (pick codecs) | Good | choose per plugin | choose per plugin | Jimp v1 modular build; include only needed codecs |
| **photon-node** / `@cf-wasm/photon` | No (WASM) | ~2–5 MB | Good | JPEG, PNG, WebP | JPEG, PNG, WebP | Fast WASM; lower-level API; no extension-based auto-format |
| **@squoosh/lib** (jSquoosh codecs) | No (WASM) | small per codec | Good | JPEG, PNG, WebP, AVIF | JPEG, PNG, WebP, AVIF | WASM codecs incl. WebP/AVIF; project maintenance is uneven |
| **@saschazar/wasm-\*** (monorepo) | No (WASM) | small per codec | Good (stb resize) | JPEG, PNG (+WebP/AVIF/HEIF via sibling pkgs) | via sibling pkgs (MozJPEG, WebP, AVIF) | Per-format packages assembled by hand; operates on raw pixel buffers, not files; **~5 years stale** (see below) |

(Sizes are order-of-magnitude guidance and should be verified with
`npm pack`/`du` on the target platform. Codec/format support should be
re-checked against the current release of each package before committing.
*NEEDS VERIFICATION*.)

### The `@saschazar/wasm-*` ecosystem

This is the monorepo [`saschazar21/webassembly`](https://github.com/saschazar21/webassembly)
(MIT-licensed, dependency-free WASM, works in Node.js/browser/web-worker). As
suspected, it is **a family of related single-purpose packages — roughly one
per image format, plus a few utility operations** — rather than one all-in-one
library. The published packages are:

- **`@saschazar/wasm-image-loader`** — the pivot package. It **decodes JPEG &
  PNG into raw RGB(A) and resizes** to a target width/height (using
  `nothings/stb`'s `stb_image.h` / `stb_image_resize.h`). This is the closest
  analogue to the "load + resize" half of sharp.
- **`@saschazar/wasm-mozjpeg`** — **encodes** raw RGB into JPEG (MozJPEG).
- **`@saschazar/wasm-webp`** — encodes/decodes **WebP** (libwebp).
- **`@saschazar/wasm-avif`** — encodes/decodes AVIF (dav1d).
- **`@saschazar/wasm-heif`** — decodes HEIF/HEIC.
- **`@saschazar/wasm-exif`** — reads EXIF metadata from JPEG.
- **`@saschazar/wasm-mean-color`** — computes the mean/average color of an
  image (useful for placeholder/background colors).

**Operating model — buffers, not files.** Every package works on **raw RGB(A)
pixel buffers (`Uint8Array`)**, never on file paths, and there is **no
format-by-extension inference**. A resize-and-convert therefore requires
explicit wiring, e.g. for JPEG→WebP:

1. `decode()` the source bytes with `wasm-image-loader` (get RGB(A) +
   `dimensions()`),
2. `resize(buf, w, h, channels, newW, newH)` with `wasm-image-loader`,
3. **encode** the resized buffer with the format-specific package
   (`wasm-mozjpeg` for JPEG, `wasm-webp` for WebP),
4. `free()` the WASM memory.

**Practical caveats for this project:**

- Each module also needs its **`.wasm` file** shipped/bundled, and requires
  manual initialization via an `onRuntimeInitialized` callback before use.
- To match current AkashaRender behaviour you would combine at least
  `wasm-image-loader` + `wasm-mozjpeg` + a PNG encoder + `wasm-webp`, and write
  the buffer to disk yourself (mapping the `resize-to` extension to the right
  encoder). There is **no PNG encoder** in the set — `wasm-image-loader`
  *decodes* PNG but nothing here *encodes* PNG, so PNG output would need
  another library. This is a real gap for a project that currently supports
  PNG output.
- The monorepo was **last published around 5 years ago** (versions from 2020–
  2021) and has low download counts, so it should be treated as **effectively
  unmaintained** — a meaningful risk for a core dependency on Node.js 24.

Net: the ecosystem is elegant and genuinely small per codec, but it is a
**low-level, assemble-it-yourself toolkit** with a missing PNG encoder and
stale maintenance. It is more suited to a bespoke pipeline than to a
low-effort sharp replacement.

### Assessment against the requirement

The requirement is: JPEG + PNG today, **WebP output going forward**,
good-quality resizing, and a smaller install than sharp. SVG is out of scope.

- **Jimp** is the closest drop-in in terms of API shape (load file → resize →
  write file, with format chosen by extension) and it is pure JS with zero
  native dependencies, which is exactly what shrinks the install. Its one
  weakness for this project is that **WebP support is limited/unreliable**, so
  plain Jimp does not fully satisfy the stated WebP goal on its own.

- **WASM codec libraries** (photon-node, Squoosh codecs) do offer real **WebP**
  (and, for Squoosh, AVIF) encoding with a small install and no native
  binaries. The trade-offs are a lower-level API (you generally decode →
  resize → encode explicitly, and choose the encoder yourself rather than by
  file extension) and, for some of these projects, uneven maintenance. WASM
  resize speed is usually good.

- **`@saschazar/wasm-*`** is the most granular option (one WASM package per
  codec), but it is an assemble-it-yourself, buffer-level toolkit, **has no PNG
  encoder**, and is **~5 years stale** — so it is a poor fit as a low-effort,
  well-maintained sharp replacement despite its small per-codec size.

- **No single tiny pure-JS/WASM package cleanly covers JPEG + PNG + WebP** the
  way sharp does. WebP is the constraint that steers the choice toward pairing
  a pure-JS raster library with a WASM WebP encoder, or toward a WASM codec set.

### Recommended approach

Given the goals, two viable directions:

1. **Pragmatic hybrid (recommended for lowest risk):** Replace the raster
   resize path with a pure-JS/WASM library — **Jimp for JPEG/PNG** load/resize/
   write-by-extension, plus a **maintained WASM WebP encoder** for `.webp`
   outputs. Because the resize surface is only three calls (source:
   [lib/built-in.ts](../../lib/built-in.ts):249-268), introduce a small
   internal adapter that: (a) reads the source, (b) decodes and resizes to the
   target width, (c) encodes by destination extension (JPEG/PNG via Jimp, WebP
   via the WASM encoder). This keeps `built-in.ts` clean and isolates the
   library choice behind one module.

2. **WASM-first:** Standardize on a WASM codec library (e.g. photon-node or
   Squoosh codecs) to get JPEG/PNG/WebP (and possibly AVIF) with a small
   install, accepting the lower-level, buffer-based API and doing the
   extension→encoder mapping in the adapter.

Either way, SVG never enters this pipeline; SVG `<img>` sizing is handled in
the browser via `width=`/`height=` attributes.

In all cases, preserve the existing behaviour that the **output format is
selected by the `resize-to` extension** (source:
[built-in-guide/index.html.md](../../built-in-guide/index.html.md):189-192),
maintain **aspect-ratio-by-width** resizing (source:
[lib/built-in.ts](../../lib/built-in.ts):250), and keep the deferred
queue-processing model in `onSiteRendered()` unchanged (source:
[lib/built-in.ts](../../lib/built-in.ts):216-273).

### Things to validate before switching

- Confirm the actual installed size delta with `npm pack` / `du -sh
  node_modules/<pkg>` on Node.js 24 for each candidate.
- Confirm WebP **encode** support and quality in the chosen library's current
  release, and confirm a **PNG encoder** is available (the `@saschazar/wasm-*`
  set lacks one) (*NEEDS VERIFICATION*).
- Re-run the image-resize tests, including the documented **PNG→JPG**
  conversion case (source:
  [built-in-guide/index.html.md](../../built-in-guide/index.html.md):189-192).
- Correct the "No Format Conversion" pitfall in the
  [Image Resizing](../concepts/image-resizing.md) concept page.

## Sources

- [lib/built-in.ts](../../lib/built-in.ts) — the resize queue and its only three sharp calls (`sharp()`, `.resize()`, `.toFile()`)
- [built-in-guide/index.html.md](../../built-in-guide/index.html.md) — documents `resize-width`/`resize-to` and PNG→JPG format conversion
- [package.json](../../package.json) — declares `sharp` and its pinned resolution

## Related Pages

- [Image Resizing](../concepts/image-resizing.md) — the feature that depends on sharp
- [Built-in Plugin](../concepts/built-in-plugin.md) — the plugin hosting the resize queue
- [Lifecycle Hooks](../concepts/lifecycle-hooks.md) — `onSiteRendered()` runs the deferred resize queue

## Backlinks

- [Image Resizing](../concepts/image-resizing.md)
