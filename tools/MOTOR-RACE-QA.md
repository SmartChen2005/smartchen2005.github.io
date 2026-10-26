# Car Enthusiast — Second-shot visibility and a front space pass, 2026-10-25

Started from 499dbd8 on clean master. The user-reported empty second street is reproduced and fixed; the approved car proportions, line art, endless preview, one-second click continuation, exhaust and full loop remain.

## Changes and reproduction

- The renderer lazily cached instanced-mesh bounding spheres from the recycled hover geometry. Restoring instance matrices alone left those spheres behind the second camera. After a 120s preview, a renderer-style bound prime and the 3.1s second camera, the pre-fix diagnostic found 0 visible street batches versus 176 with fresh resting bounds. `createOpeningStreet` now computes the original resting spheres before any recycling. Culling is disabled during recycling and returns to valid original bounds afterward; no per-frame sphere rebuild is needed. Phone solo-rear framing also moves slightly back/centers its target so the full MINI remains visible.
- Loop exterior-camera return begins around 17.95s and finishes around 18.82s, earlier than the former approximately 18.5–19.5s return. The complete inverted loop still fits at the apex.
- The grid shot ends at 19.8s, after both cars have left the final portal. A direct cut introduces `space-pass` through 21.45s: a fixed front-facing camera sits between the same outgoing lanes, about 50m ahead at the cut. MINI approaches screen-right and the slightly leading Z4 screen-left, then each passes behind the camera. Their real integrated path/driver positions continue through the cut. No city, lamps or grid are rendered in this shot. Existing graphite/white stars and unfilled car contours remain.

## Actual verification

Passed `node tools/test-motor-race.mjs`, `node tools/test-home.mjs`, `node tools/test-home-state.mjs`, `node tools/test-photo-transition.mjs`, `node tools/test-game-transition.mjs` and `node tools/validate-site.mjs`. Strict dist audit reports zero findings. New checks emulate lazy renderer sphere calculation after a long preview and compare restored visibility with rebuilt spheres at 1.01/2/3.1s. Phone rear bounds, earlier loop-camera return, outgoing pose continuity, no final scenery, fixed-camera position, front-to-behind passage and screen-right MINI / screen-left Z4 with staggered passage are covered. Existing loop, physical lane distance, preferences, lifecycle and deterministic recycling checks remain.

Chrome 1440×900 reviewed the second street after a rendered 120s hover, earlier loop return, front space approach at 20.6s and the cars passing either side of the camera at 20.78s. The actual homepage keyboard preview keeps the sentence visible; Space hides it, complete playback restores a moving first-shot preview with car-trigger focus, and no warning/error was captured. At 390×844 the front approach retains the side order and no overflow. These are desktop Chrome viewport checks, not physical touch, Safari or FPS measurements.

Evidence: `flypast-second-street-fixed.png`, `flypast-earlier-loop-return.png`, `flypast-front-space.png`, `flypast-between-cars.png`, `flypast-mobile-front.png` and `flypast-mobile-street.png` in the task artifact directory. Author fixtures are removed and viewport overrides reset before commit.

---

# Previous: Endless street preview and a 360-degree grid loop, 2026-10-25

Started from 313388e on clean master. MINI receives small proportion corrections; the approved line art, graphite/white/amber palette, five setups and 4.6s exhaust segment remain.

## Changes

- MINI lamp width is 91% of the previous width; the roof/cabin rises about 3cm. Tires keep their circular diameter and depth, and Z4 geometry is unchanged.
- Hover/focus now runs an unbounded first-camera clock. Camera-relative recycling keeps whole frontages, paving and lantern assemblies together and near the origin; it does not accumulate previous-frame state. Raw wheel distance keeps advancing. A click inherits the current preview pose and street matrices, then cuts after one second. The complete edit is 20.5s: 0–1 / 1–3.2 / 3.2–5.5 / 5.5–10.1 / 10.1–20.5. Native text stays visible for preview, hides for deliberate playback and restores afterward. Reduced motion still uses a static preview.
- After the existing bends, the shared vehicle/portal/rail route turns up and left into a 22m-radius vertical loop. C2 approach/exit curves and stable local frames carry both cars through a complete inversion. A smooth 12m lateral shift separates the exit from the entrance. Actual offset-lane arc length still determines cornering gain; the existing boost law reaches its original terminal speed before the added stunt.
- The camera pulls outside to show the whole loop, follows the exit and returns to chase framing before the cars leave the final portal for the stars. Portrait framing has a dedicated wider view. Distant loop contours and portal cross sections gain restrained contrast/thickness during the exterior view, without an extra ink. Scenario Motion Loops' pure-time/recycling method remains; no new package, production asset or simulation history.

## Actual verification

Passed `node tools/test-home.mjs`, `node tools/test-motor-race.mjs`, `node tools/test-home-state.mjs`, `node tools/test-photo-transition.mjs`, `node tools/test-game-transition.mjs` and `node tools/validate-site.mjs`. Strict published-directory design audit reports zero findings. Added indefinite first-shot movement, exact click handoff, simulated one-second cut, moving-preview restoration, bounded/reversible/out-of-order street matrices through 100000s, continuous loop joins/frames, actual car inversion, complete-loop desktop/phone framing and open-star departure checks. Existing geometry, six viewport visibility, inner-lane gain, delayed acceleration, flying architecture and preference/background handling remain covered.

Chrome reviewed the actual homepage at 1440×900: keyboard focus remained in preview/starlit-lead after 71.566s with the sentence visible. Space started film mode with the sentence hidden; full playback completed and returned to a moving preview with native trigger focus. No warning/error was captured. Exact one-second switching is verified by the controlled RAF regression rather than a live wall-clock measurement.

Reviewed the MINI front, left/up approach, inverted apex, exit and 20.5s open-star departure. At 390×844 both the complete loop and long-running preview fit without horizontal overflow; the preview cars remain below the sentence. These are desktop Chrome viewport checks, not physical touch, Safari or FPS measurements.

Evidence in the task artifact directory: `loop-mini-preview.png`, `loop-mobile-endless-preview.png`, `loop-mobile-apex.png`, `loop-left-up-approach.png`, `loop-open-star-exit.png` and `loop-final.png`. Review fixtures are removed and viewport overrides reset before commit.

---

# Previous: First-shot preview, click film and natural grid entry, 2026-10-25

Started from a3f1869 on clean master. The latest user instruction explicitly changes interaction: the sentence remains for hover/focus preview, but disappears during deliberate full playback. Vehicle art, five cameras, 17.7s film, 4.6s exhaust, graphite/white/amber inks and rear details remain.

## Changes

- `home-motorsport.mjs` now separates first-shot preview from full playback. Hover/focus advances to 2.18s / starlit-lead and stops its RAF; it never enters the second setup. Click/tap/Enter/Space restarts the complete film. The playback callback lets `home.mjs` set the sentence's scoped visibility, without removing layout or making main inert. Completion returns to the first-shot preview if hovered/focused, otherwise the quiet page. Escape cancels and restores keyboard trigger focus; graphics/preference handling clears playback visibility.
- Reframed the first camera up/left, putting vehicles below/right of the unchanged sentence. A measured phone sentence band can shift the camera farther up to keep wrapped text clear. Bounds/projection tests cover the complete preview interval, including a tall sentence on a short phone viewport.
- Moved guide/path/paving/camera entry about 0.5s earlier without shortening the requested exhaust duration or film. The former straight road now consists of dynamic curved surface strips, instanced stones and kerbs following the guide's own frame. Kerbs widen towards the grid; a world-depth mask dissolves distant paving before nearby paving, gradually revealing stars. The central-road fade runs 11.15–12.8s, with a depth-dependent lead/lag. Growing portal frames are anchored at the floor, preventing a floating horizontal bar across the cars during reveal.
- Each actual offset lane has a cached Simpson-integrated arc table and monotone Hermite inversion. The same travelled distance therefore means equal physical road speed; an inside lane reaches farther around a bend because its route is shorter. Opposite bends reverse the gain. Tables prepare before playback, avoiding a cold-cache calculation in the transition. Wheel rotation uses the same travelled distance, while camera progress follows the center lane. MINI retains its 0.45s response but uses a slightly softer, longer ramp; both reach 16.2m/s extra terminal speed. Reduced minor throttle corrections keep the lane geometry responsible for the cornering gain.

## Actual verification

Passed motor, home lifecycle/state, photo/game entrance regressions, site validation and strict dist audit (zero findings). Added first-shot stop / full-play / restore / cancel behavior, movie world locking, route inversion, constant actual lane speed, opposite inner-lane gains, first-camera text clearance and floor-anchored reveal checks. Existing path/cut continuity, stopped/reduced-motion/background handling, geometry/tyres, six viewports, deterministic out-of-order state and Scenario motif seams remain covered.

Chrome verified the actual homepage at 1440×900: keyboard focus starts an unpinned preview that reaches preview-hold / starlit-lead with the sentence visible. Space hides the sentence and starts film mode from the beginning. Both keyboard and actual mouse playback complete and restore the first preview; after a mouse launch the trigger is still hovered and the main sentence is visible. Escape during playback restores the sentence and car-trigger focus. Native sentence bounds remain x=184.0625, y=416.17709, width=1071.86462, height=67.64584; main has no inert ancestor. No warning/error was captured.

Reviewed the shared curved road at 11.6s, fading paving at 12.3s and full preview playback through 17.70s / grid-guide. A temporary layer selector isolated the reveal and led to the floor-anchor correction; it is not part of the product. At 390×844 the held native preview has vehicles below the sentence and no horizontal overflow. These are desktop browser viewport checks, not physical touch, Safari or FPS measurements.

Evidence in the task artifact directory: `preview-first-framing.png`, `preview-curved-road-transition.png`, `preview-last-pavement.png`, `preview-native-film-no-sentence.png`, `preview-mobile-hold.png`, `preview-final.png`. Review fixtures are removed and temporary viewport overrides reset before commit.

---

# Previous: Curved star-grid chase and rear details, 2026-10-25

Started from d8055be on clean master. The five-shot / 17.7s edit, 4.6s exhaust segment, fixed native sentence, hover/focus/pinning controller and first two camera compositions remain. This update replaces the final fixed gap, straight tunnel, persistent road/lamps, vertical third camera and lighter gray.

## Implementation and references

- Both drivers gain analytic, out-of-phase position corrections after the initial surge, with matching first/second derivatives for velocity and acceleration. Z4 still ignites first and MINI responds 0.45s later. Sampling the final shot at 0.01s intervals yields Z4 longitudinal lead from -0.0904m (almost level) to 3.4969m; relative velocity changes sign, ranging from -3.3439 to 3.5814m/s. This is natural small closing/opening, not a forced alternate pass in every shot.
- `home-motor-path.mjs` defines one C2 world-space centerline, tangent/right/up frame and restrained banking. Cars, portal frames, segmented instanced rails and camera use it. The entrance stays straight through the 11.3s join, then develops S bends, a rise and a dip. Scenario Motion Loops' pure-time phase/recycling approach remains; no simulation/frame-history state.
- The temporary road normal/depth overlay fades analytically from 11.65 to 13.35s, progressively admitting stars below the cars, then hides completely. The guide creates no street lamps. Existing street lamps only accompany the flying architecture. Grid rails remain beneath/around the cars, without filled road surfaces or colored plates.
- The final camera rises from 11.85s and settles by 15.1s into a right rear-quarter position, tracking the curved course. Portrait framing pulls back to keep both cars legible. The third shot is now an oblique high city view, retaining MINI left/front and Z4 right/rear. The scenery shutter reprojects the analytic earlier camera including turning/orbiting, rather than only subtracting straight Z travel.
- Ground is deepened to `#222226`; pale `#f2f1ed` and amber `#eac36b` remain the other two inks. More visible white pins and restrained bright cross glints strengthen the star field while all car/architecture interiors remain unfilled.
- Inspected official [2018 MINI photographs, including P90289431](https://www.press.bmwgroup.com/global/photo/compilation/T0277249EN/the-new-mini-3-door-the-new-mini-5-door-the-new-mini-convertible?language=en) and [E85 rear photo P0008313](https://www.press.bmwgroup.com/united-kingdom/photo/compilation/T0016112EN_GB/the-new-bmw-z4?language=en_GB) in Chrome. MINI adds mirrored half-flags with vertical/horizontal/diagonal tubes inside the rounded lamp housings, a rear wiper, winged badge, handle and bumper crease. Early E85 now has dominant circular outer lamp chambers and smaller inner chambers, a swept trunk seam, central brake strip and plate recess. The references are not copied into production, and the models remain original stylized line drawings.

## Verification

Motor regression checks analytic driver/camera derivatives, a changing bounded gap, direct-cut and final-join continuity, path frames and car orientation, nonzero lateral/vertical curvature, monotonically vanishing ground, absent guide lamps, camera rise, all-six-viewport car visibility, rear detail coverage, exact restart/restoration and out-of-order curved-geometry/camera determinism. Existing tire thickness/roundness, model bounds, architectural corridor, rigid flying lamps and standalone Scenario motif seams remain covered.

Passed motor, home lifecycle/state, photo/game entrance regressions and site validation. Strict dist design audit reports zero findings. Chrome reviewed desktop slanted city, road dissolve, first bend, upper-quarter chase and rear-model studies; narrow viewports retain both cars with no document overflow. Complete preview playback reaches 17.70s / grid-guide without warning/error. These are desktop browser/viewport checks, not physical touch, Safari or frame-rate benchmarks.

The actual homepage retains identical sentence bounds before/during at 1440×900: x=184.0625, y=416.17709, width=1071.86462, height=67.64584, with no inert ancestor. Tab begins an unpinned preview. The clock reaches idle / grid-guide, Space pins, Escape clears and retains trigger focus, and the span keeps the original -9 degree skew. No warning/error was captured in the actual homepage logs. Temporary review fixtures are removed and viewport overrides reset.

Evidence in the task artifact directory: `orbit-oblique-city.png`, `orbit-ground-dissolve.png`, `orbit-first-bend.png`, `orbit-mobile-second-curve.png`, `orbit-mobile-oblique.png`, `orbit-mini-tail-v1.png`, `orbit-z4-tail-v1.png` and `orbit-final.png`. Rear study controls are authoring-only, not additional production shots.

---

# Previous: Five-shot graphite lantern chase, 2026-10-25

Starting from c87a762 with a clean master, this revision follows the user's five-shot recut and supplied MINI-paint / classic-lantern photographs. No reference image is copied into the published site. The neutral ground is the median of a dark bonnet sample, `#3d3d41`, rather than a manufacturer paint specification. Pale `#f2f1ed` contours and amber `#eac36b` light complete the three base inks.

## Implementation

- Timeline: front MINI lead 0–2.2s; retained low rear camera with MINI alone 2.2–4.4s; true overhead with MINI left/front and Z4 right/rear 4.4–6.7s; exhaust/overtake/flight 6.7–11.3s; continuous line-art Grid guide 11.3–17.7s. Exhaust retains its previous 4.6s duration. Camera, target, travel, ground and vehicle progress match across the last join; only the guide's far-first reveal develops. Early camera changes remain direct cuts.
- Rounded body/cabin/trim groups compress vertically to 94% around axle height; tires retain full circular diameter and physical thickness. MINI responds 0.45s after Z4 ignition, reaches the same additional 16.2m/s terminal speed and limits the final Z4 lead to about 1.99m. The camera responds at a 0.60s offset so both cars remain in view. Flames, needles and wheel spin follow the corresponding driver law.
- The Gothic/Renaissance kits gain a procedural classic lantern row: fluted posts, plinth/collars, tapered four-sided glass, sloping frames, roofs and finials. Amber emitters have a separate depth mask, restrained glow and car/building occlusion. Every part of one lamp shares a flight anchor/seed, keeping the warm pane attached as the entire lamp flies with the architecture.
- The new `home-motor-guide.mjs` uses Scenario Motion Loops phase/recycling helpers in the actual vehicle space. Aligned 1.8m roadway, 7m portals and 14m lamp periods avoid a reset. A separate time/depth envelope reveals distant frames before near frames. All active views use the same contour finish; old colored/cosmic branches are no longer imported by the race renderer. Archived helpers remain available without reintroducing their deleted shots.
- The active pipeline captures environment normals/depth, cars normals/depth and amber emitters/depth, then composes one contour view. Scenery shutter is analytic and car/text edges remain sharp. No new package, remote production asset, physics loop or previous-frame history.

## Verification and browser evidence

Passed `node tools/test-motor-race.mjs`, `node tools/test-home.mjs`, `node tools/test-home-state.mjs`, `node tools/test-photo-transition.mjs`, `node tools/test-game-transition.mjs` and `node tools/validate-site.mjs`. Strict published-directory design audit reports zero findings. Added exact five-shot order, circular tires after lowering, six viewport projections, solo rear visibility, overhead screen-space order, delayed flame/velocity derivatives, bounded lead, camera derivative, exact last-join continuity, recycled road coverage, far-first guide reveal, rigid whole-lamp flight, finite geometry, deterministic out-of-order updates and exact burst/culling restoration. Standalone Scenario Grid/Warp twelve-second seam checks remain, although Warp is not in this edit.

Chrome reviewed 1440×900 front, solo rear, overhead, airborne buildings/lamps and guide; 390×844 overhead and final guide remain legible with no horizontal document overflow. Complete preview playback reaches 17.70s / grid-guide. No warning/error was captured in the preview or actual homepage logs. These are desktop browser viewport checks, not physical touch, Safari or frame-rate measurements.

On the actual homepage, Tab starts an unpinned preview; the clock reaches idle / grid-guide, Space pins and Escape clears while retaining trigger focus. Native heading bounds match exactly before/during: x=184.0625, y=416.17709, width=1071.86462, height=67.64584 at 1440×900. Main has no inert ancestor, and the car span retains matrix(1,0,-0.158384,1,0,0), the original -9° skew. Resting content, portrait/card and other entrances remain.

Evidence in the task artifact directory: `graphite-front.png`, `graphite-solo-rear.png`, `graphite-overhead.png`, `graphite-flying-lanterns.png`, `graphite-grid-guide.png`, `graphite-mobile-overhead.png`, `graphite-mobile-guide.png` and `graphite-final.png`. Disposable review fixtures are removed and viewport overrides reset before commit. Models remain original stylized geometry rather than dimensional CAD reproductions.

---

# Previous: F56 / E85 curved surfacing, 2026-10-25

Starting from 22d9dc5, the user asks for closer F56 / E85 front and body shapes with less angular surfacing. This revision changes vehicle geometry and trim; seven-shot order, 17.7s duration, 4.6s exhaust shot, camera poses, speed laws, architectural drift, palettes and native heading/controller remain.

## References and modeling

- Period primary references: [2014 MINI Hardtop / F56 launch](https://www.press.bmwgroup.com/usa/article/detail/T0157784EN_US/introducing-the-new-mini-the-new-original?language=en_US) and [2002 BMW Z4 launch](https://www.press.bmwgroup.com/united-kingdom/article/detail/T0016055EN_GB/new-bmw-z4-roadster?language=en_GB). Also checked the [BMW Classic E85/E86 identity](https://www.bmwgroup-classic.com/en/models/bmw-classics/product-description-page.ad-1307-1.bmw-z4-e85-e86.html). The standard early E85 roadster is the front-apron reference, rather than Z4 M / E89 / G29.
- Actual photographs inspected in Chrome: [F56 front quarter](https://www.ausmotive.com/pics/2013/MINI-F56-Cooper-S-13.jpg), [BMW official E85 image P0008701](https://mediapool.bmwgroup.com/download/edown/pressclub/public?actEvent=zoomImage&dokNo=P0008701&filename=P0008701.JPG), and [larger silver E85 front/side](https://www.supercars.net/blog/wp-content/uploads/2016/03/2003_BMW_Z430i1-900x768.jpg). References are not imported as production assets.
- `loft` gains opt-in smooth periodic profiles and swept end caps. Both body shells use 96 samples per section, curved noses/tails and restrained wing crowns; E85 includes a shallow concave flank. Legacy defaults remain available. Tire radius/thickness, spokes, brakes and tread stay; wheel centers move from ±0.86m to ±0.77 / ±0.79m to sit within the fenders.
- `home-motor-curves.mjs` uses bounded quadratic corner fillets for glass, grille/kidney/lamp/plate outlines. Seams are sampled over the actual skin, including the nose sweep, instead of bridging only a few floating control points. MINI receives broader rounded grille, oval recessed lamps, round fogs, rounded scoop, clamshell and hatch seams. E85 receives lower/wider rounded kidneys and slats, swept twin-projector housings, round fogs, one broad mouth and curved rear lamps; the former side intake slots are removed.
- Fine MINI honeycomb is one connected line lattice in the colored Grid view. Existing contour capture omits line objects, so its abstract street front stays clean rather than a noisy white grid. Rounded plate borders keep the rear plate legible against the parallel tail surface. These remain original stylized models, not CAD scans.

## Verification

Motor regression passes smooth-body flags and finite normals/vertices, lower wheel-center bounds, wide F56 grille, E85 kidney proportions / fog pairs / absent side slots, and bounded fillets. Existing cabin/roof height, actual tire thickness, roadway clearance, boost continuity, six viewport cases, exact native wording and deterministic Scenario motifs pass. Home lifecycle/state, photo/game entrances, site validation and strict dist design audit pass (zero findings).

Chrome compared old 22d9dc5 geometry and new geometry at the same production t=16.5 camera. Separate authoring front-quarter views inspected surfacing without changing production cameras. Reviewed the actual paired finale, rear following, colored Grid, and 390×844 front opening (no document overflow). Dense grille texture was simplified for contours and rear plate placement/border corrected during this review. Production evidence: `curves-pair-before.png`, `curves-final-pair.png`, `curves-rear.png`, `curves-grid.png`, `curves-mobile-front.png` in the task artifact directory. Earlier v1 authoring captures are intermediate studies, not the final result. The preview finished at 17.70s / rally-finale with no warning/error. On the actual homepage, Tab starts an unpinned preview, the clock reaches idle, Space pins, and Escape clears while keeping car-trigger focus. Native heading bounds match before/during at x=184.0625, y=416.17709, width=1071.86462, height=67.64584 (1440×900); main has no inert ancestor and the span retains -9° skew. Homepage logs were clean.

No frame-rate, Safari, physical touch-device or exact production-car dimensional guarantee is added. Temporary model comparison controls and the original-model module are removed before commit; viewport overrides are reset.

---

## Previous: Exhaust shot +2 seconds, 2026-10-25

Starting from 4f67036, the user requests exactly two more seconds in the exhaust shot. It now runs 8.5–13.1s (4.6s); tracking and finale shift to 13.1–15.3s and 15.3–17.7s. Seven-shot order and other shot lengths remain. The brief flames, acceleration law, slow/wide architectural trajectories and native sentence/controller remain.

The shared travel interval extends across exhaust and tracking. The circuit is lengthened with the same procedural Gothic/Renaissance kit: 44 block slots, 80 facades, 25 churches/chapels and road range [-50,280]. The lane retains its 54 facades and original range. Z4 reaches z≈260.94 just before the final tracking cut; tests sample every 0.1s across the combined segment, checking vehicle extents against roadway limits and architectural frontage coverage. Continuous progress and exposure/velocity derivative tests pass through the shifted cut.

Chrome inspected t=13.05 exhaust tail and t=15.2 tracking tail at 1440×900, and the exhaust tail at 390×844. The extra time shows continued vehicle travel and drifting debris. The narrow tail exposed a filled border smear from contour echo UV clamping; outside-frame shutter samples now contribute zero, and a fresh narrow screenshot confirms its removal. The 8.5–15.29 preview segment played through with no warning/error in its logs. Existing desktop-pointer, physical-device and FPS limitations remain; no new performance claim.

Passed motor regression, home lifecycle/state, Gallery/Projects entrances, site validation, whitespace checks and strict dist audit (zero findings). The actual homepage reaches idle / rally-finale on the new clock; Space pins and Escape clears while retaining car-trigger focus, with no warning/error in its logs. Temporary previews are removed and viewport overrides reset before completion.

Evidence in the task artifact directory: `length-exhaust-end.png`, `length-tracking-end.png`, `length-mobile-exhaust-end.png` (after edge fix), `length-final.png` (clean extended-tail composition).

---

## Previous: Confirmed seven-shot line-art edit, 2026-10-25

This revision starts from 2ea2090. The user confirmed the precise edit before implementation: remove original shots 5 (cosmic arc) and 6 (Warp Stars), retain Grid, make the opening frontal with MINI leading, preserve the second rear view, and apply the approved starry line drawing to every remaining street setup. Houses should move more slowly and scatter through a wider area.

## Result and verification

- Seven hard cuts now run for 15.7s: front MINI lead → rear following → high circuit → Grid → exhaust / architectural drift → low tracking → city finale. Retained durations and non-opening camera angles are unchanged. Exhaust/low tracking share the same integrated progress as before, shifted 5.3s earlier. All six streets use palette 6 and the existing unfilled depth/normal contour finish. Grid keeps its shared-depth colors, vehicles, curves and four short rear strokes.
- The opening camera is ahead of the cars; MINI is over 7m in front of the Z4. The phone crop also stays ahead and shows both front silhouettes. New style selection uses street mode, while special phone cameras remain limited to opening/exhaust; the high circuit and tracking compositions are preserved.
- The architectural wave reaches farther buildings earlier, with gentler launch/lift/outward acceleration and rotation. Increased depth-wise trajectory variation opens a broader scatter instead of two flat rows. An analytic comparison against the actual 2ea2090 burst module, using matching architecture and seeds, measured mean upward speed at local 2.55s of 7.67 versus 19.38 units/s, maximum 10.18 versus 25.28, and depth displacement spread 37.53 versus 8.99 units. By local 1.2s all 6,041 pieces have begun moving, versus 3,457 previously. These are geometry/motion measurements, not a frame-rate benchmark.
- Motor regression checks the exact seven-shot order, absent deleted shots, front MINI clearance, retained rear camera, six line-art street setups, lower lift-speed bound, broad depth distribution, early distant coverage, complete restoration and out-of-order determinism. Existing tire/model/architecture bounds, changing relative speed, boost derivatives/cut continuity, six viewport cases and Scenario motif seams still pass.
- Passed `node tools/test-motor-race.mjs`, `node tools/test-home.mjs`, `node tools/test-home-state.mjs`, `node tools/test-photo-transition.mjs`, `node tools/test-game-transition.mjs`, `node tools/validate-site.mjs`, whitespace checks and strict dist design audit (zero findings).

Chrome reviewed 1440×900 front opening, retained rear view, high circuit, slower scatter and final two street setups. The entire seven-shot preview played through to 15.70s / rally-finale with no warning/error in its logs. At 390×844 the front opening, high circuit and low tracking retained recognizable vehicles and no document overflow. These are desktop-pointer viewport checks, not physical touch, Safari or FPS guarantees.

Actual homepage checks: Tab enters the unpinned `starlit-lead` preview. Before/during native heading bounds match exactly: x=184.0625, y=416.17709, width=1071.86462, height=67.64584 at 1440×900. Main has no inert ancestor. The clock reaches idle / rally-finale, Space pins the preview, and Escape clears it while retaining trigger focus. The span retains matrix(1,0,-0.158384,1,0,0) (-9° skew); no warning/error was captured in the real homepage logs.

Evidence in the task artifact directory: `seven-front-mini.png`, `seven-front-final.png` (clean composition), `seven-rear-follow.png`, `seven-high-circuit.png`, `seven-slow-scatter.png`, `seven-low-tracking.png`, `seven-city-finale.png`, `seven-mobile-front.png`, `seven-mobile-circuit.png`, `seven-mobile-tracking.png`. Disposable preview files are removed before commit and viewport overrides reset.

---

## Previous: Starlit follow and architectural shock wave, 2026-10-25

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
