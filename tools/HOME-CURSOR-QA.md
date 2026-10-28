# Homepage adaptive pointer — 2026-10-27

Follow-up: the implementation now lives in `site-cursor.*`; the homepage files
are compatibility entries. See `SITE-CURSOR-QA.md` for the shared rollout and its
native-pointer exclusions. This original nine-group regression still runs.

The user selected a translucent frame around each complete identity, a light spot
that follows the real pointer inside the frame, a roughly 10px capture region,
and a small arrow capsule for contact-card links. Reference:
[Apple, Design for the iPadOS pointer (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10640/).

## Implementation

- `dist/home-cursor.mjs` progressively creates one decorative, inaccessible-to-input
  surface. Independent critically damped springs retain their current velocities
  when redirected. The free dot/pill tracks input directly after frame retraction.
- `dist/home-cursor.css` owns the padding shared by actual hit regions and frame
  geometry. All activations remain native; there are no synthetic clicks or link
  rewrites. Existing scene/card controllers and frozen archive editions are intact.
- The frame uses the homepage ink; cars use their existing pale ink. A soft white
  highlight follows the real pointer. Card-link capsules shrink on pointer-down.
- The cursor loop sleeps once settled. Leaving the viewport, keyboard navigation,
  blur, pagehide, pageshow, touch, reduced motion and forced colors restore the
  native cursor. State mutations release hidden movie/navigation targets even
  without further pointer movement. A failed module load leaves native behavior.

## Verification

- `node tools/validate-site.mjs`
- `node tools/test-home.mjs`
- `node tools/test-home-state.mjs`
- `node tools/test-business-card.mjs`
- `node tools/test-game-transition.mjs`
- `node tools/test-photo-transition.mjs`
- `node tools/test-motor-race.mjs`
- `node tools/test-figures-of-speech.mjs` — all 78 immutable archive payload hashes.
- Strict premium audit of `dist/`: zero findings. JSON stored in the task's
  visualization directory as `cursor-design-audit.json`.
- `node tools/test-home-cursor-browser.cjs` against the local static site, using
  the bundled Playwright package and installed Chrome. Set `PLAYWRIGHT_MODULE`
  to the package path, `CURSOR_PREVIEW_URL` to the preview origin, and optionally
  `CURSOR_QA_DIR` for screenshots/results. The default output is in the OS temp
  directory, outside the repository.

Browser checks cover the four full frame bounds and moving light; actual padded
hit-region clicks; clean release; rapid interrupted retargeting; every card link;
pointer-down feedback; native résumé new-tab activation; unchanged heading bounds;
Tab/Enter/Escape; movie playback and release; blur/viewport/page lifecycle cleanup;
at most one cursor RAF and none at rest; actual Projects navigation and Back;
dynamic motion/contrast preferences; 390px mouse and touch viewports; and failed
module loading. No cursor or unexpected page errors were captured. Chrome reported
two native CSS cross-document `InvalidStateError` cancellations ("ViewTransition
opt-in disabled"); the same message was reproduced twice with the new cursor
module blocked, and navigation/Back still succeeded. The browser regression records
this exact existing cancellation separately; all other page errors fail the check.
Screenshots were visually inspected
at 1440×1000 and 390×844, including the pale frame/light over the car scene.

Evidence: task visualization directory `home-cursor/` (`results.json`, plus dot,
name, games, photo, cars, link, narrow-mouse and touch PNGs). The first browser
pass exposed a disappearing-pointer edge when a scene removed a hovered node;
cleanup now listens to the document root's non-bubbling `pointerleave`.

The optional design-context CLI lint could not run because `npx` is unavailable
in this environment. The existing prose-format DESIGN.md change was reviewed;
the strict runtime design audit completed with zero findings.
