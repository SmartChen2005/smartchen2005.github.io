import assert from 'node:assert/strict';
import fs from 'node:fs';
import {T} from '../dist/home-motor-geometry.mjs';
import {createMotorScene,raceShot,raceCamera,racePosition,raceView,MOTOR_SHOTS,MOTOR_PALETTES} from '../dist/home-motor-race.mjs';
import {MOTOR_DURATION,MOTOR_CLICK_LEAD,motorsportFrame,openingFrame} from '../dist/home-motorsport.mjs';
import {raceTravel,cameraTravel,driverMotion,boostMotion,raceExposure,MOTOR_SPEED,updateSpeedLines} from '../dist/home-motor-speed.mjs';
import {drawGridTunnel,drawWarpStars,MOTION_LOOP} from '../dist/home-motor-motion.mjs';
import {guideReveal} from '../dist/home-motor-guide.mjs';
import {guideFrame,guideCenter,guidePoint,groundOpacity,cameraRise,laneProgress,laneDistance,laneMetric,LOOP_START,LOOP_END,LOOP_RADIUS,LOOP_SHIFT,LOOP_RIGHT,GUIDE_EXIT,loopViewWeight} from '../dist/home-motor-path.mjs';
import {roundPath} from '../dist/home-motor-curves.mjs';
const world=createMotorScene(),nodes=root=>{const a=[];root.traverse(n=>a.push(n));return a;};
assert.equal(MOTOR_DURATION,21.45);assert.equal(MOTOR_CLICK_LEAD,MOTOR_SHOTS[0].end);assert.equal(MOTOR_SHOTS.length,6);
assert.deepEqual(MOTOR_SHOTS.map(s=>s.id),['starlit-lead','bumper-train','city-circuit','exhaust-exit','grid-guide','space-pass']);
const boostShot=MOTOR_SHOTS[3],guideShot=MOTOR_SHOTS[4],boostTime=q=>boostShot.start+q;
assert(Math.abs(boostShot.end-boostShot.start-4.6)<1e-9);assert.equal(guideShot.start,10.1);
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert.equal(html.match(/<h1 class="sentence">([\s\S]*?)<\/h1>/)[1].replace(/<[^>]*>/g,''),'Smart Chen is a (game) designer, filmmaker, and car enthusiast.');
assert(!html.includes('motor-dialog'));assert(html.includes('motor-foreground" aria-hidden="true"'));assert(!world.scene.getObjectByName('physical-homepage-sentence'));
const css=fs.readFileSync(new URL('../dist/home.css',import.meta.url),'utf8');
assert.deepEqual(MOTOR_PALETTES,[{ink:'#222226',accent:'#eac36b',paper:'#f2f1ed'}]);
for(const [key,value]of Object.entries(MOTOR_PALETTES[0]))assert(css.includes(`--motor-${key}: ${value}`));
for(const [index,car] of world.cars.entries()){
  assert.equal(car.userData.paint,index===0?'black':'silver');assert.equal(car.userData.wheels.length,4);
  const bounds=new T.Box3().setFromObject(car);assert(bounds.max.y<(index===0?1.44:1.29),'Glass-frame splines cannot inflate the intended cabin silhouette');
  assert(car.getObjectByName('curved-body-with-wheel-arches').geometry.attributes.position.count>1500);
  for(const wheel of car.userData.wheels){
    const bounds=new T.Box3().setFromObject(wheel);assert(bounds.min.y>-.005&&bounds.max.y<.675,'Real tire geometry rests on the road at the smaller scale');
    const tire=wheel.getObjectByName('tire-barrel');tire.geometry.computeBoundingBox();
    assert(tire.geometry.boundingBox.max.x-tire.geometry.boundingBox.min.x>.25,'Tyres keep their real sidewall thickness');
    assert(bounds.max.y-bounds.min.y>.66,'Body flattening must keep tires circular');
    assert(wheel.children.some(m=>m.geometry?.parameters?.openEnded===true));
    assert(wheel.children.some(m=>m.isInstancedMesh&&m.count>=60));
  }
}
const lamps=nodes(world.cars[0]).filter(c=>c.name==='recessed-f56-headlamp');assert.equal(lamps.length,2);
for(const lamp of lamps){assert(lamp.userData.lensRadius<.16);assert(lamp.position.y+lamp.userData.lensRadius*1.13<1.02,'Small lamps stay within the bonnet silhouette');}
const flags=nodes(world.cars[0]).filter(n=>n.name==='f56-union-jack-tail');assert.equal(flags.length,2);assert.deepEqual(flags.map(n=>n.userData.side),[-1,1]);
for(const flag of flags){assert.equal(flag.children.length,4);for(const n of flag.children){const b=new T.Box3().setFromObject(n);assert(b.min.y>.59&&b.max.y<.94);assert(b.min.z< -1.86);}}
const roundRear=nodes(world.cars[1]).filter(n=>n.name==='e85-round-rear-light-chamber');assert.equal(roundRear.length,4);assert.equal(roundRear.filter(n=>{const b=new T.Box3().setFromObject(n);return b.max.y-b.min.y>.19;}).length,2,'E85 has a dominant outer round chamber and smaller inner chamber on each side');
for(const name of ['e85-swept-trunk-seam','e85-central-third-brake-light','e85-plate-recess','e85-rear-plate'])assert(world.cars[1].getObjectByName(name));
assert(world.cars[0].getObjectByName('f56-roof'));assert(!world.cars[1].getObjectByName('f56-roof'));
assert(world.cars[1].getObjectByName('e85-seat-base'));assert(world.cars[1].getObjectByName('e85-steering-wheel'));
for(const car of world.cars){
 const body=car.getObjectByName('curved-body-with-wheel-arches').geometry;assert(body.userData.smoothProfile,'Body sections interpolate continuously');
 assert(body.attributes.position.count>6000);for(const v of body.attributes.normal.array)assert(Number.isFinite(v));
 assert(car.userData.wheels.every(w=>Math.abs(w.position.x)<=.8),'Tires sit within the fenders rather than protruding like a widebody kit');
}
const miniGrille=new T.Box3().setFromObject(world.cars[0].getObjectByName('f56-hex-grille'));assert(miniGrille.max.x-miniGrille.min.x>1.1,'F56 retains its broad rounded grille');
assert(world.cars[0].getObjectByName('f56-fine-honeycomb').isLineSegments,'Fine mesh must not become a solid patch in contour views');
assert(world.cars[0].getObjectByName('f56-rounded-bonnet-scoop'));
const kidneys=nodes(world.cars[1]).filter(n=>n.name==='e85-rounded-kidney');assert.equal(kidneys.length,2);
for(const kidney of kidneys){const b=new T.Box3().setFromObject(kidney);assert((b.max.x-b.min.x)/(b.max.y-b.min.y)>1.25,'E85 kidneys are wider than tall');}
assert.equal(nodes(world.cars[1]).filter(n=>n.name==='e85-round-fog-lamp').length,2);assert(!world.cars[1].getObjectByName('e85-lower-bumper-intake'),'The standard E85 apron has one broad mouth, not the previous aggressive side slots');
const fillet=roundPath([[-1,-.5,0],[1,-.5,0],[1,.5,0],[-1,.5,0]],.1).getSpacedPoints(120);
for(const p of fillet)assert(Math.abs(p.x)<=1+1e-8&&Math.abs(p.y)<=.5+1e-8,'Rounded trim remains inside its authored bounds');

for(const town of [world.city,world.circuit]){
 const {facades,churchCount,roseWindows,streetHalfWidth}=town.root.userData;
 assert.equal(town.root.userData.buildingCount,facades.length);assert(facades.length>=50&&facades.length<=(town.root.userData.circuit?85:60));assert(facades.every(f=>['Gothic','Renaissance'].includes(f.style)));assert(churchCount>=12&&roseWindows>=8,'Ecclesiastical landmarks recur along the whole street');
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

for(const car of world.cars){assert.equal(car.userData.bodyCompression,.94);assert(car.getObjectByName('lowered-bodywork'));}
for(const town of [world.city,world.circuit]){
 assert(town.lamps.userData.count>=24);assert(town.lamps.userData.centers.every(p=>Math.abs(p[0])>town.root.userData.streetHalfWidth+.3));
 assert(nodes(town.lamps).some(n=>n.geometry?.name==='amber-lantern-glass'&&n.layers.isEnabled(3)),'Lantern cores have a dedicated depth-aware amber capture');
}
for(let i=0;i<MOTOR_SHOTS.length;i++){const s=MOTOR_SHOTS[i];assert.deepEqual(raceCamera(s.start+.01),raceCamera(s.end-.01));if(i)assert.equal(MOTOR_SHOTS[i-1].end,s.start);}
for(const [w,h]of [[1920,1080],[1440,900],[1024,600],[390,844],[320,568],[844,390]]){
 world.resize(w,h);
 for(const shot of MOTOR_SHOTS){world.update(motorsportFrame((shot.start+shot.end)/2));assert(world.camera.projectionMatrix.elements.every(Number.isFinite));assert(world.camera.position.toArray().every(Number.isFinite));assert(world.lineArt,'Every setup, including the guide, uses the same line-art finish');}
}
for(const [w,h,bottom]of [[1440,900,484],[390,844,530],[320,568,380]]){world.resize(w,h,{bottom:bottom+20});for(const t of [0,8,120]){world.update(openingFrame(t));for(const car of world.cars){const b=new T.Box3().setFromObject(car);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new T.Vector3(x,y,z).project(world.camera);assert((1-p.y)*h/2>bottom+8,'Preview cars stay below the native sentence');assert(p.y>-.98,'First-shot framing cannot cut off the cars');}}}}
world.resize(1440,900);world.update(openingFrame(1));assert(world.cars[0].position.z-world.cars[1].position.z>7);assert(world.camera.position.z>world.cars[0].position.z+3);
world.update(motorsportFrame(2));assert(world.cars[0].visible&&!world.cars[1].visible);assert(world.camera.position.z<world.cars[0].position.z);assert.deepEqual(MOTOR_SHOTS[1].camera,[.65,.65,-5.5]);
for(const [w,h]of [[390,844],[320,568]]){world.resize(w,h);world.update(motorsportFrame(3.1));const b=new T.Box3().setFromObject(world.cars[0]);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new T.Vector3(x,y,z).project(world.camera);assert(Math.abs(p.x)<.98&&Math.abs(p.y)<.98,'Solo MINI remains complete in the narrow rear camera');}}world.resize(1440,900);
world.update(motorsportFrame(4.3));const mini=world.cars[0].position.clone().project(world.camera),z4=world.cars[1].position.clone().project(world.camera),direction=world.camera.getWorldDirection(new T.Vector3());
assert(mini.x<z4.x&&mini.y>z4.y,'Overhead MINI is on screen left/front; Z4 right/rear');assert(direction.y<-.65&&direction.y>-.93,'Third setup is an oblique high camera, not a vertical overhead');
world.update(motorsportFrame(boostTime(.63)));assert(world.cars[1].userData.flames.every(f=>f.visible));assert(world.cars[0].userData.flames.every(f=>!f.visible));
world.update(motorsportFrame(boostTime(1.08)));assert(world.cars[0].userData.flames.every(f=>f.visible),'MINI responds 0.45s after the Z4');
assert.equal(driverMotion(boostShot,boostTime(.8),0).velocity,0);assert(driverMotion(boostShot,boostTime(1.2),0).velocity>0);
for(let q=.01;q<=11;q+=.037){
 const t=boostTime(q),shot=raceShot(t),gap=racePosition(t,1).progress-racePosition(t,0).progress;assert(gap>-5.31&&gap<4.1,'The MINI follows with a small changing lead instead of disappearing far behind');
 for(const index of [0,1])assert(Math.abs((driverMotion(shot,t+.00001,index).distance-driverMotion(shot,t-.00001,index).distance)/.00002-driverMotion(shot,t,index).velocity)<.0001);
 assert(Math.abs((cameraTravel(shot,t+.00001)-cameraTravel(shot,t-.00001))/.00002-raceExposure(shot,t).speed)<.0001);
}
assert(racePosition(boostTime(.4),0).z>racePosition(boostTime(.4),1).z);assert(racePosition(boostTime(2.4),1).z>racePosition(boostTime(2.4),0).z+1);
for(const index of [0,1])assert(Math.abs(racePosition(guideShot.start-.00001,index).z-racePosition(guideShot.start,index).z)<.002);
world.update(motorsportFrame(guideShot.start-.00001));const beforeCamera=world.camera.matrixWorld.elements.slice();world.update(motorsportFrame(guideShot.start));world.camera.matrixWorld.elements.forEach((v,i)=>assert(Math.abs(v-beforeCamera[i])<.002,'The fourth/fifth setup has no camera reset'));
for(const t of [9.8,10.8,11.6]){world.update(motorsportFrame(t));for(const f of world.guide.frames)if(f.visible){const foot=new T.Vector3(0,-3,0).applyMatrix4(f.matrixWorld);assert(foot.distanceTo(guideCenter(f.userData.progress))<1e-6,'Portal reveal stays anchored to the ribbon floor instead of floating across the camera');}}
assert.equal(guideReveal(2),0);assert(guideReveal(4,140)>guideReveal(4,10),'The guide grows from the far end towards the chase');assert.equal(guideReveal(7),1);
for(const t of [6.71,9.3,11.3,12.4,14,17.7]){world.update(motorsportFrame(t));assert(world.guide.root.visible);assert(!world.city.road.visible);if(world.guide.track.visible){const z=world.guide.track.position.z;for(const c of world.cars)assert(c.position.z>z-17&&c.position.z<z+197,'Dissolving roadway covers both cars until it disappears');}}
assert(guideReveal(2.9,145)>0,'Far guide construction starts half a second earlier');
assert(groundOpacity(4.8,100)<groundOpacity(4.8,0)&&groundOpacity(4.8,0)<groundOpacity(4.8,-30),'Paving dissolves from the distance back to the camera');
assert.equal(groundOpacity(4.4),1);assert(groundOpacity(5.8)>0&&groundOpacity(5.8)<1);assert.equal(groundOpacity(6.4),0);
for(let q=4.45;q<6.1;q+=.03)assert(groundOpacity(q+.02)<=groundOpacity(q));
assert.equal(cameraRise(4.6),0);assert.equal(cameraRise(8.5),1);assert(!nodes(world.guide.root).some(n=>n.name==='classical-amber-street-lanterns'),'The grid never spawns replacement street lamps');
const gaps=[],relative=[];
for(let t=11.3;t<17.7;t+=.05){const a=driverMotion(guideShot,t,0),b=driverMotion(guideShot,t,1);gaps.push(b.distance-a.distance);relative.push(b.velocity-a.velocity);}
assert(Math.max(...gaps)-Math.min(...gaps)>.6,'Cars repeatedly close and open a visible small gap');assert(Math.min(...relative)<-.25&&Math.max(...relative)>.25,'Both cars sometimes gain on the other');
for(const lane of [-1.05,0,1.05])for(let distance=150;distance<700;distance+=2.7){const z=laneProgress(distance,lane);assert(Math.abs(laneDistance(z,lane)-distance)<1e-7);const dz=(laneProgress(distance+.001,lane)-laneProgress(distance-.001,lane))/.002;assert(Math.abs(dz*laneMetric(z,lane)-1)<.0001,'Each lane advances by actual travelled distance');const a=guidePoint(laneProgress(distance-.001,lane),lane),b=guidePoint(laneProgress(distance+.001,lane),lane);assert(Math.abs(a.distanceTo(b)/.002-1)<.0001,'Equal odometer distance means equal physical lane speed');}
for(const z of [180,220,250,300,370,420]){const a=laneMetric(z,1.05),b=laneMetric(z,-1.05);if(Math.abs(a-b)>.004)assert((1/a-1/b)*(b-a)>0,'The shorter inside lane gains centreline progress at the same road speed');}
assert(laneProgress(190,1.05)>laneProgress(190,-1.05)+.4);assert(laneProgress(280,-1.05)>laneProgress(280,1.05)+.4,'Opposite bends reverse the lane advantage');
let bends=0,heights=[];
for(let z=170;z<480;z+=3){const f=guideFrame(z);assert(Math.abs(f.tangent.dot(f.right))<1e-6&&Math.abs(f.up.dot(f.right))<1e-6);assert(Math.abs(f.quaternion.length()-1)<1e-6);heights.push(f.position.y);if(Math.abs(f.tangent.x)>.2)bends++;}
assert(bends>20);assert(Math.max(...heights)-Math.min(...heights)>7,'The line course has both lateral and vertical curvature');
for(const t of [12.5,14,15.5,17.7]){world.update(motorsportFrame(t));assert(!world.guide.track.visible||world.guide.floorOpacity<1);for(let i=0;i<2;i++){const p=racePosition(t,i),pose=guideFrame(p.progress),expected=guidePoint(p.progress,i===0?1.05:-1.05);assert(world.cars[i].position.distanceTo(expected)<1e-7);assert(world.cars[i].quaternion.angleTo(pose.quaternion)<1e-6);}}
for(const [w,h]of [[1920,1080],[1440,900],[1024,600],[390,844],[320,568],[844,390]]){world.resize(w,h);for(let t=10.1;t<guideShot.end;t+=.16){world.update(motorsportFrame(t));for(const car of world.cars){const c=car.position.clone().project(world.camera);assert(Math.abs(c.x)<.72&&Math.abs(c.y)<.72&&c.z<1,'Both cars remain readable through the rising curve in every viewport');}}}
world.resize(1440,900);
const earlyView=raceView(guideShot.start),lateView=raceView(16);assert(lateView.position.y-guideCenter(cameraTravel(guideShot,16)).y>6);assert(earlyView.position.y<1);

const burst=world.architectureBurst,rest=burst.batches.map(b=>b.original.slice());world.update(motorsportFrame(boostTime(2.55)));const air=burst.batches.map(b=>b.mesh.instanceMatrix.array.slice());
const rigid=new Map(),matrix=new T.Matrix4(),inverse=new T.Matrix4();let flyingLamps=0;
for(const b of burst.batches)if(b.mesh.userData.burstAnchors){for(let i=0;i<b.pieces.length;i++){
 const anchor=b.mesh.userData.burstAnchors[i],p=b.pieces[i];b.mesh.getMatrixAt(i,matrix);const delta=matrix.clone().multiply(inverse.copy(p.matrix).invert());
 if(rigid.has(anchor.id))delta.elements.forEach((v,k)=>assert(Math.abs(v-rigid.get(anchor.id)[k])<.00015,'Lantern frame, post and glowing glass fly as one object'));else{const moved=new T.Vector3(...anchor.center).applyMatrix4(delta);assert(moved.y>anchor.center[1]+2);assert((moved.x-anchor.center[0])*Math.sign(anchor.center[0])>2);rigid.set(anchor.id,delta.elements.slice());flyingLamps++;}
}}
assert(flyingLamps>=24);world.update(motorsportFrame(15));world.update(motorsportFrame(boostTime(2.55)));for(const [i,b]of burst.batches.entries())assert.deepEqual(b.mesh.instanceMatrix.array,air[i]);
const snapshot=()=>({frames:world.guide.frames.map(f=>[...f.position.toArray(),...f.quaternion.toArray(),...f.scale.toArray(),f.visible]),rails:world.guide.rails.instanceMatrix.array.slice(),cars:world.cars.map(c=>c.matrixWorld.elements.slice()),camera:world.camera.matrixWorld.elements.slice(),floor:world.guide.floorOpacity});
world.update(motorsportFrame(15));const guideState=snapshot();world.update(motorsportFrame(17));world.update(motorsportFrame(12));world.update(motorsportFrame(15));assert.deepEqual(snapshot(),guideState,'Curved geometry, car banking, rising camera and fade have no previous-frame history');
const pavementState=()=>({surfaces:world.guide.strips.map(s=>[...s.mesh.geometry.attributes.position.array,...s.mesh.geometry.attributes.normal.array]),stones:world.guide.paving.instanceMatrix.array.slice(),kerbs:world.guide.kerbs.instanceMatrix.array.slice()});
world.update(motorsportFrame(11.6));const pavement=pavementState();world.update(motorsportFrame(17));world.update(motorsportFrame(8));world.update(motorsportFrame(11.6));assert.deepEqual(pavementState(),pavement,'Curved paving and kerb morphs are deterministic when frames are requested out of order');
world.update(motorsportFrame(1));for(const [i,b]of burst.batches.entries()){assert.deepEqual(b.mesh.instanceMatrix.array,rest[i]);assert.equal(b.mesh.frustumCulled,b.culled);}
for(const shot of MOTOR_SHOTS){const t=(shot.start+shot.end)/2;assert(Math.abs((cameraTravel(shot,t+.0001)-cameraTravel(shot,t-.0001))/.0002-raceExposure(shot,t).speed)<.00001);assert.equal(raceExposure(shot,t,true).shutter,0);}
const introSnapshot=()=>({matrices:world.openingStreet.batches.map(b=>b.mesh.instanceMatrix.array.slice()),cars:world.cars.map(c=>c.matrixWorld.elements.slice()),camera:world.camera.matrixWorld.elements.slice()});
for(const time of [0,8,120,100000]){world.update(openingFrame(time));assert.equal(world.shot.id,'starlit-lead');assert(world.cars.every(c=>Math.abs(c.position.z)<10));for(const b of world.openingStreet.batches){const m=new T.Matrix4(),v=new T.Vector3();b.mesh.geometry.computeBoundingBox();const c=b.mesh.geometry.boundingBox.getCenter(new T.Vector3());for(let i=0;i<b.mesh.count;i++){b.mesh.getMatrixAt(i,m);v.copy(c).applyMatrix4(m);assert(Math.abs(v.z)<240,'Endless preview remains rebased close to the camera');}}}
world.update(openingFrame(123));const handoff=introSnapshot();world.update({...motorsportFrame(0),openingTime:123});assert.deepEqual(introSnapshot(),handoff,'Click preserves actual street geometry, cars and camera without restarting');
world.update(openingFrame(123));const intro=introSnapshot();world.update(openingFrame(99999));world.update(openingFrame(.1));world.update(openingFrame(123));assert.deepEqual(introSnapshot(),intro,'Recycled facades and lamps have no previous-frame history');
world.update(motorsportFrame(2));for(const b of world.openingStreet.batches){assert.deepEqual(b.mesh.instanceMatrix.array,b.rest);assert.equal(b.mesh.frustumCulled,b.culled);}
// Emulate the renderer's lazy instance-bound calculation, including a long hover.
const cullWorld=createMotorScene();cullWorld.resize(1440,900);cullWorld.update(openingFrame(120));
for(const b of cullWorld.openingStreet.batches)if(b.mesh.boundingSphere===null)b.mesh.computeBoundingSphere();
for(const t of [1.01,2,3.1]){
 cullWorld.update(motorsportFrame(t));const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(cullWorld.camera.projectionMatrix,cullWorld.camera.matrixWorldInverse));let visible=0;
 for(const {mesh} of cullWorld.openingStreet.batches){const cached=frustum.intersectsObject(mesh);mesh.computeBoundingSphere();assert.equal(cached,frustum.intersectsObject(mesh),'Restored street bounds cannot retain the recycled preview positions');if(cached)visible++;}
 assert(visible>160,'Second-shot architecture and road remain inside the visible street');
}
assert(loopViewWeight(LOOP_END+25)<.01,'Camera is already close again shortly after leaving the loop');
const spaceShot=MOTOR_SHOTS[5];assert.equal(spaceShot.start,guideShot.end);
for(const i of [0,1]){const a=racePosition(spaceShot.start-.00001,i),b=racePosition(spaceShot.start,i);assert(new T.Vector3(a.x,a.y,a.z).distanceTo(new T.Vector3(b.x,b.y,b.z))<.001,'Flypast preserves each actual outgoing car trajectory');}
for(const [w,h]of [[1440,900],[390,844]]){
 world.resize(w,h);world.update(motorsportFrame(spaceShot.start));const cameraPosition=world.camera.position.clone(),forward=world.camera.getWorldDirection(new T.Vector3()),passes=[];
 assert(!world.city.root.visible&&!world.circuit.root.visible&&!world.guide.root.visible,'Space flypast contains cars and stars, without city or track');
 for(const i of [0,1]){let passed=false;for(let t=spaceShot.start;t<=MOTOR_DURATION;t+=.005){world.update(motorsportFrame(t));const car=world.cars[i],depth=car.position.clone().sub(cameraPosition).dot(forward);assert(world.camera.position.distanceTo(cameraPosition)<1e-8);if(!passed&&depth<0){passes[i]=t;passed=true;}}assert(passed,'Each car actually passes behind the fixed camera');}
 assert(passes[1]<passes[0],'The slightly leading Z4 passes before MINI');
 for(const t of [spaceShot.start,spaceShot.start+.8]){world.update(motorsportFrame(t));const a=world.cars[0].position.clone().project(world.camera),b=world.cars[1].position.clone().project(world.camera);assert(a.x>0&&b.x<0,'MINI approaches on screen right and Z4 on screen left');assert(a.z<1&&b.z<1);}
}
assert(guideCenter(LOOP_END).sub(guideCenter(LOOP_START)).distanceTo(LOOP_RIGHT.clone().multiplyScalar(LOOP_SHIFT))<1e-8,'The 360-degree loop exits laterally clear of its entrance');assert(guideFrame(LOOP_START).tangent.distanceTo(guideFrame(LOOP_END).tangent)<1e-8);
const apex=guideFrame(LOOP_START+Math.PI*LOOP_RADIUS);assert(apex.up.y<-.999);assert(apex.position.y>guideCenter(LOOP_START).y+LOOP_RADIUS*1.99,'The cars invert at the full-height loop apex');
for(let p=LOOP_START;p<LOOP_END;p+=.5){const a=guideFrame(p),b=guideFrame(p+.01);assert(a.quaternion.angleTo(b.quaternion)<.003,'Loop framing cannot flip at the vertical tangents');}
for(const p of [330,LOOP_START,LOOP_END,LOOP_END+55]){const h=.005,a=guideCenter(p).sub(guideCenter(p-h)).multiplyScalar(1/h),b=guideCenter(p+h).sub(guideCenter(p)).multiplyScalar(1/h);assert(a.distanceTo(b)<.001,'Loop approach and exit have continuous tangents');}
let upsideDown=false;for(let t=14.5;t<19;t+=.05){world.update(motorsportFrame(t));if(world.cars.every(c=>new T.Vector3(0,1,0).applyQuaternion(c.quaternion).y<-.9))upsideDown=true;}assert(upsideDown,'Both actual cars pass through the inverted part of the loop');
for(const [w,h]of [[1440,900],[390,844]]){world.resize(w,h);world.update(motorsportFrame(16.5));for(let p=LOOP_START;p<=LOOP_END;p+=2)for(const x of [-5,5])for(const y of [0,6]){const v=guidePoint(p,x,y).project(world.camera);assert(Math.abs(v.x)<.98&&Math.abs(v.y)<.98&&v.z<1,'The complete loop fits the exterior camera on desktop and phone');}}
world.update(motorsportFrame(guideShot.end-.001));assert(world.cars.every((c,i)=>racePosition(guideShot.end-.001,i).progress>GUIDE_EXIT+10),'Both cars leave the last grid portal');assert(world.guide.frames.filter(f=>f.visible).every(f=>f.userData.progress<=GUIDE_EXIT));
world.update(motorsportFrame(MOTOR_DURATION));assert(!world.exposure.enabled);assert(!world.speedLines.visible);assert.deepEqual(motorsportFrame(100),motorsportFrame(MOTOR_DURATION));
world.scene.traverse(n=>{if(n.geometry?.attributes?.position)for(const v of n.geometry.attributes.position.array)assert(Number.isFinite(v));});
const record=()=>{const out=[];return {out,ctx:new Proxy({}, {get:(_,key)=>(...args)=>out.push([key,...args]),set:(_,key,value)=>{out.push([key,value]);return true;}})};};
const P={fg:'#f2f1ed',fg2:'#eac36b',paper:'#f2f1ed'};for(const effect of [drawGridTunnel,drawWarpStars]){const a=record(),b=record();effect(a.ctx,960,540,0,P);effect(b.ctx,960,540,MOTION_LOOP,P);assert.deepEqual(a.out,b.out);}
console.log('Passed: six setups and front space flypast; restored second-shot culling; earlier loop camera return; original native heading; graphite/white/amber palette; lowered body with circular thick tires; narrower MINI lamps and subtly raised roof; solo MINI rear and oblique formation; delayed MINI boost with breathing gap; continuous fourth-to-fifth chase and curved Grid guide / rising camera / dissolving ground / no tunnel lamps; rigid flying lanterns / shared emitter transforms; deterministic restart and 360 loop / inverted cars / exit; endless rebased street; six viewports and Scenario motif seams.');
