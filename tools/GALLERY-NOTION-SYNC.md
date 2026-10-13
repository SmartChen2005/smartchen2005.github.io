# The Gallery: Notion → website

Content source: [The Gallery database](https://www.notion.so/3f8abc37a86f8038952fc308635a1da9).

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
