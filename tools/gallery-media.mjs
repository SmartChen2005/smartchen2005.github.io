import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync(new URL('./gallery-image-renditions.json', import.meta.url), 'utf8'));
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export function imageRendition(source) {
  return manifest.images[manifest.aliases[source] || source];
}
export function galleryImageAttributes(media, prefix = '', { sizes = 'auto, (max-width: 700px) calc(100vw - 36px), min(1080px, 94vw)', priority = false } = {}) {
  const record = imageRendition('gallery/' + media.original) || imageRendition('gallery/' + media.display);
  if (!record) return `src="${escape(media.display.startsWith('assets/') ? prefix + media.display : media.display)}"${media.displayWidth ? ` width="${media.displayWidth}" height="${media.displayHeight}"` : ''}`;
  return renditionAttributes(record, prefix + '../', { sizes, priority });
}
export function renditionAttributes(record, siteBase, { sizes = 'auto, (max-width: 700px) calc(100vw - 36px), min(1080px, 94vw)', priority = false } = {}) {
  const preview = record.variants.filter(v => Math.max(v.width,v.height) <= 1600).at(-1) || record.variants[0];
  const srcset = record.variants.map(v => `${siteBase}${v.path} ${v.width}w`).join(', ');
  // sizes=auto is valid for lazy images; eager hero images use an explicit slot.
  if (priority) sizes = sizes.replace(/^auto, /, '');
  return `src="${escape(siteBase + preview.path)}" srcset="${escape(srcset)}" sizes="${escape(sizes)}" width="${record.width}" height="${record.height}"`;
}
export function galleryViewerAttributes(media, prefix = '../') {
  const record = imageRendition('gallery/' + media.original) || imageRendition('gallery/' + media.display);
  return record ? viewerAttributes(record, prefix + '../') : '';
}
export function viewerAttributes(record, siteBase) {
  const high = record.variants.at(-1);
  return `data-view-src="${escape(siteBase + high.path)}"`;
}
