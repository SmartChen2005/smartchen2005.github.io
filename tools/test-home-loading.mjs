import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDeferredMotorsport } from '../dist/home-motor-loader.mjs';

// Guard the actual media budget and preserve high-resolution alternatives.
const assets = JSON.parse(fs.readFileSync(new URL('./home-assets.json', import.meta.url)));
const photos = assets.images.filter(image => image.source.startsWith('photography-preview/'));
assert.equal(photos.length, 4);
for (const image of assets.images) {
  assert.deepEqual(image.variants.map(v => v.width), image.source.startsWith('photography-preview/') ? [480, 960, 1920] : [480, 960]);
  for (const v of image.variants) assert(Math.abs(v.width / v.height - image.width / image.height) < .005);
}
assert(photos.reduce((n, image) => n + image.variants.find(v => v.width === 960).bytes, 0) < 400_000);
assert(photos.reduce((n, image) => n + image.variants.at(-1).bytes, 0) < 1_100_000);
assert(assets.images.at(-1).variants.at(-1).bytes < 50_000);

globalThis.document = { body: { dataset: {} } };
const calls = [];
const controller = Object.fromEntries(['resize', 'point', 'setActive', 'play', 'stop'].map(method => [method, (...args) => calls.push([method, ...args])]));
let imports = 0, resolve;
const module = { createMotorsport: () => { calls.push(['create']); return controller; } };
const motor = createDeferredMotorsport({}, {}, () => { imports++; return new Promise(done => { resolve = done; }); });
motor.resize(1440, 900, { top: 400, bottom: 500 }); motor.point(.7); motor.setActive(false);
assert.equal(imports, 0, 'Resting homepage must not fetch or construct the 3D scene');
motor.setActive(true); motor.setActive(true); motor.play();
assert.equal(imports, 1, 'Repeated input must share the same module request');
motor.setActive(false); resolve(module); await new Promise(setImmediate);
assert(calls.some(call => call[0] === 'resize' && call[1] === 1440));
assert(calls.some(call => call[0] === 'point' && call[1] === .7));
assert.deepEqual(calls.at(-1), ['setActive', false]);
assert(!calls.some(call => call[0] === 'play'), 'Leaving during a cold load must cancel queued playback');
motor.setActive(true); motor.play(); assert.deepEqual(calls.at(-1), ['play']);
motor.stop(); assert.deepEqual(calls.at(-1), ['stop']);

calls.length = 0;
const queued = createDeferredMotorsport({}, {}, () => Promise.resolve(module));
queued.setActive(true); queued.play(); await new Promise(setImmediate);
assert.deepEqual(calls.at(-1), ['play'], 'Cold click must play after the module arrives');

const events = [];
let attempts = 0;
const retry = createDeferredMotorsport({}, { onPlayback: (...args) => events.push(args) }, () => ++attempts === 1 ? Promise.reject(new Error('Offline')) : Promise.resolve(module));
retry.setActive(true); retry.play(); await new Promise(setImmediate);
assert.equal(document.body.dataset.motorFallback, 'true');
assert.deepEqual(events.at(-1), [false, 'unavailable']);
retry.setActive(false); assert.equal(document.body.dataset.motorFallback, undefined);
retry.setActive(true); await new Promise(setImmediate);
assert.equal(attempts, 2, 'A later interaction can retry a failed module request');
console.log('Passed: responsive media budgets; no arrival-time 3D request; request deduplication; latest geometry/input; cold click; cancellation; network-failure fallback and retry.');
