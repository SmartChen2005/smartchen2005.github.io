import assert from 'node:assert/strict';
import { BOUNDS, GAP, LIMIT, fits, place, move, overlaps } from '../dist/construction-space.mjs';

const fixed = { id: 1, x: 0, z: 0, radius: .6 };
const moving = { id: 2, x: -2, z: 0, radius: .4 };
move(moving, { x: 2, z: 0 }, [fixed, moving]);
assert(moving.x < -fixed.radius - moving.radius - GAP + .025, 'A long drag must stop before the blocking object, without tunnelling');
assert(!overlaps(fixed, moving));
const wall = { id: -1, x: 2.55, z: -1.6, halfWidth: .6, halfDepth: 1.8 };
assert(overlaps({ x: 2, z: 0, radius: .35 }, wall), 'The wall column blocks full prop footprints');
assert(!overlaps({ x: 1.5, z: 0, radius: .35 }, wall), 'Props clear of the wall column remain movable');
move(moving, { x: -100, z: -100 }, [fixed, moving]);
assert(fits(moving, [fixed, moving]), 'Drag clamps the full footprint within room boundaries');

let seed = 404;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const objects = [{ ...fixed }];
for (let id = 2; id <= LIMIT; id++) {
  const candidate = place({ id, radius: .22 + random() * .2 }, objects, random);
  if (candidate) objects.push(candidate);
}
assert(objects.length >= 24, 'Room accommodates dozens of conservatively spaced props');
for (let i = 0; i < 1000; i++) {
  const body = objects[Math.floor(random() * objects.length)];
  move(body, { x: (random() - .5) * 20, z: (random() - .5) * 20 }, objects);
  for (const object of objects) assert(fits(object, objects), 'Every drag preserves all footprint boundaries and pairwise separation');
}
const impossible = place({ id: 100, radius: BOUNDS.maxX - BOUNDS.minX }, objects, random);
assert.equal(impossible, null, 'Full or impossible layouts skip spawning instead of overlapping');
console.log(`Passed: ${objects.length} non-overlapping objects; 1,000 long random drags; boundary clamps; collision blocking; impossible-placement fallback.`);
