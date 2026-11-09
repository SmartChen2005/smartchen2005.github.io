# Halftone Bloom

An independent, unlisted motion study at `/projects/figures-of-speech/halftone-bloom/`.
The Figures of Speech catalogue, numbering, chronology and preserved editions do not include this experiment.

## Five additional studies (2026-11-09)

`studies/` is the unlisted collection, linked only from the original Bloom page. Each case has its own independent URL: `exposure/`, `lunar/`, `botanical/`, `shoal/` and `tide/`. The main Figures of Speech catalogue remains unchanged.

- **Exposure:** square pixels follow staggered, grid-snapped curved paths into the complete existing self-portrait. The original `dist/assets/selfportrait-light.webp` is reused without modification, cropping or a new image dependency.
- **Lunar:** cached procedural crater relief and maria respond to changing illumination; a shadow crosses the sphere before a near-full final moon. This is an artistic phase study, not an astronomical ephemeris.
- **Botanical:** layered curved petals open from a bud, with veins, curled edges, stamens, leaves and a stem.
- **Shoal:** individually modeled small fish follow curved swimming paths into a larger fish silhouette with a negative-space eye.
- **Tide:** a shaded engraved wave rises, curls, sheds ballistic spray and settles into a lower crest.

`sources/*.mjs` own each deterministic scene and metadata. `halftone.mjs` samples those grayscale scenes onto a fixed white square grid; `studies.mjs` owns playback, replay/R, pause, native keyboard/scrub timeline, density/speed, image retry and lifecycle. `studies.css` extends the original monochrome material without changing the original animation. Reduced motion shows a poster with manual timeline access. Hidden/page exit interrupts playback; returning does not autoplay. Completion and paused states request no frames. Grid work is capped at 110,000 cells and the output canvas around eight million pixels.

Regenerate all six new HTML pages with `node tools/render-halftone-studies.mjs`; run `node tools/test-halftone-studies.mjs`. Collection previews render the actual scenes once. No new libraries, image-generation charges, videos, APIs, external services or persistent state are used. Source renders are 640×640; all displayed dots have white ink, fixed grid thresholds and physical-pixel snapping.

## Source and design

These HTML/CSS/ES modules are maintained directly; there is no build step or third-party rendering dependency. The only shared dependencies are the existing favicon and adaptive cursor. No images, web fonts, network requests, sound or persistent state are needed by the artwork.

`bloom.css` owns the study's pure black/white palette, neutral utility grays, square controls and responsive type. System Georgia supplies the large, stationary printed word, so there is no delayed font swap. The serif's contrasting strokes and open counters make the interaction with halftone ink legible. Arial carries the quiet controls. This is a standalone print/motion experiment, not an extension of the catalogue's white-paper theme.

`field.mjs` owns the deterministic grid, warped overlapping density lobes, multiscale value noise, glyph-distance clearance and staggered propagation fronts. `bloom.mjs` measures the real text baseline, rasterizes the same font and letter spacing, and draws each white square once at its activation time. Dots have fixed coordinates and binary ink; neither the text nor an entire texture fades or moves. Default buildup lasts 2.2 seconds, then no animation frame is requested. Grid work is capped around 135,000 cells and the backing canvas around eight million pixels.

Replay / **R** retains the same field. Density, dot size and speed changes replay it for comparison. The native disclosure closes on Escape or an outside press. Reduced motion displays the final composition immediately; forced colors hides the decorative canvas. Page hiding and exit cancel work. Resize remeasures the text and renders a settled composition. Canvas/no-JavaScript failures retain the readable heading and appropriate fallback copy.

## Verification

From the repository root:

```powershell
node tools/test-halftone-bloom.mjs
node tools/validate-site.mjs
node tools/test-figures-of-speech.mjs
node tools/test-site-cursor.mjs
node tools/test-site-icons.mjs
```

Serve `dist/` with a static HTTP server for browser review. The field/model and lifecycle checks are separate from real-browser visual verification. Browser coverage and evidence are recorded in `tools/HALFTONE-BLOOM-QA.md`.
