import { T, box, cylinder, sphere, torus, tube, batch, mesh, toon } from './home-motor-geometry.mjs?rev=20261024-pop-city';
import { motion } from './home-motor-motion.mjs?rev=20261024-pop-city';
export const POP_COLORS={cyan:'#00d9ff',pink:'#ff278f',yellow:'#ffe600',blue:'#2345f5',coral:'#ff5b36',lime:'#98ef16',cream:'#fff1c9',ink:'#17132c',purple:'#4d269d'};
export function popPalette(index,source=POP_COLORS){
  const c={...POP_COLORS,...source};
  return [
    {sky:c.cyan,walls:[c.pink,c.yellow,c.cyan],roof:c.blue,road:c.purple,pave:c.yellow,trim:c.cream,accent:c.lime,ink:c.ink},
    {sky:c.pink,walls:[c.cyan,c.yellow,c.coral],roof:c.blue,road:c.blue,pave:c.cream,trim:c.yellow,accent:c.cyan,ink:c.ink},
    {sky:c.yellow,walls:[c.blue,c.pink,c.cyan],roof:c.coral,road:c.purple,pave:c.cyan,trim:c.cream,accent:c.lime,ink:c.ink},
    {sky:c.coral,walls:[c.yellow,c.cyan,c.pink],roof:c.blue,road:c.blue,pave:c.pink,trim:c.cream,accent:c.yellow,ink:c.ink},
  ][((index%4)+4)%4];
}
function mansard(){
  const p=[[-2.9,0,-4.6],[2.9,0,-4.6],[2.9,0,4.6],[-2.9,0,4.6],[-1.8,2,-3.8],[1.8,2,-3.8],[1.8,2,3.8],[-1.8,2,3.8]];
  const ids=[0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0,4,7,6,4,6,5];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.flat(),3));g.setIndex(ids);g.computeVertexNormals();return g;
}
export function createMotorCity(){
  const root=new T.Group();root.name='European-pop-boulevard';
  const M={walls:[toon('#ff278f'),toon('#ffe600'),toon('#fff1c9')],roof:toon('#2345f5'),pave:toon('#ffe600'),
    road:toon('#4d269d'),trim:toon('#fff1c9'),ink:toon('#17132c'),window:toon('#203359'),accent:toon('#98ef16'),
    white:toon('#fff1c9'),pink:toon('#ff278f'),water:toon('#00d9ff'),lamp:new T.MeshBasicMaterial({color:'#ffe600'})};
  let buildingCount=0;
  const b=batch(root),roofGeo=mansard(),floor=new T.Mesh(box(70,.16,410),M.pave);floor.position.set(0,-.13,120);floor.receiveShadow=true;root.add(floor);
  b.add(box(13,.08,410),M.road,[0,-.025,120]);
  for(const side of [-1,1]){
    b.add(box(.18,.17,410),M.trim,[side*6.6,.035,120]);
    for(let z=-70;z<310;z+=3.7){
      b.add(box(.08,.007,.8),M.trim,[side*5.9,.026,z]);
      if(Math.floor(z/3.7)%2===0)b.add(box(.12,.007,1.4),M.trim,[0,.026,z]);
    }
    for(let n=0;n<32;n++){
      const z=-65+n*11;if(side===-1&&z>68&&z<101)continue;
      buildingCount++;
      const levels=3+Math.floor(motion.rand(n,side+8)*3),height=2.2+levels*1.8,x=side*11.25,front=side*8.31;
      const wall=M.walls[(n+(side===1?1:0))%3];
      b.add(box(5.8,height,10.2),wall,[x,height/2,z]);
      b.add(roofGeo,M.roof,[x,height,z]);
      // Layered stone cornices and pilasters, rather than generic box towers.
      for(const y of [.18,2.35,height-.18,height+.05])b.add(box(.24,.15,10.7),M.trim,[front-side*.06,y,z]);
      for(const zz of [-4.95,4.95])b.add(box(.16,height,.17),M.trim,[front-side*.055,height/2,z+zz]);
      for(let row=0;row<levels;row++){
        const y=3.15+row*1.8;
        b.add(box(.16,.1,10.35),M.trim,[front-side*.04,y-.8,z]);
        for(let col=0;col<4;col++){
          const zz=z-3.8+col*2.5;
          b.add(box(.07,1.17,.91),M.trim,[front-side*.08,y,zz]);
          b.add(box(.08,1.04,.73),M.window,[front-side*.13,y,zz]);
          b.add(box(.09,1.05,.035),M.trim,[front-side*.19,y,zz]);
          b.add(box(.09,.035,.75),M.trim,[front-side*.19,y+.07,zz]);
          b.add(box(.55,.09,1.14),M.trim,[front-side*.24,y-.64,zz]);
          if(row===0||row===levels-1||n%3===0){
            // Continuous little wrought-iron balcony rails, six vertical balusters.
            for(let bar=0;bar<6;bar++)b.add(box(.035,.39,.025),M.ink,[front-side*.49,y-.42,zz-.47+bar*.19]);
            for(const yy of [y-.21,y-.56])b.add(box(.035,.025,1.04),M.ink,[front-side*.49,yy,zz]);
          }
        }
      }
      for(let col=0;col<3;col++){
        const zz=z-3.35+col*3.35;
        b.add(box(.09,1.68,1.14),M.window,[front-side*.09,.95,zz]);
        b.add(torus(.62,.065,Math.PI),M.trim,[front-side*.15,1.75,zz],[0,Math.PI/2,0]);
        for(const q of [-1,1])b.add(box(.14,1.7,.1),M.trim,[front-side*.13,.92,zz+q*.61]);
        b.add(box(.13,.035,1.15),M.trim,[front-side*.14,.98,zz]);
        b.add(box(.13,1.45,.025),M.trim,[front-side*.14,.87,zz]);
        if((n+col)%3===0){
          for(let stripe=0;stripe<7;stripe++)b.add(box(1.04,.075,.21),stripe%2?M.white:M.pink,[front-side*.56,2.12,zz-.64+stripe*.21],[0,0,-side*.23]);
          b.add(box(.08,.21,1.5),M.pink,[front-side*1.03,1.91,zz]);
        }
      }
      // Dormers punctuate the steep mansard, with chimney stacks on top.
      for(const zz of [-3.1,0,3.1]){
        b.add(box(.75,.97,.85),M.trim,[front+side*.48,height+.62,z+zz]);
        b.add(box(.08,.67,.54),M.window,[front+side*.08,height+.61,z+zz]);
        b.add(box(.98,.13,1.05),M.roof,[front+side*.4,height+1.15,z+zz]);
      }
      b.add(box(.45,2,.6),M.trim,[x+side*.9,height+1.5,z+2.4]);
    }
    const arm=tube([[0,0,0],[0,3.55,0],[-side*.15,3.95,0],[-side*.76,4.05,0],[-side*.88,3.7,0]],.035);
    for(let z=-55;z<290;z+=17){
      b.add(arm,M.ink,[side*7.2,0,z]);b.add(cylinder(.14,.26),M.ink,[side*7.2,.13,z]);
      b.add(box(.34,.46,.34),M.ink,[side*6.33,3.5,z]);b.add(box(.23,.3,.23),M.lamp,[side*6.33,3.5,z]);
      b.add(cylinder(.24,.23,4,0),M.ink,[side*6.33,3.84,z],[0,Math.PI/4,0]);
    }
    for(let z=-44;z<290;z+=26){
      b.add(cylinder(.11,2.6,9),M.ink,[side*7.35,1.3,z]);
      for(let k=0;k<4;k++)b.add(sphere(.85),M.accent,[side*(7.35+Math.sin(k*2.1)*.4),2.9+k*.15,z+Math.cos(k*2.1)*.44],[0,0,0],[1.1,.95,1.2]);
    }
  }
  // A small European square: fountain, paving medallion, clock tower and roof spire.
  b.add(cylinder(5,.08,48),M.trim,[-13,.025,83]);
  b.add(cylinder(2.2,.35,48),M.ink,[-13,.21,83]);
  b.add(cylinder(1.98,.15,48),M.water,[-13,.42,83]);
  b.add(torus(2.11,.11),M.trim,[-13,.44,83],[Math.PI/2,0,0]);
  b.add(cylinder(.24,2.2,18),M.trim,[-13,1.2,83]);
  b.add(cylinder(1.02,.19,36),M.trim,[-13,1.9,83]);b.add(sphere(.3),M.water,[-13,2.55,83]);
  b.add(box(3.5,16,3.5),M.walls[0],[-21,8,87]);
  for(const y of [1,11.5,14.5,16])b.add(box(3.85,.2,3.85),M.trim,[-21,y,87]);
  b.add(cylinder(3,4,4,0),M.roof,[-21,18,87],[0,Math.PI/4,0]);
  b.add(cylinder(.09,2,8),M.ink,[-21,20.4,87]);
  b.add(cylinder(1.04,.05,40),M.lamp,[-19.22,13,87],[0,0,Math.PI/2]);
  b.add(box(.07,.75,.045),M.ink,[-19.18,13.27,87],[Math.PI*.12,0,0]);
  b.add(box(.07,.035,.57),M.ink,[-19.18,13,87.2]);
  b.finish();root.userData={buildingCount,windows:'arched / sash',architecture:'mansard / cornice / balcony / cafe / streetlamp / fountain'};
  return {root,materials:M,apply(p){
    M.walls.forEach((m,i)=>m.color.set(p.walls[i]));M.roof.color.set(p.roof);M.road.color.set(p.road);M.pave.color.set(p.pave);M.trim.color.set(p.trim);M.accent.color.set(p.accent);M.pink.color.set(p.walls[0]);
  }};
}
