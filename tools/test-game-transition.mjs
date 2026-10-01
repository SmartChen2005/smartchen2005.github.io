import assert from 'node:assert/strict';
import { createCompression, gameBoundary, GAME_TRANSITION_DURATION, installGameTransition } from '../dist/home-game-transition.mjs';

function snapshot(width, height) {
  const band = { top: height / 2 - 45, bottom: height / 2 + 45 };
  const tiles = [], balls = [];
  const columns = width < 600 ? 5 : 9;
  for (const half of [0, 1]) {
    const low = half ? band.bottom + 20 : 22, high = half ? height - 22 : band.top - 20;
    for (let row = 0; row < 2; row++) for (let col = 0; col < columns; col++) {
      tiles.push({ x: width * (col + 1) / (columns + 1), y: low + (high - low) * (.32 + row * .36),
        w: Math.min(38, width / (columns * 3)), h: 13, angle: .1, filled: col % 3 === 0, flash: .3 });
    }
    for (let i = 0; i < 3; i++) balls.push({ x: width * (.18 + i * .28), y: low + (high - low) * (.12 + i * .27),
      vx: 90 + i * 28, vy: 65 + i * 17, trail: [{ x: width * (.18 + i * .28) - 3, y: low + (high - low) * (.12 + i * .27) - 4 }] });
  }
  return { width, height, band, tiles, balls };
}

assert.equal(GAME_TRANSITION_DURATION, 1.38 * 2);
for (const [width, height] of [[1440,900],[1920,1080],[535,673],[390,844],[844,390]]) {
  for (const fps of [30,60,144]) {
    const initial = snapshot(width,height), original = structuredClone(initial);
    const model = createCompression(initial);
    const atStart = model.state();
    assert.equal(atStart.bodies.length, initial.tiles.length + initial.balls.length);
    atStart.bodies.forEach((body, i) => {
      const source = [...initial.tiles, ...initial.balls][i];
      assert.equal(body.x, source.x); assert.equal(body.y, source.y);
      if (body.kind === 'ball') { assert.equal(body.vx, source.vx); assert.deepEqual(body.trail, source.trail); }
    });
    let previousWidth = width, flowCollisions = null, previousScales = null;
    for (let t = 0; t < 2.70; t += 1 / fps) {
      const state = model.advance(t), walls = state.boundary;
      if (state.motion === 'converge') {
        if (flowCollisions === null) flowCollisions = state.stats.collisions;
        assert.equal(state.stats.collisions, flowCollisions, 'Dense convergence must not keep resolving impossible overlaps');
        const scales = state.bodies.map(body => body.scale);
        if (previousScales) scales.forEach((scale,i) => assert(scale <= previousScales[i] + 1e-8, 'Converging objects must never expand'));
        previousScales = scales;
        assert(state.bodies.every(body => body.flash === 0), 'The final flow must not flash with repeated collisions');
      }
      assert(walls.right - walls.left <= previousWidth + 1e-8);
      previousWidth = walls.right - walls.left;
      for (const body of state.bodies) {
        const c = Math.abs(Math.cos(body.angle)), s = Math.abs(Math.sin(body.angle));
        const rx = Math.min((body.kind === 'ball' ? 6 : c * body.w / 2 + s * body.h / 2) * (body.scale ?? 1), (walls.right - walls.left) / 2);
        const ry = Math.min((body.kind === 'ball' ? 6 : s * body.w / 2 + c * body.h / 2) * (body.scale ?? 1), (walls.bottom - walls.top) / 2);
        assert(body.x - rx >= walls.left - 1e-7 && body.x + rx <= walls.right + 1e-7, 'Body escaped a horizontal wall');
        assert(body.y - ry >= walls.top - 1e-7 && body.y + ry <= walls.bottom + 1e-7, 'Body escaped a vertical wall');
        assert([body.x,body.y,body.vx,body.vy,body.angle].every(Number.isFinite));
        if (body.kind === 'tile') assert.equal(body.w, initial.tiles[0].w, 'Compression must not scale objects');
        for (const point of body.trail || []) assert(point.x >= walls.left && point.x <= walls.right && point.y >= walls.top && point.y <= walls.bottom);
      }
    }
    assert(model.state().stats.collisions > 20 && model.state().stats.wallHits > 20, 'Walls and bodies must exchange momentum');
    const final = model.advance(GAME_TRANSITION_DURATION);
    assert.notEqual(flowCollisions, null, 'Every viewport must transition to smooth convergence before the point');
    assert.equal(final.phase, 'point');
    assert(Math.abs(final.boundary.right - final.boundary.left) < 1e-7);
    assert(Math.abs(final.boundary.bottom - final.boundary.top) < 1e-7);
    assert(final.bodies.every(b => Math.abs(b.x - width / 2) < 1e-7 && Math.abs(b.y - height / 2) < 1e-7), 'All objects must end at the center point');
    assert(!('fragments' in final), 'The point transition must not produce explosion fragments');
    assert.deepEqual(initial, original, 'The click simulation must not mutate the hover snapshot');
  }
}
const late = gameBoundary(1440,900,.9), earlier = gameBoundary(1440,900,.8);
const early = gameBoundary(1440,900,.3), earliest = gameBoundary(1440,900,.2);
assert(late.left - earlier.left > early.left - earliest.left, 'The boundary must accelerate inward');
const acceleration = t => gameBoundary(1440,900,t+.1).left - 2*gameBoundary(1440,900,t).left + gameBoundary(1440,900,t-.1).left;
for(const t of [.5,1,1.5,2,2.5]) assert(Math.abs(acceleration(t)-acceleration(.5)) < 1e-8, 'Contraction velocity must increase linearly');

// Exercise the real click controller with a loaded/failed destination and native inputs.
function harness({ ready = true, reduced = false, forced = false } = {}) {
  const callbacks = new Map(), timers = new Map(), windowHandlers = {}, documentHandlers = {};
  let now = 0, id = 0, captures = 0, releases = 0, navigations = 0, resets = 0;
  const media = { matches: reduced, addEventListener() {} };
  const style = { setProperty() {}, removeProperty() {} };
  const context = new Proxy({}, { get:()=> (...args)=> { for (const arg of args) if (typeof arg === 'number') assert(Number.isFinite(arg)); }, set:()=>true });
  const elements = [];
  function element(tag) {
    const classes = new Set(), handlers = {};
    return { tag, handlers, style, dataset: {}, className: '', setAttribute() {}, getContext:()=>context,
      addEventListener:(type,callback)=>{handlers[type]=callback;},
      classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)},
      contentDocument:{querySelector:()=>ready ? {} : null}, remove() { this.removed = true; } };
  }
  globalThis.matchMedia = query => query.includes('forced-colors') ? {matches:forced} : media;
  globalThis.location = { href:'https://example.test/',origin:'https://example.test',assign:()=>navigations++ };
  globalThis.document = { documentElement:{},hidden:false,createElement:element,
    body:{dataset:{},style,append:node=>{elements.push(node); if(node.tag==='iframe')node.handlers.load();}},
    addEventListener:(type,callback)=>{documentHandlers[type]=callback;} };
  globalThis.window = { addEventListener:(type,callback)=>{windowHandlers[type]=callback;} };
  globalThis.performance = { now:()=>now };
  globalThis.devicePixelRatio = 1.5;
  globalThis.getComputedStyle = ()=>({getPropertyValue:key=>key==='--paper'?'#f5f5f3':'#292a27'});
  globalThis.requestAnimationFrame = callback=>{callbacks.set(++id,callback);return id;};
  globalThis.cancelAnimationFrame = key=>callbacks.delete(key);
  globalThis.setTimeout = callback=>{timers.set(++id,callback);return id;};
  globalThis.clearTimeout = key=>timers.delete(key);
  const link = element('a');
  Object.assign(link,{href:'https://example.test/projects/',target:'',hasAttribute:()=>false});
  const controller = installGameTransition(link, {captureGame:()=>{captures++; return snapshot(1440,900);},releaseGame:()=>releases++},()=>resets++);
  return {controller, elements, callbacks, windowHandlers, documentHandlers,
    click(options={}) { const event = {button:0,preventDefault(){this.prevented=true;},...options}; link.handlers.click(event);return event; },
    step(ms) { now=ms;const pending=[...callbacks.values()];callbacks.clear();pending.forEach(fn=>fn(now)); },
    values:()=>({captures,releases,navigations,resets}),timers };
}
let app = harness();
for (const options of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}]) assert(!app.click(options).prevented);
assert.equal(app.values().captures,0);
assert(app.click().prevented); assert(app.controller.active);
app.click(); assert.equal(app.values().captures,1, 'A second click must not start another simulation');
for(let ms=16;ms<2760;ms+=16) { app.step(ms);assert.equal(app.callbacks.size,1); }
app.step(2760); assert.equal(app.values().navigations,1); assert.equal(app.callbacks.size,0);
assert(app.elements.find(e=>e.tag==='iframe').classList.contains('is-revealed'));
app.windowHandlers.pagehide(); assert(!app.controller.active); assert.equal(document.body.dataset.gameTransition,undefined);
assert(app.elements.find(e=>e.tag==='canvas').removed); assert.equal(app.timers.size,0);
app.windowHandlers.pageshow({persisted:true}); assert(!app.controller.active);
assert(app.click().prevented, 'Back navigation should allow another transition');
app.windowHandlers.resize(); assert.equal(app.values().navigations,2);
for (const options of [{ready:false},{reduced:true},{forced:true}]) {
  app=harness(options);assert(!app.click().prevented);assert.equal(app.values().captures,0);
}
app=harness();app.click();document.hidden=true;app.documentHandlers.visibilitychange();assert.equal(app.values().navigations,1);
console.log('Passed: 15 viewport/frame-rate simulations; live-state continuity; constant boundary acceleration; moving-wall collisions and smooth dense convergence without collision jitter/flashes; monotonic collapse to one center point; unchanged 2.76s navigation; native modified clicks; duplicate prevention; reduced-motion/forced-color/load fallback; resize/background exit; back restoration.');
