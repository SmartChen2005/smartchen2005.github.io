import {T} from './home-motor-geometry.mjs?rev=20261025-cosmic';
export const OPENING_SPEED=30;
export function openingCar(time,index){
 return {distance:OPENING_SPEED*time+(index===0?7.4+.20*Math.sin(time*.8):.12*Math.sin(time*.9)),
  offset:index===0?7.4+.20*Math.sin(time*.8):.12*Math.sin(time*.9)};
}
// Camera-relative recycling keeps even a very long hover close to the origin.
// A whole frontage/lamp wraps behind the camera, beyond the far visible field.
export function createOpeningStreet(city){
 const batches=[],matrix=new T.Matrix4(),center=new T.Vector3();let active=false;
 for(const [root,kind,period]of [[city.architecture,'facade',214.5],[city.bridge,'bridge',214.5],[city.road,'road',216],[city.lamps,'lamp',210]])root.traverse(mesh=>{
  if(!mesh.isInstancedMesh)return;mesh.geometry.computeBoundingBox();const pivot=mesh.geometry.boundingBox.getCenter(new T.Vector3()),size=mesh.geometry.boundingBox.getSize(new T.Vector3()),pieces=[];
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);center.copy(pivot).applyMatrix4(matrix);let anchor=center.z;
   if(kind==='facade'){const side=center.x<0?-1:1,row=city.root.userData.facades.filter(f=>f.side===side);anchor=(row.find(f=>Math.abs(center.z-f.z)<=f.width/2+.3)||row.reduce((a,b)=>Math.abs(a.z-center.z)<Math.abs(b.z-center.z)?a:b)).z;}
   if(kind==='lamp')anchor=mesh.userData.burstAnchors[i].center[2];
   pieces.push({matrix:matrix.clone(),anchor,follow:kind==='road'&&size.z>10});
  }
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);batches.push({mesh,pieces,period,rest:mesh.instanceMatrix.array.slice(),culled:mesh.frustumCulled});
 });
 return {batches,update(enabled,distance=0){
  if(!enabled){if(active)for(const b of batches){b.mesh.instanceMatrix.array.set(b.rest);b.mesh.instanceMatrix.needsUpdate=true;b.mesh.frustumCulled=b.culled;}active=false;return;}
  active=true;
  for(const {mesh,pieces,period}of batches){mesh.frustumCulled=false;pieces.forEach((p,i)=>{matrix.copy(p.matrix);matrix.elements[14]+=p.follow?-65-p.anchor:period*Math.floor((distance+35-p.anchor)/period)-distance;mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;}
 }};
}
