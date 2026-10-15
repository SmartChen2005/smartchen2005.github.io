import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=new URL('../',import.meta.url), gallery=new URL('dist/gallery/',root);
const projects=JSON.parse(fs.readFileSync(new URL('tools/gallery-projects.json',root),'utf8'));
const snapshot=JSON.parse(fs.readFileSync(new URL('tools/gallery-notion/snapshot.json',root),'utf8'));
const published=snapshot.pages.filter(p=>[true,'__YES__'].includes(p.properties.Published)&&['Photography','Film'].includes(p.properties.Type));
assert.equal(projects.length,13);
assert.equal(projects.filter(p=>p.category==='Photography').length,8);
assert.equal(projects.filter(p=>p.category==='Film').length,5);
assert.equal(new Set(projects.map(p=>p.id)).size,13);
for(const p of projects){
 assert(p.coverSourceUrl.startsWith('https://sites.google.com/sitesv-images-rt/'),'Real cover provenance');
 assert(p.sourceUrl.startsWith('https://sites.google.com/view/vegshark/'),'Real archive destinations');
 assert(p.width>0&&p.height>0);
 assert(fs.statSync(new URL(p.cover,gallery)).size>0);
 assert(fs.statSync(new URL(`assets/${p.id}.jpg`,gallery)).size>0);
}
// The original catalog preserves provenance; public routes follow the active CMS.
const pages=[new URL('index.html',gallery),...published.map(p=>new URL(`${p.properties.Slug}/index.html`,gallery))];
const managed=JSON.parse(fs.readFileSync(new URL('generated-pages.json',gallery),'utf8'));
assert.deepEqual(new Set(managed),new Set(['index.html',...published.map(p=>p.properties.Slug+'/index.html')]),'Managed routes match published CMS projects');
for(const file of pages){
 const html=fs.readFileSync(file,'utf8');
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,`One page heading: ${file}`);
 for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(/^(?:https?:|mailto:)/.test(ref))continue;
  const decoded=ref.replaceAll('&amp;','&');
  if(decoded.startsWith('#')){assert(html.includes(`id="${decoded.slice(1)}"`),`Missing fragment: ${ref}`);continue;}
  const url=new URL(decoded,file);url.hash='';
  assert(fs.existsSync(url),`Missing route or asset: ${ref} in ${fileURLToPath(file)}`);
 }
}
const homepage=fs.readFileSync(new URL('dist/index.html',root),'utf8');
assert.match(homepage,/<a class="identity identity-photo" href="gallery\/" data-identity="photo">/);
const stills=fs.readFileSync(new URL('dist/projects/polaroid-of-yesterday/photography/index.html',root),'utf8');
assert.match(stills,/class="gallery-return" href="\.\.\/\.\.\/\.\.\/gallery\/">The Gallery/);
assert.match(stills,/data-view="gallery"[^>]*>Index<\/button>/);
const room=fs.readFileSync(new URL('dist/projects/polaroid-of-yesterday/index.html',root),'utf8');
assert.match(room,/camera-tag-title">Gallery /);
const stillCss=fs.readFileSync(new URL('dist/projects/polaroid-of-yesterday/photography/stills.css',root),'utf8');
assert.match(stillCss,/@import url\('\.\.\/\.\.\/\.\.\/gallery\/gallery-base.css'\)/);
for(const file of ['gallery.css','gallery-base.css'])assert(!/object-fit:\s*cover|filter:|box-shadow:/.test(fs.readFileSync(new URL(file,gallery),'utf8')),'Neutral, uncropped photographs');
const galleryHome=fs.readFileSync(new URL('index.html',gallery),'utf8');
assert(galleryHome.includes(`${published.length+1} projects`),'Gallery count follows published projects plus the Stills exhibition');
const publishedSlugs=new Set(published.map(p=>p.properties.Slug));
for(const p of projects.filter(p=>!publishedSlugs.has(p.id))){
 assert(!fs.existsSync(new URL(`${p.id}/index.html`,gallery)),`Removed CMS project has no public article: ${p.id}`);
 assert(!galleryHome.includes(`href="${p.id}/"`),`Removed CMS project has no homepage entry: ${p.id}`);
}
assert(galleryHome.includes('../projects/polaroid-of-yesterday/photography/'));
console.log(`Passed: ${published.length} published CMS projects; archived cover provenance; removed routes; local pages/assets; Gallery hierarchy; Photographer entry; Spiral/Index labels; room Gallery entry; shared styles; neutral, uncropped images.`);
