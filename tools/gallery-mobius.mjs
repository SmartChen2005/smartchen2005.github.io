import {rotateMobius,unit,dot} from '../dist/gallery/mobius-geometry.mjs';

export function mobiusPoint(u,v) {
  const radial=1+v*Math.cos(u/2);
  return [radial*Math.cos(u),radial*Math.sin(u),v*Math.sin(u/2)];
}
const subtract=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const camera=5.2,halfWidth=.38;
const point=(u,v)=>rotateMobius(mobiusPoint(u,v));
function facing(u,v){
  const e=.0001,p=point(u,v);
  const normal=unit(cross(subtract(point(u+e,v),point(u-e,v)),subtract(point(u,v+e),point(u,v-e))));
  return dot(normal,unit(subtract([0,0,camera],p)));
}
const perspective=([x,y,z])=>[x*camera/(camera-z),-y*camera/(camera-z),1/(camera-z)];

// Static line drawing: the one continuous boundary and the half-twist's
// apparent contour. No surface fills, lighting, wire grid or browser renderer.
export function renderMobiusMark() {
  const boundary=Array.from({length:513},(_,i)=>perspective(point(i/512*Math.PI*4,halfWidth)));
  const folds=[],triangles=[],turns=192,across=12;
  for(let i=0;i<turns;i++)for(let j=0;j<across;j++){
    const u=i/turns*Math.PI*2,v=-halfWidth+j/across*halfWidth*2;
    const corners=[[u,v],[u+Math.PI*2/turns,v],[u+Math.PI*2/turns,v+halfWidth*2/across],[u,v+halfWidth*2/across]];
    const projected=corners.map(([a,b])=>perspective(point(a,b)));
    for(const indices of [[0,1,2],[0,2,3]])triangles.push(indices.map(index=>projected[index]));
    const values=corners.map(([a,b])=>facing(a,b)),crossings=[];
    for(let k=0;k<4;k++){
      const next=(k+1)%4;if((values[k]>=0)===(values[next]>=0))continue;
      const t=values[k]/(values[k]-values[next]);
      crossings.push(perspective(point(...corners[k].map((x,n)=>x+(corners[next][n]-x)*t))));
    }
    if(crossings.length===2)folds.push(crossings);
  }
  const xs=boundary.map(p=>p[0]),ys=boundary.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min(340/(maxX-minX),110/(maxY-minY));
  const project=([x,y])=>[(180+(x-(minX+maxX)/2)*scale).toFixed(2),(60+(y-(minY+maxY)/2)*scale).toFixed(2)].join(',');
  // Omit hidden contours numerically, rather than masking them with white fills.
  const visible=([x,y,depth])=>!triangles.some(([a,b,c])=>{
    if(x<Math.min(a[0],b[0],c[0])||x>Math.max(a[0],b[0],c[0])||y<Math.min(a[1],b[1],c[1])||y>Math.max(a[1],b[1],c[1]))return false;
    const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<1e-12)return false;
    const s=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/det;
    const t=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/det;
    return s>=0&&t>=0&&s+t<=1&&s*a[2]+t*b[2]+(1-s-t)*c[2]>depth+.0008;
  });
  let edge='',connected=false;
  for(const p of boundary){if(visible(p)){edge+=(connected?' L':' M')+project(p);connected=true;}else connected=false;}
  const contour=folds.filter(pair=>visible(pair[0].map((x,k)=>(x+pair[1][k])/2))).map(pair=>'M'+pair.map(project).join(' L')).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" width="360" height="120" fill="none"><title>Möbius band outline</title><g stroke="#888" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="${edge.trim()}"/><path d="${contour}"/></g></svg>\n`;
}
