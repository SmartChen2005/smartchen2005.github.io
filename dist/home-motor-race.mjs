import {T} from './home-motor-geometry.mjs?rev=20261025-cosmic';
import {createMotorCar} from './home-motor-cars.mjs?rev=20261025-road';
import {createMotorCity} from './home-motor-city.mjs?rev=20261025-road';
import {motorPalette,MOTOR_PALETTES} from './home-motor-palette.mjs?rev=20261025-road';
import {raceTravel,cameraTravel,driverMotion,raceExposure,createSpeedLines,updateSpeedLines} from './home-motor-speed.mjs?rev=20261025-road';
import {isMotorLineShot,MOTOR_LINE_FRAGMENT} from './home-motor-line.mjs?rev=20261025-road';
import {createArchitectureBurst} from './home-motor-burst.mjs?rev=20261025-road';
import {createMotorGuide} from './home-motor-guide.mjs?rev=20261025-road';
import {guideFrame,guidePoint,cameraRise,laneProgress,prepareGuideRoutes,ease,ROAD_FADE_GLSL,loopViewWeight,LOOP_ENTRY,LOOP_RADIUS,LOOP_SHIFT,LOOP_END,LOOP_FORWARD,LOOP_RIGHT} from './home-motor-path.mjs?rev=20261025-road';
import {createOpeningStreet,openingCar,OPENING_SPEED} from './home-motor-opening.mjs?rev=20261025-road';
export {motorPalette,MOTOR_PALETTES};
export const MOTOR_SHOTS=[
 {start:0,end:1,id:'starlit-lead',mode:'lane',camera:[2.35,1.2,15.8],target:[-3.2,2.4,4],fov:62,palette:0},
 {start:1,end:2.8,id:'bumper-train',mode:'lane',camera:[.65,.65,-5.5],target:[0,1.35,5],fov:65,palette:0},
 {start:2.8,end:4.7,id:'city-circuit',mode:'circuit',camera:[1.9,13.5,-7.5],target:[0,.2,2.6],fov:54,palette:0},
 {start:4.7,end:9.3,travelStart:4.7,travelEnd:20.65,travelRamp:11,travelOffset:-36,id:'exhaust-exit',mode:'lane',camera:[.8,.58,-5.1],target:[0,1.3,2],fov:61,palette:0},
 {start:9.3,end:19,travelStart:4.7,travelEnd:20.65,travelRamp:11,travelOffset:-36,id:'grid-guide',mode:'tunnel',camera:[.8,.58,-5.1],target:[0,1.3,2],fov:61,palette:0},
 {start:19,end:20.65,travelStart:4.7,travelEnd:20.65,travelRamp:11,travelOffset:-36,id:'space-pass',mode:'space',camera:[0,.8,50],target:[0,.8,0],fov:48,palette:0},
];
export const raceShot=t=>MOTOR_SHOTS.find(s=>t<s.end)||MOTOR_SHOTS.at(-1);
export const raceCamera=(t,input=.5)=>{const s=raceShot(t);return [s.camera[0]+(input-.5)*.12,s.camera[1],s.camera[2]];};
export function racePosition(t,index,openingTime=null){
 const shot=raceShot(t),z=raceTravel(shot,t),driver=driverMotion(shot,t,index);
 if(shot.id==='starlit-lead'&&openingTime!==null){const p=openingCar(openingTime,index);return {x:index===0?-.55:.5,y:0,z:p.offset,distance:p.distance,yaw:0,visible:true};}
 if(shot.id==='starlit-lead')return {x:index===0?-.55:.5,y:0,z:z+driver.distance,yaw:0,visible:true};
 if(shot.id==='bumper-train')return {x:-.35,y:0,z:z+driver.distance,yaw:0,visible:index===0};
 if(shot.id==='city-circuit')return {x:index===0?1.05:-1.05,y:0,z:z+driver.distance,yaw:0,visible:true};
 const lane=index===0?1.05:-1.05,distance=z+driver.distance,progress=laneProgress(distance,lane),pose=guideFrame(progress),point=guidePoint(progress,index===0?1.05:-1.05);
 return {x:point.x,y:point.y,z:point.z,progress,distance,quaternion:pose.quaternion.toArray(),yaw:Math.atan2(pose.tangent.x,pose.tangent.z),visible:true};
}
export function raceView(t,width=1440,height=900,input=.5,sentenceBottom=0,openingTime=null){
 const shot=raceShot(t),distance=cameraTravel(shot,t),d=openingTime!==null?0:['exhaust-exit','grid-guide'].includes(shot.id)?laneProgress(distance):distance,narrow=width<650,p=raceCamera(t,input),widen=narrow&&shot.mode==='circuit'?1.22:1;
 let position=new T.Vector3(p[0],p[1]*widen,d+p[2]*widen),target=new T.Vector3(shot.target[0],shot.target[1],d+shot.target[2]),fov=shot.fov+(narrow?16:0),up=new T.Vector3(0,1,0);
 if(narrow&&shot.id==='starlit-lead'){position.set(.35,2.1,d+18.5);target.set(-1.7,5.15+Math.max(0,sentenceBottom/height+.02-.64)*25,d+3.8);fov=78;}
 if(narrow&&shot.id==='bumper-train'){position.set(.15,.7,d-7.5);target.set(-.35,1,d+1);fov=78;}
 if(['exhaust-exit','grid-guide'].includes(shot.id)){
  const r=cameraRise(t-shot.travelStart),pose=guideFrame(d+7*r),x=narrow?.15+.55*r:.8+8.2*r,y=narrow?.7+9.8*r:.58+7*r,rear=narrow?8.8+13*r:5.1+7*r;
  position=pose.position.clone().addScaledVector(pose.right,x+(input-.5)*.12).addScaledVector(pose.up,y).addScaledVector(pose.tangent,-rear);
  target=guidePoint(d+2+6*r,0,1.3-.5*r);up=pose.up.clone().lerp(new T.Vector3(0,1,0),.65*r).normalize();fov=narrow?84-17*r:61-7*r;
  const wide=loopViewWeight(d),center=LOOP_ENTRY.clone().addScaledVector(LOOP_RIGHT,LOOP_SHIFT/2).add(new T.Vector3(0,LOOP_RADIUS,0)),eye=center.clone().addScaledVector(LOOP_RIGHT,narrow?100:62).addScaledVector(LOOP_FORWARD,narrow?-40:-48).add(new T.Vector3(0,narrow?22:26,0));
  position.lerp(eye,wide);target.lerp(center.clone().lerp(guidePoint(d+8),.16+.68*ease((d-LOOP_END)/45)),wide);up.lerp(new T.Vector3(0,1,0),wide).normalize();fov+=(narrow?60-fov:46-fov)*wide;
 }
 if(shot.mode==='space'){
  // A fixed camera between the two actual outgoing lanes faces their noses.
  // MINI's +right lane projects screen-right; the slightly leading Z4 passes left first.
  const a=racePosition(shot.start,0),b=racePosition(shot.start,1),pose=guideFrame((a.progress+b.progress)/2);
  position=new T.Vector3((a.x+b.x)/2,(a.y+b.y)/2+.72,(a.z+b.z)/2).addScaledVector(pose.tangent,50);
  target=position.clone().addScaledVector(pose.tangent,-50);up=pose.up;fov=narrow?72:48;
 }
 return {position,target,up,fov};
}
function applyView(camera,view){camera.position.copy(view.position);camera.up.copy(view.up);camera.fov=view.fov;camera.lookAt(view.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);}
export function createMotorScene(){
 prepareGuideRoutes();
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(61,1,.08,180),city=createMotorCity(),circuit=createMotorCity({circuit:true});scene.add(city.root,circuit.root);
 for(const town of [city,circuit]){town.root.updateMatrixWorld(true);town.root.traverse(n=>{n.matrixAutoUpdate=false;n.matrixWorldAutoUpdate=false;});}
 const architectureBurst=createArchitectureBurst([city.architecture,city.bridge,city.lamps],city.root.userData.facades),cars=[createMotorCar('mini'),createMotorCar('z4')],guide=createMotorGuide(),speedLines=createSpeedLines();
 const openingStreet=createOpeningStreet(city);cars.forEach(c=>scene.add(c));scene.add(guide.root,speedLines);scene.matrixWorldAutoUpdate=false;
 const world={scene,camera,perspective:camera,city,circuit,cars,guide,architectureBurst,openingStreet,speedLines,width:1,height:1,ready:true,shot:MOTOR_SHOTS[0],
  resize(w,h,band){this.width=w;this.height=h;this.sentenceBottom=band?.bottom||0;camera.aspect=w/h;camera.updateProjectionMatrix();},
  update(frame,input=.5){
   const shot=raceShot(frame.t),boost=['exhaust-exit','grid-guide'].includes(shot.id),local=boost?frame.t-shot.travelStart:frame.t-shot.start,d=boost?laneProgress(cameraTravel(shot,frame.t)):cameraTravel(shot,frame.t);
   const opening=frame.openingTime!==undefined; if(!opening)openingStreet.update(false);
   this.loopFocus=boost?loopViewWeight(d):0;this.shot=shot;this.lineArt=isMotorLineShot(shot);this.exposure=raceExposure(shot,frame.t,frame.idle);this.palette=motorPalette(shot.palette);
   city.root.visible=shot.mode==='lane'||shot.mode==='tunnel';circuit.root.visible=shot.mode==='circuit';city.road.visible=!boost;architectureBurst.update(local,boost);if(opening)openingStreet.update(true,OPENING_SPEED*frame.openingTime);if(opening)this.exposure={...this.exposure,speed:OPENING_SPEED,baseSpeed:OPENING_SPEED};
   cars.forEach((car,index)=>{const p=racePosition(frame.t,index,opening?frame.openingTime:null),driver=driverMotion(shot,frame.t,index);car.visible=p.visible;car.position.set(p.x,p.y,p.z);if(p.quaternion)car.quaternion.fromArray(p.quaternion);else car.rotation.set(0,p.yaw,0);
    car.traverse(n=>{n.layers.set(1);if(n.name==='contact-shadow')n.visible=false;});
    car.userData.wheels.forEach(w=>w.rotation.x=(p.distance??(raceTravel(shot,frame.t)+driver.distance))/car.userData.tireRadius);
    car.userData.gaugeNeedles?.forEach((n,i)=>n.rotation.z=-1.25+(this.exposure.baseSpeed+driver.velocity)*.065+i*.2);
    car.userData.flames.forEach((f,i)=>{f.visible=driver.flame;f.scale.z=.8+.3*Math.sin(local*80+i);});
   });
   applyView(camera,raceView(frame.t,this.width,this.height,input,this.sentenceBottom,opening?frame.openingTime:null));guide.update(local,d,boost,frame.idle);updateSpeedLines(speedLines,shot,opening?frame.openingTime:frame.t,opening?0:d,frame.idle);scene.updateMatrixWorld();
  }};
 return world;
}
export function createMotorWorld(canvas,{foreground=null}={}){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'});}catch{return {available:false,ready:false,resize(){},paint(){}};}
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.info.autoReset=false;
 const model=createMotorScene(),target=()=>{const t=new T.WebGLRenderTarget(1,1);t.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);return t;},environment=target(),vehicles=target(),lights=target();
 const normal=new T.MeshNormalMaterial({side:T.DoubleSide});normal.toneMapped=false;
 const roadNormal=new T.MeshNormalMaterial({side:T.DoubleSide});roadNormal.toneMapped=false;roadNormal.blending=T.NoBlending;
 const roadTime={value:0},roadTravel={value:0};
 roadNormal.onBeforeCompile=shader=>{shader.uniforms.roadLocal=roadTime;shader.uniforms.roadTravel=roadTravel;
  shader.vertexShader='varying float roadZ;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 roadWorld=vec4(transformed,1.);
   #ifdef USE_INSTANCING
    roadWorld=instanceMatrix*roadWorld;
   #endif
   roadZ=(modelMatrix*roadWorld).z;`);
  shader.fragmentShader=ROAD_FADE_GLSL+'\n'+shader.fragmentShader.replace('opacity );','opacity * roadVisibility() );');};
 const composite=new T.Scene(),flatCamera=new T.Camera(),quad=new T.Mesh(new T.PlaneGeometry(2,2));composite.add(quad);
 const uniforms={source:{value:environment.texture},depthSource:{value:environment.depthTexture},cars:{value:vehicles.texture},carDepth:{value:vehicles.depthTexture},lampSource:{value:lights.texture},lampDepth:{value:lights.depthTexture},texel:{value:new T.Vector2()},ink:{value:new T.Color()},accent:{value:new T.Color()},paper:{value:new T.Color()},inverseViewProjection:{value:new T.Matrix4()},previousViewProjection:{value:new T.Matrix4()},burst:{value:0},loopFocus:{value:0},moving:{value:true}};
 const finish=new T.ShaderMaterial({uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:MOTOR_LINE_FRAGMENT,depthTest:false,depthWrite:false,blending:T.NoBlending});quad.material=finish;
 if(foreground)foreground.hidden=true;
 const previousCamera=new T.PerspectiveCamera(61,1,.08,180),vp=new T.Matrix4();
 function capture(layer,target,override,clear=true){const hidden=[];model.scene.traverse(n=>{if(n.isLine||n.isPoints||n.name==='contact-shadow'){hidden.push([n,n.visible]);n.visible=false;}});const saved=model.scene.overrideMaterial,savedClear=renderer.autoClear;try{renderer.autoClear=clear;model.scene.overrideMaterial=override;model.camera.layers.set(layer);renderer.setClearColor(0,0);renderer.setRenderTarget(target);renderer.render(model.scene,model.camera);}finally{renderer.autoClear=savedClear;model.scene.overrideMaterial=saved;for(const [n,v]of hidden)n.visible=v;}}
 const world={available:true,ready:true,model,renderer,
  resize(w,h,band){const ratio=Math.min(globalThis.devicePixelRatio||1,1.5,Math.sqrt(2600000/(w*h)));renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);model.resize(w,h,band);const size=renderer.getDrawingBufferSize(new T.Vector2());for(const t of [environment,vehicles,lights])t.setSize(size.x,size.y);uniforms.texel.value.set(1/size.x,1/size.y);},
  paint(frame,input){renderer.info.reset();model.update(frame,input);for(const key of ['ink','accent','paper'])uniforms[key].value.set(model.palette[key]);const {camera,exposure,shot}=model;
   vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);uniforms.inverseViewProjection.value.copy(vp).invert();previousCamera.aspect=camera.aspect;applyView(previousCamera,raceView(Math.max(shot.travelStart??shot.start,frame.t-exposure.shutter),model.width,model.height,input,model.sentenceBottom,frame.openingTime??null));if(frame.openingTime!==undefined){previousCamera.position.z-=OPENING_SPEED*exposure.shutter;previousCamera.updateMatrixWorld(true);}uniforms.previousViewProjection.value.multiplyMatrices(previousCamera.projectionMatrix,previousCamera.matrixWorldInverse);uniforms.moving.value=exposure.enabled;uniforms.loopFocus.value=model.loopFocus;uniforms.burst.value=['exhaust-exit','grid-guide'].includes(shot.id)?Math.min(1,driverMotion(shot,frame.t,1).velocity/13):0;
   capture(0,environment,normal);if(model.guide.root.visible&&model.guide.track.visible){roadTime.value=frame.t-shot.travelStart;roadTravel.value=laneProgress(cameraTravel(shot,frame.t));capture(2,environment,roadNormal,false);}capture(1,vehicles,normal);capture(3,lights,null);camera.layers.set(0);renderer.setRenderTarget(null);renderer.render(composite,flatCamera);
  }};
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();world.available=world.ready=false;world.onUnavailable?.();});return world;
}
