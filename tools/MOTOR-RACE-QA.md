# Car Enthusiast — line-drawn duel, 2026-10-24

The user requested the Filmmaker / Gallery museum entrance's spatial linework, with a MINI Cooper S F56 and an open-top BMW Z4 E85 racing and taking turns in front. Both drawings are deliberately abstract. They share a Catmull–Rom circuit, separate lateral racing lines and one camera, with projected triangle depth checks hiding occluded lines. No third-party mesh or image is used.

Model reference evidence: BMW Group's [2014 MINI introduction](https://www.press.bmwgroup.com/usa/article/detail/T0157784EN_US/introducing-the-new-mini-the-new-original?language=en_US) identifies the F56's round lamps, hexagonal grille and Cooper S hood opening/central exhaust. The [original Z4 design release](https://www.press.bmwgroup.com/united-kingdom/article/detail/T0016277EN_GB/the-new-bmw-z4) grounds its long bonnet and rearward, low cockpit. The implementation uses original simplified geometry rather than copied artwork.

## Verification

- `node tools/validate-site.mjs`: source/render and local asset integrity passed.
- `node tools/test-motor-race.mjs`: model proportions and finite geometry; three lead changes; four distinct, continuously connected camera views; racing-line separation; all four shift RPM drops; exact frozen finish; actual renderer exercised at 1920×1080, 1440×900, 1024×600, 390×844, 320×568 and 844×390.
- `node tools/test-home.mjs`: existing photographs and game simulation; race start, finish, stopped idle RAF, dismissal, exit cancellation, restart, reduced motion and background suspension.
- `node tools/test-home-state.mjs`, `node tools/test-photo-transition.mjs`, `node tools/test-game-transition.mjs`: existing homepage selection, keyboard/preview state and both navigation entrances passed.
- JavaScript syntax and `git diff --check` passed. The published `dist/` strict static audit has zero findings, recorded in `motor-race-premium-audit.json`.
- The repository-wide strict audit still reports sixteen pre-existing `affordance.actionless-button` findings in ignored Gallery import archives and Stills QA fixtures, matching the prior Gallery-entry audit. Those unpublished files are outside this update; the full repository audit is not reported as passing.

## Browser inspection

Chrome inspected the actual homepage car control and rendered race, plus deterministic frames of the same renderer for front, side, overhead, chase and finish compositions. The main sentence stays in its measured empty band. A 390px viewport has no horizontal overflow; a temporary fixture applied the existing coarse-pointer CSS at that width to inspect the actual phone wrapping and artwork regions. This fixture is removed before publication. Desktop/narrow keyboard activation, Escape and reopening were checked on the actual homepage. No race-controller errors were captured. Chrome logged one native `ViewTransition opt-in disabled` abort while resizing/navigating the temporary preview fixture; the existing cross-document transition is unchanged.

Reduced-motion, forced-color and hidden-page lifecycle are covered by the controller suite. No claim is made for physical touch hardware, Safari, or a complete screen-reader audit. Publication state is reported by the completing chat.
