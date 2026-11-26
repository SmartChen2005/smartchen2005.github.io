const projects = new URL('./', import.meta.url);
const polaroid = new URL('./polaroid-of-yesterday/', import.meta.url);
const effects = matchMedia('(prefers-reduced-motion: no-preference) and (forced-colors: none)');
const cardPhoto = '.project-theme--polaroid .photo-image img';
const roomPhoto = '.room-photograph';

function matchesPage(entry, page) {
  if (!entry?.url) return false;
  const { origin, pathname } = new URL(entry.url);
  return origin === page.origin && (pathname === page.pathname || pathname === `${page.pathname}index.html`);
}

function transitionDirection(activation, transition) {
  if (!transition?.types || !effects.matches || activation?.navigationType !== 'push') return;
  const { from, entry } = activation;
  if (matchesPage(from, projects) && matchesPage(entry, polaroid)) return 'entry';
  if (matchesPage(from, polaroid) && matchesPage(entry, projects)) return 'return';
}

function setTransitionTypes(transition, direction) {
  transition.types.add('polaroid-project-transition');
  transition.types.add(`polaroid-project-${direction}`);
}

window.addEventListener('pageswap', ({ activation, viewTransition }) => {
  const direction = transitionDirection(activation, viewTransition);
  if (!direction) return;
  const photo = document.querySelector(direction === 'entry' ? cardPhoto : roomPhoto);
  if ((photo?.complete && photo.naturalWidth) || photo?.closest('.has-transition-preview')) {
    setTransitionTypes(viewTransition, direction);
  } else {
    viewTransition.skipTransition();
  }
});

window.addEventListener('pagereveal', ({ viewTransition }) => {
  const direction = transitionDirection(window.navigation?.activation, viewTransition);
  if (!direction) return;
  const enteringRoom = direction === 'entry';
  const photo = document.querySelector(enteringRoom ? roomPhoto : cardPhoto);
  if (photo && (!photo.complete || !photo.naturalWidth)) {
    // Use the same photograph until the destination image is ready.
    const preview = enteringRoom ? photo : photo.parentElement;
    preview.classList.add('has-transition-preview');
    photo.addEventListener('load', () => preview.classList.remove('has-transition-preview'), { once: true });
  }
  setTransitionTypes(viewTransition, direction);
});
