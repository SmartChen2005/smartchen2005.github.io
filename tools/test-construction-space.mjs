import assert from 'node:assert/strict';
import { BOUNDS, GAP, LIMIT, fits, place, move, push, overlaps, PHYSICS_STEP, stepPhysics, hasMotion } from '../dist/construction-space.mjs';

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

const coast = { id: 1, x: 0, z: 1, radius: .3, mass: 1, vx: 2, vz: 0, spin: .6 };
for (let i = 0; i < 24; i++) stepPhysics([coast], []);
assert(coast.x > .2 && coast.vx > .2, 'Released props coast instead of stopping abruptly');
for (let i = 0; i < 600; i++) stepPhysics([coast], []);
assert(!hasMotion([coast]) && coast.x < .9, 'Floor friction brings translation and yaw completely to rest');
const coastAtRest = { x: coast.x, z: coast.z, angle: coast.angle };
for (let i = 0; i < 120; i++) stepPhysics([coast], []);
assert.deepEqual({ x: coast.x, z: coast.z, angle: coast.angle }, coastAtRest, 'Settled props do not jitter');

const impact = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, x: -.5 + i * .645, z: 1, radius: .3, mass: 1, vx: i ? 0 : 2, vz: 0 }));
stepPhysics(impact, []);
assert(impact[2].vx > .1, 'A moving prop transfers momentum through a contact chain');
for (let i = 0; i < 180; i++) { stepPhysics(impact, []); assert(impact.every(body => fits(body, impact))); }
assert(impact[2].x > .9, 'The struck chain slides apart after impact');

const glance = [{ id: 1, x: -.68, z: 1, radius: .3, mass: 1, vx: 3, vz: 0 }, { id: 2, x: 0, z: 1.2, radius: .3, mass: 1 }];
for (let i = 0; i < 70; i++) { stepPhysics(glance, []); assert(glance.every(body => fits(body, glance))); }
assert(Math.abs(glance[1].angle) > .015, 'A glancing collision produces a small physical yaw');
const rebound = { id: 1, x: 2.79, z: 2, radius: .3, mass: 1, vx: 2, vz: 0 };
stepPhysics([rebound], []);
assert(rebound.vx < 0 && fits(rebound, [rebound]), 'Wall impacts rebound gently without leaving floor bounds');

const held = { id: 1, x: -1, z: 1, radius: .3, mass: 1 };
stepPhysics([held], [], PHYSICS_STEP, { body: held, x: 1, z: 1 });
assert(held.x > -1 && held.x < -.9, 'Dragging follows a spring instead of teleporting');
for (let i = 0; i < 200; i++) stepPhysics([held], [], PHYSICS_STEP, { body: held, x: 1, z: 1 });
assert(Math.abs(held.x - 1) < .002, 'The dragged prop accurately settles under the pointer');

const dynamic = [];
for (let id = 1; id <= LIMIT; id++) {
  const body = place({ id, radius: .22 + random() * .18, mass: .5 + random() * 2, vx: (random() - .5) * 6, vz: (random() - .5) * 6, spin: (random() - .5) * 3 }, [...dynamic, wall], random);
  if (body) dynamic.push(body);
}
for (let i = 0; i < 1200; i++) {
  const body = dynamic[Math.floor(i / 75) % dynamic.length];
  const drag = i < 900 ? { body, x: Math.sin(i / 60) * 2.8, z: Math.cos(i / 80) * 2.5 } : null;
  stepPhysics(dynamic, [wall], PHYSICS_STEP, drag);
  for (const prop of dynamic) {
    assert(fits(prop, [...dynamic, wall]), 'Dense inertial contacts retain every volume and wall boundary');
    assert(Number.isFinite(prop.angle) && Math.hypot(prop.vx, prop.vz) <= 4.000001, 'Motion stays finite and bounded');
  }
}
for (let i = 0; i < 400; i++) stepPhysics(dynamic, [wall]);
assert(!hasMotion(dynamic), 'The crowded scene settles fully after input ends');
console.log(`Passed: spring following, release glide, contact-chain momentum, glancing yaw, soft wall rebound, rest without jitter, ${dynamic.length} dynamic props over 1,600 fixed steps.`);
