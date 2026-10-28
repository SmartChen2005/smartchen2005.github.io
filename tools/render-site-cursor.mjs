import fs from 'node:fs';
import path from 'node:path';
import { siteCursorAssets, hasDedicatedPointer } from './site-cursor.mjs';

function pages(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === 'editions' || entry.name === 'vendor') return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? pages(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
let updated = 0;
for (const file of pages('dist')) {
  const original = fs.readFileSync(file, 'utf8');
  if (hasDedicatedPointer(file, original) || original.includes('src="home-cursor.mjs')) continue;
  const base = path.basename(file) === '404.html' ? '/' : '../'.repeat(path.relative('dist', path.dirname(file)).split(path.sep).filter(Boolean).length);
  if (original.includes(siteCursorAssets(base))) continue;
  const html = original.replace(/\s*<link rel="stylesheet" href="[^"]*site-cursor\.css[^"]*">/g, '')
    .replace(/\s*<script type="module" src="[^"]*site-cursor\.mjs[^"]*"><\/script>/g, '')
    .replace('</head>', `${siteCursorAssets(base)}</head>`);
  if (html !== original) { fs.writeFileSync(file, html); updated++; }
}
console.log(`Synchronized shared pointer includes on ${updated} live pages.`);
