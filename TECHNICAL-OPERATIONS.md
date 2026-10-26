# Technical Operations Standard

## Purpose

This repository is the source of truth for the **Polaroid of Yesterday** web archive. The published website is generated as static files in `dist/` and is deployed to GitHub Pages from the `master` branch.

本文件规定项目的存档（存档 / archive）、更新摘要（summary）和 GitHub 上传（upload）标准，确保每次修改都可追溯、可复现，并且能及时上线。

## Repository map

- `tools/notion-source.md` — source document for visible content.
- `tools/render-notion.mjs` — renderer that generates the static document.
- `tools/validate-site.mjs` — local integrity and source/render parity checks.
- `dist/index.html` — deployable website entry point.
- `dist/assets/` — shared site assets such as the portrait and fonts.
- `dist/projects/polaroid-of-yesterday/game-design-document/assets/` — image assets owned by the Polaroid of Yesterday document.
- `DESIGN.md` — visual and content-preservation constraints.
- `tools/gallery-notion/`, `tools/gallery-document.mjs`, `tools/render-gallery.mjs` — Notion content snapshots, native media mappings and the shared editorial article renderer.
- `tools/sync-gallery-notion.mjs`, `tools/GALLERY-NOTION-SYNC.md` — Read-only Notion export, local watcher and setup instructions.
- `dist/gallery/` — Gallery homepage, photography/film articles, shared exhibition styles and local media.
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow.

## Standard update cycle

`AGENTS.md` is the entry point for all project chats. The user has authorized agents to summarize, commit, push, and verify publication after each completed update without asking again, unless the current task explicitly requests local-only work. Use Git CLI; opening GitHub Desktop is optional. Commit only the current task's changes and preserve work from other chats.

Every update MUST follow this order:

1. **存档 / Archive** — before editing, preserve the current source, assets, and relevant configuration in Git history. For source imports or generated content, record the origin and date in the corresponding file or update note. Never rely on an external URL as the only copy of an asset.
2. **修改 / Update** — make the smallest coherent change. Keep visible document content sourced from `tools/notion-source.md`; keep generated output in `dist/` synchronized with the source.
3. **验证 / Validate** — run the project validation command below. Confirm that all referenced local assets exist and that the rendered headings, text, and image order still match the source.
4. **摘要 / Summary** — write a short update summary in the commit message. The summary must state what changed, why it changed, and how it was verified. If the update is substantial, add a dated entry to this document's change log.
5. **提交 / Commit** — commit the complete update as one logical unit. Do not leave generated output, source changes, or required assets uncommitted.
6. **上传 / Upload** — push the commit to `origin/master` immediately after a successful commit. A local-only update is not considered complete.
7. **上线确认 / Confirm publish** — do one brief publication check and open the public URL to confirm the updated feature works. Following the user's 2026-10-14 clarification, finish after that check instead of repeatedly polling Actions or concurrent Notion runs. If publication is still pending or unavailable, report that actual state with the run link.

### Required commands

```powershell
# From the repository root
node tools/validate-site.mjs
git status --short
git add -- <explicit-files-for-this-update>
git commit -m "Describe the update and its purpose"
git push origin master
```

For a source change that requires regeneration:

```powershell
node tools/render-notion.mjs
node tools/validate-site.mjs
```

Do not use `git add -A` blindly when unrelated files are present. Review `git status` and `git diff --stat` first, then stage the intended complete update.

## Commit summary standard

Use a concise imperative subject, for example:

```text
Publish refreshed game design archive
```

The commit body should answer:

- **What:** files or content changed.
- **Why:** the user or product reason.
- **Verified:** the validation command and deployment check performed.

## Archive standard

Git history is the primary archive. Each meaningful update must retain:

- the original source or source reference;
- the generated site output required to reproduce the published page;
- local copies of all assets used by the page;
- the validation or rendering tool needed to check the output;
- the commit summary explaining the change.

If an asset is replaced, keep it beside the document or page that owns it, update the source reference or renderer mapping, and verify that no expiring external asset URL remains. Do not delete a prior asset unless it is unused and the removal is explicitly documented in the commit summary.

## GitHub Pages standard

- Canonical repository: `https://github.com/SmartChen2005/smartchen2005.github.io`
- Deployment source: `master` push, via `.github/workflows/pages.yml`.
- Published directory: `dist/`.
- Expected public URL: `https://smartchen2005.github.io/`
- Confirm that the public URL returns the current, working update. Check the workflow result when readily available; do not prolong the task with repeated deployment polling. Report pending or failed publication accurately.

The workflow intentionally deploys the existing `dist/` directory as-is. This keeps the repository's source and generated output layout stable while making the GitHub Pages publication explicit and repeatable.

## Current baseline

At the time this standard was added, the repository contains the complete current static archive, its local image assets, the Notion source, the renderer, the validator, and the design context. The baseline is published by the commit that adds this document and the Pages workflow.

## Change log

### 2026-10-25 — One narrow carriageway across street cameras

- Added one shared 2.3m road half-width for both city layouts and the dissolving exit. All street cameras now use the same 4.6m narrow two-car corridor, with matching building/lantern/bridge/kerb placement. Paving marks stay within its edges.
- The road keeps its width during the existing far-to-near dissolve instead of expanding into the larger abstract grid. Vehicle motion, cameras and the 20.65s edit retain their approved state.
- Motor/home checks, site validation and strict dist audit passed. Desktop and narrow browser evidence is recorded in `tools/MOTOR-RACE-QA.md`.

### 2026-10-25 — Smaller MINI lamps and a tighter city edit

- Reduced the complete MINI headlamp assemblies another 5%, preserving the earlier narrower oval proportions. Third-shot road width is now 4.6m; car centers move to ±1.05m, the camera stays within the corridor, and architecture/lanterns/kerbs/banners fit the tighter width.
- Shortened the second and third setups by 0.4s each, to 1.8s and 1.9s. The later choreography shifts earlier by 0.8s and full duration becomes 20.65s; boost, loop and flypast local timing remain intact.
- Passed motor/home lifecycle and state checks, site validation and strict dist audit. Actual desktop/narrow visual review and evidence are recorded in `tools/MOTOR-RACE-QA.md`.

### 2026-10-25 — Restore second-shot streets and add the front space pass

- Fixed stale instanced-mesh culling spheres: derive the original street bounds before recycling the hover, rather than letting the renderer cache a recycled layout. Long hover → second shot now restores both transforms and valid visibility. Narrow solo-rear framing also keeps the whole MINI in view.
- Return from the loop exterior camera about half a second earlier. At 19.8s, after both cars clear the final portal, directly cut to a fixed camera between the outgoing lanes. Z4 passes screen-left slightly before MINI passes screen-right. This shot contains only cars/stars and ends at 21.45s; the physical trajectories and 4.6s exhaust remain intact.
- Added lazy-renderer-bound reproduction, restored-frustum, phone rear-bounds, earlier-camera and actual front-to-behind flypast/side-order regressions. Passed home/motor/state, photo/game transition checks, site validation and strict dist audit. Browser evidence and limitations are recorded in `tools/MOTOR-RACE-QA.md`.

### 2026-10-25 — Endless street preview and a 360-degree grid loop

- Narrowed MINI headlamp assemblies by 9% and raised roof/glass/pillars about 3cm. Added camera-relative frontage/lamp/paving recycling for the continuously moving hover. Activation inherits live preview progress, hides the sentence and cuts to the next setup after one second.
- Added a C2 left/up approach, full 22m-radius vertical loop, laterally separated exit and open-star departure. Path frames remain continuous at vertical tangents; cars, portals and rails share the same loop and actual lane-distance motion. Exterior/portrait cameras reveal the entire stunt, with modest grid stroke/contrast support.
- Film timing is now 20.5s: the opening shortens by 1.2s and the final stunt extends by 4s; the exhaust remains 4.6s. Existing acceleration ramp is preserved before terminal cruise. Full playback returns to moving preview only when still hovered/focused.
- Extended infinite-preview bounds/restoration, exact click handoff/one-second cut, loop inversion/tangent/exit, complete-loop viewport coverage and determinism checks. Actual browser evidence, checks and limits are recorded in `tools/MOTOR-RACE-QA.md`. No new dependency or external production asset.

### 2026-10-25 — Separate hover preview from click playback and smooth the grid entry

- Hover/focus now stops inside the first setup at 2.18s. Click/Enter/Space starts the complete film and hides the sentence without changing layout; completion/Escape/failure restore it, with keyboard focus restoration. The first camera places both cars below/right of the native sentence. Movie/preview lifecycle regressions preserve one RAF and graphics/preference/background handling.
- Advanced grid/path/road/camera entry by about 0.5s. Replaced the straight temporary plane with curved strips, instanced paving and kerbs on the grid centerline; world-depth alpha dissolves far paving first. Anchored growing portals to the floor, removing floating bars in front of the cars.
- Integrated each offset lane's actual arc distance, so inner lines naturally gain progress at equal road speed. Softened MINI's delayed acceleration slightly and reduced unrelated pace oscillations. Extended route inversion, constant road speed, lane advantage, first-shot text clearance and portal anchoring checks.
- Updated design/QA records; browser evidence and actual validation are in `tools/MOTOR-RACE-QA.md`. No added dependency or external production asset.

### 2026-10-25 — Bend the star-grid chase and refine both rear identities

- Replaced the final locked pace with integrated out-of-phase driver corrections; retained the causal Z4/MINI ignition delay and continuous final join. Added one shared curved/banked 3D path for vehicles, portals, instanced rail segments and a gradually rising right-quarter camera. The third city camera is now oblique.
- The temporary road fades from 11.65 to 13.35s using its normal/depth alpha before hiding; stars appear underneath and the grid has no replacement street lamps. Deepened graphite to `#222226` and strengthened the white star field. Scenery shutter now uses the analytic earlier camera including curvature/orbit, with no frame history.
- Inspected official MINI Union Jack and BMW E85 rear photos. Added mirrored half-flag tail bars, rear badge/handle/wiper/bumper details; rebuilt E85 circular lamp chambers, trunk seam, central brake strip and recessed plate. Reference links and actual checks are in `tools/MOTOR-RACE-QA.md`.
- Extended derivative, changing-gap, path alignment, ground removal, absent-lamp, rising-camera, viewport visibility and out-of-order determinism checks. Updated design context; no new package or external production asset.

### 2026-10-25 — Five graphite line-art shots with classic lanterns

- Retained the front MINI lead, made the second camera a solo MINI rear view, changed the third to overhead and joined the 4.6s exhaust shot continuously into a new line-art Grid Tunnel. Total playback remains 17.7s. All active setups use sampled graphite `#3d3d41`, pale contours and amber light; removed the old colored/space rendering branches from the active race module.
- Lowered bodywork/cabins/trim by 6% around the axle while preserving round, thick tires. MINI responds 0.45s after Z4 boost, with a delayed tracking camera and bounded lead. Added a procedural classic lantern kit, depth-masked amber pass and shared rigid flight anchors so posts/glass/frames scatter together with buildings.
- Added recycled roadway, portals and lamp rows using Scenario analytic phase helpers. The far-first grid reveal shares camera, travel, scenery flight and vehicle state through the final join. Added timing/derivative, screen-space formation, join continuity, road coverage, rigid lamp flight/reset and deterministic reveal checks. Design/browser evidence is recorded in `tools/MOTOR-RACE-QA.md`.
- Required checks: motor, home lifecycle/state, photo/game entrances, site validation and strict dist design audit, accompanied by native homepage interactions and desktop/narrow browser review. No new dependency or external production asset.

### 2026-10-25 — Round and refine the F56 / E85 models from vehicle references

- Rebuilt the body profiles and swept end caps with continuous curvature, gentler wing transitions and E85 flank concavity. Rounded glass/trim panels and projected door/bonnet seams replace sharp polygons or floating lines. Lowered the shell and moved wheel centers inward while preserving physical tire thickness and detailed wheel construction.
- MINI gains the wider rounded grille, restrained inset oval lamps, round fogs, smoother scoop and hatch details. The standard E85 gains wider rounded kidneys, swept projector lenses, round fogs and one broad lower inlet; removed the exaggerated side slots. Fine MINI honeycomb is retained as a single lattice in the colored pass and omitted from abstract contours to prevent noise.
- Referenced period MINI/BMW launch pages and inspected front-quarter photographs; links, browser evidence and limitations are recorded in `tools/MOTOR-RACE-QA.md`. Extended model bounds/feature/fillet tests. The seven-shot edit, 17.7s timing, acceleration and native homepage controller remain.

### 2026-10-25 — Add two seconds to the exhaust shot

- Extended exhaust from 2.6 to 4.6 seconds (8.5–13.1s); tracking shifts to 13.1–15.3s and the finale to 15.3–17.7s. The seven-shot order, cameras, brief backfire windows and slow architectural drift remain.
- Extended the circuit's same Gothic/Renaissance kit to 44 block slots / 80 frontages, with road, kerbs and cobbles through z=280, so the longer integrated boost stays within the built environment. Lane architecture remains unchanged. Added roadway/frontage coverage regression across the entire boost segment.
- Reject outside-frame contour echo samples to avoid a clamped border smear exposed by the new narrow-screen tail. Motor/home/state, entrance regressions, site validation, strict audit and actual tail/cut browser checks pass; evidence is in `tools/MOTOR-RACE-QA.md`.

### 2026-10-25 — Confirmed seven-shot line-art edit and slower architectural drift

- Followed the user's confirmed shot map: removed cosmic arc and Warp Stars, retained Grid Tunnel, and shortened playback from 21s to 15.7s without stretching retained shots. The opening now looks back at the leading MINI and following Z4; the second rear camera and remaining established street angles are preserved.
- Applied the approved unfilled contour / solid ink / starry-sky finish to all six street setups, including the high circuit and final two shots. Scoped phone reframing to the front opening and exhaust so the new style does not overwrite other cameras.
- Slowed architectural lift, lateral acceleration and rotation, added a gentle launch, extended the wave's early reach and widened depth-wise scatter. At local 2.55s, mean upward speed drops from 19.38 to 7.67 model units/s, while depth displacement spread grows from 8.99 to 37.53 units. All 6,041 pieces have begun moving by local 1.2s. Vehicle acceleration and deterministic restoration remain.
- Updated timeline, shot-order, front-leader, style-scope and motion-bound regressions. Actual browser review and evidence are in `tools/MOTOR-RACE-QA.md`.

### 2026-10-25 — Starlit following opening and architectural boost shock wave

- Replaced the solo opening with two naturally spaced following cars, using the exhaust shot's unfilled contour / solid ground / starry-sky finish. Added a higher rear phone crop so both vehicles remain visible. Native homepage wording, geometry, preview controls and skew are unchanged.
- Increased early Z4 acceleration from 8 to 18m/s², with a shorter acceleration window and 16.2m/s extra terminal speed. Retained integrated position/velocity continuity into the following camera; offset the shared segment to keep travel inside the built road. Peripheral line echoes grow with the boost.
- After ignition, all 6,041 lane architectural instances, including walls, arches, spires, domes and overhead passage, lift and spin out towards both sides of the sky. Seeded analytic transforms preserve instancing, avoid a physics loop and restore exactly on restart/cut. Extended motion/restoration tests; actual browser evidence and checks are in `tools/MOTOR-RACE-QA.md`.

### 2026-10-25 — Gothic and Renaissance architecture across every street

- Replaced the shared timber-house kit in both narrow-lane and city-circuit layouts with Gothic cathedrals/chapels/halls and Renaissance palazzi/domed churches. All six street shots inherit the replacement. Each layout has 54 facades with six twin-tower cathedrals and recurring ecclesiastical landmarks on both sides.
- Added cached, instanced pointed/round arch mouldings, rose tracery, buttresses/spires, rustication, classical columns, pediments, balustrades and ribbed dome assemblies. Preserved road width, bridge clearance, circuit furniture, camera cuts, car models/physics, palettes, shutter, line-art sky and space shots. Native identity buttons now inherit the existing text contour for readability against bright facades.
- Extended the motor regression to check style/landmark coverage on both sides, non-overlapping frontage plots, actual geometry motifs, and the driving corridor against every architectural instance's bounds. Browser review and limitations are in `tools/MOTOR-RACE-QA.md`.

### 2026-10-25 — Brighter Grid tails and stars above the line-drawn street

- Raised the four Grid strokes' brightness and eased their taper; history grows from 0.14s to 0.19s (about 3.4m), retaining thin geometry and camera-safe placement.
- Added stable directional stars and a few glints to the empty sky of the line-drawn exhaust shot. Depth/vehicle masks protect the drawing and flat surface interiors. Cameras, car motion, flame timing and all other setups retain their previous behavior. Browser evidence and actual checks are recorded in `tools/MOTOR-RACE-QA.md`.

### 2026-10-25 — Restrained Grid traces and a single line-drawn exhaust shot

- Limited visible changes to the two user-selected setups. Grid gains four short tapered rear strokes. The exhaust/acceleration shot becomes pale contour drawing over one solid dark background, with normal/depth occlusion and no material fills; its phone crop pulls back enough to show the flare. Desktop composition, vehicle progress/backfire and all shot boundaries are preserved.
- `home-motor-line.mjs` owns the scoped contour finish. Normal-pass visibility, fog, override material, layers and shadow-update state restore before other shots render. Added tests for exact style scope and short, attached, camera-safe Grid traces. Design/browser evidence and a pixel-identical unchanged-shot comparison live in `tools/MOTOR-RACE-QA.md`.

### 2026-10-25 — Integrate cosmic flight and causal acceleration

- Replaced the green abstract plate with a dual-car curved starfield flight inspired by the user's supplied Entergalactic stills. Added banked rear-attached cyan/magenta ribbons, sparks, a procedural galactic disc, common lighting/depth and a shared glow finish. Rebuilt Grid Tunnel as a curved chase and Warp Stars as a frontal sprint within the same 3D space, retaining the Scenario deterministic motion helpers.
- Added a low tracking cut after the exhaust shot; the 21-second nine-cut film retains the established city camera compositions. Backfire now begins a smooth Z4 acceleration with integrated displacement continuous through the camera cut. Parallel/following formations have differing instantaneous speeds. The city shutter follows the faster tracking camera correctly.
- Replaced red/ochre/green accents with cool blue/teal streets, preserved three street inks, and refined E85 swept lamp recesses/projectors, kidney details, lower intakes/splitter, deck lip and cockpit instruments. Native heading, hover/focus/pinning, skew, preferences and other entrances remain.
- Actual browser evidence, test coverage and limits are recorded in `tools/MOTOR-RACE-QA.md`. Run site, motor/home/state, photo/game entrance checks and the strict dist audit before committing. No additional dependency or external image/model asset.

### 2026-10-25 — Add racing speed, selective shutter and vehicles in hyperspace

- Preserved the eight compositions/cut timings and native 2D hover sentence. Increased street travel from 9m/s to a 30m/s average, with a small within-shot acceleration, faster wheel rotation, 72 peripheral speed streaks and a faster diagonal pass.
- Added a depth-reprojected, seventeen-sample centered shutter for scenery, with a separate sharp vehicle/depth composition. The blur mixes the existing three inks and has no prior-frame history. Reduced motion/final idle remove shutter displacement and moving streaks; the foreground vehicle canvas is only presented during its crossing shot.
- Grid Tunnel now contains a rear chase and Warp Stars a frontal two-car sprint. Grid flow is faster; 192 star streaks retain deterministic twelve-second closure and stop before crossing the camera. Buildings and roads remain absent from these two abstract shots.
- Refined the bodies with flatter decks/shoulders, smaller real-width rolling tires, non-bulging window frames, lower MINI roof and lower E85 windshield/roll hoops. Existing detailed rims, brakes, open cockpit, palettes, traditional city, natural formations and backfire remain.
- Validation and real-browser evidence/limits are recorded in `tools/MOTOR-RACE-QA.md`. Run site, motor/home/state, photo/game entrance checks and scoped strict design audit before committing. No changes to the Gallery/Projects entrance or portrait assets.

### 2026-10-25 — Restore the native 2D heading and recut the three-ink rally

- Restored Car Enthusiast hover/focus, its original skew and unchanged native sentence geometry. Removed the immersive modal, inert/hidden homepage behavior, 3D sentence module, glyph JSON and FontTools generator. Vehicle foreground pixels can cross the 2D heading without capturing input.
- Replaced rainbow facades with traditional half-timber/gabled European lanes and a separate urban circuit. Eight independent hard cuts use at most three inks each; pure Grid Tunnel and Warp Stars omit all cars, roads and buildings. Solo, following, parallel, diagonal and short exhaust-backfire setups replace forced alternating passes.
- Refined MINI cabin/headlights/grille and retained volumetric wheels and the detailed open E85. Three-ink rendering and cutout composition share one renderer. Scene performance limits are 1.5 DPR / 2.6M pixels and a 1024px shadow map.
- Run `node tools/test-motor-race.mjs`, `node tools/test-home.mjs`, `node tools/test-home-state.mjs`, `node tools/test-photo-transition.mjs`, `node tools/test-game-transition.mjs` and `node tools/validate-site.mjs`. Updated browser evidence, Scenario loop checks and limitations are in `tools/MOTOR-RACE-QA.md`; published-directory audit in `tools/motor-race-premium-audit.json`.

### 2026-10-24 — Build the full-screen pop-art European city chase

- Replaced the split canvas/HUD with a full-viewport Three.js scene using the existing local library, four saturated print palettes and eight hard cuts. Added 61 European facades, balconies, mansard roofs, cafe awnings, lamps, trees and a fountain/clock square.
- Rebuilt the black MINI and silver open Z4 as detailed original models with curved arch/body geometry, recognizable trim, open interior and volumetric tires/rims/brakes. The exact homepage sentence is extruded from the existing Instrument Serif font and becomes physical underpass and drive-over street typography.
- The immersive entrance is deliberate click/tap/keyboard activation, with Close/Escape, focus restoration, static reduced motion, forced-color/native fallback and graphics-failure recovery. Original homepage/other entrance behavior is preserved; the bottom telemetry area is removed.
- `tools/render-motor-type.py` regenerates the checked-in glyph JSON when fonts change (FontTools required only for that authoring command). Run the existing site, homepage/state, motorsport and both entrance regressions. Geometry, browser evidence and limitations are recorded in `tools/MOTOR-RACE-QA.md`.

### 2026-10-24 — Recut the race from reference photographs

- Rebuilt Car Enthusiast as six hard-cut camera setups following the supplied low, wheel-level, inclined overhead, curbside and straightaway references. Added a built circuit, rounded black MINI / silver open Z4 models, color linework and a chequered gantry.
- Applied the requested Scenario Motion Loops skill to the actual Grid Tunnel and Warp Stars functions. Both passed its renderer's determinism and twelve-second seam checks. The edited homepage race plays once for twelve seconds and freezes.
- Extended the motorsport regression for exact cuts, shot coverage, both motifs, preferences and responsive projection. Source and browser evidence are recorded in `tools/MOTOR-RACE-QA.md`; homepage controls and other entrances are preserved.

### 2026-10-24 — Draw the Car Enthusiast racing entrance

- Replaced the oversized wheel montage with authored white-line MINI Cooper S F56 and open-top BMW Z4 E85 geometry on one circuit. The 8.8-second race exchanges the lead three times and moves through front-quarter, side, overhead and chase views, with a linked tachometer, circuit markers and a chequered finish flag.
- Preserved homepage typography, identity controls, measured text exclusion, neutral black background and the 380ms exit. Reduced motion shows the frozen finish; forced colors and hidden documents do not animate; the completed race releases its animation loop.
- Run `node tools/test-motor-race.mjs`, `node tools/test-home.mjs`, `node tools/test-home-state.mjs`, `node tools/test-photo-transition.mjs`, `node tools/test-game-transition.mjs` and `node tools/validate-site.mjs`. The new race regression also runs in Pages CI. Browser evidence and scope are recorded in `tools/MOTOR-RACE-QA.md`.

### 2026-10-21 — Disable the Cathedral background effects

- Restored the shared white Gallery background and header at the user's request. Removed all route-only light/glass markup, styles, scroll controller and generator dependencies; photographs and article content remain unchanged.
- Removed the now-unused effect implementation and its dedicated test/CI command. Git history retains the experiment. Use the existing Gallery route, document and layout checks plus site validation for this article. This supersedes the light/glass entries below.

### 2026-10-21 — Glass edges around Cathedral light beams

- Added generated SVG glass bevels aligned with every CSS-defined beam boundary, sharing the existing palettes and clipped wall/header backgrounds.
- `tools/cathedral-glass.mjs` owns the geometry; `node tools/render-gallery.mjs` synchronizes the page. `node tools/test-cathedral-light.mjs` now also checks complete rim coverage, finite geometry, SVG references and contrast with edge shading. Browser evidence and audit limits are in `tools/GALLERY-QA.md`.

### 2026-10-21 — Three coordinated Cathedral light palettes

- Reduced the route background to three CSS-owned color systems, added reversible native-scroll color transitions and a slight clipped background blur.
- `node tools/render-gallery.mjs` synchronizes the route markup/assets. Run `node tools/test-cathedral-light.mjs` for palette interpolation, contrast, scroll easing, preference fallbacks and lifecycle checks; this regression also runs in Pages CI. Browser evidence and audit limits are recorded in `tools/GALLERY-QA.md`.

### 2026-10-20 — Redraw the Multiverse illustrative fighters

- Replaced abstract character polygons with detailed, curved SVG ink illustrations, clearer anatomy/equipment and opaque front-to-back layering. The generator owns all four appearances; scroll drawing and existing battle choreography are preserved.
- Updated the design/source notes and versioned process assets. Original archive media, PDF and source copy remain unchanged.
- Verified renderer/source integrity, site validation, module syntax, desktop/phone browser regression and the scoped strict audit. See `tools/MASB-QA.md` for results and the unchanged repository-wide audit limitations.

### 2026-10-20 — Draw the Multiverse example with lines

- Corrected the opening directory to follow the actual experience, archive, guide and technical-document order.
- Replaced all game artwork in the scroll sequence with authored inline SVG characters and progressive stroke drawing. Original game media remain in the archive, while all existing exchanges and accessibility controls are retained.
- Run `node tools/render-masb.mjs`, `node tools/test-masb.mjs`, `node tools/validate-site.mjs` and the existing `tools/test-masb-browser.cjs` regression. Current verification evidence is recorded in `tools/MASB-QA.md`.

### 2026-10-20 — Expand the Multiverse encounter and connect the archive

- Expanded the character prompt and process explanations; added six narrated, selectable battle exchanges with scroll-controlled dash, guard, aerial, clash, damage and victory effects.
- Reorganized the original media into character creation, attributes/comic/result screens and exhibition use, leading into the preserved user guide and full technical document. Kept the original introduction in a native disclosure and all nineteen source media unchanged.
- Retained red/white/black, native scrolling, keyboard controls, reduced-motion/forced-color manual selection and no-JavaScript reading. Verification evidence and limitations are recorded in `tools/MASB-QA.md`; publication status is reported in the completing chat.

### 2026-10-20 — Illustrate the Multiverse game process

- Retained Multiverse's red/white/black identity while shortening its opening and adding a leading Describe/Generate/Battle/Result scroll sequence using existing character artwork. Sample input, stats, turn states and outcome are identified as illustrative.
- Added the supplied two-page user guide as a local original PDF with checksum/source archive and an explicit current-unavailability notice. Preserved the complete introduction, technical document, nineteen original assets and shared Projects navigation.
- `node tools/render-masb.mjs` generates the page and process data; `node tools/test-masb.mjs` verifies parity, the original guide and archive. Run `tools/test-masb-browser.cjs` for wheel/manual/keyboard progression, responsive scenes, guide access and image-viewer behavior. Detailed results are in `tools/MASB-QA.md`.

### 2026-10-20 — Make familiar routes musical

- Reframed World Sensing Music Station as a loop station and musical instrument whose repeatable routes become a place’s theme song. Added the user-selected prototype photograph and a reversible photo/model/room scroll transition.
- Rebuilt the room with a consistent projection, increased type and control sizes, and separated route, sound, layer and recording controls. The browser interpretation uses stable spatial notes, beat-aligned soft audio, eight-beat layer recording and route replay; original firmware remains unchanged.
- Rendered every page of the 13-page process PDF, with four-sheet desktop browsing and a keyboard/touch-accessible zoom viewer. Original files and new-image provenance remain local.
- Run `node tools/render-music-process.mjs`, `node tools/test-music-station.mjs`, `node tools/test-music-firmware.mjs` and `node tools/validate-site.mjs`; browser checks use `tools/test-music-browser.mjs` and `tools/test-music-sidebar.mjs`. Detailed results and limits are recorded in `tools/MUSIC-STATION-QA.md`.

### 2026-10-19 — Unify Projects navigation

- The directory and all four project landing pages share right-aligned VegShark.com, Projects and The Gallery links, reusing the Gallery's original Möbius wordmark asset.
- Follow-up: contain the complete logo vertically, measure equal gaps from its visible edge, and give Polaroid's navigation white artwork with soft shadows around its text and logo. The rejected rectangular backing is removed. Desktop, phone and landscape checks are recorded in `tools/PROJECT-HEADER-QA.md`.
- `tools/project-header.mjs` and `dist/project-header.css` own the shared component. After navigation changes run `node tools/render-project-headers.mjs`, `node tools/render-vr.mjs` and `node tools/render-masb.mjs`; keep all generated landing pages synchronized.
- Site validation checks the published link order and destinations across the directory's project routes. Browser and publication results are reported by the completing chat.

### 2026-10-19 — Expand meaningful VR interaction studies

- Removed the purposeless hero geometry; kept the compact title and assignment directory. Moved each interaction study before its project description and video.
- Replaced the small symbols with large explanatory SVG drawings: continuous jack/wrench/star-pattern/lift/rack actions, and a three-stage garage/store/garage loop with purchases, storage and tool reuse. Increased stage reading distance and eased diagram response without changing native scrolling.
- Verified desktop/phone wheel input, reverse progression, complete rack/storage states, long-lived keyboard selection, five responsive widths, reduced-motion/forced-color/no-JavaScript modes, original PDF responses and actual video playback. Source/render, site and route audit results are recorded in `tools/VR-QA.md`.

### 2026-10-19 — Tighten VR opening and connect studies to scrolling

- Reduced the VR cover to a compact two-line heading and smaller animated geometric mark, retaining its directory and bringing the first assignment into the opening viewport.
- Paired authored procedural/environment paragraphs with sticky SVG diagrams. Native scrolling selects and reverses states, fills progress and moves the spatial marker along its path; manual, keyboard, reduced-motion and no-JavaScript access remain available.
- Verified real wheel progression/reversal on desktop and phone, sticky placement, manual override, five viewport layouts, original PDF responses and actual playback of both videos. Source/render integrity, site validation and route strict audit pass; baseline ignored-archive audit findings remain documented in `tools/VR-QA.md`.

### 2026-10-19 — Add VR for Skill Learning collection

- Added the fourth Projects entry and a single modernist editorial parent page for Wheel Removal Training and Garage Ready, with two YouTube demonstrations and the original public PDF design documents.
- Archived the supplied brief, extracted source text and document checksums; concise modular assignment data and a deterministic renderer own the new route. Added small keyboard-operable procedure and spatial navigation diagrams, no-JavaScript notes, responsive media and motion/contrast fallbacks.
- Run `node tools/render-vr.mjs`, `node tools/test-vr.mjs` and `node tools/validate-site.mjs` for this route. The new source/asset integrity check also runs in Pages CI. Browser coverage and external playback limits are recorded in `tools/VR-QA.md`; commit/push/publication results are reported by the completing chat.

### 2026-10-15 — Fix Gallery media sizing and sync Rhythms

- Bound compact Photography images to their reserved frames without cropping; initialized Film embeds eagerly and retained their referrer policy and direct viewing links.
- Synced eleven current Rhythms of Chaos photographs and their latest Notion order, adding two local 1024px image renditions. Source snapshots, native asset mappings and generated pages are synchronized.
- Verified actual YouTube playback, desktop rail bounds and new-photo viewer navigation; Gallery regressions, site validation and the deployed-source strict audit pass. Browser coverage and source-resolution limitations are recorded in `tools/GALLERY-QA.md`.

### 2026-10-15 — Preserve original Darkroom carousels

- Restored Lightroom's four-photo comparison and Enlarger's two-photo comparison as carousels, matching their original Google Sites groups. Ordinary photo grids remain in their authored arrangements.
- Reused the Film carousel's buttons, keyboard access, native scrolling and original-image viewer; shared its CSS with photography routes. The chapter directory and sixteen Darkroom photographs remain intact.

### 2026-10-15 — Add chapter navigation and correct Film compositions

- Added a CMS-driven chapter directory and return links to Intro to Darkroom, sharing Deliberate Practice's behavior while retaining the original photograph sizing and order.
- Compared all five Film details with the live originals; restored their authored opening compositions, player dimensions, credit alignment and backstage carousel arrangement. Poster covers remain on project cards.
- Verified source-content preservation, directory targets, photograph order, carousel controls and desktop/mobile previews; added the layout regression check to Pages CI.

### 2026-10-15 — Recover missing Gallery carousel photographs

- Restored 13 Google Sites CSS carousel photographs to their original positions in Darkroom, Gorilla in the Studio and Rorschach’s Mask. Uploaded them as native Notion files and verified page readback before rebuilding the website.
- Preserved original JPEGs, optimized WebPs, source order, hashes and native asset identities; added an explicit carousel extraction tool and regression verification. All active Gallery projects now have their original photograph references resolved.
- Verified Gallery document/rendering tests, carousel recovery integrity and the site validator. Publication status is reported in the completing chat.

### 2026-10-14 — Remove The Life of a Poser (Skater)

- Confirmed the corresponding Notion page (`3f8abc37-a86f-81ee-b75f-f0687af09fbb`) is already deleted, then removed it from the active content snapshot and article layout configuration.
- Regenerated the Gallery index, article routes and related-project links: twelve CMS projects remain, with seven photography series and five films; the separate Stills exhibition brings the homepage total to thirteen.
- Kept original source/media archives for recovery. Gallery checks now follow active CMS routes and verify removed projects leave no public article or homepage entry.

### 2026-10-14 — Smooth the Gallery arrival

- Keep the finished Gallery preview visible through native page navigation, restore its real masthead and allow a final paint before the browser captures it.
- Share a short cross-document handoff between the homepage and Gallery index. Preserve the three-second architectural animation, native links/history, reduced-motion and forced-color fallbacks.
- Cover final-frame preservation, interrupted arrivals, a bounded paint watchdog and Back restoration in the existing transition suite. Publication status is reported after pushing.

### 2026-10-14 — Sync updated Rhythms of Chaos images and text

- Refreshed the live Notion content to nine photographs and “Street Photography with a 28mm Leica Q”; retained the number-only Index layout and the user's independent cover selection.
- Imported five new 2048px Notion image exports, retaining their native source identities and checksums. Existing source files remain archived.
- Validated current CMS image order, local assets and article text; removed the Index route's obsolete dependency on its original five-photo archive fixture.

### 2026-10-14 — Numbered Rhythms of Chaos image index

- Applied the Polaroid Index grid to the series' five photographs, preserving their order and full proportions, with number-only captions and viewer labels.
- Kept the project introduction, byline, original links and shared viewer. Added a route-specific stylesheet and generator variant; Notion source content and other pages remain intact.
- Passed site, Gallery and document checks, strict design audit, desktop/phone layout review and viewer navigation/focus checks.

### 2026-10-14 — Replace the Gallery header cornice

- Removed the rejected header cornice and its horizontal rules; added a small vaulted doorway beside the existing wordmark, echoing the approved footer drawing.
- Preserved the footer and project content, regenerated all fourteen Gallery pages and refreshed the stylesheet revision. The doorway is decorative and hidden below 1024px.
- Passed site, Gallery, Möbius and transition checks, strict design audit and responsive browser checks at 320px, 1024px and 1440px.

### 2026-10-14 — Quiet architectural frame for The Gallery

- Extended the museum entry's aesthetic with a fine header cornice and a small static exhibition-room drawing at the footer, shared across the Gallery homepage and articles.
- Regenerated the fourteen pages and local SVG; preserved the wordmark geometry, authored project content and natural photographs. Simplified the header accent on phones and hid decorative linework in forced colors.
- Passed site, Gallery content, Möbius and entry-transition checks, strict design audit, and desktop/390px/320px browser layout review.

### 2026-10-14 — Richer museum entry and restored photographic development

- Restored Photographer hover's original darkroom development timing and stagger; removed the two wall photographs from the clicked transition.
- Replaced the spare room with a spatial museum drawing: coffered dome and oculus, fluted colonnades, moulded arches, balconies and balustrades, glazed entrance, portal layers and inlaid floor. A forward camera movement adds pan, upward gaze, banking and depth-dependent parallax while retaining the three-second wordmark handoff.
- Updated geometry/lifecycle checks and recorded the user's simpler publish policy in AGENTS.md: publish, briefly confirm the live feature, then finish without extended deployment polling.

### 2026-10-14 — Architectural Photographer to Gallery transition

- Added a three-second entry sequence: Photographer viewfinder corners open into a line-drawn exhibition with an oculus, real photography prints and the existing Möbius outline, then dock the title and mark into the Gallery's measured masthead.
- Refined Photographer hover/focus with original-tone photographs, quiet corner marks and a Gallery label. Preserved native links and direct-navigation fallbacks, keyboard/touch entry, reduced motion, forced colors and Back restoration.
- Added deterministic geometry/lifecycle and homepage state checks. Browser verification, static audit, commit, synchronization and publication results are recorded in `tools/PHOTO-TRANSITION-QA.md` and the task completion report.

### 2026-10-14 — Restore original Film index covers

- Restored the original title-bearing covers for Cursed Stage 戏怨, Gorilla in the Studio, The Common Things and Rorschach’s Mask. Morning Unwoken already matches the original Film index and retains its forest cover.
- Reused archived original/WebP assets and their existing native Notion uploads. Updated Notion Cover image, legacy Cover and page banner; read back selections and confirmed all affected page bodies remain unchanged before exporting.
- Regenerated the Gallery homepage, article covers and related-project cards. Verification and publication status are recorded in the task completion report.

### 2026-10-14 — Compact Gallery index and outline wordmark

- Reduced the four right-hand Photography entries to fit a desktop viewport while retaining the left-hand composition and uncropped image ratios.
- Replaced the active WebGL wordmark with a static, unfilled SVG contour drawing. Kept the earlier filled asset and model modules archived; Gallery no longer imports the 3D runtime.
- Updated shared Gallery navigation/footer branding to VegShark.com and ordered category navigation Photography / Stills / Film.
- Verified Gallery/document/outline tests, site integrity, syntax, desktop/phone browser layouts and strict design audit. Commit, remote synchronization and Pages status are reported after publication.

### 2026-10-14 — Gallery reading, portrait scale and solid wordmark

- Replaced the former header arrow and thin projected band with a rounded, thick WebGL Möbius solid, using shared geometry for its static fallback. Retained the native home link and existing Gallery art direction.
- Preserved the completed Notion-driven Chinese/English reading switch for Analog & Digital. Increased that article's portrait prints and Deliberate Practice's cover/portrait sections while retaining original ratios and authored groups.
- Removed Deliberate Practice chapter parentheses and linked every heading back to its contents. Updated Morning Unwoken to its third photograph in Notion and the generated homepage; synchronized private layout notes and verified exports.
- Verified Gallery/source-content tests, solid geometry, site integrity, JavaScript syntax, strict design audit, and real desktop/mobile browser behavior. Deployment status is recorded in the task completion report.

### 2026-10-12 — Correct Stills image classification

- Applied the user's clarification: every current Stills image is a game screenshot; concept photography will be supplied separately.
- Corrected all twenty media labels, the current page introduction, metadata, original-image wording and the project-room Stills caption. The renderer now derives its category description from the actual collection.
- Preserved image files, order, dimensions and viewing modes. Verified generated labels, original links and existing site/project integrity checks.

### 2026-10-12 — Apply the SSENSE photography guide to Stills

- Applied the user-selected `style/ssense-photography-style-guide.md`: pure white, neutral ink, Helvetica navigation/headlines, an editorial serif introduction and readable 12–13px captions.
- Replaced decorative print borders, shadows, fading and hover motion with original-tone photographs. The catalog now uses uncropped 3:4 contain slots, four/three/two responsive columns and shared image/title links.
- Retained the explicitly specified 3D spiral while removing roll, angular drift and camera inertia; shortened the continuous mode change to 240ms and simplified focused viewing.
- Verified responsive columns, caption geometry, keyboard/modal behavior, reduced motion, stationary hover, touch targets, simulated 200% zoom, forced colors and image fallbacks, plus existing site/project validation. See `tools/STILLS-QA.md`.
- Prepared locally for review; no remote publication was requested.

### 2026-10-12 — Stills photographic exhibition

- Replaced the Stills placeholders with twenty images from the local Polaroid archive, using uncropped optimized display copies and direct full-resolution originals.
- Added a genuine CSS 3D vertical helix, native scroll camera movement, continuous rearrangement into an asymmetric gallery, and a shared accessible focused viewer.
- Added an editable collection manifest, deterministic page/asset preparation tools, responsive and reduced-motion behavior, offline/no-JavaScript fallbacks, and image-load recovery.
- Verified spatial geometry and original ratios across seven viewport shapes; Chrome desktop/mobile/landscape interaction and visual checks; source/document validation; original room checksum; strict design audit. Details are in `tools/STILLS-QA.md`.
- Prepared locally for review; no remote publication was requested.

### 2026-10-09 — Preserve the 404 hero when clearing

- Removed the detached arrow from Back to Home.
- Clear now preserves the original 404 sign's current position and orientation, removing only other props with a quick procedural cloud puff and fade.
- Added bounded cloud/resource cleanup, safe repeated Clear/Add, hidden/fallback cleanup and immediate removal under reduced motion.
- Verified Chrome desktop/mobile Clear, exact hero-pose retention, cloud lifecycle, rapid actions and the existing interaction suite. Prepared locally for review.

### 2026-10-09 — Lively 404 motion and orange roadblocks

- Added spring dragging, release inertia, mass-dependent collision impulses, glancing rotation and small wall rebounds over the existing transactional contact solver. Damping settles motion without jitter; Clear restores the lone hero too.
- Made all cones, striped barriers and warning posts orange, removing the yellow-cone variant. Retained folding-sign finishes, all model geometry, room, lighting and camera.
- Replaced Move/Shuffle and the movement toolbar with a native Add button; preserved Clear, Home and keyboard movement/rotation.
- Verified mouse/touch gestures, release glide and exact rest, chain momentum, dense contact stability, reduced motion, responsive targets and navigation/fallbacks. See `design-qa.md` and `tools/404-source/fluid-preservation.json`.
- Prepared locally for review; no remote publication was requested.

### 2026-10-09 — Preserve-model 404 interaction refinement

- Followed the latest archived brief: preserved every existing prop builder/material, floor, walls, trim, lighting and camera; removed the sink and updated only sign copy.
- Refined UI alone with Archivo and square paper/ink footer actions; removed the global Add control and used prop click/tap to spawn exactly one object. Kept accessible keyboard equivalents and an explicitly opened movement toolbar.
- Added smooth mouse-wheel rotation during dragging, click/drag/cancellation discrimination, and transactional contact pushing with stable chain displacement and wall/boundary rollback.
- Verified exact model/room preservation, Chrome mouse/touch/keyboard interactions, real prop-to-prop displacement, dense placement/Shuffle/Clear, responsive controls and error/navigation fallbacks. Spatial tests include 350 dense pushes and pinned-chain cases. See `design-qa.md`.
- Prepared locally for review; no remote publication was requested.

### 2026-10-09 — Interactive maintenance 404

- Implemented the supplied photographic 3D maintenance brief with a tiled room, worn folding 404 sign and multiple draggable prop types.
- Added floor raycasts, collision-aware placement/dragging, Shuffle/Clear, touch/keyboard controls and no-JavaScript/WebGL fallbacks.
- Archived the user's brief/photo, generated material originals and prompts; vendored Three.js and Anton with their licenses. Runtime material textures total 763,372 bytes.
- Verified real Chrome desktop/mobile states, touch events, dense layouts, shuffle collision sampling, navigation, reduced motion and fallbacks. Source/packaging validation and 1,000 randomized collision drags pass. See `design-qa.md`.
- This update is prepared locally; no remote publication was performed.

### 2026-10-05 — Multiverse All-Star Battlefront

- Added the project to Projects with a Swiss poster layout based on the supplied typography, color and grid references.
- Archived the original Google Sites page, embedded technical document, all six characters, ten exhibition photographs and three system diagrams. The complete source copy and individual contributions are rendered inline.
- Added native image previews, responsive reading navigation, lossless display copies, repeatable import/render tooling and source-integrity checks in Pages CI.
- Verified source order, image hashes and decoded display pixels, desktop and two phone widths, dialog keyboard/focus behavior, project navigation, existing site/project checks and the strict static audit. See `tools/MASB-QA.md` for evidence and tooling limitations. This update is prepared locally.

### 2026-10-01 — Move the music station through space

- Hid loose power leads and increased the model's cardboard thickness, translucent strip height, perspective and shadows.
- Connected the scrolling hero to a smaller draggable station in a schematic isometric room. A wall-distance ray and outgoing/returning ultrasound make sensing visible; drag, cursor following, touch, arrow keys and the slider share one projection.
- Added direct live audition using source-mode pitches and a waveform sampled from actual audio output. Sound defaults on, resumes on ordinary interaction when autoplay is blocked, and uses a speaker icon for persistent mute.
- Verified real non-silent audio under strict browser autoplay restrictions, note changes with distance, mute behavior, desktop/mobile interaction, reduced motion, source rules, original files and existing portfolio checks.

### 2026-10-01 — Compact music station and firmware alignment

- Condensed the project page into one interactive instrument, optional technical disclosure, two photographs, four original sketch sheets and essential downloads. At 1440×900, default page height fell from 15,932 to 3,998 pixels and visible main copy from 708 to 207 words.
- Archived the supplied Control.ino and Display.ino unchanged with source hashes. Ported actual sensing, empty-loop startup, recording controls, mode preservation, clock, audio frequencies, swing, 30-LED allocation and matrix font/command behavior.
- Compared 1,085 cases against extracted original C++ functions. Verified desktop and four responsive layouts, reduced-motion idle/record timing, original files, downloads, video loading and existing portfolio routes.

### 2026-10-01 — World Sensing Music Station

- Added the portfolio project route and Projects entrance, preserving the existing home and Polaroid surfaces.
- Built a source-grounded SVG instrument reconstruction with pointer/touch sensing, three deterministic eight-step loops, replace-one-layer recording, musical modes, optional sound and reduced-motion behavior.
- Archived the five original photographs and all supplied project files. Added original PDF sketch sheets, an editorial prototype sequence, a click-to-load demonstration video and real downloads.
- Added source hashes, reconstruction/asset tools, engine regression tests, browser verification and `tools/MUSIC-STATION-QA.md`. Pages CI now validates the new music engine before deployment.
- Verified existing site, home and project-room checks, original-source integrity, desktop/phone browser states and the strict design audit.

### 2026-09-22

- Added the operations standard for 存档, summary, validation, commit, upload, and deployment confirmation.
- Added automated GitHub Pages deployment from `dist/` on pushes to `master`.
- Published the complete current repository state, including existing site, source, assets, and tooling.
