// Pure, deterministic field construction. All motion is the activation order;
// the grid coordinates and white ink never move or fade.
const clamp = (v, low = 0, high = 1) => Math.max(low, Math.min(high, v));
const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function hash(x, y, seed) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function noise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(0, 1, x - ix), fy = smooth(0, 1, y - iy);
  const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

function fbm(x, y, seed) {
  return noise(x, y, seed) * .57 + noise(x * 2.03 + 17, y * 2.03, seed + 1) * .28
    + noise(x * 4.09, y * 4.09 + 9, seed + 2) * .15;
}

// A two-pass chamfer transform gives every cell its distance to the real glyphs,
// including counters. It is linear in grid size, rather than particles × glyphs.
export function distanceToInk(ink, columns, rows, pitch) {
  const distance = new Float32Array(columns * rows);
  const diagonal = Math.SQRT2;
  for (let i = 0; i < distance.length; i++) distance[i] = ink[i] ? 0 : columns + rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const i = y * columns + x;
      let d = distance[i];
      if (x) d = Math.min(d, distance[i - 1] + 1);
      if (y) {
        d = Math.min(d, distance[i - columns] + 1);
        if (x) d = Math.min(d, distance[i - columns - 1] + diagonal);
        if (x + 1 < columns) d = Math.min(d, distance[i - columns + 1] + diagonal);
      }
      distance[i] = d;
    }
  }
  for (let y = rows - 1; y >= 0; y--) {
    for (let x = columns - 1; x >= 0; x--) {
      const i = y * columns + x;
      let d = distance[i];
      if (x + 1 < columns) d = Math.min(d, distance[i + 1] + 1);
      if (y + 1 < rows) {
        d = Math.min(d, distance[i + columns] + 1);
        if (x) d = Math.min(d, distance[i + columns - 1] + diagonal);
        if (x + 1 < columns) d = Math.min(d, distance[i + columns + 1] + diagonal);
      }
      distance[i] = d;
    }
  }
  for (let i = 0; i < distance.length; i++) distance[i] *= pitch;
  return distance;
}

export function gridFor(width, height) {
  // Cap work on large displays without reducing device-pixel sharpness.
  const pitch = Math.max(4, Math.sqrt(width * height / 135000));
  return { pitch, columns: Math.ceil(width / pitch), rows: Math.ceil(height / pitch) };
}

export function createField({ width, height, distances, density = 1, size = 1.5, seed = 29 }) {
  const { pitch, columns, rows } = gridFor(width, height);
  const points = [];
  const portrait = width < height * .85;
  const scale = Math.min(width, height);
  const clearance = Math.max(5, scale * .011) + size / 2;
  const gaussian = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
  let first = Infinity, last = -Infinity;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = (column + .5) * pitch, y = (row + .5) * pitch;
      const distance = distances[row * columns + column];
      if (distance < clearance) continue;
      const u = x / width - .5, v = y / height - .5;
      const nx = u * (portrait ? 3.2 : 4.4), ny = v * (portrait ? 6 : 4.8);
      const warpX = (noise(nx + 6, ny, seed + 11) - .5) * .12;
      const warpY = (noise(nx, ny + 3, seed + 13) - .5) * .10;
      const ux = u + warpX, vy = v + warpY;
      const stretch = portrait ? .78 : 1;
      const clouds = gaussian(ux, vy, -.24, -.16 * stretch, .23, .15 * stretch) * .92
        + gaussian(ux, vy, .23, .15 * stretch, .24, .16 * stretch) * 1.05
        + gaussian(ux, vy, -.29, .13 * stretch, .19, .10 * stretch) * .62
        + gaussian(ux, vy, .24, -.17 * stretch, .19, .10 * stretch) * .53;
      const contour = Math.exp(-distance / (scale * .072));
      const grain = fbm(nx * 3.3 + 7, ny * 3.3, seed);
      const pockets = smooth(.18, .7, grain);
      const edge = smooth(.015, .12, .5 - Math.abs(u)) * smooth(.07, .21, .5 - Math.abs(v));
      const probability = clamp(((clouds * .91 + contour * .64) * (.16 + pockets * 1.23) - .022) * density) * edge;
      if (hash(column, row, seed + 91) >= probability) continue;

      // Unequal fronts travel away from several points around the word. Coherent
      // noise breaks each front into branches; per-cell jitter staggers neighbors.
      const travel = Math.min(
        Math.hypot((u + .2) * 1.1, v * 1.5),
        Math.hypot((u - .18) * 1.3, (v + .035) * 1.8) + .055,
        Math.hypot(u + .02, (v - .10) * 1.7) + .11
      );
      const birth = travel * 1.5 + noise(nx * 2 + 23, ny * 2, seed + 31) * .21
        + hash(column, row, seed + 71) * .09 + distance / scale * .16;
      first = Math.min(first, birth);
      last = Math.max(last, birth);
      points.push({ x, y, birth });
    }
  }
  const span = last - first || 1;
  for (const point of points) point.birth = .014 + Math.pow((point.birth - first) / span, 1.3) * .986;
  points.sort((a, b) => a.birth - b.birth);
  return { points, pitch, clearance };
}
