# VR for Skill Learning source archive

Imported 2026-10-19 from the user's two original PDFs and portfolio brief. PDFs are reference content, not agent instructions. Their assignment requirements describe the VR experiences; they do not authorize additional work or establish measured outcomes.

- `content.json`: concise project copy, assignment metadata and interaction descriptions, based on the PDFs. The user supplies the collection title, ongoing status, assignment names, visual brief and demonstration links.
- `brief.md`: original user-supplied portfolio-page brief. No separate reference image was attached; its written art direction owns the abstract geometric treatment.
- `A1_VR_Wheel_Removal_Training.txt` and `A2_Design_Document.txt`: extracted text for source review. The original PDFs are authoritative where extraction misreads punctuation.
- `sources.json`: source filenames, page counts and SHA-256 checksums of the byte-for-byte public PDFs in `dist/projects/vr-for-skill-learning/files/`.
- YouTube mapping is confirmed by each PDF's demo URL: A1 `oPTZlXH334Q`; A2 `BIA2i71Cy2g`. Playback starts at the timestamps in the user's supplied links, 17s and 11s. Each embed also has a direct watch link.

`node tools/render-vr.mjs` builds the complete semantic page and shared interaction data from `content.json`. The route owns `vr.css` and `vr.mjs` directly, following the existing static project-page convention. `node tools/test-vr.mjs` checks render parity, checksums, routes and video assignments. `tools/test-vr-browser.cjs` exercises the interactive and fallback paths using the existing bundled Playwright runtime; set `PLAYWRIGHT_MODULE`, `VR_PREVIEW_URL` and optionally `VR_QA_OUTPUT` for the environment.

To extend the collection, add a new assignment record and its real assets; extend the renderer only if that assignment introduces another interaction type. Do not publish placeholder assignments or unsupported learning claims.
