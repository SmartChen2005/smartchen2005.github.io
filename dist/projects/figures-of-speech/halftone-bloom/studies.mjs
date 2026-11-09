import { buildGrid, paintHalftone } from './halftone.mjs';
import { studyIds, loadStudy } from './study-list.mjs';

const SOURCE_SIZE = 640;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const highContrast = matchMedia('(forced-colors: active)');

function sourceCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SOURCE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
  if (!context) throw new Error('Canvas is unavailable.');
  return { canvas, context };
}

function drawArtwork(context, source, module, grid, time, settings) {
  source.context.save();
  source.context.setTransform(1, 0, 0, 1, 0, 0);
  source.context.fillStyle = '#000';
  source.context.fillRect(0, 0, SOURCE_SIZE, SOURCE_SIZE);
  module.drawSource(source.context, time, { width: SOURCE_SIZE, height: SOURCE_SIZE, seed: 29 });
  source.context.restore();
  const pixels = source.context.getImageData(0, 0, SOURCE_SIZE, SOURCE_SIZE).data;
  return paintHalftone(context, pixels, SOURCE_SIZE, grid, time, module.meta, { ...settings, placeDot: module.placeDot });
}

async function startStudy() {
  const stage = document.querySelector('#experiment');
  const canvas = document.querySelector('#field');
  const art = document.querySelector('.art-stage');
  const context = canvas.getContext('2d', { alpha: false });
  const controls = document.querySelector('#controls');
  const status = document.querySelector('#status');
  const failure = document.querySelector('#failure');
  const retry = document.querySelector('#retry');
  const replay = document.querySelector('#replay');
  const play = document.querySelector('#play');
  const seek = document.querySelector('#seek');
  const clock = document.querySelector('#clock');
  const adjust = document.querySelector('#adjust');
  const density = document.querySelector('#density');
  const speed = document.querySelector('#speed');
  let module, source, grid, dpr = 1, size = 0, time = 0, frame = 0, lastAt = 0;
  let playing = false, ready = false, pageActive = true, pendingResize = 0, lastUI = -1;

  function updateUI(force = false) {
    if (!force && Math.abs(time - lastUI) < .1) return;
    lastUI = time;
    seek.value = String(Math.round(time / module.meta.duration * 1000));
    seek.setAttribute('aria-valuetext', `${time.toFixed(1)} of ${module.meta.duration.toFixed(1)} seconds`);
    clock.value = `${time.toFixed(1)} / ${module.meta.duration.toFixed(1)} s`;
    play.textContent = playing ? 'Pause' : 'Play';
    play.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
    stage.dataset.state = playing ? 'playing' : time >= module.meta.duration ? 'complete' : 'paused';
    canvas.dataset.time = time.toFixed(3);
  }

  function render() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, size, size);
    const count = drawArtwork(context, source, module, grid, time, { density: Number(density.value) / 100, dotSize: size < 410 ? 1.4 : 1.6, dpr });
    canvas.dataset.dots = String(count);
  }

  function stop(announcement) {
    cancelAnimationFrame(frame);
    frame = 0;
    playing = false;
    if (ready) updateUI(true);
    if (announcement) status.textContent = announcement;
  }

  function tick(now) {
    frame = 0;
    if (!playing) return;
    // Do not catch up after backgrounding or a long browser interruption.
    time = Math.min(module.meta.duration, time + Math.min(100, now - lastAt) / 1000 * Number(speed.value));
    lastAt = now;
    render();
    if (time >= module.meta.duration) {
      stop(`${module.meta.title} complete. Replay or explore the timeline.`);
    } else {
      updateUI();
      frame = requestAnimationFrame(tick);
    }
  }

  function start(fromBeginning = false) {
    if (!ready) return;
    stop();
    if (fromBeginning || time >= module.meta.duration) time = 0;
    if (reduceMotion.matches || highContrast.matches) {
      time = module.meta.posterTime;
      render(); updateUI(true);
      status.textContent = highContrast.matches ? 'High contrast mode. The decorative artwork is hidden.' : 'Reduced motion. A still composition is shown; the timeline remains available.';
      return;
    }
    if (document.hidden || !pageActive) { render(); updateUI(true); return; }
    playing = true;
    lastAt = performance.now();
    render(); updateUI(true);
    status.textContent = `${module.meta.title} playing.`;
    frame = requestAnimationFrame(tick);
  }

  function measure() {
    size = Math.max(1, art.getBoundingClientRect().width);
    dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(8000000 / (size * size)));
    canvas.width = canvas.height = Math.round(size * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    grid = buildGrid(size, size, { pitch: size < 410 ? 2.6 : 3.1 });
  }

  async function prepare() {
    retry.disabled = true;
    failure.hidden = true;
    status.textContent = 'Preparing the study.';
    try {
      if (!context) throw new Error('Canvas is unavailable.');
      module = await loadStudy(document.body.dataset.study);
      await module.prepare?.();
      source = sourceCanvas();
      measure();
      ready = true;
      controls.hidden = false;
      replay.disabled = play.disabled = seek.disabled = false;
      start(true);
    } catch (error) {
      stop();
      ready = false;
      failure.hidden = false;
      controls.hidden = true;
      status.textContent = 'The artwork could not load. Use Retry to try again.';
      console.error('Halftone study:', error);
    } finally { retry.disabled = false; }
  }

  replay.addEventListener('click', () => start(true));
  play.addEventListener('click', () => playing ? stop('Animation paused.') : start());
  retry.addEventListener('click', prepare);
  seek.addEventListener('input', () => {
    if (!ready) return;
    const requestedTime = Number(seek.value) / 1000 * module.meta.duration;
    stop('Animation paused.');
    time = requestedTime;
    render(); updateUI(true);
  });
  for (const input of [density, speed]) input.addEventListener('input', () => {
    document.querySelector(`#${input.id}-value`).value = input === density ? `${input.value}%` : `${Number(input.value).toFixed(1)}×`;
    if (ready) render();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && adjust.open) { adjust.open = false; adjust.querySelector('summary').focus(); }
    if (event.key.toLowerCase() === 'r' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey
      && !event.target.closest('input, textarea, select, [contenteditable]')) start(true);
  });
  document.addEventListener('pointerdown', event => { if (adjust.open && !adjust.contains(event.target)) adjust.open = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', () => { pageActive = false; stop(); cancelAnimationFrame(pendingResize); pendingResize = 0; });
  window.addEventListener('pageshow', () => { pageActive = true; });
  const preferenceChanged = () => {
    if (!ready || (!reduceMotion.matches && !highContrast.matches)) return;
    stop(); time = module.meta.posterTime; render(); updateUI(true);
    status.textContent = 'A still composition is shown. The timeline remains available.';
  };
  reduceMotion.addEventListener('change', preferenceChanged);
  highContrast.addEventListener('change', preferenceChanged);
  new ResizeObserver(() => {
    if (!ready || Math.abs(art.getBoundingClientRect().width - size) < 1) return;
    cancelAnimationFrame(pendingResize);
    pendingResize = requestAnimationFrame(() => { pendingResize = 0; stop(); measure(); render(); updateUI(true); });
  }).observe(art);
  await prepare();
}

async function startCollection() {
  for (const id of studyIds) {
    const canvas = document.querySelector(`[data-poster="${id}"]`);
    if (!canvas) continue;
    try {
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) continue;
      const module = await loadStudy(id);
      await module.prepare?.();
      const source = sourceCanvas();
      canvas.width = 720; canvas.height = 520;
      context.fillStyle = '#000'; context.fillRect(0, 0, 720, 520);
      // Source is square; preserve its complete composition inside each plate.
      const extent = id === 'exposure' ? 650 : 500;
      context.save(); context.translate((720 - extent) / 2, (520 - extent) / 2);
      drawArtwork(context, source, module, buildGrid(extent, extent, { pitch: 2.5 }), module.meta.posterTime, { density: 1.1, dotSize: 1.8, dpr: 1 });
      context.restore();
      canvas.dataset.ready = 'true';
    } catch (error) {
      console.warn(`Halftone preview ${id}:`, error.message);
    }
  }
}

if (document.body.dataset.study) startStudy();
else startCollection();
