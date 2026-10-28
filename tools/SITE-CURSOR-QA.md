# Shared adaptive pointer — 2026-10-27

The user requested coverage of all pages except dedicated pointer experiences,
with pale default pointers on dark backgrounds. This extends the accepted
homepage design; it does not change the archived experiments.

## Ownership and coverage

- `dist/site-cursor.mjs` / `dist/site-cursor.css` own the shared controller and
  visual styles. `home-cursor.*` remain small compatibility entries, sharing the
  same code while retaining homepage identity frames and accepted scene inks.
- The shared dot/navigation capsule uses white ink with `mix-blend-mode:
  difference`. Contrast follows the actual painted background without image
  sampling or a continuous animation loop. Native action controls use a 22px dot.
- All 22 live pages are connected. The live camera GDD and nine HTML pages in
  immutable editions are excluded. Their files remain unchanged.
- Forms/editable regions, media controls, iframes, existing grab/zoom surfaces and
  the 404's object-grab state retain native cursors. Future pages/regions can use
  `data-page-cursor="native"` / `data-cursor-native` for explicit ownership.
- The decorative pointer enters a native modal's top layer and returns to body
  after closing. Entering iframe content releases the parent's pointer. Hover
  changes caused by keyboard navigation cannot re-enable cursor replacement.
- Gallery/Stills/shared project-header templates consume `tools/site-cursor.mjs`.
  `render-site-cursor.mjs` fills direct-page includes without rewriting template
  output. 404 references are root-relative. `test-site-cursor.mjs` runs in Pages
  validation to prevent missing includes or custom-pointer collisions.

## Checks performed

- Full `node tools/validate-site.mjs` and every Node check currently configured
  in `.github/workflows/pages.yml`, including live/preserved camera checks and all
  78 frozen payload hashes.
- Additional Gallery, Stills and game-transition checks; VR/MASB source/render
  parity; syntax and Git whitespace checks.
- Strict premium audit of `dist/`: zero findings. Evidence:
  `site-cursor-design-audit.json` in the task visualization directory.
- `node tools/test-site-cursor-browser.cjs`: all 22 live routes and six browser
  groups pass. Actual screenshot pixels verify pale dots against Projects and
  Polaroid room black backgrounds and a dark dot against Gallery white. Native
  modal visibility/closure, iframe handoff, Music Station grab/range controls,
  editing, reduced motion, forced colors, SX-70 ownership, 390px mouse, keyboard
  and touch navigation are exercised. No unexpected page errors.
- `node tools/test-home-cursor-browser.cjs`: original nine browser groups pass
  against the shared controller. Existing Chrome cross-document transition
  cancellation messages remain separately recorded as described in
  `HOME-CURSOR-QA.md`.

For browser reproduction, set `PLAYWRIGHT_MODULE` to an installed Playwright
package, run the static site at `CURSOR_PREVIEW_URL` (default
`http://127.0.0.1:4185`), and optionally set `SITE_CURSOR_QA_DIR` /
`CURSOR_QA_DIR`. The full-site check also uses `sharp` alongside the bundled
Playwright package for screenshot-pixel assertions; `SHARP_MODULE` may override
its location. No dependency was added to the production site.

Task-local evidence is in `site-cursor/` (`results.json` and representative
desktop/modal/camera/narrow PNGs), plus `site-home-cursor/` for homepage
regressions. Screenshots were visually inspected. Design context remains in its
existing prose format; the standalone designmd CLI is unavailable because this
environment has no npx installation.
