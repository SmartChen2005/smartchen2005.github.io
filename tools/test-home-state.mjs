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
    matches(selector) { return selector===':hover'?false:this.keyboardFocus; }, focus() {},
    getBoundingClientRect: () => ({ left: 150, top: 330, width: 140, height: 60 }) };
}
const name = identity('name'), games = identity('games', 'A'), photo = identity('photo', 'A'), cars = identity('cars');
const identities = [name, games, photo, cars];
const composition = { dataset: {}, style: style(), getBoundingClientRect: () => ({ left: 150 }) };
const image = { getAttribute: key => key === 'height' ? '4000' : '6000' };
const portrait = { style: style(), isConnected: true, hidden: false, offsetHeight: 0,
  querySelector: () => image, after() {}, addEventListener() {}, remove() { this.isConnected = false; } };
const anchor = { before() { portrait.isConnected = true; } };
const dock = { hidden: true, contains: () => false };
const sentence = { getBoundingClientRect: () => ({ top: 330, bottom: 390 }) };
const nodes = { '.identity-cars': cars, '.composition': composition, '.portrait-full': portrait, '.identity-name': name,
  '.identity-games': games, '.identity-photo': photo, '.business-card-dock': dock, '.sentence': sentence };
let cardOpen = false, keyboardEntries = 0, navigate, navigatePhoto, photoBlocksGame, playback,plays=0;
const gameController = { active: false }, photoController = { active: false };
const sandbox = {
  URLSearchParams, location: { search: '' },
  document: { body: { dataset: {} }, documentElement: { style: style() }, fonts: { ready: { then() {} } },
    querySelector: selector => nodes[selector] || {}, querySelectorAll: () => identities,
    createComment: () => anchor, addEventListener: (key, fn) => events.set(key, fn) },
  window: { addEventListener: (key, fn) => windowEvents.set(key, fn) },
  matchMedia: query => ({ matches: query.includes('hover: hover') }),
  getComputedStyle: () => ({ width: '282px' }), innerWidth: 1280, innerHeight: 720,
  clearTimeout() {}, setTimeout: () => 1,
  ResizeObserver: class { observe() {} },
  createScenes: (_,options) => {playback=options.onMotorPlayback;return {setWorld(){},resize(){},point(){},playCars(){plays++;playback(true,'start');},stopCars(){playback(false,'cancel');}};},
  createBusinessCard: () => ({ show(keyboard) {
    if (!cardOpen && keyboard) keyboardEntries++;
    cardOpen = true; dock.hidden = false;
  }, hide() { cardOpen = false; dock.hidden = true; }, place() {}, activateMotion() {} }),
  installGameTransition: (_, __, clear) => { navigate = clear; return gameController; },
  installPhotoTransition: (link, clear, otherActive) => {
    assert.equal(link, photo, 'The Gallery transition must attach to the native Photographer link');
    navigatePhoto = clear; photoBlocksGame = otherActive; return photoController;
  },
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../dist/home.mjs', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, ''), sandbox);
const dispatch = (element, type, detail = 1) => element.handlers[type]({ detail });
const world = () => composition.dataset.active;

assert.equal(world(), 'name'); assert(!dock.hidden, 'Arrival must show both portrait and card');
assert(portrait.isConnected); assert.equal(name.attributes['aria-pressed'], 'true');
dispatch(games, 'pointerenter'); assert(dock.hidden);
dispatch(games, 'pointerleave'); assert(!dock.hidden, 'The initial expanded selection must survive a temporary preview');
dispatch(name, 'click'); assert(dock.hidden); assert.equal(world(), '', 'The first click closes the initial composition');

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
cars.keyboardFocus = true; dispatch(cars, 'focus'); assert.equal(world(), 'cars', 'Keyboard focus previews cars while preserving native input');
dispatch(cars, 'blur'); assert.equal(world(), 'name');
assert.equal(photo.handlers.click, undefined, 'The identity controller must leave Photographer clicks to its transition installer');
assert.equal(photoBlocksGame(), false);
gameController.active = true;
assert.equal(photoBlocksGame(), true, 'The Photographer transition must respect an active game transition');
gameController.active = false;
photoController.active = true;
dispatch(cars, 'pointerenter');
assert.equal(world(), 'name', 'Identity previews must not replace an active Photographer transition');
photoController.active = false;
dispatch(cars, 'pointerleave');
dispatch(cars, 'click'); assert(dock.hidden); assert.equal(world(), 'cars');assert.equal(plays,1);assert.equal(sandbox.document.body.dataset.motorPlaying,'true');
dispatch(games,'pointerenter');assert.equal(world(),'cars','An active film cannot switch to a hover world');playback(false,'complete');assert.equal(sandbox.document.body.dataset.motorPlaying,undefined);assert.equal(world(),'','Completion restores the normal page when no trigger is hovered');
dispatch(name, 'pointerenter'); assert(dock.hidden, 'Clicking another identity must clear the old card selection');
dispatch(name, 'pointerleave');
dispatch(name, 'click', 0); assert(!dock.hidden); assert.equal(keyboardEntries, 1);
games.keyboardFocus = true; dispatch(games, 'focus'); assert(dock.hidden);
dispatch(games, 'blur'); assert(!dock.hidden); assert.equal(keyboardEntries, 1, 'Restoring a preview must not steal keyboard focus');
dispatch(name, 'click'); assert(dock.hidden); assert.equal(world(), '');
dispatch(name, 'click'); events.get('keydown')({ key: 'Escape' }); assert(dock.hidden); assert.equal(world(), '');
dispatch(name, 'click'); events.get('pointerdown')({ target: { closest: () => null } }); assert(dock.hidden);
dispatch(name, 'click'); navigate(); assert(dock.hidden); assert.equal(world(), '');
dispatch(name, 'click'); navigatePhoto(); assert(dock.hidden); assert.equal(world(), '');
dispatch(cars,'click',0);assert.equal(sandbox.document.body.dataset.motorPlaying,'true');events.get('keydown')({key:'Escape'});assert.equal(sandbox.document.body.dataset.motorPlaying,undefined);assert.equal(world(),'');
dispatch(cars,'click',0);playback(false,'complete');assert.equal(world(),'cars','Keyboard completion restores the car preview and trigger');assert.equal(sandbox.document.body.dataset.motorPlaying,undefined);
for (const [search, expected] of [['?study=games','games'],['?study=photo','photo'],['?study=cars','cars'],['?study=card','name'],['?study=unknown','name']]) {
  const archiveContext = vm.createContext({ ...sandbox, location: { search } });
  vm.runInContext(fs.readFileSync(new URL('../dist/home.mjs', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, ''), archiveContext);
  assert.equal(world(), expected, `Archive entrance ${search} must select its real feature`);
  assert.equal(dock.hidden, expected !== 'name', 'Only card/name arrivals may expose contact material');
}
console.log('Passed: expanded arrival; portrait/card restoration; movie and navigation lifecycle; keyboard restoration; native archive entrances on every identity; unknown archive parameters preserve the normal arrival.');
