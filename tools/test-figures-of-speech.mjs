import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { studies, contextURL } from './figures-of-speech.mjs';

const root = path.resolve(import.meta.dirname, '..');
const archive = path.join(root, 'dist/projects/figures-of-speech');
const html = fs.readFileSync(path.join(archive,'index.html'),'utf8');
const shallow = execFileSync('git',['rev-parse','--is-shallow-repository'],{cwd:root,encoding:'utf8'}).trim() === 'true';
assert.equal(studies.length, new Set(studies.map(study=>study.id)).size, 'Archive IDs must remain unique');
assert.equal(fs.readFileSync(path.join(root,'tools/figures-of-speech.mjs'),'utf8'),fs.readFileSync(path.join(archive,'catalogue.mjs'),'utf8'),'Browser data must match the editorial source');
assert(!/<iframe\b/.test(html),'The index must not boot seven rendering contexts');
for(const study of studies){
  assert(html.includes(`data-study="${study.id}"`),`Missing index entry ${study.id}`);
  assert(html.includes(`data-panel="${study.id}"`),`Missing study notes ${study.id}`);
  const asset = fs.readFileSync(path.join(archive,'assets',study.image));
  assert(asset.length>2000,`Missing or empty real thumbnail ${study.image}`);
  assert.equal(asset.subarray(0,3).toString('hex'),'ffd8ff',`Expected a real JPEG capture for ${study.id}`);
  const target = new URL(contextURL(study),'https://example.org/projects/figures-of-speech/');
  assert(fs.existsSync(path.join(root,'dist',target.pathname,target.pathname.endsWith('/')?'index.html':'')),`Broken experience route ${target.pathname}`);
  for(const [date,sha] of study.history){
    assert(/^\d{4}-\d{2}-\d{2}$/.test(date),`Invalid record date for ${study.id}`);
    if (!shallow) {
      const actualDate=execFileSync('git',['show','-s','--format=%ad','--date=short',sha],{cwd:root,encoding:'utf8'}).trim();
      assert.equal(date,actualDate,`Date for ${study.id}/${sha} must follow the actual source record`);
    }
    assert(date<=study.revised,`A recorded revision cannot postdate the displayed revision date for ${study.id}`);
  }
}
assert(fs.readFileSync(path.join(root,'dist/projects/index.html'),'utf8').includes('href="figures-of-speech/"'),'Projects must expose the archive');
console.log(`Passed: ${studies.length} real-thumbnail studies; native experience destinations; source/render parity; ${studies.reduce((n,study)=>n+study.history.length,0)} dated records${shallow ? ' (full Git date verification skipped in shallow checkout)' : ' verified against Git'}; no rendering contexts on the index.`);
