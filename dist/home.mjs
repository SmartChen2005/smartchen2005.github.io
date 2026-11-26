import { createMotorsport } from './home-motorsport.mjs?rev=20261027-restored';
import { createExhibition } from './home-exhibition.mjs';
import { installGameEntrance } from './home-game-entrance.mjs?rev=20261125-paper-return';
import { installPhotoTransition } from './home-photo-transition.mjs?rev=20261024-shared-entry';
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
let motorPlaying=false, motorKeyboard=false;
const carTrigger=document.querySelector('.identity-cars');
function motorPlayback(next,reason){
  motorPlaying=next;
  if(next)document.body.dataset.motorPlaying='true';else delete document.body.dataset.motorPlaying;
  if(!next&&reason==='complete'){
    pinned=null;hovered=hover.matches&&carTrigger.matches(':hover')?'cars':null;focused=motorKeyboard?'cars':null;render();
    if(motorKeyboard)carTrigger.focus({preventScroll:true});motorKeyboard=false;
  }
}
const motor = createMotorsport(document.querySelector('.motor-scene'), {
  foreground: document.querySelector('.motor-foreground'), onPlayback: motorPlayback,
});
const gallery = createExhibition(document.querySelector('.photo-scene'));
let pinned = 'name', hovered = null, focused = null;
let nameCardOpen = true, cardKeyboard = false;
const nameTrigger = document.querySelector('.identity-name');
const cardDock = document.querySelector('.business-card-dock');
nameTrigger.setAttribute('aria-controls', 'business-card');
nameTrigger.setAttribute('aria-expanded', 'false');
const businessCard = createBusinessCard(cardDock, portrait, document.querySelector('.sentence'), nameTrigger);
// The Projects return shows this composition inside an inert frame without nested destination previews.
const topLevel = window.top === window;
const gameTransition = topLevel ? installGameEntrance(document.querySelector('.identity-games'), document.querySelector('.game-objects'), {
  begin() { hovered = 'games'; render(); },
  reset() { clear(); measure(); },
  blocked: () => photoTransition.active,
}) : { active: false, setPreview() {} };
const photoTransition = topLevel
  ? installPhotoTransition(document.querySelector('.identity-photo'), () => { clear(); measure(); }, () => gameTransition.active)
  : { active: false };
const transitioning = () => gameTransition.active || photoTransition.active;

function render() {
  if (transitioning()) return;
  const active = motorPlaying?'cars':hovered ?? focused ?? pinned ?? '';
  const previous = document.body.dataset.world;
  if (active !== previous) {
    motor.setActive(active === 'cars', previous === 'cars' && active === '');
    gameTransition.setPreview(active === 'games');
  }
  setPortrait(active === 'name');
  composition.dataset.active = active;
  document.body.dataset.world = active;
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
    if (document.body.dataset.world !== 'cars') return;
    const rect = identity.getBoundingClientRect();
    motor.point(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)));
  });
  identity.addEventListener('focus', () => {
    if (!identity.matches(':focus-visible')) return;
    focused = identity.dataset.identity;
    render();
  });
  identity.addEventListener('blur', () => { focused = null; render(); });
  if (identity.tagName !== 'BUTTON') continue;
  identity.addEventListener('click', (event) => {
    if (transitioning()) return;
    if (identity.dataset.identity === 'name') {
      nameCardOpen = !nameCardOpen;
      cardKeyboard = event.detail === 0;
      pinned = nameCardOpen ? 'name' : null;
      hovered = null; focused = null;
      render();
      if (nameCardOpen) businessCard.activateMotion();
      return;
    }
    nameCardOpen = false;
    cardKeyboard = false;
    if(identity.dataset.identity==='cars'){
      pinned='cars';hovered=null;focused=null;motorKeyboard=event.detail===0;render();motor.play();return;
    }
    pinned = pinned === identity.dataset.identity ? null : identity.dataset.identity;
    hovered = null;
    focused = null;
    render();
  });
}
function clear() { motor.stop(); nameCardOpen = false; pinned = null; hovered = null; focused = null; render(); }
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || transitioning()) return;
  const fromCard = cardDock.contains(document.activeElement), fromMotor=motorPlaying&&motorKeyboard;
  clear();
  if(fromMotor)carTrigger.focus({preventScroll:true});
  if (fromCard) nameTrigger.focus({ preventScroll: true });
});
document.addEventListener('pointerdown', (event) => { if (!event.target.closest('.identity, .business-card-dock')) clear(); });
document.addEventListener('pointermove', (event) => {
  if (pinned && document.body.dataset.world === 'cars' && !event.target.closest('.identity')) motor.point(event.clientX / innerWidth);
});
window.addEventListener('blur', () => { hovered = null; focused = null; render(); });

function measure() {
  if (transitioning()) return;
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
  motor.resize(innerWidth, innerHeight, band);
  gallery.resize(innerWidth, innerHeight, band);
  businessCard.place();
}
new ResizeObserver(measure).observe(composition);
window.addEventListener('resize', measure);
document.fonts.ready.then(measure);
measure();
// The initial composition is also the remembered selection after a preview.
render();

// Explicit archive links enter the real feature in context, on touch and desktop.
// Ordinary arrivals retain the established portrait/card default.
const requestedStudy = new URLSearchParams(location.search).get('study');
if (['games', 'photo', 'cars'].includes(requestedStudy)) {
  nameCardOpen = false;
  pinned = requestedStudy;
  hovered = null;
  focused = null;
  render();
}
