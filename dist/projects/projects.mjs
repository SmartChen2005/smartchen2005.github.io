// Only the Projects homepage: a critically damped, interruptible press response.
// Native links keep navigation, modifier-clicks, scrolling and keyboard ownership.
const links = [...document.querySelectorAll('.projects-main .directory-link')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const states = links.map(element => ({element, value:1, velocity:0, target:1}));
let frame = 0, previous = 0;
const omega = 28;
function reset() {
  cancelAnimationFrame(frame);
  frame = 0;
  for (const s of states) {
    s.value = s.target = 1; s.velocity = 0;
    s.element.style.removeProperty('transform');
  }
}
function tick(time) {
  frame = 0;
  const dt = Math.min((time - previous) / 1000, .05);
  previous = time;
  let moving = false;
  for (const s of states) {
    const offset = s.value - s.target;
    const c = s.velocity + omega * offset;
    const decay = Math.exp(-omega * dt);
    s.value = s.target + (offset + c * dt) * decay;
    s.velocity = (s.velocity - omega * c * dt) * decay;
    if (Math.abs(s.value - s.target) < .00005 && Math.abs(s.velocity) < .001) {
      s.value = s.target; s.velocity = 0;
    } else moving = true;
    if (s.value === 1 && s.target === 1) s.element.style.removeProperty('transform');
    else s.element.style.transform = `scale(${s.value.toFixed(5)})`;
  }
  if (moving) frame = requestAnimationFrame(tick);
}
function target(s, value) {
  if (reducedMotion.matches || document.hidden) return;
  s.target = value;
  if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); }
}
const release = () => states.forEach(s => target(s,1));
for (const s of states) {
  s.element.addEventListener('pointerdown', event => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) target(s,.985);
  });
  s.element.addEventListener('pointerleave', () => target(s,1));
  s.element.addEventListener('pointercancel', () => target(s,1));
}
window.addEventListener('pointerup', release, {passive:true});
window.addEventListener('pointercancel', release, {passive:true});
window.addEventListener('blur', reset);
window.addEventListener('pagehide', reset);
window.addEventListener('pageshow', reset);
document.addEventListener('visibilitychange', () => {if(document.hidden) reset();});
reducedMotion.addEventListener('change', reset);
