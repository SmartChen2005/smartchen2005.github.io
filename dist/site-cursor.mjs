// Shared decorative pointer; native controls and dedicated pointer experiences
// retain ownership. Never initialize in a preview iframe or preserved edition.
import { createCursorIntents } from './site-cursor-intents.mjs?rev=20261028-intents';
const dedicatedPointer = document.querySelector('script[src*="camera.mjs"], [data-page-cursor="native"]');
if (!dedicatedPointer && window.top === window && !location.pathname.includes('/editions/') && !document.querySelector('.site-cursor')) {
  const homepage = Boolean(document.querySelector('.homepage'));
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const root = document.documentElement;
  const intents = createCursorIntents(document);
  const padding = parseFloat(getComputedStyle(root).getPropertyValue('--home-cursor-padding')) || 10;
  const cursor = document.createElement('div');
  cursor.className = homepage ? 'site-cursor home-cursor' : 'site-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.hidden = true;
  cursor.innerHTML = '<span class="site-cursor-surface"></span><span class="site-cursor-glow"></span><span class="site-cursor-light"></span><span class="site-cursor-edge"></span><svg class="site-cursor-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 12 4M4 4h8v8"/></svg><svg class="site-cursor-magnify" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 6 6"/></svg>';
  const handPaths = {
    tap: 'M9 12V4.5a1.5 1.5 0 0 1 3 0V10M12 8.5a1.5 1.5 0 0 1 3 0V11M15 9.5a1.5 1.5 0 0 1 3 0V12M18 11a1.5 1.5 0 0 1 3 0v4.5c0 3.2-2 5.5-5 5.5h-3c-1.8 0-3-.6-4.2-2L5 14a1.5 1.5 0 0 1 2.2-2L9 14M5.5 6 3.8 5.2M6.5 2.8 5.5 1.3M15 3l1.3-1.5',
    grab: 'M6.5 12V7a1.5 1.5 0 0 1 3 0v5M9.5 10V4.5a1.5 1.5 0 0 1 3 0V11M12.5 10V5.5a1.5 1.5 0 0 1 3 0V12M15.5 10V8a1.5 1.5 0 0 1 3 0v6M6.5 12l-1-1a1.6 1.6 0 0 0-2.3 2.2L7 19.2c1 1.2 2.5 1.8 4 1.8h2.8c3.6 0 5.2-2.7 5.2-6v-3',
    grabbing: 'M6.5 12V9a1.5 1.5 0 0 1 3 0v2M9.5 10V8a1.5 1.5 0 0 1 3 0v3M12.5 10V8.5a1.5 1.5 0 0 1 3 0V12M15.5 11V10a1.5 1.5 0 0 1 3 0v5M6.5 12H6a2 2 0 0 0-1.5 3.3L8 19c1 1.3 2.5 2 4.2 2h2c3.4 0 5.3-2.5 5.3-5.5V13M9 13h4a1.5 1.5 0 0 1 0 3h-2',
  };
  const glyph = kind => `<svg class="site-cursor-${kind}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${handPaths[kind]}"/></svg>`;
  cursor.insertAdjacentHTML('beforeend', Object.keys(handPaths).map(glyph).join(''));
  document.body.append(cursor);
  const identityHint = document.createElement('div');
  identityHint.className = 'site-cursor-identity-hint';
  identityHint.setAttribute('aria-hidden', 'true');
  identityHint.hidden = true;
  identityHint.innerHTML = glyph('tap');
  if (homepage) document.body.append(identityHint);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const pointShape = () => ({ x: pointer.x, y: pointer.y, w: 13, h: 13, r: 6.5, fill: .65, edge: 0, light: 0, arrow: 0, glow: 0, magnify: 0, tap: 0, grab: 0, grabbing: 0 });
  const capsule = { w: 34, h: 26, r: 13, fill: .88 };
  let pointer = { x: 0, y: 0 }, current, velocity = {};
  let frame = 0, previousTime = 0, pressed = false, active = false;
  let dragCandidate = null, dragSession = null;
  const allowed = () => fine.matches && !reduced.matches && !forced.matches && !document.hidden;
  const nativeAt = hit => root.classList.contains('sx-cursor') || intents.resolve(hit).kind === 'native';

  function hide() {
    active = false;
    pressed = false;
    dragCandidate = dragSession = null;
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    current = undefined;
    velocity = {};
    cursor.hidden = true;
    identityHint.hidden = true;
    root.classList.remove('has-home-cursor');
    root.classList.remove('has-site-cursor');
  }

  function shape() {
    const next = pointShape();
    const body = document.body;
    const transitioning = body.hasAttribute('data-game-transition') || body.hasAttribute('data-photo-transition');
    const hit = document.elementFromPoint(pointer.x, pointer.y);
    if (!dragSession && nativeAt(hit)) return null;
    const intent = intents.resolve(hit);
    const identity = homepage && !transitioning && !body.hasAttribute('data-motor-playing') && hit?.closest('.identity');
    if (dragSession?.owner.isConnected && pressed) {
      Object.assign(next, capsule, { w: 30, h: 24, r: 12, fill: .96, grabbing: 1 });
      cursor.dataset.mode = 'dragging';
      delete cursor.dataset.identity;
    } else if (identity && !identity.closest('[inert]')) {
      const rect = identity.getBoundingClientRect();
      Object.assign(next, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2,
        w: rect.width + padding * 2, h: rect.height + padding * 2, r: 12, fill: 0, edge: 0, glow: 1, light: 1, tap: 1 });
      cursor.dataset.mode = 'identity';
      cursor.dataset.identity = identity.dataset.identity;
    } else if (!transitioning && intent.kind === 'magnify') {
      Object.assign(next, capsule, { magnify: 1 });
      cursor.dataset.mode = 'magnify';
      delete cursor.dataset.identity;
    } else if (!transitioning && intent.kind === 'drag') {
      Object.assign(next, capsule, { grab: 1 });
      cursor.dataset.mode = 'drag';
      delete cursor.dataset.identity;
    } else if (!transitioning && intent.kind === 'link') {
      Object.assign(next, capsule, { arrow: 1 });
      cursor.dataset.mode = 'link';
      delete cursor.dataset.identity;
    } else if (!transitioning && intent.kind === 'button') {
      Object.assign(next, capsule, { tap: 1 });
      cursor.dataset.mode = 'button';
      delete cursor.dataset.identity;
    } else {
      cursor.dataset.mode = 'dot';
      delete cursor.dataset.identity;
    }
    if (pressed && cursor.dataset.mode !== 'dragging') {
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
    for (const key of ['fill', 'edge', 'light', 'arrow', 'glow', 'magnify', 'tap', 'grab', 'grabbing']) cursor.style.setProperty(`--cursor-${key}`, current[key]);
    cursor.style.setProperty('--magnify-scale', clamp(current.w / capsule.w, .4, 1));
    cursor.style.setProperty('--light-x', `${clamp(pointer.x - left, 0, current.w)}px`);
    cursor.style.setProperty('--light-y', `${clamp(pointer.y - top, 0, current.h)}px`);
    const hintHidden = !active || cursor.dataset.mode !== 'identity';
    if (identityHint.hidden !== hintHidden) identityHint.hidden = hintHidden;
    identityHint.style.transform = `translate3d(${pointer.x - 9}px, ${pointer.y - 9}px, 0) scale(${pressed ? .88 : 1})`;
    identityHint.style.opacity = current.tap;
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
      const precision = ['fill', 'edge', 'light', 'arrow', 'glow', 'magnify', 'tap', 'grab', 'grabbing'].includes(key) ? .001 : .05;
      if (Math.abs(current[key] - target[key]) > precision || Math.abs(velocity[key]) > precision * 10) moving = true;
      else { current[key] = target[key]; velocity[key] = 0; }
    }
    // A free dot/pill tracks input directly once the magnetic frame has retracted.
    if (cursor.dataset.mode !== 'identity' && current.w < 36 && current.h < 30) {
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
    const capturedOwner = event.buttons & 1 ? dragCandidate || intents.dragOwner(event.target) : null;
    if (capturedOwner?.hasPointerCapture(event.pointerId)) { pressed = true; dragCandidate = capturedOwner; }
    if (dragCandidate && pressed && (dragCandidate.hasPointerCapture(event.pointerId) || intents.source(dragCandidate) === 'grabbing')) {
      dragSession = { owner: dragCandidate, pointerId: event.pointerId };
    }
    if (!dragSession && nativeAt(document.elementFromPoint(pointer.x, pointer.y))) { hide(); return; }
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
    if (!dragSession && nativeAt(event.target)) hide();
    else wake();
  }, { passive: true });
  document.addEventListener('pointerdown', event => {
    move(event);
    if (event.button === 0 && active) {
      pressed = true;
      dragCandidate = intents.dragOwner(event.target);
      if (dragCandidate && (dragCandidate.hasPointerCapture(event.pointerId) || intents.source(dragCandidate) === 'grabbing')) {
        dragSession = { owner: dragCandidate, pointerId: event.pointerId };
      }
      wake();
    }
  }, { passive: true });
  document.addEventListener('pointerup', () => { pressed = false; dragCandidate = dragSession = null; wake(); }, { passive: true });
  document.addEventListener('gotpointercapture', event => {
    const owner = intents.dragOwner(event.target);
    if (pressed && owner) { dragCandidate = owner; dragSession = { owner, pointerId: event.pointerId }; wake(); }
  });
  document.addEventListener('lostpointercapture', () => {
    if (dragSession?.nativeDrag) return;
    pressed = false; dragCandidate = dragSession = null; wake();
  });
  document.addEventListener('dragstart', event => {
    const owner = intents.dragOwner(event.target);
    if (active && owner) { pressed = true; dragCandidate = owner; dragSession = { owner, pointerId: null, nativeDrag: true }; wake(); }
  });
  document.addEventListener('dragover', event => {
    if (dragSession?.nativeDrag) { pointer = { x: event.clientX, y: event.clientY }; wake(); }
  });
  document.addEventListener('dragend', () => { pressed = false; dragCandidate = dragSession = null; wake(); });
  document.addEventListener('pointercancel', () => { if (!dragSession?.nativeDrag) hide(); });
  root.addEventListener('pointerleave', () => { if (!dragSession) hide(); });
  document.addEventListener('keydown', event => { if (event.key === 'Tab' || event.key === 'Escape') hide(); });
  document.addEventListener('visibilitychange', hide);
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', event => { if (event.persisted) hide(); });
  window.addEventListener('resize', wake);
  window.addEventListener('scroll', wake, { passive: true });
  document.addEventListener('site-cursor:intentschange', wake);
  document.addEventListener('site-cursor:refresh', wake);
  for (const media of [fine, reduced, forced]) media.addEventListener('change', () => {
    if (!allowed()) hide();
  });
  const sentence = document.querySelector('.sentence');
  if (sentence) new ResizeObserver(wake).observe(sentence);
  // Existing worlds may hide the hovered control without any further mouse input.
  new MutationObserver(wake).observe(document.body, { attributes: true, subtree: true, attributeFilter: [
    'data-world', 'data-motor-playing', 'data-game-transition', 'data-photo-transition', 'data-motor-fallback',
    'open', 'hidden', 'inert', 'data-hover', 'data-dragging', 'class',
    'disabled', 'aria-disabled', 'data-cursor', 'draggable',
  ] });
  new MutationObserver(() => { if (root.classList.contains('sx-cursor')) hide(); }).observe(root, { attributes: true, attributeFilter: ['class'] });
}
