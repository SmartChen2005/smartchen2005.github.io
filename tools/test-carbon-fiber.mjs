import assert from 'node:assert/strict';
import { CARBON_PERIOD, carbonSurface, carbonReflection, createCarbonFiber } from '../dist/home-carbon-fiber.mjs';

assert(CARBON_PERIOD / 4 >= 16, 'Bundles must be substantially larger than the old 6px weave');
const surface = carbonSurface(), untouched = surface.slice();
for(let i=0;i<surface.length;i+=5){
  assert(surface[i]>=2 && surface[i]<18,'Carbon substrate must remain deep black');
  assert(Math.abs(Math.hypot(surface[i+1],surface[i+2],surface[i+3])-1)<1e-6);
}
const left = carbonReflection(surface,{x:.12,y:.3});
const right = carbonReflection(surface,{x:.88,y:.7});
assert.notDeepEqual(left,right,'Different light directions must illuminate different curved fibers');
for(let i=0;i<right.length;i+=4){
  assert(right[i]===right[i+1] && right[i]===right[i+2],'Reflection must have no green tint');
  assert(right[i+3]<=45,'Fiber glints must remain restrained');
}
assert.deepEqual(surface,untouched,'Light must not move or alter the woven surface');

let writes=0, gradients=[];
const fakeContext=()=>({
  createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
  putImageData:()=>writes++,createPattern:()=>({}),
  save(){},restore(){},scale(){},fillRect(){},clearRect(){},setTransform(){},drawImage(){},
  createRadialGradient(...geometry){gradients.push(geometry);return {addColorStop(){}};},
});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>fakeContext()})};
const material=createCarbonFiber(fakeContext());
material.draw(1000,600,{x:.2,y:.3},1.5);
assert.equal(gradients[0][0],200);assert.equal(gradients[0][1],180);
const settledWrites=writes;
material.draw(1000,600,{x:.2,y:.3},1.5);
assert.equal(writes,settledWrites,'A steady light must reuse the sampled material');
material.draw(1000,600,{x:.8,y:.6},1.5);
assert.equal(gradients[2][0],800);assert.equal(gradients[2][1],360);
assert(writes>settledWrites);
const validWrites=writes;
for(const [w,h] of [[0,600],[1000,0],[-32,600],[NaN,600]])material.draw(w,h,{x:.8,y:.6});
assert.equal(writes,validWrites,'A transient empty viewport must not create an invalid coating image');
createCarbonFiber(null).draw(1000,600,{x:0,y:0});
console.log('Passed: enlarged black weave, curved unit normals, neutral restrained glints, fixed surface, pointer-positioned studio reflection and steady-light cache.');
