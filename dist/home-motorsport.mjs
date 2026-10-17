const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };
const mix = (a, b, p) => a + (b - a) * p;
export const MOTOR_DURATION = 14;
export const MOTOR_CUES = [
  { start: 0, end: 1.7, phase: 'ignition' },
  { start: 1.7, end: 4.1, phase: 'rally' },
  { start: 4.1, end: 6.6, phase: 'thermal' },
  { start: 6.6, end: 8.9, phase: 'arboreal' },
  { start: 8.9, end: 11.8, phase: 'orbit' },
  { start: 11.8, end: 14, phase: 'return' },
];
export const MOTOR_SHIFTS = [1.7, 2.5, 3.35, 5.25, 8.9, 10.25];

// One clock owns every cut, instrument, particle and vehicle. No looping climax.
export function motorsportFrame(seconds) {
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const idle = t >= MOTOR_DURATION;
  const cue = MOTOR_CUES.find(cue => t < cue.end) || MOTOR_CUES.at(-1);
  const shift = MOTOR_SHIFTS.filter(shift => t >= shift).length;
  const since = t - (MOTOR_SHIFTS[shift - 1] ?? 0);
  const rpm = idle ? 0 : t < 1.7 ? 950 + 4700 * smooth(t / 1.7)
    : Math.min(7900, 3700 + since * 4300);
  return { t, phase: idle ? 'idle' : cue.phase, cue, progress: clamp((t - cue.start) / (cue.end - cue.start)),
    gear: idle ? 'N' : shift || 'N', rpm, idle, settling: smooth((t - 12.7) / 1.3) };
}

export function createMotorsport(canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const styles = getComputedStyle(document.documentElement);
  const palette = { paper: styles.getPropertyValue('--paper').trim() || '#f5f5f3',
    black: styles.getPropertyValue('--mechanical').trim() || '#080808',
    red: '#f04432', yellow: '#f5c841', blue: '#4266d5', violet: '#7854b9', green: '#b8d85b', gray: '#969892' };
  let width = 0, height = 0, band = { top: 0, bottom: 0 };
  let active = false, raf = 0, last = 0, time = 0, exitTimer = 0, input = .5;
  let loaded = false;
  const images = {};
  function loadAssets() {
    if (loaded || typeof Image === 'undefined') return;
    loaded = true;
    for (const name of ['z4', 'mini', 'z4-night', 'mini-tree', 'mini-city', 'garage']) {
      const image = new Image(); image.decoding = 'async';
      image.onload = image.onerror = () => { if (active && !document.hidden) paint(); };
      image.src = `./assets/cars/${name}.webp`; images[name] = image;
    }
  }
  const ready = image => image?.complete && image.naturalWidth > 0;
  function line(x1, y1, x2, y2, color = palette.paper, weight = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = weight;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function circle(x, y, radius, color = palette.paper, fill = false, weight = 1) {
    ctx.beginPath(); ctx.arc(x, y, Math.max(.1, radius), 0, TAU);
    ctx.lineWidth = weight; ctx[fill ? 'fillStyle' : 'strokeStyle'] = color;
    ctx[fill ? 'fill' : 'stroke']();
  }
  function text(value, x, y, size, color = palette.paper, options = {}) {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha *= options.alpha ?? 1;
    ctx.font = `${options.italic ? 'italic ' : ''}${options.mono ? '400' : '900'} ${Math.max(8, size)}px ${options.mono ? 'Consolas, monospace' : 'Arial, sans-serif'}`;
    ctx.textAlign = options.align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y, options.maxWidth || width); ctx.restore();
  }
  function polygon(points, color) {
    ctx.fillStyle = color; ctx.beginPath();
    points.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.closePath(); ctx.fill();
  }
  function panel() {
    const pad = Math.max(18, Math.min(width * .045, 65)), top = Math.max(35, height * .07);
    return { pad, top, bottom: Math.max(top + 1, band.top - 20), h: Math.max(1, band.top - 20 - top),
      lower: band.bottom + Math.min(40, height * .045), lowerH: Math.max(1, height - band.bottom - 75), narrow: width < 700 };
  }
  function photo(name, x, y, w, h, angle = 0, alpha = 1) {
    const image = images[name]; if (!ready(image)) return;
    const ratio = image.naturalWidth / image.naturalHeight;
    const dw = Math.min(w, h * ratio), dh = dw / ratio;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(angle);
    ctx.drawImage(image, -dw / 2, -dh / 2, dw, dh); ctx.restore();
  }
  function car(name, x, y, w, angle = 0, alpha = 1) {
    const image = images[name];
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(angle);
    if (ready(image)) {
      const h = w * image.naturalHeight / image.naturalWidth;
      ctx.drawImage(image, -w / 2, -h / 2, w, h);
    } else {
      // Intentional line drawing if media is unavailable, including offline entry.
      const h = w * .25, hatch = name === 'mini';
      ctx.strokeStyle = palette.paper; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-w * .48, h * .3); ctx.lineTo(-w * .46, -h * .2);
      ctx.lineTo(-w * .3, hatch ? -h * .72 : -h * .24); ctx.lineTo(w * .12, hatch ? -h * .72 : -h * .24);
      ctx.lineTo(w * .26, -h * .22); ctx.lineTo(w * .46, -h * .08); ctx.lineTo(w * .49, h * .3); ctx.closePath(); ctx.stroke();
      for (const wheel of [-.3,.31]) circle(w * wheel, h * .3, h * .26);
      if (hatch) circle(0, 0, h * .23, palette.paper, true);
    }
    ctx.restore();
  }
  function checker(x, y, w, h, size, drift = 0, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = palette.paper;
    for (let row = -1; row < h / size + 1; row++) for (let col = -1; col < w / size + 1; col++) {
      if ((row + col) % 2 === 0) ctx.fillRect(x + col * size + drift % size, y + row * size, size + .4, size + .4);
    }
    ctx.restore();
  }
  function headline(first, second, p, color = palette.paper) {
    const size = Math.min(width * .097, p.lowerH * .39, 125);
    const maxWidth = p.narrow ? width - p.pad * 2 : width * .66;
    text(first, p.pad, p.lower + size, size, color, { italic: true, maxWidth });
    text(second, p.pad, p.lower + size * 1.95, size, color, { italic: true, maxWidth });
  }
  function speedLines(f, p, color = palette.paper) {
    ctx.save(); ctx.globalAlpha = .22;
    for (let i = 0; i < 24; i++) {
      const x = ((i * 197 - f.t * (190 + i % 5 * 80)) % (width + 500) + width + 500) % (width + 500) - 300;
      const y = p.top + p.h * ((i * .173) % 1); line(x, y, x + 40 + i % 6 * 24, y, color);
    }
    ctx.restore();
  }
  function shifter(f, x, y, size) {
    const col = size * .35, row = size * .25;
    for (const v of [-1,0,1]) line(x + col * v, y - row, x + col * v, y + row, palette.gray);
    line(x - col, y, x + col, y, palette.gray);
    ['1','3','5','2','4','6'].forEach((gear, i) => text(gear, x + (i % 3 - 1) * col, y + (i < 3 ? -row - 7 : row + 18), 11, palette.gray, { mono: true, align: 'center' }));
    const positions = [[0,0],[-1,-1],[-1,1],[0,-1],[0,1],[1,-1],[1,1]];
    const position = positions[typeof f.gear === 'number' ? f.gear : 0];
    circle(x + position[0] * col, y + position[1] * row, size * .09, palette.red, true);
  }
  function dotNumber(value, x, y, size, color = palette.paper) {
    const digits = ['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001',
      '111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
    for (const [index, digit] of [...String(value)].entries()) {
      const pattern = digits[Number(digit)];
      if (!pattern) continue;
      for (let i = 0; i < 15; i++) if (pattern[i] === '1') circle(x + index * size * 4 + i % 3 * size,
        y + Math.floor(i / 3) * size, size * .28, color, true);
    }
  }
  function tachometer(f, x, y, radius) {
    const start = Math.PI * .78, sweep = Math.PI * 1.45;
    for (let i = 0; i <= 40; i++) {
      const a = start + sweep * i / 40, end = radius + (i % 5 ? 5 : 12);
      line(x + Math.cos(a) * radius, y + Math.sin(a) * radius, x + Math.cos(a) * end, y + Math.sin(a) * end,
        i >= 33 ? palette.red : palette.gray, i % 5 ? 1 : 2);
    }
    const needle = start + sweep * f.rpm / 8500;
    line(x, y, x + Math.cos(needle) * radius * .85, y + Math.sin(needle) * radius * .85, palette.red, 2);
    circle(x, y, 4, palette.paper, true);
    text(String(Math.round(f.rpm / 100) * 100).padStart(4, '0'), x, y + radius * .65, radius * .28, palette.paper, { mono: true, align: 'center' });
  }
  function ignition(f, p) {
    const r = Math.min(width * .105, p.h * .35);
    tachometer(f, p.pad + r + 12, p.top + p.h * .52, r);
    const w = Math.min(width * (p.narrow ? .88 : .55), p.h * 2.5);
    const x = width * (p.narrow ? .5 : .61) + (1 - smooth(f.progress)) * width * .04;
    if (!p.narrow) photo('z4-night', width * .83, p.top + p.h * .43, width * .2, p.h * .9, -.09, .5);
    car('z4', x, p.top + p.h * .59, w, -.025);
    text('E85 / STRAIGHT SIX', p.pad, p.bottom - 3, 11, palette.gray, { mono: true });
    headline('KEY IN.', 'WORLD OUT.', p);
    if (!p.narrow) shifter(f, width * .81, p.lower + p.lowerH * .48, Math.min(130, p.lowerH * .5));
    for (let i = 0; i < 5; i++) circle(p.pad + 7 + i * 26, p.lower - 5, 5, f.progress > i * .17 ? palette.red : '#30322e', true);
  }
  function rally(f, p) {
    speedLines(f, p);
    const r = Math.min(p.h * .39, width * .15); circle(width * .74, p.top + p.h * .46, r, palette.yellow, true);
    checker(p.pad, p.bottom - p.h * .16, width - p.pad * 2, p.h * .16, Math.max(9, p.h * .08), -f.t * 200);
    const drift = Math.sin(f.progress * Math.PI * 2) * width * .045 + (input - .5) * width * .025;
    const carWidth = Math.min(width * .66, p.h * 2.45);
    car('mini', width * .5 + drift, p.top + p.h * .54 + Math.sin(f.t * 16) * 1.5, carWidth, -.04 + Math.sin(f.t * 3) * .02);
    headline('SMALL CAR.', 'BIG STAGE.', p);
    if (!p.narrow) {
      shifter(f, width * .76, p.lower + p.lowerH * .53, Math.min(90, p.lowerH * .4));
      dotNumber(f.gear, width * .746, p.lower + p.lowerH * .08, Math.min(9, p.lowerH * .033));
      const x = width * .9, y = p.lower + p.lowerH * .38, s = Math.min(58, p.lowerH * .23);
      // Piston Cup lightning: an original drawn wink, no film still or soundtrack.
      polygon([[x-s*.3,y-s],[x+s*.65,y-s],[x+s*.1,y],[x+s*.45,y],[x-s*.6,y+s],[x-s*.12,y]], palette.yellow);
      text('95', x, y + s * 1.65, s * .7, palette.paper, { italic: true, align: 'center' });
      text('KA-CHOW.', x, y + s * 2.05, 10, palette.gray, { mono: true, align: 'center' });
    }
    text('F55 / COOPER S / SPECIAL STAGE', p.pad, p.top + 3, 10, palette.gray, { mono: true });
  }
  function flames(f, x, y, w, h) {
    for (let i = 0; i < 32; i++) {
      const seed = i * 2.399, xx = x - w / 2 + w * i / 31;
      const pulse = .58 + .22 * Math.sin(f.t * 10 + seed) + .16 * Math.sin(f.t * 17 - seed);
      const hh = h * pulse, sway = Math.sin(f.t * 8 + seed) * w * .022;
      ctx.fillStyle = i % 3 ? palette.red : palette.yellow; ctx.beginPath(); ctx.moveTo(xx - w * .027, y);
      ctx.bezierCurveTo(xx - w * .04, y - hh * .4, xx + sway, y - hh * .55, xx + sway * .7, y - hh);
      ctx.bezierCurveTo(xx + w * .055, y - hh * .5, xx + w * .016, y - hh * .2, xx + w * .027, y); ctx.fill();
    }
  }
  function thermal(f, p) {
    const center = width * .54, cy = p.top + p.h * .57, r = Math.min(width * .23, p.h * .62);
    ctx.save(); ctx.globalAlpha = .65;
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(center, cy); ctx.rotate(.25 + i * .32 + f.progress * .35);
      ctx.strokeStyle = i === 1 ? palette.green : palette.violet; ctx.lineWidth = 2;
      ctx.strokeRect(-r * (1 + i * .13), -r * .57, r * 2 * (1 + i * .13), r * 1.14); ctx.restore();
    }
    ctx.restore();
    const w = Math.min(width * .65, p.h * 2.5);
    flames(f, center - w * .15, cy + w * .08, w * .73, Math.min(p.h * 1.4, w * .8));
    car('z4', center, cy, w, -.025 + Math.sin(f.t * 9) * .004);
    text('PATTERN: PETROL', p.pad, p.top + 5, 11, palette.green, { mono: true });
    text('AT FIELD / OFF', width - p.pad, p.bottom, 10, palette.violet, { mono: true, align: 'right' });
    headline('SOUL', 'ON FIRE.', p, palette.red);
    if (!p.narrow) {
      text('NEON', width * .73, p.lower + p.lowerH * .32, Math.min(48, p.lowerH * .2), palette.violet);
      text('GARAGE', width * .73, p.lower + p.lowerH * .54, Math.min(48, p.lowerH * .2), palette.green);
      text('NOT A MALFUNCTION.', width * .73, p.lower + p.lowerH * .76, 10, palette.gray, { mono: true });
    }
  }
  function branch(x, y, length, angle, depth) {
    if (!depth) return;
    const nx = x + Math.cos(angle) * length, ny = y + Math.sin(angle) * length;
    line(x, y, nx, ny, depth > 2 ? palette.paper : palette.green, Math.max(1, depth * .9));
    branch(nx, ny, length * .69, angle - .49, depth - 1); branch(nx, ny, length * .68, angle + .62, depth - 1);
    if (depth < 3) circle(nx, ny, depth * 2, palette.green);
  }
  function arboreal(f, p) {
    const tx = width * .6, ground = p.bottom - 5, length = Math.min(p.h * .39, width * .17);
    branch(tx, ground, length * (.88 + .12 * smooth(f.progress * 3)), -Math.PI * .5, 6);
    const w = Math.min(width * .47, p.h * 1.6);
    car('mini', tx + length * .05, ground - length * 1.78 + Math.sin(f.t * 2) * 3, w, -.16);
    if (!p.narrow) photo('mini-tree', width * .18, p.top + p.h * .48, width * .18, p.h * .83, -.075);
    headline('WRONG TURN.', 'RIGHT TREE.', p, palette.green);
    text('TRACTION: QUESTIONABLE', p.pad, p.top + 4, 10, palette.gray, { mono: true });
    if (!p.narrow) {
      line(width * .8, p.top + p.h * .22, width * .89, p.top + p.h * .14, palette.gray);
      text('PARKING LEVEL +1', width - p.pad, p.top + p.h * .12, 10, palette.paper, { mono: true, align: 'right' });
    }
  }
  function orbit(f, p) {
    const cx = width * (p.narrow ? .5 : .55), cy = p.top + p.h * .5, r = Math.min(p.h * .27, width * .13);
    // Bauhaus planets: the cars leave their gravity-bound photographic origins.
    circle(cx, cy, r, palette.red, true); polygon([[cx-r,cy+r],[cx+r,cy-r],[cx+r,cy+r]], palette.yellow);
    ctx.save(); ctx.strokeStyle = palette.gray; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.ellipse(cx, cy, r * (2.4 + i * .6), r * (.65 + i * .22), -.25 + i * .3, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < 54; i++) {
      circle(((i * .754877) % 1) * width, p.top + ((i * .618) % 1) * p.h, i % 7 ? .8 : 1.6,
        i % 9 ? palette.gray : palette.yellow, true);
    }
    const a = f.progress * Math.PI * 1.05 - .7, orbitX = Math.min(width * (p.narrow ? .23 : .29), r * 3.2), orbitY = p.h * .25;
    const carWidth = Math.min(width * (p.narrow ? .34 : .39), p.h * 1.6);
    car('z4', cx + Math.cos(a) * orbitX, cy - Math.sin(a) * orbitY, carWidth, -.32 - f.progress * .35);
    car('mini', cx - Math.cos(a) * orbitX, cy + Math.sin(a) * orbitY, carWidth * .78, .3 + f.progress * .4);
    text('GRAVITY (0)', p.pad, p.top + 4, 11, palette.paper, { mono: true });
    headline('NO ROAD', 'REQUIRED.', p);
    if (!p.narrow) {
      const x = width * .82, y = p.lower + p.lowerH * .48;
      circle(x, y, Math.min(78, p.lowerH * .29), palette.blue, true);
      for (let i = 0; i < 7; i++) line(x - 80, y + i * 9 - 27, x + 80, y + i * 9 - 27, palette.black, 3);
      text('FLY ME TO THE REDLINE.', width - p.pad, p.lower + p.lowerH * .9, 10, palette.gray, { mono: true, align: 'right' });
    }
  }
  function garage(f, p) {
    const arrival = f.idle ? 1 : smooth(f.progress * 2), spread = (1 - arrival) * width * .3;
    const w = Math.min(width * (p.narrow ? .75 : .38), p.h * 1.7);
    if (p.narrow) {
      car('z4', width * .48 - spread, p.top + p.h * .35, w);
      car('mini', width * .52 + spread, p.top + p.h * .78, w * .8);
    } else {
      photo('mini-city', width * .13, p.top + p.h * .5, width * .14, p.h * .9, -.07, .75);
      photo('z4-night', width * .87, p.top + p.h * .5, width * .14, p.h * .9, .07, .75);
      car('z4', width * .42 - spread, p.top + p.h * .37, w);
      car('mini', width * .61 + spread, p.top + p.h * .77, w * .82);
    }
    headline('TWO CARS.', 'ONE DAYDREAM.', p);
    if (!p.narrow) photo('garage', width * .83, p.lower + p.lowerH * .5, width * .19, p.lowerH * .87, -.04);
    text('E85 × F55 / HOME AGAIN', p.pad, p.top + 2, 10, palette.gray, { mono: true });
  }
  function footer(f, p) {
    const y = height - 22;
    text('E85 × F55', p.pad, y, 10, palette.gray, { mono: true });
    text(f.idle ? 'END / RE-ENTER TO REPLAY' : `${String(Math.floor(f.t)).padStart(2,'0')} / 14   ${f.phase.toUpperCase()}`,
      width - p.pad, y, 10, palette.gray, { mono: true, align: 'right' });
    line(p.pad, height - 8, width - p.pad, height - 8, '#282a27');
    line(p.pad, height - 8, mix(p.pad, width - p.pad, clamp(f.t / MOTOR_DURATION)), height - 8, palette.red, 2);
  }
  function paint(dt = 0) {
    if (!ctx || !width || !height) return;
    if (reduced.matches) time = MOTOR_DURATION; else time = Math.min(MOTOR_DURATION, time + dt);
    const f = motorsportFrame(time), p = panel(); canvas.dataset.phase = f.phase;
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = palette.black; ctx.fillRect(0, 0, width, height);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, width, Math.max(0, band.top));
    ctx.rect(0, band.bottom, width, Math.max(0, height - band.bottom)); ctx.clip();
    // Keep the homepage sentence and all its native hit targets completely clear.
    const scenes = { ignition, rally, thermal, arboreal, orbit, return: garage, idle: garage }; scenes[f.phase](f, p);
    if (!f.idle && f.t > .2 && f.progress < .065) {
      // Brief local black shutters soften the cuts, without full-page flashes.
      ctx.save(); ctx.globalAlpha = 1 - smooth(f.progress / .065); ctx.fillStyle = palette.black;
      ctx.fillRect(0, 0, width, height); ctx.restore();
    }
    footer(f, p); ctx.restore();
  }
  function tick(now) {
    raf = 0; if (!active || document.hidden || reduced.matches || !ctx) return;
    const dt = Math.min(Math.max(0, (now - last) / 1000), .05); last = now; paint(dt);
    if (time < MOTOR_DURATION) raf = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(raf); raf = 0; if (!active || !ctx) return; paint();
    if (!document.hidden && !reduced.matches && time < MOTOR_DURATION) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  reduced.addEventListener('change', resume); document.addEventListener('visibilitychange', resume);
  return {
    resize(w, h, measuredBand) {
      if (![w,h,measuredBand?.top,measuredBand?.bottom].every(Number.isFinite) || w <= 0 || h <= 0) return;
      width = w; height = h; band = { top: Math.max(0, measuredBand.top), bottom: Math.min(h, measuredBand.bottom) };
      const ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0); if (active) paint();
    },
    point(value) { if (Number.isFinite(value)) input = clamp(value); },
    setActive(next, smoothExit = false) {
      clearTimeout(exitTimer); delete document.body.dataset.carExit;
      if (next === active) { if (!next) canvas.classList.remove('is-exiting'); return; } active = next;
      if (next) {
        time = 0; input = .5; loadAssets(); canvas.classList.remove('is-exiting'); canvas.classList.add('is-active'); resume();
      } else {
        cancelAnimationFrame(raf); raf = 0;
        if (smoothExit && !reduced.matches) {
          document.body.dataset.carExit = 'true'; canvas.classList.add('is-exiting');
          exitTimer = setTimeout(() => { canvas.classList.remove('is-exiting'); delete document.body.dataset.carExit; }, 380);
        } else canvas.classList.remove('is-exiting'); canvas.classList.remove('is-active');
      }
    },
  };
}
