import {MusicEngine,clamp} from './music-engine.mjs';
import {floorPoint} from './space-engine.mjs';

// The browser interpretation is deliberately calmer than the piezo firmware.
// A location owns its pitches; motion samples cannot add off-beat notes.
export const FAMILIAR_ROUTE = [
  [.25,.2],[.4,.2],[.7,.32],[.78,.65],
  [.6,.82],[.38,.7],[.22,.5],[.25,.2]
];
export function placeNotes(u,v,step,mode='ambient') {
  const zone=Math.min(7,Math.floor(clamp(v,0,1)*8));
  const column=Math.min(3,Math.floor(clamp(u,0,1)*4));
  const melody=mode==='techno'?[0,2,4,5,4,2,1,3][zone]:zone;
  const rhythm=(step%4===0?1:0)|(step%4===2?2:0)|((step+column)%2===1?4:0);
  return [rhythm,Math.min(4,Math.floor(zone/2)+column%2),melody];
}
export function routePath(points) {
  return points.map(([u,v],i)=>{const p=floorPoint(u,v);return `${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;}).join(' ');
}
export class PlaceEngine extends MusicEngine {
  constructor(){super();this.selected=2;this.route=[];}
  replace(){super.replace();this.route=[];this.step=-1;}
  clear(){super.clear();this.route=[];}
  tickAt(u,v,preview=false) {
    const step=(this.step+1)%8,notes=placeNotes(u,v,step,this.mode);
    const recording=this.recording;
    // Keep the loop/state machinery while replacing noisy speed-dependent input
    // with the stable spatial score used by this web demonstration.
    const tick=super.tick();
    if(recording){
      this.loops[this.selected][step]=notes[this.selected];
      this.route.push([u,v]);
      tick.notes=this.loops.map(loop=>loop[step]);
    }else if(preview){tick.notes[this.selected]=notes[this.selected];}
    // Empty loops remain silent in every mode until explicitly played.
    if(!recording&&!preview)tick.notes=this.loops.map(loop=>loop[step]);
    return tick;
  }
}
