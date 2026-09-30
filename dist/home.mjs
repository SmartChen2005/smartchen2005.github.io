import { createScenes } from './home-scenes.mjs';
import { installGameTransition } from './home-game-transition.mjs';
import { createBusinessCard } from './home-business-card.mjs';

const composition = document.querySelector('.composition');
const identities = [...document.querySelectorAll('[data-identity]')];
const previews = identities.filter((identity) => identity.tagName === 'BUTTON');
const hover = matchMedia('(hover: hover) and (pointer: fine)');
const portrait = document.querySelector('.portrait-full');
const portraitImage = portrait.querySelector('img');
const portraitAnchor = document.createComment('Portrait reveal');
portrait.after(portraitAnchor);
let portraitActive = false, portraitTimer = 0;
function retirePortrait() {
  if (portraitActive) return;
  portrait.hidden = true;
  portrait.remove();
}
function setPortrait(active) {
  if (portraitActive === active) return;
  portraitActive = active;
  clearTimeout(portraitTimer);
  if (active) {
    portrait.hidden = false;
    portraitAnchor.before(portrait);
    // Commit the closed geometry before starting the existing reveal.
    void portrait.offsetHeight;
  } else if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    retirePortrait();
  } else {
    portraitTimer = setTimeout(retirePortrait, 375);
  }
}
portrait.addEventListener('transitionend', event => {
  if (event.propertyName === 'height' && !portraitActive) retirePortrait();
});
retirePortrait();
const scenes = createScenes(document.querySelector('.kinetic-scene'), {
  motor: document.querySelector('.motor-scene'), exhibition: document.querySelector('.photo-scene'),
});
let pinned = 'name', hovered = null, focused = null;
let nameCardOpen = true, cardKeyboard = false;
const nameTrigger = document.querySelector('.identity-name');
const cardDock = document.querySelector('.business-card-dock');
nameTrigger.setAttribute('aria-controls', 'business-card');
nameTrigger.setAttribute('aria-expanded', 'false');
const businessCard = createBusinessCard(cardDock, portrait, document.querySelector('.sentence'), nameTrigger);
const gameTransition = installGameTransition(document.querySelector('.identity-games'), scenes, () => { clear(); measure(); });

function render() {
  if (gameTransition.active) return;
  const active = hovered ?? focused ?? pinned ?? '';
  setPortrait(active === 'name');
  composition.dataset.active = active;
  document.body.dataset.world = active;
  scenes.setWorld(active);
  if (active === 'name' && nameCardOpen) {
    businessCard.show(cardKeyboard);
    cardKeyboard = false;
  } else businessCard.hide();
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
  identity.addEventListener('click', (event) => {
    if (identity.dataset.identity === 'name') {
      nameCardOpen = !nameCardOpen;
      cardKeyboard = event.detail === 0;
      pinned = nameCardOpen ? 'name' : null;
      hovered = null; focused = null;
      render();
      return;
    }
    nameCardOpen = false;
    cardKeyboard = false;
    pinned = pinned === identity.dataset.identity ? null : identity.dataset.identity;
    hovered = null;
    focused = null;
    render();
  });
}
function clear() { nameCardOpen = false; pinned = null; hovered = null; focused = null; render(); }
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const fromCard = cardDock.contains(document.activeElement);
  clear();
  if (fromCard) nameTrigger.focus({ preventScroll: true });
});
document.addEventListener('pointerdown', (event) => { if (!event.target.closest('.identity, .business-card-dock')) clear(); });
document.addEventListener('pointermove', (event) => {
  if (pinned && !event.target.closest('.identity')) scenes.point(event.clientX / innerWidth, event.clientY / innerHeight);
});
window.addEventListener('blur', () => { hovered = null; focused = null; render(); });

function measure() {
  if (gameTransition.active) return;
  const bounds = composition.getBoundingClientRect();
  const name = document.querySelector('.identity-name').getBoundingClientRect();
  // Measure while hidden when detached; the closed reveal has no rendered box.
  if (!portrait.isConnected) portraitAnchor.before(portrait);
  const portraitWidth = parseFloat(getComputedStyle(portrait).width);
  portrait.style.setProperty('--portrait-height', `${portraitWidth * Number(portraitImage.getAttribute('height')) / Number(portraitImage.getAttribute('width'))}px`);
  if (!portraitActive) portrait.remove();
  const center = Math.max(16 + portraitWidth * .42,
    Math.min(innerWidth - 16 - portraitWidth * .58, name.left + name.width / 2));
  composition.style.setProperty('--name-center', `${center - bounds.left}px`);
  const sentence = document.querySelector('.sentence').getBoundingClientRect();
  const padding = Math.max(20, innerHeight * .025);
  const band = { top: sentence.top - padding, bottom: sentence.bottom + padding };
  document.documentElement.style.setProperty('--sentence-top', `${band.top}px`);
  document.documentElement.style.setProperty('--sentence-height', `${band.bottom - band.top}px`);
  scenes.resize(band);
  businessCard.place();
}
new ResizeObserver(measure).observe(composition);
window.addEventListener('resize', measure);
document.fonts.ready.then(measure);
measure();
// The initial composition is also the remembered selection after a preview.
render();
