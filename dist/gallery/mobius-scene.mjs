import {createMobiusGeometry,rotateMobius} from './mobius-geometry.mjs';

const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;
uniform mat3 uModel;uniform vec2 uScale;uniform vec2 uCenter;
varying vec3 vNormal;varying vec3 vPosition;
void main(){vec3 p=uModel*aPosition;float w=5.2-p.z;
gl_Position=vec4((p.xy*5.2-uCenter*w)*uScale,11.0/9.0*w-20.0/9.0,w);
vNormal=uModel*aNormal;vPosition=p;}`;
const fragment=`precision mediump float;varying vec3 vNormal;varying vec3 vPosition;
void main(){vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-.55,.8,1.4));
vec3 view=normalize(vec3(0.,0.,5.2)-vPosition);
float diffuse=max(0.,dot(n,light));float specular=pow(max(0.,dot(n,normalize(light+view))),36.);
float shade=min(248.,148.+78.*diffuse+26.*specular)/255.;gl_FragColor=vec4(vec3(shade),1.);}`;

export function mountMobiusMark(brand) {
  const canvas=document.createElement('canvas');canvas.className='gallery-brand-mobius gallery-brand-canvas';
  canvas.setAttribute('aria-hidden','true');brand.prepend(canvas);
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
  if(!gl){canvas.remove();return;}
  const geometry=createMobiusGeometry();
  let program,locations,frame=0,active=true;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const current=[0,0],target=[0,0];
  const fallback=()=>{brand.removeAttribute('data-mobius-ready');active=false;cancelAnimationFrame(frame);frame=0;};
  function initialize(){
    const shaders=[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].map((type,i)=>{
      const shader=gl.createShader(type);gl.shaderSource(shader,i?fragment:vertex);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Möbius shader unavailable');return shader;
    });
    program=gl.createProgram();for(const shader of shaders)gl.attachShader(program,shader);gl.linkProgram(program);
    for(const shader of shaders)gl.deleteShader(shader);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Möbius renderer unavailable');
    gl.useProgram(program);
    for(const [name,data]of [['aPosition',geometry.positions],['aNormal',geometry.normals]]){
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
      const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,0,0);
    }
    const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,geometry.indices,gl.STATIC_DRAW);
    locations=Object.fromEntries(['uModel','uScale','uCenter'].map(n=>[n,gl.getUniformLocation(program,n)]));
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.clearColor(0,0,0,0);active=true;
  }
  // Fit the fixed baseline view; a restrained pointer tilt reveals the solid.
  const projected=[];
  for(let i=0;i<geometry.positions.length;i+=3){const [x,y,z]=rotateMobius(geometry.positions.subarray(i,i+3));projected.push([x*5.2/(5.2-z),y*5.2/(5.2-z)]);}
  const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
  const bounds=[Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)];
  function draw(){
    frame=0;if(!active||gl.isContextLost()||document.hidden)return;
    let unsettled=false;
    for(let i=0;i<2;i++){current[i]+=(target[i]-current[i])*.16;if(Math.abs(target[i]-current[i])>.0001)unsettled=true;else current[i]=target[i];}
    const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;
    const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(width*dpr),h=Math.round(height*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const scale=Math.min(width*.92/(bounds[1]-bounds[0]),height*.86/(bounds[3]-bounds[2]));
    gl.uniform2f(locations.uScale,2*scale/width,2*scale/height);
    gl.uniform2f(locations.uCenter,(bounds[0]+bounds[1])/2,(bounds[2]+bounds[3])/2);
    const matrix=[[1,0,0],[0,1,0],[0,0,1]].flatMap(p=>rotateMobius(p,...current));
    gl.uniformMatrix3fv(locations.uModel,false,matrix);gl.drawElements(gl.TRIANGLES,geometry.indices.length,gl.UNSIGNED_SHORT,0);
    if(gl.getError()===gl.NO_ERROR)brand.dataset.mobiusReady='true';else fallback();
    if(unsettled)requestDraw();
  }
  function requestDraw(){if(!frame&&active&&!document.hidden)frame=requestAnimationFrame(draw);}
  const reset=()=>{target.fill(0);if(motion.matches)current.fill(0);requestDraw();};
  brand.addEventListener('pointermove',event=>{
    if(motion.matches||event.pointerType==='touch')return;
    const rect=brand.getBoundingClientRect();target[0]=((event.clientY-rect.top)/rect.height-.5)*.12;target[1]=((event.clientX-rect.left)/rect.width-.5)*.2;requestDraw();
  });
  brand.addEventListener('pointerleave',reset);motion.addEventListener('change',reset);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestDraw();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
  canvas.addEventListener('webglcontextrestored',()=>{try{initialize();requestDraw();}catch{fallback();}});
  try{initialize();new ResizeObserver(requestDraw).observe(canvas);requestDraw();}catch{fallback();canvas.remove();}
}
