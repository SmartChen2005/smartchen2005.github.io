import { T } from './home-motor-geometry.mjs?rev=20261025-cosmic';
import { motion } from './home-motor-motion.mjs?rev=20261025-cosmic';
export const MOTOR_SPEED=30;
export const MOTOR_SHUTTER=.032;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(x)=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const integral=(u,r)=>u<=0?0:u<r?r*((u/r)**3-.5*(u/r)**4):u-r/2;
const twice=(u,r)=>u<=0?0:u<r?r*r*((u/r)**4/4-(u/r)**5/10):.5*u*u-.5*r*u+.15*r*r;
export function boostMotion(local){
  const u=local-.52,r=.18,length=.9,a=18;
  return {distance:a*(twice(u,r)-twice(u-length,r)),velocity:a*(integral(u,r)-integral(u-length,r)),
    acceleration:a*(smooth(u/r)-smooth((u-length)/r)),flame:(local>.52&&local<.75)||(local>1.04&&local<1.20)};
}
export function raceTravel(shot,t){
  const start=shot.travelStart??shot.start,end=shot.travelEnd??shot.end,length=end-start,local=clamp(t-start,0,length);
  return (shot.travelOffset||0)+MOTOR_SPEED*(.85*local+.15*local*local/length);
}
export function driverMotion(shot,t,index){
  const local=t-shot.start;
  if(shot.id==='exhaust-exit'||shot.id==='boosted-pass'){
    const boost=boostMotion(t-shot.travelStart);
    return index===1?{distance:boost.distance,velocity:boost.velocity,acceleration:boost.acceleration,flame:boost.flame}:
      {distance:5.3+.18*Math.sin((t-shot.travelStart)*1.7),velocity:.306*Math.cos((t-shot.travelStart)*1.7),acceleration:0,flame:false};
  }
  if(shot.mode==='circuit')return index===0?
    {distance:.4+.35*Math.sin(local*2.2),velocity:.77*Math.cos(local*2.2),acceleration:0,flame:false}:
    {distance:-.7+.95*local+.18*Math.sin(local*3.4+1),velocity:.95+.612*Math.cos(local*3.4+1),acceleration:0,flame:false};
  if(shot.id==='starlit-follow')return {distance:index===0?.14*Math.sin(local*2):7.4+.45*local+.12*Math.sin(local*2.7),velocity:index===0?.28*Math.cos(local*2):.45+.324*Math.cos(local*2.7),acceleration:0,flame:false};
  if(shot.id==='bumper-train')return {distance:index===0?.2*Math.sin(local*2):7.1+.35*local,velocity:index===0?.4*Math.cos(local*2):.35,acceleration:0,flame:false};
  return {distance:0,velocity:0,acceleration:0,flame:false};
}
export function cameraTravel(shot,t){return raceTravel(shot,t)+(shot.id==='boosted-pass'?driverMotion(shot,t,1).distance:0);}
export function raceExposure(shot,t,idle=false){
  const start=shot.travelStart??shot.start,end=shot.travelEnd??shot.end,local=clamp(t-start,0,end-start);
  const speed=MOTOR_SPEED*(.85+.3*local/(end-start))+(shot.id==='boosted-pass'?driverMotion(shot,t,1).velocity:0);
  return {enabled:!idle,speed,shutter:idle?0:MOTOR_SHUTTER,radial:0};
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
