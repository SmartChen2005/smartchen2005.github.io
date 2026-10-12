# Stills exhibition

2026-10-12. Route: `/projects/polaroid-of-yesterday/photography/`.

## Collection and replacement

The collection uses twenty existing project images, including the supplied room photograph and game/document assets. The three images attached to the current brief are art-direction references, not exhibition content or instructions. No stock placeholders are needed.

Edit `tools/stills-collection.json` to replace, add or reorder photographs. Each entry contains a stable ID, title, category, original-file path relative to the page, original width/height and descriptive alt text. Put new originals in a local project asset folder. Both viewing modes and the focused viewer use this same ordered collection.

Regenerate with:

```powershell
python tools/prepare-stills-assets.py
node tools/render-stills.mjs
node tools/test-stills.mjs
node tools/validate-site.mjs
```

The preparation script needs Pillow. It verifies original dimensions and creates uncropped WebP copies up to 1600px, without changing originals. The renderer writes static semantic HTML and a portable collection manifest. Runtime behavior uses the generated HTML, so entering the exhibition requires no JSON fetch or external service.

## Verification

- `node tools/test-stills.mjs`: true helix coordinates, monotonically advancing vertical axis, safe camera depth, continuous interpolation, local media/original links and uncropped non-overlapping gallery geometry across seven viewport shapes.
- `node tools/validate-site.mjs`: original document copy, heading hierarchy, asset sequence and existing homepage preservation.
- `node tools/test-project-room.mjs`: original room checksum, camera's Stills destination, room projection and existing navigation semantics.
- `python <frontend-design-premium>/scripts/audit_project.py . --mode strict --output tools/stills-premium-audit.json`: static premium audit.
- `node tools/test-stills-browser.cjs`: real Chrome interaction checks, saved screenshots in ignored `tools/stills-qa/`. Set `PLAYWRIGHT_MODULE` to the available Playwright package and serve `dist/` on port 4173 first.

Browser coverage includes desktop, 390px/320px phones and 844px landscape; scroll-driven depth; gallery morphing and rapid switching; full-ratio viewer; Close/Escape/arrows; focus restoration; modal background scroll lock; distant keyboard focus; reduced motion; offline interactions; no-JavaScript navigation; and failed image recovery. Screenshots cover the installation, scrolled spiral, editorial gallery and open viewer.

Prepared for local review. Remote publication is outside this request.
