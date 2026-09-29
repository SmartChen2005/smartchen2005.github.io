const clampCard = (value, low, high) => Math.max(low, Math.min(high, value));

export function businessCardLayout(portrait, sentence, viewport) {
  const width = Math.min(328, Math.max(296, portrait.width * 1.05), viewport.width - 32);
  const height = width / 1.64;
  const rightSide = portrait.right - 14;
  const beside = rightSide + width <= viewport.width - 16 && sentence.top >= height + 28;
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
  let open = false, ready = false, animation = null, frame = 0, last = 0, generation = 0;
  let current = { x: 0, y: 0 }, target = { x: 0, y: 0 }, geometry = null;

  function light() {
    // The micro-etch has a narrower roughness response than the satin substrate.
    // Both finishes receive the same broad studio source, with no idle animation.
    const x = -18 + current.x * 142, y = 35 + current.y * 35;
    const etch = Math.exp(-(((x - 81) / 32) ** 2 + ((y - 22) / 55) ** 2));
    const grazing = Math.abs(current.x) ** 2;
    card.style.setProperty('--tilt-x', `${-current.y * .85}deg`);
    card.style.setProperty('--tilt-y', `${current.x * 1.15}deg`);
    card.style.setProperty('--light-x', `${x}%`);
    card.style.setProperty('--light-y', `${y}%`);
    card.style.setProperty('--light-spread', `${58 - grazing * 10}%`);
    card.style.setProperty('--spectral-strength', `${.025 + grazing * .12}`);
    card.style.setProperty('--edge-strength', `${.22 + grazing * .26}`);
    card.style.setProperty('--engrave-strength', `${.055 + etch * .47}`);
  }
  function tick(now) {
    frame = 0;
    if (!open || !ready || document.hidden || reduce.matches || forced.matches) return;
    const dt = Math.min((now - last) / 1000 || 1 / 60, .05);
    last = now;
    const ease = 1 - Math.exp(-dt / .105);
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
    dock.dataset.layout = geometry.layout;
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
    animation?.cancel(); animation = null;
    cancelAnimationFrame(frame); frame = 0;
    dock.hidden = true; dock.inert = true; dock.dataset.state = 'closed';
    trigger.setAttribute('aria-expanded', 'false');
  }
  document.addEventListener('pointermove', event => {
    if (!open || !ready || event.pointerType === 'touch') return;
    const bounds = dock.getBoundingClientRect();
    target = { x: clampCard((event.clientX - bounds.left - bounds.width / 2) / (bounds.width * .65), -1, 1),
      y: clampCard((event.clientY - bounds.top - bounds.height / 2) / (bounds.height * .85), -1, 1) };
    startLight();
  });
  dock.querySelector('[data-resume-placeholder]').addEventListener('click', event => event.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } });
  reduce.addEventListener('change', () => {
    if (reduce.matches && open) {
      animation?.finish(); cancelAnimationFrame(frame); frame = 0;
      current = { x: 0, y: 0 }; light();
    }
  });
  return { show, hide, place, get open() { return open; } };
}
