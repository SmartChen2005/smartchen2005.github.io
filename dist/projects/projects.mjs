// Native links own navigation; the previews only decorate their existing hit areas.
const links = [...document.querySelectorAll('.projects-main .directory-link')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const forcedColors = matchMedia('(forced-colors: active)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const spring = value => ({value, target:value, velocity:0});
const presses = links.map(element => ({element, ...spring(1)}));
let frame = 0, previous = 0;

const effects = [...document.querySelectorAll('[data-project-effect]')].map(element => {
  const kind = element.dataset.projectEffect;
  const effect = {element, kind, link:element.closest('a'), x:spring(0), y:spring(0), active:spring(0), develop:spring(0), visible:true, ready:false, layers:[]};
  if (kind === 'polaroid') {
    effect.surface = element.querySelector('.photo-print');
    effect.emulsion = element.querySelector('.photo-emulsion');
    effect.sheen = element.querySelector('.photo-sheen');
  } else if (kind === 'device') {
    effect.surface = element.querySelector('img');
  } else {
    effect.layers = [...element.querySelectorAll('[data-star-depth]')].map(layer=>({element:layer,depth:Number(layer.dataset.starDepth)}));
  }
  return effect;
});

function advance(state, dt, omega) {
  const offset = state.value-state.target;
  const c = state.velocity+omega*offset;
  const decay = Math.exp(-omega*dt);
  state.value = state.target+(offset+c*dt)*decay;
  state.velocity = (state.velocity-omega*c*dt)*decay;
  if (Math.abs(state.value-state.target)<.00005 && Math.abs(state.velocity)<.001) {
    state.value=state.target; state.velocity=0; return false;
  }
  return true;
}
function render(effect) {
  if (!effect.ready) return;
  const {x,y,active,develop} = effect;
  if (effect.kind === 'polaroid') {
    effect.surface.style.transform = `translate(-50%, -50%) translate3d(${x.value*4}px,${-active.value*5+y.value*3}px,0) rotateX(${-y.value*8}deg) rotateY(${x.value*10}deg) rotateZ(${-3+active.value*2}deg)`;
    effect.emulsion.style.opacity = (.42*(1-develop.value)).toFixed(4);
    effect.sheen.style.opacity = (.06+active.value*.2).toFixed(4);
    effect.sheen.style.transform = `translate(${x.value*18}%,${y.value*6}%)`;
  } else if (effect.kind === 'device') {
    effect.surface.style.transform = `translate3d(${x.value*3}px,${y.value*2-active.value*3}px,0) rotateX(${-y.value*9}deg) rotateY(${x.value*12}deg) scale(1.18)`;
  } else {
    for (const layer of effect.layers) {
      layer.element.style.transform = `translate3d(${-x.value*layer.depth*22}px,${-y.value*layer.depth*14}px,0)`;
      layer.element.style.opacity = (.78+active.value*.22).toFixed(4);
    }
  }
}
function tick(time) {
  frame=0;
  const dt=Math.min((time-previous)/1000,.05); previous=time;
  let moving=false;
  for (const press of presses) {
    moving=advance(press,dt,28)||moving;
    if (press.value===1 && press.target===1) press.element.style.removeProperty('transform');
    else press.element.style.transform=`scale(${press.value.toFixed(5)})`;
  }
  for (const effect of effects) {
    if (!effect.ready || !effect.visible) continue;
    moving=advance(effect.x,dt,19)||moving;
    moving=advance(effect.y,dt,19)||moving;
    moving=advance(effect.active,dt,15)||moving;
    if (effect.kind==='polaroid') moving=advance(effect.develop,dt,6)||moving;
    render(effect);
  }
  if (moving) frame=requestAnimationFrame(tick);
}
function wake() {
  if (document.hidden || frame) return;
  previous=performance.now(); frame=requestAnimationFrame(tick);
}
function pressTarget(press,value) {
  if (reducedMotion.matches || document.hidden) return;
  press.target=value; wake();
}
const release=()=>presses.forEach(press=>pressTarget(press,1));
function leave(effect) {
  effect.x.target=effect.y.target=effect.active.target=effect.develop.target=0;
  wake();
}
function point(effect,event) {
  if (!effect.ready || !effect.visible || !event.isPrimary || !['mouse','pen'].includes(event.pointerType)) return;
  const rect=effect.element.getBoundingClientRect();
  effect.x.target=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));
  effect.y.target=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));
  effect.active.target=1;
  if (effect.kind==='polaroid') effect.develop.target=1;
  wake();
}
function clearEffect(effect) {
  for (const axis of [effect.x,effect.y,effect.active,effect.develop]) {
    axis.value=axis.target=axis.velocity=0;
  }
  for (const element of [effect.surface,effect.emulsion,effect.sheen,...effect.layers.map(layer=>layer.element)]) {
    element?.style.removeProperty('transform'); element?.style.removeProperty('opacity');
  }
}
function reset() {
  cancelAnimationFrame(frame); frame=0;
  for (const press of presses) {
    press.value=press.target=1; press.velocity=0;
    press.element.style.removeProperty('transform');
  }
  const enabled=finePointer.matches && !reducedMotion.matches && !forcedColors.matches && !document.hidden;
  for (const effect of effects) {
    clearEffect(effect); effect.ready=enabled;
    if (enabled) effect.element.setAttribute('data-effect-ready','');
    else effect.element.removeAttribute('data-effect-ready');
    render(effect);
  }
}
for (const press of presses) {
  press.element.addEventListener('pointerdown',event=>{
    if (event.isPrimary && event.button===0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) pressTarget(press,.985);
  });
  press.element.addEventListener('pointerleave',()=>pressTarget(press,1));
  press.element.addEventListener('pointercancel',()=>pressTarget(press,1));
}
for (const effect of effects) {
  effect.link.addEventListener('pointerenter',event=>point(effect,event),{passive:true});
  effect.link.addEventListener('pointermove',event=>point(effect,event),{passive:true});
  effect.link.addEventListener('pointerleave',()=>leave(effect));
  effect.link.addEventListener('pointercancel',()=>leave(effect));
  effect.link.addEventListener('focusout',()=>leave(effect));
}
const observer=new IntersectionObserver(entries=>{
  for (const entry of entries) {
    const effect=effects.find(item=>item.element===entry.target);
    effect.visible=entry.isIntersecting;
    if (!effect.visible) {clearEffect(effect); render(effect);}
  }
});
effects.forEach(effect=>observer.observe(effect.element));
window.addEventListener('pointerup',release,{passive:true});
window.addEventListener('pointercancel',release,{passive:true});
window.addEventListener('blur',reset);
window.addEventListener('resize',reset,{passive:true});
window.addEventListener('pagehide',reset);
window.addEventListener('pageshow',reset);
document.addEventListener('visibilitychange',reset);
document.addEventListener('keydown',event=>{if(event.key==='Tab') reset();});
for (const preference of [reducedMotion,forcedColors,finePointer]) preference.addEventListener('change',reset);
reset();
