import { drawSX70, projectPoint } from './camera-model.mjs';

// The document remains the event target. This entire enhancement is pointer-transparent.
const fine = matchMedia('(any-pointer:fine)');
const reduced = matchMedia('(prefers-reduced-motion:reduce)');
const contrast = matchMedia('(forced-colors:active)');
const root = document.documentElement;
const layer = document.createElement('div');
layer.className = 'sx-layer';
layer.setAttribute('aria-hidden', 'true');
layer.setAttribute('data-html2canvas-ignore', 'true');
layer.innerHTML = '<canvas class="sx-canvas"></canvas><div class="sx-finder"><div class="sx-window"><i class="sx-focus"></i></div></div><div class="sx-flash"></div>';
document.body.append(layer);
const canvas = layer.querySelector('canvas'), ctx = canvas.getContext('2d');
const finder = layer.querySelector('.sx-finder'), frame = layer.querySelector('.sx-window');
const flash = layer.querySelector('.sx-flash');
const album = document.createElement('div');
album.className = 'sx-album';
album.setAttribute('aria-hidden','true');
album.setAttribute('data-html2canvas-ignore','true');
document.body.append(album);
// Manual popover puts the decorative cursor above the native image-preview dialog.
if ('showPopover' in layer) { layer.setAttribute('popover','manual'); layer.showPopover(); }

let visible=false, opened=false, openness=0, aim=0, aimTarget=0;
let phase='idle', rightHeld=false, busy=false, consumeClick=false;
let mouse={x:innerWidth/2,y:innerHeight/2}, raf=0, previous=0, eject=null;
let captureVersion=0, frameCount=0;
const enabled=()=>fine.matches&&!contrast.matches&&!!ctx;
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
function cameraOrigin() {
  return {x:clamp(mouse.x+(mouse.x>innerWidth-165?-68:65),65,innerWidth-65),y:clamp(mouse.y+55,100,innerHeight-34)};
}
function publish() { layer.dataset.state=phase==='idle'?(opened?'open':'folded'):phase; }
function schedule() { if(!raf&&enabled()) raf=requestAnimationFrame(render); }
function resize() {
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
  ctx?.setTransform(dpr,0,0,dpr,0,0);schedule();
}
function setVisible(value) {
  visible=value&&enabled();root.classList.toggle('sx-cursor',visible);schedule();
}
export function exitAim() {
  rightHeld=false;aimTarget=0;finder.classList.remove('active');
  if(phase==='aiming'||phase==='viewfinder') phase='idle';
  publish();schedule();
}
export function enterAim() {
  if(!opened||busy||phase!=='idle')return;
  rightHeld=true;phase='aiming';aimTarget=1;publish();schedule();
}
function render(time) {
  raf=0;
  const dt=Math.min(50,previous?time-previous:16);previous=time;
  const target=opened?1:0;
  openness=reduced.matches?target:lerp(openness,target,1-Math.exp(-dt/100));
  if(Math.abs(openness-target)<.002)openness=target;
  aim=reduced.matches?aimTarget:clamp(aim+(aimTarget?1:-1)*dt/290,0,1);
  if(aim===1&&phase==='aiming'&&rightHeld) {phase='viewfinder';finder.classList.add('active');publish();}
  ctx.clearRect(0,0,innerWidth,innerHeight);
  const origin=cameraOrigin();
  if(visible&&phase!=='viewfinder') {
    const turn=Math.min(aim/.58,1), zoom=Math.max(0,(aim-.48)/.52);
    const smooth=turn*turn*(3-2*turn), zoomEase=zoom*zoom*zoom;
    const scale=lerp(34,Math.max(innerWidth,innerHeight)*2.1,zoomEase);
    const yaw=lerp(-.55,-Math.PI,smooth), elevation=lerp(.43,.04,smooth);
    const cx=lerp(origin.x,innerWidth/2,smooth);
    // Zoom into the rear eyepiece, not into the center of the camera body.
    const cy=lerp(origin.y,innerHeight/2+1.72*scale,zoomEase);
    ctx.save();ctx.globalAlpha=aim>.92?(1-aim)/.08:1;
    drawSX70(ctx,openness,yaw,elevation,scale,cx,cy);ctx.restore();
    if(aim===0) {ctx.beginPath();ctx.arc(mouse.x,mouse.y,2,0,Math.PI*2);ctx.fillStyle='#f6c934';ctx.fill();}
  }
  if(eject) {
    const t=clamp((time-eject.start)/2100,0,1);
    const slot=projectPoint([0,.18,1.43],-.55,.43,34,origin.x,origin.y);
    eject.node.style.transform=`translate(${slot[0]-45}px,${slot[1]-105+t*108}px) rotate(-8deg) scale(.86)`;
    eject.node.style.clipPath=`inset(${(1-t)*100}% 0 0 0)`;
    if(t===1) {const shot=eject;eject=null;fall(shot.node,slot[0]-45,slot[1]+3);busy=false;phase='idle';publish();}
  }
  if(openness!==target||aim!==aimTarget||eject) schedule();
}
function park(node) {
  node.getAnimations().forEach(a=>a.cancel());
  node.style.clipPath='';node.style.transform=`rotate(${(frameCount%5-2)*7}deg)`;
  node.style.left=`${clamp(mouse.x/innerWidth*100,12,86)}%`;
  album.append(node);
  while(album.children.length>12)album.firstElementChild.remove();
}
function fall(node,x,y) {
  if(reduced.matches){park(node);return;}
  const distance=Math.max(120,innerHeight-y+140), drift=mouse.x>innerWidth*.65?-75:75;
  const animation=node.animate([
    {transform:`translate(${x}px,${y}px) rotate(-8deg) scale(.86)`},
    {transform:`translate(${x+drift}px,${y+distance*.25}px) rotate(16deg) scale(.95)`,offset:.35},
    {transform:`translate(${x-drift*.4}px,${y+distance*.65}px) rotate(-18deg) scale(1)`,offset:.7},
    {transform:`translate(${x+drift*.6}px,${y+distance}px) rotate(9deg) scale(1)`}
  ],{duration:4400,easing:'ease-in',fill:'forwards'});
  animation.finished.then(()=>park(node)).catch(()=>{});
}
export async function takePhoto() {
  if(phase!=='viewfinder'||busy)return;
  busy=true;phase='capturing';consumeClick=true;publish();
  const version=++captureVersion;
  const bounds=frame.getBoundingClientRect();
  const captureWidth=innerWidth;
  // Snapshot only this page. No webcam, screen sharing, upload, or persistent storage.
  const capture=typeof window.html2canvas==='function'
    ? window.html2canvas(document.body,{
      backgroundColor:'#070707',scale:Math.min(1,900/innerWidth),logging:false,
      x:scrollX,y:scrollY,width:innerWidth,height:innerHeight,
      windowWidth:innerWidth,windowHeight:innerHeight,
      ignoreElements:el=>el.hasAttribute('data-html2canvas-ignore'),
      onclone:doc=>{doc.documentElement.classList.remove('sx-cursor');}
    }) : Promise.reject(new Error('Page capture library unavailable'));
  exitAim();phase='capturing';publish();
  flash.animate([{opacity:reduced.matches?.25:.94},{opacity:0}],{duration:reduced.matches?90:210,easing:'ease-out'});
  try {
    const shot=await Promise.race([capture,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Capture timeout')),8000))]);
    if(version!==captureVersion)return;
    const paper=document.createElement('div');paper.className='sx-film';
    const photo=document.createElement('canvas');photo.width=360;photo.height=360;
    const ratio=shot.width/captureWidth;
    photo.getContext('2d').drawImage(shot,bounds.x*ratio,bounds.y*ratio,bounds.width*ratio,bounds.height*ratio,0,0,360,360);
    paper.append(photo);layer.prepend(paper);frameCount++;
    if(reduced.matches){park(paper);busy=false;phase='idle';publish();}
    else {phase='ejecting';eject={node:paper,start:performance.now()};publish();schedule();}
  } catch(error) {
    // Failure must never trap the pointer or manufacture a photo.
    console.warn('SX-70 could not capture this page:',error);
    if(version===captureVersion){busy=false;phase='idle';publish();schedule();}
  }
}
addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse'||!enabled())return;
  mouse={x:event.clientX,y:event.clientY};setVisible(true);
  if(rightHeld&&!(event.buttons&2))exitAim();
},{passive:true});
// Mouse events are required here: PointerEvent.pointerdown only fires for the
// first pressed button, so it misses the left shutter while right is held.
addEventListener('mousedown',event=>{
  if(!enabled())return;
  mouse={x:event.clientX,y:event.clientY};setVisible(true);
  if(event.button===2&&opened&&!busy){event.preventDefault();enterAim();}
  if(event.button===0&&phase==='viewfinder') {event.preventDefault();event.stopImmediatePropagation();takePhoto();}
},true);
addEventListener('mouseup',event=>{if(event.button===2)exitAim();},true);
addEventListener('click',event=>{
  if(consumeClick){consumeClick=false;event.preventDefault();event.stopImmediatePropagation();return;}
  // Keyboard-activated links/buttons keep their native behavior and never toggle the camera.
  if(event.detail===0||!enabled()||!visible||busy||phase!=='idle')return;
  opened=!opened;publish();schedule();
},true);
addEventListener('contextmenu',event=>{if(enabled()&&opened&&!event.shiftKey)event.preventDefault();});
addEventListener('pointercancel',exitAim);
document.addEventListener('pointerleave',()=>{exitAim();setVisible(false);});
addEventListener('blur',()=>{consumeClick=false;exitAim();setVisible(false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){exitAim();setVisible(false);}});
addEventListener('keydown',event=>{
  if(event.key==='Escape'){exitAim();setVisible(false);}
  if(event.key==='Tab'){exitAim();setVisible(false);}
});
const lightbox=document.querySelector('.lightbox');
if(lightbox)new MutationObserver(()=>{
  if(layer.hidePopover&&layer.matches(':popover-open')){layer.hidePopover();layer.showPopover();}
}).observe(lightbox,{attributes:true,attributeFilter:['open']});
for(const media of [fine,contrast])media.addEventListener('change',()=>{exitAim();setVisible(false);});
addEventListener('resize',()=>{exitAim();resize();});
publish();resize();
