# Figures of Speech — 2026-10-27

## Scope and visual reference

- Added `/projects/figures-of-speech/` and its Projects directory entrance. The agreed reference is Virgil Abloh's *Figures of Speech*: centered original objects/plates, small captions, an ordered catalogue and development archive. Inspected the MCA publication description and the actual book spreads at Weltkern. Typeface names in the original publication were not verified; the website deliberately uses available Helvetica/Arial-style sans text and Georgia/Times captions. No book image is shipped.
- Seven numbered studies use original screenshots of the existing site. Eighteen selected source records were checked against actual Git dates. Historical records link to source revisions; experience panels clearly identify current-version playback.
- Editorial source: `tools/figures-of-speech.mjs`. Regenerate HTML and browser data with `node tools/render-figures-of-speech.mjs`. Grid links retain native full-page destinations without dialog support or JavaScript.

## Automated verification

- Passed `node tools/test-figures-of-speech.mjs`: unique stable IDs, seven real JPEG captures, all native destinations, source/browser parity, 18 dated Git records and zero preloaded rendering contexts on the index. CI's shallow checkout explicitly skips unavailable historical Git verification while still checking catalogue integrity.
- Passed `node tools/validate-site.mjs`.
- Passed `test-home.mjs`, `test-home-state.mjs`, `test-game-transition.mjs`, `test-photo-transition.mjs`, and `test-business-card.mjs`. Added default, card, games, photo, cars and unknown-query entrance coverage to the real homepage controller regression.
- Passed the remaining Pages workflow checks: `test-gallery-carousels.mjs`, `test-gallery-layouts.mjs`, `test-motor-race.mjs`, `test-music-station.mjs`, `test-music-firmware.mjs`, `test-masb.mjs`, `test-vr.mjs` and `test-construction-space.mjs`.
- Published `dist/` strict premium audit: zero findings, saved in `tools/figures-premium-audit.json`. An unscoped repository scan also includes ignored historical Gallery HTML fixtures and reported 16 actionless-button findings there; those fixtures are outside the published directory and were not changed.
- Module syntax checks and `git diff --check` passed. DESIGN.md CLI lint could not run because `npx` is not installed in this environment; existing design documentation was extended without changing unrelated identity contracts.

## Browser verification

- Used the in-app browser with a local static server. Desktop 1280×720: three square columns, complete source images, visible names/locations/dates, no broken thumbnails or horizontal overflow. The project keeps the shared Home/Projects/Gallery destinations and its sibling pages' navigation.
- At 390×844: one square column, readable title/captions, no horizontal overflow in the grid or 18-record chronology. Experience notes stack below the interactive stage. The mobile card receives extra vertical space to keep the original portrait/card composition available.
- Actual Gallery entrance ran inside the panel and navigated to the real Gallery. Actual Projects contraction ran and reached Projects. Reset recreated the starting experience; closing restored the triggering index link and left zero iframe contexts.
- Mobile 404: Add increased the actual object count, Clear responded, and Escape from inside the canvas closed the outer dialog and released its frame. Car Enthusiast's native film played in the mobile panel. Card, game and photography previews reuse their real homepage modules.
- The page creates no animation context at rest and creates only one current experience after explicit activation. Closing, resetting and pagehide remove that browsing context; stale load/timeout callbacks are guarded against the retired frame.
- Captured `figures-desktop.jpg` and `figures-mobile.jpg` in the conversation's visualization directory. Screenshot assets in the archive are kept in Git with the page.

## Limits

- No physical iOS sensor/permission-dialog or OS forced-colors test was performed. Existing motion/contrast fallback regressions passed.
- Browser logs include the previously documented unattributed `MutationObserver.observe` injection error, existing Three.js environment blur sample warnings in the 404, and a native Gallery view-transition abort during a viewport change. No new error was attributed to the archive module. These are not recorded as a clean-console result.
