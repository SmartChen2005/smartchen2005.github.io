const SPRITES = [
  ['mini-key', .82], ['green-wallet', .88], ['pocketknife', .96],
  ['mini-cooper', 1.23], ['bmw-z4', 1.25],
];
const MAX_EXIT_DURATION = 1.16;
export const PEEL_DURATION = .94;
const EDGE_PADDING = 64;
const SLOPE = .9;
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
      vx: -speed, vy: speed * SLOPE,
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
    const lane = item.y + item.x * SLOPE;
    item.x = Math.min(width + EDGE_PADDING, (lane + EDGE_PADDING) / SLOPE);
    item.y = lane - item.x * SLOPE;
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

export function paperPeelFrame(width, height, progress) {
  const corners = [[0, 0], [width, 0], [width, height], [0, height]];
  const angle = Math.atan2(-SLOPE, 1);
  const nx = Math.cos(angle), ny = Math.sin(angle);
  const t = clamp(progress, 0, 1);
  const eased = t * t * (3 - 2 * t);
  const edge = width * nx * (1 - eased) + height * ny * eased;
  const paper = [], crossing = [];
  corners.forEach((point, index) => {
    const next = corners[(index + 1) % corners.length];
    const distance = point[0] * nx + point[1] * ny - edge;
    const nextDistance = next[0] * nx + next[1] * ny - edge;
    if (distance <= 0) paper.push(point);
    if ((distance <= 0) === (nextDistance <= 0)) return;
    const ratio = distance / (distance - nextDistance);
    const intersection = [mix(point[0], next[0], ratio), mix(point[1], next[1], ratio)];
    paper.push(intersection);
    crossing.push(intersection[0] * -ny + intersection[1] * nx);
  });
  const depth = Math.sin(Math.PI * t) ** .43 * clamp(Math.min(width, height) * .071, 23, 70);
  const [a = 0, b = 0] = crossing;
  return { paper, angle, edge, depth, start: Math.min(a, b), end: Math.max(a, b) };
}

function prepareCanvas(canvas, context, width, height) {
  const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(3_200_000 / (width * height)));
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
}

function drawObject(context, sprite, { x, y, angle, size }) {
  const w = size * sprite.widthRatio, h = size * sprite.heightRatio;
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.drawImage(sprite.image, -w / 2, -h / 2, w, h);
  context.restore();
}

function drawCurl(context, { angle, edge, depth, start, end }, paper) {
  if (depth < .5 || end - start < 1) return;
  context.save();
  context.rotate(angle);
  context.translate(edge, 0);
  const shadow = context.createLinearGradient(0, 0, depth * 1.4, 0);
  shadow.addColorStop(0, '#211d1955');
  shadow.addColorStop(.44, '#211d1926');
  shadow.addColorStop(1, '#211d1900');
  context.fillStyle = shadow;
  context.fillRect(0, start - depth, depth * 1.4, end - start + depth * 2);

  // The fold's cross section rolls from the sheet into a lit crest, then doubles underneath.
  const face = context.createLinearGradient(-depth, 0, depth * .44, 0);
  face.addColorStop(0, paper);
  face.addColorStop(.21, '#e2e0da');
  face.addColorStop(.49, '#fffefa');
  face.addColorStop(.67, '#f4f1e9');
  face.addColorStop(.90, '#c4c0b5');
  face.addColorStop(1, '#8e897d');
  context.fillStyle = face;
  context.beginPath();
  context.roundRect(-depth, start - depth * .78, depth * 1.44, end - start + depth * 1.56, depth * .46);
  context.fill();
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
  let destinationFrame, paper, curl, curlContext, paperColor, exit;

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
    curl?.remove();
    paper = curl = curlContext = exit = null;
    delete body.dataset.gameTransition;
    root.style.removeProperty('--game-paper-edge');
    root.style.removeProperty('--game-heading-edge');
    reset();
  }

  function peel(elapsed) {
    const geometry = paperPeelFrame(width, height, elapsed / PEEL_DURATION);
    const clip = (offsetY) => `polygon(${geometry.paper.map(([x, y]) => `${x}px ${y + offsetY}px`).join(',')})`;
    root.style.setProperty('--game-paper-edge', clip(0));
    root.style.setProperty('--game-heading-edge', clip(window.scrollY));
    curlContext.clearRect(0, 0, width, height);
    drawCurl(curlContext, geometry, paperColor);
  }

  function tick(now) {
    if (phase === 'drain') {
      const elapsed = (now - started) / 1000;
      paint(objectExitFrame(exit, elapsed));
      if (elapsed >= exit.duration) {
        started += exit.duration * 1000;
        phase = body.dataset.gameTransition = 'peel';
        body.append(paper, curl);
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
    curl = document.createElement('canvas');
    curlContext = curl.getContext('2d');
    if (!curlContext) return;
    event.preventDefault();
    begin();
    cancelAnimationFrame(frame);
    if (!objects.length) measure();
    exit = prepareObjectExit(objects, width, height);
    objects = [];
    phase = body.dataset.gameTransition = 'drain';
    curl.className = 'game-curl';
    curl.setAttribute('aria-hidden', 'true');
    prepareCanvas(curl, curlContext, width, height);
    paper = document.createElement('div');
    paper.className = 'game-paper';
    paperColor = getComputedStyle(root).getPropertyValue('--paper').trim();
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
