import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseNotionMarkdown, adaptNotionBlocks, publicationNodes, allImages } from './gallery-document.mjs';
import { renderChapters } from './gallery-practice.mjs';
import { filmSections } from './gallery-film.mjs';
import { sourceCarousels } from './gallery-carousels.mjs';

const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const snapshot=JSON.parse(read('gallery-notion/snapshot.json'));
const walk=nodes=>nodes.flatMap(n=>[n,...(n.children?walk(n.children):[]),...(n.columns?n.columns.flatMap(c=>walk(c.children)):[])]);
const nodesOf=page=>page.blocks?adaptNotionBlocks(page.blocks):parseNotionMarkdown(page.markdown);
for(const page of snapshot.pages.filter(p=>p.properties.Type==='Film')){
 const source=publicationNodes(nodesOf(page)),grouped=filmSections(source);
 assert.deepEqual(allImages(grouped).map(i=>i.src),allImages(source).map(i=>i.src),'Film grouping retains every photograph in its authored order');
 for(const type of ['paragraph','video','toggle'])assert.deepEqual(walk(grouped).filter(n=>n.type===type).map(n=>n.text??n.src),walk(source).filter(n=>n.type===type).map(n=>n.text??n.src),'Film grouping retains authored '+type+' content and order');
 const html=read('../dist/gallery/'+page.properties.Slug+'/index.html');
 const hero=html.split('<header class="story-hero">')[1].split('</header>')[0];
 assert(!hero.includes('story-cover'),'Film detail starts with its authored composition rather than a CMS poster');
 assert(!hero.includes('project-meta'),'Film credits remain in their authored body position');
 assert(html.includes('film-layout.css'),'Film layout rules are loaded');
 const carousel=walk(grouped).find(n=>n.presentation==='film-carousel');
 if(carousel){
  assert(html.includes('tabindex="0" role="region" aria-label="Behind the scenes photographs"'));
  assert(html.includes('data-strip-prev')&&html.includes('data-strip-next'));
  assert.equal((html.split('<div class="film-strip"')[1].split('</nav>')[0].match(/class="story-image-open"/g)||[]).length,allImages(carousel.children).length,'Every backstage photo remains in its carousel');
 }
}
const darkroom=snapshot.pages.find(p=>p.properties.Slug==='intro-to-darkroom');
const html=read('../dist/gallery/intro-to-darkroom/index.html');
const darkroomStrips=[...html.matchAll(/<div class="film-carousel">([\s\S]*?)<nav class="film-strip-controls"/g)].map(m=>m[1]);
assert.deepEqual(darkroomStrips.map(strip=>(strip.match(/class="story-image-open"/g)||[]).length),[4,2],'Original Lightroom and Enlarger groups remain four- and two-photo carousels');
assert(html.includes('aria-label="Lightroom comparison photographs"')&&html.includes('aria-label="Enlarger contrast comparison photographs"'));
const fixture=[{type:'columns',columns:[{children:[{type:'image',src:'a'},{type:'image',src:'b'}]},{children:[{type:'paragraph',text:'Original explanation'}]}]},{type:'columns',columns:[{children:[{type:'image',src:'c'}]},{children:[{type:'image',src:'d'}]}]}];
const grouped=sourceCarousels(fixture,[{label:'Comparison',originals:['a','b']}],src=>({original:src}));
assert.equal(grouped[0].columns[0].children[0].presentation,'film-carousel','Source carousel remains beside its explanation');
assert.equal(grouped[1].type,'columns','Ordinary authored photo pairs are not converted to carousels');
assert.deepEqual(allImages(grouped).map(i=>i.src),['a','b','c','d'],'Restoring carousel behavior preserves image order');
const headings=publicationNodes(nodesOf(darkroom)).filter(n=>n.type==='heading'&&n.level===2);
assert.equal((html.match(/href="#chapter-section-\d+"/g)||[]).length,headings.length);
assert.equal((html.match(/href="#chapter-contents"/g)||[]).length,headings.length);
for(let i=1;i<=headings.length;i++)assert(html.includes('id="chapter-section-'+i+'"'),'Every directory target exists');
const labels=[...html.matchAll(/data-image-title="Intro to Darkroom — photograph (\d+)"/g)].map(m=>Number(m[1]));
assert.deepEqual(labels,Array.from({length:16},(_,i)=>i+1),'Chapter boundaries preserve global image numbering');
const rest=adaptNotionBlocks([{type:'heading_2',heading_2:{rich_text:[{plain_text:'New chapter'}]}},{type:'paragraph',paragraph:{rich_text:[{plain_text:'Edited body'}]}}]);
const rendered=renderChapters(rest,{title:'Test'});
assert(rendered.index.includes('New chapter')&&rendered.document.includes('Edited body'),'CMS/REST chapter edits flow into the shared index');
console.log('Passed: Film content, video/poem/photo order, authored opening compositions, backstage carousel completeness, chapter links/return targets, continuous numbering, and REST-driven chapter updates.');
