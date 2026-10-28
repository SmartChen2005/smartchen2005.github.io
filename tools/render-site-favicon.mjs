import fs from 'node:fs';
import path from 'node:path';
import { siteFavicon } from './site-favicon.mjs';

// Classic ICO with 16px and 32px opaque white BMPs, including zeroed transparency masks.
const sizes = [16, 32];
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
const images = sizes.map((size, index) => {
  const pixels = size * size * 4;
  const mask = Math.ceil(size / 32) * 4 * size;
  const bitmap = Buffer.alloc(40 + pixels + mask);
  bitmap.writeUInt32LE(40, 0);
  bitmap.writeInt32LE(size, 4);
  bitmap.writeInt32LE(size * 2, 8);
  bitmap.writeUInt16LE(1, 12);
  bitmap.writeUInt16LE(32, 14);
  bitmap.writeUInt32LE(pixels + mask, 20);
  bitmap.fill(255, 40, 40 + pixels);
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(bitmap.length, entry + 8);
  return bitmap;
});
let offset = header.length;
images.forEach((bitmap, index) => {
  header.writeUInt32LE(offset, 6 + index * 16 + 12);
  offset += bitmap.length;
});
fs.writeFileSync('dist/favicon.ico', Buffer.concat([header, ...images]));

const pages = fs.readdirSync('dist', { recursive: true })
  .filter(file => file.endsWith('.html') && !file.split(path.sep).some(part => ['editions', 'vendor'].includes(part)))
  .map(file => path.join('dist', file));
let updated = 0;
for (const file of [...pages, 'index.html']) {
  const original = fs.readFileSync(file, 'utf8');
  const depth = path.relative('dist', path.dirname(file)).split(path.sep).filter(Boolean).length;
  const base = file === 'index.html' ? 'dist/' : path.basename(file) === '404.html' ? '/' : '../'.repeat(depth);
  const icon = siteFavicon(base);
  const html = /<link\b[^>]*\brel="(?:shortcut )?icon"[^>]*>/i.test(original)
    ? original.replace(/<link\b[^>]*\brel="(?:shortcut )?icon"[^>]*>/gi, icon)
    : original.replace(/(^[ \t]*)?<title>/im, (_, indent) => `${indent || ''}${icon}\n${indent || '  '}<title>`);
  if (html !== original) { fs.writeFileSync(file, html); updated++; }
}
console.log(`Generated white-square favicon; synchronized ${updated} pages. Archived pages use /favicon.ico.`);
