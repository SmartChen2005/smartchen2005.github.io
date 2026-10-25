import { T } from './home-motor-geometry.mjs?rev=20261025-cosmic';
import { createMotorCar, setMotorCarSpace } from './home-motor-cars.mjs?rev=20261025-cosmic';
import { createMotorCity } from './home-motor-city.mjs?rev=20261025-shockwave';
import { motorPalette, MOTOR_PALETTES } from './home-motor-palette.mjs?rev=20261025-cosmic';
import { raceTravel, cameraTravel, driverMotion, raceExposure, createSpeedLines, updateSpeedLines, MOTOR_BACKGROUND_FRAGMENT, MOTOR_COMPOSITE_FRAGMENT } from './home-motor-speed.mjs?rev=20261025-seven-cuts';
import { isFlight, flightPose, flightCamera, createMotorCosmos, SPACE_FINISH_FRAGMENT } from './home-motor-flight.mjs?rev=20261025-stars';
import { isMotorLineShot, MOTOR_LINE_FRAGMENT } from './home-motor-line.mjs?rev=20261025-seven-cuts';
import { createArchitectureBurst } from './home-motor-burst.mjs?rev=20261025-seven-cuts';
export { motorPalette, MOTOR_PALETTES };
export const MOTOR_SHOTS=[
  {start:0,end:2.2,id:'starlit-lead',mode:'lane',camera:[2.35,1.2,15.8],target:[0,1.1,4],fov:62,palette:6},
  {start:2.2,end:4.4,id:'bumper-train',mode:'lane',camera:[.65,.65,-5.5],target:[0,1.35,5],fov:65,palette:6},
  {start:4.4,end:6.7,id:'city-circuit',mode:'circuit',camera:[4.8,6.5,-10],target:[0,1.3,2],fov:53,palette:6},
  {start:6.7,end:8.5,id:'grid-tunnel',mode:'grid',camera:[0,0,0],target:[0,0,-1],fov:66,palette:3},
  {start:8.5,end:11.1,travelStart:8.5,travelEnd:13.3,travelOffset:-36,id:'exhaust-exit',mode:'lane',camera:[.8,.58,-5.1],target:[0,1.3,2],fov:61,palette:6},
  {start:11.1,end:13.3,travelStart:8.5,travelEnd:13.3,travelOffset:-36,id:'boosted-pass',mode:'circuit',camera:[4.3,1.1,6.8],target:[0,.85,0],fov:55,palette:6},
  {start:13.3,end:15.7,id:'rally-finale',mode:'circuit',camera:[4.3,2.8,8.6],target:[0,1.4,0],fov:52,palette:6},
];
export const raceShot=t=>MOTOR_SHOTS.find(s=>t<s.end)||MOTOR_SHOTS.at(-1);
export const raceCamera=(t,input=.5)=>{const s=raceShot(t);return [s.camera[0]+(input-.5)*.12,s.camera[1],s.camera[2]];};
export function racePosition(seconds,index){
  const shot=raceShot(seconds),local=Math.max(0,Math.min(shot.end-shot.start,seconds-shot.start));
  const z=raceTravel(shot,seconds);
  if(isFlight(shot.mode)){const pose=flightPose(shot.mode,local,index);return {x:pose.position.x,y:pose.position.y,z:pose.position.z,quaternion:pose.quaternion,visible:true,foreground:shot.mode==='cosmic'&&index===0&&local>1.1&&local<2.3};}
  const driver=driverMotion(shot,seconds,index);
  if(shot.id==='starlit-lead')return {x:index===0?-.55:.5,y:0,z:z+driver.distance,yaw:0,visible:true};
  if(shot.id==='bumper-train')return {x:index===0?-.35:.1,y:0,z:z+driver.distance,yaw:0,visible:true};
  if(shot.id==='exhaust-exit'||shot.id==='boosted-pass')return {x:index===0?1.05:-1.05,y:0,z:z+driver.distance,yaw:0,visible:true};
  return {x:index===0?-1.6:1.6,y:0,z:z+driver.distance,yaw:0,visible:true};
}

export function createMotorScene(){
  const scene=new T.Scene(),perspective=new T.PerspectiveCamera(55,1,.08,150);
  const hemi=new T.HemisphereLight('#ffffff','#484848',1.6),sun=new T.DirectionalLight('#ffffff',2.1);
  hemi.layers.enable(1);sun.layers.enable(1);hemi.layers.enable(2);sun.layers.enable(2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-15,right:15,top:16,bottom:-15,near:.5,far:75});
  sun.shadow.normalBias=.04;scene.add(hemi,sun,sun.target);
  const city=createMotorCity(),circuit=createMotorCity({circuit:true});scene.add(city.root,circuit.root);
  for(const town of [city,circuit]){town.root.updateMatrixWorld(true);town.root.traverse(node=>{node.matrixAutoUpdate=false;node.matrixWorldAutoUpdate=false;});}
  const architectureBurst=createArchitectureBurst([city.architecture,city.bridge],city.root.userData.facades);
  scene.matrixWorldAutoUpdate=false;
  const cars=[createMotorCar('mini'),createMotorCar('z4')];cars.forEach(car=>scene.add(car));
  const cosmos=createMotorCosmos();scene.add(cosmos.root);
  const {portals,stars}=cosmos;
  const speedLines=createSpeedLines();scene.add(speedLines);
  const world={scene,architectureBurst,speedLines,camera:perspective,perspective,city,circuit,cars,portals,stars,cosmos,ready:true,width:1,height:1,shot:MOTOR_SHOTS[0],
    resize(w,h){world.width=w;world.height=h;perspective.aspect=w/h;perspective.updateProjectionMatrix();},
    update(frame,input=.5){
      const shot=raceShot(frame.t),local=Math.max(0,Math.min(shot.end-shot.start,frame.t-shot.start)),d=cameraTravel(shot,frame.t);
      world.shot=shot;world.lineArt=isMotorLineShot(shot);world.exposure=raceExposure(shot,frame.t,frame.idle);world.palette=motorPalette(shot.palette);world.camera=perspective;
      const camera=world.camera,abstract=isFlight(shot.mode);
      scene.background=new T.Color(abstract?'#02031a':'#bdbdbd');scene.fog=abstract?null:new T.Fog('#bdbdbd',30,110);
      hemi.color.set(abstract?'#a1a8ff':'#ffffff');hemi.groundColor.set(abstract?'#241142':'#484848');hemi.intensity=abstract?1.8:1.6;sun.color.set(abstract?'#e8ceff':'#ffffff');sun.intensity=abstract?2.4:2.1;sun.castShadow=!abstract;
      city.root.visible=shot.mode==='lane';circuit.root.visible=shot.mode==='circuit';
      architectureBurst.update(local,shot.id==='exhaust-exit');
      cars.forEach((car,index)=>{
        const p=racePosition(frame.t,index);car.visible=p.visible;car.position.set(p.x,p.y,p.z);setMotorCarSpace(car,abstract);if(p.quaternion)car.quaternion.copy(p.quaternion);else car.rotation.set(0,p.yaw,0);
        car.userData.wheels.forEach(w=>w.rotation.x=(raceTravel(shot,frame.t)+driverMotion(shot,frame.t,index).distance)/car.userData.tireRadius);
        car.traverse(node=>{
          node.layers.set(abstract||node.name==='contact-shadow'?0:1);
          if(p.foreground&&node.name!=='contact-shadow')node.layers.enable(2);
          if(node.name==='contact-shadow')node.visible=!abstract;
        });
        const driver=driverMotion(shot,frame.t,index),burst=driver.flame;
        car.userData.gaugeNeedles?.forEach((needle,i)=>needle.rotation.z=-1.25+(world.exposure.speed+(shot.id==='boosted-pass'?0:driver.velocity))*.065+i*.2);
        car.userData.flames.forEach((f,i)=>{f.visible=burst;f.scale.z=.8+.3*Math.sin(local*80+i);});
      });
      const pos=raceCamera(frame.t,input),narrow=world.width<650;
      if(abstract){const view=flightCamera(shot.mode,local,world.width/world.height);camera.position.copy(view.position);camera.up.set(0,1,0);camera.lookAt(view.target);camera.fov=view.fov;sun.position.copy(camera.position).add(new T.Vector3(-7,12,4));sun.target.position.copy(cars[0].position);}
      else {const widening=narrow&&shot.mode==='circuit'?1.25:1;camera.position.set(pos[0],pos[1]*widening,d+pos[2]*widening);camera.up.set(0,1,0);camera.lookAt(shot.target[0],shot.target[1],d+shot.target[2]);camera.fov=shot.fov+(narrow?16:0);sun.position.set(-9,23,d+8);sun.target.position.set(0,0,d);}
      // Scope phone reframing to the front lead and low exhaust setups. The
      // other four street cameras retain their original angle and composition.
      if(narrow&&shot.id==='starlit-lead'){
        camera.position.set(.35,2.1,d+18.5);camera.lookAt(0,.65,d+3.8);camera.fov=78;
      }else if(narrow&&shot.id==='exhaust-exit'){
        camera.position.set(.15,.7,d-8.8);camera.lookAt(shot.target[0],shot.target[1],d+shot.target[2]);camera.fov=84;
      }
      camera.updateProjectionMatrix();camera.updateMatrixWorld(true);sun.target.updateMatrixWorld();
      cosmos.update(shot.mode,local,camera);
      updateSpeedLines(speedLines,shot,frame.t,d,frame.idle);
      // All passes share the same analytic car and architectural-piece transforms.
      scene.updateMatrixWorld();
    },
  };
  return world;
}
export function createMotorWorld(canvas,{foreground=null}={}){
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'});}
  catch{return {available:false,ready:false,resize(){},paint(){}};}
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.info.autoReset=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const model=createMotorScene();
  const target=(samples=0)=>{const t=new T.WebGLRenderTarget(1,1,{samples});t.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);return t;};
  const environment=target(),vehicles=target(),blurred=new T.WebGLRenderTarget(1,1,{depthBuffer:false});
  if(renderer.extensions.has('EXT_color_buffer_float'))environment.texture.type=T.HalfFloatType;
  const composite=new T.Scene(),flatCamera=new T.Camera(),quad=new T.Mesh(new T.PlaneGeometry(2,2));composite.add(quad);
  const inks={ink:{value:new T.Color()},accent:{value:new T.Color()},paper:{value:new T.Color()}};
  const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
  const material=(fragmentShader,uniforms)=>new T.ShaderMaterial({uniforms,vertexShader,fragmentShader,depthTest:false,depthWrite:false,blending:T.NoBlending});
  const shutter=material(MOTOR_BACKGROUND_FRAGMENT,{...inks,source:{value:environment.texture},depthSource:{value:environment.depthTexture},
    inverseViewProjection:{value:new T.Matrix4()},previousViewProjection:{value:new T.Matrix4()},radialStretch:{value:0},moving:{value:false}});
  const finish=material(MOTOR_COMPOSITE_FRAGMENT,{...inks,background:{value:blurred.texture},cars:{value:vehicles.texture},environmentDepth:{value:environment.depthTexture},vehicleDepth:{value:vehicles.depthTexture}});
  const space=material(SPACE_FINISH_FRAGMENT,{source:{value:environment.texture},texel:{value:new T.Vector2(1,1)}});
  const spaceCutout=material(SPACE_FINISH_FRAGMENT.replace('varying vec2 vUv;','varying vec2 vUv;uniform sampler2D mask;').replace('#include <colorspace_fragment>','#include <colorspace_fragment>\n float alpha=texture2D(mask,vUv).a;gl_FragColor*=alpha;'),{...space.uniforms,mask:{value:vehicles.texture}});
  const normalMaterial=new T.MeshNormalMaterial({side:T.DoubleSide});normalMaterial.toneMapped=false;
  const lineArt=material(MOTOR_LINE_FRAGMENT,{...inks,source:{value:environment.texture},depthSource:{value:environment.depthTexture},cars:{value:vehicles.texture},carDepth:{value:vehicles.depthTexture},texel:{value:new T.Vector2()},inverseViewProjection:shutter.uniforms.inverseViewProjection,previousViewProjection:shutter.uniforms.previousViewProjection,moving:shutter.uniforms.moving,burst:{value:0}});
  if(foreground)foreground.hidden=true;
  const front=foreground?.getContext('2d'),previousWorld=new T.Matrix4(),previousView=new T.Matrix4(),currentVP=new T.Matrix4();
  function fullScreen(mat,target=null){quad.material=mat;renderer.setRenderTarget(target);renderer.render(composite,flatCamera);}
  function sharpCars(scene,camera,layer){
    const background=scene.background;scene.background=null;camera.layers.set(layer);renderer.shadowMap.autoUpdate=false;
    renderer.setClearColor(0,0);renderer.setRenderTarget(vehicles);renderer.render(scene,camera);
    scene.background=background;camera.layers.set(0);renderer.shadowMap.autoUpdate=true;
  }
  function normalPass(scene,camera,layer,target){
    const hidden=[],background=scene.background,fog=scene.fog,override=scene.overrideMaterial;
    scene.traverse(node=>{if(node.isLine||node.isPoints||node.name==='contact-shadow'){hidden.push([node,node.visible]);node.visible=false;}});
    scene.background=null;scene.fog=null;scene.overrideMaterial=normalMaterial;camera.layers.set(layer);renderer.shadowMap.autoUpdate=false;
    try{renderer.setClearColor(0,0);renderer.setRenderTarget(target);renderer.render(scene,camera);}
    finally{scene.background=background;scene.fog=fog;scene.overrideMaterial=override;camera.layers.set(0);renderer.shadowMap.autoUpdate=true;for(const [node,visible] of hidden)node.visible=visible;}
  }
  const world={available:true,ready:true,model,renderer,
    resize(w,h){
      const ratio=Math.min(globalThis.devicePixelRatio||1,1.5,Math.sqrt(2600000/(w*h)));
      renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);model.resize(w,h);
      const size=new T.Vector2();renderer.getDrawingBufferSize(size);environment.setSize(size.x,size.y);vehicles.setSize(size.x,size.y);blurred.setSize(Math.ceil(size.x*.65),Math.ceil(size.y*.65));
      lineArt.uniforms.texel.value.set(1/size.x,1/size.y);space.uniforms.texel.value.set(1/size.x,1/size.y);spaceCutout.uniforms.texel.value.copy(space.uniforms.texel.value);
      if(foreground){foreground.width=size.x;foreground.height=size.y;}
    },
    paint(frame,input){
      renderer.info.reset();model.update(frame,input);const {scene,camera,palette,shot,exposure}=model;
      for(const key of ['ink','accent','paper'])inks[key].value.set(palette[key]);
      camera.updateMatrixWorld(true);currentVP.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
      shutter.uniforms.inverseViewProjection.value.copy(currentVP).invert();
      previousWorld.copy(camera.matrixWorld);
      if(['lane','circuit'].includes(shot.mode))previousWorld.elements[14]-=exposure.speed*exposure.shutter;
      previousView.copy(previousWorld).invert();shutter.uniforms.previousViewProjection.value.multiplyMatrices(camera.projectionMatrix,previousView);
      shutter.uniforms.radialStretch.value=exposure.radial;shutter.uniforms.moving.value=exposure.enabled;
      lineArt.uniforms.burst.value=shot.id==='exhaust-exit'?Math.min(1,driverMotion(shot,frame.t,1).velocity/13):0;
      if(model.lineArt){
        if(foreground)foreground.hidden=true;
        normalPass(scene,camera,0,environment);normalPass(scene,camera,1,vehicles);fullScreen(lineArt);return;
      }
      if(isFlight(shot.mode)){
        camera.layers.set(0);renderer.setRenderTarget(environment);renderer.render(scene,camera);
        const crossing=model.cars.some(car=>car.getObjectByName('curved-body-with-wheel-arches').layers.isEnabled(2));
        if(foreground)foreground.hidden=!crossing;
        if(front&&crossing){front.clearRect(0,0,foreground.width,foreground.height);sharpCars(scene,camera,2);fullScreen(spaceCutout);front.drawImage(canvas,0,0);}
        fullScreen(space);return;
      }
      // Only scenery enters the shutter pass. Vehicles are depth-composited sharp.
      camera.layers.set(0);renderer.setRenderTarget(environment);renderer.render(scene,camera);
      fullScreen(shutter,blurred);
      if(foreground)foreground.hidden=true;
      sharpCars(scene,camera,1);
      // The complete composition is always last; no transient cutout is presented.
      fullScreen(finish);
    },
  };
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();world.available=false;world.ready=false;world.onUnavailable?.();});
  return world;
}
