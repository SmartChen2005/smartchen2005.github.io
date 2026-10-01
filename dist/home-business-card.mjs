import { createPerlage, titaniumReflection } from './home-card-perlage.mjs';
import { createCardOrientation } from './home-card-orientation.mjs';

const clampCard = (value, low, high) => Math.max(low, Math.min(high, value));

// One physical material state; neither the renderer nor its finishes know
// whether inspection came from a cursor, a finger or a device sensor.
export function cardMaterialState(view, { free = false } = {}) {
  const x = clampCard(view.x, -1, 1), y = clampCard(view.y, -1, 1);
  // Keep the studio source within reach of both halves of the metal face.
  const light = { x: 35 + x * (x < 0 ? 48 : 80), y: 34 + y * 42, spread: 60 - x ** 2 * 12 };
  const etch = Math.exp(-(((light.x - 81) / 32) ** 2 + ((light.y - 22) / 55) ** 2));
  const inspection = Math.min(1, Math.hypot(x, y));
  const spectral = { phase: .19 + x * .20 + y * .15, strength: .008 + inspection * .26 };
  const reflection = offset => `rgb(${titaniumReflection(spectral.phase + offset).join(' ')})`;
  return { view: { x, y }, light, spectral, properties: {
    '--tilt-x': `${-y * (free ? 7 : 2)}deg`, '--tilt-y': `${x * (free ? 8 : 2.8)}deg`,
    '--card-pivot': free ? '50% 50%' : '12% 50%',
    '--light-x': `${light.x}%`, '--light-y': `${light.y}%`, '--light-spread': `${light.spread}%`,
    '--spectral-strength': `${spectral.strength}`, '--edge-strength': `${.38 + x ** 2 * .38}`,
    '--reflection-a': reflection(-.12), '--reflection-b': reflection(.12), '--reflection-c': reflection(.30),
    '--side-light': `${62 + x * 17 - y * 6}%`, '--bottom-light': `${69 - y * 15 + x * 4}%`,
    '--engrave-strength': `${.16 + etch * .58}`, '--etch-x': `${x * .35}px`, '--etch-y': `${.75 - y * .25}px`,
  } };
}

export function businessCardLayout(portrait, sentence, viewport) {
  const landscape = viewport.width > viewport.height;
  const width = landscape ? portrait.width * 1.05 : Math.min(328, Math.max(296, portrait.width * 1.05), viewport.width - 32);
  const height = width / 1.64;
  const overlap = landscape ? portrait.width * (14 / 282) : 14;
  const rightSide = portrait.right - overlap;
  const beside = landscape && rightSide + width <= viewport.width - 16 && sentence.top >= height + 28;
  return { width, height, layout: beside ? 'beside' : 'below',
    left: beside ? rightSide : Math.max(16, Math.min(viewport.width - width - 16, portrait.left + 20)),
    top: beside ? Math.max(12, Math.min(portrait.top + (portrait.height - height) / 2, sentence.top - height - 16)) : Math.max(portrait.bottom + 16, sentence.bottom + 24),
    travel: width + 20 };
}

export function createBusinessCard(dock, portrait, sentence, trigger) {
  const slide = dock.querySelector('.business-card-slide');
  const card = dock.querySelector('.metal-card');
  const email = dock.querySelector('.card-email');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const handheld = matchMedia('(any-pointer: coarse)');
  let open = false, ready = false, animation = null, frame = 0, last = 0, generation = 0;
  let current = { x: 0, y: 0 }, target = { x: 0, y: 0 }, geometry = null;
  let suspended = false;
  const perlage = createPerlage(dock.querySelector('.metal-perlage'));
  const motionAllowed = () => open && ready && !suspended && !document.hidden && !reduce.matches && !forced.matches;
  const orientation = createCardOrientation({ allowed: motionAllowed,
    canRequest: () => open && !suspended && !document.hidden && !reduce.matches && !forced.matches,
    change: inspect });
  const syncMotion = () => orientation.setActive(motionAllowed());

  function inspect(next) {
    target = { x: clampCard(next.x, -1, 1), y: clampCard(next.y, -1, 1) };
    if (Math.hypot(target.x - current.x, target.y - current.y) > .001) startLight();
  }
  function light() {
    const material = cardMaterialState(current, { free: handheld.matches });
    for (const [property, value] of Object.entries(material.properties)) card.style.setProperty(property, value);
    perlage.draw(material);
  }
  function tick(now) {
    frame = 0;
    if (!open || !ready || document.hidden || reduce.matches || forced.matches) return;
    const dt = Math.min((now - last) / 1000 || 1 / 60, .05);
    last = now;
    const ease = 1 - Math.exp(-dt / (handheld.matches ? .065 : .105));
    current.x += (target.x - current.x) * ease;
    current.y += (target.y - current.y) * ease;
    light();
    if (Math.abs(current.x - target.x) + Math.abs(current.y - target.y) > .001) frame = requestAnimationFrame(tick);
  }
  function startLight() {
    if (frame || !ready || reduce.matches || forced.matches || document.hidden) return;
    last = performance.now(); frame = requestAnimationFrame(tick);
  }
  function place() {
    if (!open || !portrait.isConnected) return;
    const bounds = portrait.getBoundingClientRect();
    const fullHeight = parseFloat(portrait.style.getPropertyValue('--portrait-height')) || bounds.height;
    geometry = businessCardLayout({ ...bounds.toJSON(), height: fullHeight, top: bounds.bottom - fullHeight }, sentence.getBoundingClientRect(), { width: innerWidth, height: innerHeight });
    dock.style.left = `${geometry.left + scrollX}px`;
    dock.style.top = `${geometry.top + scrollY}px`;
    dock.style.width = `${geometry.width}px`;
    dock.style.height = `${geometry.height}px`;
    dock.style.setProperty('--card-unit', `${geometry.width / 296}px`);
    dock.dataset.layout = geometry.layout;
    perlage.resize(geometry.width, geometry.height); perlage.draw(cardMaterialState(current, { free: handheld.matches }));
  }
  function show(keyboard = false) {
    if (open) { place(); return; }
    const entry = ++generation;
    open = true; ready = false;
    current = { x: 0, y: 0 }; target = { x: 0, y: 0 }; light();
    dock.hidden = false; dock.inert = true; dock.dataset.state = 'entering';
    trigger.setAttribute('aria-expanded', 'true');
    place();
    const fullHeight = parseFloat(portrait.style.getPropertyValue('--portrait-height'));
    const waitForPhoto = portrait.getBoundingClientRect().height < fullHeight - 2 ? 300 : 0;
    const settle = () => {
      if (!open || entry !== generation) return;
      ready = true; dock.inert = false; dock.dataset.state = 'settled';
      syncMotion();
      if (keyboard) email.focus({ preventScroll: true });
    };
    if (reduce.matches || forced.matches) { slide.style.transform = 'none'; settle(); return; }
    animation = slide.animate([
      { transform: `translate3d(${-geometry.travel}px,0,0)` },
      { transform: 'translate3d(1px,0,0)', offset: .88 },
      { transform: 'translate3d(0,0,0)' },
    ], { duration: 840, delay: waitForPhoto, easing: 'cubic-bezier(.42,0,.18,1)', fill: 'both' });
    animation.onfinish = settle;
  }
  function hide() {
    if (!open) return;
    generation++;
    open = ready = false;
    syncMotion();
    animation?.cancel(); animation = null;
    cancelAnimationFrame(frame); frame = 0;
    dock.hidden = true; dock.inert = true; dock.dataset.state = 'closed';
    trigger.setAttribute('aria-expanded', 'false');
  }
  function pointerMaterial(event) {
    if (!motionAllowed() || orientation.receiving) return;
    const bounds = dock.getBoundingClientRect();
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.left + bounds.width && event.clientY >= bounds.top && event.clientY <= bounds.top + bounds.height;
    const next = inside ? { x: clampCard((event.clientX - bounds.left - bounds.width / 2) / (bounds.width * .5), -1, 1),
      y: clampCard((event.clientY - bounds.top - bounds.height / 2) / (bounds.height * .5), -1, 1) } : { x: 0, y: 0 };
    // Without a sensor, touch can inspect the finish without suppressing scroll.
    if (event.pointerType === 'touch') { next.x *= .28; next.y *= .28; }
    inspect(next);
  }
  document.addEventListener('pointermove', pointerMaterial);
  document.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') pointerMaterial(event); });
  document.addEventListener('pointerleave', () => { if (!orientation.receiving) { target = { x: 0, y: 0 }; startLight(); } });
  document.addEventListener('pointerup', event => {
    if (event.pointerType !== 'touch' || orientation.receiving) return;
    target = { x: 0, y: 0 }; startLight();
  });
  dock.addEventListener('pointerup', event => {
    if (event.pointerType === 'touch' && !event.target.closest('a')) orientation.activate();
  });
  dock.querySelector('[data-resume-placeholder]').addEventListener('click', event => event.preventDefault());
  document.addEventListener('visibilitychange', () => {
    syncMotion();
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; target = { x: 0, y: 0 }; }
    else { current = { x: 0, y: 0 }; light(); }
  });
  window.addEventListener('blur', () => {
    if (!handheld.matches) return;
    suspended = true; syncMotion(); target = { x: 0, y: 0 }; startLight();
  });
  window.addEventListener('focus', () => { suspended = false; syncMotion(); });
  reduce.addEventListener('change', () => {
    syncMotion();
    if (reduce.matches && open) {
      animation?.finish(); cancelAnimationFrame(frame); frame = 0;
      current = { x: 0, y: 0 }; light();
    }
  });
  forced.addEventListener('change', () => {
    syncMotion();
    if (forced.matches) { target = current = { x: 0, y: 0 }; cancelAnimationFrame(frame); frame = 0; light(); }
  });
  return { show, hide, place, activateMotion: orientation.activate, get open() { return open; } };
}
