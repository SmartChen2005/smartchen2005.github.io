const $=selector=>document.querySelector(selector);
const track=$('.process-track'),links=[...track.querySelectorAll('[data-process-page]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),viewer=$('.process-viewer'),image=$('#viewer-image');
let current=0,origin=null,drag=null,wasDragged=false;
const behavior=()=>reduced.matches?'instant':'smooth';
function moveTrack(direction){const sheet=track.querySelector('.process-sheet');track.scrollBy({left:direction*(sheet.getBoundingClientRect().width+24),behavior:behavior()});}
$('#process-prev').addEventListener('click',()=>moveTrack(-1));
$('#process-next').addEventListener('click',()=>moveTrack(1));
track.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();moveTrack(event.key==='ArrowLeft'?-1:1);}});
function trackState(){
  $('#process-prev').disabled=track.scrollLeft<2;$('#process-next').disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-2;
  const width=links[0].getBoundingClientRect().width+24,start=Math.min(links.length,Math.round(track.scrollLeft/width)+1);
  const count=Math.max(1,Math.round((innerWidth*.86+24)/width));
  $('#process-position').textContent=`Pages ${start}–${Math.min(links.length,start+count-1)} of ${links.length}`;
}
track.addEventListener('scroll',trackState,{passive:true});window.addEventListener('resize',trackState);
track.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;drag={x:event.clientX,left:track.scrollLeft,id:event.pointerId};wasDragged=false;});
track.addEventListener('pointermove',event=>{if(!drag)return;if(Math.abs(event.clientX-drag.x)>5){wasDragged=true;track.setPointerCapture(drag.id);track.classList.add('is-dragging');}if(wasDragged)track.scrollLeft=drag.left+drag.x-event.clientX;});
const endDrag=()=>{drag=null;track.classList.remove('is-dragging');};
track.addEventListener('pointerup',endDrag);track.addEventListener('pointercancel',endDrag);track.addEventListener('lostpointercapture',endDrag);
function showPage(index){
  current=Math.max(0,Math.min(links.length-1,index));
  image.src=links[current].href;image.alt=links[current].querySelector('img').alt;
  $('#viewer-title').textContent=`PDF page ${current+1} / ${links.length}`;
  $('#viewer-prev').disabled=current===0;$('#viewer-next').disabled=current===links.length-1;
  $('.viewer-pdf').href=`files/Final%20Project.pdf#page=${current+1}`;
  $('.viewer-body').scrollTop=0;$('.viewer-body').scrollLeft=0;
  $('#viewer-error').hidden=true;image.hidden=false;
}
links.forEach((link,index)=>link.addEventListener('click',event=>{
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();if(wasDragged){wasDragged=false;return;}
  origin=link;showPage(index);viewer.showModal();document.body.classList.add('viewer-open');$('#viewer-close').focus();
}));
$('#viewer-prev').addEventListener('click',()=>showPage(current-1));$('#viewer-next').addEventListener('click',()=>showPage(current+1));
$('#viewer-close').addEventListener('click',()=>viewer.close());
$('#viewer-zoom').addEventListener('click',event=>{const zoomed=viewer.classList.toggle('is-zoomed');event.currentTarget.setAttribute('aria-pressed',String(zoomed));event.currentTarget.textContent=zoomed?'Fit page':'Zoom in';});
viewer.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();showPage(current+(event.key==='ArrowLeft'?-1:1));}});
viewer.addEventListener('close',()=>{document.body.classList.remove('viewer-open');origin?.focus({preventScroll:true});});
let touch=null;
viewer.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'&&!viewer.classList.contains('is-zoomed'))touch={x:event.clientX,y:event.clientY};});
viewer.addEventListener('pointerup',event=>{if(touch&&Math.abs(event.clientX-touch.x)>60&&Math.abs(event.clientY-touch.y)<50)showPage(current+(event.clientX<touch.x?1:-1));touch=null;});
image.addEventListener('error',()=>{image.hidden=true;$('#viewer-error').hidden=false;});
trackState();
