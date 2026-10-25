import {T,box,batch,toon} from './home-motor-geometry.mjs?rev=20261025-cosmic';
import {motion} from './home-motor-motion.mjs?rev=20261025-cosmic';
import {guideFrame,groundOpacity} from './home-motor-path.mjs?rev=20261025-orbit';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function guideReveal(local,distance=145){return smooth((local-3.35-(1-Math.min(1,Math.max(0,distance)/145))*1.2)/1.25);}
export function createMotorGuide(){
 const root=new T.Group(),track=new T.Group(),grid=new T.Group(),frames=[],ink=toon('#777777');root.name='continuous-line-grid-guide';root.add(track,grid);
 const b=batch(track);b.add(box(42,.15,220),ink,[0,-.12,90]);b.add(box(6.2,.08,220),ink,[0,-.025,90]);
 for(const side of [-1,1])b.add(box(.15,.14,220),ink,[side*3.13,.015,90]);
 for(let row=0;row<206;row++)for(let col=0;col<7;col++)if((row+col)%3!==0)b.add(box(.68,.012,.07),ink,[(col-3)*.8+(row%2)*.4,.022,-17.7+row*.9]);b.finish();
 track.traverse(n=>n.layers.set(2)); // A normal/depth overlay with a dissolving alpha.
 for(let i=0;i<29;i++){
  const group=new T.Group(),parts=batch(group);
  for(const y of [-3,3])parts.add(box(10,.014,.018),ink,[0,y,0]);
  for(const x of [-5,5])parts.add(box(.016,6,.018),ink,[x,0,0]);
  parts.finish();grid.add(group);frames.push(group);
 }
 const offsets=[];for(const x of [-5,-2.5,0,2.5,5])for(const y of [0,6])offsets.push([x,y]);
 for(const side of [-1,1])for(const y of [1.5,3,4.5])offsets.push([side*5,y]);
 const segments=56,rails=new T.InstancedMesh(box(.012,.012,1),ink,segments*offsets.length);rails.name='curving-grid-rails';rails.instanceMatrix.setUsage(T.DynamicDrawUsage);rails.frustumCulled=false;grid.add(rails);
 const dummy=new T.Object3D(),axis=new T.Vector3(0,0,1),zero=new T.Vector3(),unit=new T.Vector3(1,1,1);
 return {root,track,grid,frames,rails,floorOpacity:1,reveal:0,update(local,travel,active){
  root.visible=active;if(!active)return;
  track.position.z=travel-motion.phase(travel,1.8)*1.8;this.floorOpacity=groundOpacity(local);track.visible=this.floorOpacity>.001;
  const base=travel-motion.phase(travel,7)*7,reveal=guideReveal(local);this.reveal=reveal;
  frames.forEach((f,i)=>{const z=base+i*7-28,k=guideReveal(local,z-travel),pose=guideFrame(z);f.position.copy(pose.position).addScaledVector(pose.up,3);f.quaternion.copy(pose.quaternion);f.visible=k>.015;f.scale.set(Math.max(.001,k),Math.max(.001,k),1);});
  const first=travel-motion.phase(travel,3.5)*3.5-28,poses=Array.from({length:segments+1},(_,j)=>guideFrame(first+j*3.5));let index=0;
  for(const [x,y]of offsets)for(let j=0;j<segments;j++){
   const z=first+j*3.5,k=guideReveal(local,z-travel),a=poses[j].position.clone().addScaledVector(poses[j].right,x).addScaledVector(poses[j].up,y),b=poses[j+1].position.clone().addScaledVector(poses[j+1].right,x).addScaledVector(poses[j+1].up,y),v=b.clone().sub(a);
   if(k>.015){dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(axis,v.clone().normalize());dummy.scale.set(k,k,v.length());}
   else{dummy.position.copy(zero);dummy.quaternion.identity();dummy.scale.copy(unit).multiplyScalar(0);}
   dummy.updateMatrix();rails.setMatrixAt(index++,dummy.matrix);
  }
  rails.visible=reveal>.015;rails.instanceMatrix.needsUpdate=true;
 }};
}
