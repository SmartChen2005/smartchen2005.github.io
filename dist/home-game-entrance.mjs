const SPRITES = [
  ['mini-key', .82], ['green-wallet', .88], ['pocketknife', .96],
  ['mini-cooper', 1.23], ['bmw-z4', 1.25],
];
export const DRAIN_DURATION = 1.16;
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

export function collectObjects(objects, width, height, random = Math.random) {
  return objects.filter(({ x, y, size }) => x + size / 2 > 0 && y + size / 2 > 0 &&
    x - size / 2 < width && y - size / 2 < height).map(item => {
    const endX = 10 + random() * Math.min(70, width * .12);
    const endY = height - 7 - random() * Math.min(42, height * .08);
    const distance = Math.hypot(item.x - endX, item.y - endY) / Math.hypot(width, height);
    const duration = .38 + Math.sqrt(distance) * .58 + random() * .08;
    return { ...item, endX, endY, duration, endAngle: item.angle + mix(-1.05, .85, random()) };
  });
}

export function landingPose(item, elapsed) {
  const progress = clamp(elapsed / item.duration, 0, 1);
  const accelerate = (start, velocity, end) =>
    start + velocity * item.duration * progress * (1 - progress) + (end - start) * progress ** 2;
  const bounce = Math.sin(Math.PI * clamp((elapsed - item.duration) / .14, 0, 1));
  return {
    x: accelerate(item.x, item.vx, item.endX),
    y: accelerate(item.y, item.vy, item.endY) - bounce * 7,
    angle: accelerate(item.angle, item.spin, item.endAngle),
    size: item.size * mix(1, .56, progress ** 3),
  };
}

export function paperPeelFrame(width, height, progress) {
  const corners = [[0, 0], [width, 0], [width, height], [0, height]];
  const angle = Math.atan2(width, height * 1.13);
  const nx = Math.cos(angle), ny = Math.sin(angle);
  const t = clamp(progress, 0, 1);
  const edge = (width * nx + height * ny) * (1 - t * t * (3 - 2 * t));
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
  const { image } = sprite;
  const scale = size / Math.max(image.naturalWidth, image.naturalHeight);
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.drawImage(image, -w / 2, -h / 2, w, h);
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
  let destinationFrame, paper, curl, curlContext, paperColor;

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

  function paint() {
    context.clearRect(0, 0, width, height);
    for (const item of objects) drawObject(context, item.sprite, item);
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
    paper = curl = curlContext = null;
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
    if (geometry.paper.length >= 3) {
      curlContext.save();
      curlContext.beginPath();
      curlContext.moveTo(...geometry.paper[0]);
      for (const corner of geometry.paper.slice(1)) curlContext.lineTo(...corner);
      curlContext.closePath();
      curlContext.clip();
      for (const item of objects) drawObject(curlContext, item.sprite, item);
      curlContext.restore();
    }
    drawCurl(curlContext, geometry, paperColor);
  }

  function tick(now) {
    if (phase === 'drain') {
      const elapsed = (now - started) / 1000;
      context.clearRect(0, 0, width, height);
      if (elapsed < DRAIN_DURATION) {
        for (const item of objects) drawObject(context, item.sprite, landingPose(item, elapsed));
      } else {
        objects = objects.map(item => ({ ...landingPose(item, DRAIN_DURATION), sprite: item.sprite }));
        phase = body.dataset.gameTransition = 'peel';
        body.append(paper, curl);
        peel(elapsed - DRAIN_DURATION);
      }
    } else if (phase === 'peel') {
      const elapsed = (now - started) / 1000 - DRAIN_DURATION;
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
    objects = collectObjects(objects, width, height);
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
    timer = setTimeout(navigate, (DRAIN_DURATION + PEEL_DURATION) * 1000 + 260);
  }

  if (context) {
    Promise.all(SPRITES.map(async ([name, scale]) => {
      const image = new Image();
      image.src = new URL(`assets/game-objects/${name}.webp`, import.meta.url).href;
      try { await image.decode(); return { image, scale }; }
      catch { return null; }
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
