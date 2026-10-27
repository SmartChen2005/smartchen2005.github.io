// A separate click-only simulation. All positions and trajectories come from play.
export const GAME_TRANSITION_DURATION = 2.76;
const POINT_AT = 2.70;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function gameBoundary(width, height, time) {
  // Quadratic displacement means velocity grows linearly throughout contraction.
  const progress = clamp((time - .2) / (POINT_AT - .2), 0, 1) ** 2;
  const halfWidth = (width / 2 - 6) * (1 - progress);
  const halfHeight = (height / 2 - 6) * (1 - progress);
  return { left: width / 2 - halfWidth, right: width / 2 + halfWidth,
    top: height / 2 - halfHeight, bottom: height / 2 + halfHeight };
}

export function createCompression(snapshot) {
  const { width, height } = snapshot;
  const bodies = [
    ...snapshot.tiles.map(tile => ({ ...tile, kind: 'tile', vx: 0, vy: 0, spin: 0, mass: 2.4 })),
    ...snapshot.balls.map(ball => ({ ...ball, kind: 'ball', w: 12, h: 12, angle: 0, spin: 0, mass: 1,
      trail: ball.trail.map(point => ({ ...point })) })),
  ];
  let time = 0, boundary = gameBoundary(width, height, 0), convergence = null;
  const occupiedArea = bodies.reduce((sum, body) => sum + body.w * body.h, 0);
  const stats = { wallHits: 0, collisions: 0 };

  function extents(body, walls = boundary) {
    const c = Math.abs(Math.cos(body.angle)), s = Math.abs(Math.sin(body.angle));
    const scale = body.scale ?? 1;
    const rx = (body.kind === 'ball' ? 6 : c * body.w / 2 + s * body.h / 2) * scale;
    const ry = (body.kind === 'ball' ? 6 : s * body.w / 2 + c * body.h / 2) * scale;
    return [Math.min(rx, (walls.right - walls.left) / 2), Math.min(ry, (walls.bottom - walls.top) / 2)];
  }
  function confine(body, walls, wallVelocity, bounce = true) {
    const [rx, ry] = extents(body, walls);
    for (const [axis, radius, low, high] of [['x', rx, 'left', 'right'], ['y', ry, 'top', 'bottom']]) {
      const velocity = `v${axis}`;
      if (body[axis] < walls[low] + radius) {
        body[axis] = walls[low] + radius;
        if (bounce) { body[velocity] = Math.abs(body[velocity] - wallVelocity[low]) + wallVelocity[low]; stats.wallHits++; }
      } else if (body[axis] > walls[high] - radius) {
        body[axis] = walls[high] - radius;
        if (bounce) { body[velocity] = -Math.abs(body[velocity] - wallVelocity[high]) + wallVelocity[high]; stats.wallHits++; }
      }
      body[velocity] = clamp(body[velocity], -3800, 3800);
    }
    // Old trails are inside the same physical boundary, never left on the wall.
    for (const point of body.trail || []) {
      const px = Math.min(1, (walls.right - walls.left) / 2), py = Math.min(1, (walls.bottom - walls.top) / 2);
      point.x = clamp(point.x, walls.left + px, walls.right - px);
      point.y = clamp(point.y, walls.top + py, walls.bottom - py);
    }
  }
  function collide(a, b) {
    const [ax, ay] = extents(a), [bx, by] = extents(b);
    const dx = b.x - a.x, dy = b.y - a.y;
    const px = ax + bx - Math.abs(dx), py = ay + by - Math.abs(dy);
    if (px <= 0 || py <= 0) return;
    const horizontal = px < py, axis = horizontal ? 'x' : 'y', velocity = `v${axis}`;
    const normal = Math.sign(horizontal ? dx : dy) || 1;
    const penetration = Math.min(px, py), invA = 1 / a.mass, invB = 1 / b.mass;
    a[axis] -= normal * penetration * invA / (invA + invB);
    b[axis] += normal * penetration * invB / (invA + invB);
    const approach = (b[velocity] - a[velocity]) * normal;
    if (approach >= 0) return;
    const impulse = -1.92 * approach / (invA + invB);
    a[velocity] -= impulse * normal * invA;
    b[velocity] += impulse * normal * invB;
    a.spin = clamp(a.spin - normal * impulse * .002, -28, 28);
    b.spin = clamp(b.spin + normal * impulse * .002, -28, 28);
    a.flash = b.flash = 1;
    if (a.kind === 'tile') a.filled = !a.filled;
    if (b.kind === 'tile') b.filled = !b.filled;
    stats.collisions++;
  }
  function compress(next, dt) {
    const walls = gameBoundary(width, height, next);
    const wallVelocity = Object.fromEntries(Object.keys(walls).map(key => [key, (walls[key] - boundary[key]) / dt]));
    const area = (walls.right - walls.left) * (walls.bottom - walls.top);
    // Before rigid bodies run out of room, hand their momentum into a continuous
    // inward flow. No overlapping-body corrections or repeated flashes at the pinch.
    if (!convergence && area <= occupiedArea * 7) {
      const span = (boundary.right - boundary.left) / 2;
      const elapsed = clamp((time - .2) / (POINT_AT - .2), 0, 1);
      convergence = { started: time, span,
        rate: -(width / 2 - 6) * 2 * elapsed / (POINT_AT - .2) / span,
        origins: bodies.map(body => ({ x: body.x - width / 2, y: body.y - height / 2,
          vx: body.vx, vy: body.vy, angle: body.angle, spin: body.spin,
          trail: (body.trail || []).map(point => ({ x: point.x - width / 2, y: point.y - height / 2 })) })) };
    }
    boundary = walls;
    if (convergence) {
      const q = Math.max(0, (walls.right - walls.left) / 2 / convergence.span);
      const age = next - convergence.started;
      const drift = age * Math.exp(-age * 8) * q * q;
      bodies.forEach((body, i) => {
        const origin = convergence.origins[i];
        // Compensate boundary velocity at handoff to preserve each body's inertia.
        const dx = (origin.vx - origin.x * convergence.rate) * drift;
        const dy = (origin.vy - origin.y * convergence.rate) * drift;
        body.scale = q ** (.72 + i % 5 * .07);
        body.x = width / 2 + origin.x * q + dx;
        body.y = height / 2 + origin.y * q + dy;
        body.angle = origin.angle + origin.spin * (1 - Math.exp(-age * 8)) / 8;
        body.flash = 0;
        if (body.trail) body.trail = origin.trail.map(point => ({
          x: width / 2 + point.x * q + dx, y: height / 2 + point.y * q + dy }));
        confine(body, walls, wallVelocity, false);
      });
      return;
    }
    for (const body of bodies) {
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.angle += body.spin * dt;
      body.flash = Math.max(0, (body.flash || 0) - dt * 8);
      confine(body, walls, wallVelocity);
    }
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) collide(bodies[i], bodies[j]);
    for (const body of bodies) confine(body, walls, wallVelocity, false);
    boundary = walls;
  }
  function advance(next) {
    next = Math.max(time, Math.min(next, GAME_TRANSITION_DURATION));
    // Substeps keep fast balls from tunnelling through a moving wall.
    while (time < Math.min(next, POINT_AT) - .000001) {
      const dt = Math.min(1 / 240, Math.min(next, POINT_AT) - time);
      compress(time + dt, dt);
      time += dt;
    }
    if (next < POINT_AT && !convergence) {
      for (const body of bodies) if (body.trail) {
        body.trail.push({ x: body.x, y: body.y });
        if (body.trail.length > 14) body.trail.shift();
      }
    }
    time = next;
    return state();
  }
  function state() {
    return { time, width, height, boundary, bodies, stats, motion: convergence ? 'converge' : 'collide',
      phase: time >= POINT_AT ? 'point' : time >= 2.35 ? 'critical' : time >= .2 ? 'compress' : 'contain' };
  }
  return { advance, state };
}

export function installGameTransition(link, scenes, resetHome) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const destination = new URL(link.href, location.href);
  let frame = 0, active = false, ready = false, preview = null, canvas = null, navigating = false;
  let navigationTimer = 0;

  function prepare() {
    if (preview || reduce.matches || forced.matches || destination.origin !== location.origin) return;
    preview = document.createElement('iframe');
    preview.className = 'game-destination';
    preview.title = 'Projects page preview';
    preview.tabIndex = -1;
    preview.setAttribute('aria-hidden', 'true');
    preview.setAttribute('inert', '');
    preview.addEventListener('load', () => {
      try { ready = !!preview.contentDocument?.querySelector('#page-title'); } catch { ready = false; }
    });
    preview.src = destination.href;
    document.body.append(preview);
  }
  function navigate() {
    if (navigating) return;
    navigating = true;
    cancelAnimationFrame(frame);
    clearTimeout(navigationTimer);
    location.assign(destination.href);
  }
  function cleanup() {
    cancelAnimationFrame(frame);
    clearTimeout(navigationTimer);
    active = navigating = false;
    canvas?.remove();
    canvas = null;
    preview?.classList.remove('is-revealed');
    delete document.body.dataset.gameTransition;
    document.body.style.removeProperty('--game-inset-x');
    document.body.style.removeProperty('--game-inset-y');
    scenes.releaseGame();
    resetHome();
  }
  function play(event) {
    if (active) { event.preventDefault(); return; }
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      link.hasAttribute('download') || (link.target && link.target !== '_self') || reduce.matches || forced.matches || !ready) return;
    const element = document.createElement('canvas'), context = element.getContext('2d');
    if (!context) return;
    event.preventDefault();
    const snapshot = scenes.captureGame();
    const system = createCompression(snapshot);
    const { width, height, band } = snapshot;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas = element;
    canvas.className = 'game-collapse';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue('--ink').trim();
    active = true;
    document.body.append(canvas);
    const started = performance.now();

    function objects(state, color) {
      context.strokeStyle = context.fillStyle = color;
      context.lineWidth = 1;
      for (const body of state.bodies) {
        context.save();
        if (body.trail?.length) {
          context.globalAlpha = .22;
          context.beginPath();
          body.trail.forEach((point, i) => i ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
          context.stroke();
          context.globalAlpha = 1;
        }
        context.translate(body.x, body.y);
        context.rotate(body.angle);
        context.scale(body.scale ?? 1, body.scale ?? 1);
        if (body.kind === 'ball') {
          context.beginPath(); context.arc(0, 0, 6, 0, Math.PI * 2); context.fill();
        } else {
          if (body.filled) context.fillRect(-body.w / 2, -body.h / 2, body.w, body.h);
          else context.strokeRect(-body.w / 2, -body.h / 2, body.w, body.h);
          if (body.flash) {
            context.globalAlpha = body.flash * .45;
            context.strokeRect(-body.w / 2 - 6, -body.h / 2 - 6, body.w + 12, body.h + 12);
          }
        }
        context.restore();
      }
    }
    function draw(now) {
      const state = system.advance((now - started) / 1000);
      const { left, top, right, bottom } = state.boundary;
      document.body.dataset.gameTransition = state.phase;
      document.body.style.setProperty('--game-inset-x', `${left}px`);
      document.body.style.setProperty('--game-inset-y', `${top}px`);
      context.clearRect(0, 0, width, height);
      if (state.phase === 'point') {
        context.fillStyle = ink;
        context.beginPath(); context.arc(width / 2, height / 2, .75, 0, Math.PI * 2); context.fill();
      } else {
        context.save();
        context.beginPath(); context.rect(left, top, right - left, bottom - top); context.clip();
        if (state.phase === 'contain') {
          context.beginPath(); context.rect(0, 0, width, band.top); context.rect(0, band.bottom, width, height - band.bottom); context.clip();
        }
        objects(state, ink); context.restore();
        context.strokeStyle = ink;
        context.globalAlpha = Math.min(1, state.time / .11);
        context.lineWidth = 1;
        context.strokeRect(left, top, right - left, bottom - top);
        context.globalAlpha = 1;
      }
      if (state.time >= GAME_TRANSITION_DURATION) {
        preview.classList.add('is-revealed');
        navigate();
      }
      else frame = requestAnimationFrame(draw);
    }
    draw(started);
    // An interrupted RAF (background tab) must never strand the navigation.
    navigationTimer = setTimeout(navigate, 3100);
  }
  link.addEventListener('pointerenter', prepare);
  link.addEventListener('focus', prepare);
  link.addEventListener('click', play);
  window.addEventListener('resize', () => { if (active) navigate(); });
  window.addEventListener('pagehide', () => { if (active) cleanup(); });
  window.addEventListener('pageshow', event => { if (event.persisted) cleanup(); });
  document.addEventListener('visibilitychange', () => { if (active && document.hidden) navigate(); });
  reduce.addEventListener('change', () => { if (active && reduce.matches) navigate(); });
  // This small, same-origin, read-only page is warmed before the first click.
  prepare();
  return { get active() { return active; } };
}
