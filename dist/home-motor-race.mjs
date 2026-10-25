import { MOTOR_CARS } from './home-motor-cars.mjs?rev=20261024-directors-cut';
import { drawGridTunnel, drawWarpStars, motion } from './home-motor-motion.mjs?rev=20261024-directors-cut';
export { MOTOR_CARS };
const TAU=Math.PI*2;
const clamp=t=>Math.max(0,Math.min(1,t));
const mix=(a,b,t)=>a+(b-a)*t;
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>a.map(v=>v/(Math.hypot(...a)||1));
const curve=(fn,n=40)=>Array.from({length:n+1},(_,i)=>fn(i/n));
const color=(a,b,t)=>{
  const rgb=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(v=>v+v).join('');const n=parseInt(h,16);return [n>>16&255,n>>8&255,n&255];};
  const x=rgb(a),y=rgb(b);return `rgb(${x.map((v,i)=>Math.round(mix(v,y[i],t))).join(',')})`;
};

// Editorial cuts, not interpolated camera keyframes. Reference photo order: 1,2,3,4,5.
export const MOTOR_SHOTS=[
  {start:0,end:1.9,id:'door-to-door',camera:[0,.52,-4.8],target:[0,.62,8],roll:0,focal:1.85},
  {start:1.9,end:3.65,id:'wheel-chase',camera:[.15,.28,-2.75],target:[0,.45,8],roll:0,focal:1.8},
  {start:3.65,end:5.8,id:'dutch-apex',camera:[0,17,-5],target:[0,0,0],roll:-.44,focal:1.8},
  {start:5.8,end:8,id:'curbside',camera:[-10,5.5,-10],target:[0,.45,4],roll:0,focal:1.85},
  {start:8,end:10.35,id:'grid-straight',camera:[0,3.6,-14],target:[0,.45,24],roll:0,focal:1.9},
  {start:10.35,end:12,id:'photo-finish',camera:[7,2.9,10],target:[0,.7,0],roll:0,focal:1.8},
];
export const raceShot=t=>MOTOR_SHOTS.find(shot=>t<shot.end)||MOTOR_SHOTS.at(-1);
export function raceCamera(t,input=.5){
  const shot=raceShot(t);return [shot.camera[0]+(input-.5)*.12,shot.camera[1],shot.camera[2]];
}
const nodes=[[-28,-36],[14,-39],[34,-14],[18,10],[25,36],[-15,40],[-34,12],[-20,-10]];
function circuit(t){
  t=((t%1)+1)%1*nodes.length;const i=Math.floor(t),u=t-i,p=[-1,0,1,2].map(n=>nodes[(i+n+nodes.length)%nodes.length]);
  return [0,1].map(k=>.5*(2*p[1][k]+(-p[0][k]+p[2][k])*u+(2*p[0][k]-5*p[1][k]+4*p[2][k]-p[3][k])*u*u+(-p[0][k]+3*p[1][k]-3*p[2][k]+p[3][k])*u*u*u));
}
export function racePosition(distance,lane=0){
  const t=distance/265,[x,z]=circuit(t),next=circuit(t+.0001),prev=circuit(t-.0001),forward=unit([next[0]-prev[0],0,next[1]-prev[1]]);
  return {point:[x+forward[2]*lane,0,z-forward[0]*lane],forward,t};
}
function transform([x,y,z],pose){
  const f=pose.forward,p=pose.point;return [p[0]+x*f[2]+z*f[0],p[1]+y,p[2]-x*f[0]+z*f[2]];
}
export function motorPalette(source){
  return {bg:source.black||'#080808',paper:source.paper||'#f5f5f3',fg:source.teal||'#77d3d1',fg2:source.amber||'#efbd7a',
    mid:source.steel||'#4b6571',silver:source.silver||'#c5cdd4',asphalt:source.asphalt||'#10151b',mini:source.mini||'#11171a',red:source.red||'#dd6458'};
}

export function drawMotorRace(ctx,frame,width,height,band,palette,input=.5){
  const P=motorPalette(palette),shot=raceShot(frame.t);
  const top={y:0,height:Math.max(0,band.top)},bottom={y:band.bottom,height:Math.max(0,height-band.bottom)};
  const field=top.height+16>=bottom.height?top:bottom,other=field===top?bottom:top;
  ctx.clearRect(0,0,width,height);ctx.fillStyle=P.bg;ctx.globalAlpha=1;ctx.fillRect(0,0,width,height);
  if(field.height<42)return;
  const h=field.height;
  ctx.save();ctx.beginPath();ctx.rect(0,field.y,width,h);ctx.clip();ctx.translate(0,field.y);
  const wash=ctx.createLinearGradient(0,0,0,h);wash.addColorStop(0,P.bg);wash.addColorStop(.55,P.asphalt);wash.addColorStop(1,P.bg);
  ctx.fillStyle=wash;ctx.fillRect(0,0,width,h);
  const straight=shot.id==='grid-straight';
  const center=straight?{point:[0,0,0],forward:[0,0,1]}:racePosition(frame.distance);
  const camera=transform(raceCamera(frame.t,input),center),target=transform(shot.target,center);
  const forward=unit(sub(target,camera)),rawRight=unit(cross(forward,[0,1,0])),rawUp=cross(rawRight,forward);
  const right=rawRight.map((v,i)=>v*Math.cos(shot.roll)+rawUp[i]*Math.sin(shot.roll));
  const up=rawUp.map((v,i)=>v*Math.cos(shot.roll)-rawRight[i]*Math.sin(shot.roll));
  const narrowFocal=shot.id==='wheel-chase'?.62:shot.id==='door-to-door'?.82:1.1;
  const focal=Math.min(width*(width<650?narrowFocal:1.6),h*shot.focal);
  const project=point=>{
    const d=sub(point,camera),z=dot(d,forward);return z<.2?null:{x:width*.5+dot(d,right)*focal/z,y:h*.48-dot(d,up)*focal/z,depth:z};
  };
  const world=(d,lane=0,y=0)=>{
    const p=straight?[lane,0,d]:racePosition(frame.distance+d,lane).point;return [p[0],y,p[2]];
  };
  const stroke=(points,ink=P.mid,alpha=.5,weight=.8)=>{
    ctx.strokeStyle=ink;ctx.globalAlpha=alpha*frame.reveal;ctx.lineWidth=weight;ctx.beginPath();let pen=false;
    for(const point of points){const p=project(point);if(!p){pen=false;continue;}if(pen)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);pen=true;}ctx.stroke();
  };
  const polygon=(points,ink,alpha=1)=>{
    const p=points.map(project);if(p.some(v=>!v))return;
    ctx.fillStyle=ink;ctx.globalAlpha=alpha*frame.reveal;ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill();
  };
  if(straight)drawGridTunnel(ctx,width,h,frame.t,P,.48);
  // Asphalt, striped kerbs, green-grey run-off and a double metal crash barrier.
  const surfaces=[];
  for(let d=-35;d<118;d+=2.5){
    const span=(a,b,y=0)=>[world(d,a,y),world(d+2.5,a,y),world(d+2.5,b,y),world(d,b,y)];
    const distance=Math.abs(d),fog=.45+.55*(1-clamp(distance/145));
    surfaces.push({points:span(-5.4,5.4),ink:color(P.asphalt,P.mid,.11),alpha:fog});
    for(const side of [-1,1]){
      surfaces.push({points:span(side*5.4,side*7.05),ink:color(P.mid,P.fg,.1),alpha:.15*fog});
      surfaces.push({points:span(side*5.1,side*5.6,.012),ink:Math.floor(d/2.5)%2?P.red:P.paper,alpha:.52*fog});
    }
  }
  surfaces.sort((a,b)=>dot(sub(b.points[0],camera),forward)-dot(sub(a.points[0],camera),forward));
  surfaces.forEach(s=>polygon(s.points,s.ink,s.alpha));
  for(const lane of [-5.1,5.1])stroke(curve(u=>world(-30+u*143,lane,.02),90),P.paper,.42,.85);
  for(const lane of [-2.7,2.7])stroke(curve(u=>world(-30+u*125,lane,.025),65),P.bg,.6,1.8);
  for(let d=Math.floor(frame.distance/5)*5-frame.distance-25;d<110;d+=5){
    if(straight)stroke([world(d,0,.02),world(d+1.8,0,.02)],P.paper,.2,.8);
    for(const side of [-1,1]){
      stroke([world(d,side*6.4,.12),world(d,side*6.4,2.4)],P.mid,.6,.65);
      stroke([world(d,side*6.4,2.4),world(d+5,side*6.4,.9)],P.mid,.2,.5);
    }
  }
  for(const side of [-1,1]){
    for(const y of [.3,.64,.88,2.4])stroke(curve(u=>world(-30+u*148,side*6.4,y),65),y===.88?P.fg:P.mid,y===.88?.34:.5,.75);
    // Terraced grandstands and structural canopy lines establish a real circuit.
    for(let row=0;row<6;row++){
      const x=side*(8.5+row*.8),y=.4+row*.5;
      stroke(curve(u=>world(-8+u*105,x,y),36),row%2?P.fg:P.mid,.23,.7);
    }
    for(let d=0;d<95;d+=12){
      stroke([world(d,side*8.3,.2),world(d,side*13.5,3.7),world(d+9,side*13.5,3.7)],P.mid,.24,.7);
      stroke([world(d,side*8.2,4.2),world(d,side*15,4.8),world(d+11,side*15,4.8),world(d+11,side*8.2,4.2)],P.fg,.24,.7);
      stroke([world(d,side*13.7,0),world(d,side*13.7,4.7)],P.mid,.35,.8);
    }
  }
  if(straight){
    for(let d=5;d<110;d+=14){
      const roof=4+motion.rand(d,4)*3;
      polygon([world(d,9,0),world(d,9,roof),world(d+11,9,roof),world(d+11,9,0)],color(P.asphalt,P.mid,.16),.85);
      stroke([world(d,9,0),world(d,9,roof),world(d+11,9,roof),world(d+11,9,0)],P.fg,.35,.75);
      for(let level=1;level<roof;level+=1.1)stroke([world(d+.7,8.98,level),world(d+10,8.98,level)],P.fg2,.34,.7);
    }
  }
  if(shot.id==='photo-finish'){
    const d=-4;
    for(const side of [-1,1])stroke([world(d,side*6.3,0),world(d,side*6.3,4.1)],P.fg,.55,1.1);
    polygon([world(d,-6.3,3.45),world(d,6.3,3.45),world(d,6.3,4.1),world(d,-6.3,4.1)],P.bg,.98);
    for(let row=0;row<2;row++)for(let col=0;col<24;col++)if((row+col)%2===0){
      const x=-6.3+col*.525,y=3.45+row*.325;
      polygon([world(d,x,y),world(d,x+.525,y),world(d,x+.525,y+.325),world(d,x,y+.325)],P.paper,.75);
    }
  }
  const warp=shot.id==='door-to-door'?.55:shot.id==='wheel-chase'?.45:straight?.7:.08;
  if(!frame.idle)drawWarpStars(ctx,width,h,frame.t,P,warp*frame.reveal,[.5,.39]);
  const poses=[-1,1].map((side,i)=>{
    const delta=(i===0?1:-1)*frame.gap,lane=side*1.65;
    return straight?{point:[lane,0,delta],forward:[0,0,1]}:racePosition(frame.distance+delta,lane);
  });
  const primitives=[];
  const add=(points,face,weight,tone,car,material)=>{
    const projected=points.map(project);if(projected.some(p=>!p))return;
    primitives.push({points,projected,face,weight,tone,car,material,depth:projected.reduce((s,p)=>s+p.depth,0)/projected.length});
  };
  MOTOR_CARS.forEach((model,index)=>{
    const map=point=>transform(point,poses[index]);
    model.faces.forEach(face=>add(face.points.map(map),true,0,0,index,face.material));
    model.lines.forEach(line=>add(line.points.map(map),false,line.weight,line.tone,index));
    for(const wheel of model.wheels){
      const disk=curve(t=>[wheel.x+wheel.side*.13,wheel.y+Math.sin(t*TAU)*.345,wheel.z+Math.cos(t*TAU)*.345],32);
      add(disk.map(map),true,0,0,index,'tire');add(disk.map(map),false,1,'tire',index);
      for(const r of [.27,.235])add(curve(t=>[wheel.x+wheel.side*.14,wheel.y+Math.sin(t*TAU)*r,wheel.z+Math.cos(t*TAU)*r],28).map(map),false,.75,'chrome',index);
      for(let n=0;n<5;n++)for(const split of [-.045,.045]){
        const a=n*TAU/5+frame.distance*2.6+split;
        add([[wheel.x+wheel.side*.145,wheel.y+Math.sin(a)*.06,wheel.z+Math.cos(a)*.06],[wheel.x+wheel.side*.145,wheel.y+Math.sin(a+.13)*.245,wheel.z+Math.cos(a+.13)*.245]].map(map),false,.65,'chrome',index);
      }
      add(curve(t=>[wheel.x+wheel.side*.15,wheel.y+Math.sin(t*TAU)*.058,wheel.z+Math.cos(t*TAU)*.058],12).map(map),false,.7,'chrome',index);
    }
  });
  // Opaque shaded surfaces, then depth-tested contour strokes: line art with volume.
  const triangles=[];
  const faceColor=item=>{
    if(item.material==='glass')return color(P.bg,P.fg,.08);
    if(item.material==='black'||item.material==='tire')return P.bg;
    const normal=unit(cross(sub(item.points[1],item.points[0]),sub(item.points[2],item.points[0])));
    const light=.18+.25*Math.abs(dot(normal,unit([-.4,1,.6])));
    return item.car===0?color(P.bg,P.mini,.45+light):color(P.bg,P.silver,light);
  };
  primitives.filter(item=>item.face).sort((a,b)=>b.depth-a.depth).forEach(item=>{
    const p=item.projected;ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle=faceColor(item);ctx.globalAlpha=frame.reveal;ctx.fill();
    for(let i=1;i<p.length-1;i++){
      const a=p[0],b=p[i],c=p[i+1],den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<.001)continue;
      triangles.push({a,b,c,den,left:Math.min(a.x,b.x,c.x),right:Math.max(a.x,b.x,c.x),top:Math.min(a.y,b.y,c.y),bottom:Math.max(a.y,b.y,c.y)});
    }
  });
  // Bin triangles in screen space; a close wheel should not test every body panel.
  const cell=36,columns=Math.ceil(width/cell),rows=Math.ceil(h/cell),bins=Array.from({length:columns*rows},()=>[]);
  for(const triangle of triangles){
    const x0=Math.max(0,Math.floor(triangle.left/cell)),x1=Math.min(columns-1,Math.floor(triangle.right/cell));
    const y0=Math.max(0,Math.floor(triangle.top/cell)),y1=Math.min(rows-1,Math.floor(triangle.bottom/cell));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)bins[y*columns+x].push(triangle);
  }
  const visible=(x,y,depth)=>x>=0&&y>=0&&x<width&&y<h&&!bins[Math.floor(y/cell)*columns+Math.floor(x/cell)].some(({a,b,c,den,left,right,top,bottom})=>{
    if(x<left||x>right||y<top||y>bottom)return false;
    const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,w=1-u-v;
    return u>=0&&v>=0&&w>=0&&1/(u/a.depth+v/b.depth+w/c.depth)<depth-.025;
  });
  for(const item of primitives.filter(item=>!item.face)){
    const tones={body:item.car===0?color(P.paper,P.fg,.26):P.silver,chrome:item.car===0?color(P.paper,P.fg,.15):P.paper,dim:item.car===0?P.mid:color(P.silver,P.mid,.3),lamp:P.fg2,tail:P.red,tire:P.mid};
    ctx.strokeStyle=tones[item.tone]||P.paper;ctx.lineWidth=item.weight;ctx.globalAlpha=frame.reveal*(item.tone==='dim'?.55:.92);ctx.beginPath();let pen=false;
    const p=item.projected;
    for(let i=0;i<p.length-1;i++){
      const a=p[i],b=p[i+1],steps=Math.max(1,Math.min(28,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4)));
      for(let n=0;n<=steps;n++){
        const u=n/steps,x=mix(a.x,b.x,u),y=mix(a.y,b.y,u),depth=1/mix(1/a.depth,1/b.depth,u);
        if(visible(x,y,depth)){if(pen)ctx.lineTo(x,y);else ctx.moveTo(x,y);pen=true;}else pen=false;
      }
    }ctx.stroke();
  }
  ctx.restore();
  // Telemetry occupies the opposite field; the sentence keeps its original empty band.
  if(other.height>70){
    ctx.save();ctx.beginPath();ctx.rect(0,other.y,width,other.height);ctx.clip();ctx.translate(0,other.y);
    drawTelemetry(ctx,frame,width,other.height,P,shot);
    ctx.restore();
  }
  ctx.globalAlpha=1;
}

function drawTelemetry(ctx,frame,w,h,P,shot){
  const gutter=Math.max(20,Math.min(64,w*.045));
  const text=(value,x,y,size,ink=P.paper,alpha=.6)=>{ctx.font=`${size}px "Helvetica Neue",Arial,sans-serif`;ctx.fillStyle=ink;ctx.globalAlpha=alpha;ctx.fillText(value,x,y);};
  const r=Math.min(h*.38,w*.19,125),cx=gutter+r,cy=h*.54,start=Math.PI*.8,sweep=Math.PI*1.4;
  ctx.lineWidth=.75;ctx.strokeStyle=P.mid;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(cx,cy,r,start,start+sweep);ctx.stroke();
  for(let i=0;i<=40;i++){
    const a=start+sweep*i/40,major=i%5===0;ctx.strokeStyle=i>34?P.red:P.mid;ctx.globalAlpha=major?.8:.45;
    ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(r-(major?10:4)),cy+Math.sin(a)*(r-(major?10:4)));ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();
    if(major){ctx.textAlign='center';text(String(i/5),cx+Math.cos(a)*(r+13),cy+Math.sin(a)*(r+13)+3,8,P.silver,.5);}
  }
  const needle=start+sweep*Math.min(frame.rpm/8000,1);ctx.strokeStyle=P.fg2;ctx.globalAlpha=.95;ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(cx-Math.cos(needle)*8,cy-Math.sin(needle)*8);ctx.lineTo(cx+Math.cos(needle)*(r-13),cy+Math.sin(needle)*(r-13));ctx.stroke();
  ctx.textAlign='center';text(String(frame.gear).padStart(2,'0'),cx,cy+r*.65,Math.max(18,r*.28),P.paper,.9);text('RPM / 1000',cx,cy+r*.86,8,P.mid,.9);ctx.textAlign='left';
  if(w>700){
    const x=w*.43,y=h*.4;
    text(frame.leader==='mini'?'01   MINI COOPER S':'01   BMW Z4 ROADSTER',x,y,12,frame.leader==='mini'?P.fg:P.silver,.85);
    text(frame.leader==='mini'?'02   BMW Z4 ROADSTER':'02   MINI COOPER S',x,y+26,10,P.mid,.9);
    ctx.strokeStyle=P.mid;ctx.globalAlpha=.35;ctx.beginPath();ctx.moveTo(x,y+43);ctx.lineTo(x+176,y+43);ctx.stroke();
    text('F56  /  E85',x,y+65,9,P.mid,.85);
  }
  const mapSize=Math.min(w*.24,h*.73,180),mx=w-gutter-mapSize,my=(h-mapSize)*.48;
  const mp=p=>[mx+(p[0]+40)/80*mapSize,my+(p[2]+45)/90*mapSize];
  for(const lane of [-3,3]){
    ctx.strokeStyle=P.mid;ctx.lineWidth=.8;ctx.globalAlpha=.55;ctx.beginPath();curve(u=>racePosition(u*265,lane).point,100).forEach((p,i)=>{const [x,y]=mp(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
  }
  [-1,1].forEach((side,i)=>{
    const [x,y]=mp(racePosition(frame.distance+(i===0?1:-1)*frame.gap,side*1.65).point);
    ctx.globalAlpha=1;ctx.fillStyle=i===0?P.fg:P.silver;ctx.beginPath();ctx.arc(x,y,2.8,0,TAU);ctx.fill();
  });
  if(frame.t>10.35){
    const fw=Math.min(w*.16,105),fh=fw*.52,x=w<700?w*.5-fw*.5:w*.43,y=w<700?h*.43:h*.69;
    const wave=frame.idle?0:Math.sin(frame.t*4)*fh*.06;
    ctx.globalAlpha=.72;
    for(let row=0;row<4;row++)for(let col=0;col<8;col++)if((row+col)%2===0){
      ctx.fillStyle=P.paper;ctx.beginPath();
      [[col,row],[col+1,row],[col+1,row+1],[col,row+1]].forEach(([u,v],i)=>{const xx=x+u*fw/8,yy=y+v*fh/4+Math.sin(u*.8)*wave;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.closePath();ctx.fill();
    }
  }
  ctx.globalAlpha=1;
}
