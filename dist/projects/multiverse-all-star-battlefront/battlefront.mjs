const viewer = document.querySelector('.image-viewer');
const preview = viewer.querySelector('.viewer-image');
const caption = document.querySelector('#viewer-caption');
const error = viewer.querySelector('.viewer-error');
let trigger;
for (const link of document.querySelectorAll('[data-preview]')) {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || typeof viewer.showModal !== 'function') return;
    event.preventDefault();
    trigger = link;
    const image = link.querySelector('img');
    caption.textContent = image.alt;
    error.hidden = true;
    error.querySelector('a').href = link.href;
    preview.hidden = false;
    preview.alt = image.alt;
    preview.src = link.href;
    viewer.showModal();
  });
}
preview.addEventListener('error',()=>{preview.hidden=true;error.hidden=false;});
preview.addEventListener('load',()=>{preview.hidden=false;error.hidden=true;});
viewer.querySelector('.viewer-close').addEventListener('click',()=>viewer.close());
viewer.addEventListener('click',event=>{
  if(event.target!==viewer)return;
  const bounds=viewer.getBoundingClientRect();
  if(event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom)viewer.close();
});
viewer.addEventListener('close',()=>{trigger?.focus({preventScroll:true});preview.removeAttribute('src');});

// Observer-based reading state never owns or interrupts page scrolling.
const links=[...document.querySelectorAll('.contents a[href^="#"]')].filter(a=>a.hash!=='#top');
const sections=links.map(a=>document.querySelector(a.hash));
const visible=new Set();
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries) entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target);
    const active=sections.find(section=>visible.has(section));
    if(!active)return;
    for(const link of links) active.id===link.hash.slice(1) ? link.setAttribute('aria-current','location') : link.removeAttribute('aria-current');
  },{rootMargin:'-5% 0px -55% 0px'});
  sections.forEach(section=>observer.observe(section));
}
