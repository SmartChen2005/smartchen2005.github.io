import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { exhibitionLayout } from '../dist/home-exhibition.mjs';
import { motorsportFrame, MOTOR_DURATION, MOTOR_CUES, MOTOR_SHIFTS } from '../dist/home-motorsport.mjs';

// The wall must never crop, overlap or cross the sentence, even on short screens.
for (const [width, height, sentenceHeight] of [[1920,1080,90],[1440,900,68],[1024,600,50],[701,450,35],[390,844,180],[320,568,200],[844,390,40]]) {
  const band = { top: (height - sentenceHeight) / 2 - 24, bottom: (height + sentenceHeight) / 2 + 24 };
  const prints = exhibitionLayout(width,height,band);
  for (const print of prints) {
    assert(print.x >= 0 && print.y >= 0 && print.x + print.width <= width && print.y + print.height <= height);
    assert(Math.abs(print.width / print.height - 1.5) < .0001);
    assert(print.y + print.height <= band.top || print.y >= band.bottom);
  }
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const a = prints[i], b = prints[j];
    assert(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
  }
}
assert(MOTOR_DURATION >= 10 && MOTOR_DURATION <= 15);
assert.deepEqual([0,2,4.5,7,9.5,12.5,14].map(t => motorsportFrame(t).phase),
  ['ignition','rally','thermal','arboreal','orbit','return','idle']);
for (const shift of MOTOR_SHIFTS) assert(motorsportFrame(shift+.01).rpm < motorsportFrame(shift-.01).rpm, 'A manual gear change must unload RPM');
for (const seconds of [-1,NaN,Infinity,0,1.7,6.6,13.999,14,100]) {
  const frame = motorsportFrame(seconds);
  assert(Number.isFinite(frame.rpm) && frame.rpm >= 0 && frame.rpm <= 8500);
  assert(frame.progress >= 0 && frame.progress <= 1);
}
assert(MOTOR_CUES.every((cue,i) => cue.start === (MOTOR_CUES[i-1]?.end ?? 0)));
assert(motorsportFrame(100).idle, 'The main sequence must not loop');
const carAssets = JSON.parse(fs.readFileSync(new URL('./car-source/assets.json', import.meta.url)));
assert.equal(carAssets.assets.length, 6);
for (const asset of carAssets.assets) {
  const bytes = fs.readFileSync(new URL(`../dist/assets/cars/${asset.file}`, import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `${asset.file} must match the archived asset manifest`);
}

const callbacks = new Map(), mediaHandlers = [], pageHandlers = [], timers = new Map();
let id = 0, now = 0, drawings = 0;
const media = { matches: false, addEventListener: (_, fn) => mediaHandlers.push(fn) };
const document = { hidden: false, body: { dataset: {} }, documentElement: {}, addEventListener: (type, fn) => {
  if(type==='visibilitychange')pageHandlers.push(fn);
} };
const context = new Proxy({}, {
  get: (_, key) => (...args) => {
    for (const arg of args) if (typeof arg === 'number') assert(Number.isFinite(arg), `${String(key)} received non-finite geometry`);
    drawings++;
  }, set: () => true,
});
const classList = () => { const set = new Set(); return { add: (...names) => names.forEach(n=>set.add(n)), remove: (...names)=>names.forEach(n=>set.delete(n)), contains:n=>set.has(n) }; };
const motorCanvas = { getContext: () => context, dataset: {}, classList: classList() };
const prints = Array.from({length:4},()=>({style:{},classList:classList(),querySelector:()=>({complete:true,naturalWidth:6000,getAttribute:name=>name==='width'?'6000':'4000'})}));
const gallery = { querySelectorAll:()=>prints };
const sandbox = {
  document, console, Math, innerWidth:1440,innerHeight:900,devicePixelRatio:1.5,
  matchMedia:()=>media,
  getComputedStyle:()=>({getPropertyValue:key=>({'--paper':'#f5f5f3','--ink':'#292a27','--mechanical':'#080808'})[key]}),
  requestAnimationFrame:fn=>{callbacks.set(++id,fn);return id;}, cancelAnimationFrame:key=>callbacks.delete(key),
  setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:key=>timers.delete(key),performance:{now:()=>now},
};
vm.createContext(sandbox);
for (const file of ['home-motorsport.mjs','home-exhibition.mjs','home-scenes.mjs']) {
  const source=fs.readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
  vm.runInContext(source,sandbox);
}
const scene = sandbox.createScenes({getContext:()=>context},{motor:motorCanvas,exhibition:gallery});
scene.resize({top:390,bottom:510});
assert.equal(callbacks.size,0);
function step(count=1) {
  for(let i=0;i<count;i++) { now+=16; const pending=[...callbacks.values()];callbacks.clear();pending.forEach(fn=>fn(now));assert(callbacks.size<=1,'Duplicate animation loops'); }
}
scene.setWorld('games');step(240);scene.point(1,0);step(120);assert.equal(callbacks.size,1);
scene.setWorld('cars');step(130);assert.equal(motorCanvas.dataset.phase,'rally');
step(760);assert.equal(motorCanvas.dataset.phase,'idle');
assert.equal(callbacks.size,0,'The completed film must stop its animation loop');
scene.setWorld('');assert.equal(callbacks.size,0);assert.equal(document.body.dataset.carExit,'true');
for(const fn of timers.values())fn();timers.clear();assert.equal(document.body.dataset.carExit,undefined);
scene.setWorld('cars');assert.equal(motorCanvas.dataset.phase,'ignition','Re-entry restarts the sequence');
scene.setWorld('');
scene.setWorld('photo');
assert(!motorCanvas.classList.contains('is-exiting'), 'Switching identities cancels the car exit');
assert.equal(document.body.dataset.carExit, undefined);
scene.setWorld('photo');assert.equal(callbacks.size,0);assert(prints.every(p=>p.style.width));
scene.setWorld('cars');media.matches=true;mediaHandlers.forEach(fn=>fn());
assert.equal(callbacks.size,0);assert.equal(motorCanvas.dataset.phase,'idle');
const before=drawings;scene.setWorld('games');assert(drawings>before);assert.equal(callbacks.size,0);
media.matches=false;mediaHandlers.forEach(fn=>fn());assert.equal(callbacks.size,1);
document.hidden=true;pageHandlers.forEach(fn=>fn());assert.equal(callbacks.size,0);
document.hidden=false;pageHandlers.forEach(fn=>fn());assert.equal(callbacks.size,1);
const captured = scene.captureGame();
assert.equal(captured.balls.length,6);assert.equal(captured.tiles.length,36);
assert.equal(callbacks.size,0,'Click must take over the existing animation loop');
assert(captured.balls.every(ball=>ball.trail.length===14),'Click must inherit the existing trajectories');
pageHandlers.forEach(fn=>fn());mediaHandlers.forEach(fn=>fn());scene.setWorld('photo');
assert.equal(callbacks.size,0,'Focus and visibility events must not restart the captured hover simulation');
scene.releaseGame();scene.setWorld('games');assert.equal(callbacks.size,1);
scene.setWorld('');assert.equal(callbacks.size,0);
for (const [width,height,sentenceHeight] of [[1440,900,68],[1024,600,50],[701,450,35],[390,844,180],[320,568,200],[844,390,40]]) {
  sandbox.innerWidth=width;sandbox.innerHeight=height;
  scene.resize({top:(height-sentenceHeight)/2-24,bottom:(height+sentenceHeight)/2+24});
  scene.setWorld('cars');step(900);assert.equal(motorCanvas.dataset.phase,'idle');assert.equal(callbacks.size,0);
  scene.setWorld('');
}
scene.setWorld('cars');step(65);const pausedPhase=motorCanvas.dataset.phase;
document.hidden=true;pageHandlers.forEach(fn=>fn());assert.equal(callbacks.size,0);
now+=100000;document.hidden=false;pageHandlers.forEach(fn=>fn());step(1);
assert.equal(motorCanvas.dataset.phase,pausedPhase,'Returning to a hidden tab must not skip the story');
scene.setWorld('');
console.log('Passed: four uncropped non-overlapping prints; 14s car film phases, manual shifts, static end and restart; finite canvas geometry; single-loop lifecycle; reduced motion; background suspension.');
