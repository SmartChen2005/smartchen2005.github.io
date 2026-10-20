# Shared Projects header verification

Verified 2026-10-19 for the Projects directory and all four project landing pages.

- Each page uses the same right-aligned VegShark.com / Projects / The Gallery order, typography and 56px link targets. The Gallery loads the original decorative Möbius outline asset. Source generators share one markup function and one stylesheet.
- Follow-up browser checks cover all five pages at 1440×810, 390×844 and 320×720. Both measured gaps match (32px / 12px / 10px respectively), all links fit, all original logo assets load, and the complete logo image fits vertically inside its mark frame. The room uses a fully transparent header with soft text and contour shadows; the rejected rectangular backing is removed. The phone room header flows above its title. The Gallery keyboard focus outline remains fully visible.
- Follow-up correction: the previous 48px anchor clipped the 54px image vertically. The new 100×56px mark frame contains the complete 54.67px-tall image; only empty horizontal SVG margins are cropped. Equal 32px desktop / 12px phone / 10px narrow-phone gaps now meet the visible logo edge. The contour is white on dark pages and black on light pages. The Polaroid navigation uses local text shadows and contour-shaped logo drop shadows over its bright window, with no background or generated backing element. Its image bounds and TV projection stay unchanged.
- At 320px the directory, VR, Battlefront and Polaroid have no horizontal overflow. Music Station retains its existing 330px device-model extent at this width; the same geometry was confirmed on the previous public version. Its new navigation fits inside the header.
- Passed `node tools/validate-site.mjs`, including published navigation labels and destinations; `test-vr.mjs`, `test-masb.mjs`, `test-music-station.mjs`, `test-project-room.mjs`, `test-game-transition.mjs`, `test-home.mjs` and `test-photo-transition.mjs` under `tools/`; and `git diff --check`.
- Strict design audit of `dist/`: zero findings. The repository-wide audit retains 16 existing findings in ignored Gallery source bundles and old test HTML, outside the deployed site. Raw JSON evidence is saved in this chat's visualization directory. No project DESIGN.md linter is configured.

Commit, push and Pages publication status are reported by the completing chat.
