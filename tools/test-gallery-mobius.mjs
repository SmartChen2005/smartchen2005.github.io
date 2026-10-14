import assert from 'node:assert/strict';
import {mobiusSolidPoint,mobiusNormal,createMobiusGeometry} from '../dist/gallery/mobius-geometry.mjs';
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
for(let i=0;i<48;i++){
 const t=i/48*Math.PI*2;
 assert(distance(mobiusSolidPoint(2*Math.PI,t),mobiusSolidPoint(0,t+Math.PI))<1e-8,'The half-twisted solid closes without a seam');
 assert(distance(mobiusNormal(2*Math.PI,t),mobiusNormal(0,t+Math.PI))<1e-6,'Smooth lighting closes across the twist');
 const n=mobiusNormal(t,t*.7);assert(Math.abs(Math.hypot(...n)-1)<1e-8);
 assert(Math.abs(distance(mobiusSolidPoint(t,Math.PI/2),mobiusSolidPoint(t,-Math.PI/2))-.28)<1e-8,'The solid has real thickness everywhere');
}
const mesh=createMobiusGeometry();
assert.equal(mesh.positions.length,129*25*3);assert.equal(mesh.normals.length,mesh.positions.length);
assert.equal(mesh.indices.length,128*24*6);
for(const index of mesh.indices)assert(index<mesh.positions.length/3);
assert([...mesh.positions,...mesh.normals].every(Number.isFinite));
console.log('Gallery Möbius: closed half-twist, constant thickness, smooth normals and valid indexed solid verified.');
