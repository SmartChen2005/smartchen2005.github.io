import {T,box,batch,toon} from './home-motor-geometry.mjs?rev=20261025-cosmic';
import {motion} from './home-motor-motion.mjs?rev=20261025-cosmic';
import {guideFrame,groundOpacity} from './home-motor-path.mjs?rev=20261025-preview';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function guideReveal(local,distance=145){return smooth((local-2.85-(1-Math.min(1,Math.max(0,distance)/145))*1.2)/1.25);}
export function createMotorGuide(){
 const root=new T.Group(),track=new T.Group(),grid=new T.Group(),frames=[],ink=toon('#777777');root.name='continuous-line-grid-guide';root.add(track,grid);
 // The actual paving bends with the same ribbon before dissolving into its grid.
 const strips=[];
 for(const [half,y]of [[21,-.12],[3.1,-.025]]){
  const geometry=new T.BufferGeometry(),vertices=new Float32Array(94*2*3),indices=[];
  for(let j=0;j<93;j++){const n=j*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}
  geometry.setAttribute('position',new T.BufferAttribute(vertices,3).setUsage(T.DynamicDrawUsage));geometry.setIndex(indices);
  const mesh=new T.Mesh(geometry,ink);mesh.frustumCulled=false;track.add(mesh);strips.push({mesh,half,y});
 }
 const stones=[];for(let row=0;row<206;row++)for(let col=0;col<7;col++)if((row+col)%3!==0)stones.push({row,col});
 const paving=new T.InstancedMesh(box(.68,.012,.07),ink,stones.length),kerbs=new T.InstancedMesh(box(.15,.14,1),ink,93*2);
 for(const m of [paving,kerbs]){m.frustumCulled=false;m.instanceMatrix.setUsage(T.DynamicDrawUsage);track.add(m);}
 track.traverse(n=>n.layers.set(2));
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
 return {root,track,grid,frames,rails,strips,paving,kerbs,floorOpacity:1,reveal:0,update(local,travel,active){
  root.visible=active;if(!active)return;
  track.position.z=travel-motion.phase(travel,1.8)*1.8;this.floorOpacity=groundOpacity(local,-30);track.visible=this.floorOpacity>.001;
  if(track.visible){
   const base=track.position.z,poses=Array.from({length:94},(_,j)=>guideFrame(base-20+j*2.4));
   for(const strip of strips){const pos=strip.mesh.geometry.attributes.position;poses.forEach((p,j)=>{const melt=1-groundOpacity(local,p.position.z-travel),half=strip.half===21?21:3.1+1.9*melt;for(const side of [-1,1]){const v=p.position.clone().addScaledVector(p.right,side*half).addScaledVector(p.up,strip.y);pos.setXYZ(j*2+(side===-1?0:1),v.x,v.y,v.z-base);}});pos.needsUpdate=true;strip.mesh.geometry.computeVertexNormals();}
   const rowPoses=Array.from({length:206},(_,j)=>guideFrame(base-17.7+j*.9));
   stones.forEach(({row,col},i)=>{const p=rowPoses[row],melt=1-groundOpacity(local,p.position.z-travel);dummy.position.copy(p.position).addScaledVector(p.right,((col-3)*.8+(row%2)*.4)*(1+.2*melt)).addScaledVector(p.up,.022);dummy.position.z-=base;dummy.quaternion.copy(p.quaternion);dummy.scale.set(1+.45*melt,1,1);dummy.updateMatrix();paving.setMatrixAt(i,dummy.matrix);});paving.instanceMatrix.needsUpdate=true;
   let k=0;for(const side of [-1,1])for(let j=0;j<93;j++){const a=poses[j],b=poses[j+1],melt=1-groundOpacity(local,a.position.z-travel),width=3.13+1.87*melt,A=a.position.clone().addScaledVector(a.right,side*width).addScaledVector(a.up,.015),B=b.position.clone().addScaledVector(b.right,side*width).addScaledVector(b.up,.015),v=B.clone().sub(A);dummy.position.copy(A).add(B).multiplyScalar(.5);dummy.position.z-=base;dummy.quaternion.setFromUnitVectors(axis,v.clone().normalize());dummy.scale.set(1,1,v.length()+.015);dummy.updateMatrix();kerbs.setMatrixAt(k++,dummy.matrix);}kerbs.instanceMatrix.needsUpdate=true;
  }
  const base=travel-motion.phase(travel,7)*7,reveal=guideReveal(local);this.reveal=reveal;
  frames.forEach((f,i)=>{const z=base+i*7-28,k=guideReveal(local,z-travel),pose=guideFrame(z);f.position.copy(pose.position).addScaledVector(pose.up,3*k);f.quaternion.copy(pose.quaternion);f.visible=k>.015;f.scale.set(Math.max(.001,k),Math.max(.001,k),1);});
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
