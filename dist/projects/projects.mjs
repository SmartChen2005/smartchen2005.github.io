// Native links own navigation; the previews only decorate their existing hit areas.
const links = [...document.querySelectorAll('.projects-main .directory-link')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const forcedColors = matchMedia('(forced-colors: active)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const spring = value => ({value, target:value, velocity:0});
const presses = links.map(element => ({element, ...spring(1)}));
let frame = 0, previous = 0;

// Shared boundaries tessellate the actual image, without inventing scenery.
const mesh = [
  [[0,0],[25,0],[51,0],[76,0],[100,0]],
  [[0,34],[22,28],[55,37],[73,30],[100,35]],
  [[0,68],[28,72],[47,63],[79,70],[100,66]],
  [[0,100],[25,100],[51,100],[76,100],[100,100]]
];
const effects = [...document.querySelectorAll('[data-project-effect]')].map(element => {
  const kind = element.dataset.projectEffect;
  const effect = {element, kind, link:element.closest('a'), x:spring(0), y:spring(0), active:spring(0), develop:spring(0), visible:true, ready:false, pieces:[]};
  effect.surface = element.querySelector(kind === 'polaroid' ? '.photo-print' : '.ruins-window');
  if (kind === 'polaroid') {
    effect.emulsion = element.querySelector('.photo-emulsion');
    effect.sheen = element.querySelector('.photo-sheen');
  } else {
    effect.source = element.querySelector('.ruins-source');
    effect.glass = element.querySelector('.ruins-glass');
    const image = effect.source.querySelector('img');
    const fragment = document.createDocumentFragment();
    for (let row=0; row<3; row++) for (let col=0; col<4; col++) {
      const points = [mesh[row][col], mesh[row][col+1], mesh[row+1][col+1], mesh[row+1][col]];
      const cx = points.reduce((sum,p)=>sum+p[0],0)/4;
      const cy = points.reduce((sum,p)=>sum+p[1],0)/4;
      const i = row*4+col;
      const piece = document.createElement('span');
      piece.className = 'ruins-fragment';
      piece.style.clipPath = `polygon(${points.map(p=>`${p[0]}% ${p[1]}%`).join(',')})`;
      piece.style.transformOrigin = `${cx}% ${cy}%`;
      piece.append(image.cloneNode(true));
      fragment.append(piece);
      effect.pieces.push({element:piece, dx:(cx-50)*.3, dy:(cy-50)*.24, z:8+(i*11)%30, angle:((i*7)%9-4)*.7});
    }
    element.querySelector('.ruins-fragments').append(fragment);
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
  } else {
    effect.surface.style.transform = `translate(-50%, -50%) rotateX(${-y.value*7}deg) rotateY(${x.value*9}deg)`;
    const spread = 1-develop.value;
    effect.source.style.opacity = (.18+.82*develop.value).toFixed(4);
    effect.glass.style.opacity = (.15+active.value*.2).toFixed(4);
    for (const piece of effect.pieces) {
      piece.element.style.transform = `translate3d(${piece.dx*spread}px,${piece.dy*spread}px,${piece.z*spread}px) rotateZ(${piece.angle*spread}deg)`;
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
    moving=advance(effect.develop,dt,effect.kind==='polaroid'?6:8)||moving;
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
  effect.active.target=effect.develop.target=1;
  wake();
}
function clearEffect(effect) {
  for (const axis of [effect.x,effect.y,effect.active,effect.develop]) {
    axis.value=axis.target=axis.velocity=0;
  }
  for (const element of [effect.surface,effect.emulsion,effect.sheen,effect.source,effect.glass,...effect.pieces.map(piece=>piece.element)]) {
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
