import assert from 'node:assert/strict';
import fs from 'node:fs';
import {T} from '../dist/home-motor-geometry.mjs';
import {createMotorScene,raceShot,raceCamera,racePosition,MOTOR_SHOTS,MOTOR_PALETTES} from '../dist/home-motor-race.mjs';
import {MOTOR_DURATION,motorsportFrame} from '../dist/home-motorsport.mjs';
import {raceTravel,cameraTravel,driverMotion,boostMotion,raceExposure,MOTOR_SPEED,updateSpeedLines} from '../dist/home-motor-speed.mjs';
import {drawGridTunnel,drawWarpStars,MOTION_LOOP} from '../dist/home-motor-motion.mjs';
import {flightPose,flightCamera,isFlight} from '../dist/home-motor-flight.mjs';
const world=createMotorScene();
assert.equal(MOTOR_DURATION,15.7);assert.equal(MOTOR_SHOTS.length,7);
assert.deepEqual(MOTOR_SHOTS.map(s=>s.id),['starlit-lead','bumper-train','city-circuit','grid-tunnel','exhaust-exit','boosted-pass','rally-finale'],'The approved seven-shot edit removes cosmic arc and Warp Stars');
const boostShot=MOTOR_SHOTS.find(s=>s.id==='exhaust-exit'),boostTime=local=>boostShot.start+local,tracking=MOTOR_SHOTS.find(s=>s.id==='boosted-pass');assert(world.ready,'No font fetch delays native hover');
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
for(const town of [world.city,world.circuit]){
 const {facades,churchCount,roseWindows,streetHalfWidth}=town.root.userData;
 assert.equal(town.root.userData.buildingCount,facades.length);assert(facades.length>=50&&facades.length<=60);assert(facades.every(f=>['Gothic','Renaissance'].includes(f.style)));assert(churchCount>=12&&roseWindows>=8,'Ecclesiastical landmarks recur along the whole street');
 for(const side of [-1,1]){
  const row=facades.filter(f=>f.side===side).sort((a,b)=>a.z-b.z);
  assert(new Set(row.map(f=>f.style)).has('Gothic')&&new Set(row.map(f=>f.style)).has('Renaissance'));
  assert(row.filter(f=>f.kind==='cathedral').length>=3);assert(row.some(f=>f.kind==='domed-church'));
  for(let i=1;i<row.length;i++)assert(row[i].z-row[i].width/2>row[i-1].z+row[i-1].width/2,'Facades occupy distinct street plots');
 }
 const motifs=new Set();town.architecture.updateMatrixWorld(true);
 town.architecture.traverse(node=>{
  if(!node.geometry)return;motifs.add(node.geometry.name);node.geometry.computeBoundingBox();
  const instance=new T.Matrix4(),box=new T.Box3();
  for(let i=0;i<node.count;i++){node.getMatrixAt(i,instance);box.copy(node.geometry.boundingBox).applyMatrix4(instance);assert(box.min.x>streetHalfWidth+.15||box.max.x< -streetHalfWidth-.15,'Building details leave the entire driving corridor clear');}
 });
 for(const name of ['gothic-pointed-arch','gothic-rose-tracery','renaissance-round-arch','renaissance-ribbed-dome'])assert(motifs.has(name));
}
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
    if(pattern){assert(world.cars.every(c=>c.visible),'The retained Grid combines both vehicles with its line motif');assert(!world.city.root.visible&&!world.circuit.root.visible);}
    if(shot.mode==='lane')for(const car of world.cars.filter(c=>c.visible))assert(Math.abs(car.position.x)+1.15<world.city.root.userData.streetHalfWidth);
    assert.equal(world.portals.visible,shot.mode==='grid');assert(!world.stars.visible,'The removed Warp Stars setup is never active in the seven-shot edit');
  }
}
world.update(motorsportFrame(1));assert.equal(world.cars.filter(c=>c.visible).length,2,'The opening is a two-car line-art front shot');
assert(world.cars[0].position.z-world.cars[1].position.z>7,'MINI leads the Z4 with physical clearance');assert(world.camera.position.z>world.cars[0].position.z+3,'The opening camera is ahead of the leading MINI');
assert.notEqual(driverMotion(MOTOR_SHOTS[0],1,0).velocity,driverMotion(MOTOR_SHOTS[0],1,1).velocity);
world.update(motorsportFrame(3));assert(world.cars[1].position.z-world.cars[0].position.z>7,'Following cars have physical clearance');
world.update(motorsportFrame(5));assert(Math.abs(world.cars[0].position.x-world.cars[1].position.x)>3,'Circuit pairs can run alongside');
assert.deepEqual(MOTOR_SHOTS[1].camera,[.65,.65,-5.5],'The approved rear-follow camera is preserved');
world.update(motorsportFrame(3));assert(world.camera.position.z<world.cars[0].position.z);
assert(MOTOR_SPEED>=27);assert(racePosition(1,0).z>25,'City motion is materially faster than the former 9m/s');
for(const shot of MOTOR_SHOTS){const t=(shot.start+shot.end)/2;assert(Math.abs((cameraTravel(shot,t+.0001)-cameraTravel(shot,t-.0001))/.0002-raceExposure(shot,t).speed)<.00001,'Shutter displacement follows actual integrated camera speed');assert(raceExposure(shot,t).shutter>0);assert.equal(raceExposure(shot,t,true).shutter,0);assert.equal(raceExposure(shot,t,true).radial,0);}
world.update(motorsportFrame(1));const savedLines=world.speedLines.geometry.attributes.position.array.slice();world.update(motorsportFrame(5));world.update(motorsportFrame(1));assert.deepEqual(world.speedLines.geometry.attributes.position.array,savedLines,'Out-of-order frames cannot carry temporal blur ghosts');
updateSpeedLines(world.speedLines,MOTOR_SHOTS[0],.37,0);const speedSeam=world.speedLines.geometry.attributes.position.array.slice();updateSpeedLines(world.speedLines,MOTOR_SHOTS[0],12.37,0);world.speedLines.geometry.attributes.position.array.forEach((v,i)=>assert(Math.abs(v-speedSeam[i])<1e-5));
world.update(motorsportFrame(MOTOR_DURATION));assert(!world.speedLines.visible);assert(!world.exposure.enabled);
// A backfire starts acceleration, then relative progress changes continuously through the cut.
assert(boostMotion(1.4).velocity>13,'A stronger early surge moves the Z4 forward after ignition');
assert.equal(boostMotion(.5).velocity,0);assert(boostMotion(.63).flame);assert(boostMotion(1.3).velocity>boostMotion(.63).velocity);
for(let local=.01;local<4.8;local+=.037){const m=boostMotion(local);assert(Math.abs((boostMotion(local+.00001).distance-boostMotion(local-.00001).distance)/.00002-m.velocity)<.00001);}
assert(racePosition(boostTime(.4),0).z>racePosition(boostTime(.4),1).z);assert(racePosition(boostTime(2.3),1).z>racePosition(boostTime(2.3),0).z);
for(const i of [0,1])assert(Math.abs(racePosition(tracking.start-.00001,i).z-racePosition(tracking.start,i).z)<.001,'Camera cut preserves integrated driver progress');
assert(Math.abs(racePosition(boostTime(2.1),0).x-racePosition(boostTime(2.1),1).x)>2,'Passing cars have lateral clearance');
world.update(motorsportFrame(boostTime(.63)));assert(world.cars[1].userData.flames.every(f=>f.visible));
world.update(motorsportFrame(boostTime(.9)));assert(world.cars[1].userData.flames.every(f=>!f.visible),'Backfire is brief');
const circuit=MOTOR_SHOTS.find(s=>s.id==='city-circuit');assert.notEqual(driverMotion(circuit,5,0).velocity,driverMotion(circuit,5,1).velocity);
assert(Math.abs((racePosition(6.4,1).z-racePosition(6.4,0).z)-(racePosition(4.5,1).z-racePosition(4.5,0).z))>1,'A parallel pair changes its spacing');
for(const mode of ['grid','cosmic','warp'])for(const local of [.1,.9,1.6])for(const index of [0,1]){
 const pose=flightPose(mode,local,index),next=flightPose(mode,local+.0001,index);
 assert(Math.abs(pose.quaternion.length()-1)<1e-8);assert(new T.Vector3(0,0,1).applyQuaternion(pose.quaternion).dot(next.position.clone().sub(pose.position).normalize())>.99,'Chassis points along its actual flight arc');
 assert(flightCamera(mode,local,.46).position.toArray().every(Number.isFinite));
}
world.update(motorsportFrame(7.6));
assert(world.cars.every(c=>c.getObjectByName('curved-body-with-wheel-arches').layers.isEnabled(0)),'Grid cars share environment depth and illumination');
world.update(motorsportFrame(1));assert(world.cars[0].getObjectByName('curved-body-with-wheel-arches').material.isMeshToonMaterial,'Street materials restore after the Grid');
assert(world.cars[1].getObjectByName('e85-central-lower-grille'));assert.equal(world.cars[1].children.filter(n=>n.name==='e85-swept-headlamp').length,2);
// Every street uses unfilled starry line art; the retained Grid keeps its four traces.
for(const shot of MOTOR_SHOTS){world.update(motorsportFrame((shot.start+shot.end)/2));assert.equal(world.lineArt,['lane','circuit'].includes(shot.mode));if(world.lineArt)assert.equal(shot.palette,6);assert.equal(world.cosmos.gridTraces.filter(t=>t.line.visible).length,shot.mode==='grid'?4:0);}
for(const local of [.1,.9,1.7]){
 world.update(motorsportFrame(6.7+local));
 for(const trace of world.cosmos.gridTraces){
  assert(trace.line.isLine&&!trace.line.isMesh,'A grid tail is a stroke, never a filled ribbon');
  const a=trace.line.geometry.attributes.position.array,pose=flightPose('grid',local,trace.index),origin=new T.Vector3(trace.offset,.69,-2.13).applyQuaternion(pose.quaternion).add(pose.position);
  assert(new T.Vector3(...a.slice(-3)).distanceTo(origin)<1e-5,'Grid traces attach to each banked rear chassis');
  assert(new T.Vector3(...a.slice(0,3)).distanceTo(origin)<4.2,'Grid tails remain restrained');
  for(let i=0;i<a.length;i+=3)assert(new T.Vector3(...a.slice(i,i+3)).applyMatrix4(world.camera.matrixWorldInverse).z<-.08,'Traces cannot cross the camera');
 }
}
// Every architectural component, including the overhead passage, is swept
// out/up after ignition. Out-of-order evaluation and leaving the shot restore it.
const burst=world.architectureBurst,rest=burst.batches.map(b=>b.original.slice());
world.update(motorsportFrame(boostTime(.5)));
for(const [i,b] of burst.batches.entries())assert.deepEqual(b.mesh.instanceMatrix.array,rest[i],'No explosion before ignition');
world.update(motorsportFrame(boostTime(2.55)));
const airborne=burst.batches.map(b=>b.mesh.instanceMatrix.array.slice()),instance=new T.Matrix4();let pieces=0,minDepth=Infinity,maxDepth=-Infinity;
for(const b of burst.batches)for(let i=0;i<b.pieces.length;i++){
 const p=b.pieces[i];b.mesh.getMatrixAt(i,instance);const localCenter=b.mesh.geometry.boundingBox.getCenter(new T.Vector3()),flying=localCenter.applyMatrix4(instance);
 minDepth=Math.min(minDepth,flying.z-p.center.z);maxDepth=Math.max(maxDepth,flying.z-p.center.z);
 assert(flying.toArray().every(Number.isFinite));assert(flying.y>p.center.y+1,'Every piece rises into the sky');assert((flying.x-p.center.x)*p.side>1,'Every piece travels outward, away from the roadway');pieces++;
}
assert(pieces>1000,'All architectural shapes participate, not just a handful of debris props');
assert(maxDepth-minDepth>30,'Debris fans broadly through street depth rather than staying in two flat strips');
world.update(motorsportFrame(boostTime(1.2)));
for(const b of burst.batches)for(let i=0;i<b.pieces.length;i++){
 b.mesh.getMatrixAt(i,instance);const center=b.mesh.geometry.boundingBox.getCenter(new T.Vector3()).applyMatrix4(instance);
 assert(center.y>b.pieces[i].center.y,'The slower release already reaches the most distant frontages');
}
world.update(motorsportFrame(boostTime(2.53)));const beforeLift=burst.batches.map(b=>b.mesh.instanceMatrix.array.slice());
world.update(motorsportFrame(boostTime(2.55)));
for(const [n,b] of burst.batches.entries())for(let i=0;i<b.pieces.length;i++){
 const pivot=b.mesh.geometry.boundingBox.getCenter(new T.Vector3()),before=pivot.clone().applyMatrix4(instance.fromArray(beforeLift[n],i*16));b.mesh.getMatrixAt(i,instance);
 const after=pivot.applyMatrix4(instance);assert((after.y-before.y)/.02<11.5,'Buildings rise slowly instead of accelerating sharply off the top of the frame');
}

world.update(motorsportFrame(boostTime(.63)));world.update(motorsportFrame(boostTime(2.55)));
for(const [i,b] of burst.batches.entries())assert.deepEqual(b.mesh.instanceMatrix.array,airborne[i],'Airborne assembly is a pure function of shot time');
world.update(motorsportFrame(1));
for(const [i,b] of burst.batches.entries()){assert.deepEqual(b.mesh.instanceMatrix.array,rest[i],'Restarting the opening restores every original matrix');assert.equal(b.mesh.frustumCulled,b.culled);}
assert.deepEqual(motorsportFrame(100),motorsportFrame(MOTOR_DURATION));
let count=0;world.scene.traverse(node=>{if(node.geometry?.attributes?.position){count++;for(const v of node.geometry.attributes.position.array)assert(Number.isFinite(v));}});assert(count>250);
const record=()=>{const out=[];return {out,ctx:new Proxy({}, {get:(_,key)=>(...args)=>out.push([key,...args]),set:(_,key,value)=>{out.push([key,value]);return true;}})};};
const P={fg:'#367f96',fg2:'#e3f0ec',paper:'#e3f0ec'};
for(const effect of [drawGridTunnel,drawWarpStars]){const a=record(),b=record();effect(a.ctx,960,540,0,P);effect(b.ctx,960,540,MOTION_LOOP,P);assert.deepEqual(a.out,b.out);}
console.log('Passed: native 2D sentence and lifecycle; seven approved hard cuts; restrained detailed models and real tires; Gothic/Renaissance streets, recurring churches and clear architectural bounds; changing parallel spacing; causal boost/continuous progress; shared-space Grid cars and banked rear traces; environment shutter; six viewport shapes and Scenario 12s seams; MINI-led front opening, six unfilled starry streets, slower/wider analytic architectural shock wave and four attached Grid strokes.');
