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

Browser coverage includes 1440px desktop, 1024px laptop, 768px tablet, 390px/320px phones and 844px landscape; scroll-driven depth; gallery morphing and rapid switching; full-ratio viewer; Close/Escape/arrows; focus restoration; modal background scroll lock; distant keyboard focus; reduced motion; offline interactions; no-JavaScript navigation; and failed image recovery. Screenshots cover the installation, scrolled spiral, gallery and open viewer.

## SSENSE guide revision

The user's latest request applies `style/ssense-photography-style-guide.md`. The guide's explicit Stills exception retains the default spatial spiral; its neutral surfaces, typography, image behavior, caption readability and catalog layout apply to the whole page. Original photos and collection order are unchanged.

CSS tokens match the guide's white/ink/body/secondary/rule/placeholder palette. Static images have no shadows, border material, filters, transparency or hover movement. The catalog uses contain within 3:4 slots: four columns at 1440px, three at 1024px, two on smaller screens. Caption and photograph share one original-file link. Captions remain at least 12px; mode controls have 44px touch targets. The mode rearrangement is 240ms; camera inertia, roll, angular drift and the large viewer entrance are removed.

Additional checks cover stationary image hover, original tones, exact white canvas, responsive column count, rendered caption collisions, forced colors and a simulated 200% desktop CSS viewport using Chrome device metrics. A real touch context, delayed image load and long-title fixture verify the guide's relevant resilience states. The archived `ssense-before.png` documents the prior design.

Prepared for local review. Remote publication is outside this request.
