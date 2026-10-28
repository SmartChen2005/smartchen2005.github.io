// Shared decorative pointer; native controls and dedicated pointer experiences
// retain ownership. Never initialize in a preview iframe or preserved edition.
const dedicatedPointer = document.querySelector('script[src*="camera.mjs"], [data-page-cursor="native"]');
if (!dedicatedPointer && window.top === window && !location.pathname.includes('/editions/') && !document.querySelector('.site-cursor')) {
  const homepage = Boolean(document.querySelector('.homepage'));
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const root = document.documentElement;
  const padding = parseFloat(getComputedStyle(root).getPropertyValue('--home-cursor-padding')) || 10;
  const cursor = document.createElement('div');
  cursor.className = homepage ? 'site-cursor home-cursor' : 'site-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.hidden = true;
  cursor.innerHTML = '<span class="site-cursor-surface"></span><span class="site-cursor-light"></span><span class="site-cursor-edge"></span><svg class="site-cursor-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 12 4M4 4h8v8"/></svg>';
  document.body.append(cursor);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const pointShape = () => ({ x: pointer.x, y: pointer.y, w: 13, h: 13, r: 6.5, fill: .65, edge: 0, light: 0, arrow: 0 });
  let pointer = { x: 0, y: 0 }, current, velocity = {};
  let frame = 0, previousTime = 0, pressed = false, active = false;
  const allowed = () => fine.matches && !reduced.matches && !forced.matches && !document.hidden;
  const nativeRegions = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), iframe, video[controls], audio[controls], [data-cursor-native], #world-control, .process-track, .print-link, .index-print .story-image-open, #maintenance-scene[data-hover], #maintenance-scene[data-dragging]';
  const nativeAt = hit => root.classList.contains('sx-cursor') || Boolean(hit?.closest(nativeRegions));

  function hide() {
    active = false;
    pressed = false;
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    current = undefined;
    velocity = {};
    cursor.hidden = true;
    root.classList.remove('has-home-cursor');
    root.classList.remove('has-site-cursor');
  }

  function shape() {
    const next = pointShape();
    const body = document.body;
    const transitioning = body.hasAttribute('data-game-transition') || body.hasAttribute('data-photo-transition');
    const hit = document.elementFromPoint(pointer.x, pointer.y);
    if (nativeAt(hit)) return null;
    const identity = homepage && !transitioning && !body.hasAttribute('data-motor-playing') && hit?.closest('.identity');
    const link = !transitioning && hit?.closest('a[href]');
    const button = !transitioning && hit?.closest('button:not(:disabled), summary, [role="button"]');
    if (identity && !identity.closest('[inert]')) {
      const rect = identity.getBoundingClientRect();
      Object.assign(next, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2,
        w: rect.width + padding * 2, h: rect.height + padding * 2, r: 12, fill: .085, edge: .16, light: 1 });
      cursor.dataset.mode = 'identity';
      cursor.dataset.identity = identity.dataset.identity;
    } else if (link && !link.closest('[inert]') && link.getAttribute('aria-disabled') !== 'true') {
      Object.assign(next, { w: 34, h: 26, r: 13, fill: .88, arrow: 1 });
      cursor.dataset.mode = 'link';
      delete cursor.dataset.identity;
    } else if (button && !button.closest('[inert]') && button.getAttribute('aria-disabled') !== 'true') {
      Object.assign(next, { w: 22, h: 22, r: 11, fill: .72 });
      cursor.dataset.mode = 'button';
      delete cursor.dataset.identity;
    } else {
      cursor.dataset.mode = 'dot';
      delete cursor.dataset.identity;
    }
    if (pressed) {
      const scale = identity ? .985 : .88;
      next.w *= scale;
      next.h *= scale;
      next.r *= scale;
    }
    return next;
  }

  function paint() {
    const left = current.x - current.w / 2, top = current.y - current.h / 2;
    cursor.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    cursor.style.width = `${current.w}px`;
    cursor.style.height = `${current.h}px`;
    cursor.style.borderRadius = `${current.r}px`;
    for (const key of ['fill', 'edge', 'light', 'arrow']) cursor.style.setProperty(`--cursor-${key}`, current[key]);
    cursor.style.setProperty('--light-x', `${clamp(pointer.x - left, 0, current.w)}px`);
    cursor.style.setProperty('--light-y', `${clamp(pointer.y - top, 0, current.h)}px`);
  }

  function tick(time) {
    frame = 0;
    if (!active || !allowed()) { hide(); return; }
    // A normal z-index cannot draw above a native modal's top layer.
    const host = document.querySelector('dialog:modal') || document.body;
    if (cursor.parentNode !== host) host.append(cursor);
    const target = shape();
    if (!target) { hide(); return; }
    const dt = previousTime ? clamp((time - previousTime) / 1000, .001, .032) : 1 / 60;
    previousTime = time;
    let moving = false;
    for (const key of Object.keys(target)) {
      // Exact critically damped spring: retarget from live position AND velocity.
      const omega = key === 'x' || key === 'y' ? 42 : 32;
      const offset = current[key] - target[key];
      const term = (velocity[key] || 0) + omega * offset;
      const decay = Math.exp(-omega * dt);
      current[key] = target[key] + (offset + term * dt) * decay;
      velocity[key] = ((velocity[key] || 0) - omega * term * dt) * decay;
      const precision = ['fill', 'edge', 'light', 'arrow'].includes(key) ? .001 : .05;
      if (Math.abs(current[key] - target[key]) > precision || Math.abs(velocity[key]) > precision * 10) moving = true;
      else { current[key] = target[key]; velocity[key] = 0; }
    }
    // A free dot/pill tracks input directly once the magnetic frame has retracted.
    if (cursor.dataset.mode !== 'identity' && current.w < 36 && current.h < 28) {
      current.x = pointer.x;
      current.y = pointer.y;
      velocity.x = velocity.y = 0;
    }
    paint();
    if (moving) frame = requestAnimationFrame(tick);
    else previousTime = 0;
  }

  function wake() {
    if (active && !frame) frame = requestAnimationFrame(tick);
  }

  function move(event) {
    if (event.pointerType !== 'mouse' || !allowed()) { hide(); return; }
    pointer = { x: event.clientX, y: event.clientY };
    if (nativeAt(document.elementFromPoint(pointer.x, pointer.y))) { hide(); return; }
    if (!active) {
      current = pointShape();
      paint();
      cursor.hidden = false;
      active = true;
      root.classList.add('has-site-cursor');
      if (homepage) root.classList.add('has-home-cursor');
    }
    wake();
  }

  document.addEventListener('pointermove', move, { passive: true });
  // A frame owns subsequent pointermove events; release before entering it.
  document.addEventListener('pointerover', event => {
    if (nativeAt(event.target)) hide();
    else wake();
  }, { passive: true });
  document.addEventListener('pointerdown', event => {
    move(event);
    if (event.button === 0 && active) { pressed = true; wake(); }
  }, { passive: true });
  document.addEventListener('pointerup', () => { pressed = false; wake(); }, { passive: true });
  document.addEventListener('pointercancel', hide);
  root.addEventListener('pointerleave', hide);
  document.addEventListener('keydown', event => { if (event.key === 'Tab' || event.key === 'Escape') hide(); });
  document.addEventListener('visibilitychange', hide);
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', event => { if (event.persisted) hide(); });
  window.addEventListener('resize', wake);
  window.addEventListener('scroll', wake, { passive: true });
  for (const media of [fine, reduced, forced]) media.addEventListener('change', () => {
    if (!allowed()) hide();
  });
  const sentence = document.querySelector('.sentence');
  if (sentence) new ResizeObserver(wake).observe(sentence);
  // Existing worlds may hide the hovered control without any further mouse input.
  new MutationObserver(wake).observe(document.body, { attributes: true, subtree: true, attributeFilter: [
    'data-world', 'data-motor-playing', 'data-game-transition', 'data-photo-transition', 'data-motor-fallback',
    'open', 'hidden', 'inert', 'data-hover', 'data-dragging', 'class',
  ] });
  new MutationObserver(() => { if (root.classList.contains('sx-cursor')) hide(); }).observe(root, { attributes: true, attributeFilter: ['class'] });
}
