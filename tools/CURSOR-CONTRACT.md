# Global cursor interaction contract

This is a site-wide capability system, not a list of Gallery/Projects routes.
`dist/site-cursor-intents.mjs` owns intent detection; `dist/site-cursor.mjs`
owns decorative geometry, icons and pointer lifecycle; `dist/site-cursor.css`
owns contrast and presentation. New pages and dynamically inserted controls use
the same resolver without new route/class branches.

| Interaction | Automatic signals | Pointer |
| --- | --- | --- |
| Navigation | Native links, image-map links, `role="link"` | Arrow capsule |
| Photo/detail viewing | Image-file URLs, `data-preview`, `data-process-page`, `data-lightbox`, `data-zoom`, authored `cursor: zoom-in/zoom-out` | Magnifier capsule |
| Action | Buttons, summary, `role="button"`, action inputs, click handlers/author-declared `cursor: pointer` | Pointing-finger/tap capsule |
| Draggable | Authored `cursor: grab/grabbing/move`, `draggable="true"` | Open-hand capsule |
| Actual dragging | The owning component's pointer capture/grabbing state or native drag lifecycle | Closed-hand capsule, slightly tighter |

Standard capsules share 34×26px geometry, a 13px radius and an 88% inversion
surface. Dragging uses 30×24px and a stronger surface. Pointer-down gives press
feedback. Homepage identities keep their accepted attraction shadow/hotspot and
add a small tap icon above the hotspot, with the same contrast behavior.

For a custom component, declare an intent on its actual interaction owner:

```html
<button data-cursor="zoom">Inspect the photograph</button>
<div role="button" tabindex="0" data-cursor="action">Open details</div>
<div data-cursor="drag">A custom draggable surface</div>
```

Supported values: `zoom`, `action`, `link`, `drag`, `native`. This is decoration,
not behavior: use accessible native controls where possible and implement the
actual action/keyboard/drag behavior in the component. A drag component retains
ownership of `setPointerCapture`, movement and release. The cursor observes
capture/loss/up/cancel/blur and does not synthesize clicks, take capture or block
events. A threshold-based carousel can show magnifiers on child photos until a
real drag starts, then hand off to the closed-hand state.

Authored CSS cursor declarations are mirrored into a private custom property,
preserving selectors, media/support/container/layer conditions and importance.
This lets the browser resolve intent even while the OS cursor is hidden. Normal
stylesheet loads, added styles and dynamic DOM/class/disabled changes are
observed. After direct CSSOM `insertRule` / adopted-sheet changes, dispatch
`document.dispatchEvent(new Event('site-cursor:refresh'))` to refresh the mirror.
Cross-origin stylesheet access failures
retain native semantics and explicit data-attribute fallback.

Editing, media/iframe surfaces, resize/crosshair/busy/custom-URL cursors and
`data-cursor="native"` / `data-cursor-native` retain native ownership. Whole
specialized pages can opt out with `data-page-cursor="native"`. The SX-70 camera
document and immutable editions are excluded, and inert preview frames do not
initialize this controller. Keyboard, touch and motion/contrast preferences
retain their existing behavior.

Page templates include `siteCursorAssets(base)` from `tools/site-cursor.mjs`.
Run `node tools/render-site-cursor.mjs` for direct pages. The Pages workflow's
`test-site-cursor.mjs` rejects uncovered live pages, missing dependencies and
shared includes in dedicated/frozen pages. Browser regression includes a route
and selectors unknown to the resolver, late-created controls and dynamic CSS,
so future reuse is exercised rather than inferred.
