import assert from 'node:assert/strict';
import { createCardOrientation } from '../dist/home-card-orientation.mjs';

function harness({ permission = 'granted', prompt = true, secure = true, coarse = true, supported = true } = {}) {
  let now = 0, requests = 0, id = 0, enabled = true, canRequest = true, resolution;
  const handlers = new Map(), timers = new Map(), values = [];
  const api = prompt ? { requestPermission() { requests++; return new Promise((resolve, reject) => { resolution = () => permission === 'error' ? reject(Error()) : resolve(permission); }); } } : {};
  const screen = { angle: 0, addEventListener: (event, fn) => handlers.set(`screen-${event}`, fn) };
  globalThis.window = { isSecureContext: secure, DeviceOrientationEvent: supported ? api : undefined,
    screen: { orientation: screen }, addEventListener: (event, fn) => handlers.set(event, fn), removeEventListener: event => handlers.delete(event) };
  globalThis.matchMedia = () => ({ matches: coarse, addEventListener() {} });
  globalThis.performance = { now: () => now };
  globalThis.setTimeout = fn => { timers.set(++id, fn); return id; };
  globalThis.clearTimeout = key => timers.delete(key);
  const sensor = createCardOrientation({ allowed: () => enabled, canRequest: () => canRequest, change: value => values.push(value) });
  return { sensor, handlers, timers, values, screen,
    get requests() { return requests; }, resolve: () => resolution?.(),
    enable(value) { enabled = value; sensor.setActive(value); }, requestable(value) { canRequest = value; },
    sample(beta, gamma, dt = 30) { now += dt; handlers.get('deviceorientation')?.({ beta, gamma }); },
    last: () => values.at(-1), drain() { const work = [...timers.values()]; timers.clear(); work.forEach(fn => fn()); } };
}

let app = harness();
app.sensor.setActive(true); assert.equal(app.requests, 0, 'Arrival must never prompt');
assert(!app.handlers.has('deviceorientation'));
const pending = app.sensor.activate(); app.sensor.activate(); assert.equal(app.requests, 1, 'Only one permission request can be pending');
app.resolve(); await pending; assert(app.handlers.has('deviceorientation'));
for (let i = 0; i < 12; i++) app.sample(63, -8);
assert.deepEqual(app.last(), { x: 0, y: 0 }, 'Holding angle must calibrate to neutral');
for (let i = 0; i < 30; i++) app.sample(63 + (i % 2 ? .3 : -.3), -8);
assert(Math.abs(app.last().y) < .001, 'Small sensor noise must not move the card');
app.sample(78, 10); const early = app.last(); assert(early.x > 0 && early.x < 1, 'A sample must be smoothed, not applied raw');
for (let i = 0; i < 35; i++) app.sample(100, 75);
assert(app.last().x <= 1 && app.last().y <= 1, 'Sensor extremes must remain restrained');
app.screen.angle = 90; app.sample(75, 12); assert.deepEqual(app.last(), { x: 0, y: 0 });
for (let i = 0; i < 10; i++) app.sample(75, 12);
for (let i = 0; i < 20; i++) app.sample(90, 12);
assert(app.last().x > .5 && Math.abs(app.last().y) < .001, 'Landscape axes must follow the screen');
const before = app.last(); app.sample(null, NaN); assert.deepEqual(app.last(), before, 'Missing sensor data must be ignored');
assert(app.timers.size === 1, 'Only one sensor-stall timer is needed');
app.drain(); assert.deepEqual(app.last(), { x: 0, y: 0 }); assert(!app.sensor.receiving);
app.enable(false); assert(!app.handlers.has('deviceorientation')); assert.equal(app.timers.size, 0);
app.screen.angle = 0;
app.enable(true); app.sample(-170, 0); for (let i = 0; i < 10; i++) app.sample(-170, 0);
for (let i = 0; i < 20; i++) app.sample(179, 0);
assert(app.last().y < 0, 'Wraparound must take the shortest angular path');

for (const permission of ['denied', 'error']) {
  app = harness({ permission }); app.enable(true);
  const attempt = app.sensor.activate(); app.resolve(); await attempt;
  assert.equal(app.sensor.permission, 'denied'); assert(!app.handlers.has('deviceorientation'));
  await app.sensor.activate(); assert.equal(app.requests, 1, 'Denial must not cause repeated prompts');
}
app = harness(); app.enable(true); const closing = app.sensor.activate(); app.enable(false); app.resolve(); await closing;
assert(!app.handlers.has('deviceorientation'), 'A late grant must not listen while the card is closed');
app.enable(true); assert(app.handlers.has('deviceorientation'), 'Reopening reuses a granted permission');
for (const options of [{secure:false},{coarse:false},{supported:false}]) {
  app = harness(options); app.enable(true); await app.sensor.activate(); assert.equal(app.requests, 0); assert(!app.handlers.has('deviceorientation'));
}
app = harness(); app.requestable(false); app.enable(false); await app.sensor.activate(); assert.equal(app.requests, 0, 'Reduced motion/hidden/closed cards must not request access');
app = harness({ prompt: false }); app.enable(true); assert(app.handlers.has('deviceorientation')); assert.equal(app.requests, 0);
console.log('Passed: no load prompt; gesture permission, denial/rejection and late grant; neutral calibration, jitter suppression, bounds, landscape axes and angular wrap; missing/stalled sensors; close/visibility lifecycle; insecure/unsupported/reduced-motion fallback.');
