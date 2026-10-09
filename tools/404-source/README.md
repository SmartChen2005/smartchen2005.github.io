# Interactive 404 sources and verification

User brief and photograph supplied on 2026-10-09. Both are preserved unchanged:

- `brief.md`: SHA-256 `b0162d01000ec992e4568d768d095761ae24d7e5f62e92813704e5fe9716eef7`.
- `reference.jpg`: SHA-256 `740d86351b47af3bd73af8eeae421c08296b7c247d6a72c6a726ed5073811671`. Stored pixels 4032×3024; EXIF-oriented view 3024×4032. This is a visual/material reference, never the runtime scene background.

Three.js r180 / npm 0.180.0 is vendored in `dist/vendor/three/`. Source: https://github.com/mrdoob/three.js/tree/r180. MIT license is included. `RoomEnvironment.mjs` has one integration change: its bare `three` import points to the adjacent local module. Anton is from https://github.com/google/fonts/tree/main/ofl/anton, with its SIL OFL license in `dist/assets/fonts/Anton-OFL.txt`.

## Preserve-objects revision (2026-10-09)

The previous user brief is archived unchanged in `revision-preserve-objects.md`, SHA-256 `70133c891468a37c9ad75c828cb50193c293df0ade2890493b0dc68cbdf9070d`. It requires preserving the restored scene and every prop model/material, removing only the sink, updating sign copy, refining UI alone, clicking props to spawn one object, wheel rotation while dragging, and stable object pushing.

`model-preservation.json` records a direct source comparison: all prop model/material builders and the original camera remain identical; the entire room builder differs only by removing its sink call. Existing triangles, wear, cones, reflective bands, striped barriers, tiles, walls, skirting and lighting remain unchanged. Only sign text is revised. Raw restored source and screenshots are in the ignored `tools/construction-qa/` output folder; Git history retains the original implementation.

UI alone uses Archivo by Omnibus-Type from the official https://github.com/google/fonts/tree/main/ofl/archivo directory. `dist/assets/fonts/archivo-variable.ttf`: 658,596 bytes, SHA-256 `0e094a7d3c7c4c25cf1310c4b30014f1dae9332220b1c2c88f4fa996f0b05053`; SIL OFL in `Archivo-OFL.txt`. Anton remains the physical sign font. No new generated materials or 3D models were introduced.

`preserve-comparison.webp` combines matching before/after desktop captures. `qa-original.md` preserves initial QA and `qa-preserved-motion.md` preserves this previous revision's report. At that stage the physics used transactional displacement with no inertia. Project-root `design-qa.md` owns current verification.

## Fluid motion and orange roadblocks (2026-10-09)

The motion follow-up is archived verbatim in `revision-fluid-motion.md`. It authorizes lively drag/collision interactions, orange roadblocks, removal of Shuffle/Move and a native Add button. Cone plastic, striped barrier rails and warning posts now use `#cf752b`; the yellow-cone variant is removed. Folding signs retain their existing finish. No new assets or dependencies are introduced.

The existing safe swept solver supports fixed 120 Hz damped spring dragging, release glide, mass-dependent contact impulses, glancing rotation and restrained wall rebounds. Only successful positional sweeps transmit contact impulses; failed chains retain their prior positions. Damping settles exact rest. Reduced motion uses direct collision-safe dragging without glide. The subsequent Clear request below supersedes this revision's original hero-reset behavior.

`fluid-preservation.json` compares against the committed scene before this follow-up: model builders normalize only the explicitly authorized color substitutions and removed cone color argument; room, camera and other builders compare exactly. `fluid-comparison.webp` pairs the prior preserved-scene capture with the motion revision's resting scene, before Home-arrow removal. Dense and phone captures were also visually reviewed. `design-qa.md` records the final evidence and limitations.

## Clear cloud puffs (2026-10-09)

The latest follow-up, `revision-clear-puff.md`, removes the Home arrow and changes Clear to retain the hero's current position/angle. Other props disappear behind a procedural warm off-white cloud puff, which blooms and fades over 720 ms. The shared cloud map is generated in code; individual sprite materials are disposed after completion. Repeated Clear and hidden/fallback states release pending effects; reduced motion removes props immediately. Browser tests cover preserved hero pose, smoke cleanup, rapid Clear/Add and native touch Clear. `clear-preview.webp` archives a desktop effect capture; `design-qa.md` owns current verification.

## Generated material assets

Generated with the built-in ImageGen tool and visually inspected. Both are 1254×1254 PNG originals retained in `materials/`. `tools/prepare-construction-assets.py` creates quality-92 WebP runtime maps at their original dimensions, 462,548 and 300,824 bytes. No scene images or sprites replace the 3D geometry.

`materials/ceramic-albedo.png`: SHA-256 `3662e3349e8dba7e38caec24400c208295d1ce04d18064de327c6f51356f675e`.

Exact generation prompt:

```text
Use case: photorealistic-natural
Asset type: seamless repeating square PBR ceramic albedo texture for individual floor tile meshes in a 3D maintenance room.
Primary request: generate exactly one square 1024x1024 texture of a single aged glazed ceramic tile surface, filling the entire frame, flat orthographic view. Neutral light gray/off-white surface with extremely subtle fine ceramic grain, sparse tiny dark pores, microscopic scuffs and faint age wear. The attached room photo is material inspiration only; do not reproduce the scene.
Composition: texture swatch without visible boundaries, seamlessly tileable on every edge, homogeneous detail distribution.
Lighting: pure diffuse albedo, evenly flat exposure across the whole image.
Constraints: no grout, no tile grid, no borders or visible tile edges, no perspective, no lighting gradients, no vignette, no shadows, no specular highlights baked in, no objects, no text, no watermark. Keep details low contrast and restrained.
```

`materials/yellow-plastic.png`: SHA-256 `71f2d9958d4b292c90e11187e03a7e662bf110451e17254626819f8534aae029`.

Exact generation prompt:

```text
Use case: photorealistic-natural
Asset type: seamless square worn polypropylene plastic albedo for a 3D industrial folding caution sign. Generate one approximately 1024x1024 image.
Subject: one continuous industrial yellow plastic surface filling the entire image; ochre yellow near #c39b1b, matching an old yellow cleaning caution sign. Subtle cleaning scuffs, uneven ingrained dirt, fine scratches and small abrasion marks. Restrained realistic wear, yellow base still clearly dominant.
Composition: flat orthographic material swatch, seamless tileable edges, no visible object boundaries. Pure albedo evenly exposed everywhere.
Constraints: no lettering or symbols, no handle, no edges or borders, no objects, no perspective, no tile/grid pattern, no lighting gradients, no highlights or shadows baked in, no watermark.
```

## Repeatable checks

- `node tools/validate-site.mjs`: source/document integrity and all 404 packaging dependencies.
- `node tools/test-construction-space.mjs`: original placement/sweep/chain checks plus spring following, release glide, momentum transfer, glancing yaw, soft wall rebound, exact rest and 38 dynamic props over 1,600 fixed steps. Included in Pages CI.
- `node --check dist/construction.mjs`: scene syntax.
- `node tools/test-construction-browser.cjs`: requires Playwright with Chrome and a static preview server serving `dist/`, returning `404.html` for missing requests. Defaults to port 4173. `PLAYWRIGHT_MODULE`, `CONSTRUCTION_PREVIEW_URL` and `CONSTRUCTION_QA_DIR` can override tooling, origin and screenshot directory.
- `audit.json`: strict static audit, zero findings. The auditor excludes deployed `dist/`; browser checks own runtime verification.
- Project-root `design-qa.md`: side-by-side source/render review, iteration history, final interaction checks and limitations.

The implementation is prepared locally. No remote publish or deployment check was performed.
