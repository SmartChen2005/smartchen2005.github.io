# Homepage verification — exhibition + motorsport

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
- The in-app preview bridge has inconsistent pointer-coordinate actions; deterministic activation checks used native keyboard input.
- Official DESIGN.md lint remains unavailable because this runtime has no `npx`.
- No deployment was performed.
