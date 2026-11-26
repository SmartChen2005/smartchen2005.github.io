import { createPaperCurl, paperClipPath, PAPER_SLOPE, PEEL_DURATION, prepareCanvas } from './home-paper.mjs';

const SPRITES = [
  ['mini-key', .82], ['green-wallet', .88], ['pocketknife', .96],
  ['mini-cooper', 1.23], ['bmw-z4', 1.25],
];
const MAX_EXIT_DURATION = 1.16;
const EDGE_PADDING = 64;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (start, end, progress) => start + (end - start) * progress;

export function scatterObjects(width, height, sprites, random = Math.random) {
  const cell = Math.max(94, Math.sqrt(width * height / 66));
  const columns = Math.max(3, Math.round(width / cell));
  const rows = Math.max(3, Math.round(height / cell));
  const size = clamp(Math.min(width, height) * .079, 38, 90);
  let bag = [];
  return Array.from({ length: columns * rows }, (_, index) => {
    if (!bag.length) bag = [...sprites];
    const [sprite] = bag.splice(Math.floor(random() * bag.length), 1);
    const speed = mix(105, 205, random());
    return {
      sprite, size: size * sprite.scale * mix(.72, 1.08, random()),
      x: (index % columns + mix(.1, .9, random())) * width / columns,
      y: (Math.floor(index / columns) + mix(.1, .9, random())) * height / rows,
      vx: -speed, vy: speed * PAPER_SLOPE,
      angle: mix(-.6, .6, random()), spin: mix(-.45, .45, random()),
    };
  });
}

export function driftObjects(objects, width, height, dt, sprites, random = Math.random) {
  for (const item of objects) {
    item.x += item.vx * dt;
    item.y += item.vy * dt;
    item.angle += item.spin * dt;
    if (item.x > -EDGE_PADDING && item.y < height + EDGE_PADDING) continue;
    // The same diagonal continues from the opposite edge, entirely offscreen.
    const lane = item.y + item.x * PAPER_SLOPE;
    item.x = Math.min(width + EDGE_PADDING, (lane + EDGE_PADDING) / PAPER_SLOPE);
    item.y = lane - item.x * PAPER_SLOPE;
    item.sprite = sprites[Math.floor(random() * sprites.length)];
    item.angle = mix(-.6, .6, random());
  }
}

export function prepareObjectExit(objects, width, height) {
  const items = [];
  let travelTime = 0;
  for (const item of objects) {
    const { x, y, vx, vy, angle, size, sprite } = item;
    const halfWidth = size * sprite.widthRatio / 2, halfHeight = size * sprite.heightRatio / 2;
    const c = Math.abs(Math.cos(angle)), s = Math.abs(Math.sin(angle));
    const rx = c * halfWidth + s * halfHeight, ry = s * halfWidth + c * halfHeight;
    if (x + rx <= 0 || y + ry <= 0 || x - rx >= width || y - ry >= height) continue;

    // The half-diagonal keeps the object moving until it is clear at any rotation.
    const radius = Math.hypot(halfWidth, halfHeight);
    const leavesAt = Math.min((x + radius) / -vx, (height + radius - y) / vy);
    items.push({ ...item, leavesAt });
    travelTime = Math.max(travelTime, leavesAt);
  }
  return { items, travelTime, duration: Math.min(travelTime, MAX_EXIT_DURATION) };
}

export function objectExitFrame({ items, travelTime, duration }, elapsed) {
  if (elapsed >= duration) return [];
  // A shared clock starts at the hover speed and accelerates along the same paths.
  const travel = elapsed + (travelTime - duration) * (elapsed / duration) ** 2;
  return items.filter(item => travel < item.leavesAt).map(item => ({
    ...item, x: item.x + item.vx * travel, y: item.y + item.vy * travel, angle: item.angle + item.spin * travel,
  }));
}

function drawObject(context, sprite, { x, y, angle, size }) {
  const w = size * sprite.widthRatio, h = size * sprite.heightRatio;
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.drawImage(sprite.image, -w / 2, -h / 2, w, h);
  context.restore();
}

export function installGameEntrance(link, canvas, { begin, reset, blocked }) {
  const context = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const destination = new URL(link.href, location.href);
  const root = document.documentElement;
  const body = document.body;
  let sprites = [], objects = [], width = 0, height = 0;
  let frame = 0, timer = 0, last = 0, started = 0;
  let previewing = false, phase = '', navigating = false, ready = false;
  let destinationFrame, paper, curl, exit;

  function prepare() {
    if (!context || forced.matches || reduce.matches || destination.origin !== location.origin) return;
    if (!destinationFrame) {
      destinationFrame = document.createElement('iframe');
      destinationFrame.className = 'game-destination';
      destinationFrame.title = 'Projects page preview';
      destinationFrame.tabIndex = -1;
      destinationFrame.setAttribute('aria-hidden', 'true');
      destinationFrame.inert = true;
      destinationFrame.addEventListener('load', () => {
        try { ready = !!destinationFrame.contentDocument?.querySelector('#page-title'); }
        catch { ready = false; }
      });
      destinationFrame.src = destination.href;
      body.append(destinationFrame);
    }
  }

  function paint(items = objects) {
    context.clearRect(0, 0, width, height);
    for (const item of items) drawObject(context, item.sprite, item);
  }

  function measure() {
    width = canvas.clientWidth || innerWidth;
    height = canvas.clientHeight || innerHeight;
    prepareCanvas(canvas, context, width, height);
    objects = scatterObjects(width, height, sprites);
  }

  function schedule() { frame = requestAnimationFrame(tick); }

  function syncPreview() {
    if (!context || phase) return;
    cancelAnimationFrame(frame);
    frame = 0;
    if (!previewing || forced.matches || !sprites.length) {
      if (width) context.clearRect(0, 0, width, height);
      objects = [];
      return;
    }
    if (!objects.length) measure();
    paint();
    if (document.hidden || reduce.matches) return;
    last = performance.now();
    schedule();
  }

  function navigate() {
    if (navigating) return;
    navigating = true;
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    location.assign(destination.href);
  }

  function cleanup() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    frame = timer = 0;
    phase = '';
    navigating = previewing = false;
    objects = [];
    if (width) context.clearRect(0, 0, width, height);
    paper?.remove();
    curl?.canvas.remove();
    paper = curl = exit = null;
    delete body.dataset.gameTransition;
    root.style.removeProperty('--game-paper-edge');
    root.style.removeProperty('--game-heading-edge');
    reset();
  }

  function peel(elapsed) {
    const points = curl.paint(elapsed / PEEL_DURATION);
    root.style.setProperty('--game-paper-edge', paperClipPath(points));
    root.style.setProperty('--game-heading-edge', paperClipPath(points, window.scrollY));
  }

  function tick(now) {
    if (phase === 'drain') {
      const elapsed = (now - started) / 1000;
      paint(objectExitFrame(exit, elapsed));
      if (elapsed >= exit.duration) {
        started += exit.duration * 1000;
        phase = body.dataset.gameTransition = 'peel';
        body.append(paper, curl.canvas);
        peel((now - started) / 1000);
      }
    } else if (phase === 'peel') {
      const elapsed = (now - started) / 1000;
      peel(elapsed);
      if (elapsed >= PEEL_DURATION) { navigate(); return; }
    } else {
      driftObjects(objects, width, height, Math.min(.05, (now - last) / 1000), sprites);
      last = now;
      paint();
    }
    schedule();
  }

  function play(event) {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    if (phase || blocked()) { event.preventDefault(); return; }
    if (!ready || !sprites.length || reduce.matches || forced.matches) return;
    if (!objects.length) measure();
    const color = getComputedStyle(root).getPropertyValue('--paper').trim();
    curl = createPaperCurl(width, height, color);
    if (!curl) return;
    event.preventDefault();
    begin();
    cancelAnimationFrame(frame);
    exit = prepareObjectExit(objects, width, height);
    objects = [];
    phase = body.dataset.gameTransition = 'drain';
    curl.canvas.className = 'game-curl';
    paper = document.createElement('div');
    paper.className = 'game-paper';
    paper.setAttribute('aria-hidden', 'true');
    started = performance.now();
    schedule();
    // Timers and navigation still complete when a browser interrupts the animation.
    timer = setTimeout(navigate, (exit.duration + PEEL_DURATION) * 1000 + 260);
  }

  if (context) {
    Promise.all(SPRITES.map(async ([name, scale]) => {
      const image = new Image();
      image.src = new URL(`assets/game-objects/${name}.webp`, import.meta.url).href;
      try {
        await image.decode();
        const longest = Math.max(image.naturalWidth, image.naturalHeight);
        return { image, scale, widthRatio: image.naturalWidth / longest, heightRatio: image.naturalHeight / longest };
      } catch { return null; }
    })).then(loaded => { sprites = loaded.filter(Boolean); syncPreview(); });
  }
  link.addEventListener('click', play);
  window.addEventListener('resize', () => {
    if (phase) { navigate(); return; }
    objects = [];
    syncPreview();
  });
  window.addEventListener('pagehide', () => {
    if (phase) cleanup();
    else cancelAnimationFrame(frame);
  });
  window.addEventListener('pageshow', event => { if (event.persisted) syncPreview(); });
  document.addEventListener('visibilitychange', () => {
    if (phase && document.hidden) navigate();
    else syncPreview();
  });
  for (const preference of [reduce, forced]) preference.addEventListener('change', () => {
    if (phase && preference.matches) navigate();
    else { prepare(); syncPreview(); }
  });
  prepare();
  return {
    get active() { return !!phase; },
    setPreview(value) { previewing = value; syncPreview(); },
  };
}
