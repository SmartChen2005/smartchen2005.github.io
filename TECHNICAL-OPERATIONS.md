# Technical Operations Standard

## Purpose

This repository is the source of truth for the **Polaroid of Yesterday** web archive. The published website is generated as static files in `dist/` and is deployed to GitHub Pages from the `master` branch.

本文件规定项目的存档（存档 / archive）、更新摘要（summary）和 GitHub 上传（upload）标准，确保每次修改都可追溯、可复现，并且能及时上线。

## Repository map

- `tools/notion-source.md` — source document for visible content.
- `tools/render-notion.mjs` — renderer that generates the static document.
- `tools/validate-site.mjs` — local integrity and source/render parity checks.
- `dist/index.html` — deployable website entry point.
- `dist/assets/` — shared site assets such as the portrait and fonts.
- `dist/projects/polaroid-of-yesterday/game-design-document/assets/` — image assets owned by the Polaroid of Yesterday document.
- `DESIGN.md` — visual and content-preservation constraints.
- `tools/gallery-notion/`, `tools/gallery-document.mjs`, `tools/render-gallery.mjs` — Notion content snapshots, native media mappings and the shared editorial article renderer.
- `tools/sync-gallery-notion.mjs`, `tools/GALLERY-NOTION-SYNC.md` — Read-only Notion export, local watcher and setup instructions.
- `dist/gallery/` — Gallery homepage, photography/film articles, shared exhibition styles and local media.
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow.

## Standard update cycle

`AGENTS.md` is the entry point for all project chats. The user has authorized agents to summarize, commit, push, and verify publication after each completed update without asking again, unless the current task explicitly requests local-only work. Use Git CLI; opening GitHub Desktop is optional. Commit only the current task's changes and preserve work from other chats.

Every update MUST follow this order:

1. **存档 / Archive** — before editing, preserve the current source, assets, and relevant configuration in Git history. For source imports or generated content, record the origin and date in the corresponding file or update note. Never rely on an external URL as the only copy of an asset.
2. **修改 / Update** — make the smallest coherent change. Keep visible document content sourced from `tools/notion-source.md`; keep generated output in `dist/` synchronized with the source.
3. **验证 / Validate** — run the project validation command below. Confirm that all referenced local assets exist and that the rendered headings, text, and image order still match the source.
4. **摘要 / Summary** — write a short update summary in the commit message. The summary must state what changed, why it changed, and how it was verified. If the update is substantial, add a dated entry to this document's change log.
5. **提交 / Commit** — commit the complete update as one logical unit. Do not leave generated output, source changes, or required assets uncommitted.
6. **上传 / Upload** — push the commit to `origin/master` immediately after a successful commit. A local-only update is not considered complete.
7. **上线确认 / Confirm publish** — do one brief publication check and open the public URL to confirm the updated feature works. Following the user's 2026-10-14 clarification, finish after that check instead of repeatedly polling Actions or concurrent Notion runs. If publication is still pending or unavailable, report that actual state with the run link.

### Required commands

```powershell
# From the repository root
node tools/validate-site.mjs
git status --short
git add -- <explicit-files-for-this-update>
git commit -m "Describe the update and its purpose"
git push origin master
```

For a source change that requires regeneration:

```powershell
node tools/render-notion.mjs
node tools/validate-site.mjs
```

Do not use `git add -A` blindly when unrelated files are present. Review `git status` and `git diff --stat` first, then stage the intended complete update.

## Commit summary standard

Use a concise imperative subject, for example:

```text
Publish refreshed game design archive
```

The commit body should answer:

- **What:** files or content changed.
- **Why:** the user or product reason.
- **Verified:** the validation command and deployment check performed.

## Archive standard

Git history is the primary archive. Each meaningful update must retain:

- the original source or source reference;
- the generated site output required to reproduce the published page;
- local copies of all assets used by the page;
- the validation or rendering tool needed to check the output;
- the commit summary explaining the change.

If an asset is replaced, keep it beside the document or page that owns it, update the source reference or renderer mapping, and verify that no expiring external asset URL remains. Do not delete a prior asset unless it is unused and the removal is explicitly documented in the commit summary.

## GitHub Pages standard

- Canonical repository: `https://github.com/SmartChen2005/smartchen2005.github.io`
- Deployment source: `master` push, via `.github/workflows/pages.yml`.
- Published directory: `dist/`.
- Expected public URL: `https://smartchen2005.github.io/`
- Confirm that the public URL returns the current, working update. Check the workflow result when readily available; do not prolong the task with repeated deployment polling. Report pending or failed publication accurately.

The workflow intentionally deploys the existing `dist/` directory as-is. This keeps the repository's source and generated output layout stable while making the GitHub Pages publication explicit and repeatable.

## Current baseline

At the time this standard was added, the repository contains the complete current static archive, its local image assets, the Notion source, the renderer, the validator, and the design context. The baseline is published by the commit that adds this document and the Pages workflow.

## Change log

### 2026-10-19 — Unify Projects navigation

- The directory and all four project landing pages share right-aligned VegShark.com, Projects and The Gallery links, reusing the Gallery's original Möbius wordmark asset.
- Follow-up: contain the complete logo vertically, measure equal gaps from its visible edge, and give Polaroid's navigation white artwork with soft shadows around its text and logo. The rejected rectangular backing is removed. Desktop, phone and landscape checks are recorded in `tools/PROJECT-HEADER-QA.md`.
- `tools/project-header.mjs` and `dist/project-header.css` own the shared component. After navigation changes run `node tools/render-project-headers.mjs`, `node tools/render-vr.mjs` and `node tools/render-masb.mjs`; keep all generated landing pages synchronized.
- Site validation checks the published link order and destinations across the directory's project routes. Browser and publication results are reported by the completing chat.

### 2026-10-19 — Expand meaningful VR interaction studies

- Removed the purposeless hero geometry; kept the compact title and assignment directory. Moved each interaction study before its project description and video.
- Replaced the small symbols with large explanatory SVG drawings: continuous jack/wrench/star-pattern/lift/rack actions, and a three-stage garage/store/garage loop with purchases, storage and tool reuse. Increased stage reading distance and eased diagram response without changing native scrolling.
- Verified desktop/phone wheel input, reverse progression, complete rack/storage states, long-lived keyboard selection, five responsive widths, reduced-motion/forced-color/no-JavaScript modes, original PDF responses and actual video playback. Source/render, site and route audit results are recorded in `tools/VR-QA.md`.

### 2026-10-19 — Tighten VR opening and connect studies to scrolling

- Reduced the VR cover to a compact two-line heading and smaller animated geometric mark, retaining its directory and bringing the first assignment into the opening viewport.
- Paired authored procedural/environment paragraphs with sticky SVG diagrams. Native scrolling selects and reverses states, fills progress and moves the spatial marker along its path; manual, keyboard, reduced-motion and no-JavaScript access remain available.
- Verified real wheel progression/reversal on desktop and phone, sticky placement, manual override, five viewport layouts, original PDF responses and actual playback of both videos. Source/render integrity, site validation and route strict audit pass; baseline ignored-archive audit findings remain documented in `tools/VR-QA.md`.

### 2026-10-19 — Add VR for Skill Learning collection

- Added the fourth Projects entry and a single modernist editorial parent page for Wheel Removal Training and Garage Ready, with two YouTube demonstrations and the original public PDF design documents.
- Archived the supplied brief, extracted source text and document checksums; concise modular assignment data and a deterministic renderer own the new route. Added small keyboard-operable procedure and spatial navigation diagrams, no-JavaScript notes, responsive media and motion/contrast fallbacks.
- Run `node tools/render-vr.mjs`, `node tools/test-vr.mjs` and `node tools/validate-site.mjs` for this route. The new source/asset integrity check also runs in Pages CI. Browser coverage and external playback limits are recorded in `tools/VR-QA.md`; commit/push/publication results are reported by the completing chat.

### 2026-10-15 — Fix Gallery media sizing and sync Rhythms

- Bound compact Photography images to their reserved frames without cropping; initialized Film embeds eagerly and retained their referrer policy and direct viewing links.
- Synced eleven current Rhythms of Chaos photographs and their latest Notion order, adding two local 1024px image renditions. Source snapshots, native asset mappings and generated pages are synchronized.
- Verified actual YouTube playback, desktop rail bounds and new-photo viewer navigation; Gallery regressions, site validation and the deployed-source strict audit pass. Browser coverage and source-resolution limitations are recorded in `tools/GALLERY-QA.md`.

### 2026-10-15 — Preserve original Darkroom carousels

- Restored Lightroom's four-photo comparison and Enlarger's two-photo comparison as carousels, matching their original Google Sites groups. Ordinary photo grids remain in their authored arrangements.
- Reused the Film carousel's buttons, keyboard access, native scrolling and original-image viewer; shared its CSS with photography routes. The chapter directory and sixteen Darkroom photographs remain intact.

### 2026-10-15 — Add chapter navigation and correct Film compositions

- Added a CMS-driven chapter directory and return links to Intro to Darkroom, sharing Deliberate Practice's behavior while retaining the original photograph sizing and order.
- Compared all five Film details with the live originals; restored their authored opening compositions, player dimensions, credit alignment and backstage carousel arrangement. Poster covers remain on project cards.
- Verified source-content preservation, directory targets, photograph order, carousel controls and desktop/mobile previews; added the layout regression check to Pages CI.

### 2026-10-15 — Recover missing Gallery carousel photographs

- Restored 13 Google Sites CSS carousel photographs to their original positions in Darkroom, Gorilla in the Studio and Rorschach’s Mask. Uploaded them as native Notion files and verified page readback before rebuilding the website.
- Preserved original JPEGs, optimized WebPs, source order, hashes and native asset identities; added an explicit carousel extraction tool and regression verification. All active Gallery projects now have their original photograph references resolved.
- Verified Gallery document/rendering tests, carousel recovery integrity and the site validator. Publication status is reported in the completing chat.

### 2026-10-14 — Remove The Life of a Poser (Skater)

- Confirmed the corresponding Notion page (`3f8abc37-a86f-81ee-b75f-f0687af09fbb`) is already deleted, then removed it from the active content snapshot and article layout configuration.
- Regenerated the Gallery index, article routes and related-project links: twelve CMS projects remain, with seven photography series and five films; the separate Stills exhibition brings the homepage total to thirteen.
- Kept original source/media archives for recovery. Gallery checks now follow active CMS routes and verify removed projects leave no public article or homepage entry.

### 2026-10-14 — Smooth the Gallery arrival

- Keep the finished Gallery preview visible through native page navigation, restore its real masthead and allow a final paint before the browser captures it.
- Share a short cross-document handoff between the homepage and Gallery index. Preserve the three-second architectural animation, native links/history, reduced-motion and forced-color fallbacks.
- Cover final-frame preservation, interrupted arrivals, a bounded paint watchdog and Back restoration in the existing transition suite. Publication status is reported after pushing.

### 2026-10-14 — Sync updated Rhythms of Chaos images and text

- Refreshed the live Notion content to nine photographs and “Street Photography with a 28mm Leica Q”; retained the number-only Index layout and the user's independent cover selection.
- Imported five new 2048px Notion image exports, retaining their native source identities and checksums. Existing source files remain archived.
- Validated current CMS image order, local assets and article text; removed the Index route's obsolete dependency on its original five-photo archive fixture.

### 2026-10-14 — Numbered Rhythms of Chaos image index

- Applied the Polaroid Index grid to the series' five photographs, preserving their order and full proportions, with number-only captions and viewer labels.
- Kept the project introduction, byline, original links and shared viewer. Added a route-specific stylesheet and generator variant; Notion source content and other pages remain intact.
- Passed site, Gallery and document checks, strict design audit, desktop/phone layout review and viewer navigation/focus checks.

### 2026-10-14 — Replace the Gallery header cornice

- Removed the rejected header cornice and its horizontal rules; added a small vaulted doorway beside the existing wordmark, echoing the approved footer drawing.
- Preserved the footer and project content, regenerated all fourteen Gallery pages and refreshed the stylesheet revision. The doorway is decorative and hidden below 1024px.
- Passed site, Gallery, Möbius and transition checks, strict design audit and responsive browser checks at 320px, 1024px and 1440px.

### 2026-10-14 — Quiet architectural frame for The Gallery

- Extended the museum entry's aesthetic with a fine header cornice and a small static exhibition-room drawing at the footer, shared across the Gallery homepage and articles.
- Regenerated the fourteen pages and local SVG; preserved the wordmark geometry, authored project content and natural photographs. Simplified the header accent on phones and hid decorative linework in forced colors.
- Passed site, Gallery content, Möbius and entry-transition checks, strict design audit, and desktop/390px/320px browser layout review.

### 2026-10-14 — Richer museum entry and restored photographic development

- Restored Photographer hover's original darkroom development timing and stagger; removed the two wall photographs from the clicked transition.
- Replaced the spare room with a spatial museum drawing: coffered dome and oculus, fluted colonnades, moulded arches, balconies and balustrades, glazed entrance, portal layers and inlaid floor. A forward camera movement adds pan, upward gaze, banking and depth-dependent parallax while retaining the three-second wordmark handoff.
- Updated geometry/lifecycle checks and recorded the user's simpler publish policy in AGENTS.md: publish, briefly confirm the live feature, then finish without extended deployment polling.

### 2026-10-14 — Architectural Photographer to Gallery transition

- Added a three-second entry sequence: Photographer viewfinder corners open into a line-drawn exhibition with an oculus, real photography prints and the existing Möbius outline, then dock the title and mark into the Gallery's measured masthead.
- Refined Photographer hover/focus with original-tone photographs, quiet corner marks and a Gallery label. Preserved native links and direct-navigation fallbacks, keyboard/touch entry, reduced motion, forced colors and Back restoration.
- Added deterministic geometry/lifecycle and homepage state checks. Browser verification, static audit, commit, synchronization and publication results are recorded in `tools/PHOTO-TRANSITION-QA.md` and the task completion report.

### 2026-10-14 — Restore original Film index covers

- Restored the original title-bearing covers for Cursed Stage 戏怨, Gorilla in the Studio, The Common Things and Rorschach’s Mask. Morning Unwoken already matches the original Film index and retains its forest cover.
- Reused archived original/WebP assets and their existing native Notion uploads. Updated Notion Cover image, legacy Cover and page banner; read back selections and confirmed all affected page bodies remain unchanged before exporting.
- Regenerated the Gallery homepage, article covers and related-project cards. Verification and publication status are recorded in the task completion report.

### 2026-10-14 — Compact Gallery index and outline wordmark

- Reduced the four right-hand Photography entries to fit a desktop viewport while retaining the left-hand composition and uncropped image ratios.
- Replaced the active WebGL wordmark with a static, unfilled SVG contour drawing. Kept the earlier filled asset and model modules archived; Gallery no longer imports the 3D runtime.
- Updated shared Gallery navigation/footer branding to VegShark.com and ordered category navigation Photography / Stills / Film.
- Verified Gallery/document/outline tests, site integrity, syntax, desktop/phone browser layouts and strict design audit. Commit, remote synchronization and Pages status are reported after publication.

### 2026-10-14 — Gallery reading, portrait scale and solid wordmark

- Replaced the former header arrow and thin projected band with a rounded, thick WebGL Möbius solid, using shared geometry for its static fallback. Retained the native home link and existing Gallery art direction.
- Preserved the completed Notion-driven Chinese/English reading switch for Analog & Digital. Increased that article's portrait prints and Deliberate Practice's cover/portrait sections while retaining original ratios and authored groups.
- Removed Deliberate Practice chapter parentheses and linked every heading back to its contents. Updated Morning Unwoken to its third photograph in Notion and the generated homepage; synchronized private layout notes and verified exports.
- Verified Gallery/source-content tests, solid geometry, site integrity, JavaScript syntax, strict design audit, and real desktop/mobile browser behavior. Deployment status is recorded in the task completion report.

### 2026-10-12 — Correct Stills image classification

- Applied the user's clarification: every current Stills image is a game screenshot; concept photography will be supplied separately.
- Corrected all twenty media labels, the current page introduction, metadata, original-image wording and the project-room Stills caption. The renderer now derives its category description from the actual collection.
- Preserved image files, order, dimensions and viewing modes. Verified generated labels, original links and existing site/project integrity checks.

### 2026-10-12 — Apply the SSENSE photography guide to Stills

- Applied the user-selected `style/ssense-photography-style-guide.md`: pure white, neutral ink, Helvetica navigation/headlines, an editorial serif introduction and readable 12–13px captions.
- Replaced decorative print borders, shadows, fading and hover motion with original-tone photographs. The catalog now uses uncropped 3:4 contain slots, four/three/two responsive columns and shared image/title links.
- Retained the explicitly specified 3D spiral while removing roll, angular drift and camera inertia; shortened the continuous mode change to 240ms and simplified focused viewing.
- Verified responsive columns, caption geometry, keyboard/modal behavior, reduced motion, stationary hover, touch targets, simulated 200% zoom, forced colors and image fallbacks, plus existing site/project validation. See `tools/STILLS-QA.md`.
- Prepared locally for review; no remote publication was requested.

### 2026-10-12 — Stills photographic exhibition

- Replaced the Stills placeholders with twenty images from the local Polaroid archive, using uncropped optimized display copies and direct full-resolution originals.
- Added a genuine CSS 3D vertical helix, native scroll camera movement, continuous rearrangement into an asymmetric gallery, and a shared accessible focused viewer.
- Added an editable collection manifest, deterministic page/asset preparation tools, responsive and reduced-motion behavior, offline/no-JavaScript fallbacks, and image-load recovery.
- Verified spatial geometry and original ratios across seven viewport shapes; Chrome desktop/mobile/landscape interaction and visual checks; source/document validation; original room checksum; strict design audit. Details are in `tools/STILLS-QA.md`.
- Prepared locally for review; no remote publication was requested.

### 2026-10-09 — Preserve the 404 hero when clearing

- Removed the detached arrow from Back to Home.
- Clear now preserves the original 404 sign's current position and orientation, removing only other props with a quick procedural cloud puff and fade.
- Added bounded cloud/resource cleanup, safe repeated Clear/Add, hidden/fallback cleanup and immediate removal under reduced motion.
- Verified Chrome desktop/mobile Clear, exact hero-pose retention, cloud lifecycle, rapid actions and the existing interaction suite. Prepared locally for review.

### 2026-10-09 — Lively 404 motion and orange roadblocks

- Added spring dragging, release inertia, mass-dependent collision impulses, glancing rotation and small wall rebounds over the existing transactional contact solver. Damping settles motion without jitter; Clear restores the lone hero too.
- Made all cones, striped barriers and warning posts orange, removing the yellow-cone variant. Retained folding-sign finishes, all model geometry, room, lighting and camera.
- Replaced Move/Shuffle and the movement toolbar with a native Add button; preserved Clear, Home and keyboard movement/rotation.
- Verified mouse/touch gestures, release glide and exact rest, chain momentum, dense contact stability, reduced motion, responsive targets and navigation/fallbacks. See `design-qa.md` and `tools/404-source/fluid-preservation.json`.
- Prepared locally for review; no remote publication was requested.

### 2026-10-09 — Preserve-model 404 interaction refinement

- Followed the latest archived brief: preserved every existing prop builder/material, floor, walls, trim, lighting and camera; removed the sink and updated only sign copy.
- Refined UI alone with Archivo and square paper/ink footer actions; removed the global Add control and used prop click/tap to spawn exactly one object. Kept accessible keyboard equivalents and an explicitly opened movement toolbar.
- Added smooth mouse-wheel rotation during dragging, click/drag/cancellation discrimination, and transactional contact pushing with stable chain displacement and wall/boundary rollback.
- Verified exact model/room preservation, Chrome mouse/touch/keyboard interactions, real prop-to-prop displacement, dense placement/Shuffle/Clear, responsive controls and error/navigation fallbacks. Spatial tests include 350 dense pushes and pinned-chain cases. See `design-qa.md`.
- Prepared locally for review; no remote publication was requested.

### 2026-10-09 — Interactive maintenance 404

- Implemented the supplied photographic 3D maintenance brief with a tiled room, worn folding 404 sign and multiple draggable prop types.
- Added floor raycasts, collision-aware placement/dragging, Shuffle/Clear, touch/keyboard controls and no-JavaScript/WebGL fallbacks.
- Archived the user's brief/photo, generated material originals and prompts; vendored Three.js and Anton with their licenses. Runtime material textures total 763,372 bytes.
- Verified real Chrome desktop/mobile states, touch events, dense layouts, shuffle collision sampling, navigation, reduced motion and fallbacks. Source/packaging validation and 1,000 randomized collision drags pass. See `design-qa.md`.
- This update is prepared locally; no remote publication was performed.

### 2026-10-05 — Multiverse All-Star Battlefront

- Added the project to Projects with a Swiss poster layout based on the supplied typography, color and grid references.
- Archived the original Google Sites page, embedded technical document, all six characters, ten exhibition photographs and three system diagrams. The complete source copy and individual contributions are rendered inline.
- Added native image previews, responsive reading navigation, lossless display copies, repeatable import/render tooling and source-integrity checks in Pages CI.
- Verified source order, image hashes and decoded display pixels, desktop and two phone widths, dialog keyboard/focus behavior, project navigation, existing site/project checks and the strict static audit. See `tools/MASB-QA.md` for evidence and tooling limitations. This update is prepared locally.

### 2026-10-01 — Move the music station through space

- Hid loose power leads and increased the model's cardboard thickness, translucent strip height, perspective and shadows.
- Connected the scrolling hero to a smaller draggable station in a schematic isometric room. A wall-distance ray and outgoing/returning ultrasound make sensing visible; drag, cursor following, touch, arrow keys and the slider share one projection.
- Added direct live audition using source-mode pitches and a waveform sampled from actual audio output. Sound defaults on, resumes on ordinary interaction when autoplay is blocked, and uses a speaker icon for persistent mute.
- Verified real non-silent audio under strict browser autoplay restrictions, note changes with distance, mute behavior, desktop/mobile interaction, reduced motion, source rules, original files and existing portfolio checks.

### 2026-10-01 — Compact music station and firmware alignment

- Condensed the project page into one interactive instrument, optional technical disclosure, two photographs, four original sketch sheets and essential downloads. At 1440×900, default page height fell from 15,932 to 3,998 pixels and visible main copy from 708 to 207 words.
- Archived the supplied Control.ino and Display.ino unchanged with source hashes. Ported actual sensing, empty-loop startup, recording controls, mode preservation, clock, audio frequencies, swing, 30-LED allocation and matrix font/command behavior.
- Compared 1,085 cases against extracted original C++ functions. Verified desktop and four responsive layouts, reduced-motion idle/record timing, original files, downloads, video loading and existing portfolio routes.

### 2026-10-01 — World Sensing Music Station

- Added the portfolio project route and Projects entrance, preserving the existing home and Polaroid surfaces.
- Built a source-grounded SVG instrument reconstruction with pointer/touch sensing, three deterministic eight-step loops, replace-one-layer recording, musical modes, optional sound and reduced-motion behavior.
- Archived the five original photographs and all supplied project files. Added original PDF sketch sheets, an editorial prototype sequence, a click-to-load demonstration video and real downloads.
- Added source hashes, reconstruction/asset tools, engine regression tests, browser verification and `tools/MUSIC-STATION-QA.md`. Pages CI now validates the new music engine before deployment.
- Verified existing site, home and project-room checks, original-source integrity, desktop/phone browser states and the strict design audit.

### 2026-09-22

- Added the operations standard for 存档, summary, validation, commit, upload, and deployment confirmation.
- Added automated GitHub Pages deployment from `dist/` on pushes to `master`.
- Published the complete current repository state, including existing site, source, assets, and tooling.
