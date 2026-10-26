import {T} from './home-motor-geometry.mjs?rev=20261025-cosmic';
export const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(10+x*(-15+6*x));};
// One world-space ribbon for vehicles, portals, rails and the rising camera.
// Its C2 entrance stays straight through the city/guide join.
export const LOOP_START=390,LOOP_RADIUS=22,LOOP_SHIFT=12,LOOP_END=LOOP_START+Math.PI*2*LOOP_RADIUS,GUIDE_EXIT=595;
export const LOOP_ENTRY=new T.Vector3(-32,8,385),LOOP_FORWARD=new T.Vector3(Math.sin(-.42),0,Math.cos(-.42)),LOOP_RIGHT=new T.Vector3(Math.cos(-.42),0,-Math.sin(-.42));
export const LOOP_EXIT_POINT=LOOP_ENTRY.clone().addScaledVector(LOOP_RIGHT,LOOP_SHIFT);
const Y=new T.Vector3(0,1,0);
function streetCurve(p){const s=Math.max(0,p-148),a=ease(s/65);return new T.Vector3(14*Math.sin(s/44)*a,4.4*Math.sin(s/62)*a,p);}
function quintic(a,b,v0,v1,a0,a1,length){
 const c0=a.clone(),c1=v0.clone().multiplyScalar(length),c2=a0.clone().multiplyScalar(length*length/2),R=b.clone().sub(c0).sub(c1).sub(c2),V=v1.clone().multiplyScalar(length).sub(c1).addScaledVector(c2,-2),A=a1.clone().multiplyScalar(length*length).addScaledVector(c2,-2);
 return [c0,c1,c2,R.clone().multiplyScalar(10).addScaledVector(V,-4).addScaledVector(A,.5),R.clone().multiplyScalar(-15).addScaledVector(V,7).sub(A),R.clone().multiplyScalar(6).addScaledVector(V,-3).addScaledVector(A,.5)];
}
const join=330,h=.02,startPoint=streetCurve(join),v0=streetCurve(join+h).sub(streetCurve(join-h)).multiplyScalar(1/(2*h)),a0=streetCurve(join+h).add(streetCurve(join-h)).addScaledVector(startPoint,-2).multiplyScalar(1/(h*h));
const approach=quintic(startPoint,LOOP_ENTRY,v0,LOOP_FORWARD,a0,Y.clone().multiplyScalar(1/LOOP_RADIUS),LOOP_START-join),exitLength=55,exitPoint=LOOP_EXIT_POINT.clone().addScaledVector(LOOP_FORWARD,exitLength).addScaledVector(Y,1.4),exit=quintic(LOOP_EXIT_POINT,exitPoint,LOOP_FORWARD,LOOP_FORWARD,Y.clone().multiplyScalar(1/LOOP_RADIUS),new T.Vector3(),exitLength);
const polynomial=(coeff,u)=>coeff.reduce((p,c,i)=>p.addScaledVector(c,u**i),new T.Vector3());
export function guideCenter(p){
 if(p<=join)return streetCurve(p);
 if(p<LOOP_START)return polynomial(approach,(p-join)/(LOOP_START-join));
 if(p<=LOOP_END){const a=(p-LOOP_START)/LOOP_RADIUS;return LOOP_ENTRY.clone().addScaledVector(LOOP_FORWARD,LOOP_RADIUS*Math.sin(a)).addScaledVector(Y,LOOP_RADIUS*(1-Math.cos(a))).addScaledVector(LOOP_RIGHT,LOOP_SHIFT*ease((p-LOOP_START)/(LOOP_END-LOOP_START)));}
 if(p<LOOP_END+exitLength)return polynomial(exit,(p-LOOP_END)/exitLength);
 return exitPoint.clone().addScaledVector(LOOP_FORWARD,p-LOOP_END-exitLength);
}
export function guideFrame(p){
 const position=guideCenter(p),inLoop=p>=LOOP_START&&p<=LOOP_END,a=(p-LOOP_START)/LOOP_RADIUS;
 const u=Math.max(0,Math.min(1,(p-LOOP_START)/(LOOP_END-LOOP_START))),sideSpeed=LOOP_SHIFT*30*u*u*(1-u)*(1-u)/(LOOP_END-LOOP_START);
 const tangent=inLoop?LOOP_FORWARD.clone().multiplyScalar(Math.cos(a)).addScaledVector(Y,Math.sin(a)).addScaledVector(LOOP_RIGHT,sideSpeed).normalize():guideCenter(p+.02).sub(guideCenter(p-.02)).normalize();
 const right=inLoop?LOOP_RIGHT.clone().addScaledVector(tangent,-LOOP_RIGHT.dot(tangent)).normalize():new T.Vector3().crossVectors(Y,tangent).normalize(),up=new T.Vector3().crossVectors(tangent,right);
 const bank=p<LOOP_START?.13*Math.sin(Math.max(0,p-148)/44)*ease((p-148)/65)*(1-ease((p-join)/(LOOP_START-join))):0,c=Math.cos(bank),s=Math.sin(bank),r=right.clone();
 right.multiplyScalar(c).addScaledVector(up,s);up.multiplyScalar(c).addScaledVector(r,-s);
 const quaternion=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,tangent));
 return {position,tangent,right,up,quaternion,bank};
}
export const loopViewWeight=p=>ease((p-325)/60)*(1-ease((p-LOOP_END-12)/50));
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
