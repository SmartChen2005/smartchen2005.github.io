import {allImages,publicationNodes} from './gallery-document.mjs';

const escape=s=>String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');

export function renderImageIndex(nodes,{title,resolveMedia,prefix='../',imageAttributes,viewerAttributes}) {
  const images=allImages(publicationNodes(nodes));
  if(!images.length)throw new Error('An image index requires published photographs.');
  const prints=images.map((node,i)=>{
    const media=resolveMedia(node.src),number=String(i+1).padStart(2,'0');
    if(media.unavailable||!media.display?.startsWith('assets/')||!media.original?.startsWith('assets/'))throw new Error('Image index requires a cached photograph: '+node.src);
    if(!(media.displayWidth>0&&media.displayHeight>0))throw new Error('Image index requires photograph dimensions.');
    const label=`${title} — photograph ${number}`;
    return `<figure class="index-print" id="photograph-${number}"><a class="story-image-open" href="${escape(prefix+media.original)}" data-image-title="${number}" aria-label="View photograph ${number}"${viewerAttributes?` ${viewerAttributes(media,prefix)}`:''}><span class="media"><img ${imageAttributes?imageAttributes(media,prefix,{sizes:'(max-width: 700px) calc((100vw - 54px) / 2), (max-width: 1024px) 30vw, 24vw',priority:i<4}):`src="${escape(prefix+media.display)}" width="${media.displayWidth}" height="${media.displayHeight}"`} alt="${escape(label)}" ${i<4?'fetchpriority="high"':'loading="lazy"'} decoding="async"><span class="media-error" hidden>Image unavailable. Open the original photograph.</span></span></a><figcaption>${number}</figcaption></figure>`;
  });
  return `<section class="image-index" aria-label="Photograph index">${prints.join('\n')}</section>`;
}
