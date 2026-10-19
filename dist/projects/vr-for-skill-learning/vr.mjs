import data from './interaction-data.mjs';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const forced = matchMedia('(forced-colors: active)');
const clamp = value => Math.max(0, Math.min(1, value));
const range = (value, start, end) => clamp((value - start) / (end - start));
const ease = value => value * value * (3 - 2 * value);
const studies = [];
let frame = 0, dirty = true, lastTime = 0;

function wheelMotion(root) {
  const wrench = root.querySelector('.wrench');
  const arms = root.querySelector('.jack-arms');
  const pivot = root.querySelector('.jack-pivot');
  const lugs = [...root.querySelectorAll('.lug')];
  return value => {
    const position = ease(range(value, 0, .14));
    const loosen = range(value, .18, .48);
    const lift = ease(range(value, .50, .78));
    const remove = ease(range(value, .83, 1));
    root.style.setProperty('--jack-x', `${-70 * (1 - position)}px`);
    root.style.setProperty('--lift', lift.toFixed(4));
    root.style.setProperty('--loosen', loosen.toFixed(4));
    root.style.setProperty('--remove', remove.toFixed(4));
    root.style.setProperty('--wheel-x', `${400 * remove}px`);
    root.style.setProperty('--wheel-y', `${-60 * lift + 78 * remove}px`);
    root.style.setProperty('--wheel-scale', (1 - .2 * remove).toFixed(4));
    root.style.setProperty('--pump-angle', `${Math.sin(lift * Math.PI * 4) * 14}deg`);
    arms.setAttribute('d', `M115 427L174 ${352 - lift * 60}M176 427L116 ${352 - lift * 60}M115 ${390 - lift * 30}H176`);
    pivot.setAttribute('cy', String(390 - lift * 30));
    const nutPosition = Math.min(4.999, loosen * 5);
    const current = Math.floor(nutPosition);
    const from = data.lugPoints[data.starOrder[current]];
    const to = data.lugPoints[data.starOrder[Math.min(current + 1, 4)]];
    const blend = ease(range(nutPosition - current, .55, 1));
    const x = from[0] + (to[0] - from[0]) * blend;
    const y = from[1] + (to[1] - from[1]) * blend;
    wrench.setAttribute('transform', `translate(${x + 15} ${y})`);
    wrench.style.opacity = String(ease(range(value, .14, .18)) * (1 - ease(range(value, .48, .52))));
    lugs.forEach((lug, index) => {
      const order = data.starOrder.indexOf(index);
      lug.classList.toggle('is-current', loosen > 0 && order === current && value < .5);
      lug.classList.toggle('is-loosened', loosen * 5 > order + .4);
      const [cx, cy] = data.lugPoints[index];
      lug.setAttribute('transform', `rotate(${ease(clamp(loosen * 5 - order)) * 60} ${cx} ${cy})`);
      lug.style.opacity = String(1 - remove);
    });
  };
}

function mapMotion(root) {
  const path = root.querySelector('.travel-path');
  const length = path.getTotalLength();
  const location = root.querySelector('.location');
  const crate = root.querySelector('.supply-crate');
  return value => {
    const travel = value <= .5 ? value * 2 : (1 - value) * 2;
    const point = path.getPointAtLength(length * travel);
    root.style.setProperty('--route-progress', travel.toFixed(4));
    root.style.setProperty('--ready', ease(range(value, .80, 1)).toFixed(4));
    location.setAttribute('transform', `translate(${point.x - 190} ${point.y - 347})`);
    const deposit = ease(range(value, .9, 1));
    crate.setAttribute('transform', `translate(${(point.x + 24) * (1 - deposit) + 136 * deposit} ${(point.y - 26) * (1 - deposit) + 347 * deposit})`);
    crate.style.opacity = String(ease(range(value, .44, .52)));
    root.querySelectorAll('.department').forEach((item, i) => {
      item.classList.toggle('is-found', Math.abs(value - .5) < .14 && i === 2);
    });
  };
}

// Real paragraphs determine timing. Only illustration motion eases; browser scroll
// remains native, and manual controls work independently of scroll position.
function connectStudy(root, selector, items, endpoints, render) {
  if (!root) return;
  const buttons = [...root.querySelectorAll(selector)];
  const stops = [...root.querySelectorAll('[data-scroll-stop]')];
  const caption = root.querySelector('.study-caption');
  const motion = root.hasAttribute('data-procedure') ? wheelMotion(root) : mapMotion(root);
  let selected = -1, manualY = null, current = 0, target = 0;
  function select(index, manual = false) {
    if (manual) {
      manualY = scrollY;
      target = endpoints[index];
      schedule();
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
      // Finish keyboard navigation before recording the manual scroll position;
      // a smooth focus scroll must not be mistaken for the reader resuming scroll.
      buttons[next].scrollIntoView({ block: 'center', behavior: 'instant' });
      buttons[next].focus({ preventScroll: true });
      select(next, true);
    });
  });
  root.classList.add('is-enhanced');
  select(0);
  motion(0);
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
      const focusLine = innerHeight * (innerWidth <= 760 ? .75 : .55);
      target = clamp((focusLine - centers[0]) / (centers.at(-1) - centers[0]));
      const nearest = centers.reduce((best, center, i) =>
        Math.abs(center - focusLine) < Math.abs(centers[best] - focusLine) ? i : best, 0);
      select(nearest);
    },
    paint(dt) {
      const immediate = reduced.matches || forced.matches;
      current = immediate ? target : current + (target - current) * (1 - Math.exp(-dt / 160));
      if (Math.abs(target - current) < .0002) current = target;
      root.style.setProperty('--study-progress', current.toFixed(4));
      motion(current);
      return current !== target;
    }
  });
}
const procedure = document.querySelector('[data-procedure]');
connectStudy(procedure, '[data-step-button]', data.steps, [.14, .48, .78, 1], index => {
  procedure.dataset.step = String(index);
});
const navigation = document.querySelector('[data-navigation]');
connectStudy(navigation, '[data-journey-button]', data.journey, [0, .5, 1], index => {
  navigation.dataset.space = data.journey[index].space;
  navigation.dataset.journey = String(index);
});

function tick(time) {
  frame = 0;
  const dt = lastTime ? Math.min(48, time - lastTime) : 16;
  lastTime = time;
  if (dirty) { dirty = false; studies.forEach(study => study.sync()); }
  const moving = studies.map(study => study.paint(dt)).some(Boolean);
  if (moving && !document.hidden) frame = requestAnimationFrame(tick);
  else lastTime = 0;
}
function schedule() {
  dirty = true;
  if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
}
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule);
addEventListener('pageshow', schedule);
reduced.addEventListener('change', schedule);
forced.addEventListener('change', schedule);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  else schedule();
});
document.fonts.ready.then(schedule);
schedule();
