import { T, box, cylinder, torus, batch, toon, polygon } from './home-motor-geometry.mjs?rev=20261025-cosmic';
import { motion } from './home-motor-motion.mjs?rev=20261025-cosmic';

// Neutral source values are separated into three printing inks by the final pass.
export function createMotorCity({circuit=false}={}){
  const root=new T.Group();root.name=circuit?'old-town-circuit':'medieval-narrow-lane';
  const half=circuit?6.1:3.1;
  const M={stone:toon('#bdbdbd'),plaster:toon('#d9d9d9'),timber:toon('#242424'),roof:toon('#414141'),
    trim:toon('#ececec'),window:toon('#141414'),road:toon('#282828'),pave:toon('#777777'),
    metal:toon('#191919'),shutter:toon('#626262'),sign:toon('#b0b0b0')};
  const b=batch(root),gables=new Map();let buildingCount=0;
  b.add(box(42,.15,230),M.pave,[0,-.12,65]);
  b.add(box(half*2,.08,230),M.road,[0,-.025,65]);
  for(const side of [-1,1]){
    b.add(box(.18,.18,230),M.trim,[side*(half+.04),.025,65]);
    for(let n=0;n<30;n++){
      const z=-43+n*7.15,front=side*(half+1.03),x=front+side*2.1;
      const height=4.7+Math.floor(motion.rand(n,side+12)*3)*1.5,wide=6.7;
      const wall=n%3===0?M.stone:M.plaster;buildingCount++;
      b.add(box(4.2,height,wide),wall,[x,height/2,z]);
      // Triangular street gables, steep tiled roofs and exposed timber infill.
      const rise=2.2+(n%3)*.25;
      if(!gables.has(rise))gables.set(rise,polygon([[0,0,-wide/2],[0,0,wide/2],[0,rise,0]]));
      b.add(gables.get(rise),wall,[front,height,z],[0,side===1?0:Math.PI,0]);
      const pitch=Math.atan2(rise,wide/2),slope=Math.hypot(rise,wide/2);
      for(const q of [-1,1])b.add(box(4.65,.13,slope+.3),M.roof,[x,height+rise/2,z+q*wide/4],[q*pitch,0,0]);
      b.add(box(.5,1.7,.48),M.stone,[x+side*.7,height+1.25,z+1.3]);
      for(const yy of [.25,2.22,height-.08])b.add(box(.15,.14,wide+.1),M.trim,[front-side*.045,yy,z]);
      if(n%3!==0){
        for(const zz of [-3.1,0,3.1])b.add(box(.13,height,.14),M.timber,[front-side*.08,height/2,z+zz]);
        for(let yy=2.25;yy<height;yy+=1.8)b.add(box(.14,.13,wide),M.timber,[front-side*.09,yy,z]);
        for(const q of [-1,1])b.add(box(.11,Math.hypot(1.45,1.4),.11),M.timber,[front-side*.1,3.075,z+q*2.2],[Math.atan2(-q*1.4,1.45),0,0]);
        for(const q of [-1,1])b.add(box(.12,Math.hypot(rise,3.3),.12),M.timber,[front-side*.11,height+rise/2,z+q*1.65],[Math.atan2(-q*3.3,rise),0,0]);
        b.add(box(.13,rise,.12),M.timber,[front-side*.11,height+rise/2,z]);
      }
      // Deep window recesses, paired shutters, mullions and stone sills.
      for(let yy=3.25;yy<height-.35;yy+=1.8)for(const zz of [-2.1,0,2.1]){
        b.add(box(.08,1.1,.83),M.window,[front-side*.055,yy,z+zz]);
        for(const q of [-1,1]){
          b.add(box(.1,1.2,.07),M.trim,[front-side*.11,yy,z+zz+q*.45]);
          b.add(box(.12,1.08,.29),M.shutter,[front-side*.16,yy,z+zz+q*.64],[0,q*.15,0]);
          for(let slat=0;slat<5;slat++)b.add(box(.13,.027,.26),M.timber,[front-side*.18,yy-.41+slat*.2,z+zz+q*.64]);
        }
        b.add(box(.13,.045,.86),M.trim,[front-side*.12,yy,z+zz]);
        b.add(box(.13,1.1,.04),M.trim,[front-side*.12,yy,z+zz]);
        b.add(box(.36,.12,1.04),M.trim,[front-side*.17,yy-.62,z+zz]);
      }
      // Arched stone doors with individual voussoirs and a leaded shop window.
      const door=z-1.55;
      b.add(box(.09,1.65,1.3),M.window,[front-side*.06,.9,door]);
      b.add(cylinder(.65,.09,24),M.window,[front-side*.06,1.7,door],[0,0,Math.PI/2]);
      for(let k=0;k<=8;k++){
        const a=Math.PI*k/8;
        b.add(box(.16,.2,.26),M.stone,[front-side*.17,1.68+Math.sin(a)*.75,door+Math.cos(a)*.75],[a-Math.PI/2,0,0]);
      }
      for(const q of [-1,1])b.add(box(.18,1.65,.17),M.stone,[front-side*.14,.85,door+q*.75]);
      b.add(box(.12,.045,1.18),M.timber,[front-side*.14,1.55,door]);
      for(const q of [-1,0,1])b.add(box(.13,1.6,.035),M.shutter,[front-side*.15,.85,door+q*.3]);
      b.add(box(.08,1.35,1.45),M.window,[front-side*.07,1.08,z+1.5]);
      for(const q of [-1,0,1])b.add(box(.13,1.4,.045),M.trim,[front-side*.13,1.08,z+1.5+q*.5]);
      b.add(box(.14,.06,1.6),M.trim,[front-side*.13,1.1,z+1.5]);
      if(n%2===0){
        b.add(box(.85,.045,.05),M.metal,[front-side*.42,2.8,z+.3]);
        b.add(box(.065,.65,.6),M.sign,[front-side*.78,2.42,z+.3]);
        b.add(torus(.2,.025),M.timber,[front-side*.82,2.42,z+.3],[0,Math.PI/2,0]);
        b.add(box(.5,.045,.045),M.metal,[front-side*.25,3.2,z+2.9]);
        b.add(box(.29,.42,.29),M.metal,[front-side*.49,2.95,z+2.9]);
        b.add(box(.3,.26,.2),M.trim,[front-side*.49,2.96,z+2.9]);
        b.add(cylinder(.23,.22,4,0),M.metal,[front-side*.49,3.27,z+2.9],[0,Math.PI/4,0]);
      }
      if(circuit){
        for(let k=0;k<5;k++)b.add(box(.48,.055,1.34),k%2?M.trim:M.shutter,[side*(half-.28),.055,z-2.8+k*1.35]);
        if(n%3===0)for(let k=0;k<4;k++)for(let row=0;row<2;row++)b.add(torus(.3,.105),M.metal,[side*(half+.4),.32+row*.35,z-1.4+k*.64],[Math.PI/2,0,0]);
      }
    }
  }
  for(let row=0;row<240;row++)for(let col=0;col<(circuit?13:7);col++){
    const x=(col-(circuit?6:3))*.8+(row%2)*.4,z=-42+row*.9;
    if(Math.abs(x)<half-.2&&motion.rand(row*17+col,5)>.65)b.add(box(.69,.012,.08),M.pave,[x,.022,z]);
  }
  b.add(box(3.1,16,3.1),M.shutter,[-half-3.2,8,105]);
  for(const y of [10,13,15.8])b.add(box(3.4,.2,3.4),M.trim,[-half-3.2,y,105]);
  b.add(cylinder(2.7,5,4,0),M.roof,[-half-3.2,18.4,105],[0,Math.PI/4,0]);
  b.add(cylinder(.88,.08,32),M.trim,[-half-3.2,13.4,103.4],[Math.PI/2,0,0]);
  b.add(box(.05,.65,.1),M.metal,[-half-3.2,13.55,103.34]);
  b.add(box(.5,.05,.1),M.metal,[-half-3.05,13.4,103.34]);
  if(!circuit){
    b.add(box(half*2+2.3,1.15,2.8),M.stone,[0,7.2,80]);
    b.add(box(half*2+2.5,.17,3),M.trim,[0,7.83,80]);
    for(let x=-half;x<=half;x+=.48)b.add(box(.07,.7,.08),M.timber,[x,8.2,78.6]);
  }
  if(circuit)for(const z of [34,113]){
    for(const side of [-1,1])b.add(box(.1,5.2,.1),M.metal,[side*(half-.1),2.6,z]);
    b.add(box(half*2,.08,.08),M.metal,[0,5.2,z]);
    for(let row=0;row<2;row++)for(let col=0;col<24;col++)b.add(box(.5,.42,.045),(row+col)%2?M.trim:M.metal,[-5.75+col*.5,4.4+row*.42,z]);
  }
  b.finish();root.userData={buildingCount,streetHalfWidth:half,architecture:'steep gables / half timber / stone arches / shutters / clock tower',circuit};
  return {root,materials:M};
}
