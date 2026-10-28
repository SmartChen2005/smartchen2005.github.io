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
| Action | Buttons, summary, `role="button"`, action inputs, click handlers/author-declared `cursor: pointer` | Plain enlarged inverted circle, no center icon |
| Draggable | Native range inputs, `role="slider"`, authored `cursor: grab/grabbing/move`, `draggable="true"` | Capsule with a thin bidirectional arrow |
| Actual dragging | Native range pointer-down, owning component's pointer capture/grabbing state or native drag lifecycle | Tighter capsule and contracted bidirectional arrow |
| Text / editing | Actual rendered text fragments, text-like inputs, textarea, contenteditable, authored `cursor: text`, `data-cursor="text"` | Thin inverted vertical bar |

Actions and homepage identities use a plain 26×26px circle, a 13px radius and
an 88% inversion surface. There is no center icon. Navigation, photo previews
and draggable hover retain 34×26px capsules. Dragging uses 30×24px, a stronger
surface and a 25% smaller arrow. Pointer-down contracts ordinary pointers by
12%. Homepage attraction shadow/hotspot remains a separate background layer
beneath the lettering; one RAF owns both decorative layers.

The text bar is 2px wide, radius 1px and 90% inversion. Its height is
`max(24px, 1.1 × rendered font size)`, with no upper cap. The actual text node's
parent supplies the font metrics, including mixed-size nested spans; editor
fields use their own computed font. A selection press retains its starting bar
height until release. It has lower hover
priority than navigation, photo previews, actions and dragging, even when a
link's nested text declares `cursor: text` or `data-cursor="text"`. Native caret
hit testing plus text-fragment bounds distinguishes visible text from empty
layout padding and supports wrapped lines. Editor fields use the bar across
their editable area; the browser retains focus, caret, selection and typing.
During a native text-selection press the bar stays stable, including across
empty space, until release/cancel/blur. No selection or input events are changed.

Range inputs are recognized globally, including when their native CSS fallback
is `ew-resize`. Pointer-down enters the active drag presentation immediately;
the browser retains native thumb capture, value/input events and keyboard
behavior. The decorative cursor does not take capture or change slider values.

For a custom component, declare an intent on its actual interaction owner:

```html
<button data-cursor="zoom">Inspect the photograph</button>
<div role="button" tabindex="0" data-cursor="action">Open details</div>
<div data-cursor="drag">A custom draggable surface</div>
```

Supported values: `zoom`, `action`, `link`, `drag`, `text`, `native`. This is decoration,
not behavior: use accessible native controls where possible and implement the
actual action/keyboard/drag behavior in the component. A drag component retains
ownership of `setPointerCapture`, movement and release. The cursor observes
capture/loss/up/cancel/blur and does not synthesize clicks, take capture or block
events. A threshold-based carousel can show magnifiers on child photos until a
real drag starts, then hand off to the tightened drag state.

Authored CSS cursor declarations are mirrored into a private custom property,
preserving selectors, media/support/container/layer conditions and importance.
This lets the browser resolve intent even while the OS cursor is hidden. Normal
stylesheet loads, added styles and dynamic DOM/class/disabled changes are
observed. After direct CSSOM `insertRule` / adopted-sheet changes, dispatch
`document.dispatchEvent(new Event('site-cursor:refresh'))` to refresh the mirror.
Cross-origin stylesheet access failures
retain native semantics and explicit data-attribute fallback.

Native select/date/file/color controls, media/iframe surfaces, non-slider resize/crosshair/busy/custom-URL cursors and
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
