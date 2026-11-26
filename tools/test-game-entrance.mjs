import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  scatterObjects, driftObjects, prepareObjectExit, objectExitFrame,
} from '../dist/home-game-entrance.mjs';
import { paperPeelFrame } from '../dist/home-paper.mjs';

const names = ['mini-key', 'green-wallet', 'pocketknife', 'mini-cooper', 'bmw-z4'];
const sprites = names.map(name => ({ name, scale: 1, widthRatio: .8, heightRatio: 1 }));
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

  const indexed = items.map((item, id) => ({ ...item, id }));
  const offscreen = { ...first, id: -1, x: width + first.size };
  const exit = prepareObjectExit([...indexed, offscreen], width, height);
  const start = objectExitFrame(exit, 0);
  assert(start.length > 0 && start.length <= size);
  assert(start.every(item => item.id !== offscreen.id), 'An offscreen incoming object must stay out');
  assert.deepEqual(start, exit.items, 'Click must start with the last hover pose');
  const next = objectExitFrame(exit, .000001);
  for (const item of next) {
    const initial = indexed[item.id];
    assert(Math.abs((item.x - initial.x) / .000001 - item.vx) < .02);
    assert(Math.abs((item.y - initial.y) / .000001 - item.vy) < .02);
    const radius = item.size * Math.hypot(item.sprite.widthRatio, item.sprite.heightRatio) / 2;
    assert(initial.x + item.vx * item.leavesAt <= -radius + 1e-8 ||
      initial.y + item.vy * item.leavesAt >= height + radius - 1e-8, 'Each path must end outside the viewport');
  }
  let previous = new Map(start.map(item => [item.id, item]));
  for (let frame = 1; frame <= 60; frame++) {
    const remaining = objectExitFrame(exit, exit.duration * frame / 60);
    for (const item of remaining) {
      const last = previous.get(item.id);
      assert(last, 'Only objects moving at the moment of click can appear during exit');
      assert(item.x < last.x && item.y > last.y && item.size === last.size);
      assert(Math.abs((item.y - last.y) / (last.x - item.x) + item.vy / item.vx) < 1e-8);
    }
    previous = new Map(remaining.map(item => [item.id, item]));
  }
  assert.equal(previous.size, 0, 'Every object must leave before the paper curls');

  const startsAt = paperPeelFrame(width, height, .08);
  assert(startsAt.paper.some(([x, y]) => y === 0 && x > 0 && x < width));
  assert(startsAt.paper.some(([x, y]) => x === width && y > 0 && y < height));
  assert(!startsAt.paper.some(([x, y]) => x === width && y === 0));
  assert(startsAt.paper.some(([x, y]) => x === width && y === height));
  assert.equal(paperPeelFrame(width, height, 0).depth, 0);
  const diagonal = paperPeelFrame(width, height, .5);
  assert(Math.abs(Math.tan(diagonal.angle) - first.vy / first.vx) < 1e-10, 'The fold follows the objects');
  assert(diagonal.depth > 20 && diagonal.end - diagonal.start > Math.min(width, height));
  const finishesAt = paperPeelFrame(width, height, .92);
  assert(finishesAt.paper.some(([x, y]) => x === 0 && y === height));
  assert(finishesAt.paper.every(([x, y]) => x < width / 2 && y > height / 2));
  let previousArea = width * height;
  for (let frame = 1; frame <= 90; frame++) {
    const { paper } = paperPeelFrame(width, height, frame / 90);
    const next = area(paper);
    assert(next < previousArea);
    previousArea = next;
  }
  assert.equal(previousArea, 0);
}

console.log('Passed: five transparent WebP cutouts; bounded diagonal streams; uninterrupted diagonal exits; matching upper-right to lower-left curl on four viewport sizes.');
