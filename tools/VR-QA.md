# VR for Skill Learning verification

Verified 2026-10-19. Publication results are reported in the completing chat.

## Compact opening and scroll revision — 2026-10-19

- The cover now uses two desktop title lines and a 200px geometric mark, with smaller spacing and the original two-link directory. At all five tested widths, the first assignment heading begins within 680px of the document top (660px on desktop). Both video/PDF mappings and project content are preserved; the video column is slightly narrower.
- Each study now has authored paragraphs in normal page flow beside a sticky SVG. There are no empty spacer scenes or intercepted wheel/touch events. A single scheduled animation frame updates on scroll/resize/font readiness/visibility/Back restoration and sleeps when idle. Hero orbit/quadrant transforms share the same native scroll progress.
- Real Chrome `mouse.wheel` input advances all four wheel-removal steps and both environments at 1440px and 390px; reversing the wheel reverses the states. Confirmed that the illustration stays at its sticky reading position while the paragraphs move. Map travel follows the orthogonal SVG path and has continuous progress.
- Manual selection, Home/End/arrows and idle persistence pass. The next actual scroll resumes automatic selection. Only manual changes use polite live captions; automatic changes have `aria-live="off"` and never move keyboard focus.
- All explanations now remain in ordinary HTML, including when the module fails to load; the fallback no longer depends on `<noscript>`. Reduced motion stops automatic progression and hero movement while keeping manual buttons working. Forced colors and no-JavaScript checks pass.
- The full browser suite passes at 1440, 1024, 760, 390 and 320px, without horizontal overflow; videos retain 16:9, real PDF HTTP checks pass, and both demonstrations played again (A1 19.26s; A2 13.70s, unpaused and readyState 4). No page exceptions. Inspected the desktop/phone screenshots in the chat's `scroll-revision` visualization directory.
- `node tools/test-vr.mjs`, `node tools/validate-site.mjs`, JavaScript syntax and `git diff --check` pass. New-route strict audit remains at zero findings. Repository-wide audit repeats the same 16 pre-existing findings in Git-ignored archival/test HTML; raw evidence is `vr-scroll-project-audit.json` in the visualization directory. No configured DESIGN.md linter exists, so none is claimed.

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
- Reduced motion removes entrance animation and transitions; forced colors hide decorative hero geometry and preserve controls. A disabled-JavaScript context retains both embeds, original PDF links and every substantive diagram description. No JavaScript page exceptions. The scroll revision above adds manual-only exploration for motion preferences.
- Projects → VR page navigation works. The sibling Swiss project uses the same Home/Projects hierarchy; the VR route's independent paper/cobalt/orange identity matches its explicit brief.
- Both YouTube embeds **actually played** after activating their accessible Play buttons: A1 reached 19.00s from its 17s start; A2 reached 13.23s from its 11s start. Both reported `paused: false`, `readyState: 4`. YouTube uses its newer `Play video` button in this environment; the test locates its accessible name rather than relying on the old desktop class. Cross-origin captions/player UI remain YouTube-owned.
- Browser screenshots live in this chat's visualization directory. Long full-page screenshots can show an offscreen frame's reserved background after Chrome unloads/throttles that rendering surface; playback was checked directly inside each frame.

## Static audit scope

- The required repository-wide strict premium audit ran and found 16 actionless-button findings in pre-existing, Git-ignored Gallery source bundles and generated local test HTML. No task files were implicated; these archival responses must not be edited as product UI. The raw audit JSON is retained in the chat visualization directory as `vr-project-audit.json`.
- A separate strict audit against the actual deployed VR route has zero findings; committed evidence is `vr-route-audit.json`. This scope includes the new HTML/CSS, whereas the repository-root auditor normally excludes `dist/`. Runtime browser tests own behavior the static auditor cannot establish.
- Real headset testing and educational evaluation belong to the VR projects, not this portfolio page. No learning, comfort or performance results have been invented.
