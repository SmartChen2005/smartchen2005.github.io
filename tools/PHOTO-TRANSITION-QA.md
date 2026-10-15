# Photographer to Gallery entry — museum revision, 2026-10-14

The optional 3000ms entry now opens into an imagined European art museum. Native spatial geometry supplies an oculus, recessed dome coffers, fluted columns/capitals, layered arches, theatre galleries and balustrades, glazed entrance, portal layers and floor joints. The foreground stair outline is removed. Forward travel, pan, upward gaze and banking create depth-dependent motion; the originating viewfinder expands beyond the screen. The shared Mobius outline/title still docks into the measured Gallery masthead. The two transition wall photographs are removed.

Photographer hover/focus restores the original 2600ms darkroom development with 0/180/390/580ms delays. It settles to the unfiltered originals; reduced motion shows originals immediately. No Gallery content or image files change.

Foreground refinement (2026-10-14): removed the stair polylines identified in the user's screenshot, including their connecting side. A comparison with the previous geometry confirms all 815 other paths are identical. Site validation, transition, homepage and homepage state checks pass.

Arrival refinement (2026-10-14): native navigation now captures the complete Gallery preview after one final paint, with a 50ms fallback. The actual heading replaces the animation title, and pagehide keeps this frame intact. Homepage and Gallery index share a 160ms native cross-document handoff; other Gallery pages do not opt in. Reduced motion, forced colors and unsupported browsers retain their native fallbacks. Browser Back resets the homepage on pageshow.

Arrival checks: site, Gallery/document, homepage/state and transition suites pass, with a strict design audit reporting zero findings. Chrome exercised desktop entry, 390px keyboard entry, cold/native fallback and Back/re-entry. Temporary event diagnostics confirmed an outgoing `handoff` frame with preview opacity `1` and the drawing hidden; native entry confirmed the 160ms incoming transition with its cover loaded. Chrome automation sometimes skipped the incoming transition on the animated path; final-frame preservation also applies to that native fallback. Temporary diagnostics were removed. Physical Safari was not exercised.

## Verification

- Passed site validation, homepage and homepage state suites, Photographer transition geometry/lifecycle checks, Gallery and Mobius checks, JavaScript syntax and diff checks.
- The transition suite covers six viewport shapes; bounded architectural detail; finite projection and near-plane clipping; visible travel/banking; exact clicked-word origin and masthead docking; restored development; zero canvas wall photographs; native modifiers, keyboard, load/preferences, interrupted navigation, watchdog and Back restoration.
- Chrome inspected the actual entry and final Gallery URL. A temporary paused-frame preview using the same architecture renderer was used to inspect desktop and 390px detail/title balance, and removed before committing.
- Real keyboard focus reports `develop-print` and the fourth photograph's `0.58s` delay. Keyboard entry at 390px reaches the Gallery. No captured console errors/warnings. Temporary viewport override reset.
- Strict frontend audit has zero findings, saved in `tools/photo-transition-premium-audit.json`. No dependency or raster assets added. Physical touch devices were not exercised; reduced motion/forced colors and failure lifecycle are covered by the controller suite.

Homepage JavaScript and Photographer URLs use `20261014-smooth-arrival`; the shared handoff stylesheet carries the same revision. The architecture module retains `20261014-no-steps`, and the existing design stylesheets retain their revisions. Publish policy now follows the user's request: commit/push, briefly confirm the live update, then finish without extended Actions polling.
