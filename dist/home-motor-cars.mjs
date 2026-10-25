import { T, box, cylinder, sphere, torus, tube, batch, mesh, toon, loft } from './home-motor-geometry.mjs?rev=20261025-curved-cars';
import { roundFace, skinPoint, surfaceSeam } from './home-motor-curves.mjs?rev=20261025-curved-cars';
const PI=Math.PI,TAU=PI*2;
const outline=(parent,geometry,color,threshold=36)=>{
  const line=new T.LineSegments(new T.EdgesGeometry(geometry,threshold),new T.LineBasicMaterial({color}));parent.add(line);return line;
};
const lineTube=(parent,points,material,r=.012)=>mesh(parent,tube(points,r),material);
const glassPanel=(parent,points,glass,trim,r)=>roundFace(parent,points,glass,{radius:.055,stroke:trim,width:r});
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
  root.userData={kind,paint:mini?'black':'silver',wheelWidth:.26,tireRadius:.333};
  const M={paint:toon(mini?'#242424':'#c2c2c2'),roof:toon('#181818'),chrome:toon('#eeeeee'),alloy:toon('#c6c6c6'),
    darkMetal:toon('#484848'),rubber:toon('#101010'),tread:toon('#333333'),disc:toon('#909090'),red:toon('#666666'),
    black:toon('#121212'),interior:toon('#303030'),seat:toon('#414141'),badge:toon('#999999'),white:toon('#ffffff'),lamp:new T.MeshBasicMaterial({color:'#ffffff'}),tail:new T.MeshBasicMaterial({color:'#888888'})};
  M.glass=new T.MeshPhongMaterial({color:'#727272',transparent:true,opacity:.62,shininess:70,side:T.DoubleSide,depthWrite:true});
  M.black.side=T.DoubleSide;
  const wheels=mini?[-1.26,1.22]:[-1.29,1.22];
  // Smooth transverse sections and swept end caps retain a shoulder without
  // turning the bonnet and fenders into a faceted rectangular slab.
  const bodyProfile=[[1,.52],[.999,.70],[.98,.87],[.91,.965],[.72,.996],[0,1],[-.72,.996],[-.91,.965],[-.98,.87],[-.999,.70],[-1,.52],[-.98,.24],[-.83,.075],[-.50,.012],[0,0],[.50,.012],[.83,.075],[.98,.24]];
  const stations=mini?[[-1.98,.73,.93],[-1.80,.83,1.0],[-1.28,.875,1.04],[-.6,.885,1.04],[.3,.88,1.035],[.8,.865,1.025],[1.24,.86,1.0],[1.62,.82,.965],[1.86,.77,.92],[2.02,.71,.855]]
    :[[-2.09,.73,.80],[-1.83,.85,.91],[-1.3,.89,.96],[-.65,.88,.94],[.25,.86,.935],[.75,.865,.95],[1.22,.88,.985],[1.64,.85,.94],[1.91,.79,.84],[2.10,.71,.78]];
  const relief=(x,y,z,py)=>{
    const crown=Math.exp(-(((Math.abs(x)-.60)/.22)**2))*Math.exp(-(((z-1.45)/.62)**2))*Math.max(0,(py-.7)/.3)*(mini?.055:.025);
    const hollow=mini?0:-Math.sign(x)*.032*Math.exp(-(((z+.25)/.9)**2))*Math.exp(-(((py-.48)/.22)**2));
    return [hollow,crown];
  };
  const nose=mini?.24:.28,tail=mini?.16:.19;
  const shell=loft(stations.map(s=>[...s,.19]),{rings:96,steps:8,wheelArches:wheels,cockpit:!mini,profile:bodyProfile,smoothProfile:true,noseRound:nose,tailRound:tail,relief,archRadius:.38,archCenter:.333});
  const body=mesh(root,shell,M.paint);body.name='curved-body-with-wheel-arches';outline(root,shell,mini?'#b5b5b5':'#353535',65);
  const frontZ=x=>(mini?2.02:2.10)-nose*(x/.9)**2,rearZ=x=>(mini?-1.98:-2.09)+tail*(x/.9)**2;
  const frontSurface=p=>{p.z=frontZ(p.x)+.018;return p;},rearSurface=p=>{p.z=rearZ(p.x)-.018;return p;};
  const skin=(side,y,z)=>skinPoint(shell,side,y,z);
  const b=batch(root);
  b.add(box(1.5,.13,2.2),M.black,[0,.22,0]);
  // Sills, bumpers, arch lips and actual fixed brake calipers.
  for(const side of [-1,1]){
    lineTube(root,[[side*.82,.24,.74],[side*.865,.215,0],[side*.83,.25,-.79]],mini?M.black:M.paint,.016);
    for(const z of wheels){
      b.add(torus(.38,mini?.014:.008,PI),mini?M.black:M.paint,[side*.89,.333,z],[0,PI/2,0]);
      b.add(box(.065,.17,.11),M.red,[side*(mini?.76:.78),.445,z+.18]);
      const w=wheel(side,M);w.scale.set(1,.333/.357,.333/.357);w.position.set(side*(mini?.77:.79),.333,z);w.userData.radius=.333;root.add(w);
    }
    const door=mini?[[1.005,.47],[.90,.48],[.43,.34],[.40,-.76],[.88,-.86],[1.005,-.82]]:[[.875,.10],[.67,.06],[.48,-.12],[.43,-.60],[.46,-.92],[.66,-1.0],[.885,-.99]];
    surfaceSeam(root,shell,side,door,M.darkMetal,.004,mini).name=mini?'f56-curved-door-seam':'e85-curved-door-seam';
    const handle=skin(side,mini?.91:.86,mini?-.48:-.76);
    const grip=mesh(root,sphere(.06),M.chrome,handle);grip.scale.set(.18,.25,1.5);
    const mirrorZ=mini?.44:.13,mirrorY=mini?1.035:.99;
    const mirror=mesh(root,sphere(.115),M.paint,[side*1.0,mirrorY,mirrorZ]);mirror.scale.set(.9,.55,1.2);
    b.add(box(.15,.026,.035),M.black,[side*.88,mirrorY-.025,mirrorZ]);
    if(!mini){
      surfaceSeam(root,shell,side,[[.89,1.05],[.81,.75],[.65,.35],[.48,-.25],[.43,-.70]],M.darkMetal,.004).name='e85-flame-surface-crease';
      const badge=skin(side,.79,.72);b.add(cylinder(.044,.012,24),M.badge,badge,[0,0,PI/2]);
    }
  }
  if(mini){
    const roofGeometry=loft([[-1.36,.63,1.47,1.42],[-1.1,.68,1.53,1.45],[-.5,.69,1.55,1.47],[.16,.65,1.51,1.44]],{rings:48,steps:8,smoothProfile:true,profile:[[1,.35],[.96,.85],[.65,1],[0,1],[-.65,1],[-.96,.85],[-1,.35],[-.8,0],[0,0],[.8,0]]});
    const roofY=roofGeometry.attributes.position;for(let i=0;i<roofY.count;i++)roofY.setY(i,1+(roofY.getY(i)-1)*.76);roofGeometry.computeVertexNormals();
    mesh(root,roofGeometry,M.roof).name='f56-roof';
    const cab=points=>points.map(([x,y,z])=>[x,1+(y-1)*.76,z]);
    const wind=cab([[-.65,1.47,.18],[.65,1.47,.18],[.77,1.055,.73],[-.77,1.055,.73]]);
    glassPanel(root,wind,M.glass,M.chrome,.015);
    const rear=cab([[-.65,1.46,-1.34],[.65,1.46,-1.34],[.78,1.005,-1.73],[-.78,1.005,-1.73]]);
    glassPanel(root,rear,M.glass,M.black,.017);
    for(const side of [-1,1]){
      const win=cab([[side*.66,1.46,-1.24],[side*.66,1.47,.15],[side*.8,1.055,.62],[side*.845,1.02,-1.52]]);
      glassPanel(root,win,M.glass,M.chrome,.011);
      lineTube(root,cab([[side*.69,1.48,-.67],[side*.84,1.03,-.8]]),M.black,.029);
      lineTube(root,[[side*.8,1.01,-1.62],[side*.875,1.01,-.8],[side*.84,1.025,.7]],M.chrome,.017);
      surfaceSeam(root,shell,side,[[.77,.73],[.81,1.1],[.75,1.55],[.67,1.8]],M.darkMetal,.004,false,true).name='f56-clamshell-seam';
      // Restrained oval lamps sit in the rounded clamshell, not on stalks.
      const lamp=new T.Group();lamp.name='recessed-f56-headlamp';lamp.position.set(side*.56,.815,frontZ(side*.56)-.022);lamp.rotation.x=-.43;lamp.rotation.y=side*.17;
      lamp.userData.lensRadius=.153;
      const housing=mesh(lamp,sphere(.175),M.paint);housing.scale.set(1,1.13,.19);
      const lens=mesh(lamp,sphere(.153),M.darkMetal,[0,0,.025]);lens.scale.set(1,1.13,.13);
      mesh(lamp,torus(.164,.008),M.chrome,[0,0,.034]).scale.y=1.13;
      mesh(lamp,torus(.134,.0045),M.white,[0,0,.039]).scale.y=1.13;
      mesh(lamp,sphere(.046),M.lamp,[0,-.015,.047]).scale.z=.18;root.add(lamp);
      const fog=new T.Group();fog.name='f56-round-fog-lamp';fog.position.set(side*.65,.435,frontZ(side*.65)+.028);fog.rotation.y=side*.26;
      mesh(fog,sphere(.067),M.black).scale.z=.25;mesh(fog,torus(.060,.006),M.chrome,[0,0,.018]);mesh(fog,sphere(.045),M.lamp,[0,0,.02]).scale.z=.2;root.add(fog);
      const x=side*.64,tailPoints=[[x-.082,.915,0],[x+.082,.915,0],[x+.082,.63,0],[x-.082,.63,0]];
      roundFace(root,tailPoints,M.tail,{radius:.045,name:'upright-f56-tail-light',stroke:M.chrome,width:.006,surface:rearSurface,facing:-1});
      lineTube(root,[[x,.67,rearZ(x)-.028],[x,.87,rearZ(x)-.028]],M.chrome,.006);
      b.add(cylinder(.062,.11,24),M.darkMetal,[side*.087,.285,-1.98],[PI/2,0,0]);
      b.add(torus(.06,.009),M.chrome,[side*.087,.285,-2.04]);
    }
    const grille=[[-.575,.65,0],[-.36,.79,0],[.36,.79,0],[.575,.65,0],[.49,.47,0],[-.49,.47,0]];
    roundFace(root,grille,M.black,{radius:.095,name:'f56-hex-grille',stroke:M.chrome,width:.010,surface:frontSurface});
    // Fine connected mesh is a single line lattice in the colored pass. The
    // contour pass omits sub-pixel texture and keeps the clear grille silhouette.
    const lattice=[];
    for(let row=0;row<7;row++)for(let col=0;col<24;col++){
      const x=-.438+col*.0381+(row%2)*.01905,y=.513+row*.033;
      if(Math.abs(x)>.48-Math.max(0,y-.65)*1.4)continue;
      for(let k=0;k<6;k++)for(const j of [k,k+1]){const a=PI/6+j*TAU/6,px=x+Math.cos(a)*.022; lattice.push(px,y+Math.sin(a)*.022,frontZ(px)+.023);}
    }
    const grilleMesh=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(lattice,3)),new T.LineBasicMaterial({color:'#555555'}));grilleMesh.name='f56-fine-honeycomb';root.add(grilleMesh);
    lineTube(root,[[-.49,.607,frontZ(-.49)+.031],[0,.619,frontZ(0)+.031],[.49,.607,frontZ(.49)+.031]],M.chrome,.008);
    const scoop=mesh(root,sphere(.1),M.black,[0,1.04,1.12]);scoop.scale.set(2.15,.14,.75);scoop.name='f56-rounded-bonnet-scoop';
    roundFace(root,[[-.48,.39,0],[-.42,.445,0],[.42,.445,0],[.48,.39,0],[.42,.32,0],[-.42,.32,0]],M.black,{radius:.04,name:'f56-lower-intake',stroke:M.darkMetal,width:.005,surface:frontSurface});
    lineTube(root,[[-.68,.235,frontZ(-.68)],[0,.21,frontZ(0)+.01],[.68,.235,frontZ(.68)]],M.black,.015);
    b.add(box(.42,.105,.025),M.white,[0,.545,2.052]);
    roundFace(root,[[-.21,.65,-2.033],[.21,.65,-2.033],[.21,.53,-2.033],[-.21,.53,-2.033]],M.white,{radius:.008,name:'f56-rear-plate',stroke:M.darkMetal,width:.0045,facing:-1});
    b.add(cylinder(.036,.012,24),M.chrome,[0,.83,-2.005],[PI/2,0,0]);b.add(torus(.036,.004),M.chrome,[0,.83,-2.015]);
    lineTube(root,[[-.48,.91,rearZ(-.48)-.022],[-.49,.69,rearZ(-.49)-.022],[-.45,.43,rearZ(-.45)-.022],[0,.40,-2.005],[.45,.43,rearZ(.45)-.022],[.49,.69,rearZ(.49)-.022],[.48,.91,rearZ(.48)-.022]],M.darkMetal,.004);
    b.add(cylinder(.047,.012,24),M.chrome,[0,.98,1.67],[-.35,0,0]);
    for(const side of [-1,1])for(let i=0;i<3;i++)b.add(box(.09-i*.015,.011,.018),M.chrome,[side*(.09+i*.025),.99,1.67+i*.02]);
    lineTube(root,[[-.60,1.355,-1.39],[0,1.375,-1.43],[.60,1.355,-1.39]],M.black,.022);
  }else{
    // Open E85 cockpit with a lowered tub, two contoured seats and a real dashboard.
    b.add(box(1.42,.14,1.38),M.interior,[0,.55,-.49]);
    for(const side of [-1,1])lineTube(root,[[side*.74,.90,.20],[side*.75,.915,-.45],[side*.73,.92,-1.16]],M.paint,.025);
    b.add(box(1.5,.065,.25),M.paint,[0,.945,-1.2]);
    b.add(box(1.48,.055,.17),M.black,[0,.93,.23]);
    lineTube(root,[[-.69,.95,.15],[-.69,.95,-1.1],[.69,.95,-1.1],[.69,.95,.15]],M.black,.015);
    b.add(box(.24,.31,1.28),M.black,[0,.65,-.49]);
    b.add(box(1.44,.23,.25),M.black,[0,.89,.24]);
    for(const side of [-1,1]){
      const x=side*.39;
      const seatBase=mesh(root,box(.4,.12,.44),M.seat,[x,.71,-.6]);seatBase.name='e85-seat-base';
      b.add(box(.39,.39,.12),M.seat,[x,.9,-.89],[-.13,0,0]);
      b.add(box(.23,.16,.105),M.black,[x,1.07,-.92],[-.13,0,0]);
      for(const q of [-1,1])b.add(box(.05,.29,.17),M.black,[x+q*.17,.91,-.84],[-.1,0,q*.15]);
      lineTube(root,[[x-.19,.93,-1.19],[x-.18,1.10,-1.22],[x,1.18,-1.22],[x+.18,1.10,-1.22],[x+.19,.93,-1.19]],M.chrome,.021);
      b.add(box(.045,.11,.025),M.chrome,[side*.65,.83,-.2]);
    }
    b.add(cylinder(.022,.11,12),M.chrome,[0,.83,-.25]);b.add(sphere(.037),M.black,[0,.895,-.25]);
    const steering=mesh(root,torus(.165,.018),M.black,[-.39,.91,-.11],[-.6,0,0]);steering.name='e85-steering-wheel';
    b.add(box(.26,.02,.02),M.chrome,[-.39,.91,-.11]);
    const gaugeNeedles=[];
    for(const x of [-.48,-.31]){
      b.add(cylinder(.078,.045,24),M.black,[x,1.005,.1],[PI/2,0,0]);
      b.add(torus(.07,.007),M.chrome,[x,1.005,.074]);
      for(let i=0;i<12;i++){const a=i/12*TAU;b.add(box(.004,.009,.004),M.white,[x+Math.sin(a)*.057,1.005+Math.cos(a)*.057,.069],[0,0,-a]);}
      const pivot=new T.Group();pivot.name='e85-instrument-needle';pivot.position.set(x,1.005,.064);root.add(pivot);
      mesh(pivot,box(.004,.05,.004),M.white,[0,.021,0]);gaugeNeedles.push(pivot);
    }
    root.userData.gaugeNeedles=gaugeNeedles;
    const wind=[[-.76,.92,.35],[.76,.92,.35],[.66,1.235,-.04],[-.66,1.235,-.04]];
    glassPanel(root,wind,M.glass,M.chrome,.018);
    for(const side of [-1,1]){
      const kidney=[[side*.055,.712,0],[side*.145,.738,0],[side*.30,.723,0],[side*.326,.665,0],[side*.30,.566,0],[side*.20,.547,0],[side*.066,.566,0]];
      roundFace(root,kidney,M.black,{radius:.042,name:'e85-rounded-kidney',stroke:M.chrome,width:.009,surface:frontSurface});
      const slat=new T.CapsuleGeometry(.0035,.127,2,6);
      for(let k=0;k<6;k++){const x=side*(.09+k*.037);b.add(slat,M.chrome,[x,.643,frontZ(x)+.028]);}
      const lens=[[side*.345,.757,0],[side*.425,.823,0],[side*.70,.808,0],[side*.78,.753,0],[side*.685,.695,0],[side*.39,.710,0]];
      roundFace(root,lens,M.darkMetal,{radius:.027,name:'e85-swept-headlamp',stroke:M.chrome,width:.0055,surface:frontSurface});
      for(const x of [.468,.625]){
        const projector=new T.Group();projector.position.set(side*x,.758,frontZ(x)+.029);projector.rotation.y=side*.32;
        mesh(projector,torus(.046,.0055),M.lamp);mesh(projector,sphere(.034),M.glass,[0,0,.006]).scale.z=.3;root.add(projector);
      }
      const fog=new T.Group();fog.name='e85-round-fog-lamp';fog.position.set(side*.67,.505,frontZ(.67)+.026);fog.rotation.y=side*.29;
      mesh(fog,sphere(.06),M.black).scale.z=.3;mesh(fog,torus(.051,.006),M.darkMetal,[0,0,.019]);mesh(fog,sphere(.038),M.glass,[0,0,.022]).scale.z=.25;root.add(fog);
      const tail=[[side*.29,.77,0],[side*.46,.80,0],[side*.73,.75,0],[side*.75,.665,0],[side*.36,.67,0]];
      roundFace(root,tail,M.tail,{radius:.028,name:'e85-rounded-rear-lamp',stroke:M.darkMetal,width:.005,surface:rearSurface,facing:-1});
      lineTube(root,[[side*.36,.715,rearZ(.36)-.027],[side*.52,.73,rearZ(.52)-.027],[side*.69,.712,rearZ(.69)-.027]],M.white,.007);
      surfaceSeam(root,shell,side,[[.28,.36],[.31,.80],[.36,1.27],[.43,1.73]],M.darkMetal,.004,false,true).name='e85-curved-bonnet-crease';
    }
    roundFace(root,[[-.60,.37,0],[-.52,.415,0],[-.28,.432,0],[.28,.432,0],[.52,.415,0],[.60,.37,0],[.55,.305,0],[-.55,.305,0]],M.black,{radius:.036,name:'e85-central-lower-grille',stroke:M.darkMetal,width:.005,surface:frontSurface});
    lineTube(root,[[-.70,.23,frontZ(-.70)],[0,.205,frontZ(0)+.014],[.70,.23,frontZ(.70)]],M.darkMetal,.009);
    lineTube(root,[[-.65,.86,-1.93],[0,.88,-2.015],[.65,.86,-1.93]],M.darkMetal,.006);
    b.add(box(.43,.105,.025),M.white,[0,.492,2.13]);
    b.add(box(.43,.13,.035),M.white,[0,.63,-2.11]);
    lineTube(root,[[-.62,.33,rearZ(.62)-.02],[0,.32,rearZ(0)-.02],[.62,.33,rearZ(.62)-.02]],M.black,.012);
    for(const x of [-.51,-.37]){b.add(cylinder(.055,.14,24),M.darkMetal,[x,.275,-2.07],[PI/2,0,0]);b.add(torus(.054,.009),M.chrome,[x,.275,-2.15]);}
    b.add(cylinder(.049,.012,24),M.badge,[0,.947,1.64],[-.2,0,0]);
    b.add(cylinder(.044,.014,24),M.badge,[0,.81,-2.115],[PI/2,0,0]);
  }
  b.finish();
  const flames=[];
  for(const x of (mini?[-.087,.087]:[-.51,-.37])){
    const flame=new T.Group();flame.name='exhaust-backfire';flame.position.set(x,mini?.285:.275,mini?-2.08:-2.19);
    mesh(flame,new T.ConeGeometry(.105,.65,9),new T.MeshBasicMaterial({color:'#777777',transparent:true,opacity:.55,depthWrite:true}),[0,0,-.27],[-PI/2,0,0]);
    mesh(flame,new T.ConeGeometry(.05,.36,9),M.lamp,[0,0,-.12],[-PI/2,0,0]);
    flame.visible=false;root.add(flame);flames.push(flame);
  }
  root.userData.flames=flames;
  const shadow=mesh(root,new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:'#10122e',transparent:true,opacity:.25,depthWrite:false}),[0,.009,0],[-PI/2,0,0]);shadow.name='contact-shadow';shadow.scale.set(.95,2.02,1);shadow.castShadow=false;
  root.userData.materials=M;
  root.userData.wheels=root.children.filter(c=>c.name==='volumetric-wheel');
  return root;
}
export const MOTOR_MODELS=['mini','z4'];

// Space uses the same geometry/depth as its surroundings, with shared colored light.
export function setMotorCarSpace(car,enabled){
  if(car.userData.spaceLook===enabled)return;car.userData.spaceLook=enabled;
  if(!car.userData.spacePairs){
    const originals=new Map(),M=car.userData.materials,keys=new Map(Object.entries(M).map(([k,m])=>[m,k]));
    car.traverse(node=>{if(!node.material||originals.has(node.material))return;const m=node.material,key=keys.get(m),mini=car.userData.kind==='mini';let next;
      if(m.isLineBasicMaterial)next=new T.LineBasicMaterial({color:mini?'#6dcfe6':'#d29be8',transparent:true,opacity:.32});
      else if(key==='paint'||key==='roof')next=new T.MeshPhongMaterial({color:key==='roof'?'#0a1020':mini?'#171e2e':'#b7c6dc',specular:mini?'#65d9f5':'#c6d8ff',shininess:105,emissive:'#050c1b',side:m.side});
      else if(key==='lamp'||key==='tail')next=new T.MeshBasicMaterial({color:new T.Color(key==='tail'?'#ff448d':'#c4f9ff').multiplyScalar(2)});
      else if(key==='glass')next=new T.MeshPhongMaterial({color:'#24426b',specular:'#a4eaff',shininess:150,transparent:true,opacity:.54,depthWrite:true,side:T.DoubleSide});
      else if(m.isMeshBasicMaterial){next=m.clone();next.color?.set('#6f89a8');}
      else next=new T.MeshPhongMaterial({color:m.color.clone().lerp(new T.Color('#7c9bc0'),.16),specular:'#9caecb',shininess:key==='rubber'?8:65,side:m.side});
      originals.set(m,next);
    });
    car.userData.spacePairs=originals;car.userData.streetPairs=new Map([...originals].map(([a,b])=>[b,a]));
  }
  const map=enabled?car.userData.spacePairs:car.userData.streetPairs;
  car.traverse(node=>{if(map.has(node.material))node.material=map.get(node.material);});
}
