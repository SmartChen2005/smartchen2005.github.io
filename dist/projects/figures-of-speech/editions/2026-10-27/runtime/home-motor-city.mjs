import {MOTOR_ROAD_HALF} from './home-motor-road.mjs?rev=20261025-road';
import {createStreetLanterns} from './home-motor-lanterns.mjs?rev=20261025-graphite';
import { T, box, cylinder, torus, batch, toon } from './home-motor-geometry.mjs?rev=20261025-cosmic';
import { motion } from './home-motor-motion.mjs?rev=20261025-cosmic';
import { createStreetArchitecture } from './home-motor-architecture.mjs?rev=20261025-long-exhaust';

// Neutral masonry values still print through each shot's existing three inks.
export function createMotorCity({circuit=false}={}){
  const root=new T.Group();root.name=circuit?'gothic-renaissance-circuit':'gothic-renaissance-narrow-lane';
  const half=MOTOR_ROAD_HALF,blocks=circuit?44:30,length=circuit?330:230,center=length/2-50;
  const M={stone:toon('#9f9f9f'),plaster:toon('#d1d1d1'),base:toon('#6b6b6b'),roof:toon('#343434'),
    trim:toon('#ededed'),window:toon('#151515'),road:toon('#282828'),pave:toon('#777777'),metal:toon('#191919')};
  const town=createStreetArchitecture(half,M,{circuit,blocks});root.add(town.root);
  const bridgeRoot=new T.Group();bridgeRoot.name='renaissance-overhead-passage';root.add(bridgeRoot);
  const road=new T.Group();root.add(road);const b=batch(road);
  b.add(box(42,.15,length),M.pave,[0,-.12,center]);b.add(box(half*2,.08,length),M.road,[0,-.025,center]);
  for(const side of [-1,1]){
    b.add(box(.18,.18,length),M.trim,[side*(half+.04),.025,center]);
    if(circuit)for(let n=0;n<blocks;n++){
      const z=-43+n*7.15;
      for(let k=0;k<5;k++)b.add(box(.48,.055,1.34),k%2?M.trim:M.base,[side*(half-.28),.055,z-2.8+k*1.35]);
      if(n%3===0)for(let k=0;k<4;k++)for(let row=0;row<2;row++)b.add(torus(.3,.105),M.metal,[side*(half+.4),.32+row*.35,z-1.4+k*.64],[Math.PI/2,0,0]);
    }
  }
  for(let row=0;row<(circuit?350:240);row++)for(let col=0;col<(circuit?13:7);col++){
    const x=(col-(circuit?6:3))*.8+(row%2)*.4,z=-42+row*.9;
    if(Math.abs(x)+.345<half-.1&&motion.rand(row*17+col,5)>.65)b.add(box(.69,.012,.08),M.pave,[x,.022,z]);
  }
  if(!circuit){
    const bridge=batch(bridgeRoot);
    // A Renaissance balustraded passage retains the original clear underpass.
    bridge.add(box(half*2+2.3,1.15,2.8),M.stone,[0,7.2,80]);
    bridge.add(box(half*2+2.5,.17,3),M.trim,[0,7.83,80]);
    for(let x=-half;x<=half;x+=.48){bridge.add(cylinder(.055,.62,8),M.trim,[x,8.2,78.6]);bridge.add(cylinder(.085,.12,10),M.stone,[x,8.2,78.6]);}
    bridge.add(box(half*2+2.1,.14,.22),M.trim,[0,8.56,78.6]);
    bridge.finish();
  }
  if(circuit)for(const z of [34,113]){
    for(const side of [-1,1])b.add(box(.1,5.2,.1),M.metal,[side*(half-.1),2.6,z]);
    b.add(box(half*2,.08,.08),M.metal,[0,5.2,z]);
    for(let row=0;row<2;row++)for(let col=0;col<24;col++)b.add(box(half*2/24,.42,.045),(row+col)%2?M.trim:M.metal,[-half+(col+.5)*half*2/24,4.4+row*.42,z]);
  }
  b.finish();root.userData={buildingCount:town.facades.length,streetHalfWidth:half,architecture:'Gothic cathedrals / pointed lancets / rose tracery / buttresses / Renaissance palazzi / round arcades / pilasters / pediments / ribbed domes',circuit,roadRange:[-50,length-50],churchCount:town.churchCount,facades:town.facades,roseWindows:town.roseWindows};
  const lamps=createStreetLanterns(half,{end:circuit?265:168});root.add(lamps);
  return {root,road,lamps,materials:M,architecture:town.root,bridge:bridgeRoot};
}
