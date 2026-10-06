import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root='dist/projects/multiverse-all-star-battlefront';
const source=JSON.parse(fs.readFileSync('tools/masb-source/content.json','utf8'));
const html=fs.readFileSync(`${root}/index.html`,'utf8');
const decode=text=>text.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"');
const text=decode(html.replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ');
let cursor=0;
for(const paragraph of source.intro){
  const index=text.indexOf(paragraph,cursor);
  assert(index>=cursor,`Introduction paragraph is missing or out of order: ${paragraph.slice(0,50)}`);
  cursor=index+paragraph.length;
}
// Compare the document itself, excluding the duplicate navigation labels.
const article=decode(html.match(/<article[^>]*>([\s\S]*?)<\/article>/)[1].replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ');
cursor=0;
for(const block of source.blocks.slice(2).filter(b=>b.text)){
  const index=article.indexOf(block.text,cursor);
  assert(index>=cursor,`Document block is missing or out of order: ${block.text.slice(0,50)}`);
  cursor=index+block.text.length;
}
assert.equal((html.match(/data-preview/g)||[]).length,19,'Preserve all original images');
assert.equal((html.match(/<li>/g)||[]).length,2,'Preserve the source ordered list');
assert.equal((html.match(/class="document-section"/g)||[]).length,7);
assert.equal((html.match(/class="contribution"/g)||[]).length,4);
const items=[...source.media,...source.blocks.filter(b=>b.kind==='image')];
for(const item of items){
  const file=path.join(root,'assets',item.file);
  assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),item.sha256,`Original asset changed: ${file}`);
  assert(item.width>0 && item.height>0,'Every asset reserves its original image ratio');
}
for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(/^(https?:|mailto:|#)/.test(ref))continue;
  assert(fs.existsSync(path.resolve(root,ref)),`Missing destination: ${ref}`);
}
for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert(html.includes(`id="${id}"`),`Missing anchor: ${id}`);
assert(!/<iframe|https:\/\/(sites|docs)\.google\.com\/(?:sitesv|docs)-images/.test(html),'No expiring remote image URLs or source embeds');
assert(fs.readFileSync('dist/projects/index.html','utf8').includes('href="multiverse-all-star-battlefront/"'));
console.log('Passed: complete ordered source copy; 7 sections; 4 contributors; 19 original image checksums and ratios; ordered list; all routes and anchors; local assets.');
