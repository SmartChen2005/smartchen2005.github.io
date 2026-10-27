// SX-70: articulated geometry in camera-space units, rendered without a WebGL dependency.
// x = right, y = up, z = lens / film-exit direction.
const mix = (a, b, t) => a + (b - a) * t;
const METAL = '#b7bab9', EDGE = '#e1e3df', BLACK = '#202321', LEATHER = '#95603a';
export const FILM_SLOT = { y: .18, z: 1.43, width: 1.84, length: 2.23 };
export const EYEPIECE = {center:[0,1.69,-.4905],width:.32};

export function buildSX70(open) {
  const faces = [];
  const face = (points, color, shine = false) => faces.push({ points, color, shine });
  function box(center, size, color, rotation = 0, topColor = color) {
    const [x, y, z] = center, [w, h, d] = size.map(n => n / 2);
    const points = [[-w,-h,-d],[w,-h,-d],[w,h,-d],[-w,h,-d],[-w,-h,d],[w,-h,d],[w,h,d],[-w,h,d]]
      .map(([a,b,c]) => [x+a, y+b*Math.cos(rotation)-c*Math.sin(rotation), z+b*Math.sin(rotation)+c*Math.cos(rotation)]);
    for (const ids of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]])
      face(ids.map(i => points[i]), ids[0]===3?topColor:color, (ids[0]===3?topColor:color) === METAL || (ids[0]===3?topColor:color) === EDGE);
  }
  function disc(x,y,z,r,depth,color) {
    const a=[], b=[];
    for(let i=0;i<40;i++) {
      const t=i/40*Math.PI*2;
      a.push([x+Math.cos(t)*r,y+Math.sin(t)*r,z]);
      b.push([x+Math.cos(t)*r,y+Math.sin(t)*r,z+depth]);
    }
    face([...a].reverse(),color);
    for(let i=0;i<40;i++) face([a[i],a[(i+1)%40],b[(i+1)%40],b[i]],color,true);
    face(b,color,true);
  }
  box([0,0,0],[2.16,.28,2.8],METAL);
  box([0,.151,-.08],[2.01,.035,2.54],BLACK);
  box([0,-.155,0],[2.00,.025,2.62],LEATHER);
  box([0,.17,1.11],[1.99,.09,.48],BLACK);
  box([0,.18,1.397],[1.88,.055,.025],'#090b0a'); // film slot
  box([0,.092,1.414],[2.04,.05,.03],EDGE);
  const angle=open*.74;
  // Back mirror panel rotates about the rear hinge, not its center.
  const hinge=[0,mix(.41,.23,open),-1.19], length=mix(1.65,2.12,open);
  const panel=(x,y,z)=>[x,hinge[1]+y*Math.cos(angle)+z*Math.sin(angle),hinge[2]-y*Math.sin(angle)+z*Math.cos(angle)];
  function panelBox(c,s,color) {
    const before=faces.length;
    box(c,s,color,0,color===EDGE?LEATHER:color);
    for(let i=before;i<faces.length;i++) faces[i].points=faces[i].points.map(p=>panel(...p));
  }
  panelBox([0,0,length/2],[2.00,.09,length],LEATHER);
  panelBox([0,-.051,length/2],[1.87,.012,length-.12],BLACK);
  panelBox([0,.055,length/2],[1.84,.026,length-.16],LEATHER);
  if(open>.2) {
    panelBox([0,.076,1.48],[.73,.018,.59],BLACK);
    for(let i=0;i<6;i++) panelBox([0,.088,1.29+i*.058],[.51-i%2*.09,.002,.009],'#967548');
  }
  // Pleated leather bellows: triangular side gussets expand with the mirror panel.
  if(open>.01) {
    for(const side of [-1,1]) {
      const rear=[side*.93,.23,-1.12], top=panel(side*.93,-.075,2.01), front=[side*.93,.24,.87];
      face(side<0?[rear,front,top]:[top,front,rear],'#111411');
      for(let i=0;i<10;i++) {
        const t=i/10, u=(i+1)/10;
        const ridge=side*(.94+(i%2)*.022);
        const pleat=[[ridge,...rear.slice(1)], [ridge,mix(front[1],top[1],t),mix(front[2],top[2],t)],
          [ridge,mix(front[1],top[1],u),mix(front[2],top[2],u)]];
        face(side<0?pleat:pleat.reverse(),i%2?'#30322e':'#191c19');
      }
      box([side*.99,mix(.25,.83,open),mix(-.25,-.18,open)],[.025,mix(.02,1.5,open),.035],EDGE,-.60);
    }
  }
  // Front lens standard folds flat into the base.
  const frontStart=faces.length;
  box([0,.57,.79],[1.99,.79,.22],METAL);
  faces[frontStart].color=LEATHER;faces[frontStart].shine=false;
  // The back of the lens standard becomes the front leather deck when closed.
  box([0,.59,.665],[1.91,.73,.022],LEATHER);
  box([0,.982,.79],[1.86,.05,.25],BLACK);
  const detailStart=faces.length;
  disc(.12,.58,.911,.345,.095,BLACK);
  disc(.12,.58,1.009,.288,.021,EDGE);
  disc(.12,.58,1.033,.263,.032,'#171b19');
  disc(.12,.58,1.069,.220,.005,'#513d31');
  disc(.12,.58,1.078,.172,.004,'#172529');
  disc(.075,.64,1.085,.068,.001,'#637675');
  disc(-.71,.60,.915,.147,.025,EDGE);
  disc(-.71,.60,.947,.117,.015,'#db422b');
  disc(.73,.62,.915,.125,.025,EDGE);
  disc(.73,.62,.946,.092,.005,'#272e2d');
  for(let i=0;i<24;i++) {
    const a=i/24*Math.PI*2, r=.319;
    box([.12+Math.cos(a)*r,.58+Math.sin(a)*r,1.01],[.015,.023,.006],'#9b9e96');
  }
  for(const x of [-.57,.62]) {
    box([x,1.018,.8],[.28,.055,.13],BLACK);
    for(let i=0;i<7;i++) box([x-.12+i*.04,1.05,.8],[.009,.009,.12],EDGE);
  }
  for(let i=detailStart;i<faces.length;i++)faces[i].frontDetail=open;
  const fold=(1-open)*Math.PI/2;
  for(let i=frontStart;i<faces.length;i++) faces[i].points=faces[i].points.map(([x,y,z])=>
    [x,mix(.34,.23,open)+(y-.23)*Math.cos(fold)-(z-.79)*Math.sin(fold),mix(.34,.79,open)+(y-.23)*Math.sin(fold)+(z-.79)*Math.cos(fold)]);
  // Collapsible finder hood with rear-facing eyepiece.
  // Short leather shoulder behind the lens, not a tall vertical black board.
  if(open>.01) {
    const deck=(x,t,lift=0)=>[x,mix(.44,1.03+t*.58,open)+lift,mix(.65,.84-t*.66,open)];
    face([deck(-1,0),deck(1,0),deck(1,1),deck(-1,1)],EDGE,true);
    face([deck(-.92,.05,.012),deck(.92,.05,.012),deck(.92,.95,.012),deck(-.92,.95,.012)],LEATHER);
    box([0,mix(.46,1.065,open),.79],[.55,.07*open,.17],BLACK);
  }
  const hoodY=mix(.59,1.94,open), hoodZ=mix(.35,.06,open);
  box([0,hoodY,hoodZ],[1.55,.105,1.12],LEATHER,-.10*open);
  box([0,hoodY+.065,hoodZ],[1.40,.025,.98],LEATHER,-.10*open);
  // Finder bellows taper inward at the leather deck, with horizontal folds.
  for(let i=0;i<5;i++) {
    const t=i/5,u=(i+1)/5;
    const ring=s=>{const w=mix(.43,.70,s),d=mix(.23,.40,s);return [[-w,hoodY-.52*open+s*.46*open-.03,hoodZ-d],[w,hoodY-.52*open+s*.46*open-.03,hoodZ-d],[w,hoodY-.52*open+s*.46*open-.03,hoodZ+d],[-w,hoodY-.52*open+s*.46*open-.03,hoodZ+d]];};
    const a=ring(t),b=ring(u);
    for(let j=0;j<4;j++)face([a[j],b[j],b[(j+1)%4],a[(j+1)%4]],i%2?'#252823':'#151815');
  }
  box([0,hoodY-.25*open,hoodZ-.475],[.57,.34*open+.035,.10],BLACK);
  box([0,hoodY-.25*open,hoodZ-.534],[.40,.23*open+.015,.014],'#7f9390');
  box([0,hoodY-.25*open,hoodZ-.546],[.32,.31*open+.01,.009],'#1a2828');
  return faces;
}

export function projectPoint([x,y,z], yaw, elevation, scale, cx, cy) {
  const a=x*Math.cos(yaw)+z*Math.sin(yaw), b=-x*Math.sin(yaw)+z*Math.cos(yaw);
  const up=y*Math.cos(elevation)-b*Math.sin(elevation);
  const depth=y*Math.sin(elevation)+b*Math.cos(elevation);
  const perspective=9/(9-depth);
  return [cx+a*scale*perspective,cy-up*scale*perspective,depth];
}

export function filmCorners(progress=1) {
  const {y,z,width,length}=FILM_SLOT;
  return [[-width/2,y,z],[width/2,y,z],[width/2,y,z+length*progress],[-width/2,y,z+length*progress]];
}

function textureTriangle(ctx, image, dest, source) {
  const [[x0,y0],[x1,y1],[x2,y2]]=source;
  const [[u0,v0],[u1,v1],[u2,v2]]=dest;
  const determinant=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0);
  if(Math.abs(determinant)<.001)return;
  const a=((u1-u0)*(y2-y0)-(u2-u0)*(y1-y0))/determinant;
  const b=((v1-v0)*(y2-y0)-(v2-v0)*(y1-y0))/determinant;
  const c=((u2-u0)*(x1-x0)-(u1-u0)*(x2-x0))/determinant;
  const d=((v2-v0)*(x1-x0)-(v1-v0)*(x2-x0))/determinant;
  ctx.save();ctx.beginPath();ctx.moveTo(u0,v0);ctx.lineTo(u1,v1);ctx.lineTo(u2,v2);ctx.closePath();ctx.clip();
  ctx.transform(a,b,c,d,u0-a*x0-c*y0,v0-b*x0-d*y0);ctx.drawImage(image,0,0);ctx.restore();
}

export function drawSX70(ctx, openness, yaw, elevation, scale, cx, cy, film=null) {
  const mesh=buildSX70(openness);
  if(film&&film.progress>.001)mesh.push({points:filmCorners(film.progress),texture:film.texture,progress:film.progress});
  const faces=mesh.map(f=>({...f,p:f.points.map(p=>projectPoint(p,yaw,elevation,scale,cx,cy))})).filter(f=>{
    if(f.texture)return true;
    // Cull away-facing surfaces, especially the downward folded lens.
    return f.p.reduce((sum,p,i)=>{const q=f.p[(i+1)%f.p.length];return sum+p[0]*q[1]-q[0]*p[1];},0)<0;
  });
  const depth=f=>f.p.reduce((n,p)=>n+p[2],0)/f.p.length+(f.frontDetail||0)*Math.max(0,Math.cos(yaw))*.72;
  faces.sort((a,b)=>depth(a)-depth(b));
  for(const f of faces) {
    if(f.texture) {
      const {width:w,height:h}=f.texture, top=(1-f.progress)*h;
      const uv=[[0,top],[w,top],[w,h],[0,h]];
      for(const ids of [[0,1,2],[0,2,3]])textureTriangle(ctx,f.texture,ids.map(i=>f.p[i]),ids.map(i=>uv[i]));
      continue;
    }
    ctx.beginPath();f.p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    const p=f.points, u=p[1].map((n,i)=>n-p[0][i]),v=p[2].map((n,i)=>n-p[0][i]);
    const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const len=Math.hypot(...normal)||1;
    const light=.68+.32*Math.abs((normal[0]*-.35+normal[1]*.8+normal[2]*.45)/len);
    const rgb=f.color.match(/\w\w/g).map(h=>Math.min(255,Math.round(parseInt(h,16)*light)));
    ctx.fillStyle=`rgb(${rgb.join(',')})`;
    if(f.shine) {
      const ys=f.p.map(p=>p[1]),xs=f.p.map(p=>p[0]);
      const grad=ctx.createLinearGradient(Math.min(...xs),Math.min(...ys),Math.max(...xs)+.1,Math.max(...ys)+.1);
      grad.addColorStop(0,`rgb(${rgb.map(v=>Math.min(255,v*1.15)).join(',')})`);
      grad.addColorStop(.48,ctx.fillStyle);grad.addColorStop(1,`rgb(${rgb.map(v=>v*.75).join(',')})`);ctx.fillStyle=grad;
    }
    ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.12)';ctx.lineWidth=.35;ctx.stroke();
  }
}
