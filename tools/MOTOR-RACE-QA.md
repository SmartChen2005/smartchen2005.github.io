# Car Enthusiast — reference-photo recut, 2026-10-24

This revision replaces the uniformly white, small-car, orbiting-camera version at commit `0305c56`. The user's new brief requires hard cuts, the supplied photo compositions, black MINI Cooper S F56 / silver BMW Z4 E85, colored linework, a built environment, and the Scenario Motion Loops skill's Grid Tunnel and Warp Stars.

## Editorial plan and source ownership

| Time | Setup | Reference and purpose |
| --- | --- | --- |
| 0–1.9s | Door-to-door | Reference 1: ground camera between the two cars, large foreground body and wheels. |
| 1.9–3.65s | Wheel chase | Reference 2: low rear wheel close-up with the circuit receding ahead. |
| 3.65–5.8s | Dutch apex | Reference 3: inclined overhead framing, both cars and striped inside curb. |
| 5.8–8s | Curbside | Reference 4: rear-quarter racing through a bend, run-off and outer barriers. |
| 8–10.35s | Grid straight | Reference 5: long straight, canopies/pits, with the required nested rectangular Grid Tunnel and radial Warp Stars. |
| 10.35–12s | Photo finish | Authored front-quarter finish, chequered gantry and a small flag settling still. |

All cuts are exact camera-vector changes, with no interpolation/dissolve. The same F56/E85 models appear throughout. The central homepage sentence and its controls retain their layout and measured empty band. Close shots intentionally crop a foreground wheel/body; wider shots show both silhouettes. Narrow close-ups use a wider lens. No stock photographs, watermarks, third-party logos, downloaded models, new fonts or runtime dependencies are published.

- `dist/home-motor-cars.mjs`: authored rounded body lofts, small-radius windows/panels, recognizable lights, grilles, scoop, twin exhaust and open two-seat cockpit/roll hoops.
- `dist/home-motor-race.mjs`: camera edit list, circuit, environment, color masks, spatially binned hidden-line checks and telemetry.
- `dist/home-motor-motion.mjs`: actual Grid Tunnel / Warp Stars draw functions, deterministic seeded elements and twelve-second-compatible periods.
- `dist/home-motorsport.mjs`: twelve-second timeline, five shift RPM drops, repeated lead exchanges, a frozen last composition and existing lifecycle/preferences.
- `dist/home.css`: canonical black/asphalt, teal/amber/coral, black paint and silver tokens. UI typography and other identity effects are preserved.

Vehicle feature evidence retained from the first revision: BMW Group's [2014 MINI introduction](https://www.press.bmwgroup.com/usa/article/detail/T0157784EN_US/introducing-the-new-mini-the-new-original?language=en_US) and [original Z4 design release](https://www.press.bmwgroup.com/united-kingdom/article/detail/T0016277EN_GB/the-new-bmw-z4). The current shot compositions come from the user's attached references, without copying their image pixels.

## Checks

- Site integrity: `node tools/validate-site.mjs`.
- Actual renderer regression: `node tools/test-motor-race.mjs`. Checks both model geometries and paint roles; lead exchanges and five RPM drops; all six exact hard cuts; low and inclined views; both requested motifs' deterministic command sequences and exact twelve-second closure; finite drawing at six viewport shapes, including either side of cuts.
- Lifecycle and existing controls: `node tools/test-home.mjs`, `node tools/test-home-state.mjs`, `node tools/test-photo-transition.mjs`, `node tools/test-game-transition.mjs`. Covers stopped final RAF, restart/dismissal, reduced motion, forced colors, hiding/resuming and preservation of other entrances.
- Module syntax, `git diff --check`, and strict static audit of the published `dist/` directory. Audit result is in `tools/motor-race-premium-audit.json`.
- The full repository audit still reports sixteen findings in ignored historical Gallery import archives / Stills QA fixtures. Those unpublished files are outside this revision; no whole-repository clean-audit claim is made.

## Scenario Motion Loops verification

Applied the installed skill's `loop-template.html`, `references/loop-craft.md`, and `render-loop.mjs` directly. A local standalone template registers both actual production draw functions as independent tiles. It uses their canonical production palette and no paid/generated subject. The edited race remains a one-shot website animation; the underlying motifs are the seamless loops.

The skill's own `render-loop.mjs --check --channel chrome` produced:

- **Grid Tunnel: PASS**. Determinism OK; frame at 12s versus 0s difference **0.00**; seam step 9.12 versus neighbours 8.63 / 8.14, within its cycle-boundary tolerance; motion OK.
- **Warp Stars: PASS**. Determinism OK; frame at 12s versus 0s difference **0.00**; seam step 1.72 versus neighbours 1.67 / 1.76; motion OK.

The standalone HTML remains an editable local QA artifact in this chat's visualization directory. It is not an extra production page or external Scenario generation.

## Browser inspection and limits

Chrome inspected all six deterministic shot frames with the actual production renderer. The overhead camera was corrected so both cars remain fully in view; the wheel camera was refined for the foreground tire. A screen-space triangle index replaced all-triangle per-point tests: warm deterministic draws in the inspected desktop fixture averaged approximately 15–18ms (eight draws), versus the initial much slower unindexed version. This is a local sample, not a cross-device frame-rate claim.

Chrome also checked the actual homepage's keyboard Enter activation, Escape dismissal and re-entry. A 390×844 viewport and temporary fixture using the existing coarse-pointer layout verified phone wrapping and no horizontal overflow. Both actual race rendering and its static/reduced-motion states remain clear of the sentence band. Temporary fixture markup is removed before publication, and viewport overrides are reset.

No race-controller exceptions were captured. Chrome did log native `ViewTransition opt-in disabled` aborts while resizing/navigating the temporary previews; the existing cross-document opt-in is unchanged. Reduced-motion/forced-color/background behavior is exercised by the controller suite. Physical touch hardware, Safari and a full screen-reader audit were not exercised. Commit/push and live publication state are reported in the completing chat.
