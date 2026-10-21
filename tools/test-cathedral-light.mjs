import assert from 'node:assert/strict';
import fs from 'node:fs';
import {paletteAt, startCathedralLight} from '../dist/gallery/cathedral-light.mjs';
import {cathedralLightBands, renderCathedralGlass} from './cathedral-glass.mjs';

const css = fs.readFileSync(new URL('../dist/gallery/cathedral-light.css', import.meta.url), 'utf8');
const tokens = new Map([...css.matchAll(/(--cathedral-(?:amber|mist|rose)-[abc]):\s*([\d ]+);/g)].map(m => [m[1], m[2]]));
assert.equal(tokens.size, 9, 'Exactly three coordinated three-color palettes');
const palettes = ['amber', 'mist', 'rose'].map(name => ['a', 'b', 'c'].map(tone => tokens.get(`--cathedral-${name}-${tone}`).split(' ').map(Number)));
assert.deepEqual(paletteAt(palettes, 0), palettes[0]);
assert.deepEqual(paletteAt(palettes, .5), palettes[1]);
assert.deepEqual(paletteAt(palettes, 1), palettes[2]);
assert.deepEqual(paletteAt(palettes, -1), palettes[0]);
assert.deepEqual(paletteAt(palettes, 2), palettes[2]);
const luminance = color => color.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
const secondary = luminance([80, 81, 77]);
const withGlassShade = color => color.map((channel, i) => channel * (1 - .08 * .78) + [33, 39, 43][i] * .08 * .78);
for (let progress = 0; progress <= 1; progress += .01) {
  assert(paletteAt(palettes, progress).every(color => (luminance(color) + .05) / (secondary + .05) >= 4.5), 'Secondary copy keeps AA contrast throughout the palette transition');
  assert(paletteAt(palettes, progress).every(color => (luminance(withGlassShade(color)) + .05) / (secondary + .05) >= 4.5), 'Fine glass shading also preserves secondary-text contrast');
  const colors = paletteAt(palettes, progress).flat();
  assert(colors.every(channel => Number.isFinite(channel) && channel >= 0 && channel <= 255));
  const next = paletteAt(palettes, Math.min(1, progress + .001)).flat();
  assert(next.every((value, i) => Math.abs(value - colors[i]) <= 1), 'Small scroll changes cannot cause a color jump');
}

function harness({reduced = false, forced = false, offset = 0} = {}) {
  const listeners = new Map(), frames = new Map(), values = new Map();
  let id = 0, time = 0, disconnected = false;
  const media = matches => ({matches, addEventListener(type, fn) { this.listener = fn; }, removeEventListener() { this.listener = null; }});
  const reduce = media(reduced), contrast = media(forced);
  const on = (name, fn) => listeners.set(name, fn), off = name => listeners.delete(name);
  const body = {style: {setProperty: (key, value) => values.set(key, value), removeProperty: key => values.delete(key)}};
  const doc = {hidden: false, documentElement: {scrollHeight: 3000}, querySelector: () => body, addEventListener: on, removeEventListener: off};
  const win = {scrollY: offset, innerHeight: 1000, getComputedStyle: () => ({getPropertyValue: key => tokens.get(key) || ''}), matchMedia: query => query.includes('reduced') ? reduce : contrast,
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; }, cancelAnimationFrame: key => frames.delete(key), addEventListener: on, removeEventListener: off,
    ResizeObserver: class { observe() {} disconnect() { disconnected = true; } }};
  const destroy = startCathedralLight(win, doc);
  const advance = (count = 150, step = 16) => {for (let i = 0; i < count && frames.size; i++) {time += step; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(time));}};
  const color = () => ['a', 'b', 'c'].map(tone => values.get('--light-' + tone).split(' ').map(Number));
  return {win, doc, frames, values, listeners, reduce, contrast, destroy, advance, color, disconnected: () => disconnected};
}

const h = harness();
assert.deepEqual(h.color(), palettes[0]);
h.win.scrollY = 1000; h.listeners.get('scroll')(); h.advance(1);
assert.notDeepEqual(h.color(), palettes[1], 'A page jump eases into its palette');
h.advance(); assert.deepEqual(h.color(), palettes[1]); assert.equal(h.frames.size, 0, 'Rendering sleeps once settled');
h.win.scrollY = 2000; h.listeners.get('scroll')(); h.advance(); assert.deepEqual(h.color(), palettes[2]);
h.win.scrollY = 0; h.listeners.get('scroll')(); h.advance(); assert.deepEqual(h.color(), palettes[0], 'Reverse scrolling returns smoothly to the first palette');
h.win.scrollY = 2000; h.listeners.get('scroll')(); h.doc.hidden = true; h.listeners.get('visibilitychange')();
assert.equal(h.frames.size, 0, 'Hidden pages cancel active frames');
h.doc.hidden = false; h.listeners.get('visibilitychange')(); assert.deepEqual(h.color(), palettes[2], 'Reentry follows the actual scroll position');
h.win.scrollY = 0; h.listeners.get('scroll')(); h.listeners.get('pagehide')(); assert.equal(h.frames.size, 0);
h.listeners.get('pageshow')(); assert.deepEqual(h.color(), palettes[0], 'BFCache restoration resynchronizes the palette');
h.win.scrollY = 2000; h.reduce.matches = true; h.reduce.listener(); assert.deepEqual(h.color(), palettes[0]); assert.equal(h.frames.size, 0);
h.reduce.matches = false; h.reduce.listener(); assert.deepEqual(h.color(), palettes[2]);
h.destroy(); assert.equal(h.frames.size, 0); assert.equal(h.values.size, 0); assert.equal(h.listeners.size, 0); assert(h.disconnected());
for (const preferences of [{reduced: true}, {forced: true}]) {
  const staticView = harness({...preferences, offset: 1800});
  assert.deepEqual(staticView.color(), palettes[0]); staticView.listeners.get('scroll')(); assert.equal(staticView.frames.size, 0); staticView.destroy();
}
assert.deepEqual(harness({offset: 1000}).color(), palettes[1], 'Restored scroll positions initialize without playing from the top');
const throttled = harness(); throttled.win.scrollY = 2000; throttled.listeners.get('scroll')(); throttled.advance(3, 1000);
assert.deepEqual(throttled.color(), palettes[2], 'Slow frames still use elapsed time rather than stretching the transition'); throttled.destroy();
const page = fs.readFileSync(new URL('../dist/gallery/cathedrals-of-light/index.html', import.meta.url), 'utf8');
const bands = cathedralLightBands(css);
assert.equal(bands.length, 36);
const glass = renderCathedralGlass(css, 'test');
const edges = [...glass.matchAll(/data-glass-edge="([\d.]+)"/g)].map(m => Number(m[1]));
assert.equal(edges.length, bands.length, 'Every authored light band gets a shared glass boundary');
assert.equal(new Set(edges).size, bands.length);
assert.equal(edges[0], 0); assert.equal(edges[1], 2.5, 'Glass is aligned with the actual transition between adjoining bands');
assert(!glass.includes('NaN') && !glass.includes('Infinity'), 'All glass paths have finite coordinates');
assert(glass.includes('x="-1000"') && glass.includes('x="1000"'), 'Rims repeat with the light field on wide screens');
assert.throws(() => renderCathedralGlass(css, 'unsafe"id'), /namespace/);
const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'Header and wall SVG definitions have distinct namespaces');
for (const match of page.matchAll(/url\(#([^)]*)\)|href="#([^"]+)"/g)) assert(ids.includes(match[1] || match[2]), 'Every local glass/anchor reference resolves');
assert.equal((page.match(/data-glass-edge=/g) || []).length, 72, 'Header and wall both render every glass edge');
assert.equal((page.match(/class="cathedral-light-background(?: cathedral-light-background--header)?" aria-hidden="true"/g) || []).length, 2, 'Both decorative paint regions are clipped and hidden from assistive technology');
assert(page.includes('cathedral-light.mjs?rev=20261021-three-palettes'));
const sibling = fs.readFileSync(new URL('../dist/gallery/surface-of-the-moon/index.html', import.meta.url), 'utf8');
assert(!sibling.includes('cathedral-light.mjs'), 'Other routes do not load the scroll controller');
console.log('Passed: CSS-owned palettes, contrast including glass shade, native-scroll easing/lifecycle/fallbacks, all 36 glass boundaries, repeat coverage, unique SVG references and route scoping.');
