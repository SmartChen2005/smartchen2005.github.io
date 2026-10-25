import { T, box, cylinder, sphere, torus, tube, batch, mesh, toon, loft, polygon } from './home-motor-geometry.mjs?rev=20261024-rally-cut';
const PI=Math.PI,TAU=PI*2;
const outline=(parent,geometry,color,threshold=36)=>{
  const line=new T.LineSegments(new T.EdgesGeometry(geometry,threshold),new T.LineBasicMaterial({color}));parent.add(line);return line;
};
const lineTube=(parent,points,material,r=.012)=>mesh(parent,tube(points,r),material);
function wheel(side,M){
  const group=new T.Group();group.name='volumetric-wheel';group.userData={width:.26,radius:.357};
  const profile=[[.245,-.13],[.31,-.127],[.348,-.09],[.357,-.04],[.357,.04],[.348,.09],[.31,.127],[.245,.13]].map(p=>new T.Vector2(...p));
  const tire=new T.LatheGeometry(profile,48);tire.rotateZ(PI/2);mesh(group,tire,M.rubber).name='tire-barrel';
  const b=batch(group);
  for(const x of [-.115,.115]){
    b.add(torus(.307,.012),M.rubber,[x,0,0],[0,PI/2,0]);
    b.add(torus(.27,.014),M.alloy,[x,0,0],[0,PI/2,0]);
  }
  b.add(cylinder(.245,.015,40),M.disc,[side*.07,0,0],[0,0,PI/2]);
  b.add(new T.CylinderGeometry(.245,.245,.09,32,1,true),M.darkMetal,[side*.1,0,0],[0,0,PI/2]);
  b.add(torus(.242,.009),M.alloy,[side*.153,0,0],[0,PI/2,0]);
  for(let i=0;i<5;i++){
    const a=TAU*i/5;
    for(const split of [-.07,.07]){
      const r=.143,angle=a+split;
      b.add(box(.027,.205,.018),M.alloy,[side*.15,Math.cos(angle)*r,Math.sin(angle)*r],[angle,0,0]);
    }
    b.add(cylinder(.017,.018,10),M.chrome,[side*.169,Math.cos(a)*.061,Math.sin(a)*.061],[0,0,PI/2]);
    for(let j=0;j<4;j++){
      const angle=a+j*.15;b.add(cylinder(.006,.017,6),M.darkMetal,[side*.083,Math.cos(angle)*.19,Math.sin(angle)*.19],[0,0,PI/2]);
    }
  }
  b.add(cylinder(.047,.033,20),M.chrome,[side*.16,0,0],[0,0,PI/2]);
  b.add(cylinder(.031,.035,20),M.badge,[side*.165,0,0],[0,0,PI/2]);
  for(let i=0;i<64;i++){
    const a=TAU*i/64;
    b.add(box(.215,.005,.017),M.tread,[0,Math.cos(a)*.355,Math.sin(a)*.355],[a,0,0]);
  }
  b.finish();return group;
}
export function createMotorCar(kind){
  const mini=kind==='mini',root=new T.Group();root.name=mini?'MINI Cooper S F56':'BMW Z4 E85 Roadster';
  root.userData={kind,paint:mini?'black':'silver',wheelWidth:.26};
  const M={paint:toon(mini?'#242424':'#c2c2c2'),roof:toon('#181818'),chrome:toon('#eeeeee'),alloy:toon('#c6c6c6'),
    darkMetal:toon('#484848'),rubber:toon('#101010'),tread:toon('#333333'),disc:toon('#909090'),red:toon('#666666'),
    black:toon('#121212'),interior:toon('#303030'),seat:toon('#414141'),badge:toon('#999999'),white:toon('#ffffff'),lamp:new T.MeshBasicMaterial({color:'#ffffff'}),tail:new T.MeshBasicMaterial({color:'#ffffff'})};
  M.glass=new T.MeshPhongMaterial({color:'#727272',transparent:true,opacity:.62,shininess:70,side:T.DoubleSide,depthWrite:false});
  M.black.side=T.DoubleSide;
  const wheels=mini?[-1.26,1.22]:[-1.29,1.22];
  const stations=mini?[[-1.94,.64,.73],[-1.75,.81,.94],[-1.3,.87,1.02],[-.6,.89,1.04],[.35,.88,1.04],[1.1,.86,1.015],[1.65,.79,.9],[1.94,.61,.67]]
    :[[-2.08,.72,.76],[-1.8,.86,.92],[-1.3,.88,.97],[-.6,.89,.93],[.3,.87,.88],[1.1,.86,.89],[1.75,.79,.78],[2.08,.59,.56]];
  const shell=loft(stations,{rings:40,steps:6,wheelArches:wheels,cockpit:!mini});
  const body=mesh(root,shell,M.paint);body.name='curved-body-with-wheel-arches';outline(root,shell,mini?'#b5b5b5':'#353535',50);
  const b=batch(root);
  b.add(box(1.5,.13,2.2),M.black,[0,.22,0]);
  // Sills, bumpers, arch lips and actual fixed brake calipers.
  for(const side of [-1,1]){
    b.add(box(.12,.12,1.6),M.black,[side*.87,.25,0]);
    for(const z of wheels){
      b.add(torus(.403,.018,PI),M.black,[side*.895,.355,z],[0,PI/2,0]);
      b.add(box(.065,.17,.11),M.red,[side*.86,.47,z+.19]);
      const w=wheel(side,M);w.position.set(side*.865,.357,z);root.add(w);
    }
    const door=mini?[[side*.89,.95,.28],[side*.905,.68,.2],[side*.88,.42,-.92]]:[[side*.87,.9,.09],[side*.905,.66,-.04],[side*.88,.39,-1.01]];
    lineTube(root,door,M.darkMetal,.007);
    b.add(box(.035,.036,.18),M.chrome,[side*.9,.855,mini?-.48:-.76]);
    b.add(box(.04,.018,.13),M.black,[side*.906,.842,mini?-.48:-.76]);
    const mirror=mesh(root,sphere(.13),M.paint,[side*1.015,1.015,.29]);mirror.scale.set(.9,.58,1.25);
    b.add(box(.18,.036,.04),M.black,[side*.88,.99,.28]);
    b.add(box(.02,.09,.16),M.chrome,[side*1.115,1.015,.28]);
    if(!mini){
      lineTube(root,[[side*.84,.87,1.12],[side*.9,.67,.36],[side*.89,.48,-.75]],M.darkMetal,.008);
      b.add(box(.021,.12,.28),M.darkMetal,[side*.891,.77,.81],[0,0,.15]);
      b.add(cylinder(.044,.012,20),M.badge,[side*.91,.87,.67],[0,0,PI/2]);
      for(let n=0;n<3;n++)b.add(box(.025,.014,.25),M.chrome,[side*.906,.73+n*.035,.82]);
    }
  }
  if(mini){
    const roofGeometry=loft([[-1.36,.63,1.47,1.42],[-1.1,.68,1.53,1.45],[-.5,.69,1.55,1.47],[.16,.65,1.51,1.44]],{rings:24,steps:5});
    const roofY=roofGeometry.attributes.position;for(let i=0;i<roofY.count;i++)roofY.setY(i,1+(roofY.getY(i)-1)*.82);roofGeometry.computeVertexNormals();
    mesh(root,roofGeometry,M.roof).name='f56-roof';
    const cab=points=>points.map(([x,y,z])=>[x,1+(y-1)*.82,z]);
    const wind=cab([[-.65,1.47,.18],[.65,1.47,.18],[.77,1.055,.73],[-.77,1.055,.73]]);
    mesh(root,polygon(wind),M.glass);lineTube(root,[...wind,wind[0]],M.chrome,.022);
    const rear=cab([[-.65,1.46,-1.34],[.65,1.46,-1.34],[.78,1.005,-1.73],[-.78,1.005,-1.73]]);
    mesh(root,polygon(rear),M.glass);lineTube(root,[...rear,rear[0]],M.black,.022);
    for(const side of [-1,1]){
      const win=cab([[side*.66,1.46,-1.24],[side*.66,1.47,.15],[side*.8,1.055,.62],[side*.845,1.02,-1.52]]);
      mesh(root,polygon(win),M.glass);lineTube(root,[...win,win[0]],M.chrome,.015);
      lineTube(root,cab([[side*.69,1.48,-.67],[side*.84,1.03,-.8]]),M.black,.029);
      lineTube(root,[[side*.8,1.01,-1.62],[side*.875,1.01,-.8],[side*.84,1.025,.7]],M.chrome,.017);
      // Small, recessed oval F56 lamps follow the bonnet instead of standing above it.
      const lamp=new T.Group();lamp.name='recessed-f56-headlamp';lamp.position.set(side*.55,.81,1.805);lamp.rotation.x=-.43;lamp.rotation.y=side*.15;
      lamp.userData.lensRadius=.151;
      const housing=mesh(lamp,sphere(.176),M.paint);housing.scale.set(1,1.13,.17);
      const lens=mesh(lamp,sphere(.151),M.darkMetal,[0,0,.025]);lens.scale.set(1,1.13,.12);
      const bezel=mesh(lamp,torus(.163,.009),M.chrome,[0,0,.032]);bezel.scale.y=1.13;
      mesh(lamp,torus(.133,.005),M.white,[0,0,.038]).scale.y=1.13;
      mesh(lamp,sphere(.046),M.lamp,[0,-.015,.047]).scale.z=.18;
      b.add(box(.13,.052,.03),M.lamp,[side*.61,.42,1.89]);root.add(lamp);
      const tail=mesh(root,box(.16,.28,.055),M.tail,[side*.64,.77,-1.965],[0,side*.25,0]);tail.name='upright-f56-tail-light';
      b.add(box(.12,.018,.065),M.chrome,[side*.64,.78,-1.995]);
      b.add(box(.022,.23,.06),M.chrome,[side*.64,.77,-1.995]);
      b.add(cylinder(.062,.11,24),M.darkMetal,[side*.087,.285,-1.98],[PI/2,0,0]);
      b.add(torus(.06,.009),M.chrome,[side*.087,.285,-2.04]);
    }
    const grille=[[-.48,.68,1.955],[-.37,.8,1.91],[.37,.8,1.91],[.48,.68,1.955],[.34,.47,1.995],[-.34,.47,1.995]];
    mesh(root,polygon(grille),M.black).name='f56-hex-grille';
    const grillePath=new T.CurvePath();for(let i=0;i<grille.length;i++)grillePath.add(new T.LineCurve3(new T.Vector3(...grille[i]),new T.Vector3(...grille[(i+1)%grille.length])));
    mesh(root,new T.TubeGeometry(grillePath,60,.012,5,false),M.chrome);
    for(let row=0;row<4;row++)for(let col=0;col<12;col++){
      const x=-.33+col*.06,y=.52+row*.065;
      b.add(torus(.025,.0035),M.darkMetal,[x+(row%2)*.03,y,1.998],[0,0,PI/6]);
    }
    b.add(box(.46,.055,.19),M.black,[0,1.035,1.15],[-.08,0,0]);
    b.add(box(.41,.012,.15),M.chrome,[0,1.064,1.16]);
    b.add(box(1.25,.07,.12),M.black,[0,.3,1.89]);
    b.add(box(.42,.11,.03),M.white,[0,.43,2.015]);
    b.add(box(.42,.12,.03),M.white,[0,.59,-1.955]);
    b.add(cylinder(.047,.012,24),M.chrome,[0,.98,1.67],[-.35,0,0]);
    for(const side of [-1,1])for(let i=0;i<3;i++)b.add(box(.09-i*.015,.011,.018),M.chrome,[side*(.09+i*.025),.99,1.67+i*.02]);
    b.add(box(1.25,.045,.22),M.black,[0,1.40,-1.4],[-.1,0,0]);
  }else{
    // Open E85 cockpit with a lowered tub, two contoured seats and a real dashboard.
    b.add(box(1.42,.14,1.38),M.interior,[0,.55,-.49]);
    for(const side of [-1,1])b.add(box(.17,.055,1.48),M.paint,[side*.75,.93,-.49]);
    b.add(box(1.5,.065,.25),M.paint,[0,.945,-1.2]);
    b.add(box(1.48,.055,.17),M.black,[0,.93,.23]);
    lineTube(root,[[-.69,.95,.15],[-.69,.95,-1.1],[.69,.95,-1.1],[.69,.95,.15]],M.black,.015);
    b.add(box(.24,.31,1.28),M.black,[0,.65,-.49]);
    b.add(box(1.44,.23,.25),M.black,[0,.89,.24]);
    for(const side of [-1,1]){
      const x=side*.39;
      const seatBase=mesh(root,box(.4,.12,.44),M.seat,[x,.71,-.6]);seatBase.name='e85-seat-base';
      b.add(box(.39,.39,.12),M.seat,[x,.9,-.89],[-.13,0,0]);
      b.add(box(.23,.16,.105),M.black,[x,1.13,-.92],[-.13,0,0]);
      for(const q of [-1,1])b.add(box(.05,.29,.17),M.black,[x+q*.17,.91,-.84],[-.1,0,q*.15]);
      lineTube(root,[[x-.21,.94,-1.19],[x-.2,1.17,-1.22],[x,1.3,-1.22],[x+.2,1.17,-1.22],[x+.21,.94,-1.19]],M.chrome,.027);
      b.add(box(.045,.11,.025),M.chrome,[side*.65,.83,-.2]);
    }
    b.add(cylinder(.022,.11,12),M.chrome,[0,.83,-.25]);b.add(sphere(.037),M.black,[0,.895,-.25]);
    const steering=mesh(root,torus(.165,.018),M.black,[-.39,.93,-.11],[-.6,0,0]);steering.name='e85-steering-wheel';
    b.add(box(.26,.02,.02),M.chrome,[-.39,.93,-.11]);
    const wind=[[-.76,.92,.35],[.76,.92,.35],[.66,1.28,-.04],[-.66,1.28,-.04]];
    mesh(root,polygon(wind),M.glass);lineTube(root,[...wind,wind[0]],M.chrome,.026);
    for(const side of [-1,1]){
      const kidney=[[side*.065,.68,2.075],[side*.27,.7,2.07],[side*.29,.48,2.105],[side*.075,.47,2.11]];
      mesh(root,polygon(kidney),M.black);lineTube(root,[...kidney,kidney[0]],M.chrome,.015);
      for(let k=0;k<5;k++)b.add(box(.008,.15,.012),M.chrome,[side*(.1+k*.032),.58,2.115]);
      const housing=mesh(root,sphere(.18),M.paint,[side*.55,.755,1.9],[0,side*.3,0]);housing.scale.set(1.3,.48,.38);
      const lamp=mesh(root,sphere(.16),M.lamp,[side*.55,.765,1.94],[0,side*.3,0]);lamp.scale.set(1.25,.36,.28);
      for(const x of [.45,.62])b.add(torus(.058,.009),M.chrome,[side*x,.765,1.962],[0,side*.2,0]);
      b.add(box(.3,.055,.07),M.tail,[side*.55,.74,-2.09],[0,side*.18,0]);
      b.add(box(.2,.04,.03),M.white,[side*.55,.72,-2.13]);
      lineTube(root,[[side*.31,.9,.4],[side*.35,.91,1.04],[side*.45,.81,1.64]],M.darkMetal,.006);
    }
    b.add(box(1.23,.09,.13),M.black,[0,.33,1.98]);
    b.add(box(.43,.105,.025),M.white,[0,.4,2.11]);
    b.add(box(.43,.13,.035),M.white,[0,.63,-2.11]);
    b.add(box(1.05,.095,.04),M.black,[0,.36,-2.105]);
    lineTube(root,[[-.62,.84,-1.97],[0,.88,-2.02],[.62,.84,-1.97]],M.darkMetal,.008);
    for(const x of [-.51,-.37]){b.add(cylinder(.055,.14,24),M.darkMetal,[x,.275,-2.07],[PI/2,0,0]);b.add(torus(.054,.009),M.chrome,[x,.275,-2.15]);}
    b.add(cylinder(.049,.012,24),M.badge,[0,.83,1.76],[-.2,0,0]);
    b.add(cylinder(.044,.014,24),M.badge,[0,.85,-2.06],[PI/2,0,0]);
  }
  b.finish();
  const flames=[];
  for(const x of (mini?[-.087,.087]:[-.51,-.37])){
    const flame=new T.Group();flame.name='exhaust-backfire';flame.position.set(x,mini?.285:.275,mini?-2.08:-2.19);
    mesh(flame,new T.ConeGeometry(.105,.65,9),new T.MeshBasicMaterial({color:'#777777'}),[0,0,-.27],[-PI/2,0,0]);
    mesh(flame,new T.ConeGeometry(.05,.36,9),M.lamp,[0,0,-.12],[-PI/2,0,0]);
    flame.visible=false;root.add(flame);flames.push(flame);
  }
  root.userData.flames=flames;
  const shadow=mesh(root,new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:'#10122e',transparent:true,opacity:.25,depthWrite:false}),[0,.009,0],[-PI/2,0,0]);shadow.name='contact-shadow';shadow.scale.set(.95,2.02,1);shadow.castShadow=false;
  root.userData.wheels=root.children.filter(c=>c.name==='volumetric-wheel');
  return root;
}
export const MOTOR_MODELS=['mini','z4'];
