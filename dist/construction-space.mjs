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
   without leaving penetrations. There is no residual velocity to jitter at rest. */
export function push(object, target, objects) {
  const x = Math.max(BOUNDS.minX + object.radius, Math.min(BOUNDS.maxX - object.radius, target.x));
  const z = Math.max(BOUNDS.minZ + object.radius, Math.min(BOUNDS.maxZ - object.radius, target.z));
  const steps = Math.max(1, Math.ceil(Math.hypot(x - object.x, z - object.z) / .025));
  const dx = (x - object.x) / steps, dz = (z - object.z) / steps;
  const changed = new Set();
  const attempt = (stepX, stepZ) => {
    if (Math.abs(stepX) + Math.abs(stepZ) < 1e-10) return false;
    const journal = new Map(), visiting = new Set();
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
    return true;
  };
  for (let i = 0; i < steps; i++) {
    if (attempt(dx, dz)) continue;
    // Slide tangentially when the full motion is pinned against a wall/chain.
    attempt(dx, 0); attempt(0, dz);
  }
  return changed;
}
