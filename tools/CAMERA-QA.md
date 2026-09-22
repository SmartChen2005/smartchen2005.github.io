# SX-70 verification — 2026-09-22

Commands:

- `node tools/render-notion.mjs`
- `node tools/validate-site.mjs` — passes: original wording/order, 35 headings, 96 image references, two-line capitalized title, and synchronized camera modules.
- `node tools/test-camera.mjs` — passes geometry, folding, native-click passthrough, keyboard-click passthrough, hold/release, early release, simultaneous right/left shutter, click-through prevention, ejection completion, blur recovery, screenshot failure and reduced motion.
- `node --check tools/camera.mjs` and `node --check tools/camera-model.mjs` — pass.
- Premium static audit, strict mode — zero findings; `premium-audit.json` retains the clean static result. Static findings do not substitute for the checks below.

Browser checks:

- Main document at 1280 × 720: title has exactly two capitalized lines, open/fold camera renders, image click opens the original lightbox, close works, and Core Loop TOC link updates the anchor.
- Camera remains in the top layer above the native image dialog without intercepting its controls. No browser warning/error logs were observed.
- The separate `camera-preview.html` fixture exercised the production controller through keyboard-operated test buttons: enter finder, take actual DOM photograph, eject, drift, and settle at document bottom. The developed photograph visibly contains the cropped scene from the finder, not a placeholder.
- Main document at 390 × 844: document width 380 px, title line widths 340 px, font 24.96 px; no horizontal overflow.
- Physical right-button hold plus left-button press is covered by the event harness; the browser automation interface does not expose independent mouse-down/mouse-up controls. This distinction is intentional in the verification record.

The test fixture is under `tools/`, outside the deployable `dist/` directory. Photos are session-only decorations and are not uploaded or persisted. No public deployment was performed in this update.
