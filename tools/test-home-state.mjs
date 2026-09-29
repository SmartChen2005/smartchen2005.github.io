import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the homepage controller through the same input events as the browser.
const events = new Map(), windowEvents = new Map();
const style = () => ({ setProperty() {} });
function identity(id, tagName = 'BUTTON') {
  return { tagName, dataset: { identity: id }, handlers: {}, attributes: {},
    keyboardFocus: false,
    addEventListener(type, fn) { this.handlers[type] = fn; },
    setAttribute(key, value) { this.attributes[key] = value; },
    matches() { return this.keyboardFocus; }, focus() {},
    getBoundingClientRect: () => ({ left: 150, top: 330, width: 140, height: 60 }) };
}
const name = identity('name'), games = identity('games', 'A'), photo = identity('photo'), cars = identity('cars');
const identities = [name, games, photo, cars];
const composition = { dataset: {}, style: style(), getBoundingClientRect: () => ({ left: 150 }) };
const image = { getAttribute: key => key === 'height' ? '4000' : '6000' };
const portrait = { style: style(), isConnected: true, hidden: false, offsetHeight: 0,
  querySelector: () => image, after() {}, addEventListener() {}, remove() { this.isConnected = false; } };
const anchor = { before() { portrait.isConnected = true; } };
const dock = { hidden: true, contains: () => false };
const sentence = { getBoundingClientRect: () => ({ top: 330, bottom: 390 }) };
const nodes = { '.composition': composition, '.portrait-full': portrait, '.identity-name': name,
  '.identity-games': games, '.business-card-dock': dock, '.sentence': sentence };
let cardOpen = false, keyboardEntries = 0, navigate;
const sandbox = {
  document: { body: { dataset: {} }, documentElement: { style: style() }, fonts: { ready: { then() {} } },
    querySelector: selector => nodes[selector] || {}, querySelectorAll: () => identities,
    createComment: () => anchor, addEventListener: (key, fn) => events.set(key, fn) },
  window: { addEventListener: (key, fn) => windowEvents.set(key, fn) },
  matchMedia: query => ({ matches: query.includes('hover: hover') }),
  getComputedStyle: () => ({ width: '282px' }), innerWidth: 1280, innerHeight: 720,
  clearTimeout() {}, setTimeout: () => 1,
  ResizeObserver: class { observe() {} },
  createScenes: () => ({ setWorld() {}, resize() {}, point() {} }),
  createBusinessCard: () => ({ show(keyboard) {
    if (!cardOpen && keyboard) keyboardEntries++;
    cardOpen = true; dock.hidden = false;
  }, hide() { cardOpen = false; dock.hidden = true; }, place() {} }),
  installGameTransition: (_, __, clear) => { navigate = clear; return { active: false }; },
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../dist/home.mjs', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, ''), sandbox);
const dispatch = (element, type, detail = 1) => element.handlers[type]({ detail });
const world = () => composition.dataset.active;

dispatch(name, 'pointerenter');
assert.equal(world(), 'name'); assert(dock.hidden, 'Hover alone must only reveal the portrait');
dispatch(name, 'pointerleave'); assert.equal(world(), '');
dispatch(name, 'click'); assert(!dock.hidden); assert.equal(name.attributes['aria-pressed'], 'true');
for (const target of [games, photo, cars, games]) {
  dispatch(target, 'pointerenter');
  assert.equal(world(), target.dataset.identity); assert(dock.hidden);
  dispatch(target, 'pointerleave');
  assert.equal(world(), 'name'); assert(!dock.hidden, 'Leaving a temporary preview must restore portrait AND card');
}
dispatch(photo, 'click'); assert(dock.hidden); assert.equal(world(), 'photo');
dispatch(name, 'pointerenter'); assert(dock.hidden, 'Clicking another identity must clear the old card selection');
dispatch(name, 'pointerleave');
dispatch(name, 'click', 0); assert(!dock.hidden); assert.equal(keyboardEntries, 1);
games.keyboardFocus = true; dispatch(games, 'focus'); assert(dock.hidden);
dispatch(games, 'blur'); assert(!dock.hidden); assert.equal(keyboardEntries, 1, 'Restoring a preview must not steal keyboard focus');
dispatch(name, 'click'); assert(dock.hidden); assert.equal(world(), '');
dispatch(name, 'click'); events.get('keydown')({ key: 'Escape' }); assert(dock.hidden); assert.equal(world(), '');
dispatch(name, 'click'); events.get('pointerdown')({ target: { closest: () => null } }); assert(dock.hidden);
dispatch(name, 'click'); navigate(); assert(dock.hidden); assert.equal(world(), '');
console.log('Passed: portrait-only hover; click pins portrait and card; all temporary previews restore both; explicit selection/dismissal clears both; keyboard restoration preserves focus.');
