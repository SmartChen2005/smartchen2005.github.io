import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { northEastArrow, normalizeSiteArrows } from './site-icons.mjs';

const sample = '<a href="/projects/" aria-label="Open project">Project ↗</a><p>&#8599; &#x2197; ↗️</p>';
const normalized = normalizeSiteArrows(sample);
assert.equal((normalized.match(/data-site-arrow="north-east"/g) || []).length, 4);
assert(normalized.includes('href="/projects/" aria-label="Open project"'));
assert(normalized.includes('aria-hidden="true" focusable="false"'));
assert.equal(normalizeSiteArrows(normalized), normalized);
assert.equal(normalizeSiteArrows('<script>const symbol="↗";</script><style>/* ↗ */</style>'), '<script>const symbol="↗";</script><style>/* ↗ */</style>');
let arrows = 0, pages = 0;
for (const relative of fs.readdirSync('dist', { recursive: true })) {
  if (!relative.endsWith('.html') || relative.split(path.sep).some(part => ['editions', 'vendor'].includes(part))) continue;
  const html = fs.readFileSync(path.join('dist', relative), 'utf8');
  assert.equal(normalizeSiteArrows(html), html, `Use the shared SVG arrow rather than an emoji-capable glyph: ${relative}`);
  arrows += (html.match(/data-site-arrow="north-east"/g) || []).length;
  pages++;
}
assert.equal((fs.readFileSync('dist/projects/index.html', 'utf8').match(/data-site-arrow="north-east"/g) || []).length, 6);
assert(northEastArrow.includes('stroke:currentColor'));
console.log(`Passed: ${pages} maintained pages, ${arrows} font-independent SVG arrows; all six Projects links; accessible/native links; idempotent generation.`);
