import { createField, distanceToInk, gridFor } from './field.mjs';

const stage = document.querySelector('#experiment');
const canvas = document.querySelector('#field');
const context = canvas.getContext('2d', { alpha: false });
const word = document.querySelector('#word');
const baseline = document.querySelector('#baseline');
const controls = document.querySelector('#controls');
const count = document.querySelector('#count');
const status = document.querySelector('#status');
const replay = document.querySelector('#replay');
const adjust = document.querySelector('#adjust');
const inputs = ['density', 'size', 'speed'].map(id => document.getElementById(id));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const forcedColors = matchMedia('(forced-colors: active)');
const number = new Intl.NumberFormat('en-US');
const duration = 2200;
let width = 0, height = 0, dpr = 1;
let points = [], drawn = 0, frame = 0, rebuildFrame = 0, startedAt = 0, lastCountAt = 0;
let distances, pitch, dotSize, running = false;

function settings() {
  return { density: Number(inputs[0].value) / 100, size: Number(inputs[1].value), speed: Number(inputs[2].value) };
}

function updateLabels() {
  const { density, size, speed } = settings();
  document.querySelector('#density-value').value = `${Math.round(density * 100)}%`;
  document.querySelector('#size-value').value = `${size} px`;
  document.querySelector('#speed-value').value = `${speed.toFixed(1)}×`;
}

function updateCount() {
  count.value = `${number.format(drawn)} dots`;
  canvas.dataset.drawn = String(drawn);
}

function drawUntil(progress) {
  while (drawn < points.length && points[drawn].birth <= progress) {
    const point = points[drawn++];
    // Snap both position and extent to physical pixels: no fuzzy gray dot edges.
    context.fillRect(Math.round((point.x - dotSize / 2) * dpr) / dpr,
      Math.round((point.y - dotSize / 2) * dpr) / dpr, dotSize, dotSize);
  }
}

function settle() {
  cancelAnimationFrame(frame);
  frame = 0;
  drawUntil(1);
  updateCount();
  running = false;
  stage.dataset.state = 'settled';
  status.textContent = forcedColors.matches ? 'High contrast mode. Decorative particles are hidden.'
    : `Bloom complete. ${number.format(points.length)} white dots. Replay is available.`;
}

function tick(now) {
  frame = 0;
  const progress = Math.min(1, (now - startedAt) / (duration / settings().speed));
  drawUntil(progress);
  if (now - lastCountAt > 100) {
    updateCount();
    lastCountAt = now;
  }
  if (progress < 1 && !document.hidden) frame = requestAnimationFrame(tick);
  else settle();
}

function start() {
  cancelAnimationFrame(frame);
  frame = 0;
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#fff';
  drawn = 0;
  updateCount();
  if (reducedMotion.matches || forcedColors.matches || document.hidden) {
    settle();
    return;
  }
  running = true;
  stage.dataset.state = 'blooming';
  status.textContent = 'Particle field blooming.';
  startedAt = performance.now();
  lastCountAt = startedAt;
  frame = requestAnimationFrame(tick);
}

function rebuildField(animate) {
  const config = settings();
  points = createField({ width, height, distances, density: config.density, size: config.size }).points;
  dotSize = Math.max(1, Math.round(config.size * dpr)) / dpr;
  canvas.dataset.total = String(points.length);
  start();
  if (!animate) settle();
}

function measure() {
  cancelAnimationFrame(frame);
  frame = 0;
  const bounds = stage.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  // Bound the backing store to ~8M pixels on very large/retina screens.
  dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(8000000 / (width * height)));
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  const grid = gridFor(width, height);
  pitch = grid.pitch;
  const mask = document.createElement('canvas');
  mask.width = grid.columns;
  mask.height = grid.rows;
  const maskContext = mask.getContext('2d', { willReadFrequently: true });
  const style = getComputedStyle(word);
  const wordBounds = word.getBoundingClientRect();
  const baselineY = baseline.getBoundingClientRect().top - bounds.top;
  maskContext.scale(1 / pitch, 1 / pitch);
  maskContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  maskContext.letterSpacing = style.letterSpacing;
  maskContext.textBaseline = 'alphabetic';
  maskContext.fillStyle = '#fff';
  maskContext.fillText(word.textContent, wordBounds.left - bounds.left, baselineY);
  const pixels = maskContext.getImageData(0, 0, grid.columns, grid.rows).data;
  const ink = new Uint8Array(grid.columns * grid.rows);
  for (let i = 0; i < ink.length; i++) ink[i] = pixels[i * 4 + 3] > 24 ? 1 : 0;
  distances = distanceToInk(ink, grid.columns, grid.rows, pitch);
}

function escapePanel(event) {
  if (event.key === 'Escape' && adjust.open) {
    adjust.open = false;
    adjust.querySelector('summary').focus();
  }
  if (event.key.toLowerCase() === 'r' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey
    && !event.target.closest('input, textarea, select, [contenteditable]')) start();
}

if (context) {
  try {
    measure();
    updateLabels();
    controls.hidden = false;
    rebuildField(true);
    replay.addEventListener('click', start);
    replay.disabled = false;
    for (const input of inputs) {
      input.addEventListener('input', () => {
        updateLabels();
        // Coalesce continuous native slider events into one rebuild per frame.
        cancelAnimationFrame(rebuildFrame);
        rebuildFrame = requestAnimationFrame(() => { rebuildFrame = 0; rebuildField(true); });
      });
    }
    document.addEventListener('keydown', escapePanel);
    document.addEventListener('pointerdown', event => {
      if (adjust.open && !adjust.contains(event.target)) adjust.open = false;
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && running) settle(); });
    const preferenceChanged = () => {
      if (reducedMotion.matches || forcedColors.matches) settle();
    };
    reducedMotion.addEventListener('change', preferenceChanged);
    forcedColors.addEventListener('change', preferenceChanged);
    new ResizeObserver(() => {
      const bounds = stage.getBoundingClientRect();
      if (Math.abs(bounds.width - width) < 1 && Math.abs(bounds.height - height) < 1) return;
      cancelAnimationFrame(rebuildFrame);
      rebuildFrame = requestAnimationFrame(() => { rebuildFrame = 0; measure(); rebuildField(false); });
    }).observe(stage);
    window.addEventListener('pagehide', () => {
      cancelAnimationFrame(rebuildFrame);
      rebuildFrame = 0;
      if (running) settle();
    });
  } catch (error) {
    cancelAnimationFrame(frame);
    controls.hidden = true;
    status.className = 'fallback';
    status.textContent = 'The particle field could not start. Reload to try again.';
    console.error('Halftone bloom:', error);
  }
} else {
  status.className = 'fallback';
  status.textContent = 'This browser cannot draw the particle field.';
}
