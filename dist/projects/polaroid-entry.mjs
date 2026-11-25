const projects = new URL('./', import.meta.url);
const polaroid = new URL('./polaroid-of-yesterday/', import.meta.url);
const effects = matchMedia('(prefers-reduced-motion: no-preference) and (forced-colors: none)');
const entryType = 'polaroid-project-entry';

function matchesPage(entry, page) {
  if (!entry?.url) return false;
  const { origin, pathname } = new URL(entry.url);
  return origin === page.origin && (pathname === page.pathname || pathname === `${page.pathname}index.html`);
}

function isPolaroidEntry(activation, transition) {
  return transition?.types && effects.matches && activation?.navigationType === 'push'
    && matchesPage(activation.from, projects) && matchesPage(activation.entry, polaroid);
}

window.addEventListener('pageswap', ({ activation, viewTransition }) => {
  if (!isPolaroidEntry(activation, viewTransition)) return;
  const photo = document.querySelector('.project-theme--polaroid .photo-image img');
  if (photo?.complete && photo.naturalWidth) viewTransition.types.add(entryType);
  else viewTransition.skipTransition();
});

window.addEventListener('pagereveal', ({ viewTransition }) => {
  if (!isPolaroidEntry(window.navigation?.activation, viewTransition)) return;
  const photo = document.querySelector('.room-photograph');
  if (!photo.complete || !photo.naturalWidth) {
    // Show the same small photo while the full-resolution room image loads.
    photo.classList.add('has-entry-preview');
    photo.addEventListener('load', () => photo.classList.remove('has-entry-preview'), { once: true });
  }
  viewTransition.types.add(entryType);
});
