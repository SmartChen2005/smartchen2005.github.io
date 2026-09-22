# Polaroid of Yesterday — Design Context

## Overview

This website is a faithful web edition of the Notion page **Polaroid of Yesterday Game Design Document**. The source document—not an editorial rewrite, slide metaphor, or portfolio narrative—owns the visible copy, content order, heading hierarchy, captions, image sequence, and column relationships.

The game's visual identity supplies the restrained frame: black surfaces, monochrome imagery, and yellow Futura-style heavy oblique typography. That identity must never introduce new visible prose or compete with the document.

Avoid invented cover copy, chapter labels, thematic slogans, continuation markers, end statements, slide counters, fixed-height pages, cards, decorative metadata, and any regrouping or condensation of source material.

## Colors

- Canvas: `#070707`
- Raised black: `#0B0B0B`
- Primary text: `#F4F4EE`
- Body text: `#C7C7C0`
- Secondary text: `#888982`
- Rules: `#2C2C29`
- Game yellow: `#F6C934` — reserved for the exact document title, navigation state, progress, and focus.

Runtime mapping: these values are defined once as CSS custom properties in `dist/index.html` by `tools/render-notion.mjs`.

## Typography

- The exact Notion page title uses Futura / Futura PT / Arial Black / Helvetica Neue fallback, heavy oblique.
- Document headings use Helvetica Neue / Inter / Arial and preserve the source H1–H4 hierarchy.
- All ordinary paragraphs share one size, color, line height, and measure. No paragraph is promoted into display copy.
- Source-authored bold, italic, lists, quotes, and captions remain distinct only where the original document marks them as such.

## Layout

- Desktop uses a fixed, independently scrollable table of contents containing every source heading in exact order and hierarchy.
- The document has natural continuous height. There are no pages, slides, viewport-height sections, or snap scrolling.
- Source `<columns>` groupings are preserved, with spacing and scale tuned for the web reading rhythm. Outside source columns, text and images remain in source order.
- Every image uses `height: auto` and its intrinsic aspect ratio; no crop or fixed media height is allowed.
- Standalone images are centered and use feature, standard, portrait, or compact display scales according to the source material—not Notion's incidental pixel gaps.
- Narrow screens collapse columns to a single flow without changing content order.

## Elevation & Depth

The surface is flat. Depth comes only from image contrast, thin rules, and the image-preview backdrop. There are no cards, ornamental gradients, or shadows.

## Shapes

Square corners throughout. Rules and image frames echo photographs and the camera viewfinder.

## Components

- Detailed table of contents: exact source headings, H1–H4 indentation, active state in game yellow.
- Document title: exact Notion page title; no subtitle, deck label, or added slogan.
- Source document: natural-height rendering of the Notion Markdown.
- Image preview: native accessible dialog using the original-ratio asset, explicit close control, and focus restoration.
- Reading progress: a three-pixel yellow line at the top of the document.
- SX-70 pointer: a procedural, articulated 3D camera with chrome, brown leather, black bellows, a red shutter, and rear eyepiece. Geometry is owned by `tools/camera-model.mjs`; interaction by `tools/camera.mjs`; overlay styling by `tools/camera.css`. The renderer copies these into `dist/`.
- The title remains two lines, capitalized as “Polaroid of Yesterday” / “Game Design Document”.

## Camera interaction

- Desktop mouse only; touch, keyboard reading, and forced-color mode retain native operation. The camera is decorative and never takes focus or intercepts ordinary links, image previews, selection, or scrolling.
- Left click toggles folding while preserving the target's original click. Hold right mouse while open to rotate into the rear finder (290 ms); release, Escape, blur, pointer cancellation, or resize exits safely. Inside the finder only, left click takes a photo instead of activating content underneath.
- The finder is a square optical surround with a lower split-circle focus aid, with no invented copy. Camera scale is 34 screen pixels per model unit, approximately 120 pixels overall. A small yellow point marks the precise click position.
- A photo captures the current page locally using vendored html2canvas 1.4.1 (MIT), flashes once, ejects over 2.1 seconds, drifts for 4.4 seconds, then rests at the document bottom. Keep at most 12 ephemeral photos; refreshing clears them. No network, camera permission, or persistent photo storage is involved.
- Reduced motion skips zoom, ejection and drifting, and reduces the flash. Capture errors restore interaction and do not create a fake photo. The enhancement adds no document text or image occurrences.

## Do's and Don'ts

- Do treat `tools/notion-source.md` as the sole source of visible document content.
- Do preserve every source paragraph, heading, caption, image occurrence, and their exact order.
- Do preserve original image proportions and column groupings while adapting their display scale for a stronger desktop composition.
- Do keep global scrollbars visible and respect reduced-motion and forced-color preferences.
- Don't invent, summarize, paraphrase, prioritize, consolidate, reorder, or omit document text.
- Don't add slide behavior, fixed vertical limits, decorative chapter numbers, or authored transition copy.
