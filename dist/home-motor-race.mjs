import {T} from './home-motor-geometry.mjs?rev=20261025-cosmic';
import {createMotorCar} from './home-motor-cars.mjs?rev=20261025-graphite';
import {createMotorCity} from './home-motor-city.mjs?rev=20261025-graphite';
import {motorPalette,MOTOR_PALETTES} from './home-motor-palette.mjs?rev=20261025-graphite';
import {raceTravel,cameraTravel,driverMotion,raceExposure,createSpeedLines,updateSpeedLines} from './home-motor-speed.mjs?rev=20261025-graphite';
import {isMotorLineShot,MOTOR_LINE_FRAGMENT} from './home-motor-line.mjs?rev=20261025-graphite';
import {createArchitectureBurst} from './home-motor-burst.mjs?rev=20261025-graphite';
import {createMotorGuide} from './home-motor-guide.mjs?rev=20261025-graphite';
export {motorPalette,MOTOR_PALETTES};
export const MOTOR_SHOTS=[
 {start:0,end:2.2,id:'starlit-lead',mode:'lane',camera:[2.35,1.2,15.8],target:[0,1.1,4],fov:62,palette:0},
 {start:2.2,end:4.4,id:'bumper-train',mode:'lane',camera:[.65,.65,-5.5],target:[0,1.35,5],fov:65,palette:0},
 {start:4.4,end:6.7,id:'city-circuit',mode:'circuit',camera:[0,18,1.5],target:[0,0,1.5],fov:54,palette:0},
 {start:6.7,end:11.3,travelStart:6.7,travelEnd:17.7,travelOffset:-36,id:'exhaust-exit',mode:'lane',camera:[.8,.58,-5.1],target:[0,1.3,2],fov:61,palette:0},
 {start:11.3,end:17.7,travelStart:6.7,travelEnd:17.7,travelOffset:-36,id:'grid-guide',mode:'tunnel',camera:[.8,.58,-5.1],target:[0,1.3,2],fov:61,palette:0},
];
export const raceShot=t=>MOTOR_SHOTS.find(s=>t<s.end)||MOTOR_SHOTS.at(-1);
export const raceCamera=(t,input=.5)=>{const s=raceShot(t);return [s.camera[0]+(input-.5)*.12,s.camera[1],s.camera[2]];};
export function racePosition(t,index){
 const shot=raceShot(t),z=raceTravel(shot,t),driver=driverMotion(shot,t,index);
 if(shot.id==='starlit-lead')return {x:index===0?-.55:.5,y:0,z:z+driver.distance,yaw:0,visible:true};
 if(shot.id==='bumper-train')return {x:-.35,y:0,z:z+driver.distance,yaw:0,visible:index===0};
 if(shot.id==='city-circuit')return {x:index===0?1.5:-1.5,y:0,z:z+driver.distance,yaw:0,visible:true};
 return {x:index===0?1.05:-1.05,y:0,z:z+driver.distance,yaw:0,visible:true};
}
export function createMotorScene(){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(61,1,.08,180),city=createMotorCity(),circuit=createMotorCity({circuit:true});scene.add(city.root,circuit.root);
 for(const town of [city,circuit]){town.root.updateMatrixWorld(true);town.root.traverse(n=>{n.matrixAutoUpdate=false;n.matrixWorldAutoUpdate=false;});}
 const architectureBurst=createArchitectureBurst([city.architecture,city.bridge,city.lamps],city.root.userData.facades),cars=[createMotorCar('mini'),createMotorCar('z4')],guide=createMotorGuide(),speedLines=createSpeedLines();
 cars.forEach(c=>scene.add(c));scene.add(guide.root,speedLines);scene.matrixWorldAutoUpdate=false;
 const world={scene,camera,perspective:camera,city,circuit,cars,guide,architectureBurst,speedLines,width:1,height:1,ready:true,shot:MOTOR_SHOTS[0],
  resize(w,h){this.width=w;this.height=h;camera.aspect=w/h;camera.updateProjectionMatrix();},
  update(frame,input=.5){
   const shot=raceShot(frame.t),boost=['exhaust-exit','grid-guide'].includes(shot.id),local=boost?frame.t-shot.travelStart:frame.t-shot.start,d=cameraTravel(shot,frame.t),narrow=this.width<650;
   this.shot=shot;this.lineArt=isMotorLineShot(shot);this.exposure=raceExposure(shot,frame.t,frame.idle);this.palette=motorPalette(shot.palette);
   city.root.visible=shot.mode==='lane'||shot.mode==='tunnel';circuit.root.visible=shot.mode==='circuit';city.road.visible=!boost;architectureBurst.update(local,boost);
   cars.forEach((car,index)=>{const p=racePosition(frame.t,index),driver=driverMotion(shot,frame.t,index);car.visible=p.visible;car.position.set(p.x,p.y,p.z);car.rotation.set(0,p.yaw,0);
    car.traverse(n=>{n.layers.set(1);if(n.name==='contact-shadow')n.visible=false;});
    car.userData.wheels.forEach(w=>w.rotation.x=(raceTravel(shot,frame.t)+driver.distance)/car.userData.tireRadius);
    car.userData.gaugeNeedles?.forEach((n,i)=>n.rotation.z=-1.25+(this.exposure.baseSpeed+driver.velocity)*.065+i*.2);
    car.userData.flames.forEach((f,i)=>{f.visible=driver.flame;f.scale.z=.8+.3*Math.sin(local*80+i);});
   });
   const p=raceCamera(frame.t,input),widen=narrow&&shot.mode==='circuit'?1.25:1;camera.up.set(0,1,0);camera.position.set(p[0],p[1]*widen,d+p[2]*widen);camera.lookAt(shot.target[0],shot.target[1],d+shot.target[2]);camera.fov=shot.fov+(narrow?16:0);
   if(shot.id==='city-circuit'){camera.up.set(0,0,1);camera.lookAt(0,0,d+1.5);}
   if(narrow&&shot.id==='starlit-lead'){camera.position.set(.35,2.1,d+18.5);camera.lookAt(0,.65,d+3.8);camera.fov=78;}
   if(narrow&&boost){camera.position.set(.15,.7,d-8.8);camera.lookAt(0,1.3,d+2);camera.fov=84;}
   camera.updateProjectionMatrix();camera.updateMatrixWorld(true);guide.update(local,d,boost,frame.idle);updateSpeedLines(speedLines,shot,frame.t,d,frame.idle);scene.updateMatrixWorld();
  }};
 return world;
}
export function createMotorWorld(canvas,{foreground=null}={}){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'});}catch{return {available:false,ready:false,resize(){},paint(){}};}
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.info.autoReset=false;
 const model=createMotorScene(),target=()=>{const t=new T.WebGLRenderTarget(1,1);t.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);return t;},environment=target(),vehicles=target(),lights=target();
 const normal=new T.MeshNormalMaterial({side:T.DoubleSide});normal.toneMapped=false;
 const composite=new T.Scene(),flatCamera=new T.Camera(),quad=new T.Mesh(new T.PlaneGeometry(2,2));composite.add(quad);
 const uniforms={source:{value:environment.texture},depthSource:{value:environment.depthTexture},cars:{value:vehicles.texture},carDepth:{value:vehicles.depthTexture},lampSource:{value:lights.texture},lampDepth:{value:lights.depthTexture},texel:{value:new T.Vector2()},ink:{value:new T.Color()},accent:{value:new T.Color()},paper:{value:new T.Color()},inverseViewProjection:{value:new T.Matrix4()},previousViewProjection:{value:new T.Matrix4()},burst:{value:0},moving:{value:true}};
 const finish=new T.ShaderMaterial({uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:MOTOR_LINE_FRAGMENT,depthTest:false,depthWrite:false,blending:T.NoBlending});quad.material=finish;
 if(foreground)foreground.hidden=true;
 const previous=new T.Matrix4(),vp=new T.Matrix4();
 function capture(layer,target,override){const hidden=[];model.scene.traverse(n=>{if(n.isLine||n.isPoints||n.name==='contact-shadow'){hidden.push([n,n.visible]);n.visible=false;}});const saved=model.scene.overrideMaterial;try{model.scene.overrideMaterial=override;model.camera.layers.set(layer);renderer.setClearColor(0,0);renderer.setRenderTarget(target);renderer.render(model.scene,model.camera);}finally{model.scene.overrideMaterial=saved;for(const [n,v]of hidden)n.visible=v;}}
 const world={available:true,ready:true,model,renderer,
  resize(w,h){const ratio=Math.min(globalThis.devicePixelRatio||1,1.5,Math.sqrt(2600000/(w*h)));renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);model.resize(w,h);const size=renderer.getDrawingBufferSize(new T.Vector2());for(const t of [environment,vehicles,lights])t.setSize(size.x,size.y);uniforms.texel.value.set(1/size.x,1/size.y);},
  paint(frame,input){renderer.info.reset();model.update(frame,input);for(const key of ['ink','accent','paper'])uniforms[key].value.set(model.palette[key]);const {camera,exposure,shot}=model;
   vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);uniforms.inverseViewProjection.value.copy(vp).invert();previous.copy(camera.matrixWorld);previous.elements[14]-=exposure.speed*exposure.shutter;uniforms.previousViewProjection.value.multiplyMatrices(camera.projectionMatrix,previous.invert());uniforms.moving.value=exposure.enabled;uniforms.burst.value=['exhaust-exit','grid-guide'].includes(shot.id)?Math.min(1,driverMotion(shot,frame.t,1).velocity/13):0;
   capture(0,environment,normal);capture(1,vehicles,normal);capture(3,lights,null);camera.layers.set(0);renderer.setRenderTarget(null);renderer.render(composite,flatCamera);
  }};
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();world.available=world.ready=false;world.onUnavailable?.();});return world;
}
