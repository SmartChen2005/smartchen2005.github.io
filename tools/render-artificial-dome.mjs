import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { studies } from './figures-of-speech.mjs';

const study = studies.find(item => item.id === '010');
const source = JSON.parse(fs.readFileSync('tools/figures-notion/artificial-dome.json', 'utf8'));
for (const key of ['title', 'description', 'perspective']) assert.equal(study[key], source[key], `Match Notion ${key}`);
const root = 'dist/projects/figures-of-speech/editions';
const original = `${root}/2026-11-09-concave-sky`;
const output = `${root}/${study.edition}`;
const manifest = JSON.parse(fs.readFileSync(`${original}/manifest.json`, 'utf8'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const payloads = manifest.files.map(file => {
  const bytes = fs.readFileSync(`${original}/${file.path}`);
  assert.equal(digest(bytes), file.sha256, `Preserve original ${file.path}`);
  // Only the HTML document title and hidden heading change; SVG artwork is exact.
  const content = file.path.endsWith('.html') ? bytes.toString('utf8')
    .replace('<title>蓝色星空 — 内凹弧面</title>', `<title>${study.title}</title>`)
    .replace('<h1>蓝色星空 — Inspired by 德国地铁站</h1>', `<h1>${study.title} — ${study.perspective}</h1>`) : bytes;
  return { path: file.path, content, sha256: digest(content) };
});
const committed = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', '--', output], { encoding: 'utf8' }).trim();
if (committed) {
  const preserved = JSON.parse(fs.readFileSync(`${output}/manifest.json`, 'utf8'));
  for (const file of payloads) {
    assert.equal(preserved.files.find(item => item.path === file.path)?.sha256, file.sha256, 'Create a new edition for further changes');
    assert.equal(digest(fs.readFileSync(`${output}/${file.path}`)), file.sha256, 'Preserved payload changed');
  }
} else {
  fs.mkdirSync(`${output}/blue-starry-sky`, { recursive: true });
  for (const file of payloads) fs.writeFileSync(`${output}/${file.path}`, file.content);
  fs.writeFileSync(`${output}/manifest.json`, JSON.stringify({
    edition: study.edition, sourceCommit: 'af3a80c140436b8e3e84730825836ba70938e750', preserved: '2026-11-09',
    description: 'Notion title update to Artificial Dome; original concave surface SVGs unchanged.',
    source: 'tools/figures-notion/artificial-dome.json',
    studies: [{ slug: study.experiment, kind: study.world, title: study.title }],
    files: payloads.map(({ path, sha256 }) => ({ path, sha256 })),
  }, null, 2) + '\n');
}
console.log('Verified Notion text and preserved Artificial Dome edition; original SVGs unchanged.');
