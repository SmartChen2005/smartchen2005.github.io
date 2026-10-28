# Shared adaptive pointer — 2026-10-27

## Plain action circles and global range dragging — 2026-10-28

The user replaced action capsules/center dots with a plain enlarged inverted
circle. Buttons and all four homepage identities now use 26×26px, 13px radius,
88% inversion and no center glyph. Navigation arrows, image magnifiers and drag
arrows retain their existing shapes. Word attraction/shadow remains separate.

Range inputs and `role="slider"` are global drag intents, overriding their
resize fallback while custom cursors are active. A native range press starts
the tightened drag pointer immediately; the browser still owns thumb capture,
value/input events, constraints and keyboard adjustment. No slider-specific
Music Station markup/controller changes or synthetic input events are needed.

Browser regression covers actual Music slider hover, native value change while
dragging, outside bounds/release, ArrowLeft adjustment and keyboard exit, plus
a range input with `ew-resize` on the unknown future-page fixture. Actual circle
pixels and all four homepage geometries are checked as before.

Current evidence: `circle-site/`, `circle-home/`, `circle-audit.json`; shared
revision `20261028-circles`. Earlier sections below describe past iterations.

All 16 Pages Node checks, 22 live routes plus the unknown future route / ten
browser groups, nine homepage groups and strict dist audit passed. No unexpected
page errors; immutable camera/edition payloads remain intact. Chrome's native
range thumb computes `cursor: none` while the shared drag pointer is active.

## Unified capsules and minimal cues — 2026-10-28 correction

The user rejected the detailed hand icons and the homepage's icon-only variant.
The shared foreground cursor now uses the same 34×26px / 13px-radius / 88%
inversion capsule for navigation, photo details, actions, drag hover and all four
homepage identities. Navigation/magnifier glyphs are retained; actions use one
4px center dot, and draggable surfaces use a thin bidirectional arrow. Actual
dragging contracts the capsule to 30×24px with 96% inversion and tightens the
arrow by 25%. Ordinary press contraction remains 12%.

Homepage gray shadow/hotspot lives in `.site-cursor-attraction` below the word;
the foreground capsule follows the real pointer above the word with difference
blending. One RAF owns both layers. There is no separate homepage icon and no
hand glyph. The global intent resolver, native camera/edition exclusions and
component event/capture ownership remain unchanged.

Verified: all 16 Pages Node checks, 22 live routes plus an unknown future route /
ten browser groups, all nine homepage groups, all 78 immutable hashes, renderer
idempotence and strict dist audit with zero findings. No unexpected page errors.
Active-drag pixel comparison uses stable dark paper outside the animated room;
the actual room screenshot separately records the moving device and arrow.

Current evidence: `unified-site/`, `unified-home/`, `unified-audit.json`; shared
revision `20261028-unified`. Browser assertions check actual visible inverted
capsule pixels on a homepage identity, modal button, draggable hover and active
drag, with geometry checks for all four homepage words. Earlier sections below
document superseded iterations.

## Global semantic actions and two-state dragging — 2026-10-28

The user clarified that the cursor is global, including Projects and future
pages. The shared resolver now uses native control semantics, image URLs,
preview attributes and authored CSS cursor declarations, with no Gallery/route
branches. CSS declarations are mirrored into a private property to preserve
their cascade while the OS cursor is suppressed. `tools/CURSOR-CONTRACT.md`
documents the automatic signals, explicit API and native ownership rules.

Action controls now use a pointing-finger capsule. Homepage identities add the
accepted small tap hint above their existing hotspot. Draggable surfaces use
an open-hand capsule; actual capture/grabbing changes it to a closed-hand,
slightly tighter capsule. The component retains all movement/capture/event
ownership. The cursor releases on up, cancellation, capture loss, blur and page
lifecycle. Hover/disabled/CSS changes update without a page-specific reinstall.

Verification: all 16 Pages Node checks passed; full-site Chrome QA passes
**22 live routes plus an unknown future route / ten browser groups**; homepage
QA passes all nine groups, including single/idle RAF checks. Existing actual
pixel checks still prove gray-shadow/hotspot visibility and inverted Résumé
glyphs. Added actual Battlefront and Music Station preview openings, live
Music device displacement, open/closed hand state, continued capture outside
the device region, cancellation recovery and native 404 object grabs.

The future fixture has no known page/class selectors and tests semantic links,
image URLs, actions, late-created controls, live/important CSS cursor changes,
inline grab styles, disabled states, actual capture-based dragging and explicit
native opt-out. No unexpected errors; existing Chrome transition cancellations
remain separately recorded. Strict dist audit has zero findings. Camera and
all 78 immutable hashes remain preserved.

Current task-local evidence: `intent-site/`, `intent-home/`, `intent-audit.json`,
including open/closed-hand, modal, narrow and homepage screenshots. Shared asset
revision: `20261028-intents`. Earlier sections record superseded iterations.

## Wider, softer identity shadow — 2026-10-28

At the user's request, widened the shadow with an explicit 70%/65% ellipse and
an 8%-to-90% fade. Added 6px blur and 20px vertical feathering to the shadow
layer only. Gray weight remains 15%; the moving hotspot, lettering, hit regions
and inverted/photo capsules retain their existing behavior.

Passed site validation and all 16 Pages Node checks, the existing eight browser
groups across 22 routes (including visible shadow/hotspot and inverted-text
pixel assertions), nine homepage groups and strict dist audit (zero findings).
Desktop/narrow screenshots were inspected. Evidence: `wide-shadow-site/`,
`wide-shadow-home/` and `wide-shadow-audit.json` in the task visualization
directory. Shared asset revision: `20261028-wide-shadow`.

## Shared capsules, homepage inversion and visible shadow — 2026-10-28

The user clarified that photo details should use the **same filled capsule as
navigation**, with only the icon changed. Photo and link states now share one
34×26px / 13px-radius / 88%-fill definition. The magnifier is a 16px icon inside
that capsule and shares its press feedback and difference blending.

The homepage's blanket normal-blend override caused its contact capsules to
obscure lettering. Free dots and contact links now use the shared white
difference-blended surface and black icon cutout. Normal blending is scoped to
identity attraction only, at z-index 2 beneath the sentence's z-index 3. It uses
a word-anchored 15% gray elliptical shadow and a pointer-following 18px pale
hotspot. Letter shapes stay untouched above both layers. The rectangular fill
and edge remain zero. This supersedes the earlier almost-invisible 4.5% glow.

Current checks pass: all 16 Node commands from the Pages workflow; additional
Gallery/Stills checks; 78 immutable hashes; VR/MASB source parity; strict dist
audit (zero findings); 22 live routes / **eight browser groups**; and the nine
homepage browser groups. The browser checks now verify capsule dimensions,
an actual gray backdrop at least 10 luminance units below paper, a pale hotspot
at least 15 units above its gray backdrop, and actual Résumé glyph pixels
brightening under the inverted capsule. These assertions check visible pixels,
not only configured opacity or blend properties. Existing Chrome native
transition cancellations remain recorded separately.

Current task-local evidence: `shadow-site-cursor/`, `shadow-home-cursor/`,
`shadow-cursor-audit.json` and inspected `shadow-name.png`, `shadow-resume.png`,
`shadow-magnify.png`. Asset revision: `20261028-shadow`. Windows CRLF includes
are recognized without rewriting an already-current page.

The sections below record earlier iterations.

## Photo magnifier and borderless attraction — 2026-10-28

The user selected a magnifying glass for photo details and **borderless soft
light** for homepage attraction. Gallery editorial and numbered-index
`.story-image-open` anchors plus Stills `.print-link` anchors now receive a
28px fine-line magnifier; project/cover navigation still uses the arrow capsule.
Existing photo viewers open/close normally and keep focus, Escape and native
links. The icon has no plus sign and scales on press.

The homepage attraction region still matches the real 10px hit padding, but its
rectangular fill and outline are both zero. A local 4.5% ink glow and soft white
hotspot track the pointer, with feathered boundaries. Text geometry stays fixed.
Both layers animate independently of the dot's fill so release does not flash a
gray rectangle. The camera and immutable editions stay excluded.

Current verification: `validate-site`, pointer coverage, Gallery, Stills,
Figures of Speech (78 payload hashes), VR/MASB source parity, syntax and strict
dist audit all passed. The updated full-site browser check passes all 22 routes
and **seven groups**, including actual editorial/index/Stills viewer clicks and
Escape/re-entry. The original nine homepage groups also pass, now explicitly
asserting zero fill/outline and active soft light on all four identities.
No unexpected page errors; the previously documented native Chrome transition
cancellations remain separately recorded.

Current task-local evidence: `refined-site-cursor/` and
`refined-home-cursor/` (results JSON and inspected screenshots), plus
`refined-cursor-audit.json`. Shared asset revision: `20261028-glow`.

The earlier rollout record below describes the initial shared implementation.

The user requested coverage of all pages except dedicated pointer experiences,
with pale default pointers on dark backgrounds. This extends the accepted
homepage design; it does not change the archived experiments.

## Ownership and coverage

- `dist/site-cursor.mjs` / `dist/site-cursor.css` own the shared controller and
  visual styles. `home-cursor.*` remain small compatibility entries, sharing the
  same code while retaining homepage identity frames and accepted scene inks.
- The shared dot/navigation capsule uses white ink with `mix-blend-mode:
  difference`. Contrast follows the actual painted background without image
  sampling or a continuous animation loop. Native action controls use a 22px dot.
- All 22 live pages are connected. The live camera GDD and nine HTML pages in
  immutable editions are excluded. Their files remain unchanged.
- Forms/editable regions, media controls, iframes, existing grab surfaces and
  the 404's object-grab state retain native cursors. Future pages/regions can use
  `data-page-cursor="native"` / `data-cursor-native` for explicit ownership.
- The decorative pointer enters a native modal's top layer and returns to body
  after closing. Entering iframe content releases the parent's pointer. Hover
  changes caused by keyboard navigation cannot re-enable cursor replacement.
- Gallery/Stills/shared project-header templates consume `tools/site-cursor.mjs`.
  `render-site-cursor.mjs` fills direct-page includes without rewriting template
  output. 404 references are root-relative. `test-site-cursor.mjs` runs in Pages
  validation to prevent missing includes or custom-pointer collisions.

## Checks performed

- Full `node tools/validate-site.mjs` and every Node check currently configured
  in `.github/workflows/pages.yml`, including live/preserved camera checks and all
  78 frozen payload hashes.
- Additional Gallery, Stills and game-transition checks; VR/MASB source/render
  parity; syntax and Git whitespace checks.
- Strict premium audit of `dist/`: zero findings. Evidence:
  `site-cursor-design-audit.json` in the task visualization directory.
- `node tools/test-site-cursor-browser.cjs`: all 22 live routes and six browser
  groups pass. Actual screenshot pixels verify pale dots against Projects and
  Polaroid room black backgrounds and a dark dot against Gallery white. Native
  modal visibility/closure, iframe handoff, Music Station grab/range controls,
  editing, reduced motion, forced colors, SX-70 ownership, 390px mouse, keyboard
  and touch navigation are exercised. No unexpected page errors.
- `node tools/test-home-cursor-browser.cjs`: original nine browser groups pass
  against the shared controller. Existing Chrome cross-document transition
  cancellation messages remain separately recorded as described in
  `HOME-CURSOR-QA.md`.

For browser reproduction, set `PLAYWRIGHT_MODULE` to an installed Playwright
package, run the static site at `CURSOR_PREVIEW_URL` (default
`http://127.0.0.1:4185`), and optionally set `SITE_CURSOR_QA_DIR` /
`CURSOR_QA_DIR`. The full-site check also uses `sharp` alongside the bundled
Playwright package for screenshot-pixel assertions; `SHARP_MODULE` may override
its location. No dependency was added to the production site.

Task-local evidence is in `site-cursor/` (`results.json` and representative
desktop/modal/camera/narrow PNGs), plus `site-home-cursor/` for homepage
regressions. Screenshots were visually inspected. Design context remains in its
existing prose format; the standalone designmd CLI is unavailable because this
environment has no npx installation.
