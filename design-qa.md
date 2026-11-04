# Projects: Polaroid's own yellow script title

Date: 2026-11-04. Scope: begin the user's project-specific art direction with Polaroid's actual title font/color. The clear common grid remains; Apple Design is no longer a visual restriction. Earlier QA is retained below.

Artifacts: `C:/Users/15811/.codex/visualizations/2026/11/04/01a1a74e-c80a-7101-82ef-3b23eb02d719/projects-polaroid-type/`.

- Baseline: `71e5466`, `before-desktop.png`. Source art: `source-project.png` and live computed `.wall-title` styles from the detail page confirm Great Vibes 400 / `rgb(246, 201, 52)`. The existing font and license are reused, with no new assets or dependencies.
- Implementation: `after-desktop.png`, `after-phone.png`, `after-narrow.png` inspected at native aspect ratios. The title becomes the card's identifying artwork; photo treatment, body readability, layout rhythm and surrounding cards remain coherent. Script descenders/flourishes have 1.2 leading and padding; the full title is visible at 320px.

| Before | After | Why |
| --- | --- | --- |
| White system-font Polaroid title | Project's yellow Great Vibes title | Make the entry reflect the game's own art. |
| Apple styling described as the overall direction | Shared browsing structure with named project themes | Support the user's creative portfolio direction without losing a clear overview. |

Real in-app browser verification at 1440, 768, 390 and 320 CSS pixels confirms the loaded font, exact yellow, contained title/heading and no horizontal overflow (`browser-results.json`). Pointer hover and keyboard focus retain the yellow. Visible Tab focus, Enter navigation into Polaroid and Back restoration pass (`keyboard-results.json`). Responsive captures were made after returning the active tab to Projects; temporary viewport changes are reset before handoff.

Passed `node tools/validate-site.mjs`, `node tools/test-site-icons.mjs`, `node tools/test-site-cursor.mjs`, renderer byte-for-byte idempotence and `git diff --check`. Strict `dist/` design audit records zero findings. Reduced-motion behavior and the photo/star/press controllers are unchanged; no new OS-preference, physical-phone or cross-browser test is claimed. Forced-color/print title tokens are explicitly adapted in CSS.

final result: passed

---

# Projects: denser stars and the Music Station device

Date: 2026-11-04. Scope: more stars on Gran Turismo and the existing Music Station device in its card. The implementation reuses the project's existing SVG reconstruction, not a new illustration or a changed model. Earlier QA remains below.

Artifacts: `C:/Users/15811/.codex/visualizations/2026/11/04/01a1a74e-c80a-7101-82ef-3b23eb02d719/projects-device/`.

- Source: `8cc44af`, fresh `before-desktop.png`. Implementation: `after-desktop.png`. Both are 1424×2026 bitmap captures from CSS viewport 1440×1000/resting state, omitting the same scrollbar strip. `comparison.png` was inspected with source left and implementation right, both scaled to 720px wide. Typography, layout rhythm, page palette, existing image quality and all visible copy remain unchanged outside the requested star density/device cover.
- Focused inspection: the existing SVG was rasterized only for inspection as `device-source.png`; `preview.png` shows its complete board/LED/sensor silhouette in the actual card and the denser star background. The published asset itself is unchanged. Its stage uses `#111613`, `object-fit: contain` and a small scale to remove unused transparent margins, retaining the 16:9 card slot.

| Before | After | Why |
| --- | --- | --- |
| 56 desktop / 33 phone star points | 160 desktop / 72 phone points | Make the requested starfield visibly denser. |
| Music Station placeholder | Existing 1000×800-viewBox device SVG | Show the actual project reconstruction while keeping the established card layout. |

Real in-app browser checks at CSS widths 1440, 768, 390 and 320 confirm star counts, a loaded/contained device image, no horizontal overflow and no clipped titles. `after-phone.png` and `browser-results.json` record narrow inspection. All seven card links retain visible Tab focus; Music Station native navigation and Back restoration pass (`keyboard-results.json`). Other five placeholders remain available. No new animation loop or runtime controller change is introduced.

Passed site validation; site icons/all-seven-links/renderer-idempotence checks; shared pointer checks; `test-music-station.mjs` including original asset/firmware hashes; `git diff --check`; strict `dist/` design audit (zero findings). Preference behavior uses the unchanged controller; no new OS-preference or physical-phone touch test is claimed. No actionable P0/P1/P2 finding remains in the scoped comparison.

final result: passed

---

# Projects: image placeholders for Gran Turismo and all five smaller projects

Date: 2026-11-04. Scope: the user's clarification that every card retains an image; Gran Turismo's stars are its background. Six explicit neutral placeholders reserve future project images. Earlier QA is retained below.

## Current evidence

Artifacts: `C:/Users/15811/.codex/visualizations/2026/11/04/01a1a74e-c80a-7101-82ef-3b23eb02d719/projects-placeholders/`.

- Reference: fresh `before-desktop.png` from source `e56ffb4` (1424×1752); implementation `after-desktop.png` (1424×2026), both at CSS viewport 1440×1000/resting state. Page height grows intentionally to accommodate the five new cover images. The same scrollbar strip is omitted and both images are scaled equally in `comparison.png`, baseline left, implementation right.
- Focused inspection: `preview.png` shows Gran Turismo and all five smaller covers. Phone implementation: `after-phone.png`; checks at CSS widths 768, 390 and 320 are in `browser-results.json`.

| Before | After | Why |
| --- | --- | --- |
| Gran Turismo has only a star background | Star background plus a separate 16:9 foreground image | Restore the image requested by the user. |
| Five smaller text cards | Five image-above-copy cards, retaining the 3/2/1-column grid | Reserve an individual image for each project. |

The comparison has no actionable P0/P1/P2 finding. Existing typography, colors, labels, Header, Polaroid print and seven native destinations remain. All seven images load; the six new images use the explicitly labelled local `project-placeholder.svg`. All six reserved slots measure 16:9 and no inspected width has horizontal overflow or clipped titles. Native SVG text and neutral paper are intentional placeholder UI, not invented project artwork. Placeholder paths are independently owned by their catalog entries. On phones both featured cards stack their copy and images; smaller cards remain a single image-above-copy column.

Real in-app browser input confirms that the foreground image does not block star parallax, Gran Turismo navigation, browser Back or any of the seven Tab links/focus outlines. `keyboard-results.json` records focus checks. Controller behavior is unchanged. Site validation, icon/all-seven-links/renderer-idempotence checks, shared pointer checks, the existing controlled starfield runtime checks, `git diff --check` and strict `dist/` design audit pass. No physical-device or OS preference-switch coverage is claimed.

final result: passed

---

# Projects: wider print rim and Gran Turismo starfield

Date: 2026-11-04. Scope: the user's requested slight increase in the landscape print's white border and replacement of Gran Turismo's image window with a black, interactive star background.

## Current evidence and review

Artifacts: `C:/Users/15811/.codex/visualizations/2026/11/04/01a1a74e-c80a-7101-82ef-3b23eb02d719/projects-stars/`.

- Reference: source commit `6037803` and the fresh `before-desktop.png` capture (1424×1750). Implementation: `after-desktop.png` (1424×1752), both from the same 1440×1000 CSS viewport/resting state. The extra page height follows the explicit 360px star-card minimum. Both captures omit the same scrollbar strip; no density mismatch.
- Same-input comparison: `comparison.png`, baseline left and implementation right, both scaled to 720px wide. Focused full-size inspection: `preview.png` (the two featured cards) and `stars-active.png` (real pointer interaction).
- Phone implementation: `after-390.png` (374×2186), `after-320.png`; geometry and visibility measurements at CSS widths 1440, 768, 390 and 320 are in `browser-results.json`.

| Before | After | Why |
| --- | --- | --- |
| 6–10px top/side rim, 18–34px lower rim | 9–14px top/side rim, 24–42px lower rim | Slightly more white paper around the landscape photograph, as requested. |
| Thumbnail fragments and a framed image window | Full-card black field, 56 sparse star points in three layers | Match the simpler star-background direction. The archived thumbnail remains unchanged. |
| Fragment assembly on hover | Small depth-dependent star movement and gentle brightness change | Give the starfield a quiet pointer response while preserving normal navigation. |

The source/implementation comparison found no actionable P0/P1/P2 issue. Typography, copy, shared Header, seven destinations, small-card styling and focus affordances remain intact. The wider physical print and full-card black background are intentional differences. Colors are owned by route CSS: black `#000`, stars `#f0f3fa`, existing off-white print. Polaroid image bytes remain unchanged. The starfield uses native generated points, with no replacement image or additional asset request. On phones the star card uses a 280px minimum and 33 visible stars; text and card heights can still grow naturally. All four inspected widths have no horizontal overflow or clipped titles.

## Current verification and limits

- Passed site validation, site icons/all-seven-links/renderer-idempotence checks, shared pointer checks, controller syntax, `git diff --check` and strict `dist/` design audit (zero findings).
- The current artifact `runtime-check.cjs` passed depth response ratios, pointer brightness, rest/RAF sleep, photo development, press cancellation, keyboard/hidden/offscreen/resize cleanup, preference/coarse-pointer fallbacks, static HTML stars and native navigation ownership.
- Real in-app browser checks observed three distinct star-layer transforms, black hover background, wider paper padding, four viewport widths, all seven Tab links with visible focus, static focused stars, Gran Turismo navigation and browser Back restoration. Results are in `keyboard-results.json` and `browser-results.json`.
- Motion/contrast/coarse-pointer preferences were verified in the controlled runtime and CSS; no OS preference switch or physical-phone touch test is claimed. The earlier baseline MutationObserver observation remains historical; no shared script changes are part of this iteration.

final result: passed

---

The preceding preview iteration and earlier 404 QA are retained below as historical evidence.

# Projects: Polaroid and Gran Turismo preview effects

Date: 2026-11-04. Scope: only the first two Projects preview regions, following the user's selection of the proposed photo-development and ruin-reassembly effects. The existing screenshot is the visual reference for retained page structure; the requested effects intentionally change those two previews.

## Evidence

Artifacts are in `C:/Users/15811/.codex/visualizations/2026/11/04/01a1a74e-c80a-7101-82ef-3b23eb02d719/projects-effects/`.

- Source: repository `8d7372f`, `before-desktop.png` and `before-phone.png`.
- Implementation: local `/projects/`, `after-1440.png`, `after-390.png`, `after-320.png`, `polaroid-active.png` and `gran-turismo-active.png`.
- Same-input comparisons inspected: `comparison-desktop.png` and `comparison-phone.png`, with the baseline on the left and implementation on the right.
- Desktop: CSS viewport 1440px wide; both full-page bitmap captures are 1424×1750. Phone: CSS viewport 390×844; both full-page bitmap captures are 374×2264. Browser screenshots omit the scrollbar strip equally. Comparisons apply the same scale to each source/implementation pair, with no density mismatch.
- States: resting page; real pointer entry/movement; keyboard Tab focus; native project navigation and Back restoration. Additional geometry checks at CSS widths 768 and 320 are in `browser-results.json`; keyboard results are in `keyboard-results.json`.
- Focused inspection: full-size browser captures of both featured previews, including development opacity, pointer tilt, twelve fragment transforms and the assembled image. These supplement the full-view composition comparisons.

## Findings and comparison history

| Before | After | Why |
| --- | --- | --- |
| Two flat project images | Paper print and framed, tessellated image window | The user selected distinct interactions for these two cards. |
| A moving reflection could extend outside the paper | Clip reflection to the physical print | Keep the material boundary coherent; corrected before final capture. |
| Print/reduced-motion fragment rules could lose to ready-state specificity | Explicitly hide fragments in static preference/print rules | Preserve the complete base image; corrected before final verification. |

The final comparisons have no actionable P0/P1/P2 findings within scope.

- **Typography:** existing system font, title wrapping, weights, labels and body text remain unchanged. No clipped titles at 1440, 768, 390 or 320px.
- **Spacing/layout:** Header, page title, featured-card frames, small-card grid and footer retain their layout. Full-page source and implementation capture dimensions match. No horizontal overflow at the four inspected widths. Pointer transforms stay inside the decorative preview region and do not move titles or link targets.
- **Colors/tokens:** existing page palette and focus states remain. Local CSS owns off-white paper/emulsion and the dark ruin frame. The partially developed resting photograph is intentional; hovered and keyboard-focused photographs show the full image.
- **Image fidelity:** same local photograph/rendition and original YouTube-thumbnail bytes. Fragments clone the same image source and share polygon boundaries; their total area covers the complete image. No fabricated scenery or replacement assets.
- **Copy/content:** all seven project names, descriptions, destinations and ordering remain. The intro remains title-only. Decorations are hidden from accessibility APIs.
- **Interaction:** real pointer input develops/tilts the photo and assembles/tilts the ruin window. All seven native links receive visible Tab focus; focused featured previews expose their full static image. Gran Turismo navigation and browser Back restoration work. No click handler or navigation delay is added.

## Verification and limits

- Passed `node tools/validate-site.mjs`, `node tools/test-site-icons.mjs` (including renderer idempotence and all seven links), `node tools/test-site-cursor.mjs`, JavaScript syntax and `git diff --check`.
- Strict static design audit of `dist/`: zero findings.
- The artifact `runtime-check.cjs` executes the actual controller with controlled input/preferences. It passed full fragment coverage, reversible development/reassembly, press cancellation/restoration, idle RAF sleep, hidden/offscreen/resize cleanup, reduced-motion/forced-colors/coarse-pointer fallbacks and native navigation ownership.
- Preference fallbacks were checked with the controlled runtime and CSS inspection; no claim of an OS-level preference switch or physical-phone touch test is made.
- The in-app browser recorded a MutationObserver error before this change and on subsequent reloads. It is a baseline observation, not a new error signature from this controller; the new controller uses IntersectionObserver. Pointer effects, focus and navigation were observed working. Shared scripts are outside this scoped change.

final result: passed

---

The earlier 404 verification is retained below as historical evidence.

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
