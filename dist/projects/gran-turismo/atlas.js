(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const { camera, project, dot, span, pose, meshBatch, clearCanvas, createRenderer } = window.grandTurismoRender;
  const notes = window.grandTurismoNotes;
  const approach = $('approach'), section = $('atlas'), scene = $('survey-scene'), plot = $('plot'), picker = $('contact');
  const flightCues = Array.from(approach.querySelectorAll('[data-cue]'), element => ({
    element, start: Number(element.dataset.start), end: Number(element.dataset.end),
  }));
  const stoneCue = flightCues.find(({ element }) => element.id === 'star-stone-cue');
  const flightVideo = $('flight-video'), flightMedia = flightVideo.closest('.flight-media');
  const timeline = $('map-history'), history = window.GRAND_TURISMO_HISTORY;
  const currentIndex = history?.milestones.length ?? 0;
  const latest = {
    title: 'Current survey',
    summary: 'The World Tree, music stars, and Tavi encounters expanded the route.',
  };
  const blockoutNotes = {
    checkpoint: ['Route marker', 'One of four Monoliths that divide the expedition into five legs.',
      'These positions set the order and spacing of the route.'],
    finish: ['Route endpoint', 'The final veil marks the end of the fifth leg.',
      'The expedition leads from the departure point through the four Monoliths to this threshold.'],
  };
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 820px)');
  const markerArt = {
    ship: ['▰', '#d6e9ed'], checkpoint: ['◆', '#e1f4f2'], portal: ['◇', '#cfbdf2'],
    fuel: ['■', '#83bbff'], oxygen: ['●', '#9bedd7'], blackHole: ['◎', '#ea9aab'],
    finish: ['▱', '#e1f4f2'], star: ['✦', '#e1f4f2'],
    prototypeShip: ['▰', '#d6e9ed'], prototypePortal: ['◇', '#cfbdf2'],
    prototypeWell: ['◎', '#ea9aab'], prototypeTarget: ['◆', '#e1f4f2'],
  };
  const fallbackArt = ['+', '#c2d2d5'];
  const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  const meters = n => `${number.format(n)} m`;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const offset = (a, b, t) => a.map((value, i) => mix(value, b[i], t));
  const size = element => [element.clientWidth, element.clientHeight];
  const resetCamera = () => ({ yaw: -.38, elevation: .66, zoom: 1, pan: [0, 0], target: null, mode: 'orbit' });
  const displayName = node => node.zone ? `${node.title} / ${node.zone}` : node.title;

  const atlas = { sky: $('map-sky'), overlay: $('map-overlay'), renderer: createRenderer($('map-mesh')) };
  const specimen = $('specimen'), objectRenderer = createRenderer($('object-render'));
  const markers = new Map();
  let data, byId, contacts, terrain, route, treeCenter, ship, world, worldPoints, selected, study;
  let frame = 0, pendingMap = true, pendingFlight = true, pendingStudy = true, mapView, hitSurfaces = [], docked = true;
  let flightProgress, lastFlightFrame;
  let controls = resetCamera(), panMode = false, drag, ignoreClick = false, etag = '', syncing = false;
  let currentMap = window.GRAND_TURISMO_MAP, milestoneIndex = currentIndex, historyFrame = 0;
  let stoneImpact, portal, tavi;

  function pointsOf(node) {
    return node.bounds.length ? node.bounds : [node.p];
  }

  function fit(yaw, elevation, width, height) {
    const flat = camera(yaw, elevation, [0, 0, 0], 1, 0, 0);
    const projected = span(worldPoints.map(p => [dot(flat.right, p), dot(flat.up, p), 0]));
    const center = flat.right.map((n, i) => n * projected.center[0] + flat.up[i] * projected.center[1] + flat.depth[i] * dot(flat.depth, world.center));
    const scale = Math.min((width - 54) / (projected.hi[0] - projected.lo[0]), (height - 76) / (projected.hi[1] - projected.lo[1]));
    return { center, scale };
  }

  function drawSky({ sky }, view, width, height) {
    const ctx = clearCanvas(sky, width, height);
    for (const [x, y, z, radius, brightness] of data.sky) {
      const direction = [x, y, z], depth = dot(view.depth, direction);
      if (depth <= .08) continue;
      const scale = height * .58 / depth;
      const px = width / 2 + dot(view.right, direction) * scale;
      const py = height / 2 - dot(view.up, direction) * scale;
      if (px < 0 || py < 0 || px > width || py > height) continue;
      ctx.fillStyle = `rgba(239,234,244,${Math.min(.86, brightness * 3)})`;
      ctx.beginPath(); ctx.arc(px, py, clamp(radius * scale, .45, 1.7), 0, Math.PI * 2); ctx.fill();
    }
  }

  function line(ctx, view, points, color, width = 1, dash = []) {
    ctx.beginPath();
    for (const [i, p] of points.entries()) {
      const [x, y] = project(view, p);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
  }

  function ring(p, radius, vertical = false) {
    return Array.from({ length: 65 }, (_, i) => {
      const angle = i * Math.PI / 32;
      const x = p[0] + radius * Math.cos(angle), side = radius * Math.sin(angle);
      return vertical ? [x, p[1] + side, p[2]] : [x, p[1], p[2] + side];
    });
  }

  function hull(points) {
    const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const turn = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    function half(path) {
      const outer = [];
      for (const p of path) {
        while (outer.length > 1 && turn(outer.at(-2), outer.at(-1), p) <= 0) outer.pop();
        outer.push(p);
      }
      return outer.slice(0, -1);
    }
    return [...half(sorted), ...half(sorted.reverse())];
  }

  function polygon(ctx, points, fill, stroke) {
    if (points.length < 3) return;
    ctx.beginPath(); ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = .7; ctx.stroke(); }
  }

  function drawBackdrop(view, width, height, surveyOpacity) {
    drawSky(atlas, view, width, height);
    if (!surveyOpacity) return;
    const back = atlas.sky.getContext('2d');
    back.globalAlpha = surveyOpacity;
    const { lo, hi } = world;
    const gridColor = '#bfadb831';
    const step = view.scale > 5 ? 10 : 50;
    const x0 = Math.floor(lo[0] / step) * step, x1 = Math.ceil(hi[0] / step) * step;
    const z0 = Math.floor(lo[2] / step) * step, z1 = Math.ceil(hi[2] / step) * step;
    const y = Math.floor(lo[1] / 10) * 10;
    for (let x = x0; x <= x1; x += step) line(back, view, [[x, y, z0], [x, y, z1]], gridColor);
    for (let z = z0; z <= z1; z += step) line(back, view, [[x0, y, z], [x1, y, z]], gridColor);
    for (const node of terrain) {
      const bounds = node.bounds.map(p => project(view, p));
      if (bounds.every(p => p[0] < 0) || bounds.every(p => p[0] > width) ||
          bounds.every(p => p[1] < 0) || bounds.every(p => p[1] > height)) continue;
      polygon(back, hull(bounds), '#9b909937', '#c4bac54c');
    }
    if (!atlas.renderer.gpu) {
      for (const node of contacts) {
        if (node.veil) continue;
        polygon(back, hull(node.bounds.map(p => project(view, p))), '#9aaebc40', '#c8d9dd85');
      }
    }
    back.globalAlpha = 1;
  }

  function drawMapWorld(view, width, height) {
    drawBackdrop(view, width, height, 1);
    atlas.renderer.draw(view, width, height, .91);
    const front = clearCanvas(atlas.overlay, width, height);
    for (const node of contacts) {
      if (node.kind === 'blackHole' || node.kind === 'prototypeWell') {
        line(front, view, ring(node.p, node.influence), '#db82985c');
        if (controls.mode === 'orbit') line(front, view, ring(node.p, node.influence, true), '#db82982e');
        line(front, view, ring(node.p, node.core), '#db8298b0');
      }
      if (node.pair && node.id < node.pair) line(front, view, [node.p, byId.get(node.pair).p], `${node.tint}95`, 1, [3, 7]);
    }
    line(front, view, route, '#f2ebef94', 1.25, [5, 5]);
    return front;
  }

  function orbitPoint(center, angle, radius, rise) {
    return [center[0] - Math.sin(angle) * radius, center[1] + rise, center[2] - Math.cos(angle) * radius];
  }

  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const normalize = p => p.map(n => n / (Math.hypot(...p) || 1));

  function findStoneImpact() {
    const fragment = byId.get('2027100');
    const name = fragment?.scenery?.[0];
    if (!data.models.StarStone || name !== 'Fragments/AncientRuins/MonolithCrown') return null;
    const [points, faces] = data.models[name];
    // Center the impact on the outward face of this archived crown fragment.
    const [a, b, c] = faces.slice(6, 9).map(i => pose(...points.slice(i * 3, i * 3 + 3), fragment));
    const right = normalize(b.map((n, i) => n - a[i]));
    const normal = normalize(cross(right, c.map((n, i) => n - a[i])));
    return { point: a.map((n, i) => (n + b[i] + c[i]) / 3), right, up: cross(normal, right), normal };
  }

  function sigilStrokes() {
    const strokes = [];
    const polar = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12, b = (i + 1) * Math.PI / 12;
      strokes.push([polar(a, .84), polar(b, .84), .050, true]);
      if (i % 6 !== 5) strokes.push([polar(a, 1), polar(b - .035, 1), .061, true]);
    }
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, center = polar(a, .71);
      const diamond = Array.from({ length: 4 }, (_, j) => polar(a + j * Math.PI / 2, j % 2 ? .034 : .065)
        .map((n, k) => n + center[k]));
      for (let j = 0; j < 4; j++) strokes.push([diamond[j], diamond[(j + 1) % 4], .036, false]);
      strokes.push([polar(a, .56), polar(a + Math.PI / 3, .56), .047, false]);
      strokes.push([polar(a, .34), polar(a, .47), .046, false]);
    }
    for (let i = 0; i < 4; i++) strokes.push([polar(i * Math.PI / 2, .035), polar(i * Math.PI / 2, .15), .04, false]);
    return strokes;
  }

  const runeStrokes = sigilStrokes();

  function surfaceSigil(impact, age) {
    const { point, right, up, normal } = impact;
    const pulse = Math.sin(Math.PI * clamp(age / .52, 0, 1));
    const vertices = [];
    for (const [a, b, width, outer] of runeStrokes) {
      const reveal = ease(clamp((age - (outer ? 0 : .13)) / .43, 0, 1));
      const radius = 1.68 * reveal * (1 + .07 * pulse);
      const tangent = normalize([b[0] - a[0], b[1] - a[1]]);
      const dx = -tangent[1] * width * .64, dy = tangent[0] * width * .64;
      const corners = [[a[0]-dx, a[1]-dy], [a[0]+dx, a[1]+dy], [b[0]+dx, b[1]+dy], [b[0]-dx, b[1]-dy]];
      for (const i of [0, 1, 2, 0, 2, 3]) {
        const [x, y] = corners[i];
        vertices.push(...point.map((n, k) => n + normal[k] * .026 + radius * (right[k] * x + up[k] * y)),
          1, .16 + pulse * .09, .14);
      }
    }
    const opacity = .96 * (1 - ease(clamp((age - .68) / .32, 0, 1)));
    return { batch: { vertices: Float32Array.from(vertices) }, opacity, gain: 1.53 };
  }

  const stoneLaunch = (stoneCue?.start ?? .43) + .004;
  const stoneHit = (stoneCue?.start ?? .43) + .048;

  function stonePosition(t, width, height) {
    const entry = flightCamera(stoneLaunch, width, height);
    const frame = camera(entry.yaw, entry.elevation, entry.center, entry.scale, width / 2, height / 2);
    const near = 24;
    const from = entry.center.map((n, i) => n + frame.depth[i] * (near - entry.distance) -
      frame.right[i] * width / height * near * .60 + frame.up[i] * near * .06);
    const target = stoneImpact.point.map((n, i) => n + stoneImpact.normal[i] * .98);
    // Bow around the fragment to meet the marked face from the open side.
    const p = from.map((n, i) => mix(n, target[i], t) + stoneImpact.normal[i] * 12 * Math.sin(Math.PI * t));
    p[1] += 14 * t * (1 - t);
    return p;
  }

  function stoneShot(base, progress, width, height) {
    if (!stoneImpact || !stoneCue || progress < stoneLaunch || progress >= stoneCue.end + .032) {
      return { view: base, effects: [] };
    }
    const t = clamp((progress - stoneLaunch) / (stoneHit - stoneLaunch), 0, 1);
    const p = stonePosition(t, width, height);
    const approach = ease(clamp((progress - stoneLaunch) / .045, 0, 1));
    const release = 1 - ease(clamp((progress - stoneCue.end + .021) / .053, 0, 1));
    const weight = approach * release;
    const direction = camera(base.yaw, base.elevation, base.center, base.scale, 0, 0).depth;
    const orbitEye = base.center.map((n, i) => n - direction[i] * base.distance);
    const { point, normal, right, up } = stoneImpact;
    const portrait = clamp(1 - width / height, 0, 1);
    const drift = ease(clamp((progress - stoneLaunch) / (stoneCue.end - stoneLaunch), 0, 1));
    const closeEye = point.map((n, i) => n + normal[i] * (21 + 12 * portrait) +
      right[i] * mix(-10, -3, drift) + up[i] * 4.5);
    const eye = offset(orbitEye, closeEye, weight);
    // Lead the throw toward the surface so the camera drifts past the stone instead of locking to it.
    const narrow = clamp((1.25 - width / height) / .8, 0, 1);
    const lead = mix(.62, .10, narrow);
    const aimWeight = 1 - (1 - weight) ** (1 + 2 * narrow);
    const aim = offset(base.center, offset(p, point, lead), aimWeight);
    const view = flightView(eye, aim, aim, 0, base.focus, base.range, height);
    view.frameX = mix(base.frameX ?? .5, .56, weight);
    view.frameY = mix(base.frameY ?? .5, .45, weight);

    const effects = [];
    const age = (progress - stoneHit) / (stoneCue.end - stoneHit);
    if (age >= 0 && age < 1) effects.push(surfaceSigil(stoneImpact, age));
    const opacity = 1 - ease(clamp((progress - stoneHit) / .006, 0, 1));
    if (opacity <= 0) return { view, effects };
    const spin = 1 + 5 * t, size = [12, 12, 12];
    const q = [0, .8 * Math.sin(spin), .6 * Math.sin(spin), Math.cos(spin)];
    const parts = [['StarStone', ['#d9d9d9', '#212429', '#e6080a', '#fa151b']]];
    effects.push({ batch: meshBatch(data.models, [{ p, q, size, parts }]), opacity, gain: 1.22 });
    return { view, effects };
  }

  function orbitVelocity(angle, speed, riseSpeed = 0) {
    return [-Math.cos(angle) * speed, riseSpeed, Math.sin(angle) * speed];
  }

  function cruise(from, to, leaving, arriving, progress, start, end) {
    // Endpoint velocities are in metres per unit of scroll, shared with adjoining arcs.
    const duration = end - start, t = (progress - start) / duration, p = ease(t);
    return offset(from, to, p).map((value, i) => value +
      duration * t * (1 - t) * ((1 - t) * leaving[i] - t * arriving[i]));
  }

  function flightView(eye, aim, nextAim, blend, focus, range, height, turnDirection = 0) {
    const directions = [aim, nextAim].map(target => {
      const [x, y, z] = target.map((value, i) => value - eye[i]);
      return [Math.atan2(x, z), -Math.atan2(y, Math.hypot(x, z)), Math.hypot(x, y, z)];
    });
    const [[a, pitch, near], [b, nextPitch, far]] = directions;
    let turn = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    // Pick a side when the landmarks pass opposite each other during a cruise.
    if (turnDirection * turn < 0) turn += turnDirection * 2 * Math.PI;
    const yaw = a + turn * blend;
    const elevation = mix(pitch, nextPitch, blend), distance = mix(near, far, blend);
    const flat = Math.cos(elevation) * distance;
    const center = [eye[0] + Math.sin(yaw) * flat, eye[1] - Math.sin(elevation) * distance,
      eye[2] + Math.cos(yaw) * flat];
    return { yaw, elevation, distance, center, focus, range, scale: height * .9 / distance };
  }

  function flightCamera(progress, width, height) {
    const treeExit = .60, portalArrival = .665, taviArrival = .761, portalExit = .857, treePass = .93;
    const portrait = clamp((1 - width / height) / .55, 0, 1);
    const shipCenter = ship ? span(pointsOf(ship)).center : data.spawn;
    const veil = portal?.p || data.spawn;
    const startRadius = 66 + portrait * 26, treeRadius = startRadius + 37;
    const treeStart = .45, treeSweep = -3 * Math.PI, treeAngle = treeStart + treeSweep;
    const startRise = 16.5, endRise = 28;
    if (progress <= treeExit) {
      const t = progress / treeExit, turn = mix(t, ease(t), .4);
      const eye = orbitPoint(treeCenter, treeStart + treeSweep * turn, mix(startRadius, treeRadius, ease(turn)), mix(startRise, endRise, t));
      const aim = [treeCenter[0], treeCenter[1] + 2.3 * (1 - ease(t)), treeCenter[2]];
      return flightView(eye, aim, aim, 0, treeCenter, mix(160, 218, ease(t)), height);
    }

    // The portal orbit starts on its ship-facing side. Its tangent points left across the route.
    const portalAngle = Math.atan2(veil[0] - shipCenter[0], veil[2] - shipCenter[2]);
    const portalRadius = 52 + portrait * 32;
    const portalFront = orbitPoint(veil, portalAngle, portalRadius, 11);
    const angularSpeed = Math.PI * 2 * .62 / (taviArrival - portalArrival);
    const portalVelocity = orbitVelocity(portalAngle, portalRadius * angularSpeed);
    if (progress < portalArrival) {
      const leaving = orbitPoint(treeCenter, treeAngle, treeRadius, endRise);
      const velocity = orbitVelocity(treeAngle, treeRadius * treeSweep * .6 / treeExit, (endRise - startRise) / treeExit);
      const eye = cruise(leaving, portalFront, velocity, portalVelocity, progress, treeExit, portalArrival);
      const blend = ease((progress - treeExit) / (portalArrival - treeExit));
      return flightView(eye, treeCenter, veil, blend, offset(treeCenter, veil, blend), mix(218, 200, blend), height, 1);
    }
    const companion = tavi?.p || veil;
    const companionRadius = tavi ? 4.8 + portrait * 1.8 : portalRadius;
    const companionRise = tavi ? 1.2 : 11;
    const companionFrameX = tavi ? mix(.57, .51, portrait) : .5;
    const companionFrameY = tavi ? .41 : .5;
    const arcAngle = t => portalAngle + 2 * Math.PI * mix(t, ease(t), .38);
    if (progress < taviArrival) {
      const t = (progress - portalArrival) / (taviArrival - portalArrival);
      const eye = orbitPoint(veil, arcAngle(t), portalRadius, 11);
      return flightView(eye, veil, veil, 0, veil, 200, height);
    }
    if (progress <= portalExit) {
      const t = (progress - taviArrival) / (portalExit - taviArrival);
      const drift = ease(clamp(t / .46, 0, 1));
      const aim = offset(veil, companion, drift);
      const eye = orbitPoint(aim, arcAngle(t), mix(portalRadius, companionRadius, drift), mix(11, companionRise, drift));
      const view = flightView(eye, aim, aim, 0, aim, 200, height);
      view.frameX = mix(.5, companionFrameX, drift);
      view.frameY = mix(.5, companionFrameY, drift);
      return view;
    }

    // Left is relative to travel from the ship toward the portal.
    const left = [-Math.cos(portalAngle), 0, Math.sin(portalAngle)];
    const waypoint = treeCenter.map((coordinate, i) => coordinate + left[i] * 88);
    waypoint[1] += 22;
    const southbound = [-Math.sin(portalAngle) * 1500, 0, -Math.cos(portalAngle) * 1500];
    if (progress < treePass) {
      const t = (progress - portalExit) / (treePass - portalExit);
      const leaving = orbitPoint(companion, portalAngle, companionRadius, companionRise);
      const velocity = orbitVelocity(portalAngle, companionRadius * angularSpeed);
      const eye = cruise(leaving, waypoint, velocity, southbound, progress, portalExit, treePass);
      const blend = ease(t);
      const view = flightView(eye, companion, treeCenter, blend, offset(companion, treeCenter, blend), mix(200, 315, blend), height);
      view.frameX = mix(companionFrameX, .5, blend);
      view.frameY = mix(companionFrameY, .5, blend);
      return view;
    }
    // Frame the sails and full hull opposite the video.
    const narrow = clamp((1.23 - width / height) / .78, 0, 1);
    const stacked = clamp((1.36 - width / height) / .4, 0, 1);
    const heading = Math.atan2(treeCenter[0] - shipCenter[0], treeCenter[2] - shipCenter[2]);
    const back = mix(56, 64, narrow), side = mix(-16, -5, narrow);
    const berth = [shipCenter[0] - Math.sin(heading) * back + Math.cos(heading) * side, shipCenter[1] + 7,
      shipCenter[2] - Math.cos(heading) * back - Math.sin(heading) * side];
    const arrival = .988;
    const eye = cruise(waypoint, berth, southbound, [0, 0, 0], Math.min(progress, arrival), treePass, arrival);
    const t = ease(clamp((progress - treePass) / (arrival - treePass), 0, 1));
    const aim = [treeCenter[0], treeCenter[1] - mix(24, 34, narrow) * t, treeCenter[2]];
    const view = flightView(eye, aim, aim, 0, offset(treeCenter, eye, t * .54), mix(315, 450, t), height);
    const zoom = mix(1.24, .89, narrow);
    const frameX = mix(.29, .37, narrow), frameY = mix(.43, .285 + .04 * narrow, stacked);
    view.scale *= mix(1, zoom, t);
    view.frameX = mix(.5, frameX, t);
    view.frameY = mix(.5, frameY, t);
    return view;
  }

  function atlasCamera(width, height) {
    const { yaw, elevation, zoom, target, pan } = controls;
    const view = fit(yaw, elevation, width, height);
    return camera(yaw, elevation, target || view.center, view.scale * zoom, width / 2 + pan[0], height / 2 + pan[1]);
  }

  function setDocked(value) {
    if (value === docked) return;
    docked = value;
    document.body.classList.toggle('site-flying', !value);
    scene.toggleAttribute('data-flight', !value);
    if (value) {
      scene.removeAttribute('style');
      plot.prepend(scene);
      section.style.removeProperty('--archive-reveal');
    } else document.body.append(scene);
  }

  function updateFlightMedia(opening, interactive) {
    flightMedia.style.setProperty('--video-opening', opening);
    flightMedia.inert = !interactive;
    const showLink = opening < .5 || !interactive;
    flightMedia.toggleAttribute('data-link', showLink);
    flightVideo.inert = showLink;
    if (showLink && flightVideo.hasAttribute('src')) flightVideo.removeAttribute('src');
    if (!showLink && !flightVideo.hasAttribute('src')) flightVideo.setAttribute('src', flightVideo.dataset.src);
  }

  function updateFlightCopy(progress, docking) {
    const fade = value => ease(clamp(value, 0, 1));
    approach.style.setProperty('--flight-copy-opacity', 1 - fade(docking / .35));
    updateFlightMedia(fade((progress - .922) / .060), docking < .35);
    for (const { element, start, end } of flightCues) {
      const inOpacity = start === 0 ? 1 : fade((progress - start) / .018);
      const outOpacity = end === 1 ? 1 : fade((end - progress) / .018);
      element.style.setProperty('--cue-opacity', Math.min(inOpacity, outOpacity));
    }
  }

  function drawSequence(time) {
    const viewportWidth = document.documentElement.clientWidth, viewportHeight = window.innerHeight;
    const bounds = plot.getBoundingClientRect();
    const start = viewportHeight * .92;
    const finish = clamp(bounds.top - section.getBoundingClientRect().top + 8, viewportHeight * .26, viewportHeight * .64);
    const docking = clamp((start - bounds.top) / (start - finish), 0, 1);
    if (motion.matches || docking >= 1 || viewportWidth < 1 || viewportHeight < 1) {
      updateFlightMedia(motion.matches ? 1 : 0, motion.matches);
      const changed = !docked;
      setDocked(true);
      if (changed || pendingMap) drawAtlas();
      return false;
    }
    setDocked(false);
    const approachBounds = approach.getBoundingClientRect();
    if (milestoneIndex !== currentIndex && approachBounds.bottom > viewportHeight) showMilestone(currentIndex);
    const flightEnd = Math.max(1, approach.offsetHeight - viewportHeight * 1.22);
    const target = clamp(-approachBounds.top / flightEnd, 0, 1);
    const elapsed = Math.min(time - (lastFlightFrame ?? time - 16), 40);
    lastFlightFrame = time;
    flightProgress = mix(flightProgress ?? target, target, 1 - Math.exp(-elapsed / 78));
    if (Math.abs(flightProgress - target) < .001) flightProgress = target;
    updateFlightCopy(flightProgress, docking);
    const blend = ease(docking);
    const width = Math.round(mix(viewportWidth, bounds.width, blend));
    const height = Math.round(mix(viewportHeight, bounds.height, blend));
    scene.style.left = `${mix(0, bounds.left, blend)}px`;
    scene.style.top = `${mix(0, bounds.top, blend)}px`;
    scene.style.width = `${width}px`;
    scene.style.height = `${height}px`;
    section.style.setProperty('--archive-reveal', ease(clamp((docking - .07) / .79, 0, 1)));
    const progress = mix(flightProgress, 1, blend);
    const flight = flightCamera(progress, width, height);
    const { view: from, effects } = blend ? { view: flight, effects: [] } : stoneShot(flight, progress, width, height);
    if (!blend && tavi && progress >= .60 && progress <= .91) effects.push(tavi.effect);
    const frameX = width * (from.frameX ?? .5);
    const frameY = height * (from.frameY ?? .5);
    if (!blend) {
      const view = camera(from.yaw, from.elevation, from.center, from.scale, frameX, frameY);
      view.distance = from.distance;
      view.perspective = 1;
      drawSky(atlas, view, width, height);
      atlas.renderer.draw(view, width, height, 1.12, from.focus, from.range, 1, effects);
      return flightProgress !== target;
    }
    const to = atlasCamera(width, height);
    const targetYaw = from.yaw + Math.atan2(Math.sin(controls.yaw - from.yaw), Math.cos(controls.yaw - from.yaw));
    const view = camera(mix(from.yaw, targetYaw, blend), mix(from.elevation, controls.elevation, blend),
      offset(from.center, to.center, blend), mix(from.scale, to.scale, blend),
      mix(frameX, to.x, blend), mix(frameY, to.y, blend));
    view.distance = from.distance;
    view.perspective = 1 - blend;
    drawBackdrop(view, width, height, ease(clamp((blend - .32) / .68, 0, 1)));
    atlas.renderer.draw(view, width, height, mix(1.12, .91, blend), offset(from.focus, to.center, blend),
      mix(from.range, 2000, blend), 1 - blend);
    return flightProgress !== target;
  }

  function drawAtlas() {
    const [width, height] = size(plot);
    if (width < 1 || height < 1) return;
    mapView = atlasCamera(width, height);
    const ctx = drawMapWorld(mapView, width, height);
    ctx.font = '600 11px monospace';
    const labels = [];
    hitSurfaces = [];
    const sortPriority = node => node === selected ? 0 : ['ship', 'checkpoint', 'finish', 'WorldTree'].includes(node.kind) ? 1 : 2;
    for (const node of contacts.slice().sort((a, b) => sortPriority(a) - sortPriority(b))) {
      const [x, y] = project(mapView, node.p);
      const button = markers.get(node.id);
      button.hidden = x < 10 || x > width - 10 || y < 10 || y > height - 10;
      button.style.transform = `translate(${x - 12.5}px, ${y - 12.5}px)`;
      if (node.bounds.length && pointsOf(node).some(p => {
        const [px, py] = project(mapView, p);
        return px >= 0 && px <= width && py >= 0 && py <= height;
      })) hitSurfaces.push({ node, path: hull(node.bounds.map(p => project(mapView, p))) });
      if (button.hidden || (!node.code && node.kind !== 'WorldTree' && node !== selected)) continue;
      const label = node.kind === 'WorldTree' ? 'World Tree' : node.code || node.title;
      const labelWidth = ctx.measureText(label).width;
      const lx = x + 13 + labelWidth <= width - 9 ? x + 13 : x - 13 - labelWidth;
      const ly = Math.max(12, y - 7);
      if (labels.some(box => lx < box.x + box.w + 6 && lx + labelWidth + 6 > box.x && Math.abs(ly - box.y) < 14)) continue;
      labels.push({ x: lx, y: ly, w: labelWidth });
      ctx.strokeStyle = '#10191e'; ctx.lineWidth = 3; ctx.strokeText(label, lx, ly);
      ctx.fillStyle = node.tint || (markerArt[node.kind] || fallbackArt)[1]; ctx.fillText(label, lx, ly);
    }
    hitSurfaces.sort((a, b) => dot(mapView.depth, a.node.p) - dot(mapView.depth, b.node.p));
    const [sx, sy] = project(mapView, data.spawn);
    ctx.strokeStyle = '#fff3f5'; ctx.strokeRect(sx - 3, sy - 3, 6, 6);
    if (data.blockout) {
      ctx.strokeStyle = '#10191e'; ctx.lineWidth = 3; ctx.strokeText('START', sx + 10, sy - 7);
      ctx.fillStyle = '#fff3f5'; ctx.fillText('START', sx + 10, sy - 7);
    }
    $('map-scale').textContent = `${mapView.scale > 5 ? 10 : 50} M GRID`;
  }

  function drawStudy() {
    const [width, height] = size(specimen);
    if (!study || width < 1 || height < 1) return;
    const box = span(study.bounds), center = box.center;
    const largest = Math.max(...box.hi.map((n, i) => n - box.lo[i]));
    const yaw = selected === ship ? -1.05 : selected.kind === 'finish' ? -.28 : -.45;
    const elevation = selected.veil ? .15 : selected.kind === 'star' ? .1 : .32;
    const scale = selected.veil ? Math.min(width * .76 / (box.hi[0] - box.lo[0]), height * .58 / (box.hi[1] - box.lo[1])) :
      Math.min(width * .74, height * .70) / (largest || 1);
    const view = camera(yaw, elevation, center, scale, width / 2, height * .46);
    objectRenderer.draw(view, width, height, 1.25);
  }

  function update({ map = false, fly = false, record = false } = {}) {
    pendingMap ||= map; pendingFlight ||= fly; pendingStudy ||= record;
    if (frame) return;
    frame = requestAnimationFrame(time => {
      frame = 0;
      if (!data) return;
      const flightMoving = (pendingFlight || pendingMap) && drawSequence(time);
      if (pendingStudy) drawStudy();
      pendingFlight = pendingMap = pendingStudy = false;
      if (flightMoving) update({ fly: true });
    });
  }

  function select(id, moveFocus = false) {
    const node = byId.get(id);
    if (!node || !notes[node.kind]) return;
    if (selected) markers.get(selected.id)?.setAttribute('aria-pressed', 'false');
    selected = node;
    markers.get(node.id)?.setAttribute('aria-pressed', 'true');
    picker.value = id;
    const [category, use, lore] = data.blockout ? blockoutNotes[node.kind] : notes[node.kind];
    $('record-code').textContent = node.code || `Contact ${node.id}`;
    $('record-category').textContent = category;
    $('record-title').textContent = node.title;
    $('record-function').textContent = use.replace('{unlock}', node.unlock);
    $('record-lore').textContent = lore;
    $('object-render').setAttribute('aria-label', `Isolated model render of ${node.title}`);
    const pair = byId.get(node.pair), rows = [['XYZ', `${node.p.map(p => number.format(p)).join(' / ')} m`]];
    if (node.zone) rows.push(['Sector', node.zone]);
    if (node.stage) rows.push(['Route sector', String(node.stage)]);
    if (node.dimensions) rows.push(['Size', node.dimensions.map(value => number.format(value)).join(' × ') + ' m']);
    if (node.mark) rows.push(['Pair glyph', node.mark]);
    if (pair) rows.push(['Linked gate', pair.code]);
    if (node.kind === 'blackHole' || node.kind === 'prototypeWell') {
      rows.push(['Core radius', meters(node.core)], ['Influence', meters(node.influence)], ['Surface pull', `${node.strength} m/s²`]);
    }
    if (node.kind === 'star') rows.push(['Music transition', `${node.fade} s`]);
    $('record-meta').replaceChildren(...rows.map(([term, value]) => {
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = term; dd.textContent = value; row.append(dt, dd); return row;
    }));
    $('paired').hidden = !pair;
    $('paired').disabled = !pair;
    if (pair) $('paired').textContent = `Open ${pair.code} ↗`;
    study = meshBatch(data.models, [{ ...node, p: [0, 0, 0], q: [0, 0, 0, 1] }]);
    objectRenderer.upload(study);
    $('record').hidden = false;
    $('locate').disabled = false;
    if (moveFocus) $('record-title').focus({ preventScroll: !compact.matches });
    update({ map: true, record: true });
  }

  function apply(next) {
    if (!next?.models || !next.nodes?.length || next.nodes.some(node => node.kind !== 'debris' &&
        (!notes[node.kind] || (node.kind === 'finish' ? !node.veil : !node.parts?.length)))) {
      throw new Error('Invalid atlas data');
    }
    const previous = selected?.id;
    data = next;
    byId = new Map(data.nodes.map(node => [node.id, node]));
    stoneImpact = findStoneImpact();
    contacts = data.nodes.filter(node => node.kind !== 'debris');
    terrain = data.nodes.filter(node => node.kind === 'debris' && node.bounds.length);
    ship = contacts.find(node => node.kind === 'ship' || node.kind === 'prototypeShip');
    const tree = contacts.find(node => node.kind === 'WorldTree') || ship || contacts[0];
    treeCenter = span(pointsOf(tree)).center;
    portal = contacts.find(node => node.kind === 'finish');
    route = data.prototype ? [] : [data.spawn, ...data.route.map(id => byId.get(id).p), portal.p];
    tavi = null;
    if (portal?.veil && data.flightTavi && data.models.TaviSphere) {
      // Stage Tavi beside the wall, outside both its aperture and the close orbit.
      const p = pose(-portal.dimensions[0] / 2 - 8, 1.5, -12, portal);
      const diameter = data.flightTavi.diameter * 2.1;
      const parts = [['TaviSphere', [data.flightTavi.color, '#ffedba', '#dcaa63']]];
      const batch = meshBatch(data.models, [{ p, q: portal.q, size: [diameter, diameter, diameter], parts }]);
      tavi = { p, effect: { batch, opacity: 1, gain: 1.45 } };
    }
    section.toggleAttribute('data-prototype', Boolean(data.prototype));
    section.toggleAttribute('data-blockout', Boolean(data.blockout));
    worldPoints = [...data.nodes.flatMap(pointsOf), ...(data.blockout ? [data.spawn] : [])];
    world = span(worldPoints);
    const scenery = terrain.filter(node => node.scenery).map(node => ({ ...node, parts: [node.scenery] }));
    const fallbackContacts = contacts.filter(node => data.prototype || data.blockout || node === tree || node === ship || node.veil);
    const departure = ship?.p || data.spawn;
    const sceneTerrain = atlas.renderer.gpu ? scenery : scenery.map(node => ({ node, distance: Math.min(
      Math.hypot(...node.p.map((value, i) => value - treeCenter[i])),
      Math.hypot(...node.p.map((value, i) => value - departure[i]))) }))
      .sort((a, b) => a.distance - b.distance).slice(0, 30).map(entry => entry.node);
    atlas.renderer.upload(meshBatch(data.models, atlas.renderer.gpu ? contacts : fallbackContacts), meshBatch(data.models, sceneTerrain));
    document.body.style.setProperty('--sky', data.skyColor || '#150f15');
    document.body.classList.add('has-flythrough');

    markers.clear(); $('map-markers').replaceChildren(); picker.replaceChildren();
    const groups = new Map();
    for (const node of contacts) {
      const groupName = notes[node.kind][0];
      if (!groups.has(groupName)) {
        const group = document.createElement('optgroup');
        group.label = groupName; groups.set(groupName, group); picker.append(group);
      }
      groups.get(groupName).append(new Option(displayName(node), node.id));
      const marker = document.createElement('button');
      const [glyph, color] = markerArt[node.kind] || fallbackArt;
      marker.type = 'button'; marker.className = 'marker'; marker.dataset.contact = node.id;
      marker.dataset.glyph = glyph; marker.style.setProperty('--pin', node.tint || color);
      marker.title = displayName(node); marker.setAttribute('aria-label', marker.title);
      marker.setAttribute('aria-pressed', 'false');
      markers.set(node.id, marker); $('map-markers').append(marker);
    }
    selected = null;
    picker.disabled = false; plot.dataset.ready = 'true';
    document.querySelectorAll('.projection-options button, .map-actions button').forEach(button => { button.disabled = false; });
    $('map-status').hidden = true; $('retry-map').hidden = true;
    select(byId.has(previous) && notes[byId.get(previous).kind] ? previous : (ship || byId.get(data.route[0])).id);
    update({ map: true, fly: true, record: true });
  }

  function describeMilestone(index, entry) {
    timeline.value = index;
    $('history-title').textContent = entry.title;
    $('history-note').textContent = entry.summary;
    timeline.setAttribute('aria-valuetext', entry.title);
  }

  function showMilestone(index) {
    if (index === milestoneIndex) return;
    const entry = index === currentIndex ? latest : history.milestones[index];
    const next = index === currentIndex ? currentMap : {
      ...entry.map,
      models: Object.fromEntries(Object.entries(entry.modelKeys).map(([name, key]) => [name, history.models[key]])),
    };
    Object.assign(controls, { target: null, pan: [0, 0], zoom: 1 });
    apply(next);
    milestoneIndex = index;
    describeMilestone(index, entry);
  }

  function orient(mode) {
    const presets = { orbit: [-.38, .66], top: [0, Math.PI / 2], side: [-Math.PI / 2, 0] };
    [controls.yaw, controls.elevation] = presets[mode];
    setMode(mode);
  }

  function setMode(mode) {
    controls.mode = mode;
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(mode === button.dataset.view)));
    update({ map: true });
  }

  function zoom(factor) {
    controls.zoom = clamp(controls.zoom * factor, .6, 12);
    update({ map: true });
  }

  function locate(node) {
    controls.target = span(pointsOf(node)).center;
    controls.pan = [0, 0];
    controls.zoom = 2.6;
    update({ map: true });
    plot.focus();
  }

  function inside(p, polygon) {
    return polygon.length > 2 && polygon.every((a, i) => {
      const b = polygon[(i + 1) % polygon.length];
      return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
    });
  }

  function status(message, canRetry = true) {
    $('map-status').textContent = message;
    $('map-status').hidden = false; $('retry-map').hidden = !canRetry;
    $('retry-map').disabled = !canRetry;
  }

  async function refresh() {
    if (!document.body.hasAttribute('data-live-map') || syncing) return;
    syncing = true;
    try {
      const response = await fetch('api/public-map', {
        cache: 'no-cache', headers: etag ? { 'If-None-Match': etag } : {}, signal: AbortSignal.timeout(8000),
      });
      if (response.status !== 304) {
        if (!response.ok) throw new Error('Survey unavailable');
        const updated = await response.json();
        if (milestoneIndex === currentIndex) apply(updated);
        currentMap = updated;
        etag = response.headers.get('ETag') || '';
      }
      $('map-status').hidden = true; $('retry-map').hidden = true;
    } catch {
      if (milestoneIndex === currentIndex) {
        status(data ? 'Live survey unavailable. Showing the last loaded map.' : 'Survey unavailable. Retry to reload the map.');
      }
    } finally { syncing = false; }
  }

  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => orient(button.dataset.view)));
  document.querySelectorAll('[data-turn]').forEach(button => button.addEventListener('click', () => {
    controls.yaw += Number(button.dataset.turn) * .23; setMode('orbit');
  }));
  document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => zoom(button.dataset.zoom === 'in' ? 1.24 : 1 / 1.24)));
  $('reset-map').addEventListener('click', () => { controls = resetCamera(); orient('orbit'); });
  $('drag-mode').addEventListener('click', () => {
    panMode = !panMode;
    $('drag-mode').setAttribute('aria-pressed', String(panMode));
  });
  picker.addEventListener('change', () => select(picker.value));
  timeline.addEventListener('input', () => {
    if (historyFrame) return;
    historyFrame = requestAnimationFrame(() => {
      historyFrame = 0;
      showMilestone(Number(timeline.value));
    });
  });
  $('locate').addEventListener('click', () => locate(selected));
  $('paired').addEventListener('click', () => { select(selected.pair); locate(selected); });
  $('retry-map').addEventListener('click', () => {
    if (document.body.hasAttribute('data-live-map')) refresh(); else location.reload();
  });
  plot.addEventListener('keydown', event => {
    if (event.target !== plot || !data) return;
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const direction = arrows[event.key];
    if (direction) {
      if (event.shiftKey || panMode) {
        controls.pan = controls.pan.map((coordinate, i) => coordinate + direction[i] * 36);
        update({ map: true });
      } else {
        controls.yaw += direction[0] * .13;
        controls.elevation = clamp(controls.elevation - direction[1] * .13, -1.55, 1.55);
        setMode('orbit');
      }
    } else if (['+', '=', '-', '−'].includes(event.key)) zoom(['+', '='].includes(event.key) ? 1.24 : 1 / 1.24);
    else return;
    event.preventDefault();
  });
  plot.addEventListener('pointerdown', event => {
    if (!data || !event.isPrimary || event.button !== 0 || event.target.closest('.retry')) return;
    ignoreClick = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: controls.yaw,
      elevation: controls.elevation, pan: controls.pan.slice(), panning: event.shiftKey || panMode, moved: false };
  });
  plot.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) {
      plot.setPointerCapture(event.pointerId);
      plot.dataset.dragging = 'true'; drag.moved = true;
    }
    if (drag.panning) {
      controls.pan = [drag.pan[0] + dx, drag.pan[1] + dy];
      update({ map: true });
    } else {
      controls.yaw = drag.yaw + dx * .008;
      controls.elevation = clamp(drag.elevation + dy * .006, -1.55, 1.55);
      setMode('orbit');
    }
  });
  function stopDrag(event) {
    if (drag?.id !== event.pointerId) return;
    ignoreClick = drag.moved;
    drag = null; plot.dataset.dragging = 'false';
  }
  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);
  plot.addEventListener('click', event => {
    if (!data || (ignoreClick && event.detail) || event.target.closest('.retry')) return;
    const marker = event.target.closest('[data-contact]');
    if (marker) { select(marker.dataset.contact, true); return; }
    const rect = plot.getBoundingClientRect();
    const hit = hitSurfaces.find(shape => inside([event.clientX - rect.left, event.clientY - rect.top], shape.path));
    if (hit) select(hit.node.id, true);
  });
  window.addEventListener('scroll', () => update({ fly: true }), { passive: true });
  motion.addEventListener('change', () => update({ fly: true }));
  const resize = new ResizeObserver(() => update({ map: true, fly: true, record: true }));
  for (const element of [approach, plot, specimen]) resize.observe(element);

  try {
    apply(currentMap);
    if (currentIndex) {
      timeline.max = currentIndex;
      $('history-stops').append(...[...history.milestones, latest].map((entry, index) => new Option(entry.title, index)));
      describeMilestone(currentIndex, latest);
      $('atlas-timeline').hidden = false;
    }
  }
  catch { status('The survey data could not be opened. Reload the atlas to retry.'); }
  if (document.body.hasAttribute('data-live-map')) {
    refresh(); setInterval(refresh, 5000);
  }
})();
