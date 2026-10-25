import {T} from './home-motor-geometry.mjs?rev=20261025-cosmic';
export const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
// One world-space ribbon for vehicles, portals, rails and the rising camera.
// Its C2 entrance stays straight through the city/guide join.
export function guideCenter(z){
 const s=Math.max(0,z-148),a=ease(s/65);
 return new T.Vector3(14*Math.sin(s/44)*a,4.4*Math.sin(s/62)*a,z);
}
export function guideFrame(z){
 const position=guideCenter(z),tangent=guideCenter(z+.02).sub(guideCenter(z-.02)).normalize();
 const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),tangent).normalize(),up=new T.Vector3().crossVectors(tangent,right);
 const bank=.13*Math.sin(Math.max(0,z-148)/44)*ease((z-148)/65),c=Math.cos(bank),s=Math.sin(bank),r=right.clone();
 right.multiplyScalar(c).addScaledVector(up,s);up.multiplyScalar(c).addScaledVector(r,-s);
 const quaternion=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,tangent));
 return {position,tangent,right,up,quaternion,bank};
}
export function guidePoint(z,x=0,y=0){const f=guideFrame(z);return f.position.addScaledVector(f.right,x).addScaledVector(f.up,y);}
export const groundOpacity=(local,distance=0)=>1-ease((local-4.45+Math.max(-30,Math.min(100,distance))*.006)/1.65);
export const cameraRise=local=>ease((local-4.65)/3.25);

// Arc distance is measured on each actual offset lane, so an inside line needs
// less distance to reach the same bend. No per-corner pass is scripted.
const routes=new Map(),start=148,step=.5,end=800;
export function laneMetric(z,lane=0){return guidePoint(z+.02,lane).distanceTo(guidePoint(z-.02,lane))/.04;}
function route(lane){
 if(routes.has(lane))return routes.get(lane);
 const arc=[start],metric=[laneMetric(start,lane)];
 for(let z=start+step;z<=end;z+=step){const next=laneMetric(z,lane);arc.push(arc.at(-1)+(metric.at(-1)+4*laneMetric(z-step/2,lane)+next)*step/6);metric.push(next);}
 const data={arc,metric};routes.set(lane,data);return data;
}
export function prepareGuideRoutes(){for(const lane of [-1.05,0,1.05])route(lane);}
function sampleRoute(z,lane){
 if(z<=start)return {distance:z,metric:1};const {arc,metric}=route(lane),i=Math.max(0,Math.min(arc.length-2,Math.floor((z-start)/step))),u=(z-start-i*step)/step;
 const a=arc[i],b=arc[i+1],m=metric[i]*step,n=metric[i+1]*step;
 return {distance:(2*u*u*u-3*u*u+1)*a+(u*u*u-2*u*u+u)*m+(-2*u*u*u+3*u*u)*b+(u*u*u-u*u)*n,
 metric:((6*u*u-6*u)*a+(3*u*u-4*u+1)*m+(-6*u*u+6*u)*b+(3*u*u-2*u)*n)/step};
}
export const laneDistance=(z,lane=0)=>sampleRoute(z,lane).distance;
export function laneProgress(distance,lane=0){
 if(distance<=start)return distance;const {arc}=route(lane);let lo=0,hi=arc.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(arc[mid]<=distance)lo=mid;else hi=mid;}
 let z=start+step*(lo+(distance-arc[lo])/(arc[hi]-arc[lo]));
 for(let k=0;k<3;k++){const s=sampleRoute(z,lane);z-=(s.distance-distance)/s.metric;}return z;
}
export const ROAD_FADE_GLSL=`uniform float roadLocal;uniform float roadTravel;varying float roadZ;
float roadVisibility(){float d=clamp(roadZ-roadTravel,-30.,100.);float u=clamp((roadLocal-4.45+d*.006)/1.65,0.,1.);return 1.-u*u*u*(10.+u*(-15.+6.*u));}`;
