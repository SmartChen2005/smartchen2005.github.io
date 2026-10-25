# Car Enthusiast — Starlit follow and architectural shock wave, 2026-10-25

This revision starts from 840ea2d. The user explicitly replaces the first solo setup with a following pair in the exhaust shot's unfilled starry line style, and asks for a stronger forward surge that blows every building shape into the sky on either side.

## Implementation and limits

- The 0–2.2s `starlit-follow` opening has both cars driving away, with more than 7m separation and small independent velocity changes. It shares the solid ink ground, pale hidden-line contours and world-direction sky stars of `exhaust-exit`. A modest lateral stagger and higher 390px rear crop keep the second silhouette identifiable. No paint-filled car/building surfaces are introduced in these two setups.
- Backfire timing is retained. The Z4's smooth early acceleration rises from 8 to 18m/s²; the shorter 0.9s acceleration window adds up to 16.2m/s. At local 1.4s it already gains over 13m/s. Integrated progress and wheel rotation remain continuous through the 16.4s cut. Moving the shared segment start from -32m to -36m retains road coverage (Z4 z≈168.54m just before its end).
- `home-motor-burst.mjs` prepares seeded trajectories for all 6,041 existing architectural components across 156 instanced batches, including the overhead bridge. A wave starts after ignition and reaches the farther frontages in sequence. Walls, cornices, arches, roofs, towers and domes translate out/up with increasing displacement and rotate separately. The line renderer reveals the stars behind them. The road and 2D heading stay in place. Peripheral contour echoes strengthen with the actual boost velocity; vehicles retain their sharp contour capture.
- The effect is limited to the exhaust shot; all original instance matrices and culling flags restore on leaving it or restarting. No frame history, additional renderer, physics dependency, downloaded asset or per-piece scene object. The original Gothic/Renaissance generators, car meshes, Grid/Warp/cosmic sequences, hard-cut timings, reduced-motion finale and input controller remain.

## Verification

Passed motor regression, home lifecycle/state, Gallery/Projects entrance checks, site validation, whitespace check and strict dist audit (zero findings). Motor tests additionally verify the following formation and rear camera, different driver velocities, stronger early acceleration, every architectural piece's finite outward/upward displacement, exact out-of-order determinism and complete matrix/culling restoration. Existing six viewport cases, boost derivative/cut continuity, tire/model constraints and Scenario 12s motif seam checks pass.

Chrome reviewed frozen 1440×900 opening, ignition, shock-wave, airborne/open-sky stages, and the following tracking setup. The boost sequence also played through its native preview controls. At 390×844 the opening camera was raised after the first review to separate the car silhouettes; the final opening and airborne shot fit without document overflow. These are desktop-pointer viewport checks, not physical touch / Safari / FPS guarantees. No new frame-rate claim is made.

On the actual homepage, Tab into Car Enthusiast starts an unpinned `starlit-follow` preview. It reaches the stopped finale; Space pins, Escape clears and retains trigger focus. Before/during heading bounds are identical at x=184.0625, y=416.17709, width=1071.86462, height=67.64584. The completed span transform is matrix(1,0,-0.158384,1,0,0), retaining -9° skew, and main has no inert ancestor. No warning/error was captured in the preview or homepage logs.

Evidence in the task artifact directory: `burst-opening.png`, `burst-backfire.png`, `burst-shockwave.png`, `burst-airborne.png`, `burst-open-sky.png`, `burst-next-tracking.png`, `burst-mobile-opening.png`, `burst-mobile-airborne.png`, and `burst-final.png` (clean final composition). Disposable preview files are removed before commit and viewport overrides reset.

---

## Previous: Gothic and Renaissance street architecture, 2026-10-25

This revision starts from 3359049. The narrow lane and wider city circuit are separately assembled layouts that share building generators/cached geometry. The user's latest direction replaces the former timber-house architecture throughout both layouts, covering all six street shots. The three space setups retain their environment, cars and motion.

## Architecture and preserved behavior

- `home-motor-architecture.mjs` builds 54 frontages in each layout. Six double-width twin-tower cathedrals recur along each street (three on each side). Including chapels and domed churches, the lane has 19 ecclesiastical buildings and the circuit 17. Both Gothic and Renaissance families occur on each side; side/layout phase offsets vary their sequence.
- Gothic masonry includes pointed extruded arch frames, lancets/mullions, rose-window petal tracery, stepped projecting piers, flying stone members, gables, belfries, pinnacles and spires. Renaissance palazzi use rusticated ground storeys, round arcades, classical columns/capitals, alternating triangular/curved window pediments, cornices, balustrades and urns; churches add ribbed hemispherical domes, drums and lanterns. Closed roof ends and connecting caps avoid detached roof elements. These are stylized original procedural models, not reconstructions of a named monument.
- Shape profiles and detail geometry are cached; repeated components remain instanced and the existing static-matrix freeze applies. No downloaded model, texture, new package or remote asset. The old timber/shutter-house kit and generic clock tower are removed; a balustraded passage preserves the old underpass clearance.
- Road widths, cobbles, circuit kerbs/tires/banners, car models, driver/exhaust motion, camera cuts, 21s duration, base palettes, scenery shutter, line-art finish, sky and Grid/Warp effects remain. New architecture participates in both filled and contour rendering through the existing scene pipeline.
- Bright facade review exposed native buttons' user-agent `text-shadow:none`, which had prevented the heading's existing ink contour from reaching Smart Chen / Car Enthusiast. A cars-preview-only inheritance rule fixes their contrast, with no new background strip, font/metrics changes or input behavior.

## Verification

Passed `node tools/test-motor-race.mjs`, `node tools/test-home.mjs`, `node tools/test-home-state.mjs`, `node tools/test-photo-transition.mjs`, `node tools/test-game-transition.mjs` and `node tools/validate-site.mjs`. Strict published-directory design audit reports zero findings in `tools/motor-race-premium-audit.json`; diff whitespace is clean.

The motor regression checks both styles and recurring cathedral/dome/church coverage on each side, distinct frontage plots, actual pointed/round arch / rose-tracery / dome geometry, and every architectural instance's transformed bounds. All building details remain at least 0.15 model units beyond the driving corridor. Existing geometry finiteness, six viewport shapes, vehicle clearance, boost continuity, native wording, scoped line art, trail attachment, lifecycle and deterministic motifs remain covered.

Chrome inspected all six street setups at 1440×900, the night street and circuit at 390×844, and the space regression after switching styles. Narrow screenshots were recaptured at the verified 390×844 viewport; no horizontal overflow. A separate authoring overview inspected roof/dome/façade joins; its camera override and selector exist only in the removed preview and add no production shot.

On the actual homepage, Tab activated an unpinned car preview, the clock reached the idle finale, Space pinned and Escape cleared while retaining trigger focus. Heading bounds before/during matched exactly: x=184.0625, y=416.17709, width=1071.86462, height=67.64584 at 1440×900. Main had no inert ancestor. Identity buttons now inherit all four existing ink-shadow offsets. No scene/shader/model warning or error was captured in this review. Browser viewport overrides were reset and disposable preview files removed.

Evidence in the task artifact directory: `architecture-opening.png`, `architecture-following.png`, `architecture-circuit.png`, `architecture-night-street.png`, `architecture-boost-tracking.png`, `architecture-finale.png`, `architecture-mobile-night.png`, `architecture-mobile-circuit.png`, and `architecture-study.png` (authoring view). These are desktop-pointer viewport checks, not physical touch / Safari / 60fps guarantees. Previous performance/presentation limits recorded below remain; no new FPS claim is made.

---

## Previous: brighter tails and a starry street sky, 2026-10-25

Follow-up from 7d5735b, still limited to Grid Tunnel and the line-drawn exhaust shot. Grid retains four thin strokes but raises opacity from 0.46 to 0.74, softens the taper exponent from 1.5 to 1.1 and extends analytic history from 0.14s to 0.19s (roughly 3.4m). Existing tests retain rear attachment, four line-only primitives, restrained extent (under 4.2m) and near-plane safety at three moments.

The exhaust drawing gains procedural pin stars and sparse larger glints in the empty sky. Star placement comes from world directions reconstructed with the current inverse view-projection, keeping translation through town from scrolling a screen overlay. Environment depth plus vehicle coverage masks keep stars behind the architecture/vehicles and off the road; the flat ink ground, contour shader, flame/acceleration timing and camera compositions remain. The sky uses the existing paper/accent inks; no external image or new asset dependency.

Chrome inspected both updates at 1440×900 and 390×844. No narrow horizontal overflow was observed. Evidence: `stars-exhaust.png`, `stars-grid-traces.png`, `stars-mobile-exhaust.png`, `stars-mobile-grid.png` and `stars-mask-comparison.json` in the task artifact directory. Compared with the prior t=14.43 screenshot, a sky crop changes 14,729 RGB channels; blank road (100×60) and rear-body (30×10) patches remain pixel-identical, RGB [23,36,44]. Mixed crops containing contour edges are not identical (road MAD 0.329, rear-body MAD 1.14); no whole-frame or every-stroke pixel-equivalence claim is made.

Passed motor regression, home lifecycle/state checks, site validation and strict dist audit (zero findings). The actual homepage still enters an unpinned preview by Tab, reaches the stopped finale and exits through Escape. Preview shader/model logs are clean. An existing `ViewTransition opt-in disabled` abort appeared when navigating from the disposable preview into the homepage; shared transition code is unchanged. These are viewport checks with desktop pointer settings, not physical touch/FPS guarantees. Preview controls are removed before commit and viewport overrides reset.

---

## Previous two-shot line revision, 2026-10-25

This follow-up starts at b4a1865 and changes only the user's selected Grid Tunnel chase and exhaust/acceleration setup. All nine cut times, 21s duration, driver progress, desktop cameras, models, native 2D heading and identity controller remain. The earlier baseline record below is historical; this scoped note supersedes its filled rendering only for `exhaust-exit`.

- Grid adds exactly four `Line` strokes, two from each banked rear chassis. A 0.14s / roughly 2.5m analytic history and tapered vertex intensity keep them short and restrained. Existing broad cosmic ribbons remain hidden in Grid. There are no new filled trail meshes, accumulated prior frames or extra effects in other shots.
- `home-motor-line.mjs` selects only `exhaust-exit`. Separate normal/depth captures produce silhouettes and structural contours; the final image uses one solid ink ground and pale strokes, without original object paint/shading. Car lines are stronger than architectural lines. Depth/normal occlusion prevents background lines passing through cars. Planar depth second differences have a quantization floor and normal guard, avoiding false filled roads. One faint peripheral echo suggests speed while keeping the main sentence clear. Exhaust cones are also contours; brief flame windows and actual Z4 acceleration are unchanged.
- The desktop composition is preserved. This shot alone gets a more distant, centered phone crop so neither the Z4 rear nor its flare is cut off. Other cameras/styles remain unchanged. The normal pass restores visibility, fog, override material, camera layers and shadow-update behavior before the following colored shot.
- Motor regression now verifies exact line-style scope, four line-only Grid traces, rear attachment, short extent and camera-safe placement at three moments, alongside existing motion/boost/lifecycle tests.

Chrome inspected the two setups at 1440×900 and 390×844, including visible backfire and subsequent lead change, and checked the transition into the unchanged colored tracking shot. No horizontal overflow was observed; these are viewport checks with desktop pointer settings. Preview controls and baseline copies are disposable and removed before commit.

A frozen t=17.5 tracking shot rendered after the new line pass was compared with independently loaded b4a1865 code in the same browser/viewport. All 3,888,000 RGB channels were identical (zero changed channels, mean difference 0). In the new t=14.43 drawing, blank sky (720,80), road (720,800) and rear body (1090,540) all sampled RGB [23,36,44], checking that surfaces retain the same flat background rather than material fills. Evidence: `line-exhaust.png`, `line-after-boost.png`, `line-grid-traces.png`, `line-mobile-exhaust.png`, `line-mobile-grid.png`, `line-unchanged-{before,after}.png` and `line-scope-comparison.json` in the task artifact directory. This pixel comparison covers that unchanged setup, not a claim of image-diffing every other frame.

Passed motor/home/state, Gallery/Projects entrance regressions and site validation; strict dist audit has zero findings. On the actual homepage, Tab preview remained unpinned, Space pinned, Escape cleared while keeping focus, and the clock stopped at the finale. The native heading rectangle exactly matched its pre-preview bounds and retained the original -9-degree skew, with no inert ancestor or captured scene warning/error. No FPS or physical touch-device guarantee is added. Existing practical limits from the baseline record still apply.

---

## Baseline: shared cosmic flight and causal boost, 2026-10-25

This follow-up starts from published 7233b8e. It preserves the native 2D sentence, hover/focus controller, click/tap/keyboard pinning, skew and established city compositions. The user supplied two Entergalactic reference stills and requested a curved dual-car starfield flight, less disconnected Grid/Warp cars, cooler street palettes, more E85 detail and physically intuitive changes of speed.

## Shipped behavior

- Nine hard cuts over 21 seconds: lane solo 0–2.2; following 2.2–4.4; city pair 4.4–6.7; curved Grid Tunnel 6.7–8.5; new cosmic arc 8.5–12; Warp Stars 12–13.8; exhaust acceleration 13.8–16.4; new low tracking shot 16.4–18.6; city finale 18.6–21. Within-shot tracking follows actual progress; there is no interpolated camera move between shots.
- The flat green plate becomes a dual-car arc through a procedural painted galactic disc and seeded 3D stars. Banked chassis, rear-attached cyan/magenta ribbons and glitter share one camera/depth. Grid portals and longitudinal rails follow the same curved centerline as the chase. Warp is a closer frontal sprint with world-space cars/trails and camera-safe star streaks. Both cars remain present in all three space shots.
- Space geometry and vehicles render together, with common colored light, material shading and a common glow/color finish. Street vehicles retain their separate sharp depth composition and scenery-only 17-tap shutter. The foreground MINI mask copies the same finished space colors above the unchanged native text during its central crossing; it does not make a separately shaded foreground car. Foreground is hidden elsewhere.
- Streets keep three base inks, replacing red/ochre/green with slate blue, cobalt and blue-gray/teal. Space uses indigo, magenta/purple and cyan as its three main color families, with continuous illumination and white-hot highlights. The user's richer space reference is interpreted as lighting variation rather than independent rainbow objects. No movie imagery or external model is shipped.
- The silver E85 has swept dark lamp recesses and individual projectors, shaped kidneys/slats, central/outboard lower intakes, a low splitter, trunk lip, hood/deck lines and twin dashboard instrument needles. The black MINI retains restrained rings. Real 0.26m tire barrels, detailed rims/tread/brakes, lowered cabins and open cockpit remain.
- Following/parallel cars have different instantaneous velocities and changing spacing. Backfire starts a smooth Z4 acceleration ramp, adding up to 14.4m/s to base travel. It catches and passes the MINI; integrated driver progress is continuous through the new camera cut. That tracking camera follows the faster Z4, so its environment shutter uses the higher actual speed. Passing lanes have clearance; the shared sequence is offset to remain within the built town. Cobble joints extend to cover its end.
- Base street speed, 72 peripheral streaks, preferences, one RAF, readiness/context-loss fallback, 1.5 DPR / 2.6M pixel cap, stopped finale and hidden-document suspension remain. There is no temporal image history, audio, new modal, inert homepage or extra lower section. Existing portrait/card and Gallery/Projects entrances are preserved.

## Automated verification

- `node tools/test-motor-race.mjs`: exact native wording, no 3D heading/modal, palette/CSS parity; detailed model/cabin/tire limits; traditional lanes; nine contiguous hard cuts; formations and clearance; varying parallel spacing; finite-difference boost velocity; visible backfire then lead change; displacement continuity at the camera cut; exposure velocity matching actual camera travel; chassis tangents; rear-attached banked ribbons; shared space depth and restored street materials; deterministic out-of-order frames; stopped finale; six viewport shapes; camera-safe 12-second Warp phases; original Scenario motif seams.
- `node tools/test-home.mjs`: 21-second stop/restart, one RAF, readiness/failure, reduced motion, forced colors, hidden suspension and existing game/photo lifecycle.
- `node tools/test-home-state.mjs`: hover/focus previews, pinning/dismissal, name/card restoration and mutual exclusion.
- `node tools/test-photo-transition.mjs` and `node tools/test-game-transition.mjs`: unchanged entrance/navigation journeys.
- Site integrity: `node tools/validate-site.mjs`. Changed-module syntax, diff whitespace and strict dist design audit are required before commit; the audit result lives in `tools/motor-race-premium-audit.json`.
- Scenario Motion Loops' seeded/pure-time construction is retained. Original Canvas motifs are unchanged and retain their earlier official renderer determinism/seam checks. The production Warp phase and standalone patterns are also checked at a 12-second offset by the regression. The 21-second edited film and advancing curved car trajectories are deliberately not a full seamless loop. No paid generated subject or MP4 export is needed for this native website.

## Actual browser evidence

Chrome at 1440×900 inspected the new arc, curved grid, closer frontal warp, refined E85 front, backfire, subsequent Z4 lead and low tracking shot through its end. At 390×844 the arc, grid and warp pairs fit and horizontal overflow is false. These are viewport-size checks with desktop pointer media settings, not a physical touch-device claim. Browser overrides were reset.

On the real homepage, Tab reached Car Enthusiast and activated an unpinned preview (`aria-pressed=false`); Space pinned it, and Escape cleared the scene while retaining car-trigger focus. The heading before/during had exactly x=184.0625, y=416.17709, width=1071.86462, height=67.64584. The span retained matrix(1, 0, -0.158384, 1, 0, 0), equivalent to its original -9-degree skew. Main remained non-inert. The real clock reached `phase=idle` / `shot=rally-finale`. No scene/shader/model warnings or errors were captured. Hover behavior is covered by the unchanged controller plus the state regression; this browser pass exercised keyboard entry rather than claiming a new native pointer-hover measurement.

Screenshots in the task artifact directory include `cosmic-arc.png`, `cosmic-warp.png`, `cosmic-city-models.png`, `cosmic-backfire.png`, `cosmic-after-boost.png`, `cosmic-boosted-end.png`, and `cosmic-mobile-{arc,grid,warp}.png`. Disposable preview/control files are removed before publication. Existing prior shutter comparison evidence remains in that artifact directory and Git history.

## Practical limits

No new FPS guarantee is claimed. The preceding revision's automated presentation cadence was low and variable despite much shorter measured GPU intervals; its unresolved benchmark limits are recorded in 7233b8e's version of this QA file. This follow-up uses a common space scene/finish and no separate space-car shutter/print pass; it does not establish the cause of those older presentation counts. Physical touch hardware, Safari and a full screen-reader audit were not exercised. Preference/failure paths are covered by controller regressions. Publication and Git synchronization are reported separately with the actual deployment status.
