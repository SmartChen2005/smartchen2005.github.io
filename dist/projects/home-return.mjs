import { createPaperCurl, paperClipPath, PEEL_DURATION } from '../home-paper.mjs';

const PREVIEW_WAIT_MS = 600;
const home = new URL('../', import.meta.url);

function installHomeReturn(links) {
  const { body } = document;
  const effects = matchMedia('(prefers-reduced-motion: no-preference) and (forced-colors: none)');
  const source = [...body.querySelectorAll(':scope > :is(header, main, footer, .projects-skip)')];
  let preview, color, curl, link, restoreFocus;
  let frame = 0, timer = 0, navigating = false;
  let sourceInert = [];

  function prepare() {
    if (preview || !effects.matches) return;
    preview = document.createElement('iframe');
    preview.className = 'projects-home-preview';
    preview.title = 'Homepage preview';
    preview.tabIndex = -1;
    preview.inert = true;
    preview.setAttribute('aria-hidden', 'true');
    preview.addEventListener('load', async () => {
      const page = preview.contentDocument;
      if (!page?.querySelector('.homepage')) {
        navigate();
        return;
      }
      await page.fonts.ready;
      color = preview.contentWindow.getComputedStyle(page.documentElement).getPropertyValue('--paper').trim();
      if (!color) { navigate(); return; }
      if (link && !navigating) roll();
    }, { once: true });
    preview.src = home.href;
    body.append(preview);
  }

  function navigate() {
    if (!link || navigating) return;
    navigating = true;
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    location.assign(link.href);
  }

  function roll() {
    curl = createPaperCurl(innerWidth, innerHeight, color);
    if (!curl) { navigate(); return; }
    curl.canvas.className = 'projects-home-curl';
    preview.style.clipPath = paperClipPath(curl.paint(1));
    body.append(curl.canvas);
    body.style.setProperty('--projects-home-scrollbar', `${innerWidth - document.documentElement.clientWidth}px`);
    body.dataset.projectsHomeReturn = 'rolling';
    clearTimeout(timer);
    const started = performance.now();

    function tick(now) {
      const progress = (now - started) / (PEEL_DURATION * 1000);
      preview.style.clipPath = paperClipPath(curl.paint(1 - progress));
      frame = requestAnimationFrame(progress >= 1 ? navigate : tick);
    }

    frame = requestAnimationFrame(tick);
    timer = setTimeout(navigate, PEEL_DURATION * 1000 + 260);
  }

  function play(event) {
    const target = event.currentTarget;
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      target.hasAttribute('download') || (target.target && target.target !== '_self') || !effects.matches) return;
    event.preventDefault();
    if (link || body.dataset.photoTransition) return;

    link = target;
    restoreFocus = event.detail === 0 ? target : null;
    sourceInert = source.map(element => element.inert);
    for (const element of source) element.inert = true;
    if (color) { roll(); return; }
    timer = setTimeout(navigate, PREVIEW_WAIT_MS);
    prepare();
  }

  for (const homeLink of links) {
    homeLink.addEventListener('pointerenter', prepare);
    homeLink.addEventListener('focus', prepare);
    homeLink.addEventListener('click', play);
  }
  if (document.readyState === 'complete') prepare();
  else window.addEventListener('load', prepare, { once: true });

  window.addEventListener('resize', navigate);
  effects.addEventListener('change', () => { if (!effects.matches) navigate(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) navigate(); });
  window.addEventListener('pagehide', () => {
    if (!link) return;
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    curl?.canvas.remove();
    delete body.dataset.projectsHomeReturn;
    body.style.removeProperty('--projects-home-scrollbar');
    preview.style.removeProperty('clip-path');
    source.forEach((element, index) => { element.inert = sourceInert[index]; });
    curl = link = null;
    navigating = false;
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) restoreFocus?.focus({ preventScroll: true });
    restoreFocus = null;
  });
}

if (window.top === window) {
  const links = [...document.querySelectorAll('.project-header__nav a[href]')].filter(link => {
    const { origin, pathname } = new URL(link.href);
    return origin === home.origin && (pathname === home.pathname || pathname === `${home.pathname}index.html`);
  });
  if (links.length) installHomeReturn(links);
}
