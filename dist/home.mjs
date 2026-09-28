import { createScenes } from './home-scenes.mjs';

const composition = document.querySelector('.composition');
const identities = [...document.querySelectorAll('[data-identity]')];
const previews = identities.filter((identity) => identity.tagName === 'BUTTON');
const hover = matchMedia('(hover: hover) and (pointer: fine)');
const scenes = createScenes(document.querySelector('.kinetic-scene'), {
  motor: document.querySelector('.motor-scene'), exhibition: document.querySelector('.photo-scene'),
});
let pinned = null, hovered = null, focused = null;

function render() {
  const active = hovered ?? focused ?? pinned ?? '';
  composition.dataset.active = active;
  document.body.dataset.world = active;
  scenes.setWorld(active);
  for (const preview of previews) preview.setAttribute('aria-pressed', String(preview.dataset.identity === pinned));
}
for (const identity of identities) {
  identity.addEventListener('pointerenter', () => {
    if (!hover.matches) return;
    hovered = identity.dataset.identity;
    render();
  });
  identity.addEventListener('pointerleave', () => { hovered = null; render(); });
  identity.addEventListener('pointermove', (event) => {
    const rect = identity.getBoundingClientRect();
    scenes.point((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
  });
  identity.addEventListener('focus', () => {
    if (!identity.matches(':focus-visible')) return;
    focused = identity.dataset.identity;
    render();
  });
  identity.addEventListener('blur', () => { focused = null; render(); });
  if (identity.tagName !== 'BUTTON') continue;
  identity.addEventListener('click', () => {
    pinned = pinned === identity.dataset.identity ? null : identity.dataset.identity;
    hovered = null;
    focused = null;
    render();
  });
}
function clear() { pinned = null; hovered = null; focused = null; render(); }
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') clear(); });
document.addEventListener('pointerdown', (event) => { if (!event.target.closest('.identity')) clear(); });
document.addEventListener('pointermove', (event) => {
  if (pinned && !event.target.closest('.identity')) scenes.point(event.clientX / innerWidth, event.clientY / innerHeight);
});
window.addEventListener('blur', () => { hovered = null; focused = null; render(); });

function measure() {
  const bounds = composition.getBoundingClientRect();
  const name = document.querySelector('.identity-name').getBoundingClientRect();
  const portraitWidth = document.querySelector('.portrait-full').getBoundingClientRect().width;
  const center = Math.max(16 + portraitWidth * .42,
    Math.min(innerWidth - 16 - portraitWidth * .58, name.left + name.width / 2));
  composition.style.setProperty('--name-center', `${center - bounds.left}px`);
  const sentence = document.querySelector('.sentence').getBoundingClientRect();
  const padding = Math.max(20, innerHeight * .025);
  const band = { top: sentence.top - padding, bottom: sentence.bottom + padding };
  document.documentElement.style.setProperty('--sentence-top', `${band.top}px`);
  document.documentElement.style.setProperty('--sentence-height', `${band.bottom - band.top}px`);
  scenes.resize(band);
}
new ResizeObserver(measure).observe(composition);
window.addEventListener('resize', measure);
document.fonts.ready.then(measure);
measure();
