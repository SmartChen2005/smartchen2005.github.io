# SX-70 verification — 2026-09-22

## Follow-up: movable framing and folding correction

- The controller harness now checks Tab hold/release, pointer movement with zero mouse buttons during Tab aiming, distinct crops after moving the frame, and document scroll offsets in the capture request.
- Browser fixture: two shots at different scene positions produced visibly different photographs (left buildings/street versus right camera/road). Both developed photos were inspected together at the document bottom.
- Folded-model screenshot confirms the upper leather deck and separate cap, with the lens facing downward. Back-facing mesh surfaces are culled.
- Entry timing is now 680 ms. Ejection uses a textured 3D paper plane sharing the model's film-slot coordinates; falling uses randomized continuous sway, rotation, wind and duration.
- Sidebar help is explicitly requested interface copy. Source document parity still passes for all 35 headings and 96 image occurrences.

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
# Follow-up: optical alignment and paper motion

- Finder center now remains at the pointer even at viewport edges; offscreen photo regions are black instead of capturing unseen document content.
- Capture-phase context-menu suppression also covers the folded and post-shutter states.
- Folded upper surfaces use leather materials directly. Open geometry has a short leather shoulder and tapered finder bellows.
- Zoom uses the model's rear glass center/width. Paper falls about its center with restrained random sway in 2.9–3.6 seconds, without stretching.
- Verified with `node tools/test-camera.mjs`, `node tools/validate-site.mjs`, `git diff --check`, and strict premium audit. Browser fixture inspected open/folded geometry, finder entry, completed finder and shutter return. Automated tests cover held mouse buttons, edge centering, Tab, cancellation and reduced motion; native held-button timing was not manually exercised.
