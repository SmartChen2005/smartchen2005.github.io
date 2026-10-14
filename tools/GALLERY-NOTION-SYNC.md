# The Gallery: Notion → website

Content source: [The Gallery database](https://www.notion.so/3f8abc37a86f8038952fc308635a1da9).

## Original project arrangements

Each archive page includes a **Website layout notes (not published)** toggle linking its original VegShark detail page. Those author-curated pages are the reference for picture sequence, groups, captions, video/prose relationships and credits. The notes stay out of the public Markdown and REST output.

Native Notion columns now encode the source arrangements, including stacked photographs, bilingual prose beside a picture, film/text columns and three/four-picture rows. Edit those native columns to change the arrangement; the converter follows the document rather than a fixed photo-number template. Adjacent short caption paragraphs render as figure captions with their image, including multi-line credits. Morning Unwoken's poem and Analog & Digital's English translation retain native toggles.

The `source` article variant shows a selected cover once in its body position when that photograph is already in the document. A separately selected cover remains in the header. Repeated summaries are avoided. Deliberate Practice keeps its `practice` variant, with enlarged last-section portraits and larger stacked prints on phones. Generated archive articles omit the redundant breadcrumb.

The eight photography series and five film projects from VegShark.com each have one database page. Their original prose, captions, poems, credits and five video sources are retained. 110 published photographs and all 13 covers are uploaded as native Notion files and cached locally. TIDA is **Photography / Concept photography**, related to **Polaroid of Yesterday**. The existing PoY twenty-screenshot Spiral/Index exhibition remains a separate linked page.

26 carousel originals could not be exported: The Life of a Poser (13), Intro to Darkroom (6), Gorilla in the Studio (4), and Rorschach’s Mask (3). Their source references remain in Notion, with an explicit `Media status`; the website uses a link to the original series instead of broken image slots. To complete these imports, replace the corresponding source images in Notion with uploaded originals. The next configured sync imports those files automatically.

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

Cover image now uses the original first photograph for twelve imported projects, rather than the old square thumbnail. Skater's original images remain unavailable, so its existing cover is retained. Any future cover replacement displays its native proportions on both the homepage and article. Portrait photographs are narrower: their long edge matches the short edge of the article's first available landscape photograph at the same column scale, with a 2:3 reference when the article has no landscape. The focused viewer continues to fit the complete original to the viewport.

`tools/gallery-layouts.json` owns presentation choices independently of Notion content. Its Photography selections define the two main stories and spotlight; every other published series is included once in the compact rail. Unpublished choices fall back to remaining projects. Its article map currently selects `offset` for TIDA and Rhythms of Chaos and `centered` for Analog & Digital. Remove an entry to use the original split introduction. Both Markdown and REST exports use these same layouts. Titles, paragraphs, captions and file choices remain owned by Notion; the layout config contains no article copy.

Deliberate Practice uses the `practice` variant. Its five Notion headings become page anchors and grouped sections. Native three-column and two-column rows retain the original comparison and pairing relationships. Short caption paragraphs beneath photographs in a column are rendered as figure captions; they remain ordinary editable text in Notion. Cover image remains an independent editorial choice and now uses the user's selected Final Portfolio portrait.

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

```powershell
node tools/sync-gallery-notion.mjs --offline
node tools/test-gallery-document.mjs
node tools/test-gallery.mjs
```

`tools/gallery-notion/snapshot.json` contains the verified Notion page content; `media.json` maps native asset identities to local files. `render-gallery.mjs` uses that snapshot for both the homepage and project articles. REST block exports use the same editorial document renderer as the connected Notion Markdown snapshot. Titles, dates and prose are not taken from the legacy catalog; that catalog retains original asset provenance and descriptions.

The REST client paginates the entire result and nested blocks, checks incomplete results, retries read rate limits and detects edits during export. Only Published Photography/Film pages and known CMS properties are exported. API credentials stay in the build process. Signed image URLs are replaced by stable local media references; changing an image to a new file with the same name uses its new asset identity. A failed export does not publish partial generated content. Unpublishing removes owned article HTML and homepage links; archived local original files remain available for recovery.

The initial image migration uses tool-issued upload URLs through a verified no-echo stdin channel. Upload credentials are not saved; only credential-free completion receipts are retained. Each upload is recorded, so interrupted work can resume without repeating confirmed transfers.
