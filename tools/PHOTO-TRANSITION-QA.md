# Photographer to Gallery entry — museum revision, 2026-10-14

The optional 3000ms entry now opens into an imagined European art museum. Native spatial geometry supplies an oculus, recessed dome coffers, fluted columns/capitals, layered arches, theatre galleries and balustrades, glazed entrance, portal layers, floor joints and steps. Forward travel, pan, upward gaze and banking create depth-dependent motion; the originating viewfinder expands beyond the screen. The shared Mobius outline/title still docks into the measured Gallery masthead. The two transition wall photographs are removed.

Photographer hover/focus restores the original 2600ms darkroom development with 0/180/390/580ms delays. It settles to the unfiltered originals; reduced motion shows originals immediately. No Gallery content or image files change.

## Verification

- Passed site validation, homepage and homepage state suites, Photographer transition geometry/lifecycle checks, Gallery and Mobius checks, JavaScript syntax and diff checks.
- The transition suite covers six viewport shapes; bounded architectural detail; finite projection and near-plane clipping; visible travel/banking; exact clicked-word origin and masthead docking; restored development; zero canvas wall photographs; native modifiers, keyboard, load/preferences, interrupted navigation, watchdog and Back restoration.
- Chrome inspected the actual entry and final Gallery URL. A temporary paused-frame preview using the same architecture renderer was used to inspect desktop and 390px detail/title balance, and removed before committing.
- Real keyboard focus reports `develop-print` and the fourth photograph's `0.58s` delay. Keyboard entry at 390px reaches the Gallery. No captured console errors/warnings. Temporary viewport override reset.
- Strict frontend audit has zero findings, saved in `tools/photo-transition-premium-audit.json`. No dependency or raster assets added. Physical touch devices were not exercised; reduced motion/forced colors and failure lifecycle are covered by the controller suite.

Homepage resource URLs use the `20261014-museum-entry` revision; the Photographer module also has its own revision to avoid reuse of the earlier transition. Publish policy now follows the user's request: commit/push, briefly confirm the live update, then finish without extended Actions polling.
