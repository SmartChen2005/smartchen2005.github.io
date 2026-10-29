import assert from 'node:assert/strict';
import fs from 'node:fs';

// Limit responsive compression to the four film photos, preserving large screens.
const assets = JSON.parse(fs.readFileSync(new URL('./home-assets.json', import.meta.url)));
assert.equal(assets.images.length, 4);
for (const image of assets.images) {
  assert(image.source.startsWith('photography-preview/'));
  assert.deepEqual(image.variants.map(v => v.width), [480, 960, 1920]);
  for (const v of image.variants) assert(Math.abs(v.width / v.height - image.width / image.height) < .005);
}
assert(assets.images.reduce((n, image) => n + image.variants.find(v => v.width === 960).bytes, 0) < 400_000);
assert(assets.images.reduce((n, image) => n + image.variants.at(-1).bytes, 0) < 1_100_000);
const home = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const portrait = home.match(/<figure class="portrait portrait-full"[^>]*>([\s\S]*?)<\/figure>/)?.[1];
assert(portrait?.includes('src="assets/selfportrait-light.webp?rev=20261029-3000"'));
assert(!portrait.includes('srcset='), 'The portrait must retain its requested resolution');
assert.deepEqual([assets.portrait.width, assets.portrait.height], [3000, 2000]);
assert.equal(assets.portrait.quality, 95);
assert(assets.portrait.bytes < assets.portrait.originalBytes);
console.log('Passed: four responsive film photos and media budgets; requested 3000x2000 quality-95 portrait.');
