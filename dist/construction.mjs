import * as THREE from '/vendor/three/three.module.min.js';
import { RoomEnvironment } from '/vendor/three/RoomEnvironment.mjs';
import { BOUNDS, LIMIT, fits, place, push, PHYSICS_STEP, stepPhysics, stopMotion, hasMotion } from '/construction-space.mjs';

const canvas = document.querySelector('#maintenance-scene');
const addButton = document.querySelector('#add-objects');
const clearButton = document.querySelector('#clear-objects');
const hint = document.querySelector('#scene-help');
const status = document.querySelector('#scene-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#777563');
scene.fog = new THREE.FogExp2('#777563', .022);
const camera = new THREE.PerspectiveCamera(43, 1, .1, 60);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.012);
const floorHit = new THREE.Vector3();
const objects = [];
const clearing = [];
const CLEAR_DURATION = 720;
let puffTexture;
const obstacles = [{ id: -2, x: 2.55, z: -1.6, halfWidth: .6, halfDepth: 1.8 }];
const MAIN_ANGLE = .25;
let renderer, frame = 0, dirty = true, nextId = 1, selected = null, dragging = null, dragOffset = null, lastTime = 0, accumulator = 0, keyboardMode = false, spawnBlocked = false;
const randomSeed = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const random = randomSeed(404);
const allBodies = () => [...objects, ...obstacles];

function texture(width, height, draw, color = true) {
  const surface = document.createElement('canvas'); surface.width = width; surface.height = height;
  draw(surface.getContext('2d'), width, height);
  const map = new THREE.CanvasTexture(surface);
  if (color) map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
  return map;
}
function wear(ctx, width, height, seed = 7, strength = 1) {
  const rng = randomSeed(seed);
  for (let i = 0; i < 2600; i++) {
    const alpha = rng() * .09 * strength;
    ctx.fillStyle = `rgba(${rng() > .6 ? '255,249,216' : '49,43,24'},${alpha})`;
    ctx.fillRect(rng() * width, rng() * height, 1 + rng() * 3, 1 + rng() * 3);
  }
  for (let i = 0; i < 42; i++) {
    const x = rng() * width, y = rng() * height;
    ctx.strokeStyle = `rgba(30,29,20,${(.018 + rng() * .065) * strength})`;
    ctx.lineWidth = .5 + rng() * 1.1; ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - .5) * 100, y + rng() * 26); ctx.stroke();
  }
  for (let i = 0; i < 18; i++) {
    const x = rng() * width, y = rng() * height, radius = 10 + rng() * 40;
    const stain = ctx.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, `rgba(42,37,21,${rng() * .085 * strength})`); stain.addColorStop(1, 'rgba(42,37,21,0)');
    ctx.fillStyle = stain; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
}
function material(color, options = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .65, metalness: 0, ...options }); }
function mesh(geometry, material, parent = scene, position = [0, 0, 0]) {
  const item = new THREE.Mesh(geometry, material); item.position.set(...position); item.castShadow = true; item.receiveShadow = true; parent.add(item); return item;
}
function roundedRect(width, height, radius, x = -width / 2, y = -height / 2, hole = false) {
  const s = hole ? new THREE.Path() : new THREE.Shape();
  s.moveTo(x + radius, y); s.lineTo(x + width - radius, y); s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + height - radius); s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  s.lineTo(x + radius, y + height); s.quadraticCurveTo(x, y + height, x, y + height - radius);
  s.lineTo(x, y + radius); s.quadraticCurveTo(x, y, x + radius, y); return s;
}
function bevelBox(width, height, depth, radius = .012, curveSegments = 5, bevelSegments = 2) {
  const shape = roundedRect(width - .006, height - .006, radius);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth - .006, steps: 1, bevelEnabled: true, bevelThickness: .003, bevelSize: .003, bevelSegments, curveSegments });
  geometry.translate(0, 0, -depth / 2 + .003); return geometry;
}

let ceramicMap, plasticImage;
function buildRoom() {
  const tileMap = ceramicMap;
  const bumpMap = texture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#929292'; ctx.fillRect(0, 0, w, h);
    const rng = randomSeed(12);
    for (let i = 0; i < 14000; i++) { const shade = 112 + Math.floor(rng() * 44); ctx.fillStyle = `rgb(${shade},${shade},${shade})`; ctx.fillRect(rng() * w, rng() * h, 2, 2); }
  }, false);
  const light = material('#c5c1b4', { map: tileMap, bumpMap, bumpScale: .0016, roughness: .42 });
  const dark = material('#303230', { map: tileMap, bumpMap, bumpScale: .0018, roughness: .37 });
  const tileGeometry = bevelBox(.313, .313, .018, .004, 2, 1);
  const tilePositions = tileGeometry.attributes.position, tileUV = tileGeometry.attributes.uv;
  for (let i = 0; i < tileUV.count; i++) tileUV.setXY(i, tilePositions.getX(i) / .313 + .5, tilePositions.getY(i) / .313 + .5);
  const total = 52 * 52 / 2;
  const whiteTiles = new THREE.InstancedMesh(tileGeometry, light, total);
  const blackTiles = new THREE.InstancedMesh(tileGeometry, dark, total);
  whiteTiles.receiveShadow = blackTiles.receiveShadow = true;
  const transform = new THREE.Object3D(), tint = new THREE.Color(); let wi = 0, bi = 0;
  for (let x = -26; x < 26; x++) for (let z = -26; z < 26; z++) {
    transform.position.set(x * .32, 0, z * .32); transform.rotation.set(-Math.PI / 2, 0, Math.floor(random() * 4) * Math.PI / 2); transform.updateMatrix();
    tint.setRGB(.87 + random() * .13, .87 + random() * .13, .85 + random() * .14);
    const tiles = (x + z) % 2 === 0 ? whiteTiles : blackTiles; const index = tiles === whiteTiles ? wi++ : bi++;
    tiles.setMatrixAt(index, transform.matrix); tiles.setColorAt(index, tint);
  }
  scene.add(whiteTiles, blackTiles);
  const grout = mesh(new THREE.PlaneGeometry(22, 22), material('#797769', { roughness: .95 }), scene, [0, -.012, 0]); grout.rotation.x = -Math.PI / 2; grout.castShadow = false;
  const plasterMap = texture(512, 512, (ctx, w, h) => { ctx.fillStyle = '#cbc8b8'; ctx.fillRect(0, 0, w, h); wear(ctx, w, h, 20, .3); });
  plasterMap.wrapS = plasterMap.wrapT = THREE.RepeatWrapping; plasterMap.repeat.set(3, 2);
  const plaster = material('#a5a48f', { map: plasterMap, bumpMap, bumpScale: .003, roughness: .98 });
  mesh(new THREE.BoxGeometry(16, 3.5, .16), plaster, scene, [0, 1.75, -3.65]);
  mesh(new THREE.BoxGeometry(.16, 3.5, 9), plaster, scene, [-3.65, 1.75, .77]);
  mesh(new THREE.BoxGeometry(1.2, 3.5, 3.6), plaster, scene, [2.55, 1.75, -1.6]);
  const trim = material('#b0ad9b', { roughness: .48, map: tileMap, bumpMap, bumpScale: .001 });
  for (let i = -11; i <= 11; i++) {
    mesh(bevelBox(.315, .205, .04, .002), trim, scene, [i * .32, .107, -3.54]);
    const tile = mesh(bevelBox(.315, .205, .04, .002), trim, scene, [-3.54, .107, i * .32]); tile.rotation.y = Math.PI / 2;
  }
  const ambient = new THREE.HemisphereLight('#d9dcc5', '#646149', .65); scene.add(ambient);
  const sunlight = new THREE.DirectionalLight('#fff1e2', 1.9); sunlight.position.set(-2.7, 7, 5); sunlight.target.position.set(0, 0, -.5); scene.add(sunlight, sunlight.target);
  sunlight.castShadow = true; sunlight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunlight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .5, far: 20 });
  sunlight.shadow.bias = -.0003; sunlight.shadow.normalBias = .012; sunlight.shadow.radius = 3;
  const fill = new THREE.PointLight('#d9dbc5', 5, 14, 2); fill.position.set(3, 3.5, 1); scene.add(fill);
}

const contactMap = () => texture(128, 128, (ctx, w, h) => {
  const fade = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
  fade.addColorStop(0, 'rgba(18,17,11,.42)'); fade.addColorStop(.5, 'rgba(18,17,11,.17)'); fade.addColorStop(1, 'rgba(18,17,11,0)'); ctx.fillStyle = fade; ctx.fillRect(0, 0, w, h);
});
let contactTexture, plasticBump;
function printSign(kind, seed) {
  const map = texture(768, 1152, (ctx, w, h) => {
    ctx.drawImage(plasticImage, 0, 0, w, h);
    ctx.fillStyle = kind === 'maintenance' ? 'rgba(79,52,10,.08)' : 'rgba(79,52,10,.025)'; ctx.fillRect(0, 0, w, h);
    const light = ctx.createLinearGradient(0, 0, w, 0); light.addColorStop(0, 'rgba(45,36,11,.10)'); light.addColorStop(.08, 'rgba(255,232,164,.06)'); light.addColorStop(.92, 'rgba(255,232,164,.02)'); light.addColorStop(1, 'rgba(45,36,11,.12)'); ctx.fillStyle = light; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(103,70,15,.18)'; ctx.lineWidth = 6; ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = '#161a12'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const line = (text, y, size, maxWidth = 610) => { ctx.save(); ctx.font = `${size}px Anton, Impact, sans-serif`; const actual = ctx.measureText(text).width; ctx.translate(w / 2, y); ctx.scale(Math.min(1, maxWidth / actual), 1); ctx.fillText(text, 0, 0); ctx.restore(); };
    if (kind === 'main') { line('404', 442, 324); line('SITE UNDER', 699, 142); line('CONSTRUCTION', 871, 141); line('THIS AREA IS TEMPORARILY', 990, 27); line('UNAVAILABLE', 1027, 27); }
    else if (kind === 'wet') { triangle(ctx, 384, 410, 165); line('CAUTION', 693, 151); line('NO CONTENT', 863, 135); }
    else if (kind === 'maintenance') { line('404', 410, 150); line('UNDER', 607, 154); line('MAINTENANCE', 836, 118); }
    else { triangle(ctx, 384, 402, 158); line('CAUTION', 701, 154); line('CONTENT MISSING', 877, 137); }
    wear(ctx, w, h, seed, 1.4);
    const dirt = ctx.createLinearGradient(0, h * .78, 0, h); dirt.addColorStop(0, 'rgba(74,51,12,0)'); dirt.addColorStop(1, 'rgba(74,51,12,.15)'); ctx.fillStyle = dirt; ctx.fillRect(0, h * .78, w, h * .22);
  }); return map;
}
function triangle(ctx, x, y, size) {
  ctx.lineWidth = 13; ctx.lineJoin = 'round'; ctx.strokeStyle = '#202318';
  ctx.beginPath(); ctx.moveTo(x, y - size * .7); ctx.lineTo(x + size, y + size * .85); ctx.lineTo(x - size, y + size * .85); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#202318'; ctx.fillRect(x - 9, y - 36, 18, 92); ctx.beginPath(); ctx.arc(x, y + 87, 11, 0, Math.PI * 2); ctx.fill();
}
function signGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-.335, -1); shape.lineTo(-.245, -1); shape.lineTo(-.214, -.948); shape.lineTo(.214, -.948); shape.lineTo(.245, -1); shape.lineTo(.335, -1);
  shape.lineTo(.252, -.035); shape.quadraticCurveTo(.25, 0, .218, 0); shape.lineTo(-.218, 0); shape.quadraticCurveTo(-.25, 0, -.252, -.035); shape.closePath();
  shape.holes.push(roundedRect(.242, .066, .028, -.121, -.154, true));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .022, steps: 1, bevelEnabled: true, bevelSize: .004, bevelThickness: .003, bevelSegments: 3, curveSegments: 12 });
  geometry.translate(0, 0, -.011);
  const positions = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (positions.getX(i) + .36) / .72, (positions.getY(i) + 1.02) / 1.04);
  // Print only the exterior cap; the inside of each panel is unprinted plastic.
  geometry.clearGroups(); const normals = geometry.attributes.normal;
  let start = 0, current = normals.getZ(0) > .99 ? 0 : 1;
  for (let i = 3; i < positions.count; i += 3) {
    const next = normals.getZ(i) > .99 ? 0 : 1;
    if (next !== current) { geometry.addGroup(start, i - start, current); start = i; current = next; }
  }
  geometry.addGroup(start, positions.count - start, current);
  return geometry;
}
let panelGeometry;
function aFrame(kind, seed) {
  const group = new THREE.Group(); const angle = .285, hinge = Math.cos(angle) + .014;
  const sides = new THREE.MeshPhysicalMaterial({ color: '#d6aa27', bumpMap: plasticBump, bumpScale: .001, roughness: .5, clearcoat: .16, clearcoatRoughness: .4 });
  const face = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: printSign(kind, seed), bumpMap: plasticBump, bumpScale: .0012, roughness: .48, clearcoat: .16, clearcoatRoughness: .4 });
  for (const direction of [1, -1]) {
    const panel = mesh(panelGeometry, [face, sides], group, [0, hinge, 0]); panel.rotation.x = -angle * direction; if (direction < 0) panel.rotation.y = Math.PI;
  }
  const hingeMesh = mesh(new THREE.CylinderGeometry(.024, .024, .39, 16), sides, group, [0, hinge, 0]); hingeMesh.rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) {
    const brace = mesh(new THREE.BoxGeometry(.017, .018, .42), material('#ab841f', { roughness: .75 }), group, [side * .25, .25, 0]); brace.rotation.x = .05;
  }
  return group;
}
function cone(seed) {
  const group = new THREE.Group(); const surface = material('#cf752b', { roughness: .66, bumpMap: plasticBump, bumpScale: .0015 });
  const base = mesh(bevelBox(.48, .48, .045, .025), material('#35372c', { roughness: .85 }), group, [0, .035, 0]); base.rotation.x = -Math.PI / 2;
  mesh(new THREE.CylinderGeometry(.037, .181, .67, 40, 1, false), surface, group, [0, .393, 0]);
  const stripe = material('#c7c6ac', { roughness: .55 });
  mesh(new THREE.CylinderGeometry(.076, .1, .114, 40), stripe, group, [0, .49, 0]);
  mesh(new THREE.CylinderGeometry(.118, .146, .13, 40), stripe, group, [0, .294, 0]);
  mesh(new THREE.CylinderGeometry(.032, .032, .006, 24), material('#3b3b2d', { roughness: .9 }), group, [0, .731, 0]);
  return group;
}
function barrier(seed) {
  const group = new THREE.Group(); const steel = material('#7d8077', { metalness: .58, roughness: .63 });
  for (const side of [-1, 1]) {
    mesh(new THREE.BoxGeometry(.035, .8, .035), steel, group, [side * .56, .412, 0]);
    mesh(bevelBox(.07, .045, .5, .009), steel, group, [side * .56, .035, 0]);
  }
  const stripMap = texture(768, 160, (ctx, w, h) => {
    ctx.fillStyle = '#cf752b'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#252b23';
    for (let x = -100; x < w + 100; x += 150) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 62, h); ctx.lineTo(x + 145, 0); ctx.lineTo(x + 83, 0); ctx.closePath(); ctx.fill(); }
    wear(ctx, w, h, seed, 1.6);
  });
  for (const height of [.74, .4]) {
    mesh(bevelBox(1.3, .19, .043, .009), material('#cf752b', { roughness: .65 }), group, [0, height, 0]);
    for (const direction of [1, -1]) { const face = mesh(new THREE.PlaneGeometry(1.26, .17), material('#ffffff', { map: stripMap, roughness: .64 }), group, [0, height, direction * .025]); if (direction < 0) face.rotation.y = Math.PI; }
    for (const x of [-.56, .56]) { const bolt = mesh(new THREE.CylinderGeometry(.013, .013, .008, 8), steel, group, [x, height, .033]); bolt.rotation.x = Math.PI / 2; }
  }
  return group;
}
function marker(seed) {
  const group = new THREE.Group(); const plastic = material('#cf752b', { roughness: .66, bumpMap: plasticBump, bumpScale: .001 });
  const base = mesh(bevelBox(.39, .34, .045, .012), material('#3e4032', { roughness: .88 }), group, [0, .034, 0]); base.rotation.x = -Math.PI / 2;
  mesh(new THREE.CylinderGeometry(.027, .034, .49, 16), plastic, group, [0, .291, 0]);
  const head = mesh(new THREE.CylinderGeometry(.145, .145, .024, 40), plastic, group, [0, .635, 0]); head.rotation.x = Math.PI / 2;
  const map = texture(256, 256, (ctx, w, h) => { ctx.fillStyle = '#cf752b'; ctx.fillRect(0, 0, w, h); triangle(ctx, 128, 117, 76); wear(ctx, w, h, seed); });
  for (const direction of [1, -1]) { const face = mesh(new THREE.CircleGeometry(.133, 40), material('#ffffff', { map, roughness: .68 }), group, [0, .635, direction * .014]); if (direction < 0) face.rotation.y = Math.PI; }
  return group;
}

const definitions = {
  main: { label: '404 sign', radius: .46, mass: 1.8, build: (seed) => aFrame('main', seed) },
  caution: { label: 'Content missing sign', radius: .46, mass: 1.8, build: (seed) => aFrame('caution', seed) },
  wet: { label: 'No content sign', radius: .46, mass: 1.8, build: (seed) => aFrame('wet', seed) },
  maintenance: { label: 'Maintenance sign', radius: .46, mass: 1.8, build: (seed) => aFrame('maintenance', seed) },
  cone: { label: 'Orange traffic cone', radius: .35, mass: .65, build: cone },
  barrier: { label: 'Orange portable barrier', radius: .72, mass: 2.6, build: barrier },
  marker: { label: 'Orange warning marker', radius: .27, mass: .6, build: marker }
};
function newObject(type, scale = 1) {
  const definition = definitions[type], id = nextId++;
  const group = definition.build(id * 37); group.scale.setScalar(scale); scene.add(group);
  const contact = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false, opacity: .9 }), scene);
  contact.rotation.x = -Math.PI / 2; contact.castShadow = false; contact.receiveShadow = false;
  const body = { id, type, label: definition.label, x: 0, z: 0, angle: 0, scale, radius: definition.radius * scale, mass: definition.mass * scale ** 2, vx: 0, vz: 0, spin: 0, group, contact, height: 0, bounceStart: 0, targetAngle: null };
  group.traverse(child => { child.userData.body = body; }); return body;
}
function sync(body) {
  body.group.position.set(body.x, body.height + .003, body.z); body.group.rotation.y = body.angle;
  body.contact.position.set(body.x, .014, body.z); body.contact.scale.set(body.radius * 2.65, body.radius * 2.25, 1); body.contact.material.opacity = .9 * Math.max(.1, 1 - body.height * 2);
}
function remove(body) {
  scene.remove(body.group, body.contact);
  const maps = new Set(), materials = new Set(), geometries = new Set();
  body.group.traverse(child => { if (!child.isMesh) return; if (child.geometry !== panelGeometry) geometries.add(child.geometry); for (const m of Array.isArray(child.material) ? child.material : [child.material]) { materials.add(m); if (m.map) maps.add(m.map); } });
  maps.forEach(map => map.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose()); body.contact.geometry.dispose(); body.contact.material.dispose();
}
function smokeMap() {
  return texture(256, 256, ctx => {
    // One shared, softly shaded cloud silhouette; no image download or asset.
    for (const [x, y, r] of [[83, 135, 53], [130, 95, 61], [177, 135, 53], [132, 163, 55], [123, 129, 65]]) {
      const shade = ctx.createRadialGradient(x - r * .2, y - r * .25, r * .12, x, y, r);
      shade.addColorStop(0, 'rgba(246,243,230,1)'); shade.addColorStop(.65, 'rgba(230,229,216,.96)');
      shade.addColorStop(.86, 'rgba(211,212,201,.72)'); shade.addColorStop(1, 'rgba(211,212,201,0)');
      ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  });
}
function finishCloud(effect) {
  if (!effect.removed) remove(effect.body);
  for (const { sprite } of effect.particles) { scene.remove(sprite); sprite.material.dispose(); }
}
function finishClearing() {
  for (const effect of clearing.splice(0)) finishCloud(effect);
  dirty = true;
}
function puffAway(body, started) {
  puffTexture ||= smokeMap();
  const rng = randomSeed(body.id * 971), particles = [];
  const size = Math.max(.7, body.radius * 2.25);
  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 6 + rng() * .3;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTexture, transparent: true, depthWrite: false, opacity: 0, toneMapped: false }));
    const origin = new THREE.Vector3(body.x, (i === 0 ? .55 : .28 + rng() * .65) * body.scale, body.z);
    const drift = new THREE.Vector3(i === 0 ? 0 : Math.cos(angle) * size * .45, .2 + rng() * .25, i === 0 ? 0 : Math.sin(angle) * size * .45);
    sprite.position.copy(origin); sprite.scale.setScalar(.01); scene.add(sprite);
    particles.push({ sprite, origin, drift, size: size * (i === 0 ? 1.65 : .8 + rng() * .4), twist: (rng() - .5) * .55 });
  }
  body.contact.visible = false;
  clearing.push({ body, started, particles, removed: false });
}
function animateClearing(time) {
  for (let i = clearing.length - 1; i >= 0; i--) {
    const effect = clearing[i], t = Math.max(0, (time - effect.started) / CLEAR_DURATION);
    if (t >= 1 || reducedMotion.matches) { finishCloud(effect); clearing.splice(i, 1); continue; }
    // The puff blooms before the prop shrinks out behind it.
    if (!effect.removed) {
      const shrink = Math.max(0, 1 - Math.max(0, t - .06) / .16);
      effect.body.group.scale.setScalar(effect.body.scale * shrink);
      if (t >= .22) { remove(effect.body); effect.removed = true; }
    }
    const burst = 1 - (1 - Math.min(1, t / .27)) ** 3;
    const fade = 1 - Math.max(0, (t - .25) / .75);
    for (const p of effect.particles) {
      p.sprite.position.copy(p.origin).addScaledVector(p.drift, burst * .65 + t * .65);
      p.sprite.scale.setScalar(p.size * (.12 + burst * .88 + t * .35));
      p.sprite.material.opacity = Math.min(1, t / .065) * fade ** 1.5 * .9;
      p.sprite.material.rotation = p.twist * t;
    }
  }
  dirty = true;
}
function announce(message) { status.textContent = message; }
function updateHint() {
  hint.textContent = dragging?.didDrag && dragging.pointerType === 'mouse' ? 'SCROLL TO ROTATE' : spawnBlocked ? 'FLOOR FULL · CLEAR TO MAKE ROOM' : 'DRAG TO MOVE';
}
function updateControls() {
  clearButton.disabled = !objects.length;
  addButton.disabled = !objects.length || objects.length >= LIMIT || spawnBlocked;
  updateHint();
}
function select(body) {
  if (selected) selected.group.traverse(child => { if (child.isMesh) for (const m of Array.isArray(child.material) ? child.material : [child.material]) if (m.emissive) m.emissive.setHex(0); });
  selected = body || null;
  if (body) body.group.traverse(child => { if (child.isMesh) for (const m of Array.isArray(child.material) ? child.material : [child.material]) if (m.emissive) m.emissive.setRGB(.015, .012, .002); });
  if (body) announce(`${body.label} selected. Enter or Space adds one object. Arrow keys move; R rotates; bracket keys select another object.`);
  requestRender();
}
function visible(body) {
  const p = new THREE.Vector3(body.x, .5 * body.scale, body.z).project(camera);
  return p.x > -.84 && p.x < .84 && p.y > -.67 && p.y < .68;
}
function constrainTarget(body, target) {
  let destination = target;
  if (visible(body) && !visible({ ...body, ...target })) {
    let low = 0, high = 1;
    for (let i = 0; i < 14; i++) {
      const t = (low + high) / 2;
      const candidate = { ...body, x: body.x + (target.x - body.x) * t, z: body.z + (target.z - body.z) * t };
      if (visible(candidate)) low = t; else high = t;
    }
    destination = { x: body.x + (target.x - body.x) * low, z: body.z + (target.z - body.z) * low };
  }
  return destination;
}
function moveOnFloor(body, target) {
  stopMotion([body]);
  const changed = push(body, constrainTarget(body, target), allBodies());
  for (const prop of changed) {
    if (prop !== body) prop.targetAngle = null;
    prop.bounceStart = 0; prop.height = 0; sync(prop);
  }
  if (changed.size) { spawnBlocked = false; updateControls(); }
  return changed;
}
function addObject() {
  if (!objects.length) return;
  const types = ['caution', 'wet', 'cone', 'barrier', 'maintenance', 'marker'];
  let body = null;
  if (objects.length < LIMIT) {
    const first = Math.floor(Math.random() * types.length);
    for (let i = 0; i < types.length; i++) {
      body = newObject(types[(first + i) % types.length], .8 + Math.random() * .22);
      const position = place(body, allBodies(), Math.random, visible);
      if (!position) { remove(body); body = null; continue; }
      body.x = position.x; body.z = position.z; body.angle = (Math.random() - .5) * Math.PI * 2;
      body.bounceStart = reducedMotion.matches ? 0 : performance.now(); body.height = body.bounceStart ? .11 : 0;
      objects.push(body); sync(body);
      break;
    }
  }
  spawnBlocked = !body;
  updateControls(); announce(body ? `One object added. ${objects.length} objects in the scene.` : 'The visible floor is full. Clear objects to make room.'); requestRender();
}
function clear() {
  endDrag(); select(null); finishClearing(); spawnBlocked = false;
  const removed = objects.splice(1), started = performance.now();
  for (const body of removed) {
    if (reducedMotion.matches) remove(body); else puffAway(body, started);
  }
  const main = objects[0]; stopMotion(objects); main.targetAngle = null; accumulator = 0;
  updateControls(); announce('Other objects cleared. The original 404 sign stays where you left it.'); requestRender();
}
function setRay(event) {
  const bounds = canvas.getBoundingClientRect(); pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1); raycaster.setFromCamera(pointer, camera);
}
function hitObject(event) { setRay(event); return raycaster.intersectObjects(objects.map(body => body.group), true)[0]?.object.userData.body || null; }
function endDrag(release = false) {
  if (dragging && (!release || !dragging.didDrag || reducedMotion.matches || performance.now() - dragging.lastInput > 120)) stopMotion([dragging.body]);
  if (dragging && canvas.hasPointerCapture(dragging.pointerId)) canvas.releasePointerCapture(dragging.pointerId);
  dragging = null; delete canvas.dataset.dragging; updateHint();
}
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || dragging) return;
  const body = hitObject(event); if (!body) { select(null); return; }
  if (!raycaster.ray.intersectPlane(floorPlane, floorHit)) return;
  stopMotion([body]); body.targetAngle = null; body.height = 0; body.bounceStart = 0;
  sync(body);
  select(body); dragOffset = { x: body.x - floorHit.x, z: body.z - floorHit.z };
  dragging = { body, target: { x: body.x, z: body.z }, lastInput: performance.now(), pointerId: event.pointerId, pointerType: event.pointerType, startX: event.clientX, startY: event.clientY, didDrag: false, didRotate: false }; canvas.setPointerCapture(event.pointerId); canvas.dataset.dragging = '';
  canvas.focus({ preventScroll: true }); event.preventDefault(); requestRender();
});
canvas.addEventListener('pointermove', event => {
  if (dragging) {
    if (event.pointerId !== dragging.pointerId) return;
    if (Math.hypot(event.clientX - dragging.startX, event.clientY - dragging.startY) > (dragging.pointerType === 'touch' ? 8 : 5)) dragging.didDrag = true;
    if (!dragging.didDrag) return;
    updateHint(); setRay(event);
    if (raycaster.ray.intersectPlane(floorPlane, floorHit)) {
      dragging.target = constrainTarget(dragging.body, { x: floorHit.x + dragOffset.x, z: floorHit.z + dragOffset.z });
      dragging.lastInput = performance.now();
      if (reducedMotion.matches) moveOnFloor(dragging.body, dragging.target);
      requestRender();
    }
  } else { if (hitObject(event)) canvas.dataset.hover = ''; else delete canvas.dataset.hover; }
});
canvas.addEventListener('pointerup', event => {
  if (event.pointerId !== dragging?.pointerId) return;
  const gesture = dragging;
  const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
  const clicked = !gesture.didDrag && !gesture.didRotate && distance <= (gesture.pointerType === 'touch' ? 8 : 5);
  endDrag(true);
  if (clicked) addObject();
  requestRender();
});
canvas.addEventListener('pointercancel', () => endDrag());
canvas.addEventListener('lostpointercapture', () => { dragging = null; delete canvas.dataset.dragging; updateHint(); });
canvas.addEventListener('pointerleave', () => { delete canvas.dataset.hover; });
function moveSelected(dx, dz) {
  if (!selected) select(objects[0]); if (!selected) return;
  moveOnFloor(selected, { x: selected.x + dx, z: selected.z + dz }); sync(selected); requestRender();
}
function rotateSelected() { if (!selected) select(objects[0]); if (!selected) return; selected.targetAngle = null; selected.angle += Math.PI / 12; sync(selected); requestRender(); announce(`${selected.label} rotated.`); }
function cycleSelected(direction) {
  if (!objects.length) return;
  const index = selected ? objects.indexOf(selected) : 0;
  select(objects[(index + direction + objects.length) % objects.length]);
}
canvas.addEventListener('wheel', event => {
  if (!dragging || event.ctrlKey || event.metaKey) return;
  event.preventDefault(); dragging.didRotate = true;
  const pixels = (event.deltaY || event.deltaX) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
  const angle = Math.max(-120, Math.min(120, pixels)) * -.0025;
  const body = dragging.body; body.targetAngle = (body.targetAngle ?? body.angle) + angle;
  requestRender();
}, { passive: false });
canvas.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
  const step = event.shiftKey ? .22 : .08;
  const directions = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (directions[event.key]) { event.preventDefault(); moveSelected(...directions[event.key]); }
  else if (event.key.toLowerCase() === 'r') { event.preventDefault(); rotateSelected(); }
  else if (event.key === '[' || event.key === ']') { event.preventDefault(); cycleSelected(event.key === '[' ? -1 : 1); }
  else if ((event.key === 'Enter' || event.key === ' ') && !dragging) { event.preventDefault(); if (!event.repeat) addObject(); }
  else if (event.key === 'Escape') { endDrag(); select(null); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Tab') keyboardMode = true;
  if (document.activeElement === canvas) canvas.dataset.keyboard = '';
  if (event.key === 'Escape') { endDrag(); select(null); }
});
document.addEventListener('pointerdown', () => { keyboardMode = false; delete canvas.dataset.keyboard; }, { capture: true });
canvas.addEventListener('focus', () => { if (keyboardMode) { canvas.dataset.keyboard = ''; select(selected || objects[0]); } });
addButton.addEventListener('click', () => { endDrag(); addObject(); }); clearButton.addEventListener('click', clear);

function resize() {
  endDrag(); const width = canvas.clientWidth, height = canvas.clientHeight;
  renderer.setSize(width, height, false); renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.5 : 2));
  camera.aspect = width / height;
  if (camera.aspect < .85) { camera.position.set(-.9, 4.1, 5); camera.fov = 43; camera.lookAt(0, .35, -.15); }
  else { camera.position.set(-1.6, 4.45, 5.3); camera.fov = 43; camera.lookAt(0, .3, -.25); }
  camera.updateProjectionMatrix(); camera.updateMatrixWorld(); requestRender();
  const target = new THREE.Vector3(0, .3, -.25);
  for (let i = 0; i < 18 && objects.some(body => !visible(body)); i++) {
    camera.position.sub(target).multiplyScalar(1.08).add(target); camera.lookAt(target); camera.updateMatrixWorld();
  }
}
function requestRender() { dirty = true; if (!frame && renderer && !document.hidden) frame = requestAnimationFrame(render); }
function render(time) {
  frame = 0; const dt = Math.min(.066, (time - (lastTime || time)) / 1000); lastTime = time; let animating = false;
  if (reducedMotion.matches) { stopMotion(objects); accumulator = 0; }
  else {
    accumulator += dt;
    const drag = dragging?.didDrag ? { body: dragging.body, ...dragging.target } : null;
    let moved = false, budget = 8;
    while (accumulator >= PHYSICS_STEP && budget-- > 0) {
      const changed = stepPhysics(objects, obstacles, PHYSICS_STEP, drag);
      for (const prop of changed) { prop.bounceStart = 0; prop.height = 0; sync(prop); }
      if (changed.size) { dirty = true; moved = true; }
      accumulator -= PHYSICS_STEP;
    }
    if (moved && spawnBlocked) { spawnBlocked = false; updateControls(); }
    animating = hasMotion(objects) || !!(drag && Math.hypot(drag.x - drag.body.x, drag.z - drag.body.z) > .001);
    if (!animating) accumulator = 0;
  }
  for (const body of objects) {
    if (body.bounceStart) {
      const t = (time - body.bounceStart) / 450;
      body.height = reducedMotion.matches || t >= 1 ? 0 : t < .62 ? .11 * (1 - (t / .62) ** 2) : .014 * Math.sin((t - .62) / .38 * Math.PI);
      if (t >= 1 || reducedMotion.matches) body.bounceStart = 0; else animating = true;
      sync(body); dirty = true;
    }
    if (body.targetAngle !== null) {
      body.angle += (body.targetAngle - body.angle) * (reducedMotion.matches ? 1 : 1 - Math.exp(-6 * dt));
      if (Math.abs(body.angle - body.targetAngle) < .005) { body.angle = body.targetAngle; body.targetAngle = null; } else animating = true;
      sync(body); dirty = true;
    }
  }
  if (clearing.length) { animateClearing(time); animating ||= clearing.length > 0; }
  if (dirty) { renderer.render(scene, camera); dirty = false; }
  if (animating && !document.hidden) frame = requestAnimationFrame(render);
}
document.addEventListener('visibilitychange', () => { endDrag(); stopMotion(objects); accumulator = 0; if (document.hidden) { finishClearing(); cancelAnimationFrame(frame); frame = 0; } else { lastTime = 0; requestRender(); } });
window.addEventListener('blur', () => { endDrag(); stopMotion(objects); });
reducedMotion.addEventListener('change', requestRender);
function fallback() { stopMotion(objects); finishClearing(); document.body.dataset.fallback = ''; document.querySelector('#scene-fallback').hidden = false; canvas.hidden = true; addButton.disabled = clearButton.disabled = true; }
canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); endDrag(); cancelAnimationFrame(frame); frame = 0; fallback(); });
canvas.addEventListener('webglcontextrestored', () => { document.querySelector('#scene-fallback').hidden = true; delete document.body.dataset.fallback; canvas.hidden = false; updateControls(); resize(); });

async function start() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .72;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    await document.fonts.load('20px Anton');
    ceramicMap = await new THREE.TextureLoader().loadAsync('/assets/maintenance/ceramic-albedo.webp');
    ceramicMap.colorSpace = THREE.SRGBColorSpace; ceramicMap.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const plasticMap = await new THREE.TextureLoader().loadAsync('/assets/maintenance/yellow-plastic.webp');
    plasticImage = plasticMap.image; plasticMap.dispose();
    const environment = new RoomEnvironment(), generator = new THREE.PMREMGenerator(renderer);
    scene.environment = generator.fromScene(environment, .08).texture; scene.environmentIntensity = .22; environment.dispose(); generator.dispose();
    plasticBump = texture(128, 128, (ctx, w, h) => { ctx.fillStyle = '#888888'; ctx.fillRect(0, 0, w, h); wear(ctx, w, h, 45, 3); }, false);
    contactTexture = contactMap(); panelGeometry = signGeometry(); buildRoom();
    const main = newObject('main', 1.42); main.x = 0; main.z = -.15; main.angle = MAIN_ANGLE; objects.push(main); sync(main);
    resize(); updateControls();
    new ResizeObserver(resize).observe(canvas);
    announce('404. Site under construction. Click or tap an object to add one. Drag to move; scroll while dragging to rotate. Enter adds an object, arrow keys move, R rotates, and bracket keys select another object.');
    // Read-only diagnostics for reproducible spatial QA; no persistent state.
    window.maintenanceScene = Object.freeze({
      snapshot: () => objects.map(({ id, type, x, z, angle, radius, height, vx, vz, spin }) => ({ id, type, x, z, angle, radius, height, vx, vz, spin })),
      project: id => { const body = objects.find(item => item.id === id); if (!body) return null; const p = new THREE.Vector3(body.x, .5 * body.scale, body.z).project(camera); const r = canvas.getBoundingClientRect(); return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }; },
      projectFloor: (x, z) => { const p = new THREE.Vector3(x, .012, z).project(camera); const r = canvas.getBoundingClientRect(); return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }; },
      floorAt: (x, y) => { setRay({ clientX: x, clientY: y }); return raycaster.ray.intersectPlane(floorPlane, floorHit) ? { x: floorHit.x, z: floorHit.z } : null; },
      pick: (x, y) => hitObject({ clientX: x, clientY: y })?.id ?? null,
      selection: () => selected?.id ?? null,
      grounded: () => objects.every(body => body.height === 0 && fits(body, allBodies())),
      resting: () => !clearing.length && !hasMotion(objects) && !dragging && objects.every(body => !body.bounceStart && body.targetAngle === null),
      clearing: () => ({ objects: clearing.length, particles: clearing.reduce((sum, effect) => sum + effect.particles.length, 0) }),
      rendererInfo: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures })
    });
    requestRender();
  } catch (error) { console.error('Maintenance scene unavailable:', error); fallback(); }
}
start();
