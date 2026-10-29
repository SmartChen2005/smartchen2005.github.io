import fs from 'node:fs';
import path from 'node:path';
import { normalizeSiteArrows } from './site-icons.mjs';

const pages = fs.readdirSync('dist', { recursive: true })
  .filter(file => file.endsWith('.html') && !file.split(path.sep).some(part => ['editions', 'vendor'].includes(part)))
  .map(file => path.join('dist', file));
let count = 0;
for (const file of [...pages, 'tools/figures-lab/cursor-lab.html']) {
  const before = fs.readFileSync(file, 'utf8');
  const after = normalizeSiteArrows(before);
  if (after !== before) { fs.writeFileSync(file, after); count++; }
}
console.log(`Synchronized SVG north-east arrows on ${count} maintained pages/templates.`);
