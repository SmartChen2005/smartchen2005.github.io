import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { PHOTO_TRANSITION_DURATION, photoTransitionFrame } from '../dist/home-photo-transition.mjs';
import { createGalleryArchitecture, galleryCamera, projectGalleryPoint, drawGalleryArchitecture } from '../dist/home-gallery-architecture.mjs';

const source = fs.readFileSync(new URL('../dist/home-photo-transition.mjs', import.meta.url), 'utf8');
const near = (actual, expected, message) => assert(Math.abs(actual - expected) < 1e-7, message);
const alphaKeys = ['open', 'travel', 'homeOpacity', 'whiteOpacity', 'roomOpacity', 'trace', 'brandOpacity', 'titleOpacity', 'reveal'];
assert.equal(PHOTO_TRANSITION_DURATION, 3000, 'The photographic journey should last three seconds');
const museum = createGalleryArchitecture();
const groups = new Set(museum.map(path => path.group));
for (const feature of ['oculus', 'coffer', 'dome-rib', 'cornice', 'column', 'capital', 'arch', 'balcony', 'balustrade', 'portal', 'glass', 'floor', 'steps']) {
  assert(groups.has(feature), `The museum must have actual ${feature} geometry`);
}
assert(museum.length < 1000, 'Architectural detail must remain bounded for a short mobile transition');
assert(projectGalleryPoint([0, 0, 100], galleryCamera(1000), 1440, 900) === null, 'Geometry behind the camera must be clipped');
const motionPoint = [5, 3, -3];
const early = projectGalleryPoint(motionPoint, galleryCamera(400), 1440, 900);
const late = projectGalleryPoint(motionPoint, galleryCamera(1800), 1440, 900);
assert(Math.hypot(early.x - late.x, early.y - late.y) > 100, 'Camera travel must produce visible spatial movement');
assert(galleryCamera(1200).roll !== galleryCamera(300).roll, 'The camera must gently bank while advancing');
const css = fs.readFileSync(new URL('../dist/home.css', import.meta.url), 'utf8');
assert(css.includes('animation: develop-print 2600ms'), 'Hover must restore the original photographic development');
assert(/100%\s*\{\s*filter:\s*none;/.test(css), 'Developed hover photographs must settle to their original tones');

for (const [width, height] of [[1440, 900], [1920, 1080], [535, 673], [390, 844], [320, 568], [844, 390]]) {
  for (const time of [350, 900, 1400, 2000, 2400]) for (const path of museum) for (const point of path.points) {
    const projected = projectGalleryPoint(point, galleryCamera(time), width, height);
    if (projected) assert(Object.values(projected).every(Number.isFinite), 'Moving architecture must project to finite coordinates at every viewport');
  }
  const origin = { left: width * .48, top: height * .5, width: 118, height: 42 };
  const destination = { left: 24, top: 32, width: Math.min(260, width - 48), height: 87, fontSize: 28 };
  const savedOrigin = structuredClone(origin), savedDestination = structuredClone(destination);
  const first = photoTransitionFrame(0, width, height, origin, destination);
  assert.deepEqual(first.rear, { x: origin.left - 12, y: origin.top - 8, width: origin.width + 24, height: origin.height + 16 }, 'Viewfinder corners must inherit the clicked word bounds');
  assert.equal(first.homeOpacity, 1); assert.equal(first.reveal, 0); assert.equal(first.brandOpacity, 0);
  let previous = first, previousDistance = Infinity;
  for (let time = 0; time <= PHOTO_TRANSITION_DURATION; time += 10) {
    const state = photoTransitionFrame(time, width, height, origin, destination);
    for (const value of [...Object.values(state.rear), ...Object.values(state.brand), state.titleSize]) assert(Number.isFinite(value), 'Every rendered coordinate must remain finite');
    for (const key of alphaKeys) assert(state[key] >= 0 && state[key] <= 1, `${key} must stay in its visible range`);
    assert(state.rear.width > 0 && state.rear.height > 0 && state.brand.width > 0 && state.brand.height > 0);
    assert(state.homeOpacity <= previous.homeOpacity + 1e-9, 'The home must continuously leave');
    assert(state.reveal >= previous.reveal - 1e-9, 'The loaded Gallery must continuously appear');
    assert(state.trace >= previous.trace - 1e-9, 'The wordmark contour must never erase itself');
    const distance = Math.hypot(state.brand.x - destination.left, state.brand.y - destination.top,
      state.brand.width - destination.width, state.brand.height - destination.height);
    assert(distance <= previousDistance + 1e-7, 'The transitional masthead must settle toward the measured real masthead');
    previous = state; previousDistance = distance;
  }
  const final = photoTransitionFrame(PHOTO_TRANSITION_DURATION, width, height, origin, destination);
  assert.deepEqual(final.brand, { x: destination.left, y: destination.top, width: destination.width, height: destination.height });
  near(final.titleSize, destination.fontSize, 'The title must dock at the real Gallery font size');
  assert.equal(final.homeOpacity, 0); assert.equal(final.whiteOpacity, 0); assert.equal(final.roomOpacity, 0);
  assert.equal(final.reveal, 1); assert.equal(final.trace, 1); assert.equal(final.titleOpacity, 1);
  assert.deepEqual(photoTransitionFrame(-100, width, height, origin, destination), first);
  assert.deepEqual(photoTransitionFrame(9000, width, height, origin, destination), final);
  assert.deepEqual(origin, savedOrigin); assert.deepEqual(destination, savedDestination);
}

// Run the actual controller in an isolated browser-like realm. Destination readiness is
// asynchronous, and RAF/watchdog callbacks remain explicitly controlled by each case.
async function harness(options = {}) {
  const callbacks = new Map(), timers = new Map(), created = [], navigations = [];
  let now = 0, id = 0, resets = 0, otherActive = false, draws = 0, imageDraws = 0;
  function eventTarget(target = {}) {
    const handlers = new Map();
    return Object.assign(target, {
      addEventListener(type, fn) { if (!handlers.has(type)) handlers.set(type, []); handlers.get(type).push(fn); },
      emit(type, event = {}) { return Promise.all((handlers.get(type) || []).map(fn => fn(event))); },
    });
  }
  function style() {
    return { setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } };
  }
  const context = new Proxy({}, {
    get: (_, method) => (...args) => {
      if (method === 'stroke') draws++;
      if (method === 'drawImage') {
        imageDraws++;
      }
      for (const arg of args) if (typeof arg === 'number') assert(Number.isFinite(arg), 'Canvas coordinates must stay finite');
    },
    set: () => true,
  });
  function node(tag) {
    const classes = new Set();
    const item = eventTarget({ tag, children: [], attributes: {}, dataset: {}, style: style(), inert: false,
      classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
      setAttribute(key, value) { this.attributes[key] = value; },
      hasAttribute(key) { return Object.hasOwn(this.attributes, key); },
      append(...children) { this.children.push(...children); },
      remove() { this.removed = true; },
      getContext() { return options.canvas === false ? null : context; },
      cloneNode() { const cloned = node(tag); cloned.localName = this.localName; return cloned; },
      querySelectorAll() { return this.paths ||= [node('path'), node('path')]; },
    });
    created.push(item); return item;
  }
  const home = node('main'), scenery = node('section'), heading = node('h1');
  const target = { left: 24, top: 32, width: 260, height: 87 };
  heading.getBoundingClientRect = () => target;
  const brandImage = { src: 'https://example.test/gallery/assets/mark.svg' };
  heading.querySelector = () => brandImage;
  const doc = { fonts: { ready: Promise.resolve() }, querySelector(selector) {
    if (options.missingBrand) return null;
    return selector === '.gallery-brand' ? heading : selector === '.feature img' ? { decode: () => Promise.resolve() } : null;
  } };
  const body = node('body');
  const document = eventTarget({ body, hidden: false,
    querySelector: selector => selector === '.homepage' ? home : scenery,
    importNode: svg => svg.cloneNode(true),
    createElement(tag) {
      const element = node(tag);
      if (tag === 'iframe') {
        element.contentDocument = doc;
        element.contentWindow = { getComputedStyle: () => ({ fontSize: '28px' }) };
      }
      return element;
    },
  });
  const window = eventTarget();
  const reduce = eventTarget({ matches: !!options.reduced }), forced = eventTarget({ matches: !!options.forced });
  const link = node('a');
  Object.assign(link, { href: options.external ? 'https://elsewhere.test/gallery/' : 'https://example.test/gallery/', target: options.target || '',
    getBoundingClientRect: () => ({ left: 650, top: 425, width: 118, height: 42 }) });
  if (options.download) link.setAttribute('download', '');
  const sandbox = { document, window, URL, createGalleryArchitecture, drawGalleryArchitecture,
    location: { href: 'https://example.test/', origin: 'https://example.test', assign: href => navigations.push(href) },
    matchMedia: query => query.includes('forced-colors') ? forced : reduce,
    fetch: async () => { if (options.fetchFailure) throw new Error('Unavailable'); return { ok: options.responseOK !== false, text: async () => '<svg></svg>' }; },
    DOMParser: class { parseFromString() { const svg = node('svg'); svg.localName = options.invalidSVG ? 'parsererror' : 'svg'; return { documentElement: svg }; } },
    performance: { now: () => now }, innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1.5,
    requestAnimationFrame: fn => { callbacks.set(++id, fn); return id; }, cancelAnimationFrame: key => callbacks.delete(key),
    setTimeout: (fn, delay) => { timers.set(++id, { fn, delay }); return id; }, clearTimeout: key => timers.delete(key),
  };
  vm.createContext(sandbox);
  vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '') + '\nglobalThis.install = installPhotoTransition;', sandbox);
  const controller = sandbox.install(link, () => resets++, () => otherActive);
  const preview = created.find(element => element.tag === 'iframe');
  if (options.ready !== false && preview) await preview.emit('load');
  return { controller, document, window, home, scenery, heading, preview, created, callbacks, timers, reduce, forced, navigations,
    get resets() { return resets; }, get draws() { return draws; }, get imageDraws() { return imageDraws; },
    blockOther(value) { otherActive = value; },
    async click(detail = {}) { const event = { button: 0, preventDefault() { this.prevented = true; }, ...detail }; await link.emit('click', event); return event; },
    step(ms) { now = ms; const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(fn => fn(now)); },
    async load() { await preview?.emit('load'); },
    watchdog() { const pending = [...timers.values()]; timers.clear(); pending.forEach(({ fn }) => fn()); },
  };
}

let app = await harness();
assert.equal(app.preview.attributes['aria-hidden'], 'true'); assert(Object.hasOwn(app.preview.attributes, 'inert'));
for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { button: 2 }, { defaultPrevented: true }]) {
  assert(!((await app.click(options)).prevented), 'Modified and already-handled clicks must retain native navigation');
}
assert(!app.controller.active); assert.equal(app.draws, 0);
assert((await app.click()).prevented); assert(app.controller.active); assert(app.home.inert && app.scenery.inert);
assert.equal(app.heading.style.visibility, 'hidden'); assert.equal(app.document.body.dataset.photoTransition, 'opening');
assert((await app.click()).prevented); assert.equal(app.created.filter(e => e.className === 'photo-entry').length, 1, 'Repeated clicks must not duplicate the transition');
for (let ms = 16; ms < PHOTO_TRANSITION_DURATION; ms += 16) {
  app.step(ms); assert.equal(app.callbacks.size, 1); assert.equal(app.navigations.length, 0);
}
assert.equal(app.document.body.dataset.photoTransition, 'arrival');
app.step(PHOTO_TRANSITION_DURATION);
assert.equal(app.navigations.length, 1); assert.equal(app.navigations[0], 'https://example.test/gallery/');
assert.equal(app.callbacks.size, 0); assert.equal(app.timers.size, 0); assert.equal(app.heading.style.visibility, '');
assert.equal(app.preview.style.opacity, 1);
assert.equal(app.imageDraws, 0, 'The clicked transition must contain no wall photographs');
await app.window.emit('pagehide');
assert(!app.controller.active); assert(!app.home.inert && !app.scenery.inert);
assert.equal(app.document.body.dataset.photoTransition, undefined); assert.equal(app.document.body.style['--photo-home-opacity'], undefined);
assert(app.created.find(e => e.className === 'photo-entry').removed); assert.equal(app.preview.style.opacity, '');
assert(!app.preview.classList.contains('is-revealed')); assert.equal(app.resets, 1);
await app.window.emit('pageshow', { persisted: true });
assert(!app.controller.active); assert.equal(app.resets, 2);
assert((await app.click()).prevented, 'Browser Back must permit a second journey');
await app.window.emit('resize');
assert.equal(app.navigations.length, 2, 'Resize must finish navigation rather than leave stale viewport geometry');
await app.window.emit('resize'); assert.equal(app.navigations.length, 2, 'Repeated finish events must only navigate once');

for (const options of [{ reduced: true }, { forced: true }, { ready: false }, { missingBrand: true }, { responseOK: false },
  { fetchFailure: true }, { invalidSVG: true }, { canvas: false }, { external: true }, { download: true }, { target: '_blank' }]) {
  app = await harness(options);
  assert(!((await app.click()).prevented), `Native fallback must survive ${JSON.stringify(options)}`);
  assert(!app.controller.active); assert.equal(app.navigations.length, 0);
  assert(!app.home.inert && !app.scenery.inert);
}
app = await harness({ ready: false });
assert(!((await app.click()).prevented)); await app.load();
assert((await app.click({ detail: 0 })).prevented, 'Keyboard entry must work once asynchronous Gallery preparation completes');
app = await harness(); app.blockOther(true);
assert((await app.click()).prevented); assert(!app.controller.active); assert.equal(app.draws, 0);

for (const exit of ['hidden', 'Escape', 'reduced', 'forced', 'watchdog']) {
  app = await harness(); await app.click();
  if (exit === 'hidden') { app.document.hidden = true; await app.document.emit('visibilitychange'); }
  else if (exit === 'Escape') await app.document.emit('keydown', { key: 'Escape' });
  else if (exit === 'watchdog') { assert.equal([...app.timers.values()][0].delay, PHOTO_TRANSITION_DURATION + 150); app.watchdog(); }
  else { app[exit === 'reduced' ? 'reduce' : 'forced'].matches = true; await app[exit === 'reduced' ? 'reduce' : 'forced'].emit('change'); }
  assert.equal(app.navigations.length, 1, `${exit} must immediately complete the Gallery navigation`);
  assert.equal(app.callbacks.size, 0); assert.equal(app.timers.size, 0); assert.equal(app.heading.style.visibility, '');
  await app.window.emit('pagehide'); assert(!app.home.inert && !app.scenery.inert); assert(!app.controller.active);
}
console.log('Passed: detailed museum geometry across six viewports; finite projection and visible camera travel/banking; restored darkroom hover; no transition wall photographs; clicked-word origin and exact masthead docking; 3s navigation; keyboard/native link behavior; duplicate prevention; reduced/forced/load fallbacks; interrupted navigation and Back restoration.');
