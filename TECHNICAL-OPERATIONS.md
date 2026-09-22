# Technical Operations Standard

## Purpose

This repository is the source of truth for the **Polaroid of Yesterday** web archive. The published website is generated as static files in `dist/` and is deployed to GitHub Pages from the `master` branch.

本文件规定项目的存档（存档 / archive）、更新摘要（summary）和 GitHub 上传（upload）标准，确保每次修改都可追溯、可复现，并且能及时上线。

## Repository map

- `tools/notion-source.md` — source document for visible content.
- `tools/render-notion.mjs` — renderer that generates the static document.
- `tools/validate-site.mjs` — local integrity and source/render parity checks.
- `dist/index.html` — deployable website entry point.
- `dist/assets/` — local image assets used by the website.
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

If an asset is replaced, keep the replacement in `dist/assets/`, update the source reference or renderer mapping, and verify that no expiring external asset URL remains. Do not delete a prior asset unless it is unused and the removal is explicitly documented in the commit summary.

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

### 2026-09-22

- Added the operations standard for 存档, summary, validation, commit, upload, and deployment confirmation.
- Added automated GitHub Pages deployment from `dist/` on pushes to `master`.
- Published the complete current repository state, including existing site, source, assets, and tooling.
