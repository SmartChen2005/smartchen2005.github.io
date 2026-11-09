# Halftone Bloom — verification (2026-11-09)

Scope: `/projects/figures-of-speech/halftone-bloom/` only, plus its documentation and check in the existing Pages workflow. The Figures of Speech index, catalogue data, numbering, chronology and all immutable editions are unchanged. The two pre-existing untracked UnifrakturCook font files are unrelated and are not staged.

## Executed checks

- `node tools/test-halftone-bloom.mjs` — passed. Checks local dependencies and absence from the catalogue; deterministic replay, density subsets, fixed grid, glyph/counter clearance, varied spatial density and activation rhythm at desktop, phone and 4K. The actual controller runs with a deterministic clock to check completion/idle, repeated replay, reduced-motion and forced-color startup, a live preference change, page hiding/exit, resize, Escape/focus restoration and Canvas failure. This check is also included in the Pages workflow.
- `node tools/validate-site.mjs` — passed.
- `node tools/test-figures-of-speech.mjs` — passed: seven studies, 102 preserved payload hashes across seven editions, source/render parity and 25 Git-backed dated records.
- `node tools/test-site-cursor.mjs` — passed: 25 eligible live pages, including this route; 16 dedicated/frozen exclusions.
- `node tools/test-site-icons.mjs` — passed: 26 maintained pages, native links and idempotence.
- `node --check` on both new ES modules — passed.
- `audit_project.py <scoped-review-copy> --mode strict` — passed with zero findings on copies of this route's HTML/CSS outside the auditor's excluded `dist/` tree. JSON evidence is retained in the chat's `halftone-bloom-review/audit.json` artifact directory. This is a static source check, not runtime or full accessibility certification. Replay starts disabled and is enabled only after its listener and field are ready.

## Real-browser review

Used the in-app Chromium browser against a local HTTP server, with actual rendered screenshots and native control input:

- **1280 × 720:** initial, partial and settled states reviewed. Default composition settles at 10,599 dots. The real white heading remains opaque, untransformed and at the same measured bounds (x 176.27, y 159.59, width 908.06, height 400.67 CSS px). The early frame contains local clusters against a mostly empty background; the final frame has dense and sparse clouds with visible glyph-shaped clearance and open counters.
- **390 × 844:** 2,905 settled dots; the complete word and controls fit, with no horizontal overflow. Reviewed the final composition and expanded adjustment panel.
- **844 × 390:** 3,605 settled dots; reviewed the final composition and all expanded controls. The panel remains inside the viewport (top 127.90, bottom 334.00 CSS px), with no horizontal overflow.
- **320 × 568:** complete word fits with no horizontal overflow; all three controls remain reachable in the expanded disclosure (top 219.90 CSS px).
- Clicked Replay repeatedly; adjusted all three native ranges using End; confirmed 155%, 2.5 px and 2.0× labels. Escape closes the panel and restores focus to its summary. Restored default settings by reload. Browser console had no warnings or errors.
- Reset temporary viewport overrides after testing. Canvas and the controls are deliberately independent of the heading's layout. The count has `aria-live="off"`; a separate status announces only the start and completion.

Reduced-motion, forced-color and Canvas-failure lifecycle behavior are covered by the actual-controller harness; browser preference emulation was unavailable, so no claim is made of real-browser assistive-technology or preference-mode testing.

## Performance bounds

An isolated Node field-construction smoke measurement (four builds with synthetic uniform glyph distance, not an end-to-end browser benchmark) observed:

| Viewport | Grid cells | Field build range |
| --- | ---: | ---: |
| 1280 × 720 | 57,600 | 15.5–27.6 ms |
| 390 × 844 | 20,678 | 4.2–5.5 ms |
| 3840 × 2160 | 135,240 | 34.0–59.2 ms |

The field is sorted once; each frame draws only newly activated squares. The controller requests no frames after settlement. The backing store is capped around eight million physical pixels. No infinite particle simulation, texture animation, image download or web-font swap is involved.
