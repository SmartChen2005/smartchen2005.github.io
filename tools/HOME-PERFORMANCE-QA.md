# Homepage media optimization — 2026-10-29

The latest request permits light portrait compression while retaining its detail.
The portrait uses quality-95 WebP at the complete 6000×4000 resolution, with no
resizing or cropping: 2,551,590 bytes becomes 1,908,962 bytes, a 25.2% reduction.
The original JPEG remains unchanged and hash-verified. Enlarged face-detail
comparison found no obvious change to detail or the original blue treatment.
The motorsport/Three.js graph and scene construction still load with the homepage.

The four film JPEG originals total 23,538,485 bytes and remain unchanged. Their
uncropped quality-90 WebP derivatives use responsive `srcset` and `sizes`, with
low fetch priority and preserved embedded ICC profiles. There are no layout,
color/filter or animation changes. The 960px alternatives total 339,240 bytes,
a 98.6% reduction. Phones use 480px alternatives; 4K 2× uses 1920px alternatives.
Transfer sizes do not imply an equivalent wall-clock speedup.

## Measured cold-cache requests in Chrome

| Viewport | Pixel ratio | Four film photos | All homepage images |
| --- | --- | --- | --- |
| 1440 × 1000 | 2 | 339,240 B | 2,248,202 B |
| 390 × 844, touch | 3 | 105,928 B | 2,014,890 B |
| 3840 × 2160 | 2 | 1,052,884 B | 2,961,846 B |

The lightly compressed portrait retains its full 6000px natural width in every case.
Three.js and motorsport requests are present before any car interaction. Film
previews develop completely to `filter: none`; car hover/click/Escape works.
There are no page errors or horizontal overflow in these three viewports.

## Reproduce

- `python tools/prepare-home-assets.py` requires Pillow with WebP support;
  generates the four film photos plus the unscaled quality-95 portrait, recording
  their original/derivative hashes.
- `node tools/validate-site.mjs` validates source/render integrity, all responsive
  variants/hashes, the light portrait's hash and the original portrait's byte identity.
- `node tools/test-home-loading.mjs` checks the four-photo scope, responsive
  alternatives, aspect ratios and film media budgets, plus full portrait resolution.
- `node tools/test-home-performance.cjs` starts and closes its own static server
  and runs actual Chrome desktop/phone/4K requests, lightly compressed 6000px portrait,
  arrival-time Three.js/motorsport requests, complete photo development,
  car hover/click/Escape and overflow/error checks. Set `PLAYWRIGHT_MODULE` to
  an installed Playwright package and `HOME_QA_DIR` for screenshots/results.
  Optional `--compare` captures the HEAD homepage markup as a visual/media
  baseline; CSS and runtime use the working tree.
- Existing homepage scene/state, transition and Pages checks remain applicable.
