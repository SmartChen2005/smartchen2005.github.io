# Multiverse All-Star Battlefront verification

## Scroll process and user guide — 2026-10-20

- Read and visually inspected both pages of the supplied quick user guide. The public PDF is byte-for-byte original (SHA-256 `91e8317e8662e5a879221966894dc00593cb1333380bce65c65588db80d3a4c9`, 18,219 bytes). Its historical access links are retained in the PDF, while the page clearly states the application is currently unavailable.
- `node tools/render-masb.mjs` generates the page and illustrative process data. `node tools/test-masb.mjs` passes renderer/data parity, original PDF signature/hash, honest availability/example labels, complete source-copy order, nineteen original asset hashes/ratios, seven technical sections, four contributors, ordered list, anchors and local destinations. `node tools/validate-site.mjs` passes, including shared project navigation.
- The existing red/white/black token values remain unchanged. Original character pixels/colors and all exhibition/technical media are preserved. The sample prompt/stats/skills/turns/outcome are expressly scripted, not real generation or an archived match. No backend endpoint is invoked by the presentation.
- `tools/test-masb-browser.cjs` checks all four manual stages, portrait/stat completion, three scroll-driven comic states and example HP, arrow/Home keyboard control with idle persistence, actual wheel forward/reverse at desktop and phone widths, sticky canvas behavior, reduced motion, forced colors and no-JavaScript prose/PDF/archive links.
- All four scene bounds and document overflow are checked at 1440, 1024, 760, 390 and 320px. An initial tablet generation-panel overflow was fixed by bounding the grid row and allowing the portrait to shrink while preserving its aspect ratio. Desktop and phone screenshots are saved in this chat's `masb-revision` visualization folder.
- The guide returns HTTP 200 with real `%PDF-` content. The original image viewer opens, closes with Escape and restores focus; Projects navigation returns to the correct route. Browser exceptions are checked separately from CSS/source declarations.
- Strict premium audit of the actual route has zero findings (`tools/masb-process-audit.json`). Repository-wide strict audit reports the same sixteen pre-existing findings in Git-ignored Gallery bundles/local generated test HTML; the raw JSON is retained as `masb-revision/project-audit.json` in the visualization directory. Those archived responses were not edited. There is no configured DESIGN.md linter or package typecheck for this static route, and none is claimed.
- Original 2026-10-05 checks below are historical evidence; current commit/push/Pages status is reported in the completing chat.

## Original archive

Verified on 2026-10-05.

- `node tools/render-masb.mjs`: renders the four introduction blocks, 45 technical-document blocks, six character illustrations, ten exhibition photographs and three diagrams.
- `node tools/test-masb.mjs`: passes complete source-copy/order checks, seven sections, four contributor accounts, original ordered list, nineteen SHA-256 checksums, intrinsic image ratios, local links, anchor destinations and Projects entrance. Included in Pages CI.
- `node tools/validate-site.mjs`: existing document, image, homepage and camera integrity checks pass.
- `node tools/test-project-room.mjs`, `node tools/test-music-station.mjs`, `node tools/test-music-firmware.mjs`: existing project checks pass, including 1,085 firmware differential cases.
- `node --check dist/projects/multiverse-all-star-battlefront/battlefront.mjs`: passes syntax validation.
- `python .../frontend-design-premium/scripts/audit_project.py . --mode strict`: zero findings. The auditor excludes deployed `dist/` files, so runtime verification below owns the actual page behavior.
- Bundled Python/Pillow `tools/prepare-masb-assets.py`: nine display files retain the exact decoded pixel bytes and dimensions. PNG display downloads decrease from 9,379,782 to 5,553,326 bytes. Archived originals are untouched.

Real Codex browser checks:

- Default 1280px viewport: no horizontal overflow; all nineteen content images use local files; bold stepped title and circle remain separate; document contents sits beside the reading column.
- 390×844 and 320×568: no horizontal overflow; the circle clears the metadata divider; original title remains readable; contents moves into normal flow; photographs and document retain natural height.
- Opened a character image in the native dialog: original image loads at 1024px; Close receives focus; Escape closes; focus returns to the selected image link.
- Contents link to Backend updates the URL anchor and performs native navigation. IntersectionObserver marks the reading section without owning scrolling.
- Projects link opens the established directory with all three projects. The new directory entrance returns to the new route with the correct title. Browser error log is empty.
- The print-reference color theme is intentional and fixed. Reduced-motion and forced-color CSS provide alternate rendering; those OS modes were checked statically rather than emulated in the browser.
- Image links and the full document remain in semantic HTML for no-JavaScript access; that fallback is verified structurally rather than with a disabled-JavaScript browser.

Desktop and phone screenshots are saved in the chat's visualization directory. The official DESIGN.md npm linter and Lighthouse are unavailable in the configured runtime; no score or lint success is claimed. No publish or deployment verification was performed for this local implementation.
