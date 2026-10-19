import data from './interaction-data.mjs';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const forced = matchMedia('(forced-colors: active)');
const hero = document.querySelector('.hero');
const clamp = value => Math.max(0, Math.min(1, value));
const studies = [];

// Manual choices survive until the next scroll. Automatic choices never move focus
// or announce a stream of unsolicited screen-reader messages.
function connectStudy(root, selector, items, render, captionId) {
  if (!root) return;
  const buttons = [...root.querySelectorAll(selector)];
  const stops = [...root.querySelectorAll('[data-scroll-stop]')];
  const caption = document.getElementById(captionId);
  let selected = -1, manualY = null;
  function progress(value) {
    root.style.setProperty('--study-progress', value.toFixed(4));
    // Follow the map's actual orthogonal path, not a straight jump across rooms.
    const path = root.querySelector('.travel-path');
    if (path) {
      const point = path.getPointAtLength(path.getTotalLength() * value);
      root.style.setProperty('--location-x', `${point.x - 119}px`);
      root.style.setProperty('--location-y', `${point.y - 164}px`);
    }
  }
  function select(index, manual = false) {
    if (manual) {
      manualY = scrollY;
      progress(index / (buttons.length - 1));
    }
    if (selected === index) return;
    selected = index;
    caption.setAttribute('aria-live', manual ? 'polite' : 'off');
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    render(index);
    caption.textContent = `${String(index + 1).padStart(2, '0')} / ${items[index].title}`;
  }
  buttons.forEach((button, index) => {
    button.disabled = false;
    button.addEventListener('click', () => select(index, true));
    button.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      select(next, true);
    });
  });
  root.classList.add('is-enhanced');
  select(0);
  studies.push({
    sync() {
      if (reduced.matches || forced.matches) return;
      if (manualY !== null && Math.abs(scrollY - manualY) < 2) return;
      manualY = null;
      const bounds = root.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > innerHeight) return;
      const centers = stops.map(stop => {
        const rect = stop.getBoundingClientRect();
        return rect.top + rect.height / 2;
      });
      const focusLine = innerHeight * .55;
      const value = clamp((focusLine - centers[0]) / (centers.at(-1) - centers[0]));
      progress(value);
      const nearest = centers.reduce((best, center, i) =>
        Math.abs(center - focusLine) < Math.abs(centers[best] - focusLine) ? i : best, 0);
      select(nearest);
    }
  });
}

const procedure = document.querySelector('[data-procedure]');
connectStudy(procedure, '[data-step-button]', data.steps, index => {
  procedure.dataset.step = String(index);
}, 'procedure-caption');
const navigation = document.querySelector('[data-navigation]');
connectStudy(navigation, '[data-space-button]', data.spaces, index => {
  navigation.dataset.space = data.spaces[index].id;
}, 'space-caption');

let frame = 0;
function sync() {
  frame = 0;
  const noMotion = reduced.matches || forced.matches;
  if (hero) {
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--hero-progress', noMotion ? '0' : clamp(-rect.top / rect.height).toFixed(4));
  }
  studies.forEach(study => study.sync());
}
function schedule() {
  if (!frame && !document.hidden) frame = requestAnimationFrame(sync);
}
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule);
addEventListener('pageshow', schedule);
reduced.addEventListener('change', schedule);
forced.addEventListener('change', schedule);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
  else schedule();
});
document.fonts.ready.then(schedule);
schedule();
