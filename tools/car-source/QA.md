# Car daydream QA — 2026-10-17

Completed browser review of the final 14-second runtime, not just a storyboard.

Passed:

- `node tools/validate-site.mjs` — site content/asset integrity and protected portrait/source parity.
- `node tools/test-home.mjs` — six film scenes and still ending, six manual RPM unloads, asset SHA-256, finite geometry at six desktop/phone/landscape sizes, no idle animation loop, restart, reduced motion, background pause/resume and the existing game/gallery lifecycle.
- `node tools/test-home-state.mjs` — all existing identity selection, dismissal, keyboard and restoration behavior.
- `node tools/test-game-transition.mjs` and `node tools/test-photo-transition.mjs` — sibling navigation/hover regressions.
- `node tools/test-business-card.mjs`, `node tools/test-card-perlage.mjs`, `node tools/test-card-orientation.mjs` — unchanged contact-card interactions and materials.
- Module syntax checks, asset packaging and `git diff --check`.
- `node tools/car-source/browser-qa.cjs` with existing Chrome/Playwright — followed the actual clock through ignition, rally, thermal, arboreal, orbit, return and idle; checked bright sentence pixels in every screenshot; exercised keyboard Space/Escape, exit cleanup, reduced motion, 844×390 landscape, 390×844 mobile touch toggles, no horizontal overflow, blocked images and offline continuation. No page errors.

Screenshots were visually reviewed for the major scenes and the final mobile
orbit. Adjustments resolved finale title/photo overlap, initially weak flames,
and the mobile vehicle's right-edge clipping. The sentence crop was inspected
separately to confirm clean text above the canvas.

Static audit was **not a clean pass**. `audit_project.py . --mode strict` reports
16 literal-button findings in pre-existing inert downloaded/ignored source and
QA HTML. A focused exact-copy audit of the deployed homepage reports two more
literal-button findings, both at `index.html:30`: the existing name and car
buttons. The auditor checks only inline onclick/@click attributes and does not
recognize the existing `addEventListener` loop in `dist/home.mjs`. Both buttons'
actual actions pass controller tests and browser keyboard/touch tests, so these
two findings are adjudicated false positives. No inline handlers or fake actions
were added to satisfy the scanner. Raw results and source hashes are retained in
`premium-audit.json`; this evidence must not be described as zero findings.

Limits: Chrome's mobile/reduced-motion emulation was used; no physical handset,
Safari, or real orientation sensor was exercised. This change introduces no
sensor behavior or audio. Live deployment status is reported in the completing
chat after push; local checks do not imply publication.
