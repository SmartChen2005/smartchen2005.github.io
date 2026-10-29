# The Gallery: Notion → website

Content source: [The Gallery database](https://www.notion.so/3f8abc37a86f8038952fc308635a1da9).

## Original project arrangements

Each archive page includes a **Website layout notes (not published)** toggle linking its original VegShark detail page. Those author-curated pages are the reference for picture sequence, groups, captions, video/prose relationships and credits. The notes stay out of the public Markdown and REST output.

Native Notion columns now encode the source arrangements, including stacked photographs, bilingual prose beside a picture, film/text columns and three/four-picture rows. Edit those native columns to change the arrangement; the converter follows the document rather than a fixed photo-number template. Adjacent short caption paragraphs render as figure captions with their image, including multi-line credits. Morning Unwoken's poem retains its native toggle. Analog & Digital keeps its English translation in an editable Notion toggle, but the public converter places it beside the Chinese text behind the same 中文 / English reading switch; there is no separate translation section below the article.

The `source` article variant shows a selected cover once in its body position when that photograph is already in the document. A separately selected cover remains in the header. Repeated summaries are avoided. Deliberate Practice keeps its `practice` variant, with enlarged last-section portraits and larger stacked prints on phones. Generated archive articles omit the redundant breadcrumb.

The active Gallery contains seven photography series and five film projects from VegShark.com. The Life of a Poser (Skater) was confirmed deleted in Notion and removed from the website on 2026-10-14. Their original prose, captions, poems, credits and five video sources are retained. Published photographs and the twelve active covers are uploaded as native Notion files and cached locally. Original migration records and media remain archived. TIDA is **Photography / Concept photography**, related to **Polaroid of Yesterday**. The existing PoY twenty-screenshot Spiral/Index exhibition remains a separate linked page.

All 13 previously missing carousel photographs in active projects were recovered on 2026-10-15: Intro to Darkroom (6), Gorilla in the Studio (4), and Rorschach’s Mask (3). They are native Notion image files in their original document positions, with archived JPEGs and optimized WebP copies. `tools/gallery-carousel-recovery.json` records original/fresh source addresses, sequence, hashes, and verified Notion asset identities. `tools/recover-gallery-carousels.py` extracts both ordinary images and Google Sites carousel CSS backgrounds from fresh published HTML; it rejects changed sequence counts. For future migrations, inspect CSS carousel backgrounds as well as `<img>` elements and upload recovered files to Notion before exporting the page. Only the deleted Skater project's historical unresolved references remain archived; none belong to an active project.

## Editing projects

| Property | Website behavior |
|---|---|
| Project | Project title and homepage card title |
| Type | Photography or Film section |
| Content kind | Photography series, Concept photography, or Film |
| Format | Original film format, such as A Video Poem or Master Shot |
| Slug | Stable route; lowercase letters, digits and hyphens |
| Published | Include or remove the project’s website entry and generated article |
| Featured / Order | Homepage lead project and project order |
| Cover image | Native Notion file used as the cover; replace it here to change the website image |
| Summary / Subtitle / Credit | Editorial introduction, original subtitle and byline |
| Year / Date label | Supplied dates; unknown dates remain unset |
| Link | Original portfolio project address |
| Related project | TIDA’s connection to Polaroid of Yesterday |
| Media status | Import coverage notes, separate from the project’s existing Status |

The page body owns the article. Use native paragraphs, headings, image captions, columns, lists, quotes, tables, toggles and videos. Upload photographs directly to Notion. Image proportions are preserved; columns and large photographs provide the editorial rhythm. New published projects need a unique Slug and a Cover image. Unsupported blocks stop the export with a clear error, retaining the existing website.

Cover image is an independent editorial choice, displayed at its native proportions on the homepage and article. Photography generally uses a full source photograph; Deliberate Practice keeps its selected Final Portfolio portrait. Film covers follow the original [Film index](https://sites.google.com/view/vegshark/film): Cursed Stage, Gorilla in the Studio, The Common Things and Rorschach’s Mask use their title-bearing 1280×720 poster images. Morning Unwoken keeps the forest photograph selected from its third body image, which already matches that index. Keep titles embedded in the original poster artwork. These choices are stored in native Notion Cover image files, with the legacy Cover URL and page banner synchronized. Portrait photographs generally remain narrower: their long edge matches the short edge of the article's first available landscape photograph at the same column scale, with a 2:3 reference when the article has no landscape; the two enlarged portrait article exceptions are recorded below. The focused viewer continues to fit the complete original to the viewport.

`tools/gallery-layouts.json` owns presentation choices independently of Notion content. Its Photography selections define the two main stories and spotlight; every other published series is included once in the compact rail. Unpublished choices fall back to remaining projects. Rhythms of Chaos uses `index`: every current body photograph appears once in source order with a number-only caption. Its project introduction comes from Summary; Cover image remains the independent homepage selection. Deliberate Practice uses `practice`, and the other archive articles currently use `source`. Both Markdown and REST exports use these same layouts. Titles, paragraphs, captions and file choices remain owned by Notion; the layout config contains no article copy. Index validation follows the current CMS sequence rather than the original imported photograph count.

Deliberate Practice uses the `practice` variant. Its five Notion headings become page anchors and grouped sections. Native three-column and two-column rows retain the original comparison and pairing relationships. Short caption paragraphs beneath photographs in a column are rendered as figure captions; they remain ordinary editable text in Notion. Cover image remains an independent editorial choice and now uses the user's selected Final Portfolio portrait.

2026-10-14 refinement: chapter headings have no surrounding parentheses and link back to the native page contents. Deliberate Practice and Analog & Digital use larger portrait prints (up to 448px wide, 920px paired groups, stacked full-column on phones), with the exception recorded in their private Notion layout notes. Morning Unwoken's third body photograph is now its native Cover image, legacy Cover and page banner; the verified local export uses the existing original file and native asset identity. No body photograph was replaced or reordered.

The reserved toggle title **Website layout notes (not published)** marks internal editorial guidance. This note is retained in Notion but excluded from the public article in both connected Markdown snapshots and REST exports. Keep this exact title when editing those notes; ordinary toggles with other titles still publish normally.

## One-time connection setup

The connected Notion tools were used for this migration and the current website snapshot. An unattended Node/GitHub process requires its own **read-only Notion connection secret**; none is currently configured. The temporary file-upload grants are not used as a general API credential.

1. Create or use a Notion connection with Read content capability and give it access to The Gallery database.
2. Copy `.env.gallery.example` to `.env.gallery.local` and set `NOTION_TOKEN` privately. The local file is ignored by Git. Do not put the secret in `dist/` or send it in chat.
3. With Node 22+, run:

```powershell
node --env-file=.env.gallery.local tools/sync-gallery-notion.mjs
node --env-file=.env.gallery.local tools/sync-gallery-notion.mjs --watch
```

The watcher checks every five minutes. Without a token it exits before making a request. `tools/gallery-notion/config.json` already points to the correct database and data source.

For GitHub Pages, set the repository Actions secret **NOTION_TOKEN**. After the workflow is pushed, `.github/workflows/gallery-notion.yml` supports a manual run and a thirty-minute schedule. It exports Notion, verifies the generated site and deploys the static artifact. Without the secret it records the missing configuration and skips deployment. This session did not push or deploy the workflow.

## Offline rendering and safeguards

### Responsive image delivery

The user selected a maximum **3000px long edge** for display/viewer copies.
Original files and Original links remain unchanged. Images below this size are
not enlarged. `gallery-image-policy.json` controls quality 92 and responsive
long-edge steps; `prepare-gallery-images.py` generates uncropped, color-profile-
preserving WebP copies and `gallery-image-renditions.json` records provenance.
Filenames are based on encoded content, so browsers receive updated pixels
without overwriting an original or relying on a stale image URL.

Use Python 3.12 with Pillow (`python -m pip install Pillow==13.0.0`) and run
`python tools/prepare-gallery-images.py` after manually adding local images.
`GALLERY_PYTHON` may select an installed interpreter. Regular Notion export now
prepares new responsive files before rendering and rolls back its content
snapshot on failure. The scheduled workflow supplies Python/Pillow. Offline
rendering reuses the committed copies and manifest.

Gallery and the linked Stills exhibition load smaller copies according to the
actual image slot and screen density, then request a capped high-resolution
copy only when the viewer opens. The Original link still opens the preserved
source. Run `node tools/test-gallery-image-optimization.mjs` to verify all
source hashes, output dimensions, the 3000px limit and published coverage.

```powershell
node tools/sync-gallery-notion.mjs --offline
node tools/test-gallery-document.mjs
node tools/test-gallery.mjs
```

`tools/gallery-notion/snapshot.json` contains the verified Notion page content; `media.json` maps native asset identities to local files. `render-gallery.mjs` uses that snapshot for both the homepage and project articles. REST block exports use the same editorial document renderer as the connected Notion Markdown snapshot. Titles, dates and prose are not taken from the legacy catalog; that catalog retains original asset provenance and descriptions.

The REST client paginates the entire result and nested blocks, checks incomplete results, retries read rate limits and detects edits during export. Only Published Photography/Film pages and known CMS properties are exported. API credentials stay in the build process. Signed image URLs are replaced by stable local media references; changing an image to a new file with the same name uses its new asset identity. A failed export does not publish partial generated content. Unpublishing removes owned article HTML and homepage links; archived local original files remain available for recovery.

The initial image migration uses tool-issued upload URLs through a verified no-echo stdin channel. Upload credentials are not saved; only credential-free completion receipts are retained. Each upload is recorded, so interrupted work can resume without repeating confirmed transfers.

Reading-language configuration is in `tools/gallery-layouts.json` under `readingLanguages`. The original prose comes from its authored text column; the configured translation source matches the existing Notion toggle summary. Keep that summary (currently English translation) stable, or update the configuration when renaming it. Both Markdown and REST exports use the same language layout. Native radio inputs and CSS provide language switching, including keyboard input, with no script dependency; all subsequent photographs and captions retain their source order. The source texts and private layout notes remain intact in Notion.
