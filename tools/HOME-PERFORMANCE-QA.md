# Homepage loading — 2026-10-28

The four Filmmaker JPEG originals total 23,538,485 bytes; the portrait adds
2,551,590 bytes. Originals and archived independent editions remain unchanged.
The homepage now uses uncropped quality-90 WebP derivatives, responsive `srcset`
and `sizes`, low-priority film photos and a high-priority portrait. Embedded ICC
profiles are preserved. There are no layout, color/filter or animation changes.

The 3D scene's module graph and construction begin on the first car interaction.
Cold clicks queue once; leaving or Escape cancels queued play. Loading preserves
latest layout/input and request failure keeps the sentence and native links usable.

## Measured cold-cache requests in Chrome

| Viewport | Pixel ratio | All homepage images | All arrival resources |
| --- | --- | --- | --- |
| 1440 × 1000 | 2 | 369,228 B | 647,854 B |
| 390 × 844, touch | 3 | 135,916 B | 414,542 B |
| 3840 × 2160 | 2 | 1,082,872 B | 1,361,498 B |

The previous five originals transferred 26,090,075 bytes. Desktop images are
98.6% smaller, phone images 99.5% smaller. The four film photos alone use
339,240 bytes at 960px (98.6% less). Transfer sizes do not imply an equivalent
wall-clock speedup; real loading time also depends on network, cache and device.
The browser requests neither original JPEGs nor Three.js/motorsport on arrival.
4K 2× uses the 1920px film alternatives. All four photographs finish development
to `filter: none`; before/after screenshots preserve their ratios, placement and
apparent colors. Desktop, phone and 4K have no overflow or page errors.

## Reproduce

- `python tools/prepare-home-assets.py` requires Pillow with WebP support;
  records original/derivative hashes and does not modify originals.
- `node tools/validate-site.mjs` validates source/render integrity, every
  responsive variant/hash and the original portrait's byte identity.
- `node tools/test-home-loading.mjs` checks media budgets, lazy module ownership,
  deduplication, queued play, cancellation, latest resize/input, failure and retry.
- `node tools/test-home-performance.cjs` starts and closes its own static server
  and runs actual Chrome desktop/phone/4K cold requests, photo development,
  cold car hover/click/Escape, failed-module fallback and overflow/error checks.
  Set `PLAYWRIGHT_MODULE` to an installed Playwright package and `HOME_QA_DIR`
  for screenshots plus `results.json`. Optional `--compare` captures the HEAD
  homepage markup as a visual/media baseline; CSS and runtime use the working tree.
- Existing homepage scene/state, transition and Pages checks remain applicable;
  the new loading regression is included in the Pages validation workflow.

Passed the above static/loading/browser checks, all 17 Pages Node checks,
and the strict frontend audit with zero findings. Visual QA covered the
original/compressed desktop exhibition and the phone portrait/card arrival.
