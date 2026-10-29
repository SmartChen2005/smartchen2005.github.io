# Gallery image optimization — 2026-10-29

The user explicitly chose **3000 pixels on the long edge** for display/viewer
copies. Smaller originals are never enlarged. Existing Gallery sources are
mostly 1280–2048px; the larger Stills screenshots now have a capped viewer copy.
All original files, CMS text, photograph order, captions, natural ratios and
Original links remain unchanged. The unchanged SVG wordmark/drawings stay vector.

The asset inventory covers 163 original files, 547 logical size variants and
539 distinct fingerprinted WebP files. `gallery-image-policy.json` owns long-edge
steps 480/960/1600/2400/3000, quality 92 and method 6. The generator resizes from
the original with Lanczos, preserves embedded ICC profiles and removes camera
metadata from derivatives. Original and output SHA-256 values are recorded.
Identical encodings share a filename; cached valid copies need not be regenerated.

Every cover, article photograph, comparison/carousel, image index and Stills
print uses `srcset`/`sizes`. Lazy images use `auto` where supported with explicit
fallback sizes; eager hero/index images have explicit responsive slots. The
shared helper is `gallery-media.mjs`. Gallery/Stills viewers load the largest
capped copy on demand. Stills no longer automatically fetches its full original;
native Original links, modified clicks and no-JS fallback remain available.

## Actual before/after image transfers

Cold Chrome contexts; desktop 1440×1000 at 2× and phone 390×844 at 3×. Each
measurement browses the reachable image slots through the page; Stills loads
all twenty index previews for a deterministic comparison. These totals measure
image transfer after browsing, rather than initial viewport bytes, repository
size or elapsed load time. Viewer interaction is checked after the measurement.

| Route | Before | Desktop after | Phone after |
| --- | ---: | ---: | ---: |
| Gallery home, 13 images | 3,130,804 B | 1,718,812 B | 1,616,760 B |
| Deliberate Practice, 23 images | 3,778,954 B | 2,841,384 B | 2,467,036 B |
| Rhythms of Chaos, 12 images | 3,334,534 B | 1,664,938 B | 1,518,644 B |
| Intro to Darkroom, 17 images | 2,725,464 B | 2,104,582 B | 2,135,498 B |
| Stills, 20 previews | 1,515,630 B | 865,360 B | 865,360 B |

Phone Gallery-home transfer decreases 48.4%; sampled phone reductions are
21.6%–54.5%. Before/after Gallery screenshots preserve the layout and apparent
photograph colors. Each representative viewer was checked through completion
of its capped high-resolution request; none fetched the uncapped original.

## Validation and reproduction

- `python tools/prepare-gallery-images.py` builds/verifies renditions from local
  originals. Requires Pillow. Production Notion workflow pins Pillow 13.0.0;
  the available local Pillow 12.3.0 produced these committed copies. Content
  hashes keep encodings safe across platform/library versions.
- `node tools/render-gallery.mjs` and `node tools/render-stills.mjs` synchronize
  all fourteen public Gallery/Stills pages. Notion sync prepares new images
  before rendering; offline rendering uses the committed manifest.
- `node tools/test-gallery-image-optimization.mjs` passed: 163 original hashes,
  all variants/hashes/dimensions, no enlargement, natural proportions, every
  retained raster and all fourteen pages. Included in Pages and Notion checks.
- All 19 Pages Node checks plus Gallery document/catalogue and Stills checks
  passed (22 commands including the preserved-camera run). Photo sequence,
  source/render parity, carousel recovery, captions and original links remain.
- `node tools/test-gallery-images-browser.cjs` passed ten cold desktop/phone
  cases and actual viewer high-resolution completion, retained Original links,
  native Escape, no page errors or horizontal overflow. `--baseline` captures
  the before version; `GALLERY_IMAGE_QA_DIR` selects screenshot/result output.
- `node tools/test-gallery-images-browser.cjs --stills-regression` passed the
  existing full Stills browser suite: helix/index geometry, mouse/touch/keyboard,
  original tones, focus, responsive viewports, reduced motion, forced colors,
  simulated zoom, long captions, no-JS and delayed/failed image fallbacks.
- `PLAYWRIGHT_MODULE` selects an installed Playwright package. The browser
  runner owns and closes its static preview server; external embeds are blocked
  during image-transfer measurements so third-party video does not skew them.
