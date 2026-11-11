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
const statementRoute='personal-statement/index.html';
const pages=[new URL('index.html',gallery),new URL('gran-turismo/index.html',gallery),new URL(statementRoute,gallery),new URL('dist/projects/gran-turismo/index.html',root),...published.map(p=>new URL(`${p.properties.Slug}/index.html`,gallery))];
const managed=JSON.parse(fs.readFileSync(new URL('generated-pages.json',gallery),'utf8'));
assert.deepEqual(new Set(managed),new Set(['index.html','gran-turismo/index.html',statementRoute,...published.map(p=>p.properties.Slug+'/index.html')]),'Managed routes include local entries and published CMS projects');
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
assert.match(stills,/location.replace\("\.\.\/\.\.\/\.\.\/gallery\/trauma-induced-dissociative-amnesia\/" \+ location.search \+ location.hash\)/);
const exhibition=fs.readFileSync(new URL('trauma-induced-dissociative-amnesia/index.html',gallery),'utf8');
assert.match(exhibition,/data-view="gallery"[^>]*>Index<\/button>/);
const room=fs.readFileSync(new URL('dist/projects/polaroid-of-yesterday/index.html',root),'utf8');
assert.match(room,/camera-tag-title">Gallery /);
const stillCss=fs.readFileSync(new URL('dist/projects/polaroid-of-yesterday/photography/stills.css',root),'utf8');
assert.match(stillCss,/@import url\('\.\.\/\.\.\/\.\.\/gallery\/gallery-base.css'\)/);
for(const file of ['gallery.css','gallery-base.css'])assert(!/object-fit:\s*cover|filter:|box-shadow:/.test(fs.readFileSync(new URL(file,gallery),'utf8')),'Neutral, uncropped photographs');
const galleryHome=fs.readFileSync(new URL('index.html',gallery),'utf8');
assert(galleryHome.includes(`${published.length+2} projects`),'Count both local entries and each published exhibition once');
const publishedSlugs=new Set(published.map(p=>p.properties.Slug));
for(const p of projects.filter(p=>!publishedSlugs.has(p.id))){
 assert(!fs.existsSync(new URL(`${p.id}/index.html`,gallery)),`Removed CMS project has no public article: ${p.id}`);
 assert(!galleryHome.includes(`href="${p.id}/"`),`Removed CMS project has no homepage entry: ${p.id}`);
}
assert(galleryHome.includes('trauma-induced-dissociative-amnesia/'));
const stillsSection = galleryHome.match(/id="stills"[\s\S]*?(?=<section class="gallery-section" id="films")/)?.[0];
assert(stillsSection?.includes('href="trauma-induced-dissociative-amnesia/"') && stillsSection.includes('href="gran-turismo/"'), 'Stills links to both independent exhibitions');
assert(stillsSection.includes('2 projects') && stillsSection.includes('Game Screenshots'));
assert(galleryHome.indexOf('class="feature"') < galleryHome.indexOf('id="photography"'), 'Selected remains an independent feature above Photography');
assert(galleryHome.indexOf('id="photography"') < galleryHome.indexOf('id="stills"') && galleryHome.indexOf('id="stills"') < galleryHome.indexOf('id="films"'), 'Category order is Photography, Stills, Film');
assert.equal((stillsSection.match(/class="project-card"/g)||[]).length,2, 'Stills has two peer cards');
assert(stillsSection.indexOf('href="trauma-induced-dissociative-amnesia/"') < stillsSection.indexOf('href="gran-turismo/"'), 'TIDA is the left card and Gran Turismo the right card');
assert(stillsSection.includes('assets/gran-turismo-placeholder.svg'), 'Gran Turismo has an explicit image placeholder');
const statementOpening='I believe the artist is not the ultimate authority on their own art.';
assert.match(galleryHome, /class="feature"[\s\S]*?href="trauma-induced-dissociative-amnesia\/"[\s\S]*?<\/section>\s*<div class="statement-card">/);
assert(!stillsSection.includes('class="statement-card"'));
assert(galleryHome.includes('<span class="statement-card-quote">The artist is not the ultimate authority on their own art.</span>'));
const statementPage=fs.readFileSync(new URL(statementRoute,gallery),'utf8');
assert(statementPage.includes('class="gallery-header"'));
assert.deepEqual([...statementPage.matchAll(/<strong>([^<]*)<\/strong>/g)].map(match=>match[1]),[statementOpening]);
assert(statementPage.includes('to become its co-storytellers.'));
assert(!stillsSection.includes('class="feature"'), 'The Selected hero is outside Stills');
for (const file of pages) assert.match(fs.readFileSync(file,'utf8'), /href="(?:\.\.\/)?#stills">Stills<\/a>|data-project-header/, 'Gallery Stills navigation returns to the two-entry section');
const projectDirectory=fs.readFileSync(new URL('dist/projects/index.html',root),'utf8');
assert.match(projectDirectory, /class="directory-link" href="gran-turismo\/"/);
const projectPage=fs.readFileSync(new URL('dist/projects/gran-turismo/index.html',root),'utf8');
assert(projectPage.includes('<h1>Gran Turismo</h1>'));
assert.match(projectPage, /src="https:\/\/www\.youtube-nocookie\.com\/embed\/OFylHWSwYDY"/, 'Embed the exact user-supplied video');
assert(projectPage.includes('href="https://youtu.be/OFylHWSwYDY"'), 'Keep a native direct-video link');
assert(!projectPage.includes('autoplay=1'), 'The video starts only when requested');
const gameStills=fs.readFileSync(new URL('gran-turismo/index.html',gallery),'utf8');
assert(gameStills.includes('Game Screenshots') && gameStills.includes('<h1>Gran Turismo</h1>'));
assert(!/<img[^>]*class="(?:print|story-image)|class="story-body"/.test(gameStills), 'No invented screenshots or article copy');
assert(!galleryHome.includes('class="stills-feature"'),'No duplicate standalone Stills entry');
assert.match(room,/href="\.\.\/\.\.\/gallery\/trauma-induced-dissociative-amnesia\/"/);
assert.match(room,/>Concept Photography and Game Screenshots<\/span>/);
console.log(`Passed: ${published.length} published CMS projects; archived cover provenance; removed routes; local pages/assets; Gallery hierarchy; Photographer entry; Spiral/Index labels; room Gallery entry; shared styles; neutral, uncropped images.`);
