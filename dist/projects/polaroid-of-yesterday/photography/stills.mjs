import { clamp, spiralMetrics, spiralPose, galleryLayout, interpolatePose } from './stills-layout.mjs?rev=20261103-proportions';

const figures = [...document.querySelectorAll('.print')];
// The semantic HTML is the collection source at runtime. No fetch or WebGL is
// needed to enter the exhibition, and the static gallery survives JS failure.
const photos = figures.map(figure => {
  const image = figure.querySelector('img');
  return { id: figure.id, title: figure.dataset.kind || figure.querySelector('.print-caption span')?.textContent,
    kind: figure.dataset.kind || figure.querySelector('.print-caption span:last-child')?.textContent,
    source: figure.querySelector('a').href, preview: image.currentSrc||image.src, view: figure.querySelector('a').dataset.viewSrc||image.src, alt: image.alt,
    width: Number(image.getAttribute('width')), height: Number(image.getAttribute('height')) };
});
const viewer = document.querySelector('.photo-viewer');
const viewerImage = viewer.querySelector('.viewer-image');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const stage = document.querySelector('.installation');
const exhibition = document.querySelector('.exhibition');
const embedded = Boolean(exhibition);
const referenceRatio = Number(exhibition?.dataset.referenceRatio) || 2 / 3;
const galleryHeader = document.querySelector('.gallery-header');
const viewerStage = viewer.querySelector('.viewer-stage');
const viewerLoading = viewer.querySelector('.viewer-loading');
const preparedImages = new Map();
let headerPlaceholder, displayedPhoto = null, loadingTimer;
const header = document.querySelector('.exhibition-header');
const intro = document.querySelector(embedded ? '.story-hero' : '.exhibition-intro');
const scrollOrigin = () => embedded ? exhibition.getBoundingClientRect().top + window.scrollY - document.querySelector('.gallery-header').offsetHeight : 0;
const currentScroll = () => Math.max(0, window.scrollY - scrollOrigin());
const scrollToPhoto = position => window.scrollTo({ top: scrollOrigin() + position, behavior: 'instant' });
const spacer = document.querySelector('.exhibition-space');
const switches = [...document.querySelectorAll('button[data-view]')];
const footer = document.querySelector('.exhibition-footer');
const count = document.querySelector('#current-photo');
let mode = ['gallery', 'index'].includes(new URL(location.href).searchParams.get('view')) ? 'gallery' : 'spiral';
let width = 0, height = 0, gallery, metrics, scroll = window.scrollY;
let poses = [], transition = null, frame = 0;
let selected = 0, returnFocus = null, scrollBeforeViewer = 0, imageGeneration = 0;
let dismissedFromPointer = false, pointerDown = false;
const pad = value => String(value).padStart(2, '0');

function updateViewport() {
  width = document.documentElement.clientWidth;
  const top = embedded ? document.querySelector('.gallery-header').offsetHeight + header.offsetHeight : 0;
  height = Math.max(120, window.innerHeight - top);
  if (embedded) {
    exhibition.style.setProperty('--exhibition-top', `${top}px`);
    exhibition.style.setProperty('--exhibition-height', `${height}px`);
  }
  metrics = spiralMetrics(width, height, photos.length);
  gallery = galleryLayout(width, height, photos, window.innerWidth, embedded ? {referenceRatio, captions: false, top: 24} : {});
  stage.style.perspective = `${metrics.perspective}px`;
  spacer.style.height = embedded
    ? `${mode === 'spiral' ? metrics.distance : Math.max(0, gallery.height - height)}px`
    : `${Math.max(height, (mode === 'spiral' ? metrics.distance + height : gallery.height) - intro.offsetHeight)}px`;
}

function poseAt(index, scrollPosition) {
  if (mode === 'spiral') {
    const pose = spiralPose(index, clamp(scrollPosition / metrics.distance), width, height, photos.length);
    if (embedded && photos[index].height > photos[index].width) pose.width *= referenceRatio * photos[index].width / photos[index].height;
    return pose;
  }
  return { ...gallery.items[index], y: gallery.items[index].y - scrollPosition - height / 2 };
}

function paint(pose, index) {
  const figure = figures[index];
  figure.style.width = `${pose.width.toFixed(3)}px`;
  figure.style.transform = `translate3d(${pose.x.toFixed(3)}px,${pose.y.toFixed(3)}px,${pose.z.toFixed(3)}px) rotateX(${pose.rx.toFixed(3)}deg) rotateY(${pose.ry.toFixed(3)}deg) rotateZ(${pose.rz.toFixed(3)}deg)`;
  const projection = metrics.perspective / (metrics.perspective - pose.z);
  const screenY = height / 2 + pose.y * projection;
  // Keep photographs at their original tone; depth comes from perspective.
  const visible = screenY > (embedded ? -100 : 40) && screenY < height + 100;
  figure.style.opacity = '1';
  figure.style.pointerEvents = visible ? 'auto' : 'none';
  figure.dataset.visible = String(visible);
  if (Math.abs(pose.y) < height * 1.2) figure.querySelector('img').loading = 'eager';
}

function render(time) {
  frame = 0;
  if (document.hidden || viewer.open) return;
  const rawScroll = currentScroll();
  scroll = rawScroll;
  if (!embedded) {
    stage.style.setProperty('--stage-top', `${Math.max(header.getBoundingClientRect().bottom + 8, intro.getBoundingClientRect().bottom + 24)}px`);
  }
  let amount = 1;
  if (transition) {
    amount = clamp((time - transition.start) / 240);
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
    schedule();
  }
  if (transition) schedule();
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
    ? 'Memory spiral. Select an image to view.' : 'Image index. Select an image to view.';
}
function switchMode(next) {
  if (mode === next) return;
  const anchor = currentScroll() < 10 ? 0 : nearestPhoto();
  const from = poses.map(pose => ({ ...pose }));
  const atStart = currentScroll() < 10;
  const previousScroll = window.scrollY;
  mode = next;
  reflectMode();
  updateViewport();
  scroll = atStart ? 0 : positionForPhoto(anchor);
  if (atStart) window.scrollTo({ top: previousScroll, behavior: 'instant' });
  else scrollToPhoto(scroll);
  const url = new URL(location.href);
  if (mode === 'gallery') url.searchParams.set('view', 'gallery'); else url.searchParams.delete('view');
  history.replaceState(null, '', url);
  transition = motionPreference.matches ? null : { from, start: performance.now() };
  document.body.dataset.transitioning = String(Boolean(transition));
  document.querySelector('#view-status').textContent = `${mode === 'spiral' ? 'Memory spiral' : 'Index'} view. ${photos.length} images.`;
  schedule();
}

function fitViewerImage(photo) {
  const style = getComputedStyle(viewerStage);
  const availableWidth = viewerStage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const availableHeight = viewerStage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const ratio = photo.width / photo.height;
  const fittedWidth = Math.max(1, Math.min(1120, availableWidth, availableHeight * ratio));
  viewerImage.style.width = `${fittedWidth}px`;
  viewerImage.style.height = `${fittedWidth / ratio}px`;
}
function prepareViewerImage(photo) {
  if (!preparedImages.has(photo.view)) {
    const image = new Image();
    image.decoding = 'async';
    image.src = photo.view;
    const ready = image.decode().then(() => image);
    preparedImages.set(photo.view, ready);
    ready.catch(() => { if (preparedImages.get(photo.view) === ready) preparedImages.delete(photo.view); });
  }
  return preparedImages.get(photo.view);
}
function setViewerPhoto(index) {
  selected = clamp(index, 0, photos.length - 1);
  const photo = photos[selected], generation = ++imageGeneration;
  const caption = () => {
    document.querySelector('#viewer-title').textContent = embedded ? photo.kind : photo.title;
    document.querySelector('#viewer-kind').textContent = photo.kind;
    document.querySelector('#viewer-counter').textContent = `${pad(selected + 1)} / ${pad(photos.length)}`;
    document.querySelector('#viewer-original').href = photo.source;
    document.querySelector('#error-original').href = photo.source;
  };
  if (!displayedPhoto) caption();
  viewer.querySelector('.viewer-error').hidden = true;
  document.querySelector('#previous-photo').disabled = selected === 0;
  document.querySelector('#next-photo').disabled = selected === photos.length - 1;
  clearTimeout(loadingTimer);
  if (viewerLoading) viewerLoading.hidden = true;
  viewerStage.setAttribute('aria-busy', 'true');
  loadingTimer = setTimeout(() => { if (viewerLoading && viewer.open && generation === imageGeneration) viewerLoading.hidden = false; }, 150);
  const neighbors = photos.slice(Math.max(0, selected - 1), selected + 2);
  const retained = new Set(neighbors.map(item => item.view));
  for (const key of preparedImages.keys()) if (!retained.has(key)) preparedImages.delete(key);
  // Decode the capped image before one atomic swap. Never show a smaller preview
  // first, or size the visible image from an asynchronously changing naturalWidth.
  prepareViewerImage(photo).then(image => {
    if (!viewer.open || generation !== imageGeneration) return;
    clearTimeout(loadingTimer);
    displayedPhoto = photo;
    viewerImage.alt = photo.alt;
    viewerImage.width = photo.width;
    viewerImage.height = photo.height;
    fitViewerImage(photo);
    viewerImage.src = image.src;
    viewerImage.hidden = false;
    caption();
    viewerStage.setAttribute('aria-busy', 'false');
    if (viewerLoading) viewerLoading.hidden = true;
  }, () => {
    if (!viewer.open || generation !== imageGeneration) return;
    clearTimeout(loadingTimer);
    viewerImage.hidden = true;
    viewer.querySelector('.viewer-error').hidden = false;
    caption();
    viewerStage.setAttribute('aria-busy', 'false');
    if (viewerLoading) viewerLoading.hidden = true;
  });
  neighbors.filter(item => item !== photo).forEach(item => prepareViewerImage(item).catch(() => {}));
}
function openViewer(index, trigger) {
  if (typeof viewer.showModal !== 'function') return false;
  returnFocus = trigger;
  scrollBeforeViewer = window.scrollY;
  transition = null;
  document.body.dataset.transitioning = 'false';
  if (galleryHeader && embedded) {
    headerPlaceholder = document.createElement('div');
    headerPlaceholder.setAttribute('aria-hidden', 'true');
    headerPlaceholder.style.height = `${galleryHeader.offsetHeight}px`;
    galleryHeader.before(headerPlaceholder);
    viewer.prepend(galleryHeader);
  }
  viewerImage.hidden = true;
  viewer.showModal();
  document.documentElement.style.overflow = 'hidden';
  setViewerPhoto(index);
  return true;
}
function closeViewer() { viewer.close(); }
// Move the real shared masthead into the modal's top layer so its links remain
// usable. Restore it before following a same-page anchor or another route.
galleryHeader?.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!viewer.open || !link || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const destination = link.href;
  viewer.addEventListener('close', () => location.assign(destination), {once: true});
  closeViewer();
});


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
    const rect = image.getBoundingClientRect(), bounds = stage.getBoundingClientRect();
    const top = embedded ? Math.max(bounds.top, parseFloat(exhibition.style.getPropertyValue('--exhibition-top'))) : 115;
    const bottom = embedded ? bounds.bottom - 60 : height - 85;
    if (rect.top < top || rect.bottom > bottom || rect.left < 10 || rect.right > width - 10) {
      scroll = positionForPhoto(index);
      scrollToPhoto(scroll);
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
  clearTimeout(loadingTimer);
  displayedPhoto = null;
  viewerImage.hidden = true;
  viewerStage.setAttribute('aria-busy', 'false');
  if (viewerLoading) viewerLoading.hidden = true;
  if (headerPlaceholder) { headerPlaceholder.replaceWith(galleryHeader); headerPlaceholder = null; }
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
  updateViewport();
  if (viewer.open && displayedPhoto) fitViewerImage(displayedPhoto);
  scroll = window.scrollY; schedule();
});
motionPreference.addEventListener('change', () => { transition = null; document.body.dataset.transitioning = 'false'; scroll = window.scrollY; schedule(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
  else { scroll = window.scrollY; schedule(); }
});
if (figures.length && CSS.supports('transform-style', 'preserve-3d')) {
  document.body.classList.add('is-ready');
  document.querySelector('.view-switch').hidden = false;
  footer.hidden = false;
  updateViewport(); reflectMode(); schedule();
  if (embedded && location.hash) {
    const index = figures.findIndex(figure => '#' + figure.id === location.hash);
    if (index >= 0) scrollToPhoto(positionForPhoto(index));
  }
}
