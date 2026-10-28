import './runtime/site-cursor.mjs';

const action=document.querySelector('#press-action');
const actionOutput=document.querySelector('#action-result');
action.addEventListener('click',()=>{
  const on=action.getAttribute('aria-pressed')!=='true';
  action.setAttribute('aria-pressed',String(on));action.textContent=on?'Switch off':'Switch on';
  actionOutput.value=on?'On':'Off';
});
const link=document.querySelector('#study-link');
link.addEventListener('click',()=>{document.querySelector('#cursor-destination').value='You arrived.';});
const word=document.querySelector('#magnetic-word span');
document.querySelector('#magnetic-word').addEventListener('click',()=>{word.textContent=word.textContent==='Design'?'Imagine':'Design';});

const zoom=document.querySelector('#zoom-study'),photo=zoom.querySelector('img');
zoom.addEventListener('click',()=>{
  const enlarged=zoom.getAttribute('aria-pressed')!=='true';
  zoom.setAttribute('aria-pressed',String(enlarged));zoom.setAttribute('aria-label',enlarged?'Reset photograph':'Zoom photograph');
  document.querySelector('#zoom-result').value=enlarged?'Move to inspect. Click to reset.':'Click to look closer.';
});
zoom.addEventListener('pointermove',event=>{
  const r=zoom.getBoundingClientRect();
  photo.style.transformOrigin=`${Math.max(0,Math.min(100,(event.clientX-r.left)/r.width*100))}% ${Math.max(0,Math.min(100,(event.clientY-r.top)/r.height*100))}%`;
});

const track=document.querySelector('#drag-track'),handle=document.querySelector('#drag-handle');
let position={x:.5,y:.5},drag=null;
function place(value){
  position={x:Math.max(0,Math.min(1,value.x)),y:Math.max(0,Math.min(1,value.y))};
  handle.style.left=`${position.x*Math.max(0,track.clientWidth-handle.offsetWidth)}px`;
  handle.style.top=`${position.y*Math.max(0,track.clientHeight-handle.offsetHeight)}px`;
  document.querySelector('#drag-result').value=`X ${Math.round(position.x*100)}% · Y ${Math.round(position.y*100)}%`;
}
function release(){
  const id=drag?.id;drag=null;delete handle.dataset.dragging;
  if(id!==undefined&&handle.hasPointerCapture(id))handle.releasePointerCapture(id);
}
handle.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,position};handle.dataset.dragging='';handle.setPointerCapture(event.pointerId);
});
handle.addEventListener('pointermove',event=>{
  if(drag?.id!==event.pointerId)return;
  place({x:drag.position.x+(event.clientX-drag.x)/Math.max(1,track.clientWidth-handle.offsetWidth),y:drag.position.y+(event.clientY-drag.y)/Math.max(1,track.clientHeight-handle.offsetHeight)});
});
handle.addEventListener('pointerup',release);handle.addEventListener('pointercancel',release);handle.addEventListener('lostpointercapture',release);
handle.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
  event.preventDefault();
  const offsets={ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,-.05],ArrowDown:[0,.05]};
  const offset=offsets[event.key];
  place(offset?{x:position.x+offset[0],y:position.y+offset[1]}:{x:.5,y:.5});
});
window.addEventListener('resize',()=>place(position));window.addEventListener('blur',release);
const range=document.querySelector('#range-study');
range.addEventListener('input',()=>{document.querySelector('#range-result').value=`${range.value}% · Horizontal only.`;});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  release();if(parent!==window)parent.postMessage({type:'figures-lab-close'},location.origin);
});
window.addEventListener('pagehide',release);
place(position);await photo.decode().catch(()=>{});
document.body.dataset.ready='true';
if(parent!==window)parent.postMessage({type:'figures-lab-ready'},location.origin);
