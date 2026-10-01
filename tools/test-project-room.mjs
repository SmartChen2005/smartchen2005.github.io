import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { PHOTO, TV, fitPhoto, screenMatrix } from '../dist/projects/polaroid-of-yesterday/room-geometry.mjs';

const root = new URL('../dist/projects/polaroid-of-yesterday/', import.meta.url);
const matrix = screenMatrix();
const sourceCorners = [[0, 0], [TV.width, 0], [TV.width, TV.height], [0, TV.height]];
for (const [index, [x, y]] of sourceCorners.entries()) {
  const w = matrix[3] * x + matrix[7] * y + matrix[15];
  const mapped = [(matrix[0] * x + matrix[4] * y + matrix[12]) / w + TV.corners[0][0],
    (matrix[1] * x + matrix[5] * y + matrix[13]) / w + TV.corners[0][1]];
  assert(Math.hypot(mapped[0] - TV.corners[index][0], mapped[1] - TV.corners[index][1]) < 1e-8,
    `TV corner ${index} must match the photographed screen exactly`);
}
for (const [width, height] of [[1920,1080],[1440,900],[1024,600],[2560,1080],[390,844],[320,568],[844,390],[1600,400]]) {
  const fit = fitPhoto(width, height);
  assert(fit.width <= width && fit.height <= height);
  assert(Math.abs(fit.width / fit.height - PHOTO.width / PHOTO.height) < 1e-8);
  assert(Math.abs(fit.width - width) < 1e-8 || Math.abs(fit.height - height) < 1e-8);
  for (const [x, y] of TV.corners) assert(x * fit.scale < fit.width && y * fit.scale < fit.height);
}
const photo = fs.readFileSync(new URL('assets/room.jpg', root));
assert.equal(createHash('sha256').update(photo).digest('hex'),
  '4db79b320876f48505b3122492c5078759c257dcd055af2d3c8f8e9295962d62', 'Preserve the original photograph byte-for-byte');
for (const route of ['index.html', 'photography/index.html']) {
  const file = new URL(route, root);
  const html = fs.readFileSync(file, 'utf8');
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|#|data:)/.test(ref)) continue;
    assert(fs.existsSync(new URL(ref, file)), `Missing local destination: ${route} → ${ref}`);
  }
}
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
assert.match(html, /class="camera-entrance"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
assert.match(html, /allow="[^"]*fullscreen"[^>]*allowfullscreen/);
const css = fs.readFileSync(new URL('room.css', root), 'utf8');
const anchor = css.match(/\.tv-anchor \{([^}]+)\}/)[1];
const left = Number(anchor.match(/left:\s*([\d.]+)%/)[1]);
const top = Number(anchor.match(/top:\s*([\d.]+)%/)[1]);
assert(Math.abs(left / 100 * PHOTO.width - TV.corners[0][0]) < 1e-6);
assert(Math.abs(top / 100 * PHOTO.height - TV.corners[0][1]) < 1e-6);
assert.match(css, /--letterbox:\s*#000000/);
assert(!/object-fit:\s*cover/.test(css), 'Never crop the room');
console.log('Passed: original photo checksum; eight aspect-preserving viewport fits; all four TV projection corners; local routes/assets; Photography new-tab semantics; iframe fullscreen permission.');
