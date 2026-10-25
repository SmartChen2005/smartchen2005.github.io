import assert from 'node:assert/strict';
import fs from 'node:fs';
import {T} from '../dist/home-motor-geometry.mjs';
import {createMotorScene,raceShot,raceCamera,racePosition,MOTOR_SHOTS,MOTOR_PALETTES,updateMotionPatterns} from '../dist/home-motor-race.mjs';
import {MOTOR_DURATION,motorsportFrame} from '../dist/home-motorsport.mjs';
import {drawGridTunnel,drawWarpStars,MOTION_LOOP} from '../dist/home-motor-motion.mjs';
const world=createMotorScene();
assert.equal(MOTOR_DURATION,16);assert.equal(MOTOR_SHOTS.length,8);assert(world.ready,'No font fetch delays native hover');
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert.equal(html.match(/<h1 class="sentence">([\s\S]*?)<\/h1>/)[1].replace(/<[^>]*>/g,''),'Smart Chen is a (game) designer, filmmaker, and car enthusiast.');
assert(!html.includes('motor-dialog'));assert(html.includes('motor-foreground" aria-hidden="true"'));
assert(!world.scene.getObjectByName('physical-homepage-sentence'),'The scene cannot turn the native heading into 3D text');
const css=fs.readFileSync(new URL('../dist/home.css',import.meta.url),'utf8');
for(const [key,value] of Object.entries(MOTOR_PALETTES[0]))assert(css.includes(`--motor-${key}: ${value}`));
for(const palette of MOTOR_PALETTES)assert.equal(new Set(Object.values(palette)).size,3,'Each setup has three output inks');
for(const [index,car] of world.cars.entries()){
  assert.equal(car.userData.paint,index===0?'black':'silver');assert.equal(car.userData.wheels.length,4);
  assert(car.getObjectByName('curved-body-with-wheel-arches').geometry.attributes.position.count>1500);
  for(const wheel of car.userData.wheels){
    const tire=wheel.getObjectByName('tire-barrel');tire.geometry.computeBoundingBox();
    assert(tire.geometry.boundingBox.max.x-tire.geometry.boundingBox.min.x>.25,'Tyres keep their real sidewall thickness');
    assert(wheel.children.some(m=>m.geometry?.parameters?.openEnded===true));
    assert(wheel.children.some(m=>m.isInstancedMesh&&m.count>=60));
  }
}
const lamps=world.cars[0].children.filter(c=>c.name==='recessed-f56-headlamp');assert.equal(lamps.length,2);
for(const lamp of lamps){assert(lamp.userData.lensRadius<.16);assert(lamp.position.y+lamp.userData.lensRadius*1.13<1.02,'Small lamps stay within the bonnet silhouette');}
assert(world.cars[0].getObjectByName('f56-roof'));assert(!world.cars[1].getObjectByName('f56-roof'));
assert(world.cars[1].getObjectByName('e85-seat-base'));assert(world.cars[1].getObjectByName('e85-steering-wheel'));
assert.equal(world.city.root.userData.buildingCount,60);assert(world.city.root.userData.architecture.includes('half timber'));
assert(world.city.root.userData.streetHalfWidth<world.circuit.root.userData.streetHalfWidth);
for(let i=0;i<MOTOR_SHOTS.length;i++){
  const s=MOTOR_SHOTS[i];assert.deepEqual(raceCamera(s.start+.01),raceCamera(s.end-.01),'Shot changes are cuts, not camera interpolation');
  if(i){assert.equal(MOTOR_SHOTS[i-1].end,s.start);assert.notEqual(raceShot(s.start-.001).id,raceShot(s.start).id);}
}
for(const [w,h] of [[1920,1080],[1440,900],[1024,600],[390,844],[320,568],[844,390]]){
  world.resize(w,h);
  for(const shot of MOTOR_SHOTS){
    const t=(shot.start+shot.end)/2;world.update(motorsportFrame(t));
    assert(world.camera.position.toArray().every(Number.isFinite));assert(world.camera.projectionMatrix.elements.every(Number.isFinite));
    const pattern=['grid','warp'].includes(shot.mode);
    assert.equal(world.city.root.visible,shot.mode==='lane');assert.equal(world.circuit.root.visible,shot.mode==='circuit');
    if(pattern)assert(world.cars.every(c=>!c.visible),'Pure hyperspace has no cars, roads or buildings');
    if(shot.mode==='lane')for(const car of world.cars.filter(c=>c.visible))assert(Math.abs(car.position.x)+1.15<world.city.root.userData.streetHalfWidth);
    assert.equal(world.portals.visible,shot.mode==='grid');assert.equal(world.stars.visible,shot.mode==='warp');
  }
}
world.update(motorsportFrame(1));assert.equal(world.cars.filter(c=>c.visible).length,1,'A narrow street can be a solo shot');
world.update(motorsportFrame(3));assert(world.cars[1].position.z-world.cars[0].position.z>7,'Following cars have physical clearance');
world.update(motorsportFrame(5));assert(Math.abs(world.cars[0].position.x-world.cars[1].position.x)>3,'Circuit pairs can run alongside');
world.update(motorsportFrame(9.4));assert(world.cars[0].getObjectByName('curved-body-with-wheel-arches').layers.isEnabled(1));
assert(!world.cars[1].getObjectByName('curved-body-with-wheel-arches').layers.isEnabled(1),'Following Z4 stays behind the 2D sentence');
assert(!world.cars[0].getObjectByName('contact-shadow').layers.isEnabled(1));
const before=racePosition(8.3,0),after=racePosition(10.4,0);assert(before.x>after.x&&before.z<after.z);
world.update(motorsportFrame(12.55));assert(world.cars[1].userData.flames.every(f=>f.visible));
world.update(motorsportFrame(12.9));assert(world.cars[1].userData.flames.every(f=>!f.visible),'Backfire is brief');
updateMotionPatterns(world.portals,world.stars,.37);
const z=world.portals.children.map(p=>p.position.z),stars=world.stars.geometry.attributes.position.array.slice();
updateMotionPatterns(world.portals,world.stars,12.37);
world.portals.children.forEach((p,i)=>assert(Math.abs(p.position.z-z[i])<1e-8));
world.stars.geometry.attributes.position.array.forEach((v,i)=>assert(Math.abs(v-stars[i])<1e-5));
assert.deepEqual(motorsportFrame(100),motorsportFrame(16));
let count=0;world.scene.traverse(node=>{if(node.geometry?.attributes?.position){count++;for(const v of node.geometry.attributes.position.array)assert(Number.isFinite(v));}});assert(count>250);
const record=()=>{const out=[];return {out,ctx:new Proxy({}, {get:(_,key)=>(...args)=>out.push([key,...args]),set:(_,key,value)=>{out.push([key,value]);return true;}})};};
const P={fg:'#367f96',fg2:'#e3f0ec',paper:'#e3f0ec'};
for(const effect of [drawGridTunnel,drawWarpStars]){const a=record(),b=record();effect(a.ctx,960,540,0,P);effect(b.ctx,960,540,MOTION_LOOP,P);assert.deepEqual(a.out,b.out);}
console.log('Passed: native 2D sentence; three inks per shot; restrained F56 lamps and volumetric wheels; traditional narrow town and circuit; eight hard cuts; solo/following/parallel formations; transparent foreground MINI; brief backfire; pure Grid Tunnel / Warp Stars; six viewport shapes and deterministic 12s seams.');
