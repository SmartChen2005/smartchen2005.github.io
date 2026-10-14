// A closed, solid half-twisted band. Its rounded cross-section has real depth.
export const unit = v => { const length=Math.hypot(...v); return v.map(x=>x/length); };
export const dot = (a,b) => a.reduce((sum,x,i)=>sum+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const difference=(a,b)=>a.map((x,i)=>x-b[i]);
export function mobiusSolidPoint(u,theta) {
  const rounded=x=>Math.sign(x)*Math.abs(x)**(2/2.8);
  const width=.38*rounded(Math.cos(theta)), thickness=.14*rounded(Math.sin(theta));
  const radial=1+width*Math.cos(u/2)-thickness*Math.sin(u/2);
  return [radial*Math.cos(u),radial*Math.sin(u),width*Math.sin(u/2)+thickness*Math.cos(u/2)];
}
export function mobiusNormal(u,theta) {
  const e=.0001;
  return unit(cross(difference(mobiusSolidPoint(u+e,theta),mobiusSolidPoint(u-e,theta)),difference(mobiusSolidPoint(u,theta+e),mobiusSolidPoint(u,theta-e))));
}
export function rotateMobius([x,y,z],pitch=0,yaw=0) {
  const a=1.03+pitch,b=-.28+yaw,c=-.12;
  const y1=y*Math.cos(a)-z*Math.sin(a),z1=y*Math.sin(a)+z*Math.cos(a);
  const x2=x*Math.cos(b)+z1*Math.sin(b),z2=-x*Math.sin(b)+z1*Math.cos(b);
  return [x2*Math.cos(c)-y1*Math.sin(c),x2*Math.sin(c)+y1*Math.cos(c),z2];
}
export function createMobiusGeometry(turns=128,around=24) {
  const positions=[],normals=[],indices=[];
  for(let i=0;i<=turns;i++)for(let j=0;j<=around;j++){
    const u=i/turns*Math.PI*2,t=j/around*Math.PI*2;
    positions.push(...mobiusSolidPoint(u,t));normals.push(...mobiusNormal(u,t));
  }
  for(let i=0;i<turns;i++)for(let j=0;j<around;j++){
    const a=i*(around+1)+j,b=a+around+1;
    indices.push(a,b,b+1,a,b+1,a+1);
  }
  return {positions:new Float32Array(positions),normals:new Float32Array(normals),indices:new Uint16Array(indices)};
}
