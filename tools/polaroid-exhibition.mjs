import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { allImages, adaptNotionBlocks, parseNotionMarkdown, publicationNodes } from './gallery-document.mjs';
import { imageRendition, renditionAttributes, viewerAttributes } from './gallery-media.mjs';

export const exhibitionSlug = 'trauma-induced-dissociative-amnesia';
export const exhibitionTitle = 'Trauma Induced Dissociative Amnesia';
export const exhibitionSubtitle = 'Concept Photography and In-Game Screenshots for Polaroid of Yesterday';
export const exhibitionLabel = 'Concept Photography and Game Screenshots';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const digest = value => createHash('sha256').update(value).digest('hex');

export function exhibitionCollection(page, resolveMedia) {
  const screenshots = JSON.parse(fs.readFileSync(new URL('./stills-collection.json', import.meta.url), 'utf8')).map(photo => ({
    ...photo,
    original: new URL(photo.source, 'https://archive.local/projects/polaroid-of-yesterday/photography/').pathname.slice(1),
    rendition: imageRendition(`projects/polaroid-of-yesterday/photography/assets/${photo.id}.webp`)
  }));
  const concepts = allImages(publicationNodes(page.blocks ? adaptNotionBlocks(page.blocks) : parseNotionMarkdown(page.markdown))).map(image => {
    const media = resolveMedia(image.src);
    if (!media.original?.startsWith('assets/') || media.unavailable) throw new Error('Concept art must have a cached original');
    const original = 'gallery/' + media.original;
    return { id: 'concept-' + digest(original).slice(0, 12), kind: 'Concept art', original,
      alt: 'Concept art for Polaroid of Yesterday.', rendition: imageRendition(original) };
  });
  // Shuffle the entire combined collection once, reproducibly. Neither source
  // sequence nor media category determines its place; both views share this order.
  return [...screenshots, ...concepts].map(photo => {
    if (!photo.rendition) throw new Error('Missing responsive exhibition image: ' + photo.original);
    return { ...photo, shuffle: digest('polaroid-combined-2026-11-03:' + photo.original) };
  }).sort((a, b) => a.shuffle.localeCompare(b.shuffle));
}

export function renderExhibition(collection) {
  const figures = collection.map((photo, index) => `<figure class="print" data-index="${index}" id="${photo.id}">
    <a class="print-link" href="../../${escape(photo.original)}" aria-label="View ${escape(photo.kind)} ${index + 1}" ${viewerAttributes(photo.rendition, '../../')}>
      <span class="print-paper"><img ${renditionAttributes(photo.rendition, '../../', { sizes: 'auto, (max-width: 700px) 50vw, (max-width: 1024px) 30vw, 24vw', priority: index < 9 })} alt="${escape(photo.alt)}" ${index < 3 ? 'fetchpriority="high"' : index < 9 ? '' : 'loading="lazy"'} decoding="async"><span class="print-error" hidden>Image unavailable<span>Open original image</span></span></span>
      <span class="print-caption"><span>${escape(photo.kind)}</span></span>
    </a></figure>`).join('\n');
  return `<section class="exhibition" aria-label="Polaroid of Yesterday image exhibition">
    <header class="exhibition-header"><div class="view-switch" role="group" aria-label="Exhibition view" hidden><button type="button" data-view="spiral" aria-pressed="true">Spiral</button><span aria-hidden="true">/</span><button type="button" data-view="gallery" aria-pressed="false">Index</button></div><a class="project-return" href="../../projects/polaroid-of-yesterday/">Polaroid of Yesterday</a></header>
    <div id="installation" class="installation" tabindex="-1"><div class="photographs">${figures}</div><footer class="exhibition-footer" hidden><span class="exhibition-count"><span id="current-photo">01</span><span class="count-divider">/</span>${String(collection.length).padStart(2, '0')}</span><p class="sr-only" id="view-hint">Memory spiral. Select an image to view.</p></footer></div>
    <div class="exhibition-space" aria-hidden="true"></div>
    <p class="sr-only" id="view-status" role="status" aria-live="polite"></p>
  </section>
  <dialog class="photo-viewer" aria-labelledby="viewer-title">
    <div class="viewer-header"><span>Polaroid of Yesterday</span><button class="viewer-close" type="button" autofocus aria-label="Close image">Close <span aria-hidden="true">×</span></button></div>
    <div class="viewer-stage"><img class="viewer-image" alt=""><div class="viewer-error" hidden><p>This image could not be loaded.</p><button type="button" id="retry-photo">Try again</button><a id="error-original" href="">Open original</a></div></div>
    <div class="viewer-caption"><div><h2 id="viewer-title"></h2><p id="viewer-kind" hidden></p></div><a id="viewer-original" href="" target="_blank" rel="noopener">Original image</a><span id="viewer-counter"></span></div>
    <div class="viewer-footer"><button type="button" id="previous-photo">← Previous</button><span class="viewer-key-hint">Use arrow keys to move between images</span><button type="button" id="next-photo">Next →</button></div>
  </dialog>`;
}
