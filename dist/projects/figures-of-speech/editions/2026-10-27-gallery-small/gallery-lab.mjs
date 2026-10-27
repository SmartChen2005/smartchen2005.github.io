import {createGalleryArchitecture,drawGalleryArchitecture} from './runtime/home-gallery-architecture.mjs';
import {photoTransitionFrame,PHOTO_TRANSITION_DURATION} from './runtime/photo-frame.mjs';

const stage=document.querySelector('.lab-stage');
const canvas=document.querySelector('#gallery-lines');
const brand=document.querySelector('.gallery-brand');
const title=brand.querySelector('span');
// The complete logo stays deliberately small throughout the entrance.
const brandScale=.4;
brand.style.transform=`scale(${brandScale})`;
brand.style.transformOrigin='center';
const paths=createGalleryArchitecture();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let animation=0;

// Trace the same local mark as the native entrance, with no live Gallery page.
const response=await fetch(brand.querySelector('img').src);
if(!response.ok)throw new Error('The preserved Gallery mark could not load');
const mark=new DOMParser().parseFromString(await response.text(),'image/svg+xml').documentElement;
mark.classList.add('gallery-mark');mark.setAttribute('aria-hidden','true');
brand.querySelector('img').replaceWith(document.importNode(mark,true));
const strokes=[...brand.querySelectorAll('path')];
strokes.forEach(path=>path.setAttribute('pathLength','1'));

function paint(time){
  const w=innerWidth,h=innerHeight-44,ratio=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
  const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);
  // Match the actual Gallery masthead's typography and padding. Center the
  // destination here instead of retaining its surrounding header/page.
  const fontSize=w<=420?22:w<=760?24:28;
  ctx.font=`${fontSize}px "Helvetica Neue",Helvetica,Arial,sans-serif`;
  const width=ctx.measureText('THE GALLERY').width-fontSize*.04*10+(w<=420?16:w<=760?24:52);
  const height=w<=760?54:64;
  const destination={left:(w-width)/2,top:(h-height)/2,width,height,fontSize};
  const state=photoTransitionFrame(time,w,h,{left:w/2-50,top:h/2-20,width:100,height:40},destination);
  ctx.strokeStyle='#111';
  drawGalleryArchitecture(ctx,paths,time,w,h,reduced.matches?.7:state.roomOpacity);
  // Native entrance: erase architecture behind the wordmark as its title
  // develops. The white document shows through this oval.
  const b=state.brand;
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=state.titleOpacity;
  ctx.beginPath();ctx.ellipse(b.x+b.width/2,b.y+b.height/2,b.width*brandScale*.37,b.height*brandScale*.49,0,0,Math.PI*2);ctx.fill();ctx.restore();
  Object.assign(brand.style,{left:`${b.x}px`,top:`${b.y}px`,width:`${b.width}px`,height:`${b.height}px`,opacity:String(state.brandOpacity)});
  title.style.fontSize=`${state.titleSize}px`;title.style.opacity=String(state.titleOpacity);
  strokes.forEach(path=>{path.style.strokeDasharray='1';path.style.strokeDashoffset=String(1-state.trace);});
  stage.dataset.time=String(Math.round(time));
  stage.dataset.phase=time<1750?'opening':time<PHOTO_TRANSITION_DURATION?'arrival':'settled';
}
function replay(){
  cancelAnimationFrame(animation);
  if(reduced.matches){paint(PHOTO_TRANSITION_DURATION);return;}
  const start=performance.now();
  function tick(now){const time=Math.min(now-start,PHOTO_TRANSITION_DURATION);paint(time);animation=time<PHOTO_TRANSITION_DURATION?requestAnimationFrame(tick):0;}
  animation=requestAnimationFrame(tick);
}
document.querySelector('#replay').addEventListener('click',replay);
canvas.addEventListener('click',replay);
window.addEventListener('resize',replay);
reduced.addEventListener('change',replay);
window.addEventListener('pagehide',()=>cancelAnimationFrame(animation));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&parent!==window)parent.postMessage({type:'figures-lab-close'},location.origin);});
replay();document.body.dataset.ready='true';
if(parent!==window)parent.postMessage({type:'figures-lab-ready'},location.origin);
