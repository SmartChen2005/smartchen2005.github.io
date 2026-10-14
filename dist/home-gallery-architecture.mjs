// An imagined museum interior: a Roman rotunda, theatre galleries and a glazed entrance.
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function createGalleryArchitecture() {
  const paths = [];
  const add = (points, group, weight = .6, reveal = 0) => paths.push({ points, group, weight, reveal });
  const curve = (fn, count = 32) => Array.from({ length: count + 1 }, (_, i) => fn(i / count));
  const ring = (radius, y, start = 0, length = TAU) => curve(t => [radius * Math.cos(start + length * t), y, radius * Math.sin(start + length * t)], 56);
  const dome = (theta, phi, inset = 0) => {
    const r = 7 - inset;
    return [r * Math.sin(phi) * Math.cos(theta), 4 + r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
  };
  // A double-edged oculus opens above six rows of recessed, curved coffers.
  for (const [radius, y] of [[1.4, 10.86], [1.56, 10.80], [1.4, 10.64]]) add(ring(radius, y), 'oculus', .95, .12);
  const sectors = 24, rows = 5;
  for (let sector = 0; sector <= sectors; sector++) {
    const theta = Math.PI + Math.PI * sector / sectors;
    add(curve(t => dome(theta, .21 + 1.36 * t)), 'dome-rib', .75, sector / sectors * .13);
  }
  for (let row = 0; row <= rows; row++) {
    const phi = .25 + 1.24 * row / rows;
    add(curve(t => dome(Math.PI + Math.PI * t, phi), 64), 'dome-ring', .55, row * .026);
  }
  for (let row = 0; row < rows; row++) for (let sector = 0; sector < sectors; sector++) {
    const theta = Math.PI + sector * Math.PI / sectors;
    const phi = .25 + row * 1.24 / rows;
    for (const inset of [.012, .032]) {
      const left = theta + inset, right = theta + Math.PI / sectors - inset;
      const top = phi + inset, bottom = phi + 1.24 / rows - inset;
      const points = [
        ...curve(t => dome(left + (right - left) * t, top, inset), 3),
        ...curve(t => dome(right, top + (bottom - top) * t, inset), 3).slice(1),
        ...curve(t => dome(right - (right - left) * t, bottom, inset), 3).slice(1),
        ...curve(t => dome(left, bottom - (bottom - top) * t, inset), 3).slice(1),
      ];
      add(points, 'coffer', inset < .02 ? .42 : .24, .1 + row * .035 + sector / sectors * .1);
    }
  }
  // Layered cornices make the dome's spring line read as a physical edge.
  for (const [radius, y] of [[7.1, 4.18], [7.2, 4.04], [7.05, 3.89], [7, 3.73]]) {
    add(ring(radius, y, Math.PI, Math.PI), 'cornice', .8, .16);
  }
  const column = (x, z, height = 6.15) => {
    const base = -2.5, radius = .19;
    for (let flute = 0; flute < 7; flute++) {
      const angle = TAU * flute / 7;
      const dx = radius * Math.cos(angle), dz = radius * Math.sin(angle);
      add([[x + dx, base + .23, z + dz], [x + dx * .85, base + height - .22, z + dz * .85]], 'column', .46, .24);
    }
    for (const [r, y] of [[.31, base], [.28, base + .12], [.23, base + .24], [.23, base + height - .24], [.33, base + height - .09], [.36, base + height]]) {
      add(curve(t => [x + r * Math.cos(TAU * t), y, z + r * Math.sin(TAU * t)], 16), 'capital', .55, .25);
    }
  };
  for (let i = 0; i <= 10; i++) {
    const theta = Math.PI + Math.PI * i / 10;
    column(6.9 * Math.cos(theta), 6.9 * Math.sin(theta));
  }
  // Three mouldings surround each rear arch; each opening has a recessed threshold.
  for (let i = 0; i < 10; i++) {
    const theta = Math.PI + Math.PI * (i + .5) / 10;
    const cx = 7.07 * Math.cos(theta), cz = 7.07 * Math.sin(theta);
    const wall = (u, y, depth = 0) => [cx - Math.sin(theta) * u + Math.cos(theta) * depth, y, cz + Math.cos(theta) * u + Math.sin(theta) * depth];
    for (const radius of [.62, .75, .87]) {
      add([wall(-radius, -2.5), wall(-radius, 1.1), ...curve(t => wall(Math.cos(Math.PI - Math.PI * t) * radius, 1.1 + Math.sin(Math.PI * t) * radius), 20).slice(1), wall(radius, -2.5)], 'arch', .64, .28 + i * .012);
    }
    add([wall(-.62, -2.5), wall(-.62, -2.5, .32), wall(.62, -2.5, .32), wall(.62, -2.5)], 'threshold', .4, .34);
  }
  // Side balconies, balustrades and paired columns pass the camera at different depths.
  for (const side of [-1, 1]) for (const depth of [-4.5, -.5, 3.5, 7.5]) {
    column(side * 6.55, depth, 6.6);
    for (const level of [.2, 2.4]) {
      const x = side * 6.8, z0 = depth - 2.9, z1 = depth - .3;
      add([[x, level, z0], [x, level, z1], [x + side * .24, level + .12, z1], [x + side * .24, level + .12, z0], [x, level, z0]], 'balcony', .75, .37);
      for (const y of [level + .2, level + .85]) add([[x, y, z0], [x, y, z1]], 'balustrade', .5, .4);
      for (let post = 0; post <= 8; post++) {
        const z = z0 + (z1 - z0) * post / 8;
        add([[x, level + .2, z], [x - side * .06, level + .42, z], [x, level + .85, z]], 'balustrade', .35, .42);
      }
    }
  }
  // A proscenium-like entrance and its inner frames sweep past the viewer.
  for (const z of [8.2, 5.7, 3.2]) for (const inset of [0, .18]) {
    const x = 6.5 - inset, y = 4.65 - inset;
    add([[-x, -2.5, z], [-x, y, z], [x, y, z], [x, -2.5, z]], 'portal', .85, .09);
  }
  // A diamond lattice on the entrance glass briefly precedes the stone rotunda.
  for (let i = -4; i <= 4; i++) {
    const x = i * 1.25;
    add([[x, 4.85, 8.3], [0, 8.3 - Math.abs(i) * .34, 4.5]], 'glass', .42, .04);
    add([[-5 + Math.abs(i) * .55, 5.1 + (i + 4) * .34, 8.3 - (i + 4) * .43], [5 - Math.abs(i) * .55, 5.1 + (i + 4) * .34, 8.3 - (i + 4) * .43]], 'glass', .34, .04);
  }
  // Inlaid radial floor lines and concentric stone joints.
  for (const radius of [2, 3.3, 4.6, 5.9, 7.2, 9.3]) add(ring(radius, -2.52), 'floor', .32, .4);
  for (let i = 0; i < 28; i++) {
    const theta = i * TAU / 28;
    add([[1.9 * Math.cos(theta), -2.52, 1.9 * Math.sin(theta)], [9.3 * Math.cos(theta), -2.52, 9.3 * Math.sin(theta)]], 'floor', .3, .44);
  }
  return paths;
}

export function galleryCamera(time) {
  const travel = smooth((time - 300) / 1800), sweep = Math.sin(travel * Math.PI);
  return {
    x: sweep * 1.1, y: 1.65 + travel * .32, z: 15 - travel * 7.8,
    yaw: sweep * -.18, pitch: .055 + sweep * .25, roll: sweep * -.08,
    trace: smooth((time - 270) / 1000), travel,
  };
}

export function projectGalleryPoint(point, camera, width, height) {
  const x = point[0] - camera.x, y = point[1] - camera.y, depth = camera.z - point[2];
  const horizontal = x * Math.cos(camera.yaw) - depth * Math.sin(camera.yaw);
  const ahead = x * Math.sin(camera.yaw) + depth * Math.cos(camera.yaw);
  const vertical = y * Math.cos(camera.pitch) - ahead * Math.sin(camera.pitch);
  const distance = y * Math.sin(camera.pitch) + ahead * Math.cos(camera.pitch);
  if (distance < .65) return null;
  const focal = Math.min(width * .72, height * .95);
  const px = horizontal * focal / distance, py = -vertical * focal / distance;
  return {
    x: width / 2 + px * Math.cos(camera.roll) - py * Math.sin(camera.roll),
    y: height * (width < 700 ? .59 : .56) + px * Math.sin(camera.roll) + py * Math.cos(camera.roll),
    depth: distance,
  };
}

export function drawGalleryArchitecture(context, paths, time, width, height, opacity) {
  const camera = galleryCamera(time);
  for (const path of paths) {
    const progress = smooth((camera.trace - path.reveal) / .48);
    if (!progress) continue;
    const edgeBudget = (path.points.length - 1) * progress;
    const completeEdges = Math.floor(edgeBudget);
    const glassFade = path.group === 'glass' ? 1 - smooth((time - 780) / 650) : 1;
    context.globalAlpha = opacity * glassFade * (path.group === 'coffer' || path.group === 'floor' ? .62 : .9);
    context.lineWidth = path.weight;
    context.beginPath();
    let previous = null;
    for (let i = 0; i <= completeEdges; i++) {
      const current = projectGalleryPoint(path.points[i], camera, width, height);
      if (current) {
        if (previous) context.lineTo(current.x, current.y);
        else context.moveTo(current.x, current.y);
      }
      previous = current;
      // The leading segment grows continuously instead of appearing one whole edge at a time.
      if (i === completeEdges && i + 1 < path.points.length && current) {
        const next = projectGalleryPoint(path.points[i + 1], camera, width, height);
        if (next) {
          const fraction = edgeBudget - completeEdges;
          context.lineTo(current.x + (next.x - current.x) * fraction, current.y + (next.y - current.y) * fraction);
        }
      }
    }
    context.stroke();
  }
}
