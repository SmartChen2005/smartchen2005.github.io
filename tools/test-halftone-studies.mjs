import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as halftone from '../dist/projects/figures-of-speech/halftone-bloom/halftone.mjs';

const root = new URL('../dist/projects/figures-of-speech/halftone-bloom/', import.meta.url);
const cases = ['exposure', 'lunar', 'botanical', 'shoal', 'tide'];
const read = reference => fs.readFileSync(new URL(reference, root), 'utf8');
const exists = url => fs.existsSync(url);

// The experiments are independently addressable, but are not entries in the
// public Figures of Speech catalogue or its chronology.
const catalogue = fs.readFileSync(new URL('../dist/projects/figures-of-speech/index.html', import.meta.url), 'utf8');
assert(!catalogue.includes('halftone-bloom'), 'The studies must remain outside the Figures of Speech catalogue');
const hub = read('studies/index.html');
for (const id of cases) {
  assert(hub.includes(`../${id}/`), `The study index must link to ${id}`);
  const pageURL = new URL(`${id}/index.html`, root);
  const page = fs.readFileSync(pageURL, 'utf8');
  assert(/<canvas\b/.test(page), `${id} must contain its own visual stage`);
  assert(/<h1\b/.test(page), `${id} must have an accessible heading before JavaScript`);
  assert(/<title>[^<]+<\/title>/.test(page), `${id} needs a meaningful document title`);
  assert(/<noscript>/.test(page), `${id} needs a no-JavaScript explanation`);
  assert(!/<iframe\b/.test(page), `${id} must run independently rather than embed another page`);
}

function checkReferences(relative, seen = new Set()) {
  const url = new URL(relative, root);
  const key = url.href.split(/[?#]/)[0];
  if (seen.has(key)) return;
  seen.add(key);
  assert(exists(new URL(key)), `Missing local dependency: ${relative}`);
  if (!/\.(?:html|mjs|css)$/.test(url.pathname)) return;
  const text = fs.readFileSync(url, 'utf8');
  const references = [];
  if (/\.html$/.test(url.pathname)) references.push(...[...text.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]));
  if (/\.(?:mjs|css)$/.test(url.pathname)) {
    references.push(...[...text.matchAll(/(?:import|export)\s+(?:[^'";\n]*?\s+from\s*)?['"]([^'"]+)['"]/g)].map(match => match[1]));
    references.push(...[...text.matchAll(/new URL\(['"]([^'"]+)['"],\s*import.meta.url\)/g)].map(match => match[1]));
    references.push(...[...text.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(match => match[1]));
  }
  for (const reference of references) {
    if (/^(?:#|https?:|data:|mailto:)/.test(reference)) continue;
    const target = new URL(reference, url);
    assert(exists(new URL(target.href.split(/[?#]/)[0])), `Broken dependency: ${relative} -> ${reference}`);
    // Follow executable/style dependencies; native navigation destinations only
    // need to exist and must not drag the entire portfolio into this unit check.
    if (/\.(?:mjs|css)$/.test(target.pathname)) checkReferences(target.href, seen);
  }
}
for (const id of [...cases, 'studies']) checkReferences(`${id}/index.html`);

const titles = new Set();
const renderers = new Map();
for (const id of cases) {
  const sourceURL = new URL(`sources/${id}.mjs`, root);
  execFileSync(process.execPath, ['--check', fileURLToPath(sourceURL)]);
  const source = await import(sourceURL);
  renderers.set(id, source);
  assert.equal(typeof source.drawSource, 'function', `${id} must provide a complete scene renderer`);
  const { meta } = source;
  assert.equal(typeof meta?.title, 'string');
  assert(meta.title.trim().length > 0);
  assert.equal(typeof meta.description, 'string');
  assert(meta.description.trim().length > 0);
  assert(Number.isFinite(meta.duration) && meta.duration >= 4 && meta.duration <= 30, `${id} needs a bounded, complete animation`);
  assert(Number.isFinite(meta.posterTime) && meta.posterTime >= 0 && meta.posterTime <= meta.duration, `${id} needs a valid still frame`);
  assert(!titles.has(meta.title), 'Each study must have its own identity');
  titles.add(meta.title);
  const code = fs.readFileSync(sourceURL, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert(!/\b(?:Math\.random|requestAnimationFrame|setInterval|Date\.now|performance\.now)\s*\(/.test(code), `${id} must be a deterministic function of the supplied timeline`);
}

// Lunar writes its actual shaded raster, so its phase/eclipsing sequence can be
// checked without mocking Canvas path rasterization or requiring a browser.
const lunar = renderers.get('lunar');
let raster;
const rasterContext = {
  createImageData: (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
  putImageData: image => { raster = image.data.slice(); },
};
const moonFrame = time => {
  lunar.drawSource(rasterContext, time, { width: 128, height: 128, seed: 29 });
  return raster;
};
const openingMoon = moonFrame(0);
const posterMoon = moonFrame(lunar.meta.posterTime);
const eclipsedMoon = moonFrame(6.75);
const finalMoon = moonFrame(lunar.meta.duration);
const inkEnergy = pixels => pixels.reduce((sum, value, index) => sum + (index % 4 === 0 ? value : 0), 0);
assert(inkEnergy(posterMoon) > inkEnergy(openingMoon) * 2, 'The crescent must grow into an illuminated moon');
assert(inkEnergy(eclipsedMoon) < inkEnergy(posterMoon) * .3, 'The moving shadow must visibly eclipse the surface');
assert(inkEnergy(finalMoon) > inkEnergy(posterMoon) * .7, 'The complete animation must return to a readable moon');
assert.deepEqual(moonFrame(lunar.meta.posterTime), posterMoon, 'Seeking out of order must preserve the same crater texture and lighting');
assert(new Set(posterMoon.filter((_, index) => index % 4 === 0)).size > 50, 'The source must supply detailed tones for square dithering');

for (const name of ['hash', 'smooth', 'sampleLuminance', 'buildGrid', 'revealAt', 'pointVisible']) {
  assert.equal(typeof halftone[name], 'function', `Missing shared halftone operation: ${name}`);
}
for (let y = 0; y < 30; y++) for (let x = 0; x < 40; x++) {
  const a = halftone.hash(x, y, 29);
  assert(a >= 0 && a < 1 && Number.isFinite(a));
  assert.equal(a, halftone.hash(x, y, 29));
}
assert.notEqual(halftone.hash(20, 20, 29), halftone.hash(20, 20, 30));
assert.equal(halftone.smooth(0, 1, -1), 0);
assert.equal(halftone.smooth(0, 1, 2), 1);
assert.equal(halftone.smooth(0, 1, .5), .5);

// Black/white endpoints, ordered density and varied reveal thresholds are the
// visual contract. Tests intentionally do not pin one aesthetic random seed.
const black = halftone.sampleLuminance(0, 0, 0);
const white = halftone.sampleLuminance(255, 255, 255);
assert.equal(black, 0);
assert(Math.abs(white - 1) < .000001, 'White luminance must normalize to one');
const gray = halftone.sampleLuminance(128, 128, 128);
assert(gray > black && gray < white);
let sparse = 0, dense = 0;
const births = [];
for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
  const lower = halftone.pointVisible(gray, x, y, { density: .7, seed: 29 });
  const higher = halftone.pointVisible(gray, x, y, { density: 1.3, seed: 29 });
  assert(!lower || higher, 'Increasing density must retain existing square dots');
  assert(!halftone.pointVisible(black, x, y, { density: 1.3, seed: 29 }), 'A black scene must remain black');
  assert(!halftone.pointVisible(white, x, y, { density: 0, seed: 29 }), 'Zero density must turn off the field');
  sparse += Number(lower); dense += Number(higher);
  const birth = halftone.revealAt(x / 63, y / 63, 29);
  assert(Number.isFinite(birth) && birth >= 0 && birth <= 1);
  assert.equal(birth, halftone.revealAt(x / 63, y / 63, 29));
  births.push(birth);
}
assert(sparse > 0 && dense > sparse, 'Density adjustment must visibly change the population');
assert(Math.max(...births) - Math.min(...births) > .2, 'Dots must activate at staggered spatial times');

for (const [width, height] of [[320, 568], [1440, 900], [3840, 2160]]) {
  const grid = halftone.buildGrid(width, height, { pitch: 3.6, maxCells: 110000 });
  assert(grid.columns > 0 && grid.rows > 0 && grid.pitch >= 3.6);
  assert(grid.columns * grid.rows < 111000, 'Halftone grid work must stay bounded on 4K displays');
  assert(grid.points.length <= grid.columns * grid.rows && grid.points.length > 1000);
  const positions = new Set();
  for (const point of grid.points) {
    assert(point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height);
    assert(point.u >= 0 && point.u <= 1 && point.v >= 0 && point.v <= 1);
    assert(point.threshold >= 0 && point.threshold < 1 && point.birth >= 0 && point.birth <= 1);
    positions.add(`${point.x},${point.y}`);
  }
  assert.equal(positions.size, grid.points.length, 'No grid location may be painted twice');
}

// Run the real controller with a controllable clock and scene loading. Canvas
// rasterization is covered above/browser QA; these checks exercise user actions
// and asynchronous lifecycle ordering rather than a second controller model.
function controller({ reduced = false, contrast = false, deferred = false, prepareFailures = 0, drawFailure = false, canvasAvailable = true } = {}) {
  let now = 0, next = 1, failDraw = drawFailure, failures = prepareFailures;
  let resize, release;
  const frames = new Map(), events = new Map(), preferences = new Map(), renderTimes = [];
  const bounds = { width: 240 };
  const gate = deferred ? new Promise(resolve => { release = resolve; }) : Promise.resolve();
  const element = id => {
    const handlers = new Map();
    return {
      id, value: '', textContent: '', hidden: true, disabled: true, dataset: {}, attributes: {}, open: false,
      addEventListener: (name, cb) => handlers.set(name, cb),
      emit: (name, event = {}) => handlers.get(name)?.(event),
      setAttribute(name, value) { this.attributes[name] = value; },
      getBoundingClientRect: () => bounds,
      closest: () => null,
      contains: () => false,
      focus() { document.activeElement = this; },
    };
  };
  const elements = Object.fromEntries(['experiment', 'field', 'art', 'controls', 'status', 'failure', 'retry', 'replay', 'play', 'seek', 'clock', 'adjust', 'density', 'speed', 'density-value', 'speed-value'].map(id => [id, element(id)]));
  elements.density.value = '100'; elements.speed.value = '1'; elements.seek.value = '0';
  const summary = element('summary'); elements.adjust.querySelector = () => summary;
  const context = { save() {}, restore() {}, setTransform() {}, fillRect() {}, getImageData: () => ({ data: new Uint8ClampedArray(4) }) };
  elements.field.getContext = () => canvasAvailable ? context : null;
  const document = {
    hidden: false, body: { dataset: { study: 'exposure' } },
    querySelector: selector => selector === '.art-stage' ? elements.art : elements[selector.slice(1)],
    createElement: () => ({ getContext: () => context }),
    addEventListener: (name, cb) => events.set(name, cb),
  };
  const scene = {
    meta: { title: 'Harness', duration: 8, posterTime: 3 },
    async prepare() { await gate; if (failures-- > 0) throw new Error('Image preparation failed'); },
    drawSource(_, time) { if (failDraw) throw new Error('Scene draw failed'); renderTimes.push(time); },
  };
  const boot = vm.runInNewContext(read('studies.mjs').replace(/^import[^\n]+\n/gm, ''), {
    document, window: { addEventListener: (name, cb) => events.set(name, cb) },
    buildGrid: halftone.buildGrid, paintHalftone: () => 123, studyIds: cases, loadStudy: async () => scene,
    devicePixelRatio: 2, performance: { now: () => now },
    console: { error() {}, warn() {} },
    requestAnimationFrame: cb => { const id = next++; frames.set(id, cb); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    matchMedia: query => {
      const preference = { matches: query.includes('reduced-motion') ? reduced : contrast, addEventListener: (_, cb) => { preference.change = cb; } };
      preferences.set(query, preference); return preference;
    },
    ResizeObserver: class { constructor(cb) { resize = cb; } observe() {} },
  });
  function advance(milliseconds = 100) {
    now += milliseconds;
    for (const [id, cb] of [...frames]) if (frames.has(id)) { frames.delete(id); cb(now); }
  }
  return { boot, elements, events, preferences, frames, document, bounds, summary, renderTimes,
    advance, resize: () => resize(), release: () => release?.(), recover: () => { failDraw = false; } };
}

const c = controller(); await c.boot;
const e = c.elements;
assert.equal(e.experiment.dataset.state, 'playing');
assert.equal(c.frames.size, 1);
c.advance();
e.play.emit('click');
assert.equal(c.frames.size, 0);
assert.equal(e.experiment.dataset.state, 'paused');
const pausedAt = e.field.dataset.time;
c.advance(500); assert.equal(e.field.dataset.time, pausedAt, 'Pause must stop the timeline');

// Input.value is changed by the native range before its input listener runs.
// Reading it after stop()/updateUI() would overwrite the requested position.
e.seek.value = '625'; e.seek.emit('input');
assert.equal(e.field.dataset.time, '5.000', 'Scrubbing must seek to the requested native range value');
assert.equal(e.seek.attributes['aria-valuetext'], '5.0 of 8.0 seconds');
assert.equal(c.frames.size, 0, 'Scrubbing must leave the chosen frame paused');
e.speed.value = '2'; e.speed.emit('input');
e.density.value = '150'; e.density.emit('input');
assert.equal(c.frames.size, 0, 'Adjusting a still must not resume playback');
e.play.emit('click'); c.advance(1000);
assert.equal(e.field.dataset.time, '5.200', 'Resuming must apply speed without catching up the full interruption');
e.seek.value = '1000'; e.seek.emit('input');
assert.equal(e.experiment.dataset.state, 'complete');
assert.equal(c.frames.size, 0);
e.replay.emit('click'); e.replay.emit('click');
assert.equal(e.field.dataset.time, '0.000');
assert.equal(c.frames.size, 1, 'Repeated replay must retain a single animation loop');
for (let i = 0; i < 50 && c.frames.size; i++) c.advance();
assert.equal(e.experiment.dataset.state, 'complete');
assert.equal(c.frames.size, 0, 'Completed artwork must consume no animation frames');

e.replay.emit('click');
c.document.hidden = true; c.events.get('visibilitychange')();
assert.equal(c.frames.size, 0, 'Backgrounding must pause playback');
c.document.hidden = false; c.events.get('visibilitychange')();
assert.equal(c.frames.size, 0, 'Returning to the page must not start unsolicited playback');
e.play.emit('click'); c.bounds.width = 260; c.resize();
c.events.get('pagehide')();
assert.equal(c.frames.size, 0, 'Page exit must cancel the drawing loop and pending resize');
c.events.get('pageshow')(); assert.equal(c.frames.size, 0);
e.play.emit('click'); c.bounds.width = 280; c.resize(); c.advance();
assert.equal(c.frames.size, 0, 'Resize must leave one stable, remeasured frame');
e.adjust.open = true;
c.events.get('keydown')({ key: 'Escape', target: e.experiment });
assert.equal(e.adjust.open, false); assert.equal(c.document.activeElement, c.summary);
e.replay.emit('click');
const motion = c.preferences.get('(prefers-reduced-motion: reduce)');
motion.matches = true; motion.change();
assert.equal(c.frames.size, 0); assert.equal(e.field.dataset.time, '3.000');
for (const options of [{ reduced: true }, { contrast: true }]) {
  const still = controller(options); await still.boot;
  assert.equal(still.frames.size, 0); assert.equal(still.elements.field.dataset.time, '3.000');
  still.elements.seek.value = '250'; still.elements.seek.emit('input');
  assert.equal(still.elements.field.dataset.time, '2.000', 'Preference modes must retain manual timeline access');
}
for (const event of ['visibilitychange', 'pagehide']) {
  const loading = controller({ deferred: true });
  if (event === 'visibilitychange') loading.document.hidden = true;
  loading.events.get(event)(); loading.release(); await loading.boot;
  assert.equal(loading.frames.size, 0, 'Late image/module preparation must not restart a hidden or exited page');
}
const failed = controller({ prepareFailures: 1 }); await failed.boot;
assert.equal(failed.elements.failure.hidden, false);
assert.equal(failed.elements.controls.hidden, true);
assert.equal(failed.elements.retry.disabled, false);
await failed.elements.retry.emit('click');
assert.equal(failed.elements.failure.hidden, true);
assert.equal(failed.elements.controls.hidden, false);
assert.equal(failed.frames.size, 1, 'Retry must recover failed image preparation');
const broken = controller({ drawFailure: true }); await broken.boot;
assert.doesNotThrow(() => broken.events.get('keydown')({ key: 'r', target: broken.elements.experiment }), 'R must not invoke a renderer that failed preparation');
assert.equal(broken.frames.size, 0);
broken.recover(); await broken.elements.retry.emit('click'); assert.equal(broken.frames.size, 1);
const noCanvas = controller({ canvasAvailable: false }); await noCanvas.boot;
assert.equal(noCanvas.elements.failure.hidden, false); assert.equal(noCanvas.frames.size, 0);
console.log('Passed: five unlisted independent studies and dependencies; source/phase raster contracts; deterministic bounded square dithering; actual controller replay/pause/seek, static completion, preferences, interruption/resize cleanup, delayed preparation and failure/retry.');
