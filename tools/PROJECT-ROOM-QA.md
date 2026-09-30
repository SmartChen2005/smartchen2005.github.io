# Polaroid of Yesterday room — verification

Verified on 2026-09-29 using the static `dist/` site, served at `http://127.0.0.1:4173/`, and the Codex in-app Chromium browser.

## Automated checks

- `node tools/render-notion.mjs`: regenerated the GDD with its corrected parent link.
- `node tools/validate-site.mjs`: passed. All 35 source headings, 96 image occurrences, document text and source order remain intact; all existing asset checks pass.
- `node tools/test-project-room.mjs`: passed. Original photograph SHA-256, all four screen projection corners, eight mathematical viewport fits, local assets/destinations, new-tab link semantics, and iframe fullscreen permission.
- `node --check dist/games/polaroid-of-yesterday/room.mjs`: passed.
- `audit_project.py . --mode strict --output tools/premium-audit.json`: zero findings.
- `git diff --check`: passed.

## Desktop room measurements (before the narrow-screen redesign)

Every size below shows the full photograph at exactly 16:9, with computed black `rgb(0, 0, 0)` outside the scene and no document overflow. Screen corner errors are measured from the actual CSS homography, scene scale, and anchor against the photograph's coordinates.

| Viewport | Photograph | Maximum TV corner error |
| --- | --- | --- |
| 320 × 568 | 320 × 180 | 0.00002 px |
| 390 × 844 | 390 × 219.375 | 0.00620 px |
| 844 × 390 | 693.333 × 390 | 0.00741 px |
| 1440 × 900 | 1440 × 810 | 0.00742 px |
| 1920 × 1080 | 1920 × 1080 | 0.00012 px |
| 2560 × 1080 | 1920 × 1080 | 0.00012 px |
| 1600 × 400 | 711.104 × 399.990 | 0.00804 px |

The GDD sheet and Download Game never intersect at these sizes. The GDD, camera, and download entrances use native interactive elements with pointer cursors. Video actions are supplied entirely by YouTube.

## Interactions

- Tab reaches the GDD with a visible solid yellow focus outline. Enter opens the actual document; its brand link returns to the room.
- Download Game expands its anchored coming-soon note. Escape closes it, clears `aria-expanded`, and restores focus to the trigger.
- The iframe is visible immediately, with `autoplay=1`, `mute=1`, `controls=1`, `fs=1`, and `playsinline=1`. Muted autoplay was observed without activating the TV. There is no authored play cover, Watch trailer text, or extra Stop / YouTube / Fullscreen UI.
- The desktop video is inset uniformly by six calibrated pixels on all four sides. Clicking YouTube's native Enter full screen control was verified: at a 390 × 844 viewport the iframe fills 390 × 844 and its computed inset becomes 0px. No authored fullscreen or exit controls remain.
- Clicking the camera creates a second browser tab at the Photography route. Both placeholder illustrations and the original room image load. At 390px, every gallery image retains its intrinsic 16:9 ratio and the page has no horizontal overflow.
- Main and Photography screenshots were inspected. The temporary Photography test tab was closed; the main preview remains the deliverable.

## Placeholder ownership

- Replace the main iframe's `src` for the project trailer.
- Replace the clearly labelled screenshot/reference SVGs and add project photographs to the Photography page.
- No game archive or download URL was supplied. Download Game is explicitly marked coming soon and opens a status note; it does not download a fake file.
- Reduced-motion and forced-color CSS are provided. System-level accessibility preferences were not changed for testing.

The site is ready in the local workspace. This task does not publish or push it.

## Follow-up layout revision

- Great Vibes is locally hosted and licensed under the bundled SIL Open Font License. The title is one line; Game Designer is the only breadcrumb entry. The title, GDD and download entrance are higher on the wall. Photography styling and coordinates were preserved.
- Rechecked 320 × 568, 390 × 844, 844 × 390, 1440 × 900 and 2560 × 1080: full photograph, no overflow, positive spacing between title/GDD/download/camera, and identical six-pixel video insets on every side.
- GDD-to-download clearances range from 0.82px at 320px to 5.58px in the 1920px scene. Download-to-camera target clearances range from 3.73px to 44.90px.
- The YouTube player advanced to 0:41 on muted autoplay before any playback activation; its native Unmute control was observed. Its native fullscreen was separately exercised.

## Copy and narrow-screen revision

This revision supersedes the miniature room layout at viewport widths of 600px and below, following the user's explicit permission to prioritize readable information over the desktop arrangement.

- The GDD has just its title and “Inside the Game” footer. Photography describes “Screenshots · Concept photography · Concept art”; its accessible name still announces the new tab.
- The desktop TV mask extends two calibrated pixels up and left to cover the original photo's bright upper-left seam. Its remaining corners and six-pixel video inset are preserved.
- Narrow screens use one natural-height flow with the original full photograph, readable entrances, and a full-width native YouTube player. There is one copy of each link and one iframe across both layouts.
- At 390 × 844: title 39px, GDD 28px, Photography 24px, Download Game 22px, supporting text 14–15px. The photograph remains 16:9; no horizontal overflow. The player is 390 × 219.375 instead of the tiny TV-sized embed.
- Rechecked 320px, 600px, 601px, and 1440px widths without horizontal overflow. On mobile, the download status flows above the video with 28px clearance and Escape closes it. Native YouTube fullscreen expands to 390 × 844 and returns to the page correctly.
