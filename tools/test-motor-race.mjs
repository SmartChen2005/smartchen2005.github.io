import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {T} from '../dist/home-motor-geometry.mjs';
import {createMotorScene,raceShot,raceCamera,racePosition,MOTOR_SHOTS,popPalette,TYPE_PLACEMENTS,POP_COLORS} from '../dist/home-motor-race.mjs';
import {MOTOR_DURATION,motorsportFrame} from '../dist/home-motorsport.mjs';
import {createSentenceGeometry,MOTOR_SENTENCE} from '../dist/home-motor-type.mjs';
import {drawGridTunnel,drawWarpStars,MOTION_LOOP} from '../dist/home-motor-motion.mjs';

const world=createMotorScene(),font=JSON.parse(fs.readFileSync(new URL('../dist/assets/motor-sentence-glyphs.json',import.meta.url),'utf8'));
assert.equal(MOTOR_DURATION,16);assert.equal(MOTOR_SHOTS.length,8);
assert.equal(font.text,MOTOR_SENTENCE);
for(const [name,hash] of Object.entries(font.sourceHashes))assert.equal(createHash('sha256').update(fs.readFileSync(new URL(`../dist/assets/fonts/${name}`,import.meta.url))).digest('hex'),hash);
const css=fs.readFileSync(new URL('../dist/home.css',import.meta.url),'utf8');
for(const [name,value] of Object.entries(POP_COLORS))assert(css.includes(`--motor-pop-${name}: ${value}`),'Scene defaults match the canonical CSS palette');
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert.equal(html.match(/<h1 class="sentence">([\s\S]*?)<\/h1>/)[1].replace(/<[^>]*>/g,''),MOTOR_SENTENCE,'Physical text preserves the exact homepage sentence');
world.setType(font);
assert.equal(world.ready,true);
for(const [index,car] of world.cars.entries()){
  assert.equal(car.userData.paint,index===0?'black':'silver');
  assert.equal(car.userData.wheels.length,4);
  const body=car.getObjectByName('curved-body-with-wheel-arches');
  assert(body.geometry.attributes.position.count>1500,'Body loft is materially more detailed than the prior schematic');
  for(const wheel of car.userData.wheels){
    const tire=wheel.getObjectByName('tire-barrel');tire.geometry.computeBoundingBox();
    assert(tire.geometry.boundingBox.max.x-tire.geometry.boundingBox.min.x>.25,'Tire has a real barrel and sidewall width');
    assert(wheel.children.some(mesh=>mesh.geometry?.parameters?.openEnded===true),'Wheel barrel is hollow so brakes remain visible');
    assert(wheel.children.some(mesh=>mesh.isInstancedMesh&&mesh.count>=60),'Tread is modeled geometry');
  }
}
assert(world.cars[0].getObjectByName('f56-roof'));assert(!world.cars[1].getObjectByName('f56-roof'));
assert(world.cars[1].getObjectByName('e85-seat-base'));assert(world.cars[1].getObjectByName('e85-steering-wheel'));
assert(world.city.root.userData.buildingCount>=60);
assert(world.scene.getObjectByName('Grid Tunnel'));assert(world.scene.getObjectByName('Warp Stars'));
assert(world.scene.getObjectByName('sentence-over'));assert.equal(world.scene.getObjectByName('physical-homepage-sentence').children.filter(g=>g.name==='sentence-under').length,2);
const type=createSentenceGeometry(font);assert(type.geometries.every(g=>g.attributes.position.count>1000));
for(const car of world.cars){
  const bounds=new T.Box3().setFromObject(car);assert(bounds.max.y<TYPE_PLACEMENTS[0].y-.5,'Both cars physically clear the text lintel');
}
assert(TYPE_PLACEMENTS.find(p=>p.kind==='over').y<.05,'Drive-over letters sit on the street');
for(let i=0;i<MOTOR_SHOTS.length;i++){
  const shot=MOTOR_SHOTS[i];assert.deepEqual(raceCamera(shot.start+.01),raceCamera(shot.end-.01));
  if(i){assert.equal(MOTOR_SHOTS[i-1].end,shot.start);assert.notEqual(raceShot(shot.start-.001).id,raceShot(shot.start).id);}
}
assert.deepEqual([1.1,3.55,6,8.45].map(t=>motorsportFrame(t).leader),['mini','z4','mini','z4']);
assert.notEqual(popPalette(0).sky,popPalette(1).sky);
assert(popPalette(0).walls.every(color=>color!=='#fff1c9'),'Establishing facades use saturated print colors');
let geometryCount=0;
world.scene.traverse(node=>{
  if(!node.geometry?.attributes?.position)return;geometryCount++;
  const p=node.geometry.attributes.position.array;for(const value of p)assert(Number.isFinite(value));
});assert(geometryCount>300);
for(const [w,h] of [[1920,1080],[1440,900],[1024,600],[390,844],[320,568],[844,390]]){
  world.resize(w,h);assert.equal(world.camera.aspect,w/h);
  for(const shot of MOTOR_SHOTS){
    const t=(shot.start+shot.end)/2,frame=motorsportFrame(t);world.update(frame);
    assert(world.camera.position.toArray().every(Number.isFinite));assert(world.camera.projectionMatrix.elements.every(Number.isFinite));
    assert(Math.abs(world.camera.position.x)<=6.25,'Portrait and desktop cameras remain inside the street, outside building walls');
    const [a,b]=world.cars.map(car=>car.position);assert(Math.abs(a.x-b.x)>3.3);
    assert.equal(world.portals.visible,shot.id==='grid-arcade');
  }
}
world.update(motorsportFrame(7.0));assert(world.cars.some(car=>car.position.y>0),'Suspension responds while crossing raised street letters');
world.update({t:11.1,idle:false});
const portalOffsets=world.portals.children.map(p=>p.position.z-11.1*8.8),starPositions=world.stars.geometry.attributes.position.array.slice();
world.update({t:23.1,idle:false});
world.portals.children.forEach((p,i)=>assert(Math.abs(p.position.z-23.1*8.8-portalOffsets[i])<1e-8,'3D Grid Tunnel repeats in camera-relative space'));
world.stars.geometry.attributes.position.array.forEach((v,i)=>assert(Math.abs(v-starPositions[i])<1e-5,'3D Warp Stars closes at twelve seconds'));
assert.deepEqual(motorsportFrame(100),motorsportFrame(16));
// Retain independent deterministic and exact seam coverage for both requested motifs.
const record=()=>{const out=[];return {out,ctx:new Proxy({}, {get:(_,key)=>(...args)=>out.push([key,...args]),set:(_,key,value)=>{out.push([key,value]);return true;}})};};
const P={fg:'#00d9ff',fg2:'#ffe600',paper:'#fff1c9'};
for(const effect of [drawGridTunnel,drawWarpStars]){const a=record(),b=record();effect(a.ctx,960,540,0,P);effect(b.ctx,960,540,MOTION_LOOP,P);assert.deepEqual(a.out,b.out);}
console.log('Passed: detailed black MINI / silver open Z4; eight volumetric tires, open rim barrels and modeled tread; original extruded homepage glyphs; physical over/under text clearances; 61 European facades; eight hard cuts; saturated print palettes; finite full-screen projection at six viewport shapes; Grid Tunnel / Warp Stars seam.');
