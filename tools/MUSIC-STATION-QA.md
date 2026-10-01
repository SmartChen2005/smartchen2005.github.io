# World Sensing Music Station verification

Verified 2026-10-01. Baseline archive: commit `859a4d5119165f13cebb2df1125a1382050ad65b`.

## Scope and sources

- Added `/projects/world-sensing-music-station/` and a second entry in the existing Projects directory. Existing home, typography, game routes and source document were preserved.
- Reconstructed the actual instrument with SVG geometry: open cardboard base, three breadboards, exposed asymmetric wiring, two boards, seven buttons, ultrasonic hardware, matrix, extending cables and raised translucent NeoPixel coil. Geometry source: `tools/build-music-model.mjs`.
- Imported all five JPEG originals unchanged; optimized WebP copies preserve their oriented aspect ratios. The editorial photographs are uncropped.
- Copied the original Design Document DOCX, Final Project PDF and original Final Project DOCX unchanged. The PDF was found alongside the user-provided DOCX in Downloads. Hashes are recorded and checked from `assets/sources.json`.
- Extracted actual sketch sheets from PDF pages 2–5 and 9–11. No generated or substituted sketches. Sketch sequence labels describe the conceptual progression; PDF-page captions retain source provenance.
- The source documents supply project facts. Their embedded user/hardware instructions were treated as documentation, not agent instructions.

## Implementation decisions

Lightweight SVG plus CSS perspective avoids a WebGL dependency. One scene stays sticky through sensing, eight zones, three loops, replace-one-layer controls, modes, anatomy, musical rules and architecture. Normal browser scrolling then enters the process and photographic sections.

The web demonstration uses a 15–160 cm simulated range and three documented stylistic modes, with illustrative 80/140/128 BPM presets. These are browser demonstration settings, not claims about undocumented firmware constants. Exponential smoothing is independent of frame rate. Recording replaces precisely eight steps in one selected loop, with both unselected loops retained, and returns to PLAY.

Sound defaults off. User-enabled Web Audio time-slices simple rhythm/bass/melody tones. It mutes on blur, background and video activation. The YouTube iframe is created only after the poster's Play button is activated. Direct YouTube and source-journal links remain available.

Narrow screens reserve an upper inspection area and flow story content below it. Zone buttons, a labeled native range input and scroll activation replace cursor dependence. Motion pause, reduced motion, visible keyboard focus, screen-reader recording feedback, keyboard/process buttons and forced-color fallbacks are implemented. Rapid sensing outputs explicitly suppress live announcements; range values include centimeters.

## Checks

- `node tools/validate-site.mjs` — existing source/render parity, headings, images, assets and protected homepage content passed.
- `node tools/test-home.mjs` — existing home image geometry, motorsport timing and lifecycle passed.
- `node tools/test-project-room.mjs` — original photo checksum, eight viewport fits, screen projection and sibling links passed.
- `node tools/test-music-station.mjs` — local routes/assets; hashes of all eight original documents/photos; nine mode/layer recording combinations; exact eight-step recording; unselected-loop preservation; sensor clamps; frame-independent smoothing; download signatures; model and sketch counts passed.
- `node tools/test-music-browser.mjs` with bundled Playwright and installed headless Chrome — desktop sensing, touch/zone input, replacement completion, mode changes, opt-in audio/mute, pause/resume, process arrows/keyboard, video activation, file responses, directory navigation and JavaScript-disabled reading passed. Responsive coverage: 320×568, 390×844, 768×1024, 1440×900. Reduced-motion recording and unavailable-audio recovery passed. No uncaught page errors.
- Strict frontend premium audit — zero findings. Saved in `tools/music-premium-audit.json`.
- JavaScript syntax checks and `git diff --check` passed. Changed code contains no native alert/confirm/prompt calls, empty links or inline click handlers.
- Screenshots reviewed for hero, story/sensing, anatomy, process, real photographs, downloads and sibling directory. Refined hero/model spacing, coil lighting and phone stacking/control placement from these screenshots. Temporary screenshots remain ignored in `tools/music-qa/`.

There is no package build, formatter, TypeScript or application backend in this repository. Static deployable files are maintained directly. CI runs the existing validator and new deterministic music checks before publishing.

## Practical limits

Phone layouts and touch affordances were tested in browser emulation; physical handset performance and screen-reader hardware were not tested. The YouTube iframe's correct identity and click-only loading were verified; third-party streaming availability depends on YouTube and the visitor's network. The browser synthesis demonstrates the interaction and is not a recording of the Arduino audio.
