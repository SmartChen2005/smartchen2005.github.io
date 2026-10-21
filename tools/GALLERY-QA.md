# The Gallery verification

## 2026-10-21 — Continuous color and more varied widths

- Replaced the near-white alpha valleys with opaque pastel colors throughout all thirty-six adjoining bands. Narrow shafts now alternate with several broad color pools; transitions stay soft, and header/body use the same field. Updated the stylesheet revision and regenerated the article.
- Passed `node tools/validate-site.mjs`, `node tools/test-gallery.mjs`, renderer syntax and whitespace checks. Scoped strict audit has zero findings; the root audit retains the same sixteen existing findings in ignored archive/test HTML. Evidence and desktop screenshot: ignored `tools/stills-qa/cathedral-color-review/`.
- Chrome: actual 1707px, 390px and 320px widths have no horizontal overflow; header/body fields match, Contact scrolls to the footer, sticky header remains at y=0, and its decoration accepts no pointer events. Console errors: none. Viewport overrides reset. Forced-colors/print rules remain unchanged and were inspected statically.

## 2026-10-21 — Denser irregular light through the header

- Replaced the nine isolated beams with twenty-eight irregular, softly interpolated color peaks and continuously tinted valleys. The route's muted palette remains canonical. Body and sticky header share one viewport-aligned gradient; the header retains an opaque surface and working navigation. Versioned the stylesheet reference and regenerated the article.
- Passed site validation, Gallery route/assets and layout checks, renderer syntax and whitespace checks. Scoped strict audit of the actual article/styles has zero findings; the root audit retains the same sixteen existing ignored archive/test HTML findings. Evidence and desktop screenshot are in ignored `tools/stills-qa/cathedral-dense-review/`.
- Chrome at actual 1707px, 390px and 320px widths has no horizontal overflow. Header/body gradient images and sizing match; Contact works and the sticky header remains at y=0 after scrolling to the footer. Both decorative layers use `pointer-events: none`. Viewport overrides reset. Forced-colors and print omission inspected in CSS rather than emulated.

## 2026-10-21 — Soft vertical light in Cathedrals of Light

- Added a route-only, static CSS background with softly blurred, low-saturation apricot, rose, lilac, blue and sage beams. The renderer preserves the stylesheet/body class during regeneration. No photograph, caption, content order or other Gallery page changed.
- Passed `node tools/validate-site.mjs`, `node tools/test-gallery.mjs`, `node tools/test-gallery-document.mjs`, `node tools/test-gallery-layouts.mjs`, renderer syntax and `git diff --check`.
- Chrome: verified actual 1707px, 390px and 320px viewport widths without horizontal overflow; fixed light remains behind content through the footer. Original image filters compute to `none`. Viewer opening, Next, Escape and source-focus restoration work. Surface of the Moon retains its white background and does not load the light stylesheet. Console has no errors. Temporary viewport overrides were reset.
- The static effect also works without animation or JavaScript. Forced-color and print omission were checked in CSS, not emulated. Screenshot: this chat's visualization directory, `cathedral-desktop.jpg`.
- Scoped strict audit of the deployed article and its actual styles: zero findings (`cathedral-review/audit.json` in the visualization directory). Repository-wide strict audit still reports sixteen existing actionless-button findings in ignored Gallery source bundles and generated test HTML; raw evidence is `cathedral-audit.json` in the same directory. No DESIGN.md linter is configured. Commit/push/Pages results are reported in the completing chat.

## 2026-10-15 — Player loading, rail boundaries and current Rhythms photographs

- YouTube verification used actual playback, not poster loading: Gorilla completed playback on the live site; Morning Unwoken advanced to 0:08 with its film credits visible in local preview; live Rorschach and Common Things both displayed moving film scenes after Play. The live lazy iframes initially remained blank until scrolling. Players now load eagerly; direct YouTube links and the existing origin referrer policy remain. No autoplay or host switch was introduced. Players have a 200px minimum height.
- Localhost embeds for Common Things and Rorschach returned YouTube's generic unavailable message even though the same videos played on the public domain. That result does not establish an account or embedding restriction. A directly opened embed URL also returned error 153 without a referring page; this is not evidence of a production error. Official reference: https://developers.google.com/youtube/iframe_api_reference.
- At the actual Chrome viewport of 1707px, every compact Photography image stays inside its fixed-height media frame and article row; adjacent photographs have their intended padding, object-fit is contain, and the page has no horizontal overflow. Explicit percentage dimensions and zero minimum dimensions remove reliance on flex intrinsic image sizing. The viewport override did not change Chrome's reported dimensions, so this run does not assert separate mobile or Safari browser coverage.
- Imported the current Rhythms of Chaos Notion page, last edited 2026-10-15T19:06:09.087Z: eleven photographs in its latest authored order. New DO1050826.jpeg and IMG_2809.jpeg occupy 04 and 05. Both are cached 1024×683 Notion image renditions with local JPEG/WebP mappings; original-file download was blocked, so these are not claimed as full-resolution camera originals. No expiring download tokens are stored. Viewer opening, Next to 05, decoded dimensions and focus restoration were checked in Chrome.
- Passed: Gallery document, layout, carousel and route tests; site validation; deployed-source strict frontend audit; staged diff checks.

## 2026-10-15 — Preserve every original carousel

- Identified Darkroom's original Lightroom section (`h.390ad03ec58fd76_65`, four photographs) and Enlarger section (`h.7be52d76c56310e8_22`, two photographs). Both now use the shared carousel while retaining their source explanation, captions, chapter directory and all sixteen image references.
- Gorilla and Rorschach retain their four- and three-image backstage carousels. Ordinary native photo rows/pairs remain static; the source-carousel adapter preserves all image order and works inside native Notion columns.
- Added regression checks for the two Darkroom group sizes, accessible labels, adjacent text and preservation of unrelated photo pairs. Shared carousel CSS is available on photography pages as well as Film details.
- Chrome desktop/390px: confirmed one image per carousel viewport, Lightroom Next changes photographs, Enlarger Next reaches the last photograph and disables at the end, and mobile captions/explanations follow the carousel without horizontal page overflow. Existing Gallery tests, site validator and scoped strict UI audit pass.

## 2026-10-15 — Chapter navigation and original Film compositions

- Opened all five live original Film detail pages in Chrome: Morning Unwoken, Cursed Stage, Gorilla in the Studio, The Common Things and Rorschach's Mask. Compared the player position/size, synopsis side, credit alignment, still groups and backstage carousel with the archived source geometry.
- Removed the extra detail-page CMS poster and duplicate header credits. Restored per-project video ratios and centered standalone credit/poem lines; retained each native video/text column and still sequence. Backstage photographs remain complete in a caption-and-carousel composition, with native scrolling plus keyboard/button controls.
- Intro to Darkroom now derives a five-link directory from native Notion headings using the shared Deliberate Practice section renderer. Enter followed a chapter link and its return link in Chrome; the target heading clears the sticky navigation. All sixteen images retain their order, continuous labels and natural proportions.
- Chrome desktop/390px checks: original-versus-revised Gorilla composition, Darkroom chapter/return navigation, mobile stacked Film copy/player, and switching backstage photographs through Next. The source poem and original image viewer remain available. Restored the temporary viewport afterward.
- Automated checks: `test-gallery-layouts.mjs`, `test-gallery-document.mjs`, `test-gallery-carousels.mjs`, `test-gallery.mjs`, site validator and strict frontend audit of the deployed `dist/` source roots (zero findings). The initial whole-repository audit also scanned archived third-party HTML and isolated generated test fixtures; those are outside the deployed UI scope. Pages CI now includes layout preservation checks.

## 2026-10-15 — Recover CSS carousel photographs

- Recovered all 13 missing photographs from active original project pages: Darkroom 6, Gorilla 4, Rorschach 3. Fresh published HTML exposes these as CSS background images; the complete image count and document order were checked against the archived source.
- Uploaded all 13 as native Notion files, replaced only the corresponding image references, updated Media status, and fetched each page again. Verified 16 / 10 / 7 body images respectively, with no remaining external Google Sites body image references in these pages.
- Archived JPEGs, optimized WebPs, SHA-256 hashes, original/refreshed addresses and native Notion identities. No unresolved references remain in active projects; the deleted Skater archive is retained.
- Validation: `node tools/test-gallery-carousels.mjs`, `node tools/test-gallery-document.mjs`, `node tools/test-gallery.mjs`, `node tools/validate-site.mjs`.
- Chrome: checked all three article image lists; opened recovered Darkroom and Rorschach originals in the native viewer and confirmed actual photographs render. The Pages push workflow runs the carousel integrity check before deployment.

## 2026-10-14 — Refresh the edited Rhythms of Chaos Notion page

- Re-fetched the live page edited at `2026-10-14T21:24:08.174Z`: nine body photographs, a replacement first file, four additions and the new introduction “Street Photography with a 28mm Leica Q”. Confirmed the source did not change during import.
- Cached the five new 2048px Notion image exports with stable native asset identities and SHA-256 checksums; preserved existing files, source references and the independently selected cover. Updated the single-page export and aggregate snapshot, then regenerated the homepage introduction and numbered article.
- Updated document checks to validate CMS-driven Index content against the current Notion sequence instead of freezing it to the legacy five-photo source page. Original archive checks remain for other articles. Site, Gallery and document validation passed, including all 140 current source photograph references.
- Chrome confirmed captions 01–09, no broken index images, the new introduction, and photograph 09 opening with its correct local file and number-only viewer caption. Other twelve Notion project records and article HTML remained unchanged; all exported-file checksums matched and no temporary signed credentials were stored.

## 2026-10-14 — Rhythms of Chaos numbered index

- Applied the Polaroid Index's 3:4 viewing slots to the five source photographs in order, with captions 01–05 only. The cover is selectable once in the grid; the project introduction and byline remain above it. Only this article loads the index stylesheet.
- Chrome confirmed four columns at 1440px, three at 1024px, and two at 390px / 320px, with full-image containment and no horizontal overflow. Opening 01 and moving to 02 retained number-only viewer captions and correct original URLs; Escape restored focus to the opening image. Reset the viewport after review.
- Passed site validation, Gallery and Notion document checks, strict design audit (zero findings), plus image-order and unrelated-page preservation checks. Preview saved as `rhythms-numbered-index.jpg` in this chat's visualization directory.

## 2026-10-14 — Remove the header doorway

- Removed the rejected doorway markup, styling and generator. Restored the original shared header without another decoration; retained the approved footer.
- Passed site validation, Gallery, Möbius and entry-transition checks. Verified exact original-header restoration across all fourteen pages, unchanged main/footer markup and an unchanged footer SVG.

## 2026-10-14 — Vaulted doorway header revision

- Removed the rejected split cornice and all header rules. Replaced them with one small perspective arch beside the wordmark; the approved footer drawing and layout remain byte-for-byte intact.
- Chrome review confirmed the isolated doorway and clear masthead. Responsive checks at 320px, 1024px and 1440px retained 44px navigation targets, unchanged wordmark height and no horizontal overflow; phones hide the extra doorway. Reset the temporary viewport override. Saved `gallery-vaulted-header.jpg` in this chat's visualization directory.
- Passed site validation, Gallery, Möbius and entry-transition checks, strict design audit (zero findings), and exact main/footer preservation across all fourteen generated pages.

## 2026-10-14 — Restrained architectural accents

- Added only a split cornice in the shared header and one small exhibition-room drawing in the footer. Generated all fourteen Gallery pages and the unfilled SVG from the common renderer; Notion content and photograph treatments remain intact.
- Chrome review at desktop and 390px confirmed the quiet line hierarchy, working Contact jump, footer composition and loaded decorative asset. At 320px the shared article header retains 44px navigation targets, its 112px height, and no horizontal overflow; the cornice reduces to a single rule. Temporary viewport override reset afterward.
- Passed `validate-site.mjs`, `test-gallery.mjs`, `test-gallery-document.mjs`, `test-gallery-mobius.mjs`, `test-photo-transition.mjs` and the strict design audit (zero findings). Existing entrance docking and three-second navigation checks remain green.
- Local header preview: saved in this chat's visualization directory as `gallery-architectural-header.jpg`.

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
# Film index cover restoration — 2026-10-14

- Checked all five projects against the user's original Film index and supplied screenshot. Four original title-bearing 1280×720 poster JPEGs and WebPs were already archived locally: Cursed Stage 戏怨, Gorilla in the Studio, The Common Things and Rorschach’s Mask. Morning Unwoken's existing third-body-image forest cover already matches the reference.
- Reattached the four existing uploaded poster files to their native Notion Cover image properties and synchronized legacy Cover URLs/page banners. Read back every update, verified original native asset identities, and compared page bodies before/after: all four bodies are identical. No reupload or asset replacement was needed; verified credential-free snapshots reference existing local media mappings.
- Generated homepage, article and related-project covers from the refreshed snapshots. Film links, natural 16:9 proportions, titles and dates remain intact. All original body image references, prose and credit checks pass.
- Chrome browser: all five homepage cover files load at their native 16:9 ratio. Cursed Stage's article selects the same poster and retains its twelve body photographs; the native viewer opens the full 1280×720 original and closes normally. Evidence: `tools/stills-qa/gallery-film-posters-top.jpg` and `gallery-film-posters-bottom.jpg`. Gallery route/assets, Notion document/source-order and site integrity checks pass.

# Compact Photography rail and static outline wordmark — 2026-10-14

- The right Photography rail retains the same four project links/order but uses 12px row padding, smaller 17–23px desktop headings, 14px serif metadata and viewport-aware photograph bounds. At 1280×720 the complete rail is ~525px tall and ends at y≈694; at 1440×900 it is ~705px tall and ends below y=900. Photographs retain their natural proportions; left-hand lead and companion entries are unchanged.
- The shared wordmark uses `assets/mobius-outline.svg`, a static drawing of the half-twist's boundary and visible contour. It has `fill="none"`, no shaded faces, masks, animation or browser canvas. Hidden segments are omitted numerically at build time. The earlier filled asset and unused WebGL modules remain archived, with no runtime import.
- Shared navigation is Photography / Stills / Film. Personal-site navigation, footer copyright and footer home link now use VegShark.com; author bylines and project content remain Smart Chen. At 390px and 320px there is no overflow or collision between the wordmark and the longer site name. Native links and existing keyboard focus are retained.
- Browser verification: desktop 1280×720 and 1440×900; phones 390×844 and 320×760. Viewport override reset after testing. Evidence: `tools/stills-qa/gallery-compact-outline-desktop.jpg`. Gallery routes/assets, Notion document/source-order checks, outline geometry, site integrity, syntax and strict premium audit pass.

# Solid Möbius and portrait/contents refinement — earlier 2026-10-14 version

- The wordmark now uses a real WebGL solid with a rounded cross-section, physical thickness .28, perspective, depth testing, smooth normals and highlights. Browser DOM confirmed a live canvas and `data-mobius-ready="true"`. The shared geometry also generates the no-JS/no-WebGL SVG fallback. Context loss restores that fallback; reduced motion removes pointer tilt. No idle animation loop or external graphics library.
- Numerical checks verify the half-twist joins at the opposite cross-section, lighting normals join smoothly, thickness remains .28 throughout, and all mesh indices and normals are valid. `node tools/test-gallery-mobius.mjs` passes.
- All five Deliberate Practice chapter links were clicked from the contents and back in the browser. Chapter headings have no enclosing parentheses; each return lands the contents below the sticky header (~108px desktop / ~136px phone). Keyboard Enter also returns correctly. Source image groups and sixteen captions are unchanged.
- At the default desktop viewport: Deliberate Practice body portraits and cover are 448×597px; Analog portraits are ~422×634px at the opening and 448×676px / 448×672px for the final comparison. At 390px, body portraits in both articles are 344px wide, with portrait pairs stacked. At 320px, Practice portraits are 274px wide. No overflow. Native viewer opens the full-proportion image and closes normally; the language switch still replaces Chinese with English.
- Morning Unwoken's homepage image points to `58f7925f68ce9c2ac46c.webp`, the third source photograph. Native Notion Cover image and page banner were updated and read back. Both portrait sizing notes and chapter-link rules were also read back and exported; no temporary S3 signatures are stored.
- Verification: Gallery routes/assets, document conversion/source order, solid geometry, site integrity, syntax and strict premium audit (zero findings) pass. Screenshots: `tools/stills-qa/gallery-solid-home-desktop.jpg`, `gallery-practice-large-desktop.jpg`, `gallery-practice-large-mobile.jpg`, `gallery-analog-large-mobile.jpg`.

# Möbius wordmark revision — earlier 2026-10-14 version (superseded above)

- Removed the elliptical arrow. The Gallery wordmark now has a light-gray, shaded Möbius band behind its text. The asset is generated from actual XYZ surface coordinates, a fixed perspective projection and depth-sorted lighting; it is a static SVG rendering, not an animated or interactive scene.
- Verified the half-twist closure numerically: the surface at a full revolution joins its opposite width coordinate. The resulting transparent SVG is about 132KB and adds no graphics/runtime dependency. The native home link, accessible wordmark text and keyboard focus remain; decorative imagery is hidden from assistive technology and omitted in forced colors.
- Browser: verified Gallery home and an article on desktop, plus 390px and 320px mobile. The local asset loads, the old arrow is absent, the wordmark stays on one line and there is no horizontal overflow or navigation overlap. Source photographs and the reading-language switch remain intact.
- Passed: `node tools/test-gallery.mjs`, `node tools/test-gallery-document.mjs`, syntax checks for the generator/renderer and strict premium audit (zero findings). Evidence: `tools/stills-qa/gallery-mobius-home-desktop.jpg` and `gallery-mobius-home-mobile.jpg`.

# Wordmark and bilingual reading — initial 2026-10-14 version

- Shared Gallery wordmark: static elliptical SVG arrow with an open top and leftward arrowhead, inheriting the existing ink color; text and native home link retained. SVG is excluded from the accessibility tree. No animation or raster asset was introduced.
- Analog & Digital: native 中文 / English radio group above the text. Chinese is the default; English replaces it in the same column. The vinyl photograph's desktop position and dimensions were identical before/after switching (checked in browser). All seven source photographs and all Chinese/English paragraphs remain sourced from Notion. The separate public translation disclosure and translation heading are absent. Its internal Notion layout note was updated and read back; published source text and image references were unchanged.
- Keyboard: ArrowLeft/ArrowRight change the selected language; focus stays on the selected native radio and its visible label receives an outline. Pointer switching works in both directions. CSS controls visibility, with native language attributes on the reading sections; no script is required for this control.
- Browser: desktop 1440px; mobile 390px and 320px; header breakpoints 700px and 701px. No horizontal overflow, header collisions or wrapped wordmark after the narrow-screen adjustment. Brand link returns to the Gallery homepage. Sibling Gallery pages share the same header; PoY's separate restored exhibition was not changed.
- Passed: Gallery route/asset checks, document/converter tests including Markdown/REST language mapping and immutable content preservation, JavaScript syntax checks and strict premium audit (zero findings). `git diff --check` is clean.
- Evidence: `tools/stills-qa/gallery-orbit-homepage-desktop.jpg`, `gallery-orbit-analog-chinese-desktop.jpg`, `gallery-orbit-analog-english-desktop.jpg`, `gallery-orbit-analog-mobile.jpg`.

# Author-curated layout continuation — 2026-10-13

- Home Photography: Rhythms of Chaos leads the left block; Deliberate Practice and Analog & Digital form the paired row below. Four remaining projects have a wider right rail and larger images/titles. Unpublished-curation fallback remains duplicate-free.
- Deliberate Practice: Assignment #4 and Final Portfolio portraits measure approximately 344×459px at desktop and 390px mobile viewports. Final Portfolio remains paired on desktop and stacks as larger individual prints on phones. The five original chapters, 21 images, 16 captions and user-selected Notion cover remain intact. Duplicate archive breadcrumbs are removed; the top navigation and Photography Series eyebrow remain.
- All twelve other original project detail pages were opened and inspected. Source geometry is recorded in ignored `tools/stills-qa/gallery-original-layouts.json`. Native Notion columns now retain TIDA's 1-versus-2 stacks, architectural groups, Surface's 2-by-2 stack, Analog's prose/portrait and comparison pairs, Darkroom's triptychs, and film video/text columns and still groups. Source poems/translations retain authored toggles and line order. Unresolved carousel originals retain source links.
- All thirteen Notion pages were fetched after writing their source-layout guidance. A reordered Cathedrals group detected during readback was repaired before export. Tests compare all 136 native/media references to the original source extraction, preserving exact image order; original prose/captions also remain present. Private layout notes never appear in public HTML. Notion properties were read, not rewritten; signed file URL credentials are excluded from the snapshot.
- Browser validation: 1440px desktop and 390px mobile archive pages; homepage additionally checked at 1024px and 360px. No horizontal overflow, distorted photographs, leaked editor notes or duplicate breadcrumbs. Deliberate's viewer opens the original, Escape closes it and restores source focus. Morning Unwoken's poem expands correctly. Native film embed destinations are retained; playback was not asserted.
- Passed: `node tools/test-gallery-document.mjs`, `node tools/test-gallery.mjs`, `node tools/validate-site.mjs`, and the strict frontend premium audit (zero findings). The restored PoY Spiral/Index source files remain untouched.
- Screenshots: `tools/stills-qa/gallery-photography-rearranged-desktop.jpg`, `deliberate-practice-enlarged-portraits-desktop.jpg`, and `deliberate-practice-enlarged-portraits-mobile.jpg`. Browser geometry checks: `gallery-layout-browser-checks.json`.
