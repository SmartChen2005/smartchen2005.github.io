import * as camera from './runtime/camera.mjs';

const controls=document.querySelector('.camera-controls');
const fold=document.querySelector('#camera-fold');
const aim=document.querySelector('#camera-aim');
const shutter=document.querySelector('#camera-shutter');
const subject=document.querySelector('.camera-subject img');
const layer=document.querySelector('.sx-layer');
// Keep camera controls above the original viewfinder's top-layer shade.
if(controls.showPopover){controls.setAttribute('popover','manual');controls.showPopover();}
function center(){const r=subject.getBoundingClientRect();camera.labPosition(r.left+r.width/2,r.top+r.height/2);}
function update(){const state=camera.labState();fold.disabled=state.busy||!state.enabled;fold.textContent=state.opened?'Fold':'Open';aim.disabled=state.busy||!state.enabled;aim.setAttribute('aria-pressed',String(state.phase==='aiming'||state.phase==='viewfinder'));shutter.disabled=state.phase!=='viewfinder'||state.busy;}
fold.addEventListener('click',()=>{camera.labToggle();update();});
aim.addEventListener('click',()=>{const state=camera.labState();if(state.phase==='viewfinder'||state.phase==='aiming')camera.exitAim();else{center();camera.labOpen();camera.enterAim('f');}update();});
shutter.addEventListener('click',()=>camera.labShutter());
document.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'&&!event.target.closest('[data-camera-control]'))camera.labPosition(event.clientX,event.clientY);},{passive:true});
document.addEventListener('pointermove',event=>{if(event.pointerType==='touch'&&!event.target.closest('[data-camera-control]'))camera.labPosition(event.clientX,event.clientY);},{passive:true});
const observer=new MutationObserver(update);observer.observe(layer,{attributes:true,attributeFilter:['data-state']});
await subject.decode().catch(()=>{});center();camera.labOpen();update();
document.body.dataset.ready='true';
if(parent!==window)parent.postMessage({type:'figures-lab-ready'},location.origin);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&parent!==window)parent.postMessage({type:'figures-lab-close'},location.origin);});
window.addEventListener('pagehide',()=>{observer.disconnect();camera.exitAim();});
