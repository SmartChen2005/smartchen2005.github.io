import { T } from './home-motor-geometry.mjs?rev=20261025-cosmic';
import { motion } from './home-motor-motion.mjs?rev=20261025-cosmic';
const up=new T.Vector3(0,1,0),v=(x,y,z)=>new T.Vector3(x,y,z);
export const isFlight=mode=>['grid','cosmic','warp'].includes(mode);
export function flightCenter(mode,s){
  if(mode==='cosmic'){const a=-.85+s*1.75;return v(15*Math.sin(a),-2.7+4.4*s+.8*Math.sin(Math.PI*s),10*Math.cos(a)-5);}
  return mode==='grid'?v(3.2*Math.sin(s*.045),.7*Math.sin(s*.03)-1.2,-s):v(3*Math.sin(s*.035),1.5*Math.cos(s*.025)-1.5,-s);
}
export function flightPose(mode,local,index){
  const s=mode==='cosmic'?.04+.92*local/3.5-index*.11+.008*Math.sin(local*2.7+index):
    local*(mode==='grid'?18:25)+11+(index===0?0:-4.5)+.35*Math.sin(local*2.2+index);
  const position=flightCenter(mode,s),tangent=flightCenter(mode,s+.001).sub(flightCenter(mode,s-.001)).normalize();
  const side=new T.Vector3().crossVectors(up,tangent).normalize(),normal=new T.Vector3().crossVectors(tangent,side).normalize();
  const lane=(index===0?-1:1)*1.12;
  position.addScaledVector(side,lane);
  const quaternion=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(side,normal,tangent));
  const bank=mode==='cosmic'?-.23+.06*Math.sin(local*1.8):.055*Math.sin(s*.045);
  quaternion.multiply(new T.Quaternion().setFromAxisAngle(v(0,0,1),bank));
  return {position,tangent,quaternion,s,bank};
}
export function flightCamera(mode,local,aspect=1.6){
  if(mode==='cosmic')return {position:v(0,aspect<.8?12:5.8,aspect<.8?36:17),target:v(0,-.3,0),fov:58};
  const s=local*(mode==='grid'?18:25)+11,front=mode==='warp';
  return {position:flightCenter(mode,s+(front?9:-12.5)).add(v(front?-.2:.15,front?2:2.6,0)),
    target:flightCenter(mode,s+(front?-3:8)).add(v(0,front?2.2:.7,0)),fov:aspect<.8?83:front?67:66};
}
const planeVertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const galaxyFragment=`
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
void main(){
 vec2 p=(vUv-.5)*vec2(2.8,2.);p+=.055*vec2(sin(p.y*8.),cos(p.x*7.));float r=length(p);
 float grain=noise(p*85.),cloud=noise(p*6.)*.55+noise(p*17.)*.3+grain*.15;
 float spiral=pow(.5+.5*sin(r*25.+p.x*3.+cloud*1.8),4.);
 float arms=spiral*exp(-r*2.1)*(1.-smoothstep(.2,1.3,r));
 float core=exp(-r*r*45.);float haze=exp(-r*r*3.2)*(.32+cloud*.4);
 vec3 color=vec3(.16,.025,.48)*haze+vec3(1.4,.025,.85)*arms*1.25+vec3(.05,.45,.85)*arms*noise(p*9.+4.)+vec3(.48,1.8,2.4)*core;
 float brush=step(.64,noise(floor(p*vec2(150.,260.))/8.));color+=vec3(.18,.035,.3)*brush*arms;
 float alpha=(1.-smoothstep(.35,1.3,r))*(.5+haze*.45);gl_FragColor=vec4(color,alpha);
}`;
function starMap(){
  const n=64,data=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const dx=(x+.5)/n*2-1,dy=(y+.5)/n*2-1,r=Math.hypot(dx,dy),core=Math.exp(-r*r*85),halo=Math.exp(-r*7)*.32,cross=Math.exp(-Math.min(Math.abs(dx),Math.abs(dy))*130)*Math.exp(-r*4)*.15,k=(y*n+x)*4;data[k]=data[k+1]=data[k+2]=255;data[k+3]=Math.min(255,Math.round((core+halo+cross)*255));}
  const map=new T.DataTexture(data,n,n,T.RGBAFormat);map.needsUpdate=true;return map;
}
function ribbon(color,width){
  const n=96,geometry=new T.BufferGeometry(),positions=new Float32Array((n+1)*6),uv=new Float32Array((n+1)*4),indices=[];
  for(let i=0;i<=n;i++){uv.set([0,i/n,1,i/n],i*4);if(i<n){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
  geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('uv',new T.BufferAttribute(uv,2));geometry.setIndex(indices);
  const material=new T.ShaderMaterial({uniforms:{color:{value:new T.Color(color)},strength:{value:width>.2?.78:2.1}},vertexShader:planeVertex,fragmentShader:`uniform vec3 color;uniform float strength;varying vec2 vUv;void main(){float edge=pow(max(0.,1.-abs(vUv.x*2.-1.)),1.7);float age=pow(vUv.y,1.1);gl_FragColor=vec4(color*strength,edge*age*.78);}`,transparent:true,blending:T.AdditiveBlending,side:T.DoubleSide,depthWrite:false});
  const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;mesh.userData.width=width;return mesh;
}
export function updateFlightTrail(mesh,mode,local,index,offset=0){
  const arr=mesh.geometry.attributes.position.array,n=arr.length/6-1,width=mesh.userData.width;
  for(let i=0;i<=n;i++){
    const time=local-(1-i/n)*(mode==='cosmic'?2.8:1.35),pose=flightPose(mode,time,index);
    // Each trail originates behind the same moving, banked chassis, not on a screen-space overlay.
    const center=v(offset,.18,-2.12).applyQuaternion(pose.quaternion).add(pose.position),side=v(1,0,0).applyQuaternion(pose.quaternion);
    center.clone().addScaledVector(side,-width).toArray(arr,i*6);center.addScaledVector(side,width).toArray(arr,i*6+3);
  }
  mesh.geometry.attributes.position.needsUpdate=true;
}
export function updateGridTrace(line,local,index,offset){
  const positions=line.geometry.attributes.position.array,count=positions.length/3;
  for(let i=0;i<count;i++){
    const pose=flightPose('grid',local-(1-i/(count-1))*.14,index);
    v(offset,.69,-2.13).applyQuaternion(pose.quaternion).add(pose.position).toArray(positions,i*3);
  }
  line.geometry.attributes.position.needsUpdate=true;
}
export function createMotorCosmos(){
  const root=new T.Group();root.name='shared-depth-cosmos';
  const sky=new T.Mesh(new T.SphereGeometry(140,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 dir;void main(){vec3 d=normalize(dir);float cloud=pow(max(0.,1.-abs(d.y+.15)),8.);gl_FragColor=vec4(vec3(.0015,.002,.014)+vec3(.012,.002,.026)*cloud,1.);}'}));root.add(sky);
  const galaxy=new T.Mesh(new T.PlaneGeometry(108,43),new T.ShaderMaterial({vertexShader:planeVertex,fragmentShader:galaxyFragment,transparent:true,depthWrite:false,side:T.DoubleSide}));
  galaxy.position.set(-3,-4,-42);galaxy.rotation.set(.12,.05,.21);root.add(galaxy);
  const starsGeo=new T.BufferGeometry(),pos=[],colors=[];
  for(let i=0;i<1800;i++){const a=motion.rand(i,51)*Math.PI*2,z=motion.rand(i,52)*2-1,r=28+motion.rand(i,53)*100,k=Math.sqrt(1-z*z);pos.push(Math.cos(a)*k*r,z*r,Math.sin(a)*k*r);new T.Color(i%9===0?'#f3a8e8':i%4===0?'#72dfee':'#bdc8ff').toArray(colors,i*3);}
  starsGeo.setAttribute('position',new T.Float32BufferAttribute(pos,3));starsGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const map=starMap(),stars=new T.Points(starsGeo,new T.PointsMaterial({size:.75,map,transparent:true,vertexColors:true,blending:T.AdditiveBlending,depthWrite:false}));root.add(stars);
  const sparksGeo=new T.BufferGeometry();sparksGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(220*3),3).setUsage(T.DynamicDrawUsage));const sparkColors=[];for(let i=0;i<220;i++)new T.Color(i%2?'#dd80ff':'#90f1ff').toArray(sparkColors,i*3);sparksGeo.setAttribute('color',new T.Float32BufferAttribute(sparkColors,3));const sparks=new T.Points(sparksGeo,new T.PointsMaterial({size:.16,map,transparent:true,opacity:.85,vertexColors:true,blending:T.AdditiveBlending,depthWrite:false}));sparks.frustumCulled=false;root.add(sparks);
  const trails=[];for(let i=0;i<2;i++)for(const offset of [-.53,.53,0]){const mesh=ribbon(i===0?'#59eaff':'#df62ff',offset===0?.42:.055);root.add(mesh);trails.push({mesh,index:i,offset});}
  const gridTraces=[];
  for(let index=0;index<2;index++)for(const offset of [-.5,.5]){
    const count=40,geo=new T.BufferGeometry(),colors=new Float32Array(count*3),color=new T.Color(index===0?'#a6e5ef':'#d5bde9');
    for(let i=0;i<count;i++)color.clone().multiplyScalar(Math.pow(i/(count-1),1.5)).toArray(colors,i*3);
    geo.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage));geo.setAttribute('color',new T.BufferAttribute(colors,3));
    const line=new T.Line(geo,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.46,blending:T.AdditiveBlending,depthWrite:false}));line.name='restrained-grid-tail';line.frustumCulled=false;root.add(line);gridTraces.push({line,index,offset});
  }
  const portals=new T.Group();portals.name='Grid Tunnel';root.add(portals);
  const mats=['#459cac','#8bf2f1','#8f7cce'].map(color=>new T.LineBasicMaterial({color,transparent:true,opacity:.65}));
  for(let i=0;i<34;i++){
    const geo=new T.BufferGeometry().setFromPoints([[-4.8,0,0],[4.8,0,0],[4.8,5.3,0],[-4.8,5.3,0],[-4.8,0,0]].map(p=>v(...p)));
    portals.add(new T.Line(geo,mats[i%3]));
  }
  // Longitudinal rails follow the same bend as the cars and camera.
  const rails=new T.Group();portals.add(rails);
  for(const x of [-4.8,-2.4,0,2.4,4.8])for(const y of [0,5.3]){const points=[];for(let i=0;i<120;i++){const center=flightCenter('grid',i*2),tangent=flightCenter('grid',i*2+.01).sub(center).normalize(),side=new T.Vector3().crossVectors(up,tangent).normalize(),normal=new T.Vector3().crossVectors(tangent,side).normalize();points.push(center.addScaledVector(side,x).addScaledVector(normal,y));}rails.add(new T.Line(new T.BufferGeometry().setFromPoints(points),mats[0]));}
  const warpGeo=new T.BufferGeometry();warpGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(192*6),3).setUsage(T.DynamicDrawUsage));
  const warp=new T.LineSegments(warpGeo,new T.LineBasicMaterial({color:'#8fcce4',transparent:true,opacity:.58,blending:T.AdditiveBlending,depthWrite:false}));warp.frustumCulled=false;warp.name='Warp Stars';root.add(warp);
  const lights=['#40dcff','#d84cff'].map(color=>{const light=new T.PointLight(color,28,14,1.6);root.add(light);return light;});
  return {root,portals,stars:warp,trails,gridTraces,galaxy,update(mode,local,camera){
    gridTraces.forEach(trace=>trace.line.visible=mode==='grid');
    root.visible=isFlight(mode);portals.visible=mode==='grid';warp.visible=mode==='warp';if(!root.visible)return;
    sky.position.copy(camera.position);galaxy.visible=sparks.visible=mode==='cosmic';
    if(sparks.visible){const arr=sparksGeo.attributes.position.array;for(let i=0;i<220;i++){const age=motion.rand(i,61)*2.8,pose=flightPose(mode,local-age,i%2);v((motion.rand(i,62)-.5)*1.3,.1+(motion.rand(i,63)-.5)*.6,-2.3).applyQuaternion(pose.quaternion).add(pose.position).toArray(arr,i*3);}sparksGeo.attributes.position.needsUpdate=true;}stars.position.copy(camera.position).multiplyScalar(.3);
    portals.visible=mode==='grid';warp.visible=mode==='warp';
    // Scenario phases close after 12 s, while the camera advances through the curved world.
    const first=Math.floor((local*18+11)/6)-2;
    portals.children.slice(0,34).forEach((portal,i)=>{const s=(first+i)*6,center=flightCenter('grid',s),tangent=flightCenter('grid',s+.01).sub(center).normalize();portal.material=mats[((first+i)%3+3)%3];portal.position.copy(center);const side=new T.Vector3().crossVectors(up,tangent).normalize(),normal=new T.Vector3().crossVectors(tangent,side).normalize();portal.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(side,normal,tangent));});
    const a=warpGeo.attributes.position.array;
    for(let i=0;i<192;i++){const p=motion.phase(local,1,motion.rand(i,1)),theta=motion.rand(i,2)*Math.PI*2,depth=4+(1-p)*85,r=4+motion.rand(i,3)*24,x=Math.cos(theta)*r,y=Math.sin(theta)*r,tail=Math.min(2+p*14,depth*.72);a.set([x,y,-depth,x,y,-depth+tail],i*6);}
    warpGeo.attributes.position.needsUpdate=true;warp.position.copy(camera.position);warp.quaternion.copy(camera.quaternion);
    for(const trace of gridTraces)if(trace.line.visible)updateGridTrace(trace.line,local,trace.index,trace.offset);
    for(const trail of trails){trail.mesh.visible=mode!=='grid';if(trail.mesh.visible)updateFlightTrail(trail.mesh,mode,local,trail.index,trail.offset);}
    lights.forEach((light,index)=>{const pose=flightPose(mode,local,index);light.position.copy(v(index===0?-1:1,1.5,-1.4).applyQuaternion(pose.quaternion).add(pose.position));});
  }};
}
export const SPACE_FINISH_FRAGMENT=`
uniform sampler2D source;uniform vec2 texel;varying vec2 vUv;
void main(){
 vec3 c=texture2D(source,vUv).rgb;vec3 glow=vec3(0.);
 for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 d=vec2(cos(a),sin(a));glow+=max(texture2D(source,vUv+d*texel*3.).rgb-.65,0.)*.045;glow+=max(texture2D(source,vUv+d*texel*9.).rgb-.8,0.)*.022;}
 c=vec3(1.)-exp(-(c+glow)*1.14);gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
}`;
