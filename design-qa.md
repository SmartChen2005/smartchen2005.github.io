# Interactive 404 — fluid motion and Clear cloud puffs QA

Verified 2026-10-09. Final result: passed.

## Scope and preservation

`tools/404-source/revision-fluid-motion.md` authorizes livelier dragging/collisions, orange roadblocks, removal of Move/Shuffle and addition of Add. The latest request, `revision-clear-puff.md`, removes the Home arrow, preserves the hero's current pose during Clear and adds departing-prop cloud puffs. The prior preserve-objects brief remains the scene baseline. Cone plastic, striped barrier rails and warning posts use orange `#cf752b`; the yellow-cone variant is removed. Folding signs retain their yellow finish.

`tools/404-source/fluid-preservation.json` compares the committed scene before this follow-up with the implementation. Room, responsive camera, sign builders and shared geometry builders compare exactly. Cone/barrier/marker builders compare exactly after only the authorized orange substitutions and removal of the cone's obsolete color argument. Existing worn materials, reflective bands, black stripes, silver supports, lighting, checkerboard floor, walls and tiled skirting retain their appearance. No new dependencies or image assets were needed. Previous QA is archived in `qa-preserved-motion.md`; older preservation evidence remains historical.

## Visual review

Reviewed the prior preserved-scene comparison and the resting desktop, dense orange-roadblock scene and phone screenshots together. `tools/404-source/fluid-comparison.webp` archives the prior preserved-scene capture and motion revision, before Home-arrow removal; both were originally 1440×1000 CSS pixels and uniformly displayed at 936×650. The room, hero, camera and lighting match; the footer has Add/Clear and Home. Current captures show the text-only Home button. The dense screenshot confirms orange cones, barriers and posts with the retained worn folding signs. No editor panel opens during dragging.

Current repeatable captures live in ignored `tools/construction-qa/`: `construction-desktop-final.png`, `construction-pushed.png`, `construction-dense.png`, `construction-reference-size.png`, `construction-390x844.png`, `construction-320x568.png`, `construction-700x390.png`, `construction-touch-selected.png` and `construction-forced-colors.png`. Phone controls remain clear of the sign and fit within the viewport.

## Physics and interactions

The fixed 120 Hz solver adds spring following, short release glide, mass-dependent collision impulses, glancing yaw and small wall rebounds. The existing transactional swept contact solver still controls collision-safe positions. Failed wall-pinned chains roll back before applying impulses; damping settles exact rest. This is a floor-plane simulation with conservative circular footprints and a column volume; props rotate vertically and remain upright.

`node tools/test-construction-space.mjs` passes original placement/contact cases and new motion cases: 38 footprints, 1,000 swept moves, 350 dense pushes, four-object chain displacement, pinned-chain rollback, column exclusion, wall sliding and impossible spawning; spring convergence, release glide, contact-chain momentum, glancing yaw, soft wall rebound, stable exact rest, and 38 dynamic props over 1,600 fixed steps.

`node tools/test-construction-browser.cjs` passes real Chrome mouse, keyboard and native emulated touch with no console/page errors beyond expected missing-path HTTP 404 responses:

- Slight pointer jitter adds exactly one; dragging, rotation and cancellation never spawn. Native Add click/tap and Enter/Space each add one.
- A real drag pushes the hero through prop contact. Wheel rotation eases smoothly during dragging and survives continued movement. Outside a drag the wheel does not rotate a prop.
- Mouse release retains velocity and advances the object, then reaches exact stationary position. Dense dragging and subsequent inertial contact samples remain grounded, separated and inside bounds.
- The latest run populates a dense scene across all seven retained categories. Placement caps at forty and gracefully stops when visible space is full; no yellow cone is spawned.
- Clear stops motion, preserves the hero's exact current position/angle and removes only secondary props. Native mouse and touch Clear preserve the moved hero. A lone-hero Clear creates no cloud. Move, Shuffle and the movement toolbar are absent; Home has no detached arrow.
- Each departing prop shrinks behind seven sprites using one shared procedural cloud texture. Clouds bloom, rise and fade over 720 ms; smoke cleanup completes, repeated Clear releases outstanding clouds and props added during an earlier puff remain alive. `construction-clear-puff.png`, `construction-clear-dense.png` and `construction-clear-mobile.png` capture the live effect. Desktop single/dense and phone captures were visually reviewed.
- Arrow movement, R rotation and bracket selection retain keyboard access. Native touch dragging moves without spawning; the next tap adds one.
- 1440×1000, 768×1024, 390×844, 320×568 and 700×390 layouts retain viewport-contained native action targets of at least 44×44px and no horizontal overflow.
- Reduced motion skips entrance animation, directly moves collision-safe props and has no release glide. Forced colors, nested missing-path dependencies, Home navigation, no-JavaScript and unavailable-WebGL fallbacks work.

## Other checks and limits

Latest placement request supersedes the previous footer alignment: Home is in the top-left corner, and the original small operation hint sits above Add/Clear at bottom-right, aligned with Clear's right edge. Browser measurements at 1440, 616, 390 and 320 CSS pixels, including 1.5 device pixel ratio, confirm Home's top-left position, exact hint/Clear right alignment, 10px desktop / 9px phone hint text, 44px actions and viewport-contained regions. `tools/construction-qa/corner-controls-*.png` captures the resulting layouts. A stylesheet revision parameter prevents reuse of older cached styles; packaging validation resolves local URL pathnames before checking files.

`node tools/validate-site.mjs`, scene/space syntax checks, `git diff --check` and the strict premium audit pass. The auditor excludes deployed `dist/`, so browser verification supplies runtime evidence. No framework build, TypeScript configuration or formatter is configured in this static repository.

Native touch coverage uses Chrome emulation; physical Safari/iOS GPU behavior was not measured. Fine print retains its small physical-sign scale. No remote deployment was requested or verified; the local preview remains running.
