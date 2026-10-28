// Shared decorative pointer; native controls and dedicated pointer experiences
// retain ownership. Never initialize in a preview iframe or preserved edition.
import { createCursorIntents } from './site-cursor-intents.mjs?rev=20261028-circles';
const dedicatedPointer = document.querySelector('script[src*="camera.mjs"], [data-page-cursor="native"]');
if (!dedicatedPointer && document.body.dataset.lab === 'cursor' && !document.querySelector('.site-cursor')) {
  const homepage = true; // Standalone word-attraction specimen.
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
  cursor.innerHTML = '<span class="site-cursor-surface"></span><span class="site-cursor-edge"></span><svg class="site-cursor-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 12 4M4 4h8v8"/></svg><svg class="site-cursor-magnify" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 6 6"/></svg><svg class="site-cursor-move" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h12M5 5 2 8l3 3m6-6 3 3-3 3"/></svg>';
  document.body.append(cursor);
  // Word attraction is a background treatment. The pointer itself always uses
  // the same action circle, including over homepage identities.
  const attraction = document.createElement('div');
  attraction.className = 'site-cursor-attraction';
  attraction.setAttribute('aria-hidden', 'true');
  attraction.hidden = true;
  attraction.innerHTML = '<span class="site-cursor-glow"></span><span class="site-cursor-light"></span>';
  if (homepage) document.body.append(attraction);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const pointShape = () => ({ x: pointer.x, y: pointer.y, w: 13, h: 13, r: 6.5, fill: .65, edge: 0, light: 0, arrow: 0, glow: 0, magnify: 0, move: 0, grip: 0,
    magnetX: pointer.x, magnetY: pointer.y, magnetW: 13, magnetH: 13 });
  const capsule = { w: 34, h: 26, r: 13, fill: .88 };
  const actionCircle = { w: 26, h: 26, r: 13, fill: .88 };
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
    attraction.hidden = true;
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
      Object.assign(next, capsule, { w: 30, h: 24, r: 12, fill: .96, move: 1, grip: 1 });
      cursor.dataset.mode = 'dragging';
      delete cursor.dataset.identity;
    } else if (identity && !identity.closest('[inert]')) {
      const rect = identity.getBoundingClientRect();
      Object.assign(next, actionCircle, { glow: 1, light: 1,
        magnetX: rect.left + rect.width / 2, magnetY: rect.top + rect.height / 2,
        magnetW: rect.width + padding * 2, magnetH: rect.height + padding * 2 });
      cursor.dataset.mode = 'identity';
      cursor.dataset.identity = identity.dataset.identity;
    } else if (!transitioning && intent.kind === 'magnify') {
      Object.assign(next, capsule, { magnify: 1 });
      cursor.dataset.mode = 'magnify';
      delete cursor.dataset.identity;
    } else if (!transitioning && intent.kind === 'drag') {
      Object.assign(next, capsule, { move: 1 });
      cursor.dataset.mode = 'drag';
      delete cursor.dataset.identity;
    } else if (!transitioning && intent.kind === 'link') {
      Object.assign(next, capsule, { arrow: 1 });
      cursor.dataset.mode = 'link';
      delete cursor.dataset.identity;
    } else if (!transitioning && intent.kind === 'button') {
      Object.assign(next, actionCircle);
      cursor.dataset.mode = 'button';
      delete cursor.dataset.identity;
    } else {
      cursor.dataset.mode = 'dot';
      delete cursor.dataset.identity;
    }
    if (pressed && cursor.dataset.mode !== 'dragging') {
      const scale = .88;
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
    for (const key of ['fill', 'edge', 'arrow', 'magnify', 'move']) cursor.style.setProperty(`--cursor-${key}`, current[key]);
    cursor.style.setProperty('--magnify-scale', clamp(current.w / capsule.w, .4, 1));
    cursor.style.setProperty('--move-scale', 1 - current.grip * .25);
    if (homepage) {
      const magnetLeft = current.magnetX - current.magnetW / 2, magnetTop = current.magnetY - current.magnetH / 2;
      attraction.style.transform = `translate3d(${magnetLeft}px, ${magnetTop}px, 0)`;
      attraction.style.width = `${current.magnetW}px`;
      attraction.style.height = `${current.magnetH}px`;
      for (const key of ['glow', 'light']) attraction.style.setProperty(`--cursor-${key}`, current[key]);
      attraction.style.setProperty('--light-x', `${clamp(pointer.x - magnetLeft, 0, current.magnetW)}px`);
      attraction.style.setProperty('--light-y', `${clamp(pointer.y - magnetTop, 0, current.magnetH)}px`);
      const hidden = !active || current.glow < .001;
      if (attraction.hidden !== hidden) attraction.hidden = hidden;
    }
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
      const omega = ['x', 'y', 'magnetX', 'magnetY'].includes(key) ? 42 : 32;
      const offset = current[key] - target[key];
      const term = (velocity[key] || 0) + omega * offset;
      const decay = Math.exp(-omega * dt);
      current[key] = target[key] + (offset + term * dt) * decay;
      velocity[key] = ((velocity[key] || 0) - omega * term * dt) * decay;
      const precision = ['fill', 'edge', 'light', 'arrow', 'glow', 'magnify', 'move', 'grip'].includes(key) ? .001 : .05;
      if (Math.abs(current[key] - target[key]) > precision || Math.abs(velocity[key]) > precision * 10) moving = true;
      else { current[key] = target[key]; velocity[key] = 0; }
    }
    // Every foreground pointer follows input directly; only the background word
    // attraction springs to its bounds. There is no special homepage icon layer.
    current.x = pointer.x;
    current.y = pointer.y;
    velocity.x = velocity.y = 0;
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
      // The browser owns range-thumb capture and value changes; observe the
      // press immediately without taking capture or synthesizing input events.
      if (dragCandidate && (dragCandidate.matches('input[type="range"]') || dragCandidate.hasPointerCapture(event.pointerId) || intents.source(dragCandidate) === 'grabbing')) {
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
    'disabled', 'aria-disabled', 'data-cursor', 'draggable', 'type',
  ] });
  new MutationObserver(() => { if (root.classList.contains('sx-cursor')) hide(); }).observe(root, { attributes: true, attributeFilter: ['class'] });
}
