import { createMotorsport } from './home-motorsport.mjs';
import { createExhibition } from './home-exhibition.mjs';

// Canvas-only scenery. It never captures input or changes the sentence's layout.
export function createScenes(canvas, { motor: motorCanvas, exhibition: galleryRoot }) {
  const context = canvas.getContext('2d');
  const motor = createMotorsport(motorCanvas);
  const gallery = createExhibition(galleryRoot);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = getComputedStyle(document.documentElement);
  const paper = colors.getPropertyValue('--paper').trim();
  const ink = colors.getPropertyValue('--ink').trim();
  let world = '', frame = 0, last = 0, captured = false;
  let width = 0, height = 0, band = { top: 0, bottom: 0 };
  let aim = { x: .5, y: .5 }, tiles = [], balls = [];

  function seed() {
    tiles = [];
    balls = [];
    const columns = width < 600 ? 5 : 9;
    const tileWidth = Math.min(38, width / (columns * 3));
    for (const half of [0, 1]) {
      const low = half ? band.bottom + 20 : 22;
      const high = half ? height - 22 : band.top - 20;
      if (high - low < 45) continue;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < columns; col++) {
          tiles.push({ x: width * (col + 1) / (columns + 1), y: low + (high - low) * (.32 + row * .36),
            w: tileWidth, h: 13, angle: 0, flash: 0, filled: (col + row + half) % 4 === 0 });
        }
      }
      for (let i = 0; i < 3; i++) {
        balls.push({ x: width * (.18 + i * .28), y: low + (high - low) * (.12 + i * .27),
          vx: (i % 2 ? -1 : 1) * (90 + i * 28), vy: 65 + i * 17, low, high, trail: [] });
      }
    }
  }

  function resize(nextBand) {
    width = innerWidth;
    height = innerHeight;
    band = nextBand;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    seed();
    motor.resize(width, height, band);
    gallery.resize(width, height, band);
    draw(0);
  }

  function clipAwayFromSentence() {
    context.beginPath();
    context.rect(0, 0, width, Math.max(0, band.top));
    context.rect(0, band.bottom, width, Math.max(0, height - band.bottom));
    context.clip();
  }

  function game(dt) {
    const targetX = aim.x * width;
    const targetY = aim.y * height;
    for (const tile of tiles) {
      const distance = Math.hypot(tile.x - targetX, tile.y - targetY);
      const angle = Math.max(0, 1 - distance / (width * .38)) * (aim.x - .5) * 1.8;
      tile.angle += (angle - tile.angle) * Math.min(1, dt * 9);
      tile.flash = Math.max(0, tile.flash - dt * 1.8);
      context.save();
      context.translate(tile.x, tile.y);
      context.rotate(tile.angle);
      context.strokeStyle = ink;
      context.fillStyle = ink;
      context.lineWidth = 1;
      if (tile.filled) context.fillRect(-tile.w / 2, -tile.h / 2, tile.w, tile.h);
      else context.strokeRect(-tile.w / 2, -tile.h / 2, tile.w, tile.h);
      if (tile.flash) {
        context.globalAlpha = tile.flash * .45;
        context.strokeRect(-tile.w / 2 - 6, -tile.h / 2 - 6, tile.w + 12, tile.h + 12);
      }
      context.restore();
    }
    for (const ball of balls) {
      if (dt) {
        ball.vx += (aim.x - .5) * dt * 65;
        ball.vx = Math.max(-220, Math.min(220, ball.vx));
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (ball.x < 12 || ball.x > width - 12) { ball.vx *= -1; ball.x = Math.max(12, Math.min(width - 12, ball.x)); }
        if (ball.y < ball.low || ball.y > ball.high) { ball.vy *= -1; ball.y = Math.max(ball.low, Math.min(ball.high, ball.y)); }
        for (const tile of tiles) {
          if (Math.abs(ball.x - tile.x) < tile.w / 2 + 7 && Math.abs(ball.y - tile.y) < tile.h / 2 + 7) {
            ball.y = tile.y + Math.sign(ball.y - tile.y || -ball.vy) * (tile.h / 2 + 8);
            ball.vy = Math.abs(ball.vy) * Math.sign(ball.y - tile.y);
            tile.filled = !tile.filled;
            tile.flash = 1;
          }
        }
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 14) ball.trail.shift();
      }
      context.beginPath();
      ball.trail.forEach((point, i) => i ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      context.strokeStyle = '#292a2735';
      context.lineWidth = 1;
      context.stroke();
      context.beginPath();
      context.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
      context.fillStyle = ink;
      context.fill();
    }
  }

  function draw(dt) {
    if (!context || !width) return;
    context.clearRect(0, 0, width, height);
    if (world !== 'games') return;
    context.fillStyle = paper;
    context.fillRect(0, 0, width, height);
    context.save();
    clipAwayFromSentence();
    game(dt);
    context.restore();
  }

  function tick(now) {
    frame = 0;
    if (!world || document.hidden || reduce.matches) return;
    const dt = Math.min((now - last) / 1000 || 0, .034);
    last = now;
    if (world === 'games') draw(dt);
    if (world === 'games') frame = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (captured) return;
    draw(0);
    if (!reduce.matches && !document.hidden && (world === 'games')) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function setWorld(next) {
    if (captured) return;
    if (world === next) return;
    motor.setActive(next === 'cars', world === 'cars' && next === '');
    world = next;
    aim = { x: .5, y: .5 };
    start();
  }
  function point(x, y) {
    aim = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    if (world === 'cars') motor.point(aim.x);
  }
  reduce.addEventListener('change', start);
  document.addEventListener('visibilitychange', start);
  // The click sequence inherits the live state; the hover simulation is untouched.
  function captureGame() {
    setWorld('games');
    captured = true;
    cancelAnimationFrame(frame);
    frame = 0;
    return { width, height, band: { ...band },
      tiles: tiles.map(tile => ({ ...tile })),
      balls: balls.map(ball => ({ ...ball, trail: ball.trail.map(point => ({ ...point })) })) };
  }
  function releaseGame() { captured = false; world = ''; start(); }
  return { setWorld, resize, point, captureGame, releaseGame };
}
