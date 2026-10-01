import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {MusicEngine,MODES,distanceToZone,rhythmHit,noteIndex,noteColor} from '../dist/projects/world-sensing-music-station/music-engine.mjs';
import {displayText,matrixFrame} from '../dist/projects/world-sensing-music-station/display-engine.mjs';
const root=new URL('../dist/projects/world-sensing-music-station/',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('assets/sources.json',root),'utf8'));
for(const [folder,entries] of [['files',manifest.files],['assets',manifest.photos]])for(const entry of entries){
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL(folder+'/'+encodeURIComponent(entry.file),root))).digest('hex'),entry.sha256,`Original ${entry.file}`);
}
for(const [,reference] of html.matchAll(/(?:src|href)="([^"]+)"/g))if(!/^(https?:|#|data:)/.test(reference))assert(fs.existsSync(new URL(reference,root)),reference);
const initial=new MusicEngine();
assert.deepEqual(initial.loops,[Array(8).fill(0),Array(8).fill(-1),Array(8).fill(-1)]);
assert.equal(initial.selected,0);assert.equal(initial.distance,45);assert.equal(initial.period,750);
initial.sample(100);assert(Math.abs(initial.distance-57.1)<1e-9);assert(Math.abs(initial.speed-12.1)<1e-9);
const before=initial.distance;assert.equal(initial.sample(-1),false);assert.equal(initial.distance,before);
assert.deepEqual([9.99,10,34.99,35,179.99,180,180.01].map(distanceToZone),[-1,0,0,1,6,7,-1]);
for(const mode of Object.keys(MODES))for(const selected of [0,1,2]){
  const engine=new MusicEngine();engine.setMode(mode);engine.selected=selected;
  engine.loops=[[1,2,4,1,2,4,1,2],[0,1,2,3,4,5,6,7],[7,6,5,4,3,2,1,0]];
  const stored=structuredClone(engine.loops);engine.replace();
  assert.deepEqual(engine.loops[selected],Array(8).fill(selected===0?0:-1),'Clear selected layer on arm');
  for(let i=0;i<8;i++){
    engine.distance=45+i*15;engine.speed=2;
    const tick=engine.tick();assert.equal(tick.completed,i===7?selected:null);
    for(let layer=0;layer<3;layer++)if(layer!==selected)assert.deepEqual(engine.loops[layer],stored[layer]);
  }
  assert.equal(engine.recording,false);
  const recorded=structuredClone(engine.loops);engine.setMode('techno');assert.deepEqual(engine.loops,recorded,'Mode changes preserve notes');
}
assert.equal(rhythmHit(2,0,4,'techno'),3);assert.equal(rhythmHit(2,2,4,'techno'),7);
assert.equal(rhythmHit(4,0,0,'trap'),0);assert.equal(rhythmHit(2,1,0,'trap'),5);
assert.equal(rhythmHit(2,3,0,'ambient'),5);assert.equal(rhythmHit(-1,3,0,'ambient'),0);
assert.deepEqual(Array.from({length:8},(_,z)=>noteIndex(z,'techno',true)),[0,2,4,5,4,2,1,3]);
assert.equal(noteIndex(0,'ambient',true),1);assert.equal(noteIndex(7,'ambient',false),6);
assert.equal(noteIndex(7,'trap',false),4);assert.equal(noteIndex(7,'trap',true),7);
const ambient=new MusicEngine();ambient.selected=2;ambient.replace();ambient.tick();assert.equal(ambient.loops[2][0],-1,'Slow Ambient motion writes silence');
const changes=new MusicEngine();changes.replace();changes.setMode('trap');assert(changes.recording);changes.selected=1;changes.distance=100;changes.tick();assert(changes.loops[1][0]>=0);
changes.randomize(()=>.5);assert.equal(changes.remaining,7,'Randomize does not cancel recording');changes.clear();assert.equal(changes.remaining,0);assert.equal(changes.step,-1);
const a=new MusicEngine(),b=new MusicEngine();for(let i=0;i<60;i++)a.sense(140,1/60);for(let i=0;i<120;i++)b.sense(140,1/120);assert(Math.abs(a.distance-b.distance)<1e-9);
const techno=new MusicEngine();techno.setMode('techno');assert.equal(techno.period,468);assert.equal(techno.tick().notes[0],1,'Techno keeps its kick even with empty loops');
assert.deepEqual(techno.frequencies([7,0,7]),[110,131,523]);
const trap=new MusicEngine();trap.setMode('trap');trap.tick();assert.equal(trap.tick().swingDelay,51);
techno.selected=1;techno.loops[1][2]=4;techno.loops[2][2]=6;const colors=techno.ledColors(-1);
assert.equal(colors.length,30);assert.deepEqual(colors[1],[80,80,80]);assert.deepEqual(colors[9],noteColor(6));assert.deepEqual(colors.slice(27),[[0,0,0],[0,0,0],[0,0,0]]);
assert.deepEqual(techno.ledColors(2)[9],[120,120,120]);
assert.equal(displayText('AMBIENT 80bpm RHY PLAY'),'AMBIENT 80BPM RHY');
assert.equal(matrixFrame('A',0).filter(Boolean).length,28);assert(matrixFrame('A',9).every(value=>!value));
assert.equal((html.match(/class="loop-led"/g)||[]).length,30);
assert.equal((html.match(/class="matrix-pixel"/g)||[]).length,64);
assert.equal((html.match(/class="process-sheet"/g)||[]).length,4);
assert.equal((html.match(/data-scene=/g)||[]).length,2);
assert(!html.includes('autoplay=1'));
console.log('Passed: original files/photos/firmware hashes; 40ms sensing and source zone boundaries; exact note/rhythm/swing rules; empty startup; nine recording combinations; clear-on-arm and eight-step return; retained loops on mode changes; live controls during REC; 30-LED layout; original matrix glyphs; compact content and all local links.');
