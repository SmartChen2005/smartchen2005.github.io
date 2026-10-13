import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=new URL('../',import.meta.url), gallery=new URL('dist/gallery/',root);
const projects=JSON.parse(fs.readFileSync(new URL('tools/gallery-projects.json',root),'utf8'));
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
const pages=[new URL('index.html',gallery),...projects.map(p=>new URL(`${p.id}/index.html`,gallery))];
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
assert.match(galleryHome,/14 projects/);
assert(galleryHome.includes('../projects/polaroid-of-yesterday/photography/'));
console.log('Passed: 13 real archive projects and covers; local project pages/assets; Gallery hierarchy; Photographer entry; Spiral/Index labels; room Gallery entry; shared styles; neutral, uncropped images.');
