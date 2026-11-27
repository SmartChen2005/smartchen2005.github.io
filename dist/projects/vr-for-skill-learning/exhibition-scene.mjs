import * as THREE from '../../vendor/three/three.module.min.js';

const eyeLevel = 1.65;
const paper = '#e6e0d1';
const blue = '#047dcd';
const orange = '#ffab34';
const red = '#f1322c';
const green = '#00864a';
const pink = '#ed286b';

// Each cross-section joins the same floor and side walls. Narrow sections are
// the open thresholds, and the angled sections give each exhibit its own bay.
const sections = [
  [-3.4, -2.9, 2.35], [-6.0, -3.3, 4.1], [-11.8, -3.1, 2.75],
  [-13.0, -4.0, 3.2], [-18.7, -2.6, 3.0], [-21.4, -2.25, 2.2],
  [-24.5, -3.25, 4.05], [-30.2, -3.0, 2.7], [-31.5, -4.15, 3.15],
  [-37.2, -2.65, 2.9], [-40.3, -2.15, 2.25], [-43.8, -3.3, 4.05],
  [-50.0, -2.95, 2.6], [-52.9, -2.2, 2.1], [-56.0, -4.05, 3.2],
  [-62.1, -2.7, 3.05], [-65.0, -2.25, 2.55], [-69.6, -2.5, 2.5],
];

const exhibits = [
  { id: 'wheel-removal-training', section: 1, side: 'right', color: blue, second: orange },
  { id: 'wheel-removal-training-study', section: 3, side: 'left', color: blue, second: red },
  { id: 'garage-ready', section: 6, side: 'right', color: orange, second: blue },
  { id: 'garage-ready-study', section: 8, side: 'left', color: orange, second: red },
  { id: 'pitch-together', section: 11, side: 'right', color: green, second: orange },
  { id: 'tag', section: 14, side: 'left', color: red, second: pink },
];

const pose = (x, y, z, tx, ty, tz) => ({ eye: [x, y, z], target: [tx, ty, tz] });

const entranceWall = [[-4.18, 1.84], [.64, -.75]];
const [entranceA, entranceB] = entranceWall;
const entranceDx = entranceB[0] - entranceA[0];
const entranceDz = entranceB[1] - entranceA[1];
const entranceWidth = Math.hypot(entranceDx, entranceDz);
const entranceNormal = [-entranceDz / entranceWidth, 0, entranceDx / entranceWidth];
const entranceCenter = [(entranceA[0] + entranceB[0]) / 2 + entranceNormal[0] * .142, 1.81,
  (entranceA[1] + entranceB[1]) / 2 + entranceNormal[2] * .142];
const entranceView = { eye: [1.52, eyeLevel, 6.25], target: entranceCenter };
const exitCenter = [.04, 1.75, -69.455];

function makeExhibitStop({ id, section, side, color }) {
  const [nearZ, nearLeft, nearRight] = sections[section];
  const [farZ, farLeft, farRight] = sections[section + 1];
  const onRight = side === 'right';
  const nearX = onRight ? nearRight : nearLeft;
  const farX = onRight ? farRight : farLeft;
  const dx = farX - nearX;
  const dz = farZ - nearZ;
  const length = Math.hypot(dx, dz);
  const direction = onRight ? 1 : -1;
  const normal = [direction * dz / length, 0, -direction * dx / length];
  const right = [normal[2], 0, -normal[0]];
  const center = [nearX + dx * .51 + normal[0] * .142, 1.77, nearZ + dz * .51 + normal[2] * .142];
  const x = center[0] + normal[0] * 4.12;
  const z = center[2] + normal[2] * 4.12;
  return {
    id, color,
    approach: pose(x * .35, eyeLevel, z + 2.12, x * .25, 1.58, z - 4.0),
    view: { eye: [x, eyeLevel, z], target: center },
    departure: pose(x * .7, eyeLevel, z - 2.1, x * .4, 1.62, z - 7.0),
    panel: { center, normal, right, width: 4.2, height: 2.46 },
  };
}

export const exhibitionStops = [
  {
    id: 'entrance',
    approach: entranceView,
    view: entranceView,
    departure: pose(1.58, eyeLevel, -2.95, .24, 1.58, -7.2),
    panel: { center: entranceCenter, normal: entranceNormal,
      right: [entranceNormal[2], 0, -entranceNormal[0]], width: 4.52, height: 2.66, portraitProximity: .32 },
  },
  ...exhibits.map(makeExhibitStop),
  {
    id: 'exit',
    approach: pose(.52, eyeLevel, -63.0, .1, 1.56, -68.0),
    view: { eye: [.10, eyeLevel, -65.36], target: exitCenter },
    departure: { eye: [.10, eyeLevel, -65.36], target: exitCenter },
    panel: { center: exitCenter, normal: [0, 0, 1], right: [1, 0, 0], width: 4.28, height: 2.62, portraitProximity: .12 },
  },
];

function buildGallery(scene) {
  const materials = new Map();
  function matte(color) {
    if (!materials.has(color)) {
      materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .84, side: THREE.DoubleSide }));
    }
    return materials.get(color);
  }

  function mesh(geometry, surface, x, y, z, shadows = false) {
    const object = new THREE.Mesh(geometry, typeof surface === 'string' ? matte(surface) : surface);
    object.position.set(x, y, z);
    object.castShadow = shadows;
    object.receiveShadow = true;
    scene.add(object);
    return object;
  }

  function box(x, y, z, width, height, depth, surface, yaw = 0, shadows = false) {
    const object = mesh(new THREE.BoxGeometry(width, height, depth), surface, x, y, z, shadows);
    object.rotation.y = yaw;
    return object;
  }

  function wall(a, b, height, surface = paper, thickness = .22) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    return box((a[0] + b[0]) / 2, height / 2, (a[1] + b[1]) / 2,
      Math.hypot(dx, dz) + thickness * .38, height, thickness, surface, Math.atan2(-dz, dx));
  }

  function floor(points, top, thickness, surface) {
    const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    const platform = mesh(geometry, surface, 0, top - thickness, 0);
    platform.rotation.x = -Math.PI / 2;
    return platform;
  }

  function sheet(vertices, surface, thickness = .018) {
    const [a, b, c] = vertices.map(point => new THREE.Vector3(...point));
    const edge = b.clone().sub(a).normalize();
    const normal = edge.clone().cross(c.sub(a)).normalize();
    const up = normal.clone().cross(edge);
    const basis = new THREE.Matrix4().makeBasis(edge, up, normal);
    const outline = vertices.map(point => {
      const offset = new THREE.Vector3(...point).sub(a);
      return new THREE.Vector2(offset.dot(edge), offset.dot(up));
    });
    const shape = new THREE.Shape(outline);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    const panel = mesh(geometry, surface, ...a, true);
    panel.quaternion.setFromRotationMatrix(basis);
    return panel;
  }

  function line(points, color, thickness = .008) {
    for (let index = 1; index < points.length; index++) {
      const a = new THREE.Vector3(...points[index - 1]);
      const b = new THREE.Vector3(...points[index]);
      const delta = b.clone().sub(a);
      const mid = a.addScaledVector(delta, .5);
      const wire = mesh(new THREE.CylinderGeometry(thickness, thickness, delta.length(), 5), color, ...mid);
      wire.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, delta.normalize());
    }
  }

  function ring(x, y, z, radius, width, color) {
    const rim = mesh(new THREE.TorusGeometry(radius, width, 6, 42), color, x, y, z);
    rim.rotation.x = -Math.PI / 2;
    rim.scale.x = 1.12;
  }

  function rod(x, z, top, color, radius = .045, ground = .065) {
    mesh(new THREE.CylinderGeometry(radius, radius, top, 18), color, x, ground + top / 2, z, true);
  }

  function spotlight(origin, aim, intensity, angle, options = {}) {
    const spot = new THREE.SpotLight(options.color || '#fff9f0', intensity, options.range || 15, angle, options.penumbra ?? .32, 2);
    spot.position.set(...origin);
    spot.target.position.set(...aim);
    spot.castShadow = Boolean(options.shadow);
    if (spot.castShadow) {
      spot.shadow.mapSize.set(1024, 1024);
      spot.shadow.camera.near = .35;
      spot.shadow.bias = -.0003;
      spot.shadow.normalBias = .014;
    }
    scene.add(spot, spot.target);
  }

  scene.add(new THREE.HemisphereLight('#e6e4e0', '#8b7d69', .31));

  // The entry text occupies the angled wall inside the gallery. The wall ends
  // at the opening, and the continuous floor leads straight to the next bay.
  floor([[-4.18, 8.4], [3.98, 8.4], [4.46, 2.1], [3.32, -.62], [2.35, -3.4],
    [-2.9, -3.4], [-4.18, 1.84]], 0, .145, '#dbd4c3');
  wall([-4.18, 8.4], entranceA, 3.88, '#a59d90');
  wall(...entranceWall, 3.82, '#e4dfd0');
  wall(entranceB, [.1, -2.68], 3.82, '#a49b8d');
  wall([3.98, 8.4], [4.46, 2.1], 3.78, '#d8d2c3');
  wall([4.46, 2.1], [3.32, -.62], 3.81, paper);
  wall([3.32, -.62], [2.35, -3.4], 3.80, '#cdc5b4');
  wall([.1, -2.68], [-2.9, -3.4], 3.72, '#756f63');

  const stripe = '#055bd6';
  function paintedBase(a, b) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const width = Math.hypot(dx, dz);
    box((a[0] + b[0]) / 2 - dz * .113 / width, .22,
      (a[1] + b[1]) / 2 + dx * .113 / width, width, .27, .012, stripe, Math.atan2(-dz, dx));
  }
  paintedBase([-.92, .088], entranceB);
  paintedBase(entranceB, [.10, -2.68]);

  spotlight([.62, 4.64, 4.97], [-1.67, 1.52, .72], 174, .55, { range: 12, penumbra: .57 });
  spotlight([3.32, 4.36, 2.36], [2.55, 1.79, -1.02], 154, .38, { range: 9, penumbra: .48, shadow: true });

  // One folded suspended marker is seen in the depth of the passage. It sits
  // outside walking clearance and turns its narrow edge toward the corridor.
  const fold = [[2.34, 3.02, -.47], [2.18, 1.99, -.76], [2.55, 2.18, -1.35], [2.64, 3.05, -.92]];
  sheet(fold, blue);
  sheet([fold[2], fold[3], [3.08, 2.65, -.68], [2.95, 1.92, -.91]], orange);
  sheet([fold[1], fold[2], [2.75, 1.49, -1.15], [2.38, 1.36, -.50]], red);
  line([[2.34, 4.49, -.47], fold[0]], '#7d7567', .006);
  line([[2.64, 4.49, -.92], fold[3]], '#7d7567', .006);

  const leftSide = sections.map(([z, x]) => [x, z]);
  const rightSide = sections.map(([z, , x]) => [x, z]);
  floor([...leftSide, ...rightSide.toReversed()], 0, .145, '#dbd4c3');
  for (let index = 0; index < sections.length - 1; index++) {
    const threshold = [0, 4, 5, 9, 10, 12, 13, 16].includes(index);
    wall(leftSide[index], leftSide[index + 1], threshold ? 3.48 : 3.81, threshold ? '#8b8275' : paper);
    wall(rightSide[index], rightSide[index + 1], threshold ? 3.46 : 3.85, threshold ? '#777064' : '#e5e0d2');
  }

  for (const index of [5, 10, 13, 16]) {
    const [z, left, right] = sections[index];
    const opening = 2.7;
    const sideMaterial = '#62584e';
    wall([left, z], [-opening / 2, z], 3.43, sideMaterial, .30);
    wall([opening / 2, z], [right, z], 3.43, sideMaterial, .30);
    box((left + right) / 2, 3.14, z, right - left, .58, .30, sideMaterial);
    box(0, .006, z, opening, .014, .045, '#3e3930');
  }

  for (const [index, exhibit] of exhibits.entries()) {
    const { panel, view } = exhibitionStops[index + 1];
    const { center, normal, right, width, height } = panel;
    const panelYaw = Math.atan2(normal[0], normal[2]);
    const point = (offset, y, distance) => [center[0] + right[0] * offset + normal[0] * distance,
      y, center[2] + right[2] * offset + normal[2] * distance];

    const [px, py, pz] = point(0, center[1], -.014);
    box(px, py, pz, width + .13, height + .11, .022, '#ece5d5', panelYaw);
    const [sx, sy, sz] = point(0, center[1] - height / 2 - .03, .004);
    box(sx, sy, sz, width + .14, .023, .055, '#ada597', panelYaw);

    const lightOffset = [-.64, .60, -.36, .36, -.66, .51][index];
    spotlight([view.eye[0] + right[0] * lightOffset, 4.47, view.eye[2] + right[2] * lightOffset],
      point(-lightOffset / 2, 1.54, 0), 147, .53, { range: 11, penumbra: .56, shadow: index === 0 || index === 4 });
    spotlight(point(-2.37, 4.26, 2.61), point(-2.62, 1.03, .47), 46, .48, { range: 8, penumbra: .60 });

    const outer = index % 2 === 0 ? -1 : 1;
    const d = n => n * outer;
    const [rx, , rz] = point(d(2.43), 0, .65);
    const [qx, , qz] = point(d(2.14), 0, 1.06);
    const y = 1.09 + (index % 3) * .19;
    rod(rx, rz, y, exhibit.second, .038, 0);
    ring(qx, .014, qz, .24, .010, '#39342b');
    const art = [
      [[2.23, 2.32, .53], [2.80, 1.62, .63], [2.24, 1.19, .73]],
      [[2.30, 2.21, .42], [2.83, 1.98, .57], [2.72, 1.36, .58], [2.21, 1.58, .43]],
      [[2.26, 2.33, .63], [2.84, 2.13, .75], [2.74, 1.44, .59], [2.22, 1.61, .50]],
      [[2.33, 2.36, .50], [2.81, 1.46, .54], [2.27, 1.19, .78]],
      [[2.28, 2.28, .49], [2.82, 2.05, .58], [2.62, 1.55, .62], [2.21, 1.68, .55]],
      [[2.29, 2.43, .63], [2.76, 2.21, .59], [2.82, 1.19, .74], [2.31, 1.47, .60]],
    ][index];
    const hanging = art.map(([x, height, distance]) => point(d(x), height, distance));
    sheet(hanging, exhibit.color);
    line([point(d(art[0][0]), 3.78, art[0][2]), hanging[0]], '#777060', .004);
    const [mx, , mz] = point(d(2.48), 0, 1.18);
    box(mx, .015, mz, .61, .022, .20, exhibit.color, panelYaw + (index % 2 ? -.16 : .2), true);
  }

  // A quiet back wall terminates the walking route with the closing reflection.
  wall(leftSide.at(-1), rightSide.at(-1), 3.55, '#a69f8e');
  const [endX, endY, endZ] = exitCenter;
  box(endX, endY, endZ - .013, 4.38, 2.72, .022, '#e4dece');
  spotlight([1.12, 4.26, -65.17], [0, 1.55, -69.30], 162, .61, { range: 10, penumbra: .52 });
}

export function createExhibitionScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'default' });
  renderer.setClearColor('#090808');
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#090808', 12.2, 25.0);
  buildGallery(scene);

  const camera = new THREE.PerspectiveCamera(50, 1, .065, 29);
  const cursor = new THREE.Vector3();
  const projected = new THREE.Vector3();
  let width = 1;
  let height = 1;

  function setPose({ eye, target }) {
    camera.position.set(...eye);
    cursor.set(...target);
    camera.lookAt(cursor);
    camera.updateMatrixWorld();
  }

  return {
    resize(nextWidth, nextHeight) {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      camera.aspect = width / height;
      const verticalFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(32)) / camera.aspect) * 2;
      camera.fov = Math.max(50, THREE.MathUtils.radToDeg(verticalFov));
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    },
    setPose,
    project(point) {
      projected.set(...point).applyMatrix4(camera.matrixWorldInverse);
      const depth = -projected.z;
      projected.applyMatrix4(camera.projectionMatrix);
      return { x: (projected.x + 1) * width * .5, y: (1 - projected.y) * height * .5, z: depth };
    },
    render(nextPose) {
      setPose(nextPose);
      renderer.render(scene, camera);
    },
    dispose() {
      scene.traverse(object => {
        object.geometry?.dispose();
        object.material?.dispose();
        object.shadow?.dispose();
      });
      renderer.dispose();
    },
  };
}
