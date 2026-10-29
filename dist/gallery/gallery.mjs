// A failed cover retains its reserved geometry and the project's native link.
import './film-carousel.mjs';

for (const image of document.querySelectorAll('.media img')) {
  const message = image.parentElement.querySelector('.media-error');
  if (!message) continue;
  const failed = () => { message.hidden = false; };
  image.addEventListener('error', failed);
  image.addEventListener('load', () => { message.hidden = true; });
  if (image.complete && image.currentSrc && !image.naturalWidth) image.decode().catch(failed);
}

const works=[...document.querySelectorAll('.story-image-open')];
if(works.length&&typeof HTMLDialogElement!=='undefined'){
  const viewer=document.createElement('dialog');viewer.className='gallery-viewer';viewer.setAttribute('aria-label','Photograph viewer');
  viewer.innerHTML='<div class="viewer-toolbar"><button type="button" data-close>Close</button><nav aria-label="Image navigation"><button type="button" data-previous aria-label="Previous image">Previous</button><button type="button" data-next aria-label="Next image">Next</button><a data-original>Original</a></nav></div><figure class="viewer-work"><img alt=""><figcaption aria-live="polite"></figcaption></figure>';
  document.body.append(viewer);
  let selected=0,returnFocus;
  const image=viewer.querySelector('img'),caption=viewer.querySelector('figcaption');
  const present=index=>{
    selected=(index+works.length)%works.length;const work=works[selected];
    const title=work.dataset.imageTitle||work.querySelector('img')?.alt||'';
    image.alt=title;image.src=work.dataset.viewSrc||work.querySelector('img').currentSrc||work.querySelector('img').src;
    caption.textContent=title;viewer.querySelector('[data-original]').href=work.href;
    viewer.querySelector('[data-previous]').disabled=works.length<2;viewer.querySelector('[data-next]').disabled=works.length<2;
  };
  const close=()=>viewer.close();
  for(const [index,work] of works.entries())work.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button)return;
    event.preventDefault();returnFocus=work;present(index);viewer.showModal();document.body.classList.add('viewer-open');viewer.querySelector('[data-close]').focus();
  });
  viewer.querySelector('[data-close]').addEventListener('click',close);
  viewer.querySelector('[data-previous]').addEventListener('click',()=>present(selected-1));
  viewer.querySelector('[data-next]').addEventListener('click',()=>present(selected+1));
  viewer.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();present(selected-1);}if(event.key==='ArrowRight'){event.preventDefault();present(selected+1);}});
  viewer.addEventListener('close',()=>{document.body.classList.remove('viewer-open');image.removeAttribute('src');returnFocus?.focus({preventScroll:true});});
}
