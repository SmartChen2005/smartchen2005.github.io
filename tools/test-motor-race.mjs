import assert from 'node:assert/strict';
import fs from 'node:fs';
import {T} from '../dist/home-motor-geometry.mjs';
import {createMotorScene,raceShot,raceCamera,racePosition,raceView,MOTOR_SHOTS,MOTOR_PALETTES} from '../dist/home-motor-race.mjs';
import {MOTOR_DURATION,motorsportFrame} from '../dist/home-motorsport.mjs';
import {raceTravel,cameraTravel,driverMotion,boostMotion,raceExposure,MOTOR_SPEED,updateSpeedLines} from '../dist/home-motor-speed.mjs';
import {drawGridTunnel,drawWarpStars,MOTION_LOOP} from '../dist/home-motor-motion.mjs';
import {guideReveal} from '../dist/home-motor-guide.mjs';
import {guideFrame,guideCenter,guidePoint,groundOpacity,cameraRise} from '../dist/home-motor-path.mjs';
import {roundPath} from '../dist/home-motor-curves.mjs';
const world=createMotorScene(),nodes=root=>{const a=[];root.traverse(n=>a.push(n));return a;};
assert.equal(MOTOR_DURATION,17.7);assert.equal(MOTOR_SHOTS.length,5);
assert.deepEqual(MOTOR_SHOTS.map(s=>s.id),['starlit-lead','bumper-train','city-circuit','exhaust-exit','grid-guide']);
const boostShot=MOTOR_SHOTS[3],guideShot=MOTOR_SHOTS[4],boostTime=q=>boostShot.start+q;
assert(Math.abs(boostShot.end-boostShot.start-4.6)<1e-9);assert.equal(guideShot.start,11.3);
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
world.resize(1440,900);world.update(motorsportFrame(1));assert(world.cars[0].position.z-world.cars[1].position.z>7);assert(world.camera.position.z>world.cars[0].position.z+3);
world.update(motorsportFrame(3.2));assert(world.cars[0].visible&&!world.cars[1].visible);assert(world.camera.position.z<world.cars[0].position.z);assert.deepEqual(MOTOR_SHOTS[1].camera,[.65,.65,-5.5]);
world.update(motorsportFrame(5.5));const mini=world.cars[0].position.clone().project(world.camera),z4=world.cars[1].position.clone().project(world.camera),direction=world.camera.getWorldDirection(new T.Vector3());
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
assert.equal(guideReveal(2),0);assert(guideReveal(4,140)>guideReveal(4,10),'The guide grows from the far end towards the chase');assert.equal(guideReveal(7),1);
for(const t of [6.71,9.3,11.3,12.4,14,17.7]){world.update(motorsportFrame(t));assert(world.guide.root.visible);assert(!world.city.road.visible);if(world.guide.track.visible){const z=world.guide.track.position.z;for(const c of world.cars)assert(c.position.z>z-17&&c.position.z<z+197,'Dissolving roadway covers both cars until it disappears');}}
assert.equal(groundOpacity(4.9),1);assert(groundOpacity(5.8)>0&&groundOpacity(5.8)<1);assert.equal(groundOpacity(6.7),0);
for(let q=4.95;q<6.65;q+=.03)assert(groundOpacity(q+.02)<=groundOpacity(q));
assert.equal(cameraRise(5.1),0);assert.equal(cameraRise(8.5),1);assert(!nodes(world.guide.root).some(n=>n.name==='classical-amber-street-lanterns'),'The grid never spawns replacement street lamps');
const gaps=[],relative=[];
for(let t=11.3;t<17.7;t+=.05){const a=driverMotion(guideShot,t,0),b=driverMotion(guideShot,t,1);gaps.push(b.distance-a.distance);relative.push(b.velocity-a.velocity);}
assert(Math.max(...gaps)-Math.min(...gaps)>2.6,'Cars repeatedly close and open a visible small gap');assert(Math.min(...relative)<-1&&Math.max(...relative)>1,'Both cars sometimes gain on the other');
let bends=0,heights=[];
for(let z=170;z<480;z+=3){const f=guideFrame(z);assert(Math.abs(f.tangent.dot(f.right))<1e-6&&Math.abs(f.up.dot(f.right))<1e-6);assert(Math.abs(f.quaternion.length()-1)<1e-6);heights.push(f.position.y);if(Math.abs(f.tangent.x)>.2)bends++;}
assert(bends>20);assert(Math.max(...heights)-Math.min(...heights)>7,'The line course has both lateral and vertical curvature');
for(const t of [12.5,14,15.5,17.7]){world.update(motorsportFrame(t));assert(!world.guide.track.visible||world.guide.floorOpacity<1);for(let i=0;i<2;i++){const p=racePosition(t,i),pose=guideFrame(p.progress),expected=guidePoint(p.progress,i===0?1.05:-1.05);assert(world.cars[i].position.distanceTo(expected)<1e-7);assert(world.cars[i].quaternion.angleTo(pose.quaternion)<1e-6);}}
for(const [w,h]of [[1920,1080],[1440,900],[1024,600],[390,844],[320,568],[844,390]]){world.resize(w,h);for(let t=11.3;t<=17.7;t+=.16){world.update(motorsportFrame(t));for(const car of world.cars){const c=car.position.clone().project(world.camera);assert(Math.abs(c.x)<.72&&Math.abs(c.y)<.72&&c.z<1,'Both cars remain readable through the rising curve in every viewport');}}}
world.resize(1440,900);
const earlyView=raceView(11.3),lateView=raceView(16);assert(lateView.position.y-guideCenter(cameraTravel(guideShot,16)).y>6);assert(earlyView.position.y<1);

const burst=world.architectureBurst,rest=burst.batches.map(b=>b.original.slice());world.update(motorsportFrame(boostTime(2.55)));const air=burst.batches.map(b=>b.mesh.instanceMatrix.array.slice());
const rigid=new Map(),matrix=new T.Matrix4(),inverse=new T.Matrix4();let flyingLamps=0;
for(const b of burst.batches)if(b.mesh.userData.burstAnchors){for(let i=0;i<b.pieces.length;i++){
 const anchor=b.mesh.userData.burstAnchors[i],p=b.pieces[i];b.mesh.getMatrixAt(i,matrix);const delta=matrix.clone().multiply(inverse.copy(p.matrix).invert());
 if(rigid.has(anchor.id))delta.elements.forEach((v,k)=>assert(Math.abs(v-rigid.get(anchor.id)[k])<.00015,'Lantern frame, post and glowing glass fly as one object'));else{const moved=new T.Vector3(...anchor.center).applyMatrix4(delta);assert(moved.y>anchor.center[1]+2);assert((moved.x-anchor.center[0])*Math.sign(anchor.center[0])>2);rigid.set(anchor.id,delta.elements.slice());flyingLamps++;}
}}
assert(flyingLamps>=24);world.update(motorsportFrame(15));world.update(motorsportFrame(boostTime(2.55)));for(const [i,b]of burst.batches.entries())assert.deepEqual(b.mesh.instanceMatrix.array,air[i]);
const snapshot=()=>({frames:world.guide.frames.map(f=>[...f.position.toArray(),...f.quaternion.toArray(),...f.scale.toArray(),f.visible]),rails:world.guide.rails.instanceMatrix.array.slice(),cars:world.cars.map(c=>c.matrixWorld.elements.slice()),camera:world.camera.matrixWorld.elements.slice(),floor:world.guide.floorOpacity});
world.update(motorsportFrame(15));const guideState=snapshot();world.update(motorsportFrame(17));world.update(motorsportFrame(12));world.update(motorsportFrame(15));assert.deepEqual(snapshot(),guideState,'Curved geometry, car banking, rising camera and fade have no previous-frame history');
world.update(motorsportFrame(1));for(const [i,b]of burst.batches.entries()){assert.deepEqual(b.mesh.instanceMatrix.array,rest[i]);assert.equal(b.mesh.frustumCulled,b.culled);}
for(const shot of MOTOR_SHOTS){const t=(shot.start+shot.end)/2;assert(Math.abs((cameraTravel(shot,t+.0001)-cameraTravel(shot,t-.0001))/.0002-raceExposure(shot,t).speed)<.00001);assert.equal(raceExposure(shot,t,true).shutter,0);}
world.update(motorsportFrame(MOTOR_DURATION));assert(!world.exposure.enabled);assert(!world.speedLines.visible);assert.deepEqual(motorsportFrame(100),motorsportFrame(MOTOR_DURATION));
world.scene.traverse(n=>{if(n.geometry?.attributes?.position)for(const v of n.geometry.attributes.position.array)assert(Number.isFinite(v));});
const record=()=>{const out=[];return {out,ctx:new Proxy({}, {get:(_,key)=>(...args)=>out.push([key,...args]),set:(_,key,value)=>{out.push([key,value]);return true;}})};};
const P={fg:'#f2f1ed',fg2:'#eac36b',paper:'#f2f1ed'};for(const effect of [drawGridTunnel,drawWarpStars]){const a=record(),b=record();effect(a.ctx,960,540,0,P);effect(b.ctx,960,540,MOTION_LOOP,P);assert.deepEqual(a.out,b.out);}
console.log('Passed: five approved setups; original native heading; graphite/white/amber palette; lowered body with circular thick tires; solo MINI rear and oblique formation; delayed MINI boost with breathing gap; continuous fourth-to-fifth chase and curved Grid guide / rising camera / dissolving ground / no tunnel lamps; rigid flying lanterns / shared emitter transforms; deterministic restart and stopped finale; six viewports and Scenario motif seams.');
