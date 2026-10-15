// Native horizontal scrolling remains usable without this button enhancement.
for (const carousel of document.querySelectorAll('.film-carousel')) {
  const strip=carousel.querySelector('.film-strip');
  const controls=carousel.querySelector('.film-strip-controls');
  const previous=controls.querySelector('[data-strip-prev]');
  const next=controls.querySelector('[data-strip-next]');
  const update=()=>{
    previous.disabled=strip.scrollLeft<=2;
    next.disabled=strip.scrollLeft+strip.clientWidth>=strip.scrollWidth-2;
  };
  const move=direction=>{
    const items=[...strip.children];
    const current=items.reduce((nearest,item,index)=>Math.abs(item.offsetLeft-strip.offsetLeft-strip.scrollLeft)<Math.abs(items[nearest].offsetLeft-strip.offsetLeft-strip.scrollLeft)?index:nearest,0);
    const target=items[Math.max(0,Math.min(items.length-1,current+direction))];
    strip.scrollTo({left:target.offsetLeft-strip.offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  previous.addEventListener('click',()=>move(-1));
  next.addEventListener('click',()=>move(1));
  strip.addEventListener('scroll',update,{passive:true});
  strip.addEventListener('keydown',event=>{
    if(event.target!==strip||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home'||event.key==='End')strip.scrollTo({left:event.key==='Home'?0:strip.scrollWidth,behavior:'instant'});
    else move(event.key==='ArrowLeft'?-1:1);
  });
  new ResizeObserver(update).observe(strip);
  controls.hidden=false;
  update();
}
