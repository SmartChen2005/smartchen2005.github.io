import { T } from './home-motor-geometry.mjs?rev=20261025-cosmic';
import { motion } from './home-motor-motion.mjs?rev=20261025-cosmic';
export const MOTOR_SPEED=30;
export const MOTOR_SHUTTER=.032;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(x)=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const integral=(u,r)=>u<=0?0:u<r?r*((u/r)**3-.5*(u/r)**4):u-r/2;
const twice=(u,r)=>u<=0?0:u<r?r*r*((u/r)**4/4-(u/r)**5/10):.5*u*u-.5*r*u+.15*r*r;
export function boostMotion(local,{a=18,length=.9}={}){
  const u=local-.52,r=.18;
  return {distance:a*(twice(u,r)-twice(u-length,r)),velocity:a*(integral(u,r)-integral(u-length,r)),
    acceleration:a*(smooth(u/r)-smooth((u-length)/r)),flame:(local>.52&&local<.75)||(local>1.04&&local<1.20)};
}
export function raceTravel(shot,t){
  const start=shot.travelStart??shot.start,end=shot.travelEnd??shot.end,length=shot.travelRamp??end-start,local=Math.max(0,t-start);
  const ramp=Math.min(local,length);return (shot.travelOffset||0)+MOTOR_SPEED*(.85*ramp+.15*ramp*ramp/length+1.15*Math.max(0,local-length));
}
// Integrated, gently out-of-phase corrections: the gap breathes after the surge.
export function pursuitMotion(local,index){
 const u=local-2.25,r=1.6,x=clamp(u/r,0,1),e=x*x*x*(10+x*(-15+6*x));
 const de=u>0&&u<r?30*x*x*(1-x)*(1-x)/r:0,dd=u>0&&u<r?(60*x-180*x*x+120*x*x*x)/(r*r):0;
 const f=.32*Math.sin(u*1.2)+.10*Math.sin(u*2.1),df=.384*Math.cos(u*1.2)+.21*Math.cos(u*2.1),ddf=-.4608*Math.sin(u*1.2)-.441*Math.sin(u*2.1),scale=index===0?.72:index===1?-.60:.06;
 return {distance:scale*e*f,velocity:scale*(de*f+e*df),acceleration:scale*(dd*f+2*de*df+e*ddf)};
}
export function driverMotion(shot,t,index){
  const local=t-shot.start;
  if(shot.id==='exhaust-exit'||shot.id==='grid-guide'||shot.id==='space-pass'){
    const q=t-shot.travelStart,m=boostMotion(q-(index===0?.45:0),index===0?{a:17.5,length:16.2/17.5}:{}),p=pursuitMotion(q,index);
    return {distance:m.distance+(index===0?5.3:0)+p.distance,velocity:m.velocity+p.velocity,acceleration:m.acceleration+p.acceleration,flame:m.flame};
  }
  if(shot.id==='city-circuit')return index===0?
    {distance:3.0+.16*Math.sin(local*2.2),velocity:.352*Math.cos(local*2.2),acceleration:0,flame:false}:
    {distance:.12*Math.sin(local*2.1+1),velocity:.252*Math.cos(local*2.1+1),acceleration:0,flame:false};
  if(shot.id==='starlit-lead')return {distance:index===0?7.4+.45*local+.12*Math.sin(local*2.7):.14*Math.sin(local*2),velocity:index===0?.45+.324*Math.cos(local*2.7):.28*Math.cos(local*2),acceleration:0,flame:false};
  if(shot.id==='bumper-train')return {distance:index===0?.2*Math.sin(local*2):7.1+.35*local,velocity:index===0?.4*Math.cos(local*2):.35,acceleration:0,flame:false};
  return {distance:0,velocity:0,acceleration:0,flame:false};
}
export const cameraBoost=(shot,t)=>{if(!['exhaust-exit','grid-guide','space-pass'].includes(shot.id))return {distance:0,velocity:0};const q=t-shot.travelStart,b=boostMotion(q-.60),p=pursuitMotion(q,2);return {distance:b.distance+p.distance,velocity:b.velocity+p.velocity};};
export function cameraTravel(shot,t){return raceTravel(shot,t)+cameraBoost(shot,t).distance;}
export function raceExposure(shot,t,idle=false){
  const start=shot.travelStart??shot.start,end=shot.travelEnd??shot.end,length=shot.travelRamp??end-start,local=clamp(t-start,0,length);
  const baseSpeed=MOTOR_SPEED*(.85+.3*local/length),speed=baseSpeed+cameraBoost(shot,t).velocity;
  return {enabled:!idle,speed,baseSpeed,shutter:idle?0:MOTOR_SHUTTER,radial:0};
}
export function createSpeedLines(){
  const positions=new Float32Array(72*6),colors=new Float32Array(72*6);
  for(let i=0;i<72;i++){const c=new T.Color(i%4===0?'#ffffff':'#999999');c.toArray(colors,i*6);c.toArray(colors,i*6+3);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('color',new T.BufferAttribute(colors,3));
  const lines=new T.LineSegments(geometry,new T.LineBasicMaterial({vertexColors:true,depthWrite:false}));
  lines.name='peripheral-speed-streaks';lines.frustumCulled=false;return lines;
}
export function updateSpeedLines(lines,shot,t,travel,idle=false){
  lines.visible=!idle&&['lane','circuit','flyby'].includes(shot.mode);lines.position.set(0,0,shot.mode==='flyby'?0:travel);
  const positions=lines.geometry.attributes.position.array;
  for(let i=0;i<72;i++){
    const p=motion.phase(t,1.5,motion.rand(i,31)*1.5),side=i%2?1:-1;
    if(shot.mode==='flyby'){
      const x=-14+p*30,z=(motion.rand(i,32)-.5)*13,y=-.1;
      positions.set([x,y,z,x+2+motion.rand(i,33)*4,y,z-2-motion.rand(i,33)*3],i*6);
    }else{
      const x=side*((shot.mode==='circuit'?4.7:2.7)+motion.rand(i,32)*.5),y=i%4===0?.9+motion.rand(i,34)*1.8:.04,z=87-p*105;
      positions.set([x,y,z,x,y,z-1.5-motion.rand(i,33)*6],i*6);
    }
  }
  lines.geometry.attributes.position.needsUpdate=true;
}
// Sample the environment through a deterministic, centered shutter. No previous
// frame is retained, so cuts, restarts and reduced motion cannot inherit ghosts.
export const MOTOR_BACKGROUND_FRAGMENT=`
uniform sampler2D source;
uniform sampler2D depthSource;
uniform mat4 inverseViewProjection;
uniform mat4 previousViewProjection;
uniform vec3 ink;
uniform vec3 accent;
uniform vec3 paper;
uniform float radialStretch;
uniform bool moving;
varying vec2 vUv;
vec3 printed(vec3 color){float v=dot(color,vec3(.2126,.7152,.0722));return v<.075?ink:(v<.42?accent:paper);}
void main(){
  vec2 velocity=vec2(0.0);
  if(moving){
    float depth=texture2D(depthSource,vUv).x;
    if(depth<.999999){
      vec4 world=inverseViewProjection*vec4(vUv*2.0-1.0,depth*2.0-1.0,1.0);world/=world.w;
      vec4 past=previousViewProjection*world;
      velocity=vUv-(past.xy/past.w*.5+.5);
    }
    velocity+=(vUv-vec2(.5,.5))*radialStretch;
    velocity*=min(1.0,.09/max(length(velocity),.00001));
  }
  vec3 color=vec3(0.0);
  for(int i=0;i<17;i++){
    vec2 uv=vUv+velocity*(float(i)/16.0-.5);
    float inside=step(0.0,uv.x)*step(0.0,uv.y)*step(uv.x,1.0)*step(uv.y,1.0);
    color+=mix(ink,printed(texture2D(source,clamp(uv,vec2(.001),vec2(.999))).rgb),inside);
  }
  gl_FragColor=vec4(color/17.0,1.0);
}`;
export const MOTOR_COMPOSITE_FRAGMENT=`
uniform sampler2D background;
uniform sampler2D cars;
uniform sampler2D environmentDepth;
uniform sampler2D vehicleDepth;
uniform vec3 ink;
uniform vec3 accent;
uniform vec3 paper;
varying vec2 vUv;
void main(){
  vec3 bg=texture2D(background,vUv).rgb;vec4 car=texture2D(cars,vUv);
  vec3 color=car.rgb/max(car.a,.001);float v=dot(color,vec3(.2126,.7152,.0722));
  vec3 printed=v<.075?ink:(v<.42?accent:paper);
  float visible=step(texture2D(vehicleDepth,vUv).x,texture2D(environmentDepth,vUv).x+.00003);
  gl_FragColor=vec4(mix(bg,printed,car.a*visible),1.0);
  #include <colorspace_fragment>
}`;
