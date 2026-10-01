import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {MusicEngine, MODES} from '../dist/projects/world-sensing-music-station/music-engine.mjs';

const root=new URL('../dist/projects/world-sensing-music-station/',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('assets/sources.json',root),'utf8'));
for(const [folder,entries] of [['files',manifest.files],['assets',manifest.photos]]) {
  for(const entry of entries) {
    const digest=createHash('sha256').update(fs.readFileSync(new URL(folder+'/'+encodeURIComponent(entry.file),root))).digest('hex');
    assert.equal(digest,entry.sha256,`Preserve original source ${entry.file}`);
  }
}
for(const [,reference] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if(/^(https?:|#|data:)/.test(reference))continue;
  assert(fs.existsSync(new URL(reference,root)),`Missing asset: ${reference}`);
}
for(const selected of [0,1,2])for(const mode of Object.keys(MODES)) {
  const engine=new MusicEngine();engine.setMode(mode);engine.selected=selected;
  const before=structuredClone(engine.loops);
  engine.replace();assert.equal(engine.setMode('techno'),false,'Preserve a replacement in progress');
  for(let i=0;i<8;i++) {
    engine.sense(15+i*20,.1,true);const tick=engine.tick();
    for(let layer=0;layer<3;layer++)if(layer!==selected)assert.deepEqual(engine.loops[layer],before[layer]);
    assert.equal(tick.completed,i===7?selected:null);
  }
  assert.equal(engine.recording,null,'Return to PLAY after exactly eight steps');
  assert(engine.replace(),'Allow the next replacement');
}
for(const value of [-100,15,72,160,999]) {
  const engine=new MusicEngine();engine.sense(value,.1,true);
  assert(engine.distance>=15&&engine.distance<=160);assert(engine.zone>=0&&engine.zone<=7);
}
const a=new MusicEngine(),b=new MusicEngine();
for(let i=0;i<60;i++)a.sense(140,1/60);
for(let i=0;i<120;i++)b.sense(140,1/120);
assert(Math.abs(a.distance-b.distance)<.00001,'Smoothing is independent of frame rate');
for(const filename of ['World Sensing Music Station Design Document.docx','Final Project.pdf','Final Project.docx']) {
  const buffer=fs.readFileSync(new URL('files/'+encodeURIComponent(filename),root));
  assert(buffer.length>1000);
  if(filename.endsWith('.pdf'))assert.equal(buffer.subarray(0,4).toString(),'%PDF');
  else assert.equal(buffer.subarray(0,2).toString(),'PK');
}
assert.equal((html.match(/class="loop-led"/g)||[]).length,32);
assert.equal((html.match(/class="matrix-pixel"/g)||[]).length,64);
assert.equal((html.match(/class="process-sheet"/g)||[]).length,7);
assert(!html.includes('autoplay=1'),'Video must load only after a click');
console.log('Passed: routes and assets; three modes × three recording targets; exactly eight recording steps; preservation of both unselected loops; sensor clamping; frame-independent smoothing; original document signatures; source model and sketchbook completeness.');
