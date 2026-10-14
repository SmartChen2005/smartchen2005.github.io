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

## Deliberate Practice source layout — 2026-10-13

The current Notion Cover image was fetched and its downloaded bytes compared with the preserved original (`5b07dba56991f915781b.jpg`): exact SHA-256/byte match. The new native cover identity maps to that original and its same-ratio WebP on both the homepage and article. The live original Google Sites page was inspected in the browser, including section geometry and image/caption placement.

The Notion page now contains five chapters with [6, 6, 4, 1, 4] works: two triptychs, three pairs, two pairs, one solo work and two portfolio pairs. Readback verified all 21 native image references in their original order and all sixteen source captions. Caption paragraphs were retained because native-image Markdown captions were not preserved by the connected writer. An internal layout-note toggle was added to the same page and is explicitly excluded from website output.

Browser checks: five native section links; two three-column rows at 1440px and 390px; all sixteen rendered figure captions; no internal note visible; homepage selected portrait; no horizontal overflow. Converter tests check every original work link, chapter membership, pair/triptych relationships, selected-cover ownership, caption count and internal-note exclusion for both Markdown and REST blocks. Gallery asset/link checks, source-document preservation, Node syntax, whitespace and the strict premium audit pass. Screenshots are saved as ignored `tools/stills-qa/deliberate-practice-*.jpg`.

## SSENSE editorial layouts and small links — 2026-10-13

The supplied lower-homepage screenshot defines the Photography section's two lead stories, portrait spotlight and ruled four-project rail. The live Jeans of the Season and Stan Squirewell articles were checked for opening composition, text widths, image placement and captions. Small `.text-link` actions now show their underline only on hover, following the user's clarification; wordmark and title links remain without hover underlines. Only TIDA, Rhythms of Chaos and Analog & Digital opt into new article variants in `gallery-layouts.json`; the other articles, Film section and PoY installation retain their existing layouts.

Browser verification: 1440px three-column Photography layout, 768px tablet rearrangement, 390px Analog article and 320px homepage. Actual viewport widths were verified, with no horizontal overflow. All seven non-featured photography projects remain present once; TIDA and Rhythms preserve their eleven and five photographs without a duplicate opening image. Analog retains six Chinese paragraphs, its translation and source captions. Small links now compute to none at rest, their loaded hover rule supplies an underline, and the wordmark remains undecorated. The Rhythms viewer opens, changes image with ArrowRight, closes with Escape and restores focus. Reference tabs were closed and temporary viewport overrides reset. Screenshots are in ignored `tools/stills-qa/gallery-editorial-*.jpg`.

Converter tests now also verify original photograph access on all three revised articles and publication fallback when curated lead/spotlight projects are unpublished. Gallery routes/assets, source-document integrity, Stills, syntax, whitespace and strict premium checks pass.

## Photograph scale and cover proportions — 2026-10-13

Twelve native Notion Cover image fields now reuse the original first body photographs; readback confirmed each replacement. Skater retains the existing cover while its source originals are missing. No additional uploads or edits to article prose were made. Homepage, related cards and article heroes use the same natural-ratio assets. Portrait width follows the landscape reference short edge, with standard card-column sizing even in a wide homepage placement.

Browser measurements at 1440px: TIDA full-width landscape and portrait heights both 719.72px; the portrait is 479.81px wide. Homepage landscape cards and all three portrait covers share a 287.79px height at the standard 3:2 scale. At 390px, article landscape and portrait heights are 229.24px and 229.23px; no horizontal overflow. The 320px homepage likewise has no overflow and the reference landscape/portrait heights differ by less than 0.02px. Clicking a portrait opens the complete 1280×1920 image at 344×516px; Escape closes it and restores the originating photograph's focus. Temporary viewport overrides were reset. Gallery/converter/Stills/site checks, Node syntax checks, whitespace checks and the strict premium audit passed. Screenshots: ignored `tools/stills-qa/gallery-natural-cover-desktop.jpg` and `gallery-balanced-proportions.jpg`.
# Author-curated layout continuation — 2026-10-13

- Home Photography: Rhythms of Chaos leads the left block; Deliberate Practice and Analog & Digital form the paired row below. Four remaining projects have a wider right rail and larger images/titles. Unpublished-curation fallback remains duplicate-free.
- Deliberate Practice: Assignment #4 and Final Portfolio portraits measure approximately 344×459px at desktop and 390px mobile viewports. Final Portfolio remains paired on desktop and stacks as larger individual prints on phones. The five original chapters, 21 images, 16 captions and user-selected Notion cover remain intact. Duplicate archive breadcrumbs are removed; the top navigation and Photography Series eyebrow remain.
- All twelve other original project detail pages were opened and inspected. Source geometry is recorded in ignored `tools/stills-qa/gallery-original-layouts.json`. Native Notion columns now retain TIDA's 1-versus-2 stacks, architectural groups, Surface's 2-by-2 stack, Analog's prose/portrait and comparison pairs, Darkroom's triptychs, and film video/text columns and still groups. Source poems/translations retain authored toggles and line order. Unresolved carousel originals retain source links.
- All thirteen Notion pages were fetched after writing their source-layout guidance. A reordered Cathedrals group detected during readback was repaired before export. Tests compare all 136 native/media references to the original source extraction, preserving exact image order; original prose/captions also remain present. Private layout notes never appear in public HTML. Notion properties were read, not rewritten; signed file URL credentials are excluded from the snapshot.
- Browser validation: 1440px desktop and 390px mobile archive pages; homepage additionally checked at 1024px and 360px. No horizontal overflow, distorted photographs, leaked editor notes or duplicate breadcrumbs. Deliberate's viewer opens the original, Escape closes it and restores source focus. Morning Unwoken's poem expands correctly. Native film embed destinations are retained; playback was not asserted.
- Passed: `node tools/test-gallery-document.mjs`, `node tools/test-gallery.mjs`, `node tools/validate-site.mjs`, and the strict frontend premium audit (zero findings). The restored PoY Spiral/Index source files remain untouched.
- Screenshots: `tools/stills-qa/gallery-photography-rearranged-desktop.jpg`, `deliberate-practice-enlarged-portraits-desktop.jpg`, and `deliberate-practice-enlarged-portraits-mobile.jpg`. Browser geometry checks: `gallery-layout-browser-checks.json`.
