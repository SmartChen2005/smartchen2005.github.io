import assert from 'node:assert/strict';
import { MOTOR_CARS, MOTOR_SHOTS, drawMotorRace, raceCamera, raceShot, racePosition, motorPalette } from '../dist/home-motor-race.mjs';
import { MOTOR_DURATION, motorsportFrame } from '../dist/home-motorsport.mjs';
import { drawGridTunnel, drawWarpStars, MOTION_LOOP } from '../dist/home-motor-motion.mjs';

assert.deepEqual(MOTOR_CARS.map(car=>car.kind),['mini','z4']);
for(const model of MOTOR_CARS){
  assert.equal(model.wheels.length,4);
  assert(model.lines.length<100,'Keep both drawings deliberately abstract');
  for(const line of model.lines)for(const point of line.points)assert(point.every(Number.isFinite));
  for(const face of model.faces)for(const point of face.points)assert(point.every(Number.isFinite));
}
assert(Math.max(...MOTOR_CARS[0].lines.flatMap(line=>line.points.map(p=>p[1])))>1.45,'MINI keeps its upright roof');
assert(Math.max(...MOTOR_CARS[1].lines.flatMap(line=>line.points.map(p=>p[1])))<1.35,'Z4 keeps its open, low cockpit');
assert.deepEqual([1.2,3.3,5.5,7.4].map(t=>motorsportFrame(t).leader),['mini','z4','mini','z4']);
for(const shift of [1.8,3.35,5.1,6.6,9.1])assert(motorsportFrame(shift+.01).rpm<motorsportFrame(shift-.01).rpm,'RPM drops on upshifts');
assert.equal(MOTOR_SHOTS.length,6);
assert.equal(MOTOR_SHOTS.at(-1).end,MOTOR_DURATION);
for(let i=0;i<MOTOR_SHOTS.length;i++){
  const shot=MOTOR_SHOTS[i];
  assert.deepEqual(raceCamera(shot.start+.01),raceCamera(shot.end-.01),'Camera cannot interpolate between cuts');
  if(i){
    assert.equal(MOTOR_SHOTS[i-1].end,shot.start);
    assert.equal(raceShot(shot.start-.001).id,MOTOR_SHOTS[i-1].id);
    assert.equal(raceShot(shot.start).id,shot.id,'Cut lands on the exact edit frame');
    assert(Math.hypot(...raceCamera(shot.start).map((v,n)=>v-raceCamera(shot.start-.001)[n]))>2,'Each cut changes the camera substantially');
  }
}
assert(raceShot(4.5).roll<-.4,'Inclined overhead shot follows the supplied reference');
assert(raceCamera(1)[1]<.6 && raceCamera(2.5)[1]<.5,'Both opening angles are genuinely low');
for(let d=-50;d<350;d+=2){
  const a=racePosition(d),b=racePosition(d,1.65),c=racePosition(d,-1.65);
  assert(a.point.every(Number.isFinite));
  assert(Math.abs(Math.hypot(...a.forward)-1)<1e-8);
  assert(Math.hypot(...b.point.map((v,i)=>v-c.point[i]))>3.2);
}
assert.deepEqual(motorsportFrame(100),motorsportFrame(MOTOR_DURATION));
const P=motorPalette({paper:'#f5f5f3',black:'#080808'});
assert.notEqual(P.mini,P.silver,'User cars are black and silver');
const record=()=>{
  const commands=[];
  const ctx=new Proxy({}, {get:(_,key)=>(...args)=>{
    for(const arg of args)if(typeof arg==='number')assert(Number.isFinite(arg),`${String(key)} received non-finite geometry`);
    commands.push([key,...args]);
    if(key==='createLinearGradient')return {addColorStop(){}};
  },set:(_,key,value)=>{commands.push([key,value]);return true;}});
  return {ctx,commands};
};
for(const effect of [drawGridTunnel,drawWarpStars]){
  const a=record(),b=record(),c=record();
  effect(a.ctx,960,540,0,P);effect(b.ctx,960,540,MOTION_LOOP,P);effect(c.ctx,960,540,0,P);
  assert.deepEqual(a.commands,b.commands,'Both requested motifs close at twelve seconds');
  assert.deepEqual(a.commands,c.commands,'Both motifs are deterministic');
}
let commands=0;
for(const [width,height,top,bottom] of [[1920,1080,475,605],[1440,900,390,510],[1024,600,250,350],[390,844,280,560],[320,568,160,410],[844,390,150,240]]){
  for(const t of [0,.3,1.2,1.899,1.9,2.6,3.65,4.7,6.7,8.8,10.35,12]){
    const r=record();drawMotorRace(r.ctx,motorsportFrame(t),width,height,{top,bottom},{paper:'#f5f5f3',black:'#080808'});commands+=r.commands.length;
  }
}
assert(commands>10000);
console.log('Passed: black MINI / silver open Z4 geometry; alternating lead; five RPM drops; six exact hard cuts; low-angle and inclined reference views; Grid Tunnel / Warp Stars determinism and 12s seam; finite environment and body rendering at six viewport shapes.');
