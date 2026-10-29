import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { imageDimensions } from './gallery-image.mjs';

const manifest=JSON.parse(fs.readFileSync('tools/gallery-image-renditions.json','utf8'));
const policy=JSON.parse(fs.readFileSync('tools/gallery-image-policy.json','utf8'));
assert.deepEqual(manifest.policy,policy);
assert.equal(policy.longEdge,3000);
const checked=new Set();
let variants=0;
for(const [source,record] of Object.entries(manifest.images)){
  const bytes=fs.readFileSync(path.join('dist',source));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,'Original must remain byte-identical: '+source);
  assert.deepEqual(imageDimensions(bytes),{width:record.width,height:record.height});
  assert.equal(new Set(record.variants.map(v=>v.width)).size,record.variants.length,'Each srcset width must be unique');
  for(const v of record.variants){
    assert(Math.max(v.width,v.height)<=3000 && v.width<=record.width && v.height<=record.height,'No enlargement and no image over the selected cap');
    assert(Math.abs(v.width*record.height-v.height*record.width)<=Math.max(record.width,record.height),'Full composition and natural ratio are retained');
    if(!checked.has(v.path)){
      const encoded=fs.readFileSync(path.join('dist',v.path));
      assert.equal(encoded.length,v.bytes);
      assert.equal(createHash('sha256').update(encoded).digest('hex'),v.sha256);
      assert.deepEqual(imageDimensions(encoded),{width:v.width,height:v.height});
      checked.add(v.path);
    }
    variants++;
  }
}
for(const target of Object.values(manifest.aliases))assert(manifest.images[target]);
for(const relative of fs.readdirSync('dist/gallery/assets',{recursive:true})){
  if(relative.startsWith('optimized'+path.sep)||! /\.(?:webp|jpe?g|png|avif|gif)$/i.test(relative))continue;
  assert(manifest.aliases['gallery/assets/'+relative.replaceAll('\\','/')],'Every retained Gallery raster must be covered');
}
const pages=JSON.parse(fs.readFileSync('dist/gallery/generated-pages.json'))
  .map(p=>'dist/gallery/'+p).concat('dist/projects/polaroid-of-yesterday/photography/index.html');
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  assert(! /<link\b[^>]*as="image"[^>]*href="(?![^"]*optimized)[^"]+\.(?:webp|jpe?g|png)/.test(html),'Do not preload an obsolete full-size preview');
  for(const [tag] of html.matchAll(/<img\b[^>]*>/g)){
    if(tag.includes('.svg')||! /\bsrc="[^"]+"/.test(tag))continue;
    assert(tag.includes('/gallery/assets/optimized/'),file+' must use optimized raster copies');
    assert(tag.includes('srcset=')&&tag.includes('sizes='),'Images require responsive candidates and a slot size');
  }
  const linked=(html.match(/class="(?:story-cover )?story-image-open"|class="print-link"/g)||[]).length;
  assert.equal((html.match(/data-view-src=/g)||[]).length,linked,'Every selectable photo has a capped high-resolution viewer image');
}
console.log(`Passed: ${Object.keys(manifest.images).length} original hashes; ${variants} responsive variants; 3000px cap/no upscaling; natural ratios; every Gallery raster and all ${pages.length} public Gallery/Stills pages.`);
