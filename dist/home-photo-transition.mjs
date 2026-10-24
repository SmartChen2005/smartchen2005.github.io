import { createGalleryArchitecture, drawGalleryArchitecture } from './home-gallery-architecture.mjs?rev=20261014-no-steps';
// A viewfinder opens into an imagined art museum, then becomes the Gallery masthead.
const architecture = createGalleryArchitecture();
export const PHOTO_TRANSITION_DURATION = 3000;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const phase = (time, start, end) => ease((time - start) / (end - start));

export function photoTransitionFrame(time, width, height, origin, destination) {
  time = Math.max(0, Math.min(PHOTO_TRANSITION_DURATION, time));
  const open = phase(time, 0, 820), travel = phase(time, 640, 2040);
  const dock = phase(time, 1750, 2650);
  const center = { x: width / 2, y: height * .47 };
  const roomWidth = Math.min(width * .57, 820), roomHeight = Math.min(height * .49, 460);
  const room = { x: center.x - roomWidth / 2, y: center.y - roomHeight / 2, width: roomWidth, height: roomHeight };
  const source = { x: origin.left - 12, y: origin.top - 8, width: origin.width + 24, height: origin.height + 16 };
  const frame = {
    x: mix(source.x, room.x - roomWidth * travel * .8, open),
    y: mix(source.y, room.y - roomHeight * travel * .8, open),
    width: mix(source.width, roomWidth * (1 + travel * 1.6), open),
    height: mix(source.height, roomHeight * (1 + travel * 1.6), open),
  };
  // The original viewfinder passes beyond the viewport as the viewer enters the museum.
  const aperture = phase(time, 250, 1050);
  const rear = {
    x: mix(frame.x, -width * .12, aperture), y: mix(frame.y, -height * .12, aperture),
    width: mix(frame.width, width * 1.24, aperture), height: mix(frame.height, height * 1.24, aperture),
  };
  const brandWidth = Math.min(width - 36, 660);
  const brandHeight = brandWidth / 3;
  const brand = {
    x: mix(center.x - brandWidth / 2, destination.left, dock),
    y: mix(center.y - brandHeight / 2, destination.top, dock),
    width: mix(brandWidth, destination.width, dock),
    height: mix(brandHeight, destination.height, dock),
  };
  return {
    time, rear, brand, open, travel,
    homeOpacity: 1 - phase(time, 180, 540),
    whiteOpacity: phase(time, 160, 680) * (1 - phase(time, 2260, 2900)),
    roomOpacity: phase(time, 0, 160) * (1 - phase(time, 1850, 2440)),
    trace: phase(time, 690, 1570), brandOpacity: phase(time, 680, 950),
    titleOpacity: phase(time, 990, 1370),
    titleSize: mix(Math.min(68, width * .088), destination.fontSize, dock),
    reveal: phase(time, 2150, 2870),
  };
}

export function installPhotoTransition(link, resetHome = () => {}, otherTransitionActive = () => false) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const destination = new URL(link.href, location.href);
  let preview = null, ready = false, mark = null, active = false, navigating = false;
  let frame = 0, timer = 0, layer = null, heading = null;
  // Capture the host page before appending the preview so this controller can
  // also leave Projects and other pages without depending on homepage markup.
  const sources = [...document.querySelectorAll('body > :not(script):not(style):not(link)')];
  const previousInert = new Map();

  function prepare() {
    if (preview || reduce.matches || forced.matches || destination.origin !== location.origin) return;
    preview = document.createElement('iframe');
    preview.className = 'photo-destination';
    preview.title = 'The Gallery page preview';
    preview.tabIndex = -1;
    preview.setAttribute('aria-hidden', 'true');
    preview.setAttribute('inert', '');
    preview.addEventListener('load', async () => {
      try {
        const doc = preview.contentDocument;
        const brand = doc?.querySelector('.gallery-brand');
        const image = brand?.querySelector('img');
        if (!brand || !image) return;
        await doc.fonts.ready;
        const response = await fetch(image.src);
        if (!response.ok) return;
        const svg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
        if (svg.localName !== 'svg') return;
        mark = document.importNode(svg, true);
        // Wait for the selected cover so the reveal opens onto a photograph.
        const cover = doc.querySelector('.feature img');
        if (cover) await cover.decode().catch(() => {});
        ready = true;
      } catch { ready = false; }
    });
    preview.src = destination.href;
    document.body.append(preview);
  }
  function navigate() {
    if (navigating) return;
    navigating = true;
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    if (heading) heading.style.visibility = '';
    // Give the browser a clean, fully loaded Gallery frame to carry into the
    // new document. This also settles interrupted journeys before navigation.
    preview.style.opacity = '1';
    if (layer) layer.style.visibility = 'hidden';
    document.body.style.setProperty('--photo-home-opacity', '0');
    document.body.dataset.photoTransition = 'handoff';
    const commit = () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      location.assign(destination.href);
    };
    // Let the iframe's restored heading and the removed drawing commit before
    // the browser captures its outgoing frame; bound this to one paint/50ms.
    if (document.hidden || reduce.matches || forced.matches) commit();
    else {
      frame = requestAnimationFrame(commit);
      timer = setTimeout(commit, 50);
    }
  }
  function cleanup() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    layer?.remove(); layer = null;
    if (heading) heading.style.visibility = '';
    heading = null;
    preview?.classList.remove('is-revealed');
    if (preview) preview.style.opacity = '';
    delete document.body.dataset.photoTransition;
    document.body.style.removeProperty('--photo-home-opacity');
    for (const [source, inert] of previousInert) {
      source.inert = inert;
      source.removeAttribute('data-photo-source');
    }
    previousInert.clear();
    active = navigating = false;
    resetHome();
  }
  function play(event) {
    // Modified clicks always retain the browser's native link behavior.
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    if (active || otherTransitionActive()) { event.preventDefault(); return; }
    if (reduce.matches || forced.matches || !ready) return;
    const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
    if (!context) return;
    let target;
    try {
      heading = preview.contentDocument.querySelector('.gallery-brand');
      const rect = heading.getBoundingClientRect();
      const styles = preview.contentWindow.getComputedStyle(heading);
      target = { left: rect.left, top: rect.top, width: rect.width, height: rect.height, fontSize: parseFloat(styles.fontSize) };
    } catch { return; }
    const width = innerWidth, height = innerHeight, origin = link.getBoundingClientRect();
    event.preventDefault();
    active = true;
    heading.style.visibility = 'hidden';
    for (const source of sources) {
      previousInert.set(source, source.inert);
      source.inert = true;
      source.setAttribute('data-photo-source', '');
    }
    document.body.dataset.photoTransition = 'opening';
    preview.classList.add('is-revealed');
    layer = document.createElement('div');
    layer.className = 'photo-entry';
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('inert', '');
    const shade = document.createElement('div'); shade.className = 'photo-entry-white';
    canvas.className = 'photo-entry-lines';
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const brand = document.createElement('div'); brand.className = 'photo-entry-brand';
    const svg = mark.cloneNode(true); svg.classList.add('photo-entry-mark');
    svg.setAttribute('aria-hidden', 'true');
    const paths = [...svg.querySelectorAll('path')];
    for (const path of paths) path.setAttribute('pathLength', '1');
    const title = document.createElement('span'); title.textContent = 'The Gallery';
    brand.append(svg, title);
    layer.append(shade, canvas, brand);
    document.body.append(layer);
    const started = performance.now();

    function line(x1, y1, x2, y2) {
      context.moveTo(x1, y1); context.lineTo(x2, y2);
    }
    function draw(now) {
      const state = photoTransitionFrame(now - started, width, height, origin, target);
      const r = state.rear, right = r.x + r.width, bottom = r.y + r.height;
      document.body.dataset.photoTransition = state.time < 1750 ? 'opening' : 'arrival';
      document.body.style.setProperty('--photo-home-opacity', String(state.homeOpacity));
      shade.style.opacity = state.whiteOpacity;
      preview.style.opacity = state.reveal;
      context.clearRect(0, 0, width, height);
      context.strokeStyle = '#111'; context.lineWidth = .8;
      context.globalAlpha = state.roomOpacity;
      // The first four corners inherit the clicked Gallery link's on-screen bounds.
      const corner = mix(10, Math.min(r.width, r.height) * .22, state.open);
      context.beginPath();
      for (const [x, y, dx, dy] of [[r.x, r.y, 1, 1], [right, r.y, -1, 1], [r.x, bottom, 1, -1], [right, bottom, -1, -1]]) {
        line(x + dx * corner, y, x, y); line(x, y, x, y + dy * corner);
      }
      context.stroke();
      context.save();
      context.beginPath(); context.rect(r.x, r.y, r.width, r.height); context.clip();
      drawGalleryArchitecture(context, architecture, state.time, width, height, state.roomOpacity * state.open);
      context.restore();
      const b = state.brand;
      // Keep the traced wordmark readable within the increasingly detailed interior.
      context.save();
      context.globalCompositeOperation = 'destination-out';
      context.globalAlpha = state.titleOpacity;
      context.beginPath(); context.ellipse(b.x + b.width / 2, b.y + b.height / 2, b.width * .37, b.height * .49, 0, 0, Math.PI * 2); context.fill();
      context.restore();
      Object.assign(brand.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.width}px`, height: `${b.height}px`, opacity: String(state.brandOpacity) });
      title.style.fontSize = `${state.titleSize}px`;
      title.style.opacity = state.titleOpacity;
      for (const path of paths) {
        path.style.strokeDasharray = '1';
        path.style.strokeDashoffset = String(1 - state.trace);
      }
      if (state.time >= PHOTO_TRANSITION_DURATION) navigate();
      else frame = requestAnimationFrame(draw);
    }
    draw(started);
    timer = setTimeout(navigate, PHOTO_TRANSITION_DURATION + 150);
  }
  link.addEventListener('pointerenter', prepare);
  link.addEventListener('focus', prepare);
  link.addEventListener('click', play);
  window.addEventListener('resize', () => { if (active) navigate(); });
  window.addEventListener('pagehide', () => {
    // Preserve the outgoing frame for the native cross-document snapshot.
    // A restored homepage is reset by pageshow before it becomes interactive.
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    if (active && !navigating) cleanup();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) cleanup(); });
  document.addEventListener('visibilitychange', () => { if (active && document.hidden) navigate(); });
  document.addEventListener('keydown', event => { if (active && event.key === 'Escape') navigate(); });
  for (const preference of [reduce, forced]) preference.addEventListener('change', () => { if (active && preference.matches) navigate(); });
  // Warm once for touch and keyboard users too. A failed preview keeps the native link.
  prepare();
  return { get active() { return active; } };
}
