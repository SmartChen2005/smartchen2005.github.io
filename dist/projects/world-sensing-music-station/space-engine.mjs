import {MIN_CM,MAX_CM,clamp} from './music-engine.mjs';

// A schematic room in the same isometric projection as the handmade device.
export function floorPoint(u,v,height=0){return {x:170+620*u+130*v,y:350-150*u+250*v-height};}
export function floorCoordinates(x,y){
  const dx=x-170,dy=y-350,det=620*250+150*130;
  return {u:clamp((250*dx-130*dy)/det,.12,.88),v:clamp((150*dx+620*dy)/det,0,1)};
}
export function distanceAt(v){return MIN_CM+clamp(v,0,1)*(MAX_CM-MIN_CM);}
export function depthAt(distance){return clamp((distance-MIN_CM)/(MAX_CM-MIN_CM),0,1);}
export function roomPose(u,distance){
  const v=depthAt(distance),floor=floorPoint(u,v),device={x:floor.x,y:floor.y-55};
  const sensor={x:device.x-67.2,y:device.y-36.4};
  const wall={x:sensor.x-130*v,y:sensor.y-250*v};
  return {floor,device,sensor,wall,v};
}
export function sonarArc(sensor,wall,phase,returning=false){
  const t=clamp(phase,0,1),dx=wall.x-sensor.x,dy=wall.y-sensor.y,length=Math.hypot(dx,dy)||1;
  const center={x:sensor.x+dx*t,y:sensor.y+dy*t};
  const normal={x:-dy/length,y:dx/length},radius=8+t*26,bend=returning?-7:7;
  const start={x:center.x+normal.x*radius,y:center.y+normal.y*radius};
  const end={x:center.x-normal.x*radius,y:center.y-normal.y*radius};
  return `M${start.x.toFixed(2)} ${start.y.toFixed(2)} Q${(center.x+dx/length*bend).toFixed(2)} ${(center.y+dy/length*bend).toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}
