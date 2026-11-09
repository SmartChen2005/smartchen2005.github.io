# Halftone studies — 2026-11-09

Scope: five standalone pages plus their collection inside the existing unlisted Halftone Bloom directory. The public Figures of Speech page/catalogue/chronology and all preserved editions are untouched. The original Bloom animation is retained; its upper-right link now opens the collection. The two pre-existing UnifrakturCook files are unrelated and are not included.

## Executed verification

- `node tools/test-halftone-studies.mjs`: passed. Independent routes, local dependency closure, unique metadata, bounded deterministic dithering, tonal endpoints, density monotonicity and staggered activation. Lunar's actual pixel renderer verifies phase illumination, eclipse, crater contrast and reproducible out-of-order timeline access.
- Its actual-controller async/clock harness verifies precise native seek, replay/pause/speed, natural completion without RAF, initial/live motion preferences, manual preference-mode scrubbing, hidden/pagehide/resize cleanup, preparation completing after a page exit, image failure/retry, initial rendering failure and unavailable Canvas. It caught and now guards the seek-value reset and late preparation restart regressions.
- Original Bloom, site validation, Figures archive/hash/source parity, cursor coverage and site icons pass. New tests are included in the Pages workflow. Regeneration is idempotent.

## Browser evidence

Root in-app Chromium reviewed the actual collection and all five independent desktop pages at 1280×720. Exposure's complete self-portrait assembles; Lunar has a textured lit sphere and changing shadow; Botanical has layered petal/counter detail; Shoal assembles into a larger fish; Tide has a hollow curling crest and spray. Source-level review led to a final denser, larger, staggered Shoal arrangement. Each case has native navigation to the next and to the collection.

Native End/Home/PageUp seek was exercised at final and intermediate frames, including Lunar 4.4/11 s and Tide 5.5/11 s. The corrected timeline pauses at the exact requested frame. Pause/Play, Replay, range labels and final states are available without moving the heading. No console errors or warnings were observed. An independent review also inspected Lunar 2.0 s and Tide 2.3/5.4 s in Chrome.

At 390×844, the real Tide page, final artwork, two-row toolbar, timeline and expanded controls were reviewed: no horizontal overflow, all controls inside the viewport (footer bottom829px, panel top573.69px). Temporary viewport overrides were reset. The collection's header overflow was fixed and its measured desktop overflow is false; all five real scene previews render successfully.

Reduced-motion, forced-color, image-error and background races are checked with the actual-controller harness rather than claimed as real-browser preference/assistive-technology coverage. Lunar's first 640px procedural texture bake is a one-time cost (about274ms in the Node smoke measurement); subsequent source frames were about4–11ms. Those figures exclude browser raster/paint and are not an end-to-end FPS claim. Preview canvases are static, and inactive/complete study canvases sleep.

Local review screenshots are retained in the chat artifact directory as `botanical-study.jpg`, `shoal-study.jpg` and `tide-study.jpg`; the final root browser review includes the denser Shoal revision. No screenshot files or temporary preview servers are part of the published source.
