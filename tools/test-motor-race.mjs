import assert from 'node:assert/strict';
import fs from 'node:fs';
import {T} from '../dist/home-motor-geometry.mjs';
import {createMotorScene,raceShot,raceCamera,racePosition,MOTOR_SHOTS,MOTOR_PALETTES} from '../dist/home-motor-race.mjs';
import {MOTOR_DURATION,motorsportFrame} from '../dist/home-motorsport.mjs';
import {raceTravel,cameraTravel,driverMotion,boostMotion,raceExposure,MOTOR_SPEED,updateSpeedLines} from '../dist/home-motor-speed.mjs';
import {drawGridTunnel,drawWarpStars,MOTION_LOOP} from '../dist/home-motor-motion.mjs';
import {flightPose,flightCamera,isFlight} from '../dist/home-motor-flight.mjs';
const world=createMotorScene();
assert.equal(MOTOR_DURATION,21);assert.equal(MOTOR_SHOTS.length,9);assert(world.ready,'No font fetch delays native hover');
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert.equal(html.match(/<h1 class="sentence">([\s\S]*?)<\/h1>/)[1].replace(/<[^>]*>/g,''),'Smart Chen is a (game) designer, filmmaker, and car enthusiast.');
assert(!html.includes('motor-dialog'));assert(html.includes('motor-foreground" aria-hidden="true"'));
assert(!world.scene.getObjectByName('physical-homepage-sentence'),'The scene cannot turn the native heading into 3D text');
const css=fs.readFileSync(new URL('../dist/home.css',import.meta.url),'utf8');
for(const [key,value] of Object.entries(MOTOR_PALETTES[0]))assert(css.includes(`--motor-${key}: ${value}`));
for(const palette of MOTOR_PALETTES)assert.equal(new Set(Object.values(palette)).size,3,'Street output and native text have three base inks');
for(const [index,car] of world.cars.entries()){
  assert.equal(car.userData.paint,index===0?'black':'silver');assert.equal(car.userData.wheels.length,4);
  const bounds=new T.Box3().setFromObject(car);assert(bounds.max.y<(index===0?1.44:1.29),'Glass-frame splines cannot inflate the intended cabin silhouette');
  assert(car.getObjectByName('curved-body-with-wheel-arches').geometry.attributes.position.count>1500);
  for(const wheel of car.userData.wheels){
    const bounds=new T.Box3().setFromObject(wheel);assert(bounds.min.y>-.005&&bounds.max.y<.675,'Real tire geometry rests on the road at the smaller scale');
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
    const pattern=isFlight(shot.mode);
    assert.equal(world.city.root.visible,shot.mode==='lane');assert.equal(world.circuit.root.visible,shot.mode==='circuit');
    if(pattern){assert(world.cars.every(c=>c.visible),'Both hyperspace shots combine vehicles with their line motif');assert(!world.city.root.visible&&!world.circuit.root.visible);}
    if(shot.mode==='lane')for(const car of world.cars.filter(c=>c.visible))assert(Math.abs(car.position.x)+1.15<world.city.root.userData.streetHalfWidth);
    assert.equal(world.portals.visible,shot.mode==='grid');assert.equal(world.stars.visible,shot.mode==='warp');
  }
}
world.update(motorsportFrame(1));assert.equal(world.cars.filter(c=>c.visible).length,1,'A narrow street can be a solo shot');
world.update(motorsportFrame(3));assert(world.cars[1].position.z-world.cars[0].position.z>7,'Following cars have physical clearance');
world.update(motorsportFrame(5));assert(Math.abs(world.cars[0].position.x-world.cars[1].position.x)>3,'Circuit pairs can run alongside');
world.update(motorsportFrame(10.25));assert(world.cars[0].getObjectByName('curved-body-with-wheel-arches').layers.isEnabled(2));
assert(!world.cars[1].getObjectByName('curved-body-with-wheel-arches').layers.isEnabled(2),'Following Z4 stays behind the 2D sentence');
assert(!world.cars[0].getObjectByName('contact-shadow').layers.isEnabled(2));
assert(MOTOR_SPEED>=27);assert(racePosition(1,0).z>25,'City motion is materially faster than the former 9m/s');
for(const shot of MOTOR_SHOTS){const t=(shot.start+shot.end)/2;assert(Math.abs((cameraTravel(shot,t+.0001)-cameraTravel(shot,t-.0001))/.0002-raceExposure(shot,t).speed)<.00001,'Shutter displacement follows actual integrated camera speed');assert(raceExposure(shot,t).shutter>0);assert.equal(raceExposure(shot,t,true).shutter,0);assert.equal(raceExposure(shot,t,true).radial,0);}
world.update(motorsportFrame(1));const savedLines=world.speedLines.geometry.attributes.position.array.slice();world.update(motorsportFrame(5));world.update(motorsportFrame(1));assert.deepEqual(world.speedLines.geometry.attributes.position.array,savedLines,'Out-of-order frames cannot carry temporal blur ghosts');
updateSpeedLines(world.speedLines,MOTOR_SHOTS[0],.37,0);const speedSeam=world.speedLines.geometry.attributes.position.array.slice();updateSpeedLines(world.speedLines,MOTOR_SHOTS[0],12.37,0);world.speedLines.geometry.attributes.position.array.forEach((v,i)=>assert(Math.abs(v-speedSeam[i])<1e-5));
world.update(motorsportFrame(21));assert(!world.speedLines.visible);assert(!world.exposure.enabled);
// A backfire starts acceleration, then relative progress changes continuously through the cut.
assert.equal(boostMotion(.5).velocity,0);assert(boostMotion(.63).flame);assert(boostMotion(1.3).velocity>boostMotion(.63).velocity);
for(let local=.01;local<4.8;local+=.037){const m=boostMotion(local);assert(Math.abs((boostMotion(local+.00001).distance-boostMotion(local-.00001).distance)/.00002-m.velocity)<.00001);}
assert(racePosition(14.2,0).z>racePosition(14.2,1).z);assert(racePosition(16.1,1).z>racePosition(16.1,0).z);
for(const i of [0,1])assert(Math.abs(racePosition(16.4-.00001,i).z-racePosition(16.4,i).z)<.001,'Camera cut preserves integrated driver progress');
assert(Math.abs(racePosition(15.9,0).x-racePosition(15.9,1).x)>2,'Passing cars have lateral clearance');
world.update(motorsportFrame(14.43));assert(world.cars[1].userData.flames.every(f=>f.visible));
world.update(motorsportFrame(14.7));assert(world.cars[1].userData.flames.every(f=>!f.visible),'Backfire is brief');
const circuit=MOTOR_SHOTS.find(s=>s.id==='city-circuit');assert.notEqual(driverMotion(circuit,5,0).velocity,driverMotion(circuit,5,1).velocity);
assert(Math.abs((racePosition(6.4,1).z-racePosition(6.4,0).z)-(racePosition(4.5,1).z-racePosition(4.5,0).z))>1,'A parallel pair changes its spacing');
for(const mode of ['grid','cosmic','warp'])for(const local of [.1,.9,1.6])for(const index of [0,1]){
 const pose=flightPose(mode,local,index),next=flightPose(mode,local+.0001,index);
 assert(Math.abs(pose.quaternion.length()-1)<1e-8);assert(new T.Vector3(0,0,1).applyQuaternion(pose.quaternion).dot(next.position.clone().sub(pose.position).normalize())>.99,'Chassis points along its actual flight arc');
 assert(flightCamera(mode,local,.46).position.toArray().every(Number.isFinite));
}
world.update(motorsportFrame(10.25));const savedTrail=world.cosmos.trails[0].mesh.geometry.attributes.position.array.slice();
for(const trail of world.cosmos.trails){const pose=flightPose('cosmic',1.75,trail.index),origin=new T.Vector3(trail.offset,.18,-2.12).applyQuaternion(pose.quaternion).add(pose.position),arr=trail.mesh.geometry.attributes.position.array,n=arr.length;const end=new T.Vector3((arr[n-6]+arr[n-3])/2,(arr[n-5]+arr[n-2])/2,(arr[n-4]+arr[n-1])/2);assert(end.distanceTo(origin)<.00001,'Light ribbon attaches to the banked rear chassis');}
assert(world.cars.every(c=>c.getObjectByName('curved-body-with-wheel-arches').layers.isEnabled(0)),'Space cars share environment depth and illumination');
world.update(motorsportFrame(12.37));const stars=world.stars.geometry.attributes.position.array.slice();for(let i=2;i<stars.length;i+=3)assert(stars[i]<0,'Star streaks stay camera safe');
world.cosmos.update('warp',12.37,world.camera);world.stars.geometry.attributes.position.array.forEach((value,i)=>assert(Math.abs(value-stars[i])<1e-5,'Scenario seeded star phase closes after 12s'));
world.update(motorsportFrame(10.25));assert.deepEqual(world.cosmos.trails[0].mesh.geometry.attributes.position.array,savedTrail,'Flight history is analytic, not previous-frame state');
world.update(motorsportFrame(1));assert(world.cars[0].getObjectByName('curved-body-with-wheel-arches').material.isMeshToonMaterial,'Street inks restore after space');
assert(world.cars[1].getObjectByName('e85-central-lower-grille'));assert.equal(world.cars[1].children.filter(n=>n.name==='e85-swept-headlamp').length,2);
// Only the selected exhaust setup changes to line art; the grid adds four short line traces.
for(const shot of MOTOR_SHOTS){world.update(motorsportFrame((shot.start+shot.end)/2));assert.equal(world.lineArt,shot.id==='exhaust-exit');assert.equal(world.cosmos.gridTraces.filter(t=>t.line.visible).length,shot.mode==='grid'?4:0);}
for(const local of [.1,.9,1.7]){
 world.update(motorsportFrame(6.7+local));
 for(const trace of world.cosmos.gridTraces){
  assert(trace.line.isLine&&!trace.line.isMesh,'A grid tail is a stroke, never a filled ribbon');
  const a=trace.line.geometry.attributes.position.array,pose=flightPose('grid',local,trace.index),origin=new T.Vector3(trace.offset,.69,-2.13).applyQuaternion(pose.quaternion).add(pose.position);
  assert(new T.Vector3(...a.slice(-3)).distanceTo(origin)<1e-5,'Grid traces attach to each banked rear chassis');
  assert(new T.Vector3(...a.slice(0,3)).distanceTo(origin)<3.1,'Grid tails remain restrained');
  for(let i=0;i<a.length;i+=3)assert(new T.Vector3(...a.slice(i,i+3)).applyMatrix4(world.camera.matrixWorldInverse).z<-.08,'Traces cannot cross the camera');
 }
}
assert.deepEqual(motorsportFrame(100),motorsportFrame(21));
let count=0;world.scene.traverse(node=>{if(node.geometry?.attributes?.position){count++;for(const v of node.geometry.attributes.position.array)assert(Number.isFinite(v));}});assert(count>250);
const record=()=>{const out=[];return {out,ctx:new Proxy({}, {get:(_,key)=>(...args)=>out.push([key,...args]),set:(_,key,value)=>{out.push([key,value]);return true;}})};};
const P={fg:'#367f96',fg2:'#e3f0ec',paper:'#e3f0ec'};
for(const effect of [drawGridTunnel,drawWarpStars]){const a=record(),b=record();effect(a.ctx,960,540,0,P);effect(b.ctx,960,540,MOTION_LOOP,P);assert.deepEqual(a.out,b.out);}
console.log('Passed: native 2D sentence and lifecycle; nine hard cuts; restrained detailed models and real tires; traditional city; changing parallel spacing; causal boost/continuous progress; shared-space grid/warp/cosmic cars; analytic banked trails; environment shutter; six viewport shapes and Scenario 12s seams; scoped exhaust line art and four restrained, attached Grid strokes.');
