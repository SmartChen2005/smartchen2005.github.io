import {mobiusSolidPoint,mobiusNormal,rotateMobius,unit,dot} from '../dist/gallery/mobius-geometry.mjs';

// The same solid as the live WebGL mark, rendered for no-WebGL/no-JS fallback.
export function renderMobiusMark() {
  const turns=128,around=24,camera=5.2,light=unit([-.55,.8,1.4]),faces=[];
  for(let i=0;i<turns;i++)for(let j=0;j<around;j++){
    const u=i/turns*Math.PI*2,t=j/around*Math.PI*2,du=Math.PI*2/turns,dt=Math.PI*2/around;
    const center=rotateMobius(mobiusSolidPoint(u+du/2,t+dt/2)),normal=rotateMobius(mobiusNormal(u+du/2,t+dt/2));
    const view=unit(center.map((x,k)=>(k===2?camera:0)-x));
    if(dot(normal,view)<=0)continue;
    const diffuse=Math.max(0,dot(normal,light)),half=unit(light.map((x,k)=>x+view[k]));
    const shade=Math.round(Math.min(248,148+diffuse*78+Math.pow(Math.max(0,dot(normal,half)),36)*26));
    const points=[[u,t],[u+du,t],[u+du,t+dt],[u,t+dt]].map(([a,b])=>rotateMobius(mobiusSolidPoint(a,b))).map(([x,y,z])=>[x*camera/(camera-z),-y*camera/(camera-z)]);
    faces.push({depth:center[2],shade,points});
  }
  faces.sort((a,b)=>a.depth-b.depth);
  const points=faces.flatMap(p=>p.points),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min(340/(maxX-minX),110/(maxY-minY));
  const project=([x,y])=>[(180+(x-(minX+maxX)/2)*scale).toFixed(2),(60+(y-(minY+maxY)/2)*scale).toFixed(2)].join(',');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" width="360" height="120"><title>Solid rounded Möbius band</title><g stroke-width=".3" stroke-linejoin="round">${faces.map(p=>{const color='#'+p.shade.toString(16).repeat(3);return `<polygon points="${p.points.map(project).join(' ')}" fill="${color}" stroke="${color}"/>`;}).join('')}</g></svg>\n`;
}
