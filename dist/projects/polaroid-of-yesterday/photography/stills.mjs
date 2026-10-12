import { clamp, spiralMetrics, spiralPose, galleryLayout, interpolatePose } from './stills-layout.mjs';

const figures = [...document.querySelectorAll('.print')];
// The semantic HTML is the collection source at runtime. No fetch or WebGL is
// needed to enter the exhibition, and the static gallery survives JS failure.
const photos = figures.map(figure => {
  const image = figure.querySelector('img');
  return { id: figure.id, title: figure.querySelector('figcaption span').textContent,
    kind: figure.querySelector('figcaption span:last-child').textContent,
    source: figure.querySelector('a').href, preview: image.src, alt: image.alt,
    width: Number(image.getAttribute('width')), height: Number(image.getAttribute('height')) };
});
const viewer = document.querySelector('.photo-viewer');
const viewerImage = viewer.querySelector('.viewer-image');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const stage = document.querySelector('.installation');
const spacer = document.querySelector('.exhibition-space');
const switches = [...document.querySelectorAll('button[data-view]')];
const footer = document.querySelector('.exhibition-footer');
const count = document.querySelector('#current-photo');
let mode = new URL(location.href).searchParams.get('view') === 'gallery' ? 'gallery' : 'spiral';
let width = 0, height = 0, gallery, metrics, scroll = window.scrollY;
let poses = [], transition = null, frame = 0, lastFrame = 0;
let selected = 0, returnFocus = null, scrollBeforeViewer = 0, imageGeneration = 0;
let viewerAnimation = null, dismissedFromPointer = false, pointerDown = false;
const pad = value => String(value).padStart(2, '0');

function updateViewport() {
  width = document.documentElement.clientWidth;
  height = window.innerHeight;
  metrics = spiralMetrics(width, height, photos.length);
  gallery = galleryLayout(width, height, photos);
  stage.style.perspective = `${metrics.perspective}px`;
  spacer.style.height = `${mode === 'spiral' ? metrics.distance + height : gallery.height}px`;
}

function poseAt(index, scrollPosition) {
  return mode === 'spiral'
    ? spiralPose(index, clamp(scrollPosition / metrics.distance), width, height, photos.length, motionPreference.matches)
    : { ...gallery.items[index], y: gallery.items[index].y - scrollPosition - height / 2 };
}

function paint(pose, index) {
  const figure = figures[index];
  figure.style.width = `${pose.width.toFixed(3)}px`;
  figure.style.transform = `translate3d(${pose.x.toFixed(3)}px,${pose.y.toFixed(3)}px,${pose.z.toFixed(3)}px) rotateX(${pose.rx.toFixed(3)}deg) rotateY(${pose.ry.toFixed(3)}deg) rotateZ(${pose.rz.toFixed(3)}deg)`;
  const projection = metrics.perspective / (metrics.perspective - pose.z);
  const screenY = height / 2 + pose.y * projection;
  // An empty white perimeter protects the quiet interface as prints pass it.
  const opacity = mode === 'gallery' && !transition ? 1 : clamp((screenY - 75) / 90) * clamp((height - 45 - screenY) / 85);
  figure.style.opacity = opacity.toFixed(3);
  figure.style.pointerEvents = opacity > .1 ? 'auto' : 'none';
  figure.dataset.visible = String(opacity > .1);
  if (Math.abs(pose.y) < height * 1.2) figure.querySelector('img').loading = 'eager';
}

function render(time) {
  frame = 0;
  if (document.hidden || viewer.open) return;
  const delta = Math.min(64, lastFrame ? time - lastFrame : 16.7);
  lastFrame = time;
  const rawScroll = window.scrollY;
  // Keep native wheel/touch/keyboard/scrollbar ownership. Only the camera settles.
  if (motionPreference.matches || mode === 'gallery' || transition) scroll = rawScroll;
  else scroll += (rawScroll - scroll) * (1 - Math.exp(-delta / 90));
  if (Math.abs(rawScroll - scroll) < .1) scroll = rawScroll;
  let amount = 1;
  if (transition) {
    amount = clamp((time - transition.start) / 1050);
    amount = 1 - (1 - amount) ** 4;
  }
  poses = photos.map((_, index) => {
    const target = poseAt(index, scroll);
    const pose = transition ? interpolatePose(transition.from[index], target, amount) : target;
    paint(pose, index);
    return pose;
  });
  const nearest = mode === 'spiral' ? Math.round(clamp(scroll / metrics.distance) * (photos.length - 1)) : nearestPhoto();
  count.textContent = pad(nearest + 1);
  if (transition && amount >= 1) {
    transition = null;
    document.body.dataset.transitioning = 'false';
    schedule(); // Paint settled gallery tones once after the depth transition.
  }
  if (transition || scroll !== rawScroll) schedule();
  else lastFrame = 0;
}
function schedule() { if (!frame && !document.hidden && !viewer.open) frame = requestAnimationFrame(render); }
function nearestPhoto() {
  let nearest = 0, distance = Infinity;
  poses.forEach((pose, index) => {
    const d = Math.abs(pose.y) + Math.abs(pose.x) * .16;
    if (d < distance) { distance = d; nearest = index; }
  });
  return nearest;
}
function positionForPhoto(index) {
  if (mode === 'gallery') return Math.max(0, gallery.items[index].y - height / 2);
  return clamp((index * metrics.step - metrics.start) / (metrics.end - metrics.start)) * metrics.distance;
}
function reflectMode() {
  document.body.dataset.view = mode;
  switches.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === mode)));
  document.querySelector('#view-hint').textContent = mode === 'spiral'
    ? 'Scroll through the memories. Select a photograph to pause.' : 'In-game screenshots & concept photography';
}
function switchMode(next) {
  if (mode === next) return;
  const anchor = window.scrollY < 10 ? 0 : nearestPhoto();
  const from = poses.map(pose => ({ ...pose }));
  const atStart = window.scrollY < 10;
  mode = next;
  reflectMode();
  updateViewport();
  scroll = atStart ? 0 : positionForPhoto(anchor);
  window.scrollTo({ top: scroll, behavior: 'instant' });
  const url = new URL(location.href);
  if (mode === 'gallery') url.searchParams.set('view', 'gallery'); else url.searchParams.delete('view');
  history.replaceState(null, '', url);
  transition = motionPreference.matches ? null : { from, start: performance.now() };
  document.body.dataset.transitioning = String(Boolean(transition));
  document.querySelector('#view-status').textContent = `${mode === 'spiral' ? 'Memory spiral' : 'Gallery'} view. ${photos.length} photographs.`;
  schedule();
}

function setViewerPhoto(index, entrance = null) {
  selected = clamp(index, 0, photos.length - 1);
  const photo = photos[selected], generation = ++imageGeneration;
  viewerAnimation?.cancel();
  viewerImage.hidden = false;
  viewerImage.alt = photo.alt;
  viewerImage.width = photo.width;
  viewerImage.height = photo.height;
  viewerImage.src = photo.preview;
  viewer.querySelector('.viewer-error').hidden = true;
  document.querySelector('#viewer-title').textContent = photo.title;
  document.querySelector('#viewer-kind').textContent = photo.kind;
  document.querySelector('#viewer-counter').textContent = `${pad(selected + 1)} / ${pad(photos.length)}`;
  document.querySelector('#viewer-original').href = photo.source;
  document.querySelector('#error-original').href = photo.source;
  document.querySelector('#previous-photo').disabled = selected === 0;
  document.querySelector('#next-photo').disabled = selected === photos.length - 1;
  if (!motionPreference.matches) {
    requestAnimationFrame(() => {
      if (generation !== imageGeneration || !viewer.open) return;
      const target = viewerImage.getBoundingClientRect();
      const initial = entrance ? {
        transform: `translate(${entrance.left + entrance.width / 2 - target.left - target.width / 2}px,${entrance.top + entrance.height / 2 - target.top - target.height / 2}px) scale(${entrance.width / target.width})`, opacity: .5
      } : { opacity: .2, transform: 'translateY(8px)' };
      viewerAnimation = viewerImage.animate([initial, { opacity: 1, transform: 'translate(0,0) scale(1)' }], { duration: entrance ? 650 : 240, easing: 'cubic-bezier(.2,.7,.2,1)' });
    });
  }
  // Upgrade after entry; only the current load may change the displayed image.
  const original = new Image();
  original.onload = () => { if (viewer.open && generation === imageGeneration) viewerImage.src = photo.source; };
  original.src = photo.source;
}
function openViewer(index, trigger) {
  if (typeof viewer.showModal !== 'function') return false;
  returnFocus = trigger;
  scrollBeforeViewer = window.scrollY;
  const entrance = trigger.querySelector('img').getBoundingClientRect();
  transition = null;
  document.body.dataset.transitioning = 'false';
  viewer.showModal();
  document.documentElement.style.overflow = 'hidden';
  setViewerPhoto(index, entrance);
  return true;
}
function closeViewer() { viewerAnimation?.cancel(); viewer.close(); }

figures.forEach((figure, index) => {
  const image = figure.querySelector('img'), link = figure.querySelector('a');
  figure.style.setProperty('--ratio', `${photos[index].width} / ${photos[index].height}`);
  const failed = () => { figure.querySelector('.print-error').hidden = false; };
  image.addEventListener('error', failed);
  if (image.complete && !image.naturalWidth) failed();
  image.addEventListener('load', () => { figure.querySelector('.print-error').hidden = true; });
  link.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (openViewer(index, link)) event.preventDefault();
  });
  link.addEventListener('focus', () => {
    if (viewer.open || transition || dismissedFromPointer || pointerDown) return;
    const rect = image.getBoundingClientRect();
    if (rect.top < 115 || rect.bottom > height - 85 || rect.left < 10 || rect.right > width - 10) {
      scroll = positionForPhoto(index);
      window.scrollTo({ top: scroll, behavior: 'instant' });
      schedule();
    }
  });
});
switches.forEach(button => button.addEventListener('click', () => switchMode(button.dataset.view)));
document.addEventListener('pointerdown', () => { pointerDown = true; }, { capture: true });
document.addEventListener('pointerup', () => { pointerDown = false; }, { capture: true });
document.addEventListener('pointercancel', () => { pointerDown = false; }, { capture: true });
window.addEventListener('blur', () => { pointerDown = false; });
viewer.querySelector('.viewer-close').addEventListener('click', closeViewer);
document.querySelector('#previous-photo').addEventListener('click', () => setViewerPhoto(selected - 1));
document.querySelector('#next-photo').addEventListener('click', () => setViewerPhoto(selected + 1));
document.querySelector('#retry-photo').addEventListener('click', () => setViewerPhoto(selected));
viewerImage.addEventListener('error', () => { viewerImage.hidden = true; viewer.querySelector('.viewer-error').hidden = false; });
viewerImage.addEventListener('load', () => { viewerImage.hidden = false; viewer.querySelector('.viewer-error').hidden = true; });
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' && selected > 0) { event.preventDefault(); setViewerPhoto(selected - 1); }
  if (event.key === 'ArrowRight' && selected < photos.length - 1) { event.preventDefault(); setViewerPhoto(selected + 1); }
});
let backdropDown = false;
viewer.addEventListener('pointerdown', event => { backdropDown = event.target === viewer || event.target.classList.contains('viewer-stage'); });
viewer.addEventListener('pointerup', event => {
  if (backdropDown && (event.target === viewer || event.target.classList.contains('viewer-stage'))) closeViewer();
  backdropDown = false;
});
viewer.addEventListener('pointercancel', () => { backdropDown = false; });
viewer.addEventListener('close', () => {
  ++imageGeneration;
  document.documentElement.style.overflow = '';
  window.scrollTo({ top: scrollBeforeViewer, behavior: 'instant' });
  dismissedFromPointer = true;
  returnFocus?.focus({ preventScroll: true });
  queueMicrotask(() => { dismissedFromPointer = false; });
  scroll = scrollBeforeViewer;
  schedule();
});
// Passive events only invalidate a sleeping renderer, never intercept scrolling.
document.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', () => {
  transition = null;
  document.body.dataset.transitioning = 'false';
  updateViewport(); scroll = window.scrollY; schedule();
});
motionPreference.addEventListener('change', () => { transition = null; document.body.dataset.transitioning = 'false'; scroll = window.scrollY; schedule(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; }
  else { scroll = window.scrollY; schedule(); }
});
if (figures.length && CSS.supports('transform-style', 'preserve-3d')) {
  document.body.classList.add('is-ready');
  document.querySelector('.view-switch').hidden = false;
  footer.hidden = false;
  updateViewport(); reflectMode(); schedule();
}
