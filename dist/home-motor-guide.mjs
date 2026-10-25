import { T,box,batch,toon } from './home-motor-geometry.mjs?rev=20261025-cosmic';
import { motion } from './home-motor-motion.mjs?rev=20261025-cosmic';
import {createStreetLanterns} from './home-motor-lanterns.mjs?rev=20261025-graphite';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
// Scenario Grid Tunnel: seeded/pure-time geometry. Recycled rows remain aligned
// in world space; the film reveal is a separate non-looping envelope.
export function guideReveal(local,distance=145){return smooth((local-3.35-(1-Math.min(1,Math.max(0,distance)/145))*1.2)/1.25);}
export function createMotorGuide(){
 const root=new T.Group(),track=new T.Group(),grid=new T.Group(),frames=[],rails=[],ink=toon('#777777');root.name='continuous-line-grid-guide';root.add(track,grid);
 const b=batch(track);b.add(box(42,.15,220),ink,[0,-.12,90]);b.add(box(6.2,.08,220),ink,[0,-.025,90]);
 for(const side of [-1,1])b.add(box(.15,.14,220),ink,[side*3.13,.015,90]);
 for(let row=0;row<206;row++)for(let col=0;col<7;col++)if((row+col)%3!==0)b.add(box(.68,.012,.07),ink,[(col-3)*.8+(row%2)*.4,.022,-17.7+row*.9]);b.finish();
 for(let i=0;i<25;i++){
  const group=new T.Group(),parts=batch(group);group.position.y=3;
  for(const y of [-3,3])parts.add(box(10,.014,.018),ink,[0,y,0]);
  for(const x of [-5,5]){parts.add(box(.016,6,.018),ink,[x,0,0]);}
  parts.finish();grid.add(group);frames.push(group);
 }
 const rail=(x,y)=>{const mesh=new T.Mesh(box(.012,.012,1),ink);mesh.position.set(x,y,0);grid.add(mesh);rails.push(mesh);};
 for(const x of [-5,-2.5,0,2.5,5])for(const y of [0,6])rail(x,y);for(const side of [-1,1])for(const y of [1.5,3,4.5])rail(side*5,y);
 const lamps=createStreetLanterns(3.1,{start:-14,end:154});root.add(lamps);
 return {root,track,grid,frames,lamps,reveal:0,update(local,travel,active,idle=false){
  root.visible=active;if(!active)return;
  // A two-row road period and seven-metre grid spacing have no visible reset.
  track.position.z=travel-motion.phase(travel,1.8)*1.8;grid.position.z=travel-motion.phase(travel,7)*7;
  const reveal=guideReveal(local);this.reveal=reveal;
  frames.forEach((f,i)=>{const z=i*7-14,d=z+grid.position.z-travel,k=guideReveal(local,d);f.position.z=z;f.visible=k>.015;f.scale.set(Math.max(.001,k),Math.max(.001,k),1);});
  const near=145-165*reveal;for(const r of rails){r.visible=reveal>.015;r.position.z=(145+near)/2;r.scale.z=Math.max(.001,145-near);}
  lamps.position.z=travel-motion.phase(travel,14)*14;const grown=smooth((local-4.05)/1.6);lamps.visible=grown>.01;lamps.scale.y=Math.max(.001,grown);
 }};
}
