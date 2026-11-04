import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spiralMetrics, spiralPose, galleryLayout, interpolatePose } from '../dist/projects/polaroid-of-yesterday/photography/stills-layout.mjs';
import { exhibitionCollection, exhibitionSlug, exhibitionSubtitle } from './polaroid-exhibition.mjs';
import { canonicalMediaUrl, mediaIdentity } from './gallery-document.mjs';
const route = new URL('../dist/gallery/trauma-induced-dissociative-amnesia/', import.meta.url);
const snapshot = JSON.parse(fs.readFileSync(new URL('./gallery-notion/snapshot.json', import.meta.url), 'utf8'));
const media = JSON.parse(fs.readFileSync(new URL('./gallery-notion/media.json', import.meta.url), 'utf8'));
const page = snapshot.pages.find(p => p.properties.Slug === exhibitionSlug);
const resolve = url => media[url] || media[canonicalMediaUrl(url)] || media['notion-asset:' + mediaIdentity(url)];
const photos = exhibitionCollection(page, resolve);
assert.deepEqual(photos, exhibitionCollection(page, resolve), 'Mixing is reproducible across syncs/builds');
const withPrivateImage = {...page, blocks: undefined, markdown: page.markdown + '\n<details>\n<summary>Website layout notes (not published)</summary>\n![](https://example.com/private-note.jpg)\n</details>'};
assert.deepEqual(photos, exhibitionCollection(withPrivateImage, resolve), 'Images in private editor notes cannot enter the public exhibition');
assert.equal(photos.length, 31);
assert.equal(photos.filter(p => p.kind === 'Concept art').length, 11);
assert.equal(photos.filter(p => p.kind === 'In-game screenshot').length, 20);
assert(photos.slice(0, 10).some(p => p.kind === 'Concept art') && photos.slice(-10).some(p => p.kind === 'Concept art'), 'Concepts are mixed throughout');
assert.equal(new Set(photos.map(p => p.id)).size, photos.length);
assert.equal(new Set(photos.map(p => p.original)).size, photos.length, 'No duplicated source images');
assert(photos.every(p => ['In-game screenshot', 'Concept art'].includes(p.kind)), 'Each image uses the requested media label');
for (const photo of photos) {
  assert(fs.statSync(new URL('../../' + photo.original, route)).size > 0);
  assert(fs.statSync(new URL('../../' + photo.rendition.variants.at(-1).path, route)).size > 0);
}
for (const [w,h] of [[1440,1000],[1920,1080],[1024,768],[768,1024],[390,844],[320,568],[844,390]]) {
  const m = spiralMetrics(w,h,photos.length);
  for (const progress of [0,.25,.5,.75,1]) {
    const poses = photos.map((_,i) => spiralPose(i,progress,w,h,photos.length));
    for (const p of poses) {
      assert(Object.values(p).every(Number.isFinite));
      assert(Math.abs((p.x/m.radius)**2 + (p.z/(m.radius*.7))**2 - 1) < 1e-8, 'Photographs occupy a genuine helix, with circular x/z coordinates');
      assert(p.z < m.perspective, 'Every image stays in front of the camera plane');
    }
    for (let i=1;i<poses.length;i++) assert(poses[i].y > poses[i-1].y, 'Helix advances on the vertical axis');
    const pose=poses[3], target={...pose,z:0,ry:0,rz:0};
    assert.deepEqual(interpolatePose(pose,target,0),pose);
    assert.deepEqual(interpolatePose(pose,target,1),target);
  }
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
assert.deepEqual([...html.matchAll(/<figure class="print"[^>]*id="([^"]+)"/g)].map(m=>m[1]),photos.map(p=>p.id), 'Both views use one mixed DOM sequence');
assert.deepEqual([...html.matchAll(/class="print-caption"><span>([^<]+)<\/span><\/span>/g)].map(m=>m[1]),photos.map(p=>p.kind),'Only media categories are shown as descriptions');
for (const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(?:#|https?:|data:|mailto:)/.test(ref)) continue;
  assert(fs.existsSync(new URL(ref,route)),`Missing local dependency: ${ref}`);
}
console.log('Passed: local assets and original links; media labels; true helix geometry; camera safety; continuous pose interpolation; uncropped, non-overlapping galleries across seven viewports.');
