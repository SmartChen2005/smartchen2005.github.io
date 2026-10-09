import * as THREE from '/vendor/three/three.module.min.js';
import { RoomEnvironment } from '/vendor/three/RoomEnvironment.mjs';
import { BOUNDS, LIMIT, fits, place, move } from '/construction-space.mjs';

const canvas = document.querySelector('#maintenance-scene');
const addButton = document.querySelector('#add-objects');
const shuffleButton = document.querySelector('#shuffle-objects');
const clearButton = document.querySelector('#clear-objects');
const tools = document.querySelector('#object-tools');
const objectSelect = document.querySelector('#selected-object');
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
const obstacles = [{ id: -1, x: -1.7, z: -2.45, radius: .68 }, { id: -2, x: 2.55, z: -1.6, halfWidth: .6, halfDepth: 1.8 }];
const MAIN_ANGLE = .25;
let renderer, frame = 0, dirty = true, nextId = 1, selected = null, dragging = null, dragOffset = null, lastTime = 0, keyboardMode = false;
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
  buildSink();
  const ambient = new THREE.HemisphereLight('#d9dcc5', '#646149', .65); scene.add(ambient);
  const sunlight = new THREE.DirectionalLight('#fff1e2', 1.9); sunlight.position.set(-2.7, 7, 5); sunlight.target.position.set(0, 0, -.5); scene.add(sunlight, sunlight.target);
  sunlight.castShadow = true; sunlight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunlight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .5, far: 20 });
  sunlight.shadow.bias = -.0003; sunlight.shadow.normalBias = .012; sunlight.shadow.radius = 3;
  const fill = new THREE.PointLight('#d9dbc5', 5, 14, 2); fill.position.set(3, 3.5, 1); scene.add(fill);
}
function buildSink() {
  const group = new THREE.Group(); group.position.set(-1.7, 0, -2.87); scene.add(group);
  const ceramic = material('#c4c2af', { roughness: .28, map: ceramicMap });
  const basin = mesh(new THREE.SphereGeometry(.48, 36, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), ceramic, group, [0, 1.36, .2]); basin.scale.set(1.4, .45, 1); basin.material.side = THREE.DoubleSide;
  const rim = mesh(new THREE.TorusGeometry(.47, .034, 12, 64), ceramic, group, [0, 1.36, .2]); rim.rotation.x = Math.PI / 2; rim.scale.x = 1.4;
  mesh(bevelBox(1.31, .065, .16), ceramic, group, [0, 1.38, -.23]);
  const pipeMaterial = material('#b3b4a6', { roughness: .48 });
  const pipe = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.2, .2), new THREE.Vector3(0, .88, .2), new THREE.Vector3(.13, .77, .2), new THREE.Vector3(.28, .91, .15), new THREE.Vector3(.28, 1.04, -.3)]);
  mesh(new THREE.TubeGeometry(pipe, 40, .046, 14, false), pipeMaterial, group);
  const chrome = material('#9b9e93', { metalness: .85, roughness: .27 });
  for (const side of [-1, 1]) {
    const valve = mesh(new THREE.CylinderGeometry(.061, .061, .08, 24), chrome, group, [side * .3, .89, -.32]); valve.rotation.x = Math.PI / 2;
    const supply = new THREE.CatmullRomCurve3([new THREE.Vector3(side * .3, .89, -.32), new THREE.Vector3(side * .35, 1.1, -.24), new THREE.Vector3(side * .27, 1.35, -.13)]);
    mesh(new THREE.TubeGeometry(supply, 20, .018, 10, false), chrome, group);
  }
  const faucet = new THREE.CatmullRomCurve3([new THREE.Vector3(.28, 1.42, -.2), new THREE.Vector3(.28, 1.68, -.2), new THREE.Vector3(.25, 1.73, .05), new THREE.Vector3(.25, 1.63, .12)]);
  mesh(new THREE.TubeGeometry(faucet, 24, .026, 12, false), chrome, group);
  mesh(new THREE.CylinderGeometry(.066, .066, .035, 24), chrome, group, [.28, 1.44, -.2]);
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
    if (kind === 'main') { line('404', 442, 324); line('SITE UNDER', 699, 142); line('CONSTRUCTION', 871, 141); }
    else if (kind === 'wet') { triangle(ctx, 384, 410, 165); line('CAUTION', 693, 151); line('WET FLOOR', 863, 135); }
    else if (kind === 'maintenance') { line('PLEASE', 410, 150); line('KEEP CLEAR', 607, 154); line('MAINTENANCE', 836, 118); }
    else { triangle(ctx, 384, 402, 158); line('CAUTION', 701, 154); line('CLEANING', 877, 137); }
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
function cone(seed, orange = true) {
  const group = new THREE.Group(); const surface = material(orange ? '#cf752b' : '#cfac29', { roughness: .66, bumpMap: plasticBump, bumpScale: .0015 });
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
    ctx.fillStyle = '#d3ad30'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#252b23';
    for (let x = -100; x < w + 100; x += 150) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 62, h); ctx.lineTo(x + 145, 0); ctx.lineTo(x + 83, 0); ctx.closePath(); ctx.fill(); }
    wear(ctx, w, h, seed, 1.6);
  });
  for (const height of [.74, .4]) {
    mesh(bevelBox(1.3, .19, .043, .009), material('#d6aa27', { roughness: .65 }), group, [0, height, 0]);
    for (const direction of [1, -1]) { const face = mesh(new THREE.PlaneGeometry(1.26, .17), material('#ffffff', { map: stripMap, roughness: .64 }), group, [0, height, direction * .025]); if (direction < 0) face.rotation.y = Math.PI; }
    for (const x of [-.56, .56]) { const bolt = mesh(new THREE.CylinderGeometry(.013, .013, .008, 8), steel, group, [x, height, .033]); bolt.rotation.x = Math.PI / 2; }
  }
  return group;
}
function marker(seed) {
  const group = new THREE.Group(); const plastic = material('#c3a32b', { roughness: .66, bumpMap: plasticBump, bumpScale: .001 });
  const base = mesh(bevelBox(.39, .34, .045, .012), material('#3e4032', { roughness: .88 }), group, [0, .034, 0]); base.rotation.x = -Math.PI / 2;
  mesh(new THREE.CylinderGeometry(.027, .034, .49, 16), plastic, group, [0, .291, 0]);
  const head = mesh(new THREE.CylinderGeometry(.145, .145, .024, 40), plastic, group, [0, .635, 0]); head.rotation.x = Math.PI / 2;
  const map = texture(256, 256, (ctx, w, h) => { ctx.fillStyle = '#d8b22c'; ctx.fillRect(0, 0, w, h); triangle(ctx, 128, 117, 76); wear(ctx, w, h, seed); });
  for (const direction of [1, -1]) { const face = mesh(new THREE.CircleGeometry(.133, 40), material('#ffffff', { map, roughness: .68 }), group, [0, .635, direction * .014]); if (direction < 0) face.rotation.y = Math.PI; }
  return group;
}

const definitions = {
  main: { label: '404 sign', radius: .46, build: (seed) => aFrame('main', seed) },
  caution: { label: 'Cleaning sign', radius: .46, build: (seed) => aFrame('caution', seed) },
  wet: { label: 'Wet floor sign', radius: .46, build: (seed) => aFrame('wet', seed) },
  maintenance: { label: 'Maintenance sign', radius: .46, build: (seed) => aFrame('maintenance', seed) },
  cone: { label: 'Traffic cone', radius: .35, build: (seed) => cone(seed) },
  yellowCone: { label: 'Yellow cone', radius: .35, build: (seed) => cone(seed, false) },
  barrier: { label: 'Portable barrier', radius: .72, build: barrier },
  marker: { label: 'Warning marker', radius: .27, build: marker }
};
function newObject(type, scale = 1) {
  const definition = definitions[type], id = nextId++;
  const group = definition.build(id * 37); group.scale.setScalar(scale); scene.add(group);
  const contact = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false, opacity: .9 }), scene);
  contact.rotation.x = -Math.PI / 2; contact.castShadow = false; contact.receiveShadow = false;
  const body = { id, type, label: definition.label, x: 0, z: 0, angle: 0, scale, radius: definition.radius * scale, group, contact, height: 0, bounceStart: 0, targetAngle: null };
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
function announce(message) { status.textContent = message; }
function updateControls() {
  addButton.disabled = objects.length >= LIMIT;
  shuffleButton.disabled = clearButton.disabled = objects.length <= 1;
  objectSelect.replaceChildren(...objects.map(body => { const option = document.createElement('option'); option.value = String(body.id); option.textContent = `${body.label}${body.id === 1 ? '' : ' ' + body.id}`; return option; }));
  if (selected) objectSelect.value = String(selected.id);
}
function select(body, reveal = true) {
  if (selected) selected.group.traverse(child => { if (child.isMesh) for (const m of Array.isArray(child.material) ? child.material : [child.material]) if (m.emissive) m.emissive.setHex(0); });
  selected = body; if (body) objectSelect.value = String(body.id);
  if (body) body.group.traverse(child => { if (child.isMesh) for (const m of Array.isArray(child.material) ? child.material : [child.material]) if (m.emissive) m.emissive.setRGB(.015, .012, .002); });
  tools.hidden = !reveal || !body;
  if (body) announce(`${body.label} selected. Use arrow keys or the move buttons. R rotates; Escape deselects.`);
  requestRender();
}
function visible(body) {
  const p = new THREE.Vector3(body.x, .5 * body.scale, body.z).project(camera);
  return p.x > -.84 && p.x < .84 && p.y > -.67 && p.y < .68;
}
function moveOnFloor(body, target) {
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
  return move(body, destination, allBodies());
}
function addObjects() {
  endDrag();
  const types = ['caution', 'wet', 'cone', 'yellowCone', 'barrier', 'maintenance', 'marker']; let added = 0;
  for (let i = 0; i < 4 && objects.length < LIMIT; i++) {
    const type = types[Math.floor(Math.random() * types.length)], scale = .8 + Math.random() * .22;
    const body = newObject(type, scale), position = place(body, allBodies(), Math.random, visible);
    if (!position) { remove(body); continue; }
    body.x = position.x; body.z = position.z; body.angle = (Math.random() - .5) * Math.PI * 2;
    body.bounceStart = reducedMotion.matches ? 0 : performance.now(); body.height = body.bounceStart ? .11 : 0;
    objects.push(body); sync(body); added++;
  }
  updateControls(); announce(added ? `${added} objects added. ${objects.length} objects in the scene.` : 'The visible floor is full. Clear some objects to make room.'); requestRender();
}
function shuffle() {
  endDrag(); let changed = 0;
  for (const body of objects.slice(1).sort(() => Math.random() - .5)) {
    const target = place(body, allBodies(), Math.random, visible);
    if (!target) continue;
    body.destination = { x: target.x, z: target.z }; body.targetAngle = body.angle + (Math.random() - .5) * 1.8;
    if (reducedMotion.matches) { move(body, target, allBodies()); body.angle = body.targetAngle; body.destination = body.targetAngle = null; sync(body); }
    changed++;
  }
  announce(`${changed} objects are being rearranged.`); requestRender();
}
function clear() {
  endDrag(); for (const body of objects.splice(1)) remove(body);
  const main = objects[0]; main.x = 0; main.z = -.15; main.angle = MAIN_ANGLE; main.destination = null; main.targetAngle = null; main.height = 0; main.bounceStart = 0; sync(main);
  select(null); updateControls(); announce('Scene cleared. The original 404 sign is back in place.'); requestRender();
}
function setRay(event) {
  const bounds = canvas.getBoundingClientRect(); pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1); raycaster.setFromCamera(pointer, camera);
}
function hitObject(event) { setRay(event); return raycaster.intersectObjects(objects.map(body => body.group), true)[0]?.object.userData.body || null; }
function endDrag() {
  if (dragging && canvas.hasPointerCapture(dragging.pointerId)) canvas.releasePointerCapture(dragging.pointerId);
  dragging = null; delete canvas.dataset.dragging;
}
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || dragging) return;
  const body = hitObject(event); if (!body) { select(null); return; }
  if (!raycaster.ray.intersectPlane(floorPlane, floorHit)) return;
  body.destination = null; body.targetAngle = null; body.height = 0; body.bounceStart = 0;
  select(body, false); dragOffset = { x: body.x - floorHit.x, z: body.z - floorHit.z };
  dragging = { body, pointerId: event.pointerId }; canvas.setPointerCapture(event.pointerId); canvas.dataset.dragging = '';
  canvas.focus({ preventScroll: true }); event.preventDefault(); requestRender();
});
canvas.addEventListener('pointermove', event => {
  if (dragging) {
    if (event.pointerId !== dragging.pointerId) return; setRay(event);
    if (raycaster.ray.intersectPlane(floorPlane, floorHit)) { moveOnFloor(dragging.body, { x: floorHit.x + dragOffset.x, z: floorHit.z + dragOffset.z }); sync(dragging.body); requestRender(); }
  } else { if (hitObject(event)) canvas.dataset.hover = ''; else delete canvas.dataset.hover; }
});
canvas.addEventListener('pointerup', event => { if (event.pointerId === dragging?.pointerId) { endDrag(); if (selected) tools.hidden = false; requestRender(); } });
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('lostpointercapture', () => { dragging = null; delete canvas.dataset.dragging; });
canvas.addEventListener('pointerleave', () => { delete canvas.dataset.hover; });
function moveSelected(dx, dz) {
  if (!selected) select(objects[0]); selected.destination = null;
  moveOnFloor(selected, { x: selected.x + dx, z: selected.z + dz }); sync(selected); requestRender();
}
function rotateSelected() { if (!selected) select(objects[0]); selected.targetAngle = null; selected.angle += Math.PI / 12; sync(selected); requestRender(); announce(`${selected.label} rotated.`); }
canvas.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
  const step = event.shiftKey ? .22 : .08;
  const directions = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (directions[event.key]) { event.preventDefault(); moveSelected(...directions[event.key]); }
  else if (event.key.toLowerCase() === 'r') { event.preventDefault(); rotateSelected(); }
  else if (event.key === 'Escape') { endDrag(); select(null); }
});
document.addEventListener('keydown', event => { if (event.key === 'Tab') keyboardMode = true; if (event.key === 'Escape') { endDrag(); select(null); } });
document.addEventListener('pointerdown', () => { keyboardMode = false; }, { capture: true });
canvas.addEventListener('focus', () => { if (keyboardMode) select(selected || objects[0]); });
objectSelect.addEventListener('change', () => select(objects.find(body => body.id === Number(objectSelect.value))));
document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => { const moves = { left: [-.12, 0], right: [.12, 0], far: [0, -.12], near: [0, .12] }; moveSelected(...moves[button.dataset.move]); }));
document.querySelector('#rotate-object').addEventListener('click', rotateSelected);
addButton.addEventListener('click', addObjects); shuffleButton.addEventListener('click', shuffle); clearButton.addEventListener('click', clear);

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
  frame = 0; const dt = Math.min(.04, (time - (lastTime || time)) / 1000); lastTime = time; let animating = false;
  for (const body of objects) {
    if (body.bounceStart) {
      const t = (time - body.bounceStart) / 450;
      body.height = reducedMotion.matches || t >= 1 ? 0 : t < .62 ? .11 * (1 - (t / .62) ** 2) : .014 * Math.sin((t - .62) / .38 * Math.PI);
      if (t >= 1 || reducedMotion.matches) body.bounceStart = 0; else animating = true;
      sync(body); dirty = true;
    }
    if (body.destination) {
      const before = { x: body.x, z: body.z }, ease = reducedMotion.matches ? 1 : 1 - Math.exp(-5.5 * dt);
      move(body, { x: body.x + (body.destination.x - body.x) * ease, z: body.z + (body.destination.z - body.z) * ease }, allBodies());
      const remainder = Math.hypot(body.x - body.destination.x, body.z - body.destination.z);
      if (remainder < .012 || Math.hypot(body.x - before.x, body.z - before.z) < .00005) body.destination = null; else animating = true;
      sync(body); dirty = true;
    }
    if (body.targetAngle !== null) {
      body.angle += (body.targetAngle - body.angle) * (reducedMotion.matches ? 1 : 1 - Math.exp(-6 * dt));
      if (Math.abs(body.angle - body.targetAngle) < .005) { body.angle = body.targetAngle; body.targetAngle = null; } else animating = true;
      sync(body); dirty = true;
    }
  }
  if (dirty) { renderer.render(scene, camera); dirty = false; }
  if (animating && !document.hidden) frame = requestAnimationFrame(render);
}
document.addEventListener('visibilitychange', () => { endDrag(); if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else { lastTime = 0; requestRender(); } });
window.addEventListener('blur', endDrag);
reducedMotion.addEventListener('change', requestRender);
function fallback() { document.body.dataset.fallback = ''; document.querySelector('#scene-fallback').hidden = false; canvas.hidden = true; addButton.disabled = shuffleButton.disabled = clearButton.disabled = true; tools.hidden = true; }
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
    resize(); addButton.disabled = false; updateControls();
    new ResizeObserver(resize).observe(canvas);
    announce('404. Site under construction. Drag the sign, or add objects to arrange the floor.');
    // Read-only diagnostics for reproducible spatial QA; no persistent state.
    window.maintenanceScene = Object.freeze({
      snapshot: () => objects.map(({ id, type, x, z, angle, radius, height }) => ({ id, type, x, z, angle, radius, height })),
      project: id => { const body = objects.find(item => item.id === id); if (!body) return null; const p = new THREE.Vector3(body.x, .5 * body.scale, body.z).project(camera); const r = canvas.getBoundingClientRect(); return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }; },
      grounded: () => objects.every(body => body.height === 0 && fits(body, allBodies())),
      rendererInfo: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures })
    });
    requestRender();
  } catch (error) { console.error('Maintenance scene unavailable:', error); fallback(); }
}
start();
