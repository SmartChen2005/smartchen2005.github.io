import { T, box, cylinder, mesh } from './home-motor-geometry.mjs?rev=20261024-pop-city';
import { createMotorCar } from './home-motor-cars.mjs?rev=20261024-pop-city';
import { createMotorCity, popPalette, POP_COLORS } from './home-motor-city.mjs?rev=20261024-pop-city';
import { createStreetType, TYPE_PLACEMENTS } from './home-motor-type.mjs?rev=20261024-pop-city';
import { motion } from './home-motor-motion.mjs?rev=20261024-pop-city';
export { POP_COLORS, popPalette, TYPE_PLACEMENTS };
export const MOTOR_SHOTS=[
  {start:0,end:2.2,id:'boulevard-low',camera:[0,.95,-7.8],target:[0,.68,5],fov:58,roll:0,palette:0},
  {start:2.2,end:4.1,id:'wheel-rig',camera:[.2,.48,-4.7],target:[-.25,.65,6],fov:69,roll:0,palette:1},
  {start:4.1,end:6.2,id:'type-underpass',camera:[-6.1,4.1,-12],target:[0,1.5,2],fov:52,roll:0,palette:2},
  {start:6.2,end:8.3,id:'type-overprint',camera:[0,21,-4],target:[0,0,0],fov:48,roll:-.25,palette:3},
  {start:8.3,end:10.4,id:'cafe-plaza',camera:[6,4.4,11],target:[0,.72,0],fov:52,roll:0,palette:0},
  {start:10.4,end:12.4,id:'grid-arcade',camera:[0,2.7,-11],target:[0,.9,18],fov:58,roll:0,palette:1},
  {start:12.4,end:14.3,id:'facade-track',camera:[5.2,2.6,2],target:[0,.7,0],fov:55,roll:0,palette:2},
  {start:14.3,end:16,id:'city-finale',camera:[5.5,3.4,10],target:[0,.7,0],fov:50,roll:0,palette:3},
];
export const raceShot=t=>MOTOR_SHOTS.find(s=>t<s.end)||MOTOR_SHOTS.at(-1);
export const raceCamera=(t,input=.5)=>{const s=raceShot(t);return [s.camera[0]+(input-.5)*.18,s.camera[1],s.camera[2]];};
export function racePosition(seconds,index){
  const gap=1.55*Math.cos((seconds-1.1)*Math.PI/2.45),d=seconds*8.8+(index===0?gap:-gap);
  const lift=Math.max(...[-1.29,1.22].map(axle=>Math.max(0,1-Math.abs(d+axle-63.2)/.85)))*.16;
  return {x:index===0?-1.7:1.7,y:lift,z:d,gap};
}
export function createMotorScene(paletteColors=POP_COLORS){
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(55,1,.08,170);
  scene.background=new T.Color(paletteColors.cyan);scene.fog=new T.Fog(paletteColors.cyan,48,132);
  const hemi=new T.HemisphereLight('#fff4e1','#2533c4',1.5);scene.add(hemi);
  const sun=new T.DirectionalLight('#fff4dc',2.0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-23;sun.shadow.camera.right=23;sun.shadow.camera.top=23;sun.shadow.camera.bottom=-23;
  sun.shadow.camera.near=.5;sun.shadow.camera.far=90;sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;
  scene.add(sun,sun.target);
  const city=createMotorCity();scene.add(city.root);
  // Screen-print stipple is confined to architectural planes, not a global UI filter.
  for(const material of city.materials.walls){
    material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`float dotDistance=length(mod(gl_FragCoord.xy,vec2(7.0))-vec2(3.5));\ngl_FragColor.rgb*=mix(0.84,1.0,step(1.15,dotDistance));\n#include <dithering_fragment>`);};
    material.customProgramCacheKey=()=> 'motor-pop-halftone-v1';
  }
  const cars=[createMotorCar('mini'),createMotorCar('z4')];cars.forEach(car=>scene.add(car));
  const portals=new T.Group();portals.name='Grid Tunnel';scene.add(portals);
  const portalMaterials=[new T.MeshBasicMaterial({color:POP_COLORS.yellow}),new T.MeshBasicMaterial({color:POP_COLORS.cyan})];
  for(let i=0;i<15;i++){
    const frame=new T.Group();
    for(const side of [-1,1])mesh(frame,box(.075,5.7,.075),portalMaterials[i%2],[side*6.4,2.85,0]);
    mesh(frame,box(12.85,.075,.075),portalMaterials[i%2],[0,5.7,0]);
    for(const x of [-4.25,-2.1,0,2.1,4.25])mesh(frame,box(.027,.027,7),portalMaterials[i%2],[x,5.7,3.5]);
    portals.add(frame);
  }
  const starGeometry=new T.BufferGeometry(),positions=new Float32Array(96*2*3),colors=new Float32Array(96*2*3);
  starGeometry.setAttribute('position',new T.BufferAttribute(positions,3));starGeometry.setAttribute('color',new T.BufferAttribute(colors,3));
  const stars=new T.LineSegments(starGeometry,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.6,depthWrite:false}));
  stars.name='Warp Stars';stars.frustumCulled=false;camera.add(stars);scene.add(camera);
  let type=null,lastPalette=-1;
  const world={scene,camera,city,cars,portals,stars,ready:false,width:1,height:1,
    setType(font){type=createStreetType(font);scene.add(type.root);world.ready=true;lastPalette=-1;},
    resize(w,h){world.width=w;world.height=h;camera.aspect=w/h;camera.updateProjectionMatrix();},
    update(frame,input=.5){
      const shot=raceShot(frame.t),d=frame.t*8.8;
      if(shot.palette!==lastPalette){
        const p=popPalette(shot.palette,paletteColors);scene.background.set(p.sky);scene.fog.color.set(p.sky);city.apply(p);type?.apply(p);
        portalMaterials[0].color.set(p.accent);portalMaterials[1].color.set(p.trim);
        for(let i=0;i<96;i++){
          const c=new T.Color(i%3===0?p.accent:i%3===1?p.trim:p.walls[0]);
          for(let end=0;end<2;end++)c.toArray(colors,(i*2+end)*3);
        }
        starGeometry.attributes.color.needsUpdate=true;lastPalette=shot.palette;
      }
      cars.forEach((car,index)=>{
        const p=racePosition(frame.t,index);car.position.set(p.x,p.y,p.z);
        car.userData.wheels.forEach(w=>w.rotation.x=frame.t*8.8/.357);
      });
      const pos=raceCamera(frame.t,input),narrow=world.width<650;
      // A portrait frame widens its establishing shots rather than cropping both cars.
      const widening=narrow&&['boulevard-low','grid-arcade'].includes(shot.id)?1.65:narrow&&shot.id!=='wheel-rig'?1.38:1;
      camera.position.set(Math.max(-6.25,Math.min(6.25,pos[0]*widening)),pos[1]*widening,d+pos[2]*widening);
      camera.fov=shot.fov+(narrow?12:0);camera.up.set(0,1,0);
      camera.lookAt(shot.target[0],shot.target[1],d+shot.target[2]);camera.rotateZ(shot.roll);camera.updateProjectionMatrix();
      sun.position.set(-12,27,d+10);sun.target.position.set(0,0,d+3);sun.target.updateMatrixWorld();
      portals.visible=shot.id==='grid-arcade';
      portals.children.forEach((portal,i)=>portal.position.z=d+(i-2)*7-motion.phase(frame.t,1.5)*7);
      stars.visible=!frame.idle&&['boulevard-low','wheel-rig','grid-arcade'].includes(shot.id);
      {
        for(let i=0;i<96;i++){
          const p=motion.phase(frame.t,3,motion.rand(i,1)*3),a=motion.rand(i,2)*Math.PI*2;
          const depth=6+(1-p)*70,r=3+motion.rand(i,3)*13;
          const x=Math.cos(a)*r,y=Math.sin(a)*r*.7;
          positions.set([x,y,-depth,x*(1+.045*p),y*(1+.045*p),-depth+1.2+p*2.5],i*6);
        }
        starGeometry.attributes.position.needsUpdate=true;
      }
    },
  };
  return world;
}
export function createMotorWorld(canvas,colors={}){
  let renderer;
  try{
    renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  }catch{return {available:false,ready:false,resize(){},paint(){}};}
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.6));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(POP_COLORS.cyan);
  const model=createMotorScene({...POP_COLORS,...Object.fromEntries(Object.entries(colors).filter(([,v])=>Boolean(v)))});
  const world={available:true,ready:false,resize(w,h){
      renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.6,Math.sqrt(3200000/(w*h))));
      renderer.setSize(w,h,false);model.resize(w,h);
    },
    paint(frame,input){model.update(frame,input);renderer.render(model.scene,model.camera);},
    model,renderer,
  };
  world.whenReady=fetch(new URL('./assets/motor-sentence-glyphs.json?rev=20261024-pop-city',import.meta.url)).then(r=>{
    if(!r.ok)throw new Error('Missing local sentence geometry');return r.json();
  }).then(font=>{model.setType(font);world.ready=true;}).catch(()=>{world.available=false;world.ready=false;});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();world.available=false;world.ready=false;world.onUnavailable?.();});
  return world;
}
