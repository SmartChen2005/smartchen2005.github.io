const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };
export const MOTOR_DURATION = 4.6;

// Seconds on a single, deterministic timeline. Hover does not loop the launch.
export function motorsportFrame(seconds) {
  const t = Math.max(0, seconds);
  const phase = t < .7 ? 'ignition' : t < 1.15 ? 'build' : t < 1.85 ? 'launch'
    : t < 2.65 ? 'shift' : t < 3.45 ? 'redline' : t < 4.1 ? 'finish' : t < MOTOR_DURATION ? 'settle' : 'idle';
  const gear = t < 1.15 ? 0 : t < 2.05 ? 1 : t < 2.65 ? 2 : t < 3.2 ? 3 : 4;
  const drops = [2.05, 2.65, 3.2].reduce((sum, shift) => sum + (t >= shift ? 2500 * Math.exp(-(t - shift) * 8) : 0), 0);
  const rpm = t < .7 ? 1200 + t * 2200 : t < MOTOR_DURATION
    ? 2600 + 6600 * smooth((t - .7) / .7) - drops : 5600;
  const settling = smooth((t - 4.1) / .5);
  return { t, phase, gear, rpm, settling, idle: t >= MOTOR_DURATION,
    rotationSpeed: t < 1.15 ? 1 + t * 4 : (16 + 24 * smooth((t - 1.15) / 1.8)) * (1 - settling) + 1.8 * settling };
}

export function createMotorsport(canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const styles = getComputedStyle(document.documentElement);
  const paper = styles.getPropertyValue('--paper').trim();
  const black = styles.getPropertyValue('--mechanical').trim();
  const red = '#f04432';
  let width = 0, height = 0, band = { top: 0, bottom: 0 };
  let active = false, raf = 0, last = 0, time = 0, angle = 0, travel = 0, exitTimer = 0;
  let input = .5;

  function line(x1, y1, x2, y2, color = paper, weight = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = weight;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function arc(x, y, radius, start, end, color, weight = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = weight;
    ctx.beginPath(); ctx.arc(x, y, Math.max(1, radius), start, end); ctx.stroke();
  }
  function type(text, x, y, size, alpha = 1, italic = false) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = paper;
    ctx.font = `${italic ? 'italic ' : ''}700 ${Math.max(10, size)}px Arial, sans-serif`;
    ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x, y); ctx.restore();
  }

  function wheel(frame) {
    const burst = smooth((frame.t - 1.15) / .75) * (1 - frame.settling);
    const radius = Math.min(width * (.32 + burst * .055), height * .58);
    const cx = width * (.69 + burst * .035), cy = height * .5;
    const intensity = frame.idle ? .28 : .85 - frame.settling * .55;
    ctx.save(); ctx.globalAlpha = intensity;
    arc(cx, cy, radius, 0, TAU, paper, 2);
    arc(cx, cy, radius * .94, 0, TAU, paper);
    arc(cx, cy, radius * .29, 0, TAU, paper);
    arc(cx, cy, radius * .21, 0, TAU, paper, 2);
    // Temporal spoke samples become a continuous mechanical blur as RPM rises.
    const samples = frame.idle || reduced.matches ? 1 : 7;
    for (let sample = 0; sample < samples; sample++) {
      ctx.globalAlpha = intensity * (samples === 1 ? .6 : .16);
      const rotation = angle - sample * frame.rotationSpeed * .006;
      for (let spoke = 0; spoke < 12; spoke++) {
        const a = spoke * TAU / 12 + rotation;
        line(cx + Math.cos(a) * radius * .29, cy + Math.sin(a) * radius * .29,
          cx + Math.cos(a + .13) * radius * .92, cy + Math.sin(a + .13) * radius * .92, paper, spoke % 3 ? 1 : 4);
      }
    }
    ctx.globalAlpha = intensity;
    // An oversized tachometer shares the wheel's geometry, then recedes at idle.
    if (!frame.idle && frame.settling < 1) {
      const start = Math.PI * .79, sweep = Math.PI * 1.43;
      for (let tick = 0; tick <= 44; tick++) {
        const a = start + sweep * tick / 44;
        const r = radius * 1.09;
        const length = tick % 4 ? 7 : 19;
        line(cx + Math.cos(a) * r, cy + Math.sin(a) * r,
          cx + Math.cos(a) * (r + length), cy + Math.sin(a) * (r + length), tick >= 36 ? red : paper, tick % 4 ? 1 : 2);
      }
      const sweepEnd = start + sweep * Math.min(frame.rpm / 10000, 1);
      arc(cx, cy, radius * 1.05, start, sweepEnd, frame.rpm > 8500 ? red : paper, 5);
      line(cx + Math.cos(sweepEnd) * radius * .98, cy + Math.sin(sweepEnd) * radius * .98,
        cx + Math.cos(sweepEnd) * radius * 1.14, cy + Math.sin(sweepEnd) * radius * 1.14, red, 3);
    }
    ctx.restore();
  }

  function track(frame) {
    const intensity = frame.idle ? .13 : .48 * smooth((frame.t - 1.15) / .5) * (1 - frame.settling * .7);
    if (!intensity) return;
    ctx.save(); ctx.globalAlpha = intensity;
    const vanishing = width * .48;
    const bottom = Math.max(1, height - band.bottom);
    // Starting-grid boxes and dashed track marks accelerate out of the frame.
    for (let stripe = 0; stripe < 12; stripe++) {
      const z = ((stripe / 12 + travel * .17) % 1);
      const perspective = z * z;
      const y = band.bottom + bottom * perspective;
      const half = width * (.035 + perspective * .39);
      const depth = 4 + perspective * 20;
      line(vanishing - half, y, vanishing - half - depth, y + depth, paper, 1 + perspective);
      line(vanishing + half, y, vanishing + half + depth, y + depth, paper, 1 + perspective);
      if (stripe % 2 === 0) {
        line(vanishing - half, y, vanishing - half + half * .22, y, paper, 2);
        line(vanishing + half, y, vanishing + half - half * .22, y, paper, 2);
      }
    }
    // The racing line bends through the lower field, rather than reading as a HUD.
    ctx.strokeStyle = paper; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(vanishing, band.bottom + 8);
    ctx.bezierCurveTo(width * .16, height * .73, width * .74, height * .87, width * .2, height + 50);
    ctx.stroke();
    ctx.restore();
    const rays = frame.idle ? 12 : 36;
    for (let i = 0; i < rays; i++) {
      const y = height * (i + .35) / rays;
      const total = width + 700;
      const x = ((i * 197 - travel * (330 + (i % 5) * 70)) % total + total) % total - 350;
      const length = frame.idle ? 36 + i % 5 * 20 : 60 + frame.rpm / 28 + i % 4 * 30;
      ctx.save(); ctx.globalAlpha = frame.idle ? .1 : .16 + (i % 4) * .05;
      line(x, y, x + length, y - (frame.idle ? 0 : 6)); ctx.restore();
    }
  }

  function lettering(frame) {
    if (frame.idle) return;
    const alpha = 1 - frame.settling;
    const left = width * .075, upper = Math.max(30, band.top * .7);
    const size = Math.min(width * .15, band.top * .55);
    if (frame.t < 1.15) {
      // Five lamps load in one direction; lights-out is one clean event.
      const unit = Math.min(width * .027, 24);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.arc(left + i * unit * 2.9 + unit, height * .13, unit * .72, 0, TAU);
        ctx.fillStyle = frame.t > i * .135 ? red : '#373b37'; ctx.fill();
      }
      type(String(Math.round(frame.rpm / 100) * 100).padStart(4, '0'), left, upper, size * .66, alpha);
      type('RPM', left + 2, upper + 25, 11, .55 * alpha);
    } else {
      const shifts = [1.15, 2.05, 2.65, 3.2];
      const sinceShift = frame.t - shifts[frame.gear - 1];
      const kick = Math.exp(-Math.max(0, sinceShift) * 13) * size * .25;
      type(String(frame.gear).padStart(2, '0'), left - kick * .2, upper + kick, size, alpha, true);
      type('GEAR', left + 2, upper + 25, 11, .55 * alpha);
    }
    const words = { ignition: 'IGNITION', build: 'LIGHTS OUT', launch: 'LAUNCH', shift: 'SHIFT', redline: 'REDLINE', finish: 'FLAT OUT', settle: 'FLAT OUT' };
    const launchTravel = frame.phase === 'launch' ? smooth((frame.t - 1.15) / .7) * width * .14 : 0;
    type(words[frame.phase] || '', left + launchTravel, height * .9,
      Math.min(width * .082, (height - band.bottom) * .3), alpha * .9, true);
  }

  function finish(frame) {
    if (frame.t < 3.45 || frame.t > 4.15) return;
    const progress = (frame.t - 3.45) / .7;
    const size = Math.max(18, Math.min(width * .026, 40));
    const x = -size * 7 + (width + size * 14) * progress;
    ctx.save();
    ctx.translate(x, 0); ctx.transform(1, 0, -.24, 1, 0, 0);
    // A narrow chequered ribbon sweeps once through the whole composition.
    for (let row = -1; row < height / size + 2; row++) {
      const wave = Math.sin(row * .32 - progress * Math.PI * 2) * size * .35;
      for (let col = 0; col < 6; col++) {
        if ((row + col) % 2 === 0) { ctx.fillStyle = paper; ctx.fillRect(col * size + wave, row * size, size + .3, size + .3); }
      }
    }
    ctx.restore();
  }

  function paint(dt = 0) {
    if (!ctx || !width) return;
    if (reduced.matches) time = MOTOR_DURATION;
    else time += dt;
    const frame = motorsportFrame(time);
    angle += dt * frame.rotationSpeed * (.85 + input * .3);
    travel += dt * (frame.idle ? .32 : frame.rotationSpeed * .21);
    canvas.dataset.phase = frame.phase;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = black; ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, width, Math.max(0, band.top));
    ctx.rect(0, band.bottom, width, Math.max(0, height - band.bottom)); ctx.clip();
    // Vibration is confined to the machine, never the sentence or its hit targets.
    if (!reduced.matches && frame.phase === 'redline') ctx.translate(Math.sin(time * 47) * 1.3, Math.sin(time * 61) * .7);
    track(frame); wheel(frame); lettering(frame); finish(frame);
    ctx.restore();
  }
  function tick(now) {
    raf = 0;
    if (!active || document.hidden || reduced.matches) return;
    const dt = Math.min((now - last) / 1000, .05); last = now;
    paint(dt); raf = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(raf); raf = 0;
    if (!active) return;
    paint();
    if (!document.hidden && !reduced.matches) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  reduced.addEventListener('change', resume);
  document.addEventListener('visibilitychange', resume);
  return {
    resize(w, h, measuredBand) {
      width = w; height = h; band = measuredBand;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (active) paint();
    },
    point(value) { input = clamp(value); },
    setActive(next, smoothExit = false) {
      clearTimeout(exitTimer); delete document.body.dataset.carExit;
      if (next === active) {
        if (!next) canvas.classList.remove('is-exiting');
        return;
      }
      active = next;
      if (next) {
        time = 0; angle = 0; travel = 0;
        canvas.classList.remove('is-exiting'); canvas.classList.add('is-active');
        resume();
      } else {
        cancelAnimationFrame(raf); raf = 0;
        if (smoothExit && !reduced.matches) {
          document.body.dataset.carExit = 'true'; canvas.classList.add('is-exiting');
          exitTimer = setTimeout(() => { canvas.classList.remove('is-exiting'); delete document.body.dataset.carExit; }, 380);
        } else canvas.classList.remove('is-exiting');
        canvas.classList.remove('is-active');
      }
    },
  };
}
