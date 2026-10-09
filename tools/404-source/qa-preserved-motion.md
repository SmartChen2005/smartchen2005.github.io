# Interactive 404 — preserved-scene refinement QA

Verified 2026-10-09. final result: passed

## Authoritative brief and preservation

The complete latest request is archived unchanged as `tools/404-source/revision-preserve-objects.md`. It requires keeping the restored room and all prop forms/materials, removing the sink, updating only prop wording, applying modernist treatment only to UI, clicking existing props to spawn one object, wheel rotation during dragging, and stable physical pushing.

The restored source was captured before edits. Direct comparison confirms that `roundedRect`, `bevelBox`, `signGeometry`, `aFrame`, `cone`, `barrier`, `marker` and `resize` are identical. The entire `buildRoom` function is identical after removing its sink call. This includes every floor tile, wall, skirting tile, material, bump/albedo setup, light, shadow configuration, camera and responsive framing. `buildSink` and its collision obstacle are completely removed. The report and matching function hashes are archived in `tools/404-source/model-preservation.json`.

Sign wear, original Anton type, warning triangles, centered layouts, panel/hinge/handle/brace geometry, original orange/yellow cones and reflector stripes, silver/striped barriers and triangle post markers remain intact. Only sign copy changes: NO CONTENT, CONTENT MISSING, 404 / UNDER / MAINTENANCE, and small unavailable-area text on the existing hero.

## Visual evidence

`tools/404-source/preserve-comparison.webp` combines the restored before capture and the revised browser capture in one review image. Both use 1440×1000 CSS viewports, scale factor 1, uniformly resized to 936×650 with no browser frame. The same floor, room, lighting, sign and camera remain clearly visible. The changes are sink removal, text and interface treatment. The original photograph and original QA remain archived in `reference.jpg` and `qa-original.md`.

Repeatable browser screenshots are in the ignored `tools/construction-qa/` folder:

- `construction-desktop-final.png`: resting initial scene, original worn hero and refined footer.
- `construction-pushed.png`: a spawned prop has physically displaced the hero through a real mouse drag.
- `construction-dense.png`: forty original-family props without intersections.
- `construction-reference-size.png`: 768×1024 framing.
- `construction-390x844.png`, `construction-320x568.png`, `construction-700x390.png`: preserved responsive camera and reachable controls.
- `construction-touch-selected.png`: touch-dragged original sign, original orange cone and explicitly opened movement toolbar.
- `construction-forced-colors.png`: system colors and operable native controls.

## Findings and polish

1. [P2, fixed] Every object click must add exactly one, while release after dragging/rotation/cancellation must not add. Mouse/touch thresholds distinguish the gestures; spawning occurs on qualifying pointer-up, so touch does not depend on a compatibility click. Enter/Space provides equivalent access and key auto-repeat does not produce a burst. If a chosen type cannot fit, the other original types are tried; no valid position means a full-floor message and no overlap.
2. [P2, fixed] Contact must displace nearby props rather than only blocking the driver. Swept transactional contact propagation pushes neighbouring objects and chains; blocked substeps roll back every affected body. Tangential motion can slide along walls. Pushed props cancel their previous animations, remain upright/grounded, and have no residual velocity to jitter at rest.
3. [P2, fixed] Moving after a wheel input initially cancelled the driver's easing target. Movement now preserves that rotation target while cancelling unrelated pushed-object animations. Wheel delta modes are normalized, each impulse is bounded, and browser zoom shortcuts retain their behavior.
4. [P3, fixed] A prior keyboard outline could remain during mouse interaction. Keyboard-only focus state now gives clear keyboard feedback and removes the outline on pointer interaction. Selecting a falling prop immediately synchronizes its grounded mesh/contact shadow.

No actionable P0/P1/P2 findings remain. Bauhaus/Swiss influence is limited to Archivo UI, square paper/ink buttons, spacing and alignment; none of it changes the 3D object family or environment.

## Functional verification

Chrome/Playwright is used because the in-app browser trusted runtime failed in this session's earlier work. The final browser run passed with zero console/page errors, excluding expected HTTP 404 responses at the missing-path check.

- Slight pointer jitter still counts as a click and adds exactly one without moving the clicked object. Dragging, wheel rotation and Escape cancellation do not spawn. Tapping after a native touch drag adds one.
- A real mouse drag of a spawned prop toward the hero moves the hero by physical contact; all affected objects stay grounded and separated. Read-only projection/picking diagnostics permit repeatable pointer gestures without mutating scene state.
- Wheel input while dragging eases smoothly around the vertical axis; continuing to move preserves the rotation target. Wheel input outside a drag does not rotate objects.
- Enter/Space spawning, arrow-key pushing, R rotation, bracket cycling and the explicitly opened directional/rotation toolbar preserve non-drag access. Escape closes the toolbar and restores Move focus. No standalone Add button or physical plus object exists.
- The final deterministic dense run reaches forty objects and all eight original categories. Every footprint stays inside bounds and clear of other props and the architectural column.
- Forty samples of animated Shuffle retain pairwise/column separation and preserve the hero. Clear removes secondary props and restores its original position and orientation. Correct disabled states follow.
- 1440×1000, 768×1024, 390×844, 320×568 and 700×390 layouts have no horizontal overflow, with persistent action targets at least 44×44px and inside the viewport.
- Reduced motion skips drops and retains collision-safe shuffle. Forced colors retains native actions. Root-relative dependencies work at nested missing paths; Home navigation, no-JavaScript and unavailable-WebGL fallbacks work.

`node tools/test-construction-space.mjs` passes: 38 initial footprints, 1,000 long swept moves, 350 dense randomized pushes, a four-object chain, wall-pinned rollback, column exclusion, tangential wall sliding and impossible placement. The conservative original footprints and all-angle volume remain unchanged. The new solver is quasi-static floor displacement rather than a free inertial simulation.

Other checks: `node tools/validate-site.mjs`, `node --check dist/construction.mjs`, `node --check dist/construction-space.mjs`, `git diff --check`, and the strict premium audit saved in `tools/404-source/audit.json`. The audit excludes `dist/`, so runtime browser evidence remains essential. No framework build, TypeScript typecheck or formatter is configured in this static repository.

## Limits

Touch coverage uses Chrome emulation with native events; physical iOS/Safari GPU behavior was not measured. Sign fine print remains small at a distance, preserving the physical-sign appearance. No remote deployment was requested or verified; the local preview remains running.
