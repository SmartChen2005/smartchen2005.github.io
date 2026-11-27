const root = document.documentElement;
const stage = document.querySelector('[data-exhibition]');
const canvas = stage.querySelector('canvas');
const vignette = stage.querySelector('[data-exhibition-vignette]');
const track = document.querySelector('[data-exhibition-track]');
const toggle = document.querySelector('[data-vr-toggle]');
const navigation = document.querySelector('[data-exhibition-navigation]');
const next = navigation.querySelector('[data-exhibition-next]');
const chapters = navigation.querySelector('details');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)');
const exhibits = new Map([...document.querySelectorAll('[data-exhibit]')].map(panel => [panel.dataset.exhibit, panel]));
const covers = [...document.querySelectorAll('[data-exhibit-cover]')];

const dwellStart = .32;
const dwellEnd = .70;
const entranceStart = .035;
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const range = (value, start, end) => clamp((value - start) / (end - start));
const smooth = value => value * value * (3 - 2 * value);
const mix = (a, b, t) => a.map((value, i) => value + (b[i] - value) * t);
const blendPose = (a, b, t) => ({ eye: mix(a.eye, b.eye, t), target: mix(a.target, b.target, t) });
const chapterName = id => id.replace(/-study$/, '');

let scene, loading, stops, bands;
let active = false;
let activePanel, visiblePanel;
let frame = 0, lastTime = 0, progress = 0, strength = 0;
let previousPose, bandHeight, maximum, panels = new Map();

function poseAt(index, fraction) {
  const stop = stops[index];
  const view = panels.get(stop.id)?.view ?? stop.view;
  if (index === 0 && fraction < .86) {
    return blendPose(view, stop.departure, smooth(range(fraction, entranceStart, .86)));
  }
  if (fraction >= dwellStart && fraction <= dwellEnd) return view;
  if (index === stops.length - 1 && fraction >= dwellEnd) return view;
  if (fraction < dwellStart) {
    const previous = stops[index - 1];
    const boundary = blendPose(previous.departure, stop.approach, .5);
    if (fraction < .14) return blendPose(boundary, stop.approach, smooth(range(fraction, 0, .14)));
    return blendPose(stop.approach, view, smooth(range(fraction, .14, dwellStart)));
  }
  if (fraction < .86) return blendPose(view, stop.departure, smooth(range(fraction, dwellEnd, .86)));
  const following = stops[index + 1];
  const boundary = blendPose(stop.departure, following.approach, .5);
  return blendPose(stop.departure, boundary, smooth(range(fraction, .86, 1)));
}

function corners(panel, width, height) {
  return [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([horizontal, vertical]) =>
    scene.project(panel.center.map((value, axis) =>
      value + panel.right[axis] * horizontal * width / 2 + (axis === 1 ? vertical * height / 2 : 0))));
}

function sizePanels() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  scene.resize(width, height);
  bandHeight = bands[0].offsetHeight;
  maximum = Math.max(0, (track.offsetHeight - innerHeight) / bandHeight);
  panels = new Map();
  for (const stop of stops) {
    if (!stop.panel) continue;
    const panel = exhibits.get(stop.id);
    // Portrait screens approach the wall more closely so that text and video
    // remain legible while the same room geometry surrounds the exhibit.
    const proximity = (1 - smooth(range(width, 420, 750))) * (stop.panel.portraitProximity ?? .59);
    const eye = mix(stop.view.eye, stop.view.target, proximity);
    eye[1] = stop.view.eye[1];
    const view = { eye, target: stop.view.target };
    scene.setPose(view);
    const center = scene.project(stop.panel.center);
    const quad = corners(stop.panel, stop.panel.width, stop.panel.height);
    const xs = quad.map(point => point.x);
    const ys = quad.map(point => point.y);
    const halfWidth = Math.max(center.x - Math.min(...xs), Math.max(...xs) - center.x);
    const halfHeight = Math.max(center.y - Math.min(...ys), Math.max(...ys) - center.y);
    const horizontal = Math.min(center.x - 12, width - center.x - 12, 465);
    const vertical = Math.min(center.y - 70, height - center.y - 66, 320);
    const physicalWidth = stop.panel.width * clamp(horizontal / halfWidth, .12, 1);
    const physicalHeight = stop.panel.height * clamp(vertical / halfHeight, .12, 1);
    const fitted = corners(stop.panel, physicalWidth, physicalHeight);
    const logicalWidth = Math.round(Math.hypot(fitted[1].x - fitted[0].x, fitted[1].y - fitted[0].y));
    const logicalHeight = Math.round(Math.hypot(fitted[3].x - fitted[0].x, fitted[3].y - fitted[0].y));
    panel.style.setProperty('--wall-width', `${logicalWidth}px`);
    panel.style.setProperty('--wall-height', `${logicalHeight}px`);
    panels.set(stop.id, { view, physicalWidth, physicalHeight, logicalWidth, logicalHeight });
  }
}

// Map the live HTML rectangle to the four projected corners of a real 3D wall.
// The perspective terms let native links and iframes retain their hit targets.
function wallTransform([a, b, c, d], width, height) {
  const dx1 = b.x - c.x, dx2 = d.x - c.x, dx3 = a.x - b.x + c.x - d.x;
  const dy1 = b.y - c.y, dy2 = d.y - c.y, dy3 = a.y - b.y + c.y - d.y;
  const determinant = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(determinant) < .001) return '';
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  const xRow = [(b.x - a.x + g * b.x) / width, (d.x - a.x + h * d.x) / height];
  const yRow = [(b.y - a.y + g * b.y) / width, (d.y - a.y + h * d.y) / height];
  return `matrix3d(${xRow[0]},${yRow[0]},0,${g / width},${xRow[1]},${yRow[1]},0,${h / height},0,0,1,0,${a.x},${a.y},0,1)`;
}

function drawPanel(stop, fraction) {
  const panel = exhibits.get(stop.id);
  const start = stop.id === 'entrance' ? 0 : .21;
  const leave = stop.id === 'entrance' ? .09 : dwellEnd;
  const end = stop.id === 'exit' ? 1 : stop.id === 'entrance' ? .29 : .82;
  const opacity = (start ? smooth(range(fraction, start, dwellStart)) : 1)
    * (end < 1 ? 1 - smooth(range(fraction, leave, end)) : 1);
  let visible = opacity > .01;
  const dimensions = panels.get(stop.id);
  if (visible && dimensions) {
    const { physicalWidth, physicalHeight, logicalWidth, logicalHeight } = dimensions;
    const quad = corners(stop.panel, physicalWidth, physicalHeight);
    const transform = quad.every(point => point.z > .05) && wallTransform(quad, logicalWidth, logicalHeight);
    visible = Boolean(transform);
    if (transform) panel.style.transform = transform;
  }
  if (visiblePanel && (!visible || visiblePanel !== panel)) visiblePanel.removeAttribute('data-exhibit-visible');
  visiblePanel = visible ? panel : null;
  if (visible) {
    panel.style.setProperty('--exhibit-opacity', opacity.toFixed(3));
    panel.setAttribute('data-exhibit-visible', '');
  }
  const usable = visible && opacity > .94;
  if (activePanel !== (usable ? panel : null)) {
    if (activePanel) {
      if (activePanel.contains(document.activeElement)) next.focus({ preventScroll: true });
      activePanel.inert = true;
      activePanel.removeAttribute('data-exhibit-active');
    }
    activePanel = usable ? panel : null;
    if (activePanel) {
      activePanel.inert = false;
      activePanel.setAttribute('data-exhibit-active', '');
    }
  }
}

function updateControls(index) {
  const id = stops[index].id;
  track.dataset.exhibitionId = id;
  const href = `#${id === 'entrance' ? 'main' : chapterName(id)}`;
  chapters.querySelectorAll('a').forEach(link => {
    if (link.hash === href) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  next.firstChild.data = index < stops.length - 1 ? 'Next exhibit ' : 'Back to entrance ';
  next.lastElementChild.textContent = index < stops.length - 1 ? '↓' : '↑';
}

function draw(time, immediate = false) {
  frame = 0;
  if (!active) return;
  const dt = lastTime ? clamp(time - lastTime, 5, 50) : 16;
  lastTime = time;
  const target = clamp(scrollY / bandHeight, 0, maximum);
  progress = immediate ? target : progress + (target - progress) * (1 - Math.exp(-dt / 84));
  if (Math.abs(progress - target) < .0005) progress = target;
  const index = Math.min(Math.floor(progress), stops.length - 1);
  const fraction = progress - index;
  const stop = stops[index];
  const pose = poseAt(index, fraction);
  let amount = 0;
  if (previousPose && !immediate) {
    const linear = Math.hypot(...pose.eye.map((value, i) => value - previousPose.eye[i])) / dt * 1000;
    const yaw = ({ eye, target: gaze }) => Math.atan2(gaze[0] - eye[0], gaze[2] - eye[2]);
    const turn = yaw(pose) - yaw(previousPose);
    const angular = Math.abs(Math.atan2(Math.sin(turn), Math.cos(turn))) / dt * 1000;
    amount = clamp(linear * .09 + angular * .17, 0, .72);
  }
  strength = immediate ? 0 : strength + (amount - strength) * (1 - Math.exp(-dt / (amount > strength ? 90 : 135)));
  if (strength < .008) strength = 0;
  vignette.style.opacity = strength.toFixed(3);
  if (immediate || !previousPose || pose.eye.some((value, i) => value !== previousPose.eye[i])
      || pose.target.some((value, i) => value !== previousPose.target[i])) scene.render(pose);
  previousPose = pose;
  drawPanel(stop, fraction);
  if (track.dataset.exhibitionId !== stop.id) updateControls(index);
  track.dataset.exhibitionPosition = progress.toFixed(4);

  if (stop.id.endsWith('-study')) {
    const panel = exhibits.get(stop.id);
    const value = range(fraction, dwellStart, dwellEnd);
    if (panel.exhibitionProgress !== value) {
      panel.exhibitionProgress = value;
      panel.dispatchEvent(new CustomEvent('exhibition-study-progress', { detail: value }));
    }
  }
  if (progress !== target || strength || amount) queue();
  else lastTime = 0;
}

function queue() {
  if (active && !frame && !document.hidden) frame = requestAnimationFrame(draw);
}

function readingChapter() {
  if (active) return chapterName(stops[Math.floor(progress)]?.id ?? 'entrance');
  const sections = [...document.querySelectorAll('main > .assignment')];
  return sections.findLast(section => section.getBoundingClientRect().top <= innerHeight * .35)?.id ?? 'entrance';
}

function requestedChapter() {
  const id = location.hash.slice(1);
  return exhibits.has(id) ? id : 'entrance';
}

function scrollToStop(id, immediate = false) {
  const index = stops.findIndex(stop => stop.id === id);
  if (index < 0) return;
  scrollTo({ top: index === 0 ? 0 : (index + .50) * bandHeight, behavior: 'instant' });
  if (immediate) {
    cancelAnimationFrame(frame);
    draw(performance.now(), true);
  } else queue();
}

function setMode(mode, id) {
  active = mode === 'exhibition';
  root.dataset.vrMode = mode;
  toggle.textContent = active ? 'Reading view' : 'Enter exhibition';
  stage.hidden = track.hidden = navigation.hidden = !active;
  for (const cover of covers) {
    const id = cover.dataset.exhibitCover;
    if (active) exhibits.get(id).prepend(cover);
    else (exhibits.get(`${id}-study`) ?? exhibits.get(id)).before(cover);
  }
  for (const panel of exhibits.values()) {
    panel.inert = active;
    panel.removeAttribute('data-exhibit-active');
    panel.removeAttribute('data-exhibit-visible');
  }
  activePanel = visiblePanel = null;
  previousPose = null;
  lastTime = 0;
  if (active) {
    sizePanels();
    scrollToStop(id, true);
  } else {
    cancelAnimationFrame(frame);
    frame = 0;
    const section = id === 'exit' ? exhibits.get(id) : document.getElementById(chapterName(id));
    if (section) section.scrollIntoView({ block: 'start', behavior: 'instant' });
    else scrollTo({ top: 0, behavior: 'instant' });
  }
}

function prepare() {
  if (loading) return loading;
  loading = import('./exhibition-scene.mjs').then(module => {
    stops = module.exhibitionStops;
    scene = module.createExhibitionScene(canvas);
    bands = stops.map(({ id }) => {
      const band = document.createElement('div');
      band.dataset.exhibitionStop = id;
      return band;
    });
    track.replaceChildren(...bands);
    return true;
  }).catch(() => {
    toggle.hidden = true;
    return false;
  });
  return loading;
}

function readingRequested() {
  return new URLSearchParams(location.search).get('view') === 'reading';
}

toggle.addEventListener('click', async () => {
  const id = readingChapter();
  const url = new URL(location.href);
  if (active) {
    url.searchParams.set('view', 'reading');
    if (id !== 'entrance' && id !== 'exit') url.hash = id;
    else url.hash = '';
    history.replaceState(history.state, '', url);
    setMode('reading', id);
  } else {
    toggle.disabled = true;
    const available = await prepare();
    toggle.disabled = false;
    if (!available || motionPreference.matches) return;
    url.searchParams.delete('view');
    history.replaceState(history.state, '', url);
    setMode('exhibition', id);
  }
});

document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!active || !link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const fragment = link.hash.slice(1);
  const id = fragment === 'main' ? 'entrance' : fragment;
  if (!exhibits.has(id)) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(history.state, '', link.hash);
  if (chapters.contains(link)) {
    chapters.open = false;
    chapters.querySelector('summary').focus({ preventScroll: true });
  }
  if (link.classList.contains('skip-link')) {
    const heading = exhibits.get(id).querySelector('h1');
    heading.tabIndex = -1;
    scrollToStop(id, true);
    heading.focus({ preventScroll: true });
  } else scrollToStop(id, true);
});
next.addEventListener('click', () => {
  const index = (Math.floor(progress) + 1) % stops.length;
  scrollToStop(stops[index].id, true);
});
chapters.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !chapters.open) return;
  chapters.open = false;
  chapters.querySelector('summary').focus({ preventScroll: true });
});
addEventListener('popstate', async () => {
  if (motionPreference.matches || readingRequested()) {
    if (active) setMode('reading', requestedChapter());
  } else if (active) {
    scrollToStop(requestedChapter(), true);
  } else if (await prepare()) {
    setMode('exhibition', requestedChapter());
    toggle.hidden = false;
  }
});
addEventListener('hashchange', () => {
  if (active) scrollToStop(requestedChapter(), true);
});
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', () => {
  if (!active) return;
  const position = scrollY / bandHeight;
  sizePanels();
  if (Math.abs(position * bandHeight - scrollY) > 1) {
    scrollTo({ top: position * bandHeight, behavior: 'instant' });
  }
  cancelAnimationFrame(frame);
  draw(performance.now(), true);
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) queue();
});
motionPreference.addEventListener('change', () => {
  if (!motionPreference.matches) {
    toggle.hidden = !scene && !readingRequested();
    return;
  }
  if (active) setMode('reading', readingChapter());
  toggle.hidden = true;
});
canvas.addEventListener('webglcontextlost', () => {
  if (active) setMode('reading', readingChapter());
  toggle.hidden = true;
});
canvas.addEventListener('webglcontextrestored', () => {
  if (!motionPreference.matches) toggle.hidden = false;
});

if (!motionPreference.matches) {
  if (readingRequested()) {
    root.dataset.vrMode = 'reading';
    toggle.textContent = 'Enter exhibition';
    toggle.hidden = false;
  } else if (await prepare()) {
    if (!motionPreference.matches) {
      setMode('exhibition', requestedChapter());
      toggle.hidden = false;
    }
  }
}
