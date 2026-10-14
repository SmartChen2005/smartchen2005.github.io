import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mobiusPoint,renderMobiusMark} from './gallery-mobius.mjs';
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
for(let i=0;i<48;i++){
 const t=i/48*Math.PI*2;
 const width=(i/47-.5)*.76;
 assert(distance(mobiusPoint(2*Math.PI,width),mobiusPoint(0,-width))<1e-8,'The half-twist joins the opposite edge');
 assert(distance(mobiusPoint(t,.38),mobiusPoint(t,-.38))>.75,'The strip retains its width through the twist');
 assert(mobiusPoint(t,width).every(Number.isFinite));
}
assert(distance(mobiusPoint(0,.38),mobiusPoint(4*Math.PI,.38))<1e-8,'One continuous boundary completes two revolutions');
const svg=renderMobiusMark();assert.match(svg,/fill="none"/);assert.match(svg,/<path d="M/);
assert(!/<(?:polygon|image|rect|canvas)|NaN|Infinity|fill="(?!none")|<animate/.test(svg),'The static mark contains only unfilled contour paths');
assert.equal(svg,fs.readFileSync(new URL('../dist/gallery/assets/mobius-outline.svg',import.meta.url),'utf8'),'Generated contour asset is current');
assert(!fs.readFileSync(new URL('../dist/gallery/gallery.mjs',import.meta.url),'utf8').includes('mobius-scene'),'No WebGL scene is loaded by Gallery pages');
console.log('Gallery Möbius: continuous half-twist, unfilled static contours, generated asset and no live 3D runtime verified.');
