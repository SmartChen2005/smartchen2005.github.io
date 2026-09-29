# Homepage verification — exhibition + motorsport

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
