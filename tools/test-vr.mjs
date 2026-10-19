import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = 'dist/projects/vr-for-skill-learning';
const source = JSON.parse(fs.readFileSync('tools/vr-source/content.json', 'utf8'));
const html = fs.readFileSync(`${root}/index.html`, 'utf8');
const data = fs.readFileSync(`${root}/interaction-data.mjs`, 'utf8');
execFileSync(process.execPath, ['tools/render-vr.mjs']);
assert.equal(fs.readFileSync(`${root}/index.html`, 'utf8'), html, 'Published HTML must match the maintained source');
assert.equal(fs.readFileSync(`${root}/interaction-data.mjs`, 'utf8'), data, 'Interaction descriptions must match the maintained source');
const assets = JSON.parse(fs.readFileSync('tools/vr-source/sources.json', 'utf8'));
for (const asset of assets.documents) {
  const bytes = fs.readFileSync(path.join(root, 'files', asset.file));
  assert(bytes.subarray(0, 5).equals(Buffer.from('%PDF-')), 'Document links must resolve to real PDFs');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, 'Original PDF must be preserved byte-for-byte');
}
assert.equal((html.match(/<iframe /g) || []).length, source.assignments.length);
for (const a of source.assignments) {
  assert(html.includes(`id="${a.id}"`));
  assert(html.includes(`youtube-nocookie.com/embed/${a.video}?start=${a.start}`));
  assert(html.includes(`href="files/${a.pdf}"`));
}
for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (/^https?:/.test(ref)) continue;
  if (ref.startsWith('#')) {
    assert(html.includes(`id="${ref.slice(1)}"`), `Missing anchor ${ref}`);
  } else {
    assert(fs.existsSync(path.resolve(root, ref.split('?')[0])), `Missing local file ${ref}`);
  }
}
assert(!html.includes('hero-art'), 'Remove the purposeless hero decoration');
for (const a of source.assignments) {
  const section = html.split(`id="${a.id}"`)[1].split('</section>')[0];
  assert(section.indexOf('class="study ') < section.indexOf('class="description"'), 'The interaction precedes explanatory copy');
  assert(section.indexOf('class="study ') < section.indexOf('<iframe '), 'The interaction precedes the video');
}
assert(fs.readFileSync('dist/projects/index.html', 'utf8').includes('href="vr-for-skill-learning/"'));
for (const assignment of source.assignments) {
  for (const item of assignment.steps || assignment.journey) {
    assert(html.includes(`<p>${item.description}</p>`), 'Every explanation must remain in readable HTML without JavaScript');
  }
}
console.log('Passed: source/render parity, both original PDF checksums, video mappings/timestamps, local assets, section anchors, no-JS notes and Projects entrance.');
