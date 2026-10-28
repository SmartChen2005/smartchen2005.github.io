import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { studies, experimentURL, studyEdition } from './figures-of-speech.mjs';

const root = path.resolve(import.meta.dirname, '..');
const archive = path.join(root, 'dist/projects/figures-of-speech');
const html = fs.readFileSync(path.join(archive,'index.html'),'utf8');
const shallow = execFileSync('git',['rev-parse','--is-shallow-repository'],{cwd:root,encoding:'utf8'}).trim() === 'true';
assert.equal(studies.length, new Set(studies.map(study=>study.id)).size, 'Archive IDs must remain unique');
assert.equal(fs.readFileSync(path.join(root,'tools/figures-of-speech.mjs'),'utf8'),fs.readFileSync(path.join(archive,'catalogue.mjs'),'utf8'),'Browser data must match the editorial source');
assert.equal(studies.length,8,'The existing studies and the adaptive cursor must be present');
assert(!studies.some(study=>study.id==='003'),'The merged entrance must not remain a separate card');
assert(!/<iframe\b/.test(html),'The index must not boot hidden rendering contexts');
assert(!/Try interaction|Open full page|id="start-preview"|id="reset-preview"/.test(html),'No extra interaction gate or live-page control may remain');
assert(html.includes('Open in New Page'),'The independent experiment must have a new-page link');
const manifests=fs.readdirSync(path.join(archive,'editions'),{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>JSON.parse(fs.readFileSync(path.join(archive,'editions',entry.name,'manifest.json'),'utf8')));
assert.equal(manifests.find(item=>item.edition==='2026-10-27').sourceCommit,'e6bb1c9aa2798b7ddacddb74840fc948d857c61a');
assert.equal(manifests.find(item=>item.edition==='2026-10-27-sx70').sourceCommit,'1de028bb51c96eebaf8e44bf7cb12f8f1e8d394e');
assert.equal(manifests.find(item=>item.edition==='2026-10-27-gallery').sourceCommit,'2d4eba468c170080f4c85943b3e862853c95f9ff');
assert.equal(manifests.find(item=>item.edition==='2026-10-27-gallery-small').sourceCommit,'b63438bbc2230cf68135f58109e9a2ce840b1ace');
assert.equal(manifests.find(item=>item.edition==='2026-10-28-cursor').sourceCommit,'bb2bac9272ba2244a3e74a1edbd6c0907f2de184');
function editionFiles(directory,prefix=''){
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?editionFiles(path.join(directory,entry.name),`${prefix}${entry.name}/`):[`${prefix}${entry.name}`]);
}
for(const manifest of manifests){
const edition=path.join(archive,'editions',manifest.edition);
assert.deepEqual(editionFiles(edition).sort(),[...manifest.files.map(file=>file.path),'manifest.json'].sort(),'The preserved edition must contain only declared payloads');
for(const file of manifest.files){
  const actual=fs.readFileSync(path.join(edition,file.path));
  assert.equal(crypto.createHash('sha256').update(actual).digest('hex'),file.sha256,`Preserved payload changed: ${file.path}`);
  if(!/\.(mjs|js|css|html)$/.test(file.path))continue;
  const text=actual.toString('utf8').replace(/\/\*[\s\S]*?\*\//g,'');
  // Match actual dependency syntax, not parser string literals inside vendor JS.
  const references=[];
  if(/\.(?:mjs|js)$/.test(file.path)){
    references.push(...[...text.matchAll(/(?:^|[;\n])\s*(?:import|export)\s+(?:[^'";\n]*?\s+from\s*)?['"]([^'"]+)['"]/g)].map(match=>match[1]));
    references.push(...[...text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g)].map(match=>match[1]));
  }
  if(/\.html$/.test(file.path))references.push(...[...text.matchAll(/\b(?:src|href)\s*=\s*['"]([^'"]+)['"]/g)].map(match=>match[1]));
  references.push(...[...text.matchAll(/new URL\(['"]([^'"]+)['"],\s*import.meta.url\)/g)].map(match=>match[1]));
  if(/\.(?:css|html)$/.test(file.path))references.push(...[...text.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(match=>match[1]));
  for(const ref of references){
    if(/^(?:https?:|mailto:|data:|#)/.test(ref))continue;
    const resolved=new URL(ref,`https://edition.local/${file.path}`).pathname.slice(1);
    assert(!ref.startsWith('/'),`Live root dependency in preserved ${file.path}: ${ref}`);
    assert(manifest.files.some(item=>item.path===resolved||item.path===`${resolved}index.html`),`Missing frozen dependency ${file.path} -> ${ref}`);
  }
}
}
for(const study of studies){
  assert(html.includes(`data-study="${study.id}"`),`Missing index entry ${study.id}`);
  assert(html.includes(`data-panel="${study.id}"`),`Missing study notes ${study.id}`);
  const asset = fs.readFileSync(path.join(archive,'assets',study.image));
  assert(asset.length>2000,`Missing or empty real thumbnail ${study.image}`);
  assert.equal(asset.subarray(0,3).toString('hex'),'ffd8ff',`Expected a real JPEG capture for ${study.id}`);
  const target = new URL(experimentURL(study),'https://example.org/projects/figures-of-speech/');
  assert(fs.existsSync(path.join(root,'dist',target.pathname,target.pathname.endsWith('/')?'index.html':'')),`Broken experience route ${target.pathname}`);
  assert(target.pathname.startsWith(`/projects/figures-of-speech/editions/${studyEdition(study)}/`),'Every experience must use a fixed independent edition');
  const component=fs.readFileSync(path.join(root,'dist',target.pathname,'index.html'),'utf8');
  assert(!/class="(?:homepage|composition|sentence|portrait)|<iframe|home\.mjs|Back to home/i.test(component),`Homepage context leaked into ${study.id}`);
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
const directory=[...fs.readFileSync(path.join(root,'dist/projects/index.html'),'utf8').matchAll(/class="directory-link" href="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(directory.slice(0,2),['polaroid-of-yesterday/','figures-of-speech/'],'Place the archive immediately after Polaroid');
console.log(`Passed: ${studies.length} isolated studies; ${manifests.reduce((sum,item)=>sum+item.files.length,0)} immutable payload hashes across ${manifests.length} editions and dependency closure; no homepage context or extra start gate; source/render parity; ${studies.reduce((n,study)=>n+study.history.length,0)} dated records${shallow ? ' (Git history check skipped in shallow checkout)' : ' verified against Git'}; Projects order.`);
