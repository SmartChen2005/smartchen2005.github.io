# Homepage media optimization — 2026-10-29

The latest request sets the display portrait to 3000×2000 pixels.
The portrait uses Lanczos resizing and quality-95 WebP without cropping:
2,551,590 bytes becomes 318,602 bytes, an 87.5% reduction from the original.
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
| 1440 × 1000 | 2 | 339,240 B | 657,842 B |
| 390 × 844, touch | 3 | 105,928 B | 424,530 B |
| 3840 × 2160 | 2 | 1,052,884 B | 1,371,486 B |

The lightly compressed portrait has the requested 3000×2000 natural size in every case.
Three.js and motorsport requests are present before any car interaction. Film
previews develop completely to `filter: none`; car hover/click/Escape works.
There are no page errors or horizontal overflow in these three viewports.

## Reproduce

- `python tools/prepare-home-assets.py` requires Pillow with WebP support;
  generates the four film photos plus the 3000×2000 quality-95 portrait, recording
  their original/derivative hashes.
- `node tools/validate-site.mjs` validates source/render integrity, all responsive
  variants/hashes, the light portrait's hash and the original portrait's byte identity.
- `node tools/test-home-loading.mjs` checks the four-photo scope, responsive
  alternatives, aspect ratios and film media budgets, plus requested portrait resolution.
- `node tools/test-home-performance.cjs` starts and closes its own static server
  and runs actual Chrome desktop/phone/4K requests, lightly compressed 3000px portrait,
  arrival-time Three.js/motorsport requests, complete photo development,
  car hover/click/Escape and overflow/error checks. It also checks font-independent
  SVG arrows on five affected mobile routes, including all six Projects rows and
  Music Station's open native details/dialog. Set `PLAYWRIGHT_MODULE` to
  an installed Playwright package and `HOME_QA_DIR` for screenshots/results.
  Optional `--compare` captures the HEAD homepage markup as a visual/media
  baseline; CSS and runtime use the working tree.
- Existing homepage scene/state, transition and Pages checks remain applicable.
- `node tools/render-site-icons.mjs` synchronizes directly maintained arrows;
  `node tools/test-site-icons.mjs` checks all 23 maintained pages and shared
  normalization. Generated pages apply the same helper at output, so re-rendering
  cannot restore the platform-dependent glyph. Existing frozen editions retain
  their original payload hashes.
