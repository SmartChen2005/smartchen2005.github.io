/* Conservative circular footprints include every orientation of each prop. */
export const LIMIT = 40;
export const BOUNDS = { minX: -3.1, maxX: 3.1, minZ: -2.8, maxZ: 3.1 };
export const GAP = .045;
export function overlaps(a, b) {
  if (b.halfWidth !== undefined) {
    const dx = Math.max(0, Math.abs(a.x - b.x) - b.halfWidth);
    const dz = Math.max(0, Math.abs(a.z - b.z) - b.halfDepth);
    return Math.hypot(dx, dz) < a.radius + GAP - 1e-7;
  }
  return Math.hypot(a.x - b.x, a.z - b.z) < a.radius + b.radius + GAP - 1e-7;
}
export function fits(candidate, objects, bounds = BOUNDS) {
  const { x, z, radius } = candidate;
  return x - radius >= bounds.minX && x + radius <= bounds.maxX && z - radius >= bounds.minZ && z + radius <= bounds.maxZ && objects.every(other => other.id === candidate.id || !overlaps(candidate, other));
}
export function place(object, objects, random = Math.random, visible = () => true) {
  for (let i = 0; i < 180; i++) {
    const candidate = { ...object, x: BOUNDS.minX + object.radius + random() * (BOUNDS.maxX - BOUNDS.minX - 2 * object.radius), z: BOUNDS.minZ + object.radius + random() * (BOUNDS.maxZ - BOUNDS.minZ - 2 * object.radius) };
    if (fits(candidate, objects) && visible(candidate)) return candidate;
  }
  return null;
}
export function move(object, target, objects) {
  const x = Math.max(BOUNDS.minX + object.radius, Math.min(BOUNDS.maxX - object.radius, target.x));
  const z = Math.max(BOUNDS.minZ + object.radius, Math.min(BOUNDS.maxZ - object.radius, target.z));
  const distance = Math.hypot(x - object.x, z - object.z);
  const steps = Math.max(1, Math.ceil(distance / .025));
  const dx = (x - object.x) / steps, dz = (z - object.z) / steps;
  let moved = false;
  for (let i = 0; i < steps; i++) {
    const both = { ...object, x: object.x + dx, z: object.z + dz };
    if (fits(both, objects)) { object.x = both.x; object.z = both.z; moved = true; continue; }
    const horizontal = { ...object, x: object.x + dx };
    if (fits(horizontal, objects)) { object.x = horizontal.x; moved = true; }
    const vertical = { ...object, z: object.z + dz };
    if (fits(vertical, objects)) { object.z = vertical.z; moved = true; }
  }
  return moved;
}

/* Quasi-static floor contact: a drag displaces neighbours along their contact
   normal. Each small sweep is transactional, so a chain pinned by a wall stops
   without leaving penetrations. The inertial layer uses these same safe sweeps. */
export function push(object, target, objects, onContact = null) {
  const x = Math.max(BOUNDS.minX + object.radius, Math.min(BOUNDS.maxX - object.radius, target.x));
  const z = Math.max(BOUNDS.minZ + object.radius, Math.min(BOUNDS.maxZ - object.radius, target.z));
  const steps = Math.max(1, Math.ceil(Math.hypot(x - object.x, z - object.z) / .025));
  const dx = (x - object.x) / steps, dz = (z - object.z) / steps;
  const changed = new Set();
  const attempt = (stepX, stepZ) => {
    if (Math.abs(stepX) + Math.abs(stepZ) < 1e-10) return false;
    const journal = new Map(), visiting = new Set(), contacts = [];
    function displace(body, offsetX, offsetZ) {
      if (visiting.has(body)) return false;
      const nextX = body.x + offsetX, nextZ = body.z + offsetZ;
      if (nextX - body.radius < BOUNDS.minX || nextX + body.radius > BOUNDS.maxX || nextZ - body.radius < BOUNDS.minZ || nextZ + body.radius > BOUNDS.maxZ) return false;
      if (!journal.has(body)) journal.set(body, { x: body.x, z: body.z });
      body.x = nextX; body.z = nextZ; visiting.add(body);
      for (const other of objects) {
        if (other.id === body.id || !overlaps(body, other)) continue;
        if (other.fixed || other.id < 0 || other.halfWidth !== undefined) return false;
        const contactX = other.x - body.x, contactZ = other.z - body.z;
        const distance = Math.hypot(contactX, contactZ);
        const fallbackLength = Math.hypot(offsetX, offsetZ) || 1;
        const normalX = distance > 1e-9 ? contactX / distance : offsetX / fallbackLength;
        const normalZ = distance > 1e-9 ? contactZ / distance : offsetZ / fallbackLength;
        const separation = body.radius + other.radius + GAP - distance + 1e-6;
        contacts.push([body, other, normalX, normalZ]);
        if (!displace(other, normalX * separation, normalZ * separation)) return false;
      }
      visiting.delete(body);
      return true;
    }
    if (!displace(object, stepX, stepZ)) {
      for (const [body, position] of journal) { body.x = position.x; body.z = position.z; }
      return false;
    }
    for (const body of journal.keys()) changed.add(body);
    if (onContact) for (const contact of contacts) onContact(...contact);
    return true;
  };
  for (let i = 0; i < steps; i++) {
    if (attempt(dx, dz)) continue;
    // Slide tangentially when the full motion is pinned against a wall/chain.
    attempt(dx, 0); attempt(0, dz);
  }
  return changed;
}

export const PHYSICS_STEP = 1 / 120;
const MAX_SPEED = 4;
function dynamics(body) {
  body.vx ??= 0; body.vz ??= 0; body.spin ??= 0; body.angle ??= 0;
  body.mass ??= Math.max(.4, body.radius * body.radius * 4);
}
function limitSpeed(body) {
  const speed = Math.hypot(body.vx, body.vz);
  if (speed > MAX_SPEED) { body.vx *= MAX_SPEED / speed; body.vz *= MAX_SPEED / speed; }
  body.spin = Math.max(-2.4, Math.min(2.4, body.spin));
}
export function stopMotion(objects) {
  for (const body of objects) { body.vx = body.vz = body.spin = 0; }
}
export function hasMotion(objects) {
  return objects.some(body => Math.hypot(body.vx || 0, body.vz || 0) > .025 || Math.abs(body.spin || 0) > .025);
}

/* The existing swept contact solver owns safe positions. Impulses add motion
   only after a successful sweep, so a wall-pinned chain cannot gain ghost energy.
   A fixed timestep makes pointer springs, friction and spin independent of FPS. */
export function stepPhysics(objects, obstacles, dt = PHYSICS_STEP, drag = null) {
  dt = Math.min(PHYSICS_STEP, Math.max(0, dt));
  const changed = new Set(), bodies = [...objects, ...obstacles];
  for (const body of objects) { dynamics(body); limitSpeed(body); }
  const held = drag?.body;
  if (held) {
    held.vx += ((drag.x - held.x) * 350 - held.vx * 36) * dt;
    held.vz += ((drag.z - held.z) * 350 - held.vz * 36) * dt;
    held.spin = 0; limitSpeed(held);
  }
  const contact = (a, b, nx, nz) => {
    const invA = (a === held ? .18 : 1) / a.mass, invB = (b === held ? .18 : 1) / b.mass;
    const closing = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
    if (closing <= .015) return;
    const impulse = 1.18 * closing / (invA + invB);
    a.vx -= impulse * nx * invA; a.vz -= impulse * nz * invA;
    b.vx += impulse * nx * invB; b.vz += impulse * nz * invB;
    const tx = -nz, tz = nx;
    const invIA = a === held ? 0 : 2 / (a.mass * a.radius ** 2);
    const invIB = b === held ? 0 : 2 / (b.mass * b.radius ** 2);
    const tangent = (a.vx - b.vx) * tx + (a.vz - b.vz) * tz - a.spin * a.radius - b.spin * b.radius;
    const friction = Math.max(-impulse * .2, Math.min(impulse * .2, tangent / (invA + invB + a.radius ** 2 * invIA + b.radius ** 2 * invIB)));
    a.vx -= friction * tx * invA; a.vz -= friction * tz * invA;
    b.vx += friction * tx * invB; b.vz += friction * tz * invB;
    a.spin += friction * a.radius * invIA; b.spin += friction * b.radius * invIB;
    limitSpeed(a); limitSpeed(b);
  };
  // Integrate the held prop first, so the same step transmits its contact impulse.
  const order = held ? [held, ...objects.filter(body => body !== held)] : objects;
  for (const body of order) {
    if (body !== held) {
      if (body.targetAngle != null) body.spin = 0;
      const friction = Math.exp(-(2.8 + Math.min(1.5, body.mass * .3)) * dt);
      body.vx *= friction; body.vz *= friction; body.spin *= Math.exp(-4.5 * dt);
      if (Math.hypot(body.vx, body.vz) < .025) body.vx = body.vz = 0;
      if (Math.abs(body.spin) < .025) body.spin = 0;
    }
    const beforeX = body.x, beforeZ = body.z;
    const dx = body.vx * dt, dz = body.vz * dt;
    if (dx || dz) {
      const displaced = push(body, { x: body.x + dx, z: body.z + dz }, bodies, contact);
      for (const other of displaced) changed.add(other);
      // Small rebounds dissipate energy; the hand-held prop rests against walls.
      if (Math.abs(body.x - beforeX - dx) > .0002) body.vx *= body === held ? 0 : -.22;
      if (Math.abs(body.z - beforeZ - dz) > .0002) body.vz *= body === held ? 0 : -.22;
    }
    if (body !== held && body.spin) { body.angle += body.spin * dt; changed.add(body); }
  }
  return changed;
}
