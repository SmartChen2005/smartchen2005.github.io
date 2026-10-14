# Photographer to Gallery entry — 2026-10-14

The homepage's native Photographer link has an optional 3000ms architectural entry. Viewfinder corners inherit the clicked word's bounds; perspective lines and a domed skylight open into a white exhibition; two existing photographs retain their complete, original proportions; the shared Möbius outline traces around THE GALLERY; the title and mark move to the actual destination masthead while the page is revealed. The destination remains a normal, static Gallery page.

## Verification

- Passed `node tools/validate-site.mjs`, `node tools/test-home.mjs`, `node tools/test-home-state.mjs`, `node tools/test-photo-transition.mjs`, `node tools/test-game-transition.mjs`, `node tools/test-gallery.mjs`, `node tools/test-gallery-mobius.mjs` and `node tools/test-gallery-document.mjs`.
- Passed JavaScript syntax checks and `git diff --check`. The Pages workflow now runs the homepage, homepage state and Photographer entry checks before deployment.
- Strict frontend audit: zero findings; saved in `tools/photo-transition-premium-audit.json`. Runtime entry colors and type are documented in DESIGN.md and match the Gallery's existing white/ink/Helvetica roles. No new dependency or raster asset was added. The optional DESIGN.md CLI lint is unavailable because this environment has no npx executable; existing prose format is preserved.
- The new deterministic suite covers six viewport shapes, finite/continuous geometry, actual clicked-word origin, exact final masthead position, uncropped image ratios, asynchronous preparation, keyboard click, repeated clicks, active-game exclusion, native modifiers/download/new-tab behavior, unavailable iframe/SVG/canvas, reduced motion, forced colors, resize, backgrounding, Escape, preference changes, navigation watchdog, pagehide cleanup and Back replay.

## Browser observations

- Real Chrome inspection at the default desktop viewport and 1440×900, plus narrow 390×844 and 320×568 viewports. Captured hover/focus, line-drawn room, photographs/Möbius/title and final Gallery states through the connected browser.
- Verified `/gallery/` as the actual final URL, the Gallery document title, Back restoration and a second full entry. Photographer keeps its original accessible name; the decorative label is omitted from it.
- Narrow layouts move the two temporary wall prints above the title. No Gallery horizontal overflow at 390px or 320px. The temporary viewport override was reset after inspection.
- No captured console warnings or errors. Direct navigation also worked on an immediate cold click before the preview was ready.
- Narrow checks use a desktop browser viewport, not physical touch hardware. Reduced motion, forced colors and network/load fallbacks are covered by the deterministic controller suite rather than claimed as physical device checks.

Commit, GitHub synchronization and Pages deployment results are reported in the task completion message.

Post-publication check: the connected Chrome profile initially reused its cached pre-transition `home.css` and `home.mjs`, despite the server files matching the new commit. The homepage now carries a shared `20261014-gallery-entry` revision on these two resource URLs so the new document requests the updated styles and controller. Homepage validation resolves query/fragment suffixes to the actual local file and requires the Photographer module. No other homepage asset or layout changes.
