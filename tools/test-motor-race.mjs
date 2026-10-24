import assert from 'node:assert/strict';
import { MOTOR_CARS, drawMotorRace, raceCamera, racePosition } from '../dist/home-motor-race.mjs';
import { MOTOR_DURATION, motorsportFrame } from '../dist/home-motorsport.mjs';

assert.deepEqual(MOTOR_CARS.map(car=>car.kind),['mini','z4']);
for(const model of MOTOR_CARS){
  assert.equal(model.wheels.length,4);
  assert(model.lines.length<90,'Keep both drawings deliberately abstract');
  for(const line of model.lines)for(const point of line.points)assert(point.every(Number.isFinite));
}
assert(Math.max(...MOTOR_CARS[0].lines.flatMap(line=>line.points.map(p=>p[1])))>1.45,'MINI retains its upright roof');
assert(Math.max(...MOTOR_CARS[1].lines.flatMap(line=>line.points.map(p=>p[1])))<1.3,'Z4 remains an open, low roadster');
assert.deepEqual([1.2,3.3,5.5,7.4].map(t=>motorsportFrame(t).leader),['mini','z4','mini','z4'],'Both cars must visibly retake the lead');
for(const shift of [1.8,3.35,5.1,6.6]){
  assert(motorsportFrame(shift+.01).rpm<motorsportFrame(shift-.01).rpm,'RPM drops on every upshift');
}
assert(raceCamera(1)[2]>10 && raceCamera(3.2)[0]>12 && raceCamera(5.5)[1]>20 && raceCamera(7.25)[2]<-10,'Front, side, overhead and chase perspectives');
for(let t=0;t<MOTOR_DURATION;t+=.02){
  const a=raceCamera(t),b=raceCamera(t+.02);
  assert(Math.hypot(...a.map((v,i)=>v-b[i]))<2,'Camera moves continuously between shots');
}
for(let d=-50;d<350;d+=2){
  const a=racePosition(d),b=racePosition(d,1.35),c=racePosition(d,-1.35);
  assert(a.point.every(Number.isFinite));
  assert(Math.abs(Math.hypot(...a.forward)-1)<1e-8);
  assert(Math.hypot(...b.point.map((v,i)=>v-c.point[i]))>2.6,'Racing lanes keep the cars apart');
}
assert.deepEqual(motorsportFrame(100),motorsportFrame(MOTOR_DURATION),'Final composition is frozen');

let commands=0;
const context=new Proxy({}, {get:(_,key)=>(...args)=>{
  for(const arg of args)if(typeof arg==='number')assert(Number.isFinite(arg),`${String(key)} received non-finite geometry`);
  commands++;
},set:()=>true});
for(const [width,height,top,bottom] of [[1920,1080,475,605],[1440,900,390,510],[1024,600,250,350],[390,844,280,560],[320,568,160,410],[844,390,150,240]]){
  for(const t of [0,.3,1.5,2.65,3.8,4.8,5.6,6.95,7.9,8.8]){
    drawMotorRace(context,motorsportFrame(t),width,height,{top,bottom},{paper:'#f5f5f3',black:'#080808'});
  }
}
assert(commands>10000,'Every viewport and shot exercises actual projection and hidden-line drawing');
console.log('Passed: recognizable model proportions; three lead changes; four views; continuous camera; separated circuit lanes; shift RPM; frozen finish; finite drawing across six viewport shapes.');
