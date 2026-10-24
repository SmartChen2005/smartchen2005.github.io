// Spatial linework in the museum entry's moving-camera language. No model downloads.
// Local axes: x across the car, y up, z towards its nose.
const TAU = Math.PI * 2;
const clamp = t => Math.max(0, Math.min(1, t));
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const blend = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = a => a.map(v => v / (Math.hypot(...a) || 1));
const curve = (fn, count = 24) => Array.from({ length: count + 1 }, (_, i) => fn(i / count));

function carModel(kind) {
  const mini = kind === 'mini', lines = [], faces = [];
  const line = (points, weight = 1, detail = false) => lines.push({ points, weight, detail });
  const face = points => faces.push(points);
  const ellipse = (center,u,v,r1,r2,weight=1) => line(curve(t => center.map((n,i) => n+Math.cos(t*TAU)*u[i]*r1+Math.sin(t*TAU)*v[i]*r2),28),weight);
  // The MINI's upright hatch contrasts with the Z4's long, low bonnet.
  const sections = mini ? [
    [-1.91,.66,.66],[-1.62,.85,.94],[-.95,.88,1.04],[.35,.86,1.01],[1.35,.84,.91],[1.91,.68,.68],
  ] : [
    [-2.04,.68,.65],[-1.6,.87,.88],[-.85,.88,.92],[.25,.84,.85],[1.5,.85,.77],[2.05,.69,.58],
  ];
  for (let i=0;i<sections.length-1;i++) {
    const [z,a,y]=sections[i], [zz,b,yy]=sections[i+1];
    // The roadster's cockpit remains open, including from above.
    if(mini || i!==1 && i!==2) face([[-a,y,z],[a,y,z],[b,yy,zz],[-b,yy,zz]]);
    for(const s of [-1,1]) face([[s*a,.38,z],[s*a,y,z],[s*b,yy,zz],[s*b,.38,zz]]);
  }
  for(const s of [-1,1]) {
    line(sections.map(([z,x,y])=>[s*x,y,z]),1.35);
    line(sections.map(([z,x])=>[s*x,.38,z]),.65);
    for(const z of mini?[-1.25,1.22]:[-1.28,1.23]) {
      line(curve(t=>[s*.89,.4+Math.sin(t*Math.PI)*.4,z+Math.cos(t*Math.PI)*.43],18),.85);
    }
    line(mini?[[s*.89,.93,.28],[s*.9,.48,.23],[s*.9,.46,-.92]]:[[s*.87,.87,.04],[s*.9,.46,-.18],[s*.9,.45,-1.05]],.65,true);
    line([[s*.875,.85,mini?-.3:-.65],[s*.88,.85,mini?-.48:-.82]],1,true);
    line([[s*.77,1.08,.35],[s*1.03,1.06,.26],[s*1.04,.97,.13],[s*.85,.98,.15]],.8);
    if(!mini) line([[s*.88,.86,1.02],[s*.89,.61,.18],[s*.89,.52,-.95]],.7,true);
  }
  for(const index of [0,sections.length-1]) {
    const [z,x,y]=sections[index];
    face([[-x,.38,z],[x,.38,z],[x,y,z],[-x,y,z]]);
    line([[-x,.38,z],[-x,y,z],[x,y,z],[x,.38,z]],1.1);
  }
  if(mini) {
    const roof=[[-.69,1.47,-1.28],[.69,1.47,-1.28],[.68,1.49,.24],[-.68,1.49,.24]];
    face(roof);line([...roof,roof[0]],1.45);
    const wind=[[-.68,1.49,.24],[.68,1.49,.24],[.76,1.02,.73],[-.76,1.02,.73]];
    face(wind);line([...wind,wind[0]],1.1);
    const rear=[[-.69,1.47,-1.28],[.69,1.47,-1.28],[.77,.98,-1.69],[-.77,.98,-1.69]];
    face(rear);line([...rear,rear[0]],1);
    for(const s of [-1,1]) {
      const glass=[[s*.69,1.43,-1.24],[s*.68,1.45,.2],[s*.78,1.03,.64],[s*.82,1.01,-1.52]];
      face(glass);line([...glass,glass[0]],1);
      line([[s*.73,1.45,-.68],[s*.82,1.01,-.8]],.85);
      ellipse([s*.52,.85,1.78],[1,0,-s*.22],[0,.94,-.32],.205,.245,1.3);
      // Upright tail lights, central twin exhaust and a Cooper S hood scoop.
      line([[s*.58,.94,-1.72],[s*.73,.91,-1.68],[s*.73,.67,-1.86],[s*.58,.67,-1.88],[s*.58,.94,-1.72]],.85);
      ellipse([s*.10,.35,-1.94],[1,0,0],[0,1,0],.07,.055,.9);
      line([[s*.2,1.025,.81],[s*.2,.88,1.57]],.65,true);
    }
    line([[-.28,.98,1.14],[-.25,1.02,1.05],[.25,1.02,1.05],[.28,.98,1.14],[-.28,.98,1.14]],.9);
    line([[-.48,.62,1.94],[-.38,.79,1.86],[.38,.79,1.86],[.48,.62,1.94],[.36,.49,1.96],[-.36,.49,1.96],[-.48,.62,1.94]],1.2);
  } else {
    // Windscreen, two bucket seats and separate roll hoops; no roof geometry.
    const wind=[[-.74,.88,.36],[.74,.88,.36],[.66,1.25,-.04],[-.66,1.25,-.04]];
    face(wind);line([...wind,wind[0]],1.2);
    line([[-.82,.93,-1.22],[-.82,.9,.22],[.82,.9,.22],[.82,.93,-1.22],[-.82,.93,-1.22]],.9);
    for(const s of [-1,1]) {
      const x=s*.38;
      const seat=[[x-.19,.76,-.96],[x-.18,1.1,-.92],[x+.18,1.1,-.92],[x+.19,.76,-.96]];
      face(seat);line([...seat,seat[0]],.8);
      line(curve(t=>[x+Math.cos(Math.PI*t)*.23,.94+Math.sin(Math.PI*t)*.34,-1.2],16),1.2);
      // Twin kidney grilles and swept double headlamp housings.
      line([[s*.065,.69,2.055],[s*.27,.72,2.04],[s*.3,.52,2.07],[s*.08,.5,2.08],[s*.065,.69,2.055]],1.1);
      line([[s*.36,.75,1.96],[s*.72,.77,1.78],[s*.77,.65,1.85],[s*.39,.64,2.01],[s*.36,.75,1.96]],1);
      line([[s*.35,.84,.5],[s*.38,.8,1.53]],.65,true);
      line([[s*.4,.82,-1.97],[s*.72,.8,-1.89],[s*.74,.68,-1.96],[s*.43,.69,-2.04]],.9);
    }
    ellipse([-.39,.83,-.36],[1,0,0],[0,.65,.7],.18,.18,.65);
  }
  return { kind,lines,faces,wheels:(mini?[-1.25,1.22]:[-1.28,1.23]).flatMap(z=>[-1,1].map(s=>({x:s*.88,y:.38,z,side:s}))) };
}

export const MOTOR_CARS=[carModel('mini'),carModel('z4')];
const nodes=[[-28,-36],[14,-39],[34,-14],[18,10],[25,36],[-15,40],[-34,12],[-20,-10]];
function circuit(t) {
  t=((t%1)+1)%1*nodes.length;
  const i=Math.floor(t),u=t-i,p=[-1,0,1,2].map(n=>nodes[(i+n+nodes.length)%nodes.length]);
  return [0,1].map(k=>.5*(2*p[1][k]+(-p[0][k]+p[2][k])*u+(2*p[0][k]-5*p[1][k]+4*p[2][k]-p[3][k])*u*u+(-p[0][k]+3*p[1][k]-3*p[2][k]+p[3][k])*u*u*u));
}
export function racePosition(distance,lane=0) {
  const t=distance/265,[x,z]=circuit(t),next=circuit(t+.0001),prev=circuit(t-.0001);
  const forward=unit([next[0]-prev[0],0,next[1]-prev[1]]);
  return { point:[x+forward[2]*lane,0,z-forward[0]*lane],forward,t };
}
function transform(point,pose) {
  const [x,y,z]=point,f=pose.forward,p=pose.point;
  return [p[0]+x*f[2]+z*f[0],p[1]+y,p[2]-x*f[0]+z*f[2]];
}
export function raceCamera(t,input=.5) {
  const shots=[[8,4.6,12],[13,3.2,.8],[1.5,21,5.5],[-6,4,-12],[8,5,12]],cuts=[2.4,4.5,6.65,7.7];
  let camera=shots[0];
  for(let i=0;i<cuts.length;i++) camera=blend(camera,shots[i+1],ease((t-cuts[i])/.5));
  return [camera[0]+(input-.5)*.6,camera[1],camera[2]];
}

export function drawMotorRace(ctx,frame,width,height,band,palette,input=.5) {
  const {paper,black}=palette;
  const upper={y:0,height:Math.max(0,band.top)},lower={y:band.bottom,height:Math.max(0,height-band.bottom)};
  // Subpixel sentence measurement must not swap the scene above/below the text.
  const field=upper.height+16>=lower.height?upper:lower,instruments=field===upper?lower:upper;
  ctx.clearRect(0,0,width,height);ctx.fillStyle=black;ctx.fillRect(0,0,width,height);
  if(field.height<42)return;
  ctx.save();ctx.beginPath();ctx.rect(0,field.y,width,field.height);ctx.clip();
  const center=racePosition(frame.distance),camera=transform(raceCamera(frame.t,input),center),target=transform([0,.55,0],center);
  const forward=unit(sub(target,camera)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward);
  const focal=Math.min(width*(width<650?1.45:1.12),field.height*2.5);
  const project=point=>{
    const d=sub(point,camera),depth=dot(d,forward);
    return depth<.8?null:{x:width*.5+dot(d,right)*focal/depth,y:field.y+field.height*.54-dot(d,up)*focal/depth,depth};
  };
  const stroke=(points,weight=1,alpha=1,reveal=1)=>{
    ctx.strokeStyle=paper;ctx.lineWidth=weight;ctx.globalAlpha=alpha;ctx.beginPath();let pen=false;
    for(let i=0;i<Math.max(0,Math.ceil(points.length*reveal));i++){
      const p=project(points[i]);if(!p){pen=false;continue;}
      if(pen)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);pen=true;
    }
    ctx.stroke();
  };
  for(const lane of [-5.4,5.4,-4.9,4.9]) stroke(curve(u=>racePosition(frame.distance-35+u*100,lane).point,110),Math.abs(lane)===5.4?1:.55,Math.abs(lane)===5.4?.48:.2,frame.reveal);
  const marker=Math.floor(frame.distance/3)*3;
  for(let n=-10;n<25;n++) {
    const d=marker+n*3;
    for(const lane of [-5.15,5.15]) stroke([racePosition(d,lane-.2).point,racePosition(d,lane+.2).point,racePosition(d+1.15,lane+.2).point],.7,.3*frame.reveal);
    if(n%2===0)stroke([racePosition(d,0).point,racePosition(d+1.2,0).point],.7,.15*frame.reveal);
  }
  const poses=[racePosition(frame.distance+frame.gap,-1.35),racePosition(frame.distance-frame.gap,1.35)],primitives=[];
  const add=(points,face=false,weight=1,detail=false)=>{
    const projected=points.map(project);if(projected.some(p=>!p))return;
    primitives.push({points,projected,face,weight,detail,depth:projected.reduce((s,p)=>s+p.depth,0)/projected.length});
  };
  MOTOR_CARS.forEach((model,index)=>{
    const map=point=>transform(point,poses[index]);
    model.faces.forEach(points=>add(points.map(map),true));
    model.lines.forEach(line=>add(line.points.map(map),false,line.weight,line.detail));
    for(const wheel of model.wheels){
      const ring=curve(t=>[wheel.x+wheel.side*.07,wheel.y+Math.sin(t*TAU)*.32,wheel.z+Math.cos(t*TAU)*.32],26);
      add(ring.map(map),true);add(ring.map(map),false,1.25);
      add(curve(t=>[wheel.x+wheel.side*.075,wheel.y+Math.sin(t*TAU)*.23,wheel.z+Math.cos(t*TAU)*.23],24).map(map),false,.65);
      for(let s=0;s<5;s++){
        const a=s*TAU/5+frame.distance*2.8;
        add([[wheel.x+wheel.side*.08,wheel.y,wheel.z],[wheel.x+wheel.side*.08,wheel.y+Math.sin(a)*.23,wheel.z+Math.cos(a)*.23]].map(map),false,.6);
      }
    }
  });
  // A small projected depth test preserves continuous outlines on curved bodywork.
  // Sorting whole polylines by their centre would erase half a headlight or window.
  const triangles=[];
  for(const item of primitives.filter(item=>item.face)){
    const p=item.projected;
    ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();
    ctx.fillStyle=black;ctx.globalAlpha=frame.reveal;ctx.fill();
    for(let i=1;i<p.length-1;i++){
      const a=p[0],b=p[i],c=p[i+1],den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
      if(Math.abs(den)<.001)continue;
      triangles.push({a,b,c,den,left:Math.min(a.x,b.x,c.x),right:Math.max(a.x,b.x,c.x),top:Math.min(a.y,b.y,c.y),bottom:Math.max(a.y,b.y,c.y)});
    }
  }
  const visible=(x,y,depth)=>!triangles.some(({a,b,c,den,left,right,top,bottom})=>{
    if(x<left||x>right||y<top||y>bottom)return false;
    const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den;
    const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,w=1-u-v;
    return u>=0&&v>=0&&w>=0&&1/(u/a.depth+v/b.depth+w/c.depth)<depth-.045;
  });
  for(const item of primitives.filter(item=>!item.face)){
    ctx.strokeStyle=paper;ctx.lineWidth=item.weight;ctx.globalAlpha=item.detail?.6:.96;
    ctx.beginPath();let pen=false;
    const points=item.projected,count=Math.ceil((points.length-1)*frame.reveal);
    for(let i=0;i<count;i++){
      const a=points[i],b=points[i+1],steps=Math.max(1,Math.min(30,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3)));
      for(let n=0;n<=steps;n++){
        const u=n/steps,x=mix(a.x,b.x,u),y=mix(a.y,b.y,u),depth=1/mix(1/a.depth,1/b.depth,u);
        if(visible(x,y,depth)){if(pen)ctx.lineTo(x,y);else ctx.moveTo(x,y);pen=true;}else pen=false;
      }
    }
    ctx.stroke();
  }
  ctx.restore();
  const text=(value,x,y,size=10,alpha=.55)=>{
    ctx.fillStyle=paper;ctx.globalAlpha=alpha;ctx.font=`${size}px "Helvetica Neue", Arial, sans-serif`;ctx.fillText(value,x,y);
  };
  const gutter=Math.max(20,Math.min(60,width*.045));
  if(field.height>120){
    text('MINI COOPER S  /  F56',gutter,field.y+28,9,.55*frame.reveal);
    ctx.textAlign='right';text('BMW Z4 ROADSTER  /  E85',width-gutter,field.y+28,9,.55*frame.reveal);ctx.textAlign='left';
  }
  if(instruments.height>70){
    ctx.save();ctx.beginPath();ctx.rect(0,instruments.y,width,instruments.height);ctx.clip();
    const r=Math.min(instruments.height*.35,width*.15,108),cx=gutter+r,cy=instruments.y+instruments.height*.55;
    const start=Math.PI*.8,sweep=Math.PI*1.4;
    ctx.strokeStyle=paper;ctx.globalAlpha=.35*frame.reveal;ctx.lineWidth=.7;
    ctx.beginPath();ctx.arc(cx,cy,r,start,start+sweep);ctx.stroke();
    for(let n=0;n<=32;n++){
      const a=start+sweep*n/32,major=n%4===0,inner=r-(major?9:4);
      ctx.globalAlpha=(n>=28?.8:.4)*frame.reveal;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();
      if(major){ctx.textAlign='center';text(String(n/4),cx+Math.cos(a)*(r+13),cy+Math.sin(a)*(r+13)+3,8,.45*frame.reveal);}
    }
    const a=start+sweep*Math.min(frame.rpm/8000,1);
    ctx.globalAlpha=.95*frame.reveal;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cx-Math.cos(a)*7,cy-Math.sin(a)*7);ctx.lineTo(cx+Math.cos(a)*(r-15),cy+Math.sin(a)*(r-15));ctx.stroke();
    ctx.textAlign='center';text(String(frame.gear).padStart(2,'0'),cx,cy+r*.65,Math.max(14,r*.24),.8*frame.reveal);text('RPM × 1000',cx,cy+r*.87,8,.4*frame.reveal);ctx.textAlign='left';
    const mapWidth=Math.min(width*.27,instruments.height*.78,185),mapX=width-gutter-mapWidth,mapY=instruments.y+(instruments.height-mapWidth)*.5;
    const mapPoint=p=>[mapX+(p[0]+40)/80*mapWidth,mapY+(p[2]+45)/90*mapWidth];
    for(const lane of [-3,3]){
      ctx.beginPath();curve(u=>racePosition(u*265,lane).point,100).forEach((p,i)=>{const [x,y]=mapPoint(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      ctx.strokeStyle=paper;ctx.lineWidth=.65;ctx.globalAlpha=.28*frame.reveal;ctx.stroke();
    }
    poses.forEach((pose,i)=>{
      const [x,y]=mapPoint(pose.point);ctx.globalAlpha=frame.reveal;ctx.beginPath();ctx.arc(x,y,i===0?2.7:2.2,0,TAU);
      if(i===0){ctx.fillStyle=paper;ctx.fill();}else{ctx.lineWidth=1;ctx.stroke();}
    });
    if(width>650){text('F56',mapX,mapY+mapWidth+15,8,.5*frame.reveal);ctx.textAlign='right';text('E85',mapX+mapWidth,mapY+mapWidth+15,8,.5*frame.reveal);ctx.textAlign='left';}
    const finish=ease((frame.t-6.85)/.65),flagW=Math.min(width*.17,110),flagH=flagW*.62;
    if(finish>0){
      const x=width*.5-flagW*.5,y=instruments.y+instruments.height*.48-flagH*.5,wave=(1-frame.settling)*.1;
      const flagPoint=(u,v)=>[x+u*flagW,y+v*flagH+Math.sin(u*TAU-frame.t*5)*flagH*wave*u];
      ctx.globalAlpha=.65*finish;ctx.lineWidth=.75;ctx.strokeStyle=paper;ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x,y+flagH+17);ctx.stroke();
      for(let row=0;row<4;row++)for(let col=0;col<7;col++){
        const points=[flagPoint(col/7,row/4),flagPoint((col+1)/7,row/4),flagPoint((col+1)/7,(row+1)/4),flagPoint(col/7,(row+1)/4)];
        ctx.beginPath();points.forEach(([xx,yy],i)=>i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy));ctx.closePath();
        if((row+col)%2===0){ctx.fillStyle=paper;ctx.fill();}else ctx.stroke();
      }
    }
    ctx.restore();
  }
  ctx.globalAlpha=1;
}
