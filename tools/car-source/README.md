# E85 × F55 — a garage daydream

Updated 2026-10-17 for the owner's homepage Car Enthusiast preview.

The maintained runtime is `dist/home-motorsport.mjs`; no document generator owns
this file. Hover/focus previews, click/tap pins, Escape/outside click dismisses.
The 14-second film plays once and stops all animation frames at its final garage
composition. Re-entering restarts it. Reduced motion goes directly to that still.
Every drawing is clipped away from the homepage's measured sentence band.

| Seconds | Scene | Material |
| --- | --- | --- |
| 0–1.7 | Key in, world out | E85, night photograph, tachometer, starting lamps, H pattern |
| 1.7–4.1 | Small car, big stage | F55, moving chequers, manual shift drops, dot-matrix gear, 95 lightning |
| 4.1–6.6 | Soul on fire | E85, procedural flames, violet/green field geometry |
| 6.6–8.9 | Wrong turn, right tree | F55 parked in a growing tree, owner's tree photograph |
| 8.9–11.8 | No road required | Both cars orbit a red/yellow geometric planet |
| 11.8–14 | Two cars, one daydream | Both cars return among the owner's city/night/garage photographs |

References are translated into original graphics: EVA's field framing and violet/
green, Lightning McQueen's 95 and lightning wink, Bauhaus primary geometry,
Nothing's dotted digits, and teenage engineering's compact mechanical notation.
These are aesthetic references, without external fonts, film clips or music.
The MINI remains a Cooper S F55, rather than being relabeled a JCW.

`assets.json` records original names, original SHA-256, optimized SHA-256 and bytes.
The four photographs are the owner's supplied 111, 120, 119 and 118 JPEGs from
`C:/Users/15811/Downloads/cars`. Their complete compositions and ratios are retained
as local 1280px WebP renditions. The existing portrait and exhibition files are untouched.

`vehicle-atlas.png` archives the original transparent **built-in ImageGen** result.
Its identity references were 111 (silver open E85) and 120 (black five-door F55).
Generated profiles preserve the visual identity; they are illustrations, not
untouched photographs. The transparent row cells are extracted and optimized by
`prepare-assets.cjs`. Runtime media totals about 737 KiB and loads on first entry;
failed images use procedural vehicle silhouettes with the rest of the animation.

Rebuild with Node + sharp available (set `NODE_PATH` or `SHARP_MODULE` as needed):

```text
node tools/car-source/prepare-assets.cjs
node tools/test-home.mjs
node tools/test-home-state.mjs
node tools/validate-site.mjs
```

`CAR_PHOTO_DIRECTORY` overrides the owner's original photograph directory.
`CAR_SPRITE_ATLAS` overrides the archived atlas. No credentials are needed.
Browser QA uses existing Playwright and Chrome; set `CAR_QA_OUTPUT` to an absolute
screenshot directory. It starts and closes its own local static server.

```text
node tools/car-source/browser-qa.cjs
python tools/car-source/audit-published.py <frontend-design-premium>/scripts/audit_project.py
```

The static auditor ignores dist and .mjs by default, and scanning the whole repo
also reports inert downloaded Google Sites HTML under ignored QA/source folders.
`audit-published.py` instead scans exact homepage copies with .js extensions in a
temporary directory; its evidence records the hashes and scope explicitly.

## Final generation prompt

Create a production sprite atlas for a surreal automotive motion collage website,
using the two input photographs as VEHICLE IDENTITY REFERENCES only. Fully
TRANSPARENT background, no environment, no floor, no drop shadows, no typography.
Exactly TWO isolated photorealistic cars in a wide landscape canvas arranged in
TWO ROWS, with a large clear transparent gutter between rows. Both cars face RIGHT
in exact clean SIDE ELEVATION, entire cars and all wheels fully visible with
margins. TOP HALF: the owner's metallic silver/gray BMW Z4 E85 first generation
roadster, roof fully open, tan interior, distinctive long low hood, compact rear,
original silver multi-spoke wheels, no driver. BOTTOM HALF: the owner's black MINI
Cooper S F55 FIVE DOOR hatchback, glossy black body AND black roof, red wing mirrors,
large plain WHITE CIRCULAR RALLY ROUNDEL on front door, original silver multi-spoke
wheels, no roof box, no driver. These details must match the photographed cars, do
not turn MINI into a three door car, do not change BMW generation. Each car spans
approximately 88 percent of canvas width, horizontally centered. Top car centered
at y=25% and bottom at y=75%. Crisp realistic studio highlights, enough brightness
to read the black MINI on a black website, sharp alpha silhouette, natural premium
automotive collage cutout quality. No fire, no stars, no extra parts or cars.
Deliver one transparent sprite sheet.
