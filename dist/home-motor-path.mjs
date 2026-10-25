import {T} from './home-motor-geometry.mjs?rev=20261025-cosmic';
export const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
// One world-space ribbon for vehicles, portals, rails and the rising camera.
// Its C2 entrance stays straight through the city/guide join.
export function guideCenter(z){
 const s=Math.max(0,z-170),a=ease(s/65);
 return new T.Vector3(14*Math.sin(s/44)*a,4.4*Math.sin(s/62)*a,z);
}
export function guideFrame(z){
 const position=guideCenter(z),tangent=guideCenter(z+.02).sub(guideCenter(z-.02)).normalize();
 const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),tangent).normalize(),up=new T.Vector3().crossVectors(tangent,right);
 const bank=.13*Math.sin(Math.max(0,z-170)/44)*ease((z-170)/65),c=Math.cos(bank),s=Math.sin(bank),r=right.clone();
 right.multiplyScalar(c).addScaledVector(up,s);up.multiplyScalar(c).addScaledVector(r,-s);
 const quaternion=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,tangent));
 return {position,tangent,right,up,quaternion,bank};
}
export function guidePoint(z,x=0,y=0){const f=guideFrame(z);return f.position.addScaledVector(f.right,x).addScaledVector(f.up,y);}
export const groundOpacity=local=>1-ease((local-4.95)/1.7);
export const cameraRise=local=>ease((local-5.15)/3.25);
