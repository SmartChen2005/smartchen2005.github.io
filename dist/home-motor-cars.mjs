// Original, deliberately simplified F56 and E85 geometry. Surfaces only mask and
// lightly shade the line drawing; there are no downloaded models or textures.
const TAU = Math.PI*2;
const curve = (fn, n=28) => Array.from({length:n+1},(_,i)=>fn(i/n));
const catmull = (a,b,c,d,t) => .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
function model(kind) {
  const mini=kind==='mini', lines=[], faces=[];
  const line=(points,weight=1,tone='body')=>lines.push({points,weight,tone});
  const face=(points,material='body')=>faces.push({points,material});
  const ring=(center,u,v,r1,r2,weight=1,tone='chrome')=>line(curve(t=>center.map((n,i)=>n+Math.cos(t*TAU)*u[i]*r1+Math.sin(t*TAU)*v[i]*r2)),weight,tone);
  const path=(points,weight=1,tone='body',closed=false)=>{
    const vertices=[];
    for(let i=0;i<points.length-(closed?0:1);i++)for(let k=0;k<7;k++){
      const get=j=>points[closed?(j+points.length)%points.length:Math.max(0,Math.min(points.length-1,j))];
      vertices.push([0,1,2].map(axis=>catmull(get(i-1)[axis],get(i)[axis],get(i+1)[axis],get(i+2)[axis],k/7)));
    }
    vertices.push(closed?vertices[0]:points.at(-1)); line(vertices,weight,tone);
    return vertices;
  };
  const panel=(points,weight=1,tone='body')=>{
    const vertices=[];
    points.forEach((p,i)=>{
      const prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];
      const lp=Math.hypot(...p.map((v,n)=>v-prev[n])),ln=Math.hypot(...p.map((v,n)=>v-next[n]));
      const radius=Math.min(.045,lp*.18,ln*.18);
      const a=p.map((v,n)=>v+(prev[n]-v)*radius/lp),b=p.map((v,n)=>v+(next[n]-v)*radius/ln);
      for(let k=0;k<=5;k++){const t=k/5;vertices.push(p.map((v,n)=>(1-t)*(1-t)*a[n]+2*t*(1-t)*v+t*t*b[n]));}
    });
    vertices.push(vertices[0]);line(vertices,weight,tone);return vertices;
  };
  // Rounded cross-sections and a gently domed bonnet avoid a box-like wireframe.
  const stations=mini?[[-1.94,.63,.75],[-1.72,.82,.94],[-1.25,.89,1.02],[-.4,.9,1.04],[.45,.88,1.04],[1.23,.86,1.00],[1.72,.76,.85],[1.94,.55,.64]]
    :[[-2.08,.61,.68],[-1.77,.81,.87],[-1.23,.9,.94],[-.45,.89,.90],[.5,.86,.88],[1.25,.85,.87],[1.85,.73,.72],[2.08,.54,.56]];
  const skin=[];
  for(let i=0;i<stations.length-1;i++)for(let k=0;k<2;k++){
    const at=j=>stations[Math.max(0,Math.min(stations.length-1,j))];
    skin.push([0,1,2].map(axis=>catmull(at(i-1)[axis],at(i)[axis],at(i+1)[axis],at(i+2)[axis],k/2)));
  }
  skin.push(stations.at(-1));
  const sections=skin.map(([z,w,top])=>Array.from({length:12},(_,i)=>{
    const a=TAU*i/12,c=Math.cos(a),s=Math.sin(a);
    return [w*Math.sign(c)*Math.pow(Math.abs(c),.48),.24+(top-.24)*(.5+.5*Math.sign(s)*Math.pow(Math.abs(s),.68)),z];
  }));
  for(let n=0;n<sections.length-1;n++)for(let i=0;i<12;i++){
    const z=(skin[n][0]+skin[n+1][0])/2;
    if(!mini&&z> -1.25&&z<.24&&i>=1&&i<5)continue;
    face([sections[n][i],sections[n+1][i],sections[n+1][(i+1)%12],sections[n][(i+1)%12]]);
  }
  for(const index of [0,sections.length-1])face(sections[index]);
  for(const s of [-1,1]){
    path(stations.map(([z,w,y])=>[s*w*.985,y-.18,z]),1.05);
    path(stations.map(([z,w])=>[s*w*.95,.28,z]),.7,'dim');
    for(const z of mini?[-1.26,1.22]:[-1.29,1.22])line(curve(t=>[s*.91,.39+Math.sin(t*Math.PI)*.395,z+Math.cos(t*Math.PI)*.42],24),.8,'chrome');
    path(mini?[[s*.89,.96,.24],[s*.91,.6,.16],[s*.88,.4,-.82]]:[[s*.87,.9,.1],[s*.91,.6,-.04],[s*.88,.37,-1.04]],.65,'dim');
    line([[s*.9,.86,mini?-.35:-.63],[s*.91,.86,mini?-.52:-.82]],.8,'chrome');
    const mirror=path([[s*.77,1.05,.34],[s*1.04,1.04,.27],[s*1.07,.96,.13],[s*.88,.96,.12]],.8,'chrome',true);
    face(mirror,'black');
    if(!mini)path([[s*.84,.85,1.1],[s*.9,.68,.35],[s*.9,.49,-.7]],.7,'dim');
  }
  if(mini){
    const roof=panel([[-.65,1.48,-1.3],[.65,1.48,-1.3],[.68,1.53,-.65],[.65,1.5,.18],[-.65,1.5,.18],[-.68,1.53,-.65]],1.25,'chrome',true);
    face(roof,'black');
    const wind=panel([[-.65,1.48,.17],[.65,1.48,.17],[.76,1.06,.72],[-.76,1.06,.72]],1.05,'chrome',true);face(wind,'glass');
    const back=panel([[-.65,1.46,-1.3],[.65,1.46,-1.3],[.78,1,-1.68],[-.78,1,-1.68]],.9,'chrome',true);face(back,'glass');
    for(const s of [-1,1]){
      const window=panel([[s*.66,1.46,-1.24],[s*.66,1.47,.15],[s*.79,1.07,.61],[s*.85,1.02,-1.5]],.9,'chrome',true);face(window,'glass');
      line([[s*.69,1.49,-.67],[s*.84,1.035,-.79]],.9,'chrome');
      ring([s*.54,.86,1.72],[1,0,-s*.18],[0,.92,-.38],.205,.24,1.3,'lamp');
      ring([s*.54,.86,1.735],[1,0,-s*.18],[0,.92,-.38],.162,.196,.55,'chrome');
      panel([[s*.6,.92,-1.76],[s*.74,.88,-1.77],[s*.74,.65,-1.87],[s*.6,.64,-1.9]],1,'tail',true);
      ring([s*.095,.29,-1.98],[1,0,0],[0,1,0],.065,.052,.85);
    }
    panel([[-.49,.66,1.91],[-.39,.79,1.88],[.39,.79,1.88],[.49,.66,1.91],[.34,.48,1.96],[-.34,.48,1.96]],1.15,'chrome',true);
    panel([[-.27,1.025,1.19],[-.23,1.065,1.05],[.23,1.065,1.05],[.27,1.025,1.19]],.8,'chrome',true);
    line([[-.35,.42,1.98],[.35,.42,1.98]],.6,'dim');
    line([[-.57,1.51,-1.33],[.57,1.51,-1.33]],.8,'chrome');
  }else{
    const wind=panel([[-.76,.91,.34],[.76,.91,.34],[.67,1.25,-.04],[-.67,1.25,-.04]],1.2,'chrome',true);face(wind,'glass');
    const well=panel([[-.81,.94,-1.22],[-.81,.92,.2],[.81,.92,.2],[.81,.94,-1.22]],.8,'chrome',true);face(well,'black');
    for(const s of [-1,1]){
      const x=s*.39, seat=panel([[x-.17,.71,-.96],[x-.17,1.08,-.95],[x+.17,1.08,-.95],[x+.18,.71,-.96]],.75,'dim',true);face(seat,'black');
      line(curve(t=>[x+Math.cos(t*Math.PI)*.22,.93+Math.sin(t*Math.PI)*.33,-1.23],24),1.1,'chrome');
      panel([[s*.065,.67,2.06],[s*.27,.7,2.055],[s*.29,.49,2.085],[s*.075,.48,2.09]],.95,'chrome',true);
      panel([[s*.37,.76,1.98],[s*.73,.77,1.8],[s*.75,.65,1.88],[s*.39,.65,2.03]],1,'lamp',true);
      panel([[s*.42,.84,-1.98],[s*.76,.8,-1.84],[s*.76,.68,-1.98],[s*.44,.7,-2.09]],1.05,'tail',true);
      path([[s*.34,.9,.45],[s*.37,.89,1.1],[s*.47,.8,1.65]],.6,'dim');
    }
    ring([-.39,.84,-.4],[1,0,0],[0,.7,.65],.17,.17,.7,'dim');
    line([[-.53,.36,2.07],[.53,.36,2.07]],.65,'dim');
  }
  return {kind,lines,faces,wheels:(mini?[-1.26,1.22]:[-1.29,1.22]).flatMap(z=>[-1,1].map(s=>({x:s*.9,y:.36,z,side:s})))};
}
export const MOTOR_CARS=[model('mini'),model('z4')];
