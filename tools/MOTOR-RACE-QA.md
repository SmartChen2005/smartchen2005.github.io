# Car Enthusiast — full-screen pop-art city, 2026-10-24

The latest brief replaces the split race/HUD with a full-screen city, much bolder pop-art color, materially more detailed black MINI Cooper S F56 and silver BMW Z4 E85 models, real tire thickness, and the homepage sentence as a perspective object that cars can drive above/below. All artwork and geometry are original code; the existing Three.js 180 library and OFL Instrument Serif fonts are reused.

## What is in the shipped scene

- Eight hard-cut setups across sixteen seconds: low boulevard, wheel rig, under the text bridge, over the street typography, cafe square, Grid Tunnel arcade, facade/car detail and city finale.
- Four saturated screen-print palette permutations: cyan, pink, yellow, cobalt, coral, lime, cream, purple and dark ink. Facades carry small stable halftone dots; car colors remain black and silver.
- 61 European facade volumes with mansard roofs, dormers, chimneys, cornices, sash windows, arches, balcony ironwork, cafe awnings and streetlamps, plus trees, a fountain square and clock tower.
- Detailed curved car shells and real wheel-arch boundaries. F56 round lamps, honeycomb hex grille/scoop, hatch/spoiler, chrome belt and central exhaust; E85 hood/side creases, slatted kidneys, projector lamps, fender vents, open two-seat cockpit, dashboard/console/shifter/steering and roll hoops.
- Eight actual 0.26m-wide tire barrels, sidewalls, tread geometry, hollow recessed rims, split spokes, lug bolts, brake discs and fixed calipers. Wheels rotate about their axle; no billboard/disk serves as the complete wheel.
- The exact native homepage sentence is real beveled/extruded geometry, not a CSS overlay: first a raised bridge, then street lettering beneath the cars, then a second bridge in the finale. All text/vehicle occlusion comes from shared scene depth. Font outlines are derived locally; `sourceHashes` retain the original font identities.
- No lower telemetry, map, order or detached flag panel. One accessible Close button is the only scene UI. Cars enter on click/tap/Enter/Space, not hover, so making the native trigger inert cannot cause a hover open/close loop.

## Verification

- `node tools/validate-site.mjs`: content/source/local asset integrity.
- `node tools/test-motor-race.mjs`: black/silver model roles, detailed body geometry, tire barrel width, hollow rim and actual tread, open E85 components, European scene, original wording/font checksums, palette parity, both physical text arrangements and clearance, vehicle/text bump, eight exact cuts and six viewport projections. Camera positions remain in the street. Grid Tunnel and Warp Stars repeat in camera-relative 3D at twelve seconds; the original independent motif seam tests are retained.
- `node tools/test-home.mjs`: existing photo/game checks plus sixteen-second scene lifecycle, stopped final RAF, restart, reduced motion, forced colors, background suspension, local-glyph readiness and context-loss/native input recovery.
- `node tools/test-home-state.mjs`: existing name/card and native navigation behavior, with deliberate car activation replacing hover entry.
- `node tools/test-photo-transition.mjs` and `node tools/test-game-transition.mjs`: existing navigation entrances remain intact.
- Module syntax, staged diff check and strict static audit of the published directory. Static audit result is recorded in `tools/motor-race-premium-audit.json`. Whole-repository auditing also includes ignored historical import/QA archives; existing findings there are outside this update.

`python tools/render-motor-type.py` (FontTools installed for authoring) generated the checked-in 47KB outline JSON. Browser/CI execution needs no FontTools installation. `dist/vendor/three/package.json` marks the already-bundled library as ESM for the Node 20 CI geometry tests; no vendor implementation was replaced.

## Browser evidence and practical limits

Chrome inspected all eight actual WebGL setups. Initial side cameras were moved out of facade geometry, and the portrait establishing camera was widened to contain both cars. The native homepage entry remains open after its opening Enter release, Tab stays on Close, Escape restores the original heading and trigger focus. The 390×844 preview's canvas exactly covered the viewport with no horizontal overflow; its establishing and street-typography views were inspected. Temporary preview markup is removed before publication and viewport overrides are reset.

The scene uses instancing for repeated city details, one 2048px shadow map and a 1.6 DPR / 3.2M pixel drawing-buffer cap. A representative desktop preview reported about 291 main render calls and 0.69M visible triangles. These are local scene statistics, not a cross-device FPS guarantee. Rendering stops when idle/hidden; reduced-motion and graphics-failure behavior are covered by the controller suite.

No scene shader/model/controller exceptions were observed. Chrome logged its existing native `ViewTransition opt-in disabled` abort while navigating from the homepage to temporary previews; the shared cross-document transition is unchanged. Physical touch hardware, Safari and a complete screen-reader audit were not exercised. Publication state is reported separately by the completing chat.
