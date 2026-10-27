import { T, box, cylinder, torus, sphere, batch } from './home-motor-geometry.mjs?rev=20261025-cosmic';
const PI=Math.PI,TAU=PI*2,cache=new Map();
const cached=(key,make)=>{if(!cache.has(key))cache.set(key,make());return cache.get(key);};
function profile(w,h,pointed){
  const s=new T.Shape(),r=w/2,spring=h-(pointed?Math.sqrt(3)*r:r);
  s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,spring);
  if(pointed){s.absarc(-r,spring,w,0,PI/3,false);s.absarc(r,spring,w,2*PI/3,PI,false);}
  else s.absarc(0,spring,r,0,PI,false);
  s.lineTo(-r,0);return s;
}
function arch(w,h,pointed,frame=0){
  return cached(`arch:${w}:${h}:${pointed}:${frame}`,()=>{
    const shape=profile(w,h,pointed);
    if(frame){const points=profile(w-frame*2,h-frame*2,pointed).getPoints(18).map(p=>new T.Vector2(p.x,p.y+frame));shape.holes.push(new T.Path(points.reverse()));}
    const g=new T.ExtrudeGeometry(shape,{depth:frame?.12:.035,bevelEnabled:false,curveSegments:12});
    g.name=pointed?'gothic-pointed-arch':'renaissance-round-arch';return g;
  });
}
function triangle(w,h){return cached(`pediment:${w}:${h}`,()=>{const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.closePath();return new T.ExtrudeGeometry(s,{depth:.14,bevelEnabled:false});});}
function rosePetal(r){return cached(`rose:${r}`,()=>{const g=torus(r,.028).clone();g.name='gothic-rose-tracery';return g;});}
function dome(r){return cached(`dome:${r}`,()=>{const g=new T.SphereGeometry(r,28,14,0,TAU,0,PI/2);g.name='renaissance-ribbed-dome';return g;});}
function domeRib(r){return cached(`rib:${r}`,()=>{const p=[];for(let i=0;i<=20;i++){const a=i/20*PI/2;p.push(new T.Vector3(r*Math.cos(a),r*Math.sin(a),0));}return new T.TubeGeometry(new T.CatmullRomCurve3(p),24,.028,5,false);});}

export function createStreetArchitecture(half,M,{circuit=false,blocks=30}={}){
  const root=new T.Group();root.name='gothic-renaissance-street-architecture';const b=batch(root),facades=[];
  let churchCount=0,roseWindows=0;
  function facade(side,front,z){
    const rot=[0,-side*PI/2,0];
    const at=(d,y,u=0)=>[front+side*d,y,z+u];
    const solid=(w,h,d,y,u=0,projection=0,mat=M.stone)=>b.add(box(d,h,w),mat,at(projection+d/2,y+h/2,u));
    const face=(geo,mat,bottom,u=0,projection=-.12)=>b.add(geo,mat,at(projection,bottom,u),rot);
    function archWindow(w,h,y,u=0,pointed=true,t=.1){
      face(arch(w,h,pointed),M.window,y,u,-.16);face(arch(w+.2,h+.16,pointed,t),M.trim,y-.04,u,-.23);
      b.add(box(.35,.13,w+.42),M.trim,at(-.18,y-.05,u));
      // Mullions and transoms are physical stone, visible in both ink and contour shots.
      b.add(box(.13,h*.68,.055),M.trim,at(-.26,y+h*.34,u));
      b.add(box(.12,.045,w*.88),M.trim,at(-.26,y+h*.43,u));
    }
    function column(y,h,u,r=.12){
      b.add(cylinder(r,h,14),M.trim,at(-.34,y+h/2,u));
      for(const yy of [y,y+h]){b.add(box(.4,.14,r*3),M.trim,at(-.34,yy,u));b.add(cylinder(r*1.3,.1,14),M.stone,at(-.34,yy+.07,u));}
      for(const q of [-1,1])b.add(torus(r*.6,.019),M.trim,at(-.49,y+h+.07,u+q*r*.8),rot);
    }
    function pediment(w,rise,y,u=0){
      face(triangle(w,rise),M.stone,y,u,-.19);
      b.add(box(.4,.15,w+.18),M.trim,at(-.25,y,u));
      for(const q of [-1,1])b.add(box(.25,.12,Math.hypot(w/2,rise)),M.trim,at(-.27,y+rise/2,u+q*w/4),[q*Math.atan2(rise,w/2),0,0]);
    }
    function rose(r,y,u=0,petals=8){
      roseWindows++;
      b.add(cylinder(r,.045,40),M.window,at(-.07,y,u),[0,0,PI/2]);
      for(const rad of [r,r*.9])b.add(torus(rad,.07),M.trim,at(-.18,y,u),rot);
      for(let i=0;i<petals;i++){const a=i/petals*TAU;
        b.add(rosePetal(r*.25),M.trim,at(-.22,y+Math.sin(a)*r*.55,u+Math.cos(a)*r*.55),rot);
        b.add(box(.10,r*.58,.045),M.trim,at(-.19,y+Math.sin(a)*r*.49,u+Math.cos(a)*r*.49),[PI/2-a,0,0]);
      }
      b.add(torus(r*.19,.04),M.trim,at(-.25,y,u),rot);
    }
    function gable(w,base,rise,depth){
      face(triangle(w,rise),M.stone,base,0,-.08);
      b.add(triangle(w,rise),M.stone,at(depth,base),[0,side*PI/2,0]);
      const slope=Math.hypot(rise,w/2),pitch=Math.atan2(rise,w/2);
      for(const q of [-1,1])b.add(box(depth+.4,.16,slope+.24),M.roof,at(depth/2,base+rise/2,q*w/4),[q*pitch,0,0]);
    }
    function cross(y,u=0,d=.1){b.add(box(.11,.68,.11),M.trim,at(d,y,u));b.add(box(.11,.1,.43),M.trim,at(d,y+.08,u));}
    function spire(y,u,r=.32,h=1.5,d=-.1){
      b.add(cylinder(r,.2,8),M.trim,at(d,y,u));b.add(cylinder(r,h,8,0),M.roof,at(d,y+h/2+.1,u));
      b.add(sphere(.075),M.trim,at(d,y+h+.2,u));
    }
    function buttress(u,h){
      for(const [yy,hh,depth,width] of [[0,h*.4,.7,.52],[h*.4,h*.35,.52,.4],[h*.75,h*.25,.34,.28]])solid(width,hh,depth,yy,u,-depth,M.stone);
      for(const yy of [h*.4,h*.75,h])b.add(box(.65,.15,.66),M.trim,at(-.3,yy,u));
      spire(h+.15,u,.22,1.15,-.22);
    }
    function bellTower(u,h,w=2.05){
      solid(w,h,2.9,0,u,0,M.stone);
      for(const yy of [1,4.7,h-3.2,h])b.add(box(3.15,.19,w+.3),M.trim,at(1.4,yy,u));
      archWindow(w*.56,2.05,h-2.65,u,true,.12);
      for(const q of [-1,1]){solid(.24,h,.35,0,u+q*(w/2-.08),-.24,M.trim);spire(h+.1,u+q*(w/2-.03),.14,.85,-.16);}
      b.add(cylinder(w*.72,3.8,8,0),M.roof,at(1.4,h+1.9,u));
      cross(h+4.1,u,1.4);
    }
    return {at,solid,face,archWindow,column,pediment,rose,gable,cross,spire,buttress,bellTower,rot};
  }
  function cathedral(side,front,z,w){
    const f=facade(side,front,z),nave=w-4.6;
    f.solid(nave,10.3,8,0,0,0,M.stone);f.gable(nave,10.3,3.5,8);
    f.archWindow(2.5,4.75,.35,0,true,.16);
    for(const u of [-2.8,2.8])f.archWindow(.8,2.6,4.5,u,true);
    f.rose(1.37,7.95);f.cross(14.1);
    for(const q of [-1,1])f.bellTower(q*(w/2-1.25),12.8+(q===side?1.2:0),2.25);
    // A projecting pier and curved stone flyer connect the nave to each buttress.
    for(const q of [-1,1]){
      const u=q*(nave/2-.4);f.buttress(u,7.3);f.solid(.34,7.3,.27,0,u,-.78,M.stone);b.add(box(.4,.13,.45),M.trim,f.at(-.64,7.3,u));
      for(let i=0;i<8;i++){
        const a=i/8*PI/2,aa=(i+1)/8*PI/2,p=f.at(-.65*Math.sin(a),8.9-1.6*(1-Math.cos(a)),u),v=f.at(-.65*Math.sin(aa),8.9-1.6*(1-Math.cos(aa)),u);
        const start=new T.Vector3(...p),end=new T.Vector3(...v),delta=end.clone().sub(start),rot=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()));
        b.add(box(.14,delta.length()+.035,.19),M.trim,start.add(end).multiplyScalar(.5).toArray(),[rot.x,rot.y,rot.z]);
      }
    }
  }
  function gothic(side,front,z,w,chapel,height){
    const f=facade(side,front,z);f.solid(w,height,5.7,0,0,0,M.stone);f.gable(w,height,chapel?3.1:2.35,5.7);
    f.archWindow(chapel?1.8:1.35,chapel?3.5:2.65,.25,-.1,true,.12);
    if(chapel){f.rose(.95,6.1);for(const u of [-2.55,2.55]){f.buttress(u,height);f.archWindow(.68,2.5,3.2,u*.6,true);}f.cross(height+3.42);}
    else {for(const yy of [3.6,6.15])for(const u of [-2.05,0,2.05])f.archWindow(.88,1.9,yy,u,true,.085);for(const u of [-w/2+.15,w/2-.15])f.buttress(u,height-.2);f.spire(height+2.45,0,.18,1.05);}
    for(const yy of [3.2,height])b.add(box(.32,.16,w+.16),M.trim,f.at(-.16,yy));
  }
  function palazzo(side,front,z,w,height,variant){
    const f=facade(side,front,z);f.solid(w,height,5.9,0,0,0,M.plaster);
    // Deep rusticated ground storey, separated classical orders and projecting cornices.
    for(let row=0;row<7;row++)for(let k=0;k<4;k++)b.add(box(.15,.34,w/4-.04),row%2?M.stone:M.base,f.at(-.07,.23+row*.39,-w/2+w/8+k*w/4));
    for(const yy of [.12,2.95,5.75,height-.1,height+.15])b.add(box(yy>height-.3?.62:.38,.18,w+.3),M.trim,f.at(-.16,yy));
    for(const u of [-2.12,0,2.12])f.archWindow(1.43,2.5,.2,u,false,.11);
    for(const yy of [3.35,6.1])for(const [i,u] of [-2.12,0,2.12].entries()){
      const h=1.43;f.solid(1.02,h,.07,yy,u,-.17,M.window);
      for(const q of [-1,1])b.add(box(.25,h+.16,.1),M.trim,f.at(-.23,yy+h/2,u+q*.55));
      for(const y of [yy-.08,yy+h+.08])b.add(box(.37,.12,1.25),M.trim,f.at(-.22,y,u));
      if((i+variant)%2===0)f.pediment(1.4,.36,yy+h+.19,u);
      else {b.add(torus(.65,.06,PI),M.trim,f.at(-.24,yy+h+.17,u),f.rot);b.add(box(.37,.12,1.43),M.trim,f.at(-.24,yy+h+.17,u));}
    }
    for(const u of [-3.05,-1.06,1.06,3.05])for(const yy of [3.22,5.99])f.column(yy,2.28,u,.09);
    for(let i=0;i<13;i++){
      const u=-w/2+.22+i*(w-.44)/12;
      b.add(cylinder(.052,.55,8),M.trim,f.at(-.03,height+.57,u));b.add(sphere(.085),M.trim,f.at(-.03,height+.55,u));
    }
    b.add(box(.32,.12,w+.22),M.trim,f.at(-.03,height+.89));
    for(const u of [-w/2+.25,w/2-.25]){b.add(cylinder(.11,.32,12),M.stone,f.at(.1,height+1.1,u));b.add(sphere(.15),M.trim,f.at(.1,height+1.3,u));}
    // The low tiled roof sits behind the balustrade rather than becoming a timber gable.
    b.add(box(5.6,.18,w-.5),M.roof,f.at(3,height+.05));
  }
  function renaissanceChurch(side,front,z,w){
    const f=facade(side,front,z);f.solid(w,8.8,7.8,0,0,0,M.plaster);
    for(const yy of [.25,4.35,8.65])b.add(box(.62,.23,w+.25),M.trim,f.at(-.18,yy));
    f.archWindow(1.9,3.35,.35,0,false,.16);
    for(const u of [-2.35,2.35]){f.column(.45,3.55,u,.19);f.column(4.65,3.55,u,.16);}
    b.add(cylinder(.85,.06,36),M.window,f.at(-.17,6.3),[0,0,PI/2]);b.add(torus(.88,.09),M.trim,f.at(-.24,6.3),f.rot);
    f.pediment(w+.25,1.8,8.75);f.cross(10.88);
    const radius=2.3,center=f.at(4.25,10.05);
    b.add(cylinder(radius*.91,1.45,28),M.stone,[center[0],center[1]-.6,z]);
    for(const yy of [9.3,10.1])b.add(torus(radius*.95,.1),M.trim,[center[0],yy,z],[PI/2,0,0]);
    b.add(dome(radius),M.roof,center);
    for(let k=0;k<10;k++){
      const a=k/10*TAU;b.add(domeRib(radius+.02),M.trim,center,[0,a,0]);
      b.add(cylinder(.07,1.25,8),M.trim,[center[0]+Math.cos(a)*radius*.9,9.65,z+Math.sin(a)*radius*.9]);
    }
    b.add(cylinder(.36,.8,12),M.stone,[center[0],12.7,z]);b.add(cylinder(.45,.55,8,0),M.roof,[center[0],13.36,z]);f.cross(13.97,0,4.25);
  }
  for(const side of [-1,1])for(let n=0;n<blocks;n++){
    const landmark=side===1?(circuit?6:7):(circuit?3:4),span=n%10===landmark&&n<blocks-1?2:1;
    const width=7.15*span-.45,z=-43+n*7.15+(span-1)*3.575,front=side*(half+1.03),code=(n+(side===1?3:0)+(circuit?2:0))%8;
    let style,kind,height;
    if(span===2){style='Gothic';kind='cathedral';height=18.8;cathedral(side,front,z,width);churchCount++;}
    else if(code===0){style='Renaissance';kind='domed-church';height=14.4;renaissanceChurch(side,front,z,width);churchCount++;}
    else if(code===1){style='Gothic';kind='chapel';height=8.5;gothic(side,front,z,width,true,height);churchCount++;}
    else if(code===2||code===4||code===7){style='Gothic';kind='stone-hall';height=8.4+(n%2)*.5;gothic(side,front,z,width,false,height);}
    else {style='Renaissance';kind='palazzo';height=9.15+(n%2)*.45;palazzo(side,front,z,width,height,n%2);}
    facades.push({side,z,width,front,style,kind,height});n+=span-1;
  }
  b.finish();root.userData={facades,churchCount,roseWindows};return {root,facades,churchCount,roseWindows};
}
