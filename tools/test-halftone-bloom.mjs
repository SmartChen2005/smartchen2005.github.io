import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createField, distanceToInk, gridFor } from '../dist/projects/figures-of-speech/halftone-bloom/field.mjs';

const route = new URL('../dist/projects/figures-of-speech/halftone-bloom/', import.meta.url);
const html = fs.readFileSync(new URL('index.html', route), 'utf8');
const source = fs.readFileSync(new URL('bloom.mjs', route), 'utf8');
const catalogue = fs.readFileSync(new URL('../dist/projects/figures-of-speech/index.html', import.meta.url), 'utf8');
assert(!catalogue.includes('halftone-bloom'), 'The unpublished study must stay out of the catalogue');
assert(html.includes('<h1><span id="word">Bloom</span>'), 'The heading must exist before JavaScript');
for (const [, reference] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(?:#|https?:)/.test(reference)) continue;
  assert(fs.existsSync(new URL(reference.split('?')[0], route)), `Missing local dependency: ${reference}`);
}

// Check the distance transform at row boundaries, diagonal edges and counters.
const ink = new Uint8Array(49);
ink[3 * 7 + 3] = 1;
const distance = distanceToInk(ink, 7, 7, 4);
assert.equal(distance[24], 0);
assert.equal(distance[25], 4);
assert(Math.abs(distance[32] - Math.SQRT2 * 4) < .001);
assert.equal(distance[27], 12);
assert(distance[28] > 12, 'Distances must not wrap between rows');

function specimen(width, height) {
  const grid = gridFor(width, height);
  const mask = new Uint8Array(grid.columns * grid.rows);
  for (let row = 0; row < grid.rows; row++) {
    for (let column = 0; column < grid.columns; column++) {
      const x = (column + .5) / grid.columns, y = (row + .5) / grid.rows;
      // A hollow letter-like shape exercises both the outer edge and its counter.
      mask[row * grid.columns + column] = x > .22 && x < .78 && y > .4 && y < .6
        && !(x > .29 && x < .71 && y > .44 && y < .56) ? 1 : 0;
    }
  }
  return { ...grid, distances: distanceToInk(mask, grid.columns, grid.rows, grid.pitch) };
}

for (const [width, height] of [[1440, 900], [390, 844], [3840, 2160]]) {
  const grid = specimen(width, height);
  assert(grid.columns * grid.rows < 136000, 'Grid work must stay bounded at 4K');
  const config = { width, height, distances: grid.distances };
  const field = createField(config);
  assert(field.points.length > 1000, 'The field must contain thousands of dots');
  assert.deepEqual(field, createField(config), 'Replay must preserve the exact composition and activation order');
  const dense = createField({ ...config, density: 1.55 });
  const densePositions = new Set(dense.points.map(p => `${p.x},${p.y}`));
  assert(dense.points.length > field.points.length, 'Density must increase the population');
  assert(field.points.every(p => densePositions.has(`${p.x},${p.y}`)), 'Density must retain existing grid positions');
  const bins = new Array(32).fill(0);
  let previous = 0;
  for (const p of field.points) {
    assert(Number.isFinite(p.birth) && p.birth >= previous && p.birth <= 1);
    previous = p.birth;
    assert(p.x > 0 && p.x < width && p.y > 0 && p.y < height);
    const column = Math.floor(p.x / grid.pitch), row = Math.floor(p.y / grid.pitch);
    assert(grid.distances[row * grid.columns + column] >= field.clearance, 'Ink and its clearance must remain empty');
    bins[Math.min(3, Math.floor(p.y / height * 4)) * 8 + Math.min(7, Math.floor(p.x / width * 8))]++;
  }
  assert(Math.max(...bins) > Math.min(...bins) * 5, 'Composition must have strong spatial density variation');
  const at = t => field.points.filter(p => p.birth <= t).length;
  assert(at(.1) > 0 && at(.1) < field.points.length * .2, 'Opening must remain mostly empty');
  assert(at(.5) > field.points.length * .35, 'Population must grow rapidly');
  assert(at(.9) > field.points.length * .95, 'The burst must settle rather than leave a long tail');
}

// Execute the actual controller with a deterministic browser clock. This covers
// sleeping after settlement, repeated replay, preferences and interrupted frames.
function controller({ reduced = false, contrast = false, canvasAvailable = true } = {}) {
  let now = 0, next = 1;
  const frames = new Map(), preferences = new Map();
  const events = new Map();
  const bounds = { left: 0, top: 0, width: 800, height: 600 };
  let resize;
  function element(value = '') {
    const handlers = new Map();
    return {
      value, hidden: true, dataset: {}, textContent: '', open: false, className: '',
      addEventListener: (name, handler) => handlers.set(name, handler),
      emit: (name, event = {}) => handlers.get(name)?.(event),
      getBoundingClientRect: () => bounds,
      contains: () => false,
      closest: () => null,
      focus() { document.activeElement = this; },
    };
  }
  const drawing = { fillStyle: '', squares: 0, fillRect() { if (this.fillStyle === '#fff') this.squares++; }, setTransform() {} };
  const elements = Object.fromEntries(['experiment', 'field', 'word', 'baseline', 'controls', 'count', 'status', 'replay', 'adjust', 'density', 'size', 'speed', 'density-value', 'size-value', 'speed-value'].map(id => [id, element()]));
  elements.word.textContent = 'Bloom';
  elements.word.getBoundingClientRect = () => ({ left: 160, top: 200, width: 480, height: 180 });
  elements.baseline.getBoundingClientRect = () => ({ top: 360 });
  elements.field.getContext = () => canvasAvailable ? drawing : null;
  elements.density.value = '100'; elements.size.value = '1.5'; elements.speed.value = '1';
  const summary = element();
  elements.adjust.querySelector = () => summary;
  const document = {
    hidden: false,
    activeElement: null,
    querySelector: selector => elements[selector.slice(1)],
    getElementById: id => elements[id],
    addEventListener: (name, handler) => events.set(name, handler),
    createElement: () => {
      const mask = {};
      mask.getContext = () => ({
        scale() {}, fillText() {},
        getImageData: () => {
          const data = new Uint8ClampedArray(mask.width * mask.height * 4);
          for (let y = 0; y < mask.height; y++) for (let x = 0; x < mask.width; x++) {
            if (x > mask.width * .2 && x < mask.width * .8 && y > mask.height * .4 && y < mask.height * .6) data[(y * mask.width + x) * 4 + 3] = 255;
          }
          return { data };
        },
      });
      return mask;
    },
  };
  vm.runInNewContext(source.replace(/^import[^\n]+\n/, ''), {
    document, window: { addEventListener: (name, handler) => events.set(name, handler) },
    createField, distanceToInk, gridFor, Intl, console, devicePixelRatio: 2,
    requestAnimationFrame: cb => { const id = next++; frames.set(id, cb); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    performance: { now: () => now },
    getComputedStyle: () => ({ fontStyle: 'normal', fontWeight: '400', fontSize: '180px', fontFamily: 'Georgia', letterSpacing: '-10px' }),
    matchMedia: query => {
      const preference = { matches: query.includes('reduced-motion') ? reduced : contrast, addEventListener: (_, cb) => { preference.change = cb; } };
      preferences.set(query, preference);
      return preference;
    },
    ResizeObserver: class { constructor(cb) { resize = cb; } observe() {} },
  });
  const advance = milliseconds => {
    now += milliseconds;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(cb => cb(now));
  };
  return { elements, frames, events, preferences, document, bounds, resize: () => resize(), advance, drawing, summary };
}

const c = controller();
assert.equal(c.elements.experiment.dataset.state, 'blooming');
assert.equal(c.elements.controls.hidden, false);
assert.equal(c.elements.field.dataset.drawn, '0');
c.advance(200);
const early = Number(c.elements.field.dataset.drawn);
c.advance(900);
assert(Number(c.elements.field.dataset.drawn) > early);
c.advance(1100);
assert.equal(c.elements.experiment.dataset.state, 'settled');
assert.equal(c.frames.size, 0, 'The settled field must consume no animation frames');
assert.equal(c.elements.field.dataset.drawn, c.elements.field.dataset.total);
const total = c.elements.field.dataset.total;
c.elements.replay.emit('click'); c.elements.replay.emit('click');
assert.equal(c.frames.size, 1, 'Repeated replay must replace the previous animation');
c.document.hidden = true; c.events.get('visibilitychange')();
assert.equal(c.frames.size, 0, 'Backgrounding must stop drawing');
assert.equal(c.elements.field.dataset.drawn, total);
c.document.hidden = false;
c.elements.replay.emit('click');
const preference = c.preferences.get('(prefers-reduced-motion: reduce)');
preference.matches = true; preference.change();
assert.equal(c.frames.size, 0, 'A live reduced-motion preference change must settle immediately');
preference.matches = false;
c.elements.size.value = '2'; c.elements.size.emit('input');
assert.equal(c.frames.size, 1);
c.events.get('pagehide')();
assert.equal(c.frames.size, 0, 'Page exit must cancel pending slider rebuilds');
c.bounds.width = 700; c.resize(); c.advance(16);
assert.equal(c.frames.size, 0, 'Resize must produce a static, remeasured composition');
assert.equal(c.elements.word.textContent, 'Bloom');
c.elements.adjust.open = true;
c.events.get('keydown')({ key: 'Escape', target: c.elements.word });
assert.equal(c.elements.adjust.open, false);
assert.equal(c.document.activeElement, c.summary);
for (const options of [{ reduced: true }, { contrast: true }]) {
  const staticController = controller(options);
  assert.equal(staticController.frames.size, 0);
  assert.equal(staticController.elements.experiment.dataset.state, 'settled');
  assert.equal(staticController.elements.field.dataset.drawn, staticController.elements.field.dataset.total);
}
const fallback = controller({ canvasAvailable: false });
assert(fallback.elements.status.textContent.includes('cannot draw'));
assert.equal(fallback.elements.controls.hidden, true);
console.log('Passed: local assets and unlisted route; deterministic dense grid, glyph clearance, organic density and propagation at desktop/phone/4K; replay, preferences, static idle, background/page-exit/resize cancellation, keyboard dismissal and Canvas fallback.');
