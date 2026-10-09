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
