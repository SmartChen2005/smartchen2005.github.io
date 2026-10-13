# The Gallery verification

2026-10-13. Prepared in the existing checkout for local review.

## Sources and scope

- Style: `style/ssense-photography-style-guide.md` and the live SSENSE homepage, viewed in the browser.
- Real projects and published covers: [Photography](https://sites.google.com/view/vegshark/photography) and [Film](https://sites.google.com/view/vegshark/film) on the user's old portfolio. Eight photography series and five film projects were imported. Covers are local and original JPEG copies are preserved. These are published cover assets, not a claim to have imported complete albums or films.
- PoY remains the existing local twenty-game-screenshot exhibition. No concept images are added to its collection. The user's restored CSS Spiral remains intact.
- Photographer now links to `/gallery/`. Stills adds The Gallery as its parent; its 2D mode is labelled Index. The game-room camera label is Gallery. Existing game/GDD content and room image/projection remain preserved.

## Build and replacement

Edit `tools/gallery-projects.json` for titles, categories, covers, dates and source links; then run `node tools/render-gallery.mjs`. Each project gets a local preview page and a full-project link to its original archive. `tools/import-gallery-covers.py` accepts directories bundled from the observed source pages, preserves original JPEG bytes, prepares same-ratio WebP covers and records provenance. `tools/render-stills.mjs` retains the new breadcrumb and Spiral / Index naming when the Stills collection is regenerated.

## Verification

After the sleep interruption, all modified and untracked files were reviewed and the completed implementation was preserved. The stopped local preview was restarted. All six CLI checks below passed again, as did syntax/whitespace checks and integrity checks for all 26 cover files. Final browser review confirmed the sticky Film section offset, phone project order (title → image → archive links), and the 320px Stills breadcrumb/Index spacing. The temporary viewport override was reset before handoff.

- `node tools/test-gallery.mjs`: thirteen authentic archive project records, media provenance, local pages/assets, unique headings, native Photographer entry, gallery hierarchy, Spiral/Index naming and shared neutral styles.
- `node tools/validate-site.mjs`: source-faithful GDD and homepage preservation.
- `node tools/test-home.mjs` and `node tools/test-home-state.mjs`: existing homepage scenery and card behavior, including retained Photographer hover and native Gallery navigation.
- `node tools/test-project-room.mjs`: room photo checksum, uncropped viewport fits, TV projection, routes and new-tab behavior.
- `node tools/test-stills.mjs`: existing CSS Spiral geometry, local originals, interpolation and non-overlapping Index geometry across seven viewport shapes.
- Syntax and whitespace checks; frontend premium strict audit.

Browser checks used the supported in-app browser API: 320×568, 390×844, 768×1024, 1440×1000 and a 720×500 CSS viewport equivalent to a 200% layout at 1440px. No horizontal overflow was found; header controls measure 44px. Loaded photography and film covers retain their natural ratios and have no filtering. Keyboard Enter on the homepage's Photographer link reaches The Gallery. Both photo and film project pages reach their correct archive URLs and return to the main gallery. Gallery → PoY → Index → shared image viewer → The Gallery was exercised; the viewer preserves 16:9 at 320px and restores focus. Actual forced-colors/offline/no-JS emulation was not available through this browser API; their shared CSS/native-HTML contracts were inspected rather than claimed as runtime checks.

Screenshots are stored in ignored `tools/stills-qa/`: Gallery homepage desktop/phone, film section desktop, photo-series phone and the revised exhibition breadcrumb. Temporary reference tabs are closed; the Gallery preview remains available as the deliverable.

## Notion editorial conversion — 2026-10-13

The thirteen archive project pages are now content-bearing editorial articles generated from verified Notion readback. Native files: 110 body photographs and 13 covers. The 26 unavailable carousel originals retain source references and per-project Media status notes. Five original video players/links, original film formats, captions and bylines are preserved. TIDA is explicitly PoY concept photography. The Gallery wordmark and exhibition breadcrumb use `text-decoration-skip-ink: none` for uninterrupted hover underlines.

`test-gallery-document.mjs` verifies Markdown/REST adapters, nested block and cursor pagination, rate-limit handling, incomplete-result rejection, natural image dimensions, native asset identity, markup/link safety, CMS property scope, empty publication states, invalid-export preservation and missing-token watcher behavior. The existing Gallery/home/room/Stills/GDD checks still pass. Current browser review confirms local image loading, desktop editorial hero layout, the 320px image viewer’s natural ratio, Escape and focus restoration. The unattended live REST sync remains unactivated until a read-only NOTION_TOKEN is configured; its API behavior was tested with deterministic responses rather than falsely claimed as a live authenticated run.
