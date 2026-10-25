import { T } from './home-motor-geometry.mjs?rev=20261024-rally-cut';
import { createMotorCar } from './home-motor-cars.mjs?rev=20261024-rally-cut';
import { createMotorCity } from './home-motor-city.mjs?rev=20261024-rally-cut';
import { motorPalette, MOTOR_PALETTES, THREE_INK_FRAGMENT } from './home-motor-palette.mjs?rev=20261024-rally-cut';
import { motion } from './home-motor-motion.mjs?rev=20261024-rally-cut';
export { motorPalette, MOTOR_PALETTES };
export const MOTOR_SHOTS=[
  {start:0,end:2.2,id:'medieval-solo',mode:'lane',camera:[2.6,1.35,7.6],target:[0,1.55,0],fov:51,palette:0},
  {start:2.2,end:4.4,id:'bumper-train',mode:'lane',camera:[.65,.65,-5.5],target:[0,1.35,5],fov:65,palette:1},
  {start:4.4,end:6.7,id:'city-circuit',mode:'circuit',camera:[4.8,6.5,-10],target:[0,1.3,2],fov:53,palette:2},
  {start:6.7,end:8.2,id:'grid-tunnel',mode:'grid',camera:[0,0,0],target:[0,0,-1],fov:66,palette:3},
  {start:8.2,end:10.6,id:'diagonal-flyby',mode:'flyby',camera:[0,15,15],target:[0,0,0],fov:50,palette:4},
  {start:10.6,end:12.2,id:'hyperspace',mode:'warp',camera:[0,0,0],target:[0,0,-1],fov:75,palette:5},
  {start:12.2,end:14.3,id:'exhaust-exit',mode:'lane',camera:[.8,.58,-5.1],target:[0,1.3,2],fov:61,palette:6},
  {start:14.3,end:16,id:'rally-finale',mode:'circuit',camera:[4.3,2.8,8.6],target:[0,1.4,0],fov:52,palette:7},
];
export const raceShot=t=>MOTOR_SHOTS.find(s=>t<s.end)||MOTOR_SHOTS.at(-1);
export const raceCamera=(t,input=.5)=>{const s=raceShot(t);return [s.camera[0]+(input-.5)*.12,s.camera[1],s.camera[2]];};
export function racePosition(seconds,index){
  const shot=raceShot(seconds),local=Math.max(0,Math.min(shot.end-shot.start,seconds-shot.start));
  const z=local*9;
  if(shot.mode==='flyby'){
    const p=local/2.4-index*.26;
    return {x:9-18*p,y:0,z:-6+12*p,yaw:-Math.PI/4,visible:true,foreground:index===0};
  }
  if(shot.mode==='grid'||shot.mode==='warp')return {x:0,y:0,z:0,yaw:0,visible:false};
  if(shot.id==='medieval-solo')return {x:-.3,y:0,z,yaw:0,visible:index===0};
  if(shot.id==='bumper-train')return {x:index===0?-.35:.1,y:0,z:z+(index===0?0:7.3),yaw:0,visible:true};
  if(shot.id==='exhaust-exit')return {x:index===0?.15:-.3,y:0,z:z+(index===0?7.8:0),yaw:0,visible:true};
  return {x:index===0?-1.6:1.6,y:0,z:z+(index===0?.65:0),yaw:0,visible:true};
}

export function updateMotionPatterns(portals,stars,time){
  // Scenario Motion Loops: deterministic periods divide the original twelve seconds.
  portals.children.forEach((portal,i)=>portal.position.z=-3-(i+1-motion.phase(time,1.5))*5);
  const positions=stars.geometry.attributes.position.array;
  for(let i=0;i<144;i++){
    const p=motion.phase(time,1.5,motion.rand(i,1)*1.5),a=motion.rand(i,2)*Math.PI*2;
    const depth=3+(1-p)*90,r=3+motion.rand(i,3)*26;
    const x=Math.cos(a)*r,y=Math.sin(a)*r;
    positions.set([x,y,-depth,x,y,-depth+1.4+p*8],i*6);
  }
  stars.geometry.attributes.position.needsUpdate=true;
}
export function createMotorScene(){
  const scene=new T.Scene(),perspective=new T.PerspectiveCamera(55,1,.08,150),ortho=new T.OrthographicCamera(-10,10,6,-6,.1,100);
  const hemi=new T.HemisphereLight('#ffffff','#484848',1.6),sun=new T.DirectionalLight('#ffffff',2.1);
  hemi.layers.enable(1);sun.layers.enable(1);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-15,right:15,top:16,bottom:-15,near:.5,far:75});
  sun.shadow.normalBias=.04;scene.add(hemi,sun,sun.target);
  const city=createMotorCity(),circuit=createMotorCity({circuit:true});scene.add(city.root,circuit.root);
  const cars=[createMotorCar('mini'),createMotorCar('z4')];cars.forEach(car=>scene.add(car));
  const portals=new T.Group();portals.name='Grid Tunnel';scene.add(portals);
  const gridMat=new T.LineBasicMaterial({color:'#777777'}),brightMat=new T.LineBasicMaterial({color:'#ffffff'});
  for(let i=0;i<22;i++){
    const geo=new T.BufferGeometry().setFromPoints([[-9,-5,0],[9,-5,0],[9,5,0],[-9,5,0],[-9,-5,0]].map(p=>new T.Vector3(...p)));
    portals.add(new T.Line(geo,i%4===0?brightMat:gridMat));
  }
  const ribs=new T.Group();portals.add(ribs);
  for(let i=-3;i<=3;i++)for(const side of [-1,1]){
    for(const axis of [0,1]){
      const a=axis===0?[i*3,side*5,-4]:[side*9,i*1.66,-4],b=[...a];b[2]=-120;
      const geo=new T.BufferGeometry().setFromPoints([a,b].map(p=>new T.Vector3(...p)));
      ribs.add(new T.Line(geo,gridMat));
    }
  }
  // Ribs are longitudinal: only the rectangular frames scroll.
  portals.remove(ribs);scene.add(ribs);
  const starGeometry=new T.BufferGeometry();starGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(144*6),3));
  const stars=new T.LineSegments(starGeometry,brightMat);stars.name='Warp Stars';stars.frustumCulled=false;scene.add(stars);
  // An instrument-dial drawing belongs only to the abstract automotive plate.
  const dial=new T.Group();dial.name='tachometer-linework';scene.add(dial);
  const dialPoints=[];
  for(let i=0;i<=64;i++){const a=(-.25+i/64*1.5)*Math.PI;dialPoints.push(new T.Vector3(-5+Math.cos(a)*2.2,.01,1+Math.sin(a)*2.2));}
  dial.add(new T.Line(new T.BufferGeometry().setFromPoints(dialPoints),gridMat));
  for(let i=0;i<=24;i++){
    const a=(-.25+i/24*1.5)*Math.PI,r=i%3===0?1.9:2.05;
    dial.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-5+Math.cos(a)*r,.01,1+Math.sin(a)*r),new T.Vector3(-5+Math.cos(a)*2.3,.01,1+Math.sin(a)*2.3)]),gridMat));
  }
  const needle=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(1.85,0,0)]),brightMat);
  needle.position.set(-5,.02,1);dial.add(needle);
  const world={scene,camera:perspective,perspective,ortho,city,circuit,cars,portals,stars,ribs,ready:true,width:1,height:1,shot:MOTOR_SHOTS[0],
    resize(w,h){world.width=w;world.height=h;perspective.aspect=w/h;perspective.updateProjectionMatrix();ortho.left=-6*w/h;ortho.right=6*w/h;ortho.updateProjectionMatrix();},
    update(frame,input=.5){
      const shot=raceShot(frame.t),local=Math.max(0,Math.min(shot.end-shot.start,frame.t-shot.start)),d=local*9;
      world.shot=shot;world.palette=motorPalette(shot.palette);world.camera=shot.mode==='flyby'?ortho:perspective;
      const camera=world.camera,abstract=['grid','warp','flyby'].includes(shot.mode);
      scene.background=new T.Color(abstract?'#020202':'#bdbdbd');scene.fog=abstract?null:new T.Fog('#bdbdbd',30,110);
      city.root.visible=shot.mode==='lane';circuit.root.visible=shot.mode==='circuit';
      cars.forEach((car,index)=>{
        const p=racePosition(frame.t,index);car.visible=p.visible;car.position.set(p.x,p.y,p.z);car.rotation.y=p.yaw;
        car.userData.wheels.forEach(w=>w.rotation.x=d/.357);
        car.traverse(node=>{if(p.foreground&&node.name!=='contact-shadow')node.layers.enable(1);else node.layers.disable(1);});
        const burst=shot.id==='exhaust-exit'&&index===1&&((local>.28&&local<.44)||(local>1.22&&local<1.37));
        car.userData.flames.forEach((f,i)=>{f.visible=burst;f.scale.z=.8+.3*Math.sin(local*80+i);});
      });
      const pos=raceCamera(frame.t,input),narrow=world.width<650;
      const widening=narrow&&shot.mode==='circuit'?1.25:1;
      camera.position.set(pos[0],pos[1]*widening,(abstract?0:d)+pos[2]*widening);
      camera.up.set(0,1,0);camera.lookAt(shot.target[0],shot.target[1],(abstract?0:d)+shot.target[2]);
      if(camera===perspective){camera.fov=shot.fov+(narrow?16:0);camera.updateProjectionMatrix();}
      if(camera===ortho){camera.left=-6*(world.width/world.height);camera.right=6*(world.width/world.height);camera.updateProjectionMatrix();}
      sun.position.set(-9,23,d+8);sun.target.position.set(0,0,d);sun.target.updateMatrixWorld();
      portals.visible=ribs.visible=shot.mode==='grid';stars.visible=shot.mode==='warp';
      dial.visible=shot.mode==='flyby';needle.rotation.y=-local*1.45;
      updateMotionPatterns(portals,stars,frame.t);
    },
  };
  return world;
}
export function createMotorWorld(canvas,{foreground=null}={}){
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:true,premultipliedAlpha:false,powerPreference:'high-performance'});}
  catch{return {available:false,ready:false,resize(){},paint(){}};}
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.info.autoReset=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const model=createMotorScene(),mainTarget=new T.WebGLRenderTarget(1,1,{samples:4}),frontTarget=new T.WebGLRenderTarget(1,1,{samples:4});
  const composite=new T.Scene(),flatCamera=new T.Camera();
  const uniforms={source:{value:null},ink:{value:new T.Color()},accent:{value:new T.Color()},paper:{value:new T.Color()},cutout:{value:false}};
  const print=new T.ShaderMaterial({uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:THREE_INK_FRAGMENT,depthTest:false,depthWrite:false,blending:T.NoBlending});
  composite.add(new T.Mesh(new T.PlaneGeometry(2,2),print));
  const front=foreground?.getContext('2d');
  function output(target,cutout){uniforms.source.value=target.texture;uniforms.cutout.value=cutout;renderer.setRenderTarget(null);renderer.render(composite,flatCamera);}
  const world={available:true,ready:true,model,renderer,
    resize(w,h){
      const ratio=Math.min(globalThis.devicePixelRatio||1,1.5,Math.sqrt(2600000/(w*h)));
      renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);model.resize(w,h);
      const size=new T.Vector2();renderer.getDrawingBufferSize(size);mainTarget.setSize(size.x,size.y);frontTarget.setSize(size.x,size.y);
      if(foreground){foreground.width=size.x;foreground.height=size.y;}
    },
    paint(frame,input){
      renderer.info.reset();model.update(frame,input);const {scene,camera,palette,shot}=model;
      for(const key of ['ink','accent','paper'])uniforms[key].value.set(palette[key]);
      renderer.setRenderTarget(mainTarget);renderer.render(scene,camera);
      front?.clearRect(0,0,foreground.width,foreground.height);
      if(front&&shot.mode==='flyby'){
        // Only the MINI is copied above the native 2D heading; no text mesh or UI mask.
        const background=scene.background;scene.background=null;camera.layers.set(1);
        renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(frontTarget);renderer.setClearColor(0,0);renderer.render(scene,camera);
        output(frontTarget,true);front.drawImage(canvas,0,0);
        scene.background=background;camera.layers.set(0);renderer.shadowMap.autoUpdate=true;
      }
      // The background is the last render, so the browser never presents the cutout pass.
      output(mainTarget,false);
    },
  };
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();world.available=false;world.ready=false;world.onUnavailable?.();});
  return world;
}
