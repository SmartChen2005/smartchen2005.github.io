import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { hasDedicatedPointer, siteCursorAssets } from './site-cursor.mjs';

const files = fs.readdirSync('dist', { recursive: true }).filter(file => file.endsWith('.html'));
let shared = 0, excluded = 0;
for (const relative of files) {
  const file = path.join('dist', relative), html = fs.readFileSync(file, 'utf8');
  const references = [...html.matchAll(/(?:src|href)="([^"]*(?:site|home)-cursor\.(?:css|mjs)[^"]*)"/g)].map(match => match[1]);
  if (hasDedicatedPointer(file, html)) {
    assert.equal(references.length, 0, `Dedicated/frozen pointer must be preserved: ${relative}`);
    excluded++;
  } else {
    assert.equal(references.length, 2, `One stylesheet and one module on ${relative}`);
    for (const ref of references) {
      const local = new URL(ref, `https://local.invalid/${relative.replaceAll('\\', '/')}`).pathname;
      assert(fs.existsSync(path.join('dist', decodeURIComponent(local))), `Missing pointer asset: ${relative} -> ${ref}`);
      if (relative === '404.html') assert(ref.startsWith('/'), '404 assets must resolve at any missing-path depth');
    }
    shared++;
  }
}
assert(hasDedicatedPointer('dist/future/index.html', '<html data-page-cursor="native">'));
assert.equal((siteCursorAssets('../').match(/site-cursor\./g) || []).length, 2);
assert(fs.readFileSync('dist/home-cursor.mjs', 'utf8').includes("import './site-cursor.mjs?rev=20261028-glow'"), 'Homepage must share the canonical controller');
assert(fs.readFileSync('dist/home-cursor.css', 'utf8').includes("@import url('site-cursor.css?rev=20261028-glow')"), 'Homepage must share canonical styles');
console.log(`Passed: shared pointer on ${shared} live pages; ${excluded} dedicated/frozen pages excluded; native opt-out and all dependencies resolve.`);
