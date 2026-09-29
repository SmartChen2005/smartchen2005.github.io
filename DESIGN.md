# Polaroid of Yesterday — Design Context

## Overview

This site has a small portfolio shell around a faithful web edition of the Notion page **Polaroid of Yesterday Game Design Document**. The public hierarchy is `/` for the home page, `/games/` for the Games category, `/games/polaroid-of-yesterday/` for the project page, and `/games/polaroid-of-yesterday/game-design-document/` for the source-faithful document. The source document—not an editorial rewrite, slide metaphor, or portfolio narrative—owns the visible copy, content order, heading hierarchy, captions, image sequence, and column relationships on that document route.

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

Runtime mapping: the document values are defined once as CSS custom properties in `dist/games/polaroid-of-yesterday/game-design-document/index.html` by `tools/render-notion.mjs`; the lightweight site shell uses the same palette in `dist/site.css`.

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

- Site hierarchy: the home page links to the Games category, the category links to Polaroid of Yesterday, and the project page links to the Game Design Document.
- Detailed table of contents: exact source headings, H1–H4 indentation, active state in game yellow.
- Document title: exact Notion page title; no subtitle, deck label, or added slogan.
- Source document: natural-height rendering of the Notion Markdown.
- Image preview: native accessible dialog using the original-ratio asset, explicit close control, and focus restoration.
- Reading progress: a three-pixel yellow line at the top of the document.
- SX-70 pointer: a procedural, articulated 3D camera with chrome, brown leather, black bellows, a red shutter, and rear eyepiece. Geometry is owned by `tools/camera-model.mjs`; interaction by `tools/camera.mjs`; overlay styling by `tools/camera.css`. The renderer copies these into `dist/`.
- The title remains two lines, capitalized as “Polaroid of Yesterday” / “Game Design Document”.
- The sidebar brand uses the same two-line title split, with “Game Design Document” on the second line.
- The document title owns the separator before the first source heading; the first source heading does not add a duplicate top rule.
- The camera instruction uses standard slash spacing: `Click: open / fold / shoot · Hold RMB / F: aim`.

## Camera interaction

- Desktop mouse and trackpad: hold right mouse or unmodified F while the camera is open and the pointer active. Tab always keeps native focus navigation; text inputs and modified F shortcuts remain native. Ordinary links and image previews still respond to clicks. The raised finder cap and upper-panel edges are brown leather; the lower chassis remains chrome.
- Enter the rear finder over 680 ms, return over 380 ms. Release the held input, Escape, blur, pointer cancellation, or resize exits safely. If both aim inputs are held, releasing one keeps aiming until the other is released. The sidebar contains the user-requested short English control instruction beneath the title.
- The square finder is centered exactly on the pointer, including at viewport edges, with a lower split-circle focus aid. Its size is the smallest of 58vw, 64vh and 520px. A shot crops visible document content at the frame bounds plus current scroll offset; offscreen areas remain black. Clone image geometry is frozen to avoid lazy-image shifts. Developed photos retain the captured colors. Zoom anchors to the actual rear glass center and finishes at the frame width, using shared model geometry rather than a body-center offset.
- Folded geometry has a brown leather upper deck and raised leather finder cap; the front standard rotates forward with the lens facing down. Camera scale is 34 screen pixels per model unit, approximately 120 pixels overall. A small yellow point marks the precise click position.
- Photos use vendored html2canvas 1.4.1 (MIT). After a single flash, the actual photo is projected as a sheet through the camera's shared 3D film-slot coordinates over 2.3 seconds. On release it tips about its center and falls with air-resistance easing, restrained randomized sway and rotation over 2.9–3.6 seconds, then rests at the document bottom. No oscillating paper stretch. Keep at most 12 ephemeral photos; refreshing clears them. No network, camera permission, or persistent photo storage is involved.
- Reduced motion skips zoom, ejection and drifting, and reduces the flash. Capture errors restore interaction and do not create a fake photo. The enhancement adds no document text or image occurrences.

## Do's and Don'ts

- Do treat `tools/notion-source.md` as the sole source of visible document content.
- Do preserve every source paragraph, heading, caption, image occurrence, and their exact order.
- Do preserve original image proportions and column groupings while adapting their display scale for a stronger desktop composition.
- Do keep global scrollbars visible and respect reduced-motion and forced-color preferences.
- Don't invent, summarize, paraphrase, prioritize, consolidate, reorder, or omit document text.
- Don't add slide behavior, fixed vertical limits, decorative chapter numbers, or authored transition copy.

## Homepage — One continuous sentence (2026-09-28, revised)

The previous homepage was explicitly rejected and replaced. This homepage is an independent brand surface; all game pages retain the document identity above. The entire default page is exactly one sentence: “Smart Chen is a game designer, photographer, and car enthusiast.” No masthead, logo, footer, captions, cards, illustrations, dialogs, placeholder collections, or extra prose.

Runtime source and token owner: `dist/home.css`; markup: `dist/index.html`; progressive interaction: `dist/home.mjs`; unchanged game hover physics: `dist/home-scenes.mjs`; game click transition: `dist/home-game-transition.mjs`; motorsport timeline: `dist/home-motorsport.mjs`; exhibition layout: `dist/home-exhibition.mjs`; click-only metal card: `dist/home-business-card.css` and `dist/home-business-card.mjs`. These are maintained directly and are not overwritten by the document renderer.

- Resting palette: paper `--paper: #f5f5f3`, ink `--ink: #292a27`, keyboard focus `--focus: #65685e`. There are no underlines or conventional link decorations. The car scene uses `--mechanical: #1d211f` with paper-colored lettering. The supplied portrait retains its own intentional blue monochrome palette. No shadows, gradients or permanent ornaments.
- Locally hosted Instrument Serif regular carries the entire sentence on one baseline. Only “Smart Chen” is italic. Font licenses live in `dist/assets/fonts/OFL.txt`.
- Desktop, including narrow desktop preview panels: the sentence is strictly one horizontal line (`white-space: nowrap`), centered in both axes, with type scaling from 12 to 64px using 3.48vw. All identity targets retain the same inline metrics in every interaction state.
- At phone widths (up to 700px with a coarse pointer), the same semantic sentence wraps naturally with no authored line breaks, sections or reordered words. Minimum target height is 44px.
- Protected interactions: the Smart Chen landscape portrait, its original blue colors, and the game hover system are unchanged. The original 6000 × 4000 selfportrait.jpg and its published copy remain byte-for-byte identical, enforced by SHA-256. Name styling, reveal geometry and interaction semantics are preserved. The bottom-anchored reveal now animates actual container height between zero and the original image height over 350ms, without a clip-path layer. At retraction end the entire portrait figure is detached, on both hover exit and the second click. A 375ms cleanup fallback handles cancelled/missing transition events. Re-entry cancels cleanup and reattaches the same figure/image. Resize measures the detached figure while hidden and immediately removes it again. No opacity fade or color treatment is added.
- Game design continues to use the original bouncing-ball/module physics and pointer response. The seed, collision and drawing function bodies were compared with the prior implementation and preserved.
- Clicking the Games link transfers the current positions, ball velocities, platform angles and trails into a separate 2.76-second simulation. After 200ms containment, quadratic boundary displacement gives constant acceleration: inward velocity increases linearly until both enclosure dimensions reach zero at 2.70s. A tiny center point occupies the last 60ms before directly entering Games. Bodies initially retain their dimensions and bounce against moving walls. Before density makes rigid-body separation impossible, their individual positions and momenta pass continuously into a damped inward flow; each object contracts at a slightly different rate, with no collision toggles or flashes during convergence. This eliminates the dense solver jitter without scaling the whole page. There is no expansion, outward explosion, color fade or loading treatment. The sentence is clipped by the closing enclosure only during navigation. The destination is warmed in an inert, inaccessible same-origin iframe and the final step performs normal URL navigation. Modified clicks, reduced motion, forced colors, and an unavailable preview retain native link behavior. Resize/background interruptions finish navigation; browser Back restores the quiet homepage with no transition canvas or captured animation loop.
- Photography is an exhibition of exactly four original 3:2 landscape files from `dist/photography-preview/`. Asymmetric coordinates and unequal sizes keep the prints away from the measured sentence band. Every image uses its full intrinsic ratio with `height: auto`: no crop, overlap, frame, shadow, caption or UI. Most of the wall remains empty. The source files are referenced directly and never re-encoded.
- Development lasts 2.6 seconds per photograph, staggered by 0 / 180 / 390 / 580ms. A temporary neutral contrast/brightness curve reveals shadow and tonal information from white; it does not animate opacity. Backwards-only animation fill makes the final computed filter `none`. This explicitly authorized development treatment applies only to exhibition prints, never to the Smart Chen portrait. The final exhibition is still and in the original colors.
- Cars owns a separate canvas and a 4.6-second one-shot timeline: ignition (0–0.7s), RPM build (0.7–1.15s), lights-out/launch (1.15–1.85s), shift (1.85–2.65s), redline (2.65–3.45s), chequered sweep (3.45–4.1s), settle (4.1–4.6s), then restrained continuous idle. Shift RPM drops, temporal spoke samples, rushing grid marks, curved racing line, kinetic gear numerals and one passing chequered ribbon belong to the same composition. Red `#f04432` is confined to starting lamps and redline markings. No sound or full-page flashes.
- The original black transition is retained. Every motorsport drawing is clipped away from the sentence's measured band. Leaving cars for the resting page fades the frozen machine over 380ms; a temporary paper strip keeps the sentence readable throughout. Entering another identity cancels that exit immediately, preserving the name/game behavior. Reduced motion goes directly to the static idle composition, with immediate exhibition prints. Nothing is added to the resting page.
- Games is a real link to the existing category. Photography and cars remain preview buttons; their click/tap behavior is unchanged. Hover/focus on the name still reveals only the original portrait. Clicking the name now pins the portrait and opens the physical business card described below. Escape, another name click or an outside press clears the card; card links are exempt from outside dismissal. All effects are available through keyboard focus.
- Reduced motion replaces the kinetic worlds with static drawings and skips development and typographic movement. Forced colors use system link/focus colors. Scrollbars remain operable, with tokens defined globally. Decorative photographic reveals are hidden from the accessibility tree.

Alternatives rejected: a permanently visible portrait made the image the headline; a four-line typographic layout violated the continuous horizontal sentence requirement. The accepted implementation keeps every added visual contingent on interaction and leaves the default canvas silent.

## Smart Chen click — anodized metal business card (2026-09-29)

The portrait remains the stationary visual anchor, with its existing hover reveal and original colors unchanged. On click, a thin silver business card slides horizontally out from behind the photograph's right edge over 840ms, with acceleration, deceleration and a one-pixel final settling movement. A fourteen-pixel overlap and layered occlusion place it physically behind the print. Pointer lighting starts only after the card settles. Direct keyboard/touch activation waits for the existing photograph reveal when necessary.

The card has exactly the supplied content: Smart Chen, 陈弘毅, Emory University '27, smartchen324@gmail.com, Résumé, Instagram. The links have two custom 10px northeast inline SVG arrows with a 1.15-unit currentColor stroke and no fill or Unicode arrow. The email is a mailto link; Instagram opens the supplied profile in a new tab. Résumé is explicitly unavailable placeholder navigation, inert on activation, omitted from the tab order, with an accessible unavailable label. No extra visible labels, biography, controls or prompts are added.

Material refinement: neutral silver titanium, perceived through light and thin manufactured depth. Runtime tokens remain owned by `.business-card-dock` in `dist/home-business-card.css`: substrate `--metal-body: #ededeb`, studio light `--metal-light: #ffffff`, print `--metal-ink: #30312f`, micro-etch `--metal-engraving: #555651`. Reflection-only hues are `--metal-cyan: #d1e3e6`, `--metal-violet: #ded5e8`, `--metal-gold: #e8dfcc`, mixed at 1.2–7.7% layer opacity and further attenuated by broad falloff. A broad studio reflection and elongated satin lobe share their position and roughness response; a nearly imperceptible subpixel grain softens the surface. A front plane at +1.25px depth and two perpendicular 2.5px side planes form the physical object. Side light and bottom light respond differently to the same source. Apple Card-inspired rounded corners use `--card-radius: 11 × --card-unit`, with a soft layered studio shadow plus 1.3px contact/AO blur. Side planes stop before the rounded corners; micron bevels retain crisp manufactured edges. No blue-gray base, visible scratch texture, chrome or rainbow bands. These finishes affect only the card.

Typography is Helvetica Neue / Helvetica / Arial: at a 296px card width, the primary name is 16px bold with title casing, education and links 11.5px, isolated email 12.5px. Name, education and email share a precise left alignment; bottom links occupy opposite edges. Source Han Sans SC regular supplies the 26px Chinese micro-etch at the upper right. The official Adobe font is locally subset to the three glyphs, with its license in `dist/assets/fonts/`; no remote font request is needed at runtime. The etch is 9% visible at rest, resolving to at most 60% as the studio light crosses it. Cursor lighting retains 105ms inertia, with at most 2°/2.8° tilt; pointer exit restores the resting orientation/light and stops the loop. The 840ms slide, photo occlusion and all other homepage interactions are unchanged. Reduced motion provides the accessible static card immediately; forced colors use system text/surface colors.

Landscape layouts derive card width directly from portrait width at a fixed 1.05 ratio, including the existing short-screen 170px portrait. Height remains width / 1.64; overlap scales with the portrait. The card's `--card-unit` scales typography and spacing with the object, so it cannot dominate a shrinking photograph. Vertical layouts retain the original readable 296–328px card below the sentence and the unchanged portrait above. Only an enclosure that cannot fit the pair uses the below fallback. Open-state geometry does not change the homepage sentence or portrait. Keyboard opening focuses the email after settling; Tab reaches Instagram, Escape closes and restores name focus. Repeated opening, interruption, resize and hidden-tab cleanup preserve a single material animation loop.

Click selection is remembered independently of temporary hover/focus previews. A pinned name restores the portrait and card together after leaving another identity; only explicit dismissal, another identity selection or Games navigation clears the card selection. Restoring a preview never reclaims keyboard focus.
