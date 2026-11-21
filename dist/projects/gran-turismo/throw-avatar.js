(() => {
  'use strict';

  const { dot, pose } = window.grandTurismoRender;
  const avatarGray = '#5a5a5a';
  const palette = [avatarGray, avatarGray, avatarGray, '#f2f0ee', '#393a42', '#121318', '#8e99a4', '#cbcccf', '#e4e3e2']
    .map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255));
  const release = .82;
  const scale = 7.25;
  const axes = [scale, scale, scale];
  const smooth = (t, start, end) => {
    const u = Math.max(0, Math.min(1, (t - start) / (end - start)));
    return u * u * (3 - 2 * u);
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = v => v.map(n => n / (Math.hypot(...v) || 1));
  const subtract = (a, b) => a.map((n, i) => n - b[i]);
  const extend = (a, direction, length) => a.map((n, i) => n + direction[i] * length);
  // Upper arm and forearm directions in torso space, from the windup through the forward reach.
  const throwPath = [
    [0, [.70, -.68, .22, .02, .80, .60]],
    [.24, [.89, -.37, -.07, .10, .94, .32]],
    [.50, [.88, .30, -.08, .02, .98, .17]],
    [.64, [.73, .57, .34, .10, .96, .19]],
    [release, [.31, .51, .80, .15, .62, .77]],
    [.91, [.26, .30, .92, .07, .30, .952]],
    [1, [.12, -.32, .94, -.10, -.42, .90]],
  ];
  const upper = .305, forearm = .275;

  function samplePath(t) {
    const i = Math.max(0, throwPath.findLastIndex(([time]) => t >= time && time < 1));
    const [start, a] = throwPath[i], [end, b] = throwPath[i + 1];
    const [before, prior] = throwPath[Math.max(0, i - 1)];
    const [after, next] = throwPath[Math.min(throwPath.length - 1, i + 2)];
    const duration = end - start, u = (t - start) / duration;
    const eased = u * u * (3 - 2 * u);
    return a.map((value, axis) => value + (b[axis] - value) * eased + duration * u * (1 - u) *
      ((1 - u) * (i === 0 ? 0 : (b[axis] - prior[axis]) / (end - before)) -
        u * (end === 1 ? 0 : (next[axis] - value) / (after - start))));
  }

  function arm(shoulder, target, pole) {
    const delta = subtract(target, shoulder), axis = unit(delta);
    const distance = Math.max(upper - forearm + .006, Math.min(upper + forearm - .006, Math.hypot(...delta)));
    const reach = (upper * upper - forearm * forearm + distance * distance) / (2 * distance);
    const outward = unit(extend(pole, axis, -dot(pole, axis)));
    const elbow = extend(extend(shoulder, axis, reach), outward, Math.sqrt(upper * upper - reach * reach));
    return { shoulder, elbow, wrist: extend(shoulder, axis, distance) };
  }

  function gesture(t) {
    const coil = smooth(t, .04, .59);
    const drive = smooth(t, .49, .94);
    const snap = smooth(t, .68, .91);
    const open = smooth(t, release - .014, release + .059);
    const angles = samplePath(t), upperDirection = unit(angles.slice(0, 3));
    const forearmDirection = unit(angles.slice(3));
    const shoulder = [.292, .509, .012];
    const elbow = extend(shoulder, upperDirection, upper);
    const wrist = extend(elbow, forearmDirection, forearm);
    const throwing = { shoulder, elbow, wrist };
    const free = arm([-.292, .509, .012], [-.421 - .091 * drive, .28 + .076 * coil - .035 * drive,
      .255 + .026 * coil - .144 * drive], [-.69, -.44, -.39]);
    const direction = unit(extend(forearmDirection, [0, -.37, .14], snap));
    const palm = extend(throwing.wrist, direction, .062);
    const grip = extend(palm, direction, .065);
    return { throwing, free, direction, palm, grip, open, coil, drive };
  }

  function geometry({ throwing, free, direction, palm, open, coil, drive }, node, localLight) {
    const vertices = [];
    const headYaw = .44 + .035 * coil - .39 * drive;
    const headCos = Math.cos(headYaw), headSin = Math.sin(headYaw);
    function loft(rings, color, head = false) {
      if (head) rings = rings.map(ring => ring.map(([x, y, z]) => [x * headCos + z * headSin, y, z * headCos - x * headSin]));
      const count = rings[0].length;
      const lit = rings.map((ring, layer) => ring.map((point, i) => {
        const previous = ring[(i - 1 + count) % count], next = ring[(i + 1) % count];
        const below = rings[Math.max(0, layer - 1)][i], above = rings[Math.min(rings.length - 1, layer + 1)][i];
        const normal = unit(cross(above.map((n, j) => n - below[j]), next.map((n, j) => n - previous[j])));
        const rim = Math.max(0, dot(normal, [.64, .37, -.55]));
        const gain = .55 + .39 * Math.max(0, dot(normal, localLight)) + .13 * rim;
        return [...pose(...point, node), ...palette[color].map(n => n * gain)];
      }));
      for (let layer = 1; layer < lit.length; layer++) {
        const base = lit[layer - 1], top = lit[layer];
        for (let i = 0; i < count; i++) {
          const next = (i + 1) % count;
          vertices.push(...base[i], ...top[i], ...top[next], ...base[i], ...top[next], ...base[next]);
        }
      }
      const bottom = lit[0], top = lit.at(-1);
      for (let i = 1; i < count - 1; i++) {
        vertices.push(...bottom[0], ...bottom[i], ...bottom[i + 1], ...top[0], ...top[i + 1], ...top[i]);
      }
    }
    function ring(count, point) {
      return Array.from({ length: count }, (_, i) => {
        const angle = (i + .5) * 2 * Math.PI / count;
        return point(Math.cos(angle), Math.sin(angle));
      });
    }
    function profile(layers, color, head = false) {
      loft(layers.map(([x, y, z, width, depth]) => ring(16, (a, b) => [x + a * width, y, z + b * depth])), color, head);
    }
    function bar(from, to, start, end, color) {
      const axis = unit(to.map((n, i) => n - from[i]));
      const side = unit(cross(Math.abs(axis[1]) > .88 ? [1, 0, 0] : [0, 1, 0], axis));
      const other = cross(side, axis);
      loft([[0, start * .77], [.18, start], [.82, end], [1, end * .71]].map(([t, radius]) => ring(10, (a, b) =>
        from.map((n, i) => n + (to[i] - n) * t + radius * (side[i] * a + other[i] * b)))), color);
    }
    function faceShell(x, y, layers, color, roundness, sweep = .017) {
      const contour = value => Math.sign(value) * Math.abs(value) ** roundness;
      loft(layers.map(([z, width, height]) => ring(24, (a, b) => [x + width * contour(a),
        y - height * contour(b), z - sweep * a * a])), color, true);
    }

    profile([[0, -.028, 0, .144, .088], [0, .01, 0, .207, .132], [0, .09, 0, .228, .153],
      [0, .26, 0, .249, .174], [0, .43, .007, .308, .169], [0, .51, .002, .343, .147],
      [0, .565, -.007, .285, .122], [0, .61, -.008, .171, .102]], 0);
    profile([[0, .57, 0, .117, .09], [0, .631, 0, .082, .083], [0, .715, 0, .089, .087]], 2);
    profile([[0, .69, .022, .062, .079], [0, .722, .023, .098, .101], [0, .778, .013, .135, .130],
      [0, .851, 0, .146, .135], [0, .924, -.015, .132, .122], [0, .977, -.024, .091, .082],
      [0, .996, -.024, .045, .042]], 2, true);

    // Quest 3: fabric straps, dark facial interface, and an inset white faceplate.
    loft([[-.019, .156], [-.015, .163], [.016, .164], [.020, .157]].map(([lift, radius]) =>
      ring(24, (a, b) => [a * radius, .844 + lift + .015 * b, -.018 + .149 * b])), 8, true);
    loft(Array.from({ length: 20 }, (_, i) => {
      const a = -.94 * Math.PI / 2 + i * 2.72 / 19;
      return [[-.023, .151], [-.023, .158], [.023, .158], [.023, .151]].map(([x, reach]) =>
        [x, .846 + reach * Math.cos(a), -.015 + reach * Math.sin(a)]);
    }), 8, true);
    faceShell(0, .838, [[.087, .134, .067], [.108, .159, .081], [.144, .176, .083], [.169, .177, .081]], 4, .71);
    faceShell(0, .846, [[.136, .169, .077], [.156, .187, .085], [.191, .188, .089], [.216, .175, .082],
      [.231, .166, .077]], 7, .65);
    faceShell(0, .849, [[.228, .163, .073], [.234, .160, .070]], 4, .65);
    faceShell(0, .851, [[.232, .160, .070], [.240, .155, .067], [.247, .134, .058]], 3, .65);
    for (const x of [-.073, 0, .073]) {
      const z = x ? .241 : .247;
      faceShell(x, .825, [[z, .013, .029], [z + .002, .0135, .030]], 8, .87, 0);
      faceShell(x, .825, [[z + .002, .010, .027], [z + .003, .010, .026]], 5, .87, 0);
      if (x) for (const y of [.812, .837]) {
        faceShell(x, y, [[z + .003, .005, .005], [z + .004, .004, .004]], 6, 1, 0);
      }
    }

    for (const { shoulder, elbow, wrist } of [free, throwing]) {
      const [x] = shoulder;
      profile([[x, .425, .01, .047, .048], [x, .468, .008, .093, .089],
        [x, .517, .008, .104, .095], [x, .555, .006, .069, .068], [x, .575, .006, .037, .037]], 0);
      bar(shoulder, elbow, .096, .075, 0);
      const [jx, jy, jz] = elbow;
      profile([[jx, jy - .054, jz, .039, .040], [jx, jy, jz, .072, .072],
        [jx, jy + .052, jz, .041, .042]], 0);
      bar(elbow, wrist, .077, .049, 0);
    }
    const freeHand = unit(subtract(free.wrist, free.elbow));
    bar(free.wrist, extend(free.wrist, freeHand, .094), .056, .039, 1);
    bar(throwing.wrist, palm, .060, .050, 1);
    const sideways = unit(extend([1, 0, 0], direction, -direction[0]));
    const curled = cross(sideways, direction);
    for (const finger of [-1.5, -.5, .5, 1.5]) {
      const base = extend(palm, sideways, finger * .023);
      const tip = extend(extend(extend(base, direction, .058 + .036 * open), curled, .030 * (1 - open)),
        sideways, finger * .008 * open);
      bar(base, tip, .014, .009, 2);
    }
    const thumb = extend(palm, sideways, .043);
    bar(thumb, extend(extend(thumb, direction, .043), curled, .034), .020, .012, 2);
    return { vertices: Float32Array.from(vertices) };
  }

  function stage(releasePoint, cameraYaw, throwYaw) {
    const stance = cameraYaw + 1.77;
    const turn = Math.atan2(Math.sin(throwYaw - stance), Math.cos(throwYaw - stance));
    const forward = [Math.sin(throwYaw), 0, Math.cos(throwYaw)];
    function transform({ coil, drive }, origin) {
      const yaw = (stance + .21 * coil * (1 - drive) + .86 * turn * drive) / 2;
      const pitch = (-.055 * coil + .16 * drive) / 2;
      const roll = (.10 * coil - .19 * drive) / 2;
      const [x, y, z, w] = [Math.cos(yaw) * Math.sin(pitch), Math.sin(yaw) * Math.cos(pitch),
        -Math.sin(yaw) * Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
      const c = Math.cos(roll), s = Math.sin(roll);
      return { p: extend(extend(origin, forward, .43 * drive - .23 * coil), [0, 1, 0], .068 * coil - .034 * drive),
        q: [x * c + y * s, y * c - x * s, z * c + w * s, w * c - z * s], size: axes };
    }
    const atRelease = gesture(release);
    const gripOffset = pose(...atRelease.grip, transform(atRelease, [0, 0, 0]));
    const origin = releasePoint.map((n, i) => n - gripOffset[i]);
    return t => {
      const joints = gesture(t);
      const node = transform(joints, origin);
      const grip = pose(...joints.grip, node);
      const inverseRotation = { p: [0, 0, 0], size: [1, 1, 1], q: node.q.map((n, i) => i === 3 ? n : -n) };
      const localLight = pose(-.48, .74, -.47, inverseRotation);
      return { grip, batch: geometry(joints, node, localLight) };
    };
  }

  window.grandTurismoAvatar = { release, stage };
})();
