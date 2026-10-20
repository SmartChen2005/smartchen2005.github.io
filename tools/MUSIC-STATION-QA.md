# World Sensing Music Station verification

## 2026-10-20 — Familiar routes become a place’s theme song

The current page foregrounds a loop station + musical instrument, played by moving through familiar space. The user-selected photograph opens the page, dissolves into the reconstructed device with the coils aligned, and shrinks into the room through reversible native scrolling. The existing overall page order, prototype media, shared navigation, original downloads and device geometry remain.

The room uses a single isometric projection with two adjoining walls, a sparse floor grid and window/door/desk references. Larger controls follow route → sound character → layer → recording → distance. `New pattern` loads an example from the same spatial route. Eight-beat recordings replace only one layer; modes and layers are locked during recording to keep the operation clear. The latest recorded route can be retraced, and manual movement takes over immediately.

The browser deliberately interprets the physical prototype: stable location-based notes and beat-aligned sine/triangle envelopes replace speed-dependent, overlapping square-wave auditions. Original `music-engine.mjs`, display/font ports and both firmware files remain unchanged. The disclosure explains the distinction. This is a schematic room and a synthesized web instrument, not a claim of a full hardware or acoustic simulation.

### Source and process preservation

- Imported the 2026-10-20 attachment as `prototype-in-hand.jpg`, byte for byte, with SHA-256 and provenance in `assets/sources.json`. Its only EXIF tag is orientation; no GPS metadata is present. Oriented 900/1800px WebP renditions preserve the full photograph.
- `tools/prepare-music-story.py` renders all 13 complete PDF pages through Poppler, with 1800px full-page images and small thumbnails. Text, images, white margins and PDF page order are preserved. Earlier extracted sketch assets and all original PDF/DOCX/firmware/photo files remain archived.
- `tools/render-music-process.mjs` deterministically generates all thirteen strip items from the manifest. Desktop displays four pages, tablet two, phone one with the next edge visible. Every sheet can open at full size; no-JavaScript links remain usable.
- Native modal viewer supports previous/next, left/right keys, touch swipe, zoom, original-PDF page links, Escape, focus restoration and image-load failure guidance.

### Checks performed

- `node tools/validate-site.mjs` — pass.
- `node tools/test-music-station.mjs` — pass. Original hashes, local links, thirteen-page manifest/order, source sensing/display/LED rules, nine web recording mode/layer combinations and identical scores on route retracing are covered.
- `node tools/test-music-firmware.mjs` — pass: 1,085 differential cases against C++ functions extracted from the original Control.ino. This is not a complete Arduino hardware build.
- `node tools/test-music-browser.mjs` — pass with installed Chrome, strict autoplay and bundled Playwright. The actual oscillator notes repeat identically across two route phrases; the analyser receives non-silent audio without clipping; previews produce one soft melody voice on the beat. Eight-beat recording, saved-route replay, mode retention, mute persistence, pause, clear, inspection and manual takeover pass.
- Browser layout coverage: 1440×900, 320×568, 390×844, 700×871, 768×1024, 844×390, 1024×768 and 1440×600. Photo/model intermediate opacity, photo/text separation, no horizontal viewport expansion, visible room bounds, recorded loops, final PDF page and viewer keyboard/zoom/focus pass. Reduced motion, no-JavaScript reading and missing Web Audio also pass.
- `node tools/test-music-sidebar.mjs` — pass at 700×871, 690×858, 700×500 and 700×390. Room bounds, separate waveform/movement hint, cursor following and overflow are checked.
- Chrome UI inspection through the connected browser: reviewed full-photo hero, intermediate coil alignment, room, controls, phone layouts and PDF pages 2/3 with zoom. ArrowDown changed 45 cm to 52 cm; an actual pointer drag reached the far end and produced beat-aligned pitch feedback.
- `node tools/test-home.mjs` and `node tools/test-project-room.mjs` — sibling route regressions pass. Existing shared navigation and typography are retained.
- Process renderer idempotence, JavaScript syntax and `git diff --check` — pass.
- Strict audit of the deployed Music Station route — zero findings, retained in `tools/music-premium-audit.json`. The required repository-root audit repeats 16 known findings in ignored Gallery archival/test HTML; no current task files are implicated. Those archives were not altered.
- Official DESIGN.md lint (`pnpm --package=@google/design.md dlx designmd lint DESIGN.md`) — zero errors; one warning for the existing document’s lack of YAML frontmatter. Scoped route tokens and behavior were reconciled in the maintained prose contract; no new dependency was added to this repository.

### Limits and publication

Mobile checks use browser emulation, with no physical handset or Arduino hardware test. Web Audio output was measured, not compared to a hardware recording. The existing click-to-load YouTube demonstration is retained; external streaming remains YouTube-owned. Screenshots and intermediate test artifacts are ignored under `tools/music-qa/`. Git commit/push and the brief Pages check are reported by the completing chat.
