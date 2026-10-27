// Adapter for one preserved component. Every imported implementation/resource
// is inside this edition; this page never imports or embeds the live homepage.
const kind = document.body.dataset.lab;
const stage = document.querySelector('.lab-stage');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let cleanup = () => {};
function ready() {
  document.body.dataset.ready = 'true';
  if (parent !== window) parent.postMessage({type:'figures-lab-ready'}, location.origin);
}
function canvasSize(canvas, width=innerWidth, height=innerHeight) {
  const ratio=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  const context=canvas.getContext('2d');context.setTransform(ratio,0,0,ratio,0,0);
  return context;
}
function listenResize(fn){window.addEventListener('resize',fn);fn();}
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&parent!==window)parent.postMessage({type:'figures-lab-close'},location.origin);
});
window.addEventListener('pagehide',()=>cleanup());

async function card() {
  const {createBusinessCard}=await import('./runtime/home-business-card.mjs');
  const dock=document.querySelector('.business-card-dock');
  // Supply only sizing geometry to the preserved controller, without a portrait
  // or homepage sentence in the document. Center its resulting object.
  const anchor={isConnected:true,style:{getPropertyValue:()=>''},getBoundingClientRect(){
    const width=Math.min(410,innerWidth-32,innerHeight*.9*1.64)/1.05;
    const box={width,height:0,left:0,right:width,top:0,bottom:0};box.toJSON=()=>({...box});return box;
  }};
  const sentence={getBoundingClientRect:()=>({top:0,bottom:0})};
  const trigger={setAttribute(){}};
  const controller=createBusinessCard(dock,anchor,sentence,trigger);
  controller.show();
  for(const element of dock.querySelectorAll('*'))for(const animation of element.getAnimations())animation.finish();
  function place(){controller.place();const width=parseFloat(dock.style.width),height=parseFloat(dock.style.height);dock.style.left=`${(innerWidth-width)/2}px`;dock.style.top=`${(innerHeight-height)/2}px`;}
  listenResize(place);cleanup=()=>controller.hide();
  await document.fonts.ready;place();ready();
}

async function games() {
  const [{createGameField},{createCompression,GAME_TRANSITION_DURATION}]=await Promise.all([import('./runtime/game-field.mjs'),import('./runtime/home-game-transition.mjs')]);
  const canvas=document.querySelector('#game-field'),overlay=document.querySelector('#game-compression'),button=document.querySelector('#game-trigger');
  const field=createGameField(canvas,{});let animation=0,start=0,system=null;
  function size(){stop();const r=button.getBoundingClientRect();field.resize({top:r.top-14,bottom:r.bottom+14});canvasSize(overlay);field.setWorld('games');}
  function stop(){cancelAnimationFrame(animation);animation=0;if(system){field.releaseGame();field.setWorld('games');}system=null;stage.dataset.playing='false';overlay.hidden=true;}
  function paint(time){
    const state=system.advance(time),ctx=overlay.getContext('2d'),{width,height}=system.snapshot;
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=ctx.strokeStyle='#242520';ctx.lineWidth=1;
    if(state.phase==='point'){ctx.beginPath();ctx.arc(width/2,height/2,.75,0,Math.PI*2);ctx.fill();return;}
    const b=state.boundary;ctx.save();ctx.beginPath();ctx.rect(b.left,b.top,b.right-b.left,b.bottom-b.top);ctx.clip();
    for(const body of state.bodies){ctx.save();if(body.trail?.length){ctx.globalAlpha=.22;ctx.beginPath();body.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.globalAlpha=1;}ctx.translate(body.x,body.y);ctx.rotate(body.angle);ctx.scale(body.scale??1,body.scale??1);if(body.kind==='ball'){ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();}else{if(body.filled)ctx.fillRect(-body.w/2,-body.h/2,body.w,body.h);else ctx.strokeRect(-body.w/2,-body.h/2,body.w,body.h);if(body.flash){ctx.globalAlpha=body.flash*.45;ctx.strokeRect(-body.w/2-6,-body.h/2-6,body.w+12,body.h+12);}}ctx.restore();}
    ctx.restore();ctx.strokeRect(b.left,b.top,b.right-b.left,b.bottom-b.top);
  }
  function play(){if(system)return;if(reduced.matches)return;const snapshot=field.captureGame();system=createCompression(snapshot);system.snapshot=snapshot;canvasSize(overlay);overlay.hidden=false;stage.dataset.playing='true';start=performance.now();function tick(now){animation=0;if(!system)return;const time=(now-start)/1000;paint(Math.min(time,GAME_TRANSITION_DURATION));if(time<GAME_TRANSITION_DURATION)animation=requestAnimationFrame(tick);else{stop();button.focus({preventScroll:true});}}animation=requestAnimationFrame(tick);}
  document.addEventListener('pointermove',event=>field.point(event.clientX/innerWidth,event.clientY/innerHeight));button.addEventListener('click',play);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  reduced.addEventListener('change',stop);listenResize(size);cleanup=()=>{stop();field.setWorld('');};ready();
}

async function photographs() {
  const {createExhibition}=await import('./runtime/home-exhibition.mjs');
  const root=document.querySelector('.photo-scene'),exhibition=createExhibition(root);
  function layout(){exhibition.resize(innerWidth,innerHeight-44,{top:innerHeight*.46,bottom:innerHeight*.5});}
  function replay(){delete document.body.dataset.world;void root.offsetHeight;document.body.dataset.world='photo';}
  document.querySelector('#replay').addEventListener('click',replay);root.addEventListener('click',replay);
  listenResize(layout);await Promise.all([...root.querySelectorAll('img')].map(image=>image.decode().catch(()=>{})));replay();ready();
}

async function gallery() {
  const [{createGalleryArchitecture,drawGalleryArchitecture},{photoTransitionFrame,PHOTO_TRANSITION_DURATION}]=await Promise.all([import('./runtime/home-gallery-architecture.mjs'),import('./runtime/photo-frame.mjs')]);
  const paths=createGalleryArchitecture(),canvas=document.querySelector('#gallery-lines'),brand=document.querySelector('.gallery-brand'),title=brand.querySelector('span');let animation=0,started=0;
  function paint(time){const w=innerWidth,h=innerHeight-44,ctx=canvasSize(canvas,w,h),bw=Math.min(w-48,w*.62),bh=bw/3;ctx.clearRect(0,0,w,h);ctx.strokeStyle='#191919';const state=photoTransitionFrame(time,w,h,{left:w/2-50,top:h/2-20,width:100,height:40},{left:(w-bw)/2,top:(h-bh)/2,width:bw,height:bh,fontSize:bw*.11});drawGalleryArchitecture(ctx,paths,time,w,h,reduced.matches?.7:state.roomOpacity);ctx.globalAlpha=1;brand.style.left=`${state.brand.x}px`;brand.style.top=`${state.brand.y}px`;brand.style.width=`${state.brand.width}px`;brand.style.height=`${state.brand.height}px`;brand.style.opacity=String(state.brandOpacity);title.style.fontSize=`${state.titleSize}px`;}
  function replay(){cancelAnimationFrame(animation);animation=0;if(reduced.matches){paint(PHOTO_TRANSITION_DURATION);ready();return;}started=performance.now();function tick(now){const time=Math.min(now-started,PHOTO_TRANSITION_DURATION);stage.dataset.time=String(Math.round(time));stage.dataset.phase=time<1750?'opening':time<PHOTO_TRANSITION_DURATION?'arrival':'settled';paint(time);if(time<PHOTO_TRANSITION_DURATION)animation=requestAnimationFrame(tick);else animation=0;}animation=requestAnimationFrame(tick);ready();}
  document.querySelector('#replay').addEventListener('click',replay);canvas.addEventListener('click',replay);reduced.addEventListener('change',replay);window.addEventListener('resize',replay);cleanup=()=>cancelAnimationFrame(animation);replay();
}

async function cars() {
  const {createMotorsport}=await import('./runtime/home-motorsport.mjs');
  const canvas=document.querySelector('#motor'),foreground=document.querySelector('#motor-foreground'),button=document.querySelector('#play-film');
  const controller=createMotorsport(canvas,{foreground,onPlayback(playing){button.textContent=playing?'Restart film':'Play film';}});
  function size(){const w=canvas.clientWidth,h=canvas.clientHeight;controller.resize(w,h,{top:h*.44,bottom:h*.54});}
  function play(){controller.play();}
  canvas.addEventListener('click',play);canvas.addEventListener('pointermove',event=>{const r=canvas.getBoundingClientRect();controller.point((event.clientX-r.left)/r.width);});canvas.addEventListener('pointerleave',()=>controller.point(.5));canvas.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();play();}});button.addEventListener('click',play);listenResize(size);controller.setActive(true);cleanup=()=>controller.setActive(false);ready();
}

async function construction() {
  await import('./runtime/construction.mjs');
  const button=document.querySelector('#add-objects');
  if(!button.disabled||document.body.hasAttribute('data-fallback')){ready();return;}
  const observer=new MutationObserver(()=>{if(!button.disabled||document.body.hasAttribute('data-fallback')){observer.disconnect();ready();}});observer.observe(button,{attributes:true});observer.observe(document.body,{attributes:true});cleanup=()=>observer.disconnect();
}

try{await ({card,games,photo:photographs,gallery,cars,construction}[kind])();}
catch(error){document.querySelector('#lab-error').hidden=false;console.error('Preserved study failed to load',error);ready();}
