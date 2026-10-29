# Homepage film-photo optimization — 2026-10-28

The user's clarified scope is to optimize only the four Filmmaker photographs.
The important portrait loads its full original 6000×4000 JPEG (2,551,590 bytes).
The motorsport/Three.js graph and scene construction load with the homepage as
before. The unused portrait WebP derivatives and deferred car loader are removed;
the previous experiment remains in Git history.

The four film JPEG originals total 23,538,485 bytes and remain unchanged. Their
uncropped quality-90 WebP derivatives use responsive `srcset` and `sizes`, with
low fetch priority and preserved embedded ICC profiles. There are no layout,
color/filter or animation changes. The 960px alternatives total 339,240 bytes,
a 98.6% reduction. Phones use 480px alternatives; 4K 2× uses 1920px alternatives.
Transfer sizes do not imply an equivalent wall-clock speedup.

## Measured cold-cache requests in Chrome

| Viewport | Pixel ratio | Four film photos | All homepage images |
| --- | --- | --- | --- |
| 1440 × 1000 | 2 | 339,240 B | 2,890,830 B |
| 390 × 844, touch | 3 | 105,928 B | 2,657,518 B |
| 3840 × 2160 | 2 | 1,052,884 B | 3,604,474 B |

The original portrait is present at its full 6000px natural width in every case.
Three.js and motorsport requests are present before any car interaction. Film
previews develop completely to `filter: none`; car hover/click/Escape works.
There are no page errors or horizontal overflow in these three viewports.

## Reproduce

- `python tools/prepare-home-assets.py` requires Pillow with WebP support;
  generates only the four film photos and records their original/derivative hashes.
- `node tools/validate-site.mjs` validates source/render integrity, all responsive
  variants/hashes and the original portrait's byte identity.
- `node tools/test-home-loading.mjs` checks the four-photo scope, responsive
  alternatives, aspect ratios and film media budgets, plus the original portrait URL.
- `node tools/test-home-performance.cjs` starts and closes its own static server
  and runs actual Chrome desktop/phone/4K requests, original 6000px portrait,
  arrival-time Three.js/motorsport requests, complete photo development,
  car hover/click/Escape and overflow/error checks. Set `PLAYWRIGHT_MODULE` to
  an installed Playwright package and `HOME_QA_DIR` for screenshots/results.
  Optional `--compare` captures the HEAD homepage markup as a visual/media
  baseline; CSS and runtime use the working tree.
- Existing homepage scene/state, transition and Pages checks remain applicable.
