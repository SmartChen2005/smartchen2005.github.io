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
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow.

## Standard update cycle

Every update MUST follow this order:

1. **存档 / Archive** — before editing, preserve the current source, assets, and relevant configuration in Git history. For source imports or generated content, record the origin and date in the corresponding file or update note. Never rely on an external URL as the only copy of an asset.
2. **修改 / Update** — make the smallest coherent change. Keep visible document content sourced from `tools/notion-source.md`; keep generated output in `dist/` synchronized with the source.
3. **验证 / Validate** — run the project validation command below. Confirm that all referenced local assets exist and that the rendered headings, text, and image order still match the source.
4. **摘要 / Summary** — write a short update summary in the commit message. The summary must state what changed, why it changed, and how it was verified. If the update is substantial, add a dated entry to this document's change log.
5. **提交 / Commit** — commit the complete update as one logical unit. Do not leave generated output, source changes, or required assets uncommitted.
6. **上传 / Upload** — push the commit to `origin/master` immediately after a successful commit. A local-only update is not considered complete.
7. **上线确认 / Confirm publish** — confirm that the GitHub Actions Pages workflow completes and open the public URL to verify the deployed entry point.

### Required commands

```powershell
# From the repository root
node tools/validate-site.mjs
git status --short
git add .
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
- A deployment is complete only after the workflow succeeds and the public URL returns the current site.

The workflow intentionally deploys the existing `dist/` directory as-is. This keeps the repository's source and generated output layout stable while making the GitHub Pages publication explicit and repeatable.

## Current baseline

At the time this standard was added, the repository contains the complete current static archive, its local image assets, the Notion source, the renderer, the validator, and the design context. The baseline is published by the commit that adds this document and the Pages workflow.

## Change log

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
