import fs from 'node:fs';
import { normalizeSiteArrows } from './site-icons.mjs';
import { siteFavicon } from './site-favicon.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteCursorAssets } from './site-cursor.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const route = path.join(root, 'dist/projects/polaroid-of-yesterday/photography');
const collection = JSON.parse(fs.readFileSync(path.join(root, 'tools/stills-collection.json'), 'utf8'));
const hasScreenshots = collection.some(photo => photo.kind === 'In-game screenshot');
const hasPhotography = collection.some(photo => photo.kind === 'Concept photography');
const description = hasScreenshots && hasPhotography ? 'In-game screenshots and concept photography'
  : hasPhotography ? 'Concept photography' : hasScreenshots ? 'In-game screenshots' : 'Project images';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const figures = collection.map((photo, index) => `      <figure class="print" data-index="${index}" id="${photo.id}">
        <a class="print-link" href="${escape(photo.source)}" aria-label="View ${escape(photo.title)}; ${escape(photo.kind)}">
          <span class="print-paper"><img src="assets/${photo.id}.webp" width="${photo.width}" height="${photo.height}" alt="${escape(photo.alt)}" ${index < 3 ? 'fetchpriority="high"' : index < 9 ? '' : 'loading="lazy"'} decoding="async"><span class="print-error" hidden>Image unavailable<span>Open original image</span></span></span>
          <span class="print-caption"><span>${escape(photo.title)}</span><span>${escape(photo.kind)}</span></span>
        </a>
      </figure>`).join('\n');
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <meta name="description" content="An exhibition of ${description.toLowerCase()} from Polaroid of Yesterday. Explore a memory spiral or an editorial gallery.">
  ${siteFavicon('../../../')}
  <title>Stills | Polaroid of Yesterday | The Gallery</title>
  <link rel="preload" as="image" href="assets/the-room.webp">
  <link rel="stylesheet" href="stills.css?gallery=20261013">
  <script type="module" src="stills.mjs?gallery=20261013"></script>
  ${siteCursorAssets('../../../')}
</head>
<body>
  <a class="skip-link" href="#installation">Skip to images</a>
  <header class="exhibition-header">
    <nav class="exhibition-context" aria-label="Gallery breadcrumb"><a class="gallery-return" href="../../../gallery/">The Gallery</a><span class="context-separator" aria-hidden="true">/</span><a class="project-return" href="../">Polaroid of Yesterday</a></nav>
    <div class="view-switch" role="group" aria-label="Exhibition view" hidden>
      <button type="button" data-view="spiral" aria-pressed="true">Spiral</button><span aria-hidden="true">/</span><button type="button" data-view="gallery" aria-pressed="false">Index</button>
    </div>
  </header>
  <div class="exhibition-intro"><h1>Stills</h1><p>${description}.</p></div>
  <main id="installation" class="installation" aria-label="Image exhibition" tabindex="-1">
    <div class="photographs">
${figures}
    </div>
  </main>
  <div class="exhibition-space" aria-hidden="true"></div>
  <footer class="exhibition-footer" hidden>
    <span class="exhibition-count"><span id="current-photo">01</span><span class="count-divider">/</span>${String(collection.length).padStart(2, '0')}</span>
    <p class="sr-only" id="view-hint">Memory spiral. Select an image to view.</p>
  </footer>
  <p class="sr-only" id="view-status" role="status" aria-live="polite"></p>
  <dialog class="photo-viewer" aria-labelledby="viewer-title">
    <div class="viewer-header"><span>Stills</span><button class="viewer-close" type="button" autofocus aria-label="Close image">Close <span aria-hidden="true">×</span></button></div>
    <div class="viewer-stage"><img class="viewer-image" alt=""><div class="viewer-error" hidden><p>This image could not be loaded.</p><button type="button" id="retry-photo">Try again</button><a id="error-original" href="">Open original</a></div></div>
    <div class="viewer-caption"><div><h2 id="viewer-title"></h2><p id="viewer-kind"></p></div><a id="viewer-original" href="" target="_blank" rel="noopener">Original image</a><span id="viewer-counter"></span></div>
    <div class="viewer-footer"><button type="button" id="previous-photo">← Previous</button><span class="viewer-key-hint">Use arrow keys to move between images</span><button type="button" id="next-photo">Next →</button></div>
  </dialog>
</body>
</html>
`;
fs.writeFileSync(path.join(route, 'index.html'), normalizeSiteArrows(html));
fs.writeFileSync(path.join(route, 'collection.json'), JSON.stringify(collection, null, 2) + '\n');
console.log(`Rendered Stills with ${collection.length} project photographs.`);
