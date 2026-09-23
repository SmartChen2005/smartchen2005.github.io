import { drawSX70, projectPoint, filmCorners, EYEPIECE } from './camera-model.mjs';

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
let phase='idle', rightHeld=false, fHeld=false, busy=false, consumeClick=false;
let mouse={x:innerWidth/2,y:innerHeight/2}, raf=0, previous=0, eject=null;
let captureVersion=0, frameCount=0;
const falling=[];
const enabled=()=>fine.matches&&!contrast.matches&&!!ctx;
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
function cameraOrigin() {
  return {x:clamp(mouse.x+(mouse.x>innerWidth-165?-68:65),65,innerWidth-65),y:clamp(mouse.y+55,100,innerHeight-34)};
}
function positionFinder() {
  const size=Math.min(innerWidth*.58,innerHeight*.64,520);
  const x=mouse.x-size/2;
  const y=mouse.y-size/2;
  frame.style.left=x+'px';frame.style.top=y+'px';
  return {x,y,width:size,height:size};
}
function publish() { layer.dataset.state=phase==='idle'?(opened?'open':'folded'):phase; }
function schedule() { if(!raf&&enabled()) raf=requestAnimationFrame(render); }
function resize() {
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
  ctx?.setTransform(dpr,0,0,dpr,0,0);positionFinder();schedule();
}
function setVisible(value) {
  visible=value&&enabled();root.classList.toggle('sx-cursor',visible);schedule();
}
export function exitAim() {
  rightHeld=false;fHeld=false;aimTarget=0;finder.classList.remove('active');
  if(phase==='aiming'||phase==='viewfinder') phase='idle';
  publish();schedule();
}
export function enterAim(source='right') {
  if(!opened||busy)return;
  if(source==='f')fHeld=true;else rightHeld=true;
  if(phase!=='idle')return;
  positionFinder();phase='aiming';aimTarget=1;publish();schedule();
}
function render(time) {
  raf=0;
  const dt=Math.min(50,previous?time-previous:16);previous=time;
  const target=opened?1:0;
  openness=reduced.matches?target:lerp(openness,target,1-Math.exp(-dt/100));
  if(Math.abs(openness-target)<.002)openness=target;
  aim=reduced.matches?aimTarget:clamp(aim+(aimTarget?dt/680:-dt/380),0,1);
  if(aim===1&&phase==='aiming'&&(rightHeld||fHeld)) {phase='viewfinder';finder.classList.add('active');publish();}
  ctx.clearRect(0,0,innerWidth,innerHeight);
  const origin=cameraOrigin();
  const view=positionFinder();
  const filmProgress=eject?clamp((time-eject.start)/2300,0,1):0;
  if(visible&&phase!=='viewfinder') {
    const turn=Math.min(aim/.55,1), zoom=Math.max(0,(aim-.22)/.78);
    const smooth=turn*turn*(3-2*turn), zoomEase=zoom*zoom*(3-2*zoom);
    const yaw=lerp(-.55,-Math.PI,smooth), elevation=lerp(.43,0,smooth);
    const finalScale=view.width/EYEPIECE.width*(9+EYEPIECE.center[2])/9;
    const scale=34*Math.pow(finalScale/34,zoomEase);
    // Keep the actual glass center anchored throughout the optical push-in.
    const eye=projectPoint(EYEPIECE.center,yaw,elevation,scale,0,0);
    const start=projectPoint(EYEPIECE.center,-.55,.43,34,origin.x,origin.y);
    const cx=lerp(start[0],mouse.x,smooth)-eye[0];
    const cy=lerp(start[1],mouse.y,smooth)-eye[1];
    ctx.save();
    drawSX70(ctx,openness,yaw,elevation,scale,cx,cy,eject?{texture:eject.texture,progress:filmProgress}:null);ctx.restore();
    if(aim===0) {ctx.beginPath();ctx.arc(mouse.x,mouse.y,2,0,Math.PI*2);ctx.fillStyle='#f6c934';ctx.fill();}
  }
  if(eject) {
    if(filmProgress===1) {
      const shot=eject;eject=null;
      const corners=filmCorners().map(p=>projectPoint(p,-.55,.43,34,origin.x,origin.y));
      fall(shot.node,corners,time);busy=false;phase='idle';publish();
    }
  }
  for(let i=falling.length-1;i>=0;i--) {
    const flight=falling[i],p=clamp((time-flight.start)/flight.duration,0,1);
    const settle=Math.min(1,p*2.4),smooth=settle*settle*(3-2*settle);
    const wave=Math.sin(p*flight.frequency*Math.PI*2+flight.seed)-Math.sin(flight.seed);
    const x=flight.x+wave*flight.sway*smooth+flight.wind*p*p;
    // Acceleration eases into air resistance, rather than accelerating indefinitely.
    const y=flight.y+flight.distance*(p-(1-Math.exp(-3*p))/3)/(1-(1-Math.exp(-3))/3);
    const angle=flight.tilt+Math.sin(p*flight.frequency*Math.PI*2+flight.seed)*.19*smooth;
    const target=[Math.cos(angle)*.86,Math.sin(angle)*.86,-Math.sin(angle)*.86,Math.cos(angle)*.86];
    const matrix=flight.basis.map((v,j)=>lerp(v,target[j],smooth));
    flight.node.style.transform=`matrix(${matrix.join(',')},${x-matrix[0]*52-matrix[2]*63},${y-matrix[1]*52-matrix[3]*63})`;
    if(p===1){falling.splice(i,1);park(flight.node,x,angle);}
  }
  if(openness!==target||aim!==aimTarget||eject||falling.length) schedule();
}
function park(node,x=mouse.x,angle=(Math.random()-.5)*.5) {
  node.style.transform=`rotate(${angle}rad)`;
  node.style.left=`${clamp(x/innerWidth*100,8,86)}%`;
  album.append(node);
  while(album.children.length>12)album.firstElementChild.remove();
}
function fall(node,corners,time) {
  if(reduced.matches){park(node);return;}
  const [a,b,,d]=corners;
  const basis=[(b[0]-a[0])/104,(b[1]-a[1])/104,(d[0]-a[0])/126,(d[1]-a[1])/126];
  node.style.transform=`matrix(${basis.join(',')},${a[0]},${a[1]})`;
  layer.prepend(node);
  const x=a[0]+basis[0]*52+basis[2]*63,y=a[1]+basis[1]*52+basis[3]*63;
  falling.push({node,x,y,basis,start:time,distance:Math.max(120,innerHeight-y+150),
    duration:2900+Math.random()*700,sway:18+Math.random()*22,frequency:.7+Math.random()*.45,
    wind:(Math.random()-.5)*70,seed:Math.random()*Math.PI*2,tilt:(Math.random()-.5)*.20});
}
export async function takePhoto() {
  if(phase!=='viewfinder'||busy)return;
  busy=true;phase='capturing';consumeClick=true;publish();
  const version=++captureVersion;
  positionFinder();
  const bounds=frame.getBoundingClientRect();
  const crop={x:Math.max(0,bounds.x),y:Math.max(0,bounds.y)};
  crop.width=Math.min(innerWidth,bounds.x+bounds.width)-crop.x;
  crop.height=Math.min(innerHeight,bounds.y+bounds.height)-crop.y;
  const scroll={x:scrollX,y:scrollY};
  // Lock media geometry in the clone so lazy images cannot shift the crop.
  const imageSizes=[...document.images].map(img=>({width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height}));
  // Snapshot only this page. No webcam, screen sharing, upload, or persistent storage.
  const capture=typeof window.html2canvas==='function'
    ? window.html2canvas(document.body,{
      backgroundColor:'#070707',scale:1,logging:false,
      x:scroll.x+crop.x,y:scroll.y+crop.y,width:crop.width,height:crop.height,
      scrollX:scroll.x,scrollY:scroll.y,
      windowWidth:innerWidth,windowHeight:innerHeight,
      ignoreElements:el=>el.hasAttribute('data-html2canvas-ignore'),
      onclone:doc=>{
        doc.documentElement.classList.remove('sx-cursor');
        doc.documentElement.style.scrollBehavior='auto';
        [...doc.images].forEach((img,i)=>{const size=imageSizes[i];if(size){img.style.width=size.width+'px';img.style.height=size.height+'px';img.style.maxWidth='none';}});
        doc.defaultView.scrollTo(scroll.x,scroll.y);
      }
    }) : Promise.reject(new Error('Page capture library unavailable'));
  exitAim();phase='capturing';publish();
  flash.animate([{opacity:reduced.matches?.25:.94},{opacity:0}],{duration:reduced.matches?90:210,easing:'ease-out'});
  try {
    const shot=await Promise.race([capture,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Capture timeout')),8000))]);
    if(version!==captureVersion)return;
    const paper=document.createElement('div');paper.className='sx-film';
    const photo=document.createElement('canvas');photo.width=360;photo.height=360;
    const photoContext=photo.getContext('2d');
    photoContext.fillStyle='#070707';photoContext.fillRect(0,0,360,360);
    const ratio=360/bounds.width;
    photoContext.drawImage(shot,0,0,shot.width,shot.height,(crop.x-bounds.x)*ratio,(crop.y-bounds.y)*ratio,crop.width*ratio,crop.height*ratio);
    paper.append(photo);frameCount++;
    const texture=document.createElement('canvas');texture.width=520;texture.height=630;
    const paperContext=texture.getContext('2d');paperContext.fillStyle='#f1efdf';paperContext.fillRect(0,0,520,630);
    paperContext.drawImage(photo,35,35,450,450);
    if(reduced.matches){park(paper);busy=false;phase='idle';publish();}
    else {phase='ejecting';eject={node:paper,texture,start:performance.now()+380};publish();schedule();}
  } catch(error) {
    // Failure must never trap the pointer or manufacture a photo.
    console.warn('SX-70 could not capture this page:',error);
    if(version===captureVersion){busy=false;phase='idle';publish();schedule();}
  }
}
addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse'||!enabled())return;
  mouse={x:event.clientX,y:event.clientY};setVisible(true);
  positionFinder();
  if(rightHeld&&!(event.buttons&2)){rightHeld=false;if(!fHeld)exitAim();}
},{passive:true});
// Mouse events are required here: PointerEvent.pointerdown only fires for the
// first pressed button, so it misses the left shutter while right is held.
addEventListener('mousedown',event=>{
  if(!enabled())return;
  mouse={x:event.clientX,y:event.clientY};setVisible(true);
  if(event.button===2){event.preventDefault();if(opened&&!busy)enterAim();}
  if(event.button===0&&phase==='viewfinder') {event.preventDefault();event.stopImmediatePropagation();takePhoto();}
},true);
addEventListener('mouseup',event=>{if(event.button===2){rightHeld=false;if(!fHeld)exitAim();}},true);
addEventListener('click',event=>{
  if(consumeClick){consumeClick=false;event.preventDefault();event.stopImmediatePropagation();return;}
  // Keyboard-activated links/buttons keep their native behavior and never toggle the camera.
  if(event.detail===0||!enabled()||!visible||busy||phase!=='idle')return;
  opened=!opened;publish();schedule();
},true);
// Capture before document/image handlers; remain suppressed after shutter/release/folding.
addEventListener('contextmenu',event=>{if(enabled())event.preventDefault();},true);
addEventListener('pointercancel',exitAim);
document.addEventListener('pointerleave',()=>{exitAim();setVisible(false);});
addEventListener('blur',()=>{consumeClick=false;exitAim();setVisible(false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){exitAim();setVisible(false);}});
addEventListener('keydown',event=>{
  if(event.key==='Escape'){exitAim();setVisible(false);}
  if(event.key?.toLowerCase()==='f') {
    const editable=event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
    if(enabled()&&opened&&visible&&!event.shiftKey&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!editable) {
      event.preventDefault();if(!event.repeat)enterAim('f');
    }
  }
});
addEventListener('keyup',event=>{if(event.key?.toLowerCase()==='f'&&fHeld){fHeld=false;if(!rightHeld)exitAim();}});
const lightbox=document.querySelector('.lightbox');
if(lightbox)new MutationObserver(()=>{
  if(layer.hidePopover&&layer.matches(':popover-open')){layer.hidePopover();layer.showPopover();}
}).observe(lightbox,{attributes:true,attributeFilter:['open']});
for(const media of [fine,contrast])media.addEventListener('change',()=>{exitAim();setVisible(false);});
addEventListener('resize',()=>{exitAim();resize();});
publish();resize();
