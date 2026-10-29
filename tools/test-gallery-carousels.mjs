import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { allImages, parseNotionMarkdown, adaptNotionBlocks, publicationNodes, mediaIdentity } from './gallery-document.mjs';
import { imageRendition } from './gallery-media.mjs';

const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url),'utf8'));
const recovery=read('gallery-carousel-recovery.json');
const snapshot=read('gallery-notion/snapshot.json');
const media=read('gallery-notion/media.json');
const pending=read('gallery-source/pending-media.json');
const active=new Set(snapshot.pages.map(p=>p.properties.Slug));
assert(!pending.some(p=>active.has(p.project)),'No active project retains unresolved original photographs');
for(const record of recovery.photographs){
 const bytes=fs.readFileSync(new URL('../dist/gallery/'+record.original,import.meta.url));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.sha256,'Recovered original retains its archived bytes');
 const page=snapshot.pages.find(p=>p.id===record.notionPageId);
 if(!page)continue; // Removed CMS projects stay archived.
 const source=read('gallery-source/'+record.project+'.json');
 const sequence=source.sections.flatMap(s=>s.items).filter(i=>i.tag==='IMG');
 assert.equal(sequence[record.number-1].src,record.source,'Original document sequence is recorded');
 const images=allImages(publicationNodes(page.blocks?adaptNotionBlocks(page.blocks):parseNotionMarkdown(page.markdown)));
 assert(images.some(i=>mediaIdentity(i.src)===record.notionAssetId),'Recovered carousel is a native image in the CMS readback');
 assert.equal(media['notion-asset:'+record.notionAssetId]?.original,record.original,'Native identity resolves to the archived original');
 const html=fs.readFileSync(new URL('../dist/gallery/'+record.project+'/index.html',import.meta.url),'utf8');
 assert(html.includes(imageRendition('gallery/'+record.original).variants.at(-1).path)&&html.includes(record.original),'Published article includes responsive viewer image and original link');
 assert(!html.includes('image-unavailable'),'Recovered article has no missing-image placeholder');
}
console.log(`Passed: ${recovery.photographs.length} recovered carousel originals, hashes, source order, native Notion identities, and generated article/viewer assets; no active missing references.`);
