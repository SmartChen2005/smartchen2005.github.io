import assert from 'node:assert/strict';
import { BOUNDS, GAP, LIMIT, fits, place, move, push, overlaps } from '../dist/construction-space.mjs';

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

const chain = Array.from({ length: 4 }, (_, i) => ({ id: i + 1, x: -1.3 + i * .645, z: .8, radius: .3 }));
const chainStart = chain.map(body => body.x);
const pushed = push(chain[0], { x: -.3, z: .8 }, chain);
assert.equal(pushed.size, 4, 'Contact propagates through a chain of four movable props');
assert(chain.every((body, i) => body.x > chainStart[i] + .9), 'The entire chain is displaced rather than acting as a rigid blocker');
assert(chain.every(body => fits(body, chain)));

const pinned = [{ id: 1, x: 2.155, z: 1, radius: .3 }, { id: 2, x: 2.8, z: 1, radius: .3 }];
push(pinned[0], { x: 3, z: 1 }, pinned);
assert(pinned.every(body => fits(body, pinned)), 'A chain pinned at the floor boundary cannot clip');
assert(Math.abs(pinned[0].x - 2.155) < .001 && pinned[1].x === 2.8, 'Failed chain pushes roll back all positions');
const wallChain = [{ id: 1, x: 1, z: 0, radius: .27 }, { id: 2, x: 1.6, z: 0, radius: .27 }, wall];
push(wallChain[0], { x: 2, z: 0 }, wallChain);
assert(wallChain.slice(0, 2).every(body => fits(body, wallChain)), 'Pushing into an immovable column is stable');
assert.equal(wall.x, 2.55, 'Architectural obstacles do not move');
const diagonal = { id: 1, x: 1.55, z: -1, radius: .3 };
push(diagonal, { x: 2.1, z: -.2 }, [diagonal, wall]);
assert(diagonal.z > -.3 && fits(diagonal, [diagonal, wall]), 'A drag can slide along a wall when its normal motion is blocked');

for (let i = 0; i < 350; i++) {
  const body = objects[Math.floor(random() * objects.length)];
  push(body, { x: (random() - .5) * 12, z: (random() - .5) * 12 }, objects);
  for (const prop of objects) assert(fits(prop, objects), 'Dense randomized pushes preserve boundaries and separation');
}
console.log(`Passed: ${objects.length} props; 1,000 swept drags; 350 dense pushes; four-object chain displacement; pinned-chain rollback; column exclusion; wall sliding; impossible spawning.`);
