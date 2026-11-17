import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spiralMetrics, spiralPose, galleryLayout, interpolatePose } from '../dist/projects/polaroid-of-yesterday/photography/stills-layout.mjs';
import { exhibitionCollection, exhibitionSlug, exhibitionSubtitle } from './polaroid-exhibition.mjs';
const route = new URL(`../dist/gallery/${exhibitionSlug}/`, import.meta.url);
const photos = exhibitionCollection();
assert.equal(photos.length, 17);
assert.equal(photos[0].file, '808ff3b894762913f19f7d120b67afb4.png');
const modified = photos.map(p => Date.parse(p.modifiedAt));
assert(modified.every((value, i) => Number.isFinite(value) && (i === 0 || value >= modified[i - 1])),
  'Photographs follow the recorded modification times, oldest first');
assert.equal(new Set(photos.map(p => p.id)).size, photos.length);
assert.equal(new Set(photos.map(p => p.original)).size, photos.length, 'No duplicated source images');
assert(photos.every(p => ['In-game screenshot', 'Concept art', 'Image'].includes(p.kind) && p.alt), 'Each image has a media label and alt text');
for (const photo of photos) {
  assert(fs.statSync(new URL('../../' + photo.original, route)).size > 0);
  assert(fs.statSync(new URL('../../' + photo.rendition.variants.at(-1).path, route)).size > 0);
}
for (const [w,h] of [[1440,1000],[1920,1080],[1024,768],[768,1024],[390,844],[320,568],[844,390]]) {
  const m = spiralMetrics(w,h,photos.length);
  for (const position of [0, .5, 4, 9.5, photos.length - 1]) {
    const poses = photos.map((_, i) => spiralPose(i, position, h, m, true));
    for (const p of poses) {
      assert(Object.values(p).every(Number.isFinite));
      assert(p.z < m.perspective, 'Every image stays in front of the camera plane');
    }
    if (Number.isInteger(position)) {
      const center = poses[position];
      assert(center.x === 0 && center.z === 0 && center.ry === 0 && center.opacity === 1 && center.width === m.printWidth);
      const adjacent = poses[position === 0 ? 1 : position - 1];
      assert(Math.abs(adjacent.ry) > 40 && adjacent.z < 0 && adjacent.y < center.y, 'Side prints rise and recede');
    }
    const pose=poses[3], target={...pose,z:0,ry:0,rz:0};
    assert.deepEqual(interpolatePose(pose,target,0),pose);
    assert.deepEqual(interpolatePose(pose,target,1),target);
  }
  const wave = [1, 2, 3, 4, 5, 6, 7].map(i => spiralPose(i, 4, h, m, true));
  const projectedY = p => p.y / (1 - p.z / m.perspective);
  assert(wave.every(p => p.opacity === 1), 'Seven photos appear around a centered print');
  assert(projectedY(wave[3]) > projectedY(wave[1]) && projectedY(wave[3]) > projectedY(wave[5]) &&
    projectedY(wave[0]) > projectedY(wave[1]) && projectedY(wave[6]) > projectedY(wave[5]), 'The wave dips at the center and at its ends');
  assert(wave[0].width < wave[2].width && wave[6].width < wave[4].width, 'Distant prints become thumbnails');
  const fixed = spiralPose(0, 0, h, m, false);
  const fixedScrolled = spiralPose(0, 4, h, m, false);
  assert(fixedScrolled.x === fixed.x && fixedScrolled.ry === 0 && fixedScrolled.y < fixed.y,
    'Reduced motion scrolls vertically with forward-facing prints');
  const gallery=galleryLayout(w,h,photos);
  assert.equal(gallery.columns,w>=1440?4:w>=1024?3:2);
  for (const [i,p] of gallery.items.entries()) {
    const half=p.width/2, ph=p.width*4/3;
    assert(p.x+w/2-half>=0 && p.x+w/2+half<=w,'Gallery fits horizontally');
    assert(p.y-ph/2>=90 && p.y+ph/2+45<gallery.height,'Gallery preserves caption and image space');
    for(let j=i+1;j<gallery.items.length;j++) {
      const q=gallery.items[j],qh=q.width*4/3;
      assert(Math.abs(p.x-q.x)>=(p.width+q.width)/2 || p.y+ph/2+40<=q.y-qh/2 || q.y+qh/2+40<=p.y-ph/2,'Images and captions never overlap in gallery');
    }
  }
}
const html=fs.readFileSync(new URL('index.html',route),'utf8');
assert(html.includes(exhibitionSubtitle));
assert.equal((html.match(/class="print-link"/g)||[]).length, photos.length);
assert.deepEqual([...html.matchAll(/<figure class="print"[^>]*id="([^"]+)"/g)].map(m=>m[1]),photos.map(p=>p.id), 'Both views use one chronological DOM sequence');
assert.deepEqual([...html.matchAll(/class="print-link" href="\.\.\/\.\.\/([^"]+)"/g)].map(m=>m[1]),photos.map(p=>p.original), 'Every link opens its corresponding supplied original');
assert.deepEqual([...html.matchAll(/data-kind="([^"]+)"/g)].map(m=>m[1]),photos.map(p=>p.kind),'Media categories remain available in the viewer');
assert(!html.includes('class="print-caption"'), 'Index has no visible labels');
assert(html.includes('Trauma-Induced Dissociative Amnesia'));
for (const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(?:#|https?:|data:|mailto:)/.test(ref)) continue;
  assert(fs.existsSync(new URL(ref,route)),`Missing local dependency: ${ref}`);
}
console.log('Passed: original links and photo order; wave shape, receding thumbnails and interpolation; uncropped Index and reduced motion across seven viewports.');
