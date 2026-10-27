import { T, mesh } from './home-motor-geometry.mjs?rev=20261025-curved-cars';

// Corner fillets stay inside the source polygon, unlike an overshooting spline.
export function roundPath(points,radius=.05){
  const p=points.map(a=>new T.Vector3(...a)),path=new T.CurvePath(),corners=p.map((v,i)=>{
    const a=p[(i+p.length-1)%p.length].clone().sub(v),b=p[(i+1)%p.length].clone().sub(v);
    return {v,entry:v.clone().addScaledVector(a.normalize(),Math.min(radius,p[(i+p.length-1)%p.length].distanceTo(v)*.25)),exit:v.clone().addScaledVector(b.normalize(),Math.min(radius,p[(i+1)%p.length].distanceTo(v)*.25))};
  });
  for(let i=0;i<p.length;i++){const c=corners[i],next=corners[(i+1)%p.length];path.add(new T.QuadraticBezierCurve3(c.entry,c.v,c.exit));path.add(new T.LineCurve3(c.exit,next.entry));}
  return path;
}
export function roundFace(parent,points,material,{radius=.05,name='',stroke=null,width=.008,surface=null,facing=1}={}){
  let boundary=roundPath(points,radius).getSpacedPoints(96).slice(0,-1);
  if(surface)boundary=boundary.map(p=>surface(p.clone()));
  const normal=new T.Vector3();for(let i=0;i<boundary.length;i++)normal.add(new T.Vector3().crossVectors(boundary[i],boundary[(i+1)%boundary.length]));
  if(normal.z*facing<0)boundary.reverse();
  let center=boundary.reduce((a,b)=>a.add(b),new T.Vector3()).divideScalar(boundary.length);if(surface)center=surface(center);
  const values=[...center.toArray(),...boundary.flatMap(p=>p.toArray())],indices=[];
  for(let i=0;i<boundary.length;i++)indices.push(0,i+1,(i+1)%boundary.length+1);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(values,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.name='filleted-car-panel';
  const panel=mesh(parent,geometry,material);panel.name=name;
  if(stroke){const curve=new T.CatmullRomCurve3(boundary,true,'centripetal');mesh(parent,new T.TubeGeometry(curve,128,width,6,true),stroke);}
  return panel;
}
// Sample the actual lofted skin for seams, avoiding decorative lines floating
// outside a curved door or cutting through the bonnet.
function skinCrossing(geometry,row,target,axis){
  const {rings}=geometry.userData,pos=geometry.attributes.position;let value=0;
  for(let i=0;i<rings;i++){
    const a=row*rings+i,b=row*rings+(i+1)%rings,aa=axis==='y'?pos.getY(a):pos.getX(a),bb=axis==='y'?pos.getY(b):pos.getX(b);
    if((aa-target)*(bb-target)>0||Math.abs(aa-bb)<1e-8)continue;
    const f=(target-aa)/(bb-aa),va=axis==='y'?pos.getX(a):pos.getY(a),vb=axis==='y'?pos.getX(b):pos.getY(b);value=Math.max(value,va+(vb-va)*f);
  }
  return value;
}
function sectionValue(geometry,target,z,axis){
  const zs=geometry.userData.sectionZ;let row=0;while(row<zs.length-2&&zs[row+1]<z)row++;
  const f=Math.max(0,Math.min(1,(z-zs[row])/(zs[row+1]-zs[row])));
  return skinCrossing(geometry,row,target,axis)*(1-f)+skinCrossing(geometry,row+1,target,axis)*f;
}
export const skinPoint=(geometry,side,y,z,offset=.010)=>[side*(sectionValue(geometry,y,z,'y')+offset),y,z];
export function bonnetPoint(geometry,x,z,offset=.009){
  const {noseRound=0,tailRound=0}=geometry.userData;let base=z;
  for(let i=0;i<4;i++){const front=Math.max(0,Math.min(1,(base-1.4)/.62)),rear=Math.max(0,Math.min(1,(-base-1.5)/.5));base=z+noseRound*front*front*(x/.9)**2-tailRound*rear*rear*(x/.9)**2;}
  return [x,sectionValue(geometry,x,base,'x')+offset,z];
}
export function surfaceSeam(parent,geometry,side,points,material,r=.0045,closed=false,bonnet=false){
  const curve=new T.CatmullRomCurve3(points.map(([a,z])=>new T.Vector3(a,0,z)),closed,'centripetal');
  const samples=curve.getSpacedPoints(72).map(p=>new T.Vector3(...(bonnet?bonnetPoint(geometry,side*p.x,p.z):skinPoint(geometry,side,p.x,p.z))));
  const path=new T.CatmullRomCurve3(samples,closed,'centripetal');return mesh(parent,new T.TubeGeometry(path,180,r,5,closed),material);
}
