# Interactive 404 design QA

Verified 2026-10-09. final result: passed

## Source and comparison evidence

Visual truth: `tools/404-source/reference.jpg` and the supplied complete specification in `brief.md`. The brief requires an interactive, perspective-correct maintenance scene and changes the sign copy to 404 / SITE UNDER / CONSTRUCTION. The photograph supplies the material, atmosphere and perspective reference.

Source stored pixels: 4032×3024, EXIF-oriented 3024×4032. Full-view comparison normalizes the oriented source to 768×1024, preserving 3:4. Implementation: 768×1024 CSS viewport, deviceScaleFactor 1, resting initial sign, local `/404.html`. No browser chrome or device frame is included. Focused crops preserve their aspect ratios.

Evidence directory: `C:/Users/15811/.codex/visualizations/2026/10/09/01a12109-d49f-7861-b561-b7cc77e8cf2a/`.

- `construction-comparison.png`: source and browser render in the same comparison input.
- `construction-sign-comparison.png`: exterior lettering, handle opening, panel thickness, triangular opening, wear and floor contact.
- `construction-desktop-final.png`: 1440×1000 initial state.
- `construction-dense.png`: many collision-separated props.
- `construction-390x844.png`, `construction-320x568.png`, `construction-700x390.png`: responsive states.
- `construction-touch-selected.png`: native touch drag and contextual positioning controls.
- `construction-forced-colors.png`: system colors and focused controls.

## Findings and iteration history

1. Initial 3D pass: [P2] camera too wide; [P2] coarse repeated ceramic marks; [P2] inward faces showed reversed printed text. Moved the camera closer, replaced procedural albedo with generated photographic material maps, normalized tile UVs, and assigned lettering only to exterior face groups. The latest full-view and sign comparisons confirm the fixes.
2. Material/perspective pass: [P2] plastic too bright and the floor direction opposed the reference. Reduced exposure/fill lighting, turned the camera to align the receding rows and wall base with the photograph, and adjusted the sign orientation to reveal its left triangular opening. Added collision boundaries for the visible wall column. Repeated the browser and collision checks.
3. Responsive pass: [P2] a 420px minimum scene height could put Home below a 390px landscape viewport. Lowered the minimum to 320px, allowed controls to wrap, and added explicit browser assertions that persistent actions fit vertically as well as horizontally. All requested viewports now pass.

No actionable P0/P1/P2 findings remain. The room is an original real-time 3D environment implementing the supplied brief; fixtures and layout are reconstructed, and the source photo's exact camera capture and cleaning text are intentionally not reproduced pixel-for-pixel.

## Required fidelity surfaces

- **Typography:** local Anton supplies heavy condensed industrial lettering baked into the sign surface texture. The exact three requested lines remain readable under perspective. Ordinary UI uses restrained 11px Helvetica Neue / Arial; wrapping and native keyboard controls remain usable on phones.
- **Spacing/layout:** the scene fills the viewport, the main sign stands near its center, square tiles recede in one world coordinate system, and native links/actions occupy the edges. The contextual object controls appear on selection. No landing-page sections or decorative cards were introduced.
- **Colors:** warm, dim olive plaster, dirty off-white/dark ceramic and worn ochre plastic follow the photo. Physical lighting, room reflections, ceramic bump, soft shadow sampling and local contact shadows supply depth. UI/focus tokens are documented in DESIGN.md.
- **Image/material quality:** generated albedo textures contain fine ceramic grain and plastic wear. WebP copies retain 1254×1254 resolution; original PNGs and exact prompts are archived. The floor, handle cutout, panel thickness, cones, barriers and warning markers are actual 3D meshes. The photograph is not a background.
- **Copy/content:** primary exterior print is exactly 404 / SITE UNDER / CONSTRUCTION. The small unavailable-area caption, Add Objects, Shuffle, Clear and Back to Home match the supplied brief. Secondary props have real caution/maintenance wording. No added portfolio story or slogans.

## Functional and engineering verification

The final browser run used Chrome because the in-app browser runtime exited before initialization. It passed with zero console/page errors. The nested missing-path test expects the legitimate HTTP 404 document response.

- Raycast mouse drag and native CDP touch events change floor coordinates while keeping objects upright.
- Arrow keys, R, native object selection and directional/rotation buttons provide non-drag alternatives.
- Final portable browser test placed 26 objects including all eight categories, within the forty-object cap. Placement counts vary with random prop footprints. No prop intersections occurred during drag or forty samples of animated Shuffle.
- Shuffle preserves the main sign; Clear removes secondary meshes/textures and restores its exact starting position/orientation. Correct disabled states follow an empty secondary collection.
- Resting desktop, 768×1024, 390×844, 320×568 and 700×390 layouts: no horizontal overflow, persistent controls within the visible viewport, at least 44px action height.
- Reduced motion skips entrance/drop animation and maintains collision-safe shuffle; forced colors keeps controls operable.
- Root-relative imports/assets load under a nested missing path. Home navigation works. No-JavaScript and unavailable-WebGL fallbacks expose the correct error message and a real Home link.
- `node tools/validate-site.mjs`, `node tools/test-construction-space.mjs`, scene/addon syntax checks, and `git diff --check` pass.
- Strict premium audit: zero findings, saved in `tools/404-source/audit.json`. Its exclusion of `dist/` is explicitly accounted for by browser QA.
- No framework build, TypeScript typecheck or formatter is configured for this static repository. The implementation uses maintained static modules with locally vendored Three.js.

## Follow-up polish and test limits

- [P3] The reconstructed fixtures and surface lighting remain more regular than the original photograph. Further photographic detail can be refined without changing the working spatial system.
- Touch coverage uses Chrome device emulation with native touch events; physical iOS/Safari GPU performance has not been measured.
- No deployment was requested or verified. The local preview is kept running.

## Implementation checklist

- Supplied design implemented; discarded serif 404 page and CSS removed.
- Original brief/photo and generated material originals preserved.
- Dependency/font licenses included; runtime assets served locally.
- Collision regression included in Pages CI; packaging checks added to site validation.
- Full and focused visual comparisons inspected after fixes; primary interactions and fallbacks verified.
