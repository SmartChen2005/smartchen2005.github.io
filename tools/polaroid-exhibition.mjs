import fs from 'node:fs';
import { imageRendition, renditionAttributes, viewerAttributes } from './gallery-media.mjs';

export const exhibitionSlug = 'trauma-induced-dissociative-amnesia';
export const exhibitionTitle = 'Trauma-Induced Dissociative Amnesia';
export const exhibitionSubtitle = 'Concept Photography and In-Game Screenshots for Polaroid of Yesterday';
export const exhibitionLabel = 'Concept Photography and Game Screenshots';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

export function exhibitionCollection() {
  const photos = JSON.parse(fs.readFileSync(new URL('./polaroid-exhibition-photos.json', import.meta.url), 'utf8'));
  return photos.map(photo => {
    const original = 'gallery/assets/polaroid-exhibition/' + photo.file;
    const rendition = imageRendition(original);
    if (!rendition) throw new Error('Missing responsive exhibition image: ' + original);
    return { ...photo, original, rendition };
  });
}

export function renderExhibition(collection) {
  const landscape = collection.find(photo => photo.rendition.width > photo.rendition.height)?.rendition;
  const referenceRatio = landscape ? landscape.height / landscape.width : 2 / 3;
  const figures = collection.map((photo, index) => `<figure class="print" data-index="${index}" data-kind="${escape(photo.kind)}"${photo.rendition.height > photo.rendition.width ? ' data-orientation="portrait"' : ''} id="${photo.id}">
    <a class="print-link" href="../../${escape(photo.original)}" aria-label="View ${escape(photo.kind)} ${index + 1}" ${viewerAttributes(photo.rendition, '../../')}>
      <span class="print-paper"><img ${renditionAttributes(photo.rendition, '../../', { sizes: 'auto, (max-width: 820px) 55vw, max(450px, 25vw)', priority: index < 9 })} alt="${escape(photo.alt)}" ${index < 3 ? 'fetchpriority="high"' : index < 9 ? '' : 'loading="lazy"'} decoding="async"><span class="print-error" hidden>Image unavailable<span>Open original image</span></span></span>
    </a></figure>`).join('\n');
  return `<section class="exhibition" data-reference-ratio="${referenceRatio}" style="--index-ratio:${1 / referenceRatio}" aria-label="Polaroid of Yesterday image exhibition">
    <header class="exhibition-header"><div class="view-switch" role="group" aria-label="Exhibition view" hidden><button type="button" data-view="spiral" aria-pressed="true">Wave</button><span aria-hidden="true">/</span><button type="button" data-view="gallery" aria-pressed="false">Index</button></div><a class="project-return" href="../../projects/polaroid-of-yesterday/">Polaroid of Yesterday</a></header>
    <div id="installation" class="installation" tabindex="-1"><div class="photographs">${figures}</div><footer class="exhibition-footer" hidden><span class="exhibition-count"><span id="current-photo">01</span><span class="count-divider">/</span>${String(collection.length).padStart(2, '0')}</span><p class="sr-only" id="view-hint">Scroll through the photo wave. Select an image to view.</p></footer></div>
    <div class="exhibition-space" aria-hidden="true"></div>
    <p class="sr-only" id="view-status" role="status" aria-live="polite"></p>
  </section>
  <dialog class="photo-viewer" aria-labelledby="viewer-title">
    <div class="viewer-header"><button class="viewer-close" type="button" autofocus aria-label="Close image"><span>Close</span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="m2 2 8 8M10 2l-8 8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button></div>
    <div class="viewer-stage" aria-busy="false"><img class="viewer-image" alt=""><p class="viewer-loading" role="status" hidden>Loading image…</p><div class="viewer-error" hidden><p>This image could not be loaded.</p><button type="button" id="retry-photo">Try again</button><a id="error-original" href="">Open original</a></div></div>
    <div class="viewer-caption"><div><h2 id="viewer-title"></h2><p id="viewer-kind" hidden></p></div><a id="viewer-original" href="" target="_blank" rel="noopener">Original image</a><span id="viewer-counter"></span></div>
    <div class="viewer-footer"><button type="button" id="previous-photo">← Previous</button><span class="viewer-key-hint">Use arrow keys to move between images</span><button type="button" id="next-photo">Next →</button></div>
  </dialog>`;
}
