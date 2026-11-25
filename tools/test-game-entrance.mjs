import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  scatterObjects, driftObjects, collectObjects, landingPose, paperPeelFrame, DRAIN_DURATION,
} from '../dist/home-game-entrance.mjs';

const names = ['mini-key', 'green-wallet', 'pocketknife', 'mini-cooper', 'bmw-z4'];
const sprites = names.map(name => ({ name, scale: 1 }));
let seed = 69;
const random = () => {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const area = polygon => Math.abs(polygon.reduce((sum, [x, y], i) => {
  const [nextX, nextY] = polygon[(i + 1) % polygon.length];
  return sum + x * nextY - y * nextX;
}, 0) / 2);

let totalBytes = 0;
for (const name of names) {
  const bytes = readFileSync(new URL(`../dist/assets/game-objects/${name}.webp`, import.meta.url));
  assert.equal(bytes.toString('ascii', 8, 16), 'WEBPVP8X');
  assert(bytes[20] & 0x10, `${name} needs a transparent alpha channel`);
  assert.equal(bytes[20] & 0x2c, 0, `${name} must ship without camera metadata or embedded profile`);
  totalBytes += bytes.length;
}
assert(totalBytes < 85_000);

for (const [width, height] of [[1440, 900], [390, 844], [844, 390], [3840, 2160]]) {
  const items = scatterObjects(width, height, sprites, random);
  assert.deepEqual(new Set(items.map(({ sprite }) => sprite)), new Set(sprites));
  assert.equal(new Set(items.map(({ x, y }) => `${x > width / 2}-${y > height / 2}`)).size, 4);
  const first = { ...items[0] };
  driftObjects(items, width, height, 1 / 60, sprites, random);
  assert(items[0].x < first.x && items[0].y > first.y);
  const size = items.length;
  for (let frame = 0; frame < 1800; frame++) {
    driftObjects(items, width, height, 1 / 60, sprites, random);
    assert.equal(items.length, size);
    assert(items.every(({ x, y }) => x > -65 && y < height + 65 && x < width + 65 && y > -65));
  }

  const collection = collectObjects([...items, { x: -130, y: 0, size: 50 }], width, height, random);
  assert(collection.length > 0 && collection.length <= size);
  for (const item of collection) {
    const { x, y, angle, size } = item;
    assert.deepEqual(landingPose(item, 0), { x, y, angle, size });
    const next = landingPose(item, .00001);
    assert(Math.abs((next.x - x) / .00001 - item.vx) < .15);
    assert(Math.abs((next.y - y) / .00001 - item.vy) < .15);
    const resting = landingPose(item, DRAIN_DURATION);
    assert(resting.x <= 80 && resting.y >= height - 52);
    assert(resting.size < size);
  }

  const startsAt = paperPeelFrame(width, height, .08);
  assert(startsAt.paper.some(([x, y]) => x === width && y < height));
  assert(startsAt.paper.some(([x, y]) => x < width && y === height));
  assert.equal(paperPeelFrame(width, height, 0).depth, 0);
  const diagonal = paperPeelFrame(width, height, .5);
  assert(diagonal.depth > 20 && diagonal.end - diagonal.start > Math.min(width, height));
  let previousArea = width * height;
  for (let frame = 1; frame <= 90; frame++) {
    const { paper } = paperPeelFrame(width, height, frame / 90);
    const next = area(paper);
    assert(next < previousArea);
    previousArea = next;
  }
  assert.equal(previousArea, 0);
}

console.log('Passed: five transparent WebP cutouts; bounded diagonal streams; live momentum into lower-left landings; continuous lower-right peel on four viewport sizes.');
