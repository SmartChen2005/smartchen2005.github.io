import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

// Reuse the approved Figures surface byte-for-byte on the live directory.
// The immutable study remains the visual source for both responsive assets.
const root = new URL('../dist/projects/', import.meta.url);
const edition = new URL('figures-of-speech/editions/2026-11-09-concave-sky/', root);
const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', edition), 'utf8'));
fs.mkdirSync(new URL('assets/', root), { recursive: true });
for (const [source, target] of [
  ['blue-starry-sky/surface.svg', 'assets/blue-concave-sky.svg'],
  ['blue-starry-sky/surface-mobile.svg', 'assets/blue-concave-sky-mobile.svg'],
]) {
  const bytes = fs.readFileSync(new URL(source, edition));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash, manifest.files.find(file => file.path === source)?.sha256, `Preserve the approved surface: ${source}`);
  fs.writeFileSync(new URL(target, root), bytes);
}
console.log('Rendered Projects sky: exact desktop/phone copies of the approved concave Figures surface.');
