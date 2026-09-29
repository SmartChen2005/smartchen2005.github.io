# Homepage verification — exhibition + motorsport

## Smart Chen business card — 2026-09-29

- Current state fix: bold title-cased `Smart Chen`; temporary hover/focus no longer clears the remembered card click selection. `node tools/test-home-state.mjs` passed: all three other previews restore both portrait and card, explicit selection/Escape/outside press/navigation clear both, and keyboard restoration does not steal focus. Browser pointer passage across Game Designer ended with `world: name`, portrait present and card visible. Exact-copy validation and strict audit passed.
- Current visual refinement: Apple Card-inspired pale titanium substrate (`#ededeb`), approximately 11px responsive rounded corners, soft layered studio shadow, rounded contact shadow and shortened side planes around corners. Chinese uses the official local Source Han Sans SC three-glyph subset. Browser confirmed font loaded, 10.99px corner radius and expected shadows; site validation and strict design audit passed. Geometry, typography scale and motion controller are unchanged in this refinement.
- Latest refinement: landscape width is portrait width × 1.05, including 170px short-screen portraits; vertical layout retains its existing readable card below. Browser verified 844×390 (170px portrait / 178.5px card) and 390×844 with no horizontal overflow. Tests cover constant proportions and smooth resting return on pointer exit.
- Larger Latin typography, exact `Emory University '27` copy, locally loaded official Source Han Serif SC etch, two 10px currentColor inline SVG arrows. Browser confirmed font loading and 9.98px arrow width; portrait filter remains `none`. Actual side planes and satin light response were inspected with roughly 2.2° rotation; dragging out restored rotation to less than 0.003° while keeping the card open. Native mobile hardware/Safari has not been exercised.
- Material-only refinement: removed scratch canvas, blue-gray base and perimeter border; installed a local three-glyph Noto Sans SC subset with OFL license. Helvetica Neue leads the Latin font stack (Helvetica/Arial fallback where unavailable). Original slide, geometry and homepage controller are unchanged by this refinement.
- Browser inspection confirmed silver-white resting surface, broad cursor reflection, faint spectral response and Chinese etch opacity changing from 0.055 at rest to 0.515 under the light. Computed photo filter remains `none`, card border is `0px`, local Chinese font loaded, and the 390px viewport has no horizontal overflow. Existing card/home tests, asset validation and strict audit pass. The optional DESIGN.md CLI lint could not run because `npx` is unavailable in this shell; strict audit returned zero findings.
- Only the name's click behavior is extended. Hover still mounts/reveals the same portrait through the existing controller and unchanged CSS. All game, exhibition and motorsport modules are untouched in this revision. The blue portrait asset is unchanged.
- `node tools/test-business-card.mjs`: passed. Covers right-edge anchoring, six wide/narrow/short layouts, sentence clearance, hidden/inert entry, post-settle pointer response, inertia, no idle RAF, repeated entry/cancellation, keyboard focus, placeholder prevention, reduced motion and forced colors.
- Existing `test-home.mjs`, `test-game-transition.mjs`, syntax checks and `validate-site.mjs`: passed. Validator also enforces exact card copy, link destinations and hidden resting state.
- Browser: inspected the actual photo/card composition and moving material response. Photo geometry and `filter: none` are retained. Name focus alone shows the portrait with the card hidden. Keyboard click reaches email; Tab reaches Instagram; Escape restores name focus. All contact values and destinations were inspected without sending email or posting to Instagram.
- Browser: at 390px width the readable card falls below the unchanged sentence, with no horizontal overflow. Viewport override reset afterward. Reduced-motion/forced-color behavior is covered by controller tests; physical touch is untested.
- No warnings or errors appeared in the browser console during card verification. Résumé remains the user-authorized placeholder; no deployment was performed.

## Latest revision — portrait cleanup + game click

- Scope: only the portrait retraction cleanup and Games click transition. The original game seed, hover physics/drawing and pointer response remain intact; exhibition/motorsport modules, all image assets and destination page are untouched.
- `node tools/test-game-transition.mjs`: passed. Fifteen simulations across five viewport sizes at 30/60/144fps verify inherited positions/velocities/trails, moving-wall containment, initial body collisions and monotonic contraction to zero in both dimensions. Finite differences verify constant acceleration. Dense convergence must stop collision solving/flashes, monotonically shrink each object, and end all centers at the viewport center. Controller checks cover unchanged 2.76s navigation, duplicate clicks, native modified clicks, slow/failed preview fallback, reduced motion, forced colors, resize, background suspension and Back restoration.
- `node tools/test-home.mjs`: passed, including new capture/release lifecycle coverage. Visibility/focus changes cannot restart the hover renderer during the transition.
- `node tools/validate-site.mjs`, module syntax checks, strict premium audit and `git diff --check`: passed.
- Browser: at 1280 × 720, captured the revised smooth inward flow and verified navigation to Games. Final point geometry is also covered across all fifteen simulations; the point's 60ms browser capture can be missed while taking the preceding screenshot. The superseded burst implementation remains removed.
- Browser: used actual mouse clicks to open and close the original portrait without entering another identity. After the second click there are zero portrait containers and zero portrait image descendants; the screenshot has no line along the original image bottom. The open state has `clip-path: none`, uses the original image size and retains `filter: none`. The earlier clip-path cleanup was replaced with actual height retraction and full figure removal.
- Browser console contained an unattributed `MutationObserver.observe` error without a source URL. None of the homepage modules or destination markup uses MutationObserver; the reported error could not be traced to application code. Navigation and rendering completed in the browser.
- No deployment was performed. The physical touch/high-contrast and unavailable `npx` limits below remain applicable.

## Scope preservation

- Resting typography/layout, Smart Chen styles and blue portrait reveal are unchanged. Protected CSS rule bodies were compared against the pre-edit version.
- The existing game seed, physics and drawing code remain unchanged. Its renderer now delegates photography and cars to isolated modules.
- All four supplied photographs are referenced directly from `dist/photography-preview/`; no source image was edited or re-encoded.

## Checks

- `node tools/test-home.mjs`: passed. Covers gallery containment, 3:2 ratios, pairwise non-overlap, and sentence clearance at seven wide/narrow/short sizes; all 4.6s motorsport phases, shift RPM unloading, restart, non-looping peak, reduced-motion idle, finite drawing geometry, exit cleanup, and single-loop visibility lifecycle.
- `node tools/validate-site.mjs`: passed, including all four original photo references, exact sentence, protected portrait SHA-256, no settled color effects outside development, and existing game-document parity.
- Syntax checks for all four homepage modules: passed.
- Premium strict audit and `git diff --check`: passed.
- Browser: inspected all four decoded prints at natural 3:2 ratios, with final `filter: none`, no overlapping and no sentence occlusion at desktop size. Inspected the initial white/tonal development and final still exhibition.
- Browser: captured the actual build, launch, shift, redline, finish and idle phases using DOM-state waits. Confirmed sequence settlement; recordings are screenshots, not a synthetic time jump.
- Keyboard focus/Space and Escape exercised. The sentence remains readable within its reserved band.

## Limits

- Physical touch devices and OS high-contrast preferences were not tested. Narrow geometry and reduced-motion behavior are covered by deterministic tests.
- Earlier preview checks used keyboard activation because of inconsistent pointer coordinates. The latest portrait click/open/close regression was verified using actual pointer clicks.
- Official DESIGN.md lint remains unavailable because this runtime has no `npx`.
- No deployment was performed.
