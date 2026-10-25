import { drawMotorRace, raceShot } from './home-motor-race.mjs?rev=20261024-directors-cut';

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };
export const MOTOR_DURATION = 12;

// A single race, never a loop. Positive gap means the MINI leads.
export function motorsportFrame(seconds) {
  const t = Math.min(MOTOR_DURATION, Math.max(0, seconds));
  const running = smooth((t - .65) / .65);
  const settling = smooth((t - 11.15) / .85);
  const shifts = [1.8, 3.35, 5.1, 6.6, 9.1];
  const gear = 1 + shifts.filter(shift => t >= shift).length;
  const sinceShift = t - (shifts[gear - 2] ?? .65);
  const rpm = 1100 + running * (3700 + 1900 * (1 - Math.exp(-Math.max(0, sinceShift) * 2.2)));
  const gap = 1.45 * Math.cos((t - 1.1) * Math.PI / 2.15) * running;
  return { t, phase: t < .65 ? 'drawing' : t < 2.5 ? 'launch' : t < 4.65 ? 'overtake'
    : t < 8 ? 'apex' : t < 10.35 ? 'tunnel' : t < 11.15 ? 'finish' : t < MOTOR_DURATION ? 'settle' : 'idle',
    gear, rpm, gap, leader: gap >= 0 ? 'mini' : 'z4', settling,
    shot: raceShot(t).id, reveal: smooth(t / .38), distance: 3 + 12 * Math.max(0, t - .65),
    idle: t >= MOTOR_DURATION };
}

export function createMotorsport(canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const styles = getComputedStyle(document.documentElement);
  const read = name => styles.getPropertyValue(name)?.trim();
  const palette = { paper: read('--paper'), black: read('--mechanical'), teal: read('--motor-teal'),
    amber: read('--motor-amber'), steel: read('--motor-steel'), silver: read('--motor-silver'),
    asphalt: read('--motor-asphalt'), mini: read('--motor-mini'), red: read('--motor-red') };
  let width = 0, height = 0, band = { top: 0, bottom: 0 };
  let active = false, raf = 0, last = 0, time = 0, exitTimer = 0;
  let input = .5;
  function paint() {
    if (!ctx || !width) return;
    if (reduced.matches) time = MOTOR_DURATION;
    const frame = motorsportFrame(time);
    canvas.dataset.phase = frame.phase;
    canvas.dataset.leader = frame.leader;
    canvas.dataset.shot = frame.shot;
    drawMotorRace(ctx, frame, width, height, band, palette, reduced.matches ? .5 : input);
    return frame;
  }
  function tick(now) {
    raf = 0;
    if (!active || document.hidden || reduced.matches || forced.matches) return;
    time += Math.min((now - last) / 1000, .05); last = now;
    const frame = paint();
    if (frame && !frame.idle) raf = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(raf); raf = 0;
    if (!active || forced.matches) return;
    const frame = paint();
    if (ctx && !document.hidden && !reduced.matches && !frame?.idle) {
      last = performance.now(); raf = requestAnimationFrame(tick);
    }
  }
  reduced.addEventListener('change', resume);
  forced.addEventListener('change', resume);
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
        time = 0;
        canvas.classList.remove('is-exiting'); canvas.classList.add('is-active');
        resume();
      } else {
        cancelAnimationFrame(raf); raf = 0;
        if (smoothExit && !reduced.matches && !forced.matches) {
          document.body.dataset.carExit = 'true'; canvas.classList.add('is-exiting');
          exitTimer = setTimeout(() => { canvas.classList.remove('is-exiting'); delete document.body.dataset.carExit; }, 380);
        } else canvas.classList.remove('is-exiting');
        canvas.classList.remove('is-active');
      }
    },
  };
}
