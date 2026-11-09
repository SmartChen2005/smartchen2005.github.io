// Shared square-ink renderer math. Scene time never changes a cell's threshold.
export function hash(x, y, seed = 29) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function smooth(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export const sampleLuminance = (r, g, b) => (r * .2126 + g * .7152 + b * .0722) / 255;

export function revealAt(u, v, seed = 29) {
  const radius = Math.hypot((u - .46) * .85, (v - .53) * 1.12);
  const branch = .08 * Math.sin(u * 24 + Math.sin(v * 19) * 2);
  const grain = hash(Math.floor(u * 55), Math.floor(v * 55), seed);
  return Math.max(.01, Math.min(1, radius * 1.02 + branch + grain * .17));
}

export function pointVisible(luminance, x, y, { density = 1, seed = 29 } = {}) {
  if (luminance <= .008 || density <= 0) return false;
  const coverage = Math.min(.985, Math.pow(Math.min(1, luminance), .87) * density);
  return hash(x, y, seed) < coverage;
}

export function buildGrid(width, height, { pitch = 3.6, maxCells = 110000 } = {}) {
  const step = Math.max(pitch, Math.sqrt(width * height / maxCells));
  const columns = Math.max(1, Math.floor(width / step));
  const rows = Math.max(1, Math.floor(height / step));
  const left = (width - columns * step) / 2;
  const top = (height - rows * step) / 2;
  const points = [];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const x = left + (column + .5) * step, y = top + (row + .5) * step;
    const u = x / width, v = y / height;
    points.push({ x, y, u, v, column, row, threshold: hash(column, row), birth: revealAt(u, v) });
  }
  return { pitch: step, columns, rows, points };
}

export function paintHalftone(context, pixels, sourceSize, grid, time, meta, {
  density = 1, dotSize = 1.6, dpr = 1, placeDot,
} = {}) {
  const size = Math.max(1, Math.round(dotSize * dpr)) / dpr;
  const reveal = smooth(0, 1.45, time);
  const position = new Float32Array(2);
  let count = 0;
  context.fillStyle = '#fff';
  for (const point of grid.points) {
    if (point.birth > reveal) continue;
    const sx = Math.min(sourceSize - 1, Math.floor(point.u * sourceSize));
    const sy = Math.min(sourceSize - 1, Math.floor(point.v * sourceSize));
    const i = (sy * sourceSize + sx) * 4;
    const luminance = sampleLuminance(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (luminance <= .008 || point.threshold >= Math.min(.985, Math.pow(luminance, .87) * density)) continue;
    let x = point.x, y = point.y;
    if (placeDot) {
      placeDot(point, time, grid, position);
      x = position[0]; y = position[1];
    }
    context.fillRect(Math.round((x - size / 2) * dpr) / dpr, Math.round((y - size / 2) * dpr) / dpr, size, size);
    count++;
  }
  return count;
}
