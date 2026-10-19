# VR for Skill Learning verification

Verified 2026-10-19. Publication results are reported in the completing chat.

## Source and build

- Read and rendered all three original PDF pages: A1 has two pages; A2 has one. Confirmed each assignment's demonstration URL in its PDF. Original PDFs are public route assets and remain byte-for-byte copies, with SHA-256 provenance in `vr-source/sources.json`.
- `node tools/render-vr.mjs` generates the semantic parent page and shared interaction descriptions from modular assignment data. No framework installation or package changes are required.
- `node tools/test-vr.mjs` passes source/render parity, PDF signature/checksum checks, video/timestamp mapping, local file links, anchors, fallback content and the fourth Projects entry. Included in Pages CI.
- `node --check dist/projects/vr-for-skill-learning/vr.mjs` passes.
- `node tools/validate-site.mjs` passes. All existing Pages CI checks also pass: Gallery carousels/layouts, Home/Home state, Photography transition, Music Station/firmware (1,085 differential cases), Multiverse and construction-space checks. The sibling photographed-project room test passes too.
- `git diff --check` passes. The repository has no configured package build, formatter, typecheck or DESIGN.md linter for this static route; those are not claimed.

## Real Chrome browser

`tools/test-vr-browser.cjs` uses the bundled Playwright runtime and installed Chrome against the local static server.

- All four procedure states and both environment states update the SVG state, exclusive `aria-pressed` state and polite explanation. Tab, Enter/Space native semantics, arrow keys and Home selection are supported. Keyboard focus remains on the selected control. Native disclosure opens its PDF-grounded design note.
- Both PDF URLs return HTTP 200 with actual `%PDF-` content. Both original design-document links declare PDF metadata and new-tab behavior.
- Layout checks pass at 1440, 1024, 760, 390 and 320px: no horizontal overflow and both video boxes remain 16:9. Inspected desktop and phone screenshots; project content stays readable and diagrams remain secondary to video.
- Reduced motion removes entrance animation and transitions; forced colors hide decorative hero geometry and preserve controls. A disabled-JavaScript context retains both embeds, original PDF links and every substantive diagram description. No JavaScript page exceptions.
- Projects → VR page navigation works. The sibling Swiss project uses the same Home/Projects hierarchy; the VR route's independent paper/cobalt/orange identity matches its explicit brief.
- Both YouTube embeds **actually played** after activating their accessible Play buttons: A1 reached 19.00s from its 17s start; A2 reached 13.23s from its 11s start. Both reported `paused: false`, `readyState: 4`. YouTube uses its newer `Play video` button in this environment; the test locates its accessible name rather than relying on the old desktop class. Cross-origin captions/player UI remain YouTube-owned.
- Browser screenshots live in this chat's visualization directory. Long full-page screenshots can show an offscreen frame's reserved background after Chrome unloads/throttles that rendering surface; playback was checked directly inside each frame.

## Static audit scope

- The required repository-wide strict premium audit ran and found 16 actionless-button findings in pre-existing, Git-ignored Gallery source bundles and generated local test HTML. No task files were implicated; these archival responses must not be edited as product UI. The raw audit JSON is retained in the chat visualization directory as `vr-project-audit.json`.
- A separate strict audit against the actual deployed VR route has zero findings; committed evidence is `vr-route-audit.json`. This scope includes the new HTML/CSS, whereas the repository-root auditor normally excludes `dist/`. Runtime browser tests own behavior the static auditor cannot establish.
- Real headset testing and educational evaluation belong to the VR projects, not this portfolio page. No learning, comfort or performance results have been invented.
